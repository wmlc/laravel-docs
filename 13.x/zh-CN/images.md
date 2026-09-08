# 图像处理

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
- [读取图像](#reading-images)
    - [上传的文件](#uploaded-files)
    - [存储文件](#storage-files)
    - [其他来源](#other-sources)
- [处理图像](#manipulating-images)
    - [调整图像大小](#resizing-images)
    - [其他变换](#other-transformations)
- [图像编码](#encoding-images)
- [存储图像](#storing-images)
- [检查图像](#inspecting-images)
- [图像驱动](#image-drivers)
    - [自定义图像驱动](#custom-image-drivers)
    - [自定义变换](#custom-transformations)

<a name="introduction"></a>
## 简介

Laravel 提供了一套流畅的图像处理 API，让你可以使用整个框架中一以贯之的富有表现力的约定来调整大小、裁剪、编码和存储图像。Laravel 的图像功能由 [Intervention Image](https://image.intervention.io/) 提供支持，并支持 GD 和 Imagick PHP 扩展。

图像 API 在处理上传文件、存储在 Laravel [文件系统磁盘](/docs/{{version}}/filesystem)上的文件、本地文件、远程 URL 或原始图像字节时非常有用：

```php
use Illuminate\Support\Facades\Image;

$path = Image::fromStorage('avatars/photo.jpg', 'public')
    ->cover(400, 400)
    ->toWebp()
    ->quality(80)
    ->storePublicly('avatars', 'public');
```

> [!WARNING]
> 图像处理可能非常消耗 CPU 和内存。请考虑在[队列任务](/docs/{{version}}/queues)中执行大型图像处理工作负载，而不是在接收上传的 HTTP 请求期间处理。

<a name="installation"></a>
## 安装

在使用 Laravel 的图像处理功能之前，请通过 Composer 安装 Intervention Image 包：

```shell
composer require intervention/image:^4.0
```

你还应确保 PHP 安装中已安装 GD 或 Imagick 扩展，具体取决于应用将使用的驱动。

<a name="configuration"></a>
### 配置

Laravel 的图像配置文件位于 `config/images.php`。如果你的应用没有 `images` 配置文件，可以使用 `config:publish` Artisan 命令发布它：

```shell
php artisan config:publish images
```

图像配置文件允许你指定应用的默认图像驱动。你也可以使用 `IMAGE_DRIVER` 环境变量指定默认驱动。支持的驱动为 `gd` 和 `imagick`：

```ini
IMAGE_DRIVER=imagick
```

<a name="reading-images"></a>
## 读取图像

`Image` Facade 提供了几种从常见来源读取图像的方法。图像内容是延迟加载的，因此通常要到图像被处理或请求其字节时才会读取来源。

<a name="uploaded-files"></a>
### 上传的文件

你可以使用 `image` 方法从传入请求中获取上传的图像。该方法为上传的文件返回一个 `Illuminate\Image\Image` 实例，如果文件不存在则返回 `null`：

```php
use Illuminate\Http\Request;

Route::post('/avatar', function (Request $request) {
    $request->validate(['avatar' => ['required', 'image']]);

    $path = $request->image('avatar')
        ->cover(400, 400)
        ->toWebp()
        ->storePublicly('avatars', 'public');

    // ...
});
```

或者，你可以使用 `fromUpload` 方法从 `Illuminate\Http\UploadedFile` 实例创建图像实例：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromUpload($request->file('avatar'));
```

当从上传的文件创建图像时，你可以使用 `file` 方法获取底层上传的文件：

```php
$file = $image->file();
```

<a name="storage-files"></a>
### 存储文件

你可以使用 `fromStorage` 方法从应用[文件系统磁盘](/docs/{{version}}/filesystem)上存储的文件创建图像实例。第一个参数是文件路径，第二个参数是磁盘名称：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromStorage('avatars/photo.jpg', disk: 'public');
```

你也可以使用 `image` 方法直接从文件系统磁盘实例创建图像实例：

```php
use Illuminate\Support\Facades\Storage;

$image = Storage::disk('public')->image('avatars/photo.jpg');
```

<a name="other-sources"></a>
### 其他来源

`Image` Facade 还包含从原始字节、本地文件路径、远程 URL 和 Base64 编码字符串创建图像实例的方法：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromBytes($contents);
$image = Image::fromBase64($base64);
$image = Image::fromPath(storage_path('app/avatars/photo.jpg'));
$image = Image::fromUrl('https://example.com/photo.jpg');
```

<a name="manipulating-images"></a>
## 处理图像

图像实例是不可变的。每个处理方法都会返回一个新的图像实例，并将变换追加到其处理管线中，从而允许流畅地链式调用方法：

```php
$image = $request->image('avatar')
    ->orient()
    ->cover(400, 400)
    ->sharpen(10);
```

变换按照添加到图像管线的顺序处理，图像只在最后编码一次。

<a name="resizing-images"></a>
### 调整图像大小

`resize` 方法将图像调整为给定的尺寸。你可以同时提供宽度和高度，也可以使用命名参数仅提供一个维度：

```php
$image = $image->resize(800, 600);
$image = $image->resize(width: 800);
$image = $image->resize(height: 600);
```

`scale` 方法按比例缩小图像，使其适配给定的尺寸。该方法绝不会增大图像的尺寸：

```php
$image = $image->scale(800, 600);
$image = $image->scale(width: 800);
$image = $image->scale(height: 600);
```

`cover` 方法调整大小并裁剪图像，使其完全覆盖给定的尺寸：

```php
$image = $image->cover(400, 400);
```

`contain` 方法调整图像大小以适配给定尺寸，同时保留完整图像。如有必要，将使用可选的背景颜色填充空白区域：

```php
$image = $image->contain(400, 400);
$image = $image->contain(400, 400, '#ffffff');
$image = $image->contain(400, 400, 'dominant');
```

你可以将背景颜色指定为 `dominant`，以便使用图像的主色调填充空白区域。

你可以使用 `crop` 方法裁剪图像。前两个参数是期望的宽度和高度，可选的第三和第四个参数指定裁剪的 `x` 和 `y` 坐标：

```php
$image = $image->crop(300, 200);
$image = $image->crop(300, 200, x: 50, y: 25);
```

<a name="other-transformations"></a>
### 其他变换

Laravel 还提供了各种额外的图像变换方法：

```php
$image = $image->orient();
$image = $image->rotate(90);
$image = $image->rotate(90, '#ffffff');
$image = $image->rotate(90, 'dominant');
$image = $image->blur(5);
$image = $image->grayscale();
$image = $image->sharpen(10);
$image = $image->flipVertically();
$image = $image->flipHorizontally();
```

`orient` 方法根据图像的 EXIF 方向数据旋转图像。`rotate` 方法按给定角度顺时针旋转图像，并接受可选的背景颜色。`blur` 和 `sharpen` 方法接受 `0` 到 `100` 之间的值。

<a name="conditional-transformations"></a>
#### 条件变换

图像实例支持 Laravel 的 `Conditionable` Trait，允许你使用 `when` 和 `unless` 方法有条件地应用变换：

```php
$image = $request->image('avatar')
    ->when($request->boolean('crop'), fn ($image) => $image->cover(400, 400))
    ->unless($request->boolean('preserve_format'), fn ($image) => $image->toWebp());
```

<a name="encoding-images"></a>
## 图像编码

默认情况下，处理后的图像使用其原始格式编码。不过，你可以在获取或存储图像之前将其转换为其他受支持的格式：

```php
$image = $image->toWebp();
$image = $image->toJpg();
$image = $image->toJpeg();
$image = $image->toPng();
$image = $image->toGif();
$image = $image->toAvif();
$image = $image->toBmp();
```

你可以使用 `quality` 方法设置输出质量。质量将被限制在 `1` 到 `100` 之间：

```php
$image = $image->toWebp()->quality(80);
```

`optimize` 方法是将图像转换为给定格式并设置其质量的便捷快捷方式。默认情况下，图像会优化为质量 `70` 的 WebP 图像：

```php
$image = $image->optimize();

$image = $image->optimize(format: 'jpg', quality: 85);
```

你可以将处理后的图像内容作为字节字符串、Base64 编码字符串或数据 URI 获取：

```php
$bytes = $image->toBytes();
$base64 = $image->toBase64();
$dataUri = $image->toDataUri();
```

图像实例也可以转换为字符串以获取数据 URI：

```php
$dataUri = (string) $image;
```

<a name="storing-images"></a>
## 存储图像

`store` 方法将处理后的图像存储在应用的文件系统磁盘之一上。与上传文件一样，Laravel 会生成一个唯一的文件名并返回存储路径。第二个参数可用于指定磁盘：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->store(path: 'avatars');

$path = $request->image('avatar')
    ->cover(400, 400)
    ->store(path: 'avatars', disk: 's3');
```

你可以使用 `storeAs` 方法指定存储的文件名：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->storeAs(path: 'avatars', name: 'avatar.jpg', disk: 'public');
```

`storePublicly` 和 `storePubliclyAs` 方法以 `public` 可见性存储图像：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->storePublicly(path: 'avatars', disk: 'public');

$path = $request->image('avatar')
    ->cover(400, 400)
    ->storePubliclyAs(path: 'avatars', name: 'avatar.webp', disk: 'public');
```

如果图像无法存储，存储方法将返回 `false`。

<a name="inspecting-images"></a>
## 检查图像

你可以使用以下方法获取图像的 MIME 类型、扩展名、尺寸、宽度、高度和主色调：

```php
$mimeType = $image->mimeType();
$extension = $image->extension();

[$width, $height] = $image->dimensions();
$width = $image->width();
$height = $image->height();

$dominantColor = $image->dominantColor();
```

这些方法作用于处理后的图像。例如，在 `cover(400, 400)` 之后调用 `width` 将返回 `400`。

<a name="image-drivers"></a>
## 图像驱动

<a name="custom-image-drivers"></a>
### 自定义图像驱动

Laravel 的图像管理器继承自 Laravel 的基础 `Illuminate\Support\Manager` 类。这意味着你可以使用图像管理器和 `Image` Facade 上可用的 `extend` 方法注册自定义图像驱动。

自定义图像驱动应实现 `Illuminate\Contracts\Image\Driver` 接口。`process` 方法接收原始图像内容和应应用于图像的有序 `Illuminate\Image\ImagePipeline`，并应返回处理后的图像字节：

```php
<?php

namespace App\Images;

use Illuminate\Contracts\Image\Driver;
use Illuminate\Image\ImagePipeline;

class VipsDriver implements Driver
{
    /**
     * Process the given image contents with the specified pipeline.
     */
    public function process(string $contents, ImagePipeline $pipeline): string
    {
        // Apply the pipeline's transformations and output options...

        return $contents;
    }

    /**
     * Register a transformation handler.
     */
    public function transformUsing(string $transformation, callable $callback): static
    {
        // Store the handler so it may be applied while processing the pipeline...

        return $this;
    }
}
```

> [!NOTE]
> 为了更好地理解如何实现自定义图像驱动，你可以查看框架内置的 `Illuminate\Image\Drivers\InterventionDriver` 类。

实现自定义驱动后，你可以使用 `Image` Facade 的 `extend` 方法注册它。通常，这应在服务提供者的 `boot` 方法中完成：

```php
use App\Images\VipsDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Image;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Image::extend('vips', function (Application $app) {
        return new VipsDriver;
    });
}
```

注册驱动后，你可以使用 `using` 方法为特定图像使用它：

```php
$image = $request->image('avatar')
    ->using('vips')
    ->cover(400, 400);
```

你还可以使用应用 `config/images.php` 配置文件中的 `default` 选项或 `IMAGE_DRIVER` 环境变量，将自定义驱动配置为应用的默认图像驱动：

```ini
IMAGE_DRIVER=vips
```

<a name="custom-transformations"></a>
### 自定义变换

应用和包可以通过创建实现 `Illuminate\Contracts\Image\Transformation` 契约的类来定义自定义变换。然后可以使用 `transform` 方法将自定义变换添加到图像管线：

```php
<?php

namespace App\Images\Transformations;

use Illuminate\Contracts\Image\Transformation;

class Pixelate implements Transformation
{
    public function __construct(
        public readonly int $size,
    ) {
        //
    }
}
```

接下来，使用 `Image` Facade 的 `transformUsing` 方法为变换和驱动注册处理器。通常，这应在服务提供者的 `boot` 方法中完成：

```php
use App\Images\Transformations\Pixelate;
use Illuminate\Support\Facades\Image;
use Intervention\Image\Interfaces\ImageInterface;

Image::transformUsing('gd', Pixelate::class, function (ImageInterface $image, Pixelate $transformation) {
    return $image->pixelate($transformation->size);
});
```

注册变换处理器后，你可以将变换应用于图像：

```php
use App\Images\Transformations\Pixelate;

$image = $request->image('avatar')
    ->transform(new Pixelate(12))
    ->store('avatars');
```
