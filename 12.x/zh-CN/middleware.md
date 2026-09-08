# 中间件

- [简介](#introduction)
- [定义中间件](#defining-middleware)
- [注册中间件](#registering-middleware)
    - [全局中间件](#global-middleware)
    - [为路由分配中间件](#assigning-middleware-to-routes)
    - [中间件组](#middleware-groups)
    - [中间件别名](#middleware-aliases)
    - [中间件排序](#sorting-middleware)
- [中间件参数](#middleware-parameters)
- [可终止中间件](#terminable-middleware)

<a name="introduction"></a>
## 简介

中间件（Middleware）为过滤进入应用的 HTTP 请求提供了一套便捷的机制。例如，Laravel 内置了一个验证用户是否已认证的中间件。如果用户未通过认证，该中间件会将用户重定向到应用的登录页面；反之，如果用户已通过认证，中间件则会放行请求，使其继续进入应用。

除了认证之外，还可以编写中间件来执行各种其他任务。例如，一个日志中间件可以将进入应用的所有请求记录到日志。Laravel 内置了多种中间件，包括用于认证和 CSRF 防护的中间件；不过，所有用户自定义的中间件通常都位于应用的 `app/Http/Middleware` 目录下。

<a name="defining-middleware"></a>
## 定义中间件

要创建一个新的中间件，请使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

该命令会在 `app/Http/Middleware` 目录下生成一个新的 `EnsureTokenIsValid` 类。在这个中间件中，只有当传入的 `token` 输入与指定值匹配时，我们才允许访问该路由；否则，我们会将用户重定向回 `/home` URI：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->input('token') !== 'my-secret-token') {
            return redirect('/home');
        }

        return $next($request);
    }
}
```

如你所见，如果给定的 `token` 与我们的密钥令牌不匹配，中间件就会向客户端返回一个 HTTP 重定向；否则，请求会被继续传递到应用深处。要让请求继续深入应用（也就是让中间件"放行"），你应当将 `$request` 传给 `$next` 回调。

最好把中间件想象成 HTTP 请求在到达应用之前必须穿过的一系列"层"。每一层都可以检查请求，甚至完全拒绝它。

> [!NOTE]
> 所有中间件都通过[服务容器（Service Container）](/docs/{{version}}/container)解析，因此你可以在中间件的构造函数中声明任何所需依赖的类型提示。

<a name="middleware-and-responses"></a>
#### 中间件与响应

当然，中间件既可以在请求深入应用之前执行任务，也可以在之后执行。例如，下面的中间件会在应用处理请求**之前**执行某个任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 执行操作

        return $next($request);
    }
}
```

而这个中间件会在应用处理请求**之后**执行其任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 执行操作

        return $response;
    }
}
```

<a name="registering-middleware"></a>
## 注册中间件

<a name="global-middleware"></a>
### 全局中间件

如果你希望某个中间件在应用的每个 HTTP 请求期间都运行，可以将它追加到应用 `bootstrap/app.php` 文件中的全局中间件堆栈：

```php
use App\Http\Middleware\EnsureTokenIsValid;

->withMiddleware(function (Middleware $middleware): void {
     $middleware->append(EnsureTokenIsValid::class);
})
```

传递给 `withMiddleware` 闭包的 `$middleware` 对象是 `Illuminate\Foundation\Configuration\Middleware` 的实例，负责管理分配给应用路由的中间件。`append` 方法会把中间件添加到全局中间件列表的末尾。如果想把中间件添加到列表的开头，则应当使用 `prepend` 方法。

<a name="manually-managing-laravels-default-global-middleware"></a>
#### 手动管理 Laravel 的默认全局中间件

如果你想手动管理 Laravel 的全局中间件堆栈，可以将 Laravel 默认的全局中间件堆栈传给 `use` 方法。然后，你就可以按需调整这个默认的中间件堆栈：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->use([
        \Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks::class,
        // \Illuminate\Http\Middleware\TrustHosts::class,
        \Illuminate\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Http\Middleware\ValidatePostSize::class,
        \Illuminate\Foundation\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ]);
})
```

<a name="assigning-middleware-to-routes"></a>
### 为路由分配中间件

如果想把中间件分配给特定路由，可以在定义路由时调用 `middleware` 方法：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::get('/profile', function () {
    // ...
})->middleware(EnsureTokenIsValid::class);
```

你可以向 `middleware` 方法传入一个中间件名称数组，从而为路由分配多个中间件：

```php
Route::get('/', function () {
    // ...
})->middleware([First::class, Second::class]);
```

<a name="excluding-middleware"></a>
#### 排除中间件

把中间件分配给一组路由时，有时你可能需要阻止某个中间件应用于该组中的个别路由。这可以通过 `withoutMiddleware` 方法实现：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::middleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/', function () {
        // ...
    });

    Route::get('/profile', function () {
        // ...
    })->withoutMiddleware([EnsureTokenIsValid::class]);
});
```

你也可以从一整组[路由定义](/docs/{{version}}/routing#route-groups)中排除给定的中间件集合：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/profile', function () {
        // ...
    });
});
```

`withoutMiddleware` 方法只能移除路由中间件，不适用于[全局中间件](#global-middleware)。

<a name="middleware-groups"></a>
### 中间件组

有时你可能想把若干中间件归入同一个键名下，以便更方便地把它们分配给路由。这可以使用应用 `bootstrap/app.php` 文件中的 `appendToGroup` 方法来实现：

```php
use App\Http\Middleware\First;
use App\Http\Middleware\Second;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->appendToGroup('group-name', [
        First::class,
        Second::class,
    ]);

    $middleware->prependToGroup('group-name', [
        First::class,
        Second::class,
    ]);
})
```

中间件组可以使用与单个中间件相同的语法分配给路由和控制器动作：

```php
Route::get('/', function () {
    // ...
})->middleware('group-name');

