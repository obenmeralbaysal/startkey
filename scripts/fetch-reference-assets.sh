#!/usr/bin/env bash
#
# Downloads the StartKey.com.tr reference assets into web/public so that the
# application never hotlinks the reference website at runtime.
# Re-runnable: existing files are skipped unless FORCE=1.
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUB="$ROOT/web/public"
CDN="https://cdnc.re-os.com"
IK="https://ik.imagekit.io/reoscom"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

ok=0; skip=0; fail=0

get() { # get <url> <dest>
  local url="$1" dest="$2"
  if [[ -s "$dest" && "${FORCE:-0}" != "1" ]]; then skip=$((skip+1)); return 0; fi
  mkdir -p "$(dirname "$dest")"
  if curl -sS -f --retry 2 --max-time 60 -A "$UA" -o "$dest" "$url"; then
    ok=$((ok+1))
  else
    fail=$((fail+1)); rm -f "$dest"; echo "FAIL $url" >&2
  fi
}

# --- Favicon (referenced from the document head, not from the rendered markup) ---
get "$CDN/officelogo/682a7262-013b-4d75-9a4e-ed270bf6f765.jpg" \
    "$PUB/media/officelogo/682a7262-013b-4d75-9a4e-ed270bf6f765.jpg"

# --- Stylesheets, scripts, theme images and fonts from the reference origin ---
python3 "$ROOT/scripts/fetch-reference-static.py" || fail=$((fail+1))

# --- Images, in the exact CDN variants the reference renders ---
python3 "$ROOT/scripts/fetch-reference-media.py" || fail=$((fail+1))

# --- jQuery (self-hosted instead of the code.jquery.com CDN) ---
get "https://code.jquery.com/jquery-3.7.1.min.js" "$PUB/js/jquery-3.7.1.min.js"

echo "assets: downloaded=$ok skipped=$skip failed=$fail"
[[ $fail -eq 0 ]]
