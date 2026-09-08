# Laravel Sanctum

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [安装](#installation)
- [配置](#configuration)
    - [覆盖默认模型](#overriding-default-models)
- [API 令牌认证](#api-token-authentication)
    - [颁发 API 令牌](#issuing-api-tokens)
    - [令牌能力](#token-abilities)
    - [保护路由](#protecting-routes)
    - [吊销令牌](#revoking-tokens)
    - [令牌过期](#token-expiration)
- [SPA 认证](#spa-authentication)
    - [配置](#spa-configuration)
    - [用户认证](#spa-authenticating)
    - [保护路由](#protecting-spa-routes)
    - [授权私有广播频道](#authorizing-private-broadcast-channels)
- [移动应用认证](#mobile-application-authentication)
    - [颁发 API 令牌](#issuing-mobile-api-tokens)
    - [保护路由](#protecting-mobile-api-routes)
    - [吊销令牌](#revoking-mobile-api-tokens)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用以及简单的基于令牌的 API 提供了一套轻量级的认证系统。Sanctum 允许应用的每个用户为其账户生成多个 API 令牌。这些令牌可以被授予能力（ability）/ 权限范围（scope），用于指定令牌允许执行哪些操作。

<a name="how-it-works"></a>
### 工作原理

Laravel Sanctum 的存在是为了解决两个独立的问题。在深入了解这个库之前，我们先分别讨论一下。

<a name="how-it-works-api-tokens"></a>
#### API 令牌

首先，Sanctum 是一个简单的包，你可以用它为用户颁发 API 令牌，而无需卷入 OAuth 的复杂性。这一功能的灵感来自 GitHub 等颁发"个人访问令牌"（personal access token）的应用。例如，想象一下应用的"账户设置"中有一个页面，用户可以在其中为自己的账户生成 API 令牌。你可以使用 Sanctum 来生成和管理这些令牌。这些令牌通常有很长的有效期（数年），但用户随时可以手动吊销。

Laravel Sanctum 通过把用户 API 令牌存储在单个数据库表中，并经由 `Authorization` 请求头（其中应包含有效的 API 令牌）来认证传入的 HTTP 请求，从而提供这一功能。

<a name="how-it-works-spa-authentication"></a>
#### SPA 认证

其次，Sanctum 为需要与 Laravel 驱动的 API 通信的单页应用（SPA）提供了一种简单的认证方式。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库，也可能是完全独立的仓库，例如使用 Next.js 或 Nuxt 创建的 SPA。

对于这一功能，Sanctum 不使用任何类型的令牌，而是使用 Laravel 内置的基于 Cookie 的会话认证服务。通常，Sanctum 会借助 Laravel 的 `web` 认证守卫来实现。这样做的好处包括：CSRF 防护、会话认证，以及防止认证凭据经由 XSS 泄露。

只有当传入请求来自你自己的 SPA 前端时，Sanctum 才会尝试使用 Cookie 进行认证。当 Sanctum 检查传入的 HTTP 请求时，它会先检查是否存在认证 Cookie；如果没有，Sanctum 才会检查 `Authorization` 请求头中是否包含有效的 API 令牌。

> [!NOTE]
> 只将 Sanctum 用于 API 令牌认证，或只用于 SPA 认证，都是完全可以的。使用 Sanctum 并不意味着你必须同时使用它提供的两项功能。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Sanctum：

```shell
php artisan install:api
```

接下来，如果你打算用 Sanctum 来认证一个 SPA，请参阅本文档的 [SPA 认证](#spa-authentication)部分。

<a name="configuration"></a>
## 配置

<a name="overriding-default-models"></a>
### 覆盖默认模型

虽然通常不需要，但你完全可以扩展 Sanctum 在内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，你可以通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法，让 Sanctum 使用你的自定义模型。通常，你应当在应用的 `AppServiceProvider` 文件的 `boot` 方法中调用该方法：

```php
use App\Models\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
}
```

<a name="api-token-authentication"></a>
## API 令牌认证

> [!NOTE]
> 你不应当使用 API 令牌来认证自己的第一方 SPA。请改用 Sanctum 内置的 [SPA 认证功能](#spa-authentication)。

<a name="issuing-api-tokens"></a>
### 颁发 API 令牌

Sanctum 允许你颁发 API 令牌 / 个人访问令牌，用于认证发往应用的 API 请求。使用 API 令牌发起请求时，该令牌应作为 `Bearer` 令牌包含在 `Authorization` 请求头中。

要开始为用户颁发令牌，你的 User 模型应当使用 `Laravel\Sanctum\HasApiTokens` Trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要颁发令牌，可以使用 `createToken` 方法。`createToken` 方法会返回一个 `Laravel\Sanctum\NewAccessToken` 实例。API 令牌在存入数据库之前会使用 SHA-256 哈希处理，但你可以通过 `NewAccessToken` 实例的 `plainTextToken` 属性来访问令牌的明文值。你应当在令牌创建后立即将该值展示给用户：

```php
use Illuminate\Http\Request;

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});
```

你可以使用 `HasApiTokens` Trait 提供的 `tokens` Eloquent 关联来访问用户的所有令牌：

```php
foreach ($user->tokens as $token) {
    // ...
}
```

<a name="token-abilities"></a>
### 令牌能力

Sanctum 允许你为令牌分配"能力"（ability）。能力的作用与 OAuth 的"权限范围"（scope）类似。你可以把一个由字符串能力组成的数组作为第二个参数传给 `createToken` 方法：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

在处理由 Sanctum 认证的传入请求时，你可以使用 `tokenCan` 或 `tokenCant` 方法判断令牌是否具有给定能力：

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

Sanctum 还内置了两个中间件，可用于验证传入请求所使用的令牌是否已被授予给定的能力。首先，请在应用的 `bootstrap/app.php` 文件中定义以下中间件别名：

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

`abilities` 中间件可以被分配给路由，用于验证传入请求的令牌具备列出的**所有**能力：

```php
Route::get('/orders', function () {
    // 令牌同时具有 "check-status" 和 "place-orders" 能力...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

`ability` 中间件可以被分配给路由，用于验证传入请求的令牌具备所列能力中的*至少一个*：

```php
Route::get('/orders', function () {
    // 令牌具有 "check-status" 或 "place-orders" 能力...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

<a name="first-party-ui-initiated-requests"></a>
#### 第一方 UI 发起的请求

为了方便起见，如果传入的已认证请求来自你的第一方 SPA，并且你正在使用 Sanctum 内置的 [SPA 认证](#spa-authentication)，`tokenCan` 方法将始终返回 `true`。

不过，这并不必然意味着应用必须允许该用户执行相应操作。通常，应用的[授权策略](/docs/{{version}}/authorization#creating-policies)会判断令牌是否被授予了执行这些能力的权限，同时检查是否允许用户实例本身执行该操作。

例如，假设有一个管理服务器的应用，这就可能意味着既要检查令牌是否有权更新服务器，**又要**检查该服务器属于该用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

起初，允许 `tokenCan` 方法被调用、并且在第一方 UI 发起的请求中始终返回 `true`，这看起来可能有些奇怪；但是，能够始终假设存在一个可用的 API 令牌、并且可以通过 `tokenCan` 方法来检查它，会带来很多便利。采用这种方式后，你可以在应用的授权策略中始终调用 `tokenCan` 方法，而无需关心请求是由应用自身的 UI 触发，还是由你 API 的某个第三方消费者发起。

<a name="protecting-routes"></a>
### 保护路由

要保护路由，让所有传入请求都必须经过认证，你应当在 `routes/web.php` 和 `routes/api.php` 路由文件中，把 `sanctum` 认证守卫附加到受保护的路由上。该守卫可以确保传入请求要么被认证为有状态的、基于 Cookie 的认证请求，要么（当请求来自第三方时）包含有效的 API 令牌请求头。

你可能会疑惑，为什么我们建议使用 `sanctum` 守卫来认证应用 `routes/web.php` 文件中的路由。请记住，Sanctum 会首先尝试使用 Laravel 常规的会话认证 Cookie 来认证传入请求。如果该 Cookie 不存在，Sanctum 才会尝试使用请求 `Authorization` 头中的令牌来认证请求。此外，使用 Sanctum 认证所有请求，还能确保我们始终可以在当前已认证的用户实例上调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-tokens"></a>
### 吊销令牌

你可以使用 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联，从数据库中删除令牌来"吊销"它们：

```php
// 吊销所有令牌...
$user->tokens()->delete();

// 吊销用于认证当前请求的令牌...
$request->user()->currentAccessToken()->delete();

// 吊销指定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="token-expiration"></a>
### 令牌过期

默认情况下，Sanctum 令牌永远不会过期，只能通过[吊销令牌](#revoking-tokens)来使其失效。不过，如果你想为应用的 API 令牌配置过期时间，可以通过应用 `sanctum` 配置文件中的 `expiration` 配置选项来完成。该配置选项定义了已颁发令牌经过多少分钟后会被视为过期：

```php
'expiration' => 525600,
```

如果你想为每个令牌单独指定过期时间，可以把过期时间作为 `createToken` 方法的第三个参数传入：

```php
return $user->createToken(
    'token-name', ['*'], now()->plus(weeks: 1)
)->plainTextToken;
```

如果你为应用配置了令牌过期时间，可能还需要[调度一个任务](/docs/{{version}}/scheduling)来清理应用中已过期的令牌。好在，Sanctum 内置了一个 `sanctum:prune-expired` Artisan 命令来完成这项工作。例如，你可以配置一个计划任务，删除所有已过期至少 24 小时的过期令牌数据库记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

<a name="spa-authentication"></a>
## SPA 认证

Sanctum 还为需要与 Laravel 驱动的 API 通信的单页应用（SPA）提供了一种简单的认证方法。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库，也可能是完全独立的仓库。

对于这一功能，Sanctum 不使用任何类型的令牌，而是使用 Laravel 内置的基于 Cookie 的会话认证服务。这种认证方式的好处包括：CSRF 防护、会话认证，以及防止认证凭据经由 XSS 泄露。

> [!WARNING]
> 要完成认证，你的 SPA 和 API 必须共享同一个顶级域名，但可以部署在不同的子域名上。此外，你应当确保请求中发送 `Accept: application/json` 请求头，以及 `Referer` 或 `Origin` 请求头中的任意一个。

<a name="spa-configuration"></a>
### 配置

<a name="configuring-your-first-party-domains"></a>
#### 配置第一方域名

首先，你应当配置 SPA 将从哪些域名发起请求。你可以使用 `sanctum` 配置文件中的 `stateful` 配置选项来配置这些域名。此配置项决定了哪些域名在向你的 API 发起请求时，会使用 Laravel 会话 Cookie 保持"有状态"（stateful）认证。

为了帮助你设置第一方有状态域名，Sanctum 提供了两个可以写进配置的辅助函数。第一个是 `Sanctum::currentApplicationUrlWithPort()`，它会返回 `APP_URL` 环境变量中当前应用的 URL；第二个是 `Sanctum::currentRequestHost()`，它会在有状态域名列表中注入一个占位符，运行时该占位符会被当前请求的主机名替换，从而使所有相同域名的请求都被视为有状态的。

> [!WARNING]
> 如果你是通过带端口号的 URL（`127.0.0.1:8000`）访问应用的，应当确保域名中包含端口号。

<a name="sanctum-middleware"></a>
#### Sanctum 中间件

接下来，你应当告知 Laravel，来自你 SPA 的传入请求可以使用 Laravel 的会话 Cookie 进行认证，同时仍然允许来自第三方或移动应用的请求使用 API 令牌进行认证。只需在应用的 `bootstrap/app.php` 文件中调用 `statefulApi` 中间件方法，即可轻松完成：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

<a name="cors-and-cookies"></a>
#### CORS 与 Cookie

如果从运行在独立子域名上的 SPA 向应用发起认证时遇到问题，很可能是 CORS（跨源资源共享）或会话 Cookie 的配置有误。

`config/cors.php` 配置文件默认不会被发布。如果需要自定义 Laravel 的 CORS 选项，你应当使用 `config:publish` Artisan 命令发布完整的 `cors` 配置文件：

```shell
php artisan config:publish cors
```

接下来，你应当确保应用的 CORS 配置返回值为 `True` 的 `Access-Control-Allow-Credentials` 请求头。将应用 `config/cors.php` 配置文件中的 `supports_credentials` 选项设置为 `true` 即可做到。

此外，你应当在应用的全局 `axios` 实例上启用 `withCredentials` 和 `withXSRFToken` 选项。通常，这应当在 `resources/js/bootstrap.js` 文件中完成。如果你没有使用 Axios 从前端发起 HTTP 请求，则应当在自己的 HTTP 客户端上完成等效的配置：

```js
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
```

最后，你应当确保应用的会话 Cookie 域名配置支持根域名的任何子域名。这可以通过在应用 `config/session.php` 配置文件中给域名加上前导 `.` 来实现：

```php
'domain' => '.domain.com',
```

<a name="spa-authenticating"></a>
### 用户认证

<a name="csrf-protection"></a>
#### CSRF 防护

要认证你的 SPA，SPA 的"登录"页应当首先向 `/sanctum/csrf-cookie` 端点发起请求，为应用初始化 CSRF 防护：

```js
axios.get('/sanctum/csrf-cookie').then(response => {
    // 登录...
});
```

在该请求期间，Laravel 会设置一个包含当前 CSRF 令牌的 `XSRF-TOKEN` Cookie。随后，该令牌应当经过 URL 解码，并以 `X-XSRF-TOKEN` 请求头的形式随后续请求发送。一些 HTTP 客户端库（如 Axios 和 Angular HttpClient）会自动帮你完成这项工作。如果你的 JavaScript HTTP 库没有自动设置该值，你需要手动将 `X-XSRF-TOKEN` 请求头设置为与该路由设置的 `XSRF-TOKEN` Cookie 的 URL 解码值相匹配。

<a name="logging-in"></a>
#### 登录

CSRF 防护初始化完成后，你应当向 Laravel 应用的 `/login` 路由发起 `POST` 请求。这个 `/login` 路由可以[手动实现](/docs/{{version}}/authentication#authenticating-users)，也可以使用 [Laravel Fortify](/docs/{{version}}/fortify) 等无头认证包。

如果登录请求成功，你就完成了认证，后续对应用路由的请求将通过 Laravel 应用颁发给客户端的会话 Cookie 自动完成认证。此外，由于你的应用已经向 `/sanctum/csrf-cookie` 路由发起过请求，只要你的 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 请求头中发送 `XSRF-TOKEN` Cookie 的值，后续请求就会自动获得 CSRF 防护。

当然，如果用户的会话因长时间没有活动而过期，后续发往 Laravel 应用的请求可能会收到 401 或 419 HTTP 错误响应。这种情况下，你应当将用户重定向到 SPA 的登录页。

> [!WARNING]
> 你完全可以编写自己的 `/login` 端点；不过，你应当确保它使用 [Laravel 提供的标准、基于会话的认证服务](/docs/{{version}}/authentication#authenticating-users)来认证用户。通常，这意味着使用 `web` 认证守卫。

<a name="protecting-spa-routes"></a>
### 保护路由

要保护路由，让所有传入请求都必须经过认证，你应当在 `routes/api.php` 文件中把 `sanctum` 认证守卫附加到你的 API 路由上。该守卫可以确保传入请求要么被认证为来自你 SPA 的有状态认证请求，要么（当请求来自第三方时）包含有效的 API 令牌请求头：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="authorizing-private-broadcast-channels"></a>
### 授权私有广播频道

如果你的 SPA 需要认证[私有 / 在线广播频道](/docs/{{version}}/broadcasting#authorizing-channels)，你应当从应用 `bootstrap/app.php` 文件的 `withRouting` 方法中移除 `channels` 条目，改为调用 `withBroadcasting` 方法，以便为应用的广播路由指定正确的中间件：

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

接下来，为了让 Pusher 的授权请求成功，你需要在初始化 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时提供自定义的 Pusher `authorizer`。这样你的应用就可以配置 Pusher 使用[已正确配置跨域请求的](#cors-and-cookies) `axios` 实例：

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

你还可以使用 Sanctum 令牌来认证移动应用发往你 API 的请求。认证移动应用请求的流程与认证第三方 API 请求类似；不过，在颁发 API 令牌的方式上存在一些细微差别。

<a name="issuing-mobile-api-tokens"></a>
### 颁发 API 令牌

首先，创建一个接受用户邮箱 / 用户名、密码和设备名称的路由，然后把这些凭据换取为新的 Sanctum 令牌。提供给该端点的"设备名称"仅用于信息展示，可以是任何你想要的值。通常，设备名称的值应当是用户能够识别的名称，例如 "Nuno 的 iPhone 17"。

通常，你会在移动应用的"登录"界面向令牌端点发起请求。该端点会返回明文形式的 API 令牌，随后可将其存储在移动设备上，用于发起后续的 API 请求：

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

当移动应用使用该令牌向你的应用发起 API 请求时，应当把令牌作为 `Bearer` 令牌放入 `Authorization` 请求头中。

> [!NOTE]
> 为移动应用颁发令牌时，你也可以随意指定[令牌能力](#token-abilities)。

<a name="protecting-mobile-api-routes"></a>
### 保护路由

如前文所述，你可以通过把 `sanctum` 认证守卫附加到路由上，来保护路由，使所有传入请求都必须经过认证：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-mobile-api-tokens"></a>
### 吊销令牌

为了让用户能够吊销颁发给移动设备的 API 令牌，你可以在 Web 应用界面的"账户设置"部分按名称列出这些令牌，并提供一个"吊销"按钮。当用户点击"吊销"按钮时，你就可以从数据库中删除该令牌。请记住，你可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联来访问用户的 API 令牌：

```php
// 吊销所有令牌...
$user->tokens()->delete();

// 吊销指定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="testing"></a>
## 测试

在测试时，可以使用 `Sanctum::actingAs` 方法来认证用户，并指定应当授予其令牌哪些能力：

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

如果想为令牌授予所有能力，你应当在传给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```
