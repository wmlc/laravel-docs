# Laravel Horizon

> [!NOTE]
> 在深入了解 Laravel Horizon 之前，你应该先熟悉 Laravel 基础的[队列服务](/topic/Laravel%2013.x/wevwmkz9l2.html)。Horizon 在 Laravel 队列的基础上增加了额外功能，如果你还不了解 Laravel 提供的基础队列功能，这些功能可能会让你感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为你的 Laravel [Redis 队列](/topic/Laravel%2013.x/wevwmkz9l2.html) 提供了一个美观的仪表盘和基于代码的配置。Horizon 让你可以轻松监控队列系统的关键指标，例如任务吞吐量、运行时间和任务失败情况。

使用 Horizon 时，你所有的队列工作进程配置都存储在一个简单统一的配置文件中。通过在受版本控制的文件中定义应用的 worker 配置，你可以在部署应用时轻松扩展或修改应用的队列工作进程。

<img src="https://laravel.com/img/docs/horizon-example.png">

## 安装

> [!WARNING]
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 来驱动队列。因此，你应该确保应用的 `config/queue.php` 配置文件中队列连接设置为 `redis`。目前 Horizon 与 Redis Cluster 不兼容。

你可以使用 Composer 包管理器将 Horizon 安装到项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 后，使用 `horizon:install` Artisan 命令发布其资源：

```shell
php artisan horizon:install
```

### 配置

发布 Horizon 的资源后，其主配置文件位于 `config/horizon.php`。该配置文件允许你配置应用的队列工作进程选项。每个选项都包含对其用途的说明，因此请务必仔细浏览该文件。

> [!WARNING]
> Horizon 内部使用一个名为 `horizon` 的 Redis 连接。该 Redis 连接名称是保留的，不应在 `database.php` 配置文件中分配给另一个 Redis 连接，也不应作为 `horizon.php` 配置文件中 `use` 选项的值。

#### 内容安全策略（CSP）Nonce

如果你希望在 Horizon 视图中使用的 script 和 style 标签上添加一个 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)，作为你的 [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) 的一部分，可以使用 `Horizon::cspNonce` 方法指定要使用的 nonce。该方法通常应在中间件中调用，以便为每个请求分配一个新的 nonce：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Horizon\Horizon;
use Symfony\Component\HttpFoundation\Response;

public function handle(Request $request, Closure $next): Response
{
    // 指定用于 Horizon 视图的 CSP nonce
    Horizon::cspNonce('csp-nonce');

    return $next($request);
}
```

可以将此中间件添加到应用 `config/horizon.php` 配置文件的 `middleware` 选项中：

```php
'middleware' => [
    'web',
    App\Http\Middleware\AddHorizonCspNonce::class,
],
```

#### 环境

安装完成后，你应该熟悉的 Horizon 主要配置选项是 `environments` 配置项。该配置项是一个数组，包含应用所运行的环境，并为每个环境定义工作进程选项。默认情况下，该条目包含 `production` 和 `local` 两个环境。不过，你可以根据需要自由添加更多环境：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
        ],
    ],

    'local' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
        ],
    ],
],
```

你还可以定义一个通配符环境（`*`），当找不到其他匹配的环境时使用：

```php
'environments' => [
    // ...

    '*' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
        ],
    ],
],
```

启动 Horizon 时，它会使用应用当前运行环境对应的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/topic/Laravel%2013.x/3dykqpoyl0.html) 的值决定。例如，默认的 `local` Horizon 环境被配置为启动三个工作进程，并自动平衡分配到每个队列的工作进程数量。默认的 `production` 环境被配置为最多启动 10 个工作进程，并自动平衡分配到每个队列的工作进程数量。

> [!WARNING]
> 你应该确保 `horizon` 配置文件的 `environments` 部分包含你计划运行 Horizon 的每个[环境](/topic/Laravel%2013.x/3dykqpoyl0.html) 对应的条目。

#### Supervisor

正如你在 Horizon 的默认配置文件中看到的，每个环境可以包含一个或多个"supervisor"。默认情况下，配置文件将此 supervisor 定义为 `supervisor-1`；不过，你可以随意命名你的 supervisor。每个 supervisor 本质上负责"监督"一组工作进程，并处理跨队列的工作进程平衡。

如果你想定义一组应在该环境中运行的新工作进程，可以向给定环境添加额外的 supervisor。如果你想为应用使用的某个给定队列定义不同的平衡策略或工作进程数量，可以选择这样做。

