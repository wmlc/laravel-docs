# 扩展包开发

- [简介](#introduction)
    - [创建扩展包](#creating-a-package)
    - [关于 Facade 的说明](#a-note-on-facades)
- [扩展包发现](#package-discovery)
- [服务提供者](#service-providers)
- [资源](#resources)
    - [配置](#configuration)
    - [路由](#routes)
    - [迁移](#migrations)
    - [语言文件](#language-files)
    - [视图](#views)
    - [视图组件](#view-components)
    - ["About" Artisan 命令](#about-artisan-command)
- [命令](#commands)
    - [优化命令](#optimize-commands)
    - [重载命令](#reload-commands)
- [公共资源](#public-assets)
- [发布文件组](#publishing-file-groups)

<a name="introduction"></a>
## 简介

扩展包是向 Laravel 添加功能的主要方式。扩展包可以是 [Carbon](https://github.com/briannesbitt/Carbon) 这样处理日期的出色工具，也可以是 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary) 这样允许你将文件关联到 Eloquent 模型的扩展包。

扩展包有不同的类型。有些扩展包是独立的，意味着它们可以与任何 PHP 框架配合使用。Carbon 和 Pest 就是独立扩展包的例子。通过在 `composer.json` 文件中引入这些扩展包，就可以在 Laravel 中使用它们。

另一方面，其他扩展包则是专门用于 Laravel 的。这些扩展包可能具有专门用于增强 Laravel 应用的路由、控制器、视图和配置。本指南主要介绍如何开发这些专属于 Laravel 的扩展包。

<a name="creating-a-package"></a>
### 创建扩展包

开始构建新的 Laravel 扩展包最简单的方法是使用官方的 [Laravel 扩展包骨架](https://github.com/laravel/package-skeleton)。该骨架提供了构建 Laravel 扩展包所需的一切，包括服务提供者、通过 Pest 进行的测试、通过 Larastan 进行的静态分析、通过 Pint 进行的代码格式化，以及用于端到端扩展包开发的 workbench 应用。你可以使用 [Laravel 安装器 CLI](/docs/{{version}}/installation#creating-a-laravel-project) 的 `package` 命令创建新的扩展包：

```shell
laravel package my-package
```

一个交互式配置脚本会将骨架个性化到你的扩展包，设置你的命名空间、服务提供者，以及你需要的功能，例如配置文件、路由、视图、翻译、迁移、资源、命令和 Facade。

<a name="a-note-on-facades"></a>
### 关于 Facade 的说明

编写 Laravel 应用时，使用契约还是 Facade 通常并不重要，因为两者提供的可测试性大致相同。但是，编写扩展包时，你的扩展包通常无法访问 Laravel 的所有测试辅助工具。如果你希望像扩展包安装在典型 Laravel 应用中那样编写扩展包测试，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 扩展包。

<a name="package-discovery"></a>
## 扩展包发现

Laravel 应用的 `bootstrap/providers.php` 文件包含应由 Laravel 加载的服务提供者列表。不过，与其要求用户手动将你的服务提供者添加到列表中，你可以在扩展包 `composer.json` 文件的 `extra` 部分中定义提供者，以便它被 Laravel 自动加载。除了服务提供者之外，你还可以列出任何你希望注册的[Facade](/docs/{{version}}/facades)：

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

一旦你的扩展包被配置为可被发现，Laravel 将在其安装时自动注册其服务提供者和 Facade，为扩展包的用户创造便捷的安装体验。

<a name="opting-out-of-package-discovery"></a>
#### 选择退出扩展包发现

如果你是扩展包的使用者，并希望为某个扩展包禁用扩展包发现，可以将该扩展包名称列在应用 `composer.json` 文件的 `extra` 部分中：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以使用应用 `dont-discover` 指令中的 `*` 字符禁用所有扩展包的发现：

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

[服务提供者](/docs/{{version}}/providers)是扩展包与 Laravel 之间的连接点。服务提供者负责将内容绑定到 Laravel 的[服务容器](/docs/{{version}}/container)中，并告知 Laravel 在哪里加载扩展包资源，例如视图、配置和语言文件。

服务提供者继承 `Illuminate\Support\ServiceProvider` 类，并包含两个方法：`register` 和 `boot`。基础的 `ServiceProvider` 类位于 `illuminate/support` Composer 扩展包中，你应将其添加到自己的扩展包依赖中。要了解服务提供者的结构和用途，请查看[它们的文档](/docs/{{version}}/providers)。

<a name="resources"></a>
## 资源

<a name="configuration"></a>
### 配置

通常，你需要将扩展包的配置文件发布到应用的 `config` 目录。这将允许扩展包的用户轻松覆盖你的默认配置选项。要让配置文件可被发布，请在服务提供者的 `boot` 方法中调用 `publishes` 方法：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当扩展包的用户执行 Laravel 的 `vendor:publish` 命令时，你的文件将被复制到指定的发布位置。配置发布后，其值可以像任何其他配置文件一样被访问：

```php
$value = config('courier.option');
```

> [!WARNING]
> 你不应在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，它们无法被正确序列化。

<a name="default-package-configuration"></a>
#### 默认扩展包配置

你还可以将扩展包自身的配置文件与应用已发布的副本合并。这将允许你的用户只在配置文件的已发布副本中定义他们真正想覆盖的选项。要合并配置文件值，请在服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受扩展包配置文件的路径作为第一个参数，接受应用的配置文件副本名称作为第二个参数：

```php
/**
 * Register any package services.
 */
public function register(): void
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> [!WARNING]
> 此方法只合并配置数组的第一层。如果你的用户部分定义了一个多维配置数组，缺失的选项将不会被合并。

<a name="routes"></a>
### 路由

如果你的扩展包包含路由，可以使用 `loadRoutesFrom` 方法加载它们。此方法会自动判断应用的路由是否已缓存，如果路由已被缓存，则不会加载你的路由文件：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

<a name="migrations"></a>
### 迁移

如果你的扩展包包含[数据库迁移](/docs/{{version}}/migrations)，可以使用 `publishesMigrations` 方法告知 Laravel 给定目录或文件包含迁移。当 Laravel 发布迁移时，它会自动更新文件名中的时间戳，以反映当前日期和时间：

```php
/**
 * Bootstrap any package services.
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

如果你的扩展包包含[语言文件](/docs/{{version}}/localization)，可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的扩展包名为 `courier`，你应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

扩展包的翻译行使用 `package::file.line` 语法约定引用。因此，你可以像这样从 `messages` 文件加载 `courier` 扩展包的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

你可以使用 `loadJsonTranslationsFrom` 方法为扩展包注册 JSON 翻译文件。此方法接受包含扩展包 JSON 翻译文件的目录路径：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

<a name="publishing-language-files"></a>
#### 发布语言文件

如果你想将扩展包的语言文件发布到应用的 `lang/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个扩展包路径及其目标发布位置的数组。例如，要发布 `courier` 扩展包的语言文件，可以这样做：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当扩展包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的扩展包语言文件将被发布到指定的发布位置。

<a name="views"></a>
### 视图

要向 Laravel 注册扩展包的[视图](/docs/{{version}}/views)，你需要告知 Laravel 视图的位置。你可以使用服务提供者的 `loadViewsFrom` 方法做到这一点。`loadViewsFrom` 方法接受两个参数：视图模板的路径和扩展包的名称。例如，如果你的扩展包名为 `courier`，你应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

扩展包视图使用 `package::view` 语法约定引用。因此，一旦你的视图路径在服务提供者中注册，就可以像这样加载 `courier` 扩展包的 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

<a name="overriding-package-views"></a>
#### 覆盖扩展包视图

使用 `loadViewsFrom` 方法时，Laravel 实际上会为你的视图注册两个位置：应用的 `resources/views/vendor` 目录和你指定的目录。因此，以 `courier` 扩展包为例，Laravel 将首先检查开发者是否在 `resources/views/vendor/courier` 目录中放置了视图的自定义版本。然后，如果视图未被自定义，Laravel 将搜索你在 `loadViewsFrom` 调用中指定的扩展包视图目录。这使得扩展包用户可以轻松自定义 / 覆盖扩展包的视图。

<a name="publishing-views"></a>
#### 发布视图

如果你希望让视图可以发布到应用的 `resources/views/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受扩展包视图路径及其目标发布位置的数组：

```php
/**
 * Bootstrap the package services.
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');

    $this->publishes([
        __DIR__.'/../resources/views' => resource_path('views/vendor/courier'),
    ]);
}
```

现在，当扩展包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的扩展包视图将被复制到指定的发布位置。

<a name="view-components"></a>
### 视图组件

如果你正在构建一个使用 Blade 组件或将组件放在非约定俗成目录中的扩展包，你需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到组件。你通常应在扩展包服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * Bootstrap your package's services.
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册后，可以使用其标签别名渲染它：

```blade
<x-package-alert/>
```

<a name="autoloading-package-components"></a>
#### 自动加载扩展包组件

另外，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 扩展包可能拥有位于 `Nightshade\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * Bootstrap your package's services.
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过 `package-name::` 语法、使用供应商命名空间来使用扩展包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将通过将组件名称转为 Pascal 大小写来自动检测与该组件关联的类。子目录也可以使用"点"符号。

<a name="anonymous-components"></a>
#### 匿名组件

如果你的扩展包包含匿名组件，它们必须放置在扩展包"视图"目录（由 [loadViewsFrom 方法](#views) 指定）的 `components` 目录中。然后，你可以通过在组件名称前加上扩展包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

<a name="about-artisan-command"></a>
### "About" Artisan 命令

Laravel 内置的 `about` Artisan 命令提供应用环境和配置的概要。扩展包可以通过 `AboutCommand` 类向该命令的输出推送额外信息。通常，此信息可以从扩展包服务提供者的 `boot` 方法中添加：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    AboutCommand::add('My Package', fn () => ['Version' => '1.0.0']);
}
```

<a name="commands"></a>
## 命令

要向 Laravel 注册扩展包的 Artisan 命令，可以使用 `commands` 方法。此方法期望一个命令类名数组。命令注册后，你可以使用 [Artisan CLI](/docs/{{version}}/artisan) 执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * Bootstrap any package services.
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

Laravel 的[优化命令](/docs/{{version}}/deployment#optimization)会缓存应用的配置、事件、路由和视图。使用 `optimizes` 方法，你可以注册扩展包自身的 Artisan 命令，这些命令应在执行 `optimize` 和 `optimize:clear` 命令时被调用：

```php
/**
 * Bootstrap any package services.
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

Laravel 的[重载命令](/docs/{{version}}/deployment#reloading-services)会终止任何正在运行的服务，以便它们能被系统进程监视器自动重启。使用 `reloads` 方法，你可以注册扩展包自身的 Artisan 命令，这些命令应在执行 `reload` 命令时被调用：

```php
/**
 * Bootstrap any package services.
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

你的扩展包可能拥有 JavaScript、CSS 和图片等资源。要将这些资源发布到应用的 `public` 目录，可以使用服务提供者的 `publishes` 方法。在此示例中，我们还将添加一个 `public` 资源组标签，它可以用于轻松地发布一组相关资源：

```php
/**
 * Bootstrap any package services.
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当扩展包的用户执行 `vendor:publish` 命令时，你的资源将被复制到指定的发布位置。由于用户通常需要在每次扩展包更新时覆盖资源，他们可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

<a name="publishing-file-groups"></a>
## 发布文件组

你可能希望分别发布扩展包的资源和文件组。例如，你可能希望允许用户发布扩展包的配置文件，而不强制发布扩展包的资源。你可以通过在扩展包服务提供者中调用 `publishes` 方法时对它们进行"标记"来实现这一点。例如，让我们使用标签在扩展包服务提供者的 `boot` 方法中为 `courier` 扩展包定义两个发布组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * Bootstrap any package services.
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

现在，你的用户可以在执行 `vendor:publish` 命令时通过引用标签来分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```

你的用户还可以使用 `--provider` 标志发布扩展包服务提供者定义的所有可发布文件：

```shell
php artisan vendor:publish --provider="Your\Package\ServiceProvider"
```
