# 队列

## 介绍

在构建 Web 应用程序时，你可能会遇到一些任务（例如解析和存储上传的 CSV 文件），这些任务在典型的 Web 请求期间执行会耗时过长。幸运的是，Laravel 允许你轻松创建可以在后台处理的队列任务。通过将耗时的任务移到队列中，你的应用程序可以以极快的速度响应 Web 请求，并为你的客户提供更好的用户体验。

Laravel 队列在各种不同的队列后端（例如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io)，甚至关系型数据库）之间提供了统一的队列 API。

Laravel 的队列配置选项存储在你的应用程序的 `config/queue.php` 配置文件中。在此文件中，你将找到框架包含的每个队列驱动的连接配置，包括 database、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及一个会立即执行任务的 `sync` 驱动（供开发或测试期间使用）。还包含一个 `null` 队列驱动，它会丢弃队列任务。

> [!NOTE]
> Laravel Horizon 是一个美观的仪表盘和配置系统，用于你的 Redis 驱动的队列。请查看完整的 [Horizon 文档](/topic/Laravel%2013.x/rwyl28xvz8.html) 以获取更多信息。

### 连接 vs. 队列

在开始使用 Laravel 队列之前，理解"连接"和"队列"之间的区别很重要。在你的 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。此选项定义了到后端队列服务（例如 Amazon SQS、Beanstalk 或 Redis）的连接。然而，任何给定的队列连接都可以有多个"队列"，这些"队列"可以被视为不同的堆栈或成堆的队列任务。

请注意，`queue` 配置文件中的每个连接配置示例都包含一个 `queue` 属性。这是任务被发送到给定连接时将分派到的默认队列。换句话说，如果你分发一个任务而没有明确定义它应该被分发到哪个队列，该任务将被放置在连接配置的 `queue` 属性中定义的队列上：

```php
use App\Jobs\ProcessPodcast;

// 此任务被发送到默认连接的默认队列...
ProcessPodcast::dispatch();

// 此任务被发送到默认连接的 "emails" 队列...
ProcessPodcast::dispatch()->onQueue('emails');
```

某些应用程序可能永远不需要将任务推送到多个队列，而是更喜欢使用一个简单的队列。但是，将任务推送到多个队列对于希望优先处理或分段处理任务的应用程序尤其有用，因为 Laravel 队列工作进程允许你指定它应该按优先级处理哪些队列。例如，如果你将任务推送到 `high` 队列，你可以运行一个赋予它们更高处理优先级的工作进程：

```shell
php artisan queue:work --queue=high,default
```

### 驱动的注意事项和先决条件

#### Database

为了使用 `database` 队列驱动，你需要一个数据库表来保存任务。通常，这包含在 Laravel 默认的 `0001_01_01_000002_create_jobs_table.php` [数据库迁移](/topic/Laravel%2013.x/x3vo0g4vm1.html) 中；但是，如果你的应用程序不包含此迁移，你可以使用 `make:queue-table` Artisan 命令来创建它：

```shell
php artisan make:queue-table

php artisan migrate
```

#### Redis

为了使用 `redis` 队列驱动，你应该在你的 `config/database.php` 配置文件中配置一个 Redis 数据库连接。

> [!WARNING]
> `redis` 队列驱动不支持 `serializer` 和 `compression` Redis 选项。

##### Redis 集群

如果你的 Redis 队列连接使用 [Redis Cluster](https://redis.io/docs/latest/operate/rs/databases/durability-ha/clustering)，你的队列名称必须包含一个 [键哈希标签](https://redis.io/docs/latest/develop/using-commands/keyspace/#hashtags)。这是为了确保给定队列的所有 Redis 键都被放入同一个哈希槽中：

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

##### 阻塞

使用 Redis 队列时，你可以使用 `block_for` 配置选项来指定驱动程序在遍历工作进程循环并重新轮询 Redis 数据库之前，应等待任务可用的时间。

根据你的队列负载调整此值可能比持续轮询 Redis 数据库以获取新任务更高效。例如，你可以将该值设置为 `5`，以指示驱动程序在等待任务可用时阻塞五秒钟：

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
> 将 `block_for` 设置为 `0` 将导致队列工作进程无限期地阻塞，直到任务可用。这也会阻止诸如 `SIGTERM` 之类的信号在下一个任务被处理之前得到处理。

#### SQS 溢出存储

Amazon SQS 限制了队列消息负载的最大大小。如果你需要分发负载可能超过此限制的任务，你可以配置 Laravel 将超大的 SQS 负载存储在缓存存储中，并通过 SQS 发送一个指针。要启用此功能，请向你的 SQS 队列连接配置添加一个 `overflow` 数组：

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

启用溢出存储后，Laravel 将把至少 1 MB 的负载存储在配置的缓存存储中。如果 `always` 选项为 `true`，则每个 SQS 负载都将存储在缓存存储中，无论其大小如何。由于队列任务在处理时需要从缓存存储中检索其负载，因此你应该选择一个能够将负载保留到工作进程处理完它们的存储。默认情况下，存储的负载会在其任务成功处理并从 SQS 删除后被删除。

如果 `flush_on_clear` 选项为 `true`，则在 `queue:clear` 命令清除 SQS 队列时，将清空配置的溢出缓存存储。由于清空缓存存储可能会从该存储中删除所有项目，因此启用此选项时，你应该将 SQS 溢出存储配置为使用一个专用的缓存存储。

#### 其他驱动的先决条件

以下列出的队列驱动需要以下依赖项。这些依赖项可以通过 Composer 包管理器安装：

<div class="content-list" markdown="1">

- Amazon SQS：`aws/aws-sdk-php ~3.0`
- Beanstalkd：`pda/pheanstalk ~5.0`
- Redis：`predis/predis ~3.0` 或 phpredis PHP 扩展
- [MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)：`mongodb/laravel-mongodb`

</div>

## 创建任务

### 生成任务类

默认情况下，你的应用程序的所有可队列化任务都存储在 `app/Jobs` 目录中。如果 `app/Jobs` 目录不存在，它将在你运行 `make:job` Artisan 命令时创建：

```shell
php artisan make:job ProcessPodcast
```

生成的类将实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，向 Laravel 表明该任务应该被推送到队列上以异步运行。

> [!NOTE]
> 任务桩可以通过 [桩发布](/topic/Laravel%2013.x/3dykqdoyl0.html) 进行自定义。

### 类结构

任务类非常简单，通常只包含一个 `handle` 方法，该方法在队列处理任务时被调用。要开始使用，让我们看一个示例任务类。在此示例中，我们将假设我们管理一个播客发布服务，并且需要在播客文件发布之前处理上传的播客文件：

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
        // Process uploaded podcast...
    }
}
```

在此示例中，请注意我们能够将一个 [Eloquent 模型](/topic/Laravel%2013.x/rwyl2kxvz8.html) 直接传递给队列任务的构造函数。由于任务使用了 `Queueable` trait，Eloquent 模型及其加载的关系将在任务处理时被优雅地序列化和反序列化。

如果你的队列任务在其构造函数中接受一个 Eloquent 模型，则只有模型的标识符会被序列化到队列上。当任务实际被处理时，队列系统将自动从数据库中重新检索完整的模型实例及其加载的关系。这种模型序列化方法允许将更小的任务负载发送到你的队列驱动。

#### `handle` 方法依赖注入

`handle` 方法在队列处理任务时被调用。请注意，我们能够在任务的 `handle` 方法上类型提示依赖项。Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 会自动注入这些依赖项。

如果你想完全控制容器如何将依赖项注入到 `handle` 方法中，你可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接受一个回调，该回调接收任务和容器。在回调中，你可以自由地以任何你喜欢的方式调用 `handle` 方法。通常，你应该从你的 `App\Providers\AppServiceProvider` [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用此方法：

```php
use App\Jobs\ProcessPodcast;
use App\Services\AudioProcessor;
use Illuminate\Contracts\Foundation\Application;

$this->app->bindMethod([ProcessPodcast::class, 'handle'], function (ProcessPodcast $job, Application $app) {
    return $job->handle($app->make(AudioProcessor::class));
});
```

> [!WARNING]
> 二进制数据（例如原始图像内容）在传递给队列任务之前应通过 `base64_encode` 函数传递。否则，任务在被放置到队列上时可能无法正确序列化为 JSON。

#### 队列化关系

由于所有加载的 Eloquent 模型关系在任务被队列化时也会被序列化，因此序列化的任务字符串有时会变得非常大。此外，当任务被反序列化并从数据库中重新检索模型关系时，它们将被完整地检索。在任务队列化过程中模型被序列化之前应用的任何先前关系约束，在任务反序列化时都不会被应用。因此，如果你希望使用给定关系的子集，你应该在你的队列任务中重新约束该关系。

或者，为了防止关系被序列化，你可以在设置属性值时在模型上调用 `withoutRelations` 方法。此方法将返回一个不带其加载关系的模型实例：

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

如果你只需要移除特定关系而保留其余关系，你可以使用 `withoutRelation` 方法：

```php
$this->podcast = $podcast->withoutRelation('comments');
```

如果你使用 [PHP 构造函数属性提升](https://www.php.net/manual/en/language.oop5.decon.php#language.oop5.decon.constructor.promotion)，并且想指示一个 Eloquent 模型不应序列化其关系，你可以使用 `WithoutRelations` 属性：

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

为方便起见，如果你希望序列化所有不带关系的模型，你可以将 `WithoutRelations` 属性应用于整个类，而不是将该属性应用于每个模型：

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

如果任务接收的是 Eloquent 模型的集合或数组，而不是单个模型，则该集合中的模型在任务反序列化并执行时不会恢复其关系。这是为了防止处理大量模型的任务占用过多资源。

### 唯一任务

> [!WARNING]
> 唯一任务需要支持 [锁](/topic/Laravel%2013.x/5dve2w3v4x.html) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

> [!WARNING]
> 唯一任务约束不适用于批次内的任务。

有时，你可能希望确保在任何时间点队列上只有一个特定任务的实例。你可以通过在你的任务类上实现 `ShouldBeUnique` 接口来做到这一点。此接口不要求你在类上定义任何其他方法：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ...
}
```

在上面的示例中，`UpdateSearchIndex` 任务是唯一的。因此，如果该任务的另一个实例已经在队列上并且尚未完成处理，则该任务将不会被分发。

