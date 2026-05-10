FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

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
        git \
        unzip \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/php \
    && sed -i 's|^listen = .*|listen = 9000|' /etc/php/8.3/fpm/pool.d/www.conf \
    && sed -i 's|^;clear_env = no|clear_env = no|' /etc/php/8.3/fpm/pool.d/www.conf \
    && sed -i 's|^error_log = .*|error_log = /proc/self/fd/2|' /etc/php/8.3/fpm/php-fpm.conf \
    && sed -i 's|^;daemonize = yes|daemonize = no|' /etc/php/8.3/fpm/php-fpm.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm8.3", "-F"]
