# Laravel Passport

## 简介

[Laravel Passport](https://github.com/laravel/passport) 可以在几分钟内为你的 Laravel 应用提供一个完整的 OAuth2 服务端实现。Passport 构建在 [League OAuth2 server](https://github.com/thephpleague/oauth2-server) 之上，后者由 Andy Millington 和 Simon Hamp 维护。

> [!NOTE]
> 本文档默认你已经熟悉 OAuth2。如果你对 OAuth2 一无所知，建议先了解 OAuth2 的一般[术语](https://oauth2.thephpleague.com/terminology/)和特性，再继续阅读。

### Passport 还是 Sanctum？

在开始之前，你可能希望先判断应用更适合使用 Laravel Passport 还是 [Laravel Sanctum](/docs/{{version}}/sanctum)。如果应用确实需要支持 OAuth2，那么应该使用 Laravel Passport。

不过，如果你要对单页应用、移动应用进行身份验证，或者签发 API 令牌，那么应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。Laravel Sanctum 不支持 OAuth2，但它提供了一种更简单的 API 身份验证开发体验。

## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

该命令会发布并运行所需的数据库迁移，以创建应用存储 OAuth2 客户端和访问令牌所需的表。该命令还会创建生成安全访问令牌所需的加密密钥。

运行 `install:api` 命令后，将 `Laravel\Passport\HasApiTokens` Trait 和 `Laravel\Passport\Contracts\OAuthenticatable` 接口添加到 `App\Models\User` 模型中。这个 Trait 会为模型提供一些辅助方法，用于检查已认证用户的令牌和作用域：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

最后，在应用的 `config/auth.php` 配置文件中，定义一个 `api` 身份认证 guard，并将 `driver` 选项设置为 `passport`。这会指示应用在认证传入的 API 请求时使用 Passport 的 `TokenGuard`：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```

### 部署 Passport

第一次将 Passport 部署到应用服务器时，很可能需要运行 `passport:keys` 命令。该命令会生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不纳入版本控制：

```shell
php artisan passport:keys
```

如有必要，你可以定义 Passport 密钥的加载路径。可以使用 `Passport::loadKeysFrom` 方法来实现。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
}
```

#### 从环境变量加载密钥

或者，你也可以使用 `vendor:publish` Artisan 命令发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

发布配置文件后，可以通过将应用的加密密钥定义为环境变量来加载它们：

```ini
PASSPORT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<private key here>
-----END RSA PRIVATE KEY-----"

PASSPORT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<public key here>
-----END PUBLIC KEY-----"
```

### 升级 Passport

升级到 Passport 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)。

## 配置

### 令牌生命周期

默认情况下，Passport 签发的是长期有效的访问令牌，一年后过期。如果需要配置更长或更短的令牌生命周期，可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 和 `personalAccessTokensExpireIn` 方法。这些方法应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Carbon\CarbonInterval;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensExpireIn(CarbonInterval::days(15));
    Passport::refreshTokensExpireIn(CarbonInterval::days(30));
    Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
}
```

> [!WARNING]
> Passport 数据库表中的 `expires_at` 列是只读的，仅用于显示。签发令牌时，Passport 将过期信息存储在已签名和加密的令牌内。如果需要使令牌失效，应[撤销它](#revoking-tokens)。

### 覆盖默认模型

你可以通过定义自己的模型并继承相应的 Passport 模型，自由扩展 Passport 内部使用的模型：

```php
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    // ...
}
```

定义好模型后，可以通过 `Laravel\Passport\Passport` 类指示 Passport 使用自定义模型。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Passport 自定义模型：

```php
use App\Models\Passport\AuthCode;
use App\Models\Passport\Client;
use App\Models\Passport\DeviceCode;
use App\Models\Passport\RefreshToken;
use App\Models\Passport\Token;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::useTokenModel(Token::class);
    Passport::useRefreshTokenModel(RefreshToken::class);
    Passport::useAuthCodeModel(AuthCode::class);
    Passport::useClientModel(Client::class);
    Passport::useDeviceCodeModel(DeviceCode::class);
}
```

### 覆盖路由

有时你可能希望自定义 Passport 定义的路由。为此，首先需要通过在应用的 `AppServiceProvider` 的 `register` 方法中添加 `Passport::ignoreRoutes` 来忽略 Passport 注册的路由：

```php
use Laravel\Passport\Passport;

/**
 * Register any application services.
 */
