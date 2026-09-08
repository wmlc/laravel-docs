# URL 生成

- [简介](#introduction)
- [基础](#the-basics)
    - [生成 URL](#generating-urls)
    - [访问当前 URL](#accessing-the-current-url)
- [命名路由的 URL](#urls-for-named-routes)
    - [签名 URL](#signed-urls)
- [控制器动作的 URL](#urls-for-controller-actions)
- [流式 URI 对象](#fluent-uri-objects)
- [默认值](#default-values)

<a name="introduction"></a>
## 简介

Laravel 提供了多个辅助函数来帮助你为应用生成 URL。这些辅助函数主要用于在模板和 API 响应中构建链接，或者生成重定向到应用其他部分的响应。

<a name="the-basics"></a>
## 基础

<a name="generating-urls"></a>
### 生成 URL

`url` 辅助函数可用于为应用生成任意 URL。生成的 URL 会自动使用当前应用正在处理的请求所采用的协议（HTTP 或 HTTPS）和主机名：

```php
$post = App\Models\Post::find(1);

echo url("/posts/{$post->id}");

// http://example.com/posts/1
```

要生成带查询字符串参数的 URL，可以使用 `query` 方法：

```php
echo url()->query('/posts', ['search' => 'Laravel']);

// https://example.com/posts?search=Laravel

echo url()->query('/posts?sort=latest', ['search' => 'Laravel']);

// http://example.com/posts?sort=latest&search=Laravel
```

如果提供的查询字符串参数已存在于路径中，将覆盖其原有值：

```php
echo url()->query('/posts?sort=latest', ['sort' => 'oldest']);

// http://example.com/posts?sort=oldest
```

也可以传递值数组作为查询参数。这些值会在生成的 URL 中被正确地组织键名并编码：

```php
echo $url = url()->query('/posts', ['columns' => ['title', 'body']]);

// http://example.com/posts?columns%5B0%5D=title&columns%5B1%5D=body

echo urldecode($url);

// http://example.com/posts?columns[0]=title&columns[1]=body
```

<a name="accessing-the-current-url"></a>
### 访问当前 URL

如果不向 `url` 辅助函数提供路径，它会返回一个 `Illuminate\Routing\UrlGenerator` 实例，让你能够访问有关当前 URL 的信息：

```php
// 获取不带查询字符串的当前 URL...
echo url()->current();

// 获取包含查询字符串的当前 URL...
echo url()->full();
```

这些方法也都可以通过 `URL` [Facade](/docs/{{version}}/facades) 来访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

<a name="accessing-the-previous-url"></a>
#### 访问上一个 URL

有时，了解用户此前访问的 URL 会很有帮助。你可以通过 `url` 辅助函数的 `previous` 和 `previousPath` 方法访问上一个 URL：

```php
// 获取上一个请求的完整 URL...
echo url()->previous();

// 获取上一个请求的路径...
echo url()->previousPath();
```

或者，通过[会话](/docs/{{version}}/session)，你可以将上一个 URL 作为[流式 URI](#fluent-uri-objects) 实例来访问：

```php
use Illuminate\Http\Request;

Route::post('/users', function (Request $request) {
    $previousUri = $request->session()->previousUri();

    // ...
});
```

还可以通过会话获取用户此前访问的 URL 对应的路由名称：

```php
$previousRoute = $request->session()->previousRoute();
```

<a name="urls-for-named-routes"></a>
## 命名路由的 URL

`route` 辅助函数可用于为[命名路由](/docs/{{version}}/routing#named-routes)生成 URL。命名路由让你在生成 URL 时无需耦合到路由上定义的实际 URL。因此，如果路由的 URL 发生变化，你无需修改对 `route` 函数的调用。例如，假设你的应用中包含如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    // ...
})->name('post.show');
```

要生成指向该路由的 URL，可以这样使用 `route` 辅助函数：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 辅助函数也可用于为带有多个参数的路由生成 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    // ...
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

任何与路由定义参数不对应的额外数组元素，都会被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

<a name="eloquent-models"></a>
#### Eloquent 模型

你经常会需要使用 [Eloquent 模型](/docs/{{version}}/eloquent)的路由键（通常是主键）来生成 URL。为此，你可以直接传递 Eloquent 模型作为参数值，`route` 辅助函数会自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

<a name="signed-urls"></a>
### 签名 URL

Laravel 允许你轻松地为命名路由创建「签名」URL。这类 URL 的查询字符串中附加了一个「签名」哈希，让 Laravel 能够验证该 URL 自创建以来未被篡改。签名 URL 特别适用于那些公开可访问、但需要一层保护以防止 URL 篡改的路由。

例如，你可以使用签名 URL 来实现通过邮件发送给客户的公开「退订」链接。要为命名路由创建签名 URL，请使用 `URL` Facade 的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1]);
```

通过向 `signedRoute` 方法提供 `absolute` 参数，可以在签名 URL 的哈希中排除域名：

```php
return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);
```

如果你想生成一个在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，会确保编码在签名 URL 中的过期时间戳尚未过去：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->plus(minutes: 30), ['user' => 1]
);
```

<a name="validating-signed-route-requests"></a>
#### 验证签名路由请求

要验证传入请求是否具有有效签名，应当在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用的前端向签名 URL 追加数据，例如在执行客户端分页时。为此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应忽略的请求查询参数。请记住，忽略参数意味着任何人都可以在请求中修改这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

除了使用传入请求实例来验证签名 URL，你还可以将 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/docs/{{version}}/middleware)分配给路由。如果传入请求没有有效签名，该中间件将自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

如果你的签名 URL 的哈希中不包含域名，则应当向中间件提供 `relative` 参数：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed:relative');
```

<a name="responding-to-invalid-signed-routes"></a>
#### 响应无效的签名路由

当有人访问已过期的签名 URL 时，将收到 `403` HTTP 状态码的通用错误页面。不过，你可以在应用的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义自定义的「渲染」闭包来自定义这一行为：

```php
use Illuminate\Routing\Exceptions\InvalidSignatureException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidSignatureException $e) {
        return response()->view('errors.link-expired', status: 403);
    });
})
```

<a name="urls-for-controller-actions"></a>
## 控制器动作的 URL

`action` 函数为给定的控制器动作生成 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果控制器方法接受路由参数，可以将路由参数的关联数组作为该函数的第二个参数传递：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

<a name="fluent-uri-objects"></a>
## 流式 URI 对象

Laravel 的 `Uri` 类提供了一种便捷、流式的接口，用于通过对象创建和操作 URI。该类封装了底层 League URI 软件包提供的功能，并与 Laravel 的路由系统无缝集成。

你可以使用静态方法轻松创建 `Uri` 实例：

```php
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvokableController;
use Illuminate\Support\Uri;

// 从给定字符串生成 URI 实例...
$uri = Uri::of('https://example.com/path');

// 生成指向路径、命名路由或控制器动作的 URI 实例...
$uri = Uri::to('/dashboard');
$uri = Uri::route('users.show', ['user' => 1]);
$uri = Uri::signedRoute('users.show', ['user' => 1]);
$uri = Uri::temporarySignedRoute('user.index', now()->plus(minutes: 5));
$uri = Uri::action([UserController::class, 'index']);
$uri = Uri::action(InvokableController::class);

// 从当前请求 URL 生成 URI 实例...
$uri = $request->uri();

// 从上一个请求 URL 生成 URI 实例...
$uri = $request->session()->previousUri();
```

获得 URI 实例后，你就可以流式地修改它：

```php
$uri = Uri::of('https://example.com')
    ->withScheme('http')
    ->withHost('test.com')
    ->withPort(8000)
    ->withPath('/users')
    ->withQuery(['page' => 2])
    ->withFragment('section-1');
```

更多关于流式 URI 对象的信息，请查阅 [URI 文档](/docs/{{version}}/helpers#uri)。

<a name="default-values"></a>
## 默认值

对于某些应用，你可能希望为某些 URL 参数指定请求范围内的默认值。例如，假设你的许多路由都定义了 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    // ...
})->name('post.index');
```

每次调用 `route` 辅助函数都要传递 `locale` 会很繁琐。因此，你可以使用 `URL::defaults` 方法为该参数定义一个默认值，它会在当前请求期间始终生效。你或许希望在[路由中间件](/docs/{{version}}/middleware#assigning-middleware-to-routes)中调用此方法，以便访问当前请求：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetDefaultLocaleForUrls
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        URL::defaults(['locale' => $request->user()->locale]);

        return $next($request);
    }
}
```

一旦设置了 `locale` 参数的默认值，你就无需在通过 `route` 辅助函数生成 URL 时再传递它的值了。

<a name="url-defaults-middleware-priority"></a>
#### URL 默认值与中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应当对设置 URL 默认值的中间件[设置优先级](/docs/{{version}}/middleware#sorting-middleware)，使其在 Laravel 自带的 `SubstituteBindings` 中间件之前执行。你可以在应用的 `bootstrap/app.php` 文件中使用 `priority` 中间件方法来实现这一点：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\SetDefaultLocaleForUrls::class,
    );
})
```
