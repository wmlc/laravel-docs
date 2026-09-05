# 数据库：迁移

## 简介

迁移就像数据库的版本控制，它让团队可以定义并共享应用数据库结构的定义。如果你曾不得不告诉同事在拉取源码后「手动向本地数据库加一列」，那么你已经亲身体验过数据库迁移要解决的问题。

Laravel 的 `Schema` [facade](/docs/{{version}}/facades) 为所有 Laravel 支持的数据库系统提供与具体数据库无关的建表与表结构变更能力。通常，迁移会通过该 facade 来创建和修改数据库表与列。

## 生成迁移

你可以使用 `make:migration` [Artisan 命令](/docs/{{version}}/artisan) 生成数据库迁移。新生成的迁移文件会放到 `database/migrations` 目录中。每个迁移文件名都包含一个时间戳，用于让 Laravel 确定迁移的执行顺序：

```shell
php artisan make:migration create_flights_table
```

Laravel 会根据迁移名称尝试猜测表名以及该迁移是否会创建新表。如果 Laravel 能从迁移名称中推断出表名，则会在生成的迁移文件中预先填充该表名；否则你需要手动在迁移文件中指定表名。

如果希望为生成的迁移文件指定自定义路径，可以在执行 `make:migration` 命令时使用 `--path` 选项。该路径应相对于应用根目录。