public function register(): void
{
    Passport::ignoreRoutes();
}
```

然后，你可以将 Passport 在[其路由文件](https://github.com/laravel/passport/blob/master/routes/web.php)中定义的路由复制到应用的 `routes/web.php` 文件中，并按需修改：

```php
Route::group([
    'as' => 'passport.',
    'prefix' => config('passport.path', 'oauth'),
    'namespace' => '\Laravel\Passport\Http\Controllers',
], function () {
    // Passport routes...
});
```

## 授权码模式

通过授权码使用 OAuth2 是大多数开发者熟悉 OAuth2 的方式。使用授权码时，客户端应用会将用户重定向到你的服务器，用户将在那里批准或拒绝向客户端签发访问令牌的请求。

首先，我们需要指示 Passport 如何返回我们的「授权」视图。

可以使用 `Laravel\Passport\Passport` 类提供的相应方法自定义所有授权视图的渲染逻辑。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    // 通过提供视图名称...
    Passport::authorizationView('auth.oauth.authorize');

    // 通过提供闭包...
    Passport::authorizationView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Authorize', [
            'request' => $parameters['request'],
            'authToken' => $parameters['authToken'],
            'client' => $parameters['client'],
            'user' => $parameters['user'],
            'scopes' => $parameters['scopes'],
        ])
    );
}
```

Passport 会自动定义返回该视图的 `/oauth/authorize` 路由。`auth.oauth.authorize` 模板应包含一个表单，该表单向 `passport.authorizations.approve` 路由发起 POST 请求以批准授权，以及一个向 `passport.authorizations.deny` 路由发起 DELETE 请求以拒绝授权。`passport.authorizations.approve` 和 `passport.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

### 管理客户端

需要与应用 API 交互的开发者需要通过创建一个「客户端」来向你的应用注册他们的应用。通常，这包括提供其应用名称以及一个 URI——在用户批准授权请求后，你的应用可以通过该 URI 进行重定向。

#### 第一方客户端

创建客户端最简单的方式是使用 `passport:client` Artisan 命令。该命令可用于创建第一方客户端或测试你的 OAuth2 功能。运行 `passport:client` 命令时，Passport 会提示你输入有关客户端的更多信息，并向提供客户端 ID 和密钥：

```shell
php artisan passport:client
```

如果要为客户端允许多个重定向 URI，可以在 `passport:client` 命令提示输入 URI 时使用逗号分隔的列表来指定。包含逗号的任何 URI 都应进行 URI 编码：

```shell
https://third-party-app.com/callback,https://example.com/oauth/redirect
```

#### 第三方客户端

由于应用的用户无法使用 `passport:client` 命令，因此可以使用 `Laravel\Passport\ClientRepository` 类的 `createAuthorizationCodeGrantClient` 方法为指定用户注册一个客户端：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

// 创建一个属于指定用户的 OAuth 应用客户端...
$client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
    user: $user,
    name: 'Example App',
    redirectUris: ['https://third-party-app.com/callback'],
    confidential: false,
    enableDeviceFlow: true
);

// 检索属于该用户的所有 OAuth 应用客户端...
$clients = $user->oauthApps()->get();
```

`createAuthorizationCodeGrantClient` 方法返回 `Laravel\Passport\Client` 的实例。可以将 `$client->id` 显示为客户端 ID，将 `$client->plainSecret` 显示为客户端密钥给用户。

### 请求令牌

#### 重定向以进行授权

创建客户端后，开发者可以使用其客户端 ID 和密钥从你的应用请求授权码和访问令牌。首先，调用方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
        'state' => $state,
        // 'prompt' => '', // "none"、"consent" 或 "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

`prompt` 参数可用于指定 Passport 应用的身份认证行为。

如果 `prompt` 值为 `none`，当用户尚未通过 Passport 应用进行身份认证时，Passport 将始终抛出身份认证错误。如果值为 `consent`，Passport 将始终显示授权批准界面，即使所有作用域之前已授予调用方应用。当值为 `login` 时，Passport 应用将始终提示用户重新登录应用，即使他们已经拥有现有会话。

如果未提供 `prompt` 值，则只有在用户之前未授权调用方应用访问所请求作用域时，系统才会提示用户进行授权。

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义，无需手动定义此路由。

#### 批准请求

收到授权请求时，Passport 将根据 `prompt` 参数的值（如果存在）自动响应，并可能向用户显示一个模板，允许他们批准或拒绝授权请求。如果用户批准该请求，他们将被重定向回到调用方应用指定的 `redirect_uri`。`redirect_uri` 必须与创建客户端时指定的 `redirect` URL 相匹配。

