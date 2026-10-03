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

Laravel 提供了若干辅助方法，帮助你为应用生成 URL。这些辅助方法在模板和 API 响应中构建链接，或生成指向应用中其他部分的重定向响应时尤其有用。

<a name="the-basics"></a>
## 基础

<a name="generating-urls"></a>
### 生成 URL

`url` 辅助方法可用于为你的应用生成任意 URL。生成的 URL 会自动使用应用当前所处理请求的协议（HTTP 或 HTTPS）和主机：

    $post = App\Models\Post::find(1);

    echo url("/posts/{$post->id}");

    // http://example.com/posts/1

若要生成带查询字符串参数的 URL，可以使用 `query` 方法：

    echo url()->query('/posts', ['search' => 'Laravel']);

    // https://example.com/posts?search=Laravel

    echo url()->query('/posts?sort=latest', ['search' => 'Laravel']);

    // http://example.com/posts?sort=latest&search=Laravel

提供路径中已存在的查询字符串参数会覆盖其原有值：

    echo url()->query('/posts?sort=latest', ['sort' => 'oldest']);

    // http://example.com/posts?sort=oldest

你也可以把值数组作为查询参数传入。这些值会在生成的 URL 中被正确加键和编码：

    echo $url = url()->query('/posts', ['columns' => ['title', 'body']]);

    // http://example.com/posts?columns%5B0%5D=title&columns%5B1%5D=body

    echo urldecode($url);

    // http://example.com/posts?columns[0]=title&columns[1]=body

<a name="accessing-the-current-url"></a>
### 访问当前 URL

如果不向 `url` 辅助方法提供路径，它会返回一个 `Illuminate\Routing\UrlGenerator` 实例，让你能够访问有关当前 URL 的信息：

    // 获取不含查询字符串的当前 URL……
    echo url()->current();

    // 获取包含查询字符串的当前 URL……
    echo url()->full();

    // 获取上一次请求的完整 URL……
    echo url()->previous();

    // 获取上一次请求的路径……
    echo url()->previousPath();

这些方法也可以通过 `URL` [Facade](/docs/{{version}}/facades)访问：

    use Illuminate\Support\Facades\URL;

    echo URL::current();

<a name="urls-for-named-routes"></a>
## 命名路由的 URL

`route` 辅助方法可用于生成指向[命名路由](/docs/{{version}}/routing#named-routes)的 URL。命名路由让你无需与路由上定义的实际 URL 耦合即可生成 URL。因此，即使路由的 URL 发生变化，也不需要修改对 `route` 函数的调用。例如，假设你的应用包含如下定义的路由：

    Route::get('/post/{post}', function (Post $post) {
        // ...
    })->name('post.show');

若要生成指向该路由的 URL，可以这样使用 `route` 辅助方法：

    echo route('post.show', ['post' => 1]);

    // http://example.com/post/1

当然，`route` 辅助方法也可用于为带多个参数的路由生成 URL：

    Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
        // ...
    })->name('comment.show');

    echo route('comment.show', ['post' => 1, 'comment' => 3]);

    // http://example.com/post/1/comment/3

任何不对应路由定义参数的额外数组元素，都会被添加到 URL 的查询字符串中：

    echo route('post.show', ['post' => 1, 'search' => 'rocket']);

    // http://example.com/post/1?search=rocket

<a name="eloquent-models"></a>
#### Eloquent 模型

你经常需要使用 [Eloquent 模型](/docs/{{version}}/eloquent)的路由键（通常是主键）来生成 URL。为此，你可以把 Eloquent 模型作为参数值传入。`route` 辅助方法会自动提取模型的路由键：

    echo route('post.show', ['post' => $post]);

<a name="signed-urls"></a>
### 签名 URL

Laravel 让你轻松为命名路由创建"签名" URL。这些 URL 的查询字符串末尾会附加一个"签名"哈希，使 Laravel 能够验证该 URL 自创建以来未被篡改。签名 URL 对那些公开可访问、但需要一层防 URL 篡改保护的路由尤其有用。

