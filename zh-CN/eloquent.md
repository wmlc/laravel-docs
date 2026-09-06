# Eloquent：入门

## 简介

Laravel 内置了 Eloquent，这是一个对象关系映射器（ORM），让你与数据库交互成为一种享受。使用 Eloquent 时，每个数据库表都有一个对应的"模型（Model）"，用于与该表交互。除了从数据库表中检索记录外，Eloquent 模型还允许你向表中插入、更新和删除记录。

> [!NOTE]
> 在开始之前，请确保在应用的 `config/database.php` 配置文件中配置好数据库连接。有关配置数据库的更多信息，请查阅 [数据库配置文档](/topic/Laravel%2013.x/kl9no87vz4.html)。

## 生成模型类

首先，我们来创建一个 Eloquent 模型。模型通常位于 `app\Models` 目录中，并继承自 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html) 来生成新模型：

```shell
php artisan make:model Flight
```

如果你想在生成模型的同时生成一份 [数据库迁移](/topic/Laravel%2013.x/x3vo0g4vm1.html)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

在生成模型时，你还可以生成各种其它类型的类，例如工厂、数据填充、策略、控制器和表单请求。此外，这些选项可以组合使用，一次性创建多个类：

```shell
# 生成模型和 FlightFactory 类……
php artisan make:model Flight --factory
php artisan make:model Flight -f

# 生成模型和 FlightSeeder 类……
php artisan make:model Flight --seed
php artisan make:model Flight -s

# 生成模型和 FlightController 类……
php artisan make:model Flight --controller
php artisan make:model Flight -c

# 生成模型、FlightController 资源类和表单请求类……
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成模型和 FlightPolicy 类……
php artisan make:model Flight --policy

# 生成模型、数据库迁移、工厂、数据填充、策略、控制器和表单请求……
php artisan make:model Flight --all
php artisan make:model Flight -a

# 生成中间表模型……
php artisan make:model Member --pivot
php artisan make:model Member -p
```

#### 检视模型

有时仅通过通读代码，很难确定一个模型所有可用的属性和关联。此时你可以尝试 `model:show` Artisan 命令，它会方便地概览模型的所有属性和关系：

```shell
php artisan model:show Flight
```

## Eloquent 模型约定

由 `make:model` 命令生成的模型会放置在 `app/Models` 目录中。我们来检视一个基础的模型类，并讨论 Eloquent 的一些关键约定：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    // ...
}
```

### 表名

看完上面的示例，你可能已经注意到，我们并没有告诉 Eloquent 哪个数据库表对应我们的 `Flight` 模型。按照约定，类的"蛇形式（snake case）"复数名称会被用作表名，除非显式指定了其它名称。因此，在此例中，Eloquent 会假设 `Flight` 模型将记录存储在 `flights` 表中，而 `AirTrafficController` 模型会将记录存储在 `air_traffic_controllers` 表中。

如果你的模型对应的数据库表不符合这个约定，你可以使用 `Table` 属性手动指定模型的表名：

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

### 主键

Eloquent 还会假设每个模型对应的数据库表都有一个名为 `id` 的主键列。如有必要，你可以使用 `Table` 属性上的 `key` 参数来指定一个不同的列作为模型的主键：

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

此外，Eloquent 假设主键是一个自增的整数值，这意味着 Eloquent 会自动将主键转换为整数。如果你希望使用非自增或非数字的主键，应该在 `Table` 属性上指定 `keyType` 和 `incrementing` 参数：

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

#### "复合"主键

Eloquent 要求每个模型至少有一个可唯一标识、能作为其主键的"ID"。Eloquent 模型不支持"复合"主键。不过，除了表的可唯一标识主键外，你可以自由地为数据库表添加额外的多列唯一索引。

### UUID 与 ULID 键

除了使用自增整数作为 Eloquent 模型的主键外，你也可以选择使用 UUID。UUID 是 36 个字符长的、全球唯一的字母数字标识符。

如果你希望模型使用 UUID 键而不是自增整数键，可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` trait。当然，你应该确保模型拥有一个 [等价于 UUID 的主键列](/topic/Laravel%2013.x/x3vo0g4vm1.html)：

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

默认情况下，`HasUuids` trait 会为你的模型生成 [UUIDv7](/topic/Laravel%2013.x/2ev86royor.html) 标识符。这些 UUID 在索引数据库存储方面更高效，因为它们可以按字典序排序。

你可以通过在模型上定义 `newUniqueId` 方法，来覆盖给定模型的 UUID 生成过程。此外，你还可以通过在模型上定义 `uniqueIds` 方法，指定哪些列应接收 UUID：

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
 * 获取应接收唯一标识符的列。
 *
 * @return array<int, string>
 */
public function uniqueIds(): array
{
    return ['id', 'discount_code'];
}
```

如果你愿意，也可以不使用 UUID 而改用"ULID"。ULID 与 UUID 类似；不过，它们只有 26 个字符长。与有序 UUID 一样，ULID 可字典序排序，便于高效地进行数据库索引。要使用 ULID，你应该在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` trait。你还应该确保模型拥有一个 [等价于 ULID 的主键列](/topic/Laravel%2013.x/x3vo0g4vm1.html)：

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

