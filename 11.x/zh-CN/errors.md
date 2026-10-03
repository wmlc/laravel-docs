# 错误处理

- [简介](#introduction)
- [配置](#configuration)
- [处理异常](#handling-exceptions)
    - [报告异常](#reporting-exceptions)
    - [异常日志级别](#exception-log-levels)
    - [按类型忽略异常](#ignoring-exceptions-by-type)
    - [渲染异常](#rendering-exceptions)
    - [可报告与可渲染的异常](#renderable-exceptions)
- [限制报告异常的频率](#throttling-reported-exceptions)
- [HTTP 异常](#http-exceptions)
    - [自定义 HTTP 错误页面](#custom-http-error-pages)

<a name="introduction"></a>
## 简介

创建新的 Laravel 项目时，错误与异常处理已经为你配置好了。不过，你随时可以在应用的 `bootstrap/app.php` 中使用 `withExceptions` 方法，管理应用如何报告和渲染异常。

传给 `withExceptions` 闭包的 `$exceptions` 对象是 `Illuminate\Foundation\Configuration\Exceptions` 的实例，负责管理你应用中的异常处理。本文档将对该对象做更深入的探讨。

<a name="configuration"></a>
## 配置

`config/app.php` 配置文件中的 `debug` 选项决定实际向用户显示多少错误信息。默认情况下，该选项设置为遵循 `APP_DEBUG` 环境变量的值，该变量存放在你的 `.env` 文件中。

本地开发时，你应把 `APP_DEBUG` 环境变量设为 `true`。**在生产环境中，该值应始终为 `false`。如果在生产环境中把该值设为 `true`，你可能把敏感的配置值暴露给应用的终端用户。**

<a name="handling-exceptions"></a>
## 处理异常

<a name="reporting-exceptions"></a>
### 报告异常

在 Laravel 中，异常报告用于把异常写入日志，或把它们发送到 [Sentry](https://github.com/getsentry/sentry-laravel)、[Flare](https://flareapp.io) 之类的外部服务。默认情况下，异常会根据你的[日志](/docs/{{version}}/logging)配置被记录。不过，你也可以完全按自己的方式记录异常。

如果你需要以不同方式报告不同类型的异常，可以在应用的 `bootstrap/app.php` 中使用 `report` 异常方法，注册一个在给定类型的异常需要被报告时执行的闭包。Laravel 会通过检查闭包的类型提示来判断该闭包报告的是哪种异常：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

使用 `report` 方法注册自定义异常报告回调后，Laravel 仍会按应用的默认日志配置记录该异常。如果希望阻止异常继续传递到默认日志栈，可以在定义报告回调时使用 `stop` 方法，或从回调中返回 `false`：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    })->stop();

    $exceptions->report(function (InvalidOrderException $e) {
        return false;
    });
})
```

> [!NOTE]
> 要为某个异常定制报告方式，你也可以使用[可报告异常](/docs/{{version}}/errors#renderable-exceptions)。

<a name="global-log-context"></a>
#### 全局日志上下文

如果可以获取，Laravel 会自动把当前用户的 ID 作为上下文数据添加到每条异常日志消息中。你可以在应用的 `bootstrap/app.php` 文件中使用 `context` 异常方法定义自己的全局上下文数据。你的应用写出的每条异常日志消息都会包含这些信息：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->context(fn () => [
        'foo' => 'bar',
    ]);
})
```

<a name="exception-log-context"></a>
#### 异常日志上下文

给每条日志消息添加上下文虽然有用，但有时某个特定异常会有你希望纳入日志的唯一上下文。通过在应用的某个异常上定义 `context` 方法，你可以指定与该异常相关的任意数据，并将其添加到异常的日志条目中：

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

有时你可能需要报告异常，同时继续处理当前请求。`report` 辅助函数让你可以快速报告异常，而不必向用户渲染错误页面：

```php
public function isValid(string $value): bool
{
    try {
        // 验证该值……
    } catch (Throwable $e) {
        report($e);

        return false;
    }
}
```

<a name="deduplicating-reported-exceptions"></a>
#### 报告异常去重

如果你在整个应用中都在使用 `report` 函数，偶尔会对同一个异常报告多次，从而在日志中产生重复条目。

如果你希望确保某个异常实例只被报告一次，可以在应用的 `bootstrap/app.php` 文件中调用 `dontReportDuplicates` 异常方法：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReportDuplicates();
})
```

现在，用同一个异常实例调用 `report` 辅助函数时，只有第一次调用会被报告：

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

<a name="exception-log-levels"></a>
### 异常日志级别

消息被写入应用的[日志](/docs/{{version}}/logging)时，会以指定的[日志级别](/docs/{{version}}/logging#log-levels)写入，该级别表示所记录消息的严重程度或重要性。

如上文所述，即使你使用 `report` 方法注册了自定义异常报告回调，Laravel 仍会按应用的默认日志配置记录该异常；不过，由于日志级别有时会影响消息被记录到哪些通道，你可能希望配置特定异常所使用的日志级别。

为此，你可以在应用的 `bootstrap/app.php` 文件中使用 `level` 异常方法。该方法的第一个参数接收异常类型，第二个参数接收日志级别：

```php
use PDOException;
use Psr\Log\LogLevel;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->level(PDOException::class, LogLevel::CRITICAL);
})
```

<a name="ignoring-exceptions-by-type"></a>
### 按类型忽略异常

构建应用时，总会有一些你绝不想报告的异常类型。要忽略这些异常，可以在应用的 `bootstrap/app.php` 文件中使用 `dontReport` 异常方法。传给该方法的任何类都不会被报告；不过，它们仍然可以拥有自定义的渲染逻辑：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReport([
        InvalidOrderException::class,
    ]);
})
```

另外，你也可以直接用 `Illuminate\Contracts\Debug\ShouldntReport` 接口"标记"一个异常类。当异常被该接口标记后，Laravel 的异常处理器就绝不会报告它：

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

在内部，Laravel 已经会替你忽略某些类型的错误，例如由 404 HTTP 错误或无效 CSRF 令牌生成的 419 HTTP 响应所导致的异常。如果你希望指示 Laravel 停止忽略某种类型的异常，可以在应用的 `bootstrap/app.php` 文件中使用 `stopIgnoring` 异常方法：

```php
use Symfony\Component\HttpKernel\Exception\HttpException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->stopIgnoring(HttpException::class);
})
```

<a name="rendering-exceptions"></a>
### 渲染异常

默认情况下，Laravel 的异常处理器会把异常转换为 HTTP 响应。不过，你也可以为给定类型的异常注册自定义渲染闭包。为此，你可以在应用的 `bootstrap/app.php` 文件中使用 `render` 异常方法。

传给 `render` 方法的闭包应当返回一个 `Illuminate\Http\Response` 实例，可以通过 `response` 辅助函数生成。Laravel 会通过检查闭包的类型提示来判断该闭包渲染的是哪种异常：

```php
use App\Exceptions\InvalidOrderException;
use Illuminate\Http\Request;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (InvalidOrderException $e, Request $request) {
        return response()->view('errors.invalid-order', status: 500);
    });
})
```

你也可以使用 `render` 方法覆盖 Laravel 或 Symfony 内置异常（如 `NotFoundHttpException`）的渲染行为。如果传给 `render` 方法的闭包没有返回值，则会使用 Laravel 默认的异常渲染方式：

```php
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

->withExceptions(function (Exceptions $exceptions) {
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
#### 以 JSON 渲染异常

渲染异常时，Laravel 会根据请求的 `Accept` 头自动判断该异常应当以 HTML 还是 JSON 响应渲染。如果你想自定义 Laravel 判断渲染 HTML 还是 JSON 异常响应的方式，可以使用 `shouldRenderJsonWhen` 方法：

```php
use Illuminate\Http\Request;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
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

极少数情况下，你可能需要自定义 Laravel 异常处理器渲染的整个 HTTP 响应。为此，你可以使用 `respond` 方法注册一个响应定制闭包：

```php
use Symfony\Component\HttpFoundation\Response;

->withExceptions(function (Exceptions $exceptions) {
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
### 可报告与可渲染的异常

你不必在应用的 `bootstrap/app.php` 文件中定义自定义的报告与渲染行为，也可以直接在应用的异常上定义 `report` 和 `render` 方法。一旦存在这些方法，框架就会自动调用它们：

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

如果你的异常继承自一个本身已经可渲染的异常（例如 Laravel 或 Symfony 的内置异常），你可以从该异常的 `render` 方法返回 `false`，以渲染该异常的默认 HTTP 响应：

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

如果你的异常包含仅在满足特定条件时才需要生效的自定义报告逻辑，你可能需要指示 Laravel 在某些情况下使用默认的异常处理配置来报告该异常。为此，你可以从该异常的 `report` 方法返回 `false`：

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
> 你可以对 `report` 方法所需的任何依赖添加类型提示，Laravel 的[服务容器](/docs/{{version}}/container)会自动把它们注入该方法。

<a name="throttling-reported-exceptions"></a>
### 限制报告异常的频率

如果你的应用报告了大量异常，你可能希望对实际被记录或发送到应用外部错误追踪服务的异常数量进行限制。

要按随机采样率处理异常，可以在应用的 `bootstrap/app.php` 文件中使用 `throttle` 异常方法。`throttle` 方法接收一个闭包，该闭包应返回一个 `Lottery` 实例：

```php
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        return Lottery::odds(1, 1000);
    });
})
```

你也可以根据异常类型进行条件采样。如果只想对某个特定异常类的实例进行采样，可以仅为该类返回 `Lottery` 实例：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof ApiMonitoringException) {
            return Lottery::odds(1, 1000);
        }
    });
})
```

