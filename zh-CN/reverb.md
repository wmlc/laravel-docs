# Laravel Reverb

[Laravel Reverb](https://github.com/laravel/reverb) 为你的 Laravel 应用带来极速且可水平扩展的实时 WebSocket 通信能力，并与 Laravel 现有的 [事件广播工具](/docs/{{version}}/broadcasting) 套件无缝集成。

## 简介

[Laravel Reverb](https://github.com/laravel/reverb) 为你的 Laravel 应用带来极速且可水平扩展的实时 WebSocket 通信能力，并与 Laravel 现有的 [事件广播工具](/docs/{{version}}/broadcasting) 套件无缝集成。

## 安装

你可以使用 `install:broadcasting` Artisan 命令安装 Reverb：

```shell
php artisan install:broadcasting
```

## 配置

在底层，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，该命令会以一套合理的默认配置项安装 Reverb。如需修改任何配置，你可以更新 Reverb 的环境变量，或更新 `config/reverb.php` 配置文件。

### 应用凭据

要建立与 Reverb 的连接，客户端与服务器之间必须交换一组 Reverb 的"应用"凭据。这些凭据在服务端配置，用于验证来自客户端的请求。你可以使用以下环境变量定义这些凭据：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

### 允许的来源

你还可以通过更新 `config/reverb.php` 配置文件中 `apps` 区块的 `allowed_origins` 配置值，来定义客户端请求的来源。任何不在允许来源列表中的来源发起的请求都将被拒绝。你可以使用 `*` 允许所有来源：

```php
'apps' => [
    [
        'app_id' => 'my-app-id',
        'allowed_origins' => ['laravel.com'],
        // ...
    ]
]
```

### 其他应用

通常，Reverb 会为安装它的应用提供一个 WebSocket 服务器。不过，也可以使用单个 Reverb 安装为多个应用提供服务。

例如，你可能希望维护一个单一的 Laravel 应用，它通过 Reverb 为多个应用提供 WebSocket 连接能力。这可以在应用的 `config/reverb.php` 配置文件中定义多个 `apps` 来实现：

```php
'apps' => [
    [
        'app_id' => 'my-app-one',
        // ...
    ],
    [
        'app_id' => 'my-app-two',
        // ...
    ],
],
```

### SSL

在大多数情况下，安全的 WebSocket 连接由上游 Web 服务器（Nginx 等）在请求被代理到你的 Reverb 服务器之前处理。

不过，在某些情况下（例如在本地开发时），让 Reverb 服务器直接处理安全连接会很有用。如果你正在使用 [Laravel Herd](https://herd.laravel.com) 的安全站点功能，或者正在使用 [Laravel Valet](/docs/{{version}}/valet) 并已针对你的应用运行过 [secure 命令](/docs/{{version}}/valet#securing-sites)，你可以使用 Herd / Valet 为你的站点生成的证书来保障 Reverb 连接的安全。为此，请将 `REVERB_HOST` 环境变量设置为你的站点主机名，或在启动 Reverb 服务器时显式传入 hostname 选项：

```shell
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

由于 Herd 和 Valet 的域名会解析到 `localhost`，运行以上命令后，你的 Reverb 服务器将可以通过安全 WebSocket 协议（`wss`）在 `wss://laravel.test:8080` 访问。

你也可以通过在应用的 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，你可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php) 所支持的任何选项：

```php
'options' => [
    'tls' => [
        'local_cert' => '/path/to/cert.pem'
    ],
],
```

## 运行服务器

可以使用 `reverb:start` Artisan 命令启动 Reverb 服务器：

```shell
php artisan reverb:start
```

默认情况下，Reverb 服务器会启动在 `0.0.0.0:8080`，使其可从所有网络接口访问。

如果需要指定自定义主机或端口，可以在启动服务器时通过 `--host` 和 `--port` 选项进行设置：

```shell
php artisan reverb:start --host=127.0.0.1 --port=9000
```

或者，你也可以在应用的 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

`REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量不应与 `REVERB_HOST` 和 `REVERB_PORT` 混淆。前者指定 Reverb 服务器本身运行所用的主机和端口，而后者一对则指示 Laravel 将广播消息发送到的位置。例如，在生产环境中，你可能将来自公开 Reverb 主机名、端口 `443` 的请求，路由到一个运行在 `0.0.0.0:8080` 的 Reverb 服务器。在这种情况下，你的环境变量应定义如下：

```ini
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.laravel.com
REVERB_PORT=443
```

### 调试

为了提升性能，Reverb 默认不输出任何调试信息。如果你想查看流经 Reverb 服务器的数据流，可以在 `reverb:start` 命令上提供 `--debug` 选项：

```shell
php artisan reverb:start --debug
```

### 重启

由于 Reverb 是一个长时间运行的进程，如果不通过 `reverb:restart` Artisan 命令重启服务器，代码变更不会生效。

`reverb:restart` 命令会确保在停止服务器之前，所有连接都被优雅地终止。如果你使用 Supervisor 等进程管理器运行 Reverb，在所有的连接都终止后，进程管理器会自动重启服务器：

```shell
php artisan reverb:restart
```

## 监控

可以通过与 [Laravel Pulse](/docs/{{version}}/pulse) 的集成来监控 Reverb。启用 Reverb 的 Pulse 集成后，你可以跟踪服务器正在处理的连接数和消息数。

要启用该集成，你首先应确保已 [安装 Pulse](/docs/{{version}}/pulse#installation)。然后，将 Reverb 的任意记录器（recorder）添加到应用的 `config/pulse.php` 配置文件中：

```php
use Laravel\Reverb\Pulse\Recorders\ReverbConnections;
use Laravel\Reverb\Pulse\Recorders\ReverbMessages;

'recorders' => [
    ReverbConnections::class => [
        'sample_rate' => 1,
    ],

    ReverbMessages::class => [
        'sample_rate' => 1,
    ],

    // ...
],
```

接下来，将每个记录器对应的 Pulse 卡片添加到你的 [Pulse 仪表盘](/docs/{{version}}/pulse#dashboard-customization) 中：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

连接活动会通过周期性轮询新更新来记录。为确保该信息在 Pulse 仪表盘上正确呈现，你必须在 Reverb 服务器上运行 `pulse:check` 守护进程。如果你以 [水平扩展](#scaling) 配置运行 Reverb，则只应在一台服务器上运行该守护进程。

## 在生产环境运行 Reverb

由于 WebSocket 服务器的长时间运行特性，你可能需要对服务器和托管环境做一些优化，以确保你的 Reverb 服务器能够有效处理服务器上可用资源所对应的最优连接数。

> [!NOTE]
> [Laravel Cloud](https://cloud.laravel.com) 提供由 Laravel Reverb 集群驱动的全托管 WebSocket 基础设施，让你无需管理基础设施即可扩展并交付启用 Reverb 的应用。

### 打开文件

每个 WebSocket 连接都会驻留在内存中，直到客户端或服务器断开连接。在 Unix 及类 Unix 环境中，每个连接都由一个文件表示。但是，无论是操作系统层面还是应用层面，通常对允许的打开文件数都有限制。

#### 操作系统

在基于 Unix 的操作系统上，你可以使用 `ulimit` 命令查看允许的打开文件数：

```shell
ulimit -n
```

该命令会显示不同用户允许的最大打开文件数。你可以通过编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，将 `forge` 用户的最大打开文件数更新为 10,000，如下所示：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

### 事件循环

在底层，Reverb 使用 ReactPHP 事件循环来管理服务器上的 WebSocket 连接。默认情况下，该事件循环由 `stream_select` 驱动，它不需要任何额外的扩展。不过，`stream_select` 通常限制在 1,024 个打开文件。因此，如果你打算处理超过 1,000 个并发连接，就需要使用一个不受相同限制约束的替代事件循环。

当 `ext-uv` 可用时，Reverb 会自动切换到由 `ext-uv` 驱动的循环。这个 PHP 扩展可以通过 PECL 安装：

```shell
pecl install uv
```

### Web 服务器

在大多数情况下，Reverb 运行在服务器上一个不对外暴露的端口上。因此，为了将流量路由到 Reverb，你应该配置一个反向代理。假设 Reverb 运行在主机 `0.0.0.0`、端口 `8080`，并且你的服务器使用 Nginx Web 服务器，可以使用以下 Nginx 站点配置为 Reverb 服务器定义反向代理：

```nginx
server {
    ...

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass http://0.0.0.0:8080;
    }

    ...
}
```

> [!WARNING]
> Reverb 在 `/app` 处监听 WebSocket 连接，并在 `/apps` 处处理 API 请求。你应确保处理 Reverb 请求的 Web 服务器能够同时服务这两个 URI。如果你使用 [Laravel Forge](https://forge.laravel.com) 管理服务器，你的 Reverb 服务器默认会被正确配置。

通常，Web 服务器会被配置为限制允许的连接数，以防服务器过载。要将 Nginx Web 服务器上允许的连接数提升到 10,000，应更新 `nginx.conf` 文件中的 `worker_rlimit_nofile` 和 `worker_connections` 值：

```nginx
user forge;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
worker_rlimit_nofile 10000;

events {
  worker_connections 10000;
  multi_accept on;
}
```

以上配置允许每个进程最多生成 10,000 个 Nginx 工作进程。此外，该配置将 Nginx 的打开文件限制设置为 10,000。

### 端口

基于 Unix 的操作系统通常会限制服务器上可以打开的端口数量。你可以通过以下命令查看当前允许的范围：

```shell
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768	60999
```

由于每个连接都需要一个空闲端口，以上输出表明服务器最多可处理 28,231（60,999 - 32,768）个连接。尽管我们建议通过 [水平扩展](#scaling) 来增加允许的连接的连接数，但你也可以通过更新服务器 `/etc/sysctl.conf` 配置文件中的允许端口范围来增加可用的打开端口数。

### 进程管理

在大多数情况下，你应该使用 Supervisor 等进程管理器来确保 Reverb 服务器持续运行。如果你使用 Supervisor 运行 Reverb，应更新服务器 `supervisor.conf` 文件中的 `minfds` 设置，以确保 Supervisor 能够打开处理 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

### 扩展

如果你需要处理超过单台服务器所能容纳的连接数，可以对 Reverb 服务器进行水平扩展。利用 Redis 的发布/订阅能力，Reverb 能够跨多台服务器管理连接。当应用的某个 Reverb 服务器收到消息时，该服务器会使用 Redis 将收到的消息发布到所有其他服务器。

要启用水平扩展，你应该在应用的 `.env` 配置文件中将 `REVERB_SCALING_ENABLED` 环境变量设置为 `true`：

```env
REVERB_SCALING_ENABLED=true
```

接下来，你应该准备一台专用的中央 Redis 服务器，所有 Reverb 服务器都将与之通信。Reverb 会使用 [为你的应用配置的默认 Redis 连接](/docs/{{version}}/redis#configuration) 来向所有 Reverb 服务器发布消息。

一旦启用 Reverb 的扩展选项并配置好 Redis 服务器，你只需在与 Redis 服务器能够通信的多台服务器上调用 `reverb:start` 命令即可。这些 Reverb 服务器应放置在负载均衡器之后，由负载均衡器将传入请求均匀分发到各台服务器。

## 事件

Reverb 会在连接生命周期和消息处理过程中调度内部事件。你可以 [监听这些事件](/docs/{{version}}/events)，以便在连接被管理或消息被交换时执行操作。

Reverb 会调度以下事件：

#### `Laravel\Reverb\Events\ChannelCreated`

当创建一个频道时调度。这通常发生在第一个连接订阅某个特定频道时。该事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ChannelRemoved`

当移除一个频道时调度。这通常发生在最后一个连接取消订阅某个频道时。该事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ConnectionPruned`

当服务器剔除一个失效连接时调度。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例。

#### `Laravel\Reverb\Events\MessageReceived`

当从客户端连接收到一条消息时调度。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例以及原始字符串 `$message`。

#### `Laravel\Reverb\Events\MessageSent`

当向客户端连接发送一条消息时调度。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例以及原始字符串 `$message`。
