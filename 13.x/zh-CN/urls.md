# URL 生成

- [简介](#introduction)
- [基础](#the-basics)
    - [生成 URL](#generating-urls)
    - [访问当前 URL](#accessing-the-current-url)
- [命名路由的 URL](#urls-for-named-routes)
    - [签名 URL](#signed-urls)
- [控制器动作的 URL](#urls-for-controller-actions)
- [流畅的 URI 对象](#fluent-uri-objects)
- [默认值](#default-values)

<a name="introduction"></a>
## 简介

Laravel 提供了几个辅助函数来帮助你为应用生成 URL。这些辅助函数在构建模板和 API 响应中的链接，或生成重定向到应用其他部分的响应时最为有用。

<a name="the-basics"></a>
## 基础

<a name="generating-urls"></a>
### 生成 URL

`url` 辅助函数可用于为应用生成任意 URL。生成的 URL 将自动使用当前由应用处理的请求的协议（HTTP 或 HTTPS）和主机：

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

提供的查询字符串参数如果在路径中已存在，将覆盖其原有值：

```php
echo url()->query('/posts?sort=latest', ['sort' => 'oldest']);

// http://example.com/posts?sort=oldest
```

值数组也可以作为查询参数传入。这些值将在生成的 URL 中被正确地键控和编码：

```php
echo $url = url()->query('/posts', ['columns' => ['title', 'body']]);

// http://example.com/posts?columns%5B0%5D=title&columns%5B1%5D=body

echo urldecode($url);

// http://example.com/posts?columns[0]=title&columns[1]=body
```

<a name="accessing-the-current-url"></a>
### 访问当前 URL

如果没有向 `url` 辅助函数提供路径，将返回一个 `Illuminate\Routing\UrlGenerator` 实例，允许你访问有关当前 URL 的信息：

```php
// Get the current URL without the query string...
echo url()->current();

// Get the current URL including the query string...
echo url()->full();
```

这些方法也可以通过 `URL` [Facade](/docs/{{version}}/facades) 访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

<a name="accessing-the-previous-url"></a>
#### 访问上一个 URL

有时了解用户来自的上一个 URL 会很有帮助。你可以通过 `url` 辅助函数的 `previous` 和 `previousPath` 方法访问上一个 URL：

```php
// Get the full URL for the previous request...
echo url()->previous();

// Get the path for the previous request...
echo url()->previousPath();
```

或者，通过[会话](/docs/{{version}}/session)，你可以将上一个 URL 作为[流畅的 URI](#fluent-uri-objects) 实例访问：

```php
use Illuminate\Http\Request;

Route::post('/users', function (Request $request) {
    $previousUri = $request->session()->previousUri();

    // ...
});
```

还可以通过会话检索之前访问过的 URL 的路由名称：

```php
$previousRoute = $request->session()->previousRoute();
```

<a name="urls-for-named-routes"></a>
## 命名路由的 URL

`route` 辅助函数可用于生成指向[命名路由](/docs/{{version}}/routing#named-routes)的 URL。命名路由允许你生成 URL 而不必与实际定义在路由上的 URL 耦合。因此，如果路由的 URL 发生变化，你无需修改对 `route` 函数的调用。例如，假设你的应用包含如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    // ...
})->name('post.show');
```

要生成指向此路由的 URL，你可以这样使用 `route` 辅助函数：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 辅助函数也可以用于为具有多个参数的路由生成 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    // ...
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

数组中任何与路由定义参数不对应的额外元素都将被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

<a name="eloquent-models"></a>
#### Eloquent 模型

你经常会使用 [Eloquent 模型](/docs/{{version}}/eloquent)的路由键（通常是主键）来生成 URL。因此，你可以将 Eloquent 模型作为参数值传入。`route` 辅助函数会自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

<a name="signed-urls"></a>
### 签名 URL

Laravel 允许你轻松地为命名路由创建"签名"URL。这些 URL 在查询字符串中附加了一个"签名"哈希，使 Laravel 能够验证 URL 自创建以来未被修改。签名 URL 对于公开可访问但仍需一层 URL 篡改防护的路由尤其有用。

例如，你可以使用签名 URL 实现一个通过电子邮件发送给客户的公开"退订"链接。要为命名路由创建签名 URL，请使用 `URL` Facade 的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1]);
```

你可以通过向 `signedRoute` 方法提供 `absolute` 参数，从签名 URL 哈希中排除域名：

```php
return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);
```

如果你想生成一个在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，它会确保编码在签名 URL 中的过期时间戳尚未过去：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->plus(minutes: 30), ['user' => 1]
);
```

<a name="validating-signed-route-requests"></a>
#### 验证签名路由请求

要验证传入请求是否具有有效签名，你应在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用的前端向签名 URL 追加数据，例如执行客户端分页时。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应忽略的请求查询参数。请记住，忽略参数意味着任何人都可以在请求中修改这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

与其使用传入的请求实例来验证签名 URL，你可以将 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/docs/{{version}}/middleware)分配给路由。如果传入请求没有有效签名，中间件将自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

如果你的签名 URL 不在 URL 哈希中包含域名，则应向中间件提供 `relative` 参数：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed:relative');
```

<a name="responding-to-invalid-signed-routes"></a>
#### 响应无效的签名路由

当有人访问已过期的签名 URL 时，他们会收到一个针对 `403` HTTP 状态码的通用错误页面。不过，你可以通过在应用的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义自定义的"render"闭包来自定义此行为：

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

如果控制器方法接受路由参数，你可以将路由参数的关联数组作为第二个参数传递给该函数：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

<a name="fluent-uri-objects"></a>
## 流畅的 URI 对象

Laravel 的 `Uri` 类提供了一种便捷、流畅的接口，可以通过对象创建和操作 URI。该类封装了底层 League URI 包提供的功能，并与 Laravel 的路由系统无缝集成。

你可以使用静态方法轻松创建 `Uri` 实例：

```php
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvokableController;
use Illuminate\Support\Uri;

// Generate a URI instance from the given string...
$uri = Uri::of('https://example.com/path');

// Generate URI instances to paths, named routes, or controller actions...
$uri = Uri::to('/dashboard');
$uri = Uri::route('users.show', ['user' => 1]);
$uri = Uri::signedRoute('users.show', ['user' => 1]);
$uri = Uri::temporarySignedRoute('user.index', now()->plus(minutes: 5));
$uri = Uri::action([UserController::class, 'index']);
$uri = Uri::action(InvokableController::class);

// Generate a URI instance from the current request URL...
$uri = $request->uri();

// Generate a URI instance from the previous request URL...
$uri = $request->session()->previousUri();
```

获得 URI 实例后，你可以流畅地修改它：

```php
$uri = Uri::of('https://example.com')
    ->withScheme('http')
    ->withHost('test.com')
    ->withPort(8000)
    ->withPath('/users')
    ->withQuery(['page' => 2])
    ->withFragment('section-1');
```

有关处理流畅 URI 对象的更多信息，请查阅 [URI 文档](/docs/{{version}}/helpers#uri)。

<a name="default-values"></a>
## 默认值

对于某些应用，你可能希望为特定 URL 参数指定请求范围内的默认值。例如，假设你的许多路由都定义了一个 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    // ...
})->name('post.index');
```

每次调用 `route` 辅助函数时都传递 `locale` 很麻烦。因此，你可以使用 `URL::defaults` 方法为此参数定义一个默认值，该值将在当前请求期间始终被应用。你可能希望从[路由中间件](/docs/{{version}}/middleware#assigning-middleware-to-routes)调用此方法，以便访问当前请求：

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
     * Handle an incoming request.
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

一旦为 `locale` 参数设置了默认值，你在通过 `route` 辅助函数生成 URL 时就无需再传递它的值了。

<a name="url-defaults-middleware-priority"></a>
#### URL 默认值与中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应该[将设置 URL 默认值的中间件优先执行](/docs/{{version}}/middleware#sorting-middleware)，使其在 Laravel 自身的 `SubstituteBindings` 中间件之前运行。你可以通过在应用的 `bootstrap/app.php` 文件中使用 `priority` 中间件方法来实现：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\SetDefaultLocaleForUrls::class,
    );
})
```
