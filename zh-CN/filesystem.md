# 文件存储

## 简介

Laravel 借助 Frank de Jonge 开发的优秀 PHP 包 [Flysystem](https://github.com/thephpleague/flysystem)，提供了一套强大的文件系统抽象层。Laravel 的 Flysystem 集成提供了用于操作本地文件系统、SFTP 和 Amazon S3 的简单驱动（driver）。更棒的是，由于每种存储方式的 API 都相同，在本地开发机与生产服务器之间切换这些存储选项异常简单。

## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。在该文件中，你可以配置所有的文件系统"磁盘"（disks）。每个磁盘代表一个特定的存储驱动与存储位置。配置文件中包含了每种受支持驱动的示例配置，你可以修改这些配置以反映你的存储偏好与凭据。

`local` 驱动操作的是运行 Laravel 应用的服务器本地存储的文件，而 `sftp` 存储驱动用于基于 SSH 密钥的 FTP。`s3` 驱动则用于写入 Amazon 的 S3 云存储服务。

> [!NOTE]
> 你可以按需配置任意数量的磁盘，甚至可以配置多个使用同一驱动的磁盘。

### 本地驱动

使用 `local` 驱动时，所有文件操作都相对于你 `filesystems` 配置文件中定义的 `root` 目录。默认情况下，该值设为 `storage/app/private` 目录。因此，下面的方法会写入 `storage/app/private/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

### 公共磁盘

应用 `filesystems` 配置文件中自带的 `public` 磁盘用于存放那些需要公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动，并将文件存储在 `storage/app/public` 中。

如果你的 `public` 磁盘使用 `local` 驱动，且希望这些文件能通过 Web 访问，应当创建一个从源目录 `storage/app/public` 指向目标目录 `public/storage` 的符号链接：

要创建符号链接，可以使用 `storage:link` 这个 Artisan 命令：

```shell
php artisan storage:link
```

文件存储完成且符号链接创建之后，就可以使用 `asset` 辅助函数生成指向该文件的 URL：

```php
echo asset('storage/file.txt');
```

你可以在 `filesystems` 配置文件中配置额外的符号链接。运行 `storage:link` 命令时，所有配置好的链接都会被创建：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

可以使用 `storage:unlink` 命令来删除你配置的符号链接：

```shell
php artisan storage:unlink
```

### 驱动前置条件

#### S3 驱动配置

在使用 S3 驱动之前，你需要通过 Composer 包管理器安装 Flysystem 的 S3 包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

一个 S3 磁盘的配置数组位于你的 `config/filesystems.php` 配置文件中。通常，你应该使用 `config/filesystems.php` 配置文件所引用的以下环境变量来配置 S3 的相关信息与凭据：

```ini
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=<your-bucket-name>
AWS_USE_PATH_STYLE_ENDPOINT=false
```

为了便于使用，这些环境变量的命名规范与 AWS CLI 保持一致。

#### FTP 驱动配置

在使用 FTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem 的 FTP 包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成与 FTP 配合得很好；不过，框架默认的 `config/filesystems.php` 配置文件中没有提供示例配置。如果你需要配置 FTP 文件系统，可以使用下面的配置示例：

```php
'ftp' => [
    'driver' => 'ftp',
    'host' => env('FTP_HOST'),
    'username' => env('FTP_USERNAME'),
    'password' => env('FTP_PASSWORD'),

    // FTP 可选配置……
    // 'port' => env('FTP_PORT', 21),
    // 'root' => env('FTP_ROOT'),
    // 'passive' => true,
    // 'ssl' => true,
    // 'timeout' => 30,
],
```

#### SFTP 驱动配置

在使用 SFTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem 的 SFTP 包：

```shell
composer require league/flysystem-sftp-v3 "^3.0"
```

Laravel 的 Flysystem 集成与 SFTP 配合得很好；不过，框架默认的 `config/filesystems.php` 配置文件中没有提供示例配置。如果你需要配置 SFTP 文件系统，可以使用下面的配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 用于基础认证的配置……
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 用于基于 SSH 密钥（带加密密码）认证的配置……
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 用于文件 / 目录权限的配置……
    'visibility' => 'private', // `private` = 0600, `public` = 0644
    'directory_visibility' => 'private', // `private` = 0700, `public` = 0755

    // SFTP 可选配置……
    // 'hostFingerprint' => env('SFTP_HOST_FINGERPRINT'),
    // 'maxTries' => 4,
    // 'passphrase' => env('SFTP_PASSPHRASE'),
    // 'port' => env('SFTP_PORT', 22),
    // 'root' => env('SFTP_ROOT', ''),
    // 'timeout' => 30,
    // 'useAgent' => true,
],
```

### 作用域、只读与读穿文件系统

作用域（scoped）磁盘允许你定义一个文件系统，其中所有路径都会自动加上给定的路径前缀。在创建作用域文件系统磁盘之前，你需要通过 Composer 包管理器安装一个额外的 Flysystem 包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以定义一个使用 `scoped` 驱动的磁盘，从而为任意已有的文件系统磁盘创建一个路径作用域实例。例如，你可以创建一个将现有 `s3` 磁盘限定到某个特定路径前缀的磁盘，之后所有使用该作用域磁盘的文件操作都会使用指定的前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

"只读"（read-only）磁盘允许你创建不允许写入操作的文件系统磁盘。在使用 `read-only` 配置项之前，你需要通过 Composer 包管理器安装一个额外的 Flysystem 包：

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

读穿（read-through）磁盘允许你在零停机的状态下在磁盘之间迁移文件。读取文件时，Laravel 会先检查主磁盘。如果文件仅存在于备用磁盘上，Laravel 会从备用磁盘读取该文件，并将其复制到主磁盘，以备后续请求使用：

```php
'assets' => [
    'driver' => 'read-through',
    'primary' => 's3',
    'fallback' => 'legacy-s3',
],
```

写入与目录列表都以主磁盘为目标。文件存在性与元数据的检查会使用任一磁盘，而不会将文件复制到主磁盘。如果将被用磁盘上的文件复制到主磁盘时失败，默认情况下读取仍然成功。若希望在失败时抛出异常，可将 `throw_on_promotion_failure` 配置项设为 `true`。

### 兼容 Amazon S3 的文件系统

默认情况下，应用的 `filesystems` 配置文件包含 `s3` 磁盘的配置。除了使用该磁盘与 [Amazon S3](https://aws.amazon.com/s3/) 交互之外，你也可以用它与任何兼容 S3 的文件存储服务交互，例如 [RustFS](https://github.com/rustfs/rustfs)、[DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/)、[Vultr Object Storage](https://www.vultr.com/products/object-storage/)、[Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) 或 [Hetzner Cloud Storage](https://www.hetzner.com/storage/object-storage/)。

通常，在将磁盘的凭据更新为你要使用的服务的凭据之后，你只需更新 `endpoint` 配置项的值。该选项的值通常通过 `AWS_ENDPOINT` 环境变量定义：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://rustfs:9000'),
```

## 获取磁盘实例

`Storage` Facade 可用于与任意已配置的磁盘交互。例如，可以使用该 Facade 上的 `put` 方法将头像存储到默认磁盘上。如果在 `Storage` Facade 上调用方法时没有先调用 `disk` 方法，那么该方法会自动转发给默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用需要与多个磁盘交互，可以使用 `Storage` Facade 上的 `disk` 方法来操作特定磁盘上的文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

### 按需磁盘

有时你可能希望使用给定的配置在运行时创建一个磁盘，而该配置实际上并不存在于应用的 `filesystems` 配置文件中。为此，可以向 `Storage` Facade 的 `build` 方法传入一个配置数组：

```php
use Illuminate\Support\Facades\Storage;

$disk = Storage::build([
    'driver' => 'local',
    'root' => '/path/to/root',
]);

$disk->put('image.jpg', $content);
```

## 检索文件

可以使用 `get` 方法检索文件的内容。该方法会返回文件的原始字符串内容。注意，所有文件路径都应相对于磁盘的"root"位置指定：

```php
$contents = Storage::get('file.jpg');
```

如果你要检索的文件包含 JSON，可以使用 `json` 方法来获取文件并解码其内容：

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

### 下载文件

`download` 方法可用于生成一个响应，强制用户的浏览器下载指定路径下的文件。`download` 方法的第二个参数接受一个文件名，它将决定下载文件的用户所看到的文件名。最后，你还可以将一组 HTTP 头作为第三个参数传给该方法：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

### 文件 URL

可以使用 `url` 方法获取指定文件的 URL。如果你使用的是 `local` 驱动，该方法通常只会在给定路径前加上 `/storage` 并返回该文件的相对 URL。如果你使用的是 `s3` 驱动，则会返回完整的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

使用 `local` 驱动时，所有需要公开访问的文件都应放在 `storage/app/public` 目录中。此外，你还应当在 `public/storage` 处创建符号链接，指向 `storage/app/public` 目录。

> [!WARNING]
> 使用 `local` 驱动时，`url` 的返回值并未经过 URL 编码。因此，我们建议始终使用能够生成有效 URL 的名称来存储文件。

#### URL 主机定制

如果你想修改使用 `Storage` Facade 生成的 URL 的主机（host），可以在磁盘的配置数组中添加或修改 `url` 选项：

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
    'throw' => false,
],
```

### 临时 URL

使用 `temporaryUrl` 方法，你可以为使用 `local` 和 `s3` 驱动存储的文件创建临时 URL。该方法接受一个路径和一个 `DateTime` 实例，用于指定 URL 的过期时间：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::temporaryUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

#### 启用本地临时 URL

如果你在 `local` 驱动支持临时 URL 之前就开始开发应用，可能需要手动启用本地临时 URL。为此，可以在 `config/filesystems.php` 配置文件中，向 `local` 磁盘的配置数组添加 `serve` 选项：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    'serve' => true, // [tl! add]
    'throw' => false,
],
```

#### S3 请求参数

如果你需要指定额外的 [S3 请求参数](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html#RESTObjectGET-requests)，可以将请求参数数组作为第三个参数传给 `temporaryUrl` 方法：

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

#### 定制临时 URL

如果你需要为某个特定的存储磁盘定制临时 URL 的生成方式，可以使用 `buildTemporaryUrlsUsing` 方法。例如，当你有一个控制器，允许下载通过某个通常不支持临时 URL 的磁盘存储的文件时，这就会很有用。通常，该方法应当从某个服务提供者的 `boot` 方法中调用：

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
     * 引导任意应用服务。
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

#### 临时上传 URL

> [!WARNING]
> 生成临时上传 URL 的能力仅受 `s3` 和 `local` 驱动支持。

如果你需要生成一个可用于从客户端应用直接上传文件的临时 URL，可以使用 `temporaryUploadUrl` 方法。该方法接受一个路径和一个 `DateTime` 实例，用于指定 URL 的过期时间。`temporaryUploadUrl` 方法会返回一个关联数组，可将其解构为上传 URL 以及应当随上传请求一起发送的头部：

```php
use Illuminate\Support\Facades\Storage;

['url' => $url, 'headers' => $headers] = Storage::temporaryUploadUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

该方法主要在无服务器（serverless）环境中很有用，这类环境要求客户端应用直接将文件上传到 Amazon S3 之类的云存储系统。

### 文件元数据

除了读写文件，Laravel 还能提供文件本身的相关信息。例如，可以使用 `size` 方法获取文件的大小（以字节为单位）：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件最后一次被修改时的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

可以使用 `mimeType` 方法获取指定文件的 MIME 类型：

```php
$mime = Storage::mimeType('file.jpg');
```

#### 文件路径

可以使用 `path` 方法获取指定文件的路径。如果你使用的是 `local` 驱动，该方法会返回文件的绝对路径。如果你使用的是 `s3` 驱动，该方法会返回文件在 S3 桶中的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

## 存储文件

可以使用 `put` 方法将文件内容存储到磁盘上。你还可以向 `put` 方法传入一个 PHP `resource`，这会用上 Flysystem 底层的流支持。注意，所有文件路径都应相对于为磁盘配置的"root"位置指定：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

#### 写入失败

如果 `put` 方法（或其他"写入"操作）无法将文件写入磁盘，会返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 文件无法写入磁盘……
}
```

如果你愿意，可以在文件系统磁盘的配置数组中定义 `throw` 选项。当该选项设为 `true` 时，像 `put` 这样的"写入"方法会在写入操作失败时抛出 `League\Flysystem\UnableToWriteFile` 的实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

### 向文件开头前置与向末尾追加内容

`prepend` 和 `append` 方法允许你向文件的开头或末尾写入内容：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

### 复制与移动文件

`copy` 方法可用于将已有文件复制到磁盘上的新位置，而 `move` 方法可用于将已有文件重命名或移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

### 自动流式传输

将文件流式传输到存储位置能显著降低内存占用。如果你想让 Laravel 自动管理将给定文件流式传输到存储位置的过程，可以使用 `putFile` 或 `putFileAs` 方法。该方法接受 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并会自动将文件流式传输到目标位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 自动生成唯一 ID 作为文件名……
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名……
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

关于 `putFile` 方法，有几点需要注意。注意，我们只指定了目录名，而没有指定文件名。默认情况下，`putFile` 方法会生成一个唯一 ID 作为文件名。文件的扩展名将根据文件的 MIME 类型来确定。`putFile` 方法会返回文件的路径，因此你可以将包含所生成文件名的路径存入数据库。

`putFile` 和 `putFileAs` 方法还接受一个参数来指定所存储文件的"可见性"（visibility）。如果你将文件存储在 Amazon S3 这类云磁盘上，并希望文件能通过生成的 URL 公开访问，这一点尤其有用：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

### 文件上传

在 Web 应用中，存储文件最常见的用途之一就是保存用户上传的文件，例如照片和文档。Laravel 让存储上传文件变得非常容易，只需使用上传文件实例上的 `store` 方法即可。调用 `store` 方法时，传入你希望存储该上传文件的路径：

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

关于这个示例，有几点需要注意。注意，我们只指定了目录名，而没有指定文件名。默认情况下，`store` 方法会生成一个唯一 ID 作为文件名。文件的扩展名将根据文件的 MIME 类型来确定。`store` 方法会返回文件的路径，因此你可以将包含所生成文件名的路径存入数据库。

你也可以调用 `Storage` Facade 上的 `putFile` 方法来执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

#### 指定文件名

如果你不希望为存储的文件自动分配文件名，可以使用 `storeAs` 方法，该方法接收路径、文件名以及（可选的）磁盘作为参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以使用该 `Storage` Facade 上的 `putFileAs` 方法，它会执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> [!WARNING]
> 不可打印及无效的 Unicode 字符会从文件路径中自动移除。因此，在将文件路径传给 Laravel 的文件存储方法之前，你可能需要先对路径进行清理。文件路径会使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法进行规范化。

#### 指定磁盘

默认情况下，该上传文件的 `store` 方法会使用你的默认磁盘。如果你想指定其他磁盘，可以将磁盘名称作为第二个参数传给 `store` 方法：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你使用的是 `storeAs` 方法，可以将磁盘名称作为第三个参数传给该方法：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

#### 其他上传文件信息

如果你想获取上传文件的原始名称与扩展名，可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

不过要注意，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被认为是不安全的，因为文件名和扩展名可能被恶意用户篡改。因此，通常你应当优先使用 `hashName` 和 `extension` 方法来获取该上传文件的名称与扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一、随机的名称……
$extension = $file->extension(); // 根据文件的 MIME 类型判断其扩展名……
```

