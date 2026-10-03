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

中间件为检查和过滤进入应用的 HTTP 请求提供了一套便捷机制。例如，Laravel 内置了一个用于验证应用用户是否已认证的中间件。若用户未认证，该中间件会把用户重定向到应用的登录页面；若用户已认证，中间件则允许请求继续进入应用。

除身份认证之外，你还可以编写其他中间件来执行各类任务。例如，一个日志中间件可以把所有传入应用的请求记录下来。Laravel 内置了多种中间件，包括用于身份认证和 CSRF 保护的中间件；不过，所有用户自定义的中间件通常都放在应用的 `app/Http/Middleware` 目录中。

<a name="defining-middleware"></a>
## 定义中间件

要创建新的中间件，请使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

该命令会在 `app/Http/Middleware` 目录下生成一个新的 `EnsureTokenIsValid` 类。在这个中间件中，只有当传入的 `token` 输入与指定值一致时，我们才允许访问该路由；否则，我们会把用户重定向回 `/home` URI：

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

如你所见，如果给定的 `token` 与我们的密钥不匹配，中间件会向客户端返回一个 HTTP 重定向；否则，请求会继续传入应用。若要把请求更深地传入应用（即允许该中间件"放行"），你应当使用 `$request` 调用 `$next` 回调。

最好把中间件想象成 HTTP 请求在抵达应用之前必须穿过的一连串"层"。每一层都可以检查请求，甚至彻底拒绝它。

> [!NOTE]
> 所有中间件都通过[服务容器（Service Container）](/docs/{{version}}/container)解析，因此你可以在中间件的构造函数中类型提示所需的任何依赖。

<a name="middleware-and-responses"></a>
#### 中间件与响应

当然，中间件既可以在把请求更深地传入应用之前执行任务，也可以在之后执行任务。例如，下面的中间件会在应用处理请求**之前**执行一些任务：

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

而下面的中间件则会在应用处理请求**之后**执行任务：

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

<a name="registering-middleware"></a>
## 注册中间件

<a name="global-middleware"></a>
### 全局中间件

如果你希望某个中间件在每次 HTTP 请求时都运行，可以把它追加到应用 `bootstrap/app.php` 文件中的全局中间件栈末尾：

    use App\Http\Middleware\EnsureTokenIsValid;

    ->withMiddleware(function (Middleware $middleware) {
         $middleware->append(EnsureTokenIsValid::class);
    })

传给 `withMiddleware` 闭包的 `$middleware` 对象是 `Illuminate\Foundation\Configuration\Middleware` 的实例，负责管理分配给应用路由的中间件。`append` 方法会把中间件添加到全局中间件列表的末尾。如果你想把中间件添加到列表开头，应改用 `prepend` 方法。

<a name="manually-managing-laravels-default-global-middleware"></a>
#### 手动管理 Laravel 的默认全局中间件

如果你想手动管理 Laravel 的全局中间件栈，可以把 Laravel 默认的全局中间件栈传给 `use` 方法，然后按需调整默认中间件栈：

    ->withMiddleware(function (Middleware $middleware) {
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

<a name="assigning-middleware-to-routes"></a>
### 为路由分配中间件

如果你想把中间件分配给特定路由，可以在定义路由时调用 `middleware` 方法：

    use App\Http\Middleware\EnsureTokenIsValid;

    Route::get('/profile', function () {
        // ...
    })->middleware(EnsureTokenIsValid::class);

你也可以向 `middleware` 方法传入一个中间件名称数组，为路由分配多个中间件：

    Route::get('/', function () {
        // ...
    })->middleware([First::class, Second::class]);

<a name="excluding-middleware"></a>
#### 排除中间件

把中间件分配给一组路由时，你偶尔会需要阻止某个中间件作用于该组中的某一条具体路由。此时可以使用 `withoutMiddleware` 方法来实现：

    use App\Http\Middleware\EnsureTokenIsValid;

    Route::middleware([EnsureTokenIsValid::class])->group(function () {
        Route::get('/', function () {
            // ...
        });

        Route::get('/profile', function () {
            // ...
        })->withoutMiddleware([EnsureTokenIsValid::class]);
    });

你也可以从整组[路由定义](/docs/{{version}}/routing#route-groups)中排除指定的一组中间件：

    use App\Http\Middleware\EnsureTokenIsValid;

    Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
        Route::get('/profile', function () {
            // ...
        });
    });

`withoutMiddleware` 方法只能移除路由中间件，对[全局中间件](#global-middleware)无效。

<a name="middleware-groups"></a>
### 中间件组

有时你可能希望把若干中间件归到同一个键下，以便更方便地分配给路由。你可以在应用的 `bootstrap/app.php` 文件中使用 `appendToGroup` 方法来实现：

    use App\Http\Middleware\First;
    use App\Http\Middleware\Second;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->appendToGroup('group-name', [
            First::class,
            Second::class,
        ]);

        $middleware->prependToGroup('group-name', [
            First::class,
            Second::class,
        ]);
    })

