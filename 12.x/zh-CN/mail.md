# 邮件

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
    - [故障转移配置](#failover-configuration)
    - [轮询配置](#round-robin-configuration)
- [生成邮件类](#generating-mailables)
- [编写邮件类](#writing-mailables)
    - [配置发件人](#configuring-the-sender)
    - [配置视图](#configuring-the-view)
    - [视图数据](#view-data)
    - [附件](#attachments)
    - [内联附件](#inline-attachments)
    - [可附加对象](#attachable-objects)
    - [邮件头](#headers)
    - [标签与元数据](#tags-and-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
- [Markdown 邮件](#markdown-mailables)
    - [生成 Markdown 邮件](#generating-markdown-mailables)
    - [编写 Markdown 消息](#writing-markdown-messages)
    - [自定义组件](#customizing-the-components)
- [发送邮件](#sending-mail)
    - [邮件队列](#queueing-mail)
- [渲染邮件](#rendering-mailables)
    - [在浏览器中预览邮件](#previewing-mailables-in-the-browser)
- [邮件本地化](#localizing-mailables)
- [测试](#testing-mailables)
    - [测试邮件内容](#testing-mailable-content)
    - [测试邮件发送](#testing-mailable-sending)
- [邮件与本地开发](#mail-and-local-development)
- [事件](#events)
- [自定义传输](#custom-transports)
    - [其他 Symfony 传输](#additional-symfony-transports)

<a name="introduction"></a>
## 简介

发送邮件并不复杂。Laravel 提供了简洁、简单的邮件 API，由广受欢迎的 [Symfony Mailer](https://symfony.com/doc/current/mailer.html) 组件驱动。Laravel 与 Symfony Mailer 提供了通过 SMTP、Mailgun、Postmark、Resend、Amazon SES 和 `sendmail` 发送邮件的驱动，让你能够快速开始通过本地或云端服务发送邮件。

<a name="configuration"></a>
### 配置

Laravel 的邮件服务可以通过应用程序的 `config/mail.php` 配置文件进行配置。该文件中配置的每个邮件系统（mailer）都可以拥有自己独立的配置，甚至是自己独立的「传输」，允许你的应用程序使用不同的邮件服务来发送特定的邮件。例如，你的应用程序可以使用 Postmark 发送事务性邮件，同时使用 Amazon SES 发送批量邮件。

在 `mail` 配置文件中，你会找到一个 `mailers` 配置数组。该数组包含 Laravel 支持的每种主要邮件驱动 / 传输的示例配置条目，而 `default` 配置值决定了应用程序需要发送邮件时默认使用哪个邮件系统。

<a name="driver-prerequisites"></a>
### 驱动 / 传输前提条件

基于 API 的驱动（如 Mailgun、Postmark 和 Resend）通常比通过 SMTP 服务器发送邮件更简单、更快速。在可能的情况下，我们建议你使用这些驱动之一。

<a name="mailgun-driver"></a>
#### Mailgun 驱动

要使用 Mailgun 驱动，请通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，你需要在应用程序的 `config/mail.php` 配置文件中进行两处修改。首先，将默认邮件系统设置为 `mailgun`：

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

配置好应用程序的默认邮件系统后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
],
```

如果你使用的不是美国[Mailgun 区域](https://documentation.mailgun.com/docs/mailgun/api-reference/#mailgun-regions)，可以在 `services` 配置文件中定义你所在区域的端点：

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

接下来，将应用程序 `config/mail.php` 配置文件中的 `default` 选项设置为 `postmark`。配置好应用程序的默认邮件系统后，请确保 `config/services.php` 配置文件中包含以下选项：

```php
'postmark' => [
    'key' => env('POSTMARK_API_KEY'),
],
```

如果你想为给定的邮件系统指定应使用的 Postmark 消息流（message stream），可以在该邮件系统的配置数组中添加 `message_stream_id` 配置选项。该配置数组位于应用程序的 `config/mail.php` 配置文件中：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

这样，你还可以为不同的消息流设置多个 Postmark 邮件系统。

<a name="resend-driver"></a>
#### Resend 驱动

要使用 [Resend](https://resend.com/) 驱动，请通过 Composer 安装 Resend 的 PHP SDK：

```shell
composer require resend/resend-php
```

接下来，将应用程序 `config/mail.php` 配置文件中的 `default` 选项设置为 `resend`。配置好应用程序的默认邮件系统后，请确保 `config/services.php` 配置文件中包含以下选项：

```php
'resend' => [
    'key' => env('RESEND_API_KEY'),
],
```

<a name="ses-driver"></a>
#### SES 驱动

要使用 Amazon SES 驱动，你必须先安装 Amazon AWS SDK for PHP。可以通过 Composer 包管理器安装该库：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `config/mail.php` 配置文件中的 `default` 选项设置为 `ses`，并确认 `config/services.php` 配置文件中包含以下选项：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
],
```

要通过会话令牌使用 AWS [临时凭证](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，你可以在应用程序的 SES 配置中添加一个 `token` 键：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

要使用 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)，你可以在邮件消息 [headers](#headers) 方法返回的数组中返回 `X-Ses-List-Management-Options` 头：

```php
/**
 * 获取消息头。
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

如果你想定义发送邮件时 Laravel 应传递给 AWS SDK 的 `SendEmail` 方法的[额外选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，可以在 `ses` 配置中定义一个 `options` 数组：

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

有时，你配置用来发送应用程序邮件的外部服务可能会宕机。在这种情况下，定义一个或多个备用邮件投递配置会很有用，以便在主投递驱动不可用时启用。

为此，你应当在应用程序的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件系统。应用程序 `failover` 邮件系统的配置数组应包含一个 `mailers` 数组，指明已配置的邮件系统按何种顺序被选用投递：

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

配置好使用 `failover` 传输的邮件系统后，你需要在应用程序的 `.env` 文件中将该故障转移邮件系统设置为默认邮件系统，才能使用故障转移功能：

```ini
MAIL_MAILER=failover
```

<a name="round-robin-configuration"></a>
### 轮询配置

`roundrobin` 传输允许你将邮件投递工作负载分摊到多个邮件系统上。首先，在应用程序的 `mail` 配置文件中定义一个使用 `roundrobin` 传输的邮件系统。应用程序 `roundrobin` 邮件系统的配置数组应包含一个 `mailers` 数组，指明应使用哪些已配置的邮件系统进行投递：

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

定义好轮询邮件系统后，你应当在应用程序 `mail` 配置文件中将该邮件系统的名称指定为 `default` 配置键的值，将其设置为应用程序使用的默认邮件系统：

```php
'default' => env('MAIL_MAILER', 'roundrobin'),
```

轮询传输会从已配置的邮件系统列表中随机选择一个，然后在后续每封邮件中切换到下一个可用的邮件系统。与旨在实现*[高可用](https://en.wikipedia.org/wiki/High_availability)*的 `failover` 传输不同，`roundrobin` 传输提供的是*[负载均衡](https://en.wikipedia.org/wiki/Load_balancing_(computing))*。

<a name="generating-mailables"></a>
## 生成邮件类

构建 Laravel 应用程序时，应用程序发送的每种邮件都由一个「邮件类」（mailable）表示。这些类存放在 `app/Mail` 目录中。如果你的应用程序中没有看到这个目录也不必担心，当你使用 `make:mail` Artisan 命令创建第一个邮件类时，该目录会自动生成：

```shell
php artisan make:mail OrderShipped
```

<a name="writing-mailables"></a>
## 编写邮件类

生成邮件类之后，打开它来探索一下其内容。邮件类的配置在多个方法中完成，包括 `envelope`、`content` 和 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，定义邮件的主题，有时也定义收件人。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，定义用于生成邮件内容的 [Blade 模板](/docs/{{version}}/blade)。

<a name="configuring-the-sender"></a>
### 配置发件人

<a name="using-the-envelope"></a>
#### 使用 Envelope

首先，我们来看看如何配置邮件的发件人。换句话说，也就是邮件的「发件人」是谁。配置发件人有两种方式。第一种，在邮件的信封（envelope）上指定「from」地址：

```php
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * 获取消息信封。
 */
public function envelope(): Envelope
{
    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        subject: 'Order Shipped',
    );
}
```

如果需要，你还可以指定 `replyTo` 地址：

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

不过，如果你的应用程序所有邮件都使用同一个「from」地址，在每个生成的邮件类中都添加它就会变得很麻烦。此时，你可以在 `config/mail.php` 配置文件中指定一个全局的「from」地址。如果邮件类中没有指定其他「from」地址，就会使用这个地址：

```php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

此外，你还可以在 `config/mail.php` 配置文件中定义全局的「reply_to」地址：

```php
'reply_to' => [
    'address' => 'example@example.com',
    'name' => 'App Name',
],
```

<a name="configuring-the-view"></a>
### 配置视图

在邮件类的 `content` 方法中，你可以定义 `view`，即渲染邮件内容时应使用哪个模板。由于每封邮件通常使用 [Blade 模板](/docs/{{version}}/blade)来渲染内容，你在构建邮件 HTML 时可以充分发挥 Blade 模板引擎的强大与便利：

```php
/**
 * 获取消息内容定义。
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
    );
}
```

> [!NOTE]
> 你可能希望创建一个 `resources/views/mail` 目录来存放所有邮件模板；不过，你也可以随意将它们放在 `resources/views` 目录中的任何位置。

<a name="plain-text-emails"></a>
#### 纯文本邮件

如果你想为邮件定义一个纯文本版本，可以在创建消息的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数应是一个模板名称，用于渲染邮件内容。你可以同时为邮件定义 HTML 和纯文本两个版本：

```php
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
```

为了便于区分，`html` 参数可用作 `view` 参数的别名：

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

通常，你会希望向视图传递一些数据，以便在渲染邮件 HTML 时使用。有两种方式可以让数据在视图中可用。第一种，邮件类上定义的任何公共属性都会自动对视图可用。例如，你可以将数据传入邮件类的构造函数，并将数据设置为该类上定义的公共属性：

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
     * 创建新消息实例。
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
```

数据被设置为公共属性后，就会自动在视图中可用，因此你可以像在 Blade 模板中访问其他数据一样访问它：

```blade
<div>
    Price: {{ $order->price }}
</div>
```

<a name="via-the-with-parameter"></a>
#### 通过 `with` 参数：

如果你想在数据发送到模板之前自定义邮件数据的格式，可以通过 `Content` 定义的 `with` 参数手动将数据传递给视图。通常，你仍会通过邮件类的构造函数传递数据；不过，你应将这些数据设置为 `protected` 或 `private` 属性，以免数据自动对模板可用：

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
     * 创建新消息实例。
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
```

数据通过 `with` 参数传递后，就会自动在视图中可用，因此你可以像在 Blade 模板中访问其他数据一样访问它：

```blade
<div>
    Price: {{ $orderPrice }}
</div>
```

<a name="attachments"></a>
### 附件

要向邮件添加附件，你需要将附件添加到消息 `attachments` 方法返回的数组中。首先，你可以通过向 `Attachment` 类提供的 `fromPath` 方法传递文件路径来添加附件：

```php
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
```

在向消息附加文件时，你还可以使用 `as` 和 `withMime` 方法指定附件的显示名称和 / 或 MIME 类型：

```php
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
```

<a name="attaching-files-from-disk"></a>
#### 从磁盘附加文件

如果你已在某个[文件系统磁盘](/docs/{{version}}/filesystem)上存储了文件，可以使用 `fromStorage` 附件方法将其附加到邮件中：

```php
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
```

当然，你还可以指定附件的名称和 MIME 类型：

```php
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
```

如果需要指定默认磁盘以外的存储磁盘，可以使用 `fromStorageDisk` 方法：

```php
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
```

<a name="raw-data-attachments"></a>
#### 原始数据附件

`fromData` 附件方法可用于将一段原始字节字符串作为附件附加。例如，如果你已在内存中生成了一个 PDF，想在不写入磁盘的情况下将其附加到邮件中，就可以使用该方法。`fromData` 方法接受一个闭包（用于解析原始数据字节）以及应分配给附件的名称：

```php
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
```

<a name="inline-attachments"></a>
### 内联附件

在邮件中嵌入内联图片通常很麻烦；不过，Laravel 提供了一种便捷的方式来向邮件附加图片。要嵌入内联图片，可以在邮件模板中对 `$message` 变量使用 `embed` 方法。Laravel 会自动让 `$message` 变量在所有邮件模板中可用，因此你无需担心要手动传递它：

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

如果你已有一段希望嵌入邮件模板的原始图片数据字符串，可以调用 `$message` 变量上的 `embedData` 方法。调用 `embedData` 方法时，你需要提供应分配给嵌入图片的文件名：

```blade
<body>
    Here is an image from raw data:

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

<a name="attachable-objects"></a>
### 可附加对象

虽然通过简单的字符串路径向消息附加文件往往已经足够，但在很多情况下，应用程序中可附加的实体是由类来表示的。例如，如果你的应用程序要向消息附加一张照片，应用程序中可能还有一个表示该照片的 `Photo` 模型。既然如此，直接将 `Photo` 模型传递给 `attach` 方法岂不是很方便？可附加对象（Attachable）正是为此而生。

首先，在将被附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。该接口要求你的类定义一个 `toMailAttachment` 方法，返回一个 `Illuminate\Mail\Attachment` 实例：

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
     */
    public function toMailAttachment(): Attachment
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义好可附加对象后，你就可以在构建邮件消息时从 `attachments` 方法返回该对象的实例：

```php
/**
 * 获取消息的附件。
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [$this->photo];
}
```

当然，附件数据也可能存储在 Amazon S3 等远程文件存储服务上。因此，Laravel 还允许你根据应用程序的[文件系统磁盘](/docs/{{version}}/filesystem)上存储的数据生成附件实例：

```php
// 根据默认磁盘上的文件创建附件...
return Attachment::fromStorage($this->path);

// 根据特定磁盘上的文件创建附件...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，你还可以通过内存中的数据创建附件实例。为此，向 `fromData` 方法提供一个闭包。该闭包应返回表示附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了其他一些可用于自定义附件的方法。例如，你可以使用 `as` 和 `withMime` 方法自定义文件的名称和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
    ->as('Photo Name')
    ->withMime('image/jpeg');
```

<a name="headers"></a>
### 邮件头

有时，你可能需要为外发邮件附加额外的邮件头。例如，你可能需要设置自定义的 `Message-Id` 或其他任意文本头。

为此，在邮件类上定义一个 `headers` 方法。`headers` 方法应返回一个 `Illuminate\Mail\Mailables\Headers` 实例。该类接受 `messageId`、`references` 和 `text` 参数。当然，你可以只提供特定消息所需的参数：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * 获取消息头。
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

Mailgun 和 Postmark 等一些第三方邮件服务商支持消息「标签」和「元数据」，可用于对应用程序发送的邮件进行分组和跟踪。你可以通过 `Envelope`定义为邮件添加标签和元数据：

```php
use Illuminate\Mail\Mailables\Envelope;

/**
 * 获取消息信封。
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

如果你的应用程序使用的是 Mailgun 驱动，可以查阅 Mailgun 文档中关于[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的更多信息。同样，Postmark 文档中也提供了其对[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)支持的相关信息。

如果你的应用程序使用 Amazon SES 发送邮件，则应使用 `metadata` 方法将 [SES「标签」](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息上。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

Laravel 的邮件功能由 Symfony Mailer 驱动。Laravel 允许你注册自定义回调，这些回调会在发送消息之前随 Symfony Message 实例一起被调用。这让你有机会在消息发送前对其进行深度定制。为此，在 `Envelope` 定义上定义一个 `using` 参数：

```php
use Illuminate\Mail\Mailables\Envelope;
use Symfony\Component\Mime\Email;

/**
 * 获取消息信封。
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
## Markdown 邮件

Markdown 邮件让你能够在邮件中使用[邮件通知](/docs/{{version}}/notifications#mail-notifications)预置的模板和组件。由于消息使用 Markdown 编写，Laravel 能够为消息渲染出美观、响应式的 HTML 模板，同时自动生成对应的纯文本版本。

<a name="generating-markdown-mailables"></a>
### 生成 Markdown 邮件

要生成带有对应 Markdown 模板的邮件类，可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在邮件类的 `content` 方法中配置 `Content` 定义时，使用 `markdown` 参数代替 `view` 参数：

```php
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
```

<a name="writing-markdown-messages"></a>
### 编写 Markdown 消息

Markdown 邮件结合使用 Blade 组件和 Markdown 语法，让你既能轻松构建邮件消息，又能利用 Laravel 预置的邮件 UI 组件：

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
> 编写 Markdown 邮件时不要使用多余的缩进。按照 Markdown 标准，Markdown 解析器会将缩进的内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中的按钮链接。该组件接受两个参数：`url` 和可选的 `color`。支持的颜色有 `primary`、`success` 和 `error`。你可以在一条消息中添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="success">
View Order
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件会在一个背景色与消息其余部分略有不同的面板中渲染给定的文本块。这让你可以突出显示给定的文本块：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件将 Markdown 表格作为其内容。可使用默认的 Markdown 表格对齐语法来支持表格列对齐：

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

你可以将所有 Markdown 邮件组件导出到自己的应用程序中进行自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

该命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含 `html` 和 `text` 两个目录，各自包含每个可用组件的对应表示形式。你可以随意按自己喜欢的方式自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录中将包含一个 `default.css` 文件。你可以自定义该文件中的 CSS，你的样式将被自动转换为 Markdown 邮件 HTML 表示形式中的内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，可以在 `html/themes` 目录中放置一个 CSS 文件。为 CSS 文件命名并保存后，将应用程序 `config/mail.php` 配置文件的 `theme` 选项更新为新主题的名称。

要为单个邮件自定义主题，你可以将邮件类的 `$theme` 属性设置为发送该邮件时应使用的主题名称。

<a name="sending-mail"></a>
## 发送邮件

要发送消息，请使用 `Mail` [Facade](/docs/{{version}}/facades) 上的 `to` 方法。`to` 方法接受一个电子邮件地址、一个用户实例或一个用户集合。如果你传递的是对象或对象集合，邮件系统在确定邮件收件人时会自动使用它们的 `email` 和 `name` 属性，因此请确保这些属性在对象上可用。指定收件人后，你就可以将邮件类实例传递给 `send` 方法：

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
     * 为给定订单发货。
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 为订单发货...

        Mail::to($request->user())->send(new OrderShipped($order));

        return redirect('/orders');
    }
}
```

发送消息时，你不必局限于只指定「to」收件人。你可以将相应的方法链式调用，自由设置「to」、「cc」和「bcc」收件人：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

<a name="looping-over-recipients"></a>
#### 遍历收件人

有时，你可能需要遍历收件人 / 电子邮件地址数组，将邮件发送给一组收件人。不过，由于 `to` 方法会将电子邮件地址追加到邮件的收件人列表中，循环的每次迭代都会向之前所有收件人再发送一封邮件。因此，你应始终为每个收件人重新创建邮件实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

<a name="sending-mail-via-a-specific-mailer"></a>
#### 通过特定邮件系统发送邮件

默认情况下，Laravel 会使用应用程序 `mail` 配置文件中配置为 `default` 的邮件系统来发送邮件。不过，你可以使用 `mailer` 方法通过特定的邮件系统配置发送消息：

```php
Mail::mailer('postmark')
    ->to($request->user())
    ->send(new OrderShipped($order));
```

<a name="queueing-mail"></a>
### 邮件队列

<a name="queueing-a-mail-message"></a>
#### 队列化邮件消息

由于发送邮件可能对应用程序的响应时间产生负面影响，许多开发者选择将邮件放入队列以便后台发送。Laravel 通过其内置的[统一队列 API](/docs/{{version}}/queues) 让这一切变得轻而易举。要队列化邮件消息，请在指定消息收件人后，使用 `Mail` Facade 上的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

该方法会自动将作业推入队列，消息将在后台发送。使用此功能前，你需要先[配置好队列](/docs/{{version}}/queues)。

<a name="delayed-message-queueing"></a>
#### 延迟消息队列

如果你想延迟已队列化邮件消息的投递，可以使用 `later` 方法。`later` 方法的第一个参数接受一个 `DateTime` 实例，指明消息应在何时发送：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->plus(minutes: 10), new OrderShipped($order));
```

<a name="pushing-to-specific-queues"></a>
#### 推送到特定队列

由于所有使用 `make:mail` 命令生成的邮件类都使用了 `Illuminate\Bus\Queueable` Trait，你可以在任何邮件类实例上调用 `onQueue` 和 `onConnection` 方法，为消息指定连接和队列名称：

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
#### 默认队列化

如果你有一些希望始终入队的邮件类，可以在该类上实现 `ShouldQueue` 契约。这样，即使你在发送邮件时调用的是 `send` 方法，该邮件仍会被放入队列，因为它实现了该契约：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    // ...
}
```

<a name="queued-mailables-and-database-transactions"></a>
#### 队列化邮件与数据库事务

当队列化的邮件在数据库事务中被分发时，队列可能会在数据库事务提交之前就处理它们。一旦发生这种情况，你在数据库事务期间对模型或数据库记录所做的更新可能尚未写入数据库。此外，事务中创建的模型或数据库记录也可能尚不存在于数据库中。如果你的邮件依赖这些模型，那么当发送该队列化邮件的作业被处理时，就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项为 `false`，你仍然可以在发送邮件消息时调用 `afterCommit` 方法，指示特定的队列化邮件应在所有未完成的数据库事务提交后再分发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，你也可以在邮件类的构造函数中调用 `afterCommit` 方法：

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
     * 创建新消息实例。
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解更多关于规避这些问题的方法，请查阅[队列作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)相关文档。

<a name="queued-email-failures"></a>
#### 队列化邮件失败

当队列化的邮件发送失败时，如果队列化邮件类上定义了 `failed` 方法，该方法将被调用。导致队列化邮件失败的 `Throwable` 实例会被传递给 `failed` 方法：

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
     * 处理队列化邮件的失败。
     */
    public function failed(Throwable $exception): void
    {
        // ...
    }
}
```

<a name="rendering-mailables"></a>
## 渲染邮件

有时，你可能希望在不发送邮件的情况下捕获其 HTML 内容。为此，你可以调用邮件类的 `render` 方法。该方法会将邮件渲染后的 HTML 内容作为字符串返回：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

<a name="previewing-mailables-in-the-browser"></a>
### 在浏览器中预览邮件

在设计邮件模板时，能够像预览典型 Blade 模板一样在浏览器中快速预览渲染后的邮件会非常方便。为此，Laravel 允许你从路由闭包或控制器直接返回任何邮件。返回邮件时，它会被渲染并显示在浏览器中，让你无需发送到真实电子邮件地址即可快速预览其设计：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

<a name="localizing-mailables"></a>
## 邮件本地化

Laravel 允许你以不同于请求当前语言区域（locale）的语言发送邮件，并且即使邮件被放入队列，也会记住该语言区域。

为此，`Mail` Facade 提供了一个 `locale` 方法来设置期望的语言。应用程序在渲染邮件模板时会切换到该语言区域，渲染完成后再恢复为之前的语言区域：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

<a name="user-preferred-locales"></a>
#### 用户首选语言区域

有时，应用程序会存储每个用户的首选语言区域。通过在一个或多个模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送邮件时使用该存储的语言区域：

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

实现该接口后，Laravel 在向该模型发送邮件和通知时会自动使用其首选语言区域。因此，使用该接口时无需再调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

<a name="testing-mailables"></a>
## 测试

<a name="testing-mailable-content"></a>
### 测试邮件内容

Laravel 提供了多种检查邮件结构的方法。此外，Laravel 还提供了几个便捷的方法，用于测试邮件是否包含你期望的内容：

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

正如你所料，「HTML」断言用于断言邮件的 HTML 版本包含给定字符串，而「text」断言用于断言邮件的纯文本版本包含给定字符串。

<a name="testing-mailable-sending"></a>
### 测试邮件发送

我们建议将邮件内容的测试与断言给定邮件已「发送」给特定用户的测试分开进行。通常，邮件的内容与你正在测试的代码无关，只需断言 Laravel 已被指示发送给定的邮件即可。

你可以使用 `Mail` Facade 的 `fake` 方法来阻止邮件发送。调用 `Mail` Facade 的 `fake` 方法后，你就可以断言哪些邮件已被指示发送给用户，甚至可以检查邮件收到的数据：

```php tab=Pest
<?php

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

test('orders can be shipped', function () {
    Mail::fake();

    // 执行订单发货...

    // 断言没有发送任何邮件...
    Mail::assertNothingSent();

    // 断言某个邮件已发送...
    Mail::assertSent(OrderShipped::class);

    // 断言某个邮件被发送了两次...
    Mail::assertSent(OrderShipped::class, 2);

    // 断言某个邮件已发送到某个电子邮件地址...
    Mail::assertSent(OrderShipped::class, 'example@laravel.com');

    // 断言某个邮件已发送到多个电子邮件地址...
    Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

    // 断言某个邮件未被发送...
    Mail::assertNotSent(AnotherMailable::class);

    // 断言某个邮件被发送了两次...
    Mail::assertSentTimes(OrderShipped::class, 2);

    // 断言总共发送了 3 封邮件...
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

        // 执行订单发货...

        // 断言没有发送任何邮件...
        Mail::assertNothingSent();

        // 断言某个邮件已发送...
        Mail::assertSent(OrderShipped::class);

        // 断言某个邮件被发送了两次...
        Mail::assertSent(OrderShipped::class, 2);

        // 断言某个邮件已发送到某个电子邮件地址...
        Mail::assertSent(OrderShipped::class, 'example@laravel.com');

        // 断言某个邮件已发送到多个电子邮件地址...
        Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

        // 断言某个邮件未被发送...
        Mail::assertNotSent(AnotherMailable::class);

        // 断言某个邮件被发送了两次...
        Mail::assertSentTimes(OrderShipped::class, 2);

        // 断言总共发送了 3 封邮件...
        Mail::assertSentCount(3);
    }
}
```

如果你将邮件放入队列以便后台投递，则应使用 `assertQueued` 方法代替 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);
Mail::assertNotQueued(OrderShipped::class);
Mail::assertNothingQueued();
Mail::assertQueuedCount(3);
```

你还可以使用 `assertOutgoingCount` 方法断言已发送或入队的邮件总数：

```php
Mail::assertOutgoingCount(3);
```

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传递一个闭包，以断言某个通过给定「真实性测试」的邮件已被发送。只要至少有一个被发送的邮件通过了给定的真实性测试，断言就会成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

调用 `Mail` Facade 的断言方法时，所提供闭包接收到的邮件实例提供了一些实用的方法，可用于检查邮件：

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

邮件实例还包含几个用于检查邮件附件的实用方法：

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

你可能已经注意到，有两种断言邮件未被发送的方法：`assertNotSent` 和 `assertNotQueued`。有时你可能希望断言邮件既未发送**也**未入队。为此，你可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

<a name="mail-and-local-development"></a>
## 邮件与本地开发

在开发一个发送邮件的应用程序时，你多半不希望真的把邮件发送到真实的电子邮件地址。Laravel 提供了几种在本地开发期间「禁用」实际邮件发送的方式。

<a name="log-driver"></a>
#### Log 驱动

`log` 邮件驱动不会实际发送邮件，而是将所有邮件消息写入日志文件以供检查。通常，该驱动只应在本地开发期间使用。要了解更多关于按环境配置应用程序的信息，请查阅[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="mailtrap"></a>
#### HELO / Mailtrap / Mailpit

或者，你可以使用 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 之类的服务配合 `smtp` 驱动，将邮件消息发送到一个「虚拟」邮箱中，然后在真实的邮件客户端里查看它们。这种方式的好处是，你可以实际检查 Mailtrap 消息查看器中的最终邮件。

如果你使用的是 [Laravel Sail](/docs/{{version}}/sail)，可以通过 [Mailpit](https://github.com/axllent/mailpit) 预览消息。Sail 运行时，你可以通过 `http://localhost:8025` 访问 Mailpit 界面。

<a name="using-a-global-to-address"></a>
#### 使用全局 `to` 地址

最后，你可以通过调用 `Mail` Facade 提供的 `alwaysTo` 方法来指定一个全局的「to」地址。通常，该方法应在应用程序某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Mail;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

使用 `alwaysTo` 方法时，邮件消息上的任何附加「cc」或「bcc」地址都将被移除。

<a name="events"></a>
## 事件

Laravel 在发送邮件的过程中会触发两个事件。`MessageSending` 事件在消息发送之前触发，`MessageSent` 事件在消息发送之后触发。请记住，这些事件是在邮件被*发送*时触发的，而不是在入队时。你可以在应用程序中为这些事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Mail\Events\MessageSending;
// use Illuminate\Mail\Events\MessageSent;

class LogMessage
{
    /**
     * 处理事件。
     */
    public function handle(MessageSending $event): void
    {
        // ...
    }
}
```

<a name="custom-transports"></a>
## 自定义传输

Laravel 包含多种邮件传输；不过，你可能希望编写自己的传输，以便通过 Laravel 未内置支持的其他服务投递邮件。首先，定义一个继承 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在你的传输上实现 `doSend` 和 `__toString` 方法：

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
     * 创建新的 Mailchimp 传输实例。
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
     * 获取传输的字符串表示。
     */
    public function __toString(): string
    {
        return 'mailchimp';
    }
}
```

定义好自定义传输后，你可以通过 `Mail` Facade 提供的 `extend` 方法注册它。通常，这应在应用程序 `AppServiceProvider` 的 `boot` 方法中完成。传递给 `extend` 方法的闭包会接收一个 `$config` 参数。该参数包含应用程序 `config/mail.php` 配置文件中为该邮件系统定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;
use MailchimpTransactional\ApiClient;

/**
 * 引导任何应用程序服务。
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

定义并注册好自定义传输后，你就可以在应用程序的 `config/mail.php` 配置文件中创建使用该新传输的邮件系统定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    'key' => env('MAILCHIMP_API_KEY'),
    // ...
],
```

<a name="additional-symfony-transports"></a>
### 其他 Symfony 传输

Laravel 内置支持一些由 Symfony 维护的现有邮件传输，如 Mailgun 和 Postmark。不过，你可能希望为 Laravel 扩展对其他 Symfony 维护的传输的支持。你可以通过 Composer 引入所需的 Symfony mailer，并在 Laravel 中注册该传输来实现。例如，你可以安装并注册「Brevo」（原「Sendinblue」）Symfony mailer：

```shell
composer require symfony/brevo-mailer symfony/http-client
```

安装 Brevo mailer 包后，你可以在应用程序的 `services` 配置文件中为 Brevo API 凭证添加一个条目：

```php
'brevo' => [
    'key' => env('BREVO_API_KEY'),
],
```

接下来，你可以使用 `Mail` Facade 的 `extend` 方法向 Laravel 注册该传输。通常，这应在某个服务提供者的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

/**
 * 引导任何应用程序服务。
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

注册好传输后，你就可以在应用程序的 `config/mail.php` 配置文件中创建使用该新传输的邮件系统定义：

```php
'brevo' => [
    'transport' => 'brevo',
    // ...
],
```
