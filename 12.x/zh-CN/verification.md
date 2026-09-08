# 邮箱验证

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
- [路由](#verification-routing)
    - [邮箱验证提示页](#the-email-verification-notice)
    - [邮箱验证处理器](#the-email-verification-handler)
    - [重新发送验证邮件](#resending-the-verification-email)
    - [保护路由](#protecting-routes)
- [自定义](#customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用要求用户在使用应用之前先验证自己的邮箱地址。为了免去你在每个应用中手动重复实现这一功能，Laravel 内置了便捷的服务，用于发送和验证邮箱验证请求。

> [!NOTE]
> 想快速上手？在一个全新的 Laravel 应用中安装 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)即可。入门套件会为你的整个认证系统搭建脚手架，其中包括邮箱验证支持。

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

将这个接口添加到模型后，新注册的用户会自动收到一封包含邮箱验证链接的邮件。这个过程是无缝完成的，因为 Laravel 会自动为 `Illuminate\Auth\Events\Registered` 事件注册 `Illuminate\Auth\Listeners\SendEmailVerificationNotification` [监听器](/docs/{{version}}/events)。

如果你没有使用[入门套件](/docs/{{version}}/starter-kits)，而是在应用中手动实现注册功能，则应确保在用户注册成功后分发 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

<a name="database-preparation"></a>
### 数据库准备

接下来，`users` 表必须包含一个 `email_verified_at` 字段，用于存储用户邮箱地址的验证时间。通常，Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中已经包含该字段。

<a name="verification-routing"></a>
## 路由

要正确实现邮箱验证，需要定义三条路由。首先，需要一条路由向用户显示提示，告知他们应点击注册后 Laravel 发来的验证邮件中的邮箱验证链接。

其次，需要一条路由来处理用户点击邮件中的邮箱验证链接时产生的请求。

第三，如果用户不小心丢失了第一条验证链接，还需要一条路由来重新发送验证链接。

<a name="the-email-verification-notice"></a>
### 邮箱验证提示页

如前所述，应定义一条返回视图的路由，提示用户点击注册后 Laravel 发送的邮箱验证链接。当用户未验证邮箱地址就尝试访问应用的其他部分时，就会看到这个视图。请记住，只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，验证链接就会自动发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回邮箱验证提示页的路由应命名为 `verification.notice`。务必使用这个精确的名称，因为[ Laravel 内置的](#protecting-routes) `verified` 中间件在用户尚未验证邮箱地址时，会自动重定向到这个名称的路由。

> [!NOTE]
> 手动实现邮箱验证时，你需要自行定义验证提示视图的内容。如果希望脚手架直接包含所有必要的认证和验证视图，请查看 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)。

<a name="the-email-verification-handler"></a>
### 邮箱验证处理器

接下来，我们需要定义一条路由，处理用户点击邮件中的邮箱验证链接时产生的请求。这条路由应命名为 `verification.verify`，并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们仔细看看这条路由。首先，你会注意到我们使用的是 `EmailVerificationRequest` 请求类型，而不是常见的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 内置的[表单请求](/docs/{{version}}/validation#form-request-validation)，它会自动验证请求的 `id` 和 `hash` 参数。

接着，我们可以直接调用请求上的 `fulfill` 方法。该方法会调用已认证用户上的 `markEmailAsVerified` 方法，并分发 `Illuminate\Auth\Events\Verified` 事件。默认的 `App\Models\User` 模型通过 `Illuminate\Foundation\Auth\User` 基类获得 `markEmailAsVerified` 方法。用户的邮箱地址验证完成后，你可以将其重定向到任何地方。

<a name="resending-the-verification-email"></a>
### 重新发送验证邮件

有时用户可能会弄丢或误删邮箱验证邮件。为了应对这种情况，你可以定义一条路由，允许用户请求重新发送验证邮件。然后，你可以在[验证提示视图](#the-email-verification-notice)中放置一个简单的表单提交按钮，向这条路由发起请求：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于仅允许已验证用户访问指定路由。Laravel 内置了 `verified` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的别名。由于 Laravel 已经自动注册了这个别名，你只需将 `verified` 中间件附加到路由定义上即可。通常，这个中间件会与 `auth` 中间件搭配使用：

```php
Route::get('/profile', function () {
    // 只有已验证的用户才能访问此路由...
})->middleware(['auth', 'verified']);
```

如果未验证的用户尝试访问分配了该中间件的路由，系统会自动将其重定向到 `verification.notice` [命名路由](/docs/{{version}}/routing#named-routes)。

<a name="customization"></a>
## 自定义

<a name="verification-email-customization"></a>
#### 验证邮件自定义

虽然默认的邮箱验证通知能满足大多数应用的需求，Laravel 仍允许你自定义邮箱验证邮件的构建方式。

首先，向 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法传入一个闭包。该闭包会接收正在接收通知的可通知模型实例，以及用户必须访问的已签名邮箱验证 URL。闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应在应用 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * 引导任意应用服务。
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
> 想进一步了解邮件通知，请查阅[邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

<a name="events"></a>
## 事件

使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)时，Laravel 会在邮箱验证过程中分发 `Illuminate\Auth\Events\Verified` [事件](/docs/{{version}}/events)。如果你在应用中手动处理邮箱验证，可以在验证完成后手动分发这些事件。
