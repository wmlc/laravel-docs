# Laravel Sanctum

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [安装](#installation)
- [配置](#configuration)
    - [覆盖默认模型](#overriding-default-models)
- [API 令牌认证](#api-token-authentication)
    - [发放 API 令牌](#issuing-api-tokens)
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
    - [发放 API 令牌](#issuing-mobile-api-tokens)
    - [保护路由](#protecting-mobile-api-routes)
    - [撤销令牌](#revoking-mobile-api-tokens)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用以及简单的基于令牌的 API 提供了轻量级的认证系统。Sanctum 允许应用的每个用户为其账户生成多个 API 令牌。这些令牌可以被授予能力 / 权限，以指定令牌允许执行的操作。

<a name="how-it-works"></a>
### 工作原理

Laravel Sanctum 旨在解决两个独立的问题。在深入探讨该库之前，先分别讨论一下。

<a name="how-it-works-api-tokens"></a>
#### API 令牌

首先，Sanctum 是一个简单的包，可用于向用户发放 API 令牌，而无需 OAuth 的复杂性。此功能的灵感来自 GitHub 等发放"个人访问令牌"的应用。例如，假设应用的"账户设置"中有一个页面，用户可以在其中为账户生成 API 令牌。可以使用 Sanctum 来生成和管理这些令牌。这些令牌通常具有很长的过期时间（数年），但用户可以随时手动撤销。

Laravel Sanctum 通过将用户 API 令牌存储在单个数据库表中，并通过 `Authorization` 头（应包含有效的 API 令牌）来认证传入的 HTTP 请求，从而提供此功能。

<a name="how-it-works-spa-authentication"></a>
#### SPA 认证

其次，Sanctum 提供了一种简单的方式来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与 Laravel 应用存在于同一个仓库中，也可能是完全独立的仓库，例如使用 Vue CLI 或 Next.js 应用创建的 SPA。

对于此功能，Sanctum 不使用任何类型的令牌。相反，Sanctum 使用 Laravel 内置的基于 Cookie 的会话认证服务。通常，Sanctum 利用 Laravel 的 `web` 认证守卫来实现。这提供了 CSRF 保护、会话认证的好处，同时防止通过 XSS 泄露认证凭据。

Sanctum 仅在传入请求来自自身 SPA 前端时尝试使用 Cookie 进行认证。当 Sanctum 检查传入的 HTTP 请求时，会首先检查认证 Cookie，如果不存在，Sanctum 将检查 `Authorization` 头中的有效 API 令牌。

> **Note**  
> 仅将 Sanctum 用于 API 令牌认证或仅用于 SPA 认证都是完全可以的。使用 Sanctum 并不意味着必须使用它提供的两项功能。

<a name="installation"></a>
## 安装

> **Note**  
> 最新版本的 Laravel 已包含 Laravel Sanctum。但如果应用的 `composer.json` 文件未包含 `laravel/sanctum`，可以按照以下安装说明进行操作。

可以通过 Composer 包管理器安装 Laravel Sanctum：

```shell
composer require laravel/sanctum
```

接下来，使用 `vendor:publish` Artisan 命令发布 Sanctum 的配置和数据库迁移文件。`sanctum` 配置文件将被放置在应用的 `config` 目录中：

```shell
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

最后，运行数据库迁移。Sanctum 将创建一个用于存储 API 令牌的数据库表：

```shell
php artisan migrate
```

接下来，如果计划使用 Sanctum 认证 SPA，应在应用 `app/Http/Kernel.php` 文件的 `api` 中间件组中添加 Sanctum 的中间件：

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

<a name="migration-customization"></a>
#### 迁移自定义

如果不打算使用 Sanctum 的默认迁移，应在 `App\Providers\AppServiceProvider` 类的 `register` 方法中调用 `Sanctum::ignoreMigrations` 方法。可以通过执行以下命令导出默认迁移：`php artisan vendor:publish --tag=sanctum-migrations`

<a name="configuration"></a>
## 配置

<a name="overriding-default-models"></a>
### 覆盖默认模型

虽然通常不需要，但可以自由扩展 Sanctum 内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法指示 Sanctum 使用自定义模型。通常，应在应用某个服务提供者的 `boot` 方法中调用此方法：

```php
use App\Models\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
}
```

<a name="api-token-authentication"></a>
## API 令牌认证

> **Note**  
> 不应使用 API 令牌来认证自己的第一方 SPA。应使用 Sanctum 内置的 [SPA 认证功能](#spa-authentication)。

<a name="issuing-api-tokens"></a>
### 发放 API 令牌

Sanctum 允许发放可用于认证应用 API 请求的 API 令牌 / 个人访问令牌。使用 API 令牌发起请求时，令牌应作为 `Bearer` 令牌包含在 `Authorization` 头中。

要开始为用户发放令牌，User 模型应使用 `Laravel\Sanctum\HasApiTokens` Trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要发放令牌，可以使用 `createToken` 方法。`createToken` 方法返回一个 `Laravel\Sanctum\NewAccessToken` 实例。API 令牌在存储到数据库之前会使用 SHA-256 哈希处理，但可以通过 `NewAccessToken` 实例的 `plainTextToken` 属性访问令牌的明文值。应在令牌创建后立即向用户显示此值：

```php
use Illuminate\Http\Request;

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});
```

可以使用 `HasApiTokens` Trait 提供的 `tokens` Eloquent 关联访问用户的所有令牌：

```php
foreach ($user->tokens as $token) {
    //
}
```

<a name="token-abilities"></a>
### 令牌能力

Sanctum 允许为令牌分配"能力"。能力的作用类似于 OAuth 的"作用域"。可以将字符串能力数组作为 `createToken` 方法的第二个参数传递：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

当处理由 Sanctum 认证的传入请求时，可以使用 `tokenCan` 方法确定令牌是否具有给定能力：

```php
if ($user->tokenCan('server:update')) {
    //
}
```

<a name="token-ability-middleware"></a>
#### 令牌能力中间件

Sanctum 还包含两个中间件，可用于验证传入请求是否使用已被授予给定能力的令牌进行认证。首先，将以下中间件添加到应用 `app/Http/Kernel.php` 文件的 `$routeMiddleware` 属性中：

```php
'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
```

可以将 `abilities` 中间件分配给路由，以验证传入请求的令牌具有所有列出的能力：

```php
Route::get('/orders', function () {
    // 令牌同时具有 "check-status" 和 "place-orders" 能力...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

可以将 `ability` 中间件分配给路由，以验证传入请求的令牌具有所列能力中的*至少一个*：

```php
Route::get('/orders', function () {
    // 令牌具有 "check-status" 或 "place-orders" 能力...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

<a name="first-party-ui-initiated-requests"></a>
#### 第一方 UI 发起的请求

为方便起见，如果传入的已认证请求来自第一方 SPA 且使用了 Sanctum 内置的 [SPA 认证](#spa-authentication)，`tokenCan` 方法将始终返回 `true`。

但这并不一定意味着应用必须允许用户执行该操作。通常，应用的[授权策略](/docs/{{version}}/authorization#creating-policies)将确定令牌是否被授予执行能力的权限，同时检查用户实例本身是否应被允许执行该操作。

例如，假设一个管理服务器的应用，这可能意味着检查令牌是否被授权更新服务器**并且**服务器属于该用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

允许 `tokenCan` 方法被调用并为第一方 UI 发起的请求始终返回 `true`，乍看可能有些奇怪；但能够始终假设 API 令牌可用且可通过 `tokenCan` 方法检查，这很方便。采用此方法后，可以在应用的授权策略中始终调用 `tokenCan` 方法，而无需担心请求是由应用 UI 触发的还是由 API 的第三方消费者发起的。

<a name="protecting-routes"></a>
### 保护路由

要保护路由使所有传入请求必须经过认证，应在 `routes/web.php` 和 `routes/api.php` 路由文件中将 `sanctum` 认证守卫附加到受保护的路由。此守卫将确保传入请求被认证为有状态的 Cookie 认证请求，或者如果请求来自第三方，则包含有效的 API 令牌头。

可能会疑惑为什么建议使用 `sanctum` 守卫认证 `routes/web.php` 文件中的路由。请记住，Sanctum 会首先尝试使用 Laravel 典型的会话认证 Cookie 认证传入请求。如果该 Cookie 不存在，Sanctum 将尝试使用请求 `Authorization` 头中的令牌认证请求。此外，使用 Sanctum 认证所有请求可确保始终能在当前已认证用户实例上调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
```

<a name="revoking-tokens"></a>
### 撤销令牌

可以通过使用 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联从数据库中删除令牌来"撤销"令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销用于认证当前请求的令牌...
$request->user()->currentAccessToken()->delete();

// 撤销特定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="token-expiration"></a>
### 令牌过期

默认情况下，Sanctum 令牌永不过期，只能通过[撤销令牌](#revoking-tokens)来使其失效。但如果希望为应用的 API 令牌配置过期时间，可以通过应用 `sanctum` 配置文件中定义的 `expiration` 配置选项来实现。此配置选项定义发放的令牌被视为过期前的分钟数：

```php
'expiration' => 525600,
```

如果为应用配置了令牌过期时间，可能还希望[安排任务](/docs/{{version}}/scheduling)来清理应用的过期令牌。幸运的是，Sanctum 包含一个 `sanctum:prune-expired` Artisan 命令可用于此目的。例如，可以配置计划任务删除所有已过期至少 24 小时的过期令牌数据库记录：

```php
$schedule->command('sanctum:prune-expired --hours=24')->daily();
```

<a name="spa-authentication"></a>
## SPA 认证

Sanctum 还提供了一种简单的方法来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与 Laravel 应用存在于同一个仓库中，也可能是完全独立的仓库。

对于此功能，Sanctum 不使用任何类型的令牌。相反，Sanctum 使用 Laravel 内置的基于 Cookie 的会话认证服务。这种认证方式提供了 CSRF 保护、会话认证的好处，同时防止通过 XSS 泄露认证凭据。

> **Warning**  
> 为了进行认证，SPA 和 API 必须共享相同的顶级域名。但它们可以位于不同的子域名。此外，应确保在请求中发送 `Accept: application/json` 头。


<a name="spa-configuration"></a>
### 配置

<a name="configuring-your-first-party-domains"></a>
#### 配置第一方域名

首先，应配置 SPA 将从哪些域名发起请求。可以在 `sanctum` 配置文件中使用 `stateful` 配置选项配置这些域名。此配置设置确定哪些域名在向 API 发起请求时将使用 Laravel 会话 Cookie 维护"有状态"认证。

> **Warning**  
> 如果通过包含端口的 URL（`127.0.0.1:8000`）访问应用，应确保在域名中包含端口号。

<a name="sanctum-middleware"></a>
#### Sanctum 中间件

接下来，应在 `app/Http/Kernel.php` 文件的 `api` 中间件组中添加 Sanctum 的中间件。此中间件负责确保来自 SPA 的传入请求可以使用 Laravel 的会话 Cookie 进行认证，同时仍允许来自第三方或移动应用的请求使用 API 令牌进行认证：

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

<a name="cors-and-cookies"></a>
#### CORS 与 Cookie

如果在从单独子域名执行的 SPA 向应用进行认证时遇到问题，很可能是 CORS（跨域资源共享）或会话 Cookie 设置配置错误。

应确保应用的 CORS 配置返回值为 `True` 的 `Access-Control-Allow-Credentials` 头。这可以通过将应用 `config/cors.php` 配置文件中的 `supports_credentials` 选项设置为 `true` 来实现。

此外，应在应用的全局 `axios` 实例上启用 `withCredentials` 选项。通常，这应在 `resources/js/bootstrap.js` 文件中完成。如果不使用 Axios 从前端发起 HTTP 请求，应在自己的 HTTP 客户端上执行等效配置：

```js
axios.defaults.withCredentials = true;
```

最后，应确保应用的会话 Cookie 域配置支持根域名的任何子域名。可以通过在应用 `config/session.php` 配置文件中的域名前添加前导 `.` 来实现：

```php
'domain' => '.domain.com',
```

<a name="spa-authenticating"></a>
### 认证

<a name="csrf-protection"></a>
#### CSRF 保护

要认证 SPA，SPA 的"登录"页面应首先向 `/sanctum/csrf-cookie` 端点发起请求，为应用初始化 CSRF 保护：

```js
axios.get('/sanctum/csrf-cookie').then(response => {
    // 登录...
});
```

在此请求期间，Laravel 将设置包含当前 CSRF 令牌的 `XSRF-TOKEN` Cookie。然后，此令牌应在后续请求的 `X-XSRF-TOKEN` 头中传递，Axios 和 Angular HttpClient 等一些 HTTP 客户端库会自动完成此操作。如果 JavaScript HTTP 库未自动设置该值，则需要手动将 `X-XSRF-TOKEN` 头设置为与此路由设置的 `XSRF-TOKEN` Cookie 值匹配。

<a name="logging-in"></a>
#### 登录

初始化 CSRF 保护后，应向 Laravel 应用的 `/login` 路由发起 `POST` 请求。此 `/login` 路由可以[手动实现](/docs/{{version}}/authentication#authenticating-users)或使用 [Laravel Fortify](/docs/{{version}}/fortify) 等无头认证包。

如果登录请求成功，将被认证，后续对应用路由的请求将通过 Laravel 应用向客户端颁发的会话 Cookie 自动认证。此外，由于应用已向 `/sanctum/csrf-cookie` 路由发起过请求，只要 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 头中发送 `XSRF-TOKEN` Cookie 的值，后续请求就会自动获得 CSRF 保护。

当然，如果用户会话因缺乏活动而过期，后续对 Laravel 应用的请求可能会收到 401 或 419 HTTP 错误响应。此时，应将用户重定向到 SPA 的登录页面。

> **Warning**  
> 可以自由编写自己的 `/login` 端点；但应确保使用 Laravel 提供的标准[基于会话的认证服务](/docs/{{version}}/authentication#authenticating-users)来认证用户。通常，这意味着使用 `web` 认证守卫。

<a name="protecting-spa-routes"></a>
### 保护路由

要保护路由使所有传入请求必须经过认证，应在 `routes/api.php` 文件中将 `sanctum` 认证守卫附加到 API 路由。此守卫将确保传入请求被认证为来自 SPA 的有状态认证请求，或者如果请求来自第三方，则包含有效的 API 令牌头：

```php
use Illuminate\Http\Request;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
```

<a name="authorizing-private-broadcast-channels"></a>
### 授权私有广播频道

如果 SPA 需要与[私有 / 在线广播频道](/docs/{{version}}/broadcasting#authorizing-channels)进行认证，应将 `Broadcast::routes` 方法调用放置在 `routes/api.php` 文件中：

```php
Broadcast::routes(['middleware' => ['auth:sanctum']]);
```

接下来，为使 Pusher 的授权请求成功，需要在初始化 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时提供自定义的 Pusher `authorizer`。这允许应用配置 Pusher 使用[已正确配置跨域请求的](#cors-and-cookies) `axios` 实例：

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

也可以使用 Sanctum 令牌来认证移动应用对 API 的请求。认证移动应用请求的过程类似于认证第三方 API 请求；但发放 API 令牌的方式略有不同。

<a name="issuing-mobile-api-tokens"></a>
### 发放 API 令牌

首先，创建一个路由，接受用户的邮箱 / 用户名、密码和设备名称，然后将这些凭据交换为新的 Sanctum 令牌。提供给此端点的"设备名称"仅供信息参考，可以是任意值。通常，设备名称值应是用户可识别的名称，例如"Nuno's iPhone 12"。

通常，将从移动应用的"登录"页面发起对此令牌端点的请求。端点将返回明文 API 令牌，然后可将其存储在移动设备上用于发起其他 API 请求：

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

当移动应用使用令牌向应用发起 API 请求时，应在 `Authorization` 头中作为 `Bearer` 令牌传递。

> **Note**  
> 为移动应用发放令牌时，也可以指定[令牌能力](#token-abilities)。

<a name="protecting-mobile-api-routes"></a>
### 保护路由

如前所述，可以通过将 `sanctum` 认证守卫附加到路由来保护路由，使所有传入请求必须经过认证：

```php
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
```

<a name="revoking-mobile-api-tokens"></a>
### 撤销令牌

要允许用户撤销发放给移动设备的 API 令牌，可以在 Web 应用 UI 的"账户设置"部分按名称列出令牌，并附带"撤销"按钮。当用户点击"撤销"按钮时，可以从数据库中删除该令牌。请记住，可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联访问用户的 API 令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销特定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

<a name="testing"></a>
## 测试

测试时，可以使用 `Sanctum::actingAs` 方法认证用户并指定应授予其令牌的能力：

```php tab=PHPUnit
use App\Models\User;
use Laravel\Sanctum\Sanctum;

public function test_task_list_can_be_retrieved()
{
    Sanctum::actingAs(
        User::factory()->create(),
        ['view-tasks']
    );

    $response = $this->get('/api/task');

    $response->assertOk();
}
```

如果希望授予令牌所有能力，应在提供给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```