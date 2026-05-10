<?php

declare(strict_types=1);

use ChessAcademy\Middleware\CorsMiddleware;
use ChessAcademy\Middleware\JwtMiddleware;
use ChessAcademy\Services\JwtService;
use Phalcon\Config\Config;
use Phalcon\Db\Adapter\Pdo\Postgresql;
use Phalcon\Events\Manager as EventsManager;
use Phalcon\Mvc\Dispatcher;
use Phalcon\Mvc\View\Simple as SimpleView;

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

$container->setShared('view', function (): SimpleView {
    return new SimpleView();
});

$container->setShared('jwtService', function () use ($container): JwtService {
    return new JwtService($container->getShared('config')->jwt);
});

$container->setShared('eventsManager', function () use ($container): EventsManager {
    $manager = new EventsManager();
    $config = $container->getShared('config');

    $manager->attach('application:beforeHandleRequest', new CorsMiddleware($config->app->corsOrigin));
    $manager->attach('dispatch:beforeExecuteRoute', new JwtMiddleware(
        $container->getShared('jwtService'),
        $config->jwt->cookieName,
    ));

    return $manager;
});

$container->setShared('dispatcher', function () use ($container): Dispatcher {
    $dispatcher = new Dispatcher();
    $dispatcher->setDefaultNamespace('ChessAcademy\\Controllers');
    $dispatcher->setEventsManager($container->getShared('eventsManager'));

    return $dispatcher;
});
