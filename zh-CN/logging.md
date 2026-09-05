# 日志

## 简介

为了帮助你了解应用内部正在发生的事情，Laravel 提供了强大的日志服务，允许你将消息记录到文件、系统错误日志，甚至 Slack，以通知整个团队。

Laravel 的日志基于"通道（channel）"。每个通道代表一种写入日志信息的具体方式。例如，`single` 通道将日志文件写入单个日志文件，而 `slack` 通道将日志消息发送到 Slack。日志消息可根据其严重程度写入多个通道。

底层，Laravel 使用了 Monolog 库，该库为各种强大的日志处理器（handler）提供支持。Laravel 让配置这些处理器变得轻而易举，你可以自由组合它们，以自定义应用的日志处理方式。

## 配置

控制应用日志行为的全部配置选项都存放在 `config/logging.php` 配置文件中。该文件允许你配置应用的日志通道，因此请务必查看每个可用通道及其选项。下面我们将介绍几个常见选项。

默认情况下，Laravel 在记录消息时会使用 `stack` 通道。该通道用于将多个日志通道聚合为单一通道。有关构建通道栈的更多信息，请查看[下面的文档](#building-log-stacks)。

### 可用频道驱动

每个日志通道都由"驱动（driver）"提供支持。驱动决定了日志消息实际记录和存储的方式与位置。每个 Laravel 应用都提供以下日志通道驱动。这些驱动中的大多数已在应用的 `config/logging.php` 配置文件中存在对应条目，因此请查看该文件以熟悉其内容：

| Name         | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| `custom`     | 调用指定工厂来创建通道的驱动。                                       |
| `daily`      | 基于 Monolog `RotatingFileHandler` 的驱动，按天轮转。               |
| `monthly`    | 基于 Monolog `RotatingFileHandler` 的驱动，按月轮转。               |
| `errorlog`   | 基于 Monolog `ErrorLogHandler` 的驱动。                             |
| `monolog`    | 一个 Monolog 工厂驱动，可以使用任何受支持的 Monolog 处理器。        |
| `papertrail` | 基于 Monolog `SyslogUdpHandler` 的驱动。                            |
| `single`     | 基于单个文件或路径的日志记录通道（`StreamHandler`）。              |
| `slack`      | 基于 Monolog `SlackWebhookHandler` 的驱动。                         |
| `stack`      | 一个用于创建"多通道"通道的包装器。                                  |
| `syslog`     | 基于 Monolog `SyslogHandler` 的驱动。                               |

> [!NOTE]
> 查看关于[高级通道自定义](#monolog-channel-customization)的文档，了解有关 `monolog` 和 `custom` 驱动的更多信息。

#### 配置频道名称

默认情况下，Monolog 实例化时使用的"通道名称"与当前环境（如 `production` 或 `local`）相匹配。要更改此值，你可以为通道配置添加一个 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

### 频道前置条件

#### 配置 single、daily 与 monthly 频道

`single`、`daily` 和 `monthly` 通道有三个可选配置选项：`bubble`、`permission` 和 `locking`。

| Name         | Description                                                                   | Default |
| ------------ | ----------------------------------------------------------------------------- | ------- |
| `bubble`     | 指示消息被处理后是否应冒泡到其他通道。                                        | `true`  |
| `locking`    | 在写入日志文件前尝试对其加锁。                                                | `false` |
| `permission` | 日志文件的权限。                                                              | `0644`  |

此外，`daily` 和 `monthly` 通道的保留策略可通过 `max_files` 配置选项进行配置。`LOG_DAILY_DAYS` 环境变量也可用于配置 `daily` 通道的保留策略。

#### 配置 Papertrail 频道

`papertrail` 通道需要 `host` 和 `port` 配置选项。这两个值可通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量定义。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

#### 配置 Slack 频道

`slack` 通道需要一个 `url` 配置选项。该值可通过 `LOG_SLACK_WEBHOOK_URL` 环境变量定义。此 URL 应与你为 Slack 团队配置的传入 Webhook 的 URL 相匹配。

默认情况下，Slack 只会接收 `critical` 级别及以上的日志；不过，你可以使用 `LOG_LEVEL` 环境变量，或修改 Slack 日志通道配置数组中的 `level` 配置选项来调整这一行为。

### 记录弃用警告

PHP、Laravel 以及其他库通常会通知用户，它们的一些功能已被废弃，并将在未来的版本中移除。如果你想记录这些废弃警告，可以使用 `LOG_DEPRECATIONS_CHANNEL` 环境变量，或在应用的 `config/logging.php` 配置文件中，指定你偏好的 `deprecations` 日志通道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，你可以定义一个名为 `deprecations` 的日志通道。如果存在以此命名的日志通道，它将被始终用于记录废弃警告：

```php
'channels' => [
    'deprecations' => [
        'driver' => 'single',
        'path' => storage_path('logs/php-deprecation-warnings.log'),
    ],
],
```

## 构建日志堆栈

如前所述，`stack` 驱动让你可以将多个通道组合为一个单一的日志通道，方便使用。为了说明如何使用日志通道栈，我们来看一个生产应用中可能出现的配置示例：

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

我们来分析这个配置。首先，注意我们的 `stack` 通道通过 `channels` 选项聚合了另外两个通道：`syslog` 和 `slack`。因此，在记录消息时，这两个通道都有机会记录该消息。不过，正如我们下面将要看到的，这些通道是否真正记录消息，可能由消息的严重程度 / "级别"决定。

#### 日志级别

请注意上面 `syslog` 和 `slack` 通道配置中的 `level` 配置选项。该选项决定了消息被该通道记录所需的最低"级别"。为 Laravel 日志服务提供支持的 Monolog，提供了 RFC 5424 规范中定义的所有日志级别。按严重程度由高到低排列，这些日志级别依次为：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**。

因此，假设我们使用 `debug` 方法记录一条消息：

```php
Log::debug('An informational message.');
```

根据我们的配置，`syslog` 通道会将消息写入系统日志；然而，由于该错误消息不属于 `critical` 及以上级别，它不会被发送到 Slack。不过，如果我们记录一条 `emergency` 消息，它将被同时发送到系统日志和 Slack，因为 `emergency` 级别高于我们为这两个通道设置的最低级别阈值：

```php
Log::emergency('The system is down!');
```

## 写入日志消息

你可以使用 `Log` Facade 将信息写入日志。如前所述，该记录器提供了 RFC 5424 规范中定义的八个日志级别：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**：

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

你可以调用其中任一方法，为对应的级别记录消息。默认情况下，消息将写入由 `logging` 配置文件配置的默认日志通道：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示指定用户的个人资料。
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

### 上下文信息

可以将一组上下文数据数组传递给日志方法。这些上下文数据将与日志消息一起被格式化并显示：

```php
use Illuminate\Support\Facades\Log;

Log::info('User {id} failed to login.', ['id' => $user->id]);
```

有时，你可能希望指定某些上下文信息，使其包含在特定通道后续的所有日志记录中。例如，你可能希望记录与进入应用的每个请求相关联的请求 ID。为此，你可以调用 `Log` Facade 的 `withContext` 方法：

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

如果你希望在全部日志通道之间共享上下文信息，可以调用 `Log::shareContext()` 方法。该方法会将上下文信息提供给所有已创建的通道，以及之后创建的任何通道：

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

### 写入指定频道

有时你可能希望将消息记录到应用默认通道之外的某个通道。可以使用 `Log` Facade 上的 `channel` 方法，获取配置文件中定义的任意通道并进行记录：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('Something happened!');
```

如果你想创建一个由多个通道组成的按需日志栈，可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('Something happened!');
```

#### 按需频道

也可以通过在运行时提供配置（而无需在应用的 `logging` 配置文件中预先定义该配置）来创建按需通道。为此，你可以将一个配置数组传递给 `Log` Facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('Something happened!');
```

你可能还希望在按需日志栈中包含按需通道。只需将你的按需通道实例加入传给 `stack` 方法的数组中即可实现：

```php
use Illuminate\Support\Facades\Log;

$channel = Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
]);

