# Laravel Mix

- [简介](#introduction)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel Mix 是一个已不再积极维护的遗留包。[Vite](/docs/{{version}}/vite) 可作为现代替代方案使用。

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 是由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发的包，它提供了一套流畅的 API，用于借助多种常见的 CSS 和 JavaScript 预处理器来定义 [webpack](https://webpack.js.org) 构建步骤。

换句话说，Mix 让编译和压缩应用的 CSS 与 JavaScript 文件变得轻而易举。通过简单的方法链，你就能流畅地定义资源构建管线。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾因 webpack 和资源编译的入门而感到困惑和不知所措，那么你一定会喜欢 Laravel Mix。不过，在开发应用时你并非必须使用它；你可以自由选用任何资源构建工具，甚至完全不用。

> [!NOTE]
> 在新的 Laravel 安装中，Vite 已取代 Laravel Mix。如需 Mix 文档，请访问[官方 Laravel Mix](https://laravel-mix.com/)网站。如果你想切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。
