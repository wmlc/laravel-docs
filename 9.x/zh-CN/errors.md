# 错误处理

- [简介](#introduction)
- [配置](#configuration)
- [异常处理器](#the-exception-handler)
    - [上报异常](#reporting-exceptions)
    - [异常日志级别](#exception-log-levels)
    - [按类型忽略异常](#ignoring-exceptions-by-type)
    - [渲染异常](#rendering-exceptions)
    - [可上报与可渲染异常](#renderable-exceptions)
- [HTTP 异常](#http-exceptions)
    - [自定义 HTTP 错误页面](#custom-http-error-pages)

<a name="introduction"></a>
## 简介

当你启动一个新的 Laravel 项目时，错误和异常处理已经为你配置好了。`App\Exceptions\Handler` 类负责记录应用抛出的所有异常，并将其渲染给用户。本文档将深入介绍这个类。

<a name="configuration"></a>
## 配置

`config/app.php` 配置文件中的 `debug` 选项决定了向用户实际显示多少错误信息。默认情况下，该选项取自 `.env` 文件中的 `APP_DEBUG` 环境变量。

在本地开发环境中，应将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，该值必须始终为 `false`。如果在生产环境中设置为 `true`，可能会将敏感的配置值暴露给应用的最终用户。**

<a name="the-exception-handler"></a>
## 异常处理器

<a name="reporting-exceptions"></a>
### 上报异常

所有异常都由 `App\Exceptions\Handler` 类处理。该类包含一个 `register` 方法，可在其中注册自定义的异常上报和渲染回调。我们将逐一详解这些概念。异常上报用于记录异常或将其发送到外部服务，例如 [Flare](https://flareapp.io)、[Bugsnag](https://bugsnag.com) 或 [Sentry](https://github.com/getsentry/sentry-laravel)。默认情况下，异常会根据你的[日志](/docs/{{version}}/logging)配置进行记录。不过，你也可以按自己的方式记录异常。

例如，如果需要以不同方式上报不同类型的异常，可以使用 `reportable` 方法注册一个闭包，当需要上报指定类型的异常时执行该闭包。Laravel 会通过检查闭包的类型提示来推断闭包所上报的异常类型：

    use App\Exceptions\InvalidOrderException;

    /**
     * 为应用注册异常处理回调。
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (InvalidOrderException $e) {
            //
        });
    }

使用 `reportable` 方法注册自定义异常上报回调时，Laravel 仍会按照应用默认的日志配置记录异常。如果希望阻止异常传播到默认日志栈，可以在定义上报回调时使用 `stop` 方法，或从回调中返回 `false`：

    $this->reportable(function (InvalidOrderException $e) {
        //
    })->stop();

    $this->reportable(function (InvalidOrderException $e) {
        return false;
    });

> **Note**
> 如需自定义特定异常的上报方式，也可以使用[可上报异常](/docs/{{version}}/errors#renderable-exceptions)。

<a name="global-log-context"></a>
#### 全局日志上下文

如果可用，Laravel 会自动将当前用户的 ID 作为上下文数据添加到每条异常日志消息中。你可以通过覆盖应用的 `App\Exceptions\Handler` 类中的 `context` 方法定义自己的全局上下文数据。这些信息会包含在应用写入的每条异常日志消息中：

    /**
     * 获取日志的默认上下文变量。
     *
     * @return array
     */
    protected function context()
    {
        return array_merge(parent::context(), [
            'foo' => 'bar',
        ]);
    }

<a name="exception-log-context"></a>
#### 异常日志上下文

虽然为每条日志消息添加上下文很有用，但有时某个特定异常可能具有你希望包含在日志中的独特上下文。通过在应用的自定义异常上定义 `context` 方法，可以指定与该异常相关且应添加到异常日志条目中的数据：

    <?php

    namespace App\Exceptions;

    use Exception;

    class InvalidOrderException extends Exception
    {
        // ...

        /**
         * 获取异常的上下文信息。
         *
         * @return array
         */
        public function context()
        {
            return ['order_id' => $this->orderId];
        }
    }

<a name="the-report-helper"></a>
#### `report` 辅助函数

有时你可能需要上报异常但仍继续处理当前请求。`report` 辅助函数允许你通过异常处理器快速上报异常，而无需向用户渲染错误页面：

    public function isValid($value)
    {
        try {
            // 验证该值...
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }

<a name="exception-log-levels"></a>
### 异常日志级别

当消息写入应用的[日志](/docs/{{version}}/logging)时，会以指定的[日志级别](/docs/{{version}}/logging#log-levels)写入，该级别表示所记录消息的严重程度或重要性。

如上所述，即使使用 `reportable` 方法注册了自定义异常上报回调，Laravel 仍会按照应用默认的日志配置记录异常；不过，由于日志级别有时会影响消息记录到哪些通道，你可能希望配置某些异常记录时所采用的日志级别。

为此，可以在应用异常处理器的 `$levels` 属性中定义异常类型及其关联日志级别的数组：

    use PDOException;
    use Psr\Log\LogLevel;

    /**
     * 异常类型及其对应自定义日志级别的列表。
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        PDOException::class => LogLevel::CRITICAL,
    ];

<a name="ignoring-exceptions-by-type"></a>
### 按类型忽略异常

在构建应用时，某些类型的异常你可能只想忽略且永不上报。应用的异常处理器包含一个 `$dontReport` 属性，初始化为空数组。添加到该属性的任何类都不会被上报；不过，它们仍可能具有自定义渲染逻辑：

    use App\Exceptions\InvalidOrderException;

    /**
     * 不上报的异常类型列表。
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        InvalidOrderException::class,
    ];

> **Note**
> 在底层，Laravel 已经为你忽略了某些类型的错误，例如由 404 HTTP "not found" 错误或由无效 CSRF 令牌生成的 419 HTTP 响应所导致的异常。

<a name="rendering-exceptions"></a>
### 渲染异常

默认情况下，Laravel 异常处理器会为你将异常转换为 HTTP 响应。不过，你可以自由地为指定类型的异常注册自定义渲染闭包。可以通过异常处理器的 `renderable` 方法实现。

传递给 `renderable` 方法的闭包应返回一个 `Illuminate\Http\Response` 实例，可以通过 `response` 辅助函数生成。Laravel 会通过检查闭包的类型提示来推断闭包所渲染的异常类型：

    use App\Exceptions\InvalidOrderException;

    /**
     * 为应用注册异常处理回调。
     *
     * @return void
     */
    public function register()
    {
        $this->renderable(function (InvalidOrderException $e, $request) {
            return response()->view('errors.invalid-order', [], 500);
        });
    }

你也可以使用 `renderable` 方法覆盖内置 Laravel 或 Symfony 异常（如 `NotFoundHttpException`）的渲染行为。如果传递给 `renderable` 方法的闭包未返回值，将使用 Laravel 默认的异常渲染：

    use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

    /**
     * 为应用注册异常处理回调。
     *
     * @return void
     */
    public function register()
    {
        $this->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Record not found.'
                ], 404);
            }
        });
    }

<a name="renderable-exceptions"></a>
### 可上报与可渲染异常

与其在异常处理器的 `register` 方法中对异常进行类型检查，不如直接在自定义异常上定义 `report` 和 `render` 方法。当这些方法存在时，框架会自动调用它们：

    <?php

    namespace App\Exceptions;

    use Exception;

    class InvalidOrderException extends Exception
    {
        /**
         * 上报异常。
         *
         * @return bool|null
         */
        public function report()
        {
            //
        }

        /**
         * 将异常渲染为 HTTP 响应。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function render($request)
        {
            return response(/* ... */);
        }
    }

如果你的异常继承自一个已经可渲染的异常（例如内置的 Laravel 或 Symfony 异常），可以从异常的 `render` 方法返回 `false`，以渲染该异常的默认 HTTP 响应：

    /**
     * 将异常渲染为 HTTP 响应。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function render($request)
    {
        // 判断异常是否需要自定义渲染...

        return false;
    }

如果你的异常包含仅在满足特定条件时才必要的自定义上报逻辑，可能需要指示 Laravel 有时使用默认异常处理配置上报异常。为此，可以从异常的 `report` 方法返回 `false`：

    /**
     * 上报异常。
     *
     * @return bool|null
     */
    public function report()
    {
        // 判断异常是否需要自定义上报...

        return false;
    }

> **Note**
> 你可以对 `report` 方法所需的任何依赖进行类型提示，Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)会自动将其注入到方法中。

<a name="http-exceptions"></a>
## HTTP 异常

某些异常用于描述来自服务器的 HTTP 错误码。例如，可能是 "page not found" 错误（404）、"unauthorized error"（401），甚至是开发者生成的 500 错误。为了在应用的任意位置生成此类响应，可以使用 `abort` 辅助函数：

    abort(404);

<a name="custom-http-error-pages"></a>
### 自定义 HTTP 错误页面

Laravel 让你能够轻松地为各种 HTTP 状态码显示自定义错误页面。例如，如果希望自定义 404 HTTP 状态码的错误页面，可以创建一个 `resources/views/errors/404.blade.php` 视图模板。该视图会在应用生成的所有 404 错误中渲染。此目录下的视图应以其对应的 HTTP 状态码命名。`abort` 函数抛出的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例会作为 `$exception` 变量传递给视图：

    <h2>{{ $exception->getMessage() }}</h2>

你可以使用 `vendor:publish` Artisan 命令发布 Laravel 的默认错误页面模板。模板发布后，即可按自己的喜好进行自定义：

```shell
php artisan vendor:publish --tag=laravel-errors
```

<a name="fallback-http-error-pages"></a>
#### 后备 HTTP 错误页面

你还可以为一系列 HTTP 状态码定义"后备"错误页面。当发生的特定 HTTP 状态码没有对应页面时，将渲染此后备页面。为此，在应用的 `resources/views/errors` 目录中定义一个 `4xx.blade.php` 模板和一个 `5xx.blade.php` 模板即可。
