# 数据库：分页

- [简介](#introduction)
- [基本用法](#basic-usage)
    - [为查询构造器结果分页](#paginating-query-builder-results)
    - [为 Eloquent 结果分页](#paginating-eloquent-results)
    - [游标分页](#cursor-pagination)
    - [手动创建分页器](#manually-creating-a-paginator)
    - [自定义分页 URL](#customizing-pagination-urls)
- [显示分页结果](#displaying-pagination-results)
    - [调整分页链接窗口](#adjusting-the-pagination-link-window)
    - [将结果转换为 JSON](#converting-results-to-json)
- [自定义分页视图](#customizing-the-pagination-view)
    - [使用 Bootstrap](#using-bootstrap)
- [Paginator 与 LengthAwarePaginator 实例方法](#paginator-instance-methods)
- [Cursor Paginator 实例方法](#cursor-paginator-instance-methods)

<a name="introduction"></a>
## 简介

在其它框架中，分页可能非常痛苦。我们希望 Laravel 的分页方式能让人眼前一亮。Laravel 的分页器与[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent)深度集成，无需任何配置即可方便、轻易地对数据库记录进行分页。

默认情况下，分页器生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com/)兼容；此外也支持 Bootstrap 分页。

<a name="tailwind-jit"></a>
#### Tailwind JIT

如果你使用 Laravel 默认的 Tailwind 分页视图和 Tailwind JIT 引擎，应确保应用 `tailwind.config.js` 文件的 `content` 键引用了 Laravel 的分页视图，这样它们的 Tailwind 类才不会被告清除：

```js
content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.vue',
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
],
```

<a name="basic-usage"></a>
## 基本用法

<a name="paginating-query-builder-results"></a>
### 为查询构造器结果分页

对条目进行分页有多种方式。最简单的是在[查询构造器](/docs/{{version}}/queries)或 [Eloquent 查询](/docs/{{version}}/eloquent)上使用 `paginate` 方法。`paginate` 方法会根据用户正在查看的当前页自动设置查询的"limit"和"offset"。默认情况下，当前页由 HTTP 请求上 `page` 查询字符串参数的值确定。Laravel 会自动检测该值，并自动把它插入分页器生成的链接中。

在这个例子中，传给 `paginate` 方法的唯一参数是你希望"每页"显示的条目数量。这里我们指定每页显示 `15` 条：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示所有应用用户。
     */
    public function index(): View
    {
        return view('user.index', [
            'users' => DB::table('users')->paginate(15)
        ]);
    }
}
```

<a name="simple-pagination"></a>
#### 简单分页

在从数据库中取出记录之前，`paginate` 方法会先统计查询匹配到的记录总数。这样分页器才能知道一共有多少页记录。不过，如果你不打算在应用 UI 中显示总页数，那么这个统计查询就是多余的。

因此，如果你只需要在应用 UI 中显示简单的"下一页"和"上一页"链接，可以使用 `simplePaginate` 方法执行一次高效查询：

```php
$users = DB::table('users')->simplePaginate(15);
```

<a name="paginating-eloquent-results"></a>
### 为 Eloquent 结果分页

你也可以为 [Eloquent](/docs/{{version}}/eloquent) 查询分页。在这个例子中，我们为 `App\Models\User` 模型分页，并指定每页显示 15 条记录。可以看到，其语法与为查询构造器结果分页几乎完全相同：

```php
use App\Models\User;

$users = User::paginate(15);
```

当然，也可以在对查询设置其他约束（例如 `where` 子句）之后调用 `paginate` 方法：

```php
$users = User::where('votes', '>', 100)->paginate(15);
```

为 Eloquent 模型分页时，也可以使用 `simplePaginate` 方法：

```php
$users = User::where('votes', '>', 100)->simplePaginate(15);
```

同样，可以使用 `cursorPaginate` 方法为 Eloquent 模型做游标分页：

```php
$users = User::where('votes', '>', 100)->cursorPaginate(15);
```

<a name="multiple-paginator-instances-per-page"></a>
#### 每页多个分页器实例

有时你可能需要在应用渲染的同一个页面上渲染两个独立的分页器。不过，如果两个分页器实例都用 `page` 查询字符串参数来存储当前页，它们就会冲突。要解决这个冲突，可以通过传给 `paginate`、`simplePaginate` 和 `cursorPaginate` 方法的第三个参数，指定用于存储分页器当前页的查询字符串参数名：

```php
use App\Models\User;

$users = User::where('votes', '>', 100)->paginate(
    $perPage = 15, $columns = ['*'], $pageName = 'users'
);
```

<a name="cursor-pagination"></a>
### 游标分页

`paginate` 和 `simplePaginate` 使用 SQL 的"offset"子句创建查询，而游标分页则通过构造"where"子句来比较查询中排序列的值，从而在 Laravel 的所有分页方法中提供最高的数据库性能。这种分页方式特别适合大数据集和"无限"滚动的用户界面。

与基于偏移量的分页不同，后者在分页器生成的 URL 查询字符串中包含页码；而基于游标的分页则是在查询字符串中放置一个"游标"字符串。该游标是一个编码后的字符串，包含下一次分页查询应从何处开始分页以及分页的方向：

```nothing
http://localhost/users?cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0
```

你可以通过查询构造器提供的 `cursorPaginate` 方法创建基于游标的分页器实例。该方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例：

```php
$users = DB::table('users')->orderBy('id')->cursorPaginate(15);
```

获取游标分页器实例后，你可以像使用 `paginate` 和 `simplePaginate` 方法时通常那样[显示分页结果](#displaying-pagination-results)。有关游标分页器提供的实例方法，请参阅[游标分页器实例方法文档](#cursor-paginator-instance-methods)。

> [!WARNING]
> 你的查询必须包含"order by"子句才能利用游标分页。此外，查询排序所依据的列必须属于你正在分页的表。

<a name="cursor-vs-offset-pagination"></a>
#### 游标分页与偏移分页对比

为说明偏移分页与游标分页之间的差异，我们来看几个示例 SQL 查询。下面两个查询都会显示按 `id` 排序的 `users` 表结果的"第二页"：

```sql
# 偏移分页……
select * from users order by id asc limit 15 offset 15;

# 游标分页……
select * from users where id > 15 order by id asc limit 15;
```

与偏移分页相比，游标分页查询有以下优势：

- 对大数据集而言，如果"order by"的列已建立索引，游标分页的性能会更好。这是因为"offset"子句需要扫描此前匹配到的所有数据。
- 对于频繁写入的数据集，如果结果最近被添加到用户正在查看的页面或从中删除，偏移分页可能会跳过记录或显示重复记录。

不过，游标分页有以下限制：

- 与 `simplePaginate` 一样，游标分页只能用于显示"上一页"和"下一页"链接，不支持生成带页码的链接。
- 它要求排序基于至少一个唯一列，或一组组合起来唯一的列。不支持值为 `null` 的列。
- "order by"子句中的查询表达式只有在同时设置了别名并被加入"select"子句时才受支持。
- 不支持带参数的查询表达式。

<a name="manually-creating-a-paginator"></a>
### 手动创建分页器

有时你可能希望手动创建分页实例，并把你已经放在内存中的条目数组传进去。你可以根据自己的需要，创建 `Illuminate\Pagination\Paginator`、`Illuminate\Pagination\LengthAwarePaginator` 或 `Illuminate\Pagination\CursorPaginator` 实例。

`Paginator` 和 `CursorPaginator` 类不需要知道结果集中的条目总数；但正因如此，这两个类没有获取最后一页索引的方法。`LengthAwarePaginator` 接受的参数与 `Paginator` 几乎完全相同；不过它需要提供结果集中条目总数的统计值。

换句话说，`Paginator` 对应查询构造器上的 `simplePaginate` 方法，`CursorPaginator` 对应 `cursorPaginate` 方法，`LengthAwarePaginator` 对应 `paginate` 方法。

> [!WARNING]
> 手动创建分页器实例时，你应当手动"切片"传给分页器的结果数组。如果不确定如何操作，可以查看 PHP 的 [array_slice](https://secure.php.net/manual/en/function.array-slice.php) 函数。

<a name="customizing-pagination-urls"></a>
### 自定义分页 URL

默认情况下，分页器生成的链接会与当前请求的 URI 保持一致。不过，分页器的 `withPath` 方法允许你自定义分页器生成链接时使用的 URI。例如，如果你希望分页器生成类似 `http://example.com/admin/users?page=N` 的链接，应把 `/admin/users` 传给 `withPath` 方法：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->withPath('/admin/users');

    // ...
});
```

<a name="appending-query-string-values"></a>
#### 追加查询字符串值

你可以使用 `appends` 方法向分页链接追加查询字符串。例如，要给每个分页链接追加 `sort=votes`，应调用如下 `appends`：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->appends(['sort' => 'votes']);

    // ...
});
```

如果你希望把当前请求的所有查询字符串值追加到分页链接上，可以使用 `withQueryString` 方法：

```php
$users = User::paginate(15)->withQueryString();
```

<a name="appending-hash-fragments"></a>
#### 追加哈希片段

如果你需要向分页器生成的 URL 追加"哈希片段"，可以使用 `fragment` 方法。例如，要给每个分页链接末尾追加 `#users`，应这样调用 `fragment` 方法：

```php
$users = User::paginate(15)->fragment('users');
```

<a name="displaying-pagination-results"></a>
## 显示分页结果

调用 `paginate` 方法会返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，调用 `simplePaginate` 方法会返回一个 `Illuminate\Pagination\Paginator` 实例，而调用 `cursorPaginate` 方法会返回一个 `Illuminate\Pagination\CursorPaginator` 实例。

这些对象提供了若干描述结果集的方法。除了这些辅助方法之外，分页器实例本身也是迭代器，可以像数组一样循环。因此，一旦获取到结果，就可以使用 [Blade](/docs/{{version}}/blade)显示结果并渲染页面链接：

```blade
<div class="container">
    @foreach ($users as $user)
        {{ $user->name }}
    @endforeach
</div>

{{ $users->links() }}
```

`links` 方法会渲染指向结果集中其余页面的链接。这些链接都已经包含正确的 `page` 查询字符串变量。请记住，`links` 方法生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com)兼容。

<a name="adjusting-the-pagination-link-window"></a>
### 调整分页链接窗口

分页器显示分页链接时，除了当前页码，还会显示当前页前后各三页的链接。通过 `onEachSide` 方法，你可以控制分页器生成的中间滑动窗口里，在当前页两侧各显示多少个额外链接：

```blade
{{ $users->onEachSide(5)->links() }}
```

<a name="converting-results-to-json"></a>
### 将结果转换为 JSON

Laravel 的分页器类实现了 `Illuminate\Contracts\Support\Jsonable` 接口契约并提供了 `toJson` 方法，因此把分页结果转换为 JSON 非常容易。你也可以从路由或控制器动作中直接返回分页器实例，把它转换为 JSON：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::paginate();
});
```

分页器生成的 JSON 包含 `total`、`current_page`、`last_page` 等元信息。结果记录可以通过 JSON 数组中的 `data` 键获取。下面是从路由中返回分页器实例所生成的 JSON 示例：

```json
{
   "total": 50,
   "per_page": 15,
   "current_page": 1,
   "last_page": 4,
   "first_page_url": "http://laravel.app?page=1",
   "last_page_url": "http://laravel.app?page=4",
   "next_page_url": "http://laravel.app?page=2",
   "prev_page_url": null,
   "path": "http://laravel.app",
   "from": 1,
   "to": 15,
   "data":[
        {
            // 记录……
        },
        {
            // 记录……
        }
   ]
}
```

<a name="customizing-the-pagination-view"></a>
## 自定义分页视图

默认情况下，用于显示分页链接的视图与 [Tailwind CSS](https://tailwindcss.com) 框架兼容。不过，如果你不使用 Tailwind，也可以自由定义自己的视图来渲染这些链接。在分页器实例上调用 `links` 方法时，可以把视图名称作为该方法的第一个参数传入：

```blade
{{ $paginator->links('view.name') }}

<!-- 向视图传递额外数据…… -->
{{ $paginator->links('view.name', ['foo' => 'bar']) }}
```

不过，自定义分页视图最简单的方式，是使用 `vendor:publish` 命令把它们导出到 `resources/views/vendor` 目录：

```shell
php artisan vendor:publish --tag=laravel-pagination
```

该命令会把视图放到应用的 `resources/views/vendor/pagination` 目录中。该目录下的 `tailwind.blade.php` 文件对应默认的分页视图。你可以编辑该文件来修改分页 HTML。

如果你想把另一个文件指定为默认分页视图，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `defaultView` 和 `defaultSimpleView` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Paginator::defaultView('view-name');

        Paginator::defaultSimpleView('view-name');
    }
}
```

<a name="using-bootstrap"></a>
### 使用 Bootstrap

Laravel 内置了使用 [Bootstrap CSS](https://getbootstrap.com/)构建的分页视图。要使用这些视图代替默认的 Tailwind 视图，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFour` 或 `useBootstrapFive` 方法：

```php
use Illuminate\Pagination\Paginator;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Paginator::useBootstrapFive();
    Paginator::useBootstrapFour();
}
```

<a name="paginator-instance-methods"></a>
## Paginator / LengthAwarePaginator 实例方法

每个分页器实例都通过以下方法提供额外的分页信息：

<div class="overflow-auto">

| 方法 | 说明 |
| --- | --- |
| `$paginator->count()` | 获取当前页的条目数。 |
| `$paginator->currentPage()` | 获取当前页码。 |
| `$paginator->firstItem()` | 获取结果中第一条记录的序号。 |
| `$paginator->getOptions()` | 获取分页器选项。 |
| `$paginator->getUrlRange($start, $end)` | 创建一段分页 URL。 |
| `$paginator->hasPages()` | 判断条目是否足以分成多页。 |
| `$paginator->hasMorePages()` | 判断数据存储中是否还有更多条目。 |
| `$paginator->items()` | 获取当前页的条目。 |
| `$paginator->lastItem()` | 获取结果中最后一条记录的序号。 |
| `$paginator->lastPage()` | 获取最后一页的页码。（使用 `simplePaginate` 时不可用。） |
| `$paginator->nextPageUrl()` | 获取下一页的 URL。 |
| `$paginator->onFirstPage()` | 判断分页器是否在第一页。 |
| `$paginator->perPage()` | 每页显示的条目数量。 |
| `$paginator->previousPageUrl()` | 获取上一页的 URL。 |
| `$paginator->total()` | 获取数据存储中匹配条目的总数。（使用 `simplePaginate` 时不可用。） |
| `$paginator->url($page)` | 获取指定页码的 URL。 |
| `$paginator->getPageName()` | 获取用于存储页码的查询字符串变量。 |
| `$paginator->setPageName($name)` | 设置用于存储页码的查询字符串变量。 |
| `$paginator->through($callback)` | 使用回调转换每个条目。 |

</div>

<a name="cursor-paginator-instance-methods"></a>
## Cursor Paginator 实例方法

每个游标分页器实例都通过以下方法提供额外的分页信息：

<div class="overflow-auto">

| 方法 | 说明 |
| --- | --- |
| `$paginator->count()` | 获取当前页的条目数。 |
| `$paginator->cursor()` | 获取当前游标实例。 |
| `$paginator->getOptions()` | 获取分页器选项。 |
| `$paginator->hasPages()` | 判断条目是否足以分成多页。 |
| `$paginator->hasMorePages()` | 判断数据存储中是否还有更多条目。 |
| `$paginator->getCursorName()` | 获取用于存储游标的查询字符串变量。 |
| `$paginator->items()` | 获取当前页的条目。 |
| `$paginator->nextCursor()` | 获取下一组条目对应的游标实例。 |
| `$paginator->nextPageUrl()` | 获取下一页的 URL。 |
| `$paginator->onFirstPage()` | 判断分页器是否在第一页。 |
| `$paginator->onLastPage()` | 判断分页器是否在最后一页。 |
| `$paginator->perPage()` | 每页显示的条目数量。 |
| `$paginator->previousCursor()` | 获取上一组条目对应的游标实例。 |
| `$paginator->previousPageUrl()` | 获取上一页的 URL。 |
| `$paginator->setCursorName()` | 设置用于存储游标的查询字符串变量。 |
| `$paginator->url($cursor)` | 获取指定游标实例的 URL。 |

</div>
