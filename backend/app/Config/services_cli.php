<?php

declare(strict_types=1);

use Phalcon\Cli\Dispatcher;
use Phalcon\Config\Config;
use Phalcon\Db\Adapter\Pdo\Postgresql;

$container->setShared('config', function (): Config {
    return new Config(require APP_PATH . '/Config/config.php');
});

$container->setShared('db', function () use ($container): Postgresql {
    $config = $container->getShared('config')->database;

    return new Postgresql([
        'host' => $config->host,
        'port' => $config->port,
        'username' => $config->username,
        'password' => $config->password,
        'dbname' => $config->dbname,
        'schema' => $config->schema,
    ]);
});

$container->setShared('dispatcher', function (): Dispatcher {
    $dispatcher = new Dispatcher();
    $dispatcher->setDefaultNamespace('ChessAcademy\\Tasks');
    return $dispatcher;
});
