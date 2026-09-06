# Blade 模板

## 简介

Blade 是 Laravel 内置的简洁而强大的模板引擎。与一些 PHP 模板引擎不同，Blade 不限制你在模板中使用原生 PHP 代码。事实上，所有 Blade 模板都会被编译为原生 PHP 代码并缓存起来，直到它们被修改，这意味着 Blade 基本上不会给你的应用带来任何额外开销。Blade 模板文件使用 `.blade.php` 文件扩展名，通常存放在 `resources/views` 目录中。

你可以在路由或控制器中使用全局的 `view` 辅助函数返回 Blade 视图。当然，正如 [视图](/topic/Laravel%2013.x/m892gz6y01.html) 文档中提到的，你可以通过 `view` 辅助函数的第二个参数将数据传递给 Blade 视图：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

### 用 Livewire 增强 Blade

想让你的 Blade 模板更进一步，轻松构建动态界面吗？来看看 [Laravel Livewire](https://livewire.laravel.com)。Livewire 允许你编写带有动态功能的 Blade 组件，这些功能通常只能通过 React、Svelte 或 Vue 等前端框架实现，为构建现代化、响应式前端提供了一种极佳的方式，无需承担许多 JavaScript 框架的复杂性、客户端渲染或构建步骤。

## 显示数据

你可以通过将变量包裹在大括号中来显示传递给 Blade 视图的数据。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

你可以像下面这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> [!NOTE]
> Blade 的 `{{ }}` 输出语句会自动经过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。

你可以显示传递给视图的变量内容，不仅限于此。你还可以输出任何 PHP 函数的结果。事实上，你可以在 Blade 输出语句中放入任何你想要的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

### HTML 实体编码

默认情况下，Blade（以及 Laravel 的 `e` 函数）会对 HTML 实体进行双重编码。如果你想禁用双重编码，请在 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Blade::withoutDoubleEncoding();
    }
}
```

#### 显示未转义的数据

默认情况下，Blade 的 `{{ }}` 语句会自动经过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。如果你不希望数据被转义，可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 在输出用户提供的内容时，请务必小心。通常应使用带转义的双大括号语法来显示用户提供的数据，以防止 XSS 攻击。

### Blade 与 JavaScript 框架

由于许多 JavaScript 框架也使用「大括号」来指示某个表达式应在浏览器中显示，你可以使用 `@` 符号告知 Blade 渲染引擎某个表达式应保持原样。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在这个例子中，`@` 符号会被 Blade 移除；但 `{{ name }}` 表达式会保持不变，从而允许它由你的 JavaScript 框架进行渲染。

`@` 符号也可以用来转义 Blade 指令：

```blade
{{-- Blade template --}}
@@if()

<!-- HTML output -->
@if()
```

#### 渲染 JSON

有时你可能希望将一个数组传递给视图，并将其渲染为 JSON 以初始化一个 JavaScript 变量。例如：

```php
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

不过，你可以使用 `Illuminate\Support\Js::from` 方法，而无需手动调用 `json_encode`。`from` 方法接受与 PHP 的 `json_encode` 函数相同的参数；但它会确保生成的 JSON 已正确转义，可以包含在 HTML 引号内。`from` 方法会返回一个 `JSON.parse` 的 JavaScript 语句字符串，用于将给定的对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

最新版 Laravel 应用骨架包含一个 `Js` Facade，可在 Blade 模板内方便地访问此功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你应仅使用 `Js::from` 方法将现有变量渲染为 JSON。Blade 模板基于正则表达式，尝试向该指令传递复杂表达式可能会导致意外失败。

#### `@verbatim` 指令

如果模板中有大段区域用于显示 JavaScript 变量，可以将 HTML 包裹在 `@verbatim` 指令中，这样就无需在每个 Blade 输出语句前添加 `@` 符号：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

## Blade 指令

除了模板继承和数据显示之外，Blade 还为常见的 PHP 控制结构（如条件语句和循环）提供了便捷的快捷方式。这些快捷方式提供了一种非常简洁的方式来处理 PHP 控制结构，同时仍然与对应的 PHP 写法保持一致。

### if 语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令来构造 `if` 语句。这些指令的功能与对应的 PHP 语句完全相同：

```blade
@if (count($records) === 1)
    I have one record!
@elseif (count($records) > 1)
    I have multiple records!
@else
    I don't have any records!
@endif
```

为方便起见，Blade 还提供了 `@unless` 指令：

```blade
@unless (Auth::check())
    You are not signed in.
@endunless
```

除了上面讨论的条件指令外，`@isset` 和 `@empty` 指令还可以用作对应 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records is defined and is not null...
@endisset

@empty($records)
    // $records is "empty"...
@endempty
```

#### 身份验证指令

`@auth` 和 `@guest` 指令可用于快速判断当前用户是否[已通过身份验证](/topic/Laravel%2013.x/xq9zrgjvdo.html)或是否为游客：

```blade
@auth
    // The user is authenticated...
@endauth

@guest
    // The user is not authenticated...
@endguest
```

如果需要，你可以在使用 `@auth` 和 `@guest` 指令时指定要检查的身份验证看守器：

```blade
@auth('admin')
    // The user is authenticated...
@endauth

@guest('admin')
    // The user is not authenticated...
