# 扩展包开发

## 简介

包（Package）是为 Laravel 添加功能的主要方式。包可以是诸如 [Carbon](https://github.com/briannesbitt/Carbon) 这样处理日期的优秀工具，也可以是像 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary) 这样能将文件关联到 Eloquent 模型的包。

包有不同的类型。有些包是独立（stand-alone）的，意味着它们可以与任何 PHP 框架配合使用。Carbon 和 Pest 就是独立包的示例。你可以在 `composer.json` 文件中引入这些包，从而与 Laravel 配合使用。

另一方面，其他包是专为与 Laravel 配合使用而设计的。这些包可能拥有专为增强 Laravel 应用而设计的路由、控制器、视图和配置。本指南主要介绍这类 Laravel 专属包的开发。

### 创建扩展包

构建新 Laravel 包最简单的方式是使用官方的 [Laravel package skeleton](https://github.com/laravel/package-skeleton)（Laravel 包骨架）。该骨架提供了构建 Laravel 包所需的一切，包括一个服务提供者（Service Provider）、通过 Pest 进行的测试、通过 Larastan 进行的静态分析、通过 Pint 进行的代码格式化，以及一个用于端到端包开发的 workbench 应用。你可以使用 [Laravel installer CLI](/docs/{{version}}/installation#creating-a-laravel-project) 的 `package` 命令创建一个新包：

```shell
laravel package my-package
```

一个交互式配置脚本会为你的包个性化定制骨架，设置命名空间、服务提供者（Service Provider），并且只包含你需要的功能，例如配置文件、路由、视图、翻译、迁移、资源、命令和 Facade。

### 关于 Facade 的说明

在编写 Laravel 应用时，使用契约（contracts）还是 Facade 通常并不重要，因为两者提供的可测试性基本相当。但是，在编写包时，你的包通常无法访问 Laravel 的所有测试辅助函数。如果你希望像包被安装在典型的 Laravel 应用内部那样编写包测试，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

## 扩展包自动发现

Laravel 应用的 `bootstrap/providers.php` 文件包含应由 Laravel 加载的服务提供者（Service Provider）列表。但是，你无需要求用户手动将你的服务提供者（Service Provider）添加到列表中，而是可以在包的 `composer.json` 文件的 `extra` 部分定义该提供者（Service Provider），从而让 Laravel 自动加载它。除了服务提供者（Service Provider），你还可以列出希望注册的所有 [Facade](/docs/{{version}}/facades)：

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

一旦你的包配置为可被发现，Laravel 会在安装时自动注册它的服务提供者（Service Provider）和 Facade，为你的包用户带来便捷的安装体验。

#### 退出扩展包自动发现

如果你是某个包的使用者，并且希望为某个包禁用包发现，可以在应用 `composer.json` 文件的 `extra` 部分列出包名：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以使用应用 `dont-discover` 指令中的 `*` 字符为所有包禁用包发现：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "*"
        ]
    }
},
```

## 服务提供者

服务提供者（Service Provider）是连接你的包与 Laravel 的桥梁。服务提供者（Service Provider）负责将内容绑定到 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)中，并告知 Laravel 从何处加载包资源，例如视图、配置和语言文件。

服务提供者（Service Provider）继承自 `Illuminate\Support\ServiceProvider` 类，并包含两个方法：`register` 和 `boot`。基础的 `ServiceProvider` 类位于 `illuminate/support` Composer 包中，你应当将其添加到你自己包的依赖中。要了解有关服务提供者（Service Provider）结构和用途的更多信息，请查看[它们的文档](/docs/{{version}}/providers)。

## 资源

### 配置

通常，你需要将包的配置文件发布到应用的 `config` 目录。这样你将允许包的用户轻松覆盖你的默认配置项。要允许发布你的配置文件，请从服务提供者（Service Provider）的 `boot` 方法中调用 `publishes` 方法：

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

现在，当你的包用户执行 Laravel 的 `vendor:publish` 命令时，你的文件将被复制到指定的发布位置。一旦你的配置被发布，就可以像其他配置文件一样访问它的值：

```php
$value = config('courier.option');
```

> [!WARNING]
> 你不应在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，它们无法被正确序列化。

#### 默认扩展包配置

你还可以将自己的包配置文件与应用已发布的副本合并。这将允许你的用户只在已发布的配置副本中定义他们实际想要覆盖的选项。要合并配置文件的值，请在服务提供者（Service Provider）的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受你的包配置文件的路径作为第一个参数，接受应用配置副本的名称作为第二个参数：

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
> 该方法只合并配置数组的第一层。如果你的用户部分定义了多维配置数组，缺失的选项将不会被合并。

### 路由

如果你的包包含路由，可以使用 `loadRoutesFrom` 方法加载它们。该方法会自动判断应用的路由是否已缓存；如果路由已被缓存，则不会加载你的路由文件：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

### 数据库迁移

如果你的包包含[数据库迁移（migration）](/docs/{{version}}/migrations)，可以使用 `publishesMigrations` 方法告知 Laravel 给定目录或文件包含迁移。当 Laravel 发布迁移时，它会自动更新文件名中的时间戳以反映当前日期和时间：

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

### 语言文件

如果你的包包含[语言文件](/docs/{{version}}/localization)，可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的包名为 `courier`，你应当在该包的服务提供者（Service Provider）的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包翻译行使用 `package::file.line` 语法约定来引用。因此，你可以像下面这样从 `messages` 文件加载 `courier` 包的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

你可以使用 `loadJsonTranslationsFrom` 方法为包注册 JSON 翻译文件。该方法接受包含包 JSON 翻译文件的目录路径：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

#### 发布语言文件

如果你希望将包的语言文件发布到应用的 `lang/vendor` 目录，可以使用服务提供者（Service Provider）的 `publishes` 方法。`publishes` 方法接受一组包路径及其期望的发布位置。例如，要发布 `courier` 包的语言文件，可以这样做：

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

现在，当你的包用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的包语言文件将被发布到指定的发布位置。

### 视图

要向 Laravel 注册你的包的[视图](/docs/{{version}}/views)，你需要告知 Laravel 视图所在的位置。可以使用服务提供者（Service Provider）的 `loadViewsFrom` 方法完成。 `loadViewsFrom` 方法接受两个参数：视图模板的路径和你的包名。例如，如果你的包名是 `courier`，你会向该包的服务提供者（Service Provider）的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任意包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包视图使用 `package::view` 语法约定来引用。因此，一旦你的视图路径在服务提供者（Service Provider）中注册，就可以像下面这样从 `courier` 包加载 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

#### 覆盖扩展包视图

当你使用 `loadViewsFrom` 方法时，Laravel 实际上为你的视图注册了两个位置：应用的 `resources/views/vendor` 目录和你指定的目录。因此，以 `courier` 包为例，Laravel 会首先检查开发者是否已将一个自定义的视图版本放置在 `resources/views/vendor/courier` 目录中。然后，如果视图尚未被自定义，Laravel 会搜索你在调用 `loadViewsFrom` 时指定的包视图目录。这样可以让包用户轻松自定义/覆盖你的包视图。

#### 发布视图

如果你希望将视图发布到应用的 `resources/views/vendor` 目录中，可以使用服务提供者（Service Provider）的 `publishes` 方法。`publishes` 方法接受一组包视图路径及其期望的发布位置：

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

现在，当你的包用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的包视图将被复制到指定的发布位置。

### 视图组件

如果你正在构建一个使用 Blade 组件的包，或者将组件放置在非传统目录中，你需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道去哪里查找该组件。通常，你应当在包的服务提供者（Service Provider）的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导你的包服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册后，就可以使用其标签别名渲染：

```blade
<x-package-alert/>
```

#### 自动加载扩展包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个名为 `Nightshade` 的包可能拥有位于 `Nightshade\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许使用 `package-name::` 语法按供应商命名空间使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过 Pascal 命名法（pascal-casing）转换组件名来自动检测链接到该组件的类。还支持使用"点"记法的子目录。

