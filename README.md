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
