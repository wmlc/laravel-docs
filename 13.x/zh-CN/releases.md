# 发行说明

- [版本控制方案](#versioning-scheme)
- [支持策略](#support-policy)
- [Laravel 13](#laravel-13)

<a name="versioning-scheme"></a>
## 版本控制方案

Laravel 及其第一方包遵循[语义化版本控制](https://semver.org)。框架的主要版本每年发布一次（约在第一季度），而次要版本和补丁版本可能每周发布一次。次要版本和补丁版本**绝不**应包含破坏性更改。

从你的应用或包中引用 Laravel 框架或其组件时，应始终使用 `^13.0` 之类的版本约束，因为 Laravel 的主要版本确实包含破坏性更改。不过，我们始终努力确保你可以在一天或更短的时间内升级到新的主要版本。

<a name="named-arguments"></a>
#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)不受 Laravel 向后兼容性指南的约束。为了改进 Laravel 代码库，我们可能选择在必要时重命名函数参数。因此，在调用 Laravel 方法时使用命名参数应谨慎，并理解参数名称将来可能会更改。

<a name="support-policy"></a>
## 支持策略

对于所有 Laravel 版本，错误修复提供 18 个月，安全修复提供 2 年。对于所有其他库，只有最新的主要版本接收错误修复。此外，请查看 [Laravel 支持的数据库版本](/docs/{{version}}/database#introduction)。

| 版本 | PHP (*)   | 发布日期             | 错误修复截止     | 安全修复截止 |
| ------- |-----------| ------------------- | ------------------- | -------------------- |
| 10      | 8.1 - 8.3 | 2023 年 2 月 14 日 | 2024 年 8 月 6 日    | 2025 年 2 月 4 日   |
| 11      | 8.2 - 8.4 | 2024 年 3 月 12 日    | 2025 年 9 月 3 日 | 2026 年 3 月 12 日     |
| 12      | 8.2 - 8.5 | 2025 年 2 月 24 日 | 2026 年 8 月 13 日   | 2027 年 2 月 24 日  |
| 13      | 8.3 - 8.5 | 2026 年 3 月 17 日    | 2027 年 Q3             | 2028 年 3 月 17 日     |

<div class="version-colors">
    <div class="end-of-life">
        <div class="color-box"></div>
        <div>End of life</div>
    </div>
    <div class="security-fixes">
        <div class="color-box"></div>
        <div>Security fixes only</div>
    </div>
</div>

(*) 支持的 PHP 版本

<a name="laravel-13"></a>
## Laravel 13

Laravel 13 延续了 Laravel 的年度发布节奏，专注于 AI 原生工作流、更强的默认值以及更富有表现力的开发者 API。该版本包含第一方 AI 原语、JSON:API 资源、语义 / 向量搜索能力，以及队列、缓存和安全方面的增量改进。

<a name="minimal-breaking-changes"></a>
### 极少的破坏性更改

本发布周期中，我们的很多精力都集中在尽量减少破坏性更改上。相反，我们致力于全年持续推出不会破坏现有应用的体验改进。

因此，Laravel 13 在升级投入方面相对较小，同时仍然带来了大量新能力。正因如此，大多数 Laravel 应用无需更改太多应用代码即可升级到 Laravel 13。

<a name="php-8"></a>
### PHP 8.3

Laravel 13.x 要求最低 PHP 版本为 8.3。

<a name="ai-sdk"></a>
### Laravel AI SDK

Laravel 13 引入了第一方 [Laravel AI SDK](https://laravel.com/ai)，为文本生成、工具调用代理、嵌入、音频、图像和向量存储集成提供了统一的 API。

借助 AI SDK，你可以构建与提供商无关的 AI 功能，同时保持一致的、Laravel 原生的开发者体验。

例如，一个基础代理可以通过一次调用进行提示：

```php
use App\Ai\Agents\SalesCoach;

$response = SalesCoach::make()->prompt('Analyze this sales transcript...');

return (string) $response;
```

Laravel AI SDK 还可以生成图像、音频和嵌入：

对于视觉生成用例，SDK 提供了一套简洁的 API，用于从自然语言提示创建图像：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')->generate();

$rawContent = (string) $image;
```

对于语音体验，你可以从文本合成自然流畅的音频，用于助手、旁白和无障碍功能：

```php
use Laravel\Ai\Audio;

$audio = Audio::of('I love coding with Laravel.')->generate();

$rawContent = (string) $audio;
```

对于语义搜索和检索工作流，你可以直接从字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

<a name="json-api"></a>
### JSON:API 资源

Laravel 现在包含第一方 [JSON:API 资源](/docs/{{version}}/eloquent-resources#jsonapi-resources)，使返回符合 JSON:API 规范的响应变得简单直接。

JSON:API 资源负责资源对象序列化、关联包含、稀疏字段集、链接以及符合 JSON:API 规范的响应头。

<a name="request-forgery-protection"></a>
### 请求伪造防护

出于安全考虑，Laravel 的[请求伪造防护](/docs/{{version}}/csrf#preventing-csrf-requests)中间件已得到增强，并被正式定义为 `PreventRequestForgery`，在保持与基于令牌的 CSRF 防护兼容的同时，增加了感知来源的请求验证。

<a name="queue-routing"></a>
### 队列路由

Laravel 13 通过 `Queue::route(...)` 增加了[按类进行队列路由](/docs/{{version}}/queues#queue-routing)，允许你在一个集中的位置为特定任务定义默认的队列 / 连接路由规则：

```php
Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
```

<a name="php-attributes"></a>
### 扩展的 PHP 属性

Laravel 13 继续在框架范围内扩展第一方 PHP 属性支持，使常见的配置和行为关注点更具声明性，并与你的类和方法位于同一位置。

值得注意的新增包括控制器和授权属性，如 [`#[Middleware]`](/docs/{{version}}/controllers#controller-middleware) 和 [`#[Authorize]`](/docs/{{version}}/controllers#authorization-attributes)，以及面向队列的任务控制，如 [`#[Tries]`](/docs/{{version}}/queues#max-job-attempts-and-timeout)、[`#[Backoff]`](/docs/{{version}}/queues#dealing-with-failed-jobs)、[`#[Timeout]`](/docs/{{version}}/queues#max-job-attempts-and-timeout) 和 [`#[FailOnTimeout]`](/docs/{{version}}/queues#failing-on-timeout)。

例如，控制器中间件和策略检查现在可以直接在类和方法上声明：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
class CommentController
{
    #[Middleware('subscribed')]
    #[Authorize('create', [Comment::class, 'post'])]
    public function store(Post $post)
    {
        // ...
    }
}
```

在 Eloquent、事件、通知、验证、测试和资源序列化 API 中也引入了其他属性，为你在框架的更多领域提供一致的、属性优先的选项。

<a name="cache-touch"></a>
### 缓存 TTL 扩展

Laravel 现在包含 [`Cache::touch(...)`](/docs/{{version}}/cache)，它可以扩展现有缓存项的 TTL，而无需检索并重新存储其值。

<a name="semantic-search"></a>
### 语义 / 向量搜索

Laravel 13 通过原生的向量查询支持、嵌入工作流及相关 API，深化了其语义搜索能力，相关文档分布在[搜索](/docs/{{version}}/search#semantic-vector-search)、[查询](/docs/{{version}}/queries#vector-similarity-clauses)和 [AI SDK](/docs/{{version}}/ai-sdk#embeddings)中。

这些功能使使用 PostgreSQL + `pgvector` 构建 AI 驱动的搜索体验变得简单直接，包括针对直接从字符串生成的嵌入进行相似度搜索。

例如，你可以直接从查询构造器运行语义相似度搜索：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```
