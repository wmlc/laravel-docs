# 数据库：分页

- [简介](#introduction)
- [基本用法](#basic-usage)
    - [对查询构造器结果进行分页](#paginating-query-builder-results)
    - [对 Eloquent 结果进行分页](#paginating-eloquent-results)
    - [游标分页](#cursor-pagination)
    - [手动创建分页器](#manually-creating-a-paginator)
    - [自定义分页 URL](#customizing-pagination-urls)
- [显示分页结果](#displaying-pagination-results)
    - [调整分页链接窗口](#adjusting-the-pagination-link-window)
    - [将结果转换为 JSON](#converting-results-to-json)
- [自定义分页视图](#customizing-the-pagination-view)
    - [使用 Bootstrap](#using-bootstrap)
- [Paginator 与 LengthAwarePaginator 实例方法](#paginator-instance-methods)
- [CursorPaginator 实例方法](#cursor-paginator-instance-methods)

<a name="introduction"></a>
## 简介

在其他框架中，分页可能非常痛苦。我们希望 Laravel 的分页方法能让你耳目一新。Laravel 的分页器与[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 集成在一起，无需任何配置即可方便、易用地对数据库记录进行分页。

默认情况下，分页器生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com)兼容；不过，也支持 Bootstrap 分页。

<a name="tailwind"></a>
#### Tailwind

如果你在 Tailwind 4.x 中使用 Laravel 默认的 Tailwind 分页视图，应用的 `resources/css/app.css` 文件应该已经正确配置为通过 `@source` 引入 Laravel 的分页视图：

```css
@import 'tailwindcss';

@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
```

<a name="basic-usage"></a>
## 基本用法

<a name="paginating-query-builder-results"></a>
### 对查询构造器结果进行分页

有几种方法可以对条目进行分页。最简单的是在[查询构造器](/docs/{{version}}/queries)或 [Eloquent 查询](/docs/{{version}}/eloquent)上使用 `paginate` 方法。`paginate` 方法会自动根据用户当前查看的页面设置查询的"limit"和"offset"。默认情况下，当前页面由 HTTP 请求上的 `page` 查询字符串参数的值检测。该值由 Laravel 自动检测，也会自动插入到分页器生成的链接中。

在此示例中，传递给 `paginate` 方法的唯一参数是你希望每页显示的条目数。这里，我们指定每页显示 `15` 个条目：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show all application users.
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

`paginate` 方法在从数据库检索记录之前会统计查询匹配的记录总数。这样做是为了让分页器知道总共有多少页记录。但是，如果你不打算在应用 UI 中显示总页数，那么记录计数查询就没有必要了。

因此，如果你只需要在应用 UI 中显示简单的"下一页"和"上一页"链接，可以使用 `simplePaginate` 方法执行单个、高效的查询：

```php
$users = DB::table('users')->simplePaginate(15);
```

<a name="paginating-eloquent-results"></a>
### 对 Eloquent 结果进行分页

你也可以对 [Eloquent](/docs/{{version}}/eloquent) 查询进行分页。在此示例中，我们将对 `App\Models\User` 模型进行分页，并表示我们计划每页显示 15 条记录。如你所见，语法几乎与对查询构造器结果分页相同：

```php
use App\Models\User;

$users = User::paginate(15);
```

当然，你也可以在设置其他查询约束（如 `where` 子句）之后调用 `paginate` 方法：

```php
$users = User::where('votes', '>', 100)->paginate(15);
```

在对 Eloquent 模型分页时，你也可以使用 `simplePaginate` 方法：

```php
$users = User::where('votes', '>', 100)->simplePaginate(15);
```

类似地，你可以使用 `cursorPaginate` 方法对 Eloquent 模型进行游标分页：

```php
$users = User::where('votes', '>', 100)->cursorPaginate(15);
```

<a name="multiple-paginator-instances-per-page"></a>
#### 每页多个分页器实例

有时你可能需要在应用渲染的单个屏幕上渲染两个独立的分页器。但是，如果两个分页器实例都使用 `page` 查询字符串参数来存储当前页，这两个分页器就会冲突。要解决此冲突，你可以通过 `paginate`、`simplePaginate` 和 `cursorPaginate` 方法提供的第三个参数，传递你想要用来存储分页器当前页的查询字符串参数名称：

```php
use App\Models\User;

$users = User::where('votes', '>', 100)->paginate(
    $perPage = 15, $columns = ['*'], $pageName = 'users'
);
```

<a name="cursor-pagination"></a>
### 游标分页

虽然 `paginate` 和 `simplePaginate` 使用 SQL "offset" 子句创建查询，但游标分页通过构造"where"子句来比较查询中包含的排序列的值，在 Laravel 所有分页方法中提供最高效的数据库性能。这种分页方法特别适合大型数据集和"无限"滚动的用户界面。

与基于偏移的分页不同（后者在分页器生成的 URL 查询字符串中包含页码），基于游标的分页在查询字符串中放置一个"cursor"字符串。游标是一个编码字符串，包含下一个分页查询应该开始分页的位置以及它应该分页的方向：

```text
http://localhost/users?cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0
```

你可以通过查询构造器提供的 `cursorPaginate` 方法创建基于游标的分页器实例。该方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例：

```php
$users = DB::table('users')->orderBy('id')->cursorPaginate(15);
```

获得游标分页器实例后，你可以像通常使用 `paginate` 和 `simplePaginate` 方法时那样[显示分页结果](#displaying-pagination-results)。有关游标分页器提供的实例方法的更多信息，请查阅[游标分页器实例方法文档](#cursor-paginator-instance-methods)。

> [!WARNING]
> 要利用游标分页，你的查询必须包含"order by"子句。此外，查询排序所依据的列必须属于你正在分页的表。

<a name="cursor-vs-offset-pagination"></a>
#### 游标分页与偏移分页

为了说明偏移分页与游标分页之间的差异，让我们检查一些示例 SQL 查询。以下两个查询都会为按 `id` 排序的 `users` 表显示"第二页"结果：

```sql
# Offset Pagination...
select * from users order by id asc limit 15 offset 15;

# Cursor Pagination...
select * from users where id > 15 order by id asc limit 15;
```

游标分页查询相比偏移分页具有以下优势：

- 对于大型数据集，如果"order by"列已建立索引，游标分页将提供更好的性能。这是因为"offset"子句会扫描所有先前匹配的数据。
- 对于写入频繁的数据集，如果用户当前正在查看的页面中最近添加或删除了结果，偏移分页可能会跳过记录或显示重复记录。

然而，游标分页有以下限制：

- 与 `simplePaginate` 类似，游标分页只能用于显示"下一页"和"上一页"链接，不支持生成带页码的链接。
- 它要求排序基于至少一个唯一列或唯一列的组合。不支持带 `null` 值的列。
- 只有当查询表达式在"order by"子句中设置了别名并同时添加到"select"子句中时，才支持该表达式。
- 不支持带参数的查询表达式。

<a name="manually-creating-a-paginator"></a>
### 手动创建分页器

有时你可能希望手动创建分页实例，向它传递你已经保存在内存中的条目数组。你可以根据需求创建 `Illuminate\Pagination\Paginator`、`Illuminate\Pagination\LengthAwarePaginator` 或 `Illuminate\Pagination\CursorPaginator` 实例来实现。

`Paginator` 和 `CursorPaginator` 类不需要知道结果集中的条目总数；但是，正因为如此，这些类没有用于获取最后一页索引的方法。`LengthAwarePaginator` 接受与 `Paginator` 几乎相同的参数；但它需要知道结果集中的条目总数。

换句话说，`Paginator` 对应于查询构造器上的 `simplePaginate` 方法，`CursorPaginator` 对应于 `cursorPaginate` 方法，而 `LengthAwarePaginator` 对应于 `paginate` 方法。

> [!WARNING]
> 手动创建分页器实例时，你应手动"切片"传递给分页器的结果数组。如果不确定如何操作，请查看 [array_slice](https://secure.php.net/manual/en/function.array-slice.php) PHP 函数。

<a name="customizing-pagination-urls"></a>
### 自定义分页 URL

默认情况下，分页器生成的链接将与当前请求的 URI 匹配。不过，分页器的 `withPath` 方法允许你自定义分页器生成链接时使用的 URI。例如，如果你希望分页器生成类似 `http://example.com/admin/users?page=N` 的链接，应向 `withPath` 方法传递 `/admin/users`：

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

你可以使用 `appends` 方法向分页链接的查询字符串追加内容。例如，要向每个分页链接追加 `sort=votes`，你应该如下调用 `appends`：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->appends(['sort' => 'votes']);

    // ...
});
```

如果你希望将当前请求的所有查询字符串值追加到分页链接，可以使用 `withQueryString` 方法：

```php
$users = User::paginate(15)->withQueryString();
```

<a name="appending-hash-fragments"></a>
#### 追加哈希片段

如果你需要向分页器生成的 URL 追加"哈希片段"，可以使用 `fragment` 方法。例如，要在每个分页链接的末尾追加 `#users`，你应该这样调用 `fragment` 方法：

```php
$users = User::paginate(15)->fragment('users');
```

<a name="displaying-pagination-results"></a>
## 显示分页结果

调用 `paginate` 方法时，你会收到一个 `Illuminate\Pagination\LengthAwarePaginator` 实例；调用 `simplePaginate` 方法时，则返回一个 `Illuminate\Pagination\Paginator` 实例。最后，调用 `cursorPaginate` 方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例。

这些对象提供了几个描述结果集的方法。除了这些辅助方法外，分页器实例是可迭代的，可以像数组一样循环。因此，一旦获取了结果，你就可以使用 [Blade](/docs/{{version}}/blade) 显示结果并渲染页面链接：

```blade
<div class="container">
    @foreach ($users as $user)
        {{ $user->name }}
    @endforeach
</div>

{{ $users->links() }}
```

`links` 方法将渲染指向结果集中其他页面的链接。这些链接中的每一个都已经包含正确的 `page` 查询字符串变量。请记住，`links` 方法生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com)兼容。

<a name="adjusting-the-pagination-link-window"></a>
### 调整分页链接窗口

当分页器显示分页链接时，会显示当前页码以及当前页前后三页的链接。使用 `onEachSide` 方法，你可以控制在分页器生成的中间滑动链接窗口中，当前页每一侧显示的额外链接数量：

```blade
{{ $users->onEachSide(5)->links() }}
```

<a name="converting-results-to-json"></a>
### 将结果转换为 JSON

Laravel 的分页器类实现了 `Illuminate\Contracts\Support\Jsonable` 接口契约并公开了 `toJson` 方法，因此很容易将分页结果转换为 JSON。你也可以通过从路由或控制器动作返回分页器实例来将其转换为 JSON：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::paginate();
});
```

分页器的 JSON 将包含元信息，例如 `total`、`current_page`、`last_page` 等等。结果记录可以通过 JSON 数组中的 `data` 键获得。以下是路由返回分页器实例时创建的 JSON 示例：

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
            // Record...
        },
        {
            // Record...
        }
   ]
}
```

<a name="customizing-the-pagination-view"></a>
## 自定义分页视图

默认情况下，用于显示分页链接的视图与 [Tailwind CSS](https://tailwindcss.com) 框架兼容。但是，如果你不使用 Tailwind，你可以自由定义自己的视图来渲染这些链接。在分页器实例上调用 `links` 方法时，可以将视图名称作为第一个参数传递给该方法：

```blade
{{ $paginator->links('view.name') }}

<!-- Passing additional data to the view... -->
{{ $paginator->links('view.name', ['foo' => 'bar']) }}
```

然而，自定义分页视图最简单的方法是使用 `vendor:publish` 命令将它们导出到你的 `resources/views/vendor` 目录：

```shell
php artisan vendor:publish --tag=laravel-pagination
```

此命令会将视图放在应用的 `resources/views/vendor/pagination` 目录中。此目录中的 `tailwind.blade.php` 文件对应默认的分页视图。你可以编辑此文件来修改分页 HTML。

如果你想指定另一个文件作为默认分页视图，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `defaultView` 和 `defaultSimpleView` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
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

Laravel 包含使用 [Bootstrap CSS](https://getbootstrap.com/) 构建的分页视图。要使用这些视图而不是默认的 Tailwind 视图，你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFour` 或 `useBootstrapFive` 方法：

```php
use Illuminate\Pagination\Paginator;

/**
 * Bootstrap any application services.
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

| 方法                                  | 描述                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `$paginator->count()`                   | 获取当前页的条目数。                                                                |
| `$paginator->currentPage()`             | 获取当前页码。                                                                                 |
| `$paginator->firstItem()`               | 获取结果中第一个条目的结果编号。                                                      |
| `$paginator->getOptions()`              | 获取分页器选项。                                                                                   |
| `$paginator->getUrlRange($start, $end)` | 创建一系列分页 URL。                                                                           |
| `$paginator->hasPages()`                | 判断是否有足够的条目拆分为多个页面。                                            |
| `$paginator->hasMorePages()`            | 判断数据存储中是否还有更多条目。                                                         |
| `$paginator->items()`                   | 获取当前页的条目。                                                                          |
| `$paginator->lastItem()`                | 获取结果中最后一个条目的结果编号。                                                       |
| `$paginator->lastPage()`                | 获取最后一页的页码。（使用 `simplePaginate` 时不可用）。                 |
| `$paginator->nextPageUrl()`             | 获取下一页的 URL。                                                                               |
| `$paginator->onFirstPage()`             | 判断分页器是否在第一页。                                                             |
| `$paginator->onLastPage()`              | 判断分页器是否在最后一页。                                                              |
| `$paginator->perPage()`                 | 每页要显示的条目数。                                                                    |
| `$paginator->previousPageUrl()`         | 获取上一页的 URL。                                                                           |
| `$paginator->total()`                   | 确定数据存储中匹配条目的总数。（使用 `simplePaginate` 时不可用）。 |
| `$paginator->url($page)`                | 获取给定页码的 URL。                                                                         |
| `$paginator->getPageName()`             | 获取用于存储页码的查询字符串变量。                                                        |
| `$paginator->setPageName($name)`        | 设置用于存储页码的查询字符串变量。                                                        |
| `$paginator->through($callback)`        | 使用回调转换每个条目。                                                                        |

<a name="cursor-paginator-instance-methods"></a>
## CursorPaginator 实例方法

每个游标分页器实例都通过以下方法提供额外的分页信息：

| 方法                          | 描述                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `$paginator->count()`           | 获取当前页的条目数。                     |
| `$paginator->cursor()`          | 获取当前游标实例。                                  |
| `$paginator->getOptions()`      | 获取分页器选项。                                        |
| `$paginator->hasPages()`        | 判断是否有足够的条目拆分为多个页面。 |
| `$paginator->hasMorePages()`    | 判断数据存储中是否还有更多条目。              |
| `$paginator->getCursorName()`   | 获取用于存储游标的查询字符串变量。           |
| `$paginator->items()`           | 获取当前页的条目。                               |
| `$paginator->nextCursor()`      | 获取下一组条目的游标实例。                |
| `$paginator->nextPageUrl()`     | 获取下一页的 URL。                                    |
| `$paginator->onFirstPage()`     | 判断分页器是否在第一页。                  |
| `$paginator->onLastPage()`      | 判断分页器是否在最后一页。                   |
| `$paginator->perPage()`         | 每页要显示的条目数。                         |
| `$paginator->previousCursor()`  | 获取上一组条目的游标实例。            |
| `$paginator->previousPageUrl()` | 获取上一页的 URL。                                |
| `$paginator->setCursorName()`   | 设置用于存储游标的查询字符串变量。           |
| `$paginator->url($cursor)`      | 获取给定游标实例的 URL。                          |
