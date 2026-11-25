#!/usr/bin/env bash
# W-00 mutation w00-noindex-on-live (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/ VITE_NOINDEX=1 bash tests/lib/build.sh live live