@endguest
```

#### 环境指令

你可以使用 `@production` 指令检查应用是否运行在生产环境中：

```blade
@production
    // Production specific content...
@endproduction
```

或者，你可以使用 `@env` 指令判断应用是否运行在特定环境中：

```blade
@env('staging')
    // The application is running in "staging"...
@endenv

@env(['staging', 'production'])
    // The application is running in "staging" or "production"...
@endenv
```

#### section 指令

你可以使用 `@hasSection` 指令判断模板继承的 section 是否包含内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

你可以使用 `sectionMissing` 指令判断某个 section 是否没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

#### session 指令

`@session` 指令可用于判断 [session](/topic/Laravel%2013.x/2ev86noyor.html) 值是否存在。如果 session 值存在，则 `@session` 和 `@endsession` 指令之间的模板内容将被求值。在 `@session` 指令的内容中，你可以输出 `$value` 变量以显示 session 值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

#### context 指令

`@context` 指令可用于判断 [context](/topic/Laravel%2013.x/xpv527gv86.html) 值是否存在。如果 context 值存在，则 `@context` 和 `@endcontext` 指令之间的模板内容将被求值。在 `@context` 指令的内容中，你可以输出 `$value` 变量以显示 context 值：

```blade
@context('canonical')
    <link href="{{ $value }}" rel="canonical">
@endcontext
```

### switch 语句

可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令来构造 switch 语句：

```blade
@switch($i)
    @case(1)
        First case...
        @break

    @case(2)
        Second case...
        @break

    @default
        Default case...
@endswitch
```

### 循环

除了条件语句外，Blade 还提供了与 PHP 循环结构对应的简单指令。同样，这些指令的功能与对应的 PHP 写法完全相同：

```blade
@for ($i = 0; $i < 10; $i++)
    The current value is {{ $i }}
@endfor

@foreach ($users as $user)
    <p>This is user {{ $user->id }}</p>
@endforeach

@forelse ($users as $user)
    <li>{{ $user->name }}</li>
    @empty
    <p>No users</p>
@endforelse

@while (true)
    <p>I'm looping forever.</p>
@endwhile
```

> [!NOTE]
> 在 `foreach` 循环中迭代时，你可以使用 循环变量 来获取有关循环的有用信息，例如当前是循环的第一次还是最后一次迭代。

在使用循环时，你还可以使用 `@continue` 和 `@break` 指令跳过当前迭代或终止循环：

```blade
@foreach ($users as $user)
    @if ($user->type == 1)
        @continue
    @endif

    <li>{{ $user->name }}</li>

    @if ($user->number == 5)
        @break
    @endif
@endforeach
```

你也可以在指令声明中加入继续或中断条件：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

### 循环变量

在 `foreach` 循环迭代过程中，循环内部会提供一个 `$loop` 变量。该变量提供了一些有用的信息，例如当前循环索引以及当前是否为循环的第一次或最后一次迭代：

```blade
@foreach ($users as $user)
    @if ($loop->first)
        This is the first iteration.
    @endif

    @if ($loop->last)
        This is the last iteration.
    @endif

    <p>This is user {{ $user->id }}</p>
@endforeach
```

如果你处于嵌套循环中，可以通过 `parent` 属性访问父级循环的 `$loop` 变量：

```blade
@foreach ($users as $user)
    @foreach ($user->posts as $post)
        @if ($loop->parent->first)
            This is the first iteration of the parent loop.
        @endif
    @endforeach
@endforeach
```

`$loop` 变量还包含许多其他有用的属性：

| 属性              | 描述                                                |
| ------------------ | ------------------------------------------------------ |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。 |
| `$loop->iteration` | 当前循环迭代的次数（从 1 开始）。              |
| `$loop->remaining` | 循环中剩余的迭代次数。                  |
| `$loop->count`     | 所迭代数组中的元素总数。 |
| `$loop->first`     | 当前是否为循环的第一次迭代。  |
| `$loop->last`      | 当前是否为循环的最后一次迭代。   |
| `$loop->even`      | 当前是否为偶数次迭代。    |
| `$loop->odd`       | 当前是否为奇数次迭代。     |
| `$loop->depth`     | 当前循环的嵌套层级。                 |
| `$loop->parent`    | 在嵌套循环中，父级循环的循环变量。     |

### 条件类与样式

`@class` 指令会按条件编译 CSS 类字符串。该指令接受一个类数组，数组的键包含你希望添加的类，值是一个布尔表达式。如果数组元素使用数字键，它将始终包含在渲染的类列表中：

```blade
@php
    $isActive = false;
    $hasError = true;
@endphp

<span @class([
    'p-4',
    'font-bold' => $isActive,
    'text-gray-500' => ! $isActive,
    'bg-red' => $hasError,
])></span>

<span class="p-4 text-gray-500 bg-red"></span>
```

同样地，`@style` 指令可以用于按条件向 HTML 元素添加内联 CSS 样式：

```blade
@php
    $isActive = true;
@endphp

<span @style([
    'background-color: red',
    'font-weight: bold' => $isActive,
])></span>

