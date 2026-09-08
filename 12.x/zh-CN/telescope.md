# Laravel Telescope

- [简介](#introduction)
- [安装](#installation)
    - [仅在本地安装](#local-only-installation)
    - [配置](#configuration)
    - [数据清理](#data-pruning)
    - [仪表盘授权](#dashboard-authorization)
- [升级 Telescope](#upgrading-telescope)
- [过滤](#filtering)
    - [过滤条目](#filtering-entries)
    - [过滤批次](#filtering-batches)
- [标签](#tagging)
- [可用的监视器](#available-watchers)
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

[Laravel Telescope](https://github.com/laravel/telescope) 是本地 Laravel 开发环境的绝佳搭档。Telescope 让你深入了解进入应用的请求、异常、日志条目、数据库查询、队列任务、邮件、通知、缓存操作、计划任务、变量转储等信息。

<img src="https://laravel.com/img/docs/telescope-example.png">

<a name="installation"></a>
## 安装

你可以使用 Composer 包管理器将 Telescope 安装到 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布其资源文件与数据库迁移。安装完成后，你还应当运行 `migrate` 命令来创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

最后，你可以通过 `/telescope` 路由访问 Telescope 仪表盘。

<a name="local-only-installation"></a>
### 仅在本地安装

如果只打算在本地开发中使用 Telescope，可以在安装时加上 `--dev` 标志：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 之后，你应当从应用的 `bootstrap/providers.php` 配置文件中移除 `TelescopeServiceProvider` 服务提供者（Service Provider）的注册。改为在 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供者。注册之前，我们会确保当前环境为 `local`：

```php
/**
 * 注册任意应用服务。
 */
public function register(): void
{
    if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);
    }
}
```

最后，你还应当在 `composer.json` 文件中加入以下内容，防止 Telescope 包被[自动发现](/docs/{{version}}/packages#package-discovery)：

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

发布 Telescope 的资源文件后，其主配置文件位于 `config/telescope.php`。通过这个配置文件，你可以配置[监视器选项](#available-watchers)。每个配置选项都附有其用途的说明，请务必仔细阅读该文件。

如有需要，你可以使用 `enabled` 配置选项彻底关闭 Telescope 的数据收集：

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

<a name="data-pruning"></a>
### 数据清理

如果不做清理，`telescope_entries` 表中的记录会迅速累积。为缓解这一问题，你应当[调度](/docs/{{version}}/scheduling) `telescope:prune` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune')->daily();
```

默认情况下，所有超过 24 小时的条目都会被清理。你可以在调用命令时使用 `hours` 选项来决定 Telescope 数据的保留时长。例如，以下命令会删除 48 小时前创建的所有记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

<a name="dashboard-authorization"></a>
### 仪表盘授权

Telescope 仪表盘可以通过 `/telescope` 路由访问。默认情况下，只有在 `local` 环境中才能访问该仪表盘。在 `app/Providers/TelescopeServiceProvider.php` 文件中，有一个[授权 Gate](/docs/{{version}}/authorization#gates) 定义。这个授权 Gate 用于控制在**非本地**环境下对 Telescope 的访问。你可以根据需要随意修改它，以限制对你 Telescope 安装的访问：

```php
use App\Models\User;

/**
 * 注册 Telescope gate。
 *
 * 该 gate 决定在非本地环境下谁能访问 Telescope。
 */
protected function gate(): void
{
    Gate::define('viewTelescope', function (User $user) {
        return in_array($user->email, [
            'taylor@laravel.com',
        ]);
    });
}
```

> [!WARNING]
> 请确保在生产环境中将 `APP_ENV` 环境变量设置为 `production`。否则，你的 Telescope 安装将对公众开放。

<a name="upgrading-telescope"></a>
## 升级 Telescope

升级到 Telescope 新的主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，升级到任何新版本的 Telescope 时，你应当重新发布 Telescope 的资源文件：

```shell
php artisan telescope:publish
```

为了让资源文件保持最新、避免将来更新时出现问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用 `composer.json` 文件的 `post-update-cmd` 脚本中：

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
### 过滤条目

你可以通过 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包来过滤 Telescope 记录的数据。默认情况下，该闭包在 `local` 环境中记录所有数据；在其他环境中只记录异常、失败的任务、计划任务以及带有受监控标签的数据：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任意应用服务。
 */
public function register(): void
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
```

<a name="filtering-batches"></a>
### 过滤批次

`filter` 闭包针对单个条目过滤数据，而你也可以使用 `filterBatch` 方法注册一个闭包，来过滤某次请求或控制台命令的全部数据。如果该闭包返回 `true`，所有条目都会被 Telescope 记录：

```php
use Illuminate\Support\Collection;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::filterBatch(function (Collection $entries) {
        if ($this->app->environment('local')) {
            return true;
        }

        return $entries->contains(function (IncomingEntry $entry) {
            return $entry->isReportableException() ||
                $entry->isFailedJob() ||
                $entry->isScheduledTask() ||
                $entry->isSlowQuery() ||
                $entry->hasMonitoredTag();
            });
    });
}
```

<a name="tagging"></a>
## 标签

Telescope 允许你通过"标签"来搜索条目。通常，标签是 Eloquent 模型的类名或已认证用户的 ID，Telescope 会自动将其添加到条目上。有时，你可能想为条目附加自己的自定义标签。为此，可以使用 `Telescope::tag` 方法。`tag` 方法接受一个应当返回标签数组的闭包。该闭包返回的标签会与 Telescope 自动附加到条目上的任何标签合并。通常，你应当在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法中调用 `tag` 方法：

```php
use Laravel\Telescope\EntryType;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::tag(function (IncomingEntry $entry) {
        return $entry->type === EntryType::REQUEST
            ? ['status:'.$entry->content['response_status']]
            : [];
    });
}
```

<a name="available-watchers"></a>
## 可用的监视器

Telescope "监视器"（watcher）会在请求或控制台命令执行时收集应用数据。你可以在 `config/telescope.php` 配置文件中自定义要启用的监视器列表：

```php
'watchers' => [
    Watchers\CacheWatcher::class => true,
    Watchers\CommandWatcher::class => true,
    // ...
],
```

一些监视器还允许你提供额外的自定义选项：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 100,
    ],
    // ...
],
```

<a name="batch-watcher"></a>
### Batch 监视器

Batch 监视器记录队列[批次](/docs/{{version}}/queues#job-batching)的相关信息，包括任务与连接信息。

<a name="cache-watcher"></a>
### Cache 监视器

Cache 监视器在缓存键被命中、未命中、更新和删除时记录数据。

<a name="command-watcher"></a>
### Command 监视器

Command 监视器在每次执行 Artisan 命令时记录参数、选项、退出码和输出。如果不想让监视器记录某些命令，可以在 `config/telescope.php` 文件的 `ignore` 选项中指定这些命令：

```php
'watchers' => [
    Watchers\CommandWatcher::class => [
        'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
        'ignore' => ['key:generate'],
    ],
    // ...
],
```

<a name="dump-watcher"></a>
### Dump 监视器

Dump 监视器会在 Telescope 中记录并显示你的变量转储。在 Laravel 中，可以使用全局 `dump` 函数来转储变量。要记录转储内容，必须先在浏览器中打开 Dump 监视器标签页，否则转储会被监视器忽略。

<a name="event-watcher"></a>
### Event 监视器

Event 监视器记录应用派发的任何[事件](/docs/{{version}}/events)的有效载荷、监听器和广播数据。Laravel 框架内部的事件会被 Event 监视器忽略。

<a name="exception-watcher"></a>
### Exception 监视器

Exception 监视器记录应用抛出的任何可报告异常的数据和堆栈跟踪。

<a name="gate-watcher"></a>
### Gate 监视器

Gate 监视器记录应用进行[Gate 与策略](/docs/{{version}}/authorization)检查的数据和结果。如果不想让监视器记录某些能力，可以在 `config/telescope.php` 文件的 `ignore_abilities` 选项中指定它们：

```php
'watchers' => [
    Watchers\GateWatcher::class => [
        'enabled' => env('TELESCOPE_GATE_WATCHER', true),
        'ignore_abilities' => ['viewNova'],
    ],
    // ...
],
```

<a name="http-client-watcher"></a>
### HTTP Client 监视器

HTTP Client 监视器记录应用发出的出站 [HTTP 客户端请求](/docs/{{version}}/http-client)。

<a name="job-watcher"></a>
### Job 监视器

Job 监视器记录应用派发的任何[任务](/docs/{{version}}/queues)的数据和状态。

<a name="log-watcher"></a>
### Log 监视器

Log 监视器记录应用写入的任何[日志数据](/docs/{{version}}/logging)。

默认情况下，Telescope 只记录 `error` 级别及以上的日志。不过，你可以修改应用 `config/telescope.php` 配置文件中的 `level` 选项来改变这一行为：

```php
'watchers' => [
    Watchers\LogWatcher::class => [
        'enabled' => env('TELESCOPE_LOG_WATCHER', true),
        'level' => 'debug',
    ],

    // ...
],
```

<a name="mail-watcher"></a>
### Mail 监视器

Mail 监视器允许你在浏览器中预览应用发送的[邮件](/docs/{{version}}/mail)及其关联数据，还可以将邮件下载为 `.eml` 文件。

<a name="model-watcher"></a>
### Model 监视器

Model 监视器在每次派发 Eloquent [模型事件](/docs/{{version}}/eloquent#events)时记录模型变更。你可以通过监视器的 `events` 选项指定要记录哪些模型事件：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
    ],
    // ...
],
```

如果想记录给定请求期间被填充（hydrated）的模型数量，可以启用 `hydrations` 选项：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
        'hydrations' => true,
    ],
    // ...
],
```

<a name="notification-watcher"></a>
### Notification 监视器

Notification 监视器记录应用发送的所有[通知](/docs/{{version}}/notifications)。如果某个通知触发了邮件并且你启用了 Mail 监视器，那么该邮件也可以在 Mail 监视器界面中预览。

<a name="query-watcher"></a>
### Query 监视器

Query 监视器记录应用执行的所有查询的原始 SQL、绑定参数和执行时间。该监视器还会把任何执行时间超过 100 毫秒的查询标记为 `slow`（慢查询）。你可以通过监视器的 `slow` 选项自定义慢查询阈值：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 50,
    ],
    // ...
],
```

<a name="redis-watcher"></a>
### Redis 监视器

Redis 监视器记录应用执行的所有 [Redis](/docs/{{version}}/redis) 命令。如果你使用 Redis 做缓存，缓存命令也会被 Redis 监视器记录。

<a name="request-watcher"></a>
### Request 监视器

Request 监视器记录应用处理的任何请求所对应的请求数据、请求头、会话和响应数据。你可以通过 `size_limit`（单位为 KB）选项限制记录的响应数据大小：

```php
'watchers' => [
    Watchers\RequestWatcher::class => [
        'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
        'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
    ],
    // ...
],
```

<a name="schedule-watcher"></a>
### Schedule 监视器

Schedule 监视器记录应用运行的任何[计划任务](/docs/{{version}}/scheduling)的命令和输出。

<a name="view-watcher"></a>
### View 监视器

View 监视器记录渲染[视图](/docs/{{version}}/views)时使用的视图名称、路径、数据和"组合器"（composer）。

<a name="displaying-user-avatars"></a>
## 显示用户头像

Telescope 仪表盘会显示条目保存时处于已认证状态的用户头像。默认情况下，Telescope 会使用 Gravatar 网络服务获取头像。不过，你也可以在 `App\Providers\TelescopeServiceProvider` 类中注册一个回调来自定义头像 URL。该回调会接收到用户的 ID 和邮箱地址，并应当返回该用户的头像图片 URL：

```php
use App\Models\User;
use Laravel\Telescope\Telescope;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    // ...

    Telescope::avatar(function (?string $id, ?string $email) {
        return ! is_null($id)
            ? '/avatars/'.User::find($id)->avatar_path
            : '/generic-avatar.jpg';
    });
}
```