#### 维护模式

当应用处于[维护模式](/topic/Laravel%2013.x/3dykqpoyl0.html) 时，除非在 Horizon 配置文件中将 supervisor 的 `force` 选项定义为 `true`，否则 Horizon 不会处理队列任务：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'force' => true,
        ],
    ],
],
```

#### 默认值

在 Horizon 的默认配置文件中，你会注意到一个 `defaults` 配置选项。该配置选项指定了应用 supervisor 的默认值。supervisor 的默认配置值会合并到每个环境的 supervisor 配置中，让你在定义 supervisor 时避免不必要的重复。

### 仪表盘授权

可以通过 `/horizon` 路由访问 Horizon 仪表盘。默认情况下，你只能在 `local` 环境中访问该仪表盘。不过，在 `app/Providers/HorizonServiceProvider.php` 文件中，有一个[授权 Gate](/topic/Laravel%2013.x/2wy3l43ykm.html) 定义。该授权 Gate 控制 **非本地** 环境下对 Horizon 的访问。你可以根据需要自由修改该 Gate，以限制对 Horizon 安装的访问：

```php
/**
 * 注册 Horizon 授权 Gate。
 *
 * 该 Gate 决定在非本地环境下谁可以访问 Horizon。
 */
protected function gate(): void
{
    Gate::define('viewHorizon', function (User $user) {
        return in_array($user->email, [
            'taylor@laravel.com',
        ]);
    });
}
```

#### 替代认证策略

请记住，Laravel 会自动将已认证的用户注入到 Gate 闭包中。如果你的应用通过其他方式（例如 IP 限制）提供 Horizon 安全保护，那么你的 Horizon 用户可能不需要"登录"。因此，你需要将上面 `function (User $user)` 闭包签名改为 `function (User $user = null)`，以强制 Laravel 不要求认证。

### 最大任务尝试次数

> [!NOTE]
> 在细化这些选项之前，请确保你熟悉 Laravel 默认的[队列服务](/topic/Laravel%2013.x/wevwmkz9l2.html) 以及"attempts（尝试次数）"的概念。

你可以在 supervisor 的配置中定义任务可以使用的最大尝试次数：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'tries' => 10,
        ],
    ],
],
```

> [!NOTE]
> 该选项类似于使用 Artisan 命令处理队列时的 `--tries` 选项。

在使用 `WithoutOverlapping` 或 `RateLimited` 等中间件时，调整 `tries` 选项至关重要，因为它们会消耗尝试次数。要处理这个问题，可以在 supervisor 级别调整 `tries` 配置值，或者在任务类上定义 `$tries` 属性。

如果你没有设置 `tries` 选项，Horizon 默认只尝试一次，除非任务类定义了 `$tries`，此时以任务类的定义为准，优先于 Horizon 配置。

将 `tries` 或 `$tries` 设置为 0 表示无限次尝试，这在尝试次数不确定时很理想。为了防止无休止的失败，可以通过在任务类上设置 `$maxExceptions` 属性来限制允许的异常数量。

### 任务超时

类似地，你可以在 supervisor 级别设置 `timeout` 值，用于指定工作进程在任务被强制终止前可以运行多少秒。一旦被终止，任务将根据你的队列配置被重试或标记为失败：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'timeout' => 60,
        ],
    ],
],
```

> [!WARNING]
> 使用 `auto` 平衡策略时，Horizon 会将进行中的工作进程视为"挂起"状态，并在缩容时于 Horizon 超时后强制杀死它们。务必确保 Horizon 超时时间大于任何任务级超时时间，否则任务可能会在执行中途被终止。此外，`timeout` 值应始终至少比 `config/queue.php` 配置文件中定义的 `retry_after` 值短几秒。否则，你的任务可能会被处理两次。

### 任务退避

你可以在 supervisor 级别定义 `backoff` 值，用于指定 Horizon 在遇到未处理异常时，重试任务前应等待的时间：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'backoff' => 10,
        ],
    ],
],
```

你还可以使用数组作为 `backoff` 值来配置"指数"退避。在此示例中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有剩余尝试次数，则之后的每次重试均为 10 秒：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'backoff' => [1, 5, 10],
        ],
    ],
],
```

### 其他 Worker 选项

除了 `tries`、`timeout` 和 `backoff` 之外，每个 supervisor 还接受几个其他选项，用于控制其工作进程的行为以及何时自动重启。定期重启工作进程是长时间运行进程的良好实践，因为它有助于防止内存泄漏：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'memory' => 128,
            'maxJobs' => 1000,
            'maxTime' => 3600,
            'sleep' => 3,
            'rest' => 0,
            'nice' => 0,
        ],
    ],
],
```