Route::middleware(['group-name'])->group(function () {
    // ...
});
```

<a name="laravels-default-middleware-groups"></a>
#### Laravel 的默认中间件组

Laravel 内置了预定义的 `web` 和 `api` 中间件组，其中包含你可能希望应用于 Web 和 API 路由的常用中间件。请记住，Laravel 会自动把这些中间件组分别应用到对应的 `routes/web.php` 和 `routes/api.php` 文件：

| `web` 中间件组                                             |
| --------------------------------------------------------- |
| `Illuminate\Cookie\Middleware\EncryptCookies`             |
| `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse` |
| `Illuminate\Session\Middleware\StartSession`              |
| `Illuminate\View\Middleware\ShareErrorsFromSession`       |
| `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` |
| `Illuminate\Routing\Middleware\SubstituteBindings`        |

| `api` 中间件组                                      |
| -------------------------------------------------- |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

如果想向这些组追加或前置中间件，可以使用应用 `bootstrap/app.php` 文件中的 `web` 和 `api` 方法。`web` 和 `api` 方法是 `appendToGroup` 方法的便捷替代：

```php
use App\Http\Middleware\EnsureTokenIsValid;
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        EnsureUserIsSubscribed::class,
    ]);

    $middleware->api(prepend: [
        EnsureTokenIsValid::class,
    ]);
})
```

你甚至可以用自定义中间件替换 Laravel 默认中间件组中的某个条目：

```php
use App\Http\Middleware\StartCustomSession;
use Illuminate\Session\Middleware\StartSession;

$middleware->web(replace: [
    StartSession::class => StartCustomSession::class,
]);
```

或者，你也可以完全移除某个中间件：

```php
$middleware->web(remove: [
    StartSession::class,
]);
```

<a name="manually-managing-laravels-default-middleware-groups"></a>
#### 手动管理 Laravel 的默认中间件组

如果你想手动管理 Laravel 默认 `web` 和 `api` 中间件组中的所有中间件，可以完全重新定义这些组。下面的示例将以默认中间件定义 `web` 和 `api` 中间件组，你可以按需进行自定义：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->group('web', [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        // \Illuminate\Session\Middleware\AuthenticateSession::class,
    ]);

    $middleware->group('api', [
        // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // 'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})
```

> [!NOTE]
> 默认情况下，`web` 和 `api` 中间件组由 `bootstrap/app.php` 文件自动应用到应用对应的 `routes/web.php` 和 `routes/api.php` 文件。

<a name="middleware-aliases"></a>
### 中间件别名

你可以在应用的 `bootstrap/app.php` 文件中为中间件分配别名。中间件别名允许你为给定的中间件类定义一个简短的别名，这对于类名很长的中间件尤其有用：

