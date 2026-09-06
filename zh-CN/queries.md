# 数据库：查询构造器

## 简介

Laravel 的数据库查询构造器（Query Builder）为创建和运行数据库查询提供了一个便捷、流畅的接口。它可用于在应用中执行大多数数据库操作，并与 Laravel 支持的所有数据库系统完美兼容。

Laravel 查询构造器使用 PDO 参数绑定来保护应用免受 SQL 注入攻击。因此，作为查询绑定传入的字符串无需手动清理或转义。

> [!WARNING]
> PDO 不支持对列名进行参数绑定。因此，绝不应该让用户输入决定查询所引用的列名（包括「order by」列）。

## 运行数据库查询

#### 从表中检索所有行

你可以使用 `DB` facade 提供的 `table` 方法来开启一条查询。`table` 方法会为指定表返回一个流式查询构造器实例，便于你继续链式追加更多约束，最后通过 `get` 方法取出查询结果：

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

`get` 方法会返回一个 `Illuminate\Support\Collection` 实例，其中包含查询结果，每条结果都是 PHP `stdClass` 对象的一个实例。你可以通过将列作为对象属性访问来获取每个列的值：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->get();

foreach ($users as $user) {
    echo $user->name;
}
```

> [!NOTE]
> Laravel 集合提供了许多非常强大的方法用于映射与归约数据。更多信息请查阅 [集合文档](/topic/Laravel%2013.x/4rvgn63ydj.html)。

#### 从表中检索单行 / 单列

如果只需要从数据库表中获取一行数据，可以使用 `DB` facade 的 `first` 方法。该方法会返回一个 `stdClass` 对象：

```php
$user = DB::table('users')->where('name', 'John')->first();

return $user->email;
```

如果想从数据库表中取出一行数据，但在没有匹配行时抛出 `Illuminate\Database\RecordNotFoundException`，可以使用 `firstOrFail` 方法。如果未捕获 `RecordNotFoundException`，框架会自动向客户端返回 404 HTTP 响应：

```php
$user = DB::table('users')->where('name', 'John')->firstOrFail();
```

如果不需要整行记录，可以使用 `value` 方法从记录中取出单个字段值。它会直接返回该列的值：

```php
$email = DB::table('users')->where('name', 'John')->value('email');
```

要按 `id` 列的值取出一行记录，请使用 `find` 方法：

```php
$user = DB::table('users')->find(3);
```

#### 检索列值列表

如果你想取出一个包含单列取值的 `Illuminate\Support\Collection` 实例，可以使用 `pluck` 方法。在下面的示例中，我们会取出一组用户头衔的集合：

```php
use Illuminate\Support\Facades\DB;

$titles = DB::table('users')->pluck('title');

foreach ($titles as $title) {
    echo $title;
}
```

你可以通过向 `pluck` 方法传入第二个参数，指定结果集合使用的键对应的列：

```php
$titles = DB::table('users')->pluck('title', 'name');

foreach ($titles as $name => $title) {
    echo $title;
}
```

### 结果分块

如果需要处理成千上万条数据库记录，可以考虑使用 `DB` facade 提供的 `chunk` 方法。该方法每次取出一小块结果，并将每个分块传递给一个闭包进行处理。例如，下面的示例会以 100 条记录为一块，逐块检索整个 `users` 表：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    foreach ($users as $user) {
        // ...
    }
});
```

你可以通过在闭包中返回 `false` 来停止继续处理后续分块：

```php
DB::table('users')->orderBy('id')->chunk(100, function (Collection $users) {
    // 处理记录...

    return false;
});
```

如果你在分块取出结果时同时更新数据库记录，分块结果可能会以预期之外的方式发生变化。如果你计划在分块过程中更新取出的记录，那么最佳做法是改用 `chunkById` 方法。该方法会自动基于记录的主键对结果进行分页：

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

由于 `chunkById` 和 `lazyById` 方法会在执行的查询上添加它们自己的「where」条件，你通常应将自己的条件 逻辑分组 到一个闭包内：

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
> 在分块回调内更新或删除记录时，对主键或外键的任何改动都可能影响分块查询，进而可能导致部分记录没有包含在分块结果中。

### 惰性流式拉取结果

`lazy` 方法在以分块方式执行查询这一点上与 chunk 方法 类似。不同之处在于，`lazy()` 方法会返回一个 [LazyCollection](/topic/Laravel%2013.x/4rvgn63ydj.html)，让你像操作单一数据流一样处理结果：

```php
use Illuminate\Support\Facades\DB;

DB::table('users')->orderBy('id')->lazy()->each(function (object $user) {
    // ...
});
```

同样地，如果你计划在遍历过程中更新取出的记录，最好改用 `lazyById` 或 `lazyByIdDesc` 方法。这些方法会自动基于记录的主键对结果进行分页：

```php
DB::table('users')->where('active', false)
    ->lazyById()->each(function (object $user) {
        DB::table('users')
            ->where('id', $user->id)
            ->update(['active' => true]);
    });
```

> [!WARNING]
> 在遍历过程中更新或删除记录时，对主键或外键的任何改动都可能影响分块查询，进而可能导致部分记录没有包含在结果中。

