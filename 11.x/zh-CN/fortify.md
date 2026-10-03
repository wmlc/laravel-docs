# Laravel Fortify

- [简介](#introduction)
    - [Fortify 是什么？](#what-is-fortify)
    - [我何时该使用 Fortify？](#when-should-i-use-fortify)
- [安装](#installation)
    - [Fortify 功能](#fortify-features)
    - [禁用视图](#disabling-views)
- [认证](#authentication)
    - [自定义用户认证](#customizing-user-authentication)
    - [自定义认证流程](#customizing-the-authentication-pipeline)
    - [自定义重定向](#customizing-authentication-redirects)
- [双因素认证](#two-factor-authentication)
    - [启用双因素认证](#enabling-two-factor-authentication)
    - [使用双因素认证进行认证](#authenticating-with-two-factor-authentication)
    - [禁用双因素认证](#disabling-two-factor-authentication)
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

[Laravel Fortify](https://github.com/laravel/fortify) 是一套与前端无关的 Laravel 认证后端实现。Fortify 会注册实现 Laravel 全部认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，你可以运行 `route:list` Artisan 命令，查看 Fortify 已注册的路由。

由于 Fortify 不提供自己的用户界面，它需要与你自己的用户界面配合使用，由你的界面向它注册的路由发起请求。本文档余下部分将详细讨论如何向这些路由发起请求。

> [!NOTE]
> 请记住，Fortify 是一个帮助你快速实现 Laravel 认证功能的包。**你并不强制要求使用它。** 你完全可以按照[认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明，动手与 Laravel 的认证服务交互。

<a name="what-is-fortify"></a>
### Fortify 是什么？

如前所述，Laravel Fortify 是一套与前端无关的 Laravel 认证后端实现。Fortify 会注册实现 Laravel 全部认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**你并不需要使用 Fortify 才能使用 Laravel 的认证功能。** 你完全可以按照[认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明，动手与 Laravel 的认证服务交互。

如果你是 Laravel 新手，在尝试使用 Laravel Fortify 之前，或许可以先了解 [Laravel Breeze](/docs/{{version}}/starter-kits) 应用启动套件。Laravel Breeze 为你的应用提供了一套认证脚手架，其中包含使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面。与 Fortify 不同，Breeze 会把它的路由和控制器直接发布到你的应用中。这样你可以先学习并熟悉 Laravel 的认证功能，然后再让 Laravel Fortify 来为你实现这些功能。

Laravel Fortify 实际上就是取用了 Laravel Breeze 的路由和控制器，并以一个不包含用户界面的包的形式提供给你。这样你依然可以快速为应用的认证层搭建后端实现，同时不被任何特定的前端理念束缚。

<a name="when-should-i-use-fortify"></a>
### 我何时该使用 Fortify？

你可能想知道什么时候适合使用 Laravel Fortify。首先，如果你正在使用 Laravel 的某个[应用启动套件](/docs/{{version}}/starter-kits)，就不需要安装 Laravel Fortify，因为 Laravel 的所有应用启动套件都已经提供了完整的认证实现。

如果你没有使用应用启动套件，而你的应用又需要认证功能，那你有两个选择：手动实现应用的认证功能，或者使用 Laravel Fortify 来提供这些功能的后端实现。

如果你选择安装 Fortify，你自己的用户界面就会向本文档中详细说明的 Fortify 认证路由发起请求，以完成用户认证和注册。

如果你选择不安装 Fortify 而手动与 Laravel 的认证服务交互，可以按照[认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明进行操作。

<a name="laravel-fortify-and-laravel-sanctum"></a>
#### Laravel Fortify 与 Laravel Sanctum

一些开发者会混淆 [Laravel Sanctum](/docs/{{version}}/sanctum) 与 Laravel Fortify 之间的区别。由于这两个包解决的是两个不同但相关的问题，Laravel Fortify 和 Laravel Sanctum 并非互斥或相互竞争的包。

Laravel Sanctum 只关注管理 API 令牌，以及使用会话 Cookie 或令牌对已有用户进行认证。Sanctum 不提供任何处理用户注册、密码重置等功能的路由。

如果你正在手动为某个提供 API 的应用、或作为单页应用后端的应用构建认证层，你完全可能同时使用 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话认证）。

<a name="installation"></a>
## 安装

要开始使用，请通过 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

该命令会把 Fortify 的 actions 发布到你的 `app/Actions` 目录（若不存在则创建）。此外，`FortifyServiceProvider`、配置文件以及所有必要的数据库迁移都会被一并发布。

接下来，你应当迁移数据库：

```shell
php artisan migrate
```

<a name="fortify-features"></a>
### Fortify 功能

`fortify` 配置文件包含一个 `features` 配置数组。该数组定义了 Fortify 默认会暴露哪些后端路由 / 功能。如果你没有把 Fortify 与 [Laravel Jetstream](https://jetstream.laravel.com) 搭配使用，我们建议你只启用以下功能，它们是大多数 Laravel 应用都具备的基础认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

<a name="disabling-views"></a>
### 禁用视图

默认情况下，Fortify 会定义一些用于返回视图的路由，例如登录页面或注册页面。不过，如果你正在构建一个由 JavaScript 驱动的单页应用，可能并不需要这些路由。为此，你可以把应用 `config/fortify.php` 配置文件中的 `views` 配置值设为 `false`，从而完全禁用这些路由：

```php
'views' => false,
```

<a name="disabling-views-and-password-reset"></a>
#### 禁用视图与密码重置

如果你选择禁用 Fortify 的视图，同时又要为应用实现密码重置功能，就仍然需要定义一条名为 `password.reset` 的路由，负责展示你的"重置密码"视图。这是必需的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知会通过名为 `password.reset` 的路由生成密码重置 URL。

<a name="authentication"></a>
## 认证

要开始使用，我们需要指示 Fortify 如何返回我们的"登录"视图。请记住，Fortify 是一个无头认证库。如果你想要一套已经为你实现好的 Laravel 认证功能前端实现，就应当使用[应用启动套件](/docs/{{version}}/starter-kits)。

认证视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法。Fortify 会负责定义返回该视图的 `/login` 路由：

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

你的登录模板应当包含一个向 `/login` 发起 POST 请求的表单。`/login` 端点需要一个字符串类型的 `email` / `username` 和一个 `password`。email / username 字段的名称应当与 `config/fortify.php` 配置文件中的 `username` 值一致。此外，你还可以提供一个布尔类型的 `remember` 字段，用来表示用户希望使用 Laravel 提供的"记住我"功能。

如果登录尝试成功，Fortify 会把你重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回一个 200 HTTP 响应。

如果请求未成功，用户会被重定向回登录页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-user-authentication"></a>
### 自定义用户认证

Fortify 会自动根据提供的凭据和为你的应用配置的认证守卫来检索并认证用户。不过，你有时可能希望完全自定义登录凭据的认证方式以及用户的检索方式。幸运的是，Fortify 允许你轻松地通过 `Fortify::authenticateUsing` 方法来实现这一点。

该方法接受一个闭包，闭包会接收传入的 HTTP 请求。该闭包负责验证请求附带的登录凭据，并返回关联的用户实例。如果凭据无效或找不到用户，闭包应当返回 `null` 或 `false`。通常，应当在 `FortifyServiceProvider` 的 `boot` 方法中调用该方法：

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
#### 认证守卫

你可以在应用的 `fortify` 配置文件中自定义 Fortify 所使用的认证守卫。不过，你应当确保所配置的守卫是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果你打算使用 Laravel Fortify 来认证 SPA，就应当把 Laravel 默认的 `web` 守卫与 [Laravel Sanctum](https://laravel.com/docs/sanctum) 搭配使用。

<a name="customizing-the-authentication-pipeline"></a>
### 自定义认证流程

Laravel Fortify 通过一条由可调用类组成的流程来认证登录请求。如果你愿意，可以定义一条自定义流程，让登录请求依次经过这些类。每个类都应当有一个 `__invoke` 方法，该方法接收传入的 `Illuminate\Http\Request` 实例，以及与[中间件](/docs/{{version}}/middleware)一样的 `$next` 变量，用于把请求传递给流程中的下一个类。

要定义你的自定义流程，可以使用 `Fortify::authenticateThrough` 方法。该方法接受一个闭包，闭包应当返回登录请求依次经过的类数组。通常，应当在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法。

下面的示例包含默认的流程定义，你可以在此基础上进行自己的修改：

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

默认情况下，Fortify 会使用 `EnsureLoginIsNotThrottled` 中间件对认证尝试进行限流。该中间件对"用户名 + IP 地址"组合唯一的尝试进行限流。

有些应用可能需要不同的认证尝试限流方式，例如仅按 IP 地址限流。为此，Fortify 允许你通过 `fortify.limiters.login` 配置选项指定自己的[速率限制器](/docs/{{version}}/routing#rate-limiting)。当然，该配置项位于你应用的 `config/fortify.php` 配置文件中。

> [!NOTE]
> 综合运用限流、[双因素认证](/docs/{{version}}/fortify#two-factor-authentication)和外部 Web 应用防火墙（WAF），能为你的合法应用用户提供最稳健的防护。

<a name="customizing-authentication-redirects"></a>
### 自定义重定向

如果登录尝试成功，Fortify 会把你重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回一个 200 HTTP 响应。用户退出应用登录后，会被重定向到 `/` URI。

如果你需要对该行为进行高级定制，可以把 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)中。通常，应当在应用 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

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

当 Fortify 的双因素认证功能启用后，用户在认证过程中需要输入一个六位数字令牌。该令牌使用基于时间的一次性密码（TOTP）生成，可以从任何兼容 TOTP 的移动认证应用中获取，例如 Google Authenticator。

开始之前，你首先应当确保应用的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` Trait：

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

接下来，你应当在应用中构建一个页面，让用户可以管理自己的双因素认证设置。该页面应当允许用户启用和禁用双因素认证，以及重新生成双因素认证恢复码。

> 默认情况下，`fortify` 配置文件的 `features` 数组会指示 Fortify 的双因素认证设置需要密码确认后才能修改。因此，你的应用应当先实现 Fortify 的[密码确认](#password-confirmation)功能，再继续往下做。

<a name="enabling-two-factor-authentication"></a>
### 启用双因素认证

要开始启用双因素认证，你的应用应当向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户会被重定向回上一个 URL，同时 `status` 会话变量会被设为 `two-factor-authentication-enabled`。你可以在模板中检测这个 `status` 会话变量，以显示相应的成功消息。如果请求是 XHR 请求，则会返回 `200` HTTP 响应。

在选择启用双因素认证后，用户仍然必须通过提供一个有效的双因素认证码来"确认"自己的双因素认证配置。因此，你的"成功"消息应当提示用户仍需完成双因素认证确认：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two factor authentication below.
    </div>
@endif
```

接下来，你应当向用户展示双因素认证二维码，供他们扫描到自己的认证应用中。如果你使用 Blade 渲染应用前端，可以通过用户实例上可用的 `twoFactorQrCodeSvg` 方法获取二维码 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-qr-code` 端点发起 XHR GET 请求，以获取用户的双因素认证二维码。该端点会返回一个包含 `svg` 键的 JSON 对象。

<a name="confirming-two-factor-authentication"></a>
#### 确认双因素认证

除了展示用户的双因素认证二维码之外，你还应当提供一个文本输入框，让用户可以填入有效的认证码来"确认"其双因素认证配置。该认证码应当通过向 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点发起 POST 请求提供给 Laravel 应用。

如果请求成功，用户会被重定向回上一个 URL，同时 `status` 会话变量会被设为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果对双因素认证确认端点的请求是通过 XHR 发出的，就会返回 `200` HTTP 响应。

<a name="displaying-the-recovery-codes"></a>
#### 展示恢复码

你还应当展示用户的双因素恢复码。这些恢复码让用户在失去移动设备访问权时仍能完成认证。如果你使用 Blade 渲染应用前端，可以通过已认证的用户实例访问恢复码：

```php
(array) $request->user()->recoveryCodes()
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-recovery-codes` 端点发起 XHR GET 请求。该端点会返回一个包含用户恢复码的 JSON 数组。

要重新生成用户的恢复码，你的应用应当向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

<a name="authenticating-with-two-factor-authentication"></a>
### 使用双因素认证进行认证

在认证过程中，Fortify 会自动把用户重定向到应用的双因素认证质询页面。不过，如果你的应用发起的是 XHR 登录请求，那么认证尝试成功后返回的 JSON 响应中会包含一个带 `two_factor` 布尔属性的 JSON 对象。你应当检查这个值，以判断是否需要把用户重定向到应用的双因素认证质询页面。

要开始实现双因素认证功能，我们需要指示 Fortify 如何返回我们的双因素认证质询视图。Fortify 的所有认证视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/two-factor-challenge` 路由。你的 `two-factor-challenge` 模板应当包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 动作需要一个包含有效 TOTP 令牌的 `code` 字段，或者一个包含用户恢复码之一的 `recovery_code` 字段。

如果登录尝试成功，Fortify 会把用户重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回一个 204 HTTP 响应。

如果请求未成功，用户会被重定向回双因素认证质询页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。

<a name="disabling-two-factor-authentication"></a>
### 禁用双因素认证

要禁用双因素认证，你的应用应当向 `/user/two-factor-authentication` 端点发起 DELETE 请求。请记住，Fortify 的双因素认证端点在被调用前需要先完成[密码确认](#password-confirmation)。

<a name="registration"></a>
## 注册

要开始实现应用的注册功能，我们需要指示 Fortify 如何返回我们的"注册"视图。请记住，Fortify 是一个无头认证库。如果你想要一套已经为你实现好的 Laravel 认证功能前端实现，就应当使用[应用启动套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/register` 路由。你的 `register` 模板应当包含一个向 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点需要一个字符串类型的 `name`、字符串类型的邮箱地址 / 用户名、`password` 和 `password_confirmation` 字段。email / username 字段的名称应当与应用 `fortify` 配置文件中定义的 `username` 配置值一致。

如果注册尝试成功，Fortify 会把用户重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果请求是 XHR 请求，则会返回一个 201 HTTP 响应。

如果请求未成功，用户会被重定向回注册页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-registration"></a>
### 自定义注册

你可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` 动作来自定义用户验证与创建流程。

<a name="password-reset"></a>
## 密码重置

<a name="requesting-a-password-reset-link"></a>
### 请求密码重置链接

要开始实现应用的密码重置功能，我们需要指示 Fortify 如何返回我们的"忘记密码"视图。请记住，Fortify 是一个无头认证库。如果你想要一套已经为你实现好的 Laravel 认证功能前端实现，就应当使用[应用启动套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/forgot-password` 端点。你的 `forgot-password` 模板应当包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点需要一个字符串类型的 `email` 字段。该字段 / 数据库列的名称应当与应用 `fortify` 配置文件中的 `email` 配置值一致。

<a name="handling-the-password-reset-link-request-response"></a>
#### 处理密码重置链接请求的响应

如果密码重置链接请求成功，Fortify 会把用户重定向回 `/forgot-password` 端点，并向用户发送一封包含安全链接的邮件，用户可以通过该链接重置密码。如果请求是 XHR 请求，则会返回一个 200 HTTP 响应。

在请求成功后被重定向回 `/forgot-password` 端点时，可以使用 `status` 会话变量来展示密码重置链接请求的结果状态。

`$status` 会话变量的值会与应用 `passwords` [语言文件](/docs/{{version}}/localization)中定义的某个翻译字符串匹配。如果你想自定义该值但尚未发布 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令完成：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求未成功，用户会被重定向回"请求密码重置链接"页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。

<a name="resetting-the-password"></a>
### 重置密码

要完成实现应用的密码重置功能，我们需要指示 Fortify 如何返回我们的"重置密码"视图。

Fortify 的所有视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义展示该视图的路由。你的 `reset-password` 模板应当包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点需要一个字符串类型的 `email` 字段、一个 `password` 字段、一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段，其中包含 `request()->route('token')` 的值。"email"字段 / 数据库列的名称应当与应用 `fortify` 配置文件中定义的 `email` 配置值一致。

<a name="handling-the-password-reset-response"></a>
#### 处理密码重置的响应

如果密码重置请求成功，Fortify 会重定向回 `/login` 路由，以便用户使用新密码登录。此外，`status` 会话变量会被设置，你可以在登录页面上展示重置成功的状态：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，则会返回一个 200 HTTP 响应。

如果请求未成功，用户会被重定向回"重置密码"页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-password-resets"></a>
### 自定义密码重置

你可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` 动作来自定义密码重置流程。

<a name="email-verification"></a>
## 邮箱验证

注册完成后，你可能希望用户在继续访问应用之前验证自己的邮箱地址。要开始使用，请确保 `fortify` 配置文件的 `features` 数组中已启用 `emailVerification` 功能。接下来，确保你的 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两个配置步骤后，新注册的用户会收到一封邮件，提示他们验证自己的邮箱地址归属。不过，我们需要告诉 Fortify 如何展示邮箱验证页面，该页面会告知用户需要点击邮件中的验证链接。

Fortify 的所有视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义当用户被 Laravel 内置的 `verified` 中间件重定向到 `/email/verify` 端点时展示该视图的路由。

你的 `verify-email` 模板应当包含一段提示信息，指导用户点击已发送到其邮箱的邮箱验证链接。

<a name="resending-email-verification-links"></a>
#### 重新发送邮箱验证链接

如果你愿意，可以在应用的 `verify-email` 模板中添加一个按钮，触发向 `/email/verification-notification` 端点发起的 POST 请求。该端点收到请求后，会向用户发送一封新的验证邮件链接，让用户在之前的链接被误删或丢失时能够获取新的验证链接。

如果重新发送验证链接邮件的请求成功，Fortify 会带着 `status` 会话变量把用户重定向回 `/email/verify` 端点，让你向用户展示一条提示信息，告知操作已成功。如果请求是 XHR 请求，则会返回一个 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

<a name="protecting-routes"></a>
### 保护路由

要指定某条路由或某组路由要求用户必须已验证邮箱地址，就应当把 Laravel 内置的 `verified` 中间件挂载到该路由上。`verified` 中间件别名由 Laravel 自动注册，是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

<a name="password-confirmation"></a>
## 密码确认

在构建应用时，你可能偶尔会需要一些操作，要求用户先确认密码才能执行。这些路由通常由 Laravel 内置的 `password.confirm` 中间件保护。

要开始实现密码确认功能，我们需要指示 Fortify 如何返回应用的"密码确认"视图。请记住，Fortify 是一个无头认证库。如果你想要一套已经为你实现好的 Laravel 认证功能前端实现，就应当使用[应用启动套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法来自定义。通常，你应当在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/user/confirm-password` 端点。你的 `confirm-password` 模板应当包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点需要一个包含用户当前密码的 `password` 字段。

如果密码与用户当前密码匹配，Fortify 会把用户重定向回他们原本试图访问的路由。如果请求是 XHR 请求，则会返回一个 201 HTTP 响应。

如果请求未成功，用户会被重定向回"确认密码"页面，你可以通过共享的 `$errors` Blade 模板变量获取验证错误。或者，在 XHR 请求的情况下，验证错误会随 422 HTTP 响应一并返回。
