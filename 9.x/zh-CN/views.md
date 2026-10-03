# 视图

- [简介](#introduction)
    - [在 React / Vue 中编写视图](#writing-views-in-react-or-vue)
- [创建与渲染视图](#creating-and-rendering-views)
    - [嵌套视图目录](#nested-view-directories)
    - [创建第一个可用视图](#creating-the-first-available-view)
    - [判断视图是否存在](#determining-if-a-view-exists)
- [向视图传递数据](#passing-data-to-views)
    - [与所有视图共享数据](#sharing-data-with-all-views)
- [视图组合器](#view-composers)
    - [视图创建器](#view-creators)
- [优化视图](#optimizing-views)

<a name="introduction"></a>
## 简介

当然，直接从路由和控制器返回整个 HTML 文档字符串并不实际。幸好，视图提供了一种便捷的方式，将所有 HTML 放置在单独的文件中。

视图将控制器/应用程序逻辑与展示逻辑分离，并存储在 `resources/views` 目录中。使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/docs/{{version}}/blade)编写。一个简单的视图可能如下所示：

```blade
<!-- 视图存储在 resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于此视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局 `view` 助手函数返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> **Note**  
> 想了解更多关于如何编写 Blade 模板的信息？查看完整的 [Blade 文档](/docs/{{version}}/blade)来入门。

<a name="writing-views-in-react-or-vue"></a>
### 在 React / Vue 中编写视图

许多开发者不再使用 PHP 通过 Blade 编写前端模板，而是开始倾向于使用 React 或 Vue 编写模板。得益于 [Inertia](https://inertiajs.com/)，Laravel 让这一切变得轻松。Inertia 是一个库，可以轻松地将 React / Vue 前端与 Laravel 后端结合，无需构建 SPA 的常见复杂性。

我们的 Breeze 和 Jetstream [入门套件](/docs/{{version}}/starter-kits)为下一个基于 Inertia 的 Laravel 应用程序提供了很好的起点。此外，[Laravel Bootcamp](https://bootcamp.laravel.com) 提供了构建基于 Inertia 的 Laravel 应用程序的完整演示，包括 Vue 和 React 的示例。

<a name="creating-and-rendering-views"></a>
## 创建与渲染视图

可以通过在应用程序的 `resources/views` 目录中放置一个 `.blade.php` 扩展名的文件来创建视图。`.blade.php` 扩展名告知框架该文件包含 [Blade 模板](/docs/{{version}}/blade)。Blade 模板包含 HTML 以及 Blade 指令，允许你轻松输出值、创建"if"语句、遍历数据等。

创建视图后，可以使用全局 `view` 助手函数从应用程序的路由或控制器返回它：

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

如你所见，传递给 `view` 助手函数的第一个参数对应 `resources/views` 目录中视图文件的名称。第二个参数是应提供给视图的数据数组。在本例中，我们传递了 `name` 变量，它使用 [Blade 语法](/docs/{{version}}/blade)在视图中显示。

<a name="nested-view-directories"></a>
### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。可以使用"点"符号引用嵌套视图。例如，如果视图存储在 `resources/views/admin/profile.blade.php`，可以从应用程序的路由/控制器中返回它：

```php
return view('admin.profile', $data);
```

> **Warning**  
> 视图目录名不应包含 `.` 字符。

<a name="creating-the-first-available-view"></a>
### 创建第一个可用视图

使用 `View` Facade 的 `first` 方法，可以创建给定视图数组中第一个存在的视图。这在应用程序或包允许自定义或覆盖视图时非常有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

<a name="determining-if-a-view-exists"></a>
### 判断视图是否存在

如果需要判断视图是否存在，可以使用 `View` Facade。如果视图存在，`exists` 方法将返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('emails.customer')) {
    //
}
```

<a name="passing-data-to-views"></a>
## 向视图传递数据

如前面的示例所示，可以将数据数组传递给视图，使这些数据在视图中可用：

```php
return view('greetings', ['name' => 'Victoria']);
```

以这种方式传递信息时，数据应为键/值对数组。将数据提供给视图后，可以在视图中使用数据的键来访问每个值，例如 `<?php echo $name; ?>`。

除了将完整的数据数组传递给 `view` 助手函数外，还可以使用 `with` 方法向视图添加单个数据片段。`with` 方法返回视图对象实例，因此可以在返回视图之前继续链式调用方法：

```php
return view('greeting')
            ->with('name', 'Victoria')
            ->with('occupation', 'Astronaut');
```

<a name="sharing-data-with-all-views"></a>
### 与所有视图共享数据

有时，你可能需要与应用程序渲染的所有视图共享数据。可以使用 `View` Facade 的 `share` 方法来实现。通常，应在服务提供者（Service Provider）的 `boot` 方法中调用 `share` 方法。你可以将其添加到 `App\Providers\AppServiceProvider` 类中，或生成一个单独的服务提供者来存放它们：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导任何应用程序服务。
     *
     * @return void
     */
    public function boot()
    {
        View::share('key', 'value');
    }
}
```

<a name="view-composers"></a>
## 视图组合器

视图组合器是渲染视图时调用的回调或类方法。如果你有数据想在每次渲染视图时绑定到该视图，视图组合器可以将该逻辑组织到单个位置。如果同一个视图由应用程序中的多个路由或控制器返回，且始终需要特定数据片段，视图组合器尤其有用。

通常，视图组合器将在应用程序的[服务提供者](/docs/{{version}}/providers)中注册。在本例中，我们假设已创建了一个新的 `App\Providers\ViewServiceProvider` 来存放此逻辑。

我们将使用 `View` Facade 的 `composer` 方法注册视图组合器。Laravel 不包含基于类的视图组合器的默认目录，因此你可以随意组织它们。例如，可以创建一个 `app/View/Composers` 目录来存放应用程序的所有视图组合器：

```php
<?php

namespace App\Providers;

use App\View\Composers\ProfileComposer;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ViewServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导任何应用程序服务。
     *
     * @return void
     */
    public function boot()
    {
        // 使用基于类的组合器...
        View::composer('profile', ProfileComposer::class);

        // 使用基于闭包的组合器...
        View::composer('dashboard', function ($view) {
            //
        });
    }
}
```

> **Warning**  
> 请记住，如果创建了一个新的服务提供者来包含视图组合器注册，需要将该服务提供者添加到 `config/app.php` 配置文件的 `providers` 数组中。

现在我们已经注册了组合器，每次渲染 `profile` 视图时都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。让我们看看组合器类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * 用户仓库实现。
     *
     * @var \App\Repositories\UserRepository
     */
    protected $users;

    /**
     * 创建一个新的个人资料组合器。
     *
     * @param  \App\Repositories\UserRepository  $users
     * @return void
     */
    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    /**
     * 将数据绑定到视图。
     *
     * @param  \Illuminate\View\View  $view
     * @return void
     */
    public function compose(View $view)
    {
        $view->with('count', $this->users->count());
    }
}
```

如你所见，所有视图组合器都通过[服务容器](/docs/{{version}}/container)解析，因此你可以在组合器的构造函数中类型提示所需的任何依赖。

<a name="attaching-a-composer-to-multiple-views"></a>
#### 将组合器附加到多个视图

可以通过将视图数组作为第一个参数传递给 `composer` 方法，一次性将视图组合器附加到多个视图：

```php
use App\Views\Composers\MultiComposer;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法还接受 `*` 字符作为通配符，允许你将组合器附加到所有视图：

```php
View::composer('*', function ($view) {
    //
});
```

<a name="view-creators"></a>
### 视图创建器

视图"创建器"与视图组合器非常相似；但是，它们在视图实例化后立即执行，而不是等到视图即将渲染时。要注册视图创建器，使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

<a name="optimizing-views"></a>
## 优化视图

默认情况下，Blade 模板视图按需编译。当执行渲染视图的请求时，Laravel 会判断已编译版本的视图是否存在。如果文件存在，Laravel 会进一步判断未编译视图是否比已编译视图修改得更近。如果已编译视图不存在，或未编译视图已被修改，Laravel 将重新编译视图。

在请求期间编译视图可能对性能有轻微的负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用程序使用的所有视图。为提高性能，你可以将此命令作为部署过程的一部分运行：

```shell
php artisan view:cache
```

可以使用 `view:clear` 命令清除视图缓存：

```shell
php artisan view:clear
```