例如，你可能希望使用签名 URL 实现一个通过邮件发送给客户的公开"退订"链接。若要为命名路由创建签名 URL，请使用 `URL` Facade 的 `signedRoute` 方法：

    use Illuminate\Support\Facades\URL;

    return URL::signedRoute('unsubscribe', ['user' => 1]);

你可以向 `signedRoute` 方法提供 `absolute` 参数，把域名从签名 URL 哈希中排除：

    return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);

如果你想生成在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 校验一个临时签名路由 URL 时，它会确保编码到该签名 URL 中的过期时间戳尚未到期：

    use Illuminate\Support\Facades\URL;

    return URL::temporarySignedRoute(
        'unsubscribe', now()->addMinutes(30), ['user' => 1]
    );

<a name="validating-signed-route-requests"></a>
#### 校验签名路由请求

要验证传入请求是否具有有效签名，你应在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

    use Illuminate\Http\Request;

    Route::get('/unsubscribe/{user}', function (Request $request) {
        if (! $request->hasValidSignature()) {
            abort(401);
        }

        // ...
    })->name('unsubscribe');

有时你可能需要允许应用的前端向签名 URL 追加数据，比如在执行客户端分页时。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在校验签名 URL 时应忽略的请求查询参数。请记住，忽略参数意味着任何人都可以修改请求中的这些参数：

    if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
        abort(401);
    }

除了使用传入的请求实例校验签名 URL，你也可以把 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/docs/{{version}}/middleware)分配给该路由。如果传入请求不具有有效签名，该中间件会自动返回 `403` HTTP 响应：

    Route::post('/unsubscribe/{user}', function (Request $request) {
        // ...
    })->name('unsubscribe')->middleware('signed');

如果你的签名 URL 未在 URL 哈希中包含域名，就应当向该中间件提供 `relative` 参数：

    Route::post('/unsubscribe/{user}', function (Request $request) {
        // ...
    })->name('unsubscribe')->middleware('signed:relative');

<a name="responding-to-invalid-signed-routes"></a>
#### 响应无效的签名路由

当有人访问已过期的签名 URL 时，会看到一个针对 `403` HTTP 状态码的通用错误页面。不过，你可以在应用的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义自定义的"渲染"闭包，以自定义该行为：

    use Illuminate\Routing\Exceptions\InvalidSignatureException;

    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (InvalidSignatureException $e) {
            return response()->view('errors.link-expired', status: 403);
        });
    })

<a name="urls-for-controller-actions"></a>
## 控制器动作的 URL

`action` 函数为给定的控制器动作生成 URL：

    use App\Http\Controllers\HomeController;

    $url = action([HomeController::class, 'index']);

如果控制器方法接受路由参数，你可以把路由参数的关联数组作为该函数的第二个参数传入：

    $url = action([UserController::class, 'profile'], ['id' => 1]);

<a name="default-values"></a>
## 默认值

对某些应用，你可能希望为特定 URL 参数指定请求级的默认值。例如，假设你的许多路由都定义了一个 `{locale}` 参数：

    Route::get('/{locale}/posts', function () {
        // ...
    })->name('post.index');

每次调用 `route` 辅助方法都传入 `locale` 会很麻烦。因此，你可以使用 `URL::defaults` 方法为该参数定义一个默认值，它在当前请求中始终生效。你可以考虑从[路由中间件](/docs/{{version}}/middleware#assigning-middleware-to-routes)中调用该方法，这样就能访问当前请求：

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

一旦设置了 `locale` 参数的默认值，通过 `route` 辅助方法生成 URL 时就不再需要传入它的值。

<a name="url-defaults-middleware-priority"></a>
#### URL 默认值与中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应当[提高设置 URL 默认值的中间件的优先级](/docs/{{version}}/middleware#sorting-middleware)，使其在 Laravel 自带的 `SubstituteBindings` 中间件之前执行。你可以在应用的 `bootstrap/app.php` 文件中使用 `priority` 中间件方法来实现：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\SetDefaultLocaleForUrls::class,
    );
})
```
