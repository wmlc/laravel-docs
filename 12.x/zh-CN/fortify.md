# Laravel Fortify

- [简介](#introduction)
    - [什么是 Fortify？](#what-is-fortify)
    - [何时应使用 Fortify？](#when-should-i-use-fortify)
- [安装](#installation)
    - [Fortify 功能](#fortify-features)
    - [禁用视图](#disabling-views)
- [身份认证](#authentication)
    - [自定义用户认证](#customizing-user-authentication)
    - [自定义认证管道](#customizing-the-authentication-pipeline)
    - [自定义重定向](#customizing-authentication-redirects)
- [双因素认证](#two-factor-authentication)
    - [启用双因素认证](#enabling-two-factor-authentication)
    - [通过双因素认证进行认证](#authenticating-with-two-factor-authentication)
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

[Laravel Fortify](https://github.com/laravel/fortify) 是一个与前端无关的 Laravel 认证后端实现。Fortify 会注册实现 Laravel 全部认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，你可以运行 `route:list` Artisan 命令来查看 Fortify 注册的路由。

由于 Fortify 不提供自己的用户界面，因此需要与你的用户界面配合使用，由界面来向它注册的路由发起请求。我们将在本文档的其余部分详细说明如何向这些路由发起请求。

> [!NOTE]
> 请记住，Fortify 是一个旨在帮助你快速实现 Laravel 认证功能的扩展包。**它并不是必需的。**你随时可以按照[身份认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明，手动与 Laravel 的认证服务交互。

<a name="what-is-fortify"></a>
### 什么是 Fortify？

如前所述，Laravel Fortify 是一个与前端无关的 Laravel 认证后端实现。Fortify 会注册实现 Laravel 全部认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**使用 Laravel 的认证功能并不要求你使用 Fortify。**你随时可以按照[身份认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明，手动与 Laravel 的认证服务交互。

如果你是 Laravel 新手，可以先了解一下[我们的应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的应用入门套件在内部使用 Fortify，为你的应用提供认证脚手架，其中包含使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面。这能让你学习和熟悉 Laravel 的认证功能。

Laravel Fortify 本质上是将我们应用入门套件中的路由和控制器提取出来，打包成一个不含用户界面的扩展包。这样，你依然可以快速为应用的认证层搭建后端实现，而不受制于任何特定的前端方案。

<a name="when-should-i-use-fortify"></a>
### 何时应使用 Fortify？

你可能想知道什么时候适合使用 Laravel Fortify。首先，如果你使用的是 Laravel 的某个[应用入门套件](/docs/{{version}}/starter-kits)，则无需安装 Laravel Fortify，因为 Laravel 的所有应用入门套件都使用了 Fortify，并且已经提供了完整的认证实现。

如果你没有使用应用入门套件，而你的应用又需要认证功能，那么有两种选择：手动实现应用的认证功能，或者使用 Laravel Fortify 来提供这些功能的后端实现。

如果你选择安装 Fortify，你的用户界面将向 Fortify 的认证路由发起请求（本文档中有详细说明），以便完成用户认证和注册。

如果你选择手动与 Laravel 的认证服务交互而不使用 Fortify，可以按照[身份认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords)和[邮箱验证](/docs/{{version}}/verification)文档中的说明进行。

<a name="laravel-fortify-and-laravel-sanctum"></a>
#### Laravel Fortify 与 Laravel Sanctum

一些开发者会混淆 [Laravel Sanctum](/docs/{{version}}/sanctum) 与 Laravel Fortify 之间的区别。由于这两个扩展包解决的是两个不同但相关的问题，Laravel Fortify 和 Laravel Sanctum 并不是互斥或相互竞争的扩展包。

Laravel Sanctum 只负责管理 API 令牌，以及使用会话 Cookie 或令牌对已存在的用户进行认证。Sanctum 不提供任何处理用户注册、密码重置等功能的路由。

如果你正在为提供 API 或作为单页应用后端的应用手动构建认证层，那么很有可能会同时使用 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话认证）。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

该命令会将 Fortify 的 action 发布到你的 `app/Actions` 目录（如果该目录不存在则会创建）。此外，`FortifyServiceProvider`、配置文件以及所有必要的数据库迁移也会被发布。

接下来，你应执行数据库迁移：

```shell
php artisan migrate
```

<a name="fortify-features"></a>
### Fortify 功能

`fortify` 配置文件中包含一个 `features` 配置数组。该数组定义了 Fortify 默认会暴露哪些后端路由 / 功能。我们建议你只启用以下功能，它们是大多数 Laravel 应用提供的基础认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

<a name="disabling-views"></a>
### 禁用视图

默认情况下，Fortify 定义了一些用于返回视图的路由，例如登录页面或注册页面。但是，如果你正在构建由 JavaScript 驱动的单页应用，可能并不需要这些路由。因此，你可以将应用 `config/fortify.php` 配置文件中的 `views` 配置值设置为 `false`，从而完全禁用这些路由：

```php
'views' => false,
```

<a name="disabling-views-and-password-reset"></a>
#### 禁用视图与密码重置

如果你选择禁用 Fortify 的视图，同时又要为应用实现密码重置功能，那么你仍应定义一个名为 `password.reset` 的路由，负责显示应用的「重置密码」视图。这一步必不可少，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知会通过 `password.reset` 命名路由来生成密码重置 URL。

<a name="authentication"></a>
## 身份认证

首先，我们需要告诉 Fortify 如何返回「登录」视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一个已经帮你完成前端实现的 Laravel 认证功能，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

认证视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法。Fortify 会负责定义返回该视图的 `/login` 路由：

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

你的登录模板中应包含一个向 `/login` 发起 POST 请求的表单。`/login` 端点接收一个字符串类型的 `email` / `username` 和一个 `password`。邮箱 / 用户名字段的名称应与 `config/fortify.php` 配置文件中的 `username` 值一致。此外，还可以提供一个布尔型的 `remember` 字段，用于表明用户希望使用 Laravel 提供的「记住我」功能。

如果登录成功，Fortify 会将你重定向到应用 `fortify` 配置文件中 `home` 配置选项所配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。

如果请求失败，用户会被重定向回登录页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-user-authentication"></a>
### 自定义用户认证

Fortify 会根据提供的凭据以及为应用配置的认证守卫，自动检索用户并对其进行认证。不过，有时你可能希望完全自定义登录凭据的认证方式和用户的检索方式。所幸，Fortify 允许你通过 `Fortify::authenticateUsing` 方法轻松实现这一点。

该方法接收一个闭包，闭包会收到传入的 HTTP 请求。该闭包负责验证请求附带的登录凭据，并返回关联的用户实例。如果凭据无效或找不到用户，闭包应返回 `null` 或 `false`。通常，该方法应在 `FortifyServiceProvider` 的 `boot` 方法中调用：

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

你可以在应用的 `fortify` 配置文件中自定义 Fortify 使用的认证守卫。不过，你应确保所配置的守卫实现了 `Illuminate\Contracts\Auth\StatefulGuard`。如果你想使用 Laravel Fortify 对 SPA 进行认证，应将 Laravel 默认的 `web` 守卫与 [Laravel Sanctum](https://laravel.com/docs/sanctum) 结合使用。

<a name="customizing-the-authentication-pipeline"></a>
### 自定义认证管道

Laravel Fortify 通过一个可调用类的管道来认证登录请求。如果你愿意，可以定义一个自定义的类管道，让登录请求依次通过这些类。每个类都应有一个 `__invoke` 方法，该方法接收传入的 `Illuminate\Http\Request` 实例，并且与[中间件](/docs/{{version}}/middleware)一样，接收一个 `$next` 变量，调用它即可将请求传递给管道中的下一个类。

要定义自定义管道，可以使用 `Fortify::authenticateThrough` 方法。该方法接收一个闭包，闭包应返回登录请求要依次通过的类数组。通常，该方法应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用。

下面的示例包含了默认的管道定义，你可以将其作为自行修改的起点：

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

默认情况下，Fortify 会使用 `EnsureLoginIsNotThrottled` 中间件对认证尝试进行限流。该中间件针对用户名与 IP 地址的组合进行独立的限流。

有些应用可能需要对认证尝试采用不同的限流方式，例如仅按 IP 地址限流。为此，Fortify 允许你通过 `fortify.limiters.login` 配置选项指定自己的[速率限制器](/docs/{{version}}/routing#rate-limiting)。当然，该配置选项位于应用的 `config/fortify.php` 配置文件中。

> [!NOTE]
> 将限流、[双因素认证](/docs/{{version}}/fortify#two-factor-authentication)以及外部 Web 应用防火墙（WAF）结合使用，可以为你的合法应用用户提供最稳固的防护。

<a name="customizing-authentication-redirects"></a>
### 自定义重定向

如果登录成功，Fortify 会将你重定向到应用 `fortify` 配置文件中 `home` 配置选项所配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。用户退出应用后，会被重定向到 `/` URI。

如果你需要对这一行为进行高级自定义，可以将 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel [服务容器](/docs/{{version}}/container)中。通常，这应在应用 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

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

启用 Fortify 的双因素认证功能后，用户在认证过程中需要输入一个六位数字令牌。该令牌基于基于时间的一次性密码（TOTP）生成，可以从任何兼容 TOTP 的移动端认证应用（例如 Google Authenticator）中获取。

开始之前，你首先应确保应用的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` trait：

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

接下来，你应在应用中构建一个页面，供用户管理自己的双因素认证设置。该页面应允许用户启用和禁用双因素认证，以及重新生成双因素认证恢复码。

> 默认情况下，`fortify` 配置文件的 `features` 数组会要求 Fortify 的双因素认证设置在修改前先确认密码。因此，你的应用应先实现 Fortify 的[密码确认](#password-confirmation)功能，再继续后续操作。

<a name="enabling-two-factor-authentication"></a>
### 启用双因素认证

要开始启用双因素认证，你的应用应向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户会被重定向回之前的 URL，并且 `status` 会话变量会被设置为 `two-factor-authentication-enabled`。你可以在模板中检测这个 `status` 会话变量，以显示相应的成功消息。如果请求是 XHR 请求，则会返回 `200` HTTP 响应。

用户选择启用双因素认证后，仍须提供有效的双因素认证验证码来「确认」其双因素认证配置。因此，你的「成功」消息应提示用户仍需确认双因素认证：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two-factor authentication below.
    </div>
@endif
```

接下来，你应为用户显示双因素认证二维码，供其扫描到验证器应用中。如果你使用 Blade 渲染应用的前端，可以通过用户实例上的 `twoFactorQrCodeSvg` 方法获取二维码的 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-qr-code` 端点发起 XHR GET 请求，来获取用户的双因素认证二维码。该端点会返回一个包含 `svg` 键的 JSON 对象。

<a name="confirming-two-factor-authentication"></a>
#### 确认双因素认证

除了显示用户的双因素认证二维码之外，你还应提供一个文本输入框，供用户输入有效的认证验证码来「确认」其双因素认证配置。该验证码应通过向 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点发起 POST 请求提供给 Laravel 应用。

如果请求成功，用户会被重定向回之前的 URL，并且 `status` 会话变量会被设置为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two-factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果对双因素认证确认端点的请求是 XHR 请求，则会返回 `200` HTTP 响应。

<a name="displaying-the-recovery-codes"></a>
#### 显示恢复码

你还应显示用户的双因素恢复码。这些恢复码允许用户在无法访问移动设备时进行认证。如果你使用 Blade 渲染应用的前端，可以通过已认证的用户实例访问恢复码：

```php
(array) $request->user()->recoveryCodes()
```

如果你正在构建由 JavaScript 驱动的前端，可以向 `/user/two-factor-recovery-codes` 端点发起 XHR GET 请求。该端点会返回一个包含用户恢复码的 JSON 数组。

要重新生成用户的恢复码，你的应用应向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

<a name="authenticating-with-two-factor-authentication"></a>
### 通过双因素认证进行认证

在认证过程中，Fortify 会自动将用户重定向到应用的双因素认证挑战页面。不过，如果你的应用发起的是 XHR 登录请求，认证成功后返回的 JSON 响应中会包含一个带有 `two_factor` 布尔属性的 JSON 对象。你应检查该值，以判断是否需要重定向到应用的双因素认证挑战页面。

要开始实现双因素认证功能，我们需要告诉 Fortify 如何返回双因素认证挑战视图。Fortify 认证视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/two-factor-challenge` 路由。你的 `two-factor-challenge` 模板中应包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 动作接收一个 `code` 字段（包含有效的 TOTP 令牌）或一个 `recovery_code` 字段（包含用户的某个恢复码）。

如果登录成功，Fortify 会将用户重定向到应用 `fortify` 配置文件中 `home` 配置选项所配置的 URI。如果登录请求是 XHR 请求，则会返回 204 HTTP 响应。

如果请求失败，用户会被重定向回双因素挑战页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。

<a name="disabling-two-factor-authentication"></a>
### 禁用双因素认证

要禁用双因素认证，你的应用应向 `/user/two-factor-authentication` 端点发起 DELETE 请求。请记住，Fortify 的双因素认证端点在调用前需要先进行[密码确认](#password-confirmation)。

<a name="registration"></a>
## 注册

要开始实现应用的注册功能，我们需要告诉 Fortify 如何返回「注册」视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一个已经帮你完成前端实现的 Laravel 认证功能，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/register` 路由。你的 `register` 模板中应包含一个向 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点接收一个字符串类型的 `name`、字符串类型的邮箱地址 / 用户名、`password` 以及 `password_confirmation` 字段。邮箱 / 用户名字段的名称应与应用 `fortify` 配置文件中定义的 `username` 配置值一致。

如果注册成功，Fortify 会将用户重定向到应用 `fortify` 配置文件中 `home` 配置选项所配置的 URI。如果请求是 XHR 请求，则会返回 201 HTTP 响应。

如果请求失败，用户会被重定向回注册页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-registration"></a>
### 自定义注册

用户验证和创建流程可以通过修改 `App\Actions\Fortify\CreateNewUser` action 来自定义，该 action 是在安装 Laravel Fortify 时生成的。

<a name="password-reset"></a>
## 密码重置

<a name="requesting-a-password-reset-link"></a>
### 请求密码重置链接

要开始实现应用的密码重置功能，我们需要告诉 Fortify 如何返回「忘记密码」视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一个已经帮你完成前端实现的 Laravel 认证功能，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/forgot-password` 端点。你的 `forgot-password` 模板中应包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点接收一个字符串类型的 `email` 字段。该字段 / 数据库列的名称应与应用 `fortify` 配置文件中的 `email` 配置值一致。

<a name="handling-the-password-reset-link-request-response"></a>
#### 处理密码重置链接请求的响应

如果密码重置链接请求成功，Fortify 会将用户重定向回 `/forgot-password` 端点，并向用户发送一封包含安全链接的邮件，用户可以通过该链接重置密码。如果请求是 XHR 请求，则会返回 200 HTTP 响应。

请求成功后被重定向回 `/forgot-password` 端点后，可以使用 `status` 会话变量来显示密码重置链接请求的结果状态。

`$status` 会话变量的值会与应用 `passwords` [语言文件](/docs/{{version}}/localization)中定义的某个翻译字符串一致。如果你想自定义该值且尚未发布 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令来发布：

```html
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求失败，用户会被重定向回请求密码重置链接页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。

<a name="resetting-the-password"></a>
### 重置密码

要完成应用密码重置功能的实现，我们需要告诉 Fortify 如何返回「重置密码」视图。

Fortify 视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义显示该视图的路由。你的 `reset-password` 模板中应包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点接收一个字符串类型的 `email` 字段、一个 `password` 字段、一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段（其值为 `request()->route('token')`）。「email」字段 / 数据库列的名称应与应用 `fortify` 配置文件中定义的 `email` 配置值一致。

<a name="handling-the-password-reset-response"></a>
#### 处理密码重置响应

如果密码重置请求成功，Fortify 会重定向回 `/login` 路由，以便用户使用新密码登录。此外，还会设置一个 `status` 会话变量，以便你在登录页面上显示重置成功的状态：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，则会返回 200 HTTP 响应。

如果请求失败，用户会被重定向回重置密码页面，你可以通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。

<a name="customizing-password-resets"></a>
### 自定义密码重置

密码重置流程可以通过修改 `App\Actions\ResetUserPassword` action 来自定义，该 action 是在安装 Laravel Fortify 时生成的。

<a name="email-verification"></a>
## 邮箱验证

注册之后，你可能希望用户先验证自己的邮箱地址，然后才能继续访问你的应用。首先，请确保 `fortify` 配置文件的 `features` 数组中已启用 `emailVerification` 功能。接下来，你应确保 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两步设置后，新注册的用户会收到一封邮件，提示他们验证自己的邮箱地址所有权。不过，我们还需要告诉 Fortify 如何显示邮箱验证页面，该页面会提示用户需要点击邮件中的验证链接。

Fortify 视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

当 Laravel 内置的 `verified` 中间件将用户重定向到 `/email/verify` 端点时，Fortify 会负责定义显示该视图的路由。

你的 `verify-email` 模板中应包含一条提示信息，指导用户点击发送到其邮箱地址的邮箱验证链接。

<a name="resending-email-verification-links"></a>
#### 重新发送邮箱验证链接

如果你愿意，可以在应用的 `verify-email` 模板中添加一个按钮，触发向 `/email/verification-notification` 端点发起 POST 请求。该端点收到请求后，会向用户发送一封新的验证邮件，让用户在前一封验证链接被误删或丢失时也能获取新的验证链接。

如果重新发送验证链接邮件的请求成功，Fortify 会将用户重定向回 `/email/verify` 端点，并携带一个 `status` 会话变量，方便你向用户显示操作成功的提示信息。如果请求是 XHR 请求，则会返回 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

<a name="protecting-routes"></a>
### 保护路由

要指定某个路由或路由组要求用户已验证其邮箱地址，你应为该路由附加 Laravel 内置的 `verified` 中间件。`verified` 中间件别名由 Laravel 自动注册，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

<a name="password-confirmation"></a>
## 密码确认

在构建应用的过程中，你偶尔会遇到一些在执行前需要用户确认密码的操作。通常，这些路由由 Laravel 内置的 `password.confirm` 中间件保护。

要开始实现密码确认功能，我们需要告诉 Fortify 如何返回应用的「密码确认」视图。请记住，Fortify 是一个无头（headless）认证库。如果你想要一个已经帮你完成前端实现的 Laravel 认证功能，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 视图的所有渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用该方法：

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

Fortify 会负责定义返回该视图的 `/user/confirm-password` 端点。你的 `confirm-password` 模板中应包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点接收一个 `password` 字段，其中包含用户的当前密码。

如果密码与用户的当前密码匹配，Fortify 会将用户重定向到其之前尝试访问的路由。如果请求是 XHR 请求，则会返回 201 HTTP 响应。

如果请求失败，用户会被重定向回确认密码页面，你可以通过共享的 `$errors` Blade 模板变量获取验证错误。如果是 XHR 请求，验证错误会随 422 HTTP 响应一并返回。
