# PHP-FPM image for the Laravel API.
FROM php:8.4.27-fpm-alpine

# pdo_pgsql/pgsql for PostgreSQL, redis for the cache and queue connection,
# intl/zip for the framework, pdo_sqlite for the in-memory test database.
RUN apk add --no-cache \
        icu-dev \
        libpq-dev \
        libzip-dev \
        oniguruma-dev \
        postgresql-client \
        sqlite-dev \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS linux-headers \
    && docker-php-ext-install -j"$(nproc)" \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        pdo_sqlite \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

COPY docker/api/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/api/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html

# php-fpm runs as www-data; the bind-mounted project is owned by the host user, so the
# pool is configured to match the host uid/gid supplied at build time.
ARG UID=1000
ARG GID=1000
RUN if [ "$(id -u www-data)" != "$UID" ]; then \
        deluser www-data \
        && addgroup -g "$GID" -S www-data 2>/dev/null || true; \
        adduser -u "$UID" -S -G www-data -H -D www-data; \
    fi

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
