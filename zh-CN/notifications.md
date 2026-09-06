# 通知

## 简介

除了支持[发送邮件](/topic/Laravel%2013.x/d6vro0rv3g.html)之外，Laravel 还支持通过多种传送频道发送通知，包括邮件、短信（通过 [Vonage](https://www.vonage.com/communications-apis/)，前身为 Nexmo）和 [Slack](https://slack.com)。此外，社区已经创建了多种[社区构建的通知频道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可以通过数十个不同的频道发送通知！通知也可以存储在数据库中，以便在 Web 界面中显示。

通常，通知应该是简短的信息性消息，用于告知用户应用中中发生的某些事件。例如，如果你正在编写一个计费应用，可以通过电子邮件和短信频道向用户发送「发票已支付」通知。

## 生成通知

在 Laravel 中，每个通知都由一个类表示，通常存储在 `app/Notifications` 目录中。如果你的应用中看不到此目录，请不要担心——当你运行 `make:notification` Artisan 命令时，系统会为你创建该目录：

```shell
php artisan make:notification InvoicePaid
```

此命令会将一个新的通知类放入应用的 `app/Notifications` 目录中。每个通知类都包含一个 `via` 方法和数量可变的消息构建方法（如 `toMail` 或 `toDatabase`），这些方法将通知转换为针对特定频道量身定制的消息。

## 发送通知

### 使用 Notifiable Trait

可以通过两种方式发送通知：使用 `Notifiable` Trait 的 `notify` 方法，或使用 `Notification` [Facade](/topic/Laravel%2013.x/569x508yep.html)。默认情况下，`Notifiable` Trait 包含在应用的 `App\Models\User` 模型中：

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
> 请记住，你可以在任何模型上使用 `Notifiable` Trait，不限于仅在 `User` 模型上使用。

### 使用 Notification Facade

或者，你可以通过 `Notification` [Facade](/topic/Laravel%2013.x/569x508yep.html) 发送通知。当你需要向多个可通知实体（例如用户集合）发送通知时，此方法非常有用。要使用 Facade 发送通知，请将所有可通知实体和通知实例传递给 `send` 方法：

```php
use Illuminate\Support\Facades\Notification;

Notification::send($users, new InvoicePaid($invoice));
```

你还可以使用 `sendNow` 方法立即发送通知。即使通知实现了 `ShouldQueue` 接口，此方法也会立即发送通知：

```php
Notification::sendNow($developers, new DeploymentCompleted($deployment));
```

### 指定传送频道

每个通知类都有一个 `via` 方法，用于确定通知将通过哪些频道传送。通知可以通过 `mail`、`database`、`broadcast`、`vonage` 和 `slack` 频道发送。

> [!NOTE]
> 如果你想使用其他传送频道（如 Telegram 或 Pusher），请查看社区维护的 [Laravel Notification Channels 网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，该实例将是通知发送目标类的实例。你可以使用 `$notifiable` 来确定通知应通过哪些频道传送：

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

### 队列化通知

> [!WARNING]
> 在队列化通知之前，应配置队列并[启动 worker](/topic/Laravel%2013.x/wevwmkz9l2.html)。

发送通知可能需要一些时间，特别是当频道需要进行外部 API 调用以传送通知时。为了加快应用的响应时间，可以通过向类添加 `ShouldQueue` 接口和 `Queueable` Trait 来让通知进入队列。该接口和 Trait 已为使用 `make:notification` 命令生成的所有通知导入，因此可以立即将它们添加到通知类中：

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

将 `ShouldQueue` 接口添加到通知后，你可以像往常一样发送通知。Laravel 将检测类上的 `ShouldQueue` 接口并自动将通知的传送加入队列：

```php
$user->notify(new InvoicePaid($invoice));
```

队列化通知时，将为每个收件人和频道组合创建一个队列任务。例如，如果通知有三个收件人和两个频道，将向队列分发六个任务。

#### 延迟通知

如果希望延迟传送通知，可以在通知实例化上链接 `delay` 方法：

```php
$delay = now()->plus(minutes: 10);

$user->notify((new InvoicePaid($invoice))->delay($delay));
```

你可以将数组传递给 `delay` 方法，以为特定频道指定延迟时长：

```php
$user->notify((new InvoicePaid($invoice))->delay([
    'mail' => now()->plus(minutes: 5),
    'sms' => now()->plus(minutes: 10),
]));
```

或者，你可以在通知类本身上定义 `withDelay` 方法。`withDelay` 方法应返回频道名称和延迟值的数组：

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

#### 自定义通知队列连接

默认情况下，队列化通知将使用应用的默认队列连接进行排队。如果希望为特定通知指定应使用的不同连接，可以在通知的构造函数中调用 `onConnection` 方法：

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

或者，如果希望为通知支持的每个通知频道指定应使用的特定队列连接，可以在通知上定义 `viaConnections` 方法。此方法应返回频道名称/队列连接名称对数组：

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

#### 自定义通知频道队列

如果希望为通知支持的每个通知频道指定应使用的特定队列，可以在通知上定义 `viaQueues` 方法。此方法应返回频道名称/队列名称对数组：

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

#### 自定义队列化通知任务属性

你可以通过在通知类上定义队列属性来自定义底层队列化任务的行为。这些属性将由发送通知的队列任务继承：

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

如果你希望通过[加密](/topic/Laravel%2013.x/enyd5k197d.html)确保队列化通知数据的隐私性和完整性，请将 `ShouldBeEncrypted` 接口添加到通知类：

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

除了直接在通知类上定义这些属性外，你还可以定义 `backoff` 和 `retryUntil` 方法，以指定队列化通知任务的退避策略和重试超时：

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
> 有关这些任务属性和方法的更多信息，请查阅有关[队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html)的文档。

#### 队列化通知中间件

队列化通知可以像[队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html)一样定义中间件。首先，在通知类上定义 `middleware` 方法。`middleware` 方法将接收 `$notifiable` 和 `$channel` 变量，使你能够根据通知的目标自定义返回的中间件：

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

#### 队列化通知与数据库事务

在数据库事务中分发队列化通知时，它们可能会在数据库事务提交之前由队列处理。发生这种情况时，在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的通知依赖于这些模型，则在处理发送队列化通知的任务时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，则仍可以通过在发送通知时调用 `afterCommit` 方法来指示应在所有打开的数据库事务提交后再分发特定的队列化通知：

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
> 要了解有关解决这些问题的更多信息，请查看有关[队列任务和数据库事务](/topic/Laravel%2013.x/wevwmkz9l2.html)的文档。

#### 确定是否应发送队列化通知

队列化通知已分发到队列以进行后台处理后，通常会被队列 worker 接受并发送给其预期收件人。

但是，如果你希望在队列 worker 处理通知后对其进行最终决定（是否应发送队列化通知），则可以在通知类上定义 `shouldSend` 方法。如果此方法返回 `false`，则不会发送通知：

```php
/**
 * Determine if the notification should be sent.
 */
public function shouldSend(object $notifiable, string $channel): bool
{
    return $this->invoice->isPaid();
}
```

#### 发送通知后

如果希望在发送通知后执行代码，可以在通知类上定义 `afterSending` 方法。此方法将接收可通知实体、频道名称以及来自频道的响应：

```php
/**
 * Handle the notification after it has been sent.
 */
public function afterSending(object $notifiable, string $channel, mixed $response): void
{
    // ...
}
```

### 按需通知

有时你可能需要向未作为应用「用户」存储的某人发送通知。使用 `Notification` Facade 的 `route` 方法，你可以在发送通知之前指定临时通知路由信息：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Notification;

Notification::route('mail', 'taylor@example.com')
    ->route('vonage', '5555555555')
    ->route('slack', '#slack-channel')
    ->route('broadcast', [new Channel('channel-name')])
    ->notify(new InvoicePaid($invoice));
```

如果希望在通过 `mail` 路由发送按需通知时提供收件人的姓名，可以提供一个将电子邮箱地址作为键、姓名作为数组第一个元素的值的数组：

```php
Notification::route('mail', [
    'barrett@example.com' => 'Barrett Blair',
])->notify(new InvoicePaid($invoice));
```

使用 `routes` 方法，你可以一次为多个通知频道提供临时路由信息：

```php
Notification::routes([
    'mail' => ['barrett@example.com' => 'Barrett Blair'],
    'vonage' => '5555555555',
])->notify(new InvoicePaid($invoice));
```

## 邮件通知

### 格式化邮件消息

如果通知支持作为电子邮件发送，则应在通知类上定义 `toMail` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含一些简单的方法来帮助你构建事务性电子邮件消息。邮件消息可以包含文本行以及一个「call to action」。让我们看一下 `toMail` 方法的示例：

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
> 请注意，我们在 `toMail` 方法中使用了 `$this->invoice->id`。你可以将通知生成消息所需的任何数据传递到通知的构造函数中。

在此示例中，我们注册了一个问候语、一行文本、一个行动号召，然后是另一行文本。`MailMessage` 对象提供的这些方法使格式化和快速发送小型事务性电子邮件变得简单。然后，邮件频道会将消息组件转换为美观的响应式 HTML 电子邮件模板以及纯文本对应版本。以下是由 `mail` 频道生成的电子邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> [!NOTE]
> 发送邮件通知时，请确保在 `config/app.php` 配置文件中设置 `name` 配置选项。此值将用于邮件通知消息的页眉和页脚中。

#### 错误消息

某些通知会告知用户错误信息，例如发票支付失败。你可以通过在构建消息时调用 `error` 方法来指示邮件消息与错误相关。在邮件消息上使用 `error` 方法时，行动号召按钮将为红色而不是黑色：

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

#### 其他邮件通知格式化选项

你不必在通知类中定义「lines」文本，而可以使用 `view` 方法指定应用于渲染通知电子邮件的自定义模板：

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

你可以通过将视图名称作为传递给 `view` 方法的数组的第二个元素，来为邮件消息指定纯文本视图：

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

或者，如果消息仅有纯文本视图，则可以使用 `text` 方法：

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

### 自定义发送者

默认情况下，电子邮件的发送者/发件人地址在 `config/mail.php` 配置文件中定义。但是，你可以使用 `from` 方法为特定通知指定发件人地址：

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

### 自定义收件人

通过 `mail` 频道发送通知时，通知系统将自动在可通知实体上查找 `email` 属性。你可以通过在可通知实体上定义 `routeNotificationForMail` 方法来自定义用于传送通知的电子邮箱地址：

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
        // 仅返回电子邮箱地址...
        return $this->email_address;

        // 返回电子邮箱地址和姓名...
        return [$this->email_address => $this->name];
    }
}
```

### 自定义主题

默认情况下，电子邮件的主题是通知类名格式化为「Title Case」后的形式。因此，如果你的通知类名为 `InvoicePaid`，则电子邮件的主题将为 `Invoice Paid`。如果希望为消息指定不同主题，可以在构建消息时调用 `subject` 方法：

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

### 自定义 Mailer

默认情况下，电子邮件通知将使用 `config/mail.php` 配置文件中定义的默认 mailer 进行发送。但是，你可以通过在构建消息时调用 `mailer` 方法在运行时指定不同的 mailer：

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

### 自定义模板

你可以通过发布通知包的资源来修改邮件通知使用的 HTML 和纯文本模板。运行此命令后，邮件通知模板将位于 `resources/views/vendor/notifications` 目录中：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

### 附件

要将附件添加到电子邮件通知，请在构建消息时使用 `attach` 方法。`attach` 方法接受文件的绝对路径作为其第一个参数：

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
> 通知邮件消息提供的 `attach` 方法也接受[可附加对象](/topic/Laravel%2013.x/d6vro0rv3g.html)。请查阅完整的[可附加对象文档](/topic/Laravel%2013.x/d6vro0rv3g.html)以了解更多信息。

将文件附加到消息时，你还可以通过将 `array` 作为第二个参数传递给 `attach` 方法来指定显示名称和/或 MIME 类型：

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

必要时，可以使用 `attachMany` 方法将多个文件附加到消息：

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

可以使用 `attachFromStorageDisk` 方法附加存在于特定[文件系统磁盘](/topic/Laravel%2013.x/qk9428ovw1.html)上的文件。此方法接受磁盘名称和该磁盘上文件的路径：

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

#### 原始数据附件

`attachData` 方法可用于附加原始字节字符串作为附件。调用 `attachData` 方法时，应提供应分配给附件的文件名：

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

### 添加标签和元数据

某些第三方电子邮件提供商（如 Mailgun 和 Postmark）支持消息「tags」和「metadata」，可用于对应用发送的电子邮件进行分组和跟踪。你可以通过 `tag` 和 `metadata` 方法向电子邮件消息添加标签和元数据：

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

如果你的应用正在使用 Mailgun 驱动，可以查阅 Mailgun 的文档以了解有关 [tags](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags) 和 [metadata](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages) 的更多信息。同样，也可以查阅 Postmark 文档以了解他们对 [tags](https://postmarkapp.com/blog/tags-support-for-smtp) 和 [metadata](https://postmarkapp.com/support/article/1125-custom-metadata-faq) 的支持情况。

如果你的应用使用 Amazon SES 发送电子邮件，则应使用 `metadata` 方法将 [SES「tags」](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html) 附加到消息中。

### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许你注册一个闭包，该闭包将在发送消息之前使用 Symfony Message 实例调用。这为你提供了在消息传送之前对其进行深度自定义的机会：

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

### 使用 Mailables

如果需要，你可以从通知的 `toMail` 方法返回完整的[mailable 对象](/topic/Laravel%2013.x/d6vro0rv3g.html)。返回 `Mailable` 而不是 `MailMessage` 时，你需要使用 mailable 对象的 `to` 方法指定消息收件人：

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

#### Mailables 和按需通知

如果正在发送按需通知，传递给 `toMail` 方法的 `$notifiable` 实例将是 `Illuminate\Notifications\AnonymousNotifiable` 的实例，它提供了一个 `routeNotificationFor` 方法，可用于检索按需通知应发送到的电子邮箱地址：

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

### 预览邮件通知

设计邮件通知模板时，方便的做法是在浏览器中像典型的 Blade 模板一样快速预览渲染的邮件消息。因此，Laravel 允许你直接从路由闭包或控制器返回由邮件通知生成的任何邮件消息。当返回 `MailMessage` 时，它将被渲染并显示在浏览器中，使你能够快速预览其设计，而无需将其发送到实际的电子邮箱地址：

```php
use App\Models\Invoice;
use App\Notifications\InvoicePaid;

Route::get('/notification', function () {
    $invoice = Invoice::find(1);

    return (new InvoicePaid($invoice))
        ->toMail($invoice->user);
});
```

## Markdown 邮件通知

Markdown 邮件通知允许你利用邮件通知的预构建模板，同时为你提供更大的自由度来编写更长的自定义消息。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染美观的响应式 HTML 模板，同时还会自动生成纯文本对应版本。

### 生成消息

要使用相应的 Markdown模板生成通知，可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

与所有其他邮件通知一样，使用 Markdown模板的通知应在通知类上定义 `toMail` 方法。但是，与使用 `line` 和 `action` 方法构造通知不同，应使用 `markdown` 方法指定应使用的 Markdown模板的名称。希望提供给模板的数据数组可以作为方法的第二个参数传递：

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

### 编写消息

Markdown 邮件通知使用 Blade 组件和 Markdown 语法的组合，使你能够在利用 Laravel 预制通知组件的同时轻松构建通知：

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
> 编写 Markdown 邮件时，请勿使用过多缩进。按照 Markdown 标准，Markdown 解析器会将缩进内容渲染为代码块。

#### 按钮组件

按钮组件渲染居中的按钮链接。该组件接受两个参数：`url` 和可选的 `color`。支持的颜色为 `primary`、`green` 和 `red`。你可以根据需要向通知添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

#### 面板组件

面板组件将给定的文本块渲染为面板，其背景颜色与通知的其余部分略有不同。这允许你将注意力吸引到给定的文本块上：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

#### 表格组件

表格组件允许你将 Markdown 表转换为 HTML 表。该组件接受 Markdown 表作为其内容。表列对齐使用默认的 Markdown 表对齐语法支持：

```blade
<x-mail::table>
| Laravel       | Table         | Example       |
| ------------- | :-----------: | ------------: |
| Col 2 is      | Centered      | $10           |
| Col 3 is      | Right-Aligned | $20           |
</x-mail::table>
```

### 自定义组件

你可以将所有 Markdown 通知组件导出到自己的应用进行自定义。要导出这些组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资产标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 目录和一个 `text` 目录，每个目录都包含每个可用组件的相应表示。你可以随意自定义这些组件。

#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动以内联方式嵌入 Markdown 通知的 HTML 表示中。

如果你希望为 Laravel 的 Markdown 组件构建一个全新的主题，可以将 CSS 文件放在 `html/themes` 目录中。命名并保存 CSS 文件后，更新 `mail` 配置文件的 `theme` 选项以匹配新主题的名称。

要为单个通知自定义主题，可以在构建通知的邮件消息时调用 `theme` 方法。`theme` 方法接受应在发送通知时使用的主题名称：

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

## 数据库通知

### 前提条件

`database` 通知频道将通知信息存储在数据库表中。该表将包含通知类型以及描述通知的 JSON 数据结构等信息。

你可以查询该表以在应用的用户界面中显示通知。但是，在执行此操作之前，需要创建一个数据库表来保存通知。可以使用 `make:notifications-table` 命令生成带有正确表架构的[migration](/topic/Laravel%2013.x/x3vo0g4vm1.html)：

```shell
php artisan make:notifications-table

php artisan migrate
```

> [!NOTE]
> 如果你的可通知模型正在使用 [UUID 或 ULID 主键](/topic/Laravel%2013.x/rwyl2kxvz8.html)，则应在通知表 migration 中将 `morphs` 方法替换为 [uuidMorphs](/topic/Laravel%2013.x/x3vo0g4vm1.html) 或 [ulidMorphs](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

### 格式化数据库通知

如果通知支持存储在数据库表中，则应在通知类上定义 `toDatabase` 或 `toArray` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个普通的 PHP 数组。返回的数组将被编码为 JSON 并存储在 `notifications` 表的 `data` 列中。让我们看一下 `toArray` 方法的示例：

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

当通知存储在应用的数据库中时，`type` 列默认设置为通知的类名，`read_at` 列将为 `null`。但是，你可以通过在通知类中定义 `databaseType` 和 `initialDatabaseReadAtValue` 方法来自定义此行为：

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

#### `toDatabase` 与 `toArray`

`toArray` 方法也被 `broadcast` 频道用于确定要广播到 JavaScript 前端的数据。如果希望为 `database` 和 `broadcast` 频道提供两种不同的数组表示形式，则应定义 `toDatabase` 方法而不是 `toArray` 方法。

### 访问通知

通知存储在数据库中后，需要一种便捷的方法从可通知实体访问它们。`Illuminate\Notifications\Notifiable` Trait 包含在 Laravel 的默认 `App\Models\User` 模型中，它包含一个 `notifications` [Eloquent 关联](/topic/Laravel%2013.x/kpv13d298w.html)，用于返回实体的通知。要获取通知，可以像访问任何其他 Eloquent 关联一样访问此方法。默认情况下，通知将按 `created_at` 时间戳排序，最新的通知位于集合的开头：

```php
$user = App\Models\User::find(1);

foreach ($user->notifications as $notification) {
    echo $notification->type;
}
```

如果只想检索「未读」通知，可以使用 `unreadNotifications` 关联。同样，这些通知将按 `created_at` 时间戳排序，最新的通知位于集合的开头：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    echo $notification->type;
}
```

如果只想检索「已读」通知，可以使用 `readNotifications` 关联：

```php
$user = App\Models\User::find(1);

foreach ($user->readNotifications as $notification) {
    echo $notification->type;
}
```

> [!NOTE]
> 要从 JavaScript 客户端访问通知，应为应用定义一个通知控制器，该控制器返回可通知实体（例如当前用户）的通知。然后可以从 JavaScript 客户端向该控制器的 URL 发起 HTTP 请求。

### 将通知标记为已读

通常，你希望在用户查看通知时将其标记为「已读」。`Illuminate\Notifications\Notifiable` Trait 提供了一个 `markAsRead` 方法，该方法会更新通知的数据库记录上的 `read_at` 列：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    $notification->markAsRead();
}
```

但是，你也可以直接在通知集合上使用 `markAsRead` 方法，而不必循环遍历每个通知：

```php
$user->unreadNotifications->markAsRead();
```

你还可以使用批量更新查询将所有通知标记为已读，而无需从数据库中检索它们：

```php
$user = App\Models\User::find(1);

$user->unreadNotifications()->update(['read_at' => now()]);
```

你可以删除通知以将其从表中完全移除：

```php
$user->notifications()->delete();
```

## 广播通知

### 前提条件

在广播通知之前，应配置并熟悉 Laravel 的[事件广播](/topic/Laravel%2013.x/enyd5w197d.html)服务。事件广播提供了一种从 JavaScript 前端对服务端 Laravel 事件做出反应的方法。

### 格式化广播通知

`broadcast` 频道使用 Laravel 的[事件广播](/topic/Laravel%2013.x/enyd5w197d.html)服务广播通知，使你的 JavaScript 前端能够实时捕获通知。如果通知支持广播，可以在通知类上定义 `toBroadcast` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `BroadcastMessage` 实例。如果 `toBroadcast` 方法不存在，则将使用 `toArray` 方法来收集应广播的数据。返回的数据将被编码为 JSON 并广播到你的 JavaScript 前端。让我们看一下 `toBroadcast` 方法的示例：

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

#### 广播队列配置

所有广播通知都将排队等待广播。如果希望配置用于排队广播操作的队列连接或队列名称，可以使用 `BroadcastMessage` 的 `onConnection` 和 `onQueue` 方法：

```php
return (new BroadcastMessage($data))
    ->onConnection('sqs')
    ->onQueue('broadcasts');
```

#### 自定义通知类型

除你指定的数据外，所有广播通知还具有一个 `type` 字段，其中包含通知的完整类名。如果希望自定义通知 `type`，可以在通知类上定义 `broadcastType` 方法：

```php
/**
 * Get the type of the notification being broadcast.
 */
public function broadcastType(): string
{
    return 'broadcast.message';
}
```

### 监听通知

通知将在使用 `{notifiable}.{id}` 约定格式化的私有频道上广播。因此，如果要向 ID 为 `1` 的 `App\Models\User` 实例发送通知，则通知将在 `App.Models.User.1` 私有频道上广播。在使用 [Laravel Echo](/topic/Laravel%2013.x/enyd5w197d.html) 时，可以使用 `notification` 方法轻松监听频道上的通知：

```js
Echo.private('App.Models.User.' + userId)
    .notification((notification) => {
        console.log(notification.type);
    });
```

#### 使用 React、Vue 或 Svelte

Laravel Echo 包含 React、Vue 和 Svelte 钩子，使监听通知变得轻松。要开始使用，请调用 `useEchoNotification` 钩子，该钩子用于监听通知。`useEchoNotification` 钩子将在使用它的组件卸载时自动离开频道：

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

默认情况下，钩子会监听所有通知。要指定你希望监听的通知类型，可以将字符串或类型数组提供给 `useEchoNotification`：

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

你还可以指定通知有效载荷数据的形状，从而提供更高的类型安全性和编辑便利性：

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

#### 自定义通知频道

如果希望自定义实体的广播通知广播到的频道，可以在可通知实体上定义 `receivesBroadcastNotificationsOn` 方法：

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

## SMS 通知

### 前提条件

在 Laravel 中发送 SMS 通知由 [Vonage](https://www.vonage.com/)（前身为 Nexmo）提供支持。在通过 Vonage 发送通知之前，需要安装 `laravel/vonage-notification-channel` 和 `guzzlehttp/guzzle` 包：

```shell
composer require laravel/vonage-notification-channel guzzlehttp/guzzle
```

该包包含一个[配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。但是，你无需将此配置文件导出到自己的应用中。可以简单地使用 `VONAGE_KEY` 和 `VONAGE_SECRET` 环境变量来定义你的 Vonage 公钥和密钥。

定义密钥后，应设置 `VONAGE_SMS_FROM` 环境变量，该变量定义了你的 SMS 消息默认应发送的电话号码。可以在 Vonage 控制面板中生成此电话号码：

```ini
VONAGE_SMS_FROM=15556666666
```

### 格式化 SMS 通知

如果通知支持作为 SMS 发送，则应在通知类上定义 `toVonage` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\VonageMessage` 实例：

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

#### Unicode 内容

如果 SMS 消息将包含 unicode 字符，则应在构造 `VonageMessage` 实例时调用 `unicode` 方法：

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

### 自定义「From」号码

如果希望从与 `VONAGE_SMS_FROM` 环境变量指定的电话号码不同的电话号码发送某些通知，可以在 `VonageMessage` 实例上调用 `from` 方法：

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

### 添加客户端引用

如果希望按用户、团队或客户端跟踪成本，可以向通知添加「客户端引用」。Vonage 将允许你使用此客户端引用生成报告，以便你可以更好地了解特定客户的 SMS 使用情况。客户端引用可以是任意长度不超过 40 个字符的字符串：

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

### 路由 SMS 通知

要将 Vonage 通知路由到正确的电话号码，请在可通知实体上定义 `routeNotificationForVonage` 方法：

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

## Slack 通知

### 前提条件

在发送 Slack 通知之前，应通过 Composer 安装 Slack 通知频道：

```shell
composer require laravel/slack-notification-channel
```

此外，你必须为你的 Slack workspace 创建一个 [Slack App](https://api.slack.com/apps?new_app=1)。

如果仅需要向创建 App 所在的同一 Slack workspace 发送通知，应确保你的 App 具有 `chat:write`、`chat:write.public` 和 `chat:write.customize` 作用域。这些作用域可以从 Slack 中的「OAuth & Permissions」App 管理选项卡添加。

接下来，复制 App 的「Bot User OAuth Token」并将其放在应用的 `services.php` 配置文件中 `slack` 配置数组中。此令牌可在 Slack 中的「OAuth & Permissions」选项卡中找到：

```php
'slack' => [
    'notifications' => [
        'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
        'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
    ],
],
```

#### App 分发

如果你的应用将向应用用户拥有的外部 Slack workspace 发送通知，则需要通过 Slack「分发」你的 App。可以从 Slack 中 App 的「Manage Distribution」选项卡管理 App 分发。一旦你的 App 被分发，你可以使用 [Socialite](/topic/Laravel%2013.x/3dykq5oyl0.html) [获取 Slack Bot 令牌](/topic/Laravel%2013.x/3dykq5oyl0.html)，以代表你的应用用户。

### 格式化 Slack 通知

如果通知支持作为 Slack 消息发送，则应在通知类上定义 `toSlack` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Slack\SlackMessage` 实例。你可以使用 [Slack 的 Block Kit API](https://api.slack.com/block-kit) 构造丰富的通知。以下示例可以在 [Slack 的 Block Kit builder](https://app.slack.com/block-kit-builder/T01KWS6K23Z#%7B%22blocks%22:%5B%7B%22type%22:%22header%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Invoice%20Paid%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22plain_text%22,%22text%22:%22Customer%20%231234%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22An%20invoice%20has%20been%20paid.%22%7D,%22fields%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20No:*%5Cn1000%22%7D,%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20Recipient:*%5Cntaylor@laravel.com%22%7D%5D%7D,%7B%22type%22:%22divider%22%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Congratulations!%22%7D%7D%5D%7D) 中预览：

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

#### 使用 Slack 的 Block Kit Builder 模板

可以使用 `usingBlockKitTemplate` 方法提供由 Slack 的 Block Kit Builder 生成的原始 JSON 有效载荷，而不是使用流畅的消息构建器方法来构造 Block Kit 消息：

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

### Slack 交互

Slack 的 Block Kit 通知系统提供强大的功能来[处理用户交互](https://api.slack.com/interactivity/handling)。要使用这些功能，你的 Slack App 应启用「Interactivity」并配置一个指向应用提供的 URL 的「Request URL」。这些设置可以从 Slack 中的「Interactivity & Shortcuts」App 管理选项卡进行管理。

在下面的示例中（使用 `actionsBlock` 方法），Slack 将向你的「Request URL」发送 `POST` 请求，其中包含点击按钮的 Slack 用户、点击按钮的 ID 等内容的有效载荷。然后，你的应用可以根据该有效载荷确定要执行的操作。你还应[验证该请求](https://api.slack.com/authentication/verifying-requests-from-slack)是由 Slack 发起的：

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
             // ID 默认为 "button_acknowledge_invoice"...
            $block->button('Acknowledge Invoice')->primary();

            // 手动配置 ID...
            $block->button('Deny')->danger()->id('deny_invoice');
        });
}
```

#### 确认弹窗

如果希望用户在执行操作之前必须确认操作，可以在定义按钮时调用 `confirm` 方法。`confirm` 方法接受一条消息和一个接收 `ConfirmObject` 实例的闭包：

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

#### 检查 Slack 块

如果希望快速检查正在构建的块，可以在 `SlackMessage` 实例上调用 `dd` 方法。`dd` 方法将生成并转储 Slack [Block Kit Builder](https://app.slack.com/block-kit-builder/) 的 URL，该 URL 在浏览器中显示有效载荷和通知的预览。可以将 `true` 传递给 `dd` 方法以转储原始有效载荷：

```php
return (new SlackMessage)
    ->text('One of your invoices has been paid!')
    ->headerBlock('Invoice Paid')
    ->dd();
```

### 路由 Slack 通知

要将 Slack 通知定向到适当的 Slack 团队和频道，请在可通知模型上定义 `routeNotificationForSlack` 方法。此方法可以返回以下三个值之一：

- `null` - 推迟到通知本身中配置的频道进行路由。可以在构建 `SlackMessage` 时使用 `to` 方法在通知内配置频道。
- 指定 Slack 频道的字符串，例如 `#support-channel`。
- `SlackRoute` 实例，允许你指定 OAuth 令牌和频道名称，例如 `SlackRoute::make($this->slack_channel, $this->slack_token)`。此方法应用于向外部 workspace 发送通知。

例如，从 `routeNotificationForSlack` 方法返回 `#support-channel` 会将通知发送到 `services.php` 配置文件中 Bot User OAuth 令牌关联的 workspace 中的 `#support-channel` 频道：

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

### 通知外部 Slack Workspace

> [!NOTE]
> 在向外部 Slack workspace 发送通知之前，你的 Slack App 必须被分发。

当然，你通常希望向应用用户拥有的 Slack workspace 发送通知。为此，首先需要为用户获取 Slack OAuth 令牌。值得庆幸的是，[Laravel Socialite](/topic/Laravel%2013.x/3dykq5oyl0.html) 包含一个 Slack 驱动程序，可让你轻松地通过 Slack 对应用用户进行身份验证并[获取 bot 令牌](/topic/Laravel%2013.x/3dykq5oyl0.html)。

获取 bot 令牌并将其存储在应用的数据库中后，可以使用 `SlackRoute::make` 方法将通知路由到用户的 workspace。此外，你的应用可能需要为用户提供机会指定通知应发送到哪个频道：

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

## 本地化通知

Laravel 允许你以 HTTP 请求当前语言环境以外的语言环境发送通知，并且如果通知被队列化，它甚至会记住此语言环境。

为此，`Illuminate\Notifications\Notification` 类提供了一个 `locale` 方法来设置所需的语言。应用将在评估通知时切换到此语言环境，然后在评估完成时切换回之前的语言环境：

```php
$user->notify((new InvoicePaid($invoice))->locale('es'));
```

多个可通知条目的本地化也可以通过 `Notification` Facade 实现：

```php
Notification::locale('es')->send(
    $users, new InvoicePaid($invoice)
);
```

#### 用户首选语言环境

有时，应用会存储每个用户的首选语言环境。通过在可通知模型上实现 `HasLocalePreference` 契约，可以指示 Laravel 在发送通知时使用此存储的语言环境：

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

一旦实现了该接口，Laravel 将在向模型发送通知和 mailable 时自动使用首选语言环境。因此，使用此接口时无需调用 `locale` 方法：

```php
$user->notify(new InvoicePaid($invoice));
```

## 测试

可以使用 `Notification` Facade 的 `fake` 方法来防止发送通知。通常，发送通知与你实际正在测试的代码无关。很可能会简单地断言已指示 Laravel 发送给定通知就足够了。

调用 `Notification` Facade 的 `fake` 方法后，可以断言已指示向用户发送通知，甚至可以检查通知接收到的数据：

```php tab=Pest
<?php

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;

test('orders can be shipped', function () {
    Notification::fake();

    // 执行订单发货...

    // 断言未发送任何通知...
    Notification::assertNothingSent();

    // 断言已向给定用户发送通知...
    Notification::assertSentTo(
        [$user], OrderShipped::class
    );

    // 断言未发送通知...
    Notification::assertNotSentTo(
        [$user], AnotherNotification::class
    );

    // 断言通知已发送两次...
    Notification::assertSentTimes(WeeklyReminder::class, 2);

    // 断言已发送给定数量的通知...
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

        // 执行订单发货...

        // 断言未发送任何通知...
        Notification::assertNothingSent();

        // 断言已向给定用户发送通知...
        Notification::assertSentTo(
            [$user], OrderShipped::class
        );

        // 断言未发送通知...
        Notification::assertNotSentTo(
            [$user], AnotherNotification::class
        );

        // 断言通知已发送两次...
        Notification::assertSentTimes(WeeklyReminder::class, 2);

        // 断言已发送给定数量的通知...
        Notification::assertCount(3);
    }
}
```

你可以将闭包传递给 `assertSentTo` 或 `assertNotSentTo` 方法，以断言发送了通过给定「真值测试」的通知。如果至少发送了一个通过给定真值测试的通知，则断言将成功：

```php
Notification::assertSentTo(
    $user,
    function (OrderShipped $notification, array $channels) use ($order) {
        return $notification->order->id === $order->id;
    }
);
```

#### 按需通知

如果正在测试的代码发送按需通知，则可以通过 `assertSentOnDemand` 方法测试按需通知是否已发送：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过将闭包作为第二个参数传递给 `assertSentOnDemand` 方法，可以确定是否已向正确的「route」地址发送按需通知：

```php
Notification::assertSentOnDemand(
    OrderShipped::class,
    function (OrderShipped $notification, array $channels, object $notifiable) use ($user) {
        return $notifiable->routes['mail'] === $user->email;
    }
);
```

## 通知事件

#### 通知发送事件

当通知正在发送时，通知系统会分发 `Illuminate\Notifications\Events\NotificationSending` 事件。它包含「notifiable」实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)：

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

如果 `NotificationSending` 事件的事件监听器从其 `handle` 方法返回 `false`，则不会发送通知：

```php
/**
 * Handle the event.
 */
public function handle(NotificationSending $event): bool
{
    return false;
}
```

在事件监听器中，你可以访问事件的 `notifiable`、`notification` 和 `channel` 属性，以了解有关通知收件人或通知本身的更多信息：

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

#### 通知已发送事件

当通知已发送时，通知系统会分发 `Illuminate\Notifications\Events\NotificationSent` [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html)。它包含「notifiable」实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)：

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

在事件监听器中，你可以访问事件的 `notifiable`、`notification`、`channel` 和 `response` 属性，以了解有关通知收件人或通知本身的更多信息：

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

## 自定义频道

Laravel 自带少数几个通知频道，但你可能希望编写自己的驱动程序以通过其他频道传送通知。Laravel 让这变得简单。首先，定义一个包含 `send` 方法的类。该方法应接收两个参数：`$notifiable` 和 `$notification`。

在 `send` 方法中，可以调用通知上的方法来检索你的频道可以理解的消息对象，然后以你希望的任何方式将通知发送给 `$notifiable` 实例：

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

        // 将通知发送给 $notifiable 实例...
    }
}
```

定义好通知频道类后，可以从任何通知的 `via` 方法返回该类名。在本例中，通知的的 `toVoice` 方法可以返回你选择用来表示语音消息的任何对象。例如，你可以定义自己的 `VoiceMessage` 类来表示这些消息：

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