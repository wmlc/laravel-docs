# 日志

- [简介](#introduction)
- [配置](#configuration)
    - [可用通道驱动](#available-channel-drivers)
    - [通道前置条件](#channel-prerequisites)
    - [记录弃用警告](#logging-deprecation-warnings)
- [构建日志栈](#building-log-stacks)
- [编写日志消息](#writing-log-messages)
    - [上下文信息](#contextual-information)
    - [写入指定通道](#writing-to-specific-channels)
- [Monolog 通道自定义](#monolog-channel-customization)
    - [为通道自定义 Monolog](#customizing-monolog-for-channels)
    - [创建 Monolog 处理器通道](#creating-monolog-handler-channels)
    - [通过工厂创建自定义通道](#creating-custom-channels-via-factories)
- [使用 Pail 实时跟踪日志消息](#tailing-log-messages-using-pail)
    - [安装](#pail-installation)
    - [使用](#pail-usage)
    - [过滤日志](#pail-filtering-logs)

<a name="introduction"></a>
## 简介

为了帮助你更多地了解应用内部正在发生什么，Laravel 提供了强大的日志服务，允许你把消息记录到文件、系统错误日志，甚至记录到 Slack 以通知整个团队。

Laravel 的日志基于"通道"。每个通道代表一种特定的日志写入方式。例如，`single` 通道把日志写入单个日志文件，而 `slack` 通道把日志消息发送到 Slack。日志消息可以根据其严重程度被写入多个通道。

在底层，Laravel 使用 [Monolog](https://github.com/Seldaek/monolog) 库，它提供了对各种强大日志处理器的支持。Laravel 让配置这些处理器变得非常轻松，你可以自由组合它们来定制应用的日志处理。

<a name="configuration"></a>
## 配置

所有控制应用日志行为的配置项都集中在 `config/logging.php` 配置文件中。该文件让你可以配置应用的日志通道，因此请务必逐一查看各个可用通道及其选项。下面我们来看几个常用选项。

默认情况下，Laravel 在记录消息时会使用 `stack` 通道。`stack` 通道用于把多个日志通道聚合为一个通道。有关构建日志栈的更多信息，请查看[下面的文档](#building-log-stacks)。

<a name="available-channel-drivers"></a>
### 可用通道驱动

每个日志通道都由一个"驱动"驱动。驱动决定日志消息实际以何种方式记录在哪里。每个 Laravel 应用都提供以下日志通道驱动。你的应用 `config/logging.php` 配置文件中已经存在其中大多数驱动的配置项，因此请务必查看该文件以熟悉其内容：

<div class="overflow-auto">

| 名称         | 说明                                                          |
| ------------ | ------------------------------------------------------------- |
| `custom`     | 调用指定工厂来创建通道的驱动。                                 |
| `daily`      | 基于 `RotatingFileHandler` 的 Monolog 驱动，按天轮转。        |
| `errorlog`   | 基于 `ErrorLogHandler` 的 Monolog 驱动。                      |
| `monolog`    | Monolog 工厂驱动，可使用任意受支持的 Monolog 处理器。         |
| `papertrail` | 基于 `SyslogUdpHandler` 的 Monolog 驱动。                     |
| `single`     | 单文件或基于路径的日志通道（`StreamHandler`）。                |
| `slack`      | 基于 `SlackWebhookHandler` 的 Monolog 驱动。                  |
| `stack`      | 用于便捷创建"多通道"通道的包装器。                             |
| `syslog`     | 基于 `SyslogHandler` 的 Monolog 驱动。                        |

</div>

> [!NOTE]
> 查看[高级通道自定义](#monolog-channel-customization)文档，进一步了解 `monolog` 和 `custom` 驱动。

<a name="configuring-the-channel-name"></a>
#### 配置通道名称

默认情况下，Monolog 实例化时会带上一个与当前环境相匹配的"通道名称"，例如 `production` 或 `local`。要修改该值，你可以在通道配置中添加 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

<a name="channel-prerequisites"></a>
### 通道前置条件

<a name="configuring-the-single-and-daily-channels"></a>
#### 配置 single 与 daily 通道

`single` 和 `daily` 通道有三个可选配置项：`bubble`、`permission` 和 `locking`。

<div class="overflow-auto">

| 名称         | 说明                                              | 默认值  |
| ------------ | ------------------------------------------------- | ------- |
| `bubble`     | 指示消息处理完后是否继续冒泡到其他通道。          | `true`  |
| `locking`    | 写入前尝试对日志文件加锁。                        | `false` |
| `permission` | 日志文件的权限。                                  | `0644`  |

</div>

此外，`daily` 通道的保留策略可以通过 `LOG_DAILY_DAYS` 环境变量或设置 `days` 配置项来配置。

<div class="overflow-auto">

| 名称   | 说明                       | 默认值 |
| ------ | -------------------------- | ------ |
| `days` | 每日日志文件应保留的天数。 | `14`   |

</div>

<a name="configuring-the-papertrail-channel"></a>
#### 配置 Papertrail 通道

`papertrail` 通道需要 `host` 和 `port` 配置项。这些配置项可以通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量定义。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

<a name="configuring-the-slack-channel"></a>
#### 配置 Slack 通道

`slack` 通道需要一个 `url` 配置项。该值可以通过 `LOG_SLACK_WEBHOOK_URL` 环境变量定义。该 URL 应当匹配你为 Slack 团队配置的[传入 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) URL。

默认情况下，Slack 只会收到 `critical` 及以上级别的日志；不过，你可以通过 `LOG_LEVEL` 环境变量，或修改 Slack 日志通道配置数组中的 `level` 配置项来调整这一点。

<a name="logging-deprecation-warnings"></a>
### 记录弃用警告

PHP、Laravel 以及其他库经常通知使用者，某个功能已被弃用，并会在未来版本中移除。如果你希望记录这些弃用警告，可以通过 `LOG_DEPRECATIONS_CHANNEL` 环境变量，或在应用 `config/logging.php` 配置文件中指定你偏好的 `deprecations` 日志通道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，你可以定义一个名为 `deprecations` 的日志通道。如果存在同名日志通道，它将始终被用于记录弃用信息：

```php
'channels' => [
    'deprecations' => [
        'driver' => 'single',
        'path' => storage_path('logs/php-deprecation-warnings.log'),
    ],
],
```

<a name="building-log-stacks"></a>
## 构建日志栈

如前所述，`stack` 驱动允许你把多个通道合并为一个日志通道，以便统一处理。为说明如何使用日志栈，我们来看一个你可能在生产应用中看到的示例配置：

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

我们来拆解一下这份配置。首先，注意我们的 `stack` 通道通过 `channels` 选项聚合了另外两个通道：`syslog` 和 `slack`。因此，在记录消息时，这两个通道都有机会记录该消息。不过，正如下文将要看到的，这两个通道是否真正记录该消息，还取决于消息的严重程度 / "级别"。

<a name="log-levels"></a>
#### 日志级别

请留意上面示例中 `syslog` 和 `slack` 通道配置里的 `level` 配置项。该选项决定消息至少要达到哪个"级别"才会被该通道记录。为 Laravel 日志服务提供支持的 Monolog 实现了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的所有日志级别。按严重程度从高到低排列，这些日志级别依次是：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**。

假设我们使用 `debug` 方法记录一条消息：

```php
Log::debug('An informational message.');
```

按照我们的配置，`syslog` 通道会把该消息写入系统日志；不过，由于该错误消息并非 `critical` 或更高级别，它不会被发送到 Slack。但如果我们记录一条 `emergency` 消息，它就会被同时发送到系统日志和 Slack，因为 `emergency` 级别高于我们两个通道的最低级别阈值：

```php
Log::emergency('The system is down!');
```

<a name="writing-log-messages"></a>
## 编写日志消息

你可以使用 `Log` [Facade](/docs/{{version}}/facades)向日志写入信息。如前所述，记录器提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424)中定义的八个日志级别：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**：

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

你可以调用其中任意方法来记录对应级别的消息。默认情况下，消息会写入 `logging` 配置文件中配置的默认日志通道：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
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

可以向日志方法传入一个上下文数据数组。这部分上下文数据会被格式化，并与日志消息一同展示：

```php
use Illuminate\Support\Facades\Log;

Log::info('User {id} failed to login.', ['id' => $user->id]);
```

有时你可能希望指定某些上下文信息，让它们包含在某个通道之后的所有日志条目中。例如，你可能希望记录一个与每个传入应用请求相关联的请求 ID。为此，你可以调用 `Log` Facade 的 `withContext` 方法：

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
     * 处理传入的请求。
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

如果你希望在_所有_日志通道之间共享上下文信息，可以调用 `Log::shareContext()` 方法。该方法会把上下文信息提供给所有已创建的通道，以及之后创建的任何通道：

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
     * 处理传入的请求。
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
### 写入指定通道

有时你可能希望把消息记录到应用默认通道以外的通道上。你可以使用 `Log` Facade 上的 `channel` 方法，获取并写入配置文件中定义的任意通道：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('Something happened!');
```

如果你想创建一个由多个通道组成的即时日志栈，可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('Something happened!');
```

<a name="on-demand-channels"></a>
#### 即时通道

你也可以在运行时提供配置来创建即时通道，而无需把这些配置写进应用的 `logging` 配置文件。为此，你可以向 `Log` Facade 的 `build` 方法传入一个配置数组：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('Something happened!');
```

你可能还希望把即时通道纳入某个即时日志栈。只需把即时通道实例包含在传给 `stack` 方法的数组中即可实现：

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

有时你可能需要完全掌控某个已有通道的 Monolog 配置。例如，你可能想为 Laravel 内置的 `single` 通道配置一个自定义的 Monolog `FormatterInterface` 实现。

要开始使用，请在通道配置上定义一个 `tap` 数组。`tap` 数组应当包含一个类名列表，这些类在 Monolog 实例创建之后有机会对其进行自定义（或"挂钩"）。这些类没有约定的存放位置，因此你可以自由地在应用中创建一个目录来容纳它们：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

在通道上配置好 `tap` 选项后，就可以定义用于自定义 Monolog 实例的类了。这个类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例会把所有方法调用代理到底层的 Monolog 实例：

```php
<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;

class CustomizeFormatter
{
    /**
     * 自定义给定的记录器实例。
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
> 你的所有"tap"类都通过[服务容器（Service Container）](/docs/{{version}}/container)解析，因此它们所需的任何构造函数依赖都会被自动注入。

<a name="creating-monolog-handler-channels"></a>
### 创建 Monolog 处理器通道

Monolog 提供了多种[可用处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，而 Laravel 并未为每一个都内置对应的通道。在某些情况下，你可能希望创建一个自定义通道，它仅仅是某个特定 Monolog 处理器的实例，而该处理器并没有对应的 Laravel 日志驱动。这类通道可以使用 `monolog` 驱动轻松创建。

使用 `monolog` 驱动时，`handler` 配置项用于指定要实例化哪个处理器。此外，处理器所需的任何构造函数参数都可以选用 `with` 配置项来指定：

```php
'logentries' => [
    'driver'  => 'monolog',
    'handler' => Monolog\Handler\SyslogUdpHandler::class,
    'with' => [
        'host' => 'my.logentries.internal.datahubhost.company.com',
        'port' => '10000',
    ],
],
```

<a name="monolog-formatters"></a>
#### Monolog 格式化器

使用 `monolog` 驱动时，Monolog 的 `LineFormatter` 会作为默认格式化器。不过，你可以使用 `formatter` 和 `formatter_with` 配置项自定义传给处理器的格式化器类型：

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

如果你使用的 Monolog 处理器能够提供自己的格式化器，可以把 `formatter` 配置项的值设为 `default`：

```php
'newrelic' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\NewRelicHandler::class,
    'formatter' => 'default',
],
```

<a name="monolog-processors"></a>
#### Monolog 预处理器

Monolog 还可以在记录消息之前对其进行处理。你可以创建自己的预处理器，也可以使用 [Monolog 现有的预处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果你想为 `monolog` 驱动自定义预处理器，请在该通道的配置中添加 `processors` 配置值：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'with' => [
        'stream' => 'php://stderr',
    ],
    'processors' => [
        // 简单语法...
        Monolog\Processor\MemoryUsageProcessor::class,

        // 带选项...
        [
           'processor' => Monolog\Processor\PsrLogMessageProcessor::class,
           'with' => ['removeUsedContextFields' => true],
       ],
    ],
],
```

<a name="creating-custom-channels-via-factories"></a>
### 通过工厂创建自定义通道

如果你想定义一个完全自定义的通道，并对 Monolog 的实例化与配置拥有完全控制权，可以在 `config/logging.php` 配置文件中指定 `custom` 驱动类型。你的配置应当包含一个 `via` 选项，其中填写将被调用来创建 Monolog 实例的工厂类名：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

配置好 `custom` 驱动通道后，就可以定义用于创建 Monolog 实例的类了。这个类只需要一个 `__invoke` 方法，它应当返回 Monolog 记录器实例。该方法会以通道配置数组作为唯一参数：

```php
<?php

namespace App\Logging;

use Monolog\Logger;

class CreateCustomLogger
{
    /**
     * 创建一个自定义的 Monolog 实例。
     */
    public function __invoke(array $config): Logger
    {
        return new Logger(/* ... */);
    }
}
```

<a name="tailing-log-messages-using-pail"></a>
## 使用 Pail 实时跟踪日志消息

你经常需要实时跟踪应用的日志，例如在调试某个问题，或监控应用中特定类型的错误时。

Laravel Pail 是一个包，让你可以在命令行中直接深入查看你的 Laravel 应用日志文件。与标准的 `tail` 命令不同，Pail 旨在兼容任何日志驱动，包括 Sentry 或 Flare。此外，Pail 还提供了一组实用的过滤器，帮助你快速找到想要的内容。

<img src="https://laravel.com/img/docs/pail-example.png">

<a name="pail-installation"></a>
### 安装

> [!WARNING]
> Laravel Pail 需要 [PHP 8.2+](https://php.net/releases/) 和 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) 扩展。

要开始使用，请通过 Composer 包管理器把 Pail 安装到你的项目中：

```bash
composer require laravel/pail
```

<a name="pail-usage"></a>
### 使用

要开始跟踪日志，运行 `pail` 命令：

```bash
php artisan pail
```

要提高输出的详细程度并避免截断（…），请使用 `-v` 选项：

```bash
php artisan pail -v
```

要获取最详细的输出并显示异常堆栈跟踪，请使用 `-vv` 选项：

```bash
php artisan pail -vv
```

要停止跟踪日志，随时按 `Ctrl+C`。

<a name="pail-filtering-logs"></a>
### 过滤日志

<a name="pail-filtering-logs-filter-option"></a>
#### `--filter`

你可以使用 `--filter` 选项按类型、文件、消息和堆栈跟踪内容过滤日志：

```bash
php artisan pail --filter="QueryException"
```

<a name="pail-filtering-logs-message-option"></a>
#### `--message`

要仅按消息内容过滤日志，可以使用 `--message` 选项：

```bash
php artisan pail --message="User created"
```

<a name="pail-filtering-logs-level-option"></a>
#### `--level`

`--level` 选项可用于按[日志级别](#log-levels)过滤日志：

```bash
php artisan pail --level=error
```

<a name="pail-filtering-logs-user-option"></a>
#### `--user`

要只显示某个用户处于认证状态期间写入的日志，可以把该用户的 ID 提供给 `--user` 选项：

```bash
php artisan pail --user=1
```
