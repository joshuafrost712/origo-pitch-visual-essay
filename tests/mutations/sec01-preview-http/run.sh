#!/usr/bin/env bash
# SEC-01 mutation: the preview template loses the block that refuses plain HTTP before the password prompt.
set -uo pipefail
VITE_BASE=/preview/ VITE_NOINDEX=1 bash tests/lib/build.sh preview preview