Log::stack(['slack', $channel])->info('Something happened!');
```

## 自定义 Monolog 频道

### 为频道自定义 Monolog

有时你可能需要完全控制 Monolog 针对某个已有通道的配置方式。例如，你可能想为 Laravel 内置的 `single` 通道配置一个自定义的 Monolog `FormatterInterface` 实现。

首先，在该通道的配置中定义一个 `tap` 数组。`tap` 数组应包含一组类，这些类在 Monolog 实例创建后有机会对其进行自定义（或称"tap 进入"）。这些类没有固定的存放位置，你可以在应用内自由创建一个目录来存放它们：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

配置好通道的 `tap` 选项后，就可以定义用于自定义 Monolog 实例的类了。该类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例会将所有方法调用代理给底层的 Monolog 实例：

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
> 你的所有 "tap" 类都由服务容器（Service Container）解析，因此它们所需的任何构造函数依赖都会被自动注入。

### 创建 Monolog 处理器频道

Monolog 提供了多种可用的处理器（handler），但 Laravel 并未为每个处理器都提供内置通道。在某些情况下，你可能希望创建一个自定义通道，它只是某个特定 Monolog 处理器的实例，而该处理器没有对应的 Laravel 日志驱动。这类通道可以通过 `monolog` 驱动轻松创建。

使用 `monolog` 驱动时，`handler` 配置选项用于指定将实例化哪个处理器。可选地，处理器所需的任何构造函数参数，都可以通过 `handler_with` 配置选项指定：

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

#### Monolog 格式化器

使用 `monolog` 驱动时，Monolog 的 `LineFormatter` 将作为默认格式器（formatter）。不过，你可以使用 `formatter` 和 `formatter_with` 配置选项，自定义传给处理器的格式器类型：

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

如果你使用的 Monolog 处理器能够自行提供格式器，可以将 `formatter` 配置选项的值设为 `default`：

```php
'newrelic' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\NewRelicHandler::class,
    'formatter' => 'default',
],
```

#### Monolog 处理器

Monolog 还可以在记录消息之前对消息进行处理。你可以创建自己的处理器，也可以使用 [Monolog 提供的现有处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果你想为 `monolog` 驱动自定义处理器，可以在通道配置中添加一个 `processors` 配置值：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'handler_with' => [
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

### 通过工厂创建自定义频道

如果你想定义一个完全自定义的通道，并对 Monolog 的实例化与配置拥有完全控制权，可以在 `config/logging.php` 配置文件中指定 `custom` 驱动类型。你的配置应包含一个 `via` 选项，其值为将被调用以创建 Monolog 实例的工厂类名：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

配置好 `custom` 驱动通道后，就可以定义用于创建 Monolog 实例的类了。该类只需要一个 `__invoke` 方法，该方法应返回 Monolog 记录器实例。该方法会接收通道配置数组作为其唯一参数：

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

## 使用 Pail 实时查看日志

你经常需要实时"尾随（tail）"查看应用的日志。例如，在调试问题或监控应用日志中特定类型的错误时。

Laravel Pail 是一个让你能够从命令行直接深入查看 Laravel 应用日志文件的包。与标准的 `tail` 命令不同，Pail 设计为可与任何日志驱动配合使用，包括 Laravel Nightwatch、Sentry 或 Flare。此外，Pail 还提供了一组实用的过滤器，帮助你快速找到所需内容。

<img src="https://laravel.com/img/docs/pail-example.png">

### 安装

> [!WARNING]
> Laravel Pail 需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展。

首先，使用 Composer 包管理器将 Pail 安装到你的项目中：

```shell
composer require --dev laravel/pail
```

### 用法

要开始尾随查看日志，运行 `pail` 命令：

```shell
php artisan pail
```

要增加输出的详细程度并避免截断（…），使用 `-v` 选项：

```shell
php artisan pail -v
```

要获得最大详细程度并显示异常堆栈跟踪，使用 `-vv` 选项：

```shell
php artisan pail -vv
```

要停止尾随查看日志，随时按下 `Ctrl+C`。

### 过滤日志

#### `--filter`

你可以使用 `--filter` 选项，按日志的类型、文件、消息和堆栈跟踪内容进行筛选：

```shell
php artisan pail --filter="QueryException"
```

#### `--message`

要仅按日志的消息进行筛选，可以使用 `--message` 选项：

```shell
php artisan pail --message="User created"
```

#### `--level`

`--level` 选项可用于按日志级别筛选日志：

```shell
php artisan pail --level=error
```

#### `--user`

要仅显示某个给定用户处于已认证状态时所写入的日志，你可以向 `--user` 选项提供该用户的 ID：

```shell
php artisan pail --user=1
```
