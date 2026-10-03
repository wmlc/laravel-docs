# URL 生成

- [简介](#introduction)
- [基础](#the-basics)
    - [生成 URL](#generating-urls)
    - [访问当前 URL](#accessing-the-current-url)
- [命名路由的 URL](#urls-for-named-routes)
    - [签名 URL](#signed-urls)
- [控制器动作的 URL](#urls-for-controller-actions)
- [默认值](#default-values)

<a name="introduction"></a>
## 简介

Laravel 提供了多个辅助函数来帮助你为应用生成 URL。这些辅助函数主要在模板和 API 响应中构建链接，或者生成重定向响应到应用的其他部分时非常有用。

<a name="the-basics"></a>
## 基础

<a name="generating-urls"></a>
### 生成 URL

可以使用 `url` 辅助函数为应用生成任意 URL。生成的 URL 会自动使用当前应用处理的请求所采用的协议（HTTP 或 HTTPS）和主机：

```php
$post = App\Models\Post::find(1);

echo url("/posts/{$post->id}");

// http://example.com/posts/1
```

<a name="accessing-the-current-url"></a>
### 访问当前 URL

如果不向 `url` 辅助函数提供路径，则会返回一个 `Illuminate\Routing\UrlGenerator` 实例，允许你访问当前 URL 的相关信息：

```php
// 获取不带查询字符串的当前 URL...
echo url()->current();

// 获取包含查询字符串的当前 URL...
echo url()->full();

// 获取上一个请求的完整 URL...
echo url()->previous();
```

这些方法也可以通过 `URL` [Facade](/docs/{{version}}/facades) 访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

<a name="urls-for-named-routes"></a>
## 命名路由的 URL

可以使用 `route` 辅助函数生成指向[命名路由](/docs/{{version}}/routing#named-routes)的 URL。命名路由允许你在不与路由上定义的实际 URL 耦合的情况下生成 URL。因此，如果路由的 URL 发生变化，无需修改对 `route` 函数的调用。例如，假设你的应用包含如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    //
})->name('post.show');
```

要生成指向该路由的 URL，可以这样使用 `route` 辅助函数：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 辅助函数也可用于生成具有多个参数的路由的 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    //
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

任何不对应路由定义参数的额外数组元素都会被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

<a name="eloquent-models"></a>
#### Eloquent 模型

你经常会使用 [Eloquent 模型](/docs/{{version}}/eloquent)的路由键（通常是主键）来生成 URL。因此，你可以将 Eloquent 模型作为参数值传递。`route` 辅助函数会自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

<a name="signed-urls"></a>
### 签名 URL

Laravel 允许你轻松地为命名路由创建「签名」URL。这些 URL 在查询字符串中附加了一个「签名」哈希，允许 Laravel 验证该 URL 自创建以来未被修改过。签名 URL 对于公开可访问但仍需一层防护以防止 URL 篡改的路由特别有用。

例如，你可以使用签名 URL 来实现通过邮件发送给客户的公开「退订」链接。要创建指向命名路由的签名 URL，请使用 `URL` Facade 的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1);
```

如果你想生成一个在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，会确保编码到签名 URL 中的过期时间戳尚未过去：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->addMinutes(30), ['user' => 1]
);
```

<a name="validating-signed-route-requests"></a>
#### 验证签名路由请求

要验证传入请求是否具有有效签名，应在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用的前端向签名 URL 追加数据，例如执行客户端分页时。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应忽略的请求查询参数。请记住，忽略参数意味着任何人都可以修改请求上的这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

除了使用传入请求实例验证签名 URL 外，你还可以将 `Illuminate\Routing\Middleware\ValidateSignature` [中间件](/docs/{{version}}/middleware)分配给路由。如果该中间件尚未存在，应在 HTTP 内核的 `routeMiddleware` 数组中为其分配一个键：

```php
/**
 * 应用的路由中间件。
 *
 * 这些中间件可以分配到组或单独使用。
 *
 * @var array
 */
protected $routeMiddleware = [
    'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
];
```

在内核中注册中间件后，就可以将其附加到路由。如果传入请求没有有效签名，中间件将自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

<a name="responding-to-invalid-signed-routes"></a>
#### 响应无效的签名路由

当有人访问已过期的签名 URL 时，他们将收到 `403` HTTP 状态码的通用错误页面。不过，你可以通过在异常处理器中为 `InvalidSignatureException` 异常定义一个自定义的「可渲染」闭包来自定义此行为。该闭包应返回一个 HTTP 响应：

```php
use Illuminate\Routing\Exceptions\InvalidSignatureException;

/**
 * 注册应用的异常处理回调。
 *
 * @return void
 */
public function register()
{
    $this->renderable(function (InvalidSignatureException $e) {
        return response()->view('error.link-expired', [], 403);
    });
}
```

<a name="urls-for-controller-actions"></a>
## 控制器动作的 URL

`action` 函数为给定的控制器动作生成 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果控制器方法接受路由参数，可以将路由参数的关联数组作为函数的第二个参数传递：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

<a name="default-values"></a>
## 默认值

对于某些应用，你可能希望为某些 URL 参数指定请求范围内的默认值。例如，假设你的许多路由都定义了 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    //
})->name('post.index');
```

每次调用 `route` 辅助函数时都要传递 `locale` 会很繁琐。因此，你可以使用 `URL::defaults` 方法为该参数定义一个默认值，该默认值在当前请求期间始终适用。你可能希望从[路由中间件](/docs/{{version}}/middleware#assigning-middleware-to-routes)中调用此方法，以便访问当前请求：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\URL;

class SetDefaultLocaleForUrls
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Illuminate\Http\Response
     */
    public function handle($request, Closure $next)
    {
        URL::defaults(['locale' => $request->user()->locale]);

        return $next($request);
    }
}
```

一旦为 `locale` 参数设置了默认值，通过 `route` 辅助函数生成 URL 时就不再需要传递其值。

<a name="url-defaults-middleware-priority"></a>
#### URL 默认值与中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应该[设置中间件优先级](/docs/{{version}}/middleware#sorting-middleware)，将设置 URL 默认值的中间件安排在 Laravel 自身的 `SubstituteBindings` 中间件之前执行。你可以通过确保中间件在应用 HTTP 内核的 `$middlewarePriority` 属性中位于 `SubstituteBindings` 中间件之前来实现这一点。

`$middlewarePriority` 属性定义在基础 `Illuminate\Foundation\Http\Kernel` 类中。你可以从该类复制其定义并在应用的 HTTP 内核中覆盖它以进行修改：

```php
/**
 * 按优先级排序的中间件列表。
 *
 * 这会强制非全局中间件始终按给定顺序排列。
 *
 * @var array
 */
protected $middlewarePriority = [
    // ...
     \App\Http\Middleware\SetDefaultLocaleForUrls::class,
     \Illuminate\Routing\Middleware\SubstituteBindings::class,
     // ...
];
```