<div class="content-list" markdown="1">

- `memory` 定义一个工作进程在重启前可以消耗的最大内存量（以兆字节为单位）。默认值为 `128`。
- `maxJobs` 定义一个工作进程在重启前应处理的任务数量。值为 `0` 表示不应根据已处理任务数量重启工作进程。默认值为 `0`。
- `maxTime` 定义一个工作进程在重启前应运行的秒数。值为 `0` 表示不应根据时间重启工作进程。默认值为 `0`。
- `sleep` 定义在没有可用任务时，工作进程在再次轮询队列以查找新任务之前应等待的秒数。默认值为 `3`。
- `rest` 定义处理每个任务之间暂停的秒数。默认值为 `0`。
- `nice` 定义工作进程的"nice 值"（调度优先级）。值越大，进程优先级越低。默认值为 `0`。

</div>

### 静默任务

有时，你可能不希望查看应用或第三方包分发的某些任务。与其让这些任务占用"已完成任务"列表的空间，你可以将它们静音。要开始使用，请将任务类名添加到应用 `horizon` 配置文件的 `silenced` 配置选项中：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

除了静音单个任务类之外，Horizon 还支持基于标签 静音任务。如果你想隐藏共享某个公共标签的多个任务，这会很有用：

```php
'silenced_tags' => [
    'notifications'
],
```

或者，你想要静音的任务可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果任务实现了该接口，它会自动被静音，即使它不在 `silenced` 配置数组中：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Queueable;

    // ...
}
```

## 均衡策略

每个 supervisor 可以处理一个或多个队列，但与 Laravel 的默认队列系统不同，Horizon 允许你从三种工作进程平衡策略中选择：`auto`、`simple` 和 `false`。

### 自动均衡

`auto` 策略是默认策略，它根据队列的当前工作负载调整每个队列的工作进程数量。例如，如果你的 `notifications` 队列有 1,000 个待处理任务，而你的 `default` 队列为空，Horizon 会将更多工作进程分配到你的 `notifications` 队列，直到该队列清空。

使用 `auto` 策略时，你还可以配置 `minProcesses` 和 `maxProcesses` 配置选项：

<div class="content-list" markdown="1">

- `minProcesses` 定义每个队列的最小工作进程数量。该值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 在所有队列上可以扩展到的最大工作进程总数。该值通常应大于队列数乘以 `minProcesses` 的值。要阻止 supervisor 生成任何进程，可以将该值设为 0。

</div>

例如，你可以将 Horizon 配置为在每个队列上至少保持一个进程，并扩展到总共 10 个工作进程：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default', 'notifications'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
        ],
    ],
],
```

`autoScalingStrategy` 配置选项决定 Horizon 如何为队列分配更多工作进程。你可以在两种策略之间选择：

<div class="content-list" markdown="1">

- `time` 策略会根据清空队列所需的总预估时间来分配工作进程。
- `size` 策略会根据队列上的任务总数来分配工作进程。

</div>

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 扩展到满足工作进程需求的速度。在上面的示例中，每三秒最多创建或销毁一个新进程。你可以根据应用的需要自由调整这些值。

#### 队列优先级与自动均衡

使用 `auto` 平衡策略时，Horizon 不会在队列之间强制执行严格的优先级。supervisor 配置中队列的顺序不会影响工作进程的分配方式。相反，Horizon 依赖所选的 `autoScalingStrategy`，根据队列负载动态分配工作进程。

例如，在以下配置中，`high` 队列并不会优先于 `default` 队列，尽管它在列表中排在第一位：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['high', 'default'],
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
    ],
],
```

如果你需要在队列之间强制执行相对优先级，可以定义多个 supervisor 并显式分配处理资源：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default'],
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
        'supervisor-2' => [
            // ...
            'queue' => ['images'],
            'minProcesses' => 1,
            'maxProcesses' => 1,
        ],
    ],
],
```

在此示例中，默认的 `queue` 可以扩展到 10 个进程，而 `images` 队列限制为一个进程。这种配置确保你的队列可以独立扩展。

