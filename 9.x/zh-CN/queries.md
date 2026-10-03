# 数据库：查询构造器

- [简介](#introduction)
- [运行数据库查询](#running-database-queries)
    - [分块处理结果](#chunking-results)
    - [惰性流式处理结果](#streaming-results-lazily)
    - [聚合函数](#aggregates)
- [Select 语句](#select-statements)
- [原始表达式](#raw-expressions)
- [连接](#joins)
- [联合](#unions)
- [基础 Where 子句](#basic-where-clauses)
    - [Where 子句](#where-clauses)
    - [Or Where 子句](#or-where-clauses)
    - [Where Not 子句](#where-not-clauses)
    - [JSON Where 子句](#json-where-clauses)
    - [额外的 Where 子句](#additional-where-clauses)
    - [逻辑分组](#logical-grouping)
- [高级 Where 子句](#advanced-where-clauses)
    - [Where Exists 子句](#where-exists-clauses)
    - [子查询 Where 子句](#subquery-where-clauses)
    - [全文 Where 子句](#full-text-where-clauses)
- [排序、分组、Limit 与 Offset](#ordering-grouping-limit-and-offset)
    - [排序](#ordering)
    - [分组](#grouping)
    - [Limit 与 Offset](#limit-and-offset)
- [条件子句](#conditional-clauses)
- [Insert 语句](#insert-statements)
    - [Upserts](#upserts)
- [Update 语句](#update-statements)
    - [更新 JSON 列](#updating-json-columns)
    - [自增与自减](#increment-and-decrement)
- [Delete 语句](#delete-statements)
- [悲观锁](#pessimistic-locking)
- [调试](#debugging)

<a name="introduction"></a>
## 简介

Laravel 的数据库查询构造器提供了一个便捷、流畅的接口来创建和运行数据库查询。它可以用于执行应用程序中的大多数数据库操作，并且能在 Laravel 支持的所有数据库系统上完美运行。

Laravel 查询构造器使用 PDO 参数绑定来保护应用程序免受 SQL 注入攻击。因此，无需对传递给查询构造器作为查询绑定的字符串进行清理或过滤。

> **Warning**  
> PDO 不支持绑定列名。因此，绝不应允许用户输入来决定查询所引用的列名，包括 "order by" 列。

<a name="running-database-queries"></a>
## 运行数据库查询

<a name="retrieving-all-rows-from-a-table"></a>
#### 从表中检索所有行

可以使用 `DB` Facade 提供的 `table` 方法来开始一个查询。`table` 方法返回给定表的流畅查询构造器实例，允许你将更多约束链接到查询上，最后使用 `get` 方法获取查询结果：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Support\Facades\DB;

    class UserController extends Controller
    {
        /**
         * 显示应用程序所有用户的列表。
         *
         * @return \Illuminate\Http\Response
         */
        public function index()
        {
            $users = DB::table('users')->get();

            return view('user.index', ['users' => $users]);
        }
    }

`get` 方法返回一个 `Illuminate\Support\Collection` 实例，其中包含查询结果，每个结果都是 PHP `stdClass` 对象的一个实例。可以通过将列作为对象的属性来访问每列的值：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')->get();

    foreach ($users as $user) {
        echo $user->name;
    }

> **Note**  
> Laravel 集合提供了多种极其强大的方法来映射和归约数据。有关 Laravel 集合的更多信息，请查阅[集合文档](/docs/{{version}}/collections)。

<a name="retrieving-a-single-row-column-from-a-table"></a>
#### 从表中检索单行 / 单列

如果只需从数据库表中检索单行，可以使用 `DB` Facade 的 `first` 方法。此方法将返回一个单独的 `stdClass` 对象：

    $user = DB::table('users')->where('name', 'John')->first();

    return $user->email;

如果不需要整行数据，可以使用 `value` 方法从记录中提取单个值。此方法将直接返回该列的值：

    $email = DB::table('users')->where('name', 'John')->value('email');

要通过 `id` 列值检索单行，使用 `find` 方法：

    $user = DB::table('users')->find(3);

<a name="retrieving-a-list-of-column-values"></a>
#### 检索列值列表

如果想检索包含单列值的 `Illuminate\Support\Collection` 实例，可以使用 `pluck` 方法。在此示例中，我们将检索用户标题的集合：

    use Illuminate\Support\Facades\DB;

    $titles = DB::table('users')->pluck('title');

    foreach ($titles as $title) {
        echo $title;
    }

可以通过向 `pluck` 方法提供第二个参数来指定结果集合用作键的列：

    $titles = DB::table('users')->pluck('title', 'name');

    foreach ($titles as $name => $title) {
        echo $title;
    }

<a name="chunking-results"></a>
### 分块处理结果

如果需要处理数千条数据库记录，可以考虑使用 `DB` Facade 提供的 `chunk` 方法。此方法每次检索一小块结果，并将每个分块传入闭包进行处理。例如，让我们每次以 100 条记录为一块来检索整个 `users` 表：

    use Illuminate\Support\Facades\DB;

    DB::table('users')->orderBy('id')->chunk(100, function ($users) {
        foreach ($users as $user) {
            //
        }
    });

可以通过从闭包返回 `false` 来停止处理后续分块：

    DB::table('users')->orderBy('id')->chunk(100, function ($users) {
        // 处理记录...

        return false;
    });

如果在分块处理结果时更新数据库记录，分块结果可能会以意想不到的方式变化。如果打算在分块时更新检索到的记录，最好使用 `chunkById` 方法。此方法会根据记录的主键自动分页结果：

    DB::table('users')->where('active', false)
        ->chunkById(100, function ($users) {
            foreach ($users as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['active' => true]);
            }
        });

> **Warning**  
> 在分块回调中更新或删除记录时，对主键或外键的任何更改都可能影响分块查询。这可能导致记录未被包含在分块结果中。

<a name="streaming-results-lazily"></a>
### 惰性流式处理结果

`lazy` 方法的工作方式类似于 [`chunk` 方法](#chunking-results)，它也是分块执行查询。然而，`lazy()` 方法不是将每个分块传入回调，而是返回一个 [`LazyCollection`](/docs/{{version}}/collections#lazy-collections)，让你可以将结果作为单个流进行交互：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function ($user) {
    //
});
```

同样，如果打算在迭代记录时更新检索到的记录，最好使用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法会根据记录的主键自动分页结果：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function ($user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> **Warning**  
> 在迭代记录时更新或删除记录，对主键或外键的任何更改都可能影响分块查询。这可能导致记录未被包含在结果中。

<a name="aggregates"></a>
### 聚合函数

查询构造器还提供了多种检索聚合值的方法，如 `count`、`max`、`min`、`avg` 和 `sum`。可以在构造查询后调用这些方法中的任何一个：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')->count();

    $price = DB::table('orders')->max('price');

当然，可以将这些方法与其他子句结合使用，以微调聚合值的计算方式：

    $price = DB::table('orders')
                    ->where('finalized', 1)
                    ->avg('price');

<a name="determining-if-records-exist"></a>
#### 判断记录是否存在

可以使用 `exists` 和 `doesntExist` 方法来判断是否存在匹配查询约束的记录，而无需使用 `count` 方法：

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

可能并不总是希望从数据库表中选择所有列。使用 `select` 方法，可以为查询指定自定义的 "select" 子句：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')
                ->select('name', 'email as user_email')
                ->get();

`distinct` 方法可以强制查询返回不重复的结果：

    $users = DB::table('users')->distinct()->get();

如果已经有了一个查询构造器实例，并希望向其现有 select 子句添加列，可以使用 `addSelect` 方法：

    $query = DB::table('users')->select('name');

    $users = $query->addSelect('age')->get();

<a name="raw-expressions"></a>
## 原始表达式

有时可能需要在查询中插入任意字符串。要创建原始字符串表达式，可以使用 `DB` Facade 提供的 `raw` 方法：

    $users = DB::table('users')
                 ->select(DB::raw('count(*) as user_count, status'))
                 ->where('status', '<>', 1)
                 ->groupBy('status')
                 ->get();

> **Warning**  
> 原始语句会以字符串形式注入查询，因此应格外小心以避免创建 SQL 注入漏洞。

<a name="raw-methods"></a>
### 原始方法

除了使用 `DB::raw` 方法外，还可以使用以下方法将原始表达式插入查询的各个部分。**请记住，Laravel 无法保证任何使用原始表达式的查询都免受 SQL 注入漏洞的影响。**

<a name="selectraw"></a>
#### `selectRaw`

`selectRaw` 方法可用于替代 `addSelect(DB::raw(/* ... */))`。此方法接受一个可选的绑定数组作为第二个参数：

    $orders = DB::table('orders')
                    ->selectRaw('price * ? as price_with_tax', [1.0825])
                    ->get();

<a name="whereraw-orwhereraw"></a>
#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可用于向查询注入原始 "where" 子句。这些方法接受一个可选的绑定数组作为第二个参数：

    $orders = DB::table('orders')
                    ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
                    ->get();

<a name="havingraw-orhavingraw"></a>
#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可用于提供原始字符串作为 "having" 子句的值。这些方法接受一个可选的绑定数组作为第二个参数：

    $orders = DB::table('orders')
                    ->select('department', DB::raw('SUM(price) as total_sales'))
                    ->groupBy('department')
                    ->havingRaw('SUM(price) > ?', [2500])
                    ->get();

<a name="orderbyraw"></a>
#### `orderByRaw`

`orderByRaw` 方法可用于提供原始字符串作为 "order by" 子句的值：

    $orders = DB::table('orders')
                    ->orderByRaw('updated_at - created_at DESC')
                    ->get();

<a name="groupbyraw"></a>
### `groupByRaw`

`groupByRaw` 方法可用于提供原始字符串作为 `group by` 子句的值：

    $orders = DB::table('orders')
                    ->select('city', 'state')
                    ->groupByRaw('city, state')
                    ->get();

<a name="joins"></a>
## 连接

<a name="inner-join-clause"></a>
#### Inner Join 子句

查询构造器也可用于向查询添加 join 子句。要执行基本的 "inner join"，可以在查询构造器实例上使用 `join` 方法。传递给 `join` 方法的第一个参数是要连接的表名，其余参数指定连接的列约束。甚至可以在单个查询中连接多个表：

    use Illuminate\Support\Facades\DB;

    $users = DB::table('users')
                ->join('contacts', 'users.id', '=', 'contacts.user_id')
                ->join('orders', 'users.id', '=', 'orders.user_id')
                ->select('users.*', 'contacts.phone', 'orders.price')
                ->get();

<a name="left-join-right-join-clause"></a>
#### Left Join / Right Join 子句

如果想执行 "left join" 或 "right join" 而不是 "inner join"，使用 `leftJoin` 或 `rightJoin` 方法。这些方法与 `join` 方法具有相同的签名：

    $users = DB::table('users')
                ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
                ->get();

    $users = DB::table('users')
                ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
                ->get();

<a name="cross-join-clause"></a>
#### Cross Join 子句

可以使用 `crossJoin` 方法执行 "cross join"。交叉连接在第一个表和连接表之间生成笛卡尔积：

    $sizes = DB::table('sizes')
                ->crossJoin('colors')
                ->get();

<a name="advanced-join-clauses"></a>
#### 高级 Join 子句

也可以指定更高级的 join 子句。首先，将闭包作为第二个参数传递给 `join` 方法。闭包将接收一个 `Illuminate\Database\Query\JoinClause` 实例，允许你在 "join" 子句上指定约束：

    DB::table('users')
            ->join('contacts', function ($join) {
                $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
            })
            ->get();

如果想在连接上使用 "where" 子句，可以使用 `JoinClause` 实例提供的 `where` 和 `orWhere` 方法。这些方法不是比较两列，而是将列与值进行比较：

    DB::table('users')
            ->join('contacts', function ($join) {
                $join->on('users.id', '=', 'contacts.user_id')
                     ->where('contacts.user_id', '>', 5);
            })
            ->get();

<a name="subquery-joins"></a>
#### 子查询连接

可以使用 `joinSub`、`leftJoinSub` 和 `rightJoinSub` 方法将查询连接到子查询。这些方法各自接收三个参数：子查询、表别名以及定义相关列的闭包。在此示例中，我们将检索用户集合，其中每个用户记录还包含该用户最近发布的博客文章的 `created_at` 时间戳：

    $latestPosts = DB::table('posts')
                       ->select('user_id', DB::raw('MAX(created_at) as last_post_created_at'))
                       ->where('is_published', true)
                       ->groupBy('user_id');

    $users = DB::table('users')
            ->joinSub($latestPosts, 'latest_posts', function ($join) {
                $join->on('users.id', '=', 'latest_posts.user_id');
            })->get();

<a name="unions"></a>
## 联合

查询构造器还提供了便捷的方法将两个或多个查询 "union" 在一起。例如，可以创建一个初始查询，并使用 `union` 方法将其与更多查询联合：

    use Illuminate\Support\Facades\DB;

    $first = DB::table('users')
                ->whereNull('first_name');

    $users = DB::table('users')
                ->whereNull('last_name')
                ->union($first)
                ->get();

除了 `union` 方法外，查询构造器还提供了 `unionAll` 方法。使用 `unionAll` 方法组合的查询不会移除重复结果。`unionAll` 方法与 `union` 方法具有相同的方法签名。

<a name="basic-where-clauses"></a>
## 基础 Where 子句

<a name="where-clauses"></a>
### Where 子句

可以使用查询构造器的 `where` 方法向查询添加 "where" 子句。最基本的 `where` 方法调用需要三个参数。第一个参数是列名。第二个参数是运算符，可以是数据库支持的任何运算符。第三个参数是要与列值进行比较的值。

例如，以下查询检索 `votes` 列值等于 `100` 且 `age` 列值大于 `35` 的用户：

    $users = DB::table('users')
                    ->where('votes', '=', 100)
                    ->where('age', '>', 35)
                    ->get();

为方便起见，如果想验证列是否 `=` 给定值，可以将该值作为 `where` 方法的第二个参数传递。Laravel 会假定你想使用 `=` 运算符：

    $users = DB::table('users')->where('votes', 100)->get();

如前所述，可以使用数据库系统支持的任何运算符：

    $users = DB::table('users')
                    ->where('votes', '>=', 100)
                    ->get();

    $users = DB::table('users')
                    ->where('votes', '<>', 100)
                    ->get();

    $users = DB::table('users')
                    ->where('name', 'like', 'T%')
                    ->get();

也可以向 `where` 方法传递条件数组。数组的每个元素应是一个包含通常传递给 `where` 方法的三个参数的数组：

    $users = DB::table('users')->where([
        ['status', '=', '1'],
        ['subscribed', '<>', '1'],
    ])->get();

> **Warning**  
> PDO 不支持绑定列名。因此，绝不应允许用户输入来决定查询所引用的列名，包括 "order by" 列。

<a name="or-where-clauses"></a>
### Or Where 子句

当链式调用查询构造器的 `where` 方法时，"where" 子句将使用 `and` 运算符连接。但是，可以使用 `orWhere` 方法将子句使用 `or` 运算符连接到查询。`orWhere` 方法接受与 `where` 方法相同的参数：

    $users = DB::table('users')
                        ->where('votes', '>', 100)
                        ->orWhere('name', 'John')
                        ->get();

如果需要将 "or" 条件用括号分组，可以将闭包作为 `orWhere` 方法的第一个参数传递：

    $users = DB::table('users')
                ->where('votes', '>', 100)
                ->orWhere(function($query) {
                    $query->where('name', 'Abigail')
                          ->where('votes', '>', 50);
                })
                ->get();

上面的示例将生成以下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> **Warning**  
> 应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="where-not-clauses"></a>
### Where Not 子句

`whereNot` 和 `orWhereNot` 方法可用于否定给定的查询约束组。例如，以下查询排除清仓产品或价格低于十的产品：

    $products = DB::table('products')
                    ->whereNot(function ($query) {
                        $query->where('clearance', true)
                              ->orWhere('price', '<', 10);
                    })
                    ->get();

<a name="json-where-clauses"></a>
### JSON Where 子句

Laravel 还支持在提供 JSON 列类型支持的数据库上查询 JSON 列类型。目前，这包括 MySQL 5.7+、PostgreSQL、SQL Server 2016 和 SQLite 3.39.0（带有 [JSON1 扩展](https://www.sqlite.org/json1.html)）。要查询 JSON 列，使用 `->` 运算符：

    $users = DB::table('users')
                    ->where('preferences->dining->meal', 'salad')
                    ->get();

可以使用 `whereJsonContains` 查询 JSON 数组。此功能在低于 3.38.0 的 SQLite 数据库版本中不受支持：

    $users = DB::table('users')
                    ->whereJsonContains('options->languages', 'en')
                    ->get();

如果应用程序使用 MySQL 或 PostgreSQL 数据库，可以向 `whereJsonContains` 方法传递值数组：

    $users = DB::table('users')
                    ->whereJsonContains('options->languages', ['en', 'de'])
                    ->get();

可以使用 `whereJsonLength` 方法按长度查询 JSON 数组：

    $users = DB::table('users')
                    ->whereJsonLength('options->languages', 0)
                    ->get();

    $users = DB::table('users')
                    ->whereJsonLength('options->languages', '>', 1)
                    ->get();

<a name="additional-where-clauses"></a>
### 额外的 Where 子句

**whereBetween / orWhereBetween**

`whereBetween` 方法验证列值在两个值之间：

    $users = DB::table('users')
               ->whereBetween('votes', [1, 100])
               ->get();

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法验证列值在两个值之外：

    $users = DB::table('users')
                        ->whereNotBetween('votes', [1, 100])
                        ->get();

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法验证列值在同一表行的两个列值之间：

    $patients = DB::table('patients')
                           ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
                           ->get();

`whereNotBetweenColumns` 方法验证列值在同一表行的两个列值之外：

    $patients = DB::table('patients')
                           ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
                           ->get();

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法验证给定列的值包含在给定数组中：

    $users = DB::table('users')
                        ->whereIn('id', [1, 2, 3])
                        ->get();

`whereNotIn` 方法验证给定列的值不包含在给定数组中：

    $users = DB::table('users')
                        ->whereNotIn('id', [1, 2, 3])
                        ->get();

也可以提供查询对象作为 `whereIn` 方法的第二个参数：

    $activeUsers = DB::table('users')->select('id')->where('is_active', 1);

    $users = DB::table('comments')
                        ->whereIn('user_id', $activeUsers)
                        ->get();

上面的示例将生成以下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> **Warning**  
> 如果要向查询添加大量整数绑定，可以使用 `whereIntegerInRaw` 或 `whereIntegerNotInRaw` 方法来大幅减少内存使用。

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法验证给定列的值为 `NULL`：

    $users = DB::table('users')
                    ->whereNull('updated_at')
                    ->get();

`whereNotNull` 方法验证列值不为 `NULL`：

    $users = DB::table('users')
                    ->whereNotNull('updated_at')
                    ->get();

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法可用于将列值与日期进行比较：

    $users = DB::table('users')
                    ->whereDate('created_at', '2016-12-31')
                    ->get();

`whereMonth` 方法可用于将列值与特定月份进行比较：

    $users = DB::table('users')
                    ->whereMonth('created_at', '12')
                    ->get();

`whereDay` 方法可用于将列值与特定日期进行比较：

    $users = DB::table('users')
                    ->whereDay('created_at', '31')
                    ->get();

`whereYear` 方法可用于将列值与特定年份进行比较：

    $users = DB::table('users')
                    ->whereYear('created_at', '2016')
                    ->get();

`whereTime` 方法可用于将列值与特定时间进行比较：

    $users = DB::table('users')
                    ->whereTime('created_at', '=', '11:20:45')
                    ->get();

**whereColumn / orWhereColumn**

`whereColumn` 方法可用于验证两列相等：

    $users = DB::table('users')
                    ->whereColumn('first_name', 'last_name')
                    ->get();

也可以向 `whereColumn` 方法传递比较运算符：

    $users = DB::table('users')
                    ->whereColumn('updated_at', '>', 'created_at')
                    ->get();

也可以向 `whereColumn` 方法传递列比较数组。这些条件将使用 `and` 运算符连接：

    $users = DB::table('users')
                    ->whereColumn([
                        ['first_name', '=', 'last_name'],
                        ['updated_at', '>', 'created_at'],
                    ])->get();

<a name="logical-grouping"></a>
### 逻辑分组

有时可能需要在括号内将多个 "where" 子句分组，以实现查询所需的逻辑分组。事实上，通常应始终将 `orWhere` 方法的调用放在括号内分组，以避免意外的查询行为。为此，可以将闭包传递给 `where` 方法：

    $users = DB::table('users')
               ->where('name', '=', 'John')
               ->where(function ($query) {
                   $query->where('votes', '>', 100)
                         ->orWhere('title', '=', 'Admin');
               })
               ->get();

如你所见，将闭包传递给 `where` 方法会指示查询构造器开始一个约束组。闭包将接收一个查询构造器实例，你可以使用它来设置应包含在括号组内的约束。上面的示例将生成以下 SQL：

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> **Warning**  
> 应始终对 `orWhere` 调用进行分组，以避免在应用全局作用域时出现意外行为。

<a name="advanced-where-clauses"></a>
### 高级 Where 子句

<a name="where-exists-clauses"></a>
### Where Exists 子句

`whereExists` 方法允许你编写 "where exists" SQL 子句。`whereExists` 方法接受一个闭包，该闭包将接收一个查询构造器实例，允许你定义应放置在 "exists" 子句内的查询：

    $users = DB::table('users')
               ->whereExists(function ($query) {
                   $query->select(DB::raw(1))
                         ->from('orders')
                         ->whereColumn('orders.user_id', 'users.id');
               })
               ->get();

上面的查询将生成以下 SQL：

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

有时可能需要构造一个 "where" 子句，将子查询的结果与给定值进行比较。可以通过将闭包和值传递给 `where` 方法来实现。例如，以下查询将检索所有拥有给定类型最近 "会员" 的用户；

    use App\Models\User;

    $users = User::where(function ($query) {
        $query->select('type')
            ->from('membership')
            ->whereColumn('membership.user_id', 'users.id')
            ->orderByDesc('membership.start_date')
            ->limit(1);
    }, 'Pro')->get();

或者，可能需要构造一个 "where" 子句，将列与子查询的结果进行比较。可以通过将列、运算符和闭包传递给 `where` 方法来实现。例如，以下查询将检索所有金额低于平均值的收入记录；

    use App\Models\Income;

    $incomes = Income::where('amount', '<', function ($query) {
        $query->selectRaw('avg(i.amount)')->from('incomes as i');
    })->get();

<a name="full-text-where-clauses"></a>
### 全文 Where 子句

> **Warning**  
> 全文 where 子句目前由 MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于为具有[全文索引](/docs/{{version}}/migrations#available-index-types)的列向查询添加全文 "where" 子句。Laravel 会将这些方法转换为底层数据库系统对应的 SQL。例如，对于使用 MySQL 的应用程序，将生成 `MATCH AGAINST` 子句：

    $users = DB::table('users')
               ->whereFullText('bio', 'web developer')
               ->get();

<a name="ordering-grouping-limit-and-offset"></a>
## 排序、分组、Limit 与 Offset

<a name="ordering"></a>
### 排序

<a name="orderby"></a>
#### `orderBy` 方法

`orderBy` 方法允许你按给定列对查询结果进行排序。`orderBy` 方法接受的第一个参数应是要排序的列，第二个参数决定排序方向，可以是 `asc` 或 `desc`：

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

`latest` 和 `oldest` 方法允许你轻松地按日期排序结果。默认情况下，结果将按表的 `created_at` 列排序。或者，可以传递要排序的列名：

    $user = DB::table('users')
                    ->latest()
                    ->first();

<a name="random-ordering"></a>
#### 随机排序

`inRandomOrder` 方法可用于随机排序查询结果。例如，可以使用此方法获取一个随机用户：

    $randomUser = DB::table('users')
                    ->inRandomOrder()
                    ->first();

<a name="removing-existing-orderings"></a>
#### 移除现有排序

`reorder` 方法会移除之前应用于查询的所有 "order by" 子句：

    $query = DB::table('users')->orderBy('name');

    $unorderedUsers = $query->reorder()->get();

可以在调用 `reorder` 方法时传递列和方向，以移除所有现有 "order by" 子句并为查询应用全新的排序：

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

可以使用 `havingBetween` 方法在给定范围内过滤结果：

    $report = DB::table('orders')
                    ->selectRaw('count(id) as number_of_orders, customer_id')
                    ->groupBy('customer_id')
                    ->havingBetween('number_of_orders', [5, 15])
                    ->get();

可以向 `groupBy` 方法传递多个参数以按多列分组：

    $users = DB::table('users')
                    ->groupBy('first_name', 'status')
                    ->having('account_id', '>', 100)
                    ->get();

要构建更高级的 `having` 语句，请参阅 [`havingRaw`](#raw-methods) 方法。

<a name="limit-and-offset"></a>
### Limit 与 Offset

<a name="skip-take"></a>
#### `skip` 与 `take` 方法

可以使用 `skip` 和 `take` 方法限制查询返回的结果数量或跳过查询中给定数量的结果：

    $users = DB::table('users')->skip(10)->take(5)->get();

或者，可以使用 `limit` 和 `offset` 方法。这些方法分别与 `take` 和 `skip` 方法功能等效：

    $users = DB::table('users')
                    ->offset(10)
                    ->limit(5)
                    ->get();

<a name="conditional-clauses"></a>
## 条件子句

有时可能希望根据另一个条件将某些查询子句应用于查询。例如，可能只在传入 HTTP 请求中存在给定输入值时才应用 `where` 语句。可以使用 `when` 方法实现：

    $role = $request->input('role');

    $users = DB::table('users')
                    ->when($role, function ($query, $role) {
                        $query->where('role_id', $role);
                    })
                    ->get();

`when` 方法只在第一个参数为 `true` 时执行给定的闭包。如果第一个参数为 `false`，闭包将不会执行。因此，在上面的示例中，传递给 `when` 方法的闭包只在传入请求中存在 `role` 字段且求值为 `true` 时才会被调用。

可以将另一个闭包作为 `when` 方法的第三个参数传递。此闭包只在第一个参数求值为 `false` 时执行。为了说明如何使用此功能，我们将用它来配置查询的默认排序：

    $sortByVotes = $request->input('sort_by_votes');

    $users = DB::table('users')
                    ->when($sortByVotes, function ($query, $sortByVotes) {
                        $query->orderBy('votes');
                    }, function ($query) {
                        $query->orderBy('name');
                    })
                    ->get();

<a name="insert-statements"></a>
## Insert 语句

查询构造器还提供了 `insert` 方法，可用于向数据库表插入记录。`insert` 方法接受一个包含列名和值的数组：

    DB::table('users')->insert([
        'email' => 'kayla@example.com',
        'votes' => 0
    ]);

可以通过传递数组数组一次插入多条记录。每个数组代表一条应插入表中的记录：

    DB::table('users')->insert([
        ['email' => 'picard@example.com', 'votes' => 0],
        ['email' => 'janeway@example.com', 'votes' => 0],
    ]);

`insertOrIgnore` 方法会在向数据库插入记录时忽略错误。使用此方法时，应注意重复记录错误将被忽略，并且根据数据库引擎，其他类型的错误也可能被忽略。例如，`insertOrIgnore` 会[绕过 MySQL 的严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

    DB::table('users')->insertOrIgnore([
        ['id' => 1, 'email' => 'sisko@example.com'],
        ['id' => 2, 'email' => 'archer@example.com'],
    ]);

`insertUsing` 方法会在向表中插入新记录时使用子查询来确定应插入的数据：

    DB::table('pruned_users')->insertUsing([
        'id', 'name', 'email', 'email_verified_at'
    ], DB::table('users')->select(
        'id', 'name', 'email', 'email_verified_at'
    )->where('updated_at', '<=', now()->subMonth()));

<a name="auto-incrementing-ids"></a>
#### 自增 ID

如果表有自增 id，使用 `insertGetId` 方法插入记录并获取其 ID：

    $id = DB::table('users')->insertGetId(
        ['email' => 'john@example.com', 'votes' => 0]
    );

> **Warning**  
> 使用 PostgreSQL 时，`insertGetId` 方法期望自增列名为 `id`。如果要从不同的 "序列" 获取 ID，可以将列名作为 `insertGetId` 方法的第二个参数传递。

<a name="upserts"></a>
### Upserts

`upsert` 方法会插入不存在的记录，并使用你指定的新值更新已存在的记录。方法的第一个参数包含要插入或更新的值，第二个参数列出在关联表中唯一标识记录的列。方法的第三个也是最后一个参数是当数据库中已存在匹配记录时应更新的列数组：

    DB::table('flights')->upsert(
        [
            ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
            ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
        ],
        ['departure', 'destination'],
        ['price']
    );

在上面的示例中，Laravel 会尝试插入两条记录。如果已存在具有相同 `departure` 和 `destination` 列值的记录，Laravel 将更新该记录的 `price` 列。

> **Warning**  
> 除 SQL Server 外的所有数据库都要求 `upsert` 方法的第二个参数中的列具有 "primary" 或 "unique" 索引。此外，MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，并始终使用表的 "primary" 和 "unique" 索引来检测现有记录。

<a name="update-statements"></a>
## Update 语句

除了向数据库插入记录外，查询构造器还可以使用 `update` 方法更新现有记录。`update` 方法与 `insert` 方法一样，接受一个包含列和值对的数组，指示要更新的列。`update` 方法返回受影响的行数。可以使用 `where` 子句约束 `update` 查询：

    $affected = DB::table('users')
                  ->where('id', 1)
                  ->update(['votes' => 1]);

<a name="update-or-insert"></a>
#### 更新或插入

有时可能希望更新数据库中的现有记录，如果不存在匹配记录则创建它。在这种情况下，可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接受两个参数：用于查找记录的条件数组，以及指示要更新的列的列和值对数组。

`updateOrInsert` 方法会尝试使用第一个参数的列和值对定位匹配的数据库记录。如果记录存在，将使用第二个参数中的值更新它。如果找不到记录，将使用两个参数合并后的属性插入新记录：

    DB::table('users')
        ->updateOrInsert(
            ['email' => 'john@example.com', 'name' => 'John'],
            ['votes' => '2']
        );

<a name="updating-json-columns"></a>
### 更新 JSON 列

更新 JSON 列时，应使用 `->` 语法更新 JSON 对象中的相应键。此操作在 MySQL 5.7+ 和 PostgreSQL 9.5+ 上受支持：

    $affected = DB::table('users')
                  ->where('id', 1)
                  ->update(['options->enabled' => true]);

<a name="increment-and-decrement"></a>
### 自增与自减

查询构造器还提供了便捷的方法来递增或递减给定列的值。这两个方法都至少接受一个参数：要修改的列。可以提供第二个参数来指定列应递增或递减的数量：

    DB::table('users')->increment('votes');

    DB::table('users')->increment('votes', 5);

    DB::table('users')->decrement('votes');

    DB::table('users')->decrement('votes', 5);

如果需要，还可以指定在递增或递减操作期间要更新的其他列：

    DB::table('users')->increment('votes', 1, ['name' => 'John']);

此外，可以使用 `incrementEach` 和 `decrementEach` 方法一次递增或递减多列：

    DB::table('users')->incrementEach([
        'votes' => 5,
        'balance' => 100,
    ]);

<a name="delete-statements"></a>
## Delete 语句

查询构造器的 `delete` 方法可用于从表中删除记录。`delete` 方法返回受影响的行数。可以在调用 `delete` 方法之前添加 "where" 子句来约束 `delete` 语句：

    $deleted = DB::table('users')->delete();

    $deleted = DB::table('users')->where('votes', '>', 100)->delete();

如果想截断整个表，即移除表中的所有记录并将自增 ID 重置为零，可以使用 `truncate` 方法：

    DB::table('users')->truncate();

<a name="table-truncation-and-postgresql"></a>
#### 表截断与 PostgreSQL

截断 PostgreSQL 数据库时，将应用 `CASCADE` 行为。这意味着其他表中所有外键关联的记录也将被删除。

<a name="pessimistic-locking"></a>
## 悲观锁

查询构造器还包含一些函数，帮助你在执行 `select` 语句时实现 "悲观锁定"。要执行带有 "共享锁" 的语句，可以调用 `sharedLock` 方法。共享锁会阻止所选行被修改，直到事务提交：

    DB::table('users')
            ->where('votes', '>', 100)
            ->sharedLock()
            ->get();

或者，可以使用 `lockForUpdate` 方法。"for update" 锁会阻止所选记录被修改或被另一个共享锁选中：

    DB::table('users')
            ->where('votes', '>', 100)
            ->lockForUpdate()
            ->get();

<a name="debugging"></a>
## 调试

可以在构建查询时使用 `dd` 和 `dump` 方法转储当前查询绑定和 SQL。`dd` 方法会显示调试信息并停止执行请求。`dump` 方法会显示调试信息但允许请求继续执行：

    DB::table('users')->where('votes', '>', 100)->dd();

    DB::table('users')->where('votes', '>', 100)->dump();
