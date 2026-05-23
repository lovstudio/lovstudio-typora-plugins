#!/usr/bin/env bash
set -euo pipefail

REPO_ZIP_URL="${LOVSTUDIO_TYPORA_PLUGINS_ZIP_URL:-https://github.com/lovstudio/lovstudio-typora-plugins/archive/refs/heads/main.zip}"

mode="typora"
skill_target="both"
with_community_plugin="1"
keep_community_ui="0"

usage() {
  printf '%s\n' "Usage: bootstrap.sh [--typora|--skill|--all] [--target agents|codex|both] [--no-community-plugin] [--keep-community-ui]"
  printf '%s\n' ""
  printf '%s\n' "Examples:"
  printf '%s\n' "  bootstrap.sh --typora"
  printf '%s\n' "  bootstrap.sh --typora --no-community-plugin"
  printf '%s\n' "  bootstrap.sh --skill"
  printf '%s\n' "  bootstrap.sh --all"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --all)
      mode="all"
      shift
      ;;
    --skill)
      mode="skill"
      shift
      ;;
    --typora|--plugins)
      mode="typora"
      shift
      ;;
    --target)
      if [ "$#" -lt 2 ]; then
        printf '%s\n' "Missing value for --target" >&2
        exit 2
      fi
      skill_target="$2"
      shift 2
      ;;
    --target=*)
      skill_target="${1#--target=}"
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

install_skill_to() {
  target_root="$1"
  source_dir="$repo_dir/skills/lovstudio-typora-plugins"
  target_dir="$target_root/lovstudio-typora-plugins"

  mkdir -p "$target_root"
  rm -rf "$target_dir"
  cp -R "$source_dir" "$target_dir"
  printf 'Installed Skill: %s\n' "$target_dir"
}

install_skill() {
  case "$skill_target" in
    agents)
      install_skill_to "$HOME/.agents/skills"
      ;;
    codex)
      install_skill_to "$HOME/.codex/skills"
      ;;
    both)
      install_skill_to "$HOME/.agents/skills"
      install_skill_to "$HOME/.codex/skills"
      ;;
    *)
      printf 'Invalid --target value: %s\n' "$skill_target" >&2
      printf '%s\n' "Use one of: agents, codex, both" >&2
      exit 2
      ;;
  esac

  printf '%s\n' "Restart your AI tool, or start a new chat, so it can reload the Skill."
}

install_typora_plugins() {
  require_command python3

  installer="$repo_dir/skills/lovstudio-typora-plugins/scripts/install_typora_plugins.py"
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

case "$mode" in
  all)
    install_skill
    install_typora_plugins
    ;;
  skill)
    install_skill
    ;;
  typora)
    install_typora_plugins
    ;;
  *)
    printf 'Invalid mode: %s\n' "$mode" >&2
    exit 2
    ;;
esac

printf '%s\n' "Done."
