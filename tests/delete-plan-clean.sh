#!/usr/bin/env bash
# Origo site W-00 criterion 8: check-delete-plan.mjs passes a clean plan (deletions only of
# manifest paths, uploads outside protected prefixes, live .htaccess matching the recorded hash).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
f=tests/fixtures/delete-plan
node tools/check-delete-plan.mjs check --plan $f/plan.txt --manifest $f/manifest.txt --protected $f/protected.txt --htaccess $f/live.htaccess
