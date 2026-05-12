<?php

declare(strict_types=1);

use Phalcon\Cli\Console;
use Phalcon\Di\FactoryDefault\Cli as CliDi;

error_reporting(E_ALL);
define('BASE_PATH', __DIR__);
define('APP_PATH', BASE_PATH . '/app');

require_once BASE_PATH . '/vendor/autoload.php';

$container = new CliDi();

require APP_PATH . '/Config/services_cli.php';

$console = new Console($container);

$arguments = [
    'task'   => $argv[1] ?? null,
    'action' => $argv[2] ?? null,
    'params' => array_slice($argv, 3),
];

try {
    $console->handle($arguments);
} catch (\Throwable $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
