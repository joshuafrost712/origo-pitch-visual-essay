#!/usr/bin/env bash
# Origo site W-00: a throwaway bare remote for the guard tests, sourced by mutation run.sh files
# and tests/guards-pass.sh.
#   source tests/lib/push-fixture.sh <name>
# Makes $FX/bare.git with main at 8c5dee8 and site-v2 at the commit under test (HEAD of the
# checkout that sources it), clones it to $FX/work (remote "origin"), and defines
# fx_push <args...>, which pushes from the clone THROUGH THE INSTALLED HOOKS
# ($HOME/.config/origo-site/hooks, what `npm run hooks:install` writes), never the tree's copy.
# Nothing here touches the real clone's config or refs: the seed push goes to a path URL.
set -euo pipefail
fx_name="${1:?usage: source tests/lib/push-fixture.sh <name>}"
fx_src="$(git rev-parse --show-toplevel)"
fx_common="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
fx_root="$(dirname "$fx_common")"
FX="$fx_root/.origo-site-runtime/push-fixtures/$fx_name"
HOOKS="${ORIGO_SITE_HOOKS:-$HOME/.config/origo-site/hooks}"
[ -x "$HOOKS/pre-push" ] || { echo "installed hooks missing at $HOOKS (run npm run hooks:install)"; exit 2; }
rm -rf "$FX"; mkdir -p "$FX"
git init -q --bare "$FX/bare.git"
git -C "$fx_src" push -q --no-verify "$FX/bare.git" 8c5dee896b3eb5b9f34b653ffafadcc5d8e9dac1:refs/heads/main HEAD:refs/heads/site-v2
git clone -q "$FX/bare.git" "$FX/work" 2>/dev/null
git -C "$FX/work" config user.email fixture@example.invalid
git -C "$FX/work" config user.name "W-00 fixture"
git -C "$FX/work" config advice.detachedHead false
fx_push() { git -C "$FX/work" -c core.hooksPath="$HOOKS" push origin "$@" 2>&1; }
# An approvals fixture; the env var wins over $HOME/.config/origo-site/env (ambient precedence).
fx_approvals() { printf '%s\n' "$@" > "$FX/approvals.md"; export ORIGO_SITE_LIVE_APPROVALS="$FX/approvals.md"; }
