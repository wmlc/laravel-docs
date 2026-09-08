# Facades

- [简介](#introduction)
- [何时使用 Facade](#when-to-use-facades)
    - [Facade 与依赖注入](#facades-vs-dependency-injection)
    - [Facade 与辅助函数](#facades-vs-helper-functions)
- [Facade 的工作原理](#how-facades-work)
- [实时 Facade](#real-time-facades)
- [Facade 类参考](#facade-class-reference)

<a name="introduction"></a>
## 简介

在 Laravel 文档中，你会看到许多通过 "facade" 与 Laravel 功能交互的代码示例。Facade 为应用服务容器（Service Container）中可用的类提供了 "静态" 接口。Laravel 自带许多 facade，几乎可以访问 Laravel 的全部功能。

Laravel 的 facade 充当服务容器中底层类的 "静态代理"，在提供简洁、富有表现力的语法优势的同时，比传统静态方法更具可测试性与灵活性。如果你不完全理解 facade 的工作原理也完全没问题——顺其自然，继续学习 Laravel 即可。

Laravel 的所有 facade 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以像下面这样轻松访问某个 facade：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在 Laravel 文档中，许多示例都会使用 facade 来演示框架的各种功能。

<a name="helper-functions"></a>
#### 辅助函数

为了补充 facade，Laravel 提供了一系列全局 "辅助函数"，让你更轻松地与 Laravel 常用功能交互。你可能会用到的一些常见辅助函数包括 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都在对应的功能文档中有所说明；完整的列表可在专门的[辅助函数文档](/docs/{{version}}/helpers)中查看。

例如，我们不必使用 `Illuminate\Support\Facades\Response` facade 来生成 JSON 响应，而只需使用 `response` 函数。由于辅助函数是全局可用的，你无需导入任何类即可使用它们：

```php
use Illuminate\Support\Facades\Response;

Route::get('/users', function () {
    return Response::json([
        // ...
    ]);
});

Route::get('/users', function () {
    return response()->json([
        // ...
    ]);
});
```

<a name="when-to-use-facades"></a>
## 何时使用 Facade

Facade 有许多优点。它们提供简洁、易记的语法，让你无需记住必须手动注入或配置的长类名即可使用 Laravel 的功能。此外，由于它们独特地利用了 PHP 的动态方法，因此易于测试。

不过，使用 facade 时仍需谨慎。Facade 的主要隐患是类的 "职责蔓延"。由于 facade 使用起来非常简便且无需注入，你很容易让类不断膨胀，并在单个类中使用大量 facade。在使用依赖注入时，庞大的构造函数会给视觉上的反馈，提示你的类过大，从而缓解这种可能的隐患。因此，使用 facade 时请特别注意类的规模，使其职责范围保持精简。如果类变得过大，考虑将其拆分为多个更小的类。

<a name="facades-vs-dependency-injection"></a>
### Facade 与依赖注入

依赖注入的主要优点之一是能够替换被注入类的实现。这在测试时很有用，因为你可以注入一个 mock 或 stub，并断言在 stub 上调用了各种方法。

通常，无法对真正的静态类方法进行 mock 或 stub。不过，由于 facade 使用动态方法将方法调用代理到从服务容器（Service Container）解析出来的对象，我们实际上可以像测试被注入的类实例一样测试 facade。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的 facade 测试方法，我们可以编写以下测试来验证 `Cache::get` 方法是否以我们期望的参数被调用：

```php tab=Pest
use Illuminate\Support\Facades\Cache;

test('basic example', function () {
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
});
```

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

/**
 * 一个基础功能测试示例。
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

<a name="facades-vs-helper-functions"></a>
### Facade 与辅助函数

除了 facade 之外，Laravel 还包含多种 "辅助" 函数，可执行生成视图、触发事件、派发任务或发送 HTTP 响应等常见任务。许多辅助函数与对应的 facade 执行相同的功能。例如，以下 facade 调用与辅助函数调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

Facade 与辅助函数之间没有任何实际的区别。使用辅助函数时，你仍可以像测试对应 facade 那样测试它们。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数会调用 `Cache` facade 底层类上的 `get` 方法。因此，即使我们使用的是辅助函数，也可以编写以下测试来验证该方法是否以我们期望的参数被调用：

```php
use Illuminate\Support\Facades\Cache;

/**
 * 一个基础功能测试示例。
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

<a name="how-facades-work"></a>
## Facade 的工作原理

在 Laravel 应用中，facade 是一个提供对容器中对象访问的类。实现这一机制的代码位于 `Facade` 类中。Laravel 的 facade 以及你创建的任何自定义 facade，都会继承基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基类利用 `__callStatic()` 魔术方法，将来自 facade 的调用延迟到从容器解析出的对象上。在下面的示例中，调用了 Laravel 缓存系统。粗略看这段代码，有人可能会以为是在 `Cache` 类上调用静态的 `get` 方法：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人资料。
     */
    public function showProfile(string $id): View
    {
        $user = Cache::get('user:'.$id);

        return view('profile', ['user' => $user]);
    }
}
```

注意，在文件顶部我们 "导入" 了 `Cache` facade。该 facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们使用 facade 发起的任何调用都将被传递给 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，会发现其中并没有静态方法 `get`：

```php
class Cache extends Facade
{
    /**
     * 获取已注册组件的名称。
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

相反，`Cache` facade 继承了基础的 `Facade` 类，并定义了 `getFacadeAccessor()` 方法。该方法的作用是返回服务容器（Service Container）绑定的名称。当用户引用 `Cache` facade 上的任意静态方法时，Laravel 会从服务容器（Service Container）中解析 `cache` 绑定，并对该对象运行所请求的方法（在本例中为 `get`）。

<a name="real-time-facades"></a>
## 实时 Facade

使用实时 facade，你可以将应用中的任意类当作 facade 来对待。为了说明其用法，我们先来看一段不使用实时 facade 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。但要发布播客，我们需要注入一个 `Publisher` 实例：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布播客。
     */
    public function publish(Publisher $publisher): void
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this);
    }
}
```

将 publisher 实现注入到方法中，使我们可以轻松地对方法进行隔离测试，因为我们可以 mock 被注入的 publisher。但这要求每次调用 `publish` 方法时都要传入一个 publisher 实例。使用实时 facade，我们可以在不需要显式传入 `Publisher` 实例的情况下，保持同样的可测试性。要生成实时 facade，请在导入类的命名空间前加上 `Facades` 前缀：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher; // [tl! remove]
use Facades\App\Contracts\Publisher; // [tl! add]
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布播客。
     */
    public function publish(Publisher $publisher): void // [tl! remove]
    public function publish(): void // [tl! add]
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this); // [tl! remove]
        Publisher::publish($this); // [tl! add]
    }
}
```

使用实时 facade 时，publisher 实现会通过 `Facades` 前缀之后的接口或类名部分，从服务容器（Service Container）中解析出来。测试时，我们可以使用 Laravel 内置的 facade 测试辅助函数来 mock 此方法调用：

```php tab=Pest
<?php

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('podcast can be published', function () {
    $podcast = Podcast::factory()->create();

    Publisher::shouldReceive('publish')->once()->with($podcast);

    $podcast->publish();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PodcastTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 一个测试示例。
     */
    public function test_podcast_can_be_published(): void
    {
        $podcast = Podcast::factory()->create();

        Publisher::shouldReceive('publish')->once()->with($podcast);

        $podcast->publish();
    }
}
```

<a name="facade-class-reference"></a>
## Facade 类参考

下方列出了每个 facade 及其底层类。这是一个快速深入查看给定 facade 根 API 文档的有用工具。适用的地方还包含了服务容器（Service Container）绑定键。

<div class="overflow-auto">

| Facade | 类 | 服务容器绑定 |
| --- | --- | --- |
| App | [Illuminate\Foundation\Application](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Application.html) | `app` |
| Artisan | [Illuminate\Contracts\Console\Kernel](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Console/Kernel.html) | `artisan` |
| Auth (Instance) | [Illuminate\Contracts\Auth\Guard](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Auth/Guard.html) | `auth.driver` |
| Auth | [Illuminate\Auth\AuthManager](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/AuthManager.html) | `auth` |
| Blade | [Illuminate\View\Compilers\BladeCompiler](https://api.laravel.com/docs/{{version}}/Illuminate/View/Compilers/BladeCompiler.html) | `blade.compiler` |
| Broadcast (Instance) | [Illuminate\Contracts\Broadcasting\Broadcaster](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Broadcasting/Broadcaster.html) | &nbsp; |
| Broadcast | [Illuminate\Contracts\Broadcasting\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Broadcasting/Factory.html) | &nbsp; |
| Bus | [Illuminate\Contracts\Bus\Dispatcher](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Bus/Dispatcher.html) | &nbsp; |
| Cache (Instance) | [Illuminate\Cache\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/Repository.html) | `cache.store` |
| Cache | [Illuminate\Cache\CacheManager](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/CacheManager.html) | `cache` |
| Cloud | [Illuminate\Foundation\Cloud\CloudManager](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Cloud/CloudManager.html) | &nbsp; |
| Config | [Illuminate\Config\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Config/Repository.html) | `config` |
| Context | [Illuminate\Log\Context\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Log/Context/Repository.html) | &nbsp; |
| Cookie | [Illuminate\Cookie\CookieJar](https://api.laravel.com/docs/{{version}}/Illuminate/Cookie/CookieJar.html) | `cookie` |
| Crypt | [Illuminate\Encryption\Encrypter](https://api.laravel.com/docs/{{version}}/Illuminate/Encryption/Encrypter.html) | `encrypter` |
| Date | [Illuminate\Support\DateFactory](https://api.laravel.com/docs/{{version}}/Illuminate/Support/DateFactory.html) | `date` |
| DB (Instance) | [Illuminate\Database\Connection](https://api.laravel.com/docs/{{version}}/Illuminate/Database/Connection.html) | `db.connection` |
| DB | [Illuminate\Database\DatabaseManager](https://api.laravel.com/docs/{{version}}/Illuminate/Database/DatabaseManager.html) | `db` |
| Event | [Illuminate\Events\Dispatcher](https://api.laravel.com/docs/{{version}}/Illuminate/Events/Dispatcher.html) | `events` |
| Exceptions (Instance) | [Illuminate\Contracts\Debug\ExceptionHandler](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Debug/ExceptionHandler.html) | &nbsp; |
| Exceptions | [Illuminate\Foundation\Exceptions\Handler](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Exceptions/Handler.html) | &nbsp; |
| File | [Illuminate\Filesystem\Filesystem](https://api.laravel.com/docs/{{version}}/Illuminate/Filesystem/Filesystem.html) | `files` |
| Gate | [Illuminate\Contracts\Auth\Access\Gate](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Auth/Access/Gate.html) | &nbsp; |
| Hash | [Illuminate\Contracts\Hashing\Hasher](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Hashing/Hasher.html) | `hash` |
| Http | [Illuminate\Http\Client\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Client/Factory.html) | &nbsp; |
| Lang | [Illuminate\Translation\Translator](https://api.laravel.com/docs/{{version}}/Illuminate/Translation/Translator.html) | `translator` |
| Log | [Illuminate\Log\LogManager](https://api.laravel.com/docs/{{version}}/Illuminate/Log/LogManager.html) | `log` |
| Mail | [Illuminate\Mail\Mailer](https://api.laravel.com/docs/{{version}}/Illuminate/Mail/Mailer.html) | `mailer` |
| Notification | [Illuminate\Notifications\ChannelManager](https://api.laravel.com/docs/{{version}}/Illuminate/Notifications/ChannelManager.html) | &nbsp; |
| Password (Instance) | [Illuminate\Auth\Passwords\PasswordBroker](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/Passwords/PasswordBroker.html) | `auth.password.broker` |
| Password | [Illuminate\Auth\Passwords\PasswordBrokerManager](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/Passwords/PasswordBrokerManager.html) | `auth.password` |
| Pipeline (Instance) | [Illuminate\Pipeline\Pipeline](https://api.laravel.com/docs/{{version}}/Illuminate/Pipeline/Pipeline.html) | &nbsp; |
| Process | [Illuminate\Process\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Process/Factory.html) | &nbsp; |
| Queue (Base Class) | [Illuminate\Queue\Queue](https://api.laravel.com/docs/{{version}}/Illuminate/Queue/Queue.html) | &nbsp; |
| Queue (Instance) | [Illuminate\Contracts\Queue\Queue](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Queue/Queue.html) | `queue.connection` |
| Queue | [Illuminate\Queue\QueueManager](https://api.laravel.com/docs/{{version}}/Illuminate/Queue/QueueManager.html) | `queue` |
| RateLimiter | [Illuminate\Cache\RateLimiter](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/RateLimiter.html) | &nbsp; |
| Redirect | [Illuminate\Routing\Redirector](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Redirector.html) | `redirect` |
| Redis (Instance) | [Illuminate\Redis\Connections\Connection](https://api.laravel.com/docs/{{version}}/Illuminate/Redis/Connections/Connection.html) | `redis.connection` |
| Redis | [Illuminate\Redis\RedisManager](https://api.laravel.com/docs/{{version}}/Illuminate/Redis/RedisManager.html) | `redis` |
| Request | [Illuminate\Http\Request](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Request.html) | `request` |
| Response (Instance) | [Illuminate\Http\Response](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Response.html) | &nbsp; |
| Response | [Illuminate\Contracts\Routing\ResponseFactory](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Routing/ResponseFactory.html) | &nbsp; |
| Route | [Illuminate\Routing\Router](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Router.html) | `router` |
| Schedule | [Illuminate\Console\Scheduling\Schedule](https://api.laravel.com/docs/{{version}}/Illuminate/Console/Scheduling/Schedule.html) | &nbsp; |
| Schema | [Illuminate\Database\Schema\Builder](https://api.laravel.com/docs/{{version}}/Illuminate/Database/Schema/Builder.html) | &nbsp; |
| Session (Instance) | [Illuminate\Session\Store](https://api.laravel.com/docs/{{version}}/Illuminate/Session/Store.html) | `session.store` |
| Session | [Illuminate\Session\SessionManager](https://api.laravel.com/docs/{{version}}/Illuminate/Session/SessionManager.html) | `session` |
| Storage (Instance) | [Illuminate\Contracts\Filesystem\Filesystem](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Filesystem/Filesystem.html) | `filesystem.disk` |
| Storage | [Illuminate\Filesystem\FilesystemManager](https://api.laravel.com/docs/{{version}}/Illuminate/Filesystem/FilesystemManager.html) | `filesystem` |
| URL | [Illuminate\Routing\UrlGenerator](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/UrlGenerator.html) | `url` |
| Validator (Instance) | [Illuminate\Validation\Validator](https://api.laravel.com/docs/{{version}}/Illuminate/Validation/Validator.html) | &nbsp; |
| Validator | [Illuminate\Validation\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Validation/Factory.html) | `validator` |
| View (Instance) | [Illuminate\View\View](https://api.laravel.com/docs/{{version}}/Illuminate/View/View.html) | &nbsp; |
| View | [Illuminate\View\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/View/Factory.html) | `view` |
| Vite | [Illuminate\Foundation\Vite](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Vite.html) | &nbsp; |

</div>
