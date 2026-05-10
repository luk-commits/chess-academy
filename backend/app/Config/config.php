<?php

declare(strict_types=1);

return [
    'app' => [
        'env' => getenv('APP_ENV') ?: 'production',
        'corsOrigin' => getenv('CORS_ORIGIN') ?: 'http://localhost:5173',
    ],
    'database' => [
        'host' => getenv('DB_HOST') ?: 'db',
        'port' => (int) (getenv('DB_PORT') ?: 5432),
        'dbname' => getenv('DB_NAME') ?: 'chess_academy',
        'username' => getenv('DB_USER') ?: 'chess',
        'password' => getenv('DB_PASS') ?: 'chess_secret',
        'schema' => 'public',
    ],
    'jwt' => [
        'secret' => getenv('JWT_SECRET') ?: 'change_me',
        'algorithm' => 'HS256',
        'ttl' => (int) (getenv('JWT_TTL') ?: 3600),
        'issuer' => 'chess-academy',
        'cookieName' => 'chess_session',
        'refreshTtl' => (int) (getenv('JWT_REFRESH_TTL') ?: 2592000),
        'refreshCookieName' => 'chess_refresh',
    ],
];
