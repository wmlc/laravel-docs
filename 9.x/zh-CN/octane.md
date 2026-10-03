# Laravel Octane

- [简介](#introduction)
- [安装](#installation)
- [服务器前置条件](#server-prerequisites)
    - [RoadRunner](#roadrunner)
    - [Swoole](#swoole)
- [运行你的应用](#serving-your-application)
    - [通过 HTTPS 运行应用](#serving-your-application-via-https)
    - [通过 Nginx 运行应用](#serving-your-application-via-nginx)
    - [监听文件变更](#watching-for-file-changes)
    - [指定工作进程数量](#specifying-the-worker-count)
    - [指定最大请求数](#specifying-the-max-request-count)
    - [重载工作进程](#reloading-the-workers)
    - [停止服务器](#stopping-the-server)
- [依赖注入与 Octane](#dependency-injection-and-octane)
    - [容器注入](#container-injection)
    - [请求注入](#request-injection)
    - [配置仓库注入](#configuration-repository-injection)
- [管理内存泄漏](#managing-memory-leaks)
- [并发任务](#concurrent-tasks)
- [定时器与间隔](#ticks-and-intervals)
- [Octane 缓存](#the-octane-cache)
- [数据表](#tables)

<a name="introduction"></a>
## 简介

[Laravel Octane](https://github.com/laravel/octane) 通过使用高性能应用服务器（包括 [Open Swoole](https://swoole.co.uk)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)）来运行你的应用，从而大幅提升应用性能。Octane 只需启动应用一次，将其保留在内存中，然后以极高的速度处理请求。

<a name="installation"></a>
## 安装

可以通过 Composer 包管理器安装 Octane：

```shell
composer require laravel/octane
```

安装 Octane 之后，可以执行 `octane:install` Artisan 命令，该命令会将 Octane 的配置文件安装到你的应用中：

```shell
php artisan octane:install
```

<a name="server-prerequisites"></a>
## 服务器前置条件

> **Warning**
> Laravel Octane 需要 [PHP 8.0+](https://php.net/releases/)。

<a name="roadrunner"></a>
### RoadRunner

[RoadRunner](https://roadrunner.dev) 由 RoadRunner 二进制文件驱动，该文件使用 Go 构建。首次启动基于 RoadRunner 的 Octane 服务器时，Octane 会提示为你下载并安装 RoadRunner 二进制文件。

<a name="roadrunner-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 RoadRunner

如果你打算使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应当运行以下命令来安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner
```

接下来，应当启动一个 Sail shell，并使用 `rr` 可执行文件获取 RoadRunner 二进制文件的最新 Linux 版本：

```shell
./vendor/bin/sail shell

# 在 Sail shell 中...
./vendor/bin/rr get-binary
```

安装 RoadRunner 二进制文件之后，可以退出 Sail shell 会话。接下来需要调整 Sail 使用的 `supervisor.conf` 文件以保持应用运行。首先，执行 `sail:publish` Artisan 命令：

```shell
./vendor/bin/sail artisan sail:publish
```

接下来，更新应用的 `docker/supervisord.conf` 文件中的 `command` 指令，使 Sail 使用 Octane 而非 PHP 开发服务器来运行应用：

```ini
command=/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=roadrunner --host=0.0.0.0 --rpc-port=6001 --port=80
```

最后，确保 `rr` 二进制文件可执行，并构建 Sail 镜像：

```shell
chmod +x ./rr

./vendor/bin/sail build --no-cache
```

<a name="swoole"></a>
### Swoole

如果打算使用 Swoole 应用服务器来运行 Laravel Octane 应用，必须安装 Swoole PHP 扩展。通常可以通过 PECL 安装：

```shell
pecl install swoole
```

<a name="swoole-via-laravel-sail"></a>
#### 通过 Laravel Sail 使用 Swoole

> **Warning**
> 在通过 Sail 运行 Octane 应用之前，请确保你使用的是最新版本的 Laravel Sail，并在应用的根目录下执行 `./vendor/bin/sail build --no-cache`。

或者，你可以使用 [Laravel Sail](/docs/{{version}}/sail)（Laravel 官方基于 Docker 的开发环境）来开发基于 Swoole 的 Octane 应用。Laravel Sail 默认包含 Swoole 扩展。不过，你仍需调整 Sail 使用的 `supervisor.conf` 文件以保持应用运行。首先，执行 `sail:publish` Artisan 命令：

```shell
./vendor/bin/sail artisan sail:publish
```

接下来，更新应用的 `docker/supervisord.conf` 文件中的 `command` 指令，使 Sail 使用 Octane 而非 PHP 开发服务器来运行应用：

```ini
command=/usr/bin/php -d variables_order=EGPCS /var/www/html/artisan octane:start --server=swoole --host=0.0.0.0 --port=80
```

最后，构建 Sail 镜像：

```shell
./vendor/bin/sail build --no-cache
```

<a name="swoole-configuration"></a>
#### Swoole 配置

Swoole 支持一些额外的配置选项，如有必要可以将其添加到 `octane` 配置文件中。由于这些选项很少需要修改，因此未包含在默认配置文件中：

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

可以通过 `octane:start` Artisan 命令启动 Octane 服务器。默认情况下，该命令会使用应用的 `octane` 配置文件中 `server` 配置选项指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此可以通过 `http://localhost:8000` 在浏览器中访问应用。

<a name="serving-your-application-via-https"></a>
### 通过 HTTPS 运行应用

默认情况下，通过 Octane 运行的应用生成的链接以 `http://` 为前缀。当通过 HTTPS 运行应用时，可以将应用 `config/octane.php` 配置文件中使用的 `OCTANE_HTTPS` 环境变量设置为 `true`。当该配置值设置为 `true` 时，Octane 会指示 Laravel 为所有生成的链接添加 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

<a name="serving-your-application-via-nginx"></a>
### 通过 Nginx 运行应用

> **Note**
> 如果你尚未准备好自行管理服务器配置，或者不熟悉配置运行健壮的 Laravel Octane 应用所需的各种服务，可以了解一下 [Laravel Forge](https://forge.laravel.com)。

在生产环境中，应当在传统的 Web 服务器（如 Nginx 或 Apache）后面运行 Octane 应用。这样可以让 Web 服务器处理静态资源（如图片和样式表）的提供，并管理 SSL 证书终止。

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

由于应用在 Octane 服务器启动时仅加载一次到内存中，因此刷新浏览器时不会反映应用文件的任何变更。例如，添加到 `routes/web.php` 文件的路由定义在服务器重启之前不会生效。为方便起见，可以使用 `--watch` 选项指示 Octane 在应用内任何文件发生变更时自动重启服务器：

```shell
php artisan octane:start --watch
```

在使用此功能之前，应确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，还应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监听库：

```shell
npm install --save-dev chokidar
```

可以通过应用 `config/octane.php` 配置文件中的 `watch` 配置选项来配置需要监听的目录和文件。

<a name="specifying-the-worker-count"></a>
### 指定工作进程数量

默认情况下，Octane 会为机器提供的每个 CPU 核心启动一个应用请求工作进程。这些工作进程随后用于处理进入应用的 HTTP 请求。可以在调用 `octane:start` 命令时使用 `--workers` 选项手动指定要启动的工作进程数量：

```shell
php artisan octane:start --workers=4
```

如果使用 Swoole 应用服务器，还可以指定要启动的 ["task workers"](#concurrent-tasks) 数量：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

<a name="specifying-the-max-request-count"></a>
### 指定最大请求数

为帮助防止意外的内存泄漏，Octane 会在每个工作进程处理 500 个请求后优雅地重启该进程。可以使用 `--max-requests` 选项调整此数值：

```shell
php artisan octane:start --max-requests=250
```

<a name="reloading-the-workers"></a>
### 重载工作进程

可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用工作进程。通常应在部署之后执行此操作，以便将新部署的代码加载到内存中并用于处理后续请求：

```shell
php artisan octane:reload
```

<a name="stopping-the-server"></a>
### 停止服务器

可以使用 `octane:stop` Artisan 命令停止 Octane 服务器：

```shell
php artisan octane:stop
```

<a name="checking-the-server-status"></a>
#### 检查服务器状态

可以使用 `octane:status` Artisan 命令检查 Octane 服务器的当前状态：

```shell
php artisan octane:status
```

<a name="dependency-injection-and-octane"></a>
## 依赖注入与 Octane

由于 Octane 在处理请求时只启动应用一次并将其保留在内存中，因此在构建应用时需要注意一些事项。例如，应用服务提供者（Service Provider）的 `register` 和 `boot` 方法只会在请求工作进程初始启动时执行一次。在后续请求中，会重用同一个应用实例。

鉴于此，在将应用服务容器（Service Container）或请求注入到任何对象的构造函数时应特别小心。这样做可能导致该对象在后续请求中持有过时的容器或请求版本。

Octane 会自动处理在请求之间重置任何第一方框架状态。然而，Octane 并不总是知道如何重置由你的应用创建的全局状态。因此，应当了解如何以对 Octane 友好的方式构建应用。下面，我们将讨论使用 Octane 时可能导致问题的最常见情况。

<a name="container-injection"></a>
### 容器注入

通常，应避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个应用服务容器注入到一个绑定为单例的对象中：

```php
use App\Service;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    $this->app->singleton(Service::class, function ($app) {
        return new Service($app);
    });
}
```

在此示例中，如果 `Service` 实例在应用启动过程中被解析，容器会被注入到服务中，并且该容器会在后续请求中被 `Service` 实例持有。这对于你的特定应用**可能**不是问题；但是，这可能导致容器意外丢失在启动周期后期或后续请求中添加的绑定。

作为变通方案，你可以停止将绑定注册为单例，或者将一个容器解析器闭包注入到服务中，使其始终解析当前的容器实例：

```php
use App\Service;
use Illuminate\Container\Container;

$this->app->bind(Service::class, function ($app) {
    return new Service($app);
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance());
});
```

全局 `app` 助手函数和 `Container::getInstance()` 方法始终返回最新版本的应用容器。

<a name="request-injection"></a>
### 请求注入

通常，应避免将应用服务容器或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个请求实例注入到一个绑定为单例的对象中：

```php
use App\Service;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    $this->app->singleton(Service::class, function ($app) {
        return new Service($app['request']);
    });
}
```

在此示例中，如果 `Service` 实例在应用启动过程中被解析，HTTP 请求会被注入到服务中，并且该请求会在后续请求中被 `Service` 实例持有。因此，所有的请求头、输入和查询字符串数据以及所有其他请求数据都将是不正确的。

作为变通方案，你可以停止将绑定注册为单例，或者将一个请求解析器闭包注入到服务中，使其始终解析当前的请求实例。或者，最推荐的方式是在运行时将对象所需的特定请求信息传递给对象的方法：

```php
use App\Service;

$this->app->bind(Service::class, function ($app) {
    return new Service($app['request']);
});

$this->app->singleton(Service::class, function ($app) {
    return new Service(fn () => $app['request']);
});

// 或者...

$service->method($request->input('name'));
```

全局 `request` 助手函数始终返回应用当前正在处理的请求，因此在应用中使用是安全的。

> **Warning**
> 在控制器方法和路由闭包中类型提示 `Illuminate\Http\Request` 实例是可以的。

<a name="configuration-repository-injection"></a>
### 配置仓库注入

通常，应避免将配置仓库实例注入到其他对象的构造函数中。例如，以下绑定将配置仓库注入到一个绑定为单例的对象中：

```php
use App\Service;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    $this->app->singleton(Service::class, function ($app) {
        return new Service($app->make('config'));
    });
}
```

在此示例中，如果配置值在请求之间发生变化，该服务将无法访问新值，因为它依赖的是原始的仓库实例。

作为变通方案，你可以停止将绑定注册为单例，或者将一个配置仓库解析器闭包注入到类中：

```php
use App\Service;
use Illuminate\Container\Container;

$this->app->bind(Service::class, function ($app) {
    return new Service($app->make('config'));
});

$this->app->singleton(Service::class, function () {
    return new Service(fn () => Container::getInstance()->make('config'));
});
```

全局 `config` 始终返回最新版本的配置仓库，因此在应用中使用是安全的。

<a name="managing-memory-leaks"></a>
### 管理内存泄漏

请记住，Octane 会在请求之间将应用保留在内存中；因此，向静态维护的数组添加数据会导致内存泄漏。例如，以下控制器存在内存泄漏，因为对应用的每个请求都会持续向静态 `$data` 数组添加数据：

```php
use App\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * 处理传入请求。
 *
 * @param  \Illuminate\Http\Request  $request
 * @return void
 */
public function index(Request $request)
{
    Service::$data[] = Str::random(10);

    // ...
}
```

在构建应用时，应特别注意避免创建此类内存泄漏。建议在本地开发期间监控应用的内存使用情况，以确保不会向应用中引入新的内存泄漏。

<a name="concurrent-tasks"></a>
## 并发任务

> **Warning**
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，可以通过轻量级后台任务并发执行操作。可以使用 Octane 的 `concurrently` 方法来实现。可以将此方法与 PHP 数组解构结合使用，以获取每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

由 Octane 处理的并发任务使用 Swoole 的 "task workers"，并在与传入请求完全不同的进程中执行。可用于处理并发任务的工作进程数量由 `octane:start` 命令上的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

调用 `concurrently` 方法时，由于 Swoole 任务系统的限制，不应提供超过 1024 个任务。

<a name="ticks-and-intervals"></a>
## 定时器与间隔

> **Warning**
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，可以注册每隔指定秒数执行的 "tick" 操作。可以通过 `tick` 方法注册 "tick" 回调。`tick` 方法的第一个参数应当是表示定时器名称的字符串。第二个参数应当是一个在指定间隔被调用的可调用对象。

在此示例中，我们将注册一个每 10 秒调用一次的闭包。通常，`tick` 方法应当在应用某个服务提供者的 `boot` 方法中调用：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
        ->seconds(10);
```

使用 `immediate` 方法，可以指示 Octane 在 Octane 服务器初始启动时立即调用 tick 回调，之后每隔 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
        ->seconds(10)
        ->immediate();
```

<a name="the-octane-cache"></a>
## Octane 缓存

> **Warning**
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，可以利用 Octane 缓存驱动，该驱动提供高达每秒 200 万次操作的读写速度。因此，对于需要从缓存层获得极高读写速度的应用来说，该缓存驱动是绝佳选择。

此缓存驱动由 [Swoole tables](https://www.swoole.co.uk/docs/modules/swoole-table) 提供支持。缓存中存储的所有数据对服务器上的所有工作进程可用。但是，服务器重启时缓存数据会被清空：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> **Note**
> Octane 缓存中允许的最大条目数可以在应用的 `octane` 配置文件中定义。

<a name="cache-intervals"></a>
### 缓存间隔

除了 Laravel 缓存系统提供的常规方法外，Octane 缓存驱动还支持基于间隔的缓存。这些缓存会在指定间隔自动刷新，应当注册在应用某个服务提供者的 `boot` 方法中。例如，以下缓存将每 5 秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

<a name="tables"></a>
## 数据表

> **Warning**
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，可以定义并交互你自己的任意 [Swoole tables](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole tables 提供极高的性能吞吐量，这些表中的数据可以被服务器上的所有工作进程访问。但是，服务器重启时其中的数据会丢失。

应当在应用 `octane` 配置文件的 `tables` 配置数组中定义表。已经为你配置了一个允许最多 1000 行的示例表。可以通过在列类型之后指定列大小来配置字符串列的最大大小，如下所示：

```php
'tables' => [
    'example:1000' => [
        'name' => 'string:1000',
        'votes' => 'int',
    ],
],
```

要访问表，可以使用 `Octane::table` 方法：

```php
use Laravel\Octane\Facades\Octane;

Octane::table('example')->set('uuid', [
    'name' => 'Nuno Maduro',
    'votes' => 1000,
]);

return Octane::table('example')->get('uuid');
```

> **Warning**
> Swoole tables 支持的列类型有：`string`、`int` 和 `float`。
