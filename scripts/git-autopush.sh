#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$HOME/code/contracts-app"
TS=$(date +%Y-%m-%d-%H%M)

cd "$PROJECT_DIR"

# Use your GitHub key non-interactively (cron-safe)
export GIT_SSH_COMMAND='ssh -i ~/.ssh/id_ed25519_github -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new'

# Only act on main
branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "main" ]; then
  echo "[$TS] skip: branch=$branch"
  exit 0
fi

# Only push when there are changes
if [ -z "$(git status --porcelain)" ]; then
  echo "[$TS] no changes"
  exit 0
fi

git pull --rebase origin main || true
git add -A
git commit -m "auto: hourly snapshot $TS" || true
git push origin main

echo "[$TS] pushed → origin/main"
