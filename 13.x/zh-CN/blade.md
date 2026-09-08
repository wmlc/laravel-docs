# Blade 模板

- [简介](#introduction)
    - [使用 Livewire 强化 Blade](#supercharging-blade-with-livewire)
- [显示数据](#displaying-data)
    - [HTML 实体编码](#html-entity-encoding)
    - [Blade 与 JavaScript 框架](#blade-and-javascript-frameworks)
- [Blade 指令](#blade-directives)
    - [If 语句](#if-statements)
    - [Switch 语句](#switch-statements)
    - [循环](#loops)
    - [循环变量](#the-loop-variable)
    - [条件类](#conditional-classes)
    - [附加属性](#additional-attributes)
    - [包含子视图](#including-subviews)
    - [`@once` 指令](#the-once-directive)
    - [原生 PHP](#raw-php)
    - [字体](#fonts)
    - [注释](#comments)
- [组件](#components)
    - [渲染组件](#rendering-components)
    - [索引组件](#index-components)
    - [向组件传递数据](#passing-data-to-components)
    - [组件属性](#component-attributes)
    - [保留关键字](#reserved-keywords)
    - [插槽](#slots)
    - [内联组件视图](#inline-component-views)
    - [动态组件](#dynamic-components)
    - [手动注册组件](#manually-registering-components)
- [匿名组件](#anonymous-components)
    - [匿名索引组件](#anonymous-index-components)
    - [数据属性 / 特性](#data-properties-attributes)
    - [访问父级数据](#accessing-parent-data)
    - [匿名组件路径](#anonymous-component-paths)
- [构建布局](#building-layouts)
    - [使用组件构建布局](#layouts-using-components)
    - [使用模板继承构建布局](#layouts-using-template-inheritance)
- [表单](#forms)
    - [CSRF 字段](#csrf-field)
    - [方法字段](#method-field)
    - [验证错误](#validation-errors)
- [栈](#stacks)
- [服务注入](#service-injection)
- [渲染内联 Blade 模板](#rendering-inline-blade-templates)
- [渲染 Blade 片段](#rendering-blade-fragments)
- [扩展 Blade](#extending-blade)
    - [自定义 Echo 处理器](#custom-echo-handlers)
    - [自定义 If 语句](#custom-if-statements)

<a name="introduction"></a>
## 简介

Blade 是 Laravel 内置的简洁而强大的模板引擎。与某些 PHP 模板引擎不同，Blade 并不限制你在模板中使用纯 PHP 代码。实际上，所有 Blade 模板都会被编译为纯 PHP 代码并缓存，直到被修改，这意味着 Blade 对应用程序几乎零开销。Blade 模板文件使用 `.blade.php` 文件扩展名，通常存放在 `resources/views` 目录中。

Blade 视图可以通过全局 `view` 辅助函数从路由或控制器返回。当然，正如 [视图](/docs/{{version}}/views) 文档中所述，可以使用 `view` 辅助函数的第二个参数将数据传递给 Blade 视图：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

<a name="supercharging-blade-with-livewire"></a>
### 使用 Livewire 强化 Blade

想将你的 Blade 模板提升到更高水平，轻松构建动态界面吗？试试 [Laravel Livewire](https://livewire.laravel.com)。Livewire 让你编写 Blade 组件，并为其增强动态功能，这些功能通常只有通过 React、Svelte 或 Vue 等前端框架才能实现，提供了一种在不引入许多 JavaScript 框架的复杂性、客户端渲染或构建步骤的情况下构建现代、响应式前端的好方法。

<a name="displaying-data"></a>
## 显示数据

可以通过将变量包裹在花括号中来显示传递给 Blade 视图的数据。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

你可以这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> [!NOTE]
> Blade 的 `{{ }}` echo 语句会自动通过 PHP 的 `htmlspecialchars` 函数来防止 XSS 攻击。

你不仅限于显示传递给视图的变量内容。你还可以 echo 任何 PHP 函数的结果。实际上，你可以在 Blade echo 语句中放入任何你想要的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

<a name="html-entity-encoding"></a>
### HTML 实体编码

默认情况下，Blade（以及 Laravel 的 `e` 函数）会对 HTML 实体进行双重编码。如果你想禁用双重编码，可以从 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Blade::withoutDoubleEncoding();
    }
}
```

<a name="displaying-unescaped-data"></a>
#### 显示未转义的数据

默认情况下，Blade `{{ }}` 语句会自动通过 PHP 的 `htmlspecialchars` 函数以防止 XSS 攻击。如果你不想让你的数据被转义，可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 在 echo 由应用程序用户提供的信息内容时要非常小心。在显示用户提供的信息时，通常应使用转义的双花括号语法以防止 XSS 攻击。

<a name="blade-and-javascript-frameworks"></a>
### Blade 与 JavaScript 框架

由于许多 JavaScript 框架也使用"花括号"来指示某个表达式应在浏览器中显示，你可以使用 `@` 符号告知 Blade 渲染引擎某个表达式应保持原样。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在此示例中，`@` 符号会被 Blade 移除；然而，`{{ name }}` 表达式将保持不被 Blade 引擎处理，从而允许它由你的 JavaScript 框架渲染。

`@` 符号也可用于转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

<a name="rendering-json"></a>
#### 渲染 JSON

有时你可能会向视图传递一个数组，意图将其渲染为 JSON 以便初始化 JavaScript 变量。例如：

```php
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

不过，你不必手动调用 `json_encode`，可以使用 `Illuminate\Support\Js::from` 方法。`from` 方法接受与 PHP 的 `json_encode` 函数相同的参数；但不同之处在于，它会确保生成的 JSON 已被正确转义，以便包含在 HTML 引号中。`from` 方法将返回一个 `JSON.parse` JavaScript 语句字符串，该语句会将给定对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

Laravel 应用骨架的最新版本包含一个 `Js` facade，它让你在 Blade 模板中方便地访问此功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你应仅使用 `Js::from` 方法将现有变量渲染为 JSON。Blade 模板基于正则表达式，尝试将复杂表达式传递给该指令可能会导致意外的失败。

<a name="the-at-verbatim-directive"></a>
#### `@verbatim` 指令

如果你在模板的大部分区域显示 JavaScript 变量，可以将 HTML 包裹在 `@verbatim` 指令中，这样就不必在每个 Blade echo 语句前加 `@` 符号：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

<a name="blade-directives"></a>
## Blade 指令

除了模板继承和显示数据之外，Blade 还为常见的 PHP 控制结构（如条件语句和循环）提供了便捷的快捷方式。这些快捷方式提供了一种非常简洁、精炼的方式来处理 PHP 控制结构，同时与 PHP 中的对应写法保持熟悉。

<a name="if-statements"></a>
### If 语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令来构造 `if` 语句。这些指令的功能与其 PHP 对应写法完全相同：

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

除了已经讨论过的条件指令之外，`@isset` 和 `@empty` 指令可作为对应 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records 已定义且不为 null...
@endisset

@empty($records)
    // $records 为"空"...
@endempty
```

<a name="authentication-directives"></a>
#### 认证指令

`@auth` 和 `@guest` 指令可用于快速判断当前用户是否已[认证](/docs/{{version}}/authentication) 或是否为访客：

```blade
@auth
    // 用户已认证...
@endauth

@guest
    // 用户未认证...
@endguest
```

如果需要，你可以指定在使用 `@auth` 和 `@guest` 指令时应检查的认证 guard：

```blade
@auth('admin')
    // 用户已认证...
@endauth

@guest('admin')
    // 用户未认证...
@endguest
```

<a name="environment-directives"></a>
#### 环境指令

你可以使用 `@production` 指令检查应用程序是否运行在生产环境中：

```blade
@production
    // 生产环境特定的内容...
@endproduction
```

或者，你可以使用 `@env` 指令判断应用程序是否运行在特定的环境中：

```blade
@env('staging')
    // 应用程序运行在"staging"环境中...
@endenv

@env(['staging', 'production'])
    // 应用程序运行在"staging"或"production"环境中...
@endenv
```

<a name="section-directives"></a>
#### 区块指令

你可以使用 `@hasSection` 指令判断模板继承区块是否包含内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

你可以使用 `sectionMissing` 指令判断某个区块是否没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

<a name="session-directives"></a>
#### 会话指令

`@session` 指令可用于判断某个[会话](/docs/{{version}}/session) 值是否存在。如果会话值存在，则 `@session` 和 `@endsession` 指令之间的模板内容会被求值。在 `@session` 指令的内容中，你可以 echo `$value` 变量来显示会话值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

<a name="context-directives"></a>
#### 上下文指令

`@context` 指令可用于判断某个[上下文](/docs/{{version}}/context) 值是否存在。如果上下文值存在，则 `@context` 和 `@endcontext` 指令之间的模板内容会被求值。在 `@context` 指令的内容中，你可以 echo `$value` 变量来显示上下文值：

```blade
@context('canonical')
    <link href="{{ $value }}" rel="canonical">
@endcontext
```

<a name="switch-statements"></a>
### Switch 语句

可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令构造 switch 语句：

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

<a name="loops"></a>
### 循环

除了条件语句之外，Blade 还为处理 PHP 的循环结构提供了简单的指令。同样，这些指令中的每一个都与其 PHP 对应写法功能完全相同：

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
> 在 `foreach` 循环中迭代时，你可以使用[循环变量](#the-loop-variable) 来获取关于循环的宝贵信息，例如你是在第一次还是最后一次迭代中。

使用循环时，你也可以使用 `@continue` 和 `@break` 指令跳过当前迭代或结束循环：

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

你也可以将续行或中断条件包含在指令声明中：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

<a name="the-loop-variable"></a>
### 循环变量

在 `foreach` 循环中迭代时，循环内部会提供一个 `$loop` 变量。该变量提供对一些有用信息的访问，例如当前循环索引，以及这是否是循环的第一次或最后一次迭代：

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

如果你处于嵌套循环中，可以通过 `parent` 属性访问父循环的 `$loop` 变量：

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

<div class="overflow-auto">

| 属性 | 说明 |
| ------------------ | ------------------------------------------------------ |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。 |
| `$loop->iteration` | 当前循环迭代（从 1 开始）。 |
| `$loop->remaining` | 循环中剩余的迭代次数。 |
| `$loop->count`     | 被迭代数组中的总项数。 |
| `$loop->first`     | 是否为循环的第一次迭代。 |
| `$loop->last`      | 是否为循环的最后一次迭代。 |
| `$loop->even`      | 是否为循环的偶数次迭代。 |
| `$loop->odd`       | 是否为循环的奇数次迭代。 |
| `$loop->depth`     | 当前循环的嵌套层级。 |
| `$loop->parent`    | 在嵌套循环中，父级的循环变量。 |

</div>

<a name="conditional-classes"></a>
### 条件类与样式

`@class` 指令有条件地编译一个 CSS 类字符串。该指令接受一个类数组，其中数组键包含你希望添加的类或类组合，而值为布尔表达式。如果数组元素具有数字键，它将始终包含在编译后的类列表中：

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

同样地，`@style` 指令可用于有条件地向 HTML 元素添加内联 CSS 样式：

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

<a name="additional-attributes"></a>
### 附加属性

为方便起见，你可以使用 `@checked` 指令轻松指示某个给定的 HTML 复选框输入是否被"勾选"。如果提供的条件求值为 `true`，该指令会 echo `checked`：

```blade
<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
```

同样地，`@selected` 指令可用于指示某个给定的 select 选项是否应被"选中"：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于指示某个给定元素是否应被"禁用"：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

还有，`@readonly` 指令可用于指示某个给定元素是否应被"只读"：

```blade
<input
    type="email"
    name="email"
    value="email@laravel.com"
    @readonly($user->isNotAdmin())
/>
```

另外，`@required` 指令可用于指示某个给定元素是否应被"必填"：

```blade
<input
    type="text"
    name="title"
    value="title"
    @required($user->isAdmin())
/>
```

<a name="including-subviews"></a>
### 包含子视图

> [!NOTE]
> 虽然你可以自由使用 `@include` 指令，但 Blade [组件](#components) 提供了类似的功能，并在数据绑定和属性绑定等方面提供了比 `@include` 指令更多的好处。

Blade 的 `@include` 指令允许你从另一个视图中包含一个 Blade 视图。父视图可用的所有变量都将对包含视图可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

尽管包含的视图会继承父视图中所有可用的数据，你也可以传递一个额外的数据数组，这些数据应可供包含视图使用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 会抛出一个错误。如果你想包含一个可能存在或不存在的视图，应使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你想在某个布尔表达式求值为 `true` 或 `false` 时 `@include` 一个视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要包含给定视图数组中存在的第一个视图，可以使用 `includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

如果你想包含一个不继承父视图任何变量的视图，可以使用 `@includeIsolated` 指令。包含的视图只能访问你显式传递的变量：

```blade
@includeIsolated('view.name', ['user' => $user])
```

> [!WARNING]
> 你应避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们指向的是缓存的、已编译视图的位置。

<a name="rendering-views-for-collections"></a>
#### 为集合渲染视图

你可以将循环和包含通过 Blade 的 `@each` 指令组合成一行：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中的每个元素渲染的视图。第二个参数是你希望迭代的数组或集合，而第三个参数是将在视图中赋给当前迭代的变量名。因此，例如，如果你正在迭代一个 `jobs` 数组，通常你会希望在视图中作为 `job` 变量访问每个 job。当前迭代的数组键将在视图中作为 `key` 变量可用。

你还可以向 `@each` 指令传递第四个参数。该参数决定当给定数组为空时将渲染的视图。

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图的变量。如果子视图需要这些变量，你应使用 `@foreach` 和 `@include` 指令代替。

<a name="the-once-directive"></a>
### `@once` 指令

`@once` 指令允许你定义模板中的一部分内容，在每个渲染周期中只会被求值一次。这对于使用[栈](#stacks) 将一段给定的 JavaScript 推送到页面的头部可能很有用。例如，如果你在一个循环中渲染一个给定的[组件](#components)，你可能希望只在组件第一次渲染时将 JavaScript 推送到头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令通常与 `@push` 或 `@prepend` 指令结合使用，因此提供了 `@pushOnce` 和 `@prependOnce` 指令以方便使用：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript...
    </script>
@endPushOnce
```

如果你正在从两个不同的 Blade 模板推送重复的内容，应提供唯一标识符作为 `@pushOnce` 指令的第二个参数，以确保内容只被渲染一次：

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

<a name="raw-php"></a>
### 原生 PHP

在某些情况下，将 PHP 代码嵌入到你的视图中很有用。你可以使用 Blade 的 `@php` 指令在模板中执行一段纯 PHP 代码：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只需要使用 PHP 来导入一个类，可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

可以向 `@use` 指令提供第二个参数来为导入的类设置别名：

```blade
@use('App\Models\Flight', 'FlightModel')
```

如果你在同一命名空间中有多个类，可以将这些类的导入分组：

```blade
@use('App\Models\{Flight, Airport}')
```

`@use` 指令还支持通过为导入路径添加 `function` 或 `const` 修饰符来导入 PHP 函数和常量：

```blade
@use(function App\Helpers\format_currency)
@use(const App\Constants\MAX_ATTEMPTS)
```

与类导入一样，函数和常量也支持别名：

```blade
@use(function App\Helpers\format_currency, 'formatMoney')
@use(const App\Constants\MAX_ATTEMPTS, 'MAX_TRIES')
```

分组导入也同时支持 `function` 和 `const` 修饰符，允许你在单个指令中从同一命名空间导入多个符号：

```blade
@use(function App\Helpers\{format_currency, format_date})
@use(const App\Constants\{MAX_ATTEMPTS, DEFAULT_TIMEOUT})
```

<a name="fonts"></a>
### 字体

使用 [Laravel 的 Vite 字体优化](/docs/{{version}}/vite#working-with-fonts) 时，你可以使用 `@fonts` 指令在应用程序的布局中渲染你配置的字体预加载链接和内置字体 CSS：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @fonts
    @vite('resources/js/app.js')
</head>
```

`@fonts` 指令会渲染在你的 `vite.config.js` 文件中配置的所有字体系列。该指令通常应放置在应用程序根布局的 `<head>` 中，位于任何使用这些字体的内容之前。

如果某个页面只需要部分你配置的字体，可以向该指令传递一个或多个字体别名：

```blade
{{-- 加载单个字体别名... --}}
@fonts('sans')

{{-- 加载多个字体别名... --}}
@fonts(['sans', 'mono'])
```

字体别名是使用 `alias` 选项在 Vite 配置中定义字体时配置的。`@fonts` 指令调用由 `Vite` facade 提供的 `fonts` 方法，该方法也可以直接调用：

```blade
{{ Vite::fonts(['sans', 'mono']) }}
```

<a name="comments"></a>
### 注释

Blade 还允许你在视图中定义注释。不过，与 HTML 注释不同，Blade 注释不会包含在应用程序返回的 HTML 中：

```blade
{{-- 此注释不会出现在渲染后的 HTML 中 --}}
```

<a name="components"></a>
## 组件

组件和插槽提供的好处与区块、布局和包含类似；然而，有些人可能会发现组件和插槽的心智模型更容易理解。编写组件有两种方式：基于类的组件和匿名组件。

要创建基于类的组件，可以使用 `make:component` Artisan 命令。为了说明如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令会将组件放置在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为组件创建一个视图模板。该视图将放置在 `resources/views/components` 目录中。为你自己的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动被发现，因此通常不需要进一步的组件注册。

你也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令将在 `app/View/Components/Forms` 目录中创建一个 `Input` 组件，视图将放置在 `resources/views/components/forms` 目录中。

<a name="manually-registering-package-components"></a>
#### 手动注册包组件

当你为自己的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动被发现。

但是，如果你正在构建一个使用 Blade 组件的包，你将需要手动注册你的组件类及其 HTML 标签别名。通常你应在包的[服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

一旦你的组件被注册，就可以使用其标签别名来渲染它：

```blade
<x-package-alert/>
```

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能拥有位于 `Package\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过供应商命名空间使用 `package-name::` 语法来使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名转换为 PascalCase 来自动检测链接到该组件的类的名称。也支持使用"点"表示法的子目录。

<a name="rendering-components"></a>
### 渲染组件

要显示组件，可以在某个 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后跟组件类的 kebab-case 名称：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类嵌套在 `app/View/Components` 目录的更深处，可以使用 `.` 字符来表示目录嵌套。例如，假设一个组件位于 `app/View/Components/Inputs/Button.php`，我们可以这样渲染它：

```blade
<x-inputs.button/>
```

如果你想有条件地渲染你的组件，可以在组件类上定义 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，该组件将不会被渲染：

```php
use Illuminate\Support\Str;

/**
 * 组件是否应该被渲染
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

<a name="index-components"></a>
### 索引组件

有时组件是某个组件组的一部分，你可能希望将相关组件分组到单个目录中。例如，想象一个带有以下类结构的"card"组件：

```text
App\Views\Components\Card\Card
App\Views\Components\Card\Header
App\Views\Components\Card\Body
```

由于根 `Card` 组件嵌套在 `Card` 目录中，你可能会认为需要通过 `<x-card.card>` 来渲染该组件。然而，当组件的文件名与组件目录的名称匹配时，Laravel 会自动假定该组件是"根"组件，并允许你在不重复目录名的情况下渲染该组件：

```blade
<x-card>
    <x-card.header>...</x-card.header>
    <x-card.body>...</x-card.body>
</x-card>
```

<a name="passing-data-to-components"></a>
### 向组件传递数据

你可以使用 HTML 属性向 Blade 组件传递数据。硬编码的原始值可以通过简单的 HTML 属性字符串传递给组件。PHP 表达式和变量应通过以 `:` 字符作为前缀的属性传递给组件：

```blade
<x-alert type="error" :message="$message"/>
```

你应在组件类的构造函数中定义组件的所有数据属性。组件上的所有公共属性将自动可供组件的视图使用。不需要将数据从组件的 `render` 方法传递给视图：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Alert extends Component
{
    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    /**
     * 获取表示组件的视图 / 内容。
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

当你的组件被渲染时，你可以通过按名称 echo 变量来显示组件公共变量的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

<a name="casing"></a>
#### 大小写约定

组件构造函数的参数应使用 `camelCase` 指定，而在 HTML 属性中引用参数名时应使用 `kebab-case`。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 */
public function __construct(
    public string $alertType,
) {}
```

`$alertType` 参数可以这样提供给组件：

```blade
<x-alert alert-type="danger" />
```

<a name="short-attribute-syntax"></a>
#### 短属性语法

向组件传递属性时，你也可以使用"短属性"语法。这往往很方便，因为属性名经常与它们对应的变量名相同：

```blade
{{-- 短属性语法... --}}
<x-profile :$userId :$name />

{{-- 等价于... --}}
<x-profile :user-id="$userId" :name="$name" />
```

<a name="escaping-attribute-rendering"></a>
#### 转义属性渲染

由于某些 JavaScript 框架（如 Alpine.js）也使用以冒号作为前缀的属性，你可以使用双冒号（`::`）前缀来告知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

```blade
<x-button ::class="{ danger: isDeleting }">
    Submit
</x-button>
```

Blade 将渲染以下 HTML：

```blade
<button :class="{ danger: isDeleting }">
    Submit
</button>
```

<a name="component-methods"></a>
#### 组件方法

除了公共变量可供组件模板使用之外，组件上的任何公共方法也可以被调用。例如，想象一个拥有 `isSelected` 方法的组件：

```php
/**
 * 判断给定的选项是否为当前选中的选项。
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以通过调用与该方法名匹配的变量来从组件模板中执行此方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

<a name="using-attributes-slots-within-component-class"></a>
#### 在组件类中访问属性和插槽

Blade 组件还允许你访问组件名称、属性以及组件类 render 方法内的插槽。但是，为了访问这些数据，你应从组件的 `render` 方法返回一个闭包：

```php
use Closure;

/**
 * 获取表示组件的视图 / 内容。
 */
public function render(): Closure
{
    return function () {
        return '<div {{ $attributes }}>Components content</div>';
    };
}
```

组件的 `render` 方法返回的闭包也可以接收 `$data` 数组作为其唯一参数。该数组将包含提供关于该组件信息的若干元素：

```php
return function (array $data) {
    // $data['componentName'];
    // $data['attributes'];
    // $data['slot'];

    return '<div {{ $attributes }}>Components content</div>';
}
```

> [!WARNING]
> `$data` 数组中的元素绝不应被直接嵌入到组件的 `render` 方法返回的 Blade 字符串中，因为这样做可能通过恶意的属性内容允许远程代码执行。

`componentName` 等于 HTML 标签中 `x-` 前缀之后的名称。因此 `<x-alert />` 的 `componentName` 将是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个包含组件插槽内容的 `Illuminate\Support\HtmlString` 实例。

该闭包应返回一个字符串。如果返回的字符串对应于一个已存在的视图，则会渲染该视图；否则，该返回字符串将被作为内联 Blade 视图求值。

<a name="additional-dependencies"></a>
#### 附加依赖

如果你的组件需要来自 Laravel [服务容器](/docs/{{version}}/container) 的依赖，你可以将它们列在组件任何数据属性之前，它们会被容器自动注入：

```php
use App\Services\AlertCreator;

/**
 * 创建组件实例。
 */
public function __construct(
    public AlertCreator $creator,
    public string $type,
    public string $message,
) {}
```

<a name="hiding-attributes-and-methods"></a>
#### 隐藏属性 / 方法

如果你想阻止某些公共方法或属性作为变量暴露给组件模板，可以将它们添加到组件的 `$except` 数组属性中：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * 不应暴露给组件模板的属性 / 方法。
     *
     * @var array
     */
    protected $except = ['type'];

    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
    ) {}
}
```

<a name="component-attributes"></a>
### 组件属性

我们已经探讨了如何向组件传递数据属性；但是，有时你可能需要指定额外的 HTML 属性（如 `class`），这些属性不是组件运行所需数据的一部分。通常，你希望将这些额外属性传递到组件模板的根元素。例如，想象我们想要这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性将自动被添加到组件的"属性包"中。该属性包通过 `$attributes` 变量自动供组件使用。所有属性都可以通过 echo 该变量在组件内渲染：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> [!WARNING]
> 目前不支持在组件标签内使用 `@env` 等指令。例如，`<x-alert :live="@env('production')"/>` 将不会被编译。

<a name="default-merged-attributes"></a>
#### 默认 / 合并属性

有时你可能需要为属性指定默认值，或将额外的值合并到组件的某些属性中。为此，你可以使用属性包的 `merge` 方法。该方法在定义应始终应用于组件的一组默认 CSS 类时特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

如果我们假设该组件是这样使用的：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

该组件最终渲染的 HTML 将如下所示：

```blade
<div class="alert alert-error mb-4">
    <!-- $message 变量的内容 -->
</div>
```

<a name="conditionally-merge-classes"></a>
#### 有条件地合并类

有时你可能希望在给定条件为 `true` 时合并类。你可以通过 `class` 方法来实现，该方法接受一个类数组，其中数组键包含你希望添加的类或类组合，而值为布尔表达式。如果数组元素具有数字键，它将始终被包含在编译后的类列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果你需要将其他属性合并到你的组件上，可以将 `merge` 方法链式调用在 `class` 方法之后：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]
> 如果你需要在不应接收合并属性的其他 HTML 元素上有条件地编译类，可以使用 [@class 指令](#conditional-classes)。

<a name="non-class-attribute-merging"></a>
#### 非类属性合并

当合并非 `class` 属性时，提供给 `merge` 方法的值将被视为该属性的"默认"值。但是，与 `class` 属性不同，这些属性不会与注入的属性值合并。相反，它们会被覆盖。例如，`button` 组件的实现可能如下所示：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要使用自定义 `type` 渲染按钮组件，可以在消费组件时指定它。如果未指定 type，将使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

此示例中 `button` 组件渲染的 HTML 将是：

```blade
<button type="submit">
    Submit
</button>
```

如果你希望除 `class` 之外的某个属性将其默认值和注入值连接在一起，可以使用 `prepends` 方法。在此示例中，`data-controller` 属性将始终以 `profile-controller` 开头，任何额外注入的 `data-controller` 值都将放置在此默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

<a name="filtering-attributes"></a>
#### 检索与过滤属性

你可以使用 `filter` 方法过滤属性。该方法接受一个闭包，如果你希望保留属性包中的某个属性，该闭包应返回 `true`：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为方便起见，你可以使用 `whereStartsWith` 方法检索键以给定字符串开头的所有属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，`whereDoesntStartWith` 方法可用于排除键以给定字符串开头的所有属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你想检查某个属性是否存在于组件上，可以使用 `has` 方法。该方法接受属性名作为其唯一参数，并返回一个布尔值，指示该属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class 属性存在</div>
@endif
```

如果向 `has` 方法传递一个数组，该方法将判断给定属性是否全部存在于组件上：

```blade
@if ($attributes->has(['name', 'class']))
    <div>所有属性都存在</div>
@endif
```

`hasAny` 方法可用于判断给定属性中是否有任何一个存在于组件上：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>其中一个属性存在</div>
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

`except` 方法可用于检索除具有给定键之外的所有属性：

```blade
{{ $attributes->except(['class']) }}
```

<a name="reserved-keywords"></a>
### 保留关键字

默认情况下，一些关键字被保留供 Blade 内部用于渲染组件。以下关键字不能在你的组件中定义为公共属性或方法名：

<div class="content-list" markdown="1">

- `data`
- `render`
- `resolve`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

</div>

<a name="slots"></a>
### 插槽

你经常需要通过"插槽"向组件传递额外内容。组件插槽通过 echo `$slot` 变量来渲染。为了探索这个概念，让我们想象一个 `alert` 组件具有以下标记：

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

有时组件可能需要在组件内的不同位置渲染多个不同的插槽。让我们修改我们的 alert 组件，以允许注入一个"title"插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签定义命名插槽的内容。任何不在显式 `x-slot` 标签内的内容都将通过 `$slot` 变量传递给组件：

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

此外，`hasActualContent` 方法可用于判断插槽是否包含任何不是 HTML 注释的"实际"内容：

```blade
@if ($slot->hasActualContent())
    The scope has non-comment content.
@endif
```

<a name="scoped-slots"></a>
#### 作用域插槽

如果你使用过诸如 Vue 之类的 JavaScript 框架，你可能熟悉"作用域插槽"，它允许你在插槽中访问组件内的数据或方法。你可以通过在组件上定义公共方法或属性，并通过 `$component` 变量在插槽内访问该组件，在 Laravel 中实现类似的行为。在此示例中，我们假设 `x-alert` 组件在其组件类上定义了一个公共的 `formatAlert` 方法：

```blade
<x-alert>
    <x-slot:title>
        {{ $component->formatAlert('Server Error') }}
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

<a name="slot-attributes"></a>
#### 插槽属性

与 Blade 组件一样，你可以为插槽分配额外的[属性](#component-attributes)，例如 CSS 类名：

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

要与插槽属性交互，你可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请参阅[组件属性](#component-attributes) 文档：

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

<a name="inline-component-views"></a>
### 内联组件视图

对于非常小的组件，同时管理组件类和组件视图模板可能会显得繁琐。因此，你可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取表示组件的视图 / 内容。
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

<a name="generating-inline-view-components"></a>
#### 生成内联视图组件

要创建一个渲染内联视图的组件，可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

<a name="dynamic-components"></a>
### 动态组件

有时你可能需要渲染一个组件，但要到运行时才知道应该渲染哪个组件。在这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件根据运行时的值或变量来渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

<a name="manually-registering-components"></a>
### 手动注册组件

> [!WARNING]
> 以下关于手动注册组件的文档主要适用于那些编写包含视图组件的 Laravel 包的人。如果你不是在编写包，组件文档的这一部分可能与你无关。

当你为自己的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动被发现。

但是，如果你正在构建一个使用 Blade 组件的包，或将组件放在非传统目录中，你将需要手动注册你的组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到该组件。通常你应在包的[服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

一旦你的组件被注册，就可以使用其标签别名来渲染它：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能拥有位于 `Package\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过供应商命名空间使用 `package-name::` 语法来使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名转换为 PascalCase 来自动检测链接到该组件的类的名称。也支持使用"点"表示法的子目录。

<a name="anonymous-components"></a>
## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。但是，匿名组件使用单个视图文件，并且没有相关联的类。要定义匿名组件，你只需在 `resources/views/components` 目录中放置一个 Blade 模板。例如，假设你在 `resources/views/components/alert.blade.php` 处定义了一个组件，你可以像这样简单地渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符来表示组件是否嵌套在 `components` 目录的更深处。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，你可以这样渲染它：

```blade
<x-inputs.button/>
```

要通过 Artisan 创建匿名组件，可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令将在 `resources/views/components/forms/input.blade.php` 处创建一个 Blade 文件，可以通过 `<x-forms.input />` 作为组件渲染。

<a name="anonymous-index-components"></a>
### 匿名索引组件

有时，当一个组件由许多 Blade 模板组成时，你可能希望将给定组件的模板分组到单个目录中。例如，想象一个带有以下目录结构的"accordion"组件：

```text
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

此目录结构允许你像这样渲染 accordion 组件及其 item：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

但是，为了通过 `x-accordion` 渲染 accordion 组件，我们被迫将"索引"accordion 组件模板放置在 `resources/views/components` 目录中，而不是与其他 accordion 相关模板一起嵌套在 `accordion` 目录中。

幸运的是，Blade 允许你将与组件目录名匹配的文件放置在该组件目录本身内部。当此模板存在时，即使它嵌套在目录中，也可以作为组件的"根"元素渲染。因此，我们可以继续使用上面示例中给出的相同 Blade 语法；不过，我们将像这样调整我们的目录结构：

```text
/resources/views/components/accordion/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

<a name="data-properties-attributes"></a>
### 数据属性 / 特性

由于匿名组件没有任何相关联的类，你可能想知道如何区分哪些数据应作为变量传递给组件，哪些属性应放置在组件的[属性包](#component-attributes) 中。

你可以使用 `@props` 指令在组件 Blade 模板的顶部指定哪些属性应被视为数据变量。组件上的所有其他属性将通过组件的属性包可用。如果你想为数据变量提供默认值，可以将变量名指定为数组键，将默认值指定为数组值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

给定上面的组件定义，我们可以这样渲染组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

<a name="accessing-parent-data"></a>
### 访问父级数据

有时你可能希望在子组件中访问父组件的数据。在这些情况下，你可以使用 `@aware` 指令。例如，想象我们正在构建一个复杂的菜单组件，由父级 `<x-menu>` 和子级 `<x-menu.item>` 组成：

```blade
<x-menu color="purple">
    <x-menu.item>...</x-menu.item>
    <x-menu.item>...</x-menu.item>
</x-menu>
```

`<x-menu>` 组件可能具有以下实现：

```blade
<!-- /resources/views/components/menu/index.blade.php -->

@props(['color' => 'gray'])

<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>
```

因为 `color` prop 只传递给了父级（`<x-menu>`），它在 `<x-menu.item>` 内部将不可用。但是，如果我们使用 `@aware` 指令，我们也可以让它在 `<x-menu.item>` 内部可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]
> `@aware` 指令无法访问未通过 HTML 属性显式传递给父组件的父级数据。未显式传递给父组件的默认 `@props` 值无法通过 `@aware` 指令访问。

<a name="anonymous-component-paths"></a>
### 匿名组件路径

如前所述，匿名组件通常通过在 `resources/views/components` 目录中放置一个 Blade 模板来定义。但是，除了默认路径之外，你可能偶尔希望向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法接受匿名组件位置的"路径"作为第一个参数，并接受组件应放置在其下的可选"命名空间"作为第二个参数。通常，此方法应从你的某个应用程序[服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中调用：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

当组件路径像上面的示例一样在没有指定前缀的情况下注册时，它们也可以在没有相应前缀的情况下在你的 Blade 组件中渲染。例如，如果在上面注册的路径中存在一个 `panel.blade.php` 组件，它可以像这样渲染：

```blade
<x-panel />
```

"命名空间"前缀可以作为第二个参数提供给 `anonymousComponentPath` 方法：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

当提供了前缀时，该"命名空间"中的组件可以通过在渲染组件时将组件的命名空间作为前缀来渲染：

```blade
<x-dashboard::panel />
```

<a name="building-layouts"></a>
## 构建布局

<a name="layouts-using-components"></a>
### 使用组件构建布局

大多数 Web 应用程序在各种页面上保持相同的整体布局。如果不得不在我们创建的每个视图中重复整个布局 HTML，维护我们的应用程序将变得非常繁琐且困难。幸运的是，将这个布局定义为单个 [Blade 组件](#components) 并在整个应用程序中使用它很方便。

<a name="defining-the-layout-component"></a>
#### 定义布局组件

例如，想象我们正在构建一个"todo"列表应用程序。我们可能会定义一个看起来如下的 `layout` 组件：

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

<a name="applying-the-layout-component"></a>
#### 应用布局组件

一旦定义了 `layout` 组件，我们就可以创建一个使用该组件的 Blade 视图。在此示例中，我们将定义一个显示任务列表的简单视图：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容将提供给我们的 `layout` 组件中的默认 `$slot` 变量。你可能已经注意到，我们的 `layout` 也会在提供时接受一个 `$title` 插槽；否则会显示默认标题。我们可以使用[组件文档](#components) 中讨论的标准插槽语法从我们的任务列表视图注入自定义标题：

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

既然我们已经定义了布局和任务列表视图，我们只需要从一个路由返回 `task` 视图：

```php
use App\Models\Task;

Route::get('/tasks', function () {
    return view('tasks', ['tasks' => Task::all()]);
});
```

<a name="layouts-using-template-inheritance"></a>
### 使用模板继承构建布局

<a name="defining-a-layout"></a>
#### 定义布局

布局也可以通过"模板继承"创建。这是在引入[组件](#components) 之前构建应用程序的主要方式。

首先，让我们看一个简单的示例。首先，我们检查一个页面布局。由于大多数 Web 应用程序在各种页面上保持相同的整体布局，将这个布局定义为单个 Blade 视图很方便：

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

如你所见，此文件包含典型的 HTML 标记。但是，请注意 `@section` 和 `@yield` 指令。`@section` 指令顾名思义，定义了一个内容区块，而 `@yield` 指令用于显示给定区块的内容。

既然我们为应用程序定义了一个布局，让我们定义一个继承该布局的子页面。

<a name="extending-a-layout"></a>
#### 扩展布局

定义子视图时，使用 `@extends` Blade 指令指定子视图应"继承"哪个布局。扩展 Blade 布局的视图可以使用 `@section` 指令将内容注入到布局的区块中。请记住，如上面的示例所示，这些区块的内容将使用 `@yield` 在布局中显示：

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

在此示例中，`sidebar` 区块正在使用 `@@parent` 指令将内容追加（而不是覆盖）到布局的侧边栏。`@@parent` 指令在渲染视图时会被布局的内容替换。

> [!NOTE]
> 与前一个示例相反，此 `sidebar` 区块以 `@endsection` 而不是 `@show` 结束。`@endsection` 指令只会定义一个区块，而 `@show` 会定义并**立即 yield** 该区块。

`@yield` 指令还接受默认值作为其第二个参数。如果被 yield 的区块未定义，将渲染该值：

```blade
@yield('content', 'Default content')
```

<a name="forms"></a>
## 表单

<a name="csrf-field"></a>
### CSRF 字段

每当你在应用程序中定义 HTML 表单时，都应在表单中包含一个隐藏的 CSRF 令牌字段，以便 [CSRF 防护](/docs/{{version}}/csrf) 中间件可以验证请求。你可以使用 `@csrf` Blade 指令生成令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

<a name="method-field"></a>
### 方法字段

由于 HTML 表单无法发起 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 动词。`@method` Blade 指令可以为你创建此字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

<a name="validation-errors"></a>
### 验证错误

`@error` 指令可用于快速检查某个给定属性是否存在[验证错误消息](/docs/{{version}}/validation#quick-displaying-the-validation-errors)。在 `@error` 指令中，你可以 echo `$message` 变量来显示错误消息：

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

由于 `@error` 指令会编译为"if"语句，你可以使用 `@else` 指令在某个属性没有错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror"
/>
```

你可以将[特定错误包的名称](/docs/{{version}}/validation#named-error-bags) 作为第二个参数传递给 `@error` 指令，以在包含多个表单的页面上检索验证错误消息：

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

<a name="stacks"></a>
## 栈

Blade 允许你推送到命名的栈，这些栈可以在另一个视图或布局中的其他地方渲染。这对于指定子视图所需的任何 JavaScript 库特别有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果你想在某个布尔表达式求值为 `true` 时 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以根据需要多次推送到一个栈。要渲染完整的栈内容，将栈的名称传递给 `@stack` 指令：

```blade
<head>
    <!-- Head 内容 -->

    @stack('scripts')
</head>
```

如果你想将内容前置到栈的开头，应使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// 稍后...

@prepend('scripts')
    This will be first...
@endprepend
```

`@hasstack` 指令可用于判断栈是否为空：

```blade
@hasstack('list')
    <ul>
        @stack('list')
    </ul>
@endif
```

<a name="service-injection"></a>
## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/docs/{{version}}/container) 中检索服务。传递给 `@inject` 的第一个参数是服务将被放入其中的变量名，而第二个参数是你希望解析的服务的类或接口名：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

<a name="rendering-inline-blade-templates"></a>
## 渲染内联 Blade 模板

有时你可能需要将原始的 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` facade 提供的 `render` 方法来实现。该方法接受 Blade 模板字符串和一个可选的提供给模板的数据数组：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过将内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果你希望 Laravel 在渲染 Blade 模板后删除这些临时文件，可以向该方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

<a name="rendering-blade-fragments"></a>
## 渲染 Blade 片段

使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你可能偶尔只需要在 HTTP 响应中返回 Blade 模板的一部分。Blade"片段"正是为此而生。首先，将 Blade 模板的一部分放在 `@fragment` 和 `@endfragment` 指令中：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，当渲染使用该模板的视图时，你可以调用 `fragment` 方法来指定只有指定的片段应包含在传出的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的一个片段。否则，将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图片段。这些片段将被连接在一起：

```php
view('dashboard', ['users' => $users])
    ->fragments(['user-list', 'comment-list']);

view('dashboard', ['users' => $users])
    ->fragmentsIf(
        $request->hasHeader('HX-Request'),
        ['user-list', 'comment-list']
    );
```

<a name="extending-blade"></a>
## 扩展 Blade

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它将使用指令包含的表达式调用提供的回调。

以下示例创建了一个 `@datetime($var)` 指令，用于格式化给定的 `$var`，它应该是 `DateTime` 的一个实例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

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
        Blade::directive('datetime', function (string $expression) {
            return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
        });
    }
}
```

如你所见，我们将对传入指令的任何表达式链式调用 `format` 方法。因此，在此示例中，该指令生成的最终 PHP 将是：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> [!WARNING]
> 更新 Blade 指令的逻辑后，你需要删除所有缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令删除缓存的 Blade 视图。

<a name="custom-echo-handlers"></a>
### 自定义 Echo 处理器

如果你尝试使用 Blade"echo"一个对象，该对象的 `__toString` 方法将被调用。[__toString](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的"魔术方法"之一。但是，有时你可能无法控制给定类的 `__toString` 方法，例如当你交互的类属于第三方库时。

在这些情况下，Blade 允许你为该特定类型的对象注册一个自定义 echo 处理器。为此，你应调用 Blade 的 `stringable` 方法。`stringable` 方法接受一个闭包。该闭包应类型提示它负责渲染的对象类型。通常，`stringable` 方法应在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Blade;
use Money\Money;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Blade::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

一旦定义了自定义 echo 处理器，你就可以在 Blade 模板中简单地 echo 该对象：

```blade
Cost: {{ $money }}
```

<a name="custom-if-statements"></a>
### 自定义 If 语句

在定义简单的自定义条件语句时，编写自定义指令有时比必要的更复杂。因此，Blade 提供了 `Blade::if` 方法，允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个自定义条件来检查为应用程序配置的默认"磁盘"。我们可以在 `AppServiceProvider` 的 `boot` 方法中执行此操作：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Blade::if('disk', function (string $value) {
        return config('filesystems.default') === $value;
    });
}
```

一旦定义了自定义条件，你就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用程序正在使用本地磁盘... -->
@elsedisk('s3')
    <!-- 应用程序正在使用 s3 磁盘... -->
@else
    <!-- 应用程序正在使用其他磁盘... -->
@enddisk

@unlessdisk('local')
    <!-- 应用程序未使用本地磁盘... -->
@enddisk
```
