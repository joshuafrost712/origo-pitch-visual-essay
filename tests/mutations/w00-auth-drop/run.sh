#!/usr/bin/env bash
# W-00 mutation w00-auth-drop (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/preview/ VITE_NOINDEX=1 bash tests/lib/build.sh preview preview
