# 重置密码

## 简介

大多数 Web 应用都会提供一种让用户重置忘记密码的方式。Laravel 提供了便捷的服务来发送密码重置链接以及安全地重置密码，而不需要你为每个创建的应用手动重新实现。

> [!NOTE]
> 想快速上手？在全新的 Laravel 应用中安装一个 Laravel [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。Laravel 的入门套件会负责搭建你的整个认证系统，包括重置忘记的密码。

### 配置

应用的密码重置配置文件存放在 `config/auth.php`。请务必查看此文件中可供你使用的选项。默认情况下，Laravel 配置为使用 `database` 密码重置驱动。

密码重置 `driver` 配置项定义了密码重置数据的存储位置。Laravel 包含两个驱动：

- `database` - 密码重置数据存储在关系型数据库中。
- `cache` - 密码重置数据存储在基于缓存的存储之一。

### 驱动前置条件

#### 数据库

使用默认的 `database` 驱动时，必须创建一张表来存储应用的密码重置令牌（token）。通常，该表已包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

#### 缓存

还有一个可用于处理密码重置的缓存驱动，它不需要专门的数据库表。条目以用户的邮箱地址作为键，因此请确保你不会在应用的其他地方将邮箱地址用作缓存键：

```php
'passwords' => [
    'users' => [
        'driver' => 'cache',
        'provider' => 'users',
        'store' => 'passwords', // 可选……
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

为了防止调用 `artisan cache:clear` 时清空你的密码重置数据，你可以选择使用 `store` 配置键指定一个单独的缓存存储。该值应对应你的 `config/cache.php` 配置值中配置的一个存储。

### 模型准备

在使用 Laravel 的密码重置功能之前，应用的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` Trait。通常，使用新 Laravel 应用创建的默认 `App\Models\User` 模型已经包含了此 Trait。

接下来，验证你的 `App\Models\User` 模型是否实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架自带的 `App\Models\User` 模型已经实现了此接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` Trait 来包含实现该接口所需的方法。

### 配置可信主机

默认情况下，Laravel 会响应它收到的所有请求，无论 HTTP 请求的 `Host` 头内容如何。此外，在 Web 请求期间生成应用的绝对 URL 时，会使用 `Host` 头的值。

通常，你应当配置你的 Web 服务器（如 Nginx 或 Apache），使其只将匹配给定主机名的请求发送到你的应用。但是，如果你无法直接自定义 Web 服务器，并且需要指示 Laravel 只响应某些主机名，可以通过在应用的 `bootstrap/app.php` 文件中使用 `trustHosts` 中间件方法来做到这一点。当你的应用提供密码重置功能时，这一点尤为重要。

要了解有关该中间件方法的更多信息，请查阅 [TrustHosts 中间件文档](/topic/Laravel%2013.x/2ky040l9z8.html)。

## 路由

为了正确实现对允许用户重置密码的支持，我们需要定义若干路由。首先，我们需要一对路由来处理允许用户通过邮箱地址请求密码重置链接。其次，我们需要一对路由来处理在用户访问通过邮件发给他们的密码重置链接并完成密码重置表单后，实际重置密码。

### 请求密码重置链接

#### 密码重置链接请求表单

首先，我们定义请求密码重置链接所需的路由。开始之前，我们先定义一个返回带密码重置链接请求表单的视图的路由：

```php
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->middleware('guest')->name('password.request');
```

该路由返回的视图应当有一个包含 `email` 字段的表单，该字段允许用户为给定的邮箱地址请求密码重置链接。

#### 处理表单提交

接下来，我们定义一个处理来自"忘记密码"视图的表单提交请求的路由。该路由将负责验证邮箱地址，并将密码重置请求发送给相应的用户：

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

在继续之前，让我们更详细地检查一下这条路由。首先，验证请求的 `email` 属性。接下来，我们将使用 Laravel 内置的"密码代理（password broker）"（通过 `Password` Facade）向用户发送密码重置链接。密码代理（password broker）会负责通过给定字段（在本例中是邮箱地址）检索用户，并通过 Laravel 内置的[通知系统](/topic/Laravel%2013.x/2ky045l9z8.html)向用户发送密码重置链接。

`sendResetLink` 方法返回一个"status"slug（状态标识）。可以使用 Laravel 的[本地化](/topic/Laravel%2013.x/kpv13q298w.html)辅助函数翻译此状态，以便向用户显示有关其请求状态的友好消息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。该 `passwords` 语言文件中包含了状态 slug 每个可能取值的条目。

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你希望自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

你可能会疑惑，在调用 `Password` Facade 的 `sendResetLink` 方法时，Laravel 是如何知道如何从应用的数据库检索用户记录的。Laravel 密码代理（password broker）利用你的认证系统的"用户提供者（user provider）"来检索数据库记录。密码代理（password broker）使用的用户提供者（user provider）在你的 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者（user provider）的更多信息，请查阅 [authentication documentation](/topic/Laravel%2013.x/xq9zrgjvdo.html)。

> [!NOTE]
> 手动实现密码重置时，你需要自行定义视图和路由的内容。如果你希望包含全部必要认证与验证逻辑的脚手架，请查看 [Laravel 应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html)。

### 重置密码

#### 密码重置表单

接下来，我们定义所需的路由，以便在用户点击通过邮件发给他们的密码重置链接并提供新密码后，实际重置密码。首先，我们定义一条路由，用于显示用户点击重置密码链接时显示的密码重置表单。该路由会接收一个 `token` 参数，我们稍后将用它来验证密码重置请求：

```php
Route::get('/reset-password/{token}', function (string $token) {
    return view('auth.reset-password', ['token' => $token]);
})->middleware('guest')->name('password.reset');
```

该路由返回的视图应当显示一个表单，包含 `email` 字段、`password` 字段、`password_confirmation` 字段，以及一个隐藏的 `token` 字段，该字段应包含我们路由收到的机密 `$token` 的值。

#### 处理表单提交

当然，我们需要定义一条路由来实际处理密码重置表单的提交。该路由将负责验证传入请求并更新数据库中的用户密码：

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

在继续之前，让我们更详细地检查一下这条路由。首先，验证请求的 `token`、`email` 和 `password` 属性。接下来，我们将使用 Laravel 内置的"密码代理（password broker）"（通过 `Password` Facade）来验证密码重置请求的凭据。

如果提供给密码代理（password broker）的令牌、邮箱地址和密码有效，就会调用传给 `reset` 方法的闭包。在这个接收用户实例和密码重置表单提供的明文密码的闭包中，我们可以更新数据库中的用户密码。

`reset` 方法返回一个"status"slug（状态标识）。可以使用 Laravel 的[本地化](/topic/Laravel%2013.x/kpv13q298w.html)辅助函数翻译此状态，以便向用户显示有关其请求状态的友好消息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。该 `passwords` 语言文件中包含了状态 slug 每个可能取值的条目。如果你的应用不包含 `lang` 目录，可以使用 `lang:publish` Artisan 命令创建它。

在继续之前，你可能会疑惑，在调用 `Password` Facade 的 `reset` 方法时，Laravel 是如何知道如何从应用的数据库检索用户记录的。Laravel 密码代理（password broker）利用你的认证系统的"用户提供者（user provider）"来检索数据库记录。密码代理（password broker）使用的用户提供者（user provider）在你的 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者（user provider）的更多信息，请查阅 [authentication documentation](/topic/Laravel%2013.x/xq9zrgjvdo.html)。

## 删除过期令牌

如果你使用 `database` 驱动，已过期的密码重置令牌仍会保留在你的数据库中。不过，你可以使用 `auth:clear-resets` Artisan 命令轻松删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你希望将此过程自动化，可以考虑将该命令添加到应用的 [scheduler](/topic/Laravel%2013.x/e296olw9q7.html)（调度器）中：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('auth:clear-resets')->everyFifteenMinutes();
```

## 自定义

#### 自定义重置链接

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法自定义密码重置链接的 URL。该方法接受一个闭包，该闭包接收收到通知的用户实例以及密码重置链接令牌。通常，你应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用此方法：

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

#### 自定义重置邮件

你可以轻松修改用于向用户发送密码重置链接的通知类。开始之前，在你 `App\Models\User` 模型上重写 `sendPasswordResetNotification` 方法。在该方法中，你可以使用你自己创建的任何[通知类](/topic/Laravel%2013.x/2ky045l9z8.html)发送通知。密码重置 `$token` 是该方法接收的第一个参数。你可以使用此 `$token` 构建你选择的密码重置 URL，并向用户发送通知：

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
