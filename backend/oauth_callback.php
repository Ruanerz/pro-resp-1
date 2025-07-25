<?php
require_once __DIR__.'/config.php';
session_start();
header('Content-Type: text/html');

if (empty($_GET['state']) || $_GET['state'] !== ($_SESSION['oauth_state'] ?? '')) {
    http_response_code(400);
    echo 'Invalid state';
    exit;
}

$provider = $_SESSION['oauth_provider'] ?? '';
$code = $_GET['code'] ?? '';
$redirect = getenv('OAUTH_REDIRECT_URI') ?: 'http://localhost/backend/oauth_callback.php';

function post($url, $params) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    $resp = curl_exec($ch);
    curl_close($ch);
    return json_decode($resp, true);
}

function get_json($url, $token) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer '.$token]);
    $resp = curl_exec($ch);
    curl_close($ch);
    return json_decode($resp, true);
}

switch ($provider) {
    case 'google':
        $token = post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => getenv('GOOGLE_CLIENT_ID'),
            'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
            'redirect_uri' => $redirect,
            'grant_type' => 'authorization_code'
        ]);
        $info = get_json('https://www.googleapis.com/oauth2/v2/userinfo', $token['access_token']);
        $oauth_id = $info['id'] ?? null;
        $email = $info['email'] ?? null;
        $name = $info['name'] ?? null;
        $avatar = $info['picture'] ?? null;
        break;
    case 'discord':
        $token = post('https://discord.com/api/oauth2/token', [
            'code' => $code,
            'client_id' => getenv('DISCORD_CLIENT_ID'),
            'client_secret' => getenv('DISCORD_CLIENT_SECRET'),
            'redirect_uri' => $redirect,
            'grant_type' => 'authorization_code'
        ]);
        $info = get_json('https://discord.com/api/users/@me', $token['access_token']);
        $oauth_id = $info['id'] ?? null;
        $email = $info['email'] ?? null;
        $name = $info['username'] ?? null;
        $avatar = isset($info['avatar']) ? 'https://cdn.discordapp.com/avatars/'.$info['id'].'/'.$info['avatar'].'.png' : null;
        break;
    default:
        http_response_code(400);
        echo 'Unknown provider';
        exit;
}

if (!$oauth_id) {
    http_response_code(400);
    echo 'Invalid OAuth response';
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE oauth_provider=? AND oauth_id=?');
$stmt->execute([$provider, $oauth_id]);
$user_id = $stmt->fetchColumn();
if ($user_id) {
    $stmt = $pdo->prepare('UPDATE users SET email=?, name=?, avatar=? WHERE id=?');
    $stmt->execute([$email, $name, $avatar, $user_id]);
} else {
    $stmt = $pdo->prepare('INSERT INTO users (oauth_provider, oauth_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$provider, $oauth_id, $email, $name, $avatar]);
    $user_id = $pdo->lastInsertId();
}

$session_id = bin2hex(random_bytes(32));
$stmt = $pdo->prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)');
$stmt->execute([$session_id, $user_id]);
setcookie('session_id', $session_id, time()+86400*30, '/', '', false, true);

header('Location: /cuenta');
?>
