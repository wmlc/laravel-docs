# Laravel Head

## 简介

[Laravel Head](https://github.com/laravel/head) 提供了一套流畅的 API，用来管理应用文档的 `<head>` 元素——包括标题与 meta 标签、Open Graph 元数据、canonical URL、robots 指令、性能提示与结构化数据。它与 Blade、Livewire 和 Inertia 都能良好协作。

## 安装

可以通过 Composer 包管理器安装 Laravel Head：

```shell
composer require laravel/head
```

## 快速上手

在服务提供者中注册全站默认值：

```php
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

Head::defaults(fn (HeadBuilder $head) => $head
    ->title('Laravel', suffix: ' - Laravel')
    ->description('Build something great.'));
```

在运行时设置页面级元数据：

```php
Head::title($post->title)
    ->description($post->description);
```

在布局里渲染解析好的标签：

```blade
<head>
    @head
</head>
```

## 优先级

页面元数据按从低到高的五个层级进行解析：

1. 页面默认值（Page defaults）
2. 路由组元数据（Route group metadata）
3. 路由元数据（Route metadata）
4. 运行时元数据（Runtime metadata）
5. 错误元数据（Error metadata）

更高层级会按字段逐项覆盖更低层级。例如，运行时标题会替换路由标题，但不会替换路由描述。下面将分别介绍如何在每一层设置元数据。关于在 Blade、Livewire 和 Inertia 中如何渲染解析后的元数据，请参阅渲染。

## 定义元数据

Laravel Head 允许你通过全站默认值、路由元数据、运行时调用和错误页定义等方式来定义元数据。

### 默认值

在服务提供者中注册页面默认值：

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

默认值是优先级最低的页面元数据层。若没有路由、运行时或错误元数据显式设置标题，则会原样渲染 `Laravel`。当更高层级设置了页面标题时，会应用继承的后缀，因此 `Head::title('About')` 会渲染为 `About - Laravel`。若希望标题忽略继承的前缀或后缀，可传入 `exact: true`。

调用 `Head::canonical()` 会使用当前请求 URL 渲染一个 canonical 链接。若要显式指定 URL，可传入字符串，例如 `Head::canonical('/about')`。Canonical URL 默认会被规范化为 `https`，若想保留请求原协议，可传入 `forceHttps: false`。

Robots 指令可传入原始字符串、`RobotsRule` 枚举值，或混合两者的列表。列表会渲染为逗号分隔的指令，因此 `Head::robots([RobotsRule::NoIndex, RobotsRule::NoFollow])` 会渲染为 `noindex, nofollow`。

为方便起见，`searchableByRobots` 方法渲染 `all`，`hiddenFromRobots` 方法渲染 `none`。

### 路由元数据

你可以直接在路由上定义元数据，对于那些元数据可提前预知的半静态页面尤其有用。

#### 路由与路由组

```php
Route::view('/contact', 'contact')
    ->name('contact')
    ->withHead(
        title: 'Contact Us',
        description: 'Get in touch.',
    );
```

共享的路由元数据可以在路由链的任意位置应用到路由组：

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

也可以为资源路由和单例路由定义元数据：

```php
Route::resource('posts', PostController::class)->withHead(
    robots: 'index, follow',
);

Route::singleton('profile', ProfileController::class)->withHead(
    title: 'Your Profile',
);
```

`withHead` 方法通过 Laravel 原生的路由元数据 API 存储纯数组。它等效于以 `head` 为 key 把属性嵌套传入 `metadata` 方法，因此元数据可以与缓存路由兼容。

`withHead` 的具名参数有意仅允许 Laravel Head 内置的路由属性，以便编辑器与静态分析可以发现拼写错误。 由自定义标签构造器注册的路由属性可以通过 `extensions` 透传：

```php
Route::get('/article', ArticleController::class)->withHead(
    title: 'Article',
    extensions: ['readingTime' => 4],
);
```

#### 支持的属性

支持的路由属性与对应的流式构造器方法同名：

| 分类 | 属性 |
| --- | --- |
| Document | `title`, `description`, `canonical`, `robots` |
| Application metadata | `themeColor`, `applicationName`, `colorScheme`, `referrer`, `viewport`, `appleWebAppTitle`, `webAppCapable`, `appleWebAppStatusBarStyle` |
| Social | `og`, `ogImage`, `ogVideo`, `ogAudio`, `twitter`, `twitterImage` |
| Performance | `preload`, `prefetch`, `preconnect`, `dnsPrefetch` |
| Discovery | `alternates`, `feed`, `icon`, `favicon`, `appleTouchIcon`, `appleTouchStartupImage`, `maskIcon`, `manifest` |
| Structured data | `schema` |
| Custom tags | `meta`, `link` |

嵌套选项名沿用 `camelCase` 命名，与流式 API 一致——例如 `forceHttps`、`siteName`、`secureUrl`。

可重复属性（如 `ogImage`、`preload`、`feed`、`schema`、`icon`、`appleTouchStartupImage`）接受单个值或列表。

### 运行时元数据

当某个值必须等到请求到达才能确定（例如正在查看的文章的标题），可以在运行时设置：

```php
use Laravel\Head\Facades\Head;

public function __invoke(Post $post): Response
{
    Head::title($post->title);

    // ...
}
```

通过 `Head` 门面进行的运行时调用会覆盖路由元数据，用于依赖于请求的数据。控制器和 action 是进行这种调用最常见的位置：

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

多次运行时调用会按执行顺序合并。对于 title、description、canonical URL、robots 指令这类单值字段，后面的调用优先。可重复字段会保留多条记录，但若再次传入相同的 key，则会更新原条目。对于 `ogImage` 方法，URL 用作 key：

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

Open Graph 媒体若继承自默认值，会作为回退。当路由、运行时或错误元数据定义了同类型的媒体时，会替换默认值而非合并——因此页面的 `og:image` 优先于全站默认图片。

可以使用 `when` 与 `unless` 方法以流式方式定义条件性元数据：

```php
Head::title($post->title)
    ->when($post->isDraft(), fn ($head) => $head->hiddenFromRobots());
```

### 错误页

通常，应当在应用 `AppServiceProvider` 的 `boot` 方法中注册错误元数据：

```php
use Laravel\Head\ErrorPages;
use Laravel\Head\Facades\Head;

/**
 * 引导应用服务。
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

`defaults` 与 `status` 方法也接收与 `Head::defaults()` 相同的流式构造器回调：

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

当为某个已注册的错误状态码渲染响应时，这些元数据会凌驾于所有其他层级。

Laravel 在渲染错误视图或执行响应阶段的钩子（例如 Inertia 的 `handleExceptionsUsing()` 方法）时，会自动检测响应状态。如果你在 `$exceptions->render()` 回调中渲染错误响应，请在渲染前调用 `Head::status(404)`，让错误元数据生效。

## Open Graph

可以使用 `og` 方法设置 Open Graph 属性。重复的媒体可以通过顶层方法添加，这些方法接收具名参数：

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

`ogImage`、`ogVideo`、`ogAudio` 方法的第一个参数是 URL，也可以传入可选的具名参数，例如 `alt`、`width`、`height`、`type`、`secureUrl`（Open Graph 规范支持时）。

在 API 接受 `type` 的地方，可以传入 `ImageType` 枚举值——例如 `ImageType::Svg`、`ImageType::Png`、`ImageType::Jpeg`、`ImageType::Webp`。

> [!NOTE]
> Document 的 `title` 和 `description` 会自动补齐缺失的 `og:title` 和 `og:description`。

如果只需要一张 Open Graph 图片，且没有其他属性，可以把 `image` 具名参数传给 `og` 方法：

```php
Head::og(
    type: OgType::Website,
    title: $page->title,
    description: $page->description,
    image: $page->og_image_url,
);
```

`og(image: ...)` 和 `ogImage(...)` 会写入同一份底层图片列表，你可以在调用处选用更顺手的形式。可以使用 `meta` 方法来扩展自定义的 Open Graph 字段（例如 product、article 属性）。

### X / Twitter Cards

若希望从与 Open Graph 共享的 title、description、image 中渲染 X / Twitter cards，可以在默认值里注册 `twitter()`：

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

这会渲染出与之对应的 Twitter 标签：

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Introducing Laravel Head">
<meta name="twitter:description" content="A fluent API for Laravel document head metadata.">
<meta name="twitter:image" content="https://example.com/social.jpg">
<meta name="twitter:image:alt" content="Introducing Laravel Head">
```

可以在单个页面通过显式的 Twitter 值进行自定义：

```php
Head::twitter(title: $post->social_title)
    ->twitterImage($post->social_image_url, alt: $post->title);
```

路由元数据支持 `twitter` 和 `twitterImage`。

## 主题颜色

可以在全局、按路由或在运行时设置主题颜色：

```php
Head::themeColor('#0f172a');
```

这会渲染一个 `<meta name="theme-color">` 标签。对于指定媒体类型的主题颜色，可以使用 `Media` 枚举：

```php
use Laravel\Head\Enums\Media;

Head::themeColor('#ffffff', media: Media::Light)
    ->themeColor('#111827', media: Media::Dark);
```

`Media` 枚举还包含 `Portrait` 和 `Landscape`。`media` 参数也支持自定义的媒体查询字符串。

路由元数据通过相同的 `camelCase` 键支持单个主题颜色：

```php
Route::view('/dashboard', 'dashboard')->withHead(
    themeColor: '#0f172a',
);
```

## 应用元数据与图标

Laravel Head 提供了用于常见浏览器与应用元数据的方法：

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

`favicon` 方法是 `icon` 方法的别名，支持相同的 `type`、`sizes`、`media` 参数。

路由元数据使用相同的命名：

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

## 渐进式 Web 应用（PWA）

`pwa` 方法用于配置一个可安装 Web 应用所常用的 `<head>` 标签：

```php
Head::pwa(
    name: 'Laravel',
    manifest: '/site.webmanifest',
    themeColor: '#0f172a',
    appleTouchIcon: '/apple-touch-icon.png',
    appleWebAppStatusBarStyle: 'black',
);
```

它会渲染应用名称、Web 应用清单链接以及 iOS standalone 元数据。如果提供了主题颜色、Apple 状态栏样式与 Apple touch 图标，也会一并渲染。创建 Web 应用清单与注册 service worker 仍由应用自行负责。

可以在默认值或运行时元数据中使用 `pwa` 方法。路由元数据支持上文提到的那些独立属性。

## 性能与发现

Laravel Head 可渲染性能提示、分页链接、locale 候选项与 feed 发现：

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

对于本地资源，`preloadAsset()` 与 `prefetchAsset()` 会通过 `asset()` 辅助函数解析 URL，并根据文件扩展名自动识别 `as` 属性。字体 preload 会自动带上 `crossorigin`——尽管是同源字体，preload 规范也要求这样做：

```php
Head::preloadAsset('fonts/inter.woff2')
    ->prefetchAsset('images/next.webp');
```

```html
<link rel="preload" href="https://example.com/fonts/inter.woff2" as="font" crossorigin>
<link rel="prefetch" href="https://example.com/images/next.webp" as="image">
```

可以显式传入 `as` 覆盖自动检测。当 `as` 属性无法从扩展名推断时，`preloadAsset` 方法会抛出异常——因为浏览器在没有该属性的情况下会忽略 preload；`prefetchAsset` 方法则会直接省略它。

## 自定义标签

对于没有专属方法的标签，可以使用 `meta()` 与 `link()`：

```php
Head::meta('format-detection', 'telephone=no')
    ->meta('article:author', $post->author->name)
    ->link('search', '/opensearch.xml', [
        'type' => 'application/opensearchdescription+xml',
        'title' => 'Laravel Search',
    ])
    ->link('me', 'https://social.example.com/@laravel');
```

如果希望某 meta 标签仅在满足匹配条件时被浏览器应用，可以传入媒体查询：

```php
use Laravel\Head\Enums\Media;

Head::meta('theme-color', '#ffffff', media: Media::Light)
    ->meta('theme-color', '#111827', media: Media::Dark);
```

`meta` 方法对常规 meta 标签使用 `name` 属性。对于通常使用 `property` 属性的 key（如 Open Graph（`og:`）或 article 元数据（`article:`）），方法会自动切换：

```php
Head::meta('description', 'About Laravel')
    ->meta('og:title', 'About Laravel');
```

```html
<meta name="description" content="About Laravel">
<meta property="og:title" content="About Laravel">
```

可以显式传入 `property: true` 或 `property: false` 来选择属性类型。

## Schema

内置的 schema 构造器覆盖了常见的 JSON-LD 类型：

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

内置的工厂方法包括：`article`、`blogPosting`、`product`、`offer`、`brand`、`breadcrumbs`、`faq`、`organization`、`person`、`webPage` 和 `webSite`。未知的工厂方法会创建一个通用 schema 对象，因此仍然可以表达自定义的 schema.org 类型。

当 JSON-LD schema 数据不合法时，Laravel Head 在非生产环境会抛出异常，在生产环境仅记录警告。

### 面包屑（Breadcrumbs）

可以逐项或批量添加面包屑项，位置（position）会按添加顺序自动分配：

```php
Head::schema(
    Schema::breadcrumbs()->items([
        'Home' => route('home'),
        'Shop' => route('shop.index'),
        'Shoes' => route('shop.category', 'shoes'),
    ])
);
```

也可以用 `item` 方法逐项添加：

```php
Schema::breadcrumbs()
    ->item('Home', route('home'))
    ->item('Shop', route('shop.index'));
```

### FAQ

FAQ 条目遵循相同的模式。可以使用 `question` 方法逐条添加，或使用 `questions` 方法批量添加：

```php
Head::schema(
    Schema::faq()->questions([
        'What is Laravel Head?' => 'A fluent API for managing the document head.',
        'Is it free?' => 'Yes, it is open source.',
    ])
);
```

### 自定义 Schemas

可以显式注册自定义 schema 类型：

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

## 渲染

Laravel Head 会为当前响应解析出页面元数据标签。具体如何渲染取决于你的应用栈。

HTML 渲染器为 `@head` 指令提供支持，并为 Laravel Head 与 Inertia 通过 `head` prop 共享的元素提供渲染能力。数组渲染器为 `Head::toArray()` 提供支持，供那些需要把解析后的元数据作为结构化数据的应用使用。

### Blade

在布局的 `<head>` 中用 `@head` 指令渲染累积的标签：

```blade
<head>
    <meta charset="utf-8">
    @head
</head>
```

`@head` 指令是同步渲染的，因此页面元数据需要在布局渲染前定义。

### Livewire

Livewire 应用在文档布局中使用相同的 `@head` 指令：

```blade
<head>
    @head
</head>

<body>
    {{ $slot }}

    @livewireScripts
</body>
```

无需任何 Livewire 专属配置。Laravel Head 的元数据按请求解析，解析器也是请求作用域的。因此每次 `wire:navigate` 访问都会拉取一个全新的文档，`@head` 输出会反映目标路由的元数据。通过 `wire:navigate` 访问的页面会收到正确的路由、运行时和错误元数据，无需在组件内写 head 相关代码。

### Inertia

在 Inertia 的根模板中使用相同的 `@head` 指令，并配合 Inertia 自身的组件：

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

当安装了 Inertia，Laravel Head 会自动把页面管理的 head 作为已渲染元素字符串数组，通过每个页面对象上的 `head` prop 进行共享：

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

在调用 `createInertiaApp()` 的地方启用 Inertia 的 `serverHead` 选项。该选项在 Inertia 3.5 及以上版本可用：

```js
createInertiaApp({
    // ...
    serverHead: true,
});
```

每个由页面管理的元素都带有稳定的 `data-inertia` key。`@head` 指令会先渲染初始文档，之后 Inertia 会接管这些元素，并在常规访问、[即时访问](https://inertiajs.com/docs/v3/the-basics/instant-visits) 和前进/后退导航期间保持同步。这些元素存在于初始 HTML 响应中，因此爬虫和链接预览 bot 即使不执行 JavaScript 也能读取。无需在客户端使用 `<Head>` 组件。

无论是否使用 [服务端渲染（SSR）](https://inertiajs.com/docs/v3/advanced/server-side-rendering) 都可以工作。如果应用有独立的 SSR 入口，请在那里也启用 `serverHead`。Laravel Head 会在 `@head` 与 `<x-inertia::head />` 之间自动去重页面管理的元素——无论两者出现顺序如何，同时保留由 JavaScript SSR 产生的其他 head 元素。

> [!NOTE]
> 将 Laravel Head 引入现有 Inertia 应用时，请从 `resources/js/app.tsx` 与 `resources/js/ssr.tsx` 中删除 title 回调，让 Laravel Head 管理最终的文档 title；并把由 Inertia [`<Head>` 组件](https://inertiajs.com/docs/v3/the-basics/title-and-meta) 管理的标签迁移到 Laravel Head，避免重复定义同一元素。

`head` prop 不会出现在局部刷新响应中，因此 Inertia 会沿用上一次完整页面的 head。即时访问同样会保留当前 head，直到后台响应到达。如果应用已经在使用 `head` prop，可在服务提供者中修改其名称：

```php
use Laravel\Head\Facades\Head;

public function boot(): void
{
    Head::inertia(prop: '_head');
}
```

然后通过 `serverHead: '_head'` 让 Inertia 指向同一个 prop。

#### 静态 Inertia 标签

大多数标签都应该放在默认值、路由元数据或运行时元数据里，以便 Laravel Head 能为每个页面解析出正确的值。只有首次 HTML 响应里出现、且之后不再由 Inertia 更新的那些文档标签，才适合放在 Inertia globals 中。

可以在服务提供者中通过 `Head::inertiaGlobals()` 注册它们：

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

Inertia globals 不会出现在 `head` prop 中、渲染时不带 `data-inertia` 归属属性，并且在第一次响应后不再更新。这类全局标签适合 viewport、color-scheme、favicon、touch icon、manifest 等相对稳定、一次确定即可的浏览器提示。如果某个标签与具体页面相关、会影响 SEO、或者以后可能调整，建议改放在 `defaults`、路由元数据或运行时元数据中。

如果应用需要把解析后的元数据作为结构化数据使用，而不是渲染成标签，可以调用 `Head::toArray()`。返回的数据包括 titles、Open Graph 值、JSON-LD schemas 及其他已解析元数据。