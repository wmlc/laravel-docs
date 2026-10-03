# 数据库：入门

- [简介](#introduction)
    - [配置](#configuration)
    - [读写连接](#read-and-write-connections)
- [运行 SQL 查询](#running-queries)
    - [使用多个数据库连接](#using-multiple-database-connections)
    - [监听查询事件](#listening-for-query-events)
    - [监控累计查询时间](#monitoring-cumulative-query-time)
- [数据库事务](#database-transactions)
- [连接到数据库 CLI](#connecting-to-the-database-cli)
- [检查数据库](#inspecting-your-databases)
- [监控数据库](#monitoring-your-databases)

<a name="introduction"></a>
## 简介

几乎每个现代 Web 应用都会与数据库交互。Laravel 让数据库交互变得极其简单，支持多种数据库，可使用原生 SQL、[流畅的查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent)。目前，Laravel 为以下五种数据库提供第一方支持：

<div class="content-list" markdown="1">

- MariaDB 10.3+（[版本策略](https://mariadb.org/about/#maintenance-policy)）
- MySQL 5.7+（[版本策略](https://en.wikipedia.org/wiki/MySQL#Release_history)）
- PostgreSQL 10.0+（[版本策略](https://www.postgresql.org/support/versioning/)）
- SQLite 3.8.8+
- SQL Server 2017+（[版本策略](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server)）

</div>

<a name="configuration"></a>
### 配置

Laravel 数据库服务的配置位于应用的 `config/database.php` 配置文件中。在此文件中，你可以定义所有数据库连接，并指定默认使用的连接。此文件中的大部分配置选项由应用的环境变量值驱动。文件中提供了 Laravel 支持的大多数数据库系统的示例配置。

默认情况下，Laravel 的示例[环境配置](/docs/{{version}}/configuration#environment-configuration)已可直接用于 [Laravel Sail](/docs/{{version}}/sail)，这是一个用于在本地机器上开发 Laravel 应用的 Docker 配置。不过，你可以根据本地数据库的需要自由修改数据库配置。

<a name="sqlite-configuration"></a>
#### SQLite 配置

SQLite 数据库包含在文件系统上的单个文件中。你可以在终端中使用 `touch` 命令创建一个新的 SQLite 数据库：`touch database/database.sqlite`。创建数据库后，你可以轻松地配置环境变量指向该数据库，将数据库的绝对路径放入 `DB_DATABASE` 环境变量即可：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

要为 SQLite 连接启用外键约束，应将 `DB_FOREIGN_KEYS` 环境变量设置为 `true`：

```ini
DB_FOREIGN_KEYS=true
```

<a name="mssql-configuration"></a>
#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，应确保已安装 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖项，例如 Microsoft SQL ODBC 驱动。

<a name="configuration-using-urls"></a>
#### 使用 URL 配置

通常，数据库连接使用多个配置值进行配置，如 `host`、`database`、`username`、`password` 等。每个配置值都有其对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理多个环境变量。

一些托管数据库提供商（如 AWS 和 Heroku）提供单个数据库"URL"，在一个字符串中包含数据库的所有连接信息。示例数据库 URL 可能如下所示：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这些 URL 通常遵循标准的 schema 约定：

```html
driver://username:password@host:port/database?options
```

为方便起见，Laravel 支持将这些 URL 作为使用多个配置选项配置数据库的替代方案。如果存在 `url`（或对应的 `DATABASE_URL` 环境变量）配置选项，将使用它来提取数据库连接和凭据信息。

<a name="read-and-write-connections"></a>
### 读写连接

有时你可能希望对 SELECT 语句使用一个数据库连接，而对 INSERT、UPDATE 和 DELETE 语句使用另一个连接。Laravel 让这一切变得轻而易举，无论你使用原生查询、查询构造器还是 Eloquent ORM，始终都会使用正确的连接。

要了解读写连接应如何配置，让我们看这个示例：

    'mysql' => [
        'read' => [
            'host' => [
                '192.168.1.1',
                '196.168.1.2',
            ],
        ],
        'write' => [
            'host' => [
                '196.168.1.3',
            ],
        ],
        'sticky' => true,
        'driver' => 'mysql',
        'database' => 'database',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
    ],

注意，配置数组中添加了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 键的数组值包含一个键：`host`。`read` 和 `write` 连接的其余数据库选项将从主 `mysql` 配置数组合并而来。

只需在 `read` 和 `write` 数组中放置希望覆盖主 `mysql` 数组值的项。因此，在本例中，`192.168.1.1` 将用作"读"连接的 host，而 `192.168.1.3` 将用作"写"连接的 host。主 `mysql` 数组中的数据库凭据、前缀、字符集和所有其他选项将在两个连接之间共享。当 `host` 配置数组中存在多个值时，将为每个请求随机选择一个数据库 host。

<a name="the-sticky-option"></a>
#### `sticky` 选项

`sticky` 选项是一个*可选*值，可用于允许立即读取在当前请求周期内写入数据库的记录。如果启用了 `sticky` 选项，并且在当前请求周期内对数据库执行了"写"操作，则任何后续的"读"操作都将使用"写"连接。这确保了在请求周期内写入的任何数据都可以在同一请求期间立即从数据库读回。是否为你的应用采用此行为，由你自行决定。

<a name="running-queries"></a>
## 运行 SQL 查询

配置好数据库连接后，你可以使用 `DB` Facade 运行查询。`DB` Facade 为每种类型的查询提供了方法：`select`、`update`、`insert`、`delete` 和 `statement`。

<a name="running-a-select-query"></a>
#### 运行 Select 查询

要运行基本的 SELECT 查询，可以使用 `DB` Facade 的 `select` 方法：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Support\Facades\DB;

    class UserController extends Controller
    {
        /**
         * 显示所有应用用户的列表。
         *
         * @return \Illuminate\Http\Response
         */
        public function index()
        {
            $users = DB::select('select * from users where active = ?', [1]);

            return view('user.index', ['users' => $users]);
        }
    }

传递给 `select` 方法的第一个参数是 SQL 查询，第二个参数是需要绑定到查询的参数绑定。通常，这些是 `where` 子句约束的值。参数绑定提供了针对 SQL 注入的保护。

`select` 方法将始终返回结果 `array`。数组中的每个结果都是一个 PHP `stdClass` 对象，表示数据库中的一条记录：

    use Illuminate\Support\Facades\DB;

    $users = DB::select('select * from users');

    foreach ($users as $user) {
        echo $user->name;
    }

<a name="selecting-scalar-values"></a>
#### 选择标量值

有时数据库查询可能返回单个标量值。Laravel 允许你使用 `scalar` 方法直接获取此值，而无需从记录对象中获取查询的标量结果：

    $burgers = DB::scalar(
        "select count(case when food = 'burger' then 1 end) as burgers from menu"
    );

<a name="using-named-bindings"></a>
#### 使用命名绑定

除了使用 `?` 表示参数绑定外，你还可以使用命名绑定执行查询：

    $results = DB::select('select * from users where id = :id', ['id' => 1]);

<a name="running-an-insert-statement"></a>
#### 运行 Insert 语句

要执行 `insert` 语句，可以使用 `DB` Facade 的 `insert` 方法。与 `select` 一样，此方法接受 SQL 查询作为第一个参数，绑定作为第二个参数：

    use Illuminate\Support\Facades\DB;

    DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);

<a name="running-an-update-statement"></a>
#### 运行 Update 语句

应使用 `update` 方法更新数据库中的现有记录。方法返回受语句影响的行数：

    use Illuminate\Support\Facades\DB;

    $affected = DB::update(
        'update users set votes = 100 where name = ?',
        ['Anita']
    );

<a name="running-a-delete-statement"></a>
#### 运行 Delete 语句

应使用 `delete` 方法从数据库删除记录。与 `update` 一样，方法将返回受影响的行数：

    use Illuminate\Support\Facades\DB;

    $deleted = DB::delete('delete from users');

<a name="running-a-general-statement"></a>
#### 运行通用语句

某些数据库语句不返回任何值。对于这些类型的操作，可以使用 `DB` Facade 的 `statement` 方法：

    DB::statement('drop table users');

<a name="running-an-unprepared-statement"></a>
#### 运行未预处理的语句

有时你可能希望执行不绑定任何值的 SQL 语句。可以使用 `DB` Facade 的 `unprepared` 方法来实现：

    DB::unprepared('update users set votes = 100 where name = "Dries"');

> **Warning**
> 由于未预处理的语句不绑定参数，可能容易受到 SQL 注入攻击。切勿在未预处理的语句中允许用户可控的值。

<a name="implicit-commits-in-transactions"></a>
#### 隐式提交

在事务中使用 `DB` Facade 的 `statement` 和 `unprepared` 方法时，必须小心避免会导致[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句会导致数据库引擎间接提交整个事务，使 Laravel 无法感知数据库的事务级别。此类语句的一个示例是创建数据库表：

    DB::unprepared('create table a (col varchar(1) null)');

请参阅 MySQL 手册中[触发隐式提交的所有语句列表](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)。

<a name="using-multiple-database-connections"></a>
### 使用多个数据库连接

如果你的应用在 `config/database.php` 配置文件中定义了多个连接，可以通过 `DB` Facade 提供的 `connection` 方法访问每个连接。传递给 `connection` 方法的连接名称应对应 `config/database.php` 配置文件中列出的某个连接，或在运行时使用 `config` 辅助函数配置的连接：

    use Illuminate\Support\Facades\DB;

    $users = DB::connection('sqlite')->select(/* ... */);

可以使用连接实例的 `getPdo` 方法访问连接的原始底层 PDO 实例：

    $pdo = DB::connection()->getPdo();

<a name="listening-for-query-events"></a>
### 监听查询事件

如果你想为应用执行的每个 SQL 查询指定一个被调用的闭包，可以使用 `DB` Facade 的 `listen` 方法。此方法可用于记录查询或调试。你可以在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中注册查询监听器闭包：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         *
         * @return void
         */
        public function register()
        {
            //
        }

        /**
         * 引导任何应用服务。
         *
         * @return void
         */
        public function boot()
        {
            DB::listen(function ($query) {
                // $query->sql;
                // $query->bindings;
                // $query->time;
            });
        }
    }

<a name="monitoring-cumulative-query-time"></a>
### 监控累计查询时间

现代 Web 应用的一个常见性能瓶颈是查询数据库所花费的时间。幸运的是，当 Laravel 在单个请求中花费过多时间查询数据库时，可以调用你选择的闭包或回调。首先，向 `whenQueryingForLongerThan` 方法提供一个查询时间阈值（毫秒）和闭包。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用此方法：

    <?php

    namespace App\Providers;

    use Illuminate\Database\Connection;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\Database\Events\QueryExecuted;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         *
         * @return void
         */
        public function register()
        {
            //
        }

        /**
         * 引导任何应用服务。
         *
         * @return void
         */
        public function boot()
        {
            DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
                // 通知开发团队...
            });
        }
    }

<a name="database-transactions"></a>
## 数据库事务

可以使用 `DB` Facade 提供的 `transaction` 方法在数据库事务中运行一组操作。如果事务闭包内抛出异常，事务将自动回滚并重新抛出异常。如果闭包执行成功，事务将自动提交。使用 `transaction` 方法时，你无需担心手动回滚或提交：

    use Illuminate\Support\Facades\DB;

    DB::transaction(function () {
        DB::update('update users set votes = 1');

        DB::delete('delete from posts');
    });

<a name="handling-deadlocks"></a>
#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，定义发生死锁时事务应重试的次数。一旦这些尝试耗尽，将抛出异常：

    use Illuminate\Support\Facades\DB;

    DB::transaction(function () {
        DB::update('update users set votes = 1');

        DB::delete('delete from posts');
    }, 5);

<a name="manually-using-transactions"></a>
#### 手动使用事务

如果你想手动开始事务并完全控制回滚和提交，可以使用 `DB` Facade 提供的 `beginTransaction` 方法：

    use Illuminate\Support\Facades\DB;

    DB::beginTransaction();

可以通过 `rollBack` 方法回滚事务：

    DB::rollBack();

最后，可以通过 `commit` 方法提交事务：

    DB::commit();

> **Note**
> `DB` Facade 的事务方法同时控制[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的事务。

<a name="connecting-to-the-database-cli"></a>
## 连接到数据库 CLI

如果你想连接到数据库的 CLI，可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如果需要，可以指定数据库连接名称，连接到非默认的数据库连接：

```shell
php artisan db mysql
```

<a name="inspecting-your-databases"></a>
## 检查数据库

使用 `db:show` 和 `db:table` Artisan 命令，你可以获取有关数据库及其关联表的有价值信息。要查看数据库的概览，包括其大小、类型、打开连接数以及表的摘要，可以使用 `db:show` 命令：

```shell
php artisan db:show
```

可以通过 `--database` 选项向命令提供数据库连接名称，指定要检查的数据库连接：

```shell
php artisan db:show --database=pgsql
```

如果希望在命令输出中包含表行数和数据库视图详细信息，可以分别提供 `--counts` 和 `--views` 选项。对于大型数据库，获取行数和视图详细信息可能较慢：

```shell
php artisan db:show --counts --views
```

<a name="table-overview"></a>
#### 表概览

如果想获取数据库中单个表的概览，可以执行 `db:table` Artisan 命令。此命令提供数据库表的总体概览，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

<a name="monitoring-your-databases"></a>
## 监控数据库

使用 `db:monitor` Artisan 命令，你可以指示 Laravel 在数据库管理的打开连接数超过指定数量时分发 `Illuminate\Database\Events\DatabaseBusy` 事件。

首先，你应该调度 `db:monitor` 命令[每分钟运行](/docs/{{version}}/scheduling)。该命令接受你希望监控的数据库连接配置名称，以及在分发事件之前应容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅调度此命令不足以触发通知来提醒你打开连接数。当命令遇到打开连接数超过阈值的数据库时，将分发 `DatabaseBusy` 事件。你应在应用的 `EventServiceProvider` 中监听此事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\DatabaseApproachingMaxConnections;
use Illuminate\Database\Events\DatabaseBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 为应用注册任何其他事件。
 *
 * @return void
 */
public function boot()
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