### 时间戳

默认情况下，Eloquent 期望模型的对应数据库表上存在 `created_at` 和 `updated_at` 列。当模型被创建或更新时，Eloquent 会自动设置这些列的值。如果你不希望这些列由 Eloquent 自动管理，可以在模型的 `Table` 属性上将 `timestamps` 设置为 `false`：

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

如果你只需要定义一个日期格式，可以使用 `DateFormat` 属性：

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
     * “created at” 列的名称。
     *
     * @var string|null
     */
    public const CREATED_AT = 'creation_date';

    /**
     * “updated at” 列的名称。
     *
     * @var string|null
     */
    public const UPDATED_AT = 'updated_date';
}
```

如果你希望在模型不修改其 `updated_at` 时间戳的情况下执行模型操作，可以在传给 `withoutTimestamps` 方法的闭包内操作模型：

```php
Model::withoutTimestamps(fn () => $post->increment('reads'));
```

### 数据库连接

默认情况下，所有 Eloquent 模型都会使用为应用配置的默认数据库连接。如果你希望在与某个特定模型交互时指定不同的连接，可以使用 `Connection` 属性：

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

### 默认属性值

默认情况下，新实例化的模型实例不包含任何属性值。如果你希望为模型的某些属性定义默认值，可以在模型上定义一个 `$attributes` 属性。放置在 `$attributes` 数组中的属性值应采用其原始的、"可存储"格式，就像刚从数据库读取一样：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型的默认属性值。
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'options' => '[]',
        'delayed' => false,
    ];
}
```

### 配置 Eloquent 严格度

Laravel 提供了若干方法，让你能够在各种情况下配置 Eloquent 的行为和"严格度"。

首先，`preventLazyLoading` 方法接受一个可选的布尔参数，用于指示是否应阻止懒加载。例如，你可能只希望在非生产环境中禁用懒加载，这样即使生产代码中意外存在懒加载的关联，你的生产环境也能继续正常运行。通常，该方法应在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，你可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充一个不可填充的属性时抛出异常。当你尝试设置一个尚未添加到模型 `fillable` 数组中的属性时，这有助于在本地开发中防止出现意外错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

## 检索模型

一旦你创建了模型以及 [其关联的数据库表](/topic/Laravel%2013.x/x3vo0g4vm1.html)，就可以开始从数据库中检索数据了。你可以将每个 Eloquent 模型视为一个强大的 [查询构造器（Query Builder）](/topic/Laravel%2013.x/xpv525gv86.html)，让你能够流畅地查询与该模型关联的数据库表。模型的 `all` 方法会检索模型关联数据库表中的所有记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

#### 构建查询

Eloquent 的 `all` 方法会返回模型表中的所有结果。不过，由于每个 Eloquent 模型都是一个 [查询构造器](/topic/Laravel%2013.x/xpv525gv86.html)，你可以向查询添加额外的约束，然后调用 `get` 方法来检索结果：

```php
$flights = Flight::where('active', 1)
    ->orderBy('name')
    ->limit(10)
    ->get();
```

> [!NOTE]
> 由于 Eloquent 模型就是查询构造器，你应该查阅 Laravel [查询构造器](/topic/Laravel%2013.x/xpv525gv86.html) 提供的所有方法。在编写 Eloquent 查询时，你可以使用其中任意方法。

#### 刷新模型

如果你已经有一个从数据库检索到的 Eloquent 模型实例，可以使用 `fresh` 和 `refresh` 方法来"刷新"该模型。`fresh` 方法会重新从数据库中检索该模型。现有的模型实例不会受到影响：

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

如果你需要在事务中刷新模型并获取悲观锁，可以使用 `refreshForUpdate` 方法。该方法会使用 `FOR UPDATE` 锁重新加载模型：

```php
DB::transaction(function () use ($flight) {
    $flight->refreshForUpdate();

    // 更新被锁定的模型……
});
```

### 集合

正如我们所见，`all` 和 `get` 等 Eloquent 方法会从数据库中检索多条记录。不过，这些方法返回的并非普通的 PHP 数组。相反，它们返回的是 `Illuminate\Database\Eloquent\Collection` 的一个实例。

Eloquent 的 `Collection` 类继承自 Laravel 基础的 `Illuminate\Support\Collection` 类，后者提供了 [一系列实用方法](/topic/Laravel%2013.x/4rvgn63ydj.html) 用于处理数据集合。例如，`reject` 方法可用于根据被调用闭包的结果，从集合中移除模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法外，Eloquent 集合类还提供了 [一些额外的方法](/topic/Laravel%2013.x/d6vroqrv3g.html)，这些方法专门用于处理 Eloquent 模型的集合。

由于 Laravel 的所有集合都实现了 PHP 的可迭代接口，你可以像遍历数组一样遍历集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

