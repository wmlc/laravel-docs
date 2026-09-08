# 邮件

## 简介

发送电子邮件未必复杂。Laravel 提供了一个简洁、易用的邮件 API，由流行的 [Symfony Mailer](https://symfony.com/doc/current/mailer.html) 组件驱动。Laravel 与 Symfony Mailer 为通过 SMTP、Cloudflare、Mailgun、Postmark、Resend、Amazon SES 以及 `sendmail` 发送邮件提供了驱动，让你能够快速上手，通过你选择的本地或云服务发送邮件。

### 配置

Laravel 的邮件服务可以通过应用的 `config/mail.php` 配置文件进行配置。该文件中配置的每个邮件发送器（mailer）都可以拥有自己独特的配置，甚至自己独特的"传输（transport）"，使你的应用能够使用不同的邮件服务来发送特定类型的邮件。例如，你的应用可以使用 Postmark 发送事务性邮件，同时使用 Amazon SES 发送批量邮件。

在 `mail` 配置文件中，你会看到一个 `mailers` 配置数组。该数组包含 Laravel 支持的各大邮件驱动 / 传输（transport）的示例配置项，而 `default` 配置值决定了当应用需要发送邮件时默认使用哪个邮件发送器。

### 驱动 / 传输前置条件

基于 API 的驱动（如 Mailgun、Postmark 和 Resend）通常比通过 SMTP 服务器发送邮件更简单、更快速。只要条件允许，我们建议你使用其中之一。

#### Cloudflare 驱动

要使用 Cloudflare 驱动，通过 Composer 安装 Symfony 的 HTTP Client：

```shell
composer require symfony/http-client
```

接下来，你需要对应用的 `config/mail.php` 配置文件做两处修改。首先，将默认邮件发送器（mailer）设为 `cloudflare`：

```php
'default' => env('MAIL_MAILER', 'cloudflare'),
```

其次，向你的 `mailers` 数组中添加以下配置数组：

```php
'cloudflare' => [
    'transport' => 'cloudflare',
],
```

配置好应用的默认邮件发送器后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'cloudflare' => [
    'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
    'key' => env('CLOUDFLARE_KEY'),
],
```

#### Mailgun 驱动

要使用 Mailgun 驱动，通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，你需要对应用的 `config/mail.php` 配置文件做两处修改。首先，将默认邮件发送器设为 `mailgun`：

```php
'default' => env('MAIL_MAILER', 'mailgun'),
```

其次，向你的 `mailers` 数组中添加以下配置数组：

```php
'mailgun' => [
    'transport' => 'mailgun',
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

配置好应用的默认邮件发送器后，请确保 `config/services.php` 配置文件中包含以下选项：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
],
```

如果你使用的不是美国 [Mailgun 区域](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview#mailgun-regions)，可以在 `services` 配置文件中定义你所在区域的端点（endpoint）：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
    'scheme' => 'https',
],
```

#### Postmark 驱动

要使用 [Postmark](https://postmarkapp.com/) 驱动，通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，将应用的 `config/mail.php` 配置文件中的 `default` 选项设为 `postmark`。配置好应用的默认邮件发送器后，请确保 `config/services.php` 配置文件包含以下选项：

```php
'postmark' => [
    'key' => env('POSTMARK_API_KEY'),
],
```

如果你想指定某个邮件发送器应使用的 Postmark 消息流（message stream），可以向该邮件发送器的配置数组中添加 `message_stream_id` 配置项。该配置数组位于应用的 `config/mail.php` 配置文件中：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

这样，你还可以设置多个使用不同消息流的 Postmark 邮件发送器。

#### Resend 驱动

要使用 [Resend](https://resend.com/) 驱动，通过 Composer 安装 Resend 的 PHP SDK：

```shell
composer require resend/resend-php
```

接下来，将应用的 `config/mail.php` 配置文件中的 `default` 选项设为 `resend`。配置好应用的默认邮件发送器后，请确保 `config/services.php` 配置文件包含以下选项：

```php
'resend' => [
    'key' => env('RESEND_API_KEY'),
],
```

#### SES 驱动

要使用 Amazon SES 驱动，你首先必须安装 Amazon AWS SDK for PHP。你可以通过 Composer 包管理器安装这个库：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `config/mail.php` 配置文件中的 `default` 选项设为 `ses`，并确认 `config/services.php` 配置文件包含以下选项：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
],
```

要通过会话令牌使用 AWS [临时凭据](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，可以向应用的 SES 配置中添加一个 `token` 键：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

要与 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)交互，可以在邮件消息的 `headers` 方法返回的数组中返回 `X-Ses-List-Management-Options` 标头（header）：

```php
/**
 * 获取消息标头。
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

要通过 SES [租户（tenant）](https://docs.aws.amazon.com/ses/latest/dg/tenants.html)发送邮件，可以从 `headers` 方法返回 `X-Ses-Tenant-Name` 标头。发送邮件时，Laravel 会将该标头的值作为 `TenantName` 选项传递给 SES：

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

如果你想定义额外的选项，让 Laravel 在发送邮件时将其传给 AWS SDK 的 `SendEmail` 方法，可以在 `ses` 配置中定义一个 `options` 数组：

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

### 故障转移配置

有时，你配置用来发送应用邮件的外部服务可能会宕机。在这种情况下，定义一个或多个备用的邮件发送配置会很有用，以便当主发送驱动不可用时使用。

为此，你应在应用的 `mail` 配置文件中定义一个使用 `failover` 传输（transport）的邮件发送器。该 failover 邮件发送器的配置数组应包含一个 `mailers` 数组，用于指明在发送时应按何种顺序选择已配置的邮件发送器：

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

配置好使用 `failover` 传输的邮件发送器后，你需要在应用的 `.env` 文件中将该 failover 邮件发送器设为默认邮件发送器，才能使用故障转移功能：

```ini
MAIL_MAILER=failover
```

### 轮询配置

`roundrobin` 传输（transport）允许你将邮件发送工作负载分布到多个邮件发送器上。首先，在应用的 `mail` 配置文件中定义一个使用 `roundrobin` 传输的邮件发送器。该 roundrobin 邮件发送器的配置数组应包含一个 `mailers` 数组，用于指明应使用哪些已配置的邮件发送器进行发送：

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

定义好 round robin 邮件发送器后，应通过在其名称作为应用 `mail` 配置文件中 `default` 配置键的值，将它设为应用使用的默认邮件发送器：

```php
'default' => env('MAIL_MAILER', 'roundrobin'),
```

roundrobin 传输会从已配置的邮件发送器列表中随机选择一个，并在每封后续邮件时切换到下一个可用的邮件发送器。与用于实现[高可用性](https://en.wikipedia.org/wiki/High_availability)的 `failover` 传输不同，`roundrobin` 传输提供的是[负载均衡](https://en.wikipedia.org/wiki/Load_balancing_(computing))。

## 生成 Mailable

在构建 Laravel 应用时，应用发送的每种邮件都由一个"可邮寄类（Mailable）"来表示。这些类存放在 `app/Mail` 目录中。即使你的应用中没有看到这个目录也不必担心，因为当你使用 `make:mail` Artisan 命令创建第一个可邮寄类时，它会自动为你生成：

```shell
php artisan make:mail OrderShipped
```

## 编写 Mailable

一旦生成了可邮寄类，打开它我们就能查看其内容。可邮寄类的配置是在多个方法中完成的，包括 `envelope`、`content` 和 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，该对象定义了邮件的主题，有时也包括收件人。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，该对象定义了将用于生成邮件内容的 [Blade 模板](/topic/Laravel%2013.x/wevwmrz9l2.html)。

### 配置发件人

#### 使用 Envelope

首先，我们来了解如何配置邮件的发送者。换句话说，就是邮件的"发件人"是谁。配置发送者有两种方式。首先，你可以在邮件的 envelope 上指定 "from" 地址：

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

#### 使用全局 `from` 地址

不过，如果你的应用所有邮件都使用同一个 "from" 地址，那么为每次生成的可邮寄类都添加该地址会变得繁琐。相反，你可以在 `config/mail.php` 配置文件中指定一个全局 "from" 地址。如果在可邮寄类中没有指定其他 "from" 地址，就会使用这个地址：

```php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

此外，你还可以在 `config/mail.php` 配置文件中定义一个全局 "reply_to" 地址：

```php
'reply_to' => [
    'address' => 'example@example.com',
    'name' => 'App Name',
],
```

### 配置视图

在可邮寄类的 `content` 方法中，你可以定义 `view`，即渲染邮件内容时应使用的模板。由于每封邮件通常都使用 [Blade 模板](/topic/Laravel%2013.x/wevwmrz9l2.html)来渲染内容，在构建邮件的 HTML 时，你可以充分利用 Blade 模板引擎的全部能力与便利：

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
> 你可以创建一个 `resources/views/mail` 目录来存放所有邮件模板；不过，你也可以自由地将它们放在 `resources/views` 目录中的任意位置。

#### 纯文本邮件

如果你想定义邮件的纯文本版本，可以在创建邮件的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数也应是一个用于渲染邮件内容的模板名。你可以自由地同时定义邮件的 HTML 版本和纯文本版本：

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

为了表述清晰，`html` 参数可作为 `view` 参数的别名使用：

```php
return new Content(
    html: 'mail.orders.shipped',
    text: 'mail.orders.shipped-text'
);
```

### 视图数据

#### 通过公共属性

通常，你会希望向视图传递一些数据，以便在渲染邮件 HTML 时使用。让数据对视图可用有两种方式。首先，在可邮寄类上定义的任何公共属性都会自动对视图可用。因此，例如，你可以将数据传入可邮寄类的构造函数，并将其赋给类中定义的公共属性：

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
```

一旦将数据赋给公共属性，它就会自动在视图中可用，因此你可以像访问 Blade 模板中任何其他数据一样访问它：

```blade
<div>
    Price: {{ $order->price }}
</div>
```

#### 通过 `with` 参数

如果你想在将数据发送到模板之前自定义邮件数据的格式，可以通过 `Content` 定义的 `with` 参数手动将数据传给视图。通常，你仍然会通过可邮寄类的构造函数传入数据；不过，应将数据设为 `protected` 或 `private` 属性，这样数据就不会自动对模板可用：

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
```

一旦通过 `with` 参数传入数据，它就会自动在视图中可用，因此你可以像访问 Blade 模板中任何其他数据一样访问它：

```blade
<div>
    Price: {{ $orderPrice }}
</div>
```

### 附件

要为邮件添加附件，你需要将附件添加到邮件消息的 `attachments` 方法所返回的数组中。首先，你可以通过 `Attachment` 类提供的 `fromPath` 方法，并传入文件路径来添加附件：

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

为消息附加文件时，你还可以使用 `as` 和 `withMime` 方法指定附件的显示名称和 / 或 MIME 类型：

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

#### 从磁盘附加文件

如果你已将文件存储在某个[文件系统磁盘](/topic/Laravel%2013.x/qk9428ovw1.html)上，可以使用 `fromStorage` 附件方法将其附加到邮件中：

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

当然，你也可以指定附件的名称和 MIME 类型：

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

如果你需要指定默认磁盘以外的存储磁盘，可以使用 `fromStorageDisk` 方法：

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

#### 原始数据附件

`fromData` 附件方法可用于将原始字节字符串作为附件附加。例如，如果你在内存中生成了一个 PDF，并希望将其作为附件添加到邮件中而不写入磁盘，就可以使用这个方法。`fromData` 方法接受一个闭包，该闭包用于解析原始数据字节，以及附件应被赋予的名称：

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

### 内联附件

将内联图片嵌入邮件通常比较麻烦；不过，Laravel 提供了一种便捷的方式来为邮件附加图片。要嵌入内联图片，可以在邮件模板中使用 `$message` 变量上的 `embed` 方法。Laravel 会自动让 `$message` 变量对所有邮件模板可用，因此你无需手动传入：

```blade
<body>
    Here is an image:

    <img src="{{ $message->embed($pathToImage) }}">
</body>
```

> [!WARNING]
> `$message` 变量在纯文本消息模板中不可用，因为纯文本消息不使用内联附件。

#### 嵌入原始数据附件

如果你已经有一个希望嵌入邮件模板的原始图片数据字符串，可以调用 `$message` 变量上的 `embedData` 方法。调用 `embedData` 方法时，你需要提供一个应赋予嵌入图片的文件名：

```blade
<body>
    Here is an image from raw data:

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

### 可附加对象

虽然通过简单的字符串路径为消息附加文件往往已经足够，但在许多情况下，应用中可附加的实体是由类来表示的。例如，如果你的应用要将一张照片附加到消息中，你的应用可能还有一个代表该照片的 `Photo` 模型。在这种情况下，如果能直接将 `Photo` 模型传给 `attach` 方法，岂不是很方便？可附加对象（Attachable）让你可以做到这一点。

首先，在可附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。该接口要求你的类定义一个 `toMailAttachment` 方法，该方法返回一个 `Illuminate\Mail\Attachment` 实例：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Mail\Attachable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Attachment;

class Photo extends Model implements Attachable
{
    /**
     * 获取模型的附件表现形式。
     */
    public function toMailAttachment(): Attachment
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义好可附加对象后，在构建邮件消息时，你可以从 `attachments` 方法返回该对象的一个实例：

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

当然，附件数据也可能存储在 Amazon S3 等远程文件存储服务上。因此，Laravel 也允许你根据应用某个[文件系统磁盘](/topic/Laravel%2013.x/qk9428ovw1.html)上存储的数据来生成附件实例：

```php
// 从默认磁盘上的文件创建附件...
return Attachment::fromStorage($this->path);

// 从特定磁盘上的文件创建附件...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，你还可以根据内存中已有的数据创建附件实例。为此，向 `fromData` 方法传入一个闭包。该闭包应返回代表附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了其他一些可用于自定义附件的方法。例如，你可以使用 `as` 和 `withMime` 方法自定义文件的名称和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
    ->as('Photo Name')
    ->withMime('image/jpeg');
```

### 请求头

有时你可能需要为外发消息附加额外的标头（header）。例如，你可能需要设置自定义的 `Message-Id` 或其他任意文本标头。

为此，可以在可邮寄类上定义一个 `headers` 方法。`headers` 方法应返回一个 `Illuminate\Mail\Mailables\Headers` 实例。该类接受 `messageId`、`references` 和 `text` 参数。当然，你只需提供特定消息所需的参数即可：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * 获取消息标头。
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

### 标签与元数据

一些第三方邮件服务商（如 Mailgun 和 Postmark）支持消息的"标签（tag）"和"元数据（metadata）"，可用于对应用发送的邮件进行分组和跟踪。你可以通过 `Envelope` 定义为邮件消息添加标签和元数据：

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

如果你的应用使用的是 Mailgun 驱动，可以查阅 Mailgun 的文档，了解有关[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的更多信息。同理，也可以查阅 Postmark 的文档，了解其支持的[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)。

如果你的应用使用 Amazon SES 发送邮件，应使用 `metadata` 方法将 SES 的[标签](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html)附加到消息上。

### 自定义 Symfony Message

Laravel 的邮件能力由 Symfony Mailer 驱动。Laravel 允许你注册自定义回调，这些回调会在发送消息之前使用 Symfony Message 实例被调用。这让你可以深入地自定义消息后再发送。为此，可以在 `Envelope` 定义中添加一个 `using` 参数：

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

## Markdown Mailable

Markdown 可邮寄类消息让你能够在可邮寄类中使用邮件通知（mail notifications）预置的模板与组件。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染美观、响应式的 HTML 模板，同时还会自动生成对应的纯文本版本。

### 生成 Markdown Mailable

要生成一个带有对应 Markdown 模板的可邮寄类，可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在可邮寄类的 `content` 方法中配置 `Content` 定义时，使用 `markdown` 参数代替 `view` 参数：

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

### 编写 Markdown 消息

Markdown 可邮寄类结合了 Blade 组件与 Markdown 语法，让你在利用 Laravel 预置的邮件 UI 组件的同时，轻松构建邮件消息：

```blade
<x-mail::message>
# 订单已发货

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

#### 按钮组件

按钮组件会渲染一个居中的按钮链接。该组件接受两个参数：`url` 和一个可选的 `color`。支持的颜色有 `primary`、`success` 和 `error`。你可以根据需要向消息中添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="success">
View Order
</x-mail::button>
```

#### 面板组件

面板组件会将给定的文本块渲染在一个背景色与消息其余部分略有不同的面板中。这让你能够吸引读者关注某个特定的文本块：

```blade
<x-mail::panel>
This is the panel content.
</x-mail::panel>
```

#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。使用默认的 Markdown 表格对齐语法即可支持表格列的对齐：

```blade
<x-mail::table>
| Laravel       | Table         | Example       |
| ------------- | :-----------: | ------------: |
| Col 2 is      | Centered      | $10           |
| Col 3 is      | Right-Aligned | $20           |
</x-mail::table>
```

### 自定义组件

你可以将所有 Markdown 邮件组件导出到你自己的应用中进行自定义。要导出组件，可以使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签（asset tag）：

```shell
php artisan vendor:publish --tag=laravel-mail
```

该命令会将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录中会包含 `html` 和 `text` 两个子目录，分别存放每个可用组件的对应形态。你可以随心所欲地自定义这些组件。

#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录中会包含一个 `default.css` 文件。你可以自定义该文件中的 CSS，这些样式会自动转换为 Markdown 邮件消息 HTML 形态中的内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一套全新的主题（theme），可以将一个 CSS 文件放在 `html/themes` 目录中。命名并保存 CSS 文件后，更新应用 `config/mail.php` 配置文件中的 `theme` 选项，使其与新主题的名称一致。

要为单个可邮寄类自定义主题（theme），可以将可邮寄类的 `$theme` 属性设为发送该可邮寄类时应使用的主题名称。

## 发送邮件

要发送消息，可以使用 `Mail` Facade 上的 `to` 方法。`to` 方法接受电子邮件地址、用户实例或用户集合。如果你传入对象或对象集合，邮件发送器（mailer）会在确定邮件收件人时自动使用它们的 `email` 和 `name` 属性，因此请确保这些属性在你的对象上可用。指定收件人后，你就可以将可邮寄类的实例传给 `send` 方法：

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
     * 发货给定订单。
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 发货...

        Mail::to($request->user())->send(new OrderShipped($order));

        return redirect('/orders');
    }
}
```

在发送消息时，你并不局限于只指定 "to" 收件人。你可以通过链式调用各自的方法，自由地设置 "to"、"cc" 和 "bcc" 收件人：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

#### 遍历收件人

有时，你可能需要遍历收件人数组 / 电子邮件地址列表，将可邮寄类发送给一组收件人。然而，由于 `to` 方法会将电子邮件地址追加到可邮寄类的收件人列表中，循环中的每次迭代都会向之前的每个收件人再发送一封邮件。因此，你应该始终为每个收件人重新创建可邮寄类实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

#### 通过指定 Mailer 发送邮件

默认情况下，Laravel 会使用在应用 `mail` 配置文件中被设为 `default` 的邮件发送器来发送邮件。不过，你可以使用 `mailer` 方法，通过特定的邮件发送器配置来发送消息：

```php
Mail::mailer('postmark')
    ->to($request->user())
    ->send(new OrderShipped($order));
```

### 将邮件加入队列

#### 将邮件消息加入队列

由于发送电子邮件会对应用的响应时间产生负面影响，许多开发者选择将电子邮件消息加入队列以便在后台发送。Laravel 通过其内置的[统一队列 API](/topic/Laravel%2013.x/wevwmkz9l2.html)让这一切变得简单。要将邮件消息加入队列，可以在指定消息收件人后，使用 `Mail` Facade 上的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

该方法会自动负责将任务推入队列，从而使消息在后台发送。在使用此功能之前，你需要先[配置队列](/topic/Laravel%2013.x/wevwmkz9l2.html)。

#### 延迟消息队列

如果你想延迟已入队邮件消息的投递，可以使用 `later` 方法。`later` 方法接受的第一参数是一个 `DateTime` 实例，用于指明消息应在何时发送：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->plus(minutes: 10), new OrderShipped($order));
```

#### 推送到特定队列

由于所有使用 `make:mail` 命令生成的可邮寄类都使用了 `Illuminate\Bus\Queueable` Trait，你可以在任何可邮寄类实例上调用 `onQueue` 和 `onConnection` 方法，从而指定消息的连接和队列名称：

```php
$message = (new OrderShipped($order))
    ->onConnection('sqs')
    ->onQueue('emails');

Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue($message);
```

或者，你也可以使用可邮寄类上的 `Connection` 和 `Queue` 属性来指定连接和队列：

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

#### 默认加入队列

如果你希望某些可邮寄类始终被加入队列，可以在类上实现 `ShouldQueue` 契约（contract）。这样一来，即使在发送时调用的是 `send` 方法，由于该类实现了该契约，可邮寄类仍会被加入队列：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    // ...
}
```

#### 队列 Mailable 与数据库事务

当队列化的可邮寄类在数据库事务中被派发时，它们可能会在数据库事务提交之前就被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能还没有反映到数据库中。此外，事务内创建的任何模型或数据库记录可能还不存在于数据库中。如果你的可邮寄类依赖这些模型，那么在发送队列化可邮寄类的任务被处理时，就可能出现意外错误。

如果你的队列连接的 `after_commit` 配置选项被设为 `false`，你仍然可以通过在发送邮件消息时调用 `afterCommit` 方法，指示某个特定的队列化可邮寄类应在所有已打开的数据库事务提交后再派发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，你也可以从可邮寄类的构造函数中调用 `afterCommit` 方法：

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
     * 创建一个新的消息实例。
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解如何规避这些问题，请查阅有关[队列任务与数据库事务](/topic/Laravel%2013.x/wevwmkz9l2.html)的文档。

#### 队列邮件失败

当队列化的电子邮件失败时，如果队列化可邮寄类上定义了 `failed` 方法，该方法会被调用。导致队列化邮件失败的 `Throwable` 实例会被传给 `failed` 方法：

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

## 渲染 Mailable

有时你可能希望在不发送的情况下捕获可邮寄类的 HTML 内容。为此，可以调用可邮寄类的 `render` 方法。该方法会以字符串形式返回可邮寄类被求值后的 HTML 内容：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

### 在浏览器中预览 Mailable

在设计可邮寄类的模板时，能像普通 Blade 模板一样在浏览器中快速预览渲染后的可邮寄类会很方便。因此，Laravel 允许你直接从路由闭包或控制器返回任何可邮寄类。当返回可邮寄类时，它会被渲染并显示在浏览器中，让你无需将其发送到真实的电子邮件地址就能快速预览其设计：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

## 本地化 Mailable

Laravel 允许你以请求当前区域设置（locale）以外的语言发送可邮寄类，并且即使邮件被加入队列，也会记住该区域设置。

为此，`Mail` Facade 提供了 `locale` 方法来设置所需的语言。在可邮寄类的模板被求值时，应用会切换到该区域设置；求值完成后，再切换回之前的区域设置：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

#### 用户首选语言

有时，应用会存储每个用户的偏好区域设置。通过在一个或多个模型上实现 `HasLocalePreference` 契约（contract），你可以指示 Laravel 在发送邮件时使用这个存储的区域设置：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * 获取用户的偏好区域设置。
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

一旦实现了该接口，Laravel 在向该模型发送可邮寄类和通知时会自动使用其偏好区域设置。因此，在使用该接口时无需再调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

## 测试

### 测试 Mailable 内容

Laravel 提供了多种方法来检查可邮寄类的结构。此外，Laravel 还提供了若干便捷方法，用于测试可邮寄类是否包含你期望的内容：

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

正如你所预期的，"HTML" 断言用于判断可邮寄类的 HTML 版本是否包含给定字符串，而 "text" 断言则用于判断可邮寄类的纯文本版本是否包含给定字符串。

### 测试 Mailable 发送

我们建议将可邮寄类内容的测试，与断言某个可邮寄类已被 "发送" 给特定用户的测试分开进行。通常，可邮寄类的内容与你正在测试的代码无关，只需简单地断言 Laravel 已收到发送某个可邮寄类的指令即可。

你可以使用 `Mail` Facade 的 `fake` 方法来阻止邮件被实际发送。调用 `Mail` Facade 的 `fake` 方法后，你就可以断言可邮寄类已被指示发送给用户，甚至可以检查可邮寄类接收到的数据：

```php tab=Pest
<?php

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

