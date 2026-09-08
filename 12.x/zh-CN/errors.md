# 错误处理

- [简介](#introduction)
- [配置](#configuration)
- [异常处理](#handling-exceptions)
    - [异常上报](#reporting-exceptions)
    - [异常日志级别](#exception-log-levels)
    - [按类型忽略异常](#ignoring-exceptions-by-type)
    - [异常渲染](#rendering-exceptions)
    - [可上报与可渲染的异常](#renderable-exceptions)
- [上报异常的限流](#throttling-reported-exceptions)
- [HTTP 异常](#http-exceptions)
    - [自定义 HTTP 错误页面](#custom-http-error-pages)

<a name="introduction"></a>
## 简介

当你新建一个 Laravel 项目时，错误和异常处理已经为你配置好了；不过，你随时可以使用应用 `bootstrap/app.php` 中的 `withExceptions` 方法，来管理应用如何上报和渲染异常。

传递给 `withExceptions` 闭包的 `$exceptions` 对象是 `Illuminate\Foundation\Configuration\Exceptions` 的实例，负责管理应用中的异常处理。我们将在本文档中深入了解这个对象。

<a name="configuration"></a>
## 配置

`config/app.php` 配置文件中的 `debug` 选项决定了实际向用户显示多少错误信息。默认情况下，该选项会遵循存储在 `.env` 文件中的 `APP_DEBUG` 环境变量的值。

在本地开发环境中，你应当将 `APP_DEBUG` 环境变量设置为 `true`。

> [!WARNING]
> 在生产环境中，`APP_DEBUG` 的值应当始终为 `false`。如果在生产环境中将其设置为 `true`，就有可能将敏感的配置值暴露给应用的最终用户。

<a name="handling-exceptions"></a>
## 异常处理

<a name="reporting-exceptions"></a>
### 异常上报

在 Laravel 中，异常上报用于将异常记录到日志，或将其发送到 [Sentry](https://github.com/getsentry/sentry-laravel)、[Flare](https://flareapp.io) 等外部服务。默认情况下，异常会根据你的[日志](/docs/{{version}}/logging)配置进行记录。不过，你也可以按自己的意愿来记录异常。

如果需要以不同方式上报不同类型的异常，可以使用应用 `bootstrap/app.php` 中的 `report` 异常方法，注册一个在需要上报给定类型异常时执行的闭包。Laravel 会通过检查闭包的类型提示来确定该闭包要上报的异常类型：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

当你使用 `report` 方法注册自定义的异常上报回调时，Laravel 仍会按照应用的默认日志配置记录该异常。如果想阻止异常继续传播到默认日志堆栈，可以在定义上报回调时使用 `stop` 方法，或在回调中返回 `false`：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    })->stop();

    $exceptions->report(function (InvalidOrderException $e) {
        return false;
    });
})
```

> [!NOTE]
> 要自定义给定异常的上报行为，也可以使用[可上报异常](/docs/{{version}}/errors#renderable-exceptions)。

<a name="global-log-context"></a>
#### 全局日志上下文

如果可以获取到当前用户，Laravel 会自动将其用户 ID 作为上下文数据添加到每一条异常日志消息中。你可以使用应用 `bootstrap/app.php` 文件中的 `context` 异常方法来定义自己的全局上下文数据。这些信息会被包含在应用写入的每一条异常日志消息中：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->context(fn () => [
        'foo' => 'bar',
    ]);
})
```

<a name="exception-log-context"></a>
#### 异常日志上下文

为每条日志消息添加上下文固然有用，但有时某个特定异常可能包含你希望写入日志的独特上下文。通过在应用的某个异常类上定义 `context` 方法，你可以指定与该异常相关、且应被添加到其日志条目中的任何数据：

```php
<?php

namespace App\Exceptions;

use Exception;

class InvalidOrderException extends Exception
{
    // ...

    /**
     * 获取异常的上下文信息。
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return ['order_id' => $this->orderId];
    }
}
```

<a name="the-report-helper"></a>
#### `report` 辅助函数

有时你可能需要上报一个异常，但同时又继续处理当前请求。`report` 辅助函数让你能够快速上报异常，而无需向用户渲染错误页面：

```php
public function isValid(string $value): bool
{
    try {
        // 验证该值...
    } catch (Throwable $e) {
        report($e);

        return false;
    }
}
```

<a name="deduplicating-reported-exceptions"></a>
#### 上报异常去重

如果你在整个应用中都使用 `report` 函数，有时可能会多次上报同一个异常，从而在日志中产生重复条目。

如果想确保同一个异常实例只被上报一次，可以在应用的 `bootstrap/app.php` 文件中调用 `dontReportDuplicates` 异常方法：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReportDuplicates();
})
```

这样，当 `report` 辅助函数被传入同一个异常实例多次调用时，只有第一次调用会被上报：

```php
$original = new RuntimeException('Whoops!');

report($original); // 已上报

try {
    throw $original;
} catch (Throwable $caught) {
    report($caught); // 被忽略
}

report($original); // 被忽略
report($caught); // 被忽略
```

<a name="exception-log-levels"></a>
### 异常日志级别

当消息被写入应用的[日志](/docs/{{version}}/logging)时，会以指定的[日志级别](/docs/{{version}}/logging#log-levels)写入，该级别表明所记录消息的严重程度或重要程度。

如上文所述，即使你使用 `report` 方法注册了自定义的异常上报回调，Laravel 仍会按照应用的默认日志配置记录该异常；不过，由于日志级别有时会影响消息被记录到哪些通道，你可能希望为某些异常配置它们的记录级别。

为此，可以使用应用 `bootstrap/app.php` 文件中的 `level` 异常方法。该方法第一个参数为异常类型，第二个参数为日志级别：

```php
use PDOException;
use Psr\Log\LogLevel;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->level(PDOException::class, LogLevel::CRITICAL);
})
```

<a name="ignoring-exceptions-by-type"></a>
### 按类型忽略异常

在构建应用时，总有一些异常类型是你永远不想上报的。要忽略这些异常，可以使用应用 `bootstrap/app.php` 文件中的 `dontReport` 异常方法。传给该方法的任何类都不会被上报；不过，它们仍然可以拥有自定义的渲染逻辑：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReport([
        InvalidOrderException::class,
    ]);
})
```

此外，你也可以直接用 `Illuminate\Contracts\Debug\ShouldntReport` 接口来"标记"一个异常类。被该接口标记的异常，将永远不会被 Laravel 的异常处理器上报：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Contracts\Debug\ShouldntReport;

class PodcastProcessingException extends Exception implements ShouldntReport
{
    //
}
```

如果需要对某类异常何时被忽略做更精细的控制，可以向 `dontReportWhen` 方法传入一个闭包：

```php
use App\Exceptions\InvalidOrderException;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReportWhen(function (Throwable $e) {
        return $e instanceof PodcastProcessingException &&
               $e->reason() === 'Subscription expired';
    });
})
```

在内部，Laravel 已经为你忽略了一些类型的错误，例如由 404 HTTP 错误或无效 CSRF 令牌导致的 419 HTTP 响应所产生的异常。如果你希望 Laravel 不再忽略某类异常，可以使用应用 `bootstrap/app.php` 文件中的 `stopIgnoring` 异常方法：

```php
use Symfony\Component\HttpKernel\Exception\HttpException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->stopIgnoring(HttpException::class);
})
```

<a name="rendering-exceptions"></a>
### 异常渲染

默认情况下，Laravel 的异常处理器会将异常转换为 HTTP 响应。不过，你也可以为给定类型的异常注册自定义的渲染闭包。这可以通过应用 `bootstrap/app.php` 文件中的 `render` 异常方法来实现。

传递给 `render` 方法的闭包应当返回一个 `Illuminate\Http\Response` 实例，该实例可以通过 `response` 辅助函数生成。Laravel 会通过检查闭包的类型提示来确定该闭包要渲染的异常类型：

```php
use App\Exceptions\InvalidOrderException;
use Illuminate\Http\Request;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidOrderException $e, Request $request) {
        return response()->view('errors.invalid-order', status: 500);
    });
})
```

你也可以使用 `render` 方法来覆盖 Laravel 或 Symfony 内置异常（例如 `NotFoundHttpException`）的渲染行为。如果传给 `render` 方法的闭包没有返回值，Laravel 将使用默认的异常渲染方式：

```php
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Record not found.'
            ], 404);
        }
    });
})
```

<a name="rendering-exceptions-as-json"></a>
#### 将异常渲染为 JSON

渲染异常时，Laravel 会根据请求的 `Accept` 请求头自动判断该异常应当渲染为 HTML 响应还是 JSON 响应。如果你想自定义 Laravel 判断渲染 HTML 还是 JSON 异常响应的方式，可以使用 `shouldRenderJsonWhen` 方法：

```php
use Illuminate\Http\Request;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
        if ($request->is('admin/*')) {
            return true;
        }

        return $request->expectsJson();
    });
})
```

<a name="customizing-the-exception-response"></a>
#### 自定义异常响应

在极少数情况下，你可能需要自定义 Laravel 异常处理器渲染的整个 HTTP 响应。为此，你可以使用 `respond` 方法注册一个响应自定义闭包：

```php
use Symfony\Component\HttpFoundation\Response;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->respond(function (Response $response) {
        if ($response->getStatusCode() === 419) {
            return back()->with([
                'message' => 'The page expired, please try again.',
            ]);
        }

        return $response;
    });
})
```

<a name="renderable-exceptions"></a>
### 可上报与可渲染的异常

除了在应用的 `bootstrap/app.php` 文件中定义自定义的上报和渲染行为之外，你还可以直接在应用的异常类上定义 `report` 和 `render` 方法。当这些方法存在时，框架会自动调用它们：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvalidOrderException extends Exception
{
    /**
     * 上报该异常。
     */
    public function report(): void
    {
        // ...
    }

    /**
     * 将该异常渲染为 HTTP 响应。
     */
    public function render(Request $request): Response
    {
        return response(/* ... */);
    }
}
```

