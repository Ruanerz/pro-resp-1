<?php
require_once __DIR__.'/../session.php';
header('Content-Type: application/json');

$user = require_session();

echo json_encode([
    'id' => $user['id'],
    'email' => $user['email'],
    'name' => $user['name'],
    'avatar' => $user['avatar'],
    'provider' => $user['oauth_provider']
]);
?>
