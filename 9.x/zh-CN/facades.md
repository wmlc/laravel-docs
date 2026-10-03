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

在 Laravel 文档中，你会看到通过"Facade"与 Laravel 功能交互的代码示例。Facade 为应用程序[服务容器（Service Container）](/docs/{{version}}/container)中可用的类提供了"静态"接口。Laravel 自带许多 Facade，可以访问几乎所有 Laravel 功能。

Laravel 的 Facade 充当服务容器中底层类的"静态代理"，在保持比传统静态方法更好的可测试性和灵活性的同时，提供了简洁、富有表现力的语法。如果你不完全理解 Facade 的工作原理也没关系——跟着流程走，继续学习 Laravel 即可。

Laravel 所有 Facade 都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以轻松地访问 Facade，如下所示：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在 Laravel 文档中，许多示例将使用 Facade 来演示框架的各种功能。

<a name="helper-functions"></a>
#### 辅助函数

为了补充 Facade，Laravel 提供了各种全局"辅助函数"，使与常用 Laravel 功能的交互更加容易。你可能使用的一些常见辅助函数包括 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都与其相应功能一起记录；不过，完整的列表可在专门的[辅助函数文档](/docs/{{version}}/helpers)中找到。

例如，我们可以不使用 `Illuminate\Support\Facades\Response` Facade 来生成 JSON 响应，而是简单地使用 `response` 函数。由于辅助函数是全局可用的，你无需导入任何类即可使用它们：

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

Facade 有很多好处。它们提供了简洁、易记的语法，让你无需记住必须手动注入或配置的长类名即可使用 Laravel 功能。此外，由于它们对 PHP 动态方法的独特使用，它们易于测试。

但是，使用 Facade 时必须注意一些事项。Facade 的主要危险是类的"职责蔓延"。由于 Facade 非常易于使用且不需要注入，很容易让你的类不断增长并在单个类中使用许多 Facade。使用依赖注入时，大型构造函数给你的视觉反馈会提示你的类变得太大，从而减轻了这种潜在问题。因此，使用 Facade 时，请特别注意类的大小，使其职责范围保持狭窄。如果你的类变得太大，考虑将其拆分为多个较小的类。

<a name="facades-vs-dependency-injection"></a>
### Facade 与依赖注入

依赖注入的主要好处之一是能够替换注入类的实现。这在测试期间很有用，因为你可以注入 mock 或 stub 并断言在 stub 上调用了各种方法。

通常，无法 mock 或 stub 真正的静态类方法。但是，由于 Facade 使用动态方法将方法调用代理到从服务容器解析的对象，我们实际上可以像测试注入的类实例一样测试 Facade。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的 Facade 测试方法，我们可以编写以下测试来验证 `Cache::get` 方法是用我们期望的参数调用的：

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

/**
 * 一个基础功能测试示例。
 *
 * @return void
 */
public function testBasicExample()
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

除了 Facade 之外，Laravel 还包含各种"辅助"函数，可以执行生成视图、触发事件、分发作业或发送 HTTP 响应等常见任务。许多辅助函数执行与相应 Facade 相同的功能。例如，以下 Facade 调用和辅助函数调用是等价的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

Facade 和辅助函数之间没有任何实际区别。使用辅助函数时，你仍然可以像测试相应 Facade 一样测试它们。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数将调用 `Cache` Facade 底层类上的 `get` 方法。因此，即使我们使用辅助函数，我们也可以编写以下测试来验证该方法是用我们期望的参数调用的：

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

/**
 * 一个基础功能测试示例。
 *
 * @return void
 */
public function testBasicExample()
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

在 Laravel 应用程序中，Facade 是一个提供从容器访问对象的类。实现这一功能的机制位于 `Facade` 类中。Laravel 的 Facade 以及你创建的任何自定义 Facade 都将扩展基础 `Illuminate\Support\Facades\Facade` 类。

`Facade` 基础类利用 `__callStatic()` 魔术方法将来自 Facade 的调用延迟到从容器解析的对象。在下面的示例中，调用了 Laravel 缓存系统。浏览此代码，人们可能认为正在 `Cache` 类上调用静态 `get` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
     *
     * @param  int  $id
     * @return Response
     */
    public function showProfile($id)
    {
        $user = Cache::get('user:'.$id);

        return view('profile', ['user' => $user]);
    }
}
```

注意，在文件顶部我们"导入"了 `Cache` Facade。此 Facade 充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们使用 Facade 进行的任何调用都将传递给 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，你会发现没有静态方法 `get`：

```php
class Cache extends Facade
{
    /**
     * 获取组件的注册名称。
     *
     * @return string
     */
    protected static function getFacadeAccessor() { return 'cache'; }
}
```

相反，`Cache` Facade 扩展了基础 `Facade` 类并定义了 `getFacadeAccessor()` 方法。此方法的工作是返回服务容器绑定的名称。当用户在 `Cache` Facade 上引用任何静态方法时，Laravel 会从[服务容器](/docs/{{version}}/container)解析 `cache` 绑定并针对该对象运行请求的方法（在本例中为 `get`）。

<a name="real-time-facades"></a>
## 实时 Facade

使用实时 Facade，你可以将应用程序中的任何类当作 Facade 来处理。为了说明如何使用它，让我们先检查一些不使用实时 Facade 的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。但是，为了发布播客，我们需要注入一个 `Publisher` 实例：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布播客。
     *
     * @param  Publisher  $publisher
     * @return void
     */
    public function publish(Publisher $publisher)
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this);
    }
}
```

