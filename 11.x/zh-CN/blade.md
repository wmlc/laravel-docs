# Blade 模板

- [简介](#introduction)
    - [用 Livewire 为 Blade 加速](#supercharging-blade-with-livewire)
- [显示数据](#displaying-data)
    - [HTML 实体编码](#html-entity-encoding)
    - [Blade 与 JavaScript 框架](#blade-and-javascript-frameworks)
- [Blade 指令](#blade-directives)
    - [条件语句](#if-statements)
    - [Switch 语句](#switch-statements)
    - [循环](#loops)
    - [循环变量](#the-loop-variable)
    - [条件类名](#conditional-classes)
    - [附加属性](#additional-attributes)
    - [引入子视图](#including-subviews)
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
    - [数据属性 / 属性](#data-properties-attributes)
    - [访问父级数据](#accessing-parent-data)
    - [匿名组件路径](#anonymous-component-paths)
- [构建布局](#building-layouts)
    - [使用组件的布局](#layouts-using-components)
    - [使用模板继承的布局](#layouts-using-template-inheritance)
- [表单](#forms)
    - [CSRF 字段](#csrf-field)
    - [Method 字段](#method-field)
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

Blade 是 Laravel 自带的模板引擎，简单却功能强大。与某些 PHP 模板引擎不同，Blade 并不限制你在模板中使用纯 PHP 代码。事实上，所有 Blade 模板都会被编译成纯 PHP 代码并缓存起来，直到模板被修改为止，这意味着 Blade 几乎不会给你的应用增加任何额外开销。Blade 模板文件使用 `.blade.php` 扩展名，通常存放在 `resources/views` 目录中。

你可以通过全局的 `view` 辅助函数从路由或控制器返回 Blade 视图。当然，正如[视图](/docs/{{version}}/views)文档中提到的，你还可以使用 `view` 辅助函数的第二个参数向 Blade 视图传递数据：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

<a name="supercharging-blade-with-livewire"></a>
### 用 Livewire 为 Blade 加速

想让你的 Blade 模板更上一层楼，轻松构建动态界面吗？快来看看 [Laravel Livewire](https://livewire.laravel.com)。Livewire 让你可以编写 Blade 组件，并为其增强动态功能——这些功能通常只有借助 React 或 Vue 等前端框架才能实现。这样你就能构建现代、响应式的前端，而不必承受众多 JavaScript 框架带来的复杂度、客户端渲染和构建步骤。

<a name="displaying-data"></a>
## 显示数据

你只需把变量用花括号括起来，就能显示传给 Blade 视图的数据。例如，给定以下路由：

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

你所能显示的不只是传给视图的变量内容。你也可以输出任意 PHP 函数的返回值。事实上，你可以把任何 PHP 代码放进 Blade 输出语句中：

```blade
The current UNIX timestamp is {{ time() }}.
```

<a name="html-entity-encoding"></a>
### HTML 实体编码

默认情况下，Blade（以及 Laravel 的 `e` 函数）会对 HTML 实体进行双重编码。如果你想禁用双重编码，可以在 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导应用的所有服务。
     */
    public function boot(): void
    {
        Blade::withoutDoubleEncoding();
    }
}
```

<a name="displaying-unescaped-data"></a>
#### 显示未转义的数据

默认情况下，Blade 的 `{{ }}` 语句会自动经过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。如果你不想让数据被转义，可以使用如下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 输出由应用用户提供的内容时务必格外小心。你通常应当使用带转义的双花括号语法，以在显示用户提供的数据时防止 XSS 攻击。

<a name="blade-and-javascript-frameworks"></a>
### Blade 与 JavaScript 框架

由于许多 JavaScript 框架也使用「花括号」来表示某个表达式应当显示在浏览器中，你可以使用 `@` 符号告知 Blade 渲染引擎保持某个表达式原样不动。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在这个例子中，`@` 符号会被 Blade 移除；而 `{{ name }}` 表达式则不会被 Blade 引擎改动，从而交由你的 JavaScript 框架渲染。

`@` 符号也可以用来转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

<a name="rendering-json"></a>
#### 渲染 JSON

有时你会把一个数组传给视图，希望把它渲染成 JSON 以初始化一个 JavaScript 变量。例如：

```blade
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

不过，你不必手动调用 `json_encode`，而是可以使用 `Illuminate\Support\Js::from` 方法指令。`from` 方法接受的参数与 PHP 的 `json_encode` 函数相同，并且它会确保生成的 JSON 已正确转义，可以安全地嵌入 HTML 引号中。`from` 方法会返回一条 `JSON.parse` JavaScript 语句，把给定对象或数组转换成合法的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

最新版本的 Laravel 应用骨架包含一个 `Js` Facade，方便你在 Blade 模板中访问该功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你只应当使用 `Js::from` 方法把已有变量渲染为 JSON。Blade 模板基于正则表达式工作，向该指令传入复杂表达式可能导致意外失败。

<a name="the-at-verbatim-directive"></a>
#### `@verbatim` 指令

如果你在模板的很大一部分内容中都要显示 JavaScript 变量，可以用 `@verbatim` 指令把 HTML 包起来，这样就不必为每一条 Blade 输出语句加上 `@` 符号前缀：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

<a name="blade-directives"></a>
## Blade 指令

除了模板继承和数据显示之外，Blade 还为常见的 PHP 控制结构提供了便捷的快捷方式，例如条件语句和循环。这些快捷方式既提供了一套非常简洁明快的 PHP 控制结构写法，又与其 PHP 对应写法保持一致。

<a name="if-statements"></a>
### 条件语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令构造 `if` 语句。这些指令的功能与对应的 PHP 写法完全相同：

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

除了前面介绍过的条件指令外，你还可以使用 `@isset` 和 `@empty` 指令，作为对应 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records 已定义且不为 null……
@endisset

@empty($records)
    // $records 是「空的」……
@endempty
```

<a name="authentication-directives"></a>
#### 认证指令

`@auth` 和 `@guest` 指令可用于快速判断当前用户是否已[通过认证](/docs/{{version}}/authentication)或者是访客：

```blade
@auth
    // 用户已通过认证……
@endauth

@guest
    // 用户未通过认证……
@endguest
```

如有需要，你可以在使用 `@auth` 和 `@guest` 指令时指定要检查的认证守卫：

```blade
@auth('admin')
    // 用户已通过认证……
@endauth

@guest('admin')
    // 用户未通过认证……
@endguest
```

<a name="environment-directives"></a>
#### 环境指令

你可以使用 `@production` 指令检查应用是否运行在生产环境：

```blade
@production
    // 生产环境专属内容……
@endproduction
```

或者，你也可以使用 `@env` 指令判断应用是否运行在特定环境中：

```blade
@env('staging')
    // 应用运行在 "staging" 环境……
@endenv

@env(['staging', 'production'])
    // 应用运行在 "staging" 或 "production" 环境……
@endenv
```

<a name="section-directives"></a>
#### 区块指令

你可以使用 `@hasSection` 指令判断模板继承中的某个区块是否含有内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

你可以使用 `sectionMissing` 指令来判断某个区块是否没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

<a name="session-directives"></a>
#### 会话指令

`@session` 指令可用于判断某个[会话](/docs/{{version}}/session)值是否存在。如果该会话值存在，`@session` 与 `@endsession` 指令内的模板内容就会被求值。在 `@session` 指令的内容中，你可以输出 `$value` 变量来显示该会话值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

<a name="switch-statements"></a>
### Switch 语句

你可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令构造 Switch 语句：

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

除了条件语句之外，Blade 还为处理 PHP 的循环结构提供了简洁的指令。同样，这些指令的功能与对应的 PHP 写法完全相同：

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
> 在遍历 `foreach` 循环时，你可以使用[循环变量](#the-loop-variable)获取关于循环的重要信息，例如当前处于第一次迭代还是最后一次迭代。

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

你也可以把继续或跳出循环的条件直接写进指令声明中：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

<a name="the-loop-variable"></a>
### 循环变量

在遍历 `foreach` 循环时，循环内部会有一个可用的 `$loop` 变量。该变量让你能获取一些有用的信息，例如当前循环索引，以及当前是第一次迭代还是最后一次迭代：

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

`$loop` 变量还包含其他许多有用的属性：

<div class="overflow-auto">

| 属性               | 说明                                                 |
| ------------------ | ---------------------------------------------------- |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。                    |
| `$loop->iteration` | 当前的循环迭代（从 1 开始）。                        |
| `$loop->remaining` | 循环中剩余的迭代次数。                               |
| `$loop->count`     | 正在遍历的数组中的项目总数。                         |
| `$loop->first`     | 当前是否为循环的第一次迭代。                         |
| `$loop->last`      | 当前是否为循环的最后一次迭代。                       |
| `$loop->even`      | 当前是否为循环中的偶数次迭代。                       |
| `$loop->odd`       | 当前是否为循环中的奇数次迭代。                       |
| `$loop->depth`     | 当前循环的嵌套层级。                                 |
| `$loop->parent`    | 在嵌套循环中，父级的循环变量。                       |

</div>

<a name="conditional-classes"></a>
### 条件类名与样式

`@class` 指令可以有条件地编译出一个 CSS 类名字符串。该指令接受一个类名数组，其中数组的键是你希望添加的类名，值则是布尔表达式。如果数组元素使用数字键，它将始终被包含在渲染后的类名列表中：

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

同样地，`@style` 指令可用于有条件地为 HTML 元素添加内联 CSS 样式：

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

为方便起见，你可以使用 `@checked` 指令轻松标明某个 HTML 复选框输入是否「已勾选」。如果所提供的条件求值为 `true`，该指令会输出 `checked`：

```blade
<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
```

同样地，`@selected` 指令可用于标明某个选项是否「已选中」：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于标明某个元素是否「已禁用」：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

而且，`@readonly` 指令可用于标明某个元素是否「只读」：

```blade
<input
    type="email"
    name="email"
    value="email@laravel.com"
    @readonly($user->isNotAdmin())
/>
```

另外，`@required` 指令可用于标明某个元素是否「必填」：

```blade
<input
    type="text"
    name="title"
    value="title"
    @required($user->isAdmin())
/>
```

<a name="including-subviews"></a>
### 引入子视图

> [!NOTE]
> 尽管你可以自由使用 `@include` 指令，但 Blade [组件](#components)提供了类似的功能，并且相比 `@include` 指令具有多项优势，例如数据绑定和属性绑定。

Blade 的 `@include` 指令允许你在一个视图中引入另一个 Blade 视图。所有对父视图可用的变量，也同样会对被引入的视图可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

虽然被引入的视图会继承父视图中所有可用的数据，你也可以传入一个额外的数据数组，供被引入的视图使用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 会抛出错误。如果你想引入一个可能存在也可能不存在的视图，应当使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你想在给定布尔表达式求值为 `true` 或 `false` 时 `@include` 某个视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要从给定的一组视图中引入第一个存在的视图，可以使用 `includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

> [!WARNING]
> 你应当避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们指向的是缓存后的、已编译视图所在的位置。

<a name="rendering-views-for-collections"></a>
#### 为集合渲染视图

你可以使用 Blade 的 `@each` 指令，把循环和引入合并到一行中：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中每个元素渲染的视图。第二个参数是你希望遍历的数组或集合，第三个参数则是视图中赋给当前迭代项的变量名。因此，例如，当你遍历一个 `jobs` 数组时，通常你希望在视图中通过 `job` 变量访问每个任务。当前迭代项对应的数组键则以 `key` 变量的形式在视图中可用。

你还可以向 `@each` 指令传入第四个参数。该参数决定当给定数组为空时要渲染的视图。

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图中的变量。如果子视图需要这些变量，你应当改用 `@foreach` 和 `@include` 指令。

<a name="the-once-directive"></a>
### `@once` 指令

`@once` 指令允许你定义一段在每个渲染周期中只求值一次的模板内容。这对于使用[栈](#stacks)把某段 JavaScript 推送到页面头部很有用。例如，如果你正在循环中渲染某个[组件](#components)，你可能希望只在该组件首次渲染时把 JavaScript 推送到头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript……
        </script>
    @endpush
@endonce
```

由于 `@once` 指令经常与 `@push` 或 `@prepend` 指令配合使用，Laravel 还提供了 `@pushOnce` 和 `@prependOnce` 指令以方便你使用：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript……
    </script>
@endPushOnce
```

<a name="raw-php"></a>
### 原生 PHP

在某些场景下，把 PHP 代码嵌入视图中会非常方便。你可以使用 Blade 的 `@php` 指令在模板中执行一段纯 PHP 代码：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只是需要用 PHP 导入某个类，可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

你还可以向 `@use` 指令提供第二个参数，为导入的类设置别名：

```php
@use('App\Models\Flight', 'FlightModel')
```

<a name="comments"></a>
### 注释

Blade 也允许你在视图中定义注释。不过，与 HTML 注释不同，Blade 注释不会出现在应用返回的 HTML 中：

```blade
{{-- 此注释不会出现在渲染后的 HTML 中 --}}
```

<a name="components"></a>
## 组件

组件和插槽带来的好处与区块、布局和引入类似；不过，有些人可能更容易理解组件和插槽的心智模型。编写组件有两种方式：基于类的组件和匿名组件。

要创建一个基于类的组件，你可以使用 `make:component` Artisan 命令。为说明如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令会把组件放到 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还会为该组件创建一个视图模板。该视图会被放在 `resources/views/components` 目录中。为自己的应用编写组件时，`app/View/Components` 目录和 `resources/views/components` 目录下的组件会被自动发现，因此通常无需再额外注册组件。

你也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令会在 `app/View/Components/Forms` 目录中创建 `Input` 组件，视图则会被放在 `resources/views/components/forms` 目录中。

如果你想创建一个匿名组件（即只有 Blade 模板而没有类的组件），可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令会在 `resources/views/components/forms/input.blade.php` 处创建一个 Blade 文件，可通过 `<x-forms.input />` 作为组件渲染。

<a name="manually-registering-package-components"></a>
#### 手动注册包组件

为自己的应用编写组件时，`app/View/Components` 目录和 `resources/views/components` 目录下的组件会被自动发现。

不过，如果你正在构建一个使用 Blade 组件的包，就需要手动注册组件类及其 HTML 标签别名。你通常应当在包的服务提供者（Service Provider）的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的所有服务。
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

组件注册之后，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

或者，你也可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能有位于 `Package\Views\Components` 命名空间下的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的所有服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以使用 `package-name::` 语法按包的命名空间使用组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会自动把组件名转为帕斯卡命名（pascal-casing），从而检测出与该组件关联的类。你也可以使用「点」记号法来支持子目录。

<a name="rendering-components"></a>
### 渲染组件

要显示一个组件，你可以在任意 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后接组件类的短横线命名形式：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类在 `app/View/Components` 目录中嵌套得更深，你可以使用 `.` 字符表示目录嵌套。例如，假设某个组件位于 `app/View/Components/Inputs/Button.php`，你可以这样渲染它：

```blade
<x-inputs.button/>
```

如果你需要有条件地渲染组件，可以在组件类上定义 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，该组件将不会被渲染：

```php
use Illuminate\Support\Str;

/**
 * 是否应当渲染该组件
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

<a name="index-components"></a>
### 索引组件

有时组件属于某个组件组，你可能希望把相关组件归到同一个目录下。例如，假设有一个「card」组件，其类结构如下：

```none
App\Views\Components\Card\Card
App\Views\Components\Card\Header
App\Views\Components\Card\Body
```

由于根组件 `Card` 嵌套在 `Card` 目录中，你可能会以为需要通过 `<x-card.card>` 来渲染该组件。不过，当某个组件的文件名与其所在目录的名称相同时，Laravel 会自动认为该组件是「根」组件，允许你在不重复目录名的情况下渲染它：

```blade
<x-card>
    <x-card.header>...</x-card.header>
    <x-card.body>...</x-card.body>
</x-card>
```

<a name="passing-data-to-components"></a>
### 向组件传递数据

你可以通过 HTML 属性向 Blade 组件传递数据。硬编码的基础类型值可以使用简单的 HTML 属性字符串传给组件。PHP 表达式和变量则应当通过以 `:` 字符为前缀的属性传给组件：

```blade
<x-alert type="error" :message="$message"/>
```

你应当在组件的类构造函数中定义该组件的所有数据属性。组件上的所有公共属性都会自动对该组件的视图可用。你不必在组件的 `render` 方法中把数据传给视图：

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
     * 获取代表该组件的视图 / 内容。
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

组件被渲染时，你可以通过按名称输出变量来显示组件的公共变量内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

<a name="casing"></a>
#### 命名风格

组件构造函数参数应当使用 `camelCase` 指定，而在 HTML 属性中引用参数名时应当使用 `kebab-case`。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 */
public function __construct(
    public string $alertType,
) {}
```

可以这样把 `$alertType` 参数传给组件：

```blade
<x-alert alert-type="danger" />
```

<a name="short-attribute-syntax"></a>
#### 简写属性语法

向组件传递属性时，你还可以使用「简写属性」语法。由于属性名经常与其对应的变量名相同，这种写法往往非常方便：

```blade
{{-- 简写属性语法…… --}}
<x-profile :$userId :$name />

{{-- 等价于…… --}}
<x-profile :user-id="$userId" :name="$name" />
```

<a name="escaping-attribute-rendering"></a>
#### 属性的转义渲染

由于某些 JavaScript 框架（例如 Alpine.js）也使用以冒号为前缀的属性，你可以使用双冒号（`::`）前缀来告知 Blade：该属性不是 PHP 表达式。例如，给定以下组件：

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

除了公共变量对组件模板可用之外，组件上的任何公共方法都可以被调用。例如，假设某个组件带有一个 `isSelected` 方法：

```php
/**
 * 判断给定选项是否为当前选中的选项。
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以在组件模板中调用与该方法同名的变量来执行它：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

<a name="using-attributes-slots-within-component-class"></a>
#### 在组件类中访问属性和插槽

Blade 组件还允许你在类的 `render` 方法中访问组件名称、属性和插槽。不过，为了访问这些数据，你应当从组件的 `render` 方法返回一个闭包：

```php
use Closure;

/**
 * 获取代表该组件的视图 / 内容。
 */
public function render(): Closure
{
    return function () {
        return '<div {{ $attributes }}>Components content</div>';
    };
}
```

组件的 `render` 方法所返回的闭包还可以接收一个 `$data` 数组作为唯一参数。该数组将包含若干元素，提供关于组件的信息：

```php
return function (array $data) {
    // $data['componentName'];
    // $data['attributes'];
    // $data['slot'];

    return '<div {{ $attributes }}>Components content</div>';
}
```

> [!WARNING]
> `$data` 数组中的元素绝不应直接嵌入 `render` 方法所返回的 Blade 字符串中，否则可能导致攻击者通过恶意的属性内容远程执行代码。

`componentName` 等于 HTML 标签中 `x-` 前缀之后所使用的名称。因此 `<x-alert />` 的 `componentName` 是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个 `Illuminate\Support\HtmlString` 实例，其中包含组件插槽的内容。

该闭包应当返回一个字符串。如果返回的字符串对应某个已存在的视图，那么该视图会被渲染；否则，返回的字符串将作为内联 Blade 视图被求值。

<a name="additional-dependencies"></a>
#### 附加依赖

如果你的组件需要 Laravel [服务容器（Service Container）](/docs/{{version}}/container)中的依赖，可以把它们列在组件所有数据属性之前，容器会自动注入它们：

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

如果你想阻止某些公共方法或属性作为变量暴露给组件模板，可以把它们添加到组件的 `$except` 数组属性中：

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

我们已经讨论过如何向组件传递数据属性；不过，有时你可能还需要指定额外的 HTML 属性（例如 `class`），它们并不属于组件运行所需的数据。通常，你希望把这些额外属性向下传递到组件模板的根元素上。例如，假设我们想这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性都会自动被加入组件的「属性包」。该属性包通过 `$attributes` 变量自动提供给组件。在组件内部，你只需输出这个变量即可渲染所有属性：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> [!WARNING]
> 目前尚不支持在组件标签中使用 `@env` 之类的指令。例如，`<x-alert :live="@env('production')"/>` 不会被编译。

<a name="default-merged-attributes"></a>
#### 默认 / 合并属性

有时你需要为属性指定默认值，或者把额外的值合并到组件的某些属性中。为此，你可以使用属性包的 `merge` 方法。该方法对于定义一组始终应应用到组件上的默认 CSS 类名尤其有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

假设该组件是这样使用的：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

那么该组件最终渲染出的 HTML 如下：

```blade
<div class="alert alert-error mb-4">
    <!-- $message 变量的内容 -->
</div>
```

<a name="conditionally-merge-classes"></a>
#### 有条件地合并类名

有时你希望在给定条件为 `true` 时才合并某些类名。你可以使用 `class` 方法来实现这一点，该方法接受一个类名数组，其中数组的键是你希望添加的类名，值则是布尔表达式。如果数组元素使用数字键，它将始终被包含在渲染后的类名列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果需要把其他属性合并到组件上，你可以把 `merge` 方法链式地接在 `class` 方法之后：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]
> 如果你需要在其他不应接收合并属性的 HTML 元素上有条件地编译类名，可以使用 [`@class` 指令](#conditional-classes)。

<a name="non-class-attribute-merging"></a>
#### 非 class 属性的合并

在合并不是 `class` 的属性时，传给 `merge` 方法的值会被视为该属性的「默认」值。不过，与 `class` 属性不同，这些属性不会与注入的属性值合并，而是会被覆盖。例如，一个 `button` 组件的实现可能如下：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要以自定义的 `type` 渲染该 button 组件，可以在使用组件时指定该类型。如果没有指定类型，则会使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

在这个例子中，`button` 组件渲染出的 HTML 将会是：

```blade
<button type="submit">
    Submit
</button>
```

如果你希望某个非 `class` 属性的默认值与注入值拼接在一起，可以使用 `prepends` 方法。在这个例子中，`data-controller` 属性总是以 `profile-controller` 开头，任何额外注入的 `data-controller` 值都会放在该默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

<a name="filtering-attributes"></a>
#### 获取与过滤属性

你可以使用 `filter` 方法过滤属性。该方法接受一个闭包，如果你希望把某个属性保留在属性包中，该闭包就应返回 `true`：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为方便起见，你可以使用 `whereStartsWith` 方法获取所有键以某个给定字符串开头的属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，`whereDoesntStartWith` 方法可用于排除所有键以某个给定字符串开头的属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你想检查某个属性是否存在于组件上，可以使用 `has` 方法。该方法接受属性名作为唯一参数，并返回一个布尔值，指示该属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class attribute is present</div>
@endif
```

如果向 `has` 方法传入一个数组，该方法会判断给定的所有属性是否都存在于组件上：

```blade
@if ($attributes->has(['name', 'class']))
    <div>All of the attributes are present</div>
@endif
```

`hasAny` 方法可用于判断给定属性中是否有任意一个存在于组件上：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>One of the attributes is present</div>
@endif
```

你可以使用 `get` 方法获取某个属性的值：

```blade
{{ $attributes->get('class') }}
```

<a name="reserved-keywords"></a>
### 保留关键字

默认情况下，某些关键字被保留给 Blade 内部用于渲染组件。以下关键字不能在组件中定义为公共属性或方法名：

<div class="content-list" markdown="1">

- `data`
- `render`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

</div>

<a name="slots"></a>
### 插槽

你经常需要通过「插槽」向组件传递额外内容。组件插槽通过输出 `$slot` 变量来渲染。为了理解这个概念，假设有一个 `alert` 组件，其标记如下：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以通过向组件注入内容，把内容传给 `slot`：

```blade
<x-alert>
    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

有时组件需要在组件内部的不同位置渲染多个不同的插槽。让我们修改 alert 组件，允许注入一个「title」插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签定义具名插槽的内容。任何不在显式 `x-slot` 标签内的内容，都会通过 `$slot` 变量传给组件：

```blade
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

此外，`hasActualContent` 方法可用于判断插槽是否包含任何非 HTML 注释的「实际」内容：

```blade
@if ($slot->hasActualContent())
    The scope has non-comment content.
@endif
```

<a name="scoped-slots"></a>
#### 作用域插槽

如果你使用过 Vue 之类的 JavaScript 框架，可能对「作用域插槽」并不陌生，它允许你在插槽中访问组件的数据或方法。在 Laravel 中，你可以通过在组件上定义公共方法或属性，并通过 `$component` 变量在插槽内访问组件，来实现类似的行为。在这个例子中，我们假设 `x-alert` 组件的组件类上定义了一个公共的 `formatAlert` 方法：

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

与 Blade 组件一样，你可以为插槽指定额外的[属性](#component-attributes)，例如 CSS 类名：

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

要与插槽属性交互，你可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请查阅[组件属性](#component-attributes)文档：

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

对于非常小的组件来说，同时管理组件类和组件的视图模板可能显得繁琐。为此，你可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取代表该组件的视图 / 内容。
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

有时你需要渲染一个组件，但直到运行时才知道该渲染哪个组件。在这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件，根据运行时的值或变量来渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

<a name="manually-registering-components"></a>
### 手动注册组件

> [!WARNING]
> 下面关于手动注册组件的文档主要适用于那些编写包含视图组件的 Laravel 包的开发者。如果你不是在做包开发，那么这部分的组件文档可能与你无关。

为自己的应用编写组件时，`app/View/Components` 目录和 `resources/views/components` 目录下的组件会被自动发现。

不过，如果你正在构建一个使用 Blade 组件的包，或者把组件放在非常规目录中，就需要手动注册组件类及其 HTML 标签别名，以便 Laravel 知道去哪里查找该组件。你通常应当在包的服务提供者（Service Provider）的 `boot` 方法中注册组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导包的所有服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

组件注册之后，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你也可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能有位于 `Package\Views\Components` 命名空间下的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导包的所有服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这样就可以使用 `package-name::` 语法按包的命名空间使用组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 会自动把组件名转为帕斯卡命名（pascal-casing），从而检测出与该组件关联的类。你也可以使用「点」记号法来支持子目录。

<a name="anonymous-components"></a>
## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件来管理组件的机制。不过，匿名组件只使用一个视图文件，并没有关联的类。要定义匿名组件，你只需把一个 Blade 模板放在 `resources/views/components` 目录中。例如，假设你在 `resources/views/components/alert.blade.php` 定义了一个组件，就可以这样简单地渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符表示组件在 `components` 目录中嵌套得更深。例如，假设该组件定义在 `resources/views/components/inputs/button.blade.php`，你可以这样渲染它：

```blade
<x-inputs.button/>
```

<a name="anonymous-index-components"></a>
### 匿名索引组件

有时一个组件由许多 Blade 模板组成，你可能希望把该组件的各个模板归到同一个目录下。例如，假设有一个「accordion」组件，其目录结构如下：

```none
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

这种目录结构让你可以这样渲染 accordion 组件及其条目：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

不过，为了通过 `x-accordion` 渲染 accordion 组件，我们被迫把「索引」accordion 组件模板放在 `resources/views/components` 目录中，而不是把它和其他 accordion 相关模板一起嵌套在 `accordion` 目录里。

所幸，Blade 允许你在组件目录内部放置一个与该组件目录同名的文件。当这个模板存在时，即使它嵌套在某个目录中，也可以作为组件的「根」元素渲染。因此，我们可以继续使用上例中相同的 Blade 语法；不过，我们要把目录结构调整如下：

```none
/resources/views/components/accordion/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

<a name="data-properties-attributes"></a>
### 数据属性 / 属性

由于匿名组件没有任何关联的类，你可能想知道该如何区分哪些数据应作为变量传给组件，哪些属性应放入组件的[属性包](#component-attributes)。

你可以在组件 Blade 模板的顶部使用 `@props` 指令，指定哪些属性应当被视为数据变量。组件上的所有其他属性都可以通过组件的属性包获取。如果你希望给某个数据变量设置默认值，可以把变量名作为数组的键，把默认值作为数组的值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

基于上面的组件定义，我们可以这样渲染该组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

<a name="accessing-parent-data"></a>
### 访问父级数据

有时你可能希望在子组件中访问来自父组件的数据。在这种情况下，你可以使用 `@aware` 指令。例如，假设我们正在构建一个由父组件 `<x-menu>` 和子组件 `<x-menu.item>` 组成的复杂菜单组件：

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

由于 `color` 属性只被传入了父组件（`<x-menu>`），它在 `<x-menu.item>` 内部不可用。不过，如果使用 `@aware` 指令，我们就能让它在 `<x-menu.item>` 内部同样可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]
> `@aware` 指令无法访问那些没有通过 HTML 属性显式传给父组件的父级数据。未显式传给父组件的 `@props` 默认值也无法被 `@aware` 指令访问。

<a name="anonymous-component-paths"></a>
### 匿名组件路径

如前所述，匿名组件通常通过把一个 Blade 模板放在 `resources/views/components` 目录中来定义。不过，你偶尔也希望在默认路径之外，向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法的第一个参数接受匿名组件所在位置的「路径」，第二个参数接受一个可选的「命名空间」，组件应当放在该命名空间下。通常，应当从你应用中某个[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

```php
/**
 * 引导应用的所有服务。
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

像上例那样，在注册组件路径时没有指定前缀，那么在 Blade 组件中也可以不带相应前缀地渲染它们。例如，如果上面注册的路径中存在一个 `panel.blade.php` 组件，就可以这样渲染：

```blade
<x-panel />
```

也可以把前缀「命名空间」作为 `anonymousComponentPath` 方法的第二个参数：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

提供前缀后，该「命名空间」内的组件在渲染时就可以在组件名之前加上该前缀：

```blade
<x-dashboard::panel />
```

<a name="building-layouts"></a>
## 构建布局

<a name="layouts-using-components"></a>
### 使用组件的布局

大多数 Web 应用在各个页面中都保持相同的基本布局。如果我们必须在创建的每个视图中都重复整个布局 HTML，维护应用将变得极其繁琐且困难。幸运的是，把这个布局定义为一个 [Blade 组件](#components)，然后在整个应用中复用它非常方便。

<a name="defining-the-layout-component"></a>
#### 定义布局组件

例如，假设我们正在构建一个「todo」列表应用。我们可能会定义一个如下的 `layout` 组件：

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

`layout` 组件定义之后，我们就可以创建一个使用该组件的 Blade 视图。在这个例子中，我们将定义一个显示任务列表的简单视图：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容会被提供给 `layout` 组件内默认的 `$slot` 变量。你可能已经注意到，如果提供了 `$title` 插槽，我们的 `layout` 也会遵循它；否则会显示默认标题。我们可以使用[组件文档](#components)中讨论的标准插槽语法，从任务列表视图中注入自定义标题：

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

现在我们已经定义了布局和任务列表视图，只需要从路由中返回 `task` 视图即可：

```php
use App\Models\Task;

Route::get('/tasks', function () {
    return view('tasks', ['tasks' => Task::all()]);
});
```

<a name="layouts-using-template-inheritance"></a>
### 使用模板继承的布局

<a name="defining-a-layout"></a>
#### 定义布局

布局也可以通过「模板继承」来创建。在[组件](#components)出现之前，这是构建应用的主要方式。

我们先来看一个简单的例子。首先，我们来考察一个页面布局。由于大多数 Web 应用在各个页面中都保持相同的基本布局，把这个布局定义为单个 Blade 视图会非常方便：

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

可以看到，这个文件包含的是典型的 HTML 标记。不过，请留意 `@section` 和 `@yield` 指令。`@section` 指令正如其名所示，用于定义一段内容区块；而 `@yield` 指令则用于显示给定区块的内容。

现在我们已经为应用定义了布局，接下来定义一个继承该布局的子页面。

<a name="extending-a-layout"></a>
#### 继承布局

定义子视图时，使用 `@extends` Blade 指令指定子视图应当「继承」哪个布局。继承 Blade 布局的视图可以使用 `@section` 指令向布局的区块注入内容。请记住，如上例所示，这些区块的内容将通过 `@yield` 显示在布局中：

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

在这个例子中，`sidebar` 区块使用了 `@@parent` 指令，把内容追加（而非覆盖）到布局的侧边栏中。视图渲染时，`@@parent` 指令会被替换为布局中的内容。

> [!NOTE]
> 与上一个例子不同，这个 `sidebar` 区块以 `@endsection` 结尾，而不是 `@show`。`@endsection` 指令仅定义区块，而 `@show` 会定义并**立即输出**该区块。

`@yield` 指令还接受默认值作为其第二个参数。如果被输出的区块未定义，就会渲染该值：

```blade
@yield('content', 'Default content')
```

<a name="forms"></a>
## 表单

<a name="csrf-field"></a>
### CSRF 字段

每当你在应用中定义一个 HTML 表单时，都应当在表单中包含一个隐藏的 CSRF 令牌字段，以便 [CSRF 保护](/docs/{{version}}/csrf)中间件能够校验该请求。你可以使用 `@csrf` Blade 指令生成该令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

<a name="method-field"></a>
### Method 字段

由于 HTML 表单无法发起 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 动词。`@method` Blade 指令可以为你创建该字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

<a name="validation-errors"></a>
### 验证错误

`@error` 指令可用于快速检查某个属性是否存在[验证错误消息](/docs/{{version}}/validation#quick-displaying-the-validation-errors)。在 `@error` 指令内部，你可以输出 `$message` 变量来显示错误消息：

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

由于 `@error` 指令会编译成一个「if」语句，因此你可以使用 `@else` 指令在某属性没有错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror"
/>
```

在包含多个表单的页面中，你可以把[特定错误包的名称](/docs/{{version}}/validation#named-error-bags)作为 `@error` 指令的第二个参数，以获取相应的验证错误消息：

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

Blade 允许你把内容推入具名栈，这些内容可以在另一个视图或布局中的其他位置渲染。这对于声明子视图所需的任何 JavaScript 库尤其有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果你想在给定布尔表达式求值为 `true` 时才 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以按需多次向同一个栈推入内容。要渲染栈的完整内容，把栈名传给 `@stack` 指令：

```blade
<head>
    <!-- 头部内容 -->

    @stack('scripts')
</head>
```

如果你想把内容前置到栈的开头，应使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// 稍后……

@prepend('scripts')
    This will be first...
@endprepend
```

<a name="service-injection"></a>
## 服务注入

`@inject` 指令可用于从 Laravel [服务容器（Service Container）](/docs/{{version}}/container)中获取服务。传给 `@inject` 的第一个参数是服务将被放入的变量名，第二个参数则是你希望解析的服务的类名或接口名：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

<a name="rendering-inline-blade-templates"></a>
## 渲染内联 Blade 模板

有时你可能需要把原始的 Blade 模板字符串转换为合法的 HTML。你可以使用 `Blade` Facade 提供的 `render` 方法来实现。`render` 方法接受 Blade 模板字符串，以及一个可选的数据数组用于提供给模板：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过把内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果你希望 Laravel 在渲染完 Blade 模板后删除这些临时文件，可以向该方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

<a name="rendering-blade-fragments"></a>
## 渲染 Blade 片段

在使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，你偶尔可能只需要在 HTTP 响应中返回 Blade 模板的一部分。Blade 「片段」正好能让你做到这一点。首先，把 Blade 模板的一部分放进 `@fragment` 和 `@endfragment` 指令中：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用该模板的视图时，你可以调用 `fragment` 方法，指定只有指定的片段应当包含在返回的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的某个片段；否则将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图片段。这些片段会被拼接在一起：

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

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它会调用所提供的回调，并把该指令所包含的表达式作为参数传入。

下面的例子创建了一个 `@datetime($var)` 指令，用于格式化给定的 `$var`，该变量应当是 `DateTime` 的实例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册应用的服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导应用的所有服务。
     */
    public function boot(): void
    {
        Blade::directive('datetime', function (string $expression) {
            return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
        });
    }
}
```

可以看到，我们把 `format` 方法链式地应用在传入该指令的表达式上。因此，在这个例子中，该指令最终生成的 PHP 代码如下：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> [!WARNING]
> 更新 Blade 指令的逻辑后，你需要删除所有已缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令移除已缓存的 Blade 视图。

<a name="custom-echo-handlers"></a>
### 自定义 Echo 处理器

如果你尝试使用 Blade「输出」某个对象，该对象的 `__toString` 方法就会被调用。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的「魔术方法」之一。不过，有时你无法控制某个类的 `__toString` 方法，比如当你所交互的类属于某个第三方库时。

在这种情况下，Blade 允许你为该特定类型的对象注册一个自定义 echo 处理器。为此，你应当调用 Blade 的 `stringable` 方法。`stringable` 方法接受一个闭包。该闭包应当对它负责渲染的对象类型进行类型提示。通常，应当在你应用的 `AppServiceProvider` 类的 `boot` 方法中调用 `stringable` 方法：

```php
use Illuminate\Support\Facades\Blade;
use Money\Money;

/**
 * 引导应用的所有服务。
 */
public function boot(): void
{
    Blade::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

自定义 echo 处理器定义之后，你只需在 Blade 模板中输出该对象即可：

```blade
Cost: {{ $money }}
```

<a name="custom-if-statements"></a>
### 自定义 If 语句

在定义简单的自定义条件语句时，编写自定义指令有时显得过于复杂。为此，Blade 提供了 `Blade::if` 方法，允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个自定义条件，用于检查应用配置的默认「disk」。我们可以在 `AppServiceProvider` 的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导应用的所有服务。
 */
public function boot(): void
{
    Blade::if('disk', function (string $value) {
        return config('filesystems.default') === $value;
    });
}
```

自定义条件定义之后，你就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用正在使用本地 disk…… -->
@elsedisk('s3')
    <!-- 应用正在使用 s3 disk…… -->
@else
    <!-- 应用正在使用其他 disk…… -->
@enddisk

@unlessdisk('local')
    <!-- 应用没有在使用本地 disk…… -->
@enddisk
```