test('orders can be shipped', function () {
    Mail::fake();

    // 执行订单发货...

    // 断言没有任何可邮寄类被发送...
    Mail::assertNothingSent();

    // 断言某个可邮寄类已被发送...
    Mail::assertSent(OrderShipped::class);

    // 断言某个可邮寄类被发送了两次...
    Mail::assertSent(OrderShipped::class, 2);

    // 断言某个可邮寄类被发送到了一个电子邮件地址...
    Mail::assertSent(OrderShipped::class, 'example@laravel.com');

    // 断言某个可邮寄类被发送到了多个电子邮件地址...
    Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

    // 断言某个可邮寄类未被发送...
    Mail::assertNotSent(AnotherMailable::class);

    // 断言某个可邮寄类被发送了两次...
    Mail::assertSentTimes(OrderShipped::class, 2);

    // 断言总共发送了 3 个可邮寄类...
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

        // 断言没有任何可邮寄类被发送...
        Mail::assertNothingSent();

        // 断言某个可邮寄类已被发送...
        Mail::assertSent(OrderShipped::class);

        // 断言某个可邮寄类被发送了两次...
        Mail::assertSent(OrderShipped::class, 2);

        // 断言某个可邮寄类被发送到了一个电子邮件地址...
        Mail::assertSent(OrderShipped::class, 'example@laravel.com');

        // 断言某个可邮寄类被发送到了多个电子邮件地址...
        Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

        // 断言某个可邮寄类未被发送...
        Mail::assertNotSent(AnotherMailable::class);

        // 断言某个可邮寄类被发送了两次...
        Mail::assertSentTimes(OrderShipped::class, 2);

        // 断言总共发送了 3 个可邮寄类...
        Mail::assertSentCount(3);
    }
}
```

如果你将可邮寄类加入队列以便在后台投递，应该使用 `assertQueued` 方法而不是 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);
Mail::assertNotQueued(OrderShipped::class);
Mail::assertNothingQueued();
Mail::assertQueuedCount(3);
```

