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

    $router->add('/api/logout', [
        'controller' => 'auth',
        'action' => 'logout',
    ])->via(['GET', 'POST']);

    $router->addPost('/api/refresh', [
        'controller' => 'auth',
        'action' => 'refresh',
    ]);

    $router->addGet('/api/me', [
        'controller' => 'auth',
        'action' => 'me',
    ]);

    $router->addGet('/api/coach/positions', [
        'controller' => 'positions',
        'action' => 'index',
    ]);

    $router->addGet('/api/coach/groups', [
        'controller' => 'groups',
        'action' => 'index',
    ]);

    $router->addPost('/api/coach/tasks', [
        'controller' => 'tasks',
        'action' => 'create',
    ]);

    $router->addGet('/api/player/tasks', [
        'controller' => 'player_tasks',
        'action' => 'index',
    ]);

    $router->addPost('/api/player/stages/{id:[0-9]+}/attempt', [
        'controller' => 'player_stages',
        'action' => 'attempt',
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
