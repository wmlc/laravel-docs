# 重置密码

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
    - [配置受信任主机](#configuring-trusted-hosts)
- [路由](#routing)
    - [请求密码重置链接](#requesting-the-password-reset-link)
    - [重置密码](#resetting-the-password)
- [删除过期令牌](#deleting-expired-tokens)
- [自定义](#password-customization)

<a name="introduction"></a>
## 简介

大多数 Web 应用都提供了让用户重置遗忘密码的方式。Laravel 不会强迫你为每个应用手动重新实现该功能，而是提供了方便的服务来发送密码重置链接并安全地重置密码。

> [!NOTE]
> 想快速上手？在全新的 Laravel 应用中安装一个 Laravel [应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的入门套件会为你搭建整套认证系统，包括重置遗忘密码。

<a name="model-preparation"></a>
### 模型准备

在使用 Laravel 的密码重置功能之前，应用的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` Trait。通常，这个 Trait 已经包含在 Laravel 新应用创建时生成的默认 `App\Models\User` 模型中。

接下来，确认你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架自带的 `App\Models\User` 模型已经实现了该接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` Trait 提供了实现该接口所需的方法。

<a name="database-preparation"></a>
### 数据库准备

你必须创建一个表来存放应用的密码重置令牌。通常，Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中已包含该表。

<a name="configuring-trusted-hosts"></a>
### 配置受信任主机

默认情况下，无论 HTTP 请求的 `Host` 头内容是什么，Laravel 都会响应收到的所有请求。此外，在 Web 请求期间生成指向你应用的绝对 URL 时，会使用 `Host` 头的值。

通常，你应当配置 Web 服务器（如 Nginx 或 Apache），只把与指定主机名匹配的请求发送到你的应用。不过，如果你无法直接自定义 Web 服务器，却需要指示 Laravel 只响应特定主机名，可以在应用的 `bootstrap/app.php` 文件中使用 `trustHosts` 中间件方法做到这一点。当你的应用提供密码重置功能时，这一点尤为重要。

想了解更多关于这个中间件方法的信息，请查阅 [`TrustHosts` 中间件文档](/docs/{{version}}/requests#configuring-trusted-hosts)。

<a name="routing"></a>
## 路由

要正确实现允许用户重置密码的功能，我们需要定义若干条路由。首先，需要一对路由来处理让用户通过邮箱地址请求密码重置链接。其次，需要另一对路由来处理用户访问发给他们的密码重置链接并填写完密码重置表单后，实际重置密码的流程。

<a name="requesting-the-password-reset-link"></a>
### 请求密码重置链接

<a name="the-password-reset-link-request-form"></a>
#### 密码重置链接请求表单

首先，我们来定义请求密码重置链接所需的路由。要开始实现，我们先定义一条返回密码重置链接请求表单视图的路由：

    Route::get('/forgot-password', function () {
        return view('auth.forgot-password');
    })->middleware('guest')->name('password.request');

该路由返回的视图应包含一个带 `email` 字段的表单，允许用户针对某个邮箱地址请求密码重置链接。

<a name="password-reset-link-handling-the-form-submission"></a>
#### 处理表单提交

接下来，我们来定义一条处理"忘记密码"视图表单提交请求的路由。该路由负责校验邮箱地址，并把密码重置请求发送给对应的用户：

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

在继续之前，我们来更仔细地审视这条路由。首先，请求的 `email` 属性会被校验。接下来，我们使用 Laravel 内置的"密码代理"（通过 `Password` Facade 使用）向用户发送密码重置链接。密码代理会负责按给定字段（此处为邮箱地址）检索用户，并通过 Laravel 内置的[通知系统](/docs/{{version}}/notifications)向用户发送密码重置链接。

`sendResetLink` 方法返回一个"状态"标识。你可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数翻译该状态，从而向用户显示友好的请求状态消息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中为状态标识的每个可能值都有一条对应条目。

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

你可能想知道，调用 `Password` Facade 的 `sendResetLink` 方法时，Laravel 如何知道从应用的数据库中检索用户记录。Laravel 密码代理会利用你认证系统中的"用户提供者"来检索数据库记录。密码代理所使用的用户提供者，在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。想了解更多关于编写自定义用户提供者的信息，请查阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

> [!NOTE]
> 手动实现密码重置时，你需要自行定义视图和路由的内容。如果你想使用包含全部必要认证与验证逻辑的脚手架，请查阅 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="resetting-the-password"></a>
### 重置密码

<a name="the-password-reset-form"></a>
#### 密码重置表单

接下来，我们来定义用户点击发给他们的密码重置链接并提供新密码后实际重置密码所需的路由。首先，我们定义一条路由，用于展示用户点击重置密码链接时呈现的重置密码表单。该路由会接收一个 `token` 参数，我们稍后会用它来验证密码重置请求：

    Route::get('/reset-password/{token}', function (string $token) {
        return view('auth.reset-password', ['token' => $token]);
    })->middleware('guest')->name('password.reset');

该路由返回的视图应展示一个表单，其中包含 `email` 字段、`password` 字段、`password_confirmation` 字段，以及一个隐藏的 `token` 字段，该字段应包含路由收到的密钥 `$token` 的值。

<a name="password-reset-handling-the-form-submission"></a>
#### 处理表单提交

当然，我们需要定义一条路由来实际处理密码重置表单的提交。该路由负责校验传入的请求，并更新数据库中用户的密码：

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

在继续之前，我们来更仔细地审视这条路由。首先，请求的 `token`、`email` 和 `password` 属性会被校验。接下来，我们使用 Laravel 内置的"密码代理"（通过 `Password` Facade 使用）来验证密码重置请求的凭据。

如果传给密码代理的令牌、邮箱地址和密码都有效，传给 `reset` 方法的闭包就会被调用。在这个闭包中，你可以更新数据库中用户的密码；闭包接收用户实例以及密码重置表单提供的明文密码。

`reset` 方法返回一个"状态"标识。你可以使用 Laravel 的[本地化](/docs/{{version}}/localization)辅助函数翻译该状态，从而向用户显示友好的请求状态消息。密码重置状态的翻译由应用的 `lang/{lang}/passwords.php` 语言文件决定。`passwords` 语言文件中为状态标识的每个可能值都有一条对应条目。如果你的应用不包含 `lang` 目录，可以使用 `lang:publish` Artisan 命令创建它。

在继续之前，你可能想知道，调用 `Password` Facade 的 `reset` 方法时，Laravel 如何知道从应用的数据库中检索用户记录。Laravel 密码代理会利用你认证系统中的"用户提供者"来检索数据库记录。密码代理所使用的用户提供者，在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。想了解更多关于编写自定义用户提供者的信息，请查阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

<a name="deleting-expired-tokens"></a>
## 删除过期令牌

已过期的密码重置令牌仍会留在你的数据库中。不过，你可以轻松使用 `auth:clear-resets` Artisan 命令删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你想把这一过程自动化，可以考虑把该命令加入应用的[调度器](/docs/{{version}}/scheduling)：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('auth:clear-resets')->everyFifteenMinutes();

<a name="password-customization"></a>
## 自定义

<a name="reset-link-customization"></a>
#### 重置链接自定义

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法自定义密码重置链接 URL。该方法接受一个闭包，闭包接收正在接收通知的用户实例以及密码重置链接令牌。通常，你应该在 `App\Providers\AppServiceProvider` 服务提供者的 `boot` 方法中调用该方法：

    use App\Models\User;
    use Illuminate\Auth\Notifications\ResetPassword;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token) {
            return 'https://example.com/reset-password?token='.$token;
        });
    }

<a name="reset-email-customization"></a>
#### 重置邮件自定义

你可以轻松修改用于向用户发送密码重置链接的通知类。要开始修改，请覆盖 `App\Models\User` 模型上的 `sendPasswordResetNotification` 方法。在该方法中，你可以使用自己创建的任意[通知类](/docs/{{version}}/notifications)发送通知。密码重置的 `$token` 是该方法接收的第一个参数。你可以用这个 `$token` 构建自定义的密码重置 URL，并把通知发送给用户：

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
