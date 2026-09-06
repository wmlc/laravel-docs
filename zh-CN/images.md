# 图像处理

## 简介

Laravel 提供了一套流畅的图像处理 API，让你可以使用与框架一贯相同的表达力约定来调整大小、裁剪、编码并存储图像。Laravel 的图像特性由 [Intervention Image](https://image.intervention.io/) 提供支持，并支持 GD 和 Imagick PHP 扩展。

图像 API 在处理上传文件、存储于 Laravel [文件系统磁盘](/topic/Laravel%2013.x/qk9428ovw1.html) 的文件、本地文件、远程 URL 或原始图像字节数据时都很有用：

```php
use Illuminate\Support\Facades\Image;

$path = Image::fromStorage('avatars/photo.jpg', 'public')
    ->cover(400, 400)
    ->toWebp()
    ->quality(80)
    ->storePublicly('avatars', 'public');
```

> [!WARNING]
> 图像处理会占用大量 CPU 与内存。建议把大批量的图像处理工作放到 [队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 中执行，而不是在接收上传的 HTTP 请求里同步处理。

## 安装

使用 Laravel 的图像处理特性前，请先通过 Composer 安装 Intervention Image 包：

```shell
composer require intervention/image:^4.0
```

同时应确保 PHP 安装中已启用 GD 或 Imagick 扩展（取决于应用使用的驱动）。

### 配置

Laravel 的图像配置文件位于 `config/images.php`。如果你的应用没有 `images` 配置文件，可以使用 `config:publish` Artisan 命令发布它：

```shell
php artisan config:publish images
```

通过该配置文件可以指定应用的默认图像驱动。也可以通过 `IMAGE_DRIVER` 环境变量来指定默认驱动。当前支持的驱动包括 `gd` 与 `imagick`：

```ini
IMAGE_DRIVER=imagick
```

## 读取图像

`Image` 门面提供了多种从常见来源读取图像的方法。图像内容采用懒加载，因此通常要等到图像被处理或请求其字节数据时才会真正读取。

### 上传的文件

可以通过 `image` 方法从传入的请求中获取上传的图像。该方法针对上传文件返回一个 `Illuminate\Image\Image` 实例；若文件不存在，则返回 `null`：

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

也可以通过 `fromUpload` 方法从一个 `Illuminate\Http\UploadedFile` 实例创建图像实例：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromUpload($request->file('avatar'));
```

当图像是从上传文件创建而来时，可以使用 `file` 方法获取底层的上传文件对象：

```php
$file = $image->file();
```

### 存储的文件

可以通过 `fromStorage` 方法从一个 [文件系统磁盘](/topic/Laravel%2013.x/qk9428ovw1.html) 上的文件创建图像实例。第一个参数是文件路径，第二个参数是磁盘名：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromStorage('avatars/photo.jpg', disk: 'public');
```

也可以直接通过文件系统磁盘实例的 `image` 方法创建图像实例：

```php
use Illuminate\Support\Facades\Storage;

$image = Storage::disk('public')->image('avatars/photo.jpg');
```

### 其他来源

`Image` 门面还提供了从原始字节、本地文件路径、远程 URL、Base64 编码字符串创建图像实例的方法：

```php
use Illuminate\Support\Facades\Image;

$image = Image::fromBytes($contents);
$image = Image::fromBase64($base64);
$image = Image::fromPath(storage_path('app/avatars/photo.jpg'));
$image = Image::fromUrl('https://example.com/photo.jpg');
```

## 操作图像

图像实例是不可变的。每次调用操作方法都会返回一个新的图像实例，并把转换逻辑追加到其处理管线中，从而支持流式链式调用：

```php
$image = $request->image('avatar')
    ->orient()
    ->cover(400, 400)
    ->sharpen(10);
```

转换操作按照它们加入图像管线的顺序依次执行，图像只在最后进行一次编码。

### 调整尺寸

`resize` 方法会把图像调整为给定尺寸。可以同时指定宽与高，也可以只通过具名参数指定其中一个维度：

```php
$image = $image->resize(800, 600);
$image = $image->resize(width: 800);
$image = $image->resize(height: 600);
```

`scale` 方法会按比例缩小图像，使其正好适配给定尺寸内。该方法不会放大图像：

```php
$image = $image->scale(800, 600);
$image = $image->scale(width: 800);
$image = $image->scale(height: 600);
```

`cover` 方法会调整并裁剪图像，使其完整覆盖给定尺寸：

```php
$image = $image->cover(400, 400);
```

`contain` 方法会把图像调整为在给定尺寸范围内完整保留全部内容。如有必要，可用可选的背景色填充空白：

```php
$image = $image->contain(400, 400);
$image = $image->contain(400, 400, '#ffffff');
$image = $image->contain(400, 400, 'dominant');
```

可以将背景色指定为 `dominant`，使用图像的主色填充空白。

可以通过 `crop` 方法裁剪图像。前两个参数是期望的宽度和高度，可选的第三、第四个参数分别指定裁剪的 `x`、`y` 坐标：

```php
$image = $image->crop(300, 200);
$image = $image->crop(300, 200, x: 50, y: 25);
```

### 其他转换

Laravel 还提供了多种额外的图像转换方法：

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

`orient` 方法会根据图像的 EXIF 方向信息旋转图像。`rotate` 方法按指定角度顺时针旋转图像，并可接受一个可选的背景色。`blur` 与 `sharpen` 方法接受 `0` 到 `100` 之间的数值。

#### 条件性转换

图像实例支持 Laravel 的 `Conditionable` trait，从而可以使用 `when` 与 `unless` 方法按条件应用转换：

```php
$image = $request->image('avatar')
    ->when($request->boolean('crop'), fn ($image) => $image->cover(400, 400))
    ->unless($request->boolean('preserve_format'), fn ($image) => $image->toWebp());
```

## 编码图像

默认情况下，处理后的图像会按其原始格式进行编码。不过，你可以在读取或存储前把图像转换为另一种受支持的格式：

```php
$image = $image->toWebp();
$image = $image->toJpg();
$image = $image->toJpeg();
$image = $image->toPng();
$image = $image->toGif();
$image = $image->toAvif();
$image = $image->toBmp();
```

可以使用 `quality` 方法设置输出质量。质量会被限制在 `1` 到 `100` 之间：

```php
$image = $image->toWebp()->quality(80);
```

`optimize` 方法是一个便捷的快捷方式：把图像转换为指定格式并设置其质量。默认情况下，图像会以质量为 `70` 的 WebP 进行优化：

```php
$image = $image->optimize();

$image = $image->optimize(format: 'jpg', quality: 85);
```

你可以通过字节字符串、Base64 编码字符串或 data URI 获取已处理的图像内容：

```php
$bytes = $image->toBytes();
$base64 = $image->toBase64();
$dataUri = $image->toDataUri();
```

图像实例也可以被强制转换为字符串，以获取对应的 data URI：

```php
$dataUri = (string) $image;
```

## 存储图像

`store` 方法会把处理后的图像存储到应用的某个文件系统磁盘上。与上传文件一样，Laravel 会生成一个唯一的文件名并返回存储路径。第二个参数可用于指定磁盘：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->store(path: 'avatars');

$path = $request->image('avatar')
    ->cover(400, 400)
    ->store(path: 'avatars', disk: 's3');
```

可以使用 `storeAs` 方法指定存储时的文件名：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->storeAs(path: 'avatars', name: 'avatar.jpg', disk: 'public');
```

`storePublicly` 与 `storePubliclyAs` 方法会以 `public` 可见性存储图像：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->storePublicly(path: 'avatars', disk: 'public');

$path = $request->image('avatar')
    ->cover(400, 400)
    ->storePubliclyAs(path: 'avatars', name: 'avatar.webp', disk: 'public');
```

如果图像无法被存储，存储方法会返回 `false`。

## 检查图像

可以使用以下方法读取图像的 MIME 类型、扩展名、尺寸、宽、高以及主色：

```php
$mimeType = $image->mimeType();
$extension = $image->extension();

[$width, $height] = $image->dimensions();
$width = $image->width();
$height = $image->height();

$dominantColor = $image->dominantColor();
```

这些方法作用于已处理的图像。例如，在 `cover(400, 400)` 之后再调用 `width`，会返回 `400`。

## 图像驱动

### 自定义图像驱动

Laravel 的图像管理器继承自 Laravel 的基础 `Illuminate\Support\Manager` 类。因此，可以使用图像管理器与 `Image` 门面上提供的 `extend` 方法注册自定义图像驱动。

自定义图像驱动应实现 `Illuminate\Contracts\Image\Driver` 接口。`process` 方法接收原始图像字节内容和有序的 `Illuminate\Image\ImagePipeline`，并应返回处理后的图像字节：

```php
<?php

namespace App\Images;

use Illuminate\Contracts\Image\Driver;
use Illuminate\Image\ImagePipeline;

class VipsDriver implements Driver
{
    /**
     * 使用指定的管线处理给定的图像内容。
     */
    public function process(string $contents, ImagePipeline $pipeline): string
    {
        // 应用管线的转换与输出选项……

        return $contents;
    }

    /**
     * 注册一个转换处理器。
     */
    public function transformUsing(string $transformation, callable $callback): static
    {
        // 存储处理器，以便在管线处理过程中应用……

        return $this;
    }
}
```

> [!NOTE]
> 若想更好地理解如何实现自定义图像驱动，可以参考框架内置的 `Illuminate\Image\Drivers\InterventionDriver` 类。

自定义驱动实现完成后，可以通过 `Image` 门面的 `extend` 方法注册。通常应该在服务提供者的 `boot` 方法中完成这一步：

```php
use App\Images\VipsDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Image;

/**
 * 引导应用服务。
 */
public function boot(): void
{
    Image::extend('vips', function (Application $app) {
        return new VipsDriver;
    });
}
```

驱动注册完毕后，可以通过 `using` 方法将某张图像切换为指定的驱动：

```php
$image = $request->image('avatar')
    ->using('vips')
    ->cover(400, 400);
```

也可以在应用的 `config/images.php` 配置文件中使用 `default` 选项，或通过 `IMAGE_DRIVER` 环境变量，把自定义驱动配置为默认图像驱动：

```ini
IMAGE_DRIVER=vips
```

### 自定义转换

应用和扩展包可以通过实现 `Illuminate\Contracts\Image\Transformation` 契约的类来定义自定义转换。之后可以通过 `transform` 方法把自定义转换添加到图像管线：

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

接着，使用 `Image` 门面的 `transformUsing` 方法为该转换与某个驱动注册一个处理器。通常这一步应该在服务提供者的 `boot` 方法中完成：

```php
use App\Images\Transformations\Pixelate;
use Illuminate\Support\Facades\Image;
use Intervention\Image\Interfaces\ImageInterface;

Image::transformUsing('gd', Pixelate::class, function (ImageInterface $image, Pixelate $transformation) {
    return $image->pixelate($transformation->size);
});
```

转换处理器注册完毕后，就可以对图像应用该转换了：

```php
use App\Images\Transformations\Pixelate;

$image = $request->image('avatar')
    ->transform(new Pixelate(12))
    ->store('avatars');
```
