# 发行说明

## 版本控制方案

Laravel 及其其他第一方扩展包遵循 [语义化版本控制](https://semver.org)。框架的主要版本每年发布一次（约第一季度），而次要版本和补丁版本可能每周发布。次要版本和补丁版本**绝不会**包含破坏性变更。

在从你的应用或扩展包引用 Laravel 框架或其组件时，应始终使用类似 `^13.0` 的版本约束，因为 Laravel 的主要版本确实包含破坏性变更。不过，我们致力于始终确保你可以在一天或更短时间内升级到新的主要版本。

#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments) 不在 Laravel 的向后兼容性指南覆盖范围内。我们可能在必要时重命名函数参数，以改进 Laravel 代码库。因此，在调用 Laravel 方法时使用命名参数应当谨慎，并需理解参数名在未来可能会发生变化。

## 支持策略

对于所有 Laravel 版本，错误修复提供 18 个月，安全修复提供 2 年。对于所有其他库，只有最新的主要版本会获得错误修复。此外，请查阅 Laravel [支持的数据库版本](/topic/Laravel%2013.x/kl9no87vz4.html)。

| 版本 | PHP（*） | 发布日期 | 错误修复截止 | 安全修复截止 |
| ------- |-----------| ------------------- | ------------------- | -------------------- |
| 10      | 8.1 - 8.3 | February 14th, 2023 | August 6th, 2024    | February 4th, 2025   |
| 11      | 8.2 - 8.4 | March 12th, 2024    | September 3rd, 2025 | March 12th, 2026     |
| 12      | 8.2 - 8.5 | February 24th, 2025 | August 13th, 2026   | February 24th, 2027  |
| 13      | 8.3 - 8.5 | March 17th, 2026    | Q3 2027             | March 17th, 2028     |

已停止维护

仅安全修复

（*）支持的 PHP 版本

## Laravel 13

Laravel 13 延续了 Laravel 每年一次的发布节奏，重点关注 AI 原生工作流、更强的默认配置，以及更具表现力的开发者 API。本次发布包含第一方的 AI 原语、JSON:API 资源、语义/向量搜索能力，以及队列、缓存和安全方面的渐进式改进。

### 最小的破坏性变更

我们在本次发布周期中，大量精力都放在最小化破坏性变更上。相反，我们致力于在全年中持续交付不会破坏现有应用的生活质量改进。

因此，Laravel 13 在投入精力上是一个相对较小的升级，同时仍能带来实质性的新能力。有鉴于此，大多数 Laravel 应用可以在不改动太多应用代码的情况下升级到 Laravel 13。

### PHP 8.3

Laravel 13.x 要求 PHP 最低版本为 8.3。

### Laravel AI SDK

Laravel 13 引入了第一方的 [Laravel AI SDK](https://laravel.com/ai)，为文本生成、工具调用智能体、嵌入、音频、图像以及向量存储集成提供了统一的 API。

借助 AI SDK，你可以构建与提供者无关的 AI 功能，同时保持一致、原生的 Laravel 开发者体验。

例如，一个基础的智能体可以通过单次调用进行提示：

```php
use App\Ai\Agents\SalesCoach;

$response = SalesCoach::make()->prompt('Analyze this sales transcript...');

return (string) $response;
```

Laravel AI SDK 还可以生成图像、音频和嵌入：

对于可视化生成场景，SDK 提供了一个简洁的 API，可根据自然语言提示创建图像：

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

而对于语义搜索与检索工作流，你可以直接从字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

### JSON:API 资源

Laravel 现在包含第一方的 [JSON:API 资源](/topic/Laravel%2013.x/2qvpxnz93m.html)，使返回符合 JSON:API 规范的响应变得简单直接。

JSON:API 资源负责资源对象序列化、关联包含、稀疏字段集、链接，以及符合 JSON:API 规范的响应头。

### 请求伪造防护

出于安全考虑，Laravel 的 [请求伪造防护](/topic/Laravel%2013.x/kpv136298w.html) 中间件已增强并正式化为 `PreventRequestForgery`，在保留与基于令牌的 CSRF 防护兼容的同时，增加了基于来源的请求验证。

### 队列路由

Laravel 13 通过 `Queue::route(...)` 添加了[按类的队列路由](/topic/Laravel%2013.x/wevwmkz9l2.html)，让你可以在集中的位置为特定任务定义默认的队列/连接路由规则：

```php
Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
```

### 扩展的 PHP 属性

Laravel 13 持续扩充框架中第一方的 PHP 属性支持，使常见的配置和行为关注点更具声明性，并与你的类和方法放在一起。

值得注意的新增内容包括控制器和授权属性，如 [`#[Middleware]`](/docs/{{version}}/controllers#controller-middleware) 和 [`#[Authorize]`](/docs/{{version}}/controllers#authorization-attributes)，以及面向队列的任务控制，如 [`#[Tries]`](/docs/{{version}}/queues#max-job-attempts-and-timeout)、[`#[Backoff]`](/docs/{{version}}/queues#dealing-with-failed-jobs)、[`#[Timeout]`](/docs/{{version}}/queues#max-job-attempts-and-timeout) 和 [`#[FailOnTimeout]`](/docs/{{version}}/queues#failing-on-timeout)。

例如，控制器中间件和策略检查现在可以直接声明在类和方法上：

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

Eloquent、事件、通知、验证、测试以及资源序列化 API 中也引入了额外的属性，让你在框架更多领域拥有一致的"属性优先"选项。

### 缓存 TTL 延长

Laravel 现在包含 [`Cache::touch(...)`](/topic/Laravel%2013.x/5dve2w3v4x.html)，让你无需获取并重新存储其值即可延长现有缓存项的 TTL。

### 语义 / 向量搜索

Laravel 13 凭借原生的向量查询支持、嵌入工作流，以及在 [search](/topic/Laravel%2013.x/3oyjdqxyp5.html)、[queries](/topic/Laravel%2013.x/xpv525gv86.html) 和 [AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 中记录的 related API，深化了其语义搜索能力。

这些特性让你能够轻松地使用 PostgreSQL + `pgvector` 构建由 AI 驱动的搜索体验，包括针对直接从字符串生成的嵌入进行相似度搜索。

例如，你可以直接从查询构造器运行语义相似度搜索：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```
