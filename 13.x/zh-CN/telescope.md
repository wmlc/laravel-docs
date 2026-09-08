# Laravel Telescope

## 简介

[Laravel Telescope](https://github.com/laravel/telescope) 是你本地 Laravel 开发环境的绝佳伴侣。Telescope 可让你洞察进入应用程序的 请求、异常、日志条目、数据库查询、排队任务、邮件、通知、缓存操作、调度任务、变量转储等。

<img src="https://laravel.com/img/docs/telescope-example.png">

## 安装

你可以使用 Composer 包管理器将 Telescope 安装到你的 Laravel 项目中：

```shell
composer require laravel/telescope
```

安装 Telescope 后，使用 `telescope:install` Artisan 命令发布其资源和迁移文件。安装 Telescope 后，你还应该运行 `migrate` 命令以创建存储 Telescope 数据所需的表：

```shell
php artisan telescope:install

php artisan migrate
```

最后，你可以通过 `/telescope` 路由访问 Telescope 仪表盘。

### 仅本地安装

如果你计划仅使用 Telescope 来辅助本地开发，可以使用 `--dev` 标志安装 Telescope：

```shell
composer require laravel/telescope --dev

php artisan telescope:install

php artisan migrate
```

运行 `telescope:install` 后，你应该从应用程序的 `bootstrap/providers.php` 配置文件中移除 `TelescopeServiceProvider` 服务提供者（Service Provider）的注册。取而代之，在 `App\Providers\AppServiceProvider` 类的 `register` 方法中手动注册 Telescope 的服务提供者。我们会确保在注册这些提供者之前当前环境为 `local`：

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

最后，你还应该通过将以下内容添加到 `composer.json` 文件来阻止 Telescope 包被[自动发现](/topic/Laravel%2013.x/2qvpx1z93m.html)：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "laravel/telescope"
        ]
    }
},
```

### 配置

发布 Telescope 的资源后，其主要配置文件将位于 `config/telescope.php`。该配置文件允许你配置你的监听器选项。每个配置选项都包含对其用途的说明，因此请务必仔细探索该文件。

如果需要，你可以使用 `enabled` 配置选项完全禁用 Telescope 的数据收集：

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

#### 内容安全策略（CSP）Nonce

如果你想在 Telescope 视图中使用的 script 和 style 标签上作为[nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)使用，作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，你可以使用 `Telescope::cspNonce` 方法指定要使用的 nonce。该方法通常应在 中间件 中调用，以便为每个 请求 分配一个新的 nonce：

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

你可以将此 中间件 添加到应用程序 `config/telescope.php` 配置文件中的 `middleware` 选项：

```php
'middleware' => [
    'web',
    App\Http\Middleware\AddTelescopeCspNonce::class,
    Authorize::class,
],
```

### 数据清理

如果不进行修剪，`telescope_entries` 表会非常快速地累积记录。为缓解此问题，你应该[调度](/topic/Laravel%2013.x/e296olw9q7.html) `telescope:prune` Artisan 命令每日运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune')->daily();
```

默认情况下，所有超过 24 小时的条目都会被修剪。你可以在调用命令时使用 `hours` 选项来确定保留 Telescope 数据的时长。例如，以下命令将删除超过 48 小时前创建的所有记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

### 仪表盘授权

Telescope 仪表盘可以通过 `/telescope` 路由访问。默认情况下，你只能在 `local` 环境中访问此仪表盘。在 `app/Providers/TelescopeServiceProvider.php` 文件中，有一个[授权 Gate](/topic/Laravel%2013.x/2wy3l43ykm.html)定义。该授权 Gate 控制**非本地**环境下对 Telescope 的访问。你可以根据需要修改此 Gate 以限制对 Telescope 安装的访问：