### 聚合查询

查询构造器还提供了多种方法来获取 `count`、`max`、`min`、`avg` 和 `sum` 等聚合值。可以在构建查询后调用这些方法：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')->count();

$price = DB::table('orders')->max('price');
```

当然，你也可以将这些方法与其它子句组合使用，从而更精细地控制聚合值的计算方式：

```php
$price = DB::table('orders')
    ->where('finalized', 1)
    ->avg('price');
```

#### 判断记录是否存在

除了使用 `count` 方法判断是否有匹配查询约束的记录外，也可以使用 `exists` 和 `doesntExist` 方法：

```php
if (DB::table('orders')->where('finalized', 1)->exists()) {
    // ...
}

if (DB::table('orders')->where('finalized', 1)->doesntExist()) {
    // ...
}
```

## Select 语句

#### 指定 Select 子句

你可能并不总是希望从数据库表中选择所有列。使用 `select` 方法，你可以为查询指定一个自定义的「select」子句：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->select('name', 'email as user_email')
    ->get();
```

`distinct` 方法允许你强制让查询返回不重复的结果：

```php
$users = DB::table('users')->distinct()->get();
```

如果已经有一个查询构造器实例，并且希望向其已有的 select 子句追加一列，可以使用 `addSelect` 方法：

```php
$query = DB::table('users')->select('name');

$users = $query->addSelect('age')->get();
```

## 原生表达式

有时你可能需要在查询中插入任意字符串。要创建一个原生字符串表达式，可以使用 `DB` facade 提供的 `raw` 方法：

```php
$users = DB::table('users')
    ->select(DB::raw('count(*) as user_count, status'))
    ->where('status', '<>', 1)
    ->groupBy('status')
    ->get();
```

> [!WARNING]
> 原生语句会作为字符串注入到查询中，因此必须格外小心，避免引入 SQL 注入漏洞。

### 原生方法

除了使用 `DB::raw` 方法外，还可以使用以下方法将原生表达式插入查询的不同部分。**请记住，Laravel 无法保证使用原生表达式的查询能够防御 SQL 注入漏洞。**

#### `selectRaw`

`selectRaw` 方法可以替代 `addSelect(DB::raw(/* ... */))` 的写法。该方法接收一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->selectRaw('price * ? as price_with_tax', [1.0825])
    ->get();
```

#### `whereRaw / orWhereRaw`

`whereRaw` 和 `orWhereRaw` 方法可以将原生「where」子句注入查询。这两个方法都接收一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->whereRaw('price > IF(state = "TX", ?, 100)', [200])
    ->get();
```

#### `havingRaw / orHavingRaw`

`havingRaw` 和 `orHavingRaw` 方法可以将原生字符串作为「having」子句的值。这两个方法都接收一个可选的绑定数组作为第二个参数：

```php
$orders = DB::table('orders')
    ->select('department', DB::raw('SUM(price) as total_sales'))
    ->groupBy('department')
    ->havingRaw('SUM(price) > ?', [2500])
    ->get();
```

#### `orderByRaw`

`orderByRaw` 方法可以将原生字符串作为「order by」子句的值：

```php
$orders = DB::table('orders')
    ->orderByRaw('updated_at - created_at DESC')
    ->get();
```

#### `groupByRaw`

`groupByRaw` 方法可以将原生字符串作为 `group by` 子句的值：

```php
$orders = DB::table('orders')
    ->select('city', 'state')
    ->groupByRaw('city, state')
    ->get();
```

## Joins（连接）

#### Inner Join 子句

查询构造器也可以用于向查询添加 join 子句。要执行基本的「inner join」，可以在查询构造器实例上使用 `join` 方法。`join` 方法的第一个参数是需要连接的表名，其余参数指定连接的列约束。你甚至可以在一条查询中连接多张表：

```php
use Illuminate\Support\Facades\DB;

$users = DB::table('users')
    ->join('contacts', 'users.id', '=', 'contacts.user_id')
    ->join('orders', 'users.id', '=', 'orders.user_id')
    ->select('users.*', 'contacts.phone', 'orders.price')
    ->get();
```

#### Left Join / Right Join 子句

如果你希望执行「left join」或「right join」而非「inner join」，请使用 `leftJoin` 或 `rightJoin` 方法。这些方法的签名与 `join` 方法相同：

```php
$users = DB::table('users')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();

$users = DB::table('users')
    ->rightJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();
```

#### Cross Join 子句

你可以使用 `crossJoin` 方法执行「cross join」。Cross join 会生成第一张表与被连接表之间的笛卡尔积：

```php
$sizes = DB::table('sizes')
    ->crossJoin('colors')
    ->get();
```

#### 高级 Join 子句

你还可以指定更高级的 join 子句。开始时，可以将一个闭包作为第二个参数传入 `join` 方法。该闭包会接收一个 `Illuminate\Database\Query\JoinClause` 实例，允许你在「join」子句上指定约束：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')->orOn(/* ... */);
    })
    ->get();
