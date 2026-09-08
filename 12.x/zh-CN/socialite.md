# Laravel Socialite

- [简介](#introduction)
- [安装](#installation)
- [升级 Socialite](#upgrading-socialite)
- [配置](#configuration)
- [身份验证](#authentication)
    - [路由](#routing)
    - [身份验证与存储](#authentication-and-storage)
    - [访问权限范围](#access-scopes)
    - [Slack Bot 权限范围](#slack-bot-scopes)
    - [可选参数](#optional-parameters)
- [检索用户详情](#retrieving-user-details)
- [测试](#testing)

<a name="introduction"></a>
## 简介

除了典型的基于表单的身份验证之外，Laravel 还通过 [Laravel Socialite](https://github.com/laravel/socialite) 提供了一种简单、便捷的方式，用于通过 OAuth 提供商进行身份验证。Socialite 目前支持通过 Facebook、X、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行身份验证。

> [!NOTE]
> 其他平台的适配器可通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站获取。

<a name="installation"></a>
## 安装

开始使用 Socialite 之前，请使用 Composer 包管理器将该扩展包添加到项目的依赖中：

```shell
composer require laravel/socialite
```

<a name="upgrading-socialite"></a>
## 升级 Socialite

升级到 Socialite 的新主版本时，请务必仔细阅读[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

在使用 Socialite 之前，你需要为应用所使用的 OAuth 提供商添加凭据。通常，你可以通过在要身份验证的服务的控制面板中创建一个「开发者应用」来获取这些凭据。

这些凭据应放置在应用的 `config/services.php` 配置文件中，并根据应用所需的提供商，使用 `facebook`、`x`、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket`、`slack` 或 `slack-openid` 作为键名：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]
> 如果 `redirect` 选项包含相对路径，它会被自动解析为完整的 URL。

<a name="authentication"></a>
## 身份验证

<a name="routing"></a>
### 路由

要使用 OAuth 提供商对用户进行身份验证，你需要两个路由：一个用于将用户重定向到 OAuth 提供商，另一个用于在身份验证完成后接收来自提供商的回调。下面的示例路由演示了这两个路由的实现：

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

`Socialite` Facade 提供的 `redirect` 方法负责将用户重定向到 OAuth 提供商，而 `user` 方法会检查传入的请求，并在用户批准身份验证请求后从提供商处检索用户信息。

<a name="authentication-and-storage"></a>
### 身份验证与存储

从 OAuth 提供商处检索到用户之后，你可以判断该用户是否存在于应用的数据库中，并[对该用户进行身份验证](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果该用户不存在于应用的数据库中，通常你需要在数据库中创建一条新记录来表示该用户：

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
> 关于各个 OAuth 提供商能提供哪些用户信息的更多细节，请查阅[检索用户详情](#retrieving-user-details)部分的文档。

<a name="access-scopes"></a>
### 访问权限范围

在重定向用户之前，你可以使用 `scopes` 方法指定身份验证请求中应包含的「权限范围（scope）」。该方法会将此前指定的所有权限范围与你指定的权限范围合并：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖身份验证请求中的所有现有权限范围：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

<a name="slack-bot-scopes"></a>
### Slack Bot 权限范围

Slack 的 API 提供了[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种令牌都有自己的一组[权限范围](https://api.slack.com/scopes)。Socialite 兼容以下两种 Slack 访问令牌类型：

- Bot（以 `xoxb-` 为前缀）
- User（以 `xoxp-` 为前缀）

默认情况下，`slack` 驱动会生成 `user` 令牌，调用该驱动的 `user` 方法将返回用户的详细信息。

如果你的应用要向应用用户所拥有的外部 Slack 工作区发送通知，那么 Bot 令牌会非常有用。要生成 Bot 令牌，请在将用户重定向到 Slack 进行身份验证之前调用 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 完成身份验证并将用户重定向回你的应用后，你必须在调用 `user` 方法之前先调用 `asBotUser` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

生成 Bot 令牌时，`user` 方法仍会返回一个 `Laravel\Socialite\Two\User` 实例；不过，其中只有 `token` 属性会被填充。你可以存储该令牌，以便[向已完成身份验证的用户的 Slack 工作区发送通知](/docs/{{version}}/notifications#notifying-external-slack-workspaces)。

<a name="optional-parameters"></a>
### 可选参数

许多 OAuth 提供商支持在重定向请求中传递其他可选参数。要在请求中包含任何可选参数，请调用 `with` 方法并传入一个关联数组：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]
> 使用 `with` 方法时，请注意不要传入任何保留关键字，例如 `state` 或 `response_type`。

<a name="retrieving-user-details"></a>
## 检索用户详情

用户被重定向回应用的身份验证回调路由后，你可以使用 Socialite 的 `user` 方法检索用户的详细信息。`user` 方法返回的用户对象提供了多种属性和方法，方便你将用户信息存储到自己的数据库中。

根据你进行身份验证的 OAuth 提供商支持 OAuth 1.0 还是 OAuth 2.0，该对象上可用的属性和方法可能有所不同：

```php
use Laravel\Socialite\Socialite;

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // OAuth 2.0 提供商...
    $token = $user->token;
    $refreshToken = $user->refreshToken;
    $expiresIn = $user->expiresIn;

    // OAuth 1.0 提供商...
    $token = $user->token;
    $tokenSecret = $user->tokenSecret;

    // 所有提供商...
    $user->getId();
    $user->getNickname();
    $user->getName();
    $user->getEmail();
    $user->getAvatar();
});
```

<a name="retrieving-user-details-from-a-token-oauth2"></a>
#### 从令牌检索用户详情

如果你已经拥有某个用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法检索该用户的详细信息：

```php
use Laravel\Socialite\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

如果你通过 iOS 应用使用 Facebook Limited Login，Facebook 将返回 OIDC 令牌而不是访问令牌。与访问令牌一样，OIDC 令牌也可以传递给 `userFromToken` 方法来检索用户详情。

<a name="stateless-authentication"></a>
#### 无状态身份验证

`stateless` 方法可用于禁用 session 状态校验。当你要向不使用基于 cookie 的 session 的无状态 API 添加社交身份验证时，这个方法非常实用：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')->stateless()->user();
```

<a name="testing"></a>
## 测试

Laravel Socialite 提供了一种便捷的方式来测试 OAuth 身份验证流程，而无需向 OAuth 提供商发送实际请求。`fake` 方法允许你模拟 OAuth 提供商的行为，并定义应返回的用户数据。

<a name="faking-the-redirect"></a>
#### 模拟重定向

要测试应用是否能正确地将用户重定向到 OAuth 提供商，你可以在请求重定向路由之前调用 `fake` 方法。这会让 Socialite 返回一个指向伪造授权 URL 的重定向，而不是重定向到真实的 OAuth 提供商：

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

要测试应用的回调路由，你可以调用 `fake` 方法并提供一个 `User` 实例，该实例会在应用向提供商请求用户详情时被返回。`User` 实例可以使用 `map` 方法创建：

```php
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\User;

test('user can login with github', function () {
    Socialite::fake('github', (new User)->map([
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

默认情况下，`User` 实例还会包含一个 `token` 属性。如有需要，你可以在 `User` 实例上手动指定其他属性：

```php
$fakeUser = (new User)->map([
    'id' => 'github-123',
    'name' => 'Jason Beggs',
    'email' => 'jason@example.com',
])->setToken('fake-token')
  ->setRefreshToken('fake-refresh-token')
  ->setExpiresIn(3600)
  ->setApprovedScopes(['read', 'write'])
```