<span style="background-color: red; font-weight: bold;"></span>
```

### 附加属性

为方便起见，你可以使用 `@checked` 指令轻松指示给定的 HTML checkbox 输入是否处于「选中」状态。如果提供的条件求值为 `true`，该指令将输出 `checked`：

```blade
<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
```

同样地，`@selected` 指令可用于指示给定的 select 选项是否应处于「选中」状态：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于指示给定元素是否应处于「禁用」状态：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

此外，`@readonly` 指令可用于指示给定元素是否应处于「只读」状态：

```blade
<input
    type="email"
    name="email"
    value="email@laravel.com"
    @readonly($user->isNotAdmin())
/>
```

此外，`@required` 指令可用于指示给定元素是否为「必填」：

```blade
<input
    type="text"
    name="title"
    value="title"
    @required($user->isAdmin())
/>
```

### 包含子视图

> [!NOTE]
> 虽然你可以自由使用 `@include` 指令，但 Blade 组件 提供了类似功能，并在数据与属性绑定等方面比 `@include` 指令具有更多优势。

Blade 的 `@include` 指令允许你从一个视图内包含另一个 Blade 视图。所有在父视图中可用的变量在包含的视图中同样可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- Form Contents -->
    </form>
</div>
```

尽管被包含的视图会继承父视图中所有可用的数据，你也可以传递一个额外的数据数组，这些数据将在被包含的视图中可用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 将抛出一个错误。如果你希望包含一个可能存在也可能不存在的视图，应使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你希望在给定的布尔表达式求值为 `true` 或 `false` 时才 `@include` 一个视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要从给定的视图数组中包含第一个存在的视图，可以使用 `includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

如果你希望包含视图时不要从父视图继承任何变量，可以使用 `@includeIsolated` 指令。被包含的视图将只能访问你显式传入的变量：

```blade
@includeIsolated('view.name', ['user' => $user])
```

> [!WARNING]
> 应避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们将指向已缓存、已编译视图的位置。

#### 为集合渲染视图

你可以使用 Blade 的 `@each` 指令将循环与包含合二为一：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中的每个元素渲染的视图。第二个参数是你希望迭代的数组或集合，第三个参数是在视图中分配给当前迭代的变量名称。例如，如果你正在迭代一个 `jobs` 数组，通常希望在视图中以 `job` 变量访问每个 job。当前迭代的数组键在视图中以 `key` 变量提供。

你也可以向 `@each` 指令传入第四个参数，该参数指定当给定数组为空时将渲染的视图：

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图中的变量。如果子视图需要这些变量，应改用 `@foreach` 和 `@include` 指令。

### `@once` 指令

`@once` 指令允许你定义一个仅在每次渲染周期内求值一次的模板片段。当需要使用 stacks 将某段 JavaScript 推送到页面的 head 时，这非常有用。例如，如果你在循环中渲染某个给定的 组件，你可能只希望在第一次渲染该组件时将该 JavaScript 推送到 head：

```blade
@once
    @push('scripts')
        <script>
            // Your custom JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令经常与 `@push` 或 `@prepend` 指令一起使用，`@pushOnce` 和 `@prependOnce` 指令已为你准备好以便使用：

```blade
@pushOnce('scripts')
    <script>
        // Your custom JavaScript...
    </script>
@endPushOnce
```

如果你从两个不同的 Blade 模板中推送重复内容，应向 `@pushOnce` 指令的第二个参数提供一个唯一标识符，以确保内容只渲染一次：

```blade
<!-- pie-chart.blade.php -->
@pushOnce('scripts', 'chart.js')
    <script src="/chart.js"></script>
@endPushOnce

<!-- line-chart.blade.php -->
@pushOnce('scripts', 'chart.js')
    <script src="/chart.js"></script>
@endPushOnce
```

### 原生 PHP

在某些情况下，在视图中嵌入 PHP 代码非常有用。你可以使用 Blade 的 `@php` 指令在模板中执行一段原生 PHP 代码块：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只是想使用 PHP 来引入某个类，可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

可以为 `@use` 指令提供第二个参数为引入的类设置别名：

```blade
@use('App\Models\Flight', 'FlightModel')
```

如果同一命名空间下有多个类，可以对这些类的导入进行分组：

```blade
@use('App\Models\{Flight, Airport}')
```

`@use` 指令还支持通过在导入路径前加上 `function` 或 `const` 修饰符来导入 PHP 函数和常量：

```blade
@use(function App\Helpers\format_currency)
@use(const App\Constants\MAX_ATTEMPTS)
```

与类导入一样，函数和常量也支持别名：

```blade
@use(function App\Helpers\format_currency, 'formatMoney')
@use(const App\Constants\MAX_ATTEMPTS, 'MAX_TRIES')
```

分组导入同样支持 `function` 和 `const` 修饰符，允许你在单个指令中从同一命名空间导入多个符号：

```blade
@use(function App\Helpers\{format_currency, format_date})
@use(const App\Constants\{MAX_ATTEMPTS, DEFAULT_TIMEOUT})
```

### 字体

当使用 [Laravel 的 Vite 字体优化](/topic/Laravel%2013.x/ndvm3gj93j.html) 时，你可以使用 `@fonts` 指令在应用布局中渲染已配置的字体预加载链接与内联字体 CSS：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @fonts
    @vite('resources/js/app.js')