在某些情况下，你可能希望定义一个特定的"键"来使任务唯一，或者你可能希望指定一个超时时间，超过该时间后任务不再保持唯一。要实现这一点，你可以使用 `UniqueFor` 属性并在你的任务类上定义一个 `uniqueId` 方法：

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
在上面的示例中，`UpdateSearchIndex` 任务按产品 ID 唯一。因此，具有相同产品 ID 的任务的任何新分发都将被忽略，直到现有任务完成处理。此外，如果现有任务在一小时内未被处理，唯一锁将被释放，另一个具有相同唯一键的任务可以被分发到队列。

> [!WARNING]
> 如果你的应用程序从多个 Web 服务器或容器分发任务，你应该确保所有服务器都与同一个中央缓存服务器通信，以便 Laravel 能够准确地确定任务是否唯一。

#### 保持任务唯一直到处理开始

默认情况下，唯一任务在任务完成处理或所有重试尝试失败后会被"解锁"。但是，在某些情况下，你可能希望你的任务在它被处理之前立即解锁。要实现这一点，你的任务应该实现 `ShouldBeUniqueUntilProcessing` 契约，而不是 `ShouldBeUnique` 契约：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

#### 唯一任务锁

在幕后，当一个 `ShouldBeUnique` 任务被分发时，Laravel 会尝试使用 `uniqueId` 键获取一个 [锁](/topic/Laravel%2013.x/5dve2w3v4x.html)。如果锁已被持有，该任务将不会被分发。当任务完成处理或所有重试尝试失败时，此锁会被释放。默认情况下，Laravel 将使用默认缓存驱动来获取此锁。但是，如果你希望使用另一个驱动来获取锁，你可以定义一个返回应使用的缓存驱动的 `uniqueVia` 方法：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    // ...

    /**
     * 获取唯一任务锁的缓存驱动。
     */
    public function uniqueVia(): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只需要限制任务的并发处理，请改用 [WithoutOverlapping](/topic/Laravel%2013.x/wevwmkz9l2.html) 任务中间件。

### 防抖任务

有时，你可能希望确保当同一任务在短时间内被多次分发时，只有最新的分发实际执行。你可以通过向你的任务添加 `DebounceFor` 属性来做到这一点：

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

在上面的示例中，在 `30` 秒内为同一产品重复分发 `UpdateSearchIndex` 将对任务进行防抖处理，以便只有最新的分发运行。

如果你想限制频繁重新分发的任务可以被延迟的最长时间，你可以向 `DebounceFor` 属性提供 `maxWait` 参数：

```php
#[DebounceFor(30, maxWait: 120)]
class UpdateSearchIndex implements ShouldQueue
{
    use Queueable;

    // ...
}
```

你可以通过在你的任务上定义一个 `debounceVia` 方法来自定义用于防抖跟踪的缓存存储：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

public function debounceVia(): Repository
{
    return Cache::driver('redis');
}
```

如果一个防抖任务被更新的分发取代，Laravel 将分发 `Illuminate\Queue\Events\JobDebounced` 事件并从队列中删除被取代的任务。

> [!WARNING]
> 防抖任务和唯一任务是互斥的。使用 `DebounceFor` 属性的任务不应实现 `ShouldBeUnique`。

> [!WARNING]
> 如果你的应用程序从多个 Web 服务器或容器分发防抖任务，你应该确保所有服务器都与同一个中央缓存服务器通信。

### 加密任务

Laravel 允许你通过 [加密](/topic/Laravel%2013.x/enyd5k197d.html) 确保任务数据的隐私性和完整性。要开始使用，只需将 `ShouldBeEncrypted` 接口添加到任务类。一旦此接口被添加到类中，Laravel 将在把任务推送到队列之前自动加密你的任务：

```php
<?php

use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateSearchIndex implements ShouldQueue, ShouldBeEncrypted
{
    // ...
}
```

## 任务中间件

任务中间件允许你围绕队列任务的执行包装自定义逻辑，减少任务本身的样板代码。例如，考虑以下利用 Laravel 的 Redis 限流功能来每五秒只允许一个任务处理的 `handle` 方法：

```php
use Illuminate\Support\Facades\Redis;

/**
 * 执行任务。
 */
public function handle(): void
{
    Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
        info('Lock obtained...');

        // Handle job...
    }, function () {
        // Could not obtain lock...

        return $this->release(5);
    });
}
```

虽然这段代码是有效的，但由于混杂了 Redis 限流逻辑，`handle` 方法的实现变得嘈杂。此外，对于任何其他我们想要限流的任务，这段限流逻辑都必须被复制。我们可以在 `handle` 方法中限流，而不是定义一个处理限流的任务中间件：

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
                // Lock obtained...

                $next($job);
            }, function () use ($job) {
                // Could not obtain lock...

                $job->release(5);
            });
    }
}
```

如你所见，与 [路由中间件](/topic/Laravel%2013.x/rwyl2exvz8.html) 一样，任务中间件接收正在处理的任务以及一个应被调用以继续处理任务的回调。

你可以使用 `make:job-middleware` Artisan 命令生成一个新的任务中间件类。创建任务中间件后，可以通过从任务的 `middleware` 方法返回它们来将它们附加到任务上。此方法不存在于由 `make:job` Artisan 命令脚手架生成的任务上，因此你需要手动将其添加到你的任务类中：

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
> 任务中间件也可以分配给 [队列化事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)、[mailables](/topic/Laravel%2013.x/d6vro0rv3g.html) 和 [通知](/topic/Laravel%2013.x/2ky045l9z8.html)。

### 限流

尽管我们刚刚演示了如何编写你自己的限流任务中间件，但 Laravel 实际上包含一个你可以用来对任务进行限流的限流中间件。与 [路由限流器](/topic/Laravel%2013.x/dgy7xg5vw2.html) 一样，任务限流器使用 `RateLimiter` 门面的 `for` 方法来定义。

例如，你可能希望允许用户每小时备份一次数据，而不对高级客户施加此类限制。要实现这一点，你可以在你的 `AppServiceProvider` 的 `boot` 方法中定义一个 `RateLimiter`：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任何应用程序服务。
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

在上面的示例中，我们定义了一个每小时限流；但是，你可以使用 `perMinute` 方法轻松地定义基于分钟的限流。此外，你可以向限流的 `by` 方法传递任何你希望的值；但是，此值最常用于按客户对限流进行分段：

```php
return Limit::perMinute(50)->by($job->user->id);
```

定义好你的限流之后，你可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件将限流器附加到你的任务上。每次任务超过限流时，此中间件都会根据限流持续时间以适当的延迟将任务释放回队列：

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

将限流的任务释放回队列仍会增加任务的总 `attempts` 次数。你可能希望相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。或者，你可能希望使用 retryUntil 方法 来定义任务不应再被尝试之前的时间。

使用 `releaseAfter` 方法，你还可以指定在释放的任务再次被尝试之前必须经过的秒数：

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

如果你不希望任务在受限时被重试，你可以使用 `dontRelease` 方法：

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

#### 使用 Redis 限流

如果你使用 Redis，你可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它是为 Redis 微调过的，并且比基本的限流中间件更高效：

```php
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

public function middleware(): array
{
    return [new RateLimitedWithRedis('backups')];
}
```

`connection` 方法可用于指定中间件应使用的 Redis 连接：

```php
return [(new RateLimitedWithRedis('backups'))->connection('limiter')];
```

### 防止任务重叠

Laravel 包含一个 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，它允许你基于任意键来防止任务重叠。当队列任务正在修改一个一次只应被一个任务修改的资源时，这可能会很有帮助。

例如，让我们假设你有一个更新用户信用评分的队列任务，并且你想防止同一用户 ID 的信用评分更新任务重叠。要实现这一点，你可以从你的任务的 `middleware` 方法返回 `WithoutOverlapping` 中间件：

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

将重叠的任务释放回队列仍会增加任务的总尝试次数。你可能希望相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。例如，将 `Tries` 保留为其默认值 1 将阻止任何重叠任务在稍后被重试。

任何相同类型的重叠任务都将被释放回队列。你还可以指定在释放的任务再次被尝试之前必须经过的秒数：

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

如果你希望立即删除任何重叠的任务，以便它们不会被重试，你可以使用 `dontRelease` 方法：

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

`WithoutOverlapping` 中间件由 Laravel 的原子锁功能提供支持。有时，你的任务可能会意外失败或超时，导致锁未被释放。因此，你可以使用 `expireAfter` 方法显式定义锁的过期时间。例如，下面的示例将指示 Laravel 在任务开始处理三分钟后释放 `WithoutOverlapping` 锁：

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
> `WithoutOverlapping` 中间件需要支持 [锁](/topic/Laravel%2013.x/5dve2w3v4x.html) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

#### 跨任务类共享锁键

默认情况下，`WithoutOverlapping` 中间件只会防止相同类的任务重叠。因此，尽管两个不同的任务类可能使用相同的锁键，但它们不会被阻止重叠。但是，你可以使用 `shared` 方法指示 Laravel 跨任务类应用该键：

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

### 异常节流

Laravel 包含一个 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，允许你对异常进行节流。一旦任务抛出给定数量的异常，所有进一步执行任务的尝试都将被延迟，直到指定的时间间隔过去。此中间件对于与不稳定的第三方服务交互的任务特别有用。

例如，让我们假设一个队列任务与一个开始抛出异常的第三方 API 交互。要对异常进行节流，你可以从你的任务的 `middleware` 方法返回 `ThrottlesExceptions` 中间件。通常，此中间件应与实现 基于时间的尝试 的任务配对：

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
 * 确定任务应超时的时间。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 30);
}
```

中间件接受的第一个构造函数参数是任务在被节流之前可以抛出的异常数量，而第二个构造函数参数是任务被节流后再次尝试之前应经过的秒数。在上面的代码示例中，如果任务抛出 10 个连续异常，我们将等待 5 分钟再尝试该任务，受 30 分钟时间限制的约束。

当任务抛出异常但异常阈值尚未达到时，任务通常会立即重试。但是，你可以通过在将中间件附加到任务时调用 `backoff` 方法来指定此类任务应延迟的分钟数：

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

`backoff` 方法还接受一个接收所抛出异常的闭包，从而允许动态确定延迟：

```php
use App\Exceptions\RateLimitedException;
use Illuminate\Queue\Middleware\ThrottlesExceptions;
use Throwable;

