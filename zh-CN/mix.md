# Laravel Mix

## 简介

> [!WARNING]
> Laravel Mix 是一个遗留包，不再积极维护。[Vite](/docs/{{version}}/vite) 可作为现代化的替代方案。

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 是由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发的一个包，它提供了一个流畅的 API，使用多种常见的 CSS 和 JavaScript 预处理器为你的 Laravel 应用定义 webpack 构建步骤。

换句话说，Mix 让编译和压缩应用的 CSS 与 JavaScript 文件变得轻而易举。通过简单的方法链，你可以流畅地定义资源管道（asset pipeline）。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾经对开始使用 webpack 和资源编译感到困惑和不知所措，你会喜欢 Laravel Mix。不过，在开发应用时你并不强制使用它；你可以自由使用任何你喜欢的资源管道工具，甚至完全不使用。

> [!NOTE]
> Vite 已在新安装的 Laravel 中取代 Laravel Mix。有关 Mix 的文档，请访问 [Laravel Mix 官方网站](https://laravel-mix.com/)。如果你想切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。
