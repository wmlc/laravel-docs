# HTTP Session

由于 HTTP 驱动的应用是无状态的，会话（Session）提供了一种在多次请求之间存储用户相关信息的方式。这些用户信息通常放置在可从后续请求访问的持久化存储/后端中。

Laravel 自带多种可通过富有表现力、统一的 API 访问的会话后端。它包含对 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库等流行后端的支持。

### 配置

你的应用的会话配置文件存放在 `config/session.php`。请务必查看该文件中可用的选项。默认情况下，Laravel 被配置为使用 `database` 会话驱动。

会话 `driver` 配置选项定义了每个请求期间会话数据的存储位置。Laravel 包含多种驱动：

- `file` - 会话存储在 `storage/framework/sessions`。
- `cookie` - 会话存储在安全、加密的 Cookie 中。
- `database` - 会话存储在关系型数据库中。
- `memcached` / `redis` - 会话存储在这些基于快速缓存的存储之一中。
- `dynamodb` - 会话存储在 AWS DynamoDB 中。
- `array` - 会话存储在 PHP 数组中，且不会被持久化。

> [!NOTE]
> array 驱动主要在 [测试](/topic/Laravel%2013.x/e296oqw9q7.html) 期间使用，它会阻止存储在会话中的数据被持久化。

### 驱动前置条件

#### 数据库

当使用 `database` 会话驱动时，你需要确保有一个用于存储会话数据的数据库表。通常，这已包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` [数据库迁移](/topic/Laravel%2013.x/x3vo0g4vm1.html) 中；但是，如果由于任何原因你没有 `sessions` 表，可以使用 `make:session-table` Artisan 命令来生成该迁移：

```shell
php artisan make:session-table

php artisan migrate
```

#### Redis

在 Laravel 中使用 Redis 会话之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包。关于配置 Redis 的更多信息，请参阅 Laravel 的 [Redis 文档](/topic/Laravel%2013.x/569x518yep.html)。

> [!NOTE]
> `SESSION_CONNECTION` 环境变量，或 `session.php` 配置文件中的 `connection` 选项，可用于指定哪个 Redis 连接用于会话存储。

## 与 Session 交互

### 获取数据

在 Laravel 中处理会话数据有两种主要方式：全局 `session` 辅助函数，以及通过 `Request` 实例。首先，我们来看看通过 `Request` 实例访问会话，它可以在路由闭包或控制器方法上进行类型提示。请记住，控制器方法的依赖会通过 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 自动注入：

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

当你从会话中检索一个条目时，还可以将默认值作为第二个参数传给 `get` 方法。如果指定的键在会话中不存在，就会返回该默认值。如果你将闭包作为默认值传给 `get` 方法，且请求的键不存在，该闭包会被执行并返回其结果：

```php
$value = $request->session()->get('key', 'default');

$value = $request->session()->get('key', function () {
    return 'default';
});
```

#### 全局 Session 辅助函数

你也可以使用全局 `session` PHP 函数来检索和存储会话中的数据。当 `session` 辅助函数以单个字符串参数被调用时，它会返回该会话键的值。当该辅助函数以键/值对数组被调用时，这些值会被存储到会话中：

```php
Route::get('/home', function () {
    // 从会话中检索一条数据...
    $value = session('key');

    // 指定默认值...
    $value = session('key', 'default');

    // 在会话中存储一条数据...
    session(['key' => 'value']);
});
```

> [!NOTE]
> 通过 HTTP 请求实例使用会话，与通过全局 `session` 辅助函数使用会话，二者在实际差别上很小。两种方法都可通过 `assertSessionHas` 方法进行 [测试](/topic/Laravel%2013.x/e296oqw9q7.html)，该方法在你的所有测试用例中都可用。

#### 获取全部 Session 数据

如果你想检索会话中的所有数据，可以使用 `all` 方法：

```php
$data = $request->session()->all();
```

#### 获取部分 Session 数据

`only` 和 `except` 方法可用于检索会话数据的子集：

```php
$data = $request->session()->only(['username', 'email']);

