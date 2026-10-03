# Laravel Socialite

- [简介](#introduction)
- [安装](#installation)
- [升级 Socialite](#upgrading-socialite)
- [配置](#configuration)
- [认证](#authentication)
    - [路由](#routing)
    - [认证与存储](#authentication-and-storage)
    - [访问范围](#access-scopes)
    - [可选参数](#optional-parameters)
- [获取用户详情](#retrieving-user-details)

<a name="introduction"></a>
## 简介

除了传统的基于表单的认证之外，Laravel 还通过 [Laravel Socialite](https://github.com/laravel/socialite) 提供了一种简单便捷的方式，使用 OAuth 提供者进行认证。Socialite 目前支持通过 Facebook、Twitter、LinkedIn、Google、GitHub、GitLab 和 Bitbucket 进行认证。

> **Note**  
> 其他平台的适配器可通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站获取。

<a name="installation"></a>
## 安装

要开始使用 Socialite，请使用 Composer 包管理器将该包添加到项目的依赖中：

```shell
composer require laravel/socialite
```

<a name="upgrading-socialite"></a>
## 升级 Socialite

升级到 Socialite 的新主版本时，请务必仔细查阅[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)。

<a name="configuration"></a>
## 配置

在使用 Socialite 之前，你需要为应用程序使用的 OAuth 提供者添加凭据。通常，可以通过在要进行认证的服务的控制面板中创建"开发者应用"来获取这些凭据。

这些凭据应放在应用程序的 `config/services.php` 配置文件中，并根据应用程序所需的提供者使用 `facebook`、`twitter`（OAuth 1.0）、`twitter-oauth-2`（OAuth 2.0）、`linkedin`、`google`、`github`、`gitlab` 或 `bitbucket` 键：

    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => 'http://example.com/callback-url',
    ],

> **Note**  
> 如果 `redirect` 选项包含相对路径，它将自动解析为完全限定的 URL。

<a name="authentication"></a>
## 认证

<a name="routing"></a>
### 路由

要使用 OAuth 提供者对用户进行认证，你需要两条路由：一条用于将用户重定向到 OAuth 提供者，另一条用于在认证后接收提供者的回调。下面的示例路由演示了这两条路由的实现：

    use Laravel\Socialite\Facades\Socialite;

    Route::get('/auth/redirect', function () {
        return Socialite::driver('github')->redirect();
    });

    Route::get('/auth/callback', function () {
        $user = Socialite::driver('github')->user();

        // $user->token
    });

`Socialite` Facade 提供的 `redirect` 方法负责将用户重定向到 OAuth 提供者，而 `user` 方法将检查传入请求，并在用户批准认证请求后从提供者获取用户信息。

<a name="authentication-and-storage"></a>
### 认证与存储

从 OAuth 提供者获取用户后，你可以判断该用户是否存在于应用程序的数据库中，并[对该用户进行认证](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果用户不存在于应用程序的数据库中，通常需要在数据库中创建一条新记录来表示该用户：

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

> **Note**  
> 有关从特定 OAuth 提供者可获取哪些用户信息的更多详情，请查阅[获取用户详情](#retrieving-user-details)文档。

<a name="access-scopes"></a>
### 访问范围

在重定向用户之前，你可以使用 `scopes` 方法指定应包含在认证请求中的"范围"。此方法会将之前指定的所有范围与你指定的范围合并：

    use Laravel\Socialite\Facades\Socialite;

    return Socialite::driver('github')
        ->scopes(['read:user', 'public_repo'])
        ->redirect();

可以使用 `setScopes` 方法覆盖认证请求上的所有现有范围：

    return Socialite::driver('github')
        ->setScopes(['read:user', 'public_repo'])
        ->redirect();

<a name="optional-parameters"></a>
### 可选参数

许多 OAuth 提供者支持在重定向请求上添加其他可选参数。要在请求中包含任何可选参数，请使用关联数组调用 `with` 方法：

    use Laravel\Socialite\Facades\Socialite;

    return Socialite::driver('google')
        ->with(['hd' => 'example.com'])
        ->redirect();

> **Warning**  
> 使用 `with` 方法时，请注意不要传递任何保留关键字，如 `state` 或 `response_type`。

<a name="retrieving-user-details"></a>
## 获取用户详情

用户被重定向回应用程序的认证回调路由后，你可以使用 Socialite 的 `user` 方法获取用户详情。`user` 方法返回的用户对象提供了多种属性和方法，可用于在数据库中存储用户信息。

根据你进行认证的 OAuth 提供者支持 OAuth 1.0 还是 OAuth 2.0，此对象上可用的属性和方法可能有所不同：

    use Laravel\Socialite\Facades\Socialite;

    Route::get('/auth/callback', function () {
        $user = Socialite::driver('github')->user();

        // OAuth 2.0 提供者...
        $token = $user->token;
        $refreshToken = $user->refreshToken;
        $expiresIn = $user->expiresIn;

        // OAuth 1.0 提供者...
        $token = $user->token;
        $tokenSecret = $user->tokenSecret;

        // 所有提供者...
        $user->getId();
        $user->getNickname();
        $user->getName();
        $user->getEmail();
        $user->getAvatar();
    });

<a name="retrieving-user-details-from-a-token-oauth2"></a>
#### 从令牌获取用户详情（OAuth2）

如果你已经拥有用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法获取用户详情：

    use Laravel\Socialite\Facades\Socialite;

    $user = Socialite::driver('github')->userFromToken($token);

<a name="retrieving-user-details-from-a-token-and-secret-oauth1"></a>
#### 从令牌和密钥获取用户详情（OAuth1）

如果你已经拥有用户的有效令牌和密钥，可以使用 Socialite 的 `userFromTokenAndSecret` 方法获取用户详情：

    use Laravel\Socialite\Facades\Socialite;

    $user = Socialite::driver('twitter')->userFromTokenAndSecret($token, $secret);

<a name="stateless-authentication"></a>
#### 无状态认证

`stateless` 方法可用于禁用会话状态验证。这在向不使用基于 cookie 的会话的无状态 API 添加社交认证时非常有用：

    use Laravel\Socialite\Facades\Socialite;

    return Socialite::driver('google')->stateless()->user();

> **Warning**  
> Twitter OAuth 1.0 驱动不支持无状态认证。
