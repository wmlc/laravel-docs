# 中间件

- [简介](#introduction)
- [定义中间件](#defining-middleware)
- [注册中间件](#registering-middleware)
    - [全局中间件](#global-middleware)
    - [为路由分配中间件](#assigning-middleware-to-routes)
    - [中间件组](#middleware-groups)
    - [中间件排序](#sorting-middleware)
- [中间件参数](#middleware-parameters)
- [可终止中间件](#terminable-middleware)

<a name="introduction"></a>
## 简介

中间件为检查和过滤进入应用的 HTTP 请求提供了一种便捷机制。例如，Laravel 包含一个验证应用用户是否已认证的中间件。如果用户未认证，中间件会将用户重定向到应用的登录页面。如果用户已认证，中间件将允许请求继续进入应用。

除了身份认证之外，还可以编写其他中间件来执行各种任务。例如，日志中间件可能会记录应用的所有传入请求。Laravel 框架内置了多个中间件，包括用于身份认证和 CSRF 保护的中间件。所有这些中间件都位于 `app/Http/Middleware` 目录中。

<a name="defining-middleware"></a>
## 定义中间件

要创建新的中间件，使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

此命令会在 `app/Http/Middleware` 目录下放置一个新的 `EnsureTokenIsValid` 类。在此中间件中，仅当提供的 `token` 输入匹配指定值时才允许访问路由。否则，将用户重定向回 `home` URI：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class EnsureTokenIsValid
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
        if ($request->input('token') !== 'my-secret-token') {
            return redirect('home');
        }

        return $next($request);
    }
}
```

如上所示，如果给定的 `token` 与我们的密钥不匹配，中间件将向客户端返回 HTTP 重定向；否则，请求将继续传递到应用中。要将请求更深入地传递到应用中（即让中间件"放行"），应使用 `$request` 调用 `$next` 回调。

最好将中间件想象为 HTTP 请求在到达应用之前必须穿过的一系列"层"。每一层都可以检查请求，甚至完全拒绝请求。

> **Note**  
> 所有中间件都通过[服务容器](/docs/{{version}}/container)解析，因此可以在中间件构造函数中类型提示所需的任何依赖。

<a name="middleware-and-responses"></a>
#### 中间件与响应

当然，中间件可以在将请求传递到应用更深处之前或之后执行任务。例如，以下中间件会在请求被应用处理**之前**执行某些任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class BeforeMiddleware
{
    public function handle($request, Closure $next)
    {
        // 执行操作

        return $next($request);
    }
}
```

而以下中间件会在请求被应用处理**之后**执行其任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class AfterMiddleware
{
    public function handle($request, Closure $next)
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

如果希望某个中间件在应用的每个 HTTP 请求期间都运行，可以将该中间件类列在 `app/Http/Kernel.php` 类的 `$middleware` 属性中。

<a name="assigning-middleware-to-routes"></a>
### 为路由分配中间件

如果希望将中间件分配给特定路由，应首先在应用的 `app/Http/Kernel.php` 文件中为该中间件分配一个键。默认情况下，该类的 `$routeMiddleware` 属性包含了 Laravel 内置中间件的条目。可以在此列表中添加自己的中间件，并为其分配所选的键：

```php
// 在 App\Http\Kernel 类中...

protected $routeMiddleware = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
    'bindings' => \Illuminate\Routing\Middleware\SubstituteBindings::class,
    'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
    'can' => \Illuminate\Auth\Middleware\Authorize::class,
    'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
    'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
];
```

在 HTTP 内核中定义中间件后，可以使用 `middleware` 方法将中间件分配给路由：

```php
Route::get('/profile', function () {
    //
})->middleware('auth');
```

可以通过向 `middleware` 方法传递中间件名数组，为路由分配多个中间件：

```php
Route::get('/', function () {
    //
})->middleware(['first', 'second']);
```

分配中间件时，也可以传递完全限定的类名：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::get('/profile', function () {
    //
})->middleware(EnsureTokenIsValid::class);
```

<a name="excluding-middleware"></a>
#### 排除中间件

将中间件分配给一组路由时，有时可能需要阻止中间件应用于组内的某个单独路由。可以使用 `withoutMiddleware` 方法实现：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::middleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/', function () {
        //
    });

    Route::get('/profile', function () {
        //
    })->withoutMiddleware([EnsureTokenIsValid::class]);
});
```

也可以从整个路由定义[组](/docs/{{version}}/routing#route-groups)中排除给定的一组中间件：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/profile', function () {
        //
    });
});
```

`withoutMiddleware` 方法只能移除路由中间件，不适用于[全局中间件](#global-middleware)。

<a name="middleware-groups"></a>
### 中间件组

有时可能希望将多个中间件归入单个键下，以便更轻松地分配给路由。可以使用 HTTP 内核的 `$middlewareGroups` 属性实现。

Laravel 包含预定义的 `web` 和 `api` 中间件组，其中包含可能希望应用于 Web 和 API 路由的常用中间件。请记住，这些中间件组由应用的 `App\Providers\RouteServiceProvider` 服务提供者自动应用到相应 `web` 和 `api` 路由文件中的路由：

```php
/**
 * 应用的路由中间件组。
 *
 * @var array
 */
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],

    'api' => [
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

可以使用与单个中间件相同的语法将中间件组分配给路由和控制器动作。同样，中间件组使得一次性为路由分配多个中间件更加方便：

```php
Route::get('/', function () {
    //
})->middleware('web');

Route::middleware(['web'])->group(function () {
    //
});
```

> **Note**  
> 开箱即用时，`web` 和 `api` 中间件组由 `App\Providers\RouteServiceProvider` 自动应用到应用对应的 `routes/web.php` 和 `routes/api.php` 文件。

<a name="sorting-middleware"></a>
### 中间件排序

有时可能需要中间件按特定顺序执行，但在将它们分配给路由时无法控制其顺序。此时，可以使用 `app/Http/Kernel.php` 文件的 `$middlewarePriority` 属性指定中间件优先级。此属性默认可能不存在于 HTTP 内核中。如果不存在，可以复制以下默认定义：

```php
/**
 * 按优先级排序的中间件列表。
 *
 * 这会强制非全局中间件始终按给定顺序排列。
 *
 * @var string[]
 */
protected $middlewarePriority = [
    \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class,
    \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
    \Illuminate\Contracts\Session\Middleware\AuthenticatesSessions::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    \Illuminate\Auth\Middleware\Authorize::class,
];
```

<a name="middleware-parameters"></a>
## 中间件参数

中间件还可以接收额外参数。例如，如果应用需要在执行给定操作前验证已认证用户是否具有给定"角色"，可以创建一个 `EnsureUserHasRole` 中间件，接收角色名作为额外参数。

额外的中间件参数会在 `$next` 参数之后传递给中间件：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserHasRole
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $role
     * @return mixed
     */
    public function handle($request, Closure $next, $role)
    {
        if (! $request->user()->hasRole($role)) {
            // 重定向...
        }

        return $next($request);
    }

}
```

定义路由时可以指定中间件参数，使用 `:` 分隔中间件名和参数。多个参数应以逗号分隔：

```php
Route::put('/post/{id}', function ($id) {
    //
})->middleware('role:editor');
```

<a name="terminable-middleware"></a>
## 可终止中间件

有时中间件可能需要在 HTTP 响应发送到浏览器之后执行一些工作。如果在中间件中定义了 `terminate` 方法，且 Web 服务器使用 FastCGI，则 `terminate` 方法会在响应发送到浏览器后自动调用：

```php
<?php

namespace Illuminate\Session\Middleware;

use Closure;

class TerminatingMiddleware
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
        return $next($request);
    }

    /**
     * 在响应发送到浏览器后处理任务。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\Response  $response
     * @return void
     */
    public function terminate($request, $response)
    {
        // ...
    }
}
```

`terminate` 方法应同时接收请求和响应。定义可终止中间件后，应将其添加到 `app/Http/Kernel.php` 文件中的路由或全局中间件列表中。

当调用中间件的 `terminate` 方法时，Laravel 会从[服务容器](/docs/{{version}}/container)解析一个新的中间件实例。如果希望在调用 `handle` 和 `terminate` 方法时使用同一个中间件实例，请使用容器的 `singleton` 方法向容器注册中间件。通常应在 `AppServiceProvider` 的 `register` 方法中完成：

```php
use App\Http\Middleware\TerminatingMiddleware;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    $this->app->singleton(TerminatingMiddleware::class);
}
```