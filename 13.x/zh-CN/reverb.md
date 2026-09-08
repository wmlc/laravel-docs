# Laravel Reverb

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
    - [应用凭据](#application-credentials)
    - [允许的来源](#allowed-origins)
    - [额外的应用](#additional-applications)
    - [SSL](#ssl)
- [运行服务器](#running-server)
    - [调试](#debugging)
    - [重启](#restarting)
- [监控](#monitoring)
- [在生产环境运行 Reverb](#production)
    - [打开的文件数](#open-files)
    - [事件循环](#event-loop)
    - [Web 服务器](#web-server)
    - [端口](#ports)
    - [进程管理](#process-management)
    - [扩展](#scaling)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel Reverb](https://github.com/laravel/reverb) 将极速且可扩展的实时 WebSocket 通信直接带到你的 Laravel 应用中，并与 Laravel 现有的[事件广播工具](/docs/{{version}}/broadcasting)套件无缝集成。

<a name="installation"></a>
## 安装

你可以使用 `install:broadcasting` Artisan 命令安装 Reverb：

```shell
php artisan install:broadcasting
```

<a name="configuration"></a>
## 配置

在幕后，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，它会使用一套合理的默认配置选项安装 Reverb。如果你想进行任何配置更改，可以通过更新 Reverb 的环境变量或更新 `config/reverb.php` 配置文件来实现。

<a name="application-credentials"></a>
### 应用凭据

为了与 Reverb 建立连接，必须在客户端和服务器之间交换一组 Reverb"应用"凭据。这些凭据在服务器上配置，用于验证来自客户端的请求。你可以使用以下环境变量定义这些凭据：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

<a name="allowed-origins"></a>
### 允许的来源

你还可以通过更新 `config/reverb.php` 配置文件 `apps` 部分中 `allowed_origins` 配置值，来定义客户端请求可以来自的来源。来自未列入允许来源的来源的任何请求都将被拒绝。你可以使用 `*` 允许所有来源：

```php
'apps' => [
    [
        'app_id' => 'my-app-id',
        'allowed_origins' => ['laravel.com'],
        // ...
    ]
]
```

<a name="additional-applications"></a>
### 额外的应用

通常，Reverb 为其所安装应用提供 WebSocket 服务器。不过，使用单个 Reverb 安装可以服务多个应用。

例如，你可能希望维护一个单独的 Laravel 应用，通过 Reverb 为多个应用提供 WebSocket 连接。这可以通过在应用 `config/reverb.php` 配置文件中定义多个 `apps` 来实现：

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

<a name="ssl"></a>
### SSL

在大多数情况下，安全的 WebSocket 连接由上游 Web 服务器（Nginx 等）在请求被代理到 Reverb 服务器之前处理。

不过，有时（例如在本地开发期间）让 Reverb 服务器直接处理安全连接可能很有用。如果你使用 [Laravel Herd](https://herd.laravel.com) 的安全站点功能，或使用 [Laravel Valet](/docs/{{version}}/valet) 并对应用运行了 [secure 命令](/docs/{{version}}/valet#securing-sites)，你可以使用为站点生成的 Herd / Valet 证书来保护 Reverb 连接。为此，请将 `REVERB_HOST` 环境变量设置为站点的主机名，或在启动 Reverb 服务器时显式传递主机名选项：

```shell
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

由于 Herd 和 Valet 域解析到 `localhost`，运行上述命令将使你的 Reverb 服务器可通过 `wss://laravel.test:8080` 的安全 WebSocket 协议（`wss`）访问。

你也可以通过在应用 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，你可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php)支持的任何选项：

```php
'options' => [
    'tls' => [
        'local_cert' => '/path/to/cert.pem'
    ],
],
```

<a name="running-server"></a>
## 运行服务器

可以使用 `reverb:start` Artisan 命令启动 Reverb 服务器：

```shell
php artisan reverb:start
```

默认情况下，Reverb 服务器将在 `0.0.0.0:8080` 启动，使其可以从所有网络接口访问。

如果你需要指定自定义的主机或端口，可以在启动服务器时通过 `--host` 和 `--port` 选项实现：

```shell
php artisan reverb:start --host=127.0.0.1 --port=9000
```

另外，你也可以在应用 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

`REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量不应与 `REVERB_HOST` 和 `REVERB_PORT` 混淆。前者指定 Reverb 服务器本身的运行主机和端口，而后者告知 Laravel 在哪里发送广播消息。例如，在生产环境中，你可能会将来自公共 Reverb 主机名 443 端口的请求路由到运行在 `0.0.0.0:8080` 的 Reverb 服务器。在这种场景下，你的环境变量应如下定义：

```ini
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.laravel.com
REVERB_PORT=443
```

<a name="debugging"></a>
### 调试

为了提高性能，Reverb 默认不会输出任何调试信息。如果你想查看流经 Reverb 服务器的数据流，可以向 `reverb:start` 命令提供 `--debug` 选项：

```shell
php artisan reverb:start --debug
```

<a name="restarting"></a>
### 重启

由于 Reverb 是一个长时间运行的进程，如果不通过 `reverb:restart` Artisan 命令重启服务器，代码的更改将不会生效。

`reverb:restart` 命令确保在停止服务器之前优雅地终止所有连接。如果你使用 Supervisor 等进程管理器运行 Reverb，在所有连接终止后，进程管理器会自动重启服务器：

```shell
php artisan reverb:restart
```

<a name="monitoring"></a>
## 监控

Reverb 可以通过与 [Laravel Pulse](/docs/{{version}}/pulse) 的集成进行监控。通过启用 Reverb 的 Pulse 集成，你可以跟踪服务器处理的连接数和消息数。

要启用该集成，你应首先确保已[安装 Pulse](/docs/{{version}}/pulse#installation)。然后，将 Reverb 的任何记录器添加到应用 `config/pulse.php` 配置文件中：

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

接下来，为每个记录器将 Pulse 卡片添加到 [Pulse 仪表盘](/docs/{{version}}/pulse#dashboard-customization)：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

连接活动是通过定期轮询新更新来记录的。为确保此信息在 Pulse 仪表盘上正确渲染，你必须在 Reverb 服务器上运行 `pulse:check` 守护进程。如果你在[水平扩展](#scaling)配置中运行 Reverb，应只在其中一台服务器上运行此守护进程。

<a name="production"></a>
## 在生产环境运行 Reverb

由于 WebSocket 服务器的长期运行特性，你可能需要对服务器和托管环境进行一些优化，以确保 Reverb 服务器能够根据服务器可用资源有效处理最佳数量的连接。

> [!NOTE]
> [Laravel Cloud](https://cloud.laravel.com) 提供由 Laravel Reverb 集群驱动的完全托管 WebSocket 基础设施，让你无需管理基础设施即可扩展和交付启用 Reverb 的应用。

<a name="open-files"></a>
### 打开的文件数

每个 WebSocket 连接都会保存在内存中，直到客户端或服务器断开连接。在 Unix 及类 Unix 环境中，每个连接由一个文件表示。但是，在操作系统和应用层面通常都限制允许的打开文件数。

<a name="operating-system"></a>
#### 操作系统

在基于 Unix 的操作系统上，你可以使用 `ulimit` 命令确定允许的打开文件数：

```shell
ulimit -n
```

此命令将显示不同用户允许的打开文件限制。你可以通过编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，将 `forge` 用户的最大打开文件数更新为 10,000 如下所示：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

<a name="event-loop"></a>
### 事件循环

在底层，Reverb 使用 ReactPHP 事件循环来管理服务器上的 WebSocket 连接。默认情况下，此事件循环由 `stream_select` 驱动，它不需要任何额外的扩展。但是，`stream_select` 通常限制为 1,024 个打开文件。因此，如果你计划处理超过 1,000 个并发连接，则需要使用不受相同限制约束的替代事件循环。

当可用时，Reverb 会自动切换到由 `ext-uv` 驱动的循环。此 PHP 扩展可通过 PECL 安装：

```shell
pecl install uv
```

<a name="web-server"></a>
### Web 服务器

在大多数情况下，Reverb 在服务器上的非 Web 面向端口运行。因此，为了将流量路由到 Reverb，你应配置一个反向代理。假设 Reverb 运行在主机 `0.0.0.0` 和端口 `8080` 上，且你的服务器使用 Nginx Web 服务器，可以使用以下 Nginx 站点配置为你的 Reverb 服务器定义反向代理：

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
> Reverb 在 `/app` 监听 WebSocket 连接，并在 `/apps` 处理 API 请求。你应确保处理 Reverb 请求的 Web 服务器能够提供这两个 URI。如果你使用 [Laravel Forge](https://forge.laravel.com) 管理服务器，你的 Reverb 服务器默认会被正确配置。

通常，Web 服务器被配置为限制允许的连接数，以防止服务器过载。要将 Nginx Web 服务器上允许的连接数增加到 10,000，应更新 `nginx.conf` 文件的 `worker_rlimit_nofile` 和 `worker_connections` 值：

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

上述配置将允许每个进程最多产生 10,000 个 Nginx worker。此外，此配置将 Nginx 的打开文件限制设置为 10,000。

<a name="ports"></a>
### 端口

基于 Unix 的操作系统通常限制服务器上可以打开的端口数。你可以通过以下命令查看当前允许的范围：

```shell
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768	60999
```

上述输出显示服务器最多可以处理 28,231（60,999 - 32,768）个连接，因为每个连接需要一个空闲端口。虽然我们建议通过[水平扩展](#scaling)来增加允许的连接数，但你也可以通过更新服务器 `/etc/sysctl.conf` 配置文件中的允许端口范围来增加可用的开放端口数。

<a name="process-management"></a>
### 进程管理

在大多数情况下，你应使用 Supervisor 等进程管理器来确保 Reverb 服务器持续运行。如果你使用 Supervisor 运行 Reverb，应更新服务器 `supervisor.conf` 文件的 `minfds` 设置，以确保 Supervisor 能够打开处理与 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

<a name="scaling"></a>
### 扩展

如果你需要处理超过单个服务器允许的连接数，可以将 Reverb 服务器进行水平扩展。利用 Redis 的发布 / 订阅能力，Reverb 能够跨多个服务器管理连接。当消息被应用的一台 Reverb 服务器接收时，该服务器会使用 Redis 将传入消息发布到所有其他服务器。

要启用水平扩展，你应在应用 `.env` 配置文件中将 `REVERB_SCALING_ENABLED` 环境变量设置为 `true`：

```env
REVERB_SCALING_ENABLED=true
```

接下来，你应拥有一台所有 Reverb 服务器都将与之通信的专用、中心化的 Redis 服务器。Reverb 将使用[为应用配置的默认 Redis 连接](/docs/{{version}}/redis#configuration)向所有 Reverb 服务器发布消息。

启用 Reverb 的扩展选项并配置好 Redis 服务器后，你可以简单地在多台能够与 Redis 服务器通信的服务器上调用 `reverb:start` 命令。这些 Reverb 服务器应放置在负载均衡器后面，以便将传入请求均匀分布到各服务器。

<a name="events"></a>
## 事件

Reverb 在连接和消息处理的生命周期中会分发内部事件。你可以[监听这些事件](/docs/{{version}}/events)，以便在管理连接或交换消息时执行操作。

以下是 Reverb 分发的事件：

#### `Laravel\Reverb\Events\ChannelCreated`

当频道被创建时触发。这通常发生在第一个连接订阅特定频道时。该事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ChannelRemoved`

当频道被移除时触发。这通常发生在最后一个连接取消订阅某个频道时。该事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ConnectionPruned`

当服务器修剪过时连接时触发。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例。

#### `Laravel\Reverb\Events\MessageReceived`

当从客户端连接收到消息时触发。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。

#### `Laravel\Reverb\Events\MessageSent`

当消息被发送到客户端连接时触发。该事件接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。
