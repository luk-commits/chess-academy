# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime - PHP + Nginx
FROM debian:bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    apt-transport-https \
    lsb-release \
    && curl -fsSL https://packages.sury.org/php/apt.gpg -o /usr/share/keyrings/sury-php.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/sury-php.gpg] https://packages.sury.org/php/ bookworm main" > /etc/apt/sources.list.d/sury-php.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        php8.3-fpm \
        php8.3-cli \
        php8.3-pgsql \
        php8.3-opcache \
        php8.3-mbstring \
        php8.3-xml \
        php8.3-curl \
        php8.3-phalcon5 \
        nginx \
        postgresql-client \
        git \
        unzip \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/php

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN sed -i 's|^listen = .*|listen = 127.0.0.1:9000|' /etc/php/8.3/fpm/pool.d/www.conf \
    && sed -i 's|^;clear_env = no|clear_env = no|' /etc/php/8.3/fpm/pool.d/www.conf \
    && sed -i 's|^error_log = .*|error_log = /proc/self/fd/2|' /etc/php/8.3/fpm/php-fpm.conf \
    && sed -i 's|^;daemonize = yes|daemonize = no|' /etc/php/8.3/fpm/php-fpm.conf

COPY backend/ /var/www/backend
WORKDIR /var/www/backend

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

COPY --from=frontend-builder /build/dist/ /var/www/frontend

COPY docker/nginx/render.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["sh", "-c", "php-fpm8.3 -D && nginx -g 'daemon off;'"]
