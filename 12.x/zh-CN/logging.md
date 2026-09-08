# 日志

- [简介](#introduction)
- [配置](#configuration)
    - [可用的通道驱动](#available-channel-drivers)
    - [通道前置要求](#channel-prerequisites)
    - [记录弃用警告](#logging-deprecation-warnings)
- [构建日志堆栈](#building-log-stacks)
- [写入日志消息](#writing-log-messages)
    - [上下文信息](#contextual-information)
    - [写入指定通道](#writing-to-specific-channels)
- [Monolog 通道自定义](#monolog-channel-customization)
    - [为通道自定义 Monolog](#customizing-monolog-for-channels)
    - [创建 Monolog Handler 通道](#creating-monolog-handler-channels)
    - [通过工厂创建自定义通道](#creating-custom-channels-via-factories)
- [使用 Pail 追踪日志消息](#tailing-log-messages-using-pail)
    - [安装](#pail-installation)
    - [用法](#pail-usage)
    - [过滤日志](#pail-filtering-logs)

<a name="introduction"></a>
## 简介

为了帮助你更好地了解应用内部正在发生的事情，Laravel 提供了健壮的日志服务，让你能够将消息记录到文件、系统错误日志，甚至记录到 Slack 来通知你的整个团队。

Laravel 的日志基于「通道」。每个通道代表一种写入日志信息的特定方式。例如，`single` 通道将日志写入单个日志文件，而 `slack` 通道则将日志消息发送到 Slack。日志消息可以根据其严重程度写入多个通道。

在底层，Laravel 使用了 [Monolog](https://github.com/Seldaek/monolog) 库，它为各种强大的日志处理器提供了支持。Laravel 让配置这些处理器变得轻而易举，你可以自由组合它们，自定义应用的日志处理方式。

<a name="configuration"></a>
## 配置

控制应用日志行为的所有配置选项都存放在 `config/logging.php` 配置文件中。通过这个文件，你可以配置应用的日志通道，因此请务必查看每个可用通道及其选项。下面我们将介绍几个常见的选项。

默认情况下，Laravel 在记录消息时使用 `stack` 通道。`stack` 通道用于将多个日志通道聚合为一个通道。有关构建堆栈的更多信息，请查阅[下文的文档](#building-log-stacks)。

<a name="available-channel-drivers"></a>
### 可用的通道驱动

每个日志通道都由一个「驱动」驱动。驱动决定了日志消息实际记录的方式和位置。每个 Laravel 应用都可以使用以下日志通道驱动。其中大多数驱动在应用的 `config/logging.php` 配置文件中已有对应条目，请务必查看该文件以熟悉其内容：

| 名称         | 说明                                                          |
| ------------ | -------------------------------------------------------------------- |
| `custom`     | 调用指定工厂来创建通道的驱动。         |
| `daily`      | 基于 `RotatingFileHandler` 的 Monolog 驱动，按天轮转日志。    |
| `errorlog`   | 基于 `ErrorLogHandler` 的 Monolog 驱动。                           |
| `monolog`    | Monolog 工厂驱动，可以使用任何受支持的 Monolog 处理器。 |
| `papertrail` | 基于 `SyslogUdpHandler` 的 Monolog 驱动。                           |
| `single`     | 基于单个文件或路径的日志通道（`StreamHandler`）。        |
| `slack`      | 基于 `SlackWebhookHandler` 的 Monolog 驱动。                        |
| `stack`      | 用于便捷创建「多通道」通道的包装器。           |
| `syslog`     | 基于 `SyslogHandler` 的 Monolog 驱动。                              |

> [!NOTE]
> 请查阅[高级通道自定义](#monolog-channel-customization)文档，详细了解 `monolog` 和 `custom` 驱动。

<a name="configuring-the-channel-name"></a>
#### 配置通道名称

默认情况下，实例化 Monolog 时会使用与当前环境匹配的「通道名称」，例如 `production` 或 `local`。要更改该值，你可以在通道配置中添加 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

<a name="channel-prerequisites"></a>
### 通道前置要求

<a name="configuring-the-single-and-daily-channels"></a>
#### 配置 Single 和 Daily 通道

`single` 和 `daily` 通道有三个可选配置选项：`bubble`、`permission` 和 `locking`。

| 名称         | 说明                                                                   | 默认值 |
| ------------ | ----------------------------------------------------------------------------- | ------- |
| `bubble`     | 表示消息在被处理之后是否冒泡传递给其他通道。 | `true`  |
| `locking`    | 写入之前尝试锁定日志文件。                            | `false` |
| `permission` | 日志文件的权限。                                                   | `0644`  |

此外，`daily` 通道的保留策略可以通过 `LOG_DAILY_DAYS` 环境变量或设置 `days` 配置选项来配置。

| 名称   | 说明                                                 | 默认值 |
| ------ | ----------------------------------------------------------- | ------- |
| `days` | 每日日志文件的保留天数。 | `14`    |

<a name="configuring-the-papertrail-channel"></a>
#### 配置 Papertrail 通道

`papertrail` 通道需要 `host` 和 `port` 配置选项。它们可以通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量来定义。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

<a name="configuring-the-slack-channel"></a>
#### 配置 Slack 通道

`slack` 通道需要 `url` 配置选项。该值可以通过 `LOG_SLACK_WEBHOOK_URL` 环境变量来定义。该 URL 应与你为 Slack 团队配置的[传入 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) 的 URL 一致。

默认情况下，Slack 只会接收 `critical` 级别及以上的日志；不过，你可以使用 `LOG_LEVEL` 环境变量或修改 Slack 日志通道配置数组中的 `level` 配置选项来调整这一行为。

<a name="logging-deprecation-warnings"></a>
### 记录弃用警告

PHP、Laravel 以及其他库经常会在未来版本中移除某些功能时，通知用户这些功能已被弃用。如果你想记录这些弃用警告，可以通过 `LOG_DEPRECATIONS_CHANNEL` 环境变量，或在应用的 `config/logging.php` 配置文件中指定你偏好的 `deprecations` 日志通道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，你也可以定义一个名为 `deprecations` 的日志通道。如果存在该名称的日志通道，它将始终用于记录弃用警告：

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

如前所述，`stack` 驱动让你可以便捷地将多个通道组合为单个日志通道。为了说明如何使用日志堆栈，我们来看一个可能在生产应用中见到的配置示例：

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

我们来剖析一下这个配置。首先，注意 `stack` 通道通过其 `channels` 选项聚合了另外两个通道：`syslog` 和 `slack`。因此，在记录消息时，这两个通道都有机会记录该消息。不过，正如我们在下文将看到的，这些通道是否实际记录消息，可能取决于消息的严重程度，即「级别」。

<a name="log-levels"></a>
#### 日志级别

请注意上例中 `syslog` 和 `slack` 通道配置里的 `level` 配置选项。该选项决定了消息要被通道记录所必须达到的最低「级别」。为 Laravel 日志服务提供支持的 Monolog，提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的全部日志级别。按严重程度从高到低排列，这些日志级别依次为：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**。

假设我们使用 `debug` 方法记录一条消息：

```php
Log::debug('An informational message.');
```

根据我们的配置，`syslog` 通道会将该消息写入系统日志；但由于该错误消息未达到 `critical` 级别及以上，它不会被发送到 Slack。然而，如果我们记录一条 `emergency` 消息，它会被同时发送到系统日志和 Slack，因为 `emergency` 级别高于这两个通道的最低级别阈值：

```php
Log::emergency('The system is down!');
```

<a name="writing-log-messages"></a>
## 写入日志消息

你可以使用 `Log` [Facade](/docs/{{version}}/facades) 向日志写入信息。如前所述，日志记录器提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的八个日志级别：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**：

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

你可以调用其中任何一个方法，来记录对应级别的消息。默认情况下，消息会被写入 `logging` 配置文件所配置的默认日志通道：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人信息。
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

可以向日志方法传递一个上下文数据数组。这些上下文数据会被格式化，并与日志消息一同显示：

```php
use Illuminate\Support\Facades\Log;

Log::info('User {id} failed to login.', ['id' => $user->id]);
```

有时，你可能希望指定一些上下文信息，让特定通道后续的所有日志条目都包含它们。例如，你可能希望记录与应用每个传入请求相关联的请求 ID。为此，你可以调用 `Log` Facade 的 `withContext` 方法：

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
     * 处理传入请求。
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

如果你希望在_所有_日志通道之间共享上下文信息，可以调用 `Log::shareContext()` 方法。该方法会将上下文信息提供给所有已创建的通道以及后续创建的任何通道：

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
     * 处理传入请求。
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
> 如果在处理队列任务时需要共享日志上下文，可以使用[任务中间件](/docs/{{version}}/queues#job-middleware)。

<a name="writing-to-specific-channels"></a>
### 写入指定通道

有时，你可能希望将消息记录到应用默认通道以外的通道。你可以使用 `Log` Facade 的 `channel` 方法，获取配置文件中定义的任何通道并向其写入日志：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('Something happened!');
```

如果你想创建一个由多个通道组成的按需日志堆栈，可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('Something happened!');
```

<a name="on-demand-channels"></a>
#### 按需通道

还可以在运行时提供配置来创建按需通道，而无需在应用的 `logging` 配置文件中写入该配置。为此，你可以将配置数组传递给 `Log` Facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('Something happened!');
```

你可能还希望将按需通道包含在按需日志堆栈中。只需将你的按需通道实例包含在传递给 `stack` 方法的数组中即可：

```php
use Illuminate\Support\Facades\Log;

$channel = Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
]);

Log::stack(['slack', $channel])->info('Something happened!');
```

<a name="monolog-channel-customization"></a>
## Monolog 通道自定义

<a name="customizing-monolog-for-channels"></a>
### 为通道自定义 Monolog

有时，你可能需要完全掌控现有通道的 Monolog 配置方式。例如，你可能想为 Laravel 内置的 `single` 通道配置一个自定义的 Monolog `FormatterInterface` 实现。

首先，在通道配置中定义一个 `tap` 数组。`tap` 数组应包含一系列类，它们将有机会在 Monolog 实例创建之后对其进行自定义（即「tap」接入）。这些类没有约定俗成的存放位置，因此你可以在应用中自由创建一个目录来存放它们：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

在通道上配置好 `tap` 选项后，你就可以定义用于自定义 Monolog 实例的类了。这个类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例会将所有方法调用代理到底层的 Monolog 实例：

```php
<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;

class CustomizeFormatter
{
    /**
     * 自定义给定的日志记录器实例。
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
> 你所有的「tap」类都由[服务容器](/docs/{{version}}/container)解析，因此它们需要的任何构造函数依赖都会被自动注入。

<a name="creating-monolog-handler-channels"></a>
### 创建 Monolog Handler 通道

Monolog 有多种[可用的处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，而 Laravel 并没有为每一种处理器都内置对应的通道。有时，你可能希望创建一个自定义通道，它仅仅是某个没有对应 Laravel 日志驱动的 Monolog 处理器的实例。这类通道可以轻松地使用 `monolog` 驱动来创建。

使用 `monolog` 驱动时，`handler` 配置选项用于指定将要实例化的处理器。此外，处理器所需的任何构造函数参数都可以通过 `handler_with` 配置选项来指定：

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

使用 `monolog` 驱动时，Monolog 的 `LineFormatter` 会作为默认格式化器。不过，你可以使用 `formatter` 和 `formatter_with` 配置选项来自定义传递给处理器的格式化器类型：

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

Monolog 还可以在记录消息之前对其进行处理。你可以创建自己的处理器，或使用 [Monolog 提供的现有处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果你想自定义 `monolog` 驱动的处理器，可以在通道配置中添加 `processors` 配置值：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'handler_with' => [
        'stream' => 'php://stderr',
    ],
    'processors' => [
        // 简单语法……
        Monolog\Processor\MemoryUsageProcessor::class,

        // 带选项……
        [
            'processor' => Monolog\Processor\PsrLogMessageProcessor::class,
            'with' => ['removeUsedContextFields' => true],
        ],
    ],
],
```

<a name="creating-custom-channels-via-factories"></a>
### 通过工厂创建自定义通道

如果你想定义一个完全自定义的通道，全面掌控 Monolog 的实例化和配置，可以在 `config/logging.php` 配置文件中指定 `custom` 驱动类型。你的配置应包含一个 `via` 选项，其值为工厂类的名称，该工厂类会被调用来创建 Monolog 实例：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

配置好 `custom` 驱动通道后，你就可以定义用于创建 Monolog 实例的类了。这个类只需要一个 `__invoke` 方法，该方法应返回 Monolog 日志记录器实例。该方法会接收通道配置数组作为其唯一参数：

```php
<?php

namespace App\Logging;

use Monolog\Logger;

class CreateCustomLogger
{
    /**
     * 创建自定义 Monolog 实例。
     */
    public function __invoke(array $config): Logger
    {
        return new Logger(/* ... */);
    }
}
```

<a name="tailing-log-messages-using-pail"></a>
## 使用 Pail 追踪日志消息

你经常需要实时追踪应用的日志。例如，在调试问题时，或在监控应用日志中的特定类型错误时。

Laravel Pail 是一个扩展包，让你能够直接从命令行轻松深入查看 Laravel 应用的日志文件。与标准的 `tail` 命令不同，Pail 专为配合任何日志驱动而设计，包括 Sentry 或 Flare。此外，Pail 还提供了一组实用的过滤器，帮助你快速找到所需内容。

<img src="https://laravel.com/img/docs/pail-example.png">

<a name="pail-installation"></a>
### 安装

> [!WARNING]
> Laravel Pail 需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展。

首先，使用 Composer 包管理器将 Pail 安装到你的项目中：

```shell
composer require --dev laravel/pail
```

<a name="pail-usage"></a>
### 用法

要开始追踪日志，请运行 `pail` 命令：

```shell
php artisan pail
```

要提高输出的详细程度并避免截断（……），请使用 `-v` 选项：

```shell
php artisan pail -v
```

要获得最大详细程度并显示异常堆栈跟踪，请使用 `-vv` 选项：

```shell
php artisan pail -vv
```

要停止追踪日志，随时按下 `Ctrl+C` 即可。

<a name="pail-filtering-logs"></a>
### 过滤日志

<a name="pail-filtering-logs-filter-option"></a>
#### `--filter`

你可以使用 `--filter` 选项按日志的类型、文件、消息以及堆栈跟踪内容来过滤日志：

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

要只显示给定用户处于认证状态时写入的日志，你可以将该用户的 ID 传给 `--user` 选项：

```shell
php artisan pail --user=1
```