### 分块处理结果

如果你尝试通过 `all` 或 `get` 方法加载数万条 Eloquent 记录，应用可能会耗尽内存。你可以使用 `chunk` 方法更高效地处理大量模型，而不是使用这些方法。

`chunk` 方法会检索一部分 Eloquent 模型，将它们传给一个闭包进行处理。由于每次只检索当前的 Eloquent 模型块，`chunk` 方法在处理大量模型时能显著减少内存占用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传给 `chunk` 方法的第一个参数是你希望每个"块"接收的记录数。作为第二个参数传入的闭包会为从数据库检索到的每个块调用。每检索一个传给闭包的模型块，都会执行一次数据库查询。

如果你基于某个列来过滤 `chunk` 方法的结果，同时又在遍历结果时更新该列，你应该使用 `chunkById` 方法。在这些场景下使用 `chunk` 方法可能会导致意外且不一致的结果。在内部，`chunkById` 方法会始终检索 `id` 列大于前一个块中最后一个模型的记录：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, column: 'id');
```

由于 `chunkById` 和 `lazyById` 方法会向所执行的查询添加它们自己的"where"条件，你通常应该 [逻辑分组](/topic/Laravel%2013.x/xpv525gv86.html) 你自己的条件，将它们放在一个闭包内：

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

### 使用惰性集合分块

`lazy` 方法的工作方式类似于 `chunk` 方法，因为其在底层也是分块执行查询。不过，`lazy` 方法并非将每个块直接传入回调，而是返回一个扁平化的 Eloquent 模型 [LazyCollection](/topic/Laravel%2013.x/4rvgn63ydj.html)，让你能够像处理单个流一样与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果你基于某个列来过滤 `lazy` 方法的结果，同时又在遍历结果时更新该列，应该使用 `lazyById` 方法。在内部，`lazyById` 方法会始终检索 `id` 列大于前一个块中最后一个模型的记录：

```php
Flight::where('departed', true)
    ->lazyById(200, column: 'id')
    ->each->update(['departed' => false]);
```

你可以使用 `lazyByIdDesc` 方法，基于 `id` 的降序来过滤结果。

### 游标

与 `lazy` 方法类似，`cursor` 方法可用于在遍历数万条 Eloquent 模型记录时，显著降低应用的内存消耗。

`cursor` 方法只会执行一次数据库查询；不过，各个 Eloquent 模型在真正被遍历到之前并不会被"水合（hydrate）"。因此，在遍历游标时，任意时刻内存中只保留一个 Eloquent 模型。

> [!WARNING]
> 由于 `cursor` 方法任意时刻在内存中只持有一个 Eloquent 模型，它无法预加载关联。如果你需要预加载关联，请考虑改用 `lazy` 方法。

在内部，`cursor` 方法使用 PHP [生成器（generators）](https://www.php.net/manual/en/language.generators.overview.php) 来实现这个功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 返回一个 `Illuminate\Support\LazyCollection` 实例。[惰性集合](/topic/Laravel%2013.x/4rvgn63ydj.html) 让你能够使用典型 Laravel 集合提供的许多集合方法，同时任意时刻只在内存中加载单个模型：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

尽管 `cursor` 方法使用的内存远少于常规查询（因为它任意时刻只在内存中保留一个 Eloquent 模型），但它最终仍会耗尽内存。这是 [由于 PHP 的 PDO 驱动会在其内部缓冲区中缓存所有原始查询结果](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果你要处理数量非常庞大的 Eloquent 记录，请考虑改用 `lazy` 方法。

### 高级子查询

#### 子查询选择

Eloquent 还提供高级子查询支持，让你能够在单个查询中从关联表中提取信息。例如，假设我们有一个 `destinations`（目的地）表和一个 `flights`（航班）表，航班飞往各个目的地。`flights` 表包含一个 `arrived_at` 列，指示航班抵达目的地的时间。

利用查询构造器的 `select` 和 `addSelect` 方法提供的子查询功能，我们可以使用单个查询，选取所有 `destinations` 以及最近抵达该目的地的航班名称：

```php
use App\Models\Destination;
use App\Models\Flight;

return Destination::addSelect(['last_flight' => Flight::select('name')
    ->whereColumn('destination_id', 'destinations.id')
    ->orderByDesc('arrived_at')
    ->limit(1)
])->get();
```

#### 子查询排序

此外，查询构造器的 `orderBy` 函数支持子查询。继续沿用我们的航班示例，我们可以利用这个功能，根据最近一趟航班抵达该目的地的时间，对所有目的地进行排序。同样，这可以在执行单个数据库查询的同时完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

## 检索单个模型 / 聚合值

除了检索匹配给定查询的所有记录外，你还可以使用 `find`、`first` 或 `firstWhere` 方法来检索单条记录。这些方法返回的是单个模型实例，而不是模型集合：

```php
use App\Models\Flight;

// 通过主键检索模型……
$flight = Flight::find(1);

// 检索匹配查询约束的第一条模型……
$flight = Flight::where('active', 1)->first();