> [!NOTE]
> 分发资源密集型任务时，有时最好将它们分配到一个具有受限 `maxProcesses` 值的专用队列。否则，这些任务可能会消耗过多的 CPU 资源并导致系统过载。

### 简单均衡

`simple` 策略将工作进程均匀分配到指定的队列。使用该策略时，Horizon 不会自动扩展工作进程数量，而是使用固定数量的进程：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default', 'notifications'],
            'balance' => 'simple',
            'processes' => 10,
        ],
    ],
],
```

在上面的示例中，Horizon 会将 10 个进程平均分配，每个队列分配 5 个进程。

如果你想单独控制分配给每个队列的工作进程数量，可以定义多个 supervisor：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default'],
            'balance' => 'simple',
            'processes' => 10,
        ],
        'supervisor-notifications' => [
            // ...
            'queue' => ['notifications'],
            'balance' => 'simple',
            'processes' => 2,
        ],
    ],
],
```

通过这种配置，Horizon 将为 `default` 队列分配 10 个进程，为 `notifications` 队列分配 2 个进程。

### 不均衡

当 `balance` 选项设置为 `false` 时，Horizon 会严格按照列出的顺序处理队列，类似于 Laravel 的默认队列系统。不过，如果任务开始堆积，它仍会扩展工作进程数量：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default', 'notifications'],
            'balance' => false,
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
    ],
],
```

在上面的示例中，`default` 队列中的任务始终优先于 `notifications` 队列中的任务。例如，如果 `default` 中有 1,000 个任务，而 `notifications` 中只有 10 个，Horizon 会先完全处理完所有 `default` 任务，再处理 `notifications` 中的任何任务。

你可以使用 `minProcesses` 和 `maxProcesses` 选项来控制 Horizon 扩展工作进程的能力：

<div class="content-list" markdown="1">

- `minProcesses` 定义工作进程总数最小值。该值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 可以扩展到的最大工作进程总数。

</div>

## 升级 Horizon

升级到 Horizon 的新主版本时，务必仔细查看 [升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。

## 运行 Horizon

在应用的 `config/horizon.php` 配置文件中配置好 supervisor 和工作进程后，可以使用 `horizon` Artisan 命令启动 Horizon。这一条命令会启动当前环境所有已配置的工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程并指示其继续处理任务：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你还可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令暂停和继续特定的 Horizon supervisor：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令查看 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:supervisor-status` Artisan 命令查看特定 Horizon supervisor 的当前状态：

```shell
php artisan horizon:supervisor-status supervisor-1
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。当前正在处理的任何任务都会完成后，Horizon 将停止执行：

```shell
php artisan horizon:terminate
```

#### 自动重启 Horizon

在本地开发期间，你可以运行 `horizon:listen` 命令。使用 `horizon:listen` 命令时，当你想重新加载更新后的代码时，无需手动重启 Horizon。在使用此功能之前，你应该确保本地开发环境中安装了 [Node](https://nodejs.org)。此外，你应该在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监视库：

```shell
npm install --save-dev chokidar
```

安装 Chokidar 后，可以使用 `horizon:listen` 命令启动 Horizon：

```shell
php artisan horizon:listen
```

在 Docker 或 Vagrant 中运行时，应使用 `--poll` 选项：

```shell
php artisan horizon:listen --poll
```

你可以使用应用 `config/horizon.php` 配置文件中的 `watch` 配置选项来配置文件和目录的监视范围：

```php
'watch' => [
    'app',
    'bootstrap',
    'config',
    'database',
    'public/**/*.php',
    'resources/**/*.php',
    'routes',
    'composer.lock',
    '.env',
],
```

### 部署 Horizon

当你准备将 Horizon 部署到应用的实际服务器时，应该配置一个进程监视器来监视 `php artisan horizon` 命令，并在它意外退出时重启它。别担心，我们会在下面讨论如何安装进程监视器。

在应用的部署过程中，你应该指示 Horizon 进程终止，以便它由你的进程监视器重启并接收你的代码变更：

```shell
php artisan horizon:terminate
```

#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，会在 `horizon` 进程停止执行时自动重启它。要在 Ubuntu 上安装 Supervisor，可以使用以下命令。如果你没有使用 Ubuntu，很可能可以使用操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自己配置 Supervisor 听起来令人头疼，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它可以为你的 Laravel 应用管理后台进程。

#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。在该目录中，你可以创建任意数量的配置文件，指示 supervisor 应如何监视你的进程。例如，我们创建一个 `horizon.conf` 文件来启动并监视一个 `horizon` 进程：

```ini
[program:horizon]
process_name=%(program_name)s
command=php /home/forge/example.com/artisan horizon
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/example.com/horizon.log
stopwaitsecs=3600
```

定义 Supervisor 配置时，应确保 `stopwaitsecs` 的值大于运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成前将其杀死。

> [!WARNING]
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但其他服务器操作系统对 Supervisor 配置文件的存放位置和文件扩展名的要求可能有所不同。请查阅服务器的文档以获取更多信息。

#### 启动 Supervisor

创建配置文件后，可以使用以下命令更新 Supervisor 配置并启动被监视的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]
> 有关运行 Supervisor 的更多信息，请参阅 [Supervisor 文档](http://supervisord.org/index.html)。

## 标签

Horizon 允许你为任务分配"标签"，包括可邮寄类、广播事件、通知和队列事件监听器。事实上，Horizon 会根据附加到任务的 Eloquent 模型，智能且自动地为大多数任务打上标签。例如，请看以下任务：

```php
<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RenderVideo implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public Video $video,
    ) {}

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        // ...
    }
}
```

如果该任务排队时携带一个 `id` 属性为 `1` 的 `App\Models\Video` 实例，它会自动获得 `App\Models\Video:1` 标签。这是因为 Horizon 会搜索任务的属性以查找任何 Eloquent 模型。如果找到 Eloquent 模型，Horizon 会使用模型的类名和主键智能地为任务打标签：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

#### 手动标记任务

如果你想手动为你的某个可排队对象定义标签，可以在类上定义一个 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * 获取应分配给任务的标签。
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['render', 'video:'.$this->video->id];
    }
}
```