</head>
```

`@fonts` 指令会渲染在 `vite.config.js` 文件中配置的所有字体族。该指令通常应放置在应用根布局的 `<head>` 中、任何使用这些字体的内容之前。

如果页面只需要某些已配置的字体，你可以向指令传入一个或多个字体别名：

```blade
{{-- Load a single font alias... --}}
@fonts('sans')

{{-- Load multiple font aliases... --}}
@fonts(['sans', 'mono'])
```

字体别名通过在 Vite 配置中定义字体时的 `alias` 选项进行配置。`@fonts` 指令调用 `Vite` Facade 提供的 `fonts` 方法，该方法也可以直接调用：

```blade
{{ Vite::fonts(['sans', 'mono']) }}
```

### 注释

Blade 还允许你在视图中定义注释。但与 HTML 注释不同，Blade 注释不会包含在应用返回的 HTML 中：

```blade
{{-- This comment will not be present in the rendered HTML --}}
```

## 组件

组件和插槽提供了与 sections、layouts 和 includes 类似的好处；不过，有些人可能觉得组件和插槽的心智模型更容易理解。编写组件有两种方式：基于类的组件和匿名组件。

要创建基于类的组件，你可以使用 `make:component` Artisan 命令。为了说明组件的用法，我们将创建一个简单的 `Alert` 组件。`make:component` 命令会将组件放在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为该组件创建一个视图模板。视图将放置在 `resources/views/components` 目录中。为自己的应用编写组件时，组件会自动在 `app/View/Components` 目录和 `resources/views/components` 目录中发现，因此通常无需进一步的组件注册。

你也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令会在 `app/View/Components/Forms` 目录中创建一个 `Input` 组件，并将视图放在 `resources/views/components/forms` 目录中。

#### 手动注册包组件

为自己的应用编写组件时，组件会自动在 `app/View/Components` 目录和 `resources/views/components` 目录中发现。

但是，如果你正在构建使用 Blade 组件的包，则需要手动注册组件类及其 HTML 标签别名。通常应在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * Bootstrap your package's services.
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

一旦组件被注册，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能拥有位于 `Package\Views\Components` 命名空间下的 `Calendar` 和 `ColorPicker` 组件：

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

这允许通过供应商命名空间使用 `package-name::` 语法调用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名转换为 Pascal Case 自动检测与之关联的类。子目录也支持使用「点」表示法。

### 渲染组件

要显示一个组件，你可以在某个 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后跟组件类的 kebab-case 名称：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类嵌套在 `app/View/Components` 目录的更深位置，你可以使用 `.` 字符来表示目录嵌套。例如，假设某个组件位于 `app/View/Components/Inputs/Button.php`，我们可以这样渲染它：

```blade
<x-inputs.button/>
```

如果你希望按条件渲染组件，可以在组件类上定义 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，则不会渲染该组件：

```php
use Illuminate\Support\Str;

/**
 * Whether the component should be rendered
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

### Index 组件

有时组件是组件组的一部分，你可能希望将相关组件分组到单个目录中。例如，假设有一个具有以下类结构的「card」组件：

```text
App\Views\Components\Card\Card
App\Views\Components\Card\Header
App\Views\Components\Card\Body
```

由于根 `Card` 组件嵌套在 `Card` 目录中，你可能预期需要通过 `<x-card.card>` 渲染该组件。但是，当组件的文件名与组件目录名匹配时，Laravel 会自动将该组件视为「根」组件，允许你无需重复目录名即可渲染该组件：

```blade
<x-card>
    <x-card.header>...</x-card.header>
    <x-card.body>...</x-card.body>
</x-card>
```

### 向组件传递数据

你可以使用 HTML 属性向 Blade 组件传递数据。硬编码的原始值可以使用简单的 HTML 属性字符串传递给组件。PHP 表达式和变量应通过使用 `:` 字符作为前缀的属性传递给组件：

```blade
<x-alert type="error" :message="$message"/>
```

你应该在组件类的构造函数中定义所有组件的数据属性。组件上的所有 public 属性将自动对组件的视图可用，无需从组件的 `render` 方法将数据传递给视图：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Alert extends Component
{
    /**
     * Create the component instance.
     */
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

当组件被渲染时，你可以通过按名称输出变量来显示组件的 public 属性的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

#### 大小写约定

组件构造函数参数应使用 `camelCase` 指定，而在 HTML 属性中引用参数名时应使用 `kebab-case`。例如，给定以下组件构造函数：

```php
/**
 * Create the component instance.
 */
public function __construct(
    public string $alertType,
) {}
```

`$alertType` 参数可以这样传递给组件：

```blade
<x-alert alert-type="danger" />
```

#### 简短属性语法

向组件传递属性时，也可以使用「简短属性」语法。这通常很方便，因为属性名称经常与它们对应的变量名相同：

```blade
{{-- Short attribute syntax... --}}
<x-profile :$userId :$name />

{{-- Is equivalent to... --}}
<x-profile :user-id="$userId" :name="$name" />
```

#### 转义属性渲染

由于某些 JavaScript 框架（如 Alpine.js）也使用冒号前缀的属性，你可以使用双冒号（`::`）前缀来告知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

```blade
<x-button ::class="{ danger: isDeleting }">
    Submit
</x-button>
```

Blade 会渲染以下 HTML：