/**
 * 获取任务应通过的中间件。
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

在内部，此中间件使用 Laravel 的缓存系统来实现限流，并且任务的类名被用作缓存"键"。你可以通过将中间件附加到你的任务时调用 `by` 方法来覆盖此键。如果你有多个任务与同一个第三方服务交互，并且你希望它们共享一个公共的节流"桶"，确保它们遵守一个共享的限制，这可能会很有用：

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

默认情况下，此中间件将对每个异常进行节流。你可以通过在将中间件附加到你的任务时调用 `when` 方法来修改此行为。然后，只有在提供给 `when` 方法的闭包返回 `true` 时，异常才会被节流：

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

与 `when` 方法（它会将任务释放回队列或抛出异常）不同，`deleteWhen` 方法允许你在给定异常发生时完全删除任务：

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

如果你希望将被节流的异常报告给你的应用程序的异常处理器，你可以通过在将中间件附加到你的任务时调用 `report` 方法来实现。可选地，你可以向 `report` 方法提供一个闭包，并且只有在给定闭包返回 `true` 时，异常才会被报告：

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

#### 使用 Redis 进行异常节流

如果你使用 Redis，你可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它是为 Redis 微调过的，并且比基本的异常节流中间件更高效：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis;

public function middleware(): array
{
    return [new ThrottlesExceptionsWithRedis(10, 10 * 60)];
}
```

`connection` 方法可用于指定中间件应使用的 Redis 连接：

```php
return [(new ThrottlesExceptionsWithRedis(10, 10 * 60))->connection('limiter')];
```

### 释放任务

`Release` 中间件允许你将任务释放回队列而不执行它。`Release::when` 方法将在给定条件求值为 `true` 时释放任务，而 `Release::unless` 方法将在条件求值为 `false` 时释放任务：

```php
use Illuminate\Queue\Middleware\Release;

/**
 * 获取任务应通过的中间件。
 */
public function middleware(): array
{
    return [
        Release::when($condition, releaseAfter: 60),
    ];
}
```

将任务释放回队列仍会增加任务的总尝试次数。你可能希望相应地调整任务类上的 `Tries` 和 `MaxExceptions` 属性。

你还可以将 `Closure` 传递给 `when` 和 `unless` 方法，以进行更复杂的条件求值：

```php
use Illuminate\Queue\Middleware\Release;

/**
 * 获取任务应通过的中间件。
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

### 跳过任务

`Skip` 中间件允许你指定应跳过 / 删除任务，而无需修改任务的逻辑。`Skip::when` 方法将在给定条件求值为 `true` 时删除任务，而 `Skip::unless` 方法将在条件求值为 `false` 时删除任务：

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

你还可以将 `Closure` 传递给 `when` 和 `unless` 方法，以进行更复杂的条件求值：

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

## 分发任务

编写好你的任务类后，你可以使用任务本身的 `dispatch` 方法来分发它。传递给 `dispatch` 方法的参数将被提供给任务的构造函数：

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
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast);

        return redirect('/podcasts');
    }
}
```

如果你想有条件地分发任务，你可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
ProcessPodcast::dispatchIf($accountActive, $podcast);

ProcessPodcast::dispatchUnless($accountSuspended, $podcast);
```

在新的 Laravel 应用程序中，`database` 连接被定义为默认队列。你可以通过更改你的应用程序的 `.env` 文件中的 `QUEUE_CONNECTION` 环境变量来指定不同的默认队列连接。

### 延迟分发

如果你想指定任务不应立即可供队列工作进程处理，你可以在分发任务时使用 `delay` 方法。例如，让我们指定一个任务在分发后 10 分钟内不可供处理：

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
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast)
            ->delay(now()->plus(minutes: 10));

        return redirect('/podcasts');
    }
}
```

在某些情况下，任务可能配置了默认延迟。如果你需要绕过此延迟并分发任务以立即处理，你可以使用 `withoutDelay` 方法：

```php
ProcessPodcast::dispatch($podcast)->withoutDelay();
```

> [!WARNING]
> Amazon SQS 队列服务的最大延迟时间为 15 分钟。

### 同步分发

如果你想立即（同步地）分发任务，你可以使用 `dispatchSync` 方法。使用此方法时，任务将不会被队列化，而会在当前进程内立即执行：

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
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatchSync($podcast);

        return redirect('/podcasts');
    }
}
```

#### 延迟分发

使用延迟同步分发，你可以分发一个任务在当前进程期间处理，但在 HTTP 响应已发送给用户之后处理。这允许你同步地处理"队列"任务，而不会减慢你的用户的应用程序体验。要延迟执行同步任务，请将任务分发到 `deferred` 连接：

```php
RecordDelivery::dispatch($order)->onConnection('deferred');
```

`deferred` 连接还充当默认的 故障转移队列。

类似地，`background` 连接在 HTTP 响应已发送给用户之后处理任务；但是，任务是在单独生成的 PHP 进程中处理的，从而允许 PHP-FPM / 应用程序工作进程可用于处理另一个传入的 HTTP 请求：

```php
RecordDelivery::dispatch($order)->onConnection('background');
```

### 批量分发

如果你需要一次分发许多独立的任务，并且不需要 批次 跟踪或回调，你可以使用 `Bus` 门面的 `bulk` 方法。Laravel 将按它们配置的队列连接和队列名称对任务进行分组，并将每个组批量推送到适当的队列：

```php
use App\Jobs\ProcessUser;
use Illuminate\Support\Facades\Bus;

Bus::bulk(
    $users->map(fn ($user) => new ProcessUser($user))
);
```

### 分发前准备任务

如果任务在被推送到队列之前需要准备或检查其状态，该任务可以实现 `Illuminate\Contracts\Queue\PreparesForDispatch` 接口。Laravel 将在分发任务之前调用任务的 `prepareForDispatch` 方法。如果此方法返回 `false`，该任务将不会被分发：

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
     * 在分发之前准备任务。
     */
    public function prepareForDispatch(): bool
    {
        return collect($this->podcastIds)
            ->reject(fn (int $id) => Cache::has("podcast-syncing:{$id}"))
            ->isNotEmpty();
    }
}
```

### 任务与数据库事务

虽然在数据库事务中分发任务完全没问题，但你应该特别小心，确保你的任务实际上能够成功执行。在事务中分发任务时，任务有可能在父事务提交之前就被工作进程处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。

值得庆幸的是，Laravel 提供了几种解决此问题的方法。首先，你可以在你的队列连接的配置数组中设置 `after_commit` 连接选项：

```php
'redis' => [
    'driver' => 'redis',
    // ...
    'after_commit' => true,
],
```

当 `after_commit` 选项为 `true` 时，你可以在数据库事务中分发任务；但是，Laravel 将在实际分发任务之前等待打开的父数据库事务提交。当然，如果当前没有打开的数据库事务，任务将立即被分发。

如果事务由于事务期间发生的异常而回滚，则在该事务期间分发的任务将被丢弃。

> [!NOTE]
> 将 `after_commit` 配置选项设置为 `true` 也会导致任何队列化的事件监听器、mailables、通知和广播事件在所有打开的数据库事务提交后被分发。

#### 内联指定提交分发行为

如果你没有将 `after_commit` 队列连接配置选项设置为 `true`，你仍然可以指示特定任务应在所有打开的数据库事务提交后被分发。要实现这一点，你可以将 `afterCommit` 方法链接到你的分发操作上：

```php
use App\Jobs\ProcessPodcast;

ProcessPodcast::dispatch($podcast)->afterCommit();
```

同样，如果 `after_commit` 配置选项被设置为 `true`，你可以指示特定任务应立即分发，而不等待任何打开的数据库事务提交：

```php
ProcessPodcast::dispatch($podcast)->beforeCommit();
```

### 任务链

任务链允许你指定一个队列任务列表，这些任务应在主要任务成功执行后按顺序运行。如果序列中的一个任务失败，其余的任务将不会运行。要执行队列任务链，你可以使用 `Bus` 门面提供的 `chain` 方法。Laravel 的命令总线是一个更低层的组件，队列任务分发建立在其之上：

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
> 在任务内使用 `$this->delete()` 方法删除任务不会阻止链式任务被处理。只有当链中的任务失败时，链才会停止执行。

#### 链连接和队列

如果你想指定链式任务应使用的连接和队列，你可以使用 `onConnection` 和 `onQueue` 方法。这些方法指定应使用的队列连接和队列名称，除非队列任务被显式分配了不同的连接 / 队列：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->onConnection('redis')->onQueue('podcasts')->dispatch();
```

#### 向链添加任务

偶尔，你可能需要从该链中的另一个任务中向现有任务链前置或追加一个任务。你可以使用 `prependToChain` 和 `appendToChain` 方法来实现：

```php
/**
 * 执行任务。
 */
public function handle(): void
{
    // ...

    // 前置到当前链，在当前任务之后立即运行任务...
    $this->prependToChain(new TranscribePodcast);

    // 追加到当前链，在链的末尾运行任务...
    $this->appendToChain(new TranscribePodcast);
}
```

#### 链失败

链接任务时，你可以使用 `catch` 方法指定一个闭包，如果链中的任务失败，应调用该闭包。给定的回调将接收导致任务失败的 `Throwable` 实例：

```php
use Illuminate\Support\Facades\Bus;
use Throwable;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->catch(function (Throwable $e) {
    // 链中的任务失败了...
})->dispatch();
```

> [!WARNING]
> 由于链回调被序列化并由 Laravel 队列在稍后时间执行，因此你不应在链回调中使用 `$this` 变量。

### 自定义队列和连接

#### 分发到特定队列

通过将任务推送到不同的队列，你可以"分类"你的队列任务，甚至优先考虑你分配给各个队列的工作进程数量。请记住，这不会将任务推送到你的队列配置文件定义的不同队列"连接"，而只会推送到单个连接内的特定队列。要指定队列，请在分发任务时使用 `onQueue` 方法：

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
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

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

#### 分发到特定连接

