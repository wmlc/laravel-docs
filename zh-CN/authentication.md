# 用户认证

## 介绍

很多 Web 应用都会为用户提供一种"登录"身份认证的方式。在 Web 应用中实现这一特性可能既复杂又有风险。正因如此，Laravel 致力于为你提供快速、安全、易用的认证工具。

从本质上讲，Laravel 的认证机制由"guards"和"providers"两部分组成。Guards 定义了在每个请求中如何对用户进行认证。例如，Laravel 自带一个 `session` guard，它使用会话存储和 Cookie 来维护状态。

Providers 定义了如何从持久存储中检索用户。Laravel 自带支持使用 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构造器检索用户。不过你也可以根据应用需求自由定义其他 provider。

应用的认证配置文件位于 `config/auth.php`。该文件包含若干文档完备的选项，可用于微调 Laravel 认证服务的行为。

> [!NOTE]
> 不要把 guard 和 provider 与"角色（roles）"和"权限（permissions）"混淆。如需了解基于权限的用户操作授权，请参考 [授权](/docs/{{version}}/authorization) 文档。

### 入门套件

想快速上手？在一个全新的 Laravel 应用里安装一个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。迁移数据库后，在浏览器里访问 `/register` 或分配给应用的其他 URL。入门套件会为你搭建好完整的认证系统！

**即使你最终在 Laravel 应用里不打算使用入门套件，安装一个 [入门套件](/docs/{{version}}/starter-kits) 也是学习如何在真实 Laravel 项目中实现 Laravel 全部认证功能的好机会。** 由于 Laravel 入门套件已经为你准备好了认证相关的控制器、路由和视图，你可以查看这些文件中的代码来学习如何实现 Laravel 的认证特性。

### 数据库注意事项

默认情况下，Laravel 会在 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可以与默认的 Eloquent 认证驱动一起使用。