你还可以使用 `assertOutgoingCount` 方法断言已发送或已加入队列的可邮寄类总数：

```php
Mail::assertOutgoingCount(3);
```

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传入一个闭包，以断言被发送的某个可邮寄类通过了给定的 "真值测试（truth test）"。只要至少有一个可邮寄类通过了该真值测试，断言就会成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

在调用 `Mail` Facade 的断言方法时，所提供的闭包所接受的可邮寄类实例暴露了一些用于检查该可邮寄类的实用方法：

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

该可邮寄类实例还包含几个用于检查可邮寄类附件的实用方法：

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

你可能已经注意到，有两个方法用于断言邮件未被发送：`assertNotSent` 和 `assertNotQueued`。有时你可能希望断言没有任何邮件被**发送或**加入队列。为此，可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

## 邮件与本地开发

在开发会发送邮件的应用时，你可能并不想真正将邮件发送到真实的电子邮件地址。Laravel 提供了几种在本地开发期间 "禁用" 邮件实际发送的方式。

#### Log 驱动

`log` 邮件驱动不会真正发送邮件，而是将所有邮件消息写入日志文件以供检查。通常，这个驱动只会在本地开发期间使用。有关按环境配置应用的更多信息，请参阅[配置文档](/topic/Laravel%2013.x/3dykqpoyl0.html)。

