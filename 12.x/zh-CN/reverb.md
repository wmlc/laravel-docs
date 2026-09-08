# Laravel Reverb

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
    - [应用凭证](#application-credentials)
    - [允许的来源](#allowed-origins)
    - [其他应用](#additional-applications)
    - [SSL](#ssl)
- [运行服务器](#running-server)
    - [调试](#debugging)
    - [重启](#restarting)
- [监控](#monitoring)
- [在生产环境中运行 Reverb](#production)
    - [打开文件数](#open-files)
    - [事件循环](#event-loop)
    - [Web 服务器](#web-server)
    - [端口](#ports)
    - [进程管理](#process-management)
    - [扩容](#scaling)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel Reverb](https://github.com/laravel/reverb) 为你的 Laravel 应用带来极速、可扩展的实时 WebSocket 通信，并与 Laravel 现有的[事件广播工具](/docs/{{version}}/broadcasting)套件无缝集成。

<a name="installation"></a>
## 安装

你可以使用 `install:broadcasting` Artisan 命令来安装 Reverb：

```shell
php artisan install:broadcasting
```

<a name="configuration"></a>
## 配置

在幕后，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，后者会以一套合理的默认配置选项来安装 Reverb。如果你想修改任何配置，可以通过更新 Reverb 的环境变量，或者更新 `config/reverb.php` 配置文件来实现。

<a name="application-credentials"></a>
### 应用凭证

为了建立与 Reverb 的连接，客户端和服务器之间必须交换一组 Reverb「应用」凭证。这些凭证在服务器端配置，用于验证来自客户端的请求。你可以使用以下环境变量来定义这些凭证：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

<a name="allowed-origins"></a>
### 允许的来源

你还可以通过更新 `config/reverb.php` 配置文件中 `apps` 部分的 `allowed_origins` 配置值，来定义客户端请求可以来自哪些来源。任何来自未列入允许来源列表的请求都会被拒绝。你可以使用 `*` 来允许所有来源：

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
### 其他应用

通常，Reverb 为其安装所在的应用提供 WebSocket 服务器。不过，一次 Reverb 安装也可以为多个应用提供服务。

例如，你可能希望维护单个 Laravel 应用，通过 Reverb 为多个应用提供 WebSocket 连接。这可以通过在应用的 `config/reverb.php` 配置文件中定义多个 `apps` 来实现：

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

在大多数情况下，安全的 WebSocket 连接由上游 Web 服务器（Nginx 等）处理，然后请求才会被代理到你的 Reverb 服务器。

不过，有时让 Reverb 服务器直接处理安全连接也很有用，例如在本地开发期间。如果你在使用 [Laravel Herd](https://herd.laravel.com) 的安全站点功能，或者你在使用 [Laravel Valet](/docs/{{version}}/valet) 并且已经对你的应用运行了 [secure 命令](/docs/{{version}}/valet#securing-sites)，那么你可以使用为站点生成的 Herd / Valet 证书来保护 Reverb 连接。为此，请将 `REVERB_HOST` 环境变量设置为站点的域名，或者在启动 Reverb 服务器时显式传递 hostname 选项：

```shell
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

由于 Herd 和 Valet 的域名会解析到 `localhost`，运行上述命令后，你的 Reverb 服务器就可以通过安全 WebSocket 协议（`wss`）在 `wss://laravel.test:8080` 访问。

你也可以通过在应用的 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，你可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php)所支持的任何选项：

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

默认情况下，Reverb 服务器会在 `0.0.0.0:8080` 上启动，使其可以从所有网络接口访问。

如果需要指定自定义的主机或端口，可以在启动服务器时通过 `--host` 和 `--port` 选项来实现：

```shell
php artisan reverb:start --host=127.0.0.1 --port=9000
```

或者，你也可以在应用的 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

不要将 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量与 `REVERB_HOST` 和 `REVERB_PORT` 混淆。前者指定 Reverb 服务器本身运行所在的主机和端口，而后者这对变量则告知 Laravel 将广播消息发送到哪里。例如，在生产环境中，你可以将来自公共 Reverb 域名 443 端口的请求路由到运行在 `0.0.0.0:8080` 上的 Reverb 服务器。在这种场景下，环境变量应定义如下：

```ini
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.laravel.com
REVERB_PORT=443
```

<a name="debugging"></a>
### 调试

为了提升性能，Reverb 默认不输出任何调试信息。如果你想查看流经 Reverb 服务器的数据流，可以向 `reverb:start` 命令提供 `--debug` 选项：

```shell
php artisan reverb:start --debug
```

<a name="restarting"></a>
### 重启

由于 Reverb 是一个常驻运行的长时进程，如果不通过 `reverb:restart` Artisan 命令重启服务器，代码的变更就不会生效。

`reverb:restart` 命令会确保所有连接都被优雅终止后再停止服务器。如果你使用 Supervisor 之类的进程管理器来运行 Reverb，那么在所有连接终止后，进程管理器会自动重启服务器：

```shell
php artisan reverb:restart
```

<a name="monitoring"></a>
## 监控

可以通过与 [Laravel Pulse](/docs/{{version}}/pulse) 集成来监控 Reverb。启用 Reverb 的 Pulse 集成后，你就可以跟踪服务器正在处理的连接数和消息数。

要启用该集成，你首先应当确保已经[安装了 Pulse](/docs/{{version}}/pulse#installation)。然后，将 Reverb 的任意记录器添加到应用的 `config/pulse.php` 配置文件中：

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

接下来，将各记录器对应的 Pulse 卡片添加到你的 [Pulse 仪表盘](/docs/{{version}}/pulse#dashboard-customization)：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

连接活动通过周期性轮询新更新来记录。为确保这些信息在 Pulse 仪表盘上正确渲染，你必须在 Reverb 服务器上运行 `pulse:check` 守护进程。如果你以[水平扩容](#scaling)配置运行 Reverb，则只应在一台服务器上运行该守护进程。

<a name="production"></a>
## 在生产环境中运行 Reverb

由于 WebSocket 服务器需要长时运行的特性，你可能需要对服务器和托管环境做一些优化，以确保 Reverb 服务器能够在服务器可用资源下有效处理最优数量的连接。

> [!NOTE]
> [Laravel Cloud](https://cloud.laravel.com) 提供由 Laravel Reverb 集群驱动的全托管 WebSocket 基础设施，让你无需管理基础设施即可扩展并交付启用 Reverb 的应用。

<a name="open-files"></a>
### 打开文件数

每个 WebSocket 连接都会保存在内存中，直到客户端或服务器断开连接。在 Unix 及类 Unix 环境中，每个连接都由一个文件表示。然而，操作系统层面和应用层面通常都对允许打开的文件数量有限制。

<a name="operating-system"></a>
#### 操作系统

在基于 Unix 的操作系统上，你可以使用 `ulimit` 命令查看允许打开的文件数量：

```shell
ulimit -n
```

该命令会显示不同用户被允许的打开文件数上限。你可以通过编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，将 `forge` 用户的最大打开文件数更新为 10,000，写法如下：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

<a name="event-loop"></a>
### 事件循环

在底层，Reverb 使用 ReactPHP 事件循环来管理服务器上的 WebSocket 连接。默认情况下，该事件循环由 `stream_select` 驱动，无需任何额外的扩展。不过，`stream_select` 通常被限制为 1,024 个打开的文件。因此，如果你计划处理超过 1,000 个并发连接，就需要使用不受这一限制的替代事件循环。

Reverb 会在可用时自动切换到由 `ext-uv` 驱动的事件循环。这个 PHP 扩展可以通过 PECL 安装：

```shell
pecl install uv
```

<a name="web-server"></a>
### Web 服务器

在大多数情况下，Reverb 运行在服务器上非面向 Web 的端口上。因此，为了将流量路由到 Reverb，你应当配置反向代理。假设 Reverb 运行在主机 `0.0.0.0` 和端口 `8080` 上，而你的服务器使用 Nginx Web 服务器，那么可以使用如下 Nginx 站点配置为你的 Reverb 服务器定义反向代理：

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
> Reverb 在 `/app` 处监听 WebSocket 连接，并在 `/apps` 处处理 API 请求。你应当确保处理 Reverb 请求的 Web 服务器能够同时服务这两个 URI。如果你使用 [Laravel Forge](https://forge.laravel.com) 来管理服务器，你的 Reverb 服务器默认就会被正确配置。

通常，Web 服务器会被配置为限制允许的连接数，以防止服务器过载。要将 Nginx Web 服务器允许的连接数提升到 10,000，应当更新 `nginx.conf` 文件中的 `worker_rlimit_nofile` 和 `worker_connections` 值：

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

上面的配置允许每个进程最多派生 10,000 个 Nginx worker。此外，该配置还将 Nginx 的打开文件数上限设置为 10,000。

<a name="ports"></a>
### 端口

基于 Unix 的操作系统通常会限制服务器上可以打开的端口数量。你可以通过以下命令查看当前允许的范围：

```shell
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768	60999
```

上面的输出表明，服务器最多可以处理 28,231（60,999 - 32,768）个连接，因为每个连接都需要一个空闲端口。尽管我们推荐通过[水平扩容](#scaling)来增加允许的连接数，但你也可以通过更新服务器 `/etc/sysctl.conf` 配置文件中的允许端口范围，来增加可用的打开端口数量。

<a name="process-management"></a>
### 进程管理

在大多数情况下，你应当使用 Supervisor 之类的进程管理器来确保 Reverb 服务器持续运行。如果你使用 Supervisor 运行 Reverb，应当更新服务器 `supervisor.conf` 文件中的 `minfds` 设置，以确保 Supervisor 能够打开处理 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

<a name="scaling"></a>
### 扩容

如果单个服务器允许的连接数无法满足你的需求，你可以对 Reverb 服务器进行水平扩容。借助 Redis 的发布／订阅能力，Reverb 能够管理跨多台服务器的连接。当应用的某台 Reverb 服务器收到消息时，该服务器会使用 Redis 将传入的消息发布给所有其他服务器。

要启用水平扩容，你应当在应用的 `.env` 配置文件中将 `REVERB_SCALING_ENABLED` 环境变量设置为 `true`：

```env
REVERB_SCALING_ENABLED=true
```

接下来，你应当准备一台专用的中心 Redis 服务器，所有 Reverb 服务器都将与它通信。Reverb 会使用[为应用配置的默认 Redis 连接](/docs/{{version}}/redis#configuration)向你的所有 Reverb 服务器发布消息。

启用 Reverb 的扩容选项并配置好 Redis 服务器之后，你只需在多台能够与你的 Redis 服务器通信的服务器上调用 `reverb:start` 命令即可。这些 Reverb 服务器应当置于负载均衡器之后，由它将传入请求均匀地分发到各服务器。

<a name="events"></a>
## 事件

Reverb 会在连接的生命周期和消息处理过程中分发内部事件。你可以[监听这些事件](/docs/{{version}}/events)，在连接被管理或消息被交换时执行相应操作。

以下是 Reverb 分发的事件：

#### `Laravel\Reverb\Events\ChannelCreated`

在通道创建时分发。这通常发生在第一个连接订阅某个特定通道时。该事件会接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ChannelRemoved`

在通道移除时分发。这通常发生在最后一个连接取消订阅某个通道时。该事件会接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ConnectionPruned`

在失效连接被服务器修剪时分发。该事件会接收 `Laravel\Reverb\Contracts\Connection` 实例。

#### `Laravel\Reverb\Events\MessageReceived`

在收到来自客户端连接的消息时分发。该事件会接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。

#### `Laravel\Reverb\Events\MessageSent`

在向客户端连接发送消息时分发。该事件会接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。
