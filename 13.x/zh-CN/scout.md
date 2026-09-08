# Laravel Scout

- [简介](#introduction)
- [安装](#installation)
    - [队列](#queueing)
- [驱动先决条件](#driver-prerequisites)
    - [Algolia](#algolia)
    - [Meilisearch](#meilisearch)
    - [Typesense](#typesense)
    - [Turbopuffer](#turbopuffer)
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
    - [Turbopuffer](#turbopuffer-configuration)
- [第三方引擎索引](#indexing)
    - [批量导入](#batch-import)
    - [添加记录](#adding-records)
    - [更新记录](#updating-records)
    - [移除记录](#removing-records)
    - [暂停索引](#pausing-indexing)
    - [条件可搜索的模型实例](#conditionally-searchable-model-instances)
- [搜索](#searching)
    - [Where 子句](#where-clauses)
    - [语义搜索](#semantic-search)
    - [分页](#pagination)
    - [软删除](#soft-deleting)
    - [自定义引擎搜索](#customizing-engine-searches)
- [自定义引擎](#custom-engines)

<a name="introduction"></a>
## 简介

[Laravel Scout](https://github.com/laravel/scout) 为向 [Eloquent 模型](/docs/{{version}}/eloquent)添加全文搜索提供了一个简单、基于驱动的解决方案。通过使用模型观察器，Scout 会自动保持你的搜索索引与 Eloquent 记录同步。

Scout 附带一个内置的 `database` 引擎，它使用 MySQL / PostgreSQL 全文索引和 `LIKE` 子句直接搜索你现有的数据库——无需外部服务。对于大多数应用来说，这就是你所需要的全部。有关 Laravel 中所有可用搜索选项的概览，请查阅[搜索文档](/docs/{{version}}/search)。

当你需要错字容忍、分面过滤、向量搜索或超大规模地理搜索等功能时，Scout 还包含针对 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com)、[Typesense](https://typesense.org) 和 [Turbopuffer](https://turbopuffer.com) 的驱动。此外，还提供了一个"集合"驱动用于本地开发，你也可以自由编写[自定义引擎](#custom-engines)。

<a name="installation"></a>
## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，你应使用 `vendor:publish` Artisan 命令发布 Scout 配置文件。此命令会将 `scout.php` 配置文件发布到应用的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` Trait 添加到你想要使其可搜索的模型上。此 Trait 将注册一个模型观察器，自动保持模型与搜索驱动同步：

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

当使用非 `database` 或 `collection` 引擎时，你应强烈考虑在使用该库之前配置[队列驱动](/docs/{{version}}/queues)。运行队列工作进程将使 Scout 能够将所有将模型信息同步到搜索索引的操作排队，从而为应用的 Web 界面提供更好的响应时间。

配置队列驱动后，将 `config/scout.php` 配置文件中的 `queue` 选项值设置为 `true`：

```php
'queue' => true,
```

即使 `queue` 选项设置为 `false`，请务必记住，Algolia 和 Meilisearch 等某些 Scout 驱动总是异步地索引记录。换句话说，即使索引操作已在 Laravel 应用中完成，搜索引擎本身也可能不会立即反映新增和更新的记录。

要指定 Scout 任务使用的连接和队列，你可以将 `queue` 配置选项定义为一个数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果你自定义了 Scout 任务使用的连接和队列，你应运行队列工作进程来处理该连接和队列上的任务：

```shell
php artisan queue:work redis --queue=scout
```

<a name="unique-jobs"></a>
#### 唯一任务

在写入密集的应用中，你可能希望阻止 Scout 为同一模型记录排队重复任务。你可以通过在服务提供者的 `boot` 方法中注册 `MakeSearchableUniquely` 和 `RemoveFromSearchUniquely` 任务类，选择使用唯一的索引任务：

```php
use Laravel\Scout\Jobs\MakeSearchableUniquely;
use Laravel\Scout\Jobs\RemoveFromSearchUniquely;
use Laravel\Scout\Scout;

Scout::makeSearchableUsing(MakeSearchableUniquely::class);
Scout::removeFromSearchUsing(RemoveFromSearchUniquely::class);
```

当类似的排队索引操作已在队列中时，这些任务会使用 Laravel 的[唯一任务锁](/docs/{{version}}/queues#unique-jobs)来避免为相同的可搜索模型记录分发重复的排队索引操作。

<a name="driver-prerequisites"></a>
## 驱动先决条件

<a name="algolia"></a>
### Algolia

使用 Algolia 驱动时，你应在 `config/scout.php` 配置文件中配置 Algolia `id` 和 `secret` 凭据。配置好凭据后，你还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

<a name="meilisearch"></a>
### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一个快速的开源搜索引擎。如果你不确定如何在本地机器上安装 Meilisearch，可以使用 [Laravel Sail](/docs/{{version}}/sail#meilisearch)，这是 Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，你需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在应用 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及你的 Meilisearch `host` 和 `key` 凭据：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 Meilisearch 的更多信息，请查阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，你应通过查看 [Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，确保安装与 Meilisearch 二进制版本兼容的 `meilisearch/meilisearch-php` 版本。

> [!WARNING]
> 在使用 Meilisearch 的应用上升级 Scout 时，你应始终[查看 Meilisearch 服务本身的任何额外破坏性变更](https://github.com/meilisearch/Meilisearch/releases)。

<a name="typesense"></a>
### Typesense

[Typesense](https://typesense.org) 是一个极速的开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

你可以[自托管](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) Typesense，也可以使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始在 Scout 中使用 Typesense，请通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在应用 .env 文件中设置 `SCOUT_DRIVER` 环境变量以及你的 Typesense 主机和 API 密钥凭据：

```ini
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，可能需要调整 `TYPESENSE_HOST` 环境变量以匹配 Docker 容器名称。你还可以选择指定安装的端口、路径和协议：

```ini
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

Typesense 集合的其他设置和模式定义可以在应用 `config/scout.php` 配置文件中找到。有关 Typesense 的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

<a name="turbopuffer"></a>
### Turbopuffer

[Turbopuffer](https://turbopuffer.com) 是一个支持全文、语义和混合搜索的搜索引擎。要使用 Turbopuffer 驱动，请设置 `SCOUT_DRIVER` 环境变量并提供你的 Turbopuffer API 密钥：

```ini
SCOUT_DRIVER=turbopuffer
TURBOPUFFER_API_KEY=tpuf_...
TURBOPUFFER_REGION=gcp-us-central1
```

`TURBOPUFFER_REGION` 环境变量是可选的，默认为 `gcp-us-central1`。

<a name="configuration"></a>
## 配置

<a name="configuring-searchable-data"></a>
### 配置可搜索数据

默认情况下，给定模型的整个 `toArray` 形式将持久化到其搜索索引中。如果你想自定义同步到搜索索引的数据，可以覆盖模型上的 `toSearchableArray` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * Get the indexable data array for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $array = $this->toArray();

        // Customize the data array...

        return $array;
    }
}
```

<a name="configuring-search-engines-per-model"></a>
#### 配置模型引擎

搜索时，Scout 通常会使用应用 `scout` 配置文件中指定的默认搜索引擎。但是，可以通过覆盖模型上的 `searchableUsing` 方法更改特定模型的搜索引擎：

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
     * Get the engine used to index the model.
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
> 数据库引擎目前支持 MySQL 和 PostgreSQL，这两者都提供快速、全文列索引的支持。

`database` 引擎使用 MySQL / PostgreSQL 全文索引和 `LIKE` 子句直接搜索你现有的数据库。对于许多应用来说，这是添加搜索最简单、最实用的方式——无需外部服务或额外基础设施。

要使用数据库引擎，请将 `SCOUT_DRIVER` 环境变量设置为 `database`：

```ini
SCOUT_DRIVER=database
```

配置完成后，你可以[定义可搜索数据](#configuring-searchable-data)并开始对模型[执行搜索查询](#searching)。与第三方引擎不同，数据库引擎不需要单独的索引步骤——它直接搜索你的数据库表。

<a name="database-semantic-and-hybrid-search"></a>
#### 语义与混合搜索

当使用带 `pgvector` 扩展的 PostgreSQL 时，数据库引擎支持语义和混合搜索。要开始，请向模型的表添加一个可空的向量列和一个全文索引。向量列必须可空，因为 Scout 会在模型持久化后存储嵌入：

```php
Schema::ensureVectorExtensionExists();

Schema::table('articles', function (Blueprint $table) {
    // ...

    $table->vector('embedding', dimensions: 1536)->nullable();
    $table->vectorIndex('embedding');
    $table->fullText(['title', 'body']);
});
```

接下来，在模型上定义一个 `toSearchableEmbedding` 方法。此方法可以返回 Scout 应嵌入的源文本，或预计算的嵌入数组。Scout 默认将嵌入存储在 `embedding` 列中；要使用其他列，请在模型上定义 `searchableEmbeddingColumn` 方法。

#### 自定义数据库搜索策略

默认情况下，数据库引擎会对你[配置为可搜索](#configuring-searchable-data)的每个模型属性执行 `LIKE` 查询。但是，你可以为特定列分配更高效的搜索策略。`SearchUsingFullText` 属性将对该列使用数据库的全文索引，而 `SearchUsingPrefix` 将只匹配字符串的开头（`example%`），而不是在整个字符串内搜索（`%example%`）。

要定义此行为，请将 PHP 属性分配给模型的 `toSearchableArray` 方法。任何没有属性的列将继续使用默认的 `LIKE` 策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * Get the indexable data array for the model.
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
> 在指定某列应使用全文查询约束之前，请确保该列已被分配[全文索引](/docs/{{version}}/migrations#available-index-types)。

<a name="collection-engine"></a>
### 集合引擎

"集合"引擎用于快速原型、极小数据集（几百条记录）或运行测试。它从数据库检索所有可能的记录，并使用 Laravel 的 `Str::is` 辅助函数在 PHP 中过滤它们，因此它不需要任何索引或数据库特定功能。对于任何超出简单用例的场景，你应改用[数据库引擎](#database-engine)。

要使用集合引擎，你可以简单地将 `SCOUT_DRIVER` 环境变量值设置为 `collection`，或在应用 `scout` 配置文件中直接指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

将集合驱动指定为首选驱动后，你可以开始对模型[执行搜索查询](#searching)。使用集合引擎时，搜索引擎索引（如填充 Algolia、Meilisearch 或 Typesense 索引所需的索引）是不必要的。

#### 与数据库引擎的区别

数据库引擎使用全文索引和 `LIKE` 子句高效地查找匹配记录，而集合引擎则拉取所有记录并在 PHP 中过滤它们。集合引擎是最可移植的选项，因为它可以在 Laravel 支持的所有关系数据库（包括 SQLite 和 SQL Server）上工作；但是，它的效率远低于数据库引擎，不应与大型数据集一起使用。

<a name="third-party-engine-configuration"></a>
## 第三方引擎配置

以下配置选项仅在使用 Algolia、Meilisearch 或 Typesense 等第三方搜索引擎时相关。如果你使用[数据库引擎](#database-engine)，可以跳过此部分。

<a name="configuring-model-indexes"></a>
### 配置模型索引

使用第三方引擎时，每个 Eloquent 模型都会与给定的搜索"索引"同步，该索引包含该模型的所有可搜索记录。默认情况下，每个模型将持久化到与其典型"表"名称匹配的索引中。通常，这是模型名称的复数形式；不过，你可以通过覆盖模型上的 `searchableAs` 方法来自定义模型的索引：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * Get the name of the index associated with the model.
     */
    public function searchableAs(): string
    {
        return 'posts_index';
    }
}
```

> [!NOTE]
> 使用数据库引擎时，`searchableAs` 方法无效，因为数据库引擎总是直接搜索模型的数据库表。

<a name="configuring-the-model-id"></a>
#### 配置模型 ID

默认情况下，Scout 会将模型的主键用作存储到搜索索引中的模型唯一 ID / 键。如果使用第三方引擎时需要自定义此行为，可以覆盖模型上的 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * Get the value used to index the model.
     */
    public function getScoutKey(): mixed
    {
        return $this->email;
    }

    /**
     * Get the key name used to index the model.
     */
    public function getScoutKeyName(): mixed
    {
        return 'email';
    }
}
```

> [!NOTE]
> 使用数据库引擎时，`getScoutKey` 和 `getScoutKeyName` 方法无效，因为数据库引擎总是使用模型的主键。

<a name="algolia-configuration"></a>
### Algolia

<a name="algolia-index-settings"></a>
#### 索引设置

有时你可能希望在 Algolia 索引上配置额外设置。虽然你可以通过 Algolia UI 管理这些设置，但有时直接在应用 `config/scout.php` 配置文件中管理索引配置的期望状态会更高效。

这种方法允许你通过应用的自动化部署流水线部署这些设置，避免手动配置并确保跨多个环境的一致性。你可以配置可过滤属性、排名、分面或[任何其他受支持的设置](https://www.algolia.com/doc/rest-api/search/#tag/Indices/operation/setSettings)。

要开始，请在应用 `config/scout.php` 配置文件中为每个索引添加设置：

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
            // Other settings fields...
        ],
        Flight::class => [
            'searchableAttributes'=> ['id', 'destination'],
        ],
    ],
],
```

如果给定索引所依据的模型可软删除并包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型的分面支持。如果你没有其他要为可软删除模型索引定义的分面属性，只需为该模型向 `index-settings` 数组添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令会将当前配置的索引设置告知 Algolia。为方便起见，你可能希望将此命令作为部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="algolia-identifying-users"></a>
#### 识别用户

Scout 允许你在使用 Algolia 时自动识别用户。将已认证用户与搜索操作关联起来，在查看 Algolia 仪表板中的搜索分析时可能很有帮助。你可以通过在应用 `.env` 文件中将 `SCOUT_IDENTIFY` 环境变量定义为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用此功能还会将请求的 IP 地址和已认证用户的主标识符传递给 Algolia，以便此数据与用户发出的任何搜索请求关联。

<a name="meilisearch-configuration"></a>
### Meilisearch

<a name="meilisearch-index-settings"></a>
#### 索引设置

Meilisearch 要求你预先定义索引搜索设置，如可过滤属性、可排序属性和[其他受支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是你在调用 Scout 的 `where` 方法时计划过滤的任何属性，而可排序属性是你在调用 Scout 的 `orderBy` 方法时计划排序的任何属性。要定义索引设置，请调整应用 `scout` 配置文件中 `meilisearch` 配置条目的 `index-settings` 部分：

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
            // Other settings fields...
        ],
        Flight::class => [
            'filterableAttributes'=> ['id', 'destination'],
            'sortableAttributes' => ['updated_at'],
        ],
    ],
],
```

如果给定索引所依据的模型可软删除并包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型的过滤支持。如果你没有其他要为可软删除模型索引定义的可过滤或可排序属性，只需为该模型向 `index-settings` 数组添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令会将当前配置的索引设置告知 Meilisearch。为方便起见，你可能希望将此命令作为部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="meilisearch-semantic-and-hybrid-search"></a>
#### 语义与混合搜索

要将语义或混合搜索与 Meilisearch 一起使用，请在索引设置中配置嵌入器，并为每个可搜索模型配置嵌入设置：

```php
'meilisearch' => [
    // ...
    'index-settings' => [
        Article::class => [
            'embedders' => [
                'default' => [
                    'source' => 'userProvided',
                    'dimensions' => 1536,
                ],
            ],
        ],
    ],
    'model-settings' => [
        Article::class => [
            'embedding' => [
                'embedder' => 'default',
                'dimensions' => 1536,
            ],
        ],
    ],
],
```

模型的 `toSearchableEmbedding` 方法可以返回源文本（Scout 使用 [Laravel AI SDK](/docs/{{version}}/ai-sdk) 嵌入），或预计算的嵌入数组。更新配置后，运行 `scout:sync-index-settings` 命令。

<a name="meilisearch-data-types"></a>
#### 可搜索数据类型

Meilisearch 只对正确类型的数据执行过滤操作（`>`、`<` 等）。自定义可搜索数据时，应确保数值被转换为其正确的类型：

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
 * Get the indexable data array for the model.
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

你还应在应用 `config/scout.php` 文件中定义 Typesense 集合模式。集合模式描述了可通过 Typesense 搜索的每个字段的数据类型。有关所有可用模式选项的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果需要在定义后更改 Typesense 集合的模式，可以运行 `scout:flush` 和 `scout:import`，这将删除所有现有的索引数据并重新创建模式。或者，你可以使用 Typesense 的 API 修改集合的模式，而无需移除任何索引数据。

如果你的可搜索模型可软删除，应在应用 `config/scout.php` 配置文件中模型的相应 Typesense 模式中定义一个 `__soft_deleted` 字段：

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

Typesense 允许你在执行搜索操作时通过 `options` 方法动态修改[搜索参数](https://typesense.org/docs/latest/api/search.html#search-parameters)：

```php
use App\Models\Todo;

Todo::search('Groceries')->options([
    'query_by' => 'title, description'
])->get();
```

<a name="turbopuffer-configuration"></a>
### Turbopuffer

Turbopuffer 需要为每个模型提供模式和可搜索属性。在 `scout` 配置文件的 `turbopuffer` 配置的 `model-settings` 数组中定义它们：

```php
use App\Models\Article;

'turbopuffer' => [
    // ...
    'model-settings' => [
        Article::class => [
            'searchable-attributes' => [
                'title' => 3,
                'body' => 1,
            ],
            'schema' => [
                'title' => ['type' => 'string', 'full_text_search' => true],
                'body' => ['type' => 'string', 'full_text_search' => true],
                'status' => ['type' => 'string'],
            ],
        ],
    ],
],
```

分配给 `searchable-attributes` 的数值是相对的 BM25 权重。在上面的示例中，文章标题中的匹配对得分的贡献是正文中匹配的三倍。

要启用语义和混合搜索，请向模型配置添加 `embedding` 设置和向量模式：

```php
'turbopuffer' => [
    // ...
    'model-settings' => [
        Article::class => [
            'searchable-attributes' => [
                'title' => 3,
                'body' => 1,
            ],
            'embedding' => [
                'attribute' => 'embedding',
                'dimensions' => 1536,
            ],
            'schema' => [
                'title' => ['type' => 'string', 'full_text_search' => true],
                'body' => ['type' => 'string', 'full_text_search' => true],
                'embedding' => ['type' => '[1536]f32', 'ann' => true],
            ],
        ],
    ],
],
```

你的模型 `toSearchableEmbedding` 方法应返回 Scout 应嵌入的源文本，或预计算的嵌入数组。Scout 使用 [Laravel AI SDK](/docs/{{version}}/ai-sdk) 生成源文本嵌入。

或者，你可以使用 Turbopuffer 的原生嵌入，而无需安装 Laravel AI SDK 或定义 `toSearchableEmbedding` 方法。将嵌入驱动设置为 `turbopuffer`，并在可搜索源属性上配置 `embed` 模式：

```php
'embedding' => [
    'driver' => 'turbopuffer',
    'attribute' => 'embedding_text',
],

'schema' => [
    // ...
    'embedding_text' => [
        'type' => 'string',
        'embed' => [
            'model' => 'voyage/voyage-4',
            'dimensions' => 1024,
            'attribute' => 'embedding',
        ],
    ],
],
```

源属性必须包含在模型的 `toSearchableArray` 输出中。

<a name="indexing"></a>
## 第三方引擎索引

> [!NOTE]
> 本节描述的索引功能主要在使用第三方引擎（Algolia、Meilisearch、Typesense 或 Turbopuffer）时相关。数据库引擎直接搜索数据库表，因此不需要手动索引管理。

<a name="batch-import"></a>
### 批量导入

如果你正在将 Scout 安装到现有项目中，你可能已经有需要导入到索引中的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，你可以使用它将所有现有记录导入到搜索索引中：

```shell
php artisan scout:import "App\Models\Post"
```

`scout:queue-import` 命令可用于使用[队列任务](/docs/{{version}}/queues)导入所有现有记录：

```shell
php artisan scout:queue-import "App\Models\Post" --chunk=500
```

`flush` 命令可用于从搜索索引中移除模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

<a name="modifying-the-import-query"></a>
#### 修改导入查询

如果你想修改用于检索所有模型以进行批量导入的查询，可以在模型上定义一个 `makeAllSearchableUsing` 方法。这是添加在导入模型之前可能需要的任何预加载关联的好地方：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * Modify the query used to retrieve models when making all of the models searchable.
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

一旦你向模型添加了 `Laravel\Scout\Searchable` Trait，你只需 `save` 或 `create` 一个模型实例，它就会自动添加到搜索索引中。如果你已配置 Scout [使用队列](#queueing)，此操作将由队列工作进程在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

<a name="adding-records-via-query"></a>
#### 通过查询添加记录

如果你想通过 Eloquent 查询将模型集合添加到搜索索引中，可以将 `searchable` 方法链式附加到 Eloquent 查询上。`searchable` 方法将[分块处理查询结果](/docs/{{version}}/eloquent#chunking-results)，并将记录添加到搜索索引中。同样，如果你已配置 Scout 使用队列，所有块将由队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

你也可以在 Eloquent 关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已经在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，将模型实例添加到其对应的索引中：

```php
$orders->searchable();
```

> [!NOTE]
> `searchable` 方法可以被视为"upsert"操作。换句话说，如果模型记录已在你的索引中，它将被更新。如果它不在搜索索引中，它将被添加到索引中。

<a name="updating-records"></a>
### 更新记录

要更新可搜索模型，你只需更新模型实例的属性并将模型 `save` 到数据库。Scout 将自动将更改持久化到搜索索引中：

```php
use App\Models\Order;

$order = Order::find(1);

// Update the order...

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

或者，如果你已经在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，更新其对应索引中的模型实例：

```php
$orders->searchable();
```

<a name="modifying-records-before-importing"></a>
#### 在导入前修改记录

有时你可能需要在模型被设为可搜索之前准备模型集合。例如，你可能希望预加载关联，以便可以将关联数据高效地添加到搜索索引中。为此，请在相应模型上定义一个 `makeSearchableUsing` 方法：

```php
use Illuminate\Database\Eloquent\Collection;

/**
 * Modify the collection of models being made searchable.
 */
public function makeSearchableUsing(Collection $models): Collection
{
    return $models->load('author');
}
```

<a name="conditionally-updating-the-search-index"></a>
#### 条件更新搜索索引

默认情况下，Scout 会重新索引更新的模型，无论修改了哪些属性。如果你想自定义此行为，可以在模型上定义一个 `searchIndexShouldBeUpdated` 方法：

```php
/**
 * Determine if the search index should be updated.
 */
public function searchIndexShouldBeUpdated(): bool
{
    return $this->wasRecentlyCreated || $this->wasChanged(['title', 'body']);
}
```

<a name="removing-records"></a>
### 移除记录

要从索引中移除记录，你可以简单地从数据库中 `delete` 该模型。即使你使用[软删除](/docs/{{version}}/eloquent#soft-deleting)模型，也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果你不想在删除记录前检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果你想移除关联中所有模型的搜索索引记录，可以在关联实例上调用 `unsearchable`：

```php
$user->orders()->unsearchable();
```

或者，如果你已经在内存中拥有 Eloquent 模型集合，可以在集合实例上调用 `unsearchable` 方法，从其对应的索引中移除模型实例：

```php
$orders->unsearchable();
```

要从其对应索引中移除模型的所有记录，可以调用 `removeAllFromSearch` 方法：

```php
Order::removeAllFromSearch();
```

<a name="pausing-indexing"></a>
### 暂停索引

有时你可能需要对模型执行一批 Eloquent 操作，而无需将模型数据同步到搜索索引。你可以使用 `withoutSyncingToSearch` 方法实现这一点。此方法接受一个将立即执行的闭包。闭包内发生的任何模型操作都不会同步到模型索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // Perform model actions...
});
```

<a name="conditionally-searchable-model-instances"></a>
### 条件可搜索的模型实例

有时你可能只需要在特定条件下使模型可搜索。例如，假设你有 `App\Models\Post` 模型，它可能处于两种状态之一："draft"和"published"。你可能只想让"published"文章可搜索。为此，你可以在模型上定义一个 `shouldBeSearchable` 方法：

```php
/**
 * Determine if the model should be searchable.
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法仅在通过 `save` 和 `create` 方法、查询或关联操作模型时应用。使用 `searchable` 方法直接将模型或集合设为可搜索将覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]
> 使用 Scout 的"database"引擎时，`shouldBeSearchable` 方法不适用，因为所有可搜索数据始终存储在数据库中。使用数据库引擎时，要达到类似行为，你应使用[where 子句](#where-clauses)。

<a name="searching"></a>
## 搜索

你可以使用 `search` 方法开始搜索模型。search 方法接受单个字符串，该字符串将用于搜索模型。然后，你应该在搜索查询上链式调用 `get` 方法，以检索匹配给定搜索查询的 Eloquent 模型：

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

如果你想在结果被转换为 Eloquent 模型之前获取原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

<a name="semantic-search"></a>
### 语义搜索

数据库、Meilisearch 和 Turbopuffer 引擎支持语义搜索，它根据查询的含义匹配记录。当 Scout 生成嵌入时，语义和混合搜索需要 [Laravel AI SDK](/docs/{{version}}/ai-sdk)。Turbopuffer 的[原生嵌入](#turbopuffer-configuration)和预计算查询向量不需要 Laravel AI SDK。

为所选引擎配置嵌入后，在搜索查询上调用 `semantic` 方法：

```php
$articles = Article::search('staying cool in the summer')
    ->semantic()
    ->get();
```

当所选引擎支持时，你可以提供最小相似度阈值：

```php
$articles = Article::search('renewable energy storage')
    ->semantic(minSimilarity: 0.6)
    ->get();
```

要结合全文和语义搜索，请使用 `hybrid` 方法。其前两个参数控制文本与语义结果的相对权重：

```php
$articles = Article::search('renewable energy storage')
    ->hybrid(textWeight: 1, semanticWeight: 2)
    ->get();
```

<a name="custom-indexes"></a>
#### 自定义索引

使用第三方引擎搜索时，搜索查询通常会在模型 [searchableAs](#configuring-model-indexes) 方法指定的索引上执行。但是，你可以使用 `within` 方法指定应搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

<a name="where-clauses"></a>
### Where 子句

Scout 允许你向搜索查询添加 "where" 子句。例如，基本相等检查对于按所有者 ID 限定搜索查询很有用：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

你也可以使用 `=`、`!=`、`<`、`>`、`>=`、`<=` 比较运算符构建更高级的查询：

```php
Order::search('Star Trek')
  ->where('status', '=', 'completed')
  ->where('is_refunded', '!=', true)
  ->where('total_price', '>', 100)
  ->where('shipping_cost', '<', 20)
  ->where('discount_percent', '>=', 10)
  ->where('item_count', '<=', 5)
  ->get();
```

此外，`whereIn` 方法可用于验证给定列的值是否包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['open', 'paid']
)->get();
```

`whereNotIn` 方法验证给定列的值不包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereNotIn(
    'status', ['closed']
)->get();
```

> [!WARNING]
> 如果你的应用使用 Meilisearch，在利用 Scout 的 "where" 子句之前，必须配置应用的[可过滤属性](#meilisearch-index-settings)。

<a name="customizing-the-eloquent-results-query"></a>
#### 自定义 Eloquent 结果查询

Scout 从应用的搜索引擎检索匹配的 Eloquent 模型列表后，会使用 Eloquent 按主键检索所有匹配模型。你可以通过调用 `query` 方法自定义此查询。`query` 方法接受一个闭包，该闭包将接收 Eloquent 查询构造器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

使用第三方引擎时，此回调在相关模型已从搜索引擎检索后被调用，因此不应将其用于"过滤"结果——请改用 [Scout where 子句](#where-clauses)。但是，使用数据库引擎时，`query` 方法的约束直接应用于数据库查询，因此你也可以将其用于过滤。

<a name="pagination"></a>
### 分页

除了检索模型集合之外，你还可以使用 `paginate` 方法对搜索结果进行分页。此方法将返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像你对传统 Eloquent 查询[分页](/docs/{{version}}/pagination)一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

你可以通过将数量作为第一个参数传递给 `paginate` 方法，指定每页要检索的模型数：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

使用数据库引擎时，你还可以使用 `simplePaginate` 方法。与检索匹配记录总数以便显示页码的 `paginate` 不同，`simplePaginate` 只判断当前页之外是否还有更多结果——对于你只需要"上一页"和"下一页"链接的大型数据集，这更高效：

```php
$orders = Order::search('Star Trek')->simplePaginate(15);
```

检索结果后，你可以使用 [Blade](/docs/{{version}}/blade) 显示结果并渲染页面链接，就像你对传统 Eloquent 查询分页一样：

```html
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果你想将分页结果作为 JSON 检索，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]
> 由于搜索引擎不知道 Eloquent 模型的全局作用域定义，你不应在利用 Scout 分页的应用中使用全局作用域。或者，你应该在通过 Scout 搜索时重新创建全局作用域的约束。

<a name="soft-deleting"></a>
### 软删除

如果你的索引模型正在[软删除](/docs/{{version}}/eloquent#soft-deleting)，并且你需要搜索软删除的模型，请将 `config/scout.php` 配置文件的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中移除软删除的模型。相反，它会在索引记录上设置一个隐藏的 `__soft_deleted` 属性。然后，你可以使用 `withTrashed` 或 `onlyTrashed` 方法在搜索时检索软删除的记录：

```php
use App\Models\Order;

// Include trashed records when retrieving results...
$orders = Order::search('Star Trek')->withTrashed()->get();

// Only include trashed records when retrieving results...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]
> 当使用 `forceDelete` 永久删除软删除的模型时，Scout 会自动将其从搜索索引中移除。

<a name="customizing-engine-searches"></a>
### 自定义引擎搜索

如果你需要对引擎的搜索行为进行高级自定义，可以向 `search` 方法传递闭包作为第二个参数。例如，你可以使用此回调在搜索查询传递给 Algolia 之前向搜索选项添加地理位置数据：

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

如果内置的 Scout 搜索引擎都不适合你的需求，你可以编写自己的自定义引擎并向 Scout 注册。你的引擎应继承 `Laravel\Scout\Engines\Engine` 抽象类。此抽象类包含你的自定义引擎必须实现的八个方法：

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

查看 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现可能会对你有所帮助。该类将为你提供一个良好的起点，帮助你学习如何在自定义引擎中实现这些方法。

<a name="registering-the-engine"></a>
#### 注册引擎

编写好自定义引擎后，可以使用 Scout 引擎管理器的 `extend` 方法向 Scout 注册它。Scout 的引擎管理器可以从 Laravel 服务容器中解析。你应在 `App\Providers\AppServiceProvider` 类的 `boot` 方法或应用使用的任何其他服务提供者中调用 `extend` 方法：

```php
use App\ScoutExtensions\MySqlSearchEngine;
use Laravel\Scout\EngineManager;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    resolve(EngineManager::class)->extend('mysql', function () {
        return new MySqlSearchEngine;
    });
}
```

引擎注册后，你可以在应用 `config/scout.php` 配置文件中将其指定为默认的 Scout `driver`：

```php
'driver' => 'mysql',
```
