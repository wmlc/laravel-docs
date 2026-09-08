# 队列

- [简介](#introduction)
    - [连接与队列](#connections-vs-queues)
    - [驱动说明与前置条件](#driver-prerequisites)
- [创建任务](#creating-jobs)
    - [生成任务类](#generating-job-classes)
    - [类结构](#class-structure)
    - [唯一任务](#unique-jobs)
    - [防抖任务](#debounced-jobs)
    - [加密任务](#encrypted-jobs)
- [任务中间件](#job-middleware)
    - [速率限制](#rate-limiting)
    - [防止任务重叠](#preventing-job-overlaps)
    - [异常节流](#throttling-exceptions)
    - [释放任务](#releasing-jobs)
    - [跳过任务](#skipping-jobs)
- [分发任务](#dispatching-jobs)
    - [延迟分发](#delayed-dispatching)
    - [同步分发](#synchronous-dispatching)
    - [批量分发](#bulk-dispatching)
    - [分发前准备任务](#preparing-jobs-before-dispatch)
    - [任务与数据库事务](#jobs-and-database-transactions)
    - [任务链](#job-chaining)
    - [自定义队列与连接](#customizing-the-queue-and-connection)
    - [指定任务最大尝试次数 / 超时值](#max-job-attempts-and-timeout)
    - [SQS FIFO 与公平队列](#sqs-fifo-and-fair-queues)
    - [队列故障转移](#queue-failover)
    - [错误处理](#error-handling)
- [任务批处理](#job-batching)
    - [定义可批处理任务](#defining-batchable-jobs)
    - [分发批处理](#dispatching-batches)
    - [任务链与批处理](#chains-and-batches)
    - [向批处理添加任务](#adding-jobs-to-batches)
    - [检查批处理](#inspecting-batches)
    - [取消批处理](#cancelling-batches)
    - [批处理失败](#batch-failures)
    - [清理批处理](#pruning-batches)
    - [在 DynamoDB 中存储批处理](#storing-batches-in-dynamodb)
- [将闭包加入队列](#queueing-closures)
- [运行队列处理器](#running-the-queue-worker)
    - [`queue:work` 命令](#the-queue-work-command)
    - [队列优先级](#queue-priorities)
    - [队列处理器与部署](#queue-workers-and-deployment)
    - [响应处理器信号](#reacting-to-worker-signals)
    - [任务过期与超时](#job-expirations-and-timeouts)
    - [暂停与恢复队列处理器](#pausing-and-resuming-queue-workers)
- [Supervisor 配置](#supervisor-configuration)
- [处理失败的任务](#dealing-with-failed-jobs)
    - [失败后清理](#cleaning-up-after-failed-jobs)
    - [重试失败的任务](#retrying-failed-jobs)
    - [忽略缺失的模型](#ignoring-missing-models)
    - [清理失败的任务](#pruning-failed-jobs)
    - [在 DynamoDB 中存储失败的任务](#storing-failed-jobs-in-dynamodb)
    - [禁用失败任务存储](#disabling-failed-job-storage)
    - [失败任务事件](#failed-job-events)
- [从队列清除任务](#clearing-jobs-from-queues)
- [监控你的队列](#monitoring-your-queues)
- [测试](#testing)
    - [伪造部分任务](#faking-a-subset-of-jobs)
    - [测试任务链](#testing-job-chains)
    - [测试任务批处理](#testing-job-batches)
    - [测试任务 / 队列交互](#testing-job-queue-interactions)
- [任务事件](#job-events)

<a name="introduction"></a>
## 简介

在构建 Web 应用时，你可能会遇到一些耗时较长的任务，例如解析并存储上传的 CSV 文件，这类任务不适合在一次常规 Web 请求中执行。幸运的是，Laravel 允许你轻松创建可加入队列的任务（job），这些任务可以在后台处理。通过将耗时任务转移到队列，你的应用能够以极快的速度响应 Web 请求，并为客户提供更佳的用户体验。

Laravel 队列为多种不同的队列后端提供了统一的队列 API，例如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io)，甚至是关系型数据库。

Laravel 的队列配置选项存储在应用的 `config/queue.php` 配置文件中。在这个文件里，你会找到框架内置的各个队列驱动的（connection）连接配置，包括 `database`、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及一个会立即（用于开发或测试期间）执行任务（job）的同步（synchronous）驱动。此外还包含了一个 `null` 队列驱动，它会丢弃所有入队的任务。

> [!NOTE]
> Laravel Horizon 是一个为基于 Redis 的队列打造的精美仪表盘与配置系统。欲了解更多信息，请查阅完整的 [Horizon 文档](/docs/{{version}}/horizon)。

<a name="connections-vs-queues"></a>
### 连接与队列

在开始使用 Laravel 队列之前，理解「连接（connection）」与「队列（queue）」之间的区别非常重要。在 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。该选项定义了与后端队列服务的连接，例如 Amazon SQS、Beanstalk 或 Redis。然而，任何一个给定的队列连接都可能包含多个「队列」，可以将这些队列视为不同的栈或任务堆。

请注意，`queue` 配置文件中每个连接配置示例都包含一个 `queue` 属性。这是当任务被发送到给定连接时，默认会被分发到的队列。换句话说，如果你在分发任务时没有显式定义它应该分发到哪个队列，该任务会被放入连接配置中 `queue` 属性所定义的队列：

```php
use App\Jobs\ProcessPodcast;

// 此任务被发送到默认连接的默认队列……
ProcessPodcast::dispatch();

// 此任务被发送到默认连接的 "emails" 队列……
ProcessPodcast::dispatch()->onQueue('emails');
```

某些应用可能永远不需要将任务推送到多个队列，而是偏好使用一个简单队列。然而，将任务推送到多个队列对于那些希望按优先级或分段方式处理任务的应用尤其有用，因为 Laravel 队列处理器允许你按优先级指定它应该处理哪些队列。例如，如果你将任务推送到一个 `high` 队列，你可以运行一个对该队列赋予更高处理优先级的处理器：

```shell
php artisan queue:work --queue=high,default
```

<a name="driver-prerequisites"></a>
### 驱动说明与前置条件

<a name="database"></a>
#### 数据库

为了使用 `database` 队列驱动，你需要一张数据库表来存放任务。通常，这张表已包含在 Laravel 默认的 `0001_01_01_000002_create_jobs_table.php` [数据库迁移](/docs/{{version}}/migrations) 中；不过，如果你的应用中没有包含该迁移，你可以使用 `make:queue-table` Artisan 命令来创建它：

```shell
php artisan make:queue-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

为了使用 `redis` 队列驱动，你需要在 `config/database.php` 配置文件中配置一个 Redis 数据库连接。

> [!WARNING]
> `redis` 队列驱动不支持 `serializer` 和 `compression` 这两个 Redis 选项。

<a name="redis-cluster"></a>
##### Redis 集群

如果你的 Redis 队列连接使用了 [Redis 集群（Redis Cluster）](https://redis.io/docs/latest/operate/rs/databases/durability-ha/clustering)，那么你的队列名称必须包含 [键哈希标签（key hash tag）](https://redis.io/docs/latest/develop/using-commands/keyspace/#hashtags)。这是必需的，以确保给定队列的所有 Redis 键都被放入同一个哈希槽：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
    'queue' => env('REDIS_QUEUE', '{default}'),
    'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
    'block_for' => null,
    'after_commit' => false,
],
```

<a name="blocking"></a>
##### 阻塞

使用 Redis 队列时，你可以使用 `block_for` 配置选项来指定在遍历处理器循环并重新轮询 Redis 数据库之前，驱动应当等待任务变为可用状态多长时间。

根据你的队列负载调整该值，比持续轮询 Redis 数据库以获取新任务更高效。例如，你可以将值设为 `5`，表示驱动在等待任务变为可用时应阻塞五秒：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
    'queue' => env('REDIS_QUEUE', 'default'),
    'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
    'block_for' => 5,
    'after_commit' => false,
],
```

> [!WARNING]
> 将 `block_for` 设为 `0` 会导致队列处理器无限期阻塞，直到有任务可用为止。这还会阻止 `SIGTERM` 等信号在下一个任务处理完成之前被处理。

<a name="sqs-overflow-storage"></a>
#### SQS 溢出存储

Amazon SQS 限制了队列消息载荷的最大尺寸。如果你需要分发载荷可能超出此限制的的任务，你可以配置 Laravel 将超大的 SQS 载荷存储到缓存存储中，并通过 SQS 发送一个指针。要启用此功能，请在你的 SQS 队列连接配置中添加一个 `overflow` 数组：

```php
'sqs' => [
    'driver' => 'sqs',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'prefix' => env('SQS_PREFIX', 'https://sqs.us-east-1.amazonaws.com/your-account-id'),
    'queue' => env('SQS_QUEUE', 'default'),
    'suffix' => env('SQS_SUFFIX'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'after_commit' => false,
    'overflow' => [
        'enabled' => env('SQS_OVERFLOW_ENABLED', false),
        'store' => env('SQS_OVERFLOW_STORE'),
        'always' => false,
        'delete_after_processing' => true,
        'flush_on_clear' => env('SQS_OVERFLOW_FLUSH_ON_CLEAR', false),
    ],
],
```

启用溢出存储后，Laravel 会将至少 1 MB 的载荷存储到配置的缓存存储中。如果 `always` 选项为 `true`，则无论大小如何，每个 SQS 载荷都会被存储到缓存存储中。由于入队的任务在处理时需要从缓存存储中检索其载荷，因此你应该选择一个能够在任务被处理器处理完之前保留这些载荷的存储。默认情况下，已成功处理并从 SQS 中删除的任务，其存储的载荷也会随之删除。

如果 `flush_on_clear` 选项为 `true`，那么当 `queue:clear` 命令清空 SQS 队列时，配置的溢出缓存存储也会被清空。由于清空缓存存储可能会移除该存储中的所有条目，因此在启用此选项时，你应该将 SQS 溢出存储配置为使用专用的缓存存储。

<a name="other-driver-prerequisites"></a>
#### 其他驱动前置条件

下列队列驱动需要以下依赖。这些依赖可以通过 Composer 包管理器安装：

<div class="content-list" markdown="1">

- Amazon SQS：`aws/aws-sdk-php ~3.0`
- Beanstalkd：`pda/pheanstalk ~5.0`
- Redis：`predis/predis ~3.0` 或 phpredis PHP 扩展
- [MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)：`mongodb/laravel-mongodb`

</div>

<a name="creating-jobs"></a>
## 创建任务

<a name="generating-job-classes"></a>
### 生成任务类

默认情况下，应用中的所有可入队任务都存放在 `app/Jobs` 目录中。如果 `app/Jobs` 目录不存在，它会在你运行 `make:job` Artisan 命令时自动创建：

```shell
php artisan make:job ProcessPodcast
```

生成的类会实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，向 Laravel 表明该任务应当被推送到队列中以异步方式运行。

> [!NOTE]
> 任务存根（stub）可以通过 [存根发布](/docs/{{version}}/artisan#stub-customization) 进行自定义。

<a name="class-structure"></a>
### 类结构

任务类非常简单，通常只包含一个 `handle` 方法，该方法在任务被队列处理时调用。让我们先看一个示例任务类。在这个示例中，我们假设自己运营一个播客发布服务，需要在播客文件发布前对其进行处理：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public Podcast $podcast,
    ) {}

    /**
     * 执行任务。
     */
    public function handle(AudioProcessor $processor): void
    {
        // 处理上传的播客……
    }
}
```

在这个示例中，请注意我们能够将一个 [Eloquent 模型](/docs/{{version}}/eloquent) 直接传入可入队任务的构造函数。由于该任务使用了 `Queueable` trait，当任务处理时，Eloquent 模型及其已加载的关联会被优雅地序列化与反序列化。

如果你的可入队任务在构造函数中接收了一个 Eloquent 模型，那么只有该模型的标识符会被序列化到队列中。当任务真正被处理时，队列系统会自动从数据库中重新检索完整的模型实例及其已加载的关联。这种模型序列化方式允许向队列驱动发送更小的任务载荷。

<a name="handle-method-dependency-injection"></a>
#### `handle` 方法依赖注入

`handle` 方法在任务被队列处理时被调用。请注意，我们能够在任务的 `handle` 方法上进行类型提示（type-hint）依赖。Laravel [服务容器](/docs/{{version}}/container) 会自动注入这些依赖。

如果你想完全控制容器如何向 `handle` 方法注入依赖，可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接受一个回调，该回调会接收任务和容器。在回调内部，你可以按照自己的意愿调用 `handle` 方法。通常，你应该在 `App\Providers\AppServiceProvider` [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中调用此方法：

```php
use App\Jobs\ProcessPodcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Foundation\Application;

$this->app->bindMethod([ProcessPodcast::class, 'handle'], function (ProcessPodcast $job, Application $app) {
    return $job->handle($app->make(AudioProcessor::class));
});
```

> [!WARNING]
> 二进制数据（例如原始图像内容）在传入可入队任务之前，应当先通过 `base64_encode` 函数处理。否则，任务在被放入队列时可能无法正确序列化为 JSON。

<a name="handling-relationships"></a>
#### 队列中的关联

由于所有已加载的 Eloquent 模型关联在任务入队时也会被序列化，序列化后的任务字符串有时可能会变得相当大。此外，当任务被反序列化、模型关联从数据库中重新检索时，它们会被完整地取回。在任务入队过程中模型被序列化之前所应用的任何先前关联约束，在任务反序列化时都不会被应用。因此，如果你希望操作某个关联的一个子集，你应该在可入队任务内部重新对该关联施加约束。

或者，为了防止关联被序列化，你可以在设置属性值时对模型调用 `withoutRelations` 方法。该方法会返回一个不包含其已加载关联的模型实例：

```php
/**
 * 创建一个新的任务实例。
 */
public function __construct(
    Podcast $podcast,
) {
    $this->podcast = $podcast->withoutRelations();
}
```

如果你只需要在保留其余关联的同时移除特定的关联，可以使用 `withoutRelation` 方法：

```php
$this->podcast = $podcast->withoutRelation('comments');
```

如果你正在使用 [PHP 构造函数属性提升](https://www.php.net/manual/en/language.oop5.decon.php#language.oop5.decon.constructor.promotion)，并希望指明某个 Eloquent 模型不应将其关联序列化，可以使用 `WithoutRelations` 属性：

```php
use Illuminate\Queue\Attributes\WithoutRelations;

/**
 * 创建一个新的任务实例。
 */
public function __construct(
    #[WithoutRelations]
    public Podcast $podcast,
) {}
```

为了方便，如果你希望将所有模型不带关联地序列化，可以将 `WithoutRelations` 属性应用到整个类，而不是对每个模型单独应用该属性：

```php
<?php

namespace App\Jobs;

use App\Models\DistributionPlatform;
use App\Models\Podcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\WithoutRelations;

#[WithoutRelations]
class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public Podcast $podcast,
        public DistributionPlatform $platform,
    ) {}
}
```

如果某个任务接收的是一个 Eloquent 模型的集合或数组，而非单个模型，那么该集合中的模型在任务被反序列化并执行时，其关联不会被恢复。这样做是为了防止处理大量模型时任务产生过度的资源消耗。

<a name="unique-jobs"></a>
### 唯一任务

> [!WARNING]
> 唯一任务需要一个支持 [锁（lock）](/docs/{{version}}/cache#atomic-locks) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

> [!WARNING]
> 唯一任务约束不适用于批处理中的任务。

有时，你可能希望确保任意时刻队列中只存在某个特定任务的一个实例。你可以通过在任务类上实现 `ShouldBeUnique` 接口来做到这一点。该接口不需要你在类上定义任何额外的方法：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ……
}
```

在上面的示例中，`UpdateSearchIndex` 任务是唯一的。因此，如果同一个任务的另一个实例已经在队列中且尚未处理完成，该任务将不会被分发。

在某些情况下，你可能希望定义一个使任务唯一的特定「键」，或者你可能希望指定一个超时时间，超过该时间后任务不再保持唯一。为此，你可以使用 `UniqueFor` 属性，并在任务类上定义一个 `uniqueId` 方法：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Queue\Attributes\UniqueFor;

#[UniqueFor(3600)]
class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    /**
     * 产品实例。
     *
     * @var \App\Models\Product
     */
    public $product;

    /**
     * 获取任务的唯一 ID。
     */
    public function uniqueId(): string
    {
        return $this->product->id;
    }
}
```

在上面的示例中，`UpdateSearchIndex` 任务通过一个产品 ID 保持唯一。因此，任何使用相同产品 ID 的新分发，在现有任务处理完成之前都会被忽略。此外，如果现有任务在一小时内未被处理，唯一锁将被释放，另一个具有相同唯一键的任务便可以被分发到队列中。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器分发任务，你应该确保所有的服务器都连接到同一个中心缓存服务器，这样 Laravel 才能准确判断某个任务是否唯一。

<a name="keeping-jobs-unique-until-processing-begins"></a>
#### 让任务保持唯一直至开始处理

默认情况下，唯一任务会在任务处理完成或所有重试尝试均失败后「解锁」。然而，在某些情况下，你可能希望任务在开始处理之前就立即解锁。为此，你的任务应该实现 `ShouldBeUniqueUntilProcessing` 契约，而不是 `ShouldBeUnique` 契约：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ……
}
```

<a name="unique-job-locks"></a>
#### 唯一任务锁

在底层，当一个 `ShouldBeUnique` 任务被分发时，Laravel 会尝试使用 `uniqueId` 键获取一个 [锁](/docs/{{version}}/cache#atomic-locks)。如果该锁已被持有，则任务不会被分发。当任务处理完成或所有重试尝试均失败后，该锁会被释放。默认情况下，Laravel 会使用默认缓存驱动来获取这个锁。不过，如果你希望使用另一个驱动来获取锁，可以定义一个 `uniqueVia` 方法，返回应当使用的缓存驱动：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ……

    /**
     * 获取用于唯一任务锁的缓存驱动。
     */
    public function uniqueVia(): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只需要限制任务的并发处理，请改用 [WithoutOverlapping](/docs/{{version}}/queues#preventing-job-overlaps) 任务中间件。

<a name="debounced-jobs"></a>
### 防抖任务

有时，你可能希望确保在短时间内同一任务被分发多次时，只有最后一次分发真正执行。你可以通过在任务上添加 `DebounceFor` 属性来做到这一点：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\DebounceFor;

#[DebounceFor(30)]
class UpdateSearchIndex implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(public int $productId)
    {
    }

    /**
     * 获取任务的防抖 ID。
     */
    public function debounceId(): string
    {
        return (string) $this->productId;
    }
}
```

在上面的示例中，在 `30` 秒内针对同一产品反复分发 `UpdateSearchIndex` 会进行防抖，从而只有最后一次分发会运行。

如果你希望限制一个被频繁重新分发的任务可以被推迟的最长时间，可以向 `DebounceFor` 属性提供 `maxWait` 参数：

```php
#[DebounceFor(30, maxWait: 120)]
class UpdateSearchIndex implements ShouldQueue
{
    use Queueable;

    // ……
}
```

你可以通过在任务上定义 `debounceVia` 方法来自定义用于防抖追踪的缓存存储：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

public function debounceVia(): Repository
{
    return Cache::driver('redis');
}
```

如果一个防抖任务被一个更新的分发所取代，Laravel 会分发 `Illuminate\Queue\Events\JobDebounced` 事件，并将被取代的任务从队列中移除。

> [!WARNING]
> 防抖任务与唯一任务是互斥的。使用了 `DebounceFor` 属性的任务不应再实现 `ShouldBeUnique`。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器分发防抖任务，你应该确保所有的服务器都连接到同一个中心缓存服务器。

<a name="encrypted-jobs"></a>
### 加密任务

Laravel 允许你通过 [加密](/docs/{{version}}/encryption) 来确保任务数据的隐私与完整性。要开始使用，只需将 `ShouldBeEncrypted` 接口添加到任务类即可。一旦将该接口添加到类上，Laravel 会在将任务推送到队列之前自动对其加密：

```php
<?php

use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateSearchIndex implements ShouldQueue, ShouldBeEncrypted
{
    // ……
}
```

<a name="job-middleware"></a>
## 任务中间件

任务中间件允许你在可入队任务的执行周围包裹自定义逻辑，从而减少任务本身中的样板代码。例如，考虑下面这个 `handle` 方法，它利用 Laravel 的 Redis 速率限制特性，允许每五秒只处理一个任务：

```php
use Illuminate\Support\Facades\Redis;

/**
 * 执行任务。
 */
public function handle(): void
{
    Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
        info('已获取锁……');

        // 处理任务……
    }, function () {
        // 无法获取锁……

        return $this->release(5);
    });
}
```

虽然这段代码是有效的，但 `handle` 方法的实现变得嘈杂，因为它被 Redis 速率限制逻辑所充斥。此外，对于任何我们想要进行速率限制的其他任务，都必须重复这段速率限制逻辑。与其在 handle 方法中进行速率限制，我们可以定义一个处理速率限制的任务中间件：

```php
<?php

namespace App\Jobs\Middleware;

use Closure;
use Illuminate\Support\Facades\Redis;

class RateLimited
{
    /**
     * 处理可入队的任务。
     *
     * @param  \Closure(object): void  $next
     */
    public function handle(object $job, Closure $next): void
    {
        Redis::throttle('key')
            ->block(0)->allow(1)->every(5)
            ->then(function () use ($job, $next) {
                // 已获取锁……

                $next($job);
            }, function () use ($job) {
                // 无法获取锁……

                $job->release(5);
            });
    }
}
```

正如你所看到的，与 [路由中间件](/docs/{{version}}/middleware) 一样，任务中间件会接收正在被处理的任务，以及一个应当被调用以继续处理任务的回调。

你可以使用 `make:job-middleware` Artisan 命令生成一个新的任务中间件类。创建任务中间件后，可以通过在任务的 `middleware` 方法（method）中返回它们来将其附加到任务上。该方法在由 `make:job` Artisan 命令生成的任务中并不存在，因此你需要手动将其添加到你的任务类中：

```php
use App\Jobs\Middleware\RateLimited;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited];
}
```

> [!NOTE]
> 任务中间件也可以分配给 [可入队的事件监听器](/docs/{{version}}/events#queued-event-listeners)、[可邮寄类](/docs/{{version}}/mail#queueing-mail) 和 [通知](/docs/{{version}}/notifications#queueing-notifications)。

<a name="rate-limiting"></a>
### 速率限制

虽然我们刚刚演示了如何编写自己的速率限制任务中间件，但 Laravel 实际上包含了一个速率限制中间件，你可以利用它来对任务进行速率限制。与 [路由速率限制器](/docs/{{version}}/routing#defining-rate-limiters) 一样，任务速率限制器是使用 `RateLimiter` facade 的 `for` 方法来定义的。

例如，你可能希望允许用户每小时备份一次数据，同时对高级客户不施加此类限制。为此，你可以在 `AppServiceProvider` 的 `boot` 方法中定义一个 `RateLimiter`：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    RateLimiter::for('backups', function (object $job) {
        return $job->user->vipCustomer()
            ? Limit::none()
            : Limit::perHour(1)->by($job->user->id);
    });
}
```

在上面的示例中，我们定义了一个每小时的速率限制；不过，你也可以使用 `perMinute` 方法轻松定义基于分钟的速率限制。此外，你可以将任意值传递给速率限制的 `by` 方法；不过，这个值最常用于按客户对速率限制进行分段：

```php
return Limit::perMinute(50)->by($job->user->id);
```

一旦你定义了速率限制，就可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件将该速率限制器附加到你的任务上。每当任务超出速率限制时，该中间件都会基于速率限制的持续时间，以适当的延迟将任务释放回队列：

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited('backups')];
}
```

将受到速率限制的任务释放回队列，仍然会递增该任务的总 `attempts` 次数。你可能需要相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。或者，你可能希望使用 [retryUntil 方法](#time-based-attempts) 来定义任务不应再被尝试的时间长度。

使用 `releaseAfter` 方法，你还可以指定在释放的任务被再次尝试之前必须经过的秒数：

```php
/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new RateLimited('backups'))->releaseAfter(60)];
}
```

如果你不希望任务在受到速率限制时被重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new RateLimited('backups'))->dontRelease()];
}
```

<a name="rate-limiting-with-redis"></a>
#### 使用 Redis 进行速率限制

如果你使用的是 Redis，可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它针对 Redis 进行了微调，比基础速率限制中间件更高效：

```php
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

public function middleware(): array
{
    return [new RateLimitedWithRedis('backups')];
}
```

可以使用 `connection` 方法来指定该中间件应当使用哪个 Redis 连接：

```php
return [(new RateLimitedWithRedis('backups'))->connection('limiter')];
```

<a name="preventing-job-overlaps"></a>
### 防止任务重叠

Laravel 内置了一个 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，允许你基于任意键来防止任务重叠。当一个可入队任务正在修改某个应当一次只被一个任务修改的资源时，这会很有帮助。

例如，假设我们有一个可入队任务用于更新用户的信用评分，并且你希望防止针对同一用户 ID 的信用评分更新任务发生重叠。为此，你可以从任务的 `middleware` 方法中返回 `WithoutOverlapping` 中间件：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new WithoutOverlapping($this->user->id)];
}
```

将发生重叠的任务释放回队列，仍然会递增该任务的总尝试次数。你可能需要相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。例如，将 `Tries` 保留为默认的 1，会阻止任何发生重叠的任务在稍后被重试。

任何同一类型的重叠任务都会被释放回队列。你还可以指定在释放的任务被再次尝试之前必须经过的秒数：

```php
/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->releaseAfter(60)];
}
```

如果你希望立即删除任何发生重叠的任务，使它们不会被重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->dontRelease()];
}
```

`WithoutOverlapping` 中间件由 Laravel 的原子锁特性驱动。有时，你的任务可能会以某种方式意外失败或超时，导致锁未被释放。因此，你可以使用 `expireAfter` 方法显式定义一个锁过期时间。例如，下面的示例会指示 Laravel 在任务开始处理三分钟后释放 `WithoutOverlapping` 锁：

```php
/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->expireAfter(180)];
}
```

> [!WARNING]
> `WithoutOverlapping` 中间件需要一个支持 [锁](/docs/{{version}}/cache#atomic-locks) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

<a name="sharing-lock-keys"></a>
#### 在任务类之间共享锁键

默认情况下，`WithoutOverlapping` 中间件只会防止同一类的任务发生重叠。因此，尽管两个不同的任务类可能使用相同的锁键，它们仍不会被阻止发生重叠。不过，你可以使用 `shared` 方法指示 Laravel 将该键跨任务类应用：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ProviderIsDown
{
    // ……

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}

class ProviderIsUp
{
    // ……

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}
```

<a name="throttling-exceptions"></a>
### 异常节流

Laravel 内置了一个 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，允许你对异常进行节流。一旦任务抛出了给定数量的异常，所有进一步执行该任务的尝试都会被延迟，直到指定的时间间隔过去。这个中间件对于与不稳定的第三方服务交互的任务特别有用。

例如，假设有一个可入队任务与一个第三方 API 交互，而该 API 开始抛出异常。要对异常进行节流，你可以从任务的 `middleware` 方法中返回 `ThrottlesExceptions` 中间件。通常，这个中间件应该与一个实现了 [基于时间的尝试](#time-based-attempts) 的任务配对使用：

```php
use DateTime;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new ThrottlesExceptions(10, 5 * 60)];
}

/**
 * 确定任务应当超时的时刻。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 30);
}
```

该中间件接受的第一个构造函数参数是任务在被节流之前可以抛出的异常数量，第二个构造函数参数是在任务被节流后、再次尝试该任务之前应当经过的秒数。在上面的代码示例中，如果任务连续抛出 10 个异常，我们将等待 5 分钟后再尝试该任务，且受 30 分钟时间限制约束。

当任务抛出异常但尚未达到异常阈值时，该任务通常会被立即重试。不过，你可以通过在将中间件附加到任务时调用 `backoff` 方法来指定该任务应当被延迟的分钟数：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 5 * 60))->backoff(5)];
}
```

`backoff` 方法还接受一个接收被抛出异常的闭包，从而允许动态决定延迟时间：

```php
use App\Exceptions\RateLimitedException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;
use Throwable;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 5 * 60))->backoff(
        fn (Throwable $throwable) => $throwable instanceof RateLimitedException
            ? $throwable->retryAfterMinutes()
            : 5
    )];
}
```

在内部，这个中间件使用 Laravel 的缓存系统来实现速率限制，并将任务的类名用作缓存「键」。你可以通过在将中间件附加到任务时调用 `by` 方法来覆盖这个键。如果你有多个任务与同一个第三方服务交互，并且希望它们共享一个公共的节流「桶」，从而确保它们遵守单一共享限制，这会很有用：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10 * 60))->by('key')];
}
```

默认情况下，这个中间件会对每个异常都进行节流。你可以通过在将中间件附加到任务时调用 `when` 方法来修改这一行为。只有当提供给 `when` 方法的闭包返回 `true` 时，该异常才会被节流：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10 * 60))->when(
        fn (Throwable $throwable) => $throwable instanceof HttpClientException
    )];
}
```

与 `when` 方法（它会将任务释放回队列或抛出异常）不同，`deleteWhen` 方法允许你在发生给定异常时彻底删除该任务：

```php
use App\Exceptions\CustomerDeletedException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(2, 10 * 60))->deleteWhen(CustomerDeletedException::class)];
}
```

如果你希望将节流的异常上报到应用的异常处理器，可以在将中间件附加到任务时调用 `report` 方法来实现。可选地，你可以向 `report` 方法提供一个闭包，只有当该闭包返回 `true` 时，异常才会被上报：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应当经过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10 * 60))->report(
        fn (Throwable $throwable) => $throwable instanceof HttpClientException
    )];
}
```

<a name="throttling-exceptions-with-redis"></a>
#### 使用 Redis 进行异常节流

如果你使用的是 Redis，可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它针对 Redis 进行了微调，比基础的异常节流中间件更高效：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis;

public function middleware(): array
{
    return [new ThrottlesExceptionsWithRedis(10, 10 * 60)];
}
```

可以使用 `connection` 方法来指定该中间件应当使用哪个 Redis 连接：

```php
return [(new ThrottlesExceptionsWithRedis(10, 10 * 60))->connection('limiter')];
```

<a name="releasing-jobs"></a>
### 释放任务

`Release` 中间件允许你在未执行任务的情况下将其释放回队列。`Release::when` 方法会在给定条件求值为 `true` 时释放任务，而 `Release::unless` 方法会在条件求值为 `false` 时释放任务：

```php
use Illuminate\Queue\Middleware\Release;

/**
 * 获取任务应当经过的中间件。
 */
public function middleware(): array
{
    return [
        Release::when($condition, releaseAfter: 60),
    ];
}
```

将任务释放回队列，仍然会递增该任务的总尝试次数。你可能需要相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。

你也可以向 `when` 和 `unless` 方法传递一个 `Closure`，以进行更复杂的求值：

```php
use Illuminate\Queue\Middleware\Release;

/**
 * 获取任务应当经过的中间件。
 */
public function middleware(): array
{
    return [
        Release::when(function (): bool {
            return ! $this->order->isPaid();
        }, releaseAfter: 60),
    ];
}
```

<a name="skipping-jobs"></a>
### 跳过任务

`Skip` 中间件允许你指定某个任务应当被跳过 / 删除，而无需修改任务的逻辑。`Skip::when` 方法会在给定条件求值为 `true` 时删除任务，而 `Skip::unless` 方法会在条件求值为 `false` 时删除任务：

```php
use Illuminate\Queue\Middleware\Skip;

/**
 * 获取任务应当经过的中间件。
 */
public function middleware(): array
{
    return [
        Skip::when($condition),
    ];
}
```

你也可以向 `when` 和 `unless` 方法传递一个 `Closure`，以进行更复杂的求值：

```php
use Illuminate\Queue\Middleware\Skip;

/**
 * 获取任务应当经过的中间件。
 */
public function middleware(): array
{
    return [
        Skip::when(function (): bool {
            return $this->shouldSkip();
        }),
    ];
}
```

<a name="dispatching-jobs"></a>
## 分发任务

一旦你编写好了任务类，就可以使用任务自身的 `dispatch` 方法来分发它。传递给 `dispatch` 方法的参数会被传给任务的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* …… */);

        // ……

        ProcessPodcast::dispatch($podcast);

        return redirect('/podcasts');
    }
}
```

如果你想有条件地分发任务，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
ProcessPodcast::dispatchIf($accountActive, $podcast);

ProcessPodcast::dispatchUnless($accountSuspended, $podcast);
```

在新的 Laravel 应用中，`database` 连接被定义为默认队列。你可以通过修改应用 `.env` 文件中的 `QUEUE_CONNECTION` 环境变量来指定一个不同的默认队列连接。

<a name="delayed-dispatching"></a>
### 延迟分发

如果你希望指定某个任务不应立即被队列处理器处理，可以在分发任务时使用 `delay` 方法。例如，让我们指定一个任务在分发 10 分钟后才可被处理：

```php
<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* …… */);

        // ……

        ProcessPodcast::dispatch($podcast)
            ->delay(now()->plus(minutes: 10));

        return redirect('/podcasts');
    }
}
```

在某些情况下，任务可能配置了默认延迟。如果你需要绕过该延迟并立即分发任务进行处理，可以使用 `withoutDelay` 方法：

```php
ProcessPodcast::dispatch($podcast)->withoutDelay();
```

> [!WARNING]
> Amazon SQS 队列服务的最大延迟时间为 15 分钟。

<a name="synchronous-dispatching"></a>
### 同步分发

如果你希望立即（同步）分发任务，可以使用 `dispatchSync` 方法。使用该方法时，任务不会被加入队列，而是会在当前进程中立即执行：

```php
<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* …… */);

        // 创建播客……

        ProcessPodcast::dispatchSync($podcast);

        return redirect('/podcasts');
    }
}
```

<a name="deferred-dispatching"></a>
#### 延后分发

使用延后式的同步分发，你可以在当前进程中分发一个待处理的任务，但在 HTTP 响应已发送给用户之后才处理。这让你能够同步处理「队列」任务，而不会拖慢用户的应用体验。要延后执行一个同步任务，请将任务分发到 `deferred` 连接：

```php
RecordDelivery::dispatch($order)->onConnection('deferred');
```

`deferred` 连接同时也作为默认的 [故障转移队列](#queue-failover)。

类似地，`background` 连接会在 HTTP 响应已发送给用户之后处理任务；不过，该任务会在一个单独派生的 PHP 进程中处理，从而让 PHP-FPM / 应用处理器能够腾出手来处理另一个传入的 HTTP 请求：

```php
RecordDelivery::dispatch($order)->onConnection('background');
```

<a name="bulk-dispatching"></a>
### 批量分发

如果你需要一次性分发许多独立的任务，并且不需要 [批处理](#job-batching) 追踪或回调，可以使用 `Bus` facade 的 `bulk` 方法。Laravel 会按任务的队列连接和队列名对它们进行分组，并将每一组批量推送到相应的队列：

```php
use App\Jobs\ProcessUser;
use Illuminate\Support\Facades\Bus;

Bus::bulk(
    $users->map(fn ($user) => new ProcessUser($user))
);
```

<a name="preparing-jobs-before-dispatch"></a>
### 分发前准备任务

如果一个任务在被推送到队列之前需要准备或检查其状态，该任务可以实现 `Illuminate\Contracts\Queue\PreparesForDispatch` 接口。Laravel 会在分发任务之前调用任务的 `prepareForDispatch` 方法。如果该方法返回 `false`，则任务不会被分发：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\PreparesForDispatch;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class SyncPodcasts implements PreparesForDispatch, ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public array $podcastIds,
    ) {}

    /**
     * 分发前准备任务。
     */
    public function prepareForDispatch(): bool
    {
        return collect($this->podcastIds)
            ->reject(fn (int $id) => Cache::has("podcast-syncing:{$id}"))
            ->isNotEmpty();
    }
}
```

<a name="jobs-and-database-transactions"></a>
### 任务与数据库事务

在数据库事务中分发任务完全没有问题，但你应该特别小心，确保你的任务确实能够成功执行。在事务内分发任务时，任务有可能在父事务提交之前就被处理器处理了。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映到数据库中。此外，在事务内创建的任何模型或数据库记录可能还不存在于数据库中。

幸运的是，Laravel 提供了几种方法来规避这个问题。首先，你可以在队列连接的配置数组中设置 `after_commit` 连接选项：

```php
'redis' => [
    'driver' => 'redis',
    // ……
    'after_commit' => true,
],
```

当 `after_commit` 选项为 `true` 时，你可以在数据库事务中分发任务；不过，Laravel 会等待开放的父数据库事务提交之后，才真正分发该任务。当然，如果当前没有开放的数据库事务，任务会被立即分发。

如果由于事务期间发生的异常导致事务回滚，那么该事务期间被分发的任务将被丢弃。

> [!NOTE]
> 将 `after_commit` 配置选项设为 `true`，还会导致任何可入队的事件监听器、可邮寄类、通知和广播事件在所有开放的数据库事务提交之后才被分发。

<a name="specifying-commit-dispatch-behavior-inline"></a>
#### 内联指定提交分发行为

如果你没有将 `after_commit` 队列连接配置选项设为 `true`，你仍然可以指明某个特定任务应当在所有开放的数据库事务提交之后才被分发。为此，你可以将 `afterCommit` 方法链式调用到你的分发操作上：

```php
use App\Jobs\ProcessPodcast;

ProcessPodcast::dispatch($podcast)->afterCommit();
```

同样地，如果 `after_commit` 配置选项被设为 `true`，你可以指明某个特定任务应当立即分发，而无需等待任何开放的数据库事务提交：

```php
ProcessPodcast::dispatch($podcast)->beforeCommit();
```

<a name="job-chaining"></a>
### 任务链

任务链允许你指定一列可入队的任务，这些任务会在主任务成功执行后按顺序运行。如果序列中的某个任务失败，其余任务将不会运行。要执行一个可入队任务链，可以使用 `Bus` facade 提供的 `chain` 方法。Laravel 的命令总线（command bus）是一个更底层的组件，可入队任务的分发构建于其上：

```php
use App\Jobs\OptimizePodcast;
use App\Jobs\ProcessPodcast;
use App\Jobs\ReleasePodcast;
use Illuminate\Support\Facades\Bus;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->dispatch();
```

除了链接任务类实例之外，你还可以链接闭包：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    function () {
        Podcast::update(/* …… */);
    },
])->dispatch();
```

> [!WARNING]
> 在任务内部使用 `$this->delete()` 方法删除任务，并不会阻止链式任务被处理。只有当链中的某个任务失败时，链才会停止执行。

<a name="chain-connection-queue"></a>
#### 链的连接与队列

如果你希望指定用于链式任务的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。这些方法指定应当使用的队列连接和队列名，除非可入队任务被显式分配了不同的连接 / 队列：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->onConnection('redis')->onQueue('podcasts')->dispatch();
```

<a name="adding-jobs-to-the-chain"></a>
#### 向链添加任务

有时，你可能需要从链中的另一个任务里，向已有的任务链前置或追加一个任务。你可以使用 `prependToChain` 和 `appendToChain` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ……

    // 前置到当前链，在当前任务之后立即运行任务……
    $this->prependToChain(new TranscribePodcast);

    // 追加到当前链，在链末尾运行任务……
    $this->appendToChain(new TranscribePodcast);
}
```

<a name="chain-failures"></a>
#### 链失败

在链接任务时，你可以使用 `catch` 方法来指定一个闭包，当链中的某个任务失败时应当调用它。给定的回调会接收导致任务失败的 `Throwable` 实例：

```php
use Illuminate\Support\Facades\Bus;
use Throwable;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->catch(function (Throwable $e) {
    // 链中的某个任务已失败……
})->dispatch();
```

> [!WARNING]
> 由于链回调会被序列化并在稍后由 Laravel 队列执行，你不应在链回调中使用 `$this` 变量。

<a name="customizing-the-queue-and-connection"></a>
### 自定义队列与连接

<a name="dispatching-to-a-particular-queue"></a>
#### 分发到特定队列

通过将任务推送到不同的队列，你可以「分类」你的可入队任务，甚至可以优先安排你为各种队列分配的（处理器）数量。请注意，这并不会将任务推送到队列配置文件中定义的不同队列「连接」，而只是推送到单个连接内的特定队列。要指定队列，请在分发任务时使用 `onQueue` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* …… */);

        // 创建播客……

        ProcessPodcast::dispatch($podcast)->onQueue('processing');

        return redirect('/podcasts');
    }
}
```

或者，你可以通过在任务的构造函数中调用 `onQueue` 方法来指定任务的队列：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct()
    {
        $this->onQueue('processing');
    }
}
```

<a name="dispatching-to-a-particular-connection"></a>
#### 分发到特定连接

如果你的应用与多个队列连接交互，可以使用 `onConnection` 方法指定将任务推送到哪个连接：

```php
<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储一个新的播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* …… */);

        // 创建播客……

        ProcessPodcast::dispatch($podcast)->onConnection('sqs');

        return redirect('/podcasts');
    }
}
```

你可以将 `onConnection` 和 `onQueue` 方法链式调用，以指定任务的连接和队列：

```php
ProcessPodcast::dispatch($podcast)
    ->onConnection('sqs')
    ->onQueue('processing');
```

或者，你可以通过在任务的构造函数中调用 `onConnection` 方法来指定任务的连接：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct()
    {
        $this->onConnection('sqs');
    }
}
```

<a name="queue-routing"></a>
#### 队列路由

你可以使用 `Queue` facade 的 `route` 方法为特定任务类定义一个默认的连接和队列。当你希望确保某些任务始终使用特定的队列，而无需在任务上指定连接或队列时，这会很有用。

除了路由特定的任务类之外，你还可以向 `route` 方法传递一个接口、trait 或父类。当你这样做时，任何实现了该接口、使用了该 trait 或继承了该父类的任务，都会自动使用配置的连接和队列。

通常，你应该在服务提供者的 `boot` 方法中调用 `route` 方法：

```php
use App\Concerns\RequiresVideo;
use App\Jobs\ProcessPodcast;
use App\Jobs\ProcessVideo;
use Illuminate\Support\Facades\Queue;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
    Queue::route(RequiresVideo::class, queue: 'video');
}
```

当指定了连接但未指定队列时，任务会被发送到默认队列：

```php
Queue::route(ProcessPodcast::class, connection: 'redis');
```

你也可以通过向 `route` 方法传递一个数组，一次性路由多个任务类：

```php
Queue::route([
    ProcessPodcast::class => ['redis', 'podcasts'], // 连接与队列
    ProcessVideo::class => 'videos', // 仅队列（使用默认连接）
]);
```

> [!NOTE]
> 队列路由仍然可以在每个任务的基础上被任务本身覆盖。

你可以使用 `forward` 方法将任务从一个队列转发到另一个队列和 / 或连接。当你需要在不修改单个任务或分发位置的情况下更改队列基础设施时，这会很有用：

```php
Queue::forward('reports', 'reports.fifo', 'sqs');
Queue::forward('payments', connection: 'sqs');
Queue::forward('updates', 'notifications');
```

你也可以通过传递一个数组来一次性转发多个队列：

```php
Queue::forward([
    'reports' => 'reports.fifo',
    'emails' => 'emails.fifo',
], connection: 'sqs');
```

在任务上显式配置的连接优先于被转发的连接。

<a name="max-job-attempts-and-timeout"></a>
### 指定任务最大尝试次数 / 超时值

<a name="max-attempts"></a>
#### 最大尝试次数

任务尝试次数（attempt）是 Laravel 队列系统的核心概念，并为许多高级特性提供支持。虽然它们乍看之下可能令人困惑，但在修改默认配置之前，理解它们的工作原理非常重要。

当一个任务被分发时，它会被推送到队列。然后一个处理器会将其取出并尝试执行它。这就是一次任务尝试。

然而，一次尝试并不一定意味着任务的 `handle` 方法被执行了。尝试也可能通过以下几种方式被「消耗」：

<div class="content-list" markdown="1">

- 任务在执行期间遇到未处理的异常。
- 任务通过 `$this->release()` 被手动释放回队列。
- 诸如 `WithoutOverlapping` 或 `RateLimited` 之类的中间件未能获取锁并释放了任务。
- 任务超时。
- 任务的 `handle` 方法运行并正常完成，未抛出异常。

</div>

你可能不希望无限期地持续尝试某个任务。因此，Laravel 提供了多种方式来指定一个任务可以被尝试的次数或时长。

> [!NOTE]
> 默认情况下，Laravel 只会尝试执行任务一次。如果你的任务使用了诸如 `WithoutOverlapping` 或 `RateLimited` 之类的中间件，或者你正在手动释放任务，你可能需要通过 `tries` 选项来增加允许的尝试次数。

指定一个任务最多可被尝试次数的一种方式，是通过 Artisan 命令行上的 `--tries` 开关。这将应用于该处理器处理的所有任务，除非正在被处理的任务自行指定了它可以被尝试的次数：

```shell
php artisan queue:work --tries=3
```

如果一个任务超过了它的最大尝试次数，它将被视为「失败」任务。有关处理失败任务的更多信息，请参阅 [失败任务文档](#dealing-with-failed-jobs)。如果向 `queue:work` 命令提供了 `--tries=0`，任务将被无限期重试。

你可以通过在任务类本身上使用 `Tries` 属性来定义一个任务最多可被尝试的次数，从而采取更精细的方式。如果在任务上指定了最大尝试次数，它将优先于命令行上提供的 `--tries` 值：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Tries;

#[Tries(5)]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

如果你需要对某个特定任务的最大尝试次数进行动态控制，可以在任务上定义一个 `tries` 方法：

```php
/**
 * 确定任务可被尝试的次数。
 */
public function tries(): int
{
    return 5;
}
```

<a name="time-based-attempts"></a>
#### 基于时间的尝试

除了定义任务在失败前可以被尝试多少次之外，你还可以定义一个时间，超过该时间后任务不应再被尝试。这允许任务在给定时间范围内被尝试任意次数。要定义任务不应再被尝试的时间，请在你的任务类上添加一个 `retryUntil` 方法。该方法应当返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 确定任务应当超时的时刻。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 10);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 会优先采用 `retryUntil` 方法。

> [!NOTE]
> 你也可以在你的 [可入队事件监听器](/docs/{{version}}/events#queued-event-listeners) 和 [可入队通知](/docs/{{version}}/notifications#queueing-notifications) 上定义 `Tries` 属性或 `retryUntil` 方法。

<a name="max-exceptions"></a>
#### 最大异常数

有时你可能希望指定一个任务可以被尝试很多次，但如果重试是由给定数量的未处理异常（而不是由 `release` 方法直接释放）触发的，则应当失败。为此，你可以在任务类上使用 `Tries` 和 `MaxExceptions` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Support\Facades\Redis;

#[Tries(25)]
#[MaxExceptions(3)]
class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        Redis::throttle('key')->allow(10)->every(60)->then(function () {
            // 已获取锁，处理播客……
        }, function () {
            // 无法获取锁……
            return $this->release(10);
        });
    }
}
```

在此示例中，如果应用无法获取 Redis 锁，任务会被释放 10 秒，并将继续被重试最多 25 次。然而，如果该任务抛出了三个未处理的异常，它将会失败。

<a name="stopping-retries-by-exception"></a>
#### 通过异常停止重试

有时，某个异常表明一个可入队任务应当立即失败，而不是被释放以进行另一次尝试。你可以使用应用 `bootstrap/app.php` 文件中的 `dontRetry` 异常方法来配置应当停止任务重试的异常类型：

```php
use App\Exceptions\InvalidPodcastSourceException;
use Illuminate\Foundation\Configuration\Exceptions;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontRetry([
        InvalidPodcastSourceException::class,
    ]);
})
```

如果你需要对重试何时停止进行更多控制，可以向 `dontRetryWhen` 方法提供一个闭包。当该闭包返回 `true` 时，任务将被标记为失败且不会被重试：

```php
use App\Exceptions\PodcastProcessingException;
use Illuminate\Foundation\Configuration\Exceptions;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontRetryWhen(function (PodcastProcessingException $e) {
        return $e->reason() === 'Subscription expired';
    });
})
```

<a name="timeout"></a>
#### 超时

通常，你大体知道自己期望可入队任务耗时多久。因此，Laravel 允许你指定一个「超时（timeout）」值。默认情况下，超时值为 60 秒。如果某个任务的处理时间超过了超时值所指定的秒数，处理该任务的处理器将报错退出。通常，处理器会被 [服务器上配置的进程管理器](#supervisor-configuration) 自动重启。

任务可以运行的最大秒数可以通过 Artisan 命令行上的 `--timeout` 开关来指定：

```shell
php artisan queue:work --timeout=30
```

如果任务因不断超时而超过了最大尝试次数，它将被标记为失败。

你也可以使用任务类上的 `Timeout` 属性来定义任务被允许运行的最大秒数。如果在任务上指定了超时时间，它将优先于命令行上指定的任何超时时间：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Timeout;

#[Timeout(120)]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

有时，诸如套接字或传出 HTTP 连接之类的 IO 阻塞进程可能不会遵守你指定的超时时间。因此，在使用这些特性时，你也应该始终尝试使用它们的 API 来指定超时时间。例如，在使用 [Guzzle](https://docs.guzzlephp.org) 时，你应该始终指定一个连接和请求超时值。

> [!WARNING]
> 必须安装 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展才能指定任务超时。此外，任务的「超时」值应始终小于其 [「重试间隔」](#job-expiration) 值。否则，任务可能会在实际执行完毕或超时之前就被重新尝试。`queue:work` 命令在使用 `--once` 选项调用时，`--timeout` 选项不起作用。

<a name="failing-on-timeout"></a>
#### 超时时标记为失败

如果你希望指明某个任务在超时时应当被标记为 [失败](#dealing-with-failed-jobs)，可以在任务类上使用 `FailOnTimeout` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\FailOnTimeout;

#[FailOnTimeout]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

> [!NOTE]
> 默认情况下，当任务超时时，它会消耗一次尝试并被释放回队列（如果允许重试）。然而，如果你将任务配置为在超时时失败，无论为 tries 设置的值是多少，它都不会被重试。

<a name="sqs-fifo-and-fair-queues"></a>
### SQS FIFO 与公平队列

Laravel 支持 [Amazon SQS FIFO（先进先出，First-In-First-Out）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html) 和 [公平（fair）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues.html) 队列。FIFO 队列允许你按照任务发送的确切顺序处理它们，同时通过消息去重确保精确一次（exactly-once）处理。

FIFO 队列需要一个消息组 ID 来确定哪些任务可以并行处理。具有相同组 ID 的任务会被顺序处理，而具有不同组 ID 的消息可以并发处理。

Laravel 提供了一个流畅的 `onGroup` 方法，用于在分发任务时指定消息组 ID：

```php
ProcessOrder::dispatch($order)
    ->onGroup("customer-{$order->customer_id}");
```

SQS FIFO 队列支持消息去重，以确保精确一次处理。在你的任务类上实现一个 `deduplicationId` 方法来提供自定义去重 ID：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessSubscriptionRenewal implements ShouldQueue
{
    use Queueable;

    // ……

    /**
     * 获取任务的去重 ID。
     */
    public function deduplicationId(): string
    {
        return "renewal-{$this->subscription->id}";
    }
}
```

<a name="fair-queues"></a>
#### 公平队列

如果你使用的是 SQS 标准队列，设置一个消息组即可启用公平排队。换句话说，一旦你分配了组，SQS 就会使用它们来维护跨租户 / 工作负载的公平投递。无需额外的 Laravel 配置。

除了在分发时调用 `onGroup` 之外，你也可以直接在任务上定义一个 `messageGroup` 方法：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessOrder implements ShouldQueue
{
    use Queueable;

    // ……

    /**
     * 获取任务的消息组。
     */
    public function messageGroup(): string
    {
        return "customer-{$this->order->customer_id}";
    }
}
```

<a name="fifo-listeners-mail-and-notifications"></a>
#### FIFO 监听器、邮件与通知

在使用 FIFO 队列时，你还需要在监听器、邮件和通知上定义消息组。或者，你可以将这些对象的可入队实例分发到非 FIFO 队列。

要为 [可入队的事件监听器](/docs/{{version}}/events#queued-event-listeners) 定义消息组，请在监听器上定义一个 `messageGroup` 方法。你也可以可选地定义一个 `deduplicationId` 方法：

```php
<?php

namespace App\Listeners;

class SendShipmentNotification
{
    // ……

    /**
     * 获取任务的消息组。
     */
    public function messageGroup(): string
    {
        return 'shipments';
    }

    /**
     * 获取任务的去重 ID。
     */
    public function deduplicationId(): string
    {
        return "shipment-notification-{$this->shipment->id}";
    }
}
```

当发送一个将被加入 FIFO 队列的 [邮件消息](/docs/{{version}}/mail) 时，你应该在发送该通知时调用 `onGroup` 方法，并可选地调用 `withDeduplicator` 方法：

```php
use App\Mail\InvoicePaid;
use Illuminate\Support\Facades\Mail;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

Mail::to($request->user())->send($invoicePaid);
```

当发送一个将被加入 FIFO 队列的 [通知](/docs/{{version}}/notifications) 时，你应该在发送该通知时调用 `onGroup` 方法，并可选地调用 `withDeduplicator` 方法：

```php
use App\Notifications\InvoicePaid;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

$user->notify($invoicePaid);
```

<a name="queue-failover"></a>
### 队列故障转移

`failover` 队列驱动在将任务推送到队列时提供自动故障转移功能。如果 `failover` 配置的主队列连接因任何原因失败，Laravel 会自动尝试将任务推送到列表中的下一个已配置连接。这在队列可靠性至关重要的生产环境中，对于确保高可用性尤其有用。

要配置一个故障转移队列连接，请指定 `failover` 驱动，并提供一个按顺序尝试的连接名称数组。默认情况下，Laravel 会在应用的 `config/queue.php` 配置文件中包含一个示例故障转移配置：

```php
'failover' => [
    'driver' => 'failover',
    'connections' => [
        'redis',
        'database',
        'sync',
    ],
],
```

一旦你配置好一个使用 `failover` 驱动的连接，你需要在应用的 `.env` 文件中将该故障转移连接设置为默认队列连接，才能使用故障转移功能：

```ini
QUEUE_CONNECTION=failover
```

接下来，为你的故障转移连接列表中的每个连接至少启动一个处理器：

```bash
php artisan queue:work redis
php artisan queue:work database
```

> [!NOTE]
> 你无需为使用 `sync`、`background` 或 `deferred` 队列驱动的连接运行处理器，因为这些驱动会在当前 PHP 进程中处理任务。

当某个队列连接操作失败并激活故障转移时，Laravel 会分发 `Illuminate\Queue\Events\QueueFailedOver` 事件，让你可以报告或记录某个队列连接已失败。

> [!NOTE]
> 如果你使用 Laravel Horizon，请记住 Horizon 只管理 Redis 队列。如果你的故障转移列表中包含 `database`，你应该在 Horizon 旁边运行一个常规的 `php artisan queue:work database` 进程。

<a name="error-handling"></a>
### 错误处理

如果在任务处理过程中抛出了异常，该任务会被自动释放回队列，以便可以再次尝试。任务会持续被释放，直到它达到应用允许的最大尝试次数。最大尝试次数由 `queue:work` Artisan 命令上使用的 `--tries` 开关定义。或者，最大尝试次数也可以在任务类本身上定义。有关运行队列处理器的更多信息，[请参阅下文](#running-the-queue-worker)。

<a name="manually-releasing-a-job"></a>
#### 手动释放任务

有时你可能希望手动将任务释放回队列，以便稍后再次尝试。你可以通过调用 `release` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ……

    $this->release();
}
```

默认情况下，`release` 方法会将任务释放回队列以立即处理。不过，你可以通过向 `release` 方法传入一个整数或日期实例，指示队列在某些秒数过去之前不将该任务设为可处理：

```php
$this->release(10);

$this->release(now()->plus(seconds: 10));
```

<a name="manually-failing-a-job"></a>
#### 手动标记任务失败

有时你可能需要手动将任务标记为「失败」。为此，你可以调用 `fail` 方法：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ……

    $this->fail();
}
```

如果你因为捕获到的某个异常而希望将任务标记为失败，你可以将该异常传递给 `fail` 方法。或者，为了方便起见，你可以传递一个字符串错误消息，它会被转换为一个异常：

```php
$this->fail($exception);

$this->fail('出现了问题。');
```

> [!NOTE]
> 有关失败任务的更多信息，请查阅 [处理任务失败的文档](#dealing-with-failed-jobs)。

<a name="fail-jobs-on-exceptions"></a>
#### 在特定异常时标记任务失败

`FailOnException` [任务中间件](#job-middleware) 允许你在抛出特定异常时短路（short-circuit）重试。这允许针对外部 API 错误等瞬时异常进行重试，但在用户权限被撤销等持久异常时永久标记任务失败：

```php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Middleware\FailOnException;
use Illuminate\Support\Facades\Http;

#[Tries(3)]
class SyncChatHistory implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        $this->user->authorize('sync-chat-history');

        $response = Http::throw()->get(
            "https://chat.laravel.test/?user={$this->user->uuid}"
        );

        // ……
    }

    /**
     * 获取任务应当经过的中间件。
     */
    public function middleware(): array
    {
        return [
            new FailOnException([AuthorizationException::class])
        ];
    }
}
```

<a name="job-batching"></a>
## 任务批处理

Laravel 的任务批处理（batching）特性允许你轻松地并行执行一组任务，并在这批任务执行完成后执行某些操作。

在开始之前，你应该创建一张数据库迁移来构建一张表，用于存储任务批处理的元信息，例如完成百分比。这张迁移可以通过 `make:queue-batches-table` Artisan 命令生成：

```shell
php artisan make:queue-batches-table

php artisan migrate
```

<a name="defining-batchable-jobs"></a>
### 定义可批处理任务

要定义一个可批处理任务，你应该像平常一样 [创建任务](#creating-jobs)；不过，你应该在任务类上添加 `Illuminate\Bus\Batchable` trait。这个 trait 提供了对 `batch` 方法的访问，该方法可用于检索任务当前所在的批处理：

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ImportCsv implements ShouldQueue
{
    use Batchable, Queueable;

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        if ($this->batch()->cancelled()) {
            // 判断该批处理是否已被取消……

            return;
        }

        // 导入 CSV 文件的一部分……
    }
}
```

<a name="dispatching-batches"></a>
### 分发批处理

要分发一批任务，你应该使用 `Bus` facade 的 `batch` 方法。当然，批处理在与完成回调结合使用时才最有价值。因此，你可以使用 `then`、`catch` 和 `finally` 方法来为批处理定义完成回调。这些回调在被调用时都会接收一个 `Illuminate\Bus\Batch` 实例。

当运行多个队列处理器时，批处理中的任务会被并行处理。因此，任务完成的顺序可能与它们被添加到批处理中的顺序不同。关于如何按顺序运行一系列任务，请参阅我们有关 [任务链与批处理](#chains-and-batches) 的文档。

在此示例中，我们假设正在将一批任务加入队列，每个任务处理 CSV 文件中给定数量的行：

```php
use App\Jobs\ImportCsv;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;
use Throwable;

$batch = Bus::batch([
    new ImportCsv(1, 100),
    new ImportCsv(101, 200),
    new ImportCsv(201, 300),
    new ImportCsv(301, 400),
    new ImportCsv(401, 500),
])->before(function (Batch $batch) {
    // 批处理已创建，但尚未添加任何任务……
})->progress(function (Batch $batch) {
    // 单个任务已成功完成……
})->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->catch(function (Batch $batch, Throwable $e) {
    // 检测到批处理任务失败……
})->finally(function (Batch $batch) {
    // 批处理已完成执行……
})->dispatch();

return $batch->id;
```

批处理的 ID 可以通过 `$batch->id` 属性访问，可用于在批处理被分发后 [查询 Laravel 命令总线](#inspecting-batches) 以获取有关该批处理的信息。

> [!WARNING]
> 由于批处理回调会被序列化并在稍后由 Laravel 队列执行，你不应在回调中使用 `$this` 变量。此外，由于批处理任务被包裹在数据库事务中，不应在任务内部执行会触发隐式提交的数据库语句。

<a name="naming-batches"></a>
#### 为批处理命名

诸如 [Laravel Horizon](/docs/{{version}}/horizon) 和 [Laravel Telescope](/docs/{{version}}/telescope) 等工具在批处理被命名时，可能会为批处理提供更友好的调试信息。要为批处理分配一个任意名称，你可以在定义批处理时调用 `name` 方法：

```php
$batch = Bus::batch([
    // ……
])->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->name('Import CSV')->dispatch();
```

<a name="batch-connection-queue"></a>
#### 批处理的连接与队列

如果你希望指定用于批处理任务的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。所有批处理任务必须在同一个连接和队列中执行：

```php
$batch = Bus::batch([
    // ……
])->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->onConnection('redis')->onQueue('imports')->dispatch();
```

<a name="chains-and-batches"></a>
### 任务链与批处理

你可以通过将链式任务放在一个数组中，在批处理内定义一组 [链式任务](#job-chaining)。例如，我们可以并行执行两个任务链，并在两个任务链都处理完成时执行回调：

```php
use App\Jobs\ReleasePodcast;
use App\Jobs\SendPodcastReleaseNotification;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

Bus::batch([
    [
        new ReleasePodcast(1),
        new SendPodcastReleaseNotification(1),
    ],
    [
        new ReleasePodcast(2),
        new SendPodcastReleaseNotification(2),
    ],
])->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->dispatch();
```

反之，你可以通过在 [任务链](#job-chaining) 中定义批处理，在任务链中运行批处理任务。例如，你可以先运行一批任务来发布多个播客，然后运行一批任务来发送发布通知：

```php
use App\Jobs\FlushPodcastCache;
use App\Jobs\ReleasePodcast;
use App\Jobs\SendPodcastReleaseNotification;
use Illuminate\Support\Facades\Bus;

Bus::chain([
    new FlushPodcastCache,
    Bus::batch([
        new ReleasePodcast(1),
        new ReleasePodcast(2),
    ]),
    Bus::batch([
        new SendPodcastReleaseNotification(1),
        new SendPodcastReleaseNotification(2),
    ]),
])->dispatch();
```

<a name="adding-jobs-to-batches"></a>
### 向批处理添加任务

有时，从批处理内的一个任务向该批处理添加额外的任务是很有用的。当你需要批处理成千上万个任务、而在 Web 请求期间分发它们耗时过长时，这种模式会很有用。因此，你可以分发一批初始的「加载器（loader）」任务，由它们向批处理中灌入更多的任务：

```php
$batch = Bus::batch([
    new LoadImportBatch,
    new LoadImportBatch,
    new LoadImportBatch,
])->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->name('Import Contacts')->dispatch();
```

在此示例中，我们将使用 `LoadImportBatch` 任务向批处理灌入额外的任务。为此，我们可以使用批处理实例上的 `add` 方法，该实例可通过任务的 `batch` 方法访问：

```php
use App\Jobs\ImportContacts;
use Illuminate\Support\Collection;

/**
 * 执行任务。
 */
public function handle(): void
{
    if ($this->batch()->cancelled()) {
        return;
    }

    $this->batch()->add(Collection::times(1000, function () {
        return new ImportContacts;
    }));
}
```

> [!WARNING]
> 你只能从属于同一批处理的任务内部向该批处理添加任务。

<a name="inspecting-batches"></a>
### 检查批处理

提供给批处理完成回调的 `Illuminate\Bus\Batch` 实例拥有多种属性和方法，可帮助你与给定的任务批处理进行交互和检查：

```php
// 批处理的 UUID……
$batch->id;

// 批处理的名称（如果适用）……
$batch->name;

// 分配给批处理的任务数量……
$batch->totalJobs;

// 尚未被队列处理的任务数量……
$batch->pendingJobs;

// 已失败的任务数量……
$batch->failedJobs;

// 到目前为止已处理的任务数量……
$batch->processedJobs();

// 批处理的完成百分比（0-100）……
$batch->progress();

// 指示批处理是否已执行完毕……
$batch->finished();

// 取消批处理的执行……
$batch->cancel();

// 指示批处理是否已被取消……
$batch->cancelled();
```

<a name="returning-batches-from-routes"></a>
#### 从路由返回批处理

所有 `Illuminate\Bus\Batch` 实例都是可 JSON 序列化的，这意味着你可以直接从应用的一个路由返回它们，以获取包含批处理信息（包括完成进度）的 JSON 载荷。这让在应用 UI 中展示批处理的完成进度信息变得方便。

要按 ID 检索批处理，可以使用 `Bus` facade 的 `findBatch` 方法：

```php
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Route;

Route::get('/batch/{batchId}', function (string $batchId) {
    return Bus::findBatch($batchId);
});
```

<a name="cancelling-batches"></a>
### 取消批处理

有时你可能需要取消某个批处理的执行。这可以通过调用 `Illuminate\Bus\Batch` 实例上的 `cancel` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    if ($this->user->exceedsImportLimit()) {
        $this->batch()->cancel();

        return;
    }

    if ($this->batch()->cancelled()) {
        return;
    }
}
```

正如你在前面的示例中可能已经注意到的，批处理任务通常应该在继续执行之前，判断其对应的批处理是否已被取消。不过，为了方便，你可以改为给任务分配 `SkipIfBatchCancelled` [中间件](#job-middleware)。顾名思义，如果对应的批处理已被取消，这个中间件会指示 Laravel 不处理该任务：

```php
use Illuminate\Queue\Middleware\SkipIfBatchCancelled;

/**
 * 获取任务应当经过的中间件。
 */
public function middleware(): array
{
    return [new SkipIfBatchCancelled];
}
```

<a name="batch-failures"></a>
### 批处理失败

当一个批处理任务失败时，`catch` 回调（如果已分配）会被调用。这个回调只会针对批处理中第一个失败的任务被调用。

<a name="allowing-failures"></a>
#### 允许失败

当批处理中的某个任务失败时，Laravel 会自动将该批处理标记为「已取消」。如果你愿意，可以禁用这一行为，使单个任务失败不会自动将批处理标记为已取消。这可以通过在分发批处理时调用 `allowFailures` 方法来实现：

```php
$batch = Bus::batch([
    // ……
])->then(function (Batch $batch) {
    // 所有任务都已成功完成……
})->allowFailures()->dispatch();
```

你可以选择性地向 `allowFailures` 方法提供一个闭包，它会在每次任务失败时执行：

```php
$batch = Bus::batch([
    // ……
])->allowFailures(function (Batch $batch, $exception) {
    // 处理单个任务失败……
})->dispatch();
```

<a name="retrying-failed-batch-jobs"></a>
#### 重试失败的批处理任务

为方便起见，Laravel 提供了一个 `queue:retry-batch` Artisan 命令，允许你轻松重试给定批处理中所有失败的任务。该命令接受应当重试失败任务的批处理的 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

<a name="pruning-batches"></a>
### 清理批处理

如果不进行清理，`job_batches` 表会非常快速地累积记录。为缓解这个问题，你应该 [调度](/docs/{{version}}/scheduling) `queue:prune-batches` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches')->daily();
```

默认情况下，所有完成超过 24 小时的批处理都会被清理。你可以在调用命令时使用 `hours` 选项来决定保留批处理数据的时长。例如，以下命令会删除所有在 48 小时之前完成的批处理：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48')->daily();
```

有时，你的 `job_batches` 表可能会累积那些从未成功完成的批处理的记录，例如某个任务失败且该任务从未被成功重试的批处理。你可以使用 `unfinished` 选项指示 `queue:prune-batches` 命令清理这些未完成的批处理记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --unfinished=72')->daily();
```

同样，你的 `job_batches` 表也可能会累积已取消批处理的记录。你可以使用 `cancelled` 选项指示 `queue:prune-batches` 命令清理这些已取消的批处理记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --cancelled=72')->daily();
```

<a name="storing-batches-in-dynamodb"></a>
### 在 DynamoDB 中存储批处理

Laravel 还支持将批处理的元信息存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库里。不过，你需要手动创建一张 DynamoDB 表来存放所有的批处理记录。

通常，这张表应当命名为 `job_batches`，但你应根据应用 `queue` 配置文件中 `queue.batching.table` 配置的值来命名该表。

<a name="dynamodb-batch-table-configuration"></a>
#### DynamoDB 批处理表配置

`job_batches` 表应当有一个名为 `application` 的字符串主分区键，以及一个名为 `id` 的字符串主排序键。键的 `application` 部分将包含你应用 `app` 配置文件中 `name` 配置值所定义的应用名称。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表为多个 Laravel 应用存储任务批处理。

此外，如果你想利用 [自动批处理清理](#pruning-batches-in-dynamodb)，可以为你的表定义 `ttl` 属性。

<a name="dynamodb-configuration"></a>
#### DynamoDB 配置

接下来，安装 AWS SDK，以便你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，将 `queue.batching.driver` 配置选项的值设为 `dynamodb`。此外，你应该在 `batching` 配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于与 AWS 进行身份认证。使用 `dynamodb` 驱动时，`queue.batching.database` 配置选项是不必要的：

```php
'batching' => [
    'driver' => env('QUEUE_BATCHING_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
],
```

<a name="pruning-batches-in-dynamodb"></a>
#### 在 DynamoDB 中清理批处理

当使用 [DynamoDB](https://aws.amazon.com/dynamodb) 存储任务批处理信息时，用于清理关系型数据库中批处理的常规清理命令将不起作用。相反，你可以利用 [DynamoDB 原生的 TTL 功能](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html) 自动移除旧批处理的记录。

如果你为 DynamoDB 表定义了 `ttl` 属性，可以定义配置参数来指示 Laravel 如何清理批处理记录。`queue.batching.ttl_attribute` 配置值定义了持有 TTL 的属性名称，而 `queue.batching.ttl` 配置值定义了自记录最后一次更新起、多久之后该批处理记录可以从 DynamoDB 表中移除（以秒为单位）：

```php
'batching' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
    'ttl_attribute' => 'ttl',
    'ttl' => 60 * 60 * 24 * 7, // 7 天……
],
```

<a name="queueing-closures"></a>
## 将闭包加入队列

除了向队列分发一个任务类之外，你也可以分发一个闭包（closure）。这对于需要在当前请求周期之外执行的简单快速任务非常理想。当向队列分发闭包时，闭包的代码内容会被加密签名，从而无法在传输过程中被修改：

```php
use App\Models\Podcast;

$podcast = Podcast::find(1);

dispatch(function () use ($podcast) {
    $podcast->publish();
});
```

要为加入队列的闭包指定一个名称（供队列报告仪表盘使用，也会由 `queue:work` 命令显示），可以使用 `name` 方法：

```php
dispatch(function () {
    // ……
})->name('Publish Podcast');
```

使用 `catch` 方法，你可以提供一个闭包，当加入队列的闭包在耗尽队列所有 [配置的尝试次数](#max-job-attempts-and-timeout) 后仍未成功完成时，应当执行该闭包：

```php
use Throwable;

dispatch(function () use ($podcast) {
    $podcast->publish();
})->catch(function (Throwable $e) {
    // 该任务已失败……
});
```

> [!WARNING]
> 由于 `catch` 回调会被序列化并在稍后由 Laravel 队列执行，你不应在 `catch` 回调中使用 `$this` 变量。

<a name="running-the-queue-worker"></a>
## 运行队列处理器

<a name="the-queue-work-command"></a>
### `queue:work` 命令

Laravel 内置了一个 Artisan 命令，用于启动一个队列处理器并处理被推送到队列的新任务。你可以使用 `queue:work` Artisan 命令来运行处理器。请注意，一旦 `queue:work` 命令启动，它将继续运行，直到被手动停止或你关闭终端：

```shell
php artisan queue:work
```

> [!NOTE]
> 要让 `queue:work` 进程在后台永久运行，你应该使用一个进程监视器，例如 [Supervisor](#supervisor-configuration)，以确保队列处理器不会停止运行。

如果你希望在 `queue:work` 命令的输出中包含已处理任务的 ID、连接名和队列名，可以在调用该命令时加上 `-v` 标志：

```shell
php artisan queue:work -v
```

请记住，队列处理器是长生命周期的进程，会将已引导的应用状态存储在内存中。因此，它们在启动之后不会注意到代码库的变更。所以，在你的部署过程中，务必 [重启你的队列处理器](#queue-workers-and-deployment)。此外，请记住，你的应用创建或修改的任何静态状态不会在任务之间被自动重置。

或者，你可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当你想要重新加载更新后的代码或重置应用状态时，无需手动重启处理器；不过，该命令的效率明显低于 `queue:work` 命令：

```shell
php artisan queue:listen
```

<a name="running-multiple-queue-workers"></a>
#### 运行多个队列处理器

要为某个队列分配多个处理器并并发处理任务，你只需启动多个 `queue:work` 进程即可。这可以在本地通过终端中的多个标签页完成，也可以在生产环境中通过进程管理器的配置设置完成。[使用 Supervisor 时](#supervisor-configuration)，你可以使用 `numprocs` 配置值。

<a name="specifying-the-connection-queue"></a>
#### 指定连接与队列

你还可以指定处理器应当使用哪个队列连接。传递给 `work` 命令的连接名应当与你在 `config/queue.php` 配置文件中定义的某个连接相对应：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令只会处理给定连接上默认队列中的任务。不过，你可以进一步定制你的队列处理器，使其只处理给定连接上的特定队列。例如，如果你的所有邮件都在 `redis` 队列连接的 `emails` 队列中处理，你可以发出以下命令来启动一个只处理该队列的处理器：

```shell
php artisan queue:work redis --queue=emails
```

<a name="processing-a-specified-number-of-jobs"></a>
#### 处理指定数量的任务

`--once` 选项可用于指示处理器只从队列中处理单个任务：

```shell
php artisan queue:work --once
```

`--max-jobs` 选项可用于指示处理器处理给定数量的任务后退出。当与 [Supervisor](#supervisor-configuration) 结合使用时，这个选项会很有用，这样你的处理器在处理了给定数量的任务后会自动重启，释放它们可能累积的内存：

```shell
php artisan queue:work --max-jobs=1000
```

<a name="processing-all-queued-jobs-then-exiting"></a>
#### 处理完所有队列任务后退出

`--stop-when-empty` 选项可用于指示处理器处理完所有任务后优雅退出。当你希望在 Docker 容器内处理 Laravel 队列、并在队列清空后关闭容器时，这个选项会很有用：

```shell
php artisan queue:work --stop-when-empty
```

<a name="processing-jobs-for-a-given-number-of-seconds"></a>
#### 处理给定秒数的任务

`--max-time` 选项可用于指示处理器处理给定秒数的任务后退出。当与 [Supervisor](#supervisor-configuration) 结合使用时，这个选项会很有用，这样你的处理器在处理了给定时长的任务后会自动重启，释放它们可能累积的内存：

```shell
# 处理任务一小时，然后退出……
php artisan queue:work --max-time=3600
```

<a name="worker-sleep-duration"></a>
#### 处理器休眠时长

当队列中有可用任务时，处理器会持续处理任务，任务之间不延迟。不过，`sleep` 选项决定了在没有可用任务时，处理器会「休眠」多少秒。当然，在休眠期间，处理器不会处理任何新任务：

```shell
php artisan queue:work --sleep=3
```

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当你的应用处于 [维护模式](/docs/{{version}}/configuration#maintenance-mode) 时，不会处理任何队列任务。一旦应用退出维护模式，任务将继续照常处理。

即使启用了维护模式，也要强制你的队列处理器处理任务，可以使用 `--force` 选项：

```shell
php artisan queue:work --force
```

<a name="resource-considerations"></a>
#### 资源注意事项

守护（daemon）队列处理器在处理每个任务之前不会「重启」框架。因此，你应该在每个任务完成后释放任何重型资源。例如，如果你正在使用 [GD 库](https://www.php.net/manual/en/book.image.php) 进行 [图像处理](/docs/{{version}}/images)，在处理完图像后应该使用 `imagedestroy` 释放内存。

<a name="queue-priorities"></a>
### 队列优先级

有时你可能希望对队列的处理方式设置优先级。例如，在 `config/queue.php` 配置文件中，你可以将 `redis` 连接的默认 `queue` 设为 `low`。不过，偶尔你可能希望将任务推送到一个 `high` 优先级队列，如下所示：

```php
dispatch((new Job)->onQueue('high'));
```

要启动一个确保先处理完 `high` 队列中所有任务、再继续处理 `low` 队列中任何任务的处理器，可以向 `work` 命令传递一个以逗号分隔的队列名称列表：

```shell
php artisan queue:work --queue=high,low
```

<a name="queue-workers-and-deployment"></a>
### 队列处理器与部署

由于队列处理器是长生命周期的进程，它们在重启之前不会注意到代码的变更。因此，使用队列处理器部署应用的最简单方式，是在部署过程中重启处理器。你可以通过发出 `queue:restart` 命令来优雅地重启所有处理器：

```shell
php artisan queue:restart
```

该命令会指示所有队列处理器在完成当前任务的处理后优雅退出，从而不会丢失任何现有任务。由于队列处理器会在 `queue:restart` 命令执行时退出，你应该运行一个进程管理器（例如 [Supervisor](#supervisor-configuration)）来自动重启队列处理器。

> [!NOTE]
> 队列使用 [缓存](/docs/{{version}}/cache) 来存储重启信号，因此在使用此特性之前，你应该确保为应用正确配置了缓存驱动。

<a name="reacting-to-worker-signals"></a>
### 响应处理器信号

当队列处理器在处理任务时收到诸如 `SIGQUIT`、`SIGTERM` 或 `SIGINT` 等终止信号时，处理器会在退出前完成当前任务。不过，你的任务可能需要在进程被服务器或容器编排器停止之前对该信号作出响应。例如，一个长时间运行的导入任务可能需要停止拉取新记录并保存当前进度。

要在任务内部响应处理器信号，可以实现 `Illuminate\Contracts\Queue\Interruptible` 接口，并在你的任务上定义一个 `interrupted` 方法。处理器收到的信号编号会被传递给 `interrupted` 方法：

```php
<?php

namespace App\Jobs;

use App\Models\Import;
use Illuminate\Contracts\Queue\Interruptible;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ImportProducts implements ShouldQueue, Interruptible
{
    use Queueable;

    protected bool $shouldStop = false;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public Import $import,
    ) {}

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        foreach ($this->import->pendingRows() as $row) {
            if ($this->shouldStop) {
                break;
            }

            // 导入产品行……
        }

        $this->import->saveProgress();
    }

    /**
     * 处理队列处理器收到的信号。
     */
    public function interrupted(int $signal): void
    {
        $this->shouldStop = true;
    }
}
```

`interrupted` 方法只在处理器在任务当前运行时收到进程信号时才会被调用。它不能替代 [超时](#worker-timeouts) 或任务的 [`failed` 方法](#cleaning-up-after-failed-jobs)。

<a name="job-expirations-and-timeouts"></a>
### 任务过期与超时

<a name="job-expiration"></a>
#### 任务过期

在 `config/queue.php` 配置文件中，每个队列连接都定义了一个 `retry_after` 选项。该选项指定了队列连接在处理中的任务应当等待多少秒后再重试。例如，如果 `retry_after` 的值设为 `90`，那么当任务已处理 90 秒且未被释放或删除时，它会被释放回队列。通常，你应该将 `retry_after` 的值设为你的任务合理完成处理所需的最大秒数。

> [!WARNING]
> 唯一不包含 `retry_after` 值的队列连接是 Amazon SQS。SQS 会根据在 AWS 控制台中管理的 [默认可见性超时（Default Visibility Timeout）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html) 来重试任务。

<a name="worker-timeouts"></a>
#### 处理器超时

`queue:work` Artisan 命令提供了一个 `--timeout` 选项。默认情况下，`--timeout` 值为 60 秒。如果某个任务的处理时间超过了超时值所指定的秒数，处理该任务的处理器将报错退出。通常，处理器会被 [服务器上配置的进程管理器](#supervisor-configuration) 自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置选项与 `--timeout` CLI 选项是不同的，但它们协同工作，以确保任务不会丢失，并且每个任务只被成功处理一次。

> [!WARNING]
> `--timeout` 值应始终比 `retry_after` 配置值至少短几秒。这样可以确保处理冻结任务的处理器总是在任务被重试之前被终止。如果你的 `--timeout` 选项长于 `retry_after` 配置值，你的任务可能会被处理两次。

<a name="pausing-and-resuming-queue-workers"></a>
### 暂停与恢复队列处理器

有时你可能需要临时阻止队列处理器处理新任务，而无需完全停止处理器。例如，你可能希望在系统维护期间暂停任务处理。Laravel 提供了 `queue:pause` 和 `queue:continue` Artisan 命令来暂停和恢复队列处理器。

要暂停特定队列，请提供队列连接名和队列名：

```shell
php artisan queue:pause database:default
```

在此示例中，`database` 是队列连接名，`default` 是队列名。一旦某个队列被暂停，任何正在处理该队列任务的工人都会继续完成其当前任务，但在队列恢复之前不会接收任何新任务。

要暂停每个连接上每个队列的任务处理，请使用 `--all` 选项：

```shell
php artisan queue:pause --all
```

要恢复已暂停队列上的任务处理，请使用 `queue:continue` 命令：

```shell
php artisan queue:continue database:default
```

要恢复每个连接上每个队列的任务处理，请对 `queue:resume` 命令使用 `--all` 选项：

```shell
php artisan queue:resume --all
```

恢复队列后，处理器会立即开始处理来自该队列的新任务。恢复所有队列并不会恢复那些被单独暂停的队列。请注意，暂停一个队列并不会停止处理器进程本身——它只是阻止处理器处理来自指定队列的新任务。

<a name="worker-restart-and-pause-signals"></a>
#### 处理器重启与暂停信号

默认情况下，队列处理器会在每次任务迭代时轮询缓存驱动以获取重启和暂停信号。虽然这种轮询对于响应 `queue:restart` 和 `queue:pause` 命令至关重要，但它确实会带来少量的性能开销。

如果你需要优化性能，并且不需要这些中断特性，可以通过调用 `Queue` facade 的 `withoutInterruptionPolling` 方法在全局禁用此轮询。这通常应该在 `AppServiceProvider` 的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Queue;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Queue::withoutInterruptionPolling();
}
```

或者，你可以通过设置 `Illuminate\Queue\Worker` 类上的静态 `$restartable` 或 `$pausable` 属性，分别禁用重启或暂停轮询：

```php
use Illuminate\Queue\Worker;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Worker::$restartable = false;
    Worker::$pausable = false;
}
```

> [!WARNING]
> 当中断轮询被禁用时，处理器将不会响应 `queue:restart` 或 `queue:pause` 命令（取决于哪些特性被禁用）。

<a name="supervisor-configuration"></a>
## Supervisor 配置

在生产环境中，你需要一种方法来保持 `queue:work` 进程持续运行。一个 `queue:work` 进程可能因为多种原因停止运行，例如处理器超时或执行了 `queue:restart` 命令。

因此，你需要配置一个进程监视器，它能够检测到 `queue:work` 进程何时退出并自动重启它们。此外，进程监视器还允许你指定希望并发运行多少个 `queue:work` 进程。Supervisor 是 Linux 环境中常用的进程监视器，我们将在下面的文档中讨论如何配置它。

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是适用于 Linux 操作系统的进程监视器，如果 `queue:work` 进程失败，它会自动重启它们。要在 Ubuntu 上安装 Supervisor，可以使用以下命令：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自行配置和管理 Supervisor 听起来让你感到棘手，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它提供了一个完全托管的平台来运行 Laravel 队列处理器。

<a name="configuring-supervisor"></a>
#### 配置 Supervisor

Supervisor 配置文件通常存储在 `/etc/supervisor/conf.d` 目录中。在该目录下，你可以创建任意数量的配置文件来指示 Supervisor 如何监视你的进程。例如，让我们创建一个 `laravel-worker.conf` 文件，用于启动并监视 `queue:work` 进程：

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/app.com/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=forge
numprocs=8
redirect_stderr=true
stdout_logfile=/home/forge/app.com/worker.log
stopwaitsecs=3600
```

在此示例中，`numprocs` 指令会指示 Supervisor 运行八个 `queue:work` 进程并监视它们全部，在它们失败时自动重启。你应该修改配置中的 `command` 指令，以反映你期望的队列连接和处理器选项。

> [!WARNING]
> 你应该确保 `stopwaitsecs` 的值大于你运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成之前将其杀死。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

配置文件创建完成后，你可以使用以下命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start "laravel-worker:*"
```

有关 Supervisor 的更多信息，请参阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="dealing-with-failed-jobs"></a>
## 处理失败的任务

有时你的队列任务会失败。别担心，事情并不总是按计划进行！Laravel 提供了一种便捷的方式来 [指定任务应当被尝试的最大次数](#max-job-attempts-and-timeout)。当一个异步任务超过了这个尝试次数后，它会被插入到 `failed_jobs` 数据库表中。[同步分发的任务](/docs/{{version}}/queues#synchronous-dispatching) 如果失败，不会被存储在该表中，其异常会立即由应用处理。

用于创建 `failed_jobs` 表的迁移通常已经存在于新的 Laravel 应用中。不过，如果你的应用不包含该表的迁移，你可以使用 `make:queue-failed-table` 命令来创建该迁移：

```shell
php artisan make:queue-failed-table

php artisan migrate
```

在运行 [队列处理器](#running-the-queue-worker) 进程时，你可以使用 `queue:work` 命令上的 `--tries` 开关指定任务应当被尝试的最大次数。如果你没有为 `--tries` 选项指定值，任务将只被尝试一次，或按照任务类 `Tries` 属性指定的次数尝试：

```shell
php artisan queue:work redis --tries=3
```

使用 `--backoff` 选项，你可以指定 Laravel 在重试遇到异常的任务之前应当等待多少秒。默认情况下，任务会立即被释放回队列，以便可以再次尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你希望按每个任务来配置 Laravel 在重试遇到异常的任务之前应当等待的秒数，可以在任务类上使用 `Backoff` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Backoff;

#[Backoff(3)]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

如果你需要更复杂的逻辑来确定任务的退避时间，可以在任务类上定义一个 `backoff` 方法：

```php
/**
 * 计算重试任务之前应等待的秒数。
 */
public function backoff(): int
{
    return 3;
}
```

你可以通过定义一个退避值数组来轻松配置「指数」退避。在此示例中，重试延迟为：第一次重试 1 秒，第二次重试 5 秒，第三次重试 10 秒，如果还有剩余尝试次数，则后续每次重试均为 10 秒：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Backoff;

#[Backoff([1, 5, 10])]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

<a name="cleaning-up-after-failed-jobs"></a>
### 失败后清理

当某个特定任务失败时，你可能希望向用户发送警报，或回滚该任务部分完成的操作。为此，你可以在任务类上定义一个 `failed` 方法。导致任务失败的 `Throwable` 实例会被传递给 `failed` 方法：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        public Podcast $podcast,
    ) {}

    /**
     * 执行任务。
     */
    public function handle(AudioProcessor $processor): void
    {
        // 处理上传的播客……
    }

    /**
     * 处理任务失败。
     */
    public function failed(?Throwable $exception): void
    {
        // 向用户发送失败通知，等等……
    }
}
```

> [!WARNING]
> 在调用 `failed` 方法之前，会实例化任务的一个新实例；因此，在 `handle` 方法内发生的任何类属性修改都会丢失。

失败的任务不一定是指遇到了未处理异常的任务。当一个任务耗尽了所有允许的尝试次数时，也可能被视为失败。这些尝试可以通过以下几种方式被消耗：

<div class="content-list" markdown="1">

- 任务超时。
- 任务在执行期间遇到未处理的异常。
- 任务被手动或通过中间件释放回队列。

</div>

如果最后一次尝试因任务执行期间抛出的异常而失败，该异常会被传递给任务的 `failed` 方法。然而，如果任务是因为达到了允许的最大尝试次数而失败，那么 `$exception` 将是 `Illuminate\Queue\MaxAttemptsExceededException` 的实例。类似地，如果任务是因为超过了配置的超时时间而失败，那么 `$exception` 将是 `Illuminate\Queue\TimeoutExceededException` 的实例。

<a name="retrying-failed-jobs"></a>
### 重试失败的任务

要查看所有已插入 `failed_jobs` 数据库表的失败任务，可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令会列出任务 ID、连接、队列、失败时间以及有关该任务的其他信息。任务 ID 可用于重试失败的任务。例如，要重试 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败任务，请发出以下命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如有需要，你可以向命令传递多个 ID：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你也可以重试特定队列中的所有失败任务：

```shell
php artisan queue:retry --queue=name
```

要重试你所有的失败任务，请执行 `queue:retry` 命令并将 `all` 作为 ID 传入：

```shell
php artisan queue:retry all
```

如果你希望删除一个失败任务，可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> [!NOTE]
> 在使用 [Horizon](/docs/{{version}}/horizon) 时，你应该使用 `horizon:forget` 命令来删除失败任务，而不是 `queue:forget` 命令。

要从 `failed_jobs` 表中删除你所有的失败任务，可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

`queue:flush` 命令会从你的队列中移除所有失败任务记录，无论失败任务有多久。你可以使用 `--hours` 选项，仅删除在特定小时数之前失败的记录：

```shell
php artisan queue:flush --hours=48
```

<a name="ignoring-missing-models"></a>
### 忽略缺失的模型

当向任务注入一个 Eloquent 模型时，该模型在放入队列之前会被自动序列化，并在任务被处理时从数据库中重新检索。然而，如果模型在任务等待处理器处理期间被删除，你的任务可能会因 `ModelNotFoundException` 而失败。

为方便起见，你可以使用任务类上的 `DeleteWhenMissingModels` 属性，自动删除那些模型缺失的任务。当该属性存在时，Laravel 会静默丢弃该任务，而不会抛出异常：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\DeleteWhenMissingModels;

#[DeleteWhenMissingModels]
class ProcessPodcast implements ShouldQueue
{
    // ……
}
```

<a name="pruning-failed-jobs"></a>
### 清理失败的任务

你可以通过调用 `queue:prune-failed` Artisan 命令来清理应用 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败任务记录都会被清理。如果你向命令提供 `--hours` 选项，则只会保留最近 N 小时内插入的失败任务记录。例如，以下命令会删除所有在 48 小时之前插入的失败任务记录：

```shell
php artisan queue:prune-failed --hours=48
```

<a name="storing-failed-jobs-in-dynamodb"></a>
### 在 DynamoDB 中存储失败的任务

Laravel 还支持将失败任务记录存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库表中。不过，你必须手动创建一张 DynamoDB 表来存放所有的失败任务记录。通常，这张表应当命名为 `failed_jobs`，但你应根据应用 `queue` 配置文件中 `queue.failed.table` 配置的值来命名该表。

`failed_jobs` 表应当有一个名为 `application` 的字符串主分区键，以及一个名为 `uuid` 的字符串主排序键。键的 `application` 部分将包含你应用 `app` 配置文件中 `name` 配置值所定义的应用名称。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表为多个 Laravel 应用存储失败任务。

此外，请确保安装了 AWS SDK，以便你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `queue.failed.driver` 配置选项的值设为 `dynamodb`。此外，你应该在失败任务配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于与 AWS 进行身份认证。使用 `dynamodb` 驱动时，`queue.failed.database` 配置选项是不必要的：

```php
'failed' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'failed_jobs',
],
```

<a name="disabling-failed-job-storage"></a>
### 禁用失败任务存储

你可以通过将 `queue.failed.driver` 配置选项的值设为 `null`，指示 Laravel 丢弃失败的任务而不存储它们。通常，这可以通过 `QUEUE_FAILED_DRIVER` 环境变量来完成：

```ini
QUEUE_FAILED_DRIVER=null
```

<a name="failed-job-events"></a>
### 失败任务事件

如果你希望注册一个在任务失败时会被调用的事件监听器，可以使用 `Queue` facade 的 `failing` 方法。例如，我们可以从 Laravel 自带的 `AppServiceProvider` 的 `boot` 方法中，向该事件附加一个闭包：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Queue\Events\JobFailed;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ……
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Queue::failing(function (JobFailed $event) {
            // $event->connectionName
            // $event->job
            // $event->exception
        });
    }
}
```

<a name="clearing-jobs-from-queues"></a>
## 从队列清除任务

> [!NOTE]
> 在使用 [Horizon](/docs/{{version}}/horizon) 时，你应该使用 `horizon:clear` 命令来清除队列中的任务，而不是 `queue:clear` 命令。

如果你希望删除默认连接上默认队列中的所有任务，可以使用 `queue:clear` Artisan 命令：

```shell
php artisan queue:clear
```

你也可以提供 `connection` 参数和 `queue` 选项，以从特定的连接和队列中删除任务：

```shell
php artisan queue:clear redis --queue=emails
```

> [!WARNING]
> 从队列清除任务仅适用于 SQS、Redis 和 database 队列驱动。此外，SQS 消息删除过程最多需要 60 秒，因此在你清空队列后最多 60 秒内发送到 SQS 队列的任务也可能被删除。

<a name="monitoring-your-queues"></a>
## 监控你的队列

如果你的队列突然涌入大量任务，它可能会被压垮，导致任务完成需要漫长的等待时间。如果你愿意，当队列任务数量超过指定阈值时，Laravel 可以向你发出警报。

要开始使用，你应该将 `queue:monitor` 命令 [调度为每分钟运行](/docs/{{version}}/scheduling)。该命令接受你希望监控的队列名称，以及你期望的任务数量阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅调度此命令不足以触发通知来提醒你队列处于过载状态。当该命令遇到任务数量超过阈值的队列时，会分发一个 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在应用的 `AppServiceProvider` 中监听此事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\QueueHasLongWaitTime;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Event::listen(function (QueueBusy $event) {
        Notification::route('mail', 'dev@example.com')
            ->notify(new QueueHasLongWaitTime(
                $event->connectionName,
                $event->queue,
                $event->size
            ));
    });
}
```

<a name="testing"></a>
## 测试

在测试分发任务的代码时，你可能希望指示 Laravel 不要真正执行任务本身，因为任务的代码可以直接、独立于分发它的代码进行测试。当然，要测试任务本身，你可以实例化一个任务实例，并在测试中直接调用其 `handle` 方法。

你可以使用 `Queue` facade 的 `fake` 方法来阻止可入队任务被真正推送到队列。在调用 `Queue` facade 的 `fake` 方法之后，你可以断言应用尝试将任务推送到队列：

```php tab=Pest
<?php

use App\Jobs\AnotherJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;

test('orders can be shipped', function () {
    Queue::fake();

    // 执行订单发货……

    // 断言没有任务被推送……
    Queue::assertNothingPushed();

    // 断言某个任务被推送到给定队列……
    Queue::assertPushedOn('queue-name', ShipOrder::class);

    // 断言某个任务被推送
    Queue::assertPushed(ShipOrder::class);

    // 断言某个任务恰好被推送一次……
    Queue::assertPushedOnce(ShipOrder::class);

    // 断言某个任务被推送两次……
    Queue::assertPushedTimes(ShipOrder::class, 2);

    // 断言某个任务未被推送……
    Queue::assertNotPushed(AnotherJob::class);

    // 断言一个闭包被推送到队列……
    Queue::assertClosurePushed();

    // 断言一个闭包未被推送到队列……
    Queue::assertClosureNotPushed();

    // 断言被推送的任务总数……
    Queue::assertCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Jobs\AnotherJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Queue::fake();

        // 执行订单发货……

        // 断言没有任务被推送……
        Queue::assertNothingPushed();

        // 断言某个任务被推送到给定队列……
        Queue::assertPushedOn('queue-name', ShipOrder::class);

        // 断言某个任务被推送
        Queue::assertPushed(ShipOrder::class);

        // 断言某个任务恰好被推送一次……
        Queue::assertPushedOnce(ShipOrder::class);

        // 断言某个任务被推送两次……
        Queue::assertPushedTimes(ShipOrder::class, 2);

        // 断言某个任务未被推送……
        Queue::assertNotPushed(AnotherJob::class);

        // 断言一个闭包被推送到队列……
        Queue::assertClosurePushed();

        // 断言一个闭包未被推送到队列……
        Queue::assertClosureNotPushed();

        // 断言被推送的任务总数……
        Queue::assertCount(3);
    }
}
```

你可以向 `assertPushed`、`assertNotPushed`、`assertClosurePushed` 或 `assertClosureNotPushed` 方法传递一个闭包，以断言某个通过给定「真值测试」的任务被推送了。如果至少有一个通过给定真值测试的任务被推送，则该断言会成功：

```php
use Illuminate\Queue\CallQueuedClosure;

Queue::assertPushed(function (ShipOrder $job) use ($order) {
    return $job->order->id === $order->id;
});

Queue::assertClosurePushed(function (CallQueuedClosure $job) {
    return $job->name === 'validate-order';
});
```

<a name="faking-a-subset-of-jobs"></a>
### 伪造部分任务

如果你只需要伪造特定的任务，同时允许其他任务正常运行，可以将应当被伪造的任务类名传递给 `fake` 方法：

```php tab=Pest
test('orders can be shipped', function () {
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货……

    // 断言某个任务被推送两次……
    Queue::assertPushedTimes(ShipOrder::class, 2);
});
```

```php tab=PHPUnit
public function test_orders_can_be_shipped(): void
{
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货……

    // 断言某个任务被推送两次……
    Queue::assertPushedTimes(ShipOrder::class, 2);
}
```

你可以使用 `except` 方法伪造除一组指定任务之外的所有任务：

```php
Queue::fake()->except([
    ShipOrder::class,
]);
```

<a name="testing-job-chains"></a>
### 测试任务链

要测试任务链，你需要利用 `Bus` facade 的伪造能力。`Bus` facade 的 `assertChained` 方法可用于断言一个 [任务链](/docs/{{version}}/queues#job-chaining) 已被分发。`assertChained` 方法接受一组链式任务作为第一个参数：

```php
use App\Jobs\RecordShipment;
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ……

Bus::assertChained([
    ShipOrder::class,
    RecordShipment::class,
    UpdateInventory::class
]);
```

如上面的示例所示，链式任务的数组可以是一组任务类名。不过，你也可以提供一组实际任务实例。这样做时，Laravel 会确保这些任务实例与你的应用分发的链式任务属于同一个类，并且具有相同的属性值：

```php
Bus::assertChained([
    new ShipOrder,
    new RecordShipment,
    new UpdateInventory,
]);
```

你可以使用 `assertDispatchedWithoutChain` 方法来断言某个任务是在没有任务链的情况下被推送的：

```php
Bus::assertDispatchedWithoutChain(ShipOrder::class);
```

<a name="testing-chain-modifications"></a>
#### 测试链修改

如果链式任务 [向已有的链前置或追加了任务](#adding-jobs-to-the-chain)，你可以使用任务的 `assertHasChain` 方法来断言该任务拥有预期的剩余任务链：

```php
$job = new ProcessPodcast;

$job->handle();

$job->assertHasChain([
    new TranscribePodcast,
    new OptimizePodcast,
    new ReleasePodcast,
]);
```

`assertDoesntHaveChain` 方法可用于断言任务的剩余链为空：

```php
$job->assertDoesntHaveChain();
```

<a name="testing-chained-batches"></a>
#### 测试链式批处理

如果你的任务链 [包含一个任务批处理](#chains-and-batches)，你可以通过在链断言中插入一个 `Bus::chainedBatch` 定义，来断言该链式批处理符合你的预期：

```php
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::assertChained([
    new ShipOrder,
    Bus::chainedBatch(function (PendingBatch $batch) {
        return $batch->jobs->count() === 3;
    }),
    new UpdateInventory,
]);
```

<a name="testing-job-batches"></a>
### 测试任务批处理

`Bus` facade 的 `assertBatched` 方法可用于断言一个 [任务批处理](/docs/{{version}}/queues#job-batching) 已被分发。提供给 `assertBatched` 方法的闭包会接收一个 `Illuminate\Bus\PendingBatch` 实例，可用于检查批处理中的任务：

```php
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ……

Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->name == 'Import CSV' &&
           $batch->jobs->count() === 10;
});
```

可以在待处理批处理上使用 `hasJobs` 方法来验证该批处理包含预期的任务。该方法接受一组任务实例、类名或闭包：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        new ProcessCsvRow(row: 1),
        new ProcessCsvRow(row: 2),
        new ProcessCsvRow(row: 3),
    ]);
});
```

使用闭包时，闭包会接收任务实例。预期的任务类型会从闭包的类型提示中推断：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        fn (ProcessCsvRow $job) => $job->row === 1,
        fn (ProcessCsvRow $job) => $job->row === 2,
        fn (ProcessCsvRow $job) => $job->row === 3,
    ]);
});
```

你可以使用 `assertBatchCount` 方法来断言已分发给定数量的批处理：

```php
Bus::assertBatchCount(3);
```

你可以使用 `assertNothingBatched` 来断言没有分发任何批处理：

```php
Bus::assertNothingBatched();
```

<a name="testing-job-batch-interaction"></a>
#### 测试任务 / 批处理交互

此外，有时你可能需要测试单个任务与其底层批处理的交互。例如，你可能需要测试某个任务是否取消了对其批处理的进一步处理。为此，你需要通过 `withFakeBatch` 方法将一个伪造的批处理分配给该任务。`withFakeBatch` 方法返回一个包含任务实例和伪造批处理的元组（tuple）：

```php
[$job, $batch] = (new ShipOrder)->withFakeBatch();

$job->handle();

$this->assertTrue($batch->cancelled());
$this->assertEmpty($batch->added);
```

<a name="testing-job-queue-interactions"></a>
### 测试任务 / 队列交互

有时，你可能需要测试一个队列任务 [将其自身释放回队列](#manually-releasing-a-job)。或者，你可能需要测试任务删除了自身。你可以通过实例化任务并调用 `withFakeQueueInteractions` 方法来测试这些队列交互。

一旦任务的队列交互被伪造，你就可以调用任务的 `handle` 方法。调用任务后，可以使用各种断言方法来验证任务的队列交互：

```php
use App\Exceptions\CorruptedAudioException;
use App\Jobs\ProcessPodcast;

$job = (new ProcessPodcast)->withFakeQueueInteractions();

$job->handle();

$job->assertReleased(delay: 30);
$job->assertDeleted();
$job->assertNotDeleted();
$job->assertFailed();
$job->assertFailedWith(CorruptedAudioException::class);
$job->assertNotFailed();
```

<a name="job-events"></a>
## 任务事件

使用 `Queue` [facade](/docs/{{version}}/facades) 上的 `before` 和 `after` 方法，你可以指定在可入队任务被处理之前或之后执行的回调。这些回调非常适合用来执行额外的日志记录，或为一个仪表盘增加统计信息。通常，你应该在 [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中调用这些方法。例如，我们可以使用 Laravel 自带的 `AppServiceProvider`：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ……
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Queue::before(function (JobProcessing $event) {
            // $event->connectionName
            // $event->job
            // $event->job->payload()
        });

        Queue::after(function (JobProcessed $event) {
            // $event->connectionName
            // $event->job
            // $event->job->payload()
        });
    }
}
```

使用 `Queue` [facade](/docs/{{version}}/facades) 上的 `looping` 方法，你可以指定在处理器尝试从队列中获取任务之前执行的回调。例如，你可以注册一个闭包来回滚由之前失败的任务遗留下的任何未提交事务：

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

Queue::looping(function () {
    while (DB::transactionLevel() > 0) {
        DB::rollBack();
    }
});
```

当队列处理器无法从队列中检索到任务时，Laravel 还会分发一个 `Illuminate\Queue\Events\WorkerIdle` 事件：

```php
use Illuminate\Queue\Events\WorkerIdle;
use Illuminate\Support\Facades\Event;

Event::listen(function (WorkerIdle $event) {
    // $event->connectionName
    // $event->queue
    // $event->workerOptions
});
```
