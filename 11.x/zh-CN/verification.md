# 邮箱验证

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
- [路由](#verification-routing)
    - [邮箱验证通知](#the-email-verification-notice)
    - [邮箱验证处理器](#the-email-verification-handler)
    - [重新发送验证邮件](#resending-the-verification-email)
    - [保护路由](#protecting-routes)
- [自定义](#customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用都要求用户在正式使用前验证邮箱地址。Laravel 不会强迫你为每个应用手动重新实现该功能，而是提供了方便的内置服务来发送和验证邮箱。

> [!NOTE]
> 想快速上手？在一个全新的 Laravel 应用中安装某个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。入门套件会为你搭建整套认证系统，包括邮箱验证支持。

<a name="model-preparation"></a>
### 模型准备

开始之前，请确认你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 契约：

    <?php

    namespace App\Models;

    use Illuminate\Contracts\Auth\MustVerifyEmail;
    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable implements MustVerifyEmail
    {
        use Notifiable;

        // ...
    }

模型添加该接口后，新注册用户会自动收到一封包含邮箱验证链接的邮件。这一过程是自动完成的，因为 Laravel 会自动为 `Illuminate\Auth\Events\Registered` 事件注册 `Illuminate\Auth\Listeners\SendEmailVerificationNotification` [监听器](/docs/{{version}}/events)。

如果你是自己在应用中手动实现注册，而不是使用[入门套件](/docs/{{version}}/starter-kits)，则应确保在用户注册成功后派发 `Illuminate\Auth\Events\Registered` 事件：

    use Illuminate\Auth\Events\Registered;

    event(new Registered($user));

<a name="database-preparation"></a>
### 数据库准备

接下来，你的 `users` 表必须包含一个 `email_verified_at` 列，用于存储用户邮箱地址通过验证的日期和时间。通常，Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中已包含该字段。

<a name="verification-routing"></a>
## 路由

要正确实现邮箱验证，需要定义三条路由。第一条路由用于显示一条提示，告诉用户应点击 Laravel 在其注册后发送给他们的那封验证邮件中的邮箱验证链接。

第二条路由用于处理用户点击邮件中邮箱验证链接时产生的请求。

第三条路由用于在用户不慎弄丢第一条验证链接时重新发送验证链接。

<a name="the-email-verification-notice"></a>
### 邮箱验证通知

如前所述，应定义一条路由返回视图，提示用户点击 Laravel 在其注册后发给他们的邮箱验证链接。当用户未验证邮箱就试图访问应用的其他部分时，就会看到该视图。只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，验证链接就会自动通过邮件发送给用户：

    Route::get('/email/verify', function () {
        return view('auth.verify-email');
    })->middleware('auth')->name('verification.notice');

返回邮箱验证通知的那条路由应命名为 `verification.notice`。这条路由必须使用这个确切的名称，因为 Laravel 自带的 `verified` 中间件[会在用户未验证邮箱时自动重定向到该路由名称](#protecting-routes)。

> [!NOTE]
> 手动实现邮箱验证时，你需要自行定义验证通知视图的内容。如果你想使用包含全部认证与验证视图的脚手架，请查阅 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="the-email-verification-handler"></a>
### 邮箱验证处理器

接下来，我们需要定义一条路由，用于处理用户点击发给他们的邮箱验证链接时产生的请求。该路由应命名为 `verification.verify`，并应用 `auth` 和 `signed` 中间件：

    use Illuminate\Foundation\Auth\EmailVerificationRequest;

    Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
        $request->fulfill();

        return redirect('/home');
    })->middleware(['auth', 'signed'])->name('verification.verify');

在继续之前，我们先仔细看看这条路由。首先，你可能注意到我们使用的是 `EmailVerificationRequest` 请求类型，而不是常见的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 自带的 [表单请求](/docs/{{version}}/validation#form-request-validation)，它会自动负责校验请求中的 `id` 和 `hash` 参数。

接下来，我们可以直接在请求上调用 `fulfill` 方法。该方法会调用已认证用户的 `markEmailAsVerified` 方法，并派发 `Illuminate\Auth\Events\Verified` 事件。默认的 `App\Models\User` 模型通过 `Illuminate\Foundation\Auth\User` 基类获得了 `markEmailAsVerified` 方法。用户的邮箱地址验证通过后，你就可以把他重定向到任意页面。

<a name="resending-the-verification-email"></a>
### 重新发送验证邮件

有时用户可能弄丢或误删了邮箱地址验证邮件。为此，你可以定义一条路由，允许用户请求重新发送验证邮件。然后在[验证通知视图](#the-email-verification-notice)中放置一个简单的表单提交按钮，向该路由发起请求：

    use Illuminate\Http\Request;

    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();

        return back()->with('message', 'Verification link sent!');
    })->middleware(['auth', 'throttle:6,1'])->name('verification.send');

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于只允许已验证的用户访问某个路由。Laravel 内置了 `verified` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的别名。由于该别名已由 Laravel 自动注册，你只需把 `verified` 中间件附加到路由定义上即可。通常，这个中间件会与 `auth` 中间件搭配使用：

    Route::get('/profile', function () {
        // 只有已验证的用户才能访问此路由……
    })->middleware(['auth', 'verified']);

如果未验证的用户试图访问应用了该中间件的路由，系统会自动把他们重定向到 `verification.notice` [命名路由](/docs/{{version}}/routing#named-routes)。

<a name="customization"></a>
## 自定义

<a name="verification-email-customization"></a>
#### 验证邮件自定义

虽然默认的邮箱验证通知已能满足大多数应用的需求，但 Laravel 允许你自定义邮箱验证邮件消息的构建方式。

要开始自定义，请向 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法传入一个闭包。该闭包会接收正在接收通知的 notifiable 模型实例，以及用户必须访问以验证邮箱地址的签名验证 URL。闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应该在应用的 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

    use Illuminate\Auth\Notifications\VerifyEmail;
    use Illuminate\Notifications\Messages\MailMessage;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        // ...

        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Verify Email Address')
                ->line('Click the button below to verify your email address.')
                ->action('Verify Email Address', $url);
        });
    }

> [!NOTE]
> 想了解更多关于邮件通知的信息，请查阅[邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

<a name="events"></a>
## 事件

使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)时，Laravel 会在邮箱验证过程中派发 `Illuminate\Auth\Events\Verified` [事件](/docs/{{version}}/events)。如果你是为应用手动处理邮箱验证的，可能需要在验证完成后手动派发这些事件。
