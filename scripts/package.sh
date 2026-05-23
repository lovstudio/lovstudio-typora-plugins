#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist_dir="$repo_root/dist"

mkdir -p "$dist_dir"
rm -f "$dist_dir"/*.zip

for plugin_dir in "$repo_root"/plugins/*; do
  [ -d "$plugin_dir" ] || continue
  plugin_id="$(basename "$plugin_dir")"
  (
    cd "$plugin_dir"
    zip -qr "$dist_dir/$plugin_id.zip" .
  )
done

ls -lh "$dist_dir"