```php
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'subscribed' => EnsureUserIsSubscribed::class
    ]);
})
```

一旦在应用的 `bootstrap/app.php` 文件中定义了中间件别名，你就可以在为路由分配中间件时使用该别名：

```php
Route::get('/profile', function () {
    // ...
})->middleware('subscribed');
```

为了方便使用，Laravel 的一些内置中间件默认就有别名。例如，`auth` 中间件就是 `Illuminate\Auth\Middleware\Authenticate` 中间件的别名。下表列出了默认的中间件别名：

| 别名               | 中间件                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `auth`             | `Illuminate\Auth\Middleware\Authenticate`                                                                     |
| `auth.basic`       | `Illuminate\Auth\Middleware\AuthenticateWithBasicAuth`                                                        |
| `auth.session`     | `Illuminate\Session\Middleware\AuthenticateSession`                                                           |
| `cache.headers`    | `Illuminate\Http\Middleware\SetCacheHeaders`                                                                  |
| `can`              | `Illuminate\Auth\Middleware\Authorize`                                                                        |
| `guest`            | `Illuminate\Auth\Middleware\RedirectIfAuthenticated`                                                          |
| `password.confirm` | `Illuminate\Auth\Middleware\RequirePassword`                                                                  |
| `precognitive`     | `Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests`                                            |
| `signed`           | `Illuminate\Routing\Middleware\ValidateSignature`                                                             |
| `subscribed`       | `\Spark\Http\Middleware\VerifyBillableIsSubscribed`                                                           |
| `throttle`         | `Illuminate\Routing\Middleware\ThrottleRequests` 或 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` |
| `verified`         | `Illuminate\Auth\Middleware\EnsureEmailIsVerified`                                                            |

<a name="sorting-middleware"></a>
### 中间件排序

在少数情况下，你可能需要让中间件按特定顺序执行，却无法控制它们被分配到路由时的顺序。这时，你可以使用应用 `bootstrap/app.php` 文件中的 `priority` 方法来指定中间件的优先级：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
        \Illuminate\Auth\Middleware\Authorize::class,
    ]);
})
```

<a name="middleware-parameters"></a>
## 中间件参数

中间件还可以接收额外的参数。例如，如果你的应用需要在执行给定操作之前验证已认证用户是否拥有某个"角色"（role），可以创建一个 `EnsureUserHasRole` 中间件，把角色名称作为额外参数接收。

额外的中间件参数会在 `$next` 参数之后传递给中间件：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()->hasRole($role)) {
            // 重定向...
        }

        return $next($request);
    }
}
```

定义路由时，可以用 `:` 分隔中间件名称和参数，从而指定中间件参数：

```php
use App\Http\Middleware\EnsureUserHasRole;

Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware(EnsureUserHasRole::class.':editor');
```

多个参数可以用逗号分隔：

```php
Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware(EnsureUserHasRole::class.':editor,publisher');
```

<a name="terminable-middleware"></a>
## 可终止中间件

有时，某个中间件可能需要在 HTTP 响应发送到浏览器之后再执行一些工作。如果你在中间件上定义了 `terminate` 方法，并且你的 Web 服务器使用的是 [FastCGI](https://www.php.net/manual/en/install.fpm.php)，那么 `terminate` 方法会在响应发送到浏览器之后自动调用：

```php
<?php

namespace Illuminate\Session\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TerminatingMiddleware
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * 在响应发送到浏览器之后处理任务。
     */
    public function terminate(Request $request, Response $response): void
    {
        // ...
    }
}
```

`terminate` 方法应当同时接收请求和响应。定义好可终止中间件之后，你应当把它添加到应用 `bootstrap/app.php` 文件中的路由中间件或全局中间件列表中。

调用中间件的 `terminate` 方法时，Laravel 会从[服务容器](/docs/{{version}}/container)解析出一个全新的中间件实例。如果你希望在调用 `handle` 和 `terminate` 方法时使用同一个中间件实例，请使用容器的 `singleton` 方法将该中间件注册为单例。通常，这应当在 `AppServiceProvider` 的 `register` 方法中完成：

```php
use App\Http\Middleware\TerminatingMiddleware;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->app->singleton(TerminatingMiddleware::class);
}
```
