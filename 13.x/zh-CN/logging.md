# 日志

- [简介](#introduction)
- [配置](#configuration)
    - [可用的频道驱动](#available-channel-drivers)
    - [频道先决条件](#channel-prerequisites)
    - [记录弃用警告](#logging-deprecation-warnings)
- [构建日志堆栈](#building-log-stacks)
- [编写日志消息](#writing-log-messages)
    - [上下文信息](#contextual-information)
    - [写入特定频道](#writing-to-specific-channels)
- [Monolog 频道自定义](#monolog-channel-customization)
    - [为频道自定义 Monolog](#customizing-monolog-for-channels)
    - [创建 Monolog 处理器频道](#creating-monolog-handler-channels)
    - [通过工厂创建自定义频道](#creating-custom-channels-via-factories)
- [使用 Pail 跟踪日志消息](#tailing-log-messages-using-pail)
    - [安装](#pail-installation)
    - [用法](#pail-usage)
    - [过滤日志](#pail-filtering-logs)

<a name="introduction"></a>
## 简介

为了帮助你更多地了解应用内部发生的事情，Laravel 提供了强大的日志服务，允许你将消息记录到文件、系统错误日志，甚至可以记录到 Slack 以通知整个团队。

Laravel 的日志基于"频道"。每个频道代表一种写入日志信息的特定方式。例如，`single` 频道将日志文件写入单个日志文件，而 `slack` 频道将日志消息发送到 Slack。日志消息可以根据其严重程度写入多个频道。

在底层，Laravel 使用 [Monolog](https://github.com/Seldaek/monolog) 库，它支持各种强大的日志处理器。Laravel 让配置这些处理器变得轻而易举，允许你混合搭配它们以自定义应用的日志处理。

<a name="configuration"></a>
## 配置

所有控制应用日志行为的配置选项都位于 `config/logging.php` 配置文件中。该文件允许你配置应用的日志频道，因此请务必查看每个可用频道及其选项。下面我们将回顾一些常见选项。

默认情况下，Laravel 在记录消息时会使用 `stack` 频道。`stack` 频道用于将多个日志频道聚合到单个频道中。有关构建堆栈的更多信息，请查看[下面的文档](#building-log-stacks)。

<a name="available-channel-drivers"></a>
### 可用的频道驱动

每个日志频道都由一个"驱动"驱动。驱动决定了日志消息实际被记录的方式和位置。以下日志频道驱动在每个 Laravel 应用中都是可用的。大多数驱动的条目已经存在于应用的 `config/logging.php` 配置文件中，因此请务必查看此文件以熟悉其内容：

<div class="overflow-auto">

| 名称         | 描述                                                          |
| ------------ | -------------------------------------------------------------------- |
| `custom`     | 调用指定工厂来创建频道的驱动。         |
| `daily`      | 基于 Monolog `RotatingFileHandler` 的驱动，按日轮转。    |
| `monthly`    | 基于 Monolog `RotatingFileHandler` 的驱动，按月轮转。  |
| `errorlog`   | 基于 Monolog `ErrorLogHandler` 的驱动。                           |
| `monolog`    | Monolog 工厂驱动，可使用任何受支持的 Monolog 处理器。 |
| `papertrail` | 基于 Monolog `SyslogUdpHandler` 的驱动。                           |
| `single`     | 基于单个文件或路径的日志频道（`StreamHandler`）。        |
| `slack`      | 基于 Monolog `SlackWebhookHandler` 的驱动。                        |
| `stack`      | 用于创建"多频道"频道的包装器。           |
| `syslog`     | 基于 Monolog `SyslogHandler` 的驱动。                              |

</div>

> [!NOTE]
> 查看[高级频道自定义](#monolog-channel-customization)文档，以了解有关 `monolog` 和 `custom` 驱动的更多信息。

<a name="configuring-the-channel-name"></a>
#### 配置频道名称

默认情况下，Monolog 实例化时会带有一个与当前环境匹配的"频道名称"，例如 `production` 或 `local`。要更改此值，你可以向频道的配置中添加 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

<a name="channel-prerequisites"></a>
### 频道先决条件

<a name="configuring-the-single-daily-and-monthly-channels"></a>
#### 配置 Single、Daily 和 Monthly 频道

`single`、`daily` 和 `monthly` 频道有三个可选的配置选项：`bubble`、`permission` 和 `locking`。

<div class="overflow-auto">

| 名称         | 描述                                                                   | 默认值 |
| ------------ | ----------------------------------------------------------------------------- | ------- |
| `bubble`     | 指示消息在被处理后是否应冒泡到其他频道。 | `true`  |
| `locking`    | 在写入日志文件前尝试锁定该文件。                            | `false` |
| `permission` | 日志文件的权限。                                                   | `0644`  |

</div>

此外，`daily` 和 `monthly` 频道的保留策略可以通过 `max_files` 配置选项进行配置。`LOG_DAILY_DAYS` 环境变量也可用于配置 `daily` 频道的保留时间。

<a name="configuring-the-papertrail-channel"></a>
#### 配置 Papertrail 频道

`papertrail` 频道需要 `host` 和 `port` 配置选项。这些可以通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量定义。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

<a name="configuring-the-slack-channel"></a>
#### 配置 Slack 频道

`slack` 频道需要一个 `url` 配置选项。此值可以通过 `LOG_SLACK_WEBHOOK_URL` 环境变量定义。此 URL 应与为你的 Slack 团队配置的[入站 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) 的 URL 匹配。

默认情况下，Slack 只接收 `critical` 及以上级别的日志；不过，你可以使用 `LOG_LEVEL` 环境变量或修改 Slack 日志频道配置数组中的 `level` 配置选项来调整此设置。

<a name="logging-deprecation-warnings"></a>
### 记录弃用警告

PHP、Laravel 和其他库通常会通知用户某些功能已被弃用，并将在未来版本中移除。如果你想记录这些弃用警告，可以使用 `LOG_DEPRECATIONS_CHANNEL` 环境变量，或在应用的 `config/logging.php` 配置文件中指定你首选的 `deprecations` 日志频道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，你可以定义一个名为 `deprecations` 的日志频道。如果存在以此名称命名的日志频道，它将始终用于记录弃用警告：

```php
'channels' => [
    'deprecations' => [
        'driver' => 'single',
        'path' => storage_path('logs/php-deprecation-warnings.log'),
    ],
],
```

<a name="building-log-stacks"></a>
## 构建日志堆栈

如前所述，`stack` 驱动允许你将多个频道组合到单个日志频道中，以方便使用。为了说明如何使用日志堆栈，让我们看看一个生产应用中可能出现的示例配置：

```php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['syslog', 'slack'], // [tl! add]
        'ignore_exceptions' => false,
    ],

    'syslog' => [
        'driver' => 'syslog',
        'level' => env('LOG_LEVEL', 'debug'),
        'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
        'replace_placeholders' => true,
    ],

    'slack' => [
        'driver' => 'slack',
        'url' => env('LOG_SLACK_WEBHOOK_URL'),
        'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'),
        'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
        'level' => env('LOG_LEVEL', 'critical'),
        'replace_placeholders' => true,
    ],
],
```

让我们剖析这个配置。首先，注意我们的 `stack` 频道通过其 `channels` 选项聚合了另外两个频道：`syslog` 和 `slack`。因此，记录消息时，这两个频道都有机会记录该消息。不过，正如下面我们将看到的，这些频道是否实际记录该消息可能取决于消息的严重程度 / "级别"。

<a name="log-levels"></a>
#### 日志级别

请注意上例中 `syslog` 和 `slack` 频道配置中存在的 `level` 配置选项。此选项决定了消息要被频道记录所必须达到的最低"级别"。Monolog（为 Laravel 的日志服务提供支持）提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的所有日志级别。按严重程度降序排列，这些日志级别为：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**。

因此，想象我们用 `debug` 方法记录一条消息：

```php
Log::debug('An informational message.');
```

根据我们的配置，`syslog` 频道会将消息写入系统日志；但是，由于该错误消息不是 `critical` 或更高级别，它不会被发送到 Slack。然而，如果我们记录一条 `emergency` 消息，它将被同时发送到系统日志和 Slack，因为 `emergency` 级别高于我们两个频道的最低级别阈值：

```php
Log::emergency('The system is down!');
```

<a name="writing-log-messages"></a>
## 编写日志消息

你可以使用 `Log` [Facade](/docs/{{version}}/facades) 将信息写入日志。如前所述，记录器提供 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的八个日志级别：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**：

```php
use Illuminate\Support\Facades\Log;

Log::emergency($message);
Log::alert($message);
Log::critical($message);
Log::error($message);
Log::warning($message);
Log::notice($message);
Log::info($message);
Log::debug($message);
```

你可以调用其中任何一个方法来记录相应级别的消息。默认情况下，该消息将被写入 `logging` 配置文件配置的默认日志频道：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for the given user.
     */
    public function show(string $id): View
    {
        Log::info('Showing the user profile for user: {id}', ['id' => $id]);

        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

<a name="contextual-information"></a>
### 上下文信息

可以将上下文数据数组传递给日志方法。这些上下文数据将与日志消息一起被格式化并显示：

```php
use Illuminate\Support\Facades\Log;

Log::info('User {id} failed to login.', ['id' => $user->id]);
```

有时，你可能希望指定一些上下文信息，这些信息应包含在特定频道的所有后续日志条目中。例如，你可能希望记录与进入应用的每个请求关联的请求 ID。为此，你可以调用 `Log` Facade 的 `withContext` 方法：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::withContext([
            'request-id' => $requestId
        ]);

        $response = $next($request);

        $response->headers->set('Request-Id', $requestId);

        return $response;
    }
}
```

如果你希望在所有日志频道之间共享上下文信息，可以调用 `Log::shareContext()` 方法。该方法将向所有已创建的频道以及后续创建的任何频道提供上下文信息：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::shareContext([
            'request-id' => $requestId
        ]);

        // ...
    }
}
```

> [!NOTE]
> 如果你需要在处理队列任务时共享日志上下文，可以使用[任务中间件](/docs/{{version}}/queues#job-middleware)。

<a name="writing-to-specific-channels"></a>
### 写入特定频道

有时你可能希望将消息记录到应用默认频道以外的频道。你可以使用 `Log` Facade 上的 `channel` 方法获取并记录到配置文件中定义的任何频道：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('Something happened!');
```

如果你想创建由多个频道组成的按需日志堆栈，可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('Something happened!');
```

<a name="on-demand-channels"></a>
#### 按需频道

也可以通过在运行时提供配置来创建按需频道，而无需该配置存在于应用的 `logging` 配置文件中。为此，你可以向 `Log` Facade 的 `build` 方法传递一个配置数组：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('Something happened!');
```

你可能还想在按需日志堆栈中包含一个按需频道。这可以通过将按需频道实例包含在传递给 `stack` 方法的数组中来实现：

```php
use Illuminate\Support\Facades\Log;

$channel = Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
]);

Log::stack(['slack', $channel])->info('Something happened!');
```

<a name="monolog-channel-customization"></a>
## Monolog 频道自定义

<a name="customizing-monolog-for-channels"></a>
### 为频道自定义 Monolog

有时你可能需要完全控制如何为现有频道配置 Monolog。例如，你可能希望为 Laravel 内置的 `single` 频道配置自定义的 Monolog `FormatterInterface` 实现。

要开始，请在频道的配置上定义一个 `tap` 数组。`tap` 数组应包含一个类列表，这些类在 Monolog 实例创建后应有机会自定义（或"接入"）该实例。这些类没有约定俗成的存放位置，因此你可以自由地在应用中创建一个目录来存放这些类：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

在频道的配置中配置好 `tap` 选项后，你就可以定义将自定义 Monolog 实例的类了。该类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例将所有方法调用代理给底层的 Monolog 实例：

```php
<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;

class CustomizeFormatter
{
    /**
     * Customize the given logger instance.
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new LineFormatter(
                '[%datetime%] %channel%.%level_name%: %message% %context% %extra%'
            ));
        }
    }
}
```

> [!NOTE]
> 你的所有"tap"类都由[服务容器](/docs/{{version}}/container)解析，因此它们所需的任何构造函数依赖都会被自动注入。

<a name="creating-monolog-handler-channels"></a>
### 创建 Monolog 处理器频道

Monolog 有各种[可用的处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，而 Laravel 并未为每个处理器提供内置频道。在某些情况下，你可能希望创建一个自定义频道，它仅仅是某个没有对应 Laravel 日志驱动的特定 Monolog 处理器的实例。这些频道可以使用 `monolog` 驱动轻松创建。

使用 `monolog` 驱动时，`handler` 配置选项用于指定要实例化的处理器。可选地，处理器所需的任何构造函数参数可以使用 `handler_with` 配置选项指定：

```php
'logentries' => [
    'driver'  => 'monolog',
    'handler' => Monolog\Handler\SyslogUdpHandler::class,
    'handler_with' => [
        'host' => 'my.logentries.internal.datahubhost.company.com',
        'port' => '10000',
    ],
],
```

<a name="monolog-formatters"></a>
#### Monolog 格式化器

使用 `monolog` 驱动时，Monolog 的 `LineFormatter` 将用作默认格式化器。不过，你可以使用 `formatter` 和 `formatter_with` 配置选项自定义传递给处理器的格式化器类型：

```php
'browser' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\BrowserConsoleHandler::class,
    'formatter' => Monolog\Formatter\HtmlFormatter::class,
    'formatter_with' => [
        'dateFormat' => 'Y-m-d',
    ],
],
```

如果你使用的 Monolog 处理器能够提供自己的格式化器，可以将 `formatter` 配置选项的值设置为 `default`：

```php
'newrelic' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\NewRelicHandler::class,
    'formatter' => 'default',
],
```

<a name="monolog-processors"></a>
#### Monolog 处理器

Monolog 还可以在记录消息之前处理消息。你可以创建自己的处理器，或使用 [Monolog 提供的现有处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果你想自定义 `monolog` 驱动的处理器，请在频道的配置中添加 `processors` 配置值：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'handler_with' => [
        'stream' => 'php://stderr',
    ],
    'processors' => [
        // Simple syntax...
        Monolog\Processor\MemoryUsageProcessor::class,

        // With options...
        [
            'processor' => Monolog\Processor\PsrLogMessageProcessor::class,
            'with' => ['removeUsedContextFields' => true],
        ],
    ],
],
```

<a name="creating-custom-channels-via-factories"></a>
### 通过工厂创建自定义频道

如果你想定义一个完全自定义的频道，在其中完全控制 Monolog 的实例化和配置，可以在 `config/logging.php` 配置文件中指定 `custom` 驱动类型。你的配置应包含一个 `via` 选项，其中包含将被调用以创建 Monolog 实例的工厂类的名称：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

配置好 `custom` 驱动频道后，你就可以定义将创建 Monolog 实例的类了。该类只需要一个 `__invoke` 方法，它应返回 Monolog 记录器实例。该方法将接收频道配置数组作为其唯一参数：

```php
<?php

namespace App\Logging;

use Monolog\Logger;

class CreateCustomLogger
{
    /**
     * Create a custom Monolog instance.
     */
    public function __invoke(array $config): Logger
    {
        return new Logger(/* ... */);
    }
}
```

<a name="tailing-log-messages-using-pail"></a>
## 使用 Pail 跟踪日志消息

通常你可能需要实时跟踪应用的日志。例如，调试某个问题或监控应用日志以查找特定类型的错误时。

Laravel Pail 是一个允许你直接从命令行轻松查看 Laravel 应用日志文件的包。与标准的 `tail` 命令不同，Pail 被设计为可与任何日志驱动配合使用，包括 [Laravel Nightwatch](https://nightwatch.laravel.com)、Sentry 或 Flare。此外，Pail 提供一组有用的过滤器，帮助你快速度找到所需内容。

<img src="https://laravel.com/img/docs/pail-example.png">

<a name="pail-installation"></a>
### 安装

> [!WARNING]
> Laravel Pail 需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展。

要开始，使用 Composer 包管理器将 Pail 安装到项目中：

```shell
composer require --dev laravel/pail
```

<a name="pail-usage"></a>
### 用法

要开始跟踪日志，请运行 `pail` 命令：

```shell
php artisan pail
```

要增加输出的详细程度并避免截断（…），请使用 `-v` 选项：

```shell
php artisan pail -v
```

要获得最大详细程度并显示异常堆栈跟踪，请使用 `-vv` 选项：

```shell
php artisan pail -vv
```

要停止跟踪日志，请随时按 `Ctrl+C`。

<a name="pail-filtering-logs"></a>
### 过滤日志

<a name="pail-filtering-logs-filter-option"></a>
#### `--filter`

你可以使用 `--filter` 选项按类型、文件、消息和堆栈跟踪内容过滤日志：

```shell
php artisan pail --filter="QueryException"
```

<a name="pail-filtering-logs-message-option"></a>
#### `--message`

要仅按消息过滤日志，可以使用 `--message` 选项：

```shell
php artisan pail --message="User created"
```

<a name="pail-filtering-logs-level-option"></a>
#### `--level`

`--level` 选项可用于按[日志级别](#log-levels)过滤日志：

```shell
php artisan pail --level=error
```

<a name="pail-filtering-logs-user-option"></a>
#### `--user`

要仅显示在给定用户已认证期间写入的日志，可以向 `--user` 选项提供用户的 ID：

```shell
php artisan pail --user=1
```
