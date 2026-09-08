# 数据库：迁移

- [简介](#introduction)
- [生成迁移](#generating-migrations)
    - [压缩迁移](#squashing-migrations)
- [迁移结构](#migration-structure)
- [运行迁移](#running-migrations)
    - [回滚迁移](#rolling-back-migrations)
- [表](#tables)
    - [创建表](#creating-tables)
    - [更新表](#updating-tables)
    - [重命名 / 删除表](#renaming-and-dropping-tables)
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

迁移就像是数据库的版本控制，它允许你的团队定义和共享应用的数据库模式定义。如果你曾经不得不告诉队友在从源代码控制中拉取你的更改后，手动向他们的本地数据库模式添加一列，那么你就遇到了数据库迁移所要解决的问题。

Laravel 的 `Schema` [Facade](/docs/{{version}}/facades) 提供了与数据库无关的支持，可以在 Laravel 支持的所有数据库系统中创建和操作表。通常，迁移会使用此 Facade 来创建和修改数据库表与列。

<a name="generating-migrations"></a>
## 生成迁移

你可以使用 `make:migration` [Artisan 命令](/docs/{{version}}/artisan)生成数据库迁移。新的迁移将放置在 `database/migrations` 目录中。每个迁移文件名都包含一个时间戳，Laravel 用它来确定迁移的顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 将使用迁移的名称来尝试猜测表名以及迁移是否会创建新表。如果 Laravel 能够从迁移名称中确定表名，Laravel 将使用指定的表预填充生成的迁移文件。否则，你可以直接在迁移文件中手动指定表。

如果你想为生成的迁移指定自定义路径，可以在执行 `make:migration` 命令时使用 `--path` 选项。给定路径应相对于应用的基础路径。

> [!NOTE]
> 迁移桩可以使用[桩发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="squashing-migrations"></a>
### 压缩迁移

随着你构建应用，随着时间的推移会积累越来越多的迁移。这可能导致你的 `database/migrations` 目录因可能数百个迁移而变得臃肿。如果你愿意，可以将迁移"压缩"成单个 SQL 文件。要开始，请执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# Dump the current database schema and prune all existing migrations...
php artisan schema:dump --prune
```

执行此命令时，Laravel 会在应用的 `database/schema` 目录中写入一个"schema"文件。schema 文件的名称将与数据库连接对应。现在，当你尝试迁移数据库且没有其他迁移被执行时，Laravel 将首先执行你正在使用的数据库连接的 schema 文件中的 SQL 语句。执行完 schema 文件的 SQL 语句后，Laravel 将执行不属于 schema 转储的任何剩余迁移。

如果你的应用测试使用了与本地开发中通常使用的不同数据库连接，你应确保已使用该数据库连接转储了 schema 文件，以便测试能够构建数据库。你可能希望在转储本地开发中通常使用的数据库连接之后执行此操作：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

你应将数据库 schema 文件提交到源代码控制中，以便团队中的其他新开发者可以快速创建应用的初始数据库结构。

> [!WARNING]
> 迁移压缩仅适用于 MariaDB、MySQL、PostgreSQL 和 SQLite 数据库，并使用数据库的命令行客户端。

<a name="migration-structure"></a>
## 迁移结构

迁移类包含两个方法：`up` 和 `down`。`up` 方法用于向数据库添加新表、列或索引，而 `down` 方法应撤销 `up` 方法执行的操作。

在这两个方法中，你都可以使用 Laravel 的模式构建器富有表现力地创建和修改表。要了解 `Schema` 构建器上可用的所有方法，请[查看其文档](#creating-tables)。例如，以下迁移创建了一个 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
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
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('flights');
    }
};
```

<a name="setting-the-migration-connection"></a>
#### 设置迁移连接

如果你的迁移将与应用默认数据库连接以外的数据库连接交互，则应设置迁移的 `$connection` 属性：

```php
/**
 * The database connection that should be used by the migration.
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * Run the migrations.
 */
public function up(): void
{
    // ...
}
```

<a name="skipping-migrations"></a>
#### 跳过迁移

有时迁移可能是为了支持尚未激活的功能，而你不想让它现在运行。在这种情况下，你可以在迁移上定义一个 `shouldRun` 方法。如果 `shouldRun` 方法返回 `false`，则迁移将被跳过：

```php
use App\Models\Flight;
use Laravel\Pennant\Feature;

/**
 * Determine if this migration should run.
 */
public function shouldRun(): bool
{
    return Feature::active(Flight::class);
}
```

<a name="running-migrations"></a>
## 运行迁移

要运行所有未执行的迁移，请执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果你想查看哪些迁移已经运行、哪些仍在等待中，可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果你向 `migrate` 命令提供 `--step` 选项，该命令将每个迁移作为自己的批次运行，允许你稍后使用 `migrate:rollback` 命令逐个回滚迁移：

```shell
php artisan migrate --step
```

如果你想查看迁移将执行的 SQL 语句而不实际运行它们，可以向 `migrate` 命令提供 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

<a name="isolating-migration-execution"></a>
#### 隔离迁移执行

如果你在多台服务器上部署应用，并将迁移作为部署过程的一部分运行，你可能不希望两台服务器同时尝试迁移数据库。为避免这种情况，你可以在调用 `migrate` 命令时使用 `isolated` 选项。

提供 `isolated` 选项时，Laravel 将在尝试运行迁移之前使用应用的缓存驱动获取原子锁。在该锁被持有期间，所有其他尝试运行 `migrate` 命令的操作都不会执行；但是，该命令仍会以成功的退出状态码退出：

```shell
php artisan migrate --isolated
```

> [!WARNING]
> 要利用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="forcing-migrations-to-run-in-production"></a>
#### 强制在生产环境运行迁移

某些迁移操作是破坏性的，这意味着它们可能导致你丢失数据。为保护你不针对生产数据库运行这些命令，在执行命令之前会提示你进行确认。要强制命令运行而不提示，请使用 `--force` 标志：

```shell
php artisan migrate --force
```

<a name="rolling-back-migrations"></a>
### 回滚迁移

要回滚最新的迁移操作，可以使用 `rollback` Artisan 命令。此命令回滚最后一批"迁移"，其中可能包含多个迁移文件：

```shell
php artisan migrate:rollback
```

你可以通过向 `rollback` 命令提供 `step` 选项来回滚有限数量的迁移。例如，以下命令将回滚最后五个迁移：

```shell
php artisan migrate:rollback --step=5
```

你可以通过向 `rollback` 命令提供 `batch` 选项来回滚特定的"批次"迁移，其中 `batch` 选项对应应用 `migrations` 数据库表中的批次值。例如，以下命令将回滚批次三中的所有迁移：

```shell
php artisan migrate:rollback --batch=3
```

如果你想查看迁移将执行的 SQL 语句而不实际运行它们，可以向 `migrate:rollback` 命令提供 `--pretend` 标志：

```shell
php artisan migrate:rollback --pretend
```

`migrate:reset` 命令将回滚应用的所有迁移：

```shell
php artisan migrate:reset
```

<a name="roll-back-migrate-using-a-single-command"></a>
#### 使用单个命令回滚和迁移

`migrate:refresh` 命令将回滚所有迁移，然后执行 `migrate` 命令。此命令有效地重新创建你的整个数据库：

```shell
php artisan migrate:refresh

# Refresh the database and run all database seeds...
php artisan migrate:refresh --seed
```

你可以通过向 `refresh` 命令提供 `step` 选项来回滚并重新迁移有限数量的迁移。例如，以下命令将回滚并重新迁移最后五个迁移：

```shell
php artisan migrate:refresh --step=5
```

<a name="drop-all-tables-migrate"></a>
#### 删除所有表并迁移

`migrate:fresh` 命令将从数据库中删除所有表，然后执行 `migrate` 命令：

```shell
php artisan migrate:fresh

php artisan migrate:fresh --seed
```

默认情况下，`migrate:fresh` 命令只删除默认数据库连接中的表。但是，你可以使用 `--database` 选项指定应迁移的数据库连接。数据库连接名称应对应于应用 `database` [配置文件](/docs/{{version}}/configuration)中定义的连接：

```shell
php artisan migrate:fresh --database=admin
```

> [!WARNING]
> `migrate:fresh` 命令将删除所有数据库表，无论其前缀如何。在与共享给其他应用使用的数据库上进行开发时，应谨慎使用此命令。

<a name="tables"></a>
## 表

<a name="creating-tables"></a>
### 创建表

要创建新的数据库表，请在 `Schema` Facade 上使用 `create` 方法。`create` 方法接受两个参数：第一个是表名，第二个是接收 `Blueprint` 对象的闭包，可用于定义新表：

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

创建表时，你可以使用模式构建器的任何[列方法](#creating-columns)来定义表的列。

<a name="determining-table-column-existence"></a>
#### 判断表 / 列是否存在

你可以使用 `hasTable`、`hasColumn` 和 `hasIndex` 方法判断表、列或索引是否存在：

```php
if (Schema::hasTable('users')) {
    // The "users" table exists...
}

if (Schema::hasColumn('users', 'email')) {
    // The "users" table exists and has an "email" column...
}

if (Schema::hasIndex('users', ['email'], 'unique')) {
    // The "users" table exists and has a unique index on the "email" column...
}
```

<a name="database-connection-table-options"></a>
#### 数据库连接与表选项

如果你想在非应用默认连接的数据库连接上执行模式操作，请使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，一些其他属性和方法可用于定义表创建的其他方面。当使用 MariaDB 或 MySQL 时，`engine` 属性可用于指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine('InnoDB');

    // ...
});
```

当使用 MariaDB 或 MySQL 时，`charset` 和 `collation` 属性可用于指定所创建表的字符集和排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset('utf8mb4');
    $table->collation('utf8mb4_unicode_ci');

    // ...
});
```

`temporary` 方法可用于指示表应为"临时"表。临时表仅对当前连接的数据库会话可见，并在连接关闭时自动删除：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果你想向数据库表添加"注释"，可以在表实例上调用 `comment` 方法。表注释目前仅受 MariaDB、MySQL 和 PostgreSQL 支持：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

<a name="updating-tables"></a>
### 更新表

`Schema` Facade 上的 `table` 方法可用于更新现有表。与 `create` 方法一样，`table` 方法接受两个参数：表名和一个接收 `Blueprint` 实例的闭包，你可以使用它向表添加列或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="renaming-and-dropping-tables"></a>
### 重命名 / 删除表

要重命名现有的数据库表，请使用 `rename` 方法：

```php
use Illuminate\Support\Facades\Schema;

Schema::rename($from, $to);
```

要删除现有表，可以使用 `drop` 或 `dropIfExists` 方法：

```php
Schema::drop('users');

Schema::dropIfExists('users');
```

<a name="renaming-tables-with-foreign-keys"></a>
#### 重命名带外键的表

重命名表之前，你应验证表上的任何外键约束在迁移文件中都有显式名称，而不是让 Laravel 分配基于约定的名称。否则，外键约束名称将引用旧表名。

<a name="columns"></a>
## 列

<a name="creating-columns"></a>
### 创建列

`Schema` Facade 上的 `table` 方法可用于更新现有表。与 `create` 方法一样，`table` 方法接受两个参数：表名和一个接收 `Illuminate\Database\Schema\Blueprint` 实例的闭包，你可以使用它向表添加列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="available-column-types"></a>
### 可用的列类型

模式构建器蓝图提供了各种方法，对应于你可以添加到数据库表中的不同类型列。下表列出了每种可用方法：

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
#### 数字类型

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

<a name="relationship-method-list"></a>
#### 关联类型

<div class="collection-method-list" markdown="1">

[foreignId](#column-method-foreignId)
[foreignIdFor](#column-method-foreignIdFor)
[foreignUlid](#column-method-foreignUlid)
[foreignUuid](#column-method-foreignUuid)
[foreignUuidFor](#column-method-foreignUuidFor)
[morphs](#column-method-morphs)
[nullableMorphs](#column-method-nullableMorphs)

</div>

<a name="specifics-method-list"></a>
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

`bigIncrements` 方法创建一个自动递增的 `UNSIGNED BIGINT`（主键）等效列：

```php
$table->bigIncrements('id');
```

<a name="column-method-bigInteger"></a>
#### `bigInteger()` {.collection-method}

`bigInteger` 方法创建一个 `BIGINT` 等效列：

```php
$table->bigInteger('votes');
```

<a name="column-method-binary"></a>
#### `binary()` {.collection-method}

`binary` 方法创建一个 `BLOB` 等效列：

```php
$table->binary('photo');
```

使用 MySQL、MariaDB 或 SQL Server 时，你可以传递 `length` 和 `fixed` 参数来创建 `VARBINARY` 或 `BINARY` 等效列：

```php
$table->binary('data', length: 16); // VARBINARY(16)

$table->binary('data', length: 16, fixed: true); // BINARY(16)
```

<a name="column-method-boolean"></a>
#### `boolean()` {.collection-method}

`boolean` 方法创建一个 `BOOLEAN` 等效列：

```php
$table->boolean('confirmed');
```

<a name="column-method-char"></a>
#### `char()` {.collection-method}

`char` 方法创建给定长度的 `CHAR` 等效列：

```php
$table->char('name', length: 100);
```

<a name="column-method-dateTimeTz"></a>
#### `dateTimeTz()` {.collection-method}

`dateTimeTz` 方法创建一个 `DATETIME`（带时区）等效列，并带可选的秒小数精度：

```php
$table->dateTimeTz('created_at', precision: 0);
```

<a name="column-method-dateTime"></a>
#### `dateTime()` {.collection-method}

`dateTime` 方法创建一个 `DATETIME` 等效列，并带可选的秒小数精度：

```php
$table->dateTime('created_at', precision: 0);
```

<a name="column-method-date"></a>
#### `date()` {.collection-method}

`date` 方法创建一个 `DATE` 等效列：

```php
$table->date('created_at');
```

<a name="column-method-decimal"></a>
#### `decimal()` {.collection-method}

`decimal` 方法创建具有给定精度（总位数）和刻度（小数位数）的 `DECIMAL` 等效列：

```php
$table->decimal('amount', total: 8, places: 2);
```

<a name="column-method-double"></a>
#### `double()` {.collection-method}

`double` 方法创建一个 `DOUBLE` 等效列：

```php
$table->double('amount');
```

<a name="column-method-enum"></a>
#### `enum()` {.collection-method}

`enum` 方法创建具有给定有效值的 `ENUM` 等效列：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

当然，你可以使用 `Enum::cases()` 方法，而不是手动定义允许值数组：

```php
use App\Enums\Difficulty;

$table->enum('difficulty', Difficulty::cases());
```

<a name="column-method-float"></a>
#### `float()` {.collection-method}

`float` 方法创建具有给定精度的 `FLOAT` 等效列：

```php
$table->float('amount', precision: 53);
```

<a name="column-method-foreignId"></a>
#### `foreignId()` {.collection-method}

`foreignId` 方法创建一个 `UNSIGNED BIGINT` 等效列：

```php
$table->foreignId('user_id');
```

<a name="column-method-foreignIdFor"></a>
#### `foreignIdFor()` {.collection-method}

`foreignIdFor` 方法为给定模型类添加一个 `{column}_id` 等效列。列类型将根据模型键类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`：

```php
$table->foreignIdFor(User::class);
```

<a name="column-method-foreignUlid"></a>
#### `foreignUlid()` {.collection-method}

`foreignUlid` 方法创建一个 `ULID` 等效列：

```php
$table->foreignUlid('user_id');
```

<a name="column-method-foreignUuid"></a>
#### `foreignUuid()` {.collection-method}

`foreignUuid` 方法创建一个 `UUID` 等效列：

```php
$table->foreignUuid('user_id');
```

<a name="column-method-foreignUuidFor"></a>
#### `foreignUuidFor()` {.collection-method}

`foreignUuidFor` 方法为给定模型类添加一个 `{column}_id` UUID 等效列：

```php
$table->foreignUuidFor(User::class);
```

<a name="column-method-geography"></a>
#### `geography()` {.collection-method}

`geography` 方法创建具有给定空间类型和 SRID（空间参考系统标识符）的 `GEOGRAPHY` 等效列：

```php
$table->geography('coordinates', subtype: 'point', srid: 4326);
```

> [!NOTE]
> 空间类型的支持取决于你的数据库驱动。请参阅你的数据库文档。如果你的应用使用 PostgreSQL 数据库，则必须在使用 `geography` 方法之前安装 [PostGIS](https://postgis.net) 扩展。

<a name="column-method-geometry"></a>
#### `geometry()` {.collection-method}

`geometry` 方法创建具有给定空间类型和 SRID（空间参考系统标识符）的 `GEOMETRY` 等效列：

```php
$table->geometry('positions', subtype: 'point', srid: 0);
```

> [!NOTE]
> 空间类型的支持取决于你的数据库驱动。请参阅你的数据库文档。如果你的应用使用 PostgreSQL 数据库，则必须在使用 `geometry` 方法之前安装 [PostGIS](https://postgis.net) 扩展。

<a name="column-method-id"></a>
#### `id()` {.collection-method}

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法将创建一个 `id` 列；不过，如果你希望为列分配不同名称，可以传递一个列名：

```php
$table->id();
```

<a name="column-method-increments"></a>
#### `increments()` {.collection-method}

`increments` 方法创建一个自动递增的 `UNSIGNED INTEGER` 等效列作为主键：

```php
$table->increments('id');
```

<a name="column-method-integer"></a>
#### `integer()` {.collection-method}

`integer` 方法创建一个 `INTEGER` 等效列：

```php
$table->integer('votes');
```

<a name="column-method-ipAddress"></a>
#### `ipAddress()` {.collection-method}

`ipAddress` 方法创建一个 `VARCHAR` 等效列：

```php
$table->ipAddress('visitor');
```

使用 PostgreSQL 时，将创建 `INET` 列。

<a name="column-method-json"></a>
#### `json()` {.collection-method}

`json` 方法创建一个 `JSON` 等效列：

```php
$table->json('options');
```

使用 SQLite 时，将创建 `TEXT` 列。

<a name="column-method-jsonb"></a>
#### `jsonb()` {.collection-method}

`jsonb` 方法创建一个 `JSONB` 等效列：

```php
$table->jsonb('options');
```

使用 SQLite 时，将创建 `TEXT` 列。

<a name="column-method-longText"></a>
#### `longText()` {.collection-method}

`longText` 方法创建一个 `LONGTEXT` 等效列：

```php
$table->longText('description');
```

使用 MySQL 或 MariaDB 时，你可以向列应用 `binary` 字符集以创建 `LONGBLOB` 等效列：

```php
$table->longText('data')->charset('binary'); // LONGBLOB
```

<a name="column-method-macAddress"></a>
#### `macAddress()` {.collection-method}

`macAddress` 方法创建一个用于保存 MAC 地址的列。某些数据库系统（如 PostgreSQL）为此类数据提供了专用列类型。其他数据库系统将使用字符串等效列：

```php
$table->macAddress('device');
```

<a name="column-method-mediumIncrements"></a>
#### `mediumIncrements()` {.collection-method}

`mediumIncrements` 方法创建一个自动递增的 `UNSIGNED MEDIUMINT` 等效列作为主键：

```php
$table->mediumIncrements('id');
```

<a name="column-method-mediumInteger"></a>
#### `mediumInteger()` {.collection-method}

`mediumInteger` 方法创建一个 `MEDIUMINT` 等效列：

```php
$table->mediumInteger('votes');
```

<a name="column-method-mediumText"></a>
#### `mediumText()` {.collection-method}

`mediumText` 方法创建一个 `MEDIUMTEXT` 等效列：

```php
$table->mediumText('description');
```

使用 MySQL 或 MariaDB 时，你可以向列应用 `binary` 字符集以创建 `MEDIUMBLOB` 等效列：

```php
$table->mediumText('data')->charset('binary'); // MEDIUMBLOB
```

<a name="column-method-morphs"></a>
#### `morphs()` {.collection-method}

`morphs` 方法是一个便捷方法，它添加一个 `{column}_type` `VARCHAR` 等效列和一个 `{column}_id` 等效列。`{column}_id` 的列类型将根据模型键类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`。

此方法用于定义多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的列。在以下示例中，将创建 `taggable_type` 和 `taggable_id` 列：

```php
$table->morphs('taggable');
```

<a name="column-method-nullableMorphs"></a>
#### `nullableMorphs()` {.collection-method}

此方法与 [morphs](#column-method-morphs) 方法类似；但创建的列将是"nullable"：

```php
$table->nullableMorphs('taggable');
```

<a name="column-method-nullableUlidMorphs"></a>
#### `nullableUlidMorphs()` {.collection-method}

此方法与 [ulidMorphs](#column-method-ulidMorphs) 方法类似；但创建的列将是"nullable"：

```php
$table->nullableUlidMorphs('taggable');
```

<a name="column-method-nullableUuidMorphs"></a>
#### `nullableUuidMorphs()` {.collection-method}

此方法与 [uuidMorphs](#column-method-uuidMorphs) 方法类似；但创建的列将是"nullable"：

```php
$table->nullableUuidMorphs('taggable');
```

<a name="column-method-rememberToken"></a>
#### `rememberToken()` {.collection-method}

`rememberToken` 方法创建一个可空的、`VARCHAR(100)` 等效列，用于存储当前的"记住我" [认证令牌](/docs/{{version}}/authentication#remembering-users)：

```php
$table->rememberToken();
```

<a name="column-method-set"></a>
#### `set()` {.collection-method}

`set` 方法创建具有给定有效值列表的 `SET` 等效列：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

<a name="column-method-smallIncrements"></a>
#### `smallIncrements()` {.collection-method}

`smallIncrements` 方法创建一个自动递增的 `UNSIGNED SMALLINT` 等效列作为主键：

```php
$table->smallIncrements('id');
```

<a name="column-method-smallInteger"></a>
#### `smallInteger()` {.collection-method}

`smallInteger` 方法创建一个 `SMALLINT` 等效列：

```php
$table->smallInteger('votes');
```

<a name="column-method-softDeletesTz"></a>
#### `softDeletesTz()` {.collection-method}

`softDeletesTz` 方法添加一个可空的 `deleted_at` `TIMESTAMP`（带时区）等效列，并带可选的秒小数精度。此列用于存储 Eloquent"软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz('deleted_at', precision: 0);
```

<a name="column-method-softDeletes"></a>
#### `softDeletes()` {.collection-method}

`softDeletes` 方法添加一个可空的 `deleted_at` `TIMESTAMP` 等效列，并带可选的秒小数精度。此列用于存储 Eloquent"软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes('deleted_at', precision: 0);
```

<a name="column-method-string"></a>
#### `string()` {.collection-method}

`string` 方法创建给定长度的 `VARCHAR` 等效列：

```php
$table->string('name', length: 100);
```

<a name="column-method-text"></a>
#### `text()` {.collection-method}

`text` 方法创建一个 `TEXT` 等效列：

```php
$table->text('description');
```

使用 MySQL 或 MariaDB 时，你可以向列应用 `binary` 字符集以创建 `BLOB` 等效列：

```php
$table->text('data')->charset('binary'); // BLOB
```

<a name="column-method-timeTz"></a>
#### `timeTz()` {.collection-method}

`timeTz` 方法创建一个 `TIME`（带时区）等效列，并带可选的秒小数精度：

```php
$table->timeTz('sunrise', precision: 0);
```

<a name="column-method-time"></a>
#### `time()` {.collection-method}

`time` 方法创建一个 `TIME` 等效列，并带可选的秒小数精度：

```php
$table->time('sunrise', precision: 0);
```

<a name="column-method-timestampTz"></a>
#### `timestampTz()` {.collection-method}

`timestampTz` 方法创建一个 `TIMESTAMP`（带时区）等效列，并带可选的秒小数精度：

```php
$table->timestampTz('added_at', precision: 0);
```

<a name="column-method-timestamp"></a>
#### `timestamp()` {.collection-method}

`timestamp` 方法创建一个 `TIMESTAMP` 等效列，并带可选的秒小数精度：

```php
$table->timestamp('added_at', precision: 0);
```

<a name="column-method-timestampsTz"></a>
#### `timestampsTz()` {.collection-method}

`timestampsTz` 方法创建 `created_at` 和 `updated_at` `TIMESTAMP`（带时区）等效列，并带可选的秒小数精度：

```php
$table->timestampsTz(precision: 0);
```

<a name="column-method-timestamps"></a>
#### `timestamps()` {.collection-method}

`timestamps` 方法创建 `created_at` 和 `updated_at` `TIMESTAMP` 等效列，并带可选的秒小数精度：

```php
$table->timestamps(precision: 0);
```

<a name="column-method-tinyIncrements"></a>
#### `tinyIncrements()` {.collection-method}

`tinyIncrements` 方法创建一个自动递增的 `UNSIGNED TINYINT` 等效列作为主键：

```php
$table->tinyIncrements('id');
```

<a name="column-method-tinyInteger"></a>
#### `tinyInteger()` {.collection-method}

`tinyInteger` 方法创建一个 `TINYINT` 等效列：

```php
$table->tinyInteger('votes');
```

<a name="column-method-tinyText"></a>
#### `tinyText()` {.collection-method}

`tinyText` 方法创建一个 `TINYTEXT` 等效列：

```php
$table->tinyText('notes');
```

使用 MySQL 或 MariaDB 时，你可以向列应用 `binary` 字符集以创建 `TINYBLOB` 等效列：

```php
$table->tinyText('data')->charset('binary'); // TINYBLOB
```

<a name="column-method-unsignedBigInteger"></a>
#### `unsignedBigInteger()` {.collection-method}

`unsignedBigInteger` 方法创建一个 `UNSIGNED BIGINT` 等效列：

```php
$table->unsignedBigInteger('votes');
```

<a name="column-method-unsignedInteger"></a>
#### `unsignedInteger()` {.collection-method}

`unsignedInteger` 方法创建一个 `UNSIGNED INTEGER` 等效列：

```php
$table->unsignedInteger('votes');
```

<a name="column-method-unsignedMediumInteger"></a>
#### `unsignedMediumInteger()` {.collection-method}

`unsignedMediumInteger` 方法创建一个 `UNSIGNED MEDIUMINT` 等效列：

```php
$table->unsignedMediumInteger('votes');
```

<a name="column-method-unsignedSmallInteger"></a>
#### `unsignedSmallInteger()` {.collection-method}

`unsignedSmallInteger` 方法创建一个 `UNSIGNED SMALLINT` 等效列：

```php
$table->unsignedSmallInteger('votes');
```

<a name="column-method-unsignedTinyInteger"></a>
#### `unsignedTinyInteger()` {.collection-method}

`unsignedTinyInteger` 方法创建一个 `UNSIGNED TINYINT` 等效列：

```php
$table->unsignedTinyInteger('votes');
```

<a name="column-method-ulidMorphs"></a>
#### `ulidMorphs()` {.collection-method}

`ulidMorphs` 方法是一个便捷方法，它添加一个 `{column}_type` `VARCHAR` 等效列和一个 `{column}_id` `CHAR(26)` 等效列。

此方法用于定义使用 ULID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的列。在以下示例中，将创建 `taggable_type` 和 `taggable_id` 列：

```php
$table->ulidMorphs('taggable');
```

<a name="column-method-uuidMorphs"></a>
#### `uuidMorphs()` {.collection-method}

`uuidMorphs` 方法是一个便捷方法，它添加一个 `{column}_type` `VARCHAR` 等效列和一个 `{column}_id` `CHAR(36)` 等效列。

此方法用于定义使用 UUID 标识符的[多态 Eloquent 关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)所需的列。在以下示例中，将创建 `taggable_type` 和 `taggable_id` 列：

```php
$table->uuidMorphs('taggable');
```

<a name="column-method-ulid"></a>
#### `ulid()` {.collection-method}

`ulid` 方法创建一个 `ULID` 等效列：

```php
$table->ulid('id');
```

<a name="column-method-uuid"></a>
#### `uuid()` {.collection-method}

`uuid` 方法创建一个 `UUID` 等效列：

```php
$table->uuid('id');
```

<a name="column-method-vector"></a>
#### `vector()` {.collection-method}

`vector` 方法创建一个 `vector` 等效列：

```php
$table->vector('embedding', dimensions: 100);
```

使用 PostgreSQL 时，必须先加载 `pgvector` 扩展，然后才能创建 `vector` 列：

```php
Schema::ensureVectorExtensionExists();
```

<a name="column-method-year"></a>
#### `year()` {.collection-method}

`year` 方法创建一个 `YEAR` 等效列：

```php
$table->year('birth_year');
```

<a name="column-modifiers"></a>
### 列修饰符

除了上面列出的列类型之外，向数据库表添加列时还可以使用几个列"修饰符"。例如，要使列"nullable"，可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

下表包含所有可用的列修饰符。此列表不包括[索引修饰符](#creating-indexes)：

<div class="overflow-auto">

| 修饰符                            | 描述                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `->after('column')`                 | 将列放在另一列"之后"（MariaDB / MySQL）。                                     |
| `->autoIncrement()`                 | 将 `INTEGER` 列设置为自动递增（主键）。                                      |
| `->charset('utf8mb4')`              | 为列指定字符集（MariaDB / MySQL）。                                      |
| `->collation('utf8mb4_unicode_ci')` | 为列指定排序规则。                                                            |
| `->comment('my comment')`           | 为列添加注释（MariaDB / MySQL / PostgreSQL）。                                      |
| `->default($value)`                 | 为列指定"默认"值。                                                      |
| `->first()`                         | 将列放在表的"最前面"（MariaDB / MySQL）。                                       |
| `->from($integer)`                  | 设置自动递增字段的起始值（MariaDB / MySQL / PostgreSQL）。           |
| `->instant()`                       | 使用即时操作添加或修改列（MySQL）。                                   |
| `->invisible()`                     | 使列对 `SELECT *` 查询"不可见"（MariaDB / MySQL）。                           |
| `->lock($mode)`                     | 为列操作指定锁模式（MySQL）。                                          |
| `->nullable($value = true)`         | 允许向列插入 `NULL` 值。                                            |
| `->storedAs($expression)`           | 创建存储生成的列（MariaDB / MySQL / PostgreSQL / SQLite）。                      |
| `->unsigned()`                      | 将 `INTEGER` 列设置为 `UNSIGNED`（MariaDB / MySQL）。                                         |
| `->using($expression)`              | 在更改列类型时指定转换表达式（PostgreSQL）。                       |
| `->useCurrent()`                    | 将 `TIMESTAMP` 列设置为使用 `CURRENT_TIMESTAMP` 作为默认值。                           |
| `->useCurrentOnUpdate()`            | 将 `TIMESTAMP` 列设置为在记录更新时使用 `CURRENT_TIMESTAMP`（MariaDB / MySQL）。 |
| `->virtualAs($expression)`          | 创建虚拟生成的列（MariaDB / MySQL / SQLite）。                                  |
| `->generatedAs($expression)`        | 使用指定的序列选项创建标识列（PostgreSQL）。                        |
| `->always()`                        | 为标识列定义序列值优先于输入（PostgreSQL）。      |

</div>

<a name="default-expressions"></a>
#### 默认表达式

`default` 修饰符接受一个值或 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例将防止 Laravel 将值括在引号中，并允许你使用数据库特定函数。一种特别有用的场景是当你需要为 JSON 列分配默认值时：

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
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
> 默认表达式的支持取决于你的数据库驱动、数据库版本和字段类型。请参阅你的数据库文档。

<a name="column-order"></a>
#### 列顺序

使用 MariaDB 或 MySQL 数据库时，`after` 方法可用于在模式中的现有列之后添加列：

```php
$table->after('password', function (Blueprint $table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

<a name="instant-column-operations"></a>
#### 即时列操作

使用 MySQL 时，你可以将 `instant` 修饰符链式附加到列定义上，以指示应使用 MySQL 的"instant"算法添加或修改列。此算法允许某些模式更改无需完全重建表即可执行，无论表的大小如何，几乎都能即时完成：

```php
$table->string('name')->nullable()->instant();
```

即时添加列只能将列追加到表的末尾，因此 `instant` 修饰符不能与 `after` 或 `first` 修饰符组合使用。此外，该算法不支持所有列类型或操作。如果请求的操作不兼容，MySQL 将引发错误。

请参阅 [MySQL 文档](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-operations.html)，确定哪些操作与即时列修改兼容。

<a name="ddl-locking"></a>
#### DDL 锁

使用 MySQL 时，你可以将 `lock` 修饰符链式附加到列、索引或外键定义上，以控制模式操作期间的表锁定。MySQL 支持几种锁模式：`none` 允许并发读取和写入，`shared` 允许并发读取但阻止写入，`exclusive` 阻止所有并发访问，`default` 让 MySQL 选择最合适的模式：

```php
$table->string('name')->lock('none');

$table->index('email')->lock('shared');
```

如果请求的锁模式与操作不兼容，MySQL 将引发错误。`lock` 修饰符可以与 `instant` 修饰符组合，以进一步优化模式更改：

```php
$table->string('name')->instant()->lock('none');
```

<a name="modifying-columns"></a>
### 修改列

`change` 方法允许你修改现有列的类型和属性。例如，你可能希望增加 `string` 列的大小。要查看 `change` 方法的实际效果，让我们将 `name` 列的大小从 25 增加到 50。为此，我们只需定义列的新状态，然后调用 `change` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

修改列时，你必须显式包含要保留在列定义中的所有修饰符——任何缺失的属性都会被丢弃。例如，要保留 `unsigned`、`default` 和 `comment` 属性，你必须在更改列时显式调用每个修饰符：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('my comment')->change();
});
```

`change` 方法不会更改列的索引。因此，你可以在修改列时使用索引修饰符显式添加或删除索引：

```php
// Add an index...
$table->bigIncrements('id')->primary()->change();

// Drop an index...
$table->char('postal_code', 10)->unique(false)->change();
```

<a name="postgresql-column-modifications"></a>
#### PostgreSQL 列修改

在 PostgreSQL 上更改列类型时，可以使用 `using` 修饰符指定用于转换现有值的表达式：

```php
Schema::table('users', function (Blueprint $table) {
    $table->date('birthday')->using('birthday::date')->change();
});
```

<a name="renaming-columns"></a>
### 重命名列

要重命名列，可以使用模式构建器提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

<a name="dropping-columns"></a>
### 删除列

要删除列，可以在模式构建器上使用 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

你可以通过向 `dropColumn` 方法传递列名数组来删除表中的多个列：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

<a name="available-command-aliases"></a>
#### 可用的命令别名

Laravel 提供了几个与删除常见列类型相关的便捷方法。下表描述了其中每种方法：

<div class="overflow-auto">

| 命令                             | 描述                                           |
| ----------------------------------- | ----------------------------------------------------- |
| `$table->dropMorphs('morphable');`  | 删除 `morphable_type` 和 `morphable_id` 列。 |
| `$table->dropRememberToken();`      | 删除 `remember_token` 列。                     |
| `$table->dropSoftDeletes();`        | 删除 `deleted_at` 列。                         |
| `$table->dropSoftDeletesTz();`      | `dropSoftDeletes()` 方法的别名。                  |
| `$table->dropTimestamps();`         | 删除 `created_at` 和 `updated_at` 列。       |
| `$table->dropTimestampsTz();`       | `dropTimestamps()` 方法的别名。                   |

</div>

<a name="indexes"></a>
## 索引

<a name="creating-indexes"></a>
### 创建索引

Laravel 模式构建器支持几种类型的索引。以下示例创建一个新的 `email` 列，并指定其值应为唯一。要创建索引，我们可以将 `unique` 方法链式附加到列定义上：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，你可以在定义列之后创建索引。为此，你应在模式构建器蓝图上调用 `unique` 方法。此方法接受应接收唯一索引的列名：

```php
$table->unique('email');
```

你甚至可以将列数组传递给索引方法以创建复合（或组合）索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 将根据表、列名和索引类型自动生成索引名称，但你可以向该方法传递第二个参数来自己指定索引名称：

```php
$table->unique('email', 'unique_email');
```

<a name="available-index-types"></a>
#### 可用的索引类型

Laravel 的模式构建器蓝图类提供了创建 Laravel 支持的每种索引类型的方法。每个索引方法接受一个可选的第二个参数来指定索引名称。如果省略，名称将根据用于索引的表和列名以及索引类型派生。下表描述了每种可用的索引方法：

<div class="overflow-auto">

| 命令                                          | 描述                                                    |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `$table->primary('id');`                         | 添加主键。                                            |
| `$table->primary(['id', 'parent_id']);`          | 添加复合键。                                           |
| `$table->unique('email');`                       | 添加唯一索引。                                           |
| `$table->index('state');`                        | 添加索引。                                                 |
| `$table->fullText('body');`                      | 添加全文索引（MariaDB / MySQL / PostgreSQL）。         |
| `$table->fullText('body')->language('english');` | 添加指定语言的全文索引（PostgreSQL）。 |
| `$table->spatialIndex('location');`              | 添加空间索引（SQLite 除外）。                          |

</div>

<a name="online-index-creation"></a>
#### 在线索引创建

默认情况下，在大型表上创建索引可能会锁定表，并在构建索引期间阻止读取或写入。使用 PostgreSQL 或 SQL Server 时，你可以将 `online` 方法链式附加到索引定义上，以在不锁定表的情况下创建索引，让应用在索引创建期间继续读写数据：

```php
$table->string('email')->unique()->online();
```

使用 PostgreSQL 时，这会向索引创建语句添加 `CONCURRENTLY` 选项。使用 SQL Server 时，这会添加 `WITH (online = on)` 选项。

<a name="renaming-indexes"></a>
### 重命名索引

要重命名索引，可以使用模式构建器蓝图提供的 `renameIndex` 方法。此方法接受当前索引名称作为第一个参数，期望名称作为第二个参数：

```php
$table->renameIndex('from', 'to')
```

<a name="dropping-indexes"></a>
### 删除索引

要删除索引，你必须指定索引的名称。默认情况下，Laravel 会根据表名、被索引列的名称和索引类型自动分配索引名称。以下是一些示例：

<div class="overflow-auto">

| 命令                                                  | 描述                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `$table->dropPrimary('users_id_primary');`               | 从 "users" 表删除主键。                  |
| `$table->dropUnique('users_email_unique');`              | 从 "users" 表删除唯一索引。                 |
| `$table->dropIndex('geo_state_index');`                  | 从 "geo" 表删除基本索引。                    |
| `$table->dropFullText('posts_body_fulltext');`           | 从 "posts" 表删除全文索引。              |
| `$table->dropSpatialIndex('geo_location_spatialindex');` | 从 "geo" 表删除空间索引（SQLite 除外）。 |

</div>

如果将列数组传递给删除索引的方法，将根据表名、列和索引类型生成约定名称：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // Drops index 'geo_state_index'
});
```

<a name="foreign-key-constraints"></a>
### 外键约束

Laravel 还提供对外键约束的支持，用于在数据库级别强制实施引用完整性。例如，让我们在 `posts` 表上定义一个引用 `users` 表 `id` 列的 `user_id` 列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于此语法相当冗长，Laravel 提供了额外的、更简洁的方法，使用约定来提供更好的开发者体验。使用 `foreignId` 方法创建列时，上面的示例可以改写如下：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法创建一个 `UNSIGNED BIGINT` 等效列，而 `constrained` 方法将使用约定来确定被引用的表和列。如果你的表名不符合 Laravel 的约定，你可以手动将其提供给 `constrained` 方法。此外，还可以指定应分配给生成索引的名称：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained(
        table: 'users', indexName: 'posts_user_id'
    );
});
```

你还可以为约束的 "on delete" 和 "on update" 属性指定所需操作：

```php
$table->foreignId('user_id')
    ->constrained()
    ->onUpdate('cascade')
    ->onDelete('cascade');
```

还为这些操作提供了另一种富有表现力的语法：

<div class="overflow-auto">

| 方法                        | 描述                                       |
| ----------------------------- | ------------------------------------------------- |
| `$table->cascadeOnUpdate();`  | 更新应级联。                           |
| `$table->restrictOnUpdate();` | 更新应被限制。                     |
| `$table->nullOnUpdate();`     | 更新应将外键值设置为 null。 |
| `$table->noActionOnUpdate();` | 更新时不执行操作。                             |
| `$table->cascadeOnDelete();`  | 删除应级联。                           |
| `$table->restrictOnDelete();` | 删除应被限制。                     |
| `$table->nullOnDelete();`     | 删除应将外键值设置为 null。 |
| `$table->noActionOnDelete();` | 如果存在子记录则阻止删除。          |

</div>

任何额外的[列修饰符](#column-modifiers)都必须在 `constrained` 方法之前调用：

```php
$table->foreignId('user_id')
    ->nullable()
    ->constrained();
```

<a name="dropping-foreign-keys"></a>
#### 删除外键

要删除外键，可以使用 `dropForeign` 方法，将要删除的外键约束名称作为参数传递。外键约束使用与索引相同的命名约定。换句话说，外键约束名称基于约束中表名和列的名称，后跟 "\_foreign" 后缀：

```php
$table->dropForeign('posts_user_id_foreign');
```

或者，你可以向 `dropForeign` 方法传递包含保存外键的列名的数组。该数组将使用 Laravel 的约束命名约定转换为外键约束名称：

```php
$table->dropForeign(['user_id']);
```

<a name="toggling-foreign-key-constraints"></a>
#### 切换外键约束

你可以在迁移中使用以下方法启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // Constraints disabled within this closure...
});
```

> [!WARNING]
> SQLite 默认禁用外键约束。使用 SQLite 时，请确保在尝试在迁移中创建外键之前，先在数据库配置中[启用外键支持](/docs/{{version}}/database#configuration)。

<a name="events"></a>
## 事件

为方便起见，每次迁移操作都会触发一个[事件](/docs/{{version}}/events)。以下所有事件都继承自基础 `Illuminate\Database\Events\MigrationEvent` 类：

<div class="overflow-auto">

| 类                                            | 描述                                      |
| ------------------------------------------------ | ------------------------------------------------ |
| `Illuminate\Database\Events\DatabaseRefreshed`   | `migrate:refresh` 命令已完成。      |
| `Illuminate\Database\Events\MigrationsStarted`   | 一批迁移即将执行。   |
| `Illuminate\Database\Events\MigrationsEnded`     | 一批迁移已执行完毕。              |
| `Illuminate\Database\Events\MigrationStarted`    | 单个迁移即将执行。      |
| `Illuminate\Database\Events\MigrationEnded`      | 单个迁移已执行完毕。                 |
| `Illuminate\Database\Events\NoPendingMigrations` | 迁移命令未找到待执行的迁移。 |
| `Illuminate\Database\Events\SchemaDumped`        | 数据库模式转储已完成。             |
| `Illuminate\Database\Events\SchemaLoaded`        | 已加载现有的数据库模式转储。     |

</div>
