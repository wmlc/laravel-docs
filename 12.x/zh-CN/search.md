# 搜索

- [简介](#introduction)
    - [全文搜索](#introduction-full-text-search)
    - [语义／向量搜索](#introduction-semantic-vector-search)
    - [重排序](#introduction-reranking)
    - [Scout 搜索引擎](#introduction-scout-search-engines)
- [全文搜索](#full-text-search)
    - [添加全文索引](#adding-full-text-indexes)
    - [运行全文查询](#running-full-text-queries)
- [语义／向量搜索](#semantic-vector-search)
    - [生成嵌入向量](#generating-embeddings)
    - [存储与索引向量](#storing-and-indexing-vectors)
    - [按相似度查询](#querying-by-similarity)
- [重排序结果](#reranking-results)
- [Laravel Scout](#laravel-scout)
    - [数据库引擎](#database-engine)
    - [第三方引擎](#third-party-engines)
- [组合使用多种技术](#combining-techniques)

<a name="introduction"></a>
## 简介

几乎每个应用都需要搜索功能。无论你的用户是在知识库中搜索相关文章、浏览产品目录，还是对一批文档提出自然语言问题，Laravel 都提供了内置工具来应对这些场景——而且你通常不需要借助任何外部服务。

大多数应用会发现，Laravel 提供的内置数据库搜索方案已经绰绰有余——只有当你需要诸如容错匹配、分面过滤或大规模地理搜索等功能时，才有必要使用外部搜索服务。

<a name="introduction-full-text-search"></a>
#### 全文搜索

当你需要关键词相关性排序——即数据库根据结果与搜索词的匹配程度来评分和排序时——Laravel 的 `whereFullText` 查询构造器方法可以利用 MariaDB、MySQL 和 PostgreSQL 上的原生全文索引。全文搜索理解单词边界和词干提取，因此搜索 "running" 可以匹配包含 "run" 的记录。无需任何外部服务。

<a name="introduction-semantic-vector-search"></a>
#### 语义／向量搜索

对于按*含义*（而非精确关键词）匹配结果的 AI 语义搜索，`whereVectorSimilarTo` 查询构造器方法使用存储在 PostgreSQL 中的向量嵌入，并依赖 `pgvector` 扩展。例如，搜索 "best wineries in Napa Valley" 可以呈现标题为 "Top Vineyards to Visit" 的文章——即使两者没有任何相同的单词。向量搜索需要带有 `pgvector` 扩展的 PostgreSQL 以及 [Laravel AI SDK](/docs/{{version}}/ai-sdk)。

<a name="introduction-reranking"></a>
#### 重排序

Laravel 的 [AI SDK](/docs/{{version}}/ai-sdk) 提供重排序能力，利用 AI 模型按与查询的语义相关度对任意一组结果重新排序。重排序在全文搜索这类快速初检步骤之后作为第二阶段尤为强大——让你兼得速度与语义准确性。

<a name="introduction-scout-search-engines"></a>
#### Laravel Scout 搜索

对于希望使用 `Searchable` Trait 来自动保持搜索索引与 Eloquent 模型同步的应用，[Laravel Scout](/docs/{{version}}/scout) 既提供了内置的数据库引擎，也为 Algolia、Meilisearch 和 Typesense 等第三方服务提供了驱动。

<a name="full-text-search"></a>
## 全文搜索

`LIKE` 查询虽然适合简单的子串匹配，但它并不理解语言。用 `LIKE` 搜索 "running" 找不到只包含 "run" 的记录，而且结果不会按相关性排序——它们只是按数据库找到的顺序原样返回。全文搜索通过使用能够理解单词边界、词干提取和相关性评分的专用索引解决了这两个问题，让数据库能够优先返回最相关的结果。

MariaDB、MySQL 和 PostgreSQL 内置了快速的全文搜索——无需外部搜索服务。你只需在想要搜索的列上添加全文索引，然后使用 `whereFullText` 查询构造器方法对其执行搜索。

> [!WARNING]
> 全文搜索目前支持 MariaDB、MySQL 和 PostgreSQL。

<a name="adding-full-text-indexes"></a>
### 添加全文索引

要使用全文搜索，首先要在想要搜索的列上添加全文索引。你可以将索引添加到单个列上，也可以传递一个列数组来创建跨多个字段的复合索引，从而一次性搜索多个字段：

```php
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();

    $table->fullText(['title', 'body']);
});
```

在 PostgreSQL 上，你可以为索引指定语言配置，用于控制单词的词干提取方式：

```php
$table->fullText('body')->language('english');
```

更多关于创建索引的信息，请查阅[数据库迁移文档](/docs/{{version}}/migrations#available-index-types)。

<a name="running-full-text-queries"></a>
### 运行全文查询

建好索引后，就可以使用 `whereFullText` 查询构造器方法对其执行搜索。Laravel 会为你的数据库驱动生成相应的 SQL——例如在 MariaDB 和 MySQL 上是 `MATCH(...) AGAINST(...)`，在 PostgreSQL 上是 `to_tsvector(...) @@ plainto_tsquery(...)`：

```php
$articles = Article::whereFullText('body', 'web developer')->get();
```

使用 MariaDB 和 MySQL 时，结果会自动按相关性评分排序。在 PostgreSQL 上，`whereFullText` 会过滤出匹配的记录，但不会按相关性排序——如果你需要在 PostgreSQL 上自动按相关性排序，可以考虑使用 [Scout 的数据库引擎](#database-engine)，它会替你处理好这一点。

如果你创建了跨多列的复合全文索引，可以向 `whereFullText` 传递相同的列数组，从而对所有这些列执行搜索：

```php
$articles = Article::whereFullText(
    ['title', 'body'], 'web developer'
)->get();
```

可以使用 `orWhereFullText` 方法将全文搜索子句作为「或」条件添加。完整细节请查阅[查询构造器文档](/docs/{{version}}/queries#full-text-where-clauses)。

<a name="semantic-vector-search"></a>
## 语义／向量搜索

全文搜索依赖于关键词匹配——查询中的词必须（以某种形式）出现在数据中。语义搜索采取了截然不同的方式：它使用 AI 生成的向量嵌入将文本的*含义*表示为数字数组，然后找出含义与查询最相似的结果。例如，搜索 "best wineries in Napa Valley" 可以呈现标题为 "Top Vineyards to Visit" 的文章——即使两者没有任何相同的单词。

向量搜索的基本工作流程是：为每段内容生成一个嵌入（一个数字数组）并与数据一起存储；搜索时，为用户的查询生成嵌入，然后找出向量空间中与它最接近的已存储嵌入。

> [!NOTE]
> 向量搜索需要带有 `pgvector` 扩展的 PostgreSQL 数据库以及 [Laravel AI SDK](/docs/{{version}}/ai-sdk)。所有 [Laravel Cloud](https://cloud.laravel.com) 的 Serverless Postgres 数据库都已内置 `pgvector`。

<a name="generating-embeddings"></a>
### 生成嵌入向量

嵌入是一个高维数字数组（通常有数百或数千个数字），表示一段文本的语义。你可以使用 Laravel `Stringable` 类上的 `toEmbeddings` 方法为字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embedding = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

要一次性为多个输入生成嵌入——这比逐个生成更高效，因为只需调用一次嵌入服务的 API——可以使用 `Embeddings` 类：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    'Napa Valley has great wine.',
    'Laravel is a PHP framework.',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

更多关于配置嵌入服务、自定义维度和缓存的信息，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#embeddings)。

<a name="storing-and-indexing-vectors"></a>
### 存储与索引向量

要存储向量嵌入，需要在数据库迁移中定义一个 `vector` 列，并指定与你所用的嵌入服务输出相匹配的维度数（例如 OpenAI 的 `text-embedding-3-small` 模型为 1536）。你还应当在该列上调用 `index` 来创建 HNSW（分层可导航小世界）索引，它可以大幅提升大型数据集上的相似度搜索速度：

```php
Schema::ensureVectorExtensionExists();

Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->vector('embedding', dimensions: 1536)->index();
    $table->timestamps();
});
```

`Schema::ensureVectorExtensionExists` 方法会在创建表之前确保你的 PostgreSQL 数据库已启用 `pgvector` 扩展。

在你的 Eloquent 模型上，将向量列转换为（Cast）`array` 类型，这样 Laravel 就会自动处理 PHP 数组与数据库向量格式之间的转换：

```php
protected function casts(): array
{
    return [
        'embedding' => 'array',
    ];
}
```

更多关于向量列和索引的信息，请查阅[数据库迁移文档](/docs/{{version}}/migrations#available-column-types)。

<a name="querying-by-similarity"></a>
### 按相似度查询

为内容存储好嵌入之后，你就可以使用 `whereVectorSimilarTo` 方法搜索相似的记录。该方法使用余弦相似度将给定的嵌入与存储的向量进行比较，过滤掉低于 `minSimilarity` 阈值的结果，并自动按相关性排序——最相似的记录排在最前面。阈值应当是 `0.0` 到 `1.0` 之间的值，`1.0` 表示两个向量完全相同：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

为了方便起见，当传入的是普通字符串而非嵌入数组时，Laravel 会自动使用你配置的嵌入服务为你生成嵌入。这意味着你可以直接传递用户的搜索查询，而无需先手动将其转换为嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

如果需要对向量查询进行更底层的控制，还可以使用 `whereVectorDistanceLessThan`、`selectVectorDistance` 和 `orderByVectorDistance` 方法。这些方法让你可以直接使用距离值而非相似度评分，可以将计算出的距离作为结果中的一列选出，也可以手动控制排序。完整细节请查阅[查询构造器文档](/docs/{{version}}/queries#vector-similarity-clauses)和 [AI SDK 文档](/docs/{{version}}/ai-sdk#querying-embeddings)。

<a name="reranking-results"></a>
## 重排序结果

重排序是这样一种技术：由 AI 模型根据每条结果与给定查询的语义相关程度，对一组结果重新排序。与需要预先计算并存储嵌入的向量搜索不同，重排序适用于任何文本集合——它接收原始内容和查询作为输入，返回按相关性排序后的条目。

重排序在快速初检步骤之后作为第二阶段尤为强大。例如，你可以先用全文搜索将数千条记录快速缩小到前 50 个候选，再使用重排序将最相关的结果排到最前面。这种「先检索、后重排」的模式让你兼得速度与语义准确性。

你可以使用 `Reranking` 类对一个字符串数组进行重排序：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library for building user interfaces.',
])->rerank('PHP frameworks');

$response->first()->document; // "Laravel is a PHP web application framework."
```

Laravel 集合还提供了一个 `rerank` 宏，它接受一个字段名（或闭包）和一个查询，让你能够轻松对 Eloquent 结果进行重排序：

```php
$articles = Article::all()
    ->rerank('body', 'Laravel tutorials');
```

更多关于配置重排序服务及可用选项的完整细节，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#reranking)。

<a name="laravel-scout"></a>
## Laravel Scout

上文介绍的搜索技术都是你在代码中直接调用的查询构造器方法。[Laravel Scout](/docs/{{version}}/scout) 则采取了另一种方式：它提供一个添加到 Eloquent 模型上的 `Searchable` Trait，并在记录创建、更新和删除时自动保持搜索索引同步。当你希望模型始终可搜索、又不想手动管理索引更新时，这会特别方便。

<a name="database-engine"></a>
### 数据库引擎

Scout 内置的数据库引擎会基于你现有的数据库执行全文搜索和 `LIKE` 搜索——无需外部服务或额外的基础设施。只需将 `Searchable` Trait 添加到你的模型上，并定义一个 `toSearchableArray` 方法来返回希望可搜索的列。

你可以使用 PHP 属性（Attribute）来控制每一列的搜索策略。`SearchUsingFullText` 会使用数据库的全文索引，`SearchUsingPrefix` 只会从字符串开头进行匹配（`example%`），而未加属性的列默认使用两侧带通配符的 `LIKE` 策略（`%example%`）：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;
use Laravel\Scout\Searchable;

class Article extends Model
{
    use Searchable;

    #[SearchUsingPrefix(['id'])]
    #[SearchUsingFullText(['title', 'body'])]
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
        ];
    }
}
```

> [!WARNING]
> 在指定某列使用全文查询约束之前，请确保该列已被分配[全文索引](/docs/{{version}}/migrations#available-index-types)。

添加 Trait 之后，你就可以使用 Scout 的 `search` 方法搜索你的模型。Scout 的数据库引擎会自动按相关性排序结果，即便在 PostgreSQL 上也是如此：

```php
$articles = Article::search('Laravel')->get();
```

当你的搜索需求适中，又希望享受 Scout 自动索引同步的便利而不部署外部服务时，数据库引擎是一个绝佳选择。它能够很好地处理最常见的搜索场景，包括过滤、分页和软删除记录的处理。完整细节请查阅 [Scout 文档](/docs/{{version}}/scout#database-engine)。

<a name="third-party-engines"></a>
### 第三方引擎

Scout 还支持第三方搜索引擎，例如 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org)。这些专用搜索服务提供容错匹配、分面过滤、地理搜索和自定义排序规则等高级功能——在超大规模场景下，或当你需要打磨精良的边输边搜（search-as-you-type）体验时，这些功能会变得很重要。

由于 Scout 在所有驱动之上提供了统一的 API，之后从数据库引擎切换到第三方引擎只需极少的代码改动。你可以先从数据库引擎入手，只在应用的需求超出数据库能力范围时，再迁移到第三方服务。

更多关于配置第三方引擎的完整细节，请查阅 [Scout 文档](/docs/{{version}}/scout)。

> [!NOTE]
> 许多应用永远不需要外部搜索引擎。本页介绍的内置技术足以覆盖绝大多数使用场景。

<a name="combining-techniques"></a>
## 组合使用多种技术

本页介绍的搜索技术并不互斥——将它们组合使用往往能取得最佳效果。下面是两个常见的模式，展示了这些工具如何协同工作。

**全文检索 + 重排序**

先使用全文搜索将大型数据集快速缩小到候选集，再应用重排序按语义相关度对这些候选进行排序。这让你既拥有数据库原生全文搜索的速度，又具备 AI 相关性评分的准确性：

```php
$articles = Article::query()
    ->whereFullText('body', $request->input('query'))
    ->limit(50)
    ->get()
    ->rerank('body', $request->input('query'), limit: 10);
```

**向量搜索 + 传统过滤**

将向量相似度与标准的 `where` 子句结合，把语义搜索限定到一部分记录中。当你既需要基于含义的搜索，又需要按归属、类别或其他任何属性限制结果时，这一模式很有用：

```php
$documents = Document::query()
    ->where('team_id', $user->team_id)
    ->whereVectorSimilarTo('embedding', $request->input('query'))
    ->limit(10)
    ->get();
```