如果你的应用程序与多个队列连接交互，你可以使用 `onConnection` 方法指定将任务推送到哪个连接：

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
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onConnection('sqs');

        return redirect('/podcasts');
    }
}
```

你可以将 `onConnection` 和 `onQueue` 方法链接在一起，为任务指定连接和队列：

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

#### 队列路由

你可以使用 `Queue` 门面的 `route` 方法为特定的任务类定义默认的连接和队列。当你希望确保某些任务始终使用特定队列而无需在任务上指定连接或队列时，这很有用。

除了路由特定的任务类之外，你还可以将接口、trait 或父类传递给 `route` 方法。当你这样做时，任何实现该接口、使用该 trait 或扩展该父类的任务都将自动使用配置的连接和队列。

通常，你应该从服务提供者的 `boot` 方法中调用 `route` 方法：

```php
use App\Concerns\RequiresVideo;
use App\Jobs\ProcessPodcast;
use App\Jobs\ProcessVideo;
use Illuminate\Support\Facades\Queue;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
    Queue::route(RequiresVideo::class, queue: 'video');
}
```

当指定连接而不指定队列时，任务将被发送到默认队列：

```php
Queue::route(ProcessPodcast::class, connection: 'redis');
```

你还可以通过将数组传递给 `route` 方法来一次路由多个任务类：

```php
Queue::route([
    ProcessPodcast::class => ['redis', 'podcasts'], // 连接和队列
    ProcessVideo::class => 'videos', // 仅队列（使用默认连接）
]);
```

> [!NOTE]
> 队列路由仍然可以被任务在逐个任务的基础上覆盖。

你可以使用 `forward` 方法将任务从一个队列转发到另一个队列和 / 或连接。当你需要更改队列基础设施而不修改单个任务或分发位置时，这很有用：

```php
Queue::forward('reports', 'reports.fifo', 'sqs');
Queue::forward('payments', connection: 'sqs');
Queue::forward('updates', 'notifications');
```

你还可以通过传递数组来一次转发多个队列：

```php
Queue::forward([
    'reports' => 'reports.fifo',
    'emails' => 'emails.fifo',
], connection: 'sqs');
```

在任务上配置的显式连接优先于转发的连接。

### 指定最大任务尝试次数 / 超时值

#### 最大尝试次数

任务尝试是 Laravel 队列系统的核心概念，并为许多高级功能提供支持。虽然它们乍一看可能令人困惑，但在修改默认配置之前理解它们的工作原理很重要。

当一个任务被分发时，它被推送到队列上。然后工作进程将其拾取并尝试执行它。这就是一次任务尝试。

但是，一次尝试并不一定意味着任务的 `handle` 方法被执行了。尝试也可以通过以下几种方式被"消耗"：

<div class="content-list" markdown="1">

- 任务在执行期间遇到未处理的异常。
- 任务使用 `$this->release()` 被手动释放回队列。
- 诸如 `WithoutOverlapping` 或 `RateLimited` 之类的中间件未能获取锁并释放了任务。
- 任务超时。
- 任务的 `handle` 方法运行并完成而没有抛出异常。

</div>

你可能不希望无限期地持续尝试任务。因此，Laravel 提供了各种方式来指定任务可以被尝试多少次或多长时间。

> [!NOTE]
> 默认情况下，Laravel 只会尝试任务一次。如果你的任务使用了诸如 `WithoutOverlapping` 或 `RateLimited` 之类的中间件，或者你正在手动释放任务，你可能需要通过 `tries` 选项增加允许的尝试次数。

指定任务可以被尝试的最大次数的一种方法是通过 Artisan 命令行上的 `--tries` 开关。这将适用于工作进程处理的所有任务，除非正在处理的任务指定了它可以被尝试的次数：

```shell
php artisan queue:work --tries=3
```

如果任务超过其最大尝试次数，它将被视为一个"失败"的任务。有关处理失败任务的更多信息，请查阅 失败任务文档。如果向 `queue:work` 命令提供了 `--tries=0`，则该任务将被无限期重试。

你可以通过使用 `Tries` 属性在任务类本身上定义任务可以被尝试的最大次数来采取更细粒度的方法。如果在任务上指定了最大尝试次数，它将优先于命令行上提供的 `--tries` 值：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Tries;

#[Tries(5)]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

如果你需要对特定任务的最大尝试次数进行动态控制，你可以在任务上定义一个 `tries` 方法：

```php
/**
 * 确定任务可以被尝试的次数。
 */
public function tries(): int
{
    return 5;
}
```

#### 基于时间的尝试

作为定义任务在失败之前可以被尝试多少次的替代方案，你可以定义任务不应再被尝试的时间。这允许任务在给定时间范围内被尝试任意次数。要定义任务不应再被尝试的时间，请向你的任务类添加一个 `retryUntil` 方法。此方法应返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 确定任务应超时的时间。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 10);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 优先考虑 `retryUntil` 方法。

> [!NOTE]
> 你也可以在你的 [队列化事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html) 和 [队列化通知](/topic/Laravel%2013.x/2ky045l9z8.html) 上定义 `Tries` 属性或 `retryUntil` 方法。

#### 最大异常数

有时你可能希望指定任务可以被尝试多次，但如果重试是由给定数量的未处理异常触发的（与通过 `release` 方法直接释放相反），则任务应该失败。要实现这一点，你可以在你的任务类上使用 `Tries` 和 `MaxExceptions` 属性：

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
            // 获取锁，处理播客...
        }, function () {
            // 无法获取锁...
            return $this->release(10);
        });
    }
}
```

在此示例中，如果应用程序无法获取 Redis 锁，任务将被释放十秒，并将继续重试最多 25 次。但是，如果任务抛出三个未处理的异常，任务将失败。

#### 通过异常停止重试

有时，异常指示队列任务应该立即失败，而不是被释放以进行另一次尝试。你可以使用你的应用程序的 `bootstrap/app.php` 文件中的 `dontRetry` 异常方法配置应停止任务重试的异常类型：

```php
use App\Exceptions\InvalidPodcastSourceException;
use Illuminate\Foundation\Configuration\Exceptions;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontRetry([
        InvalidPodcastSourceException::class,
    ]);
})
```

如果你需要更多地控制何时停止重试，你可以向 `dontRetryWhen` 方法提供一个闭包。当闭包返回 `true` 时，任务将被标记为失败，并且不会被重试：

```php
use App\Exceptions\PodcastProcessingException;
use Illuminate\Foundation\Configuration\Exceptions;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontRetryWhen(function (PodcastProcessingException $e) {
        return $e->reason() === 'Subscription expired';
    });
})
```

#### 超时

通常，你大致知道你的队列任务预计需要多长时间。出于这个原因，Laravel 允许你指定一个"超时"值。默认情况下，超时值为 60 秒。如果任务处理的时间超过超时值指定的秒数，处理该任务的工作进程将退出并报错。通常，工作进程将由 配置在你的服务器上的进程管理器 自动重启。

任务可以运行的最大秒数可以使用 Artisan 命令行上的 `--timeout` 开关指定：

```shell
php artisan queue:work --timeout=30
```

如果任务因持续超时而超过其最大尝试次数，它将被标记为失败。

你还可以使用任务类上的 `Timeout` 属性定义任务应被允许运行的最大秒数。如果在任务上指定了超时，它将优先于命令行上指定的任何超时：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Timeout;

#[Timeout(120)]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