```blade
<button :class="{ danger: isDeleting }">
    Submit
</button>
```

#### 组件方法

除了 public 变量对组件模板可用之外，组件上的任何 public 方法也可以被调用。例如，假设一个组件具有 `isSelected` 方法：

```php
/**
 * Determine if the given option is the currently selected option.
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以通过调用与该方法名称匹配的变量，从组件模板中执行此方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

#### 在组件类中访问属性和插槽

Blade 组件还允许你在类的 `render` 方法中访问组件名、属性和插槽。但是，为了访问这些数据，应该从组件的 `render` 方法返回一个闭包：

```php
use Closure;

/**
 * Get the view / contents that represent the component.
 */
public function render(): Closure
{
    return function () {
        return '<div {{ $attributes }}>Components content</div>';
    };
}
```

由组件的 `render` 方法返回的闭包也可以接受一个 `$data` 数组作为唯一参数。该数组将包含几个提供组件相关信息的元素：

```php
return function (array $data) {
    // $data['componentName'];
    // $data['attributes'];
    // $data['slot'];

    return '<div {{ $attributes }}>Components content</div>';
}
```

> [!WARNING]
> 永远不要将 `$data` 数组中的元素直接嵌入到 `render` 方法返回的 Blade 字符串中，因为这样做可能会由于恶意属性内容而导致远程代码执行。

`componentName` 等于 HTML 标签中 `x-` 前缀之后使用的名称。所以 `<x-alert />` 的 `componentName` 将是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个 `Illuminate\Support\HtmlString` 实例，其中包含组件插槽的内容。

闭包应返回一个字符串。如果返回的字符串对应于现有视图，则会渲染该视图；否则，返回的字符串将作为内联 Blade 视图进行求值。

#### 附加依赖

如果你的组件需要 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 中的依赖，你可以在组件的任何数据属性之前列出它们，它们将由容器自动注入：

```php
use App\Services\AlertCreator;

/**
 * Create the component instance.
 */
public function __construct(
    public AlertCreator $creator,
    public string $type,
    public string $message,
) {}
```

#### 隐藏属性 / 方法

如果希望阻止某些 public 方法或属性作为变量暴露给组件模板，可以将它们添加到组件上的 `$except` 数组属性中：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * The properties / methods that should not be exposed to the component template.
     *
     * @var array
     */
    protected $except = ['type'];

    /**
     * Create the component instance.
     */
    public function __construct(
        public string $type,
    ) {}
}
```

### 组件属性

我们已经讨论了如何向组件传递数据属性；但是，有时你可能需要指定组件功能所需数据之外的附加 HTML 属性，例如 `class`。通常，你希望将这些附加属性向下传递到组件模板的根元素。例如，假设我们希望像下面这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性将自动添加到组件的「属性包」中。该属性包会自动通过 `$attributes` 变量提供给组件。所有属性都可以通过输出此变量在组件内进行渲染：

```blade
<div {{ $attributes }}>
    <!-- Component content -->
</div>
```

> [!WARNING]
> 目前不支持在组件标签中使用诸如 `@env` 等指令。例如，`<x-alert :live="@env('production')"/>` 不会被编译。

#### 默认 / 合并属性

有时你可能需要为属性指定默认值，或将其他值合并到组件的某些属性中。为此，你可以使用属性包的 `merge` 方法。当定义应始终应用于组件的一组默认 CSS 类时，此方法特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

假设此组件被如下使用：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

组件最终渲染的 HTML 将如下所示：

```blade
<div class="alert alert-error mb-4">
    <!-- Contents of the $message variable -->
</div>
```

#### 按条件合并类

有时你可能希望在给定条件为 `true` 时合并类。你可以通过 `class` 方法实现这一点，该方法接受一个类数组，其中数组的键包含你希望添加的类，值是一个布尔表达式。如果数组元素使用数字键，它将始终包含在渲染的类列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果需要将其他属性合并到组件中，可以将 `merge` 方法链接到 `class` 方法之后：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]
> 如果需要在不应接收合并属性的其他 HTML 元素上有条件地编译类，可以使用 @class 指令。

#### 非 class 属性的合并

合并非 `class` 属性时，提供给 `merge` 方法的值将被视为该属性的「默认值」。但是，与 `class` 属性不同，这些属性不会与注入的属性值合并，而是会被覆盖。例如，一个 `button` 组件的实现可能如下所示：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要使用自定义的 `type` 渲染 button 组件，可以在使用组件时指定它。如果未指定 `type`，则将使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

本例中 `button` 组件渲染的 HTML 为：

```blade
<button type="submit">
    Submit
</button>
```

如果你希望除 `class` 之外的属性将其默认值与注入值连接在一起，可以使用 `prepends` 方法。在本例中，`data-controller` 属性将始终以 `profile-controller` 开头，任何额外注入的 `data-controller` 值都将放在此默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

#### 检索和过滤属性

你可以使用 `filter` 方法过滤属性。该方法接受一个闭包，如果希望保留属性包中的属性，闭包应返回 `true`：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为方便起见，你可以使用 `whereStartsWith` 方法检索所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，可以使用 `whereDoesntStartWith` 方法排除所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你希望检查组件上是否存在某个属性，可以使用 `has` 方法。该方法接受属性名称作为唯一参数，并返回一个布尔值，指示该属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class attribute is present</div>
@endif
```

如果将一个数组传递给 `has` 方法，该方法将判断组件上是否同时存在所有给定属性：

```blade
@if ($attributes->has(['name', 'class']))
    <div>All of the attributes are present</div>
