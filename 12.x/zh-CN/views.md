# 视图

- [简介](#introduction)
    - [使用 React / Svelte / Vue 编写视图](#writing-views-in-react-svelte-or-vue)
- [创建与渲染视图](#creating-and-rendering-views)
    - [嵌套视图目录](#nested-view-directories)
    - [创建第一个存在的视图](#creating-the-first-available-view)
    - [判断视图是否存在](#determining-if-a-view-exists)
- [向视图传递数据](#passing-data-to-views)
    - [与所有视图共享数据](#sharing-data-with-all-views)
- [视图 Composer](#view-composers)
    - [视图 Creator](#view-creators)
- [优化视图](#optimizing-views)

<a name="introduction"></a>
## 简介

当然，直接从路由和控制器返回整个 HTML 文档字符串并不实用。好在，视图提供了一种便捷方式，让我们把所有 HTML 放在独立的文件中。

视图将你的控制器／应用逻辑与展示逻辑分离开来，存储在 `resources/views` 目录中。使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/docs/{{version}}/blade)编写。一个简单的视图可能如下所示：

```blade
<!-- 视图存储在 resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于该视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局 `view` 辅助函数来返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> [!NOTE]
> 想了解更多关于如何编写 Blade 模板的信息？请查阅完整的 [Blade 文档](/docs/{{version}}/blade)快速上手。

<a name="writing-views-in-react-svelte-or-vue"></a>
### 使用 React / Svelte / Vue 编写视图

许多开发者不再通过 Blade 用 PHP 编写前端模板，而是开始倾向于使用 React、Svelte 或 Vue 来编写模板。得益于 [Inertia](https://inertiajs.com/)，Laravel 让这一切变得轻松自如。Inertia 是一个库，它可以让你轻松地将 React / Svelte / Vue 前端与 Laravel 后端结合，而无需承担构建 SPA 的常见复杂度。

我们的 [React、Svelte 和 Vue 应用入门套件](/docs/{{version}}/starter-kits)为你打造下一个由 Inertia 驱动的 Laravel 应用提供了绝佳起点。

<a name="creating-and-rendering-views"></a>
## 创建与渲染视图

你可以在应用的 `resources/views` 目录中放置一个带 `.blade.php` 扩展名的文件来创建视图，也可以使用 `make:view` Artisan 命令来创建：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名告知框架该文件包含 [Blade 模板](/docs/{{version}}/blade)。Blade 模板包含 HTML 以及 Blade 指令，让你能够轻松地输出值、创建 "if" 语句、迭代数据等。

创建视图后，你可以使用全局 `view` 辅助函数从应用的路由或控制器中返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

也可以使用 `View` Facade 返回视图：

```php
use Illuminate\Support\Facades\View;

return View::make('greeting', ['name' => 'James']);
```

如你所见，传递给 `view` 辅助函数的第一个参数对应 `resources/views` 目录中视图文件的名称。第二个参数是一个数组，其中包含需要提供给视图的数据。在本例中，我们传递了 `name` 变量，并在视图中使用 [Blade 语法](/docs/{{version}}/blade)将其显示出来。

<a name="nested-view-directories"></a>
### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。可以使用「点」记法来引用嵌套视图。例如，如果你的视图存储在 `resources/views/admin/profile.blade.php`，可以这样从应用的路由／控制器中返回它：

```php
return view('admin.profile', $data);
```

> [!WARNING]
> 视图目录名不应包含 `.` 字符。

<a name="creating-the-first-available-view"></a>
### 创建第一个存在的视图

使用 `View` Facade 的 `first` 方法，你可以创建给定视图数组中第一个存在的视图。如果你的应用或软件包允许自定义或覆盖视图，这一功能可能会很有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

<a name="determining-if-a-view-exists"></a>
### 判断视图是否存在

如果需要判断某个视图是否存在，可以使用 `View` Facade。如果视图存在，`exists` 方法将返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('admin.profile')) {
    // ...
}
```

<a name="passing-data-to-views"></a>
## 向视图传递数据

正如前面的示例所示，你可以向视图传递一个数据数组，使这些数据在视图中可用：

```php
return view('greetings', ['name' => 'Victoria']);
```

以这种方式传递信息时，数据应当是一个包含键／值对的数组。向视图提供数据后，你就可以在视图中使用数据的键来访问各个值，例如 `<?php echo $name; ?>`。

除了向 `view` 辅助函数传递完整的数据数组之外，你还可以使用 `with` 方法向视图添加单个数据。`with` 方法会返回视图对象的实例，这样你就可以在返回视图之前继续链式调用其他方法：

```php
return view('greeting')
    ->with('name', 'Victoria')
    ->with('occupation', 'Astronaut');
```

<a name="sharing-data-with-all-views"></a>
### 与所有视图共享数据

有时，你可能需要在应用渲染的所有视图之间共享数据。你可以使用 `View` Facade 的 `share` 方法来实现。通常，你应当在服务提供者（Service Provider）的 `boot` 方法中调用 `share` 方法。你可以将它们添加到 `App\Providers\AppServiceProvider` 类中，也可以生成一个单独的服务提供者来存放它们：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        View::share('key', 'value');
    }
}
```

<a name="view-composers"></a>
## 视图 Composer

视图 Composer 是在视图渲染时被调用的回调或类方法。如果你有某些数据需要在每次渲染某个视图时绑定到该视图，视图 Composer 可以帮你把这些逻辑组织到单一位置。当应用中的多个路由或控制器返回同一个视图，并且该视图总是需要某项特定数据时，视图 Composer 会显得特别有用。

通常，视图 Composer 会在应用的某个[服务提供者](/docs/{{version}}/providers)中注册。在本例中，我们假定 `App\Providers\AppServiceProvider` 将承载这一逻辑。

我们将使用 `View` Facade 的 `composer` 方法来注册视图 Composer。Laravel 没有为基于类的视图 Composer 提供默认目录，因此你可以随意组织它们。例如，你可以创建一个 `app/View/Composers` 目录来存放应用的所有视图 Composer：

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
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        // 使用基于类的 Composer...
        Facades\View::composer('profile', ProfileComposer::class);

        // 使用基于闭包的 Composer...
        Facades\View::composer('welcome', function (View $view) {
            // ...
        });

        Facades\View::composer('dashboard', function (View $view) {
            // ...
        });
    }
}
```

注册 Composer 之后，每次渲染 `profile` 视图时都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。下面我们来看一个 Composer 类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * 创建新的 Profile Composer。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * 将数据绑定到视图。
     */
    public function compose(View $view): void
    {
        $view->with('count', $this->users->count());
    }
}
```

如你所见，所有视图 Composer 都是通过[服务容器](/docs/{{version}}/container)解析的，因此你可以在 Composer 的构造函数中对所需的任何依赖进行类型提示。

<a name="attaching-a-composer-to-multiple-views"></a>
#### 将 Composer 附加到多个视图

你可以将一个视图数组作为第一个参数传递给 `composer` 方法，从而将视图 Composer 一次性附加到多个视图：

```php
use App\Views\Composers\MultiComposer;
use Illuminate\Support\Facades\View;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法还接受 `*` 字符作为通配符，允许你将 Composer 附加到所有视图：

```php
use Illuminate\Support\Facades;
use Illuminate\View\View;

Facades\View::composer('*', function (View $view) {
    // ...
});
```

<a name="view-creators"></a>
### 视图 Creator

视图「Creator」与视图 Composer 十分相似；不过，它们在视图实例化之后立即执行，而不用等到视图即将渲染时。要注册视图 Creator，请使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

<a name="optimizing-views"></a>
## 优化视图

默认情况下，Blade 模板视图按需编译。当执行渲染视图的请求时，Laravel 会判断已编译版本的视图是否存在。如果文件存在，Laravel 接着会判断未编译视图是否比已编译视图更近被修改过。如果已编译视图不存在，或者未编译视图被修改过，Laravel 就会重新编译该视图。

在请求期间编译视图可能对性能有轻微的负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用使用的所有视图。为了提升性能，你可以将此命令作为部署流程的一部分来运行：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令来清除视图缓存：

```shell
php artisan view:clear
```
