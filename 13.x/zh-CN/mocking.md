# 模拟（Mocking）

- [简介](#introduction)
- [模拟对象](#mocking-objects)
- [模拟 Facade](#mocking-facades)
    - [Facade 间谍](#facade-spies)
- [与时间交互](#interacting-with-time)

<a name="introduction"></a>
## 简介

在测试 Laravel 应用时，你可能希望"模拟"应用的某些部分，使它们在给定测试期间不会被真正执行。例如，在测试一个会触发事件的控制器时，你可能希望模拟事件监听器，使它们在测试期间不会真正执行。这样你就能只测试控制器的 HTTP 响应，而无需担心事件监听器的执行，因为事件监听器可以在各自的测试用例中进行测试。

Laravel 开箱即用地提供了模拟事件、任务及其他 Facade 的实用方法。这些辅助方法主要为 Mockery 提供了一层便捷封装，因此你无需手动编写复杂的 Mockery 方法调用。

<a name="mocking-objects"></a>
## 模拟对象

当模拟一个将通过 Laravel [服务容器](/docs/{{version}}/container)注入到应用中的对象时，你需要将模拟实例作为 `instance` 绑定绑定到容器中。这将指示容器使用你的对象模拟实例，而不是自行构造对象：

```php tab=Pest
use App\Service;
use Mockery;
use Mockery\MockInterface;

test('something can be mocked', function () {
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->expects('process');
        })
    );
});
```

```php tab=PHPUnit
use App\Service;
use Mockery;
use Mockery\MockInterface;

public function test_something_can_be_mocked(): void
{
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->expects('process');
        })
    );
}
```

为了让操作更加便捷，你可以使用 Laravel 基础测试用例类提供的 `mock` 方法。例如，下面的示例与上面的示例等价：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

当你只需要模拟对象的少数几个方法时，可以使用 `partialMock` 方法。未被模拟的方法在被调用时会正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

同样，如果你想对对象进行[监视（spy）](http://docs.mockery.io/en/latest/reference/spies.html)，Laravel 的基础测试用例类提供了 `spy` 方法，作为 `Mockery::spy` 方法的便捷封装。Spy 与 mock 类似；不过，spy 会记录 spy 与被测试代码之间的所有交互，使你能在代码执行后做出断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

<a name="mocking-facades"></a>
## 模拟 Facade

与传统的静态方法调用不同，[Facade](/docs/{{version}}/facades)（包括[实时 Facade](/docs/{{version}}/facades#real-time-facades)）是可以被模拟的。与传统的静态方法相比，这带来了巨大的优势，并为你提供了与使用传统依赖注入时相同的可测试性。在测试时，你可能经常希望模拟控制器中发生的对 Laravel Facade 的调用。例如，考虑下面的控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * Retrieve a list of all users of the application.
     */
    public function index(): array
    {
        $value = Cache::get('key');

        return [
            // ...
        ];
    }
}
```

我们可以使用 `expects` 方法模拟对 `Cache` Facade 的调用，该方法会返回一个 [Mockery](https://github.com/padraic/mockery) mock 实例。由于 Facade 实际上是由 Laravel [服务容器](/docs/{{version}}/container)解析和管理的，它们比典型的静态类具有更高的可测试性。例如，让我们模拟对 `Cache` Facade 的 `get` 方法的调用：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('get index', function () {
    Cache::expects('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/users');

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_get_index(): void
    {
        Cache::expects('get')
            ->with('key')
            ->andReturn('value');

        $response = $this->get('/users');

        // ...
    }
}
```

> [!WARNING]
> 你不应该模拟 `Request` Facade。相反，在运行测试时，将所需的输入传递给 [HTTP 测试方法](/docs/{{version}}/http-tests)，例如 `get` 和 `post`。同样，与其模拟 `Config` Facade，不如在测试中调用 `Config::set` 方法。

<a name="facade-spies"></a>
### Facade 间谍

如果你想对 Facade 进行[监视（spy）](http://docs.mockery.io/en/latest/reference/spies.html)，可以在相应的 Facade 上调用 `spy` 方法。Spy 与 mock 类似；不过，spy 会记录 spy 与被测试代码之间的所有交互，使你能在代码执行后做出断言：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('values are stored in cache', function () {
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->with('name', 'Taylor', 10);
});
```

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

public function test_values_are_stored_in_cache(): void
{
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->with('name', 'Taylor', 10);
}
```

<a name="interacting-with-time"></a>
## 与时间交互

在测试时，你可能偶尔需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助函数返回的时间。幸运的是，Laravel 的基础功能测试类包含了允许你操控当前时间的辅助方法：

```php tab=Pest
test('time can be manipulated', function () {
    // Travel into the future...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // Travel into the past...
    $this->travel(-5)->hours();

    // Travel to an explicit time...
    $this->travelTo(now()->minus(hours: 6));

    // Return back to the present time...
    $this->travelBack();
});
```

```php tab=PHPUnit
public function test_time_can_be_manipulated(): void
{
    // Travel into the future...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // Travel into the past...
    $this->travel(-5)->hours();

    // Travel to an explicit time...
    $this->travelTo(now()->minus(hours: 6));

    // Return back to the present time...
    $this->travelBack();
}
```

你还可以向各种时间旅行方法提供闭包。闭包会在时间冻结于指定时刻的情况下被调用。闭包执行完毕后，时间将恢复正常流动：

```php
$this->travel(5)->days(function () {
    // Test something five days into the future...
});

$this->travelTo(now()->mins(days: 10), function () {
    // Test something during a given moment...
});
```

`freezeTime` 方法可用于冻结当前时间。同样，`freezeSecond` 方法会冻结当前时间，但会从当前秒的开始时刻冻结：

```php
use Illuminate\Support\Carbon;

// Freeze time and resume normal time after executing closure...
$this->freezeTime(function (Carbon $time) {
    // ...
});

// Freeze time at the current second and resume normal time after executing closure...
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

正如你所预料的那样，上面讨论的所有方法主要适用于测试对时间敏感的应用行为，例如锁定讨论论坛中不活跃的帖子：

```php tab=Pest
use App\Models\Thread;

test('forum threads lock after one week of inactivity', function () {
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    expect($thread->isLockedByInactivity())->toBeTrue();
});
```

```php tab=PHPUnit
use App\Models\Thread;

public function test_forum_threads_lock_after_one_week_of_inactivity()
{
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    $this->assertTrue($thread->isLockedByInactivity());
}
```
