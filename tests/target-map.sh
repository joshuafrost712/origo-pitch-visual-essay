#!/usr/bin/env bash
# Origo site W-00: asserts deploy/target.sh maps site-v2 to public/preview/ and live to public/.
# Prints "target map: ok" or "target map wrong" (exit 1).
set -uo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
unset BH_WEBROOT
pv="$(bash "$here/deploy/target.sh" site-v2 2>/dev/null)"
lv="$(bash "$here/deploy/target.sh" live 2>/dev/null)"
bad="$(bash "$here/deploy/target.sh" main 2>&1)"; bad_rc=$?
ok=1
grep -qx 'TARGET=preview' <<<"$pv" && grep -qx 'TARGET_DIR=public/preview/' <<<"$pv" && grep -qx 'EXPECT_ANON=401' <<<"$pv" || ok=0
grep -qx 'TARGET=live' <<<"$lv" && grep -qx 'TARGET_DIR=public/' <<<"$lv" && grep -qx 'EXPECT_ANON=200' <<<"$lv" || ok=0
[ "$bad_rc" -ne 0 ] && grep -q 'unknown target branch' <<<"$bad" || ok=0
if [ "$ok" = 1 ]; then echo "target map: ok"; else echo "target map wrong"; exit 1; fi
