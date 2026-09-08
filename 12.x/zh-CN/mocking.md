# 模拟（Mocking）

- [简介](#introduction)
- [模拟对象](#mocking-objects)
- [模拟 Facade](#mocking-facades)
    - [Facade 侦听](#facade-spies)
- [与时间交互](#interacting-with-time)

<a name="introduction"></a>
## 简介

在测试 Laravel 应用时，你可能希望「模拟（mock）」应用的某些部分，使它们在特定测试期间不会真正执行。例如，在测试一个分发事件的控制器时，你可能希望模拟事件监听器，使其在测试期间不会被真正执行。这样你就可以只测试控制器的 HTTP 响应，而无需担心事件监听器的执行，因为事件监听器可以在它们自己的测试用例中进行测试。

Laravel 为模拟事件、任务和其他 Facade 提供了开箱即用的实用方法。这些辅助方法主要是在 Mockery 之上提供了一层便利封装，让你无需手动进行复杂的 Mockery 方法调用。

<a name="mocking-objects"></a>
## 模拟对象

当模拟一个将通过 Laravel [服务容器](/docs/{{version}}/container)注入到应用中的对象时，你需要将模拟实例以 `instance` 绑定的形式绑定到容器中。这会指示容器使用你的模拟实例，而不是自行构造该对象：

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

为了简化这一操作，你可以使用 Laravel 基础测试用例类提供的 `mock` 方法。例如，下面的示例与上面的示例等价：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

当你只需要模拟对象的少数几个方法时，可以使用 `partialMock` 方法。未被模拟的方法在被调用时仍会正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

类似地，如果你想[侦听（spy）](http://docs.mockery.io/en/latest/reference/spies.html)某个对象，Laravel 的基础测试用例类提供了 `spy` 方法，作为 `Mockery::spy` 方法的便捷封装。侦听器（spy）与模拟对象类似；不过，侦听器会记录它与被测代码之间的所有交互，让你能够在代码执行之后再进行断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

<a name="mocking-facades"></a>
## 模拟 Facade

与传统的静态方法调用不同，[Facade](/docs/{{version}}/facades)（包括[实时 Facade](/docs/{{version}}/facades#real-time-facades)）是可以被模拟的。相比传统静态方法，这具有巨大的优势，让你获得与传统依赖注入相同的可测试性。测试时，你可能经常需要模拟控制器中对某个 Laravel Facade 的调用。例如，来看下面的控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 检索应用所有用户的列表。
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

我们可以使用 `expects` 方法来模拟对 `Cache` Facade 的调用，该方法会返回一个 [Mockery](https://github.com/padraic/mockery) 模拟实例。由于 Facade 实际上是由 Laravel [服务容器](/docs/{{version}}/container)解析和管理的，它们比典型的静态类具有更好的可测试性。例如，让我们模拟对 `Cache` Facade 的 `get` 方法的调用：

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
> 你不应该模拟 `Request` Facade。相反，在运行测试时，请将你想要的输入传给 `get`、`post` 等 [HTTP 测试方法](/docs/{{version}}/http-tests)。同样，与其模拟 `Config` Facade，不如在测试中直接调用 `Config::set` 方法。

<a name="facade-spies"></a>
### Facade 侦听

如果你想[侦听（spy）](http://docs.mockery.io/en/latest/reference/spies.html)某个 Facade，可以在相应的 Facade 上调用 `spy` 方法。侦听器与模拟对象类似；不过，侦听器会记录它与被测代码之间的所有交互，让你能够在代码执行之后再进行断言：

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

测试时，你有时可能需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助函数返回的时间。好在 Laravel 的基础功能测试类内置了一些辅助方法，允许你操纵当前时间：

```php tab=Pest
test('time can be manipulated', function () {
    // 前进到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 回到过去...
    $this->travel(-5)->hours();

    // 前进到指定时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
});
```

```php tab=PHPUnit
public function test_time_can_be_manipulated(): void
{
    // 前进到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 回到过去...
    $this->travel(-5)->hours();

    // 前进到指定时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
}
```

你也可以向各种时间穿梭方法传入一个闭包。闭包执行时，时间会被冻结在指定时刻。闭包执行完毕后，时间将恢复正常：

```php
$this->travel(5)->days(function () {
    // 测试未来五天的某件事...
});

$this->travelTo(now()->mins(days: 10), function () {
    // 测试给定时刻的某件事...
});
```

`freezeTime` 方法可用于冻结当前时间。类似地，`freezeSecond` 方法也会冻结当前时间，但是冻结在当前秒的开始时刻：

```php
use Illuminate\Support\Carbon;

// 冻结时间，并在闭包执行完毕后恢复正常时间...
$this->freezeTime(function (Carbon $time) {
    // ...
});

// 将时间冻结在当前秒，并在闭包执行完毕后恢复正常时间...
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

正如你所料，上面讨论的所有方法主要用于测试对时间敏感的应用行为，例如锁定论坛中不活跃的帖子：

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
