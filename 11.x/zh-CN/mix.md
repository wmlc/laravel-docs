# Laravel Mix

- [简介](#introduction)

<a name="introduction"></a>
## 简介

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发，它提供了一套流畅的 API，让你可以使用多种常见的 CSS 和 JavaScript 预处理器，为你的 Laravel 应用定义 [webpack](https://webpack.js.org) 构建步骤。

换句话说，Mix 让编译和压缩应用中的 CSS 与 JavaScript 文件变得轻而易举。通过简单的方法链式调用，你可以流畅地定义资源管线。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾经对如何入门 webpack 和资源编译感到困惑与不知所措，那你一定会喜欢 Laravel Mix。不过在开发应用时你并非必须使用它；你可以自由选择任何想要的资源管线工具，甚至完全不用。

> [!NOTE]
> 在全新安装的 Laravel 中，Vite 已经取代 Laravel Mix。想了解 Mix 的文档，请访问 [Laravel Mix 官方站点](https://laravel-mix.com/)。如果你希望切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。
