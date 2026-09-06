# URL 生成

## 简介

Laravel 提供了多个辅助函数来帮助你为应用程序生成 URL。这些辅助函数在构建模板和 API 响应中的链接，或者生成重定向 响应 到其他部分时尤为有用。

## 基础知识

### 生成 URL

`url` 辅助函数可用于为你的应用程序生成任意 URL。生成的 URL 会自动使用当前正在处理的 请求 的方案（HTTP 或 HTTPS）和主机：

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

提供路径中已经存在的查询字符串参数会覆盖其现有值：

```php
echo url()->query('/posts?sort=latest', ['sort' => 'oldest']);

// http://example.com/posts?sort=oldest
```

值数组也可以作为查询参数传递。这些值会在生成的 URL 中被正确地键化并编码：

```php
echo $url = url()->query('/posts', ['columns' => ['title', 'body']]);

// http://example.com/posts?columns%5B0%5D=title&columns%5B1%5D=body

echo urldecode($url);

// http://example.com/posts?columns[0]=title&columns[1]=body
```

### 获取当前 URL

如果没有向 `url` 辅助函数提供路径，则会返回一个 `Illuminate\Routing\UrlGenerator` 实例，让你能够访问当前 URL 的信息：

```php
// 获取不含查询字符串的当前 URL...
echo url()->current();

// 获取包含查询字符串的当前 URL...
echo url()->full();
```

上述每个方法也可以通过 `URL` [Facade](/topic/Laravel%2013.x/569x508yep.html) 访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

#### 获取上一个 URL

有时，了解用户来自的上一个 URL 会很有帮助。你可以通过 `url` 辅助函数的 `previous` 和 `previousPath` 方法访问上一个 URL：

```php
// 获取上一个请求的完整 URL...
echo url()->previous();

// 获取上一个请求的路径...
echo url()->previousPath();
```

或者，通过[会话](/topic/Laravel%2013.x/2ev86noyor.html)，你可以将上一个 URL 作为流式 URI实例访问：

```php
use Illuminate\Http\Request;

Route::post('/users', function (Request $request) {
    $previousUri = $request->session()->previousUri();

    // ...
});
```

你还可以通过会话获取所访问的上一个 URL 的 路由 名称：

```php
$previousRoute = $request->session()->previousRoute();
```

## 命名路由的 URL

`route` 辅助函数可用于生成[命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html)的 URL。命名路由允许你在生成 URL 时不与路由上定义的实际 URL 耦合。因此，如果路由的 URL 发生变化，你不需要修改对 `route` 函数的调用。例如，假设你的应用程序包含一个如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    // ...
})->name('post.show');
```

要生成指向该路由的 URL，可以像这样使用 `route` 辅助函数：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 辅助函数也可以用于生成带多个参数的路由的 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    // ...
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

任何不对应于路由定义参数的额外数组元素都会被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

#### Eloquent 模型

你经常会使用 [Eloquent 模型](/topic/Laravel%2013.x/rwyl2kxvz8.html)的路由键（通常是主键）来生成 URL。因此，你可以将 Eloquent 模型作为参数值传递。`route` 辅助函数会自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

### 签名 URL

Laravel 允许你轻松地为命名路由创建"签名"URL。这些 URL 在查询字符串中附加了一个"签名"哈希，Laravel 可以通过它验证该 URL 自创建以来未被修改。签名 URL 对于那些公开可访问却又需要一层防护以抵御 URL 篡改的路由尤其有用。

例如，你可能会使用签名 URL 来实现一封通过电子邮件发送给客户的公开"取消订阅"链接。要为命名路由创建签名 URL，请使用 `URL` Facade 的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1]);
```

你可以通过向 `signedRoute` 方法提供 `absolute` 参数来将域名从签名 URL 哈希中排除：

```php
return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);
```

如果你想生成一个在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，它会确保编码在签名 URL 中的过期时间戳尚未超过：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->plus(minutes: 30), ['user' => 1]
);
```

#### 校验签名路由请求

要验证传入的 请求 是否具有有效签名，你应该在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用程序的前端向签名 URL 追加数据，例如在执行客户端分页时。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应忽略的 请求 查询参数。请记住，忽略参数意味着任何人都可以在 请求 上修改这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

除了使用传入的 请求 实例验证签名 URL 外，你还可以将 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/topic/Laravel%2013.x/rwyl2exvz8.html)分配给该路由。如果传入的 请求 没有有效签名，该中间件会自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

如果你的签名 URL 没有在 URL 哈希中包含域名，你应该向该中间件提供 `relative` 参数：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed:relative');
```

#### 响应无效的签名路由

当有人访问已过期的签名 URL 时，他们会收到一个对应 `403` HTTP 状态码的通用错误页面。不过，你可以通过在应用程序的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义一个自定义的"渲染"闭包来自定义此行为：

```php
use Illuminate\Routing\Exceptions\InvalidSignatureException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidSignatureException $e) {
        return response()->view('errors.link-expired', status: 403);
    });
})
```

## 控制器动作的 URL

`action` 函数用于生成给定控制器动作的 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果控制器方法接受路由参数，你可以将路由参数的关联数组作为该函数的第二个参数传递：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

## 流式 URI 对象

Laravel 的 `Uri` 类提供了一个便捷且流畅的接口，用于通过对象创建和操作 URI。该类封装了底层 League URI 包提供的功能，并与 Laravel 的 路由 系统无缝集成。

你可以使用静态方法轻松创建 `Uri` 实例：

```php
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvokableController;
use Illuminate\Support\Uri;

// 从给定字符串生成 URI 实例...
$uri = Uri::of('https://example.com/path');

// 为路径、命名路由或控制器动作生成 URI 实例...
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

一旦你拥有了 URI 实例，就可以流畅地修改它：

```php
$uri = Uri::of('https://example.com')
    ->withScheme('http')
    ->withHost('test.com')
    ->withPort(8000)
    ->withPath('/users')
    ->withQuery(['page' => 2])
    ->withFragment('section-1');
```

有关使用流式 URI 对象的更多信息，请参阅 [URI 文档](/topic/Laravel%2013.x/569x5d8yep.html)。

## 默认值

对于某些应用程序，你可能希望为某些 URL 参数指定请求范围的默认值。例如，假设你许多路由都定义了一个 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    // ...
})->name('post.index');
```

每次调用 `route` 辅助函数时都要传递 `locale` 会很麻烦。因此，你可以使用 `URL::defaults` 方法为该参数定义一个默认值，该值在当前 请求 期间始终被应用。你可能希望从[路由中间件](/topic/Laravel%2013.x/rwyl2exvz8.html)中调用此方法，以便你能访问当前 请求：

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
     * 处理传入的请求。
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

一旦为 `locale` 参数设置了默认值，你在使用 `route` 辅助函数生成 URL 时就不再需要传递其值。

#### URL 默认值与中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应该[提高设置 URL 默认值的路由中间件的优先级](/topic/Laravel%2013.x/rwyl2exvz8.html)，使其先于 Laravel 自身的 `SubstituteBindings` 中间件执行。你可以在应用程序的 `bootstrap/app.php` 文件中使用 `priority` 中间件方法来实现：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\SetDefaultLocaleForUrls::class,
    );
})
```