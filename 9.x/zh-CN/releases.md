# 发布说明

- [版本号方案](#versioning-scheme)
- [支持策略](#support-policy)
- [Laravel 9](#laravel-9)

<a name="versioning-scheme"></a>
## 版本号方案

Laravel 及其第一方包遵循[语义化版本](https://semver.org)。框架的主版本每年发布一次（约 2 月份），而次版本和补丁版本可能每周发布一次。次版本和补丁版本**绝不**包含破坏性变更。

在应用或包中引用 Laravel 框架或其组件时，应始终使用版本约束（如 `^9.0`），因为 Laravel 的主版本确实包含破坏性变更。不过，我们始终努力确保你能在一天甚至更短时间内升级到新的主版本。

<a name="named-arguments"></a>
#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)不在 Laravel 的向后兼容指南覆盖范围内。为了改进 Laravel 代码库，我们可能会在必要时重命名函数参数。因此，调用 Laravel 方法时使用命名参数应谨慎，并理解参数名未来可能会变化。

<a name="support-policy"></a>
## 支持策略

对于所有 Laravel 版本，错误修复提供 18 个月，安全修复提供 2 年。对于所有附加库（包括 Lumen），只有最新的主版本会收到错误修复。此外，请查阅 [Laravel 支持的数据库版本](/docs/{{version}}/database#introduction)。

| Version | PHP (*) | Release | Bug Fixes Until | Security Fixes Until |
| --- | --- | --- | --- | --- |
| 6 (LTS) | 7.2 - 8.0 | September 3rd, 2019 | January 25th, 2022 | September 6th, 2022 |
| 7 | 7.2 - 8.0 | March 3rd, 2020 | October 6th, 2020 | March 3rd, 2021 |
| 8 | 7.3 - 8.1 | September 8th, 2020 | July 26th, 2022 | January 24th, 2023 |
| 9 | 8.0 - 8.2 | February 8th, 2022 | August 8th, 2023 | February 6th, 2024 |
| 10 | 8.1 - 8.3 | February 14th, 2023 | August 6th, 2024 | February 4th, 2025 |

<div class="version-colors">
    <div class="end-of-life">
        <div class="color-box"></div>
        <div>生命周期结束</div>
    </div>
    <div class="security-fixes">
        <div class="color-box"></div>
        <div>仅安全修复</div>
    </div>
</div>

(*) 受支持的 PHP 版本

<a name="laravel-9"></a>
## Laravel 9

众所周知，Laravel 从 Laravel 8 开始转为每年发布一次。此前，主版本每 6 个月发布一次。这一转变旨在减轻社区的维护负担，并激励开发团队在不引入破坏性变更的前提下推出强大且出色的新功能。因此，我们在不破坏向后兼容的情况下为 Laravel 8 发布了诸多健壮的功能，例如并行测试支持、改进的 Breeze 脚手架、HTTP 客户端改进，甚至新的 Eloquent 关联类型（如 "has one of many"）。

因此，在当前版本中持续发布出色新功能的承诺，可能导致未来的"主"版本主要用于"维护"任务（如升级上游依赖），这一点可以在本发布说明中看到。

Laravel 9 延续了 Laravel 8.x 的改进，引入了对 Symfony 6.0 组件、Symfony Mailer、Flysystem 3.0 的支持，改进了 `route:list` 输出，新增了 Laravel Scout 数据库驱动、新的 Eloquent 访问器/修改器语法、通过 Enum 实现的隐式路由绑定，以及诸多其他错误修复和易用性改进。

<a name="php-8"></a>
### PHP 8.0

Laravel 9.x 要求最低 PHP 版本为 8.0。

<a name="symfony-mailer"></a>
### Symfony Mailer

_Symfony Mailer 支持由 [Dries Vints](https://github.com/driesvints)、[James Brooks](https://github.com/jbrooksuk) 和 [Julius Kiekbusch](https://github.com/Jubeki) 贡献_。

此前的 Laravel 版本使用 [Swift Mailer](https://swiftmailer.symfony.com/docs/introduction.html) 库发送外发邮件。然而，该库已不再维护，由 Symfony Mailer 取而代之。

请查阅[升级指南](/docs/{{version}}/upgrade#symfony-mailer)，了解如何确保应用与 Symfony Mailer 兼容。

<a name="flysystem-3"></a>
### Flysystem 3.x

_Flysystem 3.x 支持由 [Dries Vints](https://github.com/driesvints) 贡献_。

Laravel 9.x 将上游 Flysystem 依赖升级到 Flysystem 3.x。Flysystem 驱动了 `Storage` Facade 提供的所有文件系统交互。

请查阅[升级指南](/docs/{{version}}/upgrade#flysystem-3)，了解如何确保应用与 Flysystem 3.x 兼容。

<a name="eloquent-accessors-and-mutators"></a>
### 改进的 Eloquent 访问器/修改器

_改进的 Eloquent 访问器/修改器由 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

Laravel 9.x 提供了一种定义 Eloquent [访问器和修改器](/docs/{{version}}/eloquent-mutators#accessors-and-mutators)的新方式。在之前的 Laravel 版本中，定义访问器和修改器的唯一方式是在模型上定义带前缀的方法，如下所示：

```php
public function getNameAttribute($value)
{
    return strtoupper($value);
}

public function setNameAttribute($value)
{
    $this->attributes['name'] = $value;
}
```

不过，在 Laravel 9.x 中，你可以通过单个不带前缀的方法来定义访问器和修改器，只需将返回类型声明为 `Illuminate\Database\Eloquent\Casts\Attribute`：

```php
use Illuminate\Database\Eloquent\Casts\Attribute;

public function name(): Attribute
{
    return new Attribute(
        get: fn ($value) => strtoupper($value),
        set: fn ($value) => $value,
    );
}
```

此外，这种定义访问器的新方式会缓存属性返回的对象值，就像[自定义类型转换类](/docs/{{version}}/eloquent-mutators#custom-casts)一样：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

public function address(): Attribute
{
    return new Attribute(
        get: fn ($value, $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
        set: fn (Address $value) => [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ],
    );
}
```

<a name="enum-casting"></a>
### Enum Eloquent 属性类型转换

> **Warning**
> Enum 类型转换仅适用于 PHP 8.1+。

_Enum 类型转换由 [Mohamed Said](https://github.com/themsaid) 贡献_。

Eloquent 现在允许你将属性值转换为 PHP ["回退" Enum](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，你可以在模型的 `$casts` 属性数组中指定要转换的属性和 enum：

    use App\Enums\ServerStatus;

    /**
     * 应该进行类型转换的属性。
     *
     * @var array
     */
    protected $casts = [
        'status' => ServerStatus::class,
    ];

在模型上定义类型转换后，当你与该属性交互时，指定的属性会自动转换为 enum 或从 enum 转换回来：

    if ($server->status == ServerStatus::Provisioned) {
        $server->status = ServerStatus::Ready;

        $server->save();
    }

<a name="implicit-route-bindings-with-enums"></a>
### 通过 Enum 实现的隐式路由绑定

_隐式 Enum 绑定由 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

PHP 8.1 引入了对 [Enum](https://www.php.net/manual/en/language.enumerations.backed.php) 的支持。Laravel 9.x 引入了在路由定义中对 Enum 进行类型提示的能力，Laravel 只会在该路由段是 URI 中有效的 Enum 值时调用路由。否则，将自动返回 HTTP 404 响应。例如，给定以下 Enum：

```php
enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

你可以定义一个仅在 `{category}` 路由段为 `fruits` 或 `people` 时才会被调用的路由。否则，将返回 HTTP 404 响应：

```php
Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

<a name="forced-scoping-of-route-bindings"></a>
### 路由绑定的强制作用域

_强制作用域绑定由 [Claudio Dekker](https://github.com/claudiodekker) 贡献_。

在之前的 Laravel 版本中，你可能希望对路由定义中的第二个 Eloquent 模型进行作用域限制，使其必须是前一个 Eloquent 模型的子级。例如，考虑以下根据 slug 为特定用户获取博客文章的路由定义：

    use App\Models\Post;
    use App\Models\User;

    Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
        return $post;
    });

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动对查询进行作用域限制，通过父级检索嵌套模型，并使用约定来猜测父级上的关联名称。然而，此前 Laravel 仅在子路由绑定使用自定义键时才支持此行为。

不过，在 Laravel 9.x 中，即使未提供自定义键，你也可以指示 Laravel 对"子"绑定进行作用域限制。为此，你可以在定义路由时调用 `scopeBindings` 方法：

    use App\Models\Post;
    use App\Models\User;

    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    })->scopeBindings();

或者，你可以指示整组路由定义使用作用域绑定：

    Route::scopeBindings()->group(function () {
        Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
            return $post;
        });
    });

<a name="controller-route-groups"></a>
### 控制器路由组

_路由组改进由 [Luke Downing](https://github.com/lukeraymonddowning) 贡献_。

现在，你可以使用 `controller` 方法为组内所有路由定义公共控制器。然后，在定义路由时，只需提供它们调用的控制器方法：

    use App\Http\Controllers\OrderController;

    Route::controller(OrderController::class)->group(function () {
        Route::get('/orders/{id}', 'show');
        Route::post('/orders', 'store');
    });

<a name="full-text"></a>
### 全文索引/Where 子句

_全文索引和 "where" 子句由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Dries Vints](https://github.com/driesvints) 贡献_。

使用 MySQL 或 PostgreSQL 时，现在可以将 `fullText` 方法添加到列定义中以生成全文索引：

    $table->text('bio')->fullText();

此外，可以使用 `whereFullText` 和 `orWhereFullText` 方法为具有[全文索引](/docs/{{version}}/migrations#available-index-types)的列的查询添加全文 "where" 子句。Laravel 会将这些方法转换为底层数据库系统对应的 SQL。例如，对于使用 MySQL 的应用，将生成 `MATCH AGAINST` 子句：

    $users = DB::table('users')
               ->whereFullText('bio', 'web developer')
               ->get();

<a name="laravel-scout-database-engine"></a>
### Laravel Scout 数据库引擎

_Laravel Scout 数据库引擎由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Dries Vints](https://github.com/driesvints) 贡献_。

如果你的应用与中小型数据库交互或工作负载较轻，现在可以使用 Scout 的 "database" 引擎，而无需使用 Algolia 或 MeiliSearch 等专用搜索服务。数据库引擎在从现有数据库过滤结果时，会使用 "where like" 子句和全文索引来确定查询适用的搜索结果。

要了解有关 Scout 数据库引擎的更多信息，请查阅 [Scout 文档](/docs/{{version}}/scout)。

<a name="rendering-inline-blade-templates"></a>
### 渲染内联 Blade 模板

_内联 Blade 模板渲染由 [Jason Beggs](https://github.com/jasonlbeggs) 贡献。内联 Blade 组件渲染由 [Toby Zerner](https://github.com/tobyzerner) 贡献_。

有时你可能需要将原始 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` Facade 提供的 `render` 方法完成此操作。`render` 方法接受 Blade 模板字符串和要提供给模板的可选数据数组：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

类似地，可以使用 `renderComponent` 方法渲染给定的类组件，只需将组件实例传递给该方法：

```php
use App\View\Components\HelloComponent;

return Blade::renderComponent(new HelloComponent('Julian Bashir'));
```

<a name="slot-name-shortcut"></a>
### 插槽名称简写

_插槽名称简写由 [Caleb Porzio](https://github.com/calebporzio) 贡献_。

在之前的 Laravel 版本中，插槽名称通过 `x-slot` 标签上的 `name` 属性提供：

```blade
<x-alert>
    <x-slot name="title">
        Server Error
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

不过，从 Laravel 9.x 开始，你可以使用更便捷、更简短的语法指定插槽名称：

```xml
<x-slot:title>
    Server Error
</x-slot>
```

<a name="checked-selected-blade-directives"></a>
### Checked / Selected Blade 指令

_Checked 和 selected Blade 指令由 [Ash Allen](https://github.com/ash-jc-allen) 和 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

为方便起见，现在可以使用 `@checked` 指令轻松指示给定的 HTML 复选框输入是否 "checked"。如果提供的条件求值为 `true`，该指令将输出 `checked`：

```blade
<input type="checkbox"
        name="active"
        value="active"
        @checked(old('active', $user->active)) />
```

同样，可以使用 `@selected` 指令指示给定的 select 选项是否应该 "selected"：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

<a name="bootstrap-5-pagination-views"></a>
### Bootstrap 5 分页视图

_Bootstrap 5 分页视图由 [Jared Lewis](https://github.com/jrd-lewis) 贡献_。

Laravel 现在包含使用 [Bootstrap 5](https://getbootstrap.com/) 构建的分页视图。要使用这些视图而非默认的 Tailwind 视图，你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFive` 方法：

    use Illuminate\Pagination\Paginator;

    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Paginator::useBootstrapFive();
    }

<a name="improved-validation-of-nested-array-data"></a>
### 改进的嵌套数组数据验证

_改进的嵌套数组输入验证由 [Steve Bauman](https://github.com/stevebauman) 贡献_。

有时在为属性分配验证规则时，你可能需要访问给定嵌套数组元素的值。现在可以使用 `Rule::forEach` 方法完成此操作。`forEach` 方法接受一个闭包，该闭包会在被验证的数组属性的每次迭代时被调用，并接收属性的值以及显式、完全展开的属性名。闭包应返回一个规则数组，用于分配给该数组元素：

    use App\Rules\HasPermission;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    $validator = Validator::make($request->all(), [
        'companies.*.id' => Rule::forEach(function ($value, $attribute) {
            return [
                Rule::exists(Company::class, 'id'),
                new HasPermission('manage-company', $value),
            ];
        }),
    ]);

<a name="laravel-breeze-api"></a>
### Laravel Breeze API & Next.js

_Laravel Breeze API 脚手架和 Next.js 起步套件由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Miguel Piedrafita](https://twitter.com/m1guelpf) 贡献_。

[Laravel Breeze](/docs/{{version}}/starter-kits#breeze-and-next) 脚手架新增了 "API" 脚手架模式和配套的 [Next.js](https://nextjs.org) [前端实现](https://github.com/laravel/breeze-next)。此脚手架可用于快速启动作为后端、为 JavaScript 前端提供 Laravel Sanctum 认证 API 的 Laravel 应用。

<a name="exception-page"></a>
### 改进的 Ignition 异常页面

_Ignition 由 [Spatie](https://spatie.be/) 开发_。

Ignition 是由 Spatie 创建的开源异常调试页面，已从头重新设计。改进后的新 Ignition 随 Laravel 9.x 一起发布，包含浅色/深色主题、可自定义的"在编辑器中打开"功能等。

<p align="center">
<img width="100%" src="https://user-images.githubusercontent.com/483853/149235404-f7caba56-ebdf-499e-9883-cac5d5610369.png"/>
</p>

<a name="improved-route-list"></a>
### 改进的 `route:list` CLI 输出

_改进的 `route:list` CLI 输出由 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

`route:list` CLI 输出在 Laravel 9.x 版本中得到了显著改进，为探索路由定义提供了出色的新体验。

<p align="center">
<img src="https://user-images.githubusercontent.com/5457236/148321982-38c8b869-f188-4f42-a3cc-a03451d5216c.png"/>
</p>

<a name="test-coverage-support-on-artisan-test-Command"></a>
### 使用 Artisan `test` 命令的测试覆盖率

_使用 Artisan `test` 命令时的测试覆盖率由 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

Artisan `test` 命令新增了 `--coverage` 选项，你可以使用它来查看测试为应用提供的代码覆盖率：

```shell
php artisan test --coverage
```

测试覆盖率结果将直接显示在 CLI 输出中。

<p align="center">
<img width="100%" src="https://user-images.githubusercontent.com/5457236/150133237-440290c2-3538-4d8e-8eac-4fdd5ec7bd9e.png"/>
</p>

此外，如果你想指定测试覆盖率百分比必须达到的最低阈值，可以使用 `--min` 选项。如果未达到给定的最低阈值，测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```

<p align="center">
<img width="100%" src="https://user-images.githubusercontent.com/5457236/149989853-a29a7629-2bfa-4bf3-bbf7-cdba339ec157.png"/>
</p>

<a name="soketi-echo-server"></a>
### Soketi Echo 服务器

_Soketi Echo 服务器由 [Alex Renoki](https://github.com/rennokki) 开发_。

虽然 Soketi 并非 Laravel 9.x 专属，但 Laravel 最近协助编写了 Soketi 的文档。Soketi 是一个为 Node.js 编写的、与 [Laravel Echo](/docs/{{version}}/broadcasting) 兼容的 Web Socket 服务器。对于偏好自行管理 Web Socket 服务器的应用，Soketi 提供了 Pusher 和 Ably 的出色开源替代方案。

有关使用 Soketi 的更多信息，请查阅[广播文档](/docs/{{version}}/broadcasting)和 [Soketi 文档](https://docs.soketi.app/)。

<a name="improved-collections-ide-support"></a>
### 改进的集合 IDE 支持

_改进的集合 IDE 支持由 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

Laravel 9.x 为集合组件添加了改进的"泛型"风格类型定义，提升了 IDE 和静态分析支持。诸如 [PHPStorm](https://blog.jetbrains.com/phpstorm/2021/12/phpstorm-2021-3-release/#support_for_future_laravel_collections) 等 IDE 或 [PHPStan](https://phpstan.org) 等静态分析工具现在能更好地原生理解 Laravel 集合。

<p align="center">
<img width="100%" src="https://user-images.githubusercontent.com/5457236/151783350-ed301660-1e09-44c1-b549-85c6db3f078d.gif"/>
</p>

<a name="new-helpers"></a>
### 新增辅助函数

Laravel 9.x 引入了两个新的便捷辅助函数，你可以在自己的应用中使用。

<a name="new-helpers-str"></a>
#### `str`

`str` 函数为给定字符串返回一个新的 `Illuminate\Support\Stringable` 实例。此函数等价于 `Str::of` 方法：

    $string = str('Taylor')->append(' Otwell');

    // 'Taylor Otwell'

如果未向 `str` 函数提供参数，该函数返回 `Illuminate\Support\Str` 的实例：

    $snake = str()->snake('LaravelFramework');

    // 'laravel_framework'

<a name="new-helpers-to-route"></a>
#### `to_route`

`to_route` 函数为给定的命名路由生成重定向 HTTP 响应，提供了一种从路由和控制器重定向到命名路由的富有表现力的方式：

    return to_route('users.show', ['user' => 1]);

如有必要，你可以将应分配给重定向的 HTTP 状态码和任何额外的响应头作为 to_route 方法的第三和第四个参数传递：

    return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);
