#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import tempfile
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path


DEFAULT_PLUGIN_IDS = ["local.image-fit-viewer", "local.session-restore"]
COMMUNITY_PLUGIN_URL = (
    "https://github.com/typora-community-plugin/typora-community-plugin/"
    "releases/latest/download/typora-community-plugin.zip"
)


def main() -> int:
    args = parse_args()
    home = Path.home()
    user_data = Path(args.user_data).expanduser() if args.user_data else (
        home / "Library/Application Support/abnerworks.Typora"
    )
    typora_app = Path(args.typora_app).expanduser()
    repo_root = Path(__file__).resolve().parents[1]
    source_plugins = repo_root / "plugins"
    plugin_ids = parse_plugin_ids(args.plugins)

    user_plugins_root = user_data / "plugins"
    user_plugin_dir = user_plugins_root / "plugins"
    user_settings_dir = user_plugins_root / "settings"

    if args.with_community_plugin:
        install_community_plugin(user_data, typora_app, args.force)
    else:
        ensure_community_plugin_ready(user_data)

    user_plugin_dir.mkdir(parents=True, exist_ok=True)
    for plugin_id in plugin_ids:
        source = source_plugins / plugin_id
        if not source.exists():
            raise SystemExit(f"Project plugin not found: {source}")

        target = user_plugin_dir / plugin_id
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(source, target)
        print(f"Installed plugin: {plugin_id}")

    user_settings_dir.mkdir(parents=True, exist_ok=True)
    update_plugins_json(user_settings_dir / "plugins.json", plugin_ids)

    if not args.keep_community_ui:
        update_core_json(user_settings_dir / "core.json")

    print()
    print("Done. Restart Typora for changes to take effect.")
    print(f"Typora plugin directory: {user_plugin_dir}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install and enable Lovstudio Typora plugins."
    )
    parser.add_argument(
        "--with-community-plugin",
        action="store_true",
        help="Install typora-community-plugin first if it is missing.",
    )
    parser.add_argument(
        "--typora-app",
        default="/Applications/Typora.app",
        help="Typora.app path on macOS.",
    )
    parser.add_argument(
        "--user-data",
        help="Typora user data directory. Defaults to the macOS Typora user data path.",
    )
    parser.add_argument(
        "--plugins",
        default=",".join(DEFAULT_PLUGIN_IDS),
        help="Comma-separated plugin IDs to install.",
    )
    parser.add_argument(
        "--keep-community-ui",
        action="store_true",
        help="Do not disable typora-community-plugin ribbon/workspace/tabs UI.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing typora-community-plugin files when --with-community-plugin is used.",
    )
    return parser.parse_args()


def parse_plugin_ids(value: str) -> list[str]:
    if value.strip() == "all":
        return DEFAULT_PLUGIN_IDS[:]
    return [item.strip() for item in value.split(",") if item.strip()]


def ensure_community_plugin_ready(user_data: Path) -> None:
    loader = user_data / "plugins/loader.js"
    if loader.exists():
        return

    raise SystemExit(
        "typora-community-plugin is not installed. "
        "Run again with --with-community-plugin to install it automatically."
    )


def install_community_plugin(user_data: Path, typora_app: Path, force: bool) -> None:
    index_html = find_typora_index_html(typora_app)
    user_plugins_root = user_data / "plugins"
    loader = user_plugins_root / "loader.js"

    if force or not loader.exists():
        with tempfile.TemporaryDirectory() as tmp:
            zip_path = Path(tmp) / "typora-community-plugin.zip"
            extracted = Path(tmp) / "extracted"
            print("Downloading typora-community-plugin...")
            urllib.request.urlretrieve(COMMUNITY_PLUGIN_URL, zip_path)
            with zipfile.ZipFile(zip_path) as zf:
                zf.extractall(extracted)

            user_plugins_root.mkdir(parents=True, exist_ok=True)
            for item in extracted.iterdir():
                target = user_plugins_root / item.name
                if target.exists():
                    if target.is_dir():
                        shutil.rmtree(target)
                    else:
                        target.unlink()
                if item.is_dir():
                    shutil.copytree(item, target)
                else:
                    shutil.copy2(item, target)
            print(f"Installed typora-community-plugin files: {user_plugins_root}")

    inject_loader(index_html, user_data)


def find_typora_index_html(typora_app: Path) -> Path:
    candidates = [
        typora_app / "Contents/Resources/TypeMark/index.html",
        typora_app / "Contents/Resources/app/index.html",
        typora_app / "Contents/Resources/appsrc/index.html",
        typora_app / "resources/TypeMark/index.html",
        typora_app / "resources/index.html",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise SystemExit(f"Cannot find Typora index.html under: {typora_app}")


def inject_loader(index_html: Path, user_data: Path) -> None:
    html = index_html.read_text(encoding="utf-8")
    user_data_url = "file://" + urllib.parse.quote(str(user_data), safe="/:")
    script = f'<script src="{user_data_url}/plugins/loader.js" type="module"></script>'

    if script in html or "/plugins/loader.js" in html:
        print("typora-community-plugin loader is already injected.")
        return

    backup = index_html.with_name(
        f"{index_html.name}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    shutil.copy2(index_html, backup)

    if "</body>" not in html:
        raise SystemExit(f"Cannot inject loader; </body> not found in {index_html}")

    index_html.write_text(html.replace("</body>", script + "</body>", 1), encoding="utf-8")
    print(f"Injected loader into: {index_html}")
    print(f"Backup created: {backup}")


def update_plugins_json(path: Path, plugin_ids: list[str]) -> None:
    data = read_json(path, {})
    for plugin_id in plugin_ids:
        data[plugin_id] = True
    write_json(path, data)
    print(f"Enabled plugins in: {path}")


def update_core_json(path: Path) -> None:
    data = read_json(path, {"version": 1, "settings": {}})
    data.setdefault("version", 1)
    settings = data.setdefault("settings", {})
    settings["showRibbon"] = False
    settings["useWorkspace"] = False
    settings["showFileTabs"] = False
    write_json(path, data)
    print(f"Kept Typora UI native in: {path}")


def read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON: {path}\n{exc}") from exc


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
