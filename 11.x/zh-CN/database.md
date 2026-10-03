# 数据库：入门

- [简介](#introduction)
    - [配置](#configuration)
    - [读连接与写连接](#read-and-write-connections)
- [执行 SQL 查询](#running-queries)
    - [使用多个数据库连接](#using-multiple-database-connections)
    - [监听查询事件](#listening-for-query-events)
    - [监控查询累计耗时](#monitoring-cumulative-query-time)
- [数据库事务](#database-transactions)
- [连接到数据库 CLI](#connecting-to-the-database-cli)
- [检查你的数据库](#inspecting-your-databases)
- [监控你的数据库](#monitoring-your-databases)

<a name="introduction"></a>
## 简介

几乎每个现代 Web 应用都会与数据库交互。Laravel 通过原生 SQL、[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent)，让各种受支持的数据库交互变得极其简单。目前，Laravel 官方支持以下五种数据库：

<div class="content-list" markdown="1">

- MariaDB 10.3+（[版本策略](https://mariadb.org/about/#maintenance-policy)）
- MySQL 5.7+（[版本策略](https://en.wikipedia.org/wiki/MySQL#Release_history)）
- PostgreSQL 10.0+（[版本策略](https://www.postgresql.org/support/versioning/)）
- SQLite 3.26.0+
- SQL Server 2017+（[版本策略](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server)）

</div>

此外，通过由 MongoDB 官方维护的 `mongodb/laravel-mongodb` 包，你还可以使用 MongoDB。更多信息请查看 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 文档。

<a name="configuration"></a>
### 配置

Laravel 数据库服务的配置位于应用的 `config/database.php` 配置文件中。在这个文件里，你可以定义所有数据库连接，并指定默认使用哪个连接。该文件中的大多数配置项都由应用的环境变量值驱动。文件中还提供了 Laravel 支持的大多数数据库系统的示例。

默认情况下，Laravel 示例的[环境配置](/docs/{{version}}/configuration#environment-configuration)已可直接配合 [Laravel Sail](/docs/{{version}}/sail) 使用，后者是一套用于在本地开发 Laravel 应用的 Docker 配置。不过，你可以自由地根据本地数据库需要修改数据库配置。

<a name="sqlite-configuration"></a>
#### SQLite 配置

SQLite 数据库保存在文件系统的单个文件中。你可以在终端里使用 `touch` 命令创建新的 SQLite 数据库：`touch database/database.sqlite`。数据库创建完成后，只需把数据库的绝对路径写入 `DB_DATABASE` 环境变量，即可轻松把环境变量指向该数据库：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

默认情况下，SQLite 连接会启用外键约束。如果你想禁用它们，应把 `DB_FOREIGN_KEYS` 环境变量设为 `false`：

```ini
DB_FOREIGN_KEYS=false
```

> [!NOTE]
> 如果你使用 [Laravel 安装器](/docs/{{version}}/installation#creating-a-laravel-project) 创建 Laravel 应用并选择 SQLite 作为数据库，Laravel 会自动为你创建 `database/database.sqlite` 文件并运行默认的[数据库迁移](/docs/{{version}}/migrations)。

<a name="mssql-configuration"></a>
#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，你需要确保已安装 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖，例如 Microsoft SQL ODBC 驱动。

<a name="configuration-using-urls"></a>
#### 使用 URL 进行配置

通常，数据库连接通过 `host`、`database`、`username`、`password` 等多个配置值来配置。每个配置值都有对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理多个环境变量。

AWS 和 Heroku 等一些托管数据库服务商会提供一个数据库"URL"，用单个字符串包含数据库的全部连接信息。数据库 URL 的示例可能如下所示：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这类 URL 通常遵循标准 schema 约定：

```html
driver://username:password@host:port/database?options
```

为方便起见，Laravel 支持使用这类 URL，作为使用多个配置项配置数据库的替代方案。如果存在 `url`（或对应的 `DB_URL` 环境变量）配置项，Laravel 将使用它来提取数据库连接信息和凭据信息。

<a name="read-and-write-connections"></a>
### 读连接与写连接

有时你可能希望用一个数据库连接处理 SELECT 语句，另一个连接处理 INSERT、UPDATE 和 DELETE 语句。Laravel 让这件事变得轻而易举。无论你使用原生查询、查询构造器还是 Eloquent ORM，都会始终使用正确的连接。

要了解读连接与写连接应如何配置，我们来看这个示例：

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
            PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
        ]) : [],
    ],

请注意，配置数组中新增了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 键的数组值都只包含一个键：`host`。`read` 与 `write` 连接的其余数据库选项将从容器的 `mysql` 主配置数组合并而来。

只有当你希望覆盖主 `mysql` 数组中的值时，才需要往 `read` 和 `write` 数组里放内容。因此在上面的例子中，`192.168.1.1` 将作为"读"连接的主机，而 `196.168.1.3` 将作为"写"连接的主机。主 `mysql` 数组中的数据库凭据、前缀、字符集以及其他所有选项都由两个连接共享。当 `host` 配置数组中存在多个值时，每个请求都会随机选择一个数据库主机。

<a name="the-sticky-option"></a>
#### `sticky` 选项

`sticky` 是一个*可选*值，用于允许立即读取当前请求周期内已写入数据库的记录。如果启用 `sticky` 选项，且在当前请求周期内对数据库执行过"写"操作，那么后续任何"读"操作都会使用"写"连接。这确保了请求周期内写入的数据能够在同一个请求中立即从数据库读回。是否需要这一行为，由你自己决定。

<a name="running-queries"></a>
## 执行 SQL 查询

配置好数据库连接后，你可以使用 `DB` Facade 执行查询。`DB` Facade 为每种类型的查询都提供了对应方法：`select`、`update`、`insert`、`delete` 和 `statement`。

<a name="running-a-select-query"></a>
#### 执行 Select 查询

要执行基本的 SELECT 查询，可以在 `DB` Facade 上使用 `select` 方法：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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

传给 `select` 方法的第一个参数是 SQL 查询，第二个参数是需要绑定到查询上的参数。这些参数通常是 `where` 子句约束的值。参数绑定可以防止 SQL 注入。

`select` 方法总会返回一个由结果组成的 `array` 数组。数组中的每条结果都是一个 PHP `stdClass` 对象，代表数据库中的一条记录：

    use Illuminate\Support\Facades\DB;

    $users = DB::select('select * from users');

    foreach ($users as $user) {
        echo $user->name;
    }

<a name="selecting-scalar-values"></a>
#### 查询标量值

有时数据库查询的结果是一个标量值。这种情况下，你不必从记录对象中取出查询的标量结果，Laravel 允许你直接使用 `scalar` 方法获取该值：

    $burgers = DB::scalar(
        "select count(case when food = 'burger' then 1 end) as burgers from menu"
    );

<a name="selecting-multiple-result-sets"></a>
#### 查询多个结果集

如果你的应用调用了返回多个结果集的存储过程，可以使用 `selectResultSets` 方法获取该存储过程返回的所有结果集：

    [$options, $notifications] = DB::selectResultSets(
        "CALL get_user_options_and_notifications(?)", $request->user()->id
    );

<a name="using-named-bindings"></a>
#### 使用命名绑定

除了用 `?` 表示参数绑定之外，你还可以使用命名绑定来执行查询：

    $results = DB::select('select * from users where id = :id', ['id' => 1]);

<a name="running-an-insert-statement"></a>
#### 执行 Insert 语句

要执行 `insert` 语句，可以在 `DB` Facade 上使用 `insert` 方法。与 `select` 一样，该方法的第一个参数接受 SQL 查询，第二个参数接受绑定参数：

    use Illuminate\Support\Facades\DB;

    DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);

<a name="running-an-update-statement"></a>
#### 执行 Update 语句

`update` 方法用于更新数据库中已有的记录。该方法会返回受该语句影响的行数：

    use Illuminate\Support\Facades\DB;

    $affected = DB::update(
        'update users set votes = 100 where name = ?',
        ['Anita']
    );

<a name="running-a-delete-statement"></a>
#### 执行 Delete 语句

`delete` 方法用于从数据库中删除记录。与 `update` 一样，该方法会返回受影响的行数：

    use Illuminate\Support\Facades\DB;

    $deleted = DB::delete('delete from users');

<a name="running-a-general-statement"></a>
#### 执行通用语句

有些数据库语句不返回任何值。对于这类操作，可以在 `DB` Facade 上使用 `statement` 方法：

    DB::statement('drop table users');

<a name="running-an-unprepared-statement"></a>
#### 执行 unprepared 语句

有时你可能想执行不绑定任何值的 SQL 语句。这时可以使用 `DB` Facade 的 `unprepared` 方法：

    DB::unprepared('update users set votes = 100 where name = "Dries"');

> [!WARNING]
> 由于 unprepared 语句不绑定参数，它们可能存在 SQL 注入风险。你绝不应允许用户可控的值出现在 unprepared 语句中。

<a name="implicit-commits-in-transactions"></a>
#### 隐式提交

在事务中使用 `DB` Facade 的 `statement` 和 `unprepared` 方法时，你必须小心避开那些会触发[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句会让数据库引擎间接提交整个事务，使 Laravel 感知不到数据库的事务级别。创建数据库表就是这样一条语句：

    DB::unprepared('create table a (col varchar(1) null)');

有关触发隐式提交的[全部语句列表](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)，请参阅 MySQL 手册。

<a name="using-multiple-database-connections"></a>
### 使用多个数据库连接

如果你的应用在 `config/database.php` 配置文件中定义了多个连接，可以通过 `DB` Facade 提供的 `connection` 方法访问每个连接。传给 `connection` 方法的连接名，应当对应 `config/database.php` 配置文件中列出的某个连接，或是运行时通过 `config` 辅助函数配置的连接：

    use Illuminate\Support\Facades\DB;

    $users = DB::connection('sqlite')->select(/* ... */);

你可以在连接实例上使用 `getPdo` 方法访问底层原始的 PDO 实例：

    $pdo = DB::connection()->getPdo();

<a name="listening-for-query-events"></a>
### 监听查询事件

如果你想为应用执行的每条 SQL 查询指定一个回调闭包，可以使用 `DB` Facade 的 `listen` 方法。该方法对记录查询日志或调试很有用。你可以在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中注册查询监听闭包：

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

<a name="monitoring-cumulative-query-time"></a>
### 监控查询累计耗时

现代 Web 应用常见的性能瓶颈，是花在查询数据库上的时间。幸运的是，当 Laravel 在单个请求中查询数据库耗时过长时，它可以调用你指定的闭包或回调。要开始使用，只需向 `whenQueryingForLongerThan` 方法提供一个查询耗时阈值（以毫秒计）和闭包。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

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

<a name="database-transactions"></a>
## 数据库事务

你可以使用 `DB` Facade 提供的 `transaction` 方法，在一个数据库事务中执行一组操作。如果事务闭包内抛出异常，事务会自动回滚，并重新抛出该异常。如果闭包成功执行，事务会自动提交。使用 `transaction` 方法时，你无需操心手动回滚或提交：

    use Illuminate\Support\Facades\DB;

    DB::transaction(function () {
        DB::update('update users set votes = 1');

        DB::delete('delete from posts');
    });

<a name="handling-deadlocks"></a>
#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，用于定义发生死锁时事务应重试的次数。一旦这些重试次数耗尽，就会抛出异常：

    use Illuminate\Support\Facades\DB;

    DB::transaction(function () {
        DB::update('update users set votes = 1');

        DB::delete('delete from posts');
    }, 5);

<a name="manually-using-transactions"></a>
#### 手动使用事务

如果你想手动开启事务，并完全掌控回滚与提交，可以使用 `DB` Facade 提供的 `beginTransaction` 方法：

    use Illuminate\Support\Facades\DB;

    DB::beginTransaction();

你可以通过 `rollBack` 方法回滚事务：

    DB::rollBack();

最后，你可以通过 `commit` 方法提交事务：

    DB::commit();

> [!NOTE]
> `DB` Facade 的事务方法同时对[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent)的事务进行控制。

<a name="connecting-to-the-database-cli"></a>
## 连接到数据库 CLI

如果你想连接到数据库的 CLI，可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如有需要，你可以指定数据库连接名称，以连接到非默认的数据库连接：

```shell
php artisan db mysql
```

<a name="inspecting-your-databases"></a>
## 检查你的数据库

借助 `db:show` 和 `db:table` Artisan 命令，你可以深入了解数据库及其关联表的情况。要查看数据库的概览信息，包括大小、类型、打开的连接数以及表的摘要，可以使用 `db:show` 命令：

```shell
php artisan db:show
```

你可以通过 `--database` 选项向命令提供数据库连接名称，以指定要检查哪个数据库连接：

```shell
php artisan db:show --database=pgsql
```

如果希望在命令输出中包含表行数和数据库视图详情，可以分别提供 `--counts` 和 `--views` 选项。在大型数据库上，获取行数和视图详情可能较慢：

```shell
php artisan db:show --counts --views
```

此外，你还可以使用以下 `Schema` 方法来检查数据库：

    use Illuminate\Support\Facades\Schema;

    $tables = Schema::getTables();
    $views = Schema::getViews();
    $columns = Schema::getColumns('users');
    $indexes = Schema::getIndexes('users');
    $foreignKeys = Schema::getForeignKeys('users');

如果你想检查的不是应用默认的数据库连接，可以使用 `connection` 方法：

    $columns = Schema::connection('sqlite')->getColumns('users');

<a name="table-overview"></a>
#### 表概览

如果你想获取数据库中某张表的概览，可以执行 `db:table` Artisan 命令。该命令会提供数据库表的基本概览，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

<a name="monitoring-your-databases"></a>
## 监控你的数据库

借助 `db:monitor` Artisan 命令，你可以指示 Laravel：当数据库管理的打开连接数超过指定数量时，分发一个 `Illuminate\Database\Events\DatabaseBusy` 事件。

要开始使用，你应当把 `db:monitor` 命令安排为[每分钟运行一次](/docs/{{version}}/scheduling)。该命令接受你希望监控的数据库连接配置名称，以及在分发事件之前可以容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅仅调度这个命令还不足以触发打开连接数告警通知。当该命令遇到某个数据库，其打开连接数超过你的阈值时，就会分发一个 `DatabaseBusy` 事件。你应当在应用的 `AppServiceProvider` 中监听该事件，以便向你或你的开发团队发送通知：

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
