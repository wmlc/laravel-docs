# 升级指南

- [从 8.x 升级到 9.0](#upgrade-9.0)

<a name="high-impact-changes"></a>
## 高影响变更

<div class="content-list" markdown="1">

- [更新依赖](#updating-dependencies)
- [Flysystem 3.x](#flysystem-3)
- [Symfony Mailer](#symfony-mailer)

</div>

<a name="medium-impact-changes"></a>
## 中等影响变更

<div class="content-list" markdown="1">

- [多对多关联 `firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法](#belongs-to-many-first-or-new)
- [自定义类型转换与 `null`](#custom-casts-and-null)
- [HTTP 客户端默认超时时间](#http-client-default-timeout)
- [PHP 返回类型](#php-return-types)
- [Postgres "Schema" 配置](#postgres-schema-configuration)
- [`assertDeleted` 方法](#the-assert-deleted-method)
- [`lang` 目录](#the-lang-directory)
- [`password` 规则](#the-password-rule)
- [`when` / `unless` 方法](#when-and-unless-methods)
- [未验证的数组键](#unvalidated-array-keys)

</div>

<a name="upgrade-9.0"></a>
## 从 8.x 升级到 9.0

<a name="estimated-upgrade-time-30-minutes"></a>
#### 预计升级时间：30 分钟

> **Note**  
> 我们尝试记录所有可能的破坏性变更。由于其中一些破坏性变更位于框架的冷门部分，只有部分变更可能实际影响你的应用。想节省时间？你可以使用 [Laravel Shift](https://laravelshift.com/) 来帮助自动化应用升级。

<a name="updating-dependencies"></a>
### 更新依赖

**影响可能性：高**

#### 需要 PHP 8.0.2

Laravel 现在需要 PHP 8.0.2 或更高版本。

#### Composer 依赖

你应该在应用的 `composer.json` 文件中更新以下依赖：

<div class="content-list" markdown="1">

- `laravel/framework` to `^9.0`
- `nunomaduro/collision` to `^6.1`

</div>

此外，请在应用的 `composer.json` 文件中将 `facade/ignition` 替换为 `"spatie/laravel-ignition": "^1.0"`，并将 `pusher/pusher-php-server`（如适用）替换为 `"pusher/pusher-php-server": "^5.0"`。

此外，以下官方包已发布新主版本以支持 Laravel 9.x。如适用，你应在升级前阅读各自的升级指南：

<div class="content-list" markdown="1">

- [Vonage 通知通道 (v3.0)](https://github.com/laravel/vonage-notification-channel/blob/3.x/UPGRADE.md)（替代 Nexmo）

</div>

最后，检查应用使用的其他第三方包，确认你使用了支持 Laravel 9 的正确版本。

<a name="php-return-types"></a>
#### PHP 返回类型

PHP 开始过渡到要求在 `offsetGet`、`offsetSet` 等方法上定义返回类型。鉴于此，Laravel 9 在其代码库中实现了这些返回类型。通常，这不会影响用户编写的代码；但如果你通过扩展 Laravel 核心类来覆盖这些方法之一，就需要在自己的应用或包代码中添加这些返回类型：

<div class="content-list" markdown="1">

- `count(): int`
- `getIterator(): Traversable`
- `getSize(): int`
- `jsonSerialize(): array`
- `offsetExists($key): bool`
- `offsetGet($key): mixed`
- `offsetSet($key, $value): void`
- `offsetUnset($key): void`

</div>

此外，实现 PHP `SessionHandlerInterface` 的方法也添加了返回类型。同样，此变更不太可能影响你自己的应用或包代码：

<div class="content-list" markdown="1">

- `open($savePath, $sessionName): bool`
- `close(): bool`
- `read($sessionId): string|false`
- `write($sessionId, $data): bool`
- `destroy($sessionId): bool`
- `gc($lifetime): int`

</div>

<a name="application"></a>
### 应用

<a name="the-application-contract"></a>
#### `Application` 契约

**影响可能性：低**

`Illuminate\Contracts\Foundation\Application` 接口的 `storagePath` 方法已更新，现在接受一个 `$path` 参数。如果你实现了此接口，应相应更新实现：

    public function storagePath($path = '');
    
类似地，`Illuminate\Foundation\Application` 类的 `langPath` 方法已更新，现在接受一个 `$path` 参数：

    public function langPath($path = '');

#### 异常处理器的 `ignore` 方法

**影响可能性：低**

异常处理器的 `ignore` 方法现在从 `protected` 改为 `public`。默认应用骨架不包含此方法；但如果你手动定义了此方法，应将其可见性更新为 `public`：

```php
public function ignore(string $class);
```

#### 异常处理器契约绑定

**影响可能性：极低**

以前，为了覆盖默认的 Laravel 异常处理器，自定义实现使用 `\App\Exceptions\Handler::class` 类型绑定到服务容器（Service Container）。但现在，你应该使用 `\Illuminate\Contracts\Debug\ExceptionHandler::class` 类型来绑定自定义实现。

### Blade

#### 惰性集合与 `$loop` 变量

**影响可能性：低**

在 Blade 模板中遍历 `LazyCollection` 实例时，`$loop` 变量不再可用，因为访问此变量会导致整个 `LazyCollection` 加载到内存中，从而在此场景下使惰性集合的使用失去意义。

#### Checked / Disabled / Selected Blade 指令

**影响可能性：低**

新增的 `@checked`、`@disabled` 和 `@selected` Blade 指令可能与同名的 Vue 事件冲突。你可以使用 `@@` 来转义指令以避免此冲突：`@@selected`。

### 集合

#### `Enumerable` 契约

**影响可能性：低**

`Illuminate\Support\Enumerable` 契约现在定义了 `sole` 方法。如果你手动实现此接口，应更新实现以反映此新方法：

```php
public function sole($key = null, $operator = null, $value = null);
```

#### `reduceWithKeys` 方法

`reduceWithKeys` 方法已被移除，因为 `reduce` 方法提供了相同的功能。你可以直接将代码改为调用 `reduce` 而非 `reduceWithKeys`。

#### `reduceMany` 方法

`reduceMany` 方法已重命名为 `reduceSpread`，以与其他类似方法的命名保持一致。

### 容器

#### `Container` 契约

**影响可能性：极低**

`Illuminate\Contracts\Container\Container` 契约新增了两个方法定义：`scoped` 和 `scopedIf`。如果你手动实现此契约，应更新实现以反映这些新方法。

#### `ContextualBindingBuilder` 契约

**影响可能性：极低**

`Illuminate\Contracts\Container\ContextualBindingBuilder` 契约现在定义了 `giveConfig` 方法。如果你手动实现此接口，应更新实现以反映此新方法：

```php
public function giveConfig($key, $default = null);
```

### 数据库

<a name="postgres-schema-configuration"></a>
#### Postgres "Schema" 配置

**影响可能性：中**

在应用的 `config/database.php` 配置文件中，用于配置 Postgres 连接搜索路径的 `schema` 配置选项应重命名为 `search_path`。

<a name="schema-builder-doctrine-method"></a>
#### Schema Builder `registerCustomDoctrineType` 方法

**影响可能性：低**

`registerCustomDoctrineType` 方法已从 `Illuminate\Database\Schema\Builder` 类中移除。你可以改用 `DB` Facade 上的 `registerDoctrineType` 方法，或在 `config/database.php` 配置文件中注册自定义 Doctrine 类型。

### Eloquent

<a name="custom-casts-and-null"></a>
#### 自定义类型转换与 `null`

**影响可能性：中**

在之前的 Laravel 版本中，如果转换属性被设置为 `null`，自定义类型转换类的 `set` 方法不会被调用。但此行为与 Laravel 文档不一致。在 Laravel 9.x 中，类型转换类的 `set` 方法会以 `null` 作为 `$value` 参数被调用。因此，你应确保自定义类型转换能充分处理此场景：

```php
/**
 * 准备给定的值以进行存储。
 *
 * @param  \Illuminate\Database\Eloquent\Model  $model
 * @param  string  $key
 * @param  AddressModel  $value
 * @param  array  $attributes
 * @return array
 */
public function set($model, $key, $value, $attributes)
{
    if (! $value instanceof AddressModel) {
        throw new InvalidArgumentException('The given value is not an Address instance.');
    }

    return [
        'address_line_one' => $value->lineOne,
        'address_line_two' => $value->lineTwo,
    ];
}
```

<a name="belongs-to-many-first-or-new"></a>
#### 多对多关联 `firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法

**影响可能性：中**

`belongsToMany` 关联的 `firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法都接受一个属性数组作为第一个参数。在之前的 Laravel 版本中，此属性数组与"pivot"／中间表进行比对以查找现有记录。

但此行为并不符合预期，通常也不被需要。现在，这些方法将属性数组与关联模型的表进行比对：

```php
$user->roles()->updateOrCreate([
    'name' => 'Administrator',
]);
```

此外，`firstOrCreate` 方法现在接受一个 `$values` 数组作为第二个参数。如果关联模型不存在，此数组将在创建关联模型时与方法的第一个参数（`$attributes`）合并。此变更使此方法与其他关联类型提供的 `firstOrCreate` 方法保持一致：

```php
$user->roles()->firstOrCreate([
    'name' => 'Administrator',
], [
    'created_by' => $user->id,
]);
```

#### `touch` 方法

**影响可能性：低**

`touch` 方法现在接受一个要 touch 的属性。如果你之前覆盖了此方法，应更新方法签名以反映此新参数：

```php
public function touch($attribute = null);
```

### 加密

#### Encrypter 契约

**影响可能性：低**

`Illuminate\Contracts\Encryption\Encrypter` 契约现在定义了 `getKey` 方法。如果你手动实现此接口，应相应更新实现：

```php
public function getKey();
```

### Facades

#### `getFacadeAccessor` 方法

**影响可能性：低**

`getFacadeAccessor` 方法必须始终返回容器绑定键。在之前的 Laravel 版本中，此方法可以返回对象实例；但此行为不再受支持。如果你编写了自己的 Facade，应确保此方法返回容器绑定字符串：

```php
/**
 * 获取已注册的组件名称。
 *
 * @return string
 */
protected static function getFacadeAccessor()
{
    return Example::class;
}
```

### 文件系统

#### `FILESYSTEM_DRIVER` 环境变量

**影响可能性：低**

`FILESYSTEM_DRIVER` 环境变量已重命名为 `FILESYSTEM_DISK`，以更准确地反映其用途。此变更仅影响应用骨架；但你可以选择更新自己应用的环境变量以反映此变更。

#### "Cloud" 磁盘

**影响可能性：低**

`cloud` 磁盘配置选项已于 2020 年 11 月从默认应用骨架中移除。此变更仅影响应用骨架。如果你在应用中使用 `cloud` 磁盘，应在自己应用的骨架中保留此配置值。

<a name="flysystem-3"></a>
### Flysystem 3.x

**影响可能性：高**

Laravel 9.x 已从 [Flysystem](https://flysystem.thephpleague.com/v2/docs/) 1.x 迁移到 3.x。在底层，Flysystem 驱动了 `Storage` Facade 提供的所有文件操作方法。鉴于此，你的应用可能需要做一些修改；但我们已尽力使此过渡尽可能平滑。

#### 驱动前置要求

在使用 S3、FTP 或 SFTP 驱动之前，你需要通过 Composer 包管理器安装相应的包：

- Amazon S3: `composer require -W league/flysystem-aws-s3-v3 "^3.0"`
- FTP: `composer require league/flysystem-ftp "^3.0"`
- SFTP: `composer require league/flysystem-sftp-v3 "^3.0"`

#### 覆盖现有文件

`put`、`write` 和 `writeStream` 等写操作现在默认覆盖现有文件。如果你不想覆盖现有文件，应在执行写操作前手动检查文件是否存在。

#### 写入异常

`put`、`write` 和 `writeStream` 等写操作在写入失败时不再抛出异常，而是返回 `false`。如果你想保留之前抛出异常的行为，可以在文件系统磁盘的配置数组中定义 `throw` 选项：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

#### 读取不存在的文件

尝试读取不存在的文件现在返回 `null`。在之前的 Laravel 版本中，会抛出 `Illuminate\Contracts\Filesystem\FileNotFoundException` 异常。

#### 删除不存在的文件

尝试 `delete` 不存在的文件现在返回 `true`。

#### 缓存适配器

Flysystem 不再支持"缓存适配器"。因此，它们已从 Laravel 中移除，你可以删除任何相关配置（如磁盘配置中的 `cache` 键）。

#### 自定义文件系统

注册自定义文件系统驱动所需的步骤已有细微变更。因此，如果你定义了自己的自定义文件系统驱动，或使用了定义自定义驱动的包，应更新代码和依赖。

例如，在 Laravel 8.x 中，自定义文件系统驱动可能这样注册：

```php
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;

Storage::extend('dropbox', function ($app, $config) {
    $client = new DropboxClient(
        $config['authorization_token']
    );

    return new Filesystem(new DropboxAdapter($client));
});
```

但在 Laravel 9.x 中，传给 `Storage::extend` 方法的回调应直接返回 `Illuminate\Filesystem\FilesystemAdapter` 实例：

```php
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;

Storage::extend('dropbox', function ($app, $config) {
    $adapter = new DropboxAdapter(
        new DropboxClient($config['authorization_token'])
    );

    return new FilesystemAdapter(
        new Filesystem($adapter, $config),
        $adapter,
        $config
    );
});
```

#### SFTP 私钥-公钥密码短语

如果你的应用使用 Flysystem 的 SFTP 适配器和私钥-公钥认证，用于解密私钥的 `password` 配置项应重命名为 `passphrase`。

### 辅助函数

<a name="data-get-function"></a>
#### `data_get` 辅助函数与可迭代对象

**影响可能性：极低**

以前，`data_get` 辅助函数可用于在数组和 `Collection` 实例上获取嵌套数据；但此辅助函数现在可以在所有可迭代对象上获取嵌套数据。

<a name="str-function"></a>
#### `str` 辅助函数

**影响可能性：极低**

Laravel 9.x 现在包含一个全局 `str` [辅助函数](/docs/{{version}}/helpers#method-str)。如果你在应用中定义了全局 `str` 辅助函数，应重命名或移除它，以免与 Laravel 自带的 `str` 辅助函数冲突。

<a name="when-and-unless-methods"></a>
#### `when` / `unless` 方法

**影响可能性：中**

如你所知，`when` 和 `unless` 方法由框架中的各类提供。这些方法可用于在方法第一个参数的布尔值求值为 `true` 或 `false` 时有条件地执行操作：

```php
$collection->when(true, function ($collection) {
    $collection->merge([1, 2, 3]);
});
```

因此，在之前的 Laravel 版本中，向 `when` 或 `unless` 方法传递闭包意味着条件操作总会执行，因为与闭包对象（或任何其他对象）的松散比较总是求值为 `true`。这经常导致意外结果，因为开发者期望闭包的**结果**用作决定条件操作是否执行的布尔值。

所以，在 Laravel 9.x 中，传给 `when` 或 `unless` 方法的任何闭包都会被执行，闭包返回的值将作为 `when` 和 `unless` 方法使用的布尔值：

```php
$collection->when(function ($collection) {
    // 此闭包会执行...
    return false;
}, function ($collection) {
    // 不执行，因为第一个闭包返回了 "false"...
    $collection->merge([1, 2, 3]);
});
```

### HTTP 客户端

<a name="http-client-default-timeout"></a>
#### 默认超时时间

**影响可能性：中**

[HTTP 客户端](/docs/{{version}}/http-client) 现在默认超时时间为 30 秒。换言之，如果服务器在 30 秒内未响应，将抛出异常。以前，HTTP 客户端未配置默认超时时长，导致请求有时会无限"挂起"。

如果你想为某个请求指定更长的超时时间，可以使用 `timeout` 方法：

    $response = Http::timeout(120)->get(/* ... */);

#### HTTP Fake 与中间件

**影响可能性：低**

以前，当 [HTTP 客户端](/docs/{{version}}/http-client) 被"fake"时，Laravel 不会执行任何提供的 Guzzle HTTP 中间件。但在 Laravel 9.x 中，即使 HTTP 客户端被 fake，Guzzle HTTP 中间件也会执行。

#### HTTP Fake 与依赖注入

**影响可能性：低**

在之前的 Laravel 版本中，调用 `Http::fake()` 方法不会影响注入到类构造函数中的 `Illuminate\Http\Client\Factory` 实例。但在 Laravel 9.x 中，`Http::fake()` 会确保通过依赖注入注入到其他服务的 HTTP 客户端返回 fake 响应。此行为与其他 Facade 和 fake 的行为更加一致。

<a name="symfony-mailer"></a>
### Symfony Mailer

**影响可能性：高**

Laravel 9.x 最大的变更之一是从 SwiftMailer（自 2021 年 12 月起不再维护）过渡到 Symfony Mailer。但我们已尽力使此过渡对你的应用尽可能平滑。话虽如此，请仔细审查以下变更列表，确保你的应用完全兼容。

#### 驱动前置要求

要继续使用 Mailgun 传输，你的应用应引入 `symfony/mailgun-mailer` 和 `symfony/http-client` Composer 包：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

应从你的应用中移除 `wildbit/swiftmailer-postmark` Composer 包。改为引入 `symfony/postmark-mailer` 和 `symfony/http-client` Composer 包：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

#### 更新的返回类型

`Illuminate\Mail\Mailer` 上的 `send`、`html`、`raw` 和 `plain` 方法不再返回 `void`，而是返回 `Illuminate\Mail\SentMessage` 实例。此对象包含一个 `Symfony\Component\Mailer\SentMessage` 实例，可通过 `getSymfonySentMessage` 方法或动态调用对象上的方法来访问。

#### 重命名的 "Swift" 方法

各种与 SwiftMailer 相关的方法（其中一些未文档化）已重命名为对应的 Symfony Mailer 方法。例如，`withSwiftMessage` 方法已重命名为 `withSymfonyMessage`：

    // Laravel 8.x...
    $this->withSwiftMessage(function ($message) {
        $message->getHeaders()->addTextHeader(
            'Custom-Header', 'Header Value'
        );
    });

    // Laravel 9.x...
    use Symfony\Component\Mime\Email;

    $this->withSymfonyMessage(function (Email $message) {
        $message->getHeaders()->addTextHeader(
            'Custom-Header', 'Header Value'
        );
    });

> **Warning**  
> 请仔细查阅 [Symfony Mailer 文档](https://symfony.com/doc/6.0/mailer.html#creating-sending-messages)，了解与 `Symfony\Component\Mime\Email` 对象的所有可能交互。

以下列表包含更详细的重命名方法概述。其中许多是用于直接与 SwiftMailer / Symfony Mailer 交互的底层方法，因此在大多数 Laravel 应用中可能不常使用：

    Message::getSwiftMessage();
    Message::getSymfonyMessage();

    Mailable::withSwiftMessage($callback);
    Mailable::withSymfonyMessage($callback);

    MailMessage::withSwiftMessage($callback);
    MailMessage::withSymfonyMessage($callback);

    Mailer::getSwiftMailer();
    Mailer::getSymfonyTransport();

    Mailer::setSwiftMailer($swift);
    Mailer::setSymfonyTransport(TransportInterface $transport);

    MailManager::createTransport($config);
    MailManager::createSymfonyTransport($config);

#### 代理的 `Illuminate\Mail\Message` 方法

`Illuminate\Mail\Message` 通常将缺失的方法代理到底层的 `Swift_Message` 实例。但缺失的方法现在改为代理到 `Symfony\Component\Mime\Email` 实例。因此，之前依赖缺失方法代理到 SwiftMailer 的任何代码都应更新为对应的 Symfony Mailer 方法。

同样，许多应用可能未与这些方法交互，因为它们未在 Laravel 文档中记录：

    // Laravel 8.x...
    $message
        ->setFrom('taylor@laravel.com')
        ->setTo('example@example.org')
        ->setSubject('Order Shipped')
        ->setBody('<h1>HTML</h1>', 'text/html')
        ->addPart('Plain Text', 'text/plain');

    // Laravel 9.x...
    $message
        ->from('taylor@laravel.com')
        ->to('example@example.org')
        ->subject('Order Shipped')
        ->html('<h1>HTML</h1>')
        ->text('Plain Text');

#### 生成的消息 ID

SwiftMailer 提供了通过 `mime.idgenerator.idright` 配置选项定义自定义域名以包含在生成的消息 ID 中的能力。Symfony Mailer 不支持此功能。相反，Symfony Mailer 会根据发件人自动生成消息 ID。

#### `MessageSent` 事件变更

`Illuminate\Mail\Events\MessageSent` 事件的 `message` 属性现在包含 `Symfony\Component\Mime\Email` 实例，而非 `Swift_Message` 实例。此消息表示邮件发送**之前**的状态。

此外，`MessageSent` 事件新增了 `sent` 属性。此属性包含 `Illuminate\Mail\SentMessage` 实例，包含已发送邮件的信息，如消息 ID。

#### 强制重新连接

不再可能强制传输重新连接（例如当邮件器通过守护进程运行时）。相反，Symfony Mailer 会尝试自动重新连接传输，如果重新连接失败则抛出异常。

#### SMTP 流选项

不再支持为 SMTP 传输定义流选项。相反，如果相关选项受支持，你必须直接在配置中定义。例如，要禁用 TLS 对端验证：

    'smtp' => [
        // Laravel 8.x...
        'stream' => [
            'ssl' => [
                'verify_peer' => false,
            ],
        ],

        // Laravel 9.x...
        'verify_peer' => false,
    ],

要了解可用的配置选项，请查阅 [Symfony Mailer 文档](https://symfony.com/doc/6.0/mailer.html#transport-setup)。

> **Warning**  
> 尽管有上面的示例，通常不建议你禁用 SSL 验证，因为这会引入"中间人"攻击的可能性。

#### SMTP `auth_mode`

不再需要在 `mail` 配置文件中定义 SMTP `auth_mode`。认证模式将由 Symfony Mailer 和 SMTP 服务器自动协商。

#### 失败的收件人

不再可能在发送消息后获取失败收件人列表。相反，如果消息发送失败，将抛出 `Symfony\Component\Mailer\Exception\TransportExceptionInterface` 异常。建议你在发送消息前验证电子邮件地址，而不是依赖在发送消息后获取无效电子邮件地址。

### 包

<a name="the-lang-directory"></a>
#### `lang` 目录

**影响可能性：中**

在新的 Laravel 应用中，`resources/lang` 目录现在位于项目根目录（`lang`）。如果你的包将语言文件发布到此目录，应确保包发布到 `app()->langPath()` 而非硬编码路径。

<a name="queue"></a>
### 队列

<a name="the-opis-closure-library"></a>
#### `opis/closure` 库

**影响可能性：低**

Laravel 对 `opis/closure` 的依赖已被 `laravel/serializable-closure` 替代。除非你直接与 `opis/closure` 库交互，否则这不会导致应用中的任何破坏性变更。此外，之前弃用的 `Illuminate\Queue\SerializableClosureFactory` 和 `Illuminate\Queue\SerializableClosure` 类已被移除。如果你直接与 `opis/closure` 库交互或使用了任何被移除的类，可改用 [Laravel Serializable Closure](https://github.com/laravel/serializable-closure)。

#### 失败任务提供者的 `flush` 方法

**影响可能性：低**

`Illuminate\Queue\Failed\FailedJobProviderInterface` 接口定义的 `flush` 方法现在接受一个 `$hours` 参数，用于决定失败任务必须存在多长时间（以小时为单位）才会被 `queue:flush` 命令清除。如果你手动实现 `FailedJobProviderInterface`，应确保实现已更新以反映此新参数：

```php
public function flush($hours = null);
```

### Session

#### `getSession` 方法

**影响可能性：低**

Laravel 自己的 `Illuminate\Http\Request` 类扩展的 `Symfony\Component\HttpFoundaton\Request` 类提供了 `getSession` 方法来获取当前会话存储处理器。Laravel 未记录此方法，因为大多数 Laravel 应用通过 Laravel 自己的 `session` 方法与会话交互。

`getSession` 方法之前返回 `Illuminate\Session\Store` 实例或 `null`；但由于 Symfony 6.x 版本强制要求返回类型为 `Symfony\Component\HttpFoundation\Session\SessionInterface`，`getSession` 现在正确返回 `SessionInterface` 实现，或在无可用会话时抛出 `\Symfony\Component\HttpFoundation\Exception\SessionNotFoundException` 异常。

### 测试

<a name="the-assert-deleted-method"></a>
#### `assertDeleted` 方法

**影响可能性：中**

所有对 `assertDeleted` 方法的调用都应更新为 `assertModelMissing`。

### 受信任的代理

**影响可能性：低**

如果你通过将现有应用代码导入全新的 Laravel 9 应用骨架来将 Laravel 8 项目升级到 Laravel 9，可能需要更新应用的"受信任代理"中间件。

在 `app/Http/Middleware/TrustProxies.php` 文件中，将 `use Fideloper\Proxy\TrustProxies as Middleware` 更新为 `use Illuminate\Http\Middleware\TrustProxies as Middleware`。

接下来，在 `app/Http/Middleware/TrustProxies.php` 中，你应更新 `$headers` 属性定义：

```php
// 之前...
protected $headers = Request::HEADER_X_FORWARDED_ALL;

// 之后...
protected $headers =
    Request::HEADER_X_FORWARDED_FOR |
    Request::HEADER_X_FORWARDED_HOST |
    Request::HEADER_X_FORWARDED_PORT |
    Request::HEADER_X_FORWARDED_PROTO |
    Request::HEADER_X_FORWARDED_AWS_ELB;
```

最后，你可以从应用中移除 `fideloper/proxy` Composer 依赖：

```shell
composer remove fideloper/proxy
```

### 验证

#### Form Request `validated` 方法

**影响可能性：低**

表单请求提供的 `validated` 方法现在接受 `$key` 和 `$default` 参数。如果你手动覆盖了此方法的定义，应更新方法签名以反映这些新参数：

```php
public function validated($key = null, $default = null)
```

<a name="the-password-rule"></a>
#### `password` 规则

**影响可能性：中**

`password` 规则（验证给定输入值与认证用户的当前密码匹配）已重命名为 `current_password`。

<a name="unvalidated-array-keys"></a>
#### 未验证的数组键

**影响可能性：中**

在之前的 Laravel 版本中，你需要手动指示 Laravel 验证器将未验证的数组键从其返回的"已验证"数据中排除，尤其是在与未指定允许键列表的 `array` 规则组合使用时。

但在 Laravel 9.x 中，即使未通过 `array` 规则指定允许键，未验证的数组键也始终从"已验证"数据中排除。通常，此行为是最符合预期的行为，之前的 `excludeUnvalidatedArrayKeys` 方法仅作为临时措施添加到 Laravel 8.x 以保持向后兼容。

虽然不推荐，但你可以通过在应用的某个服务提供者（Service Provider）的 `boot` 方法中调用新的 `includeUnvalidatedArrayKeys` 方法来选择使用之前的 Laravel 8.x 行为：

```php
use Illuminate\Support\Facades\Validator;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Validator::includeUnvalidatedArrayKeys();
}
```

<a name="miscellaneous"></a>
### 杂项

我们也鼓励你查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel) 中的变更。虽然许多变更并非必需，但你可能希望使这些文件与应用保持同步。此升级指南会涵盖其中一些变更，但其他变更（如配置文件或注释的变更）不会涵盖。你可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/8.x...9.x) 轻松查看变更，并选择对你重要的更新。
