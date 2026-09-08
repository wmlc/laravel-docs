# Events

- [Introduction](#introduction)
- [Generating Events and Listeners](#generating-events-and-listeners)
- [Registering Events and Listeners](#registering-events-and-listeners)
    - [Event Discovery](#event-discovery)
    - [Manually Registering Events](#manually-registering-events)
    - [Closure Listeners](#closure-listeners)
- [Defining Events](#defining-events)
- [Defining Listeners](#defining-listeners)
- [Queued Event Listeners](#queued-event-listeners)
    - [Manually Interacting With the Queue](#manually-interacting-with-the-queue)
    - [Queued Event Listeners and Database Transactions](#queued-event-listeners-and-database-transactions)
    - [Queued Listener Middleware](#queued-listener-middleware)
    - [Encrypted Queued Listeners](#encrypted-queued-listeners)
    - [Unique Event Listeners](#unique-event-listeners)
        - [Keeping Listeners Unique Until Processing Begins](#keeping-listeners-unique-until-processing-begins)
        - [Unique Listener Locks](#unique-listener-locks)
    - [Debounced Event Listeners](#debounced-event-listeners)
    - [Handling Failed Jobs](#handling-failed-jobs)
- [Dispatching Events](#dispatching-events)
    - [Dispatching Events After Database Transactions](#dispatching-events-after-database-transactions)
    - [Deferring Events](#deferring-events)
- [Event Subscribers](#event-subscribers)
    - [Writing Event Subscribers](#writing-event-subscribers)
    - [Registering Event Subscribers](#registering-event-subscribers)
- [Testing](#testing)
    - [Faking a Subset of Events](#faking-a-subset-of-events)
    - [Scoped Event Fakes](#scoped-event-fakes)

<a name="introduction"></a>
## Introduction

Laravel 的事件（events）提供了一种简单的观察者模式（observer pattern）实现，让你能够订阅并监听应用内发生的各种事件。事件类通常存放在 `app/Events` 目录，而它们的监听器则存放在 `app/Listeners` 目录。即使你的应用中暂时看不到这些目录也不必担心，因为在使用 Artisan 命令生成事件和监听器时，系统会自动创建它们。

事件是解耦应用各个部分的好办法，因为单个事件可以拥有多个互不依赖的监听器。例如，你可能希望在每次订单发货时向用户发送 Slack 通知。与其把订单处理代码与 Slack 通知代码耦合在一起，不如触发一个 `App\Events\OrderShipped` 事件，由监听器接收并据此派发 Slack 通知。

<a name="generating-events-and-listeners"></a>
## Generating Events and Listeners

要快速生成事件和监听器，可以使用 `make:event` 和 `make:listener` 这两个 Artisan 命令：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

为方便起见，你也可以不带额外参数直接调用 `make:event` 和 `make:listener` 这两个 Artisan 命令。此时 Laravel 会自动提示你输入类名，并在创建监听器时提示你要监听的事件：

```shell
php artisan make:event

php artisan make:listener
```

<a name="registering-events-and-listeners"></a>
## Registering Events and Listeners

<a name="event-discovery"></a>
### Event Discovery

默认情况下，Laravel 会自动扫描应用的 `Listeners` 目录来发现并注册事件监听器。当 Laravel 找到任何以 `handle` 或 `__invoke` 开头的方法时，就会将该方法注册为方法签名中类型提示（type-hinted）所对应的事件的监听器：

```php
use App\Events\PodcastProcessed;

class SendPodcastNotification
{
    /**
     * Handle the event.
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
 * Handle the event.
 */
public function handle(PodcastProcessed|PodcastPublished $event): void
{
    // ...
}
```

如果你打算把监听器存放在其他目录或分散在多个目录中，可以使用应用 `bootstrap/app.php` 文件中的 `withEvents` 方法，指示 Laravel 扫描这些目录：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/Orders/Listeners',
])
```

你也可以使用 `*` 字符作为通配符，在多个类似目录中扫描监听器：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/*/Listeners',
])
```

可以使用 `event:list` 命令列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="event-discovery-in-production"></a>
#### Event Discovery in Production

为了让应用运行得更快，应该使用 `optimize` 或 `event:cache` 这两个 Artisan 命令缓存一份包含所有应用监听器的清单（manifest）。通常，该命令应当作为应用 [部署流程](/docs/{{version}}/deployment#optimization) 的一部分来运行。框架会使用这份清单来加速事件注册过程。可以使用 `event:clear` 命令来清除事件缓存。

<a name="dynamic-event-discovery"></a>
#### Dynamic Event Discovery

若要动态控制某个监听器是否被纳入发现，可以在监听器类上实现 `ShouldBeDiscovered` 接口，并定义一个返回布尔值的 `shouldBeDiscovered` 方法。如果该方法返回 `false`，那么该监听器在事件发现阶段就不会被注册：

```php
use Illuminate\Contracts\Events\ShouldBeDiscovered;

class SendPodcastNotification implements ShouldBeDiscovered
{
    /**
     * Handle the event.
     */
    public function handle(PodcastProcessed $event): void
    {
        // ...
    }

    /**
     * Determine if the listener should be discovered.
     */
    public static function shouldBeDiscovered(): bool
    {
        return app()->environment('production');
    }
}
```

<a name="manually-registering-events"></a>
### Manually Registering Events

使用 `Event` facade，可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册事件及其对应的监听器：

```php
use App\Domain\Orders\Events\PodcastProcessed;
use App\Domain\Orders\Listeners\SendPodcastNotification;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(
        PodcastProcessed::class,
        SendPodcastNotification::class,
    );
}
```

可以使用 `event:list` 命令列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="closure-listeners"></a>
### Closure Listeners

通常监听器以类的形式定义；不过，你也可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册基于闭包的事件监听器：

```php
use App\Events\PodcastProcessed;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(function (PodcastProcessed $event) {
        // ...
    });
}
```

<a name="queueable-anonymous-event-listeners"></a>
#### Queueable Anonymous Event Listeners

在注册基于闭包的监听器时，可以把监听闭包包裹在 `Illuminate\Events\queueable` 函数中，指示 Laravel 使用 [队列](/docs/{{version}}/queues) 来执行该监听器：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    }));
}
```

与排队任务类似，可以使用 `onConnection`、`onQueue` 和 `delay` 方法来定制排队监听器的执行：

```php
Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->onConnection('redis')->onQueue('podcasts')->delay(now()->plus(seconds: 10)));
```

如果你希望处理匿名排队监听器的失败情况，可以在定义 `queueable` 监听器时，向 `catch` 方法提供一个闭包。该闭包会接收到事件实例，以及导致监听器失败的 `Throwable` 实例：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;
use Throwable;

Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->catch(function (PodcastProcessed $event, Throwable $e) {
    // The queued listener failed...
}));
```

<a name="wildcard-event-listeners"></a>
#### Wildcard Event Listeners

你也可以使用 `*` 字符作为通配符参数来注册监听器，从而让同一个监听器捕获多个事件。通配符监听器会把事件名称作为第一个参数、把完整的事件数据数组作为第二个参数：

```php
Event::listen('event.*', function (string $eventName, array $data) {
    // ...
});
```

<a name="defining-events"></a>
## Defining Events

事件类本质上是一个数据容器，用来保存与事件相关的信息。例如，假设 `App\Events\OrderShipped` 事件接收一个 [Eloquent ORM](/docs/{{version}}/eloquent) 对象：

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
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

如你所见，这个事件类不包含任何逻辑。它只是一个保存已购买 `App\Models\Order` 实例的容器。事件使用的 `SerializesModels` trait 会在事件对象通过 PHP 的 `serialize` 函数序列化时（例如使用 [队列监听器](#queued-event-listeners) 时），优雅地序列化任意 Eloquent 模型。

<a name="defining-listeners"></a>
## Defining Listeners

接下来，我们来看看示例事件的监听器。事件监听器会在其 `handle` 方法中接收事件实例。当使用 `--event` 选项调用 `make:listener` Artisan 命令时，它会自动导入对应的事件类，并在 `handle` 方法中为事件添加类型提示。你可以在 `handle` 方法中执行任何响应事件所需的操作：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;

class SendShipmentNotification
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // Access the order using $event->order...
    }
}
```

> [!NOTE]
> 你的事件监听器也可以在构造函数中类型提示所需的任何依赖。所有事件监听器都通过 Laravel [服务容器](/docs/{{version}}/container) 解析，因此依赖会被自动注入。

<a name="stopping-the-propagation-of-an-event"></a>
#### Stopping The Propagation Of An Event

有时你可能希望阻止事件继续传播给其他监听器。只需在监听器的 `handle` 方法中返回 `false` 即可。

<a name="queued-event-listeners"></a>
## Queued Event Listeners

当监听器需要执行诸如发送邮件或发起 HTTP 请求这类较慢的任务时，将监听器排队会很有帮助。在使用队列监听器之前，请确保已 [配置好队列](/docs/{{version}}/queues)，并在服务器或本地开发环境中启动一个队列 Worker。

要指定某个监听器应当被排队，只需给监听器类加上 `ShouldQueue` 接口。由 `make:listener` Artisan 命令生成的监听器已经将该接口导入当前命名空间，因此你可以立即使用：

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

就是这样！现在，当这个监听器所处理的事件被派发时，事件调度器会通过 Laravel 的 [队列系统](/docs/{{version}}/queues) 自动将该监听器排队。如果队列执行监听器时没有抛出异常，那么排队的任务在完成后会被自动删除。

<a name="customizing-the-queue-connection-queue-name"></a>
#### Customizing The Queue Connection, Name, & Delay

如果你想自定义事件监听器的队列连接、队列名称或队列延迟时间，可以使用监听器类上的 `Connection`、`Queue` 和 `Delay` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Delay;
use Illuminate\Queue\Attributes\Queue;

#[Connection('sqs')]
#[Queue('listeners')]
#[Delay(60)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你想在运行时定义监听器的队列连接、队列名称或延迟，可以在监听器上定义 `viaConnection`、`viaQueue` 或 `withDelay` 方法：

```php
/**
 * Get the name of the listener's queue connection.
 */
public function viaConnection(): string
{
    return 'sqs';
}

/**
 * Get the name of the listener's queue.
 */
public function viaQueue(): string
{
    return 'listeners';
}

/**
 * Get the number of seconds before the job should be processed.
 */
public function withDelay(OrderShipped $event): int
{
    return $event->highPriority ? 0 : 60;
}
```

<a name="conditionally-queueing-listeners"></a>
#### Conditionally Queueing Listeners

有时，你需要根据某些仅在运行时才能获得的数据来决定是否将监听器排队。为此，可以在监听器上添加 `shouldQueue` 方法，用于判断监听器是否应当排队。如果 `shouldQueue` 方法返回 `false`，监听器就不会被排队：

```php
<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class RewardGiftCard implements ShouldQueue
{
    /**
     * Reward a gift card to the customer.
     */
    public function handle(OrderCreated $event): void
    {
        // ...
    }

    /**
     * Determine whether the listener should be queued.
     */
    public function shouldQueue(OrderCreated $event): bool
    {
        return $event->order->subtotal >= 5000;
    }
}
```

<a name="manually-interacting-with-the-queue"></a>
### Manually Interacting With the Queue

如果你需要手动访问监听器底层队列任务的 `delete` 和 `release` 方法，可以使用 `Illuminate\Queue\InteractsWithQueue` trait。该 trait 在生成的监听器中被默认导入，并提供对这些方法的访问：

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
     * Handle the event.
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
### Queued Event Listeners and Database Transactions

当队列监听器在数据库事务内部被派发时，队列可能会在数据库事务提交之前就处理它们。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新都还未能反映到数据库中。此外，在事务内创建的任何模型或数据库记录可能还不存在于数据库中。如果你的监听器依赖这些模型，那么在派发该队列监听器的任务被处理时，就可能发生意想不到的错误。

如果你的队列连接的 `after_commit` 配置项被设为 `false`，你仍然可以通过在监听器类上实现 `ShouldQueueAfterCommit` 接口，来指明该特定队列监听器应在所有未提交的数据库事务都提交之后才被派发：

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
> 想了解更多应对这些问题的方法，请查阅关于 [队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions) 的文档。

<a name="queued-listener-middleware"></a>
### Queued Listener Middleware

队列监听器也可以使用 [任务中间件](/docs/{{version}}/queues#job-middleware)。任务中间件让你可以在排队监听器的执行逻辑外层包裹自定义逻辑，从而减少监听器自身的样板代码。创建任务中间件之后，可以在监听器的 `middleware` 方法中将其返回，从而将其附加到监听器上：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use App\Jobs\Middleware\RateLimited;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // Process the event...
    }

    /**
     * Get the middleware the listener should pass through.
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
#### Encrypted Queued Listeners

Laravel 允许你通过 [加密](/docs/{{version}}/encryption) 来保证队列监听器数据的私密性与完整性。要开始使用，只需给监听器类加上 `ShouldBeEncrypted` 接口。一旦该类加上这个接口，Laravel 就会在将其推入队列之前自动加密你的监听器：

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
### Unique Event Listeners

> [!WARNING]
> 唯一监听器需要一个支持 [锁](/docs/{{version}}/cache#atomic-locks) 的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 这些缓存驱动都支持原子锁。

有时你可能希望确保某个特定监听器在任意时刻只有一个实例位于队列中。要这样做，可以在监听器类上实现 `ShouldBeUnique` 接口：

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

在上面的例子中，`AcquireProductKey` 监听器是唯一的。因此，如果队列中已经存在该监听器的另一个实例且尚未处理完成，那么该监听器就不会再次入队。这保证了每个许可证只会获取一个产品密钥，即使该许可证在短时间内被保存多次也是如此。

在某些情况下，你可能希望定义一个特定的「键」来使监听器保持唯一，或者希望指定一个超时时间，超过该时间后监听器不再保持唯一。为此，可以在监听器类上定义 `uniqueId` 和 `uniqueFor` 属性或方法。这些方法会接收到事件实例，让你可以利用事件数据来构造返回值：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    /**
     * The number of seconds after which the listener's unique lock will be released.
     *
     * @var int
     */
    public $uniqueFor = 3600;

    public function __invoke(LicenseSaved $event): void
    {
        // ...
    }

    /**
     * Get the unique ID for the listener.
     */
    public function uniqueId(LicenseSaved $event): string
    {
        return 'listener:'.$event->license->id;
    }
}
```

在上面的例子中，`AcquireProductKey` 监听器按许可证 ID 保持唯一。因此，在为同一许可证重新派发该监听器之前，只要现有监听器尚未处理完成，新的派发就会被忽略。这就避免了为同一许可证重复获取产品密钥。此外，如果现有监听器在一小时内未被处理，唯一锁会被释放，此时拥有相同唯一键的另一个监听器就可以入队。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器派发事件，你应当确保所有服务器都与同一个中心缓存服务器通信，这样 Laravel 才能准确判断某个监听器是否唯一。

<a name="keeping-listeners-unique-until-processing-begins"></a>
#### Keeping Listeners Unique Until Processing Begins

默认情况下，唯一监听器会在监听器处理完成或所有重试尝试都失败之后「解锁」。不过，在某些情况下你可能希望监听器在即将被处理时就立即解锁。为此，监听器应当实现 `ShouldBeUniqueUntilProcessing` 契约，而不是 `ShouldBeUnique` 契约：

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
#### Unique Listener Locks

在底层，当 `ShouldBeUnique` 监听器被派发时，Laravel 会尝试以 `uniqueId` 为键获取一个 [锁](/docs/{{version}}/cache#atomic-locks)。如果该锁已被持有，监听器就不会被派发。当监听器处理完成或所有重试失败后，该锁会被释放。默认情况下，Laravel 会使用默认的缓存驱动来获取这个锁。不过，如果你想使用其他驱动来获取锁，可以定义一个 `uniqueVia` 方法，返回应当使用的缓存驱动：

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
     * Get the cache driver for the unique listener lock.
     */
    public function uniqueVia(LicenseSaved $event): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只是想限制监听器的并发处理，请改用 [WithoutOverlapping](/docs/{{version}}/queues#preventing-job-overlaps) 任务中间件。

<a name="debounced-event-listeners"></a>
### Debounced Event Listeners

有时你可能只想处理在短时间内被反复派发的事件中最新的一次实例。为此，可以给排队监听器添加 `DebounceFor` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\ProductUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\DebounceFor;

#[DebounceFor(30)]
class UpdateProductSearchIndex implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(ProductUpdated $event): void
    {
        // Update the product's search index...
    }

    /**
     * Get the debounce ID for the listener.
     */
    public function debounceId(ProductUpdated $event): string
    {
        return (string) $event->product->getKey();
    }
}
```

在上面的例子中，在 `30` 秒内为同一产品反复派发 `ProductUpdated` 事件会使监听器进入防抖状态，从而只处理最新的事件。不同的防抖 ID 会被独立处理。

如果你希望限制一个频繁派发的事件拖延监听器的最长时间，可以给 `DebounceFor` 属性提供 `maxWait` 参数：

```php
#[DebounceFor(30, maxWait: 120)]
class UpdateProductSearchIndex implements ShouldQueue
{
    // ...
}
```

你可以通过在监听器上定义 `debounceVia` 方法来自定义用于防抖追踪的缓存存储。该方法接收事件实例，并应当返回一个缓存仓库：

```php
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

public function debounceVia(ProductUpdated $event): Repository
{
    return Cache::driver('redis');
}
```

防抖监听器与唯一监听器是互斥的。使用 `DebounceFor` 属性的监听器不应实现 `ShouldBeUnique`。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器派发事件，你应当确保所有服务器都与同一个中心缓存服务器通信。

<a name="handling-failed-jobs"></a>
### Handling Failed Jobs

有时你的队列事件监听器可能会失败。如果队列监听器超过了队列 Worker 所定义的最大尝试次数，监听器上的 `failed` 方法就会被调用。`failed` 方法会接收到事件实例以及导致失败的 `Throwable`：

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
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // ...
    }

    /**
     * Handle a job failure.
     */
    public function failed(OrderShipped $event, Throwable $exception): void
    {
        // ...
    }
}
```

<a name="specifying-queued-listener-maximum-attempts"></a>
#### Specifying Queued Listener Maximum Attempts

当某个队列监听器遇到错误时，你可能不希望它无限期地重试下去。因此，Laravel 提供了多种方式来指定监听器可以尝试的次数或时长。

你可以在监听器类上使用 `Tries` 属性，来指定监听器在被判定为失败之前可以尝试的次数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;

#[Tries(5)]
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    // ...
}
```

除了定义监听器在被判定为失败之前可尝试的次数之外，你也可以定义监听器不应再被尝试的时间点。这样，在给定时间范围内监听器可以被尝试任意多次。要为监听器定义不应再被尝试的时间点，可以在监听器类上添加一个 `retryUntil` 方法。该方法应当返回一个 `DateTimeInterface` 实例：

```php
use DateTimeInterface;

/**
 * Determine the time at which the listener should timeout.
 */
public function retryUntil(): DateTimeInterface
{
    return now()->plus(minutes: 5);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 会以 `retryUntil` 方法为准。

<a name="specifying-queued-listener-backoff"></a>
#### Specifying Queued Listener Backoff

如果你想配置 Laravel 在重试遇到异常的监听器之前应当等待多少秒，可以在监听器类上使用 `Backoff` 属性：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Backoff;

#[Backoff(3)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你需要更复杂的逻辑来决定监听器的退避时间，可以在监听器类上定义一个 `backoff` 方法：

```php
/**
 * Calculate the number of seconds to wait before retrying the queued listener.
 */
public function backoff(OrderShipped $event): int
{
    return 3;
}
```

你可以通过从 `backoff` 方法返回一个退避值数组，轻松配置「指数」退避。在这个例子中，第一次重试的延迟为 1 秒，第二次为 5 秒，第三次为 10 秒；如果还有更多重试次数，之后的每次重试延迟均为 10 秒：

```php
/**
 * Calculate the number of seconds to wait before retrying the queued listener.
 *
 * @return list<int>
 */
public function backoff(OrderShipped $event): array
{
    return [1, 5, 10];
}
```

<a name="specifying-queued-listener-max-exceptions"></a>
#### Specifying Queued Listener Max Exceptions

有时你可能希望指定某个队列监听器可以被尝试很多次，但如果重试是由给定数量的未处理异常（而非通过 `release` 方法直接释放）触发的，则应当判定为失败。为此，可以在监听器类上使用 `Tries` 和 `MaxExceptions` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;

#[Tries(25)]
#[MaxExceptions(3)]
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // Process the event...
    }
}
```

在这个例子中，监听器最多会被重试 25 次。但是，如果监听器抛出了三个未处理的异常，监听器就会被判定为失败。

<a name="specifying-queued-listener-timeout"></a>
#### Specifying Queued Listener Timeout

通常你能大致预估队列监听器需要执行多久。因此，Laravel 允许你指定一个「超时」值。如果某个监听器的执行时间超过了超时值所指定的秒数，处理该监听器的 Worker 就会报错退出。你可以通过在监听器类上使用 `Timeout` 属性来定义监听器被允许运行的最大秒数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Timeout;

#[Timeout(120)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你希望指明某个监听器在超时时应当被标记为失败，可以在监听器类上使用 `FailOnTimeout` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\FailOnTimeout;

#[FailOnTimeout]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

<a name="dispatching-events"></a>
## Dispatching Events

要派发事件，可以调用事件上的静态 `dispatch` 方法。该方法由 `Illuminate\Foundation\Events\Dispatchable` trait 提供给事件。任何传入 `dispatch` 方法的参数都会传递给事件的构造函数：

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
     * Ship the given order.
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // Order shipment logic...

        OrderShipped::dispatch($order);

        return redirect('/orders');
    }
}
```

如果你想有条件地派发事件，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
OrderShipped::dispatchIf($condition, $order);

OrderShipped::dispatchUnless($condition, $order);
```

> [!NOTE]
> 在测试时，断言某些事件已被派发而实际上并不触发其监听器，往往很有帮助。Laravel 的内置测试辅助函数让这一切变得轻而易举。

<a name="dispatching-events-after-database-transactions"></a>
### Dispatching Events After Database Transactions

有时你可能希望指示 Laravel 只在当前活动的数据库事务提交之后才派发事件。为此，可以在事件类上实现 `ShouldDispatchAfterCommit` 接口。

该接口会指示 Laravel 在当前数据库事务提交之前不要派发该事件。如果事务失败，该事件会被丢弃。如果在派发事件时没有正在进行中的数据库事务，事件会立即被派发：

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
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

<a name="deferring-events"></a>
### Deferring Events

延迟事件（Deferred events）让你可以把模型事件的派发与事件监听器的执行，推迟到某段特定代码执行完成之后。当你需要确保所有相关记录都已创建，事件监听器才会被触发时，这一点尤其有用。

要延迟事件，可以向 `Event::defer()` 方法传入一个闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
});
```

闭包内触发的所有事件，都会在闭包执行完毕后才被派发。这保证了事件监听器能够访问到延迟执行期间创建的所有相关记录。如果闭包内部发生异常，延迟事件就不会被派发。

如果只想延迟特定的事件，可以把事件数组作为第二个参数传给 `defer` 方法：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
}, ['eloquent.created: '.User::class]);
```

<a name="event-subscribers"></a>
## Event Subscribers

<a name="writing-event-subscribers"></a>
### Writing Event Subscribers

事件订阅器（subscriber）是能够在其自身类内部订阅多个事件的类，让你可以把多个事件处理器定义在同一个类中。订阅器应当定义一个 `subscribe` 方法，该方法接收一个事件调度器实例。你可以调用给定调度器的 `listen` 方法来注册事件监听器：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * Handle user login events.
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * Handle user logout events.
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * Register the listeners for the subscriber.
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

如果你的事件监听方法定义在订阅器自身内部，那么从订阅器的 `subscribe` 方法返回一个「事件 => 方法名」数组会更方便。在注册事件监听器时，Laravel 会自动确定订阅器的类名：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * Handle user login events.
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * Handle user logout events.
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * Register the listeners for the subscriber.
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
### Registering Event Subscribers

编写好订阅器之后，如果订阅器内部的处理方法遵循 Laravel 的 [事件发现约定](#event-discovery)，Laravel 会自动注册它们。否则，你可以使用 `Event` facade 的 `subscribe` 方法来手动注册订阅器。通常，这应当在应用的 `AppServiceProvider` 的 `boot` 方法中完成：

```php
<?php

namespace App\Providers;

use App\Listeners\UserEventSubscriber;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::subscribe(UserEventSubscriber::class);
    }
}
```

<a name="testing"></a>
## Testing

在测试会派发事件的代码时，你可能希望指示 Laravel 不要真正执行事件的监听器，因为监听器自身的代码可以单独、直接地进行测试，而不必依赖派发对应事件的代码。当然，要测试监听器本身，你可以实例化一个监听器对象，并在测试中直接调用其 `handle` 方法。

使用 `Event` facade 的 `fake` 方法，你可以阻止监听器执行，先运行待测代码，然后再使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法来断言应用派发了哪些事件：

```php tab=Pest
<?php

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;

test('orders can be shipped', function () {
    Event::fake();

    // Perform order shipping...

    // Assert that an event was dispatched...
    Event::assertDispatched(OrderShipped::class);

    // Assert an event was dispatched twice...
    Event::assertDispatched(OrderShipped::class, 2);

    // Assert an event was dispatched once...
    Event::assertDispatchedOnce(OrderShipped::class);

    // Assert an event was not dispatched...
    Event::assertNotDispatched(OrderFailedToShip::class);

    // Assert that no events were dispatched...
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
     * Test order shipping.
     */
    public function test_orders_can_be_shipped(): void
    {
        Event::fake();

        // Perform order shipping...

        // Assert that an event was dispatched...
        Event::assertDispatched(OrderShipped::class);

        // Assert an event was dispatched twice...
        Event::assertDispatched(OrderShipped::class, 2);

        // Assert an event was dispatched once...
        Event::assertDispatchedOnce(OrderShipped::class);

        // Assert an event was not dispatched...
        Event::assertNotDispatched(OrderFailedToShip::class);

        // Assert that no events were dispatched...
        Event::assertNothingDispatched();
    }
}
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传入一个闭包，从而断言派发的事件通过了给定的「真值测试」。只要至少有一个派发的事件通过了给定的真值测试，断言就会成功：

```php
Event::assertDispatched(function (OrderShipped $event) use ($order) {
    return $event->order->id === $order->id;
});
```

如果你只是想断言某个事件监听器正在监听某个给定事件，可以使用 `assertListening` 方法：

```php
Event::assertListening(
    OrderShipped::class,
    SendShipmentNotification::class
);
```

> [!WARNING]
> 调用 `Event::fake()` 之后，任何事件监听器都不会被执行。因此，如果你的测试使用了依赖事件的模型工厂（例如在模型的 `creating` 事件中创建 UUID），你应当在使用了工厂 **之后** 再调用 `Event::fake()`。

<a name="faking-a-subset-of-events"></a>
### Faking a Subset of Events

如果你只想为一组特定事件伪造监听器，可以把它们传给 `fake` 或 `fakeFor` 方法：

```php tab=Pest
test('orders can be processed', function () {
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // Other events are dispatched as normal...
    $order->update([
        // ...
    ]);
});
```

```php tab=PHPUnit
/**
 * Test order process.
 */
public function test_orders_can_be_processed(): void
{
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // Other events are dispatched as normal...
    $order->update([
        // ...
    ]);
}
```

你可以使用 `except` 方法来伪造除指定事件集合之外的所有事件：

```php
Event::fake()->except([
    OrderCreated::class,
]);
```

<a name="scoped-event-fakes"></a>
### Scoped Event Fakes

如果你只想在测试的一部分中伪造事件监听器，可以使用 `fakeFor` 方法：

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

    // Events are dispatched as normal and observers will run...
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
     * Test order process.
     */
    public function test_orders_can_be_processed(): void
    {
        $order = Event::fakeFor(function () {
            $order = Order::factory()->create();

            Event::assertDispatched(OrderCreated::class);

            return $order;
        });

        // Events are dispatched as normal and observers will run...
        $order->update([
            // ...
        ]);
    }
}
```
