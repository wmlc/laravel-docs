# 中间件

## 简介

中间件（Middleware）提供了一种便捷的机制，用于检查和过滤进入应用的 HTTP 请求（Request）。例如，Laravel 内置了一个中间件（Middleware），用于验证应用的用户是否已通过认证。如果用户未通过认证，该中间件会将用户重定向到应用的登录页。而如果用户已通过认证，中间件则允许请求进一步进入应用。

除了认证之外，你还可以编写其他中间件来执行各种任务。例如，一个日志中间件可能会记录进入应用的所有请求。Laravel 内置了多种中间件，包括用于认证和 CSRF 保护的中间件；不过，所有用户定义的中间件通常都位于应用的 `app/Http/Middleware` 目录中。

## 定义中间件

要创建一个新中间件，使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

该命令会在你的 `app/Http/Middleware` 目录中放置一个新的 `EnsureTokenIsValid` 类。在这个中间件中，只有当提供的 `token` 输入与指定值匹配时，我们才允许访问该路由（Route）；否则，我们会将用户重定向回 `/home` URI：

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

如你所见，如果给定的 `token` 与我们的密钥不匹配，中间件将向客户端返回一个 HTTP 重定向；否则，请求将被进一步传递到应用内部。要将请求更深入地传递到应用（让中间件"放行"），你应该通过 `$request` 调用 `$next` 回调。

最好将中间件想象成 HTTP 请求在到达应用之前必须穿过的一系列"层"。每一层都可以检查请求，甚至可以完全拒绝它。

> [!NOTE]
> 所有中间件都通过服务容器（Service Container）解析，因此你可以在中间件的构造函数中类型提示任何所需的依赖。

#### 中间件与响应

当然，中间件可以在将请求深入传递到应用之前或之后执行任务。例如，下面的中间件会在请求被应用处理之前执行某些任务：

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
        // 执行动作

        return $next($request);
    }
}
```

然而，下面这个中间件会在请求被应用处理之后执行其任务：

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

        // 执行动作

        return $response;
    }
}
```

## 注册中间件

### 全局中间件

如果你希望某个中间件在应用的每个 HTTP 请求期间都运行，可以将其追加到应用的 `bootstrap/app.php` 文件中的全局中间件栈：

```php
use App\Http\Middleware\EnsureTokenIsValid;

->withMiddleware(function (Middleware $middleware): void {
     $middleware->append(EnsureTokenIsValid::class);
})
```

提供给 `withMiddleware` 闭包的 `$middleware` 对象是 `Illuminate\Foundation\Configuration\Middleware` 的实例，负责管理分配给应用路由的中间件。`append` 方法将中间件添加到全局中间件列表的末尾。如果你想将中间件添加到列表开头，应使用 `prepend` 方法。

#### 手动管理 Laravel 的默认全局中间件

如果你想手动管理 Laravel 的全局中间件栈，可以将 Laravel 默认的全局中间件栈提供给 `use` 方法，然后根据需要调整默认中间件栈：

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

### 为路由分配中间件

如果你想将中间件分配给特定的路由（Route），可以在定义路由时调用 `middleware` 方法：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::get('/profile', function () {
    // ...
})->middleware(EnsureTokenIsValid::class);
```

你可以将中间件名称数组传给 `middleware` 方法，从而为路由分配多个中间件：

```php
Route::get('/', function () {
    // ...
})->middleware([First::class, Second::class]);
```

#### 排除中间件

在为一组路由分配中间件时，你有时需要阻止该中间件应用于组内的某个单独路由。可以使用 `withoutMiddleware` 方法来实现：

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

你也可以从整个[路由组](/topic/Laravel%2013.x/dgy7xg5vw2.html)中排除一组给定的中间件：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/profile', function () {
        // ...
    });
});
```

`withoutMiddleware` 方法只能移除路由中间件，不适用于全局中间件。

### 中间件组

有时你可能希望将多个中间件归到一个单独的键下，以便更轻松地分配给路由。可以使用应用 `bootstrap/app.php` 文件中的 `appendToGroup` 方法来实现：

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

#### Laravel 的默认中间件组

Laravel 内置了预定义的 `web` 和 `api` 中间件组，其中包含你可能希望应用于 Web 路由和 API 路由的常用中间件。请记住，Laravel 会自动将这些中间件组应用到对应的 `routes/web.php` 和 `routes/api.php` 文件：

