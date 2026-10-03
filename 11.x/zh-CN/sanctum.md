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
    - [认证](#spa-authenticating)
    - [保护路由](#protecting-spa-routes)
    - [授权私有广播频道](#authorizing-private-broadcast-channels)
- [移动应用认证](#mobile-application-authentication)
    - [签发 API 令牌](#issuing-mobile-api-tokens)
    - [保护路由](#protecting-mobile-api-routes)
    - [撤销令牌](#revoking-mobile-api-tokens)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用以及简单的基于令牌的 API 提供了一套轻量级的认证系统。Sanctum 允许应用的每个用户为自己的账户生成多个 API 令牌。这些令牌可以被授予能力（abilities）/ 作用域（scopes），用于限定令牌允许执行的操作。

<a name="how-it-works"></a>
### 工作原理

Laravel Sanctum 的存在是为了解决两个各自独立的问题。在深入了解这个库之前，我们先分别讨论它们。

<a name="how-it-works-api-tokens"></a>
#### API 令牌

首先，Sanctum 是一个简单的包，你可以在不涉及 OAuth 复杂流程的情况下为用户签发 API 令牌。这项功能的灵感来自 GitHub 等会签发"个人访问令牌"的应用。举个例子，假设你的应用有一个"账号设置"页面，用户可以在其中为自己的账户生成 API 令牌。你可以用 Sanctum 来生成和管理这些令牌。这些令牌通常有效期很长（以年计），但用户可以随时手动撤销它们。

Laravel Sanctum 通过把用户 API 令牌存储在单个数据库表中来实现该功能，并通过应当包含有效 API 令牌的 `Authorization` 头对传入的 HTTP 请求进行认证。

<a name="how-it-works-spa-authentication"></a>
#### SPA 认证

其次，Sanctum 还为那些需要与 Laravel 驱动的 API 通信的单页应用（SPA）提供了一种简单的认证方式。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库中，也可能是一个完全独立的仓库，例如使用 Next.js 或 Nuxt 创建的 SPA。

对于该功能，Sanctum 不使用任何类型的令牌，而是使用 Laravel 内置的基于 Cookie 的会话认证服务。Sanctum 通常借助 Laravel 的 `web` 认证守卫来实现这一点。这样既获得了 CSRF 保护和会话认证的优势，也能防止认证凭据通过 XSS 泄露。

只有当传入请求来自你自己的 SPA 前端时，Sanctum 才会尝试使用 Cookie 进行认证。Sanctum 检查传入的 HTTP 请求时，会先查找认证 Cookie；如果没有找到，它才会去检查 `Authorization` 头中是否有有效的 API 令牌。

> [!NOTE]
> 你完全可以只使用 Sanctum 的 API 令牌认证功能，或者只使用它的 SPA 认证功能。仅仅因为你使用了 Sanctum，并不意味着你必须同时使用它提供的这两项功能。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Sanctum：

```shell
php artisan install:api
```

接下来，如果你打算使用 Sanctum 来认证 SPA，请参阅本文档的 [SPA 认证](#spa-authentication)一节。

<a name="configuration"></a>
## 配置

<a name="overriding-default-models"></a>
### 覆盖默认模型

虽然通常没有这个必要，但你仍然可以扩展 Sanctum 内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，你可以通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法指示 Sanctum 使用你的自定义模型。通常应在应用 `AppServiceProvider` 文件的 `boot` 方法中调用该方法：

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
> 你不应该使用 API 令牌来认证自己的第一方 SPA。相反，请使用 Sanctum 内置的 [SPA 认证功能](#spa-authentication)。

<a name="issuing-api-tokens"></a>
### 签发 API 令牌

Sanctum 允许你签发可用于认证 API 请求的 API 令牌 / 个人访问令牌。当使用 API 令牌发起请求时，应当把令牌作为 `Bearer` 令牌放入 `Authorization` 头中。

要开始为用户签发令牌，你的 User 模型应当使用 `Laravel\Sanctum\HasApiTokens` Trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要签发令牌，可以使用 `createToken` 方法。`createToken` 方法返回一个 `Laravel\Sanctum\NewAccessToken` 实例。API 令牌在存入数据库前会使用 SHA-256 哈希处理，但你可以通过 `NewAccessToken` 实例的 `plainTextToken` 属性访问令牌的明文值。你应当在令牌创建后立即把这个值展示给用户：

```php
use Illuminate\Http\Request;

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});
```

你可以通过 `HasApiTokens` Trait 提供的 `tokens` Eloquent 关联访问该用户的全部令牌：

```php
foreach ($user->tokens as $token) {
    // ...
}
```

<a name="token-abilities"></a>
### 令牌能力

Sanctum 允许你为令牌分配"能力"。能力的作用与 OAuth 中的"作用域"类似。你可以把一个由字符串组成的能力数组作为 `createToken` 方法的第二个参数传入：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

在处理由 Sanctum 认证通过的传入请求时，你可以使用 `tokenCan` 或 `tokenCant` 方法判断令牌是否拥有某项能力：

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

Sanctum 还包含两个中间件，可用于验证传入请求是否由拥有指定能力的令牌完成认证。要开始使用，请在应用的 `bootstrap/app.php` 文件中定义以下中间件别名：

```php
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'abilities' => CheckAbilities::class,
        'ability' => CheckForAnyAbility::class,
    ]);
})
```

`abilities` 中间件可以分配给路由，用于验证传入请求的令牌是否拥有列出的全部能力：

```php
Route::get('/orders', function () {
    // 令牌同时拥有 "check-status" 和 "place-orders" 能力...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

`ability` 中间件可以分配给路由，用于验证传入请求的令牌是否至少拥有列出的其中*一项*能力：

```php
Route::get('/orders', function () {
    // 令牌拥有 "check-status" 或 "place-orders" 能力...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

<a name="first-party-ui-initiated-requests"></a>
#### 第一方 UI 发起的请求

为方便起见，如果传入的已认证请求来自你的第一方 SPA，并且你正在使用 Sanctum 内置的 [SPA 认证](#spa-authentication)，那么 `tokenCan` 方法总是返回 `true`。

不过，这并不一定意味着你的应用必须允许该用户执行该操作。通常，你的应用的[授权策略](/docs/{{version}}/authorization#creating-policies)会判断令牌是否已被授予执行这些能力的权限，同时也会检查用户实例本身是否被允许执行该操作。

举个例子，假设我们有一个管理服务器的应用，这可能意味着需要检查令牌是否有权更新服务器，**并且**该服务器属于该用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

起初，允许调用 `tokenCan` 方法并在第一方 UI 发起的请求中总是返回 `true`，可能看起来有些奇怪；不过这样一来，你就能便捷地假定 API 令牌总是可用，并且可以通过 `tokenCan` 方法进行检查。采用这种方式后，你就可以在应用的授权策略中始终调用 `tokenCan` 方法，而不必担心请求究竟是由应用 UI 触发的，还是由 API 的某个第三方消费者发起的。

<a name="protecting-routes"></a>
### 保护路由

若要保护路由，使所有传入请求都必须通过认证，你应当在 `routes/web.php` 和 `routes/api.php` 路由文件中，为受保护的路由挂载 `sanctum` 认证守卫。该守卫会确保传入请求要么以有状态的 Cookie 认证请求通过认证，要么在请求来自第三方时包含有效的 API 令牌头。

你可能想知道，为什么我们建议你使用 `sanctum` 守卫来认证应用 `routes/web.php` 文件中的路由。请记住，Sanctum 会先尝试使用 Laravel 常规的会话认证 Cookie 对传入请求进行认证。如果该 Cookie 不存在，Sanctum 随后会尝试使用请求 `Authorization` 头中的令牌进行认证。此外，使用 Sanctum 认证所有请求，能确保我们始终可以对当前已认证的用户实例调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-tokens"></a>
### 撤销令牌

你可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联，把令牌从数据库中删除，以此"撤销"令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销用于认证当前请求的令牌...
$request->user()->currentAccessToken()->delete();

// 撤销指定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="token-expiration"></a>
### 令牌过期

默认情况下，Sanctum 令牌永不过期，只能通过[撤销令牌](#revoking-tokens)来失效。不过，如果你想为应用的 API 令牌配置过期时间，可以通过应用 `sanctum` 配置文件中定义的 `expiration` 配置项来设置。该配置项定义了一个已签发令牌被视为过期之前经过的分钟数：

```php
'expiration' => 525600,
```

如果你想为每个令牌单独指定过期时间，可以把过期时间作为 `createToken` 方法的第三个参数传入：

```php
return $user->createToken(
    'token-name', ['*'], now()->addWeek()
)->plainTextToken;
```

如果你已经为应用配置了令牌过期时间，你可能还想[调度一个任务](/docs/{{version}}/scheduling)来清理应用中已过期的令牌。幸运的是，Sanctum 内置了 `sanctum:prune-expired` Artisan 命令，你可以用它来完成这件事。例如，你可以配置一个定时任务，删除所有过期至少 24 小时的令牌数据库记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

<a name="spa-authentication"></a>
## SPA 认证

Sanctum 还为那些需要与 Laravel 驱动的 API 通信的单页应用（SPA）提供了一种简单的认证方式。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库中，也可能是一个完全独立的仓库。

对于该功能，Sanctum 不使用任何类型的令牌，而是使用 Laravel 内置的基于 Cookie 的会话认证服务。这种认证方式既获得了 CSRF 保护和会话认证的优势，也能防止认证凭据通过 XSS 泄露。

> [!WARNING]
> 为了完成认证，你的 SPA 和 API 必须共享同一个顶级域名，但它们可以部署在不同的子域名上。此外，你应当确保在请求中发送 `Accept: application/json` 头，以及 `Referer` 或 `Origin` 头。

<a name="spa-configuration"></a>
### 配置

<a name="configuring-your-first-party-domains"></a>
#### 配置你的第一方域名

首先，你应当配置你的 SPA 将从哪些域名发起请求。你可以在 `sanctum` 配置文件中使用 `stateful` 配置项来配置这些域名。该配置项决定了在请求你的 API 时，哪些域名会使用 Laravel 会话 Cookie 保持"有状态"认证。

> [!WARNING]
> 如果你通过带端口的 URL 访问应用（`127.0.0.1:8000`），请务必在域名中包含端口号。

<a name="sanctum-middleware"></a>
#### Sanctum 中间件

接下来，你应当告诉 Laravel：来自你的 SPA 的传入请求可以使用 Laravel 会话 Cookie 进行认证，同时仍允许来自第三方或移动应用的请求使用 API 令牌认证。只需在应用的 `bootstrap/app.php` 文件中调用 `statefulApi` 中间件方法即可轻松实现：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
})
```

<a name="cors-and-cookies"></a>
#### CORS 与 Cookie

如果你的 SPA 部署在独立的子域名上，并且难以完成与应用之间的认证，那么你很可能把 CORS（跨源资源共享）或会话 Cookie 配置错了。

`config/cors.php` 配置文件默认不会发布。如果你需要自定义 Laravel 的 CORS 选项，可以使用 `config:publish` Artisan 命令发布完整的 `cors` 配置文件：

```bash
php artisan config:publish cors
```

接下来，你应当确保应用的 CORS 配置返回了值为 `True` 的 `Access-Control-Allow-Credentials` 头。这可以把应用 `config/cors.php` 配置文件中的 `supports_credentials` 选项设为 `true` 来实现。

此外，你应当在应用的全局 `axios` 实例上启用 `withCredentials` 和 `withXSRFToken` 选项。通常应在 `resources/js/bootstrap.js` 文件中完成。如果你没有使用 Axios 从前端发起 HTTP 请求，就应当在自己的 HTTP 客户端上做等效配置：

```js
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
```

最后，你应当确保应用的会话 Cookie 域名配置支持根域名的任意子域名。你可以在应用的 `config/session.php` 配置文件中为域名添加前导 `.` 来实现：

```php
'domain' => '.domain.com',
```

<a name="spa-authenticating"></a>
### 认证

<a name="csrf-protection"></a>
#### CSRF 保护

要认证你的 SPA，你的 SPA"登录"页面应先向 `/sanctum/csrf-cookie` 端点发起一次请求，以为应用初始化 CSRF 保护：

```js
axios.get('/sanctum/csrf-cookie').then(response => {
    // 登录...
});
```

在此请求期间，Laravel 会设置一个包含当前 CSRF 令牌的 `XSRF-TOKEN` Cookie。随后应对该令牌做 URL 解码，并在后续请求中通过 `X-XSRF-TOKEN` 头传回；Axios 和 Angular HttpClient 等 HTTP 客户端库会自动为你完成这一步。如果你的 JavaScript HTTP 库没有设置该值，你就需要手动设置 `X-XSRF-TOKEN` 头，使其值与该路由所设置的 `XSRF-TOKEN` Cookie 的 URL 解码值一致。

<a name="logging-in"></a>
#### 登录

CSRF 保护初始化完成后，你应当向 Laravel 应用的 `/login` 路由发起一次 `POST` 请求。该 `/login` 路由可以[手动实现](/docs/{{version}}/authentication#authenticating-users)，也可以使用 [Laravel Fortify](/docs/{{version}}/fortify) 这类无头认证包来实现。

如果登录请求成功，你就完成了认证，后续对应用路由的请求将通过 Laravel 应用签发给客户端的会话 Cookie 自动完成认证。此外，由于你的应用已经请求过 `/sanctum/csrf-cookie` 路由，只要你的 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 头中发送 `XSRF-TOKEN` Cookie 的值，后续请求就会自动获得 CSRF 保护。

当然，如果用户因长时间不活动而导致会话过期，后续对 Laravel 应用的请求可能会收到 401 或 419 HTTP 错误响应。此时，你应当把用户重定向到 SPA 的登录页面。

> [!WARNING]
> 你可以自行编写 `/login` 端点；但必须确保它使用 Laravel 提供的标准[基于会话的认证服务](/docs/{{version}}/authentication#authenticating-users)来认证用户。这通常意味着使用 `web` 认证守卫。

<a name="protecting-spa-routes"></a>
### 保护路由

若要保护路由，使所有传入请求都必须通过认证，你应当在 `routes/api.php` 文件中为 API 路由挂载 `sanctum` 认证守卫。该守卫会确保传入请求要么以来自你的 SPA 的有状态认证请求通过认证，要么在请求来自第三方时包含有效的 API 令牌头：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="authorizing-private-broadcast-channels"></a>
### 授权私有广播频道

如果你的 SPA 需要与[私有 / 在线状态广播频道](/docs/{{version}}/broadcasting#authorizing-channels)进行认证，你应当从应用 `bootstrap/app.php` 文件中 `withRouting` 方法包含的 `channels` 配置项里移除该条目。相反，你应当调用 `withBroadcasting` 方法，以便为应用的广播路由指定正确的中间件：

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

接下来，为了让 Pusher 的授权请求成功，你需要在初始化 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时提供一个自定义的 Pusher `authorizer`。这样你的应用就可以配置 Pusher 使用那个[已正确配置跨域请求](#cors-and-cookies)的 `axios` 实例：

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

你也可以使用 Sanctum 令牌来认证移动应用对 API 发起的请求。移动应用请求的认证流程与第三方 API 请求的认证流程类似；不过，你在签发 API 令牌的方式上有一些细微差别。

<a name="issuing-mobile-api-tokens"></a>
### 签发 API 令牌

要开始使用，请创建一条路由，接收用户的邮箱 / 用户名、密码和设备名称，然后把这些凭据兑换为一个新的 Sanctum 令牌。传给该端点的"设备名称"仅用于信息展示，可以是你希望的任何值。一般来说，设备名称应当是用户能识别的名称，例如"Nuno 的 iPhone 12"。

通常，你会在移动应用的"登录"页面向令牌端点发起请求。该端点会返回明文 API 令牌，你可以把它存储在移动设备上，用于发起后续的 API 请求：

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

当移动应用使用该令牌向你的应用发起 API 请求时，应当把令牌作为 `Bearer` 令牌放入 `Authorization` 头中。

> [!NOTE]
> 为移动应用签发令牌时，你也可以自由指定[令牌能力](#token-abilities)。

<a name="protecting-mobile-api-routes"></a>
### 保护路由

如前文所述，你可以通过为路由挂载 `sanctum` 认证守卫来保护路由，使所有传入请求都必须通过认证：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

<a name="revoking-mobile-api-tokens"></a>
### 撤销令牌

为了让用户能够撤销签发给移动设备的 API 令牌，你可以在 Web 应用界面的"账号设置"部分按名称列出这些令牌，并配上一个"撤销"按钮。当用户点击"撤销"按钮时，你就可以把该令牌从数据库中删除。请记住，你可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联访问用户的 API 令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销指定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="testing"></a>
## 测试

在测试中，可以使用 `Sanctum::actingAs` 方法认证用户，并指定应当授予其令牌的能力：

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

如果你想把全部能力都授予令牌，应当在传给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```