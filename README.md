# Lovstudio Typora 插件配置

这是 Lovstudio 专用的 Typora 插件配置仓库。它不是一个通用插件市场，而是一套面向 Lovstudio 写作习惯的小型配置：让 Typora 里的图片更适合阅读和编辑，并在重新打开 Typora 时尽量回到上次的工作位置。

当前包含 2 个小插件，基于非官方的 [`typora-community-plugin`](https://github.com/typora-community-plugin/typora-community-plugin) 运行。

先说清楚：Typora 官方没有开放正式插件系统。这里的实现依赖社区方案，会向 Typora 注入脚本。它能实现更多功能，但 Typora 升级后可能需要重新安装或调整。

## 包含的插件

| 插件 | 插件 ID | 做什么 |
| --- | --- | --- |
| 图片预览和 alt 编辑 | `local.image-fit-viewer` | Typora 编辑区里的图片最高显示 240px；双击图片全屏预览；在预览底部修改图片 alt 文本。 |
| 恢复上次视图 | `local.session-restore` | 重新打开 Typora 时，尽量恢复上次打开的文件、滚动位置和光标位置。 |

## 让 AI 帮你安装

如果你的 AI 工具能操作终端，直接把下面这段话完整复制给它：

```text
请帮我在这台 macOS 上安装 Lovstudio 专用 Typora 插件配置：https://github.com/lovstudio/lovstudio-typora-plugins

请先阅读项目 README.md 和 scripts/bootstrap.sh，确认它会修改哪些文件；然后使用项目提供的 bootstrap 脚本完成安装。必要时一并安装 typora-community-plugin。安装时请保持 Typora 原来的界面，不要开启社区插件自带的额外侧边栏或标签页 UI。

安装完成后，请告诉我你改了什么，并提醒我完全退出 Typora，再重新打开 Typora。
```

AI 通常会运行这条命令：

```bash
curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --typora
```

如果你已经确认自己装过 `typora-community-plugin`，可以让 AI 使用更保守的命令：

```bash
curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --typora --no-community-plugin
```

安装完成后，完全退出 Typora，再重新打开。

## 自己运行命令安装

如果你想直接安装，运行：

```bash
curl -fsSL https://raw.githubusercontent.com/lovstudio/lovstudio-typora-plugins/main/scripts/bootstrap.sh | bash -s -- --typora
```

这条命令会：

- 下载本仓库。
- 安装或接入 `typora-community-plugin`。
- 复制两个插件到 Typora 社区插件目录。
- 写入 `plugins.json` 并启用插件。
- 关闭 `typora-community-plugin` 默认的额外 UI，让 Typora 尽量保持原来的界面。

## 手动安装

下面的步骤以 macOS 为例。你需要先安装 Typora。

如果已经安装过 `typora-community-plugin`，在本仓库目录下运行：

```bash
python3 scripts/install_typora_plugins.py
```

如果还没有安装 `typora-community-plugin`，运行：

```bash
python3 scripts/install_typora_plugins.py --with-community-plugin
```

如果你只想安装其中一个插件：

```bash
python3 scripts/install_typora_plugins.py --plugins local.image-fit-viewer
python3 scripts/install_typora_plugins.py --plugins local.session-restore
```

## 会修改哪些文件

安装脚本会写入 Typora 的社区插件目录：

```text
~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.image-fit-viewer
~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.session-restore
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
~/Library/Application Support/abnerworks.Typora/plugins/settings/core.json
```

如果使用了 `--with-community-plugin`，脚本还会下载 `typora-community-plugin`，并给 Typora 的 `index.html` 注入加载脚本。修改前会创建带时间戳的备份文件。

常见的 Typora 路径是：

```text
/Applications/Typora.app/Contents/Resources/TypeMark/index.html
```

## 保持 Typora 原来的界面

`typora-community-plugin` 默认可能会打开一些额外 UI，比如左侧活动栏、自己的标签页界面。本仓库的安装脚本默认会关闭这些 UI。

对应配置写在：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/core.json
```

关键字段是：

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
