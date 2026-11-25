#!/usr/bin/env bash
# W-00 mutation w00-protected-leak (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
node tools/check-delete-plan.mjs check --plan "$MUTATION_DIR/plan.txt" --manifest "$MUTATION_DIR/manifest.txt" --protected "$MUTATION_DIR/protected.txt"