```

如果想在 join 上使用「where」子句，可以使用 `JoinClause` 实例提供的 `where` 与 `orWhere` 方法。这些方法会将列与值进行比较，而不是比较两个列：

```php
DB::table('users')
    ->join('contacts', function (JoinClause $join) {
        $join->on('users.id', '=', 'contacts.user_id')
            ->where('contacts.user_id', '>', 5);
    })
    ->get();
```

#### 子查询连接

你可以使用 `joinSub`、`leftJoinSub` 与 `rightJoinSub` 方法将一个查询连接到子查询上。每个方法都接收三个参数：子查询本身、它的表别名，以及一个用于定义关联列的闭包。在下面的示例中，我们会取出一组用户，每个用户记录中还会附带该用户最近发布的博客文章的 `created_at` 时间戳：

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

#### Lateral 连接

> [!WARNING]
> Lateral join 目前由 PostgreSQL、MySQL >= 8.0.14 和 SQL Server 支持。

你可以使用 `joinLateral` 和 `leftJoinLateral` 方法对子查询执行「lateral join」。每个方法接收两个参数：子查询本身与它的表别名。join 条件应在所给子查询的 `where` 子句内指定。Lateral join 会针对每一行进行求值，并且可以引用子查询之外的列。

在下面的示例中，我们会取出一组用户以及每位用户的最近三篇博客文章。每个用户最多会在结果集中产生三行——对应其最近的每篇博客文章。join 条件在子查询内通过 `whereColumn` 子句指定，引用当前的用户行：

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

## Unions（联合）

查询构造器还提供了一个便捷方法，将两条或多条查询「联合」起来。例如，你可以先创建一条初始查询，然后通过 `union` 方法将其与其它查询联合：

```php
use Illuminate\Support\Facades\DB;

$usersWithoutFirstName = DB::table('users')
    ->whereNull('first_name');

$users = DB::table('users')
    ->whereNull('last_name')
    ->union($usersWithoutFirstName)
    ->get();
```

除了 `union` 方法，查询构造器还提供了 `unionAll` 方法。使用 `unionAll` 方法联合的查询不会去除重复行。`unionAll` 方法的签名与 `union` 方法相同。

## 基础 Where 子句

### Where 子句

你可以使用查询构造器的 `where` 方法向查询添加「where」子句。最基本的 `where` 方法调用需要三个参数：第一个参数是列名，第二个参数是运算符（可以是数据库支持的任意运算符），第三个参数是与列值比较的值。

例如，下面的查询会取出 `votes` 列值等于 `100` 且 `age` 列值大于 `35` 的所有用户：

```php
$users = DB::table('users')
    ->where('votes', '=', 100)
    ->where('age', '>', 35)
    ->get();
```

为了方便起见，如果你只想验证某列 `=` 某个值，可以把该值作为第二个参数传给 `where` 方法，Laravel 会默认使用 `=` 运算符：

```php
$users = DB::table('users')->where('votes', 100)->get();
```

你也可以向 `where` 方法传入一个关联数组，以便快速按多个列查询：

```php
$users = DB::table('users')->where([
    'first_name' => 'Jane',
    'last_name' => 'Doe',
])->get();
```

如前所述，你可以使用数据库系统支持的任意运算符：

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

你也可以向 `where` 函数传入一个条件数组，数组的每个元素都应该是一个包含三个参数的数组（即通常传给 `where` 方法的三个参数）：

```php
$users = DB::table('users')->where([
    ['status', '=', '1'],
    ['subscribed', '<>', '1'],
])->get();
```

> [!WARNING]
> PDO 不支持对列名进行参数绑定。因此，绝不应该让用户输入决定查询所引用的列名（包括「order by」列）。

> [!WARNING]
> MySQL 和 MariaDB 在字符串与数字比较时会自动将字符串类型转换为整数。在此过程中，非数字字符串会被转换为 `0`，这可能会导致意外结果。例如，如果你的表中有一个 `secret` 列，值为 `aaa`，但你执行 `User::where('secret', 0)`，那一行会被返回。为避免这种情况，请确保在查询中使用之前将所有值类型转换为合适的类型。

### Or Where 子句

链式调用查询构造器的 `where` 方法时，各「where」子句之间会以 `and` 运算符连接。但你可以使用 `orWhere` 方法，用 `or` 运算符将子句连接到查询中。`orWhere` 方法接收的参数与 `where` 方法相同：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhere('name', 'John')
    ->get();
```

如果需要将「or」条件用括号分组，可以将一个闭包作为第一个参数传给 `orWhere` 方法：

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

上面的示例会生成如下 SQL：

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> [!WARNING]
> 为避免在全局作用域生效时出现意外行为，应当始终将 `orWhere` 调用分组。

### Where Not 子句

`whereNot` 与 `orWhereNot` 方法可用于对一组查询约束取反。例如，下面的查询会排除处于清仓状态或价格低于 10 的商品：

```php
$products = DB::table('products')
    ->whereNot(function (Builder $query) {
        $query->where('clearance', true)
            ->orWhere('price', '<', 10);
        })
    ->get();
```

### Where Any / All / None 子句

