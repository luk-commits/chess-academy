<?php

declare(strict_types=1);

use Phalcon\Mvc\Router;

$container->setShared('router', function (): Router {
    $router = new Router(false);
    $router->removeExtraSlashes(true);

    $router->addPost('/api/register', [
        'controller' => 'auth',
        'action' => 'register',
    ]);

    $router->addPost('/api/login', [
        'controller' => 'auth',
        'action' => 'login',
    ]);

    $router->addPost('/api/logout', [
        'controller' => 'auth',
        'action' => 'logout',
    ]);

    $router->addPost('/api/refresh', [
        'controller' => 'auth',
        'action' => 'refresh',
    ]);

    $router->addGet('/api/me', [
        'controller' => 'auth',
        'action' => 'me',
    ]);

    $router->addOptions('/api/{path:.+}', [
        'controller' => 'auth',
        'action' => 'preflight',
    ]);

    $router->notFound([
        'controller' => 'errors',
        'action' => 'notFound',
    ]);

    return $router;
});
