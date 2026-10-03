# 模拟（Mocking）

- [简介](#introduction)
- [模拟对象](#mocking-objects)
- [模拟 Facade](#mocking-facades)
    - [Facade 间谍](#facade-spies)
- [Bus 伪造](#bus-fake)
    - [任务链](#bus-job-chains)
    - [任务批次](#job-batches)
- [事件伪造](#event-fake)
    - [作用域事件伪造](#scoped-event-fakes)
- [HTTP 伪造](#http-fake)
- [邮件伪造](#mail-fake)
- [通知伪造](#notification-fake)
- [队列伪造](#queue-fake)
    - [任务链](#job-chains)
- [存储伪造](#storage-fake)
- [与时间交互](#interacting-with-time)

<a name="introduction"></a>
## 简介

在测试 Laravel 应用时，你可能希望"模拟（mock）"应用的某些部分，使其在给定测试中不会真正执行。例如，在测试一个触发事件的控制器时，你可能希望模拟事件监听器，使其在测试期间不会真正执行。这样你就可以只测试控制器的 HTTP 响应，而无需担心事件监听器的执行，因为事件监听器可以在它们自己的测试用例中进行测试。

Laravel 开箱即提供了用于模拟事件、作业和其他 Facade 的实用方法。这些辅助方法主要在 Mockery 之上提供了一层便利封装，使你无需手动进行复杂的 Mockery 方法调用。

<a name="mocking-objects"></a>
## 模拟对象

在模拟一个将通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)注入应用的对象时，你需要将模拟实例以 `instance` 绑定的方式绑定到容器中。这会指示容器使用你的模拟对象实例，而不是自行构造该对象：

```php tab=PHPUnit
use App\Service;
use Mockery;
use Mockery\MockInterface;

public function test_something_can_be_mocked()
{
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->shouldReceive('process')->once();
        })
    );
}
```

为了更加便捷，你可以使用 Laravel 基础测试类提供的 `mock` 方法。例如，以下示例与上面的示例等价：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

当你只需要模拟对象的少数几个方法时，可以使用 `partialMock` 方法。未被模拟的方法在被调用时将正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

类似地，如果你想[监视（spy）](http://docs.mockery.io/en/latest/reference/spies.html)一个对象，Laravel 基础测试类提供了 `spy` 方法作为 `Mockery::spy` 方法的便捷封装。间谍与模拟类似；不过，间谍会记录间谍与被测代码之间的所有交互，允许你在代码执行后进行断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

<a name="mocking-facades"></a>
## 模拟 Facade

与传统静态方法调用不同，[Facade](/docs/{{version}}/facades)（包括[实时 Facade](/docs/{{version}}/facades#real-time-facades)）可以被模拟。这相比传统静态方法具有巨大优势，赋予你与使用传统依赖注入相同的可测试性。在测试时，你可能经常希望模拟控制器中对某个 Laravel Facade 的调用。例如，考虑以下控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 获取应用所有用户的列表。
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $value = Cache::get('key');

        //
    }
}
```

我们可以使用 `shouldReceive` 方法来模拟对 `Cache` Facade 的调用，该方法会返回一个 [Mockery](https://github.com/padraic/mockery) 模拟实例。由于 Facade 实际上由 Laravel [服务容器](/docs/{{version}}/container)解析和管理，它们比典型的静态类具有更强的可测试性。例如，让我们模拟对 `Cache` Facade 的 `get` 方法的调用：

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function testGetIndex()
    {
        Cache::shouldReceive('get')
                    ->once()
                    ->with('key')
                    ->andReturn('value');

        $response = $this->get('/users');

        // ...
    }
}
```

> **Warning**  
> 你不应该模拟 `Request` Facade。相反，在运行测试时，将所需的输入传入 [HTTP 测试方法](/docs/{{version}}/http-tests)，如 `get` 和 `post`。同样，与其模拟 `Config` Facade，不如在测试中调用 `Config::set` 方法。

<a name="facade-spies"></a>
### Facade 间谍

如果你想[监视](http://docs.mockery.io/en/latest/reference/spies.html)一个 Facade，可以在对应的 Facade 上调用 `spy` 方法。间谍与模拟类似；不过，间谍会记录间谍与被测代码之间的所有交互，允许你在代码执行后进行断言：

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

public function test_values_are_be_stored_in_cache()
{
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->once()->with('name', 'Taylor', 10);
}
```

<a name="bus-fake"></a>
## Bus 伪造

在测试派发作业的代码时，你通常希望断言已派发给定作业，但不实际将其放入队列或执行。这是因为作业的执行通常可以在单独的测试类中进行测试。

你可以使用 `Bus` Facade 的 `fake` 方法来阻止作业被派发到队列。然后，在执行被测代码后，你可以使用 `assertDispatched` 和 `assertNotDispatched` 方法检查应用尝试派发了哪些作业：

```php
<?php

namespace Tests\Feature;

use App\Jobs\ShipOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped()
    {
        Bus::fake();

        // 执行订单发货...

        // 断言已派发作业...
        Bus::assertDispatched(ShipOrder::class);

        // 断言未派发作业...
        Bus::assertNotDispatched(AnotherJob::class);

        // 断言已同步派发作业...
        Bus::assertDispatchedSync(AnotherJob::class);

        // 断言未同步派发作业...
        Bus::assertNotDispatchedSync(AnotherJob::class);

        // 断言在响应发送后派发了作业...
        Bus::assertDispatchedAfterResponse(AnotherJob::class);

        // 断言在响应发送后未派发作业...
        Bus::assertNotDispatchedAfterResponse(AnotherJob::class);

        // 断言未派发任何作业...
        Bus::assertNothingDispatched();
    }
}
```

你可以向可用方法传递一个闭包，以断言派发的作业满足给定的"真值测试"。如果至少有一个派发的作业满足给定的真值测试，则断言成功。例如，你可能希望断言为特定订单派发了作业：

```php
Bus::assertDispatched(function (ShipOrder $job) use ($order) {
    return $job->order->id === $order->id;
});
```

<a name="faking-a-subset-of-jobs"></a>
#### 伪造部分作业

如果只想阻止某些作业被派发，可以将需要伪造的作业传递给 `fake` 方法：

```php
/**
 * 测试订单流程。
 */
public function test_orders_can_be_shipped()
{
    Bus::fake([
        ShipOrder::class,
    ]);

    // ...
}
```

你可以使用 `except` 方法伪造除一组指定作业之外的所有作业：

```php
Bus::fake()->except([
    ShipOrder::class,
]);
```

<a name="bus-job-chains"></a>
### 任务链

可以使用 `Bus` Facade 的 `assertChained` 方法断言已派发一个[作业链](/docs/{{version}}/queues#job-chaining)。`assertChained` 方法接受一个作业链数组作为第一个参数：

```php
use App\Jobs\RecordShipment;
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Support\Facades\Bus;

Bus::assertChained([
    ShipOrder::class,
    RecordShipment::class,
    UpdateInventory::class
]);
```

如上例所示，作业链数组可以是作业类名的数组。不过，你也可以提供实际作业实例的数组。这样做时，Laravel 会确保作业实例与你的应用派发的链中作业具有相同的类和相同的属性值：

```php
Bus::assertChained([
    new ShipOrder,
    new RecordShipment,
    new UpdateInventory,
]);
```

<a name="job-batches"></a>
### 任务批次

可以使用 `Bus` Facade 的 `assertBatched` 方法断言已派发一个[作业批次](/docs/{{version}}/queues#job-batching)。传递给 `assertBatched` 方法的闭包接收一个 `Illuminate\Bus\PendingBatch` 实例，可用于检查批次中的作业：

```php
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;

Bus::assertBatched(function (PendingBatch $batch) {
    return $batch->name == 'import-csv' &&
           $batch->jobs->count() === 10;
});
```

<a name="testing-job-batch-interaction"></a>
#### 测试作业 / 批次交互

此外，你偶尔可能需要测试单个作业与其底层批次的交互。例如，你可能需要测试某个作业是否取消了其批次的进一步处理。为此，你需要通过 `withFakeBatch` 方法将一个伪造批次分配给该作业。`withFakeBatch` 方法返回一个包含作业实例和伪造批次的元组：

```php
[$job, $batch] = (new ShipOrder)->withFakeBatch();

$job->handle();

$this->assertTrue($batch->cancelled());
$this->assertEmpty($batch->added);
```

<a name="event-fake"></a>
## 事件伪造

在测试派发事件的代码时，你可能希望指示 Laravel 不要真正执行事件的监听器。使用 `Event` Facade 的 `fake` 方法，你可以阻止监听器执行，执行被测代码，然后使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法断言应用派发了哪些事件：

```php
<?php

namespace Tests\Feature;

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 测试订单发货。
     */
    public function test_orders_can_be_shipped()
    {
        Event::fake();

        // 执行订单发货...

        // 断言已派发事件...
        Event::assertDispatched(OrderShipped::class);

        // 断言事件被派发了两次...
        Event::assertDispatched(OrderShipped::class, 2);

        // 断言未派发事件...
        Event::assertNotDispatched(OrderFailedToShip::class);

        // 断言未派发任何事件...
        Event::assertNothingDispatched();
    }
}
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传递一个闭包，以断言派发的事件满足给定的"真值测试"。如果至少有一个派发的事件满足给定的真值测试，则断言成功：

```php
Event::assertDispatched(function (OrderShipped $event) use ($order) {
    return $event->order->id === $order->id;
});
```

如果你只想断言某个事件监听器正在监听给定事件，可以使用 `assertListening` 方法：

```php
Event::assertListening(
    OrderShipped::class,
    SendShipmentNotification::class
);
```

> **Warning**  
> 调用 `Event::fake()` 后，不会执行任何事件监听器。因此，如果你的测试使用了依赖事件的模型工厂，例如在模型的 `creating` 事件期间创建 UUID，你应该在使用工厂**之后**调用 `Event::fake()`。

<a name="faking-a-subset-of-events"></a>
#### 伪造部分事件

如果只想为特定一组事件伪造事件监听器，可以将它们传递给 `fake` 或 `fakeFor` 方法：

```php
/**
 * 测试订单流程。
 */
public function test_orders_can_be_processed()
{
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常派发...
    $order->update([...]);
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

如果只想为测试的某一部分伪造事件监听器，可以使用 `fakeFor` 方法：

```php
<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 测试订单流程。
     */
    public function test_orders_can_be_processed()
    {
        $order = Event::fakeFor(function () {
            $order = Order::factory()->create();

            Event::assertDispatched(OrderCreated::class);

            return $order;
        });

        // 事件正常派发，观察者将运行...
        $order->update([...]);
    }
}
```

<a name="http-fake"></a>
## HTTP 伪造

`Http` Facade 的 `fake` 方法允许你指示 HTTP 客户端在发起请求时返回桩化/虚拟响应。有关伪造出站 HTTP 请求的更多信息，请查阅 [HTTP 客户端测试文档](/docs/{{version}}/http-client#testing)。

<a name="mail-fake"></a>
## 邮件伪造

你可以使用 `Mail` Facade 的 `fake` 方法来阻止邮件被发送。通常，发送邮件与你实际测试的代码无关。很可能，只需断言 Laravel 被指示发送了给定的可邮寄对象即可。

调用 `Mail` Facade 的 `fake` 方法后，你可以断言已指示将[可邮寄对象（mailable）](/docs/{{version}}/mail)发送给用户，甚至检查可邮寄对象接收的数据：

```php
<?php

namespace Tests\Feature;

use App\Mail\OrderShipped;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped()
    {
        Mail::fake();

        // 执行订单发货...

        // 断言未发送任何可邮寄对象...
        Mail::assertNothingSent();

        // 断言已发送可邮寄对象...
        Mail::assertSent(OrderShipped::class);

        // 断言可邮寄对象被发送了两次...
        Mail::assertSent(OrderShipped::class, 2);

        // 断言未发送可邮寄对象...
        Mail::assertNotSent(AnotherMailable::class);
    }
}
```

如果你将可邮寄对象放入队列在后台发送，应该使用 `assertQueued` 方法而非 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);

Mail::assertNotQueued(OrderShipped::class);

Mail::assertNothingQueued();
```

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传递一个闭包，以断言发送的可邮寄对象满足给定的"真值测试"。如果至少有一个发送的可邮寄对象满足给定的真值测试，则断言成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

调用 `Mail` Facade 的断言方法时，所提供闭包接收的可邮寄对象实例暴露了用于检查可邮寄对象的实用方法：

```php
Mail::assertSent(OrderShipped::class, function ($mail) use ($user) {
    return $mail->hasTo($user->email) &&
           $mail->hasCc('...') &&
           $mail->hasBcc('...') &&
           $mail->hasReplyTo('...') &&
           $mail->hasFrom('...') &&
           $mail->hasSubject('...');
});
```

可邮寄对象实例还包含几个用于检查可邮寄对象附件的实用方法：

```php
use Illuminate\Mail\Mailables\Attachment;

Mail::assertSent(OrderShipped::class, function ($mail) {
    return $mail->hasAttachment(
        Attachment::fromPath('/path/to/file')
                ->as('name.pdf')
                ->withMime('application/pdf')
    );
});

Mail::assertSent(OrderShipped::class, function ($mail) {
    return $mail->hasAttachment(
        Attachment::fromStorageDisk('s3', '/path/to/file')
    );
});

Mail::assertSent(OrderShipped::class, function ($mail) use ($pdfData) {
    return $mail->hasAttachment(
        Attachment::fromData(fn () => $pdfData, 'name.pdf')
    );
});
```

你可能已经注意到，断言未发送邮件的方法有两个：`assertNotSent` 和 `assertNotQueued`。有时你可能希望断言没有邮件被发送**或**入队。为此，你可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

<a name="testing-mailable-content"></a>
#### 测试可邮寄对象内容

我们建议将可邮寄对象内容的测试与断言给定可邮寄对象已"发送"给特定用户的测试分开进行。要了解如何测试可邮寄对象的内容，请查阅我们的[测试可邮寄对象](/docs/{{version}}/mail#testing-mailables)文档。

<a name="notification-fake"></a>
## 通知伪造

你可以使用 `Notification` Facade 的 `fake` 方法来阻止通知被发送。通常，发送通知与你实际测试的代码无关。很可能，只需断言 Laravel 被指示发送了给定的通知即可。

调用 `Notification` Facade 的 `fake` 方法后，你可以断言已指示将[通知](/docs/{{version}}/notifications)发送给用户，甚至检查通知接收的数据：

```php
<?php

namespace Tests\Feature;

use App\Notifications\OrderShipped;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped()
    {
        Notification::fake();

        // 执行订单发货...

        // 断言未发送任何通知...
        Notification::assertNothingSent();

        // 断言已向给定用户发送通知...
        Notification::assertSentTo(
            [$user], OrderShipped::class
        );

        // 断言未发送通知...
        Notification::assertNotSentTo(
            [$user], AnotherNotification::class
        );

        // 断言发送了给定数量的通知...
        Notification::assertCount(3);
    }
}
```

你可以向 `assertSentTo` 或 `assertNotSentTo` 方法传递一个闭包，以断言发送的通知满足给定的"真值测试"。如果至少有一个发送的通知满足给定的真值测试，则断言成功：

```php
Notification::assertSentTo(
    $user,
    function (OrderShipped $notification, $channels) use ($order) {
        return $notification->order->id === $order->id;
    }
);
```

<a name="on-demand-notifications"></a>
#### 按需通知

如果你测试的代码发送[按需通知（on-demand notifications）](/docs/{{version}}/notifications#on-demand-notifications)，可以通过 `assertSentOnDemand` 方法测试是否发送了按需通知：

```php
Notification::assertSentOnDemand(OrderShipped::class);
```

通过向 `assertSentOnDemand` 方法传递闭包作为第二个参数，你可以确定按需通知是否发送到了正确的"路由"地址：

```php
Notification::assertSentOnDemand(
    OrderShipped::class,
    function ($notification, $channels, $notifiable) use ($user) {
        return $notifiable->routes['mail'] === $user->email;
    }
);
```

<a name="queue-fake"></a>
## 队列伪造

你可以使用 `Queue` Facade 的 `fake` 方法来阻止队列作业被推送到队列。很可能，只需断言 Laravel 被指示将给定作业推送到队列即可，因为队列作业本身可以在另一个测试类中进行测试。

调用 `Queue` Facade 的 `fake` 方法后，你可以断言应用尝试将作业推送到队列：

```php
<?php

namespace Tests\Feature;

use App\Jobs\AnotherJob;
use App\Jobs\FinalJob;
use App\Jobs\ShipOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped()
    {
        Queue::fake();

        // 执行订单发货...

        // 断言未推送任何作业...
        Queue::assertNothingPushed();

        // 断言作业被推送到给定队列...
        Queue::assertPushedOn('queue-name', ShipOrder::class);

        // 断言作业被推送了两次...
        Queue::assertPushed(ShipOrder::class, 2);

        // 断言未推送作业...
        Queue::assertNotPushed(AnotherJob::class);
    }
}
```

你可以向 `assertPushed` 或 `assertNotPushed` 方法传递一个闭包，以断言推送的作业满足给定的"真值测试"。如果至少有一个推送的作业满足给定的真值测试，则断言成功：

```php
Queue::assertPushed(function (ShipOrder $job) use ($order) {
    return $job->order->id === $order->id;
});
```

如果你只需要伪造特定作业，同时允许其他作业正常执行，可以将需要伪造的作业类名传递给 `fake` 方法：

```php
public function test_orders_can_be_shipped()
{
    Queue::fake([
        ShipOrder::class,
    ]);

    // 执行订单发货...

    // 断言作业被推送了两次...
    Queue::assertPushed(ShipOrder::class, 2);
}
```

<a name="job-chains"></a>
### 任务链

可以使用 `Queue` Facade 的 `assertPushedWithChain` 和 `assertPushedWithoutChain` 方法检查已推送作业的作业链。`assertPushedWithChain` 方法接受主作业作为第一个参数，作业链数组作为第二个参数：

```php
use App\Jobs\RecordShipment;
use App\Jobs\ShipOrder;
use App\Jobs\UpdateInventory;
use Illuminate\Support\Facades\Queue;

Queue::assertPushedWithChain(ShipOrder::class, [
    RecordShipment::class,
    UpdateInventory::class
]);
```

如上例所示，作业链数组可以是作业类名的数组。不过，你也可以提供实际作业实例的数组。这样做时，Laravel 会确保作业实例与你的应用派发的链中作业具有相同的类和相同的属性值：

```php
Queue::assertPushedWithChain(ShipOrder::class, [
    new RecordShipment,
    new UpdateInventory,
]);
```

你可以使用 `assertPushedWithoutChain` 方法断言作业被推送时没有作业链：

```php
Queue::assertPushedWithoutChain(ShipOrder::class);
```

<a name="storage-fake"></a>
## 存储伪造

`Storage` Facade 的 `fake` 方法允许你轻松生成伪造磁盘，结合 `Illuminate\Http\UploadedFile` 类的文件生成工具，大大简化了文件上传的测试。例如：

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_albums_can_be_uploaded()
    {
        Storage::fake('photos');

        $response = $this->json('POST', '/photos', [
            UploadedFile::fake()->image('photo1.jpg'),
            UploadedFile::fake()->image('photo2.jpg')
        ]);

        // 断言一个或多个文件已存储...
        Storage::disk('photos')->assertExists('photo1.jpg');
        Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

        // 断言一个或多个文件未存储...
        Storage::disk('photos')->assertMissing('missing.jpg');
        Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

        // 断言给定目录为空...
        Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');
    }
}
```

默认情况下，`fake` 方法会删除其临时目录中的所有文件。如果你想保留这些文件，可以使用 "persistentFake" 方法。有关测试文件上传的更多信息，请查阅 [HTTP 测试文档中关于文件上传的信息](/docs/{{version}}/http-tests#testing-file-uploads)。

> **Warning**  
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

<a name="interacting-with-time"></a>
## 与时间交互

在测试时，你偶尔可能需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助函数返回的时间。值得庆幸的是，Laravel 基础功能测试类包含允许你操纵当前时间的辅助方法：

```php tab=PHPUnit
use Illuminate\Support\Carbon;

public function testTimeCanBeManipulated()
{
    // 向未来穿越...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 冻结时间，并在执行闭包后恢复正常时间...
    $this->freezeTime(function (Carbon $time) {
        // ...
    });

    // 向过去穿越...
    $this->travel(-5)->hours();

    // 穿越到指定时间...
    $this->travelTo(now()->subHours(6));

    // 返回当前时间...
    $this->travelBack();
}
```