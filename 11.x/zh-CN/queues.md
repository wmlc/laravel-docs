# 队列

- [简介](#introduction)
    - [连接与队列](#connections-vs-queues)
    - [驱动说明与前置条件](#driver-prerequisites)
- [创建任务](#creating-jobs)
    - [生成任务类](#generating-job-classes)
    - [类结构](#class-structure)
    - [唯一任务](#unique-jobs)
    - [加密任务](#encrypted-jobs)
- [任务中间件](#job-middleware)
    - [速率限制](#rate-limiting)
    - [防止任务重叠](#preventing-job-overlaps)
    - [限制异常](#throttling-exceptions)
    - [跳过任务](#skipping-jobs)
- [分发任务](#dispatching-jobs)
    - [延迟分发](#delayed-dispatching)
    - [同步分发](#synchronous-dispatching)
    - [任务与数据库事务](#jobs-and-database-transactions)
    - [任务链](#job-chaining)
    - [自定义队列与连接](#customizing-the-queue-and-connection)
    - [指定最大任务尝试次数 / 超时值](#max-job-attempts-and-timeout)
    - [错误处理](#error-handling)
- [任务批处理](#job-batching)
    - [定义可批处理的任务](#defining-batchable-jobs)
    - [分发批次](#dispatching-batches)
    - [链与批次](#chains-and-batches)
    - [添加任务到批次](#adding-jobs-to-batches)
    - [检查批次](#inspecting-batches)
    - [取消批次](#cancelling-batches)
    - [批次失败](#batch-failures)
    - [清理批次](#pruning-batches)
    - [在 DynamoDB 中存储批次](#storing-batches-in-dynamodb)
- [队列闭包](#queueing-closures)
- [运行队列工作进程](#running-the-queue-worker)
    - [`queue:work` 命令](#the-queue-work-command)
    - [队列优先级](#queue-priorities)
    - [队列工作进程与部署](#queue-workers-and-deployment)
    - [任务过期与超时](#job-expirations-and-timeouts)
- [Supervisor 配置](#supervisor-configuration)
- [处理失败任务](#dealing-with-failed-jobs)
    - [清理失败任务](#cleaning-up-after-failed-jobs)
    - [重试失败任务](#retrying-failed-jobs)
    - [忽略缺失的模型](#ignoring-missing-models)
    - [清理失败任务](#pruning-failed-jobs)
    - [在 DynamoDB 中存储失败任务](#storing-failed-jobs-in-dynamodb)
    - [禁用失败任务存储](#disabling-failed-job-storage)
    - [失败任务事件](#failed-job-events)
- [清空队列中的任务](#clearing-jobs-from-queues)
- [监控你的队列](#monitoring-your-queues)
- [测试](#testing)
    - [伪造部分任务](#faking-a-subset-of-jobs)
    - [测试任务链](#testing-job-chains)
    - [测试任务批处理](#testing-job-batches)
    - [测试任务 / 队列交互](#testing-job-queue-interactions)
- [任务事件](#job-events)

<a name="introduction"></a>
## 简介

在构建 Web 应用时，你可能会遇到一些耗时过长的任务，例如解析并存储上传的 CSV 文件。幸运的是，Laravel 允许你轻松创建队列任务，从而在后台处理它们。把耗时的任务转移到队列中，可以让你的应用以极快的速度响应 Web 请求，并为客户提供更好的用户体验。

Laravel 队列在各种不同的队列后端之上提供了一套统一的队列 API，例如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io)，甚至是关系型数据库。

Laravel 的队列配置选项存放在你应用的 `config/queue.php` 配置文件中。在这个文件里，你会找到框架内置的各个队列驱动的连接配置，包括 database、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及一个会立即执行任务的同步驱动（供本地开发时使用）。此外还包含一个 `null` 队列驱动，它会丢弃所有入队的任务。

> [!NOTE]
> Laravel 现在提供了 Horizon，这是一个用于 Redis 队列的精美仪表盘与配置系统。欲了解更多信息，请查看完整的 [Horizon 文档](/docs/{{version}}/horizon)。

<a name="connections-vs-queues"></a>
### 连接与队列

开始使用 Laravel 队列之前，务必先理解"连接"与"队列"之间的区别。在 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。该选项定义了到后端队列服务的连接，例如 Amazon SQS、Beanstalk 或 Redis。不过，任何一个给定的队列连接都可以拥有多个"队列"，它们可以理解为不同的任务堆栈或任务堆。

请注意，`queue` 配置文件中的每个连接配置示例都包含一个 `queue` 属性。当任务被发送到某个连接时，默认就会被分发到该队列。换句话说，如果你分发任务时没有显式指定它应该分发到哪个队列，那么该任务就会被放入连接配置 `queue` 属性所定义的队列中：

    use App\Jobs\ProcessPodcast;

    // 该任务会发送到默认连接的默认队列……
    ProcessPodcast::dispatch();

    // 该任务会发送到默认连接的 "emails" 队列……
    ProcessPodcast::dispatch()->onQueue('emails');

有些应用可能从不需要把任务推送到多个队列，而是更倾向于只使用一个简单队列。不过，对于希望按优先级安排任务处理顺序或对任务进行分块的应用，把任务推送到多个队列会格外有用，因为 Laravel 队列工作进程允许你按优先级指定要处理哪些队列。例如，如果你把任务推送到 `high` 队列，可以运行一个为它们赋予更高处理优先级的工作进程：

```shell
php artisan queue:work --queue=high,default
```

<a name="driver-prerequisites"></a>
### 驱动说明与前置条件

<a name="database"></a>
#### 数据库

要使用 `database` 队列驱动，你需要一个用于存放任务的数据库表。通常，Laravel 默认的 `0001_01_01_000002_create_jobs_table.php` [数据库迁移](/docs/{{version}}/migrations)中已经包含了这个表；不过，如果你的应用中不包含该迁移，可以使用 `make:queue-table` Artisan 命令来创建它：

```shell
php artisan make:queue-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

要使用 `redis` 队列驱动，你应当在 `config/database.php` 配置文件中配置一个 Redis 数据库连接。

> [!WARNING]
> `redis` 队列驱动不支持 `serializer` 和 `compression` 这两个 Redis 选项。

**Redis 集群**

如果你的 Redis 队列连接使用了 Redis 集群，那么队列名称必须包含[键哈希标签](https://redis.io/docs/reference/cluster-spec/#hash-tags)。这是为了确保某个队列的所有 Redis 键都被放入同一个哈希槽中：

    'redis' => [
        'driver' => 'redis',
        'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
        'queue' => env('REDIS_QUEUE', '{default}'),
        'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
        'block_for' => null,
        'after_commit' => false,
    ],

**阻塞**

使用 Redis 队列时，你可以用 `block_for` 配置选项指定驱动在遍历工作进程循环并重新轮询 Redis 数据库之前，应等待任务可用的时长。

根据队列负载情况调整该值，可能比持续轮询 Redis 数据库以获取新任务更高效。例如，你可以把该值设为 `5`，表示驱动在等待任务可用时应阻塞五秒：

    'redis' => [
        'driver' => 'redis',
        'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => env('REDIS_QUEUE_RETRY_AFTER', 90),
        'block_for' => 5,
        'after_commit' => false,
    ],

> [!WARNING]
> 把 `block_for` 设为 `0` 会导致队列工作进程无限期阻塞，直到有任务可用为止。这也会导致 `SIGTERM` 等信号在下一个任务处理完成之前无法被处理。

<a name="other-driver-prerequisites"></a>
#### 其它驱动的前置条件

下列队列驱动需要安装相应依赖。这些依赖可以通过 Composer 包管理器安装：

<div class="content-list" markdown="1">

- Amazon SQS: `aws/aws-sdk-php ~3.0`
- Beanstalkd: `pda/pheanstalk ~5.0`
- Redis: `predis/predis ~2.0` 或 phpredis PHP 扩展
- [MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/): `mongodb/laravel-mongodb`

</div>

<a name="creating-jobs"></a>
## 创建任务

<a name="generating-job-classes"></a>
### 生成任务类

默认情况下，应用中所有可入队的任务都存放在 `app/Jobs` 目录下。如果 `app/Jobs` 目录不存在，运行 `make:job` Artisan 命令时会自动创建它：

```shell
php artisan make:job ProcessPodcast
```

生成的类会实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，向 Laravel 表明该任务应被推入队列以异步运行。

> [!NOTE]
> 任务存根可以通过[存根发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="class-structure"></a>
### 类结构

任务类非常简单，通常只包含一个 `handle` 方法，在任务被队列处理时调用。要开始上手，我们来看一个任务类示例。在这个例子中，我们假装自己经营着一项播客发布服务，需要在播客文件发布之前对其进行处理：

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
         * 执行该任务。
         */
        public function handle(AudioProcessor $processor): void
        {
            // 处理已上传的播客……
        }
    }

在这个例子中，请注意我们能够直接把一个 [Eloquent 模型](/docs/{{version}}/eloquent)传入队列任务的构造函数。由于该任务使用了 `Queueable` Trait，Eloquent 模型及其已加载的关联会在任务处理时被优雅地序列化与反序列化。

如果你的队列任务在构造函数中接受一个 Eloquent 模型，那么只有该模型的标识符会被序列化到队列中。当任务真正被处理时，队列系统会自动从数据库中重新取出完整的模型实例及其已加载的关联。这种模型序列化方式可以让发送到队列驱动的任务负载小得多。

<a name="handle-method-dependency-injection"></a>
#### `handle` 方法的依赖注入

`handle` 方法在任务被队列处理时调用。请注意，我们可以在任务的 `handle` 方法上对依赖项进行类型提示。Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)会自动注入这些依赖项。

如果你希望完全掌控容器如何向 `handle` 方法注入依赖项，可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接受一个回调，该回接收收到的任务和容器。在回调内部，你可以随意调用 `handle` 方法。通常，你应该在 `App\Providers\AppServiceProvider` [服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

    use App\Jobs\ProcessPodcast;
    use App\Services\AudioProcessor;
    use Illuminate\Contracts\Foundation\Application;

    $this->app->bindMethod([ProcessPodcast::class, 'handle'], function (ProcessPodcast $job, Application $app) {
        return $job->handle($app->make(AudioProcessor::class));
    });

> [!WARNING]
> 二进制数据（例如原始图片内容）在传给队列任务之前，应当先通过 `base64_encode` 函数处理。否则，任务在放入队列时可能无法正确序列化为 JSON。

<a name="handling-relationships"></a>
#### 队列中的关联

由于所有已加载的 Eloquent 模型关联在任务入队时也会被序列化，序列化后的任务字符串有时会变得相当大。此外，当任务被反序列化、模型关联从数据库中重新取出时，这些关联会被完整取出。在任务入队过程中、模型序列化之前所应用的任何关联约束，在任务反序列化时都不会再生效。因此，如果你希望处理某个关联的一个子集，就应当在队列任务中重新对该关联施加约束。

或者，为了阻止关联被序列化，你可以在设置属性值时调用模型上的 `withoutRelations` 方法。该方法会返回一个不含已加载关联的模型实例：

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        Podcast $podcast,
    ) {
        $this->podcast = $podcast->withoutRelations();
    }

如果你使用 PHP 的构造函数属性提升，并且希望指明某个 Eloquent 模型不应序列化其关联，可以使用 `WithoutRelations` 属性：

    use Illuminate\Queue\Attributes\WithoutRelations;

    /**
     * 创建一个新的任务实例。
     */
    public function __construct(
        #[WithoutRelations]
        public Podcast $podcast,
    ) {}

如果某个任务接收到的是一个 Eloquent 模型集合或数组，而不是单个模型，那么该集合中的模型在任务被反序列化并执行时不会恢复其关联。这是为了避免处理大量模型的任务造成过度的资源消耗。

<a name="unique-jobs"></a>
### 唯一任务

> [!WARNING]
> 唯一任务要求缓存驱动支持[锁](/docs/{{version}}/cache#atomic-locks)。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。此外，唯一任务约束不适用于批次中的任务。

有时你可能希望确保在任意时刻，队列上某个特定任务只有一个实例。可以在任务类上实现 `ShouldBeUnique` 接口来实现。该接口不要求你在类中定义任何额外方法：

    <?php

    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Contracts\Queue\ShouldBeUnique;

    class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
    {
        ...
    }

在上面的例子中，`UpdateSearchIndex` 任务是唯一的。因此，如果该任务的另一个实例已经在队列中且尚未处理完成，那么该任务就不会被分发。

在某些情况下，你可能希望定义一个使任务保持唯一的特定"键"，或者希望指定一个超时时间，超过该时间后任务就不再保持唯一。为此，你可以在任务类上定义 `uniqueId` 和 `uniqueFor` 属性或方法：

    <?php

    use App\Models\Product;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Contracts\Queue\ShouldBeUnique;

    class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
    {
        /**
         * 产品实例。
         *
         * @var \App\Product
         */
        public $product;

        /**
         * 任务的唯一锁在多少秒之后释放。
         *
         * @var int
         */
        public $uniqueFor = 3600;

        /**
         * 获取该任务的唯一 ID。
         */
        public function uniqueId(): string
        {
            return $this->product->id;
        }
    }

在上面的例子中，`UpdateSearchIndex` 任务以产品 ID 作为唯一标识。因此，在已有任务完成处理之前，任何使用相同产品 ID 的新分发都会被忽略。此外，如果已有任务在一小时内未被处理，唯一锁就会被释放，另一个具有相同唯一键的任务就可以被分发到队列中。

> [!WARNING]
> 如果你的应用从多台 Web 服务器或多个容器分发任务，应确保所有服务器都在与同一个中央缓存服务器通信，以便 Laravel 能准确判断某个任务是否唯一。

<a name="keeping-jobs-unique-until-processing-begins"></a>
#### 保持任务唯一直到开始处理

默认情况下，唯一任务会在任务完成处理或所有重试尝试都失败之后被"解锁"。不过，在某些情况下，你可能希望任务在被处理之前就立即解锁。为此，你的任务应当实现 `ShouldBeUniqueUntilProcessing` 契约，而不是 `ShouldBeUnique` 契约：

    <?php

    use App\Models\Product;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

    class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
    {
        // ...
    }

<a name="unique-job-locks"></a>
#### 唯一任务锁

在幕后，当一个 `ShouldBeUnique` 任务被分发时，Laravel 会尝试获取一个以 `uniqueId` 为键的[锁](/docs/{{version}}/cache#atomic-locks)。如果未能获取该锁，任务就不会被分发。当任务完成处理或所有重试尝试都失败时，该锁会被释放。默认情况下，Laravel 会使用默认缓存驱动来获取该锁。不过，如果你希望使用其它驱动来获取锁，可以定义一个 `uniqueVia` 方法，返回应当使用的缓存驱动：

    use Illuminate\Contracts\Cache\Repository;
    use Illuminate\Support\Facades\Cache;

    class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
    {
        ...

        /**
         * 获取唯一任务锁所使用的缓存驱动。
         */
        public function uniqueVia(): Repository
        {
            return Cache::driver('redis');
        }
    }

> [!NOTE]
> 如果你只需要限制某个任务的并发处理，请改用 [`WithoutOverlapping`](/docs/{{version}}/queues#preventing-job-overlaps) 任务中间件。

<a name="encrypted-jobs"></a>
### 加密任务

Laravel 允许你通过[加密](/docs/{{version}}/encryption)确保任务数据的隐私性与完整性。要开始使用，只需在任务类上添加 `ShouldBeEncrypted` 接口。把该接口添加到类之后，Laravel 会在把任务推入队列之前自动对其加密：

    <?php

    use Illuminate\Contracts\Queue\ShouldBeEncrypted;
    use Illuminate\Contracts\Queue\ShouldQueue;

    class UpdateSearchIndex implements ShouldQueue, ShouldBeEncrypted
    {
        // ...
    }

<a name="job-middleware"></a>
## 任务中间件

任务中间件允许你在队列任务的执行前后包裹自定义逻辑，从而减少任务本身中的样板代码。例如，考虑下面这个 `handle` 方法，它利用 Laravel 的 Redis 速率限制功能，只允许每五秒处理一个任务：

    use Illuminate\Support\Facades\Redis;

    /**
     * 执行该任务。
     */
    public function handle(): void
    {
        Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
            info('Lock obtained...');

            // 处理任务……
        }, function () {
            // 未能获取锁……

            return $this->release(5);
        });
    }

虽然这段代码是有效的，但 `handle` 方法的实现会变得杂乱无章，因为其中塞满了 Redis 速率限制逻辑。此外，这段速率限制逻辑还必须在任何其它需要限速的任务中重复一遍。

我们可以在 `handle` 方法中做速率限制，也可以改为定义一个负责速率限制的任务中间件。Laravel 并没有为任务中间件指定默认位置，因此你可以把任务中间件放在应用中的任意位置。在这个例子中，我们会把中间件放在 `app/Jobs/Middleware` 目录下：

    <?php

    namespace App\Jobs\Middleware;

    use Closure;
    use Illuminate\Support\Facades\Redis;

    class RateLimited
    {
        /**
         * 处理队列中的任务。
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
                    // 未能获取锁……

                    $job->release(5);
                });
        }
    }

如你所见，与[路由中间件](/docs/{{version}}/middleware)一样，任务中间件会接收到正在处理的任务，以及一个应当被调用以继续处理该任务的回调。

创建任务中间件之后，可以通过任务的 `middleware` 方法把它们返回出来以挂到任务上。`make:job` Artisan 命令生成的任务存根中并不存在该方法，因此你需要手动把它添加到任务类中：

    use App\Jobs\Middleware\RateLimited;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new RateLimited];
    }

> [!NOTE]
> 任务中间件也可以挂到可入队的事件监听器、邮件和通知上。

<a name="rate-limiting"></a>
### 速率限制

虽然我们刚刚演示了如何编写自己的速率限制任务中间件，但 Laravel 实际上已经内置了一个可用于限制任务速率的中间件。与[路由速率限制器](/docs/{{version}}/routing#defining-rate-limiters)一样，任务速率限制器也使用 `RateLimiter` Facade 的 `for` 方法来定义。

例如，你可能希望允许用户每小时备份一次数据，而对高级客户不施加此类限制。为此，你可以在 `AppServiceProvider` 的 `boot` 方法中定义一个 `RateLimiter`：

    use Illuminate\Cache\RateLimiting\Limit;
    use Illuminate\Support\Facades\RateLimiter;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        RateLimiter::for('backups', function (object $job) {
            return $job->user->vipCustomer()
                ? Limit::none()
                : Limit::perHour(1)->by($job->user->id);
        });
    }

在上面的例子中，我们定义了一个按小时计的速率限制；不过，你也可以轻松地使用 `perMinute` 方法定义一个按分钟计的速率限制。此外，你可以把任意值传给速率限制的 `by` 方法，不过该值最常用于按客户对速率限制进行分块：

    return Limit::perMinute(50)->by($job->user->id);

定义速率限制之后，你可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件把速率限制器挂到任务上。每当任务超出速率限制时，该中间件都会根据速率限制的时长，把任务以一个适当的延迟重新放回队列。

    use Illuminate\Queue\Middleware\RateLimited;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new RateLimited('backups')];
    }

把一个受速率限制的任务重新放回队列，仍然会增加该任务的总 `attempts` 计数。你可能希望相应地调整任务类上的 `tries` 和 `maxExceptions` 属性。或者，你也可以使用 [`retryUntil` 方法](#time-based-attempts)来定义任务不再被尝试之前的时长。

如果你不希望某个任务在被速率限制时重试，可以使用 `dontRelease` 方法：

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new RateLimited('backups'))->dontRelease()];
    }

> [!NOTE]
> 如果你使用 Redis，可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它针对 Redis 做了调优，比基础的速率限制中间件更高效。

<a name="preventing-job-overlaps"></a>
### 防止任务重叠

Laravel 内置了 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，可以让你基于任意键防止任务重叠。当某个队列任务正在修改一个同一时刻只应被一个任务修改的资源时，这会很有用。

例如，假设你有一个更新用户信用评分的队列任务，并且希望防止同一用户 ID 的信用评分更新任务发生重叠。为此，可以从任务的 `middleware` 方法中返回 `WithoutOverlapping` 中间件：

    use Illuminate\Queue\Middleware\WithoutOverlapping;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new WithoutOverlapping($this->user->id)];
    }

同类型的任何重叠任务都会被重新放回队列。你还可以指定重新放回的任务在再次被尝试之前必须经过的秒数：

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->order->id))->releaseAfter(60)];
    }

如果你希望立即删除任何重叠的任务，使其不再被重试，可以使用 `dontRelease` 方法：

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->order->id))->dontRelease()];
    }

`WithoutOverlapping` 中间件基于 Laravel 的原子锁特性实现。有时你的任务可能意外失败或超时，导致锁没有被释放。因此，你可以使用 `expireAfter` 方法显式定义锁的过期时间。例如，下面的例子会指示 Laravel 在任务开始处理三分钟后释放 `WithoutOverlapping` 锁：

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->order->id))->expireAfter(180)];
    }

> [!WARNING]
> `WithoutOverlapping` 中间件要求缓存驱动支持[锁](/docs/{{version}}/cache#atomic-locks)。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

<a name="sharing-lock-keys"></a>
#### 在任务类之间共享锁键

默认情况下，`WithoutOverlapping` 中间件只会阻止同一类任务之间的重叠。因此，尽管两个不同的任务类可能使用相同的锁键，它们仍然不会互相阻止重叠。不过，你可以使用 `shared` 方法指示 Laravel 把该键跨任务类应用：

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
### 限制异常

Laravel 内置了 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，可以让你对异常进行限制。一旦任务抛出指定数量的异常，后续所有执行该任务的尝试都会被延迟，直到指定的时间间隔结束。该中间件对于与不稳定的第三方服务交互的任务尤其有用。

例如，假设某个队列任务与一个开始抛出异常的第三方 API 交互。要限制异常，可以从任务的 `middleware` 方法中返回 `ThrottlesExceptions` 中间件。通常，该中间件应当与实现了[基于时间的尝试](#time-based-attempts)的任务搭配使用：

    use DateTime;
    use Illuminate\Queue\Middleware\ThrottlesExceptions;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new ThrottlesExceptions(10, 5 * 60)];
    }

    /**
     * 确定任务应当超时的时间点。
     */
    public function retryUntil(): DateTime
    {
        return now()->addMinutes(30);
    }

该中间件接受的第一个构造函数参数是任务在被限制之前可以抛出的异常数量，第二个构造函数参数是任务被限制之后再次尝试之前应当经过的秒数。在上面的代码示例中，如果任务连续抛出 10 次异常，我们会等待 5 分钟后再尝试该任务，同时受 30 分钟的时间上限约束。

当任务抛出异常但尚未达到异常阈值时，任务通常会立即重试。不过，你可以在把中间件挂到任务上时调用 `backoff` 方法，指定这类任务应当延迟多少分钟：

    use Illuminate\Queue\Middleware\ThrottlesExceptions;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new ThrottlesExceptions(10, 5 * 60))->backoff(5)];
    }

在内部，该中间件使用 Laravel 的缓存系统来实现速率限制，并使用任务的类名作为缓存"键"。你可以在把中间件挂到任务上时调用 `by` 方法覆盖该键。如果有多个任务与同一个第三方服务交互，并且你希望它们共享同一个限制"桶"，这会很有用：

    use Illuminate\Queue\Middleware\ThrottlesExceptions;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new ThrottlesExceptions(10, 10 * 60))->by('key')];
    }

默认情况下，该中间件会限制每一个异常。你可以在把中间件挂到任务上时调用 `when` 方法来改变这一行为。这样一来，只有当传给 `when` 方法的闭包返回 `true` 时，异常才会被限制：

    use Illuminate\Http\Client\HttpClientException;
    use Illuminate\Queue\Middleware\ThrottlesExceptions;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new ThrottlesExceptions(10, 10 * 60))->when(
            fn (Throwable $throwable) => $throwable instanceof HttpClientException
        )];
    }

如果你希望把被限制的异常上报给应用的异常处理器，可以在把中间件挂到任务上时调用 `report` 方法。此外，你还可以向 `report` 方法提供一个闭包，只有当该闭包返回 `true` 时才会上报异常：

    use Illuminate\Http\Client\HttpClientException;
    use Illuminate\Queue\Middleware\ThrottlesExceptions;

    /**
     * 获取该任务应当经过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new ThrottlesExceptions(10, 10 * 60))->report(
            fn (Throwable $throwable) => $throwable instanceof HttpClientException
        )];
    }

> [!NOTE]
> 如果你使用 Redis，可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它针对 Redis 做了调优，比基础的异常限制中间件更高效。

<a name="skipping-jobs"></a>
### 跳过任务

`Skip` 中间件允许你指定某个任务应当被跳过 / 删除，而无需修改任务本身的逻辑。如果给定条件求值为 `true`，`Skip::when` 方法会删除该任务；如果条件求值为 `false`，`Skip::unless` 方法会删除该任务：

    use Illuminate\Queue\Middleware\Skip;

    /**
    * 获取该任务应当经过的中间件。
    */
    public function middleware(): array
    {
        return [
            Skip::when($someCondition),
        ];
    }

你也可以向 `when` 和 `unless` 方法传入 `Closure`，以进行更复杂的条件求值：

    use Illuminate\Queue\Middleware\Skip;

    /**
    * 获取该任务应当经过的中间件。
    */
    public function middleware(): array
    {
        return [
            Skip::when(function (): bool {
                return $this->shouldSkip();
            }),
        ];
    }

<a name="dispatching-jobs"></a>
## 分发任务

写好任务类之后，你可以使用任务自身的 `dispatch` 方法来分发它。传给 `dispatch` 方法的参数会被交给任务的构造函数：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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
            $podcast = Podcast::create(/* ... */);

            // ...

            ProcessPodcast::dispatch($podcast);

            return redirect('/podcasts');
        }
    }

如果你希望按条件分发任务，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

    ProcessPodcast::dispatchIf($accountActive, $podcast);

    ProcessPodcast::dispatchUnless($accountSuspended, $podcast);

在全新的 Laravel 应用中，`sync` 驱动是默认的队列驱动。该驱动会在当前请求的前台同步执行任务，这在本地开发中往往很方便。如果你希望真正开始把任务入队以便在后台处理，可以在应用的 `config/queue.php` 配置文件中指定其它队列驱动。

<a name="delayed-dispatching"></a>
### 延迟分发

如果你希望指定某个任务在分发之后的一段时间内不能被队列工作进程处理，可以在分发任务时使用 `delay` 方法。例如，我们来指定某个任务在分发后 10 分钟内不能被处理：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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
            $podcast = Podcast::create(/* ... */);

            // ...

            ProcessPodcast::dispatch($podcast)
                ->delay(now()->addMinutes(10));

            return redirect('/podcasts');
        }
    }

在某些情况下，任务可能配置了默认延迟。如果你需要绕过该延迟并立即分发任务，可以使用 `withoutDelay` 方法：

    ProcessPodcast::dispatch($podcast)->withoutDelay();

> [!WARNING]
> Amazon SQS 队列服务的最大延迟时间为 15 分钟。

<a name="dispatching-after-the-response-is-sent-to-browser"></a>
#### 在响应发送到浏览器之后分发

或者，如果你的 Web 服务器使用 FastCGI，`dispatchAfterResponse` 方法会把任务的分发推迟到 HTTP 响应发送到用户浏览器之后。这样即便某个队列任务仍在执行，用户也可以开始使用应用。这通常只应用于耗时约一秒的任务，例如发送电子邮件。由于它们在当前 HTTP 请求内被处理，以这种方式分发的任务不需要运行队列工作进程才能被处理：

    use App\Jobs\SendNotification;

    SendNotification::dispatchAfterResponse();

你也可以 `dispatch` 一个闭包，并把 `afterResponse` 方法链式接到 `dispatch` 辅助函数上，以便在 HTTP 响应发送到浏览器之后执行闭包：

    use App\Mail\WelcomeMessage;
    use Illuminate\Support\Facades\Mail;

    dispatch(function () {
        Mail::to('taylor@example.com')->send(new WelcomeMessage);
    })->afterResponse();

<a name="synchronous-dispatching"></a>
### 同步分发

如果你希望立即（同步）分发某个任务，可以使用 `dispatchSync` 方法。使用该方法时，任务不会入队，而会在当前进程中立即执行：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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
            $podcast = Podcast::create(/* ... */);

            // 创建播客……

            ProcessPodcast::dispatchSync($podcast);

            return redirect('/podcasts');
        }
    }

<a name="jobs-and-database-transactions"></a>
### 任务与数据库事务

在数据库事务中分发任务本身完全没有问题，但你应当特别小心，确保任务确实能够成功执行。在事务中分发任务时，工作进程可能会在父事务提交之前就处理该任务。一旦发生这种情况，你在数据库事务期间对模型或数据库记录所做的任何更新都可能尚未反映到数据库中。此外，在事务中创建的模型或数据库记录可能尚不存在于数据库中。

幸运的是，Laravel 提供了几种规避这个问题的方法。首先，你可以在队列连接的配置数组中设置 `after_commit` 连接选项：

    'redis' => [
        'driver' => 'redis',
        // ...
        'after_commit' => true,
    ],

当 `after_commit` 选项为 `true` 时，你可以在数据库事务中分发任务；不过，Laravel 会等到未结束的父数据库事务提交之后才真正分发任务。当然，如果没有正在进行的数据库事务，任务会立即被分发。

如果事务因期间发生的异常而被回滚，那么在该事务期间分发的任务都会被丢弃。

> [!NOTE]
> 把 `after_commit` 配置选项设为 `true`，还会使任何入队的事件监听器、邮件、通知和广播事件都在所有未结束的数据库事务提交之后才被分发。

<a name="specifying-commit-dispatch-behavior-inline"></a>
#### 内联指定提交时分发行为

即使你没有把 `after_commit` 队列连接配置选项设为 `true`，你仍然可以指明某个特定任务应在所有未结束的数据库事务提交之后才被分发。为此，可以把 `afterCommit` 方法链式接到你的分发操作上：

    use App\Jobs\ProcessPodcast;

    ProcessPodcast::dispatch($podcast)->afterCommit();

同理，如果 `after_commit` 配置选项被设为 `true`，你也可以指明某个特定任务应当立即分发，而不等待任何未结束的数据库事务提交：

    ProcessPodcast::dispatch($podcast)->beforeCommit();

<a name="job-chaining"></a>
### 任务链

任务链允许你指定一份队列任务列表，它们会在主任务成功执行之后按顺序运行。如果序列中的某个任务失败，其余任务都不会运行。要执行队列任务链，可以使用 `Bus` Facade 提供的 `chain` 方法。Laravel 的命令总线是一个更底层的组件，队列任务分发正是构建在它之上的：

    use App\Jobs\OptimizePodcast;
    use App\Jobs\ProcessPodcast;
    use App\Jobs\ReleasePodcast;
    use Illuminate\Support\Facades\Bus;

    Bus::chain([
        new ProcessPodcast,
        new OptimizePodcast,
        new ReleasePodcast,
    ])->dispatch();

除了链式调用任务类实例之外，你也可以链式调用闭包：

    Bus::chain([
        new ProcessPodcast,
        new OptimizePodcast,
        function () {
            Podcast::update(/* ... */);
        },
    ])->dispatch();

> [!WARNING]
> 在任务中使用 `$this->delete()` 方法删除任务，并不能阻止被链式的任务被处理。只有当链中的某个任务失败时，这条链才会停止执行。

<a name="chain-connection-queue"></a>
#### 链的连接与队列

如果你希望指定被链式任务所使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。这两个方法指定了应当使用的队列连接和队列名称，除非被排队的任务被显式指定了其它连接 / 队列：

    Bus::chain([
        new ProcessPodcast,
        new OptimizePodcast,
        new ReleasePodcast,
    ])->onConnection('redis')->onQueue('podcasts')->dispatch();

<a name="adding-jobs-to-the-chain"></a>
#### 添加任务到链中

偶尔，你可能需要在链中另一个任务内部，为已有的任务链前置或后置一个任务。可以使用 `prependToChain` 和 `appendToChain` 方法实现：

```php
/**
 * 执行该任务。
 */
public function handle(): void
{
    // ...

    // 插入到当前链的开头，在当前任务之后立即运行……
    $this->prependToChain(new TranscribePodcast);

    // 追加到当前链的末尾，在链的末尾运行任务……
    $this->appendToChain(new TranscribePodcast);
}
```

<a name="chain-failures"></a>
#### 链的失败

在链式处理任务时，你可以使用 `catch` 方法指定一个闭包，用于在链中某个任务失败时被调用。给定的回调会接收到导致任务失败的 `Throwable` 实例：

    use Illuminate\Support\Facades\Bus;
    use Throwable;

    Bus::chain([
        new ProcessPodcast,
        new OptimizePodcast,
        new ReleasePodcast,
    ])->catch(function (Throwable $e) {
        // 链中的某个任务已失败……
    })->dispatch();

> [!WARNING]
> 由于链式回调会被序列化，并由 Laravel 队列在稍后的时间执行，因此你不应在链式回调中使用 `$this` 变量。

<a name="customizing-the-queue-and-connection"></a>
### 自定义队列与连接

<a name="dispatching-to-a-particular-queue"></a>
#### 分发到特定队列

通过把任务推送到不同的队列，你可以对队列任务进行"分类"，甚至决定为各个队列分配多少个工作进程。请注意，这并不会把任务推送到队列配置文件中定义的不同队列"连接"，而只是推送到单个连接内的特定队列。要指定队列，请在分发任务时使用 `onQueue` 方法：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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
            $podcast = Podcast::create(/* ... */);

            // 创建播客……

            ProcessPodcast::dispatch($podcast)->onQueue('processing');

            return redirect('/podcasts');
        }
    }

或者，你可以在任务的构造函数内调用 `onQueue` 方法来指定任务的队列：

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

<a name="dispatching-to-a-particular-connection"></a>
#### 分发到特定连接

如果你的应用与多个队列连接交互，可以使用 `onConnection` 方法指定把任务推送到哪个连接：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
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
            $podcast = Podcast::create(/* ... */);

            // 创建播客……

            ProcessPodcast::dispatch($podcast)->onConnection('sqs');

            return redirect('/podcasts');
        }
    }

你可以把 `onConnection` 和 `onQueue` 方法链式组合起来，为一个任务指定连接与队列：

    ProcessPodcast::dispatch($podcast)
        ->onConnection('sqs')
        ->onQueue('processing');

或者，你可以在任务的构造函数内调用 `onConnection` 方法来指定任务的连接：

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

<a name="max-job-attempts-and-timeout"></a>
### 指定最大任务尝试次数 / 超时值

<a name="max-attempts"></a>
#### 最大尝试次数

如果你的某个队列任务遇到错误，你多半不希望它无限期地重试。因此，Laravel 提供了多种方式来指定一个任务可以被尝试多少次、或尝试多长时间。

指定任务最大尝试次数的一种方式，是使用 Artisan 命令行上的 `--tries` 开关。除非正在处理的任务自行指定了可尝试次数，否则该值会作用于工作进程处理的所有任务：

```shell
php artisan queue:work --tries=3
```

如果一个任务超出了其最大尝试次数，它就会被视为"失败"任务。关于处理失败任务的更多信息，请查阅[失败任务文档](#dealing-with-failed-jobs)。如果向 `queue:work` 命令提供 `--tries=0`，任务将被无限期重试。

你可以采用更精细的方式，直接在任务类上定义任务可被尝试的最大次数。如果最大尝试次数指定在任务上，它的优先级会高于命令行上提供的 `--tries` 值：

    <?php

    namespace App\Jobs;

    class ProcessPodcast implements ShouldQueue
    {
        /**
         * 任务可以被尝试的次数。
         *
         * @var int
         */
        public $tries = 5;
    }

如果你需要对某个特定任务的最大尝试次数进行动态控制，可以在任务上定义 `tries` 方法：

    /**
     * 确定任务可以被尝试的次数。
     */
    public function tries(): int
    {
        return 5;
    }

<a name="time-based-attempts"></a>
#### 基于时间的尝试

除了定义任务在失败之前可以被尝试多少次之外，你也可以定义任务不再被尝试的时间点。这允许任务在给定时间范围内被尝试任意次数。要定义任务不再被尝试的时间点，向你的任务类添加 `retryUntil` 方法。该方法应当返回一个 `DateTime` 实例：

    use DateTime;

    /**
     * 确定任务应当超时的时间点。
     */
    public function retryUntil(): DateTime
    {
        return now()->addMinutes(10);
    }

> [!NOTE]
> 你也可以在[队列事件监听器](/docs/{{version}}/events#queued-event-listeners)上定义 `tries` 属性或 `retryUntil` 方法。

<a name="max-exceptions"></a>
#### 最大异常数

有时你可能希望指定某个任务可以被尝试很多次，但如果重试是由给定数量的未处理异常触发的（而不是由 `release` 方法直接放回），任务就应当失败。为此，你可以在任务类上定义 `maxExceptions` 属性：

    <?php

    namespace App\Jobs;

    use Illuminate\Support\Facades\Redis;

    class ProcessPodcast implements ShouldQueue
    {
        /**
         * 任务可以被尝试的次数。
         *
         * @var int
         */
        public $tries = 25;

        /**
         * 在失败之前允许的未处理异常的最大数量。
         *
         * @var int
         */
        public $maxExceptions = 3;

        /**
         * 执行该任务。
         */
        public function handle(): void
        {
            Redis::throttle('key')->allow(10)->every(60)->then(function () {
                // 已获取锁，处理该播客……
            }, function () {
                // 无法获取锁……
                return $this->release(10);
            });
        }
    }

在这个例子中，如果应用无法获取 Redis 锁，任务会被放回队列 10 秒，并继续重试直到 25 次。不过，如果任务抛出三个未处理异常，任务就会失败。

<a name="timeout"></a>
#### 超时

通常，你大致知道队列任务预计需要多长时间。因此，Laravel 允许你指定一个"超时"值。默认的超时值为 60 秒。如果一个任务的处理时间超过了超时值所指定的秒数，处理该任务的工作进程会带着错误退出。通常，工作进程会由[服务器上配置的进程管理器](#supervisor-configuration)自动重启。

任务可以运行的最大秒数可以使用 Artisan 命令行上的 `--timeout` 开关指定：

```shell
php artisan queue:work --timeout=30
```

如果任务不断超时并因此超出其最大尝试次数，它就会被标记为失败。

你也可以直接在任务类上定义任务允许运行的最大秒数。如果超时指定在任务上，它的优先级会高于命令行上指定的任何超时值：

    <?php

    namespace App\Jobs;

    class ProcessPodcast implements ShouldQueue
    {
        /**
         * 任务在超时之前可以运行的秒数。
         *
         * @var int
         */
        public $timeout = 120;
    }

有时，诸如套接字或对外 HTTP 连接之类的 IO 阻塞进程可能不会遵守你指定的超时值。因此，使用这些特性时，你始终应当尝试通过它们各自的 API 指定超时值。例如，使用 Guzzle 时，你应当始终指定连接超时值和请求超时值。

> [!WARNING]
> 必须安装 `pcntl` PHP 扩展才能指定任务超时。此外，任务的"超时"值应当始终小于其 ["retry after"](#job-expiration) 值。否则，任务可能在真正执行完成或超时之前就被重新尝试。

<a name="failing-on-timeout"></a>
#### 超时即失败

如果你希望指明某个任务在超时时应当被标记为[失败](#dealing-with-failed-jobs)，可以在任务类上定义 `$failOnTimeout` 属性：

```php
/**
 * 指示任务在超时时是否应被标记为失败。
 *
 * @var bool
 */
public $failOnTimeout = true;
```

<a name="error-handling"></a>
### 错误处理

如果任务在处理期间抛出异常，任务会自动被重新放回队列，以便可以再次被尝试。任务会持续被放回，直到它被尝试了应用所允许的最大次数。最大尝试次数由 `queue:work` Artisan 命令上使用的 `--tries` 开关定义。或者，最大尝试次数也可以在任务类本身上定义。关于运行队列工作进程的更多信息，[可以见下文](#running-the-queue-worker)。

<a name="manually-releasing-a-job"></a>
#### 手动放回任务

有时你可能希望手动把某个任务放回队列，以便它能在稍后被再次尝试。可以调用 `release` 方法实现：

    /**
     * 执行该任务。
     */
    public function handle(): void
    {
        // ...

        $this->release();
    }

默认情况下，`release` 方法会把任务放回队列以便立即处理。不过，你可以向 `release` 方法传入一个整数或日期实例，指示队列在经过给定秒数之前不要让该任务被处理：

    $this->release(10);

    $this->release(now()->addSeconds(10));

<a name="manually-failing-a-job"></a>
#### 手动标记任务失败

偶尔你可能需要手动把某个任务标记为"失败"。为此，可以调用 `fail` 方法：

    /**
     * 执行该任务。
     */
    public function handle(): void
    {
        // ...

        $this->fail();
    }

如果你希望因为捕获到的某个异常而把任务标记为失败，可以把该异常传给 `fail` 方法。或者，为方便起见，你可以传入一个字符串错误消息，它会被为你转换为异常：

    $this->fail($exception);

    $this->fail('Something went wrong.');

> [!NOTE]
> 关于失败任务的更多信息，请查阅[处理任务失败的文档](#dealing-with-failed-jobs)。

<a name="job-batching"></a>
## 任务批处理

Laravel 的任务批处理功能允许你轻松执行一批任务，并在该批任务执行完成之后执行某些操作。在开始之前，你应当创建一个数据库迁移来构建一张表，用于保存关于任务批次的元信息，例如它们的完成百分比。该迁移可以使用 `make:queue-batches-table` Artisan 命令生成：

```shell
php artisan make:queue-batches-table

php artisan migrate
```

<a name="defining-batchable-jobs"></a>
### 定义可批处理的任务

要定义一个可批处理的任务，你应当照常[创建一个可入队的任务](#creating-jobs)；不过，你需要把 `Illuminate\Bus\Batchable` Trait 加入任务类。该 Trait 提供了一个 `batch` 方法访问器，可用于获取当前任务所执行的批次：

    <?php

    namespace App\Jobs;

    use Illuminate\Bus\Batchable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Foundation\Queue\Queueable;

    class ImportCsv implements ShouldQueue
    {
        use Batchable, Queueable;

        /**
         * 执行该任务。
         */
        public function handle(): void
        {
            if ($this->batch()->cancelled()) {
                // 判断批次是否已被取消……

                return;
            }

            // 导入 CSV 文件的一部分……
        }
    }

<a name="dispatching-batches"></a>
### 分发批次

要分发一批任务，应当使用 `Bus` Facade 的 `batch` 方法。当然，批处理主要在与完成回调结合使用时才更有用。因此，你可以使用 `then`、`catch` 和 `finally` 方法为该批次定义完成回调。这些回调在被调用时都会接收到一个 `Illuminate\Bus\Batch` 实例。在这个例子中，我们假设正在把一批任务加入队列，每个任务处理 CSV 文件中的若干行：

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
        // 批次已创建，但尚未添加任何任务……
    })->progress(function (Batch $batch) {
        // 单个任务已成功完成……
    })->then(function (Batch $batch) {
        // 所有任务已成功完成……
    })->catch(function (Batch $batch, Throwable $e) {
        // 检测到批次中第一个任务失败……
    })->finally(function (Batch $batch) {
        // 批次已完成执行……
    })->dispatch();

    return $batch->id;

批次的 ID 可以通过 `$batch->id` 属性访问，也可以在批次被分发之后用来[查询 Laravel 命令总线](#inspecting-batches)以获取有关该批次的信息。

> [!WARNING]
> 由于批次回调会被序列化，并由 Laravel 队列在稍后的时间执行，因此你不应在这些回调中使用 `$this` 变量。此外，由于批处理任务被包裹在数据库事务中，因此不应在任务内部执行会触发隐式提交的数据库语句。

<a name="naming-batches"></a>
#### 为批次命名

如果批次被命名，Laravel Horizon 和 Laravel Telescope 等工具可能会提供对用户更友好的调试信息。要为批次指定一个任意名称，可以在定义批次时调用 `name` 方法：

    $batch = Bus::batch([
        // ...
    ])->then(function (Batch $batch) {
        // 所有任务已成功完成……
    })->name('Import CSV')->dispatch();

<a name="batch-connection-queue"></a>
#### 批次的连接与队列

如果你希望指定批处理任务所使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。所有批处理任务都必须在同一个连接和同一个队列中执行：

    $batch = Bus::batch([
        // ...
    ])->then(function (Batch $batch) {
        // 所有任务已成功完成……
    })->onConnection('redis')->onQueue('imports')->dispatch();

<a name="chains-and-batches"></a>
### 链与批次

你可以通过把被链式的任务放入一个数组，来在批次中定义一组[被链式的任务](#job-chaining)。例如，我们可以并行执行两条任务链，并在两条任务链都处理完成之后执行一个回调：

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
        // ...
    })->dispatch();

反过来，你也可以通过在[链](#job-chaining)中定义批次，来在链中运行一批任务。例如，你可以先运行一批任务来发布多个播客，然后再运行一批任务来发送发布通知：

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

<a name="adding-jobs-to-batches"></a>
### 添加任务到批次

有时，从一个批处理任务内部向批次添加更多任务会很有用。当你需要把数千个任务批处理化，而它们在一个 Web 请求期间分发又太慢时，这种模式会很有用。因此，你可以改为分发一批初始的"加载器"任务，由它们为该批次填充更多任务：

    $batch = Bus::batch([
        new LoadImportBatch,
        new LoadImportBatch,
        new LoadImportBatch,
    ])->then(function (Batch $batch) {
        // 所有任务已成功完成……
    })->name('Import Contacts')->dispatch();

在这个例子中，我们会用 `LoadImportBatch` 任务为该批次填充更多任务。为此，可以使用批次实例上的 `add` 方法来添加任务，该实例可以通过任务的 `batch` 方法访问：

    use App\Jobs\ImportContacts;
    use Illuminate\Support\Collection;

    /**
     * 执行该任务。
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

> [!WARNING]
> 你只能从属于同一批次的任务内部向该批次添加任务。

<a name="inspecting-batches"></a>
### 检查批次

传给批次完成回调的 `Illuminate\Bus\Batch` 实例提供了多种属性和方法，帮助你与检查给定的任务批次进行交互：

    // 批次的 UUID……
    $batch->id;

    // 批次名称（如果适用）……
    $batch->name;

    // 指派给该批次的任务数量……
    $batch->totalJobs;

    // 尚未被队列处理的任务数量……
    $batch->pendingJobs;

    // 已经失败的任务数量……
    $batch->failedJobs;

    // 到目前为止已经处理的任务数量……
    $batch->processedJobs();

    // 该批次的完成百分比（0-100）……
    $batch->progress();

    // 指示该批次是否已完成执行……
    $batch->finished();

    // 取消该批次的执行……
    $batch->cancel();

    // 指示该批次是否已被取消……
    $batch->cancelled();

<a name="returning-batches-from-routes"></a>
#### 从路由返回批次

所有 `Illuminate\Bus\Batch` 实例都是 JSON 可序列化的，这意味着你可以直接从应用的某个路由返回它们，以获取包含批次信息（包括其完成进度）的 JSON 负载。这让你可以方便地在应用 UI 中展示批次的完成进度。

要按 ID 获取某个批次，可以使用 `Bus` Facade 的 `findBatch` 方法：

    use Illuminate\Support\Facades\Bus;
    use Illuminate\Support\Facades\Route;

    Route::get('/batch/{batchId}', function (string $batchId) {
        return Bus::findBatch($batchId);
    });

<a name="cancelling-batches"></a>
### 取消批次

有时你可能需要取消某个批次的执行。可以在 `Illuminate\Bus\Batch` 实例上调用 `cancel` 方法实现：

    /**
     * 执行该任务。
     */
    public function handle(): void
    {
        if ($this->user->exceedsImportLimit()) {
            return $this->batch()->cancel();
        }

        if ($this->batch()->cancelled()) {
            return;
        }
    }

正如你在前面的例子中可能已经注意到的，批处理任务在继续执行之前，通常应当先判断其对应的批次是否已被取消。不过，为方便起见，你也可以改为把 `SkipIfBatchCancelled` [中间件](#job-middleware)指派给任务。正如其名所示，该中间件会指示 Laravel 在其对应的批次已被取消时不要处理该任务：

    use Illuminate\Queue\Middleware\SkipIfBatchCancelled;

    /**
     * 获取该任务应当经过的中间件。
     */
    public function middleware(): array
    {
        return [new SkipIfBatchCancelled];
    }

<a name="batch-failures"></a>
### 批次失败

当某个批处理任务失败时，`catch` 回调（如果已指派）会被调用。该回调只会在批次中第一个失败的任务上被调用。

<a name="allowing-failures"></a>
#### 允许失败

当批次中的某个任务失败时，Laravel 会自动把该批次标记为"已取消"。如果你愿意，可以禁用这一行为，使任务失败不会自动把批次标记为已取消。这可以在分发批次时调用 `allowFailures` 方法实现：

    $batch = Bus::batch([
        // ...
    ])->then(function (Batch $batch) {
        // 所有任务已成功完成……
    })->allowFailures()->dispatch();

<a name="retrying-failed-batch-jobs"></a>
#### 重试失败的批次任务

为方便起见，Laravel 提供了 `queue:retry-batch` Artisan 命令，让你能够轻松重试某个给定批次的全部失败任务。`queue:retry-batch` 命令接受要重试其失败任务的批次 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

<a name="pruning-batches"></a>
### 清理批次

如果不进行清理，`job_batches` 表的记录会很快累积。为缓解这个问题，你应当[调度](/docs/{{version}}/scheduling) `queue:prune-batches` Artisan 命令每天运行：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('queue:prune-batches')->daily();

默认情况下，所有完成时间超过 24 小时的已结束批次都会被清理。你可以在调用该命令时使用 `hours` 选项来决定保留批次数据多长时间。例如，下面的命令会删除所有在 48 小时前就已完成的批次：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('queue:prune-batches --hours=48')->daily();

有时，你的 `jobs_batches` 表也可能为那些始终未成功完成的批次累积批次记录，例如某个任务失败且该任务从未被成功重试的批次。你可以指示 `queue:prune-batches` 命令使用 `unfinished` 选项来清理这些未完成的批次记录：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('queue:prune-batches --hours=48 --unfinished=72')->daily();

同样，你的 `jobs_batches` 表也可能为已取消的批次累积批次记录。你可以指示 `queue:prune-batches` 命令使用 `cancelled` 选项来清理这些已取消的批次记录：

    use Illuminate\Support\Facades\Schedule;

    Schedule::command('queue:prune-batches --hours=48 --cancelled=72')->daily();

<a name="storing-batches-in-dynamodb"></a>
### 在 DynamoDB 中存储批次

Laravel 还支持把批次元信息存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库中。不过，你需要手动创建一张 DynamoDB 表来存放全部批次记录。

通常，这张表应当命名为 `job_batches`，但你应当根据应用 `queue` 配置文件中 `queue.batching.table` 配置项的值来为该表命名。

<a name="dynamodb-batch-table-configuration"></a>
#### DynamoDB 批次表配置

`job_batches` 表应当有一个名为 `application` 的字符串类型主分区键，以及一个名为 `id` 的字符串类型主排序键。键中 `application` 部分会存放你的应用名称，该名称由应用 `app` 配置文件中的 `name` 配置项定义。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表来存放多个 Laravel 应用的任务批次。

此外，如果你希望使用[自动批次清理](#pruning-batches-in-dynamodb)，可以为你的表定义 `ttl` 属性。

<a name="dynamodb-configuration"></a>
#### DynamoDB 配置

接下来，安装 AWS SDK，让你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，把 `queue.batching.driver` 配置项的值设为 `dynamodb`。此外，你还应当在 `batching` 配置数组中定义 `key`、`secret` 和 `region` 配置项。这些配置项将用于向 AWS 认证。当使用 `dynamodb` 驱动时，`queue.batching.database` 配置项是不必要的：

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

当使用 [DynamoDB](https://aws.amazon.com/dynamodb) 存储任务批次信息时，通常用于清理关系型数据库中批次的清理命令将不再适用。此时，你可以使用 [DynamoDB 原生的 TTL 功能](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)自动移除旧批次的记录。

如果你在定义 DynamoDB 表时提供了 `ttl` 属性，可以定义配置参数来指示 Laravel 如何清理批次记录。`queue.batching.ttl_attribute` 配置项定义保存 TTL 的属性名称，而 `queue.batching.ttl` 配置项定义批次记录在最后一次更新之后经过多少秒即可从 DynamoDB 表中移除：

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
## 队列闭包

除了把任务类分发到队列之外，你也可以分发一个闭包。这对于需要在当前请求周期之外执行的快速、简单任务非常有用。把闭包分发到队列时，闭包的代码内容会经过加密签名，以保证它在传输过程中无法被篡改：

    $podcast = App\Podcast::find(1);

    dispatch(function () use ($podcast) {
        $podcast->publish();
    });

使用 `catch` 方法，你可以提供一个闭包，用于在入队的闭包耗尽队列所有[已配置的重试尝试](#max-job-attempts-and-timeout)之后仍未能成功完成时执行：

    use Throwable;

    dispatch(function () use ($podcast) {
        $podcast->publish();
    })->catch(function (Throwable $e) {
        // 该任务已失败……
    });

> [!WARNING]
> 由于 `catch` 回调会被序列化，并由 Laravel 队列在稍后的时间执行，因此你不应在 `catch` 回调中使用 `$this` 变量。

<a name="running-the-queue-worker"></a>
## 运行队列工作进程

<a name="the-queue-work-command"></a>
### `queue:work` 命令

Laravel 内置了一个 Artisan 命令，用于启动队列工作进程并在新任务被推入队列时处理它们。你可以使用 `queue:work` Artisan 命令运行该工作进程。请注意，一旦 `queue:work` 命令启动，它就会持续运行，直到你手动停止它或关闭终端：

```shell
php artisan queue:work
```

> [!NOTE]
> 要让 `queue:work` 进程永久在后台运行，应当使用 [Supervisor](#supervisor-configuration) 之类的进程监控器，确保队列工作进程不会停止运行。

如果希望在命令输出中包含已处理任务的 ID，可以在调用 `queue:work` 命令时带上 `-v` 标志：

```shell
php artisan queue:work -v
```

请记住，队列工作进程是长期存活的进程，会把已引导的应用状态保存在内存中。因此，它们在启动之后不会察觉到代码库中的变化。因此，在部署过程中，务必[重启你的队列工作进程](#queue-workers-and-deployment)。此外，请记住你的应用创建或修改的任何静态状态都不会在任务之间自动重置。

或者，你也可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当你想要重新加载更新后的代码或重置应用状态，不必手动重启工作进程；不过，该命令的效率明显低于 `queue:work` 命令：

```shell
php artisan queue:listen
```

<a name="running-multiple-queue-workers"></a>
#### 运行多个队列工作进程

要为某个队列分配多个工作进程并发处理任务，只需启动多个 `queue:work` 进程即可。这既可以在本地通过终端的多个标签页完成，也可以在生产环境中通过进程管理器的配置设置完成。[使用 Supervisor 时](#supervisor-configuration)，你可以使用 `numprocs` 配置项。

<a name="specifying-the-connection-queue"></a>
#### 指定连接与队列

你也可以指定工作进程应当使用哪个队列连接。传给 `work` 命令的连接名应当对应 `config/queue.php` 配置文件中定义的某个连接：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令只处理给定连接上的默认队列中的任务。不过，你还可以进一步自定义队列工作进程，让它只处理某个连接上的特定队列。例如，如果你所有邮件都在 `redis` 队列连接的 `emails` 队列中处理，可以执行下面的命令来启动一个只处理该队列的工作进程：

```shell
php artisan queue:work redis --queue=emails
```

<a name="processing-a-specified-number-of-jobs"></a>
#### 处理指定数量的任务

可以使用 `--once` 选项指示工作进程只处理队列中的一个任务：

```shell
php artisan queue:work --once
```

可以使用 `--max-jobs` 选项指示工作进程处理给定数量的任务后退出。该选项与 [Supervisor](#supervisor-configuration)结合使用时非常有用，这样你的工作进程在处理完给定数量的任务后会被自动重启，从而释放它们可能累积的内存：

```shell
php artisan queue:work --max-jobs=1000
```

<a name="processing-all-queued-jobs-then-exiting"></a>
#### 处理所有排队任务后退出

可以使用 `--stop-when-empty` 选项指示工作进程处理完所有任务后优雅退出。如果你在 Docker 容器中处理 Laravel 队列，并希望在队列为空之后关闭容器，该选项会很有用：

```shell
php artisan queue:work --stop-when-empty
```

<a name="processing-jobs-for-a-given-number-of-seconds"></a>
#### 处理任务指定秒数

可以使用 `--max-time` 选项指示工作进程处理任务给定秒数后退出。该选项与 [Supervisor](#supervisor-configuration)结合使用时非常有用，这样你的工作进程在处理任务给定时长后会被自动重启，从而释放它们可能累积的内存：

```shell
# 处理任务一小时后退出……
php artisan queue:work --max-time=3600
```

<a name="worker-sleep-duration"></a>
#### 工作进程休眠时长

当队列上有可用任务时，工作进程会持续处理任务，任务之间没有延迟。不过，`sleep` 选项决定了在没有可用任务时工作进程会"休眠"多少秒。当然，在休眠期间，工作进程不会处理任何新任务：

```shell
php artisan queue:work --sleep=3
```

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当你的应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，排队任务不会被处理。一旦应用退出维护模式，这些任务就会恢复正常处理。

要强制你的队列工作进程即使在启用维护模式时也处理任务，可以使用 `--force` 选项：

```shell
php artisan queue:work --force
```

<a name="resource-considerations"></a>
#### 资源注意事项

守护进程式队列工作进程在处理每个任务之前并不会"重新启动"框架。因此，你应当在每个任务完成后释放所有占用较重的资源。例如，如果你使用 GD 库进行图像处理，那么在处理完图像后应当使用 `imagedestroy` 释放内存。

<a name="queue-priorities"></a>
### 队列优先级

有时你可能希望为队列的处理顺序设定优先级。例如，在 `config/queue.php` 配置文件中，你可以把 `redis` 连接的默认 `queue` 设为 `low`。不过，偶尔你可能希望把某个任务推送到像 `high` 这样高优先级的队列：

    dispatch((new Job)->onQueue('high'));

要启动一个先确保所有 `high` 队列任务都被处理完毕、然后才继续处理 `low` 队列任务的工作进程，可以把一个以逗号分隔的队列名称列表传给 `work` 命令：

```shell
php artisan queue:work --queue=high,low
```

<a name="queue-workers-and-deployment"></a>
### 队列工作进程与部署

由于队列工作进程是长期存活的进程，如果不重启它们，它们不会察觉到代码的变化。因此，使用队列工作进程部署应用最简单的办法，就是在部署过程中重启这些工作进程。你可以通过执行 `queue:restart` 命令来优雅地重启所有工作进程：

```shell
php artisan queue:restart
```

该命令会指示所有队列工作进程在完成当前任务处理后优雅退出，从而不会丢失任何已有任务。由于队列工作进程会在执行 `queue:restart` 命令时退出，因此你应当运行 [Supervisor](#supervisor-configuration) 之类的进程管理器，以自动重启队列工作进程。

> [!NOTE]
> 队列使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用该功能之前，请确认已为应用正确配置了缓存驱动。

<a name="job-expirations-and-timeouts"></a>
### 任务过期与超时

<a name="job-expiration"></a>
#### 任务过期

在 `config/queue.php` 配置文件中，每个队列连接都定义了一个 `retry_after` 选项。该选项指定队列连接在重试某个正在处理的任务之前应当等待多少秒。例如，如果 `retry_after` 的值设为 `90`，那么某个任务在处理了 90 秒之后仍未被放回或删除时，就会被重新放回队列。通常，你应当把 `retry_after` 值设为你认为任务合理完成处理所需的最大秒数。

> [!WARNING]
> 唯一不包含 `retry_after` 值的队列连接是 Amazon SQS。SQS 会根据 [Default Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html) 重试任务，该值在 AWS 控制台中管理。

<a name="worker-timeouts"></a>
#### 工作进程超时

`queue:work` Artisan 命令暴露了一个 `--timeout` 选项。`--timeout` 的默认值是 60 秒。如果某个任务的处理时间超过了超时值所指定的秒数，处理该任务的工作进程会带着错误退出。通常，工作进程会由[服务器上配置的进程管理器](#supervisor-configuration)自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置项与 `--timeout` 命令行选项是不同的，但二者协同工作，以确保任务不会丢失，并且任务只会被成功处理一次。

> [!WARNING]
> `--timeout` 值应当始终比你的 `retry_after` 配置值短几秒。这样可以确保处理僵死任务的工作进程总会在任务被重试之前被终止。如果你的 `--timeout` 选项比 `retry_after` 配置值更长，你的任务可能会被处理两次。

<a name="supervisor-configuration"></a>
## Supervisor 配置

在生产环境中，你需要一种方式来让你的 `queue:work` 进程持续运行。`queue:work` 进程可能因各种原因而停止运行，例如工作进程超时，或执行了 `queue:restart` 命令。

因此，你需要配置一个进程监控器，用于检测 `queue:work` 进程何时退出并自动重启它们。此外，进程监控器还能让你指定希望并发运行多少个 `queue:work` 进程。Supervisor 是 Linux 环境中常用的进程监控器，下面我们将介绍如何配置它。

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统上的进程监控器，会在你的 `queue:work` 进程失败时自动重启它们。要在 Ubuntu 上安装 Supervisor，可以使用下面的命令：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自己配置和管理 Supervisor 让你感到为难，可以考虑使用 [Laravel Forge](https://forge.laravel.com)，它会为你的生产 Laravel 项目自动安装并配置 Supervisor。

<a name="configuring-supervisor"></a>
#### 配置 Supervisor

Supervisor 配置文件通常存放在 `/etc/supervisor/conf.d` 目录下。在这个目录中，你可以创建任意数量的配置文件来指示 Supervisor 应当如何监控你的进程。例如，我们来创建一个 `laravel-worker.conf` 文件，用于启动并监控 `queue:work` 进程：

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/app.com/artisan queue:work sqs --sleep=3 --tries=3 --max-time=3600
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

在这个例子中，`numprocs` 指令会指示 Supervisor 运行八个 `queue:work` 进程并监控它们全部，在它们失败时自动重启。你应当修改配置中的 `command` 指令，以反映你想要的队列连接和工作进程选项。

> [!WARNING]
> 你应当确保 `stopwaitsecs` 的值大于你运行时间最长的任务所消耗的秒数。否则，Supervisor 可能会在任务处理完成之前就把它杀掉。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

配置文件创建完成后，你可以使用下面的命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start "laravel-worker:*"
```

关于 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="dealing-with-failed-jobs"></a>
## 处理失败任务

有时你的队列任务会失败。别担心，事情并不总是按计划进行！Laravel 提供了一种便捷方式来[指定任务应被尝试的最大次数](#max-job-attempts-and-timeout)。当一个异步任务超出该尝试次数后，它就会被插入 `failed_jobs` 数据库表。[同步分发的任务](/docs/{{version}}/queues#synchronous-dispatching)失败时不会被存储到该表中，其异常会立即由应用处理。

在全新的 Laravel 应用中，通常已经包含了创建 `failed_jobs` 表的迁移。不过，如果你的应用中不包含该表的迁移，可以使用 `make:queue-failed-table` 命令创建该迁移：

```shell
php artisan make:queue-failed-table

php artisan migrate
```

运行[队列工作进程](#running-the-queue-worker)时，可以使用 `queue:work` 命令上的 `--tries` 开关指定任务应被尝试的最大次数。如果没有为 `--tries` 选项指定值，任务只会被尝试一次，或者按任务类 `$tries` 属性所指定的次数尝试：

```shell
php artisan queue:work redis --tries=3
```

通过 `--backoff` 选项，你可以指定 Laravel 在重试一个遇到异常的任务之前应当等待多少秒。默认情况下，任务会立即被重新放回队列，以便再次被尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你希望按任务逐个配置 Laravel 在重试遇到异常的任务之前应当等待多少秒，可以在任务类上定义 `backoff` 属性：

    /**
     * 重试该任务之前需要等待的秒数。
     *
     * @var int
     */
    public $backoff = 3;

如果你需要更复杂的逻辑来确定任务的退避时间，可以在任务类上定义 `backoff` 方法：

    /**
    * 计算重试该任务之前需要等待的秒数。
    */
    public function backoff(): int
    {
        return 3;
    }

你可以从 `backoff` 方法返回一个退避值数组，从而轻松配置"指数退避"。在这个例子中，如果还有更多尝试剩余，重试延迟将是：第一次重试 1 秒，第二次重试 5 秒，第三次重试 10 秒，之后每次重试都是 10 秒：

    /**
    * 计算重试该任务之前需要等待的秒数。
    *
    * @return array<int, int>
    */
    public function backoff(): array
    {
        return [1, 5, 10];
    }

<a name="cleaning-up-after-failed-jobs"></a>
### 清理失败任务

当某个任务失败时，你可能希望向用户发送警报，或撤销该任务部分完成的操作。为此，你可以在任务类上定义 `failed` 方法。导致任务失败的 `Throwable` 实例会被传给 `failed` 方法：

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
            // 处理已上传的播客……
        }

        /**
         * 处理任务失败。
         */
        public function failed(?Throwable $exception): void
        {
            // 向用户发送失败通知等……
        }
    }

> [!WARNING]
> 调用 `failed` 方法之前会先实例化一个新的任务对象；因此，`handle` 方法中可能发生的类属性修改将会丢失。

<a name="retrying-failed-jobs"></a>
### 重试失败任务

要查看已插入 `failed_jobs` 数据库表中的全部失败任务，可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令会列出任务 ID、连接、队列、失败时间以及该任务的其它信息。任务 ID 可用于重试失败的任务。例如，要重试一个 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败任务，执行下面的命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如有需要，你可以向该命令传入多个 ID：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你也可以重试某个特定队列上的全部失败任务：

```shell
php artisan queue:retry --queue=name
```

要重试全部失败任务，执行 `queue:retry` 命令并把 `all` 作为 ID 传入：

```shell
php artisan queue:retry all
```

如果你希望删除某个失败任务，可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> [!NOTE]
> 使用 [Horizon](/docs/{{version}}/horizon) 时，你应当使用 `horizon:forget` 命令而不是 `queue:forget` 命令来删除失败任务。

要从 `failed_jobs` 表中删除全部失败任务，可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

<a name="ignoring-missing-models"></a>
### 忽略缺失的模型

把一个 Eloquent 模型注入任务时，该模型会在放入队列之前自动被序列化，并在任务被处理时从数据库中重新取出。不过，如果模型在任务等待工作进程处理期间被删除，你的任务可能会因 `ModelNotFoundException` 而失败。

为方便起见，你可以通过把任务的 `deleteWhenMissingModels` 属性设为 `true`，选择自动删除模型缺失的任务。当该属性为 `true` 时，Laravel 会静默地丢弃该任务，而不会抛出异常：

    /**
     * 如果任务的模型已不存在，则删除该任务。
     *
     * @var bool
     */
    public $deleteWhenMissingModels = true;

<a name="pruning-failed-jobs"></a>
### 清理失败任务

你可以通过调用 `queue:prune-failed` Artisan 命令来清理应用 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败任务记录都会被清理。如果向该命令提供 `--hours` 选项，则只有最近 N 小时内插入的失败任务记录会被保留。例如，下面的命令会删除所有在 48 小时前插入的失败任务记录：

```shell
php artisan queue:prune-failed --hours=48
```

<a name="storing-failed-jobs-in-dynamodb"></a>
### 在 DynamoDB 中存储失败任务

Laravel 还支持把失败任务记录存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库表中。不过，你必须手动创建一张 DynamoDB 表来存放全部失败任务记录。通常，这张表应当命名为 `failed_jobs`，但你应当根据应用 `queue` 配置文件中 `queue.failed.table` 配置项的值来为该表命名。

`failed_jobs` 表应当有一个名为 `application` 的字符串类型主分区键，以及一个名为 `uuid` 的字符串类型主排序键。键中 `application` 部分会存放你的应用名称，该名称由应用 `app` 配置文件中的 `name` 配置项定义。由于应用名称是 DynamoDB 表键的一部分，你可以使用同一张表来存放多个 Laravel 应用的失败任务。

此外，确保你已安装 AWS SDK，让你的 Laravel 应用能够与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

接下来，把 `queue.failed.driver` 配置项的值设为 `dynamodb`。此外，你还应当在失败任务配置数组中定义 `key`、`secret` 和 `region` 配置项。这些配置项将用于向 AWS 认证。当使用 `dynamodb` 驱动时，`queue.failed.database` 配置项是不必要的：

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

你可以把 `queue.failed.driver` 配置项的值设为 `null`，指示 Laravel 丢弃失败任务而不存储它们。通常，这可以通过 `QUEUE_FAILED_DRIVER` 环境变量实现：

```ini
QUEUE_FAILED_DRIVER=null
```

<a name="failed-job-events"></a>
### 失败任务事件

如果你希望注册一个在任务失败时被调用的事件监听器，可以使用 `Queue` Facade 的 `failing` 方法。例如，我们可以从 Laravel 附带的 `AppServiceProvider` 的 `boot` 方法中，为该事件附加一个闭包：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\Queue;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\Queue\Events\JobFailed;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
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

<a name="clearing-jobs-from-queues"></a>
## 清空队列中的任务

> [!NOTE]
> 使用 [Horizon](/docs/{{version}}/horizon) 时，你应当使用 `horizon:clear` 命令而不是 `queue:clear` 命令来清空队列中的任务。

如果你希望删除默认连接上默认队列中的全部任务，可以使用 `queue:clear` Artisan 命令：

```shell
php artisan queue:clear
```

你也可以提供 `connection` 参数和 `queue` 选项，以删除特定连接和队列中的任务：

```shell
php artisan queue:clear redis --queue=emails
```

> [!WARNING]
> 清空队列中的任务只对 SQS、Redis 和 database 队列驱动可用。此外，SQS 的消息删除过程最多需要 60 秒，因此在你清空队列后 60 秒内发送到 SQS 队列的任务也可能被删除。

<a name="monitoring-your-queues"></a>
## 监控你的队列

如果你的队列突然涌入大量任务，它可能不堪重负，导致任务完成前等待很长时间。如果你愿意，Laravel 可以在队列任务数量超过指定阈值时向你发出警报。

要开始使用，你应当调度 `queue:monitor` 命令[每分钟运行一次](/docs/{{version}}/scheduling)。该命令接受你希望监控的队列名称以及期望的任务数量阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅仅调度该命令并不足以触发通知。当该命令遇到任务数量超出你阈值的队列时，会分发一个 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在应用的 `AppServiceProvider` 中监听该事件，从而向你或你的开发团队发送通知：

```php
use App\Notifications\QueueHasLongWaitTime;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 引导任何应用服务。
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

测试分发任务的代码时，你可能希望指示 Laravel 不要真正执行任务本身，因为任务的代码可以直接、单独地测试。当然，要测试任务本身，你可以在测试中实例化一个任务实例并直接调用 `handle` 方法。

你可以使用 `Queue` Facade 的 `fake` 方法，防止排队任务被真正推入队列。调用 `Queue` Facade 的 `fake` 方法之后，你就可以断言应用曾尝试把任务推入队列：

```php tab=Pest
<?php

use App\Jobs\AnotherJob;
use App\Jobs\FinalJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;

test('orders can be shipped', function () {
    Queue::fake();

    // 执行订单发货……

    // 断言没有任务被推入……
    Queue::assertNothingPushed();

    // 断言某个任务被推入了指定队列……
    Queue::assertPushedOn('queue-name', ShipOrder::class);

    // 断言某个任务被推入了两次……
    Queue::assertPushed(ShipOrder::class, 2);

    // 断言某个任务未被推入……
    Queue::assertNotPushed(AnotherJob::class);

    // 断言某个闭包被推入了队列……
    Queue::assertClosurePushed();

    // 断言被推入的任务总数……
    Queue::assertCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Jobs\AnotherJob;
use App\Jobs\FinalJob;
use App\Jobs\ShipOrder;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Queue::fake();

        // 执行订单发货……

        // 断言没有任务被推入……
        Queue::assertNothingPushed();

        // 断言某个任务被推入了指定队列……
        Queue::assertPushedOn('queue-name', ShipOrder::class);

        // 断言某个任务被推入了两次……
        Queue::assertPushed(ShipOrder::class, 2);

        // 断言某个任务未被推入……
        Queue::assertNotPushed(AnotherJob::class);

        // 断言某个闭包被推入了队列……
        Queue::assertClosurePushed();

        // 断言被推入的任务总数……
        Queue::assertCount(3);
    }
}
```

你可以向 `assertPushed` 或 `assertNotPushed` 方法传入一个闭包，以断言某个通过给定"真值测试"的任务被推入了队列。如果至少有一个通过该真值测试的任务被推入，断言就会成功：

    Queue::assertPushed(function (ShipOrder $job) use ($order) {
        return $job->order->id === $order->id;
    });

<a name="faking-a-subset-of-jobs"></a>
### 伪造任务的一个子集

如果你只需要伪造特定任务，同时让其它任务正常执行，可以把要伪造任务的类名传给 `fake` 方法：

```php tab=Pest
test('orders can be shipped', function () {
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货……

    // 断言某个任务被推入了两次……
    Queue::assertPushed(ShipOrder::class, 2);
});
```

```php tab=PHPUnit
public function test_orders_can_be_shipped(): void
{
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货……

    // 断言某个任务被推入了两次……
    Queue::assertPushed(ShipOrder::class, 2);
}
```

你也可以使用 `except` 方法伪造除指定任务之外的全部任务：

    Queue::fake()->except([
        ShipOrder::class,
    ]);

<a name="testing-job-chains"></a>
### 测试任务链

要测试任务链，你需要使用 `Bus` Facade 的伪造能力。`Bus` Facade 的 `assertChained` 方法可用于断言某个[任务链](/docs/{{version}}/queues#job-chaining)已被分发。`assertChained` 方法接受一个链式任务数组作为其第一个参数：

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

如上面的例子所示，链式任务数组可以是任务类名的数组。不过，你也可以提供实际任务实例的数组。这样做时，Laravel 会确保这些任务实例与应用分发的链式任务属于相同的类，并且属性值也相同：

    Bus::assertChained([
        new ShipOrder,
        new RecordShipment,
        new UpdateInventory,
    ]);

你可以使用 `assertDispatchedWithoutChain` 方法断言某个任务在没有任务链的情况下被推入：

    Bus::assertDispatchedWithoutChain(ShipOrder::class);

<a name="testing-chain-modifications"></a>
#### 测试链的修改

如果某个链式任务[在已有链的前后追加任务](#adding-jobs-to-the-chain)，你可以使用该任务的 `assertHasChain` 方法断言它拥有预期的剩余任务链：

```php
$job = new ProcessPodcast;

$job->handle();

$job->assertHasChain([
    new TranscribePodcast,
    new OptimizePodcast,
    new ReleasePodcast,
]);
```

可以使用 `assertDoesntHaveChain` 方法断言该任务的剩余任务链为空：

```php
$job->assertDoesntHaveChain();
```

<a name="testing-chained-batches"></a>
#### 测试链式批次

如果你的任务链[包含一个任务批次](#chains-and-batches)，可以在链断言中插入 `Bus::chainedBatch` 定义，以断言该链式批次符合你的预期：

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

<a name="testing-job-batches"></a>
### 测试任务批次

`Bus` Facade 的 `assertBatched` 方法可用于断言某个[任务批次](/docs/{{version}}/queues#job-batching)已被分发。传给 `assertBatched` 方法的闭包会收到一个 `Illuminate\Bus\PendingBatch` 实例，可用于检查批次中的任务：

    use Illuminate\Bus\PendingBatch;
    use Illuminate\Support\Facades\Bus;

    Bus::fake();

    // ...

    Bus::assertBatched(function (PendingBatch $batch) {
        return $batch->name == 'import-csv' &&
               $batch->jobs->count() === 10;
    });

你可以使用 `assertBatchCount` 方法断言已分发的批次数量：

    Bus::assertBatchCount(3);

你可以使用 `assertNothingBatched` 断言没有批次被分发：

    Bus::assertNothingBatched();

<a name="testing-job-batch-interaction"></a>
#### 测试任务与批次的交互

此外，你有时还需要测试单个任务与其所属批次之间的交互。例如，你可能需要测试某个任务是否取消了其批次的进一步处理。为此，你需要通过 `withFakeBatch` 方法为该任务分配一个伪造批次。`withFakeBatch` 方法返回一个包含任务实例和伪造批次的元组：

    [$job, $batch] = (new ShipOrder)->withFakeBatch();

    $job->handle();

    $this->assertTrue($batch->cancelled());
    $this->assertEmpty($batch->added);

<a name="testing-job-queue-interactions"></a>
### 测试任务与队列的交互

有时你可能需要测试某个排队任务[把自己重新放回队列](#manually-releasing-a-job)，或者测试某个任务删除了自身。你可以通过实例化该任务并调用 `withFakeQueueInteractions` 方法来测试这些队列交互。

任务的队列交互被伪造之后，你可以在该任务上调用 `handle` 方法。调用之后，可以使用 `assertReleased`、`assertDeleted`、`assertNotDeleted`、`assertFailed`、`assertFailedWith` 和 `assertNotFailed` 方法对该任务的队列交互进行断言：

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

通过 `Queue` [Facade](/docs/{{version}}/facades)上的 `before` 和 `after` 方法，你可以指定在排队任务被处理之前或之后执行的回调。这些回调非常适合执行额外的日志记录，或为仪表盘累加统计指标。通常，你应当在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用这些方法。例如，我们可以使用 Laravel 附带的 `AppServiceProvider`：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\Queue;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\Queue\Events\JobProcessed;
    use Illuminate\Queue\Events\JobProcessing;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
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

通过 `Queue` [Facade](/docs/{{version}}/facades)上的 `looping` 方法，你可以指定在工作进程尝试从队列中获取任务之前执行的回调。例如，你可以注册一个闭包，回滚此前失败任务留下的未关闭事务：

    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Queue;

    Queue::looping(function () {
        while (DB::transactionLevel() > 0) {
            DB::rollBack();
        }
    });
