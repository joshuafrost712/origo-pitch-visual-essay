#!/usr/bin/env bash
# SEC-01: serve the live and preview builds from a real local Apache 2.4, so the .htaccess
# files (headers, CSP, HTTPS rules, Basic auth) are tested as Apache reads them, not as we read them.
#   bash tests/apache-local.sh start   # builds both targets, starts httpd on 18080 (http) and 18443 (https)
#   bash tests/apache-local.sh stop
# Layout mirrors the server: the live build is the web root, the preview build sits in preview/.
# Uses macOS's /usr/sbin/httpd (Apache 2.4) and a throwaway self-signed certificate. Everything it
# writes lives under .origo-site-runtime/apache/ (ignored). The test password is "test:test".
# Build env: VITE_SIGNUP_URL is read from the environment; set it to the repo variable to test the
# sign-up path (gh variable get VITE_SIGNUP_URL).
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
# macOS privacy rules stop /usr/sbin/httpd reading ~/Documents ("Operation not permitted"), so a
# checkout there needs APACHE_RT pointed outside it (any folder under /tmp or the user's cache).
rt="${APACHE_RT:-$root/.origo-site-runtime/apache}"
httpd="${HTTPD:-/usr/sbin/httpd}"
mods="${HTTPD_MODULES:-/usr/libexec/apache2}"
cmd="${1:-start}"

stop() { [ -f "$rt/httpd.pid" ] && kill "$(cat "$rt/httpd.pid")" 2>/dev/null || true; rm -f "$rt/httpd.pid"; }
if [ "$cmd" = stop ]; then stop; echo "apache-local: stopped"; exit 0; fi
stop
rm -rf "$rt/docroot" && mkdir -p "$rt/docroot" "$rt/logs"
cd "$root"

commit="$(git rev-parse HEAD)"
VITE_COMMIT="$commit" VITE_BASE=/preview/ VITE_NOINDEX=1 npx vite build --outDir "$rt/docroot/preview" --emptyOutDir >/dev/null
BH_HTPASSWD_PATH="$rt/htpasswd" bash deploy/prepare.sh "$rt/docroot/preview" preview
node tools/check-dist.mjs "$rt/docroot/preview" --target preview
VITE_COMMIT="$commit" VITE_BASE=/ npx vite build --outDir "$rt/build-live" --emptyOutDir >/dev/null
bash deploy/prepare.sh "$rt/build-live" live
node tools/check-dist.mjs "$rt/build-live" --target live
cp -R "$rt/build-live/." "$rt/docroot/"
mkdir -p "$rt/docroot/.well-known/acme-challenge" && echo ok > "$rt/docroot/.well-known/acme-challenge/probe"

htpasswd -bcB "$rt/htpasswd" test test >/dev/null 2>&1
[ -f "$rt/cert.pem" ] || openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj /CN=localhost \
  -keyout "$rt/key.pem" -out "$rt/cert.pem" >/dev/null 2>&1

cat > "$rt/httpd.conf" <<EOF
ServerRoot "$rt"
PidFile "$rt/httpd.pid"
DefaultRuntimeDir "$rt"
Mutex file:$rt default
ServerName localhost
Listen 127.0.0.1:18080
Listen 127.0.0.1:18443
$(for m in mpm_prefork unixd authz_core authz_host authz_user authn_core authn_file auth_basic access_compat \
    dir mime headers rewrite alias setenvif log_config socache_shmcb ssl filter env; do
    echo "LoadModule ${m}_module $mods/mod_${m}.so"; done)
TypesConfig /private/etc/apache2/mime.types
ErrorLog "$rt/logs/error.log"
LogFormat "%h %r %>s" short
CustomLog "$rt/logs/access.log" short
DocumentRoot "$rt/docroot"
<Directory />
  AllowOverride None
  Require all denied
</Directory>
<Directory "$rt/docroot">
  AllowOverride All
  Require all granted
</Directory>
# As on cPanel: .htaccess and .htpasswd are never served.
<Files ".ht*">
  Require all denied
</Files>
<VirtualHost 127.0.0.1:18080>
</VirtualHost>
<VirtualHost 127.0.0.1:18443>
  SSLEngine on
  SSLCertificateFile "$rt/cert.pem"
  SSLCertificateKeyFile "$rt/key.pem"
</VirtualHost>
EOF
"$httpd" -t -f "$rt/httpd.conf"
"$httpd" -f "$rt/httpd.conf" -k start
sleep 1
echo "apache-local: http://127.0.0.1:18080/  https://127.0.0.1:18443/  (commit $commit)"
