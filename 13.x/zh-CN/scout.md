# Laravel Scout

## 简介

[Laravel Scout](https://github.com/laravel/scout) 提供了一个简单的、基于驱动的解决方案，用于向 [Eloquent 模型](/topic/Laravel%2013.x/rwyl2kxvz8.html) 添加全文搜索。使用模型观察者，Scout 会自动保持搜索索引与 Eloquent 记录同步。

Scout 内置一个 `database` 引擎，使用 MySQL / PostgreSQL 全文索引和 `LIKE` 子句搜索现有数据库，不需要外部服务。对于大多数应用，这已经足够。有关 Laravel 中所有可用搜索选项的概述，请参阅 [search 文档](/topic/Laravel%2013.x/3oyjdqxyp5.html)。

当你需要大规模容错、分面过滤、向量搜索或地理搜索等功能时，Scout 还包含 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com)、[Typesense](https://typesense.org) 和 [Turbopuffer](https://turbopuffer.com) 的驱动。还提供「collection」驱动用于本地开发，你也可以自由编写自定义引擎。

## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，应使用 `vendor:publish` Artisan 命令发布 Scout 配置文件。该命令会将 `scout.php` 配置文件发布到应用的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` trait 添加到希望使其可搜索的模型。该 trait 会注册一个模型观察者，自动使模型与搜索驱动保持同步：

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

### 队列

当使用非 `database` 或 `collection` 引擎时，应强烈考虑在使用该库之前配置[队列驱动](/topic/Laravel%2013.x/wevwmkz9l2.html)。运行队列工作进程将允许 Scout 将同步模型信息到搜索索引的所有操作排队，从而为应用的 Web 界面提供更好的响应时间。

配置队列驱动后，在 `config/scout.php` 配置文件中将 `queue` 选项的值设置为 `true`：

```php
'queue' => true,
```

即使 `queue` 选项设置为 `false`，也要记住一些 Scout 驱动（如 Algolia 和 Meilisearch）始终异步索引记录。换句话说，即使索引操作已在 Laravel 应用内完成，搜索引擎本身也可能不会立即反映新增和更新的记录。

要指定 Scout 任务（job）使用的连接和队列，可以将 `queue` 配置选项定义为数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果自定义 Scout 任务使用的连接和队列，则应运行队列工作进程来处理该连接和队列上的任务：

```shell
php artisan queue:work redis --queue=scout
```

#### 唯一任务

在写入密集型应用中，你可能希望阻止 Scout 为同一模型记录排队重复的任务。可以通过注册 `MakeSearchableUniquely` 和 `RemoveFromSearchUniquely` 任务类（通常在服务提供者的 `boot` 方法中）选择启用唯一索引任务：

```php
use Laravel\Scout\Jobs\MakeSearchableUniquely;
use Laravel\Scout\Jobs\RemoveFromSearchUniquely;
use Laravel\Scout\Scout;

Scout::makeSearchableUsing(MakeSearchableUniquely::class);
Scout::removeFromSearchUsing(RemoveFromSearchUniquely::class);
```

这些任务使用 Laravel 的[唯一任务锁](/topic/Laravel%2013.x/wevwmkz9l2.html) 来避免在已经有匹配任务排队的情况下，为同一可搜索模型记录分派重复的排队索引操作。

## 驱动先决条件

### Algolia

使用 Algolia 驱动时，应在 `config/scout.php` 配置文件中配置 Algolia 的 `id` 和 `secret` 凭据。配置凭据后，还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一个快速的开源搜索引擎。如果不知道如何在本地机器上安装 Meilisearch，可以使用 [Laravel Sail](/topic/Laravel%2013.x/e296opw9q7.html)，这是 Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在应用的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及 Meilisearch 的 `host` 和 `key` 凭据：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 Meilisearch 的更多信息，请参阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，应通过查看 [Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，确保安装与你的 Meilisearch 二进制版本兼容的 `meilisearch/meilisearch-php` 版本。

> [!WARNING]
> 在使用 Meilisearch 的应用上升级 Scout 时，应始终[查看 Meilisearch 服务本身的任何其他破坏性变更](https://github.com/meilisearch/Meilisearch/releases)。

### Typesense

[Typesense](https://typesense.org) 是一个闪电般快速的开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

可以[自托管](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) Typesense 或使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始将 Typesense 与 Scout 一起使用，通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在应用的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及 Typesense 主机和 API 密钥凭据：

```ini
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果使用 [Laravel Sail](/topic/Laravel%2013.x/e296opw9q7.html)，可能需要调整 `TYPESENSE_HOST` 环境变量以匹配 Docker 容器名称。还可以选择指定安装的端口、路径和协议：

```ini
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

Typesense 集合的其他设置和模式定义可以在应用的 `config/scout.php` 配置文件中找到。有关 Typesense 的更多信息，请参阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

### Turbopuffer

[Turbopuffer](https://turbopuffer.com) 是一个支持全文搜索、语义搜索和混合搜索的搜索引擎。要使用 Turbopuffer 驱动，请设置 `SCOUT_DRIVER` 环境变量并提供 Turbopuffer API 密钥：

```ini
SCOUT_DRIVER=turbopuffer
TURBOPUFFER_API_KEY=tpuf_...
TURBOPUFFER_REGION=gcp-us-central1
```

`TURBOPUFFER_REGION` 环境变量是可选的，默认值为 `gcp-us-central1`。

## 配置

### 配置可搜索数据

默认情况下，给定模型的整个 `toArray` 形式将被持久化到其搜索索引。如果希望自定义同步到搜索索引的数据，可以重写模型上的 `toSearchableArray` 方法：

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

#### 为每个模型配置搜索引擎

搜索时，Scout 通常使用应用的 `scout` 配置文件中指定的默认搜索引擎。但是，可以通过重写模型上的 `searchableUsing` 方法来更改特定模型的搜索引擎：

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
     * 获取用于索引模型的引擎。
     */
    public function searchableUsing(): Engine
    {
        return Scout::engine('meilisearch');
    }
}
```

## 数据库 / 集合引擎

### 数据库引擎

> [!WARNING]
> 数据库引擎目前支持 MySQL 和 PostgreSQL，它们都支持快速的全文列索引。

`database` 引擎使用 MySQL / PostgreSQL 全文索引和 `LIKE` 子句直接搜索现有数据库。对于许多应用来说，这是添加搜索最简单、最实用的方式——无需外部服务或额外的基础设施。

要使用数据库引擎，请将 `SCOUT_DRIVER` 环境变量设置为 `database`：

```ini
SCOUT_DRIVER=database
```

配置完成后，可以定义可搜索数据 并开始对模型执行搜索查询。与第三方引擎不同，数据库引擎不需要单独的索引步骤——它直接搜索数据库表。

#### 语义搜索与混合搜索

在使用带有 `pgvector` 扩展的 PostgreSQL 时，数据库引擎支持语义搜索和混合搜索。首先，向模型的表添加可空向量列和全文索引。向量列必须可空，因为 Scout 会在模型持久化后存储嵌入：

```php
Schema::ensureVectorExtensionExists();

Schema::table('articles', function (Blueprint $table) {
    // ...

    $table->vector('embedding', dimensions: 1536)->nullable();
    $table->vectorIndex('embedding');
    $table->fullText(['title', 'body']);
});
```

接下来，在模型上定义 `toSearchableEmbedding` 方法。该方法可以返回 Scout 应嵌入的源文本或预计算的嵌入数组。Scout 默认将嵌入存储在 `embedding` 列中；要使用其他列，请在模型上定义 `searchableEmbeddingColumn` 方法。

#### 自定义数据库搜索策略

默认情况下，数据库引擎会对已配置为可搜索 的每个模型属性执行 `LIKE` 查询。但是，可以为特定列分配更高效的搜索策略。`SearchUsingFullText` 属性将对列使用数据库的全文索引，而 `SearchUsingPrefix` 仅匹配字符串的开头（`example%`），而不是在整个字符串中搜索（`%example%`）。

要定义此行为，请将 PHP 属性分配给模型的 `toSearchableArray` 方法。任何没有属性的列将继续使用默认的 `LIKE` 策略：

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
> 在指定列应使用全文查询约束之前，请确保已为该列分配了[全文索引](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

### 集合引擎

「collection」引擎适用于快速原型设计、极小的数据集（几百条记录）或运行测试。它从数据库中检索所有可能的记录，并使用 Laravel 的 `Str::is` 辅助函数在 PHP 中过滤它们，因此它不需要任何索引或数据库特定的功能。对于超出简单用例的使用，应改用数据库引擎。

要使用集合引擎，只需将 `SCOUT_DRIVER` 环境变量的值设置为 `collection`，或在应用的 `scout` 配置文件中直接指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

指定集合驱动作为首选驱动后，就可以开始对模型执行搜索查询。当使用集合引擎时，不需要搜索引擎索引（如为 Algolia、Meilisearch 或 Typesense 索引填充数据所需的索引）。

#### 与数据库引擎的区别

数据库引擎使用全文索引和 `LIKE` 子句来高效查找匹配记录，而集合引擎拉取所有记录并在 PHP 中过滤它们。集合引擎是最具可移植性的选项，因为它适用于 Laravel 支持的所有关系数据库（包括 SQLite 和 SQL Server）；但是，它的效率明显低于数据库引擎，不应用于大型数据集。

## 第三方引擎配置

以下配置选项仅在使用第三方搜索引擎（如 Algolia、Meilisearch 或 Typesense）时才相关。如果使用数据库引擎，可以跳过本节。

### 配置模型索引

使用第三方引擎时，每个 Eloquent 模型都会与给定的搜索「索引」同步，该索引包含该模型的所有可搜索记录。默认情况下，每个模型将持久化到与模型典型「table」名称匹配的索引中。通常，这是模型名称的复数形式；但是，可以通过重写模型上的 `searchableAs` 方法自由自定义模型的索引：

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
> 使用数据库引擎时，`searchableAs` 方法无效，因为数据库引擎始终直接搜索模型的数据库表。

#### 配置模型 ID

默认情况下，Scout 会将模型的主键用作存储在搜索索引中的模型唯一 ID / 键。如果在使用第三方引擎时需要自定义此行为，可以重写模型上的 `getScoutKey` 和 `getScoutKeyName` 方法：

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
     */
    public function getScoutKey(): mixed
    {
        return $this->email;
    }

    /**
     * 获取用于索引模型的键名。
     */
    public function getScoutKeyName(): mixed
    {
        return 'email';
    }
}
```

> [!NOTE]
> 使用数据库引擎时，`getScoutKey` 和 `getScoutKeyName` 方法无效，因为数据库引擎始终使用模型的主键。

### Algolia

#### 索引设置

有时你可能希望在 Algolia 索引上配置其他设置。虽然可以通过 Algolia UI 管理这些设置，但直接从应用的 `config/scout.php` 配置文件管理索引配置的所需状态通常更高效。

此方法允许你通过应用的自动化部署流水线部署这些设置，避免手动配置并确保跨多个环境的一致性。可以配置可过滤属性、排名、分面，或[任何其他支持的设置](https://www.algolia.com/doc/rest-api/search/#tag/Indices/operation/setSettings)。

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
            // 其他设置字段...
        ],
        Flight::class => [
            'searchableAttributes'=> ['id', 'destination'],
        ],
    ],
],
```

如果给定索引下的模型可软删除且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型的分面支持。如果没有其他分面属性要为可软删除的模型索引定义，则可以简单地为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令会将当前配置的索引设置通知 Algolia。为方便起见，你可能希望将此命令纳入部署流程：

```shell
php artisan scout:sync-index-settings
```

#### 识别用户

Scout 允许你在使用 Algolia 时自动识别用户。将经过身份验证的用户与搜索操作关联起来，在 Algolia 仪表板中查看搜索分析时可能会有所帮助。可以通过在应用的 `.env` 文件中将 `SCOUT_IDENTIFY` 环境变量定义为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用此功能还会将请求的 IP 地址和经过身份验证的用户的主标识符传递给 Algolia，以便将此数据与用户发出的任何搜索请求相关联。

### Meilisearch

#### 索引设置

Meilisearch 要求你预定义索引搜索设置，例如可过滤属性、可排序属性，以及[其他支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是调用 Scout 的 `where` 方法时计划进行过滤的任何属性，而可排序属性是调用 Scout 的 `orderBy` 方法时计划排序的任何属性。要定义索引设置，请调整应用的 `scout` 配置文件中 `meilisearch` 配置条目的 `index-settings` 部分：

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

如果给定索引下的模型可软删除且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含对软删除模型过滤的支持。如果没有其他可过滤或可排序属性要为可软删除的模型索引定义，则可以简单地为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置应用的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令会将当前配置的索引设置通知 Meilisearch。为方便起见，你可能希望将此命令纳入部署流程：

```shell
php artisan scout:sync-index-settings
```

#### 语义搜索与混合搜索

要将语义或混合搜索与 Meilisearch 一起使用，请为每个可搜索模型配置索引设置中的嵌入器以及嵌入设置：

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

模型的 `toSearchableEmbedding` 方法可以返回源文本，Scout 使用 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 对其进行嵌入，也可以返回预计算的嵌入数组。更新配置后，运行 `scout:sync-index-settings` 命令。

#### 可搜索数据类型

Meilisearch 仅对正确类型的数据执行过滤操作（`>`、`<` 等）。在自定义可搜索数据时，应确保将数值强制转换为正确的类型：

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

### Typesense

#### 准备可搜索数据

使用 Typesense 时，可搜索模型必须定义 `toSearchableArray` 方法，该方法将模型的主键强制转换为字符串，并将创建日期强制转换为 UNIX 时间戳：

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

还应在应用的 `config/scout.php` 文件中定义 Typesense 集合的 schema。集合的 schema 描述了可通过 Typesense 搜索的每个字段的数据类型。有关所有可用 schema 选项的更多信息，请参阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果需要在定义 Typesense 集合 schema 后进行更改，可以运行 `scout:flush` 和 `scout:import`，这将删除所有现有索引数据并重新创建 schema。或者，可以使用 Typesense 的 API 修改集合的 schema 而不删除任何索引数据。

如果可搜索模型可软删除，应在应用的 `config/scout.php` 配置文件中为模型对应的 Typesense schema 定义 `__soft_deleted` 字段：

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

#### 动态搜索参数

Typesense 允许在通过 `options` 方法执行搜索操作时动态修改[搜索参数](https://typesense.org/docs/latest/api/search.html#search-parameters)：

```php
use App\Models\Todo;

Todo::search('Groceries')->options([
    'query_by' => 'title, description'
])->get();
```

### Turbopuffer

Turbopuffer 需要为每个模型定义 schema 和可搜索属性。在 `scout` 配置文件中 `turbopuffer` 配置的 `model-settings` 数组中定义它们：

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

分配给 `searchable-attributes` 的数值是相对 BM25 权重。在上面的示例中，文章标题中匹配的得分是正文匹配的 3 倍。

要启用语义和混合搜索，请将 `embedding` 设置和向量 schema 添加到模型的配置中：

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

模型的 `toSearchableEmbedding` 方法应返回 Scout 应嵌入的源文本或预计算的嵌入数组。Scout 使用 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 生成源文本嵌入。

或者，可以使用 Turbopuffer 的原生嵌入而无需安装 Laravel AI SDK 或定义 `toSearchableEmbedding` 方法。将嵌入驱动设置为 `turbopuffer` 并在可搜索源属性上配置 `embed` schema：

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

## 第三方引擎索引

> [!NOTE]
> 本节描述的索引功能主要与使用第三方引擎（Algolia、Meilisearch、Typesense 或 Turbopuffer）相关。数据库引擎直接搜索数据库表，因此不需要手动索引管理。

### 批量导入

如果要将 Scout 安装到现有项目中，可能已经有需要导入到索引中的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，可用于将所有现有记录导入到搜索索引：

```shell
php artisan scout:import "App\Models\Post"
```

`scout:queue-import` 命令可用于使用[排队任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 导入所有现有记录：

```shell
php artisan scout:queue-import "App\Models\Post" --chunk=500
```

`flush` 命令可用于从搜索索引中删除模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

#### 修改导入查询

如果希望修改用于批量导入时检索所有模型的查询，可以在模型上定义 `makeAllSearchableUsing` 方法。这是一个很好的地方，可以在导入模型之前添加任何可能需要的预加载关联：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * 修改用于在使所有模型可搜索时检索模型的查询。
 */
protected function makeAllSearchableUsing(Builder $query): Builder
{
    return $query->with('author');
}
```

> [!WARNING]
> 使用队列批量导入模型时，`makeAllSearchableUsing` 方法可能不适用。当任务处理模型集合时，关联[不会被恢复](/topic/Laravel%2013.x/wevwmkz9l2.html)。

### 添加记录

将 `Laravel\Scout\Searchable` trait 添加到模型后，只需 `save` 或 `create` 一个模型实例，它就会自动添加到搜索索引。如果已将 Scout 配置为使用队列，则此操作将由队列工作进程在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

#### 通过查询添加记录

如果希望通过 Eloquent 查询将模型集合添加到搜索索引，可以将 `searchable` 方法链接到 Eloquent 查询上。`searchable` 方法将对查询结果进行[分块](/topic/Laravel%2013.x/rwyl2kxvz8.html)，并将记录添加到搜索索引。同样，如果已将 Scout 配置为使用队列，则所有块将由队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

还可以在 Eloquent 关联实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果内存中已有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，将模型实例添加到其对应的索引：

```php
$orders->searchable();
```

> [!NOTE]
> `searchable` 方法可被视为「upsert」操作。换句话说，如果模型记录已在索引中，则会更新。如果它不存在于搜索索引中，则会添加到索引中。

### 更新记录

要更新可搜索模型，只需更新模型实例的属性并 `save` 模型到数据库即可。Scout 会自动将更改持久化到搜索索引：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

还可以在 Eloquent 查询实例上调用 `searchable` 方法来更新模型集合。如果模型不存在于搜索索引中，则会创建它们：

```php
Order::where('price', '>', 100)->searchable();
```

如果希望更新关联中所有模型的搜索索引记录，可以在关联实例上调用 `searchable`：

```php
$user->orders()->searchable();
```

或者，如果内存中已有 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，将模型实例更新到其对应的索引：

```php
$orders->searchable();
```

#### 在导入前修改记录

有时你可能需要在模型集合变为可搜索之前准备好它们。例如，你可能希望预加载关联，以便关联数据可以高效地添加到搜索索引。为此，请在相应的模型上定义 `makeSearchableUsing` 方法：

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

#### 有条件地更新搜索索引

默认情况下，无论修改了哪些属性，Scout 都会重新索引已更新的模型。如果希望自定义此行为，可以在模型上定义 `searchIndexShouldBeUpdated` 方法：

```php
/**
 * 确定是否应更新搜索索引。
 */
public function searchIndexShouldBeUpdated(): bool
{
    return $this->wasRecentlyCreated || $this->wasChanged(['title', 'body']);
}
```

### 删除记录

要从索引中删除记录，只需从数据库中 `delete` 该模型。即使使用的是[软删除](/topic/Laravel%2013.x/rwyl2kxvz8.html) 模型，也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果不想在删除记录之前检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果希望删除关联中所有模型的搜索索引记录，可以在关联实例上调用 `unsearchable`：

```php
$user->orders()->unsearchable();
```

或者，如果内存中已有 Eloquent 模型集合，可以在集合实例上调用 `unsearchable` 方法，从其对应的索引中删除模型实例：

```php
$orders->unsearchable();
```

要从其对应的索引中删除所有模型记录，可以调用 `removeAllFromSearch` 方法：

```php
Order::removeAllFromSearch();
```

### 暂停索引

有时你可能需要在不将模型数据同步到搜索索引的情况下对模型执行一批 Eloquent 操作。可以使用 `withoutSyncingToSearch` 方法执行此操作。此方法接受一个将立即执行的闭包。在闭包内发生的任何模型操作都不会同步到模型的索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

### 有条件地可搜索的模型实例

有时你可能只希望在特定条件下使模型可搜索。例如，假设有一个 `App\Models\Post` 模型，可能处于两种状态之一：「草稿」和「已发布」。你可能只希望允许「已发布」的文章可搜索。为此，可以在模型上定义 `shouldBeSearchable` 方法：

```php
/**
 * 确定模型是否应可搜索。
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法仅在通过 `save` 和 `create` 方法、查询或关联操作模型时才适用。直接使用 `searchable` 方法使模型或集合可搜索将覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]
> 使用 Scout 的「database」引擎时，`shouldBeSearchable` 方法不适用，因为所有可搜索数据始终存储在数据库中。要在使用数据库引擎时实现类似的行为，应改用 where 子句。

## 搜索

可以使用 `search` 方法开始搜索模型。`search` 方法接受一个字符串，该字符串将用于搜索模型。然后应将 `get` 方法链接到搜索查询上，以检索与给定搜索查询匹配的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 搜索返回 Eloquent 模型集合，甚至可以直接从路由或控制器返回结果，它们将自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果希望在结果转换为 Eloquent 模型之前获取原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

### 语义搜索

数据库、Meilisearch 和 Turbopuffer 引擎支持语义搜索，它根据查询的含义匹配记录。当 Scout 生成嵌入时，语义和混合搜索需要 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html)。Turbopuffer 的原生嵌入 和预计算的查询向量不需要 Laravel AI SDK。

为所选引擎配置嵌入后，在搜索查询上调用 `semantic` 方法：

```php
$articles = Article::search('staying cool in the summer')
    ->semantic()
    ->get();
```

在所选引擎支持时，可以提供最小相似度阈值：

```php
$articles = Article::search('renewable energy storage')
    ->semantic(minSimilarity: 0.6)
    ->get();
```

要结合全文和语义搜索，请使用 `hybrid` 方法。它的前两个参数控制文本和语义结果的相对权重：

```php
$articles = Article::search('renewable energy storage')
    ->hybrid(textWeight: 1, semanticWeight: 2)
    ->get();
```

#### 自定义索引

使用第三方引擎搜索时，搜索查询通常在模型的 searchableAs 方法指定的索引上执行。但是，可以使用 `within` 方法指定要搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

### Where 子句

Scout 允许向搜索查询添加「where」子句。例如，基本相等性检查对于按所有者 ID 限定搜索查询范围非常有用：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

还可以使用 `=`、`!=`、`<`、`>`、`>=`、`<=` 比较运算符构建更高级的查询：

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
> 如果应用正在使用 Meilisearch，则必须在使用 Scout 的「where」子句之前配置应用的可过滤属性。

#### 自定义 Eloquent 结果查询

Scout 从应用搜索引擎检索匹配的 Eloquent 模型列表后，将使用 Eloquent 通过主键检索所有匹配的模型。可以通过调用 `query` 方法来自定义此查询。`query` 方法接受一个闭包作为参数，该闭包将接收 Eloquent 查询构造器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

使用第三方引擎时，此回调在已经从搜索引擎检索到相关模型之后调用，因此它不应用于「过滤」结果——请改用 Scout where 子句。但是，使用数据库引擎时，`query` 方法的约束直接应用于数据库查询，因此也可以将其用于过滤。

### 分页

除了检索模型集合外，还可以使用 `paginate` 方法对搜索结果进行分页。此方法将返回 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像[对传统 Eloquent 查询进行分页](/topic/Laravel%2013.x/3xyq454vmq.html) 一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

可以通过将数量作为第一个参数传递给 `paginate` 方法来指定每页检索的模型数量：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

使用数据库引擎时，还可以使用 `simplePaginate` 方法。与 `paginate` 不同（`paginate` 检索匹配记录的总数以便显示页码），`simplePaginate` 仅确定当前页之后是否还有更多结果——对于只需要「上一页」和「下一页」链接的大型数据集来说更高效：

```php
$orders = Order::search('Star Trek')->simplePaginate(15);
```

检索结果后，可以使用 [Blade](/topic/Laravel%2013.x/wevwmrz9l2.html) 显示结果并呈现页面链接，就像对传统 Eloquent 查询进行分页一样：

```html
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果希望以 JSON 形式检索分页结果，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]
> 由于搜索引擎不知道 Eloquent 模型的全局作用域定义，因此不应在利用 Scout 分页的应用中使用全局作用域。或者，应在通过 Scout 搜索时重新创建全局作用域的约束。

### 软删除

如果已索引的模型是[软删除](/topic/Laravel%2013.x/rwyl2kxvz8.html) 的，并且需要搜索软删除的模型，请将 `config/scout.php` 配置文件的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中删除软删除的模型。相反，它将在索引的记录上设置一个隐藏的 `__soft_deleted` 属性。然后，可以使用 `withTrashed` 或 `onlyTrashed` 方法在搜索时检索软删除的记录：

```php
use App\Models\Order;

// 在检索结果时包括已删除的记录...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 在检索结果时仅包括已删除的记录...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]
> 当使用 `forceDelete` 永久删除软删除模型时，Scout 将自动从搜索索引中删除它。

### 自定义引擎搜索

如果需要对引擎的搜索行为进行高级自定义，可以将闭包作为第二个参数传递给 `search` 方法。例如，可以使用此回调在搜索查询传递给 Algolia 之前将地理位置数据添加到搜索选项：

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

## 自定义引擎

#### 编写引擎

如果某个内置 Scout 搜索引擎不适合你的需求，可以编写自己的自定义引擎并将其注册到 Scout。你的引擎应继承 `Laravel\Scout\Engines\Engine` 抽象类。该抽象类包含自定义引擎必须实现的八个方法：

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

查看 `Laravel\Scout\Engines\AlgoliaEngine` 类上这些方法的实现可能会有所帮助。该类将为你提供一个良好的起点，帮助你了解如何在自己的引擎中实现每个方法。

#### 注册引擎

编写自定义引擎后，可以使用 Scout 引擎管理器的 `extend` 方法将其注册到 Scout。Scout 的引擎管理器可以从 Laravel 服务容器中解析。应该从 `App\Providers\AppServiceProvider` 类的 `boot` 方法或应用使用的任何其他服务提供者中调用 `extend` 方法：

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

注册引擎后，可以在应用的 `config/scout.php` 配置文件中将其指定为默认 Scout `driver`：

```php
'driver' => 'mysql',
```