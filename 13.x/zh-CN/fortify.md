# Laravel Fortify

- [简介](#introduction)
    - [什么是 Fortify？](#what-is-fortify)
    - [我何时应该使用 Fortify？](#when-should-i-use-fortify)
- [安装](#installation)
    - [Fortify 功能](#fortify-features)
    - [禁用视图](#disabling-views)
- [认证](#authentication)
    - [自定义用户认证](#customizing-user-authentication)
    - [自定义认证管道](#customizing-the-authentication-pipeline)
    - [自定义重定向](#customizing-authentication-redirects)
- [双因素认证](#two-factor-authentication)
    - [启用双因素认证](#enabling-two-factor-authentication)
    - [使用双因素认证进行认证](#authenticating-with-two-factor-authentication)
    - [禁用双因素认证](#disabling-two-factor-authentication)
- [Passkey](#passkeys)
    - [启用 Passkey](#enabling-passkeys)
    - [JavaScript 客户端](#passkeys-javascript-client)
    - [使用 Passkey 进行认证](#authenticating-with-passkeys)
    - [使用 Passkey 确认密码](#confirming-password-with-passkeys)
    - [注册 Passkey](#registering-passkeys)
    - [删除 Passkey](#deleting-passkeys)
- [注册](#registration)
    - [自定义注册](#customizing-registration)
- [密码重置](#password-reset)
    - [请求密码重置链接](#requesting-a-password-reset-link)
    - [重置密码](#resetting-the-password)
    - [自定义密码重置](#customizing-password-resets)
- [邮箱验证](#email-verification)
    - [保护路由](#protecting-routes)
- [密码确认](#password-confirmation)

<a name="introduction"></a>
## 简介

[Laravel Fortify](https://github.com/laravel/fortify) 是 Laravel 的一个与前端无关的认证后端实现。Fortify 注册了实现 Laravel 全部认证功能（包括登录、注册、密码重置、邮箱验证等）所需的路由和控制器。安装 Fortify 后，你可以运行 `route:list` Artisan 命令来查看 Fortify 注册的路由。

由于 Fortify 不提供自己的用户界面，它旨在与你自己的用户界面配合使用，由界面向它注册的路由发起请求。在本文档的余下部分，我们将准确说明如何向这些路由发起请求。

> [!NOTE]
> 请记住，Fortify 是一个旨在帮助你快速实现 Laravel 认证功能的包。**你并不需要使用它。** 你始终可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 以及 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，自由地与 Laravel 的认证服务手动交互。

<a name="what-is-fortify"></a>
### 什么是 Fortify？

如前所述，Laravel Fortify 是 Laravel 的一个与前端无关的认证后端实现。Fortify 注册了实现 Laravel 全部认证功能（包括登录、注册、密码重置、邮箱验证等）所需的路由和控制器。

**你并不需要使用 Fortify 才能使用 Laravel 的认证功能。** 你始终可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 以及 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，自由地与 Laravel 的认证服务手动交互。

如果你是 Laravel 的新手，可以了解一下[我们的应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的应用入门套件内部使用 Fortify，为你的应用提供包含使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面的认证脚手架。这能让你学习和熟悉 Laravel 的认证功能。

Laravel Fortify 本质上提取了我们应用入门套件的路由和控制器，并将其作为一个不包含用户界面的包提供。这样，你仍然可以快速搭建应用认证层的后端实现，而不必受限于任何特定的前端偏好。

<a name="when-should-i-use-fortify"></a>
### 我何时应该使用 Fortify？

你可能想知道什么时候适合使用 Laravel Fortify。首先，如果你正在使用 Laravel 的某个[应用入门套件](/docs/{{version}}/starter-kits)，就不需要安装 Laravel Fortify，因为所有 Laravel 应用入门套件都使用 Fortify，并且已经提供了完整的认证实现。

如果你没有使用应用入门套件，而你的应用需要认证功能，你有两种选择：手动实现应用的认证功能，或者使用 Laravel Fortify 来提供这些功能的后端实现。

如果你选择安装 Fortify，你的用户界面将向本文档中详述的 Fortify 认证路由发起请求，以完成用户认证和注册。

如果你选择不使用 Fortify，而是手动与 Laravel 的认证服务交互，可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 以及 [邮箱验证](/docs/{{version}}/verification) 文档中的说明进行。

<a name="laravel-fortify-and-laravel-sanctum"></a>
#### Laravel Fortify 与 Laravel Sanctum

一些开发者会对 [Laravel Sanctum](/docs/{{version}}/sanctum) 与 Laravel Fortify 之间的区别感到困惑。由于这两个包解决的是两个不同但相关的问题，Laravel Fortify 和 Laravel Sanctum 并不是互斥或相互竞争的包。

Laravel Sanctum 只关心管理 API 令牌，以及使用会话 Cookie 或令牌对已有用户进行认证。Sanctum 不提供任何处理用户注册、密码重置等功能的路由。

如果你试图为一个提供 API 或作为单页应用（SPA）后端的应用手动构建认证层，完全有可能同时用到 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话认证）。

<a name="installation"></a>
## 安装

开始之前，使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

该命令会将 Fortify 的 actions 发布到你的 `app/Actions` 目录（如果该目录不存在则会创建）。此外，还会发布 `FortifyServiceProvider`、配置文件以及所有必要的数据库迁移。

接下来，你应该迁移数据库：

```shell
php artisan migrate
```

<a name="fortify-features"></a>
### Fortify 功能

`fortify` 配置文件中包含一个 `features` 配置数组。该数组定义了 Fortify 默认会暴露哪些后端路由 / 功能。我们建议你只启用以下功能，这些是大多数 Laravel 应用提供的基础认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

<a name="disabling-views"></a>
### 禁用视图

默认情况下，Fortify 定义了用于返回视图的路由，例如登录界面或注册界面。不过，如果你正在构建一个由 JavaScript 驱动的单页应用，可能不需要这些路由。因此，你可以将应用 `config/fortify.php` 配置文件中的 `views` 配置值设为 `false`，从而完全禁用这些路由：

```php
'views' => false,
```

<a name="disabling-views-and-password-reset"></a>
#### 禁用视图与密码重置

如果你选择禁用 Fortify 的视图，并且你将为应用实现密码重置功能，你仍然应该定义一个名为 `password.reset` 的路由，负责显示应用的 "重置密码" 视图。这是必要的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知会通过 `password.reset` 命名路由来生成密码重置 URL。

<a name="authentication"></a>
## 认证

开始之前，我们需要告诉 Fortify 如何返回我们的 "登录" 视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一套已经为你完成的 Laravel 认证功能的前端实现，应该使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有认证视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法。Fortify 会负责定义返回该视图的 `/login` 路由：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::loginView(function () {
        return view('auth.login');
    });

    // ...
}
```

你的登录模板应该包含一个向 `/login` 发起 POST 请求的表单。`/login` 端点期望接收一个字符串类型的 `email` / `username` 以及一个 `password`。email / username 字段的名称应与 `config/fortify.php` 配置文件中的 `username` 值一致。此外，还可以提供一个布尔类型的 `remember` 字段，表示用户希望使用 Laravel 提供的 "记住我" 功能。

如果登录尝试成功，Fortify 会将你重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。

如果请求未成功，用户会被重定向回登录界面，并且你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors) 获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。

<a name="customizing-user-authentication"></a>
### 自定义用户认证

Fortify 会根据提供的凭据以及为应用配置的认证看守器（guard），自动检索并认证用户。不过，有时你可能希望对登录凭据的认证方式和用户的检索方式进行完全自定义。幸好，Fortify 允许你通过 `Fortify::authenticateUsing` 方法轻松实现这一点。

该方法接受一个接收传入 HTTP 请求的闭包。该闭包负责验证附加到请求上的登录凭据，并返回关联的用户实例。如果凭据无效或找不到用户，闭包应返回 `null` 或 `false`。通常，该方法应该在你的 `FortifyServiceProvider` 的 `boot` 方法中调用：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::authenticateUsing(function (Request $request) {
        $user = User::where('email', $request->email)->first();

        if ($user &&
            Hash::check($request->password, $user->password)) {
            return $user;
        }
    });

    // ...
}
```

<a name="authentication-guard"></a>
#### 认证看守器

你可以在应用的 `fortify` 配置文件中自定义 Fortify 使用的认证看守器。不过，你应确保所配置的看守器是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果你试图使用 Laravel Fortify 来认证一个 SPA，应该将 Laravel 默认的 `web` 看守器与 [Laravel Sanctum](https://laravel.com/docs/sanctum) 结合使用。

<a name="customizing-the-authentication-pipeline"></a>
### 自定义认证管道

Laravel Fortify 通过一个由可调用类组成的管道来认证登录请求。如果你愿意，可以定义一组自定义的类，登录请求会经过该管道。每个类都应有一个 `__invoke` 方法，该方法接收传入的 `Illuminate\Http\Request` 实例，并且像[中间件](/docs/{{version}}/middleware)一样，接收一个 `$next` 变量，调用它以将请求传递给管道中的下一个类。

要定义你的自定义管道，可以使用 `Fortify::authenticateThrough` 方法。该方法接受一个闭包，该闭包应返回登录请求要经过的类数组。通常，该方法应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用。

下面的示例包含了默认的管道定义，你可以将其作为进行自定义修改的起点：

```php
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

Fortify::authenticateThrough(function (Request $request) {
    return array_filter([
            config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
            config('fortify.lowercase_usernames') ? CanonicalizeUsername::class : null,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
    ]);
});
```

#### 认证限流

默认情况下，Fortify 会使用 `EnsureLoginIsNotThrottled` 中间件对认证尝试进行限流。该中间件会对用户名与 IP 地址组合唯一的尝试进行限流。

某些应用可能需要不同的限流方式，例如仅按 IP 地址限流。因此，Fortify 允许你通过 `fortify.limiters.login` 配置选项指定自己的[限流器](/docs/{{version}}/routing#rate-limiting)。当然，该配置选项位于应用的 `config/fortify.php` 配置文件中。

> [!NOTE]
> 结合使用限流、[双因素认证](/docs/{{version}}/fortify#two-factor-authentication) 以及外部 Web 应用防火墙（WAF），将为你的合法应用用户提供最强大的防护。

<a name="customizing-authentication-redirects"></a>
### 自定义重定向

如果登录尝试成功，Fortify 会将你重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。用户注销应用后，会被重定向到 `/` URI。

如果你需要对此行为进行高级自定义，可以将 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel [服务容器](/docs/{{version}}/container) 中。通常，这应该在应用 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

```php
use Laravel\Fortify\Contracts\LogoutResponse;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    $this->app->instance(LogoutResponse::class, new class implements LogoutResponse {
        public function toResponse($request)
        {
            return redirect('/');
        }
    });
}
```

<a name="two-factor-authentication"></a>
## 双因素认证

当 Fortify 的双因素认证功能启用时，用户需要在认证过程中输入一个六位数字令牌。该令牌使用基于时间的一次性密码（TOTP）生成，可从任何兼容 TOTP 的移动认证应用（如 Google Authenticator）中获取。

开始之前，你应首先确保应用的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use Notifiable, TwoFactorAuthenticatable;
}
```

接下来，你应该在应用中构建一个界面，让用户能够管理自己的双因素认证设置。该界面应允许用户启用和禁用双因素认证，以及重新生成自己的双因素认证恢复码。

> 默认情况下，`fortify` 配置文件的 `features` 数组指示 Fortify 的双因素认证设置在修改前需要进行密码确认。因此，在继续之前，你的应用应该实现 Fortify 的[密码确认](#password-confirmation)功能。

<a name="enabling-two-factor-authentication"></a>
### 启用双因素认证

要开始启用双因素认证，你的应用应向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户会被重定向回之前的 URL，并且 `status` 会话变量会被设为 `two-factor-authentication-enabled`。你可以在模板中检测这个 `status` 会话变量来显示相应的成功消息。如果请求是 XHR 请求，则会返回 `200` HTTP 响应。

选择启用双因素认证后，用户仍然必须提供一个有效的双因素认证码来 "确认" 他们的双因素认证配置。因此，你的 "成功" 消息应该提示用户仍需确认双因素认证：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two-factor authentication below.
    </div>
@endif
```

接下来，你应该显示双因素认证二维码，供用户扫描到他们的认证应用中。如果你使用 Blade 渲染应用的前端，可以使用用户实例上的 `twoFactorQrCodeSvg` 方法获取二维码 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-qr-code` 端点发起 XHR GET 请求，以获取用户的双因素认证二维码。该端点会返回一个包含 `svg` 键的 JSON 对象。

<a name="confirming-two-factor-authentication"></a>
#### 确认双因素认证

除了显示用户的双因素认证二维码外，你还应该提供一个文本输入框，让用户可以提供有效的认证码来 "确认" 他们的双因素认证配置。该认证码应通过向 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点发起的 POST 请求提供给 Laravel 应用。

如果请求成功，用户会被重定向回之前的 URL，并且 `status` 会话变量会被设为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two-factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果向双因素认证确认端点的请求是通过 XHR 请求发起的，则会返回 `200` HTTP 响应。

<a name="displaying-the-recovery-codes"></a>
#### 显示恢复码

你还应该显示用户的双因素恢复码。这些恢复码允许用户在丢失移动设备访问权限时进行认证。如果你使用 Blade 渲染应用的前端，可以通过已认证的用户实例访问恢复码：

```php
(array) $request->user()->recoveryCodes()
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-recovery-codes` 端点发起 XHR GET 请求。该端点会返回一个包含用户恢复码的 JSON 数组。

要重新生成用户的恢复码，你的应用应该向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

<a name="authenticating-with-two-factor-authentication"></a>
### 使用双因素认证进行认证

在认证过程中，Fortify 会自动将用户重定向到应用的双因素认证挑战界面。不过，如果你的应用发起的是 XHR 登录请求，成功认证尝试后返回的 JSON 响应会包含一个带有 `two_factor` 布尔属性的 JSON 对象。你应该检查这个值，以判断是否需要重定向到应用的双因素认证挑战界面。

要开始实现双因素认证功能，我们需要告诉 Fortify 如何返回我们的双因素认证挑战视图。Fortify 所有认证视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::twoFactorChallengeView(function () {
        return view('auth.two-factor-challenge');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/two-factor-challenge` 路由。你的 `two-factor-challenge` 模板应该包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 操作期望接收一个 `code` 字段（包含有效的 TOTP 令牌）或一个 `recovery_code` 字段（包含用户的一个恢复码）。

如果登录尝试成功，Fortify 会将用户重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，则会返回 204 HTTP 响应。

如果请求未成功，用户会被重定向回双因素挑战界面，并且你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors) 获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。

<a name="disabling-two-factor-authentication"></a>
### 禁用双因素认证

要禁用双因素认证，你的应用应该向 `/user/two-factor-authentication` 端点发起 DELETE 请求。请记住，Fortify 的双因素认证端点在被调用之前需要进行[密码确认](#password-confirmation)。

<a name="passkeys"></a>
## Passkey

Fortify 支持使用 WebAuthn 的 Passkey 认证。Passkey 允许用户使用平台认证器（如 Face ID、Touch ID、Windows Hello 或硬件安全密钥）在没有密码的情况下进行认证。

<a name="enabling-passkeys"></a>
### 启用 Passkey

开始之前，确保应用的 `fortify` 配置文件中启用了 `passkeys` 功能：

```php
use Laravel\Fortify\Features;

'features' => [
    // ...
    Features::passkeys([
        'confirmPassword' => true,
    ]),
],
```

`confirmPassword` 选项决定是否要求 Fortify 在 Passkey 注册或删除之前进行[密码确认](#password-confirmation)。

接下来，确保应用的 `App\Models\User` 模型实现了 `Laravel\Fortify\Contracts\PasskeyUser` 并使用了 `Laravel\Fortify\PasskeyAuthenticatable` trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;

class User extends Authenticatable implements PasskeyUser
{
    use Notifiable, PasskeyAuthenticatable;
}
```

Fortify 的 passkeys 配置选项可以使用应用 `config/fortify.php` 文件中的 `passkeys` 配置数组进行自定义：

```php
'passkeys' => [
    'relying_party_id' => parse_url(config('app.url'), PHP_URL_HOST),
    'allowed_origins' => [config('app.url')],
    'user_handle_secret' => config('app.key'),
    'timeout' => 60000,
],
```

> [!NOTE]
> Fortify 封装了 `laravel/passkeys` Composer 包，并为你做好了配置。如果你使用 Fortify 的 passkeys 功能，应该通过应用的 `config/fortify.php` 文件来配置 passkeys。你无需发布 `laravel/passkeys` 配置文件，在那里定义的任何值都会被 Fortify 覆盖。

`relying_party_id` 应与你的应用域名一致。`allowed_origins` 数组列出了可以完成 Passkey 注册与认证的浏览器源。`user_handle_secret` 用于派生不透明的用户标识符，确保同一用户在 Passkey 注册中被识别出来。`timeout` 选项控制 Passkey 注册与认证操作可以保持活跃的时长。

Fortify 为它的 Passkey 登录、确认和注册路由应用了一个专用的 passkeys 限流器。如果需要，你可以使用 `fortify.limiters.passkeys` 配置选项及相应的 `RateLimiter::for(...)` 定义来自定义它。

<a name="passkeys-javascript-client"></a>
### JavaScript 客户端

如果你正在构建自定义前端（包括带有浏览器端脚本的 Blade 应用），可以使用官方的 [`@laravel/passkeys`](https://www.npmjs.com/package/@laravel/passkeys) 包。该包负责处理浏览器的 WebAuthn 流程，并向 Fortify 的 Passkey 端点发起请求。

通过 npm 安装该包：

```shell
npm install @laravel/passkeys
```

然后，你可以从前端发起 Passkey 注册和验证：

```js
import { Passkeys } from "@laravel/passkeys";

await Passkeys.register({ name: "MacBook Pro" });
await Passkeys.verify();
```

如果你的应用使用自定义的 Passkey 端点 URI，你可以按调用逐个覆盖路由：

```js
await Passkeys.verify({
    routes: {
        options: "/passkeys/confirm/options",
        submit: "/passkeys/confirm",
    },
});

await Passkeys.register({
    name: "MacBook Pro",
    routes: {
        options: "/user/passkeys/options",
        submit: "/user/passkeys",
    },
});
```

该包还通过 `@laravel/passkeys/react`、`@laravel/passkeys/vue` 和 `@laravel/passkeys/svelte` 提供 React、Vue 和 Svelte 辅助函数。

<a name="authenticating-with-passkeys"></a>
### 使用 Passkey 进行认证

要使用 Passkey 认证用户，你的应用应该首先向 `/passkeys/login/options` 端点发起 GET 请求。该端点返回你的前端应传给 `navigator.credentials.get(...)` 的 WebAuthn 挑战选项。

浏览器返回凭据后，你的应用应该向 `/passkeys/login` 发起 POST 请求，携带凭据负载。你也可以包含一个布尔类型的 `remember` 字段。

如果请求成功，Fortify 会将用户登录到配置的看守器，并返回以下二者之一：

<div class="content-list" markdown="1">

- 针对标准请求，重定向到目标地址的响应。
- 针对 XHR 请求，包含带 `redirect` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="confirming-password-with-passkeys"></a>
### 使用 Passkey 确认密码

对于已认证的会话，Fortify 提供了 Passkey 确认端点，以满足 Laravel 对当前会话的密码确认要求。

要使用 Passkey 确认，你的应用应该首先向 `/passkeys/confirm/options` 发起 GET 请求。该端点返回你的前端应传给 `navigator.credentials.get(...)` 的 WebAuthn 挑战选项。

浏览器返回凭据后，你的应用应该向 `/passkeys/confirm` 发起 POST 请求，携带凭据负载。

如果请求成功，Fortify 会将当前会话标记为已通过密码确认，并返回以下二者之一：

<div class="content-list" markdown="1">

- 针对标准请求，重定向到目标地址的响应。
- 针对 XHR 请求，包含带 `redirect` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="registering-passkeys"></a>
### 注册 Passkey

要为已认证用户注册 Passkey，你的应用应该首先向 `/user/passkeys/options` 发起 GET 请求。该端点返回你的前端应传给 `navigator.credentials.create(...)` 的 WebAuthn 创建选项。

浏览器返回凭据后，你的应用应该向 `/user/passkeys` 发起 POST 请求，携带一个 `name` 字段以及一个包含由 `navigator.credentials.create(...)` 返回的序列化 [`PublicKeyCredential`](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential) 对象的 `credential` 字段。

如果请求成功，Fortify 会返回以下二者之一：

<div class="content-list" markdown="1">

- 针对标准请求，重定向回的响应，会话中带有 `passkey-registered` 状态。
- 针对 XHR 请求，包含带 `status` 键的 JSON 负载，以及新注册的 Passkey 的 `id` 和 `name` 的 `200` HTTP 响应。

</div>

<a name="deleting-passkeys"></a>
### 删除 Passkey

要删除 Passkey，你的应用应该向 `/user/passkeys/{passkey}` 发起 DELETE 请求。

如果请求成功，Fortify 会返回以下二者之一：

<div class="content-list" markdown="1">

- 针对标准请求，重定向回的响应，会话中带有 `passkey-deleted` 状态。
- 针对 XHR 请求，包含带 `status` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="registration"></a>
## 注册

要开始实现应用的注册功能，我们需要告诉 Fortify 如何返回我们的 "注册" 视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一套已经为你完成的 Laravel 认证功能的前端实现，应该使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 所有视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::registerView(function () {
        return view('auth.register');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/register` 路由。你的 `register` 模板应该包含一个向 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点期望接收字符串类型的 `name`、字符串类型的邮箱地址 / 用户名、`password` 以及 `password_confirmation` 字段。email / username 字段的名称应与应用 `fortify` 配置文件中定义的 `username` 配置值一致。

如果注册尝试成功，Fortify 会将用户重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果请求是 XHR 请求，则会返回 201 HTTP 响应。

如果请求未成功，用户会被重定向回注册界面，并且你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors) 获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。

<a name="customizing-registration"></a>
### 自定义注册

用户验证和创建过程可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` action 进行自定义。

<a name="password-reset"></a>
## 密码重置

<a name="requesting-a-password-reset-link"></a>
### 请求密码重置链接

要开始实现应用的密码重置功能，我们需要告诉 Fortify 如何返回我们的 "忘记密码" 视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一套已经为你完成的 Laravel 认证功能的前端实现，应该使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 所有视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::requestPasswordResetLinkView(function () {
        return view('auth.forgot-password');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/forgot-password` 端点。你的 `forgot-password` 模板应该包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点期望接收一个字符串类型的 `email` 字段。该字段 / 数据库列的名称应与应用 `fortify` 配置文件中定义的 `email` 配置值一致。

<a name="handling-the-password-reset-link-request-response"></a>
#### 处理密码重置链接请求响应

如果密码重置链接请求成功，Fortify 会将用户重定向回 `/forgot-password` 端点，并向用户发送一封包含安全链接的邮件，用户可用该链接重置密码。如果请求是 XHR 请求，则会返回 200 HTTP 响应。

在成功请求后被重定向回 `/forgot-password` 端点时，`status` 会话变量可用于显示密码重置链接请求尝试的状态。

`$status` 会话变量的值会与应用中 `passwords` [语言文件](/docs/{{version}}/localization) 内定义的某个翻译字符串一致。如果你想自定义该值但尚未发布 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令来完成：

```html
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求未成功，用户会被重定向回请求密码重置链接界面，并且你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors) 获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。

<a name="resetting-the-password"></a>
### 重置密码

要完成应用的密码重置功能实现，我们需要告诉 Fortify 如何返回我们的 "重置密码" 视图。

Fortify 所有视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::resetPasswordView(function (Request $request) {
        return view('auth.reset-password', ['request' => $request]);
    });

    // ...
}
```

Fortify 会负责定义显示该视图的路由。你的 `reset-password` 模板应该包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点期望接收一个字符串类型的 `email` 字段、一个 `password` 字段、一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段，其值为 `request()->route('token')`。"email" 字段 / 数据库列的名称应与应用 `fortify` 配置文件中定义的 `email` 配置值一致。

<a name="handling-the-password-reset-response"></a>
#### 处理密码重置响应

如果密码重置请求成功，Fortify 会重定向回 `/login` 路由，以便用户使用新密码登录。此外，会设置一个 `status` 会话变量，以便你在登录界面上显示重置成功的提示：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，则会返回 200 HTTP 响应。

如果请求未成功，用户会被重定向回重置密码界面，并且你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors) 获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。

<a name="customizing-password-resets"></a>
### 自定义密码重置

密码重置过程可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` action 进行自定义。

<a name="email-verification"></a>
## 邮箱验证

注册后，你可能希望用户在继续访问你的应用之前先验证其邮箱地址。开始之前，确保 `fortify` 配置文件的 `features` 数组中启用了 `emailVerification` 功能。接下来，你应该确保 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两步设置后，新注册的用户会收到一封提示其验证邮箱地址所有权的邮件。不过，我们需要告诉 Fortify 如何显示邮箱验证界面，该界面会提示用户去点击邮件中的验证链接。

Fortify 所有视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::verifyEmailView(function () {
        return view('auth.verify-email');
    });

    // ...
}
```

当用户被 Laravel 内置的 `verified` 中间件重定向到 `/email/verify` 端点时，Fortify 会负责定义显示该视图的路由。

你的 `verify-email` 模板应该包含一条提示信息，引导用户点击发送到其邮箱地址的邮箱验证链接。

<a name="resending-email-verification-links"></a>
#### 重新发送邮箱验证链接

如果你愿意，可以在应用的 `verify-email` 模板中添加一个按钮，用于触发向 `/email/verification-notification` 端点发起 POST 请求。当该端点收到请求时，会向用户重新发送一封验证邮件链接，以便用户在上一封链接被意外删除或丢失时获取新的验证链接。

如果重新发送验证链接邮件的请求成功，Fortify 会将用户重定向回 `/email/verify` 端点，并带有一个 `status` 会话变量，让你可以向用户显示一条提示信息，告知操作成功。如果请求是 XHR 请求，则会返回 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

<a name="protecting-routes"></a>
### 保护路由

要指定某个路由或一组路由要求用户已验证其邮箱地址，你应该为该路由附加 Laravel 内置的 `verified` 中间件。 `verified` 中间件别名由 Laravel 自动注册，是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

<a name="password-confirmation"></a>
## 密码确认

在构建应用时，你可能会偶尔遇到一些操作，要求在执行之前用户确认其密码。通常，这些路由由 Laravel 内置的 `password.confirm` 中间件保护。

要开始实现密码确认功能，我们需要告诉 Fortify 如何返回应用的 "密码确认" 视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一套已经为你完成的 Laravel 认证功能的前端实现，应该使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 所有视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相关方法进行自定义。通常，你应该在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Fortify::confirmPasswordView(function () {
        return view('auth.confirm-password');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/user/confirm-password` 端点。你的 `confirm-password` 模板应该包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点期望接收一个包含用户当前密码的 `password` 字段。

如果密码与用户的当前密码匹配，Fortify 会将用户重定向回其试图访问的路由。如果请求是 XHR 请求，则会返回 201 HTTP 响应。

如果请求未成功，用户会被重定向回密码确认界面，并且你可以通过共享的 `$errors` Blade 模板变量获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一起返回。
