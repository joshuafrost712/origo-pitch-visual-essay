#!/usr/bin/env bash
# W-00 D2 step 3: writes <dir>/.htaccess from the target's template.
#   bash deploy/prepare.sh <dir> preview|live
# preview needs BH_HTPASSWD_PATH (absolute path of the server's .htpasswd, outside the web root).
# Runs locally too, with any path. tools/check-dist.mjs runs after it, before any upload.
set -euo pipefail
dir="${1:?usage: deploy/prepare.sh <dir> preview|live}"
target="${2:-}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "$target" in
  preview)
    if [ -z "${BH_HTPASSWD_PATH:-}" ]; then echo "htpasswd path missing"; exit 1; fi
    # | is the sed delimiter; a path never holds one.
    sed "s|__HTPASSWD_PATH__|${BH_HTPASSWD_PATH}|g" "$here/htaccess-preview.template" > "$dir/.htaccess"
    ;;
  live)
    cp "$here/htaccess-live.template" "$dir/.htaccess"
    ;;
  *)
    echo "unknown target"; exit 1 ;;
esac
