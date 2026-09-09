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
    - [分块处理结果](#chunking-results)
    - [使用 Lazy Collection 分块处理](#chunking-using-lazy-collections)
    - [游标](#cursors)
    - [高级子查询](#advanced-subqueries)
- [检索单个模型 / 聚合结果](#retrieving-single-models)
    - [检索或创建模型](#retrieving-or-creating-models)
    - [检索聚合结果](#retrieving-aggregates)
- [插入与更新模型](#inserting-and-updating-models)
    - [插入](#inserts)
    - [更新](#updates)
    - [批量赋值](#mass-assignment)
    - [Upsert](#upserts)
- [删除模型](#deleting-models)
    - [软删除](#soft-deleting)
    - [查询软删除的模型](#querying-soft-deleted-models)
- [修剪模型](#pruning-models)
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

Laravel 内置了 Eloquent，一个让数据库交互变得轻松愉快的对象关系映射器（ORM）。使用 Eloquent 时，每个数据库表都有一个与之对应的「模型（Model）」，用于与该表交互。除了从数据库表中检索记录之外，Eloquent 模型还允许你向表中插入、更新和删除记录。

> [!NOTE]
> 在开始之前，请确保已在应用的 `config/database.php` 配置文件中配置好数据库连接。有关数据库配置的更多信息，请查阅[数据库配置文档](/docs/{{version}}/database#configuration)。

<a name="generating-model-classes"></a>
## 生成模型类

首先，我们来创建一个 Eloquent 模型。模型通常位于 `app\Models` 目录中，并继承 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/docs/{{version}}/artisan)来生成新模型：

```shell
php artisan make:model Flight
```

如果你希望在生成模型的同时生成[数据库迁移](/docs/{{version}}/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

在生成模型的同时，你还可以生成其他多种类型的类，例如工厂、数据填充器、策略、控制器和表单请求。此外，这些选项可以组合使用，一次创建多个类：

```shell
# 生成模型和 FlightFactory 类...
php artisan make:model Flight --factory
php artisan make:model Flight -f

# 生成模型和 FlightSeeder 类...
php artisan make:model Flight --seed
php artisan make:model Flight -s

# 生成模型和 FlightController 类...
php artisan make:model Flight --controller
php artisan make:model Flight -c

# 生成模型、FlightController 资源控制器和表单请求类...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成模型和 FlightPolicy 类...
php artisan make:model Flight --policy

# 生成模型、迁移、工厂、数据填充器和控制器...
php artisan make:model Flight -mfsc

# 一次性生成模型、迁移、工厂、数据填充器、策略、控制器和表单请求...
php artisan make:model Flight --all
php artisan make:model Flight -a

# 生成中间表模型...
php artisan make:model Member --pivot
php artisan make:model Member -p
```

<a name="inspecting-models"></a>
#### 检视模型

有时仅靠浏览代码，很难确定一个模型全部可用的属性和关联。不妨试试 `model:show` Artisan 命令，它会方便地概览模型的所有属性和关联：

```shell
php artisan model:show Flight
```

<a name="eloquent-model-conventions"></a>
## Eloquent 模型约定

通过 `make:model` 命令生成的模型会被放置在 `app/Models` 目录中。我们来查看一个基本的模型类，并讨论 Eloquent 的一些关键约定：

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

看过上面的示例后，你可能已经注意到，我们并没有告诉 Eloquent 哪个数据库表对应我们的 `Flight` 模型。按照约定，除非显式指定其他名称，否则类名的「snake case」复数形式将被用作表名。因此，在本例中，Eloquent 会假定 `Flight` 模型将记录存储在 `flights` 表中，而 `AirTrafficController` 模型则会将记录存储在 `air_traffic_controllers` 表中。

如果你的模型对应的数据库表不符合这一约定，可以通过在模型上定义 `table` 属性来手动指定模型的表名：

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

Eloquent 还会假定每个模型对应的数据库表都有一个名为 `id` 的主键列。如有需要，你可以在模型上定义一个 protected 的 `$primaryKey` 属性，指定一个不同的列作为模型的主键：

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

此外，Eloquent 假定主键是自增的整数值，这意味着 Eloquent 会自动将主键转换为整数。如果你想使用非自增或非数字的主键，必须在模型上定义一个设为 `false` 的公共 `$incrementing` 属性：

```php
<?php

class Flight extends Model
{
    /**
     * 指示模型的 ID 是否自增。
     *
     * @var bool
     */
    public $incrementing = false;
}
```

如果模型的主键不是整数，你应当在模型上定义一个 protected 的 `$keyType` 属性。该属性的值应当为 `string`：

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
#### 「复合」主键

Eloquent 要求每个模型至少拥有一个能够作为主键、唯一标识自身的「ID」。Eloquent 模型不支持「复合」主键。不过，除了表的唯一标识主键之外，你可以自由地为数据库表添加额外的多列唯一索引。

<a name="uuid-and-ulid-keys"></a>
### UUID 与 ULID 主键

除了使用自增整数作为 Eloquent 模型的主键之外，你还可以选择使用 UUID。UUID 是长度为 36 个字符的通用唯一字母数字标识符。

如果你希望模型使用 UUID 主键而非自增整数主键，可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` Trait。当然，你应当确保模型拥有一个 [UUID 等价的主键列](/docs/{{version}}/migrations#column-method-uuid)：

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

默认情况下，`HasUuids` Trait 会为模型生成 [UUIDv7](/docs/{{version}}/strings#method-str-uuid7) 标识符。这类 UUID 可以按字典序排序，因此更适合带索引的数据库存储。

你可以通过在模型上定义 `newUniqueId` 方法，来改写给定模型的 UUID 生成过程。此外，你还可以通过在模型上定义 `uniqueIds` 方法，来指定哪些列应当接收 UUID：

```php
use Ramsey\Uuid\Uuid;

/**
 * 为模型生成新的 UUID。
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

如果你愿意，可以选择使用「ULID」代替 UUID。ULID 与 UUID 类似，但长度只有 26 个字符。与有序 UUID 一样，ULID 可以按字典序排序，便于高效的数据库索引。要使用 ULID，你应当在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` Trait。你还应当确保模型拥有一个 [ULID 等价的主键列](/docs/{{version}}/migrations#column-method-ulid)：

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

默认情况下，Eloquent 期望模型对应的数据库表上存在 `created_at` 和 `updated_at` 列。当模型被创建或更新时，Eloquent 会自动设置这些列的值。如果你不希望这些列由 Eloquent 自动管理，应当在模型上定义一个值为 `false` 的 `$timestamps` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 指示模型是否维护时间戳。
     *
     * @var bool
     */
    public $timestamps = false;
}
```

如果需要自定义模型时间戳的格式，可以设置模型上的 `$dateFormat` 属性。该属性决定了日期属性在数据库中的存储格式，以及模型被序列化为数组或 JSON 时的格式：

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

如果需要自定义用于存储时间戳的列名，你可以在模型上定义 `CREATED_AT` 和 `UPDATED_AT` 常量：

```php
<?php

class Flight extends Model
{
    /**
     * 「创建时间」列的名称。
     *
     * @var string|null
     */
    public const CREATED_AT = 'creation_date';

    /**
     * 「更新时间」列的名称。
     *
     * @var string|null
     */
    public const UPDATED_AT = 'updated_date';
}
```

如果你希望在操作模型时不修改其 `updated_at` 时间戳，可以在传给 `withoutTimestamps` 方法的闭包中操作模型：

```php
Model::withoutTimestamps(fn () => $post->increment('reads'));
```

<a name="database-connections"></a>
### 数据库连接

默认情况下，所有 Eloquent 模型都会使用为应用配置的默认数据库连接。如果你想在与某个特定模型交互时使用另一个连接，应当在模型上定义 `$connection` 属性：

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

默认情况下，新实例化的模型实例不包含任何属性值。如果你想为模型的某些属性定义默认值，可以在模型上定义 `$attributes` 属性。放入 `$attributes` 数组的属性值应当采用原始的、「可存储」的格式，就像刚刚从数据库中读取出来一样：

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

Laravel 提供了多种方法，允许你在不同场景下配置 Eloquent 的行为和「严格程度」。

首先，`preventLazyLoading` 方法接受一个可选的布尔参数，用于指示是否应阻止延迟加载。例如，你可能希望只在非生产环境中禁用延迟加载。这样，即使生产代码中意外存在延迟加载的关联，生产环境也能继续正常运行。通常，该方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导所有应用服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，你还可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充不可填充的属性时抛出异常。这有助于在本地开发中，防止尝试设置一个尚未添加到模型 `fillable` 数组的属性时出现意外错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

<a name="retrieving-models"></a>
## 检索模型

创建好模型及[其对应的数据库表](/docs/{{version}}/migrations#generating-migrations)之后，你就可以开始从数据库中检索数据了。你可以将每个 Eloquent 模型视为一个强大的[查询构造器](/docs/{{version}}/queries)，让你能够流畅地查询与模型关联的数据库表。模型的 `all` 方法会检索模型关联数据库表中的所有记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

<a name="building-queries"></a>
#### 构建查询

Eloquent 的 `all` 方法会返回模型表中的全部结果。不过，由于每个 Eloquent 模型本身就是一个[查询构造器](/docs/{{version}}/queries)，你可以为查询添加额外的约束条件，然后调用 `get` 方法来检索结果：

```php
$flights = Flight::where('active', 1)
    ->orderBy('name')
    ->limit(10)
    ->get();
```

> [!NOTE]
> 由于 Eloquent 模型就是查询构造器，你应当通读 Laravel [查询构造器](/docs/{{version}}/queries)提供的所有方法。在编写 Eloquent 查询时，你可以使用其中的任何方法。

<a name="refreshing-models"></a>
#### 刷新模型

如果你已经拥有一个从数据库检索出来的 Eloquent 模型实例，可以使用 `fresh` 和 `refresh` 方法来「刷新」模型。`fresh` 方法会从数据库重新检索模型，现有的模型实例不会受到影响：

```php
$flight = Flight::where('number', 'FR 900')->first();

$freshFlight = $flight->fresh();
```

`refresh` 方法会使用数据库中的最新数据重新填充现有模型。此外，其所有已加载的关联也会被刷新：

```php
$flight = Flight::where('number', 'FR 900')->first();

$flight->number = 'FR 456';

$flight->refresh();

$flight->number; // "FR 900"
```

<a name="collections"></a>
### 集合

如我们所见，`all` 和 `get` 这样的 Eloquent 方法会从数据库检索多条记录。不过，这些方法并不返回普通的 PHP 数组，而是返回一个 `Illuminate\Database\Eloquent\Collection` 实例。

Eloquent 的 `Collection` 类继承了 Laravel 的基础 `Illuminate\Support\Collection` 类，后者为与数据集合交互提供了[大量实用的方法](/docs/{{version}}/collections#available-methods)。例如，`reject` 方法可用于根据闭包的调用结果，从集合中移除某些模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法之外，Eloquent 集合类还提供了[一些额外的方法](/docs/{{version}}/eloquent-collections#available-methods)，专门用于与 Eloquent 模型集合交互。

由于 Laravel 的所有集合都实现了 PHP 的可迭代接口，你可以像遍历数组一样遍历集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

<a name="chunking-results"></a>
### 分块处理结果

如果尝试通过 `all` 或 `get` 方法一次性加载数万条 Eloquent 记录，应用可能会耗尽内存。不要使用这些方法，`chunk` 方法可以更高效地处理大量模型。

`chunk` 方法会检索 Eloquent 模型的一个子集，并将其传给闭包进行处理。由于每次只检索当前这一块 Eloquent 模型，`chunk` 方法在处理大量模型时可以显著降低内存占用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传给 `chunk` 方法的第一个参数是你希望每个「块」接收的记录数。作为第二个参数传入的闭包会在从数据库检索到每一块时被调用。为获取传给闭包的每块记录，都会执行一次数据库查询。

如果你根据某个列来过滤 `chunk` 方法的结果，而又会在遍历结果的同时更新该列，就应当使用 `chunkById` 方法。在这些场景下使用 `chunk` 方法可能导致意外且不一致的结果。`chunkById` 方法在内部始终检索 `id` 列大于上一块最后一个模型的那些模型：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, column: 'id');
```

由于 `chunkById` 和 `lazyById` 方法会向正在执行的查询添加自己的「where」条件，你通常应当把自己的条件[逻辑分组](/docs/{{version}}/queries#logical-grouping)到一个闭包中：

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
### 使用 Lazy Collection 分块处理

`lazy` 方法的工作方式与 [`chunk` 方法](#chunking-results)类似，它在幕后同样以分块的方式执行查询。不过，`lazy` 方法并不是把每个块原样直接传给回调，而是返回一个扁平化的 Eloquent 模型 [LazyCollection](/docs/{{version}}/collections#lazy-collections)，让你能够以单一数据流的形式与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果你根据某个列来过滤 `lazy` 方法的结果，而又会在遍历结果的同时更新该列，就应当使用 `lazyById` 方法。`lazyById` 方法在内部始终检索 `id` 列大于上一块最后一个模型的那些模型：

```php
Flight::where('departed', true)
    ->lazyById(200, column: 'id')
    ->each->update(['departed' => false]);
```

你可以使用 `lazyByIdDesc` 方法，根据 `id` 的降序来过滤结果。

<a name="cursors"></a>
### 游标

与 `lazy` 方法类似，`cursor` 方法可用于在遍历数万条 Eloquent 模型记录时，显著降低应用的内存消耗。

`cursor` 方法只会执行一次数据库查询；不过，各个 Eloquent 模型只有在真正被遍历时才会被填充。因此，在遍历游标期间，任何时刻内存中都只保留一个 Eloquent 模型。

> [!WARNING]
> 由于 `cursor` 方法在内存中一次只持有一个 Eloquent 模型，它无法预加载关联。如果你需要预加载关联，请考虑改用 [`lazy` 方法](#chunking-using-lazy-collections)。

在内部，`cursor` 方法使用 PHP [生成器](https://www.php.net/manual/en/language.generators.overview.php)来实现这一功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 返回一个 `Illuminate\Support\LazyCollection` 实例。[Lazy Collection](/docs/{{version}}/collections#lazy-collections) 允许你使用普通 Laravel 集合上提供的许多集合方法，同时每次只将一个模型加载到内存中：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

虽然 `cursor` 方法使用的内存远少于常规查询（因为内存中一次只持有一个 Eloquent 模型），但它最终仍会耗尽内存。这是因为 [PHP 的 PDO 驱动会在内部把所有原始查询结果缓存在其缓冲区中](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果你要处理非常大量的 Eloquent 记录，请考虑改用 [`lazy` 方法](#chunking-using-lazy-collections)。

<a name="advanced-subqueries"></a>
### 高级子查询

<a name="subquery-selects"></a>
#### 子查询 select

Eloquent 还提供高级子查询支持，允许你在单次查询中从关联表提取信息。例如，假设我们有一张航班 `destinations`（目的地）表和一张飞往这些目的地的 `flights`（航班）表。`flights` 表包含一个 `arrived_at` 列，表示航班到达目的地的时间。

利用查询构造器 `select` 和 `addSelect` 方法所支持的子查询功能，我们可以通过单次查询，检索所有目的地以及最近到达该目的地的航班名称：

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

此外，查询构造器的 `orderBy` 函数也支持子查询。继续以航班为例，我们可以利用这一功能，根据最近一班航班到达目的地的时间对所有目的地排序。同样，这可以在执行单次数据库查询的情况下完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

<a name="retrieving-single-models"></a>
## 检索单个模型 / 聚合结果

除了检索匹配给定查询的所有记录之外，你还可以使用 `find`、`first` 或 `firstWhere` 方法检索单条记录。这些方法不返回模型集合，而是返回单个模型实例：

```php
use App\Models\Flight;

// 通过主键检索模型...
$flight = Flight::find(1);

// 检索匹配查询约束的第一个模型...
$flight = Flight::where('active', 1)->first();

// 检索匹配查询约束的第一个模型的另一种写法...
$flight = Flight::firstWhere('active', 1);
```

有时你可能希望在未找到结果时执行其他操作。`findOr` 和 `firstOr` 方法会返回单个模型实例；如果没有找到结果，则执行给定的闭包。闭包返回的值将被视为方法的返回结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

<a name="not-found-exceptions"></a>
#### 未找到异常

有时你可能希望在找不到模型时抛出异常。这在路由或控制器中尤其有用。`findOrFail` 和 `firstOrFail` 方法会检索查询的第一个结果；不过，如果没有找到结果，将抛出 `Illuminate\Database\Eloquent\ModelNotFoundException`：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果 `ModelNotFoundException` 未被捕获，404 HTTP 响应将自动发回给客户端：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

<a name="retrieving-or-creating-models"></a>
### 检索或创建模型

`firstOrCreate` 方法会尝试根据给定的列 / 值对来定位数据库记录。如果在数据库中找不到该模型，则会插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并而成。

`firstOrNew` 方法与 `firstOrCreate` 类似，会尝试根据给定的属性在数据库中定位匹配的记录。不过，如果没有找到模型，则会返回一个新的模型实例。注意，`firstOrNew` 返回的模型尚未持久化到数据库，你需要手动调用 `save` 方法来持久化它：

```php
use App\Models\Flight;

// 按名称检索航班，不存在则创建它...
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// 按名称检索航班，不存在则以给定的 name、delayed 和 arrival_time 属性创建它...
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// 按名称检索航班，不存在则实例化一个新的 Flight 实例...
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// 按名称检索航班，不存在则以给定的 name、delayed 和 arrival_time 属性实例化...
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

<a name="retrieving-aggregates"></a>
### 检索聚合结果

在与 Eloquent 模型交互时，你还可以使用 Laravel [查询构造器](/docs/{{version}}/queries)提供的 `count`、`sum`、`max` 及其他[聚合方法](/docs/{{version}}/queries#aggregates)。如你所料，这些方法返回的是标量值，而非 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

<a name="inserting-and-updating-models"></a>
## 插入与更新模型

<a name="inserts"></a>
### 插入

当然，使用 Eloquent 时，我们不只是需要从数据库中检索模型，还需要插入新记录。所幸，Eloquent 让这一切变得非常简单。要向数据库插入新记录，你应当实例化一个新的模型实例，并在模型上设置属性。然后，调用模型实例上的 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 将新航班存储到数据库。
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

在本例中，我们将传入的 HTTP 请求中的 `name` 字段赋值给 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，一条记录将被插入数据库。模型的 `created_at` 和 `updated_at` 时间戳会在调用 `save` 方法时自动设置，因此无需手动设置。

此外，你还可以使用 `create` 方法，通过一条 PHP 语句来「保存」新模型。`create` 方法会返回插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护，免受批量赋值漏洞的影响。要了解有关批量赋值的更多信息，请查阅[批量赋值文档](#mass-assignment)。

<a name="updates"></a>
### 更新

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，你应当先检索它，然后设置想要更新的属性，再调用模型的 `save` 方法。同样，`updated_at` 时间戳会被自动更新，因此无需手动设置它的值：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->name = 'Paris to London';

$flight->save();
```

有时，你可能需要更新现有模型，或者在不存在匹配模型时创建新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在一条 `departure` 出发地为 `Oakland`、`destination` 目的地为 `San Diego` 的航班记录，其 `price` 和 `discounted` 列将被更新。如果不存在这样的航班，则会创建一条新航班记录，其属性由第一个参数数组与第二个参数数组合并而成：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

在使用 `firstOrCreate` 或 `updateOrCreate` 等方法时，你可能无法确定究竟是创建了新模型，还是更新了现有模型。`wasRecentlyCreated` 属性指示模型是否在其当前生命周期内被创建：

```php
$flight = Flight::updateOrCreate(
    // ...
);

if ($flight->wasRecentlyCreated) {
    // 插入了新的航班记录...
}
```

<a name="mass-updates"></a>
#### 批量更新

还可以对匹配给定查询的模型执行更新。在本例中，所有 `active` 且 `destination` 为 `San Diego` 的航班都将被标记为延误：

```php
Flight::where('active', 1)
    ->where('destination', 'San Diego')
    ->update(['delayed' => 1]);
```

`update` 方法接受一个由列和值组成的数组，表示应当更新的列。`update` 方法会返回受影响的行数。

> [!WARNING]
> 通过 Eloquent 执行批量更新时，被更新模型的 `saving`、`saved`、`updating` 和 `updated` 模型事件不会被触发。这是因为执行批量更新时，模型从未被真正检索出来。

<a name="examining-attribute-changes"></a>
#### 检查属性变化

Eloquent 提供了 `isDirty`、`isClean` 和 `wasChanged` 方法，用于检查模型的内部状态，并确定其属性自模型最初被检索以来发生了哪些变化。

`isDirty` 方法确定模型的任何属性在模型被检索之后是否发生了变化。你可以向 `isDirty` 方法传递特定的属性名或属性数组，以确定这些属性是否「脏」了。`isClean` 方法确定某个属性自模型被检索以来是否保持不变。该方法也接受一个可选的属性参数：

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

`wasChanged` 方法确定在当前请求周期内，模型最后一次保存时是否有属性发生了变化。如有需要，你可以传入属性名来查看某个特定属性是否发生了变化：

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

`getOriginal` 方法返回一个包含模型原始属性的数组，而不考虑模型自被检索以来发生的任何变化。如有需要，你可以传入特定的属性名来获取某个属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = 'Jack';
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // 原始属性数组...
```

`getChanges` 方法返回一个数组，包含模型最后一次保存时发生变化的属性；而 `getPrevious` 方法返回一个数组，包含模型最后一次保存之前的原始属性值：

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
### 批量赋值

你可以使用 `create` 方法，通过一条 PHP 语句来「保存」新模型。该方法会返回插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护，免受批量赋值漏洞的影响。

批量赋值漏洞发生在用户传递了意料之外的 HTTP 请求字段，而该字段更改了你未曾预期的数据库列时。例如，恶意用户可能通过 HTTP 请求发送一个 `is_admin` 参数，该参数随后被传给模型的 `create` 方法，从而让该用户将自己提升为管理员。

因此，首先你应当定义哪些模型属性允许批量赋值。这可以通过模型上的 `$fillable` 属性来实现。例如，我们来让 `Flight` 模型的 `name` 属性可以批量赋值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 可以批量赋值的属性。
     *
     * @var array<int, string>
     */
    protected $fillable = ['name'];
}
```

指定可批量赋值的属性之后，你就可以使用 `create` 方法在数据库中插入新记录了。`create` 方法会返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果你已经拥有一个模型实例，可以使用 `fill` 方法用一组属性来填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

<a name="mass-assignment-json-columns"></a>
#### 批量赋值与 JSON 列

批量赋值 JSON 列时，每个列的可批量赋值键都必须在模型的 `$fillable` 数组中指定。出于安全考虑，Laravel 不支持在使用 `guarded` 属性时更新嵌套的 JSON 属性：

```php
/**
 * 可以批量赋值的属性。
 *
 * @var array<int, string>
 */
protected $fillable = [
    'options->enabled',
];
```

<a name="allowing-mass-assignment"></a>
#### 允许批量赋值

如果你想让所有属性都可以批量赋值，可以将模型的 `$guarded` 属性定义为空数组。如果你选择解除模型的保护，就应当格外小心，始终手工构建传给 Eloquent 的 `fill`、`create` 和 `update` 方法的数组：

```php
/**
 * 不可批量赋值的属性。
 *
 * @var array<string>
 */
protected $guarded = [];
```

<a name="mass-assignment-exceptions"></a>
#### 批量赋值异常

默认情况下，执行批量赋值操作时，未包含在 `$fillable` 数组中的属性会被静默丢弃。在生产环境中，这是符合预期的行为；但在本地开发中，这会让人困惑，搞不清模型的更改为什么没有生效。

如果你愿意，可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充不可填充的属性时抛出异常。通常，该方法应当在应用的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导所有应用服务。
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

<a name="upserts"></a>
### Upsert

Eloquent 的 `upsert` 方法可用于在单次原子操作中更新或创建记录。该方法的第一个参数由要插入或更新的值组成，第二个参数列出在关联表中唯一标识记录的列。第三个也是最后一个参数是一个列数组，指定当数据库中已存在匹配记录时应当更新哪些列。如果模型启用了时间戳，`upsert` 方法会自动设置 `created_at` 和 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]
> 除 SQL Server 之外的所有数据库，都要求 `upsert` 方法第二个参数中的列具有「primary」或「unique」索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，始终使用表的「primary」和「unique」索引来检测已存在的记录。

<a name="deleting-models"></a>
## 删除模型

要删除模型，你可以在模型实例上调用 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

<a name="deleting-an-existing-model-by-its-primary-key"></a>
#### 通过主键删除现有模型

在上面的示例中，我们在调用 `delete` 方法之前先从数据库检索了模型。不过，如果你知道模型的主键，可以直接调用 `destroy` 方法删除模型，而无需显式检索它。除了接受单个主键之外，`destroy` 方法还接受多个主键、主键数组或主键[集合](/docs/{{version}}/collections)：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

如果你在使用[软删除模型](#soft-deleting)，可以通过 `forceDestroy` 方法永久删除模型：

```php
Flight::forceDestroy(1);
```

> [!WARNING]
> `destroy` 方法会单独加载每个模型并调用 `delete` 方法，以便为每个模型正确派发 `deleting` 和 `deleted` 事件。

<a name="deleting-models-using-queries"></a>
#### 通过查询删除模型

当然，你也可以构建 Eloquent 查询来删除所有匹配查询条件的模型。在本例中，我们将删除所有被标记为停用的航班。与批量更新一样，批量删除不会为被删除的模型派发模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

要删除表中的所有模型，你应当执行一个不带任何条件的查询：

```php
$deleted = Flight::query()->delete();
```

> [!WARNING]
> 通过 Eloquent 执行批量删除语句时，被删除模型的 `deleting` 和 `deleted` 模型事件不会被派发。这是因为执行删除语句时，模型从未被真正检索出来。

<a name="soft-deleting"></a>
### 软删除

除了从数据库中真正移除记录之外，Eloquent 还可以「软删除」模型。模型被软删除时，实际上并没有从数据库中移除，而是在模型上设置一个 `deleted_at` 属性，标记模型被「删除」的日期和时间。要为模型启用软删除，请在模型上添加 `Illuminate\Database\Eloquent\SoftDeletes` Trait：

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
> `SoftDeletes` Trait 会自动为你将 `deleted_at` 属性转换为 `DateTime` / `Carbon` 实例。

你还应当向数据库表添加 `deleted_at` 列。Laravel [结构生成器](/docs/{{version}}/migrations)包含一个创建该列的辅助方法：

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

现在，当你在模型上调用 `delete` 方法时，`deleted_at` 列将被设置为当前的日期和时间。不过，模型的数据库记录仍会保留在表中。查询使用了软删除的模型时，软删除的模型会自动从所有查询结果中排除。

要判断给定模型实例是否已被软删除，可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

<a name="restoring-soft-deleted-models"></a>
#### 恢复软删除的模型

有时你可能希望「取消删除」一个软删除的模型。要恢复软删除的模型，你可以在模型实例上调用 `restore` 方法。`restore` 方法会将模型的 `deleted_at` 列设置为 `null`：

```php
$flight->restore();
```

你也可以在查询中使用 `restore` 方法来恢复多个模型。同样，与其他「批量」操作一样，这不会为被恢复的模型派发任何模型事件：

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

有时你可能需要真正从数据库中移除模型。你可以使用 `forceDelete` 方法，从数据库表中永久移除一个软删除的模型：

```php
$flight->forceDelete();
```

在构建 Eloquent 关联查询时，同样可以使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

<a name="querying-soft-deleted-models"></a>
### 查询软删除的模型

<a name="including-soft-deleted-models"></a>
#### 包含软删除的模型

如前所述，软删除的模型会自动从查询结果中排除。不过，你可以通过在查询上调用 `withTrashed` 方法，强制将软删除的模型包含在查询结果中：

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
#### 仅检索软删除的模型

`onlyTrashed` 方法将**只**检索软删除的模型：

```php
$flights = Flight::onlyTrashed()
    ->where('airline_id', 1)
    ->get();
```

<a name="pruning-models"></a>
## 修剪模型

有时你可能希望定期删除不再需要的模型。为此，你可以为希望定期修剪的模型添加 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` Trait。将其中一个 Trait 添加到模型后，实现一个 `prunable` 方法，返回一个 Eloquent 查询构造器，用于解析出不再需要的模型：

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
     * 获取可修剪模型的查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

将模型标记为 `Prunable` 时，你还可以在模型上定义一个 `pruning` 方法。该方法会在模型被删除之前调用。这个方法可以用于在模型从数据库中被永久移除之前，删除与模型关联的其他资源，例如已存储的文件：

```php
/**
 * 准备修剪模型。
 */
protected function pruning(): void
{
    // ...
}
```

配置好可修剪模型之后，你应当在应用的 `routes/console.php` 文件中调度 `model:prune` Artisan 命令。你可以自由选择运行该命令的合适间隔：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在幕后，`model:prune` 命令会自动检测应用 `app/Models` 目录中的「Prunable」模型。如果你的模型位于其他位置，可以使用 `--model` 选项来指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你想在修剪所有其他检测到的模型时，排除某些模型不被修剪，可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以通过带 `--pretend` 选项执行 `model:prune` 命令来测试你的 `prunable` 查询。在模拟模式下，`model:prune` 命令只会报告如果实际运行将会修剪多少条记录：

```shell
php artisan model:prune --pretend
```

> [!WARNING]
> 软删除模型如果匹配可修剪查询，将被永久删除（`forceDelete`）。

<a name="mass-pruning"></a>
#### 批量修剪

当模型标记了 `Illuminate\Database\Eloquent\MassPrunable` Trait 时，模型会通过批量删除查询从数据库中删除。因此，`pruning` 方法不会被调用，`deleting` 和 `deleted` 模型事件也不会被派发。这是因为模型在删除之前从未被真正检索出来，从而使修剪过程更加高效：

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
     * 获取可修剪模型的查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

<a name="replicating-models"></a>
## 复制模型

你可以使用 `replicate` 方法创建现有模型实例的一个未保存副本。当多个模型实例共享许多相同属性时，这个方法尤其有用：

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

要排除一个或多个属性，使其不被复制到新模型，你可以向 `replicate` 方法传递一个数组：

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

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自身的[软删除](#soft-deleting)功能就利用了全局作用域，只从数据库中检索「未删除」的模型。编写自己的全局作用域，可以提供一种便捷、简单的方式，确保针对给定模型的每个查询都获得特定的约束。

<a name="generating-scopes"></a>
#### 生成作用域

要生成新的全局作用域，你可以调用 `make:scope` Artisan 命令，它会把生成的作用域放置在应用的 `app/Models/Scopes` 目录中：

```shell
php artisan make:scope AncientScope
```

<a name="writing-global-scopes"></a>
#### 编写全局作用域

编写全局作用域非常简单。首先，使用 `make:scope` 命令生成一个实现了 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其他类型的子句：

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    /**
     * 将作用域应用到给定的 Eloquent 查询构造器。
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->minus(years: 2000));
    }
}
```

> [!NOTE]
> 如果你的全局作用域会向查询的 select 子句添加列，你应当使用 `addSelect` 方法而非 `select` 方法。这样可以避免无意中替换查询已有的 select 子句。

<a name="applying-global-scopes"></a>
#### 应用全局作用域

要将全局作用域分配给模型，只需在模型上放置 `ScopedBy` 属性：

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

或者，你可以通过重写模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法来手动注册全局作用域。`addGlobalScope` 方法接受作用域实例作为其唯一参数：

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

将上面的示例中的作用域添加到 `App\Models\User` 模型后，调用 `User::all()` 方法将执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

<a name="anonymous-global-scopes"></a>
#### 匿名全局作用域

Eloquent 还允许你使用闭包定义全局作用域，这对于不值得单独创建一个类的简单作用域尤其有用。使用闭包定义全局作用域时，你应当将自己选择的作用域名称作为 `addGlobalScope` 方法的第一个参数提供：

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
            $builder->where('created_at', '<', now()->minus(years: 2000));
        });
    }
}
```

<a name="removing-global-scopes"></a>
#### 移除全局作用域

如果你想为给定查询移除某个全局作用域，可以使用 `withoutGlobalScope` 方法。该方法接受全局作用域的类名作为其唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果全局作用域是使用闭包定义的，你应当传递为该全局作用域指定的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你想移除查询的部分甚至全部全局作用域，可以使用 `withoutGlobalScopes` 和 `withoutGlobalScopesExcept` 方法：

```php
// 移除所有全局作用域...
User::withoutGlobalScopes()->get();

// 移除部分全局作用域...
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();

// 移除给定的全局作用域之外的所有全局作用域...
User::withoutGlobalScopesExcept([
    SecondScope::class,
])->get();
```

<a name="local-scopes"></a>
### 局部作用域

局部作用域允许你定义一组通用的查询约束，并在整个应用中轻松复用。例如，你可能需要频繁检索所有被视为「受欢迎」的用户。要定义作用域，请为 Eloquent 方法添加 `Scope` 属性。

作用域应当始终返回同一个查询构造器实例或 `void`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 将查询作用域限定为只包含受欢迎的用户。
     */
    #[Scope]
    protected function popular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * 将查询作用域限定为只包含活跃的用户。
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

<a name="utilizing-a-local-scope"></a>
#### 使用局部作用域

定义好作用域之后，你就可以在查询模型时调用作用域方法。你甚至可以链式调用多个作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

要通过 `or` 查询操作符组合多个 Eloquent 模型作用域，可能需要使用闭包来实现正确的[逻辑分组](/docs/{{version}}/queries#logical-grouping)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

不过，这样写比较繁琐，因此 Laravel 提供了一个「高阶」`orWhere` 方法，让你无需使用闭包即可流畅地链式调用作用域：

```php
$users = User::popular()->orWhere->active()->get();
```

<a name="dynamic-scopes"></a>
#### 动态作用域

有时你可能希望定义一个接受参数的作用域。首先，只需在作用域方法的签名中添加你的额外参数。作用域参数应当定义在 `$query` 参数之后：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 将查询作用域限定为只包含给定类型的用户。
     */
    #[Scope]
    protected function ofType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

将所需的参数添加到作用域方法签名之后，你就可以在调用作用域时传递参数了：

```php
$users = User::ofType('admin')->get();
```

<a name="pending-attributes"></a>
### 待定属性

如果你想通过作用域来创建模型，并让模型拥有与作用域约束条件相同的属性，可以在构建作用域查询时使用 `withAttributes` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 将查询作用域限定为只包含草稿。
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

`withAttributes` 方法会使用给定的属性向查询添加 `where` 条件，同时还会将这些属性添加到通过该作用域创建的任何模型上：

```php
$draft = Post::draft()->create(['title' => 'In Progress']);

$draft->hidden; // true
```

要让 `withAttributes` 方法不向查询添加 `where` 条件，你可以将 `asConditions` 参数设置为 `false`：

```php
$query->withAttributes([
    'hidden' => true,
], asConditions: false);
```

<a name="comparing-models"></a>
## 比较模型

有时你可能需要判断两个模型是否「相同」。`is` 和 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、表和数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
```

在使用 `belongsTo`、`hasOne`、`morphTo` 和 `morphOne` [关联](/docs/{{version}}/eloquent-relationships)时，同样可以使用 `is` 和 `isNot` 方法。当你想比较一个关联模型而又不想发起查询来检索该模型时，这个方法尤其有用：

```php
if ($post->author()->is($user)) {
    // ...
}
```

<a name="events"></a>
## 事件

> [!NOTE]
> 想将你的 Eloquent 事件直接广播到客户端应用？请查看 Laravel 的[模型事件广播](/docs/{{version}}/broadcasting#model-broadcasting)。

Eloquent 模型会派发多个事件，允许你介入模型生命周期的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 和 `replicating`。

`retrieved` 事件在现有模型从数据库中被检索出来时派发。当新模型第一次被保存时，`creating` 和 `created` 事件将被派发。当现有模型被修改并调用 `save` 方法时，`updating` / `updated` 事件将被派发。当模型被创建或更新时，`saving` / `saved` 事件将被派发，即使模型的属性没有发生变化。以 `-ing` 结尾的事件在模型的任何变更被持久化之前派发，而以 `-ed` 结尾的事件在模型的变更被持久化之后派发。

要开始监听模型事件，请在你的 Eloquent 模型上定义 `$dispatchesEvents` 属性。该属性将 Eloquent 模型生命周期的各个节点映射到你自己的[事件类](/docs/{{version}}/events)。每个模型事件类都应预期通过其构造函数接收受影响模型的一个实例：

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

定义并映射好 Eloquent 事件之后，你就可以使用[事件监听器](/docs/{{version}}/events#defining-listeners)来处理这些事件了。

> [!WARNING]
> 通过 Eloquent 执行批量更新或删除查询时，受影响模型的 `saved`、`updated`、`deleting` 和 `deleted` 模型事件不会被派发。这是因为执行批量更新或删除时，模型从未被真正检索出来。

<a name="events-using-closures"></a>
### 使用闭包

除了使用自定义事件类之外，你还可以注册在派发各种模型事件时执行的闭包。通常，你应当在模型的 `booted` 方法中注册这些闭包：

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

如有需要，你可以在注册模型事件时使用[可排队的匿名事件监听器](/docs/{{version}}/events#queuable-anonymous-event-listeners)。这会指示 Laravel 使用应用的[队列](/docs/{{version}}/queues)在后台执行模型事件监听器：

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

如果你在监听给定模型的多个事件，可以使用观察者将所有监听器归组到一个类中。观察者类的方法名反映了你希望监听的 Eloquent 事件。这些方法中的每一个都以受影响的模型作为其唯一参数。`make:observer` Artisan 命令是创建新观察者类最简单的方式：

```shell
php artisan make:observer UserObserver --model=User
```

该命令会将新的观察者放置在 `app/Observers` 目录中。如果该目录不存在，Artisan 会为你创建。新创建的观察者类似下面这样：

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

要注册观察者，你可以在相应的模型上放置 `ObservedBy` 属性：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，你可以在希望观察的模型上调用 `observe` 方法来手动注册观察者。你可以在应用的 `AppServiceProvider` 类的 `boot` 方法中注册观察者：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * 引导所有应用服务。
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

> [!NOTE]
> 观察者还可以监听其他一些事件，例如 `saving` 和 `retrieved`。这些事件已在[事件](#events)文档中说明。

<a name="observers-and-database-transactions"></a>
#### 观察者与数据库事务

当模型在数据库事务中被创建时，你可能希望指示观察者只在数据库事务提交之后才执行其事件处理器。为此，你可以在观察者上实现 `ShouldHandleEventsAfterCommit` 接口。如果没有正在进行的数据库事务，事件处理器将立即执行：

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

有时你可能需要临时「静默」某个模型触发的所有事件。你可以使用 `withoutEvents` 方法来实现。`withoutEvents` 方法接受一个闭包作为其唯一参数。在这个闭包中执行的任何代码都不会派发模型事件，且闭包返回的任何值都会由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

<a name="saving-a-single-model-without-events"></a>
#### 不触发事件保存单个模型

有时你可能希望「保存」给定模型而不派发任何事件。你可以使用 `saveQuietly` 方法来实现：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你还可以在不派发任何事件的情况下，「更新」、「删除」、「软删除」、「恢复」和「复制」给定模型：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```
