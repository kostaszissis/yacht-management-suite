<?php
/**
 * INVOICES API - Τιμολόγια/Έξοδα (Invoices/Expenses)
 * Handles: invoice and expense management per vessel
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create invoices table if it doesn't exist
function ensureInvoicesTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        vessel_id INTEGER NOT NULL,
        vessel_name VARCHAR(255),
        invoice_code VARCHAR(100) UNIQUE,
        invoice_number VARCHAR(100),
        invoice_type VARCHAR(50) DEFAULT 'expense',
        category VARCHAR(100),
        description TEXT,
        vendor VARCHAR(255),
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        vat_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'EUR',
        invoice_date DATE,
        due_date DATE,
        paid_date DATE,
        payment_status VARCHAR(30) DEFAULT 'pending',
        payment_method VARCHAR(50),
        reference_number VARCHAR(100),
        charter_code VARCHAR(100),
        notes TEXT,
        attachments TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_invoices_vessel_id ON invoices(vessel_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_invoices_charter_code ON invoices(charter_code)");
}

try {
    $pdo = getDbConnection();
    ensureInvoicesTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    // Get invoice_code from various sources
    $invoiceCode = $_GET['invoice_code'] ?? $_GET['code'] ?? $_GET['id'] ?? null;
    if (!$invoiceCode && isset($_SERVER['PATH_INFO'])) {
        $invoiceCode = urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }
    if (!$invoiceCode && $input) {
        $invoiceCode = $input['invoiceCode'] ?? $input['invoice_code'] ?? $input['code'] ?? $input['id'] ?? null;
    }

    switch ($method) {
        case 'GET':
            // If invoice_code provided, get single invoice
            if ($invoiceCode) {
                $stmt = $pdo->prepare("SELECT * FROM invoices WHERE invoice_code = :code OR id::text = :code");
                $stmt->execute(['code' => $invoiceCode]);
                $data = $stmt->fetch();

                if ($data) {
                    $result = convertKeysToCamel($data);
                    $result['attachments'] = json_decode($data['attachments'], true) ?? [];
                    successResponse(['invoice' => $result]);
                } else {
                    successResponse([
                        'invoice' => null,
                        'message' => 'No invoice found with this code'
                    ]);
                }
            } else {
                // Get all invoices with optional filters
                $vesselId = $_GET['vessel_id'] ?? $_GET['vesselId'] ?? null;
                $invoiceType = $_GET['invoice_type'] ?? $_GET['invoiceType'] ?? $_GET['type'] ?? null;
                $category = $_GET['category'] ?? null;
                $paymentStatus = $_GET['payment_status'] ?? $_GET['paymentStatus'] ?? null;
                $charterCode = $_GET['charter_code'] ?? $_GET['charterCode'] ?? null;
                $startDate = $_GET['start_date'] ?? $_GET['startDate'] ?? null;
                $endDate = $_GET['end_date'] ?? $_GET['endDate'] ?? null;

                $sql = "SELECT * FROM invoices WHERE 1=1";
                $params = [];

                if ($vesselId) {
                    $sql .= " AND vessel_id = :vessel_id";
                    $params['vessel_id'] = $vesselId;
                }
                if ($invoiceType) {
                    $sql .= " AND invoice_type = :invoice_type";
                    $params['invoice_type'] = $invoiceType;
                }
                if ($category) {
                    $sql .= " AND category = :category";
                    $params['category'] = $category;
                }
                if ($paymentStatus) {
                    $sql .= " AND payment_status = :payment_status";
                    $params['payment_status'] = $paymentStatus;
                }
                if ($charterCode) {
                    $sql .= " AND charter_code = :charter_code";
                    $params['charter_code'] = $charterCode;
                }
                if ($startDate) {
                    $sql .= " AND invoice_date >= :start_date";
                    $params['start_date'] = $startDate;
                }
                if ($endDate) {
                    $sql .= " AND invoice_date <= :end_date";
                    $params['end_date'] = $endDate;
                }

                $sql .= " ORDER BY created_at DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $invoices = $stmt->fetchAll();

                // Convert to camelCase and parse JSON
                $invoiceList = array_map(function($invoice) {
                    $result = convertKeysToCamel($invoice);
                    $result['attachments'] = json_decode($invoice['attachments'], true) ?? [];
                    return $result;
                }, $invoices);

                // Calculate totals
                $totalAmount = array_sum(array_column($invoices, 'total_amount'));
                $totalPending = array_sum(array_map(function($inv) {
                    return $inv['payment_status'] === 'pending' ? $inv['total_amount'] : 0;
                }, $invoices));
                $totalPaid = array_sum(array_map(function($inv) {
                    return $inv['payment_status'] === 'paid' ? $inv['total_amount'] : 0;
                }, $invoices));

                successResponse([
                    'invoices' => $invoiceList,
                    'count' => count($invoiceList),
                    'totals' => [
                        'total' => floatval($totalAmount),
                        'pending' => floatval($totalPending),
                        'paid' => floatval($totalPaid)
                    ]
                ]);
            }
            break;

        case 'POST':
            if (!$invoiceCode) {
                // Generate invoice code if not provided
                $invoiceCode = 'INV-' . date('Ymd') . '-' . bin2hex(random_bytes(4));
            }

            // Check if invoice already exists
            $checkStmt = $pdo->prepare("SELECT id FROM invoices WHERE invoice_code = :code");
            $checkStmt->execute(['code' => $invoiceCode]);

            if ($checkStmt->fetch()) {
                errorResponse('Invoice already exists. Use PUT to update.', 409);
            }

            // Calculate total if not provided
            $amount = floatval($input['amount'] ?? 0);
            $vatAmount = floatval($input['vatAmount'] ?? $input['vat_amount'] ?? 0);
            $totalAmount = floatval($input['totalAmount'] ?? $input['total_amount'] ?? ($amount + $vatAmount));

            // Insert new invoice
            $stmt = $pdo->prepare("
                INSERT INTO invoices (
                    invoice_code, vessel_id, vessel_name,
                    invoice_number, invoice_type, category, description,
                    vendor, amount, vat_amount, total_amount, currency,
                    invoice_date, due_date, paid_date, payment_status, payment_method,
                    reference_number, charter_code, notes, attachments, created_by
                ) VALUES (
                    :invoice_code, :vessel_id, :vessel_name,
                    :invoice_number, :invoice_type, :category, :description,
                    :vendor, :amount, :vat_amount, :total_amount, :currency,
                    :invoice_date, :due_date, :paid_date, :payment_status, :payment_method,
                    :reference_number, :charter_code, :notes, :attachments, :created_by
                )
            ");

            $stmt->execute([
                'invoice_code' => $invoiceCode,
                'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'invoice_number' => $input['invoiceNumber'] ?? $input['invoice_number'] ?? null,
                'invoice_type' => $input['invoiceType'] ?? $input['invoice_type'] ?? 'expense',
                'category' => $input['category'] ?? null,
                'description' => $input['description'] ?? null,
                'vendor' => $input['vendor'] ?? null,
                'amount' => $amount,
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount,
                'currency' => $input['currency'] ?? 'EUR',
                'invoice_date' => $input['invoiceDate'] ?? $input['invoice_date'] ?? date('Y-m-d'),
                'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                'paid_date' => $input['paidDate'] ?? $input['paid_date'] ?? null,
                'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? 'pending',
                'payment_method' => $input['paymentMethod'] ?? $input['payment_method'] ?? null,
                'reference_number' => $input['referenceNumber'] ?? $input['reference_number'] ?? null,
                'charter_code' => $input['charterCode'] ?? $input['charter_code'] ?? null,
                'notes' => $input['notes'] ?? null,
                'attachments' => json_encode($input['attachments'] ?? []),
                'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null
            ]);

            successResponse([
                'invoice_code' => $invoiceCode,
                'id' => $pdo->lastInsertId()
            ], 'Invoice created successfully');
            break;

        case 'PUT':
            if (!$invoiceCode) {
                $invoiceCode = $input['invoiceCode'] ?? $input['invoice_code'] ?? $input['code'] ?? $input['id'] ?? null;
            }

            if (!$invoiceCode) {
                errorResponse('invoice_code is required', 400);
            }

            // Check if invoice exists
            $checkStmt = $pdo->prepare("SELECT id FROM invoices WHERE invoice_code = :code OR id::text = :code");
            $checkStmt->execute(['code' => $invoiceCode]);

            // Calculate total if amounts provided
            $amount = isset($input['amount']) ? floatval($input['amount']) : null;
            $vatAmount = isset($input['vatAmount']) || isset($input['vat_amount'])
                ? floatval($input['vatAmount'] ?? $input['vat_amount']) : null;
            $totalAmount = isset($input['totalAmount']) || isset($input['total_amount'])
                ? floatval($input['totalAmount'] ?? $input['total_amount'])
                : ($amount !== null && $vatAmount !== null ? $amount + $vatAmount : null);

            if (!$checkStmt->fetch()) {
                // Create new invoice if doesn't exist (upsert behavior)
                $newCode = is_numeric($invoiceCode) ? 'INV-' . date('Ymd') . '-' . bin2hex(random_bytes(4)) : $invoiceCode;

                $stmt = $pdo->prepare("
                    INSERT INTO invoices (
                        invoice_code, vessel_id, vessel_name,
                        invoice_number, invoice_type, category, description,
                        vendor, amount, vat_amount, total_amount, currency,
                        invoice_date, due_date, paid_date, payment_status, payment_method,
                        reference_number, charter_code, notes, attachments, created_by
                    ) VALUES (
                        :invoice_code, :vessel_id, :vessel_name,
                        :invoice_number, :invoice_type, :category, :description,
                        :vendor, :amount, :vat_amount, :total_amount, :currency,
                        :invoice_date, :due_date, :paid_date, :payment_status, :payment_method,
                        :reference_number, :charter_code, :notes, :attachments, :created_by
                    )
                ");

                $stmt->execute([
                    'invoice_code' => $newCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'invoice_number' => $input['invoiceNumber'] ?? $input['invoice_number'] ?? null,
                    'invoice_type' => $input['invoiceType'] ?? $input['invoice_type'] ?? 'expense',
                    'category' => $input['category'] ?? null,
                    'description' => $input['description'] ?? null,
                    'vendor' => $input['vendor'] ?? null,
                    'amount' => $amount ?? 0,
                    'vat_amount' => $vatAmount ?? 0,
                    'total_amount' => $totalAmount ?? 0,
                    'currency' => $input['currency'] ?? 'EUR',
                    'invoice_date' => $input['invoiceDate'] ?? $input['invoice_date'] ?? date('Y-m-d'),
                    'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                    'paid_date' => $input['paidDate'] ?? $input['paid_date'] ?? null,
                    'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? 'pending',
                    'payment_method' => $input['paymentMethod'] ?? $input['payment_method'] ?? null,
                    'reference_number' => $input['referenceNumber'] ?? $input['reference_number'] ?? null,
                    'charter_code' => $input['charterCode'] ?? $input['charter_code'] ?? null,
                    'notes' => $input['notes'] ?? null,
                    'attachments' => json_encode($input['attachments'] ?? []),
                    'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null
                ]);

                successResponse(['invoice_code' => $newCode], 'Invoice created successfully');
            } else {
                // Update existing invoice
                $stmt = $pdo->prepare("
                    UPDATE invoices SET
                        vessel_id = COALESCE(:vessel_id, vessel_id),
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        invoice_number = COALESCE(:invoice_number, invoice_number),
                        invoice_type = COALESCE(:invoice_type, invoice_type),
                        category = COALESCE(:category, category),
                        description = COALESCE(:description, description),
                        vendor = COALESCE(:vendor, vendor),
                        amount = COALESCE(:amount, amount),
                        vat_amount = COALESCE(:vat_amount, vat_amount),
                        total_amount = COALESCE(:total_amount, total_amount),
                        currency = COALESCE(:currency, currency),
                        invoice_date = COALESCE(:invoice_date, invoice_date),
                        due_date = COALESCE(:due_date, due_date),
                        paid_date = COALESCE(:paid_date, paid_date),
                        payment_status = COALESCE(:payment_status, payment_status),
                        payment_method = COALESCE(:payment_method, payment_method),
                        reference_number = COALESCE(:reference_number, reference_number),
                        charter_code = COALESCE(:charter_code, charter_code),
                        notes = COALESCE(:notes, notes),
                        attachments = COALESCE(:attachments, attachments),
                        updated_at = NOW()
                    WHERE invoice_code = :invoice_code OR id::text = :invoice_code
                ");

                $stmt->execute([
                    'invoice_code' => $invoiceCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'invoice_number' => $input['invoiceNumber'] ?? $input['invoice_number'] ?? null,
                    'invoice_type' => $input['invoiceType'] ?? $input['invoice_type'] ?? null,
                    'category' => $input['category'] ?? null,
                    'description' => $input['description'] ?? null,
                    'vendor' => $input['vendor'] ?? null,
                    'amount' => $amount,
                    'vat_amount' => $vatAmount,
                    'total_amount' => $totalAmount,
                    'currency' => $input['currency'] ?? null,
                    'invoice_date' => $input['invoiceDate'] ?? $input['invoice_date'] ?? null,
                    'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                    'paid_date' => $input['paidDate'] ?? $input['paid_date'] ?? null,
                    'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? null,
                    'payment_method' => $input['paymentMethod'] ?? $input['payment_method'] ?? null,
                    'reference_number' => $input['referenceNumber'] ?? $input['reference_number'] ?? null,
                    'charter_code' => $input['charterCode'] ?? $input['charter_code'] ?? null,
                    'notes' => $input['notes'] ?? null,
                    'attachments' => isset($input['attachments']) ? json_encode($input['attachments']) : null
                ]);

                successResponse(['invoice_code' => $invoiceCode], 'Invoice updated successfully');
            }
            break;

        case 'DELETE':
            if (!$invoiceCode) {
                errorResponse('invoice_code is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM invoices WHERE invoice_code = :code OR id::text = :code");
            $stmt->execute(['code' => $invoiceCode]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Invoice deleted successfully');
            } else {
                errorResponse('Invoice not found', 404);
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
