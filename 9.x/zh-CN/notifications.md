# 通知

- [简介](#introduction)
- [生成通知](#generating-notifications)
- [发送通知](#sending-notifications)
    - [使用 Notifiable Trait](#using-the-notifiable-trait)
    - [使用 Notification Facade](#using-the-notification-facade)
    - [指定投递渠道](#specifying-delivery-channels)
    - [队列通知](#queueing-notifications)
    - [按需通知](#on-demand-notifications)
- [邮件通知](#mail-notifications)
    - [格式化邮件消息](#formatting-mail-messages)
    - [自定义发件人](#customizing-the-sender)
    - [自定义收件人](#customizing-the-recipient)
    - [自定义主题](#customizing-the-subject)
    - [自定义邮件驱动](#customizing-the-mailer)
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
    - [前提条件](#database-prerequisites)
    - [格式化数据库通知](#formatting-database-notifications)
    - [访问通知](#accessing-the-notifications)
    - [将通知标记为已读](#marking-notifications-as-read)
- [广播通知](#broadcast-notifications)
    - [前提条件](#broadcast-prerequisites)
    - [格式化广播通知](#formatting-broadcast-notifications)
    - [监听通知](#listening-for-notifications)
- [SMS 通知](#sms-notifications)
    - [前提条件](#sms-prerequisites)
    - [格式化 SMS 通知](#formatting-sms-notifications)
    - [格式化 Shortcode 通知](#formatting-shortcode-notifications)
    - [自定义"发件人"号码](#customizing-the-from-number)
    - [添加客户引用](#adding-a-client-reference)
    - [路由 SMS 通知](#routing-sms-notifications)
- [Slack 通知](#slack-notifications)
    - [前提条件](#slack-prerequisites)
    - [格式化 Slack 通知](#formatting-slack-notifications)
    - [Slack 附件](#slack-attachments)
    - [路由 Slack 通知](#routing-slack-notifications)
- [通知本地化](#localizing-notifications)
- [通知事件](#notification-events)
- [自定义渠道](#custom-channels)

<a name="introduction"></a>
## 简介

除了支持[发送电子邮件](/docs/{{version}}/mail)，Laravel 还支持通过多种投递渠道发送通知，包括电子邮件、SMS（通过 [Vonage](https://www.vonage.com/communications-apis/)，前身为 Nexmo）和 [Slack](https://slack.com)。此外，社区还创建了各种[通知渠道](https://laravel-notification-channels.com/about/#suggesting-a-new-channel)，可以通过几十种不同的渠道发送通知！通知也可以存储在数据库中，以便在 Web 界面中显示。

通常，通知应该是简短的信息性消息，通知用户应用中发生的某事。例如，如果你正在编写一个计费应用，你可以通过电子邮件和 SMS 渠道向用户发送"发票已支付"通知。

<a name="generating-notifications"></a>
## 生成通知

在 Laravel 中，每个通知都由一个单独的类表示，通常存储在 `app/Notifications` 目录中。如果你的应用中没有此目录不必担心——运行 `make:notification` Artisan 命令时会自动创建：

```shell
php artisan make:notification InvoicePaid
```

此命令会在 `app/Notifications` 目录中放置一个新的通知类。每个通知类包含一个 `via` 方法和数量可变的消息构建方法（如 `toMail` 或 `toDatabase`），将通知转换为针对特定渠道定制的消息。

<a name="sending-notifications"></a>
## 发送通知

<a name="using-the-notifiable-trait"></a>
### 使用 Notifiable Trait

通知可以通过两种方式发送：使用 `Notifiable` trait 的 `notify` 方法或使用 `Notification` [Facade](/docs/{{version}}/facades)。`Notifiable` trait 默认包含在应用的 `App\Models\User` 模型中：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable
    {
        use Notifiable;
    }

此 trait 提供的 `notify` 方法期望接收一个通知实例：

    use App\Notifications\InvoicePaid;

    $user->notify(new InvoicePaid($invoice));

> **Note**
> 请记住，你可以在任何模型上使用 `Notifiable` trait。不限于仅在 `User` 模型上包含它。

<a name="using-the-notification-facade"></a>
### 使用 Notification Facade

或者，你可以通过 `Notification` [Facade](/docs/{{version}}/facades) 发送通知。当你需要向多个可通知实体（如用户集合）发送通知时，此方法很有用。要使用 Facade 发送通知，将所有可通知实体和通知实例传递给 `send` 方法：

    use Illuminate\Support\Facades\Notification;

    Notification::send($users, new InvoicePaid($invoice));

你还可以使用 `sendNow` 方法立即发送通知。即使通知实现了 `ShouldQueue` 接口，此方法也会立即发送通知：

    Notification::sendNow($developers, new DeploymentCompleted($deployment));

<a name="specifying-delivery-channels"></a>
### 指定投递渠道

每个通知类都有一个 `via` 方法，确定通知将通过哪些渠道投递。通知可以通过 `mail`、`database`、`broadcast`、`vonage` 和 `slack` 渠道发送。

> **Note**
> 如果你想使用其他投递渠道（如 Telegram 或 Pusher），请查看社区驱动的 [Laravel Notification Channels 网站](http://laravel-notification-channels.com)。

`via` 方法接收一个 `$notifiable` 实例，该实例是通知发送到的类的实例。你可以使用 `$notifiable` 来确定通知应在哪些渠道上投递：

    /**
     * 获取通知的投递渠道。
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return $notifiable->prefers_sms ? ['vonage'] : ['mail', 'database'];
    }

<a name="queueing-notifications"></a>
### 队列通知

> **Warning**
> 队列通知之前，你应该配置队列并[启动一个 worker](/docs/{{version}}/queues)。

发送通知可能需要一些时间，特别是当渠道需要发起外部 API 调用来投递通知时。为了加快应用的响应时间，你可以通过在类中添加 `ShouldQueue` 接口和 `Queueable` trait 来将通知排队。对于使用 `make:notification` 命令生成的所有通知，接口和 trait 已经导入，因此你可以立即将它们添加到通知类中：

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

将 `ShouldQueue` 接口添加到通知后，你可以像平常一样发送通知。Laravel 会检测类上的 `ShouldQueue` 接口并自动将通知的投递排队：

    $user->notify(new InvoicePaid($invoice));

队列通知时，将为每个收件人和渠道组合创建一个排队作业。例如，如果你的通知有 3 个收件人和 2 个渠道，将向队列分发 6 个作业。

<a name="delaying-notifications"></a>
#### 延迟通知

如果你想延迟通知的投递，可以在通知实例化时链式调用 `delay` 方法：

    $delay = now()->addMinutes(10);

    $user->notify((new InvoicePaid($invoice))->delay($delay));

<a name="delaying-notifications-per-channel"></a>
#### 按渠道延迟通知

你可以向 `delay` 方法传递数组来指定特定渠道的延迟时间：

    $user->notify((new InvoicePaid($invoice))->delay([
        'mail' => now()->addMinutes(5),
        'sms' => now()->addMinutes(10),
    ]));

或者，你可以在通知类本身上定义一个 `withDelay` 方法。`withDelay` 方法应返回渠道名和延迟值的数组：

    /**
     * 确定通知的投递延迟。
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addMinutes(5),
            'sms' => now()->addMinutes(10),
        ];
    }

<a name="customizing-the-notification-queue-connection"></a>
#### 自定义通知队列连接

默认情况下，队列通知将使用应用的默认队列连接排队。如果你想为特定通知指定应使用的不同连接，可以在通知类上定义一个 `$connection` 属性：

    /**
     * 队列通知时使用的队列连接名称。
     *
     * @var string
     */
    public $connection = 'redis';

或者，如果你想为通知支持的每个通知渠道指定应使用的特定队列连接，可以在通知上定义一个 `viaConnections` 方法。此方法应返回渠道名 / 队列连接名对的数组：

    /**
     * 确定每个通知渠道应使用的连接。
     *
     * @return array
     */
    public function viaConnections()
    {
        return [
            'mail' => 'redis',
            'database' => 'sync',
        ];
    }

<a name="customizing-notification-channel-queues"></a>
#### 自定义通知渠道队列

如果你想为通知支持的每个通知渠道指定应使用的特定队列，可以在通知上定义一个 `viaQueues` 方法。此方法应返回渠道名 / 队列名对的数组：

    /**
     * 确定每个通知渠道应使用的队列。
     *
     * @return array
     */
    public function viaQueues()
    {
        return [
            'mail' => 'mail-queue',
            'slack' => 'slack-queue',
        ];
    }

<a name="queued-notifications-and-database-transactions"></a>
#### 队列通知与数据库事务

当队列通知在数据库事务内分发时，它们可能在数据库事务提交之前就被队列处理。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，事务内创建的任何模型或数据库记录可能不存在于数据库中。如果你的通知依赖于这些模型，当发送排队通知的作业被处理时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，你仍可以通过在发送通知时调用 `afterCommit` 方法来指示特定的排队通知应在所有打开的数据库事务提交后分发：

    use App\Notifications\InvoicePaid;

    $user->notify((new InvoicePaid($invoice))->afterCommit());

或者，你可以从通知的构造函数调用 `afterCommit` 方法：

    <?php

    namespace App\Notifications;

    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;

    class InvoicePaid extends Notification implements ShouldQueue
    {
        use Queueable;

        /**
         * 创建新的通知实例。
         *
         * @return void
         */
        public function __construct()
        {
            $this->afterCommit();
        }
    }

> **Note**
> 要了解更多关于解决这些问题的信息，请查阅有关[排队作业和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="determining-if-the-queued-notification-should-be-sent"></a>
#### 确定排队通知是否应发送

排队通知被分发到队列进行后台处理后，通常会被队列 worker 接受并发送给预期的收件人。

但是，如果你希望在排队通知被队列 worker 处理后对是否应发送做出最终决定，可以在通知类上定义一个 `shouldSend` 方法。如果此方法返回 `false`，通知将不会被发送：

    /**
     * 确定是否应发送通知。
     *
     * @param  mixed  $notifiable
     * @param  string  $channel
     * @return bool
     */
    public function shouldSend($notifiable, $channel)
    {
        return $this->invoice->isPaid();
    }

<a name="on-demand-notifications"></a>
### 按需通知

有时你可能需要向未存储为应用"用户"的人发送通知。使用 `Notification` Facade 的 `route` 方法，你可以在发送通知之前指定临时通知路由信息：

    use Illuminate\Broadcasting\Channel;
    use Illuminate\Support\Facades\Notification;

    Notification::route('mail', 'taylor@example.com')
                ->route('vonage', '5555555555')
                ->route('slack', 'https://hooks.slack.com/services/...')
                ->route('broadcast', [new Channel('channel-name')])
                ->notify(new InvoicePaid($invoice));

如果你希望在向 `mail` 路由发送按需通知时提供收件人姓名，可以提供一个以电子邮件地址为键、以姓名为数组第一个元素值的数组：

    Notification::route('mail', [
        'barrett@example.com' => 'Barrett Blair',
    ])->notify(new InvoicePaid($invoice));

<a name="mail-notifications"></a>
## 邮件通知

<a name="formatting-mail-messages"></a>
### 格式化邮件消息

如果通知支持作为电子邮件发送，你应该在通知类上定义一个 `toMail` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。

`MailMessage` 类包含一些简单的方法来帮助你构建事务性电子邮件消息。邮件消息可以包含文本行以及一个"行动号召"。让我们看一个 `toMail` 方法示例：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url('/invoice/'.$this->invoice->id);

        return (new MailMessage)
                    ->greeting('Hello!')
                    ->line('One of your invoices has been paid!')
                    ->lineIf($this->amount > 0, "Amount paid: {$this->amount}")
                    ->action('View Invoice', $url)
                    ->line('Thank you for using our application!');
    }

> **Note**
> 注意我们在 `toMail` 方法中使用了 `$this->invoice->id`。你可以将通知生成消息所需的任何数据传递到通知的构造函数中。

在此示例中，我们注册了一个问候语、一行文本、一个行动号召，然后是另一行文本。`MailMessage` 对象提供的这些方法使格式化小型事务性电子邮件变得简单快速。邮件渠道随后将消息组件转换为美观的响应式 HTML 电子邮件模板，并附带纯文本对应版本。以下是 `mail` 渠道生成的电子邮件示例：

<img src="https://laravel.com/img/docs/notification-example-2.png">

> **Note**
> 发送邮件通知时，请确保在 `config/app.php` 配置文件中设置 `name` 配置选项。此值将用于邮件通知消息的页眉和页脚。

<a name="error-messages"></a>
#### 错误消息

某些通知向用户告知错误，例如发票支付失败。你可以通过在构建消息时调用 `error` 方法来指示邮件消息与错误相关。在邮件消息上使用 `error` 方法时，行动号召按钮将是红色而非黑色：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->error()
                    ->subject('Invoice Payment Failed')
                    ->line('...');
    }

<a name="other-mail-notification-formatting-options"></a>
#### 其他邮件通知格式化选项

除了在通知类中定义文本"行"外，你可以使用 `view` 方法指定应用于渲染通知电子邮件的自定义模板：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)->view(
            'emails.name', ['invoice' => $this->invoice]
        );
    }

你可以通过将视图名作为数组第二个元素传递给 `view` 方法来为邮件消息指定纯文本视图：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)->view(
            ['emails.name.html', 'emails.name.plain'],
            ['invoice' => $this->invoice]
        );
    }

<a name="customizing-the-sender"></a>
### 自定义发件人

默认情况下，电子邮件的发件人 / from 地址在 `config/mail.php` 配置文件中定义。但你可以使用 `from` 方法为特定通知指定 from 地址：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->from('barrett@example.com', 'Barrett Blair')
                    ->line('...');
    }

<a name="customizing-the-recipient"></a>
### 自定义收件人

通过 `mail` 渠道发送通知时，通知系统会自动在你的可通知实体上查找 `email` 属性。你可以通过在可通知实体上定义一个 `routeNotificationForMail` 方法来自定义用于投递通知的电子邮件地址：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable
    {
        use Notifiable;

        /**
         * 为 mail 渠道路由通知。
         *
         * @param  \Illuminate\Notifications\Notification  $notification
         * @return array|string
         */
        public function routeNotificationForMail($notification)
        {
            // 仅返回电子邮件地址...
            return $this->email_address;

            // 返回电子邮件地址和姓名...
            return [$this->email_address => $this->name];
        }
    }

<a name="customizing-the-subject"></a>
### 自定义主题

默认情况下，电子邮件的主题是通知类名格式化为"标题大小写"后的结果。因此，如果你的通知类名为 `InvoicePaid`，电子邮件主题将是 `Invoice Paid`。如果你想为消息指定不同的主题，可以在构建消息时调用 `subject` 方法：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->subject('Notification Subject')
                    ->line('...');
    }

<a name="customizing-the-mailer"></a>
### 自定义邮件驱动

默认情况下，电子邮件通知将使用 `config/mail.php` 配置文件中定义的默认邮件驱动发送。但你可以通过在构建消息时调用 `mailer` 方法在运行时指定不同的邮件驱动：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->mailer('postmark')
                    ->line('...');
    }

<a name="customizing-the-templates"></a>
### 自定义模板

你可以通过发布通知包的资源来修改邮件通知使用的 HTML 和纯文本模板。运行此命令后，邮件通知模板将位于 `resources/views/vendor/notifications` 目录中：

```shell
php artisan vendor:publish --tag=laravel-notifications
```

<a name="mail-attachments"></a>
### 附件

要为电子邮件通知添加附件，在构建消息时使用 `attach` 方法。`attach` 方法接受文件的绝对路径作为第一个参数：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->greeting('Hello!')
                    ->attach('/path/to/file');
    }

> **Note**
> 通知邮件消息提供的 `attach` 方法也接受[可附加对象](/docs/{{version}}/mail#attachable-objects)。请查阅全面的[可附加对象文档](/docs/{{version}}/mail#attachable-objects)以了解更多。

为消息附加文件时，你还可以通过将 `array` 作为第二个参数传递给 `attach` 方法来指定显示名称和 / 或 MIME 类型：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->greeting('Hello!')
                    ->attach('/path/to/file', [
                        'as' => 'name.pdf',
                        'mime' => 'application/pdf',
                    ]);
    }

与在 mailable 对象中附加文件不同，你不能使用 `attachFromStorage` 直接从存储磁盘附加文件。你应该使用 `attach` 方法配合存储磁盘上文件的绝对路径。或者，你可以从 `toMail` 方法返回一个 [mailable](/docs/{{version}}/mail#generating-mailables)：

    use App\Mail\InvoicePaid as InvoicePaidMailable;

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return Mailable
     */
    public function toMail($notifiable)
    {
        return (new InvoicePaidMailable($this->invoice))
                    ->to($notifiable->email)
                    ->attachFromStorage('/path/to/file');
    }

必要时，可以使用 `attachMany` 方法为消息附加多个文件：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
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

<a name="raw-data-attachments"></a>
#### 原始数据附件

`attachData` 方法可用于将原始字节字符串作为附件附加。调用 `attachData` 方法时，你应该提供应分配给附件的文件名：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->greeting('Hello!')
                    ->attachData($this->pdf, 'name.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }

<a name="adding-tags-metadata"></a>
### 添加标签和元数据

某些第三方电子邮件提供商（如 Mailgun 和 Postmark）支持消息"标签"和"元数据"，可用于分组和跟踪应用发送的电子邮件。你可以通过 `tag` 和 `metadata` 方法为电子邮件消息添加标签和元数据：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->greeting('Comment Upvoted!')
                    ->tag('upvote')
                    ->metadata('comment_id', $this->comment->id);
    }

如果你的应用使用 Mailgun 驱动，可以查阅 Mailgun 文档以了解有关[标签](https://documentation.mailgun.com/en/latest/user_manual.html#tagging-1)和[元数据](https://documentation.mailgun.com/en/latest/user_manual.html#attaching-data-to-messages)的更多信息。同样，也可以查阅 Postmark 文档以了解其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)支持的更多信息。

如果你的应用使用 Amazon SES 发送电子邮件，你应该使用 `metadata` 方法将 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

`MailMessage` 类的 `withSymfonyMessage` 方法允许你注册一个闭包，该闭包将在发送消息之前与 Symfony Message 实例一起调用。这让你有机会在消息投递之前对其进行深度自定义：

    use Symfony\Component\Mime\Email;

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->withSymfonyMessage(function (Email $message) {
                        $message->getHeaders()->addTextHeader(
                            'Custom-Header', 'Header Value'
                        );
                    });
    }

<a name="using-mailables"></a>
### 使用 Mailable

如果需要，你可以从通知的 `toMail` 方法返回完整的 [mailable 对象](/docs/{{version}}/mail)。当返回 `Mailable` 而非 `MailMessage` 时，你需要使用 mailable 对象的 `to` 方法指定消息收件人：

    use App\Mail\InvoicePaid as InvoicePaidMailable;

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return Mailable
     */
    public function toMail($notifiable)
    {
        return (new InvoicePaidMailable($this->invoice))
                    ->to($notifiable->email);
    }

<a name="mailables-and-on-demand-notifications"></a>
#### Mailable 与按需通知

如果你正在发送[按需通知](#on-demand-notifications)，传递给 `toMail` 方法的 `$notifiable` 实例将是 `Illuminate\Notifications\AnonymousNotifiable` 的实例，它提供了一个 `routeNotificationFor` 方法，可用于检索按需通知应发送到的电子邮件地址：

    use App\Mail\InvoicePaid as InvoicePaidMailable;
    use Illuminate\Notifications\AnonymousNotifiable;

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return Mailable
     */
    public function toMail($notifiable)
    {
        $address = $notifiable instanceof AnonymousNotifiable
                ? $notifiable->routeNotificationFor('mail')
                : $notifiable->email;

        return (new InvoicePaidMailable($this->invoice))
                    ->to($address);
    }

<a name="previewing-mail-notifications"></a>
### 预览邮件通知

设计邮件通知模板时，像典型的 Blade 模板一样在浏览器中快速预览渲染的邮件消息会很方便。因此，Laravel 允许你直接从路由闭包或控制器返回邮件通知生成的任何邮件消息。当返回 `MailMessage` 时，它将被渲染并显示在浏览器中，让你无需发送到实际电子邮件地址即可快速预览其设计：

    use App\Models\Invoice;
    use App\Notifications\InvoicePaid;

    Route::get('/notification', function () {
        $invoice = Invoice::find(1);

        return (new InvoicePaid($invoice))
                    ->toMail($invoice->user);
    });

<a name="markdown-mail-notifications"></a>
## Markdown 邮件通知

Markdown 邮件通知允许你利用邮件通知的预构建模板，同时给予你更多编写更长、自定义消息的自由。由于消息使用 Markdown 编写，Laravel 能够为消息渲染美观的响应式 HTML 模板，同时自动生成纯文本对应版本。

<a name="generating-the-message"></a>
### 生成消息

要生成带有对应 Markdown 模板的通知，你可以使用 `make:notification` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:notification InvoicePaid --markdown=mail.invoice.paid
```

与所有其他邮件通知一样，使用 Markdown 模板的通知应在通知类上定义一个 `toMail` 方法。但不要使用 `line` 和 `action` 方法构建通知，而是使用 `markdown` 方法指定应使用的 Markdown 模板名称。你希望对模板可用的数据数组可以作为方法的第二个参数传递：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url('/invoice/'.$this->invoice->id);

        return (new MailMessage)
                    ->subject('Invoice Paid')
                    ->markdown('mail.invoice.paid', ['url' => $url]);
    }

<a name="writing-the-message"></a>
### 编写消息

Markdown 邮件通知使用 Blade 组件和 Markdown 语法的组合，允许你在利用 Laravel 预制的通知组件的同时轻松构建通知：

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

按钮组件渲染一个居中的按钮链接。该组件接受两个参数：一个 `url` 和一个可选的 `color`。支持的颜色有 `primary`、`green` 和 `red`。你可以在通知中添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="green">
View Invoice
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件在具有与通知其余部分略有不同背景色的面板中渲染给定的文本块。这允许你引起对给定文本块的注意：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。使用默认的 Markdown 表格对齐语法支持表格列对齐：

```blade
<x-mail::table>
| Laravel       | Table         | Example  |
| ------------- |:-------------:| --------:|
| Col 2 is      | Centered      | $10      |
| Col 3 is      | Right-Aligned | $20      |
</x-mail::table>
```

<a name="customizing-the-components"></a>
### 自定义组件

你可以将所有 Markdown 通知组件导出到自己的应用中进行自定义。要导出组件，使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资产标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录都包含各自对每个可用组件的表示。你可以自由地按自己喜欢的方式自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动内联到 Markdown 通知的 HTML 表示中。

如果你想为 Laravel 的 Markdown 组件构建全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存 CSS 文件后，将 `mail` 配置文件的 `theme` 选项更新为与新主题名称匹配。

要为单个通知自定义主题，你可以在构建通知的邮件消息时调用 `theme` 方法。`theme` 方法接受发送通知时应使用的主题名称：

    /**
     * 获取通知的邮件表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->theme('invoice')
                    ->subject('Invoice Paid')
                    ->markdown('mail.invoice.paid', ['url' => $url]);
    }

<a name="database-notifications"></a>
## 数据库通知

<a name="database-prerequisites"></a>
### 前提条件

`database` 通知渠道将通知信息存储在数据库表中。此表将包含通知类型以及描述通知的 JSON 数据结构等信息。

你可以查询此表以在应用的用户界面中显示通知。但在此之前，你需要创建一个数据库表来存放通知。你可以使用 `notifications:table` 命令生成具有正确表结构的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan notifications:table

php artisan migrate
```

<a name="formatting-database-notifications"></a>
### 格式化数据库通知

如果通知支持存储在数据库表中，你应该在通知类上定义一个 `toDatabase` 或 `toArray` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个普通 PHP 数组。返回的数组将被编码为 JSON 并存储在 `notifications` 表的 `data` 列中。让我们看一个 `toArray` 方法示例：

    /**
     * 获取通知的数组表示。
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'invoice_id' => $this->invoice->id,
            'amount' => $this->invoice->amount,
        ];
    }

<a name="todatabase-vs-toarray"></a>
#### `toDatabase` 与 `toArray`

`toArray` 方法也被 `broadcast` 渠道用于确定要广播到 JavaScript 驱动前端的数据。如果你想为 `database` 和 `broadcast` 渠道使用两种不同的数组表示，应该定义一个 `toDatabase` 方法而非 `toArray` 方法。

<a name="accessing-the-notifications"></a>
### 访问通知

通知存储在数据库中后，你需要一种便捷的方式从可通知实体中访问它们。包含在 Laravel 默认 `App\Models\User` 模型中的 `Illuminate\Notifications\Notifiable` trait 包含一个 `notifications` [Eloquent 关联](/docs/{{version}}/eloquent-relationships)，返回该实体的通知。要获取通知，你可以像访问任何其他 Eloquent 关联一样访问此方法。默认情况下，通知将按 `created_at` 时间戳排序，最新通知位于集合开头：

    $user = App\Models\User::find(1);

    foreach ($user->notifications as $notification) {
        echo $notification->type;
    }

如果你想仅检索"未读"通知，可以使用 `unreadNotifications` 关联。同样，这些通知将按 `created_at` 时间戳排序，最新通知位于集合开头：

    $user = App\Models\User::find(1);

    foreach ($user->unreadNotifications as $notification) {
        echo $notification->type;
    }

> **Note**
> 要从 JavaScript 客户端访问通知，你应该为应用定义一个通知控制器，返回可通知实体（如当前用户）的通知。然后你可以从 JavaScript 客户端向该控制器的 URL 发起 HTTP 请求。

<a name="marking-notifications-as-read"></a>
### 将通知标记为已读

通常，当用户查看通知时，你会希望将其标记为"已读"。`Illuminate\Notifications\Notifiable` trait 提供了一个 `markAsRead` 方法，该方法更新通知数据库记录上的 `read_at` 列：

    $user = App\Models\User::find(1);

    foreach ($user->unreadNotifications as $notification) {
        $notification->markAsRead();
    }

但你可以直接在通知集合上使用 `markAsRead` 方法，而无需遍历每个通知：

    $user->unreadNotifications->markAsRead();

你也可以使用批量更新查询将所有通知标记为已读，而无需从数据库中检索它们：

    $user = App\Models\User::find(1);

    $user->unreadNotifications()->update(['read_at' => now()]);

你可以 `delete` 通知以将其从表中完全移除：

    $user->notifications()->delete();

<a name="broadcast-notifications"></a>
## 广播通知

<a name="broadcast-prerequisites"></a>
### 前提条件

广播通知之前，你应该配置并熟悉 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务。事件广播提供了一种从 JavaScript 驱动前端响应服务端 Laravel 事件的方式。

<a name="formatting-broadcast-notifications"></a>
### 格式化广播通知

`broadcast` 渠道使用 Laravel 的[事件广播](/docs/{{version}}/broadcasting)服务广播通知，允许你的 JavaScript 驱动前端实时捕获通知。如果通知支持广播，你可以在通知类上定义一个 `toBroadcast` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `BroadcastMessage` 实例。如果 `toBroadcast` 方法不存在，将使用 `toArray` 方法收集应广播的数据。返回的数据将被编码为 JSON 并广播到你的 JavaScript 驱动前端。让我们看一个 `toBroadcast` 方法示例：

    use Illuminate\Notifications\Messages\BroadcastMessage;

    /**
     * 获取通知的可广播表示。
     *
     * @param  mixed  $notifiable
     * @return BroadcastMessage
     */
    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'invoice_id' => $this->invoice->id,
            'amount' => $this->invoice->amount,
        ]);
    }

<a name="broadcast-queue-configuration"></a>
#### 广播队列配置

所有广播通知都排队进行广播。如果你想配置用于排队广播操作的队列连接或队列名，可以使用 `BroadcastMessage` 的 `onConnection` 和 `onQueue` 方法：

    return (new BroadcastMessage($data))
                    ->onConnection('sqs')
                    ->onQueue('broadcasts');

<a name="customizing-the-notification-type"></a>
#### 自定义通知类型

除了你指定的数据外，所有广播通知还有一个包含通知完整类名的 `type` 字段。如果你想自定义通知 `type`，可以在通知类上定义一个 `broadcastType` 方法：

    use Illuminate\Notifications\Messages\BroadcastMessage;

    /**
     * 获取正在广播的通知类型。
     *
     * @return string
     */
    public function broadcastType()
    {
        return 'broadcast.message';
    }

<a name="listening-for-notifications"></a>
### 监听通知

通知将在使用 `{notifiable}.{id}` 约定格式的私有频道上广播。因此，如果你向 ID 为 `1` 的 `App\Models\User` 实例发送通知，通知将在 `App.Models.User.1` 私有频道上广播。使用 [Laravel Echo](/docs/{{version}}/broadcasting#client-side-installation) 时，你可以使用 `notification` 方法轻松监听频道上的通知：

    Echo.private('App.Models.User.' + userId)
        .notification((notification) => {
            console.log(notification.type);
        });

<a name="customizing-the-notification-channel"></a>
#### 自定义通知频道

如果你想自定义实体广播通知在哪个频道上广播，可以在可通知实体上定义一个 `receivesBroadcastNotificationsOn` 方法：

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
         *
         * @return string
         */
        public function receivesBroadcastNotificationsOn()
        {
            return 'users.'.$this->id;
        }
    }

<a name="sms-notifications"></a>
## SMS 通知

<a name="sms-prerequisites"></a>
### 前提条件

Laravel 中发送 SMS 通知由 [Vonage](https://www.vonage.com/)（前身为 Nexmo）驱动。通过 Vonage 发送通知之前，你需要安装 `laravel/vonage-notification-channel` 和 `guzzlehttp/guzzle` 包：

    composer require laravel/vonage-notification-channel guzzlehttp/guzzle

该包包含一个[配置文件](https://github.com/laravel/vonage-notification-channel/blob/3.x/config/vonage.php)。但你不需要将此配置文件导出到自己的应用。你可以直接使用 `VONAGE_KEY` 和 `VONAGE_SECRET` 环境变量来定义 Vonage 公钥和密钥。

定义密钥后，你应该设置一个 `VONAGE_SMS_FROM` 环境变量，定义 SMS 消息默认发送的电话号码。你可以在 Vonage 控制面板中生成此电话号码：

    VONAGE_SMS_FROM=15556666666

<a name="formatting-sms-notifications"></a>
### 格式化 SMS 通知

如果通知支持作为 SMS 发送，你应该在通知类上定义一个 `toVonage` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\VonageMessage` 实例：

    /**
     * 获取通知的 Vonage / SMS 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\VonageMessage
     */
    public function toVonage($notifiable)
    {
        return (new VonageMessage)
                    ->content('Your SMS message content');
    }

<a name="unicode-content"></a>
#### Unicode 内容

如果你的 SMS 消息将包含 unicode 字符，你应该在构造 `VonageMessage` 实例时调用 `unicode` 方法：

    /**
     * 获取通知的 Vonage / SMS 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\VonageMessage
     */
    public function toVonage($notifiable)
    {
        return (new VonageMessage)
                    ->content('Your unicode message')
                    ->unicode();
    }

<a name="customizing-the-from-number"></a>
### 自定义"发件人"号码

如果你想从与 `VONAGE_SMS_FROM` 环境变量指定的电话号码不同的电话号码发送某些通知，可以在 `VonageMessage` 实例上调用 `from` 方法：

    /**
     * 获取通知的 Vonage / SMS 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\VonageMessage
     */
    public function toVonage($notifiable)
    {
        return (new VonageMessage)
                    ->content('Your SMS message content')
                    ->from('15554443333');
    }

<a name="adding-a-client-reference"></a>
### 添加客户引用

如果你想按用户、团队或客户端跟踪成本，可以为通知添加"客户引用"。Vonage 允许你使用此客户引用生成报告，以便更好地了解特定客户的 SMS 使用情况。客户引用可以是最多 40 个字符的任意字符串：

    /**
     * 获取通知的 Vonage / SMS 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\VonageMessage
     */
    public function toVonage($notifiable)
    {
        return (new VonageMessage)
                    ->clientReference((string) $notifiable->id)
                    ->content('Your SMS message content');
    }

<a name="routing-sms-notifications"></a>
### 路由 SMS 通知

要将 Vonage 通知路由到正确的电话号码，在可通知实体上定义一个 `routeNotificationForVonage` 方法：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable
    {
        use Notifiable;

        /**
         * 为 Vonage 渠道路由通知。
         *
         * @param  \Illuminate\Notifications\Notification  $notification
         * @return string
         */
        public function routeNotificationForVonage($notification)
        {
            return $this->phone_number;
        }
    }

<a name="slack-notifications"></a>
## Slack 通知

<a name="slack-prerequisites"></a>
### 前提条件

通过 Slack 发送通知之前，你必须通过 Composer 安装 Slack 通知渠道：

```shell
composer require laravel/slack-notification-channel
```

你还需要为你的团队创建一个 [Slack App](https://api.slack.com/apps?new_app=1)。创建 App 后，你应该为工作区配置一个"Incoming Webhook"。Slack 随后会提供一个 webhook URL，你可以在[路由 Slack 通知](#routing-slack-notifications)时使用。

<a name="formatting-slack-notifications"></a>
### 格式化 Slack 通知

如果通知支持作为 Slack 消息发送，你应该在通知类上定义一个 `toSlack` 方法。此方法将接收一个 `$notifiable` 实体，并应返回一个 `Illuminate\Notifications\Messages\SlackMessage` 实例。Slack 消息可以包含文本内容以及格式化额外文本或字段数组的"附件"。让我们看一个基本的 `toSlack` 示例：

    /**
     * 获取通知的 Slack 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\SlackMessage
     */
    public function toSlack($notifiable)
    {
        return (new SlackMessage)
                    ->content('One of your invoices has been paid!');
    }

<a name="slack-attachments"></a>
### Slack 附件

你还可以为 Slack 消息添加"附件"。附件提供比简单文本消息更丰富的格式化选项。在此示例中，我们将发送一个关于应用中发生的异常的错误通知，包含查看有关异常更多详情的链接：

    /**
     * 获取通知的 Slack 表示。
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\SlackMessage
     */
    public function toSlack($notifiable)
    {
        $url = url('/exceptions/'.$this->exception->id);

        return (new SlackMessage)
                    ->error()
                    ->content('Whoops! Something went wrong.')
                    ->attachment(function ($attachment) use ($url) {
                        $attachment->title('Exception: File Not Found', $url)
                                   ->content('File [background.jpg] was not found.');
                    });
    }

附件还允许你指定应呈现给用户的数据数组。给定数据将以表格样式格式呈现，便于阅读：

    /**
     * 获取通知的 Slack 表示。
     *
     * @param  mixed  $notifiable
     * @return SlackMessage
     */
    public function toSlack($notifiable)
    {
        $url = url('/invoices/'.$this->invoice->id);

        return (new SlackMessage)
                    ->success()
                    ->content('One of your invoices has been paid!')
                    ->attachment(function ($attachment) use ($url) {
                        $attachment->title('Invoice 1322', $url)
                                   ->fields([
                                        'Title' => 'Server Expenses',
                                        'Amount' => '$1,234',
                                        'Via' => 'American Express',
                                        'Was Overdue' => ':-1:',
                                    ]);
                    });
    }

<a name="markdown-attachment-content"></a>
#### Markdown 附件内容

如果你的某些附件字段包含 Markdown，可以使用 `markdown` 方法指示 Slack 将给定附件字段解析并显示为 Markdown 格式文本。此方法接受的值有：`pretext`、`text` 和 / 或 `fields`。有关 Slack 附件格式化的更多信息，请查看 [Slack API 文档](https://api.slack.com/docs/message-formatting#message_formatting)：

    /**
     * 获取通知的 Slack 表示。
     *
     * @param  mixed  $notifiable
     * @return SlackMessage
     */
    public function toSlack($notifiable)
    {
        $url = url('/exceptions/'.$this->exception->id);

        return (new SlackMessage)
                    ->error()
                    ->content('Whoops! Something went wrong.')
                    ->attachment(function ($attachment) use ($url) {
                        $attachment->title('Exception: File Not Found', $url)
                                   ->content('File [background.jpg] was *not found*.')
                                   ->markdown(['text']);
                    });
    }

<a name="routing-slack-notifications"></a>
### 路由 Slack 通知

要将 Slack 通知路由到正确的 Slack 团队和频道，在可通知实体上定义一个 `routeNotificationForSlack` 方法。此方法应返回通知应投递到的 webhook URL。Webhook URL 可以通过向 Slack 团队添加"Incoming Webhook"服务来生成：

    <?php

    namespace App\Models;

    use Illuminate\Foundation\Auth\User as Authenticatable;
    use Illuminate\Notifications\Notifiable;

    class User extends Authenticatable
    {
        use Notifiable;

        /**
         * 为 Slack 渠道路由通知。
         *
         * @param  \Illuminate\Notifications\Notification  $notification
         * @return string
         */
        public function routeNotificationForSlack($notification)
        {
            return 'https://hooks.slack.com/services/...';
        }
    }

<a name="localizing-notifications"></a>
## 通知本地化

Laravel 允许你以 HTTP 请求当前语言环境以外的语言环境发送通知，并且如果通知被排队，还会记住此语言环境。

为此，`Illuminate\Notifications\Notification` 类提供了一个 `locale` 方法来设置所需语言。应用将在评估通知时切换到此语言环境，然后在评估完成后恢复到之前的语言环境：

    $user->notify((new InvoicePaid($invoice))->locale('es'));

多个可通知条目的本地化也可以通过 `Notification` Facade 实现：

    Notification::locale('es')->send(
        $users, new InvoicePaid($invoice)
    );

<a name="user-preferred-locales"></a>
### 用户首选语言环境

有时，应用会存储每个用户的首选语言环境。通过在可通知模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送通知时使用此存储的语言环境：

    use Illuminate\Contracts\Translation\HasLocalePreference;

    class User extends Model implements HasLocalePreference
    {
        /**
         * 获取用户的首选语言环境。
         *
         * @return string
         */
        public function preferredLocale()
        {
            return $this->locale;
        }
    }

实现接口后，Laravel 将在向模型发送通知和 mailable 时自动使用首选语言环境。因此，使用此接口时无需调用 `locale` 方法：

    $user->notify(new InvoicePaid($invoice));

<a name="notification-events"></a>
## 通知事件

<a name="notification-sending-event"></a>
#### 通知发送事件

当通知正在发送时，通知系统会分发 `Illuminate\Notifications\Events\NotificationSending` [事件](/docs/{{version}}/events)。这包含"可通知"实体和通知实例本身。你可以在应用的 `EventServiceProvider` 中为此事件注册监听器：

    use App\Listeners\CheckNotificationStatus;
    use Illuminate\Notifications\Events\NotificationSending;

    /**
     * 应用的事件监听器映射。
     *
     * @var array
     */
    protected $listen = [
        NotificationSending::class => [
            CheckNotificationStatus::class,
        ],
    ];

如果 `NotificationSending` 事件的事件监听器从其 `handle` 方法返回 `false`，通知将不会被发送：

    use Illuminate\Notifications\Events\NotificationSending;

    /**
     * 处理事件。
     *
     * @param  \Illuminate\Notifications\Events\NotificationSending  $event
     * @return void
     */
    public function handle(NotificationSending $event)
    {
        return false;
    }

在事件监听器中，你可以访问事件上的 `notifiable`、`notification` 和 `channel` 属性，以了解有关通知收件人或通知本身的信息：

    /**
     * 处理事件。
     *
     * @param  \Illuminate\Notifications\Events\NotificationSending  $event
     * @return void
     */
    public function handle(NotificationSending $event)
    {
        // $event->channel
        // $event->notifiable
        // $event->notification
    }

<a name="notification-sent-event"></a>
#### 通知已发送事件

当通知已发送时，通知系统会分发 `Illuminate\Notifications\Events\NotificationSent` [事件](/docs/{{version}}/events)。这包含"可通知"实体和通知实例本身。你可以在 `EventServiceProvider` 中为此事件注册监听器：

    use App\Listeners\LogNotification;
    use Illuminate\Notifications\Events\NotificationSent;

    /**
     * 应用的事件监听器映射。
     *
     * @var array
     */
    protected $listen = [
        NotificationSent::class => [
            LogNotification::class,
        ],
    ];

> **Note**
> 在 `EventServiceProvider` 中注册监听器后，使用 `event:generate` Artisan 命令快速生成监听器类。

在事件监听器中，你可以访问事件上的 `notifiable`、`notification`、`channel` 和 `response` 属性，以了解有关通知收件人或通知本身的信息：

    /**
     * 处理事件。
     *
     * @param  \Illuminate\Notifications\Events\NotificationSent  $event
     * @return void
     */
    public function handle(NotificationSent $event)
    {
        // $event->channel
        // $event->notifiable
        // $event->notification
        // $event->response
    }

<a name="custom-channels"></a>
## 自定义渠道

Laravel 附带了一些通知渠道，但你可能想编写自己的驱动来通过其他渠道投递通知。Laravel 使这变得简单。首先，定义一个包含 `send` 方法的类。该方法应接收两个参数：一个 `$notifiable` 和一个 `$notification`。

在 `send` 方法中，你可以调用通知上的方法来检索你的渠道理解的消息对象，然后按你希望的方式将通知发送给 `$notifiable` 实例：

    <?php

    namespace App\Notifications;

    use Illuminate\Notifications\Notification;

    class VoiceChannel
    {
        /**
         * 发送给定通知。
         *
         * @param  mixed  $notifiable
         * @param  \Illuminate\Notifications\Notification  $notification
         * @return void
         */
        public function send($notifiable, Notification $notification)
        {
            $message = $notification->toVoice($notifiable);

            // 向 $notifiable 实例发送通知...
        }
    }

定义通知渠道类后，你可以从任何通知的 `via` 方法返回类名。在此示例中，通知的 `toVoice` 方法可以返回你选择用于表示语音消息的任何对象。例如，你可以定义自己的 `VoiceMessage` 类来表示这些消息：

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
         *
         * @param  mixed  $notifiable
         * @return array|string
         */
        public function via($notifiable)
        {
            return [VoiceChannel::class];
        }

        /**
         * 获取通知的语音表示。
         *
         * @param  mixed  $notifiable
         * @return VoiceMessage
         */
        public function toVoice($notifiable)
        {
            // ...
        }
    }