```php
use App\Models\User;

/**
 * 注册 Telescope Gate。
 *
 * 该 Gate 决定在非本地环境中谁可以访问 Telescope。
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
> 你应该确保将生产环境中的 `APP_ENV` 环境变量更改为 `production`。否则，你的 Telescope 安装将公开可访问。

## 升级 Telescope

升级到 Telescope 新的主版本时，请务必仔细查看 [升级指南](https://github.com/laravel/telescope/blob/master/UPGRADE.md)。

此外，升级到任何新的 Telescope 版本时，你都应该重新发布 Telescope 的资源：

```shell
php artisan telescope:publish
```

为保持资源为最新并避免未来更新时出现问题，你可以将 `vendor:publish --tag=laravel-assets` 命令添加到应用程序 `composer.json` 文件的 `post-update-cmd` 脚本中：

```json
{
    "scripts": {
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ]
    }
}
```

## 过滤

### 条目

你可以通过在 `App\Providers\TelescopeServiceProvider` 类中定义的 `filter` 闭包来过滤 Telescope 记录的数据。默认情况下，该闭包会在 `local` 环境中记录所有数据，以及在所有其他环境中记录异常、失败任务、调度任务，以及带有受监控标签的数据：

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

### 批处理

虽然 `filter` 闭包过滤单个条目的数据，但你可以使用 `filterBatch` 方法注册一个过滤给定 请求 或控制台命令的所有数据的闭包。如果闭包返回 `true`，则所有条目都会被 Telescope 记录：

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

## 标记

Telescope 允许你按"标签"搜索条目。标签通常是 Eloquent 模型类名或已验证用户 ID，Telescope 会自动将其添加到条目中。偶尔，你可能想要将自己的自定义标签附加到条目上。为此，你可以使用 `Telescope::tag` 方法。`tag` 方法接受一个应返回标签数组的闭包。闭包返回的标签将与 Telescope 会自动附加到条目的任何标签合并。通常，你应该在 `App\Providers\TelescopeServiceProvider` 类的 `register` 方法中调用 `tag` 方法：

```php
use Laravel\Telescope\EntryType;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
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

## 可用的监视器

Telescope 的"监听器（watchers）"会在 请求 或控制台命令执行时收集应用程序数据。你可以在 `config/telescope.php` 配置文件中自定义想要启用的监听器列表：

```php
'watchers' => [
    Watchers\CacheWatcher::class => true,
    Watchers\CommandWatcher::class => true,
    // ...
],
```

