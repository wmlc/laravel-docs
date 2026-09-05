# 错误处理

## 简介

当你新建一个 Laravel 项目时，错误和异常处理已经为你配置好了；不过，你可以随时使用应用 `bootstrap/app.php` 中的 `withExceptions` 方法来管理应用如何报告和渲染异常。

传给 `withExceptions` 闭包的 `$exceptions` 对象是 `Illuminate\Foundation\Configuration\Exceptions` 的一个实例，负责管理应用中的异常处理。在本篇文档中，我们会深入探讨这个对象。

## 配置

`config/app.php` 配置文件中的 `debug` 选项决定了向用户实际展示多少错误信息。默认情况下，该选项会被设置为遵从 `APP_DEBUG` 环境变量的值，该变量存储在你的 `.env` 文件中。

在本地开发过程中，你应该将 `APP_DEBUG` 环境变量设置为 `true`。

> [!WARNING]
> 在生产环境中，`APP_DEBUG` 的值应该始终为 `false`。如果在生产环境中将其设置为 `true`，你可能会将敏感配置值暴露给应用的终端用户。

## 处理异常

### 报告异常

在 Laravel 中，异常报告用于将异常记录到日志，或发送到外部服务，例如 [Laravel Nightwatch](https://nightwatch.laravel.com)、[Sentry](https://github.com/getsentry/sentry-laravel) 或 [Flare](https://flareapp.io)。默认情况下，异常会根据你的 [日志](/docs/{{version}}/logging) 配置进行记录。不过，你可以按自己的意愿自由记录异常。

如果你需要以不同的方式报告不同类型的异常，可以在应用的 `bootstrap/app.php` 中使用 `report` 异常方法，注册一个闭包，当某给定类型的异常需要被报告时执行该闭包。Laravel 会通过检查闭包的类型提示来确定该闭包报告的是哪种类型的异常：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

当你使用 `report` 方法注册自定义异常报告回调时，Laravel 仍会使用应用的默认日志配置来记录该异常。如果你希望阻止异常传播到默认的日志栈，可以在定义报告回调时使用 `stop` 方法，或从回调中返回 `false`：

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
> 要为给定异常自定义异常报告，你也可以利用 [可报告异常](/docs/{{version}}/errors#renderable-exceptions)。

#### 全局日志上下文

如果有可用数据，Laravel 会自动将当前用户的 ID 作为上下文数据添加到每条异常的日志消息中。你可以使用应用 `bootstrap/app.php` 文件中的 `context` 异常方法，定义你自己的全局上下文数据。这些信息会被包含在应用写入的每条异常日志消息中：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->context(fn () => [
        'foo' => 'bar',
    ]);
})
```

#### 异常日志上下文

虽然向每条日志消息添加上下文很有用，但有时某个特定的异常可能拥有你希望包含在日志中的独有上下文。通过在应用的一个异常上定义 `context` 方法，你可以指定任何与该异常相关、应该被添加到该异常日志记录中的数据：

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

#### `report` 辅助函数

有时你可能需要报告一个异常，但继续处理当前请求。`report` 辅助函数让你可以快速报告一个异常，而无需向用户渲染错误页面：

```php
public function isValid(string $value): bool
{
    try {
        // 校验该值……
    } catch (Throwable $e) {
        report($e);

        return false;
    }
}
```

#### 去重报告异常

如果你在应用中各处使用了 `report` 函数，有时可能会多次报告同一个异常，从而在日志中产生重复条目。

如果你希望确保某个异常的单个实例只被报告一次，可以在应用的 `bootstrap/app.php` 文件中调用 `dontReportDuplicates` 异常方法：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReportDuplicates();
})
```

这样，当使用同一个异常实例调用 `report` 辅助函数时，只有第一次调用会被报告：

```php
$original = new RuntimeException('Whoops!');

report($original); // 已报告

try {
    throw $original;
} catch (Throwable $caught) {
    report($caught); // 已忽略
}

report($original); // 已忽略
report($caught); // 已忽略
```

### 异常日志级别

