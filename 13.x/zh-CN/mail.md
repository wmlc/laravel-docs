# 邮件

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动先决条件](#driver-prerequisites)
    - [故障转移配置](#failover-configuration)
    - [轮询配置](#round-robin-configuration)
- [生成 Mailable](#generating-mailables)
- [编写 Mailable](#writing-mailables)
    - [配置发件人](#configuring-the-sender)
    - [配置视图](#configuring-the-view)
    - [视图数据](#view-data)
    - [附件](#attachments)
    - [内联附件](#inline-attachments)
    - [可附加对象](#attachable-objects)
    - [请求头](#headers)
    - [标签与元数据](#tags-and-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
- [Markdown Mailable](#markdown-mailables)
    - [生成 Markdown Mailable](#generating-markdown-mailables)
    - [编写 Markdown 消息](#writing-markdown-messages)
    - [自定义组件](#customizing-the-components)
- [发送邮件](#sending-mail)
    - [邮件队列](#queueing-mail)
- [渲染 Mailable](#rendering-mailables)
    - [在浏览器中预览 Mailable](#previewing-mailables-in-the-browser)
- [本地化 Mailable](#localizing-mailables)
- [测试](#testing-mailables)
    - [测试 Mailable 内容](#testing-mailable-content)
    - [测试 Mailable 发送](#testing-mailable-sending)
- [邮件与本地开发](#mail-and-local-development)
- [事件](#events)
- [自定义传输](#custom-transports)
    - [其他 Symfony 传输](#additional-symfony-transports)

<a name="introduction"></a>
## 简介

发送电子邮件不必复杂。Laravel 提供了一套简洁、简单的邮件 API，由流行的 [Symfony Mailer](https://symfony.com/doc/current/mailer.html) 组件驱动。Laravel 和 Symfony Mailer 提供了通过 SMTP、Cloudflare、Mailgun、Postmark、Resend、Amazon SES 和 `sendmail` 发送邮件的驱动，使你可以快速开始通过本地或云服务发送邮件。

<a name="configuration"></a>
### 配置

Laravel 的邮件服务可以通过应用的 `config/mail.php` 配置文件进行配置。该文件中配置的每个邮件器都可以有自己独特的配置，甚至可以有自己独特的"transport"，允许你的应用使用不同的邮件服务发送特定邮件消息。例如，你的应用可以使用 Postmark 发送事务性邮件，同时使用 Amazon SES 发送批量邮件。

在你的 `mail` 配置文件中，你会找到一个 `mailers` 配置数组。该数组包含 Laravel 支持的每个主要邮件驱动 / 传输的示例配置条目，而 `default` 配置值决定应用需要发送邮件消息时默认使用哪个邮件器。

<a name="driver-prerequisites"></a>
### 驱动 / 传输先决条件

Mailgun、Postmark 和 Resend 等基于 API 的驱动通常比通过 SMTP 服务器发送邮件更简单、更快。只要有可能，我们建议你使用这些驱动之一。

<a name="cloudflare-driver"></a>
#### Cloudflare 驱动

要使用 Cloudflare 驱动，请通过 Composer 安装 Symfony 的 HTTP Client：

```shell
composer require symfony/http-client
```

接下来，你需要在应用 `config/mail.php` 配置文件中进行两处更改。首先，将默认邮件器设置为 `cloudflare`：

```php
'default' => env('MAIL_MAILER', 'cloudflare'),
```

其次，将以下配置数组添加到你的 `mailers` 数组中：

```php
'cloudflare' => [
    'transport' => 'cloudflare',
],
```

配置应用默认邮件器后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'cloudflare' => [
    'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
    'key' => env('CLOUDFLARE_KEY'),
],
```

<a name="mailgun-driver"></a>
#### Mailgun 驱动

要使用 Mailgun 驱动，请通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，你需要在应用 `config/mail.php` 配置文件中进行两处更改。首先，将默认邮件器设置为 `mailgun`：

```php
'default' => env('MAIL_MAILER', 'mailgun'),
```

其次，将以下配置数组添加到你的 `mailers` 数组中：

```php
'mailgun' => [
    'transport' => 'mailgun',
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

配置应用默认邮件器后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
],
```

如果你不使用美国 [Mailgun 区域](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview#mailgun-regions)，可以在 `services` 配置文件中定义你所在区域的端点：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
    'scheme' => 'https',
],
```

<a name="postmark-driver"></a>
#### Postmark 驱动

要使用 [Postmark](https://postmarkapp.com/) 驱动，请通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，将应用 `config/mail.php` 配置文件中的 `default` 选项设置为 `postmark`。配置应用默认邮件器后，确保 `config/services.php` 配置文件包含以下选项：

```php
'postmark' => [
    'key' => env('POSTMARK_API_KEY'),
],
```

如果你想指定给定邮件器应使用的 Postmark 消息流，可以将 `message_stream_id` 配置选项添加到邮件器的配置数组中。该配置数组可以在应用 `config/mail.php` 配置文件中找到：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

这样，你还可以设置多个使用不同消息流的 Postmark 邮件器。

<a name="resend-driver"></a>
#### Resend 驱动

要使用 [Resend](https://resend.com/) 驱动，请通过 Composer 安装 Resend 的 PHP SDK：

```shell
composer require resend/resend-php
```

接下来，将应用 `config/mail.php` 配置文件中的 `default` 选项设置为 `resend`。配置应用默认邮件器后，确保 `config/services.php` 配置文件包含以下选项：

```php
'resend' => [
    'key' => env('RESEND_API_KEY'),
],
```

<a name="ses-driver"></a>
#### SES 驱动

要使用 Amazon SES 驱动，你必须首先安装适用于 PHP 的 Amazon AWS SDK。你可以通过 Composer 包管理器安装此库：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `config/mail.php` 配置文件中的 `default` 选项设置为 `ses`，并验证 `config/services.php` 配置文件包含以下选项：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
],
```

要通过会话令牌利用 AWS [临时凭据](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，可以向应用的 SES 配置添加一个 `token` 键：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

要与 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)交互，你可以在邮件消息 [headers](#headers) 方法返回的数组中返回 `X-Ses-List-Management-Options` 请求头：

```php
/**
 * Get the message headers.
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

要通过 SES [租户](https://docs.aws.amazon.com/ses/latest/dg/tenants.html)发送邮件，你可以从 `headers` 方法返回 `X-Ses-Tenant-Name` 请求头。Laravel 会在发送消息时将请求头值作为 `TenantName` 选项传递给 SES：

```php
public function headers(): Headers
{
    return new Headers(
        text: [
            'X-Ses-Tenant-Name' => 'tenant-id',
        ],
    );
}
```

如果你想定义 Laravel 在发送邮件时应传递给 AWS SDK `SendEmail` 方法的[附加选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，可以在 `ses` 配置中定义一个 `options` 数组：

```php
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
```

<a name="failover-configuration"></a>
### 故障转移配置

有时，你配置的用于发送应用邮件的外部服务可能会宕机。在这些情况下，定义在主要投递驱动宕机时使用的一个或多个备用邮件投递配置可能会很有用。

为此，你应在应用的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件器。应用 `failover` 邮件器的配置数组应包含一个 `mailers` 数组，该数组引用应选择用于投递的已配置邮件器的顺序：

```php
'mailers' => [
    'failover' => [
        'transport' => 'failover',
        'mailers' => [
            'postmark',
            'mailgun',
            'sendmail',
        ],
        'retry_after' => 60,
    ],

    // ...
],
```

配置好使用 `failover` 传输的邮件器后，你需要将故障转移邮件器设置为应用 `.env` 文件中的默认邮件器，以利用故障转移功能：

```ini
MAIL_MAILER=failover
```

<a name="round-robin-configuration"></a>
### 轮询配置

`roundrobin` 传输允许你在多个邮件器之间分配邮件发送工作负载。要开始，请在应用 `mail` 配置文件中定义一个使用 `roundrobin` 传输的邮件器。应用 `roundrobin` 邮件器的配置数组应包含一个 `mailers` 数组，该数组引用应使用哪些已配置邮件器进行投递：

```php
'mailers' => [
    'roundrobin' => [
        'transport' => 'roundrobin',
        'mailers' => [
            'ses',
            'postmark',
        ],
        'retry_after' => 60,
    ],

    // ...
],
```

定义好轮询邮件器后，你应将此邮件器设置为应用使用的默认邮件器，方法是在应用 `mail` 配置文件中将其名称指定为 `default` 配置键的值：

```php
'default' => env('MAIL_MAILER', 'roundrobin'),
```

轮询传输会从已配置的邮件器列表中选择一个随机邮件器，然后为每个后续邮件切换到下一个可用的邮件器。与有助于实现*[高可用性](https://en.wikipedia.org/wiki/High_availability)*的 `failover` 传输相比，`roundrobin` 传输提供的是*[负载均衡](https://en.wikipedia.org/wiki/Load_balancing_(computing))*。

<a name="generating-mailables"></a>
## 生成 Mailable

构建 Laravel 应用时，应用发送的每种类型的电子邮件都表示为一个"mailable"类。这些类存储在 `app/Mail` 目录中。如果你在应用中看不到此目录，请不要担心，因为当你使用 `make:mail` Artisan 命令创建第一个 mailable 类时，它会自动生成：

```shell
php artisan make:mail OrderShipped
```

<a name="writing-mailables"></a>
## 编写 Mailable

生成 mailable 类后，打开它以便我们探索其内容。Mailable 类配置在几个方法中完成，包括 `envelope`、`content` 和 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，该对象定义主题，有时还定义消息的收件人。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，该对象定义用于生成消息内容的 [Blade 模板](/docs/{{version}}/blade)。

<a name="configuring-the-sender"></a>
### 配置发件人

<a name="using-the-envelope"></a>
#### 使用 Envelope

首先，让我们探索配置电子邮件的发件人。换句话说，电子邮件将要"来自"谁。有两种方法可以配置发件人。首先，你可以在消息的 envelope 上指定 "from" 地址：

```php
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Get the message envelope.
 */
public function envelope(): Envelope
{
    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        subject: 'Order Shipped',
    );
}
```

如果你愿意，还可以指定一个 `replyTo` 地址：

```php
return new Envelope(
    from: new Address('jeffrey@example.com', 'Jeffrey Way'),
    replyTo: [
        new Address('taylor@example.com', 'Taylor Otwell'),
    ],
    subject: 'Order Shipped',
);
```

<a name="using-a-global-from-address"></a>
#### 使用全局 `from` 地址

但是，如果你的应用为其所有电子邮件使用相同的 "from" 地址，为你生成的每个 mailable 类都添加它可能会变得繁琐。相反，你可以在 `config/mail.php` 配置文件中指定一个全局 "from" 地址。当 mailable 类中未指定其他 "from" 地址时，将使用此地址：

```php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

此外，你可以在 `config/mail.php` 配置文件中定义一个全局 "reply_to" 地址：

```php
'reply_to' => [
    'address' => 'example@example.com',
    'name' => 'App Name',
],
```

<a name="configuring-the-view"></a>
### 配置视图

在 mailable 类的 `content` 方法中，你可以定义 `view`，或渲染电子邮件内容时应使用的模板。由于每封电子邮件通常使用 [Blade 模板](/docs/{{version}}/blade)渲染其内容，因此在构建邮件的 HTML 时，你可以获得 Blade 模板引擎的全部功能和便利性：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
    );
}
```

> [!NOTE]
> 你可能希望创建一个 `resources/views/mail` 目录来存放所有邮件模板；不过，你可以自由地将它们放在 `resources/views` 目录中的任何位置。

<a name="plain-text-emails"></a>
#### 纯文本电子邮件

如果你想定义邮件的纯文本版本，可以在创建消息的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数应是一个模板名称，用于渲染邮件内容。你可以自由定义消息的 HTML 和纯文本版本：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
        text: 'mail.orders.shipped-text'
    );
}
```

为清晰起见，`html` 参数可以用作 `view` 参数的别名：

```php
return new Content(
    html: 'mail.orders.shipped',
    text: 'mail.orders.shipped-text'
);
```

<a name="view-data"></a>
### 视图数据

<a name="via-public-properties"></a>
#### 通过公共属性

通常，你会希望向视图传递一些数据，以便在渲染邮件的 HTML 时使用。有两种方法可以使数据可用于视图。首先，mailable 类上定义的任何公共属性都将自动提供给视图。因此，例如，你可以将数据传递到 mailable 类的构造函数，并将该数据设置为类上定义的公共属性：

```php
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
     * Create a new message instance.
     */
    public function __construct(
        public Order $order,
    ) {}

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
        );
    }
}
```

数据被设置为公共属性后，它将自动在你的视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

```blade
<div>
    Price: {{ $order->price }}
</div>
```

<a name="via-the-with-parameter"></a>
#### 通过 `with` 参数：

如果你想在数据发送到模板之前自定义邮件数据的格式，可以通过 `Content` 定义的 `with` 参数手动将数据传递给视图。通常，你仍会通过 mailable 类的构造函数传递数据；但是，你应将这些数据设置为 `protected` 或 `private` 属性，以免数据自动提供给模板：

```php
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
     * Create a new message instance.
     */
    public function __construct(
        protected Order $order,
    ) {}

    /**
     * Get the message content definition.
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
```

数据通过 `with` 参数传递后，它将自动在你的视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

```blade
<div>
    Price: {{ $orderPrice }}
</div>
```

<a name="attachments"></a>
### 附件

要向电子邮件添加附件，你需要将附件添加到消息 `attachments` 方法返回的数组中。首先，你可以通过向 `Attachment` 类提供的 `fromPath` 方法提供文件路径来添加附件：

```php
use Illuminate\Mail\Mailables\Attachment;

/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromPath('/path/to/file'),
    ];
}
```

向消息附加文件时，你还可以使用 `as` 和 `withMime` 方法指定附件的显示名称和 / 或 MIME 类型：

```php
/**
 * Get the attachments for the message.
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
```

<a name="attaching-files-from-disk"></a>
#### 从磁盘附加文件

如果你已将文件存储在你的某个[文件系统磁盘](/docs/{{version}}/filesystem)上，可以使用 `fromStorage` 附件方法将其附加到电子邮件中：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

当然，你也可以指定附件的名称和 MIME 类型：

```php
/**
 * Get the attachments for the message.
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
```

如果需要指定默认磁盘以外的存储磁盘，可以使用 `fromStorageDisk` 方法：

```php
/**
 * Get the attachments for the message.
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
```

<a name="raw-data-attachments"></a>
#### 原始数据附件

`fromData` 附件方法可用于将原始字节字符串作为附件附加。例如，如果你在内存中生成了 PDF 并希望将其附加到电子邮件而不写入磁盘，则可以使用此方法。`fromData` 方法接受一个解析原始数据字节的闭包，以及应分配给附件的名称：

```php
/**
 * Get the attachments for the message.
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
```

<a name="inline-attachments"></a>
### 内联附件

将内联图片嵌入到电子邮件中通常很麻烦；不过，Laravel 提供了一种便捷的方式将图片附加到邮件中。要嵌入内联图片，请在邮件模板中对 `$message` 变量使用 `embed` 方法。Laravel 会自动使 `$message` 变量可用于所有邮件模板，因此你无需担心手动传入它：

```blade
<body>
    Here is an image:

    <img src="{{ $message->embed($pathToImage) }}">
</body>
```

> [!WARNING]
> `$message` 变量在纯文本消息模板中不可用，因为纯文本消息不使用内联附件。

<a name="embedding-raw-data-attachments"></a>
#### 嵌入原始数据附件

如果你已有希望嵌入邮件模板的原始图片数据字符串，可以对 `$message` 变量调用 `embedData` 方法。调用 `embedData` 方法时，你需要提供应分配给嵌入图片的文件名：

```blade
<body>
    Here is an image from raw data:

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

<a name="attachable-objects"></a>
### 可附加对象

虽然通过简单字符串路径向消息附加文件通常就足够了，但在许多情况下，应用中可附加的实体由类表示。例如，如果你的应用正在向消息附加照片，你的应用可能还有一个表示该照片的 `Photo` 模型。在这种情况下，简单地将 `Photo` 模型传递给 `attach` 方法不是很方便吗？可附加对象允许你做到这一点。

要开始，请在将可附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。该接口规定你的类定义一个返回 `Illuminate\Mail\Attachment` 实例的 `toMailAttachment` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Mail\Attachable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Attachment;

class Photo extends Model implements Attachable
{
    /**
     * Get the attachable representation of the model.
     */
    public function toMailAttachment(): Attachment
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义好可附加对象后，你可以在构建电子邮件消息时从 `attachments` 方法返回该对象的实例：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [$this->photo];
}
```

当然，附件数据可以存储在 Amazon S3 等远程文件存储服务上。因此，Laravel 还允许你从存储在你应用某个[文件系统磁盘](/docs/{{version}}/filesystem)上的数据生成附件实例：

```php
// Create an attachment from a file on your default disk...
return Attachment::fromStorage($this->path);

// Create an attachment from a file on a specific disk...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，你可以通过在内存中拥有的数据创建附件实例。为此，请向 `fromData` 方法提供闭包。该闭包应返回表示附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了其他方法，你可以使用它们自定义附件。例如，你可以使用 `as` 和 `withMime` 方法自定义文件的名称和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
    ->as('Photo Name')
    ->withMime('image/jpeg');
```

<a name="headers"></a>
### 请求头

有时你可能需要向出站消息附加额外的请求头。例如，你可能需要设置自定义的 `Message-Id` 或其他任意文本请求头。

为此，请在 mailable 上定义一个 `headers` 方法。`headers` 方法应返回一个 `Illuminate\Mail\Mailables\Headers` 实例。该类接受 `messageId`、`references` 和 `text` 参数。当然，你只需提供特定消息所需的参数：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * Get the message headers.
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
```

<a name="tags-and-metadata"></a>
### 标签与元数据

Mailgun 和 Postmark 等一些第三方邮件提供商支持消息"标签"和"元数据"，可用于分组和跟踪应用发送的邮件。你可以通过 `Envelope` 定义向电子邮件消息添加标签和元数据：

```php
use Illuminate\Mail\Mailables\Envelope;

/**
 * Get the message envelope.
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
```

如果你的应用使用 Mailgun 驱动，你可以查阅 Mailgun 文档，了解更多关于[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的信息。同样，也可以查阅 Postmark 文档，了解他们对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的支持。

如果你的应用使用 Amazon SES 发送邮件，则应使用 `metadata` 方法将 [SES "标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息上。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

Laravel 的邮件功能由 Symfony Mailer 驱动。Laravel 允许你注册自定义回调，这些回调将在发送消息前使用 Symfony Message 实例调用。这使你有机会在消息发送前深度自定义它。为此，请在 `Envelope` 定义中定义一个 `using` 参数：

```php
use Illuminate\Mail\Mailables\Envelope;
use Symfony\Component\Mime\Email;

/**
 * Get the message envelope.
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
```

<a name="markdown-mailables"></a>
## Markdown Mailable

Markdown mailable 消息允许你在 mailable 中利用[邮件通知](/docs/{{version}}/notifications#mail-notifications)的预构建模板和组件。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染美观、响应式的 HTML 模板，同时自动生成纯文本对应版本。

<a name="generating-markdown-mailables"></a>
### 生成 Markdown Mailable

要生成带有相应 Markdown 模板的 mailable，可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在其 `content` 方法中配置 mailable `Content` 定义时，使用 `markdown` 参数而不是 `view` 参数：

```php
use Illuminate\Mail\Mailables\Content;

/**
 * Get the message content definition.
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
```

<a name="writing-markdown-messages"></a>
### 编写 Markdown 消息

Markdown mailable 使用 Blade 组件和 Markdown 语法的组合，让你可以轻松构建邮件消息，同时利用 Laravel 预构建的邮件 UI 组件：

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
> 编写 Markdown 邮件时不要使用过多的缩进。按照 Markdown 标准，Markdown 解析器会将缩进的内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中的按钮链接。该组件接受两个参数：`url` 和可选的 `color`。支持的颜色为 `primary`、`success` 和 `error`。你可以根据需要向消息添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="success">
View Order
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件在具有与消息其余部分略有不同背景颜色的面板中渲染给定的文本块。这使你可以将注意力吸引到给定的文本块上：

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

你可以将所有的 Markdown 邮件组件导出到你自己的应用中以便自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录都包含每个可用组件的相应表示形式。你可以随心所欲地自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动转换为 Markdown 邮件消息 HTML 表示形式中的内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存 CSS 文件后，更新应用 `config/mail.php` 配置文件中的 `theme` 选项，使其与新主题名称匹配。

要为单个 mailable 自定义主题，你可以将 mailable 类的 `$theme` 属性设置为发送该 mailable 时应使用的主题名称。

<a name="sending-mail"></a>
## 发送邮件

要发送消息，请使用 `Mail` [Facade](/docs/{{version}}/facades) 上的 `to` 方法。`to` 方法接受电子邮件地址、用户实例或用户集合。如果你传递一个对象或对象集合，邮件器在确定邮件收件人时将自动使用它们的 `email` 和 `name` 属性，因此请确保这些属性在你的对象上可用。指定收件人后，你可以将 mailable 类的实例传递给 `send` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Mail\OrderShipped;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderShipmentController extends Controller
{
    /**
     * Ship the given order.
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // Ship the order...

        Mail::to($request->user())->send(new OrderShipped($order));

        return redirect('/orders');
    }
}
```

发送消息时，你不限于只指定"to"收件人。你可以通过链式调用相应的方法来设置"to"、"cc"和"bcc"收件人：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

<a name="looping-over-recipients"></a>
#### 遍历收件人

偶尔，你可能需要通过遍历收件人 / 电子邮件地址数组，向收件人列表发送 mailable。但是，由于 `to` 方法将电子邮件地址追加到 mailable 的收件人列表中，每次循环迭代都会向之前的所有收件人再发送一封邮件。因此，你应始终为每个收件人重新创建 mailable 实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

<a name="sending-mail-via-a-specific-mailer"></a>
#### 通过特定邮件器发送邮件

默认情况下，Laravel 将使用应用 `mail` 配置文件中配置为 `default` 邮件器的邮件器发送电子邮件。但是，你可以使用 `mailer` 方法通过特定的邮件器配置发送消息：

```php
Mail::mailer('postmark')
    ->to($request->user())
    ->send(new OrderShipped($order));
```

<a name="queueing-mail"></a>
### 邮件队列

<a name="queueing-a-mail-message"></a>
#### 排队邮件消息

由于发送电子邮件消息会对应用的响应时间产生负面影响，许多开发者选择将电子邮件消息排队以在后台发送。Laravel 通过其内置的[统一队列 API](/docs/{{version}}/queues)使这变得容易。要排队邮件消息，请在指定消息收件人后使用 `Mail` Facade 上的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

此方法将自动负责将任务推送到队列中，以便消息在后台发送。在使用此功能之前，你需要[配置队列](/docs/{{version}}/queues)。

<a name="delayed-message-queueing"></a>
#### 延迟消息排队

如果你想延迟排队邮件消息的投递，可以使用 `later` 方法。作为其第一个参数，`later` 方法接受一个 `DateTime` 实例，指示消息应何时发送：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->plus(minutes: 10), new OrderShipped($order));
```

<a name="pushing-to-specific-queues"></a>
#### 推送到特定队列

由于使用 `make:mail` 命令生成的所有 mailable 类都使用了 `Illuminate\Bus\Queueable` Trait，你可以在任何 mailable 类实例上调用 `onQueue` 和 `onConnection` 方法，从而指定消息的连接和队列名称：

```php
$message = (new OrderShipped($order))
    ->onConnection('sqs')
    ->onQueue('emails');

Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue($message);
```

或者，你可以使用 mailable 类上的 `Connection` 和 `Queue` 属性来指定连接和队列：

```php
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Queue;

#[Connection('sqs')]
#[Queue('emails')]
class OrderShipped extends Mailable
{
    // ...
}
```

<a name="queueing-by-default"></a>
#### 默认排队

如果你有一些希望始终排队的 mailable 类，可以在该类上实现 `ShouldQueue` 契约。现在，即使你在发送邮件时调用 `send` 方法，由于 mailable 实现了该契约，它仍将被排队：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    // ...
}
```

<a name="queued-mailables-and-database-transactions"></a>
#### 队列 Mailable 与数据库事务

当排队 mailable 在数据库事务内分发时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录在数据库中可能还不存在。如果你的 mailable 依赖这些模型，当发送排队 mailable 的任务被处理时，可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在发送邮件消息时调用 `afterCommit` 方法，指示特定排队 mailable 应在所有打开的数据库事务提交后分发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，你可以从 mailable 的构造函数中调用 `afterCommit` 方法：

```php
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
     * Create a new message instance.
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解更多关于解决这些问题的信息，请查阅关于[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="queued-email-failures"></a>
#### 排队邮件失败

当排队邮件失败时，如果已定义，将调用排队 mailable 类上的 `failed` 方法。导致排队邮件失败的 `Throwable` 实例将传递给 `failed` 方法：

```php
<?php

namespace App\Mail;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Throwable;

class OrderDelayed extends Mailable implements ShouldQueue
{
    use SerializesModels;

    /**
     * Handle a queued email's failure.
     */
    public function failed(Throwable $exception): void
    {
        // ...
    }
}
```

<a name="rendering-mailables"></a>
## 渲染 Mailable

有时你可能希望在不发送的情况下捕获 mailable 的 HTML 内容。为此，你可以调用 mailable 的 `render` 方法。此方法将返回 mailable 的已求值 HTML 内容作为字符串：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

<a name="previewing-mailables-in-the-browser"></a>
### 在浏览器中预览 Mailable

设计 mailable 的模板时，像普通的 Blade 模板一样在浏览器中快速预览渲染的 mailable 会很方便。因此，Laravel 允许你直接从路由闭包或控制器返回任何 mailable。返回 mailable 时，它将被渲染并在浏览器中显示，使你无需将其发送到真实电子邮件地址即可快速预览其设计：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

<a name="localizing-mailables"></a>
## 本地化 Mailable

Laravel 允许你以请求当前区域设置以外的语言环境发送 mailable，如果邮件被排队，它甚至会记住此语言环境。

为此，`Mail` Facade 提供了一个 `locale` 方法来设置所需语言。当 mailable 的模板被求值时，应用将切换到该语言环境，求值完成后将恢复到之前的语言环境：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

<a name="user-preferred-locales"></a>
#### 用户偏好的语言环境

有时，应用会存储每个用户偏好的语言环境。通过在你的一个或多个模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送邮件时使用此存储的语言环境：

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

实现该接口后，Laravel 将自动在向模型发送 mailable 和通知时使用偏好的语言环境。因此，使用此接口时无需调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

<a name="testing-mailables"></a>
## 测试

<a name="testing-mailable-content"></a>
### 测试 Mailable 内容

Laravel 提供了各种检查 mailable 结构的方法。此外，Laravel 还提供了几种便捷的方法来测试你的 mailable 是否包含你期望的内容：

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
    $mailable->assertDontSeeInHtml('Invoice Not Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertDontSeeInText('Invoice Not Paid');
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
    $mailable->assertDontSeeInHtml('Invoice Not Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertDontSeeInText('Invoice Not Paid');
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
}
```

正如你可能预料到的，"HTML"断言断言 mailable 的 HTML 版本包含给定字符串，而"text"断言断言 mailable 的纯文本版本包含给定字符串。

<a name="testing-mailable-sending"></a>
### 测试 Mailable 发送

我们建议将 mailable 内容的测试与断言给定 mailable 已被"发送"给特定用户的测试分开。通常，mailable 的内容与你要测试的代码无关，只需断言 Laravel 已被指示发送给定 mailable 就足够了。

你可以使用 `Mail` Facade 的 `fake` 方法防止邮件被发送。调用 `Mail` Facade 的 `fake` 方法后，你可以断言 mailable 已被指示发送给用户，甚至可以检查 mailable 接收的数据：

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

    // Assert a mailable was sent twice...
    Mail::assertSentTimes(OrderShipped::class, 2);

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

        // Assert a mailable was sent twice...
        Mail::assertSentTimes(OrderShipped::class, 2);

        // Assert 3 total mailables were sent...
        Mail::assertSentCount(3);
    }
}
```

如果你正在将 mailable 排队以在后台投递，应使用 `assertQueued` 方法而不是 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);
Mail::assertNotQueued(OrderShipped::class);
Mail::assertNothingQueued();
Mail::assertQueuedCount(3);
```

你也可以使用 `assertOutgoingCount` 方法断言已发送或已排队的 mailable 总数：

```php
Mail::assertOutgoingCount(3);
```

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传递一个闭包，以断言通过给定"真值测试"的 mailable 已被发送。如果至少有一个 mailable 通过给定真值测试被发送，则断言将成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

调用 `Mail` Facade 的断言方法时，提供的闭包接受的 mailable 实例暴露了用于检查 mailable 的有用方法：

```php
Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($user) {
    return $mail->hasTo($user->email) &&
           $mail->hasCc('...') &&
           $mail->hasBcc('...') &&
           $mail->hasReplyTo('...') &&
           $mail->hasFrom('...') &&
           $mail->hasSubject('...') &&
           $mail->hasMetadata('order_id', $mail->order->id);
           $mail->usesMailer('ses');
});
```

mailable 实例还包含几个用于检查 mailable 上附件的有用方法：

```php
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
```

你可能注意到有两种方法可以断言邮件未被发送：`assertNotSent` 和 `assertNotQueued`。有时你可能希望断言没有邮件被发送**或**排队。为此，你可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

<a name="mail-and-local-development"></a>
## 邮件与本地开发

在开发发送邮件的应用时，你可能不想真正向真实电子邮件地址发送邮件。Laravel 提供了几种在本地开发期间"禁用"实际发送邮件的方法。

<a name="log-driver"></a>
#### 日志驱动

`log` 邮件驱动不会发送你的邮件，而是将所有邮件消息写入日志文件以供检查。通常，此驱动只会在本地开发期间使用。有关按环境配置应用的更多信息，请查看[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="mailtrap"></a>
#### HELO / Mailtrap / Mailpit

或者，你可以使用 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 等服务，配合 `smtp` 驱动将邮件消息发送到一个"虚拟"邮箱，你可以在真正的邮件客户端中查看它们。这种方法的好处是允许你在 Mailtrap 的消息查看器中实际检查最终的邮件。

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，你可以使用 [Mailpit](https://github.com/axllent/mailpit) 预览消息。Sail 运行时，你可以在 `http://localhost:8025` 访问 Mailpit 界面。

<a name="using-a-global-to-address"></a>
#### 使用全局 `to` 地址

最后，你可以通过调用 `Mail` Facade 提供的 `alwaysTo` 方法指定全局 "to" 地址。通常，此方法应从应用某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Mail;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

使用 `alwaysTo` 方法时，邮件消息上的任何额外 "cc" 或 "bcc" 地址都将被移除。

<a name="events"></a>
## 事件

Laravel 在发送邮件消息时触发两个事件。`MessageSending` 事件在消息发送前触发，而 `MessageSent` 事件在消息发送后触发。请记住，这些事件是在邮件被*发送*时触发的，而不是在被排队时。你可以在应用中为这些事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Mail\Events\MessageSending;
// use Illuminate\Mail\Events\MessageSent;

class LogMessage
{
    /**
     * Handle the event.
     */
    public function handle(MessageSending $event): void
    {
        // ...
    }
}
```

<a name="custom-transports"></a>
## 自定义传输

Laravel 包含各种邮件传输；但是，你可能希望编写自己的传输，通过 Laravel 开箱不支持的其它服务投递邮件。要开始，请定义一个继承 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在你的传输上实现 `doSend` 和 `__toString` 方法：

```php
<?php

namespace App\Mail;

use MailchimpTransactional\ApiClient;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class MailchimpTransport extends AbstractTransport
{
    /**
     * Create a new Mailchimp transport instance.
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
     * Get the string representation of the transport.
     */
    public function __toString(): string
    {
        return 'mailchimp';
    }
}
```

定义好自定义传输后，你可以通过 `Mail` Facade 提供的 `extend` 方法注册它。通常，这应在应用 `AppServiceProvider` 的 `boot` 方法中完成。一个 `$config` 参数将传递给提供给 `extend` 方法的闭包。此参数将包含应用 `config/mail.php` 配置文件中为该邮件器定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;
use MailchimpTransactional\ApiClient;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Mail::extend('mailchimp', function (array $config = []) {
        $client = new ApiClient;

        $client->setApiKey($config['key']);

        return new MailchimpTransport($client);
    });
}
```

自定义传输定义并注册后，你可以在应用 `config/mail.php` 配置文件中创建一个利用新传输的邮件器定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    'key' => env('MAILCHIMP_API_KEY'),
    // ...
],
```

<a name="additional-symfony-transports"></a>
### 其他 Symfony 传输

Laravel 包含对 Mailgun 和 Postmark 等一些 Symfony 维护的邮件传输的支持。但是，你可能希望扩展 Laravel 以支持其他 Symfony 维护的传输。你可以通过 Composer 引入所需的 Symfony 邮件器并向 Laravel 注册传输来实现。例如，你可以安装并注册 "Brevo"（原名 "Sendinblue"）Symfony 邮件器：

```shell
composer require symfony/brevo-mailer symfony/http-client
```

安装 Brevo 邮件器包后，你可以向应用的 `services` 配置文件添加一个 Brevo API 凭据条目：

```php
'brevo' => [
    'key' => env('BREVO_API_KEY'),
],
```

接下来，你可以使用 `Mail` Facade 的 `extend` 方法向 Laravel 注册该传输。通常，这应在服务提供者的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

/**
 * Bootstrap any application services.
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
```

传输注册后，你可以在应用 `config/mail.php` 配置文件中创建一个利用新传输的邮件器定义：

```php
'brevo' => [
    'transport' => 'brevo',
    // ...
],
```
