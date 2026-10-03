# 用户认证

- [简介](#introduction)
    - [入门套件](#starter-kits)
    - [数据库注意事项](#introduction-database-considerations)
    - [生态系统概述](#ecosystem-overview)
- [认证快速入门](#authentication-quickstart)
    - [安装入门套件](#install-a-starter-kit)
    - [获取已认证用户](#retrieving-the-authenticated-user)
    - [保护路由](#protecting-routes)
    - [登录限流](#login-throttling)
- [手动认证用户](#authenticating-users)
    - [记住用户](#remembering-users)
    - [其他认证方式](#other-authentication-methods)
- [HTTP 基础认证](#http-basic-authentication)
    - [无状态 HTTP 基础认证](#stateless-http-basic-authentication)
- [退出登录](#logging-out)
    - [在其他设备上使会话失效](#invalidating-sessions-on-other-devices)
- [密码确认](#password-confirmation)
    - [配置](#password-confirmation-configuration)
    - [路由](#password-confirmation-routing)
    - [保护路由](#password-confirmation-protecting-routes)
- [添加自定义守卫](#adding-custom-guards)
    - [闭包请求守卫](#closure-request-guards)
- [添加自定义用户提供者](#adding-custom-user-providers)
    - [用户提供者契约](#the-user-provider-contract)
    - [可认证契约](#the-authenticatable-contract)
- [社交认证](/docs/{{version}}/socialite)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用为用户提供了一种向应用进行认证并"登录"的方式。在 Web 应用中实现此功能可能是一项复杂且存在潜在风险的工作。为此，Laravel 致力于提供所需的工具，让你能够快速、安全且轻松地实现认证。

Laravel 的认证功能由"守卫（guard）"和"提供者（provider）"组成。守卫定义了如何对每个请求的用户进行认证。例如，Laravel 内置了 `session` 守卫，它通过会话存储和 Cookie 来维护状态。

提供者定义了如何从持久化存储中获取用户。Laravel 内置支持通过 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构造器获取用户。不过，你可以根据应用需要自由定义额外的提供者。

应用的认证配置文件位于 `config/auth.php`。该文件包含多个有详细注释的选项，用于调整 Laravel 认证服务的行为。

> **Note**
> 守卫和提供者不应与"角色"和"权限"混淆。如需了解如何通过权限授权用户操作，请参阅[授权](/docs/{{version}}/authorization)文档。

<a name="starter-kits"></a>
### 入门套件

想要快速上手？在一个全新的 Laravel 应用中安装 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。执行数据库迁移后，在浏览器中访问 `/register` 或应用的其他任意 URL。入门套件会为你搭建整个认证系统！

**即使你最终决定不在 Laravel 应用中使用入门套件，安装 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze) 入门套件也是学习如何在实际 Laravel 项目中实现所有 Laravel 认证功能的绝佳机会。** 由于 Laravel Breeze 会为你创建认证控制器、路由和视图，你可以查看这些文件中的代码，了解 Laravel 的认证功能是如何实现的。

<a name="introduction-database-considerations"></a>
### 数据库注意事项

默认情况下，Laravel 在 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可与默认的 Eloquent 认证驱动一起使用。如果你的应用不使用 Eloquent，可以使用 `database` 认证提供者，它使用 Laravel 的查询构造器。

在为 `App\Models\User` 模型构建数据库结构时，确保密码列长度至少为 60 个字符。当然，新 Laravel 应用中包含的 `users` 表数据库迁移已经创建了一个超过此长度的列。

此外，你应该确认 `users`（或等效的）表包含一个可为空、长度为 100 个字符的字符串 `remember_token` 列。此列用于为登录应用时选择"记住我"选项的用户存储令牌。同样，新 Laravel 应用中包含的默认 `users` 表数据库迁移已经包含此列。

<a name="ecosystem-overview"></a>
### 生态系统概述

Laravel 提供了多个与认证相关的包。在继续之前，我们将回顾 Laravel 的整体认证生态系统，并讨论每个包的用途。

首先，考虑认证的工作原理。使用 Web 浏览器时，用户通过登录表单提供用户名和密码。如果凭据正确，应用会将已认证用户的信息存储在用户的[会话](/docs/{{version}}/session)中。发送给浏览器的 Cookie 包含会话 ID，这样后续对应用的请求就能将用户与正确的会话关联起来。收到会话 Cookie 后，应用会根据会话 ID 获取会话数据，注意到认证信息已存储在会话中，并将用户视为"已认证"。

当远程服务需要认证以访问 API 时，通常不使用 Cookie 进行认证，因为没有 Web 浏览器。相反，远程服务在每次请求时向 API 发送 API 令牌。应用可以根据有效的 API 令牌表验证传入的令牌，并将请求"认证"为由该 API 令牌关联的用户执行。

<a name="laravels-built-in-browser-authentication-services"></a>
#### Laravel 内置浏览器认证服务

Laravel 内置了认证和会话服务，通常通过 `Auth` 和 `Session` Facade 访问。这些功能为从 Web 浏览器发起的请求提供基于 Cookie 的认证。它们提供的方法可以验证用户凭据并对用户进行认证。此外，这些服务会自动将正确的认证数据存储在用户会话中，并向用户发放会话 Cookie。本文档包含如何使用这些服务的讨论。

**应用入门套件**

如本文档所述，你可以手动与这些认证服务交互，构建应用自己的认证层。不过，为了帮助你更快上手，我们发布了[免费的包](/docs/{{version}}/starter-kits)，为整个认证层提供健壮、现代的脚手架。这些包是 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze)、[Laravel Jetstream](/docs/{{version}}/starter-kits#laravel-jetstream) 和 [Laravel Fortify](/docs/{{version}}/fortify)。

_Laravel Breeze_ 是所有 Laravel 认证功能的简单、最小化实现，包括登录、注册、密码重置、邮箱验证和密码确认。Laravel Breeze 的视图层由使用 [Tailwind CSS](https://tailwindcss.com) 样式的简单 [Blade 模板](/docs/{{version}}/blade)组成。要开始使用，请查阅 Laravel 的[应用入门套件](/docs/{{version}}/starter-kits)文档。

_Laravel Fortify_ 是 Laravel 的无头认证后端，实现了本文档中的许多功能，包括基于 Cookie 的认证以及双因素认证和邮箱验证等其他功能。Fortify 为 Laravel Jetstream 提供认证后端，也可以独立使用，与 [Laravel Sanctum](/docs/{{version}}/sanctum) 结合为需要向 Laravel 认证的 SPA 提供认证。

_[Laravel Jetstream](https://jetstream.laravel.com)_ 是一个健壮的应用入门套件，它使用并暴露 Laravel Fortify 的认证服务，提供由 [Tailwind CSS](https://tailwindcss.com)、[Livewire](https://laravel-livewire.com) 和 / 或 [Inertia](https://inertiajs.com) 驱动的精美、现代的 UI。Laravel Jetstream 包含对双因素认证、团队支持、浏览器会话管理、个人资料管理的可选支持，以及与 [Laravel Sanctum](/docs/{{version}}/sanctum) 的内置集成以提供 API 令牌认证。Laravel 的 API 认证方案将在下文讨论。

<a name="laravels-api-authentication-services"></a>
#### Laravel 的 API 认证服务

Laravel 提供了两个可选包来帮助你管理 API 令牌并对使用 API 令牌的请求进行认证：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不互斥。这些库主要关注 API 令牌认证，而内置认证服务关注基于 Cookie 的浏览器认证。许多应用会同时使用 Laravel 内置的基于 Cookie 的认证服务和 Laravel 的某个 API 认证包。

**Passport**

Passport 是一个 OAuth2 认证提供者，提供多种 OAuth2 "授权类型"，允许你签发各种类型的令牌。通常，这是一个用于 API 认证的健壮且复杂的包。然而，大多数应用并不需要 OAuth2 规范提供的复杂功能，这可能让用户和开发者都感到困惑。此外，开发者历来对如何使用 Passport 等 OAuth2 认证提供者对 SPA 应用或移动应用进行认证感到困惑。

**Sanctum**

为了应对 OAuth2 的复杂性和开发者的困惑，我们着手构建一个更简单、更精简的认证包，它既能处理来自 Web 浏览器的第一方 Web 请求，也能处理通过令牌的 API 请求。这一目标随着 [Laravel Sanctum](/docs/{{version}}/sanctum) 的发布而实现。对于将提供第一方 Web UI 和 API 的应用，或由独立于后端 Laravel 应用的单页应用（SPA）驱动的应用，或提供移动客户端的应用，Sanctum 应被视为首选和推荐的认证包。

Laravel Sanctum 是一个混合 Web / API 认证包，可以管理应用的整个认证过程。这是可能的，因为当基于 Sanctum 的应用收到请求时，Sanctum 会首先判断请求是否包含引用已认证会话的会话 Cookie。Sanctum 通过调用我们之前讨论的 Laravel 内置认证服务来完成此操作。如果请求未通过会话 Cookie 进行认证，Sanctum 会检查请求中是否包含 API 令牌。如果存在 API 令牌，Sanctum 将使用该令牌对请求进行认证。要了解此过程的更多信息，请查阅 Sanctum 的["工作原理"](/docs/{{version}}/sanctum#how-it-works)文档。

Laravel Sanctum 是我们选择包含在 [Laravel Jetstream](https://jetstream.laravel.com) 应用入门套件中的 API 包，因为我们相信它最适合大多数 Web 应用的认证需求。

<a name="summary-choosing-your-stack"></a>
#### 总结与技术栈选择

总之，如果你的应用将通过浏览器访问，并且你正在构建一个单体 Laravel 应用，那么你的应用将使用 Laravel 的内置认证服务。

接下来，如果你的应用提供将被第三方使用的 API，你将在 [Passport](/docs/{{version}}/passport) 或 [Sanctum](/docs/{{version}}/sanctum) 之间选择，为应用提供 API 令牌认证。通常，在可能的情况下应优先使用 Sanctum，因为它是 API 认证、SPA 认证和移动认证的简单、完整解决方案，包括对"作用域"或"能力"的支持。

如果你正在构建一个由 Laravel 后端驱动的单页应用（SPA），你应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你需要[手动实现自己的后端认证路由](#authenticating-users)，或者使用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，它为注册、密码重置、邮箱验证等功能提供路由和控制器。

当你的应用确实需要 OAuth2 规范提供的所有功能时，可以选择 Passport。

此外，如果你想快速上手，我们很高兴推荐 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze)，它是启动新 Laravel 应用的快捷方式，该应用已经使用了我们首选的认证技术栈——Laravel 内置认证服务和 Laravel Sanctum。

<a name="authentication-quickstart"></a>
## 认证快速入门

> **Warning**
> 本部分文档讨论如何通过 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)认证用户，其中包含 UI 脚手架以帮助你快速上手。如果你想直接与 Laravel 的认证系统集成，请查阅[手动认证用户](#authenticating-users)的文档。

<a name="install-a-starter-kit"></a>
### 安装入门套件

首先，你应该[安装 Laravel 应用入门套件](/docs/{{version}}/starter-kits)。我们当前的入门套件 Laravel Breeze 和 Laravel Jetstream，为在全新的 Laravel 应用中引入认证提供了设计精美的起点。

Laravel Breeze 是所有 Laravel 认证功能的最小、简单实现，包括登录、注册、密码重置、邮箱验证和密码确认。Laravel Breeze 的视图层由使用 [Tailwind CSS](https://tailwindcss.com) 样式的简单 [Blade 模板](/docs/{{version}}/blade)组成。Breeze 还提供基于 [Inertia](https://inertiajs.com) 的脚手架选项，使用 Vue 或 React。

[Laravel Jetstream](https://jetstream.laravel.com) 是一个更健壮的应用入门套件，支持使用 [Livewire](https://laravel-livewire.com) 或 [Inertia 和 Vue](https://inertiajs.com) 为应用搭建脚手架。此外，Jetstream 具有对双因素认证、团队、个人资料管理、浏览器会话管理、通过 [Laravel Sanctum](/docs/{{version}}/sanctum) 的 API 支持、账户删除等的可选支持。

<a name="retrieving-the-authenticated-user"></a>
### 获取已认证用户

安装认证入门套件并允许用户注册和向应用进行认证后，你通常需要与当前已认证的用户交互。在处理传入请求时，你可以通过 `Auth` Facade 的 `user` 方法访问已认证用户：

    use Illuminate\Support\Facades\Auth;

    // 获取当前已认证的用户...
    $user = Auth::user();

    // 获取当前已认证用户的 ID...
    $id = Auth::id();

或者，一旦用户通过认证，你可以通过 `Illuminate\Http\Request` 实例访问已认证用户。请记住，类型提示的类会自动注入到控制器方法中。通过类型提示 `Illuminate\Http\Request` 对象，你可以从应用中任何控制器方法通过请求的 `user` 方法方便地访问已认证用户：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;

    class FlightController extends Controller
    {
        /**
         * 更新现有航班的信息。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function update(Request $request)
        {
            // $request->user()
        }
    }

<a name="determining-if-the-current-user-is-authenticated"></a>
#### 判断当前用户是否已认证

要判断发起传入 HTTP 请求的用户是否已认证，你可以使用 `Auth` Facade 的 `check` 方法。如果用户已认证，此方法将返回 `true`：

    use Illuminate\Support\Facades\Auth;

    if (Auth::check()) {
        // 用户已登录...
    }

> **Note**
> 尽管可以使用 `check` 方法判断用户是否已认证，但通常会使用中间件在允许用户访问某些路由 / 控制器之前验证用户是否已认证。要了解更多信息，请查阅[保护路由](/docs/{{version}}/authentication#protecting-routes)的文档。

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于仅允许已认证用户访问给定路由。Laravel 内置了 `auth` 中间件，它引用 `Illuminate\Auth\Middleware\Authenticate` 类。由于此中间件已经在应用的 HTTP 内核中注册，你只需将中间件附加到路由定义即可：

    Route::get('/flights', function () {
        // 只有已认证的用户才能访问此路由...
    })->middleware('auth');

<a name="redirecting-unauthenticated-users"></a>
#### 重定向未认证用户

当 `auth` 中间件检测到未认证的用户时，它会将用户重定向到 `login` [命名路由](/docs/{{version}}/routing#named-routes)。你可以通过更新应用 `app/Http/Middleware/Authenticate.php` 文件中的 `redirectTo` 函数来修改此行为：

    /**
     * 获取用户应重定向到的路径。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function redirectTo($request)
    {
        return route('login');
    }

<a name="specifying-a-guard"></a>
#### 指定守卫

将 `auth` 中间件附加到路由时，你还可以指定使用哪个"守卫"来认证用户。指定的守卫应对应 `auth.php` 配置文件中 `guards` 数组的某个键：

    Route::get('/flights', function () {
        // 只有已认证的用户才能访问此路由...
    })->middleware('auth:admin');

<a name="login-throttling"></a>
### 登录限流

如果你使用 Laravel Breeze 或 Laravel Jetstream [入门套件](/docs/{{version}}/starter-kits)，速率限制会自动应用于登录尝试。默认情况下，如果用户多次尝试后仍未能提供正确的凭据，将无法登录一分钟。此限流针对用户的用户名 / 邮箱地址和 IP 地址是唯一的。

> **Note**
> 如果你想对应用中的其他路由进行速率限制，请查阅[速率限制文档](/docs/{{version}}/routing#rate-limiting)。

<a name="authenticating-users"></a>
## 手动认证用户

你不必使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)中包含的认证脚手架。如果你选择不使用此脚手架，则需要直接使用 Laravel 认证类来管理用户认证。别担心，这很容易！

我们将通过 `Auth` [Facade](/docs/{{version}}/facades)访问 Laravel 的认证服务，因此需要确保在类顶部导入 `Auth` Facade。接下来，让我们看看 `attempt` 方法。`attempt` 方法通常用于处理应用"登录"表单的认证尝试。如果认证成功，你应该重新生成用户的[会话](/docs/{{version}}/session)以防止[会话固定](https://en.wikipedia.org/wiki/Session_fixation)：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;

    class LoginController extends Controller
    {
        /**
         * 处理认证尝试。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function authenticate(Request $request)
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

`attempt` 方法接受一个键 / 值对数组作为第一个参数。数组中的值将用于在数据库表中查找用户。因此，在上面的示例中，将通过 `email` 列的值获取用户。如果找到用户，数据库中存储的哈希密码将与通过数组传递给方法的 `password` 值进行比较。你不应对传入请求的 `password` 值进行哈希处理，因为框架会在将其与数据库中的哈希密码比较之前自动对该值进行哈希。如果两个哈希密码匹配，将为用户启动已认证的会话。

请记住，Laravel 的认证服务会根据认证守卫的"提供者"配置从数据库中获取用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示在获取用户时使用 `App\Models\User` 模型。你可以根据应用需要在配置文件中更改这些值。

如果认证成功，`attempt` 方法将返回 `true`。否则，将返回 `false`。

Laravel 重定向器提供的 `intended` 方法会将用户重定向到他们被认证中间件拦截之前试图访问的 URL。如果预期目标不可用，可以为此方法提供一个回退 URI。

<a name="specifying-additional-conditions"></a>
#### 指定附加条件

如果需要，除了用户的邮箱和密码之外，你还可以向认证查询添加额外的查询条件。为此，只需将查询条件添加到传递给 `attempt` 方法的数组中即可。例如，我们可以验证用户是否被标记为"活跃"：

    if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
        // 认证成功...
    }

对于复杂的查询条件，你可以在凭据数组中提供一个闭包。此闭包将接收查询实例，允许你根据应用需要自定义查询：

    if (Auth::attempt([
        'email' => $email,
        'password' => $password,
        fn ($query) => $query->has('activeSubscription'),
    ])) {
        // 认证成功...
    }

> **Warning**
> 在这些示例中，`email` 不是必选选项，仅用作示例。你应该使用数据库表中对应"用户名"的列名。

`attemptWhen` 方法接收一个闭包作为第二个参数，可用于在实际认证用户之前对潜在用户进行更广泛的检查。闭包接收潜在用户，并应返回 `true` 或 `false` 以指示是否可以认证该用户：

    if (Auth::attemptWhen([
        'email' => $email,
        'password' => $password,
    ], function ($user) {
        return $user->isNotBanned();
    })) {
        // 认证成功...
    }

<a name="accessing-specific-guard-instances"></a>
#### 访问特定守卫实例

通过 `Auth` Facade 的 `guard` 方法，你可以指定认证用户时要使用的守卫实例。这允许你使用完全独立的可认证模型或用户表来管理应用不同部分的认证。

传递给 `guard` 方法的守卫名称应对应 `auth.php` 配置文件中配置的某个守卫：

    if (Auth::guard('admin')->attempt($credentials)) {
        // ...
    }

<a name="remembering-users"></a>
### 记住用户

许多 Web 应用在登录表单上提供"记住我"复选框。如果你想 在应用中提供"记住我"功能，可以将布尔值作为第二个参数传递给 `attempt` 方法。

当此值为 `true` 时，Laravel 会无限期保持用户的认证状态，直到用户手动退出。你的 `users` 表必须包含字符串 `remember_token` 列，用于存储"记住我"令牌。新 Laravel 应用中包含的 `users` 表数据库迁移已经包含此列：

    use Illuminate\Support\Facades\Auth;

    if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
        // 用户正在被记住...
    }

如果你的应用提供"记住我"功能，可以使用 `viaRemember` 方法判断当前已认证用户是否通过"记住我"Cookie 进行认证：

    use Illuminate\Support\Facades\Auth;

    if (Auth::viaRemember()) {
        // ...
    }

<a name="other-authentication-methods"></a>
### 其他认证方式

<a name="authenticate-a-user-instance"></a>
#### 认证用户实例

如果你需要将现有用户实例设置为当前已认证用户，可以将用户实例传递给 `Auth` Facade 的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts)的实现。Laravel 包含的 `App\Models\User` 模型已经实现了此接口。当你已经拥有有效的用户实例时（例如用户刚向应用注册后），这种认证方法很有用：

    use Illuminate\Support\Facades\Auth;

    Auth::login($user);

你可以将布尔值作为第二个参数传递给 `login` 方法。此值指示已认证会话是否需要"记住我"功能。请记住，这意味着会话将无限期保持认证状态，直到用户手动退出应用：

    Auth::login($user, $remember = true);

如果需要，可以在调用 `login` 方法之前指定认证守卫：

    Auth::guard('admin')->login($user);

<a name="authenticate-a-user-by-id"></a>
#### 通过 ID 认证用户

要使用数据库记录的主键认证用户，可以使用 `loginUsingId` 方法。此方法接受你希望认证的用户的主键：

    Auth::loginUsingId(1);

你可以将布尔值作为第二个参数传递给 `loginUsingId` 方法。此值指示已认证会话是否需要"记住我"功能。请记住，这意味着会话将无限期保持认证状态，直到用户手动退出应用：

    Auth::loginUsingId(1, $remember = true);

<a name="authenticate-a-user-once"></a>
#### 单次认证用户

你可以使用 `once` 方法为单个请求对用户进行认证。调用此方法时不会使用会话或 Cookie：

    if (Auth::once($credentials)) {
        //
    }

<a name="http-basic-authentication"></a>
## HTTP 基础认证

[HTTP 基础认证](https://en.wikipedia.org/wiki/Basic_access_authentication)提供了一种快速认证应用用户的方式，无需设置专门的"登录"页面。要开始使用，将 `auth.basic` [中间件](/docs/{{version}}/middleware)附加到路由。`auth.basic` 中间件已包含在 Laravel 框架中，因此你无需定义它：

    Route::get('/profile', function () {
        // 只有已认证的用户才能访问此路由...
    })->middleware('auth.basic');

将中间件附加到路由后，在浏览器中访问该路由时会自动提示输入凭据。默认情况下，`auth.basic` 中间件会假设 `users` 数据库表上的 `email` 列是用户的"用户名"。

<a name="a-note-on-fastcgi"></a>
#### 关于 FastCGI 的说明

如果你使用 PHP FastCGI 和 Apache 来服务 Laravel 应用，HTTP 基础认证可能无法正常工作。要解决这些问题，可以将以下行添加到应用的 `.htaccess` 文件中：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>
### 无状态 HTTP 基础认证

你也可以使用 HTTP 基础认证而不在会话中设置用户标识 Cookie。如果你选择使用 HTTP 认证来对应用 API 的请求进行认证，这主要会很有帮助。为此，[定义一个中间件](/docs/{{version}}/middleware)调用 `onceBasic` 方法。如果 `onceBasic` 方法未返回响应，请求可以继续传递到应用中：

    <?php

    namespace App\Http\Middleware;

    use Illuminate\Support\Facades\Auth;

    class AuthenticateOnceWithBasicAuth
    {
        /**
         * 处理传入请求。
         *
         * @param  \Illuminate\Http\Request  $request
         * @param  \Closure  $next
         * @return mixed
         */
        public function handle($request, $next)
        {
            return Auth::onceBasic() ?: $next($request);
        }

    }

接下来，[注册路由中间件](/docs/{{version}}/middleware#registering-middleware)并将其附加到路由：

    Route::get('/api/user', function () {
        // 只有已认证的用户才能访问此路由...
    })->middleware('auth.basic.once');

<a name="logging-out"></a>
## 退出登录

要手动将用户退出应用，可以使用 `Auth` Facade 提供的 `logout` 方法。这会从用户会话中移除认证信息，使后续请求不再通过认证。

除了调用 `logout` 方法外，建议你使用户的会话失效并重新生成其 [CSRF 令牌](/docs/{{version}}/csrf)。用户退出后，通常会将用户重定向到应用的根目录：

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;

    /**
     * 将用户退出应用。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

<a name="invalidating-sessions-on-other-devices"></a>
### 在其他设备上使会话失效

Laravel 还提供了一种机制，可以在不使当前设备上的会话失效的情况下，使其他设备上活跃的用户会话失效并将其"退出登录"。此功能通常在用户更改或更新密码时使用，你希望在使其他设备上的会话失效的同时保持当前设备的认证状态。

在开始之前，你应该确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件包含在应接收会话认证的路由上。通常，你应该将此中间件放在路由组定义中，以便将其应用于应用的大部分路由。默认情况下，可以使用应用 HTTP 内核中定义的 `auth.session` 路由中间件键将 `AuthenticateSession` 中间件附加到路由：

    Route::middleware(['auth', 'auth.session'])->group(function () {
        Route::get('/', function () {
            // ...
        });
    });

然后，你可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。此方法要求用户确认其当前密码，你的应用应通过输入表单接收：

    use Illuminate\Support\Facades\Auth;

    Auth::logoutOtherDevices($currentPassword);

当调用 `logoutOtherDevices` 方法时，用户的其他会话将完全失效，这意味着用户将从之前通过认证的所有守卫中"退出登录"。

<a name="password-confirmation"></a>
## 密码确认

在构建应用时，你偶尔可能会有一些操作需要在执行操作之前或用户被重定向到应用的敏感区域之前要求用户确认密码。Laravel 包含内置中间件，使此过程变得轻而易举。实现此功能需要你定义两个路由：一个路由用于显示要求用户确认密码的视图，另一个路由用于确认密码有效并将用户重定向到其预期目标。

> **Note**
> 以下文档讨论如何直接与 Laravel 的密码确认功能集成；但是，如果你想更快上手，[Laravel 应用入门套件](/docs/{{version}}/starter-kits)包含对此功能的支持！

<a name="password-confirmation-configuration"></a>
### 配置

确认密码后，用户在三个小时内不会被再次要求确认密码。但是，你可以通过更改应用 `config/auth.php` 配置文件中 `password_timeout` 配置值来配置用户被再次提示输入密码之前的时间长度。

<a name="password-confirmation-routing"></a>
### 路由

<a name="the-password-confirmation-form"></a>
#### 密码确认表单

首先，我们将定义一个路由来显示要求用户确认密码的视图：

    Route::get('/confirm-password', function () {
        return view('auth.confirm-password');
    })->middleware('auth')->name('password.confirm');

正如你可能预期的，此路由返回的视图应该有一个包含 `password` 字段的表单。此外，可以在视图中包含文本，说明用户正在进入应用的受保护区域，必须确认其密码。

<a name="confirming-the-password"></a>
#### 确认密码

接下来，我们将定义一个路由来处理"确认密码"视图的表单请求。此路由负责验证密码并将用户重定向到其预期目标：

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Redirect;

    Route::post('/confirm-password', function (Request $request) {
        if (! Hash::check($request->password, $request->user()->password)) {
            return back()->withErrors([
                'password' => ['The provided password does not match our records.']
            ]);
        }

        $request->session()->passwordConfirmed();

        return redirect()->intended();
    })->middleware(['auth', 'throttle:6,1']);

在继续之前，让我们更详细地检查此路由。首先，确定请求的 `password` 字段确实与已认证用户的密码匹配。如果密码有效，我们需要通知 Laravel 会话用户已确认其密码。`passwordConfirmed` 方法会在用户会话中设置一个时间戳，Laravel 可用它来确定用户上次确认密码的时间。最后，我们可以将用户重定向到其预期目标。

<a name="password-confirmation-protecting-routes"></a>
### 保护路由

你应该确保任何执行需要近期密码确认的操作的路由都分配了 `password.confirm` 中间件。此中间件包含在 Laravel 的默认安装中，会自动将用户的预期目标存储在会话中，以便用户在确认密码后可以重定向到该位置。将用户的预期目标存储在会话中后，中间件会将用户重定向到 `password.confirm` [命名路由](/docs/{{version}}/routing#named-routes)：

    Route::get('/settings', function () {
        // ...
    })->middleware(['password.confirm']);

    Route::post('/settings', function () {
        // ...
    })->middleware(['password.confirm']);

<a name="adding-custom-guards"></a>
## 添加自定义守卫

你可以使用 `Auth` Facade 的 `extend` 方法定义自己的认证守卫。你应该将对 `extend` 方法的调用放在[服务提供者](/docs/{{version}}/providers)中。由于 Laravel 已经内置了 `AuthServiceProvider`，我们可以将代码放在该提供者中：

    <?php

    namespace App\Providers;

    use App\Services\Auth\JwtGuard;
    use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
    use Illuminate\Support\Facades\Auth;

    class AuthServiceProvider extends ServiceProvider
    {
        /**
         * 注册应用的认证 / 授权服务。
         *
         * @return void
         */
        public function boot()
        {
            $this->registerPolicies();

            Auth::extend('jwt', function ($app, $name, array $config) {
                // 返回 Illuminate\Contracts\Auth\Guard 的实例...

                return new JwtGuard(Auth::createUserProvider($config['provider']));
            });
        }
    }

如上面的示例所示，传递给 `extend` 方法的回调应返回 `Illuminate\Contracts\Auth\Guard` 的实现。此接口包含一些你需要实现的方法来定义自定义守卫。定义自定义守卫后，你可以在 `auth.php` 配置文件的 `guards` 配置中引用该守卫：

    'guards' => [
        'api' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],
    ],

<a name="closure-request-guards"></a>
### 闭包请求守卫

实现自定义的、基于 HTTP 请求的认证系统最简单的方式是使用 `Auth::viaRequest` 方法。此方法允许你使用单个闭包快速定义认证过程。

要开始使用，在 `AuthServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受认证驱动名称作为第一个参数。此名称可以是描述自定义守卫的任意字符串。传递给方法的第二个参数应是一个闭包，它接收传入 HTTP 请求并返回用户实例，如果认证失败则返回 `null`：

    use App\Models\User;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;

    /**
     * 注册应用的认证 / 授权服务。
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Auth::viaRequest('custom-token', function (Request $request) {
            return User::where('token', (string) $request->token)->first();
        });
    }

定义自定义认证驱动后，你可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为驱动：

    'guards' => [
        'api' => [
            'driver' => 'custom-token',
        ],
    ],

最后，在将认证中间件分配给路由时，你可以引用该守卫：

    Route::middleware('auth:api')->group(function () {
        // ...
    }

<a name="adding-custom-user-providers"></a>
## 添加自定义用户提供者

如果你不使用传统的关系型数据库来存储用户，则需要使用自己的认证用户提供者扩展 Laravel。我们将使用 `Auth` Facade 的 `provider` 方法定义自定义用户提供者。用户提供者解析器应返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

    <?php

    namespace App\Providers;

    use App\Extensions\MongoUserProvider;
    use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
    use Illuminate\Support\Facades\Auth;

    class AuthServiceProvider extends ServiceProvider
    {
        /**
         * 注册应用的认证 / 授权服务。
         *
         * @return void
         */
        public function boot()
        {
            $this->registerPolicies();

            Auth::provider('mongo', function ($app, array $config) {
                // 返回 Illuminate\Contracts\Auth\UserProvider 的实例...

                return new MongoUserProvider($app->make('mongo.connection'));
            });
        }
    }

使用 `provider` 方法注册提供者后，你可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

    'providers' => [
        'users' => [
            'driver' => 'mongo',
        ],
    ],

最后，你可以在 `guards` 配置中引用此提供者：

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

<a name="the-user-provider-contract"></a>
### 用户提供者契约

`Illuminate\Contracts\Auth\UserProvider` 实现负责从持久化存储系统（如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 实现。这两个接口允许 Laravel 认证机制继续运行，无论用户数据如何存储或使用什么类型的类来表示已认证用户：

让我们看看 `Illuminate\Contracts\Auth\UserProvider` 契约：

    <?php

    namespace Illuminate\Contracts\Auth;

    interface UserProvider
    {
        public function retrieveById($identifier);
        public function retrieveByToken($identifier, $token);
        public function updateRememberToken(Authenticatable $user, $token);
        public function retrieveByCredentials(array $credentials);
        public function validateCredentials(Authenticatable $user, array $credentials);
    }

`retrieveById` 函数通常接收一个代表用户的键，例如 MySQL 数据库中的自增 ID。方法应获取并返回与该 ID 匹配的 `Authenticatable` 实现。

`retrieveByToken` 函数通过用户的唯一 `$identifier` 和"记住我"`$token` 获取用户，通常存储在 `remember_token` 等数据库列中。与前一个方法一样，此方法应返回具有匹配令牌值的 `Authenticatable` 实现。

`updateRememberToken` 方法用新的 `$token` 更新 `$user` 实例的 `remember_token`。在成功的"记住我"认证尝试或用户退出时，会为用户分配新的令牌。

`retrieveByCredentials` 方法接收尝试向应用进行认证时传递给 `Auth::attempt` 方法的凭据数组。然后，该方法应"查询"底层持久化存储以找到匹配这些凭据的用户。通常，此方法会运行一个带有"where"条件的查询，搜索"用户名"匹配 `$credentials['username']` 值的用户记录。此方法应返回 `Authenticatable` 的实现。**此方法不应尝试进行任何密码验证或认证。**

`validateCredentials` 方法应将给定的 `$user` 与 `$credentials` 进行比较以认证用户。例如，此方法通常会使用 `Hash::check` 方法将 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值进行比较。此方法应返回 `true` 或 `false` 以指示密码是否有效。

<a name="the-authenticatable-contract"></a>
### 可认证契约

现在我们已经探索了 `UserProvider` 上的每个方法，让我们看看 `Authenticatable` 契约。请记住，用户提供者应从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法返回此接口的实现：

    <?php

    namespace Illuminate\Contracts\Auth;

    interface Authenticatable
    {
        public function getAuthIdentifierName();
        public function getAuthIdentifier();
        public function getAuthPassword();
        public function getRememberToken();
        public function setRememberToken($value);
        public function getRememberTokenName();
    }

此接口很简单。`getAuthIdentifierName` 方法应返回用户"主键"字段的名称，`getAuthIdentifier` 方法应返回用户的"主键"。使用 MySQL 后端时，这可能是分配给用户记录的自增主键。`getAuthPassword` 方法应返回用户的哈希密码。

此接口允许认证系统与任何"用户"类一起工作，无论你使用什么 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个 `App\Models\User` 类，它实现了此接口。

<a name="events"></a>
## 事件

Laravel 在认证过程中会触发各种[事件](/docs/{{version}}/events)。你可以在 `EventServiceProvider` 中为这些事件附加监听器：

    /**
     * 应用的事件监听器映射。
     *
     * @var array
     */
    protected $listen = [
        'Illuminate\Auth\Events\Registered' => [
            'App\Listeners\LogRegisteredUser',
        ],

        'Illuminate\Auth\Events\Attempting' => [
            'App\Listeners\LogAuthenticationAttempt',
        ],

        'Illuminate\Auth\Events\Authenticated' => [
            'App\Listeners\LogAuthenticated',
        ],

        'Illuminate\Auth\Events\Login' => [
            'App\Listeners\LogSuccessfulLogin',
        ],

        'Illuminate\Auth\Events\Failed' => [
            'App\Listeners\LogFailedLogin',
        ],

        'Illuminate\Auth\Events\Validated' => [
            'App\Listeners\LogValidated',
        ],

        'Illuminate\Auth\Events\Verified' => [
            'App\Listeners\LogVerified',
        ],

        'Illuminate\Auth\Events\Logout' => [
            'App\Listeners\LogSuccessfulLogout',
        ],

        'Illuminate\Auth\Events\CurrentDeviceLogout' => [
            'App\Listeners\LogCurrentDeviceLogout',
        ],

        'Illuminate\Auth\Events\OtherDeviceLogout' => [
            'App\Listeners\LogOtherDeviceLogout',
        ],

        'Illuminate\Auth\Events\Lockout' => [
            'App\Listeners\LogLockout',
        ],

        'Illuminate\Auth\Events\PasswordReset' => [
            'App\Listeners\LogPasswordReset',
        ],
    ];
