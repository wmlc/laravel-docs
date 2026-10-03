# 起步套件

- [简介](#introduction)
- [Laravel Breeze](#laravel-breeze)
    - [安装](#laravel-breeze-installation)
    - [Breeze 与 Blade](#breeze-and-blade)
    - [Breeze 与 React / Vue](#breeze-and-inertia)
    - [Breeze 与 Next.js / API](#breeze-and-next)
- [Laravel Jetstream](#laravel-jetstream)

<a name="introduction"></a>
## 简介

为了让你在构建新的 Laravel 应用时有一个良好的开端，我们很高兴地提供认证和应用程序起步套件。这些套件会自动为你的应用搭建注册和认证用户所需的路由、控制器和视图。

虽然你可以使用这些起步套件，但它们并非必需。你也可以仅安装一份全新的 Laravel，从零开始构建自己的应用。无论选择哪种方式，我们相信你都能构建出出色的作品！

<a name="laravel-breeze"></a>
## Laravel Breeze

[Laravel Breeze](https://github.com/laravel/breeze) 是 Laravel 所有[认证功能](/docs/{{version}}/authentication)的精简、简单实现，包括登录、注册、密码重置、邮箱验证和密码确认。此外，Breeze 还包含一个简单的"个人资料"页面，用户可以在其中更新自己的姓名、邮箱地址和密码。

Laravel Breeze 的默认视图层由使用 [Tailwind CSS](https://tailwindcss.com) 设置样式的简单 [Blade 模板](/docs/{{version}}/blade)组成。或者，Breeze 也可以使用 Vue 或 React 以及 [Inertia](https://inertiajs.com) 来为你的应用搭建脚手架。

Breeze 为开始一个全新的 Laravel 应用提供了绝佳的起点，对于计划使用 [Laravel Livewire](https://laravel-livewire.com) 将 Blade 模板提升到更高水平的项目来说，也是一个很好的选择。

<img src="https://laravel.com/img/docs/breeze-register.png">

#### Laravel Bootcamp

如果你是 Laravel 的新手，欢迎随时加入 [Laravel Bootcamp](https://bootcamp.laravel.com)。Laravel Bootcamp 将引导你使用 Breeze 构建第一个 Laravel 应用。这是全面了解 Laravel 和 Breeze 所提供功能的好方法。

<a name="laravel-breeze-installation"></a>
### 安装

首先，你应该[创建一个新的 Laravel 应用](/docs/{{version}}/installation)，配置数据库，并运行[数据库迁移](/docs/{{version}}/migrations)。创建新的 Laravel 应用后，你可以使用 Composer 安装 Laravel Breeze：

```shell
composer require laravel/breeze --dev
```

Breeze 安装完成后，你可以使用下面文档中讨论的 Breeze "技术栈"之一来为应用搭建脚手架。

<a name="breeze-and-blade"></a>
### Breeze 与 Blade

Composer 安装 Laravel Breeze 包之后，你可以运行 `breeze:install` Artisan 命令。该命令会将认证视图、路由、控制器和其他资源发布到你的应用中。Laravel Breeze 将其所有代码都发布到你的应用中，以便你对它的功能和实现拥有完全的控制权和可见性。

Breeze 的默认"技术栈"是 Blade 栈，它使用简单的 [Blade 模板](/docs/{{version}}/blade)来渲染应用的前端。可以通过不带任何额外参数调用 `breeze:install` 命令来安装 Blade 栈。Breeze 脚手架安装完成后，你还应该编译应用的前端资源：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

接下来，你可以在浏览器中访问应用的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

<a name="dark-mode"></a>
#### 深色模式

如果你希望 Breeze 在为应用前端搭建脚手架时包含"深色模式"支持，只需在执行 `breeze:install` 命令时提供 `--dark` 指令：

```shell
php artisan breeze:install --dark
```

> **Note**
> 要了解更多关于编译应用 CSS 和 JavaScript 的信息，请查阅 Laravel 的 [Vite 文档](/docs/{{version}}/vite#running-vite)。

<a name="breeze-and-inertia"></a>
### Breeze 与 React / Vue

Laravel Breeze 还通过 [Inertia](https://inertiajs.com) 前端实现提供 React 和 Vue 脚手架。Inertia 允许你使用经典的服务端路由和控制器来构建现代的单页 React 和 Vue 应用。

Inertia 让你既能享受 React 和 Vue 的前端强大功能，又能结合 Laravel 出色的后端生产力以及极速的 [Vite](https://vitejs.dev) 编译。要使用 Inertia 栈，请在执行 `breeze:install` Artisan 命令时将 `vue` 或 `react` 指定为所需的技术栈。Breeze 脚手架安装完成后，你还应该编译应用的前端资源：

```shell
php artisan breeze:install vue

# 或者...

php artisan breeze:install react

php artisan migrate
npm install
npm run dev
```

接下来，你可以在浏览器中访问应用的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

<a name="server-side-rendering"></a>
#### 服务端渲染

如果你希望 Breeze 搭建对 [Inertia SSR](https://inertiajs.com/server-side-rendering) 的支持脚手架，可以在调用 `breeze:install` 命令时提供 `ssr` 选项：

```shell
php artisan breeze:install vue --ssr
php artisan breeze:install react --ssr
```

<a name="breeze-and-next"></a>
### Breeze 与 Next.js / API

Laravel Breeze 还可以搭建一个认证 API，用于认证现代 JavaScript 应用，例如由 [Next](https://nextjs.org)、[Nuxt](https://nuxt.com) 等驱动的应用。开始使用时，请在执行 `breeze:install` Artisan 命令时将 `api` 指定为所需的技术栈：

```shell
php artisan breeze:install api

php artisan migrate
```

在安装过程中，Breeze 会向应用的 `.env` 文件添加一个 `FRONTEND_URL` 环境变量。此 URL 应该是你的 JavaScript 应用的 URL。在本地开发期间，这通常是 `http://localhost:3000`。此外，你应该确保 `APP_URL` 设置为 `http://localhost:8000`，这是 `serve` Artisan 命令使用的默认 URL。

<a name="next-reference-implementation"></a>
#### Next.js 参考实现

最后，你可以将此后端与你选择的前端进行配对。Breeze 前端的 Next 参考实现[可在 GitHub 上获取](https://github.com/laravel/breeze-next)。该前端由 Laravel 维护，包含与 Breeze 提供的传统 Blade 和 Inertia 栈相同的用户界面。

<a name="laravel-jetstream"></a>
## Laravel Jetstream

虽然 Laravel Breeze 为构建 Laravel 应用提供了一个简单且精简的起点，但 Jetstream 在此基础上增加了更强大的功能和额外的前端技术栈。**对于刚接触 Laravel 的新手，我们建议先通过 Laravel Breeze 入门，再过渡到 Laravel Jetstream。**

Jetstream 为 Laravel 提供了设计精美的应用脚手架，包括登录、注册、邮箱验证、双因素认证、会话管理、通过 Laravel Sanctum 提供的 API 支持以及可选的团队管理功能。Jetstream 使用 [Tailwind CSS](https://tailwindcss.com) 设计，并提供由 [Livewire](https://laravel-livewire.com) 或 [Inertia](https://inertiajs.com) 驱动的前端脚手架供你选择。

安装 Laravel Jetstream 的完整文档可在[官方 Jetstream 文档](https://jetstream.laravel.com/introduction.html)中找到。