// 检索匹配查询约束的第一条模型的替代方式……
$flight = Flight::firstWhere('active', 1);
```

有时你可能在找不到结果时希望执行一些其它操作。`findOr` 和 `firstOr` 方法会返回单个模型实例；如果找不到结果，则执行给定的闭包。闭包返回的值会被视为该方法的结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

#### 未找到异常

有时你可能在找不到模型时希望抛出异常。这在路由或控制器中尤其有用。`findOrFail` 和 `firstOrFail` 方法会检索查询的第一条结果；不过，如果找不到结果，会抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果 `ModelNotFoundException` 未被捕获，会自动向客户端发送一个 404 HTTP 响应：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

### 检索或创建模型

`firstOrCreate` 方法会尝试使用给定的列 / 值对来定位数据库记录。如果在数据库中找不到该模型，则会插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并后得到。

`firstOrNew` 方法与 `firstOrCreate` 类似，也会尝试定位匹配给定属性的数据库记录。不过，如果找不到模型，会返回一个新模型实例。注意，`firstOrNew` 返回的模型尚未持久化到数据库。你需要手动调用 `save` 方法将其持久化：

```php
use App\Models\Flight;

// 按名称检索航班，如果不存在则创建……
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或带着 name、delayed 和 arrival_time 属性创建它……
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// 按名称检索航班，或实例化一个新的 Flight 实例……
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或带着 name、delayed 和 arrival_time 属性实例化……
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

### 检索聚合值

在与 Eloquent 模型交互时，你还可以使用 Laravel [查询构造器](/topic/Laravel%2013.x/xpv525gv86.html) 提供的 `count`、`sum`、`max` 等 [聚合方法](/topic/Laravel%2013.x/xpv525gv86.html)。正如你所预期的，这些方法返回的是标量值，而不是 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

## 插入和更新模型

### 插入

当然，使用 Eloquent 时，我们不仅需要从数据库中检索模型。我们还需要插入新记录。幸运的是，Eloquent 让这变得简单。要向数据库插入新记录，你应该实例化一个新的模型实例，并在模型上设置属性。然后，调用模型实例的 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 将一个新航班存储到数据库中。
     */
    public function store(Request $request): RedirectResponse
    {
        // 校验请求……

        $flight = new Flight;

        $flight->name = $request->name;

        $flight->save();

        return redirect('/flights');
    }
}
```

在此示例中，我们将传入 HTTP 请求中的 `name` 字段赋值给了 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，会向数据库插入一条记录。模型调用 `save` 方法时会自动设置 `created_at` 和 `updated_at` 时间戳，因此无需手动设置它们。

如果你希望在数据库事务中保存模型，可以使用 `saveOrFail` 方法。如果在保存过程中抛出异常，事务会自动回滚：

```php
$flight->saveOrFail();
```

或者，你可以使用 `create` 方法，通过单条 PHP 语句"保存"一个新模型。`create` 方法会返回所插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下，所有 Eloquent 模型都受到保护，以防范批量赋值漏洞。要了解更多关于批量赋值的内容，请参阅 批量赋值文档。

### 更新

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，你应该检索它并设置任何你希望更新的属性。然后，你应该调用模型的 `save` 方法。同样，`updated_at` 时间戳会自动更新，因此无需手动设置其值：

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

有时，你可能需要更新一个已有的模型，或者如果不存在匹配的模型则创建一个新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在一个 `departure` 为 `Oakland`、`destination` 为 `San Diego` 的航班，它的 `price` 和 `discounted` 列会被更新。如果不存在这样的航班，则会创建一个新航班，其属性由第一个参数数组与第二个参数数组合并后得到：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

使用 `firstOrCreate` 或 `updateOrCreate` 等方法时，你可能不知道是创建了一个新模型还是更新了一个已有模型。`wasRecentlyCreated` 属性指示该模型是否在当前生命周期中被创建：

```php
$flight = Flight::updateOrCreate(
    // ...
);

if ($flight->wasRecentlyCreated) {
    // 插入了新航班记录……
}
```

#### 批量更新

更新也可以针对匹配给定查询的模型执行。在此示例中，所有 `active` 且 `destination` 为 `San Diego` 的航班都会被标记为延误：

```php
Flight::where('active', 1)
    ->where('destination', 'San Diego')
    ->update(['delayed' => 1]);
