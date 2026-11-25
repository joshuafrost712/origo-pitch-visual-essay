#!/usr/bin/env bash
# W-00 D2 step 7: reads the deployed commit back from origohub.org, retried for up to two minutes.
# Prints exactly one line, "smoke: target=<target> live=<sha> anon=<status>", and fails unless the
# sha is this run's commit and the anonymous status is the target's expected one (preview 401,
# live 200). Needs TARGET, SITE_URL, EXPECT_ANON (from deploy/target.sh) and GITHUB_SHA;
# the preview also needs SITE_BASIC_AUTH (user:password). Never echoes the credentials.
# Keep non-secret values (the port) out of GitHub secrets: the log masks a secret's value everywhere, even inside this line's sha.
set -uo pipefail
: "${TARGET:?}" "${SITE_URL:?}" "${EXPECT_ANON:?}" "${GITHUB_SHA:?}"
live=none; anon=000
for _ in $(seq 1 12); do
  if [ "$TARGET" = preview ]; then
    page="$(curl -sS --max-time 20 -u "$SITE_BASIC_AUTH" "$SITE_URL" 2>/dev/null || true)"
  else
    page="$(curl -sS --max-time 20 "$SITE_URL" 2>/dev/null || true)"
  fi
  live="$(printf '%s' "$page" | grep -o -E '<meta name="origo-commit" content="[^"]*"' | head -1 | sed -E 's/.*content="([^"]*)"/\1/')"
  live="${live:-none}"
  anon="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$SITE_URL" 2>/dev/null || echo 000)"
  if [ "$live" = "$GITHUB_SHA" ] && [ "$anon" = "$EXPECT_ANON" ]; then break; fi
  sleep 10
done
echo "smoke: target=$TARGET live=$live anon=$anon"
[ "$live" = "$GITHUB_SHA" ] && [ "$anon" = "$EXPECT_ANON" ]
