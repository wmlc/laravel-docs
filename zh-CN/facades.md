# Facades

## 简介

在 Laravel 文档各处，你都会看到通过"facades"（Facade）与 Laravel 功能交互的代码示例。Facade 为应用[服务容器](/docs/{{version}}/container)中可用的类提供了一个"静态"接口。Laravel 自带了许多 Facade，提供了对 Laravel 几乎所有功能的访问。

Laravel 的 Facade 充当服务容器中底层类的"静态代理"（static proxies），在提供更简洁、更具表现力的语法优势的同时，比传统的静态方法更具可测试性与灵活性。如果你还不完全理解 Facade 的工作原理，完全不必担心——先跟着往下学，继续了解 Laravel 即可。

Laravel 的所有 Facade 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以像下面这样轻松访问某个 Facade：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在 Laravel 文档中，许多示例都会使用 Facade 来演示框架的各种功能。

#### 辅助函数

为了配合 Facade，Laravel 还提供了多种全局"辅助函数"（helper functions），让你与 Laravel 常用功能交互时更加轻松。你可能会用到的常见辅助函数有 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都在其对应功能的文档中有说明；不过，完整的列表可以在专门的[辅助函数文档](/docs/{{version}}/helpers)中查看。

例如，与其使用 `Illuminate\Support\Facades\Response` Facade 来生成 JSON 响应，我们可以直接使用 `response` 函数。由于辅助函数是全局可用的，你无需导入任何类即可使用它们：

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

## 何时使用 Facade

Facade 有许多好处。它们提供了简洁好记的语法，让你无需记住那些必须手动注入或配置的长类名，就能使用 Laravel 的功能。此外，由于 Facade 独特地利用了 PHP 的动态方法，它们也很易于测试。

不过，使用 Facade 时必须有所注意。Facade 最主要的危险是类的"职责蔓延"（scope creep）。由于 Facade 使用起来非常方便且不需要注入，你的类很容易在不知不觉中不断膨胀，并在单个类中使用大量 Facade。而如果采用依赖注入，庞大的构造函数会直观地提醒你类已经过大，从而降低这种可能性。因此，在使用 Facade 时，要特别注意类的规模，使其职责范围保持精简。如果你的类变得过于庞大，可以考虑将其拆分为多个更小的类。

### Facade 与依赖注入的对比

依赖注入的主要好处之一，是能够替换被注入类的实现。这在测试时很有用，因为你可以注入一个 mock 或 stub，并断言 stub 上调用了各种方法。

通常，我们无法对一个真正静态的类方法进行 mock 或 stub。然而，由于 Facade 使用动态方法将方法调用代理到从服务容器中解析出来的对象，我们实际上可以像测试一个被注入的类实例那样测试 Facade。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的 Facade 测试方法，我们可以编写如下测试，来验证 `Cache::get` 方法确实以我们期望的参数被调用：

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

### Facade 与辅助函数的对比

除了 Facade 之外，Laravel 还包含多种"辅助"函数，可以完成生成视图、触发事件、派发任务、发送 HTTP 响应等常见任务。许多辅助函数与对应的 Facade 功能相同。例如，下面这处 Facade 调用与辅助函数调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

Facade 与辅助函数之间在实践上没有任何区别。使用辅助函数时，你依然可以像测试对应的 Facade 那样测试它们。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数会调用 `Cache` Facade 底层类的 `get` 方法。因此，即使我们使用的是辅助函数，依然可以编写如下测试，来验证该方法确实以我们期望的参数被调用：

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

## Facade 的工作原理

在 Laravel 应用中，Facade 是一个类，它提供对容器中某个对象的访问。实现这一机制的逻辑位于 `Facade` 类中。Laravel 自带的 Facade，以及你创建的任何自定义 Facade，都会继承基础的 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基类利用 `__callStatic()` 魔术方法，将来自 Facade 的调用延迟转发到从容器中解析出来的对象。在下面的例子中，代码调用了 Laravel 的缓存系统。粗略一看这段代码，你可能会以为是在 `Cache` 类上调用静态的 `get` 方法：

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

注意，在文件顶部我们"导入"了 `Cache` Facade。这个 Facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们使用 Facade 发起的任何调用，都会被传递到 Laravel 缓存服务的底层实例。

如果我们查看那个 `Illuminate\Support\Facades\Cache` 类，你会发现其中并没有静态方法 `get`：

```php
class Cache extends Facade
{
    /**
     * 获取该组件的注册名称。
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

相反，`Cache` Facade 继承了基础的 `Facade` 类，并定义了 `getFacadeAccessor()` 方法。这个方法的作用是返回一个服务容器绑定的名称。当用户引用 `Cache` Facade 上的任意静态方法时，Laravel 会从[服务容器](/docs/{{version}}/container)中解析出 `cache` 绑定，并对该对象运行所请求的方法（在本例中是 `get`）。

## 实时 Facade

使用实时 Facade（real-time facades），你可以把应用中的任意类当作 Facade 来使用。为了说明其用法，我们先来看一段不使用实时 Facade 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。但是，要发布播客，我们需要注入一个 `Publisher` 实例：

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

向方法中注入 publisher 实现，让我们能够轻松地对方法进行隔离测试，因为我们可以 mock 被注入的 publisher。但这要求我们在每次调用 `publish` 方法时都必须传入一个 publisher 实例。使用实时 Facade，我们可以保持同样的可测试性，同时又无需显式传入 `Publisher` 实例。要生成实时 Facade，只需在导入类的命名空间前加上 `Facades` 前缀：

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

使用实时 Facade 时，publisher 实现会被从服务容器中解析出来，解析所用的是 `Facades` 前缀之后的接口或类名部分。在测试时，我们可以使用 Laravel 内置的 Facade 测试辅助函数来 mock 这个方法的调用：

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

## Facade 类参考

下面列出了每个 Facade 及其底层类。这是一个很有用的工具，可以快速深入某个 Facade 根的 API 文档。在适用的情况下，还包含了[服务容器绑定](/docs/{{version}}/container)的键。

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