有时，诸如套接字或传出 HTTP 连接之类的 IO 阻塞进程可能不遵守你指定的超时。因此，在使用这些功能时，你应该始终尝试也使用它们的 API 指定超时。例如，在使用 [Guzzle](https://docs.guzzlephp.org) 时，你应该始终指定连接和请求超时值。

> [!WARNING]
> 必须安装 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展才能指定任务超时。此外，任务的"超时"值应始终小于它的"重试后"值。否则，任务可能在实际完成执行或超时之前就被重新尝试。当 `queue:work` 命令与 `--once` 选项一起调用时，`--timeout` 选项无效。

#### 超时失败

如果你想指示任务应在超时时被标记为 失败，你可以在任务类上使用 `FailOnTimeout` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\FailOnTimeout;

#[FailOnTimeout]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

> [!NOTE]
> 默认情况下，当任务超时时，它会消耗一次尝试并被释放回队列（如果允许重试）。但是，如果你将任务配置为超时时失败，则无论为 `tries` 设置的值如何，它都不会被重试。

### SQS FIFO 和公平队列

Laravel 支持 [Amazon SQS FIFO（先进先出）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html) 和 [公平](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues.html) 队列。FIFO 队列允许你按发送的确切顺序处理任务，同时通过消息去重确保恰好一次处理。

FIFO 队列需要消息组 ID 来确定哪些任务可以并行处理。具有相同组 ID 的任务按顺序处理，而具有不同组 ID 的消息可以并发处理。

Laravel 提供了一个流畅的 `onGroup` 方法，用于在分发任务时指定消息组 ID：

```php
ProcessOrder::dispatch($order)
    ->onGroup("customer-{$order->customer_id}");
```

SQS FIFO 队列支持消息去重以确保恰好一次处理。在你的任务类中实现一个 `deduplicationId` 方法以提供自定义的去重 ID：

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

#### 公平队列

如果你使用的是 SQS 标准队列，设置消息组将启用公平队列。换句话说，一旦你分配了组，SQS 将使用它们来维护跨租户 / 工作负载的公平交付。不需要额外的 Laravel 配置。

除了在分发时调用 `onGroup`，你还可以直接在任务上定义一个 `messageGroup` 方法：

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessOrder implements ShouldQueue
{
    use Queueable;

    // ...

    /**
     * 获取任务的消息组。
     */
    public function messageGroup(): string
    {
        return "customer-{$this->order->customer_id}";
    }
}
```

#### FIFO 监听器、邮件和通知

使用 FIFO 队列时，你还需要在监听器、邮件和通知上定义消息组。或者，你可以将这些对象的队列化实例分发到非 FIFO 队列。

要为 [队列化事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html) 定义消息组，请在监听器上定义一个 `messageGroup` 方法。你还可以可选地定义一个 `deduplicationId` 方法：

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

当发送将在 FIFO 队列上队列化的 [邮件消息](/topic/Laravel%2013.x/d6vro0rv3g.html) 时，你应该在发送通知时调用 `onGroup` 方法，并可选择性地调用 `withDeduplicator` 方法：

```php
use App\Mail\InvoicePaid;
use Illuminate\Support\Facades\Mail;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

Mail::to($request->user())->send($invoicePaid);
```

当发送将在 FIFO 队列上队列化的 [通知](/topic/Laravel%2013.x/2ky045l9z8.html) 时，你应该在发送通知时调用 `onGroup` 方法，并可选择性地调用 `withDeduplicator` 方法：

```php
use App\Notifications\InvoicePaid;

$invoicePaid = (new InvoicePaid($invoice))
    ->onGroup('invoices')
    ->withDeduplicator(fn () => 'invoices-'.$invoice->id);

$user->notify($invoicePaid);
```

### 队列故障转移

`failover` 队列驱动在将任务推送到队列时提供自动故障转移功能。如果 `failover` 配置的主队列连接因任何原因失败，Laravel 将自动尝试将任务推送到列表中的下一个配置连接。这对于确保队列可靠性至关重要的生产环境中的高可用性特别有用。

要配置故障转移队列连接，请指定 `failover` 驱动，并提供要按顺序尝试的连接名称数组。默认情况下，Laravel 在你的应用程序的 `config/queue.php` 配置文件中包含一个示例故障转移配置：

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

配置好使用 `failover` 驱动的连接后，你需要将故障转移连接设置为你应用程序的 `.env` 文件中的默认队列连接，以利用故障转移功能：

```ini
QUEUE_CONNECTION=failover
```

接下来，为你的故障转移连接列表中的每个连接启动至少一个工作进程：

```bash
php artisan queue:work redis
php artisan queue:work database
```

> [!NOTE]
> 你不需要为使用 `sync`、`background` 或 `deferred` 队列驱动的连接运行工作进程，因为这些驱动在当前 PHP 进程内处理任务。

当队列连接操作失败并且故障转移被激活时，Laravel 将分发 `Illuminate\Queue\Events\QueueFailedOver` 事件，允许你报告或记录队列连接已失败。

> [!NOTE]
> 如果你使用 Laravel Horizon，请记住 Horizon 只管理 Redis 队列。如果你的故障转移列表包含 `database`，你应该在 Horizon 旁边运行一个常规的 `php artisan queue:work database` 进程。

### 错误处理

如果在处理任务时抛出异常，任务将自动被释放回队列，以便可以再次尝试。任务将继续被释放，直到它已被尝试你应用程序允许的最大次数。最大尝试次数由 `queue:work` Artisan 命令上使用的 `--tries` 开关定义。或者，最大尝试次数可以在任务类本身上定义。有关运行队列工作进程的更多信息 可以在下面找到。

#### 手动释放任务

有时你可能希望手动将任务释放回队列，以便它可以在稍后再次尝试。你可以通过调用 `release` 方法来实现：

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

默认情况下，`release` 方法会将任务释放回队列以立即处理。但是，你可以通过向 `release` 方法传递整数或日期实例来指示队列在给定秒数过去之前不使任务可供处理：

```php
$this->release(10);

$this->release(now()->plus(seconds: 10));
```

#### 手动将任务标记为失败

偶尔你可能需要手动将任务标记为"失败"。为此，你可以调用 `fail` 方法：

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

如果你希望因为你捕获的异常而将任务标记为失败，你可以将异常传递给 `fail` 方法。或者，为方便起见，你可以传递一个字符串错误消息，它将为你转换为异常：

```php
$this->fail($exception);

$this->fail('Something went wrong.');
```

> [!NOTE]
> 有关失败任务的更多信息，请查看 处理任务失败的文档。

#### 在特定异常上失败任务

`FailOnException` 任务中间件 允许你在抛出特定异常时短路重试。这允许在瞬时异常（例如外部 API 错误）时重试，但在持久异常（例如用户权限被撤销）时永久失败任务：

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

## 任务批处理

Laravel 的任务批处理功能允许你轻松地并行执行一组任务，然后在批次任务完成执行后执行某些操作。

在开始之前，你应该创建一个数据库迁移来构建一个表，该表将包含有关你的任务批次的元信息，例如它们的完成百分比。可以使用 `make:queue-batches-table` Artisan 命令生成此迁移：

```shell
php artisan make:queue-batches-table

php artisan migrate
```

### 定义可批处理的任务

要定义可批处理的任务，你应该像往常一样 创建可队列化任务；但是，你应该将 `Illuminate\Bus\Batchable` trait 添加到任务类。此 trait 提供对 `batch` 方法的访问，该方法可用于检索任务正在其中执行的当前批次：

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
            // 确定批次是否已被取消...

            return;
        }

        // 导入 CSV 文件的一部分...
    }
}
```

### 分发批次

要分发一批任务，你应该使用 `Bus` 门面的 `batch` 方法。当然，批处理在与完成回调结合使用时最有用。因此，你可以使用 `then`、`catch` 和 `finally` 方法为批次定义完成回调。这些回调在被调用时都会接收一个 `Illuminate\Bus\Batch` 实例。

当运行多个队列工作进程时，批次中的任务将被并行处理。因此，任务完成的顺序可能与它们被添加到批次的顺序不同。请查阅我们关于 任务链和批次 的文档，了解如何按顺序运行一系列任务。

在此示例中，我们将假设我们正在队列化一批任务，每个任务处理 CSV 文件中给定数量的行：

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
    // 批次已创建，但尚未添加任何任务...
})->progress(function (Batch $batch) {
    // 单个任务已成功完成...
})->then(function (Batch $batch) {
    // 所有任务已成功完成...
})->catch(function (Batch $batch, Throwable $e) {
    // 检测到批次任务失败...
})->finally(function (Batch $batch) {
    // 批次已完成执行...
})->dispatch();

return $batch->id;
```

批次的 ID 可以通过 `$batch->id` 属性访问，可用于在批次分发后 查询 Laravel 命令总线 以获取有关批次的信息。

> [!WARNING]
> 由于批次回调被序列化并由 Laravel 队列在稍后时间执行，因此你不应在回调中使用 `$this` 变量。此外，由于批次任务被包装在数据库事务中，因此触发隐式提交的数据库语句不应在任务中执行。

#### 命名批次

如果批次被命名，诸如 [Laravel Horizon](/topic/Laravel%2013.x/rwyl28xvz8.html) 和 [Laravel Telescope](/topic/Laravel%2013.x/e296opq9q7.html) 之类的工具可能会为批次提供更友好的调试信息。要为批次分配任意名称，你可以在定义批次时调用 `name` 方法：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务已成功完成...
})->name('Import CSV')->dispatch();
```

#### 批次连接和队列

如果你想指定批次任务应使用的连接和队列，你可以使用 `onConnection` 和 `onQueue` 方法。所有批次任务必须在同一个连接和队列中执行：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务已成功完成...
})->onConnection('redis')->onQueue('imports')->dispatch();
```

### 链和批次

你可以通过将链式任务放入数组中来在批次内定义一组 链式任务。例如，我们可以并行执行两个任务链，并在两个任务链都完成处理后执行回调：

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
    // 所有任务已成功完成...
})->dispatch();
```

相反，你可以通过在链中定义批次来在 链 中运行任务批次。例如，你可以先运行一批任务来发布多个播客，然后运行一批任务来发送发布通知：

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

### 向批次添加任务

有时，从批次任务内向批次添加额外任务可能会有用。当你需要批量处理数千个任务时，这些任务可能在 Web 请求期间分发耗时过长。因此，相反，你可能希望分发一批初始的"加载器"任务，用更多任务填充批次：

```php
$batch = Bus::batch([
    new LoadImportBatch,
    new LoadImportBatch,
    new LoadImportBatch,
])->then(function (Batch $batch) {
    // 所有任务已成功完成...
})->name('Import Contacts')->dispatch();
```

在此示例中，我们将使用 `LoadImportBatch` 任务来用其他任务填充批次。要实现这一点，我们可以使用可通过任务的 `batch` 方法访问的批次实例上的 `add` 方法：

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
> 你只能从属于同一批次的任务内向批次添加任务。

### 检查批次

提供给批次完成回调的 `Illuminate\Bus\Batch` 实例具有各种属性和方法，可帮助你与给定批次的任务进行交互和检查：

```php
// 批次的 UUID...
$batch->id;

// 批次的名称（如果适用）...
$batch->name;

// 分配给批次的任务数量...
$batch->totalJobs;

// 尚未被队列处理的任务数量...
$batch->pendingJobs;

// 已失败的任务数量...
$batch->failedJobs;

// 到目前为止已处理的任务数量...
$batch->processedJobs();

// 批次的完成百分比（0-100）...
$batch->progress();

// 指示批次是否已完成执行...
$batch->finished();

// 取消批次的执行...
$batch->cancel();

// 指示批次是否已被取消...
$batch->cancelled();
```

#### 从路由返回批次

所有 `Illuminate\Bus\Batch` 实例都是 JSON 可序列化的，这意味着你可以直接从应用程序的一个路由返回它们，以检索包含批次信息的 JSON 负载，包括其完成进度。这使得在你的应用程序的 UI 中显示有关批次完成进度的信息变得很方便。

要通过 ID 检索批次，你可以使用 `Bus` 门面的 `findBatch` 方法：

```php
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Route;

Route::get('/batch/{batchId}', function (string $batchId) {
    return Bus::findBatch($batchId);
});
```

### 取消批次

有时你可能需要取消给定批次的执行。这可以通过在 `Illuminate\Bus\Batch` 实例上调用 `cancel` 方法来完成：

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

正如你可能在前面的示例中注意到的，批次任务通常应在继续执行之前确定其对应的批次是否已被取消。但是，为方便起见，你可以将 `SkipIfBatchCancelled` 中间件 分配给任务。如其名称所示，此中间件将指示 Laravel 在其对应的批次已被取消时不处理该任务：

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

### 批次失败

当批次任务失败时，`catch` 回调（如果已分配）将被调用。此回调仅为批次中第一个失败的任务调用。

#### 允许失败

当批次中的任务失败时，Laravel 会自动将批次标记为"已取消"。如果你愿意，你可以禁用此行为，以便任务失败不会自动将批次标记为已取消。这可以通过在分发批次时调用 `allowFailures` 方法来实现：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有任务已成功完成...
})->allowFailures()->dispatch();
```

你可以选择向 `allowFailures` 方法提供一个闭包，该闭包将在每个任务失败时执行：

```php
$batch = Bus::batch([
    // ...
])->allowFailures(function (Batch $batch, $exception) {
    // 处理单个任务失败...
})->dispatch();
```

#### 重试失败的批次任务

为方便起见，Laravel 提供了一个 `queue:retry-batch` Artisan 命令，允许你轻松重试给定批次的全部失败任务。此命令接受其失败任务应被重试的批次的 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

### 修剪批次

如果不进行修剪，`job_batches` 表可能会非常快地积累记录。为了缓解这种情况，你应该 [调度](/topic/Laravel%2013.x/e296olw9q7.html) `queue:prune-batches` Artisan 命令每天运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches')->daily();
```

默认情况下，所有超过 24 小时的已完成批次都将被修剪。你可以在调用命令时使用 `hours` 选项来确定保留批次数据的时间。例如，以下命令将删除所有在 48 小时前完成的批次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48')->daily();
```

有时，你的 `job_batches` 表可能会积累从未成功完成的批次的批次记录，例如任务失败且该任务从未成功重试的批次。你可以使用 `unfinished` 选项指示 `queue:prune-batches` 命令修剪这些未完成的批次记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --unfinished=72')->daily();
```

