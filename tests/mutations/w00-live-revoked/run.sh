#!/usr/bin/env bash
# W-00 mutation w00-live-revoked (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh $(basename "$MUTATION_DIR")
set +e
tip="$(git -C "$FX/work" rev-parse origin/site-v2)"
# The revoking line is the LAST line and has no trailing newline, the harder case for `read`.
printf '%s\n%s' "- $tip | 2026-11-25 | fixture | GO" "- $tip | 2026-11-26 | fixture | NO-GO" > "$FX/approvals.md"
export ORIGO_SITE_LIVE_APPROVALS="$FX/approvals.md"
fx_push "$tip:refs/heads/live"
