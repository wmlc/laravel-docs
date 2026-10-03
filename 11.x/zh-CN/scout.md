# Laravel Scout

- [简介](#introduction)
- [安装](#installation)
    - [队列](#queueing)
- [驱动前置条件](#driver-prerequisites)
    - [Algolia](#algolia)
    - [Meilisearch](#meilisearch)
    - [Typesense](#typesense)
- [配置](#configuration)
    - [配置模型索引](#configuring-model-indexes)
    - [配置可搜索数据](#configuring-searchable-data)
    - [配置模型 ID](#configuring-the-model-id)
    - [按模型配置搜索引擎](#configuring-search-engines-per-model)
    - [识别用户](#identifying-users)
- [数据库／集合引擎](#database-and-collection-engines)
    - [数据库引擎](#database-engine)
    - [集合引擎](#collection-engine)
- [索引](#indexing)
    - [批量导入](#batch-import)
    - [添加记录](#adding-records)
    - [更新记录](#updating-records)
    - [移除记录](#removing-records)
    - [暂停索引](#pausing-indexing)
    - [有条件可搜索的模型实例](#conditionally-searchable-model-instances)
- [搜索](#searching)
    - [Where 条件](#where-clauses)
    - [分页](#pagination)
    - [软删除](#soft-deleting)
    - [定制引擎搜索](#customizing-engine-searches)
- [自定义引擎](#custom-engines)

<a name="introduction"></a>
## 简介

[Laravel Scout](https://github.com/laravel/scout) 提供了一套简单、基于驱动的方案，为你的 [Eloquent 模型](/docs/{{version}}/eloquent)添加全文搜索。借助模型观察者，Scout 会自动让你的搜索索引与 Eloquent 记录保持同步。

目前，Scout 自带 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com)、[Typesense](https://typesense.org) 以及 MySQL／PostgreSQL（`database`）驱动。此外，Scout 还包含一个专为本地开发设计的「collection」驱动，它不需要任何外部依赖或第三方服务此外，编写自定义驱动非常简单，你可以自由地用自有搜索引擎实现来扩展 Scout。

<a name="installation"></a>
## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，你应当使用 `vendor:publish` Artisan 命令发布 Scout 的配置文件。该命令会把 `scout.php` 配置文件发布到应用的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，把 `Laravel\Scout\Searchable` Trait 添加到你希望可搜索的模型上。该 Trait 会注册一个模型观察者，自动让模型与你的搜索驱动保持同步：

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

<a name="queueing"></a>
### 队列

虽然使用 Scout 并不严格要求配置队列，但你强烈建议在使用该库之前先配置好[队列驱动](/docs/{{version}}/queues)。运行队列工作进程可以让 Scout 把所有把模型信息同步到搜索索引的操作放入队列，从而为你的应用 Web 界面带来更好的响应时间。

配置好队列驱动后，把 `config/scout.php` 配置文件中的 `queue` 选项值设为 `true`：

```php
'queue' => true,
```

即使把 `queue` 选项设为 `false`，也要记住 Algolia 和 Meilisearch 等 Scout 驱动始终异步索引记录。也就是说，即便索引操作在你的 Laravel 应用中已经完成，搜索引擎本身也可能不会立即反映新增和更新的记录。

要指定 Scout 作业使用的连接和队列，可以把 `queue` 配置选项定义为一个数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果你自定义了 Scout 作业使用的连接和队列，就应当运行一个队列工作进程来处理该连接和队列上的作业：

```shell
php artisan queue:work redis --queue=scout
```

<a name="driver-prerequisites"></a>
## 驱动前置条件

<a name="algolia"></a>
### Algolia

使用 Algolia 驱动时，你应当在 `config/scout.php` 配置文件中配置 Algolia 的 `id` 和 `secret` 凭据。配置好凭据后，还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

<a name="meilisearch"></a>
### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一个快如闪电的开源搜索引擎。如果你不确定如何在本地机器上安装 Meilisearch，可以使用 [Laravel Sail](/docs/{{version}}/sail#meilisearch)，即 Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，你需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在应用的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量，以及 Meilisearch 的 `host` 和 `key` 凭据：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

关于 Meilisearch 的更多信息，请查阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，你还应当通过查阅 [Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，确保安装的 `meilisearch/meilisearch-php` 版本与你的 Meilisearch 二进制版本兼容。

> [!WARNING]
> 在使用 Meilisearch 的应用上升级 Scout 时，你始终应当[查阅 Meilisearch 服务本身的其他破坏性变更](https://github.com/meilisearch/Meilisearch/releases)。

<a name="typesense"></a>
### Typesense

[Typesense](https://typesense.org) 是一个闪电般快的开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

你可以[自托管](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) Typesense，也可以使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始使用 Scout 集成 Typesense，请通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在应用的 .env 文件中设置 `SCOUT_DRIVER` 环境变量，以及 Typesense 的主机和 API 密钥凭据：

```ini
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，可能需要调整 `TYPESENSE_HOST` 环境变量以匹配 Docker 容器名称。你还可以选择性地指定安装的端口、路径和协议：

```ini
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

Typesense 集合的额外设置和 schema 定义可以在应用的 `config/scout.php` 配置文件中找到。关于 Typesense 的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

<a name="preparing-data-for-storage-in-typesense"></a>
#### 为在 Typesense 中存储数据做准备

使用 Typesense 时，你的可搜索模型必须定义一个 `toSearchableArray` 方法，把模型的主键转换为字符串、创建日期转换为 UNIX 时间戳：

```php
/**
 * 获取该模型的可索引数据数组。
 *
 * @return array<string, mixed>
 */
public function toSearchableArray()
{
    return array_merge($this->toArray(),[
        'id' => (string) $this->id,
        'created_at' => $this->created_at->timestamp,
    ]);
}
```

你还应当在应用的 `config/scout.php` 文件中定义 Typesense 集合的 schema。集合 schema 描述了每个可通过 Typesense 搜索的字段的数据类型。关于所有可用 schema 选项的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果你需要在定义之后更改 Typesense 集合的 schema，可以运行 `scout:flush` 和 `scout:import`，这会删除所有已索引数据并重建 schema。也可以使用 Typesense 的 API 修改集合的 schema，而不移除任何已索引数据。

如果你的可搜索模型支持软删除，就应当在应用的 `config/scout.php` 配置文件中，为该模型对应的 Typesense schema 定义一个 `__soft_deleted` 字段：

```php
User::class => [
    'collection-schema' => [
        'fields' => [
            // ...
            [
                'name' => '__soft_deleted',
                'type' => 'int32',
                'optional' => true,
            ],
        ],
    ],
],
```

<a name="typesense-dynamic-search-parameters"></a>
#### 动态搜索参数

通过 `options` 方法，你可以在执行搜索操作时动态修改 Typesense 的[搜索参数](https://typesense.org/docs/latest/api/search.html#search-parameters)：

```php
use App\Models\Todo;

Todo::search('Groceries')->options([
    'query_by' => 'title, description'
])->get();
```

<a name="configuration"></a>
## 配置

<a name="configuring-model-indexes"></a>
### 配置模型索引

每个 Eloquent 模型都会与一个特定的搜索「索引」同步，该索引包含该模型的所有可搜索记录。换句话说，你可以把每个索引看作一张 MySQL 表。默认情况下，每个模型都会被持久化到与该模型常规「表」名相匹配的索引中。这通常是模型名称的复数形式；不过，你也可以通过在模型上覆盖 `searchableAs` 方法来自定义模型的索引：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取与该模型关联的索引名称。
     */
    public function searchableAs(): string
    {
        return 'posts_index';
    }
}
```

<a name="configuring-searchable-data"></a>
### 配置可搜索数据

默认情况下，某个模型完整的 `toArray` 形式都会被持久化到它的搜索索引中。如果想定制同步到搜索索引的数据，可以在模型上覆盖 `toSearchableArray` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取该模型的可索引数据数组。
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $array = $this->toArray();

        // 定制数据数组...

        return $array;
    }
}
```

Meilisearch 等搜索引擎只会对类型正确的数据执行筛选操作（`>`、`<` 等）。因此，使用这些搜索引擎并定制可搜索数据时，应确保数值被转换为正确的类型：

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

<a name="configuring-indexes-for-algolia"></a>
#### 配置索引设置（Algolia）

有时你可能想在 Algolia 索引上配置额外设置。虽然你可以通过 Algolia UI 管理这些设置，但直接在你的应用 `config/scout.php` 配置文件中管理索引配置的期望状态有时更高效。

这种方式让你可以通过应用的自动化部署流程来部署这些设置，免去手动配置，并确保多个环境之间保持一致。你可以配置可筛选属性、排序、分面，或[其它任何受支持的设置](https://www.algolia.com/doc/rest-api/search/#tag/Indices/operation/setSettings)。

要开始使用，请在应用的 `config/scout.php` 配置文件中为每个索引添加设置：

```php
use App\Models\User;
use App\Models\Flight;

'algolia' => [
    'id' => env('ALGOLIA_APP_ID', ''),
    'secret' => env('ALGOLIA_SECRET', ''),
    'index-settings' => [
        User::class => [
            'searchableAttributes' => ['id', 'name', 'email'],
            'attributesForFaceting'=> ['filterOnly(email)'],
            // 其它设置字段...
        ],
        Flight::class => [
            'searchableAttributes'=> ['id', 'destination'],
        ],
    ],
],
```

如果某个索引底层的模型支持软删除且被包含在 `index-settings` 数组中，Scout 会自动为该索引加入对软删除模型分面的支持。如果该软删除模型索引没有其它分面属性需要定义，可以直接为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。该命令会把你当前配置的索引设置告知 Algolia。为方便起见，你可能希望把该命令纳入部署流程：

```shell
php artisan scout:sync-index-settings
```

<a name="configuring-filterable-data-for-meilisearch"></a>
#### 配置可筛选数据与索引设置（Meilisearch）

与 Scout 的其它驱动不同，Meilisearch 要求你预先定义索引搜索设置，例如可筛选属性、可排序属性以及[其它受支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可筛选属性是指你打算在调用 Scout 的 `where` 方法时用于筛选的属性，可排序属性是指你打算在调用 Scout 的 `orderBy` 方法时用于排序的属性。要定义索引设置，请调整应用 `scout` 配置文件中 `meilisearch` 配置项的 `index-settings` 部分：

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
            // 其它设置字段...
        ],
        Flight::class => [
            'filterableAttributes'=> ['id', 'destination'],
            'sortableAttributes' => ['updated_at'],
        ],
    ],
],
```

如果某个索引底层的模型支持软删除且被包含在 `index-settings` 数组中，Scout 会自动为该索引加入对软删除模型筛选的支持。如果该软删除模型索引没有其它可筛选或可排序属性需要定义，可以直接为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。该命令会把你当前配置的索引设置告知 Meilisearch。为方便起见，你可能希望把该命令纳入部署流程：

```shell
php artisan scout:sync-index-settings
```

<a name="configuring-the-model-id"></a>
### 配置模型 ID

默认情况下，Scout 会使用模型的主键作为存入搜索索引的模型唯一 ID／键。如果需要定制这一行为，可以在模型上覆盖 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引该模型的值。
     */
    public function getScoutKey(): mixed
    {
        return $this->email;
    }

    /**
     * 获取用于索引该模型的键名。
     */
    public function getScoutKeyName(): mixed
    {
        return 'email';
    }
}
```

<a name="configuring-search-engines-per-model"></a>
### 按模型配置搜索引擎

执行搜索时，Scout 通常会使用应用 `scout` 配置文件中指定的默认搜索引擎。不过，可以通过在模型上覆盖 `searchableUsing` 方法来更改某个特定模型使用的搜索引擎：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Engines\Engine;
use Laravel\Scout\EngineManager;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引该模型的引擎。
     */
    public function searchableUsing(): Engine
    {
        return app(EngineManager::class)->engine('meilisearch');
    }
}
```

<a name="identifying-users"></a>
### 识别用户

使用 [Algolia](https://algolia.com) 时，Scout 还允许你自动识别用户。把已认证用户与搜索操作关联起来，在 Algolia 仪表盘中查看搜索分析时可能很有帮助。你可以在应用的 `.env` 文件中把 `SCOUT_IDENTIFY` 环境变量定义为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用该特性后，还会把请求的 IP 地址和已认证用户的主标识符一并传给 Algolia，从而让这些数据与该用户发起的任何搜索请求关联起来。

<a name="database-and-collection-engines"></a>
## 数据库／集合引擎

<a name="database-engine"></a>
### 数据库引擎

> [!WARNING]
> 数据库引擎目前支持 MySQL 和 PostgreSQL。

如果你的应用使用规模较小到中等规模的数据库，或负载较轻，你可能会发现使用 Scout 的「database」引擎上手更为方便。数据库引擎在你现有的数据库中筛选结果时会使用「where like」条件和全文索引，以确定适用于你的查询的搜索结果。

要使用数据库引擎，只需把 `SCOUT_DRIVER` 环境变量的值设为 `database`，或者在应用的 `scout` 配置文件中直接指定 `database` 驱动：

```ini
SCOUT_DRIVER=database
```

指定数据库引擎为你偏好的驱动后，必须先[配置你的可搜索数据](#configuring-searchable-data)，然后就可以开始对模型[执行搜索查询](#searching)了。使用数据库引擎时，无需进行搜索引擎索引操作，例如为 Algolia、Meilisearch 或 Typesense 索引填充数据所需的索引动作。

#### 自定义数据库搜索策略

默认情况下，数据库引擎会对每个[已配置为可搜索](#configuring-searchable-data)的模型属性执行「where like」查询。不过在某些情况下，这可能导致性能不佳。因此，你可以配置数据库引擎的搜索策略，让指定列使用全文搜索查询，或者只使用「where like」约束来搜索字符串前缀（`example%`），而不是在整个字符串中搜索（`%example%`）。

要定义该行为，可以向模型的 `toSearchableArray` 方法赋值 PHP 属性。未被赋予额外搜索策略行为的列将继续使用默认的「where like」策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * 获取该模型的可索引数据数组。
 *
 * @return array<string, mixed>
 */
#[SearchUsingPrefix(['id', 'email'])]
#[SearchUsingFullText(['bio'])]
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
    ];
}
```

> [!WARNING]
> 在指定某个列应使用全文查询约束之前，请确保该列已被赋予[全文索引](/docs/{{version}}/migrations#available-index-types)。

<a name="collection-engine"></a>
### 集合引擎

虽然你可以在本地开发期间自由使用 Algolia、Meilisearch 或 Typesense 搜索引擎，但你可能会发现使用「collection」引擎上手更为方便。集合引擎在你现有的数据库中对结果使用「where」条件和集合筛选，以确定适用于你的查询的搜索结果。使用该引擎时，无需「索引」你的可搜索模型，因为它们只会从本地数据库中检索出来。

要使用集合引擎，只需把 `SCOUT_DRIVER` 环境变量的值设为 `collection`，或者在应用的 `scout` 配置文件中直接指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

指定集合驱动为你偏好的驱动后，就可以开始对模型[执行搜索查询](#searching)了。使用集合引擎时，无需进行搜索引擎索引操作，例如为 Algolia、Meilisearch 或 Typesense 索引填充数据所需的索引动作。

#### 与数据库引擎的差异

乍看之下，「database」引擎与「collections」引擎相当相似。它们都直接与数据库交互以获取搜索结果。不过，集合引擎不会使用全文索引或 `LIKE` 条件来查找匹配的记录，而是拉取所有可能的记录，并使用 Laravel 的 `Str::is` 辅助函数判断搜索字符串是否存在于模型的属性值中。

集合引擎是移植性最强的搜索引擎，因为它可以在 Laravel 支持的所有关系型数据库上工作（包括 SQLite 和 SQL Server）；不过，它的效率不如 Scout 的数据库引擎。

<a name="indexing"></a>
## 索引

<a name="batch-import"></a>
### 批量导入

如果你要把 Scout 安装到一个已有项目中，可能已经有需要导入索引的数据库记录。Scout 提供了 `scout:import` Artisan 命令，可用于把所有已有记录导入你的搜索索引：

```shell
php artisan scout:import "App\Models\Post"
```

`flush` 命令可用于从搜索索引中移除某个模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

<a name="modifying-the-import-query"></a>
#### 修改导入查询

如果你想修改批量导入时用于检索所有模型的查询，可以在模型上定义 `makeAllSearchableUsing` 方法。这是一个很好的地方，可以添加导入模型之前所需的任何关联预加载：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * 修改在使所有模型可搜索时用于检索模型的查询。
 */
protected function makeAllSearchableUsing(Builder $query): Builder
{
    return $query->with('author');
}
```

> [!WARNING]
> 使用队列批量导入模型时，`makeAllSearchableUsing` 方法可能不适用。当作业处理模型集合时，关联[不会被恢复](/docs/{{version}}/queues#handling-relationships)。

<a name="adding-records"></a>
### 添加记录

把 `Laravel\Scout\Searchable` Trait 添加到模型后，你只需对模型实例执行 `save` 或 `create`，它就会被自动添加到你的搜索索引。如果你已把 Scout 配置为[使用队列](#queueing)，该操作会由队列工作进程在后台完成：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

<a name="adding-records-via-query"></a>
#### 通过查询添加记录

如果你希望通过 Eloquent 查询把一组模型添加到搜索索引，可以把 `searchable` 方法链式调用到该 Eloquent 查询上。`searchable` 方法会[对查询结果分块处理](/docs/{{version}}/eloquent#chunking-results)，并把记录添加到搜索索引。再次强调，如果你把 Scout 配置为使用队列，所有分块都会由队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

你也可以在 Eloquent 关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你内存中已经有一组 Eloquent 模型，可以在集合实例上调用 `searchable` 方法，把模型实例添加到各自对应的索引中：

```php
$orders->searchable();
```

> [!NOTE]
> `searchable` 方法可以被视为一次「upsert」操作。也就是说，如果模型记录已在索引中，它会被更新；如果它不存在于搜索索引中，则会被添加到索引。

<a name="updating-records"></a>
### 更新记录

要更新一个可搜索模型，你只需更新模型实例的属性，并把模型 `save` 到数据库。Scout 会自动把改动持久化到你的搜索索引：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

你也可以在 Eloquent 查询实例上调用 `searchable` 方法来更新一组模型。如果这些模型不存在于搜索索引中，它们会被创建：

```php
Order::where('price', '>', 100)->searchable();
```

如果你想更新某个关联中所有模型的搜索索引记录，可以在关联实例上调用 `searchable`：

```php
$user->orders()->searchable();
```

或者，如果你内存中已经有一组 Eloquent 模型，可以在集合实例上调用 `searchable` 方法，把模型实例更新到各自对应的索引中：

```php
$orders->searchable();
```

<a name="modifying-records-before-importing"></a>
#### 导入前修改记录

有时你需要在模型变为可搜索之前准备这组模型。例如，你可能想预加载某个关联，从而把关联数据高效地添加到搜索索引中。为此，请在相应模型上定义一个 `makeSearchableUsing` 方法：

```php
use Illuminate\Database\Eloquent\Collection;

/**
 * 修改正在变为可搜索的模型集合。
 */
public function makeSearchableUsing(Collection $models): Collection
{
    return $models->load('author');
}
```

<a name="removing-records"></a>
### 移除记录

要从索引中移除一条记录，只需把模型从数据库中 `delete`。即使你使用的是[软删除](/docs/{{version}}/eloquent#soft-deleting)模型，也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果你不想在删除记录之前先检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果你想移除某个关联中所有模型的搜索索引记录，可以在关联实例上调用 `unsearchable`：

```php
$user->orders()->unsearchable();
```

或者，如果你内存中已经有一组 Eloquent 模型，可以在集合实例上调用 `unsearchable` 方法，把模型实例从各自对应的索引中移除：

```php
$orders->unsearchable();
```

要把所有模型记录从各自对应的索引中移除，可以调用 `removeAllFromSearch` 方法：

```php
Order::removeAllFromSearch();
```

<a name="pausing-indexing"></a>
### 暂停索引

有时你可能需要在某个模型上执行一批 Eloquent 操作，同时又不同步模型数据到搜索索引。为此可以使用 `withoutSyncingToSearch` 方法。该方法接受一个闭包并会立即执行它。闭包内发生的任何模型操作都不会同步到该模型的索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

<a name="conditionally-searchable-model-instances"></a>
### 有条件可搜索的模型实例

有时你可能只需要在特定条件下让模型可搜索。例如，假设你有一个 `App\Models\Post` 模型，它可能处于两种状态之一：「draft」和「published」。你可能只希望「published」的文章可搜索。为此，可以在模型上定义一个 `shouldBeSearchable` 方法：

```php
/**
 * 判断该模型是否应当可搜索。
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法只在通过 `save` 和 `create` 方法、查询或关联操作模型时才会生效。直接使用 `searchable` 方法让模型或集合可搜索，会覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]
> 使用 Scout 的「database」引擎时，`shouldBeSearchable` 方法不适用，因为所有可搜索数据始终存储在数据库中。要在使用数据库引擎时获得类似行为，应改用 [Where 条件](#where-clauses)。

<a name="searching"></a>
## 搜索

你可以使用 `search` 方法开始搜索模型。该方法接受一个用于搜索模型的字符串。然后把 `get` 方法链式调用到搜索查询上，以获取匹配给定搜索查询的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 的搜索返回一组 Eloquent 模型，你甚至可以直接从路由或控制器返回结果，它们会被自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果你想在结果被转换为 Eloquent 模型之前获取原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

<a name="custom-indexes"></a>
#### 自定义索引

搜索查询通常会在模型 [`searchableAs`](#configuring-model-indexes) 方法所指定的索引上执行。不过，你可以使用 `within` 方法指定要搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

<a name="where-clauses"></a>
### Where 条件

Scout 允许你为搜索查询添加简单的「where」条件。目前这些条件只支持基本的数值相等性检查，主要用于按所有者 ID 限定搜索查询范围：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

此外，`whereIn` 方法可用于验证给定列的值是否包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['open', 'paid']
)->get();
```

`whereNotIn` 方法用于验证给定列的值不包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereNotIn(
    'status', ['closed']
)->get();
```

由于搜索索引不是关系型数据库，目前尚不支持更高级的「where」条件。

> [!WARNING]
> 如果你的应用使用 Meilisearch，在使用 Scout 的「where」条件之前，必须先配置应用的[可筛选属性](#configuring-filterable-data-for-meilisearch)。

<a name="pagination"></a>
### 分页

除了获取一组模型之外，你还可以使用 `paginate` 方法对搜索结果进行分页。该方法会返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，就如同你对传统 Eloquent 查询[进行分页](/docs/{{version}}/pagination)一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

你可以把数量作为 `paginate` 方法的第一个参数传入，以指定每页要获取的模型数量：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

获取结果后，你可以使用 [Blade](/docs/{{version}}/blade) 展示结果并渲染分页链接，就如同你对传统 Eloquent 查询进行分页一样：

```blade
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果你想以 JSON 形式获取分页结果，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]
> 由于搜索引擎并不了解你 Eloquent 模型的全局作用域定义，因此在使用了 Scout 分页的应用中不应使用全局作用域。或者，你应当在通过 Scout 搜索时重新创建全局作用域的约束。

<a name="soft-deleting"></a>
### 软删除

如果你的索引模型使用了[软删除](/docs/{{version}}/eloquent#soft-deleting)，并且需要搜索软删除的模型，请把 `config/scout.php` 配置文件的 `soft_delete` 选项设为 `true`：

```php
'soft_delete' => true,
```

当该配置选项为 `true` 时，Scout 不会把软删除的模型从搜索索引中移除，而是在已索引记录上设置一个隐藏的 `__soft_deleted` 属性。随后，你可以在搜索时使用 `withTrashed` 或 `onlyTrashed` 方法获取软删除的记录：

```php
use App\Models\Order;

// 获取结果时包含已软删除的记录...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 获取结果时只包含已软删除的记录...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]
> 当软删除的模型被 `forceDelete` 永久删除时，Scout 会自动把它从搜索索引中移除。

<a name="customizing-engine-searches"></a>
### 定制引擎搜索

如果需要对某个引擎的搜索行为进行高级定制，可以把闭包作为 `search` 方法的第二个参数传入。例如，你可以在搜索查询传给 Algolia 之前，用该回调向搜索选项中添加地理位置数据：

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
#### 定制 Eloquent 结果查询

当 Scout 从你的应用搜索引擎中检索出一份匹配的 Eloquent 模型列表后，Eloquent 会按主键获取所有匹配的模型。你可以调用 `query` 方法来自定义该查询。`query` 方法接受一个闭包，该闭包会接收到 Eloquent 查询构造器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

由于该回调是在相关模型已经从应用搜索引擎中检索出来之后才被调用的，因此不应把 `query` 方法用于「筛选」结果。你应当改用 [Scout 的 Where 条件](#where-clauses)。

<a name="custom-engines"></a>
## 自定义引擎

<a name="writing-the-engine"></a>
#### 编写引擎

如果内置的 Scout 搜索引擎都不满足你的需求，你可以编写自己的自定义引擎并注册到 Scout。你的引擎应当继承 `Laravel\Scout\Engines\Engine` 抽象类。这个抽象类包含八个你的自定义引擎必须实现的方法：

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

查看 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现会很有帮助。这个类为你提供了一个很好的起点，帮助你了解如何在自己的引擎中实现每个方法。

<a name="registering-the-engine"></a>
#### 注册引擎

编写好自定义引擎后，你可以使用 Scout 引擎管理器的 `extend` 方法把它注册到 Scout。Scout 的引擎管理器可以从 Laravel 服务容器中解析。你应当在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中，或应用使用的其它服务提供者中调用 `extend` 方法：

```php
use App\ScoutExtensions\MySqlSearchEngine;
use Laravel\Scout\EngineManager;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    resolve(EngineManager::class)->extend('mysql', function () {
        return new MySqlSearchEngine;
    });
}
```

引擎注册完成后，你可以在应用的 `config/scout.php` 配置文件中把它指定为默认的 Scout `driver`：

```php
'driver' => 'mysql',
```