```

`update` 方法接受一个由列和值组成的数组，表示应该被更新的列。`update` 方法返回受影响的行数。

> [!WARNING]
> 当通过 Eloquent 执行批量更新时，被更新模型的 `saving`、`saved`、`updating` 和 `updated` 模型事件不会被触发。这是因为在执行批量更新时，模型实际上从未被检索到。

#### 检查属性变更

Eloquent 提供了 `isDirty`、`isClean` 和 `wasChanged` 方法，用于检查模型的内部状态，并判断自模型最初被检索以来其属性发生了哪些变化。

`isDirty` 方法用于判断自模型被检索以来，模型的任何属性是否发生了变化。你可以向 `isDirty` 方法传入一个特定的属性名或属性名数组，来判断是否有任何属性"变脏"。`isClean` 方法用于判断自模型被检索以来，某个属性是否保持不变。该方法同样接受一个可选的属性参数：

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

`wasChanged` 方法用于判断在当前请求周期内，模型上次保存时是否有任何属性发生了变化。如有需要，你可以传入一个属性名，以查看某个特定属性是否发生了变化：

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

`getOriginal` 方法返回一个包含模型原始属性的数组，无论模型自被检索以来发生了任何更改。如有需要，你可以传入一个特定的属性名，以获取某个特定属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = 'Jack';
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // 原始属性数组……
```

`getChanges` 方法返回一个包含模型上次保存时发生变化的属性的数组，而 `getPrevious` 方法返回一个包含模型上次保存前原始属性值的数组：

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

### 批量赋值

你可以使用 `create` 方法，通过单条 PHP 语句"保存"一个新模型。该方法会返回所插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

不过，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下，所有 Eloquent 模型都受到保护，以防范批量赋值漏洞。

批量赋值漏洞会在用户传入一个意外的 HTTP 请求字段，而该字段更改了你数据库中一个你未曾预料到的列时产生。例如，恶意用户可能通过 HTTP 请求发送一个 `is_admin` 参数，该参数随后被传给模型的 `create` 方法，从而让用户将自己提升为管理员。

因此，在开始之前，你应该定义哪些模型属性希望允许批量赋值。你可以使用模型上的 `Fillable` 属性来实现。例如，让我们让 `Flight` 模型的 `name` 属性允许批量赋值：

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

一旦你指定了哪些属性允许批量赋值，就可以使用 `create` 方法向数据库插入一条新记录。`create` 方法会返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果你已经有一个模型实例，可以使用 `fill` 方法，用一组属性来填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

#### 批量赋值与 JSON 列

在赋值 JSON 列时，每个列的批量赋值键都必须在模型的 `Fillable` 属性中指定。出于安全考虑，Laravel 在使用 `Guarded` 属性时，不支持更新嵌套的 JSON 属性：

```php
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['options->enabled'])]
class Flight extends Model
{
    // ...
}
```

#### 允许批量赋值

如果你希望让所有属性都允许批量赋值，可以在模型上使用 `Unguarded` 属性。如果你选择解除模型的防护，应该特别小心，始终手工构造传给 Eloquent `fill`、`create` 和 `update` 方法的数组：

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

#### 批量赋值异常

默认情况下，执行批量赋值操作时，未包含在 `Fillable` 属性中的属性会被静默丢弃。在生产环境中，这是预期行为；不过，在本地开发过程中，这可能会导致困惑，让人不知道为什么模型的更改没有生效。

如果你愿意，可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充一个不可填充的属性时抛出异常。通常，该方法应在应用的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

### Upserts

Eloquent 的 `upsert` 方法可用于在单个原子操作中更新或创建记录。该方法的第一个参数包含要插入或更新的值，第二个参数列出了在关联表中能唯一标识记录的列（或列组合）。该方法的第三个也是最后一个参数是一个列数组，表示如果数据库中已存在匹配记录则应被更新的列。`upsert` 方法会在模型启用了时间戳时，自动设置 `created_at` 和 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]
> 除 SQL Server 外，所有数据库都要求 `upsert` 方法的第二个参数中的列具有"主键"或"唯一"索引。此外，MariaDB 和 MySQL 数据库驱动会忽略 `upsert` 方法的第二个参数，始终使用表的主键和唯一索引来检测已有记录。

## 删除模型

要删除模型，你可以调用模型实例上的 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

如果你希望在数据库事务中删除模型，可以使用 `deleteOrFail` 方法。如果在删除过程中抛出异常，事务会自动回滚：

```php
$flight->deleteOrFail();
```

#### 通过其主键删除已有模型

在上面的示例中，我们在调用 `delete` 方法之前，先从数据库中检索了模型。不过，如果你知道模型的主键，可以在不显式检索模型的情况下，通过调用 `destroy` 方法来删除它。`destroy` 方法除了接受单个主键外，还会接受多个主键、一个主键数组或一组主键的 [集合](/topic/Laravel%2013.x/4rvgn63ydj.html)：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

如果你正在使用 软删除模型，可以通过 `forceDestroy` 方法永久删除模型：

```php
Flight::forceDestroy(1);
```

> [!WARNING]
> `destroy` 方法会逐个加载每个模型并调用 `delete` 方法，以便为每个模型正确派发 `deleting` 和 `deleted` 事件。

#### 使用查询删除模型

当然，你可以构建一个 Eloquent 查询，来删除匹配你查询条件的所有模型。在此示例中，我们将删除所有被标记为不活跃的航班。与批量更新一样，批量删除不会为被删除的模型派发模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

要删除表中的所有模型，你应该执行一个不带任何条件的查询：

```php
$deleted = Flight::query()->delete();
```

