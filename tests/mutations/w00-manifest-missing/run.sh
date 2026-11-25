#!/usr/bin/env bash
# W-00 mutation w00-manifest-missing (spec criterion 7). Runs in the mutant worktree.
set -uo pipefail
node tools/check-delete-plan.mjs check --plan "$MUTATION_DIR/plan.txt" --manifest "$MUTATION_DIR/no-such-manifest.txt" --protected "$MUTATION_DIR/protected.txt"
