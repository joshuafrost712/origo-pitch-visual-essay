#!/usr/bin/env bash
# W-00 D2: maps a branch name to its deploy target. Every later step reads these values;
# no step names a target path itself. Prints KEY=value lines for $GITHUB_ENV.
#   bash deploy/target.sh <branch>
# Remote paths are relative to ~/origohub, where the deploy key is fenced by rrsync.
set -euo pipefail
webroot="${BH_WEBROOT:-public}"
case "${1:-}" in
  site-v2)
    cat <<EOT
TARGET=preview
TARGET_DIR=${webroot}/preview/
SITE_URL=https://origohub.org/preview/
VITE_BASE=/preview/
VITE_NOINDEX=1
REMOTE_MANIFEST=deploy/manifest-preview.txt
PROTECTED=deploy/protected-preview.txt
EXPECT_ANON=401
EOT
    ;;
  live)
    cat <<EOT
TARGET=live
TARGET_DIR=${webroot}/
SITE_URL=https://origohub.org/
VITE_BASE=/
VITE_NOINDEX=
REMOTE_MANIFEST=deploy/manifest.txt
PROTECTED=deploy/protected.txt
EXPECT_ANON=200
EOT
    ;;
  *)
    echo "unknown target branch" >&2
    exit 1
    ;;
esac
