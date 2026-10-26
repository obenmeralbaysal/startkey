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

# Count existing listings. If the query itself fails (bad credentials, psql missing,
# table absent), do NOT treat that as "empty": log it and skip the automatic seed.
listing_count=""
count_ok=1
if [ -n "${DB_PASSWORD:-}" ]; then
    export PGPASSWORD="${DB_PASSWORD}"
fi
if count_out="$(psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-startkey}" -d "${DB_DATABASE:-startkey}" -tAc "SELECT COUNT(*) FROM cms_listings" 2>&1)"; then
    listing_count="$(printf '%s' "${count_out}" | tr -d '[:space:]')"
    case "${listing_count}" in
        ''|*[!0-9]*) count_ok=0 ;;
    esac
else
    count_ok=0
fi
unset PGPASSWORD

if [ "${FORCE_DB_SEED:-}" = "1" ]; then
    echo "[api] FORCE_DB_SEED=1, seeding reference data"
    php artisan db:seed --force --no-interaction
elif [ "${count_ok}" != "1" ]; then
    echo "[api] ERROR: could not count cms_listings, skipping seed: ${count_out:-no output}" >&2
elif [ "${listing_count}" -gt 0 ]; then
    echo "[api] cms_listings already has ${listing_count} rows, skipping seed"
else
    echo "[api] seeding reference data"
    php artisan db:seed --force --no-interaction
fi

php artisan config:clear >/dev/null 2>&1 || true

echo "[api] ready"
exec "$@"
