# 队列

- [简介](#introduction)
    - [连接与队列](#connections-vs-queues)
    - [驱动说明与前提条件](#driver-prerequisites)
- [创建任务](#creating-jobs)
    - [生成任务类](#generating-job-classes)
    - [类结构](#class-structure)
    - [唯一任务](#unique-jobs)
    - [加密任务](#encrypted-jobs)
- [任务中间件](#job-middleware)
    - [速率限制](#rate-limiting)
    - [防止任务重叠](#preventing-job-overlaps)
    - [异常节流](#throttling-exceptions)
    - [跳过任务](#skipping-jobs)
- [分发任务](#dispatching-jobs)
    - [延迟分发](#delayed-dispatching)
    - [同步分发](#synchronous-dispatching)
    - [任务与数据库事务](#jobs-and-database-transactions)
    - [任务链](#job-chaining)
    - [自定义队列与连接](#customizing-the-queue-and-connection)
    - [指定任务最大尝试次数 / 超时值](#max-job-attempts-and-timeout)
    - [SQS FIFO 与公平队列](#sqs-fifo-and-fair-queues)
    - [队列故障转移](#queue-failover)
    - [错误处理](#error-handling)
- [任务批处理](#job-batching)
    - [定义可批处理任务](#defining-batchable-jobs)
    - [分发批次](#dispatching-batches)
    - [链与批次](#chains-and-batches)
    - [向批次添加任务](#adding-jobs-to-batches)
    - [检查批次](#inspecting-batches)
    - [取消批次](#cancelling-batches)
    - [批次失败](#batch-failures)
    - [清理批次](#pruning-batches)
    - [在 DynamoDB 中存储批次](#storing-batches-in-dynamodb)
- [队列化闭包](#queueing-closures)
- [运行队列工作进程](#running-the-queue-worker)
    - [`queue:work` 命令](#the-queue-work-command)
    - [队列优先级](#queue-priorities)
    - [队列工作进程与部署](#queue-workers-and-deployment)
    - [任务过期与超时](#job-expirations-and-timeouts)
    - [暂停与恢复队列工作进程](#pausing-and-resuming-queue-workers)
- [Supervisor 配置](#supervisor-configuration)
- [处理失败任务](#dealing-with-failed-jobs)
    - [失败任务的清理工作](#cleaning-up-after-failed-jobs)
    - [重试失败任务](#retrying-failed-jobs)
    - [忽略缺失模型](#ignoring-missing-models)
    - [清理失败任务](#pruning-failed-jobs)
    - [在 DynamoDB 中存储失败任务](#storing-failed-jobs-in-dynamodb)
    - [禁用失败任务存储](#disabling-failed-job-storage)
    - [失败任务事件](#failed-job-events)
- [从队列中清除任务](#clearing-jobs-from-queues)
- [监控队列](#monitoring-your-queues)
- [测试](#testing)
    - [模拟部分任务](#faking-a-subset-of-jobs)
    - [测试任务链](#testing-job-chains)
    - [测试任务批次](#testing-job-batches)
    - [测试任务 / 队列交互](#testing-job-queue-interactions)
- [任务事件](#job-events)

<a name="introduction"></a>
## 简介

在构建 Web 应用时，你可能会遇到一些耗时过久、无法在常规 Web 请求中完成的任务，例如解析并存储上传的 CSV 文件。好在 Laravel 允许你轻松创建可在后台处理的队列任务。通过把耗时的任务转移到队列中，你的应用可以极速响应 Web 请求，为用户带来更好的体验。

Laravel 队列为各种不同的队列后端提供了统一的队列 API，例如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io)，甚至是关系型数据库。

Laravel 的队列配置选项存储在应用的 `config/queue.php` 配置文件中。在该文件中，你可以找到框架内置的各个队列驱动的连接配置，包括 database、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及一个会立即执行任务的同步驱动（供开发或测试时使用）。此外还包含一个会丢弃队列任务的 `null` 队列驱动。

> [!NOTE]
> Laravel Horizon 是一套为 Redis 队列打造的精美仪表盘和配置系统。请查阅完整的 [Horizon 文档](/docs/{{version}}/horizon)了解更多信息。

<a name="connections-vs-queues"></a>
### 连接与队列

在开始使用 Laravel 队列之前，理解「连接（connection）」与「队列（queue）」的区别非常重要。在 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。该选项定义了指向后端队列服务（如 Amazon SQS、Beanstalk 或 Redis）的连接。而任何一个给定的队列连接，都可能拥有多个「队列」，可以把它们想象成一组组不同的堆栈或堆放的任务。

注意，`queue` 配置文件中的每个连接配置示例都包含一个 `queue` 属性。这是任务被发送到给定连接时，默认要分发到的队列。换句话说，如果你分发任务时没有显式指定它应进入哪个队列，该任务就会被放到连接配置中 `queue` 属性所定义的队列上：

```php
use App\Jobs\ProcessPodcast;

// 该任务会被发送到默认连接的默认队列...
ProcessPodcast::dispatch();

// 该任务会被发送到默认连接的 "emails" 队列...
ProcessPodcast::dispatch()->onQueue('emails');
```

有些应用可能完全不需要将任务推送到多个队列，只用一个简单的队列就够了。不过，对于希望对任务的处理方式划分优先级或进行分段的应用来说，将任务推送到多个队列尤其有用，因为 Laravel 的队列工作进程允许你按优先级指定它要处理哪些队列。例如，如果你把任务推送到 `high` 队列，就可以运行一个工作进程，给予这些任务更高的处理优先级：

```shell
php artisan queue:work --queue=high,default
```

<a name="driver-prerequisites"></a>
### 驱动说明与前提条件

<a name="database"></a>
#### Database

要使用 `database` 队列驱动，你需要一张数据库表来存放任务。通常，这已包含在 Laravel 默认的 `0001_01_01_000002_create_jobs_table.php` [数据库迁移](/docs/{{version}}/migrations)中；不过，如果你的应用不包含这个迁移，可以使用 `make:queue-table` Artisan 命令来创建它：

```shell
php artisan make:queue-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

要使用 `redis` 队列驱动，你应该在 `config/database.php` 配置文件中配置一个 Redis 数据库连接。

> [!WARNING]
> `redis` 队列驱动不支持 `serializer` 和 `compression` Redis 选项。

<a name="redis-cluster"></a>
##### Redis 集群

如果你的 Redis 队列连接使用 [Redis 集群（Redis Cluster）](https://redis.io/docs/latest/operate/rs/databases/durability-ha/clustering)，那么队列名必须包含[键哈希标签（key hash tag）](https://redis.io/docs/latest/develop/using-commands/keyspace/#hashtags)。这样才能确保给定队列的所有 Redis 键都落在同一个哈希槽中：

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

使用 Redis 队列时，你可以使用 `block_for` 配置选项，指定驱动在重新遍历工作进程循环并再次轮询 Redis 数据库之前，应等待多久才能等到可用任务。

根据队列负载调整该值，可能比持续轮询 Redis 数据库获取新任务更高效。例如，你可以将该值设置为 `5`，表示驱动在等待可用任务时应阻塞五秒：

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
> 将 `block_for` 设置为 `0` 会导致队列工作进程无限期阻塞，直到有可用任务为止。这也会导致 `SIGTERM` 等信号直到下一个任务处理完毕后才能得到处理。

<a name="other-driver-prerequisites"></a>
#### 其他驱动前提条件

下列列出的队列驱动需要以下依赖。这些依赖可以通过 Composer 包管理器安装：

- Amazon SQS: `aws/aws-sdk-php ~3.0`
- Beanstalkd: `pda/pheanstalk ~5.0`
- Redis: `predis/predis ~2.0` 或 phpredis PHP 扩展
- [MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/): `mongodb/laravel-mongodb`

<a name="creating-jobs"></a>
## 创建任务

<a name="generating-job-classes"></a>
### 生成任务类

默认情况下，应用的所有可队列化任务都存储在 `app/Jobs` 目录中。如果 `app/Jobs` 目录不存在，运行 `make:job` Artisan 命令时会自动创建它：

```shell
php artisan make:job ProcessPodcast
```

生成的类会实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，以此告知 Laravel 该任务应被推送到队列中异步运行。

> [!NOTE]
> 可以使用[.stub 发布](/docs/{{version}}/artisan#stub-customization)来自定义任务桩（stub）。

<a name="class-structure"></a>
### 类结构

任务类非常简单，通常只包含一个 `handle` 方法，该方法在任务被队列处理时调用。开始之前，我们先来看一个示例任务类。在这个例子中，我们假设自己管理着一个播客发布服务，需要在播客文件发布前对其进行处理：

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
        // 处理已上传的播客...
    }
}
```

在上面的例子中，注意我们可以直接把一个 [Eloquent 模型](/docs/{{version}}/eloquent)传给队列任务的构造函数。由于任务使用了 `Queueable` Trait，在任务处理时，Eloquent 模型及其已加载的关联会被优雅地序列化和反序列化。

如果你的队列任务在构造函数中接收一个 Eloquent 模型，那么只有该模型的标识符会被序列化到队列中。当任务被实际处理时，队列系统会自动从数据库中重新检索完整的模型实例及其已加载的关联。这种模型序列化方式可以大大减小发送给队列驱动的任务载荷。

<a name="handle-method-dependency-injection"></a>
#### `handle` 方法依赖注入

`handle` 方法在任务被队列处理时调用。注意，我们可以在任务的 `handle` 方法上对依赖进行类型提示。Laravel [服务容器](/docs/{{version}}/container)会自动注入这些依赖。

如果你想完全掌控容器如何向 `handle` 方法注入依赖，可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接收一个回调，该回调会接收到任务和容器。在回调中，你可以随意按自己希望的方式调用 `handle` 方法。通常，你应该在 `App\Providers\AppServiceProvider` [服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

```php
use App\Jobs\ProcessPodcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Foundation\Application;

$this->app->bindMethod([ProcessPodcast::class, 'handle'], function (ProcessPodcast $job, Application $app) {
    return $job->handle($app->make(AudioProcessor::class));
});
```

> [!WARNING]
> 二进制数据（例如图片的原始内容）在传给队列任务之前，应先通过 `base64_encode` 函数处理。否则，任务在被放入队列时可能无法正确序列化为 JSON。

<a name="handling-relationships"></a>
#### 队列化关联

由于任务入队时，Eloquent 模型所有已加载的关联也会被序列化，序列化后的任务字符串有时会变得相当庞大。此外，当任务被反序列化并从数据库重新检索模型关联时，检索到的将是完整的关联数据。在任务入队过程中、模型序列化之前应用的任何关联约束，在任务被反序列化时都不会再生效。因此，如果你想操作某个关联的子集，应该在队列任务内部对该关联重新施加约束。

或者，为了防止关联被序列化，你可以在设置属性值时在模型上调用 `withoutRelations` 方法。该方法会返回一个不带已加载关联的模型实例：

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

如果你使用的是 [PHP 构造函数属性提升](https://www.php.net/manual/en/language.oop5.decon.php#language.oop5.decon.constructor.promotion)，并且想标明某个 Eloquent 模型的关联不应被序列化，可以使用 `WithoutRelations` 属性（Attribute）：

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

为方便起见，如果你想序列化所有不带关联的模型，可以将 `WithoutRelations` 属性应用于整个类，而无需在每个模型上分别应用该属性：

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

如果任务接收到的是 Eloquent 模型的集合或数组，而不是单个模型，那么当任务被反序列化并执行时，集合中各模型的关联不会被恢复。这是为了防止处理大量模型的任务过度消耗资源。

<a name="unique-jobs"></a>
### 唯一任务

> [!WARNING]
> 唯一任务需要使用支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

> [!WARNING]
> 唯一任务约束不适用于批次中的任务。

有时，你可能希望确保在任意时刻，队列中同一个任务只存在一个实例。要做到这一点，可以在任务类上实现 `ShouldBeUnique` 接口。该接口不要求你在类上定义任何额外的方法：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ...
}
```

在上面的例子中，`UpdateSearchIndex` 任务是唯一的。因此，如果该任务的另一个实例已在队列中且尚未处理完成，该任务就不会被分发。

在某些情况下，你可能想定义一个让任务保持唯一的特定「键」，或者指定一个超时时间，超过该时间后任务不再保持唯一。为此，你可以在任务类上定义 `uniqueId` 和 `uniqueFor` 属性或方法：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    /**
     * 商品实例。
     *
     * @var \App\Models\Product
     */
    public $product;

    /**
     * 任务的唯一锁经过该秒数后将被释放。
     *
     * @var int
     */
    public $uniqueFor = 3600;

    /**
     * 获取任务的唯一 ID。
     */
    public function uniqueId(): string
    {
        return $this->product->id;
    }
}
```

在上面的例子中，`UpdateSearchIndex` 任务以商品 ID 作为唯一标识。因此，在现有任务完成处理之前，任何使用相同商品 ID 的新分发都会被忽略。此外，如果现有任务在一小时内未被处理，唯一锁就会被释放，此时另一个使用相同唯一键的任务就可以被分发到队列中。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器分发任务，应确保所有服务器都与同一个中央缓存服务器通信，这样 Laravel 才能准确判断任务是否唯一。

<a name="keeping-jobs-unique-until-processing-begins"></a>
#### 让任务在开始处理前保持唯一

默认情况下，唯一任务在任务完成处理或重试全部失败后才会「解锁」。不过，有时你可能希望任务在开始处理之前就立即解锁。要做到这一点，你的任务应实现 `ShouldBeUniqueUntilProcessing` 契约，而不是 `ShouldBeUnique` 契约：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

<a name="unique-job-locks"></a>
#### 唯一任务锁

在底层，当 `ShouldBeUnique` 任务被分发时，Laravel 会尝试使用 `uniqueId` 键获取一个[锁](/docs/{{version}}/cache#atomic-locks)。如果锁已被持有，任务就不会被分发。当任务完成处理或重试全部失败时，该锁会被释放。默认情况下，Laravel 会使用默认缓存驱动来获取该锁。不过，如果你想使用另一个驱动来获取锁，可以定义一个 `uniqueVia` 方法，返回应使用的缓存驱动：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ...

    /**
     * 获取唯一任务锁所用的缓存驱动。
     */
    public function uniqueVia(): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只需要限制任务的并发处理，请改用 [WithoutOverlapping](/docs/{{version}}/queues#preventing-job-overlaps) 任务中间件。

<a name="encrypted-jobs"></a>
### 加密任务

Laravel 允许你通过[加密](/docs/{{version}}/encryption)来确保任务数据的隐私与完整性。开始使用很简单，只需在任务类上添加 `ShouldBeEncrypted` 接口。将该接口添加到类之后，Laravel 会在将任务推送到队列之前自动对其加密：

```php
<?php

use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateSearchIndex implements ShouldQueue, ShouldBeEncrypted
{
    // ...
}
```

<a name="job-middleware"></a>
## 任务中间件

任务中间件允许你将自定义逻辑包裹在队列任务的执行过程之外，从而减少任务本身的样板代码。例如，来看下面这个 `handle` 方法，它借助 Laravel 的 Redis 速率限制功能，做到每五秒只处理一个任务：

```php
use Illuminate\Support\Facades\Redis;

/**
 * 执行任务。
 */
public function handle(): void
{
    Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
        info('Lock obtained...');

        // 处理任务...
    }, function () {
        // 无法获取锁...

        return $this->release(5);
    });
}
```

虽然这段代码是有效的，但由于充斥着 Redis 速率限制逻辑，`handle` 方法的实现变得杂乱不堪。此外，对于我们想要进行速率限制的其他任务，这套限流逻辑还必须重复编写。与其在 handle 方法中做速率限制，不如定义一个专门处理速率限制的任务中间件：

```php
<?php

namespace App\Jobs\Middleware;

use Closure;
use Illuminate\Support\Facades\Redis;

class RateLimited
{
    /**
     * 处理队列任务。
     *
     * @param  \Closure(object): void  $next
     */
    public function handle(object $job, Closure $next): void
    {
        Redis::throttle('key')
            ->block(0)->allow(1)->every(5)
            ->then(function () use ($job, $next) {
                // 已获取锁...

                $next($job);
            }, function () use ($job) {
                // 无法获取锁...

                $job->release(5);
            });
    }
}
```

如你所见，与[路由中间件](/docs/{{version}}/middleware)类似，任务中间件会接收到正在处理的任务，以及一个应被调用来继续处理任务的回调。

你可以使用 `make:job-middleware` Artisan 命令生成新的任务中间件类。创建任务中间件后，可以通过任务的 `middleware` 方法返回它们，从而将中间件附加到任务上。`make:job` Artisan 命令生成的任务骨架中没有这个方法，因此你需要手动将它添加到你的任务类中：

```php
use App\Jobs\Middleware\RateLimited;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited];
}
```

> [!NOTE]
> 任务中间件也可以分配给[可队列化的事件监听器](/docs/{{version}}/events#queued-event-listeners)、[邮件](/docs/{{version}}/mail#queueing-mail)和[通知](/docs/{{version}}/notifications#queueing-notifications)。

<a name="rate-limiting"></a>
### 速率限制

虽然我们刚刚演示了如何编写自己的速率限制任务中间件，但实际上 Laravel 已经内置了一个可用于限制任务处理速率的中间件。与[路由速率限制器](/docs/{{version}}/routing#defining-rate-limiters)一样，任务速率限制器也是使用 `RateLimiter` Facade 的 `for` 方法定义的。

例如，你可能希望允许普通用户每小时备份一次数据，而对付费高级客户不施加此限制。为此，你可以在 `AppServiceProvider` 的 `boot` 方法中定义一个 `RateLimiter`：

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

在上面的例子中，我们定义了一个按小时的速率限制；不过，你也可以使用 `perMinute` 方法轻松定义按分钟的速率限制。此外，你可以向速率限制的 `by` 方法传递任何值；不过该值最常用于按客户划分速率限制：

```php
return Limit::perMinute(50)->by($job->user->id);
```

定义好速率限制后，你可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件将速率限制器附加到你的任务上。每当任务超过速率限制时，该中间件都会根据速率限制的时长，以适当的延迟将任务释放回队列：

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new RateLimited('backups')];
}
```

将一个被限速的任务释放回队列，仍会增加该任务的总 `attempts` 次数。你可能需要相应地调整任务类上的 `tries` 和 `maxExceptions` 属性。或者，你也可以使用 [retryUntil 方法](#time-based-attempts)来定义任务不再重试的时间点。

使用 `releaseAfter` 方法，你还可以指定被释放的任务需要经过多少秒后才会被再次尝试：

```php
/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new RateLimited('backups'))->releaseAfter(60)];
}
```

如果你不希望任务在被限速后重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取任务应通过的中间件。
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

如果你在使用 Redis，可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它专为 Redis 调优，比基础的速率限制中间件更高效：

```php
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

public function middleware(): array
{
    return [new RateLimitedWithRedis('backups')];
}
```

可以使用 `connection` 方法来指定中间件应使用的 Redis 连接：

```php
return [(new RateLimitedWithRedis('backups'))->connection('limiter')];
```

<a name="preventing-job-overlaps"></a>
### 防止任务重叠

Laravel 内置了一个 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，允许你根据任意键来防止任务重叠。当某个队列任务要修改一项同一时刻只应由一个任务修改的资源时，这个中间件会很有帮助。

例如，假设你有一个更新用户信用评分的队列任务，希望防止同一用户 ID 的信用评分更新任务发生重叠。为此，你可以在任务的 `middleware` 方法中返回 `WithoutOverlapping` 中间件：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new WithoutOverlapping($this->user->id)];
}
```

将一个发生重叠的任务释放回队列，仍会增加该任务的总尝试次数。你可能需要相应地调整任务类上的 `tries` 和 `maxExceptions` 属性。例如，让 `tries` 属性保持默认值 1，就可以防止任何重叠的任务在之后被重试。

同一类型的所有重叠任务都会被释放回队列。你还可以指定被释放的任务需要经过多少秒后才会被再次尝试：

```php
/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->releaseAfter(60)];
}
```

如果你想立即删除任何重叠的任务，使其不会被重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->dontRelease()];
}
```

`WithoutOverlapping` 中间件由 Laravel 的原子锁功能驱动。有时，你的任务可能会在意想不到的情况下失败或超时，导致锁未被释放。因此，你可以使用 `expireAfter` 方法显式定义锁的过期时间。例如，下面的示例会让 Laravel 在任务开始处理三分钟后释放 `WithoutOverlapping` 锁：

```php
/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new WithoutOverlapping($this->order->id))->expireAfter(180)];
}
```

> [!WARNING]
> `WithoutOverlapping` 中间件需要使用支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

<a name="sharing-lock-keys"></a>
#### 跨任务类共享锁键

默认情况下，`WithoutOverlapping` 中间件只会阻止同一个类的任务发生重叠。也就是说，两个不同的任务类虽然可能使用相同的锁键，但它们之间的重叠不会被阻止。不过，你可以使用 `shared` 方法，让 Laravel 将该键应用到所有任务类：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ProviderIsDown
{
    // ...

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}

class ProviderIsUp
{
    // ...

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

Laravel 内置了一个 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，允许你对异常进行节流。一旦任务抛出给定数量的异常，后续执行该任务的所有尝试都会被延迟，直到指定的时间间隔过去。对于与不稳定的第三方服务交互的任务，这个中间件尤其有用。

例如，假设有一个与第三方 API 交互的队列任务，该 API 开始抛出异常。要对异常进行节流，你可以在任务的 `middleware` 方法中返回 `ThrottlesExceptions` 中间件。通常，该中间件应与实现了[基于时间的尝试次数](#time-based-attempts)的任务搭配使用：

```php
use DateTime;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [new ThrottlesExceptions(10, 5 * 60)];
}

/**
 * 确定任务应超时的时间点。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 30);
}
```

该中间件接受的第一个构造参数是任务被节流前可以抛出的异常数量，第二个构造参数是任务被节流后，需要经过多少秒才会被再次尝试。在上面的代码示例中，如果任务连续抛出 10 个异常，我们会等待 5 分钟后再次尝试该任务，且受 30 分钟时间上限的约束。

当任务抛出异常但尚未达到异常阈值时，该任务通常会立即重试。不过，你可以在将该中间件附加到任务时调用 `backoff` 方法，指定此类任务应延迟的分钟数：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 5 * 60))->backoff(5)];
}
```

在内部，该中间件使用 Laravel 的缓存系统来实现速率限制，并将任务的类名用作缓存「键」。你可以在将该中间件附加到任务时调用 `by` 方法来覆盖该键。如果你有多个任务与同一个第三方服务交互，希望它们共享一个通用的节流「桶」，以确保共同遵守同一个共享限额，这可能很有用：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(10, 10 * 60))->by('key')];
}
```

默认情况下，该中间件会对每个异常进行节流。你可以在将该中间件附加到任务时调用 `when` 方法来修改这一行为。此后，只有当传递给 `when` 方法的闭包返回 `true` 时，异常才会被节流：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
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

与将任务释放回队列或抛出异常的 `when` 方法不同，`deleteWhen` 方法允许你在出现给定异常时彻底删除该任务：

```php
use App\Exceptions\CustomerDeletedException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
 *
 * @return array<int, object>
 */
public function middleware(): array
{
    return [(new ThrottlesExceptions(2, 10 * 60))->deleteWhen(CustomerDeletedException::class)];
}
```

如果你希望将被节流的异常上报给应用的异常处理器，可以在将该中间件附加到任务时调用 `report` 方法。你也可以选择向 `report` 方法传入一个闭包，此时只有当给定闭包返回 `true` 时，异常才会被上报：

```php
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取任务应通过的中间件。
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

如果你在使用 Redis，可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它专为 Redis 调优，比基础的异常节流中间件更高效：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis;

public function middleware(): array
{
    return [new ThrottlesExceptionsWithRedis(10, 10 * 60)];
}
```

可以使用 `connection` 方法来指定中间件应使用的 Redis 连接：

```php
return [(new ThrottlesExceptionsWithRedis(10, 10 * 60))->connection('limiter')];
```

<a name="skipping-jobs"></a>
### 跳过任务

`Skip` 中间件允许你指定某个任务应被跳过 / 删除，而无需修改任务的逻辑。`Skip::when` 方法会在给定条件为 `true` 时删除任务，而 `Skip::unless` 方法会在条件为 `false` 时删除任务：

```php
use Illuminate\Queue\Middleware\Skip;

/**
 * 获取任务应通过的中间件。
 */
public function middleware(): array
{
    return [
        Skip::when($condition),
    ];
}
```

你还可以向 `when` 和 `unless` 方法传入 `Closure`，以实现更复杂的条件判断：

```php
use Illuminate\Queue\Middleware\Skip;

/**
 * 获取任务应通过的中间件。
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

编写好任务类之后，你可以使用任务自身的 `dispatch` 方法来分发它。传递给 `dispatch` 方法的参数会被转交给任务的构造函数：

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
     * 存储新播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast);

        return redirect('/podcasts');
    }
}
```

如果你希望有条件地分发任务，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
ProcessPodcast::dispatchIf($accountActive, $podcast);

ProcessPodcast::dispatchUnless($accountSuspended, $podcast);
```

在新建的 Laravel 应用中，默认队列连接定义为 `database`。你可以通过修改应用 `.env` 文件中的 `QUEUE_CONNECTION` 环境变量，来指定其他默认队列连接。

<a name="delayed-dispatching"></a>
### 延迟分发

如果你希望指定某个任务不应立即对队列工作进程可用，可以在分发任务时使用 `delay` 方法。例如，让我们指定某个任务在分发 10 分钟后才可供处理：

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
     * 存储新播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast)
            ->delay(now()->plus(minutes: 10));

        return redirect('/podcasts');
    }
}
```

在某些情况下，任务可能配置了默认延迟。如果你需要绕过该延迟并分发任务以立即处理，可以使用 `withoutDelay` 方法：

```php
ProcessPodcast::dispatch($podcast)->withoutDelay();
```

> [!WARNING]
> Amazon SQS 队列服务的最大延迟时间为 15 分钟。

<a name="synchronous-dispatching"></a>
### 同步分发

如果你想立即（同步）分发一个任务，可以使用 `dispatchSync` 方法。使用该方法时，任务不会被放入队列，而是会在当前进程中立即执行：

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
     * 存储新播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatchSync($podcast);

        return redirect('/podcasts');
    }
}
```

<a name="deferred-dispatching"></a>
#### 延后分发

使用延后的同步分发，你可以将任务分发到当前进程中处理，但会在 HTTP 响应发送给用户之后执行。这样你就可以同步处理「排队」的任务，而不会拖慢用户的应用体验。要延后同步任务的执行，请将任务分发到 `deferred` 连接：

```php
RecordDelivery::dispatch($order)->onConnection('deferred');
```

`deferred` 连接同时也是默认的[故障转移队列](#queue-failover)。

类似地，`background` 连接会在 HTTP 响应发送给用户之后处理任务；不过，该任务是在单独派生的 PHP 进程中处理的，从而使 PHP-FPM / 应用工作进程可以腾出手来处理下一个传入的 HTTP 请求：

```php
RecordDelivery::dispatch($order)->onConnection('background');
```

<a name="jobs-and-database-transactions"></a>
### 任务与数据库事务

虽然在数据库事务中分发任务完全没有问题，但你应该特别注意确保任务确实能够成功执行。在事务中分发任务时，任务可能会在父事务提交之前就被某个工作进程处理。一旦发生这种情况，你在数据库事务中对模型或数据库记录所做的任何更新，可能尚未反映到数据库中。此外，在事务中创建的任何模型或数据库记录，可能还不存在于数据库中。

好在 Laravel 提供了多种方法来规避这个问题。第一种，你可以在队列连接的配置数组中设置 `after_commit` 连接选项：

```php
'redis' => [
    'driver' => 'redis',
    // ...
    'after_commit' => true,
],
```

当 `after_commit` 选项为 `true` 时，你可以在数据库事务中分发任务；不过，Laravel 会等到所有打开的父数据库事务提交后，才实际分发该任务。当然，如果当前没有打开的数据库事务，任务会被立即分发。

如果事务由于执行过程中出现异常而回滚，那么在该事务期间分发的任务将被丢弃。

> [!NOTE]
> 将 `after_commit` 配置选项设置为 `true`，还会让所有队列化的事件监听器、邮件、通知和广播事件，等到所有打开的数据库事务提交后才被分发。

<a name="specifying-commit-dispatch-behavior-inline"></a>
#### 内联指定提交时分发行为

即使你没有将 `after_commit` 队列连接配置选项设置为 `true`，你也可以指明某个特定任务应在所有打开的数据库事务提交后再分发。为此，你可以在分发操作后链式调用 `afterCommit` 方法：

```php
use App\Jobs\ProcessPodcast;

ProcessPodcast::dispatch($podcast)->afterCommit();
```

类似地，如果 `after_commit` 配置选项被设置为 `true`，你可以指明某个特定任务应立即分发，而不等待任何打开的数据库事务提交：

```php
ProcessPodcast::dispatch($podcast)->beforeCommit();
```

<a name="job-chaining"></a>
### 任务链

任务链允许你指定一个队列任务列表，这些任务将在主任务成功执行后按顺序依次运行。如果链中的某个任务失败，其余的任务将不会运行。要执行一条队列任务链，可以使用 `Bus` Facade 提供的 `chain` 方法。Laravel 的命令总线是队列任务分发所基于的底层组件：

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
        Podcast::update(/* ... */);
    },
])->dispatch();
```

> [!WARNING]
> 在任务中使用 `$this->delete()` 方法删除任务，并不能阻止链中后续任务被处理。只有当链中的某个任务失败时，链条才会停止执行。

<a name="chain-connection-queue"></a>
#### 链的连接与队列

如果你想为链中的任务指定应使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。除非队列任务被显式指定了不同的连接 / 队列，否则这些方法指定的连接和队列名将被用于链中的任务：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->onConnection('redis')->onQueue('podcasts')->dispatch();
```

<a name="adding-jobs-to-the-chain"></a>
#### 向链中添加任务

有时，你可能需要从链中的某个任务内部，向现有的任务链前部或尾部添加另一个任务。你可以使用 `prependToChain` 和 `appendToChain` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ...

    // 前插到当前链，紧随当前任务之后运行...
    $this->prependToChain(new TranscribePodcast);

    // 追加到当前链，在链的末尾运行...
    $this->appendToChain(new TranscribePodcast);
}
```

<a name="chain-failures"></a>
#### 链失败

链接任务时，你可以使用 `catch` 方法指定一个闭包，当链中的某个任务失败时该闭包会被调用。给定的回调会接收到导致任务失败的 `Throwable` 实例：

```php
use Illuminate\Support\Facades\Bus;
use Throwable;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->catch(function (Throwable $e) {
    // 链中的某个任务失败了...
})->dispatch();
```

> [!WARNING]
> 由于链回调会被序列化并由 Laravel 队列稍后执行，因此不应在链回调中使用 `$this` 变量。

<a name="customizing-the-queue-and-connection"></a>
### 自定义队列与连接

<a name="dispatching-to-a-particular-queue"></a>
#### 分发到特定队列

通过将任务推送到不同的队列，你可以对队列任务进行「分类」，甚至为各个队列分配不同数量的工作进程来划分优先级。请记住，这并不是把任务推送到队列配置文件中定义的不同队列「连接」，而只是推送到单个连接内的特定队列。要指定队列，请在分发任务时使用 `onQueue` 方法：

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
     * 存储新播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onQueue('processing');

        return redirect('/podcasts');
    }
}
```

或者，你也可以在任务的构造函数中调用 `onQueue` 方法来指定任务的队列：

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

> [!WARNING]
> 通过 `onQueue` 在构造函数中指定队列的方式只适用于任务类。对于[队列化的事件监听器](/docs/{{version}}/events#customizing-the-queue-connection-queue-name)，应改为在监听器类上定义 `viaQueue` 方法或 `$queue` 属性。

<a name="dispatching-to-a-particular-connection"></a>
#### 分发到特定连接

如果你的应用与多个队列连接交互，可以使用 `onConnection` 方法指定要将任务推送到哪个连接：

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
     * 存储新播客。
     */
    public function store(Request $request): RedirectResponse
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onConnection('sqs');

        return redirect('/podcasts');
    }
}
```

你可以将 `onConnection` 和 `onQueue` 方法串联起来，同时为任务指定连接和队列：

```php
ProcessPodcast::dispatch($podcast)
    ->onConnection('sqs')
    ->onQueue('processing');
```

或者，你也可以在任务的构造函数中调用 `onConnection` 方法来指定任务的连接：

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

<a name="max-job-attempts-and-timeout"></a>
### 指定任务最大尝试次数 / 超时值

<a name="max-attempts"></a>
#### 最大尝试次数

任务尝试次数是 Laravel 队列系统的核心概念，也是许多高级功能的基础。虽然乍看之下有些让人困惑，但在修改默认配置之前，理解它的工作原理非常重要。

当一个任务被分发时，它会被推送到队列上。随后某个工作进程会取出该任务并尝试执行它。这就是一次任务尝试。

然而，一次尝试并不一定意味着任务的 `handle` 方法被执行了。尝试也可能通过以下几种方式被「消耗」：

- 任务在执行过程中遇到未处理的异常。
- 任务通过 `$this->release()` 被手动释放回队列。
- `WithoutOverlapping` 或 `RateLimited` 等中间件未能获取到锁，将任务释放。
- 任务超时。
- 任务的 `handle` 方法运行并完成，且没有抛出异常。

你可能不希望无限期地反复尝试一个任务。因此，Laravel 提供了多种方式来指定任务可以被尝试的次数或时长。

> [!NOTE]
> 默认情况下，Laravel 只会尝试一个任务一次。如果你的任务使用了 `WithoutOverlapping` 或 `RateLimited` 之类的中间件，或者你在手动释放任务，那么很可能需要通过 `tries` 选项增加允许的尝试次数。

指定任务最大尝试次数的一种方式，是使用 Artisan 命令行上的 `--tries` 开关。该值将应用于该工作进程处理的所有任务，除非正在处理的任务自身指定了它允许被尝试的次数：

```shell
php artisan queue:work --tries=3
```

如果一个任务超过了其最大尝试次数，它将被视为「失败」任务。关于处理失败任务的更多信息，请查阅[失败任务文档](#dealing-with-failed-jobs)。如果向 `queue:work` 命令提供 `--tries=0`，任务将被无限期重试。

你也可以采取更细粒度的方式，直接在任务类上定义其最大尝试次数。如果任务上指定了最大尝试次数，它将优先于命令行提供的 `--tries` 值：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 任务允许被尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

如果你需要动态控制某个特定任务的最大尝试次数，可以在任务上定义一个 `tries` 方法：

```php
/**
 * 确定任务允许被尝试的次数。
 */
public function tries(): int
{
    return 5;
}
```

<a name="time-based-attempts"></a>
#### 基于时间的尝试次数

除了定义任务失败前允许被尝试的次数之外，你还可以定义一个时间点，超过该时间点后任务不再被尝试。这样，任务就可以在给定的时间范围内被尝试任意次数。要定义任务不再被尝试的时间点，请在任务类上添加一个 `retryUntil` 方法。该方法应返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 确定任务应超时的时间点。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 10);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 将优先采用 `retryUntil` 方法。

> [!NOTE]
> 你也可以在[队列化的事件监听器](/docs/{{version}}/events#queued-event-listeners)和[队列化的通知](/docs/{{version}}/notifications#queueing-notifications)上定义 `tries` 属性或 `retryUntil` 方法。

<a name="max-exceptions"></a>
#### 最大异常数

有时你可能希望任务可以被尝试很多次，但如果重试是由给定数量的未处理异常触发的（而不是由 `release` 方法直接释放的），任务就应该失败。为此，你可以在任务类上定义一个 `maxExceptions` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    /**
     * 任务允许被尝试的次数。
     *
     * @var int
     */
    public $tries = 25;

    /**
     * 任务失败前允许的未处理异常的最大数量。
     *
     * @var int
     */
    public $maxExceptions = 3;

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        Redis::throttle('key')->allow(10)->every(60)->then(function () {
            // 已获取锁，处理播客...
        }, function () {
            // 无法获取锁...
            return $this->release(10);
        });
    }
}
```

在这个例子中，如果应用无法获取 Redis 锁，任务会被释放十秒，并将持续重试最多 25 次。但是，如果任务抛出了三个未处理的异常，任务就会失败。

<a name="timeout"></a>
#### 超时

通常，你大致清楚自己的队列任务需要运行多久。因此，Laravel 允许你指定一个「超时」值。默认情况下，超时值为 60 秒。如果一个任务的处理时间超过了超时值指定的秒数，处理该任务的工作进程将报错退出。通常，工作进程会被[服务器上配置的进程管理器](#supervisor-configuration)自动重启。

任务可以运行的最大秒数，可以通过 Artisan 命令行上的 `--timeout` 开关来指定：

```shell
php artisan queue:work --timeout=30
```

如果任务因不断超时而超过其最大尝试次数，它将被标记为失败。

你也可以在任务类上定义该任务允许运行的最大秒数。如果任务上指定了超时值，它将优先于命令行上指定的任何超时值：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 任务超时前可以运行的秒数。
     *
     * @var int
     */
    public $timeout = 120;
}
```

有时，套接字或出站 HTTP 连接等 IO 阻塞型进程可能不会遵循你指定的超时值。因此，在使用这些功能时，你也应该尽量通过它们自身的 API 指定超时。例如，使用 [Guzzle](https://docs.guzzlephp.org) 时，你应该始终指定连接超时和请求超时值。

> [!WARNING]
> 必须安装 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展才能指定任务超时。此外，任务的「超时」值应始终小于其[「重试间隔」（retry after）](#job-expiration)值。否则，任务可能会在实际执行完毕或超时之前就被再次尝试。

<a name="failing-on-timeout"></a>
#### 超时即失败

如果你想指定某个任务在超时时应被标记为[失败](#dealing-with-failed-jobs)，可以在任务类上定义 `$failOnTimeout` 属性：

```php
/**
 * 指示任务超时时是否应被标记为失败。
 *
 * @var bool
 */
public $failOnTimeout = true;
```

> [!NOTE]
> 默认情况下，任务超时会消耗一次尝试机会，并被释放回队列（如果允许重试）。但是，如果你将任务配置为超时即失败，那么无论 tries 设置为何值，它都不会被重试。

<a name="sqs-fifo-and-fair-queues"></a>
### SQS FIFO 与公平队列

Laravel 支持 [Amazon SQS FIFO（先进先出）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html)队列，让你可以严格按照任务发送的顺序进行处理，并通过消息去重确保恰好一次（exactly-once）处理。

FIFO 队列需要一个消息组 ID 来决定哪些任务可以并行处理。具有相同组 ID 的任务会被顺序处理，而不同组 ID 的消息可以并发处理。

Laravel 提供了流式的 `onGroup` 方法，用于在分发任务时指定消息组 ID：

```php
ProcessOrder::dispatch($order)
    ->onGroup("customer-{$order->customer_id}");
```

SQS FIFO 队列支持消息去重，以确保恰好一次处理。在你的任务类中实现 `deduplicationId` 方法即可提供自定义的去重 ID：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessSubscriptionRenewal implements ShouldQueue
{
    use Queueable;

    // ...

    /**
     * 获取任务的去重 ID。
     */
    public function deduplicationId(): string
    {
        return "renewal-{$this->subscription->id}";
    }
}
```

<a name="fifo-listeners-mail-and-notifications"></a>
#### FIFO 监听器、邮件与通知

使用 FIFO 队列时，你还需要在监听器、邮件和通知上定义消息组。或者，你也可以将这些对象的队列化实例分发到非 FIFO 队列。

要为[队列化的事件监听器](/docs/{{version}}/events#queued-event-listeners)定义消息组，请在监听器上定义一个 `messageGroup` 方法。你也可以选择性地定义一个 `deduplicationId` 方法：

```php
<?php

namespace App\Listeners;

class SendShipmentNotification
{
    // ...

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

当发送将要进入 FIFO 队列的[邮件](/docs/{{version}}/mail)时，你应该在发送时调用 `onGroup` 方法，并可选地调用 `withDeduplicator` 方法：

```php
use App\Mail\InvoicePaid;
use Illuminate\Support\Facades\Mail;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

Mail::to($request->user())->send($invoicePaid);
```

当发送将要进入 FIFO 队列的[通知](/docs/{{version}}/notifications)时，你应该在发送时调用 `onGroup` 方法，并可选地调用 `withDeduplicator` 方法：

```php
use App\Notifications\InvoicePaid;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

$user->notify($invoicePaid);
```

<a name="queue-failover"></a>
### 队列故障转移

`failover` 队列驱动为推送任务到队列提供了自动故障转移功能。如果 `failover` 配置的主队列连接因任何原因失败，Laravel 会自动尝试将任务推送到列表中配置的下一个连接。当生产环境对队列可靠性要求很高时，这对于确保高可用性尤其有用。

要配置故障转移队列连接，请指定 `failover` 驱动，并提供一个按顺序尝试的连接名称数组。默认情况下，Laravel 已在应用的 `config/queue.php` 配置文件中附带了一份故障转移配置示例：

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

配置好使用 `failover` 驱动的连接后，你需要在应用的 `.env` 文件中将该故障转移连接设置为默认队列连接，才能使用故障转移功能：

```ini
QUEUE_CONNECTION=failover
```

接下来，为故障转移连接列表中的每个连接至少启动一个工作进程：

```bash
php artisan queue:work redis
php artisan queue:work database
```

> [!NOTE]
> 对于使用 `sync`、`background` 或 `deferred` 队列驱动的连接，你无需运行工作进程，因为这些驱动会在当前 PHP 进程内处理任务。

当队列连接操作失败并触发故障转移时，Laravel 会分发 `Illuminate\Queue\Events\QueueFailedOver` 事件，你可以借此上报或记录某个队列连接已发生故障。

> [!NOTE]
> 如果你使用 Laravel Horizon，请记住 Horizon 只管理 Redis 队列。如果你的故障转移列表中包含 `database`，你应该在运行 Horizon 的同时，运行一个常规的 `php artisan queue:work database` 进程。

<a name="error-handling"></a>
### 错误处理

如果任务在处理过程中抛出异常，该任务会被自动释放回队列，以便再次尝试。任务会不断被释放，直到达到应用允许的最大尝试次数。最大尝试次数由 `queue:work` Artisan 命令使用的 `--tries` 开关定义。或者，也可以在任务类上定义最大尝试次数。关于运行队列工作进程的更多信息，[请参阅下文](#running-the-queue-worker)。

<a name="manually-releasing-a-job"></a>
#### 手动释放任务

有时你可能希望手动将任务释放回队列，以便稍后再次尝试。你可以通过调用 `release` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ...

    $this->release();
}
```

默认情况下，`release` 方法会将任务释放回队列以供立即处理。不过，你可以向 `release` 方法传递一个整数或日期实例，指示队列在经过给定的秒数之前不要让该任务可供处理：

```php
$this->release(10);

$this->release(now()->plus(seconds: 10));
```

<a name="manually-failing-a-job"></a>
#### 手动将任务标记为失败

有时你可能需要手动将任务标记为「失败」。为此，你可以调用 `fail` 方法：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ...

    $this->fail();
}
```

如果你想因为捕获到的某个异常而将任务标记为失败，可以将该异常传递给 `fail` 方法。或者，为了方便，你也可以传递一个字符串错误消息，它会被自动转换为异常：

```php
$this->fail($exception);

$this->fail('Something went wrong.');
```

> [!NOTE]
> 有关失败任务的更多信息，请查阅[处理任务失败的文档](#dealing-with-failed-jobs)。

<a name="fail-jobs-on-exceptions"></a>
#### 特定异常时任务失败

`FailOnException` [任务中间件](#job-middleware)允许你在抛出特定异常时短路重试。这样，对于瞬时异常（例如外部 API 错误）可以重试，而对于持续性异常（例如用户权限被撤销）则让任务永久失败：

```php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\FailOnException;
use Illuminate\Support\Facades\Http;

class SyncChatHistory implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

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

        // ...
    }

    /**
     * 获取任务应通过的中间件。
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

Laravel 的任务批处理功能允许你轻松地并行执行一组任务，然后在这批任务执行完毕后执行某些操作。

在开始之前，你应该先创建一个数据库迁移来构建一张表，用于存放任务批次的元信息，例如完成百分比。这个迁移可以使用 `make:queue-batches-table` Artisan 命令生成：

```shell
php artisan make:queue-batches-table

php artisan migrate
```

<a name="defining-batchable-jobs"></a>
### 定义可批处理任务

要定义可批处理任务，你应该像往常一样[创建一个队列化任务](#creating-jobs)；不过，你还需要在任务类上添加 `Illuminate\Bus\Batchable` Trait。该 Trait 提供了对 `batch` 方法的访问，可用于检索任务当前执行所在的批次：

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
            // 判断批次是否已被取消...

            return;
        }

        // 导入 CSV 文件的一部分...
    }
}
```

<a name="dispatching-batches"></a>
### 分发批次

要分发一批任务，你应该使用 `Bus` Facade 的 `batch` 方法。当然，批处理主要在与完成回调结合使用时才最有用。因此，你可以使用 `then`、`catch` 和 `finally` 方法来为批次定义完成回调。这些回调被调用时，都会接收到一个 `Illuminate\Bus\Batch` 实例。

当运行多个队列工作进程时，批次中的任务会被并行处理。因此，任务完成的顺序可能与它们被添加到批次中的顺序不同。要了解如何顺序执行一系列任务，请查阅我们关于[任务链与批次](#chains-and-batches)的文档。

在这个例子中，我们假设要将一批任务入队，每个任务处理 CSV 文件中给定数量的行：

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
    // 批次已创建，但还没有添加任何任务...
})->progress(function (Batch $batch) {
    // 单个任务已成功完成...
})->then(function (Batch $batch) {
    // 所有任务均已成功完成...
})->catch(function (Batch $batch, Throwable $e) {
    // 检测到批次中的任务失败...
})->finally(function (Batch $batch) {
    // 批次已执行完毕...
})->dispatch();

return $batch->id;
```

批次的 ID 可以通过 `$batch->id` 属性访问，你可以在批次分发之后，用它来[查询 Laravel 命令总线](#inspecting-batches)以获取批次的信息。

> [!WARNING]
> 由于批次回调会被序列化并由 Laravel 队列稍后执行，因此不应在回调中使用 `$this` 变量。此外，由于批处理任务被包裹在数据库事务中，任务中不应执行会触发隐式提交的数据库语句。

<a name="naming-batches"></a>
#### 命名批次

如果批次有名字，[Laravel Horizon](/docs/{{version}}/horizon) 和 [Laravel Telescope](/docs/{{version}}/telescope) 等工具就能为批次提供更加用户友好的调试信息。要为批次指定任意名称，你可以在定义批次时调用 `name` 方法：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务均已成功完成...
})->name('Import CSV')->dispatch();
```

<a name="batch-connection-queue"></a>
#### 批次的连接与队列

如果你想为批处理任务指定应使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。所有批处理任务必须在同一个连接和队列中执行：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务均已成功完成...
})->onConnection('redis')->onQueue('imports')->dispatch();
```

<a name="chains-and-batches"></a>
### 链与批次

你可以把[链式任务](#job-chaining)放进数组中，从而在批次内定义一组任务链。例如，我们可以并行执行两条任务链，并在两条链都处理完毕后执行一个回调：

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
    // 所有任务均已成功完成...
})->dispatch();
```

反过来，你也可以在[链](#job-chaining)中定义批次，从而在链中运行成批的任务。例如，你可以先运行一批任务来发布多个播客，然后再运行一批任务来发送发布通知：

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
### 向批次添加任务

有时，从批处理任务内部向该批次添加更多任务会很有用。当你需要将成千上万个任务分批处理，而一次性分发又会在 Web 请求期间耗时过长时，这种模式就派上用场了。此时，你可以改为先分发一批「加载器（loader）」任务，由它们为批次注入更多任务：

```php
$batch = Bus::batch([
    new LoadImportBatch,
    new LoadImportBatch,
    new LoadImportBatch,
])->then(function (Batch $batch) {
    // 所有任务均已成功完成...
})->name('Import Contacts')->dispatch();
```

在这个例子中，我们将使用 `LoadImportBatch` 任务为批次注入额外的任务。为此，我们可以使用通过任务的 `batch` 方法获取的批次实例上的 `add` 方法：

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
> 你只能从属于同一批次的任务内部，向该批次添加任务。

<a name="inspecting-batches"></a>
### 检查批次

传递给批次完成回调的 `Illuminate\Bus\Batch` 实例提供了多种属性和方法，帮助你与给定的一批任务交互并检查其状态：

```php
// 批次的 UUID...
$batch->id;

// 批次的名称（如果有）...
$batch->name;

// 分配给该批次的任务数量...
$batch->totalJobs;

// 尚未被队列处理的任务数量...
$batch->pendingJobs;

// 已失败的任务数量...
$batch->failedJobs;

// 迄今已处理的任务数量...
$batch->processedJobs();

// 批次的完成百分比（0-100）...
$batch->progress();

// 指示批次是否已执行完毕...
$batch->finished();

// 取消批次的执行...
$batch->cancel();

// 指示批次是否已被取消...
$batch->cancelled();
```

<a name="returning-batches-from-routes"></a>
#### 从路由返回批次

所有 `Illuminate\Bus\Batch` 实例都是可 JSON 序列化的，也就是说，你可以直接从应用的某个路由返回它们，以获取包含批次信息（包括完成进度）的 JSON 载荷。这样一来，在应用的 UI 中展示批次的完成进度就非常方便。

要通过 ID 检索批次，可以使用 `Bus` Facade 的 `findBatch` 方法：

```php
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Route;

Route::get('/batch/{batchId}', function (string $batchId) {
    return Bus::findBatch($batchId);
});
```

<a name="cancelling-batches"></a>
### 取消批次

有时你可能需要取消某个批次的执行。这可以通过在 `Illuminate\Bus\Batch` 实例上调用 `cancel` 方法来实现：

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

正如你在前面的示例中可能已经注意到的，批处理任务通常应该在继续执行前判断其对应的批次是否已被取消。不过，为了方便，你也可以改为为任务分配 `SkipIfBatchCancelled` [中间件](#job-middleware)。正如其名字所示，如果任务对应的批次已被取消，该中间件会让 Laravel 不再处理该任务：

```php
use Illuminate\Queue\Middleware\SkipIfBatchCancelled;

/**
 * 获取任务应通过的中间件。
 */
public function middleware(): array
{
    return [new SkipIfBatchCancelled];
}
```

<a name="batch-failures"></a>
### 批次失败

当批处理中的某个任务失败时，`catch` 回调（如果已指定）会被调用。该回调只会在批次中第一个失败的任务上触发。

<a name="allowing-failures"></a>
#### 允许失败

当批次中的某个任务失败时，Laravel 会自动将该批次标记为「已取消」。如果你愿意，可以禁用这一行为，让任务失败不会自动将批次标记为已取消。这可以通过在分发批次时调用 `allowFailures` 方法来实现：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务均已成功完成...
})->allowFailures()->dispatch();
```

你也可以选择向 `allowFailures` 方法传入一个闭包，该闭包会在每个任务失败时执行：

```php
$batch = Bus::batch([
    // ...
])->allowFailures(function (Batch $batch, $exception) {
    // 处理单个任务的失败...
})->dispatch();
```

<a name="retrying-failed-batch-jobs"></a>
#### 重试批次中的失败任务

为了方便，Laravel 提供了 `queue:retry-batch` Artisan 命令，让你可以轻松重试给定批次的所有失败任务。该命令接收要重试失败任务的批次 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

<a name="pruning-batches"></a>
### 清理批次

如果不加清理，`job_batches` 表中的记录会积累得非常快。为了缓解这个问题，你应该[调度](/docs/{{version}}/scheduling) `queue:prune-batches` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches')->daily();
```

默认情况下，所有完成时间超过 24 小时的批次都会被清理。你可以在调用该命令时使用 `hours` 选项来决定批次数据的保留时长。例如，以下命令会删除所有完成时间超过 48 小时的批次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48')->daily();
```

有时，`job_batches` 表中可能会积累那些从未成功完成的批次记录，例如某个任务失败且一直未能成功重试的批次。你可以使用 `unfinished` 选项，指示 `queue:prune-batches` 命令清理这些未完成的批次记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --unfinished=72')->daily();
```

同样，`job_batches` 表中还可能积累已取消批次的记录。你可以使用 `cancelled` 选项，指示 `queue:prune-batches` 命令清理这些已取消的批次记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --cancelled=72')->daily();
```

<a name="storing-batches-in-dynamodb"></a>
### 在 DynamoDB 中存储批次

Laravel 还支持将批次元信息存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库。不过，你需要手动创建一个 DynamoDB 表来存放所有批次记录。

通常，这张表应命名为 `job_batches`，但你应该根据应用 `queue` 配置文件中 `queue.batching.table` 配置值来命名。

<a name="dynamodb-batch-table-configuration"></a>
#### DynamoDB 批次表配置

`job_batches` 表应具有一个名为 `application` 的字符串主分区键，以及一个名为 `id` 的字符串主排序键。键的 `application` 部分将包含应用 `app` 配置文件中 `name` 配置值所定义的应用名称。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表来存储多个 Laravel 应用的任务批次。

此外，如果你想利用[自动批次清理](#pruning-batches-in-dynamodb)，可以为表定义 `ttl` 属性。

<a name="dynamodb-configuration"></a>
#### DynamoDB 配置

接下来，安装 AWS SDK，让你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，将 `queue.batching.driver` 配置选项的值设置为 `dynamodb`。此外，你还需要在 `batching` 配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于向 AWS 进行身份验证。使用 `dynamodb` 驱动时，无需 `queue.batching.database` 配置选项：

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
#### 在 DynamoDB 中清理批次

使用 [DynamoDB](https://aws.amazon.com/dynamodb) 存储任务批次信息时，用于清理关系型数据库中批次的常规清理命令将不起作用。此时，你可以利用 [DynamoDB 原生的 TTL 功能](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)来自动移除旧批次的记录。

如果你在定义 DynamoDB 表时使用了 `ttl` 属性，可以定义一些配置参数来指示 Laravel 如何清理批次记录。`queue.batching.ttl_attribute` 配置值定义了存放 TTL 的属性名，而 `queue.batching.ttl` 配置值定义了相对于记录最后更新时间，经过多少秒后该批次记录可以从 DynamoDB 表中移除：

```php
'batching' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
    'ttl_attribute' => 'ttl',
    'ttl' => 60 * 60 * 24 * 7, // 7 天...
],
```

<a name="queueing-closures"></a>
## 队列化闭包

除了将任务类分发到队列，你还可以分发一个闭包。对于需要在当前请求周期之外执行的快速、简单的任务来说，这非常合适。将闭包分发到队列时，闭包的代码内容会经过加密签名，因此无法在传输过程中被篡改：

```php
use App\Models\Podcast;

$podcast = Podcast::find(1);

dispatch(function () use ($podcast) {
    $podcast->publish();
});
```

要为队列化闭包指定一个名称，以便队列报告仪表盘使用，同时也能在 `queue:work` 命令中显示，可以使用 `name` 方法：

```php
dispatch(function () {
    // ...
})->name('Publish Podcast');
```

使用 `catch` 方法，你可以提供一个闭包，当队列化闭包在耗尽队列[配置的所有重试次数](#max-job-attempts-and-timeout)后仍未能成功完成时，该闭包会被执行：

```php
use Throwable;

dispatch(function () use ($podcast) {
    $podcast->publish();
})->catch(function (Throwable $e) {
    // 该任务已失败...
});
```

> [!WARNING]
> 由于 `catch` 回调会被序列化并由 Laravel 队列稍后执行，因此不应在 `catch` 回调中使用 `$this` 变量。

<a name="running-the-queue-worker"></a>
## 运行队列工作进程

<a name="the-queue-work-command"></a>
### `queue:work` 命令

Laravel 包含一个 Artisan 命令，用于启动队列工作进程并处理新推送到队列上的任务。你可以使用 `queue:work` Artisan 命令来运行工作进程。注意，一旦 `queue:work` 命令启动，它就会持续运行，直到被手动停止或你关闭终端：

```shell
php artisan queue:work
```

> [!NOTE]
> 要让 `queue:work` 进程永久在后台运行，你应该使用诸如 [Supervisor](#supervisor-configuration) 之类的进程监控器，以确保队列工作进程不会停止运行。

如果你希望在 `queue:work` 命令的输出中包含所处理任务的 ID、连接名和队列名，可以在调用该命令时加上 `-v` 标志：

```shell
php artisan queue:work -v
```

请记住，队列工作进程是常驻进程，会将已启动的应用状态保存在内存中。因此，它们在启动后不会察觉代码库中的变更。所以，在部署过程中，请务必[重启队列工作进程](#queue-workers-and-deployment)。此外，还要记住，应用创建或修改的任何静态状态都不会在任务之间自动重置。

或者，你也可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当你想重新加载更新的代码或重置应用状态，无需手动重启工作进程；不过，该命令的效率明显低于 `queue:work` 命令：

```shell
php artisan queue:listen
```

<a name="running-multiple-queue-workers"></a>
#### 运行多个队列工作进程

要为一个队列分配多个工作进程并并发处理任务，只需启动多个 `queue:work` 进程即可。你可以在本地通过终端的多个标签页来实现，也可以在生产环境使用进程管理器的配置设置来实现。[使用 Supervisor 时](#supervisor-configuration)，你可以使用 `numprocs` 配置值。

<a name="specifying-the-connection-queue"></a>
#### 指定连接与队列

你还可以指定工作进程应使用哪个队列连接。传递给 `work` 命令的连接名应对应 `config/queue.php` 配置文件中定义的某个连接：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令只处理给定连接上默认队列的任务。不过，你还可以进一步自定义队列工作进程，让它只处理给定连接上的特定队列。例如，如果你的所有邮件都在 `redis` 队列连接的 `emails` 队列中处理，可以执行以下命令来启动一个只处理该队列的工作进程：

```shell
php artisan queue:work redis --queue=emails
```

<a name="processing-a-specified-number-of-jobs"></a>
#### 处理指定数量的任务

可以使用 `--once` 选项，让工作进程只处理队列中的单个任务：

```shell
php artisan queue:work --once
```

可以使用 `--max-jobs` 选项，让工作进程处理给定数量的任务后退出。该选项与 [Supervisor](#supervisor-configuration) 结合使用时非常有用，可以让工作进程在处理给定数量的任务后自动重启，释放其可能积累的内存：

```shell
php artisan queue:work --max-jobs=1000
```

<a name="processing-all-queued-jobs-then-exiting"></a>
#### 处理完所有队列任务后退出

可以使用 `--stop-when-empty` 选项，让工作进程处理完所有任务后优雅退出。在 Docker 容器中处理 Laravel 队列时，如果你希望在队列清空后关闭容器，这个选项会很有用：

```shell
php artisan queue:work --stop-when-empty
```

<a name="processing-jobs-for-a-given-number-of-seconds"></a>
#### 处理指定秒数的任务

可以使用 `--max-time` 选项，让工作进程处理任务达到给定的秒数后退出。该选项与 [Supervisor](#supervisor-configuration) 结合使用时非常有用，可以让工作进程在处理任务达到指定时长后自动重启，释放其可能积累的内存：

```shell
# 处理任务一小时后退出...
php artisan queue:work --max-time=3600
```

<a name="worker-sleep-duration"></a>
#### 工作进程休眠时长

当队列中有可用任务时，工作进程会连续处理任务，任务之间没有任何延迟。而 `sleep` 选项决定了在没有可用任务时，工作进程会「休眠」多少秒。当然，休眠期间工作进程不会处理任何新任务：

```shell
php artisan queue:work --sleep=3
```

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，不会处理任何队列任务。一旦应用退出维护模式，任务就会恢复正常处理。

如果希望队列工作进程在维护模式启用时仍然处理任务，可以使用 `--force` 选项：

```shell
php artisan queue:work --force
```

<a name="resource-considerations"></a>
#### 资源注意事项

守护进程式的队列工作进程在处理每个任务之前不会「重启」框架。因此，你应该在每个任务完成后释放所有重型资源。例如，如果你在使用 [GD 库](https://www.php.net/manual/en/book.image.php)处理图片，处理完图片后应该使用 `imagedestroy` 释放内存。

<a name="queue-priorities"></a>
### 队列优先级

有时你可能希望为队列的处理划分优先级。例如，在 `config/queue.php` 配置文件中，你可以将 `redis` 连接的默认 `queue` 设置为 `low`。不过，偶尔你可能希望将某个任务推送到 `high` 优先级队列，就像这样：

```php
dispatch((new Job)->onQueue('high'));
```

要启动一个先处理完 `high` 队列的所有任务、再继续处理 `low` 队列任务的工作进程，可以向 `work` 命令传递一个逗号分隔的队列名列表：

```shell
php artisan queue:work --queue=high,low
```

<a name="queue-workers-and-deployment"></a>
### 队列工作进程与部署

由于队列工作进程是常驻进程，不重启就不会察觉代码的变更。所以，部署使用队列工作进程的应用，最简单的方式就是在部署过程中重启工作进程。你可以通过执行 `queue:restart` 命令来优雅地重启所有工作进程：

```shell
php artisan queue:restart
```

该命令会让所有队列工作进程在处理完当前任务后优雅退出，确保不会丢失任何正在执行的任务。由于执行 `queue:restart` 命令后队列工作进程会退出，你应该运行诸如 [Supervisor](#supervisor-configuration) 之类的进程管理器来自动重启队列工作进程。

> [!NOTE]
> 队列使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用此功能前，你应该确认应用已正确配置缓存驱动。

<a name="job-expirations-and-timeouts"></a>
### 任务过期与超时

<a name="job-expiration"></a>
#### 任务过期

在 `config/queue.php` 配置文件中，每个队列连接都定义了一个 `retry_after` 选项。该选项指定了队列连接在重试一个正在处理的任务之前应等待的秒数。例如，如果 `retry_after` 的值设置为 `90`，那么当某个任务已被处理 90 秒仍未被释放或删除时，它就会被释放回队列。通常，你应该将 `retry_after` 的值设置为任务合理完成处理所需的最大秒数。

> [!WARNING]
> 唯一不含 `retry_after` 值的队列连接是 Amazon SQS。SQS 会根据在 AWS 控制台中管理的[默认可见性超时（Default Visibility Timeout）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html)来重试任务。

<a name="worker-timeouts"></a>
#### 工作进程超时

`queue:work` Artisan 命令提供了一个 `--timeout` 选项。默认情况下，`--timeout` 的值为 60 秒。如果一个任务的处理时间超过了超时值指定的秒数，处理该任务的工作进程将报错退出。通常，工作进程会被[服务器上配置的进程管理器](#supervisor-configuration)自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置选项与 `--timeout` CLI 选项是不同的，但它们相互配合，确保任务不会丢失，且任务只会被成功处理一次。

> [!WARNING]
> `--timeout` 的值应始终比 `retry_after` 配置值至少短几秒。这样才能确保处理僵死任务的工作进程，总是在任务被重试之前被终止。如果你的 `--timeout` 选项长于 `retry_after` 配置值，你的任务可能会被处理两次。

<a name="pausing-and-resuming-queue-workers"></a>
### 暂停与恢复队列工作进程

有时你可能需要临时阻止队列工作进程处理新任务，但又不想完全停止工作进程。例如，你可能希望在系统维护期间暂停任务处理。Laravel 提供了 `queue:pause` 和 `queue:continue` Artisan 命令，用于暂停和恢复队列工作进程。

要暂停特定的队列，请提供队列连接名和队列名：

```shell
php artisan queue:pause database:default
```

在这个例子中，`database` 是队列连接名，`default` 是队列名。一旦队列被暂停，正在处理该队列任务的所有工作进程会继续完成当前任务，但在队列恢复之前不会获取任何新任务。

要恢复已暂停队列上的任务处理，请使用 `queue:continue` 命令：

```shell
php artisan queue:continue database:default
```

恢复队列后，工作进程会立即开始处理该队列的新任务。注意，暂停队列并不会停止工作进程本身——它只会阻止工作进程处理指定队列的新任务。

<a name="worker-restart-and-pause-signals"></a>
#### 工作进程重启与暂停信号

默认情况下，队列工作进程会在每次任务迭代时轮询缓存驱动，检查重启和暂停信号。虽然这种轮询对于响应 `queue:restart` 和 `queue:pause` 命令至关重要，但它确实会带来少量的性能开销。

如果你需要优化性能，且不需要这些中断功能，可以通过在 `Queue` Facade 上调用 `withoutInterruptionPolling` 方法来全局禁用这种轮询。通常，这应在 `AppServiceProvider` 的 `boot` 方法中完成：

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

或者，你也可以通过在 `Illuminate\Queue\Worker` 类上设置静态属性 `$restartable` 或 `$pausable`，分别禁用重启轮询或暂停轮询：

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
> 禁用中断轮询后，工作进程将不会响应 `queue:restart` 或 `queue:pause` 命令（具体取决于禁用了哪些功能）。

<a name="supervisor-configuration"></a>
## Supervisor 配置

在生产环境中，你需要一种让 `queue:work` 进程保持运行的方式。`queue:work` 进程可能因多种原因停止运行，例如工作进程超时或执行了 `queue:restart` 命令。

因此，你需要配置一个进程监控器，检测 `queue:work` 进程何时退出并自动重启它们。此外，进程监控器还可以让你指定希望并发运行的 `queue:work` 进程数量。Supervisor 是 Linux 环境下常用的进程监控器，我们将在下面的文档中讨论如何配置它。

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监控器，会在你的 `queue:work` 进程失败时自动重启它们。要在 Ubuntu 上安装 Supervisor，可以使用以下命令：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自行配置和管理 Supervisor 听起来太麻烦，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它为运行 Laravel 队列工作进程提供了全托管平台。

<a name="configuring-supervisor"></a>
#### 配置 Supervisor

Supervisor 配置文件通常存储在 `/etc/supervisor/conf.d` 目录中。在该目录下，你可以创建任意数量的配置文件，告诉 Supervisor 应如何监控你的进程。例如，让我们创建一个 `laravel-worker.conf` 文件，用于启动并监控 `queue:work` 进程：

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

在这个例子中，`numprocs` 指令会让 Supervisor 运行八个 `queue:work` 进程并对它们全部进行监控，在它们失败时自动重启。你应该修改配置中的 `command` 指令，以反映你所期望的队列连接和工作进程选项。

> [!WARNING]
> 你应该确保 `stopwaitsecs` 的值大于运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成之前就将其终止。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

创建好配置文件后，你可以使用以下命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start "laravel-worker:*"
```

关于 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="dealing-with-failed-jobs"></a>
## 处理失败任务

有时你的队列任务会失败。别担心，事情并不总是按计划进行！Laravel 提供了一种便捷的方式来[指定任务的最大尝试次数](#max-job-attempts-and-timeout)。当一个异步任务的尝试次数超过该值后，它会被插入到 `failed_jobs` 数据库表中。而[同步分发的任务](/docs/{{version}}/queues#synchronous-dispatching)失败时不会存入该表，其异常会立即由应用处理。

新建的 Laravel 应用通常已经包含了创建 `failed_jobs` 表的迁移。不过，如果你的应用不包含该表的迁移，可以使用 `make:queue-failed-table` 命令来创建：

```shell
php artisan make:queue-failed-table

php artisan migrate
```

在运行[队列工作进程](#running-the-queue-worker)时，你可以使用 `queue:work` 命令的 `--tries` 开关来指定任务的最大尝试次数。如果不为 `--tries` 选项指定值，任务将只被尝试一次，或按任务类的 `$tries` 属性指定的次数尝试：

```shell
php artisan queue:work redis --tries=3
```

使用 `--backoff` 选项，你可以指定 Laravel 在重试一个遇到异常的任务之前应等待多少秒。默认情况下，任务会被立即释放回队列，以便再次尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你想针对每个任务单独配置遇到异常后 Laravel 重试前应等待的秒数，可以在任务类上定义一个 `backoff` 属性：

```php
/**
 * 重试任务前需等待的秒数。
 *
 * @var int
 */
public $backoff = 3;
```

如果你需要更复杂的逻辑来确定任务的退避时间，可以在任务类上定义一个 `backoff` 方法：

```php
/**
 * 计算重试任务前需等待的秒数。
 */
public function backoff(): int
{
    return 3;
}
```

你可以让 `backoff` 方法返回一组退避值数组，轻松配置「指数级」退避。在这个例子中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有剩余尝试机会，之后的每次重试都为 10 秒：

```php
/**
 * 计算重试任务前需等待的秒数。
 *
 * @return array<int, int>
 */
public function backoff(): array
{
    return [1, 5, 10];
}
```

<a name="cleaning-up-after-failed-jobs"></a>
### 失败任务的清理工作

当某个任务失败时，你可能希望向用户发送警报，或者回滚任务已部分完成的操作。为此，你可以在任务类上定义一个 `failed` 方法。导致任务失败的 `Throwable` 实例会被传递给 `failed` 方法：

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
        // 处理已上传的播客...
    }

    /**
     * 处理任务失败。
     */
    public function failed(?Throwable $exception): void
    {
        // 向用户发送失败通知等...
    }
}
```

> [!WARNING]
> 在调用 `failed` 方法之前，会先实例化一个新的任务实例；因此，在 `handle` 方法中可能发生的任何类属性修改都会丢失。

失败的任务并不一定是遇到了未处理的异常。当任务耗尽其全部允许的尝试次数时，也会被视为失败。这些尝试可能通过以下几种方式被消耗：

- 任务超时。
- 任务在执行过程中遇到未处理的异常。
- 任务被手动释放回队列，或被某个中间件释放。

如果最后一次尝试因任务执行期间抛出的异常而失败，该异常会被传递给任务的 `failed` 方法。但如果任务是因为达到了允许的最大尝试次数而失败，`$exception` 将是 `Illuminate\Queue\MaxAttemptsExceededException` 的实例。类似地，如果任务因超过配置的超时时间而失败，`$exception` 将是 `Illuminate\Queue\TimeoutExceededException` 的实例。

<a name="retrying-failed-jobs"></a>
### 重试失败任务

要查看已插入 `failed_jobs` 数据库表的所有失败任务，可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令会列出任务 ID、连接、队列、失败时间以及该任务的其他信息。任务 ID 可用于重试失败的任务。例如，要重试 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败任务，请执行以下命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如有需要，你可以向该命令传递多个 ID：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你也可以重试特定队列的所有失败任务：

```shell
php artisan queue:retry --queue=name
```

要重试所有失败任务，请执行 `queue:retry` 命令并传入 `all` 作为 ID：

```shell
php artisan queue:retry all
```

如果你想删除某个失败任务，可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> [!NOTE]
> 使用 [Horizon](/docs/{{version}}/horizon) 时，你应该使用 `horizon:forget` 命令来删除失败任务，而不是 `queue:forget` 命令。

要删除 `failed_jobs` 表中的所有失败任务，可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

`queue:flush` 命令会从队列中移除所有失败任务记录，无论失败任务有多旧。你可以使用 `--hours` 选项，只删除在特定小时数之前（含）失败的任务：

```shell
php artisan queue:flush --hours=48
```

<a name="ignoring-missing-models"></a>
### 忽略缺失模型

将 Eloquent 模型注入任务时，模型会在放入队列前被自动序列化，并在任务处理时从数据库重新检索。然而，如果该模型在任务等待工作进程处理期间被删除，你的任务可能会因 `ModelNotFoundException` 而失败。

为了方便，你可以将任务的 `deleteWhenMissingModels` 属性设置为 `true`，让缺失模型的任务自动删除。当该属性设置为 `true` 时，Laravel 会悄悄丢弃该任务，而不会抛出异常：

```php
/**
 * 如果任务的模型已不存在，则删除该任务。
 *
 * @var bool
 */
public $deleteWhenMissingModels = true;
```

<a name="pruning-failed-jobs"></a>
### 清理失败任务

你可以通过调用 `queue:prune-failed` Artisan 命令，清理应用 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败任务记录都会被清理。如果你向该命令提供 `--hours` 选项，则只会保留最近 N 小时内插入的失败任务记录。例如，以下命令会删除所有插入时间超过 48 小时的失败任务记录：

```shell
php artisan queue:prune-failed --hours=48
```

<a name="storing-failed-jobs-in-dynamodb"></a>
### 在 DynamoDB 中存储失败任务

Laravel 还支持将失败任务记录存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库表。不过，你必须手动创建一个 DynamoDB 表来存放所有失败任务记录。通常，这张表应命名为 `failed_jobs`，但你应该根据应用 `queue` 配置文件中 `queue.failed.table` 配置值来命名。

`failed_jobs` 表应具有一个名为 `application` 的字符串主分区键，以及一个名为 `uuid` 的字符串主排序键。键的 `application` 部分将包含应用 `app` 配置文件中 `name` 配置值所定义的应用名称。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表来存储多个 Laravel 应用的失败任务。

此外，请确保安装了 AWS SDK，让你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，将 `queue.failed.driver` 配置选项的值设置为 `dynamodb`。此外，你还应在失败任务配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于向 AWS 进行身份验证。使用 `dynamodb` 驱动时，无需 `queue.failed.database` 配置选项：

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

你可以将 `queue.failed.driver` 配置选项的值设置为 `null`，指示 Laravel 丢弃失败任务而不进行存储。通常，这可以通过 `QUEUE_FAILED_DRIVER` 环境变量来完成：

```ini
QUEUE_FAILED_DRIVER=null
```

<a name="failed-job-events"></a>
### 失败任务事件

如果你想注册一个在任务失败时被调用的事件监听器，可以使用 `Queue` Facade 的 `failing` 方法。例如，我们可以在 Laravel 自带的 `AppServiceProvider` 的 `boot` 方法中为该事件附加一个闭包：

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
        // ...
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
## 从队列中清除任务

> [!NOTE]
> 使用 [Horizon](/docs/{{version}}/horizon) 时，你应该使用 `horizon:clear` 命令来清除队列中的任务，而不是 `queue:clear` 命令。

如果你想删除默认连接的默认队列中的所有任务，可以使用 `queue:clear` Artisan 命令：

```shell
php artisan queue:clear
```

你也可以提供 `connection` 参数和 `queue` 选项，从特定的连接和队列中删除任务：

```shell
php artisan queue:clear redis --queue=emails
```

> [!WARNING]
> 从队列中清除任务仅适用于 SQS、Redis 和数据库队列驱动。此外，SQS 的消息删除过程最长需要 60 秒，因此清除队列后 60 秒内发送到 SQS 队列的任务也可能被删除。

<a name="monitoring-your-queues"></a>
## 监控队列

如果你的队列突然涌入大量任务，它可能会不堪重负，导致任务需要等待很长时间才能完成。如果你愿意，Laravel 可以在队列任务数量超过指定阈值时向你发出警报。

开始之前，你应该[每分钟调度](/docs/{{version}}/scheduling)一次 `queue:monitor` 命令。该命令接收你希望监控的队列名，以及你期望的任务数量阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅仅调度这个命令，并不足以触发通知来提醒你队列已不堪重负。当该命令发现某个队列的任务数量超过你的阈值时，会分发一个 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在应用的 `AppServiceProvider` 中监听该事件，以便向你或你的开发团队发送通知：

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
                $event->connection,
                $event->queue,
                $event->size
            ));
    });
}
```

<a name="testing"></a>
## 测试

在测试分发任务的代码时，你可能希望让 Laravel 不要实际执行任务本身，因为任务的代码可以直接、独立于分发它的代码进行测试。当然，要测试任务本身，你可以实例化一个任务实例，并在测试中直接调用 `handle` 方法。

你可以使用 `Queue` Facade 的 `fake` 方法，防止队列任务被实际推送到队列。调用 `Queue` Facade 的 `fake` 方法后，你就可以断言应用是否尝试将任务推送到队列：

```php tab=Pest
<?php

use App\Jobs\AnotherJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;

test('orders can be shipped', function () {
    Queue::fake();

    // 执行订单发货...

    // 断言没有任务被推送...
    Queue::assertNothingPushed();

    // 断言有任务被推送到给定队列...
    Queue::assertPushedOn('queue-name', ShipOrder::class);

    // 断言有任务被推送...
    Queue::assertPushed(ShipOrder::class);

    // 断言有任务被推送了两次...
    Queue::assertPushedTimes(ShipOrder::class, 2);

    // 断言没有任务被推送...
    Queue::assertNotPushed(AnotherJob::class);

    // 断言有闭包被推送到队列...
    Queue::assertClosurePushed();

    // 断言没有闭包被推送...
    Queue::assertClosureNotPushed();

    // 断言被推送任务的总数...
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

        // 执行订单发货...

        // 断言没有任务被推送...
        Queue::assertNothingPushed();

        // 断言有任务被推送到给定队列...
        Queue::assertPushedOn('queue-name', ShipOrder::class);

        // 断言有任务被推送...
        Queue::assertPushed(ShipOrder::class);

        // 断言有任务被推送了两次...
        Queue::assertPushedTimes(ShipOrder::class, 2);

        // 断言没有任务被推送...
        Queue::assertNotPushed(AnotherJob::class);

        // 断言有闭包被推送到队列...
        Queue::assertClosurePushed();

        // 断言没有闭包被推送...
        Queue::assertClosureNotPushed();

        // 断言被推送任务的总数...
        Queue::assertCount(3);
    }
}
```

你可以向 `assertPushed`、`assertNotPushed`、`assertClosurePushed` 或 `assertClosureNotPushed` 方法传入一个闭包，以断言被推送的任务通过了给定的「真实性测试」。只要至少有一个被推送的任务通过了给定的真实性测试，断言就会成功：

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
### 模拟部分任务

如果你只需要模拟特定任务，而让其他任务正常执行，可以将需要模拟的任务的类名传给 `fake` 方法：

```php tab=Pest
test('orders can be shipped', function () {
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货...

    // 断言有任务被推送了两次...
    Queue::assertPushedTimes(ShipOrder::class, 2);
});
```

```php tab=PHPUnit
public function test_orders_can_be_shipped(): void
{
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货...

    // 断言有任务被推送了两次...
    Queue::assertPushedTimes(ShipOrder::class, 2);
}
```

你可以使用 `except` 方法，模拟除一组指定任务之外的所有任务：

```php
Queue::fake()->except([
    ShipOrder::class,
]);
```

<a name="testing-job-chains"></a>
### 测试任务链

要测试任务链，你需要使用 `Bus` Facade 的模拟功能。`Bus` Facade 的 `assertChained` 方法可用于断言某条[任务链](/docs/{{version}}/queues#job-chaining)已被分发。`assertChained` 方法接收一个链式任务数组作为第一个参数：

```php
use App\Jobs\RecordShipment;
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ...

Bus::assertChained([
    ShipOrder::class,
    RecordShipment::class,
    UpdateInventory::class
]);
```

正如你在上面的示例中所见，链式任务数组可以是由任务类名组成的数组。不过，你也可以提供一组实际的任务实例。此时，Laravel 会确保这些任务实例与应用所分发链式任务的类相同、属性值一致：

```php
Bus::assertChained([
    new ShipOrder,
    new RecordShipment,
    new UpdateInventory,
]);
```

你可以使用 `assertDispatchedWithoutChain` 方法，断言某个任务在推送时不带任务链：

```php
Bus::assertDispatchedWithoutChain(ShipOrder::class);
```

<a name="testing-chain-modifications"></a>
#### 测试链的修改

如果某个链式任务[向现有链前插或追加了任务](#adding-jobs-to-the-chain)，你可以使用该任务的 `assertHasChain` 方法，断言任务拥有预期的剩余任务链：

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
#### 测试链式批次

如果你的任务链[包含一个任务批次](#chains-and-batches)，你可以在链断言中插入一个 `Bus::chainedBatch` 定义，断言链式批次符合你的预期：

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
### 测试任务批次

`Bus` Facade 的 `assertBatched` 方法可用于断言某个[任务批次](/docs/{{version}}/queues#job-batching)已被分发。传递给 `assertBatched` 方法的闭包会接收到一个 `Illuminate\Bus\PendingBatch` 实例，可用于检查批次中的任务：

```php
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::fake();

// ...

Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->name == 'Import CSV' &&
           $batch->jobs->count() === 10;
});
```

可以在待处理批次上使用 `hasJobs` 方法，验证批次中包含预期的任务。该方法接收一个由任务实例、类名或闭包组成的数组：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        new ProcessCsvRow(row: 1),
        new ProcessCsvRow(row: 2),
        new ProcessCsvRow(row: 3),
    ]);
});
```

使用闭包时，闭包会接收到任务实例。预期的任务类型会从闭包的类型提示中推断出来：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        fn (ProcessCsvRow $job) => $job->row === 1,
        fn (ProcessCsvRow $job) => $job->row === 2,
        fn (ProcessCsvRow $job) => $job->row === 3,
    ]);
});
```

你可以使用 `assertBatchCount` 方法，断言分发了一定数量的批次：

```php
Bus::assertBatchCount(3);
```

你可以使用 `assertNothingBatched`，断言没有批次被分发：

```php
Bus::assertNothingBatched();
```

<a name="testing-job-batch-interaction"></a>
#### 测试任务 / 批次交互

此外，你有时可能需要测试单个任务与其底层批次的交互。例如，你可能需要测试某个任务是否取消了其批次的后续处理。为此，你需要通过 `withFakeBatch` 方法为该任务分配一个模拟批次。`withFakeBatch` 方法会返回一个元组，包含任务实例和模拟批次：

```php
[$job, $batch] = (new ShipOrder)->withFakeBatch();

$job->handle();

$this->assertTrue($batch->cancelled());
$this->assertEmpty($batch->added);
```

<a name="testing-job-queue-interactions"></a>
### 测试任务 / 队列交互

有时，你可能需要测试某个队列任务[将自身释放回队列](#manually-releasing-a-job)。或者，你可能需要测试该任务删除了自身。你可以通过实例化任务并调用 `withFakeQueueInteractions` 方法来测试这些队列交互。

模拟好任务的队列交互后，你就可以调用任务上的 `handle` 方法。调用任务之后，有多种断言方法可用于验证任务的队列交互：

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

使用 `Queue` [Facade](/docs/{{version}}/facades) 上的 `before` 和 `after` 方法，你可以指定在队列任务处理之前或之后执行的回调。这些回调是执行额外日志记录或为仪表盘递增统计数据的绝佳时机。通常，你应该在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用这些方法。例如，我们可以使用 Laravel 自带的 `AppServiceProvider`：

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
        // ...
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

使用 `Queue` [Facade](/docs/{{version}}/facades) 上的 `looping` 方法，你可以指定在工作进程尝试从队列获取任务之前执行的回调。例如，你可以注册一个闭包，回滚之前失败的任务遗留的未关闭事务：

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

Queue::looping(function () {
    while (DB::transactionLevel() > 0) {
        DB::rollBack();
    }
});
```