有时你需要将同样的查询约束应用到多个列。例如，你希望取出指定列表中的任一列 `LIKE` 某个值的所有记录。可以使用 `whereAny` 方法来实现：

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

类似地，`whereAll` 方法可用于取出所有给定列都满足指定约束的记录：

```php
$posts = DB::table('posts')
    ->where('published', true)
    ->whereAll([
        'title',
        'content',
    ], 'like', '%Laravel%')
    ->get();
```

上面的查询会生成如下 SQL：

```sql
SELECT *
FROM posts
WHERE published = true AND (
    title LIKE '%Laravel%' AND
    content LIKE '%Laravel%'
)
```

`whereNone` 方法可用于取出所有给定列都不满足指定约束的记录：

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

### JSON Where 子句

Laravel 也支持在提供 JSON 列类型支持的数据库上查询 JSON 列类型。目前包括 MariaDB 10.3+、MySQL 8.0+、PostgreSQL 12.0+、SQL Server 2017+ 以及 SQLite 3.39.0+。要查询 JSON 列，请使用 `->` 运算符：

```php
$users = DB::table('users')
    ->where('preferences->dining->meal', 'salad')
    ->get();

$users = DB::table('users')
    ->whereIn('preferences->dining->meal', ['pasta', 'salad', 'sandwiches'])
    ->get();
```

你可以使用 `whereJsonContains` 与 `whereJsonDoesntContain` 方法来查询 JSON 数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', 'en')
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', 'en')
    ->get();
```

如果你的应用使用 MariaDB、MySQL 或 PostgreSQL 数据库，可以向 `whereJsonContains` 与 `whereJsonDoesntContain` 方法传入一个值数组：

```php
$users = DB::table('users')
    ->whereJsonContains('options->languages', ['en', 'de'])
    ->get();

$users = DB::table('users')
    ->whereJsonDoesntContain('options->languages', ['en', 'de'])
    ->get();
```

此外，你还可以使用 `whereJsonContainsKey` 或 `whereJsonDoesntContainKey` 方法来检索包含或不包含某个 JSON 键的结果：

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

### 其它 Where 子句

**whereLike / orWhereLike / whereNotLike / orWhereNotLike**

`whereLike` 方法允许你向查询添加「LIKE」子句以进行模式匹配。这些方法以与具体数据库无关的方式执行字符串匹配查询，并可切换大小写敏感。默认情况下，字符串匹配是大小写不敏感的：

```php
$users = DB::table('users')
    ->whereLike('name', '%John%')
    ->get();
```

你可以通过 `caseSensitive` 参数启用大小写敏感搜索：

```php
$users = DB::table('users')
    ->whereLike('name', '%John%', caseSensitive: true)
    ->get();
```

`orWhereLike` 方法允许你添加带 LIKE 条件的「or」子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereLike('name', '%John%')
    ->get();
```

`whereNotLike` 方法允许你向查询添加「NOT LIKE」子句：

```php
$users = DB::table('users')
    ->whereNotLike('name', '%John%')
    ->get();
```

类似地，你可以使用 `orWhereNotLike` 添加带 NOT LIKE 条件的「or」子句：

```php
$users = DB::table('users')
    ->where('votes', '>', 100)
    ->orWhereNotLike('name', '%John%')
    ->get();
```

> [!WARNING]
> `whereLike` 的大小写敏感选项当前在 SQL Server 上不受支持。

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

`whereIn` 方法用于校验某列的值是否包含在给定数组中：

```php
$users = DB::table('users')
    ->whereIn('id', [1, 2, 3])
    ->get();
```

`whereNotIn` 方法用于校验某列的值是否不在给定数组中：

```php
$users = DB::table('users')
    ->whereNotIn('id', [1, 2, 3])
    ->get();
```

你也可以将一个查询对象作为 `whereIn` 方法的第二个参数传入：

```php
$activeUsers = DB::table('users')->select('id')->where('is_active', 1);

$comments = DB::table('comments')
    ->whereIn('user_id', $activeUsers)
    ->get();
```

上面的示例会生成如下 SQL：

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> [!WARNING]
> 如果你要向查询中传入一个很大的整型绑定数组，可以使用 `whereIntegerInRaw` 或 `whereIntegerNotInRaw` 方法以显著降低内存占用。

**whereBetween / orWhereBetween**

`whereBetween` 方法用于校验某列的值是否在两个值之间：

```php
$users = DB::table('users')
    ->whereBetween('votes', [1, 100])
    ->get();
```

**whereNotBetween / orWhereNotBetween**

`whereNotBetween` 方法用于校验某列的值是否不在两个值之间：

```php
$users = DB::table('users')
    ->whereNotBetween('votes', [1, 100])
    ->get();
```

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

`whereBetweenColumns` 方法用于校验某列的值是否位于同一行内另外两列对应的两个值之间：

```php
$patients = DB::table('patients')
    ->whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

`whereNotBetweenColumns` 方法用于校验某列的值是否不在同一行内另外两列对应的两个值之间：

```php
$patients = DB::table('patients')
    ->whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    ->get();
