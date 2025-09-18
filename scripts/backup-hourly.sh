#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$PROJECT_DIR/backups/$(date +%Y-%m-%d)"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_ROOT"
# DB snapshot
if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
  cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_ROOT/dev-$TS.db"
fi
# Uploads archive
if [ -d "$PROJECT_DIR/public/uploads" ]; then
  tar -czf "$BACKUP_ROOT/uploads-$TS.tgz" -C "$PROJECT_DIR/public" uploads
fi
# Code snapshot from current HEAD
if git -C "$PROJECT_DIR" rev-parse --verify HEAD >/dev/null 2>&1; then
  git -C "$PROJECT_DIR" archive -o "$BACKUP_ROOT/src-$TS.zip" HEAD
fi
echo "✓ Backup written to $BACKUP_ROOT at $TS"