同样，你的 `job_batches` 表也可能积累已取消批次的批次记录。你可以使用 `cancelled` 选项指示 `queue:prune-batches` 命令修剪这些已取消的批次记录：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:prune-batches --hours=48 --cancelled=72')->daily();
```

### 将批次存储在 DynamoDB 中

Laravel 还支持将批次元信息存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库中。但是，你将需要手动创建一个 DynamoDB 表来存储所有批次记录。

通常，此表应命名为 `job_batches`，但你应该根据你的应用程序的 `queue` 配置文件中 `queue.batching.table` 配置值的值来命名该表。

#### DynamoDB 批次表配置

`job_batches` 表应该有一个名为 `application` 的字符串主分区键和一个名为 `id` 的字符串主排序键。键的 `application` 部分将包含你的应用程序的 `app` 配置文件中 `name` 配置值定义的应用程序名称。由于应用程序名称是 DynamoDB 表键的一部分，你可以使用同一个表为多个 Laravel 应用程序存储任务批次。

此外，如果你希望利用 自动批次修剪，你可以为你的表定义 `ttl` 属性。

#### DynamoDB 配置

接下来，安装 AWS SDK，以便你的 Laravel 应用程序可以与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

然后，将 `queue.batching.driver` 配置选项的值设置为 `dynamodb`。此外，你应该在 `batching` 配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于与 AWS 进行身份验证。使用 `dynamodb` 驱动时，`queue.batching.database` 配置选项是不必要的：

```php
'batching' => [
    'driver' => env('QUEUE_BATCHING_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'job_batches',
],
```

#### 在 DynamoDB 中修剪批次

当使用 [DynamoDB](https://aws.amazon.com/dynamodb) 来存储任务批次信息时，用于修剪存储在关系型数据库中的批次的典型修剪命令将不起作用。相反，你可以利用 [DynamoDB 的原生 TTL 功能](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html) 自动删除旧批次的记录。

如果你定义了带有 `ttl` 属性的 DynamoDB 表，你可以定义配置参数来指示 Laravel 如何修剪批次记录。`queue.batching.ttl_attribute` 配置值定义了保存 TTL 的属性的名称，而 `queue.batching.ttl` 配置值定义了从 DynamoDB 表中删除批次记录之前相对于记录最后一次更新时间所经过的秒数：

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

## 队列化闭包

除了将任务类分发到队列之外，你还可以分发闭包。这对于需要在当前请求周期之外执行的快速、简单的任务非常有用。将闭包分发到队列时，闭包的代码内容会被加密签名，以便它不能在传输过程中被修改：

```php
use App\Models\Podcast;

$podcast = Podcast::find(1);

dispatch(function () use ($podcast) {
    $podcast->publish();
});
```

要为队列化闭包分配一个名称，该名称可被队列报告仪表盘使用，也可由 `queue:work` 命令显示，你可以使用 `name` 方法：

```php
dispatch(function () {
    // ...
})->name('Publish Podcast');
```

使用 `catch` 方法，你可以提供一个闭包，如果队列化闭包在耗尽队列的 配置重试尝试 后未能成功完成，则应执行该闭包：

```php
use Throwable;

dispatch(function () use ($podcast) {
    $podcast->publish();
})->catch(function (Throwable $e) {
    // 此任务已失败...
});
```

> [!WARNING]
> 由于 `catch` 回调被序列化并由 Laravel 队列在稍后时间执行，因此你不应在 `catch` 回调中使用 `$this` 变量。

## 运行队列工作进程

### `queue:work` 命令

Laravel 包含一个 Artisan 命令，它将启动一个队列工作进程并在新任务被推送到队列时处理它们。你可以使用 `queue:work` Artisan 命令运行工作进程。请注意，一旦 `queue:work` 命令启动，它将继续运行，直到被手动停止或你关闭终端：

```shell
php artisan queue:work
```

> [!NOTE]
> 要让 `queue:work` 进程在后台永久运行，你应该使用诸如 Supervisor 之类的进程监视器来确保队列工作进程不会停止运行。

如果你希望处理的任务 ID、连接名称和队列名称包含在命令的输出中，你可以在调用 `queue:work` 命令时包含 `-v` 标志：

```shell
php artisan queue:work -v
```

请记住，队列工作进程是长生命周期进程，并将引导的应用程序状态存储在内存中。因此，它们在启动后不会注意到代码库中的更改。所以，在你的部署过程中，请务必 重启你的队列工作进程。此外，请记住，你的应用程序创建或修改的任何静态状态都不会在任务之间自动重置。

或者，你可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当你想要重新加载更新后的代码或重置应用程序状态时，你不需要手动重启工作进程；但是，此命令的效率明显低于 `queue:work` 命令：

```shell
php artisan queue:listen
```

#### 运行多个队列工作进程

要向队列分配多个工作进程并并发处理任务，你应该简单地启动多个 `queue:work` 进程。这可以在本地通过终端的多个标签页完成，也可以在生产环境中使用你的进程管理器的配置设置完成。使用 Supervisor 时，你可以使用 `numprocs` 配置值。

#### 指定连接和队列

你还可以指定工作进程应使用哪个队列连接。传递给 `work` 命令的连接名称应对应于你的 `config/queue.php` 配置文件中定义的连接之一：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令只处理给定连接上默认队列的任务。但是，你可以通过只处理给定连接的特定队列来进一步自定义你的队列工作进程。例如，如果你的所有电子邮件都在你的 `redis` 队列连接的 `emails` 队列中处理，你可以发出以下命令来启动一个只处理该队列的工作进程：

```shell
php artisan queue:work redis --queue=emails
```

#### 处理指定数量的任务

`--once` 选项可用于指示工作进程只从队列中处理单个任务：

```shell
php artisan queue:work --once
```

`--max-jobs` 选项可用于指示工作进程处理给定数量的任务，然后退出。此选项在与 Supervisor 结合使用时可能很有用，这样你的工作进程在处理给定数量的任务后会自动重启，释放它们可能积累的任何内存：

```shell
php artisan queue:work --max-jobs=1000
```

#### 处理所有队列任务然后退出

`--stop-when-empty` 选项可用于指示工作进程处理所有任务，然后优雅地退出。当你希望在队列清空后关闭容器时，此选项在 Docker 容器中处理 Laravel 队列时可能很有用：

```shell
php artisan queue:work --stop-when-empty
```

#### 处理任务给定秒数

`--max-time` 选项可用于指示工作进程处理任务给定秒数，然后退出。此选项在与 Supervisor 结合使用时可能很有用，这样你的工作进程在处理任务一段时间后会自动重启，释放它们可能积累的任何内存：

```shell
# 处理任务一小时然后退出...
php artisan queue:work --max-time=3600
```

#### 工作进程休眠时长

当队列上有任务可用时，工作进程将继续处理任务，任务之间没有延迟。但是，`sleep` 选项决定了如果没有任务可用，工作进程将"休眠"多少秒。当然，在休眠期间，工作进程不会处理任何新任务：

```shell
php artisan queue:work --sleep=3
```

#### 维护模式和队列

当你的应用程序处于 [维护模式](/topic/Laravel%2013.x/3dykqpoyl0.html) 时，将不会处理任何队列任务。一旦应用程序退出维护模式，任务将继续正常处理。

要强制你的队列工作进程即使在启用维护模式时也处理任务，你可以使用 `--force` 选项：

```shell
php artisan queue:work --force
```

#### 资源注意事项

守护进程队列工作进程在处理每个任务之前不会"重启"框架。因此，你应该在每个任务完成后释放任何重资源。例如，如果你使用 [GD 库](https://www.php.net/manual/en/book.image.php) 进行 [图像处理](/topic/Laravel%2013.x/rwyl24xvz8.html)，你应该在处理完图像后用 `imagedestroy` 释放内存。

### 队列优先级

有时你可能希望优先处理你的队列。例如，在你的 `config/queue.php` 配置文件中，你可以将 `redis` 连接的默认 `queue` 设置为 `low`。但是，偶尔你可能希望将任务推送到 `high` 优先级队列，如下所示：

```php
dispatch((new Job)->onQueue('high'));
```

要启动一个工作进程，在继续处理 `low` 队列上的任何任务之前验证所有 `high` 队列任务都已处理，请将逗号分隔的队列名称列表传递给 `work` 命令：

```shell
php artisan queue:work --queue=high,low
```

### 队列工作进程和部署

由于队列工作进程是长生命周期进程，它们不会在未被重启的情况下注意到代码的更改。因此，部署使用队列工作进程的应用程序的最简单方法是在部署过程中重启工作进程。你可以通过发出 `queue:restart` 命令来优雅地重启所有工作进程：

```shell
php artisan queue:restart
```

此命令将指示所有队列工作进程在完成处理当前任务后优雅退出，以便不会丢失任何现有任务。由于队列工作进程将在 `queue:restart` 命令执行时退出，因此你应该运行诸如 Supervisor 之类的进程管理器来自动重启队列工作进程。

> [!NOTE]
> 队列使用 [缓存](/topic/Laravel%2013.x/5dve2w3v4x.html) 来存储重启信号，因此你应该在使用此功能之前验证是否为你的应用程序正确配置了缓存驱动。

### 响应工作进程信号

当队列工作进程在处理任务时收到终止信号（例如 `SIGQUIT`、`SIGTERM` 或 `SIGINT`）时，工作进程将在退出之前完成其当前任务。但是，你的任务可能需要在进程被你的服务器或容器编排器停止之前响应信号。例如，一个长时间运行的导入任务可能需要停止拉取新记录并保存其当前进度。

要在任务内响应工作进程信号，请实现 `Illuminate\Contracts\Queue\Interruptible` 接口并在你的任务上定义一个 `interrupted` 方法。工作进程收到的信号编号将被传递给 `interrupted` 方法：

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

            // 导入产品行...
        }

        $this->import->saveProgress();
    }

    /**
     * 处理队列工作进程收到的信号。
     */
    public function interrupted(int $signal): void
    {
        $this->shouldStop = true;
    }
}
```

`interrupted` 方法仅在工作进程在任务当前运行时收到进程信号时被调用。它不是 超时 或任务的 `failed` 方法 的替代品。

### 任务过期和超时

#### 任务过期

在你的 `config/queue.php` 配置文件中，每个队列连接都定义了一个 `retry_after` 选项。此选项指定队列连接在重试正在处理的任务之前应等待多少秒。例如，如果 `retry_after` 的值设置为 `90`，则任务如果在没有释放或删除的情况下已处理 90 秒，将被释放回队列。通常，你应该将 `retry_after` 值设置为你的任务合理完成处理所需的最大秒数。

> [!WARNING]
> 唯一不包含 `retry_after` 值的队列连接是 Amazon SQS。SQS 将根据在 AWS 控制台中管理的 [默认可见性超时](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html) 重试任务。

#### 工作进程超时

`queue:work` Artisan 命令暴露了一个 `--timeout` 选项。默认情况下，`--timeout` 值为 60 秒。如果任务处理的时间超过超时值指定的秒数，处理该任务的工作进程将退出并报错。通常，工作进程将由 配置在你的服务器上的进程管理器 自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置选项和 `--timeout` CLI 选项是不同的，但它们一起工作以确保任务不会丢失，并且任务只被成功处理一次。

> [!WARNING]
> `--timeout` 值应始终比你的 `retry_after` 配置值短至少几秒钟。这将确保处理冻结任务的工作进程始终在任务被重试之前终止。如果你的 `--timeout` 选项长于你的 `retry_after` 配置值，你的任务可能会被处理两次。

### 暂停和恢复队列工作进程

有时你可能需要暂时阻止队列工作进程处理新任务，而不完全停止工作进程。例如，你可能希望在系统维护期间暂停任务处理。Laravel 提供了 `queue:pause` 和 `queue:continue` Artisan 命令来暂停和恢复队列工作进程。

要暂停特定队列，请提供队列连接名称和队列名称：

```shell
php artisan queue:pause database:default
```

在此示例中，`database` 是队列连接名称，`default` 是队列名称。一旦队列被暂停，从该队列处理任务的任何工作进程将继续完成其当前任务，但在队列恢复之前不会拾取任何新任务。

要暂停每个连接上每个队列的任务处理，请使用 `--all` 选项：

```shell
php artisan queue:pause --all
```

要恢复处理已暂停队列上的任务，请使用 `queue:continue` 命令：

```shell
php artisan queue:continue database:default
```

要恢复每个连接上每个队列的任务处理，请将 `--all` 选项与 `queue:resume` 命令一起使用：

```shell
php artisan queue:resume --all
```

恢复队列后，工作进程将立即开始处理该队列的新任务。恢复所有队列不会恢复单独暂停的队列。请注意，暂停队列不会停止工作进程本身——它只会阻止工作进程处理指定队列的新任务。

#### 工作进程重启和暂停信号

默认情况下，队列工作进程在每次任务迭代时轮询缓存驱动以获取重启和暂停信号。虽然这种轮询对于响应 `queue:restart` 和 `queue:pause` 命令至关重要，但它确实引入了一小部分性能开销。

如果你需要优化性能并且不需要这些中断功能，你可以通过调用 `Queue` 门面上的 `withoutInterruptionPolling` 方法全局禁用此轮询。这通常应该在你的 `AppServiceProvider` 的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Queue;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Queue::withoutInterruptionPolling();
}
```

或者，你可以通过设置 `Illuminate\Queue\Worker` 类上的静态 `$restartable` 或 `$pausable` 属性来单独禁用重启或暂停轮询：

```php
use Illuminate\Queue\Worker;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Worker::$restartable = false;
    Worker::$pausable = false;
}
```

> [!WARNING]
> 当中断轮询被禁用时，工作进程将不会响应 `queue:restart` 或 `queue:pause` 命令（取决于禁用了哪些功能）。

## Supervisor 配置

在生产环境中，你需要一种方法来保持你的 `queue:work` 进程运行。`queue:work` 进程可能因各种原因停止运行，例如超过工作进程超时或执行 `queue:restart` 命令。

出于这个原因，你需要配置一个进程监视器，它可以检测你的 `queue:work` 进程何时退出并自动重启它们。此外，进程监视器可以允许你指定你希望并发运行的 `queue:work` 进程数量。Supervisor 是 Linux 环境中常用的进程监视器，我们将在以下文档中讨论如何配置它。

#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果你的 `queue:work` 进程失败，它将自动重启它们。要在 Ubuntu 上安装 Supervisor，你可以使用以下命令：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自己配置和管理 Supervisor 听起来令人生畏，请考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它提供了一个完全托管的平台来运行 Laravel 队列工作进程。

#### 配置 Supervisor

Supervisor 配置文件通常存储在 `/etc/supervisor/conf.d` 目录中。在此目录中，你可以创建任意数量的配置文件，指示 Supervisor 如何监视你的进程。例如，让我们创建一个 `laravel-worker.conf` 文件，该文件启动并监视 `queue:work` 进程：

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

在此示例中，`numprocs` 指令将指示 Supervisor 运行八个 `queue:work` 进程并监视所有进程，如果它们失败则自动重启它们。你应该更改配置的 `command` 指令以反映你所需的队列连接和工作进程选项。

> [!WARNING]
> 你应该确保 `stopwaitsecs` 的值大于你的最长运行任务所消耗的秒数。否则，Supervisor 可能会在任务完成处理之前终止该任务。

#### 启动 Supervisor

创建配置文件后，你可以使用以下命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start "laravel-worker:*"
```