中间件组可以像单个中间件一样，使用相同的语法分配给路由和控制器动作：

    Route::get('/', function () {
        // ...
    })->middleware('group-name');

    Route::middleware(['group-name'])->group(function () {
        // ...
    });

<a name="laravels-default-middleware-groups"></a>
#### Laravel 的默认中间件组

Laravel 内置了预定义的 `web` 和 `api` 中间件组，其中包含你可能想应用到 Web 路由和 API 路由上的常用中间件。请记住，Laravel 会自动把这些中间件组应用到相应的 `routes/web.php` 和 `routes/api.php` 文件：

<div class="overflow-auto">

| `web` 中间件组 |
| --- |
| `Illuminate\Cookie\Middleware\EncryptCookies` |
| `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse` |
| `Illuminate\Session\Middleware\StartSession` |
| `Illuminate\View\Middleware\ShareErrorsFromSession` |
| `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

</div>

<div class="overflow-auto">

| `api` 中间件组 |
| --- |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

</div>

如果你想向这些组追加或前置中间件，可以在应用的 `bootstrap/app.php` 文件中使用 `web` 和 `api` 方法。`web` 和 `api` 方法是 `appendToGroup` 方法的便捷替代品：

    use App\Http\Middleware\EnsureTokenIsValid;
    use App\Http\Middleware\EnsureUserIsSubscribed;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            EnsureUserIsSubscribed::class,
        ]);

        $middleware->api(prepend: [
            EnsureTokenIsValid::class,
        ]);
    })

你甚至可以用自己的自定义中间件替换 Laravel 默认中间件组中的某一项：

    use App\Http\Middleware\StartCustomSession;
    use Illuminate\Session\Middleware\StartSession;

    $middleware->web(replace: [
        StartSession::class => StartCustomSession::class,
    ]);

或者，你也可以彻底移除某个中间件：

    $middleware->web(remove: [
        StartSession::class,
    ]);

<a name="manually-managing-laravels-default-middleware-groups"></a>
#### 手动管理 Laravel 的默认中间件组

如果你想手动管理 Laravel 默认 `web` 和 `api` 中间件组中的全部中间件，可以完整地重新定义这些组。下面的示例会以默认中间件定义 `web` 和 `api` 中间件组，从而允许你按需自定义：

    ->withMiddleware(function (Middleware $middleware) {
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

> [!NOTE]
> 默认情况下，`bootstrap/app.php` 文件会自动把 `web` 和 `api` 中间件组应用到应用相应的 `routes/web.php` 和 `routes/api.php` 文件。

<a name="middleware-aliases"></a>
### 中间件别名

你可以在应用的 `bootstrap/app.php` 文件中为中间件分配别名。中间件别名让你可以为某个中间件类定义一个简短的别名，这对类名较长的中间件尤其有用：

    use App\Http\Middleware\EnsureUserIsSubscribed;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'subscribed' => EnsureUserIsSubscribed::class
        ]);
    })

在应用的 `bootstrap/app.php` 文件中定义好中间件别名后，分配中间件给路由时就可以使用该别名：

    Route::get('/profile', function () {
        // ...
    })->middleware('subscribed');

为方便起见，Laravel 的一部分内置中间件默认就有别名。例如，`auth` 中间件是 `Illuminate\Auth\Middleware\Authenticate` 中间件的别名。下面是默认中间件别名的列表：

<div class="overflow-auto">

| 别名 | 中间件 |
| --- | --- |
| `auth` | `Illuminate\Auth\Middleware\Authenticate` |
| `auth.basic` | `Illuminate\Auth\Middleware\AuthenticateWithBasicAuth` |
| `auth.session` | `Illuminate\Session\Middleware\AuthenticateSession` |
| `cache.headers` | `Illuminate\Http\Middleware\SetCacheHeaders` |
| `can` | `Illuminate\Auth\Middleware\Authorize` |
| `guest` | `Illuminate\Auth\Middleware\RedirectIfAuthenticated` |
| `password.confirm` | `Illuminate\Auth\Middleware\RequirePassword` |
| `precognitive` | `Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests` |
| `signed` | `Illuminate\Routing\Middleware\ValidateSignature` |
| `subscribed` | `\Spark\Http\Middleware\VerifyBillableIsSubscribed` |
| `throttle` | `Illuminate\Routing\Middleware\ThrottleRequests` 或 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` |
| `verified` | `Illuminate\Auth\Middleware\EnsureEmailIsVerified` |

