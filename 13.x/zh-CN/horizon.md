# Laravel Horizon

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [仪表盘授权](#dashboard-authorization)
    - [最大任务尝试次数](#max-job-attempts)
    - [任务超时](#job-timeout)
    - [任务退避](#job-backoff)
    - [其他工作进程选项](#other-worker-options)
    - [静默任务](#silenced-jobs)
- [负载均衡策略](#balancing-strategies)
    - [自动均衡](#auto-balancing)
    - [简单均衡](#simple-balancing)
    - [不均衡](#no-balancing)
- [升级 Horizon](#upgrading-horizon)
- [运行 Horizon](#running-horizon)
    - [部署 Horizon](#deploying-horizon)
- [标签](#tags)
- [通知](#notifications)
- [指标](#metrics)
- [删除失败的任务](#deleting-failed-jobs)
- [清空队列中的任务](#clearing-jobs-from-queues)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 在深入研究 Laravel Horizon 之前，你应该先熟悉 Laravel 的基础[队列服务](/docs/{{version}}/queues)。Horizon 为 Laravel 队列增添了额外功能，如果你还不熟悉 Laravel 提供的基本队列功能，这些功能可能会让你感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为你的、由 Laravel 驱动的 [Redis 队列](/docs/{{version}}/queues)提供了一个美观的仪表盘和代码驱动的配置。Horizon 让你能够轻松监控队列系统的关键指标，例如任务吞吐量、运行时和任务失败。

使用 Horizon 时，所有队列工作进程配置都存储在一个简单、统一的配置文件中。通过在版本控制文件中定义应用的工作进程配置，你可以在部署应用时轻松扩展或修改应用的队列工作进程。

<img src="https://laravel.com/img/docs/horizon-example.png">

<a name="installation"></a>
## 安装

> [!WARNING]
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 为队列提供支持。因此，你应确保应用 `config/queue.php` 配置文件中的队列连接设置为 `redis`。Horizon 目前与 Redis Cluster 不兼容。

你可以使用 Composer 包管理器将 Horizon 安装到项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 后，使用 `horizon:install` Artisan 命令发布其资源：

```shell
php artisan horizon:install
```

<a name="configuration"></a>
### 配置

发布 Horizon 的资源后，其主要配置文件将位于 `config/horizon.php`。该配置文件允许你为应用配置队列工作进程选项。每个配置选项都包含其用途的说明，所以请务必充分浏览该文件。

> [!WARNING]
> Horizon 在内部使用一个名为 `horizon` 的 Redis 连接。该 Redis 连接名称是保留的，不应在 `database.php` 配置文件中将其分配给其他 Redis 连接，也不应将其作为 `horizon.php` 配置文件中 `use` 选项的值。

<a name="content-security-policy-csp-nonce"></a>
#### 内容安全策略（CSP）Nonce

如果你想在 Horizon 视图使用的脚本和样式标签上使用 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)，作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，可以使用 `Horizon::cspNonce` 方法指定要使用的 nonce。此方法通常应在中间件中调用，以便为每个请求分配新的 nonce：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Horizon\Horizon;
use Symfony\Component\HttpFoundation\Response;

public function handle(Request $request, Closure $next): Response
{
    Horizon::cspNonce('csp-nonce');

    return $next($request);
}
```

你可以将该中间件添加到应用 `config/horizon.php` 配置文件中的 `middleware` 选项中：

```php
'middleware' => [
    'web',
    App\Http\Middleware\AddHorizonCspNonce::class,
],
```

<a name="environments"></a>
#### 环境

安装后，你应该熟悉的第一个主要 Horizon 配置选项是 `environments` 配置选项。该配置选项是一个数组，包含应用运行的环境，并为每个环境定义工作进程选项。默认情况下，该条目包含 `production` 和 `local` 环境。不过，你可以根据需要自由添加更多环境：

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

你还可以定义一个通配符环境（`*`），当找不到其他匹配环境时使用：

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

当你启动 Horizon 时，它会使用应用所运行环境的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#determining-the-current-environment)的值决定。例如，默认的 `local` Horizon 环境被配置为启动三个工作进程，并自动均衡分配给每个队列的工作进程数量。默认的 `production` 环境被配置为最多启动 10 个工作进程，并自动均衡分配给每个队列的工作进程数量。

> [!WARNING]
> 你应确保 `horizon` 配置文件的 `environments` 部分包含你计划运行 Horizon 的每个[环境](/docs/{{version}}/configuration#environment-configuration)的条目。

<a name="supervisors"></a>
#### 主管（Supervisor）

正如你在 Horizon 的默认配置文件中所见，每个环境可以包含一个或多个"主管"。默认情况下，配置文件将该主管定义为 `supervisor-1`；不过，你可以随意命名你的主管。每个主管主要负责"监管"一组工作进程，并负责在各队列之间均衡工作进程。

如果你希望在一个环境中定义一组新的、应运行的工作进程，你可以为该环境添加额外的主管。当你希望为应用使用的某个队列定义不同的均衡策略或工作进程数量时，可以这样做。

<a name="maintenance-mode"></a>
#### 维护模式

当你的应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，已排队的任务将不会被 Horizon 处理，除非在 Horizon 配置文件中将该主管的 `force` 选项定义为 `true`：

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

<a name="default-values"></a>
#### 默认值

在 Horizon 的默认配置文件中，你会注意到一个 `defaults` 配置选项。该配置选项指定应用的[主管](#supervisors)的默认值。主管的默认配置值会合并到每个环境的主管配置中，使你在定义主管时避免不必要的重复。

<a name="dashboard-authorization"></a>
### 仪表盘授权

Horizon 仪表盘可以通过 `/horizon` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘。不过，在你的 `app/Providers/HorizonServiceProvider.php` 文件中，有一个[授权 Gate](/docs/{{version}}/authorization#gates)定义。该授权 Gate 控制**非本地**环境中对 Horizon 的访问。你可以根据需要修改此 Gate，以限制对 Horizon 安装的访问：

```php
/**
 * Register the Horizon gate.
 *
 * This gate determines who can access Horizon in non-local environments.
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

<a name="alternative-authentication-strategies"></a>
#### 替代认证策略

请记住，Laravel 会自动将已认证用户注入到 Gate 闭包中。如果你的应用通过其他方法（例如 IP 限制）提供 Horizon 安全，那么你的 Horizon 用户可能无需"登录"。因此，你需要将上面的 `function (User $user)` 闭包签名改为 `function (User $user = null)`，以强制 Laravel 不要求认证。

<a name="max-job-attempts"></a>
### 最大任务尝试次数

> [!NOTE]
> 在优化这些选项之前，请确保你熟悉 Laravel 默认的[队列服务](/docs/{{version}}/queues#max-job-attempts-and-timeout)以及"attempts（尝试次数）"的概念。

你可以在一个主管的配置中定义任务最多可以消耗的尝试次数：

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
> 此选项类似于使用 Artisan 命令处理队列时的 `--tries` 选项。

在使用 `WithoutOverlapping` 或 `RateLimited` 等中间件时，调整 `tries` 选项至关重要，因为它们会消耗尝试次数。要处理此问题，请在主管级别调整 `tries` 配置值，或在任务类上定义 `$tries` 属性。

如果你未设置 `tries` 选项，Horizon 默认只尝试一次，除非任务类定义了 `$tries`——任务类的 `$tries` 优先于 Horizon 配置。

将 `tries` 或 `$tries` 设置为 0 允许无限次尝试，这在尝试次数不确定时非常理想。为防止无限失败，你可以通过设置任务类上的 `$maxExceptions` 属性来限制允许的异常数量。

<a name="job-timeout"></a>
### 任务超时

类似地，你可以在主管级别设置 `timeout` 值，它指定一个工作进程在任务被强制终止前可以运行该任务多少秒。一旦终止，该任务将被重试或标记为失败，具体取决于你的队列配置：

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
> 使用 `auto` 均衡策略时，Horizon 会将进行中的工作进程视为"挂起"，并在缩容时于 Horizon 超时后将其强制终止。务必确保 Horizon 超时大于任何任务级超时，否则任务可能会在执行中途被终止。此外，`timeout` 值应始终比 `config/queue.php` 配置文件中定义的 `retry_after` 值至少短几秒。否则，你的任务可能会被处理两次。

<a name="job-backoff"></a>
### 任务退避

你可以定义主管级别的 `backoff` 值，以指定 Horizon 在重试遇到未处理异常的任务前应等待多长时间：

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

你还可以通过为 `backoff` 值使用数组来配置"指数"退避。在此示例中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有更多剩余尝试次数，则之后的每次重试都为 10 秒：

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

<a name="other-worker-options"></a>
### 其他工作进程选项

除了 `tries`、`timeout` 和 `backoff` 之外，每个主管还接受几个其他选项，用于控制其工作进程的行为方式以及自动重启的时机。对于长时间运行的进程，定期重启工作进程是一个好习惯，因为这有助于防范内存泄漏：

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

- `memory` 定义单个工作进程在被重启前可消耗的最大内存量（以兆字节为单位）。默认情况下，此值为 `128`。
- `maxJobs` 定义工作进程在重启前应处理的任务数。值为 `0` 表示不应根据已处理的任务数重启工作进程。默认情况下，此值为 `0`。
- `maxTime` 定义工作进程在重启前应运行的秒数。值为 `0` 表示不应基于时间重启工作进程。默认情况下，此值为 `0`。
- `sleep` 定义工作进程在没有可用任务时，再次轮询队列以获取新任务前应等待的秒数。默认情况下，此值为 `3`。
- `rest` 定义处理每个任务之间的暂停秒数。默认情况下，此值为 `0`。
- `nice` 定义工作进程的"友好度"（调度优先级）。值越大，进程优先级越低。默认情况下，此值为 `0`。

</div>

<a name="silenced-jobs"></a>
### 静默任务

有时，你可能不想查看应用或第三方包分发的某些任务。与其让这些任务占用"已完成任务"列表中的空间，你可以将它们静默。要开始使用，请将任务的类名添加到应用 `horizon` 配置文件中的 `silenced` 配置选项中：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

除了静默单个任务类外，Horizon 还支持基于[标签](#tags)静默任务。如果你希望隐藏共享同一标签的多个任务，这会很有用：

```php
'silenced_tags' => [
    'notifications'
],
```

另外，你想要静默的任务可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果某个任务实现了该接口，即使它不在 `silenced` 配置数组中，也会被自动静默：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Queueable;

    // ...
}
```

<a name="balancing-strategies"></a>
## 负载均衡策略

每个主管可以处理一个或多个队列，但与 Laravel 默认的队列系统不同，Horizon 允许你从三种工作进程均衡策略中进行选择：`auto`、`simple` 和 `false`。

<a name="auto-balancing"></a>
### 自动均衡

`auto` 策略（默认策略）会根据队列的当前工作负载调整每个队列的工作进程数量。例如，如果你的 `notifications` 队列有 1,000 个待处理任务，而你的 `default` 队列为空，Horizon 会将更多工作进程分配给 `notifications` 队列，直到该队列清空。

使用 `auto` 策略时，你还可以配置 `minProcesses` 和 `maxProcesses` 配置选项：

<div class="content-list" markdown="1">

- `minProcesses` 定义每个队列的最小工作进程数。此值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 在所有队列中最多可扩展到的总工作进程数。此值通常应大于队列数乘以 `minProcesses` 值。要防止主管生成任何进程，你可以将此值设置为 0。

</div>

例如，你可以配置 Horizon 保持每个队列至少一个进程，并最多扩展到总共 10 个工作进程：

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

`autoScalingStrategy` 配置选项决定 Horizon 将如何为队列分配更多工作进程。你可以从两种策略中进行选择：

<div class="content-list" markdown="1">

- `time` 策略将根据清空队列所需的总估计时间分配工作进程。
- `size` 策略将根据队列中的任务总数分配工作进程。

</div>

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 扩展以满足工作进程需求的速度。在上面的示例中，每三秒最多创建或销毁一个新进程。你可以根据应用需求自由调整这些值。

<a name="auto-queue-priorities"></a>
#### 队列优先级与自动均衡

使用 `auto` 均衡策略时，Horizon 不会在队列之间强制执行严格的优先级。主管配置中队列的顺序不会影响工作进程的分配方式。相反，Horizon 会依赖所选的 `autoScalingStrategy` 根据队列负载动态分配工作进程。

例如，在下面的配置中，尽管 `high` 队列出现在列表首位，它并不会优先于 `default` 队列：

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

如果你需要在队列之间强制执行相对优先级，可以定义多个主管并显式分配处理资源：

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

在此示例中，默认的 `queue` 最多可以扩展到 10 个进程，而 `images` 队列被限制为一个进程。此配置确保你的队列可以独立扩展。

> [!NOTE]
> 分发资源密集型任务时，有时最好将它们分配给具有有限 `maxProcesses` 值的专用队列。否则，这些任务可能会消耗过多 CPU 资源并使系统过载。

<a name="simple-balancing"></a>
### 简单均衡

`simple` 策略在指定队列之间均匀分配工作进程。使用此策略时，Horizon 不会自动扩展工作进程数量。相反，它使用固定数量的进程：

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

在上面的示例中，Horizon 将为每个队列分配 5 个进程，将总数 10 均匀拆分。

如果你想单独控制分配给每个队列的工作进程数量，可以定义多个主管：

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

使用此配置，Horizon 将为 `default` 队列分配 10 个进程，为 `notifications` 队列分配 2 个进程。

<a name="no-balancing"></a>
### 不均衡

当 `balance` 选项设置为 `false` 时，Horizon 严格按照列出顺序处理队列，类似于 Laravel 的默认队列系统。不过，如果任务开始堆积，它仍然会扩展工作进程数量：

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

在上面的示例中，`default` 队列中的任务始终优先于 `notifications` 队列中的任务。例如，如果 `default` 中有 1,000 个任务，而 `notifications` 中只有 10 个，Horizon 将先完整处理所有 `default` 任务，再处理 `notifications` 中的任何任务。

你可以使用 `minProcesses` 和 `maxProcesses` 选项控制 Horizon 扩展工作进程的能力：

<div class="content-list" markdown="1">

- `minProcesses` 定义最小总工作进程数。此值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 最多可扩展到的总工作进程数。

</div>

<a name="upgrading-horizon"></a>
## 升级 Horizon

升级到 Horizon 的新主版本时，务必仔细阅读[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。

<a name="running-horizon"></a>
## 运行 Horizon

在应用的 `config/horizon.php` 配置文件中配置好主管和工作进程后，你可以使用 `horizon` Artisan 命令启动 Horizon。这一条命令将启动当前环境的全部已配置工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程，并指示它继续处理任务：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你还可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令暂停和继续特定的 Horizon [主管](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令检查 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:supervisor-status` Artisan 命令检查特定 Horizon [主管](#supervisors)的当前状态：

```shell
php artisan horizon:supervisor-status supervisor-1
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。当前正在处理的任何任务都会完成，然后 Horizon 将停止执行：

```shell
php artisan horizon:terminate
```

<a name="automatically-restarting-horizon"></a>
#### 自动重启 Horizon

在本地开发期间，你可以运行 `horizon:listen` 命令。使用 `horizon:listen` 命令时，如果你想重新加载更新后的代码，无需手动重启 Horizon。在使用此功能之前，你应确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监视库：

```shell
npm install --save-dev chokidar
```

安装 Chokidar 后，你可以使用 `horizon:listen` 命令启动 Horizon：

```shell
php artisan horizon:listen
```

在 Docker 或 Vagrant 中运行时，应使用 `--poll` 选项：

```shell
php artisan horizon:listen --poll
```

你可以使用应用 `config/horizon.php` 配置文件中的 `watch` 配置选项配置应监视的目录和文件：

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

<a name="deploying-horizon"></a>
### 部署 Horizon

当你准备将 Horizon 部署到应用的实际服务器上时，应配置一个进程监视器来监视 `php artisan horizon` 命令，并在它意外退出时将其重启。别担心，我们将在下面讨论如何安装进程监视器。

在应用的部署过程中，你应指示 Horizon 进程终止，以便它会被你的进程监视器重启并接收你的代码更改：

```shell
php artisan horizon:terminate
```

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果 `horizon` 进程停止执行，它会自动重启它。要在 Ubuntu 上安装 Supervisor，可以使用以下命令。如果你不使用 Ubuntu，很可能可以使用操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自行配置 Supervisor 听起来令人不知所措，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它可以为你的 Laravel 应用管理后台进程。

<a name="supervisor-configuration"></a>
#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。在此目录中，你可以创建任意数量的配置文件，指示 supervisor 应如何监视你的进程。例如，让我们创建一个 `horizon.conf` 文件，用于启动并监视一个 `horizon` 进程：

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

定义 Supervisor 配置时，你应确保 `stopwaitsecs` 的值大于运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成前将其终止。

> [!WARNING]
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但不同服务器操作系统对 Supervisor 配置文件的位置和文件扩展名的要求可能有所不同。请查阅服务器文档了解更多信息。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

配置文件创建完成后，你可以使用以下命令更新 Supervisor 配置并启动被监视的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]
> 关于运行 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="tags"></a>
## 标签

Horizon 允许你为任务分配"标签"，包括可邮寄对象、广播事件、通知和队列事件监听器。事实上，Horizon 会根据附加到任务上的 Eloquent 模型，智能且自动地为大多数任务打上标签。例如，看看下面的任务：

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
     * Create a new job instance.
     */
    public function __construct(
        public Video $video,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // ...
    }
}
```

如果此任务与一个 `id` 属性为 `1` 的 `App\Models\Video` 实例一起排队，它会自动收到 `App\Models\Video:1` 标签。这是因为 Horizon 会搜索任务的属性以查找任何 Eloquent 模型。如果找到 Eloquent 模型，Horizon 会使用模型的类名和主键智能地为任务打上标签：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

<a name="manually-tagging-jobs"></a>
#### 手动为任务打标签

如果你想手动为某个可排队对象定义标签，可以在类上定义一个 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['render', 'video:'.$this->video->id];
    }
}
```

<a name="manually-tagging-event-listeners"></a>
#### 手动为事件监听器打标签

检索队列事件监听器的标签时，Horizon 会自动将事件实例传递给 `tags` 方法，让你可以将事件数据添加到标签中：

```php
class SendRenderNotifications implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the listener.
     *
     * @return array<int, string>
     */
    public function tags(VideoRendered $event): array
    {
        return ['video:'.$event->video->id];
    }
}
```

<a name="notifications"></a>
## 通知

> [!WARNING]
> 配置 Horizon 发送 Slack 或 SMS 通知时，你应查看[相关通知频道的先决条件](/docs/{{version}}/notifications)。

如果你希望在队列等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以从应用 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    parent::boot();

    Horizon::routeSmsNotificationsTo('15556667777');
    Horizon::routeMailNotificationsTo('example@example.com');
    Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
}
```

<a name="configuring-notification-wait-time-thresholds"></a>
#### 配置通知等待时间阈值

你可以在应用的 `config/horizon.php` 配置文件中配置多少秒被视为"长等待"。该文件中的 `waits` 配置选项允许你控制每个连接 / 队列组合的长等待阈值。任何未定义的连接 / 队列组合都将默认使用 60 秒的长等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

将队列的阈值设置为 `0` 将禁用该队列的长等待通知。

<a name="metrics"></a>
## 指标

Horizon 包含一个指标仪表盘，提供有关任务与队列等待时间和吞吐量的信息。为了填充此仪表盘，你应在应用的 `routes/console.php` 文件中将 Horizon 的 `snapshot` Artisan 命令配置为每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

你可以使用应用 `config/horizon.php` 配置文件中的 `metrics.trim_snapshots` 选项配置 Horizon 为其指标图保留多少快照。由于此选项限制的是快照数量而非其时效，保留期取决于 `horizon:snapshot` 命令运行的频率：

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

<a name="deleting-failed-jobs"></a>
## 删除失败的任务

如果你想删除一个失败的任务，可以使用 `horizon:forget` 命令。`horizon:forget` 命令将失败任务的 ID 或 UUID 作为其唯一参数：

```shell
php artisan horizon:forget 5
```

如果你想删除所有失败的任务，可以为 `horizon:forget` 命令提供 `--all` 选项：

```shell
php artisan horizon:forget --all
```

<a name="clearing-jobs-from-queues"></a>
## 清空队列中的任务

如果你想删除应用默认队列中的所有任务，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项来删除特定队列中的任务：

```shell
php artisan horizon:clear --queue=emails
```
