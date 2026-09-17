#!/usr/bin/env bash
#
# Starts the whole StartKey stack: PostgreSQL, Redis, the Laravel API behind nginx and
# the Next.js front-end. On first run it creates .env from .env.example and generates
# the secrets that must not be committed (Laravel app key, database password).
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ ! -f .env ]]; then
    cp .env.example .env
    echo "created .env from .env.example"
fi

# Fills an empty variable in .env with a generated value.
fill() { # fill <VARIABLE> <value>
    local key="$1" value="$2"
    if grep -qE "^${key}=$" .env; then
        # The value is written with awk so that base64 padding is never interpreted.
        awk -v key="$key" -v value="$value" \
            'BEGIN { FS = OFS = "=" } $1 == key && $2 == "" { print key "=" value; next } { print }' \
            .env > .env.tmp && mv .env.tmp .env
        echo "generated ${key}"
    fi
}

fill APP_KEY "base64:$(openssl rand -base64 32)"
fill DB_PASSWORD "$(openssl rand -hex 24)"

# The API source is bind-mounted, so php-fpm has to run as the owner of ./api.
fill HOST_UID "$(id -u)"
fill HOST_GID "$(id -g)"

set -a
# shellcheck disable=SC1091
source .env
set +a

docker compose up -d --build

wait_for() { # wait_for <url> <label>
    local url="$1" label="$2"
    echo "waiting for ${label}..."
    for _ in $(seq 1 90); do
        if curl -fsS -o /dev/null "$url"; then
            echo "${label} is up"
            return 0
        fi
        printf '.'
        sleep 2
    done
    echo
    echo "${label} did not answer in time; check 'docker compose logs -f'" >&2
    return 1
}

echo
wait_for "http://localhost:${API_PORT:-8080}/api/v1/homepage?locale=tr" "API"
wait_for "http://localhost:${WEB_PORT:-3000}/tr" "front-end"

echo
echo "Website:  http://localhost:${WEB_PORT:-3000}"
echo "API:      http://localhost:${API_PORT:-8080}/api/v1/homepage?locale=tr"