</div>

<a name="sorting-middleware"></a>
### 中间件排序

偶尔你可能希望中间件按特定顺序执行，但又无法控制它们在被分配到路由时的顺序。在这种情况下，你可以在应用的 `bootstrap/app.php` 文件中使用 `priority` 方法指定中间件优先级：

    ->withMiddleware(function (Middleware $middleware) {
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

<a name="middleware-parameters"></a>
## 中间件参数

中间件还可以接收额外的参数。例如，如果你的应用需要在执行某个操作前校验已认证用户具备某个"角色"，你可以创建一个 `EnsureUserHasRole` 中间件，用于接收一个角色名称作为额外参数。

额外的中间件参数会传递到 `$next` 参数之后：

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

定义路由时，可以用 `:` 分隔中间件名称与参数，从而指定中间件参数：

    use App\Http\Middleware\EnsureUserHasRole;

    Route::put('/post/{id}', function (string $id) {
        // ...
    })->middleware(EnsureUserHasRole::class.':editor');

多个参数之间可以用逗号分隔：

    Route::put('/post/{id}', function (string $id) {
        // ...
    })->middleware(EnsureUserHasRole::class.':editor,publisher');

<a name="terminable-middleware"></a>
## 可终止中间件

有时中间件需要在 HTTP 响应已发送给浏览器之后执行一些工作。如果你在中间件中定义了 `terminate` 方法，并且 Web 服务器使用 FastCGI，那么在响应发送到浏览器之后，`terminate` 方法会被自动调用：

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
         * 在响应已发送到浏览器之后处理任务。
         */
        public function terminate(Request $request, Response $response): void
        {
            // ...
        }
    }

`terminate` 方法应当同时接收请求和响应。定义好可终止中间件后，你需要把它添加到应用的 `bootstrap/app.php` 文件中的路由列表或全局中间件列表里。

在你自己的中间件上调用 `terminate` 方法时，Laravel 会从[服务容器](/docs/{{version}}/container)中重新解析出一个全新的中间件实例。如果你希望在调用 `handle` 与 `terminate` 方法时使用同一个中间件实例，请使用容器的 `singleton` 方法把该中间件注册到容器中。通常这应该在你的 `AppServiceProvider` 的 `register` 方法中完成：

    use App\Http\Middleware\TerminatingMiddleware;

    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(TerminatingMiddleware::class);
    }