### 文件可见性

在 Laravel 的 Flysystem 集成中，"可见性"（visibility）是对跨平台文件权限的抽象。文件可以被声明为 `public` 或 `private`。当文件被声明为 `public` 时，表示该文件通常应当可被其他人访问。例如，使用 S3 驱动时，你可以获取 `public` 文件的 URL。

在通过 `put` 方法写入文件时，你可以设置其可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已经存储，就可以通过 `getVisibility` 和 `setVisibility` 方法获取与设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

在处理上传文件时，可以使用 `storePublicly` 和 `storePubliclyAs` 方法，以 `public` 可见性来存储上传的文件：

```php
$path = $request->file('avatar')->storePublicly('avatars', 's3');

$path = $request->file('avatar')->storePubliclyAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

### 图像处理

如果你需要在存储上传的图片之前对其调整大小、裁剪或转换格式，可以使用 Laravel 的[图像处理功能](/topic/Laravel%2013.x/rwyl24xvz8.html)：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->toWebp()
    ->storePublicly('avatars', 'public');
```

你也可以从已存储在某个文件系统磁盘上的文件创建图像实例：

```php
$image = Storage::disk('public')->image('avatars/photo.jpg');
```

#### 本地文件与可见性

使用 `local` 驱动时，`public` 可见性会转换为目录的 `0755` 权限与文件的 `0644` 权限。你可以在应用的 `filesystems` 配置文件中修改这些权限映射：

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

