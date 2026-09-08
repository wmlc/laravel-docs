# 数据库：分页

- [简介](#introduction)
- [基础用法](#basic-usage)
    - [对查询构造器结果进行分页](#paginating-query-builder-results)
    - [对 Eloquent 结果进行分页](#paginating-eloquent-results)
    - [游标分页](#cursor-pagination)
    - [手动创建分页器](#manually-creating-a-paginator)
    - [自定义分页 URL](#customizing-pagination-urls)
- [展示分页结果](#displaying-pagination-results)
    - [调整分页链接窗口](#adjusting-the-pagination-link-window)
    - [将结果转换为 JSON](#converting-results-to-json)
- [自定义分页视图](#customizing-the-pagination-view)
    - [使用 Bootstrap](#using-bootstrap)
- [Paginator 与 LengthAwarePaginator 实例方法](#paginator-instance-methods)
- [游标分页器实例方法](#cursor-paginator-instance-methods)

<a name="introduction"></a>
## 简介

在其他框架中，分页可能非常令人头疼。我们希望 Laravel 的分页方式能让你耳目一新。Laravel 的分页器与[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 集成，无需任何配置即可提供便捷、易用的数据库记录分页。

默认情况下，分页器生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com/)兼容；不过，Laravel 也支持 Bootstrap 分页。

<a name="tailwind"></a>
#### Tailwind

如果你在 Tailwind 4.x 中使用 Laravel 默认的 Tailwind 分页视图，应用的 `resources/css/app.css` 文件已经正确配置为 `@source` Laravel 的分页视图：

```css
@import 'tailwindcss';

@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
```

<a name="basic-usage"></a>
## 基础用法

<a name="paginating-query-builder-results"></a>
### 对查询构造器结果进行分页

有多种方式可以对数据项进行分页。最简单的方式是在[查询构造器](/docs/{{version}}/queries)或 [Eloquent 查询](/docs/{{version}}/eloquent)上使用 `paginate` 方法。`paginate` 方法会根据用户当前查看的页面，自动设置查询的「limit」和「offset」。默认情况下，当前页面由 HTTP 请求的 `page` 查询字符串参数的值检测得出。Laravel 会自动检测该值，并自动将其插入分页器生成的链接中。

在本例中，传递给 `paginate` 方法的唯一参数是你希望「每页」显示的数据项数量。这里，我们指定每页显示 `15` 项：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示所有应用用户。
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

`paginate` 方法在从数据库获取记录之前，会先统计查询匹配的记录总数。这样分页器才能知道总共有多少页记录。但是，如果你不打算在应用的 UI 中展示总页数，那么这条统计记录数的查询就是多余的。

因此，如果你只需要在应用的 UI 中展示简单的「下一页」和「上一页」链接，可以使用 `simplePaginate` 方法来执行一次高效查询：

```php
$users = DB::table('users')->simplePaginate(15);
```

<a name="paginating-eloquent-results"></a>
### 对 Eloquent 结果进行分页

你也可以对 [Eloquent](/docs/{{version}}/eloquent) 查询进行分页。在本例中，我们将对 `App\Models\User` 模型进行分页，并指定每页显示 15 条记录。可以看到，其语法与对查询构造器结果进行分页几乎完全相同：

```php
use App\Models\User;

$users = User::paginate(15);
```

当然，你可以在设置查询的其他约束条件（如 `where` 子句）之后再调用 `paginate` 方法：

```php
$users = User::where('votes', '>', 100)->paginate(15);
```

对 Eloquent 模型分页时，你也可以使用 `simplePaginate` 方法：

```php
$users = User::where('votes', '>', 100)->simplePaginate(15);
```

类似地，你可以使用 `cursorPaginate` 方法对 Eloquent 模型进行游标分页：

```php
$users = User::where('votes', '>', 100)->cursorPaginate(15);
```

<a name="multiple-paginator-instances-per-page"></a>
#### 每页多个分页器实例

有时你可能需要在应用渲染的同一个页面上渲染两个独立的分页器。但是，如果两个分页器实例都使用 `page` 查询字符串参数来存储当前页码，这两个分页器就会产生冲突。要解决这个冲突，你可以向 `paginate`、`simplePaginate` 和 `cursorPaginate` 方法的第三个参数传递你想用来存储分页器当前页码的查询字符串参数名：

```php
use App\Models\User;

$users = User::where('votes', '>', 100)->paginate(
    $perPage = 15, $columns = ['*'], $pageName = 'users'
);
```

<a name="cursor-pagination"></a>
### 游标分页

`paginate` 和 `simplePaginate` 使用 SQL 的「offset」子句来构建查询，而游标分页则通过构建比较查询中排序列值的「where」子句来工作，在 Laravel 的所有分页方法中提供最高的数据库性能。这种分页方式特别适合大数据集和「无限」滚动的用户界面。

基于偏移量的分页会在分页器生成的 URL 查询字符串中包含页码，而游标分页则是在查询字符串中放置一个「游标（cursor）」字符串。游标是一个编码后的字符串，包含下一条分页查询应从何处开始分页以及分页方向：

```text
http://localhost/users?cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0
```

你可以通过查询构造器提供的 `cursorPaginate` 方法创建基于游标的分页器实例。该方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例：

```php
$users = DB::table('users')->orderBy('id')->cursorPaginate(15);
```

获取游标分页器实例后，你就可以像使用 `paginate` 和 `simplePaginate` 方法时一样[展示分页结果](#displaying-pagination-results)。有关游标分页器提供的实例方法的更多信息，请查阅[游标分页器实例方法文档](#cursor-paginator-instance-methods)。

> [!WARNING]
> 要使用游标分页，你的查询必须包含「order by」子句。此外，查询用于排序的列必须属于你要分页的表。

<a name="cursor-vs-offset-pagination"></a>
#### 游标分页与偏移分页的对比

为了说明偏移分页与游标分页的区别，我们来看几个示例 SQL 查询。以下两个查询都会展示按 `id` 排序的 `users` 表的「第二页」结果：

```sql
# 偏移分页...
select * from users order by id asc limit 15 offset 15;

# 游标分页...
select * from users where id > 15 order by id asc limit 15;
```

与偏移分页相比，游标分页查询具有以下优势：

- 对于大数据集，如果「order by」的列已建立索引，游标分页能提供更好的性能。这是因为「offset」子句会扫描之前所有已匹配的数据。
- 对于频繁写入的数据集，如果用户当前查看的页面最近有结果被添加或删除，偏移分页可能会跳过记录或显示重复记录。

不过，游标分页也有以下限制：

- 与 `simplePaginate` 一样，游标分页只能用于展示「下一页」和「上一页」链接，不支持生成带页码的链接。
- 它要求排序至少基于一个唯一列，或由多个列组成的唯一组合。不支持含 `null` 值的列。
- 「order by」子句中的查询表达式只有在设置了别名并同时添加到「select」子句中时才受支持。
- 不支持带参数的查询表达式。

<a name="manually-creating-a-paginator"></a>
### 手动创建分页器

有时你可能希望手动创建一个分页实例，把内存中已有的数据项数组传给它。你可以根据需要，创建 `Illuminate\Pagination\Paginator`、`Illuminate\Pagination\LengthAwarePaginator` 或 `Illuminate\Pagination\CursorPaginator` 实例。

`Paginator` 和 `CursorPaginator` 类不需要知道结果集中的数据项总数；不过正因如此，这些类没有获取最后一页页码的方法。`LengthAwarePaginator` 接受的参数与 `Paginator` 几乎相同；但它需要结果集中数据项的总数。

换句话说，`Paginator` 对应查询构造器的 `simplePaginate` 方法，`CursorPaginator` 对应 `cursorPaginate` 方法，而 `LengthAwarePaginator` 对应 `paginate` 方法。

> [!WARNING]
> 手动创建分页器实例时，你应该手动「切分」传递给分页器的结果数组。如果不确定如何操作，可以查看 PHP 的 [array_slice](https://secure.php.net/manual/en/function.array-slice.php) 函数。

<a name="customizing-pagination-urls"></a>
### 自定义分页 URL

默认情况下，分页器生成的链接会与当前请求的 URI 匹配。不过，你可以使用分页器的 `withPath` 方法自定义分页器生成链接时使用的 URI。例如，如果你希望分页器生成类似 `http://example.com/admin/users?page=N` 的链接，应该将 `/admin/users` 传递给 `withPath` 方法：

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

你可以使用 `appends` 方法向分页链接追加查询字符串。例如，要向每个分页链接追加 `sort=votes`，你应该这样调用 `appends`：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->appends(['sort' => 'votes']);

    // ...
});
```

如果希望把当前请求的所有查询字符串值追加到分页链接中，可以使用 `withQueryString` 方法：

```php
$users = User::paginate(15)->withQueryString();
```

<a name="appending-hash-fragments"></a>
#### 追加哈希片段（Hash Fragment）

如果需要向分页器生成的 URL 追加「哈希片段」，可以使用 `fragment` 方法。例如，要向每个分页链接的末尾追加 `#users`，应该像这样调用 `fragment` 方法：

```php
$users = User::paginate(15)->fragment('users');
```

<a name="displaying-pagination-results"></a>
## 展示分页结果

调用 `paginate` 方法时，你会得到一个 `Illuminate\Pagination\LengthAwarePaginator` 实例；调用 `simplePaginate` 方法返回一个 `Illuminate\Pagination\Paginator` 实例；最后，调用 `cursorPaginate` 方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例。

这些对象提供了多个描述结果集的方法。除了这些辅助方法之外，分页器实例本身也是迭代器，可以像数组一样遍历。因此，获取结果后，你可以使用 [Blade](/docs/{{version}}/blade) 展示结果并渲染页面链接：

```blade
<div class="container">
    @foreach ($users as $user)
        {{ $user->name }}
    @endforeach
</div>

{{ $users->links() }}
```

`links` 方法会渲染指向结果集其余页面的链接。这些链接中的每一个都已经包含正确的 `page` 查询字符串变量。请记住，`links` 方法生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com)兼容。

<a name="adjusting-the-pagination-link-window"></a>
### 调整分页链接窗口

分页器展示分页链接时，会显示当前页码，以及当前页前后各三页的链接。使用 `onEachSide` 方法，你可以控制分页器生成的中间滑动链接窗口中，当前页每一侧额外显示多少个链接：

```blade
{{ $users->onEachSide(5)->links() }}
```

<a name="converting-results-to-json"></a>
### 将结果转换为 JSON

Laravel 的分页器类实现了 `Illuminate\Contracts\Support\Jsonable` 接口契约，并提供了 `toJson` 方法，因此将分页结果转换为 JSON 非常容易。你也可以通过从路由或控制器动作返回分页器实例，将其转换为 JSON：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::paginate();
});
```

分页器的 JSON 会包含 `total`、`current_page`、`last_page` 等元信息。结果记录可通过 JSON 数组中的 `data` 键获取。下面是从路由返回分页器实例所生成的 JSON 示例：

```json
{
   "total": 50,
   "per_page": 15,
   "current_page": 1,
   "last_page": 4,
   "current_page_url": "http://laravel.app?page=1",
   "first_page_url": "http://laravel.app?page=1",
   "last_page_url": "http://laravel.app?page=4",
   "next_page_url": "http://laravel.app?page=2",
   "prev_page_url": null,
   "path": "http://laravel.app",
   "from": 1,
   "to": 15,
   "data":[
        {
            // 记录...
        },
        {
            // 记录...
        }
   ]
}
```

<a name="customizing-the-pagination-view"></a>
## 自定义分页视图

默认情况下，渲染分页链接的视图与 [Tailwind CSS](https://tailwindcss.com) 框架兼容。不过，如果你没有使用 Tailwind，可以自由定义自己的视图来渲染这些链接。在分页器实例上调用 `links` 方法时，可以将视图名称作为该方法的第一个参数传递：

```blade
{{ $paginator->links('view.name') }}

<!-- 向视图传递额外数据... -->
{{ $paginator->links('view.name', ['foo' => 'bar']) }}
```

不过，自定义分页视图最简单的方式，是使用 `vendor:publish` 命令将它们导出到你的 `resources/views/vendor` 目录：

```shell
php artisan vendor:publish --tag=laravel-pagination
```

该命令会将视图放置在应用的 `resources/views/vendor/pagination` 目录中。该目录中的 `tailwind.blade.php` 文件对应默认的分页视图。你可以编辑这个文件来修改分页 HTML。

如果你想指定另一个文件作为默认分页视图，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `defaultView` 和 `defaultSimpleView` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
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

Laravel 内置了使用 [Bootstrap CSS](https://getbootstrap.com/) 构建的分页视图。要使用这些视图代替默认的 Tailwind 视图，你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFour` 或 `useBootstrapFive` 方法：

```php
use Illuminate\Pagination\Paginator;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Paginator::useBootstrapFive();
    Paginator::useBootstrapFour();
}
```

<a name="paginator-instance-methods"></a>
## Paginator 与 LengthAwarePaginator 实例方法

每个分页器实例都通过以下方法提供额外的分页信息：

| 方法                                    | 说明                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `$paginator->count()`                   | 获取当前页的数据项数量。                                                                                      |
| `$paginator->currentPage()`             | 获取当前页码。                                                                                               |
| `$paginator->firstItem()`               | 获取结果集中第一项的结果序号。                                                                                |
| `$paginator->getOptions()`              | 获取分页器选项。                                                                                              |
| `$paginator->getUrlRange($start, $end)` | 创建一系列分页 URL。                                                                                          |
| `$paginator->hasPages()`                | 判断数据项是否足够拆分为多页。                                                                                 |
| `$paginator->hasMorePages()`            | 判断数据存储中是否还有更多数据项。                                                                             |
| `$paginator->items()`                   | 获取当前页的数据项。                                                                                          |
| `$paginator->lastItem()`                | 获取结果集中最后一项的结果序号。                                                                               |
| `$paginator->lastPage()`                | 获取最后一页的页码。（使用 `simplePaginate` 时不可用）。                                                      |
| `$paginator->nextPageUrl()`             | 获取下一页的 URL。                                                                                            |
| `$paginator->onFirstPage()`             | 判断分页器是否在第一页。                                                                                       |
| `$paginator->onLastPage()`              | 判断分页器是否在最后一页。                                                                                     |
| `$paginator->perPage()`                 | 每页显示的数据项数量。                                                                                        |
| `$paginator->previousPageUrl()`         | 获取上一页的 URL。                                                                                            |
| `$paginator->total()`                   | 判断数据存储中匹配的数据项总数。（使用 `simplePaginate` 时不可用）。                                           |
| `$paginator->url($page)`                | 获取给定页码的 URL。                                                                                          |
| `$paginator->getPageName()`             | 获取用于存储页码的查询字符串变量。                                                                             |
| `$paginator->setPageName($name)`        | 设置用于存储页码的查询字符串变量。                                                                             |
| `$paginator->through($callback)`        | 使用回调转换每个数据项。                                                                                       |

<a name="cursor-paginator-instance-methods"></a>
## 游标分页器实例方法

每个游标分页器实例都通过以下方法提供额外的分页信息：

| 方法                            | 说明                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| `$paginator->count()`           | 获取当前页的数据项数量。                                            |
| `$paginator->cursor()`          | 获取当前游标实例。                                                  |
| `$paginator->getOptions()`      | 获取分页器选项。                                                    |
| `$paginator->hasPages()`        | 判断数据项是否足够拆分为多页。                                       |
| `$paginator->hasMorePages()`    | 判断数据存储中是否还有更多数据项。                                   |
| `$paginator->getCursorName()`   | 获取用于存储游标的查询字符串变量。                                   |
| `$paginator->items()`           | 获取当前页的数据项。                                                |
| `$paginator->nextCursor()`      | 获取下一组数据项的游标实例。                                        |
| `$paginator->nextPageUrl()`     | 获取下一页的 URL。                                                  |
| `$paginator->onFirstPage()`     | 判断分页器是否在第一页。                                             |
| `$paginator->onLastPage()`      | 判断分页器是否在最后一页。                                           |
| `$paginator->perPage()`         | 每页显示的数据项数量。                                               |
| `$paginator->previousCursor()`  | 获取上一组数据项的游标实例。                                        |
| `$paginator->previousPageUrl()` | 获取上一页的 URL。                                                  |
| `$paginator->setCursorName()`   | 设置用于存储游标的查询字符串变量。                                   |
| `$paginator->url($cursor)`      | 获取给定游标实例的 URL。                                             |
