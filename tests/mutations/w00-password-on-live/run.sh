#!/usr/bin/env bash
# W-00 mutation w00-password-on-live (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/ VITE_NOINDEX= bash tests/lib/build.sh live live
