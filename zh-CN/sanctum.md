# Laravel Sanctum

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用，以及简单、基于令牌的 API 提供了一套轻量级的认证系统。Sanctum 允许你应用的每个用户为其账户生成多个 API 令牌。这些令牌可以被授予"能力 / 作用域（abilities / scopes）"，用以指定令牌被允许执行哪些操作。

## 简介

[Laravel Sanctum](https://github.com/laravel/sanctum) 为 SPA（单页应用）、移动应用，以及简单、基于令牌的 API 提供了一套轻量级的认证系统。Sanctum 允许你应用的每个用户为其账户生成多个 API 令牌。这些令牌可以被授予能力 / 作用域（abilities / scopes），用以指定令牌被允许执行哪些操作。

### 工作原理

Laravel Sanctum 用于解决两个相互独立的问题。在深入了解这个库之前，我们先分别讨论一下。

#### API 令牌

首先，Sanctum 是一个简单的包，你可以用来向用户发放 API 令牌，而无需 OAuth 的复杂性。这个功能灵感来自 GitHub 以及其他发放"个人访问令牌（personal access tokens）"的应用。例如，设想你应用的"账户设置"中有一个页面，用户可以为自己的账户生成一个 API 令牌。你可以使用 Sanctum 来生成并管理那些令牌。这些令牌通常具有很长的过期时间（数年），但用户可以随时手动撤销。

Laravel Sanctum 通过将用户 API 令牌存储在单个数据库表中，并通过 `Authorization` 请求头（其中应包含有效的 API 令牌）验证传入的 HTTP 请求，来实现这一功能。

#### SPA 认证

其次，Sanctum 的存在是为了提供一种简单的方式来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库中，也可能是一个完全独立的代码仓库，例如使用 Next.js 或 Nuxt 创建的 SPA。

对于这个功能，Sanctum 不使用任何形式的令牌。相反，Sanctum 使用 Laravel 内置的基于 Cookie 的会话认证服务。通常，Sanctum 会利用 Laravel 的 `web` 认证守卫来完成这一点。这带来了 CSRF 防护、会话认证的好处，并能防止认证凭据通过 XSS 泄露。

只有当传入请求来自你自己的 SPA 前端时，Sanctum 才会尝试使用 Cookie 进行认证。当 Sanctum 检查一个传入的 HTTP 请求时，它会先检查认证 Cookie，如果没有，Sanctum 会再检查 `Authorization` 请求头中是否有有效的 API 令牌。

> [!NOTE]
> 仅将 Sanctum 用于 API 令牌认证，或仅用于 SPA 认证，都是完全没问题的。你使用 Sanctum 并不意味着必须同时使用它提供的两个功能。

## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Sanctum：

```shell
php artisan install:api
```

接下来，如果你打算使用 Sanctum 来认证一个 SPA，请参阅本文档的 SPA Authentication 部分。

## 配置

### 覆盖默认模型

尽管通常不要求，你可以自由地扩展 Sanctum 内部使用的 `PersonalAccessToken` 模型：

```php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
```

然后，你可以通过 Sanctum 提供的 `usePersonalAccessTokenModel` 方法指示 Sanctum 使用你的自定义模型。通常，你应该在应用 `AppServiceProvider` 文件的 `boot` 方法中调用该方法：

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

## API 令牌认证

> [!NOTE]
> 你不应该使用 API 令牌来认证你自己的第一方 SPA。相反，请使用 Sanctum 内置的 SPA 认证功能。

### 颁发 API 令牌

Sanctum 允许你发放 API 令牌 / 个人访问令牌，用于认证发往你应用的 API 请求。使用 API 令牌发起请求时，令牌应以 `Bearer` 令牌的形式包含在 `Authorization` 请求头中。

要开始为用户发放令牌，你的 User 模型应使用 `Laravel\Sanctum\HasApiTokens` Trait：

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

要发放令牌，你可以使用 `createToken` 方法。`createToken` 方法会返回一个 `Laravel\Sanctum\NewAccessToken` 实例。API 令牌在存入数据库之前会使用 SHA-256 哈希进行散列，但你可以通过 `NewAccessToken` 实例的 `plainTextToken` 属性访问令牌的明文值。你应该在令牌创建后立即将这个值显示给用户：

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

### 令牌权限

Sanctum 允许你为令牌分配"能力（abilities）"。能力的作用类似于 OAuth 的"作用域（scopes）"。你可以将一个字符串能力数组作为第二个参数传给 `createToken` 方法：

```php
return $user->createToken('token-name', ['server:update'])->plainTextToken;
```

在处理由 Sanctum 认证的传入请求时，你可以使用 `tokenCan` 或 `tokenCant` 方法判断令牌是否具有给定的能力：

```php
if ($user->tokenCan('server:update')) {
    // ...
}

if ($user->tokenCant('server:update')) {
    // ...
}
```

#### 令牌权限中间件

Sanctum 还包含了两个中间件，可用于验证传入请求是否使用已被授予给定能力的令牌进行了认证。要开始使用，请在应用的 `bootstrap/app.php` 文件中定义以下中间件别名：

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

`abilities` 中间件可以分配给一个路由，用于验证传入请求的令牌是否具有列出的所有能力：

```php
Route::get('/orders', function () {
    // 令牌同时具备 "check-status" 和 "place-orders" 能力...
})->middleware(['auth:sanctum', 'abilities:check-status,place-orders']);
```

`ability` 中间件可以分配给一个路由，用于验证传入请求的令牌是否具有列出的能力中的 *至少一项*：

```php
Route::get('/orders', function () {
    // 令牌具备 "check-status" 或 "place-orders" 能力...
})->middleware(['auth:sanctum', 'ability:check-status,place-orders']);
```

#### 第一方 UI 发起的请求

为方便起见，如果传入的已认证请求来自你的第一方 SPA，并且你正在使用 Sanctum 内置的 SPA 认证，那么 `tokenCan` 方法将始终返回 `true`。

不过，这并不一定意味着你的应用必须允许用户执行该操作。通常，你应用的 [授权策略](/topic/Laravel%2013.x/2wy3l43ykm.html) 将决定令牌是否已被授予执行这些能力的权限，同时还会检查用户实例本身是否应当被允许执行该操作。

例如，设想一个管理服务器的应用，这可能意味着要检查令牌是否被授权更新服务器 **并且** 该服务器属于该用户：

```php
return $request->user()->id === $server->user_id &&
       $request->user()->tokenCan('server:update')
```

一开始，允许对第一方 UI 发起的请求调用 `tokenCan` 方法并始终返回 `true`，可能看起来有些奇怪；不过，能够始终假设一个 API 令牌可用、并且可以通过 `tokenCan` 方法进行检查，是非常方便的。采用这种方式后，你就可以在应用的授权策略中始终调用 `tokenCan` 方法，而无需担心请求是来自应用的 UI，还是由 API 的某个第三方消费者发起的。

### 保护路由

要保护路由，使所有传入请求都必须经过认证，你应该在 `routes/web.php` 和 `routes/api.php` 路由文件中，将 `sanctum` 认证守卫附加到受保护的路由上。该守卫会确保传入请求要么以有状态（stateful）、基于 Cookie 认证的方式通过认证，要么（如果是来自第三方的请求）包含有效的 API 令牌请求头。

你可能会疑惑，为什么我们建议你在应用的 `routes/web.php` 文件中使用 `sanctum` 守卫来认证路由。请记住，Sanctum 会首先尝试使用 Laravel 典型的会话认证 Cookie 来认证传入请求。如果该 Cookie 不存在，Sanctum 会尝试使用请求 `Authorization` 请求头中的令牌进行认证。此外，使用 Sanctum 认证所有请求，能确保我们始终可以在当前已认证的用户实例上调用 `tokenCan` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 撤销令牌

你可以通过使用 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联，从数据库中删除令牌来"撤销"它们：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销用于认证当前请求的令牌...
$request->user()->currentAccessToken()->delete();

// 撤销特定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

### 令牌过期

默认情况下，Sanctum 令牌永不过期，只能通过在 撤销令牌 时使其失效。不过，如果你想为应用的 API 令牌配置过期时间，可以通过应用 `sanctum` 配置文件中的 `expiration` 配置选项来实现。该配置选项定义了已发放令牌被视为过期前的分钟数：

```php
'expiration' => 525600,
```

如果你想单独指定每个令牌的过期时间，可以将过期时间作为第三个参数传给 `createToken` 方法：

```php
return $user->createToken(
    'token-name', ['*'], now()->plus(weeks: 1)
)->plainTextToken;
```

如果你为应用配置了令牌过期时间，你可能还希望 [安排一个任务](/topic/Laravel%2013.x/e296olw9q7.html) 来清理应用已过期的令牌。值得庆幸的是，Sanctum 自带一个 `sanctum:prune-expired` Artisan 命令，你可以用它来完成这项工作。例如，你可以配置一个计划任务，删除所有已过期至少 24 小时的令牌数据库记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

## SPA 认证

Sanctum 的存在也是为了提供一种简单的方法来认证需要与 Laravel 驱动的 API 通信的单页应用（SPA）。这些 SPA 可能与你的 Laravel 应用位于同一个代码仓库中，也可能是一个完全独立的代码仓库。

对于这个功能，Sanctum 不使用任何形式的令牌。相反，Sanctum 使用 Laravel 内置的基于 Cookie 的会话认证服务。这种认证方式带来了 CSRF 防护、会话认证的好处，并能防止认证凭据通过 XSS 泄露。

> [!WARNING]
> 为了完成认证，你的 SPA 和 API 必须共享相同的顶级域名。不过，它们可以放置在不同的子域名上。此外，你应该确保发送 `Accept: application/json` 请求头，以及 `Referer` 或 `Origin` 请求头。

### 配置

#### 配置你的第一方域名

首先，你应该配置你的 SPA 将要从哪些域名发起请求。你可以使用 `sanctum` 配置文件中的 `stateful` 配置选项来配置这些域名。该配置决定了哪些域名在对你的 API 发起请求时，会使用 Laravel 会话 Cookie 保持"有状态（stateful）"认证。

为了帮助你设置第一方有状态域名，Sanctum 提供了两个辅助函数，你可以将它们包含在配置中。首先，`Sanctum::currentApplicationUrlWithPort()` 会从 `APP_URL` 环境变量返回当前应用 URL，而 `Sanctum::currentRequestHost()` 会向有状态域名列表中注入一个占位符，在运行时会由当前请求的主机替换，以便所有具有相同域名的请求都被视为有状态。

> [!WARNING]
> 如果你是通过包含端口的 URL（如 `127.0.0.1:8000`）访问你的应用，你应该确保域名中包含端口号。

#### Sanctum 中间件

接下来，你应该指示 Laravel，来自你 SPA 的传入请求可以使用 Laravel 的会话 Cookie 进行认证，同时仍然允许来自第三方或移动应用的请求使用 API 令牌进行认证。这可以通过在应用的 `bootstrap/app.php` 文件中调用 `statefulApi` 中间件方法轻松完成：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

#### CORS 与 Cookie

如果你在从一个独立子域名上执行的 SPA 认证你的应用时遇到了困难，很可能是你的 CORS（跨域资源共享）或会话 Cookie 设置配置有误。

`config/cors.php` 配置文件默认不会发布。如果你需要自定义 Laravel 的 CORS 选项，应该使用 `config:publish` Artisan 命令发布完整的 `cors` 配置文件：

```shell
php artisan config:publish cors
```

接下来，你应该确保应用的 CORS 配置返回值为 `True` 的 `Access-Control-Allow-Credentials` 请求头。这可以通过在应用的 `config/cors.php` 配置文件中将 `supports_credentials` 选项设置为 `true` 来实现。

此外，你应该启用应用全局 `axios` 实例上的 `withCredentials` 和 `withXSRFToken` 选项。这可以在 `resources/js/app.js` 文件中完成。如果你不是使用 Axios 从前端发起 HTTP 请求，你应该在自己的 HTTP 客户端上进行等效的配置：

```js
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
```

最后，你应该确保应用的会话 Cookie 域名配置支持根域名的任何子域名。你可以通过在应用的 `config/session.php` 配置文件中为域名添加前导 `.` 来实现：

```php
'domain' => '.domain.com',
```

### 认证

#### CSRF 保护

要认证你的 SPA，你的 SPA 的"登录"页面应首先向 `/sanctum/csrf-cookie` 端点发起请求，以为应用初始化 CSRF 防护：

```js
axios.get('/sanctum/csrf-cookie').then(response => {
    // 登录...
});
```

在此次请求期间，Laravel 会设置一个包含当前 CSRF 令牌的 `XSRF-TOKEN` Cookie。随后，该令牌应被 URL 解码，并在后续请求中通过 `X-XSRF-TOKEN` 请求头传递——一些 HTTP 客户端库（如 Axios 和 Angular HttpClient）会为你自动完成这一步。如果你的 JavaScript HTTP 库不会自动为你设置该值，你需要手动将 `X-XSRF-TOKEN` 请求头设置为与该路由设置的 `XSRF-TOKEN` Cookie 的 URL 解码值一致。

#### 登录

一旦 CSRF 防护初始化完成，你应该向你的 Laravel 应用的 `/login` 路由发起一个 `POST` 请求。这个 `/login` 路由可以 [手动实现](/topic/Laravel%2013.x/xq9zrgjvdo.html)，也可以使用无头认证包（如 [Laravel Fortify](/topic/Laravel%2013.x/x3vo0x4vm1.html)）。

如果登录请求成功，你就完成了认证，对你的应用路由的后续请求将通过 Laravel 应用发给客户端的会话 Cookie 自动完成认证。此外，由于你的应用已经向 `/sanctum/csrf-cookie` 路由发起过请求，只要你的 JavaScript HTTP 客户端在 `X-XSRF-TOKEN` 请求头中发送 `XSRF-TOKEN` Cookie 的值，后续请求就应该自动获得 CSRF 防护。

当然，如果你的用户会话因缺乏活动而过期，对 Laravel 应用的后续请求可能会收到 401 或 419 的 HTTP 错误响应。在这种情况下，你应该将用户重定向到 SPA 的登录页面。

由于这种 SPA 认证方式是基于会话的，你可以使用 Laravel 的标准认证服务，包括 ["记住我"](/topic/Laravel%2013.x/xq9zrgjvdo.html) 功能。

> [!WARNING]
> 你可以自由编写自己的 `/login` 端点；但是，你应该确保它使用标准的、 [Laravel 提供的基于会话的认证服务](/topic/Laravel%2013.x/xq9zrgjvdo.html) 来认证用户。通常，这意味着使用 `web` 认证守卫。

### 保护路由

要保护路由，使所有传入请求都必须经过认证，你应该在 `routes/api.php` 文件中将 `sanctum` 认证守卫附加到你的 API 路由上。该守卫会确保传入请求要么以来自你 SPA 的有状态认证请求的方式通过认证，要么（如果是来自第三方的请求）包含有效的 API 令牌请求头：

```php
use Illuminate\Http\Request;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 授权私有广播频道

如果你的 SPA 需要认证 [私有 / 存在性广播频道](/topic/Laravel%2013.x/enyd5w197d.html)，你应该从应用 `bootstrap/app.php` 文件包含的 `withRouting` 方法中移除 `channels` 条目。相反，你应该调用 `withBroadcasting` 方法，以便为应用的广播路由指定正确的中间件：

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

接下来，为了让 Pusher 的授权请求能够成功，你需要在初始化 [Laravel Echo](/topic/Laravel%2013.x/enyd5w197d.html) 时提供一个自定义的 Pusher `authorizer`。这让你的应用可以将 Pusher 配置为使用 为跨域请求正确配置的 `axios` 实例：

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

## 移动应用认证

你也可以使用 Sanctum 令牌来认证移动应用向你的 API 发起的请求。认证移动应用请求的过程与认证第三方 API 请求类似；但是，在如何发放 API 令牌方面存在一些细微差别。

### 颁发 API 令牌

要开始，创建一个接受用户邮箱 / 用户名、密码和设备名称的路由，然后将这些凭据交换为一个新的 Sanctum 令牌。提供给该端点的"设备名称"仅用于信息标识，可以是你希望的任何值。通常，设备名称应该是用户能识别的名称，例如 "Nuno's iPhone 17"。

通常，你会从移动应用的"登录"界面发起对该令牌端点的请求。该端点会返回明文 API 令牌，它随后可以被存储在移动设备上，并用于发起额外的 API 请求：

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

当移动应用使用该令牌向你的应用发起 API 请求时，它应该在 `Authorization` 请求头中以 `Bearer` 令牌的形式传递该令牌。

> [!NOTE]
> 为移动应用发放令牌时，你同样可以自由指定 令牌能力。

### 保护路由

如上文所述，你可以通过将 `sanctum` 认证守卫附加到路由上，来保护路由，使所有传入请求都必须经过认证：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

### 撤销令牌

为了允许用户撤销发放给移动设备的 API 令牌，你可以在 Web 应用 UI 的"账户设置"部分按名称列出它们，并附上一个"撤销"按钮。当用户点击"撤销"按钮时，你可以从数据库中删除该令牌。请记住，你可以通过 `Laravel\Sanctum\HasApiTokens` Trait 提供的 `tokens` 关联来访问用户的 API 令牌：

```php
// 撤销所有令牌...
$user->tokens()->delete();

// 撤销特定令牌...
$user->tokens()->where('id', $tokenId)->delete();
```

## 测试

在测试时，可以使用 `Sanctum::actingAs` 方法来认证一个用户，并指定应授予其令牌哪些能力：

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

如果你想授予令牌所有能力，应该在传给 `actingAs` 方法的能力列表中包含 `*`：

```php
Sanctum::actingAs(
    User::factory()->create(),
    ['*']
);
```