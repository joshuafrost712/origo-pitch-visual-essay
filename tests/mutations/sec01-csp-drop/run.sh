#!/usr/bin/env bash
# SEC-01 mutation: the live template loses its Content-Security-Policy line. Runs in the mutant worktree.
set -uo pipefail
VITE_BASE=/ bash tests/lib/build.sh live live