你也可以返回 `Limit` 实例而不是 `Lottery`，对被记录或发送到外部错误追踪服务的异常做速率限制。如果你想防止异常突然激增而淹没日志，这会很有用，例如你的应用所用的某个第三方服务宕机时：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300);
        }
    });
})
```

默认情况下，限流会使用异常的类作为限流键。你可以使用 `Limit` 上的 `by` 方法指定自己的键来自定义这一点：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300)->by($e->getMessage());
        }
    });
})
```

当然，你也可以针对不同异常返回 `Lottery` 与 `Limit` 实例的混合结果：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions) {
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

有些异常描述来自服务器的 HTTP 错误码。例如，这可能是"页面未找到"错误（404）、"未授权错误"（401），甚至是开发者生成的 500 错误。要在应用中的任何位置生成此类响应，可以使用 `abort` 辅助函数：

```php
abort(404);
```

<a name="custom-http-error-pages"></a>
### 自定义 HTTP 错误页面

Laravel 让为各种 HTTP 状态码显示自定义错误页面变得非常容易。例如，要自定义 404 HTTP 状态码的错误页面，请创建 `resources/views/errors/404.blade.php` 视图模板。你的应用生成的所有 404 错误都会渲染该视图。该目录中的视图应当命名得与其对应的 HTTP 状态码一致。`abort` 函数抛出的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例会作为 `$exception` 变量传给视图：

```blade
<h2>{{ $exception->getMessage() }}</h2>
```

你可以使用 `vendor:publish` Artisan 命令发布 Laravel 默认的错误页面模板。模板发布后，你就可以按自己的喜好自定义它们：

```shell
php artisan vendor:publish --tag=laravel-errors
```

<a name="fallback-http-error-pages"></a>
#### 回退 HTTP 错误页面

你还可以为一系列 HTTP 状态码定义一个"回退"错误页面。当某个具体 HTTP 状态码没有对应的页面时，就会渲染该页面。为此，请在应用的 `resources/views/errors` 目录中定义 `4xx.blade.php` 模板和 `5xx.blade.php` 模板。

定义回退错误页面时，回退页面不会影响 `404`、`500` 和 `503` 错误响应，因为 Laravel 为这些状态码提供了内部的专用页面。要自定义这些状态码所渲染的页面，你应当分别为每个状态码定义一个自定义错误页面。
