# Laravel Mix

- [简介](#introduction)

<a name="introduction"></a>
## 简介

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 是由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发的一个包，它提供了一套流式 API，让你能够使用多种常见的 CSS 和 JavaScript 预处理器为 Laravel 应用定义 [webpack](https://webpack.js.org) 构建步骤。

换句话说，Mix 让编译和压缩应用的 CSS 与 JavaScript 文件变得轻而易举。通过简单的方法链式调用，你就可以流畅地定义资源管线。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾经对入门 webpack 和资源编译感到困惑和不知所措，那你一定会爱上 Laravel Mix。不过，开发应用时并不要求必须使用它；你可以随意使用任何资源管线工具，甚至完全不使用。

> **注意**  
> Vite 已经在新的 Laravel 安装中取代了 Laravel Mix。如需 Mix 文档，请访问 [Laravel Mix 官网](https://laravel-mix.com/)。如果你想切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。
