# 重置密码

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
    - [模型准备](#model-preparation)
    - [配置受信任主机](#configuring-trusted-hosts)
- [路由](#routing)
    - [请求密码重置链接](#requesting-the-password-reset-link)
    - [重置密码](#resetting-the-password)
- [删除过期令牌](#deleting-expired-tokens)
- [自定义](#password-customization)

<a name="introduction"></a>
## 简介

大多数 Web 应用都会为用户提供找回遗忘密码的途径。为了避免你在创建每个应用时都手动重新实现这一功能，Laravel 提供了便捷的服务，用于发送密码重置链接以及安全地重置密码。

> [!NOTE]
> 想快速上手？在一个全新的 Laravel 应用中安装 [应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的入门套件会为你搭建整套身份验证系统的脚手架，包括找回遗忘密码的功能。

<a name="configuration"></a>
### 配置

应用的密码重置配置文件存储在 `config/auth.php` 中。请务必查看该文件中可用的配置选项。默认情况下，Laravel 配置为使用 `database` 密码重置驱动。

密码重置的 `driver` 配置选项定义了密码重置数据的存储位置。Laravel 内置了两种驱动：

- `database` - 密码重置数据存储在关系型数据库中。
- `cache` - 密码重置数据存储在某个基于缓存的存储中。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="database"></a>
#### Database

使用默认的 `database` 驱动时，必须创建一张表来存储应用的密码重置令牌。通常，这已包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

<a name="cache"></a>
#### Cache

还有一种用于处理密码重置的缓存驱动，它无需专门的数据库表。缓存条目以用户的邮箱地址作为键，因此请确保你不会在应用的其他地方将邮箱地址用作缓存键：

```php
'passwords' => [
    'users' => [
        'driver' => 'cache',
        'provider' => 'users',
        'store' => 'passwords', // 可选...
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

为了避免 `artisan cache:clear` 命令清空你的密码重置数据，你可以通过 `store` 配置键指定一个单独的缓存存储。该值应对应 `config/cache.php` 配置文件中配置的某个存储。

<a name="model-preparation"></a>
### 模型准备

在使用 Laravel 的密码重置功能之前，应用的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` Trait。通常，新建 Laravel 应用时自动创建的默认 `App\Models\User` 模型已经包含了这个 Trait。

接下来，请确认你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架自带的 `App\Models\User` 模型已经实现了该接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` Trait 来提供实现该接口所需的方法。

<a name="configuring-trusted-hosts"></a>
### 配置受信任主机

默认情况下，无论 HTTP 请求的 `Host` 头内容如何，Laravel 都会响应收到的所有请求。此外，在 Web 请求期间生成应用的绝对 URL 时，也会用到 `Host` 头的值。

通常，你应该配置 Web 服务器（例如 Nginx 或 Apache），只将与给定主机名匹配的请求转发给你的应用。但是，如果你无法直接自定义 Web 服务器，又需要让 Laravel 只响应特定的主机名，可以在应用的 `bootstrap/app.php` 文件中使用 `trustHosts` 中间件方法来实现。当你的应用提供密码重置功能时，这一点尤为重要。

要了解该中间件方法的更多信息，请查阅 [TrustHosts 中间件文档](/docs/{{version}}/requests#configuring-trusted-hosts)。

<a name="routing"></a>
## 路由

要正确实现支持用户重置密码的功能，我们需要定义几个路由。首先，我们需要一对路由来处理用户通过邮箱地址请求密码重置链接的流程。其次，我们还需要一对路由来处理实际的密码重置，即用户访问通过邮件发送给他们的密码重置链接并填写密码重置表单之后的流程。

<a name="requesting-the-password-reset-link"></a>
### 请求密码重置链接

<a name="the-password-reset-link-request-form"></a>
#### 密码重置链接请求表单

首先，我们将定义请求密码重置链接所需的路由。第一步，我们定义一个返回密码重置链接请求表单视图的路由：

```php
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->middleware('guest')->name('password.request');
```

该路由返回的视图中应包含一个带有 `email` 字段的表单，让用户可以为给定的邮箱地址请求密码重置链接。

<a name="password-reset-link-handling-the-form-submission"></a>
#### 处理表单提交

接下来，我们定义一个路由，处理来自「忘记密码」视图的表单提交请求。该路由将负责验证邮箱地址，并向相应的用户发送密码重置请求：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::ResetLinkSent
        ? back()->with(['status' => __($status)])
        : back()->withErrors(['email' => __($status)]);
})->middleware('guest')->name('password.email');
```

在继续之前，让我们仔细分析一下这个路由。首先，请求的 `email` 属性会被验证。接下来，我们将使用 Laravel 内置的「密码代理（password broker）」（通过 `Password` Facade）向用户发送密码重置链接。密码代理会根据给定的字段（此处是邮箱地址）检索用户，并通过 Laravel 内置的[通知系统](/docs/{{version}}/notifications)向用户发送密码重置链接。

`sendResetLink` 方法会返回一个「状态」slug。我们可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数来翻译该状态，从而向用户展示一条关于其请求状态的友好提示。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中包含了状态 slug 每个可能取值对应的条目。

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令来发布它们。

你可能会好奇，调用 `Password` Facade 的 `sendResetLink` 方法时，Laravel 是如何知道要从应用的数据库中检索哪条用户记录的。Laravel 密码代理会利用你身份验证系统的「用户提供者（user provider）」来检索数据库记录。密码代理所使用的用户提供者是在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置的。要了解如何编写自定义用户提供者，请查阅[身份验证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

> [!NOTE]
> 手动实现密码重置时，你需要自行定义视图和路由的内容。如果你希望获得包含所有必要的身份验证与校验逻辑的脚手架，可以了解一下 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="resetting-the-password"></a>
### 重置密码

<a name="the-password-reset-form"></a>
#### 密码重置表单

接下来，我们将定义在用户点击通过邮件收到的密码重置链接并提交新密码后，实际完成密码重置所需的路由。首先，让我们定义一个路由，用于显示用户点击密码重置链接时呈现的重置密码表单。该路由会接收一个 `token` 参数，稍后我们将用它来验证密码重置请求：

```php
Route::get('/reset-password/{token}', function (string $token) {
    return view('auth.reset-password', ['token' => $token]);
})->middleware('guest')->name('password.reset');
```

该路由返回的视图应显示一个表单，其中包含 `email` 字段、`password` 字段、`password_confirmation` 字段，以及一个隐藏的 `token` 字段，`token` 字段的值应为路由收到的密令牌 `$token`。

<a name="password-reset-handling-the-form-submission"></a>
#### 处理表单提交

当然，我们还需要定义一个路由来实际处理密码重置表单的提交。该路由将负责验证传入的请求，并更新该用户在数据库中的密码：

```php
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->setRememberToken(Str::random(60));

            $user->save();

            event(new PasswordReset($user));
        }
    );

    return $status === Password::PasswordReset
        ? redirect()->route('login')->with('status', __($status))
        : back()->withErrors(['email' => [__($status)]]);
})->middleware('guest')->name('password.update');
```

在继续之前，让我们仔细分析一下这个路由。首先，请求的 `token`、`email` 和 `password` 属性会被验证。接下来，我们将使用 Laravel 内置的「密码代理（password broker）」（通过 `Password` Facade）来验证密码重置请求的凭据。

如果提供给密码代理的令牌、邮箱地址和密码都有效，传递给 `reset` 方法的闭包就会被调用。该闭包接收用户实例以及提交到密码重置表单的明文密码，我们可以在闭包中更新该用户在数据库中的密码。

`reset` 方法会返回一个「状态」slug。我们可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数来翻译该状态，从而向用户展示一条关于其请求状态的友好提示。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中包含了状态 slug 每个可能取值对应的条目。如果你的应用没有 `lang` 目录，可以通过 `lang:publish` Artisan 命令创建。

在继续之前，你可能会好奇，调用 `Password` Facade 的 `reset` 方法时，Laravel 是如何知道要从应用的数据库中检索哪条用户记录的。Laravel 密码代理会利用你身份验证系统的「用户提供者（user provider）」来检索数据库记录。密码代理所使用的用户提供者是在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置的。要了解如何编写自定义用户提供者，请查阅[身份验证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

<a name="deleting-expired-tokens"></a>
## 删除过期令牌

如果你使用的是 `database` 驱动，已过期的密码重置令牌仍会留在数据库中。不过，你可以使用 `auth:clear-resets` Artisan 命令轻松删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你想将这一过程自动化，可以考虑把该命令加入应用的[调度器](/docs/{{version}}/scheduling)：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('auth:clear-resets')->everyFifteenMinutes();
```

<a name="password-customization"></a>
## 自定义

<a name="reset-link-customization"></a>
#### 重置链接自定义

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法来自定义密码重置链接的 URL。该方法接收一个闭包，闭包会接收到接收通知的用户实例以及密码重置链接令牌。通常，你应该在应用的 `AppServiceProvider` 的 `boot` 方法中调用该方法：

```php
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    ResetPassword::createUrlUsing(function (User $user, string $token) {
        return 'https://example.com/reset-password?token='.$token;
    });
}
```

<a name="reset-email-customization"></a>
#### 重置邮件自定义

你还可以轻松修改用于向用户发送密码重置链接的通知类。首先，在 `App\Models\User` 模型上重写 `sendPasswordResetNotification` 方法。在该方法中，你可以使用任何由你自己创建的[通知类](/docs/{{version}}/notifications)来发送通知。密码重置的 `$token` 是该方法接收的第一个参数。你可以用这个 `$token` 构建你想要的密码重置 URL，并将通知发送给用户：

```php
use App\Notifications\ResetPasswordNotification;

/**
 * 向用户发送密码重置通知。
 *
 * @param  string  $token
 */
public function sendPasswordResetNotification($token): void
{
    $url = 'https://example.com/reset-password?token='.$token;

    $this->notify(new ResetPasswordNotification($url));
}
```
