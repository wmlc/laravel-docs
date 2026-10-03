# Laravel Telescope

- [简介](#introduction)
- [安装](#installation)
    - [仅本地安装](#local-only-installation)
    - [配置](#configuration)
    - [数据清理](#data-pruning)
    - [仪表盘授权](#dashboard-authorization)
- [升级 Telescope](#upgrading-telescope)
- [过滤](#filtering)
    - [条目](#filtering-entries)
    - [批次](#filtering-batches)
- [标签](#tagging)
- [可用监视器](#available-watchers)
    - [Batch 监视器](#batch-watcher)
    - [Cache 监视器](#cache-watcher)
    - [Command 监视器](#command-watcher)
    - [Dump 监视器](#dump-watcher)
    - [Event 监视器](#event-watcher)
    - [Exception 监视器](#exception-watcher)
    - [Gate 监视器](#gate-watcher)
    - [HTTP Client 监视器](#http-client-watcher)
    - [Job 监视器](#job-watcher)
    - [Log 监视器](#log-watcher)
    - [Mail 监视器](#mail-watcher)
    - [Model 监视器](#model-watcher)
    - [Notification 监视器](#notification-watcher)
    - [Query 监视器](#query-watcher)
    - [Redis 监视器](#redis-watcher)
    - [Request 监视器](#request-watcher)
    - [Schedule 监视器](#schedule-watcher)
    - [View 监视器](#view-watcher)
- [显示用户头像](#displaying-user-avatars)

<a name="introduction"></a>
## 简介

[Laravel Telescope](https://github.com/laravel/telescope) 是本地 Laravel 开发环境的绝佳伴侣。Telescope 可以洞察进入应用程序的请求、异常、日志条目、数据库查询、队列作业、邮件、通知、缓存操作、计划任务、变量转储等。

<img src="https://laravel.com/img/docs/telescope-example.png">

<a name="installation"></a>
## 安装

你可以使用 Composer 包管理器将 Telescope 安装到 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布其资源。安装 Telescope 后，你还应运行 `migrate` 命令以创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

<a name="migration-customization"></a>
#### 迁移自定义

如果你不打算使用 Telescope 的默认迁移，应在应用程序 `App\Providers\AppServiceProvider` 类的 `register` 方法中调用 `Telescope::ignoreMigrations` 方法。你可以使用以下命令导出默认迁移：`php artisan vendor:publish --tag=telescope-migrations`

<a name="local-only-installation"></a>
### 仅本地安装

如果你计划仅使用 Telescope 辅助本地开发，可以使用 `--dev` 标志安装 Telescope：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 后，你应从应用程序的 `config/app.php` 配置文件中移除 `TelescopeServiceProvider` 服务提供者注册。相反，在 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供者。我们将在注册提供者之前确保当前环境为 `local`：

    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

最后，你还应通过在 `composer.json` 文件中添加以下内容来防止 Telescope 包被[自动发现](/docs/{{version}}/packages#package-discovery)：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "laravel/telescope"
        ]
    }
},
```

<a name="configuration"></a>
### 配置

发布 Telescope 的资源后，其主要配置文件将位于 `config/telescope.php`。此配置文件允许你配置[监视器选项](#available-watchers)。每个配置选项都包含其用途的说明，因此请务必仔细研究此文件。

如果需要，你可以使用 `enabled` 配置选项完全禁用 Telescope 的数据收集：

    'enabled' => env('TELESCOPE_ENABLED', true),

<a name="data-pruning"></a>
### 数据清理

如果不进行清理，`telescope_entries` 表会非常快速地累积记录。为缓解此问题，你应该[调度](/docs/{{version}}/scheduling) `telescope:prune` Artisan 命令每日运行：

    $schedule->command('telescope:prune')->daily();

默认情况下，所有超过 24 小时的条目都将被清理。你可以在调用命令时使用 `hours` 选项来确定保留 Telescope 数据的时间。例如，以下命令将删除所有超过 48 小时前创建的记录：

    $schedule->command('telescope:prune --hours=48')->daily();

<a name="dashboard-authorization"></a>
### 仪表盘授权

可以在 `/telescope` 路由访问 Telescope 仪表盘。默认情况下，你只能在 `local` 环境中访问此仪表盘。在 `app/Providers/TelescopeServiceProvider.php` 文件中，有一个[授权门](/docs/{{version}}/authorization#gates)定义。此授权门控制**非本地**环境下对 Telescope 的访问。你可以根据需要自由修改此门，以限制对 Telescope 安装的访问：

    /**
     * 注册 Telescope 门。
     *
     * 此门确定谁可以在非本地环境中访问 Telescope。
     *
     * @return void
     */
    protected function gate()
    {
        Gate::define('viewTelescope', function ($user) {
            return in_array($user->email, [
                'taylor@laravel.com',
            ]);
        });
    }

> **Warning**  
> 你应确保在生产环境中将 `APP_ENV` 环境变量更改为 `production`。否则，你的 Telescope 安装将公开可用。

<a name="upgrading-telescope"></a>
## 升级 Telescope

升级到 Telescope 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，升级到任何新 Telescope 版本时，你应重新发布 Telescope 的资源：

```shell
php artisan telescope:publish
```

要保持资源最新并避免未来更新中的问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用程序 `composer.json` 文件的 `post-update-cmd` 脚本中：

```json
{
    "scripts": {
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ]
    }
}
```

<a name="filtering"></a>
## 过滤

<a name="filtering-entries"></a>
### 条目

你可以通过 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包来过滤 Telescope 记录的数据。默认情况下，此闭包在 `local` 环境中记录所有数据，在所有其他环境中记录异常、失败的作业、计划任务和带有受监视标签的数据：

    use Laravel\Telescope\IncomingEntry;
    use Laravel\Telescope\Telescope;

    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        $this->hideSensitiveRequestDetails();

        Telescope::filter(function (IncomingEntry $entry) {
            if ($this->app->environment('local')) {
                return true;
            }

            return $entry->isReportableException() ||
                $entry->isFailedJob() ||
                $entry->isScheduledTask() ||
                $entry->isSlowQuery() ||
                $entry->hasMonitoredTag();
        });
    }

<a name="filtering-batches"></a>
### 批次

虽然 `filter` 闭包过滤单个条目的数据，但你可以使用 `filterBatch` 方法注册一个闭包来过滤给定请求或控制台命令的所有数据。如果闭包返回 `true`，则所有条目都由 Telescope 记录：

    use Illuminate\Support\Collection;
    use Laravel\Telescope\Telescope;

    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        $this->hideSensitiveRequestDetails();

        Telescope::filterBatch(function (Collection $entries) {
            if ($this->app->environment('local')) {
                return true;
            }

            return $entries->contains(function ($entry) {
                return $entry->isReportableException() ||
                    $entry->isFailedJob() ||
                    $entry->isScheduledTask() ||
                    $entry->isSlowQuery() ||
                    $entry->hasMonitoredTag();
                });
        });
    }

<a name="tagging"></a>
## 标签

Telescope 允许你通过"标签"搜索条目。通常，标签是 Eloquent 模型类名或已认证用户 ID，Telescope 会自动将其添加到条目中。有时，你可能希望将自定义标签附加到条目。为此，你可以使用 `Telescope::tag` 方法。`tag` 方法接受一个应返回标签数组的闭包。闭包返回的标签将与 Telescope 自动附加到条目的任何标签合并。通常，你应在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法中调用 `tag` 方法：

    use Laravel\Telescope\IncomingEntry;
    use Laravel\Telescope\Telescope;

    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        $this->hideSensitiveRequestDetails();

        Telescope::tag(function (IncomingEntry $entry) {
            return $entry->type === 'request'
                        ? ['status:'.$entry->content['response_status']]
                        : [];
        });
     }

<a name="available-watchers"></a>
## 可用监视器

Telescope"监视器"在执行请求或控制台命令时收集应用程序数据。你可以在 `config/telescope.php` 配置文件中自定义要启用的监视器列表：

    'watchers' => [
        Watchers\CacheWatcher::class => true,
        Watchers\CommandWatcher::class => true,
        ...
    ],

某些监视器还允许你提供额外的自定义选项：

    'watchers' => [
        Watchers\QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'slow' => 100,
        ],
        ...
    ],

<a name="batch-watcher"></a>
### Batch 监视器

Batch 监视器记录有关队列[批次](/docs/{{version}}/queues#job-batching)的信息，包括作业和连接信息。

<a name="cache-watcher"></a>
### Cache 监视器

Cache 监视器在缓存键被命中、未命中、更新和遗忘时记录数据。

<a name="command-watcher"></a>
### Command 监视器

Command 监视器在执行 Artisan 命令时记录参数、选项、退出代码和输出。如果你希望从监视器记录中排除某些命令，可以在 `config/telescope.php` 文件的 `ignore` 选项中指定命令：

    'watchers' => [
        Watchers\CommandWatcher::class => [
            'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
            'ignore' => ['key:generate'],
        ],
        ...
    ],

<a name="dump-watcher"></a>
### Dump 监视器

Dump 监视器记录并显示你在 Telescope 中的变量转储。使用 Laravel 时，可以使用全局 `dump` 函数转储变量。Dump 监视器标签页必须在浏览器中打开才能记录转储，否则转储将被监视器忽略。

<a name="event-watcher"></a>
### Event 监视器

Event 监视器记录应用程序分发的任何[事件](/docs/{{version}}/events)的有效载荷、监听器和广播数据。Laravel 框架的内部事件会被 Event 监视器忽略。

<a name="exception-watcher"></a>
### Exception 监视器

Exception 监视器记录应用程序抛出的任何可报告异常的数据和堆栈跟踪。

<a name="gate-watcher"></a>
### Gate 监视器

Gate 监视器记录应用程序[门和策略](/docs/{{version}}/authorization)检查的数据和结果。如果你希望从监视器记录中排除某些能力，可以在 `config/telescope.php` 文件的 `ignore_abilities` 选项中指定：

    'watchers' => [
        Watchers\GateWatcher::class => [
            'enabled' => env('TELESCOPE_GATE_WATCHER', true),
            'ignore_abilities' => ['viewNova'],
        ],
        ...
    ],

<a name="http-client-watcher"></a>
### HTTP Client 监视器

HTTP Client 监视器记录应用程序发出的传出[HTTP 客户端请求](/docs/{{version}}/http-client)。

<a name="job-watcher"></a>
### Job 监视器

Job 监视器记录应用程序分发的任何[作业](/docs/{{version}}/queues)的数据和状态。

<a name="log-watcher"></a>
### Log 监视器

Log 监视器记录应用程序写入的任何[日志数据](/docs/{{version}}/logging)。

<a name="mail-watcher"></a>
### Mail 监视器

Mail 监视器允许你在浏览器中预览应用程序发送的[电子邮件](/docs/{{version}}/mail)及其关联数据。你还可以将电子邮件下载为 `.eml` 文件。

<a name="model-watcher"></a>
### Model 监视器

Model 监视器在分发 Eloquent[模型事件](/docs/{{version}}/eloquent#events)时记录模型更改。你可以通过监视器的 `events` 选项指定应记录哪些模型事件：

    'watchers' => [
        Watchers\ModelWatcher::class => [
            'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
            'events' => ['eloquent.created*', 'eloquent.updated*'],
        ],
        ...
    ],

如果你想记录给定请求期间水合的模型数量，请启用 `hydrations` 选项：

    'watchers' => [
        Watchers\ModelWatcher::class => [
            'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
            'events' => ['eloquent.created*', 'eloquent.updated*'],
            'hydrations' => true,
        ],
        ...
    ],

<a name="notification-watcher"></a>
### Notification 监视器

Notification 监视器记录应用程序发送的所有[通知](/docs/{{version}}/notifications)。如果通知触发了电子邮件且你启用了 Mail 监视器，该电子邮件也将在 Mail 监视器屏幕上可供预览。

<a name="query-watcher"></a>
### Query 监视器

Query 监视器记录应用程序执行的所有查询的原始 SQL、绑定和执行时间。监视器还会将任何慢于 100 毫秒的查询标记为 `slow`。你可以使用监视器的 `slow` 选项自定义慢查询阈值：

    'watchers' => [
        Watchers\QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'slow' => 50,
        ],
        ...
    ],

<a name="redis-watcher"></a>
### Redis 监视器

Redis 监视器记录应用程序执行的所有 [Redis](/docs/{{version}}/redis) 命令。如果你使用 Redis 进行缓存，缓存命令也将由 Redis 监视器记录。

<a name="request-watcher"></a>
### Request 监视器

Request 监视器记录与应用程序处理的任何请求关联的请求、头、会话和响应数据。你可以通过 `size_limit`（以千字节为单位）选项限制记录的响应数据：

    'watchers' => [
        Watchers\RequestWatcher::class => [
            'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
            'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
        ],
        ...
    ],

<a name="schedule-watcher"></a>
### Schedule 监视器

Schedule 监视器记录应用程序运行的任何[计划任务](/docs/{{version}}/scheduling)的命令和输出。

<a name="view-watcher"></a>
### View 监视器

View 监视器记录渲染视图时使用的[视图](/docs/{{version}}/views)名称、路径、数据和"composers"。

<a name="displaying-user-avatars"></a>
## 显示用户头像

Telescope 仪表盘显示保存给定条目时已认证用户的头像。默认情况下，Telescope 将使用 Gravatar Web 服务检索头像。但是，你可以通过在 `App\Providers\TelescopeServiceProvider` 类中注册回调来自定义头像 URL。回调将接收用户的 ID 和电子邮件地址，并应返回用户的头像图像 URL：

    use App\Models\User;
    use Laravel\Telescope\Telescope;

    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        // ...

        Telescope::avatar(function ($id, $email) {
            return '/avatars/'.User::find($id)->avatar_path;
        });
    }
