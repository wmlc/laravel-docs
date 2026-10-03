# 数据库：查询构造器

- [简介](#introduction)
- [执行数据库查询](#running-database-queries)
    - [分块处理结果](#chunking-results)
    - [惰性流式读取结果](#streaming-results-lazily)
    - [聚合](#aggregates)
- [Select 语句](#select-statements)
- [原生表达式](#raw-expressions)
- [连接](#joins)
- [联合](#unions)
- [基础 Where 条件](#basic-where-clauses)
    - [Where 条件](#where-clauses)
    - [Or Where 条件](#or-where-clauses)
    - [Where Not 条件](#where-not-clauses)
    - [Where Any / All / None 条件](#where-any-all-none-clauses)
    - [JSON Where 条件](#json-where-clauses)
    - [更多 Where 条件](#additional-where-clauses)
    - [逻辑分组](#logical-grouping)
- [高级 Where 条件](#advanced-where-clauses)
    - [Where Exists 条件](#where-exists-clauses)
    - [子查询 Where 条件](#subquery-where-clauses)
    - [全文 Where 条件](#full-text-where-clauses)
- [排序、分组、限制与偏移](#ordering-grouping-limit-and-offset)
    - [排序](#ordering)
    - [分组](#grouping)
    - [限制与偏移](#limit-and-offset)
- [条件子句](#conditional-clauses)
- [Insert 语句](#insert-statements)
    - [Upsert](#upserts)
- [Update 语句](#update-statements)
    - [更新 JSON 列](#updating-json-columns)
    - [自增与自减](#increment-and-decrement)
- [Delete 语句](#delete-statements)
- [悲观锁](#pessimistic-locking)
- [调试](#debugging)

<a name="introduction"></a>
## 简介

Laravel 的数据库查询构造器提供了一套便捷、流畅的接口，用于创建并执行数据库查询。它可以完成应用中的大多数数据库操作，并且与 Laravel 支持的所有数据库系统完美配合。

Laravel 的查询构造器使用 PDO 参数绑定来保护应用免受 SQL 注入攻击。传给查询构造器作为查询绑定的字符串无需清理或净化。

> [!WARNING]
> PDO 不支持绑定列名。因此，你绝不能让用户输入决定查询所引用的列名，包括「order by」列。

<a name="running-database-queries"></a>
## 执行数据库查询

<a name="retrieving-all-rows-from-a-table"></a>
#### 获取表中的所有行

你可以使用 `DB` Facade 提供的 `table` 方法来开始一次查询。`table` 方法为给定表返回一个流畅的查询构造器实例，让你可以在查询上继续链式添加更多约束，最后用 `get` 方法获取查询结果：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Support\Facades\DB;
    use Illuminate\View\View;

    class UserController extends Controller
    {
        /**
         * 展示应用中所有用户的列表。
         */
        public function index(): View
        {
            $users = DB::table('users')->get();

            return view('user.index', ['users' => $users]);
        }
    }

`get` 方法返回一个 `Illuminate\Support\Collection` 实例，其中包含查询结果，每条结果都是 PHP `stdClass` 对象的一个实例。你可以把列作为对象的属性来访问每一列的值：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')->get();

    foreach ($users as $user) {
        echo $user->name;
    }

> [!NOTE]
> Laravel 的集合提供了大量极其强大的映射和归约数据的方法。关于 Laravel 集合的更多信息，请查看[集合文档](/docs/{{version}}/collections)。

<a name="retrieving-a-single-row-column-from-a-table"></a>
#### 获取表中的一行／一列

如果你只需要从数据库表中取出一行，可以使用 `DB` Facade 的 `first` 方法。该方法会返回一个 `stdClass` 对象：

    $user = DB::table('users')->where('name', 'John')->first();

    return $user->email;

如果你希望从数据库表中取出一行，但在没有找到匹配行时抛出 `Illuminate\Database\RecordNotFoundException`，可以使用 `firstOrFail` 方法。如果该 `RecordNotFoundException` 未被捕获，系统会自动向客户端返回 404 HTTP 响应：

    $user = DB::table('users')->where('name', 'John')->firstOrFail();

如果你不需要整行数据，可以使用 `value` 方法从记录中提取单个值。该方法会直接返回该列的值：

    $email = DB::table('users')->where('name', 'John')->value('email');

要通过 `id` 列的值取出一行，请使用 `find` 方法：

    $user = DB::table('users')->find(3);

<a name="retrieving-a-list-of-column-values"></a>
#### 获取一组列值

如果你想获取一个包含单列值的 `Illuminate\Support\Collection` 实例，可以使用 `pluck` 方法。在这个示例中，我们会获取一组用户称号：

    use Illuminate\Support\Facades\DB;

    $titles = DB::table('users')->pluck('title');

    foreach ($titles as $title) {
        echo $title;
    }

你可以通过向 `pluck` 方法提供第二个参数，指定生成的集合应当使用哪一列作为键：

    $titles = DB::table('users')->pluck('title', 'name');

    foreach ($titles as $name => $title) {
        echo $title;
    }

<a name="chunking-results"></a>
### 分块处理结果

如果你需要处理数千条数据库记录，可以考虑使用 `DB` Facade 提供的 `chunk` 方法。该方法每次取出一小批结果，并把每一批送入闭包中处理。例如，我们以每次 100 条记录为一批获取整个 `users` 表：

    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\DB;

    DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
        foreach ($users as $user) {
            // ...
        }
    });

你可以从闭包中返回 `false`，以阻止后续批次被处理：

    DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
        // 处理记录...

        return false;
    });

如果你在分块处理结果的同时更新数据库记录，分块结果可能会以出人意料的方式发生变化。如果你打算在分块时更新取回的记录，最好始终使用 `chunkById` 方法。该方法会根据记录的主键自动对结果分页：

    DB::table('users')->where('active', false)
        ->chunkById(100, function (Collection $users) {
            foreach ($users as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['active' => true]);
            }
        });

由于 `chunkById` 和 `lazyById` 方法会向所执行的查询添加各自的「where」条件，你通常应当把自己的条件[放在闭包中做逻辑分组](#logical-grouping)：

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
> 在分块回调中更新或删除记录时，对主键或外键的任何改动都可能影响分块查询。这可能导致某些记录不被包含进分块结果中。

<a name="streaming-results-lazily"></a>
### 惰性流式读取结果

`lazy` 方法与 [`chunk` 方法](#chunking-results)类似，都是以分块方式执行查询。不过，`lazy()` 方法并不会把每一批送入回调，而是返回一个 [`LazyCollection`](/docs/{{version}}/collections#lazy-collections)，让你可以把结果当作一个数据流来处理：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function (object $user) {
    // ...
});
```

再次强调，如果你打算在遍历取回的记录时更新它们，最好使用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法会根据记录的主键自动对结果分页：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function (object $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> [!WARNING]
> 在遍历记录时更新或删除记录，对主键或外键的任何改动都可能影响分块查询。这可能导致某些记录不被包含进结果中。

<a name="aggregates"></a>
### 聚合

查询构造器还提供了多种用于获取 `count`、`max`、`min`、`avg` 和 `sum` 等聚合值的方法。你可以在构建好查询之后调用其中任意一个：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')->count();

    $price = DB::table('orders')->max('price');

当然，你可以把这些方法与其它子句组合，以精确调整聚合值的计算方式：

    $price = DB::table('orders')
        ->where('finalized', 1)
        ->avg('price');

<a name="determining-if-records-exist"></a>
#### 判断记录是否存在

如果不想用 `count` 方法来判断是否存在匹配查询约束的记录，可以使用 `exists` 和 `doesntExist` 方法：

    if (DB::table('orders')->where('finalized', 1)->exists()) {
        // ...
    }

    if (DB::table('orders')->where('finalized', 1)->doesntExist()) {
        // ...
    }

<a name="select-statements"></a>
## Select 语句

<a name="specifying-a-select-clause"></a>
#### 指定 Select 子句

你不一定总是想选取数据库表中的所有列。使用 `select` 方法，你可以为查询指定自定义的「select」子句：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')
        ->select('name', 'email as user_email')
        ->get();

`distinct` 方法允许你强制查询返回去重后的结果：

    $users = DB::table('users')->distinct()->get();

如果你已经有一个查询构造器实例，并希望向其已有的 select 子句添加一列，可以使用 `addSelect` 方法：

    $query = DB::table('users')->select('name');

    $users = $query->addSelect('age')->get();

<a name="raw-expressions"></a>
## 原生表达式

有时你可能需要把任意字符串插入查询中。要创建原生字符串表达式，可以使用 `DB` Facade 提供的 `raw` 方法：

    $users = DB::table('users')
        ->select(DB::raw('count(*) as user_count, status'))
        ->where('status', '<>', 1)
        ->groupBy('status')
        ->get();

> [!WARNING]
> 原生语句会以字符串形式注入查询，因此你必须极其谨慎，避免造成 SQL 注入漏洞。

<a name="raw-methods"></a>
### 原生方法

除了使用 `DB::raw` 方法，你还可以使用以下方法把原生表达式插入查询的各个部分。**请记住，Laravel 无法保证使用原生表达式的任何查询都免受 SQL 注入漏洞的影响。**

<a name="selectraw"></a>
#### `selectRaw`

`selectRaw` 方法可用于替代 `addSelect(DB::raw(/* ... */))`。该方法的第二个参数接受一个可选的绑定数组：

    $orders = DB::table('orders')
        ->selectRaw('price * ? as price_with_tax', [1.0825])
        ->get();

<a name="whereraw-orwhereraw"></a>
#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可用于把原生的「where」子句注入查询。这些方法的第二个参数接受一个可选的绑定数组：

    $orders = DB::table('orders')
        ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
        ->get();

<a name="havingraw-orhavingraw"></a>
#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可用于为「having」子句提供原生字符串值。这些方法的第二个参数接受一个可选的绑定数组：

    $orders = DB::table('orders')
        ->select('department', DB::raw('SUM(price) as total_sales'))
        ->groupBy('department')
        ->havingRaw('SUM(price) > ?', [2500])
        ->get();

<a name="orderbyraw"></a>
#### `orderByRaw`

`orderByRaw` 方法可用于为「order by」子句提供原生字符串值：

    $orders = DB::table('orders')
        ->orderByRaw('updated_at - created_at DESC')
        ->get();

<a name="groupbyraw"></a>
### `groupByRaw`

`groupByRaw` 方法可用于为「group by」子句提供原生字符串值：

    $orders = DB::table('orders')
        ->select('city', 'state')
        ->groupByRaw('city, state')
        ->get();

<a name="joins"></a>
## 连接

<a name="inner-join-clause"></a>
#### 内连接子句

查询构造器也可以用来为查询添加连接子句。要执行基本的「内连接」，可以在查询构造器实例上使用 `join` 方法。传给 `join` 方法的第一个参数是你要连接到的表名，其余参数则指定该连接的列约束。你甚至可以在单次查询中连接多张表：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')
        ->join('contacts', 'users.id', '=', 'contacts.user_id')
        ->join('orders', 'users.id', '=', 'orders.user_id')
        ->select('users.*', 'contacts.phone', 'orders.price')
        ->get();

<a name="left-join-right-join-clause"></a>
#### 左连接／右连接子句

如果你想执行「左连接」或「右连接」而不是「内连接」，请使用 `leftJoin` 或 `rightJoin` 方法。这些方法与 `join` 方法的签名相同：

    $users = DB::table('users')
        ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
        ->get();

    $users = DB::table('users')
        ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
        ->get();

<a name="cross-join-clause"></a>
#### 交叉连接子句

你可以使用 `crossJoin` 方法执行「交叉连接」。交叉连接会生成第一张表与被连接表之间的笛卡尔积：

    $sizes = DB::table('sizes')
        ->crossJoin('colors')
        ->get();

<a name="advanced-join-clauses"></a>
#### 高级连接子句

你还可以指定更高级的连接子句。要开始使用，请把一个闭包作为 `join` 方法的第二个参数传入。该闭包会接收到一个 `Illuminate\Database\Query\JoinClause` 实例，让你可以在「join」子句上指定约束：

    DB::table('users')
        ->join('contacts', function (JoinClause $join) {
            $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
        })
        ->get();

如果你想在连接上使用「where」子句，可以使用 `JoinClause` 实例提供的 `where` 和 `orWhere` 方法。这些方法会把该列与一个值进行比较，而不是比较两列：

    DB::table('users')
        ->join('contacts', function (JoinClause $join) {
            $join->on('users.id', '=', 'contacts.user_id')
                ->where('contacts.user_id', '>', 5);
        })
        ->get();

<a name="subquery-joins"></a>
#### 子查询连接

你可以使用 `joinSub`、`leftJoinSub` 和 `rightJoinSub` 方法把查询连接到子查询。每个方法接收三个参数：子查询、它的表别名，以及一个定义关联列的闭包。在这个示例中，我们会获取一组用户，其中每条用户记录还包含该用户最近发布的博客文章的 `created_at` 时间戳：

    $latestPosts = DB::table('posts')
        ->select('user_id', DB::raw('MAX(created_at) as last_post_created_at'))
        ->where('is_published', true)
        ->groupBy('user_id');

    $users = DB::table('users')
        ->joinSub($latestPosts, 'latest_posts', function (JoinClause $join) {
            $join->on('users.id', '=', 'latest_posts.user_id');
        })->get();

<a name="lateral-joins"></a>
#### 横向连接

> [!WARNING]
> 横向连接目前受 PostgreSQL、MySQL >= 8.0.14 和 SQL Server 支持。

你可以使用 `joinLateral` 和 `leftJoinLateral` 方法与子查询执行「横向连接」。每个方法接收两个参数：子查询和它的表别名。连接条件应在给定子查询的 `where` 子句中指定。横向连接会针对每一行求值，并且可以引用子查询之外的列。

在这个示例中，我们会获取一组用户以及每个用户最近的三篇博客文章。每个用户在结果集中最多产生三行：每篇最近博客文章一行。连接条件通过子查询内的 `whereColumn` 子句指定，并引用当前用户行：

    $latestPosts = DB::table('posts')
        ->select('id as post_id', 'title as post_title', 'created_at as post_created_at')
        ->whereColumn('user_id', 'users.id')
        ->orderBy('created_at', 'desc')
        ->limit(3);

    $users = DB::table('users')
        ->joinLateral($latestPosts, 'latest_posts')
        ->get();

<a name="unions"></a>
## 联合

查询构造器还提供了一个便捷的方法，把两个或多个查询「联合」起来。例如，你可以创建一个初始查询，然后用 `union` 方法把它与更多查询联合起来：

    use Illuminate\Support\Facades\DB;

    $first = DB::table('users')
        ->whereNull('first_name');

    $users = DB::table('users')
        ->whereNull('last_name')
        ->union($first)
        ->get();

除了 `union` 方法，查询构造器还提供了 `unionAll` 方法。使用 `unionAll` 方法组合的查询不会去除重复结果。`unionAll` 方法与 `union` 方法的签名相同。

<a name="basic-where-clauses"></a>
## 基础 Where 条件

<a name="where-clauses"></a>
### Where 条件

你可以使用查询构造器的 `where` 方法为查询添加「where」子句。对 `where` 方法最简单的调用需要三个参数。第一个参数是列名。第二个参数是运算符，可以是数据库支持的任意运算符。第三个参数是要与该列的值进行比较的值。

例如，以下查询会检索 `votes` 列的值等于 `100` 且 `age` 列的值大于 `35` 的用户：

    $users = DB::table('users')
        ->where('votes', '=', 100)
        ->where('age', '>', 35)
        ->get();

为方便起见，如果你想验证某列等于给定值，可以把该值作为 `where` 方法的第二个参数传入。Laravel 会假定你希望使用 `=` 运算符：

    $users = DB::table('users')->where('votes', 100)->get();

如前所述，你可以使用数据库系统支持的任意运算符：

    $users = DB::table('users')
        ->where('votes', '>=', 100)
        ->get();

    $users = DB::table('users')
        ->where('votes', '<>', 100)
        ->get();

    $users = DB::table('users')
        ->where('name', 'like', 'T%')
        ->get();

你也可以把一组条件作为数组传给 `where` 函数。数组中的每个元素都应当是一个数组，包含通常传给 `where` 方法的三个参数：

    $users = DB::table('users')->where([
        ['status', '=', '1'],
        ['subscribed', '<>', '1'],
    ])->get();

> [!WARNING]
> PDO 不支持绑定列名。因此，你绝不能让用户输入决定查询所引用的列名，包括「order by」列。

> [!WARNING]
> MySQL 和 MariaDB 在字符串与数字比较中会自动把字符串转换为整数。在此过程中，非数字字符串会被转换为 `0`，可能导致出人意料的结果。例如，如果你的表中有一个值为 `aaa` 的 `secret` 列，而你运行 `User::where('secret', 0)`，那一行会被返回。为避免这种情况，请确保所有值在使用前都被转换为相应的类型。

<a name="or-where-clauses"></a>
### Or Where 条件

在链式调用查询构造器的 `where` 方法时，各个「where」子句会通过 `and` 运算符连接起来。不过，你可以使用 `orWhere` 方法用 `or` 运算符把某个子句连接到查询上。`orWhere` 方法接受的参数与 `where` 方法相同：

    $users = DB::table('users')
        ->where('votes', '>', 100)
        ->orWhere('name', 'John')
        ->get();

如果你需要把某个「or」条件放在括号内分组，可以把一个闭包作为 `orWhere` 方法的第一个参数传入：

    $users = DB::table('users')
        ->where('votes', '>', 100)
        ->orWhere(function (Builder $query) {
            $query->where('name', 'Abigail')
                ->where('votes', '>', 50);
            })
        ->get();

上面的示例会生成如下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> [!WARNING]
> 你应当始终对 `orWhere` 调用进行分组，以避免应用全局作用域时出现意外行为。

<a name="where-not-clauses"></a>
### Where Not 条件

`whereNot` 和 `orWhereNot` 方法可用于对一组查询约束取反。例如，以下查询会排除正在清仓或价格低于十元的商品：

    $products = DB::table('products')
        ->whereNot(function (Builder $query) {
            $query->where('clearance', true)
                ->orWhere('price', '<', 10);
            })
        ->get();

<a name="where-any-all-none-clauses"></a>
### Where Any / All / None 条件

有时你可能需要把相同的查询约束应用到多个列上。例如，你可能想检索所有记录中给定列表里的任意列 `LIKE` 某个值的记录。可以使用 `whereAny` 方法实现：

    $users = DB::table('users')
        ->where('active', true)
        ->whereAny([
            'name',
            'email',
            'phone',
        ], 'like', 'Example%')
        ->get();

上面的查询会生成如下 SQL：

```sql
SELECT *
FROM users
WHERE active = true AND (
    name LIKE 'Example%' OR
    email LIKE 'Example%' OR
    phone LIKE 'Example%'
)
```

类似地，`whereAll` 方法可用于检索所有给定列都匹配某个约束的记录：

    $posts = DB::table('posts')
        ->where('published', true)
        ->whereAll([
            'title',
            'content',
        ], 'like', '%Laravel%')
        ->get();

上面的查询会生成如下 SQL：

```sql
SELECT *
FROM posts
WHERE published = true AND (
    title LIKE '%Laravel%' AND
    content LIKE '%Laravel%'
)
```

`whereNone` 方法可用于检索所有给定列都不匹配某个约束的记录：

    $posts = DB::table('albums')
        ->where('published', true)
        ->whereNone([
            'title',
            'lyrics',
            'tags',
        ], 'like', '%explicit%')
        ->get();

上面的查询会生成如下 SQL：

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
### JSON Where 条件

Laravel 还支持在提供 JSON 列类型支持的数据库上查询 JSON 列类型。目前这包括 MariaDB 10.3+、MySQL 8.0+、PostgreSQL 12.0+、SQL Server 2017+ 和 SQLite 3.39.0+。要查询 JSON 列，请使用 `->` 运算符：

    $users = DB::table('users')
        ->where('preferences->dining->meal', 'salad')
        ->get();

你可以使用 `whereJsonContains` 查询 JSON 数组：

    $users = DB::table('users')
        ->whereJsonContains('options->languages', 'en')
        ->get();

如果你的应用使用 MariaDB、MySQL 或 PostgreSQL 数据库，可以把一组值传给 `whereJsonContains` 方法：

    $users = DB::table('users')
        ->whereJsonContains('options->languages', ['en', 'de'])
        ->get();

你可以使用 `whereJsonLength` 方法按长度查询 JSON 数组：

    $users = DB::table('users')
        ->whereJsonLength('options->languages', 0)
        ->get();

    $users = DB::table('users')
        ->whereJsonLength('options->languages', '>', 1)
        ->get();

<a name="additional-where-clauses"></a>
### 更多 Where 条件

**whereLike / orWhereLike / whereNotLike / orWhereNotLike**

`whereLike` 方法允许你为查询添加「LIKE」子句以进行模式匹配。这些方法提供了一种与数据库无关的字符串匹配查询方式，并能切换大小写敏感性。默认情况下，字符串匹配不区分大小写：

    $users = DB::table('users')
        ->whereLike('name', '%John%')
        ->get();

你可以通过 `caseSensitive` 参数启用区分大小写的搜索：

    $users = DB::table('users')
        ->whereLike('name', '%John%', caseSensitive: true)
        ->get();

`orWhereLike` 方法允许你添加一个带 LIKE 条件的「or」子句：

    $users = DB::table('users')
        ->where('votes', '>', 100)
        ->orWhereLike('name', '%John%')
        ->get();

`whereNotLike` 方法允许你为查询添加「NOT LIKE」子句：

    $users = DB::table('users')
        ->whereNotLike('name', '%John%')
        ->get();

类似地，你可以使用 `orWhereNotLike` 添加一个带 NOT LIKE 条件的「or」子句：

    $users = DB::table('users')
        ->where('votes', '>', 100)
        ->orWhereNotLike('name', '%John%')
        ->get();

> [!WARNING]
> `whereLike` 的区分大小写搜索选项目前在 SQL Server 上不受支持。

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法用于验证给定列的值是否包含在给定数组中：

    $users = DB::table('users')
        ->whereIn('id', [1, 2, 3])
        ->get();

`whereNotIn` 方法用于验证给定列的值不包含在给定数组中：

    $users = DB::table('users')
        ->whereNotIn('id', [1, 2, 3])
        ->get();

你也可以把一个查询对象作为 `whereIn` 方法的第二个参数：

    $activeUsers = DB::table('users')->select('id')->where('is_active', 1);

    $users = DB::table('comments')
        ->whereIn('user_id', $activeUsers)
        ->get();

上面的示例会生成如下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> [!WARNING]
> 如果你要向查询添加大量整数绑定，可以使用 `whereIntegerInRaw` 或 `whereIntegerNotInRaw` 方法大幅降低内存占用。

**whereBetween / orWhereBetween**

`whereBetween` 方法用于验证某列的值介于两个值之间：

    $users = DB::table('users')
        ->whereBetween('votes', [1, 100])
        ->get();

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法用于验证某列的值位于两个值之外：

    $users = DB::table('users')
        ->whereNotBetween('votes', [1, 100])
        ->get();

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法用于验证某列的值介于同一表行中两列的两个值之间：

    $patients = DB::table('patients')
        ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
        ->get();

`whereNotBetweenColumns` 方法用于验证某列的值位于同一表行中两列的两个值之外：

    $patients = DB::table('patients')
        ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
        ->get();

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法用于验证给定列的值为 `NULL`：

    $users = DB::table('users')
        ->whereNull('updated_at')
        ->get();

`whereNotNull` 方法用于验证该列的值不为 `NULL`：

    $users = DB::table('users')
        ->whereNotNull('updated_at')
        ->get();

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法可用于把某列的值与一个日期进行比较：

    $users = DB::table('users')
        ->whereDate('created_at', '2016-12-31')
        ->get();

`whereMonth` 方法可用于把某列的值与特定月份进行比较：

    $users = DB::table('users')
        ->whereMonth('created_at', '12')
        ->get();

`whereDay` 方法可用于把某列的值与特定日进行比较：

    $users = DB::table('users')
        ->whereDay('created_at', '31')
        ->get();

`whereYear` 方法可用于把某列的值与特定年份进行比较：

    $users = DB::table('users')
        ->whereYear('created_at', '2016')
        ->get();

`whereTime` 方法可用于把某列的值与特定时间进行比较：

    $users = DB::table('users')
        ->whereTime('created_at', '=', '11:20:45')
        ->get();

**wherePast / whereFuture / whereToday / whereBeforeToday / whereAfterToday**

`wherePast` 和 `whereFuture` 方法可用于判断某列的值是在过去还是在未来：

    $invoices = DB::table('invoices')
        ->wherePast('due_at')
        ->get();

    $invoices = DB::table('invoices')
        ->whereFuture('due_at')
        ->get();

`whereNowOrPast` 和 `whereNowOrFuture` 方法可用于判断某列的值是在过去还是在未来，并包含当前日期和时间：

    $invoices = DB::table('invoices')
        ->whereNowOrPast('due_at')
        ->get();

    $invoices = DB::table('invoices')
        ->whereNowOrFuture('due_at')
        ->get();

`whereToday`、`whereBeforeToday` 和 `whereAfterToday` 方法可用于分别判断某列的值是今天、今天之前还是今天之后：

    $invoices = DB::table('invoices')
        ->whereToday('due_at')
        ->get();

    $invoices = DB::table('invoices')
        ->whereBeforeToday('due_at')
        ->get();

    $invoices = DB::table('invoices')
        ->whereAfterToday('due_at')
        ->get();

类似地，`whereTodayOrBefore` 和 `whereTodayOrAfter` 方法可用于判断某列的值是今天之前还是今天之后，并包含今天的日期：

    $invoices = DB::table('invoices')
        ->whereTodayOrBefore('due_at')
        ->get();

    $invoices = DB::table('invoices')
        ->whereTodayOrAfter('due_at')
        ->get();

**whereColumn / orWhereColumn**

`whereColumn` 方法可用于验证两列相等：

    $users = DB::table('users')
        ->whereColumn('first_name', 'last_name')
        ->get();

你也可以向 `whereColumn` 方法传入一个比较运算符：

    $users = DB::table('users')
        ->whereColumn('updated_at', '>', 'created_at')
        ->get();

你也可以把一组列比较传给 `whereColumn` 方法。这些条件会通过 `and` 运算符连接：

    $users = DB::table('users')
        ->whereColumn([
            ['first_name', '=', 'last_name'],
            ['updated_at', '>', 'created_at'],
        ])->get();

<a name="logical-grouping"></a>
### 逻辑分组

有时你可能需要把若干「where」子句放在括号内分组，以实现查询所需的逻辑分组。事实上，为避免意外的查询行为，你通常应当始终把对 `orWhere` 方法的调用放在括号内分组。为此，你可以向 `where` 方法传入一个闭包：

    $users = DB::table('users')
        ->where('name', '=', 'John')
        ->where(function (Builder $query) {
            $query->where('votes', '>', 100)
                ->orWhere('title', '=', 'Admin');
        })
        ->get();

如你所见，向 `where` 方法传入闭包会指示查询构造器开始一个约束分组。该闭包会接收到一个查询构造器实例，你可以用它来设置应当包含在该括号组内的约束。上面的示例会生成如下 SQL：

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> [!WARNING]
> 你应当始终对 `orWhere` 调用进行分组，以避免应用全局作用域时出现意外行为。

<a name="advanced-where-clauses"></a>
## 高级 Where 条件

<a name="where-exists-clauses"></a>
### Where Exists 条件

`whereExists` 方法允许你编写「where exists」SQL 子句。`whereExists` 方法接受一个闭包，该闭包会接收到一个查询构造器实例，让你定义应当放在「exists」子句内的查询：

    $users = DB::table('users')
        ->whereExists(function (Builder $query) {
            $query->select(DB::raw(1))
                ->from('orders')
                ->whereColumn('orders.user_id', 'users.id');
        })
        ->get();

此外，你也可以把一个查询对象而非闭包传给 `whereExists` 方法：

    $orders = DB::table('orders')
        ->select(DB::raw(1))
        ->whereColumn('orders.user_id', 'users.id');

    $users = DB::table('users')
        ->whereExists($orders)
        ->get();

上面两个示例都会生成如下 SQL：

```sql
select * from users
where exists (
    select 1
    from orders
    where orders.user_id = users.id
)
```

<a name="subquery-where-clauses"></a>
### 子查询 Where 条件

有时你可能需要构建一个把子查询结果与给定值进行比较的「where」子句。为此，可以向 `where` 方法传入一个闭包和一个值。例如，以下查询会检索所有拥有特定类型「membership」记录的用户：

    use App\Models\User;
    use Illuminate\Database\Query\Builder;

    $users = User::where(function (Builder $query) {
        $query->select('type')
            ->from('membership')
            ->whereColumn('membership.user_id', 'users.id')
            ->orderByDesc('membership.start_date')
            ->limit(1);
    }, 'Pro')->get();

或者，你可能需要构建一个把某列与子查询结果进行比较的「where」子句。为此，可以向 `where` 方法传入一个列、一个运算符和一个闭包。例如，以下查询会检索所有金额低于平均值的收入记录：

    use App\Models\Income;
    use Illuminate\Database\Query\Builder;

    $incomes = Income::where('amount', '<', function (Builder $query) {
        $query->selectRaw('avg(i.amount)')->from('incomes as i');
    })->get();

<a name="full-text-where-clauses"></a>
### 全文 Where 条件

> [!WARNING]
> 全文 where 条件目前受 MariaDB、MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于为具有[全文索引](/docs/{{version}}/migrations#available-index-types)的列向查询添加全文「where」子句。Laravel 会把这些方法转换为底层数据库系统对应的适当 SQL。例如，使用 MariaDB 或 MySQL 的应用会生成 `MATCH AGAINST` 子句：

    $users = DB::table('users')
        ->whereFullText('bio', 'web developer')
        ->get();

<a name="ordering-grouping-limit-and-offset"></a>
## 排序、分组、限制与偏移

<a name="ordering"></a>
### 排序

<a name="orderby"></a>
#### `orderBy` 方法

`orderBy` 方法允许你按给定列对查询结果排序。`orderBy` 方法接受的第一个参数应当是你希望按其排序的列，第二个参数决定排序方向，可以是 `asc` 或 `desc`：

    $users = DB::table('users')
        ->orderBy('name', 'desc')
        ->get();

要按多列排序，只需按需多次调用 `orderBy`：

    $users = DB::table('users')
        ->orderBy('name', 'desc')
        ->orderBy('email', 'asc')
        ->get();

<a name="latest-oldest"></a>
#### `latest` 与 `oldest` 方法

`latest` 和 `oldest` 方法允许你轻松地按日期对结果排序。默认情况下，结果会按表的 `created_at` 列排序。你也可以传入希望按其排序的列名：

    $user = DB::table('users')
        ->latest()
        ->first();

<a name="random-ordering"></a>
#### 随机排序

`inRandomOrder` 方法可用于随机排序查询结果。例如，你可以用该方法获取一个随机用户：

    $randomUser = DB::table('users')
        ->inRandomOrder()
        ->first();

<a name="removing-existing-orderings"></a>
#### 移除已有排序

`reorder` 方法会移除此前已应用到查询上的所有「order by」子句：

    $query = DB::table('users')->orderBy('name');

    $unorderedUsers = $query->reorder()->get();

你可以在调用 `reorder` 方法时传入列和方向，以便移除所有已有的「order by」子句并为查询应用一个全新的排序：

    $query = DB::table('users')->orderBy('name');

    $usersOrderedByEmail = $query->reorder('email', 'desc')->get();

<a name="grouping"></a>
### 分组

<a name="groupby-having"></a>
#### `groupBy` 与 `having` 方法

如你所料，`groupBy` 和 `having` 方法可用于对查询结果进行分组。`having` 方法的签名与 `where` 方法类似：

    $users = DB::table('users')
        ->groupBy('account_id')
        ->having('account_id', '>', 100)
        ->get();

你可以使用 `havingBetween` 方法筛选给定范围内的结果：

    $report = DB::table('orders')
        ->selectRaw('count(id) as number_of_orders, customer_id')
        ->groupBy('customer_id')
        ->havingBetween('number_of_orders', [5, 15])
        ->get();

你可以向 `groupBy` 方法传入多个参数，以按多列分组：

    $users = DB::table('users')
        ->groupBy('first_name', 'status')
        ->having('account_id', '>', 100)
        ->get();

要构建更高级的 `having` 语句，请参阅 [`havingRaw`](#raw-methods) 方法。

<a name="limit-and-offset"></a>
### 限制与偏移

<a name="skip-take"></a>
#### `skip` 与 `take` 方法

你可以使用 `skip` 和 `take` 方法限制查询返回的结果数量，或跳过查询中的给定数量的结果：

    $users = DB::table('users')->skip(10)->take(5)->get();

此外，你也可以使用 `limit` 和 `offset` 方法。这两个方法在功能上分别等价于 `take` 和 `skip` 方法：

    $users = DB::table('users')
        ->offset(10)
        ->limit(5)
        ->get();

<a name="conditional-clauses"></a>
## 条件子句

有时你可能希望根据另一个条件决定某些查询子句是否生效。例如，你可能只想在传入的 HTTP 请求中存在某个给定输入值时才应用 `where` 语句。可以使用 `when` 方法实现：

    $role = $request->input('role');

    $users = DB::table('users')
        ->when($role, function (Builder $query, string $role) {
            $query->where('role_id', $role);
        })
        ->get();

只有当第一个参数为 `true` 时，`when` 方法才会执行给定闭包。如果第一个参数为 `false`，该闭包不会被执行。因此，在上面的示例中，传给 `when` 方法的闭包只有在传入请求中存在 `role` 字段且其值为 `true` 时才会被调用。

你可以把另一个闭包作为 `when` 方法的第三个参数传入。只有当第一个参数求值为 `false` 时，该闭包才会执行。为了说明这一特性如何使用，我们将用它来配置查询的默认排序：

    $sortByVotes = $request->boolean('sort_by_votes');

    $users = DB::table('users')
        ->when($sortByVotes, function (Builder $query, bool $sortByVotes) {
            $query->orderBy('votes');
        }, function (Builder $query) {
            $query->orderBy('name');
        })
        ->get();

<a name="insert-statements"></a>
## Insert 语句

查询构造器还提供了 `insert` 方法，可用于把记录插入数据库表。`insert` 方法接受一组列名和值的数组：

    DB::table('users')->insert([
        'email' => 'kayla@example.com',
        'votes' => 0
    ]);

你可以传入一组数组，从而一次插入多条记录。每个数组代表一条应当插入表中的记录：

    DB::table('users')->insert([
        ['email' => 'picard@example.com', 'votes' => 0],
        ['email' => 'janeway@example.com', 'votes' => 0],
    ]);

`insertOrIgnore` 方法会在把记录插入数据库时忽略错误。使用该方法时，你要注意重复记录错误会被忽略，其他类型的错误也可能因数据库引擎而异被忽略。例如，`insertOrIgnore` 会[绕过 MySQL 严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

    DB::table('users')->insertOrIgnore([
        ['id' => 1, 'email' => 'sisko@example.com'],
        ['id' => 2, 'email' => 'archer@example.com'],
    ]);

`insertUsing` 方法会在把新记录插入表的同时，使用子查询来确定应当插入的数据：

    DB::table('pruned_users')->insertUsing([
        'id', 'name', 'email', 'email_verified_at'
    ], DB::table('users')->select(
        'id', 'name', 'email', 'email_verified_at'
    )->where('updated_at', '<=', now()->subMonth()));

<a name="auto-incrementing-ids"></a>
#### 自增 ID

如果表带有自增 id，请使用 `insertGetId` 方法插入记录，然后获取该 ID：

    $id = DB::table('users')->insertGetId(
        ['email' => 'john@example.com', 'votes' => 0]
    );

> [!WARNING]
> 使用 PostgreSQL 时，`insertGetId` 方法要求自增列命名为 `id`。如果你希望从另一个「序列」获取 ID，可以把列名作为 `insertGetId` 方法的第二个参数传入。

<a name="upserts"></a>
### Upsert

`upsert` 方法会插入不存在的记录，并把你指定的新值更新到已存在的记录上。该方法的第一个参数由要插入或更新的值组成，第二个参数列出在相关表中唯一标识记录的列。该方法的第三个也是最后一个参数是一个列数组，用于在数据库中已存在匹配记录时更新这些列：

    DB::table('flights')->upsert(
        [
            ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
            ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
        ],
        ['departure', 'destination'],
        ['price']
    );

在上例中，Laravel 会尝试插入两条记录。如果某条记录已存在且 `departure` 与 `destination` 列值相同，Laravel 会更新该记录的 `price` 列。

> [!WARNING]
> 除 SQL Server 外，所有数据库都要求 `upsert` 方法第二个参数中的列带有「主」索引或「唯一」索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，始终使用表的「主」索引和「唯一」索引来检测已存在的记录。

<a name="update-statements"></a>
## Update 语句

除了把记录插入数据库，查询构造器还可以使用 `update` 方法更新已有记录。`update` 方法与 `insert` 方法一样，接受一组列和值对组成的数组，指示要更新的列。`update` 方法返回受影响的行数。你可以使用 `where` 子句来约束 `update` 查询：

    $affected = DB::table('users')
        ->where('id', 1)
        ->update(['votes' => 1]);

<a name="update-or-insert"></a>
#### 更新或插入

有时你可能希望更新数据库中已有的记录，或者在不存在匹配记录时创建它。这种场景下可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接受两个参数：用于查找记录的一组条件，以及一组指示要更新列的列和值对。

`updateOrInsert` 方法会尝试使用第一个参数中的列和值对来定位匹配的数据库记录。如果记录存在，就会用第二个参数中的值更新它。如果找不到该记录，则会插入一条新记录，其属性为两个参数的合并结果：

    DB::table('users')
        ->updateOrInsert(
            ['email' => 'john@example.com', 'name' => 'John'],
            ['votes' => '2']
        );

你可以向 `updateOrInsert` 方法提供一个闭包，根据是否存在匹配记录来定制要更新或插入数据库的属性：

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

更新 JSON 列时，应当使用 `->` 语法更新 JSON 对象中相应的键。该操作在 MariaDB 10.3+、MySQL 5.7+ 和 PostgreSQL 9.5+ 上受支持：

    $affected = DB::table('users')
        ->where('id', 1)
        ->update(['options->enabled' => true]);

<a name="increment-and-decrement"></a>
### 自增与自减

查询构造器还提供了便捷的方法，用于自增或自减给定列的值。这两个方法都至少接受一个参数：要修改的列。还可以提供第二个参数，用于指定该列自增或自减的数量：

    DB::table('users')->increment('votes');

    DB::table('users')->increment('votes', 5);

    DB::table('users')->decrement('votes');

    DB::table('users')->decrement('votes', 5);

如有需要，你还可以在自增或自减操作期间指定要更新的其它列：

    DB::table('users')->increment('votes', 1, ['name' => 'John']);

此外，你可以使用 `incrementEach` 和 `decrementEach` 方法一次性自增或自减多列：

    DB::table('users')->incrementEach([
        'votes' => 5,
        'balance' => 100,
    ]);

<a name="delete-statements"></a>
## Delete 语句

查询构造器的 `delete` 方法可用于从表中删除记录。`delete` 方法返回受影响的行数。你可以在调用 `delete` 方法之前添加「where」子句来约束 `delete` 语句：

    $deleted = DB::table('users')->delete();

    $deleted = DB::table('users')->where('votes', '>', 100)->delete();

<a name="pessimistic-locking"></a>
## 悲观锁

查询构造器还提供了若干函数，帮助你在执行 `select` 语句时实现「悲观锁」。要以「共享锁」执行语句，可以调用 `sharedLock` 方法。共享锁会阻止所选行在事务提交之前被修改：

    DB::table('users')
        ->where('votes', '>', 100)
        ->sharedLock()
        ->get();

此外，你可以使用 `lockForUpdate` 方法。「for update」锁会阻止所选记录被修改，也阻止它们被另一个共享锁选中：

    DB::table('users')
        ->where('votes', '>', 100)
        ->lockForUpdate()
        ->get();

虽然并非强制要求，但建议把悲观锁包裹在[事务](/docs/{{version}}/database#database-transactions)中。这可以确保取回的数据在整个操作完成之前在数据库中保持不变。一旦失败，事务会自动回滚所有改动并释放锁：

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

<a name="debugging"></a>
## 调试

在构建查询时，你可以使用 `dd` 和 `dump` 方法转储当前的查询绑定和 SQL。`dd` 方法会显示调试信息，然后停止执行请求。`dump` 方法会显示调试信息，但允许请求继续执行：

    DB::table('users')->where('votes', '>', 100)->dd();

    DB::table('users')->where('votes', '>', 100)->dump();

可以在查询上调用 `dumpRawSql` 和 `ddRawSql` 方法，转储把所有参数绑定都正确替换后的查询 SQL：

    DB::table('users')->where('votes', '>', 100)->dumpRawSql();

    DB::table('users')->where('votes', '>', 100)->ddRawSql();
