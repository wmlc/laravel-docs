# 数据库：查询构造器

- [简介](#introduction)
- [运行数据库查询](#running-database-queries)
    - [分块结果](#chunking-results)
    - [惰性流式处理结果](#streaming-results-lazily)
    - [聚合](#aggregates)
- [Select 语句](#select-statements)
- [原生表达式](#raw-expressions)
- [连接](#joins)
- [联合](#unions)
- [基础 Where 子句](#basic-where-clauses)
    - [Where 子句](#where-clauses)
    - [Or Where 子句](#or-where-clauses)
    - [Where Not 子句](#where-not-clauses)
    - [Where Any / All / None 子句](#where-any-all-none-clauses)
    - [JSON Where 子句](#json-where-clauses)
    - [其他 Where 子句](#additional-where-clauses)
    - [逻辑分组](#logical-grouping)
- [高级 Where 子句](#advanced-where-clauses)
    - [Where Exists 子句](#where-exists-clauses)
    - [子查询 Where 子句](#subquery-where-clauses)
    - [全文 Where 子句](#full-text-where-clauses)
    - [向量相似度子句](#vector-similarity-clauses)
- [排序、分组、Limit 与 Offset](#ordering-grouping-limit-and-offset)
    - [排序](#ordering)
    - [分组](#grouping)
    - [Limit 与 Offset](#limit-and-offset)
- [条件子句](#conditional-clauses)
- [Insert 语句](#insert-statements)
    - [Upsert](#upserts)
- [Update 语句](#update-statements)
    - [更新 JSON 列](#updating-json-columns)
    - [递增与递减](#increment-and-decrement)
- [Delete 语句](#delete-statements)
- [悲观锁](#pessimistic-locking)
- [可复用的查询组件](#reusable-query-components)
- [调试](#debugging)

<a name="introduction"></a>
## 简介

Laravel 的数据库查询构造器提供了便捷、流畅的接口，用于创建和运行数据库查询。它可以用于执行应用中的大多数数据库操作，并与 Laravel 支持的所有数据库系统完美配合。

Laravel 查询构造器使用 PDO 参数绑定来保护你的应用免受 SQL 注入攻击。无需清理或净化作为查询绑定传递给查询构造器的字符串。

> [!WARNING]
> PDO 不支持绑定列名。因此，你绝不应允许用户输入决定查询引用的列名，包括 "order by" 列。

<a name="running-database-queries"></a>
## 运行数据库查询

<a name="retrieving-all-rows-from-a-table"></a>
#### 从表中检索所有行

你可以使用 `DB` Facade 提供的 `table` 方法开始查询。`table` 方法为给定表返回一个流畅的查询构造器实例，允许你向查询链式添加更多约束，然后最终使用 `get` 方法检索查询结果：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show a list of all of the application's users.
     */
    public function index(): View
    {
        $users = DB::table('users')->get();

        return view('user.index', ['users' => $users]);
    }
}
```

`get` 方法返回一个 `Illuminate\Support\Collection` 实例，其中包含查询结果，每个结果都是 PHP `stdClass` 对象的实例。你可以通过将列作为对象的属性访问来获取每个列的值：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->get();

foreach ($users as $user) {
    echo $user->name;
}
```

> [!NOTE]
> Laravel 集合为映射和缩减数据提供了各种非常强大的方法。有关 Laravel 集合的更多信息，请查看[集合文档](/docs/{{version}}/collections)。

<a name="retrieving-a-single-row-column-from-a-table"></a>
#### 从表中检索单行 / 单列

如果你只需要从数据库表中检索单行，可以使用 `DB` Facade 的 `first` 方法。此方法将返回单个 `stdClass` 对象：

```php
$user = DB::table('users')->where('name', 'John')->first();

return $user->email;
```

如果你想从数据库表中检索单行，但在未找到匹配行时抛出 `Illuminate\Database\RecordNotFoundException`，可以使用 `firstOrFail` 方法。如果 `RecordNotFoundException` 未被捕获，将自动向客户端发送 404 HTTP 响应：

```php
$user = DB::table('users')->where('name', 'John')->firstOrFail();
```

如果你不需要整行，可以使用 `value` 方法从记录中提取单个值。此方法将直接返回列的值：

```php
$email = DB::table('users')->where('name', 'John')->value('email');
```

要根据 `id` 列值检索单行，请使用 `find` 方法：

```php
$user = DB::table('users')->find(3);
```

<a name="retrieving-a-list-of-column-values"></a>
#### 检索列值列表

如果你想检索包含单列值的 `Illuminate\Support\Collection` 实例，可以使用 `pluck` 方法。在此示例中，我们将检索用户标题的集合：

```php
use Illuminate\Support\Facades\DB;

$titles = DB::table('users')->pluck('title');

foreach ($titles as $title) {
    echo $title;
}
```

你可以通过向 `pluck` 方法提供第二个参数，指定结果集合应使用的键列：

```php
$titles = DB::table('users')->pluck('title', 'name');

foreach ($titles as $name => $title) {
    echo $title;
}
```

<a name="chunking-results"></a>
### 分块结果

如果你需要处理数千条数据库记录，请考虑使用 `DB` Facade 提供的 `chunk` 方法。此方法一次检索一小块结果，并将每个块提供给闭包进行处理。例如，让我们每次以 100 条记录为一组检索整个 `users` 表：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    foreach ($users as $user) {
        // ...
    }
});
```

你可以通过从闭包返回 `false` 来停止处理更多块：

```php
DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    // Process the records...

    return false;
});
```

如果你在分块结果时更新数据库记录，分块结果可能会以意外方式变化。如果你计划在分块时更新检索的记录，最好使用 `chunkById` 方法。此方法将根据记录的主键自动对结果分页：

```php
DB::table('users')->where('active', false)
    ->chunkById(100, function (Collection $users) {
        foreach ($users as $user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update(['active' => true]);
        }
    });
```

由于 `chunkById` 和 `lazyById` 方法会向执行的查询添加自己的 "where" 条件，你通常应在闭包中[逻辑分组](#logical-grouping)自己的条件：

```php
DB::table('users')->where(function ($query) {
    $query->where('credits', 1)->orWhere('credits', 2);
})->chunkById(100, function (Collection $users) {
    foreach ($users as $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['credits' => 3]);
    }
});
```

> [!WARNING]
> 在分块回调内更新或删除记录时，对主键或外键的任何更改都可能影响分块查询。这可能导致记录不被包含在分块结果中。

<a name="streaming-results-lazily"></a>
### 惰性流式处理结果

`lazy` 方法的工作方式与[分块方法](#chunking-results)类似，它分块执行查询。但是，`lazy()` 方法不是将每个块传递给回调，而是返回一个 [LazyCollection](/docs/{{version}}/collections#lazy-collections)，让你可以将结果作为单个流交互：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function (object $user) {
    // ...
});
```

同样，如果你计划在迭代时更新检索的记录，最好使用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法将根据记录的主键自动对结果分页：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function (object $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> [!WARNING]
> 在迭代时更新或删除记录时，对主键或外键的任何更改都可能影响分块查询。这可能导致记录不被包含在结果中。

<a name="aggregates"></a>
### 聚合

查询构造器还提供了多种检索 `count`、`max`、`min`、`avg` 和 `sum` 等聚合值的方法。你可以在构造查询后调用其中任何方法：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->count();

$price = DB::table('orders')->max('price');
```

当然，你可以将这些方法与其他子句组合，以微调聚合值的计算方式：

```php
$price = DB::table('orders')
    ->where('finalized', 1)
    ->avg('price');
```

<a name="determining-if-records-exist"></a>
#### 判断记录是否存在

与其使用 `count` 方法判断是否存在匹配查询约束的记录，不如使用 `exists` 和 `doesntExist` 方法：

```php
if (DB::table('orders')->where('finalized', 1)->exists()) {
    // ...
}

if (DB::table('orders')->where('finalized', 1)->doesntExist()) {
    // ...
}
```

<a name="select-statements"></a>
## Select 语句

<a name="specifying-a-select-clause"></a>
#### 指定 Select 子句

你可能并不总是想从数据库表中选择所有列。使用 `select` 方法，你可以为查询指定自定义的 "select" 子句：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->select('name', 'email as user_email')
    ->get();
```

`distinct` 方法允许你强制查询返回不同的结果：

```php
$users = DB::table('users')->distinct()->get();
```

如果你已有查询构造器实例，并希望向其现有 select 子句添加列，可以使用 `addSelect` 方法：

```php
$query = DB::table('users')->select('name');

$users = $query->addSelect('age')->get();
```

<a name="raw-expressions"></a>
## 原生表达式

有时你可能需要在查询中插入任意字符串。要创建原生字符串表达式，可以使用 `DB` Facade 提供的 `raw` 方法：

```php
$users = DB::table('users')
    ->select(DB::raw('count(*) as user_count, status'))
    ->where('status', '<>', 1)
    ->groupBy('status')
    ->get();
```

> [!WARNING]
> 原生语句将作为字符串注入到查询中，因此你应极其小心地避免产生 SQL 注入漏洞。

<a name="raw-methods"></a>
### 原生方法

除了使用 `DB::raw` 方法之外，你还可以使用以下方法将原生表达式插入查询的不同部分。**请记住，Laravel 无法保证使用原生表达式的任何查询都能免受 SQL 注入漏洞的影响。**

<a name="selectraw"></a>
#### `selectRaw`

`selectRaw` 方法可用来代替 `addSelect(DB::raw(/* ... */))`。此方法接受一个可选的绑定数组作为其第二个参数：

```php
$orders = DB::table('orders')
    ->selectRaw('price * ? as price_with_tax', [1.0825])
    ->get();
```

<a name="whereraw-orwhereraw"></a>
#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可用于将原生 "where" 子句注入到查询中。这些方法接受一个可选的绑定数组作为其第二个参数：

```php
$orders = DB::table('orders')
    ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
    ->get();
```

<a name="havingraw-orhavingraw"></a>
#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可用于提供原生字符串作为 "having" 子句的值。这些方法接受一个可选的绑定数组作为其第二个参数：

```php
$orders = DB::table('orders')
    ->select('department', DB::raw('SUM(price) as total_sales'))
    ->groupBy('department')
    ->havingRaw('SUM(price) > ?', [2500])
    ->get();
```

<a name="orderbyraw"></a>
#### `orderByRaw`

`orderByRaw` 方法可用于提供原生字符串作为 "order by" 子句的值：

```php
$orders = DB::table('orders')
    ->orderByRaw('updated_at - created_at DESC')
    ->get();
```

<a name="groupbyraw"></a>
#### `groupByRaw`

`groupByRaw` 方法可用于提供原生字符串作为 `group by` 子句的值：

```php
$orders = DB::table('orders')
    ->select('city', 'state')
    ->groupByRaw('city, state')
    ->get();
```

<a name="joins"></a>
## 连接

<a name="inner-join-clause"></a>
#### 内连接子句

查询构造器也可以用于向查询添加连接子句。要执行基本的 "inner join"，可以在查询构造器实例上使用 `join` 方法。传递给 `join` 方法的第一个参数是你要连接的表名，其余参数指定连接的列约束。你甚至可以在单个查询中连接多个表：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->join('contacts', 'users.id', '=', 'contacts.user_id')
    ->join('orders', 'users.id', '=', 'orders.user_id')
    ->select('users.*', 'contacts.phone', 'orders.price')
    ->get();
```

<a name="left-join-right-join-clause"></a>
#### 左连接 / 右连接子句

如果你想执行 "left join" 或 "right join" 而不是 "inner join"，请使用 `leftJoin` 或 `rightJoin` 方法。这些方法与 `join` 方法具有相同的签名：

```php
$users = DB::table('users')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();

$users = DB::table('users')
    ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();
```

<a name="cross-join-clause"></a>
#### 交叉连接子句

你可以使用 `crossJoin` 方法执行 "cross join"。交叉连接在第一个表和连接的表之间生成笛卡尔积：

```php
$sizes = DB::table('sizes')
    ->crossJoin('colors')
    ->get();
```

<a name="advanced-join-clauses"></a>
#### 高级连接子句

你也可以指定更高级的连接子句。要开始，请将闭包作为第二个参数传递给 `join` 方法。该闭包将接收一个 `Illuminate\Database\Query\JoinClause` 实例，它允许你指定 "join" 子句上的约束：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
    })
    ->get();
```

如果你想在连接上使用 "where" 子句，可以使用 `JoinClause` 实例提供的 `where` 和 `orWhere` 方法。这些方法不是比较两列，而是将列与值进行比较：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')
            ->where('contacts.user_id', '>', 5);
    })
    ->get();
```

<a name="subquery-joins"></a>
#### 子查询连接

你可以使用 `joinSub`、`leftJoinSub` 和 `rightJoinSub` 方法将查询连接到子查询。这些方法中的每一个都接收三个参数：子查询、其表别名，以及定义相关列的闭包。在此示例中，我们将检索一组用户，其中每个用户记录还包含用户最近发布的博客文章的 `created_at` 时间戳：

```php
$latestPosts = DB::table('posts')
    ->select('user_id', DB::raw('MAX(created_at) as last_post_created_at'))
    ->where('is_published', true)
    ->groupBy('user_id');

$users = DB::table('users')
    ->joinSub($latestPosts, 'latest_posts', function (JoinClause $join) {
        $join->on('users.id', '=', 'latest_posts.user_id');
    })->get();
```

<a name="lateral-joins"></a>
#### 横向连接

> [!WARNING]
> 横向连接目前受 PostgreSQL、MySQL >= 8.0.14 和 SQL Server 支持。

你可以使用 `joinLateral` 和 `leftJoinLateral` 方法执行带子查询的 "lateral join"。这些方法中的每一个都接收两个参数：子查询及其表别名。连接条件应在给定子查询的 `where` 子句中指定。横向连接会针对每一行求值，并且可以引用子查询外部的列。

在此示例中，我们将检索一组用户以及用户的三篇最新博客文章。每个用户最多可以在结果集中产生三行：分别对应其最新的一篇博客文章。连接条件在子查询内用 `whereColumn` 子句指定，引用当前用户行：

```php
$latestPosts = DB::table('posts')
    ->select('id as post_id', 'title as post_title', 'created_at as post_created_at')
    ->whereColumn('user_id', 'users.id')
    ->orderBy('created_at', 'desc')
    ->limit(3);

$users = DB::table('users')
    ->joinLateral($latestPosts, 'latest_posts')
    ->get();
```

<a name="unions"></a>
## 联合

查询构造器还提供了一种便捷的方法来将两个或多个查询"联合"在一起。例如，你可以创建一个初始查询，并使用 `union` 方法将其与更多查询联合：

```php
use Illuminate\Support\Facades\DB;

$usersWithoutFirstName = DB::table('users')
    ->whereNull('first_name');

$users = DB::table('users')
    ->whereNull('last_name')
    ->union($usersWithoutFirstName)
    ->get();
```

除了 `union` 方法之外，查询构造器还提供 `unionAll` 方法。使用 `unionAll` 方法组合的查询不会移除重复结果。`unionAll` 方法与 `union` 方法具有相同的方法签名。

<a name="basic-where-clauses"></a>
## 基础 Where 子句

<a name="where-clauses"></a>
### Where 子句

你可以使用查询构造器的 `where` 方法向查询添加 "where" 子句。对 `where` 方法最基本的调用需要三个参数。第一个参数是列名。第二个参数是一个运算符，可以是数据库支持的任何运算符。第三个参数是要与列值进行比较的值。

例如，以下查询检索 `votes` 列值等于 `100` 且 `age` 列值大于 `35` 的用户：

```php
$users = DB::table('users')
    ->where('votes', '=', 100)
    ->where('age', '>', 35)
    ->get();
```

为方便起见，如果你想验证某列 `=` 给定值，可以将该值作为第二个参数传递给 `where` 方法。Laravel 将假定你希望使用 `=` 运算符：

```php
$users = DB::table('users')->where('votes', 100)->get();
```

你也可以向 `where` 方法提供关联数组，以快速跨多列查询：

```php
$users = DB::table('users')->where([
    'first_name' => 'Jane',
    'last_name' => 'Doe',
])->get();
```

如前所述，你可以使用数据库系统支持的任何运算符：

```php
$users = DB::table('users')
    ->where('votes', '>=', 100)
    ->get();

$users = DB::table('users')
    ->where('votes', '<>', 100)
    ->get();

$users = DB::table('users')
    ->where('name', 'like', 'T%')
    ->get();
```

你也可以向 `where` 函数传递一个条件数组。数组的每个元素都应是一个包含通常传递给 `where` 方法的三个参数的数组：

```php
$users = DB::table('users')->where([
    ['status', '=', '1'],
    ['subscribed', '<>', '1'],
])->get();
```

> [!WARNING]
> PDO 不支持绑定列名。因此，你绝不应允许用户输入决定查询引用的列名，包括 "order by" 列。

> [!WARNING]
> MySQL 和 MariaDB 会在字符串-数字比较中自动将字符串类型转换为整数。在此过程中，非数字字符串会被转换为 `0`，这可能导致意外结果。例如，如果你的表中有一个值为 `aaa` 的 `secret` 列，并且你运行 `User::where('secret', 0)`，该行将被返回。为避免此问题，请确保在查询中使用之前将所有值类型转换为其适当的类型。

<a name="or-where-clauses"></a>
### Or Where 子句

将查询构造器 `where` 方法的调用链式连接时，"where" 子句将使用 `and` 运算符连接。但是，你可以使用 `orWhere` 方法使用 `or` 运算符将子句连接到查询中。`orWhere` 方法接受与 `where` 方法相同的参数：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhere('name', 'John')
    ->get();
```

如果你需要在括号内分组 "or" 条件，可以将闭包作为第一个参数传递给 `orWhere` 方法：

```php
use Illuminate\Database\Query\Builder;

$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhere(function (Builder $query) {
        $query->where('name', 'Abigail')
            ->where('votes', '>', 50);
        })
    ->get();
```

上面的示例将生成以下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> [!WARNING]
> 你应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="where-not-clauses"></a>
### Where Not 子句

`whereNot` 和 `orWhereNot` 方法可用于否定给定的查询约束组。例如，以下查询排除正在清仓销售或价格低于十的产品：

```php
$products = DB::table('products')
    ->whereNot(function (Builder $query) {
        $query->where('clearance', true)
            ->orWhere('price', '<', 10);
        })
    ->get();
```

<a name="where-any-all-none-clauses"></a>
### Where Any / All / None 子句

有时你可能需要将相同的查询约束应用于多个列。例如，你可能希望检索给定列表中任何列 `LIKE` 给定值的所有记录。你可以使用 `whereAny` 方法实现这一点：

```php
$users = DB::table('users')
    ->where('active', true)
    ->whereAny([
        'name',
        'email',
        'phone',
    ], 'like', 'Example%')
    ->get();
```

上面的查询将产生以下 SQL：

```sql
SELECT *
FROM users
WHERE active = true AND (
    name LIKE 'Example%' OR
    email LIKE 'Example%' OR
    phone LIKE 'Example%'
)
```

类似地，`whereAll` 方法可用于检索所有给定列都匹配给定约束的记录：

```php
$posts = DB::table('posts')
    ->where('published', true)
    ->whereAll([
        'title',
        'content',
    ], 'like', '%Laravel%')
    ->get();
```

上面的查询将产生以下 SQL：

```sql
SELECT *
FROM posts
WHERE published = true AND (
    title LIKE '%Laravel%' AND
    content LIKE '%Laravel%'
)
```

`whereNone` 方法可用于检索没有任何给定列匹配给定约束的记录：

```php
$albums = DB::table('albums')
    ->where('published', true)
    ->whereNone([
        'title',
        'lyrics',
        'tags',
    ], 'like', '%explicit%')
    ->get();
```

上面的查询将产生以下 SQL：

```sql
SELECT *
FROM albums
WHERE published = true AND NOT (
    title LIKE '%explicit%' OR
    lyrics LIKE '%explicit%' OR
    tags LIKE '%explicit%'
)
```

<a name="json-where-clauses"></a>
### JSON Where 子句

Laravel 还支持在支持 JSON 列类型的数据库上查询 JSON 列类型。目前，这包括 MariaDB 10.3+、MySQL 8.0+、PostgreSQL 12.0+、SQL Server 2017+ 和 SQLite 3.39.0+。要查询 JSON 列，请使用 `->` 运算符：

```php
$users = DB::table('users')
    ->where('preferences->dining->meal', 'salad')
    ->get();

$users = DB::table('users')
    ->whereIn('preferences->dining->meal', ['pasta', 'salad', 'sandwiches'])
    ->get();
```

你可以使用 `whereJsonContains` 和 `whereJsonDoesntContain` 方法查询 JSON 数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', 'en')
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', 'en')
    ->get();
```

如果你的应用使用 MariaDB、MySQL 或 PostgreSQL 数据库，你可以向 `whereJsonContains` 和 `whereJsonDoesntContain` 方法传递一个值数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', ['en', 'de'])
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', ['en', 'de'])
    ->get();
```

此外，你可以使用 `whereJsonContainsKey` 或 `whereJsonDoesntContainKey` 方法检索包含或不包含 JSON 键的结果：

```php
$users = DB::table('users')
    ->whereJsonContainsKey('preferences->dietary_requirements')
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContainKey('preferences->dietary_requirements')
    ->get();
```

最后，你可以使用 `whereJsonLength` 方法按长度查询 JSON 数组：

```php
$users = DB::table('users')
    ->whereJsonLength('options->languages', 0)
    ->get();

$users = DB::table('users')
    ->whereJsonLength('options->languages', '>', 1)
    ->get();
```

<a name="additional-where-clauses"></a>
### 其他 Where 子句

**whereLike / orWhereLike / whereNotLike / orWhereNotLike**

`whereLike` 方法允许你向查询添加 "LIKE" 子句以进行模式匹配。这些方法提供了一种与数据库无关的字符串匹配查询方式，并能够切换大小写敏感性。默认情况下，字符串匹配不区分大小写：

```php
$users = DB::table('users')
    ->whereLike('name', '%John%')
    ->get();
```

你可以通过 `caseSensitive` 参数启用区分大小写的搜索：

```php
$users = DB::table('users')
    ->whereLike('name', '%John%', caseSensitive: true)
    ->get();
```

`orWhereLike` 方法允许你添加带 LIKE 条件的 "or" 子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereLike('name', '%John%')
    ->get();
```

`whereNotLike` 方法允许你向查询添加 "NOT LIKE" 子句：

```php
$users = DB::table('users')
    ->whereNotLike('name', '%John%')
    ->get();
```

类似地，你可以使用 `orWhereNotLike` 添加带 NOT LIKE 条件的 "or" 子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereNotLike('name', '%John%')
    ->get();
```

> [!WARNING]
> `whereLike` 的区分大小写搜索选项目前不受 SQL Server 支持。

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法验证给定列的值是否包含在给定数组中：

```php
$users = DB::table('users')
    ->whereIn('id', [1, 2, 3])
    ->get();
```

`whereNotIn` 方法验证给定列的值不包含在给定数组中：

```php
$users = DB::table('users')
    ->whereNotIn('id', [1, 2, 3])
    ->get();
```

你也可以提供查询对象作为 `whereIn` 方法的第二个参数：

```php
$activeUsers = DB::table('users')->select('id')->where('is_active', 1);

$comments = DB::table('comments')
    ->whereIn('user_id', $activeUsers)
    ->get();
```

上面的示例将产生以下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> [!WARNING]
> 如果你要向查询添加大型整数绑定数组，`whereIntegerInRaw` 或 `whereIntegerNotInRaw` 方法可大幅减少内存使用。

**whereBetween / orWhereBetween**

`whereBetween` 方法验证列值是否介于两个值之间：

```php
$users = DB::table('users')
    ->whereBetween('votes', [1, 100])
    ->get();
```

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法验证列值是否位于两个值之外：

```php
$users = DB::table('users')
    ->whereNotBetween('votes', [1, 100])
    ->get();
```

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法验证列值是否介于同一表行中两列的值之间：

```php
$patients = DB::table('patients')
    ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

`whereNotBetweenColumns` 方法验证列值是否位于同一表行中两列的值之外：

```php
$patients = DB::table('patients')
    ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

**whereValueBetween / whereValueNotBetween / orWhereValueBetween / orWhereValueNotBetween**

`whereValueBetween` 方法验证给定值是否介于同一表行中两个相同类型列的值之间：

```php
$products = DB::table('products')
    ->whereValueBetween(100, ['min_price', 'max_price'])
    ->get();
```

`whereValueNotBetween` 方法验证某个值是否位于同一表行中两列的值之外：

```php
$products = DB::table('products')
    ->whereValueNotBetween(100, ['min_price', 'max_price'])
    ->get();
```

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法验证给定列的值是否为 `NULL`：

```php
$users = DB::table('users')
    ->whereNull('updated_at')
    ->get();
```

`whereNotNull` 方法验证列值不是 `NULL`：

```php
$users = DB::table('users')
    ->whereNotNull('updated_at')
    ->get();
```

**whereNullSafeEquals / orWhereNullSafeEquals**

`whereNullSafeEquals` 和 `orWhereNullSafeEquals` 方法可用于将列值与给定值进行比较，同时将两个 `NULL` 值视为相等：

```php
$lastLoginIp = $request->input('last_login_ip');

$users = DB::table('users')
    ->whereNullSafeEquals('last_login_ip', $lastLoginIp)
    ->get();
```

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法可用于将列值与日期进行比较：

```php
$users = DB::table('users')
    ->whereDate('created_at', '2016-12-31')
    ->get();
```

`whereMonth` 方法可用于将列值与特定月份进行比较：

```php
$users = DB::table('users')
    ->whereMonth('created_at', '12')
    ->get();
```

`whereDay` 方法可用于将列值与月份中的特定日期进行比较：

```php
$users = DB::table('users')
    ->whereDay('created_at', '31')
    ->get();
```

`whereYear` 方法可用于将列值与特定年份进行比较：

```php
$users = DB::table('users')
    ->whereYear('created_at', '2016')
    ->get();
```

`whereTime` 方法可用于将列值与特定时间进行比较：

```php
$users = DB::table('users')
    ->whereTime('created_at', '=', '11:20:45')
    ->get();
```

**wherePast / whereFuture / whereToday / whereBeforeToday / whereAfterToday**

`wherePast` 和 `whereFuture` 方法可用于判断列值是过去还是未来：

```php
$invoices = DB::table('invoices')
    ->wherePast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereFuture('due_at')
    ->get();
```

`whereNowOrPast` 和 `whereNowOrFuture` 方法可用于判断列值是否在过去或未来（包含当前日期和时间）：

```php
$invoices = DB::table('invoices')
    ->whereNowOrPast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereNowOrFuture('due_at')
    ->get();
```

`whereToday`、`whereBeforeToday` 和 `whereAfterToday` 方法可分别用于判断列值是否是今天、今天之前或今天之后：

```php
$invoices = DB::table('invoices')
    ->whereToday('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereBeforeToday('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereAfterToday('due_at')
    ->get();
```

类似地，`whereTodayOrBefore` 和 `whereTodayOrAfter` 方法可用于判断列值是否在今天之前或今天之后（包含今天的日期）：

```php
$invoices = DB::table('invoices')
    ->whereTodayOrBefore('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereTodayOrAfter('due_at')
    ->get();
```

**whereColumn / orWhereColumn**

`whereColumn` 方法可用于验证两列是否相等：

```php
$users = DB::table('users')
    ->whereColumn('first_name', 'last_name')
    ->get();
```

你也可以向 `whereColumn` 方法传递比较运算符：

```php
$users = DB::table('users')
    ->whereColumn('updated_at', '>', 'created_at')
    ->get();
```

你也可以向 `whereColumn` 方法传递列比较数组。这些条件将使用 `and` 运算符连接：

```php
$users = DB::table('users')
    ->whereColumn([
        ['first_name', '=', 'last_name'],
        ['updated_at', '>', 'created_at'],
    ])->get();
```

<a name="logical-grouping"></a>
### 逻辑分组

有时你可能需要在括号内分组多个 "where" 子句，以实现查询所需的逻辑分组。事实上，你通常应始终将 `orWhere` 方法的调用用括号分组，以避免意外的查询行为。为此，你可以向 `where` 方法传递一个闭包：

```php
$users = DB::table('users')
    ->where('name', '=', 'John')
    ->where(function (Builder $query) {
        $query->where('votes', '>', 100)
            ->orWhere('title', '=', 'Admin');
    })
    ->get();
```

如你所见，将闭包传入 `where` 方法会指示查询构造器开始一个约束组。该闭包将接收一个查询构造器实例，你可以用它设置应包含在括号组内的约束。上面的示例将产生以下 SQL：

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> [!WARNING]
> 你应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="advanced-where-clauses"></a>
## 高级 Where 子句

<a name="where-exists-clauses"></a>
### Where Exists 子句

`whereExists` 方法允许你编写 "where exists" SQL 子句。`whereExists` 方法接受一个闭包，该闭包将接收一个查询构造器实例，允许你定义应放置在 "exists" 子句内的查询：

```php
$users = DB::table('users')
    ->whereExists(function (Builder $query) {
        $query->select(DB::raw(1))
            ->from('orders')
            ->whereColumn('orders.user_id', 'users.id');
    })
    ->get();
```

或者，你可以向 `whereExists` 方法提供查询对象而不是闭包：

```php
$orders = DB::table('orders')
    ->select(DB::raw(1))
    ->whereColumn('orders.user_id', 'users.id');

$users = DB::table('users')
    ->whereExists($orders)
    ->get();
```

以上两个示例都将产生以下 SQL：

```sql
select * from users
where exists (
    select 1
    from orders
    where orders.user_id = users.id
)
```

<a name="subquery-where-clauses"></a>
### 子查询 Where 子句

有时你可能需要构造一个将子查询结果与给定值进行比较的 "where" 子句。你可以通过向 `where` 方法传递闭包和值来实现。例如，以下查询将检索所有拥有给定类型近期"会员资格"的用户：

```php
use App\Models\User;
use Illuminate\Database\Query\Builder;

$users = User::where(function (Builder $query) {
    $query->select('type')
        ->from('membership')
        ->whereColumn('membership.user_id', 'users.id')
        ->orderByDesc('membership.start_date')
        ->limit(1);
}, 'Pro')->get();
```

或者，你可能需要构造一个将列与子查询结果进行比较的 "where" 子句。你可以通过向 `where` 方法传递列、运算符和闭包来实现。例如，以下查询将检索所有金额小于平均值的收入记录：

```php
use App\Models\Income;
use Illuminate\Database\Query\Builder;

$incomes = Income::where('amount', '<', function (Builder $query) {
    $query->selectRaw('avg(i.amount)')->from('incomes as i');
})->get();
```

<a name="full-text-where-clauses"></a>
### 全文 Where 子句

> [!WARNING]
> 全文 where 子句目前受 MariaDB、MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于为具有[全文索引](/docs/{{version}}/migrations#available-index-types)的列向查询添加全文 "where" 子句。Laravel 将把这些方法转换为底层数据库系统相应的 SQL。例如，将为使用 MariaDB 或 MySQL 的应用生成 `MATCH AGAINST` 子句：

```php
$users = DB::table('users')
    ->whereFullText('bio', 'web developer')
    ->get();
```

<a name="vector-similarity-clauses"></a>
### 向量相似度子句

> [!NOTE]
> 向量相似度子句目前受使用 `pgvector` 扩展的 PostgreSQL 连接以及 MariaDB 11.7 及以上版本支持。有关定义向量列和索引的信息，请查阅[迁移文档](/docs/{{version}}/migrations#available-column-types)。

`whereVectorSimilarTo` 方法通过余弦相似度过滤结果，并按键按相关性排序结果。`minSimilarity` 阈值应为介于 `0.0` 和 `1.0` 之间的值，其中 `1.0` 表示完全相同：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

当将普通字符串作为向量参数时，Laravel 会使用 [Laravel AI SDK](/docs/{{version}}/ai-sdk#embeddings) 自动为其生成嵌入：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

默认情况下，`whereVectorSimilarTo` 也会按距离对结果排序（最相似的在前）。你可以通过传递 `false` 作为 `order` 参数来禁用此排序：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4, order: false)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

如果你需要更多控制，可以独立使用 `selectVectorDistance`、`whereVectorDistanceLessThan` 和 `orderByVectorDistance` 方法：

```php
$documents = DB::table('documents')
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

使用 PostgreSQL 时，必须先加载 `pgvector` 扩展，然后才能创建 `vector` 列：

```php
Schema::ensureVectorExtensionExists();
```

<a name="ordering-grouping-limit-and-offset"></a>
## 排序、分组、Limit 与 Offset

<a name="ordering"></a>
### 排序

<a name="orderby"></a>
#### `orderBy` 方法

`orderBy` 方法允许你按给定列对查询结果进行排序。`orderBy` 方法接受的第一个参数应是你希望排序的列，第二个参数确定排序方向，可以是 `asc` 或 `desc`：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->get();
```

要按多列排序，你可以简单地根据需要多次调用 `orderBy`：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->orderBy('email', 'asc')
    ->get();
```

排序方向是可选的，默认升序。如果你想按降序排序，可以为 `orderBy` 方法指定第二个参数，或直接使用 `orderByDesc`：

```php
$users = DB::table('users')
    ->orderByDesc('verified_at')
    ->get();
```

最后，使用 `->` 运算符，可以按 JSON 列中的值对结果排序：

```php
$corporations = DB::table('corporations')
    ->where('country', 'US')
    ->orderBy('location->state')
    ->get();
```

<a name="latest-oldest"></a>
#### `latest` 和 `oldest` 方法

`latest` 和 `oldest` 方法允许你轻松地按日期排序结果。默认情况下，结果将按表的 `created_at` 列排序。或者，你可以传入希望排序的列名：

```php
$user = DB::table('users')
    ->latest()
    ->first();
```

<a name="random-ordering"></a>
#### 随机排序

`inRandomOrder` 方法可用于随机排序查询结果。例如，你可以使用此方法获取一个随机用户：

```php
$randomUser = DB::table('users')
    ->inRandomOrder()
    ->first();
```

<a name="removing-existing-orderings"></a>
#### 移除现有排序

`reorder` 方法会移除先前已应用于查询的所有 "order by" 子句：

```php
$query = DB::table('users')->orderBy('name');

$unorderedUsers = $query->reorder()->get();
```

调用 `reorder` 方法时可以传递列和方向，以移除所有现有的 "order by" 子句并对查询应用全新的排序：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorder('email', 'desc')->get();
```

为方便起见，你可以使用 `reorderDesc` 方法按降序对查询结果重新排序：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorderDesc('email')->get();
```

<a name="grouping"></a>
### 分组

<a name="groupby-having"></a>
#### `groupBy` 和 `having` 方法

正如你可能预期的，`groupBy` 和 `having` 方法可用于对查询结果进行分组。`having` 方法的签名与 `where` 方法类似：

```php
$users = DB::table('users')
    ->groupBy('account_id')
    ->having('account_id', '>', 100)
    ->get();
```

你可以使用 `havingBetween` 方法在给定范围内过滤结果：

```php
$report = DB::table('orders')
    ->selectRaw('count(id) as number_of_orders, customer_id')
    ->groupBy('customer_id')
    ->havingBetween('number_of_orders', [5, 15])
    ->get();
```

你可以向 `groupBy` 方法传递多个参数以按多列分组：

```php
$users = DB::table('users')
    ->groupBy('first_name', 'status')
    ->having('account_id', '>', 100)
    ->get();
```

要构建更高级的 `having` 语句，请参阅 [havingRaw](#raw-methods) 方法。

<a name="limit-and-offset"></a>
### Limit 与 Offset

你可以使用 `limit` 和 `offset` 方法限制查询返回的结果数量，或跳过查询中的给定结果数：

```php
$users = DB::table('users')
    ->offset(10)
    ->limit(5)
    ->get();
```

<a name="conditional-clauses"></a>
## 条件子句

有时你可能希望根据另一个条件将某些查询子句应用于查询。例如，你可能只想在给定输入值存在于传入 HTTP 请求时应用 `where` 语句。你可以使用 `when` 方法实现这一点：

```php
$role = $request->input('role');

$users = DB::table('users')
    ->when($role, function (Builder $query, string $role) {
        $query->where('role_id', $role);
    })
    ->get();
```

`when` 方法只在第一个参数为 `true` 时执行给定闭包。如果第一个参数为 `false`，则不会执行闭包。因此，在上面的示例中，只有当 `role` 字段存在于传入请求中且求值为 `true` 时，`when` 方法的闭包才会被调用。

你可以将另一个闭包作为第三个参数传递给 `when` 方法。此闭包只在第一个参数求值为 `false` 时执行。为说明此功能的使用方式，我们将使用它来配置查询的默认排序：

```php
$sortByVotes = $request->boolean('sort_by_votes');

$users = DB::table('users')
    ->when($sortByVotes, function (Builder $query, bool $sortByVotes) {
        $query->orderBy('votes');
    }, function (Builder $query) {
        $query->orderBy('name');
    })
    ->get();
```

<a name="insert-statements"></a>
## Insert 语句

查询构造器还提供了一个 `insert` 方法，可用于将记录插入数据库表。`insert` 方法接受一个列名和值数组：

```php
DB::table('users')->insert([
    'email' => 'kayla@example.com',
    'votes' => 0
]);
```

你可以通过传递数组的数组一次插入多条记录。每个数组表示应插入表中的一条记录：

```php
DB::table('users')->insert([
    ['email' => 'picard@example.com', 'votes' => 0],
    ['email' => 'janeway@example.com', 'votes' => 0],
]);
```

`insertOrIgnore` 方法在将记录插入数据库时会忽略错误。使用此方法时，你应注意重复记录错误会被忽略，而其他类型的错误也可能根据数据库引擎被忽略。例如，`insertOrIgnore` 将[绕过 MySQL 的严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

```php
DB::table('users')->insertOrIgnore([
    ['id' => 1, 'email' => 'sisko@example.com'],
    ['id' => 2, 'email' => 'archer@example.com'],
]);
```

`insertUsing` 方法将使用子查询确定应插入的数据，将新记录插入表：

```php
DB::table('pruned_users')->insertUsing([
    'id', 'name', 'email', 'email_verified_at'
], DB::table('users')->select(
    'id', 'name', 'email', 'email_verified_at'
)->where('updated_at', '<=', now()->minus(months: 1)));
```

<a name="auto-incrementing-ids"></a>
#### 自动递增 ID

如果表有自动递增的 id，请使用 `insertGetId` 方法插入记录，然后检索 ID：

```php
$id = DB::table('users')->insertGetId(
    ['email' => 'john@example.com', 'votes' => 0]
);
```

> [!WARNING]
> 使用 PostgreSQL 时，`insertGetId` 方法期望自动递增列名为 `id`。如果你想从不同的"序列"检索 ID，可以将列名作为第二个参数传递给 `insertGetId` 方法。

<a name="upserts"></a>
### Upsert

`upsert` 方法将插入不存在的记录，并使用你可能指定的新值更新已存在的记录。该方法的第一参数由要插入或更新的值组成，而第二个参数列出在关联表中唯一标识记录的列。该方法的第三个也是最后一个参数是如果匹配记录已存在于数据库中时应更新的列数组：

```php
DB::table('flights')->upsert(
    [
        ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
        ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
    ],
    ['departure', 'destination'],
    ['price']
);
```

在上面的示例中，Laravel 将尝试插入两条记录。如果已存在具有相同 `departure` 和 `destination` 列值的记录，Laravel 将更新该记录的 `price` 列。

> [!WARNING]
> 除 SQL Server 之外的所有数据库都要求 `upsert` 方法第二个参数中的列具有"主"或"唯一"索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，并始终使用表的"主"和"唯一"索引来检测现有记录。

<a name="update-statements"></a>
## Update 语句

除了向数据库插入记录之外，查询构造器还可以使用 `update` 方法更新现有记录。`update` 方法与 `insert` 方法一样，接受指示要更新列的列与值对数组。`update` 方法返回受影响的行数。你可以使用 `where` 子句约束 `update` 查询：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['votes' => 1]);
```

<a name="update-or-insert"></a>
#### 更新或插入

有时你可能希望更新数据库中的现有记录，如果不存在匹配记录则创建它。在这种场景下，可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接受两个参数：用于查找记录的条件数组，以及指示要更新列的列与值对数组。

`updateOrInsert` 方法将使用第一个参数的列与值对尝试定位匹配的数据库记录。如果记录存在，将使用第二个参数中的值更新它。如果找不到记录，将使用两个参数的合并属性插入新记录：

```php
DB::table('users')
    ->updateOrInsert(
        ['email' => 'john@example.com', 'name' => 'John'],
        ['votes' => '2']
    );
```

你可以向 `updateOrInsert` 方法提供闭包，以根据匹配记录是否存在来自定义要更新或插入数据库的属性：

```php
DB::table('users')->updateOrInsert(
    ['user_id' => $user_id],
    fn ($exists) => $exists ? [
        'name' => $data['name'],
        'email' => $data['email'],
    ] : [
        'name' => $data['name'],
        'email' => $data['email'],
        'marketable' => true,
    ],
);
```

<a name="updating-json-columns"></a>
### 更新 JSON 列

更新 JSON 列时，应使用 `->` 语法更新 JSON 对象中的适当键。此操作受 MariaDB 10.3+、MySQL 5.7+ 和 PostgreSQL 9.5+ 支持：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['options->enabled' => true]);
```

<a name="increment-and-decrement"></a>
### 递增与递减

查询构造器还提供了便捷的方法来递增或递减给定列的值。这两种方法都至少接受一个参数：要修改的列。可以提供第二个参数来指定列应递增或递减的量：

```php
DB::table('users')->increment('votes');

DB::table('users')->increment('votes', 5);

DB::table('users')->decrement('votes');

DB::table('users')->decrement('votes', 5);
```

如有需要，你也可以在递增或递减操作期间指定要更新的其他列：

```php
DB::table('users')->increment('votes', 1, ['name' => 'John']);
```

此外，你可以使用 `incrementEach` 和 `decrementEach` 方法一次递增或递减多个列：

```php
DB::table('users')->incrementEach([
    'votes' => 5,
    'balance' => 100,
]);
```

<a name="delete-statements"></a>
## Delete 语句

查询构造器的 `delete` 方法可用于从表中删除记录。`delete` 方法返回受影响的行数。你可以通过在调用 `delete` 方法之前添加 "where" 子句来约束 `delete` 语句：

```php
$deleted = DB::table('users')->delete();

$deleted = DB::table('users')->where('votes', '>', 100)->delete();
```

<a name="pessimistic-locking"></a>
## 悲观锁

查询构造器还包含几个函数，帮助你在执行 `select` 语句时实现"悲观锁定"。要执行带 "shared lock" 的语句，可以调用 `sharedLock` 方法。共享锁可防止所选行在你的事务提交之前被修改：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->sharedLock()
    ->get();
```

或者，你可以使用 `lockForUpdate` 方法。"for update" 锁可防止所选记录被修改或被其他共享锁选中：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->lockForUpdate()
    ->get();
```

虽然不是必须的，但建议在[事务](/docs/{{version}}/database#database-transactions)内包裹悲观锁。这可以确保检索到的数据在整个操作完成之前在数据库中保持不变。如果发生失败，事务将回滚任何更改并自动释放锁：

```php
DB::transaction(function () {
    $sender = DB::table('users')
        ->lockForUpdate()
        ->find(1);

    $receiver = DB::table('users')
        ->lockForUpdate()
        ->find(2);

    if ($sender->balance < 100) {
        throw new RuntimeException('Balance too low.');
    }

    DB::table('users')
        ->where('id', $sender->id)
        ->update([
            'balance' => $sender->balance - 100
        ]);

    DB::table('users')
        ->where('id', $receiver->id)
        ->update([
            'balance' => $receiver->balance + 100
        ]);
});
```

<a name="reusable-query-components"></a>
## 可复用的查询组件

如果你的应用中有重复的查询逻辑，可以使用查询构造器的 `tap` 和 `pipe` 方法将逻辑提取到可复用对象中。假设你在应用中有这两个不同的查询：

```php
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

$destination = $request->query('destination');

DB::table('flights')
    ->when($destination, function (Builder $query, string $destination) {
        $query->where('destination', $destination);
    })
    ->orderByDesc('price')
    ->get();

// ...

$destination = $request->query('destination');

DB::table('flights')
    ->when($destination, function (Builder $query, string $destination) {
        $query->where('destination', $destination);
    })
    ->where('user', $request->user()->id)
    ->orderBy('destination')
    ->get();
```

你可能希望将查询之间通用的目的地过滤提取到可复用对象中：

```php
<?php

namespace App\Scopes;

use Illuminate\Database\Query\Builder;

class DestinationFilter
{
    public function __construct(
        private ?string $destination,
    ) {
        //
    }

    public function __invoke(Builder $query): void
    {
        $query->when($this->destination, function (Builder $query) {
            $query->where('destination', $this->destination);
        });
    }
}
```

然后，你可以使用查询构造器的 `tap` 方法将对象的逻辑应用到查询中：

```php
use App\Scopes\DestinationFilter;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

DB::table('flights')
    ->when($destination, function (Builder $query, string $destination) { // [tl! remove]
        $query->where('destination', $destination); // [tl! remove]
    }) // [tl! remove]
    ->tap(new DestinationFilter($destination)) // [tl! add]
    ->orderByDesc('price')
    ->get();

// ...

DB::table('flights')
    ->when($destination, function (Builder $query, string $destination) { // [tl! remove]
        $query->where('destination', $destination); // [tl! remove]
    }) // [tl! remove]
    ->tap(new DestinationFilter($destination)) // [tl! add]
    ->where('user', $request->user()->id)
    ->orderBy('destination')
    ->get();
```

<a name="query-pipes"></a>
#### 查询管道

`tap` 方法总是返回查询构造器。如果你想提取一个执行查询并返回其他值的对象，可以使用 `pipe` 方法。

请考虑以下包含整个应用中使用的共享[分页](/docs/{{version}}/pagination)逻辑的查询对象。与向查询应用查询条件的 `DestinationFilter` 不同，`Paginate` 对象执行查询并返回分页器实例：

```php
<?php

namespace App\Scopes;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;

class Paginate
{
    public function __construct(
        private string $sortBy = 'timestamp',
        private string $sortDirection = 'desc',
        private int $perPage = 25,
    ) {
        //
    }

    public function __invoke(Builder $query): LengthAwarePaginator
    {
        return $query->orderBy($this->sortBy, $this->sortDirection)
            ->paginate($this->perPage, pageName: 'p');
    }
}
```

使用查询构造器的 `pipe` 方法，我们可以利用此对象应用共享分页逻辑：

```php
$flights = DB::table('flights')
    ->tap(new DestinationFilter($destination))
    ->pipe(new Paginate);
```

<a name="debugging"></a>
## 调试

你可以在构建查询时使用 `dd` 和 `dump` 方法转储当前查询绑定和 SQL。`dd` 方法将显示调试信息，然后停止执行请求。`dump` 方法将显示调试信息，但允许请求继续执行：

```php
DB::table('users')->where('votes', '>', 100)->dd();

DB::table('users')->where('votes', '>', 100)->dump();
```

可以对查询调用 `dumpRawSql` 和 `ddRawSql` 方法，以转储查询的 SQL 并适当替换所有参数绑定：

```php
DB::table('users')->where('votes', '>', 100)->dumpRawSql();

DB::table('users')->where('votes', '>', 100)->ddRawSql();
```
