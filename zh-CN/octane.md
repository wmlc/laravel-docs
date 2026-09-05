# Laravel Octane

## 简介

[Laravel Octane](https://github.com/laravel/octane) 借助高性能应用服务器为你的应用性能赋能，这些服务器包括 [FrankenPHP](https://frankenphp.dev/)、[Open Swoole](https://openswoole.com/)、[Swoole](https://github.com/swoole/swoole-src) 和 [RoadRunner](https://roadrunner.dev)。Octane 会引导（启动过程）你的应用一次，将其常驻内存，然后以超音速响应请求。

## 安装

Octane 可以通过 Composer 包管理器安装：

```shell
composer require laravel/octane
```

安装 Octane 之后，你可以执行 `octane:install` Artisan 命令，该命令会将 Octane 的配置文件安装到你的应用中：

```shell
php artisan octane:install
```

## 服务器前置条件

### FrankenPHP

[FrankenPHP](https://frankenphp.dev) 是一个用 Go 编写的 PHP 应用服务器，支持早期提示（early hints）、Brotli 和 Zstandard 压缩等现代 Web 特性。当你安装 Octane 并选择 FrankenPHP 作为服务器时，Octane 会自动为你下载并安装 FrankenPHP 二进制文件。

#### 通过 Laravel Sail 使用 FrankenPHP

如果你计划使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应当运行以下命令来安装 Octane 和 FrankenPHP：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane
```

接下来，你应当使用 `octane:install` Artisan 命令安装 FrankenPHP 二进制文件：

```shell
./vendor/bin/sail artisan octane:install --server=frankenphp
```

最后，在你的应用 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用于通过 Octane 而非 PHP 开发服务器来提供应用的命令：

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

通常，你应通过 `https://localhost` 访问 FrankenPHP Sail 应用，因为使用 `https://127.0.0.1` 需要额外配置，并且[不建议](https://frankenphp.dev/docs/known-issues/#using-https127001-with-docker)这样做。

#### 通过 Docker 使用 FrankenPHP

使用 FrankenPHP 官方的 Docker 镜像可以提供更好的性能，并且可以使用 FrankenPHP 静态安装中未包含的一些额外扩展。此外，官方 Docker 镜像还支持在 FrankenPHP 原生不支持的平台（如 Windows）上运行。FrankenPHP 官方 Docker 镜像既适用于本地开发，也适用于生产环境。

你可以使用以下 Dockerfile 作为将 FrankenPHP 驱动的 Laravel 应用容器化的起点：

```dockerfile
FROM dunglas/frankenphp

RUN install-php-extensions \
    pcntl
    # 在此添加其他 PHP 扩展……

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

如果 `--log-level` 选项被显式传递给 `php artisan octane:start` 命令，Octane 将使用 FrankenPHP 的原生日志记录器，并且在未另行配置的情况下，会生成结构化的 JSON 日志。

你可以查阅 [FrankenPHP 官方文档](https://frankenphp.dev/docs/docker/) 了解有关使用 Docker 运行 FrankenPHP 的更多信息。

#### 自定义 Caddyfile 配置

使用 FrankenPHP 时，你可以在启动 Octane 时通过 `--caddyfile` 选项指定自定义的 Caddyfile：

```shell
php artisan octane:start --server=frankenphp --caddyfile=/path/to/your/Caddyfile
```

这样你可以自定义 FrankenPHP 超出默认设置的配置，例如添加自定义中间件、配置高级路由，或设置自定义指令。你可以查阅 [Caddy 官方文档](https://caddyserver.com/docs/caddyfile) 了解有关 Caddyfile 语法和配置选项的更多信息。

### RoadRunner

[RoadRunner](https://roadrunner.dev) 由 RoadRunner 二进制文件驱动，该二进制文件使用 Go 构建。首次启动基于 RoadRunner 的 Octane 服务器时，Octane 会主动下载并为你安装 RoadRunner 二进制文件。

#### 通过 Laravel Sail 使用 RoadRunner

如果你计划使用 [Laravel Sail](/docs/{{version}}/sail) 开发应用，应当运行以下命令来安装 Octane 和 RoadRunner：

```shell
./vendor/bin/sail up

./vendor/bin/sail composer require laravel/octane spiral/roadrunner-cli spiral/roadrunner-http
```

接下来，你应当启动一个 Sail shell，并使用 `rr` 可执行文件获取 RoadRunner 二进制文件最新的基于 Linux 的构建：

```shell
./vendor/bin/sail shell

# 在 Sail shell 中……
./vendor/bin/rr get-binary
```

然后，在你的应用 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用于通过 Octane 而非 PHP 开发服务器来提供应用的命令：

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

### Swoole

如果你计划使用 Swoole 应用服务器来提供 Laravel Octane 应用，必须安装 Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install swoole
```

#### Open Swoole

如果你想要使用 Open Swoole 应用服务器来提供 Laravel Octane 应用，必须安装 Open Swoole PHP 扩展。通常，这可以通过 PECL 完成：

```shell
pecl install openswoole
```

将 Laravel Octane 与 Open Swoole 配合使用，可获得 Swoole 提供的相同功能，例如并发任务、计时器（tick）和间隔（interval）。

#### 通过 Laravel Sail 使用 Swoole

> [!WARNING]
> 在通过 Sail 提供 Octane 应用之前，请确保你拥有最新版本的 Laravel Sail，并在应用根目录中执行 `./vendor/bin/sail build --no-cache`。

或者，你可以使用 [Laravel Sail](/docs/{{version}}/sail)（Laravel 官方的基于 Docker 的开发环境）来开发基于 Swoole 的 Octane 应用。Laravel Sail 默认包含了 Swoole 扩展。不过，你仍然需要调整 Sail 使用的 `docker-compose.yml` 文件。

首先，在你的应用 `docker-compose.yml` 文件中，向 `laravel.test` 服务定义添加 `SUPERVISOR_PHP_COMMAND` 环境变量。该环境变量将包含 Sail 用于通过 Octane 而非 PHP 开发服务器来提供应用的命令：

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

#### Swoole 配置

Swoole 支持一些额外的配置选项，你可以按需将其添加到应用的 `octane` 配置文件中。由于这些选项很少需要修改，它们并未包含在默认配置文件中：

```php
'swoole' => [
    'options' => [
        'log_file' => storage_path('logs/swoole_http.log'),
        'package_max_length' => 10 * 1024 * 1024,
    ],
],
```

## 服务你的应用

可以通过 `octane:start` Artisan 命令启动 Octane 服务器。默认情况下，该命令会使用应用 `octane` 配置文件中 `server` 配置项所指定的服务器：

```shell
php artisan octane:start
```

默认情况下，Octane 会在 8000 端口启动服务器，因此你可以通过 `http://localhost:8000` 在 Web 浏览器中访问应用。

#### 在生产环境保持 Octane 运行

如果你将 Octane 应用部署到生产环境，应当使用进程监视器（如 Supervisor）来确保 Octane 服务器持续运行。Octane 的一个示例 Supervisor 配置文件可能如下所示：

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

### 通过 HTTPS 服务你的应用

默认情况下，通过 Octane 运行的应用生成的链接以 `http://` 为前缀。在你的应用 `config/octane.php` 配置文件中使用的 `OCTANE_HTTPS` 环境变量，可以在通过 HTTPS 提供应用时设置为 `true`。当该配置值为 `true` 时，Octane 会指示 Laravel 为所有生成的链接加上 `https://` 前缀：

```php
'https' => env('OCTANE_HTTPS', false),
```

### 通过 Nginx 服务你的应用

> [!NOTE]
> 如果你还没有准备好管理自己的服务器配置，或者不习惯配置运行健壮的 Laravel Octane 应用所需的各种服务，不妨看看 [Laravel Cloud](https://cloud.laravel.com)，它提供全托管的 Laravel Octane 支持。

在生产环境中，你应当在传统 Web 服务器（如 Nginx 或 Apache）后面提供 Octane 应用。这样做可以让 Web 服务器提供图片和样式表等静态资源，并管理 SSL 证书终止。

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

### 监听文件变化

由于你的应用在 Octane 服务器启动时会被一次性加载到内存中，因此对应用文件的任何更改在刷新浏览器时都不会生效。例如，添加到 `routes/web.php` 文件中的路由定义，在服务器重启之前都不会生效。为了方便，你可以使用 `--watch` 标志指示 Octane 在应用内任何文件发生更改时自动重启服务器：

```shell
php artisan octane:start --watch
```

在使用此功能之前，你应当确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你应当在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监听库：

```shell
npm install --save-dev chokidar
```

你可以使用应用 `config/octane.php` 配置文件中的 `watch` 配置项，配置需要监听的目录和文件。

### 指定 Worker 数量

默认情况下，Octane 会为机器的每个 CPU 核心启动一个应用请求 worker。这些 worker 随后会被用来在请求进入应用时为其提供服务。你可以在调用 `octane:start` 命令时使用 `--workers` 选项手动指定要启动的 worker 数量：

```shell
php artisan octane:start --workers=4
```

如果你使用的是 Swoole 应用服务器，还可以指定要启动的 ["task workers"](#concurrent-tasks)（任务 worker）数量：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

### 指定最大请求数

为了帮助防止意外的内存泄漏，Octane 会在任意 worker 处理了 500 个请求后优雅地重启它。要调整这个数字，可以使用 `--max-requests` 选项：

```shell
php artisan octane:start --max-requests=250
```

### 指定最大执行时间

默认情况下，Laravel Octane 通过应用 `config/octane.php` 配置文件中的 `max_execution_time` 选项，为传入请求设置 30 秒的最大执行时间：

```php
'max_execution_time' => 30,
```

该设置定义了传入请求在被终止之前允许执行的最大秒数。将该值设为 `0` 将完全禁用执行时间限制。此配置项对于处理长时间运行请求的应用特别有用，例如文件上传、数据处理或对外服务的 API 调用。

> [!WARNING]
> 当你修改 `max_execution_time` 配置时，必须重启 Octane 服务器才能使更改生效。

### 重载 Worker

你可以使用 `octane:reload` 命令优雅地重启 Octane 服务器的应用 worker。通常，这应当在部署之后进行，以便新部署的代码被加载到内存中，用于服务后续请求：

```shell
php artisan octane:reload
```

### 停止服务器

你可以使用 `octane:stop` Artisan 命令停止 Octane 服务器：

```shell
php artisan octane:stop
```

#### 检查服务器状态

你可以使用 `octane:status` Artisan 命令查看 Octane 服务器的当前状态：

```shell
php artisan octane:status
```

## 依赖注入与 Octane

由于 Octane 会引导（启动过程）你的应用一次，并在服务请求期间将其常驻内存，因此在构建应用时你应该考虑一些注意事项。例如，应用服务提供者（Service Provider）的 `register` 和 `boot` 方法只会在请求 worker 初次引导（启动过程）时执行一次。在后续请求中，同一个应用实例会被重用。

鉴于此，在向任何对象的构造函数中注入应用的服务容器（Service Container）或请求时，你应当特别小心。这样做可能导致该对象在后续请求中持有已过时的容器或请求版本。

Octane 会自动处理请求之间任何第一方框架状态的重置。但是，Octane 并不总是知道如何重置你的应用创建的全局状态。因此，你应该了解如何以对 Octane 友好的方式构建应用。下面，我们将讨论使用 Octane 时可能导致问题的最常见情况。

### 容器注入

一般而言，你应该避免将应用的服务容器（Service Container）或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个应用服务容器（Service Container）注入到一个被绑定为单例的对象中：

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

在此示例中，如果 `Service` 实例在应用引导（启动过程）期间被解析，容器将被注入到该服务中，并且该容器会在后续请求中被 `Service` 实例持有。对于你的特定应用而言，这**可能**不是问题；但它可能导致容器意外地缺少在引导（启动过程）周期后期或后续请求中添加的绑定。

作为变通方案，你可以停止将该绑定注册为单例，或者向服务中注入一个容器解析器闭包，该闭包始终解析当前的容器实例：

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

全局 `app` 辅助函数和 `Container::getInstance()` 方法将始终返回应用容器的最新版本。

### 请求注入

一般而言，你应该避免将应用的服务容器（Service Container）或 HTTP 请求实例注入到其他对象的构造函数中。例如，以下绑定将整个请求实例注入到一个被绑定为单例的对象中：

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

在此示例中，如果 `Service` 实例在应用引导（启动过程）期间被解析，HTTP 请求将被注入到该服务中，并且该请求会在后续请求中被 `Service` 实例持有。因此，所有请求头、输入和查询字符串数据以及其他所有请求数据都将是错误的。

作为变通方案，你可以停止将该绑定注册为单例，或者向服务中注入一个请求解析器闭包，该闭包始终解析当前的请求实例。或者，最推荐的做法是，在运行时将对象所需的特定请求信息传递给对象的某个方法：

```php
use App\Service;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Service::class, function (Application $app) {
    return new Service($app['request']);
});

$this->app->singleton(Service::class, function (Application $app) {
    return new Service(fn () => $app['request']);
});

// 或者……

$service->method($request->input('name'));
```

全局 `request` 辅助函数将始终返回应用当前正在处理的请求，因此在你的应用内使用它是安全的。

> [!WARNING]
> 可以在控制器方法和路由闭包中对 `Illuminate\Http\Request` 实例进行类型提示。

### 配置仓库注入

一般而言，你应该避免将配置仓库（configuration repository）实例注入到其他对象的构造函数中。例如，以下绑定将配置仓库注入到一个被绑定为单例的对象中：

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

在此示例中，如果配置值在请求之间发生变化，该服务将无法访问新值，因为它依赖于原始的仓库实例。

作为变通方案，你可以停止将该绑定注册为单例，或者向类注入一个配置仓库解析器闭包：

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

全局 `config` 将始终返回配置仓库的最新版本，因此在你的应用内使用它是安全的。

### 管理内存泄漏

请记住，Octane 会在请求之间将应用保存在内存中；因此，将数据添加到以静态方式维护的数组中会导致内存泄漏。例如，以下控制器存在内存泄漏，因为对应用的每个请求都会持续向静态 `$data` 数组添加数据：

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
        // ……
    ];
}
```

在构建应用时，你应当特别小心，避免制造这类内存泄漏。建议你在本地开发期间监控应用的内存使用情况，确保没有引入新的内存泄漏。

## 并发任务

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以通过轻量级后台任务并发执行操作。可以使用 Octane 的 `concurrently` 方法完成此操作。你可以将该方法与 PHP 数组解构结合使用，以检索每个操作的结果：

```php
use App\Models\User;
use App\Models\Server;
use Laravel\Octane\Facades\Octane;

[$users, $servers] = Octane::concurrently([
    fn () => User::all(),
    fn () => Server::all(),
]);
```

Octane 处理的并发任务会利用 Swoole 的"task workers"（任务 worker），并在与传入请求完全不同的进程中执行。可用于处理并发任务的 worker 数量由 `octane:start` 命令上的 `--task-workers` 指令决定：

```shell
php artisan octane:start --workers=4 --task-workers=6
```

调用 `concurrently` 方法时，由于 Swoole 任务系统的限制，你不应提供超过 1024 个任务。

## 刻度与间隔

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以注册每隔指定秒数执行的"tick"（计时）操作。你可以通过 `tick` 方法注册"tick"回调。`tick` 方法的第一个参数应为一个字符串，表示计时器的名称。第二个参数应为一个会在指定间隔被调用的可调用对象。

在此示例中，我们将注册一个每 10 秒调用一次的闭包。通常，`tick` 方法应当在一个应用的服务提供者（Service Provider）的 `boot` 方法中调用：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10);
```

使用 `immediate` 方法，你可以指示 Octane 在 Octane 服务器初次引导（启动过程）时立即调用 tick 回调，并在此后每 N 秒调用一次：

```php
Octane::tick('simple-ticker', fn () => ray('Ticking...'))
    ->seconds(10)
    ->immediate();
```

## Octane 缓存

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以利用 Octane 缓存驱动，它提供高达每秒 200 万次操作的读写速度。因此，对于需要缓存层提供极高读/写速度的应用而言，此缓存驱动是一个绝佳选择。

此缓存驱动由 [Swoole tables](https://www.swoole.co.uk/docs/modules/swoole-table) 驱动。缓存中存储的所有数据对服务器上的所有 worker 都可用。但是，在服务器重启时缓存的数据会被清空：

```php
Cache::store('octane')->put('framework', 'Laravel', 30);
```

> [!NOTE]
> Octane 缓存中允许的最大条目数可以在应用的 `octane` 配置文件中定义。

### 缓存间隔

除了 Laravel 缓存系统提供的典型方法外，Octane 缓存驱动还具备基于间隔的缓存。这些缓存会在指定间隔自动刷新，并且应当注册在一个应用的服务提供者（Service Provider）的 `boot` 方法中。例如，以下缓存每五秒刷新一次：

```php
use Illuminate\Support\Str;

Cache::store('octane')->interval('random', function () {
    return Str::random(10);
}, seconds: 5);
```

## 表

> [!WARNING]
> 此功能需要 [Swoole](#swoole)。

使用 Swoole 时，你可以定义并交互使用自己的任意 [Swoole tables](https://www.swoole.co.uk/docs/modules/swoole-table)。Swoole 表提供极高的性能吞吐，并且这些表中的数据可以被服务器上的所有 worker 访问。但是，表中的数据在服务器重启时会丢失。

表应当定义在应用 `octane` 配置文件的 `tables` 配置数组中。一个允许最多 1000 行数据的示例表已经为你配置好。字符串列的最大大小可以通过在列类型之后指定列大小来配置，如下所示：

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
> Swoole 表支持的列类型为：`string`、`int` 和 `float`。
