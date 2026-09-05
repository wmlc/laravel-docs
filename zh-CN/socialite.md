# Laravel Socialite

## 简介

除了典型的基于表单的身份验证外，Laravel 还提供了一种简单便捷的方式，通过 [Laravel Socialite](https://github.com/laravel/socialite) 使用 OAuth 提供方进行身份验证。Socialite 目前支持通过 Facebook、X、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行身份验证。

> [!NOTE]
> 其他平台的适配器可通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站获取。

## 安装

要开始使用 Socialite，请使用 Composer 包管理器将该包添加到项目的依赖中：

```shell
composer require laravel/socialite
```

## 升级 Socialite

升级到 Socialite 新的主版本时，请务必仔细查看 [升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

## 配置

在使用 Socialite 之前，你需要为应用程序所使用的 OAuth 提供方添加凭据。通常，你可以在所使用服务的控制台中创建一个"开发者应用"来获取这些凭据。

这些凭据应放置在应用程序的 `config/services.php` 配置文件中，并根据应用所需的提供方使用 `facebook`、`x`、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket`、`slack` 或 `slack-openid` 作为键名：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]
> 如果 `redirect` 选项包含相对路径，它会自动解析为完全限定的 URL。

## 认证

### 路由

要使用 OAuth 提供方对用户进行身份验证，你需要两条路由：一条用于将用户重定向到 OAuth 提供方，另一条用于在身份验证完成后接收来自提供方的回调。下面的示例路由展示了这两条路由的实现：

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

`Socialite` Facade 提供的 `redirect` 方法负责将用户重定向到 OAuth 提供方，而 `user` 方法会检查传入的 请求，并在用户批准身份验证请求后从提供方获取用户的信息。

### 认证与存储

从 OAuth 提供方获取用户后，你可以判断该用户是否存在于应用程序的数据库中，并[对用户进行身份验证](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果用户不存在于应用程序的数据库中，你通常会创建一条新的数据库记录来表示该用户：

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
> 关于特定 OAuth 提供方可用的用户信息，请查阅 [获取用户详情](#retrieving-user-details) 的相关文档。

### 访问作用域

在重定向用户之前，你可以使用 `scopes` 方法指定应包含在身份验证请求中的"作用域（scopes）"。该方法会将之前指定的所有作用域与你指定的作用域合并：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖身份验证请求上的所有现有作用域：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

### Slack 机器人权限范围

Slack 的 API 提供了[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种令牌都有自己的一组[权限作用域](https://api.slack.com/scopes)。Socialite 兼容以下两种 Slack 访问令牌类型：

- Bot（以 `xoxb-` 为前缀）
- User（以 `xoxp-` 为前缀）

默认情况下，`slack` 驱动会生成 `user` 令牌，调用驱动的 `user` 方法将返回用户的详情。

如果你的应用程序需要向用户所拥有的外部 Slack 工作区发送通知，那么 Bot 令牌会非常有用。要生成 Bot 令牌，请在将用户重定向到 Slack 进行身份验证之前调用驱动的 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 将用户重定向回你的应用程序后，你必须在调用 `user` 方法之前调用 `asBotUser` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

生成 Bot 令牌时，`user` 方法仍会返回一个 `Laravel\Socialite\Two\User` 实例；但只有 `token` 属性会被填充。该令牌可以存储起来，以便[向已验证用户的 Slack 工作区发送通知](/docs/{{version}}/notifications#notifying-external-slack-workspaces)。

### 可选参数

许多 OAuth 提供方支持在重定向请求上附加其他可选参数。要在请求中包含任何可选参数，请调用 `with` 方法并传入关联数组：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]
> 使用 `with` 方法时，注意不要传入 `state` 或 `response_type` 等保留关键字。

## 获取用户详情

用户被重定向回应用程序的身份验证回调路由后，你可以使用 Socialite 的 `user` 方法获取用户的详情。`user` 方法返回的用户对象提供了多种属性和方法，你可以用来将用户信息存储到自己的数据库中。

根据你所验证的 OAuth 提供方支持的是 OAuth 1.0 还是 OAuth 2.0，该对象上可用的属性和方法会有所不同：

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

#### 从令牌获取用户详情

如果你已经拥有某个用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法获取该用户的详情：

```php
use Laravel\Socialite\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

如果你通过 iOS 应用使用 Facebook Limited Login，Facebook 会返回一个 OIDC 令牌而非访问令牌。要从 OIDC 令牌中获取用户详情，请向 `userFromToken` 方法提供用于发起登录的 nonce：

```php
$user = Socialite::driver('facebook')->userFromToken($token, $nonce);
```

#### 无状态认证

`stateless` 方法可用于禁用会话状态验证。当你在基于无状态 API 且不使用基于 Cookie 的会话的应用中添加社交身份验证时，这会很有用：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')->stateless()->user();
```

## 测试

Laravel Socialite 提供了一种便捷的方式，可以在不向 OAuth 提供方发出实际请求的情况下测试 OAuth 身份验证流程。`fake` 方法允许你模拟 OAuth 提供方的行为，并定义应当返回的用户数据。

#### 伪造重定向

要测试你的应用程序是否正确将用户重定向到 OAuth 提供方，可以在向重定向路由发出请求之前调用 `fake` 方法。这会使 Socialite 返回一个指向伪造授权 URL 的重定向，而不是重定向到真实的 OAuth 提供方：

```php
use Laravel\Socialite\Socialite;

test('user is redirected to github', function () {
    Socialite::fake('github');

    $response = $this->get('/auth/github/redirect');

    $response->assertRedirect();
});
```

#### 伪造回调

要测试应用程序的回调路由，你可以调用 `fake` 方法，并提供一个当应用程序向提供方请求用户详情时应返回的 `User` 实例。该 `User` 实例可以使用 `fake` 方法创建：

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

默认情况下，`User` 实例会包含伪造的 OAuth 令牌值。如果需要，你可以通过向 `fake` 方法传入额外的属性来覆盖这些值：

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

OAuth 1 用户可以使用 `Laravel\Socialite\One\User` 类进行伪造。
