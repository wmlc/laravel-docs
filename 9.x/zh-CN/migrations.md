# 数据库：数据库迁移

- [简介](#introduction)
- [生成数据库迁移](#generating-migrations)
    - [压缩数据库迁移](#squashing-migrations)
- [数据库迁移结构](#migration-structure)
- [运行数据库迁移](#running-migrations)
    - [回滚数据库迁移](#rolling-back-migrations)
- [数据表](#tables)
    - [创建数据表](#creating-tables)
    - [更新数据表](#updating-tables)
    - [重命名 / 删除数据表](#renaming-and-dropping-tables)
- [字段](#columns)
    - [创建字段](#creating-columns)
    - [可用字段类型](#available-column-types)
    - [字段修饰符](#column-modifiers)
    - [修改字段](#modifying-columns)
    - [重命名字段](#renaming-columns)
    - [删除字段](#dropping-columns)
- [索引](#indexes)
    - [创建索引](#creating-indexes)
    - [重命名索引](#renaming-indexes)
    - [删除索引](#dropping-indexes)
    - [外键约束](#foreign-key-constraints)
- [事件](#events)

<a name="introduction"></a>
## 简介

数据库迁移（Migration）类似于数据库的版本控制，允许团队成员定义并共享应用程序的数据库 schema 定义。如果你曾经从源代码管理中拉取变更后，还需要告诉同事手动向其本地数据库 schema 添加字段，那么你就遇到过数据库迁移所解决的问题。

Laravel 的 `Schema` [Facade](/docs/{{version}}/facades) 提供了与数据库无关的支持，可以在 Laravel 支持的所有数据库系统中创建和操作数据表。通常，数据库迁移会使用这个 Facade 来创建和修改数据库表和字段。

<a name="generating-migrations"></a>
## 生成数据库迁移

可以使用 `make:migration` [Artisan 命令](/docs/{{version}}/artisan) 来生成数据库迁移。新的迁移文件会放在 `database/migrations` 目录中。每个迁移文件名都包含一个时间戳，Laravel 通过它来确定迁移的执行顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 会根据迁移名称尝试推断数据表名称，以及该迁移是否会创建一个新表。如果 Laravel 能够从迁移名称中确定表名，Laravel 会在生成的迁移文件中预填指定的表名。否则，你可以在迁移文件中手动指定表名。

如果想为生成的迁移指定自定义路径，可以在执行 `make:migration` 命令时使用 `--path` 选项。指定的路径应当相对于应用程序的根路径。

> **Note**
> 可以使用[存根发布](/docs/{{version}}/artisan#stub-customization)来自定义迁移存根。

<a name="squashing-migrations"></a>
### 压缩数据库迁移

随着应用程序的开发，迁移文件会随时间不断累积。这可能导致 `database/migrations` 目录变得臃肿，甚至包含数百个迁移文件。如果需要，可以将迁移"压缩"为单个 SQL 文件。首先，执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# 转储当前数据库 schema 并清除所有现有迁移...
php artisan schema:dump --prune
```

执行此命令时，Laravel 会将一个 "schema" 文件写入应用程序的 `database/schema` 目录。schema 文件的名称与数据库连接相对应。此后，当你尝试迁移数据库且没有其他迁移被执行时，Laravel 会先执行当前数据库连接对应的 schema 文件中的 SQL 语句。执行完 schema 文件的语句后，Laravel 会执行剩余的不属于 schema 转储的迁移。

如果应用程序的测试使用与本地开发不同的数据库连接，应当确保已使用该数据库连接转储了 schema 文件，以便测试能够构建数据库。可以在转储本地开发常用的数据库连接之后执行此操作：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

应当将数据库 schema 文件提交到源代码管理中，这样团队中的其他新开发者就能快速创建应用程序的初始数据库结构。

> **Warning**
> 数据库迁移压缩仅适用于 MySQL、PostgreSQL 和 SQLite 数据库，并使用数据库的命令行客户端。Schema 转储无法恢复到内存中的 SQLite 数据库。

<a name="migration-structure"></a>
## 数据库迁移结构

迁移类包含两个方法：`up` 和 `down`。`up` 方法用于向数据库添加新表、字段或索引，而 `down` 方法应当撤销 `up` 方法执行的操作。

在这两个方法中，可以使用 Laravel 的 schema 构造器来直观地创建和修改表。要了解 `Schema` 构造器上所有可用的方法，请[查看其文档](#creating-tables)。例如，以下迁移创建了一个 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 运行迁移。
     *
     * @return void
     */
    public function up()
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('airline');
            $table->timestamps();
        });
    }

    /**
     * 回滚迁移。
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('flights');
    }
};
```

<a name="setting-the-migration-connection"></a>
#### 设置迁移连接

如果迁移要与应用程序默认数据库连接以外的数据库连接交互，应当设置迁移的 `$connection` 属性：

```php
/**
 * 迁移应使用的数据库连接。
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * 运行迁移。
 *
 * @return void
 */
public function up()
{
    //
}
```

<a name="running-migrations"></a>
## 运行数据库迁移

要运行所有未执行的迁移，执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果想查看目前已运行的迁移，可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果想查看迁移将要执行的 SQL 语句而不实际运行，可以向 `migrate` 命令提供 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

#### 隔离迁移执行

如果将应用程序部署在多台服务器上，并在部署过程中运行迁移，你可能不希望两台服务器同时尝试迁移数据库。为避免这种情况，可以在调用 `migrate` 命令时使用 `isolated` 选项。

当提供 `isolated` 选项时，Laravel 会在尝试运行迁移之前，使用应用程序的缓存驱动获取一个原子锁。在该锁被持有期间，所有其他运行 `migrate` 命令的尝试都不会执行；但是，命令仍会以成功的退出状态码退出：

```shell
php artisan migrate --isolated
```

> **Warning**
> 要使用此功能，应用程序必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="forcing-migrations-to-run-in-production"></a>
#### 强制在生产环境中运行迁移

某些迁移操作是破坏性的，可能导致数据丢失。为了防止在生产数据库上运行这些命令，执行命令前会提示确认。要强制运行命令而不提示，使用 `--force` 标志：

```shell
php artisan migrate --force
```

<a name="rolling-back-migrations"></a>
### 回滚数据库迁移

要回滚最近的迁移操作，可以使用 `rollback` Artisan 命令。此命令会回滚最后一批迁移，可能包含多个迁移文件：

```shell
php artisan migrate:rollback
```

可以通过向 `rollback` 命令提供 `step` 选项来回滚指定数量的迁移。例如，以下命令将回滚最近五个迁移：

```shell
php artisan migrate:rollback --step=5
```

`migrate:reset` 命令将回滚应用程序的所有迁移：

```shell
php artisan migrate:reset
```

<a name="roll-back-migrate-using-a-single-command"></a>
#### 使用单个命令回滚并迁移

`migrate:refresh` 命令将回滚所有迁移，然后执行 `migrate` 命令。此命令实际上会重新创建整个数据库：

```shell
php artisan migrate:refresh

# 刷新数据库并运行所有数据填充...
php artisan migrate:refresh --seed
```

可以通过向 `refresh` 命令提供 `step` 选项来回滚并重新迁移指定数量的迁移。例如，以下命令将回滚并重新迁移最近五个迁移：

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

> **Warning**
> `migrate:fresh` 命令会删除所有数据库表，无论其前缀如何。在与其他应用程序共享的数据库上开发时，应谨慎使用此命令。

<a name="tables"></a>
## 数据表

<a name="creating-tables"></a>
### 创建数据表

要创建新的数据库表，使用 `Schema` Facade 的 `create` 方法。`create` 方法接受两个参数：第一个是表名，第二个是一个闭包，闭包接收一个可用于定义新表的 `Blueprint` 对象：

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

创建表时，可以使用 schema 构造器的任何[字段方法](#creating-columns)来定义表的字段。

<a name="checking-for-table-column-existence"></a>
#### 检查表 / 字段是否存在

可以使用 `hasTable` 和 `hasColumn` 方法检查表或字段是否存在：

```php
if (Schema::hasTable('users')) {
    // "users" 表存在...
}

if (Schema::hasColumn('users', 'email')) {
    // "users" 表存在且包含 "email" 字段...
}
```

<a name="database-connection-table-options"></a>
#### 数据库连接 & 表选项

如果要在非应用程序默认连接的数据库连接上执行 schema 操作，使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，还有一些其他属性和方法可用于定义表创建的其他方面。使用 MySQL 时，`engine` 属性可用于指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine = 'InnoDB';

    // ...
});
```

使用 MySQL 时，`charset` 和 `collation` 属性可用于指定所创建表的字符集和排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset = 'utf8mb4';
    $table->collation = 'utf8mb4_unicode_ci';

    // ...
});
```

`temporary` 方法可用于指示表应当是"临时的"。临时表仅对当前连接的数据库会话可见，并在连接关闭时自动删除：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果想为数据库表添加"注释"，可以在表实例上调用 `comment` 方法。表注释目前仅由 MySQL 和 Postgres 支持：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

<a name="updating-tables"></a>
### 更新数据表

`Schema` Facade 的 `table` 方法可用于更新现有表。与 `create` 方法类似，`table` 方法接受两个参数：表名和一个闭包，闭包接收一个 `Blueprint` 实例，可用于向表添加字段或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="renaming-and-dropping-tables"></a>
### 重命名 / 删除数据表

要重命名现有数据库表，使用 `rename` 方法：

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
#### 重命名带有外键的表

重命名表之前，应当确保迁移文件中表上的所有外键约束都有显式名称，而不是让 Laravel 分配基于约定的名称。否则，外键约束名称将引用旧的表名。

<a name="columns"></a>
## 字段

<a name="creating-columns"></a>
### 创建字段

`Schema` Facade 的 `table` 方法可用于更新现有表。与 `create` 方法类似，`table` 方法接受两个参数：表名和一个闭包，闭包接收一个 `Illuminate\Database\Schema\Blueprint` 实例，可用于向表添加字段：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="available-column-types"></a>
### 可用字段类型

schema 构造器蓝图提供了多种方法，对应于可以添加到数据库表的不同字段类型。所有可用方法列在下表中：

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

[bigIncrements](#column-method-bigIncrements)
[bigInteger](#column-method-bigInteger)
[binary](#column-method-binary)
[boolean](#column-method-boolean)
[char](#column-method-char)
[dateTimeTz](#column-method-dateTimeTz)
[dateTime](#column-method-dateTime)
[date](#column-method-date)
[decimal](#column-method-decimal)
[double](#column-method-double)
[enum](#column-method-enum)
[float](#column-method-float)
[foreignId](#column-method-foreignId)
[foreignIdFor](#column-method-foreignIdFor)
[foreignUlid](#column-method-foreignUlid)
[foreignUuid](#column-method-foreignUuid)
[geometryCollection](#column-method-geometryCollection)
[geometry](#column-method-geometry)
[id](#column-method-id)
[increments](#column-method-increments)
[integer](#column-method-integer)
[ipAddress](#column-method-ipAddress)
[json](#column-method-json)
[jsonb](#column-method-jsonb)
[lineString](#column-method-lineString)
[longText](#column-method-longText)
[macAddress](#column-method-macAddress)
[mediumIncrements](#column-method-mediumIncrements)
[mediumInteger](#column-method-mediumInteger)
[mediumText](#column-method-mediumText)
[morphs](#column-method-morphs)
[multiLineString](#column-method-multiLineString)
[multiPoint](#column-method-multiPoint)
[multiPolygon](#column-method-multiPolygon)
[nullableMorphs](#column-method-nullableMorphs)
[nullableTimestamps](#column-method-nullableTimestamps)
[nullableUlidMorphs](#column-method-nullableUlidMorphs)
[nullableUuidMorphs](#column-method-nullableUuidMorphs)
[point](#column-method-point)
[polygon](#column-method-polygon)
[rememberToken](#column-method-rememberToken)
[set](#column-method-set)
[smallIncrements](#column-method-smallIncrements)
[smallInteger](#column-method-smallInteger)
[softDeletesTz](#column-method-softDeletesTz)
[softDeletes](#column-method-softDeletes)
[string](#column-method-string)
[text](#column-method-text)
[timeTz](#column-method-timeTz)
[time](#column-method-time)
[timestampTz](#column-method-timestampTz)
[timestamp](#column-method-timestamp)
[timestampsTz](#column-method-timestampsTz)
[timestamps](#column-method-timestamps)
[tinyIncrements](#column-method-tinyIncrements)
[tinyInteger](#column-method-tinyInteger)
[tinyText](#column-method-tinyText)
[unsignedBigInteger](#column-method-unsignedBigInteger)
[unsignedDecimal](#column-method-unsignedDecimal)
[unsignedInteger](#column-method-unsignedInteger)
[unsignedMediumInteger](#column-method-unsignedMediumInteger)
[unsignedSmallInteger](#column-method-unsignedSmallInteger)
[unsignedTinyInteger](#column-method-unsignedTinyInteger)
[ulidMorphs](#column-method-ulidMorphs)
[uuidMorphs](#column-method-uuidMorphs)
[ulid](#column-method-ulid)
[uuid](#column-method-uuid)
[year](#column-method-year)

<a name="column-method-bigIncrements"></a>
#### `bigIncrements()` {.collection-method .first-collection-method}

`bigIncrements` 方法创建一个自增的 `UNSIGNED BIGINT`（主键）等价字段：

```php
$table->bigIncrements('id');
```

<a name="column-method-bigInteger"></a>
#### `bigInteger()` {.collection-method}

`bigInteger` 方法创建一个 `BIGINT` 等价字段：

```php
$table->bigInteger('votes');
```

<a name="column-method-binary"></a>
#### `binary()` {.collection-method}

`binary` 方法创建一个 `BLOB` 等价字段：

```php
$table->binary('photo');
```

<a name="column-method-boolean"></a>
#### `boolean()` {.collection-method}

`boolean` 方法创建一个 `BOOLEAN` 等价字段：

```php
$table->boolean('confirmed');
```

<a name="column-method-char"></a>
#### `char()` {.collection-method}

`char` 方法创建一个指定长度的 `CHAR` 等价字段：

```php
$table->char('name', 100);
```

<a name="column-method-dateTimeTz"></a>
#### `dateTimeTz()` {.collection-method}

`dateTimeTz` 方法创建一个带时区的 `DATETIME` 等价字段，可指定精度（总位数）：

```php
$table->dateTimeTz('created_at', $precision = 0);
```

<a name="column-method-dateTime"></a>
#### `dateTime()` {.collection-method}

`dateTime` 方法创建一个 `DATETIME` 等价字段，可指定精度（总位数）：

```php
$table->dateTime('created_at', $precision = 0);
```

<a name="column-method-date"></a>
#### `date()` {.collection-method}

`date` 方法创建一个 `DATE` 等价字段：

```php
$table->date('created_at');
```

<a name="column-method-decimal"></a>
#### `decimal()` {.collection-method}

`decimal` 方法创建一个 `DECIMAL` 等价字段，可指定精度（总位数）和小数位数：

```php
$table->decimal('amount', $precision = 8, $scale = 2);
```

<a name="column-method-double"></a>
#### `double()` {.collection-method}

`double` 方法创建一个 `DOUBLE` 等价字段，可指定精度（总位数）和小数位数：

```php
$table->double('amount', 8, 2);
```

<a name="column-method-enum"></a>
#### `enum()` {.collection-method}

`enum` 方法创建一个 `ENUM` 等价字段，包含给定的有效值：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

<a name="column-method-float"></a>
#### `float()` {.collection-method}

`float` 方法创建一个 `FLOAT` 等价字段，可指定精度（总位数）和小数位数：

```php
$table->float('amount', 8, 2);
```

<a name="column-method-foreignId"></a>
#### `foreignId()` {.collection-method}

`foreignId` 方法创建一个 `UNSIGNED BIGINT` 等价字段：

```php
$table->foreignId('user_id');
```

<a name="column-method-foreignIdFor"></a>
#### `foreignIdFor()` {.collection-method}

`foreignIdFor` 方法为给定的模型类添加一个 `{column}_id UNSIGNED BIGINT` 等价字段：

```php
$table->foreignIdFor(User::class);
```

<a name="column-method-foreignUlid"></a>
#### `foreignUlid()` {.collection-method}

`foreignUlid` 方法创建一个 `ULID` 等价字段：

```php
$table->foreignUlid('user_id');
```

<a name="column-method-foreignUuid"></a>
#### `foreignUuid()` {.collection-method}

`foreignUuid` 方法创建一个 `UUID` 等价字段：

```php
$table->foreignUuid('user_id');
```

<a name="column-method-geometryCollection"></a>
#### `geometryCollection()` {.collection-method}

`geometryCollection` 方法创建一个 `GEOMETRYCOLLECTION` 等价字段：

```php
$table->geometryCollection('positions');
```

<a name="column-method-geometry"></a>
#### `geometry()` {.collection-method}

`geometry` 方法创建一个 `GEOMETRY` 等价字段：

```php
$table->geometry('positions');
```

<a name="column-method-id"></a>
#### `id()` {.collection-method}

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法会创建一个 `id` 字段；但如果想为字段指定不同的名称，可以传入字段名：

```php
$table->id();
```

<a name="column-method-increments"></a>
#### `increments()` {.collection-method}

`increments` 方法创建一个自增的 `UNSIGNED INTEGER` 等价字段作为主键：

```php
$table->increments('id');
```

<a name="column-method-integer"></a>
#### `integer()` {.collection-method}

`integer` 方法创建一个 `INTEGER` 等价字段：

```php
$table->integer('votes');
```

<a name="column-method-ipAddress"></a>
#### `ipAddress()` {.collection-method}

`ipAddress` 方法创建一个 `VARCHAR` 等价字段：

```php
$table->ipAddress('visitor');
```

<a name="column-method-json"></a>
#### `json()` {.collection-method}

`json` 方法创建一个 `JSON` 等价字段：

```php
$table->json('options');
```

<a name="column-method-jsonb"></a>
#### `jsonb()` {.collection-method}

`jsonb` 方法创建一个 `JSONB` 等价字段：

```php
$table->jsonb('options');
```

<a name="column-method-lineString"></a>
#### `lineString()` {.collection-method}

`lineString` 方法创建一个 `LINESTRING` 等价字段：

```php
$table->lineString('positions');
```

<a name="column-method-longText"></a>
#### `longText()` {.collection-method}

`longText` 方法创建一个 `LONGTEXT` 等价字段：

```php
$table->longText('description');
```

<a name="column-method-macAddress"></a>
#### `macAddress()` {.collection-method}

`macAddress` 方法创建一个用于存储 MAC 地址的字段。某些数据库系统（如 PostgreSQL）为此类数据提供了专用的字段类型。其他数据库系统将使用字符串等价字段：

```php
$table->macAddress('device');
```

<a name="column-method-mediumIncrements"></a>
#### `mediumIncrements()` {.collection-method}

`mediumIncrements` 方法创建一个自增的 `UNSIGNED MEDIUMINT` 等价字段作为主键：

```php
$table->mediumIncrements('id');
```

<a name="column-method-mediumInteger"></a>
#### `mediumInteger()` {.collection-method}

`mediumInteger` 方法创建一个 `MEDIUMINT` 等价字段：

```php
$table->mediumInteger('votes');
```

<a name="column-method-mediumText"></a>
#### `mediumText()` {.collection-method}

`mediumText` 方法创建一个 `MEDIUMTEXT` 等价字段：

```php
$table->mediumText('description');
```

<a name="column-method-morphs"></a>
#### `morphs()` {.collection-method}

`morphs` 方法是一个便捷方法，用于添加 `{column}_id` `UNSIGNED BIGINT` 等价字段和 `{column}_type` `VARCHAR` 等价字段。

此方法用于定义多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships) 所需的字段。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 字段：

```php
$table->morphs('taggable');
```

<a name="column-method-multiLineString"></a>
#### `multiLineString()` {.collection-method}

`multiLineString` 方法创建一个 `MULTILINESTRING` 等价字段：

```php
$table->multiLineString('positions');
```

<a name="column-method-multiPoint"></a>
#### `multiPoint()` {.collection-method}

`multiPoint` 方法创建一个 `MULTIPOINT` 等价字段：

```php
$table->multiPoint('positions');
```

<a name="column-method-multiPolygon"></a>
#### `multiPolygon()` {.collection-method}

`multiPolygon` 方法创建一个 `MULTIPOLYGON` 等价字段：

```php
$table->multiPolygon('positions');
```

<a name="column-method-nullableTimestamps"></a>
#### `nullableTimestamps()` {.collection-method}

`nullableTimestamps` 方法是 [timestamps](#column-method-timestamps) 方法的别名：

```php
$table->nullableTimestamps(0);
```

<a name="column-method-nullableMorphs"></a>
#### `nullableMorphs()` {.collection-method}

此方法类似于 [morphs](#column-method-morphs) 方法，但创建的字段将是 "nullable"（可为空）的：

```php
$table->nullableMorphs('taggable');
```

<a name="column-method-nullableUlidMorphs"></a>
#### `nullableUlidMorphs()` {.collection-method}

此方法类似于 [ulidMorphs](#column-method-ulidMorphs) 方法，但创建的字段将是 "nullable"（可为空）的：

```php
$table->nullableUlidMorphs('taggable');
```

<a name="column-method-nullableUuidMorphs"></a>
#### `nullableUuidMorphs()` {.collection-method}

此方法类似于 [uuidMorphs](#column-method-uuidMorphs) 方法，但创建的字段将是 "nullable"（可为空）的：

```php
$table->nullableUuidMorphs('taggable');
```

<a name="column-method-point"></a>
#### `point()` {.collection-method}

`point` 方法创建一个 `POINT` 等价字段：

```php
$table->point('position');
```

<a name="column-method-polygon"></a>
#### `polygon()` {.collection-method}

`polygon` 方法创建一个 `POLYGON` 等价字段：

```php
$table->polygon('position');
```

<a name="column-method-rememberToken"></a>
#### `rememberToken()` {.collection-method}

`rememberToken` 方法创建一个可为空的 `VARCHAR(100)` 等价字段，用于存储当前的 "remember me" [认证令牌](/docs/{{version}}/authentication#remembering-users)：

```php
$table->rememberToken();
```

<a name="column-method-set"></a>
#### `set()` {.collection-method}

`set` 方法创建一个 `SET` 等价字段，包含给定的有效值列表：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

<a name="column-method-smallIncrements"></a>
#### `smallIncrements()` {.collection-method}

`smallIncrements` 方法创建一个自增的 `UNSIGNED SMALLINT` 等价字段作为主键：

```php
$table->smallIncrements('id');
```

<a name="column-method-smallInteger"></a>
#### `smallInteger()` {.collection-method}

`smallInteger` 方法创建一个 `SMALLINT` 等价字段：

```php
$table->smallInteger('votes');
```

<a name="column-method-softDeletesTz"></a>
#### `softDeletesTz()` {.collection-method}

`softDeletesTz` 方法添加一个可为空的 `deleted_at` `TIMESTAMP`（带时区）等价字段，可指定精度（总位数）。此字段用于存储 Eloquent "软删除" 功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz($column = 'deleted_at', $precision = 0);
```

<a name="column-method-softDeletes"></a>
#### `softDeletes()` {.collection-method}

`softDeletes` 方法添加一个可为空的 `deleted_at` `TIMESTAMP` 等价字段，可指定精度（总位数）。此字段用于存储 Eloquent "软删除" 功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes($column = 'deleted_at', $precision = 0);
```

<a name="column-method-string"></a>
#### `string()` {.collection-method}

`string` 方法创建一个指定长度的 `VARCHAR` 等价字段：

```php
$table->string('name', 100);
```

<a name="column-method-text"></a>
#### `text()` {.collection-method}

`text` 方法创建一个 `TEXT` 等价字段：

```php
$table->text('description');
```

<a name="column-method-timeTz"></a>
#### `timeTz()` {.collection-method}

`timeTz` 方法创建一个带时区的 `TIME` 等价字段，可指定精度（总位数）：

```php
$table->timeTz('sunrise', $precision = 0);
```

<a name="column-method-time"></a>
#### `time()` {.collection-method}

`time` 方法创建一个 `TIME` 等价字段，可指定精度（总位数）：

```php
$table->time('sunrise', $precision = 0);
```

<a name="column-method-timestampTz"></a>
#### `timestampTz()` {.collection-method}

`timestampTz` 方法创建一个带时区的 `TIMESTAMP` 等价字段，可指定精度（总位数）：

```php
$table->timestampTz('added_at', $precision = 0);
```

<a name="column-method-timestamp"></a>
#### `timestamp()` {.collection-method}

`timestamp` 方法创建一个 `TIMESTAMP` 等价字段，可指定精度（总位数）：

```php
$table->timestamp('added_at', $precision = 0);
```

<a name="column-method-timestampsTz"></a>
#### `timestampsTz()` {.collection-method}

`timestampsTz` 方法创建 `created_at` 和 `updated_at` `TIMESTAMP`（带时区）等价字段，可指定精度（总位数）：

```php
$table->timestampsTz($precision = 0);
```

<a name="column-method-timestamps"></a>
#### `timestamps()` {.collection-method}

`timestamps` 方法创建 `created_at` 和 `updated_at` `TIMESTAMP` 等价字段，可指定精度（总位数）：

```php
$table->timestamps($precision = 0);
```

<a name="column-method-tinyIncrements"></a>
#### `tinyIncrements()` {.collection-method}

`tinyIncrements` 方法创建一个自增的 `UNSIGNED TINYINT` 等价字段作为主键：

```php
$table->tinyIncrements('id');
```

<a name="column-method-tinyInteger"></a>
#### `tinyInteger()` {.collection-method}

`tinyInteger` 方法创建一个 `TINYINT` 等价字段：

```php
$table->tinyInteger('votes');
```

<a name="column-method-tinyText"></a>
#### `tinyText()` {.collection-method}

`tinyText` 方法创建一个 `TINYTEXT` 等价字段：

```php
$table->tinyText('notes');
```

<a name="column-method-unsignedBigInteger"></a>
#### `unsignedBigInteger()` {.collection-method}

`unsignedBigInteger` 方法创建一个 `UNSIGNED BIGINT` 等价字段：

```php
$table->unsignedBigInteger('votes');
```

<a name="column-method-unsignedDecimal"></a>
#### `unsignedDecimal()` {.collection-method}

`unsignedDecimal` 方法创建一个 `UNSIGNED DECIMAL` 等价字段，可指定精度（总位数）和小数位数：

```php
$table->unsignedDecimal('amount', $precision = 8, $scale = 2);
```

<a name="column-method-unsignedInteger"></a>
#### `unsignedInteger()` {.collection-method}

`unsignedInteger` 方法创建一个 `UNSIGNED INTEGER` 等价字段：

```php
$table->unsignedInteger('votes');
```

<a name="column-method-unsignedMediumInteger"></a>
#### `unsignedMediumInteger()` {.collection-method}

`unsignedMediumInteger` 方法创建一个 `UNSIGNED MEDIUMINT` 等价字段：

```php
$table->unsignedMediumInteger('votes');
```

<a name="column-method-unsignedSmallInteger"></a>
#### `unsignedSmallInteger()` {.collection-method}

`unsignedSmallInteger` 方法创建一个 `UNSIGNED SMALLINT` 等价字段：

```php
$table->unsignedSmallInteger('votes');
```

<a name="column-method-unsignedTinyInteger"></a>
#### `unsignedTinyInteger()` {.collection-method}

`unsignedTinyInteger` 方法创建一个 `UNSIGNED TINYINT` 等价字段：

```php
$table->unsignedTinyInteger('votes');
```

<a name="column-method-ulidMorphs"></a>
#### `ulidMorphs()` {.collection-method}

`ulidMorphs` 方法是一个便捷方法，用于添加 `{column}_id` `CHAR(26)` 等价字段和 `{column}_type` `VARCHAR` 等价字段。

此方法用于定义使用 ULID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships) 所需的字段。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 字段：

```php
$table->ulidMorphs('taggable');
```

<a name="column-method-uuidMorphs"></a>
#### `uuidMorphs()` {.collection-method}

`uuidMorphs` 方法是一个便捷方法，用于添加 `{column}_id` `CHAR(36)` 等价字段和 `{column}_type` `VARCHAR` 等价字段。

此方法用于定义使用 UUID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships) 所需的字段。在以下示例中，将创建 `taggable_id` 和 `taggable_type` 字段：

```php
$table->uuidMorphs('taggable');
```

<a name="column-method-ulid"></a>
#### `ulid()` {.collection-method}

`ulid` 方法创建一个 `ULID` 等价字段：

```php
$table->ulid('id');
```

<a name="column-method-uuid"></a>
#### `uuid()` {.collection-method}

`uuid` 方法创建一个 `UUID` 等价字段：

```php
$table->uuid('id');
```

<a name="column-method-year"></a>
#### `year()` {.collection-method}

`year` 方法创建一个 `YEAR` 等价字段：

```php
$table->year('birth_year');
```

<a name="column-modifiers"></a>
### 字段修饰符

除了上面列出的字段类型外，向数据库表添加字段时还可以使用多个字段"修饰符"。例如，要将字段设为 "nullable"（可为空），可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

下表包含所有可用的字段修饰符。此列表不包含[索引修饰符](#creating-indexes)：

修饰符  |  说明
--------  |  -----------
`->after('column')`  |  将字段置于另一字段"之后"（MySQL）。
`->autoIncrement()`  |  将 INTEGER 字段设为自增（主键）。
`->charset('utf8mb4')`  |  指定字段的字符集（MySQL）。
`->collation('utf8mb4_unicode_ci')`  |  指定字段的排序规则（MySQL/PostgreSQL/SQL Server）。
`->comment('my comment')`  |  为字段添加注释（MySQL/PostgreSQL）。
`->default($value)`  |  指定字段的"默认"值。
`->first()`  |  将字段置于表中的"首位"（MySQL）。
`->from($integer)`  |  设置自增字段的起始值（MySQL / PostgreSQL）。
`->invisible()`  |  使字段对 `SELECT *` 查询"不可见"（MySQL）。
`->nullable($value = true)`  |  允许向字段插入 NULL 值。
`->storedAs($expression)`  |  创建存储生成字段（MySQL / PostgreSQL）。
`->unsigned()`  |  将 INTEGER 字段设为 UNSIGNED（MySQL）。
`->useCurrent()`  |  将 TIMESTAMP 字段设为使用 CURRENT_TIMESTAMP 作为默认值。
`->useCurrentOnUpdate()`  |  将 TIMESTAMP 字段设为在更新记录时使用 CURRENT_TIMESTAMP。
`->virtualAs($expression)`  |  创建虚拟生成字段（MySQL / PostgreSQL / SQLite）。
`->generatedAs($expression)`  |  创建具有指定序列选项的标识字段（PostgreSQL）。
`->always()`  |  定义标识字段中序列值优先于输入值（PostgreSQL）。
`->isGeometry()`  |  将空间字段类型设为 `geometry`，默认类型为 `geography`（PostgreSQL）。

<a name="default-expressions"></a>
#### 默认表达式

`default` 修饰符接受一个值或 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例会阻止 Laravel 将值用引号包裹，并允许使用数据库特定的函数。这在需要为 JSON 字段指定默认值时特别有用：

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * 运行迁移。
     *
     * @return void
     */
    public function up()
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->json('movies')->default(new Expression('(JSON_ARRAY())'));
            $table->timestamps();
        });
    }
};
```

> **Warning**
> 默认表达式的支持取决于数据库驱动、数据库版本和字段类型。请参阅数据库的文档。此外，无法将原始 `default` 表达式（使用 `DB::raw`）与通过 `change` 方法进行的字段更改结合使用。

<a name="column-order"></a>
#### 字段顺序

使用 MySQL 数据库时，可以使用 `after` 方法在 schema 中现有字段之后添加字段：

```php
$table->after('password', function ($table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

<a name="modifying-columns"></a>
### 修改字段

<a name="prerequisites"></a>
#### 前置条件

修改字段之前，必须使用 Composer 包管理器安装 `doctrine/dbal` 包。Doctrine DBAL 库用于确定字段的当前状态，并创建对字段进行所需更改所需的 SQL 查询：

```shell
composer require doctrine/dbal
```

如果计划修改使用 `timestamp` 方法创建的字段，还必须在应用程序的 `config/database.php` 配置文件中添加以下配置：

```php
use Illuminate\Database\DBAL\TimestampType;

'dbal' => [
    'types' => [
        'timestamp' => TimestampType::class,
    ],
],
```

> **Warning**
> 如果应用程序使用 Microsoft SQL Server，请确保安装 `doctrine/dbal:^3.0`。

<a name="updating-column-attributes"></a>
#### 更新字段属性

`change` 方法允许修改现有字段的类型和属性。例如，可能需要增大 `string` 字段的长度。要查看 `change` 方法的用法，让我们将 `name` 字段的长度从 25 增加到 50。为此，只需定义字段的新状态，然后调用 `change` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

也可以将字段修改为可为空：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->nullable()->change();
});
```

> **Warning**
> 以下字段类型可以被修改：`bigInteger`、`binary`、`boolean`、`char`、`date`、`dateTime`、`dateTimeTz`、`decimal`、`double`、`integer`、`json`、`longText`、`mediumText`、`smallInteger`、`string`、`text`、`time`、`tinyText`、`unsignedBigInteger`、`unsignedInteger`、`unsignedSmallInteger` 和 `uuid`。要修改 `timestamp` 字段类型，必须[注册 Doctrine 类型](#prerequisites)。

<a name="renaming-columns"></a>
### 重命名字段

要重命名字段，可以使用 schema 构造器提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

<a name="renaming-columns-on-legacy-databases"></a>
#### 在旧版数据库上重命名字段

如果运行的数据库版本低于以下某个版本，在重命名字段之前，应当确保已通过 Composer 包管理器安装了 `doctrine/dbal` 库：

- MySQL < `8.0.3`
- MariaDB < `10.5.2`
- SQLite < `3.25.0`

<a name="dropping-columns"></a>
### 删除字段

要删除字段，可以使用 schema 构造器的 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

可以通过向 `dropColumn` 方法传递字段名数组来从表中删除多个字段：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

<a name="dropping-columns-on-legacy-databases"></a>
#### 在旧版数据库上删除字段

如果运行的 SQLite 版本低于 `3.35.0`，在使用 `dropColumn` 方法之前，必须通过 Composer 包管理器安装 `doctrine/dbal` 包。使用此包时不支持在单个迁移中删除或修改多个字段。

<a name="available-command-aliases"></a>
#### 可用命令别名

Laravel 提供了几个与删除常见类型字段相关的便捷方法。每个方法在下表中描述：

命令  |  说明
-------  |  -----------
`$table->dropMorphs('morphable');`  |  删除 `morphable_id` 和 `morphable_type` 字段。
`$table->dropRememberToken();`  |  删除 `remember_token` 字段。
`$table->dropSoftDeletes();`  |  删除 `deleted_at` 字段。
`$table->dropSoftDeletesTz();`  |  `dropSoftDeletes()` 方法的别名。
`$table->dropTimestamps();`  |  删除 `created_at` 和 `updated_at` 字段。
`$table->dropTimestampsTz();` |  `dropTimestamps()` 方法的别名。

<a name="indexes"></a>
## 索引

<a name="creating-indexes"></a>
### 创建索引

Laravel schema 构造器支持多种类型的索引。以下示例创建一个新的 `email` 字段，并指定其值应当唯一。要创建索引，可以将 `unique` 方法链接到字段定义上：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，可以在定义字段之后创建索引。为此，应当在 schema 构造器蓝图上调用 `unique` 方法。此方法接收应当添加唯一索引的字段名：

```php
$table->unique('email');
```

甚至可以向索引方法传递字段数组来创建复合（或组合）索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 会根据表名、字段名和索引类型自动生成索引名称，但可以向方法传递第二个参数来手动指定索引名称：

```php
$table->unique('email', 'unique_email');
```

<a name="available-index-types"></a>
#### 可用索引类型

Laravel 的 schema 构造器蓝图类提供了创建 Laravel 支持的每种索引类型的方法。每个索引方法接受一个可选的第二个参数来指定索引名称。如果省略，名称将根据用于索引的表名和字段名以及索引类型派生。每个可用的索引方法在下表中描述：

命令  |  说明
-------  |  -----------
`$table->primary('id');`  |  添加主键。
`$table->primary(['id', 'parent_id']);`  |  添加复合键。
`$table->unique('email');`  |  添加唯一索引。
`$table->index('state');`  |  添加索引。
`$table->fullText('body');`  |  添加全文索引（MySQL/PostgreSQL）。
`$table->fullText('body')->language('english');`  |  添加指定语言的全文索引（PostgreSQL）。
`$table->spatialIndex('location');`  |  添加空间索引（SQLite 除外）。

<a name="index-lengths-mysql-mariadb"></a>
#### 索引长度 & MySQL / MariaDB

默认情况下，Laravel 使用 `utf8mb4` 字符集。如果运行的 MySQL 版本低于 5.7.7 或 MariaDB 版本低于 10.2.2，可能需要手动配置迁移生成的默认字符串长度，以便 MySQL 为其创建索引。可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `Schema::defaultStringLength` 方法来配置默认字符串长度：

```php
use Illuminate\Support\Facades\Schema;

/**
 * 引导所有应用服务。
 *
 * @return void
 */
public function boot()
{
    Schema::defaultStringLength(191);
}
```

或者，可以为数据库启用 `innodb_large_prefix` 选项。有关如何正确启用此选项的说明，请参阅数据库文档。

<a name="renaming-indexes"></a>
### 重命名索引

要重命名索引，可以使用 schema 构造器蓝图提供的 `renameIndex` 方法。此方法接收当前索引名称作为第一个参数，目标名称作为第二个参数：

```php
$table->renameIndex('from', 'to')
```

> **Warning**
> 如果应用程序使用 SQLite 数据库，在使用 `renameIndex` 方法之前，必须通过 Composer 包管理器安装 `doctrine/dbal` 包。

<a name="dropping-indexes"></a>
### 删除索引

要删除索引，必须指定索引名称。默认情况下，Laravel 会根据表名、索引字段名和索引类型自动分配索引名称。以下是一些示例：

命令  |  说明
-------  |  -----------
`$table->dropPrimary('users_id_primary');`  |  从 "users" 表中删除主键。
`$table->dropUnique('users_email_unique');`  |  从 "users" 表中删除唯一索引。
`$table->dropIndex('geo_state_index');`  |  从 "geo" 表中删除普通索引。
`$table->dropFullText('posts_body_fulltext');`  |  从 "posts" 表中删除全文索引。
`$table->dropSpatialIndex('geo_location_spatialindex');`  |  从 "geo" 表中删除空间索引（SQLite 除外）。

如果向删除索引的方法传递字段数组，将根据表名、字段和索引类型生成约定的索引名称：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // 删除索引 'geo_state_index'
});
```

<a name="foreign-key-constraints"></a>
### 外键约束

Laravel 还支持创建外键约束，用于在数据库层面强制引用完整性。例如，在 `posts` 表上定义一个 `user_id` 字段，引用 `users` 表上的 `id` 字段：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于此语法较为冗长，Laravel 提供了额外的、更简洁的方法，使用约定来提供更好的开发体验。使用 `foreignId` 方法创建字段时，上面的示例可以改写为：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法创建一个 `UNSIGNED BIGINT` 等价字段，而 `constrained` 方法会使用约定来确定被引用的表和字段名。如果表名不符合 Laravel 的约定，可以通过将表名作为参数传递给 `constrained` 方法来指定：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained('users');
});
```

还可以为约束的 "on delete" 和 "on update" 属性指定所需的操作：

```php
$table->foreignId('user_id')
      ->constrained()
      ->onUpdate('cascade')
      ->onDelete('cascade');
```

还为这些操作提供了另一种更具表达性的语法：

方法  |  说明
-------  |  -----------
`$table->cascadeOnUpdate();` | 更新时应级联。
`$table->restrictOnUpdate();`| 更新时应限制。
`$table->cascadeOnDelete();` | 删除时应级联。
`$table->restrictOnDelete();`| 删除时应限制。
`$table->nullOnDelete();`    | 删除时应将外键值设为 null。

任何额外的[字段修饰符](#column-modifiers)必须在 `constrained` 方法之前调用：

```php
$table->foreignId('user_id')
      ->nullable()
      ->constrained();
```

<a name="dropping-foreign-keys"></a>
#### 删除外键

要删除外键，可以使用 `dropForeign` 方法，将要删除的外键约束名称作为参数传递。外键约束使用与索引相同的命名约定。换句话说，外键约束名称基于表名和约束中的字段名，后跟 "\_foreign" 后缀：

```php
$table->dropForeign('posts_user_id_foreign');
```

或者，可以向 `dropForeign` 方法传递包含持有外键的字段名的数组。该数组将使用 Laravel 的约束命名约定转换为外键约束名称：

```php
$table->dropForeign(['user_id']);
```

<a name="toggling-foreign-key-constraints"></a>
#### 切换外键约束

可以在迁移中使用以下方法来启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // 在此闭包内禁用约束...
});
```

> **Warning**
> SQLite 默认禁用外键约束。使用 SQLite 时，在尝试于迁移中创建外键之前，请确保在数据库配置中[启用外键支持](/docs/{{version}}/database#configuration)。此外，SQLite 仅在创建表时支持外键，[不支持在修改表时添加外键](https://www.sqlite.org/omitted.html)。

<a name="events"></a>
## 事件

为方便起见，每个迁移操作都会触发一个[事件](/docs/{{version}}/events)。以下所有事件都继承自基础 `Illuminate\Database\Events\MigrationEvent` 类：

 类 | 说明
-------|-------
| `Illuminate\Database\Events\MigrationsStarted` | 一批迁移即将执行。 |
| `Illuminate\Database\Events\MigrationsEnded` | 一批迁移已执行完毕。 |
| `Illuminate\Database\Events\MigrationStarted` | 单个迁移即将执行。 |
| `Illuminate\Database\Events\MigrationEnded` | 单个迁移已执行完毕。 |
| `Illuminate\Database\Events\SchemaDumped` | 数据库 schema 转储已完成。 |
| `Illuminate\Database\Events\SchemaLoaded` | 已加载现有的数据库 schema 转储。 |
