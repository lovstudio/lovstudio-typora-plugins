# Lovstudio Typora Plugins

Small local plugins for Typora via `typora-community-plugin`.

## Plugins

| Plugin | ID | Purpose |
| --- | --- | --- |
| Image Fit Viewer | `local.image-fit-viewer` | Limit editor images to 240px high, double-click to preview, edit image alt text in the preview. |
| Session Restore | `local.session-restore` | Restore the last open file, scroll position, and cursor position when Typora starts again. |

## Requirements

- Typora
- [`typora-community-plugin`](https://github.com/typora-community-plugin/typora-community-plugin)

These plugins are intentionally small and local. They do not depend on a build step.

## Install

Copy each plugin folder you want into Typora's community plugin directory.

On macOS:

```bash
cp -R plugins/local.image-fit-viewer "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
cp -R plugins/local.session-restore "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
```

Then enable the plugins in:

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
```

Example:

```json
{
  "local.image-fit-viewer": true,
  "local.session-restore": true
}
```

Restart Typora after installing or updating plugin files.

## Keep Typora UI Native

`typora-community-plugin` enables some UI features by default. To keep Typora close to its native UI, set these values in:

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/core.json
```

```json
{
  "version": 1,
  "settings": {
    "showRibbon": false,
    "useWorkspace": false,
    "showFileTabs": false
  }
}
```

## Package

Run:

```bash
scripts/package.sh
```

This creates zip files under `dist/`, one zip per plugin.
