# 用户认证

- [简介](#introduction)
    - [入门套件](#starter-kits)
    - [数据库注意事项](#introduction-database-considerations)
    - [生态概览](#ecosystem-overview)
- [认证快速入门](#authentication-quickstart)
    - [安装入门套件](#install-a-starter-kit)
    - [检索已认证用户](#retrieving-the-authenticated-user)
    - [保护路由](#protecting-routes)
    - [登录限流](#login-throttling)
- [手动认证用户](#authenticating-users)
    - [记住用户](#remembering-users)
    - [其他认证方法](#other-authentication-methods)
- [HTTP 基础认证](#http-basic-authentication)
    - [无状态 HTTP 基础认证](#stateless-http-basic-authentication)
- [注销](#logging-out)
    - [使其他设备上的会话失效](#invalidating-sessions-on-other-devices)
- [密码确认](#password-confirmation)
    - [配置](#password-confirmation-configuration)
    - [路由](#password-confirmation-routing)
    - [保护路由](#password-confirmation-protecting-routes)
- [添加自定义 Guard](#adding-custom-guards)
    - [闭包请求 Guard](#closure-request-guards)
- [添加自定义用户提供者](#adding-custom-user-providers)
    - [用户提供者契约](#the-user-provider-contract)
    - [Authenticatable 契约](#the-authenticatable-contract)
- [密码自动重新哈希](#automatic-password-rehashing)
- [社交认证](/docs/{{version}}/socialite)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用程序都提供了一种让用户与应用程序进行认证并"登录"的方式。在 Web 应用程序中实现此功能可能是一项复杂且存在潜在风险的工作。因此，Laravel 致力于为你提供快速、安全、轻松地实现认证所需的工具。

Laravel 的认证功能核心由"Guard"和"提供者"组成。Guard 定义每个请求如何对用户进行认证。例如，Laravel 自带一个 `session` guard，它使用会话存储和 Cookie 来维护状态。

提供者定义如何从持久化存储中检索用户。Laravel 自带使用 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构造器检索用户的支持。不过，你可以根据需要为应用程序定义额外的提供者。

应用程序的认证配置文件位于 `config/auth.php`。该文件包含多个带有详尽文档的选项，用于微调 Laravel 认证服务的行为。

> [!NOTE]
> Guard 和提供者不应与"角色"和"权限"混淆。要了解如何通过权限对用户操作进行授权，请参阅 [authorization](/docs/{{version}}/authorization)（授权）文档。

<a name="starter-kits"></a>
### 入门套件

想快速上手？在一个全新的 Laravel 应用程序中安装 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。迁移数据库后，将浏览器导航到 `/register` 或分配给你的应用程序的任何其他 URL。入门套件会负责为你的整个认证系统搭建脚手架！

**即使你最终决定不在 Laravel 应用程序中使用入门套件，安装一个[入门套件](/docs/{{version}}/starter-kits)也是学习如何在实际 Laravel 项目中实现 Laravel 全部认证功能的绝佳机会。** 由于 Laravel 入门套件为你包含了认证控制器、路由和视图，你可以检查这些文件中的代码，了解 Laravel 的认证功能是如何实现的。

<a name="introduction-database-considerations"></a>
### 数据库注意事项

默认情况下，Laravel 会在 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可与默认的 Eloquent 认证驱动一起使用。

如果你的应用程序不使用 Eloquent，可以使用使用 Laravel 查询构造器的 `database` 认证提供者。如果你的应用程序使用 MongoDB，请查看 MongoDB 官方的 [Laravel 用户认证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

为 `App\Models\User` 模型构建数据库结构时，请确保 password 列至少 60 个字符长。当然，新 Laravel 应用程序中包含的 `users` 表迁移已经创建了一个超过此长度的列。

此外，你应验证 `users`（或等效）表包含一个可空的、长度为 100 个字符的字符串 `remember_token` 列。该列将用于存储在选择"记住我"选项时登录你的应用程序的用户的令牌。同样，新 Laravel 应用程序中包含的默认 `users` 表迁移已经包含了此列。

<a name="ecosystem-overview"></a>
### 生态概览

Laravel 提供了几个与认证相关的包。在继续之前，我们将回顾 Laravel 中整体的认证生态，并讨论每个包的预期用途。

首先，考虑认证是如何工作的。使用 Web 浏览器时，用户会通过登录表单提供其用户名和密码。如果这些凭据正确，应用程序会将已认证用户的信息存储在用户的 [session](/docs/{{version}}/session)（会话）中。颁发给浏览器的 Cookie 包含会话 ID，以便对应用程序的后续请求可以将用户与正确的会话关联起来。收到会话 Cookie 后，应用程序会根据会话 ID 检索会话数据，注意到认证信息已存储在会话中，并将该用户视为"已认证"。

当远程服务需要认证以访问 API 时，通常不使用 Cookie 进行认证，因为没有 Web 浏览器。相反，远程服务会在每个请求中向 API 发送一个 API 令牌。应用程序可以根据有效 API 令牌表验证传入的令牌，并将该请求"认证"为与该 API 令牌关联的用户所执行的操作。

<a name="laravels-built-in-browser-authentication-services"></a>
#### Laravel 内置的浏览器认证服务

Laravel 包含内置的认证和会话服务，通常通过 `Auth` 和 `Session` Facade 访问。这些功能为来自 Web 浏览器的请求提供基于 Cookie 的认证。它们提供允许你验证用户凭据并对用户进行认证的方法。此外，这些服务会自动将正确的认证数据存储在用户的会话中，并颁发用户的会话 Cookie。本文档中包含如何使用这些服务的讨论。

**应用入门套件**

如本文档所述，你可以手动与这些认证服务交互，以构建应用程序自己的认证层。不过，为了帮助你更快上手，我们发布了[免费的入门套件](/docs/{{version}}/starter-kits)，它们为整个认证层提供健壮、现代的脚手架。

<a name="laravels-api-authentication-services"></a>
#### Laravel 的 API 认证服务

Laravel 提供了两个可选的包来帮助你管理 API 令牌并认证使用 API 令牌发起的请求：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不是互斥的。这些库主要专注于 API 令牌认证，而内置认证服务专注于基于 Cookie 的浏览器认证。许多应用程序会同时使用 Laravel 内置的基于 Cookie 的认证服务和其中一个 Laravel 的 API 认证包。

**Passport**

Passport 是一个 OAuth2 认证提供者，提供多种 OAuth2"授权类型"，允许你颁发各种类型的令牌。总的来说，这是一个用于 API 认证的健壮且复杂的包。然而，大多数应用程序并不需要 OAuth2 规范提供的复杂功能，这些功能可能会让用户和开发者都感到困惑。此外，开发者历来对如何使用像 Passport 这样的 OAuth2 认证提供者来认证 SPA 应用程序或移动应用程序感到困惑。

**Sanctum**

为了应对 OAuth2 的复杂性和开发者的困惑，我们着手构建一个更简单、更精简的认证包，既能处理来自 Web 浏览器的第一方 Web 请求，也能处理通过令牌的 API 请求。随着 [Laravel Sanctum](/docs/{{version}}/sanctum) 的发布，这一目标得以实现，它应被视为以下应用程序的首选且推荐的认证包：除了 API 之外还提供第一方 Web UI 的应用程序，或是由与后端 Laravel 应用程序分离的单一页面应用程序（SPA）驱动的应用程序，或提供移动客户端的应用程序。

Laravel Sanctum 是一个混合的 Web/API 认证包，可以管理你的应用程序的整个认证过程。这是可能的，因为当基于 Sanctum 的应用程序收到请求时，Sanctum 会首先确定该请求是否包含引用已认证会话的会话 Cookie。Sanctum 通过调用我们之前讨论过的 Laravel 内置认证服务来实现这一点。如果该请求不是通过会话 Cookie 进行认证的，Sanctum 会检查请求中是否有 API 令牌。如果存在 API 令牌，Sanctum 将使用该令牌对请求进行认证。要了解有关此过程的更多信息，请参阅 Sanctum 的 ["工作原理"](/docs/{{version}}/sanctum#how-it-works) 文档。

<a name="summary-choosing-your-stack"></a>
#### 总结与选择技术栈

总之，如果你的应用程序将通过浏览器访问，并且你正在构建单体的 Laravel 应用程序，那么你的应用程序将使用 Laravel 内置的认证服务。

接下来，如果你的应用程序提供了将由第三方消费的 API，你将在 [Passport](/docs/{{version}}/passport) 或 [Sanctum](/docs/{{version}}/sanctum) 之间选择，为你的应用程序提供 API 令牌认证。一般来说，应尽可能优先选择 Sanctum，因为它是一个用于 API 认证、SPA 认证和移动认证的简单、完整的解决方案，包括对"scopes"或"abilities"的支持。

如果你正在构建由 Laravel 后端驱动的单一页面应用程序（SPA），应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你将需要[手动实现自己的后端认证路由](#authenticating-users)（手动认证用户），或者利用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，它为注册、密码重置、邮箱验证等功能提供路由和控制器。

当你的应用程序绝对需要 OAuth2 规范提供的所有功能时，可以选择 Passport。此外，如果你正在构建将由 AI 客户端访问的 [MCP 服务器](/docs/{{version}}/mcp)，应该使用 Passport，因为 MCP 客户端通常期望[使用 OAuth 进行认证](/docs/{{version}}/mcp#oauth)。

而且，如果你想快速上手，我们很乐意推荐[我们的应用入门套件](/docs/{{version}}/starter-kits)，作为启动已使用我们首选认证技术栈（Laravel 内置认证服务）的新 Laravel 应用程序的快速方式。

<a name="authentication-quickstart"></a>
## 认证快速入门

> [!WARNING]
> 本文档的这部分讨论通过 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)（包含用于帮助你快速上手的 UI 脚手架）对用户进行认证。如果你想直接与 Laravel 的认证系统集成，请查看[手动认证用户](#authenticating-users)的文档。

<a name="install-a-starter-kit"></a>
### 安装入门套件

首先，你应该[安装 Laravel 应用入门套件](/docs/{{version}}/starter-kits)。我们的入门套件为将认证集成到全新的 Laravel 应用程序中提供了设计精美的起点。

<a name="retrieving-the-authenticated-user"></a>
### 检索已认证用户

在使用入门套件创建应用程序并允许用户注册和认证后，你经常需要与当前已认证的用户交互。在处理传入请求时，可以通过 `Auth` Facade 的 `user` 方法访问已认证的用户：

```php
use Illuminate\Support\Facades\Auth;

// 检索当前已认证的用户……
$user = Auth::user();

// 检索当前已认证的用户的 ID……
$id = Auth::id();
```

或者，一旦用户通过认证，你可以通过 `Illuminate\Http\Request` 实例访问已认证的用户。记住，类型提示的类会自动注入到你的控制器方法中。通过对 `Illuminate\Http\Request` 对象进行类型提示，你可以通过请求的 `user` 方法从应用程序的任何控制器方法中方便地访问已认证的用户：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 更新已有航班的航班信息。
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

要确定发起传入 HTTP 请求的用户是否已认证，可以使用 `Auth` Facade 上的 `check` 方法。如果用户已认证，此方法返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // 用户已登录……
}
```

> [!NOTE]
> 尽管可以使用 `check` 方法判断用户是否已认证，但通常你会使用中间件在允许用户访问某些路由/控制器之前验证用户是否已认证。要了解更多信息，请查看[保护路由](/docs/{{version}}/authentication#protecting-routes)的文档。

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)（Route Middleware）可用于仅允许已认证的用户访问给定路由。Laravel 自带一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的[中间件别名](/docs/{{version}}/middleware#middleware-aliases)。由于该中间件已由 Laravel 内部别名化，你只需将中间件附加到路由定义即可：

```php
Route::get('/flights', function () {
    // 仅已认证的用户可以访问此路由……
})->middleware('auth');
```

<a name="redirecting-unauthenticated-users"></a>
#### 重定向未认证用户

当 `auth` 中间件检测到未认证的用户时，它会将用户重定向到 `login` [命名路由](/docs/{{version}}/routing#named-routes)。你可以使用应用程序 `bootstrap/app.php` 文件中的 `redirectGuestsTo` 方法修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo('/login');

    // 使用闭包……
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

<a name="redirecting-authenticated-users"></a>
#### 重定向已认证用户

当 `guest` 中间件检测到已认证的用户时，它会将用户重定向到 `dashboard` 或 `home` 命名路由。你可以使用应用程序 `bootstrap/app.php` 文件中的 `redirectUsersTo` 方法修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectUsersTo('/panel');

    // 使用闭包……
    $middleware->redirectUsersTo(fn (Request $request) => route('panel'));
})
```

<a name="specifying-a-guard"></a>
#### 指定 Guard

将 `auth` 中间件附加到路由时，你还可以指定应使用哪个"guard"来对用户进行认证。指定的 guard 应对应于 `auth.php` 配置文件中 `guards` 数组中的一个键：

```php
Route::get('/flights', function () {
    // 仅已认证的用户可以访问此路由……
})->middleware('auth:admin');
```

<a name="login-throttling"></a>
### 登录限流

如果你正在使用我们的[应用入门套件](/docs/{{version}}/starter-kits)之一，限流将自动应用于登录尝试。默认情况下，如果用户在多次尝试后未能提供正确的凭据，将在一分钟内无法登录。限流是根据用户的用户名/邮箱地址及其 IP 地址来区分的。

> [!NOTE]
> 如果你想对应用程序中的其他路由进行限流，请查看[限流文档](/docs/{{version}}/routing#rate-limiting)。

<a name="authenticating-users"></a>
## 手动认证用户

你不必使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)中包含的认证脚手架。如果你选择不使用此脚手架，则需要直接使用 Laravel 认证类来管理用户认证。别担心，这很简单！

我们将通过 `Auth` [Facade](/docs/{{version}}/facades)（门面）访问 Laravel 的认证服务，因此我们需要确保在类的顶部导入 `Auth` Facade。接下来，我们来看看 `attempt` 方法。`attempt` 方法通常用于处理来自应用程序"登录"表单的认证尝试。如果认证成功，你应该重新生成用户的 [session](/docs/{{version}}/session)（会话）以防止[会话固定](https://en.wikipedia.org/wiki/Session_fixation)（session fixation）：

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

`attempt` 方法接受一个键值对数组作为第一个参数。数组中的值将用于在数据库表中查找用户。因此，在上面的示例中，用户将通过 `email` 列的值检索。如果找到了用户，数据库中存储的哈希密码将与通过数组传递给该方法的 `password` 值进行比较。你不应哈希传入请求的 `password` 值，因为框架会在将其与数据库中的哈希密码比较之前自动哈希该值。如果两个哈希密码匹配，将为用户启动一个已认证的会话。

记住，Laravel 的认证服务会根据你的认证 guard 的"提供者"配置从数据库检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示它在检索用户时使用 `App\Models\User` 模型。你可以根据应用程序的需要更改配置文件中的这些值。

如果认证成功，`attempt` 方法将返回 `true`。否则，将返回 `false`。

Laravel 重定向器提供的 `intended` 方法会将用户重定向到他们在被认证中间件拦截之前试图访问的 URL。如果预期目标不可用，可以向该方法提供回退 URI。

<a name="specifying-additional-conditions"></a>
#### 指定附加条件

如果你愿意，除了用户的邮箱和密码外，还可以向认证查询添加额外的查询条件。为此，我们可以简单地将查询条件添加到传递给 `attempt` 方法的数组中。例如，我们可以验证用户被标记为"active"：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // 认证成功……
}
```

对于复杂的查询条件，你可以在凭据数组中提供一个闭包。将使用查询实例调用此闭包，允许你根据应用程序的需要自定义查询：

```php
use Illuminate\Database\Eloquent\Builder;

if (Auth::attempt([
    'email' => $email,
    'password' => $password,
    fn (Builder $query) => $query->has('activeSubscription'),
])) {
    // 认证成功……
}
```

> [!WARNING]
> 在这些示例中，`email` 不是必需的选项，它只是用作示例。你应该使用对应于数据库表中"username"的任何列名。

`attemptWhen` 方法将闭包作为第二个参数，可用于在实际对用户进行认证之前对潜在用户执行更广泛的检查。闭包接收潜在用户，并应返回 `true` 或 `false` 以指示是否可以对用户进行认证：

```php
if (Auth::attemptWhen([
    'email' => $email,
    'password' => $password,
], function (User $user) {
    return $user->isNotBanned();
})) {
    // 认证成功……
}
```

<a name="accessing-specific-guard-instances"></a>
#### 访问特定的 Guard 实例

通过 `Auth` Facade 的 `guard` 方法，你可以指定在对用户进行认证时要使用哪个 guard 实例。这允许你使用完全独立的 authenticatable 模型或用户表来管理应用程序不同部分的认证。

传递给 `guard` 方法的 guard 名称应对应于 `auth.php` 配置文件中配置的 guard 之一：

```php
if (Auth::guard('admin')->attempt($credentials)) {
    // ...
}
```

<a name="remembering-users"></a>
### 记住用户

许多 Web 应用程序在其登录表单上提供"记住我"复选框。如果你想在应用程序中提供"记住我"功能，可以将布尔值作为第二个参数传递给 `attempt` 方法。

当此值为 `true` 时，Laravel 会无限期地保持用户处于已认证状态，直到他们手动注销。你的 `users` 表必须包含字符串 `remember_token` 列，该列将用于存储"记住我"令牌。新 Laravel 应用程序中包含的 `users` 表迁移已经包含了此列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
    // 用户已被记住……
}
```

如果你的应用程序提供"记住我"功能，可以使用 `viaRemember` 方法确定当前已认证的用户是否使用"记住我"Cookie 进行认证：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
    // ...
}
```

<a name="other-authentication-methods"></a>
### 其他认证方法

<a name="authenticate-a-user-instance"></a>
#### 认证用户实例

如果你需要将现有的用户实例设置为当前已认证的用户，可以将该用户实例传递给 `Auth` Facade 的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts)（contract）的实现。Laravel 自带的 `App\Models\User` 模型已经实现了此接口。当你已经拥有一个有效的用户实例（例如用户刚刚向你的应用程序注册后）时，这种认证方式很有用：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

你可以将布尔值作为第二个参数传递给 `login` 方法。该值指示已认证的会话是否需要"记住我"功能。记住，这意味着会话将被无限期认证，直到用户手动注销应用程序：

```php
Auth::login($user, $remember = true);
```

如有需要，你可以在调用 `login` 方法之前指定认证 guard：

```php
Auth::guard('admin')->login($user);
```

<a name="authenticate-a-user-by-id"></a>
#### 按 ID 认证用户

要使用用户的数据库记录主键对用户进行认证，可以使用 `loginUsingId` 方法。该方法接受你要认证的用户的主键：

```php
Auth::loginUsingId(1);
```

你可以将布尔值传递给 `loginUsingId` 方法的 `remember` 参数。该值指示已认证的会话是否需要"记住我"功能。记住，这意味着会话将被无限期认证，直到用户手动注销应用程序：

```php
Auth::loginUsingId(1, remember: true);
```

<a name="authenticate-a-user-once"></a>
#### 一次性认证用户

你可以使用 `once` 方法为单个请求对用户进行认证。调用此方法时不会使用任何会话或 Cookie，也不会派发 `Login` 事件：

```php
if (Auth::once($credentials)) {
    // ...
}
```

<a name="http-basic-authentication"></a>
## HTTP 基础认证

[HTTP 基础认证](https://en.wikipedia.org/wiki/Basic_access_authentication)（HTTP Basic Authentication）提供了一种无需设置专用"登录"页面即可对应用程序用户进行认证的快速方法。要开始使用，请将 `auth.basic` [中间件](/docs/{{version}}/middleware) 附加到路由。`auth.basic` 中间件包含在 Laravel 框架中，因此你无需定义它：

```php
Route::get('/profile', function () {
    // 仅已认证的用户可以访问此路由……
})->middleware('auth.basic');
```

一旦中间件附加到路由，在浏览器中访问该路由时就会自动提示输入凭据。默认情况下，`auth.basic` 中间件会假定 `users` 数据库表上的 `email` 列是用户的"用户名"。

<a name="a-note-on-fastcgi"></a>
#### FastCGI 注意事项

如果你使用 [PHP FastCGI](https://www.php.net/manual/en/install.fpm.php) 和 Apache 来提供 Laravel 应用程序，HTTP 基础认证可能无法正常工作。要纠正这些问题，可以将以下行添加到应用程序的 `.htaccess` 文件中：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>
### 无状态 HTTP 基础认证

你也可以使用 HTTP 基础认证，而不在会话中设置用户标识符 Cookie。如果你选择使用 HTTP 认证来认证对应用程序 API 的请求，这主要很有帮助。为此，[定义一个中间件](/docs/{{version}}/middleware)，该中间件调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，则可以将请求进一步传递到应用程序中：

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

接下来，将中间件附加到路由：

```php
Route::get('/api/user', function () {
    // 仅已认证的用户可以访问此路由……
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

<a name="logging-out"></a>
## 注销

要手动将用户注销出应用程序，可以使用 `Auth` Facade 提供的 `logout` 方法。这将从用户的会话中删除认证信息，以便后续请求不会被认证。

除了调用 `logout` 方法外，还建议使用户的会话失效并重新生成其 [CSRF 令牌](/docs/{{version}}/csrf)。将用户注销后，通常会将用户重定向到应用程序的根目录：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * 将用户注销出应用程序。
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

Laravel 还提供了一种机制，用于使在其他设备上处于活动状态的用户会话失效并"注销"，而无需使其当前设备上的会话失效。当用户更改或更新其密码，并且你想使其他设备上的会话失效同时保持当前设备已认证时，通常会使用此功能。

在开始之前，你应该确保应在接收会话认证的路由上包含 `Illuminate\Session\Middleware\AuthenticateSession` 中间件。通常，你应该将此中间件放在路由组定义上，以便它可以应用于应用程序的大多数路由。默认情况下，可以使用 `auth.session` [中间件别名](/docs/{{version}}/middleware#middleware-aliases) 将 `AuthenticateSession` 中间件附加到路由：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，你可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。此方法要求用户确认其当前密码，你的应用程序应通过输入表单接受该密码：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

调用 `logoutOtherDevices` 方法时，用户的其他会话将完全失效，这意味着他们将从之前被认证的所有 guard 中"注销"。

<a name="password-confirmation"></a>
## 密码确认

在构建应用程序时，你可能会遇到一些操作，这些操作应在执行之前或用户被重定向到应用程序的敏感区域之前要求用户确认其密码。Laravel 包含内置中间件，使此过程变得轻而易举。实现此功能需要你定义两个路由：一个路由用于显示要求用户确认密码的视图，另一个路由用于确认密码有效并将用户重定向到其预期目标。

> [!NOTE]
> 以下文档讨论如何直接与 Laravel 的密码确认功能集成；但是，如果你想更快上手，[Laravel 应用入门套件](/docs/{{version}}/starter-kits) 已包含对此功能的支持！

<a name="password-confirmation-configuration"></a>
### 配置

确认密码后，用户在三小时内不会被要求再次确认密码。但是，你可以通过更改应用程序 `config/auth.php` 配置文件中 `password_timeout` 配置值来配置用户被重新提示输入密码之前的时长。

<a name="password-confirmation-routing"></a>
### 路由

<a name="the-password-confirmation-form"></a>
#### 密码确认表单

首先，我们将定义一个路由来显示要求用户确认密码的视图：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

正如你所料，此路由返回的视图应有一个包含 `password` 字段的表单。此外，可以随意在视图中包含说明文本，解释用户正在进入应用程序的受保护区域，必须确认其密码。

<a name="confirming-the-password"></a>
#### 确认密码

接下来，我们将定义一个路由来处理来自"确认密码"视图的表单请求。此路由将负责验证密码并将用户重定向到其预期目标：

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

在继续之前，让我们更详细地检查这个路由。首先，确定请求的 `password` 字段确实与已认证用户的密码匹配。如果密码有效，我们需要告知 Laravel 的会话用户已确认其密码。`passwordConfirmed` 方法将在用户的会话中设置一个时间戳，Laravel 可以使用该时间戳来确定用户上次确认密码的时间。最后，我们可以将用户重定向到其预期目标。

<a name="password-confirmation-protecting-routes"></a>
### 保护路由

你应该确保任何执行需要近期密码确认的操作的路由都分配了 `password.confirm` 中间件。该中间件包含在 Laravel 的默认安装中，它会自动将用户的预期目标存储在会话中，以便用户可以在确认密码后重定向到该位置。在将用户的预期目标存储在会话中后，中间件会将用户重定向到 `password.confirm` [命名路由](/docs/{{version}}/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

<a name="adding-custom-guards"></a>
## 添加自定义 Guard

你可以使用 `Auth` Facade 上的 `extend` 方法定义自己的认证 guard。你应该将调用 `extend` 方法的代码放在[服务提供者](/docs/{{version}}/providers)（Service Provider）中。由于 Laravel 已经自带一个 `AppServiceProvider`，我们可以将代码放在该提供者中：

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
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // 返回 Illuminate\Contracts\Auth\Guard 的实现……

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

如上面的示例所示，传递给 `extend` 方法的回调应返回 `Illuminate\Contracts\Auth\Guard` 的实现。此接口包含一些你需要实现以定义自定义 guard 的方法。定义自定义 guard 后，你可以在 `auth.php` 配置文件的 `guards` 配置中引用该 guard：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

<a name="closure-request-guards"></a>
### 闭包请求 Guard

实现自定义、基于 HTTP 请求的认证系统的最简单方法是使用 `Auth::viaRequest` 方法。此方法允许你使用单个闭包快速定义认证过程。

要开始使用，请在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受一个认证驱动名称作为第一个参数。此名称可以是任何描述你的自定义 guard 的字符串。传递给该方法的第二个参数应该是一个闭包，它接收传入的 HTTP 请求并返回用户实例，或者在认证失败时返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

定义自定义认证驱动后，你可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为驱动：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，你可以在将认证中间件分配给路由时引用该 guard：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

<a name="adding-custom-user-providers"></a>
## 添加自定义用户提供者

如果你不使用传统的关系型数据库来存储用户，你需要使用自己的认证用户提供者扩展 Laravel。我们将使用 `Auth` Facade 上的 `provider` 方法定义自定义用户提供者。用户提供者解析器应返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

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
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // 返回 Illuminate\Contracts\Auth\UserProvider 的实现……

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

使用 `provider` 方法注册提供者后，你可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，你可以在 `guards` 配置中引用此提供者：

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

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从持久化存储系统（如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 的实现。这两个接口允许 Laravel 认证机制继续运作，无论用户数据如何存储或使用何种类型的类来表示已认证的用户：

我们来看一下 `Illuminate\Contracts\Auth\UserProvider` 契约：

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

`retrieveById` 函数通常接收一个表示用户的键，例如来自 MySQL 数据库的自增 ID。应检索并返回与该 ID 匹配的 `Authenticatable` 实现。

`retrieveByToken` 函数通过用户唯一的 `$identifier` 和"记住我" `$token` 检索用户，令牌通常存储在类似 `remember_token` 的数据库列中。与前面的方法一样，此方法应返回具有匹配令牌值的 `Authenticatable` 实现。

`updateRememberToken` 方法使用新的 `$token` 更新 `$user` 实例的 `remember_token`。在成功的"记住我"认证尝试时或用户注销时，会为用户分配一个新令牌。

`retrieveByCredentials` 方法接收在尝试使用应用程序进行认证时传递给 `Auth::attempt` 方法的凭据数组。然后，该方法应该"查询"底层持久化存储以查找匹配这些凭据的用户。通常，此方法会运行带有"where"条件的查询，该条件搜索"username"与 `$credentials['username']` 值匹配的用户记录。该方法应返回 `Authenticatable` 的实现。**此方法不应尝试进行任何密码验证或认证。**

`validateCredentials` 方法应将给定的 `$user` 与 `$credentials` 进行比较以对用户进行认证。例如，此方法通常会使用 `Hash::check` 方法将 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值进行比较。此方法应返回 `true` 或 `false`，指示密码是否有效。

`rehashPasswordIfRequired` 方法应在需要且支持时对给定的 `$user` 的密码重新哈希。例如，此方法通常会使用 `Hash::needsRehash` 方法来确定 `$credentials['password']` 值是否需要重新哈希。如果密码需要重新哈希，该方法应使用 `Hash::make` 方法对密码重新哈希并更新底层持久化存储中的用户记录。

<a name="the-authenticatable-contract"></a>
### Authenticatable 契约

既然我们已经探讨了 `UserProvider` 上的每个方法，接下来我们看一下 `Authenticatable` 契约。记住，用户提供者应从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法返回此接口的实现：

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

此接口很简单。`getAuthIdentifierName` 方法应返回用户的"主键"列的名称，`getAuthIdentifier` 方法应返回用户的"主键"。使用 MySQL 后端时，这很可能是分配给用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的名称。`getAuthPassword` 方法应返回用户的哈希密码。

此接口允许认证系统与任何"用户"类一起工作，无论你使用何种 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个实现此接口的 `App\Models\User` 类。

<a name="automatic-password-rehashing"></a>
## 密码自动重新哈希

Laravel 的默认密码哈希算法是 bcrypt。bcrypt 哈希的"工作因子"可以通过应用程序的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量进行调整。

通常，随着 CPU/GPU 处理能力的提升，bcrypt 工作因子应随时间增加。如果你提高了应用程序的 bcrypt 工作因子，Laravel 会在用户通过 Laravel 的入门套件对你的应用程序进行认证时，或当你通过 `attempt` 方法[手动认证用户](#authenticating-users)时，优雅且自动地重新哈希用户密码。

通常，自动密码重新哈希不应干扰你的应用程序；但是，你可以通过发布 `hashing` 配置文件来禁用此行为：

```shell
php artisan config:publish hashing
```

配置文件发布后，你可以将 `rehash_on_login` 配置值设为 `false`：

```php
'rehash_on_login' => false,
```

<a name="events"></a>
## 事件

Laravel 在认证过程中会派发各种 [events](/docs/{{version}}/events)（事件）。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)（listeners）：

| Event Name                                     |
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