@endif
```

`hasAny` 方法可用于判断组件上是否存在任意给定属性：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>One of the attributes is present</div>
@endif
```

你可以使用 `get` 方法检索特定属性的值：

```blade
{{ $attributes->get('class') }}
```

`only` 方法可用于仅检索具有给定键的属性：

```blade
{{ $attributes->only(['class']) }}
```

`except` 方法可用于检索除具有给定键的属性之外的所有属性：

```blade
{{ $attributes->except(['class']) }}
```

### 保留关键字

默认情况下，某些关键字为 Blade 内部保留，用于渲染组件。以下关键字不能在组件中定义为 public 属性或方法名：

- `data`
- `render`
- `resolve`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

### 插槽

你经常需要通过「插槽」向组件传递附加内容。组件插槽通过输出 `$slot` 变量进行渲染。为了说明这个概念，让我们假设一个 `alert` 组件具有以下标记：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

我们可以通过向组件注入内容来将内容传递给 `slot`：

```blade
<x-alert>
    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

有时组件可能需要在组件内部的不同位置渲染多个不同的插槽。让我们修改 alert 组件以允许注入「title」插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签定义具名插槽的内容。任何不在显式 `x-slot` 标签内的内容都将通过 `$slot` 变量传递给组件：

```xml
<x-alert>
    <x-slot:title>
        Server Error
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

你可以调用插槽的 `isEmpty` 方法来判断插槽是否包含内容：

```blade
<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    @if ($slot->isEmpty())
        This is default content if the slot is empty.
    @else
        {{ $slot }}
    @endif
</div>
```

此外，`hasActualContent` 方法可用于判断插槽是否包含任何「实际」内容（非 HTML 注释）：

```blade
@if ($slot->hasActualContent())
    The scope has non-comment content.
@endif
```

#### 作用域插槽

如果你使用过 Vue 这样的 JavaScript 框架，你可能熟悉「作用域插槽」，它允许你在插槽内访问组件的数据或方法。在 Laravel 中，你可以通过在组件上定义 public 方法或属性，并通过 `$component` 变量在插槽内访问该组件，从而实现类似的行为。在本例中，我们假设 `x-alert` 组件在其组件类上定义了一个 public `formatAlert` 方法：

```blade
<x-alert>
    <x-slot:title>
        {{ $component->formatAlert('Server Error') }}
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

#### 插槽属性

与 Blade 组件一样，你也可以为插槽分配附加的属性，例如 CSS 类名：

```xml
<x-card class="shadow-sm">
    <x-slot:heading class="font-bold">
        Heading
    </x-slot>

    Content

    <x-slot:footer class="text-sm">
        Footer
    </x-slot>
</x-card>
```

要与插槽属性交互，你可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请参阅组件属性文档：

```blade
@props([
    'heading',
    'footer',
])

<div {{ $attributes->class(['border']) }}>
    <h1 {{ $heading->attributes->class(['text-lg']) }}>
        {{ $heading }}
    </h1>

    {{ $slot }}

    <footer {{ $footer->attributes->class(['text-gray-700']) }}>
        {{ $footer }}
    </footer>
</div>
```

### 内联组件视图

对于非常小的组件，同时管理组件类和组件的视图模板可能会显得繁琐。因此，你可以从 `render` 方法直接返回组件的标记：

```php
/**
 * Get the view / contents that represent the component.
 */
public function render(): string
{
    return <<<'blade'
        <div class="alert alert-danger">
            {{ $slot }}
        </div>
    blade;
}
```

#### 生成内联视图组件

要创建渲染内联视图的组件，你可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

### 动态组件

有时你可能需要渲染某个组件，但在运行时之前并不知道应渲染哪个组件。在这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件，根据运行时值或变量渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

### 手动注册组件

> [!WARNING]
> 以下关于手动注册组件的文档主要适用于编写包含视图组件的 Laravel 包的人。如果你不编写包，则这部分组件文档可能与你无关。

为自己的应用编写组件时，组件会自动在 `app/View/Components` 目录和 `resources/views/components` 目录中发现。

但是，如果你正在构建使用 Blade 组件的包，或将组件放在非约定目录中，则需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到该组件。通常应在包的服务提供者的 `boot` 方法中注册组件：

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

一旦组件被注册，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能拥有位于 `Package\Views\Components` 命名空间下的 `Calendar` 和 `ColorPicker` 组件：

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

这允许通过供应商命名空间使用 `package-name::` 语法调用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名转换为 Pascal Case 自动检测与之关联的类。子目录也支持使用「点」表示法。

## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。但是，匿名组件使用单个视图文件，并且没有关联的类。要定义匿名组件，只需将 Blade 模板放在 `resources/views/components` 目录中。例如，假设你已在 `resources/views/components/alert.blade.php` 定义了一个组件，则可以直接这样渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符来表示组件是否嵌套在 `components` 目录的更深位置。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，可以这样渲染：

```blade
<x-inputs.button/>
```

要通过 Artisan 创建匿名组件，可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令将在 `resources/views/components/forms/input.blade.php` 创建一个 Blade 文件，可以通过 `<x-forms.input />` 作为组件进行渲染。

### 匿名 Index 组件

有时，当某个组件由多个 Blade 模板组成时，你可能希望将该组件的模板分组到单个目录中。例如，假设一个「accordion」组件具有以下目录结构：

```text
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

