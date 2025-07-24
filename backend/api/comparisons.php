<?php
require_once __DIR__.'/../session.php';
header('Content-Type: application/json');

$user = require_session();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT id, item_left, item_right FROM comparisons WHERE user_id=?');
    $stmt->execute([$user['id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $left = $data['item_left'] ?? null;
    $right = $data['item_right'] ?? null;
    if (!$left || !$right) {
        http_response_code(400);
        echo json_encode(['error' => 'item_left and item_right required']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO comparisons (user_id, item_left, item_right) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], $left, $right]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required']);
        exit;
    }
    $stmt = $pdo->prepare('DELETE FROM comparisons WHERE user_id=? AND id=?');
    $stmt->execute([$user['id'], $id]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
}
?>