如果你的异常继承自一个本身已可渲染的异常（例如 Laravel 或 Symfony 的内置异常），可以在异常的 `render` 方法中返回 `false`，以渲染该异常默认的 HTTP 响应：

```php
/**
 * 将该异常渲染为 HTTP 响应。
 */
public function render(Request $request): Response|bool
{
    if (/** 判断该异常是否需要自定义渲染 */) {

        return response(/* ... */);
    }

    return false;
}
```

如果你的异常包含仅在满足特定条件时才需要的自定义上报逻辑，你可能需要让 Laravel 有时按照默认的异常处理配置来上报该异常。为此，可以在异常的 `report` 方法中返回 `false`：

```php
/**
 * 上报该异常。
 */
public function report(): bool
{
    if (/** 判断该异常是否需要自定义上报 */) {

        // ...

        return true;
    }

    return false;
}
```

> [!NOTE]
> 你可以为 `report` 方法声明任何所需的依赖类型提示，Laravel 的[服务容器](/docs/{{version}}/container)会自动将它们注入到该方法中。

<a name="throttling-reported-exceptions"></a>
### 上报异常的限流

如果你的应用上报了非常大量的异常，你可能希望对实际记录到日志或发送到外部错误跟踪服务的异常数量进行限流。

要对异常进行随机采样，可以使用应用 `bootstrap/app.php` 文件中的 `throttle` 异常方法。`throttle` 方法接收一个应当返回 `Lottery` 实例的闭包：

