# Blade 模板

- [简介](#introduction)
    - [使用 Livewire 增强 Blade](#supercharging-blade-with-livewire)
- [显示数据](#displaying-data)
    - [HTML 实体编码](#html-entity-encoding)
    - [Blade 与 JavaScript 框架](#blade-and-javascript-frameworks)
- [Blade 指令](#blade-directives)
    - [If 语句](#if-statements)
    - [Switch 语句](#switch-statements)
    - [循环](#loops)
    - [循环变量](#the-loop-variable)
    - [条件类与样式](#conditional-classes)
    - [附加属性](#additional-attributes)
    - [包含子视图](#including-subviews)
    - [`@once` 指令](#the-once-directive)
    - [原生 PHP](#raw-php)
    - [注释](#comments)
- [组件](#components)
    - [渲染组件](#rendering-components)
    - [向组件传递数据](#passing-data-to-components)
    - [组件属性](#component-attributes)
    - [保留关键字](#reserved-keywords)
    - [插槽](#slots)
    - [内联组件视图](#inline-component-views)
    - [动态组件](#dynamic-components)
    - [手动注册组件](#manually-registering-components)
- [匿名组件](#anonymous-components)
    - [匿名索引组件](#anonymous-index-components)
    - [数据属性 / 属性](#data-properties-attributes)
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
    - [自定义 Echo 处理器](#custom-echo-handlers)
    - [自定义 If 语句](#custom-if-statements)

<a name="introduction"></a>
## 简介

Blade 是 Laravel 内置的简单而强大的模板引擎。与某些 PHP 模板引擎不同，Blade 不会限制你在模板中使用原生 PHP 代码。实际上，所有 Blade 模板都会被编译为原生 PHP 代码并缓存起来，直到被修改为止，这意味着 Blade 对你的应用几乎没有额外开销。Blade 模板文件使用 `.blade.php` 文件扩展名，通常存放在 `resources/views` 目录中。

可以使用全局 `view` 辅助函数从路由或控制器返回 Blade 视图。当然，正如[视图](/docs/{{version}}/views)文档中所述，可以通过 `view` 辅助函数的第二个参数向 Blade 视图传递数据：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

<a name="supercharging-blade-with-livewire"></a>
### 使用 Livewire 增强 Blade

想要将 Blade 模板提升到新的水平，轻松构建动态界面？请查看 [Laravel Livewire](https://laravel-livewire.com)。Livewire 允许你编写 Blade 组件，并为其增强通常只有 React 或 Vue 等前端框架才能实现的动态功能，为构建现代响应式前端提供了一种出色的方式，无需许多 JavaScript 框架的复杂性、客户端渲染或构建步骤。

<a name="displaying-data"></a>
## 显示数据

可以通过将变量包裹在花括号中来显示传递给 Blade 视图的数据。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

可以这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> **Note**
> Blade 的 `{{ }}` echo 语句会自动通过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。

你不仅可以显示传递给视图的变量内容，还可以输出任何 PHP 函数的结果。实际上，你可以在 Blade echo 语句中放入任何你想要的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

<a name="html-entity-encoding"></a>
### HTML 实体编码

默认情况下，Blade（以及 Laravel 的 `e` 辅助函数）会对 HTML 实体进行双重编码。如果想禁用双重编码，可以在 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Blade::withoutDoubleEncoding();
    }
}
```

<a name="displaying-unescaped-data"></a>
#### 显示未转义数据

默认情况下，Blade 的 `{{ }}` 语句会自动通过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。如果不想对数据进行转义，可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> **Warning**
> 在输出应用用户提供的内容时要非常小心。在显示用户提供的数据时，通常应使用转义的双花括号语法来防止 XSS 攻击。

<a name="blade-and-javascript-frameworks"></a>
### Blade 与 JavaScript 框架

由于许多 JavaScript 框架也使用花括号来指示应在浏览器中显示的表达式，你可以使用 `@` 符号告知 Blade 渲染引擎该表达式应保持不变。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在这个例子中，`@` 符号会被 Blade 移除；但 `{{ name }}` 表达式将保持不变，让 JavaScript 框架来渲染。

`@` 符号也可用于转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

<a name="rendering-json"></a>
#### 渲染 JSON

有时你可能需要将数组传递给视图，并打算将其渲染为 JSON 以初始化 JavaScript 变量。例如：

```blade
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

不过，与其手动调用 `json_encode`，不如使用 `Illuminate\Support\Js::from` 方法指令。`from` 方法接受与 PHP 的 `json_encode` 函数相同的参数；但它会确保生成的 JSON 被正确转义，以便安全地包含在 HTML 引号中。`from` 方法会返回一个包含 `JSON.parse` JavaScript 语句的字符串，将给定的对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

最新版本的 Laravel 应用骨架包含了一个 `Js` Facade，可以在 Blade 模板中方便地使用此功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> **Warning**
> 应该只使用 `Js::from` 方法将已有变量渲染为 JSON。Blade 模板基于正则表达式，尝试将复杂表达式传递给该指令可能会导致意外失败。

<a name="the-at-verbatim-directive"></a>
#### `@verbatim` 指令

如果在模板的较大区域中显示 JavaScript 变量，可以使用 `@verbatim` 指令包裹 HTML，这样就不必在每个 Blade echo 语句前加 `@` 符号：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

<a name="blade-directives"></a>
## Blade 指令

除了模板继承和显示数据之外，Blade 还为常见的 PHP 控制结构（如条件语句和循环）提供了便捷的快捷方式。这些快捷方式提供了一种非常简洁的方式来处理 PHP 控制结构，同时保持与 PHP 对应语法的一致性。

<a name="if-statements"></a>
### If 语句

可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令构造 `if` 语句。这些指令的功能与对应的 PHP 语法完全相同：

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

除了已讨论的条件指令外，`@isset` 和 `@empty` 指令可用作各自 PHP 函数的便捷快捷方式：

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

`@auth` 和 `@guest` 指令可用于快速判断当前用户是否已[认证](/docs/{{version}}/authentication)或是访客：

```blade
@auth
    // 用户已认证...
@endauth

@guest
    // 用户未认证...
@endguest
```

如有需要，可以在使用 `@auth` 和 `@guest` 指令时指定应检查的认证守卫：

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

可以使用 `@production` 指令检查应用是否运行在生产环境中：

```blade
@production
    // 生产环境特定内容...
@endproduction
```

或者，可以使用 `@env` 指令判断应用是否运行在特定环境中：

```blade
@env('staging')
    // 应用运行在 "staging" 环境中...
@endenv

@env(['staging', 'production'])
    // 应用运行在 "staging" 或 "production" 环境中...
@endenv
```

<a name="section-directives"></a>
#### Section 指令

可以使用 `@hasSection` 指令判断模板继承的某个 section 是否有内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

可以使用 `@sectionMissing` 指令判断某个 section 是否没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

<a name="switch-statements"></a>
### Switch 语句

可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令构造 Switch 语句：

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

除了条件语句之外，Blade 还提供了用于处理 PHP 循环结构的简单指令。同样，这些指令的功能与对应的 PHP 语法完全相同：

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

> **Note**
> 在 `foreach` 循环中迭代时，可以使用[循环变量](#the-loop-variable)获取有关循环的有用信息，例如是否处于循环的第一次或最后一次迭代。

使用循环时，还可以通过 `@continue` 和 `@break` 指令跳过当前迭代或结束循环：

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

也可以在指令声明中包含继续或中断条件：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

<a name="the-loop-variable"></a>
### 循环变量

在 `foreach` 循环中迭代时，循环内可以使用 `$loop` 变量。该变量提供了一些有用的信息，如当前循环索引以及是否为循环的第一次或最后一次迭代：

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

如果处于嵌套循环中，可以通过 `parent` 属性访问父循环的 `$loop` 变量：

```blade
@foreach ($users as $user)
    @foreach ($user->posts as $post)
        @if ($loop->parent->first)
            This is the first iteration of the parent loop.
        @endif
    @endforeach
@endforeach
```

`$loop` 变量还包含其他多种有用的属性：

| 属性                | 描述                                       |
|--------------------|-------------------------------------------|
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。            |
| `$loop->iteration` | 当前循环迭代次数（从 1 开始）。              |
| `$loop->remaining` | 循环中剩余的迭代次数。                       |
| `$loop->count`     | 正在迭代的数组中的项目总数。                  |
| `$loop->first`     | 是否为循环的第一次迭代。                      |
| `$loop->last`      | 是否为循环的最后一次迭代。                    |
| `$loop->even`      | 是否为循环的偶数迭代。                        |
| `$loop->odd`       | 是否为循环的奇数迭代。                        |
| `$loop->depth`     | 当前循环的嵌套层级。                         |
| `$loop->parent`    | 嵌套循环中父循环的循环变量。                   |

<a name="conditional-classes"></a>
### 条件类与样式

`@class` 指令会条件性地编译 CSS 类字符串。该指令接受一个类数组，数组的键包含要添加的类名，值是布尔表达式。如果数组元素具有数字键，则该类将始终包含在渲染的类列表中：

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

类似地，可以使用 `@style` 指令条件性地向 HTML 元素添加内联 CSS 样式：

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

为方便起见，可以使用 `@checked` 指令轻松指示给定的 HTML 复选框输入是否为"选中"状态。如果提供的条件求值为 `true`，该指令将输出 `checked`：

```blade
<input type="checkbox"
        name="active"
        value="active"
        @checked(old('active', $user->active)) />
```

类似地，可以使用 `@selected` 指令指示给定的 select 选项是否应为"选中"状态：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，可以使用 `@disabled` 指令指示给定元素是否应为"禁用"状态：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

此外，可以使用 `@readonly` 指令指示给定元素是否应为"只读"状态：

```blade
<input type="email"
        name="email"
        value="email@laravel.com"
        @readonly($user->isNotAdmin()) />
```

此外，可以使用 `@required` 指令指示给定元素是否应为"必填"状态：

```blade
<input type="text"
        name="title"
        value="title"
        @required($user->isAdmin()) />
```

<a name="including-subviews"></a>
### 包含子视图

> **Note**
> 虽然你可以自由使用 `@include` 指令，但 Blade [组件](#components)提供了类似的功能，并且在数据和属性绑定等方面比 `@include` 指令更有优势。

Blade 的 `@include` 指令允许在另一个视图中包含 Blade 视图。父视图中可用的所有变量都将对被包含的视图可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

虽然被包含的视图会继承父视图中所有可用的数据，但你也可以传递一个额外的数据数组，使其对被包含的视图可用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果尝试 `@include` 一个不存在的视图，Laravel 会抛出错误。如果想包含一个可能存在也可能不存在的视图，应使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果想在给定布尔表达式求值为 `true` 或 `false` 时包含视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要包含给定视图数组中第一个存在的视图，可以使用 `@includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

> **Warning**
> 应避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们会指向缓存编译后的视图的位置。

<a name="rendering-views-for-collections"></a>
#### 为集合渲染视图

可以使用 Blade 的 `@each` 指令将循环和包含合并为一行：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中的每个元素渲染的视图。第二个参数是要迭代的数组或集合，第三个参数是视图中当前迭代将分配到的变量名。例如，如果正在迭代 `jobs` 数组，通常希望在视图中以 `job` 变量访问每个 job。当前迭代的数组键将在视图中作为 `key` 变量可用。

还可以向 `@each` 指令传递第四个参数。该参数指定当给定数组为空时渲染的视图：

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> **Warning**
> 通过 `@each` 渲染的视图不会继承父视图的变量。如果子视图需要这些变量，应改用 `@foreach` 和 `@include` 指令。

<a name="the-once-directive"></a>
### `@once` 指令

`@once` 指令允许定义在每次渲染周期中只求值一次的模板部分。这对于使用[堆栈](#stacks)将给定 JavaScript 推入页面头部很有用。例如，如果在循环中渲染给定[组件](#components)，可能希望仅在组件第一次渲染时将 JavaScript 推入头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令经常与 `@push` 或 `@prepend` 指令配合使用，因此提供了 `@pushOnce` 和 `@prependOnce` 指令以方便使用：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript...
    </script>
@endPushOnce
```

<a name="raw-php"></a>
### 原生 PHP

在某些情况下，在视图中嵌入 PHP 代码很有用。可以使用 Blade 的 `@php` 指令在模板中执行一段原生 PHP 代码：

```blade
@php
    $counter = 1;
@endphp
```

如果只需要写一条 PHP 语句，可以在 `@php` 指令中包含该语句：

```blade
@php($counter = 1)
```

<a name="comments"></a>
### 注释

Blade 还允许在视图中定义注释。不过，与 HTML 注释不同，Blade 注释不会包含在应用返回的 HTML 中：

```blade
{{-- 此注释不会出现在渲染后的 HTML 中 --}}
```

<a name="components"></a>
## 组件

组件和插槽提供了与 section、布局和包含类似的优势；不过，有些人可能觉得组件和插槽的心智模型更容易理解。编写组件有两种方式：基于类的组件和匿名组件。

要创建基于类的组件，可以使用 `make:component` Artisan 命令。为了说明如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令会将组件放在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为组件创建一个视图模板。视图将放在 `resources/views/components` 目录中。在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现，因此通常无需进一步注册组件。

也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令会在 `app/View/Components/Forms` 目录中创建 `Input` 组件，视图将放在 `resources/views/components/forms` 目录中。

如果想创建匿名组件（只有 Blade 模板没有类的组件），可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令会在 `resources/views/components/forms/input.blade.php` 创建一个 Blade 文件，可以通过 `<x-forms.input />` 将其作为组件渲染。

<a name="manually-registering-package-components"></a>
#### 手动注册包组件

在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现。

但是，如果你正在构建使用 Blade 组件的包，则需要手动注册组件类及其 HTML 标签别名。通常应该在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 */
public function boot()
{
    Blade::component('package-alert', Alert::class);
}
```

组件注册后，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

或者，可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，`Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，位于 `Package\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 *
 * @return void
 */
public function boot()
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以使用 `package-name::` 语法通过供应商命名空间来使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名称转为大驼峰形式自动检测链接到此组件的类。子目录也支持使用"点"号表示法。

<a name="rendering-components"></a>
### 渲染组件

要显示组件，可以在 Blade 模板中使用 Blade 组件标签。Blade 组件标签以 `x-` 开头，后跟组件类的 kebab-case 名称：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类嵌套在 `app/View/Components` 目录的更深层，可以使用 `.` 字符指示目录嵌套。例如，假设组件位于 `app/View/Components/Inputs/Button.php`，可以这样渲染：

```blade
<x-inputs.button/>
```

<a name="passing-data-to-components"></a>
### 向组件传递数据

可以通过 HTML 属性向 Blade 组件传递数据。硬编码的原始值可以通过简单的 HTML 属性字符串传递给组件。PHP 表达式和变量应通过以 `:` 字符为前缀的属性传递给组件：

```blade
<x-alert type="error" :message="$message"/>
```

应该在组件类的构造函数中定义所有组件的数据属性。组件上的所有公共属性都会自动提供给组件的视图。无需从组件的 `render` 方法将数据传递给视图：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * 警告类型。
     *
     * @var string
     */
    public $type;

    /**
     * 警告消息。
     *
     * @var string
     */
    public $message;

    /**
     * 创建组件实例。
     *
     * @param  string  $type
     * @param  string  $message
     * @return void
     */
    public function __construct($type, $message)
    {
        $this->type = $type;
        $this->message = $message;
    }

    /**
     * 获取表示该组件的视图 / 内容。
     *
     * @return \Illuminate\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.alert');
    }
}
```

渲染组件时，可以通过按名称输出变量来显示组件公共变量的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

<a name="casing"></a>
#### 大小写

组件构造函数参数应使用 `camelCase` 指定，而在 HTML 属性中引用参数名时应使用 `kebab-case`。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 *
 * @param  string  $alertType
 * @return void
 */
public function __construct($alertType)
{
    $this->alertType = $alertType;
}
```

可以像这样向组件提供 `$alertType` 参数：

```blade
<x-alert alert-type="danger" />
```

<a name="short-attribute-syntax"></a>
#### 短属性语法

向组件传递属性时，还可以使用"短属性"语法。由于属性名通常与它们对应的变量名相同，这通常很方便：

```blade
{{-- 短属性语法... --}}
<x-profile :$userId :$name />

{{-- 等同于... --}}
<x-profile :user-id="$userId" :name="$name" />
```

<a name="escaping-attribute-rendering"></a>
#### 转义属性渲染

由于 Alpine.js 等某些 JavaScript 框架也使用冒号前缀属性，可以使用双冒号（`::`）前缀告知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

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

除了公共变量可供组件模板使用外，组件上的任何公共方法也可以被调用。例如，假设组件有一个 `isSelected` 方法：

```php
/**
 * 判断给定选项是否为当前选中的选项。
 *
 * @param  string  $option
 * @return bool
 */
public function isSelected($option)
{
    return $option === $this->selected;
}
```

可以从组件模板中通过调用与方法名匹配的变量来执行此方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

<a name="using-attributes-slots-within-component-class"></a>
#### 在组件类中访问属性和插槽

Blade 组件还允许在类的 `render` 方法中访问组件名称、属性和插槽。不过，要访问这些数据，应从组件的 `render` 方法返回一个闭包。该闭包将接收一个 `$data` 数组作为其唯一参数。此数组包含多个提供组件信息的元素：

```php
/**
 * 获取表示该组件的视图 / 内容。
 *
 * @return \Illuminate\View\View|\Closure|string
 */
public function render()
{
    return function (array $data) {
        // $data['componentName'];
        // $data['attributes'];
        // $data['slot'];

        return '<div>Components content</div>';
    };
}
```

`componentName` 等于 HTML 标签中 `x-` 前缀后使用的名称。因此 `<x-alert />` 的 `componentName` 将是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个 `Illuminate\Support\HtmlString` 实例，包含组件插槽的内容。

该闭包应返回一个字符串。如果返回的字符串对应于现有视图，则渲染该视图；否则，返回的字符串将作为内联 Blade 视图进行求值。

<a name="additional-dependencies"></a>
#### 附加依赖

如果组件需要 Laravel [服务容器](/docs/{{version}}/container)中的依赖，可以将它们列在组件的任何数据属性之前，容器会自动注入这些依赖：

```php
use App\Services\AlertCreator;

/**
 * 创建组件实例。
 *
 * @param  \App\Services\AlertCreator  $creator
 * @param  string  $type
 * @param  string  $message
 * @return void
 */
public function __construct(AlertCreator $creator, $type, $message)
{
    $this->creator = $creator;
    $this->type = $type;
    $this->message = $message;
}
```

<a name="hiding-attributes-and-methods"></a>
#### 隐藏属性 / 方法

如果想阻止某些公共方法或属性作为变量暴露给组件模板，可以将它们添加到组件的 `$except` 数组属性中：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * 警告类型。
     *
     * @var string
     */
    public $type;

    /**
     * 不应暴露给组件模板的属性 / 方法。
     *
     * @var array
     */
    protected $except = ['type'];
}
```

<a name="component-attributes"></a>
### 组件属性

我们已经了解了如何向组件传递数据属性；但有时可能需要指定不属于组件运行所需数据的额外 HTML 属性，例如 `class`。通常，你希望将这些额外属性传递给组件模板的根元素。例如，假设我们想这样渲染 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性都会自动添加到组件的"属性包"中。此属性包通过 `$attributes` 变量自动提供给组件。可以通过输出此变量在组件中渲染所有属性：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> **Warning**
> 目前不支持在组件标签内使用 `@env` 等指令。例如，`<x-alert :live="@env('production')"/>` 将不会被编译。

<a name="default-merged-attributes"></a>
#### 默认 / 合并属性

有时可能需要为属性指定默认值或将额外值合并到组件的某些属性中。为此，可以使用属性包的 `merge` 方法。此方法对于定义应始终应用于组件的一组默认 CSS 类特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

假设此组件按如下方式使用：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

组件最终渲染的 HTML 将如下所示：

```blade
<div class="alert alert-error mb-4">
    <!-- $message 变量的内容 -->
</div>
```

<a name="conditionally-merge-classes"></a>
#### 条件合并类

有时可能希望在给定条件为 `true` 时合并类。可以通过 `class` 方法实现，该方法接受一个类数组，数组的键包含要添加的类名，值是布尔表达式。如果数组元素具有数字键，则该类将始终包含在渲染的类列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果需要将其他属性合并到组件上，可以在 `class` 方法后链式调用 `merge` 方法：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> **Note**
> 如果需要在不应接收合并属性的其他 HTML 元素上条件编译类，可以使用 [`@class` 指令](#conditional-classes)。

<a name="non-class-attribute-merging"></a>
#### 非类属性合并

合并非 `class` 属性时，提供给 `merge` 方法的值将被视为属性的"默认"值。但与 `class` 属性不同，这些属性不会与注入的属性值合并，而是会被覆盖。例如，`button` 组件的实现可能如下：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要使用自定义 `type` 渲染按钮组件，可以在使用组件时指定。如果未指定 type，将使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

此示例中 `button` 组件渲染的 HTML 为：

```blade
<button type="submit">
    Submit
</button>
```

如果希望 `class` 以外的属性的默认值和注入值连接在一起，可以使用 `prepends` 方法。在此示例中，`data-controller` 属性将始终以 `profile-controller` 开头，任何额外的注入 `data-controller` 值将放在此默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

<a name="filtering-attributes"></a>
#### 检索和过滤属性

可以使用 `filter` 方法过滤属性。此方法接受一个闭包，如果希望将属性保留在属性包中，该闭包应返回 `true`：

```blade
{{ $attributes->filter(fn ($value, $key) => $key == 'foo') }}
```

为方便起见，可以使用 `whereStartsWith` 方法检索所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，可以使用 `whereDoesntStartWith` 方法排除所有键以给定字符串开头的属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果想检查组件上是否存在某个属性，可以使用 `has` 方法。此方法接受属性名作为其唯一参数，并返回一个布尔值指示属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class attribute is present</div>
@endif
```

可以使用 `get` 方法检索特定属性的值：

```blade
{{ $attributes->get('class') }}
```

<a name="reserved-keywords"></a>
### 保留关键字

默认情况下，某些关键字保留供 Blade 内部使用以渲染组件。以下关键字不能在组件中定义为公共属性或方法名：

- `data`
- `render`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

<a name="slots"></a>
### 插槽

你通常需要通过"插槽"向组件传递额外内容。组件插槽通过输出 `$slot` 变量来渲染。为了探索这个概念，假设 `alert` 组件有以下标记：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

可以通过向组件注入内容来将内容传递给 `slot`：

```blade
<x-alert>
    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

有时组件可能需要在组件内的不同位置渲染多个不同的插槽。让我们修改 alert 组件以允许注入"title"插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

可以使用 `x-slot` 标签定义命名插槽的内容。不在显式 `x-slot` 标签内的任何内容都将通过 `$slot` 变量传递给组件：

```blade
<x-alert>
    <x-slot:title>
        Server Error
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

<a name="scoped-slots"></a>
#### 作用域插槽

如果你使用过 Vue 等 JavaScript 框架，可能熟悉"作用域插槽"，它允许在插槽中访问组件的数据或方法。在 Laravel 中，可以通过在组件上定义公共方法或属性，并通过 `$component` 变量在插槽中访问组件来实现类似的行为。在此示例中，我们假设 `x-alert` 组件的组件类上定义了公共 `formatAlert` 方法：

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

与 Blade 组件类似，可以为插槽分配额外的[属性](#component-attributes)，如 CSS 类名：

```blade
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

要与插槽属性交互，可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请参阅[组件属性](#component-attributes)文档：

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

对于非常小的组件，同时管理组件类和组件视图模板可能显得繁琐。因此，可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取表示该组件的视图 / 内容。
 *
 * @return \Illuminate\View\View|\Closure|string
 */
public function render()
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

要创建渲染内联视图的组件，可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

<a name="dynamic-components"></a>
### 动态组件

有时可能需要渲染组件，但直到运行时才知道应该渲染哪个组件。在这种情况下，可以使用 Laravel 内置的 `dynamic-component` 组件基于运行时值或变量来渲染组件：

```blade
<x-dynamic-component :component="$componentName" class="mt-4" />
```

<a name="manually-registering-components"></a>
### 手动注册组件

> **Warning**
> 以下关于手动注册组件的文档主要适用于编写包含视图组件的 Laravel 包的开发者。如果你不是在编写包，这部分组件文档可能与你无关。

在为自己的应用编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现。

但是，如果你正在构建使用 Blade 组件的包，或将组件放在非约定目录中，则需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到组件。通常应该在包的服务提供者的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包的服务。
 *
 * @return void
 */
public function boot()
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册后，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，`Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，位于 `Package\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的服务。
 *
 * @return void
 */
public function boot()
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以使用 `package-name::` 语法通过供应商命名空间来使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会通过将组件名称转为大驼峰形式自动检测链接到此组件的类。子目录也支持使用"点"号表示法。

<a name="anonymous-components"></a>
## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。不过，匿名组件使用单个视图文件，没有关联的类。要定义匿名组件，只需在 `resources/views/components` 目录中放置一个 Blade 模板。例如，假设在 `resources/views/components/alert.blade.php` 定义了组件，可以这样渲染它：

```blade
<x-alert/>
```

可以使用 `.` 字符指示组件嵌套在 `components` 目录的更深处。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，可以这样渲染：

```blade
<x-inputs.button/>
```

<a name="anonymous-index-components"></a>
### 匿名索引组件

有时，当组件由许多 Blade 模板组成时，你可能希望将给定组件的模板分组在单个目录中。例如，假设有一个"accordion"组件，目录结构如下：

```none
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

此目录结构允许这样渲染 accordion 组件及其 item：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

但是，为了通过 `x-accordion` 渲染 accordion 组件，我们不得不将"index" accordion 组件模板放在 `resources/views/components` 目录中，而不是与其他 accordion 相关模板一起嵌套在 `accordion` 目录中。

幸运的是，Blade 允许在组件的模板目录中放置 `index.blade.php` 文件。当组件存在 `index.blade.php` 模板时，它将作为组件的"根"节点渲染。因此，我们可以继续使用上面示例中给出的相同 Blade 语法；不过，我们将调整目录结构如下：

```none
/resources/views/components/accordion/index.blade.php
/resources/views/components/accordion/item.blade.php
```

<a name="data-properties-attributes"></a>
### 数据属性 / 属性

由于匿名组件没有任何关联的类，你可能想知道如何区分哪些数据应作为变量传递给组件，哪些属性应放在组件的[属性包](#component-attributes)中。

可以在组件 Blade 模板顶部使用 `@props` 指令指定哪些属性应被视为数据变量。组件上的所有其他属性将通过组件的属性包可用。如果想为数据变量指定默认值，可以将变量名作为数组键，默认值作为数组值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

给定上面的组件定义，可以这样渲染组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

<a name="accessing-parent-data"></a>
### 访问父组件数据

有时你可能希望从子组件中访问父组件的数据。在这些情况下，可以使用 `@aware` 指令。例如，假设我们正在构建一个由父组件 `<x-menu>` 和子组件 `<x-menu.item>` 组成的复杂菜单组件：

```blade
<x-menu color="purple">
    <x-menu.item>...</x-menu.item>
    <x-menu.item>...</x-menu.item>
</x-menu>
```

`<x-menu>` 组件的实现可能如下：

```blade
<!-- /resources/views/components/menu/index.blade.php -->

@props(['color' => 'gray'])

<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>
```

因为 `color` prop 只传递给了父组件（`<x-menu>`），所以它在 `<x-menu.item>` 内部不可用。但是，如果使用 `@aware` 指令，我们也可以让它在 `<x-menu.item>` 内部可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> **Warning**
> `@aware` 指令无法访问未通过 HTML 属性显式传递给父组件的父组件数据。未显式传递给父组件的默认 `@props` 值无法通过 `@aware` 指令访问。

<a name="anonymous-component-paths"></a>
### 匿名组件路径

如前所述，匿名组件通常通过在 `resources/views/components` 目录中放置 Blade 模板来定义。不过，你可能偶尔希望在默认路径之外向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法接受匿名组件位置的"路径"作为第一个参数，以及组件应放置在其中的可选"命名空间"作为第二个参数。通常，此方法应从应用的某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用：

```php
/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

如上面的示例所示，当注册组件路径时未指定前缀，它们也可以在 Blade 组件中不带相应前缀进行渲染。例如，如果上面注册的路径中存在 `panel.blade.php` 组件，可以这样渲染：

```blade
<x-panel />
```

可以向 `anonymousComponentPath` 方法提供前缀"命名空间"作为第二个参数：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

提供前缀后，渲染时可以通过在组件名前加上组件的命名空间来渲染该"命名空间"内的组件：

```blade
<x-dashboard::panel />
```

<a name="building-layouts"></a>
## 构建布局

<a name="layouts-using-components"></a>
### 使用组件构建布局

大多数 Web 应用在不同页面间保持相同的基本布局。如果必须在我们创建的每个视图中重复整个布局 HTML，那将非常繁琐且难以维护。幸运的是，将此布局定义为单个 [Blade 组件](#components)然后在整个应用中使用它非常方便。

<a name="defining-the-layout-component"></a>
#### 定义布局组件

例如，假设我们正在构建一个"todo"列表应用。我们可以定义一个如下所示的 `layout` 组件：

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

定义 `layout` 组件后，我们可以创建使用该组件的 Blade 视图。在此示例中，我们将定义一个显示任务列表的简单视图：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        {{ $task }}
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容将提供给 `layout` 组件内的默认 `$slot` 变量。你可能已经注意到，如果提供了 `$title` 插槽，我们的 `layout` 也会遵循它；否则，将显示默认标题。我们可以使用[组件文档](#components)中讨论的标准插槽语法从任务列表视图中注入自定义标题：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    <x-slot:title>
        Custom Title
    </x-slot>

    @foreach ($tasks as $task)
        {{ $task }}
    @endforeach
</x-layout>
```

现在我们已经定义了布局和任务列表视图，只需从路由返回 `task` 视图：

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

也可以通过"模板继承"创建布局。这是在引入[组件](#components)之前构建应用的主要方式。

首先，让我们看一个简单的示例。我们将先检查页面布局。由于大多数 Web 应用在不同页面间保持相同的基本布局，将此布局定义为单个 Blade 视图非常方便：

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

如你所见，此文件包含典型的 HTML 标记。但请注意 `@section` 和 `@yield` 指令。顾名思义，`@section` 指令定义一个内容 section，而 `@yield` 指令用于显示给定 section 的内容。

现在我们已经为应用定义了布局，让我们定义一个继承该布局的子页面。

<a name="extending-a-layout"></a>
#### 扩展布局

定义子视图时，使用 `@extends` Blade 指令指定子视图应"继承"哪个布局。扩展 Blade 布局的视图可以使用 `@section` 指令将内容注入布局的 section 中。请记住，如上面示例所示，这些 section 的内容将使用 `@yield` 在布局中显示：

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

在此示例中，`sidebar` section 使用 `@@parent` 指令将内容追加（而非覆盖）到布局的 sidebar。`@@parent` 指令将在视图渲染时被布局的内容替换。

> **Note**
> 与前面的示例不同，此 `sidebar` section 以 `@endsection` 而非 `@show` 结束。`@endsection` 指令只定义一个 section，而 `@show` 会定义并**立即输出**该 section。

`@yield` 指令还接受默认值作为其第二个参数。如果被输出的 section 未定义，则将渲染此值：

```blade
@yield('content', 'Default content')
```

<a name="forms"></a>
## 表单

<a name="csrf-field"></a>
### CSRF 字段

在应用中定义 HTML 表单时，应在表单中包含一个隐藏的 CSRF token 字段，以便 [CSRF 保护](/docs/{{version}}/csrf)中间件可以验证请求。可以使用 `@csrf` Blade 指令生成 token 字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

<a name="method-field"></a>
### Method 字段

由于 HTML 表单无法发出 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 动词。`@method` Blade 指令可以为你创建此字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

<a name="validation-errors"></a>
### 验证错误

`@error` 指令可用于快速检查给定属性是否存在[验证错误消息](/docs/{{version}}/validation#quick-displaying-the-validation-errors)。在 `@error` 指令内，可以输出 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">Post Title</label>

<input id="title"
    type="text"
    class="@error('title') is-invalid @enderror">

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

由于 `@error` 指令会编译为"if"语句，因此可以使用 `@else` 指令在属性没有错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror">
```

可以将[特定错误包的名称](/docs/{{version}}/validation#named-error-bags)作为 `@error` 指令的第二个参数传递，以在包含多个表单的页面上检索验证错误消息：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input id="email"
    type="email"
    class="@error('email', 'login') is-invalid @enderror">

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

如果想在给定布尔表达式求值为 `true` 时 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

可以根据需要多次推送到堆栈。要渲染完整的堆栈内容，请将堆栈名称传递给 `@stack` 指令：

```blade
<head>
    <!-- Head 内容 -->

    @stack('scripts')
</head>
```

如果想将内容前插到堆栈的开头，应使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// 之后...

@prepend('scripts')
    This will be first...
@endprepend
```

<a name="service-injection"></a>
## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/docs/{{version}}/container)中检索服务。传递给 `@inject` 的第一个参数是服务将放入的变量名，第二个参数是要解析的服务的类或接口名：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

<a name="rendering-inline-blade-templates"></a>
## 渲染内联 Blade 模板

有时你可能需要将原始 Blade 模板字符串转换为有效的 HTML。可以使用 `Blade` Facade 提供的 `render` 方法来完成此操作。`render` 方法接受 Blade 模板字符串和要提供给模板的可选数据数组：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过将内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果希望 Laravel 在渲染 Blade 模板后删除这些临时文件，可以向方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

<a name="rendering-blade-fragments"></a>
## 渲染 Blade 片段

当使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你可能偶尔只需要在 HTTP 响应中返回 Blade 模板的一部分。Blade"片段"正好可以实现这一点。首先，将 Blade 模板的一部分放在 `@fragment` 和 `@endfragment` 指令之间：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用此模板的视图时，可以调用 `fragment` 方法指定只有指定片段应包含在传出的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的片段。否则，将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许在响应中返回多个视图片段。这些片段将被连接在一起：

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

以下示例创建一个 `@datetime($var)` 指令，用于格式化给定的 `$var`（应为 `DateTime` 实例）：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Blade::directive('datetime', function ($expression) {
            return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
        });
    }
}
```

如你所见，我们会将 `format` 方法链式调用到传递给指令的任何表达式上。因此，在此示例中，此指令生成的最终 PHP 代码为：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> **Warning**
> 更新 Blade 指令的逻辑后，需要删除所有缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令删除缓存的 Blade 视图。

<a name="custom-echo-handlers"></a>
### 自定义 Echo 处理器

如果尝试使用 Blade"echo"一个对象，将调用该对象的 `__toString` 方法。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的"魔术方法"之一。但是，有时你可能无法控制给定类的 `__toString` 方法，例如当你交互的类属于第三方库时。

在这些情况下，Blade 允许你为该特定类型的对象注册自定义 echo 处理器。为此，应调用 Blade 的 `stringable` 方法。`stringable` 方法接受一个闭包。此闭包应类型提示它负责渲染的对象类型。通常，`stringable` 方法应在应用的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Blade;
use Money\Money;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Blade::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

定义自定义 echo 处理器后，只需在 Blade 模板中输出该对象即可：

```blade
Cost: {{ $money }}
```

<a name="custom-if-statements"></a>
### 自定义 If 语句

在定义简单的自定义条件语句时，编写自定义指令有时比必要的更复杂。因此，Blade 提供了 `Blade::if` 方法，允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个检查应用配置的默认"磁盘"的自定义条件。可以在 `AppServiceProvider` 的 `boot` 方法中执行此操作：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Blade::if('disk', function ($value) {
        return config('filesystems.default') === $value;
    });
}
```

定义自定义条件后，就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用正在使用 local 磁盘... -->
@elsedisk('s3')
    <!-- 应用正在使用 s3 磁盘... -->
@else
    <!-- 应用正在使用其他磁盘... -->
@enddisk

@unlessdisk('local')
    <!-- 应用未使用 local 磁盘... -->
@enddisk
```
