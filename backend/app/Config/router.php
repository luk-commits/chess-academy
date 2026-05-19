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

    $router->addGet('/api/coach/tasks', [
        'controller' => 'tasks',
        'action' => 'index',
    ]);

    $router->add('/api/coach/tasks/{id:[0-9]+}', [
        'controller' => 'tasks',
        'action' => 'update',
    ])->via(['PATCH']);

    $router->addGet('/api/coach/stages/{id:[0-9]+}', [
        'controller' => 'coach_stages',
        'action' => 'show',
    ]);

    $router->add('/api/coach/stages/{id:[0-9]+}', [
        'controller' => 'coach_stages',
        'action' => 'update',
    ])->via(['PATCH']);

    $router->addGet('/api/player/tasks', [
        'controller' => 'player_tasks',
        'action' => 'index',
    ]);

    $router->addGet('/api/player/stages/due', [
        'controller' => 'player_stages',
        'action' => 'due',
    ]);

    $router->addPost('/api/player/stages/{id:[0-9]+}/attempt', [
        'controller' => 'player_stages',
        'action' => 'attempt',
    ]);

    // Player task progress lifecycle
    $router->addPost('/api/player/tasks/{id:[0-9]+}/start', [
        'controller' => 'player_task_progress',
        'action' => 'start',
    ]);

    $router->addPost('/api/player/tasks/{id:[0-9]+}/interrupt', [
        'controller' => 'player_task_progress',
        'action' => 'interrupt',
    ]);

    $router->addPost('/api/player/tasks/{id:[0-9]+}/resume', [
        'controller' => 'player_task_progress',
        'action' => 'resume',
    ]);

    $router->addPost('/api/player/tasks/{id:[0-9]+}/reset', [
        'controller' => 'player_task_progress',
        'action' => 'reset',
    ]);

    $router->addPost('/api/player/tasks/{id:[0-9]+}/archive', [
        'controller' => 'player_task_progress',
        'action' => 'archive',
    ]);

    $router->addPost('/api/player/tasks/{id:[0-9]+}/restore', [
        'controller' => 'player_task_progress',
        'action' => 'restore',
    ]);

    $router->addPost('/api/player/tasks/{taskId:[0-9]+}/stages/{stageId:[0-9]+}/complete', [
        'controller' => 'player_task_progress',
        'action' => 'completeStage',
    ]);

    $router->addPost('/api/player/stages/{id:[0-9]+}/repetition', [
        'controller' => 'player_task_progress',
        'action' => 'repetition',
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
