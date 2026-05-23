---
name: lovstudio-typora-plugins
description: Install, enable, update, or troubleshoot Lovstudio Typora plugins based on typora-community-plugin. Use when the user asks to install or enable the Typora image preview/alt editor plugin, the Typora session restore plugin, Lovstudio Typora plugins, or wants Typora to keep native UI while using these plugins.
---

# Lovstudio Typora Plugins

Use this skill to install or enable the bundled Lovstudio Typora plugins:

- `local.image-fit-viewer`: caps images at 240px, opens full-window preview on double-click, edits image alt text.
- `local.session-restore`: restores the last file, scroll position, and cursor position when Typora starts.

The bundled installer is macOS-focused and deterministic. It copies plugin folders from `assets/plugins/`, updates `plugins.json`, and optionally installs `typora-community-plugin`.

## Workflow

1. Check whether the user wants a full install or only plugin enablement.
2. If `typora-community-plugin` is already installed, run the installer without `--with-community-plugin`.
3. If `typora-community-plugin` is missing and the user explicitly asked for automatic/full install, run with `--with-community-plugin`.
4. Restart Typora after installation.

## Commands

Install and enable both bundled plugins when `typora-community-plugin` already exists:

```bash
python3 /path/to/skill/scripts/install_typora_plugins.py
```

Install `typora-community-plugin` too, then install and enable both plugins:

```bash
python3 /path/to/skill/scripts/install_typora_plugins.py --with-community-plugin
```

Install only one plugin:

```bash
python3 /path/to/skill/scripts/install_typora_plugins.py --plugins local.image-fit-viewer
python3 /path/to/skill/scripts/install_typora_plugins.py --plugins local.session-restore
```

Preserve community plugin's default ribbon/workspace/tabs UI:

```bash
python3 /path/to/skill/scripts/install_typora_plugins.py --keep-community-ui
```

Use a non-standard Typora.app path:

```bash
python3 /path/to/skill/scripts/install_typora_plugins.py --with-community-plugin --typora-app /Applications/Typora.app
```

## Behavior

The installer writes:

- `~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.image-fit-viewer`
- `~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.session-restore`
- `~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json`
- `~/Library/Application Support/abnerworks.Typora/plugins/settings/core.json`

By default it sets these community UI options to keep Typora close to native UI:

```json
{
  "showRibbon": false,
  "useWorkspace": false,
  "showFileTabs": false
}
```

When `--with-community-plugin` is used, it downloads the latest `typora-community-plugin`, copies it into Typora's user data directory, injects its loader into Typora's `index.html`, and creates a timestamped backup of that file before editing.

## Safety Notes

- Do not claim this is an official Typora plugin system.
- Mention that Typora must be restarted.
- If Typora is running, do not force quit it unless the user explicitly asks.
- If the installer reports invalid JSON, inspect and repair the referenced config file instead of overwriting unrelated user settings.