```php
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        return Lottery::odds(1, 1000);
    });
})
```

也可以基于异常类型进行条件采样。如果只想对特定异常类的实例进行采样，可以只针对该类返回 `Lottery` 实例：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof ApiMonitoringException) {
            return Lottery::odds(1, 1000);
        }
    });
})
```

你还可以返回 `Limit` 实例来代替 `Lottery`，对记录到日志或发送到外部错误跟踪服务的异常进行频率限制。当你想防止异常突发达量涌入日志时，这会很有用。例如，应用使用的某个第三方服务宕机时：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300);
        }
    });
})
```

默认情况下，限流会使用异常的类名作为限流键。你可以通过 `Limit` 上的 `by` 方法指定自己的键来自定义这一行为：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300)->by($e->getMessage());
        }
    });
})
```

当然，你也可以针对不同的异常返回 `Lottery` 和 `Limit` 实例的混合：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        return match (true) {
            $e instanceof BroadcastException => Limit::perMinute(300),
            $e instanceof ApiMonitoringException => Lottery::odds(1, 1000),
            default => Limit::none(),
        };
    });
})
```

<a name="http-exceptions"></a>
## HTTP 异常

有些异常描述的是来自服务器的 HTTP 错误码。例如，可能是"页面未找到"错误（404）、"未授权错误"（401），甚至是开发者生成的 500 错误。为了在应用的任何位置生成这样的响应，你可以使用 `abort` 辅助函数：

```php
abort(404);
```

<a name="custom-http-error-pages"></a>
### 自定义 HTTP 错误页面

Laravel 让你可以轻松为各种 HTTP 状态码显示自定义错误页面。例如，要自定义 404 HTTP 状态码的错误页面，只需创建一个 `resources/views/errors/404.blade.php` 视图模板。应用产生的所有 404 错误都会渲染该视图。此目录下的视图文件名应当与对应的 HTTP 状态码一致。`abort` 函数抛出的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例会作为 `$exception` 变量传递给该视图：

```blade
<h2>{{ $exception->getMessage() }}</h2>
```

你可以使用 `vendor:publish` Artisan 命令发布 Laravel 的默认错误页模板。模板发布后，你可以按自己的喜好进行自定义：

```shell
php artisan vendor:publish --tag=laravel-errors
```

<a name="fallback-http-error-pages"></a>
#### HTTP 错误回退页面

你还可以为某一组 HTTP 状态码定义一个"回退"（fallback）错误页面。当发生的特定 HTTP 状态码没有对应的错误页面时，就会渲染该回退页面。为此，请在应用的 `resources/views/errors` 目录下定义一个 `4xx.blade.php` 模板和一个 `5xx.blade.php` 模板。

需要注意的是，定义回退错误页面不会影响 `404`、`500` 和 `503` 错误响应，因为 Laravel 为这些状态码内置了专用页面。要自定义这些状态码的渲染页面，你应当为它们分别单独定义自定义错误页面。
