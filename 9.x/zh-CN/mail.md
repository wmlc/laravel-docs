# 邮件

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
    - [故障转移配置](#failover-configuration)
- [生成 Mailable](#generating-mailables)
- [编写 Mailable](#writing-mailables)
    - [配置发件人](#configuring-the-sender)
    - [配置视图](#configuring-the-view)
    - [视图数据](#view-data)
    - [附件](#attachments)
    - [内联附件](#inline-attachments)
    - [可附加对象](#attachable-objects)
    - [头信息](#headers)
    - [标签与元数据](#tags-and-metadata)
    - [自定义 Symfony Message](#customizing-the-symfony-message)
- [Markdown 邮件（Markdown Mailable）](#markdown-mailables)
    - [生成 Markdown Mailable](#generating-markdown-mailables)
    - [编写 Markdown 消息](#writing-markdown-messages)
    - [自定义组件](#customizing-the-components)
- [发送邮件](#sending-mail)
    - [队列邮件](#queueing-mail)
- [渲染 Mailable](#rendering-mailables)
    - [在浏览器中预览 Mailable](#previewing-mailables-in-the-browser)
- [本地化 Mailable](#localizing-mailables)
- [测试 Mailable](#testing-mailables)
- [邮件与本地开发](#mail-and-local-development)
- [事件](#events)
- [自定义传输](#custom-transports)
    - [额外的 Symfony 传输](#additional-symfony-transports)

<a name="introduction"></a>
## 简介

发送邮件不必很复杂。Laravel 提供了一个干净、简单的邮件 API，由流行的 [Symfony Mailer](https://symfony.com/doc/6.0/mailer.html) 组件驱动。Laravel 和 Symfony Mailer 提供了通过 SMTP、Mailgun、Postmark、Amazon SES 和 `sendmail` 发送邮件的驱动，让你能够快速开始通过你选择的本地或云端服务发送邮件。

<a name="configuration"></a>
### 配置

Laravel 的邮件服务可以通过应用程序的 `config/mail.php` 配置文件进行配置。此文件中配置的每个邮件服务都可以有自己的唯一配置，甚至自己的唯一"传输"，允许你的应用程序使用不同的邮件服务来发送特定的邮件消息。例如，你的应用程序可能使用 Postmark 发送事务性邮件，同时使用 Amazon SES 发送批量邮件。

在 `mail` 配置文件中，你会找到一个 `mailers` 配置数组。此数组包含 Laravel 支持的每个主要邮件驱动/传输的示例配置条目，而 `default` 配置值确定当应用程序需要发送邮件消息时默认使用哪个邮件服务。

<a name="driver-prerequisites"></a>
### 驱动 / 传输前提条件

基于 API 的驱动（如 Mailgun 和 Postmark）通常比通过 SMTP 服务器发送邮件更简单、更快速。在可能的情况下，我们建议你使用这些驱动之一。

<a name="mailgun-driver"></a>
#### Mailgun 驱动

要使用 Mailgun 驱动，通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，将应用程序 `config/mail.php` 配置文件中的 `default` 选项设置为 `mailgun`。配置应用程序的默认邮件服务后，验证 `config/services.php` 配置文件包含以下选项：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
],
```

如果你不使用美国 [Mailgun 区域](https://documentation.mailgun.com/en/latest/api-intro.html#mailgun-regions)，可以在 `services` 配置文件中定义你区域的端点：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
],
```

<a name="postmark-driver"></a>
#### Postmark 驱动

要使用 Postmark 驱动，通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，将应用程序 `config/mail.php` 配置文件中的 `default` 选项设置为 `postmark`。配置应用程序的默认邮件服务后，验证 `config/services.php` 配置文件包含以下选项：

```php
'postmark' => [
    'token' => env('POSTMARK_TOKEN'),
],
```

如果你想指定给定邮件服务应使用的 Postmark 消息流，可以将 `message_stream_id` 配置选项添加到邮件服务的配置数组。此配置数组可以在应用程序的 `config/mail.php` 配置文件中找到：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
],
```

这样你还可以设置具有不同消息流的多个 Postmark 邮件服务。

<a name="ses-driver"></a>
#### SES 驱动

要使用 Amazon SES 驱动，你必须首先安装 Amazon AWS SDK for PHP。你可以通过 Composer 包管理器安装此库：

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

要通过会话令牌利用 AWS [临时凭证](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，你可以将 `token` 键添加到应用程序的 SES 配置中：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

如果你想定义 Laravel 在发送邮件时应传递给 AWS SDK `SendEmail` 方法的[额外选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，可以在 `ses` 配置中定义 `options` 数组：

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

有时，你配置用于发送应用程序邮件的外部服务可能会宕机。在这些情况下，定义一个或多个备份邮件投递配置可能会很有用，以便在主投递驱动宕机时使用。

为此，你应在应用程序的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件服务。应用程序 `failover` 邮件服务的配置数组应包含一个 `mailers` 数组，引用选择邮件驱动进行投递的顺序：

```php
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
```

定义故障转移邮件服务后，你应通过在应用程序 `mail` 配置文件中将此邮件服务的名称指定为 `default` 配置键的值，将其设置为应用程序使用的默认邮件服务：

```php
'default' => env('MAIL_MAILER', 'failover'),
```

<a name="generating-mailables"></a>
## 生成 Mailable

构建 Laravel 应用程序时，应用程序发送的每种类型的邮件都表示为一个"mailable"类。这些类存储在 `app/Mail` 目录中。如果你在应用程序中看不到此目录，不必担心，因为当你使用 `make:mail` Artisan 命令创建第一个 mailable 类时，它会为你生成：

```shell
php artisan make:mail OrderShipped
```

<a name="writing-mailables"></a>
## 编写 Mailable

生成 mailable 类后，打开它以便我们探索其内容。Mailable 类配置在几个方法中完成，包括 `envelope`、`content` 和 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，定义邮件的主题，有时还有收件人。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，定义将用于生成邮件内容的 [Blade 模板](/docs/{{version}}/blade)。

<a name="configuring-the-sender"></a>
### 配置发件人

<a name="using-the-envelope"></a>
#### 使用 Envelope

首先，让我们探索如何配置邮件的发件人。换句话说，邮件将"来自"谁。有两种方式配置发件人。首先，你可以在邮件的 envelope 上指定"from"地址：

```php
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * 获取消息 envelope。
 *
 * @return \Illuminate\Mail\Mailables\Envelope
 */
public function envelope()
{
    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        subject: 'Order Shipped',
    );
}
```

如果你愿意，还可以指定 `replyTo` 地址：

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

但是，如果你的应用程序所有邮件使用相同的"from"地址，在每个生成的 mailable 类中调用 `from` 方法会变得繁琐。相反，你可以在 `config/mail.php` 配置文件中指定全局"from"地址。如果 mailable 类中未指定其他"from"地址，将使用此地址：

```php
'from' => ['address' => 'example@example.com', 'name' => 'App Name'],
```

此外，你可以在 `config/mail.php` 配置文件中定义全局"reply_to"地址：

```php
'reply_to' => ['address' => 'example@example.com', 'name' => 'App Name'],
```

<a name="configuring-the-view"></a>
### 配置视图

在 mailable 类的 `content` 方法中，你可以定义 `view`，即渲染邮件内容时应使用的模板。由于每封邮件通常使用 [Blade 模板](/docs/{{version}}/blade) 渲染其内容，在构建邮件 HTML 时你可以充分利用 Blade 模板引擎的强大功能和便利性：

```php
/**
 * 获取消息内容定义。
 *
 * @return \Illuminate\Mail\Mailables\Content
 */
public function content()
{
    return new Content(
        view: 'emails.orders.shipped',
    );
}
```

> **Note**  
> 你可能希望创建 `resources/views/emails` 目录来存放所有邮件模板；但是，你可以自由地将它们放在 `resources/views` 目录中任何你想要的位置。

<a name="plain-text-emails"></a>
#### 纯文本邮件

如果你想定义邮件的纯文本版本，可以在创建消息的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数应是一个将用于渲染邮件内容的模板名称。你可以自由地定义消息的 HTML 和纯文本版本：

```php
/**
 * 获取消息内容定义。
 *
 * @return \Illuminate\Mail\Mailables\Content
 */
public function content()
{
    return new Content(
        view: 'emails.orders.shipped',
        text: 'emails.orders.shipped-text'
    );
}
```

为清晰起见，`html` 参数可用作 `view` 参数的别名：

```php
return new Content(
    html: 'emails.orders.shipped',
    text: 'emails.orders.shipped-text'
);
```

<a name="view-data"></a>
### 视图数据

<a name="via-public-properties"></a>
#### 通过公共属性

通常，你会希望将一些数据传递给视图，以便在渲染邮件 HTML 时使用。有两种方式可以让数据对视图可用。首先，在 mailable 类上定义的任何公共属性都将自动对视图可用。因此，例如，你可以将数据传递到 mailable 类的构造函数，并将该数据设置为类上定义的公共属性：

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
     * 订单实例。
     *
     * @var \App\Models\Order
     */
    public $order;

    /**
     * 创建新的消息实例。
     *
     * @param  \App\Models\Order  $order
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * 获取消息内容定义。
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.orders.shipped',
        );
    }
}
```

一旦数据被设置为公共属性，它将自动在视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

    <div>

```blade
    Price: {{ $order->price }}
</div>
```

<a name="via-the-with-parameter"></a>
#### 通过 `with` 参数

如果你想自定义邮件数据在发送到模板之前的格式，可以通过 `Content` 定义的 `with` 参数手动将数据传递给视图。通常，你仍会通过 mailable 类的构造函数传递数据；但是，你应将此数据设置为 `protected` 或 `private` 属性，以便数据不会自动对模板可用：

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
     * 订单实例。
     *
     * @var \App\Models\Order
     */
    protected $order;

    /**
     * 创建新的消息实例。
     *
     * @param  \App\Models\Order  $order
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * 获取消息内容定义。
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.orders.shipped',
            with: [
                'orderName' => $this->order->name,
                'orderPrice' => $this->order->price,
            ],
        );
    }
}
```

一旦数据通过 `with` 方法传递，它将自动在视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

    <div>

```blade
    Price: {{ $orderPrice }}
</div>
```

<a name="attachments"></a>
### 附件

要向邮件添加附件，你将附件添加到消息 `attachments` 方法返回的数组中。首先，你可以通过向 `Attachment` 类提供的 `fromPath` 方法提供文件路径来添加附件：

```php
use Illuminate\Mail\Mailables\Attachment;

/**
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
{
    return [
        Attachment::fromPath('/path/to/file'),
    ];
}
```

向消息附加文件时，你还可以使用 `as` 和 `withMime` 方法指定附件的显示名称和/或 MIME 类型：

```php
/**
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
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

如果你已将文件存储在某个[文件系统磁盘](/docs/{{version}}/filesystem)上，可以使用 `fromStorage` 附件方法将其附加到邮件：

```php
/**
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

当然，你也可以指定附件的名称和 MIME 类型：

```php
/**
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
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
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
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

`fromData` 附件方法可用于将原始字节字符串作为附件附加。例如，如果你已在内存中生成 PDF 并希望将其附加到邮件而不写入磁盘，则可以使用此方法。`fromData` 方法接受一个解析原始数据字节的闭包以及应分配给附件的名称：

```php
/**
 * 获取消息的附件。
 *
 * @return \Illuminate\Mail\Mailables\Attachment[]
 */
public function attachments()
{
    return [
        Attachment::fromData(fn () => $this->pdf, 'Report.pdf')
                ->withMime('application/pdf'),
    ];
}
```

<a name="inline-attachments"></a>
### 内联附件

将内联图像嵌入邮件通常很麻烦；但是，Laravel 提供了一种便捷的方式来将图像附加到邮件。要嵌入内联图像，在邮件模板中对 `$message` 变量使用 `embed` 方法。Laravel 自动使 `$message` 变量对所有邮件模板可用，因此你无需手动传递它：

```blade
<body>
    Here is an image:

    <img src="{{ $message->embed($pathToImage) }}">
</body>
```

> **Warning**  
> `$message` 变量在纯文本消息模板中不可用，因为纯文本消息不使用内联附件。

<a name="embedding-raw-data-attachments"></a>
#### 嵌入原始数据附件

如果你已有希望嵌入邮件模板的原始图像数据字符串，可以对 `$message` 变量调用 `embedData` 方法。调用 `embedData` 方法时，你需要提供应分配给嵌入图像的文件名：

```blade
<body>
    Here is an image from raw data:

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

<a name="attachable-objects"></a>
### 可附加对象

虽然通过简单的字符串路径将文件附加到消息通常足够，但在许多情况下，应用程序中的可附加实体由类表示。例如，如果你的应用程序正在将照片附加到消息，你的应用程序可能还有一个表示该照片的 `Photo` 模型。在这种情况下，简单地将 `Photo` 模型传递给 `attach` 方法不是很方便吗？可附加对象允许你做到这一点。

首先，在将可附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。此接口要求你的类定义一个返回 `Illuminate\Mail\Attachment` 实例的 `toMailAttachment` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Mail\Attachable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Attachment;

class Photo extends Model implements Attachable
{
    /**
     * 获取模型的可附加表示。
     *
     * @return \Illuminate\Mail\Attachment
     */
    public function toMailAttachment()
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义可附加对象后，你可以在构建邮件消息时从 `attachments` 方法返回该对象的实例：

```php
/**
 * 获取消息的附件。
 *
 * @return array
 */
public function attachments()
{
    return [$this->photo];
}
```

当然，附件数据可能存储在远程文件存储服务（如 Amazon S3）上。因此，Laravel 还允许你从存储在应用程序[文件系统磁盘](/docs/{{version}}/filesystem)上的数据生成附件实例：

```php
// 从默认磁盘上的文件创建附件...
return Attachment::fromStorage($this->path);

// 从特定磁盘上的文件创建附件...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，你可以通过内存中的数据创建附件实例。为此，向 `fromData` 方法提供一个闭包。闭包应返回表示附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了可用于自定义附件的额外方法。例如，你可以使用 `as` 和 `withMime` 方法自定义文件名和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
        ->as('Photo Name')
        ->withMime('image/jpeg');
```

<a name="headers"></a>
### 头信息

有时你可能需要向传出消息附加额外的头信息。例如，你可能需要设置自定义 `Message-Id` 或其他任意文本头。

为此，在 mailable 上定义 `headers` 方法。`headers` 方法应返回 `Illuminate\Mail\Mailables\Headers` 实例。此类接受 `messageId`、`references` 和 `text` 参数。当然，你可以只为特定消息提供所需的参数：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * 获取消息头信息。
 *
 * @return \Illuminate\Mail\Mailables\Headers
 */
public function headers()
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

某些第三方邮件提供商（如 Mailgun 和 Postmark）支持消息"标签"和"元数据"，可用于分组和跟踪应用程序发送的邮件。你可以通过 `Envelope` 定义向邮件消息添加标签和元数据：

```php
use Illuminate\Mail\Mailables\Envelope;

/**
 * 获取消息 envelope。
 *
 * @return \Illuminate\Mail\Mailables\Envelope
 */
public function envelope()
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

如果你的应用程序使用 Mailgun 驱动，可以查阅 Mailgun 文档了解有关[标签](https://documentation.mailgun.com/en/latest/user_manual.html#tagging-1)和[元数据](https://documentation.mailgun.com/en/latest/user_manual.html#attaching-data-to-messages)的更多信息。同样，也可以查阅 Postmark 文档了解其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)支持的更多信息。

如果你的应用程序使用 Amazon SES 发送邮件，你应使用 `metadata` 方法将 [SES"标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony Message

Laravel 的邮件功能由 Symfony Mailer 驱动。Laravel 允许你注册将在发送消息之前用 Symfony Message 实例调用的自定义回调。这使你有机会在发送之前深度自定义消息。为此，在 `Envelope` 定义上定义 `using` 参数：

```php
use Illuminate\Mail\Mailables\Envelope;
use Symfony\Component\Mime\Email;

/**
 * 获取消息 envelope。
 *
 * @return \Illuminate\Mail\Mailables\Envelope
 */
public function envelope()
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
## Markdown 邮件（Markdown Mailable）

Markdown mailable 消息允许你在 mailable 中利用[邮件通知](/docs/{{version}}/notifications#mail-notifications)的预构建模板和组件。由于消息以 Markdown 编写，Laravel 能够为消息渲染美观、响应式的 HTML 模板，同时自动生成纯文本对应版本。

<a name="generating-markdown-mailables"></a>
### 生成 Markdown Mailable

要生成带有相应 Markdown 模板的 mailable，可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=emails.orders.shipped
```

然后，在其 `content` 方法中配置 mailable `Content` 定义时，使用 `markdown` 参数代替 `view` 参数：

```php
use Illuminate\Mail\Mailables\Content;

/**
 * 获取消息内容定义。
 *
 * @return \Illuminate\Mail\Mailables\Content
 */
public function content()
{
    return new Content(
        markdown: 'emails.orders.shipped',
        with: [
            'url' => $this->orderUrl,
        ],
    );
}
```

<a name="writing-markdown-messages"></a>
### 编写 Markdown 消息

Markdown mailable 使用 Blade 组件和 Markdown 语法的组合，允许你在利用 Laravel 预构建的邮件 UI 组件的同时轻松构建邮件消息：

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

> **Note**  
> 编写 Markdown 邮件时不要使用过多缩进。按照 Markdown 标准，Markdown 解析器会将缩进内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中的按钮链接。组件接受两个参数：`url` 和可选的 `color`。支持的颜色为 `primary`、`success` 和 `error`。你可以向消息添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="success">
View Order
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件在具有与消息其余部分略有不同背景色的面板中渲染给定的文本块。这允许你引起对给定文本块的注意：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。组件接受 Markdown 表格作为其内容。使用默认 Markdown 表格对齐语法支持表格列对齐：

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

你可以将所有 Markdown 邮件组件导出到自己的应用程序进行自定义。要导出组件，使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含 `html` 和 `text` 目录，每个目录包含其各自对每个可用组件的表示。你可以自由地按需自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动转换为 Markdown 邮件消息 HTML 表示中的内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。命名并保存 CSS 文件后，更新应用程序 `config/mail.php` 配置文件的 `theme` 选项以匹配新主题的名称。

要自定义单个 mailable 的主题，可以将 mailable 类的 `$theme` 属性设置为发送该 mailable 时应使用的主题名称。

<a name="sending-mail"></a>
## 发送邮件

要发送消息，使用 `Mail` [Facade](/docs/{{version}}/facades) 上的 `to` 方法。`to` 方法接受邮件地址、用户实例或用户集合。如果你传递对象或对象集合，邮件服务将在确定邮件收件人时自动使用其 `email` 和 `name` 属性，因此请确保这些属性在你的对象上可用。指定收件人后，你可以将 mailable 类的实例传递给 `send` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\OrderShipped;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderShipmentController extends Controller
{
    /**
     * 发运给定订单。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $order = Order::findOrFail($request->order_id);

        // 发运订单...

        Mail::to($request->user())->send(new OrderShipped($order));
    }
}
```

发送消息时，你不仅限于指定"to"收件人。你可以通过链式调用各自的方法来自由设置"to"、"cc"和"bcc"收件人：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

<a name="looping-over-recipients"></a>
#### 遍历收件人

有时，你可能需要通过遍历收件人/邮件地址数组来向收件人列表发送 mailable。但是，由于 `to` 方法将邮件地址附加到 mailable 的收件人列表，每次循环迭代都会向每个之前的收件人发送另一封邮件。因此，你应为每个收件人重新创建 mailable 实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

<a name="sending-mail-via-a-specific-mailer"></a>
#### 通过特定邮件服务发送邮件

默认情况下，Laravel 将使用应用程序 `mail` 配置文件中配置为 `default` 邮件服务的邮件服务发送邮件。但是，你可以使用 `mailer` 方法通过特定邮件服务配置发送消息：

```php
Mail::mailer('postmark')
        ->to($request->user())
        ->send(new OrderShipped($order));
```

<a name="queueing-mail"></a>
### 队列邮件

<a name="queueing-a-mail-message"></a>
#### 队列邮件消息

由于发送邮件消息可能会对应用程序的响应时间产生负面影响，许多开发者选择将邮件消息排队以便后台发送。Laravel 使用其内置的[统一队列 API](/docs/{{version}}/queues) 使此操作变得简单。要排队邮件消息，在指定消息收件人后使用 `Mail` Facade 上的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

此方法将自动负责将作业推入队列，以便在后台发送消息。使用此功能之前，你需要[配置队列](/docs/{{version}}/queues)。

<a name="delayed-message-queueing"></a>
#### 延迟消息队列

如果你希望延迟投递排队的邮件消息，可以使用 `later` 方法。`later` 方法接受一个 `DateTime` 实例作为第一个参数，指示何时应发送消息：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->addMinutes(10), new OrderShipped($order));
```

<a name="pushing-to-specific-queues"></a>
#### 推送到特定队列

由于使用 `make:mail` 命令生成的所有 mailable 类都使用 `Illuminate\Bus\Queueable` Trait，你可以在任何 mailable 类实例上调用 `onQueue` 和 `onConnection` 方法，允许你为消息指定连接和队列名称：

```php
$message = (new OrderShipped($order))
                ->onConnection('sqs')
                ->onQueue('emails');

Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue($message);
```

<a name="queueing-by-default"></a>
#### 默认排队

如果你有希望始终排队的 mailable 类，可以在类上实现 `ShouldQueue` 契约。现在，即使你在发送邮件时调用 `send` 方法，mailable 仍将被排队，因为它实现了契约：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    //
}
```

<a name="queued-mailables-and-database-transactions"></a>
#### 排队 Mailable 与数据库事务

当排队的 mailable 在数据库事务内分发时，它们可能在数据库事务提交之前被队列处理。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务内创建的任何模型或数据库记录可能不存在于数据库中。如果你的 mailable 依赖这些模型，当处理发送排队 mailable 的作业时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，你仍可以通过在发送邮件消息时调用 `afterCommit` 方法来指示特定的排队 mailable 应在所有打开的数据库事务提交后分发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，你可以从 mailable 的构造函数调用 `afterCommit` 方法：

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
     * 创建新的消息实例。
     *
     * @return void
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> **Note**  
> 要了解有关解决这些问题的更多信息，请查阅有关[排队作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="rendering-mailables"></a>
## 渲染 Mailable

有时你可能希望捕获 mailable 的 HTML 内容而不发送它。为此，你可以调用 mailable 的 `render` 方法。此方法将以字符串形式返回 mailable 的已求值 HTML 内容：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

<a name="previewing-mailables-in-the-browser"></a>
### 在浏览器中预览 Mailable

设计 mailable 模板时，像典型的 Blade 模板一样在浏览器中快速预览渲染的 mailable 很方便。因此，Laravel 允许你直接从路由闭包或控制器返回任何 mailable。返回 mailable 时，它将被渲染并显示在浏览器中，让你无需发送到实际邮件地址即可快速预览其设计：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

> **Warning**  
> 在浏览器中预览 mailable 时，[内联附件](#inline-attachments)不会被渲染。要预览这些 mailable，你应将它们发送到邮件测试应用程序，如 [Mailpit](https://github.com/axllent/mailpit) 或 [HELO](https://usehelo.com)。

<a name="localizing-mailables"></a>
## 本地化 Mailable

Laravel 允许你以请求当前语言以外的语言环境发送 mailable，如果邮件已排队，甚至会记住此语言环境。

为此，`Mail` Facade 提供了 `locale` 方法来设置所需语言。当评估 mailable 模板时，应用程序将切换到此语言环境，评估完成后恢复到之前的语言环境：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

<a name="user-preferred-locales"></a>
### 用户首选语言环境

有时，应用程序会存储每个用户的首选语言环境。通过在一个或多个模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送邮件时使用此存储的语言环境：

```php
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
```

实现接口后，Laravel 将在向模型发送 mailable 和通知时自动使用首选语言环境。因此，使用此接口时无需调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

<a name="testing-mailables"></a>
## 测试 Mailable

Laravel 提供了多种方法来检查 mailable 的结构。此外，Laravel 还提供了几种便捷方法来测试 mailable 是否包含你期望的内容。这些方法为：`assertSeeInHtml`、`assertDontSeeInHtml`、`assertSeeInOrderInHtml`、`assertSeeInText`、`assertDontSeeInText`、`assertSeeInOrderInText`、`assertHasAttachment`、`assertHasAttachedData`、`assertHasAttachmentFromStorage` 和 `assertHasAttachmentFromStorageDisk`。

如你所料，"HTML"断言断言 mailable 的 HTML 版本包含给定字符串，而"text"断言断言 mailable 的纯文本版本包含给定字符串：

```php tab=PHPUnit
use App\Mail\InvoicePaid;
use App\Models\User;

public function test_mailable_content()
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
#### 测试 Mailable 发送

我们建议将 mailable 内容的测试与断言给定 mailable 已"发送"给特定用户的测试分开。要了解如何测试 mailable 是否已发送，请查阅有关 [Mail fake](/docs/{{version}}/mocking#mail-fake) 的文档。

<a name="mail-and-local-development"></a>
## 邮件与本地开发

在开发发送邮件的应用程序时，你可能不希望实际将邮件发送到真实邮件地址。Laravel 提供了几种在本地开发期间"禁用"实际发送邮件的方式。

<a name="log-driver"></a>
#### 日志驱动

`log` 邮件驱动不会发送邮件，而是将所有邮件消息写入日志文件以供检查。通常，此驱动仅在本地开发期间使用。有关按环境配置应用程序的更多信息，请查阅[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="mailtrap"></a>
#### HELO / Mailtrap / Mailpit

或者，你可以使用 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 等服务以及 `smtp` 驱动将邮件消息发送到"虚拟"邮箱，你可以在真正的邮件客户端中查看它们。此方法的好处是允许你在 Mailtrap 的消息查看器中实际检查最终邮件。

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，可以使用 [Mailpit](https://github.com/axllent/mailpit) 预览消息。Sail 运行时，你可以通过 `http://localhost:8025` 访问 Mailpit 界面。

<a name="using-a-global-to-address"></a>
#### 使用全局 `to` 地址

最后，你可以通过调用 `Mail` Facade 提供的 `alwaysTo` 方法来指定全局"to"地址。通常，应从应用程序某个服务提供者的 `boot` 方法调用此方法：

```php
use Illuminate\Support\Facades\Mail;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

<a name="events"></a>
## 事件

Laravel 在发送邮件消息过程中触发两个事件。`MessageSending` 事件在消息发送之前触发，而 `MessageSent` 事件在消息发送之后触发。请记住，这些事件在邮件*发送*时触发，而不是在排队时触发。你可以在 `App\Providers\EventServiceProvider` 服务提供者中为此事件注册事件监听器：

```php
use App\Listeners\LogSendingMessage;
use App\Listeners\LogSentMessage;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;

/**
 * 应用程序的事件监听器映射。
 *
 * @var array
 */
protected $listen = [
    MessageSending::class => [
        LogSendingMessage::class,
    ],

    MessageSent::class => [
        LogSentMessage::class,
    ],
];
```

<a name="custom-transports"></a>
## 自定义传输

Laravel 包含多种邮件传输；但是，你可能希望编写自己的传输，以通过 Laravel 开箱即用不支持的其他服务投递邮件。首先，定义一个扩展 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在你的传输上实现 `doSend` 和 `__toString()` 方法：

```php
use MailchimpTransactional\ApiClient;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

class MailchimpTransport extends AbstractTransport
{
    /**
     * Mailchimp API 客户端。
     *
     * @var \MailchimpTransactional\ApiClient
     */
    protected $client;

    /**
     * 创建新的 Mailchimp 传输实例。
     *
     * @param  \MailchimpTransactional\ApiClient  $client
     * @return void
     */
    public function __construct(ApiClient $client)
    {
        parent::__construct();

        $this->client = $client;
    }

    /**
     * {@inheritDoc}
     */
    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $this->client->messages->send(['message' => [
            'from_email' => $email->getFrom(),
            'to' => collect($email->getTo())->map(function ($email) {
                return ['email' => $email->getAddress(), 'type' => 'to'];
            })->all(),
            'subject' => $email->getSubject(),
            'text' => $email->getTextBody(),
        ]]);
    }

    /**
     * 获取传输的字符串表示。
     *
     * @return string
     */
    public function __toString(): string
    {
        return 'mailchimp';
    }
}
```

定义自定义传输后，你可以通过 `Mail` Facade 提供的 `extend` 方法注册它。通常，这应在应用程序 `AppServiceProvider` 服务提供者的 `boot` 方法中完成。`$config` 参数将传递给提供给 `extend` 方法的闭包。此参数将包含应用程序 `config/mail.php` 配置文件中为邮件服务定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    Mail::extend('mailchimp', function (array $config = []) {
        return new MailchimpTransport(/* ... */);
    });
}
```

定义并注册自定义传输后，你可以在应用程序的 `config/mail.php` 配置文件中创建使用新传输的邮件服务定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    // ...
],
```

<a name="additional-symfony-transports"></a>
### 额外的 Symfony 传输

Laravel 包含对一些现有 Symfony 维护的邮件传输（如 Mailgun 和 Postmark）的支持。但是，你可能希望通过支持额外的 Symfony 维护传输来扩展 Laravel。你可以通过 Composer 安装必要的 Symfony mailer 并向 Laravel 注册传输来实现。例如，你可以安装并注册"Sendinblue"Symfony mailer：

```none
composer require symfony/sendinblue-mailer symfony/http-client
```

安装 Sendinblue mailer 包后，你可以在应用程序的 `services` 配置文件中添加 Sendinblue API 凭证条目：

```php
'sendinblue' => [
    'key' => 'your-api-key',
],
```

接下来，你可以使用 `Mail` Facade 的 `extend` 方法向 Laravel 注册传输。通常，这应在服务提供者的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Sendinblue\Transport\SendinblueTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    Mail::extend('sendinblue', function () {
        return (new SendinblueTransportFactory)->create(
            new Dsn(
                'sendinblue+api',
                'default',
                config('services.sendinblue.key')
            )
        );
    });
}
```

注册传输后，你可以在应用程序的 config/mail.php 配置文件中创建使用新传输的邮件服务定义：

```php
'sendinblue' => [
    'transport' => 'sendinblue',
    // ...
],
```