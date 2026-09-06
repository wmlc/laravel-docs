# CSRF 保护

## 简介

跨站请求伪造（cross-site request forgery）是一种恶意利用手段，攻击者借此以已认证用户的身份执行未授权的命令。值得庆幸的是，Laravel 让保护你的应用免受[跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery)（CSRF）攻击变得轻而易举。

#### 漏洞原理解释

如果你还不熟悉跨站请求伪造，我们先来讨论一个该漏洞如何被利用的示例。假设你的应用有一个 `/user/email` 路由，它接受一个 `POST` 请求以更改已认证用户的邮箱地址。这个路由很可能期望一个名为 `email` 的输入字段包含用户想要启用的邮箱地址。

如果没有 CSRF 保护，恶意网站就可以创建一个指向你应用 `/user/email` 路由的 HTML 表单，并提交恶意用户自己的邮箱地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

如果恶意网站在页面加载时自动提交该表单，那么恶意用户只需引诱你应用中毫无戒备的用户访问其网站，用户的邮箱地址就会在你的应用中被更改。

为了防止这个漏洞，我们需要检查每一个进入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求，确认其携带一个恶意应用无法访问的会话密钥值。

## 阻止 CSRF 请求

默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` [中间件](/topic/Laravel%2013.x/rwyl2exvz8.html)，采用两层防护策略来保护你的应用免受跨站请求伪造攻击。

首先，该中间件会检查浏览器的 `Sec-Fetch-Site` 请求头。现代浏览器会在每个请求上自动设置这个请求头，指示请求是来自同源（same origin）、同站（same site）还是跨站（cross-site）来源。如果该请求头表明请求来自同源，则无需任何令牌验证即可立即放行。

如果来源验证未通过——例如因为请求来自不发送 `Sec-Fetch-Site` 请求头的旧版浏览器，或者连接不安全——中间件会回退到传统的 CSRF 令牌验证。

Laravel 会为应用管理的每个活跃[用户会话](/topic/Laravel%2013.x/2ev86noyor.html)自动生成一个 CSRF"令牌"。该令牌用于验证发出请求的用户就是真正在操作应用的用户。由于此令牌存储在用户的会话中，并在每次会话重新生成时随之改变，恶意应用无法访问它。

可以通过请求的会话或 `csrf_token` 辅助函数来获取当前会话的 CSRF 令牌：

```php
use Illuminate\Http\Request;

Route::get('/token', function (Request $request) {
    $token = $request->session()->token();

    $token = csrf_token();

    // ...
});
```

在你的应用中定义任意"POST"、"PUT"、"PATCH" 或 "DELETE" 类型的 HTML 表单时，都应当在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件能够验证请求。为方便起见，你可以使用 `@csrf` Blade 指令来生成该隐藏的令牌输入字段：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等价于... -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

#### CSRF 令牌与 SPA

如果你正在构建一个以 Laravel 作为 API 后端的 SPA，应当查阅 [Laravel Sanctum 文档](/topic/Laravel%2013.x/xq9zr3jvdo.html)，了解如何通过 API 进行认证以及防范 CSRF 漏洞的相关信息。

### 来源校验

如前所述，Laravel 的请求伪造中间件会首先检查 `Sec-Fetch-Site` 请求头，以确定请求是否来自同源。默认情况下，如果该检查未通过，中间件会回退到 CSRF 令牌验证。

但是，如果你希望仅依赖来源验证并完全禁用 CSRF 令牌回退，可以在应用的 `bootstrap/app.php` 文件中使用 `preventRequestForgery` 方法来实现：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(originOnly: true);
})
```

在使用仅来源验证模式时，未通过来源验证的请求将收到 `403` HTTP 响应，而不是通常与 CSRF 令牌不匹配相关的 `419` 响应。

> [!WARNING]
> `Sec-Fetch-Site` 请求头仅由浏览器在安全的（HTTPS）连接上发送。如果你的应用不是通过 HTTPS 提供服务，则来源验证不可用，中间件会回退到 CSRF 令牌验证。

如果你的应用需要接受来自子域名的请求（例如 `dashboard.example.com` 接受来自 `example.com` 的请求），除了同源请求之外，你还可以允许同站请求：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(allowSameSite: true);
})
```

### 从 CSRF 保护中排除 URI

有时你可能希望将一组 URI 排除在 CSRF 保护之外。例如，如果你使用 [Stripe](https://stripe.com) 处理付款并使用其 webhook 系统，就需要将你的 Stripe webhook 处理器路由排除在 CSRF 保护之外，因为 Stripe 并不知道该向你的路由发送什么 CSRF 令牌。

通常，你应当将这些类型的路由放在 Laravel 应用于 `routes/web.php` 文件内所有路由的 `web` 中间件组之外。不过，你也可以通过向应用的 `bootstrap/app.php` 文件中的 `preventRequestForgery` 方法提供 URI 来排除特定路由：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
        'http://example.com/foo/bar',
        'http://example.com/foo/*',
    ]);
})
```

> [!NOTE]
> 为方便起见，在[运行测试](/topic/Laravel%2013.x/e296oqw9q7.html)时，所有路由上的 CSRF 中间件都会自动禁用。

## X-CSRF-TOKEN

除了将 CSRF 令牌作为 POST 参数进行检查之外，`PreventRequestForgery` 中间件还会检查 `X-CSRF-TOKEN` 请求头。例如，你可以将令牌存储在一个 HTML `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

然后，你可以指示像 jQuery 这样的库自动将令牌添加到所有请求头中。对于使用旧版 JavaScript 技术的 AJAX 应用，这提供了一种简单、方便的 CSRF 保护：

```js
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

## X-XSRF-TOKEN

Laravel 会将当前的 CSRF 令牌存储在一个加密的 `XSRF-TOKEN` Cookie 中，该 Cookie 会随框架生成的每个响应一同返回。你可以使用这个 Cookie 值来设置 `X-XSRF-TOKEN` 请求头。

发送这个 Cookie 主要是出于开发便利，因为一些 JavaScript 框架和库（如 Angular 和 Axios）会在同源请求中自动将其值放入 `X-XSRF-TOKEN` 请求头。