```

**whereValueBetween / whereValueNotBetween / orWhereValueBetween / orWhereValueNotBetween**

`whereValueBetween` 方法用于校验某个给定值是否位于同一行内两列对应的两个值之间（两列类型相同）：

```php
$products = DB::table('products')
    ->whereValueBetween(100, ['min_price', 'max_price'])
    ->get();
```

`whereValueNotBetween` 方法用于校验某个值是否不在同一行内两列对应的两个值之间：

```php
$products = DB::table('products')
    ->whereValueNotBetween(100, ['min_price', 'max_price'])
    ->get();
```

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

`whereNull` 方法用于校验给定列的值是否为 `NULL`：

```php
$users = DB::table('users')
    ->whereNull('updated_at')
    ->get();
```

`whereNotNull` 方法用于校验某列的值是否不为 `NULL`：

```php
$users = DB::table('users')
    ->whereNotNull('updated_at')
    ->get();
```

**whereNullSafeEquals / orWhereNullSafeEquals**

`whereNullSafeEquals` 与 `orWhereNullSafeEquals` 方法可用于将某列的值与给定值比较，并将两个 `NULL` 视为相等：

```php
$lastLoginIp = $request->input('last_login_ip');

$users = DB::table('users')
    ->whereNullSafeEquals('last_login_ip', $lastLoginIp)
    ->get();
```

**whereDate / whereMonth / whereDay / whereYear / whereTime**

`whereDate` 方法可用于将某列的值与日期比较：

```php
$users = DB::table('users')
    ->whereDate('created_at', '2016-12-31')
    ->get();
```

`whereMonth` 方法可用于将某列的值与特定月份比较：

```php
$users = DB::table('users')
    ->whereMonth('created_at', '12')
    ->get();
```

`whereDay` 方法可用于将某列的值与一个月中的某一天比较：

```php
$users = DB::table('users')
    ->whereDay('created_at', '31')
    ->get();
```

`whereYear` 方法可用于将某列的值与特定年份比较：

```php
$users = DB::table('users')
    ->whereYear('created_at', '2016')
    ->get();
```

`whereTime` 方法可用于将某列的值与特定时间比较：

```php
$users = DB::table('users')
    ->whereTime('created_at', '=', '11:20:45')
    ->get();
```

**wherePast / whereFuture / whereToday / whereBeforeToday / whereAfterToday**

`wherePast` 与 `whereFuture` 方法可用于判断某列的值是否在过去或将来：

```php
$invoices = DB::table('invoices')
    ->wherePast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereFuture('due_at')
    ->get();