将 publisher 实现注入到方法中使我们能够轻松地隔离测试该方法，因为我们可以 mock 注入的 publisher。但是，这要求我们每次调用 `publish` 方法时都传递一个 publisher 实例。使用实时 Facade，我们可以保持相同的可测试性，而无需显式传递 `Publisher` 实例。要生成实时 Facade，在导入类的命名空间前加上 `Facades` 前缀：

```php
<?php

namespace App\Models;

use Facades\App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * 发布播客。
     *
     * @return void
     */
    public function publish()
    {
        $this->update(['publishing' => now()]);

        Publisher::publish($this);
    }
}
```

当使用实时 Facade 时，publisher 实现将使用接口或类名中 `Facades` 前缀之后出现的部分从服务容器中解析。测试时，我们可以使用 Laravel 内置的 Facade 测试辅助方法来 mock 此方法调用：

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
     *
     * @return void
     */
    public function test_podcast_can_be_published()
    {
        $podcast = Podcast::factory()->create();

        Publisher::shouldReceive('publish')->once()->with($podcast);

        $podcast->publish();
    }
}
```

<a name="facade-class-reference"></a>
## Facade 类参考

下面你会找到每个 Facade 及其底层类。这是快速深入了解给定 Facade 根的 API 文档的有用工具。在适用的情况下，还包含了[服务容器绑定](/docs/{{version}}/container)键。

Facade  |  类  |  服务容器绑定
------------- | ------------- | -------------
App  |  [Illuminate\Foundation\Application](https://laravel.com/api/{{version}}/Illuminate/Foundation/Application.html)  |  `app`
Artisan  |  [Illuminate\Contracts\Console\Kernel](https://laravel.com/api/{{version}}/Illuminate/Contracts/Console/Kernel.html)  |  `artisan`
Auth  |  [Illuminate\Auth\AuthManager](https://laravel.com/api/{{version}}/Illuminate/Auth/AuthManager.html)  |  `auth`
Auth (Instance)  |  [Illuminate\Contracts\Auth\Guard](https://laravel.com/api/{{version}}/Illuminate/Contracts/Auth/Guard.html)  |  `auth.driver`
Blade  |  [Illuminate\View\Compilers\BladeCompiler](https://laravel.com/api/{{version}}/Illuminate/View/Compilers/BladeCompiler.html)  |  `blade.compiler`
Broadcast  |  [Illuminate\Contracts\Broadcasting\Factory](https://laravel.com/api/{{version}}/Illuminate/Contracts/Broadcasting/Factory.html)  |  &nbsp;
Broadcast (Instance)  |  [Illuminate\Contracts\Broadcasting\Broadcaster](https://laravel.com/api/{{version}}/Illuminate/Contracts/Broadcasting/Broadcaster.html)  |  &nbsp;
Bus  |  [Illuminate\Contracts\Bus\Dispatcher](https://laravel.com/api/{{version}}/Illuminate/Contracts/Bus/Dispatcher.html)  |  &nbsp;
Cache  |  [Illuminate\Cache\CacheManager](https://laravel.com/api/{{version}}/Illuminate/Cache/CacheManager.html)  |  `cache`
Cache (Instance)  |  [Illuminate\Cache\Repository](https://laravel.com/api/{{version}}/Illuminate/Cache/Repository.html)  |  `cache.store`
Config  |  [Illuminate\Config\Repository](https://laravel.com/api/{{version}}/Illuminate/Config/Repository.html)  |  `config`
Cookie  |  [Illuminate\Cookie\CookieJar](https://laravel.com/api/{{version}}/Illuminate/Cookie/CookieJar.html)  |  `cookie`
Crypt  |  [Illuminate\Encryption\Encrypter](https://laravel.com/api/{{version}}/Illuminate/Encryption/Encrypter.html)  |  `encrypter`
Date  |  [Illuminate\Support\DateFactory](https://laravel.com/api/{{version}}/Illuminate/Support/DateFactory.html)  |  `date`
DB  |  [Illuminate\Database\DatabaseManager](https://laravel.com/api/{{version}}/Illuminate/Database/DatabaseManager.html)  |  `db`
DB (Instance)  |  [Illuminate\Database\Connection](https://laravel.com/api/{{version}}/Illuminate/Database/Connection.html)  |  `db.connection`
Event  |  [Illuminate\Events\Dispatcher](https://laravel.com/api/{{version}}/Illuminate/Events/Dispatcher.html)  |  `events`
File  |  [Illuminate\Filesystem\Filesystem](https://laravel.com/api/{{version}}/Illuminate/Filesystem/Filesystem.html)  |  `files`
Gate  |  [Illuminate\Contracts\Auth\Access\Gate](https://laravel.com/api/{{version}}/Illuminate/Contracts/Auth/Access/Gate.html)  |  &nbsp;
Hash  |  [Illuminate\Contracts\Hashing\Hasher](https://laravel.com/api/{{version}}/Illuminate/Contracts/Hashing/Hasher.html)  |  `hash`
Http  |  [Illuminate\Http\Client\Factory](https://laravel.com/api/{{version}}/Illuminate/Http/Client/Factory.html)  |  &nbsp;
Lang  |  [Illuminate\Translation\Translator](https://laravel.com/api/{{version}}/Illuminate/Translation/Translator.html)  |  `translator`
Log  |  [Illuminate\Log\LogManager](https://laravel.com/api/{{version}}/Illuminate/Log/LogManager.html)  |  `log`
Mail  |  [Illuminate\Mail\Mailer](https://laravel.com/api/{{version}}/Illuminate/Mail/Mailer.html)  |  `mailer`
Notification  |  [Illuminate\Notifications\ChannelManager](https://laravel.com/api/{{version}}/Illuminate/Notifications/ChannelManager.html)  |  &nbsp;
Password  |  [Illuminate\Auth\Passwords\PasswordBrokerManager](https://laravel.com/api/{{version}}/Illuminate/Auth/Passwords/PasswordBrokerManager.html)  |  `auth.password`
Password (Instance)  |  [Illuminate\Auth\Passwords\PasswordBroker](https://laravel.com/api/{{version}}/Illuminate/Auth/Passwords/PasswordBroker.html)  |  `auth.password.broker`
Queue  |  [Illuminate\Queue\QueueManager](https://laravel.com/api/{{version}}/Illuminate/Queue/QueueManager.html)  |  `queue`
Queue (Instance)  |  [Illuminate\Contracts\Queue\Queue](https://laravel.com/api/{{version}}/Illuminate/Contracts/Queue/Queue.html)  |  `queue.connection`
Queue (Base Class)  |  [Illuminate\Queue\Queue](https://laravel.com/api/{{version}}/Illuminate/Queue/Queue.html)  |  &nbsp;
Redirect  |  [Illuminate\Routing\Redirector](https://laravel.com/api/{{version}}/Illuminate/Routing/Redirector.html)  |  `redirect`
Redis  |  [Illuminate\Redis\RedisManager](https://laravel.com/api/{{version}}/Illuminate/Redis/RedisManager.html)  |  `redis`
Redis (Instance)  |  [Illuminate\Redis\Connections\Connection](https://laravel.com/api/{{version}}/Illuminate/Redis/Connections/Connection.html)  |  `redis.connection`
Request  |  [Illuminate\Http\Request](https://laravel.com/api/{{version}}/Illuminate/Http/Request.html)  |  `request`
Response  |  [Illuminate\Contracts\Routing\ResponseFactory](https://laravel.com/api/{{version}}/Illuminate/Contracts/Routing/ResponseFactory.html)  |  &nbsp;
Response (Instance)  |  [Illuminate\Http\Response](https://laravel.com/api/{{version}}/Illuminate/Http/Response.html)  |  &nbsp;
Route  |  [Illuminate\Routing\Router](https://laravel.com/api/{{version}}/Illuminate/Routing/Router.html)  |  `router`
Schema  |  [Illuminate\Database\Schema\Builder](https://laravel.com/api/{{version}}/Illuminate/Database/Schema/Builder.html)  |  &nbsp;
Session  |  [Illuminate\Session\SessionManager](https://laravel.com/api/{{version}}/Illuminate/Session/SessionManager.html)  |  `session`
Session (Instance)  |  [Illuminate\Session\Store](https://laravel.com/api/{{version}}/Illuminate/Session/Store.html)  |  `session.store`
Storage  |  [Illuminate\Filesystem\FilesystemManager](https://laravel.com/api/{{version}}/Illuminate/Filesystem/FilesystemManager.html)  |  `filesystem`
Storage (Instance)  |  [Illuminate\Contracts\Filesystem\Filesystem](https://laravel.com/api/{{version}}/Illuminate/Contracts/Filesystem/Filesystem.html)  |  `filesystem.disk`
URL  |  [Illuminate\Routing\UrlGenerator](https://laravel.com/api/{{version}}/Illuminate/Routing/UrlGenerator.html)  |  `url`
Validator  |  [Illuminate\Validation\Factory](https://laravel.com/api/{{version}}/Illuminate/Validation/Factory.html)  |  `validator`
Validator (Instance)  |  [Illuminate\Validation\Validator](https://laravel.com/api/{{version}}/Illuminate/Validation/Validator.html)  |  &nbsp;
View  |  [Illuminate\View\Factory](https://laravel.com/api/{{version}}/Illuminate/View/Factory.html)  |  `view`
View (Instance)  |  [Illuminate\View\View](https://laravel.com/api/{{version}}/Illuminate/View/View.html)  |  &nbsp;
Vite  |  [Illuminate\Foundation\Vite](https://laravel.com/api/{{version}}/Illuminate/Foundation/Vite.html)  |  &nbsp;