有时你可能希望跳过授权提示，例如在授权第一方客户端时。可以通过[扩展 `Client` 模型](#overriding-default-models)并定义一个 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，则客户端将被批准，并且用户将立即被重定向回到 `redirect_uri`，除非调用方应用在重定向以进行授权时明确设置了 `prompt` 参数：

```php
<?php

namespace App\Models\Passport;

use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Passport\Client as BaseClient;

class Client extends BaseClient
{
    /**
     * Determine if the client should skip the authorization prompt.
     *
     * @param  \Laravel\Passport\Scope[]  $scopes
     */
    public function skipsAuthorization(Authenticatable $user, array $scopes): bool
    {
        return $this->firstParty();
    }
}
```

#### 将授权码转换为访问令牌

如果用户批准授权请求，他们将被重定向回到调用方应用。调用方应首先根据重定向前存储的值验证 `state` 参数。如果 state 参数匹配，则调用方应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包括你的应用在用户批准授权请求时签发的授权码：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class,
        'Invalid state value.'
    );

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'your-client-id',
        'client_secret' => 'your-client-secret',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'code' => $request->code,
    ]);

    return $response->json();
});
```

该 `/oauth/token` 路由将返回一个 JSON 响应，包含 `access_token`、`refresh_token` 和 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的秒数。

> [!NOTE]
> 与 `/oauth/authorize` 路由一样，`/oauth/token` 路由由 Passport 为你定义，无需手动定义此路由。

### 管理令牌

可以使用 `Laravel\Passport\HasApiTokens` Trait 的 `tokens` 方法检索用户授权的令牌。例如，这可以用于向用户提供一个仪表板，以跟踪他们与第三方应用的连接：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// 检索该用户的所有有效令牌...
$tokens = $user->tokens()
    ->where('revoked', false)
    ->where('expires_at', '>', Date::now())
    ->get();

// 检索用户与第三方 OAuth 应用客户端的所有连接...
$connections = $tokens->load('client')
    ->reject(fn (Token $token) => $token->client->firstParty())
    ->groupBy('client_id')
    ->map(fn (Collection $tokens) => [
        'client' => $tokens->first()->client,
        'scopes' => $tokens->pluck('scopes')->flatten()->unique()->values()->all(),
        'tokens_count' => $tokens->count(),
    ])
    ->values();
```

### 刷新令牌

如果应用签发的是短期访问令牌，则用户需要通过签发访问令牌时提供的刷新令牌来刷新他们的访问令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'refresh_token',
    'refresh_token' => 'the-refresh-token',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要...
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

该 `/oauth/token` 路由将返回一个 JSON 响应，包含 `access_token`、`refresh_token` 和 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的秒数。

### 撤销令牌

可以使用 `Laravel\Passport\Token` 模型上的 `revoke` 方法撤销令牌。可以使用 `Laravel\Passport\RefreshToken` 模型上的 `revoke` 方法撤销令牌的刷新令牌：

```php
use Laravel\Passport\Passport;
use Laravel\Passport\Token;

$token = Passport::token()->find($tokenId);

// 撤销访问令牌...
$token->revoke();

// 撤销令牌的刷新令牌...
$token->refreshToken?->revoke();

// 撤销该用户的所有令牌...
User::find($userId)->tokens()->each(function (Token $token) {
    $token->revoke();
    $token->refreshToken?->revoke();
});
```

### 清理令牌

当令牌被撤销或过期时，你可能希望将其从数据库中清除。Passport 自带的 `passport:purge` Artisan 命令可以为你完成此操作：

```shell
# 清理已撤销和过期的令牌、授权码和设备码...
php artisan passport:purge

# 仅清理过期超过 6 小时的令牌...
php artisan passport:purge --hours=6

# 仅清理已撤销的令牌、授权码和设备码...
php artisan passport:purge --revoked

# 仅清理过期的令牌、授权码和设备码...
php artisan passport:purge --expired
```

你也可以在应用的 `routes/console.php` 文件中配置一个[定时任务](/docs/{{version}}/scheduling)，按计划自动清理令牌：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('passport:purge')->hourly();
```

## 带 PKCE 的授权码模式

带「Proof Key for Code Exchange」（PKCE）的授权码模式是一种安全地对单页应用或移动应用进行身份认证以访问你的 API 的方式。当无法保证客户端密钥被安全存储时，或者为了减轻授权码被攻击者截获的威胁时，应使用此模式。「code verifier」和「code challenge」的组合在将授权码交换为访问令牌时取代了客户端密钥。

### 创建客户端

在应用能够通过带 PKCE 的授权码模式签发令牌之前，需要创建一个启用了 PKCE 的客户端。可以使用带有 `--public` 选项的 `passport:client` Artisan 命令来完成此操作：

```shell
php artisan passport:client --public
```

### 请求令牌

#### Code Verifier 和 Code Challenge

由于此授权模式不提供客户端密钥，开发者需要生成 code verifier 和 code challenge 的组合以请求令牌。

code verifier 应为 43 到 128 个字符之间的随机字符串，包含字母、数字以及 `"-"`、`"."`、`"_"`、`"~"` 字符，如 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636)中所定义。

code challenge 应为 URL 与文件名安全字符的 Base64 编码字符串。结尾的 `'='` 字符应被移除，且不应包含换行符、空格或其他额外字符。

```php
$encoded = base64_encode(hash('sha256', $codeVerifier, true));

$codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');
```

#### 重定向以进行授权

创建客户端后，你可以使用客户端 ID 以及生成的 code verifier 和 code challenge 从应用请求授权码和访问令牌。首先，调用方应用应向应用的 `/oauth/authorize` 路由发起重定向请求：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $request->session()->put(
        'code_verifier', $codeVerifier = Str::random(128)
    );

    $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $codeVerifier, true))
    , '='), '+/', '-_');

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
        // 'prompt' => '', // "none"、"consent" 或 "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

#### 将授权码转换为访问令牌

如果用户批准授权请求，他们将被重定向回到调用方应用。调用方应根据重定向前存储的值验证 `state` 参数，与标准授权码模式相同。

如果 state 参数匹配，调用方应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包括用户批准授权请求时你的应用签发的授权码以及最初生成的 code verifier：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    $codeVerifier = $request->session()->pull('code_verifier');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class
    );

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'code_verifier' => $codeVerifier,
        'code' => $request->code,
    ]);

    return $response->json();
});
```

## 设备授权模式

OAuth2 设备授权模式允许无浏览器或输入受限的设备（如电视和游戏机）通过交换「device code」来获得访问令牌。使用设备流时，设备客户端会指示用户使用辅助设备（如计算机或智能手机）连接到服务器，在那里输入提供的「user code」，并批准或拒绝访问请求。

首先，我们需要指示 Passport 如何返回我们的「user code」和「authorization」视图。

可以使用 `Laravel\Passport\Passport` 类提供的相应方法自定义所有授权视图的渲染逻辑。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法。

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    // 通过提供视图名称...
    Passport::deviceUserCodeView('auth.oauth.device.user-code');
    Passport::deviceAuthorizationView('auth.oauth.device.authorize');

    // 通过提供闭包...
    Passport::deviceUserCodeView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Device/UserCode')
    );

    Passport::deviceAuthorizationView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Device/Authorize', [
            'request' => $parameters['request'],
            'authToken' => $parameters['authToken'],
            'client' => $parameters['client'],
            'user' => $parameters['user'],
            'scopes' => $parameters['scopes'],
        ])
    );

    // ...
}
```

Passport 会自动定义返回这些视图的路由。`auth.oauth.device.user-code` 模板应包含一个表单，该表单向 `passport.device.authorizations.authorize` 路由发起 GET 请求。`passport.device.authorizations.authorize` 路由需要 `user_code` 查询参数。

`auth.oauth.device.authorize` 模板应包含一个表单，该表单向 `passport.device.authorizations.approve` 路由发起 POST 请求以批准授权，以及一个向 `passport.device.authorizations.deny` 路由发起 DELETE 请求以拒绝授权。`passport.device.authorizations.approve` 和 `passport.device.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

### 创建设备授权模式客户端

在应用能够通过设备授权模式签发令牌之前，需要创建一个启用了设备流的客户端。可以使用带有 `--device` 选项的 `passport:client` Artisan 命令来完成此操作。该命令将创建一个启用了第一方设备流的客户端，并向提供客户端 ID 和密钥：

```shell
php artisan passport:client --device
```

此外，还可以使用 `ClientRepository` 类上的 `createDeviceAuthorizationGrantClient` 方法为属于指定用户的第三方客户端进行注册：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

$client = app(ClientRepository::class)->createDeviceAuthorizationGrantClient(
    user: $user,
    name: 'Example Device',
    confidential: false,
);
```

### 请求令牌

#### 请求 Device Code

创建客户端后，开发者可以使用其客户端 ID 从你的应用请求 device code。首先，调用方设备应向你的应用的 `/oauth/device/code` 路由发起 `POST` 请求以请求 device code：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/device/code', [
    'client_id' => 'your-client-id',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

这将返回一个 JSON 响应，包含 `device_code`、`user_code`、`verification_uri`、`interval` 和 `expires_in` 属性。`expires_in` 属性包含 device code 过期前的秒数。`interval` 属性包含调用方设备在轮询 `/oauth/token` 路由以避免频率限制错误时，每次请求之间应等待的秒数。

> [!NOTE]
> 请记住，`/oauth/device/code` 路由已由 Passport 定义，无需手动定义此路由。

#### 显示验证 URI 和 User Code

获得 device code 请求后，调用方设备应指示用户使用另一台设备访问所提供的 `verification_uri`，并输入 `user_code` 以批准授权请求。

#### 轮询令牌请求

由于用户将使用单独的设备授予（或拒绝）访问，调用方设备应轮询你的应用的 `/oauth/token` 路由，以确定用户何时响应该请求。调用方设备应使用请求 device code 时 JSON 响应中提供的最小轮询 `interval`，以避免频率限制错误：

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

$interval = 5;

do {
    Sleep::for($interval)->seconds();

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:device_code',
        'client_id' => 'your-client-id',
        'client_secret' => 'your-client-secret', // 仅机密客户端需要...
        'device_code' => 'the-device-code',
    ]);

    if ($response->json('error') === 'slow_down') {
        $interval += 5;
    }
} while (in_array($response->json('error'), ['authorization_pending', 'slow_down']));

return $response->json();
```