此目录结构允许你像下面这样渲染 accordion 组件及其 item：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

但是，为了通过 `x-accordion` 渲染 accordion 组件，我们不得不将「index」accordion 组件模板放在 `resources/views/components` 目录中，而不是与其他 accordion 相关模板一起嵌套在 `accordion` 目录中。

值得庆幸的是，Blade 允许你在组件目录中放置一个与组件目录名同名的文件。当此模板存在时，即使它嵌套在目录中，也可以作为组件的「根」元素进行渲染。因此，我们可以继续使用上面示例中相同的 Blade 语法；但是，我们将调整目录结构如下：

```text
/resources/views/components/accordion/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

### 数据属性 / 属性

由于匿名组件没有任何关联的类，你可能想知道如何区分哪些数据应作为变量传递给组件，哪些属性应放在组件的属性包中。

你可以使用 `@props` 指令在组件 Blade 模板的顶部指定应被视为数据变量的属性。组件上的所有其他属性可通过组件的属性包访问。如果希望为数据变量提供默认值，可以将变量名指定为数组键，将默认值指定为数组值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

根据上面的组件定义，我们可以这样使用该组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

### 访问父级数据

有时你可能希望从父组件内访问子组件中的数据。在这种情况下，你可以使用 `@aware` 指令。例如，假设我们正在构建一个由父级 `<x-menu>` 和子级 `<x-menu.item>` 组成的复杂菜单组件：

```blade
<x-menu color="purple">
    <x-menu.item>...</x-menu.item>
    <x-menu.item>...</x-menu.item>
</x-menu>
```

`<x-menu>` 组件的实现可能如下所示：

```blade
<!-- /resources/views/components/menu/index.blade.php -->

@props(['color' => 'gray'])

<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>
```

因为 `color` prop 仅传递给父级（`<x-menu>`），所以它在 `<x-menu.item>` 内不可用。但是，如果我们使用 `@aware` 指令，也可以在 `<x-menu.item>` 内使其可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]
> `@aware` 指令无法访问未通过 HTML 属性显式传递给父组件的父级数据。未显式传递给父组件的默认 `@props` 值无法被 `@aware` 指令访问。

### 匿名组件路径

如前所述，匿名组件通常通过将 Blade 模板放在 `resources/views/components` 目录中来定义。但是，除了默认路径之外，你可能偶尔希望向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法的第一个参数接受匿名组件位置的「路径」，第二个参数是可选的「命名空间」，组件应放在该命名空间下。通常，应在某个应用[服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用此方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

如上面的示例所示，当注册组件路径时未指定前缀，这些路径下的组件也可以在 Blade 组件中无前缀地渲染。例如，如果在上面注册的路径中存在 `panel.blade.php` 组件，可以这样渲染：

```blade
<x-panel />
```

可以将「namespace」前缀作为第二个参数传递给 `anonymousComponentPath` 方法：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

当提供前缀时，可以通过在渲染组件时将命名空间前缀添加到组件名称来渲染该「命名空间」下的组件：

```blade
<x-dashboard::panel />
```

## 构建布局

### 使用组件构建布局

大多数 Web 应用在各个页面之间保持相同的一般布局。如果我们必须在创建的每个视图中重复整个布局 HTML，那将非常繁琐且难以维护。值得庆幸的是，可以将此布局方便地定义为单个 Blade 组件，然后在整个应用中使用它。

#### 定义布局组件

例如，假设我们正在构建一个「todo」列表应用。我们可以定义一个 `layout` 组件，如下所示：

```blade
<!-- resources/views/components/layout.blade.php -->

<html>
    <head>
        <title>{{ $title ?? 'Todo Manager' }}</title>
    </head>
    <body>
        <h1>Todos</h1>
        <hr/>
        {{ $slot }}
    </body>
</html>
```

#### 应用布局组件

一旦定义了 `layout` 组件，我们就可以创建一个使用该组件的 Blade 视图。在本例中，我们将定义一个简单的视图来显示任务列表：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容将提供给 `layout` 组件内的默认 `$slot` 变量。你可能已经注意到，如果提供了 `$title` 插槽，我们的 layout 也会遵循它；否则，将显示默认标题。我们可以使用组件文档中讨论的标准插槽语法从任务列表视图注入自定义标题：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    <x-slot:title>
        Custom Title
    </x-slot>

    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

现在我们已经定义了 layout 和任务列表视图，我们只需要从路由返回 `task` 视图：

```php
use App\Models\Task;

Route::get('/tasks', function () {
    return view('tasks', ['tasks' => Task::all()]);
});
```

### 使用模板继承构建布局

#### 定义布局

布局也可以通过「模板继承」创建。这是组件 出现之前构建应用的主要方式。

让我们从一个简单的示例开始。首先，我们将考察一个页面布局。由于大多数 Web 应用在各个页面之间保持相同的一般布局，因此将此布局定义为单个 Blade 视图非常方便：

```blade
<!-- resources/views/layouts/app.blade.php -->

