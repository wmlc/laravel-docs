# 部署

## 简介

当你准备将 Laravel 应用部署到生产环境时，可以采取一些重要措施来确保应用以尽可能高的效率运行。在本文中，我们将介绍一些确保你的 Laravel 应用得到妥善部署的良好起点。

## 服务器要求

Laravel 框架有一些系统要求。你应当确保 Web 服务器具备以下最低的 PHP 版本与扩展：

- PHP >= 8.3
- Ctype PHP Extension
- cURL PHP Extension
- DOM PHP Extension
- Fileinfo PHP Extension
- Filter PHP Extension
- Hash PHP Extension
- Mbstring PHP Extension
- OpenSSL PHP Extension
- PCRE PHP Extension
- PDO PHP Extension
- Session PHP Extension
- Tokenizer PHP Extension
- XML PHP Extension

## 服务器配置

### Nginx

如果你要将应用部署到运行 Nginx 的服务器上，可以使用以下配置文件作为配置 Web 服务器的起点。根据你的服务器配置，这个文件很可能需要进行自定义。**如果你希望获得管理服务器的帮助，可以考虑使用像 [Laravel Cloud](https://cloud.laravel.com) 这样的全托管 Laravel 平台。**

请确保像下面的配置那样，你的 Web 服务器将所有请求都指向应用的 `public/index.php` 文件。你绝不应尝试将 `index.php` 文件移动到项目的根目录，因为从项目根目录提供应用服务会将许多敏感的配置文件暴露在公共互联网上：

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
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffer_size 32k;
        fastcgi_buffers 8 32k;
        fastcgi_busy_buffers_size 64k;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### FrankenPHP

[FrankenPHP](https://frankenphp.dev/) 也可用于为你的 Laravel 应用提供服务。FrankenPHP 是一个使用 Go 编写的现代化 PHP 应用服务器。要使用 FrankenPHP 为 Laravel PHP 应用提供服务，只需调用其 `php-server` 命令：

```shell
frankenphp php-server -r public/
```

要利用 FrankenPHP 支持的更强大的特性，例如其 [Laravel Octane](/topic/Laravel%2013.x/d6vro1rv3g.html) 集成、HTTP/3、现代压缩，或者将 Laravel 应用打包为独立二进制文件的能力，请参阅 FrankenPHP 的 [Laravel 文档](https://frankenphp.dev/docs/laravel/)。

### 目录权限

Laravel 需要向 `bootstrap/cache` 和 `storage` 目录写入数据，因此你应当确保 Web 服务器进程的所有者拥有写入这些目录的权限。

## 优化

在将应用部署到生产环境时，有多种文件应当被缓存，包括配置、事件、路由和视图。Laravel 提供了一个便捷统一的 `optimize` Artisan 命令来缓存所有这些文件。该命令通常应作为应用部署流程的一部分被调用：

```shell
php artisan optimize
```

`optimize:clear` 方法可用于移除 `optimize` 命令生成的所有缓存文件，以及默认缓存驱动中的所有键：

```shell
php artisan optimize:clear
```

在下文中，我们将讨论 `optimize` 命令所执行的各个细粒度优化命令。

### 缓存配置

在将应用部署到生产环境时，你应当确保在部署流程中运行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

该命令会将 Laravel 的所有配置文件合并到一个缓存文件中，从而大幅减少框架在加载配置值时访问文件系统的次数。

> [!WARNING]
> 如果你在部署流程中执行了 `config:cache` 命令，应当确保只在配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件将不会被加载，所有针对 `.env` 变量的 `env` 函数调用都将返回 `null`。

### 缓存事件

在部署流程中，你应当缓存应用自动发现的"事件到监听器"映射。这可以通过在部署时调用 `event:cache` Artisan 命令来完成：

```shell
php artisan event:cache
```

### 缓存路由

如果你正在构建一个包含大量路由的大型应用，应当确保在部署流程中运行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

该命令会将你所有的路由注册缩减为缓存文件中的单次方法调用，从而在注册成百上千个路由时提升路由注册的性能。

### 缓存视图

在将应用部署到生产环境时，你应当确保在部署流程中运行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

该命令会预编译你所有的 Blade 视图，使它们无需按需编译，从而提升每个返回视图的请求的性。

## 重载服务

> [!NOTE]
> 在部署到 [Laravel Cloud](https://cloud.laravel.com) 时，无需使用 `reload` 命令，因为所有服务的优雅重载都会自动处理。

部署新版本的应用后，任何长期运行的服务（例如队列 worker、Laravel Reverb 或 Laravel Octane）都应当被重载 / 重启，以使用新代码。Laravel 提供了一个统一的 `reload` Artisan 命令来终止这些服务：

```shell
php artisan reload
```

如果你没有使用 [Laravel Cloud](https://cloud.laravel.com)，应当手动配置一个进程监视器，它能够检测到可重载进程退出并自动重启它们。

## 调试模式

`config/app.php` 配置文件中的 debug 选项决定了向用户展示多少关于错误的信息。默认情况下，该选项会遵循存储在应用 `.env` 文件中的 `APP_DEBUG` 环境变量的值。

> [!WARNING]
> **在生产环境中，该值应始终为 `false`。如果在生产环境中将 `APP_DEBUG` 变量设置为 `true`，你将面临向应用最终用户暴露敏感配置值的风险。**

## 健康检查路由

Laravel 内置了一个健康检查路由，可用于监控应用的状态。在生产环境中，该路由可用于向正常运行时间监视器、负载均衡器或 Kubernetes 之类的编排系统报告应用状态。

默认情况下，健康检查路由在 `/up` 提供服务，如果应用在没有抛出异常的情况下完成了引导（bootstrap），则返回 200 HTTP 响应；否则返回 500 HTTP 响应。你可以在应用的 `bootstrap/app` 文件中配置该路由的 URI：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up', // [tl! remove]
    health: '/status', // [tl! add]
)
```

当向该路由发起 HTTP 请求时，Laravel 还会派发一个 `Illuminate\Foundation\Events\DiagnosingHealth` 事件，让你可以执行与应用相关的额外健康检查。在该事件的[监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)中，你可以检查应用的数据库或缓存状态。如果你检测到应用存在问题，只需从该监听器中抛出一个异常即可。

## 使用 Laravel Cloud 或 Forge 部署

### Laravel Cloud

如果你想要一个为 Laravel 量身打造、全托管且可自动扩容的部署平台，可以了解一下 [Laravel Cloud](https://cloud.laravel.com)。Laravel Cloud 是一个健壮的 Laravel 部署平台，提供托管的算力、数据库、缓存和对象存储。

在 Cloud 上启动你的 Laravel 应用，爱上这种可弹性扩容的简洁。Laravel Cloud 由 Laravel 的创造者精心调优，能够与框架无缝协作，让你能够继续像往常一样编写 Laravel 应用。

### Laravel Forge

如果你倾向于管理自己的服务器，但又不太习惯配置运行一个健壮 Laravel 应用所需的各种服务，[Laravel Forge](https://forge.laravel.com) 是一个面向 Laravel 应用的 VPS 服务器管理平台。

Laravel Forge 可以在各种基础设施提供商（如 DigitalOcean、Linode、AWS 等）上创建服务器。此外，Forge 还会安装并管理构建健壮 Laravel 应用所需的全部工具，例如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。
