# Laravel Socialite

- [简介](#introduction)
- [安装](#installation)
- [升级 Socialite](#upgrading-socialite)
- [配置](#configuration)
- [认证](#authentication)
    - [路由](#routing)
    - [认证与存储](#authentication-and-storage)
    - [访问范围](#access-scopes)
    - [Slack 机器人访问范围](#slack-bot-scopes)
    - [可选参数](#optional-parameters)
- [获取用户详情](#retrieving-user-details)

<a name="introduction"></a>
## 简介

除了常见的基于表单的认证之外，Laravel 还提供了一种简单便捷的方式，让你可以通过 [Laravel Socialite](https://github.com/laravel/socialite) 使用 OAuth 服务商进行认证。Socialite 目前支持通过 Facebook、X、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行认证。

> [!NOTE]
> 其他平台的适配器可以通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 站点获取。

<a name="installation"></a>
## 安装

要开始使用 Socialite，请用 Composer 包管理器把该包添加到项目依赖中：

```shell
composer require laravel/socialite
```

<a name="upgrading-socialite"></a>
## 升级 Socialite

升级到 Socialite 的新主版本时，务必仔细阅读[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

在使用 Socialite 之前，你需要添加应用所使用 OAuth 服务商的凭据。通常，这些凭据可以在你将要进行认证的服务的管理后台中创建"开发者应用"后获取。

这些凭据应放在应用的 `config/services.php` 配置文件中，并根据应用所需的服务商使用 `facebook`、`x`、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket`、`slack` 或 `slack-openid` 键：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]
> 如果 `redirect` 选项包含相对路径，它会被自动解析为完整 URL。

<a name="authentication"></a>
## 认证

<a name="routing"></a>
### 路由

要使用 OAuth 服务商认证用户，你需要两条路由：一条用于把用户重定向到 OAuth 服务商，另一条用于在认证完成后接收来自服务商的回调。下面的示例路由演示了这两条路由的实现方式：

```php
use Laravel\Socialite\Facades\Socialite;

Route::get('/auth/redirect', function () {
    return Socialite::driver('github')->redirect();
});

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // $user->token
});
```

`Socialite` Facade 提供的 `redirect` 方法负责把用户重定向到 OAuth 服务商，而 `user` 方法会检查传入的请求，并在用户批准认证请求后从服务商获取用户信息。

<a name="authentication-and-storage"></a>
### 认证与存储

从 OAuth 服务商获取用户后，你可以判断该用户在应用数据库中是否存在，并[认证该用户](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果该用户在数据库中不存在，通常需要在数据库中新建一条记录来表示该用户：

```php
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

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
> 想了解更多关于特定 OAuth 服务商能提供哪些用户信息，请查阅[获取用户详情](#retrieving-user-details)相关文档。

<a name="access-scopes"></a>
### 访问范围

在重定向用户之前，你可以使用 `scopes` 方法指定认证请求中应包含哪些"访问范围"。该方法会把此前指定的所有访问范围与你新指定的访问范围合并：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖认证请求中已有的全部访问范围：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

<a name="slack-bot-scopes"></a>
### Slack 机器人访问范围

Slack 的 API 提供了[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种令牌都有各自的[权限范围](https://api.slack.com/scopes)。Socialite 同时兼容以下两种 Slack 访问令牌类型：

<div class="content-list" markdown="1">

- 机器人令牌（以 `xoxb-` 开头）
- 用户令牌（以 `xoxp-` 开头）

</div>

默认情况下，`slack` 驱动会生成 `user` 令牌，调用该驱动的 `user` 方法将返回用户详情。

如果你的应用要向由应用用户拥有的外部 Slack 工作区发送通知，机器人令牌会非常有用。要生成机器人令牌，请在把用户重定向到 Slack 进行认证之前调用 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 完成认证并把用户重定向回你的应用之后，你必须先调用 `asBotUser` 方法，再调用 `user` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

生成机器人令牌时，`user` 方法仍然会返回一个 `Laravel\Socialite\Two\User` 实例；不过只有 `token` 属性会被填充。可以存储该令牌，用于[向已认证用户的 Slack 工作区发送通知](/docs/{{version}}/notifications#notifying-external-slack-workspaces)。

<a name="optional-parameters"></a>
### 可选参数

不少 OAuth 服务商支持在重定向请求中使用其他可选参数。要在请求中包含可选参数，请用一个关联数组调用 `with` 方法：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]
> 使用 `with` 方法时，请注意不要传入 `state` 或 `response_type` 等保留关键字。

<a name="retrieving-user-details"></a>
## 获取用户详情

用户被重定向回应用的认证回调路由后，你可以使用 Socialite 的 `user` 方法获取用户详情。`user` 方法返回的用户对象提供了丰富的属性和方法，你可以用它们把用户信息存储到自己的数据库中。

根据你所使用的 OAuth 服务商支持 OAuth 1.0 还是 OAuth 2.0，该对象上可用的属性和方法会有所不同：

```php
use Laravel\Socialite\Facades\Socialite;

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // OAuth 2.0 服务商……
    $token = $user->token;
    $refreshToken = $user->refreshToken;
    $expiresIn = $user->expiresIn;

    // OAuth 1.0 服务商……
    $token = $user->token;
    $tokenSecret = $user->tokenSecret;

    // 所有服务商……
    $user->getId();
    $user->getNickname();
    $user->getName();
    $user->getEmail();
    $user->getAvatar();
});
```

<a name="retrieving-user-details-from-a-token-oauth2"></a>
#### 通过令牌获取用户详情

如果你已经拥有某个用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法获取其用户详情：

```php
use Laravel\Socialite\Facades\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

如果你在 iOS 应用中使用 Facebook Limited Login，Facebook 返回的将是 OIDC 令牌而不是访问令牌。与访问令牌一样，你可以把 OIDC 令牌传给 `userFromToken` 方法来获取用户详情。

<a name="stateless-authentication"></a>
#### 无状态认证

`stateless` 方法可用于关闭会话状态验证。这在把社交认证加入不使用基于 Cookie 的会话的无状态 API 时很有用：

```php
use Laravel\Socialite\Facades\Socialite;

return Socialite::driver('google')->stateless()->user();
```