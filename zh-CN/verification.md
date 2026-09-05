# 邮箱验证

许多 Web 应用都要求用户在使用应用前验证自己的邮箱地址。Laravel 提供了便捷的内置服务用于发送和验证邮箱验证请求，你无需为每个新建的应用重复实现该功能。

> [!NOTE]
> 想要快速上手？可以在一个全新的 Laravel 应用中安装 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。这些套件会为你搭建好整套认证系统，包括邮箱验证功能。

## 模型准备

开始之前，请确认你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 契约：

```php
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
```

一旦将该接口添加到模型中，新注册的用户就会自动收到一封包含邮箱验证链接的邮件。之所以能无缝完成，是因为 Laravel 会自动为 `Illuminate\Auth\Events\Registered` 事件注册 `Illuminate\Auth\Listeners\SendEmailVerificationNotification` [监听器](/docs/{{version}}/events)。

如果你没有使用 [入门套件](/docs/{{version}}/starter-kits)，而是在应用中手动实现注册逻辑，则应确保用户注册成功后派发了 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

## 数据库准备

接下来，你的 `users` 表必须包含一个 `email_verified_at` 字段，用于记录用户邮箱地址通过验证的日期和时间。通常，这个字段已包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

## 路由

要正确实现邮箱验证，需要定义三条路由。首先，需要一条路由来向用户展示提示信息，告诉他们点击 Laravel 在注册后发送的验证邮件中的链接。

其次，需要一条路由来处理用户点击邮件中验证链接时生成的请求。

最后，如果用户不小心弄丢了第一封验证邮件，需要一条路由来重新发送验证链接。

## 邮箱验证通知

如前所述，应定义一条路由，返回一个视图，提示用户点击 Laravel 在注册后发送给他们的验证邮件中的链接。当用户尝试访问应用的其他部分、却尚未验证邮箱时，就会看到这个视图。请记住，只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，该链接就会自动通过邮件发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回邮箱验证通知的路由应当命名为 `verification.notice`。将该路由赋以此精确名称非常重要，因为 Laravel 内置的 `verified` 中间件（[详见下文](#protecting-routes)）会在用户尚未验证邮箱时，自动重定向到这个路由名称。

> [!NOTE]
> 手动实现邮箱验证时，你需要自行定义验证通知视图的内容。如果你希望获得包含全部必要认证与验证视图的脚手架，请查看 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

## 邮箱验证处理器

接下来，我们需要定义一条路由，处理用户点击邮件中验证链接时生成的请求。该路由应命名为 `verification.verify`，并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们仔细看一下这条路由。首先，你会注意到这里使用了 `EmailVerificationRequest` 请求类型，而不是常见的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 内置的一个 [表单请求](/docs/{{version}}/validation#form-request-validation)。该请求会自动负责校验请求中的 `id` 和 `hash` 参数。

接下来，我们可以直接调用请求上的 `fulfill` 方法。该方法会在已认证的用户上调用 `markEmailAsVerified` 方法，并派发 `Illuminate\Auth\Events\Verified` 事件。`markEmailAsVerified` 方法通过 `Illuminate\Foundation\Auth\User` 基类提供给默认的 `App\Models\User` 模型。一旦用户的邮箱地址通过验证，你可以将其重定向到任意位置。

## 重新发送验证邮件

有时用户可能会放错地方或误删验证邮件。为应对这种情况，你可以定义一条路由，允许用户请求重新发送验证邮件。然后，你可以在 [验证通知视图](#the-email-verification-notice) 中放置一个简单的表单提交按钮，向这条路由发起请求：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

## 保护路由

可以使用 [路由中间件](/docs/{{version}}/middleware) 来仅允许已验证的用户访问指定路由。Laravel 内置了一个 `verified` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的别名。由于该别名已由 Laravel 自动注册，你只需将 `verified` 中间件挂到路由定义上即可。通常，该中间件会与 `auth` 中间件配合使用：

```php
Route::get('/profile', function () {
    // 仅已验证的用户可以访问该路由……
})->middleware(['auth', 'verified']);
```

如果未验证的用户尝试访问分配了该中间件的路由，系统会自动将其重定向到 `verification.notice` [命名路由](/docs/{{version}}/routing#named-routes)。

## 自定义

### 验证邮件自定义

尽管默认的邮箱验证通知可以满足大多数应用的需求，但 Laravel 允许你自定义邮箱验证邮件的构建方式。

首先，向 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法传入一个闭包。该闭包会接收到正在接收通知的模型实例，以及用户必须访问以验证邮箱地址的签名邮箱验证 URL。闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应当在应用 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
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
```

> [!NOTE]
> 想了解更多关于邮件通知的信息，请参阅 [邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

## 事件

使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits) 时，Laravel 会在邮箱验证过程中派发 `Illuminate\Auth\Events\Verified` 事件。如果你在应用中手动处理邮箱验证，可以在验证完成后手动派发这些事件。
