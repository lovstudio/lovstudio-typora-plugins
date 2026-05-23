#!/usr/bin/env bash
set -euo pipefail

REPO_ZIP_URL="${LOVSTUDIO_TYPORA_PLUGINS_ZIP_URL:-https://github.com/lovstudio/lovstudio-typora-plugins/archive/refs/heads/main.zip}"

with_community_plugin="1"
keep_community_ui="0"

usage() {
  printf '%s\n' "Usage: bootstrap.sh [--typora] [--no-community-plugin] [--keep-community-ui]"
  printf '%s\n' ""
  printf '%s\n' "Examples:"
  printf '%s\n' "  bootstrap.sh --typora"
  printf '%s\n' "  bootstrap.sh --typora --no-community-plugin"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --typora|--plugins)
      shift
      ;;
    --with-community-plugin)
      with_community_plugin="1"
      shift
      ;;
    --no-community-plugin)
      with_community_plugin="0"
      shift
      ;;
    --keep-community-ui)
      keep_community_ui="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

download_repo() {
  require_command curl
  require_command unzip

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  zip_path="$tmp_dir/lovstudio-typora-plugins.zip"
  printf '%s\n' "Downloading Lovstudio Typora plugins..."
  curl -fsSL "$REPO_ZIP_URL" -o "$zip_path"
  unzip -q "$zip_path" -d "$tmp_dir"

  repo_dir="$(find "$tmp_dir" -maxdepth 1 -type d -name 'lovstudio-typora-plugins-*' | head -n 1)"
  if [ -z "$repo_dir" ] || [ ! -d "$repo_dir" ]; then
    printf '%s\n' "Downloaded archive does not contain the expected repository directory." >&2
    exit 1
  fi
}

install_typora_plugins() {
  require_command python3

  installer="$repo_dir/scripts/install_typora_plugins.py"
  args=()

  if [ "$with_community_plugin" = "1" ]; then
    args+=(--with-community-plugin)
  fi

  if [ "$keep_community_ui" = "1" ]; then
    args+=(--keep-community-ui)
  fi

  python3 "$installer" "${args[@]}"
}

download_repo
install_typora_plugins
printf '%s\n' "Done."
