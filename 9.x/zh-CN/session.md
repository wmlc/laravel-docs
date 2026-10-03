# HTTP 会话

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
- [与 Session 交互](#interacting-with-the-session)
    - [检索数据](#retrieving-data)
    - [存储数据](#storing-data)
    - [闪存数据](#flash-data)
    - [删除数据](#deleting-data)
    - [重新生成 Session ID](#regenerating-the-session-id)
- [Session 阻塞](#session-blocking)
- [添加自定义 Session 驱动](#adding-custom-session-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)

<a name="introduction"></a>
## 简介

由于 HTTP 驱动的应用是无状态的，Session 提供了一种在多个请求间存储用户信息的方式。这些用户信息通常放置在一个可以从后续请求中访问的持久化存储 / 后端中。

Laravel 内置了多种 Session 后端，通过一个富有表现力且统一的 API 进行访问。包括对 [Memcached](https://memcached.org)、[Redis](https://redis.io) 和数据库等流行后端的支持。

<a name="configuration"></a>
### 配置

应用的 Session 配置文件存储在 `config/session.php`。请务必查看此文件中可用的选项。默认情况下，Laravel 配置为使用 `file` Session 驱动，这对许多应用来说都能很好地工作。如果你的应用将在多个 Web 服务器之间进行负载均衡，应选择所有服务器都能访问的集中式存储，例如 Redis 或数据库。

Session `driver` 配置选项定义了每个请求的 Session 数据存储位置。Laravel 内置了几个出色的驱动：

- `file` - Session 存储在 `storage/framework/sessions`。
- `cookie` - Session 存储在安全、加密的 cookie 中。
- `database` - Session 存储在关系型数据库中。
- `memcached` / `redis` - Session 存储在这些快速、基于缓存的存储中。
- `dynamodb` - Session 存储在 AWS DynamoDB 中。
- `array` - Session 存储在 PHP 数组中，不会被持久化。

> **Note**  
> `array` 驱动主要用于[测试](/docs/{{version}}/testing)期间，防止 Session 中存储的数据被持久化。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="database"></a>
#### 数据库

使用 `database` Session 驱动时，你需要创建一个表来包含 Session 记录。下面是该表的示例 `Schema` 声明：

    Schema::create('sessions', function ($table) {
        $table->string('id')->primary();
        $table->foreignId('user_id')->nullable()->index();
        $table->string('ip_address', 45)->nullable();
        $table->text('user_agent')->nullable();
        $table->text('payload');
        $table->integer('last_activity')->index();
    });

你可以使用 `session:table` Artisan 命令生成此迁移。要了解更多关于数据库迁移的信息，请查阅完整的[迁移文档](/docs/{{version}}/migrations)：

```shell
php artisan session:table

php artisan migrate
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis Session 之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或者通过 Composer 安装 `predis/predis` 包（~1.0）。有关配置 Redis 的更多信息，请查阅 Laravel 的 [Redis 文档](/docs/{{version}}/redis#configuration)。

> **Note**  
> 在 `session` 配置文件中，可以使用 `connection` 选项指定 Session 使用的 Redis 连接。

<a name="interacting-with-the-session"></a>
## 与 Session 交互

<a name="retrieving-data"></a>
### 检索数据

在 Laravel 中操作 Session 数据主要有两种方式：全局 `session` 辅助函数和通过 `Request` 实例。首先，让我们看看通过 `Request` 实例访问 Session，该实例可以在路由闭包或控制器方法中进行类型提示。请记住，控制器方法依赖项会通过 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动注入：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Http\Request;

    class UserController extends Controller
    {
        /**
         * 显示给定用户的资料。
         *
         * @param  Request  $request
         * @param  int  $id
         * @return Response
         */
        public function show(Request $request, $id)
        {
            $value = $request->session()->get('key');

            //
        }
    }

从 Session 中检索项目时，你还可以将默认值作为第二个参数传递给 `get` 方法。如果指定的键在 Session 中不存在，将返回此默认值。如果你将闭包作为默认值传递给 `get` 方法且请求的键不存在，闭包将被执行并返回其结果：

    $value = $request->session()->get('key', 'default');

    $value = $request->session()->get('key', function () {
        return 'default';
    });

<a name="the-global-session-helper"></a>
#### 全局 Session 辅助函数

你也可以使用全局 `session` PHP 函数来检索和存储 Session 数据。当使用单个字符串参数调用 `session` 辅助函数时，它将返回该 Session 键的值。当使用键 / 值对数组调用该辅助函数时，这些值将存储在 Session 中：

    Route::get('/home', function () {
        // 从 Session 中检索一条数据...
        $value = session('key');

        // 指定默认值...
        $value = session('key', 'default');

        // 在 Session 中存储一条数据...
        session(['key' => 'value']);
    });

> **Note**  
> 通过 HTTP 请求实例使用 Session 与使用全局 `session` 辅助函数之间几乎没有实际差异。两种方法都可以通过所有测试用例中可用的 `assertSessionHas` 方法进行[测试](/docs/{{version}}/testing)。

<a name="retrieving-all-session-data"></a>
#### 检索所有 Session 数据

如果你想检索 Session 中的所有数据，可以使用 `all` 方法：

    $data = $request->session()->all();

<a name="determining-if-an-item-exists-in-the-session"></a>
#### 判断 Session 中是否存在某项

要判断 Session 中是否存在某项，可以使用 `has` 方法。`has` 方法在项目存在且不为 `null` 时返回 `true`：

    if ($request->session()->has('users')) {
        //
    }

要判断 Session 中是否存在某项，即使其值为 `null`，可以使用 `exists` 方法：

    if ($request->session()->exists('users')) {
        //
    }

要判断 Session 中是否不存在某项，可以使用 `missing` 方法。`missing` 方法在项目不存在时返回 `true`：

    if ($request->session()->missing('users')) {
        //
    }

<a name="storing-data"></a>
### 存储数据

要将数据存储在 Session 中，通常使用请求实例的 `put` 方法或全局 `session` 辅助函数：

    // 通过请求实例...
    $request->session()->put('key', 'value');

    // 通过全局 "session" 辅助函数...
    session(['key' => 'value']);

<a name="pushing-to-array-session-values"></a>
#### 推入数组 Session 值

`push` 方法可用于将新值推入作为数组的 Session 值中。例如，如果 `user.teams` 键包含一组团队名称的数组，可以这样将新值推入数组：

    $request->session()->push('user.teams', 'developers');

<a name="retrieving-deleting-an-item"></a>
#### 检索并删除项目

`pull` 方法将在单条语句中检索并删除 Session 中的项目：

    $value = $request->session()->pull('key', 'default');

<a name="incrementing-and-decrementing-session-values"></a>
#### 递增和递减 Session 值

如果你的 Session 数据包含一个你希望递增或递减的整数，可以使用 `increment` 和 `decrement` 方法：

    $request->session()->increment('count');

    $request->session()->increment('count', $incrementBy = 2);

    $request->session()->decrement('count');

    $request->session()->decrement('count', $decrementBy = 2);

<a name="flash-data"></a>
### 闪存数据

有时你可能希望将项目存储在 Session 中仅供下一个请求使用。可以使用 `flash` 方法实现。使用此方法存储在 Session 中的数据将立即可用，并在后续 HTTP 请求期间也可用。后续 HTTP 请求之后，闪存数据将被删除。闪存数据主要用于短期的状态消息：

    $request->session()->flash('status', 'Task was successful!');

如果需要在多个请求中保留闪存数据，可以使用 `reflash` 方法，它将保留所有闪存数据用于一个额外的请求。如果只需保留特定的闪存数据，可以使用 `keep` 方法：

    $request->session()->reflash();

    $request->session()->keep(['username', 'email']);

如果只想为当前请求保留闪存数据，可以使用 `now` 方法：

    $request->session()->now('status', 'Task was successful!');

<a name="deleting-data"></a>
### 删除数据

`forget` 方法将从 Session 中移除一条数据。如果想从 Session 中移除所有数据，可以使用 `flush` 方法：

    // 移除单个键...
    $request->session()->forget('name');

    // 移除多个键...
    $request->session()->forget(['name', 'status']);

    $request->session()->flush();

<a name="regenerating-the-session-id"></a>
### 重新生成 Session ID

重新生成 Session ID 通常是为了防止恶意用户对你的应用发起 [Session 固定](https://owasp.org/www-community/attacks/Session_fixation)攻击。

如果你使用 Laravel [应用入门套件](/docs/{{version}}/starter-kits)或 [Laravel Fortify](/docs/{{version}}/fortify)，Laravel 会在认证期间自动重新生成 Session ID；但是，如果你需要手动重新生成 Session ID，可以使用 `regenerate` 方法：

    $request->session()->regenerate();

如果需要在单条语句中重新生成 Session ID 并删除 Session 中的所有数据，可以使用 `invalidate` 方法：

    $request->session()->invalidate();

<a name="session-blocking"></a>
## Session 阻塞

> **Warning**  
> 要使用 Session 阻塞，你的应用必须使用支持[原子锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，这些缓存驱动包括 `memcached`、`dynamodb`、`redis` 和 `database` 驱动。此外，不能使用 `cookie` Session 驱动。

默认情况下，Laravel 允许使用相同 Session 的请求并发执行。例如，如果你使用 JavaScript HTTP 库向应用发起两个 HTTP 请求，它们将同时执行。对于许多应用来说，这不是问题；然而，在一小部分对两个不同的应用端点发起并发请求且都向 Session 写入数据的应用中，可能会发生 Session 数据丢失。

为了缓解此问题，Laravel 提供了允许你限制给定 Session 的并发请求的功能。要开始使用，只需将 `block` 方法链式调用到路由定义上。在此示例中，对 `/profile` 端点的传入请求将获取一个 Session 锁。在此锁被持有时，对共享相同 Session ID 的 `/profile` 或 `/order` 端点的任何传入请求都将等待第一个请求完成执行后再继续其执行：

    Route::post('/profile', function () {
        //
    })->block($lockSeconds = 10, $waitSeconds = 10)

    Route::post('/order', function () {
        //
    })->block($lockSeconds = 10, $waitSeconds = 10)

`block` 方法接受两个可选参数。`block` 方法接受的第一个参数是 Session 锁在释放前应持有的最大秒数。当然，如果请求在此时间之前完成执行，锁将提前释放。

`block` 方法接受的第二个参数是请求在尝试获取 Session 锁时应等待的秒数。如果请求在给定秒数内无法获取 Session 锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果未传递这些参数，锁将最多获取 10 秒，请求在尝试获取锁时最多等待 10 秒：

    Route::post('/profile', function () {
        //
    })->block()

<a name="adding-custom-session-drivers"></a>
## 添加自定义 Session 驱动

<a name="implementing-the-driver"></a>
#### 实现驱动

如果现有的 Session 驱动都不适合你的应用需求，Laravel 允许你编写自己的 Session 处理器。你的自定义 Session 驱动应实现 PHP 内置的 `SessionHandlerInterface`。此接口仅包含几个简单的方法。一个 MongoDB 实现的存根如下所示：

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

> **Note**  
> Laravel 不包含用于存放扩展的目录。你可以随意将它们放在任何你喜欢的位置。在此示例中，我们创建了一个 `Extensions` 目录来存放 `MongoSessionHandler`。

由于这些方法的目的不太容易理解，让我们快速介绍每个方法的作用：

- `open` 方法通常用于基于文件的 Session 存储系统。由于 Laravel 内置了 `file` Session 驱动，你很少需要在此方法中放置任何内容。你可以直接将此方法留空。
- `close` 方法与 `open` 方法类似，通常也可以忽略。对于大多数驱动，不需要它。
- `read` 方法应返回与给定 `$sessionId` 关联的 Session 数据的字符串版本。在你的驱动中检索或存储 Session 数据时，无需进行任何序列化或其他编码，因为 Laravel 会为你执行序列化。
- `write` 方法应将与 `$sessionId` 关联的给定 `$data` 字符串写入某个持久化存储系统，例如 MongoDB 或你选择的其他存储系统。同样，你不应执行任何序列化 —— Laravel 已经为你处理了。
- `destroy` 方法应从持久化存储中移除与 `$sessionId` 关联的数据。
- `gc` 方法应销毁所有比给定 `$lifetime`（一个 UNIX 时间戳）更旧的 Session 数据。对于 Memcached 和 Redis 等自过期系统，此方法可以留空。

<a name="registering-the-driver"></a>
#### 注册驱动

一旦实现了驱动，你就可以将其注册到 Laravel。要将额外驱动添加到 Laravel 的 Session 后端，可以使用 `Session` [Facade](/docs/{{version}}/facades) 提供的 `extend` 方法。你应该从[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法。你可以从现有的 `App\Providers\AppServiceProvider` 中执行此操作，或者创建一个全新的提供者：

    <?php

    namespace App\Providers;

    use App\Extensions\MongoSessionHandler;
    use Illuminate\Support\Facades\Session;
    use Illuminate\Support\ServiceProvider;

    class SessionServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         *
         * @return void
         */
        public function register()
        {
            //
        }

        /**
         * 引导任何应用服务。
         *
         * @return void
         */
        public function boot()
        {
            Session::extend('mongo', function ($app) {
                // 返回 SessionHandlerInterface 的实现...
                return new MongoSessionHandler;
            });
        }
    }

一旦注册了 Session 驱动，就可以在 `config/session.php` 配置文件中使用 `mongo` 驱动了。