某些监听器还允许你提供额外的自定义选项：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 100,
    ],
    // ...
],
```

### 批处理监视器

Batch 监听器记录有关排队[批处理](/topic/Laravel%2013.x/wevwmkz9l2.html)的信息，包括任务和连接信息。

### 缓存监视器

Cache 监听器在缓存键被命中、未命中、更新或遗忘时记录数据。

### 命令监视器

Command 监听器在每次执行 Artisan 命令时记录参数、选项、退出码和输出。如果你想将某些命令排除在监听器的记录之外，可以在 `config/telescope.php` 文件中的 `ignore` 选项中指定该命令：

```php
'watchers' => [
    Watchers\CommandWatcher::class => [
        'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
        'ignore' => ['key:generate'],
    ],
    // ...
],
```

### Dump 监视器

Dump 监听器在 Telescope 中记录并显示你的变量转储。使用 Laravel 时，可以使用全局 `dump` 函数转储变量。Dump 监听器的标签页必须在浏览器中打开才能记录转储，否则这些转储将被监听器忽略。

### 事件监视器

Event 监听器记录你的应用程序分发的任何[事件](/topic/Laravel%2013.x/x3vo0l4vm1.html)的负载、监听器和广播数据。Laravel 框架内部的事件会被 Event 监听器忽略。

### 异常监视器

Exception 监听器记录你的应用程序抛出的任何可报告异常的数据和堆栈跟踪。

### Gate 监视器

Gate 监听器记录你的应用程序的[Gate 和策略](/topic/Laravel%2013.x/2wy3l43ykm.html)检查的數据和结果。如果你想将某些能力排除在监听器的记录之外，可以在 `config/telescope.php` 文件中的 `ignore_abilities` 选项中指定它们：

```php
'watchers' => [
    Watchers\GateWatcher::class => [
        'enabled' => env('TELESCOPE_GATE_WATCHER', true),
        'ignore_abilities' => ['viewNova'],
    ],
    // ...
],
```

### HTTP 客户端监视器

HTTP Client 监听器记录你的应用程序发出的传出 [HTTP 客户端请求](/topic/Laravel%2013.x/dgy7x15vw2.html)。

### 任务监视器

Job 监听器记录你的应用程序分发的任何[任务](/topic/Laravel%2013.x/wevwmkz9l2.html)的数据和状态。

### 日志监视器

Log 监听器记录你的应用程序写入的任何[日志数据](/topic/Laravel%2013.x/2wy3l33ykm.html)。

默认情况下，Telescope 只会记录 `error` 级别及以上的日志。不过，你可以修改应用程序 `config/telescope.php` 配置文件中的 `level` 选项来更改此行为：

```php
'watchers' => [
    Watchers\LogWatcher::class => [
        'enabled' => env('TELESCOPE_LOG_WATCHER', true),
        'level' => 'debug',
    ],

    // ...
],
```

### 邮件监视器

Mail 监听器允许你在浏览器中预览你的应用程序发送的[邮件](/topic/Laravel%2013.x/d6vro0rv3g.html)及其相关数据。你还可以将邮件下载为 `.eml` 文件。

### 模型监视器

Model 监听器在分发 Eloquent [模型事件](/topic/Laravel%2013.x/rwyl2kxvz8.html)时记录模型变更。你可以通过监听器的 `events` 选项指定应记录哪些模型事件：

```php
'watchers' => [
    Watchers\ModelWatcher::class => [
        'enabled' => env('TELESCOPE_MODEL_WATCHER', true),
        'events' => ['eloquent.created*', 'eloquent.updated*'],
    ],
    // ...
],
```

如果你想记录在给定 请求 期间水合的模型数量，请启用 `hydrations` 选项：

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

### 通知监视器

Notification 监听器记录你的应用程序发送的所有[通知](/topic/Laravel%2013.x/2ky045l9z8.html)。如果通知触发了邮件，并且你启用了 Mail 监听器，则该邮件也可在 Mail 监听器界面中预览。

### 查询监视器

Query 监听器记录你的应用程序执行的所有查询的原始 SQL、绑定和执行时间。该监听器还会将任何慢于 100 毫秒的查询标记为 `slow`。你可以使用监听器的 `slow` 选项自定义慢查询阈值：

```php
'watchers' => [
    Watchers\QueryWatcher::class => [
        'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
        'slow' => 50,
    ],
    // ...
],
```

### Redis 监视器

Redis 监听器记录你的应用程序执行的所有 [Redis](/topic/Laravel%2013.x/569x518yep.html) 命令。如果你使用 Redis 进行缓存，缓存命令也会被 Redis 监听器记录。

### 请求监视器

Request 监听器记录应用程序处理的任何 请求 相关的 请求、Header、会话和 响应 数据。你可以通过 `size_limit`（以千字节为单位）选项限制记录的 响应 数据：

```php
'watchers' => [
    Watchers\RequestWatcher::class => [
        'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
        'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
    ],
    // ...
],
```

### 计划任务监视器

Schedule 监听器记录你的应用程序运行的任何[调度任务](/topic/Laravel%2013.x/e296olw9q7.html)的命令和输出。

### 视图监视器

View 监听器记录渲染视图时使用的[视图](/topic/Laravel%2013.x/m892gz6y01.html)名称、路径、数据和"composers"。

## 显示用户头像

Telescope 仪表盘会显示保存给定条目时已验证用户的头像。默认情况下，Telescope 会使用 Gravatar 网络服务获取头像。不过，你可以通过在 `App\Providers\TelescopeServiceProvider` 类中注册一个回调来自定义头像 URL。该回调将接收用户的 ID 和邮箱地址，并应返回用户的头像图片 URL：

```php
use App\Models\User;
use Laravel\Telescope\Telescope;

/**
 * 注册任何应用服务。
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