#### HELO / Mailtrap / Mailpit

或者，你可以使用 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 这类服务，配合 `smtp` 驱动，将邮件消息发送到一个 "虚拟" 邮箱，然后你就可以在真实的邮件客户端中查看它们。这种方法的优点是，你可以实际在 Mailtrap 的消息查看器中检查最终的邮件。

如果你使用的是 [Laravel Sail](/topic/Laravel%2013.x/e296opw9q7.html)，可以使用 [Mailpit](https://github.com/axllent/mailpit) 预览你的消息。当 Sail 运行时，你可以在以下地址访问 Mailpit 界面：`http://localhost:8025`。

#### 使用全局 `to` 地址

最后，你可以通过调用 `Mail` Facade 提供的 `alwaysTo` 方法，指定一个全局 "收件人（to）" 地址。通常，这个方法应该从应用某个服务提供者（service provider）的 `boot` 方法中调用：

```php
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
```

使用 `alwaysTo` 方法时，邮件消息上的任何额外 "cc" 或 "bcc" 地址都会被移除。

## 事件

在发送邮件消息时，Laravel 会派发两个事件（event）。`MessageSending` 事件在消息发送之前派发，而 `MessageSent` 事件在消息发送之后派发。要注意，这些事件是在邮件*发送*时派发的，而不是在入队时。你可以在应用中为这些事件创建[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)：

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

## 自定义传输方式

Laravel 内置了多种邮件传输（transport）；不过，你可能希望编写自己的传输，以便通过 Laravel 开箱即不支持的其他服务来投递邮件。首先，定义一个继承自 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在该传输上实现 `doSend` 和 `__toString` 方法：

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
```

定义好自定义传输后，可以通过 `Mail` Facade 提供的 `extend` 方法注册它。通常，这应在应用 `AppServiceProvider` 的 `boot` 方法中完成。一个 `$config` 参数会被传给 `extend` 方法所接受的闭包。该参数包含应用在 `config/mail.php` 配置文件中为该邮件发送器定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;
use MailchimpTransactional\ApiClient;

/**
 * 引导任何应用服务。
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

定义并注册好自定义传输后，你就可以在应用的 `config/mail.php` 配置文件中创建一个使用该新传输的邮件发送器定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    'key' => env('MAILCHIMP_API_KEY'),
    // ...
],
```

### 其他 Symfony 传输方式

Laravel 已支持一些由 Symfony 维护的现有邮件传输，如 Mailgun 和 Postmark。不过，你可能希望为 Laravel 扩展对其他 Symfony 维护的传输的支持。你可以通过 Composer 引入所需的 Symfony 邮件组件，并将该传输注册到 Laravel 来实现。例如，你可以安装并注册 "Brevo"（原名 "Sendinblue"）这个 Symfony 邮件组件：

```shell
composer require symfony/brevo-mailer symfony/http-client
```

安装好 Brevo 邮件组件包后，你可以将 Brevo API 凭据的条目添加到应用的 `services` 配置文件中：

```php
'brevo' => [
    'key' => env('BREVO_API_KEY'),
],
```

接下来，你可以使用 `Mail` Facade 的 `extend` 方法将该传输注册到 Laravel。通常，这应在某个服务提供者的 `boot` 方法中完成：

```php
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
```

注册好传输后，你就可以在应用的 `config/mail.php` 配置文件中创建一个使用该新传输的邮件发送器定义：

```php
'brevo' => [
    'transport' => 'brevo',
    // ...
],
```
