# 事件

- [简介](#introduction)
- [生成事件与监听器](#generating-events-and-listeners)
- [注册事件与监听器](#registering-events-and-listeners)
    - [事件发现](#event-discovery)
    - [手动注册事件](#manually-registering-events)
    - [闭包监听器](#closure-listeners)
- [定义事件](#defining-events)
- [定义监听器](#defining-listeners)
- [队列事件监听器](#queued-event-listeners)
    - [手动与队列交互](#manually-interacting-with-the-queue)
    - [队列事件监听器与数据库事务](#queued-event-listeners-and-database-transactions)
    - [处理失败的作业](#handling-failed-jobs)
- [派发事件](#dispatching-events)
    - [在数据库事务之后派发事件](#dispatching-events-after-database-transactions)
- [事件订阅者](#event-subscribers)
    - [编写事件订阅者](#writing-event-subscribers)
    - [注册事件订阅者](#registering-event-subscribers)
- [测试](#testing)
    - [伪造部分事件](#faking-a-subset-of-events)
    - [限定作用域的事件伪造](#scoped-event-fakes)

<a name="introduction"></a>
## 简介

Laravel 的事件提供了一套简单的观察者模式实现，让你能够订阅并监听应用中发生的各种事件。事件类通常存放在 `app/Events` 目录中，而对应的监听器存放在 `app/Listeners` 中。如果你在应用中没看到这些目录，也不必担心——当你使用 Artisan 命令行工具生成事件和监听器时，系统会自动为你创建它们。

事件是解耦应用各个方面的绝佳方式，因为单个事件可以拥有多个彼此不依赖的监听器。例如，你可能希望在每次订单发货时向用户发送 Slack 通知。与其把订单处理代码与 Slack 通知代码耦合在一起，你可以触发一个 `App\Events\OrderShipped` 事件，监听器收到该事件后即可用它派发 Slack 通知。

<a name="generating-events-and-listeners"></a>
## 生成事件与监听器

要快速生成事件和监听器，可以使用 `make:event` 和 `make:listener` Artisan 命令：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

为方便起见，你也可以不带任何额外参数调用 `make:event` 和 `make:listener` Artisan 命令。这样做时，Laravel 会自动提示你输入类名；创建监听器时，还会提示你输入它应当监听的事件：

```shell
php artisan make:event

php artisan make:listener
```

<a name="registering-events-and-listeners"></a>
## 注册事件与监听器

<a name="event-discovery"></a>
### 事件发现

默认情况下，Laravel 会扫描应用的 `Listeners` 目录，自动查找并注册你的事件监听器。当 Laravel 发现某个监听器类的方法以 `handle` 或 `__invoke` 开头时，就会把这些方法注册为事件监听器，对应的事件由该方法签名中的类型提示决定：

    use App\Events\PodcastProcessed;

    class SendPodcastNotification
    {
        /**
         * 处理给定的事件。
         */
        public function handle(PodcastProcessed $event): void
        {
            // ...
        }
    }

你可以使用 PHP 的联合类型监听多个事件：

    /**
     * 处理给定的事件。
     */
    public function handle(PodcastProcessed|PodcastPublished $event): void
    {
        // ...
    }

如果你打算把监听器存放在其它目录或多个目录中，可以指示 Laravel 使用应用 `bootstrap/app.php` 文件中的 `withEvents` 方法扫描这些目录：

    ->withEvents(discover: [
        __DIR__.'/../app/Domain/Orders/Listeners',
    ])

你还可以使用 `*` 字符作为通配符，扫描多个相似目录中的监听器：

    ->withEvents(discover: [
        __DIR__.'/../app/Domain/*/Listeners',
    ])

`event:list` 命令可用于列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="event-discovery-in-production"></a>
#### 生产环境中的事件发现

为了提升应用速度，你应当使用 `optimize` 或 `event:cache` Artisan 命令缓存应用中所有监听器的清单。通常应当把该命令作为应用[部署流程](/docs/{{version}}/deployment#optimization)的一部分来执行。框架会使用这份清单来加速事件注册过程。你可以使用 `event:clear` 命令销毁事件缓存。

<a name="manually-registering-events"></a>
### 手动注册事件

借助 `Event` Facade，你可以在应用 `AppServiceProvider` 的 `boot` 方法中手动注册事件及其对应的监听器：

    use App\Domain\Orders\Events\PodcastProcessed;
    use App\Domain\Orders\Listeners\SendPodcastNotification;
    use Illuminate\Support\Facades\Event;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Event::listen(
            PodcastProcessed::class,
            SendPodcastNotification::class,
        );
    }

`event:list` 命令可用于列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="closure-listeners"></a>
### 闭包监听器

监听器通常定义为类；不过，你也可以在应用 `AppServiceProvider` 的 `boot` 方法中手动注册基于闭包的事件监听器：

    use App\Events\PodcastProcessed;
    use Illuminate\Support\Facades\Event;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Event::listen(function (PodcastProcessed $event) {
            // ...
        });
    }

<a name="queuable-anonymous-event-listeners"></a>
#### 可入队的匿名事件监听器

注册基于闭包的事件监听器时，你可以把监听器闭包包裹在 `Illuminate\Events\queueable` 函数中，指示 Laravel 使用[队列](/docs/{{version}}/queues)执行该监听器：

    use App\Events\PodcastProcessed;
    use function Illuminate\Events\queueable;
    use Illuminate\Support\Facades\Event;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Event::listen(queueable(function (PodcastProcessed $event) {
            // ...
        }));
    }

与队列作业一样，你可以使用 `onConnection`、`onQueue` 和 `delay` 方法来自定义队列监听器的执行方式：

    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    })->onConnection('redis')->onQueue('podcasts')->delay(now()->addSeconds(10)));

如果你想处理匿名队列监听器的失败，可以在定义 `queueable` 监听器时向 `catch` 方法提供一个闭包。该闭包会接收到事件实例，以及导致监听器失败的 `Throwable` 实例：

    use App\Events\PodcastProcessed;
    use function Illuminate\Events\queueable;
    use Illuminate\Support\Facades\Event;
    use Throwable;

    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    })->catch(function (PodcastProcessed $event, Throwable $e) {
        // 该队列监听器失败了...
    }));

<a name="wildcard-event-listeners"></a>
#### 通配符事件监听器

你还可以使用 `*` 字符作为通配符参数来注册监听器，从而让同一个监听器捕获多个事件。通配符监听器的第一个参数接收事件名称，第二个参数接收完整的事件数据数组：

    Event::listen('event.*', function (string $eventName, array $data) {
        // ...
    });

<a name="defining-events"></a>
## 定义事件

事件类本质上是一个数据容器，用于承载与事件相关的信息。例如，假设有一个 `App\Events\OrderShipped` 事件接收一个 [Eloquent ORM](/docs/{{version}}/eloquent) 对象：

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
         * 创建一个新的事件实例。
         */
        public function __construct(
            public Order $order,
        ) {}
    }

如你所见，这个事件类不包含任何逻辑。它只是已购买 `App\Models\Order` 实例的容器。该事件使用的 `SerializesModels` Trait 会在事件对象通过 PHP 的 `serialize` 函数被序列化时（例如使用[队列监听器](#queued-event-listeners)时），优雅地序列化其中的各个 Eloquent 模型。

<a name="defining-listeners"></a>
## 定义监听器

接下来，我们来看示例事件对应的监听器。事件监听器在其 `handle` 方法中接收事件实例。`make:listener` Artisan 命令在带 `--event` 选项调用时，会自动导入正确的事件类，并在 `handle` 方法中对该事件做类型提示。在 `handle` 方法中，你可以执行任何响应该事件所需的操作：

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
            // 通过 $event->order 访问订单...
        }
    }

> [!NOTE]
> 你的事件监听器也可以在构造函数中对所需的任何依赖做类型提示。所有事件监听器都通过 Laravel 的[服务容器](/docs/{{version}}/container)解析，因此依赖会被自动注入。

<a name="stopping-the-propagation-of-an-event"></a>
#### 阻止事件继续传播

有时你可能希望阻止某个事件继续传播给其它监听器。为此，你可以在监听器的 `handle` 方法中返回 `false`。

<a name="queued-event-listeners"></a>
## 队列事件监听器

如果你的监听器要执行耗时较慢的任务（例如发送电子邮件或发起 HTTP 请求），把监听器放入队列会很有益处。使用队列监听器之前，请确保已[配置好队列](/docs/{{version}}/queues)，并在服务器或本地开发环境中启动了队列工作进程。

要指定某个监听器应当入队，可以在监听器类中添加 `ShouldQueue` 接口。通过 `make:listener` Artisan 命令生成的监听器已经把该接口导入当前命名空间，因此你可以直接使用：

    <?php

    namespace App\Listeners;

    use App\Events\OrderShipped;
    use Illuminate\Contracts\Queue\ShouldQueue;

    class SendShipmentNotification implements ShouldQueue
    {
        // ...
    }

就是这样！现在，当由该监听器处理的事件被派发时，事件派发器会自动使用 Laravel 的[队列系统](/docs/{{version}}/queues)把监听器加入队列。如果监听器由队列执行时没有抛出异常，那么该队列作业在处理完成后会被自动删除。

<a name="customizing-the-queue-connection-queue-name"></a>
#### 自定义队列连接、名称与延迟

如果你想定制事件监听器的队列连接、队列名称或队列延迟时间，可以在监听器类上定义 `$connection`、`$queue` 或 `$delay` 属性：

    <?php

    namespace App\Listeners;

    use App\Events\OrderShipped;
    use Illuminate\Contracts\Queue\ShouldQueue;

    class SendShipmentNotification implements ShouldQueue
    {
        /**
         * 作业应当被发送到哪个连接的名称。
         *
         * @var string|null
         */
        public $connection = 'sqs';

        /**
         * 作业应当被发送到哪个队列的名称。
         *
         * @var string|null
         */
        public $queue = 'listeners';

        /**
         * 作业被处理前的等待时间（秒）。
         *
         * @var int
         */
        public $delay = 60;
    }

如果你想在运行时定义监听器的队列连接、队列名称或延迟，可以在监听器上定义 `viaConnection`、`viaQueue` 或 `withDelay` 方法：

    /**
     * 获取该监听器的队列连接名称。
     */
    public function viaConnection(): string
    {
        return 'sqs';
    }

    /**
     * 获取该监听器的队列名称。
     */
    public function viaQueue(): string
    {
        return 'listeners';
    }

    /**
     * 获取作业被处理前的等待秒数。
     */
    public function withDelay(OrderShipped $event): int
    {
        return $event->highPriority ? 0 : 60;
    }

<a name="conditionally-queueing-listeners"></a>
#### 有条件地把监听器入队

有时你可能需要根据某些只有在运行时才可用的数据来判断监听器是否应当入队。为此，可以在监听器中添加一个 `shouldQueue` 方法，判断该监听器是否应当入队。如果 `shouldQueue` 方法返回 `false`，该监听器就不会入队：

    <?php

    namespace App\Listeners;

    use App\Events\OrderCreated;
    use Illuminate\Contracts\Queue\ShouldQueue;

    class RewardGiftCard implements ShouldQueue
    {
        /**
         * 向客户赠送礼品卡。
         */
        public function handle(OrderCreated $event): void
        {
            // ...
        }

        /**
         * 判断该监听器是否应当入队。
         */
        public function shouldQueue(OrderCreated $event): bool
        {
            return $event->order->subtotal >= 5000;
        }
    }

<a name="manually-interacting-with-the-queue"></a>
### 手动与队列交互

如果你需要手动访问监听器底层队列作业的 `delete` 和 `release` 方法，可以使用 `Illuminate\Queue\InteractsWithQueue` Trait。生成的监听器默认已导入该 Trait，它提供了对这些方法的访问能力：

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
            if (true) {
                $this->release(30);
            }
        }
    }

<a name="queued-event-listeners-and-database-transactions"></a>
### 队列事件监听器与数据库事务

在数据库事务中派发队列监听器时，队列可能会在数据库事务提交之前就处理它们。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新，可能尚未反映到数据库中。此外，在事务内创建的模型或数据库记录可能尚不存在于数据库中。如果你的监听器依赖这些模型，那么派发该队列监听器的作业被处理时可能出现意外错误。

如果你的队列连接的 `after_commit` 配置选项被设为 `false`，你仍然可以在监听器类上实现 `ShouldQueueAfterCommit` 接口，以指明某个特定的队列监听器应当在所有打开的数据库事务提交之后再派发：

    <?php

    namespace App\Listeners;

    use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
    use Illuminate\Queue\InteractsWithQueue;

    class SendShipmentNotification implements ShouldQueueAfterCommit
    {
        use InteractsWithQueue;
    }

> [!NOTE]
> 若想了解更多如何规避这些问题，请查阅[队列作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的相关文档。

<a name="handling-failed-jobs"></a>
### 处理失败的作业

有时你的队列事件监听器可能会失败。如果队列监听器超出队列工作进程所定义的最大尝试次数，你的监听器上就会被调用 `failed` 方法。`failed` 方法会接收到事件实例，以及导致失败的 `Throwable`：

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

<a name="specifying-queued-listener-maximum-attempts"></a>
#### 指定队列监听器的最大尝试次数

如果你的某个队列监听器遇到错误，你多半不希望它无限重试。因此，Laravel 提供了多种方式来指定监听器可以被尝试多少次或多长时间。

你可以在监听器类上定义一个 `$tries` 属性，指定监听器在被判定为失败之前可以尝试多少次：

    <?php

    namespace App\Listeners;

    use App\Events\OrderShipped;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Queue\InteractsWithQueue;

    class SendShipmentNotification implements ShouldQueue
    {
        use InteractsWithQueue;

        /**
         * 队列监听器可以被尝试的次数。
         *
         * @var int
         */
        public $tries = 5;
    }

除了定义监听器失败前可以尝试多少次之外，你也可以定义一个不再尝试该监听器的时间点。这样一来，监听器就可以在给定时间范围内被尝试任意次数。要定义不再尝试该监听器的时间点，请向监听器类添加一个 `retryUntil` 方法，该方法应当返回一个 `DateTime` 实例：

    use DateTime;

    /**
     * 确定该监听器应当超时的时间点。
     */
    public function retryUntil(): DateTime
    {
        return now()->addMinutes(5);
    }

<a name="specifying-queued-listener-backoff"></a>
#### 指定队列监听器的退避时间

如果你想定制 Laravel 在重试遇到异常的监听器之前应等待多少秒，可以在监听器类上定义一个 `backoff` 属性：

    /**
     * 重试队列监听器之前等待的秒数。
     *
     * @var int
     */
    public $backoff = 3;

如果你需要更复杂的逻辑来决定监听器的退避时间，可以在监听器类上定义一个 `backoff` 方法：

    /**
     * 计算重试队列监听器之前等待的秒数。
     */
    public function backoff(): int
    {
        return 3;
    }

通过让 `backoff` 方法返回一组退避时间值，你可以轻松配置「指数」退避。在这个示例中，第一次重试的延迟为 1 秒，第二次为 5 秒，第三次为 10 秒，若还有更多尝试次数，则之后每次重试都是 10 秒：

    /**
     * 计算重试队列监听器之前等待的秒数。
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [1, 5, 10];
    }

<a name="dispatching-events"></a>
## 派发事件

要派发事件，可以在事件上调用静态的 `dispatch` 方法。该方法由 `Illuminate\Foundation\Events\Dispatchable` Trait 提供。传给 `dispatch` 方法的任何参数都会传递给事件的构造函数：

    <?php

    namespace App\Http\Controllers;

    use App\Events\OrderShipped;
    use App\Http\Controllers\Controller;
    use App\Models\Order;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;

    class OrderShipmentController extends Controller
    {
        /**
         * 发货给定的订单。
         */
        public function store(Request $request): RedirectResponse
        {
            $order = Order::findOrFail($request->order_id);

            // 订单发货逻辑...

            OrderShipped::dispatch($order);

            return redirect('/orders');
        }
    }

如果你需要有条件地派发事件，可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

    OrderShipped::dispatchIf($condition, $order);

    OrderShipped::dispatchUnless($condition, $order);

> [!NOTE]
> 测试时，能够断言某些事件已被派发、而不真正触发它们的监听器会很有帮助。Laravel 的[内置测试辅助方法](#testing)让这件事变得非常轻松。

<a name="dispatching-events-after-database-transactions"></a>
### 在数据库事务之后派发事件

有时你可能希望指示 Laravel 只在当前数据库事务提交之后才派发某个事件。为此，可以在事件类上实现 `ShouldDispatchAfterCommit` 接口。

该接口指示 Laravel 在当前数据库事务提交之前不要派发该事件。如果事务失败，该事件会被丢弃。如果派发事件时没有正在进行数据库事务，该事件会立即被派发：

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
         * 创建一个新的事件实例。
         */
        public function __construct(
            public Order $order,
        ) {}
    }

<a name="event-subscribers"></a>
## 事件订阅者

<a name="writing-event-subscribers"></a>
### 编写事件订阅者

事件订阅者是可以在订阅者类内部订阅多个事件的类，从而让你在单个类中定义多个事件处理器。订阅者应当定义一个 `subscribe` 方法，该方法会接收到一个事件派发器实例。你可以调用该派发器上的 `listen` 方法来注册事件监听器：

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
         * 处理用户登出事件。
         */
        public function handleUserLogout(Logout $event): void {}

        /**
         * 为该订阅者注册监听器。
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

如果你的事件监听器方法就定义在订阅者内部，你可能会发现从订阅者的 `subscribe` 方法返回一个事件与方法名的数组更加方便。Laravel 在注册事件监听器时会自动确定订阅者的类名：

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
         * 处理用户登出事件。
         */
        public function handleUserLogout(Logout $event): void {}

        /**
         * 为该订阅者注册监听器。
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

<a name="registering-event-subscribers"></a>
### 注册事件订阅者

编写好订阅者后，如果其中的处理方法遵循 Laravel 的[事件发现约定](#event-discovery)，Laravel 会自动注册它们。否则，你也可以使用 `Event` Facade 的 `subscribe` 方法手动注册订阅者。通常应当在你的应用 `AppServiceProvider` 的 `boot` 方法中完成这一操作：

    <?php

    namespace App\Providers;

    use App\Listeners\UserEventSubscriber;
    use Illuminate\Support\Facades\Event;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 引导任何应用服务。
         */
        public function boot(): void
        {
            Event::subscribe(UserEventSubscriber::class);
        }
    }

<a name="testing"></a>
## 测试

测试派发事件的代码时，你可能希望指示 Laravel 不要真正执行事件的监听器，因为监听器的代码可以脱离派发相应事件的代码单独测试。当然，要测试监听器本身，你可以在测试中实例化一个监听器实例并直接调用其 `handle` 方法。

借助 `Event` Facade 的 `fake` 方法，你可以阻止监听器执行、执行被测代码，然后使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法断言应用派发了哪些事件：

```php tab=Pest
<?php

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;

test('orders can be shipped', function () {
    Event::fake();

    // 执行订单发货...

    // 断言某个事件已被派发...
    Event::assertDispatched(OrderShipped::class);

    // 断言某个事件被派发了两次...
    Event::assertDispatched(OrderShipped::class, 2);

    // 断言某个事件未被派发...
    Event::assertNotDispatched(OrderFailedToShip::class);

    // 断言没有事件被派发...
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

        // 断言某个事件已被派发...
        Event::assertDispatched(OrderShipped::class);

        // 断言某个事件被派发了两次...
        Event::assertDispatched(OrderShipped::class, 2);

        // 断言某个事件未被派发...
        Event::assertNotDispatched(OrderFailedToShip::class);

        // 断言没有事件被派发...
        Event::assertNothingDispatched();
    }
}
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传入一个闭包，以断言某个满足给定「真值测试」的事件已被派发。只要至少有一个通过真值测试的事件被派发，断言就会成功：

    Event::assertDispatched(function (OrderShipped $event) use ($order) {
        return $event->order->id === $order->id;
    });

如果你只想断言某个事件监听器正在监听给定事件，可以使用 `assertListening` 方法：

    Event::assertListening(
        OrderShipped::class,
        SendShipmentNotification::class
    );

> [!WARNING]
> 调用 `Event::fake()` 后，不会再执行任何事件监听器。因此，如果你的测试使用了依赖事件的模型工厂（例如在模型的 `creating` 事件中创建 UUID），就应当在**使用完工厂之后**再调用 `Event::fake()`。

<a name="faking-a-subset-of-events"></a>
### 伪造部分事件

如果你只想为一组特定事件伪造事件监听器，可以把它们传给 `fake` 或 `fakeFor` 方法：

```php tab=Pest
test('orders can be processed', function () {
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其它事件照常派发...
    $order->update([...]);
});
```

```php tab=PHPUnit
/**
 * 测试订单流程。
 */
public function test_orders_can_be_processed(): void
{
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其它事件照常派发...
    $order->update([...]);
}
```

你可以使用 `except` 方法伪造除一组指定事件之外的所有事件：

    Event::fake()->except([
        OrderCreated::class,
    ]);

<a name="scoped-event-fakes"></a>
### 限定作用域的事件伪造

如果你只想在测试的某一部分中伪造事件监听器，可以使用 `fakeFor` 方法：

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

    // 事件照常派发，观察者也会运行...
    $order->update([...]);
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
     * 测试订单流程。
     */
    public function test_orders_can_be_processed(): void
    {
        $order = Event::fakeFor(function () {
            $order = Order::factory()->create();

            Event::assertDispatched(OrderCreated::class);

            return $order;
        });

        // 事件照常派发，观察者也会运行...
        $order->update([...]);
    }
}
```
