# Laravel Scout

- [简介](#introduction)
- [安装](#installation)
    - [驱动前提条件](#driver-prerequisites)
    - [队列](#queueing)
- [配置](#configuration)
    - [配置模型索引](#configuring-model-indexes)
    - [配置可搜索数据](#configuring-searchable-data)
    - [配置模型 ID](#configuring-the-model-id)
    - [为模型配置搜索引擎](#configuring-search-engines-per-model)
    - [识别用户](#identifying-users)
- [数据库 / 集合引擎](#database-and-collection-engines)
    - [数据库引擎](#database-engine)
    - [集合引擎](#collection-engine)
- [索引](#indexing)
    - [批量导入](#batch-import)
    - [添加记录](#adding-records)
    - [更新记录](#updating-records)
    - [移除记录](#removing-records)
    - [暂停索引](#pausing-indexing)
    - [条件可搜索模型实例](#conditionally-searchable-model-instances)
- [搜索](#searching)
    - [Where 子句](#where-clauses)
    - [分页](#pagination)
    - [软删除](#soft-deleting)
    - [自定义引擎搜索](#customizing-engine-searches)
- [自定义引擎](#custom-engines)
- [Builder 宏](#builder-macros)

<a name="introduction"></a>
## 简介

[Laravel Scout](https://github.com/laravel/scout) 为你的 [Eloquent 模型](/docs/{{version}}/eloquent)添加全文搜索提供了一个简单的、基于驱动的解决方案。使用模型观察者，Scout 会自动保持你的搜索索引与 Eloquent 记录同步。

目前，Scout 自带 [Algolia](https://www.algolia.com/)、[MeiliSearch](https://www.meilisearch.com) 和 MySQL / PostgreSQL（`database`）驱动。此外，Scout 包含一个专为本地开发使用设计的"collection"驱动，不需要任何外部依赖或第三方服务。此外，编写自定义驱动非常简单，你可以自由地使用自己的搜索实现扩展 Scout。

<a name="installation"></a>
## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，你应使用 `vendor:publish` Artisan 命令发布 Scout 配置文件。此命令会将 `scout.php` 配置文件发布到应用程序的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` Trait 添加到你希望使其可搜索的模型上。此 Trait 将注册一个模型观察者，自动保持模型与搜索驱动同步：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;
}
```

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="algolia"></a>
#### Algolia

使用 Algolia 驱动时，你应在 `config/scout.php` 配置文件中配置 Algolia `id` 和 `secret` 凭证。配置凭证后，你还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

<a name="meilisearch"></a>
#### MeiliSearch

[MeiliSearch](https://www.meilisearch.com) 是一个极速的开源搜索引擎。如果你不确定如何在本地机器上安装 MeiliSearch，可以使用 [Laravel Sail](/docs/{{version}}/sail#meilisearch)，Laravel 官方支持的 Docker 开发环境。

使用 MeiliSearch 驱动时，你需要通过 Composer 包管理器安装 MeiliSearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在应用程序的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及 MeiliSearch `host` 和 `key` 凭证：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 MeiliSearch 的更多信息，请查阅 [MeiliSearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，你应通过查看[MeiliSearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)来确保安装的 `meilisearch/meilisearch-php` 版本与你的 MeiliSearch 二进制版本兼容。

> **Warning**  
> 在使用 MeiliSearch 的应用程序上升级 Scout 时，你应始终[查看 MeiliSearch 服务本身的任何额外破坏性更改](https://github.com/meilisearch/MeiliSearch/releases)。

<a name="queueing"></a>
### 队列

虽然使用 Scout 并非严格要求，但你应强烈考虑在使用该库之前配置[队列驱动](/docs/{{version}}/queues)。运行队列工作进程将允许 Scout 将所有同步模型信息到搜索索引的操作排队，从而为应用程序的 Web 界面提供更好的响应时间。

配置队列驱动后，将 `config/scout.php` 配置文件中 `queue` 选项的值设置为 `true`：

```php
'queue' => true,
```

即使 `queue` 选项设置为 `false`，也请记住，某些 Scout 驱动（如 Algolia 和 Meilisearch）始终异步索引记录。这意味着，即使索引操作已在 Laravel 应用程序内完成，搜索引擎本身可能不会立即反映新增和更新的记录。

要指定 Scout 作业使用的连接和队列，你可以将 `queue` 配置选项定义为数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

<a name="configuration"></a>
## 配置

<a name="configuring-model-indexes"></a>
### 配置模型索引

每个 Eloquent 模型都与给定的搜索"索引"同步，该索引包含该模型的所有可搜索记录。换句话说，你可以将每个索引视为 MySQL 表。默认情况下，每个模型将持久化到与模型典型"表"名匹配的索引。通常，这是模型名称的复数形式；但是，你可以通过在模型上覆盖 `searchableAs` 方法来自定义模型的索引：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取与模型关联的索引名称。
     *
     * @return string
     */
    public function searchableAs()
    {
        return 'posts_index';
    }
}
```

<a name="configuring-searchable-data"></a>
### 配置可搜索数据

默认情况下，给定模型的整个 `toArray` 形式将持久化到其搜索索引。如果你想自定义同步到搜索索引的数据，可以在模型上覆盖 `toSearchableArray` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取模型的可索引数据数组。
     *
     * @return array
     */
    public function toSearchableArray()
    {
        $array = $this->toArray();

        // 自定义数据数组...

        return $array;
    }
}
```

某些搜索引擎（如 MeiliSearch）仅对正确类型的数据执行过滤操作（`>`、`<` 等）。因此，使用这些搜索引擎并自定义可搜索数据时，你应确保数值被转换为其正确的类型：

```php
public function toSearchableArray()
{
    return [
        'id' => (int) $this->id,
        'name' => $this->name,
        'price' => (float) $this->price,
    ];
}
```

<a name="configuring-filterable-data-for-meilisearch"></a>
#### 配置可过滤数据与索引设置（MeiliSearch）

与 Scout 的其他驱动不同，MeiliSearch 要求你预定义索引搜索设置，如可过滤属性、可排序属性和[其他支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是你计划在调用 Scout 的 `where` 方法时进行过滤的任何属性，而可排序属性是你计划在调用 Scout 的 `orderBy` 方法时进行排序的任何属性。要定义索引设置，请在应用程序的 `scout` 配置文件中调整 `meilisearch` 配置条目的 `index-settings` 部分：

```php
use App\Models\User;
use App\Models\Flight;

'meilisearch' => [
    'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
    'key' => env('MEILISEARCH_KEY', null),
    'index-settings' => [
        User::class => [
            'filterableAttributes'=> ['id', 'name', 'email'],
            'sortableAttributes' => ['created_at'],
            // 其他设置字段...
        ],
        Flight::class => [
            'filterableAttributes'=> ['id', 'destination'],
            'sortableAttributes' => ['updated_at'],
        ],
    ],
],
```

如果给定索引的底层模型支持软删除且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型的过滤支持。如果你没有其他要为支持软删除的模型索引定义的可过滤或可排序属性，只需在 `index-settings` 数组中为该模型添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用程序的索引设置后，你必须调用 `scout:sync-index-settings` Artisan 命令。此命令将通知 MeiliSearch 你当前配置的索引设置。为方便起见，你可能希望将此命令作为部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="configuring-the-model-id"></a>
### 配置模型 ID

默认情况下，Scout 将使用模型的主键作为存储在搜索索引中的模型唯一 ID / 键。如果你需要自定义此行为，可以在模型上覆盖 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的值。
     *
     * @return mixed
     */
    public function getScoutKey()
    {
        return $this->email;
    }

    /**
     * 获取用于索引模型的键名。
     *
     * @return mixed
     */
    public function getScoutKeyName()
    {
        return 'email';
    }
}
```

<a name="configuring-search-engines-per-model"></a>
### 为模型配置搜索引擎

搜索时，Scout 通常使用应用程序 `scout` 配置文件中指定的默认搜索引擎。但是，可以通过在模型上覆盖 `searchableUsing` 方法来更改特定模型的搜索引擎：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\EngineManager;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的引擎。
     *
     * @return \Laravel\Scout\Engines\Engine
     */
    public function searchableUsing()
    {
        return app(EngineManager::class)->engine('meilisearch');
    }
}
```

<a name="identifying-users"></a>
### 识别用户

Scout 还允许你在使用 [Algolia](https://algolia.com) 时自动识别用户。将已认证用户与搜索操作关联在 Algolia 仪表盘中查看搜索分析时可能很有用。你可以通过在应用程序的 `.env` 文件中将 `SCOUT_IDENTIFY` 环境变量定义为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用此功能后，还会将请求的 IP 地址和已认证用户的主标识符传递给 Algolia，以便此数据与用户进行的任何搜索请求关联。

<a name="database-and-collection-engines"></a>
## 数据库 / 集合引擎

<a name="database-engine"></a>
### 数据库引擎

> **Warning**  
> 数据库引擎目前支持 MySQL 和 PostgreSQL。

如果你的应用程序与中小型数据库交互或工作负载较轻，你可能会发现从 Scout 的"database"引擎开始更方便。数据库引擎将使用"where like"子句和全文索引从现有数据库中过滤结果，以确定查询的适用搜索结果。

要使用数据库引擎，只需将 `SCOUT_DRIVER` 环境变量的值设置为 `database`，或直接在应用程序的 `scout` 配置文件中指定 `database` 驱动：

```ini
SCOUT_DRIVER=database
```

指定数据库引擎为首选驱动后，你必须[配置可搜索数据](#configuring-searchable-data)。然后，你可以开始对模型[执行搜索查询](#searching)。使用数据库引擎时，不需要搜索引擎索引（如填充 Algolia 或 MeiliSearch 索引所需的索引）。

#### 自定义数据库搜索策略

默认情况下，数据库引擎将对你[配置为可搜索](#configuring-searchable-data)的每个模型属性执行"where like"查询。但是，在某些情况下，这可能导致性能不佳。因此，可以配置数据库引擎的搜索策略，使某些指定列使用全文搜索查询，或仅使用"where like"约束来搜索字符串的前缀（`example%`）而不是搜索整个字符串（`%example%`）。

要定义此行为，你可以为模型的 `toSearchableArray` 方法分配 PHP 属性。未分配额外搜索策略行为的任何列将继续使用默认的"where like"策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * 获取模型的可索引数据数组。
 *
 * @return array
 */
#[SearchUsingPrefix(['id', 'email'])]
#[SearchUsingFullText(['bio'])]
public function toSearchableArray()
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
    ];
}
```

> **Warning**  
> 在指定列应使用全文查询约束之前，请确保该列已分配[全文索引](/docs/{{version}}/migrations#available-index-types)。

<a name="collection-engine"></a>
### 集合引擎

虽然你可以在本地开发期间自由使用 Algolia 或 MeiliSearch 搜索引擎，但你可能会发现从"collection"引擎开始更方便。集合引擎将使用"where"子句和对现有数据库结果的集合过滤来确定查询的适用搜索结果。使用此引擎时，不需要"索引"可搜索模型，因为它们将直接从本地数据库中检索。

要使用集合引擎，只需将 `SCOUT_DRIVER` 环境变量的值设置为 `collection`，或直接在应用程序的 `scout` 配置文件中指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

指定集合驱动为首选驱动后，你可以开始对模型[执行搜索查询](#searching)。使用集合引擎时，不需要搜索引擎索引（如填充 Algolia 或 MeiliSearch 索引所需的索引）。

#### 与数据库引擎的差异

乍一看，"database"和"collections"引擎相当相似。它们都直接与数据库交互以检索搜索结果。但是，集合引擎不使用全文索引或 `LIKE` 子句来查找匹配记录。相反，它拉取所有可能的记录，并使用 Laravel 的 `Str::is` 辅助函数来确定搜索字符串是否存在于模型属性值中。

集合引擎是最可移植的搜索引擎，因为它适用于 Laravel 支持的所有关系数据库（包括 SQLite 和 SQL Server）；但是，它的效率低于 Scout 的数据库引擎。

<a name="indexing"></a>
## 索引

<a name="batch-import"></a>
### 批量导入

如果你将 Scout 安装到现有项目中，你可能已有需要导入索引的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，可用于将所有现有记录导入搜索索引：

```shell
php artisan scout:import "App\Models\Post"
```

`flush` 命令可用于从搜索索引中移除模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

<a name="modifying-the-import-query"></a>
#### 修改导入查询

如果你想修改用于检索所有模型进行批量导入的查询，可以在模型上定义 `makeAllSearchableUsing` 方法。这是添加导入模型之前可能需要的任何预加载关联的好地方：

```php
/**
 * 修改使所有模型可搜索时用于检索模型的查询。
 *
 * @param  \Illuminate\Database\Eloquent\Builder  $query
 * @return \Illuminate\Database\Eloquent\Builder
 */
protected function makeAllSearchableUsing($query)
{
    return $query->with('author');
}
```

<a name="adding-records"></a>
### 添加记录

将 `Laravel\Scout\Searchable` Trait 添加到模型后，你需要做的就是 `save` 或 `create` 模型实例，它将自动添加到搜索索引。如果你已配置 Scout [使用队列](#queueing)，此操作将由队列工作进程在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

<a name="adding-records-via-query"></a>
#### 通过查询添加记录

如果你想通过 Eloquent 查询将模型集合添加到搜索索引，可以将 `searchable` 方法链式连接到 Eloquent 查询。`searchable` 方法将[分块处理](/docs/{{version}}/eloquent#chunking-results)查询结果并将记录添加到搜索索引。同样，如果你已配置 Scout 使用队列，所有分块将由队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

你也可以在 Eloquent 关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法将模型实例添加到其相应索引：

```php
$orders->searchable();
```

> **Note**  
> `searchable` 方法可以被视为"upsert"操作。换句话说，如果模型记录已在索引中，它将被更新。如果搜索索引中不存在，它将被添加到索引。

<a name="updating-records"></a>
### 更新记录

要更新可搜索模型，你只需更新模型实例的属性并将模型 `save` 到数据库。Scout 会自动将更改持久化到搜索索引：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

你也可以在 Eloquent 查询实例上调用 `searchable` 方法来更新模型集合。如果模型不在搜索索引中，它们将被创建：

```php
Order::where('price', '>', 100)->searchable();
```

如果你想更新关联中所有模型的搜索索引记录，可以在关联实例上调用 `searchable`：

```php
$user->orders()->searchable();
```

或者，如果你已在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法来更新其相应索引中的模型实例：

```php
$orders->searchable();
```

<a name="removing-records"></a>
### 移除记录

要从索引中移除记录，只需从数据库中 `delete` 模型。即使你使用[软删除](/docs/{{version}}/eloquent#soft-deleting)模型也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果你不想在删除记录之前检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果你想移除关联中所有模型的搜索索引记录，可以在关联实例上调用 `unsearchable`：

```php
$user->orders()->unsearchable();
```

或者，如果你已在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `unsearchable` 方法从其相应索引中移除模型实例：

```php
$orders->unsearchable();
```

<a name="pausing-indexing"></a>
### 暂停索引

有时你可能需要对模型执行一批 Eloquent 操作而不将模型数据同步到搜索索引。你可以使用 `withoutSyncingToSearch` 方法执行此操作。此方法接受一个将立即执行的闭包。闭包内发生的任何模型操作都不会同步到模型的索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

<a name="conditionally-searchable-model-instances"></a>
### 条件可搜索模型实例

有时你可能只需在某些条件下使模型可搜索。例如，假设你有 `App\Models\Post` 模型，可能处于两种状态之一："draft"和"published"。你可能只希望允许"published"文章可搜索。为此，可以在模型上定义 `shouldBeSearchable` 方法：

```php
/**
 * 确定模型是否应可搜索。
 *
 * @return bool
 */
public function shouldBeSearchable()
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法仅在通过 `save` 和 `create` 方法、查询或关联操作模型时应用。直接使用 `searchable` 方法使模型或集合可搜索将覆盖 `shouldBeSearchable` 方法的结果。

> **Warning**  
> `shouldBeSearchable` 方法不适用于 Scout 的"database"引擎，因为所有可搜索数据始终存储在数据库中。要在使用数据库引擎时实现类似行为，你应改用 [where 子句](#where-clauses)。

<a name="searching"></a>
## 搜索

你可以使用 `search` 方法开始搜索模型。search 方法接受一个将用于搜索模型的字符串。然后，你应将 `get` 方法链式连接到搜索查询以检索与给定搜索查询匹配的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 搜索返回 Eloquent 模型集合，你甚至可以直接从路由或控制器返回结果，它们将自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果你想获取转换为 Eloquent 模型之前的原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

<a name="custom-indexes"></a>
#### 自定义索引

搜索查询通常在模型的 [`searchableAs`](#configuring-model-indexes) 方法指定的索引上执行。但是，你可以使用 `within` 方法指定应搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

<a name="where-clauses"></a>
### Where 子句

Scout 允许你向搜索查询添加简单的"where"子句。目前，这些子句仅支持基本的数值相等检查，主要用于按所有者 ID 限定搜索查询范围：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

你可以使用 `whereIn` 方法针对给定值集约束结果：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['paid', 'open']
)->get();
```

由于搜索索引不是关系数据库，目前不支持更高级的"where"子句。

> **Warning**
> 如果你的应用程序使用 MeiliSearch，你必须在利用 Scout 的"where"子句之前配置应用程序的[可过滤属性](#configuring-filterable-data-for-meilisearch)。

<a name="pagination"></a>
### 分页

除了检索模型集合外，你还可以使用 `paginate` 方法对搜索结果进行分页。此方法将返回 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像你[对传统 Eloquent 查询进行分页](/docs/{{version}}/pagination)一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

你可以通过将数量作为第一个参数传递给 `paginate` 方法来指定每页要检索的模型数量：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

检索结果后，你可以使用 [Blade](/docs/{{version}}/blade) 显示结果并渲染页面链接，就像你对传统 Eloquent 查询进行分页一样：

```blade
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果你想以 JSON 检索分页结果，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> **Warning**  
> 由于搜索引擎不知道你的 Eloquent 模型的全局作用域定义，你不应在使用 Scout 分页的应用程序中使用全局作用域。或者，你应在通过 Scout 搜索时重新创建全局作用域的约束。

<a name="soft-deleting"></a>
### 软删除

如果你的索引模型支持[软删除](/docs/{{version}}/eloquent#soft-deleting)且你需要搜索软删除的模型，将 `config/scout.php` 配置文件的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中移除软删除的模型。相反，它会在索引记录上设置一个隐藏的 `__soft_deleted` 属性。然后，你可以使用 `withTrashed` 或 `onlyTrashed` 方法在搜索时检索软删除的记录：

```php
use App\Models\Order;

// 检索结果时包含已删除的记录...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 检索结果时仅包含已删除的记录...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> **Note**  
> 当软删除模型使用 `forceDelete` 永久删除时，Scout 会自动将其从搜索索引中移除。

<a name="customizing-engine-searches"></a>
### 自定义引擎搜索

如果你需要对引擎的搜索行为执行高级自定义，可以将闭包作为 `search` 方法的第二个参数传递。例如，你可以使用此回调在搜索查询传递给 Algolia 之前将地理位置数据添加到搜索选项：

```php
use Algolia\AlgoliaSearch\SearchIndex;
use App\Models\Order;

Order::search(
    'Star Trek',
    function (SearchIndex $algolia, string $query, array $options) {
        $options['body']['query']['bool']['filter']['geo_distance'] = [
            'distance' => '1000km',
            'location' => ['lat' => 36, 'lon' => 111],
        ];

        return $algolia->search($query, $options);
    }
)->get();
```

<a name="customizing-the-eloquent-results-query"></a>
#### 自定义 Eloquent 结果查询

Scout 从应用程序搜索引擎检索匹配的 Eloquent 模型列表后，Eloquent 用于通过主键检索所有匹配模型。你可以通过调用 `query` 方法来自定义此查询。`query` 方法接受一个闭包，该闭包接收 Eloquent 查询构造器实例作为参数：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')
    ->query(fn ($query) => $query->with('invoices'))
    ->get();
```

由于此回调在相关模型已从应用程序搜索引擎检索之后调用，`query` 方法不应用于"过滤"结果。相反，你应使用 [Scout where 子句](#where-clauses)。

<a name="custom-engines"></a>
## 自定义引擎

<a name="writing-the-engine"></a>
#### 编写引擎

如果内置的 Scout 搜索引擎都不适合你的需求，你可以编写自己的自定义引擎并将其注册到 Scout。你的引擎应扩展 `Laravel\Scout\Engines\Engine` 抽象类。此抽象类包含你的自定义引擎必须实现的八个方法：

```php
use Laravel\Scout\Builder;

abstract public function update($models);
abstract public function delete($models);
abstract public function search(Builder $builder);
abstract public function paginate(Builder $builder, $perPage, $page);
abstract public function mapIds($results);
abstract public function map(Builder $builder, $results, $model);
abstract public function getTotalCount($results);
abstract public function flush($model);
```

你可能会发现查看 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现很有帮助。此类将为你学习如何在引擎中实现每个方法提供良好的起点。

<a name="registering-the-engine"></a>
#### 注册引擎

编写自定义引擎后，你可以使用 Scout 引擎管理器的 `extend` 方法将其注册到 Scout。Scout 的引擎管理器可以从 Laravel 服务容器解析。你应从 `App\Providers\AppServiceProvider` 类的 `boot` 方法或应用程序使用的任何其他服务提供者中调用 `extend` 方法：

```php
use App\ScoutExtensions\MySqlSearchEngine
use Laravel\Scout\EngineManager;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    resolve(EngineManager::class)->extend('mysql', function () {
        return new MySqlSearchEngine;
    });
}
```

注册引擎后，你可以在应用程序的 `config/scout.php` 配置文件中将其指定为默认 Scout `driver`：

```php
'driver' => 'mysql',
```

<a name="builder-macros"></a>
## Builder 宏

如果你想定义自定义 Scout 搜索构建器方法，可以在 `Laravel\Scout\Builder` 类上使用 `macro` 方法。通常，"宏"应在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中定义：

```php
use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;
use Laravel\Scout\Builder;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    Builder::macro('count', function () {
        return $this->engine()->getTotalCount(
            $this->engine()->search($this)
        );
    });
}
```

`macro` 函数接受宏名称作为第一个参数，闭包作为第二个参数。宏的闭包将在从 `Laravel\Scout\Builder` 实现调用宏名称时执行：

```php
use App\Models\Order;

Order::search('Star Trek')->count();
```