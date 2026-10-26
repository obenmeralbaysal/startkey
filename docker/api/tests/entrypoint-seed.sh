#!/bin/sh
# Shell check for docker/api/entrypoint.sh seed decision. Stubs psql/php/pg_isready/composer.
# Usage: sh docker/api/tests/entrypoint-seed.sh
set -u
here="$(cd "$(dirname "$0")" && pwd)"
src="$here/../entrypoint.sh"
fail=0

run_case() { # name psql_mode force expect(seed|skip)
    name="$1"; mode="$2"; force="$3"; expect="$4"
    tmp="$(mktemp -d)"; mkdir -p "$tmp/bin" "$tmp/app/vendor"; : > "$tmp/app/vendor/autoload.php"
    log="$tmp/calls.log"; : > "$log"
    cat > "$tmp/bin/pg_isready" <<'S'
#!/bin/sh
exit 0
S
    cat > "$tmp/bin/psql" <<S
#!/bin/sh
case "$mode" in
  fail) echo "psql: error: password authentication failed" >&2; exit 2 ;;
  junk) echo "ERROR"; exit 0 ;;
  *) echo " $mode"; exit 0 ;;
esac
S
    cat > "$tmp/bin/php" <<S
#!/bin/sh
echo "php \$*" >> "$log"
S
    chmod +x "$tmp/bin/"*
    sed "s#/var/www/html#$tmp/app#" "$src" > "$tmp/entry.sh"
    PATH="$tmp/bin:$PATH" FORCE_DB_SEED="$force" sh "$tmp/entry.sh" true >"$tmp/out" 2>&1
    if grep -q "db:seed" "$log"; then got=seed; else got=skip; fi
    if [ "$got" = "$expect" ]; then echo "ok   $name ($got)"; else echo "FAIL $name: expected $expect got $got"; cat "$tmp/out"; fail=1; fi
    rm -rf "$tmp"
}

run_case "empty table seeds"           0    ""  seed
run_case "existing rows skip"          42   ""  skip
run_case "count query fails -> skip"   fail ""  skip
run_case "non-numeric output -> skip"  junk ""  skip
run_case "FORCE_DB_SEED=1 seeds"       42   "1" seed
exit $fail
