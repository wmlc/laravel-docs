# 数据库：数据库迁移

- [简介](#introduction)
- [生成数据库迁移](#generating-migrations)
    - [压缩数据库迁移](#squashing-migrations)
- [迁移结构](#migration-structure)
- [运行数据库迁移](#running-migrations)
    - [回滚数据库迁移](#rolling-back-migrations)
- [数据表](#tables)
    - [创建数据表](#creating-tables)
    - [更新数据表](#updating-tables)
    - [重命名 / 删除数据表](#renaming-and-dropping-tables)
- [列](#columns)
    - [创建列](#creating-columns)
    - [可用的列类型](#available-column-types)
    - [列修饰符](#column-modifiers)
    - [修改列](#modifying-columns)
    - [重命名列](#renaming-columns)
    - [删除列](#dropping-columns)
- [索引](#indexes)
    - [创建索引](#creating-indexes)
    - [重命名索引](#renaming-indexes)
    - [删除索引](#dropping-indexes)
    - [外键约束](#foreign-key-constraints)
- [事件](#events)

<a name="introduction"></a>
## 简介

数据库迁移之于数据库，就像版本控制之于代码。它让团队能够定义并共享应用的数据库结构定义。如果你曾经不得不告诉同事：从源码管理拉取你的改动后，需要手动在本地数据库结构中新增一列，那么你就已经遇到过数据库迁移所要解决的问题。

Laravel 的 `Schema` [Facade](/docs/{{version}}/facades)为创建和操作 Laravel 所支持的各种数据库系统中的数据表提供了与数据库无关的能力。通常，数据库迁移会使用该 Facade 来创建和修改数据库表与列。

<a name="generating-migrations"></a>
## 生成数据库迁移

你可以使用 `make:migration` [Artisan 命令](/docs/{{version}}/artisan)生成数据库迁移。新生成的迁移会放入 `database/migrations` 目录。每个迁移文件名中都包含一个时间戳，Laravel 依靠它来判断迁移的执行顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 会根据迁移名称来尝试推断表名，以及该迁移是否会创建新表。如果 Laravel 能从迁移名中推断出表名，就会把指定表名预填到生成的迁移文件中。否则，你可以在迁移文件中手动指定表名。

如果你想为生成的迁移指定自定义路径，可以在执行 `make:migration` 命令时使用 `--path` 选项。给出的路径应当相对于应用的基础路径。

> [!NOTE]
> 数据库迁移桩文件可以通过[发布桩文件](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="squashing-migrations"></a>
### 压缩数据库迁移

随着应用不断演进，你可能会积累越来越多的迁移。这会让 `database/migrations` 目录变得臃肿，其中可能有数百个迁移。如果愿意，你可以把这些迁移"压缩"成单个 SQL 文件。要开始，请执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# 转储当前数据库结构并清理所有现有迁移...
php artisan schema:dump --prune
```

执行该命令时，Laravel 会把一个"结构"文件写入应用的 `database/schema` 目录。该结构文件的名称会与数据库连接相对应。现在，当你尝试迁移数据库而此前没有执行过其他迁移时，Laravel 会先执行你所使用的数据库连接的结构文件中的 SQL 语句。执行完结构文件中的 SQL 语句后，Laravel 会执行其余未包含在结构转储中的迁移。

如果应用的测试使用的数据库连接与本地开发时常用的连接不同，你应当确保已经使用该数据库连接转储过结构文件，以便测试能够构建数据库。你可以在转储本地开发常用的数据库连接之后再这样做：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

你应当把数据库结构文件提交到源码管理中，这样团队中的其他新开发者就能快速创建你应用的初始数据库结构。

> [!WARNING]
> 压缩数据库迁移仅适用于 MariaDB、MySQL、PostgreSQL 和 SQLite 数据库，并且需要使用数据库的命令行客户端。

<a name="migration-structure"></a>
## 迁移结构

一个迁移类包含两个方法：`up` 和 `down`。`up` 方法用于向数据库添加新的表、列或索引，而 `down` 方法则应当撤销 `up` 方法所执行的操作。

在这两个方法中，你都可以使用 Laravel 架构构造器以表达性的方式创建和修改数据表。要了解 `Schema` 构造器上所有可用的方法，请[查看它的文档](#creating-tables)。例如，下面的迁移会创建 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 运行数据库迁移。
     */
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('airline');
            $table->timestamps();
        });
    }

    /**
     * 反向执行数据库迁移。
     */
    public function down(): void
    {
        Schema::drop('flights');
    }
};
```

<a name="setting-the-migration-connection"></a>
#### 设置迁移连接

如果你的迁移需要与默认数据库连接之外的数据库连接交互，你应当设置迁移的 `$connection` 属性：

```php
/**
 * 该迁移应当使用的数据库连接。
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * 运行数据库迁移。
 */
public function up(): void
{
    // ...
}
```

<a name="running-migrations"></a>
## 运行数据库迁移

要运行所有尚未执行的迁移，请执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果你想查看目前哪些迁移已经执行过，可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果你想在不真正执行的情况下查看迁移将运行的 SQL 语句，可以给 `migrate` 命令传入 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

#### 隔离迁移执行

如果你把应用部署到多台服务器上，并把运行迁移作为部署流程的一部分，那么很可能不希望两台服务器同时尝试迁移数据库。为避免这种情况，可以在调用 `migrate` 命令时使用 `isolated` 选项。

提供 `isolated` 选项后，Laravel 会先使用应用的缓存驱动获取一个原子锁，然后才尝试运行迁移。在该锁被持有期间，其他所有运行 `migrate` 命令的尝试都不会执行；不过该命令仍会以成功的退出状态码退出：

```shell
php artisan migrate --isolated
```

> [!WARNING]
> 要使用该特性，你的应用必须以 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

<a name="forcing-migrations-to-run-in-production"></a>
#### 强制在生产环境运行迁移

某些迁移操作具有破坏性，也就是说它们可能导致数据丢失。为了防止你不小心对生产数据库执行这些命令，命令执行前会提示你确认。要强制执行而不显示提示，请使用 `--force` 标志：

```shell
php artisan migrate --force
```

<a name="rolling-back-migrations"></a>
### 回滚数据库迁移

要回滚最近一次迁移操作，可以使用 `rollback` Artisan 命令。该命令会回滚最后一批迁移，其中可能包含多个迁移文件：

```shell
php artisan migrate:rollback
```

你可以通过给 `rollback` 命令提供 `step` 选项来回滚有限数量的迁移。例如，下面的命令会回滚最后五个迁移：

```shell
php artisan migrate:rollback --step=5
```

你也可以通过给 `rollback` 命令提供 `batch` 选项来回滚特定"一批"迁移，其中 `batch` 选项对应应用 `migrations` 数据库表中的一个批次值。例如，下面的命令会回滚第三批中的所有迁移：

 ```shell
php artisan migrate:rollback --batch=3
 ```

如果你想在不真正执行的情况下查看迁移将运行的 SQL 语句，可以给 `migrate:rollback` 命令传入 `--pretend` 标志：

```shell
php artisan migrate:rollback --pretend
```

`migrate:reset` 命令会回滚应用的所有迁移：

```shell
php artisan migrate:reset
```

<a name="roll-back-migrate-using-a-single-command"></a>
#### 使用单个命令回滚并迁移

`migrate:refresh` 命令会回滚你的所有迁移，然后执行 `migrate` 命令。该命令实际上会重新创建整个数据库：

```shell
php artisan migrate:refresh

# 刷新数据库并运行所有数据库填充...
php artisan migrate:refresh --seed
```

你可以通过给 `refresh` 命令提供 `step` 选项来回滚并重新迁移有限数量的迁移。例如，下面的命令会回滚并重新迁移最后五个迁移：

```shell
php artisan migrate:refresh --step=5
```

<a name="drop-all-tables-migrate"></a>
#### 删除所有数据表并迁移

`migrate:fresh` 命令会删除数据库中的所有数据表，然后执行 `migrate` 命令：

```shell
php artisan migrate:fresh

php artisan migrate:fresh --seed
```

默认情况下，`migrate:fresh` 命令只删除默认数据库连接中的数据表。不过，你可以使用 `--database` 选项指定要迁移的数据库连接。数据库连接名应当对应应用 `database` [配置文件](/docs/{{version}}/configuration)中定义的某个连接：

```shell
php artisan migrate:fresh --database=admin
```

> [!WARNING]
> `migrate:fresh` 命令会删除所有数据库表，无论它们是否带有前缀。在与其他应用共用数据库时，谨慎使用该命令。

<a name="tables"></a>
## 数据表

<a name="creating-tables"></a>
### 创建数据表

要创建新的数据库表，请使用 `Schema` Facade 上的 `create` 方法。`create` 方法接受两个参数：第一个是表名，第二个是一个闭包，该闭包会接收一个 `Blueprint` 对象，可用于定义新表：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email');
    $table->timestamps();
});
```

创建表时，你可以使用架构构造器的任意[列方法](#creating-columns)来定义表的列。

<a name="determining-table-column-existence"></a>
#### 判断表 / 列是否存在

你可以使用 `hasTable`、`hasColumn` 和 `hasIndex` 方法来判断表、列或索引是否存在：

```php
if (Schema::hasTable('users')) {
    // "users" 表存在...
}

if (Schema::hasColumn('users', 'email')) {
    // "users" 表存在，并且含有 "email" 列...
}

if (Schema::hasIndex('users', ['email'], 'unique')) {
    // "users" 表存在，并且在 "email" 列上有唯一索引...
}
```

<a name="database-connection-table-options"></a>
#### 数据库连接与表选项

如果你想对非应用默认连接的数据库连接执行架构操作，请使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，还有若干其他属性和方法可用于定义创建表时的其他方面。在使用 MariaDB 或 MySQL 时，可以使用 `engine` 属性指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine('InnoDB');

    // ...
});
```

在使用 MariaDB 或 MySQL 时，可以使用 `charset` 和 `collation` 属性为创建的表指定字符集与排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset('utf8mb4');
    $table->collation('utf8mb4_unicode_ci');

    // ...
});
```

`temporary` 方法可用于指示该表应为"临时"表。临时表仅对当前连接的数据库会话可见，并且会在连接关闭时自动删除：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果你想为数据库表添加"注释"，可以在表实例上调用 `comment` 方法。目前表注释仅受 MariaDB、MySQL 和 PostgreSQL 支持：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

<a name="updating-tables"></a>
### 更新数据表

`Schema` Facade 上的 `table` 方法可用于更新已有的表。与 `create` 方法一样，`table` 方法接受两个参数：表名，以及一个闭包，该闭包会接收一个 `Blueprint` 实例，你可以用它向表中添加列或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="renaming-and-dropping-tables"></a>
### 重命名 / 删除数据表

要重命名已有的数据库表，请使用 `rename` 方法：

```php
use Illuminate\Support\Facades\Schema;

Schema::rename($from, $to);
```

要删除已有的表，可以使用 `drop` 或 `dropIfExists` 方法：

```php
Schema::drop('users');

Schema::dropIfExists('users');
```

<a name="renaming-tables-with-foreign-keys"></a>
#### 重命名带外键的表

在重命名表之前，你应当确认表上的所有外键约束都在迁移文件中有显式名称，而不是让 Laravel 按约定分配名称。否则，外键约束名称会指向旧的表名。

<a name="columns"></a>
## 列

<a name="creating-columns"></a>
### 创建列

`Schema` Facade 上的 `table` 方法可用于更新已有的表。与 `create` 方法一样，`table` 方法接受两个参数：表名，以及一个闭包，该闭包会接收一个 `Illuminate\Database\Schema\Blueprint` 实例，你可以用它向表中添加列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="available-column-types"></a>
### 可用的列类型

架构构造器的蓝图类提供了多种方法，对应你可以添加到数据库表中的不同列类型。所有可用方法都列在下面的表格中：

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

<a name="booleans-method-list"></a>
#### 布尔类型

<div class="collection-method-list" markdown="1">

[boolean](#column-method-boolean)

</div>

<a name="strings-and-texts-method-list"></a>
#### 字符串与文本类型

<div class="collection-method-list" markdown="1">

[char](#column-method-char)
[longText](#column-method-longText)
[mediumText](#column-method-mediumText)
[string](#column-method-string)
[text](#column-method-text)
[tinyText](#column-method-tinyText)

</div>

<a name="numbers--method-list"></a>
#### 数值类型

<div class="collection-method-list" markdown="1">

[bigIncrements](#column-method-bigIncrements)
[bigInteger](#column-method-bigInteger)
[decimal](#column-method-decimal)
[double](#column-method-double)
[float](#column-method-float)
[id](#column-method-id)
[increments](#column-method-increments)
[integer](#column-method-integer)
[mediumIncrements](#column-method-mediumIncrements)
[mediumInteger](#column-method-mediumInteger)
[smallIncrements](#column-method-smallIncrements)
[smallInteger](#column-method-smallInteger)
[tinyIncrements](#column-method-tinyIncrements)
[tinyInteger](#column-method-tinyInteger)
[unsignedBigInteger](#column-method-unsignedBigInteger)
[unsignedInteger](#column-method-unsignedInteger)
[unsignedMediumInteger](#column-method-unsignedMediumInteger)
[unsignedSmallInteger](#column-method-unsignedSmallInteger)
[unsignedTinyInteger](#column-method-unsignedTinyInteger)

</div>

<a name="dates-and-times-method-list"></a>
#### 日期与时间类型

<div class="collection-method-list" markdown="1">

[dateTime](#column-method-dateTime)
[dateTimeTz](#column-method-dateTimeTz)
[date](#column-method-date)
[time](#column-method-time)
[timeTz](#column-method-timeTz)
[timestamp](#column-method-timestamp)
[timestamps](#column-method-timestamps)
[timestampsTz](#column-method-timestampsTz)
[softDeletes](#column-method-softDeletes)
[softDeletesTz](#column-method-softDeletesTz)
[year](#column-method-year)

</div>

<a name="binaries-method-list"></a>
#### 二进制类型

<div class="collection-method-list" markdown="1">

[binary](#column-method-binary)

</div>

<a name="object-and-jsons-method-list"></a>
#### 对象与 JSON 类型

<div class="collection-method-list" markdown="1">

[json](#column-method-json)
[jsonb](#column-method-jsonb)

</div>

<a name="uuids-and-ulids-method-list"></a>
#### UUID 与 ULID 类型

<div class="collection-method-list" markdown="1">

[ulid](#column-method-ulid)
[ulidMorphs](#column-method-ulidMorphs)
[uuid](#column-method-uuid)
[uuidMorphs](#column-method-uuidMorphs)
[nullableUlidMorphs](#column-method-nullableUlidMorphs)
[nullableUuidMorphs](#column-method-nullableUuidMorphs)

</div>

<a name="spatials-method-list"></a>
#### 空间类型

<div class="collection-method-list" markdown="1">

[geography](#column-method-geography)
[geometry](#column-method-geometry)

</div>

#### 关联类型

<div class="collection-method-list" markdown="1">

[foreignId](#column-method-foreignId)
[foreignIdFor](#column-method-foreignIdFor)
[foreignUlid](#column-method-foreignUlid)
[foreignUuid](#column-method-foreignUuid)
[morphs](#column-method-morphs)
[nullableMorphs](#column-method-nullableMorphs)

</div>

<a name="spacifics-method-list"></a>
#### 特殊类型

<div class="collection-method-list" markdown="1">

[enum](#column-method-enum)
[set](#column-method-set)
[macAddress](#column-method-macAddress)
[ipAddress](#column-method-ipAddress)
[rememberToken](#column-method-rememberToken)
[vector](#column-method-vector)

</div>

<a name="column-method-bigIncrements"></a>
#### `bigIncrements()` {.collection-method .first-collection-method}

`bigIncrements` 方法创建一个等效于自增 `UNSIGNED BIGINT`（主键）的列：

```php
$table->bigIncrements('id');
```

<a name="column-method-bigInteger"></a>
#### `bigInteger()` {.collection-method}

`bigInteger` 方法创建一个等效于 `BIGINT` 的列：

```php
$table->bigInteger('votes');
```

<a name="column-method-binary"></a>
#### `binary()` {.collection-method}

`binary` 方法创建一个等效于 `BLOB` 的列：

```php
$table->binary('photo');
```

在使用 MySQL、MariaDB 或 SQL Server 时，可以传入 `length` 与 `fixed` 参数，创建等效于 `VARBINARY` 或 `BINARY` 的列：

```php
$table->binary('data', length: 16); // VARBINARY(16)

$table->binary('data', length: 16, fixed: true); // BINARY(16)
```

<a name="column-method-boolean"></a>
#### `boolean()` {.collection-method}

`boolean` 方法创建一个等效于 `BOOLEAN` 的列：

```php
$table->boolean('confirmed');
```

<a name="column-method-char"></a>
#### `char()` {.collection-method}

`char` 方法创建一个指定长度的、等效于 `CHAR` 的列：

```php
$table->char('name', length: 100);
```

<a name="column-method-dateTimeTz"></a>
#### `dateTimeTz()` {.collection-method}

`dateTimeTz` 方法创建一个等效于 `DATETIME`（带时区）的列，可选指定小数秒精度：

```php
$table->dateTimeTz('created_at', precision: 0);
```

<a name="column-method-dateTime"></a>
#### `dateTime()` {.collection-method}

`dateTime` 方法创建一个等效于 `DATETIME` 的列，可选指定小数秒精度：

```php
$table->dateTime('created_at', precision: 0);
```

<a name="column-method-date"></a>
#### `date()` {.collection-method}

`date` 方法创建一个等效于 `DATE` 的列：

```php
$table->date('created_at');
```

<a name="column-method-decimal"></a>
#### `decimal()` {.collection-method}

`decimal` 方法创建一个等效于 `DECIMAL` 的列，并指定精度（总位数）与小数位数：

```php
$table->decimal('amount', total: 8, places: 2);
```

<a name="column-method-double"></a>
#### `double()` {.collection-method}

`double` 方法创建一个等效于 `DOUBLE` 的列：

```php
$table->double('amount');
```

<a name="column-method-enum"></a>
#### `enum()` {.collection-method}

`enum` 方法创建一个等效于 `ENUM` 的列，并指定有效值：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

<a name="column-method-float"></a>
#### `float()` {.collection-method}

`float` 方法创建一个等效于 `FLOAT` 的列，并指定精度：

```php
$table->float('amount', precision: 53);
```

<a name="column-method-foreignId"></a>
#### `foreignId()` {.collection-method}

`foreignId` 方法创建一个等效于 `UNSIGNED BIGINT` 的列：

```php
$table->foreignId('user_id');
```

<a name="column-method-foreignIdFor"></a>
#### `foreignIdFor()` {.collection-method}

`foreignIdFor` 方法为给定的模型类添加一个等效于 `{column}_id` 的列。列类型会根据模型键类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`：

```php
$table->foreignIdFor(User::class);
```

<a name="column-method-foreignUlid"></a>
#### `foreignUlid()` {.collection-method}

`foreignUlid` 方法创建一个等效于 `ULID` 的列：

```php
$table->foreignUlid('user_id');
```

<a name="column-method-foreignUuid"></a>
#### `foreignUuid()` {.collection-method}

`foreignUuid` 方法创建一个等效于 `UUID` 的列：

```php
$table->foreignUuid('user_id');
```

<a name="column-method-geography"></a>
#### `geography()` {.collection-method}

`geography` 方法创建一个等效于 `GEOGRAPHY` 的列，并指定空间类型与 SRID（空间参考系统标识符）：

```php
$table->geography('coordinates', subtype: 'point', srid: 4326);
```

> [!NOTE]
> 对空间类型的支持取决于你的数据库驱动。请查阅你的数据库文档。如果应用使用的是 PostgreSQL 数据库，必须先安装 [PostGIS](https://postgis.net) 扩展，才能使用 `geography` 方法。

<a name="column-method-geometry"></a>
#### `geometry()` {.collection-method}

`geometry` 方法创建一个等效于 `GEOMETRY` 的列，并指定空间类型与 SRID（空间参考系统标识符）：

```php
$table->geometry('positions', subtype: 'point', srid: 0);
```

> [!NOTE]
> 对空间类型的支持取决于你的数据库驱动。请查阅你的数据库文档。如果应用使用的是 PostgreSQL 数据库，必须先安装 [PostGIS](https://postgis.net) 扩展，才能使用 `geometry` 方法。

<a name="column-method-id"></a>
#### `id()` {.collection-method}

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法会创建 `id` 列；不过，如果你想给该列指定其他名称，也可以传入列名：

```php
$table->id();
```

<a name="column-method-increments"></a>
#### `increments()` {.collection-method}

`increments` 方法创建一个等效于自增 `UNSIGNED INTEGER` 的列，作为主键：

```php
$table->increments('id');
```

<a name="column-method-integer"></a>
#### `integer()` {.collection-method}

`integer` 方法创建一个等效于 `INTEGER` 的列：

```php
$table->integer('votes');
```

<a name="column-method-ipAddress"></a>
#### `ipAddress()` {.collection-method}

`ipAddress` 方法创建一个等效于 `VARCHAR` 的列：

```php
$table->ipAddress('visitor');
```

使用 PostgreSQL 时会创建 `INET` 列。

<a name="column-method-json"></a>
#### `json()` {.collection-method}

`json` 方法创建一个等效于 `JSON` 的列：

```php
$table->json('options');
```

使用 SQLite 时会创建 `TEXT` 列。

<a name="column-method-jsonb"></a>
#### `jsonb()` {.collection-method}

`jsonb` 方法创建一个等效于 `JSONB` 的列：

```php
$table->jsonb('options');
```

使用 SQLite 时会创建 `TEXT` 列。

<a name="column-method-longText"></a>
#### `longText()` {.collection-method}

`longText` 方法创建一个等效于 `LONGTEXT` 的列：

```php
$table->longText('description');
```

在使用 MySQL 或 MariaDB 时，可以为该列应用 `binary` 字符集，从而创建等效于 `LONGBLOB` 的列：

```php
$table->longText('data')->charset('binary'); // LONGBLOB
```

<a name="column-method-macAddress"></a>
#### `macAddress()` {.collection-method}

`macAddress` 方法创建一个用于存放 MAC 地址的列。某些数据库系统（例如 PostgreSQL）为这类数据提供了专用列类型；其他数据库系统则会使用等效于字符串的列：

```php
$table->macAddress('device');
```

<a name="column-method-mediumIncrements"></a>
#### `mediumIncrements()` {.collection-method}

`mediumIncrements` 方法创建一个等效于自增 `UNSIGNED MEDIUMINT` 的列，作为主键：

```php
$table->mediumIncrements('id');
```

<a name="column-method-mediumInteger"></a>
#### `mediumInteger()` {.collection-method}

`mediumInteger` 方法创建一个等效于 `MEDIUMINT` 的列：

```php
$table->mediumInteger('votes');
```

<a name="column-method-mediumText"></a>
#### `mediumText()` {.collection-method}

`mediumText` 方法创建一个等效于 `MEDIUMTEXT` 的列：

```php
$table->mediumText('description');
```

在使用 MySQL 或 MariaDB 时，可以为该列应用 `binary` 字符集，从而创建等效于 `MEDIUMBLOB` 的列：

```php
$table->mediumText('data')->charset('binary'); // MEDIUMBLOB
```

<a name="column-method-morphs"></a>
#### `morphs()` {.collection-method}

`morphs` 方法是一个便捷方法，会添加一个等效于 `{column}_id` 的列和一个等效于 `{column}_type` `VARCHAR` 的列。`{column}_id` 的列类型会根据模型键类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`。

该方法用于在定义多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的列时使用。在下面的例子中，会创建 `taggable_id` 与 `taggable_type` 列：

```php
$table->morphs('taggable');
```

<a name="column-method-nullableMorphs"></a>
#### `nullableMorphs()` {.collection-method}

该方法与 [morphs](#column-method-morphs) 方法类似；不过所创建的列可为"可空"：

```php
$table->nullableMorphs('taggable');
```

<a name="column-method-nullableUlidMorphs"></a>
#### `nullableUlidMorphs()` {.collection-method}

该方法与 [ulidMorphs](#column-method-ulidMorphs) 方法类似；不过所创建的列可为"可空"：

```php
$table->nullableUlidMorphs('taggable');
```

<a name="column-method-nullableUuidMorphs"></a>
#### `nullableUuidMorphs()` {.collection-method}

该方法与 [uuidMorphs](#column-method-uuidMorphs) 方法类似；不过所创建的列可为"可空"：

```php
$table->nullableUuidMorphs('taggable');
```

<a name="column-method-rememberToken"></a>
#### `rememberToken()` {.collection-method}

`rememberToken` 方法创建一个可为空的、等效于 `VARCHAR(100)` 的列，用于存储当前的"记住我"[认证令牌](/docs/{{version}}/authentication#remembering-users)：

```php
$table->rememberToken();
```

<a name="column-method-set"></a>
#### `set()` {.collection-method}

`set` 方法创建一个等效于 `SET` 的列，并指定有效值列表：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

<a name="column-method-smallIncrements"></a>
#### `smallIncrements()` {.collection-method}

`smallIncrements` 方法创建一个等效于自增 `UNSIGNED SMALLINT` 的列，作为主键：

```php
$table->smallIncrements('id');
```

<a name="column-method-smallInteger"></a>
#### `smallInteger()` {.collection-method}

`smallInteger` 方法创建一个等效于 `SMALLINT` 的列：

```php
$table->smallInteger('votes');
```

<a name="column-method-softDeletesTz"></a>
#### `softDeletesTz()` {.collection-method}

`softDeletesTz` 方法添加一个可为空的、等效于 `deleted_at` `TIMESTAMP`（带时区）的列，可选指定小数秒精度。该列用于存储 Eloquent"软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz('deleted_at', precision: 0);
```

<a name="column-method-softDeletes"></a>
#### `softDeletes()` {.collection-method}

`softDeletes` 方法添加一个可为空的、等效于 `deleted_at` `TIMESTAMP` 的列，可选指定小数秒精度。该列用于存储 Eloquent"软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes('deleted_at', precision: 0);
```

<a name="column-method-string"></a>
#### `string()` {.collection-method}

`string` 方法创建一个指定长度的、等效于 `VARCHAR` 的列：

```php
$table->string('name', length: 100);
```

<a name="column-method-text"></a>
#### `text()` {.collection-method}

`text` 方法创建一个等效于 `TEXT` 的列：

```php
$table->text('description');
```

在使用 MySQL 或 MariaDB 时，可以为该列应用 `binary` 字符集，从而创建等效于 `BLOB` 的列：

```php
$table->text('data')->charset('binary'); // BLOB
```

<a name="column-method-timeTz"></a>
#### `timeTz()` {.collection-method}

`timeTz` 方法创建一个等效于 `TIME`（带时区）的列，可选指定小数秒精度：

```php
$table->timeTz('sunrise', precision: 0);
```

<a name="column-method-time"></a>
#### `time()` {.collection-method}

`time` 方法创建一个等效于 `TIME` 的列，可选指定小数秒精度：

```php
$table->time('sunrise', precision: 0);
```

<a name="column-method-timestampTz"></a>
#### `timestampTz()` {.collection-method}

`timestampTz` 方法创建一个等效于 `TIMESTAMP`（带时区）的列，可选指定小数秒精度：

```php
$table->timestampTz('added_at', precision: 0);
```

<a name="column-method-timestamp"></a>
#### `timestamp()` {.collection-method}

`timestamp` 方法创建一个等效于 `TIMESTAMP` 的列，可选指定小数秒精度：

```php
$table->timestamp('added_at', precision: 0);
```

<a name="column-method-timestampsTz"></a>
#### `timestampsTz()` {.collection-method}

`timestampsTz` 方法创建等效于 `created_at` 与 `updated_at` `TIMESTAMP`（带时区）的列，可选指定小数秒精度：

```php
$table->timestampsTz(precision: 0);
```

<a name="column-method-timestamps"></a>
#### `timestamps()` {.collection-method}

`timestamps` 方法创建等效于 `created_at` 与 `updated_at` `TIMESTAMP` 的列，可选指定小数秒精度：

```php
$table->timestamps(precision: 0);
```

<a name="column-method-tinyIncrements"></a>
#### `tinyIncrements()` {.collection-method}

`tinyIncrements` 方法创建一个等效于自增 `UNSIGNED TINYINT` 的列，作为主键：

```php
$table->tinyIncrements('id');
```

<a name="column-method-tinyInteger"></a>
#### `tinyInteger()` {.collection-method}

`tinyInteger` 方法创建一个等效于 `TINYINT` 的列：

```php
$table->tinyInteger('votes');
```

<a name="column-method-tinyText"></a>
#### `tinyText()` {.collection-method}

`tinyText` 方法创建一个等效于 `TINYTEXT` 的列：

```php
$table->tinyText('notes');
```

在使用 MySQL 或 MariaDB 时，可以为该列应用 `binary` 字符集，从而创建等效于 `TINYBLOB` 的列：

```php
$table->tinyText('data')->charset('binary'); // TINYBLOB
```

<a name="column-method-unsignedBigInteger"></a>
#### `unsignedBigInteger()` {.collection-method}

`unsignedBigInteger` 方法创建一个等效于 `UNSIGNED BIGINT` 的列：

```php
$table->unsignedBigInteger('votes');
```

<a name="column-method-unsignedInteger"></a>
#### `unsignedInteger()` {.collection-method}

`unsignedInteger` 方法创建一个等效于 `UNSIGNED INTEGER` 的列：

```php
$table->unsignedInteger('votes');
```

<a name="column-method-unsignedMediumInteger"></a>
#### `unsignedMediumInteger()` {.collection-method}

`unsignedMediumInteger` 方法创建一个等效于 `UNSIGNED MEDIUMINT` 的列：

```php
$table->unsignedMediumInteger('votes');
```

<a name="column-method-unsignedSmallInteger"></a>
#### `unsignedSmallInteger()` {.collection-method}

`unsignedSmallInteger` 方法创建一个等效于 `UNSIGNED SMALLINT` 的列：

```php
$table->unsignedSmallInteger('votes');
```

<a name="column-method-unsignedTinyInteger"></a>
#### `unsignedTinyInteger()` {.collection-method}

`unsignedTinyInteger` 方法创建一个等效于 `UNSIGNED TINYINT` 的列：

```php
$table->unsignedTinyInteger('votes');
```

<a name="column-method-ulidMorphs"></a>
#### `ulidMorphs()` {.collection-method}

`ulidMorphs` 方法是一个便捷方法，会添加一个等效于 `{column}_id` `CHAR(26)` 的列和一个等效于 `{column}_type` `VARCHAR` 的列。

该方法用于在定义使用 ULID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的列时使用。在下面的例子中，会创建 `taggable_id` 与 `taggable_type` 列：

```php
$table->ulidMorphs('taggable');
```

<a name="column-method-uuidMorphs"></a>
#### `uuidMorphs()` {.collection-method}

`uuidMorphs` 方法是一个便捷方法，会添加一个等效于 `{column}_id` `CHAR(36)` 的列和一个等效于 `{column}_type` `VARCHAR` 的列。

该方法用于在定义使用 UUID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的列时使用。在下面的例子中，会创建 `taggable_id` 与 `taggable_type` 列：

```php
$table->uuidMorphs('taggable');
```

<a name="column-method-ulid"></a>
#### `ulid()` {.collection-method}

`ulid` 方法创建一个等效于 `ULID` 的列：

```php
$table->ulid('id');
```

<a name="column-method-uuid"></a>
#### `uuid()` {.collection-method}

`uuid` 方法创建一个等效于 `UUID` 的列：

```php
$table->uuid('id');
```

<a name="column-method-vector"></a>
#### `vector()` {.collection-method}

`vector` 方法创建一个等效于 `vector` 的列：

```php
$table->vector('embedding', dimensions: 100);
```

<a name="column-method-year"></a>
#### `year()` {.collection-method}

`year` 方法创建一个等效于 `YEAR` 的列：

```php
$table->year('birth_year');
```

<a name="column-modifiers"></a>
### 列修饰符

除了上面列出的列类型之外，向数据库表添加列时还可以使用若干列"修饰符"。例如，要把列设为"可空"，可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

下面的表格包含所有可用的列修饰符。该列表不包含[索引修饰符](#creating-indexes)：

<div class="overflow-auto">

| 修饰符 | 说明 |
| --- | --- |
| `->after('column')` | 把该列放到另一个列"之后"（MariaDB / MySQL）。 |
| `->autoIncrement()` | 把 `INTEGER` 列设为自增（主键）。 |
| `->charset('utf8mb4')` | 为该列指定字符集（MariaDB / MySQL）。 |
| `->collation('utf8mb4_unicode_ci')` | 为该列指定排序规则。 |
| `->comment('my comment')` | 为该列添加注释（MariaDB / MySQL / PostgreSQL）。 |
| `->default($value)` | 为该列指定"默认"值。 |
| `->first()` | 把该列放到表中的"最前面"（MariaDB / MySQL）。 |
| `->from($integer)` | 设置自增字段的起始值（MariaDB / MySQL / PostgreSQL）。 |
| `->invisible()` | 使该列对 `SELECT *` 查询"不可见"（MariaDB / MySQL）。 |
| `->nullable($value = true)` | 允许向该列插入 `NULL` 值。 |
| `->storedAs($expression)` | 创建存储生成列（MariaDB / MySQL / PostgreSQL / SQLite）。 |
| `->unsigned()` | 把 `INTEGER` 列设为 `UNSIGNED`（MariaDB / MySQL）。 |
| `->useCurrent()` | 把 `TIMESTAMP` 列的默认值设为 `CURRENT_TIMESTAMP`。 |
| `->useCurrentOnUpdate()` | 记录更新时把 `TIMESTAMP` 列设为 `CURRENT_TIMESTAMP`（MariaDB / MySQL）。 |
| `->virtualAs($expression)` | 创建虚拟生成列（MariaDB / MySQL / SQLite）。 |
| `->generatedAs($expression)` | 创建带指定序列选项的自增列（PostgreSQL）。 |
| `->always()` | 定义自增列中序列值相对于输入的优先级（PostgreSQL）。 |

</div>

<a name="default-expressions"></a>
#### 默认表达式

`default` 修饰符接受一个值或一个 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例可以防止 Laravel 给该值加引号，并让你能够使用数据库特有的函数。一个特别有用的场景是你需要为 JSON 列赋默认值时：

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * 运行数据库迁移。
     */
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->json('movies')->default(new Expression('(JSON_ARRAY())'));
            $table->timestamps();
        });
    }
};
```

> [!WARNING]
> 对默认表达式的支持取决于你的数据库驱动、数据库版本与字段类型。请查阅你的数据库文档。

<a name="column-order"></a>
#### 列顺序

在使用 MariaDB 或 MySQL 数据库时，可以使用 `after` 方法在结构中把新列添加到已有列之后：

```php
$table->after('password', function (Blueprint $table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

<a name="modifying-columns"></a>
### 修改列

`change` 方法允许你修改已有列的类型与属性。例如，你可能希望增大 `string` 列的长度。要看 `change` 方法的实际效果，我们把 `name` 列的长度从 25 增加到 50。要做到这一点，只需定义该列的新状态，然后调用 `change` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

修改列时，你必须显式包含所有希望保留在列定义上的修饰符——任何缺失的属性都会被丢弃。例如，要保留 `unsigned`、`default` 与 `comment` 属性，就必须在修改列时显式调用每个修饰符：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('my comment')->change();
});
```

`change` 方法不会改变列的索引。因此，修改列时你可以使用索引修饰符显式添加或删除索引：

```php
// 添加一个索引...
$table->bigIncrements('id')->primary()->change();

// 删除一个索引...
$table->char('postal_code', 10)->unique(false)->change();
```

<a name="renaming-columns"></a>
### 重命名列

要重命名列，可以使用架构构造器提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

<a name="dropping-columns"></a>
### 删除列

要删除列，可以使用架构构造器上的 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

你也可以把一组列名以数组形式传给 `dropColumn` 方法，一次删除多列：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

<a name="available-command-aliases"></a>
#### 可用的命令别名

Laravel 提供了若干与删除常见类型列相关的便捷方法。每个方法的说明见下表：

<div class="overflow-auto">

| 命令 | 说明 |
| --- | --- |
| `$table->dropMorphs('morphable');` | 删除 `morphable_id` 与 `morphable_type` 列。 |
| `$table->dropRememberToken();` | 删除 `remember_token` 列。 |
| `$table->dropSoftDeletes();` | 删除 `deleted_at` 列。 |
| `$table->dropSoftDeletesTz();` | `dropSoftDeletes()` 方法的别名。 |
| `$table->dropTimestamps();` | 删除 `created_at` 与 `updated_at` 列。 |
| `$table->dropTimestampsTz();` | `dropTimestamps()` 方法的别名。 |

</div>

<a name="indexes"></a>
## 索引

<a name="creating-indexes"></a>
### 创建索引

Laravel 架构构造器支持多种类型的索引。下面的例子创建一个新的 `email` 列，并指定其值必须唯一。要创建该索引，可以在列定义上链式调用 `unique` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，你可以在定义列之后再创建索引。为此，应当在架构构造器的蓝图上调用 `unique` 方法。该方法接受应当获得唯一索引的列名：

```php
$table->unique('email');
```

你甚至可以向索引方法传入一组列，从而创建复合（或组合）索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 会根据表名、列名与索引类型自动生成索引名；不过你也可以给该方法传入第二个参数，自行指定索引名：

```php
$table->unique('email', 'unique_email');
```

<a name="available-index-types"></a>
#### 可用的索引类型

Laravel 架构构造器的蓝图类为 Laravel 支持的每种索引类型都提供了对应的方法。每个索引方法都接受一个可选的第二个参数，用于指定索引名称。如果省略，名称将根据索引所用的表名与列名以及索引类型推导得出。所有可用索引方法的说明见下表：

<div class="overflow-auto">

| 命令 | 说明 |
| --- | --- |
| `$table->primary('id');` | 添加主键。 |
| `$table->primary(['id', 'parent_id']);` | 添加复合主键。 |
| `$table->unique('email');` | 添加唯一索引。 |
| `$table->index('state');` | 添加普通索引。 |
| `$table->fullText('body');` | 添加全文索引（MariaDB / MySQL / PostgreSQL）。 |
| `$table->fullText('body')->language('english');` | 添加指定语言的全文索引（PostgreSQL）。 |
| `$table->spatialIndex('location');` | 添加空间索引（SQLite 除外）。 |

</div>

<a name="renaming-indexes"></a>
### 重命名索引

要重命名索引，可以使用架构构造器蓝图提供的 `renameIndex` 方法。该方法接受当前索引名作为第一个参数，期望的新名称作为第二个参数：

```php
$table->renameIndex('from', 'to')
```

<a name="dropping-indexes"></a>
### 删除索引

要删除索引，必须指定索引的名称。默认情况下，Laravel 会根据表名、被索引的列名与索引类型自动分配索引名称。下面是一些示例：

<div class="overflow-auto">

| 命令 | 说明 |
| --- | --- |
| `$table->dropPrimary('users_id_primary');` | 从 "users" 表中删除主键。 |
| `$table->dropUnique('users_email_unique');` | 从 "users" 表中删除唯一索引。 |
| `$table->dropIndex('geo_state_index');` | 从 "geo" 表中删除普通索引。 |
| `$table->dropFullText('posts_body_fulltext');` | 从 "posts" 表中删除全文索引。 |
| `$table->dropSpatialIndex('geo_location_spatialindex');` | 从 "geo" 表中删除空间索引（SQLite 除外）。 |

</div>

如果把一组列以数组形式传入删除索引的方法，索引名会按约定根据表名、列与索引类型生成：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // 删除索引 'geo_state_index'
});
```

<a name="foreign-key-constraints"></a>
### 外键约束

Laravel 还支持创建外键约束，它用于在数据库层面强制参照完整性。例如，我们在 `posts` 表上定义一个引用 `users` 表 `id` 列的 `user_id` 列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于这种语法相当冗长，Laravel 提供了额外的、更简洁的方法，利用约定来改善开发体验。使用 `foreignId` 方法创建列时，上面的例子可以改写为：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法创建一个等效于 `UNSIGNED BIGINT` 的列，而 `constrained` 方法会按约定确定被引用的表与列。如果你的表名不符合 Laravel 的约定，可以手动提供给 `constrained` 方法。此外，还可以指定要赋给所生成索引的名称：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained(
        table: 'users', indexName: 'posts_user_id'
    );
});
```

你也可以为约束的"on delete"与"on update"属性指定期望的动作：

```php
$table->foreignId('user_id')
    ->constrained()
    ->onUpdate('cascade')
    ->onDelete('cascade');
```

这些动作还提供了另一种表达性的语法：

<div class="overflow-auto">

| 方法 | 说明 |
| --- | --- |
| `$table->cascadeOnUpdate();` | 更新时级联执行。 |
| `$table->restrictOnUpdate();` | 更新时受限。 |
| `$table->nullOnUpdate();` | 更新时把外键值设为 null。 |
| `$table->noActionOnUpdate();` | 更新时不执行任何动作。 |
| `$table->cascadeOnDelete();` | 删除时级联执行。 |
| `$table->restrictOnDelete();` | 删除时受限。 |
| `$table->nullOnDelete();` | 删除时把外键值设为 null。 |
| `$table->noActionOnDelete();` | 存在子记录时阻止删除。 |

</div>

所有额外的[列修饰符](#column-modifiers)都必须在 `constrained` 方法之前调用：

```php
$table->foreignId('user_id')
    ->nullable()
    ->constrained();
```

<a name="dropping-foreign-keys"></a>
#### 删除外键

要删除外键，可以使用 `dropForeign` 方法，并把要删除的外键约束名称作为参数传入。外键约束与索引使用相同的命名约定。换句话说，外键约束名称基于表名与约束中的列名，再加上 "\_foreign" 后缀：

```php
$table->dropForeign('posts_user_id_foreign');
```

或者，你可以把包含外键列名的数组传给 `dropForeign` 方法。该数组会按 Laravel 的约束命名约定转换为外键约束名称：

```php
$table->dropForeign(['user_id']);
```

<a name="toggling-foreign-key-constraints"></a>
#### 启用/禁用外键约束

你可以在迁移中使用以下方法启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // 此闭包内约束已被禁用...
});
```

> [!WARNING]
> SQLite 默认禁用外键约束。使用 SQLite 时，请确保已在数据库配置中[启用外键支持](/docs/{{version}}/database#configuration)，然后才能在迁移中创建外键约束。

<a name="events"></a>
## 事件

为方便起见，每个迁移操作都会分发一个[事件](/docs/{{version}}/events)。以下所有事件都继承自基类 `Illuminate\Database\Events\MigrationEvent`：

<div class="overflow-auto">

| 类 | 说明 |
| --- | --- |
| `Illuminate\Database\Events\MigrationsStarted` | 一批数据库迁移即将执行。 |
| `Illuminate\Database\Events\MigrationsEnded` | 一批数据库迁移已执行完毕。 |
| `Illuminate\Database\Events\MigrationStarted` | 单个数据库迁移即将执行。 |
| `Illuminate\Database\Events\MigrationEnded` | 单个数据库迁移已执行完毕。 |
| `Illuminate\Database\Events\NoPendingMigrations` | 迁移命令未发现待执行的迁移。 |
| `Illuminate\Database\Events\SchemaDumped` | 数据库结构转储已完成。 |
| `Illuminate\Database\Events\SchemaLoaded` | 已加载现有的数据库结构转储。 |

</div>