$data = $request->session()->except(['username', 'email']);
```

#### 判断 Session 中是否存在某项

要判定某个条目是否存在于会话中，可以使用 `has` 方法。`has` 方法在条目存在且不为 `null` 时返回 `true`：

```php
if ($request->session()->has('users')) {
    // ...
}
```

要判定某个条目是否存在于会话中（即使其值为 `null`），可以使用 `exists` 方法：

```php
if ($request->session()->exists('users')) {
    // ...
}
```

要判定某个条目是否不存在于会话中，可以使用 `missing` 方法。`missing` 方法在条目不存在时返回 `true`：

```php
if ($request->session()->missing('users')) {
    // ...
}
```

### 存储数据

要将数据存储到会话中，通常会使用请求实例的 `put` 方法或全局 `session` 辅助函数：

```php
// 通过请求实例...
$request->session()->put('key', 'value');

// 通过全局 "session" 辅助函数...
session(['key' => 'value']);
```

#### 向数组 Session 值追加

`push` 方法可用于将一个新值推入一个数组类型的会话值中。例如，如果 `user.teams` 键包含一个团队名称数组，你可以像这样向该数组推入一个新值：

```php
$request->session()->push('user.teams', 'developers');
```

#### 获取并删除一项

`pull` 方法会在单条语句中从会话检索并删除一个条目：

```php
$value = $request->session()->pull('key', 'default');
```

#### 递增与递减 Session 值

如果你的会话数据包含一个想要递增或递减的整数，可以使用 `increment` 和 `decrement` 方法：

```php
$request->session()->increment('count');

$request->session()->increment('count', $incrementBy = 2);

$request->session()->decrement('count');

$request->session()->decrement('count', $decrementBy = 2);
```

### 闪存数据

有时你可能希望将条目存储到会话中，供下一次请求使用。你可以使用 `flash` 方法来实现。用该方法存储在会话中的数据将立即可用，并在随后的 HTTP 请求期间可用。在随后的 HTTP 请求之后，被闪存（flash）的数据会被删除。闪存数据主要用于短暂的状态消息：

```php
$request->session()->flash('status', 'Task was successful!');
```

如果你需要将闪存数据保留若干次请求，可以使用 `reflash` 方法，它会将所有闪存数据再保留一次请求。如果你只需要保留特定的闪存数据，可以使用 `keep` 方法：

```php
$request->session()->reflash();

$request->session()->keep(['username', 'email']);
```

要只将你的闪存数据保留到当前请求，可以使用 `now` 方法：

```php
$request->session()->now('status', 'Task was successful!');
```

### 删除数据

`forget` 方法会从会话中移除一条数据。如果你想从会话中移除所有数据，可以使用 `flush` 方法：

```php
// 删除单个键...
$request->session()->forget('name');

// 删除多个键...
$request->session()->forget(['name', 'status']);

$request->session()->flush();
```

### 重新生成 Session ID

重新生成会话 ID 通常是为了防止恶意用户利用针对你应用的 [会话固定](https://owasp.org/www-community/attacks/Session_fixation) 攻击。

如果你正在使用 Laravel [应用入门套件](/topic/Laravel%2013.x/kl9nop7vz4.html) 或 [Laravel Fortify](/topic/Laravel%2013.x/x3vo0x4vm1.html)，Laravel 会在认证过程中自动重新生成会话 ID；但是，如果你需要手动重新生成会话 ID，可以使用 `regenerate` 方法：

```php
$request->session()->regenerate();
```

如果你需要重新生成会话 ID 并在单条语句中从会话中移除所有数据，可以使用 `invalidate` 方法：

```php
$request->session()->invalidate();
```

## Session 缓存

Laravel 的会话缓存提供了一种便捷的方式，用于缓存限定在单个用户会话范围内的数据。与全局应用缓存不同，会话缓存数据会自动按会话隔离，并在会话过期或被销毁时清理。会话缓存支持所有熟悉的 [Laravel 缓存方法](/topic/Laravel%2013.x/5dve2w3v4x.html)，如 `get`、`put`、`remember`、`forget` 等，但限定在当前会话范围内。

会话缓存非常适合存储临时的、特定于用户的数据——这些数据你想在同一会话内的多次请求之间持久化，但又不需要永久存储。这包括表单数据、临时计算结果、API 响应，或任何其他应当绑定到特定用户会话的临时数据。

你可以通过会话上的 `cache` 方法访问会话缓存：

```php
$discount = $request->session()->cache()->get('discount');