> [!WARNING]
> 当通过 Eloquent 执行批量删除语句时，不会为被删除的模型派发 `deleting` 和 `deleted` 模型事件。这是因为在执行删除语句时，模型实际上从未被检索到。

### 软删除

除了从数据库中真正移除记录外，Eloquent 还可以"软删除"模型。当模型被软删除时，它们实际上并不会从你的数据库中被移除。相反，会在模型上设置一个 `deleted_at` 属性，指示该模型被"删除"的日期和时间。要为模型启用软删除，请将 `Illuminate\Database\Eloquent\SoftDeletes` trait 添加到模型中：

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

你还应该向数据库表中添加 `deleted_at` 列。Laravel 的 [结构构建器（schema builder）](/topic/Laravel%2013.x/x3vo0g4vm1.html) 包含了一个创建该列的辅助方法：

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

现在，当你在模型上调用 `delete` 方法时，`deleted_at` 列会被设置为当前日期和时间。不过，模型的数据库记录会保留在表中。当查询一个使用软删除的模型时，被软删除的模型会自动被排除在所有查询结果之外。

要判断一个给定的模型实例是否已被软删除，可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

#### 恢复软删除模型

有时你可能希望"反删除"一个被软删除的模型。要恢复一个软删除的模型，可以在模型实例上调用 `restore` 方法。`restore` 方法会将模型的 `deleted_at` 列设置为 `null`：

```php
$flight->restore();
```

你也可以在查询中使用 `restore` 方法来恢复多个模型。同样，与其它"批量"操作一样，这不会为被恢复的模型派发任何模型事件：

```php
Flight::withTrashed()
    ->where('airline_id', 1)
    ->restore();
```

在构建 [关联](/topic/Laravel%2013.x/kpv13d298w.html) 查询时，也可以使用 `restore` 方法：

```php
$flight->history()->restore();
```

#### 永久删除模型

有时你可能需要真正地从数据库中移除一个模型。你可以使用 `forceDelete` 方法，从数据库表中永久移除一个软删除的模型：

```php
$flight->forceDelete();
```

在构建 Eloquent 关联查询时，也可以使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

### 查询软删除模型

#### 包含软删除模型

如上所述，软删除的模型会自动被排除在查询结果之外。不过，你可以通过在查询上调用 `withTrashed` 方法，强制将软删除的模型包含在查询结果中：

```php
use App\Models\Flight;

$flights = Flight::withTrashed()
    ->where('account_id', 1)
    ->get();
```

在构建 [关联](/topic/Laravel%2013.x/kpv13d298w.html) 查询时，也可以调用 `withTrashed` 方法：

```php
$flight->history()->withTrashed()->get();
```

#### 仅检索软删除模型

`onlyTrashed` 方法会检索 **仅** 软删除的模型：

```php
$flights = Flight::onlyTrashed()
    ->where('airline_id', 1)
    ->get();
```

## 修剪模型

有时你可能希望定期删除不再需要的模型。为此，你可以将 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` trait 添加到你希望定期修剪的模型中。将其中一个 trait 添加到模型后，实现一个 `prunable` 方法，该方法返回一个能解析出不再需要的模型的 Eloquent 查询构造器：

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
     * 获取可修剪的模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

将模型标记为 `Prunable` 时，你还可以在模型上定义一个 `pruning` 方法。该方法会在模型被删除之前调用。在模型被永久从数据库移除之前，这个方法对于删除与该模型关联的任何额外资源（例如已存储的文件）非常有用：

```php
/**
 * 为修剪准备模型。
 */
protected function pruning(): void
{
    // ...
}
```

配置好可修剪的模型后，你应该在应用的 `routes/console.php` 文件中调度 `model:prune` Artisan 命令。你可以自由选择该命令运行的合适间隔：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在底层，`model:prune` 命令会自动检测应用 `app/Models` 目录中的"Prunable"模型。如果你的模型位于不同的位置，可以使用 `--model` 选项来指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你希望在修剪所有其它被检测到的模型时，排除某些模型，可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以通过带 `--pretend` 选项执行 `model:prune` 命令，来测试你的 `prunable` 查询。在预演模式下，`model:prune` 命令只会报告如果命令实际运行会修剪多少条记录：

```shell
php artisan model:prune --pretend
```

> [!WARNING]
> 如果软删除模型匹配可修剪查询，它们会被永久删除（`forceDelete`）。

#### 批量修剪

当模型被标记为 `Illuminate\Database\Eloquent\MassPrunable` trait 时，模型会使用批量删除查询从数据库中删除。因此，`pruning` 方法不会被调用，也不会派发 `deleting` 和 `deleted` 模型事件。这是因为模型在删除之前实际上从未被检索到，从而让修剪过程高效得多：

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
     * 获取可修剪的模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

## 复制模型

你可以使用 `replicate` 方法创建现有模型实例的一个未保存副本。当你的模型实例共享许多相同属性时，这个方法特别有用：

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

要将一个或多个属性排除在复制到新模型之外，你可以向 `replicate` 方法传入一个数组：

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

## 查询作用域

### 全局作用域

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自身的 软删除 功能就利用了全局作用域，以只从数据库中检索"未删除"的模型。编写你自己的全局作用域，可以方便地确保对给定模型的每个查询都收到某些约束。

#### 生成作用域

要生成一个新的全局作用域，你可以调用 `make:scope` Artisan 命令，这会将生成的作用域放置在应用的 `app/Models/Scopes` 目录中：

```shell
php artisan make:scope AncientScope
```

#### 编写全局作用域

编写全局作用域很简单。首先，使用 `make:scope` 命令生成一个实现了 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其它类型的子句：

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
> 如果你的全局作用域要向查询的 select 子句中添加列，你应该使用 `addSelect` 方法，而不是 `select`。这样可以防止意外替换查询已有的 select 子句。

#### 应用全局作用域

要将一个全局作用域分配给模型，你可以简单地将 `ScopedBy` 属性放置在模型上：

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

或者，你可以通过重写模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法，手动注册全局作用域。`addGlobalScope` 方法接受你的作用域实例作为唯一参数：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 “booted” 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new AncientScope);
    }
}
```