如果你的应用不使用 Eloquent，可以使用 `database` 认证 provider，它使用 Laravel 查询构造器。如果你的应用使用 MongoDB，请查看 MongoDB 官方的 [Laravel 用户认证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

在为 `App\Models\User` 模型设计数据库表结构时，请确保 `password` 列长度至少为 60 个字符。当然，新 Laravel 应用自带的 `users` 表迁移已经创建了一个大于该长度的列。

此外，还要确保 `users`（或等价）表中包含一个可空的、长度为 100 个字符串字符的 `remember_token` 列。该列用于存储那些在登录时选择"记住我"选项的用户的令牌。同样地，新 Laravel 应用自带的 `users` 表迁移已经包含了该列。

### 生态总览

Laravel 提供了若干与认证相关的包。在继续之前，我们先来概览一下 Laravel 中的认证生态，并讨论每个包各自的定位。

首先，想想认证是如何工作的。使用 Web 浏览器时，用户会通过登录表单提供用户名和密码。如果凭据正确，应用会把已认证用户的信息存到用户的 [会话](/docs/{{version}}/session) 中。颁发给浏览器的 Cookie 中包含会话 ID，以便后续请求可以把用户与正确的会话关联起来。收到会话 Cookie 后，应用会根据会话 ID 取出相应的会话数据，识别出已存放认证信息，并认为该用户处于"已认证"状态。

而当某个远程服务需要认证以访问 API 时，通常不会使用 Cookie，因为此时没有 Web 浏览器。这种情况下，远程服务会在每次请求时携带一个 API Token 发给 API。应用可以拿这个 Token 与"有效 API Token 表"中的记录比对，从而把该请求"认证"为属于关联到该 Token 的用户。

#### Laravel 内置的浏览器认证服务

Laravel 自带认证和会话服务，通常通过 `Auth` 和 `Session` 两个 Facade 来访问。这些特性为来自 Web 浏览器的请求提供基于 Cookie 的认证，并提供用于校验用户凭据、对用户进行认证的方法。此外，这些服务还会自动把相应的认证数据写入用户会话，并向浏览器颁发会话 Cookie。如何使用这些服务的说明都在本文档中。

**应用入门套件**

正如本文所述，你可以手动与这些认证服务交互，以搭建应用自己的认证层。不过，为了帮助你更快起步，我们发布了 [免费入门套件](/docs/{{version}}/starter-kits)，它们能为整个认证层提供稳健、现代的脚手架。

#### Laravel 的 API 认证服务

Laravel 提供了两个可选的包，用于帮助你管理 API Token 以及认证使用 API Token 发起的请求：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不互斥。这些库主要关注 API Token 认证，而内置认证服务主要关注基于 Cookie 的浏览器认证。许多应用会同时使用 Laravel 内置的基于 Cookie 的认证服务和其中的某个 Laravel API 认证包。

**Passport**

Passport 是一个 OAuth2 认证 provider，提供多种 OAuth2"授权类型"，你可以借此签发各类 Token。通常来说，这是个强大而复杂的 API 认证包。不过，大多数应用并不需要 OAuth2 规范里那些复杂的特性——它们会让用户和开发者都感到迷惑。此外，开发者历来也会对如何用 Passport 这类 OAuth2 provider 来认证 SPA 或移动端应用感到困惑。

**Sanctum**

针对 OAuth2 的复杂性和开发者的困惑，我们着手打造了一个更简单、更顺畅的认证包，它可以同时处理来自 Web 浏览器的第一方 Web 请求和基于 Token 的 API 请求。这一目标在 [Laravel Sanctum](/docs/{{version}}/sanctum) 发布时得以实现。对于既要提供第一方 Web UI 又要提供 API 的应用、或者由独立于后端 Laravel 应用之外的 SPA 驱动的应用、又或者要提供移动端的应用来说，Sanctum 应当被认为是首选且推荐的认证包。

Laravel Sanctum 是一个混合的 Web/API 认证包，可以管理应用的整个认证流程。这是可行的，因为当 Sanctum 应用收到一个请求时，Sanctum 会先判断该请求是否包含引用已认证会话的会话 Cookie。Sanctum 通过调用我们前面介绍的 Laravel 内置认证服务来实现这一点。如果请求并非通过会话 Cookie 完成认证，Sanctum 会再去检查请求是否携带 API Token。如果存在 API Token，Sanctum 将使用该 Token 完成认证。要了解这一过程的更多细节，请参考 Sanctum 的 ["how it works"](/docs/{{version}}/sanctum#how-it-works) 文档。

#### 小结与选型建议

简而言之，如果你的应用将通过浏览器访问并且构建的是单体 Laravel 应用，那么它将使用 Laravel 内置的认证服务。

接下来，如果你的应用提供面向第三方的 API，那么可以在 [Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum) 之间二选一来为应用提供 API Token 认证。一般来说，应优先选择 Sanctum，因为它是一个完整、简单的 API 认证、SPA 认证与移动端认证方案，并且支持"作用域（scope）"或"能力（abilities）"。

如果你正在构建以 Laravel 后端为支撑的单页应用（SPA），那么应当使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你既需要 [手动实现自己的后端认证路由](#authenticating-users)，也可以使用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，由它来提供注册、密码重置、邮箱验证等特性的路由和控制器。

只有当应用确实需要 OAuth2 规范里提供的全部特性时，才选择 Passport。此外，如果你正在构建一个将由 AI 客户端访问的 [MCP 服务器](/docs/{{version}}/mcp)，则应当使用 Passport，因为 MCP 客户端通常期望 [通过 OAuth 进行认证](/docs/{{version}}/mcp#oauth)。

如果你想快速起步，我们非常推荐 [我们的应用入门套件](/docs/{{version}}/starter-kits)，它们使用我们推荐的 Laravel 内置认证服务栈，能让你快速启动一个新的 Laravel 应用。

## 认证快速入门

> [!WARNING]
> 本节文档介绍的是通过 [Laravel 应用入门套件](/docs/{{version}}/starter-kits) 进行用户认证的方式，其中包含 UI 脚手架便于你快速起步。如果你想直接与 Laravel 的认证系统集成，请参阅 [手动认证用户](#authenticating-users) 文档。

### 安装入门套件

首先，你应当 [安装一个 Laravel 应用入门套件](/docs/{{version}}/starter-kits)。我们的入门套件提供了精美的设计起点，可以在你全新的 Laravel 应用中引入认证功能。

### 获取已认证用户

使用入门套件创建应用、允许用户注册并登录之后，你经常需要与当前已认证用户交互。在处理进来的请求时，可以通过 `Auth` Facade 的 `user` 方法获取当前已认证用户：

```php
use Illuminate\Support\Facades\Auth;

// 获取当前已认证用户...
$user = Auth::user();

// 获取当前已认证用户的 ID...
$id = Auth::id();
```

或者，一旦用户被认证，你也可以通过 `Illuminate\Http\Request` 实例访问已认证用户。请记住，类型提示的类会被自动注入到控制器方法中。类型提示 `Illuminate\Http\Request` 对象后，在应用任意控制器方法里，都可以通过请求的 `user` 方法便捷地访问已认证用户：

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

#### 判断当前用户是否已认证

要判断发起当前 HTTP 请求的用户是否已认证，可以使用 `Auth` Facade 上的 `check` 方法。如果用户已认证，该方法会返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // 该用户已登录...
}
```

> [!NOTE]
> 即便可以用 `check` 方法判断用户是否已认证，你通常还是会用中间件在允许用户访问某些路由/控制器前先校验其已认证状态。相关内容请参阅 [保护路由](/docs/{{version}}/authentication#protecting-routes) 文档。

### 保护路由

[路由中间件](/docs/{{version}}/middleware) 可用于仅允许已认证用户访问指定路由。Laravel 自带一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的 [中间件别名](/docs/{{version}}/middleware#middleware-aliases)。由于该中间件已经在 Laravel 内部注册过别名，所以只需把它挂载到路由定义上即可：

```php
Route::get('/flights', function () {
    // 仅允许已认证用户访问该路由...
})->middleware('auth');
```

#### 重定向未认证用户

当 `auth` 中间件检测到未认证用户时，会把用户重定向到名为 `login` 的 [命名路由](/docs/{{version}}/routing#named-routes)。你可以使用应用 `bootstrap/app.php` 文件里的 `redirectGuestsTo` 方法修改该行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo('/login');

    // 使用闭包...
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

#### 重定向已认证用户

当 `guest` 中间件检测到已认证用户时，会把用户重定向到名为 `dashboard` 或 `home` 的路由。你可以使用应用 `bootstrap/app.php` 文件里的 `redirectUsersTo` 方法修改该行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectUsersTo('/panel');

    // 使用闭包...
    $middleware->redirectUsersTo(fn (Request $request) => route('panel'));
})
```

#### 指定 Guard

在把 `auth` 中间件挂载到路由上时，你也可以指定应该使用哪个 guard 来认证用户。所指定的 guard 必须与 `auth.php` 配置文件中 `guards` 数组中的某个键对应：

```php
Route::get('/flights', function () {
    // 仅允许已认证用户访问该路由...
})->middleware('auth:admin');
```

### 登录限流

如果你正在使用我们的 [应用入门套件](/docs/{{version}}/starter-kits)，登录尝试会自动启用限流。默认情况下，用户如果多次输入错误凭据，将在一分钟内无法再次登录。该限流按用户名/邮箱与 IP 地址的组合作为唯一维度。

> [!NOTE]
> 如果你想对应用内的其他路由进行限流，请参阅 [限流文档](/docs/{{version}}/routing#rate-limiting)。

## 手动认证用户

你并非必须使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits) 自带的认证脚手架。如果你选择不使用这套脚手架，就需要直接使用 Laravel 认证类来管理用户认证。放心，非常简单！

我们将通过 `Auth` [Facade](/docs/{{version}}/facades) 访问 Laravel 的认证服务，所以需要在类的顶部导入 `Auth` Facade。接下来，我们来看 `attempt` 方法。`attempt` 方法通常用于处理应用"登录"表单发起的认证请求。如果认证成功，应当重新生成用户的 [会话](/docs/{{version}}/session)，以防止 [会话固定（session fixation）](https://en.wikipedia.org/wiki/Session_fixation)：

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

`attempt` 方法的第一个参数是一组键/值对。数组里的值将用于在数据库表中查找用户。所以，在上面的示例中，会按 `email` 列的值去检索用户。如果找到用户，数据库中保存的哈希密码会与方法传入数组中的 `password` 值进行比较。你不必对请求里的 `password` 值做哈希，因为框架在与数据库中哈希密码比较之前会自动对其进行哈希。如果两个哈希密码匹配，就会为该用户启动一个已认证的会话。

请记住，Laravel 的认证服务会根据你认证 guard 的"provider"配置从数据库中检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent user provider，并指示它在检索用户时使用 `App\Models\User` 模型。你可以根据应用的需要在配置文件中修改这些值。

`attempt` 方法在认证成功时返回 `true`，否则返回 `false`。

Laravel 跳转器提供的 `intended` 方法会把用户重定向到认证中间件拦截前他们尝试访问的 URL。如果目标 URL 不可用，可以给该方法传入一个兜底 URI。

#### 指定额外条件

你也可以在认证查询中，除了用户的邮箱和密码之外再加入其它查询条件。为此，只需要把条件加入传给 `attempt` 方法的数组中即可。例如，我们可以校验用户是否被标记为"active"：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // 认证成功...
}
```

对于更复杂的查询条件，你可以在凭据数组里提供一个闭包。该闭包会接收查询实例，让你可以按应用需求自定义查询：

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
> 在以上示例中，`email` 并不是必需的列名，仅作为示例使用。你应该使用与数据库表中"username"对应的列名。

`attemptWhen` 方法的第二个参数接收一个闭包，可以在真正认证用户之前对潜在用户做更充分的检查。该闭包接收潜在用户作为参数，并应返回 `true` 或 `false` 来表示该用户是否可以被认证：

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

#### 访问指定的 Guard 实例

通过 `Auth` Facade 的 `guard` 方法，你可以指定认证用户时希望使用哪个 guard 实例。这样一来，你就可以使用完全独立的可认证模型或用户表，分别管理应用不同部分的认证。

传给 `guard` 方法的 guard 名称必须与 `auth.php` 配置文件中配置的某个 guard 一一对应：

```php
if (Auth::guard('admin')->attempt($credentials)) {
    // ...
}
```

### 记住用户

很多 Web 应用的登录表单上都提供一个"记住我"复选框。如果你希望在应用里提供"记住我"功能，可以把一个布尔值作为第二个参数传给 `attempt` 方法。

当该值为 `true` 时，Laravel 会让用户无限期保持已认证状态，直到他们手动登出为止。你的 `users` 表必须包含字符串类型的 `remember_token` 列，用来存放"记住我"令牌。新 Laravel 应用自带的 `users` 表迁移已经包含此列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
    // 正在记住该用户...
}
```

如果你的应用提供了"记住我"功能，可以使用 `viaRemember` 方法判断当前已认证的用户是否是通过"记住我" Cookie 完成认证的：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
    // ...
}
```

### 其他认证方式

#### 通过用户实例进行认证

如果你需要把一个已存在的用户实例设为当前已认证用户，可以把该用户实例传给 `Auth` Facade 的 `login` 方法。传入的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts) 的实现。Laravel 自带的 `App\Models\User` 模型已经实现了这个接口。这种认证方式在你已经有一个有效的用户实例时非常有用，例如用户刚刚在应用里完成注册之后：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

你可以把一个布尔值作为第二个参数传给 `login` 方法，该值表示认证会话是否启用"记住我"功能。请记住，这意味着该会话会无限期保持已认证状态，直到用户手动登出为止：

```php
Auth::login($user, $remember = true);
```

如果需要，可以在调用 `login` 方法之前指定一个认证 guard：

```php
Auth::guard('admin')->login($user);
```

#### 通过用户 ID 进行认证

要通过用户的数据库记录主键来认证用户，可以使用 `loginUsingId` 方法。该方法接受你希望认证用户的主键作为参数：

```php
Auth::loginUsingId(1);
```

你可以把一个布尔值传给 `loginUsingId` 方法的 `remember` 参数，表示认证会话是否启用"记住我"功能。请记住，这意味着该会话会无限期保持已认证状态，直到用户手动登出为止：

```php
Auth::loginUsingId(1, remember: true);
```

#### 临时认证用户

可以使用 `once` 方法让某个用户只针对单次请求进行认证。调用该方法时不会用到会话或 Cookie，也不会派发 `Login` 事件：

```php
if (Auth::once($credentials)) {
    // ...
}
```

## HTTP Basic 认证

[HTTP Basic 认证](https://en.wikipedia.org/wiki/Basic_access_authentication) 提供了一种无需设置专门"登录"页就能让用户快速完成应用认证的方式。要开始使用，只需把 `auth.basic` [中间件](/docs/{{version}}/middleware) 挂到一条路由上即可。`auth.basic` 中间件随 Laravel 框架一起提供，无需自行定义：

```php
Route::get('/profile', function () {
    // 仅允许已认证用户访问该路由...
})->middleware('auth.basic');
```

中间件挂载到路由上后，当你用浏览器访问该路由时就会自动弹出凭据输入框。默认情况下，`auth.basic` 中间件会假定 `users` 表中的 `email` 列就是用户的"username"。

#### 关于 FastCGI 的补充说明

如果你使用 [PHP FastCGI](https://www.php.net/manual/en/install.fpm.php) 和 Apache 为 Laravel 应用提供服务，HTTP Basic 认证可能无法正常工作。可以在应用的 `.htaccess` 文件中加入下面这几行来解决：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

### 无状态 HTTP Basic 认证

你也可以使用 HTTP Basic 认证而又不在会话中设置用户标识 Cookie。当你选择使用 HTTP Basic 认证来认证对应用 API 的请求时，这会很有帮助。为此，需要 [定义一个中间件](/docs/{{version}}/middleware)，在里面调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，请求就可以继续向应用内部传递：

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
     * 处理进来的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return Auth::onceBasic() ?: $next($request);
    }

}
```

接下来，把该中间件挂到一条路由上：

```php
Route::get('/api/user', function () {
    // 仅允许已认证用户访问该路由...
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

## 退出登录

要手动把用户退出应用，可以使用 `Auth` Facade 提供的 `logout` 方法。它会把认证信息从用户会话中清除，使后续请求不再处于已认证状态。

除了调用 `logout` 方法之外，建议同时销毁用户的会话并重新生成其 [CSRF Token](/docs/{{version}}/csrf)。登出用户之后，通常会把用户重定向到应用的根路径：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * 把用户登出应用。
 */
public function logout(Request $request): RedirectResponse
{
    Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect('/');
}
```

### 在其他设备上销毁会话

Laravel 还提供了一种机制，可以在不销毁当前设备会话的情况下，把用户在其它设备上仍然活跃的会话失效（"退出登录"）。该特性通常用于用户修改或更新密码的场景：你希望其它设备的会话失效，同时让当前设备保持已认证状态。

开始之前，你应该确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件被添加到了需要 Session 认证的路由上。通常应当把它放到一个路由分组里，这样就可以覆盖到应用的大多数路由。默认情况下，可以通过 `auth.session` [中间件别名](/docs/{{version}}/middleware#middleware-aliases) 将 `AuthenticateSession` 中间件挂到一条路由上：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。该方法要求用户提供他们的当前密码，应用应当通过某个输入表单接收：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

当 `logoutOtherDevices` 方法被调用后，用户在其它设备上的会话会被完全销毁，也就是说他们会被从所有先前通过其认证的 guard 中"退出"。

## 密码确认

构建应用时，你偶尔会遇到这样的情形：某些操作在执行前，或在用户被重定向到应用的敏感区域前，需要用户先确认自己的密码。Laravel 自带了中间件，让这一流程变得轻而易举。实现该特性需要你定义两条路由：一条用于显示一个让用户确认密码的视图，另一条用于确认密码有效并将用户重定向到他们想去的目标。

> [!NOTE]
> 下面的文档说明如何直接与 Laravel 的密码确认特性集成；不过，如果你想更快起步，可以使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)，它们已经内置了对该特性的支持！

### 配置

用户确认密码后，3 小时内不会再被要求再次确认。不过，你可以通过修改应用 `config/auth.php` 配置文件中 `password_timeout` 配置值来调整再次要求确认密码的间隔时长。

### 路由

#### 密码确认表单

首先，我们定义一条路由用于显示一个让用户确认密码的视图：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

正如你所期待的，这个路由返回的视图应该包含一个带有 `password` 字段的表单。同时，你也可以在视图里加上对用户的提示文字，说明他们正在进入应用的受保护区域，必须先确认密码。

#### 确认密码

接下来，我们定义一条用于处理来自"密码确认"视图表单请求的路由。该路由负责校验密码并把用户重定向到他们想去的目标：

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

在继续之前，我们更仔细地看看这条路由。首先会对请求里的 `password` 字段与已认证用户的密码进行实际比对。如果密码有效，则需要告知 Laravel 的会话：用户已确认密码。`passwordConfirmed` 方法会在用户的会话里写入一个时间戳，Laravel 可以据此判断用户最近一次确认密码的时间。最后，我们就可以把用户重定向到他们想去的目标地址。

### 保护路由

你应当为任何执行"需要最近一次密码确认"操作的路由挂上 `password.confirm` 中间件。该中间件随 Laravel 默认安装提供，会自动把用户想要访问的目标 URL 存入会话，以便在用户确认密码后再重定向过去。目标 URL 存入会话之后，中间件会把用户重定向到名为 `password.confirm` 的 [命名路由](/docs/{{version}}/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

## 添加自定义 Guard

你可以使用 `Auth` Facade 的 `extend` 方法来定义自己的认证 Guard。`extend` 方法的调用应当放在一个 [服务提供者](/docs/{{version}}/providers) 中。由于 Laravel 已经自带 `AppServiceProvider`，我们可以把代码放在那里：

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
     * 引导启动任何应用服务。
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // 返回一个 Illuminate\Contracts\Auth\Guard 实例...

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

正如上面的示例所示，传入 `extend` 方法的回调应返回一个 `Illuminate\Contracts\Auth\Guard` 的实现。要定义自定义 Guard，你需要实现该接口中的几个方法。一旦自定义 Guard 定义好之后，就可以在 `auth.php` 配置文件的 `guards` 配置中引用它：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

### 闭包请求 Guard

实现基于 HTTP 请求的自定义认证系统，最简单的方式是使用 `Auth::viaRequest` 方法。该方法让你通过单个闭包快速定义认证流程。

要开始使用，请在 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest`。`viaRequest` 方法的第一个参数是认证驱动的名字，可以是任何能描述你自定义 Guard 的字符串。第二个参数应是一个闭包，接收进来的 HTTP 请求，并返回一个用户实例；如果认证失败，则返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

自定义认证驱动定义好之后，可以在 `auth.php` 配置文件的 `guards` 配置中将其注册为驱动：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，在把认证中间件挂到路由时引用这个 Guard：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

## 添加自定义用户提供器

如果你没有用传统的关系型数据库来存储用户，就需要为 Laravel 扩展自己的认证 user provider。我们将使用 `Auth` Facade 的 `provider` 方法来定义自定义 user provider。User provider 解析器应当返回一个 `Illuminate\Contracts\Auth\UserProvider` 的实现：

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
     * 引导启动任何应用服务。
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // 返回一个 Illuminate\Contracts\Auth\UserProvider 实例...

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

通过 `provider` 方法注册好 provider 之后，就可以在 `auth.php` 配置文件中切换到新的 user provider 了。首先，定义一个使用新驱动的 provider：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，可以在 `guards` 配置中引用这个 provider：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
],
```

### User Provider 契约

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从一个持久化存储（如 MySQL、MongoDB 等）中取出一个 `Illuminate\Contracts\Auth\Authenticatable` 实现。这两个接口让 Laravel 的认证机制无论用户数据如何存储、无论用哪种类来表示已认证用户，都可以继续工作：

我们来看 `Illuminate\Contracts\Auth\UserProvider` 契约：

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

`retrieveById` 方法通常接收一个代表用户的键，比如 MySQL 数据库的自增 ID。该方法应当检索出与该 ID 匹配的 `Authenticatable` 实现并返回。

`retrieveByToken` 方法通过唯一的 `$identifier` 和"记住我"`$token` 来检索一个用户，token 通常存于类似 `remember_token` 的数据库列中。和前面一样，token 匹配的 `Authenticatable` 实现应当被该方法返回。

`updateRememberToken` 方法会用新的 `$token` 更新 `$user` 实例的 `remember_token`。在"记住我"认证成功或用户登出时，会给用户分配一个新 token。

`retrieveByCredentials` 方法接收调用 `Auth::attempt` 认证用户时传入的凭据数组。然后该方法应当基于底层持久化存储"查询"出与这些凭据匹配的用户。通常，该方法会执行带有"where"条件的查询，搜索"username"等于 `$credentials['username']` 值的记录。该方法应返回一个 `Authenticatable` 实现。**此方法不应尝试做任何密码校验或认证操作。**

`validateCredentials` 方法应把给定的 `$user` 与 `$credentials` 进行比对以认证用户。例如，该方法通常会使用 `Hash::check` 把 `$user->getAuthPassword()` 的值与 `$credentials['password']` 进行比较。该方法应返回 `true` 或 `false`，表示密码是否有效。

`rehashPasswordIfRequired` 方法应在需要时对给定 `$user` 的密码进行重新哈希。例如，该方法通常使用 `Hash::needsRehash` 判断 `$credentials['password']` 是否需要重新哈希。如果需要重新哈希，应使用 `Hash::make` 重新哈希密码并更新底层持久化存储中的用户记录。

### Authenticatable 契约

至此我们已经看过了 `UserProvider` 的各个方法，下面再来看 `Authenticatable` 契约。请记住，user provider 的 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法都应返回这个接口的实现：

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

这个接口比较简单。`getAuthIdentifierName` 方法应返回用户的"主键"列名，`getAuthIdentifier` 方法应返回用户的"主键"值。当使用 MySQL 后端时，它通常就是分配给用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的列名。`getAuthPassword` 方法应返回用户的哈希密码。

这个接口让认证系统可以与任何"用户"类一起使用，无论你使用的是哪种 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个实现了该接口的 `App\Models\User` 类。

## 自动重新哈希密码

Laravel 默认的密码哈希算法是 bcrypt。可以通过应用 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量来调整 bcrypt 哈希的"工作因子"。

通常，随着 CPU/GPU 算力的提升，应当逐步增大 bcrypt 的工作因子。如果你增大了应用的 bcrypt 工作因子，Laravel 会在用户通过入门套件或通过 `attempt` 方法 [手动认证](#authenticating-users) 时，优雅地、自动地为用户的密码重新哈希。

通常，自动重新哈希密码不会对你的应用造成干扰；但如果你想禁用该行为，可以发布 `hashing` 配置文件：

```shell
php artisan config:publish hashing
```

配置文件发布后，把 `rehash_on_login` 配置项设为 `false` 即可：

```php
'rehash_on_login' => false,
```

## 事件

Laravel 在认证过程中会派发多种 [事件](/docs/{{version}}/events)。你可以为以下任意事件 [定义监听器](/docs/{{version}}/events)：

| 事件名                                       |
| -------------------------------------------- |
| `Illuminate\Auth\Events\Registered`           |
| `Illuminate\Auth\Events\Attempting`           |
| `Illuminate\Auth\Events\Authenticated`        |
| `Illuminate\Auth\Events\Login`                |
| `Illuminate\Auth\Events\Failed`               |
| `Illuminate\Auth\Events\Validated`            |
| `Illuminate\Auth\Events\Verified`             |
| `Illuminate\Auth\Events\Logout`               |
| `Illuminate\Auth\Events\CurrentDeviceLogout`  |
| `Illuminate\Auth\Events\OtherDeviceLogout`    |
| `Illuminate\Auth\Events\Lockout`              |
| `Illuminate\Auth\Events\PasswordReset`        |
| `Illuminate\Auth\Events\PasswordResetLinkSent` |
