# 数据库：查询构造器

- [简介](#introduction)
- [运行数据库查询](#running-database-queries)
    - [分块处理结果](#chunking-results)
    - [惰性流式处理结果](#streaming-results-lazily)
    - [聚合函数](#aggregates)
- [Select 语句](#select-statements)
- [原生表达式](#raw-expressions)
- [连接查询](#joins)
- [联合查询](#unions)
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
- [排序、分组、限制与偏移](#ordering-grouping-limit-and-offset)
    - [排序](#ordering)
    - [分组](#grouping)
    - [限制与偏移](#limit-and-offset)
- [条件子句](#conditional-clauses)
- [Insert 语句](#insert-statements)
    - [Upsert](#upserts)
- [Update 语句](#update-statements)
    - [更新 JSON 字段](#updating-json-columns)
    - [自增与自减](#increment-and-decrement)
- [Delete 语句](#delete-statements)
- [悲观锁](#pessimistic-locking)
- [可复用查询组件](#reusable-query-components)
- [调试](#debugging)

<a name="introduction"></a>
## 简介

Laravel 的数据库查询构造器为创建和运行数据库查询提供了一个便捷、流式的接口。它可用于执行应用中的大多数数据库操作，并能完美兼容 Laravel 支持的所有数据库系统。

Laravel 查询构造器使用 PDO 参数绑定来保护应用免受 SQL 注入攻击。对于作为查询绑定传递给查询构造器的字符串，无需对其进行清理或过滤。

> [!WARNING]
> PDO 不支持绑定字段名。因此，你绝不应允许用户输入来决定查询所引用的字段名，包括"order by"的字段。

<a name="running-database-queries"></a>
## 运行数据库查询

<a name="retrieving-all-rows-from-a-table"></a>
#### 从表中检索所有行

你可以使用 `DB` Facade 提供的 `table` 方法来开始一个查询。`table` 方法会为给定的表返回一个流式查询构造器实例，让你可以继续链式添加更多约束条件，最后使用 `get` 方法获取查询结果：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示应用所有用户的列表。
     */
    public function index(): View
    {
        $users = DB::table('users')->get();

        return view('user.index', ['users' => $users]);
    }
}
```

`get` 方法返回一个 `Illuminate\Support\Collection` 实例，其中包含查询结果，每个结果都是 PHP `stdClass` 对象的一个实例。你可以像访问对象属性一样访问每个字段的值：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->get();

foreach ($users as $user) {
    echo $user->name;
}
```

> [!NOTE]
> Laravel 集合提供了多种极其强大的方法来映射和归纳数据。有关 Laravel 集合的更多信息，请查阅[集合文档](/docs/{{version}}/collections)。

<a name="retrieving-a-single-row-column-from-a-table"></a>
#### 从表中检索单行 / 单字段

如果只需从数据库表中检索单行数据，可以使用 `DB` Facade 的 `first` 方法。该方法会返回一个单独的 `stdClass` 对象：

```php
$user = DB::table('users')->where('name', 'John')->first();

return $user->email;
```

如果你想从数据库表中检索单行数据，但在找不到匹配行时抛出 `Illuminate\Database\RecordNotFoundException`，可以使用 `firstOrFail` 方法。如果 `RecordNotFoundException` 未被捕获，会自动向客户端返回 404 HTTP 响应：

```php
$user = DB::table('users')->where('name', 'John')->firstOrFail();
```

如果不需要整行数据，可以使用 `value` 方法从记录中提取单个值。该方法会直接返回该字段的值：

```php
$email = DB::table('users')->where('name', 'John')->value('email');
```

要根据 `id` 字段的值检索单行数据，请使用 `find` 方法：

```php
$user = DB::table('users')->find(3);
```

<a name="retrieving-a-list-of-column-values"></a>
#### 检索字段值列表

如果你想获取一个包含单个字段所有值的 `Illuminate\Support\Collection` 实例，可以使用 `pluck` 方法。在本示例中，我们将获取所有用户头衔的集合：

```php
use Illuminate\Support\Facades\DB;

$titles = DB::table('users')->pluck('title');

foreach ($titles as $title) {
    echo $title;
}
```

你可以通过向 `pluck` 方法提供第二个参数，来指定结果集合用作键的字段：

```php
$titles = DB::table('users')->pluck('title', 'name');

foreach ($titles as $name => $title) {
    echo $title;
}
```

<a name="chunking-results"></a>
### 分块处理结果

如果你需要处理成千上万条数据库记录，可以考虑使用 `DB` Facade 提供的 `chunk` 方法。该方法一次只检索一小块结果，并将每一块传入闭包进行处理。例如，让我们每次以 100 条记录为一块，分块检索整个 `users` 表：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    foreach ($users as $user) {
        // ...
    }
});
```

你可以通过在闭包中返回 `false` 来停止处理后续分块：

```php
DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    // 处理这些记录...

    return false;
});
```

如果你在分块处理结果的同时更新数据库记录，分块的结果可能会以意想不到的方式发生变化。如果你打算在分块处理时更新检索到的记录，最好始终改用 `chunkById` 方法。该方法会根据记录的主键自动对结果进行分页：

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

由于 `chunkById` 和 `lazyById` 方法会向正在执行的查询添加自己的"where"条件，你通常应将自己的条件[逻辑分组](#logical-grouping)到一个闭包中：

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
> 在分块回调中更新或删除记录时，对主键或外键的任何更改都可能影响分块查询，可能导致某些记录不会出现在分块结果中。

<a name="streaming-results-lazily"></a>
### 惰性流式处理结果

`lazy` 方法的工作方式与 [chunk 方法](#chunking-results)类似，都是分块执行查询。不过，`lazy()` 方法不是将每个分块传入回调，而是返回一个 [LazyCollection](/docs/{{version}}/collections#lazy-collections)，让你可以像与单个流交互一样处理结果：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function (object $user) {
    // ...
});
```

同样，如果你打算在遍历记录的同时更新它们，最好改用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法会根据记录的主键自动对结果进行分页：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function (object $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> [!WARNING]
> 在遍历记录的同时更新或删除它们时，对主键或外键的任何更改都可能影响分块查询，可能导致某些记录不会出现在结果中。

<a name="aggregates"></a>
### 聚合函数

查询构造器还提供了多种用于检索聚合值的方法，例如 `count`、`max`、`min`、`avg` 和 `sum`。你可以在构建查询后调用这些方法中的任意一个：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->count();

$price = DB::table('orders')->max('price');
```

当然，你也可以将这些方法与其他子句结合使用，来精细调整聚合值的计算方式：

```php
$price = DB::table('orders')
    ->where('finalized', 1)
    ->avg('price');
```

<a name="determining-if-records-exist"></a>
#### 判断记录是否存在

与其使用 `count` 方法来判断是否有匹配查询约束的记录，不如使用 `exists` 和 `doesntExist` 方法：

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

你可能并不总是希望选择数据库表中的所有字段。使用 `select` 方法，你可以为查询指定自定义的"select"子句：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->select('name', 'email as user_email')
    ->get();
```

`distinct` 方法允许你强制查询返回去重后的结果：

```php
$users = DB::table('users')->distinct()->get();
```

如果你已经有一个查询构造器实例，并希望向其现有的 select 子句中添加字段，可以使用 `addSelect` 方法：

```php
$query = DB::table('users')->select('name');

$users = $query->addSelect('age')->get();
```

<a name="raw-expressions"></a>
## 原生表达式

有时你可能需要向查询中插入任意字符串。要创建原生的字符串表达式，可以使用 `DB` Facade 提供的 `raw` 方法：

```php
$users = DB::table('users')
    ->select(DB::raw('count(*) as user_count, status'))
    ->where('status', '<>', 1)
    ->groupBy('status')
    ->get();
```

> [!WARNING]
> 原生语句会以字符串形式注入到查询中，因此你必须格外小心，避免造成 SQL 注入漏洞。

<a name="raw-methods"></a>
### 原生方法

除了使用 `DB::raw` 方法之外，你还可以使用以下方法将原生表达式插入查询的各个部分。**请记住，Laravel 无法保证任何使用原生表达式的查询都能免受 SQL 注入漏洞的影响。**

<a name="selectraw"></a>
#### `selectRaw`

`selectRaw` 方法可以替代 `addSelect(DB::raw(/* ... */))`。该方法接受一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->selectRaw('price * ? as price_with_tax', [1.0825])
    ->get();
```

<a name="whereraw-orwhereraw"></a>
#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可用于向查询中注入原生的"where"子句。这些方法接受一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
    ->get();
```

<a name="havingraw-orhavingraw"></a>
#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可用于提供原生字符串作为"having"子句的值。这些方法接受一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->select('department', DB::raw('SUM(price) as total_sales'))
    ->groupBy('department')
    ->havingRaw('SUM(price) > ?', [2500])
    ->get();
```

<a name="orderbyraw"></a>
#### `orderByRaw`

`orderByRaw` 方法可用于提供原生字符串作为"order by"子句的值：

```php
$orders = DB::table('orders')
    ->orderByRaw('updated_at - created_at DESC')
    ->get();
```

<a name="groupbyraw"></a>
### `groupByRaw`

`groupByRaw` 方法可用于提供原生字符串作为 `group by` 子句的值：

```php
$orders = DB::table('orders')
    ->select('city', 'state')
    ->groupByRaw('city, state')
    ->get();
```

<a name="joins"></a>
## 连接查询

<a name="inner-join-clause"></a>
#### Inner Join 子句

查询构造器还可用于向查询添加连接（join）子句。要执行基本的"inner join"，可以在查询构造器实例上使用 `join` 方法。传给 `join` 方法的第一个参数是要连接的表名，其余参数指定连接的字段约束。你甚至可以在单个查询中连接多个表：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->join('contacts', 'users.id', '=', 'contacts.user_id')
    ->join('orders', 'users.id', '=', 'orders.user_id')
    ->select('users.*', 'contacts.phone', 'orders.price')
    ->get();
```

<a name="left-join-right-join-clause"></a>
#### Left Join / Right Join 子句

如果想执行"left join"或"right join"而非"inner join"，请使用 `leftJoin` 或 `rightJoin` 方法。这些方法与 `join` 方法具有相同的方法签名：

```php
$users = DB::table('users')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();

$users = DB::table('users')
    ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();
```

<a name="cross-join-clause"></a>
#### Cross Join 子句

你可以使用 `crossJoin` 方法来执行"cross join"。交叉连接会生成第一个表与被连接表之间的笛卡尔积：

```php
$sizes = DB::table('sizes')
    ->crossJoin('colors')
    ->get();
```

<a name="advanced-join-clauses"></a>
#### 高级 Join 子句

你还可以指定更高级的连接子句。首先，向 `join` 方法传递一个闭包作为第二个参数。该闭包会接收一个 `Illuminate\Database\Query\JoinClause` 实例，让你可以在"join"子句上指定约束：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
    })
    ->get();
```

如果想在连接上使用"where"子句，可以使用 `JoinClause` 实例提供的 `where` 和 `orWhere` 方法。这些方法不是比较两个字段，而是将字段与一个值进行比较：

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

你可以使用 `joinSub`、`leftJoinSub` 和 `rightJoinSub` 方法将查询连接到子查询。这些方法各自接收三个参数：子查询、其表别名，以及定义相关字段的闭包。在本示例中，我们将检索一个用户集合，其中每个用户记录还包含其最近发布的博客文章的 `created_at` 时间戳：

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
> 横向连接目前由 PostgreSQL、MySQL >= 8.0.14 和 SQL Server 支持。

你可以使用 `joinLateral` 和 `leftJoinLateral` 方法来执行与子查询的"lateral join"（横向连接）。这些方法各自接收两个参数：子查询及其表别名。连接条件应在给定子查询的 `where` 子句中指定。横向连接会针对每一行进行求值，并且可以引用子查询外部的字段。

在本示例中，我们将检索一个用户集合，以及每个用户最近的三篇博客文章。每个用户在结果集中最多可以产生三行：对应其最近的三篇博客文章各一行。连接条件通过子查询内的 `whereColumn` 子句指定，引用当前用户行：

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
## 联合查询

查询构造器还提供了一种便捷的方式将两个或多个查询"联合"（union）起来。例如，你可以先创建一个初始查询，然后使用 `union` 方法将其与更多查询联合：

```php
use Illuminate\Support\Facades\DB;

$usersWithoutFirstName = DB::table('users')
    ->whereNull('first_name');

$users = DB::table('users')
    ->whereNull('last_name')
    ->union($usersWithoutFirstName)
    ->get();
```

除 `union` 方法外，查询构造器还提供了 `unionAll` 方法。使用 `unionAll` 方法联合的查询不会去除重复结果。`unionAll` 方法与 `union` 方法具有相同的方法签名。

<a name="basic-where-clauses"></a>
## 基础 Where 子句

<a name="where-clauses"></a>
### Where 子句

你可以使用查询构造器的 `where` 方法向查询添加"where"子句。最基本的 `where` 方法调用需要三个参数。第一个参数是字段名。第二个参数是操作符，可以是数据库支持的任何操作符。第三个参数是与字段值进行比较的值。

例如，以下查询检索 `votes` 字段值等于 `100` 且 `age` 字段值大于 `35` 的用户：

```php
$users = DB::table('users')
    ->where('votes', '=', 100)
    ->where('age', '>', 35)
    ->get();
```

为方便起见，如果你想验证某个字段是否 `=` 给定值，可以将该值作为 `where` 方法的第二个参数传递。Laravel 会默认你想使用 `=` 操作符：

```php
$users = DB::table('users')->where('votes', 100)->get();
```

你还可以向 `where` 方法提供一个关联数组，以便快速对多个字段进行查询：

```php
$users = DB::table('users')->where([
    'first_name' => 'Jane',
    'last_name' => 'Doe',
])->get();
```

如前所述，你可以使用数据库系统支持的任何操作符：

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

你也可以向 `where` 方法传递一个条件数组。数组的每个元素都应是一个数组，包含通常传给 `where` 方法的三个参数：

```php
$users = DB::table('users')->where([
    ['status', '=', '1'],
    ['subscribed', '<>', '1'],
])->get();
```

> [!WARNING]
> PDO 不支持绑定字段名。因此，你绝不应允许用户输入来决定查询所引用的字段名，包括"order by"的字段。

> [!WARNING]
> MySQL 和 MariaDB 在字符串与数字比较时会自动将字符串转换为整数。在此过程中，非数字字符串会被转换为 `0`，可能导致意想不到的结果。例如，如果表中 `secret` 字段的值为 `aaa`，你运行 `User::where('secret', 0)`，该行会被返回。为避免这种情况，请确保所有值在用于查询之前都已转换为适当的类型。

<a name="or-where-clauses"></a>
### Or Where 子句

链式调用查询构造器的 `where` 方法时，"where"子句会使用 `and` 操作符连接在一起。不过，你可以使用 `orWhere` 方法以 `or` 操作符将子句连接到查询。`orWhere` 方法接受与 `where` 方法相同的参数：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhere('name', 'John')
    ->get();
```

如果需要将"or"条件用圆括号分组，可以向 `orWhere` 方法传递一个闭包作为第一个参数：

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

上面的示例将生成如下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> [!WARNING]
> 你应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="where-not-clauses"></a>
### Where Not 子句

`whereNot` 和 `orWhereNot` 方法可用于对给定的一组查询约束取反。例如，以下查询排除清仓处理中或价格低于十元的产品：

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

有时你可能需要对多个字段应用相同的查询约束。例如，你可能想检索给定列表中任一字段 `LIKE` 给定值的所有记录。你可以使用 `whereAny` 方法来实现：

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

上面的查询将生成如下 SQL：

```sql
SELECT *
FROM users
WHERE active = true AND (
    name LIKE 'Example%' OR
    email LIKE 'Example%' OR
    phone LIKE 'Example%'
)
```

类似地，`whereAll` 方法可用于检索所有给定字段都匹配给定约束的记录：

```php
$posts = DB::table('posts')
    ->where('published', true)
    ->whereAll([
        'title',
        'content',
    ], 'like', '%Laravel%')
    ->get();
```

上面的查询将生成如下 SQL：

```sql
SELECT *
FROM posts
WHERE published = true AND (
    title LIKE '%Laravel%' AND
    content LIKE '%Laravel%'
)
```

`whereNone` 方法可用于检索所有给定字段都不匹配给定约束的记录：

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

上面的查询将生成如下 SQL：

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

Laravel 还支持在提供 JSON 字段类型支持的数据库上查询 JSON 字段类型。目前这包括 MariaDB 10.3+、MySQL 8.0+、PostgreSQL 12.0+、SQL Server 2017+ 以及 SQLite 3.39.0+。要查询 JSON 字段，请使用 `->` 操作符：

```php
$users = DB::table('users')
    ->where('preferences->dining->meal', 'salad')
    ->get();

$users = DB::table('users')
    ->whereIn('preferences->dining->meal', ['pasta', 'salad', 'sandwiches'])
    ->get();
```

你可以使用 `whereJsonContains` 和 `whereJsonDoesntContain` 方法来查询 JSON 数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', 'en')
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', 'en')
    ->get();
```

如果你的应用使用 MariaDB、MySQL 或 PostgreSQL 数据库，可以向 `whereJsonContains` 和 `whereJsonDoesntContain` 方法传递一个值数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', ['en', 'de'])
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', ['en', 'de'])
    ->get();
```

此外，你可以使用 `whereJsonContainsKey` 或 `whereJsonDoesntContainKey` 方法来检索包含或不包含某个 JSON 键的结果：

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

`whereLike` 方法允许你向查询添加用于模式匹配的"LIKE"子句。这些方法提供了一种与数据库无关的字符串匹配查询方式，并且可以切换大小写敏感性。默认情况下，字符串匹配不区分大小写：

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

`orWhereLike` 方法允许你添加带 LIKE 条件的"or"子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereLike('name', '%John%')
    ->get();
```

`whereNotLike` 方法允许你向查询添加"NOT LIKE"子句：

```php
$users = DB::table('users')
    ->whereNotLike('name', '%John%')
    ->get();
```

类似地，你可以使用 `orWhereNotLike` 添加带 NOT LIKE 条件的"or"子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereNotLike('name', '%John%')
    ->get();
```

> [!WARNING]
> `whereLike` 的区分大小写搜索选项目前不支持 SQL Server。

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法验证给定字段的值包含在给定数组中：

```php
$users = DB::table('users')
    ->whereIn('id', [1, 2, 3])
    ->get();
```

`whereNotIn` 方法验证给定字段的值不包含在给定数组中：

```php
$users = DB::table('users')
    ->whereNotIn('id', [1, 2, 3])
    ->get();
```

你还可以向 `whereIn` 方法的第二个参数传递一个查询对象：

```php
$activeUsers = DB::table('users')->select('id')->where('is_active', 1);

$comments = DB::table('comments')
    ->whereIn('user_id', $activeUsers)
    ->get();
```

上面的示例将生成如下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> [!WARNING]
> 如果要向查询添加大量整数绑定，可以使用 `whereIntegerInRaw` 或 `whereIntegerNotInRaw` 方法，以大幅减少内存占用。

**whereBetween / orWhereBetween**

`whereBetween` 方法验证字段的值介于两个值之间：

```php
$users = DB::table('users')
    ->whereBetween('votes', [1, 100])
    ->get();
```

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法验证字段的值在两个值之外：

```php
$users = DB::table('users')
    ->whereNotBetween('votes', [1, 100])
    ->get();
```

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法验证字段的值介于同一表行中两个字段的值之间：

```php
$patients = DB::table('patients')
    ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

`whereNotBetweenColumns` 方法验证字段的值在同一个表行中两个字段的值之外：

```php
$patients = DB::table('patients')
    ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

**whereValueBetween / whereValueNotBetween / orWhereValueBetween / orWhereValueNotBetween**

`whereValueBetween` 方法验证给定值介于同一表行中两个同类型字段的值之间：

```php
$products = DB::table('products')
    ->whereValueBetween(100, ['min_price', 'max_price'])
    ->get();
```

`whereValueNotBetween` 方法验证某个值在同一个表行中两个字段的值之外：

```php
$products = DB::table('products')
    ->whereValueNotBetween(100, ['min_price', 'max_price'])
    ->get();
```

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法验证给定字段的值为 `NULL`：

```php
$users = DB::table('users')
    ->whereNull('updated_at')
    ->get();
```

`whereNotNull` 方法验证字段的值不为 `NULL`：

```php
$users = DB::table('users')
    ->whereNotNull('updated_at')
    ->get();
```

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法可用于将字段值与某个日期进行比较：

```php
$users = DB::table('users')
    ->whereDate('created_at', '2016-12-31')
    ->get();
```

`whereMonth` 方法可用于将字段值与某个特定月份进行比较：

```php
$users = DB::table('users')
    ->whereMonth('created_at', '12')
    ->get();
```

`whereDay` 方法可用于将字段值与某个月份的特定日期进行比较：

```php
$users = DB::table('users')
    ->whereDay('created_at', '31')
    ->get();
```

`whereYear` 方法可用于将字段值与某个特定年份进行比较：

```php
$users = DB::table('users')
    ->whereYear('created_at', '2016')
    ->get();
```

`whereTime` 方法可用于将字段值与某个特定时间进行比较：

```php
$users = DB::table('users')
    ->whereTime('created_at', '=', '11:20:45')
    ->get();
```

**wherePast / whereFuture / whereToday / whereBeforeToday / whereAfterToday**

`wherePast` 和 `whereFuture` 方法可用于判断字段的值是否在过去或未来：

```php
$invoices = DB::table('invoices')
    ->wherePast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereFuture('due_at')
    ->get();
```

`whereNowOrPast` 和 `whereNowOrFuture` 方法可用于判断字段的值是否在过去或未来，且包含当前日期和时间：

```php
$invoices = DB::table('invoices')
    ->whereNowOrPast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereNowOrFuture('due_at')
    ->get();
```

`whereToday`、`whereBeforeToday` 和 `whereAfterToday` 方法可分别用于判断字段的值是否为今天、今天之前或今天之后：

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

类似地，`whereTodayOrBefore` 和 `whereTodayOrAfter` 方法可用于判断字段的值是否在今天之前或今天之后，且包含今天的日期：

```php
$invoices = DB::table('invoices')
    ->whereTodayOrBefore('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereTodayOrAfter('due_at')
    ->get();
```

**whereColumn / orWhereColumn**

`whereColumn` 方法可用于验证两个字段相等：

```php
$users = DB::table('users')
    ->whereColumn('first_name', 'last_name')
    ->get();
```

你还可以向 `whereColumn` 方法传递比较操作符：

```php
$users = DB::table('users')
    ->whereColumn('updated_at', '>', 'created_at')
    ->get();
```

你也可以向 `whereColumn` 方法传递一个字段比较数组。这些条件将使用 `and` 操作符连接：

```php
$users = DB::table('users')
    ->whereColumn([
        ['first_name', '=', 'last_name'],
        ['updated_at', '>', 'created_at'],
    ])->get();
```

<a name="logical-grouping"></a>
### 逻辑分组

有时你可能需要将多个"where"子句用圆括号分组，以实现查询所需的逻辑分组。事实上，你通常应始终将 `orWhere` 方法的调用放在圆括号中分组，以避免出现意外的查询行为。为此，你可以向 `where` 方法传递一个闭包：

```php
$users = DB::table('users')
    ->where('name', '=', 'John')
    ->where(function (Builder $query) {
        $query->where('votes', '>', 100)
            ->orWhere('title', '=', 'Admin');
    })
    ->get();
```

如你所见，向 `where` 方法传递闭包会指示查询构造器开始一个约束分组。该闭包会接收一个查询构造器实例，你可以用它来设置应包含在圆括号分组内的约束。上面的示例将生成如下 SQL：

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> [!WARNING]
> 你应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="advanced-where-clauses"></a>
## 高级 Where 子句

<a name="where-exists-clauses"></a>
### Where Exists 子句

`whereExists` 方法允许你编写"where exists"SQL 子句。`whereExists` 方法接受一个闭包，该闭包会接收一个查询构造器实例，让你可以定义应放入"exists"子句中的查询：

```php
$users = DB::table('users')
    ->whereExists(function (Builder $query) {
        $query->select(DB::raw(1))
            ->from('orders')
            ->whereColumn('orders.user_id', 'users.id');
    })
    ->get();
```

或者，你也可以向 `whereExists` 方法提供一个查询对象来代替闭包：

```php
$orders = DB::table('orders')
    ->select(DB::raw(1))
    ->whereColumn('orders.user_id', 'users.id');

$users = DB::table('users')
    ->whereExists($orders)
    ->get();
```

上面的两个示例都将生成如下 SQL：

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

有时你可能需要构建一个将子查询结果与给定值进行比较的"where"子句。为此，你可以向 `where` 方法传递一个闭包和一个值。例如，以下查询将检索所有拥有指定类型最新"会员"资格的用户：

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

或者，你可能需要构建一个将字段与子查询结果进行比较的"where"子句。为此，你可以向 `where` 方法传递一个字段、一个操作符和一个闭包。例如，以下查询将检索所有金额低于平均值的收入记录：

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
> 全文 where 子句目前由 MariaDB、MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于为带有[全文索引](/docs/{{version}}/migrations#available-index-types)的字段向查询添加全文"where"子句。Laravel 会将这些方法转换为底层数据库系统对应的 SQL。例如，对于使用 MariaDB 或 MySQL 的应用，会生成 `MATCH AGAINST` 子句：

```php
$users = DB::table('users')
    ->whereFullText('bio', 'web developer')
    ->get();
```

<a name="vector-similarity-clauses"></a>
### 向量相似度子句

> [!NOTE]
> 向量相似度子句目前仅在 PostgreSQL 连接上受支持，且需要使用 `pgvector` 扩展。有关定义向量字段和索引的信息，请查阅[数据库迁移文档](/docs/{{version}}/migrations#available-column-types)。

`whereVectorSimilarTo` 方法按与给定向量的余弦相似度过滤结果，并按相关性对结果排序。`minSimilarity` 阈值应为 `0.0` 到 `1.0` 之间的值，其中 `1.0` 表示完全相同：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

当传入普通字符串作为向量参数时，Laravel 会使用 [Laravel AI SDK](/docs/{{version}}/ai-sdk#embeddings) 自动为其生成嵌入：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

默认情况下，`whereVectorSimilarTo` 还会按距离对结果排序（最相似的在前）。你可以通过向 `order` 参数传递 `false` 来禁用此排序：

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

使用 PostgreSQL 时，必须先加载 `pgvector` 扩展才能创建 `vector` 字段：

```php
Schema::ensureVectorExtensionExists();
```

<a name="ordering-grouping-limit-and-offset"></a>
## 排序、分组、限制与偏移

<a name="ordering"></a>
### 排序

<a name="orderby"></a>
#### `orderBy` 方法

`orderBy` 方法允许你按给定字段对查询结果进行排序。`orderBy` 方法接受的第一个参数是你希望排序的字段，第二个参数决定排序方向，可以是 `asc` 或 `desc`：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->get();
```

要按多个字段排序，只需按需多次调用 `orderBy` 即可：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->orderBy('email', 'asc')
    ->get();
```

排序方向是可选的，默认为升序。如果想按降序排序，可以为 `orderBy` 方法指定第二个参数，或者直接使用 `orderByDesc`：

```php
$users = DB::table('users')
    ->orderByDesc('verified_at')
    ->get();
```

最后，使用 `->` 操作符，还可以按 JSON 字段内的值对结果进行排序：

```php
$corporations = DB::table('corporations')
    ->where('country', 'US')
    ->orderBy('location->state')
    ->get();
```

<a name="latest-oldest"></a>
#### `latest` 和 `oldest` 方法

`latest` 和 `oldest` 方法让你可以轻松地按日期对结果排序。默认情况下，结果将按表的 `created_at` 字段排序。或者，你也可以传入希望排序的字段名：

```php
$user = DB::table('users')
    ->latest()
    ->first();
```

<a name="random-ordering"></a>
#### 随机排序

`inRandomOrder` 方法可用于对查询结果进行随机排序。例如，你可以使用此方法获取一个随机用户：

```php
$randomUser = DB::table('users')
    ->inRandomOrder()
    ->first();
```

<a name="removing-existing-orderings"></a>
#### 移除现有排序

`reorder` 方法会移除之前应用于查询的所有"order by"子句：

```php
$query = DB::table('users')->orderBy('name');

$unorderedUsers = $query->reorder()->get();
```

调用 `reorder` 方法时可以传入字段和方向，以移除所有现有的"order by"子句，并为查询应用一个全新的排序：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorder('email', 'desc')->get();
```

为了方便，你可以使用 `reorderDesc` 方法按降序重新排序查询结果：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorderDesc('email')->get();
```

<a name="grouping"></a>
### 分组

<a name="groupby-having"></a>
#### `groupBy` 和 `having` 方法

正如你可能预期的，`groupBy` 和 `having` 方法可用于对查询结果进行分组。`having` 方法的方法签名与 `where` 方法类似：

```php
$users = DB::table('users')
    ->groupBy('account_id')
    ->having('account_id', '>', 100)
    ->get();
```

你可以使用 `havingBetween` 方法来过滤给定范围内的结果：

```php
$report = DB::table('orders')
    ->selectRaw('count(id) as number_of_orders, customer_id')
    ->groupBy('customer_id')
    ->havingBetween('number_of_orders', [5, 15])
    ->get();
```

你可以向 `groupBy` 方法传递多个参数，以便按多个字段分组：

```php
$users = DB::table('users')
    ->groupBy('first_name', 'status')
    ->having('account_id', '>', 100)
    ->get();
```

要构建更高级的 `having` 语句，请参见 [havingRaw](#raw-methods) 方法。

<a name="limit-and-offset"></a>
### 限制与偏移

你可以使用 `limit` 和 `offset` 方法来限制查询返回的结果数量，或在查询中跳过指定数量的结果：

```php
$users = DB::table('users')
    ->offset(10)
    ->limit(5)
    ->get();
```

<a name="conditional-clauses"></a>
## 条件子句

有时你可能希望根据另一个条件，让某些查询子句应用于查询。例如，你可能只在传入 HTTP 请求中存在给定输入值时，才应用某个 `where` 语句。你可以使用 `when` 方法来实现：

```php
$role = $request->input('role');

$users = DB::table('users')
    ->when($role, function (Builder $query, string $role) {
        $query->where('role_id', $role);
    })
    ->get();
```

`when` 方法只在第一个参数为 `true` 时执行给定的闭包。如果第一个参数为 `false`，闭包将不会执行。因此，在上面的示例中，只有当传入请求中存在 `role` 字段且其值为 `true` 时，传给 `when` 方法的闭包才会被调用。

你可以向 `when` 方法传递另一个闭包作为第三个参数。该闭包只在第一个参数求值为 `false` 时执行。为了说明此功能的用法，我们将用它来配置查询的默认排序：

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

查询构造器还提供了一个 `insert` 方法，可用于向数据库表中插入记录。`insert` 方法接受一个由字段名和值组成的数组：

```php
DB::table('users')->insert([
    'email' => 'kayla@example.com',
    'votes' => 0
]);
```

你可以通过传递一个数组的数组来一次插入多条记录。每个数组代表一条应插入表中的记录：

```php
DB::table('users')->insert([
    ['email' => 'picard@example.com', 'votes' => 0],
    ['email' => 'janeway@example.com', 'votes' => 0],
]);
```

`insertOrIgnore` 方法会在向数据库插入记录时忽略错误。使用此方法时，你应注意：重复记录的错误会被忽略，并且根据数据库引擎的不同，其他类型的错误也可能被忽略。例如，`insertOrIgnore` 会[绕过 MySQL 的严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

```php
DB::table('users')->insertOrIgnore([
    ['id' => 1, 'email' => 'sisko@example.com'],
    ['id' => 2, 'email' => 'archer@example.com'],
]);
```

`insertUsing` 方法会在向表中插入新记录的同时，使用子查询来确定应插入的数据：

```php
DB::table('pruned_users')->insertUsing([
    'id', 'name', 'email', 'email_verified_at'
], DB::table('users')->select(
    'id', 'name', 'email', 'email_verified_at'
)->where('updated_at', '<=', now()->minus(months: 1)));
```

<a name="auto-incrementing-ids"></a>
#### 自增 ID

如果表带有自增 id，请使用 `insertGetId` 方法来插入记录并获取其 ID：

```php
$id = DB::table('users')->insertGetId(
    ['email' => 'john@example.com', 'votes' => 0]
);
```

> [!WARNING]
> 使用 PostgreSQL 时，`insertGetId` 方法要求自增字段名为 `id`。如果你想从其他"序列"获取 ID，可以将字段名作为 `insertGetId` 方法的第二个参数传入。

<a name="upserts"></a>
### Upsert

`upsert` 方法会插入不存在的记录，并使用你指定的新值更新已存在的记录。该方法的第一个参数是要插入或更新的值，第二个参数列出在相关表中唯一标识记录的字段。该方法的第三个也是最后一个参数是一个字段数组，指定当数据库中已存在匹配记录时应更新哪些字段：

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

在上面的示例中，Laravel 会尝试插入两条记录。如果已存在 `departure` 和 `destination` 字段值相同的记录，Laravel 将更新该记录的 `price` 字段。

> [!WARNING]
> 除 SQL Server 之外的所有数据库都要求 `upsert` 方法第二个参数中的字段具有"primary"或"unique"索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，始终使用表的"primary"和"unique"索引来检测已存在的记录。

<a name="update-statements"></a>
## Update 语句

除了向数据库插入记录外，查询构造器还可以使用 `update` 方法更新现有记录。`update` 方法与 `insert` 方法类似，接受一个由字段和值组成的键值对数组，指示要更新的字段。`update` 方法会返回受影响的行数。你可以使用 `where` 子句来约束 `update` 查询：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['votes' => 1]);
```

<a name="update-or-insert"></a>
#### 更新或插入

有时你可能希望更新数据库中的现有记录，或者在找不到匹配记录时创建它。在这种场景下，可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接受两个参数：用于查找记录的条件数组，以及指示要更新字段的键值对数组。

`updateOrInsert` 方法会尝试使用第一个参数的字段和值对定位匹配的数据库记录。如果记录存在，将使用第二个参数中的值对其进行更新。如果找不到记录，则会使用两个参数合并后的属性插入一条新记录：

```php
DB::table('users')
    ->updateOrInsert(
        ['email' => 'john@example.com', 'name' => 'John'],
        ['votes' => '2']
    );
```

你可以向 `updateOrInsert` 方法提供一个闭包，以便根据是否存在匹配记录，自定义要更新或插入数据库的属性：

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
### 更新 JSON 字段

更新 JSON 字段时，应使用 `->` 语法来更新 JSON 对象中相应的键。此操作在 MariaDB 10.3+、MySQL 5.7+ 和 PostgreSQL 9.5+ 上受支持：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['options->enabled' => true]);
```

<a name="increment-and-decrement"></a>
### 自增与自减

查询构造器还提供了便捷的方法来增加或减少给定字段的值。这两个方法都至少接受一个参数：要修改的字段。可以提供第二个参数来指定字段增加或减少的幅度：

```php
DB::table('users')->increment('votes');

DB::table('users')->increment('votes', 5);

DB::table('users')->decrement('votes');

DB::table('users')->decrement('votes', 5);
```

必要时，你还可以指定在自增或自减操作期间要更新的其他字段：

```php
DB::table('users')->increment('votes', 1, ['name' => 'John']);
```

此外，你可以使用 `incrementEach` 和 `decrementEach` 方法一次自增或自减多个字段：

```php
DB::table('users')->incrementEach([
    'votes' => 5,
    'balance' => 100,
]);
```

<a name="delete-statements"></a>
## Delete 语句

查询构造器的 `delete` 方法可用于从表中删除记录。`delete` 方法会返回受影响的行数。你可以在调用 `delete` 方法之前添加"where"子句来约束 `delete` 语句：

```php
$deleted = DB::table('users')->delete();

$deleted = DB::table('users')->where('votes', '>', 100)->delete();
```

<a name="pessimistic-locking"></a>
## 悲观锁

查询构造器还包含一些函数，帮助你在执行 `select` 语句时实现"悲观锁"（pessimistic locking）。要以"共享锁"执行语句，可以调用 `sharedLock` 方法。共享锁可以防止所选行被修改，直到你的事务提交为止：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->sharedLock()
    ->get();
```

或者，你可以使用 `lockForUpdate` 方法。"for update"锁可以防止所选记录被修改，或者被其他共享锁选中：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->lockForUpdate()
    ->get();
```

虽然不是强制要求，但建议将悲观锁包装在[事务](/docs/{{version}}/database#database-transactions)中。这样可以确保检索到的数据在整个操作完成之前在数据库中保持不变。一旦发生失败，事务会回滚所有更改并自动释放锁：

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
## 可复用查询组件

如果应用中存在重复的查询逻辑，你可以使用查询构造器的 `tap` 和 `pipe` 方法将这些逻辑提取为可复用的对象。假设你的应用中有以下两个不同的查询：

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

你可能希望将这些查询之间共有的目的地过滤逻辑提取到一个可复用的对象中：

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

然后，你可以使用查询构造器的 `tap` 方法将该对象的逻辑应用于查询：

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

`tap` 方法始终会返回查询构造器。如果你想提取一个执行查询并返回其他值的对象，可以改用 `pipe` 方法。

考虑下面这个包含应用中共享的[分页](/docs/{{version}}/pagination)逻辑的查询对象。与向查询应用查询条件的 `DestinationFilter` 不同，`Paginate` 对象会执行查询并返回一个分页器实例：

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

使用查询构造器的 `pipe` 方法，我们可以利用这个对象来应用共享的分页逻辑：

```php
$flights = DB::table('flights')
    ->tap(new DestinationFilter($destination))
    ->pipe(new Paginate);
```

<a name="debugging"></a>
## 调试

你可以在构建查询时使用 `dd` 和 `dump` 方法来输出当前的查询绑定和 SQL。`dd` 方法会显示调试信息并停止执行请求。`dump` 方法会显示调试信息，但允许请求继续执行：

```php
DB::table('users')->where('votes', '>', 100)->dd();

DB::table('users')->where('votes', '>', 100)->dump();
```

可以在查询上调用 `dumpRawSql` 和 `ddRawSql` 方法，输出所有参数绑定均已正确替换后的查询 SQL：

```php
DB::table('users')->where('votes', '>', 100)->dumpRawSql();

DB::table('users')->where('votes', '>', 100)->ddRawSql();
```
