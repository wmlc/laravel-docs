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
- [可用的监控器](#available-watchers)
    - [批处理监控器](#batch-watcher)
    - [缓存监控器](#cache-watcher)
    - [命令监控器](#command-watcher)
    - [变量转储监控器](#dump-watcher)
    - [事件监控器](#event-watcher)
    - [异常监控器](#exception-watcher)
    - [门授权监控器](#gate-watcher)
    - [HTTP 客户端监控器](#http-client-watcher)
    - [任务监控器](#job-watcher)
    - [日志监控器](#log-watcher)
    - [邮件监控器](#mail-watcher)
    - [模型监控器](#model-watcher)
    - [通知监控器](#notification-watcher)
    - [查询监控器](#query-watcher)
    - [Redis 监控器](#redis-watcher)
    - [请求监控器](#request-watcher)
    - [调度监控器](#schedule-watcher)
    - [视图监控器](#view-watcher)
- [显示用户头像](#displaying-user-avatars)

<a name="introduction"></a>
## 简介

[Laravel Telescope](https://github.com/laravel/telescope) 是本地 Laravel 开发环境的绝佳搭档。Telescope 让你洞察进入应用的请求、异常、日志条目、数据库查询、排队任务、邮件、通知、缓存操作、调度任务、变量转储等。

<img src="https://laravel.com/img/docs/telescope-example.png">

<a name="installation"></a>
## 安装

你可以使用 Composer 包管理器把 Telescope 安装到 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布它的静态资源和数据库迁移。安装 Telescope 后，你还应运行 `migrate` 命令，以创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

最后，你可以通过 `/telescope` 路由访问 Telescope 仪表盘。

<a name="local-only-installation"></a>
### 仅本地安装

如果你打算只在本地开发中使用 Telescope，可以使用 `--dev` 标志安装 Telescope：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 后，你应当从应用的 `bootstrap/providers.php` 配置文件中移除 `TelescopeServiceProvider` 服务提供者的注册。改为在 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供者。注册这些提供者之前，我们会确保当前环境为 `local`：

```php
/**
 * 注册任何应用服务。
 */
public function register(): void
{
    if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);
    }
}
```

最后，你还应当阻止 Telescope 包被[自动发现](/docs/{{version}}/packages#package-discovery)，为此在 `composer.json` 文件中加入以下内容：

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

发布 Telescope 的静态资源后，其主配置文件位于 `config/telescope.php`。该配置文件让你可以配置[监控器选项](#available-watchers)。每个配置选项都附有其用途的说明，务必详细查看该文件。

如果需要，你也可以使用 `enabled` 配置项完全禁用 Telescope 的数据收集：

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

<a name="data-pruning"></a>
### 数据清理

如果不进行清理，`telescope_entries` 表会非常快地累积记录。为缓解这个问题，你应当[调度](/docs/{{version}}/scheduling) `telescope:prune` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune')->daily();
```

默认情况下，所有超过 24 小时的条目都会被清理。你可以在调用该命令时使用 `hours` 选项来决定保留 Telescope 数据多长时间。例如，下面的命令会删除所有在 48 小时前创建的记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

<a name="dashboard-authorization"></a>
### 仪表盘授权

Telescope 仪表盘可通过 `/telescope` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘。在 `app/Providers/TelescopeServiceProvider.php` 文件中有一个[授权门](/docs/{{version}}/authorization#gates)定义。该授权门控制着在**非本地**环境中对 Telescope 的访问。你可以根据需要自由修改该门，以限制对你 Telescope 安装的访问：

```php
use App\Models\User;

/**
 * 注册 Telescope 授权门。
 *
 * 该授权门决定谁可以在非本地环境中访问 Telescope。
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
> 你应当确保在生产环境中把 `APP_ENV` 环境变量改为 `production`。否则，你的 Telescope 安装将对公网开放。

<a name="upgrading-telescope"></a>
## 升级 Telescope

升级到 Telescope 的新主要版本时，务必仔细阅读[升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，升级到任何新 Telescope 版本时，你都应重新发布 Telescope 的静态资源：

```shell
php artisan telescope:publish
```

为让静态资源保持最新并避免日后更新时出现问题，你可以把 `vendor:publish --tag=laravel-assets` 命令添加到应用 `composer.json` 文件的 `post-update-cmd` 脚本中：

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

你可以通过 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包来过滤 Telescope 记录的数据。默认情况下，该闭包会记录 `local` 环境中的所有数据，以及其它环境中的异常、失败任务、调度任务和带监控标签的数据：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
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
### 批次

`filter` 闭包用于过滤单个条目的数据，而 `filterBatch` 方法可让你注册一个闭包，用于过滤某个请求或控制台命令的全部数据。如果该闭包返回 `true`，Telescope 会记录所有条目：

```php
use Illuminate\Support\Collection;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
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

Telescope 允许你按"标签"搜索条目。标签通常是 Eloquent 模型类名或已认证用户 ID，Telescope 会自动把它们添加到条目上。有时你可能希望给自己的条目附加自定义标签。为此，可以使用 `Telescope::tag` 方法。`tag` 方法接受一个闭包，该闭包应返回一个标签数组。闭包返回的标签会与 Telescope 本会自动附加到该条目的标签合并。通常，你应当在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法中调用 `tag` 方法：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->hideSensitiveRequestDetails();

    Telescope::tag(function (IncomingEntry $entry) {
        return $entry->type === 'request'
            ? ['status:'.$entry->content['response_status']]
            : [];
    });
 }
```

<a name="available-watchers"></a>
## 可用的监控器

Telescope 的"监控器"会在请求或控制台命令执行时收集应用数据。你可以在 `config/telescope.php` 配置文件中自定义希望启用的监控器列表：

```php
'watchers' => [
    Watchers\CacheWatcher::class => true,
    Watchers\CommandWatcher::class => true,
    ...
],
```

部分监控器还允许你提供额外的自定义选项：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 100,
    ],
    ...
],
```

<a name="batch-watcher"></a>
### 批处理监控器

批处理监控器记录排队[批次](/docs/{{version}}/queues#job-batching)的相关信息，包括任务和连接信息。

<a name="cache-watcher"></a>
### 缓存监控器

缓存监控器在缓存键被命中、未命中、更新和遗忘时记录数据。

<a name="command-watcher"></a>
### 命令监控器

命令监控器在 Artisan 命令执行时记录其参数、选项、退出码和输出。如果希望排除某些命令不被该监控器记录，可以在 `config/telescope.php` 文件的 `ignore` 选项中指定这些命令：

```php
'watchers' => [
    Watchers\CommandWatcher::class => [
        'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
        'ignore' => ['key:generate'],
    ],
    ...
],
```

<a name="dump-watcher"></a>
### 变量转储监控器

变量转储监控器在 Telescope 中记录并显示你的变量转储。在 Laravel 中，可以使用全局 `dump` 函数转储变量。变量转储监控器的标签页必须在浏览器中打开，转储才会被记录，否则这些转储会被该监控器忽略。

<a name="event-watcher"></a>
### 事件监控器

事件监控器记录应用分发的任何[事件](/docs/{{version}}/events)的载荷、监听器和广播数据。Laravel 框架的内部事件会被事件监控器忽略。

<a name="exception-watcher"></a>
### 异常监控器

异常监控器记录应用抛出的任何可报告异常的数据和堆栈跟踪。

<a name="gate-watcher"></a>
### 门授权监控器

门授权监控器记录应用进行[门与策略](/docs/{{version}}/authorization)检查时的数据和结果。如果希望排除某些能力不被该监控器记录，可以在 `config/telescope.php` 文件的 `ignore_abilities` 选项中指定它们：

```php
'watchers' => [
    Watchers\GateWatcher::class => [
        'enabled' => env('TELESCOPE_GATE_WATCHER', true),
        'ignore_abilities' => ['viewNova'],
    ],
    ...
],
```

<a name="http-client-watcher"></a>
### HTTP 客户端监控器

HTTP 客户端监控器记录应用发出的 [HTTP 客户端请求](/docs/{{version}}/http-client)。

<a name="job-watcher"></a>
### 任务监控器

任务监控器记录应用分发的任何[任务](/docs/{{version}}/queues)的数据和状态。

<a name="log-watcher"></a>
### 日志监控器

日志监控器记录应用写入的[日志数据](/docs/{{version}}/logging)。

默认情况下，Telescope 只记录 `error` 及以上级别的日志。不过，你可以修改应用 `config/telescope.php` 配置文件中的 `level` 选项来改变这一行为：

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
### 邮件监控器

邮件监控器让你可以在浏览器中预览应用发出的[邮件](/docs/{{version}}/mail)及其相关数据。你还可以把该邮件下载为 `.eml` 文件。

<a name="model-watcher"></a>
### 模型监控器

模型监控器在 Eloquent [模型事件](/docs/{{version}}/eloquent#events)被分发时记录模型变更。你可以通过监控器的 `events` 选项指定要记录哪些模型事件：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
    ],
    ...
],
```

如果你希望记录某个请求中模型被加载（hydration）的数量，请启用 `hydrations` 选项：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
        'hydrations' => true,
    ],
    ...
],
```

<a name="notification-watcher"></a>
### 通知监控器

通知监控器记录应用发出的所有[通知](/docs/{{version}}/notifications)。如果该通知触发了一封邮件，并且你启用了邮件监控器，那么这封邮件也可以在邮件监控器页面上预览。

<a name="query-watcher"></a>
### 查询监控器

查询监控器记录应用执行的所有查询的原始 SQL、绑定值和执行时间。该监控器还会把耗时超过 100 毫秒的查询标记为 `slow`。你可以使用监控器的 `slow` 选项自定义慢查询阈值：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 50,
    ],
    ...
],
```

<a name="redis-watcher"></a>
### Redis 监控器

Redis 监控器记录应用执行的所有 [Redis](/docs/{{version}}/redis) 命令。如果你使用 Redis 做缓存，缓存命令也会被 Redis 监控器记录。

<a name="request-watcher"></a>
### 请求监控器

请求监控器记录应用处理的任何请求所关联的请求、标头、会话和响应数据。你可以通过 `size_limit`（单位为 KB）选项限制所记录的响应数据大小：

```php
'watchers' => [
    Watchers\RequestWatcher::class => [
        'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
        'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
    ],
    ...
],
```

<a name="schedule-watcher"></a>
### 调度监控器

调度监控器记录应用运行的任何[调度任务](/docs/{{version}}/scheduling)的命令和输出。

<a name="view-watcher"></a>
### 视图监控器

视图监控器记录渲染视图时所用的[视图](/docs/{{version}}/views)名称、路径、数据以及"组合器"。

<a name="displaying-user-avatars"></a>
## 显示用户头像

Telescope 仪表盘会显示保存某个条目时已通过认证的用户头像。默认情况下，Telescope 会使用 Gravatar Web 服务获取头像。不过，你可以在 `App\Providers\TelescopeServiceProvider` 类中注册一个回调来自定义头像 URL。该回调会收到用户 ID 和邮箱地址，并应返回该用户的头像图片 URL：

```php
use App\Models\User;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    // ...

    Telescope::avatar(function (string $id, string $email) {
        return '/avatars/'.User::find($id)->avatar_path;
    });
}
```