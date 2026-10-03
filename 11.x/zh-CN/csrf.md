# CSRF 保护

- [简介](#csrf-introduction)
- [阻止 CSRF 请求](#preventing-csrf-requests)
    - [排除 URI](#csrf-excluding-uris)
- [X-CSRF-Token](#csrf-x-csrf-token)
- [X-XSRF-Token](#csrf-x-xsrf-token)

<a name="csrf-introduction"></a>
## 简介

跨站请求伪造是一类恶意攻击手段，攻击者借已认证用户的身份执行未经授权的命令。幸运的是，Laravel 让保护应用免受[跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery)（CSRF）攻击变得非常简单。

<a name="csrf-explanation"></a>
#### 漏洞详解

如果你还不了解跨站请求伪造，我们先来讨论一个该漏洞被利用的示例。假设你的应用有一个 `/user/email` 路由，它接受 `POST` 请求来修改已认证用户的邮箱地址。这个路由很可能需要一个 `email` 输入字段，用来填写用户希望开始使用的邮箱地址。

如果没有 CSRF 保护，恶意网站可以创建一个指向你应用 `/user/email` 路由的 HTML 表单，并提交恶意用户自己的邮箱地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

如果恶意网站在页面加载时自动提交该表单，恶意用户只需诱骗你应用中毫无戒心的用户访问他们的网站，其邮箱地址就会被改成攻击者指定的地址。

要防范这个漏洞，我们需要检查每一个进入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求，看它是否携带了一个恶意应用无法访问的会话密钥。

<a name="preventing-csrf-requests"></a>
## 阻止 CSRF 请求

Laravel 会为应用管理的每个活跃[用户会话](/docs/{{version}}/session)自动生成一个 CSRF"令牌"。该令牌用于验证发出请求的确实就是那个已认证用户。由于这个令牌存放在用户会话中，并且每次会话重新生成时都会变化，恶意应用无法访问它。

当前会话的 CSRF 令牌可以通过请求的会话或 `csrf_token` 辅助函数获取：

```php
use Illuminate\Http\Request;

Route::get('/token', function (Request $request) {
    $token = $request->session()->token();

    $token = csrf_token();

    // ...
});
```

每当你在应用中定义"POST"、"PUT"、"PATCH"或"DELETE"的 HTML 表单时，都应该在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件能够校验该请求。为方便起见，你可以使用 `@csrf` Blade 指令生成这个隐藏的令牌输入框：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等价于…… -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

`Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` [中间件](/docs/{{version}}/middleware)默认包含在 `web` 中间件组中，它会自动验证请求输入中的令牌与会话中存储的令牌是否一致。当这两个令牌匹配时，我们就可以确认发起请求的正是那个已认证用户。

<a name="csrf-tokens-and-spas"></a>
### CSRF 令牌与 SPA

如果你正在构建一个以 Laravel 作为 API 后端的 SPA，应查阅 [Laravel Sanctum 文档](/docs/{{version}}/sanctum)，了解如何通过 API 进行认证以及如何防范 CSRF 漏洞。

<a name="csrf-excluding-uris"></a>
### 将 URI 排除在 CSRF 保护之外

有时你可能希望把一组 URI 排除在 CSRF 保护之外。例如，如果你使用 [Stripe](https://stripe.com) 处理支付并使用其 webhook 系统，就需要把 Stripe 的 webhook 处理路由排除在 CSRF 保护之外，因为 Stripe 并不知道该向你的路由发送什么 CSRF 令牌。

通常情况下，你应把这类路由放在 Laravel 为 `routes/web.php` 文件中所有路由应用 `web` 中间件组之外。不过，你也可以在应用的 `bootstrap/app.php` 文件中通过 `validateCsrfTokens` 方法提供特定路由的 URI，将它们排除掉：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
        'http://example.com/foo/bar',
        'http://example.com/foo/*',
    ]);
})
```

> [!NOTE]
> 为方便起见，在[运行测试](/docs/{{version}}/testing)时，CSRF 中间件会对所有路由自动禁用。

<a name="csrf-x-csrf-token"></a>
## X-CSRF-TOKEN

除了把 CSRF 令牌作为 POST 参数检查外，默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` 中间件还会检查 `X-CSRF-TOKEN` 请求头。例如，你可以把令牌存放到 HTML 的 `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

随后，你可以让 jQuery 之类的库自动把该令牌添加到所有请求头中。这为使用传统 JavaScript 技术的 AJAX 应用提供了简单方便的 CSRF 保护：

```js
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

<a name="csrf-x-xsrf-token"></a>
## X-XSRF-TOKEN

Laravel 会把当前 CSRF 令牌存储在一个加密的 `XSRF-TOKEN` Cookie 中，框架生成的每个响应都会带上该 Cookie。你可以用该 Cookie 的值来设置 `X-XSRF-TOKEN` 请求头。

发送这个 Cookie 主要是为了方便开发者，因为某些 JavaScript 框架和库（如 Angular 和 Axios）会在同源请求中自动把它的值放进 `X-XSRF-TOKEN` 请求头。

> [!NOTE]
> 默认情况下，`resources/js/bootstrap.js` 文件中已包含 Axios HTTP 库，它会自动为你发送 `X-XSRF-TOKEN` 请求头。
