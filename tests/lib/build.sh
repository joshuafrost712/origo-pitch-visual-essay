#!/usr/bin/env bash
# Origo site W-00 mutations: build one target in the current checkout, write its .htaccess and run
# its dist check, as the workflow does.
#   bash tests/lib/build.sh <build-target> <check-target>   (env: VITE_BASE, VITE_NOINDEX)
# The build and check targets differ only when a mutation tests a mismatch.
set -euo pipefail
build_t="$1"; check_t="$2"
export VITE_COMMIT="$(git rev-parse HEAD)"
npx vite build --logLevel error >/dev/null
if [ "$build_t" = preview ]; then BH_HTPASSWD_PATH=/x/.htpasswd bash deploy/prepare.sh dist preview; else bash deploy/prepare.sh dist live; fi
node tools/check-dist.mjs dist --target "$check_t"
