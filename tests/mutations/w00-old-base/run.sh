#!/usr/bin/env bash
# W-00 mutation w00-old-base (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/origo-pitch-visual-essay/ VITE_NOINDEX= bash tests/lib/build.sh live live
