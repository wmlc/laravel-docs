# Laravel Horizon

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [仪表盘授权](#dashboard-authorization)
    - [作业最大尝试次数](#max-job-attempts)
    - [作业超时](#job-timeout)
    - [作业退避](#job-backoff)
    - [静默作业](#silenced-jobs)
- [均衡策略](#balancing-strategies)
    - [自动均衡](#auto-balancing)
    - [简单均衡](#simple-balancing)
    - [不做均衡](#no-balancing)
- [升级 Horizon](#upgrading-horizon)
- [运行 Horizon](#running-horizon)
    - [部署 Horizon](#deploying-horizon)
- [标签](#tags)
- [通知](#notifications)
- [指标](#metrics)
- [删除失败作业](#deleting-failed-jobs)
- [清空队列中的作业](#clearing-jobs-from-queues)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 在深入了解 Laravel Horizon 之前，你应该先熟悉 Laravel 的基础[队列服务](/docs/{{version}}/queues)。Horizon 在 Laravel 队列的基础上增强了额外功能，如果你还不熟悉 Laravel 提供的基础队列功能，这些增强功能可能会让你感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为基于 Laravel 的 [Redis 队列](/docs/{{version}}/queues)提供了美观的仪表盘和代码驱动的配置。Horizon 让你能够轻松监控队列系统的关键指标，例如作业吞吐量、运行时间和作业失败情况。

使用 Horizon 时，你所有的队列 worker 配置都存储在一个简单明了的配置文件中。通过将应用的 worker 配置定义在版本控制下的文件中，你在部署应用时就能轻松扩展或修改应用的队列 worker。

<img src="https://laravel.com/img/docs/horizon-example.png">

<a name="installation"></a>
## 安装

> [!WARNING]
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 来驱动队列。因此，你应确保应用的 `config/queue.php` 配置文件中的队列连接设置为 `redis`。目前 Horizon 与 Redis 集群不兼容。

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

发布 Horizon 的资源后，其主配置文件将位于 `config/horizon.php`。通过这个配置文件，你可以为应用配置队列 worker 选项。每个配置选项都附有对其用途的说明，请务必仔细阅读这个文件。

> [!WARNING]
> Horizon 内部使用名为 `horizon` 的 Redis 连接。这个 Redis 连接名是保留名称，不应当在 `database.php` 配置文件中分配给另一个 Redis 连接，也不应当作为 `horizon.php` 配置文件中 `use` 选项的值。

<a name="environments"></a>
#### 环境

安装完成后，你应当首先熟悉的 Horizon 主配置选项是 `environments` 配置选项。这个配置选项是一个由应用运行环境组成的数组，为每个环境定义 worker 进程选项。默认情况下，该条目包含 `production` 和 `local` 两个环境。不过，你可以根据需要自由添加更多环境：

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

你还可以定义一个通配符环境（`*`），在没有匹配到其他环境时将使用它：

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

启动 Horizon 时，它会使用应用当前运行环境对应的 worker 进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#determining-the-current-environment)的值决定。例如，默认的 `local` Horizon 环境配置为启动三个 worker 进程，并自动均衡分配给每个队列的 worker 进程数量。默认的 `production` 环境配置为最多启动 10 个 worker 进程，并自动均衡分配给每个队列的 worker 进程数量。

> [!WARNING]
> 你应确保 `horizon` 配置文件的 `environments` 部分为每个你计划运行 Horizon 的[环境](/docs/{{version}}/configuration#environment-configuration)都包含相应条目。

<a name="supervisors"></a>
#### Supervisor

正如你在 Horizon 的默认配置文件中看到的，每个环境可以包含一个或多个「supervisor」。默认情况下，配置文件将该 supervisor 定义为 `supervisor-1`；不过，你可以随意为 supervisor 命名。每个 supervisor 本质上负责「监管」一组 worker 进程，并负责在队列之间均衡分配 worker 进程。

如果你想为某个环境定义一组新的 worker 进程，可以向该环境添加额外的 supervisor。当你希望为应用使用的某个队列定义不同的均衡策略或 worker 进程数量时，可以选择这样做。

<a name="maintenance-mode"></a>
#### 维护模式

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，除非在 Horizon 配置文件中将 supervisor 的 `force` 选项定义为 `true`，否则 Horizon 不会处理队列作业：

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

在 Horizon 的默认配置文件中，你会注意到一个 `defaults` 配置选项。这个配置选项为应用的 [supervisor](#supervisors) 指定默认值。supervisor 的默认配置值会被合并到每个环境的 supervisor 配置中，让你在定义 supervisor 时避免不必要的重复。

<a name="dashboard-authorization"></a>
### 仪表盘授权

Horizon 仪表盘可以通过 `/horizon` 路由访问。默认情况下，你只能在 `local` 环境中访问这个仪表盘。不过，在 `app/Providers/HorizonServiceProvider.php` 文件中有一个[授权门](/docs/{{version}}/authorization#gates)定义，这个授权门控制在**非本地**环境下对 Horizon 的访问。你可以根据需要随意修改这个 gate，以限制对你 Horizon 安装的访问：

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
#### 其他认证策略

请记住，Laravel 会自动将已认证的用户注入到 gate 闭包中。如果你的应用通过其他方式（例如 IP 限制）为 Horizon 提供安全保障，那么你的 Horizon 用户可能不需要「登录」。因此，你需要将上面闭包签名中的 `function (User $user)` 改为 `function (User $user = null)`，以强制 Laravel 不要求认证。

<a name="max-job-attempts"></a>
### 作业最大尝试次数

> [!NOTE]
> 在调整这些选项之前，请确保你已熟悉 Laravel 默认的[队列服务](/docs/{{version}}/queues#max-job-attempts-and-timeout)以及「尝试次数」的概念。

你可以在 supervisor 的配置中定义一个作业最多可以消耗的尝试次数：

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

在使用 `WithoutOverlapping` 或 `RateLimited` 等中间件时，调整 `tries` 选项至关重要，因为它们会消耗尝试次数。要解决这一问题，你可以在 supervisor 层级调整 `tries` 配置值，也可以通过在作业类上定义 `$tries` 属性来完成。

如果不设置 `tries` 选项，Horizon 默认只尝试一次，除非作业类定义了 `$tries`，它的优先级高于 Horizon 配置。

将 `tries` 或 `$tries` 设置为 0 表示不限制尝试次数，这在尝试次数不确定的情况下非常实用。为了防止无限失败，你可以通过在作业类上设置 `$maxExceptions` 属性来限制允许的异常次数。

<a name="job-timeout"></a>
### 作业超时

类似地，你可以在 supervisor 层级设置 `timeout` 值，指定 worker 进程运行一个作业多少秒后会被强制终止。作业被终止后，会根据你的队列配置被重试或标记为失败：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...¨
            'timeout' => 60,
        ],
    ],
],
```

> [!WARNING]
> 使用 `auto` 均衡策略时，Horizon 会将在处理中的 worker 视为「挂起」状态，并在缩容时于 Horizon 超时后强制终止它们。请始终确保 Horizon 超时大于任何作业级别的超时，否则作业可能在执行中途被终止。此外，`timeout` 值应始终比 `config/queue.php` 配置文件中定义的 `retry_after` 值至少短几秒，否则你的作业可能会被处理两次。

<a name="job-backoff"></a>
### 作业退避

你可以在 supervisor 层级定义 `backoff` 值，指定 Horizon 在重试遇到未处理异常的作业之前应等待多长时间：

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

你还可以为 `backoff` 值使用数组来配置「指数」退避。在这个例子中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有剩余尝试次数，后续每次重试均为 10 秒：

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

<a name="silenced-jobs"></a>
### 静默作业

有时，你可能不希望查看应用或第三方扩展包分发的某些作业。你可以将这些作业静默，让它们不再占用「已完成作业」列表中的空间。开始之前，请将作业的类名添加到应用 `horizon` 配置文件的 `silenced` 配置选项中：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

除了静默单个作业类之外，Horizon 还支持基于[标签](#tags)静默作业。如果你想隐藏多个共享同一标签的作业，这个功能会很有用：

```php
'silenced_tags' => [
    'notifications'
],
```

另外，你希望静默的作业也可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果作业实现了该接口，它将被自动静默，即使它没有出现在 `silenced` 配置数组中：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Queueable;

    // ...
}
```

<a name="balancing-strategies"></a>
## 均衡策略

每个 supervisor 可以处理一个或多个队列，但与 Laravel 默认的队列系统不同，Horizon 允许你从三种 worker 均衡策略中选择：`auto`、`simple` 和 `false`。

<a name="auto-balancing"></a>
### 自动均衡

`auto` 策略是默认策略，它会根据队列当前的工作负载调整分配给每个队列的 worker 进程数量。例如，如果你的 `notifications` 队列有 1,000 个待处理作业，而 `default` 队列为空，Horizon 会将更多 worker 分配给 `notifications` 队列，直到该队列为空。

使用 `auto` 策略时，你还可以配置 `minProcesses` 和 `maxProcesses` 配置选项：

- `minProcesses` 定义每个队列的最小 worker 进程数。该值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 在所有队列中最多可扩展到的 worker 进程总数。该值通常应大于队列数量乘以 `minProcesses` 的值。若要阻止 supervisor 启动任何进程，可以将该值设置为 0。

例如，你可以将 Horizon 配置为每个队列至少维护一个进程，并最多扩展到总共 10 个 worker 进程：

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

`autoScalingStrategy` 配置选项决定 Horizon 如何为队列分配更多 worker 进程。你可以在两种策略之间选择：

- `time` 策略会根据清空队列所需的预估总时间来分配 worker。
- `size` 策略会根据队列上的作业总数来分配 worker。

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 以多快的速度扩展以满足 worker 需求。在上面的例子中，每三秒最多创建或销毁一个新进程。你可以根据应用的需要自由调整这些值。

<a name="auto-queue-priorities"></a>
#### 队列优先级与自动均衡

使用 `auto` 均衡策略时，Horizon 不会在队列之间强制执行严格的优先级。supervisor 配置中队列的顺序不会影响 worker 进程的分配方式。相反，Horizon 依赖所选的 `autoScalingStrategy` 根据队列负载动态分配 worker 进程。

例如，在以下配置中，high 队列并不会优先于 default 队列，尽管它出现在列表的第一位：

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

在这个例子中，默认的 `queue` 可以扩展到最多 10 个进程，而 `images` 队列被限制为一个进程。这样的配置可以确保各个队列独立扩展。

> [!NOTE]
> 在分发资源密集型作业时，有时最好将它们分配到设有 `maxProcesses` 限制值的专用队列。否则，这些作业可能占用过多的 CPU 资源并使你的系统过载。

<a name="simple-balancing"></a>
### 简单均衡

`simple` 策略会将 worker 进程均匀分配到指定队列。使用这种策略时，Horizon 不会自动扩展 worker 进程的数量，而是使用固定数量的进程：

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

在上面的例子中，Horizon 会为每个队列分配 5 个进程，将总数 10 平均分配。

如果你想单独控制分配给每个队列的 worker 进程数量，可以定义多个 supervisor：

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

采用这种配置时，Horizon 会为 `default` 队列分配 10 个进程，为 `notifications` 队列分配 2 个进程。

<a name="no-balancing"></a>
### 不做均衡

当 `balance` 选项设置为 `false` 时，Horizon 会严格按队列的列出顺序处理队列，这与 Laravel 默认的队列系统类似。不过，如果作业开始堆积，它仍会扩展 worker 进程的数量：

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

在上面的例子中，`default` 队列中的作业总是优先于 `notifications` 队列中的作业。例如，如果 `default` 中有 1,000 个作业，而 `notifications` 中只有 10 个，Horizon 会在处理 `notifications` 中的任何作业之前，先完整处理 `default` 中的所有作业。

你可以使用 `minProcesses` 和 `maxProcesses` 选项来控制 Horizon 扩展 worker 进程的能力：

- `minProcesses` 定义 worker 进程的最小总数。该值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 最多可扩展到的 worker 进程总数。

<a name="upgrading-horizon"></a>
## 升级 Horizon

升级到 Horizon 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。

<a name="running-horizon"></a>
## 运行 Horizon

在应用的 `config/horizon.php` 配置文件中配置好 supervisor 和 worker 之后，你可以使用 `horizon` Artisan 命令启动 Horizon。这一条命令就会为当前环境启动所有已配置的 worker 进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令来暂停 Horizon 进程，并指示它继续处理作业：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你也可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令来暂停和继续特定的 Horizon [supervisor](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令查看 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:supervisor-status` Artisan 命令查看特定 Horizon [supervisor](#supervisors) 的当前状态：

```shell
php artisan horizon:supervisor-status supervisor-1
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。所有正在处理中的作业都会先执行完毕，然后 Horizon 才会停止运行：

```shell
php artisan horizon:terminate
```

<a name="automatically-restarting-horizon"></a>
#### 自动重启 Horizon

在本地开发期间，你可以运行 `horizon:listen` 命令。使用 `horizon:listen` 命令时，当你想重新加载更新后的代码，无需手动重启 Horizon。使用此功能之前，你应确保本地开发环境中已安装 [Node](https://nodejs.org)。此外，你还应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监听库：

```shell
npm install --save-dev chokidar
```

安装好 Chokidar 后，你可以使用 `horizon:listen` 命令启动 Horizon：

```shell
php artisan horizon:listen
```

在 Docker 或 Vagrant 中运行时，你应使用 `--poll` 选项：

```shell
php artisan horizon:listen --poll
```

你可以在应用的 `config/horizon.php` 配置文件中，使用 `watch` 配置选项来配置需要监听的目录和文件：

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

当你准备好将 Horizon 部署到应用的实际服务器时，应配置一个进程监控器来监控 `php artisan horizon` 命令，并在其意外退出时重新启动它。别担心，我们将在下面讨论如何安装进程监控器。

在应用的部署过程中，你应通知 Horizon 进程终止，以便进程监控器重新启动它并加载你的代码变更：

```shell
php artisan horizon:terminate
```

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统上的进程监控器，它会在你的 `horizon` 进程停止运行时自动重启它。要在 Ubuntu 上安装 Supervisor，你可以使用以下命令。如果你使用的不是 Ubuntu，通常可以通过操作系统的包管理器来安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自行配置 Supervisor 听起来令人生畏，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它可以为你的 Laravel 应用管理后台进程。

<a name="supervisor-configuration"></a>
#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。你可以在这个目录中创建任意数量的配置文件，来指示 supervisor 如何监控你的进程。例如，让我们创建一个 `horizon.conf` 文件，用于启动并监控 `horizon` 进程：

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

定义 Supervisor 配置时，你应确保 `stopwaitsecs` 的值大于运行时间最长的作业所消耗的秒数。否则，Supervisor 可能在作业处理完成之前就将其终止。

> [!WARNING]
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但其他服务器操作系统对 Supervisor 配置文件的位置和文件扩展名的要求可能有所不同。请查阅你的服务器文档以获取更多信息。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

创建好配置文件后，你可以使用以下命令更新 Supervisor 配置并启动被监控的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]
> 有关运行 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="tags"></a>
## 标签

Horizon 允许你为作业分配「标签」，包括邮件、广播事件、通知和队列事件监听器。事实上，Horizon 会根据附加到作业上的 Eloquent 模型，智能地自动为大多数作业打上标签。例如，看看下面的作业：

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
     * 创建一个新的作业实例。
     */
    public function __construct(
        public Video $video,
    ) {}

    /**
     * 执行作业。
     */
    public function handle(): void
    {
        // ...
    }
}
```

如果这个作业与一个 `id` 属性为 `1` 的 `App\Models\Video` 实例一起排队，它会自动获得 `App\Models\Video:1` 标签。这是因为 Horizon 会在作业的属性中搜索所有 Eloquent 模型。如果找到 Eloquent 模型，Horizon 会智能地使用模型的类名和主键为作业打上标签：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

<a name="manually-tagging-jobs"></a>
#### 手动为作业打标签

如果你想为某个可排队对象手动定义标签，可以在该类上定义 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * 获取应分配给作业的标签。
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

在获取队列事件监听器的标签时，Horizon 会自动将事件实例传递给 `tags` 方法，让你可以将事件数据添加到标签中：

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

<a name="notifications"></a>
## 通知

> [!WARNING]
> 在配置 Horizon 发送 Slack 或短信通知时，你应查看[相应通知渠道的前提条件](/docs/{{version}}/notifications)。

如果你希望在某个队列等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以在应用的 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

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

你可以在应用的 `config/horizon.php` 配置文件中配置多少秒被视为「长时间等待」。该文件中的 `waits` 配置选项允许你控制每个连接 / 队列组合的长时间等待阈值。未定义的连接 / 队列组合将默认使用 60 秒的长时间等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

将某个队列的阈值设置为 `0` 将禁用该队列的长时间等待通知。

<a name="metrics"></a>
## 指标

Horizon 包含一个指标仪表盘，提供有关作业和队列等待时间以及吞吐量的信息。为了填充这个仪表盘，你应在应用的 `routes/console.php` 文件中配置 Horizon 的 `snapshot` Artisan 命令每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

如果你想删除所有指标数据，可以调用 `horizon:clear-metrics` Artisan 命令：

```shell
php artisan horizon:clear-metrics
```

<a name="deleting-failed-jobs"></a>
## 删除失败作业

如果你想删除一个失败的作业，可以使用 `horizon:forget` 命令。`horizon:forget` 命令接受失败作业的 ID 或 UUID 作为其唯一的参数：

```shell
php artisan horizon:forget 5
```

如果你想删除所有失败的作业，可以为 `horizon:forget` 命令提供 `--all` 选项：

```shell
php artisan horizon:forget --all
```

<a name="clearing-jobs-from-queues"></a>
## 清空队列中的作业

如果你想删除应用默认队列中的所有作业，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项来删除特定队列中的作业：

```shell
php artisan horizon:clear --queue=emails
```
