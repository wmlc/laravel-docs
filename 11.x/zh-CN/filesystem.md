# 文件存储

- [简介](#introduction)
- [配置](#configuration)
    - [本地驱动](#the-local-driver)
    - [公共磁盘](#the-public-disk)
    - [驱动前置条件](#driver-prerequisites)
    - [限定范围与只读文件系统](#scoped-and-read-only-filesystems)
    - [兼容 Amazon S3 的文件系统](#amazon-s3-compatible-filesystems)
- [获取磁盘实例](#obtaining-disk-instances)
    - [按需创建的磁盘](#on-demand-disks)
- [获取文件](#retrieving-files)
    - [下载文件](#downloading-files)
    - [文件 URL](#file-urls)
    - [临时 URL](#temporary-urls)
    - [文件元数据](#file-metadata)
- [存储文件](#storing-files)
    - [前置与追加内容到文件](#prepending-appending-to-files)
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

得益于 Frank de Jonge 提供的优秀 [Flysystem](https://github.com/thephpleague/flysystem) PHP 包，Laravel 提供了强大的文件系统抽象。Laravel 的 Flysystem 集成提供了简洁的驱动，用于操作本地文件系统、SFTP 和 Amazon S3。更棒的是，由于每个系统的 API 都保持一致，在本地开发机器和生产服务器之间切换这些存储选项非常简单。

<a name="configuration"></a>
## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。在该文件中，你可以配置所有文件系统「磁盘」。每个磁盘代表一个特定的存储驱动和存储位置。配置文件中包含了每个受支持驱动的示例配置，方便你修改配置以符合自己的存储偏好和凭据。

`local` 驱动与存储在运行 Laravel 应用的服务器本地上的文件交互，而 `s3` 驱动用于写入 Amazon 的 S3 云存储服务。

> [!NOTE]
> 你可以随意配置任意数量的磁盘，甚至可以有多个磁盘使用同一个驱动。

<a name="the-local-driver"></a>
### 本地驱动

使用 `local` 驱动时，所有文件操作都相对于 `filesystems` 配置文件中定义的 `root` 目录。默认情况下，该值为 `storage/app/private` 目录。因此，以下方法会写入 `storage/app/private/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

<a name="the-public-disk"></a>
### 公共磁盘

应用 `filesystems` 配置文件中包含的 `public` 磁盘用于存放可公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动，并把文件存放在 `storage/app/public` 中。

如果你的 `public` 磁盘使用 `local` 驱动，并且希望这些文件可从网页访问，你应当创建一个从源目录 `storage/app/public` 指向目标目录 `public/storage` 的符号链接：

要创建该符号链接，可以使用 `storage:link` Artisan 命令：

```shell
php artisan storage:link
```

文件存储完成且符号链接创建之后，你可以使用 `asset` 辅助函数为这些文件创建 URL：

```php
echo asset('storage/file.txt');
```

你也可以在 `filesystems` 配置文件中配置额外的符号链接。运行 `storage:link` 命令时，每个配置好的链接都会被创建：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

`storage:unlink` 命令可用于销毁你配置好的符号链接：

```shell
php artisan storage:unlink
```

<a name="driver-prerequisites"></a>
### 驱动前置条件

<a name="s3-driver-configuration"></a>
#### S3 驱动配置

使用 S3 驱动之前，你需要通过 Composer 包管理器安装 Flysystem S3 包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

S3 磁盘的配置数组位于 `config/filesystems.php` 配置文件中。通常情况下，你应当使用以下环境变量配置 S3 信息和凭据，`config/filesystems.php` 配置文件会引用这些变量：

```
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=<your-bucket-name>
AWS_USE_PATH_STYLE_ENDPOINT=false
```

为方便起见，这些环境变量与 AWS CLI 使用的命名约定保持一致。

<a name="ftp-driver-configuration"></a>
#### FTP 驱动配置

使用 FTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem FTP 包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成与 FTP 配合良好；不过，框架默认的 `config/filesystems.php` 配置文件并未包含示例配置。如果你需要配置 FTP 文件系统，可以使用下面的配置示例：

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

使用 SFTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem SFTP 包：

```shell
composer require league/flysystem-sftp-v3 "^3.0"
```

Laravel 的 Flysystem 集成与 SFTP 配合良好；不过，框架默认的 `config/filesystems.php` 配置文件并未包含示例配置。如果你需要配置 SFTP 文件系统，可以使用下面的配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 基本认证设置...
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 基于 SSH 密钥并带加密口令的认证设置...
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 文件／目录权限设置...
    'visibility' => 'private', // `private` = 0600, `public` = 0644
    'directory_visibility' => 'private', // `private` = 0700, `public` = 0755

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
### 限定范围与只读文件系统

限定范围的磁盘允许你定义一个文件系统，其中所有路径都会自动加上给定路径前缀作为前缀。创建限定范围的文件系统磁盘之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以通过定义一个使用 `scoped` 驱动的磁盘，为任意已有文件系统磁盘创建路径限定范围的实例。例如，你可以创建一个把已有的 `s3` 磁盘限定到特定路径前缀的磁盘，此后使用该限定范围磁盘的每一次文件操作都会使用指定前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

「只读」磁盘允许你创建不允许写操作的文件系统磁盘。使用 `read-only` 配置选项之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-read-only "^3.0"
```

接下来，你可以在一个或多个磁盘的配置数组中加入 `read-only` 配置选项：

```php
's3-videos' => [
    'driver' => 's3',
    // ...
    'read-only' => true,
],
```

<a name="amazon-s3-compatible-filesystems"></a>
### 兼容 Amazon S3 的文件系统

默认情况下，应用的 `filesystems` 配置文件包含一个 `s3` 磁盘配置。除了用该磁盘与 [Amazon S3](https://aws.amazon.com/s3/) 交互外，你还可以用它与任何兼容 S3 的文件存储服务交互，例如 [MinIO](https://github.com/minio/minio)、[DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/)、[Vultr Object Storage](https://www.vultr.com/products/object-storage/)、[Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) 或 [Hetzner Cloud Storage](https://www.hetzner.com/storage/object-storage/)。

通常情况下，把磁盘凭据更新为与计划使用的服务凭据一致后，你只需更新 `endpoint` 配置选项的值。该选项的值通常通过 `AWS_ENDPOINT` 环境变量定义：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://minio:9000'),
```

<a name="minio"></a>
#### MinIO

为了让 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，你应当定义 `AWS_URL` 环境变量，使其与应用的本地域名一致，并在 URL 路径中包含存储桶名称：

```ini
AWS_URL=http://localhost:9000/local
```

> [!WARNING]
> 使用 MinIO 时，如果 `endpoint` 无法被客户端访问，那么通过 `temporaryUrl` 方法生成临时存储 URL 可能无法正常工作。

<a name="obtaining-disk-instances"></a>
## 获取磁盘实例

你可以使用 `Storage` Facade 与任意已配置的磁盘交互。例如，可以使用该 Facade 上的 `put` 方法把头像存储到默认磁盘。如果你在未先调用 `disk` 方法的情况下直接调用 `Storage` Facade 上的方法，该方法会自动作用于默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用与多个磁盘交互，可以使用 `Storage` Facade 上的 `disk` 方法操作特定磁盘上的文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

<a name="on-demand-disks"></a>
### 按需创建的磁盘

有时你可能希望用给定配置在运行时创建磁盘，而该配置实际上并未出现在应用的 `filesystems` 配置文件中。为此，你可以把配置数组传给 `Storage` Facade 的 `build` 方法：

```php
use Illuminate\Support\Facades\Storage;

$disk = Storage::build([
    'driver' => 'local',
    'root' => '/path/to/root',
]);

$disk->put('image.jpg', $content);
```

<a name="retrieving-files"></a>
## 获取文件

`get` 方法可用于获取文件内容。该方法会返回文件的原始字符串内容。请记住，所有文件路径都应相对于磁盘的「根」位置指定：

```php
$contents = Storage::get('file.jpg');
```

如果你要获取的文件包含 JSON，可以使用 `json` 方法获取该文件并解码其内容：

```php
$orders = Storage::json('orders.json');
```

`exists` 方法可用于判断文件是否存在于磁盘上：

```php
if (Storage::disk('s3')->exists('file.jpg')) {
    // ...
}
```

`missing` 方法可用于判断文件是否已从磁盘中丢失：

```php
if (Storage::disk('s3')->missing('file.jpg')) {
    // ...
}
```

<a name="downloading-files"></a>
### 下载文件

`download` 方法可用于生成一个响应，强制用户浏览器下载指定路径的文件。`download` 方法的第二个参数接受文件名，它将决定下载文件的用户所看到的文件名。最后，你还可以把一组 HTTP 响应头作为方法的第三个参数传入：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

<a name="file-urls"></a>
### 文件 URL

你可以使用 `url` 方法获取指定文件的 URL。如果你使用 `local` 驱动，该方法通常只是在给定路径前加上 `/storage`，并返回指向该文件的相对 URL。如果你使用 `s3` 驱动，则会返回完整的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

使用 `local` 驱动时，所有应当可公开访问的文件都应放在 `storage/app/public` 目录中。此外，你应当在 `public/storage` 处[创建一个符号链接](#the-public-disk)，指向 `storage/app/public` 目录。

> [!WARNING]
> 使用 `local` 驱动时，`url` 的返回值不会做 URL 编码。因此，我们建议你始终使用能生成有效 URL 的文件名来存储文件。

<a name="url-host-customization"></a>
#### URL 主机定制

如果你想修改使用 `Storage` Facade 生成的 URL 的主机，可以在磁盘的配置数组中添加或修改 `url` 选项：

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

使用 `temporaryUrl` 方法，你可以为通过 `local` 和 `s3` 驱动存储的文件创建临时 URL。该方法接受一个路径和一个指定 URL 过期时间的 `DateTime` 实例：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::temporaryUrl(
    'file.jpg', now()->addMinutes(5)
);
```

<a name="enabling-local-temporary-urls"></a>
#### 启用本地临时 URL

如果你的应用是在 `local` 驱动支持临时 URL 之前就开始开发的，可能需要启用本地临时 URL。为此，请在 `config/filesystems.php` 配置文件中，为 `local` 磁盘的配置数组添加 `serve` 选项：

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

如果你需要指定额外的 [S3 请求参数](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html#RESTObjectGET-requests)，可以把请求参数数组作为 `temporaryUrl` 方法的第三个参数传入：

```php
$url = Storage::temporaryUrl(
    'file.jpg',
    now()->addMinutes(5),
    [
        'ResponseContentType' => 'application/octet-stream',
        'ResponseContentDisposition' => 'attachment; filename=file2.jpg',
    ]
);
```

<a name="customizing-temporary-urls"></a>
#### 定制临时 URL

如果你需要为特定存储磁盘定制临时 URL 的创建方式，可以使用 `buildTemporaryUrlsUsing` 方法。例如，如果你有一个控制器允许你下载通过某个通常不支持临时 URL 的磁盘存储的文件，这个方法会很有用。通常应当从某个服务提供者的 `boot` 方法中调用该方法：

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
> 生成临时上传 URL 的能力只有 `s3` 驱动支持。

如果你需要生成一个可直接从客户端应用上传文件的临时 URL，可以使用 `temporaryUploadUrl` 方法。该方法接受一个路径和一个指定 URL 过期时间的 `DateTime` 实例。`temporaryUploadUrl` 方法返回一个关联数组，可以解构为上传 URL 和上传请求中应当包含的响应头：

```php
use Illuminate\Support\Facades\Storage;

['url' => $url, 'headers' => $headers] = Storage::temporaryUploadUrl(
    'file.jpg', now()->addMinutes(5)
);
```

该方法主要适用于无服务器环境，这类环境要求客户端应用直接把文件上传到 Amazon S3 之类的云存储系统。

<a name="file-metadata"></a>
### 文件元数据

除了读写文件之外，Laravel 还能提供文件本身的相关信息。例如，`size` 方法可用于获取文件字节数：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件最后修改时间对应的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

指定文件的 MIME 类型可以通过 `mimeType` 方法获取：

```php
$mime = Storage::mimeType('file.jpg');
```

<a name="file-paths"></a>
#### 文件路径

你可以使用 `path` 方法获取指定文件的路径。如果你使用 `local` 驱动，该方法会返回文件的绝对路径。如果你使用 `s3` 驱动，该方法会返回文件在 S3 存储桶中的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

<a name="storing-files"></a>
## 存储文件

`put` 方法可用于把文件内容存储到磁盘上。你也可以向 `put` 方法传入一个 PHP `resource`，它会使用 Flysystem 底层的流支持。请记住，所有文件路径都应相对于为该磁盘配置的「根」位置指定：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

<a name="failed-writes"></a>
#### 写入失败

如果 `put` 方法（或其它「写」操作）无法把文件写入磁盘，就会返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 该文件无法写入磁盘...
}
```

如果愿意，你可以在文件系统磁盘的配置数组中定义 `throw` 选项。当该选项定义为 `true` 时，`put` 等「写」方法会在写操作失败时抛出 `League\Flysystem\UnableToWriteFile` 实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

<a name="prepending-appending-to-files"></a>
### 前置与追加内容到文件

`prepend` 和 `append` 方法允许你写入文件的开头或结尾：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

<a name="copying-moving-files"></a>
### 复制与移动文件

`copy` 方法可用于把已有文件复制到磁盘上的新位置，而 `move` 方法可用于重命名已有文件或把它移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

<a name="automatic-streaming"></a>
### 自动流式传输

把文件流式传输到存储可以显著减少内存占用。如果你希望 Laravel 自动把给定文件流式传输到你的存储位置，可以使用 `putFile` 或 `putFileAs` 方法。该方法接受一个 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并自动把文件流式传输到你期望的位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 为文件名自动生成唯一 ID...
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名...
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

关于 `putFile` 方法有几点重要事项需要注意。注意，我们只指定了目录名，而没有指定文件名。默认情况下，`putFile` 方法会生成一个唯一 ID 作为文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。`putFile` 方法会返回文件的路径，因此你可以把包含生成文件名的完整路径存入数据库。

`putFile` 和 `putFileAs` 方法还接受一个参数，用于指定所存储文件的「可见性」。如果你把文件存储在 Amazon S3 之类的云磁盘上，并希望通过生成的 URL 公开访问文件，这一点尤其有用：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

<a name="file-uploads"></a>
### 文件上传

在 Web 应用中，存储文件最常见的用例之一是存储用户上传的文件，例如照片和文档。Laravel 让你可以轻松地使用上传文件实例上的 `store` 方法来存储上传的文件。调用 `store` 方法时，传入你希望存储上传文件的路径：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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

这个示例中有几点重要事项需要注意。注意，我们只指定了目录名，而没有指定文件名。默认情况下，`store` 方法会生成一个唯一 ID 作为文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。`store` 方法会返回文件的路径，因此你可以把包含生成文件名的完整路径存入数据库。

你也可以在 `Storage` Facade 上调用 `putFile` 方法，执行与上例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

<a name="specifying-a-file-name"></a>
#### 指定文件名

如果你不希望为所存储的文件自动分配文件名，可以使用 `storeAs` 方法，它接收路径、文件名以及（可选的）磁盘作为参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以在 `Storage` Facade 上使用 `putFileAs` 方法，它会执行与上例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> [!WARNING]
> 不可打印的字符和无效的 Unicode 字符会自动从文件路径中移除。因此，你可能需要在把文件路径传给 Laravel 的文件存储方法之前先对其做净化处理。文件路径会使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法进行规范化。

<a name="specifying-a-disk"></a>
#### 指定磁盘

默认情况下，该上传文件的 `store` 方法会使用你的默认磁盘。如果你想指定其它磁盘，请把磁盘名作为 `store` 方法的第二个参数传入：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你使用 `storeAs` 方法，可以把磁盘名作为方法的第三个参数传入：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="other-uploaded-file-information"></a>
#### 其它上传文件信息

如果你想获取上传文件的原始名称和扩展名，可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

不过请记住，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被认为是不安全的，因为文件名和扩展名可能被恶意用户篡改。因此，通常你应当优先使用 `hashName` 和 `extension` 方法来获取给定文件上传的名称和扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一的随机名称...
$extension = $file->extension(); // 根据文件的 MIME 类型确定扩展名...
```

<a name="file-visibility"></a>
### 文件可见性

在 Laravel 的 Flysystem 集成中，「可见性」是跨多平台文件权限的一种抽象。文件可以被声明为 `public` 或 `private`。当文件被声明为 `public` 时，表示该文件通常应当可被他人访问。例如，使用 S3 驱动时，你可以获取 `public` 文件的 URL。

你可以在通过 `put` 方法写入文件时设置其可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已经被存储，可以通过 `getVisibility` 和 `setVisibility` 方法获取并设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

与上传文件交互时，可以使用 `storePublicly` 和 `storePubliclyAs` 方法以 `public` 可见性存储上传文件：

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

`delete` 方法接受一个文件名或一组要删除的文件：

```php
use Illuminate\Support\Facades\Storage;

Storage::delete('file.jpg');

Storage::delete(['file.jpg', 'file2.jpg']);
```

必要时，你可以指定要从哪个磁盘上删除文件：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->delete('path/file.jpg');
```

<a name="directories"></a>
## 目录

<a name="get-all-files-within-a-directory"></a>
#### 获取目录中的所有文件

`files` 方法返回给定目录下所有文件的数组。如果你想获取某个目录下包含所有子目录在内的全部文件列表，可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

<a name="get-all-directories-within-a-directory"></a>
#### 获取目录中的所有子目录

`directories` 方法返回给定目录下所有子目录的数组。此外，你可以使用 `allDirectories` 方法获取某个目录及其所有子目录下的全部目录列表：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

<a name="create-a-directory"></a>
#### 创建目录

`makeDirectory` 方法会创建给定目录，包括其中所需的任何子目录：

```php
Storage::makeDirectory($directory);
```

<a name="delete-a-directory"></a>
#### 删除目录

最后，`deleteDirectory` 方法可用于移除一个目录及其中的所有文件：

```php
Storage::deleteDirectory($directory);
```

<a name="testing"></a>
## 测试

`Storage` Facade 的 `fake` 方法让你可以轻松生成一个假磁盘；结合 `Illuminate\Http\UploadedFile` 类的文件生成工具，它能极大简化文件上传的测试。例如：

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

    // 断言一个或多个文件已存储...
    Storage::disk('photos')->assertExists('photo1.jpg');
    Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

    // 断言一个或多个文件未被存储...
    Storage::disk('photos')->assertMissing('missing.jpg');
    Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

    // 断言给定目录中的文件数量与预期数量一致...
    Storage::disk('photos')->assertCount('/wallpapers', 2);

    // 断言给定目录为空...
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

        // 断言一个或多个文件已存储...
        Storage::disk('photos')->assertExists('photo1.jpg');
        Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

        // 断言一个或多个文件未被存储...
        Storage::disk('photos')->assertMissing('missing.jpg');
        Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

        // 断言给定目录中的文件数量与预期数量一致...
        Storage::disk('photos')->assertCount('/wallpapers', 2);

        // 断言给定目录为空...
        Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');
    }
}
```

默认情况下，`fake` 方法会删除其临时目录中的所有文件。如果你想保留这些文件，可以改用 "persistentFake" 方法。关于文件上传测试的更多信息，请查阅 [HTTP 测试文档中关于文件上传的部分](/docs/{{version}}/http-tests#testing-file-uploads)。

> [!WARNING]
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

<a name="custom-filesystems"></a>
## 自定义文件系统

Laravel 的 Flysystem 集成开箱即用地支持若干「驱动」；不过 Flysystem 并不局限于这些，它还为许多其它存储系统提供了适配器。如果你想在 Laravel 应用中使用这些额外适配器，可以创建自定义驱动。

要定义自定义文件系统，你需要一个 Flysystem 适配器。让我们为项目添加一个社区维护的 Dropbox 适配器：

```shell
composer require spatie/flysystem-dropbox
```

接下来，你可以在应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中注册该驱动。为此，你应当使用 `Storage` Facade 的 `extend` 方法：

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

`extend` 方法的第一个参数是驱动名称，第二个参数是接收 `$app` 和 `$config` 变量的闭包。该闭包必须返回一个 `Illuminate\Filesystem\FilesystemAdapter` 实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

创建并注册扩展的服务提供者后，你就可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动了。
