# 数据库：数据库迁移

- [简介](#introduction)
- [生成迁移](#generating-migrations)
    - [压缩迁移](#squashing-migrations)
- [迁移结构](#migration-structure)
- [运行迁移](#running-migrations)
    - [回滚迁移](#rolling-back-migrations)
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

数据库迁移（Migration）就像数据库的版本控制，让你的团队可以定义并共享应用的数据库结构定义。如果你曾经历过这样的场景：队友从版本控制拉取你的更改后，你还得告诉他手动在本地数据库结构中添加一个字段——那么你就已经遭遇过数据库迁移所要解决的问题。

Laravel 的 `Schema` [Facade](/docs/{{version}}/facades) 提供了与数据库无关的支持，可在 Laravel 支持的所有数据库系统中创建和操作数据表。通常，迁移会使用这个 Facade 来创建和修改数据库表与字段。

<a name="generating-migrations"></a>
## 生成迁移

你可以使用 `make:migration` [Artisan 命令](/docs/{{version}}/artisan)来生成一个数据库迁移。新的迁移会被放置在 `database/migrations` 目录中。每个迁移文件名都包含一个时间戳，Laravel 借此来确定迁移的执行顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 会根据迁移的名称来尝试猜测数据表的名称，以及该迁移是否会创建一个新表。如果 Laravel 能够从迁移名称中推断出表名，就会在生成的迁移文件中预填指定的表。否则，你只需在迁移文件中手动指定表名。

如果你想为生成的迁移指定自定义路径，可以在执行 `make:migration` 命令时使用 `--path` 选项。给定的路径应相对于应用的基础路径。

> [!NOTE]
> 可以通过[发布桩文件](/docs/{{version}}/artisan#stub-customization)来自定义迁移桩。

<a name="squashing-migrations"></a>
### 压缩迁移

随着应用不断开发，你可能会随时间积累越来越多的迁移。这可能导致 `database/migrations` 目录变得臃肿，甚至包含数百个迁移文件。如果你愿意，可以将这些迁移"压缩"（squash）到一个 SQL 文件中。首先，执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# 导出当前数据库结构并清除所有现有迁移...
php artisan schema:dump --prune
```

执行该命令时，Laravel 会向应用的 `database/schema` 目录写入一个"结构"（schema）文件。结构文件的名称与数据库连接对应。现在，当你尝试迁移数据库且尚无其他已执行的迁移时，Laravel 会先执行你所用数据库连接的结构文件中的 SQL 语句。执行完结构文件中的 SQL 语句后，Laravel 会继续执行未包含在结构导出中的其余迁移。

如果你的应用测试所使用的数据库连接与本地开发时常用的不同，应确保已使用该数据库连接导出了结构文件，以便测试能够构建数据库。你可以在导出本地开发常用的数据库连接之后执行此操作：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

你应该将数据库结构文件提交到版本控制中，这样团队中的其他新开发者就能快速创建应用的初始数据库结构。

> [!WARNING]
> 迁移压缩仅适用于 MariaDB、MySQL、PostgreSQL 和 SQLite 数据库，并且会使用数据库的命令行客户端。

<a name="migration-structure"></a>
## 迁移结构

一个迁移类包含两个方法：`up` 和 `down`。`up` 方法用于向数据库添加新表、字段或索引，而 `down` 方法应撤销 `up` 方法执行的操作。

在这两个方法中，你都可以使用 Laravel 的结构构建器（schema builder）以富表现力的方式创建和修改数据表。要了解 `Schema` 构建器上所有可用的方法，请[查阅其文档](#creating-tables)。例如，以下迁移会创建一个 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 运行迁移。
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
     * 回滚迁移。
     */
    public function down(): void
    {
        Schema::drop('flights');
    }
};
```

<a name="setting-the-migration-connection"></a>
#### 设置迁移的数据库连接

如果你的迁移要与应用默认数据库连接之外的数据库连接交互，应设置迁移的 `$connection` 属性：

```php
/**
 * 迁移应使用的数据库连接。
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * 运行迁移。
 */
public function up(): void
{
    // ...
}
```

<a name="skipping-migrations"></a>
#### 跳过迁移

有时，某个迁移可能是为了支持一项尚未启用的功能，而你暂时不想让它运行。这种情况下，你可以在迁移中定义一个 `shouldRun` 方法。如果 `shouldRun` 方法返回 `false`，该迁移将被跳过：

```php
use App\Models\Flight;
use Laravel\Pennant\Feature;

/**
 * 判断此迁移是否应运行。
 */
public function shouldRun(): bool
{
    return Feature::active(Flight::class);
}
```

<a name="running-migrations"></a>
## 运行迁移

要运行所有尚未执行的迁移，请执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果你想查看哪些迁移已经运行、哪些还在等待执行，可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果为 `migrate` 命令提供 `--step` 选项，该命令会将每个迁移作为单独的批次运行，这样你之后就可以使用 `migrate:rollback` 命令回滚单个迁移：

```shell
php artisan migrate --step
```

如果你想查看迁移将要执行的 SQL 语句而不实际运行它们，可以为 `migrate` 命令提供 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

<a name="isolating-migration-execution"></a>
#### 隔离迁移执行

如果你将应用部署到多台服务器上，并在部署流程中运行迁移，你可能不希望两台服务器同时尝试迁移数据库。为避免这种情况，你可以在调用 `migrate` 命令时使用 `isolated` 选项。

提供 `isolated` 选项时，Laravel 会在尝试运行迁移之前，使用应用的缓存驱动获取一个原子锁。在该锁被持有期间，其他所有运行 `migrate` 命令的尝试都不会执行；不过，命令仍会以成功的退出状态码退出：

```shell
php artisan migrate --isolated
```

> [!WARNING]
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="forcing-migrations-to-run-in-production"></a>
#### 强制在生产环境中运行迁移

有些迁移操作是破坏性的，可能导致数据丢失。为了防止你误对这些命令操作生产数据库，命令执行前会提示你确认。若要强制命令运行而不提示，请使用 `--force` 标志：

```shell
php artisan migrate --force
```

<a name="rolling-back-migrations"></a>
### 回滚迁移

要回滚最近一次迁移操作，可以使用 `rollback` Artisan 命令。该命令会回滚最后一"批"迁移，其中可能包含多个迁移文件：

```shell
php artisan migrate:rollback
```

你可以通过为 `rollback` 命令提供 `step` 选项来回滚指定数量的迁移。例如，以下命令会回滚最近五个迁移：

```shell
php artisan migrate:rollback --step=5
```

你可以通过为 `rollback` 命令提供 `batch` 选项来回滚特定"批次"的迁移，`batch` 选项的值应对应应用 `migrations` 数据表中的批次值。例如，以下命令会回滚第三批中的所有迁移：

```shell
php artisan migrate:rollback --batch=3
```

如果你想查看迁移将要执行的 SQL 语句而不实际运行它们，可以为 `migrate:rollback` 命令提供 `--pretend` 标志：

```shell
php artisan migrate:rollback --pretend
```

`migrate:reset` 命令会回滚应用的所有迁移：

```shell
php artisan migrate:reset
```

<a name="roll-back-migrate-using-a-single-command"></a>
#### 使用单个命令回滚并迁移

`migrate:refresh` 命令会先回滚所有迁移，然后执行 `migrate` 命令。该命令实际上会重新创建整个数据库：

```shell
php artisan migrate:refresh

# 刷新数据库并运行所有数据填充...
php artisan migrate:refresh --seed
```

你可以通过为 `refresh` 命令提供 `step` 选项来回滚并重新迁移指定数量的迁移。例如，以下命令会回滚并重新迁移最近五个迁移：

```shell
php artisan migrate:refresh --step=5
```

<a name="drop-all-tables-migrate"></a>
#### 删除所有数据表并迁移

`migrate:fresh` 命令会删除数据库中的所有表，然后执行 `migrate` 命令：

```shell
php artisan migrate:fresh

php artisan migrate:fresh --seed
```

默认情况下，`migrate:fresh` 命令只会删除默认数据库连接中的表。不过，你可以使用 `--database` 选项指定要迁移的数据库连接。数据库连接的名称应对应应用 `database` [配置文件](/docs/{{version}}/configuration)中定义的连接：

```shell
php artisan migrate:fresh --database=admin
```

> [!WARNING]
> `migrate:fresh` 命令会删除所有数据库表，无论其是否带有前缀。在与其他应用共享的数据库上开发时，请谨慎使用此命令。

<a name="tables"></a>
## 数据表

<a name="creating-tables"></a>
### 创建数据表

要创建一个新的数据库表，请使用 `Schema` Facade 的 `create` 方法。`create` 方法接受两个参数：第一个是表名，第二个是一个闭包，该闭包接收一个可用于定义新表的 `Blueprint` 对象：

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

创建表时，你可以使用结构构建器的任何[字段方法](#creating-columns)来定义表的字段。

<a name="determining-table-column-existence"></a>
#### 判断表 / 字段是否存在

你可以使用 `hasTable`、`hasColumn` 和 `hasIndex` 方法来判断表、字段或索引是否存在：

```php
if (Schema::hasTable('users')) {
    // "users" 表存在...
}

if (Schema::hasColumn('users', 'email')) {
    // "users" 表存在且拥有 "email" 字段...
}

if (Schema::hasIndex('users', ['email'], 'unique')) {
    // "users" 表存在且 "email" 字段上有唯一索引...
}
```

<a name="database-connection-table-options"></a>
#### 数据库连接与表选项

如果要在非应用默认连接的数据库连接上执行结构操作，请使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，还有一些其他属性和方法可用于定义建表的其他方面。使用 MariaDB 或 MySQL 时，可以使用 `engine` 属性指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine('InnoDB');

    // ...
});
```

使用 MariaDB 或 MySQL 时，可以使用 `charset` 和 `collation` 属性为所创建的表指定字符集和排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset('utf8mb4');
    $table->collation('utf8mb4_unicode_ci');

    // ...
});
```

`temporary` 方法可用于指示该表应为"临时"表。临时表仅对当前连接的数据库会话可见，连接关闭时会自动删除：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果想为数据库表添加"注释"，可以在表实例上调用 `comment` 方法。目前只有 MariaDB、MySQL 和 PostgreSQL 支持表注释：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

<a name="updating-tables"></a>
### 更新数据表

`Schema` Facade 的 `table` 方法可用于更新现有表。与 `create` 方法一样，`table` 方法接受两个参数：表名，以及一个接收 `Blueprint` 实例的闭包，你可以在闭包中向表添加字段或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="renaming-and-dropping-tables"></a>
### 重命名 / 删除数据表

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
#### 重命名带有外键的表

在重命名表之前，你应确认迁移文件中该表的所有外键约束都使用了显式名称，而不是让 Laravel 按约定自动命名。否则，外键约束的名称仍会引用旧的表名。

<a name="columns"></a>
## 字段

<a name="creating-columns"></a>
### 创建字段

`Schema` Facade 的 `table` 方法可用于更新现有表。与 `create` 方法一样，`table` 方法接受两个参数：表名，以及一个接收 `Illuminate\Database\Schema\Blueprint` 实例的闭包，你可以在闭包中向表添加字段：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

<a name="available-column-types"></a>
### 可用字段类型

结构构建器的 Blueprint 提供了多种方法，对应你可以添加到数据库表中的不同字段类型。下表列出了所有可用的方法：

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

<a name="relationship-method-list"></a>
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

`bigIncrements` 方法创建一个等同于自增 `UNSIGNED BIGINT`（主键）的字段：

```php
$table->bigIncrements('id');
```

<a name="column-method-bigInteger"></a>
#### `bigInteger()` {.collection-method}

`bigInteger` 方法创建一个等同于 `BIGINT` 的字段：

```php
$table->bigInteger('votes');
```

<a name="column-method-binary"></a>
#### `binary()` {.collection-method}

`binary` 方法创建一个等同于 `BLOB` 的字段：

```php
$table->binary('photo');
```

使用 MySQL、MariaDB 或 SQL Server 时，你可以传入 `length` 和 `fixed` 参数来创建等同于 `VARBINARY` 或 `BINARY` 的字段：

```php
$table->binary('data', length: 16); // VARBINARY(16)

$table->binary('data', length: 16, fixed: true); // BINARY(16)
```

<a name="column-method-boolean"></a>
#### `boolean()` {.collection-method}

`boolean` 方法创建一个等同于 `BOOLEAN` 的字段：

```php
$table->boolean('confirmed');
```

<a name="column-method-char"></a>
#### `char()` {.collection-method}

`char` 方法创建一个等同于指定长度 `CHAR` 的字段：

```php
$table->char('name', length: 100);
```

<a name="column-method-dateTimeTz"></a>
#### `dateTimeTz()` {.collection-method}

`dateTimeTz` 方法创建一个等同于 `DATETIME`（带时区）的字段，并支持可选的小数秒精度：

```php
$table->dateTimeTz('created_at', precision: 0);
```

<a name="column-method-dateTime"></a>
#### `dateTime()` {.collection-method}

`dateTime` 方法创建一个等同于 `DATETIME` 的字段，并支持可选的小数秒精度：

```php
$table->dateTime('created_at', precision: 0);
```

<a name="column-method-date"></a>
#### `date()` {.collection-method}

`date` 方法创建一个等同于 `DATE` 的字段：

```php
$table->date('created_at');
```

<a name="column-method-decimal"></a>
#### `decimal()` {.collection-method}

`decimal` 方法创建一个等同于 `DECIMAL` 的字段，并带有给定的精度（总位数）和小数位数：

```php
$table->decimal('amount', total: 8, places: 2);
```

<a name="column-method-double"></a>
#### `double()` {.collection-method}

`double` 方法创建一个等同于 `DOUBLE` 的字段：

```php
$table->double('amount');
```

<a name="column-method-enum"></a>
#### `enum()` {.collection-method}

`enum` 方法创建一个等同于 `ENUM` 的字段，并带有给定的有效值列表：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

当然，你也可以使用 `Enum::cases()` 方法，而无需手动定义允许值的数组：

```php
use App\Enums\Difficulty;

$table->enum('difficulty', Difficulty::cases());
```

<a name="column-method-float"></a>
#### `float()` {.collection-method}

`float` 方法创建一个等同于 `FLOAT` 的字段，并带有给定的精度：

```php
$table->float('amount', precision: 53);
```

<a name="column-method-foreignId"></a>
#### `foreignId()` {.collection-method}

`foreignId` 方法创建一个等同于 `UNSIGNED BIGINT` 的字段：

```php
$table->foreignId('user_id');
```

<a name="column-method-foreignIdFor"></a>
#### `foreignIdFor()` {.collection-method}

`foreignIdFor` 方法为给定的模型类添加一个等同于 `{column}_id` 的字段。字段类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`，具体取决于模型的主键类型：

```php
$table->foreignIdFor(User::class);
```

<a name="column-method-foreignUlid"></a>
#### `foreignUlid()` {.collection-method}

`foreignUlid` 方法创建一个等同于 `ULID` 的字段：

```php
$table->foreignUlid('user_id');
```

<a name="column-method-foreignUuid"></a>
#### `foreignUuid()` {.collection-method}

`foreignUuid` 方法创建一个等同于 `UUID` 的字段：

```php
$table->foreignUuid('user_id');
```

<a name="column-method-geography"></a>
#### `geography()` {.collection-method}

`geography` 方法创建一个等同于 `GEOGRAPHY` 的字段，并带有给定的空间类型和 SRID（空间参考系统标识符）：

```php
$table->geography('coordinates', subtype: 'point', srid: 4326);
```

> [!NOTE]
> 空间类型的支持情况取决于你的数据库驱动，请查阅相应数据库的文档。如果你的应用使用 PostgreSQL 数据库，必须先安装 [PostGIS](https://postgis.net) 扩展，然后才能使用 `geography` 方法。

<a name="column-method-geometry"></a>
#### `geometry()` {.collection-method}

`geometry` 方法创建一个等同于 `GEOMETRY` 的字段，并带有给定的空间类型和 SRID（空间参考系统标识符）：

```php
$table->geometry('positions', subtype: 'point', srid: 0);
```

> [!NOTE]
> 空间类型的支持情况取决于你的数据库驱动，请查阅相应数据库的文档。如果你的应用使用 PostgreSQL 数据库，必须先安装 [PostGIS](https://postgis.net) 扩展，然后才能使用 `geometry` 方法。

<a name="column-method-id"></a>
#### `id()` {.collection-method}

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法会创建一个 `id` 字段；不过，如果你想为字段指定其他名称，也可以传入字段名：

```php
$table->id();
```

<a name="column-method-increments"></a>
#### `increments()` {.collection-method}

`increments` 方法创建一个等同于自增 `UNSIGNED INTEGER` 的字段作为主键：

```php
$table->increments('id');
```

<a name="column-method-integer"></a>
#### `integer()` {.collection-method}

`integer` 方法创建一个等同于 `INTEGER` 的字段：

```php
$table->integer('votes');
```

<a name="column-method-ipAddress"></a>
#### `ipAddress()` {.collection-method}

`ipAddress` 方法创建一个等同于 `VARCHAR` 的字段：

```php
$table->ipAddress('visitor');
```

使用 PostgreSQL 时，会创建一个 `INET` 字段。

<a name="column-method-json"></a>
#### `json()` {.collection-method}

`json` 方法创建一个等同于 `JSON` 的字段：

```php
$table->json('options');
```

使用 SQLite 时，会创建一个 `TEXT` 字段。

<a name="column-method-jsonb"></a>
#### `jsonb()` {.collection-method}

`jsonb` 方法创建一个等同于 `JSONB` 的字段：

```php
$table->jsonb('options');
```

使用 SQLite 时，会创建一个 `TEXT` 字段。

<a name="column-method-longText"></a>
#### `longText()` {.collection-method}

`longText` 方法创建一个等同于 `LONGTEXT` 的字段：

```php
$table->longText('description');
```

使用 MySQL 或 MariaDB 时，你可以为字段应用 `binary` 字符集，以创建等同于 `LONGBLOB` 的字段：

```php
$table->longText('data')->charset('binary'); // LONGBLOB
```

<a name="column-method-macAddress"></a>
#### `macAddress()` {.collection-method}

`macAddress` 方法创建一个用于存储 MAC 地址的字段。某些数据库系统（如 PostgreSQL）为这类数据提供了专门的字段类型，其他数据库系统则会使用等同于字符串的字段：

```php
$table->macAddress('device');
```

<a name="column-method-mediumIncrements"></a>
#### `mediumIncrements()` {.collection-method}

`mediumIncrements` 方法创建一个等同于自增 `UNSIGNED MEDIUMINT` 的字段作为主键：

```php
$table->mediumIncrements('id');
```

<a name="column-method-mediumInteger"></a>
#### `mediumInteger()` {.collection-method}

`mediumInteger` 方法创建一个等同于 `MEDIUMINT` 的字段：

```php
$table->mediumInteger('votes');
```

<a name="column-method-mediumText"></a>
#### `mediumText()` {.collection-method}

`mediumText` 方法创建一个等同于 `MEDIUMTEXT` 的字段：

```php
$table->mediumText('description');
```

使用 MySQL 或 MariaDB 时，你可以为字段应用 `binary` 字符集，以创建等同于 `MEDIUMBLOB` 的字段：

```php
$table->mediumText('data')->charset('binary'); // MEDIUMBLOB
```

<a name="column-method-morphs"></a>
#### `morphs()` {.collection-method}

`morphs` 方法是一个便捷方法，会添加一个等同于 `{column}_id` 的字段和一个等同于 `{column}_type` 的 `VARCHAR` 字段。`{column}_id` 的字段类型为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`，具体取决于模型的主键类型。

该方法适用于定义多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的字段。在下面的示例中，会创建 `taggable_id` 和 `taggable_type` 两个字段：

```php
$table->morphs('taggable');
```

<a name="column-method-nullableMorphs"></a>
#### `nullableMorphs()` {.collection-method}

该方法类似于 [morphs](#column-method-morphs) 方法；不过，所创建的字段将是"可空"（nullable）的：

```php
$table->nullableMorphs('taggable');
```

<a name="column-method-nullableUlidMorphs"></a>
#### `nullableUlidMorphs()` {.collection-method}

该方法类似于 [ulidMorphs](#column-method-ulidMorphs) 方法；不过，所创建的字段将是"可空"的：

```php
$table->nullableUlidMorphs('taggable');
```

<a name="column-method-nullableUuidMorphs"></a>
#### `nullableUuidMorphs()` {.collection-method}

该方法类似于 [uuidMorphs](#column-method-uuidMorphs) 方法；不过，所创建的字段将是"可空"的：

```php
$table->nullableUuidMorphs('taggable');
```

<a name="column-method-rememberToken"></a>
#### `rememberToken()` {.collection-method}

`rememberToken` 方法创建一个可空、等同于 `VARCHAR(100)` 的字段，用于存储当前的"记住我"[身份认证令牌](/docs/{{version}}/authentication#remembering-users)：

```php
$table->rememberToken();
```

<a name="column-method-set"></a>
#### `set()` {.collection-method}

`set` 方法创建一个等同于 `SET` 的字段，并带有给定的有效值列表：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

<a name="column-method-smallIncrements"></a>
#### `smallIncrements()` {.collection-method}

`smallIncrements` 方法创建一个等同于自增 `UNSIGNED SMALLINT` 的字段作为主键：

```php
$table->smallIncrements('id');
```

<a name="column-method-smallInteger"></a>
#### `smallInteger()` {.collection-method}

`smallInteger` 方法创建一个等同于 `SMALLINT` 的字段：

```php
$table->smallInteger('votes');
```

<a name="column-method-softDeletesTz"></a>
#### `softDeletesTz()` {.collection-method}

`softDeletesTz` 方法添加一个可空、等同于 `deleted_at` 的 `TIMESTAMP`（带时区）字段，并支持可选的小数秒精度。该字段用于存储 Eloquent "软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz('deleted_at', precision: 0);
```

<a name="column-method-softDeletes"></a>
#### `softDeletes()` {.collection-method}

`softDeletes` 方法添加一个可空、等同于 `deleted_at` 的 `TIMESTAMP` 字段，并支持可选的小数秒精度。该字段用于存储 Eloquent "软删除"功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes('deleted_at', precision: 0);
```

<a name="column-method-string"></a>
#### `string()` {.collection-method}

`string` 方法创建一个等同于指定长度 `VARCHAR` 的字段：

```php
$table->string('name', length: 100);
```

<a name="column-method-text"></a>
#### `text()` {.collection-method}

`text` 方法创建一个等同于 `TEXT` 的字段：

```php
$table->text('description');
```

使用 MySQL 或 MariaDB 时，你可以为字段应用 `binary` 字符集，以创建等同于 `BLOB` 的字段：

```php
$table->text('data')->charset('binary'); // BLOB
```

<a name="column-method-timeTz"></a>
#### `timeTz()` {.collection-method}

`timeTz` 方法创建一个等同于 `TIME`（带时区）的字段，并支持可选的小数秒精度：

```php
$table->timeTz('sunrise', precision: 0);
```

<a name="column-method-time"></a>
#### `time()` {.collection-method}

`time` 方法创建一个等同于 `TIME` 的字段，并支持可选的小数秒精度：

```php
$table->time('sunrise', precision: 0);
```

<a name="column-method-timestampTz"></a>
#### `timestampTz()` {.collection-method}

`timestampTz` 方法创建一个等同于 `TIMESTAMP`（带时区）的字段，并支持可选的小数秒精度：

```php
$table->timestampTz('added_at', precision: 0);
```

<a name="column-method-timestamp"></a>
#### `timestamp()` {.collection-method}

`timestamp` 方法创建一个等同于 `TIMESTAMP` 的字段，并支持可选的小数秒精度：

```php
$table->timestamp('added_at', precision: 0);
```

<a name="column-method-timestampsTz"></a>
#### `timestampsTz()` {.collection-method}

`timestampsTz` 方法创建 `created_at` 和 `updated_at` 两个等同于 `TIMESTAMP`（带时区）的字段，并支持可选的小数秒精度：

```php
$table->timestampsTz(precision: 0);
```

<a name="column-method-timestamps"></a>
#### `timestamps()` {.collection-method}

`timestamps` 方法创建 `created_at` 和 `updated_at` 两个等同于 `TIMESTAMP` 的字段，并支持可选的小数秒精度：

```php
$table->timestamps(precision: 0);
```

<a name="column-method-tinyIncrements"></a>
#### `tinyIncrements()` {.collection-method}

`tinyIncrements` 方法创建一个等同于自增 `UNSIGNED TINYINT` 的字段作为主键：

```php
$table->tinyIncrements('id');
```

<a name="column-method-tinyInteger"></a>
#### `tinyInteger()` {.collection-method}

`tinyInteger` 方法创建一个等同于 `TINYINT` 的字段：

```php
$table->tinyInteger('votes');
```

<a name="column-method-tinyText"></a>
#### `tinyText()` {.collection-method}

`tinyText` 方法创建一个等同于 `TINYTEXT` 的字段：

```php
$table->tinyText('notes');
```

使用 MySQL 或 MariaDB 时，你可以为字段应用 `binary` 字符集，以创建等同于 `TINYBLOB` 的字段：

```php
$table->tinyText('data')->charset('binary'); // TINYBLOB
```

<a name="column-method-unsignedBigInteger"></a>
#### `unsignedBigInteger()` {.collection-method}

`unsignedBigInteger` 方法创建一个等同于 `UNSIGNED BIGINT` 的字段：

```php
$table->unsignedBigInteger('votes');
```

<a name="column-method-unsignedInteger"></a>
#### `unsignedInteger()` {.collection-method}

`unsignedInteger` 方法创建一个等同于 `UNSIGNED INTEGER` 的字段：

```php
$table->unsignedInteger('votes');
```

<a name="column-method-unsignedMediumInteger"></a>
#### `unsignedMediumInteger()` {.collection-method}

`unsignedMediumInteger` 方法创建一个等同于 `UNSIGNED MEDIUMINT` 的字段：

```php
$table->unsignedMediumInteger('votes');
```

<a name="column-method-unsignedSmallInteger"></a>
#### `unsignedSmallInteger()` {.collection-method}

`unsignedSmallInteger` 方法创建一个等同于 `UNSIGNED SMALLINT` 的字段：

```php
$table->unsignedSmallInteger('votes');
```

<a name="column-method-unsignedTinyInteger"></a>
#### `unsignedTinyInteger()` {.collection-method}

`unsignedTinyInteger` 方法创建一个等同于 `UNSIGNED TINYINT` 的字段：

```php
$table->unsignedTinyInteger('votes');
```

<a name="column-method-ulidMorphs"></a>
#### `ulidMorphs()` {.collection-method}

`ulidMorphs` 方法是一个便捷方法，会添加一个等同于 `{column}_id` 的 `CHAR(26)` 字段和一个等同于 `{column}_type` 的 `VARCHAR` 字段。

该方法适用于定义使用 ULID 标识符的多态 [Eloquent 关联](/docs/{{version}}/eloquent-relationships)所需的字段。在下面的示例中，会创建 `taggable_id` 和 `taggable_type` 两个字段：

```php
$table->ulidMorphs('taggable');
```

<a name="column-method-uuidMorphs"></a>
#### `uuidMorphs()` {.collection-method}

`uuidMorphs` 方法是一个便捷方法，会添加一个等同于 `{column}_id` 的 `CHAR(36)` 字段和一个等同于 `{column}_type` 的 `VARCHAR` 字段。

该方法适用于定义使用 UUID 标识符的[多态 Eloquent 关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)所需的字段。在下面的示例中，会创建 `taggable_id` 和 `taggable_type` 两个字段：

```php
$table->uuidMorphs('taggable');
```

<a name="column-method-ulid"></a>
#### `ulid()` {.collection-method}

`ulid` 方法创建一个等同于 `ULID` 的字段：

```php
$table->ulid('id');
```

<a name="column-method-uuid"></a>
#### `uuid()` {.collection-method}

`uuid` 方法创建一个等同于 `UUID` 的字段：

```php
$table->uuid('id');
```

<a name="column-method-vector"></a>
#### `vector()` {.collection-method}

`vector` 方法创建一个等同于 `vector` 的字段：

```php
$table->vector('embedding', dimensions: 100);
```

使用 PostgreSQL 时，必须先加载 `pgvector` 扩展才能创建 `vector` 字段：

```php
Schema::ensureVectorExtensionExists();
```

<a name="column-method-year"></a>
#### `year()` {.collection-method}

`year` 方法创建一个等同于 `YEAR` 的字段：

```php
$table->year('birth_year');
```

<a name="column-modifiers"></a>
### 字段修饰符

除了上面列出的字段类型之外，在向数据库表添加字段时，还有多种字段"修饰符"可供使用。例如，要让字段"可空"，可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

下表列出了所有可用的字段修饰符。此列表不包括[索引修饰符](#creating-indexes)：

| 修饰符 | 说明 |
| --- | --- |
| `->after('column')` | 将字段置于另一个字段"之后"（MariaDB / MySQL）。 |
| `->autoIncrement()` | 将 `INTEGER` 字段设为自增（主键）。 |
| `->charset('utf8mb4')` | 为字段指定字符集（MariaDB / MySQL）。 |
| `->collation('utf8mb4_unicode_ci')` | 为字段指定排序规则。 |
| `->comment('my comment')` | 为字段添加注释（MariaDB / MySQL / PostgreSQL）。 |
| `->default($value)` | 为字段指定"默认"值。 |
| `->first()` | 将字段置于表中"首位"（MariaDB / MySQL）。 |
| `->from($integer)` | 设置自增字段的起始值（MariaDB / MySQL / PostgreSQL）。 |
| `->instant()` | 使用 instant 算法添加或修改字段（MySQL）。 |
| `->invisible()` | 使字段对 `SELECT *` 查询"不可见"（MariaDB / MySQL）。 |
| `->lock($mode)` | 为字段操作指定锁定模式（MySQL）。 |
| `->nullable($value = true)` | 允许向字段插入 `NULL` 值。 |
| `->storedAs($expression)` | 创建存储生成字段（MariaDB / MySQL / PostgreSQL / SQLite）。 |
| `->unsigned()` | 将 `INTEGER` 字段设为 `UNSIGNED`（MariaDB / MySQL）。 |
| `->useCurrent()` | 将 `TIMESTAMP` 字段的默认值设为 `CURRENT_TIMESTAMP`。 |
| `->useCurrentOnUpdate()` | 记录更新时将 `TIMESTAMP` 字段设为 `CURRENT_TIMESTAMP`（MariaDB / MySQL）。 |
| `->virtualAs($expression)` | 创建虚拟生成字段（MariaDB / MySQL / SQLite）。 |
| `->generatedAs($expression)` | 创建带有指定序列选项的标识字段（PostgreSQL）。 |
| `->always()` | 定义标识字段的序列值优先于输入值（PostgreSQL）。 |

<a name="default-expressions"></a>
#### 默认值表达式

`default` 修饰符接受一个值或一个 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例可以防止 Laravel 将值包裹在引号中，并允许你使用数据库特定的函数。当你需要为 JSON 字段指定默认值时，这一功能尤为实用：

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
> 对默认值表达式的支持取决于你的数据库驱动、数据库版本和字段类型。请查阅相应数据库的文档。

<a name="column-order"></a>
#### 字段顺序

使用 MariaDB 或 MySQL 数据库时，可以使用 `after` 方法将字段添加到结构中现有字段之后：

```php
$table->after('password', function (Blueprint $table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

<a name="instant-column-operations"></a>
#### Instant 字段操作

使用 MySQL 时，你可以在字段定义上链式调用 `instant` 修饰符，指示该字段应使用 MySQL 的"instant"算法来添加或修改。该算法允许某些结构变更无需重建整个表即可完成，使其几乎不受表大小影响、近乎瞬时完成：

```php
$table->string('name')->nullable()->instant();
```

Instant 字段添加只能将字段追加到表的末尾，因此 `instant` 修饰符不能与 `after` 或 `first` 修饰符组合使用。此外，该算法并不支持所有字段类型或操作。如果所请求的操作不兼容，MySQL 会抛出错误。

请查阅 [MySQL 文档](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-operations.html)，以确定哪些操作与 instant 字段修改兼容。

<a name="ddl-locking"></a>
#### DDL 锁定

使用 MySQL 时，你可以在字段、索引或外键定义上链式调用 `lock` 修饰符，以控制结构操作期间的表锁定。MySQL 支持多种锁定模式：`none` 允许并发读写，`shared` 允许并发读但阻塞写，`exclusive` 阻塞所有并发访问，`default` 则由 MySQL 选择最合适的模式：

```php
$table->string('name')->lock('none');

$table->index('email')->lock('shared');
```

如果所请求的锁定模式与操作不兼容，MySQL 会抛出错误。`lock` 修饰符可以与 `instant` 修饰符组合使用，进一步优化结构变更：

```php
$table->string('name')->instant()->lock('none');
```

<a name="modifying-columns"></a>
### 修改字段

`change` 方法允许你修改现有字段的类型和属性。例如，你可能希望增大某个 `string` 字段的长度。为了演示 `change` 方法的用法，我们把 `name` 字段的长度从 25 增大到 50。只需定义字段的新状态，然后调用 `change` 方法即可：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

修改字段时，你必须在字段定义中显式包含所有想要保留的修饰符——任何缺失的属性都会被移除。例如，要保留 `unsigned`、`default` 和 `comment` 属性，修改字段时必须显式调用每个修饰符：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('my comment')->change();
});
```

`change` 方法不会改变字段的索引。因此，你可以在修改字段时使用索引修饰符来显式添加或删除索引：

```php
// 添加索引...
$table->bigIncrements('id')->primary()->change();

// 删除索引...
$table->char('postal_code', 10)->unique(false)->change();
```

<a name="renaming-columns"></a>
### 重命名字段

要重命名字段，可以使用结构构建器提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

<a name="dropping-columns"></a>
### 删除字段

要删除字段，可以使用结构构建器上的 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

你可以向 `dropColumn` 方法传递字段名数组，从表中删除多个字段：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

<a name="available-command-aliases"></a>
#### 可用命令别名

Laravel 提供了几个与删除常见类型字段相关的便捷方法。下表对每个方法进行了说明：

| 命令 | 说明 |
| --- | --- |
| `$table->dropMorphs('morphable');` | 删除 `morphable_id` 和 `morphable_type` 字段。 |
| `$table->dropRememberToken();` | 删除 `remember_token` 字段。 |
| `$table->dropSoftDeletes();` | 删除 `deleted_at` 字段。 |
| `$table->dropSoftDeletesTz();` | `dropSoftDeletes()` 方法的别名。 |
| `$table->dropTimestamps();` | 删除 `created_at` 和 `updated_at` 字段。 |
| `$table->dropTimestampsTz();` | `dropTimestamps()` 方法的别名。 |

<a name="indexes"></a>
## 索引

<a name="creating-indexes"></a>
### 创建索引

Laravel 的结构构建器支持多种类型的索引。下面的示例创建一个新的 `email` 字段，并指定其值必须唯一。要创建索引，我们可以在字段定义上链式调用 `unique` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，也可以在定义字段之后再创建索引。为此，应在结构构建器的 Blueprint 上调用 `unique` 方法。该方法接受应接收唯一索引的字段名：

```php
$table->unique('email');
```

你甚至可以向索引方法传递字段数组来创建复合（或组合）索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 会根据表名、字段名和索引类型自动生成索引名称，但你也可以向方法传递第二个参数来自行指定索引名称：

```php
$table->unique('email', 'unique_email');
```

<a name="available-index-types"></a>
#### 可用索引类型

Laravel 的结构构建器 Blueprint 类为 Laravel 支持的每种索引类型都提供了创建方法。每个索引方法都接受可选的第二个参数来指定索引名称。如果省略该参数，索引名称将根据表名、用于索引的字段名以及索引类型推导而来。下表列出了所有可用的索引方法：

| 命令 | 说明 |
| --- | --- |
| `$table->primary('id');` | 添加主键。 |
| `$table->primary(['id', 'parent_id']);` | 添加复合键。 |
| `$table->unique('email');` | 添加唯一索引。 |
| `$table->index('state');` | 添加普通索引。 |
| `$table->fullText('body');` | 添加全文索引（MariaDB / MySQL / PostgreSQL）。 |
| `$table->fullText('body')->language('english');` | 添加指定语言的全文索引（PostgreSQL）。 |
| `$table->spatialIndex('location');` | 添加空间索引（SQLite 除外）。 |

<a name="online-index-creation"></a>
#### 在线创建索引

默认情况下，在大表上创建索引可能会在索引构建期间锁定表并阻塞读写。使用 PostgreSQL 或 SQL Server 时，你可以在索引定义上链式调用 `online` 方法，在不锁定表的情况下创建索引，让应用在索引创建期间仍能继续读写数据：

```php
$table->string('email')->unique()->online();
```

使用 PostgreSQL 时，这会在创建索引的语句中添加 `CONCURRENTLY` 选项。使用 SQL Server 时，则会添加 `WITH (online = on)` 选项。

<a name="renaming-indexes"></a>
### 重命名索引

要重命名索引，可以使用结构构建器 Blueprint 提供的 `renameIndex` 方法。该方法接受当前索引名称作为第一个参数，接受期望的名称作为第二个参数：

```php
$table->renameIndex('from', 'to')
```

<a name="dropping-indexes"></a>
### 删除索引

要删除索引，必须指定索引名称。默认情况下，Laravel 会根据表名、被索引的字段名和索引类型自动分配索引名称。以下是一些示例：

| 命令 | 说明 |
| --- | --- |
| `$table->dropPrimary('users_id_primary');` | 从 "users" 表中删除主键。 |
| `$table->dropUnique('users_email_unique');` | 从 "users" 表中删除唯一索引。 |
| `$table->dropIndex('geo_state_index');` | 从 "geo" 表中删除普通索引。 |
| `$table->dropFullText('posts_body_fulltext');` | 从 "posts" 表中删除全文索引。 |
| `$table->dropSpatialIndex('geo_location_spatialindex');` | 从 "geo" 表中删除空间索引（SQLite 除外）。 |

如果向删除索引的方法传递字段数组，Laravel 会根据表名、字段和索引类型生成约定索引名称：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // 删除索引 'geo_state_index'
});
```

<a name="foreign-key-constraints"></a>
### 外键约束

Laravel 还支持创建外键约束，用于在数据库层面强制引用完整性。例如，我们在 `posts` 表上定义一个引用 `users` 表 `id` 字段的 `user_id` 字段：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于这种写法相当冗长，Laravel 提供了额外的、更简洁的方法，它们利用约定来提供更好的开发体验。使用 `foreignId` 方法创建字段时，上面的示例可以改写为：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法会创建一个等同于 `UNSIGNED BIGINT` 的字段，而 `constrained` 方法会利用约定来确定所引用的表和字段。如果你的表名不符合 Laravel 的约定，可以手动向 `constrained` 方法提供表名。此外，还可以指定应分配给所生成索引的名称：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained(
        table: 'users', indexName: 'posts_user_id'
    );
});
```

你还可以为约束的"on delete"和"on update"属性指定期望的操作：

```php
$table->foreignId('user_id')
    ->constrained()
    ->onUpdate('cascade')
    ->onDelete('cascade');
```

Laravel 还为这些操作提供了一种更具表现力的替代语法：

| 方法 | 说明 |
| --- | --- |
| `$table->cascadeOnUpdate();` | 更新时应级联。 |
| `$table->restrictOnUpdate();` | 更新时应受限。 |
| `$table->nullOnUpdate();` | 更新时应将外键值设为 null。 |
| `$table->noActionOnUpdate();` | 更新时不执行任何操作。 |
| `$table->cascadeOnDelete();` | 删除时应级联。 |
| `$table->restrictOnDelete();` | 删除时应受限。 |
| `$table->nullOnDelete();` | 删除时应将外键值设为 null。 |
| `$table->noActionOnDelete();` | 存在子记录时阻止删除。 |

任何额外的[字段修饰符](#column-modifiers)都必须在 `constrained` 方法之前调用：

```php
$table->foreignId('user_id')
    ->nullable()
    ->constrained();
```

<a name="dropping-foreign-keys"></a>
#### 删除外键

要删除外键，可以使用 `dropForeign` 方法，将要删除的外键约束的名称作为参数传入。外键约束使用与索引相同的命名约定。换言之，外键约束的名称基于表名和约束中的字段名，后缀为 "\_foreign"：

```php
$table->dropForeign('posts_user_id_foreign');
```

或者，你也可以向 `dropForeign` 方法传递一个包含外键字段名的数组。该数组会按照 Laravel 的约束命名约定转换为外键约束名称：

```php
$table->dropForeign(['user_id']);
```

<a name="toggling-foreign-key-constraints"></a>
#### 启用 / 禁用外键约束

你可以在迁移中使用以下方法来启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // 此闭包内约束已禁用...
});
```

> [!WARNING]
> SQLite 默认禁用外键约束。使用 SQLite 时，请务必先在数据库配置中[启用外键支持](/docs/{{version}}/database#configuration)，然后再尝试在迁移中创建外键。

<a name="events"></a>
## 事件

为了方便起见，每个迁移操作都会分发一个[事件](/docs/{{version}}/events)。以下所有事件都继承自基类 `Illuminate\Database\Events\MigrationEvent`：

| 类 | 说明 |
| --- | --- |
| `Illuminate\Database\Events\MigrationsStarted` | 一批迁移即将执行。 |
| `Illuminate\Database\Events\MigrationsEnded` | 一批迁移已执行完毕。 |
| `Illuminate\Database\Events\MigrationStarted` | 单个迁移即将执行。 |
| `Illuminate\Database\Events\MigrationEnded` | 单个迁移已执行完毕。 |
| `Illuminate\Database\Events\NoPendingMigrations` | 迁移命令未发现待执行的迁移。 |
| `Illuminate\Database\Events\SchemaDumped` | 数据库结构导出已完成。 |
| `Illuminate\Database\Events\SchemaLoaded` | 已加载现有的数据库结构导出。 |
