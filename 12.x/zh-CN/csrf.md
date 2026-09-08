# CSRF 防护

- [简介](#csrf-introduction)
- [防止 CSRF 请求](#preventing-csrf-requests)
    - [排除 URI](#csrf-excluding-uris)
- [X-CSRF-Token](#csrf-x-csrf-token)
- [X-XSRF-Token](#csrf-x-xsrf-token)

<a name="csrf-introduction"></a>
## 简介

跨站请求伪造（CSRF）是一种恶意利用手段，攻击者借此以已认证用户的名义执行未授权的操作。好在 Laravel 让保护应用免受[跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery)（CSRF）攻击变得轻而易举。

<a name="csrf-explanation"></a>
#### 漏洞原理说明

如果你对跨站请求伪造还不太熟悉，我们来讨论一个利用该漏洞的示例。假设你的应用有一个 `/user/email` 路由，接受 `POST` 请求来修改已认证用户的电子邮箱地址。通常，这个路由要求 `email` 输入字段中包含用户想要启用的新邮箱地址。

如果没有 CSRF 防护，恶意网站可以创建一个指向你应用 `/user/email` 路由的 HTML 表单，并提交恶意用户自己的邮箱地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

如果恶意网站在页面加载时自动提交该表单，那么恶意用户只需诱骗你应用中某个毫不知情的用户访问他们的网站，该用户在你应用中的邮箱地址就会被修改。

为了防止这种漏洞，我们需要检查每一个传入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求，验证其是否携带恶意应用无法访问的私密会话值。

<a name="preventing-csrf-requests"></a>
## 防止 CSRF 请求

Laravel 会为应用管理的每个活跃[用户会话](/docs/{{version}}/session)自动生成一个 CSRF「令牌」。此令牌用于验证发起请求的确实是已认证用户本人。由于该令牌存储在用户会话中，并且每次会话重新生成时都会变化，恶意应用无法访问它。

可以通过请求的 session 或者 `csrf_token` 辅助函数来访问当前会话的 CSRF 令牌：

```php
use Illuminate\Http\Request;

Route::get('/token', function (Request $request) {
    $token = $request->session()->token();

    $token = csrf_token();

    // ...
});
```

在应用中定义任何 "POST"、"PUT"、"PATCH" 或 "DELETE" 类型的 HTML 表单时，都应当在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件验证请求。为方便起见，你可以使用 `@csrf` Blade 指令来生成隐藏的令牌输入字段：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等价于... -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` [中间件](/docs/{{version}}/middleware)会自动验证请求输入中的令牌与会话中存储的令牌是否一致。当这两个令牌匹配时，我们就能确定发起请求的正是已认证用户本人。

<a name="csrf-tokens-and-spas"></a>
### CSRF 令牌与 SPA

如果你正在构建一个将 Laravel 用作 API 后端的 SPA，请查阅 [Laravel Sanctum 文档](/docs/{{version}}/sanctum)，了解如何进行 API 认证以及防范 CSRF 漏洞。

<a name="csrf-excluding-uris"></a>
### 从 CSRF 防护中排除 URI

有时你可能希望将一组 URI 排除在 CSRF 防护之外。例如，如果你使用 [Stripe](https://stripe.com) 处理支付并使用其 webhook 系统，就需要将 Stripe 的 webhook 处理路由排除在 CSRF 防护之外，因为 Stripe 并不知道要向你的路由发送什么 CSRF 令牌。

通常，你应当把这类路由放在 `web` 中间件组之外；Laravel 会对 `routes/web.php` 文件中的所有路由应用该中间件组。不过，你也可以在应用的 `bootstrap/app.php` 文件中，将特定路由的 URI 提供给 `validateCsrfTokens` 方法来排除它们：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
        'http://example.com/foo/bar',
        'http://example.com/foo/*',
    ]);
})
```

> [!NOTE]
> 为方便起见，在[运行测试](/docs/{{version}}/testing)时，所有路由的 CSRF 中间件都会自动禁用。

<a name="csrf-x-csrf-token"></a>
## X-CSRF-TOKEN

除了将 CSRF 令牌作为 POST 参数进行检查之外，默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken` 中间件还会检查 `X-CSRF-TOKEN` 请求头。例如，你可以将令牌存储在 HTML `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

接下来，你可以让 jQuery 之类的库自动将令牌添加到所有请求头中。这样，使用传统 JavaScript 技术的 AJAX 应用就能获得简单便捷的 CSRF 防护：

```js
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

<a name="csrf-x-xsrf-token"></a>
## X-XSRF-TOKEN

Laravel 会将当前的 CSRF 令牌存储在一个加密的 `XSRF-TOKEN` Cookie 中，框架生成的每个响应都会附带该 Cookie。你可以使用这个 Cookie 的值来设置 `X-XSRF-TOKEN` 请求头。

发送这个 Cookie 主要是为了方便开发者，因为某些 JavaScript 框架和库（例如 Angular 和 Axios）会在同源请求中自动将其值放入 `X-XSRF-TOKEN` 请求头。

> [!NOTE]
> 默认情况下，`resources/js/bootstrap.js` 文件中引入的 Axios HTTP 库会自动为你发送 `X-XSRF-TOKEN` 请求头。
