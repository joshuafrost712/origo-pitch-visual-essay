#!/usr/bin/env bash
# W-00 mutation w00-live-nogo (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh $(basename "$MUTATION_DIR")
set +e
tip="$(git -C "$FX/work" rev-parse origin/site-v2)"
fx_approvals "- $tip | 2026-11-25 | fixture | NO GO"
fx_push "$tip:refs/heads/live"
