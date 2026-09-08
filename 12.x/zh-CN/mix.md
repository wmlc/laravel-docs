# Laravel Mix

- [简介](#introduction)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel Mix 是一个旧版软件包，目前已不再积极维护。可以使用 [Vite](/docs/{{version}}/vite) 作为现代化的替代方案。

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 是由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发的软件包。它提供了一套流畅的 API，让你可以使用多种常见的 CSS 和 JavaScript 预处理器，为 Laravel 应用定义 [webpack](https://webpack.js.org) 构建步骤。

换句话说，Mix 让编译和压缩应用的 CSS 与 JavaScript 文件变得轻而易举。通过简单的方法链式调用，你就能流畅地定义自己的资源管线。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾经对上手 webpack 和资源编译感到困惑和无从下手，你一定会喜欢上 Laravel Mix。不过，开发应用时并非必须使用它；你可以随意使用任何你喜欢的资源管线工具，甚至完全不用。

> [!NOTE]
> 在新建的 Laravel 项目中，Vite 已经取代了 Laravel Mix。如需查阅 Mix 文档，请访问 [Laravel Mix 官网](https://laravel-mix.com/)。如果你想切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。
