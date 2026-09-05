# 数据库：入门

## 简介

几乎每个现代 Web 应用都会与数据库交互。Laravel 借助原生 SQL、[流畅的查询构造器](/docs/{{version}}/queries)以及 [Eloquent ORM](/docs/{{version}}/eloquent)，让使用各种受支持的数据库进行交互变得极其简单。目前，Laravel 为五种数据库提供第一方支持：

- MariaDB 10.3+ ([版本策略](https://mariadb.org/about/#maintenance-policy))
- MySQL 5.7+ ([版本策略](https://en.wikipedia.org/wiki/MySQL#Release_history))
- PostgreSQL 10.0+ ([版本策略](https://www.postgresql.org/support/versioning/))
- SQLite 3.26.0+
- SQL Server 2017+ ([版本策略](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server))

此外，MongoDB 通过 `mongodb/laravel-mongodb` 包提供支持，该包由 MongoDB 官方维护。欲了解更多信息，请查阅 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 文档。

### 配置

Laravel 数据库服务的配置位于应用的 `config/database.php` 配置文件中。在该文件中，你可以定义所有的数据库连接，并指定默认使用哪个连接。该文件中的大多数配置选项都由应用环境变量的值驱动。文件中提供了 Laravel 大多数受支持数据库系统的示例。

默认情况下，Laravel 的示例[环境配置](/docs/{{version}}/configuration#environment-configuration)已准备好与 [Laravel Sail](/docs/{{version}}/sail)（一个用于在本地机器上开发 Laravel 应用的 Docker 配置）配合使用。不过，你可以根据本地数据库的需要自由修改数据库配置。

#### SQLite 配置

SQLite 数据库包含在文件系统上的一个单独文件中。你可以使用终端中的 `touch` 命令创建一个新 SQLite 数据库：`touch database/database.sqlite`。创建数据库之后，你可以轻松配置环境变量，将数据库的绝路径放入 `DB_DATABASE` 环境变量，从而指向该数据库：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

默认情况下，SQLite 连接启用了外键约束。如果你想禁用它们，应将 `DB_FOREIGN_KEYS` 环境变量设置为 `false`：

```ini
DB_FOREIGN_KEYS=false
```

> [!NOTE]
> 如果你使用 [Laravel 安装器](/docs/{{version}}/installation#creating-a-laravel-project)创建 Laravel 应用并选择 SQLite 作为数据库，Laravel 会自动创建一个 `database/database.sqlite` 文件并为你运行默认的[数据库迁移](/docs/{{version}}/migrations)。

#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，你应当确保已安装 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖项（例如 Microsoft SQL ODBC 驱动程序）。

#### 使用 URL 进行配置

通常，数据库连接使用多个配置值来配置，例如 `host`、`database`、`username`、`password` 等。这些配置值各自都有对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理多个环境变量。

一些托管数据库提供商（如 AWS 和 Heroku）会提供一个单一的数据库"URL"，其中包含所有连接信息，合并为一个字符串。一个数据库 URL 示例可能如下所示：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这些 URL 通常遵循一个标准模式约定：

```html
driver://username:password@host:port/database?options
```

为方便起见，Laravel 支持将这些 URL 作为使用多个配置选项配置数据库的替代方案。如果存在 `url`（或对应的 `DB_URL` 环境变量）配置选项，它将被用来提取数据库连接和凭据信息。

### 读写连接

有时你可能希望使用一个数据库连接来执行 SELECT 语句，而使用另一个连接来执行 INSERT、UPDATE 和 DELETE 语句。Laravel 让这件事变得轻而易举，无论你使用的是原生查询、查询构造器还是 Eloquent ORM，都会始终使用正确的连接。

来看这个示例，了解应当如何配置读 / 写连接：

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

注意，配置数组中新增了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 键的值都是数组，包含一个单独的键：`host`。`read` 和 `write` 连接的其余数据库选项会从主 `mysql` 配置数组合并而来。

只有当你希望覆盖主 `mysql` 数组中的值时，才需要将条目放入 `read` 和 `write` 数组。因此，在本例中，`192.168.1.1` 会被用作"读"连接的主机，而 `192.168.1.3` 会被用作"写"连接的主机。数据库凭据、前缀、字符集以及主 `mysql` 数组中的所有其他选项会在两个连接之间共享。当 `host` 配置数组中存在多个值时，每个请求都会随机选择一个数据库主机。

#### `sticky` 选项

`sticky` 选项是一个*可选*值，可用于允许读取在当前请求周期内写入数据库的记录。如果启用了 `sticky` 选项，并且当前请求周期内已对数据库执行了"写"操作，那么任何后续的"读"操作都会使用"写"连接。这确保了请求周期内写入的任何数据都能在同一请求中立即从数据库读回。是否采用这种行为由你自行决定。

### PostgreSQL 连接池

许多托管的 PostgreSQL 提供商通过 PgBouncer 或连接代理等服务，提供事务模式的连接池。这些连接池非常适合应用查询，但某些结构操作、迁移和维护命令需要直接的数据库连接。

要将事务连接池用于 PostgreSQL，像往常一样配置池化连接，并通过 `direct` 配置选项提供直连详细信息：

```php
'pgsql' => [
    'driver' => 'pgsql',
    // ...
    'pooled' => env('DB_POOLED', false),
    'direct' => array_filter([
        'host' => env('DB_DIRECT_HOST'),
        'port' => env('DB_DIRECT_PORT'),
        'username' => env('DB_DIRECT_USERNAME'),
        'password' => env('DB_DIRECT_PASSWORD'),
        'sslmode' => env('DB_DIRECT_SSLMODE'),
    ]),
],
```

当 PostgreSQL 连接被配置为池化时，Laravel 会自动为池化连接启用模拟预处理（emulated prepares）。直连会继承任何未在 `direct` 配置中显式定义的选项，并默认使用原生预处理（native prepares）。

Laravel 会自动对迁移、结构转储与恢复、`db:wipe`、`db:show` 和 `db:table` 使用直连。当启用池化模式且配置了直连时，`db` 命令默认也使用直连；你可以传入 `--pooled` 选项来连接到池化连接：

```shell
php artisan db --pooled
```

如果你需要在应用中显式使用直连，可以在连接名后附加 `::direct` 后缀：

```php
DB::connection('pgsql::direct')->statement('create extension if not exists "uuid-ossp"');
```

## 运行 SQL 查询

配置好数据库连接后，你就可以使用 `DB` facade 来运行查询。`DB` facade 为每种查询类型都提供了方法：`select`、`update`、`insert`、`delete` 和 `statement`。

### 执行查询

要运行一个基础的 SELECT 查询，可以使用 `DB` facade 的 `select` 方法：

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
        $users = DB::select('select * from users where active = ?', [1]);

        return view('user.index', ['users' => $users]);
    }
}
```

传给 `select` 方法的第一个参数是 SQL 查询，第二个参数是需要绑定到查询的任何参数绑定。通常，这些是 `where` 子句约束的值。参数绑定可防止 SQL 注入。

`select` 方法始终返回一个结果数组。数组中的每个结果都是一个表示数据库记录的 PHP `stdClass` 对象：

```php
use Illuminate\Support\Facades\DB;

$users = DB::select('select * from users');

foreach ($users as $user) {
    echo $user->name;
}
```

#### 选择标量值

有时你的数据库查询可能返回一个单独的标量值。Laravel 允许你使用 `scalar` 方法直接检索该值，而无需从记录对象中获取查询的标量结果：

```php
$burgers = DB::scalar(
    "select count(case when food = 'burger' then 1 end) as burgers from menu"
);
```

#### 选择多个结果集

如果你的应用调用返回多个结果集的存储过程，可以使用 `selectResultSets` 方法来检索存储过程返回的所有结果集：

```php
[$options, $notifications] = DB::selectResultSets(
    "CALL get_user_options_and_notifications(?)", $request->user()->id
);
```

#### 使用命名绑定

除了使用 `?` 表示参数绑定之外，你也可以使用命名绑定来执行查询：

```php
$results = DB::select('select * from users where id = :id', ['id' => 1]);
```

#### 执行插入语句

要执行 `insert` 语句，可以使用 `DB` facade 的 `insert` 方法。与 `select` 一样，该方法接受 SQL 查询作为第一个参数，绑定作为第二个参数：

```php
use Illuminate\Support\Facades\DB;

DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

#### 执行更新语句

应当使用 `update` 方法来更新数据库中已存在的记录。该方法会返回受该语句影响的行数：

```php
use Illuminate\Support\Facades\DB;

$affected = DB::update(
    'update users set votes = 100 where name = ?',
    ['Anita']
);
```

#### 执行删除语句

应当使用 `delete` 方法来从数据库中删除记录。与 `update` 一样，该方法会返回受影响的行数：

```php
use Illuminate\Support\Facades\DB;

$deleted = DB::delete('delete from users');
```

#### 执行通用语句

有些数据库语句不返回任何值。对于这类操作，可以使用 `DB` facade 的 `statement` 方法：

```php
DB::statement('drop table users');
```

#### 执行未预处理语句

有时你可能希望执行一条不绑定任何值的 SQL 语句。可以使用 `DB` facade 的 `unprepared` 方法来完成：

```php
DB::unprepared('update users set votes = 100 where name = "Dries"');
```

> [!WARNING]
> 由于未预处理的语句不会绑定参数，它们可能面临 SQL 注入风险。你绝不应在未预处理的语句中允许出现用户控制的值。

#### 隐式提交

在事务中使用 `DB` facade 的 `statement` 和 `unprepared` 方法时，必须小心避免会导致[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句会导致数据库引擎间接提交整个事务，使 Laravel 无法感知数据库的事务级别。这类语句的一个例子是创建数据库表：

```php
DB::unprepared('create table a (col varchar(1) null)');
```

请参阅 MySQL 手册中[触发隐式提交的所有语句列表](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)。

### 使用多个数据库连接

如果你的应用在 `config/database.php` 配置文件中定义了多个连接，可以通过 `DB` facade 提供的 `connection` 方法访问每个连接。传给 `connection` 方法的连接名应当对应于 `config/database.php` 配置文件中列出的某个连接，或者通过 `config` 辅助函数在运行时配置的某个连接：

```php
use Illuminate\Support\Facades\DB;

$users = DB::connection('sqlite')->select(/* ... */);
```

你可以使用连接实例上的 `getPdo` 方法访问连接的底层原生 PDO 实例：

```php
$pdo = DB::connection()->getPdo();
```

### 监听查询事件

如果你希望指定一个为应用执行的每个 SQL 查询调用的闭包，可以使用 `DB` facade 的 `listen` 方法。该方法可用于记录查询或进行调试。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中注册你的查询监听器闭包：

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

### 监控累计查询时间

现代 Web 应用的一个常见性能瓶颈是查询数据库所花费的时间。值得庆幸的是，当 Laravel 在单次请求中查询数据库的时间过长时，它可以调用你选择的闭包或回调。首先，为 `whenQueryingForLongerThan` 方法提供一个查询时间阈值（以毫秒为单位）和闭包。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

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

## 数据库事务

你可以使用 `DB` facade 提供的 `transaction` 方法，在数据库事务中运行一组操作。如果事务闭包中抛出了异常，事务会自动回滚，并重新抛出异常。如果闭包成功执行，事务会自动提交。使用 `transaction` 方法时，你无需手动回滚或提交：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
});
```

#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，用于定义发生死锁时事务应当重试的次数。一旦这些尝试耗尽，就会抛出异常：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
}, attempts: 5);
```

#### 手动使用事务

如果你希望手动开始一个事务，并完全控制回滚和提交，可以使用 `DB` facade 提供的 `beginTransaction` 方法：

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
> `DB` facade 的事务方法控制着[查询构造器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的事务。

## 连接数据库 CLI

如果你想连接到数据库的命令行界面，可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如有需要，你可以指定一个数据库连接名，从而连接到非默认连接的数据库连接：

```shell
php artisan db mysql
```

## 检查你的数据库

使用 `db:show` 和 `db:table` Artisan 命令，你可以获得关于数据库及其相关表的宝贵洞察。要查看数据库的概览（包括其大小、类型、打开的连接数以及表的摘要），可以使用 `db:show` 命令：

```shell
php artisan db:show
```

你可以通过 `--database` 选项向命令提供要检查的数据库连接名：

```shell
php artisan db:show --database=pgsql
```

如果你希望在命令输出中包含表的行数和数据库视图详情，可以分别提供 `--counts` 和 `--views` 选项。在大型数据库上，检索行数和视图详情可能会很慢：

```shell
php artisan db:show --counts --views
```

此外，你可以使用以下 `Schema` 方法来检查你的数据库：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```

如果你想检查的不是应用默认连接的数据库连接，可以使用 `connection` 方法：

```php
$columns = Schema::connection('sqlite')->getColumns('users');
```

#### 表概览

如果你想获得数据库中某个单独表的概览，可以执行 `db:table` Artisan 命令。该命令会提供数据库表的一般概览，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

## 监控你的数据库

使用 `db:monitor` Artisan 命令，你可以指示 Laravel 在数据库管理的打开连接数超过指定数量时派发一个 `Illuminate\Database\Events\DatabaseBusy` 事件。

首先，你应当安排 `db:monitor` 命令[每分钟运行一次](/docs/{{version}}/scheduling)。该命令接受你希望监控的数据库连接配置名称，以及在派发事件之前可容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅安排该命令本身并不足以触发通知以提醒你打开连接的数量。当命令遇到打开连接数超过阈值的数据库时，会派发一个 `DatabaseBusy` 事件。你应当在应用的 `AppServiceProvider` 中监听该事件，以便向你或你的开发团队发送通知：

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
