#!/usr/bin/env bash
# W-00 mutation w00-secret-scan (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh w00-secret-scan
set +e
W="$FX/work"
git -C "$W" checkout -q -b sv origin/site-v2
# Assembled from pieces so this file never matches the scan or criterion 9 itself.
printf "%s%s\n%s\n" "-----BEGIN OPENSSH PRIV" "ATE KEY-----" "AAAAfixture" > "$W/deploy-key.txt"
git -C "$W" add deploy-key.txt && git -C "$W" commit -qm "add a key by mistake"
fx_push sv:refs/heads/site-v2
