#!/usr/bin/env bash
if [[ -z "${BASH_VERSION:-}" ]]; then
  echo "Error: this script must be run with bash, not sh." >&2
  exit 1
fi
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "NOTE: pnpm-workspace.yaml catalog entries must be updated manually."
echo ""
for dir in "$REPO_ROOT"/apps/*/; do
  if [[ -f "$dir/package.json" ]]; then
    echo ""
    echo "==> Updating $dir..."
    npx --yes npm-check-updates -u --packageFile "$dir/package.json"
  fi
done

echo ""
echo "==> Running vp install to apply updates..."
cd "$REPO_ROOT"
vp install

echo ""
echo "==> Running pnpm up --latest to sync lockfile..."
pnpm up --latest --recursive
