#!/usr/bin/env bash
# W-00 mutation w00-noindex-drop (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/preview/ VITE_NOINDEX= bash tests/lib/build.sh preview preview
