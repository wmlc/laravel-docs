# Laravel Telescope

- [简介](#introduction)
- [安装](#installation)
    - [仅本地安装](#local-only-installation)
    - [配置](#configuration)
    - [数据修剪](#data-pruning)
    - [仪表盘授权](#dashboard-authorization)
- [升级 Telescope](#upgrading-telescope)
- [过滤](#filtering)
    - [条目](#filtering-entries)
    - [批次](#filtering-batches)
- [标记](#tagging)
- [可用的监视器](#available-watchers)
    - [批次监视器](#batch-watcher)
    - [缓存监视器](#cache-watcher)
    - [命令监视器](#command-watcher)
    - [转储监视器](#dump-watcher)
    - [事件监视器](#event-watcher)
    - [异常监视器](#exception-watcher)
    - [Gate 监视器](#gate-watcher)
    - [HTTP 客户端监视器](#http-client-watcher)
    - [任务监视器](#job-watcher)
    - [日志监视器](#log-watcher)
    - [邮件监视器](#mail-watcher)
    - [模型监视器](#model-watcher)
    - [通知监视器](#notification-watcher)
    - [查询监视器](#query-watcher)
    - [Redis 监视器](#redis-watcher)
    - [请求监视器](#request-watcher)
    - [计划任务监视器](#schedule-watcher)
    - [视图监视器](#view-watcher)
- [显示用户头像](#displaying-user-avatars)

<a name="introduction"></a>
## 简介

[Laravel Telescope](https://github.com/laravel/telescope) 是你本地 Laravel 开发环境的绝佳伴侣。Telescope 可以让你深入了解进入应用的请求、异常、日志条目、数据库查询、队列任务、邮件、通知、缓存操作、计划任务、变量转储等等。

<img src="https://laravel.com/img/docs/telescope-example.png">

<a name="installation"></a>
## 安装

你可以使用 Composer 包管理器将 Telescope 安装到 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布其资源与迁移。安装 Telescope 后，你还应运行 `migrate` 命令来创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

最后，你可以通过 `/telescope` 路由访问 Telescope 仪表盘。

<a name="local-only-installation"></a>
### 仅本地安装

如果你计划仅使用 Telescope 来辅助本地开发，可以使用 `--dev` 标志安装 Telescope：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 后，你应从应用的 `bootstrap/providers.php` 配置文件中移除 `TelescopeServiceProvider` 服务提供者的注册。取而代之，在 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供者。我们将在注册提供者之前确保当前环境是 `local`：

```php
/**
 * Register any application services.
 */
public function register(): void
{
    if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);
    }
}
```

最后，你还应通过在 `composer.json` 文件中添加以下内容，阻止 Telescope 包被[自动发现](/docs/{{version}}/packages#package-discovery)：

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

发布 Telescope 的资源后，其主要配置文件将位于 `config/telescope.php`。该配置文件允许你配置[监视器选项](#available-watchers)。每个配置选项都包含其用途的说明，因此请务必充分浏览该文件。

如果需要，你可以使用 `enabled` 配置选项完全禁用 Telescope 的数据收集：

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

<a name="content-security-policy-csp-nonce"></a>
#### 内容安全策略（CSP）Nonce

如果你想在 Telescope 视图使用的脚本和样式标签上使用 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)，作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，可以使用 `Telescope::cspNonce` 方法指定要使用的 nonce。此方法通常应在中间件中调用，以便为每个请求分配新的 nonce：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Telescope\Telescope;
use Symfony\Component\HttpFoundation\Response;

public function handle(Request $request, Closure $next): Response
{
    Telescope::cspNonce('csp-nonce');

    return $next($request);
}
```

你可以将该中间件添加到应用 `config/telescope.php` 配置文件中的 `middleware` 选项中：

```php
'middleware' => [
    'web',
    App\Http\Middleware\AddTelescopeCspNonce::class,
    Authorize::class,
],
```

<a name="data-pruning"></a>
### 数据修剪

如果不进行修剪，`telescope_entries` 表可能会很快积累大量记录。为缓解此问题，你应该[调度](/docs/{{version}}/scheduling) `telescope:prune` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune')->daily();
```

默认情况下，超过 24 小时的所有条目都将被修剪。你可以在调用命令时使用 `hours` 选项来决定 Telescope 数据的保留时长。例如，以下命令将删除所有创建时间超过 48 小时的记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

<a name="dashboard-authorization"></a>
### 仪表盘授权

Telescope 仪表盘可以通过 `/telescope` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘。在你的 `app/Providers/TelescopeServiceProvider.php` 文件中，有一个[授权 Gate](/docs/{{version}}/authorization#gates)定义。该授权 Gate 控制**非本地**环境中对 Telescope 的访问。你可以根据需要修改此 Gate，以限制对 Telescope 安装的访问：

```php
use App\Models\User;

/**
 * Register the Telescope gate.
 *
 * This gate determines who can access Telescope in non-local environments.
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
> 你应确保在生产环境中将 `APP_ENV` 环境变量更改为 `production`。否则，你的 Telescope 安装将对公众开放。

<a name="upgrading-telescope"></a>
## 升级 Telescope

升级到 Telescope 的新主版本时，务必仔细阅读[升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，升级到任何新的 Telescope 版本时，你都应重新发布 Telescope 的资源：

```shell
php artisan telescope:publish
```

为保持资源最新并避免未来更新中出现问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用 `composer.json` 文件的 `post-update-cmd` 脚本中：

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

你可以通过在 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包过滤 Telescope 记录的数据。默认情况下，该闭包在 `local` 环境中记录所有数据，而在其他所有环境中记录异常、失败的任务、计划任务以及带受监视标记的数据：

```php
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
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

`filter` 闭包过滤单个条目的数据，而你可以使用 `filterBatch` 方法注册一个闭包，用于过滤给定请求或控制台命令的所有数据。如果该闭包返回 `true`，则所有条目都会被 Telescope 记录：

```php
use Illuminate\Support\Collection;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
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
## 标记

Telescope 允许你按"标签"搜索条目。通常，标签是 Telescope 自动添加到条目的 Eloquent 模型类名或已认证的用户 ID。有时，你可能希望为条目附加自己的自定义标签。为此，你可以使用 `Telescope::tag` 方法。`tag` 方法接受一个闭包，该闭包应返回一个标签数组。闭包返回的标签将与 Telescope 自动附加到条目的任何标签合并。通常，你应在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法中调用 `tag` 方法：

```php
use Laravel\Telescope\EntryType;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
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

Telescope "监视器"会在请求或控制台命令执行时收集应用数据。你可以在 `config/telescope.php` 配置文件中自定义要启用的监视器列表：

```php
'watchers' => [
    Watchers\CacheWatcher::class => true,
    Watchers\CommandWatcher::class => true,
    // ...
],
```

某些监视器还允许你提供额外的自定义选项：

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
### 批次监视器

批次监视器记录已排队的[批次](/docs/{{version}}/queues#job-batching)相关信息，包括任务和连接信息。

<a name="cache-watcher"></a>
### 缓存监视器

缓存监视器在缓存键被命中、未命中、更新和遗忘时记录数据。

<a name="command-watcher"></a>
### 命令监视器

命令监视器在 Artisan 命令执行时记录其参数、选项、退出码和输出。如果你希望某些命令不被监视器记录，可以在 `config/telescope.php` 文件的 `ignore` 选项中指定该命令：

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
### 转储监视器

转储监视器在 Telescope 中记录并显示你的变量转储。使用 Laravel 时，可以使用全局 `dump` 函数转储变量。转储监视器标签页必须在浏览器中打开，转储才会被记录，否则转储会被监视器忽略。

<a name="event-watcher"></a>
### 事件监视器

事件监视器记录应用触发的任何[事件](/docs/{{version}}/events)的负载、监听器和广播数据。Laravel 框架的内部事件会被事件监视器忽略。

<a name="exception-watcher"></a>
### 异常监视器

异常监视器记录应用抛出的任何可报告异常的数据和堆栈跟踪。

<a name="gate-watcher"></a>
### Gate 监视器

Gate 监视器记录应用的[Gate 和策略](/docs/{{version}}/authorization)检查的数据和结果。如果你希望某些能力不被监视器记录，可以在 `config/telescope.php` 文件的 `ignore_abilities` 选项中指定这些能力：

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
### HTTP 客户端监视器

HTTP 客户端监视器记录应用发出的出站 [HTTP 客户端请求](/docs/{{version}}/http-client)。

<a name="job-watcher"></a>
### 任务监视器

任务监视器记录应用分发的任何[任务](/docs/{{version}}/queues)的数据和状态。

<a name="log-watcher"></a>
### 日志监视器

日志监视器记录应用写入的任何[日志数据](/docs/{{version}}/logging)。

默认情况下，Telescope 只记录 `error` 级别及以上的日志。不过，你可以修改应用 `config/telescope.php` 配置文件中的 `level` 选项来改变此行为：

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
### 邮件监视器

邮件监视器允许你在浏览器中预览应用发送的[邮件](/docs/{{version}}/mail)及其关联数据。你也可以将邮件下载为 `.eml` 文件。

<a name="model-watcher"></a>
### 模型监视器

模型监视器在 Eloquent [模型事件](/docs/{{version}}/eloquent#events)被触发时记录模型更改。你可以通过监视器的 `events` 选项指定应记录哪些模型事件：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
    ],
    // ...
],
```

如果你想记录给定请求期间实例化的模型数量，请启用 `hydrations` 选项：

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
### 通知监视器

通知监视器记录应用发送的所有[通知](/docs/{{version}}/notifications)。如果通知触发了邮件且你启用了邮件监视器，则该邮件也可以在邮件监视器页面上预览。

<a name="query-watcher"></a>
### 查询监视器

查询监视器记录应用执行的所有查询的原始 SQL、绑定和执行时间。该监视器还会将任何慢于 100 毫秒的查询标记为 `slow`。你可以使用监视器的 `slow` 选项自定义慢查询阈值：

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

Redis 监视器记录应用执行的所有 [Redis](/docs/{{version}}/redis) 命令。如果你将 Redis 用于缓存，缓存命令也会被 Redis 监视器记录。

<a name="request-watcher"></a>
### 请求监视器

请求监视器记录应用处理的任何请求相关的请求、请求头、会话和响应数据。你可以通过 `size_limit`（以千字节为单位）选项限制记录的响应数据：

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
### 计划任务监视器

计划任务监视器记录应用运行的任何[计划任务](/docs/{{version}}/scheduling)的命令和输出。

<a name="view-watcher"></a>
### 视图监视器

视图监视器记录渲染视图时使用的[视图](/docs/{{version}}/views)名称、路径、数据和"合成器"。

<a name="displaying-user-avatars"></a>
## 显示用户头像

Telescope 仪表盘会显示保存给定条目时已认证用户的头像。默认情况下，Telescope 会使用 Gravatar Web 服务获取头像。不过，你可以通过在 `App\Providers\TelescopeServiceProvider` 类中注册回调来自定义头像 URL。该回调将接收用户的 ID 和邮箱地址，并应返回用户的头像图片 URL：

```php
use App\Models\User;
use Laravel\Telescope\Telescope;

/**
 * Register any application services.
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