#### 匿名组件

如果你的包包含匿名组件，它们必须放置在包的"视图"目录（由 [loadViewsFrom 方法](#views) 指定）的 `components` 目录中。然后，你可以通过在组件名前加上包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

### "About" Artisan Command

Laravel 内置的 `about` Artisan 命令提供应用环境和配置的概要信息。包可以通过 `AboutCommand` 类向该命令的输出推送额外信息。通常，可以从包的服务提供者（Service Provider）的 `boot` 方法中添加此信息：

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

## 命令

要向 Laravel 注册包的 Artisan 命令，可以使用 `commands` 方法。该方法接受一组命令类名。命令注册后，你就可以使用 [Artisan CLI](/docs/{{version}}/artisan) 执行它们：

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

### 优化命令

Laravel 的 [optimize 命令](/docs/{{version}}/deployment#optimization) 会缓存应用的配置、事件、路由和视图。使用 `optimizes` 方法，你可以注册包自身的 Artisan 命令，这些命令应在执行 `optimize` 和 `optimize:clear` 命令时被调用：

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

### 重载命令

Laravel 的 [reload 命令](/docs/{{version}}/deployment#reloading-services) 会终止任何正在运行的服务，以便系统进程监视器可以自动重启它们。使用 `reloads` 方法，你可以注册包自身的 Artisan 命令，这些命令应在执行 `reload` 命令时被调用：

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

## 公共资源

你的包可能拥有 JavaScript、CSS 和图片等资源。要将这些资源发布到应用的 `public` 目录，请使用服务提供者（Service Provider）的 `publishes` 方法。在此示例中，我们还会添加一个 `public` 资源组标签，可用于轻松发布相关资源组：

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

现在，当你的包用户执行 `vendor:publish` 命令时，你的资源将被复制到指定的发布位置。由于用户通常需要在每次包更新时覆盖这些资源，他们可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

## 发布文件组

你可能希望分别发布包资源与资源的分组。例如，你可能希望允许用户发布包的配置文件，而无需被迫发布包的资源。你可以通过在从包的服务提供者（Service Provider）调用 `publishes` 方法时为它们"打标签"来实现。例如，让我们在包的服务提供者（Service Provider）的 `boot` 方法中使用标签为 `courier` 包定义两个发布组（`courier-config` 和 `courier-migrations`）：

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

现在你的用户可以通过在执行 `vendor:publish` 命令时引用标签来分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```

你的用户也可以使用 `--provider` 标志发布由包的服务提供者（Service Provider）定义的所有可发布文件：

```shell
php artisan vendor:publish --provider="Your\Package\ServiceProvider"
```
