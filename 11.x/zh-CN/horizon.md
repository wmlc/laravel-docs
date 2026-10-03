# Laravel Horizon

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [平衡策略](#balancing-strategies)
    - [仪表盘授权](#dashboard-authorization)
    - [静默任务](#silenced-jobs)
- [升级 Horizon](#upgrading-horizon)
- [运行 Horizon](#running-horizon)
    - [部署 Horizon](#deploying-horizon)
- [标签](#tags)
- [通知](#notifications)
- [指标](#metrics)
- [删除失败任务](#deleting-failed-jobs)
- [清空队列中的任务](#clearing-jobs-from-queues)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 在深入 Laravel Horizon 之前，你应当先熟悉 Laravel 的基础[队列服务](/docs/{{version}}/queues)。Horizon 为 Laravel 队列增强了额外功能，如果你还不了解 Laravel 提供的基础队列功能，这些内容可能会让人困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为你的 Laravel [Redis 队列](/docs/{{version}}/queues)提供了一个精美的仪表盘和代码驱动的配置。Horizon 让你可以轻松监控队列系统的关键指标，例如任务吞吐量、运行时长和任务失败情况。

使用 Horizon 时，所有队列工作进程配置都存放在一个简单的配置文件中。只需把应用的工作进程配置放进纳入版本控制的文件里，部署时就可以轻松扩展或调整应用的队列工作进程。

<img src="https://laravel.com/img/docs/horizon-example.png">

<a name="installation"></a>
## 安装

> [!WARNING]
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 作为队列的支撑。因此，你应当确保应用 `config/queue.php` 配置文件中的队列连接被设为 `redis`。

你可以使用 Composer 包管理器把 Horizon 安装到项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 后，使用 `horizon:install` Artisan 命令发布它的静态资源：

```shell
php artisan horizon:install
```

<a name="configuration"></a>
### 配置

发布 Horizon 的静态资源后，其主配置文件位于 `config/horizon.php`。该配置文件让你可以配置应用的队列工作进程选项。每个配置选项都附有其用途的说明，务必详细查看该文件。

> [!WARNING]
> Horizon 在内部使用一个名为 `horizon` 的 Redis 连接。该 Redis 连接名是保留的，不应在 `database.php` 配置文件中分配给另一个 Redis 连接，也不应作为 `horizon.php` 配置文件中 `use` 选项的值。

<a name="environments"></a>
#### 环境

安装之后，你首先应当熟悉 Horizon 的主要配置项 `environments`。该配置项是一个数组，包含应用运行所处的各个环境，并为每个环境定义工作进程选项。默认情况下，该条目包含 `production` 和 `local` 两个环境。不过，你也可以按需添加更多环境：

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

你也可以定义一个通配环境（`*`），当找不到其它匹配环境时将使用它：

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

启动 Horizon 时，它会使用应用当前所处环境的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#determining-the-current-environment)的值决定。例如，默认的 `local` Horizon 环境配置为启动三个工作进程，并自动平衡分配给每个队列的工作进程数量。默认的 `production` 环境配置为最多启动 10 个工作进程，并自动平衡分配给每个队列的工作进程数量。

> [!WARNING]
> 你应当确保 `horizon` 配置文件的 `environments` 部分为每个计划运行 Horizon 的[环境](/docs/{{version}}/configuration#environment-configuration)都包含相应条目。

<a name="supervisors"></a>
#### 监督者

如 Horizon 默认配置文件所示，每个环境可以包含一个或多个"监督者"。默认情况下，配置文件把该监督者定义为 `supervisor-1`；不过，你可以随意命名你的监督者。每个监督者本质上负责"监管"一组工作进程，并负责在工作进程之间做队列平衡。

如果你想在某个环境中定义一组新的工作进程，可以为该环境添加额外的监督者。如果你想为应用使用的某个队列定义不同的平衡策略或工作进程数量，就可以这样做。

<a name="maintenance-mode"></a>
#### 维护模式

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，除非在 Horizon 配置文件中把监督者的 `force` 选项定义为 `true`，否则 Horizon 不会处理排队任务：

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

在 Horizon 默认配置文件中，你会看到一个 `defaults` 配置项。该配置项为应用的[监督者](#supervisors)指定默认值。监督者的默认配置值会被合并到各环境中监督者的配置里，让你在定义监督者时无需不必要的重复。

<a name="balancing-strategies"></a>
### 平衡策略

与 Laravel 默认队列系统不同，Horizon 允许你从三种工作进程平衡策略中选择：`simple`、`auto` 和 `false`。`simple` 策略会在工作进程之间平均分配传入的任务：

```php
'balance' => 'simple',
```

作为配置文件的默认选项，`auto` 策略会根据队列当前的工作负载调整每个队列的工作进程数量。例如，如果 `notifications` 队列有 1,000 个待处理任务，而 `render` 队列为空，Horizon 就会向 `notifications` 队列分配更多工作进程，直到该队列被清空。

使用 `auto` 策略时，你可以定义 `minProcesses` 和 `maxProcesses` 配置项，分别控制每个队列的最少进程数，以及 Horizon 整体扩缩容时最多可扩展到的工作进程数：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
            'tries' => 3,
        ],
    ],
],
```

`autoScalingStrategy` 配置值决定 Horizon 是根据清空队列所需的总时间（`time` 策略），还是根据队列中的任务总数（`size` 策略）来为队列分配更多工作进程。

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 满足工作进程需求时的扩缩容速度。在上面的例子中，每三秒最多创建或销毁一个新进程。你可以根据应用需求自由调整这些值。

当 `balance` 选项设为 `false` 时，将使用 Laravel 的默认行为，即按配置中列出的顺序处理队列。

<a name="dashboard-authorization"></a>
### 仪表盘授权

Horizon 仪表盘可通过 `/horizon` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘。不过，在 `app/Providers/HorizonServiceProvider.php` 文件中有一个[授权门](/docs/{{version}}/authorization#gates)定义。该授权门控制着在**非本地**环境中对 Horizon 的访问。你可以根据需要自由修改该门，以限制对你 Horizon 安装的访问：

```php
/**
 * 注册 Horizon 授权门。
 *
 * 该授权门决定谁可以在非本地环境中访问 Horizon。
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
#### 备选的认证策略

请记住，Laravel 会自动把已认证用户注入授权门闭包。如果你的应用通过其它方式（比如 IP 限制）为 Horizon 提供安全性保障，那么你的 Horizon 用户可能不需要"登录"。因此，你需要把上面的 `function (User $user)` 闭包签名改为 `function (User $user = null)`，以强制 Laravel 不再要求认证。

<a name="silenced-jobs"></a>
### 静默任务

有时，你可能不希望查看应用或第三方包分发的某些任务。与其让这些任务在"已完成任务"列表中占据空间，不如把它们静默。要开始使用，请把任务的类名添加到应用 `horizon` 配置文件的 `silenced` 配置项中：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

另外，你想静默的任务可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果任务实现了该接口，即使它不在 `silenced` 配置数组中，也会被自动静默：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Queueable;

    // ...
}
```

<a name="upgrading-horizon"></a>
## 升级 Horizon

升级到 Horizon 的新主要版本时，务必仔细阅读[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。

<a name="running-horizon"></a>
## 运行 Horizon

在应用 `config/horizon.php` 配置文件中配置好监督者和工作进程后，你可以使用 `horizon` Artisan 命令启动 Horizon。这条命令会为当前环境启动所有已配置的工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程，并指示它继续处理任务：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你也可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令暂停和继续特定的 Horizon [监督者](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令查看 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:supervisor-status` Artisan 命令查看特定 Horizon [监督者](#supervisors)的当前状态：

```shell
php artisan horizon:supervisor-status supervisor-1
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。当前正在处理的任务会被完成，之后 Horizon 停止执行：

```shell
php artisan horizon:terminate
```

<a name="deploying-horizon"></a>
### 部署 Horizon

当你准备把 Horizon 部署到应用的实际服务器上时，应配置一个进程监控器来监控 `php artisan horizon` 命令，并在其意外退出时重启。别担心，下面会讨论如何安装进程监控器。

在应用部署过程中，你应指示 Horizon 进程终止，这样它就会被进程监控器重启并获得你的代码变更：

```shell
php artisan horizon:terminate
```

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统上的进程监控器，会在 `horizon` 进程停止执行时自动重启它。要在 Ubuntu 上安装 Supervisor，可以使用下面的命令。如果你使用的不是 Ubuntu，你大概可以用操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自己配置 Supervisor 让你望而生畏，可以考虑使用 [Laravel Forge](https://forge.laravel.com)，它会为你的 Laravel 项目自动安装并配置 Supervisor。

<a name="supervisor-configuration"></a>
#### Supervisor 配置

Supervisor 配置文件通常存放在服务器的 `/etc/supervisor/conf.d` 目录中。在该目录下，你可以创建任意数量的配置文件，指示 Supervisor 应如何监控你的进程。例如，让我们创建一个 `horizon.conf` 文件，用于启动并监控 `horizon` 进程：

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

定义 Supervisor 配置时，你应确保 `stopwaitsecs` 的值大于你运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成之前就把它杀掉。

> [!WARNING]
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但 Supervisor 配置文件所期望的位置和扩展名在其他服务器操作系统上可能有所不同。更多信息请查阅你的服务器文档。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

配置文件创建完成后，你可以用下面的命令更新 Supervisor 配置并启动被监控的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]
> 想了解更多关于运行 Supervisor 的信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="tags"></a>
## 标签

Horizon 允许你为任务分配"标签"，包括可邮件化对象、广播事件、通知和排队的事件监听器。事实上，Horizon 会根据任务所附带的 Eloquent 模型，智能且自动地为大多数任务打标签。例如，看看下面这个任务：

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

如果该任务入队时携带一个 `id` 属性为 `1` 的 `App\Models\Video` 实例，它会自动获得标签 `App\Models\Video:1`。这是因为 Horizon 会在任务的属性中搜索 Eloquent 模型。如果找到 Eloquent 模型，Horizon 就会用模型的类名和主键智能地为该任务打标签：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

<a name="manually-tagging-jobs"></a>
#### 手动为任务打标签

如果你想手动为某个可排队对象定义标签，可以在该类上定义 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * 获取应当分配给该任务的标签。
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

在获取排队事件监听器的标签时，Horizon 会自动把事件实例传给 `tags` 方法，让你得以把事件数据加入标签：

```php
class SendRenderNotifications implements ShouldQueue
{
    /**
     * 获取应当分配给该监听器的标签。
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
> 配置 Horizon 发送 Slack 或 SMS 通知时，你应当查阅[相关通知渠道的先决条件](/docs/{{version}}/notifications)。

如果你希望在某个队列等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以在应用 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

```php
/**
 * 引导任何应用服务。
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

你可以在应用 `config/horizon.php` 配置文件中配置多少秒算作"长时间等待"。该文件中的 `waits` 配置项让你可以为每个连接 / 队列组合控制长时间等待阈值。任何未定义的连接 / 队列组合都默认使用 60 秒的长时间等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

<a name="metrics"></a>
## 指标

Horizon 内置一个指标仪表盘，提供任务与队列等待时间及吞吐量的相关信息。为了让该仪表盘有数据，你应在应用 `routes/console.php` 文件中把 Horizon 的 `snapshot` Artisan 命令配置为每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

<a name="deleting-failed-jobs"></a>
## 删除失败任务

如果你想删除某个失败任务，可以使用 `horizon:forget` 命令。`horizon:forget` 命令只接受失败任务的 ID 或 UUID 作为参数：

```shell
php artisan horizon:forget 5
```

如果你想删除全部失败任务，可以向 `horizon:forget` 命令提供 `--all` 选项：

```shell
php artisan horizon:forget --all
```

<a name="clearing-jobs-from-queues"></a>
## 清空队列中的任务

如果你想删除应用默认队列中的全部任务，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项来删除特定队列中的任务：

```shell
php artisan horizon:clear --queue=emails
```
