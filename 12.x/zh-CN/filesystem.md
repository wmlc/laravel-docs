# 文件存储

- [简介](#introduction)
- [配置](#configuration)
    - [本地驱动](#the-local-driver)
    - [公共磁盘](#the-public-disk)
    - [驱动前置要求](#driver-prerequisites)
    - [作用域与只读文件系统](#scoped-and-read-only-filesystems)
    - [兼容 Amazon S3 的文件系统](#amazon-s3-compatible-filesystems)
- [获取磁盘实例](#obtaining-disk-instances)
    - [按需磁盘](#on-demand-disks)
- [检索文件](#retrieving-files)
    - [下载文件](#downloading-files)
    - [文件 URL](#file-urls)
    - [临时 URL](#temporary-urls)
    - [文件元数据](#file-metadata)
- [存储文件](#storing-files)
    - [在文件开头或末尾写入](#prepending-appending-to-files)
    - [复制与移动文件](#copying-moving-files)
    - [自动流式传输](#automatic-streaming)
    - [文件上传](#file-uploads)
    - [文件可见性](#file-visibility)
- [删除文件](#deleting-files)
- [目录](#directories)
- [测试](#testing)
- [自定义文件系统](#custom-filesystems)

<a name="introduction"></a>
## 简介

Laravel 提供了强大的文件系统抽象，这要归功于 Frank de Jonge 开发的优秀 [Flysystem](https://github.com/thephpleague/flysystem) PHP 扩展包。Laravel 的 Flysystem 集成为本地文件系统、SFTP 和 Amazon S3 提供了简单易用的驱动。更棒的是，由于每个系统的 API 完全一致，你可以在本地开发环境和生产服务器之间轻松切换这些存储方案。

<a name="configuration"></a>
## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。你可以在该文件中配置所有的文件系统「磁盘」。每个磁盘代表一个特定的存储驱动和存储位置。配置文件中包含了每个受支持驱动的示例配置，你可以根据自己的存储偏好和凭据修改这些配置。

`local` 驱动用于操作运行 Laravel 应用的服务器上本地存储的文件，`sftp` 存储驱动用于基于 SSH 密钥的 FTP，而 `s3` 驱动则用于写入 Amazon 的 S3 云存储服务。

> [!NOTE]
> 你可以按需配置任意数量的磁盘，甚至可以配置多个使用同一驱动的磁盘。

<a name="the-local-driver"></a>
### 本地驱动

使用 `local` 驱动时，所有文件操作都相对于 `filesystems` 配置文件中定义的 `root` 目录执行。默认情况下，该值设置为 `storage/app/private` 目录。因此，下面的方法会写入 `storage/app/private/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

<a name="the-public-disk"></a>
### 公共磁盘

应用的 `filesystems` 配置文件中包含的 `public` 磁盘适用于需要公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动，并将文件存储在 `storage/app/public`。

如果你的 `public` 磁盘使用 `local` 驱动，并且希望这些文件可以通过 Web 访问，应当创建一个从源目录 `storage/app/public` 指向目标目录 `public/storage` 的软链接：

要创建软链接，可以使用 `storage:link` Artisan 命令：

```shell
php artisan storage:link
```

文件存储完毕且软链接创建好之后，你就可以使用 `asset` 辅助函数为这些文件创建 URL：

```php
echo asset('storage/file.txt');
```

你可以在 `filesystems` 配置文件中配置额外的软链接。运行 `storage:link` 命令时，会创建所有已配置的链接：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

`storage:unlink` 命令可用于删除已配置的软链接：

```shell
php artisan storage:unlink
```

<a name="driver-prerequisites"></a>
### 驱动前置要求

<a name="s3-driver-configuration"></a>
#### S3 驱动配置

使用 S3 驱动之前，你需要通过 Composer 包管理器安装 Flysystem S3 扩展包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

S3 磁盘的配置数组位于 `config/filesystems.php` 配置文件中。通常，你应该使用以下环境变量来配置 S3 的信息和凭据，`config/filesystems.php` 配置文件会引用这些变量：

```ini
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=<your-bucket-name>
AWS_USE_PATH_STYLE_ENDPOINT=false
```

为了方便，这些环境变量的命名与 AWS CLI 使用的命名规范保持一致。

<a name="ftp-driver-configuration"></a>
#### FTP 驱动配置

使用 FTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem FTP 扩展包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成与 FTP 配合得很好；不过，框架默认的 `config/filesystems.php` 配置文件中并未包含 FTP 的示例配置。如果你需要配置 FTP 文件系统，可以参考下面的配置示例：

```php
'ftp' => [
    'driver' => 'ftp',
    'host' => env('FTP_HOST'),
    'username' => env('FTP_USERNAME'),
    'password' => env('FTP_PASSWORD'),

    // 可选的 FTP 设置...
    // 'port' => env('FTP_PORT', 21),
    // 'root' => env('FTP_ROOT'),
    // 'passive' => true,
    // 'ssl' => true,
    // 'timeout' => 30,
],
```

<a name="sftp-driver-configuration"></a>
#### SFTP 驱动配置

使用 SFTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem SFTP 扩展包：

```shell
composer require league/flysystem-sftp-v3 "^3.0"
```

Laravel 的 Flysystem 集成与 SFTP 配合得很好；不过，框架默认的 `config/filesystems.php` 配置文件中并未包含 SFTP 的示例配置。如果你需要配置 SFTP 文件系统，可以参考下面的配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 基本认证设置...
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 使用加密密码的基于 SSH 密钥的认证设置...
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 文件 / 目录权限设置...
    'visibility' => 'private', // `private` = 0600，`public` = 0644
    'directory_visibility' => 'private', // `private` = 0700，`public` = 0755

    // 可选的 SFTP 设置...
    // 'hostFingerprint' => env('SFTP_HOST_FINGERPRINT'),
    // 'maxTries' => 4,
    // 'passphrase' => env('SFTP_PASSPHRASE'),
    // 'port' => env('SFTP_PORT', 22),
    // 'root' => env('SFTP_ROOT', ''),
    // 'timeout' => 30,
    // 'useAgent' => true,
],
```

<a name="scoped-and-read-only-filesystems"></a>
### 作用域与只读文件系统

作用域磁盘允许你定义一个文件系统，其中所有路径都会自动加上指定的路径前缀。在创建作用域文件系统磁盘之前，你需要通过 Composer 包管理器安装一个额外的 Flysystem 扩展包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以通过定义一个使用 `scoped` 驱动的磁盘，为任何现有文件系统磁盘创建路径作用域实例。例如，你可以创建一个磁盘，将现有的 `s3` 磁盘限定到特定的路径前缀，这样使用该作用域磁盘执行的每个文件操作都会使用指定的前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

「只读」磁盘允许你创建不允许写入操作的文件系统磁盘。使用 `read-only` 配置项之前，你需要通过 Composer 包管理器安装一个额外的 Flysystem 扩展包：

```shell
composer require league/flysystem-read-only "^3.0"
```

接下来，你可以在一个或多个磁盘的配置数组中加入 `read-only` 配置项：

```php
's3-videos' => [
    'driver' => 's3',
    // ...
    'read-only' => true,
],
```

<a name="amazon-s3-compatible-filesystems"></a>
### 兼容 Amazon S3 的文件系统

默认情况下，应用的 `filesystems` 配置文件中包含 `s3` 磁盘的配置。除了使用该磁盘与 [Amazon S3](https://aws.amazon.com/s3/) 交互之外，你还可以用它来对接任何兼容 S3 的文件存储服务，例如 [RustFS](https://github.com/rustfs/rustfs)、[DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/)、[Vultr Object Storage](https://www.vultr.com/products/object-storage/)、[Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) 或 [Hetzner Cloud Storage](https://www.hetzner.com/storage/object-storage/)。

通常，只需将磁盘的凭据更新为你计划使用的服务的凭据，然后更新 `endpoint` 配置项的值即可。该配置项的值通常通过 `AWS_ENDPOINT` 环境变量来定义：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://rustfs:9000'),
```

<a name="obtaining-disk-instances"></a>
## 获取磁盘实例

可以使用 `Storage` facade 与已配置的任意磁盘进行交互。例如，你可以使用该 facade 上的 `put` 方法将头像存储到默认磁盘。如果调用 `Storage` facade 上的方法时没有先调用 `disk` 方法，该方法会自动传递给默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用与多个磁盘交互，可以使用 `Storage` facade 上的 `disk` 方法来操作特定磁盘上的文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

<a name="on-demand-disks"></a>
### 按需磁盘

有时你可能希望在运行时使用指定的配置创建一个磁盘，而无需把该配置实际写入应用的 `filesystems` 配置文件。为此，你可以将一个配置数组传递给 `Storage` facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Storage;

$disk = Storage::build([
    'driver' => 'local',
    'root' => '/path/to/root',
]);

$disk->put('image.jpg', $content);
```

<a name="retrieving-files"></a>
## 检索文件

可以使用 `get` 方法检索文件的内容。该方法会返回文件的原始字符串内容。请记住，所有文件路径都应相对于磁盘的「root」位置来指定：

```php
$contents = Storage::get('file.jpg');
```

如果要检索的文件包含 JSON，可以使用 `json` 方法来检索文件并解码其内容：

```php
$orders = Storage::json('orders.json');
```

可以使用 `exists` 方法判断磁盘上是否存在某个文件：

```php
if (Storage::disk('s3')->exists('file.jpg')) {
    // ...
}
```

可以使用 `missing` 方法判断磁盘上是否缺少某个文件：

```php
if (Storage::disk('s3')->missing('file.jpg')) {
    // ...
}
```

<a name="downloading-files"></a>
### 下载文件

可以使用 `download` 方法生成一个响应，强制用户的浏览器下载指定路径的文件。`download` 方法的第二个参数接受一个文件名，用于确定用户下载文件时看到的文件名。最后，你还可以将一个 HTTP 头数组作为该方法的第三个参数传入：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

<a name="file-urls"></a>
### 文件 URL

可以使用 `url` 方法获取指定文件的 URL。如果你使用的是 `local` 驱动，该方法通常只是在给定路径前加上 `/storage` 并返回该文件的相对 URL。如果你使用的是 `s3` 驱动，则会返回完整的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

使用 `local` 驱动时，所有需要公开访问的文件都应放在 `storage/app/public` 目录中。此外，你还应当在 `public/storage` 处[创建一个软链接](#the-public-disk)指向 `storage/app/public` 目录。

> [!WARNING]
> 使用 `local` 驱动时，`url` 的返回值不会进行 URL 编码。因此，我们建议存储文件时始终使用能生成合法 URL 的文件名。

<a name="url-host-customization"></a>
#### 自定义 URL 主机

如果你想修改使用 `Storage` facade 生成的 URL 的主机，可以在磁盘的配置数组中添加或修改 `url` 选项：

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
    'throw' => false,
],
```

<a name="temporary-urls"></a>
### 临时 URL

使用 `temporaryUrl` 方法，你可以为使用 `local` 和 `s3` 驱动存储的文件创建临时 URL。该方法接受一个路径和一个指定 URL 过期时间的 `DateTime` 实例：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::temporaryUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

<a name="enabling-local-temporary-urls"></a>
#### 启用本地临时 URL

如果你在 `local` 驱动支持临时 URL 功能推出之前就开始开发应用了，可能需要启用本地临时 URL。为此，请在 `config/filesystems.php` 配置文件中，向 `local` 磁盘的配置数组添加 `serve` 选项：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    'serve' => true, // [tl! add]
    'throw' => false,
],
```

<a name="s3-request-parameters"></a>
#### S3 请求参数

如果你需要指定额外的 [S3 请求参数](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html#RESTObjectGET-requests)，可以将请求参数数组作为 `temporaryUrl` 方法的第三个参数传入：

```php
$url = Storage::temporaryUrl(
    'file.jpg',
    now()->plus(minutes: 5),
    [
        'ResponseContentType' => 'application/octet-stream',
        'ResponseContentDisposition' => 'attachment; filename=file2.jpg',
    ]
);
```

<a name="customizing-temporary-urls"></a>
#### 自定义临时 URL

如果你需要为特定存储磁盘自定义临时 URL 的创建方式，可以使用 `buildTemporaryUrlsUsing` 方法。例如，当你有一个控制器允许用户下载通过通常不支持临时 URL 的磁盘存储的文件时，这个方法就很有用。通常，这个方法应该在服务提供者的 `boot` 方法中调用：

```php
<?php

namespace App\Providers;

use DateTime;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Storage::disk('local')->buildTemporaryUrlsUsing(
            function (string $path, DateTime $expiration, array $options) {
                return URL::temporarySignedRoute(
                    'files.download',
                    $expiration,
                    array_merge($options, ['path' => $path])
                );
            }
        );
    }
}
```

<a name="temporary-upload-urls"></a>
#### 临时上传 URL

> [!WARNING]
> 只有 `s3` 和 `local` 驱动支持生成临时上传 URL。

如果你需要生成一个可供客户端应用直接上传文件的临时 URL，可以使用 `temporaryUploadUrl` 方法。该方法接受一个路径和一个指定 URL 过期时间的 `DateTime` 实例。`temporaryUploadUrl` 方法返回一个关联数组，可以解构出上传 URL 和上传请求应携带的 HTTP 头：

```php
use Illuminate\Support\Facades\Storage;

['url' => $url, 'headers' => $headers] = Storage::temporaryUploadUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

该方法主要适用于无服务器环境。这类环境要求客户端应用直接将文件上传到云存储系统，例如 Amazon S3。

<a name="file-metadata"></a>
### 文件元数据

除了读写文件之外，Laravel 还可以提供文件本身的信息。例如，可以使用 `size` 方法获取文件的大小（以字节为单位）：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件上次修改时间的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

可以使用 `mimeType` 方法获取指定文件的 MIME 类型：

```php
$mime = Storage::mimeType('file.jpg');
```

<a name="file-paths"></a>
#### 文件路径

可以使用 `path` 方法获取指定文件的路径。如果你使用的是 `local` 驱动，该方法会返回文件的绝对路径。如果你使用的是 `s3` 驱动，该方法会返回文件在 S3 存储桶（bucket）中的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

<a name="storing-files"></a>
## 存储文件

可以使用 `put` 方法将文件内容存储到磁盘上。你也可以向 `put` 方法传递一个 PHP `resource`，该方法将使用 Flysystem 底层的流支持。请记住，所有文件路径都应相对于为磁盘配置的「root」位置来指定：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

<a name="failed-writes"></a>
#### 写入失败

如果 `put` 方法（或其他「写入」操作）无法将文件写入磁盘，会返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 文件无法写入磁盘...
}
```

如果你愿意，可以在文件系统磁盘的配置数组中定义 `throw` 选项。当该选项定义为 `true` 时，`put` 等「写入」方法在写入操作失败时会抛出 `League\Flysystem\UnableToWriteFile` 异常实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

<a name="prepending-appending-to-files"></a>
### 在文件开头或末尾写入

`prepend` 和 `append` 方法允许你在文件的开头或末尾写入内容：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

<a name="copying-moving-files"></a>
### 复制与移动文件

可以使用 `copy` 方法将现有文件复制到磁盘上的新位置，而 `move` 方法可用于重命名文件或将现有文件移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

<a name="automatic-streaming"></a>
### 自动流式传输

以流式方式将文件写入存储可以显著降低内存占用。如果你希望 Laravel 自动将指定文件以流式方式写入存储位置，可以使用 `putFile` 或 `putFileAs` 方法。该方法接受 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并自动将文件流式传输到你指定的位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 自动为文件名生成唯一 ID...
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名...
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

关于 `putFile` 方法有几点需要注意。注意，我们只指定了目录名而没有指定文件名。默认情况下，`putFile` 方法会生成一个唯一 ID 作为文件名。文件的扩展名则通过检查文件的 MIME 类型来确定。`putFile` 方法会返回文件的路径，因此你可以将该路径（包括生成的文件名）存储到数据库中。

`putFile` 和 `putFileAs` 方法还接受一个用于指定所存储文件「可见性」的参数。如果你将文件存储在 Amazon S3 之类的云磁盘上，并希望该文件可以通过生成的 URL 公开访问，这个参数会特别有用：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

<a name="file-uploads"></a>
### 文件上传

在 Web 应用中，存储文件最常见的用例之一就是存储用户上传的文件，例如照片和文档。Laravel 让你可以非常方便地使用上传文件实例上的 `store` 方法来存储上传的文件。调用 `store` 方法时，传入你希望存储上传文件的路径：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserAvatarController extends Controller
{
    /**
     * 更新用户的头像。
     */
    public function update(Request $request): string
    {
        $path = $request->file('avatar')->store('avatars');

        return $path;
    }
}
```

关于这个示例有几点需要注意。注意，我们只指定了目录名，而不是文件名。默认情况下，`store` 方法会生成一个唯一 ID 作为文件名。文件的扩展名则通过检查文件的 MIME 类型来确定。`store` 方法会返回文件的路径，因此你可以将该路径（包括生成的文件名）存储到数据库中。

你也可以调用 `Storage` facade 上的 `putFile` 方法，执行与上面的示例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

<a name="specifying-a-file-name"></a>
#### 指定文件名

如果你不希望为存储的文件自动分配文件名，可以使用 `storeAs` 方法。该方法接收路径、文件名和（可选的）磁盘作为参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以使用 `Storage` facade 上的 `putFileAs` 方法，执行与上面的示例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> [!WARNING]
> 文件路径中不可打印和无效的 Unicode 字符会被自动移除。因此，在将文件路径传递给 Laravel 的文件存储方法之前，你可能希望先对其进行清理。文件路径的规范化使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法完成。

<a name="specifying-a-disk"></a>
#### 指定磁盘

默认情况下，上传文件的 `store` 方法会使用你的默认磁盘。如果你想指定其他磁盘，可以将磁盘名称作为 `store` 方法的第二个参数传入：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你使用的是 `storeAs` 方法，可以将磁盘名称作为该方法的第三个参数传入：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="other-uploaded-file-information"></a>
#### 其他上传文件信息

如果你想获取上传文件的原始文件名和扩展名，可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

不过请记住，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被视为不安全的方法，因为文件名和扩展名可能被恶意用户篡改。因此，通常应优先使用 `hashName` 和 `extension` 方法来获取指定上传文件的名称和扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一的随机名称...
$extension = $file->extension(); // 根据文件的 MIME 类型确定文件的扩展名...
```

<a name="file-visibility"></a>
### 文件可见性

在 Laravel 的 Flysystem 集成中，「可见性」是对跨多平台文件权限的抽象。文件可以声明为 `public` 或 `private`。当文件声明为 `public` 时，表示该文件通常应允许他人访问。例如，使用 S3 驱动时，你可以检索 `public` 文件的 URL。

你可以在通过 `put` 方法写入文件时设置可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已经存储，可以通过 `getVisibility` 和 `setVisibility` 方法获取和设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

在处理上传文件时，可以使用 `storePublicly` 和 `storePubliclyAs` 方法以 `public` 可见性存储上传的文件：

```php
$path = $request->file('avatar')->storePublicly('avatars', 's3');

$path = $request->file('avatar')->storePubliclyAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="local-files-and-visibility"></a>
#### 本地文件与可见性

使用 `local` 驱动时，`public` [可见性](#file-visibility)对应目录的 `0755` 权限和文件的 `0644` 权限。你可以在应用的 `filesystems` 配置文件中修改权限映射：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app'),
    'permissions' => [
        'file' => [
            'public' => 0644,
            'private' => 0600,
        ],
        'dir' => [
            'public' => 0755,
            'private' => 0700,
        ],
    ],
    'throw' => false,
],
```

<a name="deleting-files"></a>
## 删除文件

`delete` 方法接受要删除的单个文件名或文件名数组：

```php
use Illuminate\Support\Facades\Storage;

Storage::delete('file.jpg');

Storage::delete(['file.jpg', 'file2.jpg']);
```

如有必要，你可以指定要从哪个磁盘删除文件：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->delete('path/file.jpg');
```

<a name="directories"></a>
## 目录

<a name="get-all-files-within-a-directory"></a>
#### 获取目录下的所有文件

`files` 方法返回指定目录下所有文件组成的数组。如果你想检索指定目录下（包括子目录在内）的所有文件，可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

<a name="get-all-directories-within-a-directory"></a>
#### 获取目录下的所有子目录

`directories` 方法返回指定目录下所有子目录组成的数组。如果你想检索指定目录下（包括子目录在内）的所有目录，可以使用 `allDirectories` 方法：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

<a name="create-a-directory"></a>
#### 创建目录

`makeDirectory` 方法会创建指定的目录，包括所有必要的子目录：

```php
Storage::makeDirectory($directory);
```

<a name="delete-a-directory"></a>
#### 删除目录

最后，可以使用 `deleteDirectory` 方法删除一个目录及其所有文件：

```php
Storage::deleteDirectory($directory);
```

<a name="testing"></a>
## 测试

`Storage` facade 的 `fake` 方法允许你轻松生成一个假磁盘。结合 `Illuminate\Http\UploadedFile` 类的文件生成工具，可以大大简化文件上传的测试。例如：

```php tab=Pest
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('albums can be uploaded', function () {
    Storage::fake('photos');

    $response = $this->json('POST', '/photos', [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.jpg')
    ]);

    // 断言一个或多个文件已被存储...
    Storage::disk('photos')->assertExists('photo1.jpg');
    Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

    // 断言一个或多个文件未被存储...
    Storage::disk('photos')->assertMissing('missing.jpg');
    Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

    // 断言指定目录中的文件数量与预期数量一致...
    Storage::disk('photos')->assertCount('/wallpapers', 2);

    // 断言指定目录为空...
    Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_albums_can_be_uploaded(): void
    {
        Storage::fake('photos');

        $response = $this->json('POST', '/photos', [
            UploadedFile::fake()->image('photo1.jpg'),
            UploadedFile::fake()->image('photo2.jpg')
        ]);

        // 断言一个或多个文件已被存储...
        Storage::disk('photos')->assertExists('photo1.jpg');
        Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

        // 断言一个或多个文件未被存储...
        Storage::disk('photos')->assertMissing('missing.jpg');
        Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

        // 断言指定目录中的文件数量与预期数量一致...
        Storage::disk('photos')->assertCount('/wallpapers', 2);

        // 断言指定目录为空...
        Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');
    }
}
```

默认情况下，`fake` 方法会删除其临时目录中的所有文件。如果你想保留这些文件，可以改用「persistentFake」方法。有关测试文件上传的更多信息，请查阅 [HTTP 测试文档中关于文件上传的部分](/docs/{{version}}/http-tests#testing-file-uploads)。

> [!WARNING]
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

<a name="custom-filesystems"></a>
## 自定义文件系统

Laravel 的 Flysystem 集成开箱即用地支持多种「驱动」；不过，Flysystem 并不限于这些驱动，它还为许多其他存储系统提供了适配器。如果你想在 Laravel 应用中使用这些额外的适配器，可以创建自定义驱动。

要定义自定义文件系统，你需要一个 Flysystem 适配器。下面我们来为项目添加一个由社区维护的 Dropbox 适配器：

```shell
composer require spatie/flysystem-dropbox
```

接下来，你可以在应用的某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中注册该驱动。为此，你应该使用 `Storage` facade 的 `extend` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Storage::extend('dropbox', function (Application $app, array $config) {
            $adapter = new DropboxAdapter(new DropboxClient(
                $config['authorization_token']
            ));

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
```

`extend` 方法的第一个参数是驱动名称，第二个参数是一个接收 `$app` 和 `$config` 变量的闭包。该闭包必须返回一个 `Illuminate\Filesystem\FilesystemAdapter` 实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

创建并注册好扩展的服务提供者之后，你就可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动了。
