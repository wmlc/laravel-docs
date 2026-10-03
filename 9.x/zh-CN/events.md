# 事件

- [简介](#introduction)
- [注册事件与监听器](#registering-events-and-listeners)
    - [生成事件与监听器](#generating-events-and-listeners)
    - [手动注册事件](#manually-registering-events)
    - [事件发现](#event-discovery)
- [定义事件](#defining-events)
- [定义监听器](#defining-listeners)
- [队列事件监听器](#queued-event-listeners)
    - [手动与队列交互](#manually-interacting-with-the-queue)
    - [队列事件监听器与数据库事务](#queued-event-listeners-and-database-transactions)
    - [处理失败作业](#handling-failed-jobs)
- [分发事件](#dispatching-events)
- [事件订阅者](#event-subscribers)
    - [编写事件订阅者](#writing-event-subscribers)
    - [注册事件订阅者](#registering-event-subscribers)

<a name="introduction"></a>
## 简介

Laravel 的事件提供了简单的观察者模式实现，允许你订阅和监听应用程序中发生的各种事件。事件类通常存储在 `app/Events` 目录中，而其监听器存储在 `app/Listeners` 目录中。如果应用程序中没有这些目录也不必担心，使用 Artisan 控制台命令生成事件和监听器时会自动创建它们。

事件是解耦应用程序各个方面的绝佳方式，因为单个事件可以有多个互不依赖的监听器。例如，你可能希望在每次订单发货时向用户发送 Slack 通知。你可以发出一个 `App\Events\OrderShipped` 事件，由监听器接收并用于发送 Slack 通知，而无需将订单处理代码与 Slack 通知代码耦合。

<a name="registering-events-and-listeners"></a>
## 注册事件与监听器

Laravel 应用程序中包含的 `App\Providers\EventServiceProvider` 为注册所有应用程序事件监听器提供了便捷的场所。`listen` 属性包含所有事件（键）及其监听器（值）的数组。你可以根据应用程序需要向此数组添加任意多的事件。例如，让我们添加一个 `OrderShipped` 事件：

```php
use App\Events\OrderShipped;
use App\Listeners\SendShipmentNotification;

/**
 * 应用程序的事件监听器映射。
 *
 * @var array
 */
protected $listen = [
    OrderShipped::class => [
        SendShipmentNotification::class,
    ],
];
```

> **Note**  
> 可以使用 `event:list` 命令显示应用程序注册的所有事件和监听器列表。

<a name="generating-events-and-listeners"></a>
### 生成事件与监听器

当然，手动为每个事件和监听器创建文件很麻烦。相反，可以将监听器和事件添加到 `EventServiceProvider` 中，然后使用 `event:generate` Artisan 命令。此命令将生成 `EventServiceProvider` 中列出的但尚未存在的所有事件或监听器：

```shell
php artisan event:generate
```

或者，可以使用 `make:event` 和 `make:listener` Artisan 命令生成单个事件和监听器：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

<a name="manually-registering-events"></a>
### 手动注册事件

通常，事件应通过 `EventServiceProvider` 的 `$listen` 数组注册；但是，也可以在 `EventServiceProvider` 的 `boot` 方法中手动注册基于类或闭包的事件监听器：

```php
use App\Events\PodcastProcessed;
use App\Listeners\SendPodcastNotification;
use Illuminate\Support\Facades\Event;

/**
 * 为应用程序注册任何其他事件。
 *
 * @return void
 */
public function boot()
{
    Event::listen(
        PodcastProcessed::class,
        [SendPodcastNotification::class, 'handle']
    );

    Event::listen(function (PodcastProcessed $event) {
        //
    });
}
```

<a name="queuable-anonymous-event-listeners"></a>
#### 可队列匿名事件监听器

手动注册基于闭包的事件监听器时，可以将监听器闭包包装在 `Illuminate\Events\queueable` 函数中，指示 Laravel 使用[队列](/docs/{{version}}/queues)执行监听器：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;

/**
 * 为应用程序注册任何其他事件。
 *
 * @return void
 */
public function boot()
{
    Event::listen(queueable(function (PodcastProcessed $event) {
        //
    }));
}
```

与队列作业一样，可以使用 `onConnection`、`onQueue` 和 `delay` 方法自定义队列监听器的执行：

```php
Event::listen(queueable(function (PodcastProcessed $event) {
    //
})->onConnection('redis')->onQueue('podcasts')->delay(now()->addSeconds(10)));
```

如果你想处理匿名队列监听器失败，可以在定义 `queueable` 监听器时向 `catch` 方法提供闭包。此闭包将接收事件实例和导致监听器失败的 `Throwable` 实例：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;
use Throwable;

Event::listen(queueable(function (PodcastProcessed $event) {
    //
})->catch(function (PodcastProcessed $event, Throwable $e) {
    // 队列监听器失败...
}));
```

<a name="wildcard-event-listeners"></a>
#### 通配符事件监听器

甚至可以使用 `*` 作为通配符参数注册监听器，允许你在同一监听器上捕获多个事件。通配符监听器接收事件名作为第一个参数，接收整个事件数据数组作为第二个参数：

```php
Event::listen('event.*', function ($eventName, array $data) {
    //
});
```

<a name="event-discovery"></a>
### 事件发现

无需在 `EventServiceProvider` 的 `$listen` 数组中手动注册事件和监听器，你可以启用自动事件发现。启用事件发现后，Laravel 会自动扫描应用程序的 `Listeners` 目录来查找并注册事件和监听器。此外，`EventServiceProvider` 中显式定义的任何事件仍将被注册。

Laravel 使用 PHP 的反射服务扫描监听器类来查找事件监听器。当 Laravel 发现任何以 `handle` 或 `__invoke` 开头的监听器类方法时，Laravel 会将这些方法注册为方法签名中类型提示的事件的事件监听器：

```php
use App\Events\PodcastProcessed;

class SendPodcastNotification
{
    /**
     * 处理给定事件。
     *
     * @param  \App\Events\PodcastProcessed  $event
     * @return void
     */
    public function handle(PodcastProcessed $event)
    {
        //
    }
}
```

事件发现默认禁用，但可以通过覆盖应用程序 `EventServiceProvider` 的 `shouldDiscoverEvents` 方法来启用：

```php
/**
 * 确定是否应自动发现事件和监听器。
 *
 * @return bool
 */
public function shouldDiscoverEvents()
{
    return true;
}
```

默认情况下，将扫描应用程序 `app/Listeners` 目录中的所有监听器。如果你想定义要扫描的其他目录，可以覆盖 `EventServiceProvider` 中的 `discoverEventsWithin` 方法：

```php
/**
 * 获取用于发现事件的监听器目录。
 *
 * @return array
 */
protected function discoverEventsWithin()
{
    return [
        $this->app->path('Listeners'),
    ];
}
```

<a name="event-discovery-in-production"></a>
#### 生产环境中的事件发现

在生产环境中，框架在每次请求时扫描所有监听器效率不高。因此，在部署过程中，应运行 `event:cache` Artisan 命令来缓存所有应用程序事件和监听器的清单。框架将使用此清单来加速事件注册过程。可以使用 `event:clear` 命令销毁缓存。

<a name="defining-events"></a>
## 定义事件

事件类本质上是数据容器，持有与事件相关的信息。例如，假设 `App\Events\OrderShipped` 事件接收一个 [Eloquent ORM](/docs/{{version}}/eloquent) 对象：

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
     * 订单实例。
     *
     * @var \App\Models\Order
     */
    public $order;

    /**
     * 创建新的事件实例。
     *
     * @param  \App\Models\Order  $order
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
```

如你所见，此事件类不包含任何逻辑。它是已购买 `App\Models\Order` 实例的容器。事件使用的 `SerializesModels` Trait 会在使用 PHP 的 `serialize` 函数序列化事件对象时优雅地序列化任何 Eloquent 模型，例如使用[队列监听器](#queued-event-listeners)时。

<a name="defining-listeners"></a>
## 定义监听器

接下来，让我们看看示例事件的监听器。事件监听器在 `handle` 方法中接收事件实例。`event:generate` 和 `make:listener` Artisan 命令会自动导入正确的事件类并在 `handle` 方法上对事件进行类型提示。在 `handle` 方法中，可以执行响应事件所需的任何操作：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;

class SendShipmentNotification
{
    /**
     * 创建事件监听器。
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * 处理事件。
     *
     * @param  \App\Events\OrderShipped  $event
     * @return void
     */
    public function handle(OrderShipped $event)
    {
        // 使用 $event->order 访问订单...
    }
}
```

> **Note**  
> 事件监听器也可以在构造函数中类型提示所需的任何依赖。所有事件监听器都通过 Laravel [服务容器](/docs/{{version}}/container)解析，因此依赖会被自动注入。

<a name="stopping-the-propagation-of-an-event"></a>
#### 停止事件传播

有时，你可能希望停止事件向其他监听器传播。可以通过从监听器的 `handle` 方法返回 `false` 来实现。

<a name="queued-event-listeners"></a>
## 队列事件监听器

如果监听器要执行慢速任务（如发送电子邮件或发起 HTTP 请求），将监听器加入队列会很有益。在使用队列监听器之前，请确保已[配置队列](/docs/{{version}}/queues)并在服务器或本地开发环境中启动队列工作者。

要指定监听器应加入队列，将 `ShouldQueue` 接口添加到监听器类。`event:generate` 和 `make:listener` Artisan 命令生成的监听器已将此接口导入到当前命名空间，因此可以立即使用：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    //
}
```

就是这样！现在，当此监听器处理的事件被分发时，监听器将被事件分发器自动使用 Laravel 的[队列系统](/docs/{{version}}/queues)加入队列。如果队列执行监听器时没有抛出异常，队列作业将在处理完成后自动删除。

<a name="customizing-the-queue-connection-queue-name"></a>
#### 自定义队列连接和队列名称

如果要自定义事件监听器的队列连接、队列名称或队列延迟时间，可以在监听器类上定义 `$connection`、`$queue` 或 `$delay` 属性：

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
     * 作业处理前的时间（秒）。
     *
     * @var int
     */
    public $delay = 60;
}
```

如果要在运行时定义监听器的队列连接或队列名称，可以在监听器上定义 `viaConnection` 或 `viaQueue` 方法：

```php
/**
 * 获取监听器的队列连接名称。
 *
 * @return string
 */
public function viaConnection()
{
    return 'sqs';
}

/**
 * 获取监听器的队列名称。
 *
 * @return string
 */
public function viaQueue()
{
    return 'listeners';
}
```

<a name="conditionally-queueing-listeners"></a>
#### 条件性地将监听器加入队列

有时，你可能需要根据仅在运行时可用的某些数据来确定监听器是否应加入队列。为此，可以在监听器上添加 `shouldQueue` 方法来确定监听器是否应加入队列。如果 `shouldQueue` 方法返回 `false`，则不会执行监听器：

```php
<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class RewardGiftCard implements ShouldQueue
{
    /**
     * 向客户赠送礼品卡。
     *
     * @param  \App\Events\OrderCreated  $event
     * @return void
     */
    public function handle(OrderCreated $event)
    {
        //
    }

    /**
     * 确定监听器是否应加入队列。
     *
     * @param  \App\Events\OrderCreated  $event
     * @return bool
     */
    public function shouldQueue(OrderCreated $event)
    {
        return $event->order->subtotal >= 5000;
    }
}
```

<a name="manually-interacting-with-the-queue"></a>
### 手动与队列交互

如果需要手动访问监听器底层队列作业的 `delete` 和 `release` 方法，可以使用 `Illuminate\Queue\InteractsWithQueue` Trait。生成的监听器默认导入此 Trait 并提供对这些方法的访问：

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
     *
     * @param  \App\Events\OrderShipped  $event
     * @return void
     */
    public function handle(OrderShipped $event)
    {
        if (true) {
            $this->release(30);
        }
    }
}
```

<a name="queued-event-listeners-and-database-transactions"></a>
### 队列事件监听器与数据库事务

当队列监听器在数据库事务内被分发时，它们可能在数据库事务提交之前就被队列处理。发生这种情况时，在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务内创建的任何模型或数据库记录可能不存在于数据库中。如果监听器依赖这些模型，处理分发队列监听器的作业时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，仍可以通过在监听器类上定义 `$afterCommit` 属性来指示特定队列监听器应在所有打开的数据库事务提交后分发：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public $afterCommit = true;
}
```

> **Note**  
> 要了解更多有关解决这些问题的方法，请查阅[队列作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)文档。

<a name="handling-failed-jobs"></a>
### 处理失败作业

有时队列事件监听器可能失败。如果队列监听器超过队列工作者定义的最大尝试次数，将调用监听器上的 `failed` 方法。`failed` 方法接收事件实例和导致失败的 `Throwable`：

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
     *
     * @param  \App\Events\OrderShipped  $event
     * @return void
     */
    public function handle(OrderShipped $event)
    {
        //
    }

    /**
     * 处理作业失败。
     *
     * @param  \App\Events\OrderShipped  $event
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(OrderShipped $event, $exception)
    {
        //
    }
}
```

<a name="specifying-queued-listener-maximum-attempts"></a>
#### 指定队列监听器最大尝试次数

如果某个队列监听器遇到错误，你可能不希望它无限重试。因此，Laravel 提供了多种方式来指定监听器可尝试的次数或时长。

可以在监听器类上定义 `$tries` 属性来指定监听器在被视为失败之前可尝试的次数：

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
     * 队列监听器可尝试的次数。
     *
     * @var int
     */
    public $tries = 5;
}
```

除了定义监听器在失败前可尝试的次数外，还可以定义监听器不再尝试的时间点。这允许监听器在给定时间范围内尝试任意次数。要定义监听器不再尝试的时间，在监听器类上添加 `retryUntil` 方法。此方法应返回 `DateTime` 实例：

```php
/**
 * 确定监听器应超时的时间。
 *
 * @return \DateTime
 */
public function retryUntil()
{
    return now()->addMinutes(5);
}
```

<a name="dispatching-events"></a>
## 分发事件

要分发事件，可以调用事件上的静态 `dispatch` 方法。此方法通过 `Illuminate\Foundation\Events\Dispatchable` Trait 在事件上提供。传递给 `dispatch` 方法的任何参数都将传递给事件的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Events\OrderShipped;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderShipmentController extends Controller
{
    /**
     * 发运给定订单。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $order = Order::findOrFail($request->order_id);

        // 订单发运逻辑...

        OrderShipped::dispatch($order);
    }
}
```

 如果你想有条件地分发事件，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
OrderShipped::dispatchIf($condition, $order);

OrderShipped::dispatchUnless($condition, $order);
```

> **Note**  
> 测试时，断言某些事件已被分发而不实际触发其监听器会很有用。Laravel 的[内置测试辅助函数](/docs/{{version}}/mocking#event-fake)让这一切变得轻而易举。

<a name="event-subscribers"></a>
## 事件订阅者

<a name="writing-event-subscribers"></a>
### 编写事件订阅者

事件订阅者是可以在订阅者类自身内订阅多个事件的类，允许你在单个类中定义多个事件处理器。订阅者应定义 `subscribe` 方法，该方法将接收事件分发器实例。可以在给定分发器上调用 `listen` 方法来注册事件监听器：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin($event) {}

    /**
     * 处理用户登出事件。
     */
    public function handleUserLogout($event) {}

    /**
     * 为订阅者注册监听器。
     *
     * @param  \Illuminate\Events\Dispatcher  $events
     * @return void
     */
    public function subscribe($events)
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

如果事件监听器方法定义在订阅者自身内，你可能会发现从订阅者的 `subscribe` 方法返回事件和方法名称数组更为方便。注册事件监听器时，Laravel 会自动确定订阅者的类名：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class UserEventSubscriber
{
    /**
     * 处理用户登录事件。
     */
    public function handleUserLogin($event) {}

    /**
     * 处理用户登出事件。
     */
    public function handleUserLogout($event) {}

    /**
     * 为订阅者注册监听器。
     *
     * @param  \Illuminate\Events\Dispatcher  $events
     * @return array
     */
    public function subscribe($events)
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

编写订阅者后，就可以向事件分发器注册它。可以使用 `EventServiceProvider` 上的 `$subscribe` 属性注册订阅者。例如，让我们将 `UserEventSubscriber` 添加到列表中：

```php
<?php

namespace App\Providers;

use App\Listeners\UserEventSubscriber;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * 应用程序的事件监听器映射。
     *
     * @var array
     */
    protected $listen = [
        //
    ];

    /**
     * 要注册的订阅者类。
     *
     * @var array
     */
    protected $subscribe = [
        UserEventSubscriber::class,
    ];
}
```