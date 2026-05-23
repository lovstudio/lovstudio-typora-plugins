# 图片预览和 alt 编辑

这是一个给 Typora 用的小插件，基于 `typora-community-plugin` 运行。

## 它能做什么

- 把 Typora 编辑区里的图片显示高度限制在 240px 以内。
- 双击图片，打开全屏预览。
- 在全屏预览底部修改图片的 alt 文本。
- 按回车或点“保存”后，自动写回 Markdown，并退出全屏预览。
- 按 `Esc`、点击背景、或双击大图，可以关闭预览。

## 什么是 alt

Markdown 图片一般长这样：

```markdown
![图片说明](image.png)
```

中括号里的 `图片说明` 就是 alt。它通常用来描述图片内容，也有利于搜索、导出和无障碍阅读。

## 安装

先确认已经安装 `typora-community-plugin`。

然后把这个文件夹复制到 Typora 的社区插件目录。

macOS 路径是：

```text
~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.image-fit-viewer
```

可以在仓库根目录执行：

```bash
cp -R plugins/local.image-fit-viewer "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
```

## 启用

打开：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
```

加入或修改这一项：

```json
{
  "local.image-fit-viewer": true
}
```

如果你还启用了其他插件，就把这一项合并进去，不要删除其他插件配置。

保存后，完全退出 Typora，再重新打开。

## 使用

1. 在 Typora 里打开一篇有图片的 Markdown。
2. 双击图片。
3. 在底部 `Alt` 输入框里修改图片说明。
4. 按回车，或点击“保存”。
5. 插件会写回 Markdown，并自动关闭预览。
