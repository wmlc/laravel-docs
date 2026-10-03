# Laravel Octane

- [简介](#introduction)
- [安装](#installation)
- [服务器前置条件](#server-prerequisites)
    - [FrankenPHP](#frankenphp)
    - [RoadRunner](#roadrunner)
    - [Swoole](#swoole)
- [为你的应用提供服务](#serving-your-application)
    - [通过 HTTPS 为应用提供服务](#serving-your-application-via-https)
    - [通过 Nginx 为应用提供服务](#serving-your-application-via-nginx)
    - [监视文件变更](#watching-for-file-changes)
    - [指定工作进程数量](#specifying-the-worker-count)
    - [指定最大请求数](#specifying-the-max-request-count)
    - [重新加载工作进程](#reloading-the-workers)
    - [停止服务器](#stopping-the-server)
- [依赖注入与 Octane](#dependency-injection-and-octane)
    - [容器注入](#container-injection)
    - [请求注入](#request-injection)
    - [配置仓库注入](#configuration-repository-injection)
- [管理内存泄漏](#managing-memory-leaks)
- [并发任务](#concurrent-tasks)
- [滴答与间隔](#ticks-and-intervals)
- [Octane 缓存](#the-octane-cache)
- [表](#tables)

<a name="introduction"></a>
## 简介

[Laravel Octane](https://github.com/laravel/octane) 通过使用高性能应用服务器（包括 [FrankenPHP](https://frankenphp.dev/)、[Open Swoole](https://openswoole.com/)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)）为你的应用提供服务，从而大幅提升应用性能。Octane 只引导你的应用一次，把它保持在内存中，然后以超音速的速度把请求交给它处理。

<a name="installation"></a>
## 安装

可以通过 Composer 包管理器安装 Octane：

```shell
composer require laravel/octane
```

安装 Octane 之后，你可以执行 `octane:install` Artisan 命令，它会把 Octane 的配置文件安装到你的应用中：

```shell
php artisan octane:install
```

<a name="server-prerequisites"></a>
## 服务器前置条件

> [!WARNING]
> Laravel Octane 需要 [PHP 8.1+](https://php.net/releases/)。

<a name="frankenphp"></a>
### FrankenPHP

[FrankenPHP](https://frankenphp.dev) 是一个用 Go 编写的 PHP 应用服务器，支持 early hints、Brotli 和 Zstandard 压缩等现代 Web 特性。当你安装 Octane 并选择 FrankenPHP 作为服务器时，Octane 会自动为你下载并安装 FrankenPHP 二进制文件。

<a name="frankenphp-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 FrankenPHP

如果你打算使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应当运行以下命令来安装 Octane 和 FrankenPHP：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane
```

接下来，你应当使用 `octane:install` Artisan 命令安装 FrankenPHP 二进制文件：

```shell
./vendor/bin/sail artisan octane:install --server=frankenphp
```

最后，在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane 而非 PHP 开发服务器为你的应用提供服务的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=frankenphp --host=0.0.0.0 --admin-port=2019 --port='${APP_PORT:-80}'" # [tl! add]
      XDG_CONFIG_HOME:  /var/www/html/config # [tl! add]
      XDG_DATA_HOME:  /var/www/html/data # [tl! add]
```

若要启用 HTTPS、HTTP/2 和 HTTP/3，请改为应用以下修改：

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

通常，你应当通过 `https://localhost` 访问你的 FrankenPHP Sail 应用，因为使用 `https://127.0.0.1` 需要额外配置，并且[不推荐这样做](https://frankenphp.dev/docs/known-issues/#using-https127001-with-docker)。

<a name="frankenphp-via-docker"></a>
#### 通过 Docker 使用 FrankenPHP

使用 FrankenPHP 官方 Docker 镜像可以带来更好的性能，也能使用静态安装版 FrankenPHP 中不包含的额外扩展。此外，官方 Docker 镜像还支持在 FrankenPHP 无法原生支持的平台（例如 Windows）上运行它。FrankenPHP 官方 Docker 镜像同时适用于本地开发和生产环境。

你可以把下面的 Dockerfile 作为对基于 FrankenPHP 的 Laravel 应用进行容器化的起点：

```dockerfile
FROM dunglas/frankenphp

RUN install-php-extensions \
    pcntl
    # Add other PHP extensions here...

COPY . /app

ENTRYPOINT ["php", "artisan", "octane:frankenphp"]
```

然后，在开发过程中，你可以使用下面的 Docker Compose 文件来运行你的应用：

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

如果向 `php artisan octane:start` 命令显式传入 `--log-level` 选项，Octane 将使用 FrankenPHP 的原生日志记录器，并且在未做其他配置的情况下会输出结构化的 JSON 日志。

有关使用 Docker 运行 FrankenPHP 的更多信息，请查阅 [FrankenPHP 官方文档](https://frankenphp.dev/docs/docker/)。

<a name="roadrunner"></a>
### RoadRunner

[RoadRunner](https://roadrunner.dev) 由 RoadRunner 二进制文件驱动，该文件使用 Go 构建。你第一次启动基于 RoadRunner 的 Octane 服务器时，Octane 会提示你为其下载并安装 RoadRunner 二进制文件。

<a name="roadrunner-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 RoadRunner

如果你打算使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应当运行以下命令来安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner-cli spiral/roadrunner-http
```

接下来，你应当启动一个 Sail shell，并使用 `rr` 可执行文件获取最新的基于 Linux 的 RoadRunner 二进制文件构建版本：

```shell
./vendor/bin/sail shell

# Within the Sail shell...
./vendor/bin/rr get-binary
```

然后，在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane 而非 PHP 开发服务器为你的应用提供服务的命令：

```yaml
services:
  laravel.test:
    environment:
      SUPERVISOR_PHP_COMMAND: "/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=roadrunner --host=0.0.0.0 --rpc-port=6001 --port='${APP_PORT:-80}'" # [tl! add]
```

最后，确保 `rr` 二进制文件具有可执行权限，并构建你的 Sail 镜像：

```shell
chmod +x ./rr

./vendor/bin/sail build --no-cache
```

<a name="swoole"></a>
### Swoole

如果你打算使用 Swoole 应用服务器为你的 Laravel Octane 应用提供服务，就必须安装 Swoole PHP 扩展。通常可以通过 PECL 完成：

```shell
pecl install swoole
```

<a name="openswoole"></a>
#### Open Swoole

如果你想使用 Open Swoole 应用服务器为你的 Laravel Octane 应用提供服务，就必须安装 Open Swoole PHP 扩展。通常可以通过 PECL 完成：

```shell
pecl install openswoole
```

将 Laravel Octane 与 Open Swoole 一起使用，可以获得与 Swoole 相同的功能，例如并发任务、滴答和间隔。

<a name="swoole-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 Swoole

> [!WARNING]
> 在通过 Sail 为 Octane 应用提供服务之前，请确保你拥有最新版本的 Laravel Sail，并在应用根目录中执行 `./vendor/bin/sail build --no-cache`。

或者，你也可以使用 [Laravel Sail](/docs/{{version}}/sail)（Laravel 官方的基于 Docker 的开发环境）来开发基于 Swoole 的 Octane 应用。Laravel Sail 默认包含 Swoole 扩展。不过，你仍然需要调整 Sail 所使用的 `docker-compose.yml` 文件。

要开始使用，请在应用 `docker-compose.yml` 文件的 `laravel.test` 服务定义中添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用来通过 Octane 而非 PHP 开发服务器为你的应用提供服务的命令：

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

Swoole 支持一些额外的配置选项，必要时你可以把它们添加到 `octane` 配置文件中。由于这些选项很少需要修改，默认配置文件中并未包含它们：

```php
'swoole' => [
    'options' => [
        'log_file' => storage_path('logs/swoole_http.log'),
        'package_max_length' => 10 * 1024 * 1024,
    ],
],
```

<a name="serving-your-application"></a>
## 为你的应用提供服务

可以通过 `octane:start` Artisan 命令启动 Octane 服务器。默认情况下，该命令会使用应用 `octane` 配置文件中 `server` 配置项所指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此你可以通过 `http://localhost:8000` 在 Web 浏览器中访问你的应用。

<a name="serving-your-application-via-https"></a>
### 通过 HTTPS 为应用提供服务

默认情况下，通过 Octane 运行的应用会生成以 `http://` 为前缀的链接。应用 `config/octane.php` 配置文件中的 `OCTANE_HTTPS` 环境变量，在通过 HTTPS 为应用提供服务时可以设为 `true`。当该配置值设为 `true` 时，Octane 会指示 Laravel 为所有生成的链接加上 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

<a name="serving-your-application-via-nginx"></a>
### 通过 Nginx 为应用提供服务

> [!NOTE]
> 如果你还没有准备好管理自己的服务器配置，或者对配置运行一个稳健的 Laravel Octane 应用所需的各种服务感到不熟悉，可以看看 [Laravel Forge](https://forge.laravel.com)。

在生产环境中，你应当在 Nginx 或 Apache 等传统 Web 服务器之后为你的 Octane 应用提供服务。这样可以让 Web 服务器为图片、样式表等静态资源提供服务，并管理你的 SSL 证书终止。

在下面的 Nginx 配置示例中，Nginx 会为站点的静态资源提供服务，并把请求代理到运行在 8000 端口的 Octane 服务器：

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
### 监视文件变更

由于 Octane 服务器启动时你的应用只会被加载到内存中一次，对应用文件的任何修改都不会在你刷新浏览器时体现出来。例如，添加到 `routes/web.php` 文件中的路由定义，要到服务器重启后才会生效。为方便起见，你可以使用 `--watch` 标志，指示 Octane 在应用内任何文件发生变更时自动重启服务器：

```shell
php artisan octane:start --watch
```

使用该功能之前，你应当确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你还应当在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监视库：

```shell
npm install --save-dev chokidar
```

你可以通过应用 `config/octane.php` 配置文件中的 `watch` 配置项来配置需要监视的目录和文件。

<a name="specifying-the-worker-count"></a>
### 指定工作进程数量

默认情况下，Octane 会为机器上的每个 CPU 核心启动一个应用请求工作进程。这些工作进程随后被用来为进入应用的传入 HTTP 请求提供服务。调用 `octane:start` 命令时，你可以使用 `--workers` 选项手动指定希望启动多少个工作进程：

```shell
php artisan octane:start --workers=4
```

如果你使用的是 Swoole 应用服务器，还可以指定希望启动多少个["任务工作进程`](#concurrent-tasks)：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

<a name="specifying-the-max-request-count"></a>
### 指定最大请求数

为帮助防止偶发的内存泄漏，Octane 会在某个工作进程处理完 500 个请求后优雅地重启它。要调整这个数量，可以使用 `--max-requests` 选项：

```shell
php artisan octane:start --max-requests=250
```

<a name="reloading-the-workers"></a>
### 重新加载工作进程

你可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用工作进程。通常应当在部署之后执行该命令，以便把你新部署的代码加载到内存中，并用于服务后续请求：

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

由于 Octane 只引导你的应用一次，并在服务请求期间把它保持在内存中，因此构建应用时有几点注意事项需要考虑。例如，应用服务提供者的 `register` 和 `boot` 方法只会在请求工作进程首次启动时执行一次。在后续请求中，会复用同一个应用实例。

基于这一点，你应当特别小心地把应用服务容器或请求注入到其他对象的构造函数中。否则，在后续请求中该对象可能持有一个过期的容器或请求版本。

Octane 会自动重置请求之间的所有第一方框架状态。不过，Octane 并不总能知道如何重置由你的应用创建的全局状态。因此，你应当了解如何以对 Octane 友好的方式构建应用。下面我们将讨论使用 Octane 时最常引发问题的几种情况。

<a name="container-injection"></a>
### 容器注入

一般来说，你应当避免把应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，下面的绑定会把整个应用服务容器注入到一个以单例方式绑定的对象中：

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

在这个示例中，如果 `Service` 实例是在应用引导过程中解析的，容器就会被注入该服务，并且在后续请求中 `Service` 实例会一直持有同一个容器。这对你 particular 的应用来说**可能**不是问题；不过，它可能导致容器意外缺少在引导周期后期或由后续请求添加的绑定。

作为一种变通方案，你可以不再把该绑定注册为单例，或者把一个总是解析当前容器实例的容器解析闭包注入到服务中：

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

全局 `app` 辅助函数和 `Container::getInstance()` 方法始终会返回应用容器的最新版本。

<a name="request-injection"></a>
### 请求注入

一般来说，你应当避免把应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，下面的绑定会把整个请求实例注入到一个以单例方式绑定的对象中：

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

在这个示例中，如果 `Service` 实例是在应用引导过程中解析的，HTTP 请求就会被注入该服务，并且在后续请求中 `Service` 实例会一直持有同一个请求。因此，所有请求头、输入和查询字符串数据，以及其他所有请求数据都会不正确。

作为一种变通方案，你可以不再把该绑定注册为单例，或者把一个总是解析当前请求实例的请求解析闭包注入到服务中。或者，最推荐的做法是在运行时把对象所需的特定请求信息传递给该对象的某个方法：

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

全局 `request` 辅助函数始终会返回应用当前正在处理的请求，因此在应用中使用它是安全的。

> [!WARNING]
> 在控制器方法和路由闭包中类型提示 `Illuminate\Http\Request` 实例是可以接受的。

<a name="configuration-repository-injection"></a>
### 配置仓库注入

一般来说，你应当避免把配置仓库实例注入到其他对象的构造函数中。例如，下面的绑定会把配置仓库注入到一个以单例方式绑定的对象中：

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

在这个示例中，如果配置值在请求之间发生变化，该服务将无法访问新的值，因为它依赖的是最初的仓库实例。

作为一种变通方案，你可以不再把该绑定注册为单例，或者把一个配置仓库解析闭包注入到该类中：

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

全局 `config` 始终会返回配置仓库的最新版本，因此在应用中使用它是安全的。

<a name="managing-memory-leaks"></a>
### 管理内存泄漏

请记住，Octane 会在请求之间把你的应用保持在内存中；因此，向静态维护的数组中添加数据会导致内存泄漏。例如，下面的控制器存在内存泄漏，因为对应用的每次请求都会继续向静态 `$data` 数组中添加数据：

```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * 处理传入的请求。
 */
public function index(Request $request): array
{
    Service::$data[] = Str::random(10);

    return [
        // ...
    ];
}
```

在构建应用时，你应当特别注意避免创建这类内存泄漏。建议在本地开发期间监控应用的内存使用情况，以确保没有给应用引入新的内存泄漏。

<a name="concurrent-tasks"></a>
## 并发任务

> [!WARNING]
> 该功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以通过轻量级的后台任务并发执行操作。你可以使用 Octane 的 `concurrently` 方法来实现这一点。你可以把该方法与 PHP 数组解构结合使用，以获取每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

Octane 处理的并发任务使用 Swoole 的"任务工作进程"，并且在完全不同于传入请求的进程中执行。可用于处理并发任务的工作进程数量，由 `octane:start` 命令上的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

调用 `concurrently` 方法时，受 Swoole 任务系统的限制，你提供的任务数量不应超过 1024 个。

<a name="ticks-and-intervals"></a>
## 滴答与间隔

> [!WARNING]
> 该功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以注册"滴答"操作，它们每隔指定的秒数执行一次。你可以通过 `tick` 方法注册"滴答"回调。传给 `tick` 方法的第一个参数应当是表示该滴答器名称的字符串。第二个参数应当是一个可调用对象，它会按指定间隔被调用。

在这个示例中，我们注册一个每 10 秒调用一次的闭包。通常，应当在你某个应用服务提供者的 `boot` 方法中调用 `tick` 方法：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10);
```

借助 `immediate` 方法，你可以指示 Octane 在 Octane 服务器首次启动时立即调用该滴答回调，此后每 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10)
    ->immediate();
```

<a name="the-octane-cache"></a>
## Octane 缓存

> [!WARNING]
> 该功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以利用 Octane 缓存驱动，它每秒可提供高达 200 万次操作的读写速度。因此，该缓存驱动非常适合需要从缓存层获得极高读写速度的应用。

该缓存驱动由 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table)驱动。缓存在其中的所有数据对服务器上的所有工作进程都可见。不过，服务器重启时缓存数据会被清空：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> [!NOTE]
> Octane 缓存中允许的最大条目数，可以在应用的 `octane` 配置文件中定义。

<a name="cache-intervals"></a>
### 缓存间隔

除了 Laravel 缓存系统提供的常规方法之外，Octane 缓存驱动还支持基于间隔的缓存。这些缓存会按指定间隔自动刷新，并且应当在你某个应用服务提供者的 `boot` 方法中注册。例如，下面的缓存每五秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

<a name="tables"></a>
## 表

> [!WARNING]
> 该功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以定义并操作自己的任意 [Swoole 表](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole 表提供极高的性能吞吐，并且这些表中的数据可以被服务器上的所有工作进程访问。不过，服务器重启时其中的数据会丢失。

表应当在你应用 `octane` 配置文件的 `tables` 配置数组中定义。其中已经为你配置好了一个最多允许 1000 行的示例表。字符串列的最大长度可以通过在列类型之后指定列大小来配置，如下所示：

```php
'tables' => [
    'example:1000' => [
        'name' => 'string:1000',
        'votes' => 'int',
    ],
],
```

要访问某张表，可以使用 `Octane::table` 方法：

```php
use Laravel\Octane\Facades\Octane;

Octane::table('example')->set('uuid', [
    'name' => 'Nuno Maduro',
    'votes' => 1000,
]);

return Octane::table('example')->get('uuid');
```

> [!WARNING]
> Swoole 表支持的列类型为：`string`、`int` 和 `float`。
