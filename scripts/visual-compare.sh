#!/usr/bin/env bash
#
# Screenshots a page with Playwright, inside a container so nothing has to be installed
# on the host, and writes the images to reference/screenshots/.
#
#   scripts/visual-compare.sh local  http://localhost:3000/tr  tr
#   scripts/visual-compare.sh reference https://startkey.com.tr/tr tr
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

target="${1:?usage: visual-compare.sh <local|reference> <url> <name>}"
url="${2:?missing url}"
name="${3:?missing name}"

mkdir -p "reference/screenshots/${target}"

if [[ ! -d scripts/.tools/node_modules ]]; then
    docker run --rm -v "$PWD":/work -w /work/scripts/.tools \
        -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
        mcr.microsoft.com/playwright:v1.55.0-noble npm install --no-audit --no-fund
fi

docker run --rm --network host -v "$PWD":/work -w /work \
    -e NODE_PATH=/work/scripts/.tools/node_modules \
    mcr.microsoft.com/playwright:v1.55.0-noble \
    node scripts/screenshot.mjs "$url" "reference/screenshots/${target}/${name}"
