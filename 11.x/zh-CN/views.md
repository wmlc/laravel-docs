# 视图

- [简介](#introduction)
    - [使用 React / Vue 编写视图](#writing-views-in-react-or-vue)
- [创建与渲染视图](#creating-and-rendering-views)
    - [嵌套视图目录](#nested-view-directories)
    - [创建第一个可用的视图](#creating-the-first-available-view)
    - [判断视图是否存在](#determining-if-a-view-exists)
- [向视图传递数据](#passing-data-to-views)
    - [与所有视图共享数据](#sharing-data-with-all-views)
- [视图 composers](#view-composers)
    - [视图 creators](#view-creators)
- [优化视图](#optimizing-views)

<a name="introduction"></a>
## 简介

当然，直接从路由和控制器返回完整的 HTML 文档字符串并不现实。幸运的是，视图提供了一种方便的方式，把我们的全部 HTML 放在单独的文件中。

视图把控制器 / 应用逻辑与展示逻辑分离，并存放在 `resources/views` 目录中。在 Laravel 中，视图模板通常使用 [Blade 模板语言](/docs/{{version}}/blade)编写。一个简单的视图可能如下所示：

```blade
<!-- 视图存放在 resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于该视图存放在 `resources/views/greeting.blade.php`，我们可以这样使用全局的 `view` 辅助方法返回它：

    Route::get('/', function () {
        return view('greeting', ['name' => 'James']);
    });

> [!NOTE]
> 想了解更多关于编写 Blade 模板的信息？请查阅完整的 [Blade 文档](/docs/{{version}}/blade)开始学习。

<a name="writing-views-in-react-or-vue"></a>
### 使用 React / Vue 编写视图

许多开发者不再用 PHP 通过 Blade 编写前端模板，而更喜欢使用 React 或 Vue 编写模板。Laravel 通过 [Inertia](https://inertiajs.com/) 让这件事变得轻松：它让你可以毫不费力地把自己的 React / Vue 前端连接到 Laravel 后端，无需承担构建 SPA 的各种典型复杂问题。

我们的 Breeze 和 Jetstream [入门套件](/docs/{{version}}/starter-kits)为你由 Inertia 驱动的下一个 Laravel 应用提供了很好的起点。此外，[Laravel Bootcamp](https://bootcamp.laravel.com)提供了构建由 Inertia 驱动的 Laravel 应用的完整演示，其中包含 Vue 和 React 的示例。

<a name="creating-and-rendering-views"></a>
## 创建与渲染视图

你可以在应用的 `resources/views` 目录中放入一个扩展名为 `.blade.php` 的文件来创建视图，也可以使用 `make:view` Artisan 命令：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名告诉框架该文件包含一个 [Blade 模板](/docs/{{version}}/blade)。Blade 模板除 HTML 外还包含 Blade 指令，方便你轻松输出值、编写"if"语句、遍历数据等等。

创建视图后，你可以使用全局的 `view` 辅助方法从应用的某个路由或控制器返回它：

    Route::get('/', function () {
        return view('greeting', ['name' => 'James']);
    });

你也可以使用 `View` Facade 返回视图：

    use Illuminate\Support\Facades\View;

    return View::make('greeting', ['name' => 'James']);

如你所见，传给 `view` 辅助方法的第一个参数对应 `resources/views` 目录中的视图文件名。第二个参数是应提供给该视图的数据数组。在这个例子中，我们传入 `name` 变量，并在视图中通过 [Blade 语法](/docs/{{version}}/blade)显示它。

<a name="nested-view-directories"></a>
### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。可以使用"点"语法引用嵌套视图。例如，如果你的视图存放在 `resources/views/admin/profile.blade.php`，可以这样从应用的某个路由 / 控制器返回它：

    return view('admin.profile', $data);

> [!WARNING]
> 视图目录名不应包含 `.` 字符。

<a name="creating-the-first-available-view"></a>
### 创建第一个可用的视图

使用 `View` Facade 的 `first` 方法，你可以创建给定视图数组中第一个存在的视图。如果你的应用或包允许视图被自定义或覆盖，这会很有用：

    use Illuminate\Support\Facades\View;

    return View::first(['custom.admin', 'admin'], $data);

<a name="determining-if-a-view-exists"></a>
### 判断视图是否存在

如果你需要判断某个视图是否存在，可以使用 `View` Facade。`exists` 方法在视图存在时返回 `true`：

    use Illuminate\Support\Facades\View;

    if (View::exists('admin.profile')) {
        // ...
    }

<a name="passing-data-to-views"></a>
## 向视图传递数据

正如你在前面的示例中看到的，你可以向视图传递一个数据数组，让这些数据对视图可用：

    return view('greetings', ['name' => 'Victoria']);

以这种方式传递信息时，数据应当是一个带键 / 值对的数组。把数据提供给视图后，你就可以在视图中使用数据的键访问每个值，例如 `<?php echo $name; ?>`。

作为把完整数据数组传给 `view` 辅助函数的替代方案，你可以使用 `with` 方法把单个数据项添加到视图。`with` 方法返回一个视图对象实例，以便你在返回视图之前继续链式调用方法：

    return view('greeting')
        ->with('name', 'Victoria')
        ->with('occupation', 'Astronaut');

<a name="sharing-data-with-all-views"></a>
### 与所有视图共享数据

偶尔你可能需要与应用渲染的所有视图共享数据，可以使用 `View` Facade 的 `share` 方法做到这一点。通常，你应把 `share` 方法的调用放在某个服务提供者的 `boot` 方法中。你可以自由地把它们添加到 `App\Providers\AppServiceProvider` 类中，也可以生成一个单独的服务提供者来承载它们：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\View;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
         */
        public function boot(): void
        {
            View::share('key', 'value');
        }
    }

<a name="view-composers"></a>
## 视图 composers

视图 composer 是视图渲染时被调用的回调或类方法。如果你希望某些数据在每次渲染某个视图时都绑定到该视图上，视图 composer 可以帮助你把这些逻辑集中到一个位置。如果应用中多个路由或控制器返回同一个视图，且该视图总是需要某份特定数据，视图 composer 会格外有用。

通常，视图 composer 会在你的某个[服务提供者](/docs/{{version}}/providers)中注册。在这个例子中，我们假设由 `App\Providers\AppServiceProvider` 承载这段逻辑。

我们会使用 `View` Facade 的 `composer` 方法注册视图 composer。Laravel 没有为基于类的视图 composer 提供默认目录，因此你可以自由组织它们。例如，你可以创建一个 `app/View/Composers` 目录来存放应用的所有视图 composer：

    <?php

    namespace App\Providers;

    use App\View\Composers\ProfileComposer;
    use Illuminate\Support\Facades;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\View\View;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
         */
        public function boot(): void
        {
            // 使用基于类的 composer……
            Facades\View::composer('profile', ProfileComposer::class);

            // 使用基于闭包的 composer……
            Facades\View::composer('welcome', function (View $view) {
                // ...
            });

            Facades\View::composer('dashboard', function (View $view) {
                // ...
            });
        }
    }

注册 composer 之后，每次渲染 `profile` 视图时都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。我们来看一个 composer 类的示例：

    <?php

    namespace App\View\Composers;

    use App\Repositories\UserRepository;
    use Illuminate\View\View;

    class ProfileComposer
    {
        /**
         * 创建一个新的资料视图 composer。
         */
        public function __construct(
            protected UserRepository $users,
        ) {}

        /**
         * 把数据绑定到视图。
         */
        public function compose(View $view): void
        {
            $view->with('count', $this->users->count());
        }
    }

如你所见，所有视图 composer 都通过[服务容器（Service Container）](/docs/{{version}}/container)解析，因此你可以在 composer 的构造函数中类型提示所需的任何依赖。

<a name="attaching-a-composer-to-multiple-views"></a>
#### 把一个 Composer 附加到多个视图

你可以通过把视图数组作为 `composer` 方法的第一个参数，把视图 composer 同时附加到多个视图：

    use App\Views\Composers\MultiComposer;
    use Illuminate\Support\Facades\View;

    View::composer(
        ['profile', 'dashboard'],
        MultiComposer::class
    );

`composer` 方法还接受 `*` 字符作为通配符，允许你把 composer 附加到所有视图：

    use Illuminate\Support\Facades;
    use Illuminate\View\View;

    Facades\View::composer('*', function (View $view) {
        // ...
    });

<a name="view-creators"></a>
### 视图 creators

视图 "creator" 与视图 composer 非常相似；不过，它们在视图实例化后立即执行，而不是等到视图即将渲染时才执行。要注册视图 creator，请使用 `creator` 方法：

    use App\View\Creators\ProfileCreator;
    use Illuminate\Support\Facades\View;

    View::creator('profile', ProfileCreator::class);

<a name="optimizing-views"></a>
## 优化视图

默认情况下，Blade 模板视图会按需编译。当执行一个渲染视图的请求时，Laravel 会判断是否存在该视图的编译版本。如果文件存在，Laravel 会接着判断未编译的视图是否比编译后的视图修改得更晚。如果编译后的视图不存在，或者未编译的视图已被修改，Laravel 就会重新编译该视图。

在请求期间编译视图可能会对性能产生小幅负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用所用的所有视图。为了获得更好的性能，你不妨把该命令作为部署流程的一部分运行：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令清除视图缓存：

```shell
php artisan view:clear
```
