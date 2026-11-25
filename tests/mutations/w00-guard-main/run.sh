#!/usr/bin/env bash
# W-00 mutation w00-guard-main (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
source tests/lib/push-fixture.sh w00-guard-main
set +e
W="$FX/work"
# Merge the site-v2 tip into a branch at main, then drop the workflow file in a later commit, so
# the tree test cannot fire and the push is refused by reachability alone.
git -C "$W" checkout -q -b m origin/main
git -C "$W" merge -q --no-ff --no-edit origin/site-v2
git -C "$W" rm -q .github/workflows/deploy-origohub.yml && git -C "$W" commit -qm "hide the workflow file"
fx_push m:refs/heads/main
