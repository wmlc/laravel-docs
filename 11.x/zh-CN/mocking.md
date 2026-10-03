# 模拟

- [简介](#introduction)
- [模拟对象](#mocking-objects)
- [模拟 Facade](#mocking-facades)
    - [Facade 探针](#facade-spies)
- [与时间交互](#interacting-with-time)

<a name="introduction"></a>
## 简介

测试 Laravel 应用时，你可能希望"模拟"应用的某些方面，使它们在某个测试中不被真正执行。例如，测试一个派发事件的控制器时，你可能希望模拟事件监听器，使它们在测试中不被真正执行。这样你就可以只测试控制器的 HTTP 响应，而不必担心事件监听器的执行，因为事件监听器可以在它们自己的测试用例中测试。

Laravel 开箱即用地提供了用于模拟事件、任务和其他 Facade 的便捷方法。这些辅助方法主要在 Mockery 之上提供了一层便利封装，让你不必手动调用复杂的 Mockery 方法。

<a name="mocking-objects"></a>
## 模拟对象

模拟一个将通过 Laravel [服务容器（Service Container）](/docs/{{version}}/container)注入到应用中的对象时，你需要把模拟实例作为 `instance` 绑定绑定到容器中。这会指示容器使用该对象的模拟实例，而不是自行构造该对象：

```php tab=Pest
use App\Service;
use Mockery;
use Mockery\MockInterface;

test('something can be mocked', function () {
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->shouldReceive('process')->once();
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
            $mock->shouldReceive('process')->once();
        })
    );
}
```

为了让这件事更方便，你可以使用 Laravel 基础测试用例类提供的 `mock` 方法。例如，下面的例子与上面的例子等价：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

如果你只需要模拟对象的少数几个方法，可以使用 `partialMock` 方法。未被模拟的方法在被调用时会正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->shouldReceive('process')->once();
});
```

同理，如果你想对某个对象[设置探针](http://docs.mockery.io/en/latest/reference/spies.html)，Laravel 基础测试用例类提供了 `spy` 方法作为 `Mockery::spy` 方法的便捷封装。探针与模拟类似；不过探针会记录探针与被测试代码之间的任何交互，让你在代码执行完毕后做出断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

<a name="mocking-facades"></a>
## 模拟 Facade

与传统的静态方法调用不同，[Facade](/docs/{{version}}/facades)（包括[实时 Facade](/docs/{{version}}/facades#real-time-facades)）可以被模拟。这相比传统静态方法带来巨大优势，让你享有与传统依赖注入相同的可测试性。测试时，你可能经常想模拟控制器中对某个 Laravel Facade 的调用。例如，考虑以下控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 获取应用中所有用户的列表。
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

我们可以使用 `shouldReceive` 方法模拟对 `Cache` Facade 的调用，该方法会返回一个 [Mockery](https://github.com/padraic/mockery) 模拟对象。由于 Facade 实际上由 Laravel [服务容器](/docs/{{version}}/container)解析和管理，它们的可测试性远高于典型的静态类。例如，让我们模拟对 `Cache` Facade 的 `get` 方法的调用：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('get index', function () {
    Cache::shouldReceive('get')
        ->once()
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
        Cache::shouldReceive('get')
            ->once()
            ->with('key')
            ->andReturn('value');

        $response = $this->get('/users');

        // ...
    }
}
```

> [!WARNING]
> 你不应模拟 `Request` Facade，而应在运行测试时把所需输入传给 `get` 和 `post` 等 [HTTP 测试方法](/docs/{{version}}/http-tests)。同理，不要模拟 `Config` Facade，而应在测试中调用 `Config::set` 方法。

<a name="facade-spies"></a>
### Facade 探针

如果你想对某个 Facade [设置探针](http://docs.mockery.io/en/latest/reference/spies.html)，可以在相应的 Facade 上调用 `spy` 方法。探针与模拟类似；不过探针会记录探针与被测试代码之间的任何交互，让你在代码执行完毕后做出断言：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('values are be stored in cache', function () {
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->once()->with('name', 'Taylor', 10);
});
```

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

public function test_values_are_be_stored_in_cache(): void
{
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->once()->with('name', 'Taylor', 10);
}
```

<a name="interacting-with-time"></a>
## 与时间交互

测试时，你可能偶尔需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助函数返回的时间。幸运的是，Laravel 基础功能测试类包含了一些辅助方法，让你能够操纵当前时间：

```php tab=Pest
test('time can be manipulated', function () {
    // 前往未来……
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 前往过去……
    $this->travel(-5)->hours();

    // 前往某个明确的时间……
    $this->travelTo(now()->subHours(6));

    // 回到当前时间……
    $this->travelBack();
});
```

```php tab=PHPUnit
public function test_time_can_be_manipulated(): void
{
    // 前往未来……
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 前往过去……
    $this->travel(-5)->hours();

    // 前往某个明确的时间……
    $this->travelTo(now()->subHours(6));

    // 回到当前时间……
    $this->travelBack();
}
```

你也可以向各个时间旅行方法提供一个闭包。该闭包会在时间冻结于指定时间点的情况下被调用。闭包执行完毕后，时间会恢复正常：

```php
$this->travel(5)->days(function () {
    // 测试五天之后的事情……
});

$this->travelTo(now()->subDays(10), function () {
    // 测试某个特定时刻的事情……
});
```

`freezeTime` 方法可用于冻结当前时间。同理，`freezeSecond` 方法会冻结当前时间，但定位到当前这一秒的开始：

```php
use Illuminate\Support\Carbon;

// 冻结时间，并在执行闭包后恢复正常时间……
$this->freezeTime(function (Carbon $time) {
    // ...
});

// 在当前秒处冻结时间，并在执行闭包后恢复正常时间……
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

不出所料，上面讨论的所有方法主要适用于测试对时间敏感的应用行为，例如在论坛中锁定非活跃帖子：

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