在上面的示例中将作用域添加到 `App\Models\User` 模型后，对 `User::all()` 方法的调用将执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

#### 匿名全局作用域

Eloquent 还允许你使用闭包来定义全局作用域，这对于不值得单独成类的简单作用域特别有用。使用闭包定义全局作用域时，你应该提供一个你自己选择的作用域名称，作为 `addGlobalScope` 方法的第一个参数：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 “booted” 方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope('ancient', function (Builder $builder) {
            $builder->where('created_at', '<', now()->minus(years: 2000));
        });
    }
}
```

#### 移除全局作用域

如果你希望为给定查询移除一个全局作用域，可以使用 `withoutGlobalScope` 方法。该方法接受全局作用域的类名作为唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果你是使用闭包定义的全局作用域，你应该传入你分配给该全局作用域的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你希望移除查询的多个甚至所有全局作用域，可以使用 `withoutGlobalScopes` 和 `withoutGlobalScopesExcept` 方法：

```php
// 移除所有全局作用域……
User::withoutGlobalScopes()->get();

// 移除部分全局作用域……
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();

// 移除除给定作用域之外的所有全局作用域……
User::withoutGlobalScopesExcept([
    SecondScope::class,
])->get();
```

### 本地作用域

本地作用域允许你定义一组可复用的查询约束，方便在你的应用中随处使用。例如，你可能需要频繁检索所有被视为"受欢迎"的用户。要定义一个作用域，可以向一个 Eloquent 方法添加 `Scope` 属性。

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
     * 将查询限定为只包含受欢迎的用户。
     */
    #[Scope]
    protected function popular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * 将查询限定为只包含活跃的用户。
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

#### 使用本地作用域

一旦定义了作用域，你就可以在查询模型时调用这些作用域方法。你甚至可以链式调用各种作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

通过 `or` 查询运算符组合多个 Eloquent 模型作用域，可能需要使用闭包才能实现正确的 [逻辑分组](/topic/Laravel%2013.x/xpv525gv86.html)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

不过，由于这样可能比较繁琐，Laravel 提供了一个"高阶"的 `orWhere` 方法，让你可以不使用闭包就流畅地将作用域链接起来：

```php
$users = User::popular()->orWhere->active()->get();
```

#### 动态作用域

有时你可能希望定义一个接受参数的作用域。开始时，只需将你的额外参数添加到作用域方法的签名中。作用域参数应定义在 `$query` 参数之后：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 将查询限定为只包含给定类型的用户。
     */
    #[Scope]
    protected function ofType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

一旦你将这些预期的参数添加到了作用域方法的签名中，就可以在调用作用域时传入这些参数：

```php
$users = User::ofType('admin')->get();
```

带属性的作用域方法应为 `protected`。在模型类内部调用带属性的作用域时，应通过查询构造器实例来调用该作用域，例如 `static::query()->ofType('admin')`，以确保该调用经由 Eloquent 的作用域处理机制路由。

### 待定属性

如果你希望使用作用域创建具有与作用域约束所用相同属性的模型，可以在构建作用域查询时使用 `withAttributes` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 将查询限定为只包含草稿。
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

`withAttributes` 方法会使用给定的属性向查询添加 `where` 条件，同时还会将这些给定的属性添加到通过该作用域创建的任何模型中：

```php
$draft = Post::draft()->create(['title' => 'In Progress']);

$draft->hidden; // true
```

要指示 `withAttributes` 方法不要向查询添加 `where` 条件，可以将 `asConditions` 参数设置为 `false`：

```php
$query->withAttributes([
    'hidden' => true,
], asConditions: false);
```

## 比较模型

有时你可能需要判断两个模型是否"相同"。`is` 和 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、表和数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
```

