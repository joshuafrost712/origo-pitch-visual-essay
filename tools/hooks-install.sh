#!/usr/bin/env bash
# Origo site W-00 Conventions: installs .githooks/ to $HOME/.config/origo-site/hooks and points
# core.hooksPath at that ABSOLUTE path, so the hooks govern every checkout and worktree of the
# clone (including main, and worktrees cut before W-00 merged). Run from a checkout of site-v2
# after a hook-adding merge, never from an unmerged worktree.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
dest="$HOME/.config/origo-site/hooks"
mkdir -p "$dest"
rm -rf "$dest/pre-push.d"
cp -R "$root/.githooks/." "$dest/"
chmod +x "$dest/pre-push" "$dest"/pre-push.d/*
git -C "$root" config core.hooksPath "$dest"
echo "hooks installed: $dest ($(ls "$dest/pre-push.d" | tr '\n' ' '))"
