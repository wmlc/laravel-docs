# 队列

- [简介](#introduction)
    - [连接与队列](#connections-vs-queues)
    - [驱动说明与前提条件](#driver-prerequisites)
- [创建作业](#creating-jobs)
    - [生成作业类](#generating-job-classes)
    - [类结构](#class-structure)
    - [唯一作业](#unique-jobs)
- [作业中间件](#job-middleware)
    - [速率限制](#rate-limiting)
    - [防止作业重叠](#preventing-job-overlaps)
    - [异常节流](#throttling-exceptions)
- [分发作业](#dispatching-jobs)
    - [延迟分发](#delayed-dispatching)
    - [同步分发](#synchronous-dispatching)
    - [作业与数据库事务](#jobs-and-database-transactions)
    - [作业链](#job-chaining)
    - [自定义队列与连接](#customizing-the-queue-and-connection)
    - [指定最大作业尝试次数 / 超时值](#max-job-attempts-and-timeout)
    - [错误处理](#error-handling)
- [作业批处理](#job-batching)
    - [定义可批处理作业](#defining-batchable-jobs)
    - [分发批次](#dispatching-batches)
    - [向批次添加作业](#adding-jobs-to-batches)
    - [检查批次](#inspecting-batches)
    - [取消批次](#cancelling-batches)
    - [批次失败](#batch-failures)
    - [清理批次](#pruning-batches)
- [队列闭包](#queueing-closures)
- [运行队列工作进程](#running-the-queue-worker)
    - [`queue:work` 命令](#the-queue-work-command)
    - [队列优先级](#queue-priorities)
    - [队列工作进程与部署](#queue-workers-and-deployment)
    - [作业过期与超时](#job-expirations-and-timeouts)
- [Supervisor 配置](#supervisor-configuration)
- [处理失败作业](#dealing-with-failed-jobs)
    - [失败作业后清理](#cleaning-up-after-failed-jobs)
    - [重试失败作业](#retrying-failed-jobs)
    - [忽略缺失模型](#ignoring-missing-models)
    - [清理失败作业](#pruning-failed-jobs)
    - [在 DynamoDB 中存储失败作业](#storing-failed-jobs-in-dynamodb)
    - [禁用失败作业存储](#disabling-failed-job-storage)
    - [失败作业事件](#failed-job-events)
- [从队列清除作业](#clearing-jobs-from-queues)
- [监控队列](#monitoring-your-queues)
- [作业事件](#job-events)

<a name="introduction"></a>
## 简介

构建 Web 应用程序时，你可能有一些任务（例如解析和存储上传的 CSV 文件）在典型 Web 请求期间执行时间过长。幸好，Laravel 允许你轻松创建可在后台处理的排队作业。通过将耗时任务移至队列，你的应用程序可以极速响应 Web 请求，并为客户提供更好的用户体验。

Laravel 队列在各种不同的队列后端（如 [Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 甚至关系数据库）之间提供统一的队列 API。

Laravel 的队列配置选项存储在应用程序的 `config/queue.php` 配置文件中。在此文件中，你会找到框架包含的每个队列驱动的连接配置，包括数据库、[Amazon SQS](https://aws.amazon.com/sqs/)、[Redis](https://redis.io) 和 [Beanstalkd](https://beanstalkd.github.io/) 驱动，以及将在本地开发期间使用的同步驱动（立即执行作业）。还包含一个 `null` 队列驱动，用于丢弃排队作业。

> **Note**  
> Laravel 现在提供 Horizon，一个用于 Redis 驱动队列的精美仪表盘和配置系统。查看完整的 [Horizon 文档](/docs/{{version}}/horizon)了解更多信息。

<a name="connections-vs-queues"></a>
### 连接与队列

开始使用 Laravel 队列之前，理解"连接"和"队列"之间的区别很重要。在 `config/queue.php` 配置文件中，有一个 `connections` 配置数组。此选项定义了到后端队列服务（如 Amazon SQS、Beanstalk 或 Redis）的连接。但是，任何给定的队列连接都可以有多个"队列"，可以将其视为不同的排队作业堆栈或堆。

注意，`queue` 配置文件中的每个连接配置示例都包含一个 `queue` 属性。这是作业发送到给定连接时分发到的默认队列。换句话说，如果你分发作业而未明确定义应分发到哪个队列，作业将被放置在连接配置的 `queue` 属性定义的队列上：

```php
use App\Jobs\ProcessPodcast;

// 此作业发送到默认连接的默认队列...
ProcessPodcast::dispatch();

// 此作业发送到默认连接的 "emails" 队列...
ProcessPodcast::dispatch()->onQueue('emails');
```

某些应用程序可能永远不需要将作业推送到多个队列，而是偏好使用一个简单队列。但是，将作业推送到多个队列对于希望优先处理或分段处理作业的应用程序特别有用，因为 Laravel 队列工作进程允许你指定应按优先级处理哪些队列。例如，如果你将作业推送到 `high` 队列，你可以运行一个给予它们更高处理优先级的工作进程：

```shell
php artisan queue:work --queue=high,default
```

<a name="driver-prerequisites"></a>
### 驱动说明与前提条件

<a name="database"></a>
#### 数据库

要使用 `database` 队列驱动，你需要一个数据库表来保存作业。要生成创建此表的迁移，运行 `queue:table` Artisan 命令。创建迁移后，你可以使用 `migrate` 命令迁移数据库：

```shell
php artisan queue:table

php artisan migrate
```

最后，不要忘记通过更新应用程序 `.env` 文件中的 `QUEUE_CONNECTION` 变量来指示应用程序使用 `database` 驱动：

```env
QUEUE_CONNECTION=database
```

<a name="redis"></a>
#### Redis

要使用 `redis` 队列驱动，你应在 `config/database.php` 配置文件中配置 Redis 数据库连接。

**Redis 集群**

如果你的 Redis 队列连接使用 Redis 集群，你的队列名称必须包含 [键哈希标签](https://redis.io/docs/reference/cluster-spec/#hash-tags)。这是为了确保给定队列的所有 Redis 键放置在同一个哈希槽中：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => '{default}',
    'retry_after' => 90,
],
```

**阻塞**

使用 Redis 队列时，你可以使用 `block_for` 配置选项指定驱动在遍历工作进程循环并重新轮询 Redis 数据库之前应等待作业变为可用的时间。

根据队列负载调整此值可能比持续轮询 Redis 数据库以获取新作业更高效。例如，你可以将值设置为 `5`，表示驱动在等待作业变为可用时应阻塞五秒：

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => 'default',
    'retry_after' => 90,
    'block_for' => 5,
],
```

> **Warning**  
> 将 `block_for` 设置为 `0` 将导致队列工作进程无限阻塞直到作业可用。这还将阻止 `SIGTERM` 等信号在处理下一个作业之前被处理。

<a name="other-driver-prerequisites"></a>
#### 其他驱动前提条件

列出的队列驱动需要以下依赖。这些依赖可以通过 Composer 包管理器安装：

- Amazon SQS: `aws/aws-sdk-php ~3.0`
- Beanstalkd: `pda/pheanstalk ~4.0`
- Redis: `predis/predis ~1.0` 或 phpredis PHP 扩展

<a name="creating-jobs"></a>
## 创建作业

<a name="generating-job-classes"></a>
### 生成作业类

默认情况下，应用程序的所有可排队作业存储在 `app/Jobs` 目录中。如果 `app/Jobs` 目录不存在，运行 `make:job` Artisan 命令时将创建它：

```shell
php artisan make:job ProcessPodcast
```

生成的类将实现 `Illuminate\Contracts\Queue\ShouldQueue` 接口，向 Laravel 指示应将作业推送到队列以异步运行。

> **Note**  
> 可以使用 [stub 发布](/docs/{{version}}/artisan#stub-customization)来自定义作业 stub。

<a name="class-structure"></a>
### 类结构

作业类非常简单，通常只包含一个在队列处理作业时调用的 `handle` 方法。首先，让我们看一个示例作业类。在此示例中，我们假设管理一个播客发布服务，需要在发布之前处理上传的播客文件：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 播客实例。
     *
     * @var \App\Models\Podcast
     */
    public $podcast;

    /**
     * 创建新的作业实例。
     *
     * @param  App\Models\Podcast  $podcast
     * @return void
     */
    public function __construct(Podcast $podcast)
    {
        $this->podcast = $podcast;
    }

    /**
     * 执行作业。
     *
     * @param  App\Services\AudioProcessor  $processor
     * @return void
     */
    public function handle(AudioProcessor $processor)
    {
        // 处理上传的播客...
    }
}
```

在此示例中，注意我们能够将 [Eloquent 模型](/docs/{{version}}/eloquent) 直接传递到排队作业的构造函数中。由于作业使用的 `SerializesModels` Trait，Eloquent 模型及其加载的关联将在作业处理时被优雅地序列化和反序列化。

如果你的排队作业在其构造函数中接受 Eloquent 模型，则只有模型的标识符将被序列化到队列上。当作业实际处理时，队列系统将自动从数据库重新检索完整的模型实例及其加载的关联。这种模型序列化方法允许向队列驱动发送更小的作业有效载荷。

<a name="handle-method-dependency-injection"></a>
#### `handle` 方法依赖注入

当队列处理作业时调用 `handle` 方法。注意我们可以在作业的 `handle` 方法上类型提示依赖。Laravel [服务容器](/docs/{{version}}/container) 自动注入这些依赖。

如果你想完全控制容器如何将依赖注入 `handle` 方法，可以使用容器的 `bindMethod` 方法。`bindMethod` 方法接受一个接收作业和容器的回调。在回调中，你可以按需调用 `handle` 方法。通常，你应从 `App\Providers\AppServiceProvider` [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法调用此方法：

```php
use App\Jobs\ProcessPodcast;
use App\Services\AudioProcessor;

$this->app->bindMethod([ProcessPodcast::class, 'handle'], function ($job, $app) {
    return $job->handle($app->make(AudioProcessor::class));
});
```

> **Warning**  
> 二进制数据（如原始图像内容）应在传递给排队作业之前通过 `base64_encode` 函数处理。否则，作业在放置到队列时可能无法正确序列化为 JSON。

<a name="handling-relationships"></a>
#### 排队关联

由于加载的关联也会被序列化，序列化的作业字符串有时会变得很大。为防止关联被序列化，你可以在设置属性值时对模型调用 `withoutRelations` 方法。此方法将返回不带加载关联的模型实例：

```php
/**
 * 创建新的作业实例。
 *
 * @param  \App\Models\Podcast  $podcast
 * @return void
 */
public function __construct(Podcast $podcast)
{
    $this->podcast = $podcast->withoutRelations();
}
```

此外，当作业被反序列化且模型关联从数据库重新检索时，它们将被完整检索。在作业排队过程中模型序列化之前应用的任何之前的关联约束在作业反序列化时不会被应用。因此，如果你希望使用给定关联的子集，应在排队作业中重新约束该关联。

<a name="unique-jobs"></a>
### 唯一作业

> **Warning**  
> 唯一作业需要支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。此外，唯一作业约束不适用于批次内的作业。

有时，你可能希望确保任何时刻只有一个特定作业实例在队列上。你可以通过在作业类上实现 `ShouldBeUnique` 接口来实现。此接口不要求你在类上定义任何额外方法：

```php
<?php

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUnique;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    ...
}
```

在上面的示例中，`UpdateSearchIndex` 作业是唯一的。因此，如果作业的另一个实例已在队列上且尚未完成处理，则不会分发该作业。

在某些情况下，你可能希望定义使作业唯一的特定"键"，或指定超时时间，超过此时间后作业不再保持唯一。为此，你可以在作业类上定义 `uniqueId` 和 `uniqueFor` 属性或方法：

```php
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
     * 作业唯一锁释放后的秒数。
     *
     * @var int
     */
    public $uniqueFor = 3600;

    /**
     * 作业的唯一 ID。
     *
     * @return string
     */
    public function uniqueId()
    {
        return $this->product->id;
    }
}
```

在上面的示例中，`UpdateSearchIndex` 作业按产品 ID 唯一。因此，在现有作业完成处理之前，具有相同产品 ID 的任何新作业分发都将被忽略。此外，如果现有作业在一小时内未处理，唯一锁将被释放，另一个具有相同唯一键的作业可以被分发到队列。

> **Warning**  
> 如果你的应用程序从多个 Web 服务器或容器分发作业，你应确保所有服务器都与同一个中央缓存服务器通信，以便 Laravel 能准确确定作业是否唯一。

<a name="keeping-jobs-unique-until-processing-begins"></a>
#### 在处理开始前保持作业唯一

默认情况下，唯一作业在作业完成处理或失败所有重试尝试后"解锁"。但是，在某些情况下，你可能希望作业在处理之前立即解锁。为此，你的作业应实现 `ShouldBeUniqueUntilProcessing` 契约而不是 `ShouldBeUnique` 契约：

```php
<?php

use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

<a name="unique-job-locks"></a>
#### 唯一作业锁

在幕后，当分发 `ShouldBeUnique` 作业时，Laravel 尝试使用 `uniqueId` 键获取[锁](/docs/{{version}}/cache#atomic-locks)。如果未获取锁，则不分发作业。当作业完成处理或失败所有重试尝试时释放此锁。默认情况下，Laravel 将使用默认缓存驱动获取此锁。但是，如果你希望使用另一个驱动获取锁，可以定义一个返回应使用的缓存驱动的 `uniqueVia` 方法：

```php
use Illuminate\Support\Facades\Cache;

class UpdateSearchIndex implements ShouldQueue, ShouldBeUnique
{
    ...

    /**
     * 获取唯一作业锁的缓存驱动。
     *
     * @return \Illuminate\Contracts\Cache\Repository
     */
    public function uniqueVia()
    {
        return Cache::driver('redis');
    }
}
```

> **Note**  
> 如果你只需要限制作业的并发处理，请改用 [`WithoutOverlapping`](/docs/{{version}}/queues#preventing-job-overlaps) 作业中间件。

<a name="job-middleware"></a>
## 作业中间件

作业中间件允许你在排队作业执行周围包装自定义逻辑，减少作业本身的样板代码。例如，考虑以下利用 Laravel Redis 速率限制功能允许每五秒只处理一个作业的 `handle` 方法：

```php
use Illuminate\Support\Facades\Redis;

/**
 * 执行作业。
 *
 * @return void
 */
public function handle()
{
    Redis::throttle('key')->block(0)->allow(1)->every(5)->then(function () {
        info('Lock obtained...');

        // 处理作业...
    }, function () {
        // 无法获取锁...

        return $this->release(5);
    });
}
```

虽然此代码有效，但 `handle` 方法的实现变得嘈杂，因为它充斥着 Redis 速率限制逻辑。此外，此速率限制逻辑必须为我们要进行速率限制的任何其他作业重复。

与其在 handle 方法中进行速率限制，我们可以定义一个处理速率限制的作业中间件。Laravel 没有作业中间件的默认位置，因此你可以将作业中间件放在应用程序中的任何位置。在此示例中，我们将中间件放在 `app/Jobs/Middleware` 目录中：

```php
<?php

namespace App\Jobs\Middleware;

use Illuminate\Support\Facades\Redis;

class RateLimited
{
    /**
     * 处理排队作业。
     *
     * @param  mixed  $job
     * @param  callable  $next
     * @return mixed
     */
    public function handle($job, $next)
    {
        Redis::throttle('key')
                ->block(0)->allow(1)->every(5)
                ->then(function () use ($job, $next) {
                    // 获取锁...

                    $next($job);
                }, function () use ($job) {
                    // 无法获取锁...

                    $job->release(5);
                });
    }
}
```

如你所见，与[路由中间件](/docs/{{version}}/middleware)一样，作业中间件接收正在处理的作业和应调用以继续处理作业的回调。

创建作业中间件后，可以通过从作业的 `middleware` 方法返回它们来将其附加到作业。此方法不存在于 `make:job` Artisan 命令搭建的作业上，因此你需要手动将其添加到作业类：

```php
use App\Jobs\Middleware\RateLimited;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [new RateLimited];
}
```

> **Note**  
> 作业中间件也可分配给可排队的事件监听器、mailable 和通知。

<a name="rate-limiting"></a>
### 速率限制

虽然我们刚刚演示了如何编写自己的速率限制作业中间件，但 Laravel 实际上包含了一个可用于速率限制作业的速率限制中间件。与[路由速率限制器](/docs/{{version}}/routing#defining-rate-limiters)一样，作业速率限制器使用 `RateLimiter` Facade 的 `for` 方法定义。

例如，你可能希望允许用户每小时备份数据一次，而对高级客户不施加此限制。为此，你可以在 `AppServiceProvider` 的 `boot` 方法中定义 `RateLimiter`：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导启动任何应用程序服务。
 *
 * @return void
 */
public function boot()
{
    RateLimiter::for('backups', function ($job) {
        return $job->user->vipCustomer()
                    ? Limit::none()
                    : Limit::perHour(1)->by($job->user->id);
    });
}
```

在上面的示例中，我们定义了每小时速率限制；但是，你可以使用 `perMinute` 方法轻松定义基于分钟的速率限制。此外，你可以向速率限制的 `by` 方法传递任何你希望的值；但是，此值最常用于按客户分段速率限制：

```php
return Limit::perMinute(50)->by($job->user->id);
```

定义速率限制后，你可以使用 `Illuminate\Queue\Middleware\RateLimited` 中间件将速率限制器附加到备份作业。每次作业超过速率限制时，此中间件将根据速率限制持续时间以适当的延迟将作业释放回队列。

```php
use Illuminate\Queue\Middleware\RateLimited;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [new RateLimited('backups')];
}
```

将速率限制作业释放回队列仍将增加作业的 `attempts` 总数。你可能需要相应地调整作业类上的 `tries` 和 `maxExceptions` 属性。或者，你可能希望使用 [`retryUntil` 方法](#time-based-attempts)定义作业不再尝试的时间。

如果你不希望作业在速率限制时重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new RateLimited('backups'))->dontRelease()];
}
```

> **Note**  
> 如果你使用 Redis，可以使用 `Illuminate\Queue\Middleware\RateLimitedWithRedis` 中间件，它针对 Redis 进行了微调，比基本速率限制中间件更高效。

<a name="preventing-job-overlaps"></a>
### 防止作业重叠

Laravel 包含一个 `Illuminate\Queue\Middleware\WithoutOverlapping` 中间件，允许你基于任意键防止作业重叠。当排队作业修改只应由一个作业同时修改的资源时，这很有用。

例如，假设你有一个更新用户信用评分的排队作业，你希望防止同一用户 ID 的信用评分更新作业重叠。为此，你可以从作业的 `middleware` 方法返回 `WithoutOverlapping` 中间件：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [new WithoutOverlapping($this->user->id)];
}
```

任何同类型的重叠作业将被释放回队列。你还可以指定释放的作业再次尝试之前必须经过的秒数：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new WithoutOverlapping($this->order->id))->releaseAfter(60)];
}
```

如果你希望立即删除任何重叠作业以便它们不会重试，可以使用 `dontRelease` 方法：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new WithoutOverlapping($this->order->id))->dontRelease()];
}
```

`WithoutOverlapping` 中间件由 Laravel 的原子锁功能驱动。有时，你的作业可能以锁未释放的方式意外失败或超时。因此，你可以使用 `expireAfter` 方法显式定义锁过期时间。例如，以下示例将指示 Laravel 在作业开始处理三分钟后释放 `WithoutOverlapping` 锁：

```php
/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new WithoutOverlapping($this->order->id))->expireAfter(180)];
}
```

> **Warning**
> `WithoutOverlapping` 中间件需要支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

<a name="sharing-lock-keys"></a>
#### 跨作业类共享锁键

默认情况下，`WithoutOverlapping` 中间件仅防止同一类的重叠作业。因此，虽然两个不同的作业类可能使用相同的锁键，但不会阻止它们重叠。但是，你可以使用 `shared` 方法指示 Laravel 跨作业类应用键：

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ProviderIsDown
{
    // ...

    public function middleware()
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}

class ProviderIsUp
{
    // ...

    public function middleware()
    {
        return [
            (new WithoutOverlapping("status:{$this->provider}"))->shared(),
        ];
    }
}
```

<a name="throttling-exceptions"></a>
### 异常节流

Laravel 包含一个 `Illuminate\Queue\Middleware\ThrottlesExceptions` 中间件，允许你对异常进行节流。一旦作业抛出给定数量的异常，所有进一步执行作业的尝试将延迟直到指定时间间隔过去。此中间件对于与不稳定的第三方服务交互的作业特别有用。

例如，假设一个与第三方 API 交互的排队作业开始抛出异常。要节流异常，你可以从作业的 `middleware` 方法返回 `ThrottlesExceptions` 中间件。通常，此中间件应与实现[基于时间的尝试](#time-based-attempts)的作业配对：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [new ThrottlesExceptions(10, 5)];
}

/**
 * 确定作业应超时的时间。
 *
 * @return \DateTime
 */
public function retryUntil()
{
    return now()->addMinutes(5);
}
```

中间件接受的第一个构造函数参数是作业在被节流之前可以抛出的异常数量，第二个构造函数参数是作业被节流后再次尝试之前应经过的分钟数。在上面的代码示例中，如果作业在 5 分钟内抛出 10 个异常，我们将在再次尝试作业之前等待 5 分钟。

当作业抛出异常但尚未达到异常阈值时，作业通常会立即重试。但是，你可以通过在将中间件附加到作业时调用 `backoff` 方法来指定此类作业应延迟的分钟数：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new ThrottlesExceptions(10, 5))->backoff(5)];
}
```

在内部，此中间件使用 Laravel 的缓存系统实现速率限制，作业的类名用作缓存"键"。你可以通过在将中间件附加到作业时调用 `by` 方法来覆盖此键。如果你有多个与同一第三方服务交互的作业并且希望它们共享一个公共节流"桶"，这可能很有用：

```php
use Illuminate\Queue\Middleware\ThrottlesExceptions;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [(new ThrottlesExceptions(10, 10))->by('key')];
}
```

> **Note**  
> 如果你使用 Redis，可以使用 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 中间件，它针对 Redis 进行了微调，比基本异常节流中间件更高效。

<a name="dispatching-jobs"></a>
## 分发作业

编写作业类后，你可以使用作业本身的 `dispatch` 方法分发它。传递给 `dispatch` 方法的参数将传递给作业的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储新播客。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast);
    }
}
```

如果你希望有条件地分发作业，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
ProcessPodcast::dispatchIf($accountActive, $podcast);

ProcessPodcast::dispatchUnless($accountSuspended, $podcast);
```

在新的 Laravel 应用程序中，`sync` 驱动是默认队列驱动。此驱动在当前请求的前台同步执行作业，这在本地开发期间通常很方便。如果你希望实际开始排队作业进行后台处理，可以在应用程序的 `config/queue.php` 配置文件中指定不同的队列驱动。

<a name="delayed-dispatching"></a>
### 延迟分发

如果你想指定作业不应立即可供队列工作进程处理，可以在分发作业时使用 `delay` 方法。例如，让我们指定作业在分发 10 分钟后才可供处理：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储新播客。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $podcast = Podcast::create(/* ... */);

        // ...

        ProcessPodcast::dispatch($podcast)
                    ->delay(now()->addMinutes(10));
    }
}
```

> **Warning**  
> Amazon SQS 队列服务的最大延迟时间为 15 分钟。

<a name="dispatching-after-the-response-is-sent-to-browser"></a>
#### 在响应发送到浏览器后分发

或者，如果你的 Web 服务器使用 FastCGI，`dispatchAfterResponse` 方法会延迟分发作业直到 HTTP 响应发送到用户浏览器之后。这仍将允许用户开始使用应用程序，即使排队作业仍在执行。这通常只应用于耗时约一秒的作业，例如发送电子邮件。由于它们在当前 HTTP 请求内处理，以此方式分发的作业不需要运行队列工作进程即可处理：

```php
use App\Jobs\SendNotification;

SendNotification::dispatchAfterResponse();
```

你也可以 `dispatch` 一个闭包并将 `afterResponse` 方法链式连接到 `dispatch` 辅助函数，以在 HTTP 响应发送到浏览器后执行闭包：

```php
use App\Mail\WelcomeMessage;
use Illuminate\Support\Facades\Mail;

dispatch(function () {
    Mail::to('taylor@example.com')->send(new WelcomeMessage);
})->afterResponse();
```

<a name="synchronous-dispatching"></a>
### 同步分发

如果你想立即（同步）分发作业，可以使用 `dispatchSync` 方法。使用此方法时，作业不会被排队，将在当前进程内立即执行：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储新播客。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatchSync($podcast);
    }
}
```

<a name="jobs-and-database-transactions"></a>
### 作业与数据库事务

虽然在数据库事务内分发作业完全没问题，但你应特别注意确保作业能够成功执行。在事务内分发作业时，作业可能在父事务提交之前被工作进程处理。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务内创建的任何模型或数据库记录可能不存在于数据库中。

幸好，Laravel 提供了几种解决此问题的方法。首先，你可以在队列连接的配置数组中设置 `after_commit` 连接选项：

```php
'redis' => [
    'driver' => 'redis',
    // ...
    'after_commit' => true,
],
```

当 `after_commit` 选项为 `true` 时，你可以在数据库事务内分发作业；但是，Laravel 将等待直到打开的父数据库事务提交后才实际分发作业。当然，如果当前没有打开的数据库事务，作业将立即分发。

如果事务由于事务期间发生的异常而回滚，则在事务期间分发的作业将被丢弃。

> **Note**  
> 将 `after_commit` 配置选项设置为 `true` 还将导致任何排队的事件监听器、mailable、通知和广播事件在所有打开的数据库事务提交后分发。

<a name="specifying-commit-dispatch-behavior-inline"></a>
#### 内联指定提交分发行为

如果你未将 `after_commit` 队列连接配置选项设置为 `true`，你仍可以指示特定作业应在所有打开的数据库事务提交后分发。为此，你可以将 `afterCommit` 方法链式连接到分发操作：

```php
use App\Jobs\ProcessPodcast;

ProcessPodcast::dispatch($podcast)->afterCommit();
```

同样，如果 `after_commit` 配置选项设置为 `true`，你可以指示特定作业应立即分发而不等待任何打开的数据库事务提交：

```php
ProcessPodcast::dispatch($podcast)->beforeCommit();
```

<a name="job-chaining"></a>
### 作业链

作业链允许你指定一列排队作业，在主作业成功执行后按顺序运行。如果序列中的一个作业失败，其余作业将不会运行。要执行排队作业链，可以使用 `Bus` Facade 提供的 `chain` 方法。Laravel 的命令总线是排队作业分发所基于的较低层组件：

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

除了链式作业类实例外，你还可以链式闭包：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    function () {
        Podcast::update(/* ... */);
    },
])->dispatch();
```

> **Warning**  
> 在作业内使用 `$this->delete()` 方法删除作业不会阻止链式作业被处理。链只有在链中的作业失败时才会停止执行。

<a name="chain-connection-queue"></a>
#### 链连接与队列

如果你想指定链式作业应使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。这些方法指定应使用的队列连接和队列名称，除非排队作业被显式分配了不同的连接/队列：

```php
Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->onConnection('redis')->onQueue('podcasts')->dispatch();
```

<a name="chain-failures"></a>
#### 链失败

链式作业时，你可以使用 `catch` 方法指定在链中的作业失败时应调用的闭包。给定的回调将接收导致作业失败的 `Throwable` 实例：

```php
use Illuminate\Support\Facades\Bus;
use Throwable;

Bus::chain([
    new ProcessPodcast,
    new OptimizePodcast,
    new ReleasePodcast,
])->catch(function (Throwable $e) {
    // 链中的作业已失败...
})->dispatch();
```

> **Warning**  
> 由于链回调被序列化并在稍后由 Laravel 队列执行，你不应在链回调内使用 `$this` 变量。

<a name="customizing-the-queue-and-connection"></a>
### 自定义队列与连接

<a name="dispatching-to-a-particular-queue"></a>
#### 分发到特定队列

通过将作业推送到不同队列，你可以"分类"排队作业，甚至优先处理分配给各种队列的工作进程数量。请记住，这不会将作业推送到队列配置文件定义的不同队列"连接"，而是推送到单个连接内的特定队列。要指定队列，在分发作业时使用 `onQueue` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储新播客。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onQueue('processing');
    }
}
```

或者，你可以通过在作业的构造函数内调用 `onQueue` 方法来指定作业的队列：

```php
<?php

namespace App\Jobs;

 use Illuminate\Bus\Queueable;
 use Illuminate\Contracts\Queue\ShouldQueue;
 use Illuminate\Foundation\Bus\Dispatchable;
 use Illuminate\Queue\InteractsWithQueue;
 use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 创建新的作业实例。
     *
     * @return void
     */
    public function __construct()
    {
        $this->onQueue('processing');
    }
}
```

<a name="dispatching-to-a-particular-connection"></a>
#### 分发到特定连接

如果你的应用程序与多个队列连接交互，可以使用 `onConnection` 方法指定将作业推送到哪个连接：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Http\Request;

class PodcastController extends Controller
{
    /**
     * 存储新播客。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $podcast = Podcast::create(/* ... */);

        // 创建播客...

        ProcessPodcast::dispatch($podcast)->onConnection('sqs');
    }
}
```

你可以将 `onConnection` 和 `onQueue` 方法链式连接以指定作业的连接和队列：

```php
ProcessPodcast::dispatch($podcast)
              ->onConnection('sqs')
              ->onQueue('processing');
```

或者，你可以通过在作业的构造函数内调用 `onConnection` 方法来指定作业的连接：

```php
<?php

namespace App\Jobs;

 use Illuminate\Bus\Queueable;
 use Illuminate\Contracts\Queue\ShouldQueue;
 use Illuminate\Foundation\Bus\Dispatchable;
 use Illuminate\Queue\InteractsWithQueue;
 use Illuminate\Queue\SerializesModels;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 创建新的作业实例。
     *
     * @return void
     */
    public function __construct()
    {
        $this->onConnection('sqs');
    }
}
```

<a name="max-job-attempts-and-timeout"></a>
### 指定最大作业尝试次数 / 超时值

<a name="max-attempts"></a>
#### 最大尝试次数

如果你的排队作业遇到错误，你可能不希望它无限重试。因此，Laravel 提供了多种方式来指定作业可尝试的次数或时长。

指定作业可尝试最大次数的一种方法是通过 Artisan 命令行上的 `--tries` 开关。这将应用于工作进程处理的所有作业，除非正在处理的作业指定了可尝试的次数：

```shell
php artisan queue:work --tries=3
```

如果作业超过其最大尝试次数，它将被视为"失败"作业。有关处理失败作业的更多信息，请查阅[失败作业文档](#dealing-with-failed-jobs)。如果向 `queue:work` 命令提供 `--tries=0`，作业将无限重试。

你可以通过在作业类本身上定义可尝试的最大次数来采取更细粒度的方法。如果作业上指定了最大尝试次数，它将优先于命令行上提供的 `--tries` 值：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业可尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

<a name="time-based-attempts"></a>
#### 基于时间的尝试

作为定义作业失败前可尝试次数的替代方案，你可以定义作业不再尝试的时间。这允许作业在给定时间范围内尝试任意次数。要定义作业不再尝试的时间，向作业类添加 `retryUntil` 方法。此方法应返回 `DateTime` 实例：

```php
/**
 * 确定作业应超时的时间。
 *
 * @return \DateTime
 */
public function retryUntil()
{
    return now()->addMinutes(10);
}
```

> **Note**  
> 你还可以在[排队的事件监听器](/docs/{{version}}/events#queued-event-listeners)上定义 `tries` 属性或 `retryUntil` 方法。

<a name="max-exceptions"></a>
#### 最大异常

有时你可能希望指定作业可以尝试多次，;但如果重试由给定数量的未处理异常触发（而不是由 `release` 方法直接释放），则应失败。为此，你可以在作业类上定义 `maxExceptions` 属性：

```php
<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Redis;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业可尝试的次数。
     *
     * @var int
     */
    public $tries = 25;

    /**
     * 失败前允许的最大未处理异常数。
     *
     * @var int
     */
    public $maxExceptions = 3;

    /**
     * 执行作业。
     *
     * @return void
     */
    public function handle()
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

在此示例中，如果应用程序无法获取 Redis 锁，作业将被释放十秒并继续重试最多 25 次。但是，如果作业抛出三个未处理异常，作业将失败。

<a name="timeout"></a>
#### 超时

> **Warning**  
> 必须安装 `pcntl` PHP 扩展才能指定作业超时。

通常，你大致知道排队作业预期需要多长时间。因此，Laravel 允许你指定"超时"值。默认情况下，超时值为 60 秒。如果作业处理时间超过超时值指定的秒数，处理作业的工作进程将出错退出。通常，工作进程将由[服务器上配置的进程管理器](#supervisor-configuration)自动重启。

作业可运行的最大秒数可以使用 Artisan 命令行上的 `--timeout` 开关指定：

```shell
php artisan queue:work --timeout=30
```

如果作业因持续超时而超过其最大尝试次数，它将被标记为失败。

你还可以在作业类本身上定义作业允许运行的最大秒数。如果作业上指定了超时，它将优先于命令行上指定的任何超时：

```php
<?php

namespace App\Jobs;

class ProcessPodcast implements ShouldQueue
{
    /**
     * 作业超时前可运行的秒数。
     *
     * @var int
     */
    public $timeout = 120;
}
```

有时，IO 阻塞进程（如套接字或传出 HTTP 连接）可能不遵守你指定的超时。因此，使用这些功能时，你应始终尝试使用其 API 指定超时。例如，使用 Guzzle 时，你应始终指定连接和请求超时值。

<a name="failing-on-timeout"></a>
#### 超时时失败

如果你想指示作业在超时时应被标记为[失败](#dealing-with-failed-jobs)，可以在作业类上定义 `$failOnTimeout` 属性：

```php
/**
 * 指示作业是否应在超时时标记为失败。
 *
 * @var bool
 */
public $failOnTimeout = true;
```

<a name="error-handling"></a>
### 错误处理

如果作业处理期间抛出异常，作业将自动释放回队列以便可以再次尝试。作业将继续释放，直到已尝试应用程序允许的最大次数。最大尝试次数由 `queue:work` Artisan 命令上使用的 `--tries` 开关定义。或者，最大尝试次数可以在作业类本身上定义。有关运行队列工作进程的更多信息[可在下面找到](#running-the-queue-worker)。

<a name="manually-releasing-a-job"></a>
#### 手动释放作业

有时你可能希望手动将作业释放回队列，以便可以在稍后再次尝试。你可以通过调用 `release` 方法来实现：

```php
/**
 * 执行作业。
 *
 * @return void
 */
public function handle()
{
    // ...

    $this->release();
}
```

默认情况下，`release` 方法将作业释放回队列以立即处理。但是，通过向 `release` 方法传递整数，你可以指示队列在给定秒数过去之前不使作业可供处理：

```php
$this->release(10);
```

<a name="manually-failing-a-job"></a>
#### 手动使作业失败

有时你可能需要手动将作业标记为"失败"。为此，你可以调用 `fail` 方法：

```php
/**
 * 执行作业。
 *
 * @return void
 */
public function handle()
{
    // ...

    $this->fail();
}
```

如果你想因为你捕获的异常而将作业标记为失败，可以将异常传递给 `fail` 方法。或者，为方便起见，你可以传递字符串错误消息，它将为你转换为异常：

```php
$this->fail($exception);

$this->fail('Something went wrong.');
```

> **Note**  
> 有关失败作业的更多信息，请查阅[有关处理作业失败的文档](#dealing-with-failed-jobs)。

<a name="job-batching"></a>
## 作业批处理

Laravel 的作业批处理功能允许你轻松执行一批作业，然后在这批作业完成执行时执行某些操作。开始之前，你应创建数据库迁移以构建一个表来包含有关作业批次的元信息（如完成百分比）。此迁移可以使用 `queue:batches-table` Artisan 命令生成：

```shell
php artisan queue:batches-table

php artisan migrate
```

<a name="defining-batchable-jobs"></a>
### 定义可批处理作业

要定义可批处理作业，你应像通常一样[创建可排队作业](#creating-jobs)；但是，你应将 `Illuminate\Bus\Batchable` Trait 添加到作业类。此 Trait 提供对 `batch` 方法的访问，可用于检索作业执行所在的当前批次：

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ImportCsv implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 执行作业。
     *
     * @return void
     */
    public function handle()
    {
        if ($this->batch()->cancelled()) {
            // 确定批次是否已取消...

            return;
        }

        // 导入 CSV 文件的一部分...
    }
}
```

<a name="dispatching-batches"></a>
### 分发批次

要分发一批作业，你应使用 `Bus` Facade 的 `batch` 方法。当然，批处理在与完成回调结合时最有用。因此，你可以使用 `then`、`catch` 和 `finally` 方法为批次定义完成回调。这些回调在被调用时都将接收 `Illuminate\Bus\Batch` 实例。在此示例中，我们将想象排队一批作业，每个作业处理 CSV 文件中给定数量的行：

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
])->then(function (Batch $batch) {
    // 所有作业成功完成...
})->catch(function (Batch $batch, Throwable $e) {
    // 检测到第一个批次作业失败...
})->finally(function (Batch $batch) {
    // 批次已完成执行...
})->dispatch();

return $batch->id;
```

批次的 ID（可通过 `$batch->id` 属性访问）可用于在批次分发后[查询 Laravel 命令总线](#inspecting-batches)以获取有关批次的信息。

> **Warning**  
> 由于批次回调被序列化并在稍后由 Laravel 队列执行，你不应在回调内使用 `$this` 变量。

<a name="naming-batches"></a>
#### 命名批次

某些工具（如 Laravel Horizon 和 Laravel Telescope）如果批次已命名，可为批次提供更用户友好的调试信息。要为批次分配任意名称，你可以在定义批次时调用 `name` 方法：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业成功完成...
})->name('Import CSV')->dispatch();
```

<a name="batch-connection-queue"></a>
#### 批次连接与队列

如果你想指定批处理作业应使用的连接和队列，可以使用 `onConnection` 和 `onQueue` 方法。所有批处理作业必须在同一连接和队列内执行：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业成功完成...
})->onConnection('redis')->onQueue('imports')->dispatch();
```

<a name="chains-within-batches"></a>
#### 批次内的链

你可以通过将链式作业放在数组内来在批次内定义一组[链式作业](#job-chaining)。例如，我们可以并行执行两个作业链，并在两个作业链都完成处理时执行回调：

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
    // ...
})->dispatch();
```

<a name="adding-jobs-to-batches"></a>
### 向批次添加作业

有时从批处理作业内向批次添加额外作业可能很有用。当你需要批处理数千个可能在 Web 请求期间分发时间过长的作业时，此模式很有用。因此，相反，你可能希望分发一批初始"加载器"作业，用更多作业水合批次：

```php
$batch = Bus::batch([
    new LoadImportBatch,
    new LoadImportBatch,
    new LoadImportBatch,
])->then(function (Batch $batch) {
    // 所有作业成功完成...
})->name('Import Contacts')->dispatch();
```

在此示例中，我们将使用 `LoadImportBatch` 作业用额外作业水合批次。为此，我们可以使用可通过作业的 `batch` 方法访问的批次实例上的 `add` 方法：

```php
use App\Jobs\ImportContacts;
use Illuminate\Support\Collection;

/**
 * 执行作业。
 *
 * @return void
 */
public function handle()
{
    if ($this->batch()->cancelled()) {
        return;
    }

    $this->batch()->add(Collection::times(1000, function () {
        return new ImportContacts;
    }));
}
```

> **Warning**  
> 你只能从属于同一批次的作业内向批次添加作业。

<a name="inspecting-batches"></a>
### 检查批次

提供给批次完成回调的 `Illuminate\Bus\Batch` 实例具有各种属性和方法来帮助你交互和检查给定的作业批次：

```php
// 批次的 UUID...
$batch->id;

// 批次的名称（如果适用）...
$batch->name;

// 分配给批次的作业数...
$batch->totalJobs;

// 队列尚未处理的作业数...
$batch->pendingJobs;

// 已失败的作业数...
$batch->failedJobs;

// 迄今已处理的作业数...
$batch->processedJobs();

// 批次的完成百分比 (0-100)...
$batch->progress();

// 指示批次是否已完成执行...
$batch->finished();

// 取消批次的执行...
$batch->cancel();

// 指示批次是否已取消...
$batch->cancelled();
```

<a name="returning-batches-from-routes"></a>
#### 从路由返回批次

所有 `Illuminate\Bus\Batch` 实例都是 JSON 可序列化的，这意味着你可以直接从应用程序的路由之一返回它们以检索包含有关批次信息的 JSON 有效载荷，包括其完成进度。这使得在应用程序 UI 中显示有关批次完成进度的信息变得方便。

要通过 ID 检索批次，你可以使用 `Bus` Facade 的 `findBatch` 方法：

```php
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Route;

Route::get('/batch/{batchId}', function (string $batchId) {
    return Bus::findBatch($batchId);
});
```

<a name="cancelling-batches"></a>
### 取消批次

有时你可能需要取消给定批次的执行。这可以通过调用 `Illuminate\Bus\Batch` 实例上的 `cancel` 方法来实现：

```php
/**
 * 执行作业。
 *
 * @return void
 */
public function handle()
{
    if ($this->user->exceedsImportLimit()) {
        return $this->batch()->cancel();
    }

    if ($this->batch()->cancelled()) {
        return;
    }
}
```

正如你在之前的示例中可能注意到的，批处理作业通常应在继续执行之前确定其相应批次是否已取消。但是，为方便起见，你可以将 `SkipIfBatchCancelled` [中间件](#job-middleware) 分配给作业。如其名所示，此中间件将指示 Laravel 如果其相应批次已取消则不处理作业：

```php
use Illuminate\Queue\Middleware\SkipIfBatchCancelled;

/**
 * 获取作业应通过的中间件。
 *
 * @return array
 */
public function middleware()
{
    return [new SkipIfBatchCancelled];
}
```

<a name="batch-failures"></a>
### 批次失败

当批处理作业失败时，将调用 `catch` 回调（如果已分配）。此回调仅对批次内第一个失败的作业调用。

<a name="allowing-failures"></a>
#### 允许失败

当批次内的作业失败时，Laravel 将自动将批次标记为"已取消"。如果你希望，可以禁用此行为，以便作业失败不会自动将批次标记为已取消。这可以通过在分发批次时调用 `allowFailures` 方法来实现：

```php
$batch = Bus::batch([
    // ...
])->then(function (Batch $batch) {
    // 所有作业成功完成...
})->allowFailures()->dispatch();
```

<a name="retrying-failed-batch-jobs"></a>
#### 重试失败的批次作业

为方便起见，Laravel 提供了一个 `queue:retry-batch` Artisan 命令，允许你轻松重试给定批次的所有失败作业。`queue:retry-batch` 命令接受应重试其失败作业的批次的 UUID：

```shell
php artisan queue:retry-batch 32dbc76c-4f82-4749-b610-a639fe0099b5
```

<a name="pruning-batches"></a>
### 清理批次

如果不进行清理，`job_batches` 表会非常快速地累积记录。为缓解此问题，你应该[调度](/docs/{{version}}/scheduling) `queue:prune-batches` Artisan 命令每日运行：

```php
$schedule->command('queue:prune-batches')->daily();
```

默认情况下，所有超过 24 小时的已完成批次将被清理。你可以在调用命令时使用 `hours` 选项来确定保留批次数据的时间。例如，以下命令将删除所有超过 48 小时前完成的批次：

```php
$schedule->command('queue:prune-batches --hours=48')->daily();
```

有时，你的 `jobs_batches` 表可能为从未成功完成的批次累积批次记录，例如作业失败且该作业从未成功重试的批次。你可以使用 `unfinished` 选项指示 `queue:prune-batches` 命令清理这些未完成的批次记录：

```php
$schedule->command('queue:prune-batches --hours=48 --unfinished=72')->daily();
```

同样，你的 `jobs_batches` 表也可能为已取消的批次累积批次记录。你可以使用 `cancelled` 选项指示 `queue:prune-batches` 命令清理这些已取消的批次记录：

```php
$schedule->command('queue:prune-batches --hours=48 --cancelled=72')->daily();
```

<a name="queueing-closures"></a>
## 队列闭包

除了将作业类分发到队列外，你还可以分发闭包。这对于需要在当前请求周期之外执行的快速、简单任务很有用。将闭包分发到队列时，闭包的代码内容经过加密签名，因此无法在传输过程中修改：

```php
$podcast = App\Podcast::find(1);

dispatch(function () use ($podcast) {
    $podcast->publish();
});
```

使用 `catch` 方法，你可以提供一个在排队闭包在耗尽队列所有[配置的重试尝试](#max-job-attempts-and-timeout)后未能成功完成时应执行的闭包：

```php
use Throwable;

dispatch(function () use ($podcast) {
    $podcast->publish();
})->catch(function (Throwable $e) {
    // 此作业已失败...
});
```

> **Warning**  
> 由于 `catch` 回调被序列化并在稍后由 Laravel 队列执行，你不应在 `catch` 回调内使用 `$this` 变量。

<a name="running-the-queue-worker"></a>
## 运行队列工作进程

<a name="the-queue-work-command"></a>
### `queue:work` 命令

Laravel 包含一个 Artisan 命令，用于启动队列工作进程并在新作业推送到队列时处理它们。你可以使用 `queue:work` Artisan 命令运行工作进程。注意，一旦 `queue:work` 命令启动，它将持续运行直到手动停止或关闭终端：

```shell
php artisan queue:work
```

> **Note**  
> 要保持 `queue:work` 进程在后台永久运行，你应使用进程监视器（如 [Supervisor](#supervisor-configuration)）来确保队列工作进程不会停止运行。

如果你希望处理的作业 ID 包含在命令输出中，可以在调用 `queue:work` 命令时包含 `-v` 标志：

```shell
php artisan queue:work -v
```

请记住，队列工作进程是长生命周期进程，将引导启动的应用程序状态存储在内存中。因此，它们在启动后不会注意到代码库中的更改。因此，在部署过程中，请确保[重启队列工作进程](#queue-workers-and-deployment)。此外，请记住，应用程序创建或修改的任何静态状态不会在作业之间自动重置。

或者，你可以运行 `queue:listen` 命令。使用 `queue:listen` 命令时，当你想要重新加载更新的代码或重置应用程序状态时，无需手动重启工作进程；但是，此命令的效率明显低于 `queue:work` 命令：

```shell
php artisan queue:listen
```

<a name="running-multiple-queue-workers"></a>
#### 运行多个队列工作进程

要将多个工作进程分配给队列并并发处理作业，你只需启动多个 `queue:work` 进程。这可以在本地通过终端中的多个标签页完成，或在生产中通过进程管理器的配置设置完成。[使用 Supervisor 时](#supervisor-configuration)，你可以使用 `numprocs` 配置值。

<a name="specifying-the-connection-queue"></a>
#### 指定连接与队列

你还可以指定工作进程应使用哪个队列连接。传递给 `work` 命令的连接名称应对应于 `config/queue.php` 配置文件中定义的连接之一：

```shell
php artisan queue:work redis
```

默认情况下，`queue:work` 命令仅处理给定连接上默认队列的作业。但是，你可以通过仅处理给定连接的特定队列来进一步自定义队列工作进程。例如，如果所有电子邮件都在 `redis` 队列连接上的 `emails` 队列中处理，你可以发出以下命令来启动仅处理该队列的工作进程：

```shell
php artisan queue:work redis --queue=emails
```

<a name="processing-a-specified-number-of-jobs"></a>
#### 处理指定数量的作业

`--once` 选项可用于指示工作进程仅从队列处理单个作业：

```shell
php artisan queue:work --once
```

`--max-jobs` 选项可用于指示工作进程处理给定数量的作业然后退出。此选项与 [Supervisor](#supervisor-configuration) 结合使用可能很有用，以便你的工作进程在处理给定数量的作业后自动重启，释放它们可能已累积的任何内存：

```shell
php artisan queue:work --max-jobs=1000
```

<a name="processing-all-queued-jobs-then-exiting"></a>
#### 处理所有排队作业然后退出

`--stop-when-empty` 选项可用于指示工作进程处理所有作业然后优雅退出。此选项在 Docker 容器内处理 Laravel 队列时很有用，如果你希望在队列为空后关闭容器：

```shell
php artisan queue:work --stop-when-empty
```

<a name="processing-jobs-for-a-given-number-of-seconds"></a>
#### 处理作业指定秒数

`--max-time` 选项可用于指示工作进程处理作业给定秒数然后退出。此选项与 [Supervisor](#supervisor-configuration) 结合使用可能很有用，以便你的工作进程在处理作业给定时间后自动重启，释放它们可能已累积的任何内存：

```shell
# 处理作业一小时然后退出...
php artisan queue:work --max-time=3600
```

<a name="worker-sleep-duration"></a>
#### 工作进程睡眠持续时间

当队列上有可用作业时，工作进程将继续处理作业，作业之间没有延迟。但是，`sleep` 选项确定如果没有可用作业时工作进程将"睡眠"多少秒。当然，睡眠时，工作进程不会处理任何新作业：

```shell
php artisan queue:work --sleep=3
```

<a name="resource-considerations"></a>
#### 资源考虑

守护进程队列工作进程在处理每个作业之前不会"重启"框架。因此，你应在每个作业完成后释放任何重资源。例如，如果你使用 GD 库进行图像操作，应在完成图像处理后使用 `imagedestroy` 释放内存。

<a name="queue-priorities"></a>
### 队列优先级

有时你可能希望优先处理队列。例如，在 `config/queue.php` 配置文件中，你可以将 `redis` 连接的默认 `queue` 设置为 `low`。但是，偶尔你可能希望将作业推送到 `high` 优先级队列：

```php
dispatch((new Job)->onQueue('high'));
```

要启动一个验证在继续 `low` 队列上的任何作业之前处理所有 `high` 队列作业的工作进程，向 `work` 命令传递逗号分隔的队列名称列表：

```shell
php artisan queue:work --queue=high,low
```

<a name="queue-workers-and-deployment"></a>
### 队列工作进程与部署

由于队列工作进程是长生命周期进程，它们不会在不重启的情况下注意到代码更改。因此，部署使用队列工作进程的应用程序的最简单方法是在部署过程中重启工作进程。你可以通过发出 `queue:restart` 命令优雅重启所有工作进程：

```shell
php artisan queue:restart
```

此命令将指示所有队列工作进程在完成处理当前作业后优雅退出，以便不会丢失任何现有作业。由于队列工作进程在执行 `queue:restart` 命令时将退出，你应运行进程管理器（如 [Supervisor](#supervisor-configuration)）以自动重启队列工作进程。

> **Note**  
> 队列使用[缓存](/docs/{{version}}/cache)存储重启信号，因此在使用此功能之前，你应验证应用程序已正确配置缓存驱动。

<a name="job-expirations-and-timeouts"></a>
### 作业过期与超时

<a name="job-expiration"></a>
#### 作业过期

在 `config/queue.php` 配置文件中，每个队列连接定义一个 `retry_after` 选项。此选项指定队列连接在重试正在处理的作业之前应等待的秒数。例如，如果 `retry_after` 的值设置为 `90`，作业在处理 90 秒后未被释放或删除，将被释放回队列。通常，你应将 `retry_after` 值设置为作业合理完成处理所需的最大秒数。

> **Warning**  
> 唯一不包含 `retry_after` 值的队列连接是 Amazon SQS。SQS 将根据在 AWS 控制台中管理的 [Default Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/AboutVT.html) 重试作业。

<a name="worker-timeouts"></a>
#### 工作进程超时

`queue:work` Artisan 命令暴露一个 `--timeout` 选项。默认情况下，`--timeout` 值为 60 秒。如果作业处理时间超过超时值指定的秒数，处理作业的工作进程将出错退出。通常，工作进程将由[服务器上配置的进程管理器](#supervisor-configuration)自动重启：

```shell
php artisan queue:work --timeout=60
```

`retry_after` 配置选项和 `--timeout` CLI 选项不同，但协同工作以确保作业不丢失且作业只成功处理一次。

> **Warning**  
> `--timeout` 值应始终至少比你的 `retry_after` 配置值短几秒。这将确保处理冻结作业的工作进程始终在作业重试之前终止。如果你的 `--timeout` 选项长于 `retry_after` 配置值，你的作业可能被处理两次。

<a name="supervisor-configuration"></a>
## Supervisor 配置

在生产中，你需要一种方法来保持 `queue:work` 进程运行。`queue:work` 进程可能因多种原因停止运行，例如超过工作进程超时或执行 `queue:restart` 命令。

因此，你需要配置一个进程监视器，可以检测 `queue:work` 进程何时退出并自动重启它们。此外，进程监视器可以允许你指定要并发运行多少个 `queue:work` 进程。Supervisor 是 Linux 环境中常用的进程监视器，我们将在以下文档中讨论如何配置它。

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果 `queue:work` 进程失败，将自动重启它们。要在 Ubuntu 上安装 Supervisor，你可以使用以下命令：

```shell
sudo apt-get install supervisor
```

> **Note**  
> 如果自己配置和管理 Supervisor 听起来令人生畏，请考虑使用 [Laravel Forge](https://forge.laravel.com)，它将自动为你的生产 Laravel 项目安装和配置 Supervisor。

<a name="configuring-supervisor"></a>
#### 配置 Supervisor

Supervisor 配置文件通常存储在 `/etc/supervisor/conf.d` 目录中。在此目录中，你可以创建任意数量的配置文件来指示 Supervisor 如何监视你的进程。例如，让我们创建一个 `laravel-worker.conf` 文件来启动和监视 `queue:work` 进程：

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

在此示例中，`numprocs` 指令将指示 Supervisor 运行八个 `queue:work` 进程并监视所有进程，如果失败则自动重启。你应更改配置的 `command` 指令以反映你所需的队列连接和工作进程选项。

> **Warning**  
> 你应确保 `stopwaitsecs` 的值大于最长运行作业消耗的秒数。否则，Supervisor 可能在作业完成处理之前杀死作业。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

创建配置文件后，你可以使用以下命令更新 Supervisor 配置并启动进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start laravel-worker:*
```

有关 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="dealing-with-failed-jobs"></a>
## 处理失败作业

有时你的排队作业会失败。别担心，事情并不总是按计划进行！Laravel 包含一种便捷的方式来[指定作业应尝试的最大次数](#max-job-attempts-and-timeout)。异步作业超过此尝试次数后，将插入 `failed_jobs` 数据库表。[同步分发的作业](/docs/{{version}}/queues#synchronous-dispatching)失败时不存储在此表中，其异常由应用程序立即处理。

创建 `failed_jobs` 表的迁移通常已存在于新的 Laravel 应用程序中。但是，如果你的应用程序不包含此表的迁移，你可以使用 `queue:failed-table` 命令创建迁移：

```shell
php artisan queue:failed-table

php artisan migrate
```

运行[队列工作进程](#running-the-queue-worker)时，你可以使用 `queue:work` 命令上的 `--tries` 开关指定作业应尝试的最大次数。如果你不为 `--tries` 选项指定值，作业将只尝试一次或作业类的 `$tries` 属性指定的次数：

```shell
php artisan queue:work redis --tries=3
```

使用 `--backoff` 选项，你可以指定 Laravel 在重试遇到异常的作业之前应等待的秒数。默认情况下，作业立即释放回队列以便可以再次尝试：

```shell
php artisan queue:work redis --tries=3 --backoff=3
```

如果你想按作业配置 Laravel 在重试遇到异常的作业之前应等待的秒数，可以通过在作业类上定义 `backoff` 属性来实现：

```php
/**
 * 重试作业前等待的秒数。
 *
 * @var int
 */
public $backoff = 3;
```

如果你需要更复杂的逻辑来确定作业的退避时间，可以在作业类上定义 `backoff` 方法：

```php
/**
* 计算重试作业前等待的秒数。
*
* @return int
*/
public function backoff()
{
    return 3;
}
```

你可以通过从 `backoff` 方法返回退避值数组来轻松配置"指数"退避。在此示例中，第一次重试的重试延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒：

```php
/**
* 计算重试作业前等待的秒数。
*
* @return array
*/
public function backoff()
{
    return [1, 5, 10];
}
```

<a name="cleaning-up-after-failed-jobs"></a>
### 失败作业后清理

当特定作业失败时，你可能希望向用户发送警报或恢复作业部分完成的任何操作。为此，你可以在作业类上定义 `failed` 方法。导致作业失败的 `Throwable` 实例将传递给 `failed` 方法：

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessPodcast implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 播客实例。
     *
     * @var \App\Podcast
     */
    public $podcast;

    /**
     * 创建新的作业实例。
     *
     * @param  \App\Models\Podcast  $podcast
     * @return void
     */
    public function __construct(Podcast $podcast)
    {
        $this->podcast = $podcast;
    }

    /**
     * 执行作业。
     *
     * @param  \App\Services\AudioProcessor  $processor
     * @return void
     */
    public function handle(AudioProcessor $processor)
    {
        // 处理上传的播客...
    }

    /**
     * 处理作业失败。
     *
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(Throwable $exception)
    {
        // 向用户发送失败通知等...
    }
}
```

> **Warning**  
> 在调用 `failed` 方法之前实例化作业的新实例；因此，`handle` 方法内可能发生的任何类属性修改都将丢失。

<a name="retrying-failed-jobs"></a>
### 重试失败作业

要查看已插入 `failed_jobs` 数据库表的所有失败作业，可以使用 `queue:failed` Artisan 命令：

```shell
php artisan queue:failed
```

`queue:failed` 命令将列出作业 ID、连接、队列、失败时间以及有关作业的其他信息。作业 ID 可用于重试失败作业。例如，要重试 ID 为 `ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece` 的失败作业，发出以下命令：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece
```

如有必要，你可以向命令传递多个 ID：

```shell
php artisan queue:retry ce7bb17c-cdd8-41f0-a8ec-7b4fef4e5ece 91401d2c-0784-4f43-824c-34f94a33c24d
```

你还可以重试特定队列的所有失败作业：

```shell
php artisan queue:retry --queue=name
```

要重试所有失败作业，执行 `queue:retry` 命令并传递 `all` 作为 ID：

```shell
php artisan queue:retry all
```

如果你想删除失败作业，可以使用 `queue:forget` 命令：

```shell
php artisan queue:forget 91401d2c-0784-4f43-824c-34f94a33c24d
```

> **Note**  
> 使用 [Horizon](/docs/{{version}}/horizon) 时，应使用 `horizon:forget` 命令删除失败作业而不是 `queue:forget` 命令。

要从 `failed_jobs` 表删除所有失败作业，可以使用 `queue:flush` 命令：

```shell
php artisan queue:flush
```

<a name="ignoring-missing-models"></a>
### 忽略缺失模型

将 Eloquent 模型注入作业时，模型在放置到队列之前自动序列化，并在作业处理时从数据库重新检索。但是，如果模型在作业等待工作进程处理时已被删除，你的作业可能因 `ModelNotFoundException` 而失败。

为方便起见，你可以通过将作业的 `deleteWhenMissingModels` 属性设置为 `true` 来选择自动删除具有缺失模型的作业。当此属性设置为 `true` 时，Laravel 将悄悄丢弃作业而不引发异常：

```php
/**
 * 如果作业的模型不再存在则删除作业。
 *
 * @var bool
 */
public $deleteWhenMissingModels = true;
```

<a name="pruning-failed-jobs"></a>
### 清理失败作业

你可以通过调用 `queue:prune-failed` Artisan 命令来清理应用程序 `failed_jobs` 表中的记录：

```shell
php artisan queue:prune-failed
```

默认情况下，所有超过 24 小时的失败作业记录将被清理。如果你向命令提供 `--hours` 选项，则仅保留在最后 N 小时内插入的失败作业记录。例如，以下命令将删除所有超过 48 小时前插入的失败作业记录：

```shell
php artisan queue:prune-failed --hours=48
```

<a name="storing-failed-jobs-in-dynamodb"></a>
### 在 DynamoDB 中存储失败作业

Laravel 还支持在 [DynamoDB](https://aws.amazon.com/dynamodb) 中存储失败作业记录而不是关系数据库表。但是，你必须创建一个 DynamoDB 表来存储所有失败作业记录。通常，此表应命名为 `failed_jobs`，但你应根据应用程序 `queue` 配置文件中 `queue.failed.table` 配置值来命名表。

`failed_jobs` 表应具有名为 `application` 的字符串主分区键和名为 `uuid` 的字符串主排序键。键的 `application` 部分将包含应用程序 `app` 配置文件中 `name` 配置值定义的应用程序名称。由于应用程序名称是 DynamoDB 表键的一部分，你可以使用同一表为多个 Laravel 应用程序存储失败作业。

此外，确保安装 AWS SDK 以便你的 Laravel 应用程序可以与 Amazon DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `queue.failed.driver` 配置选项的值设置为 `dynamodb`。此外，你应在失败作业配置数组中定义 `key`、`secret` 和 `region` 配置选项。这些选项将用于向 AWS 进行身份验证。使用 `dynamodb` 驱动时，`queue.failed.database` 配置选项是不必要的：

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
### 禁用失败作业存储

你可以通过将 `queue.failed.driver` 配置选项的值设置为 `null` 来指示 Laravel 丢弃失败作业而不存储它们。通常，这可以通过 `QUEUE_FAILED_DRIVER` 环境变量来实现：

```ini
QUEUE_FAILED_DRIVER=null
```

<a name="failed-job-events"></a>
### 失败作业事件

如果你想注册在作业失败时调用的事件监听器，可以使用 `Queue` Facade 的 `failing` 方法。例如，我们可以从 Laravel 包含的 `AppServiceProvider` 的 `boot` 方法向此事件附加闭包：

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
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导启动任何应用程序服务。
     *
     * @return void
     */
    public function boot()
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
## 从队列清除作业

> **Note**  
> 使用 [Horizon](/docs/{{version}}/horizon) 时，应使用 `horizon:clear` 命令从队列清除作业而不是 `queue:clear` 命令。

如果你想从默认连接的默认队列删除所有作业，可以使用 `queue:clear` Artisan 命令：

```shell
php artisan queue:clear
```

你还可以提供 `connection` 参数和 `queue` 选项以从特定连接和队列删除作业：

```shell
php artisan queue:clear redis --queue=emails
```

> **Warning**  
> 从队列清除作业仅适用于 SQS、Redis 和数据库队列驱动。此外，SQS 消息删除过程最多需要 60 秒，因此清除队列后最多 60 秒内发送到 SQS 队列的作业也可能被删除。

<a name="monitoring-your-queues"></a>
## 监控队列

如果你的队列突然涌入大量作业，它可能会不堪重负，导致作业完成等待时间过长。如果你希望，Laravel 可以在队列作业数超过指定阈值时向你发出警报。

首先，你应调度 `queue:monitor` 命令[每分钟运行](/docs/{{version}}/scheduling)。此命令接受你希望监视的队列名称以及所需的作业数阈值：

```shell
php artisan queue:monitor redis:default,redis:deployments --max=100
```

仅调度此命令不足以触发通知警报你队列的不堪重负状态。当命令遇到作业数超过阈值的队列时，将分发 `Illuminate\Queue\Events\QueueBusy` 事件。你可以在应用程序的 `EventServiceProvider` 中监听此事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\QueueHasLongWaitTime;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * 注册应用程序的任何其他事件。
 *
 * @return void
 */
public function boot()
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

<a name="job-events"></a>
## 作业事件

使用 `Queue` [Facade](/docs/{{version}}/facades) 上的 `before` 和 `after` 方法，你可以指定在排队作业处理之前或之后执行的回调。这些回调是执行额外日志记录或为仪表盘递增统计数据的绝佳机会。通常，你应从[服务提供者](/docs/{{version}}/providers) 的 `boot` 方法调用这些方法。例如，我们可以使用 Laravel 包含的 `AppServiceProvider`：

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
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * 引导启动任何应用程序服务。
     *
     * @return void
     */
    public function boot()
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

使用 `Queue` [Facade](/docs/{{version}}/facades) 上的 `looping` 方法，你可以指定在工作进程尝试从队列获取作业之前执行的回调。例如，你可以注册一个闭包来回滚先前失败作业留下的任何打开的事务：

```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

Queue::looping(function () {
    while (DB::transactionLevel() > 0) {
        DB::rollBack();
    }
});
```