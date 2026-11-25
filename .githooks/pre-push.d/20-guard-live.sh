#!/usr/bin/env bash
# W-00 D1 (amended 2026-11-25): guards every push that changes the public origohub.org page.
# For a push to refs/heads/live it refuses unless
#   1. the pushed sha is listed as approved in the private file ORIGO_SITE_LIVE_APPROVALS names
#      (set in $HOME/.config/origo-site/env), on a line "- <sha> | <date> | <review> | <verdict>"
#      whose verdict is exactly "GO" or "GO after fixes". SEC-01 writes the first line; later ones
#      follow decision W-00/6. Prints "live push needs an approved commit".
#   2. the pushed sha is on <remote>/site-v2. Prints "live tip not on site-v2".
# Ambient-variable precedence: the runner (.githooks/pre-push) loads $HOME/.config/origo-site/env
# only for variables NOT already set, so an ORIGO_SITE_LIVE_APPROVALS exported in the shell wins
# over the env file. The mutations use that to point this guard at a fixture. The flip side: a
# stale export in Joshua's shell would silently redirect the gate; `env | grep ORIGO_SITE` shows it.
# Deleting live passes. CLIENT-SIDE: --no-verify skips it. The workflow re-checks rule 2 on the
# runner; rule 1 has no second layer because the approvals file is private.
set -euo pipefail
remote="${1:-origin}"
zero=0000000000000000000000000000000000000000

while read -r local_ref local_sha remote_ref remote_sha; do
  [ -n "${local_ref:-}" ] || continue
  [ "$remote_ref" = "refs/heads/live" ] || continue
  [ "$local_sha" = "$zero" ] && continue

  approvals="${ORIGO_SITE_LIVE_APPROVALS:-}"
  approved=no
  if [ -n "$approvals" ] && [ -f "$approvals" ]; then
    # `|| [ -n ... ]` also reads an unterminated last line, so a final NO-GO with no newline
    # still revokes (shadow review, 2026-11-25).
    while IFS='|' read -r c_sha _c_date _c_review c_verdict || [ -n "${c_sha:-}" ]; do
      c_sha="$(printf '%s' "$c_sha" | sed -E 's/^[[:space:]]*-?[[:space:]]*//; s/[[:space:]]+$//')"
      c_verdict="$(printf '%s' "${c_verdict:-}" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
      [ "$c_sha" = "$local_sha" ] || continue
      # The last line for a sha wins: every matching line resets the verdict, so a later
      # NO-GO revokes an earlier GO (mutation w00-live-revoked).
      if [ "$c_verdict" = "GO" ] || [ "$c_verdict" = "GO after fixes" ]; then approved=yes; else approved=no; fi
    done < "$approvals"
  fi
  if [ "$approved" != yes ]; then
    echo "approvals file: ${approvals:-ORIGO_SITE_LIVE_APPROVALS unset}; sha $local_sha not listed as GO" >&2
    echo "live push needs an approved commit"
    exit 1
  fi

  base="refs/remotes/$remote/site-v2"
  if ! git rev-parse -q --verify "$base" >/dev/null || ! git merge-base --is-ancestor "$local_sha" "$base"; then
    echo "live tip not on site-v2"
    exit 1
  fi
done
exit 0
