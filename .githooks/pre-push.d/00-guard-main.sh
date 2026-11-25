#!/usr/bin/env bash
# W-00 D1: refuses a push to main that carries campaign work before launch.
#   - any pushed commit reachable from a campaign ref (site-v2, feature/w-*, local or remote), or
#   - a pushed tip whose tree holds .github/workflows/deploy-origohub.yml (catches squash and
#     cherry-pick, whose new commits no campaign ref reaches).
# Joshua's own fixes to the live Pages site, made on main outside the campaign, still push.
# ORIGO_SITE_LAUNCH=1 lifts it for W-06's one merge. Client-side: --no-verify skips it.
set -euo pipefail
[ "${ORIGO_SITE_LAUNCH:-}" = "1" ] && exit 0
remote="${1:-origin}"
zero=0000000000000000000000000000000000000000

campaign_refs="$(git for-each-ref --format='%(refname)' refs/heads/site-v2 'refs/heads/feature/w-*' 'refs/remotes/*/site-v2' 'refs/remotes/*/feature/w-*')"

while read -r local_ref local_sha remote_ref remote_sha; do
  [ -n "${local_ref:-}" ] || continue
  [ "$remote_ref" = "refs/heads/main" ] || continue
  [ "$local_sha" = "$zero" ] && continue
  if git cat-file -e "$local_sha:.github/workflows/deploy-origohub.yml" 2>/dev/null; then
    echo "refusing push to main: the pushed tree holds deploy-origohub.yml (campaign work)" >&2
    echo "refusing push to main"
    exit 1
  fi
  [ -n "$campaign_refs" ] || continue
  if [ "$remote_sha" != "$zero" ] && git cat-file -e "$remote_sha^{commit}" 2>/dev/null; then
    pushed="$(git rev-list "$local_sha" "^$remote_sha")"
  else
    pushed="$(git rev-list "$local_sha" --not --remotes="$remote")"
  fi
  [ -n "$pushed" ] || continue
  # shellcheck disable=SC2086
  campaign="$(git rev-list $campaign_refs)"
  hit="$(comm -12 <(printf '%s\n' "$pushed" | sort) <(printf '%s\n' "$campaign" | sort) | head -1)"
  if [ -n "$hit" ]; then
    echo "refusing push to main: $hit is campaign work" >&2
    echo "refusing push to main"
    exit 1
  fi
done
exit 0
