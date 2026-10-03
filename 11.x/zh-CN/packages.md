# 包开发

- [简介](#introduction)
   - [关于 Facade 的说明](#a-note-on-facades)
- [包发现](#package-discovery)
- [服务提供者](#service-providers)
- [资源](#resources)
   - [配置](#configuration)
   - [数据库迁移](#migrations)
   - [路由](#routes)
   - [语言文件](#language-files)
   - [视图](#views)
   - [视图组件](#view-components)
   - ["About" Artisan 命令](#about-artisan-command)
- [命令](#commands)
   - [优化命令](#optimize-commands)
- [公共资源](#public-assets)
- [发布文件分组](#publishing-file-groups)

<a name="introduction"></a>
## 简介

包是为 Laravel 添加功能的主要方式。包的内容可以是像 [Carbon](https://github.com/briannesbitt/Carbon) 这样出色的日期处理工具，也可以是像 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary) 这样让你把文件与 Eloquent 模型关联起来的包。

包有多种类型。有些包是独立型的，也就是说它们可以与任何 PHP 框架配合使用。Carbon 和 Pest 就是独立包的例子。你只需在 `composer.json` 文件中引入它们，即可在 Laravel 中使用这些包。

另一方面，有些包是专门为 Laravel 设计的。这些包可能包含专门用于增强 Laravel 应用的路由、控制器、视图和配置。本指南主要介绍这类 Laravel 专用包的开发。

<a name="a-note-on-facades"></a>
### 关于 Facade 的说明

在编写 Laravel 应用时，使用契约还是 Facade 通常并不重要，因为两者提供的可测试性基本相当。不过在编写包时，你的包通常无法使用 Laravel 的全部测试辅助工具。如果你希望能够像包被安装在典型 Laravel 应用中那样编写包的测试，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

<a name="package-discovery"></a>
## 包发现

Laravel 应用的 `bootstrap/providers.php` 文件包含了应由 Laravel 加载的服务提供者列表。你不必让用户手动把你的服务提供者添加到这个列表里，而是在包的 `composer.json` 文件的 `extra` 部分定义该提供者，Laravel 就会自动加载它。除了服务提供者之外，你还可以列出希望注册的任意 [Facade](/docs/{{version}}/facades)：

```json
"extra": {
    "laravel": {
        "providers": [
            "Barryvdh\\Debugbar\\ServiceProvider"
        ],
        "aliases": {
            "Debugbar": "Barryvdh\\Debugbar\\Facade"
        }
    }
},
```

一旦你的包配置好了包发现，Laravel 就会在安装该包时自动注册它的服务提供者和 Facade，为你的包用户提供便捷的安装体验。

<a name="opting-out-of-package-discovery"></a>
#### 退出包发现

如果你是某个包的使用者，并且希望禁用某个包的包发现，可以在应用的 `composer.json` 文件的 `extra` 部分列出该包名：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以在应用的 `dont-discover` 指令中使用 `*` 字符，为所有包禁用包发现：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "*"
        ]
    }
},
```

<a name="service-providers"></a>
## 服务提供者

[服务提供者（Service Provider）](/docs/{{version}}/providers)是你的包与 Laravel 之间的连接点。服务提供者负责把各类东西绑定到 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)中，并告知 Laravel 应当从哪里加载包的资源，例如视图、配置和语言文件。

服务提供者继承 `Illuminate\Support\ServiceProvider` 类，其中包含两个方法：`register` 和 `boot`。基础的 `ServiceProvider` 类位于 `illuminate/support` Composer 包中，你应当把它加入自己包的依赖里。若想进一步了解服务提供者的结构与用途，请查阅[它们的文档](/docs/{{version}}/providers)。

<a name="resources"></a>
## 资源

<a name="configuration"></a>
### 配置

通常，你需要把包的配置文件发布到应用的 `config` 目录。这样一来，你包的用户就能轻松覆盖你的默认配置选项。要允许发布配置文件，请在你服务提供者的 `boot` 方法中调用 `publishes` 方法：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当你包的用户执行 Laravel 的 `vendor:publish` 命令时，你的文件就会被复制到指定的发布位置。一旦配置发布完成，就可以像访问其他任何配置文件一样访问它的值：

```php
$value = config('courier.option');
```

> [!WARNING]
> 不要在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，闭包无法被正确序列化。

<a name="default-package-configuration"></a>
#### 默认包配置

你也可以把自己包的配置文件与应用中已发布的副本合并。这样一来，你只需在配置文件的发布副本中定义真正想要覆盖的选项。若要合并配置文件的值，请在你服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法的第一个参数是你包中配置文件的路径，第二个参数是应用中该配置文件副本的名称：

```php
/**
 * 注册任何应用服务。
 */
public function register(): void
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> [!WARNING]
> 该方法只会合并配置数组的第一层。如果你的用户只定义了一个多维配置数组的部分内容，缺失的选项将不会被合并。

<a name="routes"></a>
### 路由

如果你的包包含路由，可以使用 `loadRoutesFrom` 方法加载它们。该方法会自动判断应用的路由是否已缓存；如果路由已被缓存，就不会加载你的路由文件：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

<a name="migrations"></a>
### 数据库迁移

如果你的包包含[数据库迁移](/docs/{{version}}/migrations)，可以使用 `publishesMigrations` 方法告知 Laravel 给定的目录或文件中包含数据库迁移。当 Laravel 发布这些迁移时，会自动更新文件名中的时间戳，使其反映当前的日期和时间：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishesMigrations([
        __DIR__.'/../database/migrations' => database_path('migrations'),
    ]);
}
```

<a name="language-files"></a>
### 语言文件

如果你的包包含[语言文件](/docs/{{version}}/localization)，可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的包名为 `courier`，则应在服务提供者的 `boot` 方法中添加如下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包的翻译行按照 `package::file.line` 的语法约定来引用。因此，你可以这样加载 `courier` 包中 `messages` 文件的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

你可以使用 `loadJsonTranslationsFrom` 方法为你的包注册 JSON 翻译文件。该方法接受一个路径，指向包含你包 JSON 翻译文件的目录：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

<a name="publishing-language-files"></a>
#### 发布语言文件

如果你想把包的语言文件发布到应用的 `lang/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个数组，其中包含包的路径及其期望的发布位置。例如，要发布 `courier` 包的语言文件，可以这样做：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当你包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你包的语言文件就会被发布到指定的发布位置。

<a name="views"></a>
### 视图

要把你包的[视图](/docs/{{version}}/views)注册到 Laravel，你必须告诉 Laravel 视图位于何处。你可以使用服务提供者的 `loadViewsFrom` 方法来做到这一点。`loadViewsFrom` 方法接受两个参数：视图模板的路径和你包的名称。例如，如果你的包名为 `courier`，则应在服务提供者的 `boot` 方法中添加如下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包的视图按照 `package::view` 的语法约定来引用。因此，一旦在服务提供者中注册了视图路径，就可以这样加载 `courier` 包的 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

<a name="overriding-package-views"></a>
#### 覆盖包视图

当你使用 `loadViewsFrom` 方法时，Laravel 实际上会为你的视图注册两个位置：应用的 `resources/views/vendor` 目录，以及你指定的目录。还是以 `courier` 包为例，Laravel 会先检查开发者是否把该视图的自定义版本放在了 `resources/views/vendor/courier` 目录中。如果该视图尚未被自定义，Laravel 就会搜索你在调用 `loadViewsFrom` 时指定的包视图目录。这让包的用户可以轻松地自定义 / 覆盖你包的视图。

<a name="publishing-views"></a>
#### 发布视图

如果你希望让视图可被发布到应用的 `resources/views/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个数组，其中包含包视图的路径及其期望的发布位置：

```php
/**
 * 引导包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');

    $this->publishes([
        __DIR__.'/../resources/views' => resource_path('views/vendor/courier'),
    ]);
}
```

现在，当你包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你包的视图就会被复制到指定的发布位置。

<a name="view-components"></a>
### 视图组件

如果你正在构建一个使用 Blade 组件的包，或者把组件放在非常规目录中，就需要手动注册组件类及其 HTML 标签别名，好让 Laravel 知道去哪里查找该组件。通常，你应该在包的 `boot` 方法内注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导你包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册完成后，就可以使用它的标签别名来渲染：

```blade
<x-package-alert/>
```

<a name="autoloading-package-components"></a>
#### 自动加载包组件

或者，你也可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能有位于 `Nightshade\Views\Components` 命名空间下的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以使用 `package-name::` 语法，通过包的供应商命名空间来使用组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会自动把组件名转为帕斯卡命名，从而检测出与该组件关联的类。使用"点"记法同样支持子目录。

<a name="anonymous-components"></a>
#### 匿名组件

如果你的包包含匿名组件，它们必须放在你包"视图"目录下的 `components` 目录中（该目录由 [`loadViewsFrom` 方法](#views)指定）。随后，你可以在组件名前加上包的视图命名空间前缀来渲染它们：

```blade
<x-courier::alert />
```

<a name="about-artisan-command"></a>
### "About" Artisan 命令

Laravel 内置的 `about` Artisan 命令提供了应用环境与配置的概要信息。包可以通过 `AboutCommand` 类向该命令的输出推送额外信息。通常，你可以在包的 `boot` 方法中添加这些信息：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    AboutCommand::add('My Package', fn () => ['Version' => '1.0.0']);
}
```

<a name="commands"></a>
## 命令

你可以使用 `commands` 方法把你包的 Artisan 命令注册到 Laravel。该方法接受一个命令类名数组。命令注册完成后，你可以使用 [Artisan CLI](/docs/{{version}}/artisan) 执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            NetworkCommand::class,
        ]);
    }
}
```

<a name="optimize-commands"></a>
### 优化命令

Laravel 的 [`optimize` 命令](/docs/{{version}}/deployment#optimization)会缓存应用的配置、事件、路由和视图。通过 `optimizes` 方法，你可以注册你自己的 Artisan 命令，使其在执行 `optimize` 和 `optimize:clear` 命令时被调用：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->optimizes(
            optimize: 'package:optimize',
            clear: 'package:clear-optimizations',
        );
    }
}
```

<a name="public-assets"></a>
## 公共资源

你的包可能包含 JavaScript、CSS 和图片等资源。要把这些资源发布到应用的 `public` 目录，请使用服务提供者的 `publishes` 方法。在这个例子中，我们还会添加一个 `public` 资源分组标签，它可以用来轻松发布成组的相关资源：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当你包的用户执行 `vendor:publish` 命令时，你的资源就会被复制到指定的发布位置。由于用户通常需要在每次更新包时都覆盖这些资源，因此你可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

<a name="publishing-file-groups"></a>
## 发布文件分组

你可能希望把包的各组资源和资源文件分开发布。例如，你可能希望允许用户发布包的配置文件，而不必同时发布包的资源。你可以在从包的服务提供者调用 `publishes` 方法时对它们进行"标记"来实现这一点。让我们以 `courier` 包为例，在包的服务提供者的 `boot` 方法中使用标签定义两个发布分组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/package.php' => config_path('package.php')
    ], 'courier-config');

    $this->publishesMigrations([
        __DIR__.'/../database/migrations/' => database_path('migrations')
    ], 'courier-migrations');
}
```

现在，用户在执行 `vendor:publish` 命令时引用相应的标签，即可分别发布这些分组：

```shell
php artisan vendor:publish --tag=courier-config
```
