#!/usr/bin/env bash
# W-00 Conventions: run one mutation and watch it go red.
#   bash tools/mutate.sh <id>
# Makes a throwaway worktree of HEAD under .origo-site-runtime/mutants/<id>, links node_modules,
# applies tests/mutations/<id>/patch.diff (an empty patch is skipped), runs run.sh there, and
# prints "RED (as expected)" only when run.sh exits non-zero AND its output holds every line of
# expected_red.txt. Otherwise "STAYED GREEN" and exit 1. The worktree is removed either way.
set -uo pipefail
id="${1:?usage: tools/mutate.sh <id>}"
root="$(git rev-parse --show-toplevel)"
mdir="$root/tests/mutations/$id"
[ -d "$mdir" ] || { echo "no such mutation: $id"; exit 2; }
wt="$root/.origo-site-runtime/mutants/$id"
cleanup() { git -C "$root" worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"; git -C "$root" worktree prune; }
trap cleanup EXIT
cleanup
mkdir -p "$(dirname "$wt")"
git -C "$root" worktree add --detach "$wt" HEAD >/dev/null 2>&1 || { echo "worktree add failed"; exit 2; }
ln -s "$root/node_modules" "$wt/node_modules"
if [ -s "$mdir/patch.diff" ]; then
  git -C "$wt" apply "$mdir/patch.diff" || { echo "patch did not apply: $id"; exit 2; }
fi
out="$(cd "$wt" && MUTANT_DIR="$wt" MUTATION_DIR="$mdir" bash "$mdir/run.sh" 2>&1)"; rc=$?
printf '%s\n' "$out" | tail -40
missing=0
while IFS= read -r want || [ -n "$want" ]; do
  [ -n "$want" ] || continue
  printf '%s\n' "$out" | grep -qF -- "$want" || { echo "expected line not seen: $want"; missing=1; }
done < "$mdir/expected_red.txt"
if [ "$rc" -ne 0 ] && [ "$missing" -eq 0 ]; then
  echo "RED (as expected): $id"
  exit 0
fi
echo "STAYED GREEN: $id (exit $rc)"
exit 1
