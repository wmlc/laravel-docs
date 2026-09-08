# Laravel Octane

- [简介](#introduction)
- [安装](#installation)
- [服务器前提条件](#server-prerequisites)
    - [FrankenPHP](#frankenphp)
    - [RoadRunner](#roadrunner)
    - [Swoole](#swoole)
- [为应用提供服务](#serving-your-application)
    - [通过 HTTPS 为应用提供服务](#serving-your-application-via-https)
    - [通过 Nginx 为应用提供服务](#serving-your-application-via-nginx)
    - [监听文件变更](#watching-for-file-changes)
    - [指定 Worker 数量](#specifying-the-worker-count)
    - [指定最大请求数](#specifying-the-max-request-count)
    - [指定最大执行时间](#specifying-the-max-execution-time)
    - [重载 Worker](#reloading-the-workers)
    - [停止服务器](#stopping-the-server)
- [依赖注入与 Octane](#dependency-injection-and-octane)
    - [容器注入](#container-injection)
    - [请求注入](#request-injection)
    - [配置仓库注入](#configuration-repository-injection)
- [管理内存泄漏](#managing-memory-leaks)
- [并发任务](#concurrent-tasks)
- [Tick 与定时器](#ticks-and-intervals)
- [Octane 缓存](#the-octane-cache)
- [表](#tables)

<a name="introduction"></a>
## 简介

[Laravel Octane](https://github.com/laravel/octane) 通过高性能应用服务器（包括 [FrankenPHP](https://frankenphp.dev/)、[Open Swoole](https://openswoole.com/)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)）为你的应用提供服务，从而大幅提升应用性能。Octane 只需启动应用一次，将其保留在内存中，然后以极高的速度处理请求。

<a name="installation"></a>
## 安装

可以通过 Composer 包管理器安装 Octane：

```shell
composer require laravel/octane
```

安装 Octane 后，你可以执行 `octane:install` Artisan 命令，它会把 Octane 的配置文件安装到你的应用中：

```shell
php artisan octane:install
```

<a name="server-prerequisites"></a>
## 服务器前提条件

<a name="frankenphp"></a>
### FrankenPHP

[FrankenPHP](https://frankenphp.dev) 是一个用 Go 编写的 PHP 应用服务器，支持早期提示（early hints）、Brotli 和 Zstandard 压缩等现代 Web 特性。当你安装 Octane 并选择 FrankenPHP 作为服务器时，Octane 会自动为你下载并安装 FrankenPHP 二进制文件。

<a name="frankenphp-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 FrankenPHP

如果你打算使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应运行以下命令来安装 Octane 和 FrankenPHP：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane
```

接下来，你应该使用 `octane:install` Artisan 命令安装 FrankenPHP 二进制文件：

```shell
./vendor/bin/sail artisan octane:install --server=frankenphp
```

最后，在应用的 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量包含 Sail 将要使用的命令，让应用改用 Octane 而非 PHP 开发服务器来提供服务：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=frankenphp --host=0.0.0.0 --admin-port=2019 --port='${APP_PORT:-80}'" # [tl! add]
      XDG_CONFIG_HOME:  /var/www/html/config # [tl! add]
      XDG_DATA_HOME:  /var/www/html/data # [tl! add]
```

要启用 HTTPS、HTTP/2 和 HTTP/3，请改为应用以下修改：

```yaml
services:
  laravel.test:
    ports:
        - '${APP_PORT:-80}:80'
        - '${VITE_PORT:-5173}:${VITE_PORT:-5173}'
        - '443:443' # [tl! add]
        - '443:443/udp' # [tl! add]
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --host=localhost --port=443 --admin-port=2019 --https" # [tl! add]
      XDG_CONFIG_HOME:  /var/www/html/config # [tl! add]
      XDG_DATA_HOME:  /var/www/html/data # [tl! add]
```

通常，你应该通过 `https://localhost` 访问基于 FrankenPHP 的 Sail 应用，因为使用 `https://127.0.0.1` 需要额外配置，且[不被推荐](https://frankenphp.dev/docs/known-issues/#using-https127001-with-docker)。

<a name="frankenphp-via-docker"></a>
#### 通过 Docker 使用 FrankenPHP

使用 FrankenPHP 官方 Docker 镜像可以获得更好的性能，并能使用 FrankenPHP 静态安装中未包含的额外扩展。此外，官方 Docker 镜像还支持在 FrankenPHP 原生不支持的平台（如 Windows）上运行。FrankenPHP 的官方 Docker 镜像既适合本地开发，也适合生产环境使用。

你可以将以下 Dockerfile 作为容器化基于 FrankenPHP 的 Laravel 应用的起点：

```dockerfile
FROM dunglas/frankenphp

RUN install-php-extensions \
    pcntl
    # 在这里添加其他 PHP 扩展...

COPY . /app

ENTRYPOINT ["php", "artisan", "octane:frankenphp"]
```

然后，在开发过程中，你可以使用以下 Docker Compose 文件来运行应用：

```yaml
# compose.yaml
services:
  frankenphp:
    build:
      context: .
    entrypoint: php artisan octane:frankenphp --workers=1 --max-requests=1
    ports:
      - "8000:8000"
    volumes:
      - .:/app
```

如果向 `php artisan octane:start` 命令显式传递 `--log-level` 选项，Octane 将使用 FrankenPHP 的原生日志器，并且除非另行配置，否则会输出结构化的 JSON 日志。

关于使用 Docker 运行 FrankenPHP 的更多信息，你可以查阅 [FrankenPHP 官方文档](https://frankenphp.dev/docs/docker/)。

<a name="frankenphp-caddyfile"></a>
#### 自定义 Caddyfile 配置

使用 FrankenPHP 时，你可以在启动 Octane 时通过 `--caddyfile` 选项指定自定义的 Caddyfile：

```shell
php artisan octane:start --server=frankenphp --caddyfile=/path/to/your/Caddyfile
```

这样你就可以在默认设置之外自定义 FrankenPHP 的配置，比如添加自定义中间件、配置高级路由或设置自定义指令。关于 Caddyfile 语法和配置选项的更多信息，你可以查阅 [Caddy 官方文档](https://caddyserver.com/docs/caddyfile)。

<a name="roadrunner"></a>
### RoadRunner

[RoadRunner](https://roadrunner.dev) 由使用 Go 构建的 RoadRunner 二进制文件驱动。首次启动基于 RoadRunner 的 Octane 服务器时，Octane 会提示为你下载并安装 RoadRunner 二进制文件。

<a name="roadrunner-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 RoadRunner

如果你打算使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应运行以下命令来安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner-cli spiral/roadrunner-http
```

接下来，你应该启动一个 Sail shell，并使用 `rr` 可执行文件获取最新版本的基于 Linux 的 RoadRunner 二进制文件：

```shell
./vendor/bin/sail shell

# 在 Sail shell 中...
./vendor/bin/rr get-binary
```

然后，在应用的 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量包含 Sail 将要使用的命令，让应用改用 Octane 而非 PHP 开发服务器来提供服务：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=roadrunner --host=0.0.0.0 --rpc-port=6001 --port='${APP_PORT:-80}'" # [tl! add]
```

最后，确保 `rr` 二进制文件可执行，并构建你的 Sail 镜像：

```shell
chmod +x ./rr

./vendor/bin/sail build --no-cache
```

<a name="swoole"></a>
### Swoole

如果你打算使用 Swoole 应用服务器为 Laravel Octane 应用提供服务，必须安装 Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install swoole
```

<a name="openswoole"></a>
#### Open Swoole

如果你想使用 Open Swoole 应用服务器为 Laravel Octane 应用提供服务，必须安装 Open Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install openswoole
```

将 Laravel Octane 与 Open Swoole 配合使用，可以获得与 Swoole 相同的功能，例如并发任务、tick 和定时器。

<a name="swoole-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 Swoole

> [!WARNING]
> 在通过 Sail 为 Octane 应用提供服务之前，请确保你使用的是最新版本的 Laravel Sail，并在应用的根目录下执行 `./vendor/bin/sail build --no-cache`。

另外，你也可以使用 [Laravel Sail](/docs/{{version}}/sail)（Laravel 官方基于 Docker 的开发环境）来开发基于 Swoole 的 Octane 应用。Laravel Sail 默认包含 Swoole 扩展。不过，你仍需调整 Sail 使用的 `docker-compose.yml` 文件。

首先，在应用的 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。这个环境变量包含 Sail 将要使用的命令，让应用改用 Octane 而非 PHP 开发服务器来提供服务：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=swoole --host=0.0.0.0 --port='${APP_PORT:-80}'" # [tl! add]
```

最后，构建你的 Sail 镜像：

```shell
./vendor/bin/sail build --no-cache
```

<a name="swoole-configuration"></a>
#### Swoole 配置

Swoole 支持一些额外的配置选项，如有需要，你可以将它们添加到应用的 `octane` 配置文件中。由于这些选项很少需要修改，默认配置文件中没有包含它们：

```php
'swoole' => [
    'options' => [
        'log_file' => storage_path('logs/swoole_http.log'),
        'package_max_length' => 10 * 1024 * 1024,
    ],
],
```

<a name="serving-your-application"></a>
## 为应用提供服务

可以通过 `octane:start` Artisan 命令启动 Octane 服务器。默认情况下，该命令会使用应用的 `octane` 配置文件中 `server` 配置选项指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此你可以在浏览器中通过 `http://localhost:8000` 访问你的应用。

<a name="keeping-octane-running-in-production"></a>
#### 让 Octane 在生产环境中持续运行

如果你要将 Octane 应用部署到生产环境，应使用 Supervisor 之类的进程监控工具，确保 Octane 服务器保持运行。Octane 的 Supervisor 示例配置文件可能如下所示：

```ini
[program:octane]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/example.com/artisan octane:start --server=frankenphp --host=127.0.0.1 --port=8000
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/example.com/storage/logs/octane.log
stopwaitsecs=3600
```

<a name="serving-your-application-via-https"></a>
### 通过 HTTPS 为应用提供服务

默认情况下，通过 Octane 运行的应用生成的前缀为 `http://` 的链接。当通过 HTTPS 为应用提供服务时，可以将应用 `config/octane.php` 配置文件中使用的 `OCTANE_HTTPS` 环境变量设置为 `true`。当该配置值设置为 `true` 时，Octane 会指示 Laravel 为所有生成的链接加上 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

<a name="serving-your-application-via-nginx"></a>
### 通过 Nginx 为应用提供服务

> [!NOTE]
> 如果你还没准备好管理自己的服务器配置，或不熟悉配置运行一个稳健的 Laravel Octane 应用所需的各种服务，可以了解一下 [Laravel Cloud](https://cloud.laravel.com)，它提供完全托管的 Laravel Octane 支持。

在生产环境中，你应该将 Octane 应用部署在 Nginx 或 Apache 等传统 Web 服务器之后。这样，Web 服务器就可以提供图片和样式表等静态资源，并负责 SSL 证书的终止处理。

在下面的 Nginx 配置示例中，Nginx 会提供站点的静态资源，并将请求代理到运行在 8000 端口的 Octane 服务器：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name domain.com;
    server_tokens off;
    root /home/forge/domain.com/public;

    index index.php;

    charset utf-8;

    location /index.php {
        try_files /not_exists @octane;
    }

    location / {
        try_files $uri $uri/ @octane;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/domain.com-error.log error;

    error_page 404 /index.php;

    location @octane {
        set $suffix "";

        if ($uri = /index.php) {
            set $suffix ?$query_string;
        }

        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_pass http://127.0.0.1:8000$suffix;
    }
}
```

<a name="watching-for-file-changes"></a>
### 监听文件变更

由于 Octane 服务器启动时应用只被加载到内存中一次，应用文件的任何变更都不会在刷新浏览器后生效。例如，添加到 `routes/web.php` 文件中的路由定义，在服务器重启之前不会生效。为方便起见，你可以使用 `--watch` 标志，指示 Octane 在应用内任何文件发生变更时自动重启服务器：

```shell
php artisan octane:start --watch
```

使用此功能之前，你应确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你还应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监听库：

```shell
npm install --save-dev chokidar
```

你可以使用应用的 `config/octane.php` 配置文件中的 `watch` 配置选项，配置需要监听的目录和文件。

<a name="specifying-the-worker-count"></a>
### 指定 Worker 数量

默认情况下，Octane 会为机器的每个 CPU 核心启动一个应用请求 worker。这些 worker 随后用于处理进入应用的 HTTP 请求。你可以在调用 `octane:start` 命令时，使用 `--workers` 选项手动指定要启动的 worker 数量：

```shell
php artisan octane:start --workers=4
```

如果你使用的是 Swoole 应用服务器，还可以指定要启动的[「任务 worker」](#concurrent-tasks)数量：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

<a name="specifying-the-max-request-count"></a>
### 指定最大请求数

为帮助防止偶发的内存泄漏，Octane 会在任何 worker 处理 500 个请求后对其进行优雅重启。你可以使用 `--max-requests` 选项来调整这个数值：

```shell
php artisan octane:start --max-requests=250
```

<a name="specifying-the-max-execution-time"></a>
### 指定最大执行时间

默认情况下，Laravel Octane 通过应用 `config/octane.php` 配置文件中的 `max_execution_time` 选项，为传入请求设置 30 秒的最大执行时间：

```php
'max_execution_time' => 30,
```

此设置定义了传入请求在被终止之前允许执行的最大秒数。将该值设置为 `0` 将完全禁用执行时间限制。这个配置选项对于处理长时间运行请求的应用（如文件上传、数据处理或调用外部服务的 API）尤其有用。

> [!WARNING]
> 修改 `max_execution_time` 配置后，必须重启 Octane 服务器才能使更改生效。

<a name="reloading-the-workers"></a>
### 重载 Worker

你可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用 worker。通常，这应在部署之后执行，以便将新部署的代码加载到内存中并用于处理后续请求：

```shell
php artisan octane:reload
```

<a name="stopping-the-server"></a>
### 停止服务器

你可以使用 `octane:stop` Artisan 命令停止 Octane 服务器：

```shell
php artisan octane:stop
```

<a name="checking-the-server-status"></a>
#### 检查服务器状态

你可以使用 `octane:status` Artisan 命令检查 Octane 服务器的当前状态：

```shell
php artisan octane:status
```

<a name="dependency-injection-and-octane"></a>
## 依赖注入与 Octane

由于 Octane 只启动应用一次，并在处理请求期间将其保留在内存中，构建应用时有几点需要特别注意。例如，应用的服务提供者（Service Provider）的 `register` 和 `boot` 方法只会在请求 worker 初次启动时执行一次。在后续请求中，将复用同一个应用实例。

有鉴于此，将应用服务容器或请求注入到任何对象的构造函数中时，你都应格外小心。否则在后续请求中，该对象持有的容器或请求可能会是过期的版本。

Octane 会自动处理请求之间第一方框架状态的重置。然而，Octane 并不总能知道如何重置由你的应用创建的全局状态。因此，你应当了解如何以对 Octane 友好的方式构建应用。下面，我们将讨论使用 Octane 时最常出现问题的场景。

<a name="container-injection"></a>
### 容器注入

一般来说，应避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，下面的绑定将整个应用服务容器注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app);
    });
}
```

在这个例子中，如果 `Service` 实例在应用启动过程中被解析，容器就会被注入到该服务中，并且在后续请求中，`Service` 实例将一直持有那个容器。这对你的应用来说**可能**不是问题；但是，这可能导致容器意外缺失在启动周期后期或后续请求中添加的绑定。

作为一种变通方案，你可以停止以单例方式注册该绑定，或者向服务注入一个容器解析器闭包，让它始终解析当前的容器实例：

```php
use App\Service;
use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app);
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance());
});
```

全局 `app` 辅助函数和 `Container::getInstance()` 方法将始终返回最新版本的应用容器。

<a name="request-injection"></a>
### 请求注入

一般来说，应避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，下面的绑定将整个请求实例注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app['request']);
    });
}
```

在这个例子中，如果 `Service` 实例在应用启动过程中被解析，HTTP 请求就会被注入到该服务中，并且在后续请求中，`Service` 实例将一直持有那个请求。因此，所有的请求头、输入和查询字符串数据，以及所有其他请求数据，都会是错误的。

作为一种变通方案，你可以停止以单例方式注册该绑定，或者向服务注入一个请求解析器闭包，让它始终解析当前的请求实例。或者，最推荐的做法是简单地在运行时，将你的对象所需的特定请求信息传递给该对象的某个方法：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app['request']);
});

$this->app->singleton(Service::class, function (Application $app) {
    return new Service(fn () => $app['request']);
});

// 或者...

$service->method($request->input('name'));
```

全局 `request` 辅助函数将始终返回应用当前正在处理的请求，因此在应用中使用是安全的。

> [!WARNING]
> 在控制器方法和路由闭包上对 `Illuminate\Http\Request` 实例进行类型提示是没有问题的。

<a name="configuration-repository-injection"></a>
### 配置仓库注入

一般来说，应避免将配置仓库实例注入到其他对象的构造函数中。例如，下面的绑定将配置仓库注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app->make('config'));
    });
}
```

在这个例子中，如果配置值在请求之间发生了变化，该服务将无法访问新的值，因为它依赖的是原始的仓库实例。

作为一种变通方案，你可以停止以单例方式注册该绑定，或者向该类注入一个配置仓库解析器闭包：

```php
use App\Service;
use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app->make('config'));
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance()->make('config'));
});
```

全局 `config` 将始终返回最新版本的配置仓库，因此在应用中使用是安全的。

<a name="managing-memory-leaks"></a>
### 管理内存泄漏

记住，Octane 会在请求之间将应用保留在内存中；因此，向一个静态维护的数组添加数据会导致内存泄漏。例如，下面的控制器就存在内存泄漏，因为对应用的每个请求都会不断向静态 `$data` 数组添加数据：

```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * 处理传入请求。
 */
public function index(Request $request): array
{
    Service::$data[] = Str::random(10);

    return [
        // ...
    ];
}
```

在构建应用时，你应特别注意避免创建这类内存泄漏。建议你在本地开发期间监控应用的内存使用情况，确保没有给应用引入新的内存泄漏。

<a name="concurrent-tasks"></a>
## 并发任务

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以通过轻量级后台任务并发执行操作。这可以使用 Octane 的 `concurrently` 方法来实现。你可以将该方法与 PHP 数组解构结合使用，来获取每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

由 Octane 处理的并发任务使用 Swoole 的"任务 worker"，并在与传入请求完全不同的进程中执行。可用于处理并发任务的 worker 数量由 `octane:start` 命令的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

调用 `concurrently` 方法时，由于 Swoole 任务系统的限制，提供的任务数量不应超过 1024 个。

<a name="ticks-and-intervals"></a>
## Tick 与定时器

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以注册每隔指定秒数执行一次的"tick"操作。你可以通过 `tick` 方法注册"tick"回调。`tick` 方法的第一个参数应是一个表示 tick 名称的字符串，第二个参数应是一个按指定间隔调用的可调用对象。

在这个例子中，我们将注册一个每 10 秒调用一次的闭包。通常，`tick` 方法应在应用某个服务提供者的 `boot` 方法中调用：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10);
```

使用 `immediate` 方法，你可以指示 Octane 在服务器初次启动时立即调用 tick 回调，之后每 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10)
    ->immediate();
```

<a name="the-octane-cache"></a>
## Octane 缓存

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以利用 Octane 缓存驱动，它提供高达每秒 200 万次操作的读写速度。因此，对于需要缓存层具备极高读写速度的应用来说，这个缓存驱动是一个极佳的选择。

这个缓存驱动由 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table)驱动。缓存中存储的所有数据可供服务器上的所有 worker 访问。但是，服务器重启时缓存数据将被清空：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> [!NOTE]
> Octane 缓存允许的最大条目数可以在应用的 `octane` 配置文件中定义。

<a name="cache-intervals"></a>
### 缓存定时刷新

除了 Laravel 缓存系统提供的常见方法之外，Octane 缓存驱动还具有基于间隔的缓存。这类缓存会按指定间隔自动刷新，并且应在应用某个服务提供者的 `boot` 方法中注册。例如，以下缓存将每 5 秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

<a name="tables"></a>
## 表

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以定义并操作自己的任意 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole 表提供极致的性能吞吐量，表中的数据可以被服务器上的所有 worker 访问。但是，服务器重启时表中的数据将会丢失。

表应在应用 `octane` 配置文件的 `tables` 配置数组中定义。配置文件中已经为你预先配置了一个最多允许 1000 行的示例表。字符串列的最大长度可以通过在列类型之后指定列的大小来配置，如下所示：

```php
'tables' => [
    'example:1000' => [
        'name' => 'string:1000',
        'votes' => 'int',
    ],
],
```

要访问表，你可以使用 `Octane::table` 方法：

```php
use Laravel\Octane\Facades\Octane;

Octane::table('example')->set('uuid', [
    'name' => 'Nuno Maduro',
    'votes' => 1000,
]);

return Octane::table('example')->get('uuid');
```

> [!WARNING]
> Swoole 表支持的列类型有：`string`、`int` 和 `float`。
