#!/bin/sh
#
# Prepares the Laravel API before php-fpm takes over: dependencies, database schema
# and the reference-derived seed data. Every step is safe to repeat, so restarting the
# container does not change or duplicate existing data.
#
set -e

cd /var/www/html

# Laravel reads .env even when every value is already supplied by the container.
# The file is gitignored; it is only created so the framework does not warn.
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
    echo "[api] installing composer dependencies"
    composer install --no-interaction --prefer-dist --no-progress
fi

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache || true

echo "[api] waiting for postgres at ${DB_HOST:-postgres}:${DB_PORT:-5432}"
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-startkey}" >/dev/null 2>&1; do
    sleep 1
done

echo "[api] running migrations"
php artisan migrate --force --no-interaction

listing_count=0
if [ -n "${DB_PASSWORD:-}" ]; then
    export PGPASSWORD="${DB_PASSWORD}"
fi
listing_count="$(psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-startkey}" -d "${DB_DATABASE:-startkey}" -tAc "SELECT COUNT(*) FROM cms_listings" 2>/dev/null || echo 0)"
listing_count="$(printf '%s' "${listing_count}" | tr -d '[:space:]')"
unset PGPASSWORD

if [ "${FORCE_DB_SEED:-}" = "1" ]; then
    echo "[api] FORCE_DB_SEED=1, seeding reference data"
    php artisan db:seed --force --no-interaction
elif [ "${listing_count:-0}" -gt 0 ] 2>/dev/null; then
    echo "[api] cms_listings already has ${listing_count} rows, skipping seed"
else
    echo "[api] seeding reference data"
    php artisan db:seed --force --no-interaction
fi

php artisan config:clear >/dev/null 2>&1 || true

echo "[api] ready"
exec "$@"
