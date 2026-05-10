<?php

declare(strict_types=1);

return [
    'database' => [
        'adapter' => 'Postgresql',
        'host' => getenv('DB_HOST') ?: 'db',
        'port' => (int) (getenv('DB_PORT') ?: 5432),
        'dbname' => getenv('DB_NAME') ?: 'chess_academy',
        'username' => getenv('DB_USER') ?: 'chess',
        'password' => getenv('DB_PASS') ?: 'chess_secret',
        'schema' => 'public',
    ],
];
