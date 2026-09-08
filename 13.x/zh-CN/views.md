# 视图

当然，直接从路由和控制器返回完整的 HTML 文档字符串并不现实。幸好，视图提供了一种便捷的方式，让我们可以将所有 HTML 放置在独立的文件中。

视图将你的控制器 / 应用逻辑与展示逻辑分离开来，并存储在 `resources/views` 目录中。使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/topic/Laravel%2013.x/wevwmrz9l2.html) 编写。一个简单的视图看起来像这样：

```blade
<!-- 视图存储在 resources/views/greeting.blade.php -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于该视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局的 `view` 辅助函数来返回它，如下所示：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> [!NOTE]
> 想了解更多关于如何编写 Blade 模板的信息？请查看完整的 [Blade 文档](/topic/Laravel%2013.x/wevwmrz9l2.html) 开始上手。

## 使用 React / Svelte / Vue 编写视图

许多开发者开始倾向于使用 React、Svelte 或 Vue 来编写前端模板，而不是通过 Blade 用 PHP 编写。得益于 [Inertia](https://inertiajs.com/)，Laravel 让这件事变得轻而易举——Inertia 是一个库，可以轻松地将你的 React / Svelte / Vue 前端与 Laravel 后端连接起来，而无需构建 SPA 时的常见复杂性。

我们的 [React、Svelte 和 Vue 应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html) 为你的下一个由 Inertia 驱动的 Laravel 应用提供了良好的起点。

## 创建与渲染视图

你可以将带有 `.blade.php` 扩展名的文件放入应用的 `resources/views` 目录来创建视图，也可以使用 `make:view` Artisan 命令：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名告诉框架该文件包含一个 [Blade 模板](/topic/Laravel%2013.x/wevwmrz9l2.html)。Blade 模板包含 HTML 以及 Blade 指令，让你可以轻松输出值、创建 "if" 语句、遍历数据等。

创建视图后，你可以使用全局的 `view` 辅助函数，从应用的某个路由或控制器返回它：

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

如你所见，传给 `view` 辅助函数的第一个参数对应 `resources/views` 目录中视图文件的名称。第二个参数是一个数组，包含应当提供给视图的数据。在本例中，我们传入了 `name` 变量，该变量会在视图中通过 [Blade 语法](/topic/Laravel%2013.x/wevwmrz9l2.html) 显示。

### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。可以使用 "点" 记法来引用嵌套视图。例如，如果视图存储在 `resources/views/admin/profile.blade.php`，你可以像这样从应用的路由 / 控制器返回它：

```php
return view('admin.profile', $data);
```

> [!WARNING]
> 视图目录名称不应包含 `.` 字符。

### 创建第一个可用的视图

使用 `View` Facade 的 `first` 方法，你可以创建给定视图数组中存在的第一个视图。当你的应用或扩展包允许视图被自定义或覆盖时，这会很有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

### 判断视图是否存在

如果你需要判断某个视图是否存在，可以使用 `View` Facade。`exists` 方法会在视图存在时返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('admin.profile')) {
    // ...
}
```

## 向视图传递数据

正如你在前面的示例中看到的，你可以向视图传递一个数据数组，使这些数据在视图中可用：

```php
return view('greetings', ['name' => 'Victoria']);
```

以这种方式传递信息时，数据应当是一个包含键 / 值对的数组。向视图提供数据后，你就可以在视图中使用数据的键来访问每个值，例如 `<?php echo $name; ?>`。

除了向 `view` 辅助函数传递完整的数组之外，你也可以使用 `with` 方法向视图添加单独的数据片段。`with` 方法会返回视图对象实例，因此你可以在返回视图之前继续链式调用其他方法：

```php
return view('greeting')
    ->with('name', 'Victoria')
    ->with('occupation', 'Astronaut');
```

### 与所有视图共享数据

有时，你可能需要与应用中渲染的所有视图共享数据。可以使用 `View` Facade 的 `share` 方法来实现。通常，你应当将这些 `share` 方法的调用放在某个服务提供者的 `boot` 方法中。你可以将它们添加到 `App\Providers\AppServiceProvider` 类中，也可以生成一个独立的服务提供者来存放它们：

```php
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
```

## 视图合成器

视图合成器是在视图渲染时被调用的回调或类方法。如果你有数据希望每次渲染某个视图时都绑定到该视图，视图合成器可以帮你将这些逻辑组织到单一位置。当同一个视图被应用中的多个路由或控制器返回、且始终需要某个特定数据时，视图合成器会特别有用。

通常，视图合成器会注册在应用的某个 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 中。在本例中，我们假设 `App\Providers\AppServiceProvider` 类将承载这段逻辑。

我们将使用 `View` Facade 的 `composer` 方法来注册视图合成器。Laravel 没有为基于类的视图合成器提供默认目录，因此你可以自由地按自己的意愿组织它们。例如，你可以创建一个 `app/View/Composers` 目录来存放应用中所有的视图合成器：

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
        // 使用基于类的合成器……
        Facades\View::composer('profile', ProfileComposer::class);

        // 使用基于闭包的合成器……
        Facades\View::composer('welcome', function (View $view) {
            // ...
        });

        Facades\View::composer('dashboard', function (View $view) {
            // ...
        });
    }
}
```

现在我们已经注册了合成器，每次渲染 `profile` 视图时，都会执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。下面来看一个合成器类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * 创建一个新的 profile 合成器。
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

如你所见，所有视图合成器都通过 [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 解析，因此你可以在合成器的构造函数中类型提示任何所需的依赖。

#### 将合成器附加到多个视图

你可以将视图合成器一次性附加到多个视图，只需将视图数组作为第一个参数传给 `composer` 方法：

```php
use App\Views\Composers\MultiComposer;
use Illuminate\Support\Facades\View;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法也接受 `*` 字符作为通配符，让你可以将合成器附加到所有视图：

```php
use Illuminate\Support\Facades;
use Illuminate\View\View;

Facades\View::composer('*', function (View $view) {
    // ...
});
```

### 视图创建器

视图 "创建器" 与视图合成器非常相似；不过，它们是在视图实例化之后立即执行，而不是等到视图即将渲染时才执行。要注册一个视图创建器，可以使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

## 优化视图

默认情况下，Blade 模板视图是按需编译的。当执行一个渲染视图的请求时，Laravel 会判断是否存在该视图的编译版本。如果存在该文件，Laravel 会进一步判断未编译的视图是否比编译后的视图更新。如果编译后的视图不存在，或者未编译视图已被修改，Laravel 就会重新编译该视图。

在请求过程中编译视图可能会对性能产生轻微的负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用中使用的所有视图。为了提升性能，你可以将这条命令作为部署流程的一部分来运行：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令来清除视图缓存：

```shell
php artisan view:clear
```
