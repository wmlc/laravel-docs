# Laravel Passport

- [介绍](#introduction)
    - [Passport 还是 Sanctum？](#passport-or-sanctum)
- [安装](#installation)
    - [部署 Passport](#deploying-passport)
    - [升级 Passport](#upgrading-passport)
- [配置](#configuration)
    - [令牌有效期](#token-lifetimes)
    - [覆盖默认模型](#overriding-default-models)
    - [覆盖路由](#overriding-routes)
- [授权码授权](#authorization-code-grant)
    - [管理客户端](#managing-clients)
    - [请求令牌](#requesting-tokens)
    - [管理令牌](#managing-tokens)
    - [刷新令牌](#refreshing-tokens)
    - [吊销令牌](#revoking-tokens)
    - [清除令牌](#purging-tokens)
- [带 PKCE 的授权码授权](#code-grant-pkce)
    - [创建客户端](#creating-a-auth-pkce-grant-client)
    - [请求令牌](#requesting-auth-pkce-grant-tokens)
- [设备授权](#device-authorization-grant)
    - [创建设备授权客户端](#creating-a-device-authorization-grant-client)
    - [请求令牌](#requesting-device-authorization-grant-tokens)
- [密码授权](#password-grant)
    - [创建密码授权客户端](#creating-a-password-grant-client)
    - [请求令牌](#requesting-password-grant-tokens)
    - [请求所有作用域](#requesting-all-scopes)
    - [自定义用户提供者](#customizing-the-user-provider)
    - [自定义用户名字段](#customizing-the-username-field)
    - [自定义密码验证](#customizing-the-password-validation)
- [隐式授权](#implicit-grant)
- [客户端凭证授权](#client-credentials-grant)
    - [检索令牌](#retrieving-tokens)
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
- [SPA 认证](#spa-authentication)
- [事件](#events)
- [测试](#testing)

<a name="introduction"></a>
## 介绍

[Laravel Passport](https://github.com/laravel/passport) 能在几分钟内为你的 Laravel 应用提供完整的 OAuth2 服务器实现。Passport 构建于 [League OAuth2 服务器](https://github.com/thephpleague/oauth2-server) 之上，该服务器由 Andy Millington 与 Simon Hamp 维护。

> [!NOTE]
> 本文档假定你已熟悉 OAuth2。如果你对 OAuth2 一无所知，建议在继续之前先熟悉 OAuth2 的通用[术语](https://oauth2.thephpleague.com/terminology/)与特性。

<a name="passport-or-sanctum"></a>
### Passport 还是 Sanctum？

在开始之前，你或许希望确定你的应用更适合使用 Laravel Passport 还是 [Laravel Sanctum](/docs/{{version}}/sanctum)。如果你的应用确实必须支持 OAuth2，那么你应该使用 Laravel Passport。

然而，如果你正在尝试为一个单页应用、移动应用做认证，或要签发 API 令牌，你应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。Laravel Sanctum 不支持 OAuth2；但它提供了更简洁的 API 认证开发体验。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

该命令会发布并运行创建数据库迁移（Migration），这些迁移用于创建你的应用存储 OAuth2 客户端（Client）与访问令牌（access token）所需的表。该命令还会创建生成安全访问令牌所需的加密密钥。

运行 `install:api` 命令后，将 `Laravel\Passport\HasApiTokens` Trait 与 `Laravel\Passport\Contracts\OAuthenticatable` 接口添加到你的 `App\Models\User` 模型中。该 Trait 会为你的模型提供一些辅助方法，让你能够检查已认证用户的令牌与作用域（Scope）：

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

最后，在你的应用的 `config/auth.php` 配置文件中，你应该定义一个 `api` 认证守卫（Guard），并将 `driver` 选项设为 `passport`。这将指示你的应用在认证传入的 API 请求时使用 Passport 的 `TokenGuard`：

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

首次将 Passport 部署到你的应用服务器时，你很可能需要运行 `passport:keys` 命令。该命令会生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不会纳入源代码管理：

```shell
php artisan passport:keys
```

如有必要，你可以定义从何处加载 Passport 密钥的路径。你可以使用 `Passport::loadKeysFrom` 方法来实现。通常，该方法应在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
}
```

<a name="loading-keys-from-the-environment"></a>
#### 从环境变量中加载密钥

或者，你可以使用 `vendor:publish` Artisan 命令发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

配置文件发布后，你可以通过将加密密钥定义为环境变量来加载你的应用的加密密钥：

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

在升级到 Passport 的新主版本时，务必仔细查阅[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

<a name="token-lifetimes"></a>
### 令牌有效期

默认情况下，Passport 签发有效期为一年的长期访问令牌。如果你希望配置更长或更短的令牌有效期，可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 与 `personalAccessTokensExpireIn` 方法。这些方法应在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Carbon\CarbonInterval;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Passport::tokensExpireIn(CarbonInterval::days(15));
    Passport::refreshTokensExpireIn(CarbonInterval::days(30));
    Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
}
```

> [!WARNING]
> Passport 数据库表中的 `expires_at` 列是只读的，仅供展示之用。签发令牌时，Passport 会将过期信息存储在经过签名与加密的令牌中。如果你需要让某个令牌失效，应该[吊销它](#revoking-tokens)。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以自由地通过定义自己的模型并继承相应的 Passport 模型，来扩展 Passport 内部使用的模型：

```php
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    // ...
}
```

定义模型后，你可以通过 `Laravel\Passport\Passport` 类指示 Passport 使用你的自定义模型。通常，你应该在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Passport 你的自定义模型：

```php
use App\Models\Passport\AuthCode;
use App\Models\Passport\Client;
use App\Models\Passport\DeviceCode;
use App\Models\Passport\RefreshToken;
use App\Models\Passport\Token;
use Laravel\Passport\Passport;

/**
 * 引导任意应用服务。
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

有时你可能希望自定义 Passport 定义的路由。为此，你首先需要忽略 Passport 注册的路由，方法是将 `Passport::ignoreRoutes` 添加到你的应用的 `AppServiceProvider` 的 `register` 方法中：

```php
use Laravel\Passport\Passport;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    Passport::ignoreRoutes();
}
```

然后，你可以将 Passport 在[其路由文件](https://github.com/laravel/passport/blob/master/routes/web.php)中定义的路由复制到你的应用的 `routes/web.php` 文件中，并按你的需求修改它们：

```php
Route::group([
    'as' => 'passport.',
    'prefix' => config('passport.path', 'oauth'),
    'namespace' => '\Laravel\Passport\Http\Controllers',
], function () {
    // Passport 路由……
});
```

<a name="authorization-code-grant"></a>
## 授权码授权

通过授权码使用 OAuth2 是大多数开发者所熟悉的 OAuth2 方式。使用授权码时，客户端应用会将用户重定向到你的服务器，用户将在那里批准或拒绝向该客户端签发访问令牌的请求。

要开始使用，我们需要告诉 Passport 如何返回我们的"授权"视图。

所有授权视图的渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应该在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    // 通过提供视图名称……
    Passport::authorizationView('auth.oauth.authorize');

    // 通过提供闭包……
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

Passport 会自动定义返回该视图的 `/oauth/authorize` 路由（Route）。你的 `auth.oauth.authorize` 模板应包含一个向 `passport.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.authorizations.approve` 与 `passport.authorizations.deny` 路由期望接收 `state`、`client_id` 与 `auth_token` 字段。

<a name="managing-clients"></a>
### 管理客户端

开发需要与你的应用 API 交互的应用程序的开发者，需要通过创建一个"客户端"来将他们的应用注册到你的应用中。通常，这包括提供他们应用的名称，以及一个在你的用户批准其授权请求后可供你的应用重定向到的 URI。

<a name="managing-first-party-clients"></a>
#### 第一方客户端

创建客户端最简单的方式是使用 `passport:client` Artisan 命令。该命令可用于创建第一方客户端或测试你的 OAuth2 功能。运行 `passport:client` 命令时，Passport 会提示你输入有关客户端的更多信息，并为你提供客户端 ID 与密钥：

```shell
php artisan passport:client
```

如果你希望为你的客户端允许多个重定向 URI，可以在 `passport:client` 命令提示输入 URI 时使用逗号分隔的列表进行指定。任何包含逗号的 URI 都应进行 URI 编码：

```shell
https://third-party-app.com/callback,https://example.com/oauth/redirect
```

<a name="managing-third-party-clients"></a>
#### 第三方客户端

由于你的应用的用户无法使用 `passport:client` 命令，你可以使用 `Laravel\Passport\ClientRepository` 类的 `createAuthorizationCodeGrantClient` 方法来为给定用户注册客户端：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

// 创建属于给定用户的 OAuth 应用客户端……
$client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
    user: $user,
    name: 'Example App',
    redirectUris: ['https://third-party-app.com/callback'],
    confidential: false,
    enableDeviceFlow: true
);

// 检索属于该用户的所有 OAuth 应用客户端……
$clients = $user->oauthApps()->get();
```

`createAuthorizationCodeGrantClient` 方法会返回 `Laravel\Passport\Client` 的实例。你可以将 `$client->id` 作为客户端 ID 显示，将 `$client->plainSecret` 作为客户端密钥（secret）显示给用户。

<a name="requesting-tokens"></a>
### 请求令牌

<a name="requesting-tokens-redirecting-for-authorization"></a>
#### 重定向以进行授权

客户端创建完成后，开发者可以使用其客户端 ID 与密钥向你的应用请求授权码与访问令牌。首先，消费方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

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

`prompt` 参数可用于指定 Passport 应用的认证行为。

如果 `prompt` 的值为 `none`，则当用户尚未通过 Passport 应用认证时，Passport 始终会抛出认证错误。如果值为 `consent`，即使消费方应用之前已被授予全部作用域，Passport 也会始终显示授权批准界面。当值为 `login` 时，即使已有会话，Passport 应用也会始终提示用户重新登录。

如果未提供 `prompt` 值，则仅当用户此前未针对所请求的作用域授权消费方应用访问时，才会提示其进行授权。

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义。你无需手动定义此路由。

<a name="approving-the-request"></a>
#### 批准请求

收到授权请求时，Passport 会根据 `prompt` 参数的值（如果存在）自动响应，并可能向用户显示一个模板，让用户批准或拒绝该授权请求。如果用户批准请求，他们将被重定向回消费方应用所指定的 `redirect_uri`。`redirect_uri` 必须与创建客户端时指定的 `redirect` URL 相匹配。

有时你可能希望跳过授权提示，例如在授权第一方客户端时。你可以通过[扩展 `Client` 模型](#overriding-default-models)并定义 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，则客户端会被批准，用户会立即被重定向回 `redirect_uri`，除非消费方应用在重定向进行授权时显式设置了 `prompt` 参数：

```php
<?php

namespace App\Models\Passport;

use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Passport\Client as BaseClient;

class Client extends BaseClient
{
    /**
     * 确定客户端是否应跳过授权提示。
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
#### 将授权码兑换为访问令牌

如果用户批准了授权请求，他们会被重定向回消费方应用。消费方应首先将 `state` 参数与重定向前存储的值进行比对验证。如果 state 参数匹配，则消费方应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包含用户批准授权请求时由你的应用签发的授权码：

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

该 `/oauth/token` 路由会返回一个 JSON 响应，其中包含 `access_token`、`refresh_token` 与 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的剩余秒数。

> [!NOTE]
> 与 `/oauth/authorize` 路由一样，`/oauth/token` 路由也由 Passport 为你定义。无需手动定义此路由。

<a name="managing-tokens"></a>
### 管理令牌

你可以使用 `Laravel\Passport\HasApiTokens` Trait 的 `tokens` 方法检索用户已授权的令牌。例如，这可用于为你的用户提供一块仪表盘，用于跟踪他们与第三方应用的连接：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// 检索该用户所有有效的令牌……
$tokens = $user->tokens()
    ->where('revoked', false)
    ->where('expires_at', '>', Date::now())
    ->get();

// 检索该用户与第三方 OAuth 应用客户端的所有连接……
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

如果你的应用签发短期访问令牌，用户需要通过访问令牌签发时提供给他们的刷新令牌来刷新其访问令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'refresh_token',
    'refresh_token' => 'the-refresh-token',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要……
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

该 `/oauth/token` 路由会返回一个 JSON 响应，其中包含 `access_token`、`refresh_token` 与 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的剩余秒数。

<a name="revoking-tokens"></a>
### 吊销令牌

你可以使用 `Laravel\Passport\Token` 模型的 `revoke` 方法吊销令牌。你也可以使用 `Laravel\Passport\RefreshToken` 模型的 `revoke` 方法吊销令牌的刷新令牌：

```php
use Laravel\Passport\Passport;
use Laravel\Passport\Token;

$token = Passport::token()->find($tokenId);

// 吊销一个访问令牌……
$token->revoke();

// 吊销该令牌的刷新令牌……
$token->refreshToken?->revoke();

// 吊销该用户的所有令牌……
User::find($userId)->tokens()->each(function (Token $token) {
    $token->revoke();
    $token->refreshToken?->revoke();
});
```

<a name="purging-tokens"></a>
### 清除令牌

当令牌已被吊销或过期时，你可能希望将其从数据库中清除。Passport 内置的 `passport:purge` Artisan 命令可以为你完成此事：

```shell
# 清除已吊销与已过期的令牌、授权码与设备码……
php artisan passport:purge

# 仅清除过期超过 6 小时的令牌……
php artisan passport:purge --hours=6

# 仅清除已吊销的令牌、授权码与设备码……
php artisan passport:purge --revoked

# 仅清除已过期的令牌、授权码与设备码……
php artisan passport:purge --expired
```

你还可以配置一个[调度任务](/docs/{{version}}/scheduling)，在你的应用的 `routes/console.php` 文件中自动按调度清除你的令牌：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('passport:purge')->hourly();
```

<a name="code-grant-pkce"></a>
## 带 PKCE 的授权码授权

带"Proof Key for Code Exchange"（PKCE）的授权码授权是一种安全的方式，用于对单页应用或移动应用进行认证以访问你的 API。当你无法保证客户端密钥会被保密存储，或为了降低授权码被攻击者拦截的威胁时，应使用此授权类型。在将授权码兑换为访问令牌时，由"code verifier"与"code challenge"组合来替代客户端密钥。

<a name="creating-a-auth-pkce-grant-client"></a>
### 创建客户端

在你的应用能够通过带 PKCE 的授权码授权签发令牌之前，你需要创建一个启用 PKCE 的客户端。你可以使用带有 `--public` 选项的 `passport:client` Artisan 命令来完成：

```shell
php artisan passport:client --public
```

<a name="requesting-auth-pkce-grant-tokens"></a>
### 请求令牌

<a name="code-verifier-code-challenge"></a>
#### Code Verifier 与 Code Challenge

由于此授权类型不提供客户端密钥，开发者需要生成 code verifier 与 code challenge 的组合才能请求令牌。

code verifier 应为一个介于 43 到 128 个字符之间的随机字符串，包含字母、数字以及 `"-"`、`"."`、`"_"`、`"~"` 字符，如 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636) 所定义。

code challenge 应为使用 URL 与文件名安全字符进行 Base64 编码的字符串。应移除末尾的 `'='` 字符，且不得包含换行符、空白符或其他额外字符。

```php
$encoded = base64_encode(hash('sha256', $codeVerifier, true));

$codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');
```

<a name="code-grant-pkce-redirecting-for-authorization"></a>
#### 重定向以进行授权

客户端创建完成后，你可以使用客户端 ID 以及生成的 code verifier 和 code challenge 向你的应用请求授权码与访问令牌。首先，消费方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求：

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
#### 将授权码兑换为访问令牌

如果用户批准了授权请求，他们会被重定向回消费方应用。消费方应像标准授权码授权那样，将 `state` 参数与重定向前存储的值进行比对验证。

如果 state 参数匹配，消费方应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包含用户批准授权请求时由你的应用签发的授权码，以及最初生成的 code verifier：

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
## 设备授权

OAuth2 设备授权允许无浏览器或输入受限的设备（例如电视与游戏主机）通过兑换"设备码（device code）"来获取访问令牌。使用设备流程时，设备客户端会指示用户使用第二台设备（例如计算机或智能手机）连接到你的服务器，在那里输入所提供的"用户码（user code）"，并批准或拒绝该访问请求。

要开始使用，我们需要告诉 Passport 如何返回我们的"用户码"与"授权"视图。

所有授权视图的渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应该在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法。

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    // 通过提供视图名称……
    Passport::deviceUserCodeView('auth.oauth.device.user-code');
    Passport::deviceAuthorizationView('auth.oauth.device.authorize');

    // 通过提供闭包……
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

    // ……
}
```

Passport 会自动定义返回这些视图的路由。你的 `auth.oauth.device.user-code` 模板应包含一个向 `passport.device.authorizations.authorize` 路由发起 GET 请求的表单。`passport.device.authorizations.authorize` 路由期望接收一个 `user_code` 查询参数。

你的 `auth.oauth.device.authorize` 模板应包含一个向 `passport.device.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.device.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.device.authorizations.approve` 与 `passport.device.authorizations.deny` 路由期望接收 `state`、`client_id` 与 `auth_token` 字段。

<a name="creating-a-device-authorization-grant-client"></a>
### 创建设备授权客户端

在你的应用能够通过设备授权签发令牌之前，你需要创建一个启用设备流程的客户端。你可以使用带有 `--device` 选项的 `passport:client` Artisan 命令来完成。该命令会创建一个启用设备流程的第一方客户端，并为你提供客户端 ID 与密钥：

```shell
php artisan passport:client --device
```

此外，你可以使用 `ClientRepository` 类的 `createDeviceAuthorizationGrantClient` 方法注册属于给定用户的第三方客户端：

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

客户端创建完成后，开发者可以使用其客户端 ID 向你的应用请求设备码。首先，消费方设备应向你的应用的 `/oauth/device/code` 路由发起 `POST` 请求以请求设备码：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/device/code', [
    'client_id' => 'your-client-id',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

这将返回一个 JSON 响应，其中包含 `device_code`、`user_code`、`verification_uri`、`interval` 与 `expires_in` 属性。`expires_in` 属性包含设备码过期前的剩余秒数。`interval` 属性包含消费方设备在轮询 `/oauth/token` 路由以避免速率限制错误时，两次请求之间应等待的秒数。

> [!NOTE]
> 请记住，`/oauth/device/code` 路由已由 Passport 定义。你无需手动定义此路由。

<a name="user-code"></a>
#### 展示验证 URI 与用户码

一旦获取到设备码请求，消费方设备应指示用户使用另一台设备访问所提供的 `verification_uri` 并输入 `user_code`，以批准授权请求。

<a name="polling-token-request"></a>
#### 轮询令牌请求

由于用户将使用独立的设备来授予（或拒绝）访问权限，消费方设备应轮询你的应用的 `/oauth/token` 路由，以确定用户何时已响应请求。消费方设备应使用请求设备码时在 JSON 响应中提供的最小轮询 `interval`，以避免速率限制错误：

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

$interval = 5;

do {
    Sleep::for($interval)->seconds();

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:device_code',
        'client_id' => 'your-client-id',
        'client_secret' => 'your-client-secret', // 仅机密客户端需要……
        'device_code' => 'the-device-code',
    ]);

    if ($response->json('error') === 'slow_down') {
        $interval += 5;
    }
} while (in_array($response->json('error'), ['authorization_pending', 'slow_down']));

return $response->json();
```

如果用户已批准授权请求，这将返回一个 JSON 响应，其中包含 `access_token`、`refresh_token` 与 `expires_in` 属性。`expires_in` 属性包含访问令牌过期前的剩余秒数。

<a name="password-grant"></a>
## 密码授权

> [!WARNING]
> 我们不再推荐使用密码授权令牌。相反，你应该选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码授权允许你的其他第一方客户端（例如移动应用）使用电子邮件地址 / 用户名和密码来获取访问令牌。这样，你就可以在不要求用户经历完整的 OAuth2 授权码重定向流程的情况下，安全地向你的第一方客户端签发访问令牌。

要启用密码授权，请在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enablePasswordGrant` 方法：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

<a name="creating-a-password-grant-client"></a>
### 创建密码授权客户端

在你的应用能够通过密码授权签发令牌之前，你需要创建一个密码授权客户端。你可以使用带有 `--password` 选项的 `passport:client` Artisan 命令来完成。

```shell
php artisan passport:client --password
```

<a name="requesting-password-grant-tokens"></a>
### 请求令牌

一旦你启用了该授权并创建了密码授权客户端，你就可以通过向 `/oauth/token` 路由发起 `POST` 请求并附带用户的电子邮件地址与密码来请求访问令牌。请记住，此路由已由 Passport 注册，因此无需手动定义。如果请求成功，你将在服务器的 JSON 响应中收到 `access_token` 与 `refresh_token`：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要……
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

> [!NOTE]
> 请记住，访问令牌默认是长期有效的。但是，如有需要，你可以自由地[配置访问令牌的最大有效期](#configuration)。

<a name="requesting-all-scopes"></a>
### 请求所有作用域

在使用密码授权或客户端凭证授权时，你可能希望为令牌授权你的应用支持的全部作用域。你可以通过请求 `*` 作用域来实现。如果你请求 `*` 作用域，则令牌实例上的 `can` 方法将始终返回 `true`。此作用域只能分配给使用 `password` 或 `client_credentials` 授权签发的令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // 仅机密客户端需要……
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => '*',
]);
```

<a name="customizing-the-user-provider"></a>
### 自定义用户提供者

如果你的应用使用了多个[认证用户提供者](/docs/{{version}}/authentication#introduction)，你可以在通过 `artisan passport:client --password` 命令创建客户端时，提供 `--provider` 选项来指定密码授权客户端所使用的用户提供者。给定的提供者名称应与你的应用的 `config/auth.php` 配置文件中定义的有效提供者相匹配。然后，你可以[使用中间件保护你的路由](#multiple-authentication-guards)，以确保只有来自该守卫所指定提供者的用户才能通过授权。

<a name="customizing-the-username-field"></a>
### 自定义用户名字段

使用密码授权进行认证时，Passport 会将你可认证（Authenticatable）模型的 `email` 属性用作"用户名"。不过，你可以通过在模型上定义 `findForPassport` 方法来自定义此行为：

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

使用密码授权进行认证时，Passport 会使用你的模型的 `password` 属性来验证给定的密码。如果你的模型没有 `password` 属性，或者你希望自定义密码验证逻辑，可以在模型上定义 `validateForPassportPasswordGrant` 方法：

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
     * 为 Passport 密码授权验证用户的密码。
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
```

<a name="implicit-grant"></a>
## 隐式授权

> [!WARNING]
> 我们不再推荐使用隐式授权令牌。相反，你应该选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式授权类似于授权码授权；但令牌会直接返回给客户端，而无需兑换授权码。此授权最常用于无法安全存储客户端凭证的 JavaScript 或移动应用。要启用此授权，请在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Passport::enableImplicitGrant();
}
```

在你的应用能够通过隐式授权签发令牌之前，你需要创建一个隐式授权客户端。你可以使用带有 `--implicit` 选项的 `passport:client` Artisan 命令来完成。

```shell
php artisan passport:client --implicit
```

一旦该授权已启用且隐式客户端已创建，开发者就可以使用其客户端 ID 向你的应用请求访问令牌。消费方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

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
> 请记住，`/oauth/authorize` 路由已由 Passport 定义。你无需手动定义此路由。

<a name="client-credentials-grant"></a>
## 客户端凭证授权

客户端凭证授权适用于机器对机器（machine-to-machine）的认证。例如，你可能会在通过 API 执行维护任务的调度任务中使用此授权。

在你的应用能够通过客户端凭证授权签发令牌之前，你需要创建一个客户端凭证授权客户端。你可以使用 `passport:client` Artisan 命令的 `--client` 选项来完成：

```shell
php artisan passport:client --client
```

接下来，将 `Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件（Middleware）分配给一个路由：

```php
use Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner;

Route::get('/orders', function (Request $request) {
    // 访问令牌有效且客户端为资源所有者……
})->middleware(EnsureClientIsResourceOwner::class);
```

要将路由的访问限制为特定作用域，你可以将所需作用域的列表提供给 `using` 方法`：

```php
Route::get('/orders', function (Request $request) {
    // 访问令牌有效、客户端为资源所有者，且同时拥有 "servers:read" 与 "servers:create" 作用域……
})->middleware(EnsureClientIsResourceOwner::using('servers:read', 'servers:create'));
```

> [!WARNING]
> [底层的 OAuth2 服务器](https://oauth2.thephpleague.com/database-setup/#:~:text=Please%20note%20that,the%20bearer%20token.) 会将客户端凭证令牌的 `sub` 声明（claim）设为客户端的标识符。默认情况下，Passport 为客户端使用 UUID，因此这不会与用户的整型主键冲突。但是，如果你已将 `Passport::$clientUuids` 设为 `false`，则客户端凭证令牌可能会意外解析出一个 ID 与客户端 ID 相匹配的用户。在这种情况下，使用此中间件无法保证传入的令牌就是客户端凭证令牌。

<a name="retrieving-tokens"></a>
### 检索令牌

要使用此授权类型检索令牌，请向 `oauth/token` 端点发起请求：

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

有时，你的用户可能希望在不经历典型授权码重定向流程的情况下，自行签发访问令牌。允许用户通过你的应用 UI 自行签发令牌，既有助于用户试用你的 API，也可作为一种更简单的签发访问令牌的通用方式。

> [!NOTE]
> 如果你的应用主要使用 Passport 来签发个人访问令牌，不妨考虑使用 [Laravel Sanctum](/docs/{{version}}/sanctum)，它是 Laravel 用于签发 API 访问令牌的轻量级第一方库。

<a name="creating-a-personal-access-client"></a>
### 创建个人访问客户端

在你的应用能够签发个人访问令牌之前，你需要创建一个个人访问客户端。你可以通过执行带有 `--personal` 选项的 `passport:client` Artisan 命令来完成。如果你已经运行过 `passport:install` 命令，则无需运行此命令：

```shell
php artisan passport:client --personal
```

<a name="customizing-the-user-provider-for-pat"></a>
### 自定义用户提供者

如果你的应用使用了多个[认证用户提供者](/docs/{{version}}/authentication#introduction)，你可以在通过 `artisan passport:client --personal` 命令创建客户端时，提供 `--provider` 选项来指定个人访问授权客户端所使用的用户提供者。给定的提供者名称应与你的应用的 `config/auth.php` 配置文件中定义的有效提供者相匹配。然后，你可以[使用中间件保护你的路由](#multiple-authentication-guards)，以确保只有来自该守卫所指定提供者的用户才能通过授权。

<a name="managing-personal-access-tokens"></a>
### 管理个人访问令牌

创建个人访问客户端后，你可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为给定用户签发令牌。`createToken` 方法接受令牌名称作为第一个参数，并接受可选的[作用域](#token-scopes)数组作为第二个参数：

```php
use App\Models\User;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// 创建不带作用域的令牌……
$token = $user->createToken('My Token')->accessToken;

// 创建带作用域的令牌……
$token = $user->createToken('My Token', ['user:read', 'orders:create'])->accessToken;

// 创建带全部作用域的令牌……
$token = $user->createToken('My Token', ['*'])->accessToken;

// 检索属于该用户的所有有效个人访问令牌……
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

Passport 内置了一个[认证守卫](/docs/{{version}}/authentication#adding-custom-guards)，用于在传入请求上验证访问令牌。一旦你将 `api` 守卫配置为使用 `passport` 驱动，你只需要在任何需要有效访问令牌的路由上指定 `auth:api` 中间件（Middleware）：

```php
Route::get('/user', function () {
    // 仅经过 API 认证的用户可访问此路由……
})->middleware('auth:api');
```

> [!WARNING]
> 如果你正在使用[客户端凭证授权](#client-credentials-grant)，则应使用 [`Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件](#client-credentials-grant)来保护你的路由，而不是使用 `auth:api` 中间件。

<a name="multiple-authentication-guards"></a>
#### 多个认证守卫

如果你的应用为不同类型的用户（可能使用完全不同的 Eloquent 模型）进行认证，你很可能需要为你的应用中的每种用户提供者类型定义一个守卫配置。这让你能够保护针对特定用户提供者的请求。例如，给定 `config/auth.php` 配置文件中的以下守卫配置：

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

以下路由将使用 `api-customers` 守卫（该守卫使用 `customers` 用户提供者）来对传入请求进行认证：

```php
Route::get('/customer', function () {
    // ……
})->middleware('auth:api-customers');
```

> [!NOTE]
> 有关在 Passport 中使用多个用户提供者的更多信息，请参阅[个人访问令牌文档](#customizing-the-user-provider-for-pat)与[密码授权文档](#customizing-the-user-provider)。

<a name="passing-the-access-token"></a>
### 传递访问令牌

在调用受 Passport 保护的路由时，你的应用的 API 消费方应在其请求的 `Authorization` 标头中将访问令牌指定为 `Bearer` 令牌。例如，使用 `Http` Facade 时：

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

作用域允许你的 API 客户端在请求授权以访问某个账户时，请求一组特定的权限。例如，如果你正在构建一个电子商务应用，并非所有 API 消费方都需要下单的能力。相反，你可以允许消费方仅请求访问订单发货状态的授权。换句话说，作用域让你的应用的用户可以限制第三方应用代表他们执行的操作。

<a name="defining-scopes"></a>
### 定义作用域

你可以使用你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中的 `Passport::tokensCan` 方法来定义你的 API 的作用域。`tokensCan` 方法接受一个由作用域名与作用域描述组成的数组。作用域描述可以是你希望的任何内容，并将显示在授权批准界面上：

```php
/**
 * 引导任意应用服务。
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

如果客户端未请求任何特定作用域，你可以使用 `defaultScopes` 方法配置你的 Passport 服务器，将默认作用域附加到令牌上。通常，你应该在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

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

使用授权码授权请求访问令牌时，消费方应将期望的作用域指定为 `scope` 查询字符串参数。`scope` 参数应为以空格分隔的作用域列表：

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

如果你正在使用 `App\Models\User` 模型的 `createToken` 方法签发个人访问令牌，你可以将期望的作用域数组作为第二个参数传递给该方法：

```php
$token = $user->createToken('My Token', ['orders:create'])->accessToken;
```

<a name="checking-scopes"></a>
### 检查作用域

Passport 内置两个中间件，可用于验证传入请求是否使用已被授予给定作用域的令牌进行了认证。

<a name="check-for-all-scopes"></a>
#### 检查全部作用域

`Laravel\Passport\Http\Middleware\CheckToken` 中间件可被分配给一个路由，用于验证传入请求的访问令牌拥有所列出的全部作用域：

```php
use Laravel\Passport\Http\Middleware\CheckToken;

Route::get('/orders', function () {
    // 访问令牌同时拥有 "orders:read" 与 "orders:create" 作用域……
})->middleware(['auth:api', CheckToken::using('orders:read', 'orders:create')]);
```

<a name="check-for-any-scopes"></a>
#### 检查任意作用域

`Laravel\Passport\Http\Middleware\CheckTokenForAnyScope` 中间件可被分配给一个路由，用于验证传入请求的访问令牌拥有所列作用域中的*至少一个*：

```php
use Laravel\Passport\Http\Middleware\CheckTokenForAnyScope;

Route::get('/orders', function () {
    // 访问令牌拥有 "orders:read" 或 "orders:create" 作用域……
})->middleware(['auth:api', CheckTokenForAnyScope::using('orders:read', 'orders:create')]);
```

<a name="scope-attributes"></a>
#### 作用域属性

如果你的应用使用了[控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，你可以使用 `Laravel\Passport\Attributes\AuthorizeToken` 属性作为 Passport 作用域中间件的便捷快捷方式：

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
        // 访问令牌拥有 "orders:read" 或 "orders:create" 作用域……
    }

    public function store()
    {
        // 访问令牌同时拥有 "orders:read" 与 "orders:create" 作用域……
    }
}
```

默认情况下，`AuthorizeToken` 属性要求拥有全部给定的作用域。如果你传入 `anyScope: true`，则当令牌拥有给定作用域中的至少一个时，请求即通过授权。

<a name="checking-scopes-on-a-token-instance"></a>
#### 在令牌实例上检查作用域

一旦一个经过访问令牌认证的请求进入你的应用，你仍然可以使用已认证的 `App\Models\User` 实例上的 `tokenCan` 方法来检查该令牌是否拥有给定作用域：

```php
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    if ($request->user()->tokenCan('orders:create')) {
        // ……
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

`scopes` 方法将返回所有已定义作用域组成的数组，元素为 `Laravel\Passport\Scope` 的实例：

```php
Passport::scopes();
```

`scopesFor` 方法将返回与给定 ID / 名称匹配的 `Laravel\Passport\Scope` 实例组成的数组：

```php
Passport::scopesFor(['user:read', 'orders:create']);
```

你可以使用 `hasScope` 方法判断给定作用域是否已被定义：

```php
Passport::hasScope('orders:create');
```

<a name="spa-authentication"></a>
## SPA 认证

在构建 API 时，能够让你的 JavaScript 应用消费你自己的 API 会非常有用。这种 API 开发方式让你的应用能够消费你与世界共享的同一个 API。你的 Web 应用、移动应用、第三方应用，以及你可能在各种包管理器上发布的任何 SDK，都可以消费同一个 API。

通常，如果你想从 JavaScript 应用消费你的 API，你需要手动向应用发送访问令牌，并在每次向你的应用发起请求时附带它。不过，Passport 内置了一个中间件可以代你处理此事。你只需将 `CreateFreshApiToken` 中间件追加到你的应用的 `bootstrap/app.php` 文件中的 `web` 中间件组即可：

```php
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        CreateFreshApiToken::class,
    ]);
})
```

> [!WARNING]
> 你应确保 `CreateFreshApiToken` 中间件是你中间件栈中列出的最后一个中间件。

此中间件会向你的传出响应附加一个 `laravel_token` Cookie。该 Cookie 包含一个经过加密的 JWT，Passport 将使用它来认证来自你的 JavaScript 应用的 API 请求。该 JWT 的有效期等于你的 `session.lifetime` 配置值。由于浏览器会在所有后续请求中自动发送该 Cookie，你现在可以向你的应用的 API 发起请求，而无需显式传递访问令牌：

```js
axios.get('/api/user')
    .then(response => {
        console.log(response.data);
    });
```

<a name="customizing-the-cookie-name"></a>
#### 自定义 Cookie 名称

如有需要，你可以使用 `Passport::cookie` 方法自定义 `laravel_token` Cookie 的名称。通常，此方法应在你的应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Passport::cookie('custom_name');
}
```

<a name="csrf-protection"></a>
#### CSRF 保护

使用这种认证方式时，你需要确保请求中包含有效的 CSRF 令牌标头。骨架应用与所有入门套件（starter kit）所附带的默认 Laravel JavaScript 脚手架包含一个 [Axios](https://github.com/axios/axios) 实例，它会在同源请求中自动使用经过加密的 `XSRF-TOKEN` Cookie 值来发送 `X-XSRF-TOKEN` 标头。

> [!NOTE]
> 如果你选择发送 `X-CSRF-TOKEN` 标头而非 `X-XSRF-TOKEN`，则需要使用 `csrf_token()` 提供的未加密令牌。

<a name="events"></a>
## 事件

Passport 在签发访问令牌与刷新令牌时会触发事件。你可以[监听这些事件](/docs/{{version}}/events)，以便在你的数据库中清除或吊销其他访问令牌：

| 事件名称                                    |
| ------------------------------------------- |
| `Laravel\Passport\Events\AccessTokenCreated`  |
| `Laravel\Passport\Events\AccessTokenRevoked`  |
| `Laravel\Passport\Events\RefreshTokenCreated` |

<a name="testing"></a>
## 测试

Passport 的 `actingAs` 方法可用于指定当前已认证的用户及其作用域。传给 `actingAs` 方法的第一个参数是用户实例，第二个参数是应授予该用户令牌的作用域数组：

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

Passport 的 `actingAsClient` 方法可用于指定当前已认证的客户端及其作用域。传给 `actingAsClient` 方法的第一个参数是客户端实例，第二个参数是应授予该客户端令牌的作用域数组：

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
