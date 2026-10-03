# Laravel Reverb

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
    - [应用凭据](#application-credentials)
    - [允许的来源](#allowed-origins)
    - [其他应用](#additional-applications)
    - [SSL](#ssl)
- [运行服务器](#running-server)
    - [调试](#debugging)
    - [重启](#restarting)
- [监控](#monitoring)
- [在生产环境中运行 Reverb](#production)
    - [打开的文件](#open-files)
    - [事件循环](#event-loop)
    - [Web 服务器](#web-server)
    - [端口](#ports)
    - [进程管理](#process-management)
    - [横向扩展](#scaling)

<a name="introduction"></a>
## 简介

[Laravel Reverb](https://github.com/laravel/reverb) 为你的 Laravel 应用带来快速、可扩展的实时 WebSocket 通信，并与 Laravel 现有的[事件广播工具](/docs/{{version}}/broadcasting)套件无缝集成。

<a name="installation"></a>
## 安装

你可以使用 `install:broadcasting` Artisan 命令安装 Reverb：

```
php artisan install:broadcasting
```

<a name="configuration"></a>
## 配置

在幕后，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，该命令会安装 Reverb 并配上一组合理的默认配置选项。如果你想做任何配置更改，可以更新 Reverb 的环境变量，或更新 `config/reverb.php` 配置文件。

<a name="application-credentials"></a>
### 应用凭据

为了与 Reverb 建立连接，客户端和服务器之间必须交换一组 Reverb"应用"凭据。这些凭据在服务器上配置，用于验证来自客户端的请求。你可以使用以下环境变量定义这些凭据：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

<a name="allowed-origins"></a>
### 允许的来源

你还可以通过更新 `config/reverb.php` 配置文件中 `apps` 部分里的 `allowed_origins` 配置值，来定义客户端请求可以来自哪些来源。任何来自不在允许来源列表中的来源的请求都会被拒绝。你可以使用 `*` 允许所有来源：

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

通常情况下，Reverb 会为安装它的那个应用提供 WebSocket 服务。不过，也可以用单次 Reverb 安装为多个应用提供服务。

例如，你可能希望维护一个 Laravel 应用，通过 Reverb 为多个应用提供 WebSocket 连接。只需在应用的 `config/reverb.php` 配置文件中定义多个 `apps` 即可实现：

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

在大多数情况下，安全 WebSocket 连接会在请求被代理到你的 Reverb 服务器之前，由上游 Web 服务器（Nginx 等）处理。

不过，让 Reverb 服务器直接处理安全连接有时会很有用，比如在本地开发环境中。如果你使用 [Laravel Herd 的](https://herd.laravel.com)安全站点功能，或者使用 [Laravel Valet](/docs/{{version}}/valet) 并已对你的应用执行[安全命令](/docs/{{version}}/valet#securing-sites)，就可以使用为你的站点生成的 Herd / Valet 证书来为 Reverb 连接提供安全保障。为此，请把 `REVERB_HOST` 环境变量设置为你站点的主机名，或在启动 Reverb 服务器时显式传入 hostname 选项：

```sh
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

由于 Herd 和 Valet 域名都会解析到 `localhost`，运行上面的命令后，你的 Reverb 服务器就可以通过安全 WebSocket 协议（`wss`）在 `wss://laravel.test:8080` 访问。

你也可以通过在应用的 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，你可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php)支持的任何选项：

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

```sh
php artisan reverb:start
```

默认情况下，Reverb 服务器会在 `0.0.0.0:8080` 启动，从而可以从所有网络接口访问。

如果你需要指定自定义主机或端口，可以在启动服务器时通过 `--host` 和 `--port` 选项指定：

```sh
php artisan reverb:start --host=127.0.0.1 --port=9000
```

或者，你也可以在应用的 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

请注意不要把 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量与 `REVERB_HOST` 和 `REVERB_PORT` 混淆。前者指定 Reverb 服务器自身运行的主机和端口，而后者则指示 Laravel 把广播消息发送到哪里。例如，在生产环境中，你可以把来自公开 Reverb 主机名、端口为 `443` 的请求路由到运行在 `0.0.0.0:8080` 的 Reverb 服务器。在这种场景下，你的环境变量应定义如下：

```ini
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.laravel.com
REVERB_PORT=443
```

<a name="debugging"></a>
### 调试

为了提升性能，Reverb 默认不输出任何调试信息。如果你想查看流经 Reverb 服务器的数据流，可以给 `reverb:start` 命令提供 `--debug` 选项：

```sh
php artisan reverb:start --debug
```

<a name="restarting"></a>
### 重启

由于 Reverb 是一个长时间运行的进程，如果不通过 `reverb:restart` Artisan 命令重启服务器，对代码所做的改动就不会生效。

`reverb:restart` 命令会确保所有连接都被优雅地终止，然后才停止服务器。如果你使用 Supervisor 之类的进程管理器运行 Reverb，所有连接终止后，服务器会由进程管理器自动重启：

```sh
php artisan reverb:restart
```

<a name="monitoring"></a>
## 监控

你可以通过与 [Laravel Pulse](/docs/{{version}}/pulse) 的集成来监控 Reverb。启用 Reverb 的 Pulse 集成后，你可以跟踪服务器正在处理的连接数和消息数。

要启用该集成，你应先确保已[安装 Pulse](/docs/{{version}}/pulse#installation)。然后，把 Reverb 的任意记录器添加到应用的 `config/pulse.php` 配置文件中：

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

    ...
],
```

接下来，为每个记录器把对应的 Pulse 卡片添加到你的 [Pulse 仪表盘](/docs/{{version}}/pulse#dashboard-customization)：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

连接活动通过定期轮询新更新来记录。为确保该信息在 Pulse 仪表盘上正确呈现，你必须在 Reverb 服务器上运行 `pulse:check` 守护进程。如果你采用[横向扩展](#scaling)配置运行 Reverb，则只应在其中一台服务器上运行该守护进程。

<a name="production"></a>
## 在生产环境中运行 Reverb

由于 WebSocket 服务器具有长时间运行的特性，你可能需要对服务器和托管环境做一些优化，以确保 Reverb 服务器能以可用资源高效处理最优数量的连接。

> [!NOTE]
> 如果你的站点由 [Laravel Forge](https://forge.laravel.com) 管理，你可以直接在 "Application" 面板中为 Reverb 自动优化服务器。启用 Reverb 集成后，Forge 会确保你的服务器已达到生产就绪状态，包括安装任何所需的扩展并提高允许的连接数。

<a name="open-files"></a>
### 打开的文件

每个 WebSocket 连接都会一直被占用内存，直到客户端或服务器断开连接。在 Unix 及类 Unix 环境中，每个连接都由一个文件表示。然而，操作系统层面和应用层面通常都对允许打开的文件数量有限制。

<a name="operating-system"></a>
#### 操作系统

在基于 Unix 的操作系统上，你可以使用 `ulimit` 命令查看允许打开的文件数量：

```sh
ulimit -n
```

该命令会显示不同用户所允许的打开文件限制。你可以编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，把 `forge` 用户允许打开的最大文件数更新为 10,000 如下所示：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

<a name="event-loop"></a>
### 事件循环

在底层，Reverb 使用 ReactPHP 事件循环管理服务器上的 WebSocket 连接。默认情况下，该事件循环由 `stream_select` 驱动，不需要任何额外扩展。然而，`stream_select` 通常被限制为 1,024 个打开的文件。因此，如果你打算处理超过 1,000 个并发连接，就需要使用不受同样限制的替代事件循环。

在可用时，Reverb 会自动切换到由 `ext-uv` 驱动的事件循环。这个 PHP 扩展可以通过 PECL 安装：

```sh
pecl install uv
```

<a name="web-server"></a>
### Web 服务器

在大多数情况下，Reverb 运行在服务器上不对外开放的端口上。因此，为了把流量路由到 Reverb，你应当配置反向代理。假设 Reverb 运行在主机 `0.0.0.0`、端口 `8080`，并且你的服务器使用 Nginx Web 服务器，可以使用以下 Nginx 站点配置为你的 Reverb 服务器定义反向代理：

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

通常，Web 服务器会被配置为限制允许的连接数，以防止服务器过载。要把 Nginx Web 服务器上允许的连接数增加到 10,000，应更新 `nginx.conf` 文件中的 `worker_rlimit_nofile` 和 `worker_connections` 值：

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

上述配置允许每个进程最多派生 10,000 个 Nginx 工作进程。此外，该配置把 Nginx 的打开文件限制设置为 10,000。

<a name="ports"></a>
### 端口

基于 Unix 的操作系统通常会限制服务器上可打开的端口数量。你可以通过以下命令查看当前允许的范围：

 ```sh
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768	60999
```

上面的输出表明服务器最多可以处理 28,231（60,999 - 32,768）个连接，因为每个连接都需要一个空闲端口。虽然我们推荐使用[横向扩展](#scaling)来增加允许的连接数，但你也可以通过更新服务器 `/etc/sysctl.conf` 配置文件中的允许端口范围，来增加可用打开的端口数量。

<a name="process-management"></a>
### 进程管理

在大多数情况下，你应当使用 Supervisor 之类的进程管理器，确保 Reverb 服务器持续运行。如果你使用 Supervisor 运行 Reverb，应更新服务器 `supervisor.conf` 文件中的 `minfds` 设置，确保 Supervisor 能够打开处理 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

<a name="scaling"></a>
### 横向扩展

如果你需要处理超过单台服务器允许数量的连接，可以对 Reverb 服务器进行横向扩展。借助 Redis 的发布 / 订阅能力，Reverb 能够管理跨多台服务器的连接。当你的某个 Reverb 服务器收到一条消息时，该服务器会使用 Redis 把收到的消息发布给所有其他服务器。

要启用横向扩展，应把 `REVERB_SCALING_ENABLED` 环境变量设为 `true`，写入应用的 `.env` 配置文件：

```env
REVERB_SCALING_ENABLED=true
```

接下来，你应当准备一台专用的中心 Redis 服务器，所有 Reverb 服务器都与它通信。Reverb 会使用[为你的应用配置的默认 Redis 连接](/docs/{{version}}/redis#configuration)把消息发布到你的所有 Reverb 服务器。

启用 Reverb 的扩展选项并配置好 Redis 服务器后，只需要在多台能够与你的 Redis 服务器通信的服务器上执行 `reverb:start` 命令即可。这些 Reverb 服务器应放在负载均衡器之后，由它把传入请求均匀分配到各台服务器。
