# 视图

- [简介](#introduction)
    - [使用 React / Svelte / Vue 编写视图](#writing-views-in-react-svelte-or-vue)
- [创建与渲染视图](#creating-and-rendering-views)
    - [嵌套视图目录](#nested-view-directories)
    - [创建第一个可用视图](#creating-the-first-available-view)
    - [判断视图是否存在](#determining-if-a-view-exists)
- [向视图传递数据](#passing-data-to-views)
    - [与所有视图共享数据](#sharing-data-with-all-views)
- [视图合成器](#view-composers)
    - [视图创建器](#view-creators)
- [优化视图](#optimizing-views)

<a name="introduction"></a>
## 简介

当然，直接从路由和控制器返回完整的 HTML 文档字符串并不现实。幸运的是，视图提供了一种便捷的方式，让我们可以将所有 HTML 放置在独立的文件中。

视图将控制器 / 应用逻辑与展示逻辑分离开来，存放在 `resources/views` 目录中。使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/docs/{{version}}/blade)编写。一个简单的视图可能如下所示：

```blade
<!-- View stored in resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于该视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局 `view` 辅助函数返回它，如下所示：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> [!NOTE]
> 想了解如何编写 Blade 模板的更多信息？请查看完整的 [Blade 文档](/docs/{{version}}/blade)开始学习。

<a name="writing-views-in-react-svelte-or-vue"></a>
### 使用 React / Svelte / Vue 编写视图

许多开发者开始倾向于使用 React、Svelte 或 Vue 编写前端模板，而不是通过 Blade 在 PHP 中编写。得益于 [Inertia](https://inertiajs.com/)，Laravel 让这一切变得轻松自如。Inertia 是一个库，它可以轻松地将你的 React / Svelte / Vue 前端与 Laravel 后端连接起来，而无需构建 SPA 时通常面临的复杂性。

我们的 [React、Svelte 和 Vue 应用入门套件](/docs/{{version}}/starter-kits)为你的下一个由 Inertia 驱动的 Laravel 应用提供了绝佳的起点。

<a name="creating-and-rendering-views"></a>
## 创建与渲染视图

你可以通过以下方式创建视图：在应用的 `resources/views` 目录中放置一个带有 `.blade.php` 扩展名的文件，或使用 `make:view` Artisan 命令：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名告知框架该文件包含一个 [Blade 模板](/docs/{{version}}/blade)。Blade 模板包含 HTML 以及各种 Blade 指令，使你可以轻松地输出值、创建"if"语句、遍历数据等等。

创建视图后，你可以使用全局 `view` 辅助函数从应用的路由或控制器中返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

视图也可以使用 `View` Facade 返回：

```php
use Illuminate\Support\Facades\View;

return View::make('greeting', ['name' => 'James']);
```

如你所见，传递给 `view` 辅助函数的第一个参数对应于 `resources/views` 目录中视图文件的名称。第二个参数是一个数据数组，这些数据将提供给视图使用。在本例中，我们传递了 `name` 变量，它在视图中使用 [Blade 语法](/docs/{{version}}/blade)显示。

<a name="nested-view-directories"></a>
### 嵌套视图目录

视图还可以嵌套在 `resources/views` 目录的子目录中。"点"符号可用于引用嵌套视图。例如，如果你的视图存储在 `resources/views/admin/profile.blade.php`，你可以这样从应用的路由 / 控制器中返回它：

```php
return view('admin.profile', $data);
```

> [!WARNING]
> 视图目录名称不应包含 `.` 字符。

<a name="creating-the-first-available-view"></a>
### 创建第一个可用视图

使用 `View` Facade 的 `first` 方法，你可以创建给定视图数组中存在的第一个视图。如果你的应用或包允许视图被自定义或覆盖，这可能很有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

<a name="determining-if-a-view-exists"></a>
### 判断视图是否存在

如果你需要判断视图是否存在，可以使用 `View` Facade。如果视图存在，`exists` 方法将返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('admin.profile')) {
    // ...
}
```

<a name="passing-data-to-views"></a>
## 向视图传递数据

如前面的示例所示，你可以向视图传递一个数据数组，使这些数据在视图中可用：

```php
return view('greetings', ['name' => 'Victoria']);
```

以这种方式传递信息时，数据应是一个包含键 / 值对的数组。向视图提供数据后，你可以使用数据的键访问视图中的每个值，例如 `<?php echo $name; ?>`。

作为向 `view` 辅助函数传递完整数据数组的替代方案，你可以使用 `with` 方法向视图添加单个数据。`with` 方法返回视图对象的一个实例，因此你可以在返回视图之前继续链式调用方法：

```php
return view('greeting')
    ->with('name', 'Victoria')
    ->with('occupation', 'Astronaut');
```

<a name="sharing-data-with-all-views"></a>
### 与所有视图共享数据

偶尔，你可能需要与应用渲染的所有视图共享数据。你可以使用 `View` Facade 的 `share` 方法做到这一点。通常，你应将 `share` 方法的调用放在服务提供者的 `boot` 方法中。你可以自由地将它们添加到 `App\Providers\AppServiceProvider` 类中，或生成一个单独的服务提供者来容纳它们：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::share('key', 'value');
    }
}
```

<a name="view-composers"></a>
## 视图合成器

视图合成器是视图被渲染时调用的回调或类方法。如果你有希望在每次渲染某视图时绑定到该视图的数据，视图合成器可以帮助你将相关逻辑组织到单一位置。当应用中的多个路由或控制器返回同一个视图，且该视图总是需要特定数据时，视图合成器尤其有用。

通常，视图合成器会在你应用的一个[服务提供者](/docs/{{version}}/providers)中注册。在本示例中，我们假设 `App\Providers\AppServiceProvider` 将容纳此逻辑。

我们将使用 `View` Facade 的 `composer` 方法来注册视图合成器。Laravel 没有为基于类的视图合成器提供默认目录，因此你可以随心所欲地组织它们。例如，你可以创建一个 `app/View/Composers` 目录来容纳应用的所有视图合成器：

```php
<?php

namespace App\Providers;

use App\View\Composers\ProfileComposer;
use Illuminate\Support\Facades;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Using class-based composers...
        Facades\View::composer('profile', ProfileComposer::class);

        // Using closure-based composers...
        Facades\View::composer('welcome', function (View $view) {
            // ...
        });

        Facades\View::composer('dashboard', function (View $view) {
            // ...
        });
    }
}
```

现在我们已经注册了合成器，每次渲染 `profile` 视图时，都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。让我们来看一个合成器类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * Create a new profile composer.
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * Bind data to the view.
     */
    public function compose(View $view): void
    {
        $view->with('count', $this->users->count());
    }
}
```

如你所见，所有视图合成器都通过[服务容器](/docs/{{version}}/container)解析，因此你可以在合成器的构造函数中类型提示所需的任何依赖。

<a name="attaching-a-composer-to-multiple-views"></a>
#### 将合成器附加到多个视图

你可以通过向 `composer` 方法的第一个参数传递视图数组，一次将视图合成器附加到多个视图：

```php
use App\Views\Composers\MultiComposer;
use Illuminate\Support\Facades\View;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法也接受 `*` 字符作为通配符，允许你将合成器附加到所有视图：

```php
use Illuminate\Support\Facades;
use Illuminate\View\View;

Facades\View::composer('*', function (View $view) {
    // ...
});
```

<a name="view-creators"></a>
### 视图创建器

视图"创建器"与视图合成器非常相似；但创建器在视图被实例化后立即执行，而不是等到视图即将渲染时才执行。要注册视图创建器，请使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

<a name="optimizing-views"></a>
## 优化视图

默认情况下，Blade 模板视图会按需编译。当执行渲染视图的请求时，Laravel 会判断是否存在编译后的视图版本。如果文件存在，Laravel 接着会判断未编译的视图是否比编译后的视图修改得更晚。如果编译后的视图不存在，或未编译的视图已被修改，Laravel 会重新编译该视图。

在请求期间编译视图可能会对性能产生轻微负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用使用的所有视图。为了获得更高的性能，你可能希望将此命令作为部署过程的一部分来运行：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令清除视图缓存：

```shell
php artisan view:clear
```
