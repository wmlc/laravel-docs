# 认证

- [简介](#introduction)
    - [入门套件](#starter-kits)
    - [数据库注意事项](#introduction-database-considerations)
    - [生态系统概览](#ecosystem-overview)
- [认证快速上手](#authentication-quickstart)
    - [安装入门套件](#install-a-starter-kit)
    - [获取已认证用户](#retrieving-the-authenticated-user)
    - [保护路由](#protecting-routes)
    - [登录限流](#login-throttling)
- [手动认证用户](#authenticating-users)
    - [记住用户](#remembering-users)
    - [其他认证方式](#other-authentication-methods)
- [HTTP Basic 认证](#http-basic-authentication)
    - [无状态的 HTTP Basic 认证](#stateless-http-basic-authentication)
- [退出登录](#logging-out)
    - [使其他设备上的会话失效](#invalidating-sessions-on-other-devices)
- [密码确认](#password-confirmation)
    - [配置](#password-confirmation-configuration)
    - [路由](#password-confirmation-routing)
    - [保护路由](#password-confirmation-protecting-routes)
- [添加自定义守卫](#adding-custom-guards)
    - [闭包请求守卫](#closure-request-guards)
- [添加自定义用户提供者](#adding-custom-user-providers)
    - [用户提供者契约](#the-user-provider-contract)
    - [可认证契约](#the-authenticatable-contract)
- [自动重新哈希密码](#automatic-password-rehashing)
- [社交认证](/docs/{{version}}/socialite)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用都为用户提供了对应用进行认证并"登录"的方式。在 Web 应用中实现这一功能可能既复杂又有潜在风险。因此，Laravel 力求为你提供必要的工具，让你快速、安全、轻松地实现认证。

Laravel 的认证设施的核心由"守卫"和"提供者"构成。守卫定义了每次请求中如何对用户进行认证。例如，Laravel 自带一个 `session` 守卫，它使用会话存储和 Cookie 来维持状态。

提供者定义了如何从持久化存储中检索用户。Laravel 支持使用 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构造器检索用户。当然，你也可以根据应用需要自由定义额外的提供者。

你应用的认证配置文件位于 `config/auth.php`。该文件包含若干选项并附有详细文档，可用于微调 Laravel 认证服务的行为。

> [!NOTE]
> 守卫和提供者不应与"角色"和"权限"混淆。若想了解更多关于通过权限授权用户操作的内容，请参阅[授权](/docs/{{version}}/authorization)文档。

<a name="starter-kits"></a>
### 入门套件

想快速上手吗？在一个全新的 Laravel 应用中安装一个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。迁移数据库后，在浏览器中访问 `/register` 或分配给你应用的其他任意 URL。入门套件会为你的整套认证系统搭建好脚手架！

**即便你最终决定不在 Laravel 应用中使用入门套件，安装 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze) 入门套件也是一个难得的学习机会，让你了解如何在真实的 Laravel 项目中实现 Laravel 的全部认证功能。** 由于 Laravel Breeze 会为你生成认证控制器、路由和视图，你可以研究这些文件中的代码，了解 Laravel 的认证功能可以如何实现。

<a name="introduction-database-considerations"></a>
### 数据库注意事项

默认情况下，Laravel 会在你的 `app/Models` 目录中提供一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可以与默认的 Eloquent 认证驱动配合使用。

如果你的应用不使用 Eloquent，可以使用 `database` 认证提供者，它使用 Laravel 的查询构造器。如果你的应用使用 MongoDB，请查阅 MongoDB 官方的 [Laravel 用户认证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

为 `App\Models\User` 模型构建数据库模式时，请确保密码列的长度至少为 60 个字符。当然，新 Laravel 应用中自带的 `users` 表数据库迁移已经创建了一个超出该长度的列。

此外，你还应确认 `users`（或同等）表中包含一个长度为 100 个字符、允许为 null 的字符串 `remember_token` 列。该列用于存储用户登录应用时勾选"记住我"选项所用的令牌。同样，新 Laravel 应用中自带的默认 `users` 表数据库迁移已经包含了这个列。

<a name="ecosystem-overview"></a>
### 生态系统概览

Laravel 提供了若干与认证相关的包。在继续之前，我们先回顾 Laravel 中认证生态系统的总体情况，并讨论每个包的预期用途。

首先来看认证的工作方式。当使用 Web 浏览器时，用户会通过登录表单提供用户名和密码。如果凭据正确，应用会把已认证用户的信息存储在用户的[会话](/docs/{{version}}/session)中。发给浏览器的 Cookie 包含会话 ID，这样后续对应用的请求就能把该用户与正确的会话关联起来。收到会话 Cookie 后，应用会根据会话 ID 检索会话数据、记录认证信息已存储在会话中，并视为该用户已"通过认证"。

当远程服务需要通过认证访问 API 时，通常不会使用 Cookie 进行认证，因为根本没有 Web 浏览器。此时，远程服务会在每次请求中向 API 发送一个 API 令牌。应用可以将传入的令牌与有效 API 令牌表进行校验，并把该请求"认证"为由与该 API 令牌关联的用户发起的。

<a name="laravels-built-in-browser-authentication-services"></a>
#### Laravel 内置的浏览器认证服务

Laravel 内置了认证和会话服务，通常通过 `Auth` 和 `Session` Facade 访问。这些功能为从 Web 浏览器发起的请求提供基于 Cookie 的认证。它们提供了可用于验证用户凭据并完成用户认证的方法。此外，这些服务会自动把恰当的认证数据存储到用户会话中，并发出用户的会话 Cookie。本文档中包含如何使用这些服务的详细讨论。

**应用入门套件**

如本文件所讨论的，你可以手动与这些认证服务交互，构建应用自己的认证层。不过，为了帮助你更快上手，我们发布了若干[免费包](/docs/{{version}}/starter-kits)，它们为整个认证层提供了稳健、现代的脚手架。这些包包括 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze)、[Laravel Jetstream](/docs/{{version}}/starter-kits#laravel-jetstream) 和 [Laravel Fortify](/docs/{{version}}/fortify)。

_Laravel Breeze_ 是 Laravel 全部认证功能的简单最小实现，包含登录、注册、密码重置、邮箱验证和密码确认。Laravel Breeze 的视图层由简单的 [Blade 模板](/docs/{{version}}/blade) 组成，并使用 [Tailwind CSS](https://tailwindcss.com) 设置样式。要开始上手，请查阅 Laravel [应用入门套件](/docs/{{version}}/starter-kits)的文档。

_Laravel Fortify_ 是 Laravel 的无头认证后端，实现了本文档中介绍的许多功能，包括基于 Cookie 的认证，以及双因素认证、邮箱验证等其他特性。Fortify 为 Laravel Jetstream 提供认证后端，也可以独立与 [Laravel Sanctum](/docs/{{version}}/sanctum) 配合使用，为需要与 Laravel 认证的 SPA 提供认证能力。

_[Laravel Jetstream](https://jetstream.laravel.com)_ 是一个功能强大的应用入门套件，它消费并暴露 Laravel Fortify 的认证服务，并配备由 [Tailwind CSS](https://tailwindcss.com)、[Livewire](https://livewire.laravel.com) 和 / 或 [Inertia](https://inertiajs.com) 驱动的精美现代 UI。Laravel Jetstream 包含对双因素认证、团队支持、浏览器会话管理、资料管理，以及与 [Laravel Sanctum](/docs/{{version}}/sanctum) 内置集成以提供 API 令牌认证的可选支持。下面会讨论 Laravel 的 API 认证方案。

<a name="laravels-api-authentication-services"></a>
#### Laravel 的 API 认证服务

Laravel 提供两个可选包，帮助你管理 API 令牌并对使用 API 令牌发出的请求进行认证：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不互斥。这些库主要关注 API 令牌认证，而内置认证服务关注基于 Cookie 的浏览器认证。许多应用会同时使用 Laravel 内置的基于 Cookie 的认证服务和 Laravel 的某个 API 认证包。

**Passport**

Passport 是一个 OAuth2 认证提供者，提供多种 OAuth2"授权类型"，让你可以签发各种类型的令牌。总体而言，这是一个功能稳健但复杂的 API 认证包。然而，大多数应用并不需要 OAuth2 规范所提供的复杂功能，而这些功能对用户和开发者来说都可能令人困惑。此外，开发者长期以来一直困惑于如何使用 Passport 这类 OAuth2 认证提供者来认证 SPA 应用或移动应用。

**Sanctum**

为应对 OAuth2 的复杂性以及开发者的困惑，我们着手构建一个更简单、更精简的认证包，它既能处理来自浏览器的第一方 Web 请求，也能处理通过令牌发出的 API 请求。[Laravel Sanctum](/docs/{{version}}/sanctum) 的发布实现了这一目标。对于那些在 API 之外还提供第一方 Web UI 的应用、由独立于后端 Laravel 应用的单页应用（SPA）驱动的应用，或提供移动客户端的应用，应当把 Laravel Sanctum 视为首选且推荐的认证包。

Laravel Sanctum 是一个混合式的 Web / API 认证包，能够管理你应用的整个认证流程。之所以能做到这一点，是因为当基于 Sanctum 的应用收到请求时，Sanctum 会先判断该请求是否包含指向已认证会话的会话 Cookie。Sanctum 通过调用我们前面讨论过的 Laravel 内置认证服务来完成这一判断。如果请求并非通过会话 Cookie 进行认证，Sanctum 就会检查请求中是否带有 API 令牌。若存在 API 令牌，Sanctum 就会使用该令牌对请求进行认证。想进一步了解这一流程，请查阅 Sanctum 的[工作原理](/docs/{{version}}/sanctum#how-it-works)文档。

我们之所以把 Laravel Sanctum 作为 API 包纳入 [Laravel Jetstream](https://jetstream.laravel.com) 应用入门套件，是因为我们认为它最适合绝大多数 Web 应用的认证需求。

<a name="summary-choosing-your-stack"></a>
#### 总结与技术选型

总而言之，如果你的应用将通过浏览器访问，并且你正在构建一个单体式 Laravel 应用，那么你的应用会使用 Laravel 内置的认证服务。

其次，如果你的应用提供一个供第三方消费的 API，你需要在 [Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum) 之间做出选择，为应用提供 API 令牌认证。总体而言，应尽可能优先选择 Sanctum，因为它为 API 认证、SPA 认证和移动认证提供了一个简单完整的解决方案，并且支持"范围"或"能力"。

如果你正在构建一个由 Laravel 后端驱动的单页应用（SPA），应当使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你需要[手动实现自己的后端认证路由](#authenticating-users)，或者使用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，由它为注册、密码重置、邮箱验证等功能提供路由和控制器。

当你的应用确实需要 OAuth2 规范所提供的全部特性时，可以选择 Passport。

最后，如果你想快速上手，我们很高兴推荐 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze)，它是一条快速开启新 Laravel 应用之路的捷径，并且已经使用我们所推荐的认证技术栈，即 Laravel 内置认证服务与 Laravel Sanctum。

<a name="authentication-quickstart"></a>
## 认证快速上手

> [!WARNING]
> 本部分文档讨论如何通过 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)认证用户，其中包含帮助你快速上手的 UI 脚手架。如果你想直接与 Laravel 的认证系统集成，请查阅[手动认证用户](#authenticating-users)文档。

<a name="install-a-starter-kit"></a>
### 安装入门套件

首先，你应当[安装一个 Laravel 应用入门套件](/docs/{{version}}/starter-kits)。我们当前的入门套件 Laravel Breeze 和 Laravel Jetstream 都提供了设计精美的起点，方便你在全新的 Laravel 应用中集成认证。

Laravel Breeze 是 Laravel 全部认证功能的极简实现，包含登录、注册、密码重置、邮箱验证和密码确认。Laravel Breeze 的视图层由简单的 [Blade 模板](/docs/{{version}}/blade) 组成，并使用 [Tailwind CSS](https://tailwindcss.com) 设置样式。此外，Breeze 还提供基于 [Livewire](https://livewire.laravel.com) 或 [Inertia](https://inertiajs.com) 的脚手架选项，其中基于 Inertia 的脚手架可选择使用 Vue 或 React。

[Laravel Jetstream](https://jetstream.laravel.com) 是一个功能更强大的应用入门套件，它支持使用 [Livewire](https://livewire.laravel.com) 或 [Inertia 与 Vue](https://inertiajs.com) 为你的应用搭建脚手架。此外，Jetstream 还包含对双因素认证、团队、资料管理、浏览器会话管理、通过 [Laravel Sanctum](/docs/{{version}}/sanctum) 提供的 API 支持、账户删除等功能的可选支持。

<a name="retrieving-the-authenticated-user"></a>
### 获取已认证用户

安装认证入门套件并允许用户注册和认证你的应用之后，你经常需要与当前已认证的用户进行交互。在处理传入请求时，你可以通过 `Auth` Facade 的 `user` 方法访问已认证用户：

    use Illuminate\Support\Facades\Auth;

    // 获取当前已认证的用户...
    $user = Auth::user();

    // 获取当前已认证用户的 ID...
    $id = Auth::id();

或者，一旦用户通过认证，你也可以通过 `Illuminate\Http\Request` 实例访问已认证用户。请记住，类型提示过的类会被自动注入到你的控制器方法中。通过类型提示 `Illuminate\Http\Request` 对象，你就可以从应用中任意控制器方法方便地访问已认证用户，方式是使用请求对象的 `user` 方法：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;

    class FlightController extends Controller
    {
        /**
         * 更新现有航班的航班信息。
         */
        public function update(Request $request): RedirectResponse
        {
            $user = $request->user();

            // ...

            return redirect('/flights');
        }
    }

<a name="determining-if-the-current-user-is-authenticated"></a>
#### 判断当前用户是否已认证

要判断发起传入 HTTP 请求的用户是否已认证，可以使用 `Auth` Facade 上的 `check` 方法。如果用户已通过认证，该方法会返回 `true`：

    use Illuminate\Support\Facades\Auth;

    if (Auth::check()) {
        // 用户已登录...
    }

> [!NOTE]
> 尽管可以使用 `check` 方法判断用户是否已认证，但你通常会使用中间件来验证用户身份，然后才允许其访问特定路由 / 控制器。若想了解更多内容，请查阅[保护路由](/docs/{{version}}/authentication#protecting-routes)文档。

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于只允许已认证用户访问指定路由。Laravel 自带一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的[中间件别名](/docs/{{version}}/middleware#middleware-aliases)。由于该中间件在 Laravel 内部已经拥有别名，你只需把中间件附加到路由定义上即可：

    Route::get('/flights', function () {
        // 只有已认证用户才能访问此路由...
    })->middleware('auth');

<a name="redirecting-unauthenticated-users"></a>
#### 重定向未认证用户

当 `auth` 中间件检测到未认证用户时，会把该用户重定向到 `login` [命名路由](/docs/{{version}}/routing#named-routes)。你可以使用应用 `bootstrap/app.php` 文件中的 `redirectGuestsTo` 方法修改这一行为：

    use Illuminate\Http\Request;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo('/login');

        // 使用闭包...
        $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
    })

<a name="specifying-a-guard"></a>
#### 指定守卫

把 `auth` 中间件附加到路由时，你还可以指定使用哪个"守卫"来认证用户。所指定的守卫应对应 `auth.php` 配置文件中 `guards` 数组的某个键：

    Route::get('/flights', function () {
        // 只有已认证用户才能访问此路由...
    })->middleware('auth:admin');

<a name="login-throttling"></a>
### 登录限流

如果你使用的是 Laravel Breeze 或 Laravel Jetstream [入门套件](/docs/{{version}}/starter-kits)，登录尝试会自动应用限流。默认情况下，如果用户在若干次尝试后仍无法提供正确凭据，则在一分钟内无法登录。限流依据用户的用户名 / 邮箱地址及其 IP 地址分别计算。

> [!NOTE]
> 如果你想对应用中的其他路由也进行限流，请查阅[限流文档](/docs/{{version}}/routing#rate-limiting)。

<a name="authenticating-users"></a>
## 手动认证用户

你不一定要使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)中附带的认证脚手架。如果你选择不使用这些脚手架，就需要直接使用 Laravel 的认证类来管理用户认证。别担心，这非常简单！

我们将通过 `Auth` [Facade](/docs/{{version}}/facades)访问 Laravel 的认证服务，因此需要在类的顶部导入 `Auth` Facade。接下来，看看 `attempt` 方法。`attempt` 方法通常用于处理来自应用"登录"表单的认证尝试。如果认证成功，你应该重新生成用户的[会话](/docs/{{version}}/session)，以防止[会话固定](https://en.wikipedia.org/wiki/Session_fixation)攻击：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Support\Facades\Auth;

    class LoginController extends Controller
    {
        /**
         * 处理一次认证尝试。
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

`attempt` 方法的第一个参数接受一个键 / 值对数组。数组中的值将用于在你的数据库表中查找用户。因此，在上面的例子中，系统会根据 `email` 列的值检索用户。如果找到了用户，数据库中存储的哈希密码会与通过数组传给该方法的 `password` 值进行比较。你不应对传入请求中的 `password` 值做哈希处理，因为框架会在与数据库中的哈希密码比较之前自动对该值进行哈希。如果两个哈希密码匹配，系统就会为该用户启动一个已认证的会话。

请记住，Laravel 的认证服务会根据认证守卫的"提供者"配置从数据库中检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示它在检索用户时使用 `App\Models\User` 模型。你可以根据应用需求在配置文件中修改这些值。

如果认证成功，`attempt` 方法会返回 `true`；否则返回 `false`。

Laravel 重定向器提供的 `intended` 方法会把用户重定向到他们在被认证中间件拦截之前试图访问的 URL。如果期望的目标不可用，可以给该方法传入一个备用 URI。

<a name="specifying-additional-conditions"></a>
#### 指定额外条件

如果需要，除了用户的邮箱和密码之外，你还可以为认证查询添加额外的查询条件。为此，只需把查询条件加入传给 `attempt` 方法的数组即可。例如，你可以验证用户是否被标记为"活跃"：

    if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
        // 认证成功...
    }

对于复杂的查询条件，你可以在凭据数组中提供一个闭包。该闭包会接收查询实例，让你可以根据应用需求自定义查询：

    use Illuminate\Database\Eloquent\Builder;

    if (Auth::attempt([
        'email' => $email,
        'password' => $password,
        fn (Builder $query) => $query->has('activeSubscription'),
    ])) {
        // 认证成功...
    }

> [!WARNING]
> 在这些例子中，`email` 并不是必需的选项，它仅仅是被用作示例。你应当使用与数据库表中"用户名"对应的列名。

`attemptWhen` 方法的第二个参数接收一个闭包，可用于在真正认证用户之前对候选用户进行更详尽的检查。该闭包会接收候选用户，并应返回 `true` 或 `false` 来表示该用户是否可以认证：

    if (Auth::attemptWhen([
        'email' => $email,
        'password' => $password,
    ], function (User $user) {
        return $user->isNotBanned();
    })) {
        // 认证成功...
    }

<a name="accessing-specific-guard-instances"></a>
#### 访问特定的守卫实例

通过 `Auth` Facade 的 `guard` 方法，你可以指定在认证用户时希望使用哪个守卫实例。这样你就可以使用完全独立的可认证模型或用户表，为应用的不同部分分别管理认证。

传给 `guard` 方法的守卫名称应对应 `auth.php` 配置文件中配置的某个守卫：

    if (Auth::guard('admin')->attempt($credentials)) {
        // ...
    }

<a name="remembering-users"></a>
### 记住用户

许多 Web 应用都在登录表单中提供一个"记住我"复选框。如果你想在自己的应用中提供"记住我"功能，可以把一个布尔值作为 `attempt` 方法的第二个参数传入。

当该值为 `true` 时，Laravel 会让用户持续保持认证状态，直到他们主动退出登录为止。你的 `users` 表必须包含字符串 `remember_token` 列，该列用于存储"记住我"令牌。新 Laravel 应用自带的 `users` 表数据库迁移已经包含了这个列：

    use Illuminate\Support\Facades\Auth;

    if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
        // 正在记住该用户...
    }

如果你的应用提供"记住我"功能，可以使用 `viaRemember` 方法判断当前已认证用户是否是使用"记住我"Cookie 完成认证的：

    use Illuminate\Support\Facades\Auth;

    if (Auth::viaRemember()) {
        // ...
    }

<a name="other-authentication-methods"></a>
### 其他认证方式

<a name="authenticate-a-user-instance"></a>
#### 认证用户实例

如果你需要把一个已有的用户实例设置为当前已认证用户，可以把该用户实例传给 `Auth` Facade 的 `login` 方法。传入的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts)的一个实现。Laravel 自带的 `App\Models\User` 模型已经实现了这个接口。当你手上已经有一个有效的用户实例时，例如用户刚在你的应用中注册之后，这种认证方式会非常方便：

    use Illuminate\Support\Facades\Auth;

    Auth::login($user);

你可以把一个布尔值作为 `login` 方法的第二个参数传入。该值表示是否需要为已认证的会话启用"记住我"功能。请记住，这意味着会话将保持认证状态，直到用户主动从应用中退出登录：

    Auth::login($user, $remember = true);

如有需要，你可以在调用 `login` 方法之前指定一个认证守卫：

    Auth::guard('admin')->login($user);

<a name="authenticate-a-user-by-id"></a>
#### 通过 ID 认证用户

要使用数据库记录的主键认证用户，可以使用 `loginUsingId` 方法。该方法接受你希望认证的用户的主键：

    Auth::loginUsingId(1);

你可以给 `loginUsingId` 方法的 `remember` 参数传入一个布尔值。该值表示是否需要为已认证的会话启用"记住我"功能。请记住，这意味着会话将保持认证状态，直到用户主动从应用中退出登录：

    Auth::loginUsingId(1, remember: true);

<a name="authenticate-a-user-once"></a>
#### 一次性认证用户

你可以使用 `once` 方法针对单次请求认证用户。调用该方法时不会使用任何会话或 Cookie：

    if (Auth::once($credentials)) {
        // ...
    }

<a name="http-basic-authentication"></a>
## HTTP Basic 认证

[HTTP Basic 认证](https://en.wikipedia.org/wiki/Basic_access_authentication)提供了一种无需搭建专用"登录"页面就能认证应用用户的快捷方式。要开始上手，只需把 `auth.basic` [中间件](/docs/{{version}}/middleware)附加到路由上即可。`auth.basic` 中间件随 Laravel 框架一同提供，因此你不需要自行定义：

    Route::get('/profile', function () {
        // 只有已认证用户才能访问此路由...
    })->middleware('auth.basic');

中间件附加到路由之后，在浏览器中访问该路由时就会自动提示你输入凭据。默认情况下，`auth.basic` 中间件会假定 `users` 数据库表中的 `email` 列就是用户的"用户名"。

<a name="a-note-on-fastcgi"></a>
#### 关于 FastCGI 的说明

如果你使用 PHP FastCGI 和 Apache 提供 Laravel 应用服务，HTTP Basic 认证可能无法正常工作。要解决这些问题，可以把以下几行添加到应用的 `.htaccess` 文件中：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>
### 无状态的 HTTP Basic 认证

你也可以使用 HTTP Basic 认证而不设置会话用户标识 Cookie。如果选择用 HTTP 认证来认证对应用 API 的请求，这一点会尤为方便。为此，请[定义一个中间件](/docs/{{version}}/middleware)并在其中调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回任何响应，请求可以继续进入应用：

    <?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use Symfony\Component\HttpFoundation\Response;

    class AuthenticateOnceWithBasicAuth
    {
        /**
         * 处理传入的请求。
         *
         * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
         */
        public function handle(Request $request, Closure $next): Response
        {
            return Auth::onceBasic() ?: $next($request);
        }

    }

接下来，把该中间件附加到路由上：

    Route::get('/api/user', function () {
        // 只有已认证用户才能访问此路由...
    })->middleware(AuthenticateOnceWithBasicAuth::class);

<a name="logging-out"></a>
## 退出登录

要手动让用户退出应用，可以使用 `Auth` Facade 提供的 `logout` 方法。该方法会从用户会话中移除认证信息，使后续请求不再通过认证。

除了调用 `logout` 方法之外，我们还建议你使该用户的会话失效，并重新生成其 [CSRF 令牌](/docs/{{version}}/csrf)。在让用户退出登录之后，你通常会把用户重定向到应用的根路径：

    use Illuminate\Http\Request;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Support\Facades\Auth;

    /**
     * 将该用户从应用中登出。
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

<a name="invalidating-sessions-on-other-devices"></a>
### 使其他设备上的会话失效

Laravel 还提供了一套机制，可以在不使当前设备会话失效的前提下，使某个用户在其他设备上处于活跃状态的会话失效并"退出登录"。当用户正在更改或更新密码，而你希望在保持当前设备认证的同时使其他设备上的会话失效时，通常会用到这个功能。

开始之前，请确保在需要接收会话认证的路由上包含 `Illuminate\Session\Middleware\AuthenticateSession` 中间件。通常，你应当把该中间件放在路由组定义上，以便它能应用到应用中大多数路由上。默认情况下，可以使用 `auth.session` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)把 `AuthenticateSession` 中间件附加到路由：

    Route::middleware(['auth', 'auth.session'])->group(function () {
        Route::get('/', function () {
            // ...
        });
    });

然后，你可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。该方法要求用户确认其当前密码，你的应用应当通过一个输入表单来接收该密码：

    use Illuminate\Support\Facades\Auth;

    Auth::logoutOtherDevices($currentPassword);

`logoutOtherDevices` 方法被调用时，该用户的其他会话会被彻底失效，也就是说用户会在其此前通过认证的所有守卫中"退出登录"。

<a name="password-confirmation"></a>
## 密码确认

在构建应用的过程中，你偶尔会遇到一些操作，要求用户在执行操作之前确认密码，或者在被重定向到应用的敏感区域之前确认密码。Laravel 内置了中间件，让这个过程变得轻而易举。实现这一功能需要你定义两个路由：一个用于展示要求用户确认密码的视图，另一个用于确认密码有效并把用户重定向到其目标位置。

> [!NOTE]
> 下面的文档讨论如何直接集成 Laravel 的密码确认功能；不过，如果你想更快上手，[Laravel 应用入门套件](/docs/{{version}}/starter-kits)已经支持该功能！

<a name="password-confirmation-configuration"></a>
### 配置

用户确认密码之后，三小时内不会再次被要求确认密码。不过，你可以通过修改应用 `config/auth.php` 配置文件中的 `password_timeout` 配置值，来调整重新提示用户输入密码之前的等待时长。

<a name="password-confirmation-routing"></a>
### 路由

<a name="the-password-confirmation-form"></a>
#### 密码确认表单

首先，我们将定义一个路由，用来展示要求用户确认密码的视图：

    Route::get('/confirm-password', function () {
        return view('auth.confirm-password');
    })->middleware('auth')->name('password.confirm');

你可能已经猜到，该路由返回的视图应当包含一个带 `password` 字段的表单。此外，你可以在视图中自由加入说明性文字，告知用户正在进入应用的受保护区域，必须确认密码。

<a name="confirming-the-password"></a>
#### 确认密码

接下来，我们将定义一个路由，用于处理来自"确认密码"视图的表单请求。该路由负责校验密码，并把用户重定向到其目标位置：

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

在继续之前，让我们更仔细地看看这条路由。首先，要确认请求中的 `password` 字段是否确实与已认证用户的密码相符。如果密码有效，就需要告知 Laravel 的会话该用户已确认密码。`passwordConfirmed` 方法会在用户会话中设置一个时间戳，Laravel 可以据此判断用户上次确认密码的时间。最后，我们可以把用户重定向到其目标位置。

<a name="password-confirmation-protecting-routes"></a>
### 保护路由

你应当确保任何执行需要近期密码确认之操作的路由都指定了 `password.confirm` 中间件。该中间件随 Laravel 的默认安装一同提供，它会自动把用户的目标位置存储在会话中，以便用户在确认密码后被重定向到该位置。在把用户的目标位置存储到会话之后，该中间件会把用户重定向到 `password.confirm` [命名路由](/docs/{{version}}/routing#named-routes)：

    Route::get('/settings', function () {
        // ...
    })->middleware(['password.confirm']);

    Route::post('/settings', function () {
        // ...
    })->middleware(['password.confirm']);

<a name="adding-custom-guards"></a>
## 添加自定义守卫

你可以使用 `Auth` Facade 上的 `extend` 方法定义自己的认证守卫。应当把对 `extend` 方法的调用放在[服务提供者](/docs/{{version}}/providers)中。由于 Laravel 已经自带了一个 `AppServiceProvider`，我们可以把代码放在该提供者中：

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
                // 返回 Illuminate\Contracts\Auth\Guard 的实例...

                return new JwtGuard(Auth::createUserProvider($config['provider']));
            });
        }
    }

如上面例子所示，传给 `extend` 方法的回调应当返回 `Illuminate\Contracts\Auth\Guard` 的一个实现。该接口包含若干你需要实现的方法，用于定义自定义守卫。定义好自定义守卫之后，你可以在 `auth.php` 配置文件的 `guards` 配置中引用该守卫：

    'guards' => [
        'api' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],
    ],

<a name="closure-request-guards"></a>
### 闭包请求守卫

实现自定义的、基于 HTTP 请求的认证系统，最简单的方式是使用 `Auth::viaRequest` 方法。该方法允许你用一个闭包快速定义认证流程。

要开始上手，请在应用的 `AppServiceProvider` 的 `boot` 方法内调用 `Auth::viaRequest` 方法。`viaRequest` 方法的第一个参数接受一个认证驱动名称。这个名称可以是任何能描述你的自定义守卫的字符串。传给该方法的第二个参数应当是一个闭包，它接收传入的 HTTP 请求，并返回一个用户实例；若认证失败，则返回 `null`：

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

定义好自定义认证驱动之后，你可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为一个驱动：

    'guards' => [
        'api' => [
            'driver' => 'custom-token',
        ],
    ],

最后，在给路由指定认证中间件时，你可以引用该守卫：

    Route::middleware('auth:api')->group(function () {
        // ...
    });

<a name="adding-custom-user-providers"></a>
## 添加自定义用户提供者

如果你没有使用传统的关系型数据库存储用户，就需要用自己的认证用户提供者扩展 Laravel。我们将使用 `Auth` Facade 上的 `provider` 方法来定义自定义用户提供者。用户提供者解析器应当返回 `Illuminate\Contracts\Auth\UserProvider` 的一个实现：

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
                // 返回 Illuminate\Contracts\Auth\UserProvider 的实例...

                return new MongoUserProvider($app->make('mongo.connection'));
            });
        }
    }

使用 `provider` 方法注册该提供者之后，你可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

    'providers' => [
        'users' => [
            'driver' => 'mongo',
        ],
    ],

最后，你可以在 `guards` 配置中引用该提供者：

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

<a name="the-user-provider-contract"></a>
### 用户提供者契约

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从 MySQL、MongoDB 等持久化存储系统中取出 `Illuminate\Contracts\Auth\Authenticatable` 的实现。这两个接口使 Laravel 的认证机制无论用户数据如何存储、无论使用哪种类型的类来表示已认证用户，都能继续正常工作：

我们来看看 `Illuminate\Contracts\Auth\UserProvider` 契约：

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

`retrieveById` 函数通常接收一个代表用户的键，例如 MySQL 数据库中自增的 ID。该方法应检索并返回与该 ID 匹配的 `Authenticatable` 实现。

`retrieveByToken` 函数根据用户唯一的 `$identifier` 和"记住我"`$token` 检索用户，后者通常存储在类似 `remember_token` 的数据库列中。与上一个方法一样，该方法应返回令牌值匹配的 `Authenticatable` 实现。

`updateRememberToken` 方法用新的 `$token` 更新 `$user` 实例的 `remember_token`。当用户成功完成"记住我"认证尝试时，或者当用户退出登录时，系统会为该用户分配一个全新的令牌。

`retrieveByCredentials` 方法接收在尝试与应用进行认证时传给 `Auth::attempt` 方法的凭据数组。该方法随后应在底层持久化存储中"查询"与这些凭据匹配的用户。通常，该方法会执行一个带"where"条件的查询，查找"用户名"与 `$credentials['username']` 值匹配的用户记录。该方法应返回一个 `Authenticatable` 的实现。**该方法不应尝试做任何密码校验或认证。**

`validateCredentials` 方法应比较给定的 `$user` 与 `$credentials` 来认证用户。例如，该方法通常会使用 `Hash::check` 方法，把 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值进行比较。该方法应返回 `true` 或 `false`，表示密码是否有效。

`rehashPasswordIfRequired` 方法应在需要且受支持的情况下，对给定 `$user` 的密码重新进行哈希。例如，该方法通常会使用 `Hash::needsRehash` 方法判断 `$credentials['password']` 的值是否需要重新哈希。如果密码需要重新哈希，该方法应使用 `Hash::make` 方法重新哈希密码，并更新底层持久化存储中的用户记录。

<a name="the-authenticatable-contract"></a>
### 可认证契约

我们已经了解了 `UserProvider` 上的每个方法，现在来看看 `Authenticatable` 契约。请记住，用户提供者应从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法中返回该接口的实现：

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

这个接口很简单。`getAuthIdentifierName` 方法应返回用户的"主键"列名，`getAuthIdentifier` 方法应返回用户的"主键"。使用 MySQL 后端时，这很可能就是分配给该用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的名称。`getAuthPassword` 方法应返回用户的哈希密码。

该接口让认证系统可以与任意"用户"类协作，无论你使用的是哪个 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中提供了一个实现该接口的 `App\Models\User` 类。

<a name="automatic-password-rehashing"></a>
## 自动重新哈希密码

Laravel 默认的密码哈希算法是 bcrypt。bcrypt 哈希的"工作因子"可以通过应用的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量进行调整。

通常，随着 CPU / GPU 算力提升，bcrypt 的工作因子也应随之提高。如果你提高了应用的 bcrypt 工作因子，当用户通过 Laravel 的入门套件认证你的应用时，或当你通过 `attempt` 方法[手动认证用户](#authenticating-users)时，Laravel 会平滑且自动地重新哈希用户密码。

通常，自动重新哈希密码不会干扰你的应用；不过，你可以通过发布 `hashing` 配置文件来禁用该行为：

```shell
php artisan config:publish hashing
```

配置文件发布之后，你可以把 `rehash_on_login` 配置值设为 `false`：

```php
'rehash_on_login' => false,
```

<a name="events"></a>
## 事件

Laravel 在认证过程中会派发各类[事件](/docs/{{version}}/events)。你可以为以下任意事件[定义监听器](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称 |
| --- |
| `Illuminate\Auth\Events\Registered` |
| `Illuminate\Auth\Events\Attempting` |
| `Illuminate\Auth\Events\Authenticated` |
| `Illuminate\Auth\Events\Login` |
| `Illuminate\Auth\Events\Failed` |
| `Illuminate\Auth\Events\Validated` |
| `Illuminate\Auth\Events\Verified` |
| `Illuminate\Auth\Events\Logout` |
| `Illuminate\Auth\Events\CurrentDeviceLogout` |
| `Illuminate\Auth\Events\OtherDeviceLogout` |
| `Illuminate\Auth\Events\Lockout` |
| `Illuminate\Auth\Events\PasswordReset` |

</div>
