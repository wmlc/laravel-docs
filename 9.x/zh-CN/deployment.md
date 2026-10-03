# 部署

- [简介](#introduction)
- [服务器要求](#server-requirements)
- [服务器配置](#server-configuration)
    - [Nginx](#nginx)
- [优化](#optimization)
    - [自动加载优化](#autoloader-optimization)
    - [优化配置加载](#optimizing-configuration-loading)
    - [优化路由加载](#optimizing-route-loading)
    - [优化视图加载](#optimizing-view-loading)
- [调试模式](#debug-mode)
- [使用 Forge / Vapor 部署](#deploying-with-forge-or-vapor)

<a name="introduction"></a>
## 简介

当准备好将 Laravel 应用部署到生产环境时，可以采取一些重要措施来确保应用尽可能高效运行。本文将介绍一些确保 Laravel 应用正确部署的要点。

<a name="server-requirements"></a>
## 服务器要求

Laravel 框架对系统有一些要求。应确保 Web 服务器满足以下最低 PHP 版本和扩展要求：

- PHP >= 8.0
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

<a name="server-configuration"></a>
## 服务器配置

<a name="nginx"></a>
### Nginx

如果将应用部署到运行 Nginx 的服务器上，可以使用以下配置文件作为配置 Web 服务器的起点。很可能需要根据服务器配置对此文件进行自定义。**如果需要服务器管理方面的帮助，可以考虑使用 Laravel 官方的服务器管理和部署服务，例如 [Laravel Forge](https://forge.laravel.com)。**

请确保与以下配置一样，Web 服务器将所有请求指向应用的 `public/index.php` 文件。切勿尝试将 `index.php` 文件移到项目根目录，因为从项目根目录提供服务会将许多敏感配置文件暴露在公共互联网上：

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

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

<a name="optimization"></a>
## 优化

<a name="autoloader-optimization"></a>
### 自动加载优化

部署到生产环境时，请确保优化 Composer 的类自动加载映射，以便 Composer 能快速找到给定类应加载的正确文件：

```shell
composer install --optimize-autoloader --no-dev
```

> **Note**  
> 除了优化自动加载器之外，还应始终确保在项目的源代码仓库中包含 `composer.lock` 文件。当存在 `composer.lock` 文件时，项目的依赖安装速度会快得多。

<a name="optimizing-configuration-loading"></a>
### 优化配置加载

将应用部署到生产环境时，应确保在部署过程中运行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

此命令会将 Laravel 的所有配置文件合并为一个缓存文件，从而大大减少框架加载配置值时访问文件系统的次数。

> **Warning**  
> 如果在部署过程中执行了 `config:cache` 命令，应确保只在配置文件中调用 `env` 函数。配置被缓存后，`.env` 文件将不再加载，所有针对 `.env` 变量调用 `env` 函数都将返回 `null`。

<a name="optimizing-route-loading"></a>
### 优化路由加载

如果构建的路由数量众多的大型应用，应确保在部署过程中运行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

此命令将所有路由注册缩减为缓存文件中的单个方法调用，从而提升注册数百条路由时的路由注册性能。

<a name="optimizing-view-loading"></a>
### 优化视图加载

将应用部署到生产环境时，应确保在部署过程中运行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

此命令会预编译所有 Blade 视图，使其无需按需编译，从而提升每个返回视图的请求的性能。

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 debug 选项决定了向用户显示多少错误信息。默认情况下，此选项遵循存储在应用 `.env` 文件中的 `APP_DEBUG` 环境变量的值。

**在生产环境中，此值应始终为 `false`。如果在生产环境中将 `APP_DEBUG` 变量设置为 `true`，将面临向应用最终用户暴露敏感配置值的风险。**

<a name="deploying-with-forge-or-vapor"></a>
## 使用 Forge / Vapor 部署

<a name="laravel-forge"></a>
#### Laravel Forge

如果尚未准备好自行管理服务器配置，或对配置运行健壮 Laravel 应用所需的各种服务感到不便，[Laravel Forge](https://forge.laravel.com) 是一个出色的替代方案。

Laravel Forge 可以在 DigitalOcean、Linode、AWS 等多种基础设施提供商上创建服务器。此外，Forge 会安装并管理构建健壮 Laravel 应用所需的所有工具，例如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。

> **Note**
> 想要获取使用 Laravel Forge 部署的完整指南？请查看 [Laravel Bootcamp](https://bootcamp.laravel.com/deploying) 和 Forge 的 [Laracasts 视频系列](https://laracasts.com/series/learn-laravel-forge-2022-edition)。

<a name="laravel-vapor"></a>
#### Laravel Vapor

如果想要一个完全无服务器、自动伸缩且专为 Laravel 调优的部署平台，请查看 [Laravel Vapor](https://vapor.laravel.com)。Laravel Vapor 是基于 AWS 的 Laravel 无服务器部署平台。在 Vapor 上启动 Laravel 基础设施，体验无服务器的可扩展简洁之美。Laravel Vapor 由 Laravel 创建者精心调优，可与框架无缝协作，因此可以一如既往地编写 Laravel 应用。