```

`whereNowOrPast` 与 `whereNowOrFuture` 方法可用于判断某列的值在过去或将来（含当前时刻）：

```php
$invoices = DB::table('invoices')
    ->whereNowOrPast('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereNowOrFuture('due_at')
    ->get();
```

`whereToday`、`whereBeforeToday` 与 `whereAfterToday` 方法分别用于判断某列的值是否为今天、今天之前或今天之后：

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

类似地，`whereTodayOrBefore` 与 `whereTodayOrAfter` 方法可用于判断某列的值是否在今天之前（含今天）或今天之后（含今天）：

```php
$invoices = DB::table('invoices')
    ->whereTodayOrBefore('due_at')
    ->get();

$invoices = DB::table('invoices')
    ->whereTodayOrAfter('due_at')
    ->get();
```

**whereColumn / orWhereColumn**

`whereColumn` 方法可用于校验两列是否相等：

```php
$users = DB::table('users')
    ->whereColumn('first_name', 'last_name')
    ->get();
```

你也可以向 `whereColumn` 方法传入一个比较运算符：

```php
$users = DB::table('users')
    ->whereColumn('updated_at', '>', 'created_at')
    ->get();
```

你也可以向 `whereColumn` 方法传入一组列比较条件数组。这些条件之间会以 `and` 运算符连接：

```php
$users = DB::table('users')
    ->whereColumn([
        ['first_name', '=', 'last_name'],
        ['updated_at', '>', 'created_at'],
    ])->get();
```

### 逻辑分组

有时你可能需要将若干「where」子句用括号分组，以实现查询所需的逻辑分组。事实上，通常应当始终将 `orWhere` 调用用括号分组，以避免出现意外的查询行为。要实现这一点，可以向 `where` 方法传入一个闭包：

```php
$users = DB::table('users')
    ->where('name', '=', 'John')
    ->where(function (Builder $query) {
        $query->where('votes', '>', 100)
            ->orWhere('title', '=', 'Admin');
    })
    ->get();
```

如你所见，向 `where` 方法传入闭包会指示查询构造器开始一个约束分组。该闭包会接收一个查询构造器实例，你可以使用它来设置需要被包含在括号分组内的约束。上面的示例会生成如下 SQL：

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> [!WARNING]
> 为避免在全局作用域生效时出现意外行为，应当始终将 `orWhere` 调用分组。

## 高级 Where 子句

### Where Exists 子句

`whereExists` 方法允许你编写「where exists」SQL 子句。`whereExists` 方法接收一个闭包，闭包会接收一个查询构造器实例，便于你定义应当放在「exists」子句内的查询：

```php
$users = DB::table('users')
    ->whereExists(function (Builder $query) {
        $query->select(DB::raw(1))
            ->from('orders')
            ->whereColumn('orders.user_id', 'users.id');
    })
    ->get();
```

或者，你也可以向 `whereExists` 方法传入一个查询对象，而非闭包：

```php
$orders = DB::table('orders')
    ->select(DB::raw(1))
    ->whereColumn('orders.user_id', 'users.id');

$users = DB::table('users')
    ->whereExists($orders)
    ->get();
```

上述两个示例都会生成如下 SQL：

```sql
select * from users
where exists (
    select 1
    from orders
    where orders.user_id = users.id
)
```

### 子查询 Where 子句

有时你需要构造一个「where」子句，将子查询的结果与给定值进行比较。可以通过向 `where` 方法传入一个闭包和一个值来实现。例如，下面的查询会取出所有持有指定类型近期「membership」的用户：

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

或者，你可能需要构造一个「where」子句，将某列与子查询的结果进行比较。可以通过向 `where` 方法传入列名、运算符和闭包来实现。例如，下面的查询会取出所有金额小于平均值的收入记录：

```php
use App\Models\Income;
use Illuminate\Database\Query\Builder;

$incomes = Income::where('amount', '<', function (Builder $query) {
    $query->selectRaw('avg(i.amount)')->from('incomes as i');
})->get();
```

### 全文检索 Where 子句

> [!WARNING]
> 全文检索 where 子句目前由 MariaDB、MySQL 和 PostgreSQL 支持。

`whereFullText` 和 `orWhereFullText` 方法可用于为已经建有 [全文索引](/topic/Laravel%2013.x/x3vo0g4vm1.html) 的列添加全文「where」子句。Laravel 会自动将这些方法转换为底层数据库系统所支持的 SQL。例如，使用 MariaDB 或 MySQL 的应用会生成 `MATCH AGAINST` 子句：

```php
$users = DB::table('users')
    ->whereFullText('bio', 'web developer')
    ->get();
```

### 向量相似度子句

> [!NOTE]
> 向量相似度子句目前在使用 `pgvector` 扩展的 PostgreSQL 连接以及 MariaDB 11.7 或更高版本上受支持。有关定义向量列与索引的信息，请查阅 [迁移文档](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

`whereVectorSimilarTo` 方法按与给定向量的余弦相似度过滤结果，并按相关度排序。`minSimilarity` 阈值应为 `0.0` 到 `1.0` 之间的值，`1.0` 表示完全相同：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

当以普通字符串作为向量参数时，Laravel 会使用 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 自动为其生成嵌入向量：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

默认情况下，`whereVectorSimilarTo` 还会按距离（最相似优先）对结果排序。可以通过传入 `false` 作为 `order` 参数来禁用该排序：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4, order: false)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

如果需要更细粒度的控制，可以分别独立使用 `selectVectorDistance`、`whereVectorDistanceLessThan` 与 `orderByVectorDistance` 方法：

```php
$documents = DB::table('documents')
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

在使用 PostgreSQL 时，必须先加载 `pgvector` 扩展才能创建 `vector` 列：

```php
Schema::ensureVectorExtensionExists();
```

## 排序、分组、Limit 与 Offset

### 排序

#### `orderBy` 方法

`orderBy` 方法允许你按指定列对查询结果进行排序。`orderBy` 方法接收的第一个参数是你希望排序的列，第二个参数决定排序方向，可以是 `asc` 或 `desc`：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->get();
```

要按多列排序，只需按需多次调用 `orderBy` 即可：

```php
$users = DB::table('users')
    ->orderBy('name', 'desc')
    ->orderBy('email', 'asc')
    ->get();
```

排序方向是可选的，默认为升序。如果希望按降序排序，可以为 `orderBy` 方法指定第二个参数，或者直接使用 `orderByDesc`：

```php
$users = DB::table('users')
    ->orderByDesc('verified_at')
    ->get();
```

最后，使用 `->` 运算符，你还可以按 JSON 列中某个值进行排序：

```php
$corporations = DB::table('corporations')
    ->where('country', 'US')
    ->orderBy('location->state')
    ->get();
```

#### `latest` 与 `oldest` 方法

`latest` 与 `oldest` 方法可以让你方便地按日期对结果进行排序。默认情况下，结果会按表的 `created_at` 列排序。你也可以传入希望排序的列名：

```php
$user = DB::table('users')
    ->latest()
    ->first();
```

#### 随机排序

`inRandomOrder` 方法可用于将查询结果随机排序。例如，你可以使用该方法随机取出一个用户：

```php
$randomUser = DB::table('users')
    ->inRandomOrder()
    ->first();
```

#### 移除已有排序

`reorder` 方法会移除之前已应用到查询的全部「order by」子句：

```php
$query = DB::table('users')->orderBy('name');

$unorderedUsers = $query->reorder()->get();
```

调用 `reorder` 方法时，你可以传入列名与排序方向，从而移除全部已有「order by」子句并为查询应用一个全新的排序：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorder('email', 'desc')->get();
```

为方便起见，你可以使用 `reorderDesc` 方法按降序重新排序查询结果：

```php
$query = DB::table('users')->orderBy('name');

$usersOrderedByEmail = $query->reorderDesc('email')->get();
```

### 分组

#### `groupBy` 与 `having` 方法

如你所料，`groupBy` 与 `having` 方法可用于对查询结果进行分组。`having` 方法的签名与 `where` 方法类似：

```php
$users = DB::table('users')
    ->groupBy('account_id')
    ->having('account_id', '>', 100)
    ->get();
```

你可以使用 `havingBetween` 方法按给定区间过滤结果：

```php
$report = DB::table('orders')
    ->selectRaw('count(id) as number_of_orders, customer_id')
    ->groupBy('customer_id')
    ->havingBetween('number_of_orders', [5, 15])
    ->get();
```

你也可以向 `groupBy` 方法传入多个参数，以按多列分组：

```php
$users = DB::table('users')
    ->groupBy('first_name', 'status')
    ->having('account_id', '>', 100)
    ->get();
```

要构造更高级的 `having` 语句，请参阅 havingRaw 方法。

### Limit 与 Offset

你可以使用 `limit` 与 `offset` 方法限制查询返回的结果数量，或在查询中跳过指定数量的结果：

```php
$users = DB::table('users')
    ->offset(10)
    ->limit(5)
    ->get();
```

## 条件子句

有时你希望根据其他条件决定是否向查询应用某些子句。例如，你可能希望仅在传入的 HTTP 请求中包含某个输入值时才应用 `where` 子句。可以使用 `when` 方法来实现：

```php
$role = $request->input('role');

$users = DB::table('users')
    ->when($role, function (Builder $query, string $role) {
        $query->where('role_id', $role);
    })
    ->get();
```

`when` 方法仅在第一个参数为 `true` 时执行给定的闭包。若第一个参数为 `false`，则不会执行该闭包。因此，在上面的示例中，传入 `when` 方法的闭包仅在请求中存在 `role` 字段且其值为真值时才会被调用。

你也可以向 `when` 方法传入第三个参数——另一个闭包。该闭包仅在第一个参数求值为 `false` 时执行。为说明该特性的用法，下面用它来配置查询的默认排序：

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

## Insert 语句

查询构造器还提供了 `insert` 方法，可用于向数据库表中插入记录。`insert` 方法接收一个由列名与值组成的数组：

```php
DB::table('users')->insert([
    'email' => 'kayla@example.com',
    'votes' => 0
]);
```

你可以通过传入一个二维数组来一次插入多条记录。数组中的每个子数组对应一条要插入的记录：

```php
DB::table('users')->insert([
    ['email' => 'picard@example.com', 'votes' => 0],
    ['email' => 'janeway@example.com', 'votes' => 0],
]);
```

`insertOrIgnore` 方法会在插入数据库记录时忽略错误。使用该方法时，请注意：重复记录错误会被忽略，其它类型的错误也可能被忽略，具体取决于数据库引擎。例如，`insertOrIgnore` 会 [绕过 MySQL 的严格模式](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution)：

```php
DB::table('users')->insertOrIgnore([
    ['id' => 1, 'email' => 'sisko@example.com'],
    ['id' => 2, 'email' => 'archer@example.com'],
]);
```

`insertUsing` 方法会在插入新记录时使用子查询来确定要插入的数据：

```php
DB::table('pruned_users')->insertUsing([
    'id', 'name', 'email', 'email_verified_at'
], DB::table('users')->select(
    'id', 'name', 'email', 'email_verified_at'
)->where('updated_at', '<=', now()->minus(months: 1)));
```

#### 自增 ID

如果表有自增 id，可以使用 `insertGetId` 方法插入一条记录并返回该记录的 ID：

```php
$id = DB::table('users')->insertGetId(
    ['email' => 'john@example.com', 'votes' => 0]
);
```

> [!WARNING]
> 在使用 PostgreSQL 时，`insertGetId` 方法要求自增列命名为 `id`。如果你希望从其他「sequence」中获取 ID，可以将列名作为第二个参数传给 `insertGetId` 方法。

### Upserts

`upsert` 方法会插入尚不存在的记录，并使用你指定的新值更新已存在的记录。方法的第一个参数是要插入或更新的值，第二个参数列出在关联表中能唯一标识记录的列，第三个（也是最后一个）参数是一个数组，列出当数据库中已存在匹配记录时应更新的列：

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

在上面的示例中，Laravel 会尝试插入两条记录。如果已存在 `departure` 与 `destination` 列值相同的记录，Laravel 会更新那条记录的 `price` 列。

> [!WARNING]
> 除 SQL Server 之外的所有数据库，都要求 `upsert` 方法的第二个参数中的列具有「primary」或「unique」索引。此外，MariaDB 与 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，并始终使用表的「primary」与「unique」索引来检测已存在的记录。

## Update 语句

除了向数据库插入记录外，查询构造器还可以使用 `update` 方法更新已有记录。`update` 方法与 `insert` 方法一样，接收一个由列与值组成的数组，用于指定要更新的列。`update` 方法返回受影响的行数。你可以使用 `where` 子句来限定 `update` 查询：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['votes' => 1]);
```

#### Update or Insert

有时你希望更新数据库中已存在的记录，如果不存在则创建一条新记录。这种场景下可以使用 `updateOrInsert` 方法。`updateOrInsert` 方法接收两个参数：一个用于查找记录的列与值对数组，以及一个用于指定要更新列与值的数组。

`updateOrInsert` 方法会先使用第一个参数中的列与值对来定位匹配的数据库记录。如果记录存在，则使用第二个参数中的值更新该记录。如果找不到记录，则会插入一条新记录，其属性由两个参数合并而成：

```php
DB::table('users')
    ->updateOrInsert(
        ['email' => 'john@example.com', 'name' => 'John'],
        ['votes' => '2']
    );