| The `web` Middleware Group                                |
| --------------------------------------------------------- |
| `Illuminate\Cookie\Middleware\EncryptCookies`             |
| `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse` |
| `Illuminate\Session\Middleware\StartSession`              |
| `Illuminate\View\Middleware\ShareErrorsFromSession`       |
| `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` |
| `Illuminate\Routing\Middleware\SubstituteBindings`        |

| The `api` Middleware Group                         |
| -------------------------------------------------- |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

如果你想向这些组追加或前置中间件，可以使用应用 `bootstrap/app.php` 文件中的 `web` 和 `api` 方法。`web` 和 `api` 方法是 `appendToGroup` 方法的便捷替代：

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

你甚至可以用自己自定义的中间件替换 Laravel 默认中间件组中的某个条目：

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

#### 手动管理 Laravel 的默认中间件组

如果你想手动管理 Laravel 默认 `web` 和 `api` 中间件组中的所有中间件，可以整体重新定义这些组。下面的示例将使用默认中间件定义 `web` 和 `api` 中间件组，方便你按需自定义：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->group('web', [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
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

### 中间件别名

你可以在应用的 `bootstrap/app.php` 文件中为中间件分配别名（alias）。中间件别名允许你为给定的中间件类定义一个简短的别名，这对于类名较长的中间件尤其有用：

```php
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'subscribed' => EnsureUserIsSubscribed::class
    ]);
})
```

在应用的 `bootstrap/app.php` 文件中定义好中间件别名后，就可以在将中间件分配给路由时使用该别名：

```php
Route::get('/profile', function () {
    // ...
})->middleware('subscribed');
```

为方便起见，Laravel 的部分内置中间件默认已设置别名。例如，`auth` 中间件是 `Illuminate\Auth\Middleware\Authenticate` 中间件的别名。下面是默认中间件别名列表：

| Alias              | Middleware                                                                                                    |
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
| `throttle`         | `Illuminate\Routing\Middleware\ThrottleRequests` or `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` |
| `verified`         | `Illuminate\Auth\Middleware\EnsureEmailIsVerified`                                                            |

### 中间件排序

很少情况下，你可能需要中间件以特定顺序执行，但在将其分配给路由时又无法控制它们的顺序。在这种情况下，可以使用应用 `bootstrap/app.php` 文件中的 `priority` 方法指定中间件的优先级（priority）：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
        \Illuminate\Auth\Middleware\Authorize::class,
    ]);
})
```

如果你想在不替换现有优先级列表的情况下向其中添加中间件，可以使用 `prependToPriorityList` 或 `appendToPriorityList` 方法。`prependToPriorityList` 方法将给定的中间件插入到另一个中间件之前，而 `appendToPriorityList` 方法将其插入到另一个中间件之后：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\EnsureTokenIsValid::class,
    );

    $middleware->appendToPriorityList(
        after: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        append: \App\Http\Middleware\EnsureUserIsSubscribed::class,
    );
})
```

`before` 和 `after` 参数也可以是一个中间件类数组。

## 中间件参数

中间件还可以接收额外的参数。例如，如果你的应用需要在执行某个操作前验证已认证用户是否具有给定的"角色（role）"，你可以创建一个 `EnsureUserHasRole` 中间件，它将角色名作为额外的参数接收。

额外的参数会在 `$next` 参数之后传递给中间件：

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

中间件参数可以在定义路由时通过 `:` 分隔中间件名和参数来指定：

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

## 可终止中间件

有时，中间件可能需要在 HTTP 响应发送到浏览器之后执行一些工作。如果你在中间件上定义了 `terminate` 方法，并且你的 Web 服务器使用的是 [FastCGI](https://www.php.net/manual/en/install.fpm.php)，那么在响应发送到浏览器后，`terminate` 方法会被自动调用：

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
     * 在响应发送到浏览器后处理任务。
     */
    public function terminate(Request $request, Response $response): void
    {
        // ...
    }
}
```

`terminate` 方法应同时接收请求和响应。定义好可终止中间件后，应将其添加到应用 `bootstrap/app.php` 文件中的路由列表或全局中间件中。

在中间件上调用 `terminate` 方法时，Laravel 会从服务容器（Service Container）解析出一个全新的中间件实例。如果你希望在调用 `handle` 和 `terminate` 方法时使用同一个中间件实例，可以使用容器的 `singleton` 方法将该中间件注册到容器中。通常这应在 `AppServiceProvider` 的 `register` 方法中完成：

```php
use App\Http\Middleware\TerminatingMiddleware;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->app->singleton(TerminatingMiddleware::class);
}
```