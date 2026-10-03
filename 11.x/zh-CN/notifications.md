# 通知

- [简介](#introduction)
- [生成通知](#generating-notifications)
- [发送通知](#sending-notifications)
    - [使用 Notifiable Trait](#using-the-notifiable-trait)
    - [使用 Notification Facade](#using-the-notification-facade)
    - [指定投递渠道](#specifying-delivery-channels)
    - [通知入队](#queueing-notifications)
    - [按需通知](#on-demand-notifications)
- [邮件通知](#mail-notifications)
    - [格式化邮件消息](#formatting-mail-messages)
    - [自定义发件人](#customizing-the-sender)
    - [自定义收件人](#customizing-the-recipient)
    - [自定义主题](#customizing-the-subject)
    - [自定义邮件器](#customizing-the-mailer)
    - [自定义模板](#customizing-the-templates)
    - [附件](#mail-attachments)
    - [添加标签与元数据](#adding-tags-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
    - [使用 Mailable 类](#using-mailables)
    - [预览邮件通知](#previewing-mail-notifications)
- [Markdown 邮件通知](#markdown-mail-notifications)
    - [生成消息](#generating-the-message)
    - [编写消息](#writing-the-message)
    - [自定义组件](#customizing-the-components)
- [数据库通知](#database-notifications)
    - [先决条件](#database-prerequisites)
    - [格式化数据库通知](#formatting-database-notifications)
    - [访问通知](#accessing-the-notifications)
    - [把通知标记为已读](#marking-notifications-as-read)
- [广播通知](#broadcast-notifications)
    - [先决条件](#broadcast-prerequisites)
    - [格式化广播通知](#formatting-broadcast-notifications)
    - [监听通知](#listening-for-notifications)
- [短信通知](#sms-notifications)
    - [先决条件](#sms-prerequisites)
    - [格式化短信通知](#formatting-sms-notifications)
    - [Unicode 内容](#unicode-content)
    - [自定义"发件人"号码](#customizing-the-from-number)
    - [添加客户端引用](#adding-a-client-reference)
    - [路由短信通知](#routing-sms-notifications)
- [Slack 通知](#slack-notifications)
    - [先决条件](#slack-prerequisites)
    - [格式化 Slack 通知](#formatting-slack-notifications)
    - [Slack 交互](#slack-interactivity)
    - [路由 Slack 通知](#routing-slack-notifications)
    - [通知外部 Slack 工作区](#notifying-external-slack-workspaces)
- [本地化通知](#localizing-notifications)
- [测试](#testing)
- [通知事件](#notification-events)
- [自定义渠道](#custom-channels)

<a name="introduction"></a>
## 简介

除了支持[发送邮件](/docs/{{version}}/mail)之外，Laravel 还支持通过多种投递渠道发送通知，包括邮件、短信（通过 [Vonage](https://www.vonage.com/communications-apis/)，原 Nexmo）以及 [Slack](https://slack.com)。此外，社区还创建了大量[由社区构建的通知渠道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可以通过数十种不同渠道发送通知！通知也可以存储在数据库中，以便在你的 Web 界面中展示。

通常，通知应当是简短的、告知性的消息，用来告诉用户应用中发生了某件事。例如，如果你正在编写一个计费应用，就可以通过邮件与短信渠道向用户发送一条"发票已支付"通知。

<a name="generating-notifications"></a>
## 生成通知

在 Laravel 中，每条通知都由一个单独的类表示，这些类通常存放在 `app/Notifications` 目录中。如果你在应用中没看到该目录，也不用担心——运行 `make:notification` Artisan 命令时，它会为你自动创建：

```shell
php artisan make:notification InvoicePaid
```

该命令会在你的 `app/Notifications` 目录中放置一个新的通知类。每个通知类都包含一个 `via` 方法以及数量不等的消息构建方法，例如 `toMail` 或 `toDatabase`，用于把通知转换为适合特定渠道的消息。

<a name="sending-notifications"></a>
## 发送通知

<a name="using-the-notifiable-trait"></a>
### 使用 Notifiable Trait

通知有两种发送方式：使用 `Notifiable` Trait 的 `notify` 方法，或使用 `Notification` [Facade](/docs/{{version}}/facades)。默认情况下，应用的 `App\Models\User` 模型已经引入了 `Notifiable` Trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;
}
```

该 Trait 提供的 `notify` 方法需要接收一个通知实例：

```php
use App\Notifications\InvoicePaid;

$user->notify(new InvoicePaid($invoice));
```

> [!NOTE]
> 请记住，你可以在任何模型上使用 `Notifiable` Trait，并不局限于只在 `User` 模型上引入它。

<a name="using-the-notification-facade"></a>
### 使用 Notification Facade

或者，你也可以通过 `Notification` [Facade](/docs/{{version}}/facades)发送通知。当你需要把通知发送给多个可通知实体（例如一组用户）时，这种方式很有用。要使用 Facade 发送通知，请把所有可通知实体与通知实例一并传给 `send` 方法：

```php
use Illuminate\Support\Facades\Notification;

Notification::send($users, new InvoicePaid($invoice));
```

你还可以使用 `sendNow` 方法立即发送通知。即使该通知实现了 `ShouldQueue` 接口，该方法也会立即发送通知：

```php
Notification::sendNow($developers, new DeploymentCompleted($deployment));
```

<a name="specifying-delivery-channels"></a>
### 指定投递渠道

每个通知类都有一个 `via` 方法，用于决定通知将通过哪些渠道投递。通知可以通过 `mail`、`database`、`broadcast`、`vonage` 与 `slack` 渠道发送。

> [!NOTE]
> 如果你想使用 Telegram 或 Pusher 等其他投递渠道，请查看社区驱动的 [Laravel Notification Channels 网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，即通知所发送到的那个类的实例。你可以使用 `$notifiable` 来决定通知应当通过哪些渠道投递：

```php
/**
 * 获取通知的投递渠道。
 *
 * @return array<int, string>
 */
public function via(object $notifiable): array
{
    return $notifiable->prefers_sms ? ['vonage'] : ['mail', 'database'];
}
```

<a name="queueing-notifications"></a>
### 通知入队

> [!WARNING]
> 在把通知放入队列之前，你应当先配置好队列并[启动一个 Worker](/docs/{{version}}/queues#running-the-queue-worker)。

发送通知可能耗时较长，尤其是当渠道需要调用外部 API 来投递通知时。为了加快应用的响应速度，请为你的通知类添加 `ShouldQueue` 接口与 `Queueable` Trait，让通知入队。使用 `make:notification` 命令生成的所有通知都已经导入了该接口与 Trait，因此你可以立即把它们加到通知类上：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    // ...
}
```

把 `ShouldQueue` 接口添加到通知上之后，你可以照常发送通知。Laravel 会检测到该类上的 `ShouldQueue` 接口，并自动把通知的投递放入队列：

```php
$user->notify(new InvoicePaid($invoice));
```

通知入队时，会为每个"收件人 + 渠道"组合创建一个队列任务。例如，如果你的通知有三个收件人和两个渠道，就会向队列分发六个任务。

<a name="delaying-notifications"></a>
#### 延迟通知

如果你想延迟通知的投递，可以在实例化通知时链式调用 `delay` 方法：

```php
$delay = now()->addMinutes(10);

$user->notify((new InvoicePaid($invoice))->delay($delay));
```

你可以向 `delay` 方法传入一个数组，为特定渠道指定延迟时长：

```php
$user->notify((new InvoicePaid($invoice))->delay([
    'mail' => now()->addMinutes(5),
    'sms' => now()->addMinutes(10),
]));
```

或者，你也可以在通知类本身上定义 `withDelay` 方法。该方法应当返回一个由渠道名称与延迟值组成的数组：

```php
/**
 * 确定通知的投递延迟。
 *
 * @return array<string, \Illuminate\Support\Carbon>
 */
public function withDelay(object $notifiable): array
{
    return [
        'mail' => now()->addMinutes(5),
        'sms' => now()->addMinutes(10),
    ];
}
```

<a name="customizing-the-notification-queue-connection"></a>
#### 自定义通知队列连接

默认情况下，入队的通知会使用应用的默认队列连接入队。如果你想为某个特定通知指定不同的连接，可以在通知的构造函数中调用 `onConnection` 方法：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的通知实例。
     */
    public function __construct()
    {
        $this->onConnection('redis');
    }
}
```

或者，如果你想为通知支持的每个通知渠道分别指定特定的队列连接，可以在通知上定义 `viaConnections` 方法。该方法应当返回一个由"渠道名称 / 队列连接名称"组成的数组：

```php
/**
 * 确定每个通知渠道应当使用哪些连接。
 *
 * @return array<string, string>
 */
public function viaConnections(): array
{
    return [
        'mail' => 'redis',
        'database' => 'sync',
    ];
}
```

<a name="customizing-notification-channel-queues"></a>
#### 自定义通知渠道队列

如果你想为通知支持的每个通知渠道分别指定特定的队列，可以在通知上定义 `viaQueues` 方法。该方法应当返回一个由"渠道名称 / 队列名称"组成的数组：

```php
/**
 * 确定每个通知渠道应当使用哪些队列。
 *
 * @return array<string, string>
 */
public function viaQueues(): array
{
    return [
        'mail' => 'mail-queue',
        'slack' => 'slack-queue',
    ];
}
```

<a name="queued-notification-middleware"></a>
#### 入队通知的中间件

入队的通知可以像[队列任务](/docs/{{version}}/queues#job-middleware)一样定义中间件。要开始，请在通知类上定义 `middleware` 方法。`middleware` 方法会接收 `$notifiable` 与 `$channel` 变量，让你可以根据通知的投递目标自定义返回的中间件：

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * 获取通知任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(object $notifiable, string $channel)
{
    return match ($channel) {
        'email' => [new RateLimited('postmark')],
        'slack' => [new RateLimited('slack')],
        default => [],
    };
}
```

<a name="queued-notifications-and-database-transactions"></a>
#### 入队通知与数据库事务

在数据库事务中分发入队的通知时，队列可能在数据库事务提交之前就处理它们。发生这种情况时，你在数据库事务中对模型或数据库记录所做的更新可能尚未反映到数据库中。此外，在事务中创建的模型或数据库记录也可能还不存在于数据库中。如果你的通知依赖这些模型，那么在处理发送该入队通知的任务时就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项被设为 `false`，你仍然可以在发送通知时调用 `afterCommit` 方法，以指明某个特定的入队通知应当在所有打开的数据库事务提交之后再分发：

```php
use App\Notifications\InvoicePaid;

$user->notify((new InvoicePaid($invoice))->afterCommit());
```

或者，你可以在通知的构造函数中调用 `afterCommit` 方法：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的通知实例。
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 若想了解更多如何规避这些问题，请查阅关于[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="determining-if-the-queued-notification-should-be-sent"></a>
#### 判断入队通知是否应当发送

入队通知被分发到队列进行后台处理后，通常会由队列 Worker 接收并发送给预期的收件人。

不过，如果你想在队列 Worker 处理入队通知时再最终决定该通知是否应当发送，可以在通知类上定义 `shouldSend` 方法。如果该方法返回 `false`，通知就不会被发送：

```php
/**
 * 确定该通知是否应当发送。
 */
public function shouldSend(object $notifiable, string $channel): bool
{
    return $this->invoice->isPaid();
}
```

<a name="on-demand-notifications"></a>
### 按需通知

有时你可能需要向并未存储为应用"用户"的人发送通知。使用 `Notification` Facade 的 `route` 方法，你可以在发送通知之前指定临时的通知路由信息：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Notification;

Notification::route('mail', 'taylor@example.com')
    ->route('vonage', '5555555555')
    ->route('slack', '#slack-channel')
    ->route('broadcast', [new Channel('channel-name')])
    ->notify(new InvoicePaid($invoice));
```

如果你想在向 `mail` 路由发送按需通知时提供收件人姓名，可以提供一个数组，其中邮箱地址作为键、姓名作为数组中第一个元素的值：

```php
Notification::route('mail', [
    'barrett@example.com' => 'Barrett Blair',
])->notify(new InvoicePaid($invoice));
```

使用 `routes` 方法，你可以一次性为多个通知渠道提供临时路由信息：

```php
Notification::routes([
    'mail' => ['barrett@example.com' => 'Barrett Blair'],
    'vonage' => '5555555555',
])->notify(new InvoicePaid($invoice));
```

<a name="mail-notifications"></a>
## 邮件通知

<a name="formatting-mail-messages"></a>
### 格式化邮件消息

如果某个通知支持以邮件形式发送，你应当在通知类上定义 `toMail` 方法。该方法会接收一个 `$notifiable` 实体，并应当返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含一些简单的方法，可帮助你构建事务性邮件消息。邮件消息可以包含若干行文本以及一个"行动号召"。我们来看一个 `toMail` 方法示例：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    $url = url('/invoice/'.$this->invoice->id);

    return (new MailMessage)
        ->greeting('Hello!')
        ->line('One of your invoices has been paid!')
        ->lineIf($this->amount > 0, "Amount paid: {$this->amount}")
        ->action('View Invoice', $url)
        ->line('Thank you for using our application!');
}
```

> [!NOTE]
> 注意我们在 `toMail` 方法中使用了 `$this->invoice->id`。你可以把通知生成消息所需的任何数据通过通知的构造函数传入。

在本例中，我们注册了一条问候语、一行文本、一个行动号召，然后又是一行文本。`MailMessage` 对象提供的这些方法让格式化短小的事务性邮件变得简单、快捷。之后，邮件渠道会把这些消息组件转换为一封美观、响应式的 HTML 邮件模板，并附带对应的纯文本版本。下面是由 `mail` 渠道生成的邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> [!NOTE]
> 发送邮件通知时，请务必在 `config/app.php` 配置文件中设置 `name` 配置项。该值会用在邮件通知消息的头部与底部。

<a name="error-messages"></a>
#### 错误消息

有些通知用于告知用户错误，例如发票支付失败。你可以在构建消息时调用 `error` 方法，表明该邮件消息与错误有关。在邮件消息上使用 `error` 方法时，行动号召按钮会变成红色而不是黑色：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->error()
        ->subject('Invoice Payment Failed')
        ->line('...');
}
```

<a name="other-mail-notification-formatting-options"></a>
#### 其他邮件通知格式化选项

除了在通知类中定义文本"行"，你还可以使用 `view` 方法指定一个自定义模板来渲染通知邮件：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        'mail.invoice.paid', ['invoice' => $this->invoice]
    );
}
```

你可以通过把视图名作为传给 `view` 方法的数组的第二个元素，为邮件消息指定纯文本视图：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        ['mail.invoice.paid', 'mail.invoice.paid-text'],
        ['invoice' => $this->invoice]
    );
}
```

或者，如果你的消息只有纯文本视图，可以使用 `text` 方法：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->text(
        'mail.invoice.paid-text', ['invoice' => $this->invoice]
    );
}
```

<a name="customizing-the-sender"></a>
### 自定义发件人

默认情况下，邮件的发件人 / from 地址在 `config/mail.php` 配置文件中定义。不过，你可以使用 `from` 方法为某个特定通知指定发件地址：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->from('barrett@example.com', 'Barrett Blair')
        ->line('...');
}
```

<a name="customizing-the-recipient"></a>
### 自定义收件人

通过 `mail` 渠道发送通知时，通知系统会自动在可通知实体上查找 `email` 属性。你可以通过在可通知实体上定义 `routeNotificationForMail` 方法，自定义用于投递通知的邮箱地址：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为 mail 渠道路由通知。
     *
     * @return  array<string, string>|string
     */
    public function routeNotificationForMail(Notification $notification): array|string
    {
        // 仅返回邮箱地址...
        return $this->email_address;

        // 返回邮箱地址与姓名...
        return [$this->email_address => $this->name];
    }
}
```

<a name="customizing-the-subject"></a>
### 自定义主题

默认情况下，邮件的主题是通知类名格式化后的"Title Case"形式。因此，如果你的通知类名为 `InvoicePaid`，邮件主题就会是 `Invoice Paid`。如果你想为消息指定不同的主题，可以在构建消息时调用 `subject` 方法：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->subject('Notification Subject')
        ->line('...');
}
```

<a name="customizing-the-mailer"></a>
### 自定义邮件器

默认情况下，邮件通知会使用 `config/mail.php` 配置文件中定义的默认邮件器发送。不过，你可以在构建消息时调用 `mailer` 方法，在运行时指定另一个邮件器：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->mailer('postmark')
        ->line('...');
}
```

<a name="customizing-the-templates"></a>
### 自定义模板

你可以通过发布通知包的资源来修改邮件通知所使用的 HTML 与纯文本模板。运行该命令后，邮件通知模板会位于 `resources/views/vendor/notifications` 目录中：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

<a name="mail-attachments"></a>
### 附件

要为邮件通知添加附件，请在构建消息时使用 `attach` 方法。`attach` 方法的第一个参数接受文件的绝对路径：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attach('/path/to/file');
}
```

> [!NOTE]
> 通知邮件消息提供的 `attach` 方法同样接受[可附加对象](/docs/{{version}}/mail#attachable-objects)。请查阅完整的[可附加对象文档](/docs/{{version}}/mail#attachable-objects)了解更多。

给消息附加文件时，你还可以通过向 `attach` 方法传入一个 `array` 作为第二个参数来指定显示名称和/或 MIME 类型：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attach('/path/to/file', [
            'as' => 'name.pdf',
            'mime' => 'application/pdf',
        ]);
}
```

与在 mailable 对象中附加文件不同，你不能使用 `attachFromStorage` 直接从存储磁盘附加文件。你应当改用 `attach` 方法，并传入该文件在存储磁盘上的绝对路径。或者，你也可以从 `toMail` 方法返回一个 [mailable](/docs/{{version}}/mail#generating-mailables)：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;

/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email)
        ->attachFromStorage('/path/to/file');
}
```

必要时，可以使用 `attachMany` 方法为一条消息附加多个文件：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attachMany([
            '/path/to/forge.svg',
            '/path/to/vapor.svg' => [
                'as' => 'Logo.svg',
                'mime' => 'image/svg+xml',
            ],
        ]);
}
```

<a name="raw-data-attachments"></a>
#### 原始数据附件

`attachData` 方法可用于把原始字节字符串作为附件附加。调用 `attachData` 方法时，你应当提供要赋给该附件的文件名：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attachData($this->pdf, 'name.pdf', [
            'mime' => 'application/pdf',
        ]);
}
```

<a name="adding-tags-metadata"></a>
### 添加标签与元数据

某些第三方邮件提供商（如 Mailgun 与 Postmark）支持消息"标签"与"元数据"，可用于对应用发送的邮件进行分组与追踪。你可以通过 `tag` 与 `metadata` 方法为邮件消息添加标签与元数据：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Comment Upvoted!')
        ->tag('upvote')
        ->metadata('comment_id', $this->comment->id);
}
```

如果你的应用使用的是 Mailgun 驱动，可以查阅 Mailgun 文档，了解有关[标签](https://documentation.mailgun.com/en/latest/user_manual.html#tagging-1)与[元数据](https://documentation.mailgun.com/en/latest/user_manual.html#attaching-data-to-messages)的更多信息。同样，也可以查阅 Postmark 文档，了解其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)与[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的支持。

如果你的应用使用 Amazon SES 发送邮件，应当使用 `metadata` 方法为消息附加 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许你注册一个闭包，该闭包会在消息发送之前拿到 Symfony Message 实例被调用。这让你有机会在消息投递之前对其进行深度自定义：

```php
use Symfony\Component\Mime\Email;

/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->withSymfonyMessage(function (Email $message) {
            $message->getHeaders()->addTextHeader(
                'Custom-Header', 'Header Value'
            );
        });
}
```

<a name="using-mailables"></a>
### 使用 Mailable 类

如果需要，你可以从通知的 `toMail` 方法返回一个完整的 [mailable 对象](/docs/{{version}}/mail)。当返回 `Mailable` 而不是 `MailMessage` 时，你需要使用 mailable 对象的 `to` 方法指定消息收件人：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email);
}
```

<a name="mailables-and-on-demand-notifications"></a>
#### Mailable 类与按需通知

如果你正在发送[按需通知](#on-demand-notifications)，传给 `toMail` 方法的 `$notifiable` 实例会是 `Illuminate\Notifications\AnonymousNotifiable` 的实例，它提供了 `routeNotificationFor` 方法，可用于获取该按需通知应当发送到的邮箱地址：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): Mailable
{
    $address = $notifiable instanceof AnonymousNotifiable
        ? $notifiable->routeNotificationFor('mail')
        : $notifiable->email;

    return (new InvoicePaidMailable($this->invoice))
        ->to($address);
}
```

<a name="previewing-mail-notifications"></a>
### 预览邮件通知

在设计邮件通知模板时，像预览普通 Blade 模板那样快速在浏览器中预览渲染后的邮件消息会非常方便。为此，Laravel 允许你直接从路由闭包或控制器返回由邮件通知生成的任意邮件消息。返回 `MailMessage` 时，它会被渲染并显示在浏览器中，让你无需真正发送到某个邮箱地址就能快速预览其设计：

```php
use App\Models\Invoice;
use App\Notifications\InvoicePaid;

Route::get('/notification', function () {
    $invoice = Invoice::find(1);

    return (new InvoicePaid($invoice))
        ->toMail($invoice->user);
});
```

<a name="markdown-mail-notifications"></a>
## Markdown 邮件通知

Markdown 邮件通知让你既能利用邮件通知预置的模板，又能更自由地撰写更长的自定义消息。由于消息以 Markdown 编写，Laravel 能够为消息渲染出美观、响应式的 HTML 模板，同时自动生成对应的纯文本版本。

<a name="generating-the-message"></a>
### 生成消息

要生成带对应 Markdown 模板的通知，可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

与所有其他邮件通知一样，使用 Markdown 模板的通知也应当在其通知类上定义 `toMail` 方法。不过，它不使用 `line` 与 `action` 方法来构建通知，而是使用 `markdown` 方法指定应当使用的 Markdown 模板名称。你希望提供给模板的数据数组可以作为该方法的第二个参数传入：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    $url = url('/invoice/'.$this->invoice->id);

    return (new MailMessage)
        ->subject('Invoice Paid')
        ->markdown('mail.invoice.paid', ['url' => $url]);
}
```

<a name="writing-the-message"></a>
### 编写消息

Markdown 邮件通知混合使用 Blade 组件与 Markdown 语法，让你能够轻松构建通知，同时充分利用 Laravel 预制的通知组件：

```blade
<x-mail::message>
# Invoice Paid

Your invoice has been paid!

<x-mail::button :url="$url">
View Invoice
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
```

<a name="button-component"></a>
#### 按钮组件

按钮组件会渲染一个居中的按钮链接。该组件接受两个参数：`url` 与可选的 `color`。支持的配色为 `primary`、`green` 与 `red`。你可以在一条通知中添加任意多个按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件会把给定的文本块渲染在一个面板中，该面板的背景色与通知其余部分略有不同。这让你能够把注意力吸引到某段文本上：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件让你能够把 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。表格列的对齐方式可以通过默认的 Markdown 表格对齐语法来支持：

```blade
<x-mail::table>
| Laravel       | Table         | Example       |
| ------------- | :-----------: | ------------: |
| Col 2 is      | Centered      | $10           |
| Col 3 is      | Right-Aligned | $20           |
</x-mail::table>
```

<a name="customizing-the-components"></a>
### 自定义组件

你可以把所有 Markdown 通知组件导出到自己的应用中进行自定义。要导出这些组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

该命令会把 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录中。`mail` 目录下会包含 `html` 与 `text` 两个目录，每个目录中都有所有可用组件各自的相应表示形式。你可以随意自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录中会有一个 `default.css` 文件。你可以自定义该文件中的 CSS，你的样式会在 Markdown 通知的 HTML 表示形式中自动内联。

如果你想为 Laravel 的 Markdown 组件构建一套全新主题，可以在 `html/themes` 目录中放入一个 CSS 文件。为 CSS 文件命名并保存后，把 `mail` 配置文件的 `theme` 选项更新为新主题的名称。

要为某条单独的通知自定义主题，可以在构建该通知的邮件消息时调用 `theme` 方法。`theme` 方法接受发送该通知时应使用的主题名称：

```php
/**
 * 获取通知的邮件表示形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->theme('invoice')
        ->subject('Invoice Paid')
        ->markdown('mail.invoice.paid', ['url' => $url]);
}
```

<a name="database-notifications"></a>
## 数据库通知

<a name="database-prerequisites"></a>
### 先决条件

`database` 通知渠道会把通知信息存储在数据库表中。该表会包含通知类型以及描述该通知的 JSON 数据结构等信息。

你可以查询该表，在应用的用户界面中展示通知。但在那之前，你需要先创建一张用于存放通知的数据库表。你可以使用 `make:notifications-table` 命令生成带有正确表结构的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan make:notifications-table

php artisan migrate
```

> [!NOTE]
> 如果你的可通知模型使用的是 [UUID 或 ULID 主键](/docs/{{version}}/eloquent#uuid-and-ulid-keys)，你应当把通知表迁移中的 `morphs` 方法替换为 [`uuidMorphs`](/docs/{{version}}/migrations#column-method-uuidMorphs)或 [`ulidMorphs`](/docs/{{version}}/migrations#column-method-ulidMorphs)。

<a name="formatting-database-notifications"></a>
### 格式化数据库通知

如果某个通知支持存储在数据库表中，你应当在通知类上定义 `toDatabase` 或 `toArray` 方法。该方法会接收一个 `$notifiable` 实体，并应当返回一个普通 PHP 数组。返回的数组会被编码为 JSON，并存储在 `notifications` 表的 `data` 列中。我们来看一个 `toArray` 方法示例：

```php
/**
 * 获取通知的数组表示形式。
 *
 * @return array<string, mixed>
 */
public function toArray(object $notifiable): array
{
    return [
        'invoice_id' => $this->invoice->id,
        'amount' => $this->invoice->amount,
    ];
}
```

通知存储到应用数据库中时，`type` 列默认会被设为通知的类名，而 `read_at` 列会是 `null`。不过，你可以通过在通知类中定义 `databaseType` 与 `initialDatabaseReadAtValue` 方法来自定义这一行为：

```php
use Illuminate\Support\Carbon;

/**
 * 获取通知的数据库类型。
 */
public function databaseType(object $notifiable): string
{
    return 'invoice-paid';
}

/**
 * 获取 "read_at" 列的初始值。
 */
public function initialDatabaseReadAtValue(): ?Carbon
{
    return null;
}
```

<a name="todatabase-vs-toarray"></a>
#### `toDatabase` 与 `toArray`

`toArray` 方法也被 `broadcast` 渠道用来确定要向基于 JavaScript 的前端广播哪些数据。如果你希望 `database` 与 `broadcast` 渠道使用两种不同的数组表示形式，就应当定义 `toDatabase` 方法而不是 `toArray` 方法。

<a name="accessing-the-notifications"></a>
### 访问通知

通知存储到数据库后，你需要一种便捷的方式从可通知实体中访问它们。Laravel 默认的 `App\Models\User` 模型所引入的 `Illuminate\Notifications\Notifiable` Trait 包含一个 `notifications` [Eloquent 关联](/docs/{{version}}/eloquent-relationships)，用于返回该实体的通知。要获取通知，你可以像访问其他任何 Eloquent 关联一样访问该方法。默认情况下，通知会按 `created_at` 时间戳排序，集合中最新创建的通知排在最前面：

```php
$user = App\Models\User::find(1);

foreach ($user->notifications as $notification) {
    echo $notification->type;
}
```

如果你只想获取"未读"通知，可以使用 `unreadNotifications` 关联。同样，这些通知会按 `created_at` 时间戳排序，集合中最新创建的通知排在最前面：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    echo $notification->type;
}
```

> [!NOTE]
> 要从 JavaScript 客户端访问你的通知，你应当为应用定义一个通知控制器，用于返回某个可通知实体（例如当前用户）的通知。然后，就可以从 JavaScript 客户端向该控制器的 URL 发起 HTTP 请求。

<a name="marking-notifications-as-read"></a>
### 把通知标记为已读

通常，当用户查看某条通知时，你会希望把它标记为"已读"。`Illuminate\Notifications\Notifiable` Trait 提供了 `markAsRead` 方法，用于更新通知数据库记录上的 `read_at` 列：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    $notification->markAsRead();
}
```

不过，除了遍历每条通知，你也可以直接在一个通知集合上调用 `markAsRead` 方法：

```php
$user->unreadNotifications->markAsRead();
```

你还可以使用批量更新查询，在不从数据库取回通知的情况下把所有通知标记为已读：

```php
$user = App\Models\User::find(1);

$user->unreadNotifications()->update(['read_at' => now()]);
```

你可以 `delete` 这些通知，把它们从表中彻底移除：

```php
$user->notifications()->delete();
```

<a name="broadcast-notifications"></a>
## 广播通知

<a name="broadcast-prerequisites"></a>
### 先决条件

在广播通知之前，你应当先配置并熟悉 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务。事件广播提供了一种方式，让你基于 JavaScript 的前端能够响应服务端的 Laravel 事件。

<a name="formatting-broadcast-notifications"></a>
### 格式化广播通知

`broadcast` 渠道使用 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务来广播通知，让你基于 JavaScript 的前端能够实时接收通知。如果某个通知支持广播，你可以在通知类上定义 `toBroadcast` 方法。该方法会接收一个 `$notifiable` 实体，并应当返回一个 `BroadcastMessage` 实例。如果 `toBroadcast` 方法不存在，就会使用 `toArray` 方法来收集需要广播的数据。返回的数据会被编码为 JSON，并广播到你基于 JavaScript 的前端。我们来看一个 `toBroadcast` 方法示例：

```php
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * 获取通知的可广播表示形式。
 */
public function toBroadcast(object $notifiable): BroadcastMessage
{
    return new BroadcastMessage([
        'invoice_id' => $this->invoice->id,
        'amount' => $this->invoice->amount,
    ]);
}
```

<a name="broadcast-queue-configuration"></a>
#### 广播队列配置

所有广播通知都会入队以便广播。如果你想配置用于把广播操作入队的队列连接或队列名称，可以使用 `BroadcastMessage` 的 `onConnection` 与 `onQueue` 方法：

```php
return (new BroadcastMessage($data))
    ->onConnection('sqs')
    ->onQueue('broadcasts');
```

<a name="customizing-the-notification-type"></a>
#### 自定义通知类型

除了你指定的数据之外，所有广播通知还带有一个 `type` 字段，其中包含通知的完整类名。如果你想自定义通知 `type`，可以在通知类上定义 `broadcastType` 方法：

```php
/**
 * 获取被广播的通知类型。
 */
public function broadcastType(): string
{
    return 'broadcast.message';
}
```

<a name="listening-for-notifications"></a>
### 监听通知

通知会在一个私有频道上广播，频道名按 `{notifiable}.{id}` 的形式生成。因此，如果你要向 ID 为 `1` 的 `App\Models\User` 实例发送通知，该通知会在 `App.Models.User.1` 这个私有频道上广播。使用 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation)时，你可以用 `notification` 方法轻松地在某个频道上监听通知：

```js
Echo.private('App.Models.User.' + userId)
    .notification((notification) => {
        console.log(notification.type);
    });
```

<a name="customizing-the-notification-channel"></a>
#### 自定义通知频道

如果你想自定义某个实体的广播通知在哪个频道上广播，可以在可通知实体上定义 `receivesBroadcastNotificationsOn` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 用户接收通知广播的频道。
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'users.'.$this->id;
    }
}
```

<a name="sms-notifications"></a>
## 短信通知

<a name="sms-prerequisites"></a>
### 先决条件

Laravel 中的短信通知由 [Vonage](https://www.vonage.com/)（原 Nexmo）提供支持。在通过 Vonage 发送通知之前，你需要安装 `laravel/vonage-notification-channel` 与 `guzzlehttp/guzzle` 软件包：

```shell
composer require laravel/vonage-notification-channel guzzlehttp/guzzle
```

该软件包包含一个[配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。不过，你并不一定要把这个配置文件导出到自己的应用中。只需使用 `VONAGE_KEY` 与 `VONAGE_SECRET` 环境变量来定义你的 Vonage 公钥与私钥即可。

定义好密钥后，你应当设置一个 `VONAGE_SMS_FROM` 环境变量，用来定义默认情况下短信的发送号码。你可以在 Vonage 控制面板中生成该号码：

```ini
VONAGE_SMS_FROM=15556666666
```

<a name="formatting-sms-notifications"></a>
### 格式化短信通知

如果某个通知支持以短信形式发送，你应当在通知类上定义 `toVonage` 方法。该方法会接收一个 `$notifiable` 实体，并应当返回一个 `Illuminate\Notifications\Messages\VonageMessage` 实例：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表示形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your SMS message content');
}
```

<a name="unicode-content"></a>
#### Unicode 内容

如果你的短信内容包含 Unicode 字符，应当在构建 `VonageMessage` 实例时调用 `unicode` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表示形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your unicode message')
        ->unicode();
}
```

<a name="customizing-the-from-number"></a>
### 自定义"发件人"号码

如果你希望某些通知的发送号码不同于 `VONAGE_SMS_FROM` 环境变量所指定的号码，可以在 `VonageMessage` 实例上调用 `from` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表示形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your SMS message content')
        ->from('15554443333');
}
```

<a name="adding-a-client-reference"></a>
### 添加客户端引用

如果你想按用户、团队或客户来跟踪成本，可以为通知添加一个"客户端引用"。Vonage 允许你使用该客户端引用生成报表，从而更好地了解某个特定客户的短信使用情况。客户端引用可以是长度不超过 40 个字符的任意字符串：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表示形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->clientReference((string) $notifiable->id)
        ->content('Your SMS message content');
}
```

<a name="routing-sms-notifications"></a>
### 路由短信通知

要把 Vonage 通知路由到正确的电话号码，请在可通知实体上定义 `routeNotificationForVonage` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为 Vonage 渠道路由通知。
     */
    public function routeNotificationForVonage(Notification $notification): string
    {
        return $this->phone_number;
    }
}
```

<a name="slack-notifications"></a>
## Slack 通知

<a name="slack-prerequisites"></a>
### 先决条件

在发送 Slack 通知之前，你应当通过 Composer 安装 Slack 通知渠道：

```shell
composer require laravel/slack-notification-channel
```

此外，你还必须为你的 Slack 工作区创建一个 [Slack App](https://api.slack.com/apps?new_app=1)。

如果你只需要向创建该 App 的同一个 Slack 工作区发送通知，应当确保你的 App 具备 `chat:write`、`chat:write.public` 与 `chat:write.customize` 权限范围。如果你想以 Slack App 的身份发送消息，还应当确保 App 具备 `chat:write:bot` 权限范围。这些权限范围可以在 Slack 的 "OAuth & Permissions" App 管理标签页中添加。

接下来，复制该 App 的 "Bot User OAuth Token"，并把它放入应用 `services.php` 配置文件中的 `slack` 配置数组。该令牌可以在 Slack 的 "OAuth & Permissions" 标签页中找到：

```php
'slack' => [
    'notifications' => [
        'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
        'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
    ],
],
```

<a name="slack-app-distribution"></a>
#### App 分发

如果你的应用要向由应用用户所拥有的外部 Slack 工作区发送通知，就需要通过 Slack "分发"你的 App。App 分发可以在 Slack 中 App 的 "Manage Distribution" 标签页中管理。App 分发完成后，你可以使用 [Socialite](/docs/{{version}}/socialite)代表应用用户[获取 Slack Bot 令牌](/docs/{{version}}/socialite#slack-bot-scopes)。

<a name="formatting-slack-notifications"></a>
### 格式化 Slack 通知

如果某个通知支持以 Slack 消息形式发送，你应当在通知类上定义 `toSlack` 方法。该方法会接收一个 `$notifiable` 实体，并应当返回一个 `Illuminate\Notifications\Slack\SlackMessage` 实例。你可以使用 [Slack 的 Block Kit API](https://api.slack.com/block-kit)构建内容丰富的通知。下面的示例可以在 [Slack 的 Block Kit builder](https://app.slack.com/block-kit-builder/T01KWS6K23Z#%7B%22blocks%22:%5B%7B%22type%22:%22header%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Invoice%20Paid%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22plain_text%22,%22text%22:%22Customer%20%231234%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22An%20invoice%20has%20been%20paid.%22%7D,%22fields%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20No:*%5Cn1000%22%7D,%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20Recipient:*%5Cntaylor@laravel.com%22%7D%5D%7D,%7B%22type%22:%22divider%22%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Congratulations!%22%7D%7D%5D%7D)中预览：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表示形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
        ->text('One of your invoices has been paid!')
        ->headerBlock('Invoice Paid')
        ->contextBlock(function (ContextBlock $block) {
            $block->text('Customer #1234');
        })
        ->sectionBlock(function (SectionBlock $block) {
            $block->text('An invoice has been paid.');
            $block->field("*Invoice No:*\n1000")->markdown();
            $block->field("*Invoice Recipient:*\ntaylor@laravel.com")->markdown();
        })
        ->dividerBlock()
        ->sectionBlock(function (SectionBlock $block) {
            $block->text('Congratulations!');
        });
}
```

<a name="using-slacks-block-kit-builder-template"></a>
#### 使用 Slack 的 Block Kit Builder 模板

除了使用流式消息构建方法来构造 Block Kit 消息，你也可以把 Slack Block Kit Builder 生成的原始 JSON 载荷传给 `usingBlockKitTemplate` 方法：

```php
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Support\Str;

/**
 * 获取通知的 Slack 表示形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    $template = <<<JSON
        {
          "blocks": [
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Team Announcement"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "plain_text",
                "text": "We are hiring!"
              }
            }
          ]
        }
    JSON;

    return (new SlackMessage)
        ->usingBlockKitTemplate($template);
}
```

<a name="slack-interactivity"></a>
### Slack 交互

Slack 的 Block Kit 通知系统提供了强大的功能来[处理用户交互](https://api.slack.com/interactivity/handling)。要使用这些功能，你的 Slack App 应当启用 "Interactivity"，并配置一个指向应用所提供 URL 的 "Request URL"。这些设置可以在 Slack 的 "Interactivity & Shortcuts" App 管理标签页中管理。

在下面这个使用 `actionsBlock` 方法的示例中，Slack 会向你的 "Request URL" 发送一个 `POST` 请求，其载荷包含点击按钮的 Slack 用户、被点击按钮的 ID 等信息。之后，你的应用可以根据该载荷决定要执行的操作。你还应当[验证该请求](https://api.slack.com/authentication/verifying-requests-from-slack)确实来自 Slack：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表示形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
        ->text('One of your invoices has been paid!')
        ->headerBlock('Invoice Paid')
        ->contextBlock(function (ContextBlock $block) {
            $block->text('Customer #1234');
        })
        ->sectionBlock(function (SectionBlock $block) {
            $block->text('An invoice has been paid.');
        })
        ->actionsBlock(function (ActionsBlock $block) {
             // ID 默认为 "button_acknowledge_invoice"...
            $block->button('Acknowledge Invoice')->primary();

            // 手动配置 ID...
            $block->button('Deny')->danger()->id('deny_invoice');
        });
}
```

<a name="slack-confirmation-modals"></a>
#### 确认弹窗

如果你希望用户在执行某个操作之前必须先确认，可以在定义按钮时调用 `confirm` 方法。`confirm` 方法接受一条消息以及一个接收 `ConfirmObject` 实例的闭包：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表示形式。
 */
public function toSlack(object $notifiable): SlackMessage
{
    return (new SlackMessage)
        ->text('One of your invoices has been paid!')
        ->headerBlock('Invoice Paid')
        ->contextBlock(function (ContextBlock $block) {
            $block->text('Customer #1234');
        })
        ->sectionBlock(function (SectionBlock $block) {
            $block->text('An invoice has been paid.');
        })
        ->actionsBlock(function (ActionsBlock $block) {
            $block->button('Acknowledge Invoice')
                ->primary()
                ->confirm(
                    'Acknowledge the payment and send a thank you email?',
                    function (ConfirmObject $dialog) {
                        $dialog->confirm('Yes');
                        $dialog->deny('No');
                    }
                );
        });
}
```

<a name="inspecting-slack-blocks"></a>
#### 检查 Slack Block

如果你想快速检查自己正在构建的 block，可以在 `SlackMessage` 实例上调用 `dd` 方法。`dd` 方法会生成并输出一个指向 Slack [Block Kit Builder](https://app.slack.com/block-kit-builder/)的 URL，在浏览器中展示该载荷与通知的预览。你可以向 `dd` 方法传入 `true` 来输出原始载荷：

```php
return (new SlackMessage)
        ->text('One of your invoices has been paid!')
        ->headerBlock('Invoice Paid')
        ->dd();
```

<a name="routing-slack-notifications"></a>
### 路由 Slack 通知

要把 Slack 通知定向到合适的 Slack 团队与频道，请在可通知模型上定义 `routeNotificationForSlack` 方法。该方法可以返回以下三种值之一：

- `null`——把路由交由通知本身中配置的频道决定。你可以在构建 `SlackMessage` 时使用 `to` 方法在通知中配置频道。
- 一个字符串，指定通知要发送到的 Slack 频道，例如 `#support-channel`。
- 一个 `SlackRoute` 实例，允许你指定 OAuth 令牌与频道名称，例如 `SlackRoute::make($this->slack_channel, $this->slack_token)`。向外部工作区发送通知时应当使用这种方式。

例如，从 `routeNotificationForSlack` 方法返回 `#support-channel`，就会把通知发送到应用 `services.php` 配置文件中 Bot User OAuth 令牌所关联工作区的 `#support-channel` 频道：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为 Slack 渠道路由通知。
     */
    public function routeNotificationForSlack(Notification $notification): mixed
    {
        return '#support-channel';
    }
}
```

<a name="notifying-external-slack-workspaces"></a>
### 通知外部 Slack 工作区

> [!NOTE]
> 在向外部 Slack 工作区发送通知之前，你的 Slack App 必须先[分发](#slack-app-distribution)。

当然，你经常需要向应用用户所拥有的 Slack 工作区发送通知。为此，你首先需要为用户获取一个 Slack OAuth 令牌。幸运的是，[Laravel Socialite](/docs/{{version}}/socialite)自带一个 Slack 驱动，让你能够轻松地让用户通过 Slack 完成认证，并[获取 bot 令牌](/docs/{{version}}/socialite#slack-bot-scopes)。

获取到 bot 令牌并把它存进应用数据库之后，你就可以使用 `SlackRoute::make` 方法把通知路由到该用户的工作区。此外，你的应用很可能还需要提供一个入口，让用户指定通知应当发送到哪个频道：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackRoute;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 为 Slack 渠道路由通知。
     */
    public function routeNotificationForSlack(Notification $notification): mixed
    {
        return SlackRoute::make($this->slack_channel, $this->slack_token);
    }
}
```

<a name="localizing-notifications"></a>
## 本地化通知

Laravel 允许你以 HTTP 请求当前区域设置之外的区域设置发送通知，即使通知入队，它也会记住该区域设置。

为此，`Illuminate\Notifications\Notification` 类提供了 `locale` 方法来设置期望的语言。在通知求值期间，应用会切换到该区域设置，求值完成后再切回之前的区域设置：

```php
$user->notify((new InvoicePaid($invoice))->locale('es'));
```

多个可通知条目的本地化也可以通过 `Notification` Facade 实现：

```php
Notification::locale('es')->send(
    $users, new InvoicePaid($invoice)
);
```

<a name="user-preferred-locales"></a>
### 用户首选区域设置

有时，应用会存储每个用户首选的区域设置。通过在可通知模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送通知时使用该已存储的区域设置：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * 获取用户首选的区域设置。
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

实现该接口后，Laravel 会在向该模型发送通知与 mailable 时自动使用首选的区域设置。因此，使用该接口时无需调用 `locale` 方法：

```php
$user->notify(new InvoicePaid($invoice));
```

<a name="testing"></a>
## 测试

你可以使用 `Notification` Facade 的 `fake` 方法来阻止通知实际发送。通常，发送通知与你真正要测试的代码无关。大多数情况下，只要断言 Laravel 已被指示发送某个给定的通知就足够了。

调用 `Notification` Facade 的 `fake` 方法后，你就可以断言通知已被指示发送给用户，甚至可以检查通知收到的数据：

```php tab=Pest
<?php

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;

test('orders can be shipped', function () {
    Notification::fake();

    // Perform order shipping...

    // Assert that no notifications were sent...
    Notification::assertNothingSent();

    // Assert a notification was sent to the given users...
    Notification::assertSentTo(
        [$user], OrderShipped::class
    );

    // Assert a notification was not sent...
    Notification::assertNotSentTo(
        [$user], AnotherNotification::class
    );

    // Assert that a given number of notifications were sent...
    Notification::assertCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Notification::fake();

        // Perform order shipping...

        // Assert that no notifications were sent...
        Notification::assertNothingSent();

        // Assert a notification was sent to the given users...
        Notification::assertSentTo(
            [$user], OrderShipped::class
        );

        // Assert a notification was not sent...
        Notification::assertNotSentTo(
            [$user], AnotherNotification::class
        );

        // Assert that a given number of notifications were sent...
        Notification::assertCount(3);
    }
}
```

你可以向 `assertSentTo` 或 `assertNotSentTo` 方法传入一个闭包，用来断言某个满足给定"真值测试"的通知已被发送。如果至少有一个满足该真值测试的通知被发送，断言就会成功：

```php
Notification::assertSentTo(
    $user,
    function (OrderShipped $notification, array $channels) use ($order) {
        return $notification->order->id === $order->id;
    }
);
```

<a name="on-demand-notifications"></a>
#### 按需通知

如果你正在测试的代码发送了[按需通知](#on-demand-notifications)，可以使用 `assertSentOnDemand` 方法测试该按需通知是否已发送：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过向 `assertSentOnDemand` 方法传入一个闭包作为第二个参数，你可以判断某条按需通知是否被发送到了正确的"路由"地址：

```php
Notification::assertSentOnDemand(
    OrderShipped::class,
    function (OrderShipped $notification, array $channels, object $notifiable) use ($user) {
        return $notifiable->routes['mail'] === $user->email;
    }
);
```

<a name="notification-events"></a>
## 通知事件

<a name="notification-sending-event"></a>
#### 通知发送中事件

通知发送期间，通知系统会分发 `Illuminate\Notifications\Events\NotificationSending` 事件。该事件包含"可通知"实体与通知实例本身。你可以在应用中为该事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSending;

class CheckNotificationStatus
{
    /**
     * 处理给定的事件。
     */
    public function handle(NotificationSending $event): void
    {
        // ...
    }
}
```

如果 `NotificationSending` 事件的某个监听器在其 `handle` 方法中返回 `false`，该通知就不会被发送：

```php
/**
 * 处理给定的事件。
 */
public function handle(NotificationSending $event): bool
{
    return false;
}
```

在事件监听器中，你可以访问事件上的 `notifiable`、`notification` 与 `channel` 属性，以了解更多关于通知接收者或通知本身的信息：

```php
/**
 * 处理给定的事件。
 */
public function handle(NotificationSending $event): void
{
    // $event->channel
    // $event->notifiable
    // $event->notification
}
```

<a name="notification-sent-event"></a>
#### 通知已发送事件

通知发送完成后，通知系统会分发 `Illuminate\Notifications\Events\NotificationSent` [事件](/docs/{{version}}/events)。该事件包含"可通知"实体与通知实例本身。你可以在应用中为该事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSent;

class LogNotification
{
    /**
     * 处理给定的事件。
     */
    public function handle(NotificationSent $event): void
    {
        // ...
    }
}
```

在事件监听器中，你可以访问事件上的 `notifiable`、`notification`、`channel` 与 `response` 属性，以了解更多关于通知接收者或通知本身的信息：

```php
/**
 * 处理给定的事件。
 */
public function handle(NotificationSent $event): void
{
    // $event->channel
    // $event->notifiable
    // $event->notification
    // $event->response
}
```

<a name="custom-channels"></a>
## 自定义渠道

Laravel 自带了若干通知渠道，但你可能想编写自己的驱动，通过其他渠道投递通知。Laravel 让这件事变得很简单。要开始，请定义一个包含 `send` 方法的类。该方法应当接收两个参数：`$notifiable` 与 `$notification`。

在 `send` 方法中，你可以调用通知上的方法来获取一个你的渠道能够理解的消息对象，然后按你希望的方式把通知发送给 `$notifiable` 实例：

```php
<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class VoiceChannel
{
    /**
     * 发送给定的通知。
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toVoice($notifiable);

        // 把通知发送给 $notifiable 实例...
    }
}
```

定义好通知渠道类之后，你可以从任意通知的 `via` 方法中返回该类名。在本例中，你的通知的 `toVoice` 方法可以返回你选择的任意对象来表示语音消息。例如，你可以定义自己的 `VoiceMessage` 类来表示这些消息：

```php
<?php

namespace App\Notifications;

use App\Notifications\Messages\VoiceMessage;
use App\Notifications\VoiceChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification
{
    use Queueable;

    /**
     * 获取通知渠道。
     */
    public function via(object $notifiable): string
    {
        return VoiceChannel::class;
    }

    /**
     * 获取通知的语音表示形式。
     */
    public function toVoice(object $notifiable): VoiceMessage
    {
        // ...
    }
}
```