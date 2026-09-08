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
- [重载服务](#reloading-services)
- [调试模式](#debug-mode)
- [健康检查路由](#the-health-route)
- [使用 Laravel Cloud 或 Forge 部署](#deploying-with-cloud-or-forge)

<a name="introduction"></a>
## 简介

当你准备将 Laravel 应用部署到生产环境时，可以做一些重要的事情，确保应用尽可能高效地运行。本文将介绍确保 Laravel 应用正确部署的一些重要起点。

<a name="server-requirements"></a>
## 服务器要求

Laravel 框架有一些系统要求。你应确保 Web 服务器满足以下最低 PHP 版本和扩展要求：

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

<a name="server-configuration"></a>
## 服务器配置

<a name="nginx"></a>
### Nginx

如果你将应用部署到运行 Nginx 的服务器上，可以使用以下配置文件作为配置 Web 服务器的起点。多数情况下，你需要根据服务器的具体配置对该文件进行自定义。**如果需要服务器管理方面的协助，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com) 这类全托管的 Laravel 平台。**

请确保像下面的配置一样，Web 服务器将所有请求导向应用的 `public/index.php` 文件。切勿尝试将 `index.php` 文件移到项目根目录，因为从项目根目录对外提供应用服务，会向公共互联网暴露许多敏感的配置文件：

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

也可以使用 [FrankenPHP](https://frankenphp.dev/) 来托管 Laravel 应用。FrankenPHP 是一个用 Go 编写的现代 PHP 应用服务器。要使用 FrankenPHP 托管 Laravel PHP 应用，只需执行它的 `php-server` 命令：

```shell
frankenphp php-server -r public/
```

想利用 FrankenPHP 支持的更强大的特性，例如其 [Laravel Octane](/docs/{{version}}/octane) 集成、HTTP/3、现代压缩算法，或将 Laravel 应用打包为独立二进制文件的能力，请查阅 FrankenPHP 的 [Laravel 文档](https://frankenphp.dev/docs/laravel/)。

<a name="directory-permissions"></a>
### 目录权限

Laravel 需要向 `bootstrap/cache` 和 `storage` 目录写入文件，因此你应确保 Web 服务器进程的所有者拥有这些目录的写入权限。

<a name="optimization"></a>
## 优化

将应用部署到生产环境时，有多种文件应当被缓存，包括配置、事件、路由和视图。Laravel 提供了一个便捷的 `optimize` Artisan 命令，可以将所有这些文件缓存起来。通常，应将此命令纳入应用的部署流程中执行：

```shell
php artisan optimize
```

`optimize:clear` 命令可用于移除 `optimize` 命令生成的所有缓存文件，以及默认缓存驱动中的所有键：

```shell
php artisan optimize:clear
```

在下面的文档中，我们将逐一讨论 `optimize` 命令所执行的各项细粒度优化命令。

<a name="optimizing-configuration-loading"></a>
### 缓存配置

将应用部署到生产环境时，应确保在部署流程中执行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

此命令会将 Laravel 的所有配置文件合并为一个缓存文件，从而大幅减少框架加载配置值时访问文件系统的次数。

> [!WARNING]
> 如果在部署流程中执行了 `config:cache` 命令，应确保只在配置文件中调用 `env` 函数。配置被缓存后，`.env` 文件将不再加载，所有对 `.env` 变量调用 `env` 函数的地方都将返回 `null`。

<a name="caching-events"></a>
### 缓存事件

你应在部署流程中缓存应用自动发现的事件与监听器的映射关系。这可以通过在部署时执行 `event:cache` Artisan 命令来完成：

```shell
php artisan event:cache
```

<a name="optimizing-route-loading"></a>
### 缓存路由

如果你正在构建包含大量路由的大型应用，应确保在部署流程中执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

此命令将所有路由注册缩减为缓存文件中的单个方法调用，在注册数百个路由时能提升路由注册的性能。

<a name="optimizing-view-loading"></a>
### 缓存视图

将应用部署到生产环境时，应确保在部署流程中执行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

此命令会预编译所有 Blade 视图，使视图不再按需编译，从而提升每个返回视图的请求的性能。

<a name="reloading-services"></a>
## 重载服务

> [!NOTE]
> 部署到 [Laravel Cloud](https://cloud.laravel.com) 时，无需使用 `reload` 命令，所有服务的优雅重载都会自动处理。

部署应用的新版本后，所有长时间运行的服务（如队列工作者、Laravel Reverb 或 Laravel Octane）都应重载或重启，以使用新代码。Laravel 提供了一个 `reload` Artisan 命令来终止这些服务：

```shell
php artisan reload
```

如果你没有使用 [Laravel Cloud](https://cloud.laravel.com)，则应手动配置一个进程监控器，用于检测可重载进程的退出并自动重启它们。

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 debug 选项决定了向用户实际展示多少错误信息。默认情况下，该选项会遵循 `APP_DEBUG` 环境变量的值，该变量存储在应用的 `.env` 文件中。

> [!WARNING]
> **在生产环境中，该值应始终为 `false`。如果在生产环境中将 `APP_DEBUG` 变量设置为 `true`，你将面临向应用的最终用户暴露敏感配置值的风险。**

<a name="the-health-route"></a>
## 健康检查路由

Laravel 内置了一个健康检查路由，可用于监控应用的状态。在生产环境中，你可以用这个路由向可用性监控器、负载均衡器或 Kubernetes 等编排系统上报应用的状态。

默认情况下，健康检查路由位于 `/up`，如果应用启动过程没有抛出异常，该路由将返回 200 HTTP 响应；否则将返回 500 HTTP 响应。你可以在应用的 `bootstrap/app` 文件中配置该路由的 URI：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up', // [tl! remove]
    health: '/status', // [tl! add]
)
```

当有 HTTP 请求访问该路由时，Laravel 还会分发一个 `Illuminate\Foundation\Events\DiagnosingHealth` 事件，让你能够执行与应用相关的额外健康检查。在该事件的[监听器](/docs/{{version}}/events)中，你可以检查应用的数据库或缓存状态。如果检测到应用存在问题，只需在监听器中抛出异常即可。

<a name="deploying-with-cloud-or-forge"></a>
## 使用 Laravel Cloud 或 Forge 部署

<a name="laravel-cloud"></a>
#### Laravel Cloud

如果你希望有一个为 Laravel 量身打造、可自动扩缩的全托管部署平台，请了解 [Laravel Cloud](https://cloud.laravel.com)。Laravel Cloud 是一个稳健的 Laravel 部署平台，提供托管的计算、数据库、缓存和对象存储。

把你的 Laravel 应用部署到 Cloud 上，感受可扩展的简单之美。Laravel Cloud 由 Laravel 的创作者精心调优，与框架无缝协作，让你能够一如既往地编写 Laravel 应用。

<a name="laravel-forge"></a>
#### Laravel Forge

如果你更愿意自己管理服务器，却又不擅长配置运行一个稳健的 Laravel 应用所需的各种服务，那么 [Laravel Forge](https://forge.laravel.com) 是一个面向 Laravel 应用的 VPS 服务器管理平台。

Laravel Forge 可以在 DigitalOcean、Linode、AWS 等各种基础设施提供商上创建服务器。此外，Forge 还会安装并管理构建稳健 Laravel 应用所需的所有工具，例如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。
