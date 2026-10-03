# 邮箱验证

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
- [路由](#verification-routing)
    - [邮箱验证提示](#the-email-verification-notice)
    - [邮箱验证处理器](#the-email-verification-handler)
    - [重新发送验证邮件](#resending-the-verification-email)
    - [保护路由](#protecting-routes)
- [自定义](#customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用要求用户在使用应用之前验证其邮箱地址。Laravel 提供了便捷的内置服务来发送和验证邮箱验证请求，无需你为创建的每个应用手动重新实现此功能。

> **Note**  
> 想快速上手？在一个全新的 Laravel 应用中安装其中一个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。入门套件会负责搭建你的整个认证系统，包括邮箱验证支持。

<a name="model-preparation"></a>
### 模型准备

在开始之前，请验证你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 契约：

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

将此接口添加到模型后，新注册的用户将自动收到一封包含邮箱验证链接的邮件。通过查看应用的 `App\Providers\EventServiceProvider` 可以看到，Laravel 已经包含了一个 `SendEmailVerificationNotification` [监听器](/docs/{{version}}/events)，它附加到 `Illuminate\Auth\Events\Registered` 事件。此事件监听器会向用户发送邮箱验证链接。

如果你在应用中手动实现注册而不是使用[入门套件](/docs/{{version}}/starter-kits)，应确保在用户注册成功后派发 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

<a name="database-preparation"></a>
### 数据库准备

接下来，你的 `users` 表必须包含一个 `email_verified_at` 列，用于存储用户邮箱地址验证的日期和时间。默认情况下，Laravel 框架包含的 `users` 表迁移已经包含此列。因此，你只需运行数据库迁移即可：

```shell
php artisan migrate
```

<a name="verification-routing"></a>
## 路由

要正确实现邮箱验证，需要定义三个路由。首先，需要一个路由向用户显示提示，告知他们应点击 Laravel 在注册后发送的验证邮件中的邮箱验证链接。

其次，需要一个路由来处理用户点击邮件中邮箱验证链接时生成的请求。

第三，需要一个路由在用户意外丢失第一个验证链接时重新发送验证链接。

<a name="the-email-verification-notice"></a>
### 邮箱验证提示

如前所述，应定义一个路由返回一个视图，指示用户点击 Laravel 在注册后通过邮件发送给他们的邮箱验证链接。当用户尝试在未先验证邮箱地址的情况下访问应用的其他部分时，将向其显示此视图。请记住，只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，链接就会自动通过邮件发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回邮箱验证提示的路由应命名为 `verification.notice`。为路由分配此确切名称非常重要，因为 Laravel [内置的](#protecting-routes) `verified` 中间件会在用户未验证邮箱地址时自动重定向到此路由名称。

> **Note**  
> 手动实现邮箱验证时，你需要自行定义验证提示视图的内容。如果你希望获得包含所有必要认证和验证视图的脚手架，请查看 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="the-email-verification-handler"></a>
### 邮箱验证处理器

接下来，我们需要定义一个路由来处理用户点击通过邮件发送给他们的邮箱验证链接时生成的请求。此路由应命名为 `verification.verify`，并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们仔细看看这个路由。首先，你会注意到我们使用了 `EmailVerificationRequest` 请求类型，而不是典型的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 内置的一个[表单请求](/docs/{{version}}/validation#form-request-validation)。此请求会自动处理验证请求的 `id` 和 `hash` 参数。

接下来，我们可以直接调用请求上的 `fulfill` 方法。此方法会调用已认证用户上的 `markEmailAsVerified` 方法并派发 `Illuminate\Auth\Events\Verified` 事件。`markEmailAsVerified` 方法通过 `Illuminate\Foundation\Auth\User` 基类对默认的 `App\Models\User` 模型可用。一旦用户的邮箱地址被验证，你可以将他们重定向到任何你希望的位置。

<a name="resending-the-verification-email"></a>
### 重新发送验证邮件

有时用户可能会放错或意外删除邮箱地址验证邮件。为此，你可能希望定义一个路由允许用户请求重新发送验证邮件。然后，你可以通过在[验证提示视图](#the-email-verification-notice)中放置一个简单的表单提交按钮来向此路由发起请求：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于仅允许已验证用户访问给定路由。Laravel 内置了一个 `verified` 中间件，它引用 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 类。由于此中间件已在应用的 HTTP 内核中注册，你只需将中间件附加到路由定义即可。通常，此中间件与 `auth` 中间件配合使用：

```php
Route::get('/profile', function () {
    // 只有已验证用户才能访问此路由...
})->middleware(['auth', 'verified']);
```

如果未验证用户尝试访问已分配此中间件的路由，他们将被自动重定向到 `verification.notice` [命名路由](/docs/{{version}}/routing#named-routes)。

<a name="customization"></a>
## 自定义

<a name="verification-email-customization"></a>
#### 验证邮件自定义

虽然默认的邮箱验证通知应该能满足大多数应用的需求，但 Laravel 允许你自定义邮箱验证邮件消息的构建方式。

首先，将一个闭包传递给 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法。该闭包将接收接收通知的可通知模型实例以及用户必须访问以验证其邮箱地址的签名邮箱验证 URL。闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应该从应用的 `App\Providers\AuthServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * 注册任何认证 / 授权服务。
 *
 * @return void
 */
public function boot()
{
    // ...

    VerifyEmail::toMailUsing(function ($notifiable, $url) {
        return (new MailMessage)
            ->subject('Verify Email Address')
            ->line('Click the button below to verify your email address.')
            ->action('Verify Email Address', $url);
    });
}
```

> **Note**  
> 要了解更多关于邮件通知的信息，请查阅[邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

<a name="events"></a>
## 事件

使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)时，Laravel 会在邮箱验证过程中派发[事件](/docs/{{version}}/events)。如果你手动为应用处理邮箱验证，可能希望在验证完成后手动派发这些事件。你可以在应用的 `EventServiceProvider` 中为这些事件附加监听器：

```php
use App\Listeners\LogVerifiedUser;
use Illuminate\Auth\Events\Verified;

/**
 * 应用的事件监听器映射。
 *
 * @var array
 */
protected $listen = [
    Verified::class => [
        LogVerifiedUser::class,
    ],
];
```