$request->session()->cache()->put(
    'discount', 10, now()->plus(minutes: 5)
);
```

关于 Laravel 缓存方法的更多信息，请参阅 [缓存文档](/topic/Laravel%2013.x/5dve2w3v4x.html)。

## Session 阻塞

> [!WARNING]
> 要使用会话阻塞，你的应用必须使用支持 [原子锁](/topic/Laravel%2013.x/5dve2w3v4x.html) 的缓存驱动。目前，这些缓存驱动包括 `memcached`、`dynamodb`、`redis`、`mongodb`（包含在官方 `mongodb/laravel-mongodb` 包中）、`database`、`file` 和 `array` 驱动。此外，你不能使用 `cookie` 会话驱动。

默认情况下，Laravel 允许使用同一会话的请求并发执行。因此，例如，如果你使用某个 JavaScript HTTP 库向你的应用发起两个 HTTP 请求，它们会同时执行。对许多应用而言，这没有问题；但是，在少数会向两个不同应用端点并发请求、且两者都向会话写入数据的应用中，可能会发生会话数据丢失。

为了缓解这一问题，Laravel 提供了限制给定会话并发请求的功能。要开始使用，你只需在路由定义上链式调用 `block` 方法。在这个例子中，对 `/profile` 端点的传入请求会获取一个会话锁。在持有该锁期间，任何对共享同一会话 ID 的 `/profile` 或 `/order` 端点的传入请求，都会等待第一个请求执行完成后再继续执行：

```php
Route::post('/profile', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);

Route::post('/order', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);
```

`block` 方法接受两个可选参数。它接受的第一个参数是会话锁在被释放前应当被持有的最大秒数。当然，如果请求在此时间之前执行完成，锁会更早被释放。

`block` 方法接受的第二个参数是请求在尝试获取会话锁时应当等待的秒数。如果请求无法在给定的秒数内获取会话锁，会抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果这两个参数都不传入，锁最多会被获取 10 秒，请求在尝试获取锁时会最多等待 10 秒：

```php
Route::post('/profile', function () {
    // ...
})->block();
```

## 添加自定义 Session 驱动

### 实现驱动

如果现有的会话驱动都不符合你应用的需求，Laravel 允许你编写自己的会话处理器。你的自定义会话驱动应当实现 PHP 内置的 `SessionHandlerInterface`。该接口只包含两个简单方法。一个桩（stub）化的 MongoDB 实现如下所示：

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

由于 Laravel 没有包含用于存放你的扩展的默认目录，你可以将它们放在任何你喜欢的位置。在这个例子中，我们创建了一个 `Extensions` 目录来存放 `MongoSessionHandler`。

由于这些方法的作用并非一目了然，下面是每个方法用途的概述：

- `open` 方法通常用于基于文件的会话存储系统。由于 Laravel 自带一个 `file` 会话驱动，你很少需要在这个方法中放任何内容。你可以直接让这个方法为空。
- 与 `open` 方法类似，`close` 方法通常也可以忽略。对大多数驱动而言，它并不需要。
- `read` 方法应当返回与给定 `$sessionId` 关联的会话数据的字符串版本。在你的驱动中检索或存储会话数据时，无需做任何序列化或其他编码，因为 Laravel 会为你执行序列化。
- `write` 方法应当将与 `$sessionId` 关联的给定 `$data` 字符串写入某个持久化存储系统，例如 MongoDB 或你选择的另一个存储系统。同样，你不应该执行任何序列化——Laravel 已经为你处理好了。
- `destroy` 方法应当从持久化存储中移除与 `$sessionId` 关联的数据。
- `gc` 方法应当销毁所有早于给定 `$lifetime`（这是一个 UNIX 时间戳）的会话数据。对于 Memcached 和 Redis 这类自带过期的系统，这个方法可以留空。

### 注册驱动

驱动实现完成后，你就可以将它注册到 Laravel 中。要向 Laravel 的会话后端添加额外的驱动，可以使用 `Session` [Facade](/topic/Laravel%2013.x/569x508yep.html) 提供的 `extend` 方法。你应该在 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用 `extend` 方法。你可以在现有的 `App\Providers\AppServiceProvider` 中完成，也可以创建一个全新的提供者：

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
            // 返回 SessionHandlerInterface 的实现...
            return new MongoSessionHandler;
        });
    }
}
```

一旦注册了会话驱动，你就可以使用 `SESSION_DRIVER` 环境变量，或在应用的 `config/session.php` 配置文件中，将 `mongo` 驱动指定为你的应用的会话驱动。
