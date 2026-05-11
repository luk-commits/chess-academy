<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

$di = new Phalcon\Di\Di();

$di->setShared('db', function () {
    return new Phalcon\Db\Adapter\Pdo\Postgresql([
        'host' => 'db',
        'port' => 5432,
        'username' => 'chess',
        'password' => 'chess_secret',
        'dbname' => 'chess_academy',
        'schema' => 'public',
    ]);
});

$di->setShared('modelsManager', function () {
    return new Phalcon\Mvc\Model\Manager();
});

$di->setShared('modelsMetadata', function () {
    return new Phalcon\Mvc\Model\MetaData\Memory();
});

Phalcon\Di\Di::setDefault($di);
