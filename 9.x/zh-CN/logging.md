# 日志

- [简介](#introduction)
- [配置](#configuration)
    - [可用的通道驱动](#available-channel-drivers)
    - [通道前提条件](#channel-prerequisites)
    - [记录弃用警告](#logging-deprecation-warnings)
- [构建日志堆栈](#building-log-stacks)
- [写入日志消息](#writing-log-messages)
    - [上下文信息](#contextual-information)
    - [写入到指定通道](#writing-to-specific-channels)
- [Monolog 通道自定义](#monolog-channel-customization)
    - [为通道自定义 Monolog](#customizing-monolog-for-channels)
    - [创建 Monolog 处理器通道](#creating-monolog-handler-channels)
    - [通过工厂创建自定义通道](#creating-custom-channels-via-factories)

<a name="introduction"></a>
## 简介

为了帮助你更好地了解应用内部发生的事情，Laravel 提供了强大的日志服务，允许你将消息记录到文件、系统错误日志，甚至发送到 Slack 来通知整个团队。

Laravel 日志基于"通道"（channel）。每个通道代表一种特定的日志信息写入方式。例如，`single` 通道将日志写入到单个日志文件，而 `slack` 通道将日志消息发送到 Slack。日志消息可以根据其严重程度写入到多个通道。

在底层，Laravel 使用了 [Monolog](https://github.com/Seldaek/monolog) 库，该库提供了对各种强大日志处理器的支持。Laravel 让配置这些处理器变得轻而易举，允许你自由组合它们以自定义应用的日志处理方式。

<a name="configuration"></a>
## 配置

应用日志行为的所有配置选项都位于 `config/logging.php` 配置文件中。此文件允许你配置应用的日志通道，因此请务必查看每个可用通道及其选项。下面我们将介绍几个常用选项。

默认情况下，Laravel 在记录日志消息时会使用 `stack` 通道。`stack` 通道用于将多个日志通道聚合为一个通道。有关构建堆栈的更多信息，请查看[下面的文档](#building-log-stacks)。

<a name="configuring-the-channel-name"></a>
#### 配置通道名称

默认情况下，Monolog 在实例化时会使用与当前环境匹配的"通道名称"，例如 `production` 或 `local`。要修改此值，请在通道配置中添加 `name` 选项：

    'stack' => [
        'driver' => 'stack',
        'name' => 'channel-name',
        'channels' => ['single', 'slack'],
    ],

<a name="available-channel-drivers"></a>
### 可用的通道驱动

每个日志通道都由一个"驱动"提供支持。驱动决定了日志消息实际记录的方式和位置。以下日志通道驱动在每个 Laravel 应用中都可用。大多数驱动的配置项已经存在于应用的 `config/logging.php` 配置文件中，因此请务必查看此文件以熟悉其内容：

名称 | 描述
------------- | -------------
`custom` | 调用指定工厂来创建通道的驱动
`daily` | 基于 `RotatingFileHandler` 的 Monolog 驱动，每日轮转
`errorlog` | 基于 `ErrorLogHandler` 的 Monolog 驱动
`monolog` | 可使用任何受支持的 Monolog 处理器的 Monolog 工厂驱动
`null` | 丢弃所有日志消息的驱动
`papertrail` | 基于 `SyslogUdpHandler` 的 Monolog 驱动
`single` | 基于单个文件或路径的日志通道（`StreamHandler`）
`slack` | 基于 `SlackWebhookHandler` 的 Monolog 驱动
`stack` | 用于简化创建"多通道"通道的包装器
`syslog` | 基于 `SyslogHandler` 的 Monolog 驱动

> **Note**
> 查看[高级通道自定义](#monolog-channel-customization)文档，以了解更多关于 `monolog` 和 `custom` 驱动的信息。

<a name="channel-prerequisites"></a>
### 通道前提条件

<a name="configuring-the-single-and-daily-channels"></a>
#### 配置 Single 和 Daily 通道

`single` 和 `daily` 通道有三个可选配置选项：`bubble`、`permission` 和 `locking`。

名称 | 描述 | 默认值
------------- | ------------- | -------------
`bubble` | 指示消息在被处理后是否应冒泡到其他通道 | `true`
`locking` | 在写入日志文件前尝试锁定文件 | `false`
`permission` | 日志文件的权限 | `0644`

此外，`daily` 通道的保留策略可以通过 `days` 选项进行配置：

名称 | 描述 | 默认值
------------- |-------------| -------------
`days` | 每日日志文件保留的天数 | `7`

<a name="configuring-the-papertrail-channel"></a>
#### 配置 Papertrail 通道

`papertrail` 通道需要 `host` 和 `port` 配置选项。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

<a name="configuring-the-slack-channel"></a>
#### 配置 Slack 通道

`slack` 通道需要 `url` 配置选项。此 URL 应与你为 Slack 团队配置的[传入 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) URL 一致。

默认情况下，Slack 只会接收 `critical` 级别及以上的日志；不过，你可以在 `config/logging.php` 配置文件中，通过修改 Slack 日志通道配置数组中的 `level` 配置选项来调整此行为。

<a name="logging-deprecation-warnings"></a>
### 记录弃用警告

PHP、Laravel 和其他库通常会通知用户某些功能已被弃用，并将在未来版本中移除。如果你想记录这些弃用警告，可以在应用的 `config/logging.php` 配置文件中指定首选的 `deprecations` 日志通道：

    'deprecations' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),

    'channels' => [
        ...
    ]

或者，你可以定义一个名为 `deprecations` 的日志通道。如果存在具有此名称的日志通道，它将始终被用于记录弃用警告：

    'channels' => [
        'deprecations' => [
            'driver' => 'single',
            'path' => storage_path('logs/php-deprecation-warnings.log'),
        ],
    ],

<a name="building-log-stacks"></a>
## 构建日志堆栈

如前所述，`stack` 驱动允许你将多个通道组合为一个日志通道以方便使用。为了说明如何使用日志堆栈，让我们看一个生产应用中可能见到的示例配置：

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['syslog', 'slack'],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => 'debug',
        ],

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => 'Laravel Log',
            'emoji' => ':boom:',
            'level' => 'critical',
        ],
    ],

让我们来剖析这个配置。首先，注意我们的 `stack` 通道通过其 `channels` 选项聚合了另外两个通道：`syslog` 和 `slack`。因此，在记录日志消息时，这两个通道都有机会记录该消息。不过，正如我们下面将看到的，这些通道是否实际记录消息可能取决于消息的严重程度 / "级别"。

<a name="log-levels"></a>
#### 日志级别

注意上面示例中 `syslog` 和 `slack` 通道配置上的 `level` 配置选项。此选项决定了消息要被通道记录所必须达到的最低"级别"。为 Laravel 日志服务提供支持的 Monolog 提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的所有日志级别。按严重程度从高到低排列，这些日志级别为：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**。

所以，假设我们使用 `debug` 方法记录一条消息：

    Log::debug('An informational message.');

根据我们的配置，`syslog` 通道会将消息写入系统日志；但是，由于错误消息未达到 `critical` 或更高级别，它不会被发送到 Slack。然而，如果我们记录一条 `emergency` 消息，它将同时被发送到系统日志和 Slack，因为 `emergency` 级别高于两个通道的最低级别阈值：

    Log::emergency('The system is down!');

<a name="writing-log-messages"></a>
## 写入日志消息

你可以使用 `Log` [Facade](/docs/{{version}}/facades) 将信息写入日志。如前所述，日志记录器提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的八个日志级别：**emergency**、**alert**、**critical**、**error**、**warning**、**notice**、**info** 和 **debug**：

    use Illuminate\Support\Facades\Log;

    Log::emergency($message);
    Log::alert($message);
    Log::critical($message);
    Log::error($message);
    Log::warning($message);
    Log::notice($message);
    Log::info($message);
    Log::debug($message);

你可以调用这些方法中的任何一个来记录对应级别的消息。默认情况下，消息将被写入由 `logging` 配置文件配置的默认日志通道：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Models\User;
    use Illuminate\Support\Facades\Log;

    class UserController extends Controller
    {
        /**
         * 显示给定用户的个人资料。
         *
         * @param  int  $id
         * @return \Illuminate\Http\Response
         */
        public function show($id)
        {
            Log::info('Showing the user profile for user: '.$id);

            return view('user.profile', [
                'user' => User::findOrFail($id)
            ]);
        }
    }

<a name="contextual-information"></a>
### 上下文信息

可以向日志方法传递一个包含上下文数据的数组。这些上下文数据将与日志消息一起格式化和显示：

    use Illuminate\Support\Facades\Log;

    Log::info('User failed to login.', ['id' => $user->id]);

有时，你可能希望指定一些上下文信息，使其包含在特定通道中所有后续的日志条目中。例如，你可能希望记录与应用每个传入请求关联的请求 ID。为此，你可以调用 `Log` Facade 的 `withContext` 方法：

    <?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Str;

    class AssignRequestId
    {
        /**
         * 处理传入请求。
         *
         * @param  \Illuminate\Http\Request  $request
         * @param  \Closure  $next
         * @return mixed
         */
        public function handle($request, Closure $next)
        {
            $requestId = (string) Str::uuid();

            Log::withContext([
                'request-id' => $requestId
            ]);

            return $next($request)->header('Request-Id', $requestId);
        }
    }

如果你希望在 _所有_ 日志通道之间共享上下文信息，可以调用 `Log::shareContext()` 方法。此方法会将上下文信息提供给所有已创建的通道以及后续创建的任何通道。通常，`shareContext` 方法应从应用服务提供者（Service Provider）的 `boot` 方法中调用：

    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Str;

    class AppServiceProvider
    {
        /**
         * 引导任何应用服务。
         *
         * @return void
         */
        public function boot()
        {
            Log::shareContext([
                'invocation-id' => (string) Str::uuid(),
            ]);
        }
    }

<a name="writing-to-specific-channels"></a>
### 写入到指定通道

有时你可能希望将消息记录到应用默认通道以外的通道。你可以使用 `Log` Facade 的 `channel` 方法来获取并记录到配置文件中定义的任何通道：

    use Illuminate\Support\Facades\Log;

    Log::channel('slack')->info('Something happened!');

如果你想创建一个由多个通道组成的按需日志堆栈，可以使用 `stack` 方法：

    Log::stack(['single', 'slack'])->info('Something happened!');

<a name="on-demand-channels"></a>
#### 按需通道

也可以通过在运行时提供配置来创建按需通道，而无需将该配置存在于应用的 `logging` 配置文件中。为此，你可以向 `Log` Facade 的 `build` 方法传递一个配置数组：

    use Illuminate\Support\Facades\Log;

    Log::build([
      'driver' => 'single',
      'path' => storage_path('logs/custom.log'),
    ])->info('Something happened!');

你可能还希望将按需通道包含在按需日志堆栈中。这可以通过将按需通道实例包含在传递给 `stack` 方法的数组中来实现：

    use Illuminate\Support\Facades\Log;

    $channel = Log::build([
      'driver' => 'single',
      'path' => storage_path('logs/custom.log'),
    ]);

    Log::stack(['slack', $channel])->info('Something happened!');

<a name="monolog-channel-customization"></a>
## Monolog 通道自定义

<a name="customizing-monolog-for-channels"></a>
### 为通道自定义 Monolog

有时你可能需要完全控制 Monolog 如何为现有通道进行配置。例如，你可能希望为 Laravel 内置的 `single` 通道配置自定义的 Monolog `FormatterInterface` 实现。

首先，在通道配置中定义一个 `tap` 数组。`tap` 数组应包含一系列类的列表，这些类将在 Monolog 实例创建后有机会自定义（或"切入"）该实例。这些类没有约定的存放位置，因此你可以自由地在应用中创建一个目录来存放这些类：

    'single' => [
        'driver' => 'single',
        'tap' => [App\Logging\CustomizeFormatter::class],
        'path' => storage_path('logs/laravel.log'),
        'level' => 'debug',
    ],

在通道上配置了 `tap` 选项后，你就可以定义用于自定义 Monolog 实例的类。此类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例会将所有方法调用代理到底层的 Monolog 实例：

    <?php

    namespace App\Logging;

    use Monolog\Formatter\LineFormatter;

    class CustomizeFormatter
    {
        /**
         * 自定义给定的日志记录器实例。
         *
         * @param  \Illuminate\Log\Logger  $logger
         * @return void
         */
        public function __invoke($logger)
        {
            foreach ($logger->getHandlers() as $handler) {
                $handler->setFormatter(new LineFormatter(
                    '[%datetime%] %channel%.%level_name%: %message% %context% %extra%'
                ));
            }
        }
    }

> **Note**
> 所有 "tap" 类都由[服务容器](/docs/{{version}}/container)解析，因此它们所需的任何构造函数依赖都会被自动注入。

<a name="creating-monolog-handler-channels"></a>
### 创建 Monolog 处理器通道

Monolog 有各种[可用的处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，而 Laravel 并没有为每个处理器都提供内置通道。在某些情况下，你可能希望创建一个自定义通道，它仅仅是某个没有对应 Laravel 日志驱动的 Monolog 处理器实例。这些通道可以使用 `monolog` 驱动轻松创建。

使用 `monolog` 驱动时，`handler` 配置选项用于指定要实例化的处理器。可选地，处理器所需的任何构造函数参数都可以使用 `with` 配置选项来指定：

    'logentries' => [
        'driver'  => 'monolog',
        'handler' => Monolog\Handler\SyslogUdpHandler::class,
        'with' => [
            'host' => 'my.logentries.internal.datahubhost.company.com',
            'port' => '10000',
        ],
    ],

<a name="monolog-formatters"></a>
#### Monolog 格式化器

使用 `monolog` 驱动时，Monolog 的 `LineFormatter` 将被用作默认格式化器。不过，你可以使用 `formatter` 和 `formatter_with` 配置选项来自定义传递给处理器的格式化器类型：

    'browser' => [
        'driver' => 'monolog',
        'handler' => Monolog\Handler\BrowserConsoleHandler::class,
        'formatter' => Monolog\Formatter\HtmlFormatter::class,
        'formatter_with' => [
            'dateFormat' => 'Y-m-d',
        ],
    ],

如果你使用的 Monolog 处理器能够提供自己的格式化器，可以将 `formatter` 配置选项的值设置为 `default`：

    'newrelic' => [
        'driver' => 'monolog',
        'handler' => Monolog\Handler\NewRelicHandler::class,
        'formatter' => 'default',
    ],

<a name="creating-custom-channels-via-factories"></a>
### 通过工厂创建自定义通道

如果你想定义一个完全自定义的通道，让你能够完全控制 Monolog 的实例化和配置，可以在 `config/logging.php` 配置文件中指定 `custom` 驱动类型。你的配置应包含一个 `via` 选项，其中包含将被调用来创建 Monolog 实例的工厂类名称：

    'channels' => [
        'example-custom-channel' => [
            'driver' => 'custom',
            'via' => App\Logging\CreateCustomLogger::class,
        ],
    ],

配置好 `custom` 驱动通道后，你就可以定义用于创建 Monolog 实例的类。此类只需要一个 `__invoke` 方法，该方法应返回 Monolog 日志记录器实例。此方法将接收通道配置数组作为其唯一参数：

    <?php

    namespace App\Logging;

    use Monolog\Logger;

    class CreateCustomLogger
    {
        /**
         * 创建自定义 Monolog 实例。
         *
         * @param  array  $config
         * @return \Monolog\Logger
         */
        public function __invoke(array $config)
        {
            return new Logger(/* ... */);
        }
    }