有关 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

## 处理失败的任务

有时你的队列任务会失败。别担心，事情并不总是按计划进行！Laravel 包含一种方便的方法来 指定任务应尝试的最大次数。在异步任务超过此尝试次数后，它将被插入到 `failed_jobs` 数据库表中。[同步分发的任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 失败时不存储在此表中，其异常会立即由应用程序处理。

创建 `failed_jobs` 表的迁移通常已存在于新的 Laravel 应用程序中。但是，如果你的应用程序不包含此表的迁移，你可以使用 `make:queue-failed-table` 命令创建迁移：

```shell
php artisan make:queue-failed-table

php artisan migrate
```

运行 队列工作进程 进程时，你可以使用 `queue:work` 命令上的 `--tries` 开关指定任务应尝试的最大次数。如果你没有为 `--tries` 选项指定值，任务将只会被尝试一次，或者按照任务类的 `Tries` 属性指定的次数尝试：

```shell
php artisan queue:work redis --tries=3
```

使用 `--backoff` 选项，你可以指定 Laravel 在重试遇到异常的任务之前应等待多少秒。默认情况下，任务会立即被释放回队列，以便可以再次尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你想在逐个任务的基础上配置 Laravel 在重试遇到异常的任务之前应等待多少秒，你可以在你的任务类上使用 `Backoff` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Backoff;

#[Backoff(3)]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

如果你需要更复杂的逻辑来确定任务的退避时间，你可以在你的任务类上定义一个 `backoff` 方法：

```php
/**
 * 计算重试任务之前应等待的秒数。
 */
public function backoff(): int
{
    return 3;
}
```

你可以通过定义退避值数组来轻松配置"指数"退避。在此示例中，第一次重试的退避延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有更多尝试剩余，则每次后续重试为 10 秒：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\Backoff;

#[Backoff([1, 5, 10])]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

### 清理失败的任务

当特定任务失败时，你可能希望向你的用户发送警报或撤销任务部分完成的任何操作。要实现这一点，你可以在你的任务类上定义一个 `failed` 方法。导致任务失败的 `Throwable` 实例将被传递给 `failed` 方法：

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
        // Process uploaded podcast...
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
> 在调用 `failed` 方法之前会实例化任务的新实例；因此，可能在 `handle` 方法中发生的任何类属性修改都将丢失。

失败的任务不一定是遇到未处理异常的任务。当任务耗尽所有允许的尝试时，它也可能被视为失败。这些尝试可以通过以下几种方式被消耗：

<div class="content-list" markdown="1">

- 任务超时。
- 任务在执行期间遇到未处理的异常。
- 任务被手动释放或由中间件释放回队列。

</div>

如果最终尝试由于任务执行期间抛出的异常而失败，该异常将被传递给任务的 `failed` 方法。但是，如果任务因为已达到允许的最大尝试次数而失败，则 `$exception` 将是 `Illuminate\Queue\MaxAttemptsExceededException` 的实例。同样，如果任务因超过配置的超时而失败，则 `$exception` 将是 `Illuminate\Queue\TimeoutExceededException` 的实例。

### 重试失败的任务

要查看已插入到你的 `failed_jobs` 数据库表中的所有失败任务，你可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令将列出任务 ID、连接、队列、失败时间以及有关任务的其他信息。任务 ID 可用于重试失败的任务。例如，要重试 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败任务，请发出以下命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如有必要，你可以向命令传递多个 ID：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你还可以重试特定队列的所有失败任务：

```shell
php artisan queue:retry --queue=name
```

要重试所有失败的任务，请执行 `queue:retry` 命令并将 `all` 作为 ID 传递：

```shell
php artisan queue:retry all
```

如果你想删除失败的任务，你可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> [!NOTE]
> 使用 [Horizon](/topic/Laravel%2013.x/rwyl28xvz8.html) 时，你应该使用 `horizon:forget` 命令删除失败的任务，而不是 `queue:forget` 命令。

要从 `failed_jobs` 表中删除所有失败的任务，你可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

`queue:flush` 命令会从你的队列中删除所有失败的任务记录，无论失败任务有多旧。你可以使用 `--hours` 选项只删除在若干小时前或更早失败的任务：

```shell
php artisan queue:flush --hours=48
```

### 忽略缺失的模型

将 Eloquent 模型注入任务时，模型会在被放置到队列上之前自动序列化，并在任务处理时从数据库中重新检索。但是，如果模型在任务等待工作进程处理期间已被删除，你的任务可能会因 `ModelNotFoundException` 而失败。

为方便起见，你可以选择使用任务类上的 `DeleteWhenMissingModels` 属性自动删除具有缺失模型的任务。当存在此属性时，Laravel 将安静地丢弃任务而不引发异常：

```php
<?php

namespace App\Jobs;

use Illuminate\Queue\Attributes\DeleteWhenMissingModels;

#[DeleteWhenMissingModels]
class ProcessPodcast implements ShouldQueue
{
    // ...
}
```

### 修剪失败的任务

你可以通过调用 `queue:prune-failed` Artisan 命令来修剪你的应用程序的 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败任务记录都将被修剪。如果你向命令提供 `--hours` 选项，则只保留在最近 N 小时内插入的失败任务记录。例如，以下命令将删除所有在 48 小时前插入的失败任务记录：

```shell
php artisan queue:prune-failed --hours=48
```

### 将失败的任务存储在 DynamoDB 中

Laravel 还支持将你的失败任务记录存储在 [DynamoDB](https://aws.amazon.com/dynamodb) 中，而不是关系型数据库表中。但是，你必须手动创建一个 DynamoDB 表来存储所有失败任务记录。通常，此表应命名为 `failed_jobs`，但你应该根据你的应用程序的 `queue` 配置文件中 `queue.failed.table` 配置值的值来命名该表。

`failed_jobs` 表应该有一个名为 `application` 的字符串主分区键和一个名为 `uuid` 的字符串主排序键。键的 `application` 部分将包含你的应用程序的 `app` 配置文件中 `name` 配置值定义的应用程序名称。由于应用程序名称是 DynamoDB 表键的一部分，你可以使用同一个表为多个 Laravel 应用程序存储失败任务。

此外，请确保安装 AWS SDK，以便你的 Laravel 应用程序可以与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `queue.failed.driver` 配置选项的值设置为 `dynamodb`。此外，你应该在失败任务配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于与 AWS 进行身份验证。使用 `dynamodb` 驱动时，`queue.failed.database` 配置选项是不必要的：

```php
'failed' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'dynamodb'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => 'failed_jobs',
],
```

### 禁用失败的任务存储

你可以通过将 `queue.failed.driver` 配置选项的值设置为 `null` 来指示 Laravel 丢弃失败的任务而不存储它们。通常，这可以通过 `QUEUE_FAILED_DRIVER` 环境变量实现：

```ini
QUEUE_FAILED_DRIVER=null
```

### 失败任务事件

如果你想注册一个在任务失败时被调用的事件监听器，你可以使用 `Queue` 门面的 `failing` 方法。例如，我们可以从 Laravel 附带的 `AppServiceProvider` 的 `boot` 方法中将一个闭包附加到此事件：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Queue\Events\JobFailed;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
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

## 从队列中清除任务

> [!NOTE]
> 使用 [Horizon](/topic/Laravel%2013.x/rwyl28xvz8.html) 时，你应该使用 `horizon:clear` 命令从队列中清除任务，而不是 `queue:clear` 命令。

如果你想从默认连接的默认队列中删除所有任务，你可以使用 `queue:clear` Artisan 命令：

```shell
php artisan queue:clear
```

你还可以提供 `connection` 参数和 `queue` 选项来删除特定连接和队列的任务：

```shell
php artisan queue:clear redis --queue=emails
```

> [!WARNING]
> 从队列中清除任务仅适用于 SQS、Redis 和 database 队列驱动。此外，SQS 消息删除过程需要最多 60 秒，因此在你清除队列后最多 60 秒内发送到 SQS 队列的任务也可能被删除。

## 监控你的队列

如果你的队列突然涌入任务，它可能会不堪重负，导致任务完成的等待时间过长。如果你愿意，当你的队列任务数量超过指定阈值时，Laravel 可以提醒你。

要开始使用，你应该调度 `queue:monitor` 命令 [每分钟运行一次](/topic/Laravel%2013.x/e296olw9q7.html)。该命令接受你希望监视的队列名称以及你所需的任务数量阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅调度此命令不足以触发通知来提醒你队列不堪重负的状态。当命令遇到任务数量超过你的阈值的队列时，将分发一个 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在你的应用程序的 `AppServiceProvider` 中监听此事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\QueueHasLongWaitTime;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 引导任何应用程序服务。
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

## 测试

在测试分发任务的代码时，你可能希望指示 Laravel 不实际执行任务本身，因为任务的代码可以直接且独立于分发它的代码进行测试。当然，要测试任务本身，你可以在测试中实例化任务实例并直接调用 `handle` 方法。

你可以使用 `Queue` 门面的 `fake` 方法来防止队列任务实际被推送到队列。调用 `Queue` 门面的 `fake` 方法后，你可以断言应用程序尝试将任务推送到队列：

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

    // 断言任务被推送到给定队列...
    Queue::assertPushedOn('queue-name', ShipOrder::class);

    // 断言任务被推送
    Queue::assertPushed(ShipOrder::class);

    // 断言任务被恰好推送一次...
    Queue::assertPushedOnce(ShipOrder::class);

    // 断言任务被推送两次...
    Queue::assertPushedTimes(ShipOrder::class, 2);

    // 断言任务未被推送...
    Queue::assertNotPushed(AnotherJob::class);

    // 断言闭包被推送到队列...
    Queue::assertClosurePushed();

    // 断言闭包未被推送...
    Queue::assertClosureNotPushed();

    // 断言被推送的任务总数...
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

        // 断言任务被推送到给定队列...
        Queue::assertPushedOn('queue-name', ShipOrder::class);

        // 断言任务被推送
        Queue::assertPushed(ShipOrder::class);

        // 断言任务被恰好推送一次...
        Queue::assertPushedOnce(ShipOrder::class);

        // 断言任务被推送两次...
        Queue::assertPushedTimes(ShipOrder::class, 2);

        // 断言任务未被推送...
        Queue::assertNotPushed(AnotherJob::class);

        // 断言闭包被推送到队列...
        Queue::assertClosurePushed();

        // 断言闭包未被推送...
        Queue::assertClosureNotPushed();

        // 断言被推送的任务总数...
        Queue::assertCount(3);
    }
}
```

你可以向 `assertPushed`、`assertNotPushed`、`assertClosurePushed` 或 `assertClosureNotPushed` 方法传递一个闭包，以断言被推送的任务通过了给定的"真值测试"。如果至少有一个被推送的任务通过了给定的真值测试，则断言将成功：

```php
use Illuminate\Queue\CallQueuedClosure;

