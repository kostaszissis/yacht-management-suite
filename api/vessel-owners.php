<?php
/**
 * VESSEL OWNERS API - Owner Details Management
 * Handles: owner details CRUD, ID/passport file upload
 */

require_once __DIR__ . '/db_connect.php';

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    // Ensure vessel_owners table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS vessel_owners (
            id SERIAL PRIMARY KEY,
            vessel_name VARCHAR(200) UNIQUE NOT NULL,
            owner_first_name VARCHAR(200),
            owner_last_name VARCHAR(200),
            owner_email VARCHAR(200),
            company_email VARCHAR(200),
            company_name VARCHAR(200),
            vat_number VARCHAR(100),
            id_passport_number VARCHAR(100),
            id_passport_file TEXT,
            id_passport_file_name VARCHAR(200),
            tax_office VARCHAR(200),
            phone VARCHAR(100),
            street VARCHAR(200),
            street_number VARCHAR(50),
            city VARCHAR(200),
            postal_code VARCHAR(50),
            custom_fields JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Add new columns if they don't exist (for existing installations)
    $columnsToAdd = [
        'id_passport_number' => 'VARCHAR(100)',
        'id_passport_file' => 'TEXT',
        'id_passport_file_name' => 'VARCHAR(200)',
        'tax_office' => 'VARCHAR(200)'
    ];

    foreach ($columnsToAdd as $col => $type) {
        try {
            $pdo->exec("ALTER TABLE vessel_owners ADD COLUMN IF NOT EXISTS $col $type");
        } catch (Exception $e) {
            // Column may already exist, ignore
        }
    }

    switch ($method) {
        case 'GET':
            $vesselName = $_GET['vessel_name'] ?? null;

            if ($vesselName) {
                $stmt = $pdo->prepare("SELECT * FROM vessel_owners WHERE vessel_name = :vessel_name");
                $stmt->execute(['vessel_name' => $vesselName]);
                $data = $stmt->fetch();

                if ($data) {
                    successResponse($data);
                } else {
                    successResponse(null, 'No owner data found for this vessel');
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM vessel_owners ORDER BY vessel_name ASC");
                $owners = $stmt->fetchAll();
                successResponse(['owners' => $owners, 'count' => count($owners)]);
            }
            break;

        case 'POST':
            // Handle file upload action
            if ($action === 'upload_id_file') {
                $input = getJsonInput();
                $vesselName = $input['vessel_name'] ?? null;
                $fileName = $input['file_name'] ?? null;
                $fileData = $input['file_data'] ?? null;

                if (!$vesselName || !$fileData) {
                    errorResponse('vessel_name and file_data are required', 400);
                }

                // Save file data to the database (base64 data URL)
                $stmt = $pdo->prepare("
                    UPDATE vessel_owners
                    SET id_passport_file = :file_data,
                        id_passport_file_name = :file_name,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE vessel_name = :vessel_name
                ");
                $stmt->execute([
                    'file_data' => $fileData,
                    'file_name' => $fileName,
                    'vessel_name' => $vesselName
                ]);

                if ($stmt->rowCount() === 0) {
                    // Owner record doesn't exist yet, create it
                    $stmt = $pdo->prepare("
                        INSERT INTO vessel_owners (vessel_name, id_passport_file, id_passport_file_name)
                        VALUES (:vessel_name, :file_data, :file_name)
                    ");
                    $stmt->execute([
                        'vessel_name' => $vesselName,
                        'file_data' => $fileData,
                        'file_name' => $fileName
                    ]);
                }

                successResponse([
                    'file_path' => $fileData,
                    'file_name' => $fileName
                ], 'File uploaded successfully');
                break;
            }

            // Regular save/update owner details
            $input = getJsonInput();
            $vesselName = $input['vessel_name'] ?? null;

            if (!$vesselName) {
                errorResponse('vessel_name is required', 400);
            }

            // Check if owner record exists
            $checkStmt = $pdo->prepare("SELECT id FROM vessel_owners WHERE vessel_name = :vessel_name");
            $checkStmt->execute(['vessel_name' => $vesselName]);
            $exists = $checkStmt->fetch();

            if ($exists) {
                // Update existing record - build SET clause
                $setClauses = [
                    'owner_first_name = :owner_first_name',
                    'owner_last_name = :owner_last_name',
                    'owner_email = :owner_email',
                    'company_email = :company_email',
                    'company_name = :company_name',
                    'vat_number = :vat_number',
                    'id_passport_number = :id_passport_number',
                    'tax_office = :tax_office',
                    'phone = :phone',
                    'street = :street',
                    'street_number = :street_number',
                    'city = :city',
                    'postal_code = :postal_code',
                    'custom_fields = :custom_fields',
                    'updated_at = CURRENT_TIMESTAMP'
                ];

                $params = [
                    'vessel_name' => $vesselName,
                    'owner_first_name' => $input['owner_first_name'] ?? '',
                    'owner_last_name' => $input['owner_last_name'] ?? '',
                    'owner_email' => $input['owner_email'] ?? '',
                    'company_email' => $input['company_email'] ?? '',
                    'company_name' => $input['company_name'] ?? '',
                    'vat_number' => $input['vat_number'] ?? '',
                    'id_passport_number' => $input['id_passport_number'] ?? '',
                    'tax_office' => $input['tax_office'] ?? '',
                    'phone' => $input['phone'] ?? '',
                    'street' => $input['street'] ?? '',
                    'street_number' => $input['street_number'] ?? '',
                    'city' => $input['city'] ?? '',
                    'postal_code' => $input['postal_code'] ?? '',
                    'custom_fields' => $input['custom_fields'] ?? null
                ];

                // Include file fields in update if provided
                if (isset($input['id_passport_file']) && $input['id_passport_file']) {
                    $setClauses[] = 'id_passport_file = :id_passport_file';
                    $setClauses[] = 'id_passport_file_name = :id_passport_file_name';
                    $params['id_passport_file'] = $input['id_passport_file'];
                    $params['id_passport_file_name'] = $input['id_passport_file_name'] ?? null;
                } else if (array_key_exists('id_passport_file', $input) && $input['id_passport_file'] === null) {
                    $setClauses[] = 'id_passport_file = NULL';
                    $setClauses[] = 'id_passport_file_name = NULL';
                }

                $sql = "UPDATE vessel_owners SET " . implode(', ', $setClauses) . " WHERE vessel_name = :vessel_name";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            } else {
                // Insert new record
                $stmt = $pdo->prepare("
                    INSERT INTO vessel_owners (
                        vessel_name, owner_first_name, owner_last_name, owner_email,
                        company_email, company_name, vat_number,
                        id_passport_number, id_passport_file, id_passport_file_name, tax_office,
                        phone, street, street_number, city, postal_code, custom_fields
                    ) VALUES (
                        :vessel_name, :owner_first_name, :owner_last_name, :owner_email,
                        :company_email, :company_name, :vat_number,
                        :id_passport_number, :id_passport_file, :id_passport_file_name, :tax_office,
                        :phone, :street, :street_number, :city, :postal_code, :custom_fields
                    )
                ");
                $stmt->execute([
                    'vessel_name' => $vesselName,
                    'owner_first_name' => $input['owner_first_name'] ?? '',
                    'owner_last_name' => $input['owner_last_name'] ?? '',
                    'owner_email' => $input['owner_email'] ?? '',
                    'company_email' => $input['company_email'] ?? '',
                    'company_name' => $input['company_name'] ?? '',
                    'vat_number' => $input['vat_number'] ?? '',
                    'id_passport_number' => $input['id_passport_number'] ?? '',
                    'id_passport_file' => $input['id_passport_file'] ?? null,
                    'id_passport_file_name' => $input['id_passport_file_name'] ?? null,
                    'tax_office' => $input['tax_office'] ?? '',
                    'phone' => $input['phone'] ?? '',
                    'street' => $input['street'] ?? '',
                    'street_number' => $input['street_number'] ?? '',
                    'city' => $input['city'] ?? '',
                    'postal_code' => $input['postal_code'] ?? '',
                    'custom_fields' => $input['custom_fields'] ?? null
                ]);
            }

            successResponse([
                'vessel_name' => $vesselName
            ], 'Owner details saved successfully');
            break;

        case 'DELETE':
            $vesselName = $_GET['vessel_name'] ?? null;
            if (!$vesselName) {
                errorResponse('vessel_name is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM vessel_owners WHERE vessel_name = :vessel_name");
            $stmt->execute(['vessel_name' => $vesselName]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Owner details deleted successfully');
            } else {
                errorResponse('Owner not found', 404);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }

} catch (PDOException $e) {
    errorResponse('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
?>
