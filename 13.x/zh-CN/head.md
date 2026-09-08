# Laravel Head

- [简介](#introduction)
- [安装](#installation)
- [快速入门](#quickstart)
- [解析优先级](#resolution-precedence)
- [定义元数据](#defining-metadata)
    - [默认值](#defaults)
    - [路由元数据](#route-metadata)
    - [运行时元数据](#runtime-metadata)
    - [错误页面](#error-pages)
- [Open Graph](#open-graph)
    - [X / Twitter 卡片](#twitter-cards)
- [主题颜色](#theme-colors)
- [应用元数据与图标](#app-metadata-and-icons)
- [渐进式 Web 应用](#progressive-web-apps)
- [性能与发现](#performance-and-discovery)
- [自定义标签](#custom-tags)
- [结构化数据（Schema）](#schemas)
    - [面包屑](#breadcrumbs)
    - [常见问题](#faqs)
    - [自定义 Schema](#custom-schemas)
- [渲染](#rendering)
    - [Blade](#blade)
    - [Livewire](#livewire)
    - [Inertia](#inertia)

<a name="introduction"></a>
## 简介

[Laravel Head](https://github.com/laravel/head) 提供了一个流式（fluent）API 来管理应用的文档 `<head>` 元素，包括标题和 meta 标签、Open Graph 元数据、规范（canonical）URL、robots 指令、性能提示以及结构化数据。它可与 Blade、Livewire 和 Inertia 配合使用。

<a name="installation"></a>
## 安装

你可以使用 Composer 包管理器安装 Laravel Head：

```shell
composer require laravel/head
```

<a name="quickstart"></a>
## 快速入门

在一个服务提供者中注册全站默认值：

```php
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::defaults(fn (HeadBuilder $head) => $head
    ->title('Laravel', suffix: ' - Laravel')
    ->description('Build something great.'));
```

在运行时设置页面专属元数据：

```php
Head::title($post->title)
    ->description($post->description);
```

在你的布局中渲染解析出的标签：

```blade
<head>
    @head
</head>
```

<a name="resolution-precedence"></a>
## 解析优先级

页面元数据从五个层级解析，优先级由低到高排列如下：

1. 页面默认值
2. 路由组元数据
3. 路由元数据
4. 运行时元数据
5. 错误元数据

较高的层级会逐字段覆盖较低的层级。例如，运行时标题会替换路由标题，而不会替换路由描述。接下来的各节将介绍如何在每个层级设置元数据。关于在 Blade、Livewire 和 Inertia 中渲染解析出的元数据，请参阅 [渲染](#rendering)。

<a name="defining-metadata"></a>
## 定义元数据

Laravel Head 允许你使用全站默认值、路由元数据、运行时调用以及错误页面定义来设置元数据。

<a name="defaults"></a>
### 默认值

在一个服务提供者中注册页面默认值：

```php
use Laravel\Head\Enums\OgType;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::defaults(function (HeadBuilder $head) {
    $head
        ->title('Laravel', suffix: ' - Laravel')
        ->description('Build something great.')
        ->canonical()
        ->og(siteName: 'Laravel', type: OgType::Website)
        ->searchableByRobots()
        ->preconnect('https://fonts.example.com');
});
```

默认值是优先级最低的页面元数据层级。如果没有路由、运行时或错误元数据设置标题，则会原样渲染 `Laravel`。当较高级层设置了页面标题时，会应用继承来的后缀，因此 `Head::title('About')` 会渲染为 `About - Laravel`。对于应忽略继承前缀或后缀的标题，可传入 `exact: true`。

调用 `Head::canonical()` 会使用当前请求 URL 渲染一个规范（canonical）URL。要设置显式的 URL，可传入一个字符串，如 `Head::canonical('/about')`。规范 URL 默认会被规范化为 `https`；传入 `forceHttps: false` 可保留请求协议。

robots 指令可以作为原始字符串、`RobotsRule` 枚举用例，或混合两者的列表传入。列表会被渲染为逗号分隔的指令，因此 `Head::robots([RobotsRule::NoIndex, RobotsRule::NoFollow])` 会渲染为 `noindex, nofollow`。

为方便起见，`searchableByRobots` 方法会渲染 `all`，而 `hiddenFromRobots` 方法会渲染 `none`。

<a name="route-metadata"></a>
### 路由元数据

你可以直接在路由上定义元数据，这对于元数据在事先已知的半静态页面尤为有用。

<a name="routes-and-groups"></a>
#### 路由与组

```php
Route::view('/contact', 'contact')
    ->name('contact')
    ->withHead(
        title: 'Contact Us',
        description: 'Get in touch.',
    );
```

共享的路由元数据可以应用到链中任意位置的组：

```php
Route::withHead(robots: 'noindex, nofollow')
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)
            ->name('dashboard')
            ->withHead(title: 'Dashboard');
    });
```

你还可以为资源路由和单例路由定义元数据：

```php
Route::resource('posts', PostController::class)->withHead(
    robots: 'index, follow',
);

Route::singleton('profile', ProfileController::class)->withHead(
    title: 'Your Profile',
);
```

`withHead` 方法通过 Laravel 原生的路由元数据 API 存储普通数组。它等价于在 `head` 键下嵌套属性调用 `metadata` 方法，因此该元数据与缓存路由保持兼容。

具名参数被有意限制为 Laravel Head 内置的路由属性，以便编辑器和静态分析能够捕获拼写错误的名称。由自定义标签构建器注册的路由属性可以通过 `extensions` 传入：

```php
Route::get('/article', ArticleController::class)->withHead(
    title: 'Article',
    extensions: ['readingTime' => 4],
);
```

<a name="supported-properties"></a>
#### 受支持的属性

受支持的路由属性映射到与流式构建器方法相同的名称：

| 类别 | 属性 |
| --- | --- |
| 文档 | `title`、`description`、`canonical`、`robots` |
| 应用元数据 | `themeColor`、`applicationName`、`colorScheme`、`referrer`、`viewport`、`appleWebAppTitle`、`webAppCapable`、`appleWebAppStatusBarStyle` |
| 社交 | `og`、`ogImage`、`ogVideo`、`ogAudio`、`twitter`、`twitterImage` |
| 性能 | `preload`、`prefetch`、`preconnect`、`dnsPrefetch` |
| 发现 | `alternates`、`feed`、`icon`、`favicon`、`appleTouchIcon`、`appleTouchStartupImage`、`maskIcon`、`manifest` |
| 结构化数据 | `schema` |
| 自定义标签 | `meta`、`link` |

嵌套选项名使用与流式 API 相同的 `camelCase` 命名约定，例如 `forceHttps`、`siteName` 和 `secureUrl`。

可重复的属性，例如 `ogImage`、`preload`、`feed`、`schema`、`icon` 和 `appleTouchStartupImage`，可以接受单个值或列表。

<a name="runtime-metadata"></a>
### 运行时元数据

当某个值在请求到达之前尚不可知时（例如正在查看的文章的标题），你可以在运行时设置它：

```php
use Laravel\Head\Facades\Head;

public function __invoke(Post $post): Response
{
    Head::title($post->title);

    // ...
}
```

通过 `Head` facade 发起的运行时调用会覆盖路由中请求相关的数据元数据。控制器和 action 是发起这些调用最常见的地方：

```php
use App\Models\Post;
use Laravel\Head\Facades\Head;

public function show(Post $post)
{
    Head::title($post->title)
        ->description($post->description);

    return view('posts.show', ['post' => $post]);
}
```

多次运行时调用会按执行顺序合并。对于 `title`、`description`、规范 URL 和 robots 指令等单值字段，后一次调用优先。可重复字段会保留多个条目，但再次添加相同的键会更新较早的条目。对于 `ogImage` 方法，URL 即作为键：

```php
Head::ogImage('/images/cover.jpg', alt: 'Draft cover')
    ->ogImage('/images/gallery.jpg', alt: 'Gallery image')
    ->ogImage('/images/cover.jpg', alt: 'Final cover', width: 1200, height: 630);
```

```html
<meta property="og:image" content="/images/cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Final cover">
<meta property="og:image" content="/images/gallery.jpg">
<meta property="og:image:alt" content="Gallery image">
```

从默认值继承而来的 Open Graph 媒体会作为回退。当路由、运行时或错误元数据定义了自身同类型的媒体时，默认媒体会被替换而非合并，因此页面的 `og:image` 优先于全站默认图片。

你可以使用 `when` 和 `unless` 方法流畅地定义条件元数据：

```php
Head::title($post->title)
    ->when($post->isDraft(), fn ($head) => $head->hiddenFromRobots());
```

<a name="error-pages"></a>
### 错误页面

通常，你应该在应用 `AppServiceProvider` 类的 `boot` 方法中注册错误元数据：

```php
use Laravel\Head\ErrorPages;
use Laravel\Head\Facades\Head;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Head::errors(function (ErrorPages $errors) {
        $errors->defaults(robots: 'noindex, follow');

        $errors->status(
            404,
            title: 'Page Not Found',
            description: 'The page you are looking for could not be found.',
        );
    });
}
```

`defaults` 和 `status` 方法也接受与 `Head::defaults()` 相同的流式构建器回调：

```php
use Laravel\Head\ErrorPages;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::errors(function (ErrorPages $errors) {
    $errors->status(404, fn (HeadBuilder $head) => $head
        ->title('Page Not Found')
        ->description('The page you are looking for could not be found.'));
});
```

当为已注册的错误状态渲染响应时，该元数据优先于所有其他层级。

Laravel 在渲染错误视图或执行响应阶段的钩子（如 Inertia 的 `handleExceptionsUsing()` 方法）时会自动检测响应状态。如果你在 `$exceptions->render()` 回调内部渲染错误响应，应在渲染之前调用 `Head::status(404)`，以便应用错误元数据。

<a name="open-graph"></a>
## Open Graph

你可以使用 `og` 方法设置 Open Graph 属性。可重复的媒体可以使用顶层方法添加，这些方法直接接受具名参数：

```php
use Laravel\Head\Enums\ImageType;
use Laravel\Head\Enums\OgType;

Head::og(type: OgType::Article, title: $post->title)
    ->ogImage($post->hero_image_url)
    ->ogImage(
        $post->gallery_image_url,
        alt: $post->gallery_image_alt,
        width: 1200,
        height: 630,
        type: ImageType::Jpeg,
    );
```

`ogImage`、`ogVideo` 和 `ogAudio` 方法将 URL 作为第一个参数，并附带可选的具名参数，如 `alt`、`width`、`height`、`type` 和 `secureUrl`（在 Open Graph 规范支持的情况下）。

你可以在 API 接受图片 `type` 的任何位置传入图片 MIME 类型作为 `ImageType` 枚举用例，例如 `ImageType::Svg`、`ImageType::Png`、`ImageType::Jpeg` 和 `ImageType::Webp`。

> [!NOTE]
> 文档的 `title` 和 `description` 会自动填充缺失的 `og:title` 和 `og:description` 值。

对于没有其它属性的单个 Open Graph 图片，你可以向 `og` 方法传入 `image` 具名参数：

```php
Head::og(
    type: OgType::Website,
    title: $page->title,
    description: $page->description,
    image: $page->og_image_url,
);
```

`og(image: ...)` 和 `ogImage(...)` 调用写入同一个底层图片列表，因此你可以在调用处使用更具表现力的那种。`og` 方法用于自定义 Open Graph 扩展（如商品或文章属性）时，可以使用 [`meta`](#custom-tags) 方法。

<a name="twitter-cards"></a>
### X / Twitter 卡片

要从 Open Graph 使用的相同标题、描述和图片渲染 X / Twitter 卡片，可以在默认值中注册 `twitter()`：

```php
use Laravel\Head\Enums\TwitterCard;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::defaults(fn (HeadBuilder $head) => $head->twitter(
    card: TwitterCard::SummaryWithLargeImage,
));
```

然后设置页面级元数据：

```php
Head::title('Introducing Laravel Head')
    ->description('A fluent API for Laravel document head metadata.')
    ->ogImage('https://example.com/social.jpg', alt: 'Introducing Laravel Head');
```

这会渲染匹配的 Twitter 标签：

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Introducing Laravel Head">
<meta name="twitter:description" content="A fluent API for Laravel document head metadata.">
<meta name="twitter:image" content="https://example.com/social.jpg">
<meta name="twitter:image:alt" content="Introducing Laravel Head">
```

你可以使用显式的 Twitter 值来自定义单个页面：

```php
Head::twitter(title: $post->social_title)
    ->twitterImage($post->social_image_url, alt: $post->title);
```

路由元数据接受 `twitter` 和 `twitterImage`。

<a name="theme-colors"></a>
## 主题颜色

你可以在全局、按路由或在运行时设置主题颜色：

```php
Head::themeColor('#0f172a');
```

这会渲染一个 `<meta name="theme-color">` 标签。对于特定媒体的主题颜色，你可以使用 `Media` 枚举：

```php
use Laravel\Head\Enums\Media;

Head::themeColor('#ffffff', media: Media::Light)
    ->themeColor('#111827', media: Media::Dark);
```

`Media` 枚举还包含 `Portrait` 和 `Landscape`。`media` 参数也接受自定义的媒体查询字符串。

路由元数据通过相同的 `camelCase` 键支持单个主题颜色：

```php
Route::view('/dashboard', 'dashboard')->withHead(
    themeColor: '#0f172a',
);
```

<a name="app-metadata-and-icons"></a>
## 应用元数据与图标

Laravel Head 包含用于常见浏览器和应用元数据的方法：

```php
use Laravel\Head\Enums\ImageType;
use Laravel\Head\Enums\Media;

Head::applicationName('Laravel')
    ->colorScheme('light dark')
    ->referrer('strict-origin-when-cross-origin')
    ->viewport('width=device-width, initial-scale=1')
    ->appleWebAppTitle('Laravel')
    ->webAppCapable()
    ->appleWebAppStatusBarStyle('black')
    ->favicon('/favicon.svg', type: ImageType::Svg)
    ->icon('/favicon-32x32.png', type: ImageType::Png, sizes: '32x32')
    ->appleTouchIcon('/apple-touch-icon.png', sizes: '180x180')
    ->appleTouchStartupImage('/launch.png', media: Media::Portrait)
    ->maskIcon('/safari-pinned-tab.svg', color: '#111827')
    ->manifest('/site.webmanifest');
```

`favicon` 方法是 `icon` 方法的别名，接受相同的 `type`、`sizes` 和 `media` 参数。

路由元数据使用相同的名称：

```php
use Laravel\Head\Enums\ImageType;
use Laravel\Head\Enums\Media;

Route::view('/dashboard', 'dashboard')->withHead(
    applicationName: 'Laravel',
    colorScheme: 'light dark',
    appleWebAppTitle: 'Laravel',
    webAppCapable: true,
    appleWebAppStatusBarStyle: 'black',
    favicon: [
        ['href' => '/favicon.svg', 'type' => ImageType::Svg],
        ['href' => '/favicon-32x32.png', 'type' => ImageType::Png, 'sizes' => '32x32'],
    ],
    appleTouchIcon: ['href' => '/apple-touch-icon.png', 'sizes' => '180x180'],
    appleTouchStartupImage: ['href' => '/launch.png', 'media' => Media::Portrait],
    manifest: '/site.webmanifest',
);
```

<a name="progressive-web-apps"></a>
## 渐进式 Web 应用

`pwa` 方法配置可安装 Web 应用所需的常见文档 `<head>` 标签：

```php
Head::pwa(
    name: 'Laravel',
    manifest: '/site.webmanifest',
    themeColor: '#0f172a',
    appleTouchIcon: '/apple-touch-icon.png',
    appleWebAppStatusBarStyle: 'black',
);
```

这会渲染应用名称、Web 应用清单（manifest）链接以及 iOS 独立（standalone）元数据。如果提供，还会渲染主题颜色、Apple 状态栏样式和 Apple 触摸图标。创建 Web 应用清单和注册 service worker 仍由你的应用负责。

你可以在默认值或运行时元数据中使用 `pwa` 方法。路由元数据支持上述各个独立的属性。

<a name="performance-and-discovery"></a>
## 性能与发现

Laravel Head 会渲染性能提示、分页链接、语言版本替代（alternates）以及 feed 发现：

```php
Head::preload(asset('fonts/inter.woff2'), as: 'font', crossorigin: true)
    ->prefetch(asset('images/next.webp'))
    ->preconnect('https://cdn.example.com')
    ->dnsPrefetch('https://analytics.example.com')
    ->paginate($posts)
    ->alternates([
        'en' => 'https://example.com/en/about',
        'fr' => 'https://example.com/fr/about',
        'x-default' => 'https://example.com/about',
    ])
    ->feed('/feed', title: 'Laravel RSS')
    ->feed('/feed.atom', type: 'atom', title: 'Laravel Atom');
```

对于本地资源，`preloadAsset()` 和 `prefetchAsset()` 会通过 `asset()` 辅助函数解析 URL，并从文件扩展名检测 `as` 属性。字体预加载会自动包含 `crossorigin`，即使对于同源字体，预加载规范也要求包含它：

```php
Head::preloadAsset('fonts/inter.woff2')
    ->prefetchAsset('images/next.webp');
```

```html
<link rel="preload" href="https://example.com/fonts/inter.woff2" as="font" crossorigin>
<link rel="prefetch" href="https://example.com/images/next.webp" as="image">
```

你可以显式传入 `as` 来覆盖自动检测。当无法从扩展名检测出 `as` 属性时，`preloadAsset` 方法会抛出异常，因为浏览器会忽略缺少该属性的预加载；而 `prefetchAsset` 方法只会省略它。

<a name="custom-tags"></a>
## 自定义标签

对于没有专用方法的标签，使用 `meta()` 和 `link()`：

```php
Head::meta('format-detection', 'telephone=no')
    ->meta('article:author', $post->author->name)
    ->link('search', '/opensearch.xml', [
        'type' => 'application/opensearchdescription+xml',
        'title' => 'Laravel Search',
    ])
    ->link('me', 'https://social.example.com/@laravel');
```

当浏览器应仅在匹配条件下应用某个 meta 标签时，你可以在该 meta 标签上包含媒体查询：

```php
use Laravel\Head\Enums\Media;

Head::meta('theme-color', '#ffffff', media: Media::Light)
    ->meta('theme-color', '#111827', media: Media::Dark);
```

`meta` 方法对常规 meta 标签使用 `name` 属性。对于通常使用 `property` 属性的键（例如 Open Graph（`og:`）或文章元数据（`article:`）），该方法会自动切换：

```php
Head::meta('description', 'About Laravel')
    ->meta('og:title', 'About Laravel');
```

```html
<meta name="description" content="About Laravel">
<meta property="og:title" content="About Laravel">
```

你可以传入 `property: true` 或 `property: false` 来显式选择其中一个属性。

<a name="schemas"></a>
## 结构化数据（Schema）

内置的 schema 构建器覆盖了常见的 JSON-LD 类型：

```php
use Laravel\Head\Enums\OfferAvailability;
use Laravel\Head\Facades\Schema;

Head::schema(
    Schema::product()
        ->name($product->name)
        ->offers(
            Schema::offer()
                ->price($product->price)
                ->currency('USD')
                ->availability(OfferAvailability::InStock)
        )
);
```

内置的工厂方法有 `article`、`blogPosting`、`product`、`offer`、`brand`、`breadcrumbs`、`faq`、`organization`、`person`、`webPage` 和 `webSite`。未知的工厂方法会创建一个通用的 schema 对象，因此你仍然可以表达自定义的 schema.org 类型。

当 JSON-LD schema 数据无效时，Laravel Head 在非生产环境中会抛出异常，并在生产环境中记录一条警告。

<a name="breadcrumbs"></a>
### 面包屑

面包屑项可以逐个添加，也可以批量添加。位置会按照项的添加顺序自动分配：

```php
Head::schema(
    Schema::breadcrumbs()->items([
        'Home' => route('home'),
        'Shop' => route('shop.index'),
        'Shoes' => route('shop.category', 'shoes'),
    ])
);
```

你可以使用 `item` 方法追加单个面包屑项：

```php
Schema::breadcrumbs()
    ->item('Home', route('home'))
    ->item('Shop', route('shop.index'));
```

<a name="faqs"></a>
### 常见问题（FAQ）

FAQ 条目遵循相同的模式。你可以使用 `question` 方法逐个添加，或使用 `questions` 方法批量添加：

```php
Head::schema(
    Schema::faq()->questions([
        'What is Laravel Head?' => 'A fluent API for managing the document head.',
        'Is it free?' => 'Yes, it is open source.',
    ])
);
```

<a name="custom-schemas"></a>
### 自定义 Schema

你可以显式注册自定义的 schema 类型：

```php
use DateTimeInterface;
use Laravel\Head\Facades\Schema;
use Laravel\Head\Schema\SchemaObject;
use Laravel\Head\SchemaType;

#[SchemaType('JobPosting')]
class JobPosting extends SchemaObject
{
    public function title(string $title): static
    {
        return $this->set('title', $title);
    }

    public function datePosted(DateTimeInterface|string $date): static
    {
        return $this->date('datePosted', $date);
    }
}

Schema::register(JobPosting::class);

Head::schema(
    Schema::jobPosting()
        ->title('Senior Laravel Developer')
        ->datePosted(now())
);
```

<a name="rendering"></a>
## 渲染

Laravel Head 会将页面元数据解析为针对当前响应的标签。这些标签如何渲染取决于你的应用技术栈。

HTML 渲染器驱动 `@head` 指令，以及 Laravel Head 通过 `head` prop 与 Inertia 共享的已渲染元素。数组渲染器驱动 `Head::toArray()`，适用于需要将解析出的元数据作为结构化数据的应用。

<a name="blade"></a>
### Blade

使用 `@head` 指令在你的布局 `<head>` 中渲染累积的标签：

```blade
<head>
    <meta charset="utf-8">
    @head
</head>
```

`@head` 指令是同步渲染的，因此你应该在布局渲染之前定义页面元数据。

<a name="livewire"></a>
### Livewire

Livewire 应用在其文档布局中使用相同的 `@head` 指令：

```blade
<head>
    @head
</head>

<body>
    {{ $slot }}

    @livewireScripts
</body>
```

无需 Livewire 专属的配置。Laravel Head 元数据按请求解析，且解析器是请求作用域的。因此，每次 `wire:navigate` 访问都会获取一个全新的文档，其 `@head` 输出反映了目标路由的元数据。使用 `wire:navigate` 访问的页面会收到相应的路由、运行时和错误元数据，而无需在组件层面编写 head 代码。

<a name="inertia"></a>
### Inertia

在你的 Inertia 根模板中使用相同的 `@head` 指令，与 Inertia 自身的组件一起：

```blade
<html>
<head>
    <meta charset="utf-8">
    @head

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    <x-inertia::head />
</head>
<body>
    <x-inertia::app />
</body>
</html>
```

安装 Inertia 后，Laravel Head 会自动在每个页面对象上以渲染出的元素字符串数组的形式，在 `head` prop 下共享页面管理的 head：

```json
{
    "props": {
        "head": [
            "<title data-inertia=\"title\">Dashboard - Laravel</title>",
            "<meta data-inertia=\"description\" name=\"description\" content=\"Your application overview.\">"
        ]
    }
}
```

在你应用调用 `createInertiaApp()` 的地方启用 Inertia 的 `serverHead` 选项。该选项在 Inertia 3.5 及更高版本中可用：

```js
createInertiaApp({
    // ...
    serverHead: true,
});
```

每个页面管理的元素都有一个稳定的 `data-inertia` 键。`@head` 指令渲染初始文档，此后 Inertia 接管这些元素，并在标准访问、[即时访问（instant visits）](https://inertiajs.com/docs/v3/the-basics/instant-visits) 以及前进后退导航中保持同步。这些元素存在于初始 HTML 响应中，因此爬虫和链接预览机器人无需执行 JavaScript 即可读取它们。不需要客户端 `<Head>` 组件。

无论是否使用[服务端渲染（SSR）](https://inertiajs.com/docs/v3/advanced/server-side-rendering)，这都能工作。如果你的应用有独立的 SSR 入口点，也在那里启用 `serverHead`。Laravel Head 会自动对 `@head` 与 `<x-inertia::head />` 之间的页面管理元素去重，无论顺序如何，同时保留由 JavaScript SSR 产生的其它 head 元素。

> [!NOTE]
> 当向已有的 Inertia 应用添加 Laravel Head 时，从 `resources/js/app.tsx` 和 `resources/js/ssr.tsx` 中移除任何标题回调，以便 Laravel Head 能够管理最终的文档标题，并将由 Inertia 的 [`<Head>` 组件](https://inertiajs.com/docs/v3/the-basics/title-and-meta) 管理的标签迁移到 Laravel Head，使两者永远不会定义同一个元素。

`head` prop 在局部重载响应中会被省略，因此 Inertia 会保留上一个完整页面的 head。即时访问同样会保留当前 head，直到后台响应到达。如果你的应用已经使用了 `head` prop，可以在服务提供者中更改它的名称：

```php
use Laravel\Head\Facades\Head;

public function boot(): void
{
    Head::inertia(prop: '_head');
}
```

然后将 Inertia 指向同一个 prop，使用 `serverHead: '_head'`。

<a name="static-inertia-tags"></a>
#### 静态 Inertia 标签

大多数标签应该放在默认值、路由元数据或运行时元数据中，以便 Laravel Head 能为每个页面解析出正确的值。仅在首次 HTML 响应中渲染、且在会话其余时间由 Inertia 保持不变的文档标签，才使用 Inertia 全局标签。

在一个服务提供者中使用 `Head::inertiaGlobals()` 注册它们：

```php
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::inertiaGlobals(function (HeadBuilder $head) {
    $head
        ->viewport('width=device-width, initial-scale=1')
        ->colorScheme('light dark')
        ->icon('/favicon.svg', type: 'image/svg+xml')
        ->appleTouchIcon('/apple-touch-icon.png', sizes: '180x180')
        ->manifest('/site.webmanifest');
});
```

Inertia 全局标签从 `head` prop 中排除，渲染时不带 `data-inertia` 所有权属性，并且在首次响应之后永远不会更新。这些全局标签适用于稳定的浏览器提示，例如视口、配色方案、favicon、触摸图标和清单（manifest）。如果某个标签是页面专属的、与 SEO 相关的，或可能在之后被覆盖，则应将其放在默认值、路由元数据或运行时元数据中。

需要将解析出的元数据作为结构化数据而非渲染标签的应用，可以调用 `Head::toArray()`。返回的数据包含标题、Open Graph 值、JSON-LD schema 以及其它解析出的元数据。
