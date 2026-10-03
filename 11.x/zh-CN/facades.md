# Facade

- [简介](#introduction)
- [何时使用 Facade](#when-to-use-facades)
    - [Facade 与依赖注入](#facades-vs-dependency-injection)
    - [Facade 与辅助函数](#facades-vs-helper-functions)
- [Facade 的工作原理](#how-facades-work)
- [实时 Facade](#real-time-facades)
- [Facade 类参考](#facade-class-reference)

<a name="introduction"></a>
## 简介

在整个 Laravel 文档中，你会看到许多通过"Facade"与 Laravel 功能交互的代码示例。Facade 为应用[服务容器](/docs/{{version}}/container)中可用的类提供了"静态"接口。Laravel 自带许多 Facade，几乎可以访问 Laravel 的所有功能。

Laravel Facade 充当服务容器中底层类的"静态代理"，既提供了简洁、富有表达力的语法，又比传统静态方法具有更好的可测试性和灵活性。即使你还没有完全理解 Facade 如何工作，也完全没问题——顺其自然，继续学习 Laravel 即可。

Laravel 的所有 Facade 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以这样轻松访问某个 Facade：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在整个 Laravel 文档中，许多示例都会使用 Facade 来演示框架的各种功能。

<a name="helper-functions"></a>
#### 辅助函数

作为 Facade 的补充，Laravel 提供了各种全局"辅助函数"，让你与常用的 Laravel 功能交互更加轻松。你可能会用到的一些常见辅助函数包括 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都会在对应功能的文档中做说明；不过，完整的列表可以在专门的[辅助函数文档](/docs/{{version}}/helpers)中查看。

例如，与其使用 `Illuminate\Support\Facades\Response` Facade 生成 JSON 响应，我们也可以直接使用 `response` 函数。由于辅助函数是全局可用的，你无需引入任何类即可使用它们：

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

Facade 有很多优点。它们提供简洁、易记的语法，让你无需记住那些必须手动注入或配置的冗长类名即可使用 Laravel 的功能。此外，由于它们独特地使用了 PHP 的动态方法，因此易于测试。

不过，使用 Facade 时必须多加小心。Facade 的主要风险是类的"职责蔓延"。由于 Facade 极易使用又无需注入，很容易让你的类不断膨胀，在单个类中使用大量 Facade。而使用依赖注入时，庞大的构造函数会给你带来视觉反馈，让你意识到类已经变得过大。因此，使用 Facade 时请特别注意类的规模，确保其职责范围保持狭窄。如果类变得过大，考虑把它拆分成多个更小的类。

<a name="facades-vs-dependency-injection"></a>
### Facade 与依赖注入

依赖注入的主要好处之一是可以替换被注入类的实现。这在测试期间很有用，因为你可以注入一个 mock 或 stub，并断言 stub 上调用了各个方法。

通常来说，你无法 mock 或 stub 一个真正静态的类方法。不过，由于 Facade 使用动态方法把方法调用代理到从服务容器解析出的对象，我们实际上可以像测试被注入的类实例一样测试 Facade。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

借助 Laravel 的 Facade 测试方法，我们可以编写以下测试来验证 `Cache::get` 方法是否以预期参数被调用：

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
### Facade 与辅助函数

除了 Facade 之外，Laravel 还提供了各种"辅助"函数，可以完成生成视图、触发事件、派发任务或发送 HTTP 响应等常见工作。其中许多辅助函数与对应的 Facade 功能相同。例如，下面这种 Facade 调用与辅助函数调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

Facade 与辅助函数在实际使用中毫无区别。使用辅助函数时，你仍然可以像测试对应的 Facade 一样测试它们。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数会调用 `Cache` Facade 底层类的 `get` 方法。因此，即使我们使用的是辅助函数，也可以编写以下测试来验证该方法是否以预期参数被调用：

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

<a name="how-facades-work"></a>
## Facade 的工作原理

在 Laravel 应用中，Facade 是一个提供从容器中访问某个对象的类。实现这一点的机制位于 `Facade` 类中。Laravel 的 Facade 以及你创建的任何自定义 Facade，都会继承基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基础类利用 `__callStatic()` 魔术方法，把来自 Facade 的调用延迟到从容器解析出的对象上。在下面的例子中，代码调用了 Laravel 缓存系统。粗看一眼这段代码，你可能会以为是在 `Cache` 类上调用静态的 `get` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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

请注意，我们在文件顶部"引入"了 `Cache` Facade。该 Facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们使用该 Facade 进行的任何调用，都会被传递给 Laravel 缓存服务的底层实例。

如果查看 `Illuminate\Support\Facades\Cache` 类，你会发现其中并没有静态方法 `get`：

```php
class Cache extends Facade
{
    /**
     * 获取该组件已注册的名称。
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

取而代之的是，`Cache` Facade 继承基础的 `Facade` 类并定义了 `getFacadeAccessor()` 方法。这个方法的作用是返回某个服务容器绑定的名称。当用户引用 `Cache` Facade 上的任何静态方法时，Laravel 会从[服务容器](/docs/{{version}}/container)中解析 `cache` 绑定，并对该对象运行所请求的方法（此处为 `get`）。

<a name="real-time-facades"></a>
## 实时 Facade

使用实时 Facade，你可以把应用中的任何类都当作 Facade 来处理。为了说明如何使用，我们先来看一段不使用实时 Facade 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。不过，为了发布播客，我们需要注入一个 `Publisher` 实例：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布这个播客。
     */
    public function publish(Publisher $publisher): void
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this);
    }
}
```

把发布者实现注入该方法，可以让我们轻松地单独测试该方法，因为我们能 mock 注入的发布者。但这也要求我们每次调用 `publish` 方法时都必须传入一个发布者实例。使用实时 Facade，我们可以在保持同样可测试性的同时，不必显式传入 `Publisher` 实例。要生成实时 Facade，请为所引入类的命名空间加上 `Facades` 前缀：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher; // [tl! remove]
use Facades\App\Contracts\Publisher; // [tl! add]
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布这个播客。
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

使用实时 Facade 时，发布者实现会通过 `Facades` 前缀之后的接口或类名部分从服务容器中解析。测试时，我们可以使用 Laravel 内置的 Facade 测试辅助方法来 mock 这次方法调用：

```php tab=Pest
<?php

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

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

下面列出了每个 Facade 及其底层类。这是一份便于快速查阅某个 Facade 根对应 API 文档的工具。适用时还会包含[服务容器绑定](/docs/{{version}}/container)键。

<div class="overflow-auto">

| Facade | 类 | 服务容器绑定 |
| --- | --- | --- |
| App | [Illuminate\Foundation\Application](https://laravel.com/api/{{version}}/Illuminate/Foundation/Application.html) | `app` |
| Artisan | [Illuminate\Contracts\Console\Kernel](https://laravel.com/api/{{version}}/Illuminate/Contracts/Console/Kernel.html) | `artisan` |
| Auth（实例） | [Illuminate\Contracts\Auth\Guard](https://laravel.com/api/{{version}}/Illuminate/Contracts/Auth/Guard.html) | `auth.driver` |
| Auth | [Illuminate\Auth\AuthManager](https://laravel.com/api/{{version}}/Illuminate/Auth/AuthManager.html) | `auth` |
| Blade | [Illuminate\View\Compilers\BladeCompiler](https://laravel.com/api/{{version}}/Illuminate/View/Compilers/BladeCompiler.html) | `blade.compiler` |
| Broadcast（实例） | [Illuminate\Contracts\Broadcasting\Broadcaster](https://laravel.com/api/{{version}}/Illuminate/Contracts/Broadcasting/Broadcaster.html) | &nbsp; |
| Broadcast | [Illuminate\Contracts\Broadcasting\Factory](https://laravel.com/api/{{version}}/Illuminate/Contracts/Broadcasting/Factory.html) | &nbsp; |
| Bus | [Illuminate\Contracts\Bus\Dispatcher](https://laravel.com/api/{{version}}/Illuminate/Contracts/Bus/Dispatcher.html) | &nbsp; |
| Cache（实例） | [Illuminate\Cache\Repository](https://laravel.com/api/{{version}}/Illuminate/Cache/Repository.html) | `cache.store` |
| Cache | [Illuminate\Cache\CacheManager](https://laravel.com/api/{{version}}/Illuminate/Cache/CacheManager.html) | `cache` |
| Config | [Illuminate\Config\Repository](https://laravel.com/api/{{version}}/Illuminate/Config/Repository.html) | `config` |
| Context | [Illuminate\Log\Context\Repository](https://laravel.com/api/{{version}}/Illuminate/Log/Context/Repository.html) | &nbsp; |
| Cookie | [Illuminate\Cookie\CookieJar](https://laravel.com/api/{{version}}/Illuminate/Cookie/CookieJar.html) | `cookie` |
| Crypt | [Illuminate\Encryption\Encrypter](https://laravel.com/api/{{version}}/Illuminate/Encryption/Encrypter.html) | `encrypter` |
| Date | [Illuminate\Support\DateFactory](https://laravel.com/api/{{version}}/Illuminate/Support/DateFactory.html) | `date` |
| DB（实例） | [Illuminate\Database\Connection](https://laravel.com/api/{{version}}/Illuminate/Database/Connection.html) | `db.connection` |
| DB | [Illuminate\Database\DatabaseManager](https://laravel.com/api/{{version}}/Illuminate/Database/DatabaseManager.html) | `db` |
| Event | [Illuminate\Events\Dispatcher](https://laravel.com/api/{{version}}/Illuminate/Events/Dispatcher.html) | `events` |
| Exceptions（实例） | [Illuminate\Contracts\Debug\ExceptionHandler](https://laravel.com/api/{{version}}/Illuminate/Contracts/Debug/ExceptionHandler.html) | &nbsp; |
| Exceptions | [Illuminate\Foundation\Exceptions\Handler](https://laravel.com/api/{{version}}/Illuminate/Foundation/Exceptions/Handler.html) | &nbsp; |
| File | [Illuminate\Filesystem\Filesystem](https://laravel.com/api/{{version}}/Illuminate/Filesystem/Filesystem.html) | `files` |
| Gate | [Illuminate\Contracts\Auth\Access\Gate](https://laravel.com/api/{{version}}/Illuminate/Contracts/Auth/Access/Gate.html) | &nbsp; |
| Hash | [Illuminate\Contracts\Hashing\Hasher](https://laravel.com/api/{{version}}/Illuminate/Contracts/Hashing/Hasher.html) | `hash` |
| Http | [Illuminate\Http\Client\Factory](https://laravel.com/api/{{version}}/Illuminate/Http/Client/Factory.html) | &nbsp; |
| Lang | [Illuminate\Translation\Translator](https://laravel.com/api/{{version}}/Illuminate/Translation/Translator.html) | `translator` |
| Log | [Illuminate\Log\LogManager](https://laravel.com/api/{{version}}/Illuminate/Log/LogManager.html) | `log` |
| Mail | [Illuminate\Mail\Mailer](https://laravel.com/api/{{version}}/Illuminate/Mail/Mailer.html) | `mailer` |
| Notification | [Illuminate\Notifications\ChannelManager](https://laravel.com/api/{{version}}/Illuminate/Notifications/ChannelManager.html) | &nbsp; |
| Password（实例） | [Illuminate\Auth\Passwords\PasswordBroker](https://laravel.com/api/{{version}}/Illuminate/Auth/Passwords/PasswordBroker.html) | `auth.password.broker` |
| Password | [Illuminate\Auth\Passwords\PasswordBrokerManager](https://laravel.com/api/{{version}}/Illuminate/Auth/Passwords/PasswordBrokerManager.html) | `auth.password` |
| Pipeline（实例） | [Illuminate\Pipeline\Pipeline](https://laravel.com/api/{{version}}/Illuminate/Pipeline/Pipeline.html) | &nbsp; |
| Process | [Illuminate\Process\Factory](https://laravel.com/api/{{version}}/Illuminate/Process/Factory.html) | &nbsp; |
| Queue（基类） | [Illuminate\Queue\Queue](https://laravel.com/api/{{version}}/Illuminate/Queue/Queue.html) | &nbsp; |
| Queue（实例） | [Illuminate\Contracts\Queue\Queue](https://laravel.com/api/{{version}}/Illuminate/Contracts/Queue/Queue.html) | `queue.connection` |
| Queue | [Illuminate\Queue\QueueManager](https://laravel.com/api/{{version}}/Illuminate/Queue/QueueManager.html) | `queue` |
| RateLimiter | [Illuminate\Cache\RateLimiter](https://laravel.com/api/{{version}}/Illuminate/Cache/RateLimiter.html) | &nbsp; |
| Redirect | [Illuminate\Routing\Redirector](https://laravel.com/api/{{version}}/Illuminate/Routing/Redirector.html) | `redirect` |
| Redis（实例） | [Illuminate\Redis\Connections\Connection](https://laravel.com/api/{{version}}/Illuminate/Redis/Connections/Connection.html) | `redis.connection` |
| Redis | [Illuminate\Redis\RedisManager](https://laravel.com/api/{{version}}/Illuminate/Redis/RedisManager.html) | `redis` |
| Request | [Illuminate\Http\Request](https://laravel.com/api/{{version}}/Illuminate/Http/Request.html) | `request` |
| Response（实例） | [Illuminate\Http\Response](https://laravel.com/api/{{version}}/Illuminate/Http/Response.html) | &nbsp; |
| Response | [Illuminate\Contracts\Routing\ResponseFactory](https://laravel.com/api/{{version}}/Illuminate/Contracts/Routing/ResponseFactory.html) | &nbsp; |
| Route | [Illuminate\Routing\Router](https://laravel.com/api/{{version}}/Illuminate/Routing/Router.html) | `router` |
| Schedule | [Illuminate\Console\Scheduling\Schedule](https://laravel.com/api/{{version}}/Illuminate/Console/Scheduling/Schedule.html) | &nbsp; |
| Schema | [Illuminate\Database\Schema\Builder](https://laravel.com/api/{{version}}/Illuminate/Database/Schema/Builder.html) | &nbsp; |
| Session（实例） | [Illuminate\Session\Store](https://laravel.com/api/{{version}}/Illuminate/Session/Store.html) | `session.store` |
| Session | [Illuminate\Session\SessionManager](https://laravel.com/api/{{version}}/Illuminate/Session/SessionManager.html) | `session` |
| Storage（实例） | [Illuminate\Contracts\Filesystem\Filesystem](https://laravel.com/api/{{version}}/Illuminate/Contracts/Filesystem/Filesystem.html) | `filesystem.disk` |
| Storage | [Illuminate\Filesystem\FilesystemManager](https://laravel.com/api/{{version}}/Illuminate/Filesystem/FilesystemManager.html) | `filesystem` |
| URL | [Illuminate\Routing\UrlGenerator](https://laravel.com/api/{{version}}/Illuminate/Routing/UrlGenerator.html) | `url` |
| Validator（实例） | [Illuminate\Validation\Validator](https://laravel.com/api/{{version}}/Illuminate/Validation/Validator.html) | &nbsp; |
| Validator | [Illuminate\Validation\Factory](https://laravel.com/api/{{version}}/Illuminate/Validation/Factory.html) | `validator` |
| View（实例） | [Illuminate\View\View](https://laravel.com/api/{{version}}/Illuminate/View/View.html) | &nbsp; |
| View | [Illuminate\View\Factory](https://laravel.com/api/{{version}}/Illuminate/View/Factory.html) | `view` |
| Vite | [Illuminate\Foundation\Vite](https://laravel.com/api/{{version}}/Illuminate/Foundation/Vite.html) | &nbsp; |

</div>
