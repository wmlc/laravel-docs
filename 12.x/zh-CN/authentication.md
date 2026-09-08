# 用户认证

- [简介](#introduction)
    - [入门套件](#starter-kits)
    - [数据库注意事项](#introduction-database-considerations)
    - [生态概览](#ecosystem-overview)
- [用户认证快速入门](#authentication-quickstart)
    - [安装入门套件](#install-a-starter-kit)
    - [获取已认证用户](#retrieving-the-authenticated-user)
    - [保护路由](#protecting-routes)
    - [登录节流](#login-throttling)
- [手动认证用户](#authenticating-users)
    - [记住用户](#remembering-users)
    - [其他认证方式](#other-authentication-methods)
- [HTTP Basic 认证](#http-basic-authentication)
    - [无状态 HTTP Basic 认证](#stateless-http-basic-authentication)
- [登出](#logging-out)
    - [使其他设备上的会话失效](#invalidating-sessions-on-other-devices)
- [密码确认](#password-confirmation)
    - [配置](#password-confirmation-configuration)
    - [路由](#password-confirmation-routing)
    - [保护路由](#password-confirmation-protecting-routes)
- [添加自定义守卫](#adding-custom-guards)
    - [闭包请求守卫](#closure-request-guards)
- [添加自定义用户提供者](#adding-custom-user-providers)
    - [用户提供者契约](#the-user-provider-contract)
    - [Authenticatable 契约](#the-authenticatable-contract)
- [自动密码重新哈希](#automatic-password-rehashing)
- [社交认证](/docs/{{version}}/socialite)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用都会为用户提供向应用认证并「登录」的方式。在 Web 应用中实现这一功能可能是一项复杂且存在潜在风险的工作。为此，Laravel 致力于为你提供所需的工具，让你能够快速、安全、轻松地实现认证。

Laravel 的认证设施由「守卫（guard）」和「提供者（provider）」组成。守卫定义了如何对每个请求的用户进行认证。例如，Laravel 内置了一个 `session` 守卫，它使用会话存储和 Cookie 来维持状态。

提供者定义了如何从持久化存储中获取用户。Laravel 内置支持使用 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构造器来获取用户。不过，你可以根据应用的需要自由定义额外的提供者。

应用的认证配置文件位于 `config/auth.php`。该文件包含若干带有详尽说明的选项，用于调整 Laravel 认证服务的行为。

> [!NOTE]
> 守卫和提供者不应与「角色」和「权限」混淆。要了解如何通过权限授权用户操作，请参阅[授权](/docs/{{version}}/authorization)文档。

<a name="starter-kits"></a>
### 入门套件

想快速上手？在一个全新的 Laravel 应用中安装 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。迁移数据库后，在浏览器中访问 `/register` 或分配给应用的任何其他 URL。入门套件会帮你搭建整个认证系统！

**即使你最终选择不在 Laravel 应用中使用入门套件，安装[入门套件](/docs/{{version}}/starter-kits)也是学习如何在真实的 Laravel 项目中实现 Laravel 全部认证功能的绝佳机会。**由于 Laravel 入门套件已经为你提供了认证控制器、路由和视图，你可以查看这些文件中的代码，学习 Laravel 的认证功能是如何实现的。

<a name="introduction-database-considerations"></a>
### 数据库注意事项

默认情况下，Laravel 会在你的 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可与默认的 Eloquent 认证驱动配合使用。

如果你的应用没有使用 Eloquent，你可以使用 `database` 认证提供者，它使用 Laravel 查询构造器。如果你的应用使用 MongoDB，请查看 MongoDB 官方的 [Laravel 用户认证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

为 `App\Models\User` 模型构建数据库结构时，请确保密码列的长度至少为 60 个字符。当然，新 Laravel 应用中自带的 `users` 表迁移已经创建了超过这个长度的列。

此外，你应确认你的 `users` 表（或同等作用的表）包含一个长度为 100 字符、可为空的字符串 `remember_token` 列。该列将用于为登录应用时勾选「记住我」选项的用户存储令牌。同样，新 Laravel 应用中自带的默认 `users` 表迁移已经包含这一列。

<a name="ecosystem-overview"></a>
### 生态概览

Laravel 提供了多个与认证相关的扩展包。在继续之前，我们将回顾 Laravel 的整体认证生态，并讨论每个扩展包的预期用途。

首先，考虑认证的工作原理。使用 Web 浏览器时，用户会通过登录表单提供用户名和密码。如果这些凭据正确，应用会将已认证用户的信息存储到用户的[会话](/docs/{{version}}/session)中。发给浏览器的 Cookie 包含会话 ID，这样后续对应用的请求就能将用户与正确的会话关联起来。应用收到会话 Cookie 后，会根据会话 ID 检索会话数据，注意到认证信息已存储在会话中，就会将用户视为「已认证」。

当远程服务需要认证以访问 API 时，由于没有 Web 浏览器，通常不会使用 Cookie 进行认证。取而代之的是，远程服务在每次请求时向 API 发送一个 API 令牌。应用可以将传入的令牌与有效 API 令牌表进行比对，并将该请求「认证」为由该 API 令牌关联的用户发起。

<a name="laravels-built-in-browser-authentication-services"></a>
#### Laravel 内置的浏览器认证服务

Laravel 包含内置的认证和会话服务，通常通过 `Auth` 和 `Session` Facade 访问。这些功能为从 Web 浏览器发起的请求提供基于 Cookie 的认证。它们提供的方法允许你验证用户的凭据并对用户进行认证。此外，这些服务会自动将正确的认证数据存储到用户的会话中，并向用户发放会话 Cookie。如何使用这些服务的讨论包含在本文档中。

**应用入门套件**

如本文档所述，你可以手动与这些认证服务交互，构建应用自己的认证层。不过，为了帮助你更快上手，我们发布了[免费的入门套件](/docs/{{version}}/starter-kits)，它们为整个认证层提供了健壮、现代的脚手架。

<a name="laravels-api-authentication-services"></a>
#### Laravel 的 API 认证服务

Laravel 提供了两个可选扩展包，帮助你管理 API 令牌并认证使用 API 令牌发起的请求：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不互斥。这些库主要专注于 API 令牌认证，而内置的认证服务专注于基于 Cookie 的浏览器认证。许多应用会同时使用 Laravel 内置的基于 Cookie 的认证服务和 Laravel 的某个 API 认证扩展包。

**Passport**

Passport 是一个 OAuth2 认证提供者，提供多种 OAuth2「授权类型」，允许你签发各种类型的令牌。总的来说，这是一个用于 API 认证的健壮而复杂的扩展包。然而，大多数应用并不需要 OAuth2 规范提供的复杂功能，这些功能对用户和开发者来说都可能令人困惑。此外，开发者一直对如何使用 Passport 这类 OAuth2 认证提供者来认证 SPA 应用或移动应用感到困惑。

**Sanctum**

针对 OAuth2 的复杂性和开发者的困惑，我们着手构建一个更简单、更精简的认证扩展包，它既能处理来自 Web 浏览器的第一方 Web 请求，也能处理基于令牌的 API 请求。这一目标随着 [Laravel Sanctum](/docs/{{version}}/sanctum) 的发布而实现。对于除了 API 之外还提供第一方 Web 界面的应用、由独立于后端 Laravel 应用的单页应用（SPA）驱动的应用，以及提供移动客户端的应用，Sanctum 应被视为首选和推荐的认证扩展包。

Laravel Sanctum 是一个混合的 Web / API 认证扩展包，可以管理应用的整个认证流程。之所以可行，是因为当基于 Sanctum 的应用收到请求时，Sanctum 会首先判断该请求是否包含引用已认证会话的会话 Cookie。Sanctum 通过调用我们之前讨论过的 Laravel 内置认证服务来完成这一判断。如果请求并非通过会话 Cookie 认证，Sanctum 会检查请求中是否带有 API 令牌。如果存在 API 令牌，Sanctum 会使用该令牌对请求进行认证。要了解这一流程的更多信息，请查阅 Sanctum 的[「工作原理」](/docs/{{version}}/sanctum#how-it-works)文档。

<a name="summary-choosing-your-stack"></a>
#### 小结与技术选型

总而言之，如果你的应用会通过浏览器访问，并且你正在构建单体 Laravel 应用，那么你的应用将使用 Laravel 内置的认证服务。

其次，如果你的应用提供供第三方调用的 API，你将在 [Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum) 之间选择一个，为应用提供 API 令牌认证。一般来说，应尽可能优先选择 Sanctum，因为它是 API 认证、SPA 认证和移动认证的简单而完整的解决方案，并支持「作用域」或「能力」。

如果你正在构建由 Laravel 后端驱动的单页应用（SPA），你应当使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你需要[手动实现自己的后端认证路由](#authenticating-users)，或者使用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，它为注册、密码重置、邮箱验证等功能提供路由和控制器。

当你的应用确实需要 OAuth2 规范提供的全部功能时，才应选择 Passport。

此外，如果你想快速上手，我们很高兴向你推荐[我们的应用入门套件](/docs/{{version}}/starter-kits)，这是快速启动一个新 Laravel 应用的捷径，该应用已经采用了我们首选的认证技术栈，即 Laravel 内置的认证服务。

<a name="authentication-quickstart"></a>
## 用户认证快速入门

> [!WARNING]
> 本部分文档讨论如何通过 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)认证用户，其中包含帮助你快速上手的界面脚手架。如果你想直接与 Laravel 的认证系统集成，请查看[手动认证用户](#authenticating-users)的文档。

<a name="install-a-starter-kit"></a>
### 安装入门套件

首先，你应当[安装 Laravel 应用入门套件](/docs/{{version}}/starter-kits)。我们的入门套件为在全新 Laravel 应用中引入认证提供了设计精美的起点。

<a name="retrieving-the-authenticated-user"></a>
### 获取已认证用户

基于入门套件创建应用并允许用户注册和认证之后，你经常需要与当前已认证的用户交互。在处理传入请求时，你可以通过 `Auth` Facade 的 `user` 方法访问已认证的用户：

```php
use Illuminate\Support\Facades\Auth;

// 获取当前已认证的用户...
$user = Auth::user();

// 获取当前已认证用户的 ID...
$id = Auth::id();
```

此外，用户认证之后，你还可以通过 `Illuminate\Http\Request` 实例访问已认证的用户。请记住，类型提示的类会被自动注入到你的控制器方法中。通过类型提示 `Illuminate\Http\Request` 对象，你可以在应用的任何控制器方法中，通过请求的 `user` 方法便捷地访问已认证的用户：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 更新现有航班的信息。
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // ...

        return redirect('/flights');
    }
}
```

<a name="determining-if-the-current-user-is-authenticated"></a>
#### 判断当前用户是否已认证

要判断发起传入 HTTP 请求的用户是否已认证，你可以使用 `Auth` Facade 的 `check` 方法。如果用户已认证，该方法将返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // 用户已登录...
}
```

> [!NOTE]
> 尽管可以使用 `check` 方法判断用户是否已认证，但通常你会使用中间件在允许用户访问某些路由 / 控制器之前验证其是否已认证。要了解更多信息，请查看[保护路由](/docs/{{version}}/authentication#protecting-routes)的文档。

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于只允许已认证的用户访问给定路由。Laravel 内置了一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的[中间件别名](/docs/{{version}}/middleware#middleware-aliases)。由于该中间件已由 Laravel 在内部设置了别名，你只需将该中间件附加到路由定义中即可：

```php
Route::get('/flights', function () {
    // 只有已认证的用户才能访问此路由...
})->middleware('auth');
```

<a name="redirecting-unauthenticated-users"></a>
#### 重定向未认证用户

当 `auth` 中间件检测到未认证的用户时，会将用户重定向到 `login` [命名路由](/docs/{{version}}/routing#named-routes)。你可以在应用的 `bootstrap/app.php` 文件中使用 `redirectGuestsTo` 方法修改这一行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo('/login');

    // 使用闭包...
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

<a name="redirecting-authenticated-users"></a>
#### 重定向已认证用户

当 `guest` 中间件检测到已认证的用户时，会将用户重定向到 `dashboard` 或 `home` 命名路由。你可以在应用的 `bootstrap/app.php` 文件中使用 `redirectUsersTo` 方法修改这一行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectUsersTo('/panel');

    // 使用闭包...
    $middleware->redirectUsersTo(fn (Request $request) => route('panel'));
})
```

<a name="specifying-a-guard"></a>
#### 指定守卫

将 `auth` 中间件附加到路由时，你还可以指定应使用哪个「守卫」来认证用户。指定的守卫应对应 `auth.php` 配置文件中 `guards` 数组里的某个键：

```php
Route::get('/flights', function () {
    // 只有已认证的用户才能访问此路由...
})->middleware('auth:admin');
```

<a name="login-throttling"></a>
### 登录节流

如果你在使用我们的某个[应用入门套件](/docs/{{version}}/starter-kits)，速率限制会自动应用于登录尝试。默认情况下，用户在多次尝试后仍未能提供正确的凭据，将有一分钟无法登录。节流针对用户的用户名 / 邮箱地址及其 IP 地址是唯一的。

> [!NOTE]
> 如果你想对应用中的其他路由进行速率限制，请查看[速率限制文档](/docs/{{version}}/routing#rate-limiting)。

<a name="authenticating-users"></a>
## 手动认证用户

并非必须使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)附带的认证脚手架。如果你选择不使用这些脚手架，就需要直接使用 Laravel 的认证类来管理用户认证。别担心，这很容易！

我们将通过 `Auth` [Facade](/docs/{{version}}/facades) 访问 Laravel 的认证服务，因此需要确保在类顶部导入 `Auth` Facade。接下来，让我们看看 `attempt` 方法。`attempt` 方法通常用于处理来自应用「登录」表单的认证尝试。如果认证成功，你应当重新生成用户的[会话](/docs/{{version}}/session)，以防止[会话固定](https://en.wikipedia.org/wiki/Session_fixation)攻击：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * 处理认证尝试。
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}
```

`attempt` 方法接受一个键 / 值对数组作为第一个参数。数组中的值将用于在你的数据库表中查找用户。因此，在上面的例子中，用户将通过 `email` 列的值检索。如果找到用户，存储在数据库中的哈希密码将与通过数组传递给该方法的 `password` 值进行比较。你不需要对传入请求的 `password` 值进行哈希处理，因为框架会在将其与数据库中的哈希密码比较之前自动哈希。如果两个哈希密码匹配，系统将为该用户启动已认证的会话。

请记住，Laravel 的认证服务会根据认证守卫的「提供者」配置从数据库中获取用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示其在获取用户时使用 `App\Models\User` 模型。你可以根据应用的需要在配置文件中修改这些值。

如果认证成功，`attempt` 方法将返回 `true`；否则返回 `false`。

Laravel 重定向器提供的 `intended` 方法会将用户重定向到其被认证中间件拦截之前尝试访问的 URL。你也可以为该方法提供一个后备 URI，以备目标目的地不可用时使用。

<a name="specifying-additional-conditions"></a>
#### 指定附加条件

如果需要，除了用户的邮箱和密码之外，你还可以为认证查询添加额外的查询条件。为此，我们只需向传递给 `attempt` 方法的数组中添加查询条件即可。例如，我们可以验证用户是否被标记为「活跃」：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // 认证成功...
}
```

对于复杂的查询条件，你可以在凭据数组中提供一个闭包。该闭包将接收查询实例，让你能够根据应用的需要自定义查询：

```php
use Illuminate\Database\Eloquent\Builder;

if (Auth::attempt([
    'email' => $email,
    'password' => $password,
    fn (Builder $query) => $query->has('activeSubscription'),
])) {
    // 认证成功...
}
```

> [!WARNING]
> 在这些例子中，`email` 并非必填选项，它只是作为示例使用。你应当使用数据库表中对应「用户名」的列名。

`attemptWhen` 方法接受一个闭包作为第二个参数，可用于在真正认证用户之前，对候选用户进行更全面的检查。闭包会接收候选用户，并应返回 `true` 或 `false`，以表明是否可以认证该用户：

```php
if (Auth::attemptWhen([
    'email' => $email,
    'password' => $password,
], function (User $user) {
    return $user->isNotBanned();
})) {
    // 认证成功...
}
```

<a name="accessing-specific-guard-instances"></a>
#### 访问特定的守卫实例

通过 `Auth` Facade 的 `guard` 方法，你可以指定在认证用户时希望使用哪个守卫实例。这让你能够使用完全独立的可认证模型或用户表，来管理应用不同部分的认证。

传递给 `guard` 方法的守卫名应对应 `auth.php` 配置文件中配置的某个守卫：

```php
if (Auth::guard('admin')->attempt($credentials)) {
    // ...
}
```

<a name="remembering-users"></a>
### 记住用户

许多 Web 应用会在登录表单中提供「记住我」复选框。如果你希望在自己的应用中提供「记住我」功能，可以向 `attempt` 方法传递一个布尔值作为第二个参数。

当该值为 `true` 时，Laravel 会无限期地保持用户的认证状态，直到用户手动登出。你的 `users` 表必须包含字符串类型的 `remember_token` 列，用于存储「记住我」令牌。新 Laravel 应用中自带的 `users` 表迁移已经包含这一列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
    // 该用户正在被记住...
}
```

如果你的应用提供「记住我」功能，你可以使用 `viaRemember` 方法判断当前已认证的用户是否是通过「记住我」Cookie 认证的：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
    // ...
}
```

<a name="other-authentication-methods"></a>
### 其他认证方式

<a name="authenticate-a-user-instance"></a>
#### 认证用户实例

如果你需要将一个已有的用户实例设置为当前已认证的用户，可以将该用户实例传递给 `Auth` Facade 的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts)的实现。Laravel 自带的 `App\Models\User` 模型已经实现了该接口。当你已经拥有一个有效的用户实例时（例如用户刚在你的应用中注册之后），这种认证方式非常有用：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

你可以向 `login` 方法传递一个布尔值作为第二个参数。该值表明已认证的会话是否需要「记住我」功能。请记住，这意味着会话将被无限期认证，或者直到用户手动从应用登出：

```php
Auth::login($user, $remember = true);
```

如有需要，你可以在调用 `login` 方法之前指定一个认证守卫：

```php
Auth::guard('admin')->login($user);
```

<a name="authenticate-a-user-by-id"></a>
#### 通过 ID 认证用户

要使用用户数据库记录的主键来认证用户，可以使用 `loginUsingId` 方法。该方法接受你想认证的用户的主键：

```php
Auth::loginUsingId(1);
```

你可以向 `loginUsingId` 方法的 `remember` 参数传递一个布尔值。该值表明已认证的会话是否需要「记住我」功能。请记住，这意味着会话将被无限期认证，或者直到用户手动从应用登出：

```php
Auth::loginUsingId(1, remember: true);
```

<a name="authenticate-a-user-once"></a>
#### 一次性认证用户

你可以使用 `once` 方法为单个请求认证用户。调用该方法时不会使用任何会话或 Cookie，也不会分发 `Login` 事件：

```php
if (Auth::once($credentials)) {
    // ...
}
```

<a name="http-basic-authentication"></a>
## HTTP Basic 认证

[HTTP Basic 认证](https://en.wikipedia.org/wiki/Basic_access_authentication)提供了一种无需搭建专用「登录」页面即可认证应用用户的快捷方式。开始之前，将 `auth.basic` [中间件](/docs/{{version}}/middleware)附加到路由上。`auth.basic` 中间件已包含在 Laravel 框架中，无需自行定义：

```php
Route::get('/profile', function () {
    // 只有已认证的用户才能访问此路由...
})->middleware('auth.basic');
```

中间件附加到路由之后，在浏览器中访问该路由时会自动提示你输入凭据。默认情况下，`auth.basic` 中间件会将 `users` 数据库表的 `email` 列作为用户的「用户名」。

<a name="a-note-on-fastcgi"></a>
#### 关于 FastCGI 的说明

如果你在使用 [PHP FastCGI](https://www.php.net/manual/en/install.fpm.php) 和 Apache 来提供 Laravel 应用服务，HTTP Basic 认证可能无法正常工作。要解决这些问题，可以在应用的 `.htaccess` 文件中添加以下几行：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>
### 无状态 HTTP Basic 认证

你还可以在不向会话写入用户标识 Cookie 的情况下使用 HTTP Basic 认证。如果你选择使用 HTTP 认证来认证应用 API 的请求，这会非常有用。为此，请[定义一个中间件](/docs/{{version}}/middleware)来调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，请求将被继续传递到应用内部：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateOnceWithBasicAuth
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return Auth::onceBasic() ?: $next($request);
    }

}
```

接下来，将中间件附加到路由上：

```php
Route::get('/api/user', function () {
    // 只有已认证的用户才能访问此路由...
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

<a name="logging-out"></a>
## 登出

要手动将用户从应用中登出，可以使用 `Auth` Facade 提供的 `logout` 方法。这会从用户的会话中移除认证信息，使后续请求不再通过认证。

除了调用 `logout` 方法之外，建议你同时使用户的会话失效并重新生成其 [CSRF 令牌](/docs/{{version}}/csrf)。将用户登出后，通常你会将用户重定向到应用的根路径：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * 将用户从应用中登出。
 */
public function logout(Request $request): RedirectResponse
{
    Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect('/');
}
```

<a name="invalidating-sessions-on-other-devices"></a>
### 使其他设备上的会话失效

Laravel 还提供了一种机制，可以让用户在其他设备上处于活跃状态的会话失效并将其「登出」，同时不影响用户当前设备上的会话。当用户修改或更新密码时，通常会使用这一功能，让你在保持当前设备认证状态的同时，使其他设备上的会话失效。

开始之前，你应确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件被包含在需要进行会话认证的路由上。通常，你应当将这个中间件放在某个路由分组定义上，使其应用于应用的大部分路由。默认情况下，可以使用 `auth.session` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)将 `AuthenticateSession` 中间件附加到路由：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，你可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。该方法要求用户确认其当前密码，你的应用应通过输入表单来接收该密码：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

调用 `logoutOtherDevices` 方法后，用户的其他会话将完全失效，也就是说，用户将被从之前认证过的所有守卫中「登出」。

<a name="password-confirmation"></a>
## 密码确认

在构建应用时，你偶尔会遇到这样的操作：要求用户在执行操作之前或被重定向到应用的敏感区域之前确认其密码。Laravel 内置了中间件，让这个过程轻而易举。实现此功能需要定义两个路由：一个路由显示要求用户确认密码的视图，另一个路由验证密码是否有效并将用户重定向到其原本要访问的目的地。

> [!NOTE]
> 以下文档讨论如何直接与 Laravel 的密码确认功能集成；不过，如果你想更快上手，[Laravel 应用入门套件](/docs/{{version}}/starter-kits)已经内置了对该功能的支持！

<a name="password-confirmation-configuration"></a>
### 配置

用户确认密码后，三个小时内不会再被要求确认密码。不过，你可以通过修改应用的 `config/auth.php` 配置文件中的 `password_timeout` 配置值，来配置再次提示用户输入密码的间隔时长。

<a name="password-confirmation-routing"></a>
### 路由

<a name="the-password-confirmation-form"></a>
#### 密码确认表单

首先，我们将定义一个路由，用于显示请求用户确认密码的视图：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

正如你所料，该路由返回的视图中应当包含一个带有 `password` 字段的表单。此外，你可以随意在视图中加入说明文字，告知用户正在进入应用的受保护区域，必须确认其密码。

<a name="confirming-the-password"></a>
#### 确认密码

接下来，我们将定义一个路由来处理来自「确认密码」视图的表单请求。该路由将负责验证密码并将用户重定向到其原本要访问的目的地：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

Route::post('/confirm-password', function (Request $request) {
    if (! Hash::check($request->password, $request->user()->password)) {
        return back()->withErrors([
            'password' => ['The provided password does not match our records.']
        ]);
    }

    $request->session()->passwordConfirmed();

    return redirect()->intended();
})->middleware(['auth', 'throttle:6,1']);
```

在继续之前，让我们更详细地分析一下这个路由。首先，判断请求的 `password` 字段是否确实与已认证用户的密码匹配。如果密码有效，我们需要告知 Laravel 的会话用户已确认其密码。`passwordConfirmed` 方法会在用户会话中设置一个时间戳，Laravel 可以用它来判断用户最后一次确认密码的时间。最后，我们可以将用户重定向到其原本要访问的目的地。

<a name="password-confirmation-protecting-routes"></a>
### 保护路由

你应确保任何执行需要近期密码确认的操作的路由都被分配了 `password.confirm` 中间件。该中间件已包含在 Laravel 的默认安装中，它会自动将用户原本要访问的目的地存储在会话中，以便用户确认密码后被重定向到该位置。将用户的预期目的地存储在会话中之后，中间件会将用户重定向到 `password.confirm` [命名路由](/docs/{{version}}/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

<a name="adding-custom-guards"></a>
## 添加自定义守卫

你可以使用 `Auth` Facade 的 `extend` 方法定义自己的认证守卫。你应当将对 `extend` 方法的调用放在某个[服务提供者](/docs/{{version}}/providers)中。由于 Laravel 已经自带了 `AppServiceProvider`，我们可以把代码放在这个提供者中：

```php
<?php

namespace App\Providers;

use App\Services\Auth\JwtGuard;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

正如你在上面的例子中看到的，传递给 `extend` 方法的回调应当返回 `Illuminate\Contracts\Auth\Guard` 的实现。该接口包含几个你需要实现的方法，用于定义自定义守卫。定义好自定义守卫之后，你就可以在 `auth.php` 配置文件的 `guards` 配置中引用它：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

<a name="closure-request-guards"></a>
### 闭包请求守卫

实现自定义的、基于 HTTP 请求的认证系统，最简单的方式是使用 `Auth::viaRequest` 方法。该方法允许你使用单个闭包快速定义认证流程。

开始之前，在应用的 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受认证驱动名作为第一个参数。这个名称可以是任何描述你自定义守卫的字符串。传递给该方法的第二个参数应当是一个闭包，它接收传入的 HTTP 请求并返回一个用户实例；如果认证失败，则返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

定义好自定义认证驱动之后，你就可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为一个驱动：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，在将认证中间件分配给路由时，你就可以引用这个守卫：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

<a name="adding-custom-user-providers"></a>
## 添加自定义用户提供者

如果你没有使用传统的关系型数据库来存储用户，就需要用自己的认证用户提供者对 Laravel 进行扩展。我们将使用 `Auth` Facade 的 `provider` 方法定义一个自定义用户提供者。用户提供者解析器应当返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoUserProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\UserProvider...

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

使用 `provider` 方法注册好提供者之后，你就可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，你可以在 `guards` 配置中引用该提供者：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
],
```

<a name="the-user-provider-contract"></a>
### 用户提供者契约

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从持久化存储系统（如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 的实现。这两个接口让 Laravel 的认证机制得以持续运作，无论用户数据如何存储，也无论使用什么类型的类来表示已认证的用户：

让我们看看 `Illuminate\Contracts\Auth\UserProvider` 契约：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface UserProvider
{
    public function retrieveById($identifier);
    public function retrieveByToken($identifier, $token);
    public function updateRememberToken(Authenticatable $user, $token);
    public function retrieveByCredentials(array $credentials);
    public function validateCredentials(Authenticatable $user, array $credentials);
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
}
```

`retrieveById` 函数通常接收一个代表用户的键，例如 MySQL 数据库的自增 ID。该方法应当检索并返回与该 ID 匹配的 `Authenticatable` 实现。

`retrieveByToken` 函数通过用户唯一的 `$identifier` 和「记住我」`$token` 检索用户，它们通常存储在类似 `remember_token` 的数据库列中。与前一个方法一样，该方法应当返回令牌值匹配的 `Authenticatable` 实现。

`updateRememberToken` 方法用新的 `$token` 更新 `$user` 实例的 `remember_token`。在「记住我」认证尝试成功或用户登出时，会为用户分配一个新的令牌。

`retrieveByCredentials` 方法接收在尝试向应用认证时传递给 `Auth::attempt` 方法的凭据数组。然后，该方法应当根据这些凭据「查询」底层持久化存储中匹配的用户。通常，该方法会执行一个带有「where」条件的查询，搜索「用户名」与 `$credentials['username']` 值匹配的用户记录。该方法应当返回 `Authenticatable` 的实现。**该方法不应尝试执行任何密码验证或认证。**

`validateCredentials` 方法应当比较给定的 `$user` 与 `$credentials` 来认证用户。例如，该方法通常会使用 `Hash::check` 方法比较 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值。该方法应返回 `true` 或 `false`，表明密码是否有效。

`rehashPasswordIfRequired` 方法应当在需要且受支持时，对给定 `$user` 的密码进行重新哈希。例如，该方法通常会使用 `Hash::needsRehash` 方法判断 `$credentials['password']` 值是否需要重新哈希。如果密码需要重新哈希，该方法应使用 `Hash::make` 方法对密码重新哈希，并更新用户在底层持久化存储中的记录。

<a name="the-authenticatable-contract"></a>
### Authenticatable 契约

既然我们已经了解了 `UserProvider` 的各个方法，现在来看看 `Authenticatable` 契约。请记住，用户提供者应当从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法返回该接口的实现：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface Authenticatable
{
    public function getAuthIdentifierName();
    public function getAuthIdentifier();
    public function getAuthPasswordName();
    public function getAuthPassword();
    public function getRememberToken();
    public function setRememberToken($value);
    public function getRememberTokenName();
}
```

这个接口非常简单。`getAuthIdentifierName` 方法应当返回用户「主键」列的名称，`getAuthIdentifier` 方法应当返回用户的「主键」。使用 MySQL 后端时，这很可能是分配给用户记录的自增主键。`getAuthPasswordName` 方法应当返回用户密码列的名称。`getAuthPassword` 方法应当返回用户的哈希密码。

这个接口让认证系统能够与任何「用户」类协作，无论你使用什么 ORM 或存储抽象层。默认情况下，Laravel 会在 `app/Models` 目录中包含实现了该接口的 `App\Models\User` 类。

<a name="automatic-password-rehashing"></a>
## 自动密码重新哈希

Laravel 默认的密码哈希算法是 bcrypt。bcrypt 哈希的「工作因子」可以通过应用的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量来调整。

通常，随着 CPU / GPU 处理能力的提升，bcrypt 工作因子应当随时间推移而提高。如果你提高了应用的 bcrypt 工作因子，当用户通过 Laravel 入门套件向你的应用认证，或你通过 `attempt` 方法[手动认证用户](#authenticating-users)时，Laravel 会优雅地自动对用户密码重新哈希。

通常，自动密码重新哈希不会影响应用的正常运行；不过，你可以通过发布 `hashing` 配置文件来禁用这一行为：

```shell
php artisan config:publish hashing
```

配置文件发布后，你可以将 `rehash_on_login` 配置值设置为 `false`：

```php
'rehash_on_login' => false,
```

<a name="events"></a>
## 事件

Laravel 会在认证过程中分发多种[事件](/docs/{{version}}/events)。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)：

| 事件名称                                         |
| ---------------------------------------------- |
| `Illuminate\Auth\Events\Registered`            |
| `Illuminate\Auth\Events\Attempting`            |
| `Illuminate\Auth\Events\Authenticated`         |
| `Illuminate\Auth\Events\Login`                 |
| `Illuminate\Auth\Events\Failed`                |
| `Illuminate\Auth\Events\Validated`             |
| `Illuminate\Auth\Events\Verified`              |
| `Illuminate\Auth\Events\Logout`                |
| `Illuminate\Auth\Events\CurrentDeviceLogout`   |
| `Illuminate\Auth\Events\OtherDeviceLogout`     |
| `Illuminate\Auth\Events\Lockout`               |
| `Illuminate\Auth\Events\PasswordReset`         |
| `Illuminate\Auth\Events\PasswordResetLinkSent` |
