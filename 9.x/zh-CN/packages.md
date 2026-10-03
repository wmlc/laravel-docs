# 包开发

- [简介](#introduction)
    - [关于 Facade 的说明](#a-note-on-facades)
- [包发现](#package-discovery)
- [服务提供者](#service-providers)
- [资源](#resources)
    - [配置](#configuration)
    - [迁移](#migrations)
    - [路由](#routes)
    - [翻译](#translations)
    - [视图](#views)
    - [视图组件](#view-components)
    - ["About" Artisan 命令](#about-artisan-command)
- [命令](#commands)
- [公共资源](#public-assets)
- [发布文件组](#publishing-file-groups)

<a name="introduction"></a>
## 简介

包是为 Laravel 添加功能的主要方式。包可以是任何东西，从处理日期的绝佳工具（如 [Carbon](https://github.com/briannesbitt/Carbon)）到允许你将文件与 Eloquent 模型关联的包（如 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary)）。

包有不同的类型。有些包是独立的，意味着它们可以与任何 PHP 框架配合使用。Carbon 和 PHPUnit 就是独立包的例子。这些包都可以通过在 `composer.json` 文件中引入来与 Laravel 一起使用。

另一方面，其他包则专门为 Laravel 设计。这些包可能包含专门用于增强 Laravel 应用的路由、控制器、视图和配置。本指南主要涵盖 Laravel 专用包的开发。

<a name="a-note-on-facades"></a>
### 关于 Facade 的说明

编写 Laravel 应用时，使用契约还是 Facade 通常没有区别，因为两者提供了基本相同的可测试性。然而，编写包时，你的包通常无法访问 Laravel 的所有测试辅助工具。如果你希望能够像包安装在典型 Laravel 应用中一样编写包测试，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

<a name="package-discovery"></a>
## 包发现

在 Laravel 应用的 `config/app.php` 配置文件中，`providers` 选项定义了 Laravel 应加载的服务提供者列表。当有人安装你的包时，你通常希望你的服务提供者包含在此列表中。你可以在包的 `composer.json` 文件的 `extra` 部分定义提供者，而无需要求用户手动将你的服务提供者添加到列表中。除了服务提供者，你还可以列出任何你希望注册的 [Facade](/docs/{{version}}/facades)：

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

一旦你的包配置了发现机制，Laravel 会在安装时自动注册其服务提供者和 Facade，为包用户创建便捷的安装体验。

<a name="opting-out-of-package-discovery"></a>
### 退出包发现

如果你是包的使用者，并且希望为某个包禁用包发现，可以在应用的 `composer.json` 文件的 `extra` 部分列出该包名称：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以在应用的 `dont-discover` 指令中使用 `*` 字符来为所有包禁用包发现：

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

[服务提供者](/docs/{{version}}/providers)是包与 Laravel 之间的连接点。服务提供者负责将内容绑定到 Laravel 的[服务容器](/docs/{{version}}/container)中，并告知 Laravel 从何处加载包资源（如视图、配置和本地化文件）。

服务提供者继承 `Illuminate\Support\ServiceProvider` 类，包含两个方法：`register` 和 `boot`。基础 `ServiceProvider` 类位于 `illuminate/support` Composer 包中，你应当将其添加到自己的包依赖中。要了解更多关于服务提供者的结构和用途，请查阅[其文档](/docs/{{version}}/providers)。

<a name="resources"></a>
## 资源

<a name="configuration"></a>
### 配置

通常，你需要将包的配置文件发布到应用的 `config` 目录。这使包用户能够轻松覆盖你的默认配置选项。要允许配置文件被发布，请从服务提供者的 `boot` 方法调用 `publishes` 方法：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当包用户执行 Laravel 的 `vendor:publish` 命令时，你的文件将被复制到指定的发布位置。配置发布后，可以像访问其他配置文件一样访问其值：

```php
$value = config('courier.option');
```

> **Warning**
> 你不应当在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，闭包无法被正确序列化。

<a name="default-package-configuration"></a>
#### 默认包配置

你还可以将自己的包配置文件与应用的已发布副本合并。这使你的用户只需在配置文件的已发布副本中定义他们实际想要覆盖的选项。要合并配置文件值，请在服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受包配置文件的路径作为第一个参数，应用配置文件副本的名称作为第二个参数：

```php
/**
 * 注册应用服务。
 *
 * @return void
 */
public function register()
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> **Warning**
> 此方法仅合并配置数组的第一层。如果用户部分定义了多维配置数组，缺失的选项不会被合并。

<a name="routes"></a>
### 路由

如果你的包包含路由，可以使用 `loadRoutesFrom` 方法加载它们。此方法会自动判断应用的路由是否已缓存，如果路由已缓存则不会加载你的路由文件：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

<a name="migrations"></a>
### 迁移

如果你的包包含[数据库迁移](/docs/{{version}}/migrations)，可以使用 `loadMigrationsFrom` 方法告知 Laravel 如何加载它们。`loadMigrationsFrom` 方法接受包迁移的路径作为其唯一参数：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
}
```

一旦你的包迁移被注册，当执行 `php artisan migrate` 命令时它们将自动运行。你无需将它们导出到应用的 `database/migrations` 目录。

<a name="translations"></a>
### 翻译

如果你的包包含[翻译文件](/docs/{{version}}/localization)，可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的包名为 `courier`，应当在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包翻译使用 `package::file.line` 语法约定来引用。因此，你可以像这样从 `messages` 文件加载 `courier` 包的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

<a name="publishing-translations"></a>
#### 发布翻译

如果你想将包的翻译发布到应用的 `lang/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包路径及其期望发布位置的数组。例如，要发布 `courier` 包的翻译文件，可以这样做：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当包用户执行 Laravel 的 `vendor:publish` Artisan 命令时，包的翻译将被发布到指定的发布位置。

<a name="views"></a>
### 视图

要向 Laravel 注册包的[视图](/docs/{{version}}/views)，你需要告知 Laravel 视图所在的位置。可以使用服务提供者的 `loadViewsFrom` 方法来实现。`loadViewsFrom` 方法接受两个参数：视图模板的路径和包的名称。例如，如果你的包名为 `courier`，应当在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包视图使用 `package::view` 语法约定来引用。因此，一旦视图路径在服务提供者中注册，你就可以像这样从 `courier` 包加载 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

<a name="overriding-package-views"></a>
#### 覆盖包视图

使用 `loadViewsFrom` 方法时，Laravel 实际上为视图注册了两个位置：应用的 `resources/views/vendor` 目录和你指定的目录。以 `courier` 包为例，Laravel 会首先检查开发者是否在 `resources/views/vendor/courier` 目录中放置了自定义版本的视图。然后，如果视图未被自定义，Laravel 会搜索你在 `loadViewsFrom` 调用中指定的包视图目录。这使包用户能够轻松地自定义/覆盖你的包视图。

<a name="publishing-views"></a>
#### 发布视图

如果你想使视图可发布到应用的 `resources/views/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包视图路径及其期望发布位置的数组：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');

    $this->publishes([
        __DIR__.'/../resources/views' => resource_path('views/vendor/courier'),
    ]);
}
```

现在，当包用户执行 Laravel 的 `vendor:publish` Artisan 命令时，包的视图将被复制到指定的发布位置。

<a name="view-components"></a>
### 视图组件

如果你正在构建使用 Blade 组件的包，或将组件放置在非约定目录中，你需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到该组件。你通常应当在包服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册后，可以使用其标签别名来渲染：

```blade
<x-package-alert/>
```

<a name="autoloading-package-components"></a>
#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，`Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，它们位于 `Nightshade\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过供应商命名空间使用 `package-name::` 语法来使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名称转为大驼峰命名来自动检测链接到此组件的类。子目录也支持使用「点」表示法。

<a name="anonymous-components"></a>
#### 匿名组件

如果你的包包含匿名组件，它们必须放置在包「views」目录（由 [`loadViewsFrom` 方法](#views)指定）的 `components` 目录中。然后，你可以通过在组件名称前加上包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

<a name="about-artisan-command"></a>
### "About" Artisan 命令

Laravel 内置的 `about` Artisan 命令提供了应用环境和配置的概要。包可以通过 `AboutCommand` 类向此命令的输出推送额外信息。通常，这些信息可以从包服务提供者的 `boot` 方法中添加：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * 引导应用服务。
 *
 * @return void
 */
public function boot()
{
    AboutCommand::add('My Package', fn () => ['Version' => '1.0.0']);
}
```

<a name="commands"></a>
## 命令

要向 Laravel 注册包的 Artisan 命令，可以使用 `commands` 方法。此方法接受一个命令类名数组。命令注册后，你可以使用 [Artisan CLI](/docs/{{version}}/artisan) 来执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            NetworkCommand::class,
        ]);
    }
}
```

<a name="public-assets"></a>
## 公共资源

你的包可能包含 JavaScript、CSS 和图片等资源。要将这些资源发布到应用的 `public` 目录，请使用服务提供者的 `publishes` 方法。在此示例中，我们还将添加一个 `public` 资源组标签，可用于轻松发布相关资源组：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当包用户执行 `vendor:publish` 命令时，你的资源将被复制到指定的发布位置。由于用户通常需要在每次更新包时覆盖资源，你可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

<a name="publishing-file-groups"></a>
## 发布文件组

你可能希望分别发布包资源和资源组。例如，你可能希望允许用户发布包的配置文件而不强制发布包的资源。你可以通过在从包服务提供者调用 `publishes` 方法时对它们「打标签」来实现。例如，让我们在包服务提供者的 `boot` 方法中使用标签为 `courier` 包定义两个发布组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * 引导包服务。
 *
 * @return void
 */
public function boot()
{
    $this->publishes([
        __DIR__.'/../config/package.php' => config_path('package.php')
    ], 'courier-config');

    $this->publishes([
        __DIR__.'/../database/migrations/' => database_path('migrations')
    ], 'courier-migrations');
}
```

现在，用户可以在执行 `vendor:publish` 命令时通过引用标签来分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```
