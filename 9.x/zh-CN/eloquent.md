# Eloquent：入门

- [简介](#introduction)
- [生成模型类](#generating-model-classes)
- [Eloquent 模型约定](#eloquent-model-conventions)
    - [表名](#table-names)
    - [主键](#primary-keys)
    - [UUID 和 ULID 键](#uuid-and-ulid-keys)
    - [时间戳](#timestamps)
    - [数据库连接](#database-connections)
    - [默认属性值](#default-attribute-values)
    - [配置 Eloquent 严格模式](#configuring-eloquent-strictness)
- [检索模型](#retrieving-models)
    - [集合](#collections)
    - [分块处理结果](#chunking-results)
    - [使用惰性集合分块](#chunking-using-lazy-collections)
    - [游标](#cursors)
    - [高级子查询](#advanced-subqueries)
- [检索单个模型/聚合](#retrieving-single-models)
    - [检索或创建模型](#retrieving-or-creating-models)
    - [检索聚合](#retrieving-aggregates)
- [插入和更新模型](#inserting-and-updating-models)
    - [插入](#inserts)
    - [更新](#updates)
    - [批量赋值](#mass-assignment)
    - [Upsert](#upserts)
- [删除模型](#deleting-models)
    - [软删除](#soft-deleting)
    - [查询软删除模型](#querying-soft-deleted-models)
- [修剪模型](#pruning-models)
- [复制模型](#replicating-models)
- [查询作用域](#query-scopes)
    - [全局作用域](#global-scopes)
    - [局部作用域](#local-scopes)
- [比较模型](#comparing-models)
- [事件](#events)
    - [使用闭包](#events-using-closures)
    - [观察者](#observers)
    - [静默事件](#muting-events)

<a name="introduction"></a>
## 简介

Laravel 包含 Eloquent，一个对象关系映射器（ORM），让数据库交互变得愉快。使用 Eloquent 时，每个数据库表都有对应的"模型"用于与该表交互。除了从数据库表检索记录外，Eloquent 模型还允许你插入、更新和删除表中的记录。

> **Note**  
> 开始之前，请确保在应用程序的 `config/database.php` 配置文件中配置了数据库连接。有关配置数据库的更多信息，请查看[数据库配置文档](/docs/{{version}}/database#configuration)。

#### Laravel Bootcamp

如果你是 Laravel 新手，可以随时进入 [Laravel Bootcamp](https://bootcamp.laravel.com)。Laravel Bootcamp 将引导你使用 Eloquent 构建第一个 Laravel 应用程序。这是了解 Laravel 和 Eloquent 所提供一切的好方法。

<a name="generating-model-classes"></a>
## 生成模型类

首先，让我们创建一个 Eloquent 模型。模型通常位于 `app\Models` 目录并继承 `Illuminate\Database\Eloquent\Model` 类。可以使用 `make:model` [Artisan 命令](/docs/{{version}}/artisan)生成新模型：

```shell
php artisan make:model Flight
```

如果想在生成模型时生成[数据库迁移](/docs/{{version}}/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

生成模型时还可以生成各种其他类型的类，如工厂、数据填充、策略、控制器和表单请求。此外，这些选项可以组合使用以一次创建多个类：

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

# 生成模型、FlightController 资源类和表单请求类...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成模型和 FlightPolicy 类...
php artisan make:model Flight --policy

# 生成模型和数据库迁移、工厂、数据填充和控制器...
php artisan make:model Flight -mfsc

# 快捷方式生成模型、数据库迁移、工厂、数据填充、策略、控制器和表单请求...
php artisan make:model Flight --all

# 生成中间模型...
php artisan make:model Member --pivot
```

<a name="inspecting-models"></a>
#### 检查模型

有时仅通过浏览代码难以确定模型的所有可用属性和关联。可以尝试 `model:show` Artisan 命令，它提供了模型所有属性和关联的便捷概览：

```shell
php artisan model:show Flight
```

<a name="eloquent-model-conventions"></a>
## Eloquent 模型约定

`make:model` 命令生成的模型将放置在 `app/Models` 目录。让我们检查一个基本模型类并讨论 Eloquent 的一些关键约定：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        //
    }

<a name="table-names"></a>
### 表名

浏览上面的示例后，你可能注意到我们没有告诉 Eloquent 哪个数据库表对应 `Flight` 模型。按照约定，除非显式指定其他名称，否则将使用类的"蛇形命名"复数形式作为表名。因此，在本例中，Eloquent 将假设 `Flight` 模型将记录存储在 `flights` 表中，而 `AirTrafficController` 模型将记录存储在 `air_traffic_controllers` 表中。

如果模型对应的数据库表不符合此约定，可以通过在模型上定义 `table` 属性来手动指定模型的表名：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        /**
         * 与模型关联的表。
         *
         * @var string
         */
        protected $table = 'my_flights';
    }

<a name="primary-keys"></a>
### 主键

Eloquent 还假设每个模型对应的数据库表都有一个名为 `id` 的主键列。如有必要，可以在模型上定义受保护的 `$primaryKey` 属性来指定作为模型主键的不同列：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        /**
         * 与表关联的主键。
         *
         * @var string
         */
        protected $primaryKey = 'flight_id';
    }

此外，Eloquent 假设主键是自增整数值，这意味着 Eloquent 会自动将主键转换为整数。如果希望使用非自增或非数字主键，必须在模型上定义设置为 `false` 的公共 `$incrementing` 属性：

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

如果模型的主键不是整数，应在模型上定义受保护的 `$keyType` 属性。此属性的值应为 `string`：

    <?php

    class Flight extends Model
    {
        /**
         * 自增 ID 的数据类型。
         *
         * @var string
         */
        protected $keyType = 'string';
    }

<a name="composite-primary-keys"></a>
#### "复合"主键

Eloquent 要求每个模型至少有一个唯一标识的"ID"作为其主键。Eloquent 模型不支持"复合"主键。但是，除了表的唯一标识主键外，你可以自由地向数据库表添加额外的多列唯一索引。

<a name="uuid-and-ulid-keys"></a>
### UUID 和 ULID 键

除了使用自增整数作为 Eloquent 模型的主键外，你还可以选择使用 UUID。UUID 是 36 个字符长的通用唯一字母数字标识符。

如果希望模型使用 UUID 键而不是自增整数键，可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` Trait。当然，应确保模型具有 [UUID 等效的主键列](/docs/{{version}}/migrations#column-method-uuid)：

    use Illuminate\Database\Eloquent\Concerns\HasUuids;
    use Illuminate\Database\Eloquent\Model;

    class Article extends Model
    {
        use HasUuids;

        // ...
    }

    $article = Article::create(['title' => 'Traveling to Europe']);

    $article->id; // "8f8e8478-9035-4d23-b9a7-62f4d2612ce5"

默认情况下，`HasUuids` Trait 将为模型生成["有序" UUID](/docs/{{version}}/helpers#method-str-ordered-uuid)。这些 UUID 对于索引数据库存储更高效，因为它们可以按字典序排序。

可以通过在模型上定义 `newUniqueId` 方法来覆盖给定模型的 UUID 生成过程。此外，可以通过在模型上定义 `uniqueIds` 方法来指定应接收 UUID 的列：

    use Ramsey\Uuid\Uuid;

    /**
     * 为模型生成新 UUID。
     *
     * @return string
     */
    public function newUniqueId()
    {
        return (string) Uuid::uuid4();
    }

    /**
     * 获取应接收唯一标识符的列。
     *
     * @return array
     */
    public function uniqueIds()
    {
        return ['id', 'discount_code'];
    }

如果需要，可以选择使用"ULID"代替 UUID。ULID 类似于 UUID；但是，它们只有 26 个字符长。与有序 UUID 一样，ULID 可按字典序排序以实现高效的数据库索引。要使用 ULID，应在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` Trait。还应确保模型具有 [ULID 等效的主键列](/docs/{{version}}/migrations#column-method-ulid)：

    use Illuminate\Database\Eloquent\Concerns\HasUlids;
    use Illuminate\Database\Eloquent\Model;

    class Article extends Model
    {
        use HasUlids;

        // ...
    }

    $article = Article::create(['title' => 'Traveling to Asia']);

    $article->id; // "01gd4d3tgrrfqeda94gdbtdk5c"

<a name="timestamps"></a>
### 时间戳

默认情况下，Eloquent 期望模型对应的数据库表上存在 `created_at` 和 `updated_at` 列。Eloquent 会在创建或更新模型时自动设置这些列的值。如果不希望这些列由 Eloquent 自动管理，应在模型上定义值为 `false` 的 `$timestamps` 属性：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        /**
         * 指示模型是否应有时间戳。
         *
         * @var bool
         */
        public $timestamps = false;
    }

如果需要自定义模型时间戳的格式，设置模型的 `$dateFormat` 属性。此属性决定日期属性在数据库中的存储方式，以及模型序列化为数组或 JSON 时的格式：

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

如果需要自定义用于存储时间戳的列名，可以在模型上定义 `CREATED_AT` 和 `UPDATED_AT` 常量：

    <?php

    class Flight extends Model
    {
        const CREATED_AT = 'creation_date';
        const UPDATED_AT = 'updated_date';
    }

如果希望执行模型操作而不修改模型的 `updated_at` 时间戳，可以在传递给 `withoutTimestamps` 方法的闭包内操作模型：

    Model::withoutTimestamps(fn () => $post->increment(['reads']));

<a name="database-connections"></a>
### 数据库连接

默认情况下，所有 Eloquent 模型将使用为应用程序配置的默认数据库连接。如果想指定与特定模型交互时应使用的不同连接，应在模型上定义 `$connection` 属性：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        /**
         * 模型应使用的数据库连接。
         *
         * @var string
         */
        protected $connection = 'sqlite';
    }

<a name="default-attribute-values"></a>
### 默认属性值

默认情况下，新实例化的模型实例不包含任何属性值。如果想为模型的某些属性定义默认值，可以在模型上定义 `$attributes` 属性。`$attributes` 数组中的属性值应采用原始的"可存储"格式，就像刚从数据库读取一样：

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

<a name="configuring-eloquent-strictness"></a>
### 配置 Eloquent 严格模式

Laravel 提供了多种方法，允许你在各种情况下配置 Eloquent 的行为和"严格性"。

首先，`preventLazyLoading` 方法接受可选的布尔参数，指示是否应阻止惰性加载。例如，你可能希望仅在非生产环境中禁用惰性加载，以便即使生产代码中意外存在惰性加载关联，生产环境也能继续正常运行。通常，应在应用程序 `AppServiceProvider` 的 `boot` 方法中调用此方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，可以通过调用 `preventSilentlyDiscardingAttributes` 方法指示 Laravel 在尝试填充不可填充属性时抛出异常。这有助于在本地开发期间尝试设置未添加到模型 `fillable` 数组的属性时防止意外错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

最后，可以指示 Eloquent 在尝试访问模型上实际未从数据库检索或不存在的属性时抛出异常。例如，当你忘记将属性添加到 Eloquent 查询的 `select` 子句时可能发生此情况：

```php
Model::preventAccessingMissingAttributes(! $this->app->isProduction());
```

<a name="enabling-eloquent-strict-mode"></a>
#### 启用 Eloquent"严格模式"

为方便起见，可以通过简单调用 `shouldBeStrict` 方法来启用上述所有三个方法：

```php
Model::shouldBeStrict(! $this->app->isProduction());
```

<a name="retrieving-models"></a>
## 检索模型

创建模型及其[关联数据库表](/docs/{{version}}/migrations#writing-migrations)后，就可以开始从数据库检索数据了。可以将每个 Eloquent 模型视为强大的[查询构造器](/docs/{{version}}/queries)，允许你流畅地查询与模型关联的数据库表。模型的 `all` 方法将从模型关联的数据库表检索所有记录：

    use App\Models\Flight;

    foreach (Flight::all() as $flight) {
        echo $flight->name;
    }

<a name="building-queries"></a>
#### 构建查询

Eloquent `all` 方法将返回模型表中的所有结果。但是，由于每个 Eloquent 模型都作为[查询构造器](/docs/{{version}}/queries)，你可以向查询添加额外约束，然后调用 `get` 方法检索结果：

    $flights = Flight::where('active', 1)
                   ->orderBy('name')
                   ->take(10)
                   ->get();

> **Note**  
> 由于 Eloquent 模型是查询构造器，你应该查阅 Laravel [查询构造器](/docs/{{version}}/queries)提供的所有方法。编写 Eloquent 查询时可以使用这些方法。

<a name="refreshing-models"></a>
#### 刷新模型

如果已有从数据库检索的 Eloquent 模型实例，可以使用 `fresh` 和 `refresh` 方法"刷新"模型。`fresh` 方法将从数据库重新检索模型。现有模型实例不受影响：

    $flight = Flight::where('number', 'FR 900')->first();

    $freshFlight = $flight->fresh();

`refresh` 方法将使用数据库中的新数据重新填充现有模型。此外，其所有已加载的关联也将被刷新：

    $flight = Flight::where('number', 'FR 900')->first();

    $flight->number = 'FR 456';

    $flight->refresh();

    $flight->number; // "FR 900"

<a name="collections"></a>
### 集合

如我们所见，Eloquent 的 `all` 和 `get` 等方法从数据库检索多条记录。但是，这些方法不返回普通 PHP 数组。而是返回 `Illuminate\Database\Eloquent\Collection` 实例。

Eloquent `Collection` 类继承 Laravel 的基础 `Illuminate\Support\Collection` 类，该类提供了[多种有用的方法](/docs/{{version}}/collections#available-methods)用于与数据集合交互。例如，`reject` 方法可用于根据调用闭包的结果从集合中移除模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function ($flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法外，Eloquent 集合类还提供了一些[额外方法](/docs/{{version}}/eloquent-collections#available-methods)，专门用于与 Eloquent 模型集合交互。

由于所有 Laravel 集合都实现了 PHP 的可迭代接口，因此可以像数组一样循环集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

<a name="chunking-results"></a>
### 分块处理结果

如果尝试通过 `all` 或 `get` 方法加载数万条 Eloquent 记录，应用程序可能会耗尽内存。可以使用 `chunk` 方法更高效地处理大量模型。

`chunk` 方法将检索 Eloquent 模型的子集，将其传递给闭包进行处理。由于每次只检索当前块的 Eloquent 模型，`chunk` 方法在处理大量模型时可显著减少内存使用：

```php
use App\Models\Flight;

Flight::chunk(200, function ($flights) {
    foreach ($flights as $flight) {
        //
    }
});
```

传递给 `chunk` 方法的第一个参数是每个"块"希望接收的记录数。作为第二个参数传递的闭包将为从数据库检索的每个块调用。将执行数据库查询以检索传递给闭包的每块记录。

如果根据在迭代结果时也将更新的列过滤 `chunk` 方法的结果，应使用 `chunkById` 方法。在这些场景中使用 `chunk` 方法可能导致意外且不一致的结果。在内部，`chunkById` 方法将始终检索 `id` 列大于前一个块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->chunkById(200, function ($flights) {
        $flights->each->update(['departed' => false]);
    }, $column = 'id');
```

<a name="chunking-using-lazy-collections"></a>
### 使用惰性集合分块

`lazy` 方法的工作方式与 [`chunk` 方法](#chunking-results)类似，在后台以分块方式执行查询。但是，`lazy` 方法不是将每个块直接传递给回调，而是返回 Eloquent 模型的扁平化 [`LazyCollection`](/docs/{{version}}/collections#lazy-collections)，让你以单个流的方式与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    //
}
```

如果根据在迭代结果时也将更新的列过滤 `lazy` 方法的结果，应使用 `lazyById` 方法。在内部，`lazyById` 方法将始终检索 `id` 列大于前一个块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->lazyById(200, $column = 'id')
    ->each->update(['departed' => false]);
```

可以使用 `lazyByIdDesc` 方法根据 `id` 的降序过滤结果。

<a name="cursors"></a>
### 游标

与 `lazy` 方法类似，`cursor` 方法可用于在迭代数万条 Eloquent 模型记录时显著减少应用程序的内存消耗。

`cursor` 方法只执行一次数据库查询；但是，单个 Eloquent 模型在实际迭代之前不会被填充。因此，迭代游标时任何给定时间内存中只保留一个 Eloquent 模型。

> **Warning**  
> 由于 `cursor` 方法一次只在内存中保留单个 Eloquent 模型，因此无法预加载关联。如果需要预加载关联，请考虑使用 [`lazy` 方法](#chunking-using-lazy-collections)。

在内部，`cursor` 方法使用 PHP [生成器](https://www.php.net/manual/en/language.generators.overview.php)实现此功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    //
}
```

`cursor` 返回 `Illuminate\Support\LazyCollection` 实例。[惰性集合](/docs/{{version}}/collections#lazy-collections)允许你使用典型 Laravel 集合上可用的许多集合方法，同时一次只将单个模型加载到内存中：

```php
use App\Models\User;

$users = User::cursor()->filter(function ($user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

虽然 `cursor` 方法使用的内存远少于常规查询（一次只在内存中保留单个 Eloquent 模型），但最终仍会耗尽内存。这是因为 [PHP 的 PDO 驱动在内部缓存其缓冲区中的所有原始查询结果](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果处理大量 Eloquent 记录，请考虑使用 [`lazy` 方法](#chunking-using-lazy-collections)。

<a name="advanced-subqueries"></a>
### 高级子查询

<a name="subquery-selects"></a>
#### 子查询选择

Eloquent 还提供高级子查询支持，允许你在单个查询中从关联表提取信息。例如，假设我们有一个航班 `destinations` 表和一个到目的地的 `flights` 表。`flights` 表包含 `arrived_at` 列，指示航班到达目的地的时间。

使用查询构造器 `select` 和 `addSelect` 方法可用的子查询功能，我们可以在单个查询中选择所有 `destinations` 以及最近到达该目的地的航班名称：

    use App\Models\Destination;
    use App\Models\Flight;

    return Destination::addSelect(['last_flight' => Flight::select('name')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
    ])->get();

<a name="subquery-ordering"></a>
#### 子查询排序

此外，查询构造器的 `orderBy` 函数支持子查询。继续使用我们的航班示例，可以使用此功能根据最后航班到达目的地的时间对所有目的地排序。同样，这可以在执行单个数据库查询时完成：

    return Destination::orderByDesc(
        Flight::select('arrived_at')
            ->whereColumn('destination_id', 'destinations.id')
            ->orderByDesc('arrived_at')
            ->limit(1)
    )->get();

<a name="retrieving-single-models"></a>
## 检索单个模型/聚合

除了检索匹配给定查询的所有记录外，还可以使用 `find`、`first` 或 `firstWhere` 方法检索单条记录。这些方法不返回模型集合，而是返回单个模型实例：

    use App\Models\Flight;

    // 通过主键检索模型...
    $flight = Flight::find(1);

    // 检索匹配查询约束的第一个模型...
    $flight = Flight::where('active', 1)->first();

    // 检索匹配查询约束的第一个模型的替代方式...
    $flight = Flight::firstWhere('active', 1);

有时如果未找到结果，你可能希望执行其他操作。`findOr` 和 `firstOr` 方法将返回单个模型实例，或者如果未找到结果，则执行给定闭包。闭包返回的值将被视为方法的结果：

    $flight = Flight::findOr(1, function () {
        // ...
    });

    $flight = Flight::where('legs', '>', 3)->firstOr(function () {
        // ...
    });

<a name="not-found-exceptions"></a>
#### 未找到异常

有时如果未找到模型，你可能希望抛出异常。这在路由或控制器中特别有用。`findOrFail` 和 `firstOrFail` 方法将检索查询的第一个结果；但是，如果未找到结果，将抛出 `Illuminate\Database\Eloquent\ModelNotFoundException`：

    $flight = Flight::findOrFail(1);

    $flight = Flight::where('legs', '>', 3)->firstOrFail();

如果未捕获 `ModelNotFoundException`，将自动向客户端发送 404 HTTP 响应：

    use App\Models\Flight;

    Route::get('/api/flights/{id}', function ($id) {
        return Flight::findOrFail($id);
    });

<a name="retrieving-or-creating-models"></a>
### 检索或创建模型

`firstOrCreate` 方法将尝试使用给定的列/值对定位数据库记录。如果在数据库中找不到模型，将插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并而成：

`firstOrNew` 方法与 `firstOrCreate` 一样，将尝试在数据库中定位匹配给定属性的记录。但是，如果未找到模型，将返回新的模型实例。注意，`firstOrNew` 返回的模型尚未持久化到数据库。需要手动调用 `save` 方法来持久化它：

    use App\Models\Flight;

    // 按名称检索航班，如果不存在则创建...
    $flight = Flight::firstOrCreate([
        'name' => 'London to Paris'
    ]);

    // 按名称检索航班，如果不存在则使用 name、delayed 和 arrival_time 属性创建...
    $flight = Flight::firstOrCreate(
        ['name' => 'London to Paris'],
        ['delayed' => 1, 'arrival_time' => '11:30']
    );

    // 按名称检索航班或实例化新 Flight 实例...
    $flight = Flight::firstOrNew([
        'name' => 'London to Paris'
    ]);

    // 按名称检索航班或使用 name、delayed 和 arrival_time 属性实例化...
    $flight = Flight::firstOrNew(
        ['name' => 'Tokyo to Sydney'],
        ['delayed' => 1, 'arrival_time' => '11:30']
    );

<a name="retrieving-aggregates"></a>
### 检索聚合

与 Eloquent 模型交互时，还可以使用 Laravel [查询构造器](/docs/{{version}}/queries)提供的 `count`、`sum`、`max` 和其他[聚合方法](/docs/{{version}}/queries#aggregates)。如你所料，这些方法返回标量值而不是 Eloquent 模型实例：

    $count = Flight::where('active', 1)->count();

    $max = Flight::where('active', 1)->max('price');

<a name="inserting-and-updating-models"></a>
## 插入和更新模型

<a name="inserts"></a>
### 插入

当然，使用 Eloquent 时，我们不仅需要从数据库检索模型，还需要插入新记录。幸好，Eloquent 让这一切变得简单。要向数据库插入新记录，应实例化新模型实例并设置模型属性。然后，调用模型实例的 `save` 方法：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Models\Flight;
    use Illuminate\Http\Request;

    class FlightController extends Controller
    {
        /**
         * 在数据库中存储新航班。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function store(Request $request)
        {
            // 验证请求...

            $flight = new Flight;

            $flight->name = $request->name;

            $flight->save();
        }
    }

在本例中，我们将传入 HTTP 请求的 `name` 字段分配给 `App\Models\Flight` 模型实例的 `name` 属性。调用 `save` 方法时，记录将插入数据库。调用 `save` 方法时会自动设置模型的 `created_at` 和 `updated_at` 时间戳，因此无需手动设置。

或者，可以使用 `create` 方法用单个 PHP 语句"保存"新模型。`create` 方法将返回插入的模型实例：

    use App\Models\Flight;

    $flight = Flight::create([
        'name' => 'London to Paris',
    ]);

但是，使用 `create` 方法之前，需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为所有 Eloquent 模型默认受批量赋值漏洞保护。要了解有关批量赋值的更多信息，请查阅[批量赋值文档](#mass-assignment)。

<a name="updates"></a>
### 更新

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，应检索它并设置希望更新的任何属性。然后，应调用模型的 `save` 方法。同样，`updated_at` 时间戳将自动更新，因此无需手动设置其值：

    use App\Models\Flight;

    $flight = Flight::find(1);

    $flight->name = 'Paris to London';

    $flight->save();

<a name="mass-updates"></a>
#### 批量更新

也可以对匹配给定查询的模型执行更新。在本例中，所有 `active` 且 `destination` 为 `San Diego` 的航班将被标记为延迟：

    Flight::where('active', 1)
          ->where('destination', 'San Diego')
          ->update(['delayed' => 1]);

`update` 方法期望一个表示应更新列的列和值对数组。`update` 方法返回受影响的行数。

> **Warning**  
> 通过 Eloquent 发出批量更新时，不会为更新的模型触发 `saving`、`saved`、`updating` 和 `updated` 模型事件。这是因为发出批量更新时从不实际检索模型。

<a name="examining-attribute-changes"></a>
#### 检查属性更改

Eloquent 提供 `isDirty`、`isClean` 和 `wasChanged` 方法来检查模型的内部状态，并确定其属性自最初检索模型以来如何更改。

`isDirty` 方法确定自检索模型以来是否有任何模型属性已更改。可以向 `isDirty` 方法传递特定属性名或属性数组来确定是否有任何属性"脏"。`isClean` 方法将确定自检索模型以来属性是否保持不变。此方法也接受可选的属性参数：

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

`wasChanged` 方法确定在当前请求周期内最后一次保存模型时是否有任何属性被更改。如果需要，可以传递属性名来查看特定属性是否被更改：

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

`getOriginal` 方法返回包含模型原始属性的数组，无论自检索以来模型有何更改。如果需要，可以传递特定属性名来获取特定属性的原始值：

    $user = User::find(1);

    $user->name; // John
    $user->email; // john@example.com

    $user->name = "Jack";
    $user->name; // Jack

    $user->getOriginal('name'); // John
    $user->getOriginal(); // 原始属性数组...

<a name="mass-assignment"></a>
### 批量赋值

可以使用 `create` 方法用单个 PHP 语句"保存"新模型。方法将返回插入的模型实例：

    use App\Models\Flight;

    $flight = Flight::create([
        'name' => 'London to Paris',
    ]);

但是，使用 `create` 方法之前，需要在模型类上指定 `fillable` 或 `guarded` 属性。这些属性是必需的，因为所有 Eloquent 模型默认受批量赋值漏洞保护。

当用户传递意外的 HTTP 请求字段，而该字段更改了数据库中你未预期的列时，就会发生批量赋值漏洞。例如，恶意用户可能通过 HTTP 请求发送 `is_admin` 参数，然后将其传递给模型的 `create` 方法，允许用户将自己提升为管理员。

因此，首先应定义希望使其可批量赋值的模型属性。可以使用模型的 `$fillable` 属性来实现。例如，让我们使 `Flight` 模型的 `name` 属性可批量赋值：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Flight extends Model
    {
        /**
         * 可批量赋值的属性。
         *
         * @var array
         */
        protected $fillable = ['name'];
    }

指定可批量赋值的属性后，可以使用 `create` 方法在数据库中插入新记录。`create` 方法返回新创建的模型实例：

    $flight = Flight::create(['name' => 'London to Paris']);

如果已有模型实例，可以使用 `fill` 方法用属性数组填充它：

    $flight->fill(['name' => 'Amsterdam to Frankfurt']);

<a name="mass-assignment-json-columns"></a>
#### 批量赋值与 JSON 列

分配 JSON 列时，必须在模型的 `$fillable` 数组中指定每列的可批量赋值键。出于安全考虑，Laravel 不支持在使用 `guarded` 属性时更新嵌套 JSON 属性：

    /**
     * 可批量赋值的属性。
     *
     * @var array
     */
    protected $fillable = [
        'options->enabled',
    ];

<a name="allowing-mass-assignment"></a>
#### 允许批量赋值

如果希望使所有属性可批量赋值，可以将模型的 `$guarded` 属性定义为空数组。如果选择取消模型保护，应特别注意始终手动构造传递给 Eloquent `fill`、`create` 和 `update` 方法的数组：

    /**
     * 不可批量赋值的属性。
     *
     * @var array
     */
    protected $guarded = [];

<a name="mass-assignment-exceptions"></a>
#### 批量赋值异常

默认情况下，执行批量赋值操作时，未包含在 `$fillable` 数组中的属性将被静默丢弃。在生产环境中，这是预期行为；但是，在本地开发期间，可能导致对模型更改为何未生效的困惑。

如果需要，可以通过调用 `preventSilentlyDiscardingAttributes` 方法指示 Laravel 在尝试填充不可填充属性时抛出异常。通常，应在应用程序某个服务提供者的 `boot` 方法中调用此方法：

    use Illuminate\Database\Eloquent\Model;

    /**
     * 引导任何应用程序服务。
     *
     * @return void
     */
    public function boot()
    {
        Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
    }

<a name="upserts"></a>
### Upsert

有时，你可能需要更新现有模型，或在不存在匹配模型时创建新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在 `departure` 为 `Oakland` 且 `destination` 为 `San Diego` 的航班，其 `price` 和 `discounted` 列将被更新。如果不存在此类航班，将创建新航班，其属性由第一个参数数组与第二个参数数组合并而成：

    $flight = Flight::updateOrCreate(
        ['departure' => 'Oakland', 'destination' => 'San Diego'],
        ['price' => 99, 'discounted' => 1]
    );

如果希望在单个查询中执行多个"upsert"，应使用 `upsert` 方法。方法的第一个参数由要插入或更新的值组成，第二个参数列出在关联表中唯一标识记录的列。方法的第三个也是最后一个参数是如果数据库中已存在匹配记录时应更新的列数组。如果在模型上启用了时间戳，`upsert` 方法将自动设置 `created_at` 和 `updated_at` 时间戳：

    Flight::upsert([
        ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
        ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
    ], ['departure', 'destination'], ['price']);
    
> **Warning**  
> 除 SQL Server 外的所有数据库都要求 `upsert` 方法第二个参数中的列具有"primary"或"unique"索引。此外，MySQL 数据库驱动忽略 `upsert` 方法的第二个参数，并始终使用表的"primary"和"unique"索引来检测现有记录。

<a name="deleting-models"></a>
## 删除模型

要删除模型，可以调用模型实例的 `delete` 方法：

    use App\Models\Flight;

    $flight = Flight::find(1);

    $flight->delete();

可以调用 `truncate` 方法删除模型的所有关联数据库记录。`truncate` 操作还将重置模型关联表上的任何自增 ID：

    Flight::truncate();

<a name="deleting-an-existing-model-by-its-primary-key"></a>
#### 通过主键删除现有模型

在上面的示例中，我们在调用 `delete` 方法之前从数据库检索模型。但是，如果知道模型的主键，可以通过调用 `destroy` 方法删除模型而无需显式检索。除了接受单个主键外，`destroy` 方法还接受多个主键、主键数组或主键[集合](/docs/{{version}}/collections)：

    Flight::destroy(1);

    Flight::destroy(1, 2, 3);

    Flight::destroy([1, 2, 3]);

    Flight::destroy(collect([1, 2, 3]));

> **Warning**  
> `destroy` 方法单独加载每个模型并调用 `delete` 方法，以便为每个模型正确分发 `deleting` 和 `deleted` 事件。

<a name="deleting-models-using-queries"></a>
#### 使用查询删除模型

当然，可以构建 Eloquent 查询来删除匹配查询条件的所有模型。在本例中，我们将删除所有标记为非活跃的航班。与批量更新一样，批量删除不会为删除的模型分发模型事件：

    $deleted = Flight::where('active', 0)->delete();

> **Warning**  
> 通过 Eloquent 执行批量删除语句时，不会为删除的模型分发 `deleting` 和 `deleted` 模型事件。这是因为执行删除语句时从不实际检索模型。

<a name="soft-deleting"></a>
### 软删除

除了从数据库实际移除记录外，Eloquent 还可以"软删除"模型。模型被软删除时，不会从数据库中实际移除。而是在模型上设置 `deleted_at` 属性，指示模型"删除"的日期和时间。要为模型启用软删除，将 `Illuminate\Database\Eloquent\SoftDeletes` Trait 添加到模型：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Flight extends Model
    {
        use SoftDeletes;
    }

> **Note**  
> `SoftDeletes` Trait 会自动将 `deleted_at` 属性转换为 `DateTime` / `Carbon` 实例。

还应将 `deleted_at` 列添加到数据库表。Laravel [结构构建器](/docs/{{version}}/migrations)包含创建此列的辅助方法：

    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    Schema::table('flights', function (Blueprint $table) {
        $table->softDeletes();
    });

    Schema::table('flights', function (Blueprint $table) {
        $table->dropSoftDeletes();
    });

现在，调用模型的 `delete` 方法时，`deleted_at` 列将设置为当前日期和时间。但是，模型的数据库记录将保留在表中。查询使用软删除的模型时，软删除的模型将自动从所有查询结果中排除。

要确定给定模型实例是否已被软删除，可以使用 `trashed` 方法：

    if ($flight->trashed()) {
        //
    }

<a name="restoring-soft-deleted-models"></a>
#### 恢复软删除模型

有时你可能希望"取消删除"软删除的模型。要恢复软删除的模型，可以调用模型实例的 `restore` 方法。`restore` 方法将模型的 `deleted_at` 列设置为 `null`：

    $flight->restore();

也可以在查询中使用 `restore` 方法恢复多个模型。与其他"批量"操作一样，这不会为恢复的模型分发任何模型事件：

    Flight::withTrashed()
            ->where('airline_id', 1)
            ->restore();

`restore` 方法也可用于构建[关联](/docs/{{version}}/eloquent-relationships)查询：

    $flight->history()->restore();

<a name="permanently-deleting-models"></a>
#### 永久删除模型

有时你可能需要从数据库真正移除模型。可以使用 `forceDelete` 方法从数据库表永久移除软删除的模型：

    $flight->forceDelete();

也可以在构建 Eloquent 关联查询时使用 `forceDelete` 方法：

    $flight->history()->forceDelete();

<a name="querying-soft-deleted-models"></a>
### 查询软删除模型

<a name="including-soft-deleted-models"></a>
#### 包含软删除模型

如上所述，软删除的模型将自动从查询结果中排除。但是，可以通过在查询上调用 `withTrashed` 方法强制将软删除模型包含在查询结果中：

    use App\Models\Flight;

    $flights = Flight::withTrashed()
                    ->where('account_id', 1)
                    ->get();

`withTrashed` 方法也可在构建[关联](/docs/{{version}}/eloquent-relationships)查询时调用：

    $flight->history()->withTrashed()->get();

<a name="retrieving-only-soft-deleted-models"></a>
#### 仅检索软删除模型

`onlyTrashed` 方法将**仅**检索软删除的模型：

    $flights = Flight::onlyTrashed()
                    ->where('airline_id', 1)
                    ->get();

<a name="pruning-models"></a>
## 修剪模型

有时你可能希望定期删除不再需要的模型。为此，可以将 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` Trait 添加到希望定期修剪的模型。将其中一个 Trait 添加到模型后，实现 `prunable` 方法，返回解析不再需要的模型的 Eloquent 查询构造器：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Prunable;

    class Flight extends Model
    {
        use Prunable;

        /**
         * 获取可修剪的模型查询。
         *
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public function prunable()
        {
            return static::where('created_at', '<=', now()->subMonth());
        }
    }

将模型标记为 `Prunable` 时，还可以在模型上定义 `pruning` 方法。此方法将在删除模型之前调用。此方法可用于在模型从数据库永久移除之前删除与模型关联的任何额外资源，如存储的文件：

    /**
     * 准备模型以进行修剪。
     *
     * @return void
     */
    protected function pruning()
    {
        //
    }

配置可修剪模型后，应在应用程序的 `App\Console\Kernel` 类中调度 `model:prune` Artisan 命令。可以自由选择运行此命令的适当间隔：

    /**
     * 定义应用程序的命令调度。
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('model:prune')->daily();
    }

在后台，`model:prune` 命令将自动检测应用程序 `app/Models` 目录中的"Prunable"模型。如果模型位于其他位置，可以使用 `--model` 选项指定模型类名：

    $schedule->command('model:prune', [
        '--model' => [Address::class, Flight::class],
    ])->daily();

如果希望在修剪所有其他检测到的模型时排除某些模型不被修剪，可以使用 `--except` 选项：

    $schedule->command('model:prune', [
        '--except' => [Address::class, Flight::class],
    ])->daily();

可以通过使用 `--pretend` 选项执行 `model:prune` 命令来测试 `prunable` 查询。使用模拟模式时，`model:prune` 命令将仅报告如果命令实际运行将修剪多少条记录：

```shell
php artisan model:prune --pretend
```

> **Warning**  
> 软删除模型如果匹配可修剪查询，将被永久删除（`forceDelete`）。

<a name="mass-pruning"></a>
#### 批量修剪

当模型使用 `Illuminate\Database\Eloquent\MassPrunable` Trait 标记时，将使用批量删除查询从数据库删除模型。因此，不会调用 `pruning` 方法，也不会分发 `deleting` 和 `deleted` 模型事件。这是因为模型在删除之前从不实际检索，从而使修剪过程更高效：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\MassPrunable;

    class Flight extends Model
    {
        use MassPrunable;

        /**
         * 获取可修剪的模型查询。
         *
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public function prunable()
        {
            return static::where('created_at', '<=', now()->subMonth());
        }
    }

<a name="replicating-models"></a>
## 复制模型

可以使用 `replicate` 方法创建现有模型实例的未保存副本。当模型实例共享许多相同属性时，此方法特别有用：

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

要从复制到新模型中排除一个或多个属性，可以向 `replicate` 方法传递数组：

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

<a name="query-scopes"></a>
## 查询作用域

<a name="global-scopes"></a>
### 全局作用域

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自身的[软删除](#soft-deleting)功能利用全局作用域仅从数据库检索"未删除"模型。编写自己的全局作用域可以提供一种便捷、简单的方式，确保给定模型的每个查询都接收特定约束。

<a name="writing-global-scopes"></a>
#### 编写全局作用域

编写全局作用域很简单。首先，定义一个实现 `Illuminate\Database\Eloquent\Scope` 接口的类。Laravel 没有放置作用域类的常规位置，因此你可以自由地将此类放在任何希望的目录中。

`Scope` 接口要求实现一个方法：`apply`。`apply` 方法可根据需要向查询添加 `where` 约束或其他类型的子句：

    <?php

    namespace App\Models\Scopes;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Scope;

    class AncientScope implements Scope
    {
        /**
         * 将作用域应用于给定的 Eloquent 查询构造器。
         *
         * @param  \Illuminate\Database\Eloquent\Builder  $builder
         * @param  \Illuminate\Database\Eloquent\Model  $model
         * @return void
         */
        public function apply(Builder $builder, Model $model)
        {
            $builder->where('created_at', '<', now()->subYears(2000));
        }
    }

> **Note**  
> 如果全局作用域向查询的 select 子句添加列，应使用 `addSelect` 方法而不是 `select`。这将防止无意中替换查询现有的 select 子句。

<a name="applying-global-scopes"></a>
#### 应用全局作用域

要将全局作用域分配给模型，应覆盖模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法。`addGlobalScope` 方法接受作用域实例作为其唯一参数：

    <?php

    namespace App\Models;

    use App\Models\Scopes\AncientScope;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 模型的"booted"方法。
         *
         * @return void
         */
        protected static function booted()
        {
            static::addGlobalScope(new AncientScope);
        }
    }

将上面的作用域添加到 `App\Models\User` 模型后，调用 `User::all()` 方法将执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

<a name="anonymous-global-scopes"></a>
#### 匿名全局作用域

Eloquent 还允许使用闭包定义全局作用域，这对于不值得单独创建类的简单作用域特别有用。使用闭包定义全局作用域时，应提供自己选择的作用域名称作为 `addGlobalScope` 方法的第一个参数：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Builder;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 模型的"booted"方法。
         *
         * @return void
         */
        protected static function booted()
        {
            static::addGlobalScope('ancient', function (Builder $builder) {
                $builder->where('created_at', '<', now()->subYears(2000));
            });
        }
    }

<a name="removing-global-scopes"></a>
#### 移除全局作用域

如果想为给定查询移除全局作用域，可以使用 `withoutGlobalScope` 方法。此方法接受全局作用域的类名作为其唯一参数：

    User::withoutGlobalScope(AncientScope::class)->get();

或者，如果使用闭包定义全局作用域，应传递分配给全局作用域的字符串名称：

    User::withoutGlobalScope('ancient')->get();

如果想移除查询的多个或所有全局作用域，可以使用 `withoutGlobalScopes` 方法：

    // 移除所有全局作用域...
    User::withoutGlobalScopes()->get();

    // 移除部分全局作用域...
    User::withoutGlobalScopes([
        FirstScope::class, SecondScope::class
    ])->get();

<a name="local-scopes"></a>
### 局部作用域

局部作用域允许你定义可在应用程序中轻松复用的常用查询约束集。例如，你可能需要频繁检索所有被认为"受欢迎"的用户。要定义作用域，在 Eloquent 模型方法前加 `scope` 前缀。

作用域应始终返回相同的查询构造器实例或 `void`：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 限制查询仅包含受欢迎的用户。
         *
         * @param  \Illuminate\Database\Eloquent\Builder  $query
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public function scopePopular($query)
        {
            return $query->where('votes', '>', 100);
        }

        /**
         * 限制查询仅包含活跃用户。
         *
         * @param  \Illuminate\Database\Eloquent\Builder  $query
         * @return void
         */
        public function scopeActive($query)
        {
            $query->where('active', 1);
        }
    }

<a name="utilizing-a-local-scope"></a>
#### 使用局部作用域

定义作用域后，可以在查询模型时调用作用域方法。但是，调用方法时不应包含 `scope` 前缀。甚至可以链式调用各种作用域：

    use App\Models\User;

    $users = User::popular()->active()->orderBy('created_at')->get();

通过 `or` 查询运算符组合多个 Eloquent 模型作用域可能需要使用闭包来实现正确的[逻辑分组](/docs/{{version}}/queries#logical-grouping)：

    $users = User::popular()->orWhere(function (Builder $query) {
        $query->active();
    })->get();

但是，由于这可能很繁琐，Laravel 提供了"高阶" `orWhere` 方法，允许你流畅地链式作用域而无需使用闭包：

    $users = App\Models\User::popular()->orWhere->active()->get();

<a name="dynamic-scopes"></a>
#### 动态作用域

有时你可能希望定义接受参数的作用域。首先，只需将额外参数添加到作用域方法的签名。作用域参数应在 `$query` 参数之后定义：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 限制查询仅包含给定类型的用户。
         *
         * @param  \Illuminate\Database\Eloquent\Builder  $query
         * @param  mixed  $type
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public function scopeOfType($query, $type)
        {
            return $query->where('type', $type);
        }
    }

将预期参数添加到作用域方法签名后，可以在调用作用域时传递参数：

    $users = User::ofType('admin')->get();

<a name="comparing-models"></a>
## 比较模型

有时你可能需要确定两个模型是否"相同"。可以使用 `is` 和 `isNot` 方法快速验证两个模型是否具有相同的主键、表和数据库连接：

    if ($post->is($anotherPost)) {
        //
    }

    if ($post->isNot($anotherPost)) {
        //
    }

使用 `belongsTo`、`hasOne`、`morphTo` 和 `morphOne` [关联](/docs/{{version}}/eloquent-relationships)时，`is` 和 `isNot` 方法也可用。当你希望在不发出查询检索关联模型的情况下比较关联模型时，此方法特别有用：

    if ($post->author()->is($user)) {
        //
    }

<a name="events"></a>
## 事件

> **Note**  
> 想将 Eloquent 事件直接广播到客户端应用程序？查看 Laravel 的[模型事件广播](/docs/{{version}}/broadcasting#model-broadcasting)。

Eloquent 模型分发多个事件，允许你挂钩到模型生命周期的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 和 `replicating`。

从数据库检索现有模型时将分发 `retrieved` 事件。首次保存新模型时，将分发 `creating` 和 `created` 事件。修改现有模型并调用 `save` 方法时将分发 `updating` / `updated` 事件。创建或更新模型时将分发 `saving` / `saved` 事件——即使模型的属性未更改。以 `-ing` 结尾的事件名称在模型更改持久化之前分发，而以 `-ed` 结尾的事件在模型更改持久化之后分发。

要开始监听模型事件，在 Eloquent 模型上定义 `$dispatchesEvents` 属性。此属性将 Eloquent 模型生命周期的各个点映射到你自己的[事件类](/docs/{{version}}/events)。每个模型事件类应期望通过其构造函数接收受影响模型的实例：

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
         * @var array
         */
        protected $dispatchesEvents = [
            'saved' => UserSaved::class,
            'deleted' => UserDeleted::class,
        ];
    }

定义和映射 Eloquent 事件后，可以使用[事件监听器](/docs/{{version}}/events#defining-listeners)处理事件。

> **Warning**  
> 通过 Eloquent 发出批量更新或删除查询时，不会为受影响的模型分发 `saved`、`updated`、`deleting` 和 `deleted` 模型事件。这是因为执行批量更新或删除时从不实际检索模型。

<a name="events-using-closures"></a>
### 使用闭包

可以使用闭包代替自定义事件类，在分发各种模型事件时执行。通常，应在模型的 `booted` 方法中注册这些闭包：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 模型的"booted"方法。
         *
         * @return void
         */
        protected static function booted()
        {
            static::created(function ($user) {
                //
            });
        }
    }

如果需要，注册模型事件时可以利用[可队列匿名事件监听器](/docs/{{version}}/events#queuable-anonymous-event-listeners)。这将指示 Laravel 使用应用程序的[队列](/docs/{{version}}/queues)在后台执行模型事件监听器：

    use function Illuminate\Events\queueable;

    static::created(queueable(function ($user) {
        //
    }));

<a name="observers"></a>
### 观察者

<a name="defining-observers"></a>
#### 定义观察者

如果在给定模型上监听多个事件，可以使用观察者将所有监听器分组到单个类中。观察者类的方法名反映你希望监听的 Eloquent 事件。这些方法中的每一个都接收受影响的模型作为其唯一参数。`make:observer` Artisan 命令是创建新观察者类的最简单方式：

```shell
php artisan make:observer UserObserver --model=User
```

此命令将新观察者放置在 `app/Observers` 目录。如果此目录不存在，Artisan 将为你创建。新的观察者如下所示：

    <?php

    namespace App\Observers;

    use App\Models\User;

    class UserObserver
    {
        /**
         * 处理 User "created" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function created(User $user)
        {
            //
        }

        /**
         * 处理 User "updated" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function updated(User $user)
        {
            //
        }

        /**
         * 处理 User "deleted" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function deleted(User $user)
        {
            //
        }
        
        /**
         * 处理 User "restored" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function restored(User $user)
        {
            //
        }

        /**
         * 处理 User "forceDeleted" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function forceDeleted(User $user)
        {
            //
        }
    }

要注册观察者，需要在希望观察的模型上调用 `observe` 方法。可以在应用程序 `App\Providers\EventServiceProvider` 服务提供者的 `boot` 方法中注册观察者：

    use App\Models\User;
    use App\Observers\UserObserver;

    /**
     * 为应用程序注册任何事件。
     *
     * @return void
     */
    public function boot()
    {
        User::observe(UserObserver::class);
    }

或者，可以在应用程序 `App\Providers\EventServiceProvider` 类的 `$observers` 属性中列出观察者：

    use App\Models\User;
    use App\Observers\UserObserver;

    /**
     * 应用程序的模型观察者。
     *
     * @var array
     */
    protected $observers = [
        User::class => [UserObserver::class],
    ];

> **Note**  
> 观察者还可以监听其他事件，如 `saving` 和 `retrieved`。这些事件在[事件](#events)文档中描述。

<a name="observers-and-database-transactions"></a>
#### 观察者与数据库事务

在数据库事务内创建模型时，你可能希望指示观察者仅在数据库事务提交后执行其事件处理器。可以通过在观察者上定义 `$afterCommit` 属性来实现。如果数据库事务未进行中，事件处理器将立即执行：

    <?php

    namespace App\Observers;

    use App\Models\User;

    class UserObserver
    {
        /**
         * 在所有事务提交后处理事件。
         *
         * @var bool
         */
        public $afterCommit = true;

        /**
         * 处理 User "created" 事件。
         *
         * @param  \App\Models\User  $user
         * @return void
         */
        public function created(User $user)
        {
            //
        }
    }

<a name="muting-events"></a>
### 静默事件

有时你可能需要临时"静默"模型触发的所有事件。可以使用 `withoutEvents` 方法实现。`withoutEvents` 方法接受闭包作为其唯一参数。在此闭包内执行的任何代码都不会分发模型事件，闭包返回的任何值都将由 `withoutEvents` 方法返回：

    use App\Models\User;

    $user = User::withoutEvents(function () {
        User::findOrFail(1)->delete();

        return User::find(2);
    });

<a name="saving-a-single-model-without-events"></a>
#### 不触发事件保存单个模型

有时你可能希望"保存"给定模型而不分发任何事件。可以使用 `saveQuietly` 方法实现：

    $user = User::findOrFail(1);

    $user->name = 'Victoria Faith';

    $user->saveQuietly();

还可以不分发任何事件来"更新"、"删除"、"软删除"、"恢复"和"复制"给定模型：

    $user->deleteQuietly();
    $user->forceDeleteQuietly();
    $user->restoreQuietly();
