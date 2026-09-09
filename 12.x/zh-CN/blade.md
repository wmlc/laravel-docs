# Blade 模板

- [简介](#introduction)
    - [用 Livewire 强化 Blade](#supercharging-blade-with-livewire)
- [显示数据](#displaying-data)
    - [HTML 实体编码](#html-entity-encoding)
    - [Blade 与 JavaScript 框架](#blade-and-javascript-frameworks)
- [Blade 指令](#blade-directives)
    - [If 语句](#if-statements)
    - [Switch 语句](#switch-statements)
    - [循环](#loops)
    - [循环变量](#the-loop-variable)
    - [条件类名与样式](#conditional-classes)
    - [附加属性](#additional-attributes)
    - [包含子视图](#including-subviews)
    - [`@once` 指令](#the-once-directive)
    - [原生 PHP](#raw-php)
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
    - [数据属性与 HTML 属性](#data-properties-attributes)
    - [访问父组件数据](#accessing-parent-data)
    - [匿名组件路径](#anonymous-component-paths)
- [构建布局](#building-layouts)
    - [使用组件构建布局](#layouts-using-components)
    - [使用模板继承构建布局](#layouts-using-template-inheritance)
- [表单](#forms)
    - [CSRF 字段](#csrf-field)
    - [Method 字段](#method-field)
    - [验证错误](#validation-errors)
- [堆栈](#stacks)
- [服务注入](#service-injection)
- [渲染内联 Blade 模板](#rendering-inline-blade-templates)
- [渲染 Blade 片段](#rendering-blade-fragments)
- [扩展 Blade](#extending-blade)
    - [自定义输出处理器](#custom-echo-handlers)
    - [自定义 If 语句](#custom-if-statements)

<a name="introduction"></a>
## 简介

Blade 是 Laravel 自带的简单而强大的模板引擎。与某些 PHP 模板引擎不同，Blade 并不限制你在模板中使用原生 PHP 代码。事实上，所有 Blade 模板都会被编译为原生 PHP 代码并缓存起来，直到它们被修改。这意味着 Blade 为你的应用带来的开销基本为零。Blade 模板文件使用 `.blade.php` 文件扩展名，通常存储在 `resources/views` 目录中。

Blade 视图可以使用全局 `view` 辅助函数从路由或控制器返回。当然，正如[视图](/docs/{{version}}/views)文档所述，可以使用 `view` 辅助函数的第二个参数将数据传递给 Blade 视图：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

<a name="supercharging-blade-with-livewire"></a>
### 用 Livewire 强化 Blade

想让你的 Blade 模板更上一层楼，轻松构建动态界面？请查看 [Laravel Livewire](https://livewire.laravel.com)。Livewire 让你能够编写带有动态功能的 Blade 组件，这些功能通常只有借助 React、Svelte 或 Vue 之类的前端框架才能实现。它为构建现代的、响应式的前端提供了一种出色的方式，而无需许多 JavaScript 框架所带来的复杂性、客户端渲染或构建步骤。

<a name="displaying-data"></a>
## 显示数据

你可以将传递给 Blade 视图的数据中的变量用花括号包裹起来，从而显示它。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

你可以像这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> [!NOTE]
> Blade 的 `{{ }}` 输出语句会自动经过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。

你并非只能显示传递给视图的变量内容，还可以输出任何 PHP 函数的结果。事实上，你可以在 Blade 输出语句中放置任何你想要的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

<a name="html-entity-encoding"></a>
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

默认情况下，Blade 的 `{{ }}` 语句会自动经过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。如果你不希望数据被转义，可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 输出由应用用户提供的内容时要非常小心。在显示用户提供的数据时，通常应使用经过转义的双花括号语法，以防止 XSS 攻击。

<a name="blade-and-javascript-frameworks"></a>
### Blade 与 JavaScript 框架

由于许多 JavaScript 框架也使用「花括号」来表示应在浏览器中显示给定表达式，你可以使用 `@` 符号告知 Blade 渲染引擎某个表达式应保持原样。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在本例中，`@` 符号会被 Blade 移除；而 `{{ name }}` 表达式则不会被 Blade 引擎改动，从而可以由你的 JavaScript 框架来渲染。

`@` 符号也可用于转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

<a name="rendering-json"></a>
#### 渲染 JSON

有时你可能会向视图传递一个数组，并打算将其渲染为 JSON，以便初始化一个 JavaScript 变量。例如：

```php
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

不过，除了手动调用 `json_encode`，你还可以使用 `Illuminate\Support\Js::from` 方法。`from` 方法接收与 PHP 的 `json_encode` 函数相同的参数；但它会确保生成的 JSON 已经被正确转义，可以安全地嵌入 HTML 引号中。`from` 方法会返回一个字符串形式的 `JSON.parse` JavaScript 语句，将给定的对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

最新版本的 Laravel 应用骨架包含一个 `Js` Facade，让你能够在 Blade 模板中便捷地使用这一功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你应当只使用 `Js::from` 方法将已存在的变量渲染为 JSON。Blade 模板基于正则表达式实现，尝试向该指令传递复杂表达式可能会导致意外失败。

<a name="the-at-verbatim-directive"></a>
#### `@verbatim` 指令

如果你在模板的大部分区域中显示 JavaScript 变量，可以将 HTML 包裹在 `@verbatim` 指令中，这样就不必为每个 Blade 输出语句都加上 `@` 符号前缀：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

<a name="blade-directives"></a>
## Blade 指令

除了模板继承和显示数据之外，Blade 还为常见的 PHP 控制结构（例如条件语句和循环）提供了便捷的快捷方式。这些快捷方式为使用 PHP 控制结构提供了一种非常干净、简洁的方式，同时又与 PHP 对应的写法保持一致、易于理解。

<a name="if-statements"></a>
### If 语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令来构造 `if` 语句。这些指令的功能与其 PHP 对应写法完全一致：

```blade
@if (count($records) === 1)
    I have one record!
@elseif (count($records) > 1)
    I have multiple records!
@else
    I don't have any records!
@endif
```

为方便起见，Blade 还提供了一个 `@unless` 指令：

```blade
@unless (Auth::check())
    You are not signed in.
@endunless
```

除了已经讨论过的条件指令之外，`@isset` 和 `@empty` 指令可用作其对应 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records 已定义且不为 null...
@endisset

@empty($records)
    // $records 为「空」...
@endempty
```

<a name="authentication-directives"></a>
#### 认证指令

`@auth` 和 `@guest` 指令可用于快速判断当前用户是否已[通过认证](/docs/{{version}}/authentication)或是游客：

```blade
@auth
    // 用户已通过认证...
@endauth

@guest
    // 用户未通过认证...
@endguest
```

如有需要，你可以指定在使用 `@auth` 和 `@guest` 指令时应检查的认证守卫：

```blade
@auth('admin')
    // 用户已通过认证...
@endauth

@guest('admin')
    // 用户未通过认证...
@endguest
```

<a name="environment-directives"></a>
#### 环境指令

你可以使用 `@production` 指令检查应用是否运行在生产环境：

```blade
@production
    // 生产环境专属内容...
@endproduction
```

或者，你可以使用 `@env` 指令判断应用是否运行在特定环境中：

```blade
@env('staging')
    // 应用正在 "staging" 环境中运行...
@endenv

@env(['staging', 'production'])
    // 应用正在 "staging" 或 "production" 环境中运行...
@endenv
```

<a name="section-directives"></a>
#### Section 指令

你可以使用 `@hasSection` 指令判断模板继承的某个 section 是否有内容：

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

<a name="session-directives"></a>
#### 会话指令

`@session` 指令可用于判断某个[会话（Session）](/docs/{{version}}/session)值是否存在。如果该会话值存在，`@session` 和 `@endsession` 指令之间的模板内容将被求值。在 `@session` 指令的内容中，你可以输出 `$value` 变量来显示该会话值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

<a name="context-directives"></a>
#### 上下文指令

`@context` 指令可用于判断某个[上下文（Context）](/docs/{{version}}/context)值是否存在。如果该上下文值存在，`@context` 和 `@endcontext` 指令之间的模板内容将被求值。在 `@context` 指令的内容中，你可以输出 `$value` 变量来显示该上下文值：

```blade
@context('canonical')
    <link href="{{ $value }}" rel="canonical">
@endcontext
```

<a name="switch-statements"></a>
### Switch 语句

Switch 语句可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令来构造：

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

除了条件语句之外，Blade 还为使用 PHP 的循环结构提供了简单的指令。同样，这些指令的功能与其 PHP 对应写法完全一致：

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
> 在遍历 `foreach` 循环时，你可以使用[循环变量](#the-loop-variable)获取有关循环的有用信息，例如当前是否是循环的第一次或最后一次迭代。

使用循环时，你还可以使用 `@continue` 和 `@break` 指令跳过当前迭代或结束循环：

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

你还可以在指令声明中直接包含继续或中断的条件：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

<a name="the-loop-variable"></a>
### 循环变量

在遍历 `foreach` 循环时，循环内部可以使用一个 `$loop` 变量。该变量提供了一些有用的信息，例如当前循环索引，以及本次是否是循环的第一次或最后一次迭代：

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

如果处于嵌套循环中，你可以通过 `parent` 属性访问父循环的 `$loop` 变量：

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

| 属性               | 描述                                       |
| ------------------ | ------------------------------------------ |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。          |
| `$loop->iteration` | 当前循环迭代的次数（从 1 开始）。          |
| `$loop->remaining` | 循环中剩余的迭代次数。                     |
| `$loop->count`     | 正在遍历的数组中的条目总数。               |
| `$loop->first`     | 本次是否是循环的第一次迭代。               |
| `$loop->last`      | 本次是否是循环的最后一次迭代。             |
| `$loop->even`      | 本次是否是循环的偶数迭代。                 |
| `$loop->odd`       | 本次是否是循环的奇数迭代。                 |
| `$loop->depth`     | 当前循环的嵌套层级。                       |
| `$loop->parent`    | 在嵌套循环中，父循环的循环变量。           |

<a name="conditional-classes"></a>
### 条件类名与样式

`@class` 指令按条件编译 CSS 类名字符串。该指令接收一个类名数组，其中数组的键包含你想添加的类名，值则是一个布尔表达式。如果数组元素使用数字键，它将始终包含在渲染出的类名列表中：

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

同样，`@style` 指令可用于按条件向 HTML 元素添加内联 CSS 样式：

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

为方便起见，你可以使用 `@checked` 指令轻松指示给定的 HTML 复选框输入是否「选中」。如果提供的条件求值为 `true`，该指令将输出 `checked`：

```blade
<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
```

同样，`@selected` 指令可用于指示给定的下拉选项是否应被「选中」：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于指示给定元素是否应被「禁用」：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

再者，`@readonly` 指令可用于指示给定元素是否应为「只读」：

```blade
<input
    type="email"
    name="email"
    value="email@laravel.com"
    @readonly($user->isNotAdmin())
/>
```

另外，`@required` 指令可用于指示给定元素是否为「必填」：

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
> 虽然你可以随意使用 `@include` 指令，但 Blade [组件](#components)提供了类似的功能，并且在数据和属性绑定等方面比 `@include` 指令更具优势。

Blade 的 `@include` 指令允许你在另一个视图中包含一个 Blade 视图。父视图中可用的所有变量，在被包含的视图中同样可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

尽管被包含的视图会继承父视图中所有可用的数据，你还可以传递一个额外的数据数组，供被包含的视图使用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 会抛出错误。如果你想包含一个可能存在也可能不存在的视图，应当使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你想根据给定布尔表达式的求值结果为 `true` 或 `false` 来决定是否 `@include` 一个视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要包含给定视图数组中第一个存在的视图，可以使用 `includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

如果你想包含一个视图，但又不继承父视图中的任何变量，可以使用 `@includeIsolated` 指令。被包含的视图只能访问你显式传递给它的变量：

```blade
@includeIsolated('view.name', ['user' => $user])
```

> [!WARNING]
> 你应避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们会指向缓存后的已编译视图的位置。

<a name="rendering-views-for-collections"></a>
#### 为集合渲染视图

你可以使用 Blade 的 `@each` 指令，将循环和包含合并为一行：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中的每个元素渲染的视图。第二个参数是你要遍历的数组或集合，第三个参数是视图中分配给当前迭代的变量名。例如，如果你正在遍历一个 `jobs` 数组，通常你会希望在视图中以 `job` 变量访问每个任务。当前迭代的数组键在视图中将以 `key` 变量的形式可用。

你还可以向 `@each` 指令传递第四个参数。该参数决定了给定数组为空时将渲染的视图。

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图中的变量。如果子视图需要这些变量，你应当改用 `@foreach` 和 `@include` 指令。

<a name="the-once-directive"></a>
### `@once` 指令

`@once` 指令允许你定义模板中每个渲染周期只求值一次的部分。这对于使用[堆栈](#stacks)将某段 JavaScript 推送到页面头部可能很有用。例如，如果你在循环中渲染某个[组件](#components)，可能希望只在组件第一次被渲染时才将 JavaScript 推送到头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令经常与 `@push` 或 `@prepend` 指令配合使用，为方便起见，还提供了 `@pushOnce` 和 `@prependOnce` 指令：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript...
    </script>
@endPushOnce
```

如果你在两个不同的 Blade 模板中推送重复的内容，应当为 `@pushOnce` 指令的第二个参数提供一个唯一标识符，以确保该内容只被渲染一次：

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

在某些情况下，将 PHP 代码嵌入视图中会很有用。你可以使用 Blade 的 `@php` 指令在模板中执行一段原生 PHP 代码：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只需要使用 PHP 来导入一个类，可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

可以为 `@use` 指令提供第二个参数，为导入的类设置别名：

```blade
@use('App\Models\Flight', 'FlightModel')
```

如果同一命名空间下有多个类，你可以将这些类的导入进行分组：

```blade
@use('App\Models\{Flight, Airport}')
```

`@use` 指令还支持导入 PHP 函数和常量，只需在导入路径前加上 `function` 或 `const` 修饰符：

```blade
@use(function App\Helpers\format_currency)
@use(const App\Constants\MAX_ATTEMPTS)
```

与类导入一样，函数和常量同样支持别名：

```blade
@use(function App\Helpers\format_currency, 'formatMoney')
@use(const App\Constants\MAX_ATTEMPTS, 'MAX_TRIES')
```

函数和 const 修饰符同样支持分组导入，允许你在单个指令中从同一命名空间导入多个符号：

```blade
@use(function App\Helpers\{format_currency, format_date})
@use(const App\Constants\{MAX_ATTEMPTS, DEFAULT_TIMEOUT})
```

<a name="comments"></a>
### 注释

Blade 还允许你在视图中定义注释。不过，与 HTML 注释不同，Blade 注释不会包含在应用返回的 HTML 中：

```blade
{{-- 此注释不会出现在渲染后的 HTML 中 --}}
```

<a name="components"></a>
## 组件

组件与插槽提供的收益与 section、布局和 include 类似；不过，有些人可能觉得组件与插槽的心智模型更容易理解。编写组件有两种方式：基于类的组件和匿名组件。

要创建基于类的组件，可以使用 `make:component` Artisan 命令。为了演示如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令会将该组件放置在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为组件创建一个视图模板。该视图将被放置在 `resources/views/components` 目录中。在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中被自动发现，因此通常无需进一步注册组件。

你也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令会在 `app/View/Components/Forms` 目录中创建一个 `Input` 组件，其视图将被放置在 `resources/views/components/forms` 目录中。

<a name="manually-registering-package-components"></a>
#### 手动注册包组件

在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中被自动发现。

但是，如果你正在构建一个使用 Blade 组件的包，就需要手动注册组件类及其 HTML 标签别名。通常，你应当在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

组件注册之后，就可以通过其标签别名来渲染它：

```blade
<x-package-alert/>
```

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 两个组件，它们位于 `Package\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以通过 `package-name::` 语法，按供应商命名空间来使用包组件了：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会将组件名转换为帕斯卡命名（pascal-case），自动检测与该组件关联的类。子目录也支持使用「点」记法。

<a name="rendering-components"></a>
### 渲染组件

要显示组件，你可以在某个 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后跟组件类的 kebab-case（短横线小写）名称：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类嵌套在 `app/View/Components` 目录的更深层级，你可以使用 `.` 字符来表示目录嵌套。例如，假设组件位于 `app/View/Components/Inputs/Button.php`，我们可以像这样渲染它：

```blade
<x-inputs.button/>
```

如果你想按条件渲染组件，可以在组件类上定义一个 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，组件将不会被渲染：

```php
use Illuminate\Support\Str;

/**
 * 是否应渲染该组件
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

<a name="index-components"></a>
### 索引组件

有时组件是组件组的一部分，你可能希望将相关组件归组到单个目录中。例如，设想一个具有如下类结构的「card」组件：

```text
App\Views\Components\Card\Card
App\Views\Components\Card\Header
App\Views\Components\Card\Body
```

由于根 `Card` 组件嵌套在 `Card` 目录中，你可能以为需要通过 `<x-card.card>` 来渲染该组件。但是，当组件的文件名与组件所在目录的名称相同时，Laravel 会自动认定该组件是「根」组件，允许你在渲染时省略重复的目录名：

```blade
<x-card>
    <x-card.header>...</x-card.header>
    <x-card.body>...</x-card.body>
</x-card>
```

<a name="passing-data-to-components"></a>
### 向组件传递数据

你可以使用 HTML 属性向 Blade 组件传递数据。硬编码的原生值可以通过简单的 HTML 属性字符串传递给组件。PHP 表达式和变量则应通过以 `:` 字符为前缀的属性传递给组件：

```blade
<x-alert type="error" :message="$message"/>
```

你应当在组件类的构造函数中定义组件的所有数据属性。组件上的所有公共属性都会自动供组件的视图使用，无需在组件的 `render` 方法中将数据传递给视图：

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
     * 获取表示该组件的视图 / 内容。
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

组件渲染时，你可以通过按名称输出变量的方式，来显示组件公共变量的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

<a name="casing"></a>
#### 命名大小写

组件构造函数参数应使用 `camelCase`（小驼峰）指定，而在 HTML 属性中引用参数名时应使用 `kebab-case`（短横线小写）。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 */
public function __construct(
    public string $alertType,
) {}
```

可以这样为组件提供 `$alertType` 参数：

```blade
<x-alert alert-type="danger" />
```

<a name="short-attribute-syntax"></a>
#### 短属性语法

向组件传递属性时，你还可以使用「短属性」语法。由于属性名通常与它们对应的变量名相同，这种方式往往更加便捷：

```blade
{{-- 短属性语法... --}}
<x-profile :$userId :$name />

{{-- 等价于... --}}
<x-profile :user-id="$userId" :name="$name" />
```

<a name="escaping-attribute-rendering"></a>
#### 转义属性渲染

由于 Alpine.js 等一些 JavaScript 框架也使用冒号前缀的属性，你可以使用双冒号（`::`）前缀告知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

```blade
<x-button ::class="{ danger: isDeleting }">
    Submit
</x-button>
```

Blade 将渲染出以下 HTML：

```blade
<button :class="{ danger: isDeleting }">
    Submit
</button>
```

<a name="component-methods"></a>
#### 组件方法

除了组件模板可以使用公共变量之外，组件上的任何公共方法也都可以被调用。例如，设想一个拥有 `isSelected` 方法的组件：

```php
/**
 * 判断给定选项是否为当前选中的选项。
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以在组件模板中通过调用与方法同名的变量来执行该方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

<a name="using-attributes-slots-within-component-class"></a>
#### 在组件类中访问属性与插槽

Blade 组件还允许你在类的 render 方法内部访问组件名称、属性和插槽。不过，要访问这些数据，你应当从组件的 `render` 方法返回一个闭包：

```php
use Closure;

/**
 * 获取表示该组件的视图 / 内容。
 */
public function render(): Closure
{
    return function () {
        return '<div {{ $attributes }}>Components content</div>';
    };
}
```

组件 `render` 方法返回的闭包还可以接收一个 `$data` 数组作为其唯一参数。该数组将包含若干提供组件信息的元素：

```php
return function (array $data) {
    // $data['componentName'];
    // $data['attributes'];
    // $data['slot'];

    return '<div {{ $attributes }}>Components content</div>';
}
```

> [!WARNING]
> 切勿将 `$data` 数组中的元素直接嵌入 `render` 方法返回的 Blade 字符串中，否则恶意属性内容可能会借机实现远程代码执行。

`componentName` 等于 HTML 标签中 `x-` 前缀之后的名称。因此 `<x-alert />` 的 `componentName` 是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个包含组件插槽内容的 `Illuminate\Support\HtmlString` 实例。

该闭包应返回一个字符串。如果返回的字符串对应一个已存在的视图，则渲染该视图；否则，返回的字符串将作为内联 Blade 视图被求值。

<a name="additional-dependencies"></a>
#### 额外依赖

如果你的组件需要 Laravel [服务容器（Service Container）](/docs/{{version}}/container)中的依赖，你可以将它们列在组件的所有数据属性之前，容器会自动注入它们：

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

如果你想防止某些公共方法或属性作为变量暴露给组件模板，可以将它们添加到组件的 `$except` 数组属性中：

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

我们已经了解了如何向组件传递数据属性；不过，有时你可能需要指定一些额外的 HTML 属性（例如 `class`），它们并不属于组件运行所需的数据。通常，你会希望将这些额外的属性传递给组件模板的根元素。例如，设想我们要像这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性，都会被自动添加到组件的「属性包（attribute bag）」中。这个属性包会通过 `$attributes` 变量自动提供给组件。输出该变量，即可在组件中渲染所有属性：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> [!WARNING]
> 目前不支持在组件标签内使用 `@env` 之类的指令。例如，`<x-alert :live="@env('production')"/>` 将不会被编译。

<a name="default-merged-attributes"></a>
#### 默认 / 合并属性

有时你可能需要为属性指定默认值，或者向组件的某些属性合并额外的值。为此，可以使用属性包的 `merge` 方法。该方法在定义一组应始终应用于组件的默认 CSS 类时特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

假设该组件像这样使用：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

该组件最终渲染出的 HTML 将如下所示：

```blade
<div class="alert alert-error mb-4">
    <!-- $message 变量的内容 -->
</div>
```

<a name="conditionally-merge-classes"></a>
#### 按条件合并类名

有时你可能希望在给定条件为 `true` 时才合并类名。你可以通过 `class` 方法来实现，该方法接收一个类名数组，其中数组的键包含你想添加的类名，值则是一个布尔表达式。如果数组元素使用数字键，它将始终包含在渲染出的类名列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果你需要向组件合并其他属性，可以在 `class` 方法后链式调用 `merge` 方法：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]
> 如果你需要在其他不应接收合并属性的 HTML 元素上按条件编译类名，可以使用 [@class 指令](#conditional-classes)。

<a name="non-class-attribute-merging"></a>
#### 非类名属性合并

在合并非 `class` 属性时，传递给 `merge` 方法的值将被视为该属性的「默认」值。不过，与 `class` 属性不同，这些属性不会与传入的属性值合并，而是会被覆盖。例如，一个 `button` 组件的实现可能如下所示：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要以自定义的 `type` 渲染该按钮组件，可以在使用组件时指定它。如果未指定类型，将使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

本例中 `button` 组件渲染出的 HTML 为：

```blade
<button type="submit">
    Submit
</button>
```

如果你希望 `class` 以外的属性将其默认值与传入值拼接在一起，可以使用 `prepends` 方法。在本例中，`data-controller` 属性将始终以 `profile-controller` 开头，任何额外传入的 `data-controller` 值都会放在该默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

<a name="filtering-attributes"></a>
#### 检索与过滤属性

你可以使用 `filter` 方法过滤属性。该方法接收一个闭包，如果你希望将属性保留在属性包中，闭包应返回 `true`：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为方便起见，你可以使用 `whereStartsWith` 方法检索所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，`whereDoesntStartWith` 方法可用于排除所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你想检查组件上是否存在某个属性，可以使用 `has` 方法。该方法接收属性名作为其唯一参数，并返回一个布尔值来表明该属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class attribute is present</div>
@endif
```

如果向 `has` 方法传递一个数组，该方法会判断组件上是否同时存在所有给定的属性：

```blade
@if ($attributes->has(['name', 'class']))
    <div>All of the attributes are present</div>
@endif
```

`hasAny` 方法可用于判断组件上是否存在给定属性中的任意一个：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>One of the attributes is present</div>
@endif
```

你可以使用 `get` 方法检索特定属性的值：

```blade
{{ $attributes->get('class') }}
```

`only` 方法可用于只检索具有给定键的属性：

```blade
{{ $attributes->only(['class']) }}
```

`except` 方法可用于检索除给定键的属性之外的所有属性：

```blade
{{ $attributes->except(['class']) }}
```

<a name="reserved-keywords"></a>
### 保留关键字

默认情况下，为了渲染组件，一些关键字被保留供 Blade 内部使用。以下关键字不能在组件中定义为公共属性或方法名：

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

你经常需要通过「插槽」向组件传递额外内容。组件插槽通过输出 `$slot` 变量来渲染。为了探究这一概念，假设一个 `alert` 组件具有以下标记：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

我们可以通过向组件注入内容，将内容传递给该 `slot`：

```blade
<x-alert>
    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

有时组件可能需要在组件内的不同位置渲染多个不同的插槽。让我们修改 alert 组件，使其支持注入一个「title」插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签来定义命名插槽的内容。任何不在显式 `x-slot` 标签内的内容，都会通过 `$slot` 变量传递给组件：

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

此外，`hasActualContent` 方法可用于判断插槽是否包含任何不属于 HTML 注释的「实际」内容：

```blade
@if ($slot->hasActualContent())
    The scope has non-comment content.
@endif
```

<a name="scoped-slots"></a>
#### 作用域插槽

如果你使用过 Vue 之类的 JavaScript 框架，可能已经熟悉「作用域插槽」，它允许你在插槽中访问组件的数据或方法。在 Laravel 中，你可以通过在组件上定义公共方法或属性，并在插槽中通过 `$component` 变量访问组件，来实现类似的行为。在本例中，我们假设 `x-alert` 组件的组件类上定义了一个公共的 `formatAlert` 方法：

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

要操作插槽属性，你可以访问插槽变量的 `attributes` 属性。有关如何操作属性的更多信息，请查阅[组件属性](#component-attributes)的文档：

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

对于非常小的组件，同时管理组件类和组件的视图模板可能显得繁琐。因此，你可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取表示该组件的视图 / 内容。
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

要创建一个渲染内联视图的组件，你可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

<a name="dynamic-components"></a>
### 动态组件

有时你可能需要渲染一个组件，但直到运行时才知道应渲染哪个组件。这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件，根据运行时的值或变量来渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

<a name="manually-registering-components"></a>
### 手动注册组件

> [!WARNING]
> 以下关于手动注册组件的文档，主要适用于编写包含视图组件的 Laravel 包的开发者。如果你不是在编写包，组件文档的这一部分可能与你无关。

在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中被自动发现。

但是，如果你正在构建一个使用 Blade 组件的包，或者将组件放置在非约定目录中，就需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道到哪里查找该组件。通常，你应当在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册之后，就可以通过其标签别名来渲染它：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 两个组件，它们位于 `Package\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以通过 `package-name::` 语法，按供应商命名空间来使用包组件了：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会将组件名转换为帕斯卡命名，自动检测与该组件关联的类。子目录也支持使用「点」记法。

<a name="anonymous-components"></a>
## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。不过，匿名组件只使用单个视图文件，没有与之关联的类。要定义匿名组件，你只需将一个 Blade 模板放置在 `resources/views/components` 目录中。例如，假设你在 `resources/views/components/alert.blade.php` 定义了一个组件，你可以直接像这样渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符来表示组件嵌套在 `components` 目录更深层级。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，你可以像这样渲染它：

```blade
<x-inputs.button/>
```

要通过 Artisan 创建匿名组件，你可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令会在 `resources/views/components/forms/input.blade.php` 创建一个 Blade 文件，它可以通过 `<x-forms.input />` 作为组件渲染。

<a name="anonymous-index-components"></a>
### 匿名索引组件

有时，当一个组件由许多 Blade 模板组成时，你可能希望将该组件的模板归组到单个目录中。例如，设想一个具有如下目录结构的「accordion」组件：

```text
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

这种目录结构允许你像这样渲染 accordion 组件及其条目：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

但是，为了能够通过 `x-accordion` 渲染 accordion 组件，我们不得不将「索引」accordion 组件模板放在 `resources/views/components` 目录中，而不是与其他 accordion 相关模板一起嵌套在 `accordion` 目录内。

所幸，Blade 允许你在组件目录自身内部放置一个与目录同名的文件。当该模板存在时，即使它嵌套在目录中，也可以作为组件的「根」元素渲染。因此，我们可以继续使用上例中相同的 Blade 语法，只需像这样调整目录结构：

```text
/resources/views/components/accordion/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

<a name="data-properties-attributes"></a>
### 数据属性与 HTML 属性

由于匿名组件没有任何关联的类，你可能想知道如何区分哪些数据应作为变量传递给组件，哪些属性应放入组件的[属性包](#component-attributes)。

你可以在组件 Blade 模板的顶部使用 `@props` 指令，指定哪些属性应被视为数据变量。组件上的所有其他属性将通过组件的属性包提供。如果你想为数据变量指定默认值，可以将变量名作为数组键、默认值作为数组值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

基于上面的组件定义，我们可以像这样渲染该组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

<a name="accessing-parent-data"></a>
### 访问父组件数据

有时你可能希望在子组件内部访问来自父组件的数据。这些情况下，你可以使用 `@aware` 指令。例如，设想我们正在构建一个由父组件 `<x-menu>` 和子组件 `<x-menu.item>` 组成的复杂菜单组件：

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

由于 `color` prop 只传递给了父组件（`<x-menu>`），它在 `<x-menu.item>` 内部将不可用。但是，如果使用 `@aware` 指令，我们也可以让它在 `<x-menu.item>` 内部可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]
> `@aware` 指令无法访问未通过 HTML 属性显式传递给父组件的父组件数据。未显式传递给父组件的默认 `@props` 值，也无法被 `@aware` 指令访问。

<a name="anonymous-component-paths"></a>
### 匿名组件路径

如前所述，匿名组件通常通过在 `resources/views/components` 目录中放置一个 Blade 模板来定义。不过，除了默认路径之外，你偶尔可能希望在 Laravel 中注册其他匿名组件路径。

`anonymousComponentPath` 方法接收匿名组件位置的「路径」作为第一个参数，以及组件应归入的可选「命名空间」作为第二个参数。通常，该方法应当在应用的某个[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

当注册组件路径时未指定前缀（如上例所示），在 Blade 组件中渲染它们时同样无需相应的前缀。例如，如果在上例注册的路径中存在一个 `panel.blade.php` 组件，它可以像这样渲染：

```blade
<x-panel />
```

可以为 `anonymousComponentPath` 方法的第二个参数提供前缀「命名空间」：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

当提供了前缀时，渲染该「命名空间」中的组件，需要在组件名前加上组件的命名空间：

```blade
<x-dashboard::panel />
```

<a name="building-layouts"></a>
## 构建布局

<a name="layouts-using-components"></a>
### 使用组件构建布局

大多数 Web 应用会在不同页面之间保持相同的大致布局。如果每次创建视图都要重复整个布局 HTML，应用将变得极其繁琐且难以维护。所幸，我们可以将布局定义为单个 [Blade 组件](#components)，然后在应用的各个地方使用它，这非常方便。

<a name="defining-the-layout-component"></a>
#### 定义布局组件

例如，设想我们正在构建一个「todo」待办事项应用。我们可以定义一个如下所示的 `layout` 组件：

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

定义好 `layout` 组件之后，我们可以创建一个使用该组件的 Blade 视图。在本例中，我们将定义一个显示任务列表的简单视图：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容会提供给 `layout` 组件内的默认 `$slot` 变量。正如你可能已经注意到的，我们的 `layout` 还会使用 `$title` 插槽（如果提供了的话）；否则将显示默认标题。我们可以使用[组件文档](#components)中讨论的标准插槽语法，从任务列表视图注入自定义标题：

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

现在我们已经定义了布局和任务列表视图，只需从路由返回 `task` 视图即可：

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

布局也可以通过「模板继承」来创建。这是[组件](#components)出现之前构建应用的主要方式。

首先，让我们看一个简单的例子。我们将先考察一个页面布局。由于大多数 Web 应用会在不同页面之间保持相同的大致布局，将该布局定义为单个 Blade 视图会很方便：

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

如你所见，这个文件包含典型的 HTML 标记。不过，请注意 `@section` 和 `@yield` 指令。顾名思义，`@section` 指令定义一段内容，而 `@yield` 指令用于显示给定 section 的内容。

既然已经为应用定义好了布局，接下来让我们定义一个继承该布局的子页面。

<a name="extending-a-layout"></a>
#### 扩展布局

定义子视图时，使用 `@extends` Blade 指令来指定子视图应「继承」哪个布局。扩展 Blade 布局的视图可以使用 `@section` 指令向布局的 section 注入内容。记住，正如上例所示，这些 section 的内容将在布局中通过 `@yield` 显示：

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

在本例中，`sidebar` section 使用 `@@parent` 指令向布局的侧边栏追加（而非覆盖）内容。视图渲染时，`@@parent` 指令将被布局的内容替换。

> [!NOTE]
> 与前面的示例不同，这个 `sidebar` section 以 `@endsection` 结尾，而不是 `@show`。`@endsection` 指令只定义一个 section，而 `@show` 会定义并**立即输出（yield）**该 section。

`@yield` 指令还接受默认值作为其第二个参数。如果要输出的 section 未定义，将渲染该默认值：

```blade
@yield('content', 'Default content')
```

<a name="forms"></a>
## 表单

<a name="csrf-field"></a>
### CSRF 字段

每当在应用中定义 HTML 表单时，你都应该在表单中包含一个隐藏的 CSRF 令牌字段，以便 [CSRF 保护](/docs/{{version}}/csrf)中间件能够验证请求。你可以使用 `@csrf` Blade 指令来生成该令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

<a name="method-field"></a>
### Method 字段

由于 HTML 表单无法发起 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 动词。`@method` Blade 指令可以为你创建这个字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

<a name="validation-errors"></a>
### 验证错误

`@error` 指令可用于快速检查某个给定属性是否存在[验证错误消息](/docs/{{version}}/validation#quick-displaying-the-validation-errors)。在 `@error` 指令内部，你可以输出 `$message` 变量来显示错误消息：

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

由于 `@error` 指令会被编译为「if」语句，你可以使用 `@else` 指令在某个属性没有错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror"
/>
```

你可以在包含多个表单的页面上，将[特定错误包的名称](/docs/{{version}}/validation#named-error-bags)作为 `@error` 指令的第二个参数来检索验证错误消息：

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
## 堆栈

Blade 允许你推送到命名堆栈，这些堆栈可以在另一个视图或布局的其他位置渲染。这对于指定子视图所需的 JavaScript 库特别有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果想在给定布尔表达式求值为 `true` 时才 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以根据需要多次向堆栈推送内容。要渲染完整的堆栈内容，请将堆栈名称传递给 `@stack` 指令：

```blade
<head>
    <!-- 头部内容 -->

    @stack('scripts')
</head>
```

如果你想将内容前置到堆栈的开头，应当使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// 稍后...

@prepend('scripts')
    This will be first...
@endprepend
```

`@hasstack` 指令可用于判断堆栈是否非空：

```blade
@hasstack('list')
    <ul>
        @stack('list')
    </ul>
@endif
```

<a name="service-injection"></a>
## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/docs/{{version}}/container)检索服务。传递给 `@inject` 的第一个参数是服务将被放入的变量名，第二个参数是你想要解析的服务类或接口名：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

<a name="rendering-inline-blade-templates"></a>
## 渲染内联 Blade 模板

有时你可能需要将原始 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` Facade 提供的 `render` 方法来实现。`render` 方法接收 Blade 模板字符串，以及一个可选的、要提供给模板的数据数组：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 渲染内联 Blade 模板时，会将它们写入 `storage/framework/views` 目录。如果你希望 Laravel 在渲染完 Blade 模板后删除这些临时文件，可以为该方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

<a name="rendering-blade-fragments"></a>
## 渲染 Blade 片段

在使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你偶尔可能只需要在 HTTP 响应中返回 Blade 模板的一部分。Blade「片段（fragment）」正好可以实现这一点。首先，将 Blade 模板的一部分放置在 `@fragment` 和 `@endfragment` 指令之间：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用该模板的视图时，你可以调用 `fragment` 方法来指定只有指定的片段应包含在发往客户端的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件按条件返回视图的片段；否则将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图片段。这些片段将被拼接在一起：

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

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它会将指令所包含的表达式传给提供的回调。

下面的示例创建了一个 `@datetime($var)` 指令，用于格式化给定的 `$var`，它应当是一个 `DateTime` 实例：

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

如你所见，我们会将 `format` 方法链式附加到传递给指令的任何表达式上。因此，在本例中，该指令最终生成的 PHP 为：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> [!WARNING]
> 更新 Blade 指令的逻辑后，你需要删除所有已缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令来移除缓存的 Blade 视图。

<a name="custom-echo-handlers"></a>
### 自定义输出处理器

当你尝试使用 Blade「输出」一个对象时，会调用该对象的 `__toString` 方法。[__toString](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的「魔术方法」之一。但有时你可能无法控制给定类的 `__toString` 方法，例如当你交互的类属于某个第三方库时。

这些情况下，Blade 允许你为该特定类型的对象注册一个自定义输出处理器。为此，你应当调用 Blade 的 `stringable` 方法。`stringable` 方法接收一个闭包，该闭包应对其负责渲染的对象类型进行类型提示。通常，`stringable` 方法应当在应用的 `AppServiceProvider` 类的 `boot` 方法中调用：

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

定义好自定义输出处理器之后，你就可以直接在 Blade 模板中输出该对象：

```blade
Cost: {{ $money }}
```

<a name="custom-if-statements"></a>
### 自定义 If 语句

在定义简单的自定义条件语句时，编写自定义指令有时会超出必要的复杂度。因此，Blade 提供了 `Blade::if` 方法，允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个检查应用所配置的默认「磁盘」的自定义条件。我们可以在 `AppServiceProvider` 的 `boot` 方法中完成：

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

定义好自定义条件之后，你就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用正在使用 local 磁盘... -->
@elsedisk('s3')
    <!-- 应用正在使用 s3 磁盘... -->
@else
    <!-- 应用正在使用其他磁盘... -->
@enddisk

@unlessdisk('local')
    <!-- 应用未在使用 local 磁盘... -->
@enddisk
```