#### 手动标记事件监听器

在检索队列事件监听器的标签时，Horizon 会自动将事件实例传递给 `tags` 方法，让你可以将事件数据添加到标签中：

```php
class SendRenderNotifications implements ShouldQueue
{
    /**
     * 获取应分配给监听器的标签。
     *
     * @return array<int, string>
     */
    public function tags(VideoRendered $event): array
    {
        return ['video:'.$event->video->id];
    }
}
```

## 通知

> [!WARNING]
> 在配置 Horizon 发送 Slack 或 SMS 通知时，你应该查看[相关通知渠道的前置要求](/topic/Laravel%2013.x/2ky045l9z8.html)。

如果你想在某一队列等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以从应用的 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    parent::boot();

    Horizon::routeSmsNotificationsTo('15556667777');
    Horizon::routeMailNotificationsTo('example@example.com');
    Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
}
```

#### 配置通知等待时间阈值

你可以在应用的 `config/horizon.php` 配置文件中配置多少秒算作"长时间等待"。该文件中的 `waits` 配置选项允许你控制每个连接 / 队列组合的长时间等待阈值。任何未定义的连接 / 队列组合将默认使用 60 秒的长时间等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

将某个队列的阈值设置为 `0` 会禁用该队列的长时间等待通知。

## 指标

Horizon 包含一个指标仪表盘，提供有关任务和队列等待时间以及吞吐量的信息。为了填充该仪表盘，你应该配置 Horizon 的 `snapshot` Artisan 命令，在应用的 `routes/console.php` 文件中每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

你可以使用应用 `config/horizon.php` 配置文件中的 `metrics.trim_snapshots` 选项来配置 Horizon 为其指标图表保留多少快照。由于该选项限制的是快照数量而非其时间跨度，因此保留时长取决于 `horizon:snapshot` 命令的运行频率：

```php
'metrics' => [
    'trim_snapshots' => [
        'job' => 24,
        'queue' => 24,
    ],
],
```

如果你想删除所有指标数据，可以调用 `horizon:clear-metrics` Artisan 命令：

```shell
php artisan horizon:clear-metrics
```

## 删除失败任务

如果你想删除一个失败的任务，可以使用 `horizon:forget` 命令。`horizon:forget` 命令接受失败任务的 ID 或 UUID 作为其唯一参数：

```shell
php artisan horizon:forget 5
```

如果你想删除所有失败的任务，可以向 `horizon:forget` 命令提供 `--all` 选项：

```shell
php artisan horizon:forget --all
```

## 清空队列中的任务

如果你想从应用的默认队列中删除所有任务，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项以从特定队列中删除任务：

```shell
php artisan horizon:clear --queue=emails
```