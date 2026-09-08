# HTTP 会话

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动先决条件](#driver-prerequisites)
- [与会话交互](#interacting-with-the-session)
    - [检索数据](#retrieving-data)
    - [存储数据](#storing-data)
    - [闪存数据](#flash-data)
    - [删除数据](#deleting-data)
    - [重新生成会话 ID](#regenerating-the-session-id)
- [会话缓存](#session-cache)
- [会话阻塞](#session-blocking)
- [添加自定义会话驱动](#adding-custom-session-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)

<a name="introduction"></a>
## 简介

由于 HTTP 驱动的应用是无状态的，会话提供了一种在多次请求之间存储用户相关信息的方式。这些用户信息通常放置在可从后续请求访问的持久化存储 / 后端中。

Laravel 提供了各种可通过富有表现力、统一的 API 访问的会话后端。包含对 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库等流行后端的支持。

<a name="configuration"></a>
### 配置

你的应用会话配置文件存储在 `config/session.php` 中。请务必查看该文件中可供你使用的选项。默认情况下，Laravel 配置为使用 `database` 会话驱动。

会话的 `driver` 配置选项定义了每个请求的会话数据将存储在哪里。Laravel 提供了多种驱动：

<div class="content-list" markdown="1">

- `file` - 会话存储在 `storage/framework/sessions` 中。
- `cookie` - 会话存储在安全的、加密的 Cookie 中。
- `database` - 会话存储在关系数据库中。
- `memcached` / `redis` - 会话存储在这些快速的、基于缓存的存储之一中。
- `dynamodb` - 会话存储在 AWS DynamoDB 中。
- `array` - 会话存储在 PHP 数组中，不会被持久化。

</div>

> [!NOTE]
> `array` 驱动主要在[测试](/docs/{{version}}/testing)期间使用，可防止会话中存储的数据被持久化。

<a name="driver-prerequisites"></a>
### 驱动先决条件

<a name="database"></a>
#### 数据库

使用 `database` 会话驱动时，你需要确保有一张数据库表来容纳会话数据。通常，这包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` [数据库迁移](/docs/{{version}}/migrations)中；不过，如果出于任何原因你没有 `sessions` 表，可以使用 `make:session-table` Artisan 命令生成此迁移：

```shell
php artisan make:session-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis 会话之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包。有关配置 Redis 的更多信息，请查阅 Laravel 的 [Redis 文档](/docs/{{version}}/redis#configuration)。

> [!NOTE]
> 可以使用 `SESSION_CONNECTION` 环境变量或 `session.php` 配置文件中的 `connection` 选项，指定用于会话存储的 Redis 连接。

<a name="interacting-with-the-session"></a>
## 与会话交互

<a name="retrieving-data"></a>
### 检索数据

在 Laravel 中使用会话数据有两种主要方式：全局 `session` 辅助函数和 `Request` 实例。首先，让我们看看如何通过 `Request` 实例访问会话，它可以在路由闭包或控制器方法上进行类型提示。请记住，控制器方法依赖是通过 Laravel [服务容器](/docs/{{version}}/container)自动注入的：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for the given user.
     */
    public function show(Request $request, string $id): View
    {
        $value = $request->session()->get('key');

        // ...

        $user = $this->users->find($id);

        return view('user.profile', ['user' => $user]);
    }
}
```

从会话中检索条目时，你也可以将默认值作为第二个参数传递给 `get` 方法。如果会话中不存在指定的键，将返回此默认值。如果你将闭包作为默认值传递给 `get` 方法且请求的键不存在，闭包将被执行并返回其结果：

```php
$value = $request->session()->get('key', 'default');

$value = $request->session()->get('key', function () {
    return 'default';
});
```

<a name="the-global-session-helper"></a>
#### 全局 Session 辅助函数

你也可以使用全局 `session` PHP 函数在会话中检索和存储数据。当 `session` 辅助函数使用单个字符串参数调用时，它将返回该会话键的值。当该辅助函数使用键 / 值对数组调用时，这些值将存储在会话中：

```php
Route::get('/home', function () {
    // Retrieve a piece of data from the session...
    $value = session('key');

    // Specifying a default value...
    $value = session('key', 'default');

    // Store a piece of data in the session...
    session(['key' => 'value']);
});
```

> [!NOTE]
> 通过 HTTP 请求实例使用会话与使用全局 `session` 辅助函数之间几乎没有实际差异。这两种方法都可以通过所有测试用例中可用的 `assertSessionHas` 方法进行[测试](/docs/{{version}}/testing)。

<a name="retrieving-all-session-data"></a>
#### 检索所有会话数据

如果你想检索会话中的所有数据，可以使用 `all` 方法：

```php
$data = $request->session()->all();
```

<a name="retrieving-a-portion-of-the-session-data"></a>
#### 检索部分会话数据

可以使用 `only` 和 `except` 方法检索会话数据的子集：

```php
$data = $request->session()->only(['username', 'email']);

$data = $request->session()->except(['username', 'email']);
```

<a name="determining-if-an-item-exists-in-the-session"></a>
#### 判断条目是否存在于会话中

要判断条目是否存在于会话中，可以使用 `has` 方法。如果条目存在且不为 `null`，`has` 方法返回 `true`：

```php
if ($request->session()->has('users')) {
    // ...
}
```

要判断条目是否存在于会话中（即使其值为 `null`），可以使用 `exists` 方法：

```php
if ($request->session()->exists('users')) {
    // ...
}
```

要判断条目是否不存在于会话中，可以使用 `missing` 方法。如果条目不存在，`missing` 方法返回 `true`：

```php
if ($request->session()->missing('users')) {
    // ...
}
```

<a name="storing-data"></a>
### 存储数据

要在会话中存储数据，通常使用请求实例的 `put` 方法或全局 `session` 辅助函数：

```php
// Via a request instance...
$request->session()->put('key', 'value');

// Via the global "session" helper...
session(['key' => 'value']);
```

<a name="pushing-to-array-session-values"></a>
#### 推送到数组会话值

`push` 方法可用于将新值推送到数组类型的会话值中。例如，如果 `user.teams` 键包含一个团队名称数组，你可以像这样将新值推送到数组中：

```php
$request->session()->push('user.teams', 'developers');
```

<a name="retrieving-deleting-an-item"></a>
#### 检索并删除条目

`pull` 方法将在单个语句中从会话中检索并删除条目：

```php
$value = $request->session()->pull('key', 'default');
```

<a name="incrementing-and-decrementing-session-values"></a>
#### 递增和递减会话值

如果你的会话数据包含一个要递增或递减的整数，可以使用 `increment` 和 `decrement` 方法：

```php
$request->session()->increment('count');

$request->session()->increment('count', $incrementBy = 2);

$request->session()->decrement('count');

$request->session()->decrement('count', $decrementBy = 2);
```

<a name="flash-data"></a>
### 闪存数据

有时你可能希望在会话中存储仅供下一个请求使用的条目。你可以使用 `flash` 方法做到这一点。使用此方法存储在会话中的数据将立即可用，并可在后续的 HTTP 请求期间使用。后续 HTTP 请求结束后，闪存数据将被删除。闪存数据主要用于短期的状态消息：

```php
$request->session()->flash('status', 'Task was successful!');
```

如果你需要在多个请求期间保留闪存数据，可以使用 `reflash` 方法，它将为额外的请求保留所有闪存数据。如果你只需要保留特定的闪存数据，可以使用 `keep` 方法：

```php
$request->session()->reflash();

$request->session()->keep(['username', 'email']);
```

若只想在当前请求期间保留闪存数据，可以使用 `now` 方法：

```php
$request->session()->now('status', 'Task was successful!');
```

<a name="deleting-data"></a>
### 删除数据

`forget` 方法将从会话中移除一条数据。如果你想移除会话中的所有数据，可以使用 `flush` 方法：

```php
// Forget a single key...
$request->session()->forget('name');

// Forget multiple keys...
$request->session()->forget(['name', 'status']);

$request->session()->flush();
```

<a name="regenerating-the-session-id"></a>
### 重新生成会话 ID

重新生成会话 ID 通常是为了防止恶意用户利用[session fixation（会话固定）](https://owasp.org/www-community/attacks/Session_fixation)攻击你的应用。

如果你使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)或 [Laravel Fortify](/docs/{{version}}/fortify)之一，Laravel 会在认证期间自动重新生成会话 ID；不过，如果你需要手动重新生成会话 ID，可以使用 `regenerate` 方法：

```php
$request->session()->regenerate();
```

如果你需要在单个语句中重新生成会话 ID 并移除会话中的所有数据，可以使用 `invalidate` 方法：

```php
$request->session()->invalidate();
```

<a name="session-cache"></a>
## 会话缓存

Laravel 的会话缓存提供了一种便捷的方式来缓存限定于单个用户会话的数据。与全局应用缓存不同，会话缓存数据会自动按会话隔离，并在会话过期或被销毁时被清理。会话缓存支持所有熟悉的 [Laravel 缓存方法](/docs/{{version}}/cache)，如 `get`、`put`、`remember`、`forget` 等等，但限定于当前会话。

会话缓存非常适合存储临时的、特定于用户的数据，这些数据你希望在同一个会话的多个请求之间保留，但不需要永久存储。这包括表单数据、临时计算、API 响应或任何其他应绑定到特定用户会话的临时数据。

你可以通过会话上的 `cache` 方法访问会话缓存：

```php
$discount = $request->session()->cache()->get('discount');

$request->session()->cache()->put(
    'discount', 10, now()->plus(minutes: 5)
);
```

有关 Laravel 缓存方法的更多信息，请查阅[缓存文档](/docs/{{version}}/cache)。

<a name="session-blocking"></a>
## 会话阻塞

> [!WARNING]
> 要使用会话阻塞，你的应用必须使用支持[原子锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，这些缓存驱动包括 `memcached`、`dynamodb`、`redis`、`mongodb`（包含在官方 `mongodb/laravel-mongodb` 包中）、`database`、`file` 和 `array` 驱动。此外，你不能使用 `cookie` 会话驱动。

默认情况下，Laravel 允许使用同一会话的请求并发执行。因此，例如，如果你使用 JavaScript HTTP 库向你的应用发出两个 HTTP 请求，它们将同时执行。对于许多应用来说，这不是问题；但是，在少数并发请求两个不同应用端点、且两者都会向会话写入数据的应用中，可能会发生会话数据丢失。

为缓解此问题，Laravel 提供了允许你限制给定会话并发请求的功能。要开始，你可以简单地在路由定义上链式调用 `block` 方法。在此示例中，对 `/profile` 端点的传入请求将获取一个会话锁。在此锁被持有时，任何共享同一会话 ID、指向 `/profile` 或 `/order` 端点的传入请求都将等待第一个请求完成执行后再继续：

```php
Route::post('/profile', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);

Route::post('/order', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);
```

`block` 方法接受两个可选参数。`block` 方法接受的第一个参数是会话锁在被释放前最多应持有的秒数。当然，如果请求在此之前完成执行，锁将被提前释放。

`block` 方法接受的第二个参数是请求在尝试获取会话锁时应等待的秒数。如果在给定的秒数内请求无法获取会话锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果这两个参数都没有传递，锁将最多持有 10 秒，请求在尝试获取锁时将最多等待 10 秒：

```php
Route::post('/profile', function () {
    // ...
})->block();
```

<a name="adding-custom-session-drivers"></a>
## 添加自定义会话驱动

<a name="implementing-the-driver"></a>
### 实现驱动

如果现有的会话驱动都不适合你的应用需求，Laravel 允许你编写自己的会话处理器。你的自定义会话驱动应实现 PHP 内置的 `SessionHandlerInterface`。该接口只包含几个简单的方法。一个 MongoDB 实现的桩代码如下所示：

```php
<?php

namespace App\Extensions;

class MongoSessionHandler implements \SessionHandlerInterface
{
    public function open($savePath, $sessionName) {}
    public function close() {}
    public function read($sessionId) {}
    public function write($sessionId, $data) {}
    public function destroy($sessionId) {}
    public function gc($lifetime) {}
}
```

由于 Laravel 没有提供默认目录来存放你的扩展，你可以自由地将它们放在任何你喜欢的地方。在此示例中，我们创建了一个 `Extensions` 目录来存放 `MongoSessionHandler`。

由于这些方法的目的不太容易理解，下面是每个方法用途的概述：

<div class="content-list" markdown="1">

- `open` 方法通常用于基于文件的会话存储系统。由于 Laravel 自带 `file` 会话驱动，你很少需要在此方法中放入任何内容。你可以简单地让此方法保持为空。
- `close` 方法与 `open` 方法一样，通常也可以忽略。对于大多数驱动来说，它是不需要的。
- `read` 方法应返回与给定 `$sessionId` 关联的会话数据的字符串版本。在驱动中检索或存储会话数据时无需进行任何序列化或其他编码，因为 Laravel 会为你执行序列化。
- `write` 方法应将与 `$sessionId` 关联的给定 `$data` 字符串写入某个持久化存储系统，例如 MongoDB 或你选择的其他存储系统。同样，你不应执行任何序列化——Laravel 已经为你处理了。
- `destroy` 方法应从持久化存储中移除与 `$sessionId` 关联的数据。
- `gc` 方法应销毁所有早于给定 `$lifetime`（一个 UNIX 时间戳）的会话数据。对于 Memcached 和 Redis 这类自过期系统，此方法可以留空。

</div>

<a name="registering-the-driver"></a>
### 注册驱动

实现好驱动后，你就可以在 Laravel 中注册它了。要向 Laravel 的会话后端添加额外的驱动，可以使用 `Session` [Facade](/docs/{{version}}/facades)提供的 `extend` 方法。你应从[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法。你可以从现有的 `App\Providers\AppServiceProvider` 中完成此操作，或创建一个全新的提供者：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoSessionHandler;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;

class SessionServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Session::extend('mongo', function (Application $app) {
            // Return an implementation of SessionHandlerInterface...
            return new MongoSessionHandler;
        });
    }
}
```

会话驱动注册后，你可以使用 `SESSION_DRIVER` 环境变量或在应用的 `config/session.php` 配置文件中指定 `mongo` 驱动作为应用的会话驱动。
