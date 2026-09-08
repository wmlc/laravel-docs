# Laravel Octane

- [简介](#introduction)
- [安装](#installation)
- [服务器先决条件](#server-prerequisites)
    - [FrankenPHP](#frankenphp)
    - [RoadRunner](#roadrunner)
    - [Swoole](#swoole)
- [运行你的应用](#serving-your-application)
    - [通过 HTTPS 运行你的应用](#serving-your-application-via-https)
    - [通过 Nginx 运行你的应用](#serving-your-application-via-nginx)
    - [监听文件变更](#watching-for-file-changes)
    - [指定工作进程数量](#specifying-the-worker-count)
    - [指定最大请求数量](#specifying-the-max-request-count)
    - [指定最大执行时间](#specifying-the-max-execution-time)
    - [重新加载工作进程](#reloading-the-workers)
    - [停止服务器](#stopping-the-server)
- [依赖注入与 Octane](#dependency-injection-and-octane)
    - [容器注入](#container-injection)
    - [请求注入](#request-injection)
    - [配置仓库注入](#configuration-repository-injection)
- [管理内存泄漏](#managing-memory-leaks)
- [并发任务](#concurrent-tasks)
- [Tick 与定时器](#ticks-and-intervals)
- [Octane 缓存](#the-octane-cache)
    - [缓存区间](#cache-intervals)
- [数据表](#tables)

<a name="introduction"></a>
## 简介

[Laravel Octane](https://github.com/laravel/octane) 通过使用高性能应用服务器（包括 [FrankenPHP](https://frankenphp.dev/)、[Open Swoole](https://openswoole.com/)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)）来运行你的应用，从而极大提升应用性能。Octane 会启动你的应用一次、将其保存在内存中，然后以超音速将请求馈送给它。

<a name="installation"></a>
## 安装

Octane 可以通过 Composer 包管理器安装：

```shell
composer require laravel/octane
```

安装 Octane 后，你可以执行 `octane:install` Artisan 命令，它会将 Octane 的配置文件安装到你的应用中：

```shell
php artisan octane:install
```

<a name="server-prerequisites"></a>
## 服务器先决条件

<a name="frankenphp"></a>
### FrankenPHP

[FrankenPHP](https://frankenphp.dev) 是一个用 Go 编写的 PHP 应用服务器，支持早期提示、Brotli 和 Zstandard 压缩等现代 Web 功能。当你安装 Octane 并选择 FrankenPHP 作为服务器时，Octane 会自动为你下载并安装 FrankenPHP 二进制文件。

<a name="frankenphp-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 FrankenPHP

如果你计划使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应运行以下命令安装 Octane 和 FrankenPHP：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane
```

接下来，你应使用 `octane:install` Artisan 命令安装 FrankenPHP 二进制文件：

```shell
./vendor/bin/sail artisan octane:install --server=frankenphp
```

最后，在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane（而非 PHP 开发服务器）运行应用的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=frankenphp --host=0.0.0.0 --admin-port=2019 --port='${APP_PORT:-80}'" # [tl! add]
      XDG_CONFIG_HOME:  /var/www/html/config # [tl! add]
      XDG_DATA_HOME:  /var/www/html/data # [tl! add]
```

要启用 HTTPS、HTTP/2 和 HTTP/3，请改用以下修改：

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

通常，你应该通过 `https://localhost` 访问你的 FrankenPHP Sail 应用，因为使用 `https://127.0.0.1` 需要额外配置，而且[不鼓励这样做](https://frankenphp.dev/docs/known-issues/#using-https127001-with-docker)。

<a name="frankenphp-via-docker"></a>
#### 通过 Docker 使用 FrankenPHP

使用 FrankenPHP 的官方 Docker 镜像可以获得更高的性能，并使用静态安装的 FrankenPHP 未包含的额外扩展。此外，官方 Docker 镜像还支持在 FrankenPHP 原生不支持的平台上运行它，例如 Windows。FrankenPHP 的官方 Docker 镜像既适合本地开发，也适合生产使用。

你可以使用以下 Dockerfile 作为容器化你的、由 FrankenPHP 驱动的 Laravel 应用的起点：

```dockerfile
FROM dunglas/frankenphp

RUN install-php-extensions \
    pcntl
    # Add other PHP extensions here...

COPY . /app

ENTRYPOINT ["php", "artisan", "octane:frankenphp"]
```

然后，在开发期间，你可以使用以下 Docker Compose 文件来运行应用：

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

如果显式地向 `php artisan octane:start` 命令传递了 `--log-level` 选项，Octane 将使用 FrankenPHP 的原生日志记录器，除非另行配置，否则会生成结构化 JSON 日志。

你可以查阅[官方 FrankenPHP 文档](https://frankenphp.dev/docs/docker/)了解更多关于用 Docker 运行 FrankenPHP 的信息。

<a name="frankenphp-caddyfile"></a>
#### 自定义 Caddyfile 配置

使用 FrankenPHP 时，你可以在启动 Octane 时使用 `--caddyfile` 选项指定自定义的 Caddyfile：

```shell
php artisan octane:start --server=frankenphp --caddyfile=/path/to/your/Caddyfile
```

这允许你在默认设置之外自定义 FrankenPHP 的配置，例如添加自定义中间件、配置高级路由或设置自定义指令。你可以查阅[官方 Caddy 文档](https://caddyserver.com/docs/caddyfile)了解 Caddyfile 语法和配置选项的更多信息。

<a name="roadrunner"></a>
### RoadRunner

[RoadRunner](https://roadrunner.dev) 由使用 Go 构建的 RoadRunner 二进制文件驱动。第一次启动基于 RoadRunner 的 Octane 服务器时，Octane 会主动提供下载并安装 RoadRunner 二进制文件。

<a name="roadrunner-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 RoadRunner

如果你计划使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应运行以下命令安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner-cli spiral/roadrunner-http
```

接下来，你应启动一个 Sail shell，并使用 `rr` 可执行文件获取 RoadRunner 二进制文件的最新 Linux 版本构建：

```shell
./vendor/bin/sail shell

# Within the Sail shell...
./vendor/bin/rr get-binary
```

然后，在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane（而非 PHP 开发服务器）运行应用的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=roadrunner --host=0.0.0.0 --rpc-port=6001 --port='${APP_PORT:-80}'" # [tl! add]
```

最后，确保 `rr` 二进制文件可执行并构建你的 Sail 镜像：

```shell
chmod +x ./rr

./vendor/bin/sail build --no-cache
```

<a name="swoole"></a>
### Swoole

如果你计划使用 Swoole 应用服务器来运行你的 Laravel Octane 应用，必须安装 Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install swoole
```

<a name="openswoole"></a>
#### Open Swoole

如果你想使用 Open Swoole 应用服务器来运行你的 Laravel Octane 应用，必须安装 Open Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install openswoole
```

将 Laravel Octane 与 Open Swoole 一起使用可获得与 Swoole 提供的相同功能，例如并发任务、tick 和定时器。

<a name="swoole-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 Swoole

> [!WARNING]
> 在通过 Sail 运行 Octane 应用之前，请确保你拥有最新版本的 Laravel Sail，并在应用根目录执行 `./vendor/bin/sail build --no-cache`。

另外，你可以使用 [Laravel Sail](/docs/{{version}}/sail)（Laravel 官方的、基于 Docker 的开发环境）开发基于 Swoole 的 Octane 应用。Laravel Sail 默认包含 Swoole 扩展。不过，你仍然需要调整 Sail 使用的 `docker-compose.yml` 文件。

要开始，请在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加一个 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane（而非 PHP 开发服务器）运行应用的命令：

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

如有必要，Swoole 支持一些你可以添加到 `octane` 配置文件中的额外配置选项。由于这些选项很少需要修改，因此没有包含在默认配置文件中：

```php
'swoole' => [
    'options' => [
        'log_file' => storage_path('logs/swoole_http.log'),
        'package_max_length' => 10 * 1024 * 1024,
    ],
],
```

<a name="serving-your-application"></a>
## 运行你的应用

Octane 服务器可以通过 `octane:start` Artisan 命令启动。默认情况下，该命令将使用应用 `octane` 配置文件中 `server` 配置选项指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此你可以通过 `http://localhost:8000` 在 Web 浏览器中访问你的应用。

<a name="keeping-octane-running-in-production"></a>
#### 在生产环境中保持 Octane 运行

如果你要将 Octane 应用部署到生产环境，应使用 Supervisor 等进程监视器来确保 Octane 服务器持续运行。一个示例的 Octane Supervisor 配置文件可能如下所示：

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
### 通过 HTTPS 运行你的应用

默认情况下，通过 Octane 运行的应用生成的链接以 `http://` 为前缀。当通过 HTTPS 运行应用时，可以将应用 `config/octane.php` 配置文件中使用的 `OCTANE_HTTPS` 环境变量设置为 `true`。当此配置值设置为 `true` 时，Octane 将指示 Laravel 为所有生成的链接添加 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

<a name="serving-your-application-via-nginx"></a>
### 通过 Nginx 运行你的应用

> [!NOTE]
> 如果你还没有准备好管理自己的服务器配置，或对配置运行健壮的 Laravel Octane 应用所需的各种服务感到不自在，可以查看 [Laravel Cloud](https://cloud.laravel.com)，它提供完全托管的 Laravel Octane 支持。

在生产环境中，你应在 Nginx 或 Apache 等传统 Web 服务器后面运行你的 Octane 应用。这样做可以让 Web 服务器提供图片和样式表等静态资源，并管理你的 SSL 证书终止。

在下面的 Nginx 配置示例中，Nginx 将提供站点的静态资源，并将请求代理到运行在 8000 端口的 Octane 服务器：

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

由于你的应用在 Octane 服务器启动时只会被加载到内存一次，因此刷新浏览器时，应用文件的任何更改都不会反映出来。例如，添加到 `routes/web.php` 文件的路由定义在服务器重启前不会生效。为方便起见，你可以使用 `--watch` 标志指示 Octane 在应用内发生任何文件变更时自动重启服务器：

```shell
php artisan octane:start --watch
```

使用此功能之前，你应确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监听库：

```shell
npm install --save-dev chokidar
```

你可以使用应用 `config/octane.php` 配置文件中的 `watch` 配置选项配置应监听的目录和文件。

<a name="specifying-the-worker-count"></a>
### 指定工作进程数量

默认情况下，Octane 会为机器提供的每个 CPU 核心启动一个应用请求工作进程。这些工作进程随后将用于处理进入应用传入的 HTTP 请求。你可以在调用 `octane:start` 命令时使用 `--workers` 选项手动指定要启动的工作进程数量：

```shell
php artisan octane:start --workers=4
```

如果你使用 Swoole 应用服务器，还可以指定要启动多少个["任务工作进程"](#concurrent-tasks)：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

<a name="specifying-the-max-request-count"></a>
### 指定最大请求数量

为帮助防止偶发的内存泄漏，Octane 会在任何工作进程处理 500 个请求后优雅地重启它。要调整此数字，可以使用 `--max-requests` 选项：

```shell
php artisan octane:start --max-requests=250
```

<a name="specifying-the-max-execution-time"></a>
### 指定最大执行时间

默认情况下，Laravel Octane 通过应用 `config/octane.php` 配置文件中的 `max_execution_time` 选项，为传入请求设置 30 秒的最大执行时间：

```php
'max_execution_time' => 30,
```

此设置定义了传入请求在被终止前允许执行的最大秒数。将此值设置为 `0` 将完全禁用执行时间限制。对于处理长时间运行请求的应用（例如文件上传、数据处理或对外部服务的 API 调用），此配置选项尤其有用。

> [!WARNING]
> 修改 `max_execution_time` 配置后，必须重启 Octane 服务器才能使更改生效。

<a name="reloading-the-workers"></a>
### 重新加载工作进程

你可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用工作进程。通常，这应在部署后完成，以便新部署的代码被加载到内存中并用于处理后续请求：

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

由于 Octane 会启动你的应用一次并将其保存在内存中用于处理请求，因此在构建应用时应考虑几个注意事项。例如，应用服务提供者的 `register` 和 `boot` 方法只在请求工作进程最初启动时执行一次。在后续请求中，将复用同一个应用实例。

因此，在向任何对象的构造函数注入应用服务容器或请求时应特别小心。这样做可能导致该对象在后续请求中持有过期的容器或请求版本。

Octane 会自动处理重置第一方框架状态。然而，Octane 并不总是知道如何重置你的应用创建的全局状态。因此，你应了解如何以 Octane 友好的方式构建应用。下面，我们将讨论使用 Octane 时可能导致问题的最常见情况。

<a name="container-injection"></a>
### 容器注入

一般来说，你应该避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个应用服务容器注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app);
    });
}
```

在此示例中，如果 `Service` 实例在应用引导过程中被解析，容器将被注入到该服务中，并且在后续请求中，同一个容器将被 `Service` 实例持有。对于你的特定应用，这**可能**不是问题；但它可能导致容器意外缺少在引导周期后期或由后续请求添加的绑定。

作为变通方案，你可以停止将该绑定注册为单例，或者向该服务注入一个容器解析闭包，让它始终解析当前容器实例：

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

全局 `app` 辅助函数和 `Container::getInstance()` 方法始终返回最新版本的应用容器。

<a name="request-injection"></a>
### 请求注入

一般来说，你应该避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个请求实例注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app['request']);
    });
}
```

在此示例中，如果 `Service` 实例在应用引导过程中被解析，HTTP 请求将被注入到该服务中，并且在后续请求中，同一个请求将被 `Service` 实例持有。因此，所有请求头、输入和查询字符串数据以及所有其他请求数据都将是不正确的。

作为变通方案，你可以停止将该绑定注册为单例，或者向该服务注入一个请求解析闭包，让它始终解析当前请求实例。或者，最推荐的方法是在运行时简单地将对象所需的特定请求信息传递给该对象的某个方法：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app['request']);
});

$this->app->singleton(Service::class, function (Application $app) {
    return new Service(fn () => $app['request']);
});

// Or...

$service->method($request->input('name'));
```

全局 `request` 辅助函数始终返回应用当前正在处理的请求，因此在你的应用中使用它是安全的。

> [!WARNING]
> 在你的控制器方法和路由闭包上类型提示 `Illuminate\Http\Request` 实例是可以接受的。

<a name="configuration-repository-injection"></a>
### 配置仓库注入

一般来说，你应该避免将配置仓库实例注入到其他对象的构造函数中。例如，以下绑定将配置仓库注入到一个以单例方式绑定的对象中：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->singleton(Service::class, function (Application $app) {
        return new Service($app->make('config'));
    });
}
```

在此示例中，如果配置值在请求之间发生变化，该服务将无法访问新值，因为它依赖的是原始仓库实例。

作为变通方案，你可以停止将该绑定注册为单例，或者向该类注入一个配置仓库解析闭包：

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

全局 `config` 辅助函数始终返回最新版本的配置仓库，因此在你的应用中使用它是安全的。

<a name="managing-memory-leaks"></a>
### 管理内存泄漏

请记住，Octane 会在请求之间将应用保存在内存中；因此，向静态维护的数组添加数据会导致内存泄漏。例如，以下控制器存在内存泄漏，因为对应用的每个请求都会继续向静态 `$data` 数组添加数据：

```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Handle an incoming request.
 */
public function index(Request $request): array
{
    Service::$data[] = Str::random(10);

    return [
        // ...
    ];
}
```

在构建应用时，你应特别注意避免产生这类内存泄漏。建议你在本地开发期间监控应用的内存使用情况，以确保没有向应用引入新的内存泄漏。

<a name="concurrent-tasks"></a>
## 并发任务

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以通过轻量级后台任务并发执行操作。你可以使用 Octane 的 `concurrently` 方法实现这一点。你可以将此方法与 PHP 数组解构结合使用，以获取每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

Octane 处理的并发任务使用 Swoole 的"任务工作进程"，并在与传入请求完全不同的进程中执行。可用于处理并发任务的工作进程数量由 `octane:start` 命令上的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

由于 Swoole 任务系统施加的限制，调用 `concurrently` 方法时，你提供的任务不应超过 1024 个。

<a name="ticks-and-intervals"></a>
## Tick 与定时器

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以注册每指定秒数执行的"tick"操作。你可以通过 `tick` 方法注册"tick"回调。提供给 `tick` 方法的第一个参数应是一个表示 ticker 名称的字符串。第二个参数应是在指定时间间隔调用的可调用对象。

在此示例中，我们将注册一个每 10 秒调用一次的闭包。通常，`tick` 方法应在应用某个服务提供者的 `boot` 方法中调用：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10);
```

使用 `immediate` 方法，你可以指示 Octane 在 Octane 服务器最初启动时立即调用 tick 回调，然后每隔 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10)
    ->immediate();
```

<a name="the-octane-cache"></a>
## Octane 缓存

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以利用 Octane 缓存驱动，它提供每秒高达 200 万次操作的读写速度。因此，对于需要其缓存层提供极致读写速度的应用来说，此缓存驱动是绝佳选择。

该缓存驱动由 [Swoole 数据表](https://www.swoole.co.uk/docs/modules/swoole-table)驱动。缓存中存储的所有数据对服务器上的所有工作进程都可用。不过，服务器重启时缓存数据将被清除：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> [!NOTE]
> Octane 缓存中允许的最大条目数可以在应用的 `octane` 配置文件中定义。

<a name="cache-intervals"></a>
### 缓存区间

除了 Laravel 缓存系统提供的典型方法外，Octane 缓存驱动还具有基于区间的缓存。这些缓存在指定时间间隔自动刷新，并应在应用某个服务提供者的 `boot` 方法中注册。例如，以下缓存将每五秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

<a name="tables"></a>
## 数据表

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以定义并操作自己的任意 [Swoole 数据表](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole 数据表提供极高的性能吞吐量，表中的数据可以被服务器上的所有工作进程访问。不过，服务器重启时表中的数据将丢失。

数据表应在应用 `octane` 配置文件的 `tables` 配置数组中定义。已经为你配置了一个允许最多 1000 行的示例数据表。字符串列的最大大小可以通过在列类型后指定列大小来配置，如下所示：

```php
'tables' => [
    'example:1000' => [
        'name' => 'string:1000',
        'votes' => 'int',
    ],
],
```

要访问数据表，可以使用 `Octane::table` 方法：

```php
use Laravel\Octane\Facades\Octane;

Octane::table('example')->set('uuid', [
    'name' => 'Nuno Maduro',
    'votes' => 1000,
]);

return Octane::table('example')->get('uuid');
```

> [!WARNING]
> Swoole 数据表支持的列类型为：`string`、`int` 和 `float`。
