#!/bin/sh
set -e

cd /var/www/html

if [ -f composer.json ] && [ ! -d vendor ]; then
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

exec "$@"
