# 通知

- [简介](#introduction)
- [生成通知](#generating-notifications)
- [发送通知](#sending-notifications)
    - [使用 Notifiable Trait](#using-the-notifiable-trait)
    - [使用 Notification Facade](#using-the-notification-facade)
    - [指定投递渠道](#specifying-delivery-channels)
    - [排队通知](#queueing-notifications)
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
    - [使用 Mailable](#using-mailables)
    - [预览邮件通知](#previewing-mail-notifications)
- [Markdown 邮件通知](#markdown-mail-notifications)
    - [生成消息](#generating-the-message)
    - [编写消息](#writing-the-message)
    - [自定义组件](#customizing-the-components)
- [数据库通知](#database-notifications)
    - [先决条件](#database-prerequisites)
    - [格式化数据库通知](#formatting-database-notifications)
    - [访问通知](#accessing-the-notifications)
    - [将通知标记为已读](#marking-notifications-as-read)
- [广播通知](#broadcast-notifications)
    - [先决条件](#broadcast-prerequisites)
    - [格式化广播通知](#formatting-broadcast-notifications)
    - [监听通知](#listening-for-notifications)
- [SMS 通知](#sms-notifications)
    - [先决条件](#sms-prerequisites)
    - [格式化 SMS 通知](#formatting-sms-notifications)
    - [自定义 "From" 号码](#customizing-the-from-number)
    - [添加客户端引用](#adding-a-client-reference)
    - [路由 SMS 通知](#routing-sms-notifications)
- [Slack 通知](#slack-notifications)
    - [先决条件](#slack-prerequisites)
    - [格式化 Slack 通知](#formatting-slack-notifications)
    - [Slack 交互性](#slack-interactivity)
    - [路由 Slack 通知](#routing-slack-notifications)
    - [通知外部 Slack 工作区](#notifying-external-slack-workspaces)
- [本地化通知](#localizing-notifications)
- [测试](#testing)
- [通知事件](#notification-events)
- [自定义渠道](#custom-channels)

<a name="introduction"></a>
## 简介

除了支持[发送邮件](/docs/{{version}}/mail)之外，Laravel 还支持通过多种投递渠道发送通知，包括电子邮件、SMS（通过 [Vonage](https://www.vonage.com/communications-apis/)，原名 Nexmo）和 [Slack](https://slack.com)。此外，还创建了各种[社区构建的通知渠道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可通过数十种不同的渠道发送通知！通知也可以存储在数据库中，以便在你的 Web 界面中显示。

通常，通知应该是简短的信息性消息，通知用户应用中发生的某些事情。例如，如果你正在编写计费应用，你可能通过邮件和 SMS 渠道向用户发送"发票已支付"通知。

<a name="generating-notifications"></a>
## 生成通知

在 Laravel 中，每个通知都由一个单独的类表示，通常存储在 `app/Notifications` 目录中。如果你在应用中看不到此目录，请不要担心——当你运行 `make:notification` Artisan 命令时会为你创建它：

```shell
php artisan make:notification InvoicePaid
```

此命令会在 `app/Notifications` 目录中放置一个新的通知类。每个通知类都包含一个 `via` 方法以及数量可变的消息构建方法，如 `toMail` 或 `toDatabase`，它们将通知转换为针对特定渠道定制的消息。

<a name="sending-notifications"></a>
## 发送通知

<a name="using-the-notifiable-trait"></a>
### 使用 Notifiable Trait

通知可以通过两种方式发送：使用 `Notifiable` Trait 的 `notify` 方法，或使用 `Notification` [Facade](/docs/{{version}}/facades)。`Notifiable` Trait 默认包含在你应用的 `App\Models\User` 模型中：

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

此 Trait 提供的 `notify` 方法期望接收一个通知实例：

```php
use App\Notifications\InvoicePaid;

$user->notify(new InvoicePaid($invoice));
```

> [!NOTE]
> 请记住，你可以在任何模型上使用 `Notifiable` Trait。你不限于只在 `User` 模型上使用它。

<a name="using-the-notification-facade"></a>
### 使用 Notification Facade

或者，你可以通过 `Notification` [Facade](/docs/{{version}}/facades) 发送通知。当你需要向多个可通知实体（如用户集合）发送通知时，此方法很有用。要使用 Facade 发送通知，请将所有可通知实体和通知实例传递给 `send` 方法：

```php
use Illuminate\Support\Facades\Notification;

Notification::send($users, new InvoicePaid($invoice));
```

你也可以使用 `sendNow` 方法立即发送通知。即使通知实现了 `ShouldQueue` 接口，此方法也会立即发送通知：

```php
Notification::sendNow($developers, new DeploymentCompleted($deployment));
```

<a name="specifying-delivery-channels"></a>
### 指定投递渠道

每个通知类都有一个 `via` 方法，用于确定通知将通过哪些渠道投递。通知可以通过 `mail`、`database`、`broadcast`、`vonage` 和 `slack` 渠道发送。

> [!NOTE]
> 如果你想使用 Telegram 或 Pusher 等其他投递渠道，请查看社区驱动的 [Laravel Notification Channels 网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，该实例将是通知发送目标的类的实例。你可以使用 `$notifiable` 来确定通知应通过哪些渠道投递：

```php
/**
 * Get the notification's delivery channels.
 *
 * @return array<int, string>
 */
public function via(object $notifiable): array
{
    return $notifiable->prefers_sms ? ['vonage'] : ['mail', 'database'];
}
```

<a name="queueing-notifications"></a>
### 排队通知

> [!WARNING]
> 在排队通知之前，你应配置队列并[启动工作进程](/docs/{{version}}/queues#running-the-queue-worker)。

发送通知可能需要时间，尤其是当渠道需要发出外部 API 调用以投递通知时。为加快应用响应时间，通过向类添加 `ShouldQueue` 接口和 `Queueable` Trait 让你的通知被排队。接口和 Trait 已为使用 `make:notification` 命令生成的所有通知导入，因此你可以立即将它们添加到通知类中：

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

将 `ShouldQueue` 接口添加到通知后，你可以像平常一样发送通知。Laravel 将检测类上的 `ShouldQueue` 接口，并自动排队通知的投递：

```php
$user->notify(new InvoicePaid($invoice));
```

排队通知时，将为每个收件人与渠道组合创建一个队列任务。例如，如果你的通知有三个收件人和两个渠道，将向队列分发六个任务。

<a name="delaying-notifications"></a>
#### 延迟通知

如果你想延迟通知的投递，可以将 `delay` 方法链式附加到通知实例化上：

```php
$delay = now()->plus(minutes: 10);

$user->notify((new InvoicePaid($invoice))->delay($delay));
```

你可以向 `delay` 方法传递一个数组，为特定渠道指定延迟时间：

```php
$user->notify((new InvoicePaid($invoice))->delay([
    'mail' => now()->plus(minutes: 5),
    'sms' => now()->plus(minutes: 10),
]));
```

或者，你可以在通知类本身上定义一个 `withDelay` 方法。`withDelay` 方法应返回一个渠道名称与延迟值的数组：

```php
/**
 * Determine the notification's delivery delay.
 *
 * @return array<string, \Illuminate\Support\Carbon>
 */
public function withDelay(object $notifiable): array
{
    return [
        'mail' => now()->plus(minutes: 5),
        'sms' => now()->plus(minutes: 10),
    ];
}
```

<a name="customizing-the-notification-queue-connection"></a>
#### 自定义通知队列连接

默认情况下，排队的通知将使用应用默认的队列连接排队。如果你想为特定通知指定应使用的不同连接，可以在通知的构造函数中调用 `onConnection` 方法：

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
     * Create a new notification instance.
     */
    public function __construct()
    {
        $this->onConnection('redis');
    }
}
```

或者，如果你想为通知支持的每个通知渠道指定应使用的特定队列连接，可以在通知上定义一个 `viaConnections` 方法。此方法应返回一个渠道名称 / 队列连接名称对数组：

```php
/**
 * Determine which connections should be used for each notification channel.
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

如果你想为通知支持的每个通知渠道指定应使用的特定队列，可以在通知上定义一个 `viaQueues` 方法。此方法应返回一个渠道名称 / 队列名称对数组：

```php
/**
 * Determine which queues should be used for each notification channel.
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

<a name="customizing-queued-notification-job-properties"></a>
#### 自定义排队通知任务属性

你可以通过在通知类上定义队列属性来自定义底层排队任务的行为。这些属性将被发送通知的排队任务继承：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\FailOnTimeout;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;

#[Tries(5)]
#[Timeout(120)]
#[MaxExceptions(3)]
#[FailOnTimeout]
class InvoicePaid extends Notification implements ShouldQueue
{
    use Queueable;

    // ...
}
```

如果你想通过[加密](/docs/{{version}}/encryption)确保排队通知数据的隐私和完整性，请向通知类添加 `ShouldBeEncrypted` 接口：

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable;

    // ...
}
```

除了直接在通知类上定义这些属性外，你还可以定义 `backoff` 和 `retryUntil` 方法来指定排队通知任务的退避策略和重试超时：

```php
use DateTime;

/**
 * Calculate the number of seconds to wait before retrying the notification.
 */
public function backoff(): int
{
    return 3;
}

/**
 * Determine the time at which the notification should timeout.
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 5);
}
```

> [!NOTE]
> 有关这些任务属性和方法的更多信息，请查看关于[队列任务](/docs/{{version}}/queues#max-job-attempts-and-timeout)的文档。

<a name="queued-notification-middleware"></a>
#### 排队通知中间件

排队通知可以定义中间件，[就像排队任务一样](/docs/{{version}}/queues#job-middleware)。要开始，请在通知类上定义一个 `middleware` 方法。`middleware` 方法将接收 `$notifiable` 和 `$channel` 变量，允许你根据通知的目标自定义返回的中间件：

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * Get the middleware the notification job should pass through.
 *
 * @return array<int, object>
 */
public function middleware(object $notifiable, string $channel)
{
    return match ($channel) {
        'mail' => [new RateLimited('postmark')],
        'slack' => [new RateLimited('slack')],
        default => [],
    };
}
```

<a name="queued-notifications-and-database-transactions"></a>
#### 排队通知与数据库事务

当排队通知在数据库事务内分发时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录在数据库中可能还不存在。如果你的通知依赖这些模型，当发送排队通知的任务被处理时，可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在发送通知时调用 `afterCommit` 方法，指示特定排队通知应在所有打开的数据库事务提交后分发：

```php
use App\Notifications\InvoicePaid;

$user->notify((new InvoicePaid($invoice))->afterCommit());
```

或者，你可以从通知的构造函数中调用 `afterCommit` 方法：

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
     * Create a new notification instance.
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解更多关于解决这些问题的信息，请查看关于[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="determining-if-the-queued-notification-should-be-sent"></a>
#### 判断是否应发送排队通知

在排队通知被分发到队列以进行后台处理后，它通常会被队列工作进程接受并发送到其预期收件人。

但是，如果你想在队列工作进程处理后最终决定是否应发送排队通知，可以在通知类上定义一个 `shouldSend` 方法。如果此方法返回 `false`，则不会发送通知：

```php
/**
 * Determine if the notification should be sent.
 */
public function shouldSend(object $notifiable, string $channel): bool
{
    return $this->invoice->isPaid();
}
```

<a name="after-sending-notifications"></a>
#### 发送通知后

如果你想在通知发送后执行代码，可以在通知类上定义一个 `afterSending` 方法。此方法将接收可通知实体、渠道名称和渠道的响应：

```php
/**
 * Handle the notification after it has been sent.
 */
public function afterSending(object $notifiable, string $channel, mixed $response): void
{
    // ...
}
```

<a name="on-demand-notifications"></a>
### 按需通知

有时你可能需要向未存储为应用"用户"的人发送通知。使用 `Notification` Facade 的 `route` 方法，你可以在发送通知前指定临时的通知路由信息：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Notification;

Notification::route('mail', 'taylor@example.com')
    ->route('vonage', '5555555555')
    ->route('slack', '#slack-channel')
    ->route('broadcast', [new Channel('channel-name')])
    ->notify(new InvoicePaid($invoice));
```

如果你想在向 `mail` 路由发送按需通知时提供收件人名称，可以提供一个数组，其中数组第一个元素以电子邮件地址为键、名称为值：

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

如果通知支持作为电子邮件发送，你应在通知类上定义一个 `toMail` 方法。此方法将接收一个 `$notifiable` 实体，并应返回 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含几个简单的方法，帮助你构建事务性电子邮件消息。邮件消息可以包含文本行以及"行动号召"。让我们看一个 `toMail` 方法示例：

```php
/**
 * Get the mail representation of the notification.
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
> 注意我们在 `toMail` 方法中使用了 `$this->invoice->id`。你可以将通知生成消息所需的任何数据传递到通知的构造函数中。

在此示例中，我们注册了一个问候语、一行文本、一个行动号召，然后是另一行文本。`MailMessage` 对象提供的这些方法使得格式化小型事务性邮件变得简单快捷。然后，`mail` 渠道会将消息组件转换为美观、响应式的 HTML 邮件模板，并带有纯文本对应版本。以下是 `mail` 渠道生成的邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> [!NOTE]
> 发送邮件通知时，请确保在 `config/app.php` 配置文件中设置 `name` 配置选项。此值将用于邮件通知消息的页眉和页脚。

<a name="error-messages"></a>
#### 错误消息

某些通知告知用户错误，例如失败的发票支付。你可以通过在构建消息时调用 `error` 方法，指示邮件消息与错误有关。在邮件消息上使用 `error` 方法时，行动号召按钮将为红色而不是黑色：

```php
/**
 * Get the mail representation of the notification.
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

与其在通知类中定义文本"行"，你可以使用 `view` 方法指定应渲染通知邮件的自定义模板：

```php
/**
 * Get the mail representation of the notification.
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        'mail.invoice.paid', ['invoice' => $this->invoice]
    );
}
```

你可以通过将视图名称作为数组的第二个元素传递给 `view` 方法，为邮件消息指定纯文本视图：

```php
/**
 * Get the mail representation of the notification.
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
 * Get the mail representation of the notification.
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

默认情况下，邮件的发件人 / from 地址定义在 `config/mail.php` 配置文件中。但是，你可以使用 `from` 方法为特定通知指定 from 地址：

```php
/**
 * Get the mail representation of the notification.
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

通过 `mail` 渠道发送通知时，通知系统会自动在你的可通知实体上查找 `email` 属性。你可以通过在可通知实体上定义一个 `routeNotificationForMail` 方法，自定义用于投递通知的电子邮件地址：

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
     * Route notifications for the mail channel.
     *
     * @return  array<string, string>|string
     */
    public function routeNotificationForMail(Notification $notification): array|string
    {
        // Return email address only...
        return $this->email_address;

        // Return email address and name...
        return [$this->email_address => $this->name];
    }
}
```

<a name="customizing-the-subject"></a>
### 自定义主题

默认情况下，邮件的主题是格式化为"Title Case"的通知类名称。因此，如果你的通知类名为 `InvoicePaid`，邮件的主题将是 `Invoice Paid`。如果你想为消息指定不同的主题，可以在构建消息时调用 `subject` 方法：

```php
/**
 * Get the mail representation of the notification.
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

默认情况下，电子邮件通知将使用 `config/mail.php` 配置文件中定义的默认邮件器发送。但是，你可以在构建消息时调用 `mailer` 方法，在运行时指定不同的邮件器：

```php
/**
 * Get the mail representation of the notification.
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

你可以通过发布通知包的资源来修改邮件通知使用的 HTML 和纯文本模板。运行此命令后，邮件通知模板将位于 `resources/views/vendor/notifications` 目录中：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

<a name="mail-attachments"></a>
### 附件

要向电子邮件通知添加附件，请在构建消息时使用 `attach` 方法。`attach` 方法接受文件的绝对路径作为第一个参数：

```php
/**
 * Get the mail representation of the notification.
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attach('/path/to/file');
}
```

> [!NOTE]
> 通知邮件消息提供的 `attach` 方法也接受[可附加对象](/docs/{{version}}/mail#attachable-objects)。请查阅全面的[可附加对象文档](/docs/{{version}}/mail#attachable-objects)了解更多信息。

向消息附加文件时，你还可以通过向 `attach` 方法传递一个 `array` 作为第二个参数来指定显示名称和 / 或 MIME 类型：

```php
/**
 * Get the mail representation of the notification.
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

必要时，可以使用 `attachMany` 方法向消息附加多个文件：

```php
/**
 * Get the mail representation of the notification.
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

你可以使用 `attachFromStorageDisk` 方法附加存在于特定[文件系统磁盘](/docs/{{version}}/filesystem)上的文件。此方法接受磁盘名称和该磁盘上文件的路径：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;

/**
 * Get the mail representation of the notification.
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email)
        ->attachFromStorageDisk('s3', '/path/to/file', 'invoice.pdf', [
            'mime' => 'application/pdf',
        ]);
}
```

<a name="raw-data-attachments"></a>
#### 原始数据附件

`attachData` 方法可用于将原始字节字符串作为附件附加。调用 `attachData` 方法时，你应提供应分配给附件的文件名：

```php
/**
 * Get the mail representation of the notification.
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

Mailgun 和 Postmark 等一些第三方邮件提供商支持消息"标签"和"元数据"，可用于分组和跟踪应用发送的邮件。你可以通过 `tag` 和 `metadata` 方法向电子邮件消息添加标签和元数据：

```php
/**
 * Get the mail representation of the notification.
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Comment Upvoted!')
        ->tag('upvote')
        ->metadata('comment_id', $this->comment->id);
}
```

如果你的应用使用 Mailgun 驱动，你可以查阅 Mailgun 文档，了解更多关于[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的信息。同样，也可以查阅 Postmark 文档，了解他们对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的支持。

如果你的应用使用 Amazon SES 发送邮件，则应使用 `metadata` 方法将 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息上。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许你注册一个闭包，该闭包将在发送消息前使用 Symfony Message 实例调用。这使你有机会在消息被投递前深度自定义它：

```php
use Symfony\Component\Mime\Email;

/**
 * Get the mail representation of the notification.
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
### 使用 Mailable

如有需要，你可以从通知的 `toMail` 方法返回一个完整的[mailable 对象](/docs/{{version}}/mail)。当返回 `Mailable` 而不是 `MailMessage` 时，你需要使用 mailable 对象的 `to` 方法指定消息收件人：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Mail\Mailable;

/**
 * Get the mail representation of the notification.
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email);
}
```

<a name="mailables-and-on-demand-notifications"></a>
#### Mailable 与按需通知

如果你正在发送[按需通知](#on-demand-notifications)，提供给 `toMail` 方法的 `$notifiable` 实例将是 `Illuminate\Notifications\AnonymousNotifiable` 的实例，它提供了一个 `routeNotificationFor` 方法，可用于检索按需通知应发送到的电子邮件地址：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Mail\Mailable;

/**
 * Get the mail representation of the notification.
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

设计邮件通知模板时，像普通的 Blade 模板一样在浏览器中快速预览渲染的邮件消息会很方便。因此，Laravel 允许你直接从路由闭包或控制器返回邮件通知生成的任何邮件消息。返回 `MailMessage` 时，它将被渲染并在浏览器中显示，使你无需将其发送到真实电子邮件地址即可快速预览其设计：

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

Markdown 邮件通知允许你利用邮件通知的预构建模板，同时给你更多自由编写更长、更定制的消息。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染美观、响应式的 HTML 模板，同时自动生成纯文本对应版本。

<a name="generating-the-message"></a>
### 生成消息

要生成带有相应 Markdown 模板的通知，可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

与所有其他邮件通知一样，使用 Markdown 模板的通知应在其通知类上定义一个 `toMail` 方法。但是，与其使用 `line` 和 `action` 方法构建通知，不如使用 `markdown` 方法指定应使用的 Markdown 模板名称。你希望提供给模板的数据数组可以作为方法的第二个参数传递：

```php
/**
 * Get the mail representation of the notification.
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

Markdown 邮件通知使用 Blade 组件和 Markdown 语法的组合，让你可以轻松构建通知，同时利用 Laravel 预制的通知组件：

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

> [!NOTE]
> 编写 Markdown 邮件时不要使用过多的缩进。按照 Markdown 标准，Markdown 解析器会将缩进的内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中的按钮链接。该组件接受两个参数：`url` 和可选的 `color`。支持的颜色为 `primary`、`green` 和 `red`。你可以根据需要向通知添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件在具有与通知其余部分略有不同背景颜色的面板中渲染给定的文本块。这使你可以将注意力吸引到给定的文本块上：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。表格列对齐使用默认的 Markdown 表格对齐语法：

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

你可以将所有的 Markdown 通知组件导出到你自己的应用中以便自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录都包含每个可用组件的相应表示形式。你可以随心所欲地自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动内联到 Markdown 通知的 HTML 表示形式中。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存 CSS 文件后，更新 `mail` 配置文件中的 `theme` 选项，使其与新主题名称匹配。

要为单个通知自定义主题，你可以在构建通知的邮件消息时调用 `theme` 方法。`theme` 方法接受发送通知时应使用的主题名称：

```php
/**
 * Get the mail representation of the notification.
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

`database` 通知渠道将通知信息存储在数据库表中。此表将包含通知类型以及描述通知的 JSON 数据结构等信息。

你可以查询该表以在应用的用户界面中显示通知。但是，在此之前，你需要创建一张数据库表来保存通知。你可以使用 `make:notifications-table` 命令生成具有正确表模式的[迁移](/docs/{{version}}/migrations)：

```shell
php artisan make:notifications-table

php artisan migrate
```

> [!NOTE]
> 如果你的可通知模型使用 [UUID 或 ULID 主键](/docs/{{version}}/eloquent#uuid-and-ulid-keys)，你应在通知表迁移中将 `morphs` 方法替换为 [uuidMorphs](/docs/{{version}}/migrations#column-method-uuidMorphs) 或 [ulidMorphs](/docs/{{version}}/migrations#column-method-ulidMorphs)。

<a name="formatting-database-notifications"></a>
### 格式化数据库通知

如果通知支持存储在数据库表中，你应在通知类上定义一个 `toDatabase` 或 `toArray` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个普通的 PHP 数组。返回的数组将编码为 JSON 并存储在 `notifications` 表的 `data` 列中。让我们看一个 `toArray` 方法示例：

```php
/**
 * Get the array representation of the notification.
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

当通知存储在应用数据库中时，`type` 列将默认设置为通知的类名称，`read_at` 列将为 `null`。但是，你可以通过在通知类中定义 `databaseType` 和 `initialDatabaseReadAtValue` 方法来自定义此行为：

```php
use Illuminate\Support\Carbon;

/**
 * Get the notification's database type.
 */
public function databaseType(object $notifiable): string
{
    return 'invoice-paid';
}

/**
 * Get the initial value for the "read_at" column.
 */
public function initialDatabaseReadAtValue(): ?Carbon
{
    return null;
}
```

<a name="todatabase-vs-toarray"></a>
#### `toDatabase` 与 `toArray`

`toArray` 方法也由 `broadcast` 渠道用于确定要向 JavaScript 驱动的前端广播哪些数据。如果你想为 `database` 和 `broadcast` 渠道提供两种不同的数组表示形式，应定义一个 `toDatabase` 方法，而不是 `toArray` 方法。

<a name="accessing-the-notifications"></a>
### 访问通知

通知存储在数据库中后，你需要一种便捷的方式从可通知实体访问它们。包含在 Laravel 默认 `App\Models\User` 模型上的 `Illuminate\Notifications\Notifiable` Trait 包含一个返回实体通知的 `notifications` [Eloquent 关联](/docs/{{version}}/eloquent-relationships)。要获取通知，你可以像访问任何其他 Eloquent 关联一样访问此方法。默认情况下，通知将按 `created_at` 时间戳排序，最新通知位于集合开头：

```php
$user = App\Models\User::find(1);

foreach ($user->notifications as $notification) {
    echo $notification->type;
}
```

如果你只想检索"未读"通知，可以使用 `unreadNotifications` 关联。同样，这些通知将按 `created_at` 时间戳排序，最新通知位于集合开头：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    echo $notification->type;
}
```

如果你只想检索"已读"通知，可以使用 `readNotifications` 关联：

```php
$user = App\Models\User::find(1);

foreach ($user->readNotifications as $notification) {
    echo $notification->type;
}
```

> [!NOTE]
> 要从 JavaScript 客户端访问通知，你应为应用定义一个通知控制器，为可通知实体（如当前用户）返回通知。然后，你可以从 JavaScript 客户端向该控制器的 URL 发出 HTTP 请求。

<a name="marking-notifications-as-read"></a>
### 将通知标记为已读

通常，当用户查看通知时，你会希望将其标记为"已读"。`Illuminate\Notifications\Notifiable` Trait 提供了一个 `markAsRead` 方法，它更新通知数据库记录上的 `read_at` 列：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    $notification->markAsRead();
}
```

但是，与其循环遍历每个通知，你可以直接在通知集合上使用 `markAsRead` 方法：

```php
$user->unreadNotifications->markAsRead();
```

你也可以使用批量更新查询将所有通知标记为已读，而无需从数据库检索它们：

```php
$user = App\Models\User::find(1);

$user->unreadNotifications()->update(['read_at' => now()]);
```

你可以 `delete` 通知以将其从表中完全移除：

```php
$user->notifications()->delete();
```

<a name="broadcast-notifications"></a>
## 广播通知

<a name="broadcast-prerequisites"></a>
### 先决条件

广播通知之前，你应配置并熟悉 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务。事件广播提供了一种从 JavaScript 驱动的前端响应服务器端 Laravel 事件的方式。

<a name="formatting-broadcast-notifications"></a>
### 格式化广播通知

`broadcast` 渠道使用 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务广播通知，使 JavaScript 驱动的前端能够实时捕获通知。如果通知支持广播，你可以在通知类上定义一个 `toBroadcast` 方法。此方法将接收一个 `$notifiable` 实体，并应返回 `BroadcastMessage` 实例。如果 `toBroadcast` 方法不存在，将使用 `toArray` 方法收集应广播的数据。返回的数据将编码为 JSON 并广播到 JavaScript 驱动的前端。让我们看一个 `toBroadcast` 方法示例：

```php
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * Get the broadcastable representation of the notification.
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

所有广播通知都会被排队以进行广播。如果你想配置用于排队广播操作的队列连接或队列名称，可以使用 `BroadcastMessage` 的 `onConnection` 和 `onQueue` 方法：

```php
return (new BroadcastMessage($data))
    ->onConnection('sqs')
    ->onQueue('broadcasts');
```

<a name="customizing-the-notification-type"></a>
#### 自定义通知类型

除了你指定的数据之外，所有广播通知都有一个包含通知完整类名的 `type` 字段。如果你想自定义通知 `type`，可以在通知类上定义一个 `broadcastType` 方法：

```php
/**
 * Get the type of the notification being broadcast.
 */
public function broadcastType(): string
{
    return 'broadcast.message';
}
```

<a name="listening-for-notifications"></a>
### 监听通知

通知将在使用 `{notifiable}.{id}` 约定格式化的私有渠道上广播。因此，如果你向 ID 为 `1` 的 `App\Models\User` 实例发送通知，通知将在 `App.Models.User.1` 私有渠道上广播。使用 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时，你可以使用 `notification` 方法轻松在渠道上监听通知：

```js
Echo.private('App.Models.User.' + userId)
    .notification((notification) => {
        console.log(notification.type);
    });
```

<a name="using-react-or-vue"></a>
#### 使用 React、Vue 或 Svelte

Laravel Echo 包含 React、Vue 和 Svelte hook，使监听通知变得轻松。要开始，调用 `useEchoNotification` hook，它用于监听通知。当消费组件卸载时，`useEchoNotification` hook 将自动离开渠道：

```js tab=React
import { useEchoNotification } from "@laravel/echo-react";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoNotification } from "@laravel/echo-vue";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
);
</script>
```

```svelte tab=Svelte
<script>
import { useEchoNotification } from "@laravel/echo-svelte";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
);
</script>
```

默认情况下，hook 监听所有通知。要指定你想监听的通知类型，你可以向 `useEchoNotification` 提供一个字符串或类型数组：

```js tab=React
import { useEchoNotification } from "@laravel/echo-react";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
    'App.Notifications.InvoicePaid',
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoNotification } from "@laravel/echo-vue";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
    'App.Notifications.InvoicePaid',
);
</script>
```

```svelte tab=Svelte
<script>
import { useEchoNotification } from "@laravel/echo-svelte";

useEchoNotification(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.type);
    },
    'App.Notifications.InvoicePaid',
);
</script>
```

你还可以指定通知负载数据的形状，提供更强的类型安全和编辑便利性：

```ts
type InvoicePaidNotification = {
    invoice_id: number;
    created_at: string;
};

useEchoNotification<InvoicePaidNotification>(
    `App.Models.User.${userId}`,
    (notification) => {
        console.log(notification.invoice_id);
        console.log(notification.created_at);
        console.log(notification.type);
    },
    'App.Notifications.InvoicePaid',
);
```

<a name="customizing-the-notification-channel"></a>
#### 自定义通知渠道

如果你想自定义实体的广播通知广播到哪个渠道，可以在可通知实体上定义一个 `receivesBroadcastNotificationsOn` 方法：

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
     * The channels the user receives notification broadcasts on.
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'users.'.$this->id;
    }
}
```

<a name="sms-notifications"></a>
## SMS 通知

<a name="sms-prerequisites"></a>
### 先决条件

在 Laravel 中发送 SMS 通知由 [Vonage](https://www.vonage.com/)（原名 Nexmo）驱动。在你通过 Vonage 发送通知之前，需要安装 `laravel/vonage-notification-channel` 和 `guzzlehttp/guzzle` 包：

```shell
composer require laravel/vonage-notification-channel guzzlehttp/guzzle
```

该包包含一个[配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。但是，你不需要将此配置文件导出到自己的应用。你可以简单地使用 `VONAGE_KEY` 和 `VONAGE_SECRET` 环境变量定义你的 Vonage 公钥和密钥。

定义密钥后，应设置一个 `VONAGE_SMS_FROM` 环境变量，定义默认发送 SMS 消息的电话号码。你可以在 Vonage 控制面板中生成此电话号码：

```ini
VONAGE_SMS_FROM=15556666666
```

<a name="formatting-sms-notifications"></a>
### 格式化 SMS 通知

如果通知支持作为 SMS 发送，你应在通知类上定义一个 `toVonage` 方法。此方法将接收一个 `$notifiable` 实体，并应返回 `Illuminate\Notifications\Messages\VonageMessage` 实例：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * Get the Vonage / SMS representation of the notification.
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your SMS message content');
}
```

<a name="unicode-content"></a>
#### Unicode 内容

如果你的 SMS 消息将包含 unicode 字符，应在构建 `VonageMessage` 实例时调用 `unicode` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * Get the Vonage / SMS representation of the notification.
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your unicode message')
        ->unicode();
}
```

<a name="customizing-the-from-number"></a>
### 自定义 "From" 号码

如果你想从与 `VONAGE_SMS_FROM` 环境变量指定的电话号码不同的号码发送某些通知，可以在 `VonageMessage` 实例上调用 `from` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * Get the Vonage / SMS representation of the notification.
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

如果你想跟踪每个用户、团队或客户端的成本，可以向通知添加"客户端引用"。Vonage 将允许你使用此客户端引用生成报告，以便更好地理解特定客户的 SMS 使用情况。客户端引用可以是任何最长 40 个字符的字符串：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * Get the Vonage / SMS representation of the notification.
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->clientReference((string) $notifiable->id)
        ->content('Your SMS message content');
}
```

<a name="routing-sms-notifications"></a>
### 路由 SMS 通知

要将 Vonage 通知路由到正确的电话号码，请在可通知实体上定义一个 `routeNotificationForVonage` 方法：

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
     * Route notifications for the Vonage channel.
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

发送 Slack 通知之前，应通过 Composer 安装 Slack 通知渠道：

```shell
composer require laravel/slack-notification-channel
```

此外，你必须为 Slack 工作区创建一个 [Slack App](https://api.slack.com/apps?new_app=1)。

如果你只需要向创建 App 的同一 Slack 工作区发送通知，应确保你的 App 具有 `chat:write`、`chat:write.public` 和 `chat:write.customize` 作用域。这些作用域可以从 Slack 中的"OAuth & Permissions"App 管理标签页添加。

接下来，复制 App 的"Bot User OAuth Token"，并将其放置在应用 `services.php` 配置文件中的 `slack` 配置数组中。此令牌可以在 Slack 中的"OAuth & Permissions"标签页找到：

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

如果你的应用将向应用用户拥有的外部 Slack 工作区发送通知，你需要通过 Slack"分发"你的 App。App 分发可以在 Slack 中 App 的"Manage Distribution"标签页进行管理。App 分发后，你可以使用 [Socialite](/docs/{{version}}/socialite) 代表应用用户[获取 Slack Bot 令牌](/docs/{{version}}/socialite#slack-bot-scopes)。

<a name="formatting-slack-notifications"></a>
### 格式化 Slack 通知

如果通知支持作为 Slack 消息发送，你应在通知类上定义一个 `toSlack` 方法。此方法将接收一个 `$notifiable` 实体，并应返回 `Illuminate\Notifications\Slack\SlackMessage` 实例。你可以使用 [Slack 的 Block Kit API](https://api.slack.com/block-kit) 构建丰富的通知。以下示例可以在 [Slack 的 Block Kit builder](https://app.slack.com/block-kit-builder/T01KWS6K23Z#%7B%22blocks%22:%5B%7B%22type%22:%22header%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Invoice%20Paid%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22plain_text%22,%22text%22:%22Customer%20%231234%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22An%20invoice%20has%20been%20paid.%22%7D,%22fields%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20No:*%5Cn1000%22%7D,%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20Recipient:*%5Cntaylor@laravel.com%22%7D%5D%7D,%7B%22type%22:%22divider%22%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Congratulations!%22%7D%7D%5D%7D) 预览：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * Get the Slack representation of the notification.
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

与其使用流式消息构建器方法构建 Block Kit 消息，你可以将 Slack Block Kit Builder 生成的原始 JSON 负载提供给 `usingBlockKitTemplate` 方法：

```php
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Support\Str;

/**
 * Get the Slack representation of the notification.
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
### Slack 交互性

Slack 的 Block Kit 通知系统提供了强大的功能来[处理用户交互](https://api.slack.com/interactivity/handling)。要利用这些功能，你的 Slack App 应启用"Interactivity"并配置一个指向应用提供的 URL 的"Request URL"。这些设置可以在 Slack 中的"Interactivity & Shortcuts"App 管理标签页进行管理。

在以下使用 `actionsBlock` 方法的示例中，Slack 将向你的"Request URL"发送 `POST` 请求，负载包含点击按钮的 Slack 用户、被点击按钮的 ID 等。然后，你的应用可以根据负载确定要执行的操作。你还应[验证请求](https://api.slack.com/authentication/verifying-requests-from-slack)是由 Slack 发出的：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * Get the Slack representation of the notification.
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
             // ID defaults to "button_acknowledge_invoice"...
            $block->button('Acknowledge Invoice')->primary();

            // Manually configure the ID...
            $block->button('Deny')->danger()->id('deny_invoice');
        });
}
```

<a name="slack-confirmation-modals"></a>
#### 确认模态框

如果你希望要求用户在执行操作前确认操作，可以在定义按钮时调用 `confirm` 方法。`confirm` 方法接受一条消息和一个接收 `ConfirmObject` 实例的闭包：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * Get the Slack representation of the notification.
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
#### 检查 Slack 块

如果你想快速检查正在构建的块，可以在 `SlackMessage` 实例上调用 `dd` 方法。`dd` 方法将生成并转储一个指向 Slack [Block Kit Builder](https://app.slack.com/block-kit-builder/) 的 URL，它会在浏览器中显示负载和通知的预览。你可以向 `dd` 方法传递 `true` 以转储原始负载：

```php
return (new SlackMessage)
    ->text('One of your invoices has been paid!')
    ->headerBlock('Invoice Paid')
    ->dd();
```

<a name="routing-slack-notifications"></a>
### 路由 Slack 通知

要将 Slack 通知定向到适当的 Slack 团队和渠道，请在可通知模型上定义一个 `routeNotificationForSlack` 方法。此方法可以返回以下三个值之一：

- `null` - 将路由推迟到通知本身配置的渠道。你可以在构建 `SlackMessage` 时使用 `to` 方法在通知内配置渠道。
- 一个字符串，指定要将通知发送到的 Slack 渠道，例如 `#support-channel`。
- 一个 `SlackRoute` 实例，允许你指定 OAuth 令牌和渠道名称，例如 `SlackRoute::make($this->slack_channel, $this->slack_token)`。此方法应用于向外部工作区发送通知。

例如，从 `routeNotificationForSlack` 方法返回 `#support-channel` 将把通知发送到与应用 `services.php` 配置文件中 Bot User OAuth 令牌关联的工作区中的 `#support-channel` 渠道：

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
     * Route notifications for the Slack channel.
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
> 在向外部 Slack 工作区发送通知之前，你的 Slack App 必须已[分发](#slack-app-distribution)。

当然，你通常希望向应用用户拥有的 Slack 工作区发送通知。为此，你首先需要为用户获取 Slack OAuth 令牌。幸运的是，[Laravel Socialite](/docs/{{version}}/socialite) 包含一个 Slack 驱动，允许你轻松使用 Slack 认证应用用户并[获取 bot 令牌](/docs/{{version}}/socialite#slack-bot-scopes)。

获取 bot 令牌并将其存储到应用数据库中后，你可以使用 `SlackRoute::make` 方法将通知路由到用户的工作区。此外，你的应用很可能需要为用户提供一个指定应将通知发送到哪个渠道的机会：

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
     * Route notifications for the Slack channel.
     */
    public function routeNotificationForSlack(Notification $notification): mixed
    {
        return SlackRoute::make($this->slack_channel, $this->slack_token);
    }
}
```

<a name="localizing-notifications"></a>
## 本地化通知

Laravel 允许你以 HTTP 请求当前区域设置以外的语言环境发送通知，如果通知被排队，它甚至会记住此语言环境。

为此，`Illuminate\Notifications\Notification` 类提供了一个 `locale` 方法来设置所需语言。当通知被求值时，应用将切换到该语言环境，求值完成后将恢复到之前的语言环境：

```php
$user->notify((new InvoicePaid($invoice))->locale('es'));
```

也可以通过对 `Notification` Facade 实现多个可通知条目的本地化：

```php
Notification::locale('es')->send(
    $users, new InvoicePaid($invoice)
);
```

<a name="user-preferred-locales"></a>
#### 用户偏好的语言环境

有时，应用会存储每个用户偏好的语言环境。通过在可通知模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送通知时使用此存储的语言环境：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * Get the user's preferred locale.
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

实现该接口后，Laravel 将自动在向模型发送通知和 mailable 时使用偏好的语言环境。因此，使用此接口时无需调用 `locale` 方法：

```php
$user->notify(new InvoicePaid($invoice));
```

<a name="testing"></a>
## 测试

你可以使用 `Notification` Facade 的 `fake` 方法防止通知被发送。通常，发送通知与你实际测试的代码无关。很可能，只需断言 Laravel 已被指示发送给定通知就足够了。

调用 `Notification` Facade 的 `fake` 方法后，你可以断言通知已被指示发送给用户，甚至可以检查通知接收的数据：

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

    // Assert a notification was sent twice...
    Notification::assertSentTimes(WeeklyReminder::class, 2);

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

        // Assert a notification was sent twice...
        Notification::assertSentTimes(WeeklyReminder::class, 2);

        // Assert that a given number of notifications were sent...
        Notification::assertCount(3);
    }
}
```

你可以向 `assertSentTo` 或 `assertNotSentTo` 方法传递一个闭包，以断言通过给定"真值测试"的通知已被发送。如果至少有一个通知通过给定真值测试被发送，则断言将成功：

```php
Notification::assertSentTo(
    $user,
    function (OrderShipped $notification, array $channels) use ($order) {
        return $notification->order->id === $order->id;
    }
);
```

<a name="testing-on-demand-notifications"></a>
#### 按需通知测试

如果你正在测试的代码发送[按需通知](#on-demand-notifications)，你可以通过 `assertSentOnDemand` 方法测试按需通知是否已发送：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过向 `assertSentOnDemand` 方法传递闭包作为第二个参数，你可以判断按需通知是否已发送到正确的"route"地址：

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
#### 通知发送事件

当通知正在发送时，通知系统会触发 `Illuminate\Notifications\Events\NotificationSending` 事件。它包含"可通知"实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSending;

class CheckNotificationStatus
{
    /**
     * Handle the event.
     */
    public function handle(NotificationSending $event): void
    {
        // ...
    }
}
```

如果 `NotificationSending` 事件的监听器从其 `handle` 方法返回 `false`，则不会发送通知：

```php
/**
 * Handle the event.
 */
public function handle(NotificationSending $event): bool
{
    return false;
}
```

在事件监听器内，你可以访问事件上的 `notifiable`、`notification` 和 `channel` 属性，以了解更多关于通知收件人或通知本身的信息：

```php
/**
 * Handle the event.
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

当通知被发送时，通知系统会触发 `Illuminate\Notifications\Events\NotificationSent` [事件](/docs/{{version}}/events)。它包含"可通知"实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSent;

class LogNotification
{
    /**
     * Handle the event.
     */
    public function handle(NotificationSent $event): void
    {
        // ...
    }
}
```

在事件监听器内，你可以访问事件上的 `notifiable`、`notification`、`channel` 和 `response` 属性，以了解更多关于通知收件人或通知本身的信息：

```php
/**
 * Handle the event.
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

Laravel 自带少量通知渠道，但你可能希望编写自己的驱动以通过其他渠道投递通知。Laravel 使这变得简单。要开始，请定义一个包含 `send` 方法的类。该方法应接收两个参数：`$notifiable` 和 `$notification`。

在 `send` 方法内，你可以调用通知上的方法以检索渠道可理解的消息对象，然后以你希望的方式将通知发送给 `$notifiable` 实例：

```php
<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class VoiceChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toVoice($notifiable);

        // Send notification to the $notifiable instance...
    }
}
```

定义通知渠道类后，你可以从任何通知的 `via` 方法返回类名。在此示例中，通知的 `toVoice` 方法可以返回你选择用来表示语音消息的任何对象。例如，你可以定义自己的 `VoiceMessage` 类来表示这些消息：

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
     * Get the notification channels.
     */
    public function via(object $notifiable): string
    {
        return VoiceChannel::class;
    }

    /**
     * Get the voice representation of the notification.
     */
    public function toVoice(object $notifiable): VoiceMessage
    {
        // ...
    }
}
```
