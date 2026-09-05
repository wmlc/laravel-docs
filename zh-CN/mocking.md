# 模拟（Mocking）

## 简介

在测试 Laravel 应用时，你可能希望对应用的某些方面进行"模拟（mock）"，使它们在特定测试期间不会真正执行。例如，当测试一个派发事件的控制器时，你可能希望模拟事件监听器，使它们在测试期间不会真正执行。这样，你只需测试控制器的 HTTP 响应，而无需担心事件监听器的执行，因为事件监听器可以在其自身的测试用例中进行测试。

Laravel 开箱即用地提供了用于模拟事件、任务以及其他 Facade 的实用方法。这些辅助方法本质上是在 Mockery 之上提供了一层便捷封装，因此你无需手动进行复杂的 Mockery 方法调用。

## 模拟对象

当模拟一个将通过 Laravel 服务容器（Service Container）注入到应用的对象时，你需要将模拟实例以 `instance` 绑定的形式绑定到容器中。这会指示容器使用你模拟的对象实例，而不是自行构造该对象：

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

为了让这一过程更方便，你可以使用 Laravel 基础测试用例类提供的 `mock` 方法。例如，下面的示例与上面的示例等价：

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

类似地，如果你想对某个对象进行监视（spy），Laravel 基础测试用例类提供了 `spy` 方法，作为 `Mockery::spy` 方法的便捷封装。spy 与 mock 类似，但 spy 会记录 spy 与被测代码之间的任何交互，让你能够在代码执行后做出断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

## 模拟 Facade

与传统的静态方法调用不同，Facade（包括实时 Facade）可以被模拟。这相比传统的静态方法具有显著优势，并赋予你与使用传统依赖注入时相同的可测试性。在测试时，你可能经常希望模拟控制器中对某个 Laravel Facade 的调用。例如，考虑以下控制器动作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 获取应用所有用户的列表。
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

我们可以通过 `expects` 方法来模拟对 `Cache` Facade 的调用，该方法会返回一个 Mockery mock 的实例。由于 Facade 实际上由 Laravel 服务容器（Service Container）解析和管理，它们比典型的静态类具有更强的可测试性。例如，我们来模拟对 `Cache` Facade 的 `get` 方法的调用：

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
> 你不应模拟 `Request` Facade。相反，在运行测试时，应将你期望的输入传入 `get`、`post` 等 HTTP 测试方法。同理，与其模拟 `Config` Facade，不如在测试中调用 `Config::set` 方法。

### Facade 间谍

如果你想对某个 Facade 进行监视（spy），可以调用对应 Facade 的 `spy` 方法。spy 与 mock 类似，但 spy 会记录 spy 与被测代码之间的任何交互，让你能够在代码执行后做出断言：

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

## 与时间交互

在测试时，你有时需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助方法返回的时间。值得庆幸的是，Laravel 基础功能测试类包含了允许你操控当前时间的辅助方法：

```php tab=Pest
test('time can be manipulated', function () {
    // 穿越到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 穿越到过去...
    $this->travel(-5)->hours();

    // 穿越到指定时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
});
```

```php tab=PHPUnit
public function test_time_can_be_manipulated(): void
{
    // 穿越到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 穿越到过去...
    $this->travel(-5)->hours();

    // 穿越到指定时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
}
```

你还可以向各种时间穿越方法传入一个闭包（closure）。该闭包会在时间冻结于指定时刻的情况下被调用。闭包执行完毕后，时间将恢复正常流转：

```php
$this->travel(5)->days(function () {
    // 测试未来五天后的情况...
});

$this->travelTo(now()->mins(days: 10), function () {
    // 测试特定时刻的情况...
});
```

`freezeTime` 方法可用于冻结当前时间。类似地，`freezeSecond` 方法也会冻结当前时间，但会冻结在当前秒的起始时刻：

```php
use Illuminate\Support\Carbon;

// 冻结时间，并在闭包执行后恢复正常时间...
$this->freezeTime(function (Carbon $time) {
    // ...
});

// 冻结在当前秒，并在闭包执行后恢复正常时间...
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

正如你所预期的，上述所有方法主要用于测试对时间敏感的应用行为，例如锁定论坛中处于非活跃状态的帖子：

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