Queue::assertPushed(function (ShipOrder $job) use ($order) {
    return $job->order->id === $order->id;
});

Queue::assertClosurePushed(function (CallQueuedClosure $job) {
    return $job->name === 'validate-order';
});
```

### 伪造部分任务

如果你只需要伪造特定任务，同时允许你的其他任务正常执行，你可以将应被伪造的任务的类名传递给 `fake` 方法：

```php tab=Pest
test('orders can be shipped', function () {
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货...

    // 断言任务被推送两次...
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

    // 断言任务被推送两次...
    Queue::assertPushedTimes(ShipOrder::class, 2);
}
```

你可以使用 `except` 方法伪造除一组指定任务之外的所有任务：

```php
Queue::fake()->except([
    ShipOrder::class,
]);
```

### 测试任务链

要测试任务链，你将需要利用 `Bus` 门面的伪造能力。`Bus` 门面的 `assertChained` 方法可用于断言 [任务链](/topic/Laravel%2013.x/wevwmkz9l2.html) 被分发。`assertChained` 方法接受一个链式任务数组作为其第一个参数：

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

正如你在上面的示例中所看到的，链式任务数组可以是任务类名的数组。但是，你也可以提供实际任务实例的数组。这样做时，Laravel 将确保任务实例与你的应用程序分发的链式任务具有相同的类并具有相同的属性值：

```php
Bus::assertChained([
    new ShipOrder,
    new RecordShipment,
    new UpdateInventory,
]);
```

你可以使用 `assertDispatchedWithoutChain` 方法断言任务在没有任务链的情况下被推送：

```php
Bus::assertDispatchedWithoutChain(ShipOrder::class);
```

#### 测试链修改

如果链式任务 向现有链前置或追加任务，你可以使用任务的 `assertHasChain` 方法断言该任务具有预期的剩余任务链：

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

#### 测试链式批次

如果你的任务链 包含一批任务，你可以通过在链断言中插入 `Bus::chainedBatch` 定义来断言链式批次符合你的预期：

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

### 测试任务批次

`Bus` 门面的 `assertBatched` 方法可用于断言 [一批任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 被分发。提供给 `assertBatched` 方法的闭包接收一个 `Illuminate\Bus\PendingBatch` 实例，该实例可用于检查批次中的任务：

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

`hasJobs` 方法可用于待处理批次，以验证该批次包含预期的任务。该方法接受任务实例、类名或闭包的数组：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        new ProcessCsvRow(row: 1),
        new ProcessCsvRow(row: 2),
        new ProcessCsvRow(row: 3),
    ]);
});
```

使用闭包时，闭包将接收任务实例。预期的任务类型将从闭包的类型提示中推断出来：

```php
Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->hasJobs([
        fn (ProcessCsvRow $job) => $job->row === 1,
        fn (ProcessCsvRow $job) => $job->row === 2,
        fn (ProcessCsvRow $job) => $job->row === 3,
    ]);
});
```

你可以使用 `assertBatchCount` 方法断言分发了给定数量的批次：

```php
Bus::assertBatchCount(3);
```

你可以使用 `assertNothingBatched` 断言没有分发任何批次：

```php
Bus::assertNothingBatched();
```

#### 测试任务 / 批次交互

此外，你偶尔可能需要测试单个任务与其底层批次的交互。例如，你可能需要测试任务是否为其批次取消了进一步处理。要实现这一点，你需要通过 `withFakeBatch` 方法为任务分配一个伪造的批次。`withFakeBatch` 方法返回一个包含任务实例和伪造批次的元组：

```php
[$job, $batch] = (new ShipOrder)->withFakeBatch();

$job->handle();

$this->assertTrue($batch->cancelled());
$this->assertEmpty($batch->added);
```

### 测试任务 / 队列交互

有时，你可能需要测试队列任务 将其自身释放回队列。或者，你可能需要测试任务删除了自身。你可以通过实例化任务并调用 `withFakeQueueInteractions` 方法来测试这些队列交互。

一旦任务的队列交互被伪造，你就可以在任务上调用 `handle` 方法。调用任务后，可以使用各种断言方法来验证任务的队列交互：

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

## 任务事件

使用 `Queue` [门面](/topic/Laravel%2013.x/569x508yep.html) 上的 `before` 和 `after` 方法，你可以指定在队列任务处理之前或之后执行的回调。这些回调是执行额外日志记录或为仪表盘增加统计数据的绝佳机会。通常，你应该从 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用这些方法。例如，我们可以使用 Laravel 附带的 `AppServiceProvider`：

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
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
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

使用 `Queue` [门面](/topic/Laravel%2013.x/569x508yep.html) 上的 `looping` 方法，你可以指定在工作进程尝试从队列获取任务之前执行的回调。例如，你可能会注册一个闭包来回滚先前失败任务遗留的任何打开事务：

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

Queue::looping(function () {
    while (DB::transactionLevel() > 0) {
        DB::rollBack();
    }
});
```

当队列工作进程无法从队列中检索到任务时，Laravel 还会分发一个 `Illuminate\Queue\Events\WorkerIdle` 事件：

```php
use Illuminate\Queue\Events\WorkerIdle;
use Illuminate\Support\Facades\Event;

Event::listen(function (WorkerIdle $event) {
    // $event->connectionName
    // $event->queue
    // $event->workerOptions
});
```