<html>
    <head>
        <title>App Name - @yield('title')</title>
    </head>
    <body>
        @section('sidebar')
            This is the master sidebar.
        @show

        <div class="container">
            @yield('content')
        </div>
    </body>
</html>
```

如你所见，此文件包含典型的 HTML 标记。但请注意 `@section` 和 `@yield` 指令。顾名思义，`@section` 指令定义内容的一部分，而 `@yield` 指令用于显示给定 section 的内容。

现在我们已经为应用定义了一个布局，让我们定义一个继承该布局的子页面。

#### 扩展布局

定义子视图时，使用 `@extends` Blade 指令指定子视图应「继承」的布局。扩展 Blade 布局的视图可以使用 `@section` 指令将内容注入到布局的 section 中。请记住，如上面的示例所示，这些 section 的内容将使用 `@yield` 在布局中显示：

```blade
<!-- resources/views/child.blade.php -->

@extends('layouts.app')

@section('title', 'Page Title')

@section('sidebar')
    @@parent

    <p>This is appended to the master sidebar.</p>
@endsection

@section('content')
    <p>This is my body content.</p>
@endsection
```

在此示例中，`sidebar` section 使用 `@@parent` 指令将内容附加（而非覆盖）到布局的 sidebar。`@@parent` 指令将在视图渲染时被布局的内容替换。

> [!NOTE]
> 与前面的示例相反，此 `sidebar` section 以 `@endsection` 结尾，而不是 `@show`。`@endsection` 指令只会定义一个 section，而 `@show` 指令将定义并**立即 yield** 该 section。

`@yield` 指令也接受默认值作为其第二个参数。如果要 yield 的 section 未定义，则将渲染该值：

```blade
@yield('content', 'Default content')
```

## 表单

### CSRF 字段

每当你在应用中定义 HTML 表单时，都应在表单中包含一个隐藏的 CSRF 令牌字段，以便 [CSRF 保护](/topic/Laravel%2013.x/kpv136298w.html) 中间件可以验证请求。你可以使用 `@csrf` Blade 指令来生成该令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

### Method 字段

由于 HTML 表单无法发起 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 谓词。`@method` Blade 指令可以为你创建此字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

### 验证错误

`@error` 指令可用于快速检查给定属性是否存在[验证错误消息](/topic/Laravel%2013.x/e296oew9q7.html)。在 `@error` 指令内，你可以输出 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">Post Title</label>

<input
    id="title"
    type="text"
    class="@error('title') is-invalid @enderror"
/>

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

由于 `@error` 指令会编译为一条「if」语句，你可以使用 `@else` 指令在该属性不存在错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror"
/>
```

你可以将[特定错误 bag 的名称](/topic/Laravel%2013.x/e296oew9q7.html) 作为第二个参数传递给 `@error` 指令，以在包含多个表单的页面中检索验证错误消息：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email', 'login') is-invalid @enderror"
/>

@error('email', 'login')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

## Stacks

Blade 允许你推送到具名 stacks，这些 stacks 可以在另一个视图或布局的其他地方进行渲染。当需要指定子视图所需的任何 JavaScript 库时，这特别有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果希望在给定的布尔表达式求值为 `true` 时才 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以根据需要多次推送到 stack。要渲染完整的 stack 内容，请将 stack 名称传递给 `@stack` 指令：

```blade
<head>
    <!-- Head Contents -->

    @stack('scripts')
</head>
```

如果你希望将内容前置到 stack 的开头，应使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// Later...

@prepend('scripts')
    This will be first...
@endprepend
```

`@hasstack` 指令可用于判断 stack 是否为空：

```blade
@hasstack('list')
    <ul>
        @stack('list')
    </ul>
@endif
```

## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 中检索服务。传递给 `@inject` 的第一个参数是服务将要放入的变量名称，第二个参数是你希望解析的服务的类名或接口名：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

## 渲染内联 Blade 模板

有时你可能需要将原始的 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` Facade 提供的 `render` 方法来实现。`render` 方法接受 Blade 模板字符串以及一个可选的提供给模板的数据数组：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过将内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果你希望 Laravel 在渲染 Blade 模板后删除这些临时文件，可以向方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

## 渲染 Blade Fragments

在使用诸如 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你可能偶尔需要仅在 HTTP 响应中返回部分 Blade 模板。Blade「fragments」正是为此而设计的。首先，将部分 Blade 模板放在 `@fragment` 和 `@endfragment` 指令中：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用此模板的视图时，可以调用 `fragment` 方法指定响应中仅应包含指定的 fragment：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的 fragment。否则，将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图 fragment。这些 fragment 将连接在一起：

```php
view('dashboard', ['users' => $users])
    ->fragments(['user-list', 'comment-list']);

view('dashboard', ['users' => $users])
    ->fragmentsIf(
        $request->hasHeader('HX-Request'),
        ['user-list', 'comment-list']
    );
```

## 扩展 Blade

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它将使用该指令包含的表达式调用提供的回调。

以下示例创建一个 `@datetime($var)` 指令，用于格式化给定的 `$var`，该变量应为 `DateTime` 的实例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**