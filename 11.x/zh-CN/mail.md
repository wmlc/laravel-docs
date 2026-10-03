# 邮件

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动先决条件](#driver-prerequisites)
    - [故障转移配置](#failover-configuration)
    - [轮询配置](#round-robin-configuration)
- [生成 Mailable 类](#generating-mailables)
- [编写 Mailable 类](#writing-mailables)
    - [配置发件人](#configuring-the-sender)
    - [配置视图](#configuring-the-view)
    - [视图数据](#view-data)
    - [附件](#attachments)
    - [内嵌附件](#inline-attachments)
    - [可附加对象](#attachable-objects)
    - [请求头](#headers)
    - [标签与元数据](#tags-and-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
- [Markdown Mailable 类](#markdown-mailables)
    - [生成 Markdown Mailable 类](#generating-markdown-mailables)
    - [编写 Markdown 消息](#writing-markdown-messages)
    - [自定义组件](#customizing-the-components)
- [发送邮件](#sending-mail)
    - [邮件入队](#queueing-mail)
- [渲染 Mailable 类](#rendering-mailables)
    - [在浏览器中预览 Mailable 类](#previewing-mailables-in-the-browser)
- [本地化 Mailable 类](#localizing-mailables)
- [测试](#testing-mailables)
    - [测试 Mailable 内容](#testing-mailable-content)
    - [测试 Mailable 发送](#testing-mailable-sending)
- [邮件与本地开发](#mail-and-local-development)
- [事件](#events)
- [自定义传输](#custom-transports)
    - [其他 Symfony 传输](#additional-symfony-transports)

<a name="introduction"></a>
## 简介

发送邮件不必如此复杂。Laravel 基于流行的 [Symfony Mailer](https://symfony.com/doc/7.0/mailer.html) 组件，提供了一套干净、简洁的邮件 API。Laravel 与 Symfony Mailer 提供了通过 SMTP、Mailgun、Postmark、Resend、Amazon SES 以及 `sendmail` 发送邮件的驱动，让你能够迅速通过本地或基于云的服务发送邮件。

<a name="configuration"></a>
### 配置

Laravel 的邮件服务通过应用的 `config/mail.php` 配置文件进行配置。在该文件中配置的每个邮件器都可以拥有自己独特的配置，甚至拥有自己独特的"传输"，从而让应用可以使用不同的邮件服务发送特定邮件。例如，你的应用可能使用 Postmark 发送事务性邮件，同时使用 Amazon SES 发送批量邮件。

在 `mail` 配置文件中，你会看到一个 `mailers` 配置数组。该数组为 Laravel 支持的每种主要邮件驱动/传输都提供了一个示例配置项，而 `default` 配置值则决定应用需要发送邮件时默认使用哪个邮件器。

<a name="driver-prerequisites"></a>
### 驱动 / 传输先决条件

基于 API 的驱动（如 Mailgun、Postmark、Resend 与 MailerSend）通常比通过 SMTP 服务器发送邮件更简单、更快。我们建议尽可能使用其中一种驱动。

<a name="mailgun-driver"></a>
#### Mailgun 驱动

要使用 Mailgun 驱动，请通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，你需要在应用的 `config/mail.php` 配置文件中做两处修改。第一，把默认邮件器设为 `mailgun`：

    'default' => env('MAIL_MAILER', 'mailgun'),

第二，把下面的配置数组添加到你的 `mailers` 数组中：

    'mailgun' => [
        'transport' => 'mailgun',
        // 'client' => [
        //     'timeout' => 5,
        // ],
    ],

配置好应用的默认邮件器后，把下面的选项添加到 `config/services.php` 配置文件中：

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

如果你使用的不是美国 [Mailgun 区域](https://documentation.mailgun.com/en/latest/api-intro.html#mailgun-regions)，可以在 `services` 配置文件中定义你所在区域的端点：

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
        'scheme' => 'https',
    ],

<a name="postmark-driver"></a>
#### Postmark 驱动

要使用 [Postmark](https://postmarkapp.com/) 驱动，请通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，把应用 `config/mail.php` 配置文件中的 `default` 选项设为 `postmark`。配置好应用的默认邮件器后，请确保 `config/services.php` 配置文件中包含以下选项：

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

如果你想指定某个邮件器应当使用的 Postmark 消息流，可以在该邮件器的配置数组中添加 `message_stream_id` 配置项。该配置数组位于应用的 `config/mail.php` 配置文件中：

    'postmark' => [
        'transport' => 'postmark',
        'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
        // 'client' => [
        //     'timeout' => 5,
        // ],
    ],

这样你也可以配置多个使用不同消息流的 Postmark 邮件器。

<a name="resend-driver"></a>
#### Resend 驱动

要使用 [Resend](https://resend.com/) 驱动，请通过 Composer 安装 Resend 的 PHP SDK：

```shell
composer require resend/resend-php
```

接下来，把应用 `config/mail.php` 配置文件中的 `default` 选项设为 `resend`。配置好应用的默认邮件器后，请确保 `config/services.php` 配置文件中包含以下选项：

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

<a name="ses-driver"></a>
#### SES 驱动

要使用 Amazon SES 驱动，你必须先安装适用于 PHP 的 Amazon AWS SDK。可以通过 Composer 包管理器安装该库：

```shell
composer require aws/aws-sdk-php
```

接下来，把 `config/mail.php` 配置文件中的 `default` 选项设为 `ses`，并确认 `config/services.php` 配置文件中包含以下选项：

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

要通过会话令牌使用 AWS [临时凭据](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，可以在应用的 SES 配置中添加一个 `token` 键：

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'token' => env('AWS_SESSION_TOKEN'),
    ],

要使用 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)，可以在邮件消息的 [`headers`](#headers) 方法返回的数组中返回 `X-Ses-List-Management-Options` 请求头：

```php
/**
 * 获取消息请求头。
 */
public function headers(): Headers
{
    return new Headers(
        text: [
            'X-Ses-List-Management-Options' => 'contactListName=MyContactList;topicName=MyTopic',
        ],
    );
}
```

如果你想定义 Laravel 在发送邮件时应当传给 AWS SDK `SendEmail` 方法的[其他选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，可以在 `ses` 配置中定义一个 `options` 数组：

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'options' => [
            'ConfigurationSetName' => 'MyConfigurationSet',
            'EmailTags' => [
                ['Name' => 'foo', 'Value' => 'bar'],
            ],
        ],
    ],

<a name="mailersend-driver"></a>
#### MailerSend 驱动

[MailerSend](https://www.mailersend.com/) 是一家事务性邮件与短信服务提供商，它为 Laravel 维护了自己的基于 API 的邮件驱动。包含该驱动的软件包可以通过 Composer 包管理器安装：

```shell
composer require mailersend/laravel-driver
```

软件包安装完成后，把 `MAILERSEND_API_KEY` 环境变量添加到应用的 `.env` 文件中。此外，`MAIL_MAILER` 环境变量应当定义为 `mailersend`：

```ini
MAIL_MAILER=mailersend
MAIL_FROM_ADDRESS=app@yourdomain.com
MAIL_FROM_NAME="App Name"

MAILERSEND_API_KEY=your-api-key
```

最后，把 MailerSend 添加到应用 `config/mail.php` 配置文件的 `mailers` 数组中：

```php
'mailersend' => [
    'transport' => 'mailersend',
],
```

要了解更多关于 MailerSend 的信息（包括如何使用托管模板），请查阅 [MailerSend 驱动文档](https://github.com/mailersend/mailersend-laravel-driver#usage)。

<a name="failover-configuration"></a>
### 故障转移配置

有时，你配置用来发送应用邮件的外部服务可能会宕机。在这种情况下，定义一个或多个备用邮件投递配置会很有用，以便在主投递驱动不可用时使用。

为此，你应当在应用的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件器。应用的 `failover` 邮件器配置数组应当包含一个 `mailers` 数组，用于指定已配置邮件器的选择顺序：

    'mailers' => [
        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'postmark',
                'mailgun',
                'sendmail',
            ],
        ],

        // ...
    ],

定义好故障转移邮件器后，你应当把它设为应用默认使用的邮件器，方法是在应用的 `mail` 配置文件中把 `default` 配置键的值设为其名称：

    'default' => env('MAIL_MAILER', 'failover'),

<a name="round-robin-configuration"></a>
### 轮询配置

`roundrobin` 传输允许你把邮件发送工作负载分散到多个邮件器上。要开始，请在应用的 `mail` 配置文件中定义一个使用 `roundrobin` 传输的邮件器。应用的 `roundrobin` 邮件器配置数组应当包含一个 `mailers` 数组，用于指定使用哪些已配置的邮件器进行投递：

    'mailers' => [
        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
        ],

        // ...
    ],

定义好轮询邮件器后，你应当把它设为应用默认使用的邮件器，方法是在应用的 `mail` 配置文件中把 `default` 配置键的值设为其名称：

    'default' => env('MAIL_MAILER', 'roundrobin'),

轮询传输会从已配置的邮件器列表中随机选择一个邮件器，并在发送每封后续邮件时切换到下一个可用邮件器。与有助于实现*[高可用性](https://en.wikipedia.org/wiki/High_availability)*的 `failover` 传输不同，`roundrobin` 传输提供的是*[负载均衡](https://en.wikipedia.org/wiki/Load_balancing_(computing))*。

<a name="generating-mailables"></a>
## 生成 Mailable 类

在构建 Laravel 应用时，应用发送的每种类型的邮件都表示为一个"mailable"类。这些类存放在 `app/Mail` 目录中。如果你在应用中没看到该目录，也不用担心——当你使用 `make:mail` Artisan 命令创建第一个 mailable 类时，它会自动为你生成：

```shell
php artisan make:mail OrderShipped
```

<a name="writing-mailables"></a>
## 编写 Mailable 类

生成 mailable 类之后，打开它以便查看其内容。Mailable 类的配置通过若干方法完成，包括 `envelope`、`content` 与 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，用于定义邮件主题以及收件人（有时）。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，用于定义生成邮件内容所使用的 [Blade 模板](/docs/{{version}}/blade)。

<a name="configuring-the-sender"></a>
### 配置发件人

<a name="using-the-envelope"></a>
#### 使用 Envelope

首先，我们来了解如何配置邮件发件人。换句话说，就是配置邮件的"发件人"地址。配置发件人的方式有两种。第一种方式是在消息的 envelope 上指定"发件人"地址：

    use Illuminate\Mail\Mailables\Address;
    use Illuminate\Mail\Mailables\Envelope;

    /**
     * 获取消息的 envelope。
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address('jeffrey@example.com', 'Jeffrey Way'),
            subject: 'Order Shipped',
        );
    }

如果愿意，你还可以指定 `replyTo` 地址：

    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        replyTo: [
            new Address('taylor@example.com', 'Taylor Otwell'),
        ],
        subject: 'Order Shipped',
    );

<a name="using-a-global-from-address"></a>
#### 使用全局 `from` 地址

不过，如果你的应用对所有邮件都使用同一个"发件人"地址，把它加到每个生成的 mailable 类中就会比较繁琐。你可以在 `config/mail.php` 配置文件中指定一个全局的"发件人"地址。如果 mailable 类中没有指定其他"发件人"地址，就会使用该地址：

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],

此外，你还可以在 `config/mail.php` 配置文件中定义一个全局的 `reply_to` 地址：

    'reply_to' => ['address' => 'example@example.com', 'name' => 'App Name'],

<a name="configuring-the-view"></a>
### 配置视图

在 mailable 类的 `content` 方法中，你可以定义 `view`，即渲染邮件内容时使用的模板。由于每封邮件通常都使用 [Blade 模板](/docs/{{version}}/blade)渲染内容，因此在构建邮件 HTML 时，你可以完全享有 Blade 模板引擎的全部能力与便利：

    /**
     * 获取消息内容定义。
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
        );
    }

> [!NOTE]
> 你或许想创建一个 `resources/views/emails` 目录来存放所有邮件模板；当然，你也可以把它们放在 `resources/views` 目录下的任意位置。

<a name="plain-text-emails"></a>
#### 纯文本邮件

如果你想定义邮件的纯文本版本，可以在创建消息的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数应当是一个模板名称，用于渲染邮件内容。你可以自由地为消息同时定义 HTML 与纯文本两个版本：

    /**
     * 获取消息内容定义。
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
            text: 'mail.orders.shipped-text'
        );
    }

为清晰起见，可以使用 `html` 参数作为 `view` 参数的别名：

    return new Content(
        html: 'mail.orders.shipped',
        text: 'mail.orders.shipped-text'
    );

<a name="view-data"></a>
### 视图数据

<a name="via-public-properties"></a>
#### 通过公共属性

通常，你希望向视图传递一些数据，以便在渲染邮件 HTML 时使用。有两种方式可以让数据在视图中可用。首先，你在 mailable 类上定义的任何公共属性都会自动对视图可用。因此，例如，你可以通过构造函数把数据传入 mailable 类，并把这些数据设置为类上定义的公共属性：

    <?php

    namespace App\Mail;

    use App\Models\Order;
    use Illuminate\Bus\Queueable;
    use Illuminate\Mail\Mailable;
    use Illuminate\Mail\Mailables\Content;
    use Illuminate\Queue\SerializesModels;

    class OrderShipped extends Mailable
    {
        use Queueable, SerializesModels;

        /**
         * 创建一个新的消息实例。
         */
        public function __construct(
            public Order $order,
        ) {}

        /**
         * 获取消息内容定义。
         */
        public function content(): Content
        {
            return new Content(
                view: 'mail.orders.shipped',
            );
        }
    }

数据被设置为公共属性后，就会在视图中自动可用，因此你可以像在 Blade 模板中访问其他任何数据那样访问它：

    <div>
        Price: {{ $order->price }}
    </div>

<a name="via-the-with-parameter"></a>
#### 通过 `with` 参数：

如果你想在数据被送入模板之前自定义其格式，可以通过 `Content` 定义的 `with` 参数手动把数据传给视图。通常，你仍然会通过 mailable 类的构造函数传递数据；不过，你应当把这些数据设置为 `protected` 或 `private` 属性，这样数据就不会自动对模板可用：

    <?php

    namespace App\Mail;

    use App\Models\Order;
    use Illuminate\Bus\Queueable;
    use Illuminate\Mail\Mailable;
    use Illuminate\Mail\Mailables\Content;
    use Illuminate\Queue\SerializesModels;

    class OrderShipped extends Mailable
    {
        use Queueable, SerializesModels;

        /**
         * 创建一个新的消息实例。
         */
        public function __construct(
            protected Order $order,
        ) {}

        /**
         * 获取消息内容定义。
         */
        public function content(): Content
        {
            return new Content(
                view: 'mail.orders.shipped',
                with: [
                    'orderName' => $this->order->name,
                    'orderPrice' => $this->order->price,
                ],
            );
        }
    }

数据通过 `with` 方法传递后，就会在视图中自动可用，因此你可以像在 Blade 模板中访问其他任何数据那样访问它：

    <div>
        Price: {{ $orderPrice }}
    </div>

<a name="attachments"></a>
### 附件

要向邮件添加附件，你需要把附件添加到消息 `attachments` 方法返回的数组中。首先，你可以通过 `Attachment` 类提供的 `fromPath` 方法传入一个文件路径来添加附件：

    use Illuminate\Mail\Mailables\Attachment;

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromPath('/path/to/file'),
        ];
    }

给消息附加文件时，你还可以使用 `as` 与 `withMime` 方法指定附件的显示名称和/或 MIME 类型：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromPath('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
        ];
    }

<a name="attaching-files-from-disk"></a>
#### 从磁盘附加文件

如果你把文件存储在某个[文件系统磁盘](/docs/{{version}}/filesystem)上，可以使用 `fromStorage` 附件方法把它附加到邮件中：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromStorage('/path/to/file'),
        ];
    }

当然，你也可以指定附件的名称与 MIME 类型：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromStorage('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
        ];
    }

如果你需要指定默认磁盘之外的存储磁盘，可以使用 `fromStorageDisk` 方法：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromStorageDisk('s3', '/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf'),
        ];
    }

<a name="raw-data-attachments"></a>
#### 原始数据附件

`fromData` 附件方法可用于把原始字节字符串作为附件附加。例如，如果你已在内存中生成 PDF，并希望在不写入磁盘的情况下把它附加到邮件中，就可以使用该方法。`fromData` 方法接受一个闭包，用于解析原始数据字节以及附件应使用的名称：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdf, 'Report.pdf')
                ->withMime('application/pdf'),
        ];
    }

<a name="inline-attachments"></a>
### 内嵌附件

把内嵌图片嵌入邮件通常很麻烦；不过 Laravel 提供了一种便捷的方式来为邮件附加图片。要嵌入内嵌图片，请在邮件模板中对 `$message` 变量使用 `embed` 方法。Laravel 会自动为所有邮件模板提供 `$message` 变量，因此你无需操心手动传入它：

```blade
<body>
    Here is an image:

    <img src="{{ $message->embed($pathToImage) }}">
</body>
```

> [!WARNING]
> 纯文本消息模板中没有 `$message` 变量，因为纯文本消息不使用内嵌附件。

<a name="embedding-raw-data-attachments"></a>
#### 嵌入原始数据附件

如果你已经有一段想要嵌入邮件模板的原始图片数据字符串，可以在 `$message` 变量上调用 `embedData` 方法。调用 `embedData` 方法时，需要提供一个文件名，该文件名会赋给嵌入的图片：

```blade
<body>
    Here is an image from raw data:

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

<a name="attachable-objects"></a>
### 可附加对象

虽然通过简单字符串路径把文件附加到消息通常已经够用，但在许多情况下，应用中的可附加实体都是由类表示的。例如，如果你的应用要把一张照片附加到消息，那么应用中可能还有一个表示该照片的 `Photo` 模型。这种情况下，直接把 `Photo` 模型传给 `attach` 方法岂不是很方便？可附加对象正是让你做到这一点。

要开始，请在将要附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。该接口要求你的类定义一个 `toMailAttachment` 方法，返回一个 `Illuminate\Mail\Attachment` 实例：

    <?php

    namespace App\Models;

    use Illuminate\Contracts\Mail\Attachable;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Mail\Attachment;

    class Photo extends Model implements Attachable
    {
        /**
         * 获取该模型的可附加表示形式。
         */
        public function toMailAttachment(): Attachment
        {
            return Attachment::fromPath('/path/to/file');
        }
    }

定义好可附加对象后，构建邮件消息时，你可以从 `attachments` 方法返回该对象的实例：

    /**
     * 获取消息的附件。
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [$this->photo];
    }

当然，附件数据也可能存放在 Amazon S3 等远程文件存储服务上。因此，Laravel 也允许你从存储在应用某个[文件系统磁盘](/docs/{{version}}/filesystem)上的数据生成附件实例：

    // 从默认磁盘上的文件创建附件...
    return Attachment::fromStorage($this->path);

    // 从指定磁盘上的文件创建附件...
    return Attachment::fromStorageDisk('backblaze', $this->path);

此外，你还可以通过内存中的数据创建附件实例。为此，向 `fromData` 方法提供一个闭包即可。该闭包应当返回表示附件的原始数据：

    return Attachment::fromData(fn () => $this->content, 'Photo Name');

Laravel 还提供了更多可用于自定义附件的方法。例如，你可以使用 `as` 与 `withMime` 方法自定义文件名与 MIME 类型：

    return Attachment::fromPath('/path/to/file')
        ->as('Photo Name')
        ->withMime('image/jpeg');

<a name="headers"></a>
### 请求头

有时你可能需要为发出的消息附加额外的请求头。例如，你可能需要设置自定义的 `Message-Id` 或其他任意文本请求头。

为此，请在你的 mailable 上定义 `headers` 方法。`headers` 方法应当返回一个 `Illuminate\Mail\Mailables\Headers` 实例。该类接受 `messageId`、`references` 与 `text` 参数。当然，你也可以只提供当前消息所需的参数：

    use Illuminate\Mail\Mailables\Headers;

    /**
     * 获取消息请求头。
     */
    public function headers(): Headers
    {
        return new Headers(
            messageId: 'custom-message-id@example.com',
            references: ['previous-message@example.com'],
            text: [
                'X-Custom-Header' => 'Custom Value',
            ],
        );
    }

<a name="tags-and-metadata"></a>
### 标签与元数据

某些第三方邮件提供商（如 Mailgun 与 Postmark）支持消息"标签"与"元数据"，可用于对应用发送的邮件进行分组与追踪。你可以通过 `Envelope` 定义为邮件消息添加标签与元数据：

    use Illuminate\Mail\Mailables\Envelope;

    /**
     * 获取消息的 envelope。
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Shipped',
            tags: ['shipment'],
            metadata: [
                'order_id' => $this->order->id,
            ],
        );
    }

如果你的应用使用的是 Mailgun 驱动，可以查阅 Mailgun 文档，了解有关[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tagging)与[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#attaching-data-to-messages)的更多信息。同样，也可以查阅 Postmark 文档，了解其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)与[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的支持。

如果你的应用使用 Amazon SES 发送邮件，应当使用 `metadata` 方法为消息附加 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

Laravel 的邮件能力由 Symfony Mailer 提供。Laravel 允许你注册自定义回调，这些回调会在消息发送之前拿到 Symfony Message 实例被调用。这让你有机会在消息发出之前对其进行深度自定义。为此，请在 `Envelope` 定义上定义一个 `using` 参数：

    use Illuminate\Mail\Mailables\Envelope;
    use Symfony\Component\Mime\Email;

    /**
     * 获取消息的 envelope。
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Shipped',
            using: [
                function (Email $message) {
                    // ...
                },
            ]
        );
    }

<a name="markdown-mailables"></a>
## Markdown Mailable 类

Markdown 形式的 mailable 消息让你可以在 mailable 中使用[邮件通知](/docs/{{version}}/notifications#mail-notifications)预置的模板与组件。由于消息以 Markdown 编写，Laravel 能够为消息渲染出美观、响应式的 HTML 模板，同时自动生成对应的纯文本版本。

<a name="generating-markdown-mailables"></a>
### 生成 Markdown Mailable 类

要生成带对应 Markdown 模板的 mailable，可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在其 `content` 方法中配置 mailable 的 `Content` 定义时，使用 `markdown` 参数代替 `view` 参数：

    use Illuminate\Mail\Mailables\Content;

    /**
     * 获取消息内容定义。
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.shipped',
            with: [
                'url' => $this->orderUrl,
            ],
        );
    }

<a name="writing-markdown-messages"></a>
### 编写 Markdown 消息

Markdown 形式的 mailable 混合使用 Blade 组件与 Markdown 语法，让你能够轻松构建邮件消息，同时充分利用 Laravel 预置的邮件 UI 组件：

```blade
<x-mail::message>
# Order Shipped

Your order has been shipped!

<x-mail::button :url="$url">
View Order
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
```

> [!NOTE]
> 编写 Markdown 邮件时不要使用多余的缩进。按照 Markdown 标准，Markdown 解析器会把缩进内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件会渲染一个居中的按钮链接。该组件接受两个参数：`url` 与可选的 `color`。支持的配色为 `primary`、`success` 与 `error`。你可以在一封消息中添加任意多个按钮组件：

```blade
<x-mail::button :url="$url" color="success">
View Order
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件会把给定的文本块渲染在一个面板中，该面板的背景色与消息其余部分略有不同。这让你能够把注意力吸引到某段文本上：

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

你可以把所有 Markdown 邮件组件导出到自己的应用中进行自定义。要导出这些组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

该命令会把 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录中。`mail` 目录下会包含 `html` 与 `text` 两个目录，每个目录中都有所有可用组件各自的相应表示形式。你可以随意自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录中会有一个 `default.css` 文件。你可以自定义该文件中的 CSS，你的样式会自动在 Markdown 邮件消息的 HTML 表示形式中转换为内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一套全新主题，可以在 `html/themes` 目录中放入一个 CSS 文件。为 CSS 文件命名并保存后，把应用 `config/mail.php` 配置文件的 `theme` 选项更新为新主题的名称。

要为某个 mailable 单独自定义主题，可以把 mailable 类的 `$theme` 属性设为发送该 mailable 时应使用的主题名称。

<a name="sending-mail"></a>
## 发送邮件

要发送消息，请使用 `Mail` [Facade](/docs/{{version}}/facades)上的 `to` 方法。`to` 方法接受一个邮箱地址、一个用户实例或一组用户。如果传入对象或对象集合，邮件器会在确定邮件收件人时自动使用它们的 `email` 与 `name` 属性，因此请确保这些属性在你的对象上可用。指定收件人后，你可以把 mailable 类的实例传给 `send` 方法：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Mail\OrderShipped;
    use App\Models\Order;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Mail;

    class OrderShipmentController extends Controller
    {
        /**
         * 发出给定的订单。
         */
        public function store(Request $request): RedirectResponse
        {
            $order = Order::findOrFail($request->order_id);

            // 发出订单...

            Mail::to($request->user())->send(new OrderShipped($order));

            return redirect('/orders');
        }
    }

发送消息时，你并不局限于只指定"to"收件人。你可以通过链式调用相应的方法自由地设置 "to"、"cc" 与 "bcc" 收件人：

    Mail::to($request->user())
        ->cc($moreUsers)
        ->bcc($evenMoreUsers)
        ->send(new OrderShipped($order));

<a name="looping-over-recipients"></a>
#### 遍历收件人

有时你可能需要通过遍历收件人/邮箱地址数组，把 mailable 发送给一组收件人。不过，由于 `to` 方法会把邮箱地址追加到 mailable 的收件人列表中，循环中的每次迭代都会向之前所有的收件人再发送一封邮件。因此，你应当为每个收件人重新创建 mailable 实例：

    foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
        Mail::to($recipient)->send(new OrderShipped($order));
    }

<a name="sending-mail-via-a-specific-mailer"></a>
#### 通过特定邮件器发送邮件

默认情况下，Laravel 会使用应用 `mail` 配置文件中配置为 `default` 的邮件器发送邮件。不过，你可以使用 `mailer` 方法通过特定的邮件器配置来发送消息：

    Mail::mailer('postmark')
        ->to($request->user())
        ->send(new OrderShipped($order));

<a name="queueing-mail"></a>
### 邮件入队

<a name="queueing-a-mail-message"></a>
#### 把邮件消息放入队列

由于发送邮件消息可能对应用的响应时间产生负面影响，许多开发者选择把邮件消息放入队列以便在后台发送。Laravel 通过内置的[统一队列 API](/docs/{{version}}/queues)让这件事变得简单。要把邮件消息放入队列，请在指定消息收件人后使用 `Mail` Facade 上的 `queue` 方法：

    Mail::to($request->user())
        ->cc($moreUsers)
        ->bcc($evenMoreUsers)
        ->queue(new OrderShipped($order));

该方法会自动把一个任务推入队列，以便在后台发送消息。使用该特性之前，你需要先[配置队列](/docs/{{version}}/queues)。

<a name="delayed-message-queueing"></a>
#### 延迟消息入队

如果你想延迟投递已入队的邮件消息，可以使用 `later` 方法。`later` 方法的第一个参数接受一个 `DateTime` 实例，用于指示消息应当何时发送：

    Mail::to($request->user())
        ->cc($moreUsers)
        ->bcc($evenMoreUsers)
        ->later(now()->addMinutes(10), new OrderShipped($order));

<a name="pushing-to-specific-queues"></a>
#### 推入特定队列

由于所有使用 `make:mail` 命令生成的 mailable 类都使用了 `Illuminate\Bus\Queueable` Trait，你可以在任意 mailable 类实例上调用 `onQueue` 与 `onConnection` 方法，从而为该消息指定连接与队列名称：

    $message = (new OrderShipped($order))
        ->onConnection('sqs')
        ->onQueue('emails');

    Mail::to($request->user())
        ->cc($moreUsers)
        ->bcc($evenMoreUsers)
        ->queue($message);

<a name="queueing-by-default"></a>
#### 默认入队

如果你希望某些 mailable 类始终入队，可以在类上实现 `ShouldQueue` 契约。这样，即使你调用 `send` 方法来发邮件，该 mailable 仍会入队，因为它实现了该契约：

    use Illuminate\Contracts\Queue\ShouldQueue;

    class OrderShipped extends Mailable implements ShouldQueue
    {
        // ...
    }

<a name="queued-mailables-and-database-transactions"></a>
#### 入队的 Mailable 与数据库事务

在数据库事务中分发入队的 mailable 时，队列可能在数据库事务提交之前就处理它们。发生这种情况时，你在数据库事务中对模型或数据库记录所做的更新可能尚未反映到数据库中。此外，在事务中创建的模型或数据库记录也可能还不存在于数据库中。如果你的 mailable 依赖这些模型，那么在处理发送该入队 mailable 的任务时就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项被设为 `false`，你仍然可以在发送邮件消息时调用 `afterCommit` 方法，以指明某个特定的入队 mailable 应当在所有打开的数据库事务提交之后再分发：

    Mail::to($request->user())->send(
        (new OrderShipped($order))->afterCommit()
    );

或者，你可以在 mailable 的构造函数中调用 `afterCommit` 方法：

    <?php

    namespace App\Mail;

    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Mail\Mailable;
    use Illuminate\Queue\SerializesModels;

    class OrderShipped extends Mailable implements ShouldQueue
    {
        use Queueable, SerializesModels;

        /**
         * 创建一个新的消息实例。
         */
        public function __construct()
        {
            $this->afterCommit();
        }
    }

> [!NOTE]
> 若想了解更多如何规避这些问题，请查阅关于[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="rendering-mailables"></a>
## 渲染 Mailable 类

有时你可能想在不实际发送的情况下获取某个 mailable 的 HTML 内容。为此，你可以调用该 mailable 的 `render` 方法。该方法会把 mailable 求值后的 HTML 内容以字符串形式返回：

    use App\Mail\InvoicePaid;
    use App\Models\Invoice;

    $invoice = Invoice::find(1);

    return (new InvoicePaid($invoice))->render();

<a name="previewing-mailables-in-the-browser"></a>
### 在浏览器中预览 Mailable 类

在设计 mailable 模板时，像预览普通 Blade 模板那样快速在浏览器中预览渲染后的 mailable 会非常方便。为此，Laravel 允许你直接从路由闭包或控制器返回任意 mailable。返回 mailable 时，它会被渲染并显示在浏览器中，让你无需真正发送到某个邮箱地址就能快速预览其设计：

    Route::get('/mailable', function () {
        $invoice = App\Models\Invoice::find(1);

        return new App\Mail\InvoicePaid($invoice);
    });

<a name="localizing-mailables"></a>
## 本地化 Mailable 类

Laravel 允许你以请求当前区域设置之外的区域设置发送 mailable，即使邮件入队，它也会记住该区域设置。

为此，`Mail` Facade 提供了 `locale` 方法来设置期望的语言。在 mailable 模板求值期间，应用会切换到该区域设置，求值完成后再切回之前的区域设置：

    Mail::to($request->user())->locale('es')->send(
        new OrderShipped($order)
    );

<a name="user-preferred-locales"></a>
### 用户首选区域设置

有时，应用会存储每个用户首选的区域设置。通过在一个或多个模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送邮件时使用该已存储的区域设置：

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

实现该接口后，Laravel 会在向该模型发送 mailable 与通知时自动使用首选的区域设置。因此，使用该接口时无需调用 `locale` 方法：

    Mail::to($request->user())->send(new OrderShipped($order));

<a name="testing-mailables"></a>
## 测试

<a name="testing-mailable-content"></a>
### 测试 Mailable 内容

Laravel 提供了多种用于检查 mailable 结构的方法。此外，Laravel 还提供了若干便捷方法，用于测试 mailable 是否包含你预期的内容。这些方法包括：`assertSeeInHtml`、`assertDontSeeInHtml`、`assertSeeInOrderInHtml`、`assertSeeInText`、`assertDontSeeInText`、`assertSeeInOrderInText`、`assertHasAttachment`、`assertHasAttachedData`、`assertHasAttachmentFromStorage` 与 `assertHasAttachmentFromStorageDisk`。

你可能已经猜到，"HTML"断言用于断言 mailable 的 HTML 版本包含给定字符串，而"text"断言用于断言 mailable 的纯文本版本包含给定字符串：

```php tab=Pest
use App\Mail\InvoicePaid;
use App\Models\User;

test('mailable content', function () {
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertHasCc('abigail@example.com');
    $mailable->assertHasBcc('victoria@example.com');
    $mailable->assertHasReplyTo('tyler@example.com');
    $mailable->assertHasSubject('Invoice Paid');
    $mailable->assertHasTag('example-tag');
    $mailable->assertHasMetadata('key', 'value');

    $mailable->assertSeeInHtml($user->email);
    $mailable->assertSeeInHtml('Invoice Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
});
```

```php tab=PHPUnit
use App\Mail\InvoicePaid;
use App\Models\User;

public function test_mailable_content(): void
{
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertHasCc('abigail@example.com');
    $mailable->assertHasBcc('victoria@example.com');
    $mailable->assertHasReplyTo('tyler@example.com');
    $mailable->assertHasSubject('Invoice Paid');
    $mailable->assertHasTag('example-tag');
    $mailable->assertHasMetadata('key', 'value');

    $mailable->assertSeeInHtml($user->email);
    $mailable->assertSeeInHtml('Invoice Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
}
```

<a name="testing-mailable-sending"></a>
### 测试 Mailable 发送

我们建议把 mailable 内容的测试与断言某个 mailable 已"发送"给特定用户的测试分开。通常，mailable 的内容与你正在测试的代码无关，只要断言 Laravel 已被指示发送某个 mailable 就足够了。

你可以使用 `Mail` Facade 的 `fake` 方法阻止邮件实际发送。调用 `Mail` Facade 的 `fake` 方法后，就可以断言 mailable 已被指示发送给用户，甚至可以检查 mailable 收到的数据：

```php tab=Pest
<?php

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

test('orders can be shipped', function () {
    Mail::fake();

    // Perform order shipping...

    // Assert that no mailables were sent...
    Mail::assertNothingSent();

    // Assert that a mailable was sent...
    Mail::assertSent(OrderShipped::class);

    // Assert a mailable was sent twice...
    Mail::assertSent(OrderShipped::class, 2);

    // Assert a mailable was sent to an email address...
    Mail::assertSent(OrderShipped::class, 'example@laravel.com');

    // Assert a mailable was sent to multiple email addresses...
    Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

    // Assert a mailable was not sent...
    Mail::assertNotSent(AnotherMailable::class);

    // Assert 3 total mailables were sent...
    Mail::assertSentCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Mail::fake();

        // Perform order shipping...

        // Assert that no mailables were sent...
        Mail::assertNothingSent();

        // Assert that a mailable was sent...
        Mail::assertSent(OrderShipped::class);

        // Assert a mailable was sent twice...
        Mail::assertSent(OrderShipped::class, 2);

        // Assert a mailable was sent to an email address...
        Mail::assertSent(OrderShipped::class, 'example@laravel.com');

        // Assert a mailable was sent to multiple email addresses...
        Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

        // Assert a mailable was not sent...
        Mail::assertNotSent(AnotherMailable::class);

        // Assert 3 total mailables were sent...
        Mail::assertSentCount(3);
    }
}
```

如果你把 mailable 放入队列以便在后台投递，应当使用 `assertQueued` 方法而不是 `assertSent`：

    Mail::assertQueued(OrderShipped::class);
    Mail::assertNotQueued(OrderShipped::class);
    Mail::assertNothingQueued();
    Mail::assertQueuedCount(3);

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传入一个闭包，用来断言某个满足给定"真值测试"的 mailable 已被发送。如果至少有一个满足该真值测试的 mailable 被发送，断言就会成功：

    Mail::assertSent(function (OrderShipped $mail) use ($order) {
        return $mail->order->id === $order->id;
    });

调用 `Mail` Facade 的断言方法时，所提供闭包接受的 mailable 实例暴露了多种便于检查 mailable 的方法：

    Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($user) {
        return $mail->hasTo($user->email) &&
               $mail->hasCc('...') &&
               $mail->hasBcc('...') &&
               $mail->hasReplyTo('...') &&
               $mail->hasFrom('...') &&
               $mail->hasSubject('...');
    });

该 mailable 实例还包含多种便于检查 mailable 上附件的方法：

    use Illuminate\Mail\Mailables\Attachment;

    Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
        return $mail->hasAttachment(
            Attachment::fromPath('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf')
        );
    });

    Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
        return $mail->hasAttachment(
            Attachment::fromStorageDisk('s3', '/path/to/file')
        );
    });

    Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($pdfData) {
        return $mail->hasAttachment(
            Attachment::fromData(fn () => $pdfData, 'name.pdf')
        );
    });

你可能已经注意到，断言邮件未被发送的方法有两个：`assertNotSent` 与 `assertNotQueued`。有时你可能想断言既未发送**也**未入队。为此，可以使用 `assertNothingOutgoing` 与 `assertNotOutgoing` 方法：

    Mail::assertNothingOutgoing();

    Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
        return $mail->order->id === $order->id;
    });

<a name="mail-and-local-development"></a>
## 邮件与本地开发

在开发一个发送邮件的应用时，你多半不希望真的把邮件发到真实邮箱地址。Laravel 提供了多种方式，在本地开发期间"禁用"邮件的实际发送。

<a name="log-driver"></a>
#### Log 驱动

`log` 邮件驱动不会真正发送邮件，而是把所有邮件消息写入日志文件供你查看。通常该驱动只会在本地开发期间使用。有关按环境配置应用的更多信息，请查看[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="mailtrap"></a>
#### HELO / Mailtrap / Mailpit

或者，你可以使用 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 之类的服务配合 `smtp` 驱动，把邮件消息发送到一个"虚拟"邮箱，从而在真实的邮件客户端中查看它们。这种方式的好处是，你可以在 Mailtrap 的消息查看器中真正检查最终生成的邮件。

如果你在使用 [Laravel Sail](/docs/{{version}}/sail)，可以使用 [Mailpit](https://github.com/axllent/mailpit) 预览消息。Sail 运行时，你可以通过 `http://localhost:8025` 访问 Mailpit 界面。

<a name="using-a-global-to-address"></a>
#### 使用全局 `to` 地址

最后，你可以调用 `Mail` Facade 提供的 `alwaysTo` 方法来指定一个全局的"to"地址。通常应在应用某个服务提供者的 `boot` 方法中调用该方法：

    use Illuminate\Support\Facades\Mail;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        if ($this->app->environment('local')) {
            Mail::alwaysTo('taylor@example.com');
        }
    }

<a name="events"></a>
## 事件

Laravel 在发送邮件消息时会分发两个事件。`MessageSending` 事件在消息发送之前分发，而 `MessageSent` 事件在消息发送之后分发。请记住，这些事件是在邮件实际*发送*时分发的，而不是在邮件入队时分发的。你可以在应用中为这些事件创建[事件监听器](/docs/{{version}}/events)：

    use Illuminate\Mail\Events\MessageSending;
    // use Illuminate\Mail\Events\MessageSent;

    class LogMessage
    {
        /**
         * 处理给定的事件。
         */
        public function handle(MessageSending $event): void
        {
            // ...
        }
    }

<a name="custom-transports"></a>
## 自定义传输

Laravel 内置了多种邮件传输；不过，你可能想编写自己的传输，以便通过 Laravel 开箱即不支持的其他服务投递邮件。要开始，请定义一个继承 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在你的传输上实现 `doSend` 与 `__toString()` 方法：

    use MailchimpTransactional\ApiClient;
    use Symfony\Component\Mailer\SentMessage;
    use Symfony\Component\Mailer\Transport\AbstractTransport;
    use Symfony\Component\Mime\Address;
    use Symfony\Component\Mime\MessageConverter;

    class MailchimpTransport extends AbstractTransport
    {
        /**
         * 创建一个新的 Mailchimp 传输实例。
         */
        public function __construct(
            protected ApiClient $client,
        ) {
            parent::__construct();
        }

        /**
         * {@inheritDoc}
         */
        protected function doSend(SentMessage $message): void
        {
            $email = MessageConverter::toEmail($message->getOriginalMessage());

            $this->client->messages->send(['message' => [
                'from_email' => $email->getFrom(),
                'to' => collect($email->getTo())->map(function (Address $email) {
                    return ['email' => $email->getAddress(), 'type' => 'to'];
                })->all(),
                'subject' => $email->getSubject(),
                'text' => $email->getTextBody(),
            ]]);
        }

        /**
         * 获取该传输的字符串表示形式。
         */
        public function __toString(): string
        {
            return 'mailchimp';
        }
    }

定义好自定义传输后，你可以通过 `Mail` Facade 提供的 `extend` 方法注册它。通常应在应用 `AppServiceProvider` 服务提供者的 `boot` 方法中完成这一步。传给 `extend` 方法的闭包会收到一个 `$config` 参数，该参数包含应用 `config/mail.php` 配置文件中为该邮件器定义的配置数组：

    use App\Mail\MailchimpTransport;
    use Illuminate\Support\Facades\Mail;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Mail::extend('mailchimp', function (array $config = []) {
            return new MailchimpTransport(/* ... */);
        });
    }

定义并注册好自定义传输后，你可以在应用的 `config/mail.php` 配置文件中创建一个使用该新传输的邮件器定义：

    'mailchimp' => [
        'transport' => 'mailchimp',
        // ...
    ],

<a name="additional-symfony-transports"></a>
### 其他 Symfony 传输

Laravel 支持一些现有的、由 Symfony 维护的邮件传输，例如 Mailgun 与 Postmark。不过，你可能想为 Laravel 扩展对更多 Symfony 维护的传输的支持。为此，你可以通过 Composer 引入所需的 Symfony mailer，并把该传输注册到 Laravel。例如，你可以安装并注册 "Brevo"（原 "Sendinblue"）Symfony mailer：

```none
composer require symfony/brevo-mailer symfony/http-client
```

Brevo mailer 软件包安装完成后，你可以在应用的 `services` 配置文件中添加一项 Brevo API 凭据：

    'brevo' => [
        'key' => 'your-api-key',
    ],

接下来，你可以使用 `Mail` Facade 的 `extend` 方法把该传输注册到 Laravel。通常应在某个服务提供者的 `boot` 方法中完成这一步：

    use Illuminate\Support\Facades\Mail;
    use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
    use Symfony\Component\Mailer\Transport\Dsn;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Mail::extend('brevo', function () {
            return (new BrevoTransportFactory)->create(
                new Dsn(
                    'brevo+api',
                    'default',
                    config('services.brevo.key')
                )
            );
        });
    }

注册好传输后，你可以在应用的 config/mail.php 配置文件中创建一个使用该新传输的邮件器定义：

    'brevo' => [
        'transport' => 'brevo',
        // ...
    ],
