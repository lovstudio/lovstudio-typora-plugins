# 恢复上次视图

这是一个给 Typora 用的小插件，基于 `typora-community-plugin` 运行。

## 它能做什么

重新打开 Typora 时，尽量恢复你上次编辑的位置。

它会记录：

- 上次打开的文件
- 编辑区滚动位置
- 光标位置

下次启动 Typora 时，它会尝试回到这些位置。

## 什么时候有用

比如你正在写一篇很长的 Markdown，看到中间某一段。关闭 Typora 后，下次再打开，希望继续从那里写，而不是重新找位置。

## 安装

先确认已经安装 `typora-community-plugin`。

然后把这个文件夹复制到 Typora 的社区插件目录。

macOS 路径是：

```text
~/Library/Application Support/abnerworks.Typora/plugins/plugins/local.session-restore
```

可以在仓库根目录执行：

```bash
cp -R plugins/local.session-restore "$HOME/Library/Application Support/abnerworks.Typora/plugins/plugins/"
```

## 启用

打开：

```text
~/Library/Application Support/abnerworks.Typora/plugins/settings/plugins.json
```

加入或修改这一项：

```json
{
  "local.session-restore": true
}
```

如果你还启用了其他插件，就把这一项合并进去，不要删除其他插件配置。

保存后，完全退出 Typora，再重新打开。

## 注意

光标位置是“尽量恢复”，不是 Typora 官方能力。Typora 的编辑区会动态改变内部结构，所以极少数情况下，光标可能只能恢复到附近位置。

如果位置不准，移动一次光标或输入一次，插件会重新记录新的位置。

如果你从 Finder 或命令行主动打开另一个文件，插件不会强行切回旧文件。
