<?php
session_start();
$provider = $_GET['provider'] ?? '';
$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;
$_SESSION['oauth_provider'] = $provider;
$redirect = getenv('OAUTH_REDIRECT_URI') ?: 'http://localhost/backend/oauth_callback.php';

switch ($provider) {
    case 'google':
        $params = [
            'client_id' => getenv('GOOGLE_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'profile email',
            'state' => $state
        ];
        $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query($params);
        header('Location: '.$url);
        exit;
    case 'discord':
        $params = [
            'client_id' => getenv('DISCORD_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'identify email',
            'state' => $state
        ];
        $url = 'https://discord.com/api/oauth2/authorize?'.http_build_query($params);
        header('Location: '.$url);
        exit;
    default:
        http_response_code(400);
        echo 'Unknown provider';
}
?>
