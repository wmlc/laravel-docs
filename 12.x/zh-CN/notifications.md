# 通知

- [简介](#introduction)
- [生成通知](#generating-notifications)
- [发送通知](#sending-notifications)
    - [使用 Notifiable Trait](#using-the-notifiable-trait)
    - [使用 Notification Facade](#using-the-notification-facade)
    - [指定投递渠道](#specifying-delivery-channels)
    - [通知队列](#queueing-notifications)
    - [按需通知](#on-demand-notifications)
- [邮件通知](#mail-notifications)
    - [格式化邮件消息](#formatting-mail-messages)
    - [自定义发件人](#customizing-the-sender)
    - [自定义收件人](#customizing-the-recipient)
    - [自定义主题](#customizing-the-subject)
    - [自定义邮件发送器](#customizing-the-mailer)
    - [自定义模板](#customizing-the-templates)
    - [附件](#mail-attachments)
    - [添加标签和元数据](#adding-tags-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
    - [使用 Mailable](#using-mailables)
    - [预览邮件通知](#previewing-mail-notifications)
- [Markdown 邮件通知](#markdown-mail-notifications)
    - [生成消息](#generating-the-message)
    - [编写消息](#writing-the-message)
    - [自定义组件](#customizing-the-components)
- [数据库通知](#database-notifications)
    - [前置要求](#database-prerequisites)
    - [格式化数据库通知](#formatting-database-notifications)
    - [访问通知](#accessing-the-notifications)
    - [将通知标记为已读](#marking-notifications-as-read)
- [广播通知](#broadcast-notifications)
    - [前置要求](#broadcast-prerequisites)
    - [格式化广播通知](#formatting-broadcast-notifications)
    - [监听通知](#listening-for-notifications)
- [短信通知](#sms-notifications)
    - [前置要求](#sms-prerequisites)
    - [格式化短信通知](#formatting-sms-notifications)
    - [自定义「发件」号码](#customizing-the-from-number)
    - [添加客户端引用](#adding-a-client-reference)
    - [路由短信通知](#routing-sms-notifications)
- [Slack 通知](#slack-notifications)
    - [前置要求](#slack-prerequisites)
    - [格式化 Slack 通知](#formatting-slack-notifications)
    - [Slack 交互](#slack-interactivity)
    - [路由 Slack 通知](#routing-slack-notifications)
    - [通知外部 Slack 工作区](#notifying-external-slack-workspaces)
- [通知本地化](#localizing-notifications)
- [测试](#testing)
- [通知事件](#notification-events)
- [自定义渠道](#custom-channels)

<a name="introduction"></a>
## 简介

除了支持[发送邮件](/docs/{{version}}/mail)之外，Laravel 还支持通过多种投递渠道发送通知，包括邮件、短信（通过 [Vonage](https://www.vonage.com/communications-apis/)，前身为 Nexmo）和 [Slack](https://slack.com)。此外，社区还构建了各种[通知渠道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可以通过数十种不同的渠道发送通知！通知也可以存储在数据库中，以便在你的 Web 界面中展示。

通常，通知应当是简短的、信息性的消息，用于告知用户应用中发生的某件事。例如，如果你在开发一个计费应用，你可能会通过邮件和短信渠道向用户发送「Invoice Paid（发票已支付）」通知。

<a name="generating-notifications"></a>
## 生成通知

在 Laravel 中，每个通知都由一个单独的类来表示，该类通常存储在 `app/Notifications` 目录中。如果你的应用中没有这个目录也不必担心，运行 `make:notification` Artisan 命令时会自动创建它：

```shell
php artisan make:notification InvoicePaid
```

该命令会在你的 `app/Notifications` 目录中生成一个全新的通知类。每个通知类都包含一个 `via` 方法，以及数量可变的消息构建方法（例如 `toMail` 或 `toDatabase`），这些方法将通知转换为针对特定渠道定制的消息。

<a name="sending-notifications"></a>
## 发送通知

<a name="using-the-notifiable-trait"></a>
### 使用 Notifiable Trait

通知可以通过两种方式发送：使用 `Notifiable` trait 的 `notify` 方法，或者使用 `Notification` [Facade](/docs/{{version}}/facades)。`Notifiable` trait 默认已包含在应用的 `App\Models\User` 模型中：

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

该 trait 提供的 `notify` 方法期望接收一个通知实例：

```php
use App\Notifications\InvoicePaid;

$user->notify(new InvoicePaid($invoice));
```

> [!NOTE]
> 请记住，你可以在任何模型上使用 `Notifiable` trait，并不局限于只在 `User` 模型上使用。

<a name="using-the-notification-facade"></a>
### 使用 Notification Facade

或者，你也可以通过 `Notification` [Facade](/docs/{{version}}/facades) 发送通知。当你需要向多个可通知实体（例如一组用户集合）发送通知时，这种方式非常有用。要使用 facade 发送通知，请将所有可通知实体和通知实例传递给 `send` 方法：

```php
use Illuminate\Support\Facades\Notification;

Notification::send($users, new InvoicePaid($invoice));
```

你也可以使用 `sendNow` 方法立即发送通知。即使通知实现了 `ShouldQueue` 接口，该方法也会立即发送通知：

```php
Notification::sendNow($developers, new DeploymentCompleted($deployment));
```

<a name="specifying-delivery-channels"></a>
### 指定投递渠道

每个通知类都有一个 `via` 方法，用于决定通知将在哪些渠道上投递。通知可以在 `mail`、`database`、`broadcast`、`vonage` 和 `slack` 渠道上发送。

> [!NOTE]
> 如果你想使用其他投递渠道，例如 Telegram 或 Pusher，请查看社区驱动的 [Laravel Notification Channels 网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，该实例是通知发送目标类的一个实例。你可以使用 `$notifiable` 来决定通知应在哪些渠道上投递：

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
### 通知队列

> [!WARNING]
> 在将通知放入队列之前，你应当先配置好队列并[启动一个 worker](/docs/{{version}}/queues#running-the-queue-worker)。

发送通知可能比较耗时，尤其是当渠道需要调用外部 API 来投递通知时。为了加快应用的响应速度，你可以通过在类中添加 `ShouldQueue` 接口和 `Queueable` trait 来让通知入队。对于使用 `make:notification` 命令生成的所有通知，接口和 trait 都已经导入好了，因此你可以直接将它们添加到通知类中：

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

将 `ShouldQueue` 接口添加到通知后，你就可以像平常一样发送通知了。Laravel 会检测到类上的 `ShouldQueue` 接口，并自动将通知的投递放入队列：

```php
$user->notify(new InvoicePaid($invoice));
```

通知入队时，会为每个收件人和渠道的组合创建一个队列任务。例如，如果你的通知有 3 个收件人和 2 个渠道，则会向队列派发 6 个任务。

<a name="delaying-notifications"></a>
#### 延迟通知

如果你想延迟通知的投递，可以将 `delay` 方法链式调用到通知的实例化上：

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

或者，你也可以在通知类本身上定义一个 `withDelay` 方法。`withDelay` 方法应返回一个渠道名称和延迟值的数组：

```php
/**
 * 确定通知的投递延迟。
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

默认情况下，入队的通知会使用应用的默认队列连接入队。如果你想为特定通知指定使用其他连接，可以在通知的构造函数中调用 `onConnection` 方法：

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

或者，如果你想为通知支持的每个通知渠道指定使用特定的队列连接，可以在通知上定义一个 `viaConnections` 方法。该方法应返回一个渠道名 / 队列连接名对的数组：

```php
/**
 * 确定每个通知渠道应使用的连接。
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

如果你想为通知支持的每个通知渠道指定使用特定的队列，可以在通知上定义一个 `viaQueues` 方法。该方法应返回一个渠道名 / 队列名对的数组：

```php
/**
 * 确定每个通知渠道应使用的队列。
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
#### 自定义队列通知任务属性

你可以通过在通知类上定义属性，来自定义底层队列任务的行为。这些属性会被发送通知的队列任务继承：

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
     * 通知可尝试的最大次数。
     *
     * @var int
     */
    public $tries = 5;

    /**
     * 通知在超时之前可以运行的秒数。
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * 失败前允许的未处理异常的最大数量。
     *
     * @var int
     */
    public $maxExceptions = 3;

    // ...
}
```

如果你想通过[加密](/docs/{{version}}/encryption)来确保队列通知数据的隐私和完整性，可以在通知类中添加 `ShouldBeEncrypted` 接口：

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

除了直接在通知类上定义这些属性之外，你还可以定义 `backoff` 和 `retryUntil` 方法，为队列通知任务指定退避策略和重试超时时间：

```php
use DateTime;

/**
 * 计算重试通知前应等待的秒数。
 */
public function backoff(): int
{
    return 3;
}

/**
 * 确定通知应超时的时间。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 5);
}
```

> [!NOTE]
> 有关这些任务属性和方法的更多信息，请查阅[队列任务](/docs/{{version}}/queues#max-job-attempts-and-timeout)文档。

<a name="queued-notification-middleware"></a>
#### 队列通知中间件

队列通知可以[像队列任务一样](/docs/{{version}}/queues#job-middleware)定义中间件。首先，在通知类上定义一个 `middleware` 方法。`middleware` 方法会接收 `$notifiable` 和 `$channel` 变量，让你能够根据通知的投递目标自定义返回的中间件：

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * 获取通知任务应通过的中间件。
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
#### 队列通知与数据库事务

当队列通知在数据库事务中被派发时，它们可能在数据库事务提交之前就被队列处理了。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新，可能尚未反映到数据库中。此外，在事务中创建的任何模型或数据库记录可能还不存在于数据库中。如果你的通知依赖这些模型，在处理发送队列通知的任务时可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置项设置为 `false`，你仍然可以在发送通知时调用 `afterCommit` 方法，来指示某个特定的队列通知应在所有未关闭的数据库事务提交后再派发：

```php
use App\Notifications\InvoicePaid;

$user->notify((new InvoicePaid($invoice))->afterCommit());
```

或者，你也可以在通知的构造函数中调用 `afterCommit` 方法：

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
> 要了解有关规避这些问题的更多信息，请查阅[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)相关文档。

<a name="determining-if-the-queued-notification-should-be-sent"></a>
#### 判断是否应发送队列通知

队列通知被派发到队列进行后台处理后，通常会被队列 worker 接收并发送给预期的收件人。

不过，如果你希望在队列 worker 处理通知之后，对是否发送该队列通知做出最终决定，可以在通知类上定义一个 `shouldSend` 方法。如果该方法返回 `false`，通知将不会被发送：

```php
/**
 * 判断是否应发送该通知。
 */
public function shouldSend(object $notifiable, string $channel): bool
{
    return $this->invoice->isPaid();
}
```

<a name="after-sending-notifications"></a>
#### 通知发送之后

如果你想在接受发送后执行一些代码，可以在通知类上定义一个 `afterSending` 方法。该方法会接收可通知实体、渠道名称以及渠道的响应：

```php
/**
 * 在通知发送后进行处理。
 */
public function afterSending(object $notifiable, string $channel, mixed $response): void
{
    // ...
}
```

<a name="on-demand-notifications"></a>
### 按需通知

有时你可能需要向某个并非以应用「用户」身份存储的人发送通知。使用 `Notification` facade 的 `route` 方法，你可以在发送通知之前指定临时的通知路由信息：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Notification;

Notification::route('mail', 'taylor@example.com')
    ->route('vonage', '5555555555')
    ->route('slack', '#slack-channel')
    ->route('broadcast', [new Channel('channel-name')])
    ->notify(new InvoicePaid($invoice));
```

如果你想在向 `mail` 路由发送按需通知时提供收件人的姓名，可以提供一个数组，其中邮箱地址作为键，姓名作为数组第一个元素的值：

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

如果通知支持以邮件形式发送，你应当在通知类上定义一个 `toMail` 方法。该方法会接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含一些简单的方法，帮助你构建事务性邮件消息。邮件消息可以包含多行文本以及一个「行动呼吁」（call to action）。我们来看一个 `toMail` 方法的示例：

```php
/**
 * 获取通知的邮件表现形式。
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
> 注意，我们在 `toMail` 方法中使用了 `$this->invoice->id`。你可以将通知生成消息所需的任何数据，传递给通知的构造函数。

在这个示例中，我们注册了一个问候语、一行文本、一个行动呼吁，然后又是一行文本。`MailMessage` 对象提供的这些方法，使格式化小型事务性邮件变得简单而快速。邮件渠道随后会将这些消息组件转换成一个美观、响应式的 HTML 邮件模板，并附带纯文本版本。下面是一个由 `mail` 渠道生成的邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> [!NOTE]
> 发送邮件通知时，请务必在 `config/app.php` 配置文件中设置 `name` 配置项。该值将用于邮件通知消息的页眉和页脚。

<a name="error-messages"></a>
#### 错误消息

有些通知会告知用户错误信息，例如发票支付失败。你可以在构建消息时调用 `error` 方法，来指示该邮件消息是关于错误的。在邮件消息上使用 `error` 方法时，行动呼吁按钮将显示为红色而不是黑色：

```php
/**
 * 获取通知的邮件表现形式。
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

除了在通知类中定义文本「行」之外，你还可以使用 `view` 方法指定一个用于渲染通知邮件的自定义模板：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)->view(
        'mail.invoice.paid', ['invoice' => $this->invoice]
    );
}
```

你可以通过将视图名称作为数组（该数组传递给 `view` 方法）的第二个元素，为邮件消息指定一个纯文本视图：

```php
/**
 * 获取通知的邮件表现形式。
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
 * 获取通知的邮件表现形式。
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

默认情况下，邮件的发件人 / 发件地址在 `config/mail.php` 配置文件中定义。不过，你可以使用 `from` 方法为特定通知指定发件地址：

```php
/**
 * 获取通知的邮件表现形式。
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

通过 `mail` 渠道发送通知时，通知系统会自动在你的可通知实体上查找 `email` 属性。你可以通过在可通知实体上定义一个 `routeNotificationForMail` 方法，来自定义投递通知所使用的邮箱地址：

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

        // 返回邮箱地址和姓名...
        return [$this->email_address => $this->name];
    }
}
```

<a name="customizing-the-subject"></a>
### 自定义主题

默认情况下，邮件的主题是格式化为「标题大小写」（Title Case）的通知类名。因此，如果你的通知类名为 `InvoicePaid`，邮件主题将为 `Invoice Paid`。如果你想为消息指定不同的主题，可以在构建消息时调用 `subject` 方法：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->subject('Notification Subject')
        ->line('...');
}
```

<a name="customizing-the-mailer"></a>
### 自定义邮件发送器

默认情况下，邮件通知将使用 `config/mail.php` 配置文件中定义的默认邮件发送器（mailer）发送。不过，你可以在构建消息时调用 `mailer` 方法，在运行时指定其他的邮件发送器：

```php
/**
 * 获取通知的邮件表现形式。
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

你可以通过发布通知扩展包的资源，来修改邮件通知使用的 HTML 和纯文本模板。运行此命令后，邮件通知模板将位于 `resources/views/vendor/notifications` 目录中：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

<a name="mail-attachments"></a>
### 附件

要向邮件通知添加附件，请在构建消息时使用 `attach` 方法。`attach` 方法接受文件的绝对路径作为第一个参数：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Hello!')
        ->attach('/path/to/file');
}
```

> [!NOTE]
> 通知邮件消息提供的 `attach` 方法也接受[可附加对象](/docs/{{version}}/mail#attachable-objects)。请查阅详尽的[可附加对象文档](/docs/{{version}}/mail#attachable-objects)了解更多信息。

向消息附加文件时，你还可以通过向 `attach` 方法传递一个 `array` 作为第二个参数，来指定显示名称和 / 或 MIME 类型：

```php
/**
 * 获取通知的邮件表现形式。
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

与在 mailable 对象中附加文件不同，你无法使用 `attachFromStorage` 直接从存储磁盘附加文件。你应当使用 `attach` 方法并传入文件在存储磁盘上的绝对路径。或者，你也可以从 `toMail` 方法返回一个 [mailable](/docs/{{version}}/mail#generating-mailables)：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;

/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email)
        ->attachFromStorage('/path/to/file');
}
```

必要时，可以使用 `attachMany` 方法为消息附加多个文件：

```php
/**
 * 获取通知的邮件表现形式。
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

可以使用 `attachData` 方法将原始字节字符串附加为附件。调用 `attachData` 方法时，你应当提供应分配给该附件的文件名：

```php
/**
 * 获取通知的邮件表现形式。
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
### 添加标签和元数据

一些第三方邮件服务提供商（例如 Mailgun 和 Postmark）支持消息「标签」和「元数据」，可用于对应用发送的邮件进行分组和追踪。你可以通过 `tag` 和 `metadata` 方法为邮件消息添加标签和元数据：

```php
/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->greeting('Comment Upvoted!')
        ->tag('upvote')
        ->metadata('comment_id', $this->comment->id);
}
```

如果你的应用使用 Mailgun 驱动，可以查阅 Mailgun 的文档，了解有关[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的更多信息。同样，也可以查阅 Postmark 文档，了解其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)支持的更多信息。

如果你的应用使用 Amazon SES 发送邮件，你应当使用 `metadata` 方法为消息附加 [SES「标签」](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许你注册一个闭包，该闭包会在发送消息之前随 Symfony Message 实例一起被调用。这让你有机会在消息投递之前对其进行深度自定义：

```php
use Symfony\Component\Mime\Email;

/**
 * 获取通知的邮件表现形式。
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

如有需要，你可以从通知的 `toMail` 方法返回一个完整的 [mailable 对象](/docs/{{version}}/mail)。返回 `Mailable` 而不是 `MailMessage` 时，你需要使用 mailable 对象的 `to` 方法指定消息收件人：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表现形式。
 */
public function toMail(object $notifiable): Mailable
{
    return (new InvoicePaidMailable($this->invoice))
        ->to($notifiable->email);
}
```

<a name="mailables-and-on-demand-notifications"></a>
#### Mailable 与按需通知

如果你正在发送[按需通知](#on-demand-notifications)，传递给 `toMail` 方法的 `$notifiable` 实例将是 `Illuminate\Notifications\AnonymousNotifiable` 的实例。该实例提供了一个 `routeNotificationFor` 方法，可用于获取按需通知应发送到的邮箱地址：

```php
use App\Mail\InvoicePaid as InvoicePaidMailable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Mail\Mailable;

/**
 * 获取通知的邮件表现形式。
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

在设计邮件通知模板时，如果能够像典型的 Blade 模板一样，在浏览器中快速预览渲染后的邮件消息，会非常方便。因此，Laravel 允许你从路由闭包或控制器直接返回由邮件通知生成的任何邮件消息。返回 `MailMessage` 时，它会被渲染并显示在浏览器中，这样你无需将其发送到真实邮箱地址，就能快速预览其设计：

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

Markdown 邮件通知让你既能利用邮件通知的预构建模板，又能更自由地编写更长的自定义消息。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染美观、响应式的 HTML 模板，同时还会自动生成纯文本版本。

<a name="generating-the-message"></a>
### 生成消息

要生成带有相应 Markdown 模板的通知，可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

与所有其他邮件通知一样，使用 Markdown 模板的通知应当在通知类上定义一个 `toMail` 方法。不过，与使用 `line` 和 `action` 方法来构建通知不同，这里应使用 `markdown` 方法指定要使用的 Markdown 模板的名称。你希望提供给模板使用的数据数组，可以作为该方法的第二个参数传入：

```php
/**
 * 获取通知的邮件表现形式。
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

Markdown 邮件通知结合使用了 Blade 组件和 Markdown 语法，让你既能轻松构建通知，又能利用 Laravel 预先设计好的通知组件：

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
> 编写 Markdown 邮件时，不要使用过多的缩进。按照 Markdown 标准，Markdown 解析器会将缩进的内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中的按钮链接。该组件接受两个参数：一个 `url` 和一个可选的 `color`。支持的颜色有 `primary`、`green` 和 `red`。你可以按需向通知中添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件将给定的文本块渲染在一个面板中，该面板的背景色与通知的其余部分略有不同。这让你能够吸引人们对指定文本块的注意：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。表格列的对齐支持使用默认的 Markdown 表格对齐语法：

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

你可以将所有 Markdown 通知组件导出到自己的应用中进行自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 目录和一个 `text` 目录，每个目录都包含所有可用组件各自的呈现形式。你可以按自己的喜好自由定制这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录中将包含一个 `default.css` 文件。你可以自定义该文件中的 CSS，你的样式将自动内联到 Markdown 通知的 HTML 呈现形式中。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存好 CSS 文件后，将 `mail` 配置文件中的 `theme` 选项更新为新主题的名称。

要为单个通知自定义主题，你可以在构建通知的邮件消息时调用 `theme` 方法。`theme` 方法接受发送通知时应使用的主题名称：

```php
/**
 * 获取通知的邮件表现形式。
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
### 前置要求

`database` 通知渠道将通知信息存储在数据库表中。该表将包含通知类型等信息，以及一个描述该通知的 JSON 数据结构。

你可以查询该表，在应用的用户界面中展示通知。不过，在此之前，你需要先创建一个存放通知的数据库表。你可以使用 `make:notifications-table` 命令生成一个具有正确表结构的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan make:notifications-table

php artisan migrate
```

> [!NOTE]
> 如果你的可通知模型使用 [UUID 或 ULID 主键](/docs/{{version}}/eloquent#uuid-and-ulid-keys)，你应当在通知表迁移中将 `morphs` 方法替换为 [uuidMorphs](/docs/{{version}}/migrations#column-method-uuidMorphs) 或 [ulidMorphs](/docs/{{version}}/migrations#column-method-ulidMorphs)。

<a name="formatting-database-notifications"></a>
### 格式化数据库通知

如果通知支持存储在数据库表中，你应当在通知类上定义一个 `toDatabase` 或 `toArray` 方法。该方法会接收一个 `$notifiable` 实体，并应返回一个普通 PHP 数组。返回的数组将被编码为 JSON，并存储在 `notifications` 表的 `data` 列中。我们来看一个 `toArray` 方法的示例：

```php
/**
 * 获取通知的数组表现形式。
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

当通知被存储到应用的数据库时，默认情况下，`type` 列将被设置为通知的类名，`read_at` 列将为 `null`。不过，你可以通过在通知类中定义 `databaseType` 和 `initialDatabaseReadAtValue` 方法来自定义此行为：

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
#### `toDatabase` 与 `toArray` 的区别

`toArray` 方法也会被 `broadcast` 渠道用来确定要向 JavaScript 驱动的前端广播哪些数据。如果你想为 `database` 和 `broadcast` 渠道提供两种不同的数组表现形式，你应当定义 `toDatabase` 方法而不是 `toArray` 方法。

<a name="accessing-the-notifications"></a>
### 访问通知

通知存储到数据库后，你需要一种便捷的方式从可通知实体上访问它们。Laravel 默认 `App\Models\User` 模型中包含的 `Illuminate\Notifications\Notifiable` trait 提供了一个 `notifications` [Eloquent 关联](/docs/{{version}}/eloquent-relationships)，返回该实体的所有通知。要获取通知，你可以像访问其他 Eloquent 关联一样访问该方法。默认情况下，通知会按 `created_at` 时间戳排序，最新的通知排在集合的开头：

```php
$user = App\Models\User::find(1);

foreach ($user->notifications as $notification) {
    echo $notification->type;
}
```

如果你只想检索「未读」通知，可以使用 `unreadNotifications` 关联。同样，这些通知会按 `created_at` 时间戳排序，最新的通知排在集合的开头：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    echo $notification->type;
}
```

如果你只想检索「已读」通知，可以使用 `readNotifications` 关联：

```php
$user = App\Models\User::find(1);

foreach ($user->readNotifications as $notification) {
    echo $notification->type;
}
```

> [!NOTE]
> 要从 JavaScript 客户端访问通知，你应当为应用定义一个通知控制器，返回某个可通知实体（例如当前用户）的通知。然后，你就可以在 JavaScript 客户端中向该控制器的 URL 发起 HTTP 请求。

<a name="marking-notifications-as-read"></a>
### 将通知标记为已读

通常，你会希望在用户查看通知时将其标记为「已读」。`Illuminate\Notifications\Notifiable` trait 提供了一个 `markAsRead` 方法，用于更新通知数据库记录上的 `read_at` 列：

```php
$user = App\Models\User::find(1);

foreach ($user->unreadNotifications as $notification) {
    $notification->markAsRead();
}
```

不过，你可以直接在通知集合上使用 `markAsRead` 方法，而无需遍历每个通知：

```php
$user->unreadNotifications->markAsRead();
```

你也可以使用批量更新查询，将所有通知标记为已读，而无需从数据库中检索它们：

```php
$user = App\Models\User::find(1);

$user->unreadNotifications()->update(['read_at' => now()]);
```

你可以 `delete` 这些通知，将其从表中彻底移除：

```php
$user->notifications()->delete();
```

<a name="broadcast-notifications"></a>
## 广播通知

<a name="broadcast-prerequisites"></a>
### 前置要求

在广播通知之前，你应当先配置并熟悉 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务。事件广播提供了一种从 JavaScript 驱动的前端响应服务端 Laravel 事件的方式。

<a name="formatting-broadcast-notifications"></a>
### 格式化广播通知

`broadcast` 渠道使用 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务广播通知，让你的 JavaScript 驱动的前端能够实时捕获通知。如果通知支持广播，你可以在通知类上定义一个 `toBroadcast` 方法。该方法会接收一个 `$notifiable` 实体，并应返回一个 `BroadcastMessage` 实例。如果 `toBroadcast` 方法不存在，系统将使用 `toArray` 方法来收集要广播的数据。返回的数据将被编码为 JSON，并广播到你的 JavaScript 驱动的前端。我们来看一个 `toBroadcast` 方法的示例：

```php
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * 获取通知的可广播表现形式。
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

所有广播通知都会进入队列以进行广播。如果你想配置用于将广播操作入队的队列连接或队列名称，可以使用 `BroadcastMessage` 的 `onConnection` 和 `onQueue` 方法：

```php
return (new BroadcastMessage($data))
    ->onConnection('sqs')
    ->onQueue('broadcasts');
```

<a name="customizing-the-notification-type"></a>
#### 自定义通知类型

除了你指定的数据之外，所有广播通知还包含一个 `type` 字段，其中包含通知的完整类名。如果你想自定义通知的 `type`，可以在通知类上定义一个 `broadcastType` 方法：

```php
/**
 * 获取被广播通知的类型。
 */
public function broadcastType(): string
{
    return 'broadcast.message';
}
```

<a name="listening-for-notifications"></a>
### 监听通知

通知会在一个使用 `{notifiable}.{id}` 约定格式的私有频道上广播。因此，如果你向一个 ID 为 `1` 的 `App\Models\User` 实例发送通知，该通知将在 `App.Models.User.1` 私有频道上广播。使用 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时，你可以使用 `notification` 方法轻松监听频道上的通知：

```js
Echo.private('App.Models.User.' + userId)
    .notification((notification) => {
        console.log(notification.type);
    });
```

<a name="using-react-or-vue"></a>
#### 使用 React 或 Vue

Laravel Echo 包含了 React 和 Vue 的 hook，让监听通知变得轻而易举。首先，调用 `useEchoNotification` hook，它用于监听通知。当使用该 hook 的组件被卸载时，`useEchoNotification` hook 会自动离开频道：

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

默认情况下，该 hook 会监听所有通知。要指定你希望监听的通知类型，可以向 `useEchoNotification` 提供一个字符串或类型数组：

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

你还可以指定通知负载数据的结构，以获得更好的类型安全性和编辑便利性：

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
#### 自定义通知频道

如果你想自定义实体广播通知的广播频道，可以在可通知实体上定义一个 `receivesBroadcastNotificationsOn` 方法：

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
### 前置要求

Laravel 中的短信通知发送由 [Vonage](https://www.vonage.com/)（前身为 Nexmo）驱动。在通过 Vonage 发送通知之前，你需要安装 `laravel/vonage-notification-channel` 和 `guzzlehttp/guzzle` 扩展包：

```shell
composer require laravel/vonage-notification-channel guzzlehttp/guzzle
```

该扩展包包含一个[配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。不过，你无需将该配置文件导出到自己的应用中。只需使用 `VONAGE_KEY` 和 `VONAGE_SECRET` 环境变量来定义你的 Vonage 公钥和密钥即可。

定义好密钥后，你应当设置一个 `VONAGE_SMS_FROM` 环境变量，用于定义短信消息默认的发件电话号码。你可以在 Vonage 控制面板中生成此电话号码：

```ini
VONAGE_SMS_FROM=15556666666
```

<a name="formatting-sms-notifications"></a>
### 格式化短信通知

如果通知支持以短信形式发送，你应当在通知类上定义一个 `toVonage` 方法。该方法会接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\VonageMessage` 实例：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your SMS message content');
}
```

<a name="unicode-content"></a>
#### Unicode 内容

如果你的短信消息将包含 Unicode 字符，你应当在构建 `VonageMessage` 实例时调用 `unicode` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表现形式。
 */
public function toVonage(object $notifiable): VonageMessage
{
    return (new VonageMessage)
        ->content('Your unicode message')
        ->unicode();
}
```

<a name="customizing-the-from-number"></a>
### 自定义「发件」号码

如果你想使用与 `VONAGE_SMS_FROM` 环境变量指定的电话号码不同的号码发送某些通知，可以在 `VonageMessage` 实例上调用 `from` 方法：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表现形式。
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

如果你想按用户、团队或客户端追踪费用，可以为通知添加一个「客户端引用」（client reference）。Vonage 允许你使用此客户端引用生成报告，以便你更好地了解特定客户的短信使用情况。客户端引用可以是长度不超过 40 个字符的任意字符串：

```php
use Illuminate\Notifications\Messages\VonageMessage;

/**
 * 获取通知的 Vonage / 短信表现形式。
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

要将 Vonage 通知路由到正确的电话号码，请在你的可通知实体上定义一个 `routeNotificationForVonage` 方法：

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
### 前置要求

在发送 Slack 通知之前，你应当通过 Composer 安装 Slack 通知渠道：

```shell
composer require laravel/slack-notification-channel
```

此外，你必须为你的 Slack 工作区创建一个 [Slack App](https://api.slack.com/apps?new_app=1)。

如果你只需向创建该 App 的同一 Slack 工作区发送通知，应当确保你的 App 拥有 `chat:write`、`chat:write.public` 和 `chat:write.customize` 权限范围（scope）。这些权限范围可以在 Slack 中 App 管理的「OAuth & Permissions」标签页中添加。

接下来，复制该 App 的「Bot User OAuth Token」，并将其放入应用 `services.php` 配置文件的 `slack` 配置数组中。此 token 可以在 Slack 的「OAuth & Permissions」标签页中找到：

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

如果你的应用要向由应用用户拥有的外部 Slack 工作区发送通知，则需要通过 Slack「分发」你的 App。App 分发可以在 Slack 中你的 App 的「Manage Distribution」标签页中管理。App 分发完成后，你可以使用 [Socialite](/docs/{{version}}/socialite) 代表应用用户[获取 Slack Bot 令牌](/docs/{{version}}/socialite#slack-bot-scopes)。

<a name="formatting-slack-notifications"></a>
### 格式化 Slack 通知

如果通知支持以 Slack 消息的形式发送，你应当在通知类上定义一个 `toSlack` 方法。该方法会接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Slack\SlackMessage` 实例。你可以使用 [Slack 的 Block Kit API](https://api.slack.com/block-kit) 构建丰富的通知。下面的示例可以在 [Slack 的 Block Kit builder](https://app.slack.com/block-kit-builder/T01KWS6K23Z#%7B%22blocks%22:%5B%7B%22type%22:%22header%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Invoice%20Paid%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22plain_text%22,%22text%22:%22Customer%20%231234%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22An%20invoice%20has%20been%20paid.%22%7D,%22fields%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20No:*%5Cn1000%22%7D,%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Invoice%20Recipient:*%5Cntaylor@laravel.com%22%7D%5D%7D,%7B%22type%22:%22divider%22%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22plain_text%22,%22text%22:%22Congratulations!%22%7D%7D%5D%7D) 中预览：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
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

除了使用流式消息构建方法来构建 Block Kit 消息之外，你还可以将 Slack 的 Block Kit Builder 生成的原始 JSON 负载提供给 `usingBlockKitTemplate` 方法：

```php
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Support\Str;

/**
 * 获取通知的 Slack 表现形式。
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

Slack 的 Block Kit 通知系统提供了强大的[处理用户交互](https://api.slack.com/interactivity/handling)功能。要使用这些功能，你的 Slack App 应当启用「Interactivity」，并配置一个指向你应用所服务 URL 的「Request URL」。这些设置可以在 Slack 中 App 管理的「Interactivity & Shortcuts」标签页中管理。

在下面这个使用了 `actionsBlock` 方法的示例中，Slack 会向你的「Request URL」发送一个 `POST` 请求，其负载中包含点击按钮的 Slack 用户、被点击按钮的 ID 等信息。然后，你的应用可以根据该负载决定要采取的操作。你还应当[验证该请求](https://api.slack.com/authentication/verifying-requests-from-slack)确实来自 Slack：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
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
#### 确认模态框

如果你希望用户在执行操作之前必须先进行确认，可以在定义按钮时调用 `confirm` 方法。`confirm` 方法接受一个消息和一个接收 `ConfirmObject` 实例的闭包：

```php
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Composites\ConfirmObject;
use Illuminate\Notifications\Slack\SlackMessage;

/**
 * 获取通知的 Slack 表现形式。
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

如果你想快速检查自己构建的块，可以在 `SlackMessage` 实例上调用 `dd` 方法。`dd` 方法会生成并转储一个指向 Slack [Block Kit Builder](https://app.slack.com/block-kit-builder/) 的 URL，它会在浏览器中显示负载和通知的预览。你可以向 `dd` 方法传递 `true` 来转储原始负载：

```php
return (new SlackMessage)
    ->text('One of your invoices has been paid!')
    ->headerBlock('Invoice Paid')
    ->dd();
```

<a name="routing-slack-notifications"></a>
### 路由 Slack 通知

要将 Slack 通知定向到正确的 Slack 团队和频道，请在你的可通知模型上定义一个 `routeNotificationForSlack` 方法。该方法可以返回以下三种值之一：

- `null` —— 将路由交由通知本身配置的渠道处理。你可以在构建 `SlackMessage` 时使用 `to` 方法在通知内配置频道。
- 一个指定要发送通知的 Slack 频道的字符串，例如 `#support-channel`。
- 一个 `SlackRoute` 实例，允许你指定 OAuth token 和频道名称，例如 `SlackRoute::make($this->slack_channel, $this->slack_token)`。向外部工作区发送通知时应使用此方法。

例如，从 `routeNotificationForSlack` 方法返回 `#support-channel`，会将通知发送到与应用 `services.php` 配置文件中 Bot User OAuth token 相关联的工作区中的 `#support-channel` 频道：

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
> 在向外部 Slack 工作区发送通知之前，你的 Slack App 必须已经[分发](#slack-app-distribution)。

当然，你经常会想向应用用户拥有的 Slack 工作区发送通知。为此，你首先需要获取该用户的 Slack OAuth token。所幸，[Laravel Socialite](/docs/{{version}}/socialite) 包含一个 Slack 驱动，让你能够轻松地让应用用户通过 Slack 认证并[获取 bot token](/docs/{{version}}/socialite#slack-bot-scopes)。

获取到 bot token 并将其存储到应用的数据库后，你就可以使用 `SlackRoute::make` 方法将通知路由到该用户的工作区。此外，你的应用很可能还需要为用户提供一个机会，让其指定通知应发送到哪个频道：

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
## 通知本地化

Laravel 允许你以不同于 HTTP 请求当前语言区域（locale）的其他语言区域发送通知，并且即使通知被放入队列，也会记住该语言区域。

为此，`Illuminate\Notifications\Notification` 类提供了一个 `locale` 方法来设置所需的语言。应用会在评估通知时切换到该语言区域，评估完成后会再恢复到之前的语言区域：

```php
$user->notify((new InvoicePaid($invoice))->locale('es'));
```

也可以通过 `Notification` facade 实现多个可通知条目的本地化：

```php
Notification::locale('es')->send(
    $users, new InvoicePaid($invoice)
);
```

<a name="user-preferred-locales"></a>
#### 用户首选语言区域

有时，应用会存储每个用户的首选语言区域。通过在可通知模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送通知时使用该存储的语言区域：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * 获取用户的首选语言区域。
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

实现该接口后，Laravel 会在向模型发送通知和 mailable 时自动使用首选语言区域。因此，使用此接口时无需再调用 `locale` 方法：

```php
$user->notify(new InvoicePaid($invoice));
```

<a name="testing"></a>
## 测试

你可以使用 `Notification` facade 的 `fake` 方法来阻止通知的发送。通常，发送通知与你实际测试的代码无关。大多数情况下，只需断言 Laravel 被指示发送了给定的通知就足够了。

调用 `Notification` facade 的 `fake` 方法后，你可以断言通知被指示发送给用户，甚至可以检查通知收到的数据：

```php tab=Pest
<?php

use App\Notifications\OrderShipped;
use Illuminate\Support\Facades\Notification;

test('orders can be shipped', function () {
    Notification::fake();

    // 执行订单发货...

    // 断言未发送任何通知...
    Notification::assertNothingSent();

    // 断言通知已发送给指定用户...
    Notification::assertSentTo(
        [$user], OrderShipped::class
    );

    // 断言通知未被发送...
    Notification::assertNotSentTo(
        [$user], AnotherNotification::class
    );

    // 断言通知被发送了两次...
    Notification::assertSentTimes(WeeklyReminder::class, 2);

    // 断言发送了指定数量的通知...
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

        // 断言通知已发送给指定用户...
        Notification::assertSentTo(
            [$user], OrderShipped::class
        );

        // 断言通知未被发送...
        Notification::assertNotSentTo(
            [$user], AnotherNotification::class
        );

        // 断言通知被发送了两次...
        Notification::assertSentTimes(WeeklyReminder::class, 2);

        // 断言发送了指定数量的通知...
        Notification::assertCount(3);
    }
}
```

你可以向 `assertSentTo` 或 `assertNotSentTo` 方法传递一个闭包，以断言发送了一个通过给定「真值测试」的通知。如果至少有一个发送的通知通过了给定的真值测试，断言就会成功：

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

如果你测试的代码发送的是[按需通知](#on-demand-notifications)，你可以通过 `assertSentOnDemand` 方法测试按需通知是否已发送：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过向 `assertSentOnDemand` 方法传递一个闭包作为第二个参数，你可以判断按需通知是否发送到了正确的「路由」地址：

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

当通知正在发送时，通知系统会派发 `Illuminate\Notifications\Events\NotificationSending` 事件。该事件包含「可通知」实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSending;

class CheckNotificationStatus
{
    /**
     * 处理事件。
     */
    public function handle(NotificationSending $event): void
    {
        // ...
    }
}
```

如果 `NotificationSending` 事件的事件监听器在其 `handle` 方法中返回 `false`，通知将不会被发送：

```php
/**
 * 处理事件。
 */
public function handle(NotificationSending $event): bool
{
    return false;
}
```

在事件监听器中，你可以访问事件上的 `notifiable`、`notification` 和 `channel` 属性，以了解通知收件人或通知本身的更多信息：

```php
/**
 * 处理事件。
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

当通知被发送后，通知系统会派发 `Illuminate\Notifications\Events\NotificationSent` [事件](/docs/{{version}}/events)。该事件包含「可通知」实体和通知实例本身。你可以在应用中为此事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Notifications\Events\NotificationSent;

class LogNotification
{
    /**
     * 处理事件。
     */
    public function handle(NotificationSent $event): void
    {
        // ...
    }
}
```

在事件监听器中，你可以访问事件上的 `notifiable`、`notification`、`channel` 和 `response` 属性，以了解通知收件人或通知本身的更多信息：

```php
/**
 * 处理事件。
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

Laravel 内置了少数几种通知渠道，但你可能想编写自己的驱动，通过其他渠道投递通知。Laravel 让这一切变得非常简单。首先，定义一个包含 `send` 方法的类。该方法应接收两个参数：`$notifiable` 和 `$notification`。

在 `send` 方法中，你可以调用通知上的方法来获取一个你的渠道能理解的消息对象，然后按你希望的任何方式将通知发送给 `$notifiable` 实例：

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

        // 将通知发送给 $notifiable 实例...
    }
}
```

定义好通知渠道类后，你就可以在任何通知的 `via` 方法中返回该类名。在这个示例中，通知的 `toVoice` 方法可以返回任何你选择用来表示语音消息的对象。例如，你可以定义自己的 `VoiceMessage` 类来表示这些消息：

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
     * 获取通知的语音表现形式。
     */
    public function toVoice(object $notifiable): VoiceMessage
    {
        // ...
    }
}
```
