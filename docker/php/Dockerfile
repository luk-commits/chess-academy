FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git \
    unzip \
    libpq-dev \
    postgresql-dev \
    autoconf \
    g++ \
    make \
    pcre-dev \
    linux-headers \
    bash

RUN docker-php-ext-install pdo pdo_pgsql pgsql opcache

RUN curl -sSLO https://github.com/phalcon/cphalcon/archive/refs/tags/v5.9.3.tar.gz \
    && tar -xzf v5.9.3.tar.gz \
    && cd cphalcon-5.9.3/build \
    && ./install \
    && cd ../.. \
    && rm -rf cphalcon-5.9.3 v5.9.3.tar.gz \
    && docker-php-ext-enable phalcon

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
