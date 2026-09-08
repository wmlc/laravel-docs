# 搜索

- [简介](#introduction)
    - [全文搜索](#introduction-full-text-search)
    - [语义 / 向量搜索](#introduction-semantic-vector-search)
    - [重排序](#introduction-reranking)
    - [Scout 搜索引擎](#introduction-scout-search-engines)
- [全文搜索](#full-text-search)
    - [添加全文索引](#adding-full-text-indexes)
    - [运行全文查询](#running-full-text-queries)
- [语义 / 向量搜索](#semantic-vector-search)
    - [生成嵌入](#generating-embeddings)
    - [存储与索引向量](#storing-and-indexing-vectors)
    - [按相似度查询](#querying-by-similarity)
- [对结果重排序](#reranking-results)
- [Laravel Scout](#laravel-scout)
    - [数据库引擎](#database-engine)
    - [第三方引擎](#third-party-engines)
- [组合使用多种技术](#combining-techniques)

<a name="introduction"></a>
## 简介

几乎每个应用都需要搜索功能。无论是你的用户在知识库中检索相关文章、浏览产品目录，还是针对文档语料提出自然语言问题，Laravel 都提供了内置工具来处理每种场景——而且通常你无需任何外部服务即可实现。

大多数应用会发现，Laravel 提供的、基于内置数据库的方案已绰绰有余——只有在需要错字容忍、分面过滤或超大规模地理搜索等功能时，才需要外部搜索服务。

<a name="introduction-full-text-search"></a>
#### 全文搜索

当你需要关键词相关性排序——即数据库根据结果与搜索词的匹配程度对其进行打分和排序——时，Laravel 的 `whereFullText` 查询构造器方法会利用 MariaDB、MySQL 和 PostgreSQL 上的原生全文索引。全文搜索能够识别词边界和词干，因此搜索"running"可以匹配包含"run"的记录。无需任何外部服务。

<a name="introduction-semantic-vector-search"></a>
#### 语义 / 向量搜索

对于按*含义*而非精确关键词匹配结果的 AI 语义搜索，`whereVectorSimilarTo` 查询构造器方法使用存储在 PostgreSQL（带 `pgvector` 扩展）或 MariaDB 中的向量嵌入。例如，搜索"纳帕谷最佳酒庄"可以找出标题为"值得一游的顶级葡萄园"的文章——即使两者之间没有任何重叠的词语。向量搜索需要安装 `pgvector` 扩展的 PostgreSQL 或 MariaDB 11.7 及以上版本，以及 [Laravel AI SDK](/docs/{{version}}/ai-sdk)。

<a name="introduction-reranking"></a>
#### 重排序

Laravel 的 [AI SDK](/docs/{{version}}/ai-sdk) 提供了重排序能力，它使用 AI 模型根据与查询的语义相关性对任意结果集重新排序。在全文搜索等快速初始检索步骤之后，重排序作为第二阶段尤其强大——让你同时获得速度与语义准确性。

<a name="introduction-scout-search-engines"></a>
#### Laravel Scout 搜索

对于希望使用 `Searchable` Trait 自动保持搜索索引与 Eloquent 模型同步的应用，[Laravel Scout](/docs/{{version}}/scout) 既提供内置的数据库引擎，也提供针对 Algolia、Meilisearch、Typesense 和 Turbopuffer 等第三方服务的驱动。

<a name="full-text-search"></a>
## 全文搜索

虽然 `LIKE` 查询非常适合简单的子串匹配，但它无法理解语言。对"running"的 `LIKE` 搜索找不到包含"run"的记录，而且结果不会按相关性排序——只会按数据库找到它们的任意顺序返回。全文搜索通过使用能理解词边界、词干和相关性评分的专用索引解决了这两个问题，让数据库优先返回最相关的结果。

MariaDB、MySQL 和 PostgreSQL 均内置了快速的全文搜索——无需外部搜索服务。你只需向要搜索的列添加全文索引，然后使用 `whereFullText` 查询构造器方法进行搜索即可。

> [!WARNING]
> 目前 MariaDB、MySQL 和 PostgreSQL 支持全文搜索。

<a name="adding-full-text-indexes"></a>
### 添加全文索引

要使用全文搜索，首先需要向要搜索的列添加全文索引。你可以为单个列添加索引，也可以传入列数组创建一次即可跨多个字段搜索的组合索引：

```php
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();

    $table->fullText(['title', 'body']);
});
```

在 PostgreSQL 上，你可以为索引指定语言配置，它控制词干提取的方式：

```php
$table->fullText('body')->language('english');
```

关于创建索引的更多信息，请查阅[迁移文档](/docs/{{version}}/migrations#available-index-types)。

<a name="running-full-text-queries"></a>
### 运行全文查询

索引就位后，使用 `whereFullText` 查询构造器方法进行搜索。Laravel 会为你的数据库驱动生成相应的 SQL——例如，在 MariaDB 和 MySQL 上生成 `MATCH(...) AGAINST(...)`，在 PostgreSQL 上生成 `to_tsvector(...) @@ plainto_tsquery(...)`：

```php
$articles = Article::whereFullText('body', 'web developer')->get();
```

使用 MariaDB 和 MySQL 时，结果会自动按相关性得分排序。在 PostgreSQL 上，`whereFullText` 会过滤匹配记录，但不会按相关性排序——如果你需要 PostgreSQL 上的自动相关性排序，可以考虑使用 [Scout 的数据库引擎](#database-engine)，它会帮你处理这个问题。

如果你创建了跨多个列的组合全文索引，可以向 `whereFullText` 传入相同的列数组，一次性搜索所有这些列：

```php
$articles = Article::whereFullText(
    ['title', 'body'], 'web developer'
)->get();
```

`orWhereFullText` 方法可用于将全文搜索子句添加为"or"条件。完整细节请查阅[查询构造器文档](/docs/{{version}}/queries#full-text-where-clauses)。

<a name="semantic-vector-search"></a>
## 语义 / 向量搜索

全文搜索依赖于关键词匹配——查询中的词语必须以某种形式出现在数据中。语义搜索采用了一种根本不同的方法：它使用 AI 生成的向量嵌入，将文本的*含义*表示为数字数组，然后找出含义与查询最相似的结果。例如，搜索"纳帕谷最佳酒庄"可以找出标题为"值得一游的顶级葡萄园"的文章——即使两者的词语完全没有重叠。

向量搜索的基本流程是：为每段内容生成一个嵌入（数字数组）并随数据一起存储，然后在搜索时为用户查询生成嵌入，找出向量空间中与它最接近的已存嵌入。

> [!NOTE]
> 向量搜索需要 [Laravel AI SDK](/docs/{{version}}/ai-sdk)，并受 PostgreSQL（需要 `pgvector` 扩展）、MariaDB 11.7 及以上版本以及 MongoDB（需要 [Laravel MongoDB 包](https://laravel.com/docs/13.x/mongodb)）支持。[Laravel Cloud](https://laravel.com/cloud) 上的所有 Postgres 数据库都已安装 `pgvector`。

<a name="generating-embeddings"></a>
### 生成嵌入

嵌入是一个高维数字数组（通常包含数百或数千个数字），表示一段文本的语义含义。你可以使用 Laravel `Stringable` 类上提供的 `toEmbeddings` 方法为字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embedding = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

要为多个输入一次性生成嵌入——这比逐个生成更高效，因为对嵌入提供方只需一次 API 调用——可以使用 `Embeddings` 类：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    'Napa Valley has great wine.',
    'Laravel is a PHP framework.',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

关于配置嵌入提供方、自定义维度及缓存的更多细节，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#embeddings)。

<a name="storing-and-indexing-vectors"></a>
### 存储与索引向量

要存储向量嵌入，请在迁移中定义一个 `vector` 列，并指定与嵌入提供方输出相匹配的维度数（例如，OpenAI 的 `text-embedding-3-small` 模型为 1536）。你还应该在该列上调用 `index` 来创建 HNSW（层级可导航小世界）索引，它能显著加快大数据集上的相似度搜索：

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

`Schema::ensureVectorExtensionExists` 方法用于确保在创建表之前，你的 PostgreSQL 数据库上已启用 `pgvector` 扩展。

在你的 Eloquent 模型上，使用 `AsVector` 类型转换，让 Laravel 自动处理 PHP 数组与数据库向量格式之间的转换：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

关于向量列与索引的更多细节，请查阅[迁移文档](/docs/{{version}}/migrations#available-column-types)。

<a name="querying-by-similarity"></a>
### 按相似度查询

为内容存储好嵌入后，你可以使用 `whereVectorSimilarTo` 方法搜索相似记录。该方法使用余弦相似度将给定嵌入与已存向量进行比较，过滤掉低于 `minSimilarity` 阈值的结果，并自动按相关性对结果排序——最相似的记录排在最前。阈值应介于 `0.0` 与 `1.0` 之间，其中 `1.0` 表示向量完全相同：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

为方便起见，当传入普通字符串而不是嵌入数组时，Laravel 会使用你配置的嵌入提供方自动为你生成嵌入。这意味着你可以直接传入用户的搜索查询，而无需先手动将其转换为嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

如需对向量查询进行更底层的控制，还可以使用 `whereVectorDistanceLessThan`、`selectVectorDistance` 和 `orderByVectorDistance` 方法。这些方法让你可以直接处理距离值而非相似度分数、在结果中将计算出的距离选为列，或手动控制排序顺序。完整细节请查阅[查询构造器文档](/docs/{{version}}/queries#vector-similarity-clauses)与 [AI SDK 文档](/docs/{{version}}/ai-sdk#querying-embeddings)。

<a name="reranking-results"></a>
## 对结果重排序

重排序是一种由 AI 模型根据每个结果与给定查询的语义相关程度对结果集重新排序的技术。与需要预先计算并存储嵌入的向量搜索不同，重排序适用于任何文本集合——它接受原始内容和查询作为输入，并返回按相关性排序的条目。

在快速的初始检索步骤之后，重排序作为第二阶段尤其强大。例如，你可以使用全文搜索快速将数千条记录缩小到前 50 个候选，然后使用重排序将最相关的结果置于顶部。这种"先检索后重排序"的模式让你同时获得速度与语义准确性。

你可以使用 `Reranking` 类对字符串数组进行重排序：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library for building user interfaces.',
])->rerank('PHP frameworks');

$response->first()->document; // "Laravel is a PHP web application framework."
```

Laravel 集合还提供一个 `rerank` 宏，它接受字段名（或闭包）和查询，可以轻松地对 Eloquent 结果进行重排序：

```php
$articles = Article::all()
    ->rerank('body', 'Laravel tutorials');
```

关于配置重排序提供方及可用选项的完整细节，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#reranking)。

<a name="laravel-scout"></a>
## Laravel Scout

上面描述的搜索技术都是你直接在代码中调用的查询构造器方法。[Laravel Scout](/docs/{{version}}/scout) 采用不同的方法：它提供一个 `Searchable` Trait，你可以将其添加到 Eloquent 模型上，Scout 会在记录被创建、更新和删除时自动保持搜索索引同步。当你希望模型始终可搜索、又不想手动管理索引更新时，这尤其方便。

<a name="database-engine"></a>
### 数据库引擎

Scout 内置的数据库引擎针对你现有的数据库执行全文和 `LIKE` 搜索——无需外部服务或额外的基础设施。只需将 `Searchable` Trait 添加到模型上，并定义一个返回可搜索列的 `toSearchableArray` 方法即可。

你可以使用 PHP 属性控制每列的搜索策略。`SearchUsingFullText` 将使用数据库的全文索引，`SearchUsingPrefix` 只从字符串开头匹配（`example%`），而没有任何属性的列则使用两侧都带通配符的默认 `LIKE` 策略（`%example%`）：

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

添加 Trait 后，你可以使用 Scout 的 `search` 方法搜索模型。Scout 的数据库引擎会自动按相关性对结果排序，即使在 PostgreSQL 上也是如此：

```php
$articles = Article::search('Laravel')->get();
```

当你的搜索需求适中，又想在不部署外部服务的情况下享受 Scout 自动索引同步的便利时，数据库引擎是一个绝佳选择。它能很好地处理最常见的搜索用例，包括过滤、分页和软删除记录处理。完整细节请查阅 [Scout 文档](/docs/{{version}}/scout#database-engine)。

<a name="third-party-engines"></a>
### 第三方引擎

Scout 还支持 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org) 等第三方搜索引擎。这些专门的搜索服务提供错字容忍、分面过滤、地理搜索和自定义排名规则等高级功能——当规模非常庞大或需要高度精致的边输入边搜索体验时，这些功能就变得重要起来。

由于 Scout 在其所有驱动之上提供统一的 API，日后从数据库引擎切换到第三方引擎只需极少代码改动。你可以先从数据库引擎起步，只有当应用的需求超出了数据库所能提供的范围时，再迁移到第三方服务。

关于配置第三方引擎的完整细节，请查阅 [Scout 文档](/docs/{{version}}/scout)。

> [!NOTE]
> 许多应用根本不需要外部搜索引擎。本页描述的内置技术已覆盖绝大多数用例。

<a name="combining-techniques"></a>
## 组合使用多种技术

本页描述的搜索技术并非互斥——组合使用它们往往能产生最佳效果。下面两个常见模式演示了这些工具如何协同工作。

**全文检索 + 重排序**

使用全文搜索将大型数据集快速缩小为候选集，然后应用重排序按语义相关性对这些候选排序。这样你既能获得数据库原生全文搜索的速度，又能获得 AI 相关性评分的准确性：

```php
$articles = Article::query()
    ->whereFullText('body', $request->input('query'))
    ->limit(50)
    ->get()
    ->rerank('body', $request->input('query'), limit: 10);
```

**向量搜索 + 传统过滤**

将向量相似度与标准 `where` 子句结合，把语义搜索限定在部分记录中。当你希望进行基于含义的搜索，但又需要按归属、类别或任何其他属性限制结果时，这非常有用：

```php
$documents = Document::query()
    ->where('team_id', $user->team_id)
    ->whereVectorSimilarTo('embedding', $request->input('query'))
    ->limit(10)
    ->get();
```
