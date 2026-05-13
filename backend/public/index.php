<?php

declare(strict_types=1);

use Phalcon\Di\FactoryDefault;
use Phalcon\Mvc\Application;

error_reporting(E_ALL);
define('BASE_PATH', dirname(__DIR__));
define('APP_PATH', BASE_PATH . '/app');

require_once BASE_PATH . '/vendor/autoload.php';

try {
    $container = new FactoryDefault();

    require APP_PATH . '/Config/services.php';
    require APP_PATH . '/Config/router.php';

    $application = new Application($container);

    $eventsManager = $container->getShared('eventsManager');
    $application->setEventsManager($eventsManager);

    $response = $application->handle($_SERVER['REQUEST_URI'] ?? '/');
    if (!$response->isSent()) {
        $response->send();
    }
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage(),
    ]);
}
