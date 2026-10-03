# CSRF 保护

- [简介](#csrf-introduction)
- [防止 CSRF 请求](#preventing-csrf-requests)
    - [排除 URI](#csrf-excluding-uris)
- [X-CSRF-Token](#csrf-x-csrf-token)
- [X-XSRF-Token](#csrf-x-xsrf-token)

<a name="csrf-introduction"></a>
## 简介

跨站请求伪造是一种恶意攻击方式，攻击者以已认证用户的名义执行未授权的操作。幸运的是，Laravel 让你能够轻松保护应用免受[跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery)（CSRF）攻击。

<a name="csrf-explanation"></a>
#### 漏洞原理说明

如果你对跨站请求伪造不太熟悉，我们来讨论一个该漏洞被利用的示例。假设你的应用有一个 `/user/email` 路由，接受 `POST` 请求来修改已认证用户的电子邮箱地址。该路由很可能期望一个 `email` 输入字段，包含用户希望使用的新邮箱地址。

如果没有 CSRF 保护，恶意网站可以创建一个 HTML 表单，指向你应用的 `/user/email` 路由，并提交恶意用户自己的邮箱地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

 如果恶意网站在页面加载时自动提交表单，恶意用户只需诱导你应用的无防备用户访问他们的网站，该用户在你应用中的邮箱地址就会被修改。

 为了防止这种漏洞，我们需要检查每一个传入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求，验证一个恶意应用无法访问的密钥会话值。

<a name="preventing-csrf-requests"></a>
## 防止 CSRF 请求

Laravel 为应用管理的每个活跃[用户会话](/docs/{{version}}/session)自动生成一个 CSRF「令牌」。该令牌用于验证已认证的用户是否是实际向应用发起请求的人。由于此令牌存储在用户会话中，并且每次会话重新生成时都会变化，恶意应用无法访问它。

当前会话的 CSRF 令牌可以通过请求的会话或 `csrf_token` 辅助函数来访问：

    use Illuminate\Http\Request;

    Route::get('/token', function (Request $request) {
        $token = $request->session()->token();

        $token = csrf_token();

        // ...
    });

在应用中定义 "POST"、"PUT"、"PATCH" 或 "DELETE" HTML 表单时，你应当在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件验证请求。为方便起见，你可以使用 `@csrf` Blade 指令来生成隐藏的令牌输入字段：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等价于... -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

`App\Http\Middleware\VerifyCsrfToken` [中间件](/docs/{{version}}/middleware)默认包含在 `web` 中间件组中，会自动验证请求输入中的令牌是否与会话中存储的令牌匹配。当这两个令牌匹配时，我们就知道发起请求的正是已认证用户。

<a name="csrf-tokens-and-spas"></a>
### CSRF 令牌与 SPA

如果你正在构建一个将 Laravel 用作 API 后端的 SPA（单页应用），应当查阅 [Laravel Sanctum 文档](/docs/{{version}}/sanctum)，了解如何进行 API 认证并防范 CSRF 漏洞。

<a name="csrf-excluding-uris"></a>
### 从 CSRF 保护中排除 URI

有时你可能希望将一组 URI 排除在 CSRF 保护之外。例如，如果你使用 [Stripe](https://stripe.com) 处理支付并使用其 webhook 系统，你需要将 Stripe webhook 处理路由排除在 CSRF 保护之外，因为 Stripe 不知道该向你的路由发送什么 CSRF 令牌。

通常，你应当将这类路由放在 `web` 中间件组之外，`App\Providers\RouteServiceProvider` 会将 `web` 中间件组应用于 `routes/web.php` 文件中的所有路由。不过，你也可以通过将路由的 URI 添加到 `VerifyCsrfToken` 中间件的 `$except` 属性来排除这些路由：

    <?php

    namespace App\Http\Middleware;

    use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

    class VerifyCsrfToken extends Middleware
    {
        /**
         * 需要从 CSRF 验证中排除的 URI。
         *
         * @var array
         */
        protected $except = [
            'stripe/*',
            'http://example.com/foo/bar',
            'http://example.com/foo/*',
        ];
    }

> **Note**
> 为方便起见，在[运行测试](/docs/{{version}}/testing)时，所有路由的 CSRF 中间件都会自动禁用。

<a name="csrf-x-csrf-token"></a>
## X-CSRF-TOKEN

除了将 CSRF 令牌作为 POST 参数检查之外，`App\Http\Middleware\VerifyCsrfToken` 中间件还会检查 `X-CSRF-TOKEN` 请求头。例如，你可以将令牌存储在 HTML `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

然后，你可以指示 jQuery 这样的库自动将令牌添加到所有请求头中。这为使用传统 JavaScript 技术的 AJAX 应用提供了简单、便捷的 CSRF 保护：

```js
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

<a name="csrf-x-xsrf-token"></a>
## X-XSRF-TOKEN

Laravel 将当前 CSRF 令牌存储在加密的 `XSRF-TOKEN` Cookie 中，该 Cookie 包含在框架生成的每个响应中。你可以使用 Cookie 值来设置 `X-XSRF-TOKEN` 请求头。

这个 Cookie 主要是为了方便开发者而发送的，因为一些 JavaScript 框架和库（如 Angular 和 Axios）会自动将其值放入同源请求的 `X-XSRF-TOKEN` 头中。

> **Note**
> 默认情况下，`resources/js/bootstrap.js` 文件包含了 Axios HTTP 库，它会自动为你发送 `X-XSRF-TOKEN` 头。