## 删除文件

`delete` 方法接受单个文件名或一个待删除文件数组：

```php
use Illuminate\Support\Facades\Storage;

Storage::delete('file.jpg');

Storage::delete(['file.jpg', 'file2.jpg']);
```

如有需要，你可以指定删除文件时所在的磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->delete('path/file.jpg');
```

## 目录

#### 获取目录内的所有文件

`files` 方法返回给定目录内所有文件的数组。如果你想获取给定目录（包含子目录）内所有文件的列表，可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

#### 获取目录内的所有子目录

`directories` 方法返回给定目录内所有子目录的数组。如果你想获取给定目录（包含子目录）内所有子目录的列表，可以使用 `allDirectories` 方法：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

#### 创建目录

`makeDirectory` 方法会创建给定目录，包括所有必需的子目录：

```php
Storage::makeDirectory($directory);
```

#### 删除目录

最后，`deleteDirectory` 方法可用于删除一个目录及其所有文件：

```php
Storage::deleteDirectory($directory);
```

## 测试

`Storage` Facade 的 `fake` 方法让你可以轻松生成一个伪磁盘，结合 `Illuminate\Http\UploadedFile` 类的文件生成工具，能极大地简化文件上传的测试。例如：

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

    // 断言一个或多个文件已存储……
    Storage::disk('photos')->assertExists('photo1.jpg');
    Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

    // 断言一个或多个文件未存储……
    Storage::disk('photos')->assertMissing('missing.jpg');
    Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

    // 断言给定目录中的文件数量与预期数量一致……
    Storage::disk('photos')->assertCount('/wallpapers', 2);

    // 断言给定目录为空……
    Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');

    // 断言该磁盘不包含任何文件……
    Storage::disk('photos')->assertEmpty();
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

        // 断言一个或多个文件已存储……
        Storage::disk('photos')->assertExists('photo1.jpg');
        Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

        // 断言一个或多个文件未存储……
        Storage::disk('photos')->assertMissing('missing.jpg');
        Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

        // 断言给定目录中的文件数量与预期数量一致……
        Storage::disk('photos')->assertCount('/wallpapers', 2);

        // 断言给定目录为空……
        Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');

        // 断言该磁盘不包含任何文件……
        Storage::disk('photos')->assertEmpty();
    }
}
```

