#!/usr/bin/env bash
# Origo site W-00 criterion 8: positive controls, so a guard that refuses everything cannot pass
# the mutations. Three pushes through the installed hooks to a throwaway bare remote; each must
# succeed. Prints "guards-pass: N/3".
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source tests/lib/push-fixture.sh guards-pass
set +e
pass=0
W="$FX/work"

# 1. Joshua's live-site fix: a commit on a branch at main that no campaign ref reaches.
git -C "$W" checkout -q -b pages-fix origin/main
echo "fixture fix" > "$W/pages-fix.txt"; git -C "$W" add pages-fix.txt; git -C "$W" commit -qm "Pages fix"
if out="$(fx_push pages-fix:refs/heads/main)"; then pass=$((pass+1)); echo "ok 1: non-campaign fix pushed to main"; else echo "FAIL 1:"; echo "$out"; fi

# 2. The remote's site-v2 tip to live, approved as "GO after fixes".
tip="$(git -C "$W" rev-parse origin/site-v2)"
fx_approvals "- $tip | 2026-11-25 | fixture | GO after fixes"
if out="$(fx_push "$tip:refs/heads/live")"; then pass=$((pass+1)); echo "ok 2: approved site-v2 tip pushed to live"; else echo "FAIL 2:"; echo "$out"; fi

# 3. A site-v2 commit with no secret.
git -C "$W" checkout -q -b sv origin/site-v2
echo "plain copy change" > "$W/plain.txt"; git -C "$W" add plain.txt; git -C "$W" commit -qm "Copy change"
if out="$(fx_push sv:refs/heads/site-v2)"; then pass=$((pass+1)); echo "ok 3: clean site-v2 commit pushed"; else echo "FAIL 3:"; echo "$out"; fi

echo "guards-pass: $pass/3"
[ "$pass" = 3 ]
