# Session Restore for Typora

This is a small local plugin for `typora-community-plugin`.

## Behavior

- Records the active file and editor scroll position.
- Records the editor cursor position.
- Restores the last file, scroll position, and cursor position when Typora starts again.
- If Typora is opened with another file, it does not switch away from that file.

## Install

After `typora-community-plugin` is installed, copy this folder to:

```text
~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.session-restore
```

Then enable `Session Restore` in Typora's community plugin settings.
