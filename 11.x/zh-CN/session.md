# HTTP 会话

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前置条件](#driver-prerequisites)
- [与会话交互](#interacting-with-the-session)
    - [获取数据](#retrieving-data)
    - [存储数据](#storing-data)
    - [闪存数据](#flash-data)
    - [删除数据](#deleting-data)
    - [重新生成会话 ID](#regenerating-the-session-id)
- [会话阻塞](#session-blocking)
- [添加自定义会话驱动](#adding-custom-session-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)

<a name="introduction"></a>
## 简介

由于 HTTP 驱动的应用是无状态的，会话提供了一种跨多个请求存储用户信息的方式。这些用户信息通常存放在一个持久化存储 / 后端中，以便后续请求访问。

Laravel 自带多种会话后端，可以通过一套富有表达力的统一 API 访问。其中包含对 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库等主流后端的支持。

<a name="configuration"></a>
### 配置

应用的会话配置文件存放在 `config/session.php`。请务必查看该文件中可用的选项。默认情况下，Laravel 被配置为使用 `database` 会话驱动。

会话的 `driver` 配置选项定义了每个请求的会话数据存储位置。Laravel 包含多种驱动：

<div class="content-list" markdown="1">

- `file` - 会话存储在 `storage/framework/sessions`。
- `cookie` - 会话存储在安全的加密 Cookie 中。
- `database` - 会话存储在关系型数据库中。
- `memcached` / `redis` - 会话存储在这些基于缓存的高速存储中。
- `dynamodb` - 会话存储在 AWS DynamoDB 中。
- `array` - 会话存储在 PHP 数组中，不会被持久化。

</div>

> [!NOTE]
> array 驱动主要用于[测试](/docs/{{version}}/testing)，可防止会话中存储的数据被持久化。

<a name="driver-prerequisites"></a>
### 驱动前置条件

<a name="database"></a>
#### 数据库

使用 `database` 会话驱动时，你需要确保有一个数据库表来存放会话数据。通常，Laravel 默认的 `0001_01_01_000000_create_users_table.php`[数据库迁移](/docs/{{version}}/migrations)中已包含该表；不过，如果出于任何原因你没有 `sessions` 表，可以使用 `make:session-table` Artisan 命令生成该迁移：

```shell
php artisan make:session-table

php artisan migrate
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis 会话之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包（~1.0）。有关配置 Redis 的更多信息，请查阅 Laravel 的 [Redis 文档](/docs/{{version}}/redis#configuration)。

> [!NOTE]
> 你可以使用 `SESSION_CONNECTION` 环境变量，或 `session.php` 配置文件中的 `connection` 选项，来指定用于会话存储的 Redis 连接。

<a name="interacting-with-the-session"></a>
## 与会话交互

<a name="retrieving-data"></a>
### 获取数据

在 Laravel 中处理会话数据主要有两种方式：全局 `session` 辅助函数，以及通过 `Request` 实例访问。我们先来看如何通过 `Request` 实例访问会话，它可以在路由闭包或控制器方法上进行类型提示。请记住，控制器方法的依赖会通过 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动注入：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class UserController extends Controller
    {
        /**
         * 显示给定用户的个人资料。
         */
        public function show(Request $request, string $id): View
        {
            $value = $request->session()->get('key');

            // ...

            $user = $this->users->find($id);

            return view('user.profile', ['user' => $user]);
        }
    }

从会话中获取某个值时，你也可以把默认值作为 `get` 方法的第二个参数传入。如果指定的键在会话中不存在，就会返回该默认值。如果你把闭包作为 `get` 方法的默认值，而请求的键不存在，则会执行该闭包并返回其结果：

    $value = $request->session()->get('key', 'default');

    $value = $request->session()->get('key', function () {
        return 'default';
    });

<a name="the-global-session-helper"></a>
#### 全局会话辅助函数

你也可以使用全局 `session` PHP 函数从会话中获取和存储数据。当 `session` 辅助函数只带一个字符串参数调用时，它会返回该会话键的值。当该辅助函数带一个键 / 值对数组调用时，这些值会被存储到会话中：

    Route::get('/home', function () {
        // 从会话中获取一段数据……
        $value = session('key');

        // 指定默认值……
        $value = session('key', 'default');

        // 向会话中存储一段数据……
        session(['key' => 'value']);
    });

> [!NOTE]
> 通过 HTTP 请求实例使用会话与使用全局 `session` 辅助函数在实际操作上差别很小。两种方式都可以通过 `assertSessionHas` 方法进行[测试](/docs/{{version}}/testing)，该方法在你所有的测试用例中都可用。

<a name="retrieving-all-session-data"></a>
#### 获取全部会话数据

如果你想获取会话中的全部数据，可以使用 `all` 方法：

    $data = $request->session()->all();

<a name="retrieving-a-portion-of-the-session-data"></a>
#### 获取部分会话数据

`only` 和 `except` 方法可用于获取会话数据的一个子集：

    $data = $request->session()->only(['username', 'email']);

    $data = $request->session()->except(['username', 'email']);

<a name="determining-if-an-item-exists-in-the-session"></a>
#### 判断某个项是否存在于会话中

要判断某个项是否存在于会话中，可以使用 `has` 方法。如果该项存在且不为 `null`，`has` 方法会返回 `true`：

    if ($request->session()->has('users')) {
        // ...
    }

要判断某个项是否存在于会话中（即使其值为 `null`），可以使用 `exists` 方法：

    if ($request->session()->exists('users')) {
        // ...
    }

要判断某个项是否不存在于会话中，可以使用 `missing` 方法。如果该项不存在，`missing` 方法会返回 `true`：

    if ($request->session()->missing('users')) {
        // ...
    }

<a name="storing-data"></a>
### 存储数据

要向会话中存储数据，通常可以使用请求实例的 `put` 方法或全局 `session` 辅助函数：

    // 通过请求实例……
    $request->session()->put('key', 'value');

    // 通过全局 "session" 辅助函数……
    session(['key' => 'value']);

<a name="pushing-to-array-session-values"></a>
#### 向数组类型的会话值追加数据

`push` 方法可用于向一个值为数组的会话值追加新值。例如，如果 `user.teams` 键包含一组团队名称，你可以这样向该数组追加新值：

    $request->session()->push('user.teams', 'developers');

<a name="retrieving-deleting-an-item"></a>
#### 获取并删除某一项

`pull` 方法会用一条语句从会话中获取并删除某一项：

    $value = $request->session()->pull('key', 'default');

<a name="incrementing-and-decrementing-session-values"></a>
#### 递增与递减会话值

如果会话数据中包含你想递增或递减的整数，可以使用 `increment` 和 `decrement` 方法：

    $request->session()->increment('count');

    $request->session()->increment('count', $incrementBy = 2);

    $request->session()->decrement('count');

    $request->session()->decrement('count', $decrementBy = 2);

<a name="flash-data"></a>
### 闪存数据

有时你希望把某些数据存储在会话中，供下一个请求使用。可以使用 `flash` 方法做到这一点。使用该方法存储在会话中的数据会立即可用，并在随后的 HTTP 请求期间可用。在随后的 HTTP 请求之后，闪存数据会被删除。闪存数据主要用于短暂的状态消息：

    $request->session()->flash('status', 'Task was successful!');

如果你需要让闪存数据持续多个请求，可以使用 `reflash` 方法，它会把所有闪存数据再保留一个请求。如果你只需要保留特定的闪存数据，可以使用 `keep` 方法：

    $request->session()->reflash();

    $request->session()->keep(['username', 'email']);

如果只想让闪存数据在当前请求中持续，可以使用 `now` 方法：

    $request->session()->now('status', 'Task was successful!');

<a name="deleting-data"></a>
### 删除数据

`forget` 方法会从会话中移除一段数据。如果你想移除会话中的所有数据，可以使用 `flush` 方法：

    // 忘记单个键……
    $request->session()->forget('name');

    // 忘记多个键……
    $request->session()->forget(['name', 'status']);

    $request->session()->flush();

<a name="regenerating-the-session-id"></a>
### 重新生成会话 ID

重新生成会话 ID 常常是为了防止恶意用户对你的应用发起[会话固定](https://owasp.org/www-community/attacks/Session_fixation)攻击。

如果你使用某个 Laravel [应用入门套件](/docs/{{version}}/starter-kits)或 [Laravel Fortify](/docs/{{version}}/fortify)，Laravel 会在认证期间自动重新生成会话 ID；不过，如果你需要手动重新生成会话 ID，可以使用 `regenerate` 方法：

    $request->session()->regenerate();

如果你需要用一条语句同时重新生成会话 ID 并移除会话中的所有数据，可以使用 `invalidate` 方法：

    $request->session()->invalidate();

<a name="session-blocking"></a>
## 会话阻塞

> [!WARNING]
> 要使用会话阻塞，你的应用必须使用支持[原子锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，这些缓存驱动包括 `memcached`、`dynamodb`、`redis`、`mongodb`（包含在官方 `mongodb/laravel-mongodb` 包中）、`database`、`file` 和 `array` 驱动。此外，你不能使用 `cookie` 会话驱动。

默认情况下，Laravel 允许使用同一会话的请求并发执行。因此，例如，如果你使用某个 JavaScript HTTP 库向应用发起两个 HTTP 请求，它们会同时执行。对许多应用来说这不是问题；不过，对于一小部分同时向两个不同应用端点发起并发请求、且两个端点都向会话写入数据的应用，可能会发生会话数据丢失。

为了缓解这个问题，Laravel 提供了可用于限制给定会话并发请求数的功能。要开始使用，只需在路由定义上链式调用 `block` 方法。在这个例子中，发往 `/profile` 端点的传入请求会获取会话锁。在该锁被持有期间，任何共享同一会话 ID、发往 `/profile` 或 `/order` 端点的传入请求都会等待第一个请求执行完毕后继续执行：

    Route::post('/profile', function () {
        // ...
    })->block($lockSeconds = 10, $waitSeconds = 10);

    Route::post('/order', function () {
        // ...
    })->block($lockSeconds = 10, $waitSeconds = 10);

`block` 方法接受两个可选参数。`block` 方法接受的第一个参数是会话锁在释放之前最多应保持的秒数。当然，如果请求在该时间之前就执行完毕，锁会更早释放。

`block` 方法接受的第二个参数是请求在尝试获取会话锁时应等待的秒数。如果请求无法在给定的秒数内获取到会话锁，就会抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果这两个参数都不传，锁最多会被保持 10 秒，请求在尝试获取锁时最多等待 10 秒：

    Route::post('/profile', function () {
        // ...
    })->block();

<a name="adding-custom-session-drivers"></a>
## 添加自定义会话驱动

<a name="implementing-the-driver"></a>
### 实现驱动

如果现有会话驱动都不适合你的应用需求，Laravel 允许你编写自己的会话处理器。你的自定义会话驱动应当实现 PHP 内置的 `SessionHandlerInterface`。该接口只包含少数几个简单方法。一个 MongoDB 实现桩如下所示：

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

由于 Laravel 没有提供存放扩展的默认目录，你可以自由地把它们放在任何位置。在这个例子中，我们创建了一个 `Extensions` 目录来存放 `MongoSessionHandler`。

由于这些方法的用途并不容易直接理解，下面概述每个方法的作用：

<div class="content-list" markdown="1">

- `open` 方法通常用于基于文件的会话存储系统。由于 Laravel 自带 `file` 会话驱动，你很少需要在这个方法中放任何内容，可以直接留空。
- 与 `open` 方法一样，`close` 方法通常也可以忽略。对大多数驱动来说并不需要它。
- `read` 方法应返回与给定 `$sessionId` 关联的会话数据的字符串形式。在你的驱动中获取或存储会话数据时无需做任何序列化或其他编码，因为 Laravel 会为你完成序列化。
- `write` 方法应把与 `$sessionId` 关联的给定 `$data` 字符串写入某个持久化存储系统，例如 MongoDB 或你自己选择的其他存储系统。同样，你不应做任何序列化——Laravel 已经为你处理好了。
- `destroy` 方法应从持久化存储中移除与 `$sessionId` 关联的数据。
- `gc` 方法应销毁所有比给定 `$lifetime`（一个 UNIX 时间戳）更早的会话数据。对于 Memcached 和 Redis 这类自动过期的系统，该方法可以留空。

</div>

<a name="registering-the-driver"></a>
### 注册驱动

驱动实现完成后，你就可以把它注册到 Laravel。要给 Laravel 的会话后端添加额外驱动，可以使用 `Session` [Facade](/docs/{{version}}/facades)提供的 `extend` 方法。你应当在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法。你可以在现有的 `App\Providers\AppServiceProvider` 中这样做，也可以创建一个全新的提供者：

    <?php

    namespace App\Providers;

    use App\Extensions\MongoSessionHandler;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Support\Facades\Session;
    use Illuminate\Support\ServiceProvider;

    class SessionServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
         */
        public function boot(): void
        {
            Session::extend('mongo', function (Application $app) {
                // 返回 SessionHandlerInterface 的一个实现……
                return new MongoSessionHandler;
            });
        }
    }

会话驱动注册完成后，你可以使用 `SESSION_DRIVER` 环境变量，或在应用的 `config/session.php` 配置文件中把 `mongo` 指定为应用的会话驱动。
