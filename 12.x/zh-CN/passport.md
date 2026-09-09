# Laravel Passport

- [简介](#introduction)
    - [选 Passport 还是 Sanctum？](#passport-or-sanctum)
- [安装](#installation)
    - [部署 Passport](#deploying-passport)
    - [升级 Passport](#upgrading-passport)
- [配置](#configuration)
    - [令牌有效期](#token-lifetimes)
    - [覆盖默认模型](#overriding-default-models)
    - [覆盖路由](#overriding-routes)
- [授权码模式](#authorization-code-grant)
    - [管理客户端](#managing-clients)
    - [请求令牌](#requesting-tokens)
    - [管理令牌](#managing-tokens)
    - [刷新令牌](#refreshing-tokens)
    - [吊销令牌](#revoking-tokens)
    - [清除令牌](#purging-tokens)
- [带 PKCE 的授权码模式](#code-grant-pkce)
    - [创建客户端](#creating-a-auth-pkce-grant-client)
    - [请求令牌](#requesting-auth-pkce-grant-tokens)
- [设备授权模式](#device-authorization-grant)
    - [创建设备授权客户端](#creating-a-device-authorization-grant-client)
    - [请求令牌](#requesting-device-authorization-grant-tokens)
- [密码模式](#password-grant)
    - [创建密码模式客户端](#creating-a-password-grant-client)
    - [请求令牌](#requesting-password-grant-tokens)
    - [请求所有作用域](#requesting-all-scopes)
    - [自定义用户提供者](#customizing-the-user-provider)
    - [自定义用户名字段](#customizing-the-username-field)
    - [自定义密码验证](#customizing-the-password-validation)
- [隐式模式](#implicit-grant)
- [客户端凭证模式](#client-credentials-grant)
- [个人访问令牌](#personal-access-tokens)
    - [创建个人访问客户端](#creating-a-personal-access-client)
    - [自定义用户提供者](#customizing-the-user-provider-for-pat)
    - [管理个人访问令牌](#managing-personal-access-tokens)
- [保护路由](#protecting-routes)
    - [通过中间件](#via-middleware)
    - [传递访问令牌](#passing-the-access-token)
- [令牌作用域](#token-scopes)
    - [定义作用域](#defining-scopes)
    - [默认作用域](#default-scope)
    - [为令牌分配作用域](#assigning-scopes-to-tokens)
    - [检查作用域](#checking-scopes)
- [SPA 身份认证](#spa-authentication)
- [事件](#events)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Passport](https://github.com/laravel/passport) 只需几分钟就能为你的 Laravel 应用程序提供完整的 OAuth2 服务器实现。Passport 基于由 Andy Millington 和 Simon Hamp 维护的 [League OAuth2 服务器](https://github.com/thephpleague/oauth2-server) 构建。

> [!NOTE]
> 本文档假设你已经熟悉 OAuth2。如果你对 OAuth2 一无所知，建议先熟悉 OAuth2 的基本[术语](https://oauth2.thephpleague.com/terminology/)和特性，再继续阅读。

<a name="passport-or-sanctum"></a>
### 选 Passport 还是 Sanctum？

在开始之前，你可能想确定你的应用程序更适合使用 Laravel Passport 还是 [Laravel Sanctum](/docs/{{version}}/sanctum)。如果你的应用程序确实需要支持 OAuth2，就应该使用 Laravel Passport。

不过，如果你要为单页应用、移动应用进行身份认证，或签发 API 令牌，就应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。Laravel Sanctum 不支持 OAuth2，但它提供了简单得多的 API 身份认证开发体验。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

该命令会发布并运行数据库迁移，创建应用程序存储 OAuth2 客户端和访问令牌所需的表。该命令还会创建生成安全访问令牌所需的加密密钥。

运行 `install:api` 命令后，将 `Laravel\Passport\HasApiTokens` Trait 和 `Laravel\Passport\Contracts\OAuthenticatable` 接口添加到你的 `App\Models\User` 模型中。该 Trait 会为你的模型提供一些辅助方法，用于检查已认证用户的令牌和作用域：

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

最后，在应用程序的 `config/auth.php` 配置文件中定义一个 `api` 认证守卫（guard），并将 `driver` 选项设置为 `passport`。这会指示应用程序在认证传入的 API 请求时使用 Passport 的 `TokenGuard`：

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

<a name="deploying-passport"></a>
### 部署 Passport

首次将 Passport 部署到应用程序的服务器时，你可能需要运行 `passport:keys` 命令。该命令会生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不会纳入版本控制：

```shell
php artisan passport:keys
```

如有必要，你可以定义 Passport 密钥的加载路径。可以使用 `Passport::loadKeysFrom` 方法来实现。通常，该方法应在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
}
```

<a name="loading-keys-from-the-environment"></a>
#### 从环境变量中加载密钥

或者，你也可以使用 `vendor:publish` Artisan 命令发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

配置文件发布后，你可以将应用程序的加密密钥定义为环境变量来加载它们：

```ini
PASSPORT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<private key here>
-----END RSA PRIVATE KEY-----"

PASSPORT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<public key here>
-----END PUBLIC KEY-----"
```

<a name="upgrading-passport"></a>
### 升级 Passport

升级到 Passport 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

<a name="token-lifetimes"></a>
### 令牌有效期

默认情况下，Passport 签发的访问令牌有效期较长，一年后过期。如果你想配置更长或更短的令牌有效期，可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 和 `personalAccessTokensExpireIn` 方法。这些方法应在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Carbon\CarbonInterval;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Passport::tokensExpireIn(CarbonInterval::days(15));
    Passport::refreshTokensExpireIn(CarbonInterval::days(30));
    Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
}
```

> [!WARNING]
> Passport 数据库表中的 `expires_at` 列是只读的，仅用于展示。签发令牌时，Passport 会将过期信息存储在已签名并加密的令牌内部。如果需要使某个令牌失效，你应该[吊销它](#revoking-tokens)。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以随意扩展 Passport 内部使用的模型：定义自己的模型并继承对应的 Passport 模型即可：

```php
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    // ...
}
```

定义好模型后，你可以通过 `Laravel\Passport\Passport` 类指示 Passport 使用你的自定义模型。通常，你应在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Passport 你的自定义模型：

```php
use App\Models\Passport\AuthCode;
use App\Models\Passport\Client;
use App\Models\Passport\DeviceCode;
use App\Models\Passport\RefreshToken;
use App\Models\Passport\Token;
use Laravel\Passport\Passport;

/**
 * 引导任何应用程序服务。
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

<a name="overriding-routes"></a>
### 覆盖路由

有时你可能希望自定义 Passport 定义的路由。为此，首先需要在应用程序 `AppServiceProvider` 的 `register` 方法中添加 `Passport::ignoreRoutes`，以忽略 Passport 注册的路由：

```php
use Laravel\Passport\Passport;

/**
 * 注册任何应用程序服务。
 */
public function register(): void
{
    Passport::ignoreRoutes();
}
```

然后，你可以将 Passport 在[其路由文件](https://github.com/laravel/passport/blob/master/routes/web.php)中定义的路由复制到应用程序的 `routes/web.php` 文件中，并按需修改：

```php
Route::group([
    'as' => 'passport.',
    'prefix' => config('passport.path', 'oauth'),
    'namespace' => '\Laravel\Passport\Http\Controllers',
], function () {
    // Passport 路由...
});
```

<a name="authorization-code-grant"></a>
## 授权码模式

通过授权码使用 OAuth2 是大多数开发者所熟悉的 OAuth2 使用方式。使用授权码时，客户端应用程序会将用户重定向到你的服务器，用户在那里批准或拒绝向客户端签发访问令牌的请求。

首先，我们需要告诉 Passport 如何返回「授权」视图。

授权视图的全部渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应当在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用这些方法：

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * 引导任何应用程序服务。
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

Passport 会自动定义返回该视图的 `/oauth/authorize` 路由。你的 `auth.oauth.authorize` 模板应包含一个向 `passport.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.authorizations.approve` 和 `passport.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

<a name="managing-clients"></a>
### 管理客户端

构建需要与你的应用程序 API 交互的应用的开发者，需要通过创建「客户端」将其应用注册到你的应用中。通常，这一过程包括提供其应用的名称，以及一个在你的应用程序中用户批准授权请求后可以重定向到的 URI。

<a name="managing-first-party-clients"></a>
#### 第一方客户端

创建客户端最简单的方式是使用 `passport:client` Artisan 命令。该命令可用于创建第一方客户端或测试你的 OAuth2 功能。运行 `passport:client` 命令时，Passport 会提示你提供客户端的更多信息，并为你生成客户端 ID 和密钥：

```shell
php artisan passport:client
```

如果你想为客户端指定多个重定向 URI，可以在 `passport:client` 命令提示输入 URI 时，使用逗号分隔的列表来指定。任何包含逗号的 URI 都应进行 URI 编码：

```shell
https://third-party-app.com/callback,https://example.com/oauth/redirect
```

<a name="managing-third-party-clients"></a>
#### 第三方客户端

由于你的应用程序用户无法使用 `passport:client` 命令，你可以使用 `Laravel\Passport\ClientRepository` 类的 `createAuthorizationCodeGrantClient` 方法为给定用户注册客户端：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

// 创建一个属于给定用户的 OAuth 应用客户端...
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

`createAuthorizationCodeGrantClient` 方法返回一个 `Laravel\Passport\Client` 实例。你可以将 `$client->id` 作为客户端 ID、`$client->plainSecret` 作为客户端密钥展示给用户。

<a name="requesting-tokens"></a>
### 请求令牌

<a name="requesting-tokens-redirecting-for-authorization"></a>
#### 重定向以获取授权

客户端创建完成后，开发者就可以使用其客户端 ID 和密钥向你的应用程序请求授权码和访问令牌。首先，消费方应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求，如下所示：

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

`prompt` 参数可用于指定 Passport 应用程序的认证行为。

如果 `prompt` 值为 `none`，那么当用户尚未通过 Passport 应用程序的认证时，Passport 将始终抛出认证错误。如果值为 `consent`，Passport 将始终显示授权批准界面，即使此前已将所有作用域授予消费方应用程序。当值为 `login` 时，Passport 应用程序将始终提示用户重新登录应用程序，即使用户已有现成的会话。

如果未提供 `prompt` 值，则只有在用户此前未针对所请求的作用域授权过该消费方应用程序时，才会提示用户进行授权。

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义好，你无需手动定义该路由。

<a name="approving-the-request"></a>
#### 批准请求

收到授权请求时，Passport 会根据 `prompt` 参数的值（如果存在）自动作出响应，并可能向用户显示一个模板，让用户批准或拒绝该授权请求。如果用户批准请求，将被重定向回消费方应用程序指定的 `redirect_uri`。`redirect_uri` 必须与创建客户端时指定的 `redirect` URL 一致。

有时你可能希望跳过授权提示，例如在为第一方客户端授权时。你可以通过[扩展 `Client` 模型](#overriding-default-models)并定义 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，客户端将直接获得批准，用户也会立即被重定向回 `redirect_uri`，除非消费方应用程序在重定向以获取授权时显式设置了 `prompt` 参数：

```php
<?php

namespace App\Models\Passport;

use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Passport\Client as BaseClient;

class Client extends BaseClient
{
    /**
     * 判断该客户端是否应跳过授权提示。
     *
     * @param  \Laravel\Passport\Scope[]  $scopes
     */
    public function skipsAuthorization(Authenticatable $user, array $scopes): bool
    {
        return $this->firstParty();
    }
}
```

<a name="requesting-tokens-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码换取访问令牌

如果用户批准了授权请求，将被重定向回消费方应用程序。消费方应首先将 `state` 参数与重定向之前存储的值进行比对验证。如果 state 参数匹配，消费方就应向你的应用程序发起 `POST` 请求来获取访问令牌。该请求应包含用户批准授权请求时你的应用程序签发的授权码：

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

这个 `/oauth/token` 路由会返回一个包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前剩余的秒数。

> [!NOTE]
> 与 `/oauth/authorize` 路由一样，`/oauth/token` 路由也已由 Passport 为你定义好，无需手动定义该路由。

<a name="managing-tokens"></a>
### 管理令牌

你可以使用 `Laravel\Passport\HasApiTokens` Trait 的 `tokens` 方法来检索用户已授权的令牌。例如，可以用它为用户提供一个仪表盘，供其管理与第三方应用程序的连接：

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

// 检索该用户与第三方 OAuth 应用客户端的所有连接...
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

<a name="refreshing-tokens"></a>
### 刷新令牌

如果你的应用程序签发的是短有效期的访问令牌，用户就需要通过签发访问令牌时获得的刷新令牌来刷新其访问令牌：

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

这个 `/oauth/token` 路由会返回一个包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前剩余的秒数。

<a name="revoking-tokens"></a>
### 吊销令牌

你可以使用 `Laravel\Passport\Token` 模型上的 `revoke` 方法来吊销令牌。可以使用 `Laravel\Passport\RefreshToken` 模型上的 `revoke` 方法来吊销令牌的刷新令牌：

```php
use Laravel\Passport\Passport;
use Laravel\Passport\Token;

$token = Passport::token()->find($tokenId);

// 吊销一个访问令牌...
$token->revoke();

// 吊销该令牌的刷新令牌...
$token->refreshToken?->revoke();

// 吊销用户的所有令牌...
User::find($userId)->tokens()->each(function (Token $token) {
    $token->revoke();
    $token->refreshToken?->revoke();
});
```

<a name="purging-tokens"></a>
### 清除令牌

当令牌被吊销或过期后，你可能想把它们从数据库中清除。Passport 自带的 `passport:purge` Artisan 命令可以帮你完成这项工作：

```shell
# 清除已吊销和已过期的令牌、授权码和设备码...
php artisan passport:purge

# 仅清除过期超过 6 小时的令牌...
php artisan passport:purge --hours=6

# 仅清除已吊销的令牌、授权码和设备码...
php artisan passport:purge --revoked

# 仅清除已过期的令牌、授权码和设备码...
php artisan passport:purge --expired
```

你也可以在应用程序的 `routes/console.php` 文件中配置[计划任务](/docs/{{version}}/scheduling)，按计划自动清理令牌：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('passport:purge')->hourly();
```

<a name="code-grant-pkce"></a>
## 带 PKCE 的授权码模式

带「代码交换证明密钥」（PKCE）的授权码模式，是一种对单页应用或移动应用进行身份认证以访问你的 API 的安全方式。当你无法保证客户端密钥得到机密存储，或者想要降低授权码被攻击者截获的风险时，应使用这种模式。在用授权码换取访问令牌时，由「代码验证器」（code verifier）和「代码质询」（code challenge）的组合来替代客户端密钥。

<a name="creating-a-auth-pkce-grant-client"></a>
### 创建客户端

在你的应用程序可以通过带 PKCE 的授权码模式签发令牌之前，你需要创建一个支持 PKCE 的客户端。可以使用带 `--public` 选项的 `passport:client` Artisan 命令来完成：

```shell
php artisan passport:client --public
```

<a name="requesting-auth-pkce-grant-tokens"></a>
### 请求令牌

<a name="code-verifier-code-challenge"></a>
#### 代码验证器与代码质询

由于这种授权模式不提供客户端密钥，开发者需要生成一对代码验证器和代码质询来请求令牌。

代码验证器应是一个 43 到 128 个字符的随机字符串，包含字母、数字以及 `"-"`、`"."`、`"_"`、`"~"` 字符，具体定义见 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636)。

代码质询应是一个使用 URL 和文件名安全字符的 Base64 编码字符串。应移除末尾的 `'='` 字符，且不得包含换行符、空白符或其他额外字符。

```php
$encoded = base64_encode(hash('sha256', $codeVerifier, true));

$codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');
```

<a name="code-grant-pkce-redirecting-for-authorization"></a>
#### 重定向以获取授权

客户端创建完成后，你可以使用客户端 ID 以及生成的代码验证器和代码质询，向你的应用程序请求授权码和访问令牌。首先，消费方应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求：

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

<a name="code-grant-pkce-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码换取访问令牌

如果用户批准了授权请求，将被重定向回消费方应用程序。与标准授权码模式一样，消费方应将 `state` 参数与重定向之前存储的值进行比对验证。

如果 state 参数匹配，消费方就应向你的应用程序发起 `POST` 请求来获取访问令牌。该请求应包含用户批准授权请求时你的应用程序签发的授权码，以及最初生成的代码验证器：

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

<a name="device-authorization-grant"></a>
## 设备授权模式

OAuth2 设备授权模式允许没有浏览器或输入能力受限的设备（如电视和游戏主机）通过交换「设备码」来获取访问令牌。使用设备流时，设备客户端会指示用户使用另一台设备（如电脑或智能手机）连接到你的服务器，在那里输入提供的「用户码」，并批准或拒绝访问请求。

首先，我们需要告诉 Passport 如何返回我们的「用户码」和「授权」视图。

授权视图的全部渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应当在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用这些方法。

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * 引导任何应用程序服务。
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

Passport 会自动定义返回这些视图的路由。你的 `auth.oauth.device.user-code` 模板应包含一个向 `passport.device.authorizations.authorize` 路由发起 GET 请求的表单。`passport.device.authorizations.authorize` 路由需要 `user_code` 查询参数。

你的 `auth.oauth.device.authorize` 模板应包含一个向 `passport.device.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.device.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.device.authorizations.approve` 和 `passport.device.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

<a name="creating-a-device-authorization-grant-client"></a>
### 创建设备授权客户端

在你的应用程序可以通过设备授权模式签发令牌之前，你需要创建一个支持设备流的客户端。可以使用带 `--device` 选项的 `passport:client` Artisan 命令来完成。该命令会创建一个支持设备流的第一方客户端，并为你提供客户端 ID 和密钥：

```shell
php artisan passport:client --device
```

此外，你也可以使用 `ClientRepository` 类上的 `createDeviceAuthorizationGrantClient` 方法，注册一个属于给定用户的第三方客户端：

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

<a name="requesting-device-authorization-grant-tokens"></a>
### 请求令牌

<a name="device-code"></a>
#### 请求设备码

客户端创建完成后，开发者就可以使用其客户端 ID 向你的应用程序请求设备码。首先，消费方设备应向你的应用程序的 `/oauth/device/code` 路由发起 `POST` 请求来请求设备码：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/device/code', [
    'client_id' => 'your-client-id',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

这将返回一个包含 `device_code`、`user_code`、`verification_uri`、`interval` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含设备码过期前剩余的秒数。`interval` 属性包含消费方设备在轮询 `/oauth/token` 路由时，两次请求之间应等待的秒数，以避免触发频率限制错误。

> [!NOTE]
> 请记住，`/oauth/device/code` 路由已由 Passport 定义好，你无需手动定义该路由。

<a name="user-code"></a>
#### 显示验证 URI 和用户码

获得设备码请求后，消费方设备应指示用户使用另一台设备访问提供的 `verification_uri`，并输入 `user_code` 来批准授权请求。

<a name="polling-token-request"></a>
#### 轮询令牌请求

由于用户将使用另一台单独的设备来授予（或拒绝）访问权限，消费方设备应轮询你的应用程序的 `/oauth/token` 路由，以确定用户何时响应了请求。消费方设备在请求设备码时，应使用 JSON 响应中提供的最小轮询 `interval`，以避免触发频率限制错误：

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

如果用户批准了授权请求，这将返回一个包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前剩余的秒数。

<a name="password-grant"></a>
## 密码模式

> [!WARNING]
> 我们不再推荐使用密码模式令牌。你应该选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码模式允许你的其他第一方客户端（例如移动应用）使用电子邮件地址/用户名和密码来获取访问令牌。这样，你就可以安全地向第一方客户端签发访问令牌，而无需让用户走完整个 OAuth2 授权码重定向流程。

要启用密码模式，请在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enablePasswordGrant` 方法：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

<a name="creating-a-password-grant-client"></a>
### 创建密码模式客户端

在你的应用程序可以通过密码模式签发令牌之前，你需要创建一个密码模式客户端。可以使用带 `--password` 选项的 `passport:client` Artisan 命令来完成。

```shell
php artisan passport:client --password
```

<a name="requesting-password-grant-tokens"></a>
### 请求令牌

启用该模式并创建密码模式客户端后，你就可以使用用户的电子邮件地址和密码向 `/oauth/token` 路由发起 `POST` 请求来获取访问令牌。请记住，该路由已由 Passport 注册，无需手动定义。如果请求成功，你将在服务器返回的 JSON 响应中收到 `access_token` 和 `refresh_token`：

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
> 请记住，访问令牌默认是长效的。不过，如有需要，你可以随意[配置访问令牌的最大有效期](#configuration)。

<a name="requesting-all-scopes"></a>
### 请求所有作用域

在使用密码模式或客户端凭证模式时，你可能希望为令牌授权应用程序支持的所有作用域。这可以通过请求 `*` 作用域来实现。如果请求 `*` 作用域，令牌实例上的 `can` 方法将始终返回 `true`。该作用域只能分配给使用 `password` 或 `client_credentials` 模式签发的令牌：

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

<a name="customizing-the-user-provider"></a>
### 自定义用户提供者

如果你的应用程序使用了多个[认证用户提供者](/docs/{{version}}/authentication#introduction)，你可以在通过 `artisan passport:client --password` 命令创建客户端时提供 `--provider` 选项，来指定密码模式客户端使用的用户提供者。给定的提供者名称应与应用程序 `config/auth.php` 配置文件中定义的有效提供者相匹配。随后，你可以[使用中间件保护路由](#multiple-authentication-guards)，确保只有来自守卫指定提供者的用户才能通过授权。

<a name="customizing-the-username-field"></a>
### 自定义用户名字段

使用密码模式进行认证时，Passport 会使用你的可认证模型上的 `email` 属性作为「用户名」。不过，你可以通过在模型上定义 `findForPassport` 方法来自定义这一行为：

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
     * 根据给定用户名查找用户实例。
     */
    public function findForPassport(string $username, Client $client): User
    {
        return $this->where('username', $username)->first();
    }
}
```

<a name="customizing-the-password-validation"></a>
### 自定义密码验证

使用密码模式进行认证时，Passport 会使用模型上的 `password` 属性来验证给定的密码。如果你的模型没有 `password` 属性，或者你想自定义密码验证逻辑，可以在模型上定义 `validateForPassportPasswordGrant` 方法：

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
     * 为 Passport 密码模式验证用户密码。
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
```

<a name="implicit-grant"></a>
## 隐式模式

> [!WARNING]
> 我们不再推荐使用隐式模式令牌。你应该选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式模式与授权码模式类似；不同的是，令牌会直接返回给客户端，无需交换授权码。这种模式最常用于无法安全存储客户端凭证的 JavaScript 或移动应用。要启用该模式，请在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Passport::enableImplicitGrant();
}
```

在你的应用程序可以通过隐式模式签发令牌之前，你需要创建一个隐式模式客户端。可以使用带 `--implicit` 选项的 `passport:client` Artisan 命令来完成。

```shell
php artisan passport:client --implicit
```

启用该模式并创建隐式客户端后，开发者就可以使用其客户端 ID 向你的应用程序请求访问令牌。消费方应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求，如下所示：

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
> 请记住，`/oauth/authorize` 路由已由 Passport 定义好，你无需手动定义该路由。

<a name="client-credentials-grant"></a>
## 客户端凭证模式

客户端凭证模式适用于机器对机器的身份认证。例如，你可以在执行 API 维护任务的计划任务中使用这种模式。

在你的应用程序可以通过客户端凭证模式签发令牌之前，你需要创建一个客户端凭证模式客户端。可以使用 `passport:client` Artisan 命令的 `--client` 选项来完成：

```shell
php artisan passport:client --client
```

接着，将 `Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件分配给某个路由：

```php
use Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner;

Route::get('/orders', function (Request $request) {
    // 访问令牌有效，且客户端即资源所有者...
})->middleware(EnsureClientIsResourceOwner::class);
```

要将路由的访问限制为特定作用域，你可以向 `using` 方法提供所需作用域的列表：

```php
Route::get('/orders', function (Request $request) {
    // 访问令牌有效，客户端即资源所有者，且同时具有 "servers:read" 和 "servers:create" 作用域...
})->middleware(EnsureClientIsResourceOwner::using('servers:read', 'servers:create'));
```

> [!WARNING]
> [底层 OAuth2 服务器](https://oauth2.thephpleague.com/database-setup/#:~:text=Please%20note%20that,the%20bearer%20token.)会将客户端凭证令牌的 `sub` 声明设置为客户端的标识符。默认情况下，Passport 为客户端使用 UUID，因此不会与用户的整型主键冲突。但是，如果你将 `Passport::$clientUuids` 设置为 `false`，客户端凭证令牌可能会意外解析出 ID 与客户端 ID 相同的用户。在这种情况下，使用该中间件无法保证传入的令牌是客户端凭证令牌。

<a name="retrieving-tokens"></a>
### 检索令牌

要使用这种授权类型检索令牌，请向 `oauth/token` 端点发起请求：

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

<a name="personal-access-tokens"></a>
## 个人访问令牌

有时，你的用户可能希望在不经过典型授权码重定向流程的情况下，直接向自己签发访问令牌。允许用户通过你的应用程序 UI 向自己签发令牌，一方面方便用户试验你的 API，另一方面也可以作为一种更简单的访问令牌签发方式。

> [!NOTE]
> 如果你的应用程序使用 Passport 主要是为了签发个人访问令牌，可以考虑使用 [Laravel Sanctum](/docs/{{version}}/sanctum)，它是 Laravel 官方提供的轻量级第一方 API 访问令牌签发库。

<a name="creating-a-personal-access-client"></a>
### 创建个人访问客户端

在你的应用程序可以签发个人访问令牌之前，你需要创建一个个人访问客户端。可以通过执行带 `--personal` 选项的 `passport:client` Artisan 命令来完成。如果你已经运行过 `passport:install` 命令，则无需再运行该命令：

```shell
php artisan passport:client --personal
```

<a name="customizing-the-user-provider-for-pat"></a>
### 自定义用户提供者

如果你的应用程序使用了多个[认证用户提供者](/docs/{{version}}/authentication#introduction)，你可以在通过 `artisan passport:client --personal` 命令创建客户端时提供 `--provider` 选项，来指定个人访问授权客户端使用的用户提供者。给定的提供者名称应与应用程序 `config/auth.php` 配置文件中定义的有效提供者相匹配。随后，你可以[使用中间件保护路由](#multiple-authentication-guards)，确保只有来自守卫指定提供者的用户才能通过授权。

<a name="managing-personal-access-tokens"></a>
### 管理个人访问令牌

创建个人访问客户端后，你就可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为给定用户签发令牌。`createToken` 方法接受令牌名称作为第一个参数，以及一个可选的[作用域](#token-scopes)数组作为第二个参数：

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

<a name="protecting-routes"></a>
## 保护路由

<a name="via-middleware"></a>
### 通过中间件

Passport 包含一个[认证守卫](/docs/{{version}}/authentication#adding-custom-guards)，用于验证传入请求上的访问令牌。将 `api` 守卫配置为使用 `passport` 驱动后，你只需在任何需要有效访问令牌的路由上指定 `auth:api` 中间件即可：

```php
Route::get('/user', function () {
    // 只有通过 API 认证的用户才能访问此路由...
})->middleware('auth:api');
```

> [!WARNING]
> 如果你正在使用[客户端凭证模式](#client-credentials-grant)，应使用 [`Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件](#client-credentials-grant)而非 `auth:api` 中间件来保护你的路由。

<a name="multiple-authentication-guards"></a>
#### 多个认证守卫

如果你的应用程序对不同类型的用户进行认证，而这些用户可能使用完全不同的 Eloquent 模型，那么你可能需要为应用程序中的每种用户提供者类型定义一个守卫配置。这样，你就可以保护面向特定用户提供者的请求。例如，假设 `config/auth.php` 配置文件中有如下守卫配置：

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

以下路由将使用 `api-customers` 守卫（该守卫使用 `customers` 用户提供者）来认证传入请求：

```php
Route::get('/customer', function () {
    // ...
})->middleware('auth:api-customers');
```

> [!NOTE]
> 要了解在 Passport 中使用多个用户提供者的更多信息，请查阅[个人访问令牌文档](#customizing-the-user-provider-for-pat)和[密码模式文档](#customizing-the-user-provider)。

<a name="passing-the-access-token"></a>
### 传递访问令牌

调用受 Passport 保护的路由时，你的应用程序的 API 消费方应在其请求的 `Authorization` 头中，将访问令牌指定为 `Bearer` 令牌。例如，使用 `Http` Facade 时：

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'Accept' => 'application/json',
    'Authorization' => "Bearer $accessToken",
])->get('https://passport-app.test/api/user');

return $response->json();
```

<a name="token-scopes"></a>
## 令牌作用域

作用域允许你的 API 客户端在请求访问账户的授权时，请求一组特定的权限。例如，如果你在构建一个电商应用，并非所有 API 消费方都需要下单的能力。此时，你可以让消费方仅请求访问订单发货状态的授权。换言之，作用域允许你的应用程序用户限制第三方应用可以代表他们执行的操作。

<a name="defining-scopes"></a>
### 定义作用域

你可以在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Passport::tokensCan` 方法定义 API 的作用域。`tokensCan` 方法接受一个由作用域名称和作用域描述组成的数组。作用域描述可以是任何你想要的内容，它将显示在授权批准界面上，供用户查看：

```php
/**
 * 引导任何应用程序服务。
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

<a name="default-scope"></a>
### 默认作用域

如果客户端没有请求任何特定作用域，你可以使用 `defaultScopes` 方法将 Passport 服务器配置为将默认作用域附加到令牌上。通常，该方法应在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

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

<a name="assigning-scopes-to-tokens"></a>
### 为令牌分配作用域

<a name="when-requesting-authorization-codes"></a>
#### 请求授权码时

使用授权码模式请求访问令牌时，消费方应将其期望的作用域指定为 `scope` 查询字符串参数。`scope` 参数应是一个以空格分隔的作用域列表：

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

<a name="when-issuing-personal-access-tokens"></a>
#### 签发个人访问令牌时

如果你使用 `App\Models\User` 模型的 `createToken` 方法签发个人访问令牌，可以将期望的作用域数组作为该方法的第二个参数传入：

```php
$token = $user->createToken('My Token', ['orders:create'])->accessToken;
```

<a name="checking-scopes"></a>
### 检查作用域

Passport 包含两个中间件，可用于验证传入请求所使用的令牌是否已被授予给定作用域。

<a name="check-for-all-scopes"></a>
#### 检查全部作用域

`Laravel\Passport\Http\Middleware\CheckToken` 中间件可以分配给路由，用于验证传入请求的访问令牌具有所有列出的作用域：

```php
use Laravel\Passport\Http\Middleware\CheckToken;

Route::get('/orders', function () {
    // 访问令牌同时具有 "orders:read" 和 "orders:create" 作用域...
})->middleware(['auth:api', CheckToken::using('orders:read', 'orders:create')]);
```

<a name="check-for-any-scopes"></a>
#### 检查任一作用域

`Laravel\Passport\Http\Middleware\CheckTokenForAnyScope` 中间件可以分配给路由，用于验证传入请求的访问令牌具有所列作用域中的*至少一个*：

```php
use Laravel\Passport\Http\Middleware\CheckTokenForAnyScope;

Route::get('/orders', function () {
    // 访问令牌具有 "orders:read" 或 "orders:create" 中的任一作用域...
})->middleware(['auth:api', CheckTokenForAnyScope::using('orders:read', 'orders:create')]);
```

<a name="checking-scopes-on-a-token-instance"></a>
#### 在令牌实例上检查作用域

当使用访问令牌认证的请求进入你的应用程序后，你仍可以在已认证的 `App\Models\User` 实例上使用 `tokenCan` 方法来检查令牌是否具有给定作用域：

```php
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    if ($request->user()->tokenCan('orders:create')) {
        // ...
    }
});
```

<a name="additional-scope-methods"></a>
#### 其他作用域方法

`scopeIds` 方法将返回所有已定义 ID / 名称的数组：

```php
use Laravel\Passport\Passport;

Passport::scopeIds();
```

`scopes` 方法将返回所有已定义作用域的 `Laravel\Passport\Scope` 实例数组：

```php
Passport::scopes();
```

`scopesFor` 方法将返回与给定 ID / 名称匹配的 `Laravel\Passport\Scope` 实例数组：

```php
Passport::scopesFor(['user:read', 'orders:create']);
```

你可以使用 `hasScope` 方法判断给定作用域是否已定义：

```php
Passport::hasScope('orders:create');
```

<a name="spa-authentication"></a>
## SPA 身份认证

在构建 API 时，能够让 JavaScript 应用消费你自己的 API 往往非常有用。这种 API 开发方式让你的应用消费与外界共享的同一套 API。同一套 API 可以服务于你的 Web 应用、移动应用、第三方应用，以及你发布到各个包管理器上的任何 SDK。

通常，如果你想从 JavaScript 应用中消费你的 API，就需要手动向该应用发送一个访问令牌，并在每次请求中携带它。不过，Passport 包含一个可以替你处理这项工作的中间件。你只需将 `CreateFreshApiToken` 中间件追加到应用程序 `bootstrap/app.php` 文件中的 `web` 中间件组即可：

```php
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        CreateFreshApiToken::class,
    ]);
})
```

> [!WARNING]
> 你应确保 `CreateFreshApiToken` 中间件是中间件堆栈中列出的最后一个中间件。

该中间件会向你的输出响应附加一个 `laravel_token` Cookie。该 Cookie 包含一个加密的 JWT，Passport 将用它来认证来自你的 JavaScript 应用的 API 请求。该 JWT 的有效期等于你的 `session.lifetime` 配置值。现在，由于浏览器会自动在所有后续请求中携带该 Cookie，你可以直接请求应用程序的 API，而无需显式传递访问令牌：

```js
axios.get('/api/user')
    .then(response => {
        console.log(response.data);
    });
```

<a name="customizing-the-cookie-name"></a>
#### 自定义 Cookie 名称

如有需要，你可以使用 `Passport::cookie` 方法自定义 `laravel_token` Cookie 的名称。通常，该方法应在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Passport::cookie('custom_name');
}
```

<a name="csrf-protection"></a>
#### CSRF 保护

使用这种身份认证方法时，你需要确保请求中包含有效的 CSRF 令牌头。骨架应用和所有入门套件中默认包含的 Laravel JavaScript 脚手架都包含一个 [Axios](https://github.com/axios/axios) 实例，它会自动使用加密的 `XSRF-TOKEN` Cookie 值，在同源请求中发送 `X-XSRF-TOKEN` 头。

> [!NOTE]
> 如果你选择发送 `X-CSRF-TOKEN` 头而不是 `X-XSRF-TOKEN`，则需要使用 `csrf_token()` 提供的未加密令牌。

<a name="events"></a>
## 事件

Passport 在签发访问令牌和刷新令牌时会触发事件。你可以[监听这些事件](/docs/{{version}}/events)，以清理或吊销数据库中的其他访问令牌：

| 事件名称                                        |
| --------------------------------------------- |
| `Laravel\Passport\Events\AccessTokenCreated`  |
| `Laravel\Passport\Events\AccessTokenRevoked`  |
| `Laravel\Passport\Events\RefreshTokenCreated` |

<a name="testing"></a>
## 测试

Passport 的 `actingAs` 方法可用于指定当前已认证的用户及其作用域。`actingAs` 方法的第一个参数是用户实例，第二个参数是应授予该用户令牌的作用域数组：

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

Passport 的 `actingAsClient` 方法可用于指定当前已认证的客户端及其作用域。`actingAsClient` 方法的第一个参数是客户端实例，第二个参数是应授予该客户端令牌的作用域数组：

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
