#!/usr/bin/env bash
# W-00 mutation w00-commit-drop (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/ VITE_NOINDEX= bash tests/lib/build.sh live live
