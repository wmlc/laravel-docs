# 数据库：入门

- [简介](#introduction)
    - [配置](#configuration)
    - [读写连接](#read-and-write-connections)
- [运行 SQL 查询](#running-queries)
    - [使用多个数据库连接](#using-multiple-database-connections)
    - [监听查询事件](#listening-for-query-events)
    - [监控累计查询时间](#monitoring-cumulative-query-time)
- [数据库事务](#database-transactions)
- [连接数据库命令行](#connecting-to-the-database-cli)
- [检查数据库](#inspecting-your-databases)
- [监控数据库](#monitoring-your-databases)

<a name="introduction"></a>
## 简介

几乎所有现代 Web 应用都会与数据库交互。Laravel 通过原生 SQL、[流式查询构造器（Query Builder）](/docs/{{version}}/queries)以及 [Eloquent ORM](/docs/{{version}}/eloquent)，让多种受支持数据库的交互变得极为简单。目前，Laravel 为以下五种数据库提供了第一方支持：

- MariaDB 10.3+（[版本策略](https://mariadb.org/about/#maintenance-policy)）
- MySQL 5.7+（[版本策略](https://en.wikipedia.org/wiki/MySQL#Release_history)）
- PostgreSQL 10.0+（[版本策略](https://www.postgresql.org/support/versioning/)）
- SQLite 3.26.0+
- SQL Server 2017+（[版本策略](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server)）

此外，还可以通过 `mongodb/laravel-mongodb` 包来支持 MongoDB，该包由 MongoDB 官方维护。更多信息请查阅 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 文档。

<a name="configuration"></a>
### 配置

Laravel 数据库服务的配置位于应用的 `config/database.php` 配置文件中。在这个文件里，你可以定义所有数据库连接，并指定默认使用哪个连接。该文件中的大部分配置选项都由应用的环境变量值驱动。Laravel 所支持的多数数据库系统都在此文件中提供了配置示例。

默认情况下，Laravel 的示例[环境配置](/docs/{{version}}/configuration#environment-configuration)已可直接配合 [Laravel Sail](/docs/{{version}}/sail) 使用，Sail 是一套用于在本地机器上开发 Laravel 应用的 Docker 配置。当然，你也可以根据本地数据库的需要随意修改数据库配置。

<a name="sqlite-configuration"></a>
#### SQLite 配置

SQLite 数据库包含在文件系统上的单个文件中。你可以在终端中使用 `touch` 命令创建一个新的 SQLite 数据库：`touch database/database.sqlite`。创建数据库之后，只需将数据库的绝对路径放入 `DB_DATABASE` 环境变量，即可轻松配置环境变量指向该数据库：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

默认情况下，SQLite 连接启用了外键约束。如果想禁用外键约束，应当将 `DB_FOREIGN_KEYS` 环境变量设置为 `false`：

```ini
DB_FOREIGN_KEYS=false
```

> [!NOTE]
> 如果你使用 [Laravel 安装器](/docs/{{version}}/installation#creating-a-laravel-project)创建 Laravel 应用，并选择了 SQLite 作为数据库，Laravel 会自动创建 `database/database.sqlite` 文件，并为你运行默认的[数据库迁移](/docs/{{version}}/migrations)。

<a name="mssql-configuration"></a>
#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，你应当确保已安装 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖，例如 Microsoft SQL ODBC 驱动。

<a name="configuration-using-urls"></a>
#### 使用 URL 进行配置

通常，数据库连接使用 `host`、`database`、`username`、`password` 等多个配置值进行配置。这些配置值各自都有对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理多个环境变量。

一些托管数据库提供商（如 AWS 和 Heroku）会提供单个数据库 "URL"，用一个字符串包含数据库的全部连接信息。一个数据库 URL 示例如下：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这类 URL 通常遵循标准的模式约定：

```html
driver://username:password@host:port/database?options
```

为了方便起见，Laravel 支持使用这种 URL 来代替使用多个配置选项配置数据库。如果存在 `url`（或对应的环境变量 `DB_URL`）配置选项，Laravel 就会用它来提取数据库连接和凭据信息。

<a name="read-and-write-connections"></a>
### 读写连接

有时你可能希望 SELECT 语句使用一个数据库连接，而 INSERT、UPDATE 和 DELETE 语句使用另一个。Laravel 让这件事轻而易举，无论你使用原生查询、查询构造器还是 Eloquent ORM，都会始终使用正确的连接。

要了解读写连接应该如何配置，我们来看下面这个例子：

```php
'mysql' => [
    'driver' => 'mysql',
    
    'read' => [
        'host' => [
            '192.168.1.1',
            '196.168.1.2',
        ],
    ],
    'write' => [
        'host' => [
            '192.168.1.3',
        ],
    ],
    'sticky' => true,
    
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'laravel'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => env('DB_CHARSET', 'utf8mb4'),
    'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        (PHP_VERSION_ID >= 80500 ? \Pdo\Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
```

请注意，配置数组中新增了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 键的值为数组，其中只包含一个键：`host`。`read` 和 `write` 连接的其余数据库选项将从主 `mysql` 配置数组中合并而来。

只有当你想覆盖主 `mysql` 数组中的值时，才需要在 `read` 和 `write` 数组中放置条目。因此，在本例中，`192.168.1.1` 会作为"读"（read）连接的主机，而 `192.168.1.3` 会用于"写"（write）连接。主 `mysql` 数组中的数据库凭据、前缀、字符集以及所有其他选项会在两个连接之间共享。当 `host` 配置数组中存在多个值时，每个请求都会随机选择一个数据库主机。

<a name="the-sticky-option"></a>
#### `sticky` 选项

`sticky` 选项是一个*可选*值，可用于允许立即读取当前请求周期内写入数据库的记录。如果启用了 `sticky` 选项，并且在当前请求周期内对数据库执行过"写"操作，那么后续的所有"读"操作都会使用"写"连接。这样可以确保在请求周期内写入的任何数据，都能在同一请求期间立即从数据库中读回。是否需要这种行为，由你自己决定。

<a name="running-queries"></a>
## 运行 SQL 查询

配置好数据库连接之后，你就可以使用 `DB` Facade 来运行查询了。`DB` Facade 为每种类型的查询都提供了方法：`select`、`update`、`insert`、`delete` 和 `statement`。

<a name="running-a-select-query"></a>
#### 运行 Select 查询

要运行一条基本的 SELECT 查询，可以使用 `DB` Facade 的 `select` 方法：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示应用所有用户的列表。
     */
    public function index(): View
    {
        $users = DB::select('select * from users where active = ?', [1]);

        return view('user.index', ['users' => $users]);
    }
}
```

传给 `select` 方法的第一个参数是 SQL 查询语句，第二个参数是需要绑定到查询上的参数绑定。通常，这些就是 `where` 子句约束的值。参数绑定可以防范 SQL 注入。

`select` 方法总是返回一个结果 `array`。数组中的每个结果都是一个代表数据库记录的 PHP `stdClass` 对象：

```php
use Illuminate\Support\Facades\DB;

$users = DB::select('select * from users');

foreach ($users as $user) {
    echo $user->name;
}
```

<a name="selecting-scalar-values"></a>
#### 查询标量值

有时数据库查询的结果可能是单个标量值。Laravel 允许你使用 `scalar` 方法直接获取该值，而无需先从记录对象中取出查询的标量结果：

```php
$burgers = DB::scalar(
    "select count(case when food = 'burger' then 1 end) as burgers from menu"
);
```

<a name="selecting-multiple-result-sets"></a>
#### 查询多个结果集

如果你的应用调用的存储过程会返回多个结果集，可以使用 `selectResultSets` 方法来获取存储过程返回的所有结果集：

```php
[$options, $notifications] = DB::selectResultSets(
    "CALL get_user_options_and_notifications(?)", $request->user()->id
);
```

<a name="using-named-bindings"></a>
#### 使用命名绑定

除了使用 `?` 表示参数绑定之外，你还可以使用命名绑定来执行查询：

```php
$results = DB::select('select * from users where id = :id', ['id' => 1]);
```

<a name="running-an-insert-statement"></a>
#### 运行 Insert 语句

要执行 `insert` 语句，可以使用 `DB` Facade 的 `insert` 方法。与 `select` 一样，该方法第一个参数为 SQL 查询语句，第二个参数为绑定参数：

```php
use Illuminate\Support\Facades\DB;

DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

<a name="running-an-update-statement"></a>
#### 运行 Update 语句

`update` 方法用于更新数据库中的现有记录。该方法会返回受该语句影响的行数：

```php
use Illuminate\Support\Facades\DB;

$affected = DB::update(
    'update users set votes = 100 where name = ?',
    ['Anita']
);
```

<a name="running-a-delete-statement"></a>
#### 运行 Delete 语句

`delete` 方法用于从数据库中删除记录。与 `update` 一样，该方法会返回受影响的行数：

```php
use Illuminate\Support\Facades\DB;

$deleted = DB::delete('delete from users');
```

<a name="running-a-general-statement"></a>
#### 迧行通用语句

有些数据库语句不会返回任何值。对于这类操作，你可以使用 `DB` Facade 的 `statement` 方法：

```php
DB::statement('drop table users');
```

<a name="running-an-unprepared-statement"></a>
#### 运行未预处理的语句

有时你可能想执行一条不绑定任何值的 SQL 语句。这时可以使用 `DB` Facade 的 `unprepared` 方法：

```php
DB::unprepared('update users set votes = 100 where name = "Dries"');
```

> [!WARNING]
> 未预处理的语句不绑定参数，因此容易受到 SQL 注入攻击。切勿在未预处理的语句中使用用户可控的值。

<a name="implicit-commits-in-transactions"></a>
#### 隐式提交

在事务中使用 `DB` Facade 的 `statement` 和 `unprepared` 方法时，你必须小心避免那些会导致[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句会让数据库引擎间接提交整个事务，导致 Laravel 无法感知数据库的事务级别。这类语句的一个例子是创建数据库表：

```php
DB::unprepared('create table a (col varchar(1) null)');
```

请查阅 MySQL 手册中[触发隐式提交的全部语句列表](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)。

<a name="using-multiple-database-connections"></a>
### 使用多个数据库连接

如果你的应用在 `config/database.php` 配置文件中定义了多个连接，可以通过 `DB` Facade 提供的 `connection` 方法访问每个连接。传给 `connection` 方法的连接名，应当对应 `config/database.php` 配置文件中列出的某个连接，或使用 `config` 辅助函数在运行时配置的连接：

```php
use Illuminate\Support\Facades\DB;

$users = DB::connection('sqlite')->select(/* ... */);
```

你可以使用连接实例上的 `getPdo` 方法来访问连接底层原始的 PDO 实例：

```php
$pdo = DB::connection()->getPdo();
```

<a name="listening-for-query-events"></a>
### 监听查询事件

如果你想为应用执行的每条 SQL 指定一个要调用的闭包，可以使用 `DB` Facade 的 `listen` 方法。该方法对于记录查询日志或调试非常有用。你可以在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中注册查询监听器闭包：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        DB::listen(function (QueryExecuted $query) {
            // $query->sql;
            // $query->bindings;
            // $query->time;
            // $query->toRawSql();
        });
    }
}
```

<a name="monitoring-cumulative-query-time"></a>
### 监控累计查询时间

现代 Web 应用常见的性能瓶颈，是花在数据库查询上的时间。好在，当 Laravel 在单次请求中花费过多时间查询数据库时，它可以调用你指定的闭包或回调。要开始使用，请向 `whenQueryingForLongerThan` 方法提供一个查询时间阈值（单位为毫秒）和一个闭包。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Events\QueryExecuted;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
            // 通知开发团队...
        });
    }
}
```

<a name="database-transactions"></a>
## 数据库事务

你可以使用 `DB` Facade 提供的 `transaction` 方法，在数据库事务中运行一组操作。如果事务闭包中抛出了异常，事务会自动回滚，并将异常重新抛出。如果闭包执行成功，事务则会自动提交。使用 `transaction` 方法时，你无需担心手动回滚或提交：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
});
```

<a name="handling-deadlocks"></a>
#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，用于定义发生死锁时事务应重试的次数。重试次数耗尽后，将抛出异常：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
}, attempts: 5);
```

<a name="manually-using-transactions"></a>
#### 手动使用事务

如果你想手动开启事务，完全掌控回滚和提交，可以使用 `DB` Facade 提供的 `beginTransaction` 方法：

```php
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
```

你可以通过 `rollBack` 方法回滚事务：

```php
DB::rollBack();
```

最后，你可以通过 `commit` 方法提交事务：

```php
DB::commit();
```

> [!NOTE]
> `DB` Facade 的事务方法同时控制[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的事务。

<a name="connecting-to-the-database-cli"></a>
## 连接数据库命令行

如果想连接到数据库的命令行（CLI），可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如有需要，你可以指定数据库连接名，来连接非默认连接的数据库：

```shell
php artisan db mysql
```

<a name="inspecting-your-databases"></a>
## 检查数据库

使用 `db:show` 和 `db:table` Artisan 命令，你可以深入了解数据库及其关联表的宝贵信息。要查看数据库的概况，包括其大小、类型、打开的连接数以及数据表摘要，可以使用 `db:show` 命令：

```shell
php artisan db:show
```

你可以通过 `--database` 选项向命令提供数据库连接名，指定要检查哪个数据库连接：

```shell
php artisan db:show --database=pgsql
```

如果想在命令输出中包含表的行数和数据库视图的详情，可以分别提供 `--counts` 和 `--views` 选项。在大型数据库上，获取行数和视图详情可能会比较慢：

```shell
php artisan db:show --counts --views
```

此外，你还可以使用以下 `Schema` 方法来检查数据库：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```

如果想检查非应用默认连接的数据库连接，可以使用 `connection` 方法：

```php
$columns = Schema::connection('sqlite')->getColumns('users');
```

<a name="table-overview"></a>
#### 数据表概览

如果想查看数据库中单个数据表的概览，可以执行 `db:table` Artisan 命令。该命令会提供数据库表的整体概览，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

<a name="monitoring-your-databases"></a>
## 监控数据库

使用 `db:monitor` Artisan 命令，你可以让 Laravel 在数据库管理的打开连接数超过指定数量时，派发 `Illuminate\Database\Events\DatabaseBusy` 事件。

首先，你应当调度 `db:monitor` 命令[每分钟运行一次](/docs/{{version}}/scheduling)。该命令接受你希望监控的数据库连接配置的名称，以及派发事件前可容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅仅调度该命令并不足以触发通知来提醒你打开连接的数量。当命令遇到某个数据库的打开连接数超过你的阈值时，会派发一个 `DatabaseBusy` 事件。你应当在应用的 `AppServiceProvider` 中监听该事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\DatabaseApproachingMaxConnections;
use Illuminate\Database\Events\DatabaseBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Event::listen(function (DatabaseBusy $event) {
        Notification::route('mail', 'dev@example.com')
            ->notify(new DatabaseApproachingMaxConnections(
                $event->connectionName,
                $event->connections
            ));
    });
}
```
