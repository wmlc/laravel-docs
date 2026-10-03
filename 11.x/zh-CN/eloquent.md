# Eloquent：入门

- [简介](#introduction)
- [生成模型类](#generating-model-classes)
- [Eloquent 模型约定](#eloquent-model-conventions)
    - [表名](#table-names)
    - [主键](#primary-keys)
    - [UUID 与 ULID 主键](#uuid-and-ulid-keys)
    - [时间戳](#timestamps)
    - [数据库连接](#database-connections)
    - [默认属性值](#default-attribute-values)
    - [配置 Eloquent 严格模式](#configuring-eloquent-strictness)
- [检索模型](#retrieving-models)
    - [集合](#collections)
    - [分块结果](#chunking-results)
    - [使用惰性集合分块](#chunking-using-lazy-collections)
    - [游标](#cursors)
    - [高级子查询](#advanced-subqueries)
- [检索单个模型 / 聚合值](#retrieving-single-models)
    - [检索或创建模型](#retrieving-or-creating-models)
    - [检索聚合值](#retrieving-aggregates)
- [插入与更新模型](#inserting-and-updating-models)
    - [插入](#inserts)
    - [更新](#updates)
    - [批量赋值](#mass-assignment)
    - [Upsert](#upserts)
- [删除模型](#deleting-models)
    - [软删除](#soft-deleting)
    - [查询软删除的模型](#querying-soft-deleted-models)
- [模型裁剪](#pruning-models)
- [复制模型](#replicating-models)
- [查询作用域](#query-scopes)
    - [全局作用域](#global-scopes)
    - [局部作用域](#local-scopes)
    - [待定属性](#pending-attributes)
- [比较模型](#comparing-models)
- [事件](#events)
    - [使用闭包](#events-using-closures)
    - [观察者](#observers)
    - [静默事件](#muting-events)

<a name="introduction"></a>
## 简介

Laravel 内置了 Eloquent，这是一个对象关系映射器（ORM），让与数据库交互变得轻松愉快。使用 Eloquent 时，每张数据库表都有一个对应的"模型"，用于与该表交互。除了从数据库表中检索记录之外，Eloquent 模型还允许你向表中插入、更新和删除记录。

> [!NOTE]
> 开始之前，请务必在应用的 `config/database.php` 配置文件中配置数据库连接。有关配置数据库的更多信息，请查看[数据库配置文档](/docs/{{version}}/database#configuration)。

#### Laravel Bootcamp

如果你是 Laravel 新手，随时可以开始学习 [Laravel Bootcamp](https://bootcamp.laravel.com)。Laravel Bootcamp 会手把手带你使用 Eloquent 构建第一个 Laravel 应用。这是全面了解 Laravel 与 Eloquent 所提供的各种能力的好方式。

<a name="generating-model-classes"></a>
## 生成模型类

我们先来创建一个 Eloquent 模型。模型通常存放在 `app\Models` 目录中，并继承 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/docs/{{version}}/artisan)生成新模型：

```shell
php artisan make:model Flight
```

如果你希望在生成模型的同时生成[数据库迁移](/docs/{{version}}/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

生成模型时，你还可以生成各种其他类型的类，例如工厂、数据填充、策略、控制器以及表单请求。此外，这些选项可以组合使用，一次创建多个类：

```shell
# 生成一个模型和一个 FlightFactory 类...
php artisan make:model Flight --factory
php artisan make:model Flight -f

# 生成一个模型和一个 FlightSeeder 类...
php artisan make:model Flight --seed
php artisan make:model Flight -s

# 生成一个模型和一个 FlightController 类...
php artisan make:model Flight --controller
php artisan make:model Flight -c

# 生成一个模型、FlightController 资源控制器以及表单请求类...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成一个模型和一个 FlightPolicy 类...
php artisan make:model Flight --policy

# 生成一个模型以及迁移、工厂、数据填充和控制器...
php artisan make:model Flight -mfsc

# 快捷方式：生成一个模型以及迁移、工厂、数据填充、策略、控制器和表单请求...
php artisan make:model Flight --all
php artisan make:model Flight -a

# 生成一个中间表模型...
php artisan make:model Member --pivot
php artisan make:model Member -p
```

<a name="inspecting-models"></a>
#### 检查模型

有时，仅仅通过浏览代码很难确定一个模型所有可用的属性与关联。此时不妨试试 `model:show` Artisan 命令，它提供了该模型所有属性与关联关系的便捷概览：

```shell
php artisan model:show Flight
```

<a name="eloquent-model-conventions"></a>
## Eloquent 模型约定

`make:model` 命令生成的模型会被放置在 `app/Models` 目录中。我们来看一个基础的模型类，并讨论 Eloquent 的一些关键约定：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    // ...
}
```

<a name="table-names"></a>
### 表名

看过上面的示例后，你可能已经注意到，我们并没有告诉 Eloquent 哪个数据库表对应于我们的 `Flight` 模型。按照约定，除非显式指定其他名称，否则类名的小写蛇形复数形式会被用作表名。因此在这个例子中，Eloquent 会假定 `Flight` 模型把记录存储在 `flights` 表中，而 `AirTrafficController` 模型则会把记录存储在 `air_traffic_controllers` 表中。

如果你模型对应的数据库表不符合该约定，可以通过在模型上定义 `table` 属性来手动指定模型表名：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 与模型关联的数据表。
     *
     * @var string
     */
    protected $table = 'my_flights';
}
```

<a name="primary-keys"></a>
### 主键

Eloquent 还会假定每个模型对应的数据库表都有一个名为 `id` 的主键列。如有必要，你可以在模型上定义一个受保护的 `$primaryKey` 属性，指定另一个充当模型主键的列：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 与数据表关联的主键。
     *
     * @var string
     */
    protected $primaryKey = 'flight_id';
}
```

此外，Eloquent 假定主键是一个自增的整数值，这意味着 Eloquent 会自动把主键转换为整数。如果你希望使用非自增或非数字的主键，必须在模型上定义一个值为 `false` 的公共 `$incrementing` 属性：

```php
<?php

class Flight extends Model
{
    /**
     * 指示模型 ID 是否为自增。
     *
     * @var bool
     */
    public $incrementing = false;
}
```

如果模型的主键不是整数，你应当在模型上定义一个受保护的 `$keyType` 属性。该属性的值应为 `string`：

```php
<?php

class Flight extends Model
{
    /**
     * 主键 ID 的数据类型。
     *
     * @var string
     */
    protected $keyType = 'string';
}
```

<a name="composite-primary-keys"></a>
#### "复合"主键

Eloquent 要求每个模型至少有一个可以充当主键的唯一标识"ID"。Eloquent 模型不支持"复合"主键。不过，除了表中用于唯一标识的主键之外，你仍然可以自由地为数据库表添加额外的多列唯一索引。

<a name="uuid-and-ulid-keys"></a>
### UUID 与 ULID 主键

你可以选择使用 UUID，而不是用自增整数作为 Eloquent 模型的主键。UUID 是全局唯一的字母数字标识符，长度为 36 个字符。

如果你希望某个模型使用 UUID 主键而不是自增整数主键，可以在该模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` Trait。当然，你还应当确保该模型拥有[与 UUID 等效的主键列](/docs/{{version}}/migrations#column-method-uuid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUuids;

    // ...
}

$article = Article::create(['title' => 'Traveling to Europe']);

$article->id; // "8f8e8478-9035-4d23-b9a7-62f4d2612ce5"
```

默认情况下，`HasUuids` Trait 会为模型生成["有序" UUID](/docs/{{version}}/strings#method-str-ordered-uuid)。这些 UUID 可以按字典序排序，因此在带索引的数据库存储中更加高效。

你可以通过在模型上定义 `newUniqueId` 方法，覆盖给定模型的 UUID 生成过程。此外，你还可以通过定义 `uniqueIds` 方法指定哪些列应当接收 UUID：

```php
use Ramsey\Uuid\Uuid;

/**
 * 为模型生成一个新的 UUID。
 */
public function newUniqueId(): string
{
    return (string) Uuid::uuid4();
}

/**
 * 获取应当接收唯一标识符的列。
 *
 * @return array<int, string>
 */
public function uniqueIds(): array
{
    return ['id', 'discount_code'];
}
```

如果愿意，你也可以选择使用 "ULID" 代替 UUID。ULID 与 UUID 类似；不过它们的长度只有 26 个字符。与有序 UUID 一样，ULID 可以按字典序排序，从而实现高效的数据库索引。要使用 ULID，你应当在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` Trait。你还应当确保该模型拥有[与 ULID 等效的主键列](/docs/{{version}}/migrations#column-method-ulid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUlids;

    // ...
}

$article = Article::create(['title' => 'Traveling to Asia']);

$article->id; // "01gd4d3tgrrfqeda94gdbtdk5c"
```

<a name="timestamps"></a>
### 时间戳

默认情况下，Eloquent 期望模型对应的数据库表中存在 `created_at` 与 `updated_at` 列。Eloquent 会在模型创建或更新时自动设置这些列的值。如果你不希望这两个列由 Eloquent 自动维护，就应当在模型上定义一个值为 `false` 的 `$timestamps` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 指示模型是否应该被时间戳记录。
     *
     * @var bool
     */
    public $timestamps = false;
}
```

如果你需要自定义模型时间戳的格式，请设置模型上的 `$dateFormat` 属性。该属性决定日期属性在数据库中的存储方式，以及在模型序列化为数组或 JSON 时的格式：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型日期列的存储格式。
     *
     * @var string
     */
    protected $dateFormat = 'U';
}
```

如果你需要自定义用于存储时间戳的列名，可以在模型上定义 `CREATED_AT` 与 `UPDATED_AT` 常量：

```php
<?php

class Flight extends Model
{
    const CREATED_AT = 'creation_date';
    const UPDATED_AT = 'updated_date';
}
```

如果你希望在执行模型操作时不让模型的 `updated_at` 时间戳被修改，可以在传给 `withoutTimestamps` 方法的闭包中操作该模型：

```php
Model::withoutTimestamps(fn () => $post->increment('reads'));
```

<a name="database-connections"></a>
### 数据库连接

默认情况下，所有 Eloquent 模型都会使用应用配置的默认数据库连接。如果你想为某个特定模型指定另一个连接，应当在模型上定义 `$connection` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型应当使用的数据库连接。
     *
     * @var string
     */
    protected $connection = 'mysql';
}
```

<a name="default-attribute-values"></a>
### 默认属性值

默认情况下，一个新实例化的模型实例不包含任何属性值。如果你想为模型的某些属性定义默认值，可以在模型上定义 `$attributes` 属性。放在 `$attributes` 数组中的属性值应当是其原始的、"可存储"的格式，就像刚从数据库中读出来一样：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型属性的默认值。
     *
     * @var array
     */
    protected $attributes = [
        'options' => '[]',
        'delayed' => false,
    ];
}
```

<a name="configuring-eloquent-strictness"></a>
### 配置 Eloquent 严格模式

Laravel 提供了若干方法，让你可以在各种场景下配置 Eloquent 的行为与"严格程度"。

首先是 `preventLazyLoading` 方法，它接受一个可选的布尔参数，用于指示是否应当阻止懒加载。例如，你可能希望只在非生产环境中禁用懒加载，这样即使生产代码中意外出现了懒加载关联，生产环境也能继续正常运行。通常应在应用 `AppServiceProvider` 的 `boot` 方法中调用该方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，你还可以通过调用 `preventSilentlyDiscardingAttributes` 方法，让 Laravel 在尝试填充不可填充的属性时抛出异常。在本地开发时尝试设置一个尚未加入模型 `fillable` 数组的属性，这有助于避免出现意料之外的错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

<a name="retrieving-models"></a>
## 检索模型

创建好模型以及[与之关联的数据库表](/docs/{{version}}/migrations#generating-migrations)之后，就可以开始从数据库中获取数据了。你可以把每个 Eloquent 模型都看作一个强大的[查询构造器](/docs/{{version}}/queries)，让你能够流畅地查询与该模型关联的数据库表。模型的 `all` 方法会检索出模型关联数据库表中的全部记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

<a name="building-queries"></a>
#### 构建查询

Eloquent 的 `all` 方法会返回模型表中的全部结果。不过，由于每个 Eloquent 模型本身就是一个[查询构造器](/docs/{{version}}/queries)，你可以为查询添加额外的约束，然后调用 `get` 方法获取结果：

```php
$flights = Flight::where('active', 1)
    ->orderBy('name')
    ->take(10)
    ->get();
```

> [!NOTE]
> 由于 Eloquent 模型同时也是查询构造器，你应当通读 Laravel [查询构造器](/docs/{{version}}/queries)提供的所有方法。编写 Eloquent 查询时，这些方法你都可以使用。

<a name="refreshing-models"></a>
#### 刷新模型

如果你已经有一个从数据库中检索出来的 Eloquent 模型实例，可以使用 `fresh` 与 `refresh` 方法"刷新"该模型。`fresh` 方法会重新从数据库中检索该模型，已有的模型实例不受影响：

```php
$flight = Flight::where('number', 'FR 900')->first();

$freshFlight = $flight->fresh();
```

`refresh` 方法会使用数据库中的最新数据重新填充已有的模型。此外，它已加载的所有关联关系也会被一并刷新：

```php
$flight = Flight::where('number', 'FR 900')->first();

$flight->number = 'FR 456';

$flight->refresh();

$flight->number; // "FR 900"
```

<a name="collections"></a>
### 集合

正如我们所看到的，`all` 与 `get` 这类 Eloquent 方法会从数据库中检索多条记录。不过，这些方法返回的并不是普通的 PHP 数组，而是一个 `Illuminate\Database\Eloquent\Collection` 实例。

Eloquent 的 `Collection` 类继承了 Laravel 的基础 `Illuminate\Support\Collection` 类，后者提供了[多种实用方法](/docs/{{version}}/collections#available-methods)用于处理数据集合。例如，可以使用 `reject` 方法，根据被调用闭包的结果把模型从集合中移除：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法之外，Eloquent 集合类还提供了[一些额外方法](/docs/{{version}}/eloquent-collections#available-methods)，专门用于与 Eloquent 模型集合交互。

由于 Laravel 的所有集合都实现了 PHP 的可迭代接口，你可以像遍历数组一样遍历集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

<a name="chunking-results"></a>
### 分块结果

如果你尝试通过 `all` 或 `get` 方法加载数万条 Eloquent 记录，应用可能会耗尽内存。此时可以改用 `chunk` 方法，它能更高效地处理大量模型。

`chunk` 方法会检索 Eloquent 模型的一个子集，并把它们传给一个闭包进行处理。由于一次只检索当前这一块 Eloquent 模型，因此在处理大量模型时，`chunk` 方法能显著降低内存占用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传给 `chunk` 方法的第一个参数是你希望每一"块"接收的记录数。作为第二个参数传入的闭包，会在每检索出一块数据时被调用一次。每检索出一块记录，都会执行一次数据库查询并把它传给闭包。

如果你要根据某一列筛选 `chunk` 方法的结果，同时在遍历结果时又要更新该列，就应当使用 `chunkById` 方法。在这类场景中使用 `chunk` 方法可能会导致意外且不一致的结果。`chunkById` 方法在内部总是检索 `id` 列大于上一块最后一个模型的记录：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, column: 'id');
```

由于 `chunkById` 与 `lazyById` 方法会向正在执行的查询添加它们自己的 "where" 条件，你通常应当在一个闭包中对自己的条件进行[逻辑分组](/docs/{{version}}/queries#logical-grouping)：

```php
Flight::where(function ($query) {
    $query->where('delayed', true)->orWhere('cancelled', true);
})->chunkById(200, function (Collection $flights) {
    $flights->each->update([
        'departed' => false,
        'cancelled' => true
    ]);
}, column: 'id');
```

<a name="chunking-using-lazy-collections"></a>
### 使用惰性集合分块

`lazy` 方法的工作方式与 [`chunk` 方法](#chunking-results)类似，本质上都是在幕后分块执行查询。不同的是，`lazy` 方法并非把每一块原样直接传给回调，而是返回一个展平后的 Eloquent 模型 [`LazyCollection`](/docs/{{version}}/collections#lazy-collections)，让你能够像处理单一数据流一样与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果你要根据某一列筛选 `lazy` 方法的结果，同时在遍历结果时又要更新该列，就应当使用 `lazyById` 方法。`lazyById` 方法在内部总是检索 `id` 列大于上一块最后一个模型的记录：

```php
Flight::where('departed', true)
    ->lazyById(200, column: 'id')
    ->each->update(['departed' => false]);
```

你可以使用 `lazyByIdDesc` 方法，根据 `id` 的降序来筛选结果。

<a name="cursors"></a>
### 游标

与 `lazy` 方法类似，`cursor` 方法也可以在遍历数万条 Eloquent 模型记录时显著降低应用的内存消耗。

`cursor` 方法只会执行一次数据库查询；不过，各个 Eloquent 模型要等到真正被遍历到时才会被填充。因此，在遍历游标期间，内存中任意时刻都只保留一个 Eloquent 模型。

> [!WARNING]
> 由于 `cursor` 方法在任意时刻只把一个 Eloquent 模型保留在内存中，它无法预加载关联关系。如果你需要预加载关联关系，请考虑改用 [`lazy` 方法](#chunking-using-lazy-collections)。

在内部，`cursor` 方法使用 PHP [生成器](https://www.php.net/manual/en/language.generators.overview.php)来实现这一功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 返回一个 `Illuminate\Support\LazyCollection` 实例。[惰性集合](/docs/{{version}}/collections#lazy-collections)让你可以使用典型 Laravel 集合上的多数集合方法，同时一次只把一个模型加载到内存中：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

虽然 `cursor` 方法比常规查询占用的内存少得多（因为一次只在内存中保留一个 Eloquent 模型），但它最终仍可能耗尽内存。这是[因为 PHP 的 PDO 驱动会在内部把所有原始查询结果缓存在其缓冲区中](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果你要处理数量极其庞大的 Eloquent 记录，请考虑改用 [`lazy` 方法](#chunking-using-lazy-collections)。

<a name="advanced-subqueries"></a>
### 高级子查询

<a name="subquery-selects"></a>
#### 子查询 Select

Eloquent 还提供了高级子查询支持，让你可以在单次查询中从关联表中提取信息。例如，假设我们有一张航班 `destinations`（目的地）表和一张飞往各目的地的 `flights`（航班）表。`flights` 表中有一个 `arrived_at` 列，表示航班抵达目的地的时间。

借助查询构造器 `select` 与 `addSelect` 方法提供的子查询功能，我们可以用一次查询选出所有 `destinations`，以及最近抵达该目的地的航班名称：

```php
use App\Models\Destination;
use App\Models\Flight;

return Destination::addSelect(['last_flight' => Flight::select('name')
    ->whereColumn('destination_id', 'destinations.id')
    ->orderByDesc('arrived_at')
    ->limit(1)
])->get();
```

<a name="subquery-ordering"></a>
#### 子查询排序

此外，查询构造器的 `orderBy` 函数也支持子查询。继续沿用上面的航班示例，我们可以用这一功能按最近一次航班抵达的时间对所有目的地进行排序。同样，这也可以在一次数据库查询中完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

<a name="retrieving-single-models"></a>
## 检索单个模型 / 聚合值

除了检索匹配给定查询的全部记录之外，你还可以使用 `find`、`first` 或 `firstWhere` 方法检索单条记录。这些方法返回的是单个模型实例，而不是模型集合：

```php
use App\Models\Flight;

// 按主键检索模型...
$flight = Flight::find(1);

// 检索符合查询约束的第一个模型...
$flight = Flight::where('active', 1)->first();

// 检索符合查询约束的第一个模型的替代写法...
$flight = Flight::firstWhere('active', 1);
```

有时你可能希望在找不到结果时执行其他操作。`findOr` 与 `firstOr` 方法会返回一个模型实例；如果找不到结果，就执行给定的闭包。闭包返回的值会被视为该方法的返回结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

<a name="not-found-exceptions"></a>
#### 找不到时抛出异常

有时你可能希望在找不到模型时抛出异常。这在路由或控制器中尤其有用。`findOrFail` 与 `firstOrFail` 方法会检索查询的第一个结果；不过，如果找不到结果，就会抛出 `Illuminate\Database\Eloquent\ModelNotFoundException`：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果 `ModelNotFoundException` 没有被捕获，就会自动向客户端返回一个 404 HTTP 响应：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

<a name="retrieving-or-creating-models"></a>
### 检索或创建模型

`firstOrCreate` 方法会尝试使用给定的列 / 值对定位一条数据库记录。如果在数据库中找不到该模型，就会插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并而成。

`firstOrNew` 方法与 `firstOrCreate` 类似，也会尝试在数据库中定位匹配给定属性的记录。不过，如果找不到模型，它会返回一个新的模型实例。请注意，`firstOrNew` 返回的模型尚未持久化到数据库中，你需要手动调用 `save` 方法来持久化它：

```php
use App\Models\Flight;

// 按名称检索航班，如果不存在则创建它...
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或用 name、delayed、arrival_time 属性创建它...
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// 按名称检索航班，或实例化一个新的 Flight 实例...
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或用 name、delayed、arrival_time 属性实例化...
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

<a name="retrieving-aggregates"></a>
### 检索聚合值

与 Eloquent 模型交互时，你还可以使用 Laravel [查询构造器](/docs/{{version}}/queries)提供的 `count`、`sum`、`max` 以及其他[聚合方法](/docs/{{version}}/queries#aggregates)。正如你可能预料到的，这些方法返回的是标量值，而不是 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

<a name="inserting-and-updating-models"></a>
## 插入与更新模型

<a name="inserts"></a>
### 插入

当然，使用 Eloquent 时，我们不仅需要从数据库中检索模型，还需要插入新记录。好在 Eloquent 让这件事很简单。要向数据库插入一条新记录，你应当实例化一个新的模型实例，并为模型设置属性。然后，调用该模型实例的 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 把一个新的航班存储到数据库中。
     */
    public function store(Request $request): RedirectResponse
    {
        // 验证请求...

        $flight = new Flight;

        $flight->name = $request->name;

        $flight->save();

        return redirect('/flights');
    }
}
```

在本例中，我们把传入 HTTP 请求的 `name` 字段赋给 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，就会向数据库插入一条记录。调用 `save` 方法时，模型的 `created_at` 与 `updated_at` 时间戳会自动设置，因此无需手动设置它们。

或者，你也可以使用 `create` 方法，用一条 PHP 语句"保存"一个新模型。`create` 方法会把插入后的模型实例返回给你：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护，免受批量赋值漏洞的影响。要了解更多关于批量赋值的内容，请查阅[批量赋值文档](#mass-assignment)。

<a name="updates"></a>
### 更新

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，你应当先检索它，然后设置你希望更新的任意属性。之后，再调用模型的 `save` 方法。同样，`updated_at` 时间戳会自动更新，因此无需手动设置它的值：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->name = 'Paris to London';

$flight->save();
```

有时你可能需要更新一个已存在的模型，或者在不存在匹配模型时创建一个新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在一个 `departure` 为 `Oakland`、`destination` 为 `San Diego` 的航班，它的 `price` 与 `discounted` 列就会被更新。如果不存在这样的航班，就会创建一个新航班，其属性由第一个参数数组与第二个参数数组合并而成：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

<a name="mass-updates"></a>
#### 批量更新

更新操作也可以针对匹配给定查询的模型执行。在下面的示例中，所有 `active` 且 `destination` 为 `San Diego` 的航班都会被标记为延误：

```php
Flight::where('active', 1)
    ->where('destination', 'San Diego')
    ->update(['delayed' => 1]);
```

`update` 方法接受一个由列与值组成的数组，表示应当被更新的列。该方法返回受影响的行数。

> [!WARNING]
> 通过 Eloquent 执行批量更新时，被更新的模型不会触发 `saving`、`saved`、`updating` 与 `updated` 模型事件。这是因为执行批量更新时，模型从未被真正检索出来。

<a name="examining-attribute-changes"></a>
#### 检查属性变更

Eloquent 提供了 `isDirty`、`isClean` 与 `wasChanged` 方法，用于检查模型的内部状态，并判断其属性自最初检索以来发生了怎样的变化。

`isDirty` 方法用于判断模型的任意属性自检索以来是否发生了变化。你可以向 `isDirty` 方法传入一个具体的属性名或一组属性，以判断这些属性中是否有"脏"值。`isClean` 方法用于判断某个属性自模型检索以来是否保持不变。该方法同样接受一个可选的属性参数：

```php
use App\Models\User;

$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->isDirty(); // true
$user->isDirty('title'); // true
$user->isDirty('first_name'); // false
$user->isDirty(['first_name', 'title']); // true

$user->isClean(); // false
$user->isClean('title'); // false
$user->isClean('first_name'); // true
$user->isClean(['first_name', 'title']); // false

$user->save();

$user->isDirty(); // false
$user->isClean(); // true
```

`wasChanged` 方法用于判断在当前请求周期内，模型最后一次保存时是否有任意属性发生了变化。如有需要，你可以传入一个属性名，查看某个特定属性是否被更改过：

```php
$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->save();

$user->wasChanged(); // true
$user->wasChanged('title'); // true
$user->wasChanged(['title', 'slug']); // true
$user->wasChanged('first_name'); // false
$user->wasChanged(['first_name', 'title']); // true
```

`getOriginal` 方法返回一个包含模型原始属性的数组，不受模型自检索以来任何改动的影响。如有需要，你可以传入一个具体的属性名，获取某个特定属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = "Jack";
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // 原始属性数组...
```

<a name="mass-assignment"></a>
### 批量赋值

你可以使用 `create` 方法，用一条 PHP 语句"保存"一个新模型。该方法会把插入后的模型实例返回给你：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护，免受批量赋值漏洞的影响。

批量赋值漏洞指的是：用户传入了一个意料之外的 HTTP 请求字段，而该字段更改了你未曾预期的数据库列。例如，某个恶意用户可能通过 HTTP 请求发送一个 `is_admin` 参数，该参数随后被传给模型的 `create` 方法，从而让用户把自己提升为管理员。

因此，第一步你应当定义哪些模型属性允许批量赋值。你可以使用模型上的 `$fillable` 属性来完成这件事。例如，让我们把 `Flight` 模型的 `name` 属性设为可批量赋值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 可以被批量赋值的属性。
     *
     * @var array<int, string>
     */
    protected $fillable = ['name'];
}
```

指定好哪些属性可批量赋值之后，你就可以使用 `create` 方法向数据库插入一条新记录。`create` 方法会返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果你已经有了一个模型实例，可以使用 `fill` 方法用一组属性填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

<a name="mass-assignment-json-columns"></a>
#### 批量赋值与 JSON 列

赋值 JSON 列时，每一列可批量赋值的键都必须在模型的 `$fillable` 数组中指定。出于安全考虑，使用 `guarded` 属性时，Laravel 不支持更新嵌套的 JSON 属性：

```php
/**
 * 可以被批量赋值的属性。
 *
 * @var array<int, string>
 */
protected $fillable = [
    'options->enabled',
];
```

<a name="allowing-mass-assignment"></a>
#### 允许批量赋值

如果你想让所有属性都可以批量赋值，可以把模型的 `$guarded` 属性定义为一个空数组。如果你选择解除模型的保护，就应当格外小心，始终手工构造传给 Eloquent `fill`、`create` 与 `update` 方法的数组：

```php
/**
 * 不可以被批量赋值的属性。
 *
 * @var array<string>|bool
 */
protected $guarded = [];
```

<a name="mass-assignment-exceptions"></a>
#### 批量赋值异常

默认情况下，执行批量赋值操作时，未包含在 `$fillable` 数组中的属性会被静默丢弃。在生产环境中这是预期行为；不过在本地开发时，这可能会让人困惑，不明白为什么模型的改动没有生效。

如果愿意，你可以通过调用 `preventSilentlyDiscardingAttributes` 方法，让 Laravel 在尝试填充不可填充的属性时抛出异常。通常应在应用 `AppServiceProvider` 类的 `boot` 方法中调用该方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

<a name="upserts"></a>
### Upsert

Eloquent 的 `upsert` 方法可以在一次原子操作中更新或创建记录。该方法的第一个参数是要插入或更新的值，第二个参数列出在关联表中唯一标识记录的列。该方法的第三个也是最后一个参数是一个列数组，表示当数据库中已存在匹配记录时应当更新哪些列。如果模型启用了时间戳，`upsert` 方法会自动设置 `created_at` 与 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]
> 除 SQL Server 之外，所有数据库都要求 `upsert` 方法第二个参数中的列具备 "primary" 或 "unique" 索引。此外，MariaDB 与 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，始终使用表的 "primary" 与 "unique" 索引来检测已存在的记录。

<a name="deleting-models"></a>
## 删除模型

要删除模型，可以在模型实例上调用 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

<a name="deleting-an-existing-model-by-its-primary-key"></a>
#### 按主键删除已存在的模型

在上面的示例中，我们在调用 `delete` 方法之前先从数据库中检索出了模型。不过，如果你知道模型的主键，就可以调用 `destroy` 方法，在不显式检索的情况下删除模型。除了接受单个主键之外，`destroy` 方法还接受多个主键、主键数组或主键[集合](/docs/{{version}}/collections)：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

如果你正在使用[软删除模型](#soft-deleting)，可以通过 `forceDestroy` 方法永久删除模型：

```php
Flight::forceDestroy(1);
```

> [!WARNING]
> `destroy` 方法会逐个加载每个模型并调用 `delete` 方法，以便为每个模型正确分发 `deleting` 与 `deleted` 事件。

<a name="deleting-models-using-queries"></a>
#### 使用查询删除模型

当然，你也可以构建一个 Eloquent 查询，删除所有匹配查询条件的模型。在下面的示例中，我们会删除所有标记为未激活的航班。与批量更新一样，批量删除不会为被删除的模型分发模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

要删除表中的所有模型，你应当执行一个不带任何条件的查询：

```php
$deleted = Flight::query()->delete();
```

> [!WARNING]
> 通过 Eloquent 执行批量删除语句时，被删除的模型不会触发 `deleting` 与 `deleted` 模型事件。这是因为执行删除语句时，模型从未被真正检索出来。

<a name="soft-deleting"></a>
### 软删除

除了真正从数据库中移除记录之外，Eloquent 还可以"软删除"模型。模型被软删除时，并不会真正从数据库中移除。相反，模型上会设置一个 `deleted_at` 属性，表示该模型被"删除"的日期与时间。要为模型启用软删除，请把 `Illuminate\Database\Eloquent\SoftDeletes` Trait 添加到模型上：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Flight extends Model
{
    use SoftDeletes;
}
```

> [!NOTE]
> `SoftDeletes` Trait 会自动把 `deleted_at` 属性转换为 `DateTime` / `Carbon` 实例。

你还应当把 `deleted_at` 列添加到数据库表中。Laravel 的[结构生成器](/docs/{{version}}/migrations)包含一个用于创建该列的辅助方法：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('flights', function (Blueprint $table) {
    $table->softDeletes();
});

Schema::table('flights', function (Blueprint $table) {
    $table->dropSoftDeletes();
});
```

现在，当你在模型上调用 `delete` 方法时，`deleted_at` 列会被设置为当前日期与时间。不过，模型的数据库记录仍会留在表中。查询使用软删除的模型时，被软删除的模型会自动从所有查询结果中排除。

要判断某个模型实例是否已被软删除，可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

<a name="restoring-soft-deleted-models"></a>
#### 恢复软删除的模型

有时你可能希望"撤销删除"一个已被软删除的模型。要恢复软删除的模型，可以在模型实例上调用 `restore` 方法。`restore` 方法会把模型的 `deleted_at` 列设为 `null`：

```php
$flight->restore();
```

你也可以在查询中使用 `restore` 方法来恢复多个模型。同样，与其他"批量"操作一样，这不会为被恢复的模型分发任何模型事件：

```php
Flight::withTrashed()
        ->where('airline_id', 1)
        ->restore();
```

在构建[关联](/docs/{{version}}/eloquent-relationships)查询时，也可以使用 `restore` 方法：

```php
$flight->history()->restore();
```

<a name="permanently-deleting-models"></a>
#### 永久删除模型

有时你可能需要真正地从数据库中移除某个模型。你可以使用 `forceDelete` 方法，把软删除的模型从数据库表中永久移除：

```php
$flight->forceDelete();
```

在构建 Eloquent 关联查询时，也可以使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

<a name="querying-soft-deleted-models"></a>
### 查询软删除的模型

<a name="including-soft-deleted-models"></a>
#### 包含软删除的模型

如上所述，被软删除的模型会自动从查询结果中排除。不过，你可以在查询上调用 `withTrashed` 方法，强制让软删除的模型也出现在查询结果中：

```php
use App\Models\Flight;

$flights = Flight::withTrashed()
    ->where('account_id', 1)
    ->get();
```

在构建[关联](/docs/{{version}}/eloquent-relationships)查询时，也可以调用 `withTrashed` 方法：

```php
$flight->history()->withTrashed()->get();
```

<a name="retrieving-only-soft-deleted-models"></a>
#### 只检索软删除的模型

`onlyTrashed` 方法**只**检索已被软删除的模型：

```php
$flights = Flight::onlyTrashed()
    ->where('airline_id', 1)
    ->get();
```

<a name="pruning-models"></a>
## 模型裁剪

有时你可能希望定期删除不再需要的模型。为此，你可以把 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` Trait 添加到希望定期裁剪的模型上。把其中一个 Trait 添加到模型之后，再实现一个 `prunable` 方法，该方法返回一个 Eloquent 查询构造器，用于解析出不再需要的模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class Flight extends Model
{
    use Prunable;

    /**
     * 获取可裁剪模型的查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subMonth());
    }
}
```

把模型标记为 `Prunable` 时，你也可以在模型上定义一个 `pruning` 方法。该方法会在模型被删除之前调用。在模型被从数据库永久移除之前，该方法可用于删除与该模型关联的任何附加资源，例如已存储的文件：

```php
/**
 * 为模型裁剪做准备。
 */
protected function pruning(): void
{
    // ...
}
```

配置好可裁剪模型之后，你应当在应用的 `routes/console.php` 文件中调度 `model:prune` Artisan 命令。你可以自行选择运行该命令的合适间隔：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在幕后，`model:prune` 命令会自动检测应用 `app/Models` 目录中的 "Prunable" 模型。如果你的模型位于其他位置，可以使用 `--model` 选项指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你希望在裁剪所有其他已检测到的模型时排除某些模型，可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以通过执行带 `--pretend` 选项的 `model:prune` 命令来测试自己的 `prunable` 查询。预演时，`model:prune` 命令只会报告：如果该命令真正运行，会有多少条记录被裁剪。

```shell
php artisan model:prune --pretend
```

> [!WARNING]
> 匹配裁剪查询的软删除模型会被永久删除（`forceDelete`）。

<a name="mass-pruning"></a>
#### 批量裁剪

当模型被标记上 `Illuminate\Database\Eloquent\MassPrunable` Trait 时，模型会通过批量删除查询从数据库中删除。因此，`pruning` 方法不会被调用，`deleting` 与 `deleted` 模型事件也不会被分发。这是因为模型在删除前从未被真正检索出来，从而使裁剪过程更加高效：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\MassPrunable;

class Flight extends Model
{
    use MassPrunable;

    /**
     * 获取可裁剪模型的查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subMonth());
    }
}
```

<a name="replicating-models"></a>
## 复制模型

你可以使用 `replicate` 方法创建一个已有模型实例的未保存副本。当你拥有多个共享大量相同属性的模型实例时，该方法尤其有用：

```php
use App\Models\Address;

$shipping = Address::create([
    'type' => 'shipping',
    'line_1' => '123 Example Street',
    'city' => 'Victorville',
    'state' => 'CA',
    'postcode' => '90001',
]);

$billing = $shipping->replicate()->fill([
    'type' => 'billing'
]);

$billing->save();
```

要排除一个或多个属性，使其不被复制到新模型中，可以向 `replicate` 方法传入一个数组：

```php
$flight = Flight::create([
    'destination' => 'LAX',
    'origin' => 'LHR',
    'last_flown' => '2020-03-04 11:00:00',
    'last_pilot_id' => 747,
]);

$flight = $flight->replicate([
    'last_flown',
    'last_pilot_id'
]);
```

<a name="query-scopes"></a>
## 查询作用域

<a name="global-scopes"></a>
### 全局作用域

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自身的[软删除](#soft-deleting)功能就利用全局作用域，只从数据库中检索"未删除"的模型。编写自己的全局作用域可以提供一种便捷、简单的方式，确保针对某个模型的每一次查询都会应用特定约束。

<a name="generating-scopes"></a>
#### 生成作用域

要生成一个新的全局作用域，可以调用 `make:scope` Artisan 命令，它会把生成的作用域放置在应用的 `app/Models/Scopes` 目录中：

```shell
php artisan make:scope AncientScope
```

<a name="writing-global-scopes"></a>
#### 编写全局作用域

编写全局作用域很简单。首先，使用 `make:scope` 命令生成一个实现 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其他类型的子句：

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    /**
     * 把作用域应用到给定的 Eloquent 查询构造器。
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->subYears(2000));
    }
}
```

> [!NOTE]
> 如果你的全局作用域要向查询的 select 子句中添加列，应当使用 `addSelect` 方法而不是 `select`。这样可以避免无意中替换掉查询已有的 select 子句。

<a name="applying-global-scopes"></a>
#### 应用全局作用域

要为模型指定一个全局作用域，只需把 `ScopedBy` 属性放在模型上：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;

#[ScopedBy([AncientScope::class])]
class User extends Model
{
    //
}
```

或者，你也可以覆盖模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法，手动注册全局作用域。`addGlobalScope` 方法接受你的作用域实例作为唯一参数：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new AncientScope);
    }
}
```

把上面示例中的作用域添加到 `App\Models\User` 模型之后，调用 `User::all()` 方法将执行如下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

<a name="anonymous-global-scopes"></a>
#### 匿名全局作用域

Eloquent 还允许你使用闭包定义全局作用域，这对于简单到不值得单独建一个类的作用域尤其有用。使用闭包定义全局作用域时，你应当把自己选定的作用域名称作为第一个参数传给 `addGlobalScope` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope('ancient', function (Builder $builder) {
            $builder->where('created_at', '<', now()->subYears(2000));
        });
    }
}
```

<a name="removing-global-scopes"></a>
#### 移除全局作用域

如果你想在某个查询中移除一个全局作用域，可以使用 `withoutGlobalScope` 方法。该方法接受全局作用域的类名作为唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果你是用闭包定义的全局作用域，就应当传入你为该全局作用域指定的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你想移除查询中的多个甚至全部全局作用域，可以使用 `withoutGlobalScopes` 方法：

```php
// 移除所有全局作用域...
User::withoutGlobalScopes()->get();

// 移除部分全局作用域...
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();
```

<a name="local-scopes"></a>
### 局部作用域

局部作用域允许你定义一组常用的查询约束，以便在应用中轻松复用。例如，你可能需要频繁地检索所有被视为"热门"的用户。要定义作用域，请给 Eloquent 模型的方法加上 `scope` 前缀。

作用域应当始终返回同一个查询构造器实例或 `void`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 把查询限定为只包含热门用户。
     */
    public function scopePopular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * 把查询限定为只包含活跃用户。
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

<a name="utilizing-a-local-scope"></a>
#### 使用局部作用域

定义好作用域之后，你就可以在查询模型时调用这些作用域方法。不过，调用方法时不应当包含 `scope` 前缀。你甚至可以链式调用多个作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

通过 `or` 查询运算符组合多个 Eloquent 模型作用域时，可能需要使用闭包来实现正确的[逻辑分组](/docs/{{version}}/queries#logical-grouping)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

不过，由于这样写比较繁琐，Laravel 提供了一个"高阶"`orWhere` 方法，让你无需使用闭包就能流畅地链式串联多个作用域：

```php
$users = User::popular()->orWhere->active()->get();
```

<a name="dynamic-scopes"></a>
#### 动态作用域

有时你可能希望定义一个接受参数的作用域。要开始，只需在作用域方法的签名中添加额外的参数即可。作用域参数应当定义在 `$query` 参数之后：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 把查询限定为只包含给定类型的用户。
     */
    public function scopeOfType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

把期望的参数添加到作用域方法签名之后，你就可以在调用该作用域时传入这些参数：

```php
$users = User::ofType('admin')->get();
```

<a name="pending-attributes"></a>
### 待定属性

如果你希望使用作用域来创建具备与作用域约束条件相同属性的模型，可以在构建作用域查询时使用 `withAttributes` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 把查询限定为只包含草稿。
     */
    public function scopeDraft(Builder $query): void
    {
        $query->withAttributes([
            'hidden' => true,
        ]);
    }
}
```

`withAttributes` 方法会使用给定的属性为查询添加 `where` 子句约束，同时也会把这些给定属性添加到通过该作用域创建的任何模型上：

```php
$draft = Post::draft()->create(['title' => 'In Progress']);

$draft->hidden; // true
```

<a name="comparing-models"></a>
## 比较模型

有时你可能需要判断两个模型是否"相同"。`is` 与 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、数据表与数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
```

在使用 `belongsTo`、`hasOne`、`morphTo` 与 `morphOne` [关联](/docs/{{version}}/eloquent-relationships)时，也可以使用 `is` 与 `isNot` 方法。当你希望在无需发起查询去检索某个关联模型的情况下比较它时，该方法尤其有用：

```php
if ($post->author()->is($user)) {
    // ...
}
```

<a name="events"></a>
## 事件

> [!NOTE]
> 想把 Eloquent 事件直接广播到你的客户端应用？请查看 Laravel 的[模型事件广播](/docs/{{version}}/broadcasting#model-broadcasting)。

Eloquent 模型会分发多个事件，让你可以介入模型生命周期中的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 与 `replicating`。

当从数据库中检索出一个已存在的模型时，会分发 `retrieved` 事件。当新模型首次被保存时，会分发 `creating` 与 `created` 事件。当已存在的模型被修改并调用 `save` 方法时，会分发 `updating` / `updated` 事件。当模型被创建或更新时——即使模型的属性没有发生变化——也会分发 `saving` / `saved` 事件。以 `-ing` 结尾的事件名在模型的任何更改被持久化之前分发，而以 `-ed` 结尾的事件则在模型更改被持久化之后分发。

要开始监听模型事件，请在 Eloquent 模型上定义 `$dispatchesEvents` 属性。该属性把 Eloquent 模型生命周期的各个节点映射到你自己的[事件类](/docs/{{version}}/events)。每个模型事件类都应当通过构造函数接收受影响的模型实例：

```php
<?php

namespace App\Models;

use App\Events\UserDeleted;
use App\Events\UserSaved;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 模型的事件映射。
     *
     * @var array<string, string>
     */
    protected $dispatchesEvents = [
        'saved' => UserSaved::class,
        'deleted' => UserDeleted::class,
    ];
}
```

定义并映射好 Eloquent 事件之后，你就可以使用[事件监听器](/docs/{{version}}/events#defining-listeners)来处理这些事件。

> [!WARNING]
> 通过 Eloquent 执行批量更新或删除查询时，受影响的模型不会触发 `saved`、`updated`、`deleting` 与 `deleted` 模型事件。这是因为执行批量更新或删除时，模型从未被真正检索出来。

<a name="events-using-closures"></a>
### 使用闭包

除了使用自定义事件类，你也可以注册闭包，让它们在各种模型事件被分发时执行。通常应当在模型的 `booted` 方法中注册这些闭包：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // ...
        });
    }
}
```

如有需要，注册模型事件时你可以使用[可入队的匿名事件监听器](/docs/{{version}}/events#queuable-anonymous-event-listeners)。这会指示 Laravel 使用应用的[队列](/docs/{{version}}/queues)在后台执行该模型事件监听器：

```php
use function Illuminate\Events\queueable;

static::created(queueable(function (User $user) {
    // ...
}));
```

<a name="observers"></a>
### 观察者

<a name="defining-observers"></a>
#### 定义观察者

如果你要在某个模型上监听许多事件，可以使用观察者把所有监听器归拢到一个类中。观察者类的方法名反映了你希望监听的 Eloquent 事件。这些方法都只接收受影响的模型作为唯一参数。`make:observer` Artisan 命令是创建观察者类最简单的方式：

```shell
php artisan make:observer UserObserver --model=User
```

该命令会把新的观察者放置在你的 `app/Observers` 目录中。如果该目录不存在，Artisan 会为你创建。新生成的观察者如下所示：

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "updated" 事件。
     */
    public function updated(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "deleted" 事件。
     */
    public function deleted(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "restored" 事件。
     */
    public function restored(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "forceDeleted" 事件。
     */
    public function forceDeleted(User $user): void
    {
        // ...
    }
}
```

要注册观察者，可以把 `ObservedBy` 属性放在相应的模型上：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，你也可以通过在希望观察的模型上调用 `observe` 方法来手动注册观察者。你可以在应用 `AppServiceProvider` 类的 `boot` 方法中注册观察者：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

> [!NOTE]
> 观察者还可以监听其他事件，例如 `saving` 与 `retrieved`。这些事件在[事件](#events)文档中有说明。

<a name="observers-and-database-transactions"></a>
#### 观察者与数据库事务

当模型在数据库事务中被创建时，你可能希望指示某个观察者只在数据库事务提交之后才执行其事件处理器。为此，可以让你的观察者实现 `ShouldHandleEventsAfterCommit` 接口。如果没有正在进行中的数据库事务，事件处理器会立即执行：

```php
<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }
}
```

<a name="muting-events"></a>
### 静默事件

有时你可能需要临时"静默"模型触发的所有事件。你可以使用 `withoutEvents` 方法实现这一点。`withoutEvents` 方法接受一个闭包作为唯一参数。在该闭包中执行的任何代码都不会分发模型事件，而闭包返回的任何值都会由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

<a name="saving-a-single-model-without-events"></a>
#### 静默保存单个模型

有时你可能希望"保存"某个给定的模型而不分发任何事件。你可以使用 `saveQuietly` 方法实现这一点：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你也可以在不分发任何事件的情况下"更新"、"删除"、"软删除"、"恢复"与"复制"某个给定的模型：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```