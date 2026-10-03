# 部署

- [简介](#introduction)
- [服务器要求](#server-requirements)
- [服务器配置](#server-configuration)
    - [Nginx](#nginx)
    - [FrankenPHP](#frankenphp)
    - [目录权限](#directory-permissions)
- [优化](#optimization)
    - [缓存配置](#optimizing-configuration-loading)
    - [缓存事件](#caching-events)
    - [缓存路由](#optimizing-route-loading)
    - [缓存视图](#optimizing-view-loading)
- [调试模式](#debug-mode)
- [健康检查路由](#the-health-route)
- [使用 Forge / Vapor 轻松部署](#deploying-with-forge-or-vapor)

<a name="introduction"></a>
## 简介

当你准备把 Laravel 应用部署到生产环境时，有一些重要的事情可以帮助你确保应用尽可能高效地运行。本文档将介绍若干优秀的起点，帮助你正确部署 Laravel 应用。

<a name="server-requirements"></a>
## 服务器要求

Laravel 框架有一些系统要求。你应确保 Web 服务器具备以下最低 PHP 版本和扩展：

<div class="content-list" markdown="1">

- PHP >= 8.2
- Ctype PHP 扩展
- cURL PHP 扩展
- DOM PHP 扩展
- Fileinfo PHP 扩展
- Filter PHP 扩展
- Hash PHP 扩展
- Mbstring PHP 扩展
- OpenSSL PHP 扩展
- PCRE PHP 扩展
- PDO PHP 扩展
- Session PHP 扩展
- Tokenizer PHP 扩展
- XML PHP 扩展

</div>

<a name="server-configuration"></a>
## 服务器配置

<a name="nginx"></a>
### Nginx

如果你要把应用部署到运行 Nginx 的服务器，可以使用以下配置文件作为配置 Web 服务器的起点。多数情况下，你可能需要根据服务器配置对该文件进行调整。**如果你希望有人代为管理服务器，可以考虑使用 Laravel 官方推出的服务器管理与部署服务，例如 [Laravel Forge](https://forge.laravel.com)。**

请确保 Web 服务器像下面这样，把所有请求都指向应用的 `public/index.php` 文件。绝不要把 `index.php` 文件移动到项目根目录，因为从项目根目录提供应用会把大量敏感配置文件暴露给公共互联网：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    root /srv/example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

<a name="frankenphp"></a>
### FrankenPHP

[FrankenPHP](https://frankenphp.dev/) 也可以用来提供你的 Laravel 应用服务。FrankenPHP 是一个用 Go 编写的现代 PHP 应用服务器。要使用 FrankenPHP 提供 Laravel PHP 应用服务，只需调用它的 `php-server` 命令：

```shell
frankenphp php-server -r public/
```

想利用 FrankenPHP 支持的更强大功能（例如它的 [Laravel Octane](/docs/{{version}}/octane)集成、HTTP/3、现代压缩，以及把 Laravel 应用打包为独立二进制文件的能力），请查阅 FrankenPHP 的 [Laravel 文档](https://frankenphp.dev/docs/laravel/)。

<a name="directory-permissions"></a>
### 目录权限

Laravel 需要写入 `bootstrap/cache` 和 `storage` 目录，因此你应确保 Web 服务器进程的所有者拥有这些目录的写入权限。

<a name="optimization"></a>
## 优化

把应用部署到生产环境时，有多种文件应当缓存，包括配置、事件、路由和视图。Laravel 提供了一条简单便捷的 `optimize` Artisan 命令，可以缓存所有这些文件。该命令通常应作为应用部署流程的一部分执行：

```shell
php artisan optimize
```

`optimize:clear` 方法可用于删除 `optimize` 命令生成的所有缓存文件，以及默认缓存驱动中的所有键：

```shell
php artisan optimize:clear
```

接下来的文档中，我们会讨论 `optimize` 命令所执行的各个细粒度优化命令。

<a name="optimizing-configuration-loading"></a>
### 缓存配置

把应用部署到生产环境时，你应确保在部署流程中执行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

该命令会把 Laravel 的所有配置文件合并为单个缓存文件，从而大幅减少框架加载配置值时访问文件系统的次数。

> [!WARNING]
> 如果你在部署流程中执行了 `config:cache` 命令，请确保只在配置文件内部调用 `env` 函数。配置缓存完成后，`.env` 文件将不再被加载，所有针对 `.env` 变量的 `env` 函数调用都会返回 `null`。

<a name="caching-events"></a>
### 缓存事件

你应在部署流程中缓存应用自动发现的事件到监听器的映射。只需在部署时执行 `event:cache` Artisan 命令即可实现：

```shell
php artisan event:cache
```

<a name="optimizing-route-loading"></a>
### 缓存路由

如果你正在构建一个包含大量路由的大型应用，应确保在部署流程中执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

该命令把你所有的路由注册合并为缓存文件中的单次方法调用，从而在注册数百个路由时提升路由注册的性能。

<a name="optimizing-view-loading"></a>
### 缓存视图

把应用部署到生产环境时，你应确保在部署流程中执行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

该命令会预编译你所有的 Blade 视图，使它们不必按需编译，从而提升每个返回视图的请求的性能。

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 debug 选项决定了实际向用户显示多少错误信息。默认情况下，该选项会遵循 `APP_DEBUG` 环境变量的值，该值存储在应用的 `.env` 文件中。

> [!WARNING]
> **在生产环境中，该值应始终为 `false`。如果在生产环境中把 `APP_DEBUG` 变量设为 `true`，就有可能把敏感的配置值暴露给应用的最终用户。**

<a name="the-health-route"></a>
## 健康检查路由

Laravel 内置了一条可用于监控应用状态的健康检查路由。在生产环境中，你可以用这条路由把应用状态报告给可用性监控服务、负载均衡器或 Kubernetes 之类的编排系统。

默认情况下，健康检查路由在 `/up` 提供服务。如果应用启动时没有异常，它会返回 200 HTTP 响应；否则会返回 500 HTTP 响应。你可以在应用的 `bootstrap/app` 文件中配置该路由的 URI：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up', // [tl! remove]
    health: '/status', // [tl! add]
)
```

当该路由收到 HTTP 请求时，Laravel 还会派发 `Illuminate\Foundation\Events\DiagnosingHealth` 事件，让你执行与你的应用相关的额外健康检查。在该事件的[监听器](/docs/{{version}}/events)中，你可以检查应用的数据库或缓存状态。如果发现应用存在问题，可以直接从监听器中抛出异常。

<a name="deploying-with-forge-or-vapor"></a>
## 使用 Forge / Vapor 轻松部署

<a name="laravel-forge"></a>
#### Laravel Forge

如果你还没准备好管理自己的服务器配置，或者对配置运行健壮 Laravel 应用所需的各种服务感到棘手，那么 [Laravel Forge](https://forge.laravel.com) 是一个绝佳的替代方案。

Laravel Forge 可以在 DigitalOcean、Linode、AWS 等多种基础设施服务商上创建服务器。此外，Forge 会安装并管理构建健壮 Laravel 应用所需的所有工具，例如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。

> [!NOTE]
> 想了解使用 Laravel Forge 部署的完整指南？请查阅 [Laravel Bootcamp](https://bootcamp.laravel.com/deploying) 以及 Laracasts 上提供的 Forge [视频系列](https://laracasts.com/series/learn-laravel-forge-2022-edition)。

<a name="laravel-vapor"></a>
#### Laravel Vapor

如果你想要一个完全无服务器、可自动伸缩且为 Laravel 深度调优的部署平台，请了解 [Laravel Vapor](https://vapor.laravel.com)。Laravel Vapor 是由 AWS 驱动的 Laravel 无服务器部署平台。在 Vapor 上启动你的 Laravel 基础设施，然后爱上无服务器带来的可扩展性与简洁。Laravel Vapor 由 Laravel 的创建者精心调校，可与框架无缝协作，让你继续以习惯的方式编写 Laravel 应用。
