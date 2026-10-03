# 文件存储

- [简介](#introduction)
- [配置](#configuration)
    - [Local 驱动](#the-local-driver)
    - [Public 磁盘](#the-public-disk)
    - [驱动前提条件](#driver-prerequisites)
    - [作用域与只读文件系统](#scoped-and-read-only-filesystems)
    - [兼容 Amazon S3 的文件系统](#amazon-s3-compatible-filesystems)
- [获取磁盘实例](#obtaining-disk-instances)
    - [按需磁盘](#on-demand-disks)
- [检索文件](#retrieving-files)
    - [下载文件](#downloading-files)
    - [文件 URL](#file-urls)
    - [文件元数据](#file-metadata)
- [存储文件](#storing-files)
    - [在文件前部与尾部追加内容](#prepending-appending-to-files)
    - [复制与移动文件](#copying-moving-files)
    - [自动流式传输](#automatic-streaming)
    - [文件上传](#file-uploads)
    - [文件可见性](#file-visibility)
- [删除文件](#deleting-files)
- [目录](#directories)
- [自定义文件系统](#custom-filesystems)

<a name="introduction"></a>
## 简介

得益于 Frank de Jonge 开发的优秀 [Flysystem](https://github.com/thephpleague/flysystem) PHP 包，Laravel 提供了强大的文件系统抽象。Laravel 的 Flysystem 集成为本地文件系统、SFTP 和 Amazon S3 提供了简单的驱动。更棒的是，由于每个系统的 API 保持一致，在你的本地开发机器和生产服务器之间切换这些存储选项非常简单。

<a name="configuration"></a>
## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。在此文件中，你可以配置所有文件系统"磁盘"。每个磁盘代表一个特定的存储驱动和存储位置。配置文件中包含每个支持的驱动的示例配置，你可以修改配置以反映你的存储偏好和凭证。

`local` 驱动与运行 Laravel 应用的服务器上本地存储的文件交互，而 `s3` 驱动用于写入 Amazon 的 S3 云存储服务。

> **Note**
> 你可以配置任意数量的磁盘，甚至可以有多个使用同一驱动的磁盘。

<a name="the-local-driver"></a>
### Local 驱动

使用 `local` 驱动时，所有文件操作都相对于 `filesystems` 配置文件中定义的 `root` 目录。默认情况下，此值设置为 `storage/app` 目录。因此，以下方法将写入 `storage/app/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

<a name="the-public-disk"></a>
### Public 磁盘

应用 `filesystems` 配置文件中包含的 `public` 磁盘用于将要公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动并将文件存储在 `storage/app/public` 中。

要使这些文件可从 Web 访问，你应该创建一个从 `public/storage` 到 `storage/app/public` 的符号链接。使用此文件夹约定可以将公开访问的文件保存在一个目录中，在使用 [Envoyer](https://envoyer.io) 等零停机部署系统时可以轻松地在部署之间共享。

要创建符号链接，你可以使用 `storage:link` Artisan 命令：

```shell
php artisan storage:link
```

文件存储并创建符号链接后，你可以使用 `asset` 助手函数创建指向文件的 URL：

```php
echo asset('storage/file.txt');
```

你可以在 `filesystems` 配置文件中配置额外的符号链接。运行 `storage:link` 命令时将创建每个配置的链接：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="s3-driver-configuration"></a>
#### S3 驱动配置

使用 S3 驱动之前，你需要通过 Composer 包管理器安装 Flysystem S3 包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0"
```

S3 驱动配置信息位于 `config/filesystems.php` 配置文件中。此文件包含 S3 驱动的示例配置数组。你可以自由地使用自己的 S3 配置和凭证修改此数组。为方便起见，这些环境变量与 AWS CLI 使用的命名约定一致。

<a name="ftp-driver-configuration"></a>
#### FTP 驱动配置

使用 FTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem FTP 包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成与 FTP 配合良好；但框架默认的 `filesystems.php` 配置文件中不包含示例配置。如果你需要配置 FTP 文件系统，可以使用以下配置示例：

```php
'ftp' => [
    'driver' => 'ftp',
    'host' => env('FTP_HOST'),
    'username' => env('FTP_USERNAME'),
    'password' => env('FTP_PASSWORD'),

    // 可选 FTP 设置...
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

Laravel 的 Flysystem 集成与 SFTP 配合良好；但框架默认的 `filesystems.php` 配置文件中不包含示例配置。如果你需要配置 SFTP 文件系统，可以使用以下配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 基本身份验证设置...
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 带加密密码的 SSH 密钥身份验证设置...
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 可选 SFTP 设置...
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

作用域磁盘允许你定义一个文件系统，其中所有路径都自动添加给定的路径前缀。在创建作用域文件系统磁盘之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以通过定义一个使用 `scoped` 驱动的磁盘，来创建任何现有文件系统磁盘的路径作用域实例。例如，你可以创建一个将现有 `s3` 磁盘限定到特定路径前缀的磁盘，然后使用作用域磁盘的每个文件操作都将使用指定的前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

"只读"磁盘允许你创建不允许写入操作的文件系统磁盘。在使用 `read-only` 配置选项之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-read-only "^3.0"
```

接下来，你可以在一个或多个磁盘的配置数组中包含 `read-only` 配置选项：

```php
's3-videos' => [
    'driver' => 's3',
    // ...
    'read-only' => true,
],
```

<a name="amazon-s3-compatible-filesystems"></a>
### 兼容 Amazon S3 的文件系统

默认情况下，应用的 `filesystems` 配置文件包含 `s3` 磁盘的配置。除了使用此磁盘与 Amazon S3 交互外，你还可以使用它与任何兼容 S3 的文件存储服务交互，例如 [MinIO](https://github.com/minio/minio) 或 [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/)。

通常，在更新磁盘凭证以匹配你计划使用的服务凭证后，你只需更新 `endpoint` 配置选项的值。此选项的值通常通过 `AWS_ENDPOINT` 环境变量定义：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://minio:9000'),
```

<a name="minio"></a>
#### MinIO

为了使 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，你应该定义 `AWS_URL` 环境变量，使其匹配应用的本地 URL 并在 URL 路径中包含存储桶名称：

```ini
AWS_URL=http://localhost:9000/local
```

> **Warning**
> 使用 MinIO 时不支持通过 `temporaryUrl` 方法生成临时存储 URL。

<a name="obtaining-disk-instances"></a>
## 获取磁盘实例

可以使用 `Storage` Facade 与任何已配置的磁盘交互。例如，你可以使用 Facade 的 `put` 方法将头像存储在默认磁盘上。如果在 `Storage` Facade 上调用方法时未先调用 `disk` 方法，该方法将自动传递给默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用与多个磁盘交互，可以使用 `Storage` Facade 的 `disk` 方法来处理特定磁盘上的文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

<a name="on-demand-disks"></a>
### 按需磁盘

有时你可能希望在运行时使用给定配置创建磁盘，而该配置实际上不存在于应用的 `filesystems` 配置文件中。为此，你可以将配置数组传递给 `Storage` Facade 的 `build` 方法：

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

`get` 方法可用于检索文件内容。方法将返回文件的原始字符串内容。请记住，所有文件路径都应相对于磁盘的"root"位置指定：

```php
$contents = Storage::get('file.jpg');
```

`exists` 方法可用于确定磁盘上是否存在某个文件：

```php
if (Storage::disk('s3')->exists('file.jpg')) {
    // ...
}
```

`missing` 方法可用于确定磁盘上是否缺少某个文件：

```php
if (Storage::disk('s3')->missing('file.jpg')) {
    // ...
}
```

<a name="downloading-files"></a>
### 下载文件

`download` 方法可用于生成一个强制用户浏览器下载给定路径文件的响应。`download` 方法接受文件名作为第二个参数，该参数将决定用户下载文件时看到的文件名。最后，你可以将 HTTP 头数组作为第三个参数传递给方法：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

<a name="file-urls"></a>
### 文件 URL

你可以使用 `url` 方法获取给定文件的 URL。如果你使用 `local` 驱动，这通常只是在给定路径前添加 `/storage` 并返回文件的相对 URL。如果你使用 `s3` 驱动，将返回完全限定的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

使用 `local` 驱动时，所有应公开访问的文件都应放在 `storage/app/public` 目录中。此外，你应该在 `public/storage` 处[创建符号链接](#the-public-disk)，指向 `storage/app/public` 目录。

> **Warning**
> 使用 `local` 驱动时，`url` 的返回值未经过 URL 编码。因此，我们建议始终使用能创建有效 URL 的名称来存储文件。

<a name="temporary-urls"></a>
#### 临时 URL

使用 `temporaryUrl` 方法，你可以为使用 `s3` 驱动存储的文件创建临时 URL。此方法接受一个路径和一个指定 URL 过期时间的 `DateTime` 实例：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::temporaryUrl(
    'file.jpg', now()->addMinutes(5)
);
```

如果需要指定额外的 [S3 请求参数](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html#RESTObjectGET-requests)，可以将请求数组作为第三个参数传递给 `temporaryUrl` 方法：

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

如果需要自定义特定存储磁盘的临时 URL 创建方式，可以使用 `buildTemporaryUrlsUsing` 方法。例如，如果你有一个控制器允许下载通过通常不支持临时 URL 的磁盘存储的文件，这就很有用。通常，此方法应从服务提供者的 `boot` 方法调用：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Storage::disk('local')->buildTemporaryUrlsUsing(function ($path, $expiration, $options) {
            return URL::temporarySignedRoute(
                'files.download',
                $expiration,
                array_merge($options, ['path' => $path])
            );
        });
    }
}
```

<a name="url-host-customization"></a>
#### URL 主机自定义

如果你想预定义使用 `Storage` Facade 生成的 URL 的主机，可以在磁盘的配置数组中添加 `url` 选项：

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
],
```

<a name="file-metadata"></a>
### 文件元数据

除了读写文件外，Laravel 还可以提供有关文件本身的信息。例如，`size` 方法可用于获取文件的字节大小：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件最后修改时间的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

给定文件的 MIME 类型可通过 `mimeType` 方法获取：

```php
$mime = Storage::mimeType('file.jpg')
```

<a name="file-paths"></a>
#### 文件路径

你可以使用 `path` 方法获取给定文件的路径。如果你使用 `local` 驱动，这将返回文件的绝对路径。如果你使用 `s3` 驱动，此方法将返回文件在 S3 存储桶中的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

<a name="storing-files"></a>
## 存储文件

`put` 方法可用于将文件内容存储到磁盘上。你也可以向 `put` 方法传递 PHP `resource`，这将使用 Flysystem 底层的流支持。请记住，所有文件路径都应相对于为磁盘配置的"root"位置指定：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

<a name="failed-writes"></a>
#### 写入失败

如果 `put` 方法（或其他"写入"操作）无法将文件写入磁盘，将返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 无法将文件写入磁盘...
}
```

如果需要，你可以在文件系统磁盘的配置数组中定义 `throw` 选项。当此选项定义为 `true` 时，`put` 等"写入"方法将在写入操作失败时抛出 `League\Flysystem\UnableToWriteFile` 实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

<a name="prepending-appending-to-files"></a>
### 在文件前部与尾部追加内容

`prepend` 和 `append` 方法允许你在文件开头或末尾写入：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

<a name="copying-moving-files"></a>
### 复制与移动文件

`copy` 方法可用于将现有文件复制到磁盘上的新位置，而 `move` 方法可用于重命名或将现有文件移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

<a name="automatic-streaming"></a>
### 自动流式传输

将文件流式传输到存储可以显著降低内存使用。如果你希望 Laravel 自动管理将给定文件流式传输到存储位置，可以使用 `putFile` 或 `putFileAs` 方法。此方法接受 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并自动将文件流式传输到你想要的位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 自动为文件名生成唯一 ID...
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名...
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

关于 `putFile` 方法有几点重要事项需要注意。注意我们只指定了目录名而非文件名。默认情况下，`putFile` 方法会生成一个唯一 ID 作为文件名。文件扩展名将通过检查文件的 MIME 类型确定。`putFile` 方法将返回文件路径，以便你可以将路径（包括生成的文件名）存储在数据库中。

`putFile` 和 `putFileAs` 方法还接受一个参数来指定存储文件的"可见性"。如果你将文件存储在 Amazon S3 等云磁盘上并希望通过生成的 URL 公开访问文件，这特别有用：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

<a name="file-uploads"></a>
### 文件上传

在 Web 应用中，存储文件最常见的用例之一是存储用户上传的文件，如照片和文档。Laravel 使用上传文件实例上的 `store` 方法使存储上传文件变得非常简单。用你希望存储上传文件的路径调用 `store` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserAvatarController extends Controller
{
    /**
     * 更新用户头像。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request)
    {
        $path = $request->file('avatar')->store('avatars');

        return $path;
    }
}
```

关于此示例有几点重要事项需要注意。注意我们只指定了目录名而非文件名。默认情况下，`store` 方法会生成一个唯一 ID 作为文件名。文件扩展名将通过检查文件的 MIME 类型确定。`store` 方法将返回文件路径，以便你可以将路径（包括生成的文件名）存储在数据库中。

你也可以在 `Storage` Facade 上调用 `putFile` 方法来执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

<a name="specifying-a-file-name"></a>
#### 指定文件名

如果你不希望自动为存储的文件分配文件名，可以使用 `storeAs` 方法，该方法接收路径、文件名和（可选）磁盘作为参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以使用 `Storage` Facade 的 `putFileAs` 方法，它将执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> **Warning**
> 不可打印和无效的 unicode 字符会自动从文件路径中移除。因此，你可能希望在将文件路径传递给 Laravel 的文件存储方法之前对其进行清理。文件路径使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法进行规范化。

<a name="specifying-a-disk"></a>
#### 指定磁盘

默认情况下，此上传文件的 `store` 方法将使用你的默认磁盘。如果你想指定其他磁盘，将磁盘名作为第二个参数传递给 `store` 方法：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你使用 `storeAs` 方法，可以将磁盘名作为第三个参数传递给方法：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="other-uploaded-file-information"></a>
#### 其他上传文件信息

如果你想获取上传文件的原始名称和扩展名，可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

但请记住，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被认为是不安全的，因为文件名和扩展名可能被恶意用户篡改。因此，你通常应该优先使用 `hashName` 和 `extension` 方法来获取给定文件上传的名称和扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一的随机名称...
$extension = $file->extension(); // 根据文件的 MIME 类型确定文件扩展名...
```

<a name="file-visibility"></a>
### 文件可见性

在 Laravel 的 Flysystem 集成中，"可见性"是跨多个平台文件权限的抽象。文件可以被声明为 `public` 或 `private`。当文件被声明为 `public` 时，表示该文件通常应可供他人访问。例如，使用 S3 驱动时，你可以为 `public` 文件检索 URL。

你可以在通过 `put` 方法写入文件时设置可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已经存储，可以通过 `getVisibility` 和 `setVisibility` 方法检索和设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

与上传文件交互时，你可以使用 `storePublicly` 和 `storePubliclyAs` 方法以 `public` 可见性存储上传文件：

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
],
```

<a name="deleting-files"></a>
## 删除文件

`delete` 方法接受单个文件名或要删除的文件数组：

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
#### 获取目录中的所有文件

`files` 方法返回给定目录中所有文件的数组。如果你想检索给定目录中包括所有子目录在内的所有文件列表，可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

<a name="get-all-directories-within-a-directory"></a>
#### 获取目录中的所有目录

`directories` 方法返回给定目录中所有目录的数组。此外，你可以使用 `allDirectories` 方法获取给定目录及其所有子目录中的所有目录列表：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

<a name="create-a-directory"></a>
#### 创建目录

`makeDirectory` 方法将创建给定目录，包括任何需要的子目录：

```php
Storage::makeDirectory($directory);
```

<a name="delete-a-directory"></a>
#### 删除目录

最后，`deleteDirectory` 方法可用于删除目录及其所有文件：

```php
Storage::deleteDirectory($directory);
```

<a name="custom-filesystems"></a>
## 自定义文件系统

Laravel 的 Flysystem 集成开箱即用地支持多个"驱动"；但 Flysystem 不限于此，它为许多其他存储系统提供了适配器。如果你想在 Laravel 应用中使用这些额外适配器之一，可以创建自定义驱动。

要定义自定义文件系统，你需要一个 Flysystem 适配器。让我们为项目添加一个社区维护的 Dropbox 适配器：

```shell
composer require spatie/flysystem-dropbox
```

接下来，你可以在应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中注册驱动。为此，你应该使用 `Storage` Facade 的 `extend` 方法：

```php
<?php

namespace App\Providers;

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
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Storage::extend('dropbox', function ($app, $config) {
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

`extend` 方法的第一个参数是驱动名称，第二个参数是一个接收 `$app` 和 `$config` 变量的闭包。闭包必须返回 `Illuminate\Filesystem\FilesystemAdapter` 实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

创建并注册扩展的服务提供者后，你就可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动了。
