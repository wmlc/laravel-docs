# 事件系统

- [简介](#introduction)
- [生成事件和监听器](#generating-events-and-listeners)
- [注册事件和监听器](#registering-events-and-listeners)
    - [事件发现](#event-discovery)
    - [手动注册事件](#manually-registering-events)
    - [闭包监听器](#closure-listeners)
- [定义事件](#defining-events)
- [定义监听器](#defining-listeners)
- [队列化事件监听器](#queued-event-listeners)
    - [手动与队列交互](#manually-interacting-with-the-queue)
    - [队列化事件监听器与数据库事务](#queued-event-listeners-and-database-transactions)
    - [队列监听器中间件](#queued-listener-middleware)
    - [加密的队列监听器](#encrypted-queued-listeners)
    - [唯一事件监听器](#unique-event-listeners)
        - [让监听器在开始处理前保持唯一](#keeping-listeners-unique-until-processing-begins)
        - [唯一监听器锁](#unique-listener-locks)
    - [处理失败的作业](#handling-failed-jobs)
- [分发事件](#dispatching-events)
    - [在数据库事务提交后分发事件](#dispatching-events-after-database-transactions)
    - [延迟事件](#deferring-events)
- [事件订阅者](#event-subscribers)
    - [编写事件订阅者](#writing-event-subscribers)
    - [注册事件订阅者](#registering-event-subscribers)
- [测试](#testing)
    - [伪造部分事件](#faking-a-subset-of-events)
    - [作用域事件伪造](#scoped-event-fakes)

<a name="introduction"></a>
## 简介

Laravel 的事件提供了简单的观察者模式实现，允许你订阅和监听应用程序中发生的各种事件。事件类通常存放在 `app/Events` 目录中，而其监听器存放在 `app/Listeners` 中。如果你在应用程序中没有看到这些目录也不必担心，当你使用 Artisan 控制台命令生成事件和监听器时，Laravel 会自动创建它们。

事件是解耦应用程序各个部分的好方法，因为单个事件可以有多个互不依赖的监听器。例如，你可能希望在每次订单发货时向用户发送 Slack 通知。此时不必将订单处理代码与 Slack 通知代码耦合在一起，你可以触发一个 `App\Events\OrderShipped` 事件，由监听器接收该事件并派发 Slack 通知。

<a name="generating-events-and-listeners"></a>
## 生成事件和监听器

要快速生成事件和监听器，可以使用 `make:event` 和 `make:listener` Artisan 命令：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

为方便起见，你也可以不带任何参数地调用 `make:event` 和 `make:listener` Artisan 命令。此时 Laravel 会自动提示你输入类名，以及在创建监听器时输入它要监听的事件：

```shell
php artisan make:event

php artisan make:listener
```

<a name="registering-events-and-listeners"></a>
## 注册事件和监听器

<a name="event-discovery"></a>
### 事件发现

默认情况下，Laravel 会通过扫描应用程序的 `Listeners` 目录来自动查找并注册事件监听器。当 Laravel 发现任何以 `handle` 或 `__invoke` 开头的监听器类方法时，就会将这些方法注册为对应事件的监听器，该事件由方法签名中的类型提示指定：

```php
use App\Events\PodcastProcessed;

class SendPodcastNotification
{
    /**
     * 处理事件。
     */
    public function handle(PodcastProcessed $event): void
    {
        // ...
    }
}
```

你可以使用 PHP 的联合类型来监听多个事件：

```php
/**
 * 处理事件。
 */
public function handle(PodcastProcessed|PodcastPublished $event): void
{
    // ...
}
```

如果你计划将监听器存放在其他目录或多个目录中，可以在应用程序的 `bootstrap/app.php` 文件中使用 `withEvents` 方法指示 Laravel 扫描这些目录：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/Orders/Listeners',
])
```

你可以使用 `*` 字符作为通配符，在多个结构相似的目录中扫描监听器：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/*/Listeners',
])
```

可以使用 `event:list` 命令列出应用程序中注册的所有监听器：

```shell
php artisan event:list
```

<a name="event-discovery-in-production"></a>
#### 生产环境中的事件发现

为了提升应用程序的速度，你应该使用 `optimize` 或 `event:cache` Artisan 命令为应用程序的所有监听器缓存一份清单。通常，这个命令应该在应用程序的[部署流程](/docs/{{version}}/deployment#optimization)中运行。框架会利用这份清单来加速事件注册过程。`event:clear` 命令可用于销毁事件缓存。

<a name="manually-registering-events"></a>
### 手动注册事件

使用 `Event` Facade，你可以在应用程序 `AppServiceProvider` 的 `boot` 方法中手动注册事件及其对应的监听器：

```php
use App\Domain\Orders\Events\PodcastProcessed;
use App\Domain\Orders\Listeners\SendPodcastNotification;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Event::listen(
        PodcastProcessed::class,
        SendPodcastNotification::class,
    );
}
```

可以使用 `event:list` 命令列出应用程序中注册的所有监听器：

```shell
php artisan event:list
```

<a name="closure-listeners"></a>
### 闭包监听器

通常，监听器以类的形式定义；不过，你也可以在应用程序 `AppServiceProvider` 的 `boot` 方法中手动注册基于闭包的事件监听器：

```php
use App\Events\PodcastProcessed;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Event::listen(function (PodcastProcessed $event) {
        // ...
    });
}
```

<a name="queuable-anonymous-event-listeners"></a>
#### 可队列化的匿名事件监听器

在注册基于闭包的事件监听器时，你可以将监听器闭包包裹在 `Illuminate\Events\queueable` 函数中，指示 Laravel 使用[队列](/docs/{{version}}/queues)来执行该监听器：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    }));
}
```

与队列化作业一样，你可以使用 `onConnection`、`onQueue` 和 `delay` 方法来自定义队列监听器的执行方式：

```php
Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->onConnection('redis')->onQueue('podcasts')->delay(now()->plus(seconds: 10)));
```

如果你想处理匿名队列监听器的失败情况，可以在定义 `queueable` 监听器时为 `catch` 方法提供一个闭包。该闭包会接收事件实例以及导致监听器失败的 `Throwable` 实例：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;
use Throwable;

Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->catch(function (PodcastProcessed $event, Throwable $e) {
    // 队列监听器执行失败...
}));
```

<a name="wildcard-event-listeners"></a>
#### 通配符事件监听器

你还可以使用 `*` 字符作为通配符参数来注册监听器，从而在同一个监听器中捕获多个事件。通配符监听器的第一个参数是事件名称，第二个参数是包含全部事件数据的数组：

```php
Event::listen('event.*', function (string $eventName, array $data) {
    // ...
});
```

<a name="defining-events"></a>
## 定义事件

事件类本质上是一个数据容器，保存着与事件相关的信息。例如，假设一个 `App\Events\OrderShipped` 事件接收一个 [Eloquent ORM](/docs/{{version}}/eloquent) 对象：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * 创建新的事件实例。
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

如你所见，这个事件类不包含任何逻辑。它只是一个已购买 `App\Models\Order` 实例的容器。事件所使用的 `SerializesModels` Trait 会在事件对象通过 PHP 的 `serialize` 函数序列化时（例如使用[队列监听器](#queued-event-listeners)时）优雅地序列化所有 Eloquent 模型。

<a name="defining-listeners"></a>
## 定义监听器

接下来，我们看看示例事件对应的监听器。事件监听器在其 `handle` 方法中接收事件实例。当 `make:listener` Artisan 命令与 `--event` 选项一起调用时，会自动导入正确的事件类，并在 `handle` 方法中为事件添加类型提示。在 `handle` 方法中，你可以执行响应事件所需的任何操作：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;

class SendShipmentNotification
{
    /**
     * 创建事件监听器。
     */
    public function __construct() {}

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // 使用 $event->order 访问订单...
    }
}
```

> [!NOTE]
> 事件监听器还可以在其构造函数中为所需的任何依赖添加类型提示。所有事件监听器都是通过 Laravel 的[服务容器](/docs/{{version}}/container)解析的，因此依赖会被自动注入。

<a name="stopping-the-propagation-of-an-event"></a>
#### 停止事件的传播

有时，你可能希望阻止事件继续传播给其他监听器。只需在监听器的 `handle` 方法中返回 `false` 即可。

<a name="queued-event-listeners"></a>
## 队列化事件监听器

如果监听器要执行耗时的任务（例如发送电子邮件或发起 HTTP 请求），将其放入队列会带来好处。在使用队列监听器之前，请确保已[配置好队列](/docs/{{version}}/queues)，并在服务器或本地开发环境中启动了队列工作进程。

要指定某个监听器应被队列化，只需在监听器类上添加 `ShouldQueue` 接口。`make:listener` Artisan 命令生成的监听器已经将该接口导入到当前命名空间中，因此你可以直接使用：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

就这样！现在，当该监听器所处理的事件被分发时，事件分发器会使用 Laravel 的[队列系统](/docs/{{version}}/queues)自动将监听器放入队列。如果队列执行监听器时没有抛出异常，队列作业会在处理完成后自动删除。

<a name="customizing-the-queue-connection-queue-name"></a>
#### 自定义队列连接、名称与延迟

如果你想自定义事件监听器的队列连接、队列名称或队列延迟时间，可以在监听器类上定义 `$connection`、`$queue` 或 `$delay` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * 作业应发送到的连接名称。
     *
     * @var string|null
     */
    public $connection = 'sqs';

    /**
     * 作业应发送到的队列名称。
     *
     * @var string|null
     */
    public $queue = 'listeners';

    /**
     * 作业处理前的等待时间（秒）。
     *
     * @var int
     */
    public $delay = 60;
}
```

如果想在运行时定义监听器的队列连接、队列名称或延迟时间，可以在监听器上定义 `viaConnection`、`viaQueue` 或 `withDelay` 方法：

```php
/**
 * 获取监听器的队列连接名称。
 */
public function viaConnection(): string
{
    return 'sqs';
}

/**
 * 获取监听器的队列名称。
 */
public function viaQueue(): string
{
    return 'listeners';
}

/**
 * 获取作业处理前应等待的秒数。
 */
public function withDelay(OrderShipped $event): int
{
    return $event->highPriority ? 0 : 60;
}
```

<a name="conditionally-queueing-listeners"></a>
#### 按条件队列化监听器

有时，你可能需要根据仅在运行时才能获取的数据来判断监听器是否应被队列化。为此，可以在监听器中添加 `shouldQueue` 方法来判断是否应将其加入队列。如果 `shouldQueue` 方法返回 `false`，监听器就不会被加入队列：

```php
<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class RewardGiftCard implements ShouldQueue
{
    /**
     * 向客户发放礼品卡。
     */
    public function handle(OrderCreated $event): void
    {
        // ...
    }

    /**
     * 判断监听器是否应被队列化。
     */
    public function shouldQueue(OrderCreated $event): bool
    {
        return $event->order->subtotal >= 5000;
    }
}
```

<a name="manually-interacting-with-the-queue"></a>
### 手动与队列交互

如果需要手动访问监听器底层队列作业的 `delete` 和 `release` 方法，可以使用 `Illuminate\Queue\InteractsWithQueue` Trait。生成的监听器默认已导入该 Trait，它提供了对这些方法的访问：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        if ($condition) {
            $this->release(30);
        }
    }
}
```

<a name="queued-event-listeners-and-database-transactions"></a>
### 队列化事件监听器与数据库事务

当队列监听器在数据库事务中被分发时，队列可能会在数据库事务提交之前就处理它们。一旦发生这种情况，你在数据库事务期间对模型或数据库记录所做的更新可能尚未写入数据库。此外，事务中创建的模型或数据库记录也可能尚不存在于数据库中。如果你的监听器依赖这些模型，那么当分发该队列监听器的作业被处理时，就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项为 `false`，你仍然可以通过在监听器类上实现 `ShouldQueueAfterCommit` 接口，来指示特定的队列监听器应在所有未完成的数据库事务提交后再分发：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueueAfterCommit
{
    use InteractsWithQueue;
}
```

> [!NOTE]
> 要了解更多关于规避这些问题的方法，请查阅[队列作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)相关文档。

<a name="queued-listener-middleware"></a>
### 队列监听器中间件

队列监听器还可以使用[作业中间件](/docs/{{version}}/queues#job-middleware)。作业中间件允许你在队列监听器的执行前后包裹自定义逻辑，从而减少监听器本身中的样板代码。创建作业中间件后，只需在监听器的 `middleware` 方法中返回它们，即可将中间件附加到监听器上：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use App\Jobs\Middleware\RateLimited;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // 处理事件...
    }

    /**
     * 获取监听器应通过的中间件。
     *
     * @return array<int, object>
     */
    public function middleware(OrderShipped $event): array
    {
        return [new RateLimited];
    }
}
```

<a name="encrypted-queued-listeners"></a>
#### 加密的队列监听器

Laravel 允许你通过[加密](/docs/{{version}}/encryption)来确保队列监听器数据的私密性与完整性。要开始使用，只需在监听器类上添加 `ShouldBeEncrypted` 接口。将该接口添加到类之后，Laravel 会在把监听器推入队列之前自动对其加密：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue, ShouldBeEncrypted
{
    // ...
}
```

<a name="unique-event-listeners"></a>
### 唯一事件监听器

> [!WARNING]
> 唯一监听器需要使用支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

有时，你可能希望确保任意时刻队列中某个特定监听器只有一个实例。只需在监听器类上实现 `ShouldBeUnique` 接口即可：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    public function __invoke(LicenseSaved $event): void
    {
        // ...
    }
}
```

在上面的示例中，`AcquireProductKey` 监听器是唯一的。因此，如果该监听器的另一个实例已在队列中且尚未处理完成，此监听器就不会被加入队列。这样即使许可证在短时间内被多次保存，也能确保每个许可证只获取一个产品密钥。

在某些情况下，你可能希望定义一个让监听器保持唯一的特定「键」，或者指定一个超时时间，超过该时间后监听器不再保持唯一。为此，你可以在监听器类上定义 `uniqueId` 和 `uniqueFor` 属性或方法。这些方法会接收事件实例，因此你可以利用事件数据来构造返回值：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    /**
     * 监听器的唯一锁将在多少秒后释放。
     *
     * @var int
     */
    public $uniqueFor = 3600;

    public function __invoke(LicenseSaved $event): void
    {
        // ...
    }

    /**
     * 获取监听器的唯一 ID。
     */
    public function uniqueId(LicenseSaved $event): string
    {
        return 'listener:'.$event->license->id;
    }
}
```

在上面的示例中，`AcquireProductKey` 监听器以许可证 ID 作为唯一标识。因此，在现有监听器处理完成之前，同一许可证的任何新的监听器分发都会被忽略。这可以防止为同一许可证重复获取产品密钥。此外，如果现有监听器在一小时内未被处理，唯一锁将被释放，此时另一个具有相同唯一键的监听器就可以被加入队列。

> [!WARNING]
> 如果你的应用程序从多台 Web 服务器或容器分发事件，应确保所有服务器都连接到同一个中央缓存服务器，以便 Laravel 能准确判断监听器是否唯一。

<a name="keeping-listeners-unique-until-processing-begins"></a>
#### 让监听器在开始处理前保持唯一

默认情况下，唯一监听器会在监听器完成处理或重试全部失败后「解锁」。不过，有些情况下你可能希望监听器在开始处理之前就立即解锁。为此，监听器应实现 `ShouldBeUniqueUntilProcessing` 契约，而非 `ShouldBeUnique` 契约：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

<a name="unique-listener-locks"></a>
#### 唯一监听器锁

在幕后，当分发一个 `ShouldBeUnique` 监听器时，Laravel 会尝试使用 `uniqueId` 键获取一个[锁](/docs/{{version}}/cache#atomic-locks)。如果锁已被持有，该监听器就不会被分发。当监听器完成处理或重试全部失败时，锁将被释放。默认情况下，Laravel 会使用默认缓存驱动来获取该锁。不过，如果你想使用其他驱动来获取锁，可以定义一个 `uniqueVia` 方法，返回应使用的缓存驱动：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    // ...

    /**
     * 获取唯一监听器锁所使用的缓存驱动。
     */
    public function uniqueVia(LicenseSaved $event): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只需要限制监听器的并发处理，请改用 [WithoutOverlapping](/docs/{{version}}/queues#preventing-job-overlaps) 作业中间件。

<a name="handling-failed-jobs"></a>
### 处理失败的作业

有时，队列事件监听器可能会执行失败。如果队列监听器超过了队列工作进程所定义的最大尝试次数，Laravel 就会调用监听器上的 `failed` 方法。`failed` 方法接收事件实例以及导致失败的 `Throwable`：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // ...
    }

    /**
     * 处理作业失败。
     */
    public function failed(OrderShipped $event, Throwable $exception): void
    {
        // ...
    }
}
```

<a name="specifying-queued-listener-maximum-attempts"></a>
#### 指定队列监听器的最大尝试次数

如果某个队列监听器遇到错误，你多半不希望它无限重试。为此，Laravel 提供了多种方式来指定监听器的尝试次数或尝试时长。

你可以在监听器类上定义 `tries` 属性或方法，指定监听器在被判定为失败之前可以尝试多少次：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 队列监听器可以尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

除了定义监听器失败前的尝试次数之外，你还可以定义一个时间点，超过该时间点后不再尝试执行监听器。这样，监听器在给定时间范围内可以被尝试任意次数。要定义不再尝试监听器的时间点，可以在监听器类上添加 `retryUntil` 方法。该方法应返回一个 `DateTime` 实例：

```php
use DateTime;

/**
 * 判断监听器应在何时超时。
 */
public function retryUntil(): DateTime
{
    return now()->plus(minutes: 5);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 会优先使用 `retryUntil` 方法。

<a name="specifying-queued-listener-backoff"></a>
#### 指定队列监听器的退避时间

如果你想配置 Laravel 在重试遇到异常的监听器之前等待多少秒，可以在监听器类上定义 `backoff` 属性：

```php
/**
 * 重试队列监听器前等待的秒数。
 *
 * @var int
 */
public $backoff = 3;
```

如果判断监听器退避时间需要更复杂的逻辑，可以在监听器类上定义 `backoff` 方法：

```php
/**
 * 计算重试队列监听器前应等待的秒数。
 */
public function backoff(OrderShipped $event): int
{
    return 3;
}
```

通过在 `backoff` 方法中返回一个退避值数组，你可以轻松配置「指数」退避。在这个示例中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，之后如果还有剩余尝试次数，每次重试的延迟均为 10 秒：

```php
/**
 * 计算重试队列监听器前应等待的秒数。
 *
 * @return list<int>
 */
public function backoff(OrderShipped $event): array
{
    return [1, 5, 10];
}
```

<a name="specifying-queued-listener-max-exceptions"></a>
#### 指定队列监听器的最大异常数

有时你可能希望指定队列监听器可以尝试多次，但如果重试是由给定数量的未处理异常触发的（而非由 `release` 方法直接释放），监听器就应失败。为此，你可以在监听器类上定义 `maxExceptions` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * 队列监听器可以尝试的次数。
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
     * 处理事件。
     */
    public function handle(OrderShipped $event): void
    {
        // 处理事件...
    }
}
```

在这个示例中，监听器最多会被重试 25 次。但如果监听器抛出三次未处理的异常，它就会失败。

<a name="specifying-queued-listener-timeout"></a>
#### 指定队列监听器的超时时间

通常，你大致清楚队列监听器需要执行多久。因此，Laravel 允许你指定一个「超时」值。如果监听器的处理时间超过超时值指定的秒数，处理该监听器的工作进程将报错退出。你可以在监听器类上定义 `timeout` 属性，指定监听器允许运行的最大秒数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * 监听器超时前可以运行的秒数。
     *
     * @var int
     */
    public $timeout = 120;
}
```

如果你想指定监听器在超时时应被标记为失败，可以在监听器类上定义 `failOnTimeout` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * 指示监听器在超时时是否应被标记为失败。
     *
     * @var bool
     */
    public $failOnTimeout = true;
}
```

<a name="dispatching-events"></a>
## 分发事件

要分发事件，可以调用事件上的静态 `dispatch` 方法。该方法由 `Illuminate\Foundation\Events\Dispatchable` Trait 提供给事件使用。传递给 `dispatch` 方法的所有参数都会被传递给事件的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Events\OrderShipped;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderShipmentController extends Controller
{
    /**
     * 为给定订单发货。
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 订单发货逻辑...

        OrderShipped::dispatch($order);

        return redirect('/orders');
    }
}
```

如果需要有条件地分发事件，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
OrderShipped::dispatchIf($condition, $order);

OrderShipped::dispatchUnless($condition, $order);
```

> [!NOTE]
> 在测试时，断言某些事件已被分发但不实际触发其监听器往往很有帮助。Laravel 的[内置测试辅助函数](#testing)让这一切轻而易举。

<a name="dispatching-events-after-database-transactions"></a>
### 在数据库事务提交后分发事件

有时，你可能希望指示 Laravel 只在当前数据库事务提交后才分发事件。为此，可以在事件类上实现 `ShouldDispatchAfterCommit` 接口。

该接口会指示 Laravel 在当前数据库事务提交之前不分发该事件。如果事务失败，事件将被丢弃。如果在分发事件时没有正在进行中的数据库事务，事件将被立即分发：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped implements ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * 创建新的事件实例。
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

<a name="deferring-events"></a>
### 延迟事件

延迟事件允许你将模型事件的分发和事件监听器的执行推迟到特定代码块执行完毕之后。当你需要确保在触发事件监听器之前所有相关记录都已创建时，这一功能尤为实用。

要延迟事件，请为 `Event::defer()` 方法提供一个闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
});
```

闭包内触发的所有事件都会在闭包执行完毕后分发。这确保了事件监听器能够访问延迟执行期间创建的所有相关记录。如果闭包内发生异常，延迟事件将不会被分发。

如果只想延迟特定的事件，可以将事件数组作为第二个参数传递给 `defer` 方法：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
}, ['eloquent.created: '.User::class]);
```

<a name="event-subscribers"></a>
## 事件订阅者

<a name="writing-event-subscribers"></a>
### 编写事件订阅者

事件订阅者是一种可以在订阅者类内部订阅多个事件的类，让你能够在单个类中定义多个事件处理器。订阅者应定义一个 `subscribe` 方法，该方法接收一个事件分发器实例。你可以在给定的分发器上调用 `listen` 方法来注册事件监听器：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * 处理用户注销事件。
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * 为订阅者注册监听器。
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            Login::class,
            [UserEventSubscriber::class, 'handleUserLogin']
        );

        $events->listen(
            Logout::class,
            [UserEventSubscriber::class, 'handleUserLogout']
        );
    }
}
```

如果你的事件监听器方法就定义在订阅者自身内部，那么从订阅者的 `subscribe` 方法中返回一个事件与方法名的数组可能更方便。Laravel 会在注册事件监听器时自动确定订阅者的类名：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * 处理用户注销事件。
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * 为订阅者注册监听器。
     *
     * @return array<string, string>
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleUserLogin',
            Logout::class => 'handleUserLogout',
        ];
    }
}
```

<a name="registering-event-subscribers"></a>
### 注册事件订阅者

编写好订阅者之后，如果其中的处理器方法遵循 Laravel 的[事件发现约定](#event-discovery)，Laravel 会自动注册这些方法。否则，你可以使用 `Event` Facade 的 `subscribe` 方法手动注册订阅者。通常，这应该在应用程序 `AppServiceProvider` 的 `boot` 方法中完成：

```php
<?php

namespace App\Providers;

use App\Listeners\UserEventSubscriber;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Event::subscribe(UserEventSubscriber::class);
    }
}
```

<a name="testing"></a>
## 测试

在测试分发事件的代码时，你可能希望指示 Laravel 不要实际执行事件的监听器，因为监听器的代码可以独立于分发对应事件的代码、直接单独测试。当然，要测试监听器本身，你可以在测试中实例化一个监听器实例并直接调用 `handle` 方法。

使用 `Event` Facade 的 `fake` 方法，你可以阻止监听器执行，运行被测代码，然后使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法断言应用程序分发了哪些事件：

```php tab=Pest
<?php

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;

test('orders can be shipped', function () {
    Event::fake();

    // 执行订单发货...

    // 断言某个事件已被分发...
    Event::assertDispatched(OrderShipped::class);

    // 断言某个事件被分发了两次...
    Event::assertDispatched(OrderShipped::class, 2);

    // 断言某个事件只被分发了一次...
    Event::assertDispatchedOnce(OrderShipped::class);

    // 断言某个事件未被分发...
    Event::assertNotDispatched(OrderFailedToShip::class);

    // 断言没有分发任何事件...
    Event::assertNothingDispatched();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 测试订单发货。
     */
    public function test_orders_can_be_shipped(): void
    {
        Event::fake();

        // 执行订单发货...

        // 断言某个事件已被分发...
        Event::assertDispatched(OrderShipped::class);

        // 断言某个事件被分发了两次...
        Event::assertDispatched(OrderShipped::class, 2);

        // 断言某个事件只被分发了一次...
        Event::assertDispatchedOnce(OrderShipped::class);

        // 断言某个事件未被分发...
        Event::assertNotDispatched(OrderFailedToShip::class);

        // 断言没有分发任何事件...
        Event::assertNothingDispatched();
    }
}
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传递一个闭包，以断言某个通过给定「真实性测试」的事件已被分发。只要至少有一个被分发的事件通过了给定的真实性测试，断言就会成功：

```php
Event::assertDispatched(function (OrderShipped $event) use ($order) {
    return $event->order->id === $order->id;
});
```

如果你只是想断言某个事件监听器正在监听给定事件，可以使用 `assertListening` 方法：

```php
Event::assertListening(
    OrderShipped::class,
    SendShipmentNotification::class
);
```

> [!WARNING]
> 调用 `Event::fake()` 之后，任何事件监听器都不会被执行。因此，如果你的测试使用了依赖于事件的模型工厂（例如在模型的 `creating` 事件期间生成 UUID），你应该在使用工厂**之后**再调用 `Event::fake()`。

<a name="faking-a-subset-of-events"></a>
### 伪造部分事件

如果只想针对一组特定的事件伪造事件监听器，可以将这些事件传递给 `fake` 或 `fakeFor` 方法：

```php tab=Pest
test('orders can be processed', function () {
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常分发...
    $order->update([
        // ...
    ]);
});
```

```php tab=PHPUnit
/**
 * 测试订单处理。
 */
public function test_orders_can_be_processed(): void
{
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常分发...
    $order->update([
        // ...
    ]);
}
```

你可以使用 `except` 方法伪造除一组指定事件之外的所有事件：

```php
Event::fake()->except([
    OrderCreated::class,
]);
```

<a name="scoped-event-fakes"></a>
### 作用域事件伪造

如果只想针对测试的某一部分伪造事件监听器，可以使用 `fakeFor` 方法：

```php tab=Pest
<?php

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Support\Facades\Event;

test('orders can be processed', function () {
    $order = Event::fakeFor(function () {
        $order = Order::factory()->create();

        Event::assertDispatched(OrderCreated::class);

        return $order;
    });

    // 事件正常分发，观察者也会运行...
    $order->update([
        // ...
    ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 测试订单处理。
     */
    public function test_orders_can_be_processed(): void
    {
        $order = Event::fakeFor(function () {
            $order = Order::factory()->create();

            Event::assertDispatched(OrderCreated::class);

            return $order;
        });

        // 事件正常分发，观察者也会运行...
        $order->update([
            // ...
        ]);
    }
}
```