当消息被写入应用的 [日志](/docs/{{version}}/logging) 时，消息会以指定的 [日志级别](/docs/{{version}}/logging#log-levels) 写入，该级别表示被记录消息的严重性或重要性。

如上所述，即使你使用 `report` 方法注册了自定义异常报告回调，Laravel 仍会使用应用的默认日志配置来记录异常；然而，由于日志级别有时会影响消息被记录到的通道，你可能会希望配置某些异常记录时的日志级别。

为此，你可以在应用的 `bootstrap/app.php` 文件中使用 `level` 异常方法。该方法接收异常类型作为第一个参数，日志级别作为第二个参数：

```php
use PDOException;
use Psr\Log\LogLevel;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->level(PDOException::class, LogLevel::CRITICAL);
})
```

### 按类型忽略异常

在构建应用时，会有一些你永远不想报告的异常类型。要忽略这些异常，你可以在应用的 `bootstrap/app.php` 文件中使用 `dontReport` 异常方法。传给该方法的任何类都不会被报告；不过，它们仍可能有自定义的渲染逻辑：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReport([
        InvalidOrderException::class,
    ]);
})
```

或者，你也可以直接用 `Illuminate\Contracts\Debug\ShouldntReport` 接口来"标记"一个异常类。当一个异常被标记了该接口后，Laravel 的异常处理器将永远不会报告它：

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

如果你需要更精细地控制何时忽略某种类型的异常，可以向 `dontReportWhen` 方法传入一个闭包：

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

在内部，Laravel 已经为你忽略了一些类型的错误，例如由 404 HTTP 错误导致的异常、由来源不匹配产生的 403 HTTP 响应，或由无效 CSRF 令牌产生的 419 HTTP 响应。如果你希望指示 Laravel 停止忽略某给定类型的异常，可以在应用的 `bootstrap/app.php` 文件中使用 `stopIgnoring` 异常方法：

```php
use Symfony\Component\HttpKernel\Exception\HttpException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->stopIgnoring(HttpException::class);
})
```

### 渲染异常

默认情况下，Laravel 异常处理器会将异常转换为一个 HTTP 响应。不过，你可以自由地为给定类型的异常注册自定义渲染闭包。你可以在应用的 `bootstrap/app.php` 文件中使用 `render` 异常方法来完成这件事。

传给 `render` 方法的闭包应该返回 `Illuminate\Http\Response` 的一个实例，该实例可以通过 `response` 辅助函数生成。Laravel 会通过检查闭包的类型提示来确定该闭包渲染的是哪种类型的异常：

```php
use App\Exceptions\InvalidOrderException;
use Illuminate\Http\Request;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidOrderException $e, Request $request) {
        return response()->view('errors.invalid-order', status: 500);
    });
})
```

你也可以使用 `render` 方法来覆盖内置 Laravel 或 Symfony 异常的渲染行为，例如 `NotFoundHttpException`。如果传给 `render` 方法的闭包没有返回值，将使用 Laravel 默认的异常渲染：

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

#### 将异常渲染为 JSON

在渲染异常时，Laravel 会根据请求的 `Accept` 头，自动判断异常应该渲染为 HTML 还是 JSON 响应。如果你希望自定义 Laravel 判断渲染 HTML 还是 JSON 异常响应的方式，可以使用 `shouldRenderJsonWhen` 方法：

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

#### 自定义异常响应

极少数情况下，你可能需要自定义 Laravel 异常处理器渲染的整个 HTTP 响应。为此，你可以使用 `respond` 方法注册一个响应自定义闭包：

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

### 可报告与可渲染异常

除了在应用的 `bootstrap/app.php` 文件中定义自定义的报告和渲染行为，你也可以直接在应用的异常上定义 `report` 和 `render` 方法。当这些方法存在时，框架会自动调用它们：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvalidOrderException extends Exception
{
    /**
     * 报告该异常。
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

如果你的异常继承自一个已经可渲染的异常（例如内置的 Laravel 或 Symfony 异常），你可以从该异常的 `render` 方法返回 `false`，以渲染该异常的默认 HTTP 响应：

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

如果你的异常包含仅在特定条件下才需要的自定义报告逻辑，你可能需要指示 Laravel 在某些情况下使用默认异常处理配置来报告该异常。为此，你可以从该异常的 `report` 方法返回 `false`：

```php
/**
 * 报告该异常。
 */
public function report(): bool
{
    if (/** 判断该异常是否需要自定义报告 */) {

        // ...

        return true;
    }

    return false;
}
```

> [!NOTE]
> 你可以对 `report` 方法所需的任何依赖进行类型提示，Laravel 的 [服务容器](/docs/{{version}}/container) 会自动将它们注入到该方法中。

### 限制报告异常的频率

如果你的应用报告了大量的异常，你可能会希望对实际被记录或发送到应用外部错误追踪服务的异常数量进行限流。

要对异常进行随机采样，你可以在应用的 `bootstrap/app.php` 文件中使用 `throttle` 异常方法。`throttle` 方法接收一个应返回 `Lottery` 实例的闭包：

```php
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        return Lottery::odds(1, 1000);
    });
})
```

也可以根据异常类型进行条件采样。如果你只想对某个特定异常类的实例进行采样，可以只为该类返回 `Lottery` 实例：

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

你还可以通过返回 `Limit` 实例（而非 `Lottery`）来限制被记录或发送到外部错误追踪服务的异常。如果你希望防止突发的异常洪流淹没你的日志（例如，当应用使用的第三方服务宕机时），这会很有用：

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

默认情况下，限制会使用异常的类作为限流键。你可以通过在 `Limit` 上使用 `by` 方法指定自己的键来自定义这一点：

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

当然，你可以为不同的异常返回 `Lottery` 和 `Limit` 实例的组合：

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

## HTTP 异常

有些异常描述了服务器返回的 HTTP 错误码。例如，这可能是"页面未找到"错误（404）、"未授权"错误（401），甚至是由开发者生成的 500 错误。为了能在应用中的任何位置生成这样的响应，你可以使用 `abort` 辅助函数：

```php
abort(404);
```

### 自定义 HTTP 错误页面

Laravel 让你可以轻松地为各种 HTTP 状态码显示自定义错误页面。例如，要自定义 404 HTTP 状态码的错误页面，请创建一个 `resources/views/errors/404.blade.php` 视图模板。该视图会被用于你的应用生成的所有 404 错误。该目录中的视图应该以其对应的 HTTP 状态码命名。`abort` 函数抛出的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例会作为 `$exception` 变量传递给视图：

```blade
<h2>{{ $exception->getMessage() }}</h2>
```

你可以使用 `vendor:publish` Artisan 命令发布 Laravel 默认的错误页面模板。模板发布后，你就可以按需自定义它们：

```shell
php artisan vendor:publish --tag=laravel-errors
```

#### 兜底 HTTP 错误页面

你还可以为给定的一系列 HTTP 状态码定义一个"兜底"错误页面。当发生的特定 HTTP 状态码没有对应页面时，就会渲染这个页面。为此，请在应用的 `resources/views/errors` 目录中定义一个 `4xx.blade.php` 模板和一个 `5xx.blade.php` 模板。

在定义兜底错误页面时，兜底页面不会影响 `404`、`500` 和 `503` 错误响应，因为 Laravel 为这些状态码提供了内部专用的页面。要自定义为这些状态码渲染的页面，你应该分别为它们各自定义自定义错误页面。
