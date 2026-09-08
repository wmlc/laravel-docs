# Laravel Fortify

## 介绍

[Laravel Fortify](https://github.com/laravel/fortify) 是一个针对 Laravel 的、与前端无关的认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，你可以运行 `route:list` Artisan 命令查看 Fortify 注册的路由。

由于 Fortify 并不提供自己的用户界面，因此需要与你自己的用户界面配合使用，由它来向这些路由发起请求。本文档后面会详细说明如何向这些路由发起请求。

> [!NOTE]
> 请记住，Fortify 是一个用于帮助你实现 Laravel 认证功能的包。**你并非必须使用它。** 你完全可以按照 [用户认证](/topic/Laravel%2013.x/xq9zrgjvdo.html)、[密码重置](/topic/Laravel%2013.x/4rvgng3ydj.html) 和 [邮箱验证](/topic/Laravel%2013.x/3dykqooyl0.html) 文档中的说明，手动使用 Laravel 的认证服务。

### Fortify 是什么？

如前所述，Laravel Fortify 是一个针对 Laravel 的、与前端无关的认证后端实现。Fortify 注册了实现 Laravel 所有认证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**即使不使用 Fortify，也可以使用 Laravel 的认证功能。** 你完全可以按照 [用户认证](/topic/Laravel%2013.x/xq9zrgjvdo.html)、[密码重置](/topic/Laravel%2013.x/4rvgng3ydj.html) 和 [邮箱验证](/topic/Laravel%2013.x/3dykqooyl0.html) 文档中的说明，手动使用 Laravel 的认证服务。

如果你是 Laravel 新手，可以参考 [我们的应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。Laravel 的应用入门套件内部就使用了 Fortify 来提供认证脚手架，并附带基于 [Tailwind CSS](https://tailwindcss.com) 的用户界面。这便于你边学边熟悉 Laravel 的认证功能。

Laravel Fortify 实质上是把我们应用入门套件里的路由和控制器抽出为一个不包含用户界面的包。这让你可以快速搭建应用认证层的后端实现，而无需被任何特定的前端选型所束缚。

### 什么时候应该使用 Fortify？

你可能想知道 Laravel Fortify 的适用场景。首先，如果你正在使用 Laravel 的某个 [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)，就不必再单独安装 Laravel Fortify，因为这些套件都使用了 Fortify 并已经提供了完整的认证实现。

如果你没有使用应用入门套件，而你的应用又需要认证功能，那你有两个选择：自行实现认证功能，或者使用 Laravel Fortify 来提供这些功能的后端实现。

如果你选择安装 Fortify，你的用户界面将按照本文档的说明向 Fortify 的认证路由发起请求，以完成用户认证和注册。

如果你选择绕过 Fortify，直接手动使用 Laravel 的认证服务，可以按照 [用户认证](/topic/Laravel%2013.x/xq9zrgjvdo.html)、[密码重置](/topic/Laravel%2013.x/4rvgng3ydj.html) 和 [邮箱验证](/topic/Laravel%2013.x/3dykqooyl0.html) 文档中的说明进行操作。

#### Laravel Fortify 与 Laravel Sanctum

一些开发者会混淆 [Laravel Sanctum](/topic/Laravel%2013.x/xq9zr3jvdo.html) 与 Laravel Fortify。由于这两个包解决的是不同但又相关的问题，它们并不是互斥或竞争的关系。

Laravel Sanctum 只关注 API Token 管理以及使用 Session Cookie 或 Token 对现有用户进行认证。它不提供处理用户注册、密码重置等操作的路由。

如果你正打算为既提供 API 又作为单页应用后端的应用手动搭建认证层，那么 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（用于 API Token 管理、Session 认证）完全可以一起使用。

## 安装

首先，使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

该命令会把 Fortify 的 Actions 发布到 `app/Actions` 目录（如果该目录不存在将自动创建），同时也会发布 `FortifyServiceProvider`、配置文件以及所有必要的数据库迁移。

接下来，应当运行数据库迁移：

```shell
php artisan migrate
```

### Fortify 功能

`fortify` 配置文件中包含一个 `features` 配置数组。该数组定义了 Fortify 默认会暴露的后端路由/功能。我们建议只启用以下几项，这些也是大多数 Laravel 应用所需的基础认证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

### 禁用视图

默认情况下，Fortify 会定义一些用于返回视图的路由，例如登录页面和注册页面。但如果你正在构建 JavaScript 驱动的单页应用，则可能并不需要这些路由。为此，你可以把应用 `config/fortify.php` 配置文件中的 `views` 配置值设为 `false`，以完全禁用这些路由：

```php
'views' => false,
```

#### 禁用视图与密码重置

如果你选择禁用 Fortify 的视图，并且还要实现应用的密码重置功能，那么仍需定义一条名为 `password.reset` 的路由，用于渲染"重置密码"视图。这是必需的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知会通过名为 `password.reset` 的路由生成密码重置 URL。

## 用户认证

首先，我们需要告诉 Fortify 如何返回"登录"视图。请记住，Fortify 是一个无头（headless）的认证库。如果你想要一套开箱即用、已经完成的前端认证实现，应当使用 [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。

所有"登录"视图的渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法来自定义。通常应在应用的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用该方法。Fortify 会负责定义返回该视图的 `/login` 路由：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::loginView(function () {
        return view('auth.login');
    });

    // ...
}
```

你的登录模板应当包含一个对 `/login` 发 POST 请求的表单。`/login` 端点期待一个字符串类型的 `email` / `username` 字段以及一个 `password` 字段。其中 email / username 字段的名字必须与 `config/fortify.php` 配置文件中的 `username` 值一致。此外，还可以提供一个布尔型 `remember` 字段，用于表示用户希望使用 Laravel 提供的"记住我"功能。

如果登录尝试成功，Fortify 会把你重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。

如果登录失败，会被重定向回登录页面，校验错误可以通过共享的 Blade 模板变量 [Blade 模板变量 `$errors`](/topic/Laravel%2013.x/e296oew9q7.html) 获取；如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。

### 自定义用户认证

Fortify 会基于提供的凭据和应用配置的认证 Guard 自动获取并认证用户。但有时你可能希望完全自定义登录凭据的认证方式和用户的获取方式。幸运的是，Fortify 允许你通过 `Fortify::authenticateUsing` 方法轻松实现这一点。

该方法接受一个闭包作为参数，闭包接收传入的 HTTP 请求。闭包负责校验请求附带的登录凭据，并返回对应的用户实例。如果凭据无效或找不到用户，闭包应返回 `null` 或 `false`。通常应在 `FortifyServiceProvider` 的 `boot` 方法里调用该方法：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
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

#### 认证 Guard

你可以在应用的 `fortify` 配置文件中自定义 Fortify 使用的认证 Guard。但你需要确保所配置的 Guard 是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果你打算用 Laravel Fortify 来认证一个 SPA，应结合 [Laravel Sanctum](https://laravel.com/docs/sanctum) 使用 Laravel 默认的 `web` Guard。

### 自定义认证管道

Laravel Fortify 通过一组可调用类组成的管道来完成登录请求的认证。如果你愿意，可以定义一个由多个类组成、自定义顺序的管道，让登录请求依次穿过这些类。每个类都需要提供一个 `__invoke` 方法，接收传入的 `Illuminate\Http\Request` 实例，并像 [中间件](/topic/Laravel%2013.x/rwyl2exvz8.html) 一样接收一个 `$next` 变量，调用它即可将请求传递给管道中的下一个类。

要定义自定义管道，可以使用 `Fortify::authenticateThrough` 方法。该方法接收一个闭包，闭包应返回登录请求要依次穿过的类数组。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它。

下面的示例展示了默认的管道定义，你可以把它作为起点，再根据需要进行自定义：

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

#### 登录限流

默认情况下，Fortify 会使用 `EnsureLoginIsNotThrottled` 中间件对登录尝试进行限流。该中间件按照用户名与 IP 地址的组合作为唯一维度来限流。

某些应用可能需要不同的限流策略，例如仅按 IP 地址进行限流。为此，Fortify 允许你通过 `fortify.limiters.login` 配置项指定自己的 [限流器](/topic/Laravel%2013.x/dgy7xg5vw2.html)。当然，这个配置项位于应用的 `config/fortify.php` 配置文件中。

> [!NOTE]
> 将限流、[双重身份认证](/topic/Laravel%2013.x/x3vo0x4vm1.html) 和外部 Web 应用防火墙（WAF）结合使用，可以为合法应用用户提供最稳健的防御。

### 自定义重定向

如果登录尝试成功，Fortify 会把你重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回 200 HTTP 响应。用户登出应用后，将被重定向到 `/` URI。

如果你需要更高级的自定义行为，可以把 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 中。通常应在 `App\Providers\FortifyServiceProvider` 类的 `register` 方法里完成：

```php
use Laravel\Fortify\Contracts\LogoutResponse;

/**
 * 注册任何应用服务。
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

## 双重身份认证

启用 Fortify 的双重身份认证（2FA）后，用户在认证过程中需要输入一个 6 位数字令牌。该令牌基于时间一次性密码（TOTP）生成，可以从任何兼容 TOTP 的移动认证应用（如 Google Authenticator）获取。

开始之前，应先确认应用的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` trait：

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

接下来，应当在应用内构建一个页面，让用户管理双重身份认证的相关设置。该页面应允许用户启用和关闭双重身份认证，以及重新生成恢复码。

> 默认情况下，`fortify` 配置文件的 `features` 数组指示 Fortify 在修改双重身份认证设置前要求密码确认。因此，在继续之前，你的应用应当先实现 Fortify 的 密码确认 功能。

### 启用双重身份认证

要开始启用双重身份认证，应用应向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户将被重定向回上一个 URL，且 `status` Session 变量会被设为 `two-factor-authentication-enabled`。你可以在模板里检测该 `status` Session 变量，以显示相应的成功消息。如果请求是 XHR 请求，则会返回 `200` HTTP 响应。

用户在选择启用双重身份认证之后，还必须提供有效的双重身份认证代码来"确认"此次配置。因此，你的"成功"消息应当提示用户：双重身份认证的确认步骤仍是必需的：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two-factor authentication below.
    </div>
@endif
```

接下来，应当向用户展示双重身份认证的二维码，用户可使用认证 App 扫描该二维码。如果使用 Blade 渲染应用前端，可以通过用户实例上的 `twoFactorQrCodeSvg` 方法获取二维码的 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果你正在构建 JavaScript 驱动的前端，可以发起 XHR GET 请求访问 `/user/two-factor-qr-code` 端点来获取用户的双重身份认证二维码。该端点会返回一个包含 `svg` 键的 JSON 对象。

#### 确认双重身份认证

除了展示用户的双重身份认证二维码，还应提供一个文本输入框，供用户输入有效的认证代码来"确认"其双重身份认证配置。该代码应通过 POST 请求提交到 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点。

如果请求成功，用户将被重定向回上一个 URL，并将 `status` Session 变量设为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two-factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果向双重身份认证确认端点发起的请求是 XHR 请求，会返回 `200` HTTP 响应。

#### 显示恢复码

你还应当显示用户的双重身份认证恢复码。这些恢复码用于在用户无法使用移动设备时进行认证。如果使用 Blade 渲染应用前端，可以通过已认证的用户实例拿到这些恢复码：

```php
(array) $request->user()->recoveryCodes()
```

如果你正在构建 JavaScript 驱动的前端，可以发起 XHR GET 请求访问 `/user/two-factor-recovery-codes` 端点。该端点会返回一个包含用户恢复码的 JSON 数组。

要重新生成用户的恢复码，应用应当向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

### 使用双重身份认证进行登录

在认证过程中，Fortify 会自动把用户重定向到应用的双重身份认证挑战页面。如果你的应用发起的是 XHR 登录请求，则成功登录后返回的 JSON 响应中会包含一个 `two_factor` 布尔字段。你应当检查该值，以决定是否需要把用户重定向到双重身份认证挑战页面。

要开始实现双重身份认证功能，我们需要告诉 Fortify 如何返回双重身份认证挑战视图。所有 Fortify 的认证视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::twoFactorChallengeView(function () {
        return view('auth.two-factor-challenge');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/two-factor-challenge` 路由。你的 `two-factor-challenge` 模板应当包含一个对 `/two-factor-challenge` 端点发 POST 请求的表单。该动作接收 `code` 字段（包含有效的 TOTP 令牌）或 `recovery_code` 字段（包含用户的某个恢复码）。

如果登录成功，Fortify 会把用户重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果登录请求是 XHR 请求，则会返回 204 HTTP 响应。

如果登录失败，用户将被重定向回双重身份认证挑战页面，校验错误可以通过共享的 [Blade 模板变量 `$errors`](/topic/Laravel%2013.x/e296oew9q7.html) 获取。如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。

### 关闭双重身份认证

要关闭双重身份认证，应用应向 `/user/two-factor-authentication` 端点发起 DELETE 请求。请注意，Fortify 的双重身份认证相关端点在被调用前需要进行 密码确认。

## 通行密钥

Fortify 通过 WebAuthn 支持通行密钥（Passkey）认证。通行密钥允许用户在不使用密码的情况下进行认证，使用平台认证器（如 Face ID、Touch ID、Windows Hello）或硬件安全密钥。

### 启用通行密钥

首先，确保应用的 `fortify` 配置文件里启用了 `passkeys` 功能：

```php
use Laravel\Fortify\Features;

'features' => [
    // ...
    Features::passkeys([
        'confirmPassword' => true,
    ]),
],
```

`confirmPassword` 选项决定 Fortify 是否在注册或删除通行密钥前要求进行 密码确认。

接下来，确保应用的 `App\Models\User` 模型实现了 `Laravel\Fortify\Contracts\PasskeyUser` 接口，并使用了 `Laravel\Fortify\PasskeyAuthenticatable` trait：

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

Fortify 的通行密钥相关配置项可以通过应用 `config/fortify.php` 文件中的 `passkeys` 配置数组进行自定义：

```php
'passkeys' => [
    'relying_party_id' => parse_url(config('app.url'), PHP_URL_HOST),
    'allowed_origins' => [config('app.url')],
    'user_handle_secret' => config('app.key'),
    'timeout' => 60000,
],
```

> [!NOTE]
> Fortify 封装了 `laravel/passkeys` Composer 包并为你完成相关配置。如果你在使用 Fortify 的通行密钥功能，请通过 `config/fortify.php` 配置通行密钥。无需发布 `laravel/passkeys` 的配置文件，在那里配置的值会被 Fortify 覆盖。

`relying_party_id` 应当与应用域名匹配。`allowed_origins` 数组列出了可以完成通行密钥注册和认证的浏览器来源。`user_handle_secret` 用于派生不透明的用户标识符，保证在多次注册通行密钥时能识别出同一个用户。`timeout` 选项控制通行密钥注册和认证操作的最长持续时间。

Fortify 为其通行密钥登录、确认和注册路由应用了专门的通行密钥限流器。如有需要，你可以通过 `fortify.limiters.passkeys` 配置项和相应的 `RateLimiter::for(...)` 定义来自定义该限流器。

### JavaScript 客户端

如果你在构建自定义前端（包括带有浏览器端脚本的 Blade 应用），可以使用官方的 [`@laravel/passkeys`](https://www.npmjs.com/package/@laravel/passkeys) 包。该包会处理浏览器的 WebAuthn 流程，并向 Fortify 的通行密钥端点发起请求。

通过 npm 安装该包：

```shell
npm install @laravel/passkeys
```

然后，你可以从前端启动通行密钥的注册和校验：

```js
import { Passkeys } from "@laravel/passkeys";

await Passkeys.register({ name: "MacBook Pro" });
await Passkeys.verify();
```

如果你的应用使用自定义的通行密钥端点 URI，可以针对单次调用覆盖相关路由：

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

该包还通过 `@laravel/passkeys/react`、`@laravel/passkeys/vue` 和 `@laravel/passkeys/svelte` 提供 React、Vue 和 Svelte 的辅助函数。

### 使用通行密钥登录

要使用通行密钥认证用户，应用应当先向 `/passkeys/login/options` 端点发起 GET 请求。该端点会返回 WebAuthn 挑战选项，前端应将其传给 `navigator.credentials.get(...)`。

浏览器返回凭据后，应用应向 `/passkeys/login` 发起 POST 请求，把凭据负载作为请求体，同时也可以包含一个布尔型 `remember` 字段。

如果请求成功，Fortify 会把用户登录到配置好的 Guard，并返回以下两种之一：

<div class="content-list" markdown="1">

- 对常规请求，重定向到你期望的目标页面。
- 对 XHR 请求，返回 `200` HTTP 响应，其中 JSON 负载包含 `redirect` 键。

</div>

### 使用通行密钥确认密码

针对已认证的会话，Fortify 提供了通行密钥确认端点，能够满足 Laravel 为当前会话设置的"密码确认"要求。

要使用通行密钥进行确认，应用应先发起 GET 请求访问 `/passkeys/confirm/options`。该端点会返回 WebAuthn 挑战选项，前端应将其传给 `navigator.credentials.get(...)`。

浏览器返回凭据后，应用应向 `/passkeys/confirm` 发起 POST 请求，把凭据负载作为请求体。

如果请求成功，Fortify 会把当前会话标记为密码已确认，并返回以下两种之一：

<div class="content-list" markdown="1">

- 对常规请求，重定向到你期望的目标页面。
- 对 XHR 请求，返回 `200` HTTP 响应，其中 JSON 负载包含 `redirect` 键。

</div>

### 注册通行密钥

为已认证用户注册通行密钥时，应用应先发起 GET 请求访问 `/user/passkeys/options`。该端点会返回 WebAuthn 创建选项，前端应将其传给 `navigator.credentials.create(...)`。

浏览器返回凭据后，应用应向 `/user/passkeys` 发起 POST 请求，请求体携带 `name` 字段以及 `credential` 字段（其值为 `navigator.credentials.create(...)` 返回的 [`PublicKeyCredential`](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential) 对象序列化结果）。

如果请求成功，Fortify 会返回以下两种之一：

<div class="content-list" markdown="1">

- 对常规请求，进行重定向回退响应，并把 `passkey-registered` 状态写入 Session。
- 对 XHR 请求，返回 `200` HTTP 响应，JSON 负载包含 `status` 键以及刚刚注册通行密钥的 `id` 和 `name`。

</div>

### 删除通行密钥

要删除某个通行密钥，应用应当向 `/user/passkeys/{passkey}` 发起 DELETE 请求。

如果请求成功，Fortify 会返回以下两种之一：

<div class="content-list" markdown="1">

- 对常规请求，进行重定向回退响应，并把 `passkey-deleted` 状态写入 Session。
- 对 XHR 请求，返回 `200` HTTP 响应，JSON 负载包含 `status` 键。

</div>

## 用户注册

要开始实现用户注册功能，我们需要告诉 Fortify 如何返回"register"视图。请记住，Fortify 是一个无头（headless）的认证库。如果你想要一套开箱即用、已经完成的前端认证实现，应当使用 [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::registerView(function () {
        return view('auth.register');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/register` 路由。你的 `register` 模板应当包含一个表单，对 Fortify 定义的 `/register` 端点发起 POST 请求。

`/register` 端点期待以下字段：字符串类型 `name`、字符串类型的邮箱地址 / 用户名、`password` 和 `password_confirmation`。邮箱 / 用户名字段的名字必须与应用 `fortify` 配置文件中定义的 `username` 配置值一致。

如果注册请求成功，Fortify 会把用户重定向到应用 `fortify` 配置文件中通过 `home` 配置项配置的 URI。如果注册请求是 XHR 请求，则会返回 201 HTTP 响应。

如果注册请求失败，用户将被重定向回注册页面，校验错误可以通过共享的 [Blade 模板变量 `$errors`](/topic/Laravel%2013.x/e296oew9q7.html) 获取。如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。

### 自定义注册

可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` Action 来自定义用户校验与创建流程。

## 重置密码

### 请求重置密码链接

要开始实现密码重置功能，我们需要告诉 Fortify 如何返回"忘记密码（forgot password）"视图。请记住，Fortify 是一个无头（headless）的认证库。如果你想要一套开箱即用、已经完成的前端认证实现，应当使用 [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::requestPasswordResetLinkView(function () {
        return view('auth.forgot-password');
    });

    // ...
}
```

Fortify 会负责定义返回该视图的 `/forgot-password` 端点。你的 `forgot-password` 模板应当包含一个表单，对 `/forgot-password` 端点发起 POST 请求。

`/forgot-password` 端点需要一个字符串类型的 `email` 字段。该字段的名字 / 数据库列必须与应用 `fortify` 配置文件中 `email` 配置值一致。

#### 处理重置密码链接请求的响应

如果重置密码链接请求成功，Fortify 会把用户重定向回 `/forgot-password` 端点，并向用户发送一封包含安全链接的邮件，用户可以通过该链接重置密码。如果请求是 XHR 请求，则会返回 200 HTTP 响应。

请求成功后被重定向回 `/forgot-password` 端点时，可以使用 `status` Session 变量来显示重置密码链接请求的状态。

`$status` Session 变量的值将与应用 [语言文件](/topic/Laravel%2013.x/kpv13q298w.html) `passwords` 中定义的某条翻译字符串匹配。如果你想自定义这一值但还没有发布 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布后再修改：

```html
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求失败，用户将被重定向回"请求重置密码链接"页面，校验错误可以通过共享的 [Blade 模板变量 `$errors`](/topic/Laravel%2013.x/e296oew9q7.html) 获取。如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。

### 重置密码

要完成密码重置功能，我们还需要告诉 Fortify 如何返回"重置密码（reset password）"视图。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::resetPasswordView(function (Request $request) {
        return view('auth.reset-password', ['request' => $request]);
    });

    // ...
}
```

Fortify 会负责定义用于显示该视图的路由。你的 `reset-password` 模板应当包含一个对 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点需要一个字符串类型 `email` 字段、一个 `password` 字段、一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段，其值为 `request()->route('token')`。email 字段的名字 / 数据库列必须与应用 `fortify` 配置文件中 `email` 配置值一致。

#### 处理重置密码请求的响应

如果重置密码请求成功，Fortify 会重定向回 `/login` 路由，以便用户用新密码登录。此外，还会设置一个 `status` Session 变量，便于你在登录页面显示重置成功状态：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，则会返回 200 HTTP 响应。

如果请求失败，用户将被重定向回"重置密码"页面，校验错误可以通过共享的 [Blade 模板变量 `$errors`](/topic/Laravel%2013.x/e296oew9q7.html) 获取。如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。

### 自定义密码重置

可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` Action 来自定义密码重置流程。

## 邮箱验证

注册之后，你可能希望用户在继续访问应用前先验证邮箱。要开始使用，请先确保 `fortify` 配置文件 `features` 数组里启用了 `emailVerification` 功能。接下来，确保你的 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两个设置后，新注册的用户将收到一封邮件，要求他们验证邮箱所有权。但我们还需要告诉 Fortify 如何渲染那个提示用户去邮箱里点击验证链接的"邮箱验证"页面。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::verifyEmailView(function () {
        return view('auth.verify-email');
    });

    // ...
}
```

当用户被 Laravel 内置的 `verified` 中间件重定向到 `/email/verify` 端点时，Fortify 会负责定义用于显示该视图的路由。

你的 `verify-email` 模板应当包含一条提示信息，告诉用户需要点击邮件里的验证链接。

#### 重新发送邮箱验证链接

如果你愿意，可以在你应用的 `verify-email` 模板中加一个按钮，用于向 `/email/verification-notification` 端点发起 POST 请求。当该端点收到请求时，会向用户发送一封新的验证邮件，便于用户在之前的链接被误删或丢失时获得新的验证链接。

如果重新发送验证邮件的请求成功，Fortify 会把用户重定向回 `/email/verify` 端点并带上一个 `status` Session 变量，便于你向用户展示一条提示操作成功的消息。如果请求是 XHR 请求，则会返回 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

### 保护路由

要指定某条路由或某个路由组需要用户已经验证过邮箱，可以把 Laravel 内置的 `verified` 中间件挂到该路由上。`verified` 中间件别名由 Laravel 自动注册，是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

## 密码确认

在构建应用时，偶尔会遇到这样的情形：某些操作在执行前需要用户先确认自己的密码。通常这些路由会使用 Laravel 内置的 `password.confirm` 中间件来保护。

要开始实现密码确认功能，我们需要告诉 Fortify 如何返回应用的"密码确认"视图。请记住，Fortify 是一个无头（headless）的认证库。如果你想要一套开箱即用、已经完成的前端认证实现，应当使用 [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类上的相应方法进行自定义。通常应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法里调用它：

```php
use Laravel\Fortify\Fortify;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Fortify::confirmPasswordView(function () {
        return view('auth.confirm-password');
    });

    // ...
}
```

Fortify 会负责定义 `/user/confirm-password` 端点，用于返回该视图。你的 `confirm-password` 模板应当包含一个对 `/user/confirm-password` 端点发起 POST 请求的表单。该端点需要一个 `password` 字段，其值为用户的当前密码。

如果密码与用户当前的密码匹配，Fortify 会重定向回用户原本想访问的路由。如果请求是 XHR 请求，则会返回 201 HTTP 响应。

如果请求失败，用户将被重定向回"密码确认"页面，校验错误可以通过共享的 Blade 模板变量 `$errors` 获取。如果请求是 XHR 请求，校验错误会随 422 HTTP 响应一同返回。