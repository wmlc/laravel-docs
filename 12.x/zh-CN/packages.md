# 软件包开发

- [简介](#introduction)
    - [关于 Facade 的说明](#a-note-on-facades)
- [包发现](#package-discovery)
- [服务提供者](#service-providers)
- [资源](#resources)
    - [配置](#configuration)
    - [路由](#routes)
    - [数据库迁移](#migrations)
    - [语言文件](#language-files)
    - [视图](#views)
    - [视图组件](#view-components)
    - [`about` Artisan 命令](#about-artisan-command)
- [命令](#commands)
    - [优化命令](#optimize-commands)
    - [重载命令](#reload-commands)
- [公共资源](#public-assets)
- [发布文件组](#publishing-file-groups)

<a name="introduction"></a>
## 简介

软件包是为 Laravel 添加功能的主要方式。包的形式多种多样，既可以是像 [Carbon](https://github.com/briannesbitt/Carbon) 这样处理日期的优秀工具，也可以是像 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary) 这样将文件与 Eloquent 模型关联起来的包。

包有不同的类型。有些包是独立的，意味着它们可以与任何 PHP 框架配合使用，Carbon 和 Pest 就是独立包的例子。任何这类包都可以通过在你的 `composer.json` 文件中引入，与 Laravel 一起使用。

另一方面，另一些包是专门为 Laravel 设计的。这些包可能包含专门用于增强 Laravel 应用的路由、控制器、视图和配置。本指南主要介绍这类 Laravel 专属包的开发。

<a name="a-note-on-facades"></a>
### 关于 Facade 的说明

编写 Laravel 应用时，你使用契约还是 Facade 通常无关紧要，因为两者提供的可测试性水平基本相同。不过，在编写包时，你的包通常无法使用 Laravel 的全部测试辅助函数。如果你希望编写包测试时就如同包安装在典型的 Laravel 应用中一样，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

<a name="package-discovery"></a>
## 包发现

Laravel 应用的 `bootstrap/providers.php` 文件包含应由 Laravel 加载的服务提供者列表。不过，你不必要求用户手动把你的服务提供者添加到该列表中，而是可以在包的 `composer.json` 文件的 `extra` 部分定义提供者，让 Laravel 自动加载它。除了服务提供者之外，你还可以列出希望注册的任何 [Facade](/docs/{{version}}/facades)：

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

包配置好发现后，Laravel 会在安装时自动注册其服务提供者和 Facade，为包的用户带来便捷的安装体验。

<a name="opting-out-of-package-discovery"></a>
#### 退出包发现

如果你是包的使用者，并希望禁用某个包的包发现，可以在应用的 `composer.json` 文件的 `extra` 部分列出该包的名称：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以在应用的 `dont-discover` 指令中使用 `*` 字符，对所有包禁用包发现：

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

[服务提供者（Service Provider）](/docs/{{version}}/providers)是包与 Laravel 之间的连接点。服务提供者负责将内容绑定到 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)，并告知 Laravel 从哪里加载包的资源，例如视图、配置和语言文件。

服务提供者继承 `Illuminate\Support\ServiceProvider` 类，包含两个方法：`register` 和 `boot`。基类 `ServiceProvider` 位于 `illuminate/support` Composer 包中，你应该把它添加到自己的包的依赖中。要进一步了解服务提供者的结构和用途，请查阅[服务提供者文档](/docs/{{version}}/providers)。

<a name="resources"></a>
## 资源

<a name="configuration"></a>
### 配置

通常，你需要将包的配置文件发布到应用的 `config` 目录。这样包的用户就可以轻松覆盖你的默认配置选项。要使配置文件可被发布，请在服务提供者的 `boot` 方法中调用 `publishes` 方法：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当包的用户执行 Laravel 的 `vendor:publish` 命令时，你的文件将被复制到指定的发布位置。配置发布后，就可以像访问任何其他配置文件一样访问它的值：

```php
$value = config('courier.option');
```

> [!WARNING]
> 你不应在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，闭包无法被正确序列化。

<a name="default-package-configuration"></a>
#### 包的默认配置

你还可以将自己的包配置文件与应用中已发布的副本合并。这样，用户只需在配置文件的发布副本中定义他们真正想覆盖的选项。要合并配置文件的值，请在服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受包配置文件的路径作为第一个参数，接受应用中配置文件副本的名称作为第二个参数：

```php
/**
 * 注册任意包服务。
 */
public function register(): void
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> [!WARNING]
> 此方法只合并配置数组的第一层。如果用户只定义了多维配置数组的一部分，缺失的选项不会被合并。

<a name="routes"></a>
### 路由

如果你的包包含路由，可以使用 `loadRoutesFrom` 方法加载它们。该方法会自动判断应用的路由是否已缓存，如果路由已经缓存，就不会加载你的路由文件：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

<a name="migrations"></a>
### 数据库迁移

如果你的包包含[数据库迁移](/docs/{{version}}/migrations)，可以使用 `publishesMigrations` 方法告知 Laravel 给定的目录或文件中包含迁移。Laravel 发布这些迁移时，会自动更新文件名中的时间戳，使其反映当前的日期和时间：

```php
/**
 * 引导任意包服务。
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

如果你的包包含[语言文件](/docs/{{version}}/localization)，可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的包名为 `courier`，应该在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包的翻译行使用 `package::file.line` 语法约定来引用。因此，你可以像这样从 `messages` 文件中加载 `courier` 包的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

你可以使用 `loadJsonTranslationsFrom` 方法为包注册 JSON 翻译文件。该方法接受包含包的 JSON 翻译文件的目录路径：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

<a name="publishing-language-files"></a>
#### 发布语言文件

如果希望将包的语言文件发布到应用的 `lang/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个由包路径及其期望发布位置组成的数组。例如，要发布 `courier` 包的语言文件，可以这样操作：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，包的语言文件将被发布到指定的发布位置。

<a name="views"></a>
### 视图

要将包的[视图](/docs/{{version}}/views)注册到 Laravel，你需要告诉 Laravel 视图所在的位置。你可以使用服务提供者的 `loadViewsFrom` 方法来完成。`loadViewsFrom` 方法接受两个参数：视图模板的路径和包的名称。例如，如果你的包名为 `courier`，则应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包的视图使用 `package::view` 语法约定来引用。因此，一旦视图路径在服务提供者中注册，你就可以像这样加载 `courier` 包的 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

<a name="overriding-package-views"></a>
#### 覆盖包视图

使用 `loadViewsFrom` 方法时，Laravel 实际上会为你的视图注册两个位置：应用的 `resources/views/vendor` 目录和你指定的目录。因此，以 `courier` 包为例，Laravel 会先检查开发者是否在 `resources/views/vendor/courier` 目录中放置了自定义版本的视图。然后，如果视图没有被自定义，Laravel 会搜索你在调用 `loadViewsFrom` 时指定的包视图目录。这让包用户可以轻松地自定义 / 覆盖你的包视图。

<a name="publishing-views"></a>
#### 发布视图

如果你希望视图可以发布到应用的 `resources/views/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个由包视图路径及其期望发布位置组成的数组：

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

现在，当包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，包的视图将被复制到指定的发布位置。

<a name="view-components"></a>
### 视图组件

如果你正在构建的包使用了 Blade 组件，或者将组件放在了非约定的目录中，你需要手动注册组件类及其 HTML 标签别名，让 Laravel 知道到哪里找到该组件。通常，你应该在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册完成后，就可以通过其标签别名来渲染它：

```blade
<x-package-alert/>
```

<a name="autoloading-package-components"></a>
#### 自动加载包组件

此外，你也可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能拥有 `Calendar` 和 `ColorPicker` 组件，它们位于 `Nightshade\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以通过 `package-name::` 语法，按其厂商命名空间使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会自动将组件名转换为帕斯卡命名形式，从而检测与该组件关联的类。子目录也支持使用「点」表示法。

<a name="anonymous-components"></a>
#### 匿名组件

如果你的包包含匿名组件，必须将它们放在包的「视图」目录（由 [loadViewsFrom 方法](#views)指定）下的 `components` 目录中。然后，你可以通过在组件名前加上包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

<a name="about-artisan-command"></a>
### `about` Artisan 命令

Laravel 内置的 `about` Artisan 命令提供应用环境和配置的概要。包可以通过 `AboutCommand` 类向该命令的输出推送额外的信息。通常，这些信息可以在包服务提供者的 `boot` 方法中添加：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * 引导任意包服务。
 */
public function boot(): void
{
    AboutCommand::add('My Package', fn () => ['Version' => '1.0.0']);
}
```

<a name="commands"></a>
## 命令

要向 Laravel 注册包的 Artisan 命令，可以使用 `commands` 方法。该方法接受一个由命令类名组成的数组。命令注册完成后，你就可以使用 [Artisan CLI](/docs/{{version}}/artisan) 来执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * 引导任意包服务。
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

Laravel 的 [optimize 命令](/docs/{{version}}/deployment#optimization)会缓存应用的配置、事件、路由和视图。使用 `optimizes` 方法，你可以注册包自己的 Artisan 命令，让它们在执行 `optimize` 和 `optimize:clear` 命令时被调用：

```php
/**
 * 引导任意包服务。
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

<a name="reload-commands"></a>
### 重载命令

Laravel 的 [reload 命令](/docs/{{version}}/deployment#reloading-services)会终止所有正在运行的服务，让系统进程监视器自动重启它们。使用 `reloads` 方法，你可以注册包自己的 Artisan 命令，让它在执行 `reload` 命令时被调用：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->reloads('package:reload');
    }
}
```

<a name="public-assets"></a>
## 公共资源

你的包可能包含 JavaScript、CSS 和图片等资源。要将这些资源发布到应用的 `public` 目录，请使用服务提供者的 `publishes` 方法。在本例中，我们还会添加一个 `public` 资源组标签，它可以用来方便地发布一组相关资源：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当包的用户执行 `vendor:publish` 命令时，你的资源将被复制到指定的发布位置。由于用户通常需要在每次更新包时覆盖这些资源，他们可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

<a name="publishing-file-groups"></a>
## 发布文件组

你可能希望将包的资源和资源文件分组、分开发布。例如，你可能希望允许用户发布包的配置文件，而不强制他们同时发布包的资源。你可以在包的服务提供者中调用 `publishes` 方法时通过「打标签」来实现。例如，让我们在包服务提供者的 `boot` 方法中使用标签为 `courier` 包定义两个发布组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * 引导任意包服务。
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

现在，你的用户在执行 `vendor:publish` 命令时，可以通过引用标签来分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```

你的用户还可以使用 `--provider` 标志，发布由包服务提供者定义的所有可发布文件：

```shell
php artisan vendor:publish --provider="Your\Package\ServiceProvider"
```
