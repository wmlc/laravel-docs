# 重置密码

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
    - [配置可信主机](#configuring-trusted-hosts)
- [路由](#routing)
    - [请求密码重置链接](#requesting-the-password-reset-link)
    - [重置密码](#resetting-the-password)
- [删除过期令牌](#deleting-expired-tokens)
- [自定义](#password-customization)

<a name="introduction"></a>
## 简介

大多数 Web 应用都提供了让用户重置遗忘密码的功能。为了避免你在创建每个应用时都要手动重新实现这一功能，Laravel 提供了便捷的服务来发送密码重置链接并安全地重置密码。

> **Note**  
> 想要快速上手？在一个全新的 Laravel 应用中安装 Laravel [应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的入门套件会负责搭建你的整个认证系统，包括重置遗忘的密码。

<a name="model-preparation"></a>
### 模型准备

在使用 Laravel 的密码重置功能之前，你的应用的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` Trait。通常，新建 Laravel 应用时生成的默认 `App\Models\User` 模型已经包含了该 Trait。

接下来，验证你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架自带的 `App\Models\User` 模型已经实现了该接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` Trait 来包含实现该接口所需的方法。

<a name="database-preparation"></a>
### 数据库准备

必须创建一张表来存储应用的密码重置令牌。该表的数据库迁移已包含在默认的 Laravel 应用中，因此你只需执行数据库迁移即可创建该表：

```shell
php artisan migrate
```

<a name="configuring-trusted-hosts"></a>
### 配置可信主机

默认情况下，Laravel 会响应接收到的所有请求，而不论 HTTP 请求的 `Host` 头内容如何。此外，在 Web 请求期间生成指向应用的绝对 URL 时，会使用 `Host` 头的值。

通常，你应该配置 Web 服务器（如 Nginx 或 Apache），使其只将匹配给定主机名的请求发送给应用。但是，如果你无法直接自定义 Web 服务器，又需要让 Laravel 只响应特定的主机名，可以通过为应用启用 `App\Http\Middleware\TrustHosts` 中间件来实现。当你的应用提供密码重置功能时，这一点尤为重要。

要了解更多关于该中间件的信息，请参阅 [`TrustHosts` 中间件文档](/docs/{{version}}/requests#configuring-trusted-hosts)。

<a name="routing"></a>
## 路由

为了正确实现允许用户重置密码的功能，我们需要定义若干路由。首先，我们需要一对路由来处理用户通过邮箱地址请求密码重置链接的操作。其次，我们还需要一对路由来处理用户访问通过邮件发送的密码重置链接并完成密码重置表单后实际重置密码的操作。

<a name="requesting-the-password-reset-link"></a>
### 请求密码重置链接

<a name="the-password-reset-link-request-form"></a>
#### 密码重置链接请求表单

首先，我们定义请求密码重置链接所需的路由。开始之前，我们先定义一个返回包含密码重置链接请求表单视图的路由：

    Route::get('/forgot-password', function () {
        return view('auth.forgot-password');
    })->middleware('guest')->name('password.request');

该路由返回的视图应包含一个带有 `email` 字段的表单，以便用户为给定的邮箱地址请求密码重置链接。

<a name="password-reset-link-handling-the-form-submission"></a>
#### 处理表单提交

接下来，我们定义一个处理来自"忘记密码"视图表单提交请求的路由。该路由负责验证邮箱地址并向对应用户发送密码重置请求：

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Password;

    Route::post('/forgot-password', function (Request $request) {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
                    ? back()->with(['status' => __($status)])
                    : back()->withErrors(['email' => __($status)]);
    })->middleware('guest')->name('password.email');

在继续之前，让我们更详细地审视这个路由。首先，验证请求的 `email` 属性。接着，我们使用 Laravel 内置的"密码代理"（通过 `Password` Facade）向用户发送密码重置链接。密码代理会根据给定字段（本例中为邮箱地址）检索用户，并通过 Laravel 内置的[通知系统](/docs/{{version}}/notifications)向用户发送密码重置链接。

`sendResetLink` 方法返回一个"状态"标识符（slug）。可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数对该状态进行翻译，以便向用户显示关于其请求状态的友好提示信息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中包含了状态标识符每个可能取值对应的条目。

你可能想知道，在调用 `Password` Facade 的 `sendResetLink` 方法时，Laravel 是如何知道从应用的数据库中检索用户记录的。Laravel 的密码代理利用认证系统的"用户提供者（user providers）"来检索数据库记录。密码代理使用的用户提供者在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者的更多信息，请参阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

> **Note**  
> 手动实现密码重置时，你需要自行定义视图和路由的内容。如果你希望使用包含所有必要认证和验证逻辑的脚手架，请查看 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="resetting-the-password"></a>
### 重置密码

<a name="the-password-reset-form"></a>
#### 密码重置表单

接下来，我们定义用户点击通过邮件发送的密码重置链接并提供新密码后实际重置密码所需的路由。首先，定义用户点击密码重置链接时显示重置密码表单的路由。该路由会接收一个 `token` 参数，我们稍后将用它来验证密码重置请求：

    Route::get('/reset-password/{token}', function ($token) {
        return view('auth.reset-password', ['token' => $token]);
    })->middleware('guest')->name('password.reset');

该路由返回的视图应显示一个表单，包含 `email` 字段、`password` 字段、`password_confirmation` 字段和一个隐藏的 `token` 字段，其中 `token` 字段应包含路由接收到的秘密 `$token` 的值。

<a name="password-reset-handling-the-form-submission"></a>
#### 处理表单提交

当然，我们需要定义一个路由来实际处理密码重置表单的提交。该路由负责验证传入的请求并更新数据库中用户的密码：

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
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
                    ? redirect()->route('login')->with('status', __($status))
                    : back()->withErrors(['email' => [__($status)]]);
    })->middleware('guest')->name('password.update');

在继续之前，让我们更详细地审视这个路由。首先，验证请求的 `token`、`email` 和 `password` 属性。接着，我们使用 Laravel 内置的"密码代理"（通过 `Password` Facade）验证密码重置请求的凭据。

如果提供给密码代理的令牌、邮箱地址和密码有效，传递给 `reset` 方法的闭包将被调用。在该闭包中（接收用户实例和提供给密码重置表单的明文密码），我们可以在数据库中更新用户的密码。

`reset` 方法返回一个"状态"标识符（slug）。可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数对该状态进行翻译，以便向用户显示关于其请求状态的友好提示信息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中包含了状态标识符每个可能取值对应的条目。

在继续之前，你可能想知道，在调用 `Password` Facade 的 `reset` 方法时，Laravel 是如何知道从应用的数据库中检索用户记录的。Laravel 的密码代理利用认证系统的"用户提供者"来检索数据库记录。密码代理使用的用户提供者在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者的更多信息，请参阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

<a name="deleting-expired-tokens"></a>
## 删除过期令牌

已过期的密码重置令牌仍会保留在数据库中。不过，你可以使用 `auth:clear-resets` Artisan 命令轻松删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你想自动化这一过程，可以考虑将该命令添加到应用的[调度器](/docs/{{version}}/scheduling)中：

    $schedule->command('auth:clear-resets')->everyFifteenMinutes();

<a name="password-customization"></a>
## 自定义

<a name="reset-link-customization"></a>
#### 重置链接自定义

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法自定义密码重置链接的 URL。该方法接收一个闭包，闭包接收接收通知的用户实例以及密码重置链接令牌。通常，你应该在 `App\Providers\AuthServiceProvider` 服务提供者（Service Provider）的 `boot` 方法中调用该方法：

    use Illuminate\Auth\Notifications\ResetPassword;

    /**
     * 注册任意认证 / 授权服务。
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        ResetPassword::createUrlUsing(function ($user, string $token) {
            return 'https://example.com/reset-password?token='.$token;
        });
    }

<a name="reset-email-customization"></a>
#### 重置邮件自定义

你可以轻松修改用于向用户发送密码重置链接的通知类。首先，在 `App\Models\User` 模型上重写 `sendPasswordResetNotification` 方法。在该方法中，你可以使用自己创建的任意[通知类](/docs/{{version}}/notifications)发送通知。密码重置的 `$token` 是该方法接收的第一个参数。你可以使用该 `$token` 构建你想要的密码重置 URL，并将通知发送给用户：

    use App\Notifications\ResetPasswordNotification;

    /**
     * 向用户发送密码重置通知。
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $url = 'https://example.com/reset-password?token='.$token;

        $this->notify(new ResetPasswordNotification($url));
    }
