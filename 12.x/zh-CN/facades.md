# Facades

- [简介](#introduction)
- [何时使用 Facades](#when-to-use-facades)
    - [Facades 与依赖注入](#facades-vs-dependency-injection)
    - [Facades 与辅助函数](#facades-vs-helper-functions)
- [Facades 的工作原理](#how-facades-work)
- [实时 Facades](#real-time-facades)
- [Facade 类参考](#facade-class-reference)

<a name="introduction"></a>
## 简介

在整份 Laravel 文档中，你会看到许多通过「facades」与 Laravel 各项功能交互的代码示例。Facades 为服务容器（Service Container）中可用的类提供了一个「静态」接口。Laravel 自带了许多 Facades，几乎可以访问 Laravel 的所有功能。

Laravel 的 Facades 充当服务容器中底层类的「静态代理」，既提供了简洁、富有表现力的语法，又比传统的静态方法保持了更好的可测试性与灵活性。如果你没有完全理解 Facades 的工作原理也没关系——顺其自然，继续学习 Laravel 就好。

Laravel 的所有 Facades 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以像这样轻松地访问一个 Facade：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在整份 Laravel 文档中，许多示例都会使用 Facades 来演示框架的各项功能。

<a name="helper-functions"></a>
#### 辅助函数

作为 Facades 的补充，Laravel 提供了多种全局「辅助函数」，让你能够更轻松地与 Laravel 的常用功能交互。你可能会用到的常见辅助函数有 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都随其对应的功能一起作了说明；完整列表可在专门的[辅助函数文档](/docs/{{version}}/helpers)中查看。

例如，我们可以直接使用 `response` 函数来生成 JSON 响应，而不必使用 `Illuminate\Support\Facades\Response` Facade。由于辅助函数是全局可用的，使用它们时不需要引入任何类：

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
## 何时使用 Facades

Facades 有很多好处。它们提供了简洁、易记的语法，让你无需记住那些必须手动注入或配置的冗长类名就能使用 Laravel 的功能。此外，由于 Facades 对 PHP 动态方法的独特运用，它们也很易于测试。

不过，使用 Facades 时仍需谨慎。Facades 的主要危险在于类的「职责蔓延」。由于 Facades 用起来非常方便、也不需要注入，你的类很容易不断膨胀，在单个类中使用大量 Facades。使用依赖注入时，臃肿的构造函数会给你直观的反馈，提醒你这个类已经太大了，从而缓解这种隐患。因此，使用 Facades 时要特别注意控制类的体量，让它的职责范围保持狭窄。如果你的类变得过于庞大，可以考虑将它拆分为多个更小的类。

<a name="facades-vs-dependency-injection"></a>
### Facades 与依赖注入

依赖注入的主要好处之一，是能够替换所注入类的实现。这在测试时非常有用，因为你可以注入 mock 或 stub，并断言 stub 上的各个方法被调用了。

通常来说，真正静态的类方法是无法 mock 或 stub 的。然而，由于 Facades 使用动态方法将方法调用代理到从服务容器解析出的对象上，我们实际上可以像测试注入的类实例一样测试 Facades。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的 Facade 测试方法，我们可以编写如下测试，验证 `Cache::get` 方法是以我们期望的参数被调用的：

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
 * 一个基础的功能测试示例。
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
### Facades 与辅助函数

除了 Facades，Laravel 还包含多种「辅助」函数，可以执行常见任务，比如生成视图、触发事件、分发任务或发送 HTTP 响应。其中许多辅助函数与对应的 Facade 执行相同的功能。例如，下面这个 Facade 调用与辅助函数调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

Facades 与辅助函数之间完全没有实际差别。使用辅助函数时，你仍然可以像测试对应 Facade 那样对它们进行测试。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数会调用 `Cache` Facade 底层类上的 `get` 方法。因此，即使我们使用的是辅助函数，也可以编写如下测试来验证该方法是以我们期望的参数被调用的：

```php
use Illuminate\Support\Facades\Cache;

/**
 * 一个基础的功能测试示例。
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
## Facades 的工作原理

在 Laravel 应用中，Facade 是一个提供对容器中对象访问能力的类。实现这一机制的底层部件位于 `Facade` 类中。Laravel 的 Facades 以及你创建的任何自定义 Facades，都会继承基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基类利用 `__callStatic()` 魔术方法，把对 Facade 的调用延迟转发给从容器中解析出的对象。在下面的例子中，调用的是 Laravel 的缓存系统。粗看这段代码，你可能会以为是调用了 `Cache` 类的静态 `get` 方法：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示给定用户的资料。
     */
    public function showProfile(string $id): View
    {
        $user = Cache::get('user:'.$id);

        return view('profile', ['user' => $user]);
    }
}
```

注意，在文件顶部我们「引入」了 `Cache` Facade。这个 Facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们通过该 Facade 发起的所有调用，都会被传递给 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，就会发现它并没有静态的 `get` 方法：

```php
class Cache extends Facade
{
    /**
     * 获取组件的注册名称。
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

恰恰相反，`Cache` Facade 继承了基础的 `Facade` 类，并定义了 `getFacadeAccessor()` 方法。这个方法的职责是返回一个服务容器绑定的名称。当用户引用 `Cache` Facade 上的任何静态方法时，Laravel 会从[服务容器](/docs/{{version}}/container)中解析 `cache` 绑定，并对该对象执行所请求的方法（本例中是 `get`）。

<a name="real-time-facades"></a>
## 实时 Facades

使用实时 Facades，你可以把应用中的任何类当作 Facade 来使用。为了说明它的用途，我们先来看一段没有使用实时 Facades 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。不过，要发布播客，我们需要注入一个 `Publisher` 实例：

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

将 publisher 实现注入到方法中，让我们能够轻松地单独测试该方法，因为我们可以 mock 注入的 publisher。不过，这要求我们每次调用 `publish` 方法时都必须传递一个 publisher 实例。使用实时 Facades，我们既能保持同样的可测试性，又不必显式传递 `Publisher` 实例。要生成实时 Facade，只需在引入类的命名空间前加上 `Facades` 前缀：

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

使用实时 Facade 时，publisher 实现会通过接口或类名中 `Facades` 前缀之后的部分，从服务容器中解析出来。测试时，我们可以使用 Laravel 内置的 Facade 测试辅助方法来 mock 这个方法调用：

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
     * 测试示例。
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

下面列出了每个 Facade 及其底层类。这是一个实用工具，可以帮助你快速查阅给定 Facade 根类的 API 文档。在适用的情况下，还附带了[服务容器绑定](/docs/{{version}}/container)的键。

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
