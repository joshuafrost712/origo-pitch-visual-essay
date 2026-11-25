#!/usr/bin/env bash
# W-00 mutation w00-live-unapproved (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh $(basename "$MUTATION_DIR")
set +e
tip="$(git -C "$FX/work" rev-parse origin/site-v2)"
fx_approvals "- 0123456789abcdef0123456789abcdef01234567 | 2026-11-25 | fixture | GO"
fx_push "$tip:refs/heads/live"
