# 搜索

几乎每个应用都需要搜索功能。无论是用户在知识库中搜索相关文章、浏览产品目录，还是针对文档语料库提出自然语言问题，Laravel 都提供了内置工具来处理上述每种场景——而且通常你不需要任何外部服务即可实现。

大多数应用会发现，Laravel 提供的基于数据库的内置方案已经绰绰有余——只有在你需要诸如拼写容错、分面筛选，或超大规模地理搜索等功能时，才需要外部搜索服务。

#### 全文搜索

当你需要关键词相关性排序（即数据库根据结果与搜索词的匹配程度进行评分和排序）时，Laravel 的 `whereFullText` 查询构造器方法会利用 MariaDB、MySQL 和 PostgreSQL 上的原生全文索引。全文搜索能理解词边界和词干提取，因此搜索 "running" 可以匹配包含 "run" 的记录。无需外部服务。

#### 语义化 / 向量搜索

对于通过 *语义*（而非精确关键词）匹配结果的 AI 驱动语义搜索，可以使用 `whereVectorSimilarTo` 查询构造器方法，它使用存储在启用了 `pgvector` 扩展的 PostgreSQL 或 MariaDB 中的向量嵌入。例如，搜索 "best wineries in Napa Valley" 可以呈现一篇标题为 "Top Vineyards to Visit" 的文章——即使两者词语并不重叠。向量搜索需要启用了 `pgvector` 扩展的 PostgreSQL 或 MariaDB 11.7 及更高版本，以及 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html)。

#### 重排序

