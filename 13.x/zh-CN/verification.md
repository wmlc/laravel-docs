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

许多 Web 应用要求用户在使用应用前验证自己的邮箱地址。与其为每个创建的应用手动重新实现此功能，Laravel 提供了便捷的内置服务，用于发送和验证邮箱验证请求。

> [!NOTE]
> 想快速上手？在一个全新的 Laravel 应用中安装一个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。入门套件会负责搭建你的整个认证系统，包括邮箱验证支持。

<a name="model-preparation"></a>
### 模型准备

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

一旦将这一接口添加到模型上，新注册的用户将自动收到一封包含邮箱验证链接的邮件。这一切会无缝发生，因为 Laravel 会自动为 `Illuminate\Auth\Events\Registered` 事件注册 `Illuminate\Auth\Listeners\SendEmailVerificationNotification` [监听器](/docs/{{version}}/events)。

如果你在应用中手动实现注册，而不是使用[入门套件](/docs/{{version}}/starter-kits)，则应确保在用户注册成功后触发 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

<a name="database-preparation"></a>
### 数据库准备

接下来，你的 `users` 表必须包含一个 `email_verified_at` 列，用于存储用户邮箱地址被验证的日期和时间。通常，这包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

<a name="verification-routing"></a>
## 路由

要正确实现邮箱验证，需要定义三个路由。首先，需要一个路由来向用户显示通知，告知他们应点击 Laravel 在注册后发送的验证邮件中的邮箱验证链接。

其次，需要一个路由来处理用户点击邮件中邮箱验证链接时产生的请求。

第三，如果用户不小心丢失了第一个验证链接，需要一个路由来重新发送验证链接。

<a name="the-email-verification-notice"></a>
### 邮箱验证通知

如前所述，应定义一个路由，返回一个视图，指示用户点击 Laravel 在注册后通过邮件发送给他们的邮箱验证链接。当用户在未先验证邮箱地址的情况下尝试访问应用的其他部分时，该视图会显示给用户。请记住，只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，该链接就会自动通过邮件发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回邮箱验证通知的路由应命名为 `verification.notice`。为路由指定这一确切名称非常重要，因为 [Laravel 内置的](#protecting-routes) `verified` 中间件会在用户尚未验证邮箱地址时自动重定向到该路由名称。

> [!NOTE]
> 手动实现邮箱验证时，你需要自行定义验证通知视图的内容。如果你希望获得包含所有必要认证和验证视图的脚手架，请查看 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="the-email-verification-handler"></a>
### 邮箱验证处理器

接下来，我们需要定义一个路由，处理用户点击通过邮件发送给他们的邮箱验证链接时产生的请求。该路由应命名为 `verification.verify`，并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们仔细看一下这条路由。首先，你会注意到我们使用的是 `EmailVerificationRequest` 请求类型，而不是典型的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 内置的一个[表单请求](/docs/{{version}}/validation#form-request-validation)。该请求会自动负责验证请求的 `id` 和 `hash` 参数。

接下来，我们可以直接调用请求上的 `fulfill` 方法。该方法会对已认证用户调用 `markEmailAsVerified` 方法，并触发 `Illuminate\Auth\Events\Verified` 事件。`markEmailAsVerified` 方法通过 `Illuminate\Foundation\Auth\User` 基类提供给默认的 `App\Models\User` 模型使用。用户的邮箱地址验证完成后，你可以将他们重定向到任何地方。

<a name="resending-the-verification-email"></a>
### 重新发送验证邮件

有时用户可能会放错或不小心删除邮箱地址验证邮件。为应对这种情况，你可能希望定义一个路由，允许用户请求重新发送验证邮件。然后，你可以通过在[验证通知视图](#the-email-verification-notice)中放置一个简单的表单提交按钮，向该路由发出请求：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于只允许已验证的用户访问给定路由。Laravel 内置一个 `verified` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的别名。由于该别名已由 Laravel 自动注册，你只需将 `verified` 中间件附加到路由定义即可。通常，该中间件会与 `auth` 中间件搭配使用：

```php
Route::get('/profile', function () {
    // Only verified users may access this route...
})->middleware(['auth', 'verified']);
```

如果未验证的用户尝试访问已分配该中间件的路由，他们会被自动重定向到 `verification.notice` [命名路由](/docs/{{version}}/routing#named-routes)。

<a name="customization"></a>
## 自定义

<a name="verification-email-customization"></a>
#### 自定义验证邮件

虽然默认的邮箱验证通知应该能满足大多数应用的需求，但 Laravel 允许你自定义邮箱验证邮件消息的构造方式。

首先，向 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法传递一个闭包。该闭包将接收正在接收通知的可通知模型实例，以及用户必须访问以验证邮箱地址的签名邮箱验证 URL。闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应在应用的 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Bootstrap any application services.
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
> 要了解有关邮件通知的更多信息，请查阅[邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

<a name="events"></a>
## 事件

使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)时，Laravel 会在邮箱验证过程中触发 `Illuminate\Auth\Events\Verified` [事件](/docs/{{version}}/events)。如果你正在手动处理应用的邮箱验证，则可能希望在验证完成后手动触发这些事件。
