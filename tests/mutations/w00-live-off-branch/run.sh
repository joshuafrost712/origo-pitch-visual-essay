#!/usr/bin/env bash
# W-00 mutation w00-live-off-branch (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh $(basename "$MUTATION_DIR")
set +e
tip="$(git -C "$FX/work" rev-parse origin/site-v2)"
git -C "$FX/work" checkout -q -b off origin/site-v2
echo off > "$FX/work/off.txt"; git -C "$FX/work" add off.txt; git -C "$FX/work" commit -qm "not on site-v2"
off="$(git -C "$FX/work" rev-parse off)"
fx_approvals "- $off | 2026-11-25 | fixture | GO"
fx_push "$off:refs/heads/live"
