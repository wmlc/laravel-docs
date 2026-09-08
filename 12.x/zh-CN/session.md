# HTTP 会话

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
- [与 Session 交互](#interacting-with-the-session)
    - [读取数据](#retrieving-data)
    - [存储数据](#storing-data)
    - [闪存数据](#flash-data)
    - [删除数据](#deleting-data)
    - [重新生成 Session ID](#regenerating-the-session-id)
- [Session 缓存](#session-cache)
- [Session 阻塞](#session-blocking)
- [添加自定义 Session 驱动](#adding-custom-session-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)

<a name="introduction"></a>
## 简介

由于 HTTP 驱动的应用是无状态的，Session 提供了一种跨多个请求存储用户信息的方式。这些用户信息通常保存在一个持久化存储 / 后端中，后续请求可以访问它。

Laravel 内置了多种 Session 后端，并可通过一个富有表现力、统一的 API 来访问。Laravel 支持流行的后端，例如 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库。

<a name="configuration"></a>
### 配置

应用的 Session 配置文件位于 `config/session.php`。请务必查看该文件中可用的选项。默认情况下，Laravel 配置为使用 `database` Session 驱动。

Session 的 `driver` 配置选项定义了每个请求的 Session 数据存储在哪里。Laravel 包含多种驱动：

<div class="content-list" markdown="1">

- `file` - Session 存储在 `storage/framework/sessions` 中。
- `cookie` - Session 存储在安全、加密的 cookie 中。
- `database` - Session 存储在关系型数据库中。
- `memcached` / `redis` - Session 存储在这类快速的、基于缓存的存储中。
- `dynamodb` - Session 存储在 AWS DynamoDB 中。
- `array` - Session 存储在 PHP 数组中，不会被持久化。

</div>

> [!NOTE]
> `array` 驱动主要用于[测试](/docs/{{version}}/testing)期间，它可以防止 Session 中存储的数据被持久化。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="database"></a>
#### 数据库

使用 `database` Session 驱动时，你需要确保有一张数据库表来存放 Session 数据。通常，Laravel 默认的 `0001_01_01_000000_create_users_table.php` [数据库迁移](/docs/{{version}}/migrations)已经包含它；不过，如果由于某种原因你没有 `sessions` 表，可以使用 `make:session-table` Artisan 命令生成该迁移：

```shell
php artisan make:session-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis Session 之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包（~1.0）。有关配置 Redis 的更多信息，请查阅 Laravel 的 [Redis 文档](/docs/{{version}}/redis#configuration)。

> [!NOTE]
> 可以使用 `SESSION_CONNECTION` 环境变量，或 `session.php` 配置文件中的 `connection` 选项，指定用哪个 Redis 连接来存储 Session。

<a name="interacting-with-the-session"></a>
## 与 Session 交互

<a name="retrieving-data"></a>
### 读取数据

在 Laravel 中操作 Session 数据主要有两种方式：全局 `session` 助手函数和 `Request` 实例。首先，我们来看如何通过 `Request` 实例访问 Session，它可以在路由闭包或控制器方法中进行类型提示。请记住，控制器方法的依赖项会由 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动注入：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示给定用户的个人信息。
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

从 Session 中获取数据项时，你也可以向 `get` 方法传递默认值作为第二个参数。如果指定的键在 Session 中不存在，就会返回该默认值。如果你向 `get` 方法传递一个闭包作为默认值，而请求的键不存在，该闭包将被执行并返回其结果：

```php
$value = $request->session()->get('key', 'default');

$value = $request->session()->get('key', function () {
    return 'default';
});
```

<a name="the-global-session-helper"></a>
#### 全局 Session 助手函数

你也可以使用全局的 `session` PHP 函数来读取和存储 Session 数据。当 `session` 助手函数以单个字符串参数调用时，它会返回该 Session 键的值。当该助手函数以键 / 值对数组调用时，这些值会被存入 Session：

```php
Route::get('/home', function () {
    // 从 Session 中获取一条数据...
    $value = session('key');

    // 指定默认值...
    $value = session('key', 'default');

    // 在 Session 中存储一条数据...
    session(['key' => 'value']);
});
```

> [!NOTE]
> 通过 HTTP 请求实例使用 Session 与使用全局 `session` 助手函数在实际效果上几乎没有区别。两种方式都可以在所有测试用例中通过 `assertSessionHas` 方法进行[测试](/docs/{{version}}/testing)。

<a name="retrieving-all-session-data"></a>
#### 读取所有 Session 数据

如果想获取 Session 中的所有数据，可以使用 `all` 方法：

```php
$data = $request->session()->all();
```

<a name="retrieving-a-portion-of-the-session-data"></a>
#### 读取部分 Session 数据

`only` 和 `except` 方法可用于获取 Session 数据的一个子集：

```php
$data = $request->session()->only(['username', 'email']);

$data = $request->session()->except(['username', 'email']);
```

<a name="determining-if-an-item-exists-in-the-session"></a>
#### 判断 Session 中是否存在某个数据项

要判断 Session 中是否存在某个数据项，可以使用 `has` 方法。如果该数据项存在且不为 `null`，`has` 方法返回 `true`：

```php
if ($request->session()->has('users')) {
    // ...
}
```

要判断 Session 中是否存在某个数据项（即使其值为 `null`），可以使用 `exists` 方法：

```php
if ($request->session()->exists('users')) {
    // ...
}
```

要判断 Session 中是否不存在某个数据项，可以使用 `missing` 方法。如果该数据项不存在，`missing` 方法返回 `true`：

```php
if ($request->session()->missing('users')) {
    // ...
}
```

<a name="storing-data"></a>
### 存储数据

要将数据存入 Session，通常使用请求实例的 `put` 方法或全局 `session` 助手函数：

```php
// 通过请求实例...
$request->session()->put('key', 'value');

// 通过全局 "session" 助手函数...
session(['key' => 'value']);
```

<a name="pushing-to-array-session-values"></a>
#### 向数组类型的 Session 值中追加元素

`push` 方法可用于向一个数组类型的 Session 值中追加新值。例如，如果 `user.teams` 键包含一个团队名称数组，你可以像这样向该数组追加一个新值：

```php
$request->session()->push('user.teams', 'developers');
```

<a name="retrieving-deleting-an-item"></a>
#### 获取并删除数据项

`pull` 方法可以在一条语句中获取并删除 Session 中的数据项：

```php
$value = $request->session()->pull('key', 'default');
```

<a name="incrementing-and-decrementing-session-values"></a>
#### 递增与递减 Session 值

如果 Session 数据中包含你想递增或递减的整数，可以使用 `increment` 和 `decrement` 方法：

```php
$request->session()->increment('count');

$request->session()->increment('count', $incrementBy = 2);

$request->session()->decrement('count');

$request->session()->decrement('count', $decrementBy = 2);
```

<a name="flash-data"></a>
### 闪存数据

有时你可能希望只在下一个请求内使用 Session 中的数据项。这可以通过 `flash` 方法实现。使用该方法存入 Session 的数据会立即可用，并在后续的 HTTP 请求期间可用。后续 HTTP 请求结束后，闪存数据将被删除。闪存数据主要用于短期的状态消息：

```php
$request->session()->flash('status', 'Task was successful!');
```

如果需要让闪存数据在多个请求中保持可用，可以使用 `reflash` 方法，它会把所有闪存数据再保留一个额外的请求。如果只需保留特定的闪存数据，可以使用 `keep` 方法：

```php
$request->session()->reflash();

$request->session()->keep(['username', 'email']);
```

如果只想在当前请求内保留闪存数据，可以使用 `now` 方法：

```php
$request->session()->now('status', 'Task was successful!');
```

<a name="deleting-data"></a>
### 删除数据

`forget` 方法会从 Session 中移除一条数据。如果想移除 Session 中的所有数据，可以使用 `flush` 方法：

```php
// 忘记单个键...
$request->session()->forget('name');

// 忘记多个键...
$request->session()->forget(['name', 'status']);

$request->session()->flush();
```

<a name="regenerating-the-session-id"></a>
### 重新生成 Session ID

重新生成 Session ID 通常是为了防止恶意用户利用[会话固定（session fixation）](https://owasp.org/www-community/attacks/Session_fixation)攻击你的应用。

如果你使用的是 Laravel [应用入门套件](/docs/{{version}}/starter-kits)或 [Laravel Fortify](/docs/{{version}}/fortify)，Laravel 会在身份验证期间自动重新生成 Session ID；不过，如果你需要手动重新生成 Session ID，可以使用 `regenerate` 方法：

```php
$request->session()->regenerate();
```

如果需要在一条语句中重新生成 Session ID 并移除 Session 中的所有数据，可以使用 `invalidate` 方法：

```php
$request->session()->invalidate();
```

<a name="session-cache"></a>
## Session 缓存

Laravel 的 Session 缓存为缓存作用域限定在单个用户会话内的数据提供了一种便捷方式。与应用的全局缓存不同，Session 缓存数据会自动按会话隔离，并在会话过期或销毁时被清理。Session 缓存支持所有熟悉的 [Laravel 缓存方法](/docs/{{version}}/cache)，如 `get`、`put`、`remember`、`forget` 等，但作用域限定在当前会话内。

Session 缓存非常适合存储临时的、用户特定的数据，这些数据需要在同一会话内的多个请求间保持，但不需要永久保存。这包括表单数据、临时计算结果、API 响应，或任何应绑定到特定用户会话的短时效数据。

你可以通过 Session 的 `cache` 方法访问 Session 缓存：

```php
$discount = $request->session()->cache()->get('discount');

$request->session()->cache()->put(
    'discount', 10, now()->plus(minutes: 5)
);
```

有关 Laravel 缓存方法的更多信息，请查阅[缓存文档](/docs/{{version}}/cache)。

<a name="session-blocking"></a>
## Session 阻塞

> [!WARNING]
> 要使用 Session 阻塞，你的应用必须使用支持[原子锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，支持的缓存驱动包括 `memcached`、`dynamodb`、`redis`、`mongodb`（包含在官方 `mongodb/laravel-mongodb` 包中）、`database`、`file` 和 `array` 驱动。此外，不能使用 `cookie` Session 驱动。

默认情况下，Laravel 允许使用同一 Session 的请求并发执行。例如，如果你使用某个 JavaScript HTTP 库向应用发起两个 HTTP 请求，它们会同时执行。对许多应用来说这不是问题；不过，在少数应用中，如果并发请求访问两个不同的应用端点，且两者都向 Session 写入数据，就可能发生 Session 数据丢失。

为了缓解这个问题，Laravel 提供了限制给定 Session 并发请求的功能。开始使用时，只需在你的路由定义上链式调用 `block` 方法。在这个示例中，进入 `/profile` 端点的请求会获取一个 Session 锁。在该锁被持有期间，任何进入 `/profile` 或 `/order` 端点且共享同一 Session ID 的请求，都会等待第一个请求执行完毕后再继续执行：

```php
Route::post('/profile', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);

Route::post('/order', function () {
    // ...
})->block($lockSeconds = 10, $waitSeconds = 10);
```

`block` 方法接受两个可选参数。`block` 方法接受的第一个参数是 Session 锁在释放前被持有的最大秒数。当然，如果请求在这个时间之前执行完毕，锁会提前释放。

`block` 方法接受的第二个参数是请求在尝试获取 Session 锁时等待的秒数。如果请求在给定的秒数内无法获取 Session 锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException` 异常。

如果没有传递这两个参数，锁最多将被持有 10 秒，请求在尝试获取锁时最多等待 10 秒：

```php
Route::post('/profile', function () {
    // ...
})->block();
```

<a name="adding-custom-session-drivers"></a>
## 添加自定义 Session 驱动

<a name="implementing-the-driver"></a>
### 实现驱动

如果现有的 Session 驱动都无法满足应用的需求，Laravel 允许你编写自己的 Session 处理器。你的自定义 Session 驱动应实现 PHP 内置的 `SessionHandlerInterface` 接口。该接口只包含几个简单的方法。一个 MongoDB 实现的骨架如下所示：

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

由于 Laravel 没有提供存放扩展的默认目录，你可以自由选择放置位置。在本例中，我们创建了一个 `Extensions` 目录来存放 `MongoSessionHandler`。

由于这些方法的用途不太容易理解，下面概述每个方法的用途：

<div class="content-list" markdown="1">

- `open` 方法通常用于基于文件的 Session 存储系统。由于 Laravel 自带 `file` Session 驱动，你几乎不需要在这个方法中写任何内容，让它保持为空即可。
- `close` 方法与 `open` 方法类似，通常也可以忽略。对大多数驱动而言，并不需要它。
- `read` 方法应返回与给定 `$sessionId` 关联的 Session 数据的字符串版本。在你的驱动中读取或存储 Session 数据时，无需进行任何序列化或其他编码，Laravel 会替你完成序列化。
- `write` 方法应将与 `$sessionId` 关联的给定 `$data` 字符串写入某个持久化存储系统，例如 MongoDB 或你选择的其他存储系统。再次强调，你不应执行任何序列化——Laravel 已经替你处理好了。
- `destroy` 方法应从持久化存储中移除与 `$sessionId` 关联的数据。
- `gc` 方法应销毁所有早于给定 `$lifetime`（UNIX 时间戳）的 Session 数据。对于 Memcached 和 Redis 这类支持自动过期的系统，该方法可以留空。

</div>

<a name="registering-the-driver"></a>
### 注册驱动

驱动实现完成后，就可以将它注册到 Laravel 中了。要向 Laravel 的 Session 后端添加额外的驱动，可以使用 `Session` [Facade](/docs/{{version}}/facades) 提供的 `extend` 方法。你应当在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法。既可以在现有的 `App\Providers\AppServiceProvider` 中调用，也可以创建一个全新的服务提供者：

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
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Session::extend('mongo', function (Application $app) {
            // 返回一个 SessionHandlerInterface 的实现...
            return new MongoSessionHandler;
        });
    }
}
```

Session 驱动注册完成后，你可以使用 `SESSION_DRIVER` 环境变量或在应用的 `config/session.php` 配置文件中，将 `mongo` 驱动指定为应用的 Session 驱动。
