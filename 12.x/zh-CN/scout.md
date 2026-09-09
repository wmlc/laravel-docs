# Laravel Scout

- [简介](#introduction)
- [安装](#installation)
    - [队列](#queueing)
- [驱动前置要求](#driver-prerequisites)
- [配置](#configuration)
    - [配置可搜索数据](#configuring-searchable-data)
- [数据库 / 集合引擎](#database-and-collection-engines)
    - [数据库引擎](#database-engine)
    - [集合引擎](#collection-engine)
- [第三方引擎配置](#third-party-engine-configuration)
    - [配置模型索引](#configuring-model-indexes)
    - [Algolia](#algolia-configuration)
    - [Meilisearch](#meilisearch-configuration)
    - [Typesense](#typesense-configuration)
- [第三方引擎索引](#indexing)
    - [批量导入](#batch-import)
    - [添加记录](#adding-records)
    - [更新记录](#updating-records)
    - [移除记录](#removing-records)
    - [暂停索引](#pausing-indexing)
    - [有条件地可搜索的模型实例](#conditionally-searchable-model-instances)
- [搜索](#searching)
    - [Where 子句](#where-clauses)
    - [分页](#pagination)
    - [软删除](#soft-deleting)
    - [自定义引擎搜索](#customizing-engine-searches)
- [自定义引擎](#custom-engines)

<a name="introduction"></a>
## 简介

[Laravel Scout](https://github.com/laravel/scout) 提供了一个简单的、基于驱动的解决方案，用于为 [Eloquent 模型](/docs/{{version}}/eloquent)添加全文搜索。Scout 使用模型观察器，自动让你的搜索索引与 Eloquent 记录保持同步。

Scout 内置了一个 `database` 引擎，它使用 MySQL / PostgreSQL 的全文索引和 `LIKE` 子句来搜索你现有的数据库，无需任何外部服务。对大多数应用来说，这就足够了。要概览 Laravel 中所有可用的搜索方案，请查阅[搜索文档](/docs/{{version}}/search)。

当你需要容错输入、分面过滤或大规模地理搜索等功能时，Scout 还提供了 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org) 的驱动。此外，还提供了一个用于本地开发的「collection」驱动，你也可以自由编写[自定义引擎](#custom-engines)。

<a name="installation"></a>
## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 之后，你应当使用 `vendor:publish` Artisan 命令发布 Scout 的配置文件。该命令会将 `scout.php` 配置文件发布到应用的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` trait 添加到你想使其可搜索的模型上。该 trait 会注册一个模型观察器，自动让模型与你的搜索驱动保持同步：

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

使用 `database` 或 `collection` 之外的引擎时，强烈建议你在使用该库之前先配置一个[队列驱动](/docs/{{version}}/queues)。运行队列 worker 可以让 Scout 把所有将模型信息同步到搜索索引的操作放入队列，从而大大改善应用 Web 界面的响应时间。

配置好队列驱动后，将 `config/scout.php` 配置文件中 `queue` 选项的值设置为 `true`：

```php
'queue' => true,
```

需要注意的是，即使 `queue` 选项设置为 `false`，Algolia 和 Meilisearch 等 Scout 驱动也始终以异步方式索引记录。换句话说，即使索引操作已经在你的 Laravel 应用中完成，搜索引擎本身也可能不会立即反映新增和更新的记录。

要指定 Scout 任务使用的连接和队列，你可以将 `queue` 配置项定义为一个数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果你自定义了 Scout 任务使用的连接和队列，应当运行一个队列 worker 来处理该连接和队列上的任务：

```shell
php artisan queue:work redis --queue=scout
```

<a name="driver-prerequisites"></a>
## 驱动前置要求

<a name="algolia"></a>
### Algolia

使用 Algolia 驱动时，你应当在 `config/scout.php` 配置文件中配置 Algolia 的 `id` 和 `secret` 凭据。配置好凭据后，你还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

<a name="meilisearch"></a>
### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一款快速的开源搜索引擎。如果你不确定如何在本地机器上安装 Meilisearch，可以使用 [Laravel Sail](/docs/{{version}}/sail#meilisearch)——Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，你需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在应用的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及 Meilisearch 的 `host` 和 `key` 凭据：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 Meilisearch 的更多信息，请查阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，你应当通过查阅[Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，确保安装的 `meilisearch/meilisearch-php` 版本与你使用的 Meilisearch 二进制版本兼容。

> [!WARNING]
> 在使用 Meilisearch 的应用中升级 Scout 时，你应当始终[查看 Meilisearch 服务本身的额外破坏性变更](https://github.com/meilisearch/Meilisearch/releases)。

<a name="typesense"></a>
### Typesense

[Typesense](https://typesense.org) 是一款极速的开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

你可以[自托管](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) Typesense，也可以使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始在 Scout 中使用 Typesense，请通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在应用的 .env 文件中设置 `SCOUT_DRIVER` 环境变量以及 Typesense 的主机和 API 密钥凭据：

```ini
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果你使用的是 [Laravel Sail](/docs/{{version}}/sail)，可能需要调整 `TYPESENSE_HOST` 环境变量，使其与 Docker 容器名一致。你也可以选择性地指定安装的端口、路径和协议：

```ini
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

Typesense 集合的额外设置和 schema 定义可以在应用的 `config/scout.php` 配置文件中找到。有关 Typesense 的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

<a name="configuration"></a>
## 配置

<a name="configuring-searchable-data"></a>
### 配置可搜索数据

默认情况下，指定模型的整个 `toArray` 形式会被持久化到其搜索索引中。如果你想自定义同步到搜索索引的数据，可以在模型上重写 `toSearchableArray` 方法：

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
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $array = $this->toArray();

        // 自定义数据数组...

        return $array;
    }
}
```

<a name="configuring-search-engines-per-model"></a>
#### 配置模型引擎

执行搜索时，Scout 通常会使用应用的 `scout` 配置文件中指定的默认搜索引擎。不过，你可以通过重写模型上的 `searchableUsing` 方法来更改特定模型所使用的搜索引擎：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Engines\Engine;
use Laravel\Scout\Scout;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引该模型的引擎。
     */
    public function searchableUsing(): Engine
    {
        return Scout::engine('meilisearch');
    }
}
```

<a name="database-and-collection-engines"></a>
## 数据库 / 集合引擎

<a name="database-engine"></a>
### 数据库引擎

> [!WARNING]
> 数据库引擎目前支持 MySQL 和 PostgreSQL，二者都支持快速的全文列索引。

`database` 引擎使用 MySQL / PostgreSQL 的全文索引和 `LIKE` 子句直接搜索你现有的数据库。对许多应用而言，这是添加搜索功能最简单、最实用的方式——无需外部服务或额外的基础设施。

要使用数据库引擎，请将 `SCOUT_DRIVER` 环境变量设置为 `database`：

```ini
SCOUT_DRIVER=database
```

配置完成后，你就可以[定义可搜索数据](#configuring-searchable-data)，并开始针对模型[执行搜索查询](#searching)。与第三方引擎不同，数据库引擎不需要单独的索引步骤，它直接搜索你的数据库表。

#### 自定义数据库搜索策略

默认情况下，数据库引擎会对你[配置为可搜索](#configuring-searchable-data)的每个模型属性执行 `LIKE` 查询。不过，你可以为特定列指定更高效的搜索策略。`SearchUsingFullText` 属性会使用该列在数据库中的全文索引，而 `SearchUsingPrefix` 只匹配字符串的开头部分（`example%`），而不是在整个字符串中搜索（`%example%`）。

要定义这种行为，请将 PHP 属性分配给模型的 `toSearchableArray` 方法。没有分配属性的列将继续使用默认的 `LIKE` 策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * 获取模型的可索引数据数组。
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
> 在指定某一列应使用全文查询约束之前，请确保该列已被分配[全文索引](/docs/{{version}}/migrations#available-index-types)。

<a name="collection-engine"></a>
### 集合引擎

「collection」引擎适用于快速原型、极小的数据集（几百条记录）或运行测试等场景。它会从数据库中检索所有可能的记录，然后使用 Laravel 的 `Str::is` 辅助函数在 PHP 中进行过滤，因此不需要任何索引或数据库特有的功能。对于非简单的用例，你应当改用[数据库引擎](#database-engine)。

要使用集合引擎，只需将 `SCOUT_DRIVER` 环境变量的值设置为 `collection`，或者在应用的 `scout` 配置文件中直接指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

指定集合驱动为首选驱动后，你就可以开始针对模型[执行搜索查询](#searching)了。使用集合引擎时，不需要进行搜索引擎索引，例如为 Algolia、Meilisearch 或 Typesense 建立索引所需的操作。

#### 与数据库引擎的差异

数据库引擎使用全文索引和 `LIKE` 子句高效地查找匹配记录，而集合引擎会拉取所有记录并在 PHP 中过滤。集合引擎是可移植性最好的选择，因为它可以在 Laravel 支持的所有关系型数据库（包括 SQLite 和 SQL Server）上工作；不过，它的效率明显低于数据库引擎，不应用于大型数据集。

<a name="third-party-engine-configuration"></a>
## 第三方引擎配置

以下配置选项仅在使用 Algolia、Meilisearch 或 Typesense 等第三方搜索引擎时才有意义。如果你使用的是[数据库引擎](#database-engine)，可以跳过本节。

<a name="configuring-model-indexes"></a>
### 配置模型索引

使用第三方引擎时，每个 Eloquent 模型都会与一个指定的搜索「索引」同步，该索引包含该模型所有可搜索的记录。默认情况下，每个模型会被持久化到与模型常规「表」名匹配的索引中。通常，这是模型名称的复数形式；不过，你可以通过重写模型上的 `searchableAs` 方法来自由定制模型的索引：

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
     */
    public function searchableAs(): string
    {
        return 'posts_index';
    }
}
```

> [!NOTE]
> 使用数据库引擎时，`searchableAs` 方法不会生效，因为该引擎始终直接搜索模型的数据库表。

<a name="configuring-the-model-id"></a>
#### 配置模型 ID

默认情况下，Scout 会将模型的主键作为存储在搜索索引中的模型唯一 ID / 键。如果你在使用第三方引擎时需要自定义此行为，可以重写模型上的 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引该模型的键值。
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

> [!NOTE]
> 使用数据库引擎时，`getScoutKey` 和 `getScoutKeyName` 方法不会生效，因为该引擎始终使用模型的主键。

<a name="algolia-configuration"></a>
### Algolia

<a name="algolia-index-settings"></a>
#### 索引设置

有时你可能想在 Algolia 索引上配置额外的设置。虽然你可以通过 Algolia 的界面管理这些设置，但有时直接在应用的 `config/scout.php` 配置文件中管理索引配置的期望状态会更高效。

这种方式让你可以通过应用的自动化部署流水线来部署这些设置，避免手动配置，并确保多个环境之间的一致性。你可以配置可过滤属性、排序、分面（faceting）或[任何其他受支持的设置](https://www.algolia.com/doc/rest-api/search/#tag/Indices/operation/setSettings)。

首先，在应用的 `config/scout.php` 配置文件中为每个索引添加设置：

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
            // 其他设置字段...
        ],
        Flight::class => [
            'searchableAttributes'=> ['id', 'destination'],
        ],
    ],
],
```

如果某个索引背后的模型支持软删除，并且该模型包含在 `index-settings` 数组中，Scout 会自动在该索引上包含对软删除模型进行分面过滤的支持。如果对于支持软删除的模型索引没有其他分面属性需要定义，你可以直接在 `index-settings` 数组中为该模型添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用的索引设置后，你必须调用 `scout:sync-index-settings` Artisan 命令。该命令会将你当前配置的索引设置告知 Algolia。为方便起见，你可以将此命令纳入部署流程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="algolia-identifying-users"></a>
#### 识别用户

Scout 允许你在使用 Algolia 时自动识别用户。将认证用户与搜索操作关联起来，有助于在 Algolia 的控制台中查看搜索分析数据。你可以在应用的 `.env` 文件中将 `SCOUT_IDENTIFY` 环境变量定义为 `true`，以启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用该功能后，还会将请求的 IP 地址和认证用户的主标识符传递给 Algolia，这样这些数据就会与该用户发起的每个搜索请求关联起来。

<a name="meilisearch-configuration"></a>
### Meilisearch

<a name="meilisearch-index-settings"></a>
#### 索引设置

Meilisearch 要求你预先定义索引的搜索设置，例如可过滤属性、可排序属性以及[其他受支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是指你计划在调用 Scout 的 `where` 方法时用于过滤的属性，而可排序属性是指你计划在调用 Scout 的 `orderBy` 方法时用于排序的属性。要定义索引设置，请调整应用的 `scout` 配置文件中 `meilisearch` 配置项的 `index-settings` 部分：

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

如果某个索引背后的模型支持软删除，并且该模型包含在 `index-settings` 数组中，Scout 会自动在该索引上包含对软删除模型进行过滤的支持。如果对于支持软删除的模型索引没有其他可过滤或可排序属性需要定义，你可以直接在 `index-settings` 数组中为该模型添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用的索引设置后，你必须调用 `scout:sync-index-settings` Artisan 命令。该命令会将你当前配置的索引设置告知 Meilisearch。为方便起见，你可以将此命令纳入部署流程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="meilisearch-data-types"></a>
#### 可搜索数据类型

Meilisearch 只会对类型正确的数据执行过滤操作（`>`、`<` 等）。在自定义可搜索数据时，你应当确保数值被转换为正确的类型：

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

<a name="typesense-configuration"></a>
### Typesense

<a name="typesense-searchable-data"></a>
#### 准备可搜索数据

使用 Typesense 时，你的可搜索模型必须定义一个 `toSearchableArray` 方法，将模型的主键转换为字符串，并将创建日期转换为 UNIX 时间戳：

```php
/**
 * 获取模型的可索引数据数组。
 *
 * @return array<string, mixed>
 */
public function toSearchableArray(): array
{
    return array_merge($this->toArray(),[
        'id' => (string) $this->id,
        'created_at' => $this->created_at->timestamp,
    ]);
}
```

你还应当在应用的 `config/scout.php` 文件中定义 Typesense 集合的 schema。集合 schema 描述了每个可通过 Typesense 搜索的字段的数据类型。有关所有可用 schema 选项的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果在定义之后需要更改 Typesense 集合的 schema，你可以运行 `scout:flush` 和 `scout:import`，这会删除所有已索引的数据并重新创建 schema。或者，你也可以使用 Typesense 的 API 修改集合的 schema，而不删除任何已索引的数据。

如果你的可搜索模型支持软删除，你应当在应用的 `config/scout.php` 配置文件中，在该模型对应的 Typesense schema 中定义一个 `__soft_deleted` 字段：

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

Typesense 允许你在通过 `options` 方法执行搜索操作时，动态修改[搜索参数](https://typesense.org/docs/latest/api/search.html#search-parameters)：

```php
use App\Models\Todo;

Todo::search('Groceries')->options([
    'query_by' => 'title, description'
])->get();
```

<a name="indexing"></a>
## 第三方引擎索引

> [!NOTE]
> 本节描述的索引功能主要在使用第三方引擎（Algolia、Meilisearch 或 Typesense）时才有意义。数据库引擎直接搜索你的数据库表，因此不需要手动管理索引。

<a name="batch-import"></a>
### 批量导入

如果你是在现有项目中安装 Scout，可能已经有需要导入到索引中的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，你可以用它将所有现有记录导入到搜索索引中：

```shell
php artisan scout:import "App\Models\Post"
```

可以使用 `scout:queue-import` 命令，通过[队列任务](/docs/{{version}}/queues)导入所有现有记录：

```shell
php artisan scout:queue-import "App\Models\Post" --chunk=500
```

可以使用 `flush` 命令从搜索索引中移除某个模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

<a name="modifying-the-import-query"></a>
#### 修改导入查询

如果你想修改用于批量导入时检索所有模型的查询，可以在模型上定义一个 `makeAllSearchableUsing` 方法。这是一个绝佳的地方，可以在导入模型之前添加任何可能需要的关联预加载：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * 修改使所有模型可搜索时用于检索模型的查询。
 */
protected function makeAllSearchableUsing(Builder $query): Builder
{
    return $query->with('author');
}
```

> [!WARNING]
> 使用队列批量导入模型时，`makeAllSearchableUsing` 方法可能不适用。模型集合由任务处理时，关联[不会被恢复](/docs/{{version}}/queues#handling-relationships)。

<a name="adding-records"></a>
### 添加记录

将 `Laravel\Scout\Searchable` trait 添加到模型之后，你只需 `save` 或 `create` 一个模型实例，它就会自动被添加到你的搜索索引中。如果你已将 Scout 配置为[使用队列](#queueing)，这个操作将由队列 worker 在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

<a name="adding-records-via-query"></a>
#### 通过查询添加记录

如果你想通过 Eloquent 查询将一组模型添加到搜索索引中，可以将 `searchable` 方法链式调用到 Eloquent 查询上。`searchable` 方法会对查询结果进行[分块处理](/docs/{{version}}/eloquent#chunking-results)，并将记录添加到搜索索引。同样，如果你已将 Scout 配置为使用队列，所有数据块都将由队列 worker 在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

你也可以在 Eloquent 关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已经在内存中拥有一组 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，将模型实例添加到其对应的索引中：

```php
$orders->searchable();
```

> [!NOTE]
> `searchable` 方法可以视为一个「upsert」操作。换句话说，如果模型记录已经存在于索引中，则会被更新；如果不存在于搜索索引中，则会被添加到索引。

<a name="updating-records"></a>
### 更新记录

要更新一个可搜索的模型，你只需更新模型实例的属性并将模型 `save` 到数据库中。Scout 会自动将更改持久化到你的搜索索引：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

你也可以在 Eloquent 查询实例上调用 `searchable` 方法来更新一组模型。如果这些模型不存在于搜索索引中，则会被创建：

```php
Order::where('price', '>', 100)->searchable();
```

如果你想更新某个关联中所有模型的搜索索引记录，可以在关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已经在内存中拥有一组 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，在其对应的索引中更新这些模型实例：

```php
$orders->searchable();
```

<a name="modifying-records-before-importing"></a>
#### 导入前修改记录

有时你可能需要在模型变为可搜索之前先对模型集合进行一些处理。例如，你可能想预加载一个关联，以便将关联数据高效地添加到搜索索引中。为此，请在对应的模型上定义一个 `makeSearchableUsing` 方法：

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

<a name="conditionally-updating-the-search-index"></a>
#### 有条件地更新搜索索引

默认情况下，无论修改了哪些属性，Scout 都会重新索引已更新的模型。如果你想自定义此行为，可以在模型上定义一个 `searchIndexShouldBeUpdated` 方法：

```php
/**
 * 判断是否应更新搜索索引。
 */
public function searchIndexShouldBeUpdated(): bool
{
    return $this->wasRecentlyCreated || $this->wasChanged(['title', 'body']);
}
```

<a name="removing-records"></a>
### 移除记录

要从索引中移除记录，只需从数据库中 `delete` 该模型即可。即使你使用的是[软删除](/docs/{{version}}/eloquent#soft-deleting)模型，也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果你不想在删除记录前先检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果你想移除某个关联中所有模型的搜索索引记录，可以在关联实例上调用 `unsearchable` 方法：

```php
$user->orders()->unsearchable();
```

或者，如果你已经在内存中拥有一组 Eloquent 模型集合，可以在集合实例上调用 `unsearchable` 方法，将这些模型实例从其对应的索引中移除：

```php
$orders->unsearchable();
```

要将某个模型的所有记录从其对应的索引中移除，可以调用 `removeAllFromSearch` 方法：

```php
Order::removeAllFromSearch();
```

<a name="pausing-indexing"></a>
### 暂停索引

有时你可能需要对模型执行一批 Eloquent 操作，而不将模型数据同步到搜索索引。你可以使用 `withoutSyncingToSearch` 方法来实现。该方法接受一个会立即执行的闭包。闭包内发生的任何模型操作都不会被同步到模型的索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

<a name="conditionally-searchable-model-instances"></a>
### 有条件地可搜索的模型实例

有时你可能只需在特定条件下让模型可搜索。例如，假设你有一个 `App\Models\Post` 模型，它可能处于「draft（草稿）」和「published（已发布）」两种状态之一，你可能只希望允许「published」状态的文章可搜索。为此，你可以在模型上定义一个 `shouldBeSearchable` 方法：

```php
/**
 * 判断该模型是否应可搜索。
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法只在通过 `save` 和 `create` 方法、查询或关联操作模型时才会生效。直接使用 `searchable` 方法让模型或集合可搜索，会覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]
> 使用 Scout 的「database」引擎时，`shouldBeSearchable` 方法不适用，因为所有可搜索的数据始终存储在数据库中。要在使用数据库引擎时实现类似的行为，你应当改用 [where 子句](#where-clauses)。

<a name="searching"></a>
## 搜索

你可以使用 `search` 方法开始搜索模型。search 方法接受一个用于搜索模型的字符串。然后，你应当将 `get` 方法链式调用到搜索查询上，以检索与给定搜索查询匹配的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 的搜索返回的是 Eloquent 模型集合，你甚至可以直接从路由或控制器返回结果，它们会自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果你想在被转换为 Eloquent 模型之前获取原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

<a name="custom-indexes"></a>
#### 自定义索引

使用第三方引擎搜索时，搜索查询通常会在模型的 [searchableAs](#configuring-model-indexes) 方法指定的索引上执行。不过，你也可以使用 `within` 方法指定要搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

<a name="where-clauses"></a>
### Where 子句

Scout 允许你向搜索查询添加简单的「where」子句。目前，这些子句只支持基本相等检查，主要用于按所有者 ID 对搜索查询进行范围限定：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

此外，可以使用 `whereIn` 方法验证给定列的值是否包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['open', 'paid']
)->get();
```

`whereNotIn` 方法验证给定列的值是否不包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereNotIn(
    'status', ['closed']
)->get();
```

> [!WARNING]
> 如果你的应用使用 Meilisearch，则必须先配置应用的[可过滤属性](#meilisearch-index-settings)，然后才能使用 Scout 的「where」子句。

<a name="customizing-the-eloquent-results-query"></a>
#### 自定义 Eloquent 结果查询

当 Scout 从应用的搜索引擎检索到一组匹配的 Eloquent 模型后，会使用 Eloquent 根据主键检索所有匹配的模型。你可以通过调用 `query` 方法来自定义这个查询。`query` 方法接受一个闭包，该闭包接收 Eloquent 查询构造器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

使用第三方引擎时，这个回调会在相关模型已经从搜索引擎检索出来之后才被调用，因此不应用于「过滤」结果——请改用 [Scout where 子句](#where-clauses)。不过，使用数据库引擎时，`query` 方法的约束会直接应用到数据库查询上，因此也可以用它进行过滤。

<a name="pagination"></a>
### 分页

除了检索模型集合之外，你还可以使用 `paginate` 方法对搜索结果进行分页。该方法会返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像你[对传统 Eloquent 查询进行分页](/docs/{{version}}/pagination)一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

你可以将每页要检索的模型数量作为第一个参数传递给 `paginate` 方法，来指定每页的数量：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

使用数据库引擎时，你也可以使用 `simplePaginate` 方法。与 `paginate` 会检索匹配记录总数以便显示页码不同，`simplePaginate` 只判断当前页之后是否还有更多结果——这使它对只需要「上一页」和「下一页」链接的大型数据集更加高效：

```php
$orders = Order::search('Star Trek')->simplePaginate(15);
```

检索到结果后，你就可以像对传统 Eloquent 查询分页一样，使用 [Blade](/docs/{{version}}/blade) 展示结果并渲染分页链接：

```html
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果你想以 JSON 格式获取分页结果，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]
> 由于搜索引擎并不感知 Eloquent 模型的全局作用域定义，在使用 Scout 分页的应用中，你应当避免使用全局作用域。或者，在通过 Scout 搜索时，你应当重建全局作用域的约束条件。

<a name="soft-deleting"></a>
### 软删除

如果你被索引的模型使用了[软删除](/docs/{{version}}/eloquent#soft-deleting)，并且需要搜索软删除的模型，请将 `config/scout.php` 配置文件中的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中移除软删除的模型，而是会在被索引的记录上设置一个隐藏的 `__soft_deleted` 属性。然后，你可以在搜索时使用 `withTrashed` 或 `onlyTrashed` 方法来检索软删除的记录：

```php
use App\Models\Order;

// 检索结果时包含已软删除的记录...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 检索结果时只包含已软删除的记录...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]
> 当软删除的模型通过 `forceDelete` 被永久删除时，Scout 会自动将其从搜索索引中移除。

<a name="customizing-engine-searches"></a>
### 自定义引擎搜索

如果你需要对引擎的搜索行为执行高级自定义，可以将一个闭包作为 `search` 方法的第二个参数传入。例如，在搜索查询被传递给 Algolia 之前，你可以使用这个回调向搜索选项添加地理位置数据：

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

<a name="custom-engines"></a>
## 自定义引擎

<a name="writing-the-engine"></a>
#### 编写引擎

如果 Scout 内置的搜索引擎都不能满足你的需求，你可以编写自己的自定义引擎并向 Scout 注册。你的引擎应当继承 `Laravel\Scout\Engines\Engine` 抽象类。该抽象类包含你的自定义引擎必须实现的八个方法：

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

阅读 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现可能会对你有所帮助。这个类能为你学习如何在自定义引擎中实现这些方法提供一个很好的起点。

<a name="registering-the-engine"></a>
#### 注册引擎

编写好自定义引擎后，你可以使用 Scout 引擎管理器的 `extend` 方法将其注册到 Scout。Scout 的引擎管理器可以从 Laravel 服务容器中解析。你应当在 `App\Providers\AppServiceProvider` 类或应用使用的任何其他服务提供者的 `boot` 方法中调用 `extend` 方法：

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

引擎注册完成后，你就可以在应用的 `config/scout.php` 配置文件中将其指定为默认的 Scout `driver`：

```php
'driver' => 'mysql',
```
