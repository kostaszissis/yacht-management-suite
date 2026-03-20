<?php
// TODO: copy from production server
// DELETE case should be:
//
// case 'DELETE':
//     $id = $_GET['id'] ?? '';
//     if ($id) {
//         $stmt = $pdo->prepare("DELETE FROM vessel_documents WHERE id = ?");
//         $stmt->execute([$id]);
//         echo json_encode(['success' => true, 'message' => 'Deleted']);
//     } else {
//         echo json_encode(['success' => false, 'message' => 'No id provided']);
//     }
//     break;
