# Lovstudio Typora 插件

这是给 Typora 用的一组小插件，基于非官方的 [`typora-community-plugin`](https://github.com/typora-community-plugin/typora-community-plugin) 运行。

先说清楚：Typora 官方没有开放正式插件系统。这里的插件依赖社区方案，会往 Typora 的页面里注入脚本。它可以实现更多功能，但也意味着 Typora 升级后可能需要重新安装或调整。

## 目前有哪些插件

| 插件 | 插件 ID | 做什么 |
| --- | --- | --- |
| 图片预览和 alt 编辑 | `local.image-fit-viewer` | Typora 编辑区里的图片最高显示 240px；双击图片全屏预览；在预览底部修改图片 alt 文本。 |
| 恢复上次视图 | `local.session-restore` | 重新打开 Typora 时，尽量恢复上次打开的文件、滚动位置和光标位置。 |

## 适合谁用

如果你只是想让 Typora 的图片显示更舒服，并且希望下次打开 Typora 能回到上次编辑的位置，可以用这两个插件。

如果你不熟悉命令行，也可以照着下面步骤做。需要注意路径里有空格，复制命令时要完整复制。

## 安装前准备

你需要先安装：

- Typora
- `typora-community-plugin`

如果还没有安装 `typora-community-plugin`，先去它的项目页面下载并安装：

[typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin)

安装完成后，Typora 的用户目录里应该会出现类似这个目录：

```text
~/Library/Application Support/abnerworks.Typora/plugins
```

下面的步骤以 macOS 为例。

## 安装插件

在本仓库目录下执行：

```bash
cp -R plugins/local.image-fit-viewer "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
cp -R plugins/local.session-restore "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
```

这两条命令做的事情是：把插件文件夹复制到 Typora 社区插件目录里。

## 启用插件

打开这个配置文件：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
```

如果文件不存在，就新建一个。内容写成这样：

```json
{
  "local.image-fit-viewer": true,
  "local.session-restore": true
}
```

保存后，完全退出 Typora，再重新打开 Typora。

## 让 AI Agent 自动安装

如果你的 AI 工具能帮你运行命令，可以直接复制下面的话给它。

### 一句话安装本 Skill

复制给 AI：

```text
请帮我运行这条命令，把 Lovstudio Typora Plugins 的 Skill 安装到本机 AI 工具里：curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --skill
```

这句话会让 AI 下载本仓库，并把 Skill 安装到常见的本地 Skill 目录：

```text
~/.agents/skills/lovstudio-typora-plugins
~/.codex/skills/lovstudio-typora-plugins
```

安装完 Skill 后，通常需要重启 AI 工具，或者新开一个对话，AI 才能加载到新 Skill。

### 一句话安装并启用本项目

如果你想让 AI 直接把 Typora 插件也装好，复制给 AI：

```text
请帮我运行这条命令，安装 Lovstudio Typora Plugins 的 Skill，并安装启用对应的 Typora 插件：curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --all
```

这条命令会做四件事：

- 下载本仓库。
- 安装 `lovstudio-typora-plugins` Skill。
- 安装或接入 `typora-community-plugin`。
- 安装并启用本项目里的两个 Typora 插件。

如果你已经安装过 `typora-community-plugin`，只想安装本项目里的 Typora 插件，也可以让 AI 运行：

```bash
curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --typora --no-community-plugin
```

安装完成后，完全退出 Typora，再重新打开。

本仓库额外提供了一个 Skill：

```text
skills/lovstudio-typora-plugins
```

如果你的 AI 工具支持安装 `.skill` 文件，可以使用：

```text
dist/lovstudio-typora-plugins.skill
```

### 手动安装 Skill 到 AI 工具

如果你的 AI 工具不能运行命令，可以手动安装。这里分两种情况，你只需要选一种。

#### 方式一：导入 `.skill` 文件

如果你的 AI 工具有“安装 Skill”、“导入 Skill”或类似入口，推荐用这个方式。

1. 打开本仓库的 GitHub 页面。
2. 找到这个文件：

```text
dist/lovstudio-typora-plugins.skill
```

3. 下载这个 `.skill` 文件到本机。
4. 回到 AI 工具，选择“安装 Skill”或“导入 Skill”。
5. 选中刚下载的 `lovstudio-typora-plugins.skill`。
6. 安装完成后，重启 AI 工具，或者新开一个对话，让 AI 重新加载 Skill。

也可以用命令直接下载：

```bash
curl -L -o lovstudio-typora-plugins.skill https://github.com/lovstudio/lovstudio-typora-plugins/raw/main/dist/lovstudio-typora-plugins.skill
```

下载后，再按你的 AI 工具里的 Skill 导入方式安装。

#### 方式二：手动复制 Skill 目录

如果你的 AI 工具是从本地目录读取 Skill，可以直接复制源码目录。

本仓库里的 Skill 目录是：

```text
skills/lovstudio-typora-plugins
```

常见的本地 Skill 目录有两个：

```text
~/.agents/skills
~/.codex/skills
```

如果你不确定用哪个，可以先问你的 AI：

```text
你的 Skill 目录在哪里？
```

如果你使用的是 `~/.agents/skills`，在本仓库目录下执行：

```bash
mkdir -p "$HOME/.agents/skills"
cp -R skills/lovstudio-typora-plugins "$HOME/.agents/skills/"
```

如果你使用的是 `~/.codex/skills`，在本仓库目录下执行：

```bash
mkdir -p "$HOME/.codex/skills"
cp -R skills/lovstudio-typora-plugins "$HOME/.codex/skills/"
```

复制完成后，重启 AI 工具，或者新开一个对话，让 AI 重新加载 Skill。

注意：安装 Skill 只是让 AI 学会“如何安装这些 Typora 插件”。它不会自动改 Typora。下一步还要让 AI 执行安装。

安装这个 Skill 后，你可以直接对 Agent 说：

```text
帮我安装并启用 Lovstudio Typora 插件
```

Agent 会调用 Skill 里的安装脚本，自动完成这些事情：

- 复制两个插件到 Typora 社区插件目录。
- 写入 `plugins.json` 并启用插件。
- 关闭 `typora-community-plugin` 默认的额外 UI，让 Typora 尽量保持原来的界面。
- 如果你明确要求完整安装，还可以一并安装 `typora-community-plugin`。

Skill 内部使用的脚本是：

```text
skills/lovstudio-typora-plugins/scripts/install_typora_plugins.py
```

## 保持 Typora 原来的界面

`typora-community-plugin` 默认可能会打开一些额外 UI，比如左侧活动栏、自己的标签页界面。如果你只想用本仓库里的小插件，不想改变 Typora 原本界面，可以打开：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/core.json
```

把相关开关设置为 `false`：

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

如果这个文件里已经有其他配置，不要整段覆盖，保留原来的内容，只把上面三个字段加到 `settings` 里即可。

## 插件怎么用

### 图片预览和 alt 编辑

安装并启用 `local.image-fit-viewer` 后：

- Typora 编辑区里的图片最高显示为 240px。
- 双击图片，会打开全屏预览。
- 全屏预览底部可以编辑 `Alt`。
- 修改后按回车或点“保存”，会写回 Markdown 里的图片 alt，并自动退出全屏预览。
- 按 `Esc`、点击背景、或双击大图，可以关闭预览。

Markdown 里的图片语法大概是这样：

```markdown
![这里就是 alt](image.png)
```

插件修改的就是 `![` 和 `]` 中间这段文字。

### 恢复上次视图

安装并启用 `local.session-restore` 后：

- Typora 会记录最后打开的文件。
- 会记录编辑区滚动位置。
- 会尽量记录光标位置。
- 下次重新打开 Typora 时，会尽量回到上次的位置。

如果你从 Finder 或命令行主动打开另一个文件，插件不会强行切回旧文件。

## 打包插件

如果你想生成 zip 包，执行：

```bash
scripts/package.sh
```

打包结果会放到：

```text
dist/
```

每个插件一个 zip 文件。

## 常见问题

### 修改后没有生效

先完全退出 Typora，再重新打开。只关闭窗口不一定等于退出应用。

### Typora 界面变大、左侧多了图标栏

这是 `typora-community-plugin` 的默认 UI，不是本仓库插件本身。按上面的“保持 Typora 原来的界面”设置 `core.json`。

### 光标位置恢复不准

Typora 的编辑区 DOM 会动态变化，所以光标恢复是“尽量恢复”。如果恢复位置不准，移动一次光标或输入一次，插件会重新记录新的状态。

### 不想用了怎么关闭

打开：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
```

把对应插件改成 `false`：

```json
{
  "local.image-fit-viewer": false,
  "local.session-restore": false
}
```

然后重启 Typora。