如果用户批准授权请求，这将返回一个 JSON 响应，包含 `access_token`、`refresh_token` 和 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的秒数。

## 密码模式

> [!WARNING]
> 我们不再推荐使用密码模式令牌。相反，应选择 [OAuth2 Server 当前推荐的一种模式](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码模式允许其他第一方客户端（如移动应用）使用电子邮箱地址/用户名和密码获得访问令牌。这使你能够安全地向第一方客户端签发访问令牌，而无需用户经历整个 OAuth2 授权码重定向流程。

要启用密码模式，请在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enablePasswordGrant` 方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

### 创建密码模式客户端

在应用能够通过密码模式签发令牌之前，需要创建一个密码模式客户端。可以使用带有 `--password` 选项的 `passport:client` Artisan 命令来完成此操作。

```shell
php artisan passport:client --password
```

### 请求令牌

启用该模式并创建密码模式客户端后，可以通过向 `/oauth/token` 路由发起 `POST` 请求，并附带用户的电子邮箱地址和密码来请求访问令牌。请记住，此路由已由 Passport 注册，无需手动定义。如果请求成功，你将在服务器返回的 JSON 响应中收到 `access_token` 和 `refresh_token`：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要...
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

> [!NOTE]
> 请记住，默认情况下访问令牌是长期有效的。不过，你可以根据需要[配置最长访问令牌生命周期](#configuration)。

### 请求所有作用域

使用密码模式或客户端凭据模式时，你可能希望为令牌授权应用支持的所有作用域。可以通过请求 `*` 作用域来实现。如果请求 `*` 作用域，令牌实例上的 `can` 方法将始终返回 `true`。此作用域只能分配给使用 `password` 或 `client_credentials` 模式签发的令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要...
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => '*',
]);
```

### 自定义用户提供者

如果应用使用了多个[身份认证用户提供者](/docs/{{version}}/authentication#introduction)，则可以通过在通过 `artisan passport:client --password` 命令创建客户端时提供 `--provider` 选项，来指定密码模式客户端所使用的用户提供者。给定的提供者名称应与应用 `config/auth.php` 配置文件中定义的有效提供者匹配。然后可以[使用中间件保护路由](#multiple-authentication-guards)，以确保只有 guard 指定提供者的用户被授权。

### 自定义用户名字段

使用密码模式进行身份认证时，Passport 将使用可认证模型的 `email` 属性作为「用户名」。但是，你可以通过在模型上定义 `findForPassport` 方法来自定义此行为：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Bridge\Client;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Find the user instance for the given username.
     */
    public function findForPassport(string $username, Client $client): User
    {
        return $this->where('username', $username)->first();
    }
}
```

### 自定义密码验证

使用密码模式进行身份认证时，Passport 将使用模型的 `password` 属性验证给定密码。如果模型没有 `password` 属性，或者你希望自定义密码验证逻辑，可以在模型上定义 `validateForPassportPasswordGrant` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Validate the password of the user for the Passport password grant.
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
```

## 隐式模式

> [!WARNING]
> 我们不再推荐使用隐式模式令牌。相反，应选择 [OAuth2 Server 当前推荐的一种模式](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式模式与授权码模式类似；但是，无需交换授权码即可将令牌返回给客户端。此模式最常用于无法安全存储客户端凭据的 JavaScript 或移动应用。要启用此模式，请在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::enableImplicitGrant();
}
```

在应用能够通过隐式模式签发令牌之前，需要创建一个隐式模式客户端。可以使用带有 `--implicit` 选项的 `passport:client` Artisan 命令来完成此操作。

```shell
php artisan passport:client --implicit
```

启用该模式并创建隐式客户端后，开发者可以使用其客户端 ID 从你的应用请求访问令牌。调用方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

```php
use Illuminate\Http\Request;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'token',
        'scope' => 'user:read orders:create',
        'state' => $state,
        // 'prompt' => '', // "none"、"consent" 或 "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义，无需手动定义此路由。

## 客户端凭据模式

客户端凭据模式适用于机器对机器的身份认证。例如，可以在定时任务中使用此模式来执行通过 API 的维护任务。

在应用能够通过客户端凭据模式签发令牌之前，需要创建一个客户端凭据模式客户端。可以使用 `passport:client` Artisan 命令的 `--client` 选项来完成此操作：

```shell
php artisan passport:client --client
```

接下来，将 `Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件分配给一个路由：

```php
use Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner;

Route::get('/orders', function (Request $request) {
    // 访问令牌有效且客户端是资源所有者...
})->middleware(EnsureClientIsResourceOwner::class);
```

若要将路由的访问限制为特定作用域，可以将所需作用域列表提供给 `using` 方法：

```php
Route::get('/orders', function (Request $request) {
    // 访问令牌有效，客户端是资源所有者，并具有 "servers:read" 和 "servers:create" 作用域...
})->middleware(EnsureClientIsResourceOwner::using('servers:read', 'servers:create'));
```

> [!WARNING]
> [底层的 OAuth2 server](https://oauth2.thephpleague.com/database-setup/#:~:text=Please%20note%20that,the%20bearer%20token.) 将客户端凭据令牌的 `sub` 声明设置为客户端的标识符。默认情况下，Passport 对客户端使用 UUID，因此这不会与用户的整数主键冲突。但是，如果将 `Passport::$clientUuids` 设置为 `false`，客户端凭据令牌可能错误地解析 ID 与客户端 ID 匹配的用户。在这种情况下，使用此中间件无法保证传入令牌是客户端凭据令牌。

### 检索令牌

要使用此模式类型检索令牌，请向 `oauth/token` 端点发起请求：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'client_credentials',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret',
    'scope' => 'servers:read servers:create',
]);

return $response->json()['access_token'];
```

## 个人访问令牌

有时，你的用户可能希望自行签发访问令牌，而不经过典型的授权码重定向流程。通过应用 UI 允许用户自行签发令牌对于让用户试验你的 API 非常有用，或者可以作为签发访问令牌的一种更简单的方式。

> [!NOTE]
> 如果应用主要使用 Passport 签发个人访问令牌，请考虑使用 [Laravel Sanctum](/docs/{{version}}/sanctum)，它是 Laravel 用于签发 API 访问令牌的轻量级第一方库。

### 创建个人访问客户端

在应用能够签发个人访问令牌之前，需要创建一个个人访问客户端。可以通过执行带有 `--personal` 选项的 `passport:client` Artisan 命令来完成此操作。如果已经运行了 `passport:install` 命令，则无需运行此命令：

```shell
php artisan passport:client --personal
```

### 自定义用户提供者

如果应用使用了多个[身份认证用户提供者](/docs/{{version}}/authentication#introduction)，则可以通过在通过 `artisan passport:client --personal` 命令创建客户端时提供 `--provider` 选项，来指定个人访问模式客户端所使用的用户提供者。给定的提供者名称应与应用 `config/auth.php` 配置文件中定义的有效提供者匹配。然后可以[使用中间件保护路由](#multiple-authentication-guards)，以确保只有 guard 指定提供者的用户被授权。

### 管理个人访问令牌

创建个人访问客户端后，可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为指定用户签发令牌。`createToken` 方法接受令牌名称作为第一个参数，可选的[作用域](#token-scopes)数组作为第二个参数：

```php
use App\Models\User;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// 创建不带作用域的令牌...
$token = $user->createToken('My Token')->accessToken;

// 创建带作用域的令牌...
$token = $user->createToken('My Token', ['user:read', 'orders:create'])->accessToken;

// 创建带所有作用域的令牌...
$token = $user->createToken('My Token', ['*'])->accessToken;

// 检索属于该用户的所有有效个人访问令牌...
$tokens = $user->tokens()
    ->with('client')
    ->where('revoked', false)
    ->where('expires_at', '>', Date::now())
    ->get()
    ->filter(fn (Token $token) => $token->client->hasGrantType('personal_access'));
```

## 保护路由

### 通过中间件

Passport 包含一个[身份认证 guard](/docs/{{version}}/authentication#adding-custom-guards)，它会验证传入请求上的访问令牌。将 `api` guard 配置为使用 `passport` driver 后，只需在需要有效访问令牌的路由上指定 `auth:api` 中间件：

```php
Route::get('/user', function () {
    // 只有通过 API 认证的用户才能访问此路由...
})->middleware('auth:api');
```

> [!WARNING]
> 如果你使用的是[客户端凭据模式](#client-credentials-grant)，则应使用 [`Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件](#client-credentials-grant)来保护路由，而不是 `auth:api` 中间件。

#### 多个身份认证 Guard

如果应用对不同类型的用户进行身份认证（这些用户可能使用完全不同的 Eloquent 模型），那么可能需要为应用中的每个用户提供者类型定义 guard 配置。这允许你保护面向特定用户提供者的请求。例如，给定以下 guard 配置 `config/auth.php` 配置文件：

```php
'guards' => [
    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],

    'api-customers' => [
        'driver' => 'passport',
        'provider' => 'customers',
    ],
],
```

下面的路由将使用 `api-customers` guard（该 guard 使用 `customers` 用户提供者）来验证传入请求：

```php
Route::get('/customer', function () {
    // ...
})->middleware('auth:api-customers');
```

> [!NOTE]
> 有关在 Passport 中使用多个用户提供者的更多信息，请参阅[个人访问令牌文档](#customizing-the-user-provider-for-pat)和[密码模式文档](#customizing-the-user-provider)。

### 传递访问令牌

调用受 Passport 保护的路由时，应用的 API 消费者应在其请求的 `Authorization` 头部中将访问令牌指定为 `Bearer` 令牌。例如，使用 `Http` Facade 时：

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'Accept' => 'application/json',
    'Authorization' => "Bearer $accessToken",
])->get('https://passport-app.test/api/user');

return $response->json();
```

## 令牌作用域

作用域允许 API 客户端在请求访问账户的授权时，请求一组特定的权限。例如，如果你正在构建一个电子商务应用，并非所有 API 消费者都需要下单的能力。相反，你可以仅允许消费者请求访问订单发货状态的授权。换句话说，作用域允许应用的用户限制第三方应用可代表他们执行的操作。

### 定义作用域

可以使用应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中的 `Passport::tokensCan` 方法来定义 API 的作用域。`tokensCan` 方法接受作用域名称和作用域描述数组。作用域描述可以是任何你希望的内容，并将显示给授权批准界面上的用户：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensCan([
        'user:read' => 'Retrieve the user info',
        'orders:create' => 'Place orders',
        'orders:read:status' => 'Check order status',
    ]);
}
```

### 默认作用域

如果客户端未请求任何特定作用域，可以使用 `defaultScopes` 方法配置 Passport 服务器，将默认作用域附加到令牌。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Passport\Passport;

Passport::tokensCan([
    'user:read' => 'Retrieve the user info',
    'orders:create' => 'Place orders',
    'orders:read:status' => 'Check order status',
]);

Passport::defaultScopes([
    'user:read',
    'orders:create',
]);
```

### 为令牌分配作用域

#### 请求授权码时

使用授权码模式请求访问令牌时，消费者应将其所需的作用域指定为 `scope` 查询字符串参数。`scope` 参数应是空格分隔的作用域列表：

```php
Route::get('/redirect', function () {
    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

#### 签发个人访问令牌时

如果使用 `App\Models\User` 模型的 `createToken` 方法签发个人访问令牌，则可以将所需作用域的数组作为第二个参数传递给该方法：

```php
$token = $user->createToken('My Token', ['orders:create'])->accessToken;
```

### 检查作用域

Passport 包含两个中间件，可用于验证传入请求是否已使用授予了给定作用域的令牌进行身份认证。

#### 检查所有作用域

可以将 `Laravel\Passport\Http\Middleware\CheckToken` 中间件分配给路由，以验证传入请求的访问令牌是否具有所有列出的作用域：

```php
use Laravel\Passport\Http\Middleware\CheckToken;

Route::get('/orders', function () {
    // 访问令牌同时具有 "orders:read" 和 "orders:create" 作用域...
})->middleware(['auth:api', CheckToken::using('orders:read', 'orders:create')]);
```

#### 检查任意作用域

可以将 `Laravel\Passport\Http\Middleware\CheckTokenForAnyScope` 中间件分配给路由，以验证传入请求的访问令牌是否至少具有所列出的作用域之一：

```php
use Laravel\Passport\Http\Middleware\CheckTokenForAnyScope;

Route::get('/orders', function () {
    // 访问令牌具有 "orders:read" 或 "orders:create" 作用域...
})->middleware(['auth:api', CheckTokenForAnyScope::using('orders:read', 'orders:create')]);
```

#### 作用域属性

如果应用使用了[控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，则可以使用 `Laravel\Passport\Attributes\AuthorizeToken` 属性作为 Passport 作用域中间件的便捷简写：

```php
<?php

namespace App\Http\Controllers;

use Laravel\Passport\Attributes\AuthorizeToken;

#[AuthorizeToken('orders:read')]
#[AuthorizeToken('orders:create', only: ['store'])]
class OrderController
{
    #[AuthorizeToken(['orders:read', 'orders:create'], anyScope: true)]
    public function index()
    {
        // 访问令牌具有 "orders:read" 或 "orders:create" 作用域...
    }

    public function store()
    {
        // 访问令牌同时具有 "orders:read" 和 "orders:create" 作用域...
    }
}
```

默认情况下，`AuthorizeToken` 属性要求具备所有给定的作用域。如果传入 `anyScope: true`，则当令牌至少具有给定作用域之一时，请求即被授权。

#### 在令牌实例上检查作用域

一旦访问令牌认证的请求进入应用，你仍然可以使用已认证的 `App\Models\User` 实例上的 `tokenCan` 方法来检查令牌是否具有给定作用域：

```php
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    if ($request->user()->tokenCan('orders:create')) {
        // ...
    }
});
```

#### 其他作用域方法

`scopeIds` 方法将返回所有已定义 ID/名称的数组：

```php
use Laravel\Passport\Passport;

Passport::scopeIds();
```

`scopes` 方法将返回所有已定义作用域的数组（作为 `Laravel\Passport\Scope` 的实例）：

```php
Passport::scopes();
```

`scopesFor` 方法将返回与给定 ID/名称匹配的 `Laravel\Passport\Scope` 实例数组：

```php
Passport::scopesFor(['user:read', 'orders:create']);
```

可以使用 `hasScope` 方法判断给定作用域是否已定义：

```php
Passport::hasScope('orders:create');
```

## SPA 身份认证

构建 API 时，能够从 JavaScript 应用中消费自己的 API 是非常有用的。这种 API 开发方式允许你自己的应用消费与你与世界共享的同一个 API。同一 API 可被你的 Web 应用、移动应用、第三方应用以及你可能在各种包管理器上发布的任何 SDK 所消费。

通常，如果想从 JavaScript 应用消费 API，需要手动将访问令牌发送给应用，并在每次请求时将其一起传递给你的应用。不过，Passport 包含一个可以为你处理此问题的中间件。只需将 `CreateFreshApiToken` 中间件附加到应用的 `bootstrap/app.php` 文件中的 `web` 中间件组：

```php
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        CreateFreshApiToken::class,
    ]);
})
```

> [!WARNING]
> 应确保 `CreateFreshApiToken` 中间件是中间件栈中列出的最后一个中间件。

该中间件会将 `laravel_token` cookie 附加到传出的响应上。该 cookie 包含一个加密的 JWT，Passport 将使用它来对来自 JavaScript 应用的 API 请求进行身份认证。JWT 的生命周期等于 `session.lifetime` 配置值。现在，由于浏览器将在所有后续请求中自动发送 cookie，因此你可以向应用的 API 发起请求，而无需显式传递访问令牌：

```js
axios.get('/api/user')
    .then(response => {
        console.log(response.data);
    });
```

#### 自定义 Cookie 名称

如果需要，可以使用 `Passport::cookie` 方法自定义 `laravel_token` cookie 的名称。通常，应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::cookie('custom_name');
}
```

#### CSRF 保护

使用此身份认证方法时，需要确保请求中包含有效的 CSRF 令牌头部。随骨架应用和所有 starter kit 一起提供的默认 Laravel JavaScript 脚手架包含一个 [Axios](https://github.com/axios/axios) 实例，该实例将自动使用加密的 `XSRF-TOKEN` cookie 值在同源请求上发送 `X-XSRF-TOKEN` 头部。

> [!NOTE]
> 如果选择发送 `X-CSRF-TOKEN` 头部而不是 `X-XSRF-TOKEN`，则需要使用 `csrf_token()` 提供的未加密令牌。

## 事件

Passport 在签发访问令牌和刷新令牌时会触发事件。你可以[监听这些事件](/docs/{{version}}/events)以清理或撤销数据库中的其他访问令牌：

| Event Name                                    |
| --------------------------------------------- |
| `Laravel\Passport\Events\AccessTokenCreated`  |
| `Laravel\Passport\Events\AccessTokenRevoked`  |
| `Laravel\Passport\Events\RefreshTokenCreated` |

## 测试

Passport 的 `actingAs` 方法可用于指定当前已认证的用户及其作用域。传递给 `actingAs` 方法的第一个参数是用户实例，第二个参数是应授予用户令牌的作用域数组：

```php tab=Pest
use App\Models\User;
use Laravel\Passport\Passport;

test('orders can be created', function () {
    Passport::actingAs(
        User::factory()->create(),
        ['orders:create']
    );

    $response = $this->post('/api/orders');

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
use App\Models\User;
use Laravel\Passport\Passport;

public function test_orders_can_be_created(): void
{
    Passport::actingAs(
        User::factory()->create(),
        ['orders:create']
    );

    $response = $this->post('/api/orders');

    $response->assertStatus(201);
}
```

Passport 的 `actingAsClient` 方法可用于指定当前已认证的客户端及其作用域。传递给 `actingAsClient` 方法的第一个参数是客户端实例，第二个参数是应授予客户端令牌的作用域数组：

```php tab=Pest
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

test('servers can be retrieved', function () {
    Passport::actingAsClient(
        Client::factory()->create(),
        ['servers:read']
    );

    $response = $this->get('/api/servers');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

public function test_servers_can_be_retrieved(): void
{
    Passport::actingAsClient(
        Client::factory()->create(),
        ['servers:read']
    );

    $response = $this->get('/api/servers');

    $response->assertStatus(200);
}
```