```

你也可以向 `updateOrInsert` 方法传入一个闭包，根据匹配记录是否存在，自定义要更新或插入到数据库中的属性：

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

### 更新 JSON 列

更新 JSON 列时，应使用 `->` 语法来更新 JSON 对象中对应的键。该操作在 MariaDB 10.3+、MySQL 5.7+ 与 PostgreSQL 9.5+ 上受支持：

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['options->enabled' => true]);
```

### 自增与自减

查询构造器还提供了便捷方法来对指定列的值进行自增或自减。这两个方法至少都接收一个参数——要修改的列。第二个参数是可选的，用于指定自增或自减的步长：

```php
DB::table('users')->increment('votes');

DB::table('users')->increment('votes', 5);

DB::table('users')->decrement('votes');

DB::table('users')->decrement('votes', 5);
```

如果需要，你还可以指定在自增或自减操作期间一并更新的其他列：

```php
DB::table('users')->increment('votes', 1, ['name' => 'John']);
```

此外，你还可以使用 `incrementEach` 与 `decrementEach` 方法一次对多个列进行自增或自减：

```php
DB::table('users')->incrementEach([
    'votes' => 5,
    'balance' => 100,
]);
```

## Delete 语句

查询构造器的 `delete` 方法可用于从表中删除记录。`delete` 方法返回受影响的行数。你可以在调用 `delete` 方法之前添加「where」子句来限定 `delete` 语句：

