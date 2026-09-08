# Eloquent：入门

- [Introduction](#introduction)
- [Generating Model Classes](#generating-model-classes)
- [Eloquent Model Conventions](#eloquent-model-conventions)
    - [Table Names](#table-names)
    - [Primary Keys](#primary-keys)
    - [UUID and ULID Keys](#uuid-and-ulid-keys)
    - [Timestamps](#timestamps)
    - [Database Connections](#database-connections)
    - [Default Attribute Values](#default-attribute-values)
    - [Configuring Eloquent Strictness](#configuring-eloquent-strictness)
- [Retrieving Models](#retrieving-models)
    - [Collections](#collections)
    - [Chunking Results](#chunking-results)
    - [Chunking Using Lazy Collections](#chunking-using-lazy-collections)
    - [Cursors](#cursors)
    - [Advanced Subqueries](#advanced-subqueries)
- [Retrieving Single Models / Aggregates](#retrieving-single-models)
    - [Retrieving or Creating Models](#retrieving-or-creating-models)
    - [Retrieving Aggregates](#retrieving-aggregates)
- [Inserting and Updating Models](#inserting-and-updating-models)
    - [Inserts](#inserts)
    - [Updates](#updates)
    - [Mass Assignment](#mass-assignment)
    - [Upserts](#upserts)
- [Deleting Models](#deleting-models)
    - [Soft Deleting](#soft-deleting)
    - [Querying Soft Deleted Models](#querying-soft-deleted-models)
- [Pruning Models](#pruning-models)
- [Replicating Models](#replicating-models)
- [Query Scopes](#query-scopes)
    - [Global Scopes](#global-scopes)
    - [Local Scopes](#local-scopes)
    - [Pending Attributes](#pending-attributes)
- [Comparing Models](#comparing-models)
- [Events](#events)
    - [Using Closures](#events-using-closures)
    - [Observers](#observers)
    - [Muting Events](#muting-events)

<a name="introduction"></a>
## Introduction

Laravel 内置了 Eloquent，一个对象关系映射器（ORM），让你与数据库交互变得愉悦。使用 Eloquent 时，每个数据库表都有一个对应的「模型（Model）」用来与该表交互。除了从数据库表中检索记录，Eloquent 模型还允许你向表中插入、更新和删除记录。

> [!NOTE]
> 在开始之前，请确保在应用的 `config/database.php` 配置文件中配置了数据库连接。要了解配置数据库的更多信息，请查阅 [数据库配置文档](/docs/{{version}}/database#configuration)。

<a name="generating-model-classes"></a>
## Generating Model Classes

开始之前，让我们先创建一个 Eloquent 模型。模型通常位于 `app/Models` 目录，并继承 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/docs/{{version}}/artisan) 来生成一个新的模型：

```shell
php artisan make:model Flight
```

如果你想在生成模型的同时生成 [数据库迁移](/docs/{{version}}/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

在生成模型时，你还可以生成各种其他类型的类，例如工厂（factory）、数据填充（seeder）、策略（policy）、控制器（controller）和表单请求（form request）。此外，这些选项可以组合使用，以一次性创建多个类：

```shell
# Generate a model and a FlightFactory class...
php artisan make:model Flight --factory
php artisan make:model Flight -f

# Generate a model and a FlightSeeder class...
php artisan make:model Flight --seed
php artisan make:model Flight -s

# Generate a model and a FlightController class...
php artisan make:model Flight --controller
php artisan make:model Flight -c

# Generate a model, FlightController resource class, and form request classes...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# Generate a model and a FlightPolicy class...
php artisan make:model Flight --policy

# Generate a model and a migration, factory, seeder, and controller...
php artisan make:model Flight -mfsc

# Shortcut to generate a model, migration, factory, seeder, policy, controller, and form requests...
php artisan make:model Flight --all
php artisan make:model Flight -a

# Generate a pivot model...
php artisan make:model Member --pivot
php artisan make:model Member -p
```

<a name="inspecting-models"></a>
#### Inspecting Models

有时仅仅浏览模型的代码很难确定它所有可用的属性和关联。此时可以试试 `model:show` Artisan 命令，它会方便地概览模型的所有属性和关系：

```shell
php artisan model:show Flight
```

<a name="eloquent-model-conventions"></a>
## Eloquent Model Conventions

由 `make:model` 命令生成的模型会被放置在 `app/Models` 目录。让我们检视一个基础的模型类，并讨论 Eloquent 的一些关键约定：

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
### Table Names

看完上面的示例，你可能已经注意到我们并没有告诉 Eloquent 哪个数据库表对应于我们的 `Flight` 模型。按照约定，除非显式指定了其他名称，否则类的「蛇形（snake case）」复数形式会被用作表名。因此，在本例中，Eloquent 会假定 `Flight` 模型将记录存储在 `flights` 表中，而 `AirTrafficController` 模型会将记录存储在 `air_traffic_controllers` 表中。

如果你的模型对应的数据库表不符合这个约定，可以使用 `Table` 属性手动指定模型的表名：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table('my_flights')]
class Flight extends Model
{
    // ...
}
```

<a name="primary-keys"></a>
### Primary Keys

Eloquent 还会假定每个模型对应的数据库表都有一个名为 `id` 的主键列。如有必要，可以使用 `Table` 属性上的 `key` 参数来指定作为模型主键的另一个列：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(key: 'flight_id')]
class Flight extends Model
{
    // ...
}
```

此外，Eloquent 假定主键是一个自增的整数值，这意味着 Eloquent 会自动将主键转换为整数。如果你想使用非自增或非数字的主键，应该在 `Table` 属性上指定 `keyType` 和 `incrementing` 参数：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(key: 'uuid', keyType: 'string', incrementing: false)]
class Flight extends Model
{
    // ...
}
```

如果你只需要禁用自增 ID，可以使用 `WithoutIncrementing` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Model;

#[WithoutIncrementing]
class Flight extends Model
{
    // ...
}
```

<a name="composite-primary-keys"></a>
#### "Composite" Primary Keys

Eloquent 要求每个模型至少有一个能充当其主键的唯一标识「ID」。Eloquent 模型不支持「复合」主键。不过，除了表的主键之外，你可以自由地为数据库表添加额外的多列唯一索引。

<a name="uuid-and-ulid-keys"></a>
### UUID and ULID Keys

除了使用自增整数作为 Eloquent 模型的主键，你也可以选择使用 UUID。UUID 是 36 个字符长的、全球唯一的字母数字标识符。

如果你想让模型使用 UUID 键而非自增整数键，可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` trait。当然，你应该确保模型拥有一个 [UUID 等价的主键列](/docs/{{version}}/migrations#column-method-uuid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUuids;

    // ...
}

$article = Article::create(['title' => 'Traveling to Europe']);

$article->id; // "018f2b5c-6a7f-7b12-9d6f-2f8a4e0c9c11"
```

默认情况下，`HasUuids` trait 会为你的模型生成 [UUIDv7](/docs/{{version}}/strings#method-str-uuid7) 标识符。这些 UUID 对于索引化的数据库存储更高效，因为它们可以按字典序排序。

你可以通过在模型上定义 `newUniqueId` 方法来覆盖给定模型的 UUID 生成过程。此外，你可以通过定义 `uniqueIds` 方法来指定哪些列应当接收 UUID：

```php
use Ramsey\Uuid\Uuid;

/**
 * Generate a new UUID for the model.
 */
public function newUniqueId(): string
{
    return (string) Uuid::uuid4();
}

/**
 * Get the columns that should receive a unique identifier.
 *
 * @return array<int, string>
 */
public function uniqueIds(): array
{
    return ['id', 'discount_code'];
}
```

如果你愿意，也可以选用「ULID」而非 UUID。ULID 与 UUID 类似，但长度只有 26 个字符。与有序 UUID 一样，ULID 可按字典序排序，便于高效的数据库索引。要使用 ULID，应该在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` trait。你还应该确保模型拥有一个 [ULID 等价的主键列](/docs/{{version}}/migrations#column-method-ulid)：

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
### Timestamps

默认情况下，Eloquent 期望模型对应的数据库表上存在 `created_at` 和 `updated_at` 列。模型被创建或更新时，Eloquent 会自动设置这些列的值。如果你不希望这些列被 Eloquent 自动管理，可以在模型 `Table` 属性上将 `timestamps` 设为 `false`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(timestamps: false)]
class Flight extends Model
{
    // ...
}
```

如果你只需要禁用时间戳，可以使用 `WithoutTimestamps` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;

#[WithoutTimestamps]
class Flight extends Model
{
    // ...
}
```

如果你需要自定义模型时间戳的格式，可以使用 `Table` 属性上的 `dateFormat` 参数。这决定了日期属性在数据库中的存储方式，以及模型被序列化为数组或 JSON 时的格式：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(dateFormat: 'U')]
class Flight extends Model
{
    // ...
}
```

如果你只需要定义日期格式，可以使用 `DateFormat` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\DateFormat;
use Illuminate\Database\Eloquent\Model;

#[DateFormat('U')]
class Flight extends Model
{
    // ...
}
```

如果你需要自定义用于存储时间戳的列名，可以在模型上定义 `CREATED_AT` 和 `UPDATED_AT` 常量：

```php
<?php

class Flight extends Model
{
    /**
     * The name of the "created at" column.
     *
     * @var string|null
     */
    public const CREATED_AT = 'creation_date';

    /**
     * The name of the "updated at" column.
     *
     * @var string|null
     */
    public const UPDATED_AT = 'updated_date';
}
```

如果你希望在操作模型时不修改其 `updated_at` 时间戳，可以在 `withoutTimestamps` 方法所接收的闭包内操作模型：

```php
Model::withoutTimestamps(fn () => $post->increment('reads'));
```

<a name="database-connections"></a>
### Database Connections

默认情况下，所有 Eloquent 模型都会使用为应用配置的默认数据库连接。如果你想指定与某个特定模型交互时所使用的不同连接，可以使用 `Connection` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Model;

#[Connection('mysql')]
class Flight extends Model
{
    // ...
}
```

<a name="default-attribute-values"></a>
### Default Attribute Values

默认情况下，新实例化的模型实例不会包含任何属性值。如果你想为模型的某些属性定义默认值，可以在模型上定义一个 `$attributes` 属性。放置在 `$attributes` 数组中的属性值应当是其原始的、「可存储」格式，就像刚从数据库读取出来一样：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'options' => '[]',
        'delayed' => false,
    ];
}
```

<a name="configuring-eloquent-strictness"></a>
### Configuring Eloquent Strictness

Laravel 提供了几个方法，让你可以配置 Eloquent 在各种情形下的行为和「严格度（strictness）」。

首先，`preventLazyLoading` 方法接受一个可选的布尔参数，用于指示是否应禁止惰性加载。例如，你可能希望只在非生产环境中禁用惰性加载，这样即使生产代码中意外出现了惰性加载的关联，生产环境仍能正常运行。通常，这个方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，你可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充一个不可填充属性时抛出异常。这能在本地开发时，避免因尝试设置一个尚未加入模型 `fillable` 数组的属性而导致意外错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

<a name="retrieving-models"></a>
## Retrieving Models

一旦你创建了模型以及 [它关联的数据库表](/docs/{{version}}/migrations#generating-migrations)，就可以开始从数据库中检索数据了。你可以把每个 Eloquent 模型都看作一个强大的 [查询构造器](/docs/{{version}}/queries)，让你可以流畅地查询与模型关联的数据库表。模型的 `all` 方法会检索模型关联数据库表中的所有记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

<a name="building-queries"></a>
#### Building Queries

Eloquent 的 `all` 方法会返回模型表中的所有结果。不过，由于每个 Eloquent 模型都是一个 [查询构造器](/docs/{{version}}/queries)，你可以为查询添加额外的约束，然后调用 `get` 方法来检索结果：

```php
$flights = Flight::where('active', 1)
    ->orderBy('name')
    ->limit(10)
    ->get();
```

> [!NOTE]
> 由于 Eloquent 模型就是查询构造器，你应该查阅 Laravel [查询构造器](/docs/{{version}}/queries) 提供的所有方法。在编写 Eloquent 查询时，你可以使用其中任意一个方法。

<a name="refreshing-models"></a>
#### Refreshing Models

如果你已经拥有一个从数据库检索到的 Eloquent 模型实例，可以使用 `fresh` 和 `refresh` 方法来「刷新」模型。`fresh` 方法会从数据库重新检索模型，已有的模型实例不会受影响：

```php
$flight = Flight::where('number', 'FR 900')->first();

$freshFlight = $flight->fresh();
```

`refresh` 方法会使用数据库中的新数据重新填充（re-hydrate）已有的模型实例。此外，其所有已加载的关联也会被刷新：

```php
$flight = Flight::where('number', 'FR 900')->first();

$flight->number = 'FR 456';

$flight->refresh();

$flight->number; // "FR 900"
```

如果你需要刷新一个模型并在事务中获取悲观锁，可以使用 `refreshForUpdate` 方法。该方法会使用 `FOR UPDATE` 锁重新加载模型：

```php
DB::transaction(function () use ($flight) {
    $flight->refreshForUpdate();

    // Update the locked model...
});
```

<a name="collections"></a>
### Collections

正如我们所见，`all` 和 `get` 等 Eloquent 方法会从数据库中检索多条记录。不过，这些方法返回的并不是普通的 PHP 数组，而是返回一个 `Illuminate\Database\Eloquent\Collection` 实例。

Eloquent 的 `Collection` 类继承自 Laravel 基础的 `Illuminate\Support\Collection` 类，后者提供了 [各种有用的方法](/docs/{{version}}/collections#available-methods) 用于处理数据集合。例如，`reject` 方法可用于根据被调用闭包的结果从集合中移除模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法之外，Eloquent 集合类还提供了 [一些额外的方法](/docs/{{version}}/eloquent-collections#available-methods)，专门用于与 Eloquent 模型的集合交互。

由于 Laravel 的所有集合都实现了 PHP 的可迭代接口，你可以像遍历数组一样遍历集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

<a name="chunking-results"></a>
### Chunking Results

如果你的应用尝试通过 `all` 或 `get` 方法加载数以万计的 Eloquent 记录，可能会耗尽内存。你可以使用 `chunk` 方法来更高效地处理大量模型，而不是使用这些方法。

`chunk` 方法会检索一部分 Eloquent 模型，并将它们传给一个闭包进行处理。由于每次只检索当前的 Eloquent 模型分块，`chunk` 方法在处理大量模型时能显著减少内存占用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传给 `chunk` 方法的第一个参数是你希望每个「分块」接收的记录数。作为第二个参数传入的闭包会对从数据库检索到的每个分块被调用一次。会执行一条数据库查询来检索传给闭包的每个分块记录。

如果你要根据某个列对 `chunk` 方法的结果进行过滤，并且在遍历结果时还会更新该列，则应该使用 `chunkById` 方法。在这些场景下使用 `chunk` 方法可能导致意外且不一致的结果。在底层，`chunkById` 方法总是检索 `id` 列大于上一个分块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, column: 'id');
```

由于 `chunkById` 和 `lazyById` 方法会向正在执行的查询添加它们自己的「where」条件，通常你应该 [逻辑分组](/docs/{{version}}/queries#logical-grouping) 自己写在闭包里的条件：

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
### Chunking Using Lazy Collections

`lazy` 方法的工作方式类似于 [the `chunk` method](#chunking-results)，在底层它同样是分块执行查询。不过，`lazy` 方法不是把每个分块直接传入回调，而是返回一个扁平化的 Eloquent 模型 [LazyCollection](/docs/{{version}}/collections#lazy-collections)，让你能够像处理单一数据流一样与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果你要根据某个列对 `lazy` 方法的结果进行过滤，并且在遍历结果时还会更新该列，则应该使用 `lazyById` 方法。在底层，`lazyById` 方法总是检索 `id` 列大于上一个分块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->lazyById(200, column: 'id')
    ->each->update(['departed' => false]);
```

你也可以使用 `lazyByIdDesc` 方法根据 `id` 的降序对结果进行过滤。

<a name="cursors"></a>
### Cursors

与 `lazy` 方法类似，`cursor` 方法可用于在遍历数以万计的 Eloquent 模型记录时，显著减少应用的内存消耗。

`cursor` 方法只会执行一条数据库查询；不过，各个 Eloquent 模型在被实际遍历之前不会被填充（hydrate）。因此，在遍历游标时，任意时刻内存中只会保留一个 Eloquent 模型。

> [!WARNING]
> 由于 `cursor` 方法任意时刻只在内存中保留一个 Eloquent 模型，它无法预加载关联。如果你需要预加载关联，请考虑改用 [the `lazy` method](#chunking-using-lazy-collections)。

在底层，`cursor` 方法使用 PHP [生成器（generators）](https://www.php.net/manual/en/language.generators.overview.php) 来实现这个功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 返回的是一个 `Illuminate\Support\LazyCollection` 实例。[惰性集合](/docs/{{version}}/collections#lazy-collections) 让你能够在任意时刻只将一个模型加载到内存中的同时，使用典型 Laravel 集合提供的许多集合方法：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

尽管 `cursor` 方法使用的内存远少于常规查询（因为它任意时刻只在内存中保留一个 Eloquent 模型），它最终仍会耗尽内存。这是 [由于 PHP 的 PDO 驱动在内部将所有原始查询结果缓存在其缓冲区中](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果你要处理数量非常庞大的 Eloquent 记录，请考虑改用 [the `lazy` method](#chunking-using-lazy-collections)。

<a name="advanced-subqueries"></a>
### Advanced Subqueries

<a name="subquery-selects"></a>
#### Subquery Selects

Eloquent 还提供了高级子查询支持，让你能够用单条查询从关联表中提取信息。例如，假设我们有一张航班 `destinations`（目的地）表和一张飞往目的地的 `flights` 表。`flights` 表包含一个 `arrived_at` 列，表示航班抵达目的地的时间。

利用查询构造器的 `select` 和 `addSelect` 方法提供的子查询功能，我们可以用单条查询选出所有 `destinations` 以及最近抵达该目的地的航班名称：

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
#### Subquery Ordering

此外，查询构造器的 `orderBy` 函数支持子查询。继续沿用我们的航班示例，我们可以利用这个功能根据最后一个航班抵达该目的地的时间对所有目的地进行排序。同样，这可以在执行单条数据库查询时完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

<a name="retrieving-single-models"></a>
## Retrieving Single Models / Aggregates

除了检索匹配给定查询的所有记录，你还可以使用 `find`、`first` 或 `firstWhere` 方法来检索单条记录。这些方法返回的是单个模型实例，而非模型集合：

```php
use App\Models\Flight;

// Retrieve a model by its primary key...
$flight = Flight::find(1);

// Retrieve the first model matching the query constraints...
$flight = Flight::where('active', 1)->first();

// Alternative to retrieving the first model matching the query constraints...
$flight = Flight::firstWhere('active', 1);
```

有时你可能希望在找不到结果时执行一些其他操作。`findOr` 和 `firstOr` 方法会返回单个模型实例，或者，如果找不到结果，则执行给定的闭包。闭包返回的值将被视为该方法的结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

<a name="not-found-exceptions"></a>
#### Not Found Exceptions

有时你可能希望在找不到模型时抛出异常。这在路由或控制器中尤其有用。`findOrFail` 和 `firstOrFail` 方法会检索查询的第一条结果；不过，如果找不到结果，则会抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果 `ModelNotFoundException` 未被捕获，会自动向客户端返回 404 HTTP 响应：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

<a name="retrieving-or-creating-models"></a>
### Retrieving or Creating Models

`firstOrCreate` 方法会尝试使用给定的列 / 值对定位数据库记录。如果在数据库中找不到该模型，则会插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并得到。

`firstOrNew` 方法与 `firstOrCreate` 类似，也会尝试定位匹配给定属性的数据库记录。不过，如果找不到模型，会返回一个新的模型实例。注意，`firstOrNew` 返回的模型尚未持久化到数据库。你需要手动调用 `save` 方法将其持久化：

```php
use App\Models\Flight;

// Retrieve flight by name or create it if it doesn't exist...
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// Retrieve flight by name or create it with the name, delayed, and arrival_time attributes...
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// Retrieve flight by name or instantiate a new Flight instance...
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// Retrieve flight by name or instantiate with the name, delayed, and arrival_time attributes...
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

<a name="retrieving-aggregates"></a>
### Retrieving Aggregates

在与 Eloquent 模型交互时，你也可以使用 Laravel [查询构造器](/docs/{{version}}/queries) 提供的 `count`、`sum`、`max` 等 [聚合方法](/docs/{{version}}/queries#aggregates)。正如你所预期的，这些方法返回的是标量值，而非 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

<a name="inserting-and-updating-models"></a>
## Inserting and Updating Models

<a name="inserts"></a>
### Inserts

当然，使用 Eloquent 时，我们不只是需要从数据库中检索模型，还需要插入新记录。所幸 Eloquent 让这件事变得简单。要向数据库插入一条新记录，你应该实例化一个新的模型实例并设置其属性，然后调用该模型实例的 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * Store a new flight in the database.
     */
    public function store(Request $request): RedirectResponse
    {
        // Validate the request...

        $flight = new Flight;

        $flight->name = $request->name;

        $flight->save();

        return redirect('/flights');
    }
}
```

在本例中，我们将传入 HTTP 请求的 `name` 字段赋值给 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，一条记录会被插入数据库。调用 `save` 方法时，模型的 `created_at` 和 `updated_at` 时间戳会自动被设置，因此无需手动设置它们。

如果你想在数据库事务中保存模型，可以使用 `saveOrFail` 方法。如果在保存过程中抛出异常，事务会自动回滚：

```php
$flight->saveOrFail();
```

另外，你可以使用 `create` 方法通过单条 PHP 语句来「保存」一个新模型。`create` 方法会返回插入的模型实例给你：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到批量赋值漏洞的保护。要了解关于批量赋值的更多信息，请查阅 [批量赋值文档](#mass-assignment)。

<a name="updates"></a>
### Updates

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，你应该检索它并设置任何你希望更新的属性，然后调用模型的 `save` 方法。同样，`updated_at` 时间戳会自动更新，所以无需手动设置其值：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->name = 'Paris to London';

$flight->save();
```

如果你希望在数据库事务中更新模型，可以使用 `updateOrFail` 方法。如果在更新过程中抛出异常，事务会自动回滚：

```php
$flight->updateOrFail(['name' => 'Paris to London']);
```

有时，你可能需要更新一个已存在的模型，或者在找不到匹配模型时创建一个新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在一个 `departure` 为 `Oakland` 且 `destination` 为 `San Diego` 的航班，其 `price` 和 `discounted` 列会被更新。如果不存在这样的航班，则会创建一个新航班，其属性由第一个参数数组与第二个参数数组合并得到：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

使用 `firstOrCreate` 或 `updateOrCreate` 等方法时，你可能无法知道是新创建了模型还是更新了已存在的模型。`wasRecentlyCreated` 属性指示该模型是否在当前生命周期内被创建：

```php
$flight = Flight::updateOrCreate(
    // ...
);

if ($flight->wasRecentlyCreated) {
    // New flight record was inserted...
}
```

<a name="mass-updates"></a>
#### Mass Updates

也可以对匹配给定查询的模型执行更新。在本例中，所有 `active` 且 `destination` 为 `San Diego` 的航班都会被标记为延迟：

```php
Flight::where('active', 1)
    ->where('destination', 'San Diego')
    ->update(['delayed' => 1]);
```

`update` 方法接受一个表示应更新列的「列 => 值」对数组。`update` 方法返回受影响的行数。

> [!WARNING]
> 通过 Eloquent 执行批量更新时，被更新模型的 `saving`、`saved`、`updating` 和 `updated` 模型事件不会被触发。这是因为执行批量更新时模型从未被实际检索。

<a name="examining-attribute-changes"></a>
#### Examining Attribute Changes

Eloquent 提供了 `isDirty`、`isClean` 和 `wasChanged` 方法，用于检查模型的内部状态，并判断其属性自最初检索以来发生了哪些变化。

`isDirty` 方法用于判断自模型被检索以来，是否有任何属性发生了变化。你可以向 `isDirty` 方法传入特定的属性名或属性名数组，来判断这些属性是否「脏」。`isClean` 方法用于判断某个属性自模型被检索以来是否保持不变。该方法也接受一个可选的属性参数：

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

`wasChanged` 方法用于判断在当前请求周期内，模型最后一次保存时是否有任何属性发生了变化。如有需要，你可以传入属性名来判断某个特定属性是否发生了变化：

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

`getOriginal` 方法返回一个包含模型原始属性的数组，无论模型自检索以来发生了什么变化。如有需要，你可以传入特定的属性名来获取某个属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = 'Jack';
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // Array of original attributes...
```

`getChanges` 方法返回一个包含模型最后一次保存时发生变化属性的数组，而 `getPrevious` 方法返回一个包含模型最后一次保存之前原始属性值的数组：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->update([
    'name' => 'Jack',
    'email' => 'jack@example.com',
]);

$user->getChanges();

/*
    [
        'name' => 'Jack',
        'email' => 'jack@example.com',
    ]
*/

$user->getPrevious();

/*
    [
        'name' => 'John',
        'email' => 'john@example.com',
    ]
*/
```

<a name="mass-assignment"></a>
### Mass Assignment

你可以使用 `create` 方法通过单条 PHP 语句来「保存」一个新模型。该方法会返回插入的模型实例给你：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到批量赋值漏洞的保护。

批量赋值漏洞发生在用户传入一个意外的 HTTP 请求字段，而该字段修改了数据库中你未预期被修改的列时。例如，恶意用户可能通过 HTTP 请求发送一个 `is_admin` 参数，该参数随后被传入模型的 `create` 方法，从而让用户将自己提升为管理员。

因此，作为开始，你应该定义哪些模型属性是你希望允许批量赋值的。你可以使用模型上的 `Fillable` 属性来做到这一点。例如，让我们把 `Flight` 模型的 `name` 属性设为可批量赋值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name'])]
class Flight extends Model
{
    // ...
}
```

一旦指定了哪些属性可批量赋值，你就可以使用 `create` 方法向数据库插入一条新记录。`create` 方法返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果你已经有一个模型实例，可以使用 `fill` 方法用一个属性数组来填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

<a name="mass-assignment-json-columns"></a>
#### Mass Assignment and JSON Columns

在赋值 JSON 列时，每个列的可批量赋值键必须在模型的 `Fillable` 属性中指定。出于安全考虑，Laravel 在使用 `Guarded` 属性时不支持更新嵌套的 JSON 属性：

```php
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['options->enabled'])]
class Flight extends Model
{
    // ...
}
```

<a name="allowing-mass-assignment"></a>
#### Allowing Mass Assignment

如果你想让所有属性都可批量赋值，可以在模型上使用 `Unguarded` 属性。如果你选择取消模型的 guard 保护，应当格外小心，始终手动精心构造传给 Eloquent 的 `fill`、`create` 和 `update` 方法的数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;

#[Unguarded]
class Flight extends Model
{
    // ...
}
```

<a name="mass-assignment-exceptions"></a>
#### Mass Assignment Exceptions

默认情况下，在执行批量赋值操作时，未包含在 `Fillable` 属性中的属性会被静默丢弃。在生产环境中，这是预期的行为；不过，在本地开发时，它可能导致困惑，让人不知道为什么模型的修改没有生效。

如果你愿意，可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充一个不可填充属性时抛出异常。通常，这个方法应当在应用的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

<a name="upserts"></a>
### Upserts

Eloquent 的 `upsert` 方法可用于在单个原子操作中更新或创建记录。该方法的第一个参数由要插入或更新的值组成，第二个参数列出了在关联表中唯一标识记录的列（或列组），第三个也是最后一个参数是一个列数组，表示如果数据库中已存在匹配记录时应当被更新的列。`upsert` 方法会在模型启用时间戳时自动设置 `created_at` 和 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]
> 除 SQL Server 之外的所有数据库，都要求 `upsert` 方法的第二个参数中的列拥有「主键」或「唯一」索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，并总是使用表的「主键」和「唯一」索引来检测已存在的记录。

<a name="deleting-models"></a>
## Deleting Models

要删除一个模型，可以调用模型实例上的 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

如果你希望在数据库事务中删除模型，可以使用 `deleteOrFail` 方法。如果在删除过程中抛出异常，事务会自动回滚：

```php
$flight->deleteOrFail();
```

<a name="deleting-an-existing-model-by-its-primary-key"></a>
#### Deleting an Existing Model by its Primary Key

在上面的示例中，我们在调用 `delete` 方法之前先从数据库检索模型。不过，如果你知道模型的主键，可以通过调用 `destroy` 方法在不显式检索模型的情况下删除它。`destroy` 方法除了接受单个主键外，还接受多个主键、一个主键数组或一组 [集合](/docs/{{version}}/collections)（collection）形式的主键：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

如果你正在使用 [软删除模型](#soft-deleting)，可以通过 `forceDestroy` 方法永久删除模型：

```php
Flight::forceDestroy(1);
```

> [!WARNING]
> `destroy` 方法会逐个加载每个模型并调用 `delete` 方法，以便为每个模型正确派发 `deleting` 和 `deleted` 事件。

<a name="deleting-models-using-queries"></a>
#### Deleting Models Using Queries

当然，你可以构建一个 Eloquent 查询来删除所有匹配查询条件的模型。在本例中，我们将删除所有被标记为未激活的航班。与批量更新一样，批量删除不会为被删除的模型派发模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

要删除表中的全部模型，你应该执行一条不带任何条件的查询：

```php
$deleted = Flight::query()->delete();
```

> [!WARNING]
> 通过 Eloquent 执行批量删除语句时，被删除模型的 `deleting` 和 `deleted` 模型事件不会被派发。这是因为执行删除语句时模型从未被实际检索。

<a name="soft-deleting"></a>
### Soft Deleting

除了真正从数据库中移除记录，Eloquent 还可以「软删除」模型。当模型被软删除时，它们并不会真正从数据库中被移除。相反，模型上会被设置一个 `deleted_at` 属性，表示模型被「删除」的日期和时间。要为模型启用软删除，请在模型上添加 `Illuminate\Database\Eloquent\SoftDeletes` trait：

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
> `SoftDeletes` trait 会自动将 `deleted_at` 属性为你转换为 `DateTime` / `Carbon` 实例。

你还应该在数据库表中添加 `deleted_at` 列。Laravel 的 [schema 构建器](/docs/{{version}}/migrations) 包含一个用于创建该列的辅助方法：

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

现在，当你在模型上调用 `delete` 方法时，`deleted_at` 列会被设置为当前日期和时间。但模型的数据库记录会留在表中。当查询一个使用软删除的模型时，软删除的模型会自动被排除在所有查询结果之外。

要判断某个给定的模型实例是否已被软删除，可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

<a name="restoring-soft-deleted-models"></a>
#### Restoring Soft Deleted Models

有时你可能希望「撤销删除」一个软删除的模型。要恢复一个软删除的模型，可以在模型实例上调用 `restore` 方法。`restore` 方法会将模型的 `deleted_at` 列设为 `null`：

```php
$flight->restore();
```

你也可以在一个查询中使用 `restore` 方法来恢复多个模型。同样，与其他「批量」操作一样，这不会为被恢复的模型派发任何模型事件：

```php
Flight::withTrashed()
    ->where('airline_id', 1)
    ->restore();
```

`restore` 方法也可以在构建 [关联](/docs/{{version}}/eloquent-relationships) 查询时使用：

```php
$flight->history()->restore();
```

<a name="permanently-deleting-models"></a>
#### Permanently Deleting Models

有时你可能需要真正从数据库中移除一个模型。可以使用 `forceDelete` 方法将软删除的模型从数据库表中永久移除：

```php
$flight->forceDelete();
```

你也可以在构建 Eloquent 关联查询时使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

<a name="querying-soft-deleted-models"></a>
### Querying Soft Deleted Models

<a name="including-soft-deleted-models"></a>
#### Including Soft Deleted Models

如上所述，软删除的模型会自动被排除在查询结果之外。不过，你可以通过在查询上调用 `withTrashed` 方法，强制将软删除的模型包含在查询结果中：

```php
use App\Models\Flight;

$flights = Flight::withTrashed()
    ->where('account_id', 1)
    ->get();
```

`withTrashed` 方法也可以在构建 [关联](/docs/{{version}}/eloquent-relationships) 查询时调用：

```php
$flight->history()->withTrashed()->get();
```

<a name="retrieving-only-soft-deleted-models"></a>
#### Retrieving Only Soft Deleted Models

`onlyTrashed` 方法只会检索 **仅** 软删除的模型：

```php
$flights = Flight::onlyTrashed()
    ->where('airline_id', 1)
    ->get();
```

<a name="pruning-models"></a>
## Pruning Models

有时你可能希望定期删除不再需要的模型。为此，你可以为你希望定期修剪的模型添加 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` trait。将其中一个 trait 添加到模型后，实现一个 `prunable` 方法，该方法返回一个解析出不再需要的模型的 Eloquent 查询构造器：

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
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

将模型标记为 `Prunable` 时，你还可以定义一个 `pruning` 方法。该方法会在模型被删除之前调用。这个方法对于在模型被永久从数据库移除之前，删除任何与该模型关联的额外资源（例如已存储的文件）很有用：

```php
/**
 * Prepare the model for pruning.
 */
protected function pruning(): void
{
    // ...
}
```

配置好可修剪模型后，你应该在应用的 `routes/console.php` 文件中调度 `model:prune` Artisan 命令。你可以自由选择该命令合适的运行间隔：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在底层，`model:prune` 命令会自动检测应用 `app/Models` 目录中的「Prunable」模型。如果你的模型位于其他位置，可以使用 `--model` 选项指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你想在修剪所有其他被检测到的模型时排除某些模型，可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以通过执行带有 `--pretend` 选项的 `model:prune` 命令来测试你的 `prunable` 查询。在模拟（pretend）模式下，`model:prune` 命令只会报告如果命令真正运行会修剪多少条记录：

```shell
php artisan model:prune --pretend
```

> [!WARNING]
> 如果软删除的模型匹配了可修剪查询，它们会被永久删除（`forceDelete`）。

<a name="mass-pruning"></a>
#### Mass Pruning

当模型被标记为 `Illuminate\Database\Eloquent\MassPrunable` trait 时，模型会使用批量删除查询从数据库中删除。因此，`pruning` 方法不会被调用，`deleting` 和 `deleted` 模型事件也不会被派发。这是因为模型在删除前从未被实际检索，从而使修剪过程高效得多：

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
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

<a name="replicating-models"></a>
## Replicating Models

你可以使用 `replicate` 方法创建一个已有模型实例的未保存副本。当你的模型实例共享许多相同属性时，这个方法尤其有用：

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

要将一个或多个属性排除在复制（replicate）到新模型之外，你可以向 `replicate` 方法传入一个数组：

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
## Query Scopes

<a name="global-scopes"></a>
### Global Scopes

全局作用域（global scope）允许你为给定模型的所有查询添加约束。Laravel 自己的 [软删除](#soft-deleting) 功能就利用了全局作用域，来只从数据库中检索「未删除」的模型。编写你自己的全局作用域，可以方便地确保对给定模型的每个查询都收到某些约束。

<a name="generating-scopes"></a>
#### Generating Scopes

要生成一个新的全局作用域，你可以调用 `make:scope` Artisan 命令，它会把生成的作用域放置在应用的 `app/Models/Scopes` 目录：

```shell
php artisan make:scope AncientScope
```

<a name="writing-global-scopes"></a>
#### Writing Global Scopes

编写全局作用域很简单。首先，使用 `make:scope` 命令生成一个实现了 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其他类型的子句：

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->minus(years: 2000));
    }
}
```

> [!NOTE]
> 如果你的全局作用域要向查询的 select 子句添加列，你应该使用 `addSelect` 方法而非 `select`。这样可以防止无意中替换掉查询已有的 select 子句。

<a name="applying-global-scopes"></a>
#### Applying Global Scopes

要将全局作用域分配给一个模型，只需在模型上放置 `ScopedBy` 属性：

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

或者，你可以通过重写模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法来手动注册全局作用域。`addGlobalScope` 方法接受你的作用域实例作为其唯一参数：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new AncientScope);
    }
}
```

在上面的示例中把作用域添加到 `App\Models\User` 模型之后，调用 `User::all()` 方法会执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

<a name="anonymous-global-scopes"></a>
#### Anonymous Global Scopes

Eloquent 还允许你使用闭包定义全局作用域，这对于不值得单独成类的简单作用域尤其有用。使用闭包定义全局作用域时，你应该提供一个你自己选定的作用域名称作为 `addGlobalScope` 方法的第一个参数：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('ancient', function (Builder $builder) {
            $builder->where('created_at', '<', now()->minus(years: 2000));
        });
    }
}
```

<a name="removing-global-scopes"></a>
#### Removing Global Scopes

如果你希望为给定查询移除某个全局作用域，可以使用 `withoutGlobalScope` 方法。该方法接受全局作用域的类名作为其唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果你使用闭包定义了全局作用域，应该传入你为该全局作用域分配的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你希望移除若干甚至全部查询的全局作用域，可以使用 `withoutGlobalScopes` 和 `withoutGlobalScopesExcept` 方法：

```php
// Remove all of the global scopes...
User::withoutGlobalScopes()->get();

// Remove some of the global scopes...
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();

// Remove all global scopes except the given ones...
User::withoutGlobalScopesExcept([
    SecondScope::class,
])->get();
```

<a name="local-scopes"></a>
### Local Scopes

本地作用域（local scope）允许你定义一组可重用的常用查询约束，便于在应用中反复使用。例如，你可能需要频繁检索所有被认为是「popular」的用户。要定义一个作用域，请在 Eloquent 方法上添加 `Scope` 属性。

作用域应始终返回同一个查询构造器实例或 `void`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * Scope a query to only include popular users.
     */
    #[Scope]
    protected function popular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * Scope a query to only include active users.
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

<a name="utilizing-a-local-scope"></a>
#### Utilizing a Local Scope

一旦作用域被定义，你就可以在查询模型时调用该作用域方法。你甚至可以链式调用各种作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

通过 `or` 查询运算符组合多个 Eloquent 模型作用域，可能需要使用闭包来实现正确的 [逻辑分组](/docs/{{version}}/queries#logical-grouping)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

不过，由于这可能很繁琐，Laravel 提供了一个「高阶」`orWhere` 方法，让你无需使用闭包即可流畅地链式组合作用域：

```php
$users = User::popular()->orWhere->active()->get();
```

<a name="dynamic-scopes"></a>
#### Dynamic Scopes

有时你可能希望定义一个接受参数的作用域。作为开始，只需在你的作用域方法签名中添加额外的参数。作用域参数应定义在 `$query` 参数之后：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * Scope a query to only include users of a given type.
     */
    #[Scope]
    protected function ofType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

一旦预期的参数被加入作用域方法签名，你就可以在调用作用域时传入参数：

```php
$users = User::ofType('admin')->get();
```

带属性的作用域方法应为 `protected`。在模型类内部调用带属性的作用域时，应通过查询构造器实例调用该作用域，例如 `static::query()->ofType('admin')`，以确保调用经由 Eloquent 的作用域处理。

<a name="pending-attributes"></a>
### Pending Attributes

如果你想使用作用域来创建具有与约束该作用域所用属性相同的模型，可以在构建作用域查询时使用 `withAttributes` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * Scope the query to only include drafts.
     */
    #[Scope]
    protected function draft(Builder $query): void
    {
        $query->withAttributes([
            'hidden' => true,
        ]);
    }
}
```

`withAttributes` 方法会使用给定属性向查询添加 `where` 条件，同时它还会把给定属性添加到通过该作用域创建的任何模型中：

```php
$draft = Post::draft()->create(['title' => 'In Progress']);

$draft->hidden; // true
```

如果要指示 `withAttributes` 方法不要向查询添加 `where` 条件，可以将 `asConditions` 参数设为 `false`：

```php
$query->withAttributes([
    'hidden' => true,
], asConditions: false);
```

<a name="comparing-models"></a>
## Comparing Models

有时你可能需要判断两个模型是否「相同」。`is` 和 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、表以及数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
```

`is` 和 `isNot` 方法在使用 `belongsTo`、`hasOne`、`morphTo` 和 `morphOne` [关联](/docs/{{version}}/eloquent-relationships) 时也可用。当你希望在不发起查询检索关联模型的情况下比较关联模型时，这个方法尤其有帮助：

```php
if ($post->author()->is($user)) {
    // ...
}
```

<a name="events"></a>
## Events

> [!NOTE]
> 想将你的 Eloquent 事件直接广播到客户端应用？请查阅 Laravel 的 [模型事件广播](/docs/{{version}}/broadcasting#model-broadcasting)。

Eloquent 模型会派发多个事件，让你能够挂接到模型生命周期中的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 和 `replicating`。

`retrieved` 事件会在从数据库检索到一个已有模型时派发。当第一次保存一个新模型时，会派发 `creating` 和 `created` 事件。当修改一个已有模型并调用 `save` 方法时，会派发 `updating` / `updated` 事件。当创建或更新一个模型时，会派发 `saving` / `saved` 事件 —— 即使模型的属性没有被改变。以 `-ing` 结尾的事件名在模型变更被持久化之前派发，而以 `-ed` 结尾的事件名在模型变更被持久化之后派发。

要开始监听模型事件，请在 Eloquent 模型上定义一个 `$dispatchesEvents` 属性。该属性将 Eloquent 模型生命周期中的各个节点映射到你自己的 [事件类](/docs/{{version}}/events)。每个模型事件类应通过其构造函数接收一个受影响模型的实例：

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
     * The event map for the model.
     *
     * @var array<string, string>
     */
    protected $dispatchesEvents = [
        'saved' => UserSaved::class,
        'deleted' => UserDeleted::class,
    ];
}
```

定义并映射好你的 Eloquent 事件后，你可以使用 [事件监听器](/docs/{{version}}/events#defining-listeners) 来处理这些事件。

> [!WARNING]
> 通过 Eloquent 执行批量更新或删除查询时，受影响模型的 `saved`、`updated`、`deleting` 和 `deleted` 模型事件不会被派发。这是因为执行批量更新或删除时模型从未被实际检索。

<a name="events-using-closures"></a>
### Using Closures

除了使用自定义事件类，你还可以注册在各类模型事件派发时执行的闭包。通常，你应该在模型的 `booted` 方法中注册这些闭包：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // ...
        });
    }
}
```

如有需要，在注册模型事件时，你可以使用 [可排队的匿名事件监听器](/docs/{{version}}/events#queueable-anonymous-event-listeners)。这会指示 Laravel 使用应用的 [队列](/docs/{{version}}/queues) 在后台执行该模型事件监听器：

```php
use function Illuminate\Events\queueable;

static::created(queueable(function (User $user) {
    // ...
}));
```

<a name="observers"></a>
### Observers

<a name="defining-observers"></a>
#### Defining Observers

如果你在某个给定模型上监听许多事件，可以使用观察者（observer）将所有监听器归并到单个类中。观察者类的方法名反映了你希望监听的 Eloquent 事件。这些方法中的每一个都只接收受影响模型作为其唯一参数。`make:observer` Artisan 命令是创建新观察者类最简单的方式：

```shell
php artisan make:observer UserObserver --model=User
```

该命令会将新的观察者放置在你的 `app/Observers` 目录。如果该目录不存在，Artisan 会为你创建它。你的新观察者会像下面这样

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // ...
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // ...
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        // ...
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        // ...
    }

    /**
     * Handle the User "forceDeleted" event.
     */
    public function forceDeleted(User $user): void
    {
        // ...
    }
}
```

要注册一个观察者，你可以在对应的模型上放置 `ObservedBy` 属性：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，你可以通过在你希望观察的模型上调用 `observe` 方法来手动注册观察者。你可以在应用的 `AppServiceProvider` 类的 `boot` 方法中注册观察者：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

> [!NOTE]
> 观察者还可以监听其他事件，例如 `saving` 和 `retrieved`。这些事件在 [events](#events) 文档中有说明。

<a name="observers-and-database-transactions"></a>
#### Observers and Database Transactions

当模型在数据库事务内部被创建时，你可能希望指示观察者在数据库事务提交之后才执行其事件处理器。你可以通过在观察者上实现 `ShouldHandleEventsAfterCommit` 接口来实现。如果数据库事务没有进行中，事件处理器会立即执行：

```php
<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // ...
    }
}
```

<a name="muting-events"></a>
### Muting Events

你可能偶尔需要临时「静默」模型派发的全部事件。可以使用 `withoutEvents` 方法来实现。`withoutEvents` 方法接受唯一一个闭包作为参数。在该闭包内执行的任何代码都不会派发模型事件，且闭包返回的任何值都会由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

<a name="saving-a-single-model-without-events"></a>
#### Saving a Single Model Without Events

有时你可能希望「保存」一个给定模型而不派发任何事件。可以使用 `saveQuietly` 方法来实现：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你也可以「更新」、「删除」、「软删除」、「恢复」和「复制」一个给定模型而不派发任何事件：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```
