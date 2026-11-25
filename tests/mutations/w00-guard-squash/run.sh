#!/usr/bin/env bash
# W-00 mutation w00-guard-squash (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh w00-guard-squash
set +e
W="$FX/work"
git -C "$W" checkout -q -b sq origin/main
git -C "$W" merge -q --squash origin/site-v2 && git -C "$W" commit -qm "squash of site-v2"
fx_push sq:refs/heads/main
