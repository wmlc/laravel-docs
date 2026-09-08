# Laravel Sanctum

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [安装](#installation)
- [配置](#configuration)
    - [覆盖默认模型](#overriding-default-models)
- [API 令牌认证](#api-token-authentication)
    - [签发 API 令牌](#issuing-api-tokens)
    - [令牌能力](#token-abilities)
    - [保护路由](#protecting-routes)
    - [撤销令牌](#revoking-tokens)
    - [令牌过期](#token-expiration)
- [SPA 认证](#spa-authentication)
    - [配置](#spa-configuration)
    - [进行认证](#spa-authenticating)
    - [保护路由](#protecting-spa-routes)
    - [授权私有广播频道](#authorizing-private-broadcast-channels)
- [移动应用认证](#mobile-application-authentication)
    - [签发 API 令牌](#issuing-mobile-api-tokens)
    - [保护路由](#protecting-mobile-api-routes)
    - [撤销令牌](#revoking-mobile-api-tokens)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用以及简单、基于令牌的 API 提供了轻量级的认证系统。Sanctum 允许应用的每个用户为其账户生成多个 API 令牌。这些令牌可以被授予能力 / 作用域，用于指定允许令牌执行哪些操作。

<a name="how-it-works"></a>
### 工作原理

Laravel Sanctum 的存在是为了解决两个不同的问题。在深入探讨该库之前，让我们逐一讨论。

<a name="how-it-works-api-tokens"></a>
#### API 令牌

首先，Sanctum 是一个简单的包，你可以用它向用户签发 API 令牌，而无需 OAuth 的复杂性。此功能受 GitHub 和其他签发"个人访问令牌"的应用启发。例如，假设你的应用"账户设置"中有一个界面，用户可以在其中为其账户生成 API 令牌。你可以使用 Sanctum 生成和管理这些令牌。这些令牌通常具有很长的过期时间（数年），但用户可以随时手动撤销它们。

Laravel Sanctum 通过将用户 API 令牌存储在单个数据库表中，并通过应包含有效 API 令牌的 `Authorization` 请求头来认证传入 HTTP 请求，从而提供此功能。

<a name="how-it-works-spa-authentication"></a>
#### SPA 认证

其次，Sanctum 的存在是为了提供一种简单的方式来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与你的 Laravel 应用位于同一仓库，也可能完全是一个独立的仓库，例如使用 Next.js 或 Nuxt 创建的 SPA。

对于此功能，Sanctum 不使用任何类型的令牌。相反，Sanctum 使用 Laravel 内置的、基于 Cookie 的会话认证服务。通常，Sanctum 利用 Laravel 的 `web` 认证守卫来实现这一点。这带来了 CSRF 保护、会话认证等好处，并防止认证凭据通过 XSS 泄露。

只有当传入请求来自你自己的 SPA 前端时，Sanctum 才会尝试使用 Cookie 进行认证。当 Sanctum 检查传入的 HTTP 请求时，它首先检查认证 Cookie，如果不存在，则检查 `Authorization` 请求头中是否有有效的 API 令牌。

> [!NOTE]
> 仅将 Sanctum 用于 API 令牌认证或仅用于 SPA 认证是完全可行的。使用 Sanctum 并不意味着你必须使用它提供的两项功能。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Sanctum：

```shell
php artisan install:api
```

接下来，如果你计划使用 Sanctum 认证 SPA，请参阅本文档的 [SPA 认证](#spa-authentication)部分。

<a name="configuration"></a>
## 配置

<a name="overriding-default-models"></a>
### 覆盖默认模型

虽然通常不需要，但你可以自由地扩展 Sanctum 内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，你可以通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法指示 Sanctum 使用你的自定义模型。通常，你应在应用 `AppServiceProvider` 文件的 `boot` 方法中调用此方法：

```php
use App\Models\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
}
```

<a name="api-token-authentication"></a>
## API 令牌认证

> [!NOTE]
> 你不应使用 API 令牌来认证你自己的第一方 SPA。相反，请使用 Sanctum 内置的 [SPA 认证功能](#spa-authentication)。

<a name="issuing-api-tokens"></a>
### 签发 API 令牌

Sanctum 允许你签发可用于认证应用 API 请求的 API 令牌 / 个人访问令牌。使用 API 令牌发起请求时，令牌应作为 `Bearer` 令牌包含在 `Authorization` 请求头中。

要开始为用户签发令牌，你的 User 模型应使用 `Laravel\Sanctum\HasApiTokens` Trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要签发令牌，可以使用 `createToken` 方法。`createToken` 方法返回一个 `Laravel\Sanctum\NewAccessToken` 实例。API 令牌在存储到数据库之前使用 SHA-256 哈希进行哈希处理，但你可以使用 `NewAccessToken` 实例的 `plainTextToken` 属性访问令牌的明文值。你应在令牌创建后立即向用户显示此值：

```php
use Illuminate\Http\Request;

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});
```

你可以使用 `HasApiTokens` Trait 提供的 `tokens` Eloquent 关联访问用户的所有令牌：

```php
foreach ($user->tokens as $token) {
    // ...
}
```

<a name="token-abilities"></a>
### 令牌能力

Sanctum 允许你为令牌分配"能力"。能力与 OAuth 的"作用域"用途类似。你可以将字符串能力数组作为第二个参数传递给 `createToken` 方法：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

处理由 Sanctum 认证的传入请求时，你可以使用 `tokenCan` 或 `tokenCant` 方法判断令牌是否具有给定能力：

```php
if ($user->tokenCan('server:update')) {
    // ...
}

if ($user->tokenCant('server:update')) {
    // ...
}
```

<a name="token-ability-middleware"></a>
#### 令牌能力中间件

Sanctum 还包含两个中间件，可用于验证传入请求是否已使用被授予给定能力的令牌进行认证。要开始，请在应用 `bootstrap/app.php` 文件中定义以下中间件别名：

```php
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'abilities' => CheckAbilities::class,
        'ability' => CheckForAnyAbility::class,
    ]);
})
```

`abilities` 中间件可以分配给路由，以验证传入请求的令牌是否具有列出的所有能力：

```php
Route::get('/orders', function () {
    // Token has both "check-status" and "place-orders" abilities...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

`ability` 中间件可以分配给路由，以验证传入请求的令牌是否具有列出的能力中*至少一个*：

```php
Route::get('/orders', function () {
    // Token has the "check-status" or "place-orders" ability...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

<a name="first-party-ui-initiated-requests"></a>
#### 第一方 UI 发起的请求

为方便起见，如果传入的已认证请求来自你的第一方 SPA，且你正在使用 Sanctum 内置的 [SPA 认证](#spa-authentication)，`tokenCan` 方法将始终返回 `true`。

但这并不一定意味着你的应用必须允许用户执行该操作。通常，你的应用[授权策略](/docs/{{version}}/authorization#creating-policies)会判断令牌是否已被授予执行这些能力的权限，同时检查用户实例本身是否应被允许执行该操作。

例如，如果我们设想一个管理服务器的应用，这可能意味着检查令牌是否被授权更新服务器**并且**该服务器是否属于该用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

起初，允许调用 `tokenCan` 方法并对第一方 UI 发起的请求始终返回 `true` 可能看起来很奇怪；但是，能够始终假设 API 令牌可用并可以通过 `tokenCan` 方法检查是很方便的。通过采用这种方法，你可以在应用的授权策略中始终调用 `tokenCan` 方法，而无需担心请求是由应用 UI 触发还是由 API 的第三方消费者发起。

<a name="protecting-routes"></a>
### 保护路由

为了保护路由，使所有传入请求都必须经过认证，你应在 `routes/web.php` 和 `routes/api.php` 路由文件中将 `sanctum` 认证守卫附加到受保护的路由上。该守卫将确保传入请求被认证为有状态、基于 Cookie 的认证请求，或者在请求来自第三方时包含有效的 API 令牌请求头。

你可能想知道为什么我们建议使用 `sanctum` 守卫来认证应用 `routes/web.php` 文件中的路由。请记住，Sanctum 首先会尝试使用 Laravel 典型的会话认证 Cookie 来认证传入请求。如果该 Cookie 不存在，Sanctum 将尝试使用请求 `Authorization` 请求头中的令牌来认证请求。此外，使用 Sanctum 认证所有请求可确保我们始终可以在当前已认证的用户实例上调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-tokens"></a>
### 撤销令牌

你可以使用 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联，通过从数据库中删除令牌来"撤销"它们：

```php
// Revoke all tokens...
$user->tokens()->delete();

// Revoke the token that was used to authenticate the current request...
$request->user()->currentAccessToken()->delete();

// Revoke a specific token...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="token-expiration"></a>
### 令牌过期

默认情况下，Sanctum 令牌永不过期，只能通过[撤销令牌](#revoking-tokens)使其失效。不过，如果你想为应用的 API 令牌配置过期时间，可以通过应用 `sanctum` 配置文件中定义的 `expiration` 配置选项来实现。此配置选项定义已签发令牌被认为过期前的分钟数：

```php
'expiration' => 525600,
```

如果你想单独指定每个令牌的过期时间，可以通过将过期时间作为第三个参数提供给 `createToken` 方法来实现：

```php
return $user->createToken(
    'token-name', ['*'], now()->plus(weeks: 1)
)->plainTextToken;
```

如果你已为应用配置了令牌过期时间，你可能还希望[调度任务](/docs/{{version}}/scheduling)来修剪应用的过期令牌。幸运的是，Sanctum 包含一个 `sanctum:prune-expired` Artisan 命令，你可以使用它来实现这一点。例如，你可以配置一个计划任务来删除所有已过期至少 24 小时的过期令牌数据库记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

<a name="spa-authentication"></a>
## SPA 认证

Sanctum 的存在还为了提供一种简单的方法来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与你的 Laravel 应用位于同一仓库，也可能完全是一个独立的仓库。

对于此功能，Sanctum 不使用任何类型的令牌。相反，Sanctum 使用 Laravel 内置的、基于 Cookie 的会话认证服务。这种认证方法带来了 CSRF 保护、会话认证等好处，并防止认证凭据通过 XSS 泄露。

> [!WARNING]
> 要进行认证，你的 SPA 和 API 必须共享相同的顶级域。不过，它们可以位于不同的子域上。此外，你应确保在请求中发送 `Accept: application/json` 请求头以及 `Referer` 或 `Origin` 请求头。

<a name="spa-configuration"></a>
### 配置

<a name="configuring-your-first-party-domains"></a>
#### 配置你的第一方域

首先，你应配置你的 SPA 将从哪些域发起请求。你可以使用 `sanctum` 配置文件中的 `stateful` 配置选项配置这些域。此配置设置决定哪些域在向你的 API 发起请求时将使用 Laravel 会话 Cookie 维持"有状态"认证。

为了协助你设置第一方有状态域，Sanctum 提供了两个辅助函数，你可以将它们包含在配置中。首先，`Sanctum::currentApplicationUrlWithPort()` 将从 `APP_URL` 环境变量返回当前应用 URL，而 `Sanctum::currentRequestHost()` 将向有状态域列表注入一个占位符，该占位符在运行时将被当前请求的主机替换，从而使所有具有相同域的请求都被视为有状态。

> [!WARNING]
> 如果你通过包含端口的 URL（`127.0.0.1:8000`）访问应用，应确保在域中包含端口号。

<a name="sanctum-middleware"></a>
#### Sanctum 中间件

接下来，你应指示 Laravel：来自 SPA 的传入请求可以使用 Laravel 的会话 Cookie 进行认证，同时仍允许来自第三方或移动应用的请求使用 API 令牌进行认证。通过在应用 `bootstrap/app.php` 文件中调用 `statefulApi` 中间件方法，可以轻松实现这一点：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

<a name="cors-and-cookies"></a>
#### CORS 与 Cookie

如果你在从位于单独子域上的 SPA 与应用进行认证时遇到问题，很可能错误配置了 CORS（跨源资源共享）或会话 Cookie 设置。

`config/cors.php` 配置文件默认不会发布。如果你需要自定义 Laravel 的 CORS 选项，应使用 `config:publish` Artisan 命令发布完整的 `cors` 配置文件：

```shell
php artisan config:publish cors
```

接下来，你应确保应用的 CORS 配置返回值为 `True` 的 `Access-Control-Allow-Credentials` 请求头。这可以通过将应用 `config/cors.php` 配置文件中的 `supports_credentials` 选项设置为 `true` 来实现。

此外，你应在应用的全局 `axios` 实例上启用 `withCredentials` 和 `withXSRFToken` 选项。这可以在 `resources/js/app.js` 文件中完成。如果你没有使用 Axios 从前端发起 HTTP 请求，应在自己的 HTTP 客户端上执行等效配置：

```js
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
```

最后，你应确保应用的会话 Cookie 域配置支持根域的任何子域。你可以通过在应用 `config/session.php` 配置文件中为域添加前导 `.` 前缀来实现：

```php
'domain' => '.domain.com',
```

<a name="spa-authenticating"></a>
### 进行认证

<a name="csrf-protection"></a>
#### CSRF 保护

要认证你的 SPA，SPA 的"登录"页面应首先向 `/sanctum/csrf-cookie` 端点发起请求，以为应用初始化 CSRF 保护：

```js
axios.get('/sanctum/csrf-cookie').then(response => {
    // Login...
});
```

在此请求期间，Laravel 将设置一个包含当前 CSRF 令牌的 `XSRF-TOKEN` Cookie。该令牌随后应在后续请求中经 URL 解码后通过 `X-XSRF-TOKEN` 请求头传递，Axios 和 Angular HttpClient 等某些 HTTP 客户端库会自动为你执行此操作。如果你的 JavaScript HTTP 库未为你设置该值，你需要手动设置 `X-XSRF-TOKEN` 请求头，使其与此路由设置的 `XSRF-TOKEN` Cookie 的 URL 解码值匹配。

<a name="logging-in"></a>
#### 登录

CSRF 保护初始化后，你应向 Laravel 应用的 `/login` 路由发起 `POST` 请求。该 `/login` 路由可以[手动实现](/docs/{{version}}/authentication#authenticating-users)，或使用 [Laravel Fortify](/docs/{{version}}/fortify) 等无头认证包。

如果登录请求成功，你将被认证，后续对应用路由的请求将自动通过 Laravel 应用向你的客户端签发的会话 Cookie 进行认证。此外，由于你的应用已经向 `/sanctum/csrf-cookie` 路由发起过请求，只要你的 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 请求头中发送 `XSRF-TOKEN` Cookie 的值，后续请求应自动获得 CSRF 保护。

当然，如果用户会话因缺乏活动而过期，后续对 Laravel 应用的请求可能会收到 401 或 419 HTTP 错误响应。在这种情况下，你应将用户重定向到 SPA 的登录页面。

由于这种 SPA 认证方法是基于会话的，你可以使用 Laravel 的标准认证服务，包括["记住我"](/docs/{{version}}/authentication#remembering-users)功能。

> [!WARNING]
> 你可以自由编写自己的 `/login` 端点；但应确保它使用标准的、[Laravel 提供的基于会话的认证服务](/docs/{{version}}/authentication#authenticating-users)来认证用户。通常，这意味着使用 `web` 认证守卫。

<a name="protecting-spa-routes"></a>
### 保护路由

为了保护路由，使所有传入请求都必须经过认证，你应在 `routes/api.php` 文件中将 `sanctum` 认证守卫附加到 API 路由上。该守卫将确保传入请求被认证为来自 SPA 的有状态认证请求，或者在请求来自第三方时包含有效的 API 令牌请求头：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="authorizing-private-broadcast-channels"></a>
### 授权私有广播频道

如果你的 SPA 需要使用[私有 / 在线广播频道](/docs/{{version}}/broadcasting#authorizing-channels)进行认证，应从应用 `bootstrap/app.php` 文件中的 `withRouting` 方法中移除 `channels` 条目。相反，应调用 `withBroadcasting` 方法，以便为应用的广播路由指定正确的中间件：

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // ...
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
```

接下来，为了让 Pusher 的授权请求成功，你需要在初始化 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时提供自定义的 Pusher `authorizer`。这允许你的应用配置 Pusher 使用[已为跨域请求正确配置](#cors-and-cookies)的 `axios` 实例：

```js
window.Echo = new Echo({
    broadcaster: "pusher",
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    encrypted: true,
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                axios.post('/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    callback(true, error);
                });
            }
        };
    },
})
```

<a name="mobile-application-authentication"></a>
## 移动应用认证

你也可以使用 Sanctum 令牌来认证移动应用对你的 API 的请求。认证移动应用请求的过程与认证第三方 API 请求类似；不过，签发 API 令牌的方式有一些小差异。

<a name="issuing-mobile-api-tokens"></a>
### 签发 API 令牌

要开始，请创建一个路由，它接受用户的邮箱 / 用户名、密码和设备名称，然后将这些凭据交换为新的 Sanctum 令牌。赋予此端点的"设备名称"仅用于提供信息，可以是任何你希望的值。通常，设备名称值应是一个用户能够识别的名称，例如"Nuno's iPhone 17"。

通常，你会从移动应用的"登录"界面发起对令牌端点的请求。该端点将返回明文 API 令牌，然后可以存储在移动设备上，用于发起额外的 API 请求：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/sanctum/token', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $user->createToken($request->device_name)->plainTextToken;
});
```

移动应用使用该令牌向你的应用发起 API 请求时，应将该令牌作为 `Bearer` 令牌传递在 `Authorization` 请求头中。

> [!NOTE]
> 为移动应用签发令牌时，你也可以自由指定[令牌能力](#token-abilities)。

<a name="protecting-mobile-api-routes"></a>
### 保护路由

如前所述，你可以通过将 `sanctum` 认证守卫附加到路由来保护路由，使所有传入请求都必须经过认证：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-mobile-api-tokens"></a>
### 撤销令牌

为了允许用户撤销签发给移动设备的 API 令牌，你可以在 Web 应用 UI 的"账户设置"部分按名称列出它们，并附带一个"撤销"按钮。当用户点击"撤销"按钮时，你可以从数据库中删除该令牌。请记住，你可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联访问用户的 API 令牌：

```php
// Revoke all tokens...
$user->tokens()->delete();

// Revoke a specific token...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="testing"></a>
## 测试

测试期间，`Sanctum::actingAs` 方法可用于认证用户并指定应授予其令牌的能力：

```php tab=Pest
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('task list can be retrieved', function () {
    Sanctum::actingAs(
        User::factory()->create(),
        ['view-tasks']
    );

    $response = $this->get('/api/task');

    $response->assertOk();
});
```

```php tab=PHPUnit
use App\Models\User;
use Laravel\Sanctum\Sanctum;

public function test_task_list_can_be_retrieved(): void
{
    Sanctum::actingAs(
        User::factory()->create(),
        ['view-tasks']
    );

    $response = $this->get('/api/task');

    $response->assertOk();
}
```

如果你想为令牌授予所有能力，应在提供给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```
