# 入门套件

- [简介](#introduction)
- [Laravel Breeze](#laravel-breeze)
    - [安装](#laravel-breeze-installation)
    - [Breeze 与 Blade](#breeze-and-blade)
    - [Breeze 与 Livewire](#breeze-and-livewire)
    - [Breeze 与 React / Vue](#breeze-and-inertia)
    - [Breeze 与 Next.js / API](#breeze-and-next)
- [Laravel Jetstream](#laravel-jetstream)

<a name="introduction"></a>
## 简介

为了让你更快地构建新的 Laravel 应用，我们很高兴提供认证和应用入门套件。这些套件会自动为应用搭建注册与认证所需的路由、控制器和视图脚手架。

你当然可以使用这些入门套件，但它们并非必需的。你完全可以从零开始构建自己的应用，只需安装一份全新的 Laravel 即可。无论采用哪种方式，我们都相信你会做出很棒的作品！

<a name="laravel-breeze"></a>
## Laravel Breeze

[Laravel Breeze](https://github.com/laravel/breeze) 是 Laravel 全部[认证功能](/docs/{{version}}/authentication)的最小化简洁实现，涵盖登录、注册、密码重置、邮箱验证和密码确认。此外，Breeze 还包含一个简单的"个人资料"页面，用户可以在其中更新姓名、邮箱地址和密码。

Laravel Breeze 默认的视图层由简单的 [Blade 模板](/docs/{{version}}/blade)组成，并使用 [Tailwind CSS](https://tailwindcss.com) 设置样式。此外，Breeze 还提供基于 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 的脚手架选项，基于 Inertia 的脚手架可选择使用 Vue 或 React。

<img src="https://laravel.com/img/docs/breeze-register.png">

#### Laravel Bootcamp

如果你是 Laravel 新手，欢迎直接加入 [Laravel Bootcamp](https://bootcamp.laravel.com)。Laravel Bootcamp 会引导你使用 Breeze 构建第一个 Laravel 应用。这是快速了解 Laravel 和 Breeze 全部内容的好方式。

<a name="laravel-breeze-installation"></a>
### 安装

首先，你应当[创建一个新的 Laravel 应用](/docs/{{version}}/installation)。如果你使用 [Laravel 安装器](/docs/{{version}}/installation#creating-a-laravel-project)创建应用，安装过程中会提示你安装 Laravel Breeze。否则，你需要按照下面的手动安装说明操作。

如果你已经创建了一个不含入门套件的新 Laravel 应用，可以使用 Composer 手动安装 Laravel Breeze：

```shell
composer require laravel/breeze --dev
```

Composer 安装完 Laravel Breeze 包后，你应运行 `breeze:install` Artisan 命令。该命令会把认证视图、路由、控制器及其他资源发布到你的应用中。Laravel Breeze 会把全部代码发布到你的应用里，让你可以完全掌控和查看它的功能与实现。

`breeze:install` 命令会提示你选择偏好的前端技术栈和测试框架：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

<a name="breeze-and-blade"></a>
### Breeze 与 Blade

Breeze 默认的"技术栈"是 Blade 技术栈，它使用简单的 [Blade 模板](/docs/{{version}}/blade)渲染应用的前端。调用 `breeze:install` 命令时如果不带其他附加参数并选择 Blade 前端技术栈，即可安装 Blade 技术栈。装好 Breeze 脚手架后，你还应编译应用的前端资源：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

接下来，你可以在 Web 浏览器中访问应用的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

> [!NOTE]
> 想了解更多关于编译应用 CSS 和 JavaScript 的信息，请查阅 Laravel 的 [Vite 文档](/docs/{{version}}/vite#running-vite)。

<a name="breeze-and-livewire"></a>
### Breeze 与 Livewire

Laravel Breeze 还提供 [Livewire](https://livewire.laravel.com) 脚手架。Livewire 让你仅用 PHP 就能构建动态、响应式的前端 UI。

Livewire 非常适合主要使用 Blade 模板、并希望获得比 Vue、React 这类 JavaScript 驱动 SPA 框架更简单替代方案的团队。

要使用 Livewire 技术栈，可以在执行 `breeze:install` Artisan 命令时选择 Livewire 前端技术栈。装好 Breeze 脚手架后，你应运行数据库迁移：

```shell
php artisan breeze:install

php artisan migrate
```

<a name="breeze-and-inertia"></a>
### Breeze 与 React / Vue

Laravel Breeze 还通过 [Inertia](https://inertiajs.com) 前端实现提供 React 和 Vue 脚手架。Inertia 让你使用经典的服务端路由和控制器来构建现代化的单页 React 和 Vue 应用。

Inertia 让你同时享受 React 和 Vue 的前端能力、Laravel 惊人的后端生产力，以及 [Vite](https://vitejs.dev) 闪电般的编译速度。要使用 Inertia 技术栈，可以在执行 `breeze:install` Artisan 命令时选择 Vue 或 React 前端技术栈。

选择 Vue 或 React 前端技术栈时，Breeze 安装器还会提示你决定是否启用 [Inertia SSR](https://inertiajs.com/server-side-rendering)或 TypeScript 支持。装好 Breeze 脚手架后，你还应编译应用的前端资源：

```shell
php artisan breeze:install

php artisan migrate
npm install
npm run dev
```

接下来，你可以在 Web 浏览器中访问应用的 `/login` 或 `/register` URL。Breeze 的所有路由都定义在 `routes/auth.php` 文件中。

<a name="breeze-and-next"></a>
### Breeze 与 Next.js / API

Laravel Breeze 还能脚手架生成一套认证 API，可直接用于认证由 [Next](https://nextjs.org)、[Nuxt](https://nuxt.com) 等技术驱动的现代 JavaScript 应用。要开始使用，在执行 `breeze:install` Artisan 命令时选择 API 技术栈：

```shell
php artisan breeze:install

php artisan migrate
```

安装过程中，Breeze 会向应用的 `.env` 文件中添加一个 `FRONTEND_URL` 环境变量。该 URL 应当是你的 JavaScript 应用的 URL，本地开发时通常是 `http://localhost:3000`。此外，你应确保 `APP_URL` 被设置为 `http://localhost:8000`，这是 `serve` Artisan 命令默认使用的 URL。

<a name="next-reference-implementation"></a>
#### Next.js 参考实现

最后，你就可以为这个后端搭配你心仪的前端了。Breeze 前端的 Next 参考实现已[在 GitHub 上开源](https://github.com/laravel/breeze-next)。该前端由 Laravel 维护，包含与 Breeze 提供的传统 Blade 和 Inertia 技术栈相同的用户界面。

<a name="laravel-jetstream"></a>
## Laravel Jetstream

Laravel Breeze 为构建 Laravel 应用提供了简单而精简的起点，而 Jetstream 则在此基础上补充了更强大的功能和更多前端技术栈。**对于刚接触 Laravel 的朋友，我们建议先用 Laravel Breeze 熟悉基本功，再过渡到 Laravel Jetstream。**

Jetstream 为 Laravel 提供了设计精美的应用脚手架，涵盖登录、注册、邮箱验证、双因素认证、会话管理、通过 Laravel Sanctum 实现的 API 支持，以及可选的团队管理功能。Jetstream 使用 [Tailwind CSS](https://tailwindcss.com) 设计，并允许你选择 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 驱动的前端脚手架。

有关安装 Laravel Jetstream 的完整文档，请查阅 [Jetstream 官方文档](https://jetstream.laravel.com)。
