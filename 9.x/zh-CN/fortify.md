# Laravel Fortify

- [简介](#introduction)
    - [什么是 Fortify？](#what-is-fortify)
    - [何时使用 Fortify？](#when-should-i-use-fortify)
- [安装](#installation)
    - [Fortify 服务提供者](#the-fortify-service-provider)
    - [Fortify 功能](#fortify-features)
    - [禁用视图](#disabling-views)
- [认证](#authentication)
    - [自定义用户认证](#customizing-user-authentication)
    - [自定义认证管道](#customizing-the-authentication-pipeline)
    - [自定义重定向](#customizing-authentication-redirects)
- [双因素认证](#two-factor-authentication)
    - [启用双因素认证](#enabling-two-factor-authentication)
    - [使用双因素认证登录](#authenticating-with-two-factor-authentication)
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

[Laravel Fortify](https://github.com/laravel/fortify) 是 Laravel 的前端无关认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，可以运行 `route:list` Artisan 命令查看 Fortify 注册的路由。

由于 Fortify 不提供自己的用户界面，它旨在与自己的用户界面配合使用，由后者向其注册的路由发起请求。本文档的其余部分将详细说明如何向这些路由发起请求。

> **Note**  
> 请记住，Fortify 是一个旨在帮助快速实现 Laravel 认证功能的包。**并非必须使用它。** 始终可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，手动与 Laravel 的认证服务交互。

<a name="what-is-fortify"></a>
### 什么是 Fortify？

如前所述，Laravel Fortify 是 Laravel 的前端无关认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**使用 Laravel 的认证功能并非必须使用 Fortify。** 始终可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，手动与 Laravel 的认证服务交互。

如果是 Laravel 新手，可能希望在尝试使用 Laravel Fortify 之前先探索 [Laravel Breeze](/docs/{{version}}/starter-kits) 应用入门套件。Laravel Breeze 为应用提供认证脚手架，包含使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面。与 Fortify 不同，Breeze 将其路由和控制器直接发布到应用中。这便于在让 Laravel Fortify 为你实现这些功能之前，先学习并熟悉 Laravel 的认证功能。

Laravel Fortify 本质上提取了 Laravel Breeze 的路由和控制器，以不包含用户界面的包形式提供。这允许在不绑定任何特定前端方案的情况下，仍然能快速搭建应用认证层的后端实现。

<a name="when-should-i-use-fortify"></a>
### 何时使用 Fortify？

可能想知道何时适合使用 Laravel Fortify。首先，如果使用 Laravel 的[应用入门套件](/docs/{{version}}/starter-kits)之一，则无需安装 Laravel Fortify，因为所有 Laravel 应用入门套件都已提供完整的认证实现。

如果不使用应用入门套件且应用需要认证功能，有两个选择：手动实现应用的认证功能，或使用 Laravel Fortify 提供这些功能的后端实现。

如果选择安装 Fortify，用户界面将向本文档中详述的 Fortify 认证路由发起请求，以认证和注册用户。

如果选择手动与 Laravel 的认证服务交互而非使用 Fortify，可以按照 [认证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明进行。

<a name="laravel-fortify-and-laravel-sanctum"></a>
#### Laravel Fortify 与 Laravel Sanctum

一些开发者对 [Laravel Sanctum](/docs/{{version}}/sanctum) 和 Laravel Fortify 之间的区别感到困惑。由于这两个包解决两个不同但相关的问题，Laravel Fortify 和 Laravel Sanctum 并非互斥或竞争的包。

Laravel Sanctum 仅涉及管理 API 令牌和使用会话 Cookie 或令牌认证已存在的用户。Sanctum 不提供任何处理用户注册、密码重置等的路由。

如果尝试为提供 API 或作为单页应用后端的应用手动构建认证层，完全可能同时使用 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话认证）。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `vendor:publish` 命令发布 Fortify 的资源：

```shell
php artisan vendor:publish --provider="Laravel\Fortify\FortifyServiceProvider"
```

此命令会将 Fortify 的动作发布到 `app/Actions` 目录，如果该目录不存在则会创建。此外，`FortifyServiceProvider`、配置文件和所有必要的数据库迁移也将被发布。

接下来，应迁移数据库：

```shell
php artisan migrate
```

<a name="the-fortify-service-provider"></a>
### Fortify 服务提供者

上面讨论的 `vendor:publish` 命令还会发布 `App\Providers\FortifyServiceProvider` 类。应确保此类在应用 `config/app.php` 配置文件的 `providers` 数组中注册。

Fortify 服务提供者注册 Fortify 发布的动作，并指示 Fortify 在执行相应任务时使用它们。

<a name="fortify-features"></a>
### Fortify 功能

`fortify` 配置文件包含一个 `features` 配置数组。此数组定义 Fortify 默认将暴露哪些后端路由 / 功能。如果不将 Fortify 与 [Laravel Jetstream](https://jetstream.laravel.com) 结合使用，建议仅启用以下功能，即大多数 Laravel 应用提供的基本认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

<a name="disabling-views"></a>
### 禁用视图

默认情况下，Fortify 定义了旨在返回视图的路由，例如登录页面或注册页面。但如果正在构建 JavaScript 驱动的单页应用，可能不需要这些路由。因此，可以通过将应用 `config/fortify.php` 配置文件中的 `views` 配置值设置为 `false` 来完全禁用这些路由：

```php
'views' => false,
```

<a name="disabling-views-and-password-reset"></a>
#### 禁用视图与密码重置

如果选择禁用 Fortify 的视图且将为应用实现密码重置功能，仍应定义一个名为 `password.reset` 的路由，负责显示应用的"重置密码"视图。这是必要的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知将通过 `password.reset` 命名路由生成密码重置 URL。

<a name="authentication"></a>
## 认证

首先，需要指示 Fortify 如何返回"登录"视图。请记住，Fortify 是一个无头认证库。如果希望获得已完成的 Laravel 认证功能前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有认证视图的渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法。Fortify 将负责定义返回此视图的 `/login` 路由：

    use Laravel\Fortify\Fortify;

    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Fortify::loginView(function () {
            return view('auth.login');
        });

        // ...
    }

登录模板应包含一个向 `/login` 发起 POST 请求的表单。`/login` 端点期望接收字符串 `email` / `username` 和 `password`。邮箱 / 用户名字段的名称应与 `config/fortify.php` 配置文件中的 `username` 值匹配。此外，可以提供布尔值 `remember` 字段以指示用户希望使用 Laravel 提供的"记住我"功能。

如果登录尝试成功，Fortify 将重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，将返回 200 HTTP 响应。

如果请求不成功，用户将被重定向回登录页面，验证错误可通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。

<a name="customizing-user-authentication"></a>
### 自定义用户认证

Fortify 会根据提供的凭据和为应用配置的认证守卫自动检索并认证用户。但有时可能希望完全自定义如何认证登录凭据和检索用户。幸运的是，Fortify 允许通过 `Fortify::authenticateUsing` 方法轻松实现。

此方法接受一个接收传入 HTTP 请求的闭包。闭包负责验证附加到请求的登录凭据并返回关联的用户实例。如果凭据无效或找不到用户，闭包应返回 `null` 或 `false`。通常，应从 `FortifyServiceProvider` 的 `boot` 方法调用此方法：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
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

可以在应用的 `fortify` 配置文件中自定义 Fortify 使用的认证守卫。但应确保配置的守卫是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果尝试使用 Laravel Fortify 认证 SPA，应使用 Laravel 默认的 `web` 守卫并结合 [Laravel Sanctum](https://laravel.com/docs/sanctum)。

<a name="customizing-the-authentication-pipeline"></a>
### 自定义认证管道

Laravel Fortify 通过可调用类的管道认证登录请求。如果需要，可以定义自定义的类管道，登录请求应通过这些类传递。每个类应有一个 `__invoke` 方法，接收传入的 `Illuminate\Http\Request` 实例，以及类似[中间件](/docs/{{version}}/middleware)的 `$next` 变量，调用它以将请求传递给管道中的下一个类。

要定义自定义管道，可以使用 `Fortify::authenticateThrough` 方法。此方法接受一个闭包，应返回登录请求应通过的类数组。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法。

以下示例包含默认的管道定义，可作为自行修改的起点：

```php
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

Fortify::authenticateThrough(function (Request $request) {
    return array_filter([
            config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
    ]);
});
```

<a name="customizing-authentication-redirects"></a>
### 自定义重定向

如果登录尝试成功，Fortify 将重定向到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，将返回 200 HTTP 响应。用户登出应用后，将被重定向到 `/` URI。

如果需要对此行为进行高级自定义，可以将 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel [服务容器](/docs/{{version}}/container)中。通常，应在应用 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

```php
use Laravel\Fortify\Contracts\LogoutResponse;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
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

当启用 Fortify 的双因素认证功能时，用户在认证过程中需要输入六位数字令牌。此令牌使用基于时间的一次性密码（TOTP）生成，可从任何 TOTP 兼容的移动认证应用（如 Google Authenticator）获取。

开始之前，应首先确保应用的 `App\Models\User` 模型使用 `Laravel\Fortify\TwoFactorAuthenticatable` Trait：

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

接下来，应在应用中构建一个页面，供用户管理其双因素认证设置。此页面应允许用户启用和禁用双因素认证，以及重新生成双因素认证恢复码。

> 默认情况下，`fortify` 配置文件的 `features` 数组指示 Fortify 的双因素认证设置在修改前需要密码确认。因此，应用应先实现 Fortify 的[密码确认](#password-confirmation)功能再继续。

<a name="enabling-two-factor-authentication"></a>
### 启用双因素认证

要开始启用双因素认证，应用应向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户将被重定向回之前的 URL，`status` 会话变量将被设置为 `two-factor-authentication-enabled`。可以在模板中检测此 `status` 会话变量以显示适当的成功消息。如果请求是 XHR 请求，将返回 `200` HTTP 响应。

选择启用双因素认证后，用户仍须通过提供有效的双因素认证码来"确认"其双因素认证配置。因此，"成功"消息应告知用户仍需确认双因素认证：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two factor authentication below.
    </div>
@endif
```

接下来，应显示双因素认证二维码供用户扫描到其认证应用中。如果使用 Blade 渲染应用前端，可以通过用户实例上的 `twoFactorQrCodeSvg` 方法获取二维码 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果构建 JavaScript 驱动的前端，可以向 `/user/two-factor-qr-code` 端点发起 XHR GET 请求以获取用户的双因素认证二维码。此端点将返回包含 `svg` 键的 JSON 对象。

<a name="confirming-two-factor-authentication"></a>
#### 确认双因素认证

除了显示用户的双因素认证二维码外，还应提供一个文本输入框，供用户提供有效的认证码以"确认"其双因素认证配置。此码应通过向 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点发起 POST 请求提供给 Laravel 应用。

如果请求成功，用户将被重定向回之前的 URL，`status` 会话变量将被设置为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果向双因素认证确认端点的请求是通过 XHR 请求发起的，将返回 `200` HTTP 响应。

<a name="displaying-the-recovery-codes"></a>
#### 显示恢复码

还应显示用户的双因素恢复码。这些恢复码允许用户在无法访问移动设备时进行认证。如果使用 Blade 渲染应用前端，可以通过已认证用户实例访问恢复码：

```php
(array) $request->user()->recoveryCodes()
```

如果构建 JavaScript 驱动的前端，可以向 `/user/two-factor-recovery-codes` 端点发起 XHR GET 请求。此端点将返回包含用户恢复码的 JSON 数组。

要重新生成用户的恢复码，应用应向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

<a name="authenticating-with-two-factor-authentication"></a>
### 使用双因素认证登录

在认证过程中，Fortify 会自动将用户重定向到应用的双因素认证挑战页面。但如果应用发起的是 XHR 登录请求，成功认证尝试后返回的 JSON 响应将包含一个具有 `two_factor` 布尔属性的 JSON 对象。应检查此值以确定是否应重定向到应用的双因素认证挑战页面。

要开始实现双因素认证功能，需要指示 Fortify 如何返回双因素认证挑战视图。Fortify 的所有认证视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::twoFactorChallengeView(function () {
        return view('auth.two-factor-challenge');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/two-factor-challenge` 路由。`two-factor-challenge` 模板应包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 动作期望接收包含有效 TOTP 令牌的 `code` 字段或包含用户恢复码之一的 `recovery_code` 字段。

如果登录尝试成功，Fortify 将重定向用户到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果登录请求是 XHR 请求，将返回 204 HTTP 响应。

如果请求不成功，用户将被重定向回双因素挑战页面，验证错误可通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。

<a name="disabling-two-factor-authentication"></a>
### 禁用双因素认证

要禁用双因素认证，应用应向 `/user/two-factor-authentication` 端点发起 DELETE 请求。请记住，Fortify 的双因素认证端点在调用前需要[密码确认](#password-confirmation)。

<a name="registration"></a>
## 注册

要开始实现应用的注册功能，需要指示 Fortify 如何返回"注册"视图。请记住，Fortify 是一个无头认证库。如果希望获得已完成的 Laravel 认证功能前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::registerView(function () {
        return view('auth.register');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/register` 路由。`register` 模板应包含一个向 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点期望接收字符串 `name`、字符串邮箱地址 / 用户名、`password` 和 `password_confirmation` 字段。邮箱 / 用户名字段的名称应与应用 `fortify` 配置文件中定义的 `username` 配置值匹配。

如果注册尝试成功，Fortify 将重定向用户到应用 `fortify` 配置文件中通过 `home` 配置选项配置的 URI。如果请求是 XHR 请求，将返回 201 HTTP 响应。

如果请求不成功，用户将被重定向回注册页面，验证错误可通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。

<a name="customizing-registration"></a>
### 自定义注册

可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` 动作来自定义用户验证和创建过程。

<a name="password-reset"></a>
## 密码重置

<a name="requesting-a-password-reset-link"></a>
### 请求密码重置链接

要开始实现应用的密码重置功能，需要指示 Fortify 如何返回"忘记密码"视图。请记住，Fortify 是一个无头认证库。如果希望获得已完成的 Laravel 认证功能前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::requestPasswordResetLinkView(function () {
        return view('auth.forgot-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/forgot-password` 端点。`forgot-password` 模板应包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点期望接收字符串 `email` 字段。此字段 / 数据库列的名称应与应用 `fortify` 配置文件中的 `email` 配置值匹配。

<a name="handling-the-password-reset-link-request-response"></a>
#### 处理密码重置链接请求响应

如果密码重置链接请求成功，Fortify 将重定向用户回 `/forgot-password` 端点，并向用户发送包含安全链接的电子邮件，用户可使用该链接重置密码。如果请求是 XHR 请求，将返回 200 HTTP 响应。

成功请求后被重定向回 `/forgot-password` 端点后，可以使用 `status` 会话变量显示密码重置链接请求尝试的状态。此会话变量的值将与应用 `passwords` [语言文件](/docs/{{version}}/localization)中定义的翻译字符串之一匹配：

```html
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求不成功，用户将被重定向回请求密码重置链接页面，验证错误可通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。

<a name="resetting-the-password"></a>
### 重置密码

要完成实现应用的密码重置功能，需要指示 Fortify 如何返回"重置密码"视图。

Fortify 的所有视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::resetPasswordView(function ($request) {
        return view('auth.reset-password', ['request' => $request]);
    });

    // ...
}
```

Fortify 将负责定义显示此视图的路由。`reset-password` 模板应包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点期望接收字符串 `email` 字段、`password` 字段、`password_confirmation` 字段，以及名为 `token` 的隐藏字段（包含 `request()->route('token')` 的值）。"email"字段 / 数据库列的名称应与应用 `fortify` 配置文件中定义的 `email` 配置值匹配。

<a name="handling-the-password-reset-response"></a>
#### 处理密码重置响应

如果密码重置请求成功，Fortify 将重定向回 `/login` 路由，以便用户可以使用新密码登录。此外，将设置 `status` 会话变量，以便在登录页面显示重置成功的状态：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，将返回 200 HTTP 响应。

如果请求不成功，用户将被重定向回重置密码页面，验证错误可通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。

<a name="customizing-password-resets"></a>
### 自定义密码重置

可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` 动作来自定义密码重置过程。

<a name="email-verification"></a>
## 邮箱验证

注册后，可能希望用户在继续访问应用之前验证其邮箱地址。首先，确保在 `fortify` 配置文件的 `features` 数组中启用 `emailVerification` 功能。接下来，应确保 `App\Models\User` 类实现 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两个设置步骤后，新注册用户将收到一封电子邮件，提示其验证邮箱地址所有权。但需要告知 Fortify 如何显示邮箱验证页面，该页面告知用户需要点击电子邮件中的验证链接。

Fortify 的所有视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::verifyEmailView(function () {
        return view('auth.verify-email');
    });

    // ...
}
```

Fortify 将负责定义当用户被 Laravel 内置 `verified` 中间件重定向到 `/email/verify` 端点时显示此视图的路由。

`verify-email` 模板应包含一条信息性消息，指示用户点击已发送到其邮箱地址的验证链接。

<a name="resending-email-verification-links"></a>
#### 重新发送邮箱验证链接

如果需要，可以在应用的 `verify-email` 模板中添加一个按钮，触发向 `/email/verification-notification` 端点的 POST 请求。当此端点收到请求时，将向用户发送新的验证邮件链接，允许用户在之前的链接被意外删除或丢失时获取新的验证链接。

如果重新发送验证链接邮件的请求成功，Fortify 将重定向用户回 `/email/verify` 端点并带有 `status` 会话变量，允许向用户显示信息性消息告知操作成功。如果请求是 XHR 请求，将返回 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

<a name="protecting-routes"></a>
### 保护路由

要指定某个路由或路由组要求用户已验证邮箱地址，应将 Laravel 内置的 `verified` 中间件附加到该路由。此中间件在应用的 `App\Http\Kernel` 类中注册：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

<a name="password-confirmation"></a>
## 密码确认

构建应用时，偶尔会有一些操作要求用户在执行操作前确认其密码。通常，这些路由受 Laravel 内置的 `password.confirm` 中间件保护。

要开始实现密码确认功能，需要指示 Fortify 如何返回应用的"密码确认"视图。请记住，Fortify 是一个无头认证库。如果希望获得已完成的 Laravel 认证功能前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

Fortify 的所有视图渲染逻辑都可以使用 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，应从应用 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Fortify::confirmPasswordView(function () {
        return view('auth.confirm-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/user/confirm-password` 端点。`confirm-password` 模板应包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点期望接收包含用户当前密码的 `password` 字段。

如果密码与用户的当前密码匹配，Fortify 将重定向用户到其尝试访问的路由。如果请求是 XHR 请求，将返回 201 HTTP 响应。

如果请求不成功，用户将被重定向回确认密码页面，验证错误可通过共享的 `$errors` Blade 模板变量获取。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应返回。
