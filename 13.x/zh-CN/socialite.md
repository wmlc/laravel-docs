# Laravel Socialite

- [简介](#introduction)
- [安装](#installation)
- [升级 Socialite](#upgrading-socialite)
- [配置](#configuration)
- [认证](#authentication)
    - [路由](#routing)
    - [认证与存储](#authentication-and-storage)
    - [访问作用域](#access-scopes)
    - [Slack Bot 作用域](#slack-bot-scopes)
    - [可选参数](#optional-parameters)
- [检索用户详情](#retrieving-user-details)
- [测试](#testing)

<a name="introduction"></a>
## 简介

除了典型的基于表单的认证之外，Laravel 还提供了一种简单、便捷的方式，通过 [Laravel Socialite](https://github.com/laravel/socialite) 使用 OAuth 提供方进行认证。Socialite 目前支持通过 Facebook、X、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行认证。

> [!NOTE]
> 其他平台的适配器可通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站获取。

<a name="installation"></a>
## 安装

要开始使用 Socialite，请使用 Composer 包管理器将该包添加到项目的依赖中：

```shell
composer require laravel/socialite
```

<a name="upgrading-socialite"></a>
## 升级 Socialite

升级到 Socialite 的新主版本时，务必仔细阅读[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

使用 Socialite 之前，你需要为应用使用的 OAuth 提供方添加凭据。通常，这些凭据可以通过在将要进行认证的服务的仪表板中创建"开发者应用"来获取。

这些凭据应放置在应用的 `config/services.php` 配置文件中，并应根据应用所需的提供方使用 `facebook`、`x`、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket`、`slack` 或 `slack-openid` 键：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]
> 如果 `redirect` 选项包含相对路径，它将自动被解析为完整的 URL。

<a name="authentication"></a>
## 认证

<a name="routing"></a>
### 路由

要使用 OAuth 提供方认证用户，你需要两个路由：一个用于将用户重定向到 OAuth 提供方，另一个用于在认证后接收来自提供方的回调。下面的示例路由演示了两个路由的实现：

```php
use Laravel\Socialite\Socialite;

Route::get('/auth/redirect', function () {
    return Socialite::driver('github')->redirect();
});

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // $user->token
});
```

`Socialite` Facade 提供的 `redirect` 方法负责将用户重定向到 OAuth 提供方，而 `user` 方法将检查传入请求，并在用户批准认证请求后从提供方检索用户信息。

<a name="authentication-and-storage"></a>
### 认证与存储

从 OAuth 提供方检索到用户后，你可以判断用户是否存在于应用的数据库中，并[认证该用户](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果用户不存在于应用的数据库中，你通常会在数据库中创建一条新记录来表示该用户：

```php
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Socialite;

Route::get('/auth/callback', function () {
    $githubUser = Socialite::driver('github')->user();

    $user = User::updateOrCreate([
        'github_id' => $githubUser->id,
    ], [
        'name' => $githubUser->name,
        'email' => $githubUser->email,
        'github_token' => $githubUser->token,
        'github_refresh_token' => $githubUser->refreshToken,
    ]);

    Auth::login($user);

    return redirect('/dashboard');
});
```

> [!NOTE]
> 有关特定 OAuth 提供方可用用户信息的更多信息，请查阅[检索用户详情](#retrieving-user-details)文档。

<a name="access-scopes"></a>
### 访问作用域

在重定向用户之前，你可以使用 `scopes` 方法指定应包含在认证请求中的"作用域"。此方法会将所有先前指定的作用域与你指定的作用域合并：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖认证请求上的所有现有作用域：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

<a name="slack-bot-scopes"></a>
### Slack Bot 作用域

Slack 的 API 提供[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种都有自己的[权限作用域](https://api.slack.com/scopes)集。Socialite 兼容以下两种 Slack 访问令牌类型：

<div class="content-list" markdown="1">

- Bot（以 `xoxb-` 为前缀）
- User（以 `xoxp-` 为前缀）

</div>

默认情况下，`slack` 驱动会生成一个 `user` 令牌，调用驱动的 `user` 方法将返回用户的详情。

Bot 令牌主要在你的应用将向应用用户拥有的外部 Slack 工作区发送通知时有用。要生成 bot 令牌，请在将用户重定向到 Slack 进行认证之前调用 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 认证后将用户重定向回你的应用后，你必须在调用 `user` 方法之前调用 `asBotUser` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

生成 bot 令牌时，`user` 方法仍会返回一个 `Laravel\Socialite\Two\User` 实例；但是，只有 `token` 属性会被填充。可以存储此令牌，以便[向已认证用户的 Slack 工作区发送通知](/docs/{{version}}/notifications#notifying-external-slack-workspaces)。

<a name="optional-parameters"></a>
### 可选参数

许多 OAuth 提供方支持重定向请求上的其他可选参数。要在请求中包含任何可选参数，请使用关联数组调用 `with` 方法：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]
> 使用 `with` 方法时，注意不要传递 `state` 或 `response_type` 等保留关键字。

<a name="retrieving-user-details"></a>
## 检索用户详情

用户被重定向回应用的认证回调路由后，你可以使用 Socialite 的 `user` 方法检索用户的详情。`user` 方法返回的用户对象提供了多种属性和方法，你可以用来在自己的数据库中存储有关用户的信息。

根据你进行认证的 OAuth 提供方支持 OAuth 1.0 还是 OAuth 2.0，此对象上可能提供不同的属性和方法：

```php
use Laravel\Socialite\Socialite;

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // OAuth 2.0 providers...
    $token = $user->token;
    $refreshToken = $user->refreshToken;
    $expiresIn = $user->expiresIn;

    // OAuth 1.0 providers...
    $token = $user->token;
    $tokenSecret = $user->tokenSecret;

    // All providers...
    $user->getId();
    $user->getNickname();
    $user->getName();
    $user->getEmail();
    $user->getAvatar();
});
```

<a name="retrieving-user-details-from-a-token-oauth2"></a>
#### 从令牌检索用户详情

如果你已经拥有某个用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法检索其用户详情：

```php
use Laravel\Socialite\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

如果你通过 iOS 应用使用 Facebook Limited Login，Facebook 将返回一个 OIDC 令牌而不是访问令牌。要从 OIDC 令牌检索用户详情，请向 `userFromToken` 方法提供用于发起登录的 nonce：

```php
$user = Socialite::driver('facebook')->userFromToken($token, $nonce);
```

<a name="stateless-authentication"></a>
#### 无状态认证

`stateless` 方法可用于禁用会话状态验证。在将社交认证添加到不使用基于 Cookie 会话的无状态 API 时，这很有用：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')->stateless()->user();
```

<a name="testing"></a>
## 测试

Laravel Socialite 提供了一种便捷的方式来测试 OAuth 认证流程，而无需向 OAuth 提供方发出实际请求。`fake` 方法允许你模拟 OAuth 提供方的行为，并定义应返回的用户数据。

<a name="faking-the-redirect"></a>
#### 模拟重定向

要测试你的应用是否正确地将用户重定向到 OAuth 提供方，你可以在向重定向路由发出请求之前调用 `fake` 方法。这将使 Socialite 返回一个指向假授权 URL 的重定向，而不是重定向到实际的 OAuth 提供方：

```php
use Laravel\Socialite\Socialite;

test('user is redirected to github', function () {
    Socialite::fake('github');

    $response = $this->get('/auth/github/redirect');

    $response->assertRedirect();
});
```

<a name="faking-the-callback"></a>
#### 模拟回调

要测试应用的回调路由，你可以调用 `fake` 方法并提供一个 `User` 实例，当你的应用向提供方请求用户详情时应返回该实例。`User` 实例可以使用 `fake` 方法创建：

```php
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\User;

test('user can login with github', function () {
    Socialite::fake('github', User::fake([
        'id' => 'github-123',
        'name' => 'Jason Beggs',
        'email' => 'jason@example.com',
    ]));

    $response = $this->get('/auth/github/callback');

    $response->assertRedirect('/dashboard');

    $this->assertDatabaseHas('users', [
        'name' => 'Jason Beggs',
        'email' => 'jason@example.com',
        'github_id' => 'github-123',
    ]);
});
```

默认情况下，`User` 实例将包含假的 OAuth 令牌值。如有需要，你可以通过向 `fake` 方法传递额外属性来覆盖这些值：

```php
$fakeUser = User::fake([
    'id' => 'github-123',
    'name' => 'Jason Beggs',
    'email' => 'jason@example.com',
    'token' => 'fake-token',
    'refreshToken' => 'fake-refresh-token',
    'expiresIn' => 3600,
    'approvedScopes' => ['read', 'write'],
]);
```

OAuth 1 用户可以使用 `Laravel\Socialite\One\User` 类进行模拟。