```php
$deleted = DB::table('users')->delete();

$deleted = DB::table('users')->where('votes', '>', 100)->delete();
```

## 悲观锁

查询构造器还包含一些函数，可帮助你在执行 `select` 语句时实现「悲观锁」。要使用「shared lock」执行语句，可以调用 `sharedLock` 方法。共享锁会阻止所选行被修改，直到事务提交：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->sharedLock()
    ->get();
```

你也可以使用 `lockForUpdate` 方法。「for update」锁会阻止所选记录被修改，或被另一个共享锁选中：

```php
DB::table('users')
    ->where('votes', '>', 100)
    ->lockForUpdate()
    ->get();
```

虽然不是必须的，但建议将悲观锁包在 [事务](/topic/Laravel%2013.x/kl9no87vz4.html) 内使用。这样可以保证所取出的数据在整个操作过程中始终不被未修改——若出现问题，事务会回滚所有更改并自动释放锁：

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

## 可复用的查询组件

如果你的应用中存在重复的查询逻辑，可以使用查询构造器的 `tap` 与 `pipe` 方法将逻辑提取为可复用对象。假设你的应用中有下面这两条不同的查询：

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

你可能希望把这两条查询中共用的目的地过滤逻辑提取为一个可复用对象：

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

然后，你可以使用查询构造器的 `tap` 方法将该对象的逻辑应用到查询上：

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

#### 查询管道

`tap` 方法始终会返回查询构造器。如果你希望提取一个会执行查询并返回另一个值的对象，可以使用 `pipe` 方法。

考虑以下查询对象，它包含整个应用中共享的 [分页](/topic/Laravel%2013.x/3xyq454vmq.html) 逻辑。与 `DestinationFilter` 不同的是（`DestinationFilter` 给查询添加查询条件），`Paginate` 对象会执行查询并返回一个分页器实例：

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

借助查询构造器的 `pipe` 方法，我们可以利用该对象应用共享的分页逻辑：

```php
$flights = DB::table('flights')
    ->tap(new DestinationFilter($destination))
    ->pipe(new Paginate);
```

## 调试

你可以在构建查询时使用 `dd` 与 `dump` 方法来打印当前的查询绑定与 SQL。`dd` 方法会输出调试信息并立即停止请求；`dump` 方法会输出调试信息但允许请求继续执行：

```php
DB::table('users')->where('votes', '>', 100)->dd();

DB::table('users')->where('votes', '>', 100)->dump();
```

可以在查询上调用 `dumpRawSql` 与 `ddRawSql` 方法，打印出所有参数绑定已被正确代入的 SQL：

```php
DB::table('users')->where('votes', '>', 100)->dumpRawSql();

DB::table('users')->where('votes', '>', 100)->ddRawSql();