`is` 和 `isNot` 方法在使用 `belongsTo`、`hasOne`、`morphTo` 和 `morphOne` [关联](/topic/Laravel%2013.x/kpv13d298w.html) 时也可用。当你希望在不发起查询检索该模型的情况下，比较一个关联模型时，这个方法尤其有用：

```php
if ($post->author()->is($user)) {
    // ...
}
```

## 事件

> [!NOTE]
> 想要将你的 Eloquent 事件直接广播到客户端应用？请查阅 Laravel 的 [模型事件广播](/topic/Laravel%2013.x/enyd5w197d.html)。

Eloquent 模型会派发若干事件，让你可以挂接到模型生命周期中的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 和 `replicating`。

当从数据库中检索到一个已有模型时，会派发 `retrieved` 事件。当一个新模型首次被保存时，会派发 `creating` 和 `created` 事件。当已有模型被修改并调用 `save` 方法时，会派发 `updating` / `updated` 事件。当模型被创建或更新时（即使模型的属性没有发生变化），会派发 `saving` / `saved` 事件。以 `-ing` 结尾的事件名在模型的任何更改被持久化之前派发，而以 `-ed` 结尾的事件名在模型的更改被持久化之后派发。

要开始监听模型事件，请在你的 Eloquent 模型上定义一个 `$dispatchesEvents` 属性。该属性将 Eloquent 模型生命周期的各个节点映射到你自己定义的 [事件类](/topic/Laravel%2013.x/x3vo0l4vm1.html)。每个模型事件类都应预期通过其构造函数接收一个受影响模型的实例：

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

在定义并映射好你的 Eloquent 事件后，你可以使用 [事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html) 来处理这些事件。

> [!WARNING]
> 当通过 Eloquent 执行批量更新或删除查询时，受影响的模型不会派发 `saved`、`updated`、`deleting` 和 `deleted` 模型事件。这是因为在执行批量更新或删除时，模型实际上从未被检索到。

### 使用闭包

除了使用自定义事件类，你还可以注册在派发各种模型事件时执行的闭包。通常，你应该在模型的 `booted` 方法中注册这些闭包：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的 “booted” 方法。
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // ...
        });
    }
}
```

如有需要，在注册模型事件时，你可以使用 [可排队匿名事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)。这会指示 Laravel 使用应用的 [队列](/topic/Laravel%2013.x/wevwmkz9l2.html) 在后台执行该模型事件监听器：

```php
use function Illuminate\Events\queueable;

static::created(queueable(function (User $user) {
    // ...
}));
```

### 观察者

#### 定义观察者

如果你正在监听某个给定模型上的许多事件，可以使用观察者，将你所有的监听器分组到一个类中。观察者类的方法名反映了你希望监听的 Eloquent 事件。这些方法中的每一个都只接收受影响的模型作为唯一参数。`make:observer` Artisan 命令是创建新观察者类最简单的方式：

```shell
php artisan make:observer UserObserver --model=User
```

该命令会将新的观察者放置在你的 `app/Observers` 目录中。如果该目录不存在，Artisan 会为你创建它。你新建的观察者看起来如下：

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * 处理 User “created” 事件。
     */
    public function created(User $user): void
    {
        // ...
    }

    /**
     * 处理 User “updated” 事件。
     */
    public function updated(User $user): void
    {
        // ...
    }

    /**
     * 处理 User “deleted” 事件。
     */
    public function deleted(User $user): void
    {
        // ...
    }

    /**
     * 处理 User “restored” 事件。
     */
    public function restored(User $user): void
    {
        // ...
    }

    /**
     * 处理 User “forceDeleted” 事件。
     */
    public function forceDeleted(User $user): void
    {
        // ...
    }
}
```

要注册一个观察者，你可以将 `ObservedBy` 属性放置在对应的模型上：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，你可以通过在你希望观察的模型上调用 `observe` 方法，手动注册观察者。你可以在应用的 `AppServiceProvider` 类的 `boot` 方法中注册观察者：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

> [!NOTE]
> 观察者还可以监听其它事件，例如 `saving` 和 `retrieved`。这些事件在 事件 文档中有描述。

#### 观察者数据库事务

当模型在数据库事务中被创建时，你可能希望指示观察者在数据库事务提交之后，再执行其事件处理器。你可以通过在观察者上实现 `ShouldHandleEventsAfterCommit` 接口来实现这一点。如果没有正在进行的事务，事件处理器会立即执行：

```php
<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * 处理 User “created” 事件。
     */
    public function created(User $user): void
    {
        // ...
    }
}
```

### 静音事件

你有时可能需要临时"静音"模型派发的全部事件。你可以使用 `withoutEvents` 方法来实现。`withoutEvents` 方法接受一个闭包作为唯一参数。在该闭包内执行的任何代码都不会派发模型事件，且闭包返回的任何值都会由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

#### 在不派发事件的情况下保存单个模型

有时你可能希望"保存"一个给定的模型，而不派发任何事件。你可以使用 `saveQuietly` 方法来实现：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你还可以"更新"、"删除"、"软删除"、"恢复"和"复制"一个给定的模型，而不派发任何事件：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```