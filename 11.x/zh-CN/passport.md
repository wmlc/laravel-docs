# Laravel Passport

- [简介](#introduction)
    - [Passport 还是 Sanctum？](#passport-or-sanctum)
- [安装](#installation)
    - [部署 Passport](#deploying-passport)
    - [升级 Passport](#upgrading-passport)
- [配置](#configuration)
    - [客户端密钥哈希](#client-secret-hashing)
    - [令牌有效期](#token-lifetimes)
    - [覆盖默认模型](#overriding-default-models)
    - [覆盖路由](#overriding-routes)
- [签发访问令牌](#issuing-access-tokens)
    - [管理客户端](#managing-clients)
    - [请求令牌](#requesting-tokens)
    - [刷新令牌](#refreshing-tokens)
    - [撤销令牌](#revoking-tokens)
    - [清除令牌](#purging-tokens)
- [带 PKCE 的授权码模式](#code-grant-pkce)
    - [创建客户端](#creating-a-auth-pkce-grant-client)
    - [请求令牌](#requesting-auth-pkce-grant-tokens)
- [密码模式令牌](#password-grant-tokens)
    - [创建密码模式客户端](#creating-a-password-grant-client)
    - [请求令牌](#requesting-password-grant-tokens)
    - [请求所有作用域](#requesting-all-scopes)
    - [自定义用户提供者](#customizing-the-user-provider)
    - [自定义用户名字段](#customizing-the-username-field)
    - [自定义密码验证](#customizing-the-password-validation)
- [隐式模式令牌](#implicit-grant-tokens)
- [客户端凭证模式令牌](#client-credentials-grant-tokens)
- [个人访问令牌](#personal-access-tokens)
    - [创建个人访问客户端](#creating-a-personal-access-client)
    - [管理个人访问令牌](#managing-personal-access-tokens)
- [保护路由](#protecting-routes)
    - [通过中间件](#via-middleware)
    - [传递访问令牌](#passing-the-access-token)
- [令牌作用域](#token-scopes)
    - [定义作用域](#defining-scopes)
    - [默认作用域](#default-scope)
    - [为令牌分配作用域](#assigning-scopes-to-tokens)
    - [检查作用域](#checking-scopes)
- [在 JavaScript 中调用你的 API](#consuming-your-api-with-javascript)
- [事件](#events)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Passport](https://github.com/laravel/passport) 只需几分钟就能为你的 Laravel 应用提供完整的 OAuth2 服务器实现。Passport 构建在由 Andy Millington 与 Simon Hamp 维护的 [League OAuth2 server](https://github.com/thephpleague/oauth2-server) 之上。

> [!WARNING]
> 本文档假定你已经熟悉 OAuth2。如果你对 OAuth2 还不了解，建议先熟悉 OAuth2 的一般[术语](https://oauth2.thephpleague.com/terminology/)与特性，再继续阅读。

<a name="passport-or-sanctum"></a>
### Passport 还是 Sanctum？

开始之前，你或许想先确定自己的应用更适合使用 Laravel Passport 还是 [Laravel Sanctum](/docs/{{version}}/sanctum)。如果你的应用确实需要支持 OAuth2，那就应该使用 Laravel Passport。

但如果你只是想认证单页应用、移动应用，或者签发 API 令牌，那么应该使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。Laravel Sanctum 不支持 OAuth2，但它能提供简单得多的 API 认证开发体验。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

该命令会发布并运行创建应用所需数据库迁移，用于存储 OAuth2 客户端与访问令牌。命令还会创建生成安全访问令牌所需的加密密钥。

此外，该命令会询问你是否希望使用 UUID 作为 Passport `Client` 模型的主键值，而不是自增整数。

运行 `install:api` 命令后，把 `Laravel\Passport\HasApiTokens` Trait 添加到你的 `App\Models\User` 模型。该 Trait 会为模型提供若干辅助方法，让你能够查看已认证用户的令牌与作用域：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;
    use Laravel\Passport\HasApiTokens;

    class User extends Authenticatable
    {
        use HasApiTokens, HasFactory, Notifiable;
    }

最后，在应用的 `config/auth.php` 配置文件中，你应当定义一个 `api` 认证守卫，并把 `driver` 选项设为 `passport`。这会指示应用在认证传入的 API 请求时使用 Passport 的 `TokenGuard`：

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

<a name="deploying-passport"></a>
### 部署 Passport

首次把 Passport 部署到应用服务器时，你很可能需要运行 `passport:keys` 命令。该命令生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不会保存在源码管理中：

```shell
php artisan passport:keys
```

如果需要，你可以定义 Passport 密钥的加载路径。可以使用 `Passport::loadKeysFrom` 方法做到这一点。通常应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用该方法：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
    }

<a name="loading-keys-from-the-environment"></a>
#### 从环境变量加载密钥

或者，你可以使用 `vendor:publish` Artisan 命令发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

配置文件发布后，你可以通过环境变量来定义并加载应用的加密密钥：

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

升级到 Passport 的新主版本时，务必仔细阅读[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

<a name="client-secret-hashing"></a>
### 客户端密钥哈希

如果你希望客户端密钥在存入数据库时经过哈希处理，应在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `Passport::hashClientSecrets` 方法：

    use Laravel\Passport\Passport;

    Passport::hashClientSecrets();

启用后，所有客户端密钥只有在刚创建时才对用户可见。由于明文客户端密钥值从不存入数据库，一旦丢失就无法恢复其值。

<a name="token-lifetimes"></a>
### 令牌有效期

默认情况下，Passport 签发有效期为一年的长期访问令牌。如果你想配置更长或更短的令牌有效期，可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 和 `personalAccessTokensExpireIn` 方法。这些方法应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::tokensExpireIn(now()->addDays(15));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addMonths(6));
    }

> [!WARNING]
> Passport 数据库表中的 `expires_at` 列是只读的，仅用于展示。签发令牌时，Passport 会把过期信息存储在经过签名和加密的令牌内部。如果需要让某个令牌失效，应当[撤销它](#revoking-tokens)。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以通过定义自己的模型并继承相应的 Passport 模型，来扩展 Passport 内部使用的模型：

    use Laravel\Passport\Client as PassportClient;

    class Client extends PassportClient
    {
        // ...
    }

定义好模型后，你可以通过 `Laravel\Passport\Passport` 类指示 Passport 使用你的自定义模型。通常应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Passport 你的自定义模型：

    use App\Models\Passport\AuthCode;
    use App\Models\Passport\Client;
    use App\Models\Passport\PersonalAccessClient;
    use App\Models\Passport\RefreshToken;
    use App\Models\Passport\Token;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::useTokenModel(Token::class);
        Passport::useRefreshTokenModel(RefreshToken::class);
        Passport::useAuthCodeModel(AuthCode::class);
        Passport::useClientModel(Client::class);
        Passport::usePersonalAccessClientModel(PersonalAccessClient::class);
    }

<a name="overriding-routes"></a>
### 覆盖路由

有时你可能想自定义 Passport 定义的路由。要做到这一点，首先需要在应用的 `AppServiceProvider` 的 `register` 方法中添加 `Passport::ignoreRoutes`，从而忽略 Passport 注册的路由：

    use Laravel\Passport\Passport;

    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        Passport::ignoreRoutes();
    }

然后，你可以把 Passport 在[它的路由文件](https://github.com/laravel/passport/blob/11.x/routes/web.php)中定义的路由复制到应用的 `routes/web.php` 文件中，并按你的喜好修改：

    Route::group([
        'as' => 'passport.',
        'prefix' => config('passport.path', 'oauth'),
        'namespace' => '\Laravel\Passport\Http\Controllers',
    ], function () {
        // Passport 路由...
    });

<a name="issuing-access-tokens"></a>
## 签发访问令牌

大多数开发者熟悉的 OAuth2 用法，就是通过授权码来使用 OAuth2。使用授权码时，客户端应用会把用户重定向到你的服务器，由用户批准或拒绝向该客户端签发访问令牌的请求。

<a name="managing-clients"></a>
### 管理客户端

首先，需要与你应用的 API 交互的开发者，必须通过创建一个"客户端"来注册自己的应用。通常这包括提供他们的应用名称，以及一个 URL——用户批准授权请求后，你的应用可以重定向到该 URL。

<a name="the-passportclient-command"></a>
#### `passport:client` 命令

创建客户端最简单的方式是使用 `passport:client` Artisan 命令。你可以用该命令创建自己的客户端，以测试 OAuth2 功能。运行 `client` 命令时，Passport 会提示你提供更多客户端信息，并给你一个客户端 ID 与密钥：

```shell
php artisan passport:client
```

**重定向 URL**

如果你希望为客户端允许多个重定向 URL，可以在 `passport:client` 命令提示输入 URL 时，用逗号分隔的列表来指定。任何包含逗号的 URL 都应进行 URL 编码：

```shell
http://example.com/callback,http://examplefoo.com/callback
```

<a name="clients-json-api"></a>
#### JSON API

由于你的应用用户无法使用 `client` 命令，Passport 提供了一个可用于创建客户端的 JSON API。这样你就不必为创建、更新和删除客户端手动编写控制器。

不过，你需要把 Passport 的 JSON API 与自己的前端搭配起来，为用户提供管理客户端的仪表盘。下面将介绍所有用于管理客户端的 API 端点。为方便演示，我们使用 [Axios](https://github.com/axios/axios) 发起对这些端点的 HTTP 请求。

该 JSON API 受 `web` 与 `auth` 中间件保护，因此只能从你自己的应用调用，无法从外部源调用。

<a name="get-oauthclients"></a>
#### `GET /oauth/clients`

该路由返回已认证用户的所有客户端。它主要用于列出用户的全部客户端，以便用户编辑或删除它们：

```js
axios.get('/oauth/clients')
    .then(response => {
        console.log(response.data);
    });
```

<a name="post-oauthclients"></a>
#### `POST /oauth/clients`

该路由用于创建新客户端。它需要两项数据：客户端的 `name` 和一个 `redirect` URL。`redirect` URL 是用户批准或拒绝授权请求后将被重定向到的位置。

客户端创建成功后会获得一个客户端 ID 和客户端密钥。请求访问令牌时会用到这两个值。创建客户端的路由会返回新的客户端实例：

```js
const data = {
    name: 'Client Name',
    redirect: 'http://example.com/callback'
};

axios.post('/oauth/clients', data)
    .then(response => {
        console.log(response.data);
    })
    .catch (response => {
        // 列出响应中的错误...
    });
```

<a name="put-oauthclientsclient-id"></a>
#### `PUT /oauth/clients/{client-id}`

该路由用于更新客户端。它需要两项数据：客户端的 `name` 和一个 `redirect` URL。`redirect` URL 是用户批准或拒绝授权请求后将被重定向到的位置。该路由会返回更新后的客户端实例：

```js
const data = {
    name: 'New Client Name',
    redirect: 'http://example.com/callback'
};

axios.put('/oauth/clients/' + clientId, data)
    .then(response => {
        console.log(response.data);
    })
    .catch (response => {
        // 列出响应中的错误...
    });
```

<a name="delete-oauthclientsclient-id"></a>
#### `DELETE /oauth/clients/{client-id}`

该路由用于删除客户端：

```js
axios.delete('/oauth/clients/' + clientId)
    .then(response => {
        // ...
    });
```

<a name="requesting-tokens"></a>
### 请求令牌

<a name="requesting-tokens-redirecting-for-authorization"></a>
#### 重定向以获取授权

客户端创建完成后，开发者可以使用其客户端 ID 与密钥向你的应用请求授权码和访问令牌。首先，调用方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

    use Illuminate\Http\Request;
    use Illuminate\Support\Str;

    Route::get('/redirect', function (Request $request) {
        $request->session()->put('state', $state = Str::random(40));

        $query = http_build_query([
            'client_id' => 'client-id',
            'redirect_uri' => 'http://third-party-app.com/callback',
            'response_type' => 'code',
            'scope' => '',
            'state' => $state,
            // 'prompt' => '', // "none"、"consent" 或 "login"
        ]);

        return redirect('http://passport-app.test/oauth/authorize?'.$query);
    });

`prompt` 参数可用于指定 Passport 应用的认证行为。

如果 `prompt` 的值为 `none`，那么用户尚未通过 Passport 应用完成认证时，Passport 总是会抛出认证错误。如果值为 `consent`，那么即使所有作用域此前都已授予调用方应用，Passport 也总会展示授权批准界面。当值为 `login` 时，即使用户已有会话，Passport 应用也总会提示用户重新登录。

如果不提供 `prompt` 值，那么只有当用户此前未曾就所请求的作用域授权访问调用方应用时，才会提示用户进行授权。

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义，你无需手动定义该路由。

<a name="approving-the-request"></a>
#### 批准请求

收到授权请求时，Passport 会根据 `prompt` 参数的值（如果提供）自动响应，并向用户展示一个模板，让用户批准或拒绝该授权请求。如果用户批准请求，就会被重定向回调用方应用指定的 `redirect_uri`。该 `redirect_uri` 必须与创建客户端时指定的 `redirect` URL 一致。

如果你想自定义授权批准界面，可以使用 `vendor:publish` Artisan 命令发布 Passport 的视图。发布的视图会被放到 `resources/views/vendor/passport` 目录中：

```shell
php artisan vendor:publish --tag=passport-views
```

有时你可能想跳过授权提示，例如在为第一方客户端授权时。可以通过[扩展 `Client` 模型](#overriding-default-models)并定义 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，该客户端就会被自动批准，用户也会立即被重定向回 `redirect_uri`——除非调用方应用在重定向以获取授权时明确设置了 `prompt` 参数：

    <?php

    namespace App\Models\Passport;

    use Laravel\Passport\Client as BaseClient;

    class Client extends BaseClient
    {
        /**
         * 确定该客户端是否应跳过授权提示。
         */
        public function skipsAuthorization(): bool
        {
            return $this->firstParty();
        }
    }

<a name="requesting-tokens-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码转换为访问令牌

如果用户批准了授权请求，就会被重定向回调用方应用。调用方应先把 `state` 参数与重定向前存储的值进行比对。如果 state 参数匹配，调用方就应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包含你的应用在用户批准授权请求时签发的授权码：

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Http;

    Route::get('/callback', function (Request $request) {
        $state = $request->session()->pull('state');

        throw_unless(
            strlen($state) > 0 && $state === $request->state,
            InvalidArgumentException::class,
            'Invalid state value.'
        );

        $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => 'client-id',
            'client_secret' => 'client-secret',
            'redirect_uri' => 'http://third-party-app.com/callback',
            'code' => $request->code,
        ]);

        return $response->json();
    });

该 `/oauth/token` 路由会返回一个 JSON 响应，其中包含 `access_token`、`refresh_token` 和 `expires_in` 属性。`expires_in` 属性表示访问令牌距离过期的秒数。

> [!NOTE]
> 与 `/oauth/authorize` 路由一样，`/oauth/token` 路由也已由 Passport 为你定义好，无需手动定义。

<a name="tokens-json-api"></a>
#### JSON API

Passport 还包含一个用于管理已授权访问令牌的 JSON API。你可以把它与自己的前端搭配，为用户提供管理访问令牌的仪表盘。为方便演示，我们使用 [Axios](https://github.com/axios/axios) 发起对这些端点的 HTTP 请求。该 JSON API 受 `web` 与 `auth` 中间件保护，因此只能从你自己的应用调用。

<a name="get-oauthtokens"></a>
#### `GET /oauth/tokens`

该路由返回已认证用户创建的所有已授权访问令牌。它主要用于列出用户的全部令牌，以便用户撤销它们：

```js
axios.get('/oauth/tokens')
    .then(response => {
        console.log(response.data);
    });
```

<a name="delete-oauthtokenstoken-id"></a>
#### `DELETE /oauth/tokens/{token-id}`

该路由可用于撤销已授权的访问令牌及其关联的刷新令牌：

```js
axios.delete('/oauth/tokens/' + tokenId);
```

<a name="refreshing-tokens"></a>
### 刷新令牌

如果你的应用签发的是短期访问令牌，用户就需要使用签发访问令牌时获发的刷新令牌来刷新自己的访问令牌：

    use Illuminate\Support\Facades\Http;

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'refresh_token',
        'refresh_token' => 'the-refresh-token',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'scope' => '',
    ]);

    return $response->json();

该 `/oauth/token` 路由会返回一个 JSON 响应，其中包含 `access_token`、`refresh_token` 和 `expires_in` 属性。`expires_in` 属性表示访问令牌距离过期的秒数。

<a name="revoking-tokens"></a>
### 撤销令牌

你可以在 `Laravel\Passport\TokenRepository` 上使用 `revokeAccessToken` 方法来撤销令牌。你可以在 `Laravel\Passport\RefreshTokenRepository` 上使用 `revokeRefreshTokensByAccessTokenId` 方法来撤销令牌的刷新令牌。这些类可以通过 Laravel 的[服务容器](/docs/{{version}}/container)解析：

    use Laravel\Passport\TokenRepository;
    use Laravel\Passport\RefreshTokenRepository;

    $tokenRepository = app(TokenRepository::class);
    $refreshTokenRepository = app(RefreshTokenRepository::class);

    // 撤销一个访问令牌...
    $tokenRepository->revokeAccessToken($tokenId);

    // 撤销该令牌的所有刷新令牌...
    $refreshTokenRepository->revokeRefreshTokensByAccessTokenId($tokenId);

<a name="purging-tokens"></a>
### 清除令牌

令牌被撤销或过期后，你可能想把它们从数据库中清除。Passport 自带的 `passport:purge` Artisan 命令可以替你完成这件事：

```shell
# 清除已撤销和已过期的令牌与授权码...
php artisan passport:purge

# 只清除过期超过 6 小时的令牌...
php artisan passport:purge --hours=6

# 只清除已撤销的令牌与授权码...
php artisan passport:purge --revoked

# 只清除已过期的令牌与授权码...
php artisan passport:purge --expired
```

你还可以在应用的 `routes/console.php` 文件中配置一个[调度任务](/docs/{{version}}/scheduling)，按计划自动清理令牌：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('passport:purge')->hourly();

<a name="code-grant-pkce"></a>
## 带 PKCE 的授权码模式

带"代码交换密钥证明"（PKCE）的授权码模式，是一种对单页应用或原生应用进行认证以访问你的 API 的安全方式。当你无法保证客户端密钥被机密保存，或希望缓解授权码被攻击者截获的风险时，应当使用该模式。在用授权码换取访问令牌时，"代码校验器"与"代码挑战"的组合会取代客户端密钥。

<a name="creating-a-auth-pkce-grant-client"></a>
### 创建客户端

在应用能够通过带 PKCE 的授权码模式签发令牌之前，你需要创建一个启用 PKCE 的客户端。可以使用带 `--public` 选项的 `passport:client` Artisan 命令做到这一点：

```shell
php artisan passport:client --public
```

<a name="requesting-auth-pkce-grant-tokens"></a>
### 请求令牌

<a name="code-verifier-code-challenge"></a>
#### 代码校验器与代码挑战

由于这种授权模式不提供客户端密钥，开发者需要生成代码校验器与代码挑战的组合，才能请求令牌。

代码校验器应是一个 43 到 128 字符之间的随机字符串，包含字母、数字以及 `"-"`、`"."`、`"_"`、`"~"` 字符，具体定义见 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636)。

代码挑战应是一个经过 Base64 编码、包含 URL 与文件名安全字符的字符串。末尾的 `'='` 字符应当被移除，并且不应出现换行、空白字符或其他额外字符。

    $encoded = base64_encode(hash('sha256', $code_verifier, true));

    $codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');

<a name="code-grant-pkce-redirecting-for-authorization"></a>
#### 重定向以获取授权

客户端创建完成后，你可以使用客户端 ID 以及生成的代码校验器和代码挑战向你的应用请求授权码与访问令牌。首先，调用方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求：

    use Illuminate\Http\Request;
    use Illuminate\Support\Str;

    Route::get('/redirect', function (Request $request) {
        $request->session()->put('state', $state = Str::random(40));

        $request->session()->put(
            'code_verifier', $code_verifier = Str::random(128)
        );

        $codeChallenge = strtr(rtrim(
            base64_encode(hash('sha256', $code_verifier, true))
        , '='), '+/', '-_');

        $query = http_build_query([
            'client_id' => 'client-id',
            'redirect_uri' => 'http://third-party-app.com/callback',
            'response_type' => 'code',
            'scope' => '',
            'state' => $state,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
            // 'prompt' => '', // "none"、"consent" 或 "login"
        ]);

        return redirect('http://passport-app.test/oauth/authorize?'.$query);
    });

<a name="code-grant-pkce-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码转换为访问令牌

如果用户批准了授权请求，就会被重定向回调用方应用。调用方应像标准授权码模式那样，把 `state` 参数与重定向前存储的值进行比对。

如果 state 参数匹配，调用方就应向你的应用发起 `POST` 请求以请求访问令牌。该请求应包含你的应用在用户批准授权请求时签发的授权码，以及最初生成的代码校验器：

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Http;

    Route::get('/callback', function (Request $request) {
        $state = $request->session()->pull('state');

        $codeVerifier = $request->session()->pull('code_verifier');

        throw_unless(
            strlen($state) > 0 && $state === $request->state,
            InvalidArgumentException::class
        );

        $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => 'client-id',
            'redirect_uri' => 'http://third-party-app.com/callback',
            'code_verifier' => $codeVerifier,
            'code' => $request->code,
        ]);

        return $response->json();
    });

<a name="password-grant-tokens"></a>
## 密码模式令牌

> [!WARNING]
> 我们不再推荐使用密码模式令牌。相反，你应当选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码模式允许你的其他第一方客户端（例如移动应用）使用邮箱地址/用户名和密码来获取访问令牌。这样你无需让用户走完整的 OAuth2 授权码重定向流程，就能安全地向前方客户端签发访问令牌。

要启用密码模式，请在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enablePasswordGrant` 方法：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::enablePasswordGrant();
    }

<a name="creating-a-password-grant-client"></a>
### 创建密码模式客户端

在应用能够通过密码模式签发令牌之前，你需要创建一个密码模式客户端。可以使用带 `--password` 选项的 `passport:client` Artisan 命令做到这一点。**如果你已经运行过 `passport:install` 命令，就不需要再运行此命令：**

```shell
php artisan passport:client --password
```

<a name="requesting-password-grant-tokens"></a>
### 请求令牌

创建密码模式客户端后，你可以通过向 `/oauth/token` 路由发起 `POST` 请求并带上用户的邮箱地址与密码来请求访问令牌。请记住，该路由已由 Passport 注册，无需手动定义。如果请求成功，你会在服务器返回的 JSON 响应中收到 `access_token` 和 `refresh_token`：

    use Illuminate\Support\Facades\Http;

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'password',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'username' => 'taylor@laravel.com',
        'password' => 'my-password',
        'scope' => '',
    ]);

    return $response->json();

> [!NOTE]
> 请记住，访问令牌默认是长期有效的。不过，如有需要，你可以自由地[配置访问令牌的最大有效期](#configuration)。

<a name="requesting-all-scopes"></a>
### 请求所有作用域

使用密码模式或客户端凭证模式时，你可能希望为令牌授权应用支持的所有作用域。你可以请求 `*` 作用域来实现这一点。如果请求了 `*` 作用域，令牌实例上的 `can` 方法将始终返回 `true`。该作用域只能被授予通过 `password` 或 `client_credentials` 模式签发的令牌：

    use Illuminate\Support\Facades\Http;

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'password',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'username' => 'taylor@laravel.com',
        'password' => 'my-password',
        'scope' => '*',
    ]);

<a name="customizing-the-user-provider"></a>
### 自定义用户提供者

如果你的应用使用了多个[认证用户提供者](/docs/{{version}}/authentication#introduction)，你可以在通过 `artisan passport:client --password` 命令创建客户端时提供 `--provider` 选项，以指定密码模式客户端使用哪个用户提供者。给定的提供者名称应当与应用的 `config/auth.php` 配置文件中定义的有效提供者相匹配。随后你可以[使用中间件保护路由](#via-middleware)，确保只有来自该守卫所指定提供者的用户才被授权。

<a name="customizing-the-username-field"></a>
### 自定义用户名字段

使用密码模式认证时，Passport 会使用可认证模型的 `email` 属性作为"用户名"。不过，你可以通过在模型上定义 `findForPassport` 方法来自定义这一行为：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;
    use Laravel\Passport\HasApiTokens;

    class User extends Authenticatable
    {
        use HasApiTokens, Notifiable;

        /**
         * 查找给定用户名对应的用户实例。
         */
        public function findForPassport(string $username): User
        {
            return $this->where('username', $username)->first();
        }
    }

<a name="customizing-the-password-validation"></a>
### 自定义密码验证

使用密码模式认证时，Passport 会使用模型的 `password` 属性验证给定密码。如果模型没有 `password` 属性，或者你想自定义密码验证逻辑，可以在模型上定义 `validateForPassportPasswordGrant` 方法：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;
    use Illuminate\Support\Facades\Hash;
    use Laravel\Passport\HasApiTokens;

    class User extends Authenticatable
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

<a name="implicit-grant-tokens"></a>
## 隐式模式令牌

> [!WARNING]
> 我们不再推荐使用隐式模式令牌。相反，你应当选择 [OAuth2 Server 当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式模式与授权码模式类似；不过它无需交换授权码，直接把令牌返回给客户端。该模式最常用于无法安全存储客户端凭据的 JavaScript 或移动应用。要启用该模式，请在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::enableImplicitGrant();
    }

启用该模式后，开发者可以使用其客户端 ID 向你的应用请求访问令牌。调用方应用应向你的应用的 `/oauth/authorize` 路由发起重定向请求，如下所示：

    use Illuminate\Http\Request;

    Route::get('/redirect', function (Request $request) {
        $request->session()->put('state', $state = Str::random(40));

        $query = http_build_query([
            'client_id' => 'client-id',
            'redirect_uri' => 'http://third-party-app.com/callback',
            'response_type' => 'token',
            'scope' => '',
            'state' => $state,
            // 'prompt' => '', // "none"、"consent" 或 "login"
        ]);

        return redirect('http://passport-app.test/oauth/authorize?'.$query);
    });

> [!NOTE]
> 请记住，`/oauth/authorize` 路由已由 Passport 定义，你无需手动定义该路由。

<a name="client-credentials-grant-tokens"></a>
## 客户端凭证模式令牌

客户端凭证模式适合机器对机器的认证。例如，你可以在一个通过 API 执行维护任务的调度任务中使用该模式。

在应用能够通过客户端凭证模式签发令牌之前，你需要创建一个客户端凭证模式客户端。可以使用 `passport:client` Artisan 命令的 `--client` 选项做到这一点：

```shell
php artisan passport:client --client
```

接下来，要使用这种授权类型，请为 `CheckClientCredentials` 中间件注册一个中间件别名。你可以在应用的 `bootstrap/app.php` 文件中定义中间件别名：

    use Laravel\Passport\Http\Middleware\CheckClientCredentials;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'client' => CheckClientCredentials::class
        ]);
    })

然后，把该中间件附加到路由上：

    Route::get('/orders', function (Request $request) {
        ...
    })->middleware('client');

如需把对该路由的访问限制到特定作用域，可以在把 `client` 中间件附加到路由时提供一份以逗号分隔的必需作用域列表：

    Route::get('/orders', function (Request $request) {
        ...
    })->middleware('client:check-status,your-scope');

<a name="retrieving-tokens"></a>
### 获取令牌

要使用这种授权类型获取令牌，请向 `oauth/token` 端点发起请求：

    use Illuminate\Support\Facades\Http;

    $response = Http::asForm()->post('http://passport-app.test/oauth/token', [
        'grant_type' => 'client_credentials',
        'client_id' => 'client-id',
        'client_secret' => 'client-secret',
        'scope' => 'your-scope',
    ]);

    return $response->json()['access_token'];

<a name="personal-access-tokens"></a>
## 个人访问令牌

有时，你的用户希望在不经过典型的授权码重定向流程的情况下为自己签发访问令牌。允许用户通过你的应用界面为自己签发令牌，可以让用户方便地试用你的 API，也可以成为签发访问令牌的一种更简单的替代方案。

> [!NOTE]
> 如果你的应用主要使用 Passport 来签发个人访问令牌，可以考虑使用 [Laravel Sanctum](/docs/{{version}}/sanctum)——这是 Laravel 用于签发 API 访问令牌的轻量级第一方库。

<a name="creating-a-personal-access-client"></a>
### 创建个人访问客户端

在应用能够签发个人访问令牌之前，你需要创建一个个人访问客户端。可以执行带 `--personal` 选项的 `passport:client` Artisan 命令来做到这一点。如果你已经运行过 `passport:install` 命令，就不需要再运行此命令：

```shell
php artisan passport:client --personal
```

创建个人访问客户端后，把客户端 ID 与明文密钥值放入应用的 `.env` 文件中：

```ini
PASSPORT_PERSONAL_ACCESS_CLIENT_ID="client-id-value"
PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET="unhashed-client-secret-value"
```

<a name="managing-personal-access-tokens"></a>
### 管理个人访问令牌

创建个人访问客户端后，你可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为指定用户签发令牌。`createToken` 方法的第一个参数是令牌名称，第二个参数是可选的[作用域](#token-scopes)数组：

    use App\Models\User;

    $user = User::find(1);

    // 创建不带作用域的令牌...
    $token = $user->createToken('Token Name')->accessToken;

    // 创建带作用域的令牌...
    $token = $user->createToken('My Token', ['place-orders'])->accessToken;

<a name="personal-access-tokens-json-api"></a>
#### JSON API

Passport 还包含一个用于管理个人访问令牌的 JSON API。你可以把它与自己的前端搭配，为用户提供管理个人访问令牌的仪表盘。下面将介绍所有用于管理个人访问令牌的 API 端点。为方便演示，我们使用 [Axios](https://github.com/axios/axios) 发起对这些端点的 HTTP 请求。

该 JSON API 受 `web` 与 `auth` 中间件保护，因此只能从你自己的应用调用，无法从外部源调用。

<a name="get-oauthscopes"></a>
#### `GET /oauth/scopes`

该路由返回为你的应用定义的所有[作用域](#token-scopes)。你可以使用该路由列出用户可以分配给个人访问令牌的作用域：

```js
axios.get('/oauth/scopes')
    .then(response => {
        console.log(response.data);
    });
```

<a name="get-oauthpersonal-access-tokens"></a>
#### `GET /oauth/personal-access-tokens`

该路由返回已认证用户创建的所有个人访问令牌。它主要用于列出用户的全部令牌，以便用户编辑或撤销它们：

```js
axios.get('/oauth/personal-access-tokens')
    .then(response => {
        console.log(response.data);
    });
```

<a name="post-oauthpersonal-access-tokens"></a>
#### `POST /oauth/personal-access-tokens`

该路由用于创建新的个人访问令牌。它需要两项数据：令牌的 `name` 以及应分配给该令牌的作用域：

```js
const data = {
    name: 'Token Name',
    scopes: []
};

axios.post('/oauth/personal-access-tokens', data)
    .then(response => {
        console.log(response.data.accessToken);
    })
    .catch (response => {
        // 列出响应中的错误...
    });
```

<a name="delete-oauthpersonal-access-tokenstoken-id"></a>
#### `DELETE /oauth/personal-access-tokens/{token-id}`

该路由可用于撤销个人访问令牌：

```js
axios.delete('/oauth/personal-access-tokens/' + tokenId);
```

<a name="protecting-routes"></a>
## 保护路由

<a name="via-middleware"></a>
### 通过中间件

Passport 自带一个[认证守卫](/docs/{{version}}/authentication#adding-custom-guards)，用于验证传入请求中的访问令牌。把 `api` 守卫配置为使用 `passport` 驱动后，你只需在任何要求有效访问令牌的路由上指定 `auth:api` 中间件：

    Route::get('/user', function () {
        // ...
    })->middleware('auth:api');

> [!WARNING]
> 如果你使用[客户端凭证模式](#client-credentials-grant-tokens)，应当使用 [`client` 中间件](#client-credentials-grant-tokens)来保护路由，而不是 `auth:api` 中间件。

<a name="multiple-authentication-guards"></a>
#### 多个认证守卫

如果你的应用要认证不同类型的用户，而且这些用户可能使用完全不同的 Eloquent 模型，那么很可能需要为应用中的每种用户提供者类型定义一份守卫配置。这样你就能保护面向特定用户提供者的请求。例如，给定 `config/auth.php` 配置文件中的以下守卫配置：

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],

    'api-customers' => [
        'driver' => 'passport',
        'provider' => 'customers',
    ],

以下路由将使用 `api-customers` 守卫（它使用 `customers` 用户提供者）来认证传入请求：

    Route::get('/customer', function () {
        // ...
    })->middleware('auth:api-customers');

> [!NOTE]
> 关于在 Passport 中使用多个用户提供者的更多信息，请查阅[密码模式文档](#customizing-the-user-provider)。

<a name="passing-the-access-token"></a>
### 传递访问令牌

调用受 Passport 保护的路由时，你的应用的 API 调用方应在请求的 `Authorization` 请求头中把访问令牌指定为 `Bearer` 令牌。例如，使用 Guzzle HTTP 库时：

    use Illuminate\Support\Facades\Http;

    $response = Http::withHeaders([
        'Accept' => 'application/json',
        'Authorization' => 'Bearer '.$accessToken,
    ])->get('https://passport-app.test/api/user');

    return $response->json();

<a name="token-scopes"></a>
## 令牌作用域

作用域让 API 客户端在请求授权访问某个账户时，可以请求一组特定的权限。例如，如果你正在构建一个电商应用，并非所有 API 调用方都需要下单权限。相反，你可以只允许调用方请求查看订单物流状态的权限。换句话说，作用域让应用的用户能够限制第三方应用代表他们执行的操作。

<a name="defining-scopes"></a>
### 定义作用域

你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Passport::tokensCan` 方法定义 API 的作用域。`tokensCan` 方法接受一个由作用域名称和作用域描述组成的数组。作用域描述可以是你任意想要的任何内容，它会显示在授权批准界面上供用户查看：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::tokensCan([
            'place-orders' => 'Place orders',
            'check-status' => 'Check order status',
        ]);
    }

<a name="default-scope"></a>
### 默认作用域

如果客户端没有请求任何特定作用域，可以使用 `setDefaultScope` 方法配置 Passport 服务器，把默认作用域附加到令牌上。通常应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用该方法：

    use Laravel\Passport\Passport;

    Passport::tokensCan([
        'place-orders' => 'Place orders',
        'check-status' => 'Check order status',
    ]);

    Passport::setDefaultScope([
        'check-status',
        'place-orders',
    ]);

> [!NOTE]
> Passport 的默认作用域不适用于由用户生成的个人访问令牌。

<a name="assigning-scopes-to-tokens"></a>
### 为令牌分配作用域

<a name="when-requesting-authorization-codes"></a>
#### 请求授权码时

使用授权码模式请求访问令牌时，调用方应通过 `scope` 查询字符串参数指定其所需的作用域。`scope` 参数应是一个以空格分隔的作用域列表：

    Route::get('/redirect', function () {
        $query = http_build_query([
            'client_id' => 'client-id',
            'redirect_uri' => 'http://example.com/callback',
            'response_type' => 'code',
            'scope' => 'place-orders check-status',
        ]);

        return redirect('http://passport-app.test/oauth/authorize?'.$query);
    });

<a name="when-issuing-personal-access-tokens"></a>
#### 签发个人访问令牌时

如果你使用 `App\Models\User` 模型的 `createToken` 方法签发个人访问令牌，可以把所需作用域的数组作为该方法的第二个参数传入：

    $token = $user->createToken('My Token', ['place-orders'])->accessToken;

<a name="checking-scopes"></a>
### 检查作用域

Passport 包含两个可用于验证传入请求是否使用了拥有指定作用域的令牌完成认证的中间件。要开始使用，请在应用的 `bootstrap/app.php` 文件中定义以下中间件别名：

    use Laravel\Passport\Http\Middleware\CheckForAnyScope;
    use Laravel\Passport\Http\Middleware\CheckScopes;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'scopes' => CheckScopes::class,
            'scope' => CheckForAnyScope::class,
        ]);
    })

<a name="check-for-all-scopes"></a>
#### 检查所有作用域

你可以把 `scopes` 中间件赋给路由，以验证传入请求的访问令牌是否拥有列出的全部作用域：

    Route::get('/orders', function () {
        // 访问令牌同时拥有 "check-status" 与 "place-orders" 作用域...
    })->middleware(['auth:api', 'scopes:check-status,place-orders']);

<a name="check-for-any-scopes"></a>
#### 检查任意作用域

你可以把 `scope` 中间件赋给路由，以验证传入请求的访问令牌是否拥有列出的作用域中的*至少一个*：

    Route::get('/orders', function () {
        // 访问令牌拥有 "check-status" 或 "place-orders" 作用域...
    })->middleware(['auth:api', 'scope:check-status,place-orders']);

<a name="checking-scopes-on-a-token-instance"></a>
#### 在令牌实例上检查作用域

访问令牌认证的请求进入应用后，你仍然可以使用已认证 `App\Models\User` 实例上的 `tokenCan` 方法检查该令牌是否拥有指定作用域：

    use Illuminate\Http\Request;

    Route::get('/orders', function (Request $request) {
        if ($request->user()->tokenCan('place-orders')) {
            // ...
        }
    });

<a name="additional-scope-methods"></a>
#### 其他作用域方法

`scopeIds` 方法会返回所有已定义 ID/名称的数组：

    use Laravel\Passport\Passport;

    Passport::scopeIds();

`scopes` 方法会返回所有已定义作用域的数组，元素为 `Laravel\Passport\Scope` 实例：

    Passport::scopes();

`scopesFor` 方法会返回与给定 ID/名称匹配的 `Laravel\Passport\Scope` 实例数组：

    Passport::scopesFor(['place-orders', 'check-status']);

你可以使用 `hasScope` 方法判断某个作用域是否已定义：

    Passport::hasScope('place-orders');

<a name="consuming-your-api-with-javascript"></a>
## 在 JavaScript 中调用你的 API

构建 API 时，能够从 JavaScript 应用中调用自己的 API 会非常方便。这种 API 开发方式让你的应用可以消费同一个对外分享的 API。你的 Web 应用、移动应用、第三方应用，以及你可能发布到各类包管理器上的 SDK，都可以调用同一个 API。

通常，如果你想从 JavaScript 应用中调用自己的 API，就需要手动向该应用发送访问令牌，并在每次请求应用时都带上它。不过，Passport 自带一个可以替你处理此事的中间件。你只需把 `CreateFreshApiToken` 中间件追加到应用 `bootstrap/app.php` 文件中的 `web` 中间件组：

    use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            CreateFreshApiToken::class,
        ]);
    })

> [!WARNING]
> 你应当确保 `CreateFreshApiToken` 中间件是中间件栈中列出的最后一个中间件。

该中间件会为你的传出响应附加一个 `laravel_token` Cookie。该 Cookie 包含一个经过加密的 JWT，Passport 会用它来认证来自 JavaScript 应用的 API 请求。该 JWT 的有效期与 `session.lifetime` 配置值相同。由于浏览器会自动在后续所有请求中带上该 Cookie，你无需显式传递访问令牌即可请求应用的 API：

    axios.get('/api/user')
        .then(response => {
            console.log(response.data);
        });

<a name="customizing-the-cookie-name"></a>
#### 自定义 Cookie 名称

如有需要，可以使用 `Passport::cookie` 方法自定义 `laravel_token` Cookie 的名称。通常应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用该方法：

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Passport::cookie('custom_name');
    }

<a name="csrf-protection"></a>
#### CSRF 保护

使用这种认证方式时，你需要确保请求中包含有效的 CSRF 令牌请求头。Laravel 默认的 JavaScript 脚手架包含一个 Axios 实例，它会在同源请求中自动使用加密的 `XSRF-TOKEN` Cookie 值发送 `X-XSRF-TOKEN` 请求头。

> [!NOTE]
> 如果你选择发送 `X-CSRF-TOKEN` 请求头而不是 `X-XSRF-TOKEN`，就需要使用 `csrf_token()` 提供的未加密令牌。

<a name="events"></a>
## 事件

Passport 在签发访问令牌和刷新令牌时会触发事件。你可以[监听这些事件](/docs/{{version}}/events)，以清理或撤销数据库中的其他访问令牌：

<div class="overflow-auto">

| 事件名称 |
| --- |
| `Laravel\Passport\Events\AccessTokenCreated` |
| `Laravel\Passport\Events\RefreshTokenCreated` |

</div>

<a name="testing"></a>
## 测试

你可以使用 Passport 的 `actingAs` 方法指定当前已认证用户及其作用域。传给 `actingAs` 方法的第一个参数是用户实例，第二个参数是应授予该用户令牌的作用域数组：

```php tab=Pest
use App\Models\User;
use Laravel\Passport\Passport;

test('servers can be created', function () {
    Passport::actingAs(
        User::factory()->create(),
        ['create-servers']
    );

    $response = $this->post('/api/create-server');

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
use App\Models\User;
use Laravel\Passport\Passport;

public function test_servers_can_be_created(): void
{
    Passport::actingAs(
        User::factory()->create(),
        ['create-servers']
    );

    $response = $this->post('/api/create-server');

    $response->assertStatus(201);
}
```

你可以使用 Passport 的 `actingAsClient` 方法指定当前已认证客户端及其作用域。传给 `actingAsClient` 方法的第一个参数是客户端实例，第二个参数是应授予该客户端令牌的作用域数组：

```php tab=Pest
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

test('orders can be retrieved', function () {
    Passport::actingAsClient(
        Client::factory()->create(),
        ['check-status']
    );

    $response = $this->get('/api/orders');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

public function test_orders_can_be_retrieved(): void
{
    Passport::actingAsClient(
        Client::factory()->create(),
        ['check-status']
    );

    $response = $this->get('/api/orders');

    $response->assertStatus(200);
}
```