> [!NOTE]
> 可以通过 [stub publishing](/docs/{{version}}/artisan#stub-customization) 自定义迁移 stub 模板。

### 合并迁移

随着应用不断迭代，`database/migrations` 目录中可能堆积越来越多的迁移，最终可能膨胀到上百个。如果你愿意，可以将这些迁移「合并」成单个 SQL 文件。开始之前，请执行 `schema:dump` 命令：

```shell
php artisan schema:dump

# 转储当前数据库结构并裁剪掉所有已存在的迁移...
php artisan schema:dump --prune
```

执行该命令后，Laravel 会将一个「schema」文件写入应用的 `database/schema` 目录。schema 文件名会对应相应的数据库连接。后续当 Laravel 尝试执行迁移且数据库中尚未执行过任何迁移时，会先执行当前数据库连接对应的 schema 文件中的 SQL 语句，再执行尚未包含在该 schema 转储中的剩余迁移。

如果你的应用测试使用的数据库连接与本地开发通常使用的数据库连接不同，请确保也使用该测试连接转储一份 schema 文件，以便测试也能构建数据库。通常的做法是：在完成本地开发连接的转储之后，紧接着为测试连接生成转储：

```shell
php artisan schema:dump
php artisan schema:dump --database=testing --prune
```

你应该将数据库 schema 文件提交到源码版本控制中，这样团队中的新成员就可以快速构建出应用最初的数据库结构。

> [!WARNING]
> 合并迁移仅适用于 MariaDB、MySQL、PostgreSQL 和 SQLite 数据库，并且需要使用相应数据库的命令行客户端。

## 迁移结构

一个迁移类包含两个方法：`up` 与 `down`。`up` 方法用于向数据库添加新表、列或索引，而 `down` 方法应当撤销 `up` 方法所执行的操作。

在这两个方法内部，你可以使用 Laravel schema builder 以声明式方式创建与修改表。要了解 `Schema` builder 上可用的全部方法，请 [查阅其文档](#creating-tables)。例如，下面的迁移会创建一个 `flights` 表：

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 执行迁移。
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

#### 设置迁移连接

如果你的迁移需要与应用默认数据库连接之外的数据库连接交互，应当在迁移中设置 `$connection` 属性：

```php
/**
 * 迁移应当使用的数据库连接。
 *
 * @var string
 */
protected $connection = 'pgsql';

/**
 * 执行迁移。
 */
public function up(): void
{
    // ...
}
```

#### 跳过迁移

有时某个迁移是为了支持尚未启用的功能，并且你暂时不希望它运行。这种情况下，你可以在迁移上定义一个 `shouldRun` 方法。如果 `shouldRun` 方法返回 `false`，迁移将被跳过：

```php
use App\Models\Flight;
use Laravel\Pennant\Feature;

/**
 * 判定本迁移是否应当运行。
 */
public function shouldRun(): bool
{
    return Feature::active(Flight::class);
}
```

## 运行迁移

要运行所有尚未执行的迁移，请执行 `migrate` Artisan 命令：

```shell
php artisan migrate
```

如果想查看哪些迁移已经运行、哪些还在等待执行，可以使用 `migrate:status` Artisan 命令：

```shell
php artisan migrate:status
```

如果向 `migrate` 命令传入 `--step` 选项，那么每条迁移会作为独立批次执行，便于稍后使用 `migrate:rollback` 命令按批次回滚：

```shell
php artisan migrate --step
```

如果想在不真正执行迁移的情况下预览将要运行的 SQL 语句，可以向 `migrate` 命令传入 `--pretend` 标志：

```shell
php artisan migrate --pretend
```

#### 隔离迁移执行

如果你将应用部署在多台服务器上，并在部署过程中运行迁移，你大概不希望两台服务器同时尝试迁移数据库。为避免这种情况，可以在调用 `migrate` 命令时使用 `isolated` 选项。

当提供 `isolated` 选项时，Laravel 会在尝试执行迁移前，通过应用所使用的缓存驱动获取一把原子锁。其他在该锁未释放前尝试运行 `migrate` 命令的进程将不会执行迁移，但命令仍会以成功状态退出：

```shell
php artisan migrate --isolated
```

> [!WARNING]
> 要使用该特性，应用必须将 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动中的某一个设置为默认缓存驱动，并且所有服务器必须连接到同一台中央缓存服务器。

#### 强制在生产环境运行迁移

有些迁移操作具有破坏性，可能会造成数据丢失。为防止你误对生产数据库执行这些命令，系统会在执行前提示你确认。如果要跳过确认强制执行，可以传入 `--force` 标志：

```shell
php artisan migrate --force
```

### 回滚迁移

要回滚最近一次迁移操作，可以使用 `rollback` Artisan 命令。该命令会回滚最近一个「批次」的迁移，其中可能包含多条迁移文件：

```shell
php artisan migrate:rollback
```

可以通过 `step` 选项限制回滚的迁移数量。例如，下面的命令会回滚最近 5 条迁移：

```shell
php artisan migrate:rollback --step=5
```

可以通过 `batch` 选项回滚指定「批次」的迁移，其中 `batch` 选项对应应用 `migrations` 数据库表中保存的批次值。例如，下面的命令会回滚批次 3 中的所有迁移：

```shell
php artisan migrate:rollback --batch=3
```

如果想在不真正执行回滚的情况下预览将要运行的 SQL 语句，可以向 `migrate:rollback` 命令传入 `--pretend` 标志：

```shell
php artisan migrate:rollback --pretend
```

`migrate:reset` 命令会回滚应用中的所有迁移：

```shell
php artisan migrate:reset
```

#### 单命令回滚并迁移

`migrate:refresh` 命令会先回滚所有迁移，然后执行 `migrate` 命令。该命令实际上会重建整个数据库：

```shell
php artisan migrate:refresh

# 刷新数据库并运行所有数据填充...
php artisan migrate:refresh --seed
```

可以通过 `step` 选项限制回滚并重新迁移的迁移数量。例如，下面的命令会回滚并重新迁移最近 5 条迁移：

```shell
php artisan migrate:refresh --step=5
```

#### 删除所有表并迁移

`migrate:fresh` 命令会先删除数据库中的所有表，然后执行 `migrate` 命令：

```shell
php artisan migrate:fresh

php artisan migrate:fresh --seed
```

默认情况下，`migrate:fresh` 命令只会删除默认数据库连接中的表。但可以使用 `--database` 选项指定要迁移的数据库连接。该连接名应与应用 `database` [配置文件](/docs/{{version}}/configuration) 中定义的某个连接相对应：

```shell
php artisan migrate:fresh --database=admin
```

> [!WARNING]
> `migrate:fresh` 命令会无视表前缀，删除所有数据库表。当开发在与其它应用共享的数据库上时，请谨慎使用该命令。

## 表

### 创建表

要创建新的数据库表，可以使用 `Schema` facade 的 `create` 方法。`create` 方法接收两个参数：第一个是表名，第二个是一个闭包，用于接收一个 `Blueprint` 对象以定义新表：

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

创建表时，可以使用 schema builder 的任意 [列方法](#creating-columns) 来定义表的列。

#### 判断表 / 列是否存在

可以使用 `hasTable`、`hasColumn` 和 `hasIndex` 方法判断表、列或索引是否存在：

```php
if (Schema::hasTable('users')) {
    // 表 "users" 存在...
}

if (Schema::hasColumn('users', 'email')) {
    // 表 "users" 存在，且包含 "email" 列...
}

if (Schema::hasIndex('users', ['email'], 'unique')) {
    // 表 "users" 存在，且 "email" 列上有唯一索引...
}
```

#### 数据库连接与表选项

如果希望对非默认数据库连接执行 schema 操作，请使用 `connection` 方法：

```php
Schema::connection('sqlite')->create('users', function (Blueprint $table) {
    $table->id();
});
```

此外，还可以使用一些其它属性与方法来定义创建表时的其它细节。`engine` 属性可用于在使用 MariaDB 或 MySQL 时指定表的存储引擎：

```php
Schema::create('users', function (Blueprint $table) {
    $table->engine('InnoDB');

    // ...
});
```

`charset` 和 `collation` 属性可用于在使用 MariaDB 或 MySQL 时指定表的字符集与排序规则：

```php
Schema::create('users', function (Blueprint $table) {
    $table->charset('utf8mb4');
    $table->collation('utf8mb4_unicode_ci');

    // ...
});
```

`temporary` 方法可用于将表标记为「临时表」。临时表仅对当前连接的数据库会话可见，并在连接关闭时自动删除：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->temporary();

    // ...
});
```

如果希望向数据库表添加「注释」，可以在表实例上调用 `comment` 方法。表注释目前仅 MariaDB、MySQL 和 PostgreSQL 支持：

```php
Schema::create('calculations', function (Blueprint $table) {
    $table->comment('Business calculations');

    // ...
});
```

### 更新表

`Schema` facade 的 `table` 方法可用于更新已有表。与 `create` 方法一样，`table` 方法也接收两个参数：表名与一个接收 `Blueprint` 实例的闭包，你可以使用它向表添加列或索引：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

### 重命名 / 删除表

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

#### 重命名带外键的表

在重命名表之前，你应该确认迁移文件中外键约束都显式指定了名字，而不是让 Laravel 按约定自动生成。否则外键约束的名字仍会引用旧表名。

## 列

### 创建列

`Schema` facade 的 `table` 方法可用于更新已有表。与 `create` 方法一样，`table` 方法接收两个参数：表名与一个接收 `Illuminate\Database\Schema\Blueprint` 实例的闭包，你可以使用它向表添加列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->integer('votes');
});
```

### 可用的列类型

Schema builder 的 blueprint 提供了许多方法，对应与可以添加到表里的各种列类型。下表列出了所有可用的方法：

#### 布尔类型

[`boolean`](#column-method-boolean)

#### 字符串与文本类型

[`char`](#column-method-char)
[`longText`](#column-method-longText)
[`mediumText`](#column-method-mediumText)
[`string`](#column-method-string)
[`text`](#column-method-text)
[`tinyText`](#column-method-tinyText)

#### 数值类型

[`bigIncrements`](#column-method-bigIncrements)
[`bigInteger`](#column-method-bigInteger)
[`decimal`](#column-method-decimal)
[`double`](#column-method-double)
[`float`](#column-method-float)
[`id`](#column-method-id)
[`increments`](#column-method-increments)
[`integer`](#column-method-integer)
[`mediumIncrements`](#column-method-mediumIncrements)
[`mediumInteger`](#column-method-mediumInteger)
[`smallIncrements`](#column-method-smallIncrements)
[`smallInteger`](#column-method-smallInteger)
[`tinyIncrements`](#column-method-tinyIncrements)
[`tinyInteger`](#column-method-tinyInteger)
[`unsignedBigInteger`](#column-method-unsignedBigInteger)
[`unsignedInteger`](#column-method-unsignedInteger)
[`unsignedMediumInteger`](#column-method-unsignedMediumInteger)
[`unsignedSmallInteger`](#column-method-unsignedSmallInteger)
[`unsignedTinyInteger`](#column-method-unsignedTinyInteger)

#### 日期与时间类型

[`dateTime`](#column-method-dateTime)
[`dateTimeTz`](#column-method-dateTimeTz)
[`date`](#column-method-date)
[`time`](#column-method-time)
[`timeTz`](#column-method-timeTz)
[`timestamp`](#column-method-timestamp)
[`timestamps`](#column-method-timestamps)
[`timestampsTz`](#column-method-timestampsTz)
[`softDeletes`](#column-method-softDeletes)
[`softDeletesTz`](#column-method-softDeletesTz)
[`year`](#column-method-year)

#### 二进制类型

[`binary`](#column-method-binary)

#### 对象与 JSON 类型

[`json`](#column-method-json)
[`jsonb`](#column-method-jsonb)

#### UUID 与 ULID 类型

[`ulid`](#column-method-ulid)
[`ulidMorphs`](#column-method-ulidMorphs)
[`uuid`](#column-method-uuid)
[`uuidMorphs`](#column-method-uuidMorphs)
[`nullableUlidMorphs`](#column-method-nullableUlidMorphs)
[`nullableUuidMorphs`](#column-method-nullableUuidMorphs)

#### 空间类型

[`geography`](#column-method-geography)
[`geometry`](#column-method-geometry)

#### 关联类型

[`foreignId`](#column-method-foreignId)
[`foreignIdFor`](#column-method-foreignIdFor)
[`foreignUlid`](#column-method-foreignUlid)
[`foreignUuid`](#column-method-foreignUuid)
[`foreignUuidFor`](#column-method-foreignUuidFor)
[`morphs`](#column-method-morphs)
[`nullableMorphs`](#column-method-nullableMorphs)

#### 特殊类型

[`enum`](#column-method-enum)
[`set`](#column-method-set)
[`macAddress`](#column-method-macAddress)
[`ipAddress`](#column-method-ipAddress)
[`rememberToken`](#column-method-rememberToken)
[`vector`](#column-method-vector)

#### `bigIncrements()` {.collection-method .first-collection-method}

`bigIncrements` 方法用于创建一个自动递增的 `UNSIGNED BIGINT`（主键）等价列：

```php
$table->bigIncrements('id');
```

#### `bigInteger()` {.collection-method}

`bigInteger` 方法用于创建一个 `BIGINT` 等价列：

```php
$table->bigInteger('votes');
```

#### `binary()` {.collection-method}

`binary` 方法用于创建一个 `BLOB` 等价列：

```php
$table->binary('photo');
```

在使用 MySQL、MariaDB 或 SQL Server 时，可以传入 `length` 与 `fixed` 参数来创建 `VARBINARY` 或 `BINARY` 等价列：

```php
$table->binary('data', length: 16); // VARBINARY(16)

$table->binary('data', length: 16, fixed: true); // BINARY(16)
```

#### `boolean()` {.collection-method}

`boolean` 方法用于创建一个 `BOOLEAN` 等价列：

```php
$table->boolean('confirmed');
```

#### `char()` {.collection-method}

`char` 方法用于创建一个指定长度的 `CHAR` 等价列：

```php
$table->char('name', length: 100);
```

#### `dateTimeTz()` {.collection-method}

`dateTimeTz` 方法用于创建一个 `DATETIME`（带时区）等价列，并支持可选的小数秒精度：

```php
$table->dateTimeTz('created_at', precision: 0);
```

#### `dateTime()` {.collection-method}

`dateTime` 方法用于创建一个 `DATETIME` 等价列，并支持可选的小数秒精度：

```php
$table->dateTime('created_at', precision: 0);
```

#### `date()` {.collection-method}

`date` 方法用于创建一个 `DATE` 等价列：

```php
$table->date('created_at');
```

#### `decimal()` {.collection-method}

`decimal` 方法用于创建一个指定精度（总位数）和小数位数（标度）的 `DECIMAL` 等价列：

```php
$table->decimal('amount', total: 8, places: 2);
```

#### `double()` {.collection-method}

`double` 方法用于创建一个 `DOUBLE` 等价列：

```php
$table->double('amount');
```

#### `enum()` {.collection-method}

`enum` 方法用于创建一个指定合法取值的 `ENUM` 等价列：

```php
$table->enum('difficulty', ['easy', 'hard']);
```

当然，你也可以直接使用 `Enum::cases()` 方法，而不必手动定义取值数组：

```php
use App\Enums\Difficulty;

$table->enum('difficulty', Difficulty::cases());
```

#### `float()` {.collection-method}

`float` 方法用于创建一个指定精度的 `FLOAT` 等价列：

```php
$table->float('amount', precision: 53);
```

#### `foreignId()` {.collection-method}

`foreignId` 方法用于创建一个 `UNSIGNED BIGINT` 等价列：

```php
$table->foreignId('user_id');
```

#### `foreignIdFor()` {.collection-method}

`foreignIdFor` 方法会为给定的模型类添加一个 `{column}_id` 等价列。列类型根据模型主键类型分别为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`：

```php
$table->foreignIdFor(User::class);
```

#### `foreignUlid()` {.collection-method}

`foreignUlid` 方法用于创建一个 `ULID` 等价列：

```php
$table->foreignUlid('user_id');
```

#### `foreignUuid()` {.collection-method}

`foreignUuid` 方法用于创建一个 `UUID` 等价列：

```php
$table->foreignUuid('user_id');
```

#### `foreignUuidFor()` {.collection-method}

`foreignUuidFor` 方法会为给定的模型类添加一个 `{column}_id` UUID 等价列：

```php
$table->foreignUuidFor(User::class);
```

#### `geography()` {.collection-method}

`geography` 方法用于创建一个指定空间类型与 SRID（空间参考标识符）的 `GEOGRAPHY` 等价列：

```php
$table->geography('coordinates', subtype: 'point', srid: 4326);
```

> [!NOTE]
> 空间类型的支持程度取决于你所使用的数据库驱动。请参阅相应数据库的文档。如果你的应用使用 PostgreSQL 数据库，则必须先安装 [PostGIS](https://postgis.net) 扩展后才能使用 `geography` 方法。

#### `geometry()` {.collection-method}

`geometry` 方法用于创建一个指定空间类型与 SRID（空间参考标识符）的 `GEOMETRY` 等价列：

```php
$table->geometry('positions', subtype: 'point', srid: 0);
```

> [!NOTE]
> 空间类型的支持程度取决于你所使用的数据库驱动。请参阅相应数据库的文档。如果你的应用使用 PostgreSQL 数据库，则必须先安装 [PostGIS](https://postgis.net) 扩展后才能使用 `geometry` 方法。

#### `id()` {.collection-method}

`id` 方法是 `bigIncrements` 方法的别名。默认情况下，该方法会创建一个名为 `id` 的列；不过你也可以传入列名来指定不同的列名：

```php
$table->id();
```

#### `increments()` {.collection-method}

`increments` 方法用于创建一个作为主键的自动递增 `UNSIGNED INTEGER` 等价列：

```php
$table->increments('id');
```

#### `integer()` {.collection-method}

`integer` 方法用于创建一个 `INTEGER` 等价列：

```php
$table->integer('votes');
```

#### `ipAddress()` {.collection-method}

`ipAddress` 方法用于创建一个 `VARCHAR` 等价列：

```php
$table->ipAddress('visitor');
```

使用 PostgreSQL 时，会创建一个 `INET` 列。

#### `json()` {.collection-method}

`json` 方法用于创建一个 `JSON` 等价列：

```php
$table->json('options');
```

使用 SQLite 时，会创建一个 `TEXT` 列。

#### `jsonb()` {.collection-method}

`jsonb` 方法用于创建一个 `JSONB` 等价列：

```php
$table->jsonb('options');
```

使用 SQLite 时，会创建一个 `TEXT` 列。

#### `longText()` {.collection-method}

`longText` 方法用于创建一个 `LONGTEXT` 等价列：

```php
$table->longText('description');
```

在使用 MySQL 或 MariaDB 时，可以向该列应用 `binary` 字符集以创建 `LONGBLOB` 等价列：

```php
$table->longText('data')->charset('binary'); // LONGBLOB
```

#### `macAddress()` {.collection-method}

`macAddress` 方法用于创建一个用于保存 MAC 地址的列。某些数据库系统（如 PostgreSQL）为这种数据提供了专门的列类型，其它数据库系统则会使用字符串等价列：

```php
$table->macAddress('device');
```

#### `mediumIncrements()` {.collection-method}

`mediumIncrements` 方法用于创建一个作为主键的自动递增 `UNSIGNED MEDIUMINT` 等价列：

```php
$table->mediumIncrements('id');
```

#### `mediumInteger()` {.collection-method}

`mediumInteger` 方法用于创建一个 `MEDIUMINT` 等价列：

```php
$table->mediumInteger('votes');
```

#### `mediumText()` {.collection-method}

`mediumText` 方法用于创建一个 `MEDIUMTEXT` 等价列：

```php
$table->mediumText('description');
```

在使用 MySQL 或 MariaDB 时，可以向该列应用 `binary` 字符集以创建 `MEDIUMBLOB` 等价列：

```php
$table->mediumText('data')->charset('binary'); // MEDIUMBLOB
```

#### `morphs()` {.collection-method}

`morphs` 方法是一个便捷方法，会同时添加一个 `{column}_type` 等价 `VARCHAR` 列和一个 `{column}_id` 等价列。`{column}_id` 列的类型取决于模型主键类型，分别为 `UNSIGNED BIGINT`、`CHAR(36)` 或 `CHAR(26)`。

该方法适用于定义 [多态 Eloquent 关联](/docs/{{version}}/eloquent-relationships) 所需要的列。在下面的示例中，会创建 `taggable_type` 和 `taggable_id` 两列：

```php
$table->morphs('taggable');
```

#### `nullableMorphs()` {.collection-method}

该方法与 [morphs](#column-method-morphs) 方法类似，但生成的列允许为空（`nullable`）：

```php
$table->nullableMorphs('taggable');
```

#### `nullableUlidMorphs()` {.collection-method}

该方法与 [ulidMorphs](#column-method-ulidMorphs) 方法类似，但生成的列允许为空（`nullable`）：

```php
$table->nullableUlidMorphs('taggable');
```

#### `nullableUuidMorphs()` {.collection-method}

该方法与 [uuidMorphs](#column-method-uuidMorphs) 方法类似，但生成的列允许为空（`nullable`）：

```php
$table->nullableUuidMorphs('taggable');
```

#### `rememberToken()` {.collection-method}

`rememberToken` 方法用于创建一个可空的 `VARCHAR(100)` 等价列，用于存储「记住我」[认证令牌](/docs/{{version}}/authentication#remembering-users)：

```php
$table->rememberToken();
```

#### `set()` {.collection-method}

`set` 方法用于创建一个指定合法取值列表的 `SET` 等价列：

```php
$table->set('flavors', ['strawberry', 'vanilla']);
```

#### `smallIncrements()` {.collection-method}

`smallIncrements` 方法用于创建一个作为主键的自动递增 `UNSIGNED SMALLINT` 等价列：

```php
$table->smallIncrements('id');
```

#### `smallInteger()` {.collection-method}

`smallInteger` 方法用于创建一个 `SMALLINT` 等价列：

```php
$table->smallInteger('votes');
```

#### `softDeletesTz()` {.collection-method}

`softDeletesTz` 方法用于添加一个可空的 `deleted_at` `TIMESTAMP`（带时区）等价列，并支持可选的小数秒精度。该列用于存储 Eloquent 「软删除」功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletesTz('deleted_at', precision: 0);
```

#### `softDeletes()` {.collection-method}

`softDeletes` 方法用于添加一个可空的 `deleted_at` `TIMESTAMP` 等价列，并支持可选的小数秒精度。该列用于存储 Eloquent 「软删除」功能所需的 `deleted_at` 时间戳：

```php
$table->softDeletes('deleted_at', precision: 0);
```

#### `string()` {.collection-method}

`string` 方法用于创建一个指定长度的 `VARCHAR` 等价列：

```php
$table->string('name', length: 100);
```

#### `text()` {.collection-method}

`text` 方法用于创建一个 `TEXT` 等价列：

```php
$table->text('description');
```

在使用 MySQL 或 MariaDB 时，可以向该列应用 `binary` 字符集以创建 `BLOB` 等价列：

```php
$table->text('data')->charset('binary'); // BLOB
```

#### `timeTz()` {.collection-method}

`timeTz` 方法用于创建一个 `TIME`（带时区）等价列，并支持可选的小数秒精度：

```php
$table->timeTz('sunrise', precision: 0);
```

#### `time()` {.collection-method}

`time` 方法用于创建一个 `TIME` 等价列，并支持可选的小数秒精度：

```php
$table->time('sunrise', precision: 0);
```

#### `timestampTz()` {.collection-method}

`timestampTz` 方法用于创建一个 `TIMESTAMP`（带时区）等价列，并支持可选的小数秒精度：

```php
$table->timestampTz('added_at', precision: 0);
```

#### `timestamp()` {.collection-method}

`timestamp` 方法用于创建一个 `TIMESTAMP` 等价列，并支持可选的小数秒精度：

```php
$table->timestamp('added_at', precision: 0);
```

#### `timestampsTz()` {.collection-method}

`timestampsTz` 方法用于创建 `created_at` 与 `updated_at` 两个 `TIMESTAMP`（带时区）等价列，并支持可选的小数秒精度：

```php
$table->timestampsTz(precision: 0);
```

#### `timestamps()` {.collection-method}

`timestamps` 方法用于创建 `created_at` 与 `updated_at` 两个 `TIMESTAMP` 等价列，并支持可选的小数秒精度：

```php
$table->timestamps(precision: 0);
```

#### `tinyIncrements()` {.collection-method}

`tinyIncrements` 方法用于创建一个作为主键的自动递增 `UNSIGNED TINYINT` 等价列：

```php
$table->tinyIncrements('id');
```

#### `tinyInteger()` {.collection-method}

`tinyInteger` 方法用于创建一个 `TINYINT` 等价列：

```php
$table->tinyInteger('votes');
```

#### `tinyText()` {.collection-method}

`tinyText` 方法用于创建一个 `TINYTEXT` 等价列：

```php
$table->tinyText('notes');
```

在使用 MySQL 或 MariaDB 时，可以向该列应用 `binary` 字符集以创建 `TINYBLOB` 等价列：

```php
$table->tinyText('data')->charset('binary'); // TINYBLOB
```

#### `unsignedBigInteger()` {.collection-method}

`unsignedBigInteger` 方法用于创建一个 `UNSIGNED BIGINT` 等价列：

```php
$table->unsignedBigInteger('votes');
```

#### `unsignedInteger()` {.collection-method}

`unsignedInteger` 方法用于创建一个 `UNSIGNED INTEGER` 等价列：

```php
$table->unsignedInteger('votes');
```

#### `unsignedMediumInteger()` {.collection-method}

`unsignedMediumInteger` 方法用于创建一个 `UNSIGNED MEDIUMINT` 等价列：

```php
$table->unsignedMediumInteger('votes');
```

#### `unsignedSmallInteger()` {.collection-method}

`unsignedSmallInteger` 方法用于创建一个 `UNSIGNED SMALLINT` 等价列：

```php
$table->unsignedSmallInteger('votes');
```

#### `unsignedTinyInteger()` {.collection-method}

`unsignedTinyInteger` 方法用于创建一个 `UNSIGNED TINYINT` 等价列：

```php
$table->unsignedTinyInteger('votes');
```

#### `ulidMorphs()` {.collection-method}

`ulidMorphs` 方法是一个便捷方法，会同时添加一个 `{column}_type` 等价 `VARCHAR` 列和一个 `{column}_id` `CHAR(26)` 等价列。

该方法适用于定义使用 ULID 标识符的 [多态 Eloquent 关联](/docs/{{version}}/eloquent-relationships) 所需要的列。在下面的示例中，会创建 `taggable_type` 和 `taggable_id` 两列：

```php
$table->ulidMorphs('taggable');
```

#### `uuidMorphs()` {.collection-method}

`uuidMorphs` 方法是一个便捷方法，会同时添加一个 `{column}_type` 等价 `VARCHAR` 列和一个 `{column}_id` `CHAR(36)` 等价列。

该方法适用于定义使用 UUID 标识符的 [多态 Eloquent 关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships) 所需要的列。在下面的示例中，会创建 `taggable_type` 和 `taggable_id` 两列：

```php
$table->uuidMorphs('taggable');
```

#### `ulid()` {.collection-method}

`ulid` 方法用于创建一个 `ULID` 等价列：

```php
$table->ulid('id');
```

#### `uuid()` {.collection-method}

`uuid` 方法用于创建一个 `UUID` 等价列：

```php
$table->uuid('id');
```

#### `vector()` {.collection-method}

`vector` 方法用于创建一个 `vector` 等价列：

```php
$table->vector('embedding', dimensions: 100);
```

在使用 PostgreSQL 时，必须先加载 `pgvector` 扩展才能创建 `vector` 列：

```php
Schema::ensureVectorExtensionExists();
```

#### `year()` {.collection-method}

`year` 方法用于创建一个 `YEAR` 等价列：

```php
$table->year('birth_year');
```

### 列修饰符

除了上面列出的列类型外，向数据库表添加列时还可以使用若干「修饰符」。例如，要让列允许为空（`nullable`），可以使用 `nullable` 方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable();
});
```

下表列出了所有可用的列修饰符。该列表不包含 [索引修饰符](#creating-indexes)：

| 修饰符                              | 描述                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `->after('column')`                 | 将列放在另一列「之后」（MariaDB / MySQL）。                                                 |
| `->autoIncrement()`                 | 将 `INTEGER` 列设为自动递增（主键）。                                                      |
| `->charset('utf8mb4')`              | 为列指定字符集（MariaDB / MySQL）。                                                         |
| `->collation('utf8mb4_unicode_ci')` | 为列指定排序规则。                                                                          |
| `->comment('my comment')`           | 为列添加注释（MariaDB / MySQL / PostgreSQL）。                                              |
| `->default($value)`                 | 为列指定「默认值」。                                                                        |
| `->first()`                         | 将列放在表的「第一位」（MariaDB / MySQL）。                                                 |
| `->from($integer)`                  | 设置自动递增字段的起始值（MariaDB / MySQL / PostgreSQL）。                                  |
| `->instant()`                       | 使用 MySQL 的 instant 操作来添加或修改列。                                                  |
| `->invisible()`                     | 让列对 `SELECT *` 查询「不可见」（MariaDB / MySQL）。                                       |
| `->lock($mode)`                     | 为列操作指定锁模式（MySQL）。                                                               |
| `->nullable($value = true)`         | 允许向该列插入 `NULL` 值。                                                                 |
| `->storedAs($expression)`           | 创建一个存储型生成列（MariaDB / MySQL / PostgreSQL / SQLite）。                             |
| `->unsigned()`                      | 将 `INTEGER` 列设为 `UNSIGNED`（MariaDB / MySQL）。                                         |
| `->using($expression)`              | 在修改列类型时指定转换表达式（PostgreSQL）。                                                |
| `->useCurrent()`                    | 将 `TIMESTAMP` 列的默认值设为 `CURRENT_TIMESTAMP`。                                         |
| `->useCurrentOnUpdate()`            | 将 `TIMESTAMP` 列在记录更新时的值设为 `CURRENT_TIMESTAMP`（MariaDB / MySQL）。              |
| `->virtualAs($expression)`          | 创建一个虚拟生成列（MariaDB / MySQL / SQLite）。                                           |
| `->generatedAs($expression)`        | 创建一个带指定序列选项的 identity 列（PostgreSQL）。                                        |
| `->always()`                        | 定义 identity 列中序列值相对输入值的优先级（PostgreSQL）。                                  |

#### 默认表达式

`default` 修饰符接受一个值或一个 `Illuminate\Database\Query\Expression` 实例。使用 `Expression` 实例可以避免 Laravel 自动为值加上引号，从而可以使用特定数据库的函数。在需要为 JSON 列指定默认值时，这一用法特别有用：

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * 执行迁移。
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
> 默认表达式的支持情况取决于你所使用的数据库驱动、数据库版本以及字段类型。请参阅相应数据库的文档。

#### 列顺序

在使用 MariaDB 或 MySQL 数据库时，可以使用 `after` 方法在已有列之后添加新列：

```php
$table->after('password', function (Blueprint $table) {
    $table->string('address_line1');
    $table->string('address_line2');
    $table->string('city');
});
```

#### Instant 列操作

在使用 MySQL 时，可以在列定义后链式调用 `instant` 修饰符，以指示使用 MySQL 的「instant」算法添加或修改列。该算法允许在不完全重建表的前提下完成某些 schema 变更，因此无论表大小如何，几乎都能即时完成：

```php
$table->string('name')->nullable()->instant();
```

Instant 列添加只能把列追加到表的末尾，因此 `instant` 修饰符不能与 `after` 或 `first` 修饰符同时使用。此外，instant 算法并非支持所有列类型或操作。如果所请求的操作与 instant 算法不兼容，MySQL 会抛出错误。

请参阅 [MySQL 文档](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-operations.html) 以确定哪些操作与 instant 列修改兼容。

#### DDL 锁

在使用 MySQL 时，可以在列、索引或外键定义后链式调用 `lock` 修饰符，以控制 schema 操作期间的表锁行为。MySQL 支持多种锁模式：`none` 允许并发读写，`shared` 允许并发读但阻塞写，`exclusive` 阻塞所有并发访问，`default` 由 MySQL 选择最合适的模式：

```php
$table->string('name')->lock('none');

$table->index('email')->lock('shared');
```

如果所请求的锁模式与该操作不兼容，MySQL 会抛出错误。`lock` 修饰符可以与 `instant` 修饰符组合使用，以进一步优化 schema 变更：

```php
$table->string('name')->instant()->lock('none');
```

### 修改列

`change` 方法允许你修改已有列的类型与属性。例如，你可能希望将 `string` 列的长度调大。要看 `change` 方法的实际效果，我们来将 `name` 列的长度从 25 调到 50。为此，只需定义该列的新状态，然后调用 `change` 方法即可：

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->change();
});
```

修改列时，必须显式包含你希望保留的全部修饰符——任何遗漏的属性都将被丢弃。例如，若要保留 `unsigned`、`default` 与 `comment` 属性，必须在调用 `change` 时显式声明每个修饰符：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('my comment')->change();
});
```

`change` 方法不会改变列的索引。因此，可以在修改列时使用索引修饰符显式添加或移除索引：

```php
// 添加索引...
$table->bigIncrements('id')->primary()->change();

// 删除索引...
$table->char('postal_code', 10)->unique(false)->change();
```

#### PostgreSQL 列修改

在 PostgreSQL 上修改列类型时，可以使用 `using` 修饰符指定用于转换已有数据的表达式：

```php
Schema::table('users', function (Blueprint $table) {
    $table->date('birthday')->using('birthday::date')->change();
});
```

### 重命名列

要重命名一个列，可以使用 schema builder 提供的 `renameColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

### 删除列

要删除一个列，可以在 schema builder 上使用 `dropColumn` 方法：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
});
```

可以通过向 `dropColumn` 方法传入列名数组一次性删除多列：

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn(['votes', 'avatar', 'location']);
});
```

#### 可用的命令别名

Laravel 提供了一些便捷方法，用于删除常见类型的列。下表对这些方法逐一作了说明：

| 命令                              | 描述                                                |
| --------------------------------- | --------------------------------------------------- |
| `$table->dropMorphs('morphable');` | 删除 `morphable_type` 和 `morphable_id` 列。        |
| `$table->dropRememberToken();`    | 删除 `remember_token` 列。                          |
| `$table->dropSoftDeletes();`      | 删除 `deleted_at` 列。                              |
| `$table->dropSoftDeletesTz();`    | `dropSoftDeletes()` 方法的别名。                    |
| `$table->dropTimestamps();`       | 删除 `created_at` 和 `updated_at` 列。              |
| `$table->dropTimestampsTz();`     | `dropTimestamps()` 方法的别名。                     |

## 索引

### 创建索引

Laravel schema builder 支持多种类型的索引。下面的示例创建一个新的 `email` 列，并指定其取值唯一。要创建该索引，可以将 `unique` 方法链接到列定义上：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('users', function (Blueprint $table) {
    $table->string('email')->unique();
});
```

或者，也可以在定义列之后再创建索引。为此，需要在 schema builder blueprint 上调用 `unique` 方法。该方法接收需要建立唯一索引的列名：

```php
$table->unique('email');
```

你甚至可以向索引方法传入一个列数组，从而创建复合索引：

```php
$table->index(['account_id', 'created_at']);
```

创建索引时，Laravel 会自动基于表名、列名和索引类型生成索引名，但你也可以向该方法传入第二个参数来自行指定索引名：

```php
$table->unique('email', 'unique_email');
```

#### 可用的索引类型

Laravel 的 schema builder blueprint 类为 Laravel 所支持的每一种索引都提供了相应的创建方法。每个索引方法都接收一个可选的第二个参数，用于指定索引名。如果省略索引名，Laravel 会基于表名、参与索引的列名以及索引类型自动推导。下表描述了所有可用的索引方法：

| 命令                                            | 描述                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `$table->primary('id');`                         | 添加主键。                                                 |
| `$table->primary(['id', 'parent_id']);`          | 添加复合键。                                               |
| `$table->unique('email');`                       | 添加唯一索引。                                             |
| `$table->index('state');`                        | 添加普通索引。                                             |
| `$table->fullText('body');`                      | 添加全文索引（MariaDB / MySQL / PostgreSQL）。             |
| `$table->fullText('body')->language('english');` | 添加指定语言的全文索引（PostgreSQL）。                     |
| `$table->spatialIndex('location');`              | 添加空间索引（SQLite 除外）。                              |

#### 在线创建索引

默认情况下，为一张大表创建索引时会锁住该表，并在索引构建期间阻塞读写。在使用 PostgreSQL 或 SQL Server 时，可以在索引定义后链式调用 `online` 方法来实现在线创建索引，从而在创建过程中允许应用继续读写数据：

```php
$table->string('email')->unique()->online();
```

在使用 PostgreSQL 时，这会为索引创建语句加上 `CONCURRENTLY` 选项；在使用 SQL Server 时，这会加上 `WITH (online = on)` 选项。

### 重命名索引

要重命名一个索引，可以使用 schema builder blueprint 提供的 `renameIndex` 方法。该方法接收当前索引名作为第一个参数，期望的新名字作为第二个参数：

```php
$table->renameIndex('from', 'to')
```

### 删除索引

要删除一个索引，必须指定索引的名称。默认情况下，Laravel 会基于表名、被索引列名以及索引类型自动分配索引名。示例如下：

| 命令                                                      | 描述                                                  |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `$table->dropPrimary('users_id_primary');`                 | 从 "users" 表删除主键。                               |
| `$table->dropUnique('users_email_unique');`                | 从 "users" 表删除唯一索引。                           |
| `$table->dropIndex('geo_state_index');`                    | 从 "geo" 表删除普通索引。                             |
| `$table->dropFullText('posts_body_fulltext');`             | 从 "posts" 表删除全文索引。                           |
| `$table->dropSpatialIndex('geo_location_spatialindex');`   | 从 "geo" 表删除空间索引（SQLite 除外）。              |

如果将一个列数组传入删除索引的方法，索引名会基于表名、列与索引类型按约定生成：

```php
Schema::table('geo', function (Blueprint $table) {
    $table->dropIndex(['state']); // 删除索引 'geo_state_index'
});
```

### 外键约束

Laravel 还支持创建外键约束，用于在数据库层面强制保持引用完整性。例如，我们在 `posts` 表上定义一个 `user_id` 列，使其引用 `users` 表的 `id` 列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')->references('id')->on('users');
});
```

由于上述写法比较冗长，Laravel 提供了更简洁的、基于约定的写法。当使用 `foreignId` 方法创建列时，上面的例子可以改写为：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```

`foreignId` 方法会创建一个 `UNSIGNED BIGINT` 等价列，`constrained` 方法则会根据约定推断被引用的表与列。如果你的表名不符合 Laravel 的约定，可以手动向 `constrained` 方法提供表名。同时，也可以为生成索引指定一个名字：

```php
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained(
        table: 'users', indexName: 'posts_user_id'
    );
});
```

你还可以为约束的「on delete」与「on update」属性指定期望的动作：

```php
$table->foreignId('user_id')
    ->constrained()
    ->onUpdate('cascade')
    ->onDelete('cascade');
```

Laravel 同时为这些动作提供了一套更具表达力的替代语法：

| 方法                            | 描述                                         |
| ------------------------------- | -------------------------------------------- |
| `$table->cascadeOnUpdate();`    | 更新时级联。                                 |
| `$table->restrictOnUpdate();`   | 更新时限制。                                 |
| `$table->nullOnUpdate();`       | 更新时将外键值置为 NULL。                    |
| `$table->noActionOnUpdate();`   | 更新时不执行任何动作。                       |
| `$table->cascadeOnDelete();`    | 删除时级联。                                 |
| `$table->restrictOnDelete();`   | 删除时限制。                                 |
| `$table->nullOnDelete();`       | 删除时将外键值置为 NULL。                    |
| `$table->noActionOnDelete();`   | 若存在子记录则阻止删除。                     |

任何额外的 [列修饰符](#column-modifiers) 都必须在 `constrained` 方法之前调用：

```php
$table->foreignId('user_id')
    ->nullable()
    ->constrained();
```

#### 删除外键

要删除外键，可以使用 `dropForeign` 方法，并将待删除的外键约束名作为参数传入。外键约束的命名规则与索引相同。换句话说，外键约束名基于表名以及参与约束的列名，并附加一个「\_foreign」后缀：

```php
$table->dropForeign('posts_user_id_foreign');
```

也可以向 `dropForeign` 方法传入一个包含外键列名的数组。该数组会按 Laravel 的约束命名约定转换为外键约束名：

```php
$table->dropForeign(['user_id']);
```

#### 切换外键约束

可以在迁移中通过以下方法启用或禁用外键约束：

```php
Schema::enableForeignKeyConstraints();

Schema::disableForeignKeyConstraints();

Schema::withoutForeignKeyConstraints(function () {
    // 该闭包内，外键约束被禁用...
});
```

> [!WARNING]
> SQLite 默认禁用外键约束。在使用 SQLite 时，请确保已在数据库配置中 [启用外键支持](/docs/{{version}}/database#configuration)，然后再尝试在迁移中创建外键。

## 事件

为了便利，每次迁移操作都会派发一个 [事件](/docs/{{version}}/events)。下面所有的事件都继承自基类 `Illuminate\Database\Events\MigrationEvent`：

| 类                                              | 描述                                          |
| ----------------------------------------------- | --------------------------------------------- |
| `Illuminate\Database\Events\DatabaseRefreshed`  | `migrate:refresh` 命令已完成。                |
| `Illuminate\Database\Events\MigrationsStarted`  | 一批迁移即将执行。                |
| `Illuminate\Database\Events\MigrationsEnded`    | 一批迁移已执行完成。              |
| `Illuminate\Database\Events\MigrationStarted`   | 单条迁移即将执行。              |
| `Illuminate\Database\Events\MigrationEnded`     | 单条迁移已执行完成。             |
| `Illuminate\Database\Events\NoPendingMigrations`| 迁移命令未发现待执行的迁移。    |
| `Illuminate\Database\Events\SchemaDumped`       | 数据库结构转储已完成。          |
| `Illuminate\Database\Events\SchemaLoaded`       | 已加载一份现有的数据库结构转储。|