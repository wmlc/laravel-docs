# Laravel Horizon

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [均衡策略](#balancing-strategies)
    - [仪表盘授权](#dashboard-authorization)
    - [静默任务](#silenced-jobs)
- [升级 Horizon](#upgrading-horizon)
- [运行 Horizon](#running-horizon)
    - [部署 Horizon](#deploying-horizon)
- [标签](#tags)
- [通知](#notifications)
- [指标](#metrics)
- [删除失败任务](#deleting-failed-jobs)
- [清除队列中的任务](#clearing-jobs-from-queues)

<a name="introduction"></a>
## 简介

> **Note**  
> 在深入了解 Laravel Horizon 之前，你应该先熟悉 Laravel 的基础[队列服务](/docs/{{version}}/queues)。Horizon 为 Laravel 的队列增加了额外功能，如果你不熟悉 Laravel 提供的基础队列功能，可能会感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为基于 Laravel 的 [Redis 队列](/docs/{{version}}/queues)提供了精美的仪表盘和代码驱动的配置。Horizon 让你能够轻松监控队列系统的关键指标，例如任务吞吐量、运行时间和任务失败情况。

使用 Horizon 时，所有的队列工作进程配置都存储在一个简单、单一的配置文件中。通过在版本控制文件中定义应用的工作进程配置，你可以在部署应用时轻松扩展或修改应用的队列工作进程。

<img src="https://laravel.com/img/docs/horizon-example.png">

<a name="installation"></a>
## 安装

> **Warning**  
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 来驱动队列。因此，你应该确保应用的 `config/queue.php` 配置文件中将队列连接设置为 `redis`。

你可以使用 Composer 包管理器将 Horizon 安装到项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 之后，使用 `horizon:install` Artisan 命令发布其资源：

```shell
php artisan horizon:install
```

<a name="configuration"></a>
### 配置

发布 Horizon 的资源后，其主要配置文件位于 `config/horizon.php`。此配置文件用于配置应用的队列工作进程选项。每个配置选项都包含其用途说明，请务必仔细阅读此文件。

> **Warning**  
> Horizon 内部使用名为 `horizon` 的 Redis 连接。此 Redis 连接名称是保留的，不应在 `database.php` 配置文件中将其分配给其他 Redis 连接，也不应将其作为 `horizon.php` 配置文件中 `use` 选项的值。

<a name="environments"></a>
#### 环境

安装完成后，你应该熟悉的 Horizon 主要配置选项是 `environments` 配置选项。此配置选项是一个包含应用运行环境的数组，并为每个环境定义工作进程选项。默认情况下，此条目包含 `production` 和 `local` 环境。不过，你可以根据需要添加更多环境：

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

启动 Horizon 时，它会使用应用当前运行环境的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#determining-the-current-environment)的值决定。例如，默认的 `local` Horizon 环境配置为启动三个工作进程，并自动均衡分配给每个队列的工作进程数量。默认的 `production` 环境配置为最多启动 10 个工作进程，并自动均衡分配给每个队列的工作进程数量。

> **Warning**  
> 你应该确保 `horizon` 配置文件的 `environments` 部分包含你计划运行 Horizon 的每个[环境](/docs/{{version}}/configuration#environment-configuration)的条目。

<a name="supervisors"></a>
#### Supervisor

正如 Horizon 默认配置文件所示，每个环境可以包含一个或多个 "supervisor"。默认情况下，配置文件将此 supervisor 定义为 `supervisor-1`；不过，你可以随意命名 supervisor。每个 supervisor 本质上负责"监督"一组工作进程，并处理工作进程在队列之间的均衡。

如果你想定义一组在该环境中运行的新工作进程，可以向给定环境添加额外的 supervisor。如果你想为应用使用的某个队列定义不同的均衡策略或工作进程数量，可以选择这样做。

<a name="default-values"></a>
#### 默认值

在 Horizon 的默认配置文件中，你会注意到 `defaults` 配置选项。此配置选项指定应用的 [supervisor](#supervisors) 默认值。supervisor 的默认配置值会合并到每个环境的 supervisor 配置中，让你在定义 supervisor 时避免不必要的重复。

<a name="balancing-strategies"></a>
### 均衡策略

与 Laravel 默认的队列系统不同，Horizon 允许你从三种工作进程均衡策略中选择：`simple`、`auto` 和 `false`。`simple` 策略是配置文件的默认值，它将传入任务均匀分配到各个工作进程：

    'balance' => 'simple',

`auto` 策略根据队列的当前工作负载调整每个队列的工作进程数量。例如，如果 `notifications` 队列有 1,000 个待处理任务，而 `render` 队列为空，Horizon 会将更多工作进程分配给 `notifications` 队列，直到该队列为空。

使用 `auto` 策略时，你可以定义 `minProcesses` 和 `maxProcesses` 配置选项，以控制 Horizon 扩展和缩减工作进程数量的最小值和最大值：

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['default'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 10,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
                'tries' => 3,
            ],
        ],
    ],

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 扩展以满足工作进程需求的速度。在上面的示例中，每三秒最多创建或销毁一个新进程。你可以根据应用需要自行调整这些值。

当 `balance` 选项设置为 `false` 时，将使用 Laravel 的默认行为，即按照配置中列出的顺序处理队列。

<a name="dashboard-authorization"></a>
### 仪表盘授权

Horizon 在 `/horizon` URI 上提供一个仪表盘。默认情况下，你只能在 `local` 环境中访问此仪表盘。不过，在 `app/Providers/HorizonServiceProvider.php` 文件中，有一个[授权门](/docs/{{version}}/authorization#gates)定义。此授权门控制在**非本地**环境中对 Horizon 的访问。你可以根据需要修改此门，以限制对 Horizon 安装的访问：

    /**
     * 注册 Horizon 门。
     *
     * 此门决定谁可以在非本地环境中访问 Horizon。
     *
     * @return void
     */
    protected function gate()
    {
        Gate::define('viewHorizon', function ($user) {
            return in_array($user->email, [
                'taylor@laravel.com',
            ]);
        });
    }

<a name="alternative-authentication-strategies"></a>
#### 替代认证策略

请记住，Laravel 会自动将已认证的用户注入到门闭包中。如果你的应用通过其他方式（例如 IP 限制）提供 Horizon 安全保护，那么你的 Horizon 用户可能不需要"登录"。因此，你需要将上面的 `function ($user)` 闭包签名改为 `function ($user = null)`，以强制 Laravel 不要求认证。

<a name="silenced-jobs"></a>
### 静默任务

有时，你可能不希望查看应用或第三方包分发的某些任务。你可以将这些任务静默，而不是让它们占用"已完成任务"列表的空间。首先，将任务的类名添加到应用 `horizon` 配置文件的 `silenced` 配置选项中：

    'silenced' => [
        App\Jobs\ProcessPodcast::class,
    ],

或者，你希望静默的任务可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果任务实现了此接口，即使它不在 `silenced` 配置数组中，也会自动被静默：

    use Laravel\Horizon\Contracts\Silenced;

    class ProcessPodcast implements ShouldQueue, Silenced
    {
        use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

        // ...
    }

<a name="upgrading-horizon"></a>
## 升级 Horizon

升级到 Horizon 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)。此外，升级到任何新版本的 Horizon 时，你都应该重新发布 Horizon 的资源：

```shell
php artisan horizon:publish
```

为了保持资源最新并避免未来更新中的问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用 `composer.json` 文件的 `post-update-cmd` 脚本中：

```json
{
    "scripts": {
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ]
    }
}
```

<a name="running-horizon"></a>
## 运行 Horizon

在应用的 `config/horizon.php` 配置文件中配置好 supervisor 和工作进程后，你可以使用 `horizon` Artisan 命令启动 Horizon。此命令会启动当前环境的所有已配置工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程并指示其继续处理任务：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你也可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令暂停和继续特定的 Horizon [supervisor](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令查看 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。任何正在处理的任务都会先完成，然后 Horizon 才会停止执行：

```shell
php artisan horizon:terminate
```

<a name="deploying-horizon"></a>
### 部署 Horizon

当你准备好将 Horizon 部署到应用的实际服务器时，应该配置一个进程监视器来监视 `php artisan horizon` 命令，并在其意外退出时重启。别担心，我们将在下面讨论如何安装进程监视器。

在应用的部署过程中，你应该指示 Horizon 进程终止，以便进程监视器重启它并接收代码变更：

```shell
php artisan horizon:terminate
```

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，会在 `horizon` 进程停止执行时自动重启它。要在 Ubuntu 上安装 Supervisor，你可以使用以下命令。如果你使用的不是 Ubuntu，通常可以使用操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> **Note**  
> 如果自己配置 Supervisor 让你觉得难以应付，可以考虑使用 [Laravel Forge](https://forge.laravel.com)，它会自动为你的 Laravel 项目安装和配置 Supervisor。

<a name="supervisor-configuration"></a>
#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。在此目录中，你可以创建任意数量的配置文件，指示 Supervisor 如何监视你的进程。例如，让我们创建一个 `horizon.conf` 文件来启动并监视 `horizon` 进程：

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

定义 Supervisor 配置时，你应该确保 `stopwaitsecs` 的值大于运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成之前将其终止。

> **Warning**  
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但其他服务器操作系统对 Supervisor 配置文件的位置和文件扩展名的要求可能有所不同。请查阅你的服务器文档以获取更多信息。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

创建配置文件后，你可以使用以下命令更新 Supervisor 配置并启动被监视的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> **Note**  
> 有关运行 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="tags"></a>
## 标签

Horizon 允许你为任务分配"标签"，包括 mailable、广播事件、通知和排队的事件监听器。事实上，Horizon 会根据附加到任务的 Eloquent 模型智能且自动地为大多数任务添加标签。例如，看看以下任务：

    <?php

    namespace App\Jobs;

    use App\Models\Video;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Foundation\Bus\Dispatchable;
    use Illuminate\Queue\InteractsWithQueue;
    use Illuminate\Queue\SerializesModels;

    class RenderVideo implements ShouldQueue
    {
        use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

        /**
         * 视频实例。
         *
         * @var \App\Models\Video
         */
        public $video;

        /**
         * 创建新的任务实例。
         *
         * @param  \App\Models\Video  $video
         * @return void
         */
        public function __construct(Video $video)
        {
            $this->video = $video;
        }

        /**
         * 执行任务。
         *
         * @return void
         */
        public function handle()
        {
            //
        }
    }

如果此任务与 `id` 属性为 `1` 的 `App\Models\Video` 实例一起排队，它会自动获得标签 `App\Models\Video:1`。这是因为 Horizon 会在任务的属性中搜索任何 Eloquent 模型。如果找到 Eloquent 模型，Horizon 会使用模型的类名和主键智能地为任务添加标签：

    use App\Jobs\RenderVideo;
    use App\Models\Video;

    $video = Video::find(1);

    RenderVideo::dispatch($video);

<a name="manually-tagging-jobs"></a>
#### 手动为任务添加标签

如果你想手动为某个可排队对象定义标签，可以在类上定义 `tags` 方法：

    class RenderVideo implements ShouldQueue
    {
        /**
         * 获取应分配给任务的标签。
         *
         * @return array
         */
        public function tags()
        {
            return ['render', 'video:'.$this->video->id];
        }
    }

<a name="notifications"></a>
## 通知

> **Warning**  
> 配置 Horizon 发送 Slack 或 SMS 通知时，你应该查阅[相关通知渠道的先决条件](/docs/{{version}}/notifications)。

如果你想在某个队列等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以在应用 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

    /**
     * 引导应用服务。
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();

        Horizon::routeSmsNotificationsTo('15556667777');
        Horizon::routeMailNotificationsTo('example@example.com');
        Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
    }

<a name="configuring-notification-wait-time-thresholds"></a>
#### 配置通知等待时间阈值

你可以在应用的 `config/horizon.php` 配置文件中配置多少秒被视为"长时间等待"。此文件中的 `waits` 配置选项让你能够控制每个连接/队列组合的长时间等待阈值：

    'waits' => [
        'redis:default' => 60,
        'redis:critical,high' => 90,
    ],

<a name="metrics"></a>
## 指标

Horizon 包含一个指标仪表盘，提供有关任务和队列等待时间及吞吐量的信息。为了填充此仪表盘，你应该通过应用的[调度器](/docs/{{version}}/scheduling)配置 Horizon 的 `snapshot` Artisan 命令每五分钟运行一次：

    /**
     * 定义应用的命令调度。
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('horizon:snapshot')->everyFiveMinutes();
    }

<a name="deleting-failed-jobs"></a>
## 删除失败任务

如果你想删除失败的任务，可以使用 `horizon:forget` 命令。`horizon:forget` 命令接受失败任务的 ID 或 UUID 作为其唯一参数：

```shell
php artisan horizon:forget 5
```

<a name="clearing-jobs-from-queues"></a>
## 清除队列中的任务

如果你想删除应用默认队列中的所有任务，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项来删除特定队列中的任务：

```shell
php artisan horizon:clear --queue=emails
```