默认情况下，`fake` 方法会删除其临时目录中的所有文件。如果你想保留这些文件，可以使用 "persistentFake" 方法。关于文件上传测试的更多信息，可以查阅 [HTTP 测试文档中关于文件上传的章节](/topic/Laravel%2013.x/xq9zr0jvdo.html)。

> [!WARNING]
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

## 自定义文件系统

Laravel 的 Flysystem 集成开箱即用地支持多种"驱动"（drivers）；不过，Flysystem 并不限于这些，它还提供了许多其他存储系统的适配器（adapter）。如果你想在 Laravel 应用中使用这些额外的适配器之一，可以创建一个自定义驱动。

要定义自定义文件系统，你需要一个 Flysystem 适配器。我们来给项目添加一个由社区维护的 Dropbox 适配器：

```shell
composer require spatie/flysystem-dropbox
```

接下来，可以在应用某个[服务提供者](/topic/Laravel%2013.x/qk942kovw1.html)的 `boot` 方法中注册该驱动。为此，应当使用 `Storage` Facade 的 `extend` 方法：

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
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
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

`extend` 方法的第一个参数是驱动名称，第二个是一个接收 `$app` 和 `$config` 变量的闭包。该闭包必须返回 `Illuminate\Filesystem\FilesystemAdapter` 的实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

一旦你创建并注册了该扩展的服务提供者，就可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动了。