Laravel 的 [AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 提供重排序（reranking）能力，它使用 AI 模型按与查询的语义相关性对任意结果集重新排序。重排序作为快速初始检索步骤（如全文搜索）之后的第二阶段时尤其强大——让你同时获得速度与语义准确性。

#### Laravel Scout 搜索

对于希望使用 `Searchable` Trait、让搜索索引随 Eloquent 模型自动保持同步的应用，[Laravel Scout](/topic/Laravel%2013.x/2wy3l13ykm.html) 提供了内置的数据库引擎，以及针对 Algolia、Meilisearch、Typesense 和 Turbopuffer 等第三方服务的驱动。

## 全文搜索

虽然 `LIKE` 查询适用于简单的子串匹配，但它们不理解语言。"running" 的 `LIKE` 搜索找不到包含 "run" 的记录，而且结果也不会按相关性排序——它们只是按数据库找到的顺序原样返回。全文搜索通过使用能够理解词边界、词干提取和相关性评分的专门索引，同时解决了这两个问题，让数据库能够先返回最相关的结果。

MariaDB、MySQL 和 PostgreSQL 都内置了快速全文搜索功能——无需外部搜索服务。你只需在想要搜索的列上添加全文索引，然后使用 `whereFullText` 查询构造器方法进行搜索即可。

> [!WARNING]
> 全文搜索目前由 MariaDB、MySQL 和 PostgreSQL 支持。

### 添加全文索引

要使用全文搜索，首先需要在想要搜索的列上添加全文索引。你可以将该索引添加到单个列，或传入一个列数组来创建跨多个字段同时搜索的复合索引：

```php
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();

    $table->fullText(['title', 'body']);
});
```

在 PostgreSQL 上，你可以为索引指定语言配置，它控制词的词干提取方式：

```php
$table->fullText('body')->language('english');
```

关于创建索引的更多信息，请参阅 [数据库迁移文档](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

### 运行全文查询

索引就绪后，使用 `whereFullText` 查询构造器方法对其进行搜索。Laravel 会为你的数据库驱动生成相应的 SQL——例如，在 MariaDB 和 MySQL 上是 `MATCH(...) AGAINST(...)`，在 PostgreSQL 上是 `to_tsvector(...) @@ plainto_tsquery(...)`：

```php
$articles = Article::whereFullText('body', 'web developer')->get();
```

使用 MariaDB 和 MySQL 时，结果会自动按相关性评分排序。在 PostgreSQL 上，`whereFullText` 会筛选匹配的记录但不会按相关性排序——如果你在 PostgreSQL 上需要自动相关性排序，可以考虑使用 Scout 的数据库引擎，它会为你处理这一点。

如果你创建了跨多个列的复合全文索引，可以通过将相同的列数组传给 `whereFullText` 来对它们全部进行搜索：

```php
$articles = Article::whereFullText(
    ['title', 'body'], 'web developer'
)->get();
```

`orWhereFullText` 方法可用于添加一个作为 "or" 条件的全文搜索子句。完整细节请参阅 [查询构造器文档](/topic/Laravel%2013.x/xpv525gv86.html)。

## 语义化 / 向量搜索

全文搜索依赖关键词匹配——查询中的词必须以某种形式出现在数据中。语义搜索则采用了根本不同的方法：它使用 AI 生成的向量嵌入，将文本的 *含义* 表示为数字数组，然后找到含义与查询最相似的结果。例如，搜索 "best wineries in Napa Valley" 可以呈现一篇标题为 "Top Vineyards to Visit" 的文章——即使两者词语完全不重叠。

向量搜索的基本工作流是：为每段内容生成一个嵌入（一个数值数组）并与你的数据一起存储；然后在搜索时，为用户的查询生成一个嵌入，并在向量空间中找到与之最接近的已存储嵌入。

> [!NOTE]
> 向量搜索需要 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html)，并受 PostgreSQL（需要 `pgvector` 扩展）、MariaDB 11.7 及更高版本，以及 MongoDB（需要 [Laravel MongoDB 包](https://laravel.com/docs/13.x/mongodb)）支持。 [Laravel Cloud](https://laravel.com/cloud) 上的所有 Postgres 数据库都已安装 `pgvector`。

### 生成嵌入向量

嵌入（embedding）是一个高维数值数组（通常为数百或数千个数字），它表示一段文本的语义含义。你可以使用 Laravel `Stringable` 类上提供的 `toEmbeddings` 方法，为字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embedding = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

要为多个输入一次性生成嵌入——这比逐个生成更高效，因为它只需向嵌入提供者发起一次 API 调用——可以使用 `Embeddings` 类：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    'Napa Valley has great wine.',
    'Laravel is a PHP framework.',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

关于配置嵌入提供者、自定义维度以及缓存的更多细节，请参阅 [AI SDK 文档](/topic/Laravel%2013.x/ndvm3dj93j.html)。

### 存储与索引向量

要存储向量嵌入，请在数据库迁移中定义一个 `vector` 列，指定与你的嵌入提供者输出相匹配的维度数量（例如，OpenAI 的 `text-embedding-3-small` 模型为 1536）。你还应该在该列上调用 `index` 来创建一个 HNSW（Hierarchical Navigable Small World，分层可导航小世界）索引，它能在大型数据集上大幅加快相似性搜索速度：

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

`Schema::ensureVectorExtensionExists` 方法确保你的 PostgreSQL 数据库在创建表之前已启用 `pgvector` 扩展。

在你的 Eloquent 模型上，使用 `AsVector` 类型转换（Cast），让 Laravel 自动处理 PHP 数组与数据库向量格式之间的转换：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

关于向量列和索引的更多细节，请参阅 [数据库迁移文档](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

### 按相似度查询

一旦为你的内容存储了嵌入，就可以使用 `whereVectorSimilarTo` 方法搜索相似记录。该方法使用余弦相似度将给定嵌入与已存储向量进行比较，过滤掉低于 `minSimilarity` 阈值的结果，并自动按相关性排序——最相似的记录排在前面。阈值应为 `0.0` 到 `1.0` 之间的一个值，其中 `1.0` 表示向量完全相同：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

作为便利，当传入的是普通字符串而非嵌入数组时，Laravel 会使用你配置的嵌入提供者自动为你生成嵌入。这意味着你可以直接传入用户的搜索查询，而无需先手动将其转换为嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

要对向量查询进行更低层次的控制，还可以使用 `whereVectorDistanceLessThan`、`selectVectorDistance` 和 `orderByVectorDistance` 方法。这些方法让你可以直接处理距离值而非相似度评分，将计算出的距离作为结果中的一列进行选择，或手动控制排序。完整细节请参阅 [查询构造器文档](/topic/Laravel%2013.x/xpv525gv86.html) 和 [AI SDK 文档](/topic/Laravel%2013.x/ndvm3dj93j.html)。

## 对结果重排序

重排序（reranking）是一种由 AI 模型根据每个结果与给定查询的语义相关性进行重新排序的技术。与向量搜索不同，向量搜索要求你预先计算并存储嵌入，而重排序可以作用于任意文本集合——它以原始内容和查询作为输入，返回按相关性排序的项。

重排序作为快速初始检索步骤之后的第二阶段时尤其强大。例如，你可以使用全文搜索快速将数千条记录缩小到前 50 个候选，然后使用重排序将最相关的结果排到最前面。这种"先检索再重排序"的模式让你同时获得速度与语义准确性。

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

Laravel 集合（collection）还有一个 `rerank` 宏，它接受字段名（或闭包）和查询，方便对 Eloquent 结果进行重排序：

```php
$articles = Article::all()
    ->rerank('body', 'Laravel tutorials');
```

关于配置重排序提供者及可用选项的完整细节，请参阅 [AI SDK 文档](/topic/Laravel%2013.x/ndvm3dj93j.html)。

## Laravel Scout

上述搜索技术都是你在代码中直接调用的查询构造器方法。 [Laravel Scout](/topic/Laravel%2013.x/2wy3l13ykm.html) 则采用了不同的方式：它提供了一个 `Searchable` Trait，你可以将其添加到 Eloquent 模型上，Scout 会在记录被创建、更新和删除时自动保持搜索索引同步。当你希望模型始终可搜索、而无需手动管理索引更新时，这尤其方便。

### 数据库引擎

Scout 内置的数据库引擎针对你现有的数据库执行全文和 `LIKE` 搜索——无需外部服务或额外基础设施。只需将 `Searchable` Trait 添加到模型，并定义一个返回你想要可搜索列的 `toSearchableArray` 方法即可。

你可以使用 PHP 属性来控制每个列的搜索策略。`SearchUsingFullText` 会使用数据库的全文索引，`SearchUsingPrefix` 只会从字符串开头匹配（`example%`），而任何没有属性的列则使用默认的两侧通配符 `LIKE` 策略（`%example%`）：

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
> 在指定某列应使用全文查询约束之前，请确保该列已分配了 [全文索引](/topic/Laravel%2013.x/x3vo0g4vm1.html)。

添加该 Trait 后，你可以使用 Scout 的 `search` 方法搜索模型。Scout 的数据库引擎会自动按相关性排序结果，即使在 PostgreSQL 上也不例外：

```php
$articles = Article::search('Laravel')->get();
```

当你的搜索需求适中，且希望获得 Scout 自动索引同步的便利、又不想部署外部服务时，数据库引擎是一个很好的选择。它能很好地处理最常见的搜索用例，包括筛选、分页和软删除记录处理。完整细节请参阅 [Scout 文档](/topic/Laravel%2013.x/2wy3l13ykm.html)。

### 第三方引擎

Scout 还支持第三方搜索引擎，如 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org)。这些专用搜索服务提供高级功能，如拼写容错、分面筛选、地理搜索和自定义排序规则——在超大规模或需要高度打磨的"边输入边搜索"体验时，这些功能变得很重要。

由于 Scout 在其所有驱动上提供统一的 API，日后从数据库引擎切换到第三方引擎只需极少的代码改动。你可以从数据库引擎起步，只有当应用的需求超出数据库所能提供的范围时，再迁移到第三方服务。

关于配置第三方引擎的完整细节，请参阅 [Scout 文档](/topic/Laravel%2013.x/2wy3l13ykm.html)。

> [!NOTE]
> 许多应用永远不需要外部搜索引擎。本页描述的这些内置技术已覆盖了绝大多数用例。

## 组合使用多种方式

本页描述的搜索技术并非互斥——将它们组合使用往往能产生最佳结果。以下是两个常见模式，展示了这些工具如何协同工作。

**Full-Text Retrieval + Reranking（全文检索 + 重排序）**

使用全文搜索快速将大型数据集缩小到一个候选集，然后应用重排序按语义相关性对这些候选排序。这让你同时获得数据库原生全文搜索的速度与 AI 驱动相关性评分的准确性：

```php
$articles = Article::query()
    ->whereFullText('body', $request->input('query'))
    ->limit(50)
    ->get()
    ->rerank('body', $request->input('query'), limit: 10);
```

**Vector Search + Traditional Filters（向量搜索 + 传统筛选）**

将向量相似性与标准 `where` 子句结合，把语义搜索限定到记录的子集。当你需要基于语义的搜索、但又需要按归属、分类或任何其他属性限制结果时，这会很有用：

```php
$documents = Document::query()
    ->where('team_id', $user->team_id)
    ->whereVectorSimilarTo('embedding', $request->input('query'))
    ->limit(10)
    ->get();
```