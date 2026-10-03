# 缓存

- [简介](#introduction)
- [配置](#configuration)
    - [驱动前置条件](#driver-prerequisites)
- [缓存的使用](#cache-usage)
    - [获取缓存实例](#obtaining-a-cache-instance)
    - [从缓存中检索条目](#retrieving-items-from-the-cache)
    - [把条目存入缓存](#storing-items-in-the-cache)
    - [从缓存中移除条目](#removing-items-from-the-cache)
    - [缓存辅助函数](#the-cache-helper)
- [原子锁](#atomic-locks)
    - [管理锁](#managing-locks)
    - [跨进程管理锁](#managing-locks-across-processes)
- [添加自定义缓存驱动](#adding-custom-cache-drivers)
    - [编写驱动](#writing-the-driver)
    - [注册驱动](#registering-the-driver)
- [事件](#events)

<a name="introduction"></a>
## 简介

你的应用所执行的一些数据检索或处理任务可能非常消耗 CPU，或者需要数秒才能完成。这种情况下，通常的做法是把检索到的数据缓存一段时间，以便后续针对相同数据的请求能够快速取回。缓存数据通常存放在速度极快的数据存储中，例如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io)。

幸运的是，Laravel 为各种缓存后端提供了一套表达清晰、统一的 API，让你能够享受它们极速的数据读取能力，从而加速你的 Web 应用。

<a name="configuration"></a>
## 配置

应用的缓存配置文件位于 `config/cache.php`。在这个文件中，你可以指定整个应用默认使用哪个缓存存储。Laravel 开箱即用地支持 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb) 以及关系型数据库等常用缓存后端。此外，还提供了基于文件的缓存驱动，而 `array` 和 "null" 缓存驱动则为你的自动化测试提供了便捷的缓存后端。

缓存配置文件还包含一系列其他可供查看的配置项。默认情况下，Laravel 被配置为使用 `database` 缓存驱动，它会把序列化后的缓存对象存储在应用的数据库中。

<a name="driver-prerequisites"></a>
### 驱动前置条件

<a name="prerequisites-database"></a>
#### 数据库

使用 `database` 缓存驱动时，你需要一个数据库表来存放缓存数据。通常，Laravel 默认的 `0001_01_01_000001_create_cache_table.php` [数据库迁移](/docs/{{version}}/migrations)中已经包含了这个表；不过，如果你的应用中不存在该迁移，可以使用 `make:cache-table` Artisan 命令来创建：

```shell
php artisan make:cache-table

php artisan migrate
```

<a name="memcached"></a>
#### Memcached

使用 Memcached 驱动需要安装 [Memcached PECL 包](https://pecl.php.net/package/memcached)。你可以在 `config/cache.php` 配置文件中列出所有 Memcached 服务器。该文件已经包含了一个 `memcached.servers` 配置项，你可以直接上手使用：

    'memcached' => [
        // ...

        'servers' => [
            [
                'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                'port' => env('MEMCACHED_PORT', 11211),
                'weight' => 100,
            ],
        ],
    ],

如有需要，你可以把 `host` 选项设为 UNIX 套接字路径。此时应把 `port` 选项设为 `0`：

    'memcached' => [
        // ...

        'servers' => [
            [
                'host' => '/var/run/memcached/memcached.sock',
                'port' => 0,
                'weight' => 100
            ],
        ],
    ],

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis 缓存之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包（约 2.0 版本）。[Laravel Sail](/docs/{{version}}/sail) 已经包含该扩展。此外，[Laravel Forge](https://forge.laravel.com) 和 [Laravel Vapor](https://vapor.laravel.com) 等 Laravel 官方部署平台默认已安装 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅它的 [Laravel 文档页面](/docs/{{version}}/redis#configuration)。

<a name="dynamodb"></a>
#### DynamoDB

使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动之前，你必须创建一个 DynamoDB 表来存放所有缓存数据。该表通常应当命名为 `cache`。不过，你应当根据 `cache` 配置文件中 `stores.dynamodb.table` 配置项的值来命名该表。表名也可以通过 `DYNAMODB_CACHE_TABLE` 环境变量设置。

该表还应当具备一个字符串分区键，其名称需与你的应用 `cache` 配置文件中 `stores.dynamodb.attributes.key` 配置项的值相对应。默认情况下，分区键应当命名为 `key`。

通常情况下，DynamoDB 不会主动从表中移除过期条目。因此，你应当为该表[启用生存时间（TTL）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)。配置该表的 TTL 设置时，应把 TTL 属性名设为 `expires_at`。

接下来，安装 AWS SDK，以便你的 Laravel 应用能够与 DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

此外，你应当确保为 DynamoDB 缓存存储的配置项提供了值。这些配置项（如 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`）通常应当在应用的 `.env` 配置文件中定义：

```php
'dynamodb' => [
    'driver' => 'dynamodb',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
    'endpoint' => env('DYNAMODB_ENDPOINT'),
],
```

<a name="mongodb"></a>
#### MongoDB

如果你使用 MongoDB，官方 `mongodb/laravel-mongodb` 包提供了一个 `mongodb` 缓存驱动，可以通过 `mongodb` 数据库连接进行配置。MongoDB 支持 TTL 索引，可用于自动清除过期的缓存条目。

有关配置 MongoDB 的更多信息，请参阅 MongoDB 的[缓存与锁文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)。

<a name="cache-usage"></a>
## 缓存的使用

<a name="obtaining-a-cache-instance"></a>
### 获取缓存实例

要获取一个缓存存储实例，可以使用 `Cache` Facade，本文档全程都使用它。`Cache` Facade 提供了对 Laravel 缓存契约底层实现的便捷、简洁访问：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Support\Facades\Cache;

    class UserController extends Controller
    {
        /**
         * 显示应用所有用户的列表。
         */
        public function index(): array
        {
            $value = Cache::get('key');

            return [
                // ...
            ];
        }
    }

<a name="accessing-multiple-cache-stores"></a>
#### 访问多个缓存存储

借助 `Cache` Facade，你可以通过 `store` 方法访问各种缓存存储。传给 `store` 方法的键应当对应 `cache` 配置文件中 `stores` 配置数组里列出的某个存储：

    $value = Cache::store('file')->get('foo');

    Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟

<a name="retrieving-items-from-the-cache"></a>
### 从缓存中检索条目

`Cache` Facade 的 `get` 方法用于从缓存中检索条目。如果条目在缓存中不存在，将返回 `null`。如果愿意，你还可以给 `get` 方法传入第二个参数，指定条目不存在时希望返回的默认值：

    $value = Cache::get('key');

    $value = Cache::get('key', 'default');

你甚至可以把闭包作为默认值传入。如果指定条目在缓存中不存在，就会返回该闭包的结果。传入闭包让你可以把默认值的检索推迟到真正需要时，再去访问数据库或其他外部服务：

    $value = Cache::get('key', function () {
        return DB::table(/* ... */)->get();
    });

<a name="determining-item-existence"></a>
#### 判断条目是否存在

`has` 方法可用于判断某个条目是否存在于缓存中。如果条目存在但其值为 `null`，该方法同样会返回 `false`：

    if (Cache::has('key')) {
        // ...
    }

<a name="incrementing-decrementing-values"></a>
#### 递增 / 递减值

`increment` 和 `decrement` 方法可用于调整缓存中整数条目的值。这两个方法都接受一个可选的第二个参数，用于指定递增或递减的幅度：

    // 如果值不存在则初始化...
    Cache::add('key', 0, now()->addHours(4));

    // 递增或递减该值...
    Cache::increment('key');
    Cache::increment('key', $amount);
    Cache::decrement('key');
    Cache::decrement('key', $amount);

<a name="retrieve-store"></a>
#### 检索并存储

有时你希望从缓存中检索某个条目，但如果该条目不存在，则同时存入一个默认值。例如，你可能希望从缓存中获取所有用户；如果缓存中不存在他们，就从数据库中取出并加入缓存。你可以使用 `Cache::remember` 方法来实现：

    $value = Cache::remember('users', $seconds, function () {
        return DB::table('users')->get();
    });

如果条目在缓存中不存在，传给 `remember` 方法的闭包会被执行，其结果将被放入缓存中。

你可以使用 `rememberForever` 方法从缓存中检索条目，若条目不存在则永久存储：

    $value = Cache::rememberForever('users', function () {
        return DB::table('users')->get();
    });

<a name="swr"></a>
#### 过期后重新验证（Stale While Revalidate）

使用 `Cache::remember` 方法时，如果缓存值已过期，部分用户可能会遇到响应缓慢的问题。对于某些类型的数据，可以允许先返回部分过期的数据，同时在后台重新计算缓存值，从而避免部分用户在缓存值计算期间遭遇响应缓慢。这通常被称为"过期后重新验证（stale-while-revalidate）"模式，而 `Cache::flexible` 方法提供了该模式的实现。

flexible 方法接受一个数组，用于指定缓存值被视为"新鲜"的时间长度，以及它何时开始变为"过期"。数组中的第一个值表示缓存被视为新鲜的秒数，第二个值则定义在必须重新计算之前，它还能作为过期数据提供多久。

如果请求发生在新鲜期内（即在第一个值之前），缓存会立即返回而不重新计算。如果请求发生在过期期内（即介于两个值之间），系统会把过期的值提供给用户，并注册一个[延迟函数](/docs/{{version}}/helpers#deferred-functions)，在响应发送给用户之后刷新缓存值。如果请求发生在第二个值之后，缓存被视为已过期，值会立即重新计算，这可能导致用户响应变慢：

    $value = Cache::flexible('users', [5, 10], function () {
        return DB::table('users')->get();
    });

<a name="retrieve-delete"></a>
#### 检索并删除

如果你需要从缓存中检索某个条目并随后将其删除，可以使用 `pull` 方法。与 `get` 方法一样，如果条目在缓存中不存在，将返回 `null`：

    $value = Cache::pull('key');

    $value = Cache::pull('key', 'default');

<a name="storing-items-in-the-cache"></a>
### 把条目存入缓存

你可以在 `Cache` Facade 上使用 `put` 方法把条目存入缓存：

    Cache::put('key', 'value', $seconds = 10);

如果没有向 `put` 方法传入存储时间，该条目将被无限期存储：

    Cache::put('key', 'value');

除了把秒数作为整数传入之外，你还可以传入一个表示缓存条目期望过期时间的 `DateTime` 实例：

    Cache::put('key', 'value', now()->addMinutes(10));

<a name="store-if-not-present"></a>
#### 不存在时才存储

`add` 方法仅在条目尚未存在于缓存存储中时才会把它加入缓存。如果条目确实被加入缓存，该方法返回 `true`；否则返回 `false`。`add` 方法是一个原子操作：

    Cache::add('key', 'value', $seconds);

<a name="storing-items-forever"></a>
#### 永久存储条目

`forever` 方法可用于把条目永久存入缓存。由于这些条目不会过期，必须使用 `forget` 方法手动从缓存中移除：

    Cache::forever('key', 'value');

> [!NOTE]
> 如果你使用 Memcached 驱动，被"永久"存储的条目可能会在缓存达到容量上限时被移除。

<a name="removing-items-from-the-cache"></a>
### 从缓存中移除条目

你可以使用 `forget` 方法从缓存中移除条目：

    Cache::forget('key');

你也可以通过传入零或负数的过期秒数来移除条目：

    Cache::put('key', 'value', 0);

    Cache::put('key', 'value', -5);

你可以使用 `flush` 方法清空整个缓存：

    Cache::flush();

> [!WARNING]
> 清空缓存不会遵循你配置的缓存"前缀"，并会移除缓存中的所有条目。在清理由其他应用共享的缓存时，请务必谨慎考虑。

<a name="the-cache-helper"></a>
### 缓存辅助函数

除了使用 `Cache` Facade 之外，你还可以使用全局 `cache` 函数通过缓存检索和存储数据。当以单个字符串参数调用 `cache` 函数时，它会返回给定键对应的值：

    $value = cache('key');

如果向该函数提供一个键 / 值对数组以及过期时间，它会按指定时长把值存入缓存：

    cache(['key' => 'value'], $seconds);

    cache(['key' => 'value'], now()->addMinutes(10));

不带任何参数调用 `cache` 函数时，它会返回 `Illuminate\Contracts\Cache\Factory` 实现的实例，从而允许你调用其他缓存方法：

    cache()->remember('users', $seconds, function () {
        return DB::table('users')->get();
    });

> [!NOTE]
> 测试对全局 `cache` 函数的调用时，你可以像[测试 Facade](/docs/{{version}}/mocking#mocking-facades)一样使用 `Cache::shouldReceive` 方法。

<a name="atomic-locks"></a>
## 原子锁

> [!WARNING]
> 要使用该功能，你的应用必须把 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

<a name="managing-locks"></a>
### 管理锁

原子锁让你可以操作分布式锁而无需担心竞态条件。例如，[Laravel Forge](https://forge.laravel.com) 使用原子锁来确保服务器上同一时刻只执行一个远程任务。你可以使用 `Cache::lock` 方法创建并管理锁：

    use Illuminate\Support\Facades\Cache;

    $lock = Cache::lock('foo', 10);

    if ($lock->get()) {
        // 锁已获取，持续 10 秒...

        $lock->release();
    }

`get` 方法也接受闭包。闭包执行完毕后，Laravel 会自动释放该锁：

    Cache::lock('foo', 10)->get(function () {
        // 锁已获取，持续 10 秒，并自动释放...
    });

如果你请求锁时锁不可用，你可以指示 Laravel 等待指定的秒数。如果在指定的时间限制内仍无法获取锁，就会抛出 `Illuminate\Contracts\Cache\LockTimeoutException`：

    use Illuminate\Contracts\Cache\LockTimeoutException;

    $lock = Cache::lock('foo', 10);

    try {
        $lock->block(5);

        // 最多等待 5 秒后获取到锁...
    } catch (LockTimeoutException $e) {
        // 无法获取锁...
    } finally {
        $lock->release();
    }

上面的示例可以通过向 `block` 方法传入闭包来简化。当向该方法传入闭包时，Laravel 会尝试在指定的秒数内获取锁，并在闭包执行完毕后自动释放该锁：

    Cache::lock('foo', 10)->block(5, function () {
        // 最多等待 5 秒后获取到锁...
    });

<a name="managing-locks-across-processes"></a>
### 跨进程管理锁

有时你可能希望在一个进程中获取锁，并在另一个进程中释放它。例如，你可能在 Web 请求中获取锁，并希望在该请求触发的队列任务结束时释放它。在这种情况下，你应当把锁带作用域的"所有者令牌"传给队列任务，以便该任务能使用给定令牌重新实例化锁。

在下面的示例中，如果成功获取到锁，我们就会分发一个队列任务。此外，我们还会通过锁的 `owner` 方法把锁的所有者令牌传给该队列任务：

    $podcast = Podcast::find($id);

    $lock = Cache::lock('processing', 120);

    if ($lock->get()) {
        ProcessPodcast::dispatch($podcast, $lock->owner());
    }

在应用的 `ProcessPodcast` 任务中，我们可以使用所有者令牌恢复并释放该锁：

    Cache::restoreLock('processing', $this->owner)->release();

如果你想无视当前所有者直接释放一个锁，可以使用 `forceRelease` 方法：

    Cache::lock('processing')->forceRelease();

<a name="adding-custom-cache-drivers"></a>
## 添加自定义缓存驱动

<a name="writing-the-driver"></a>
### 编写驱动

要创建自定义缓存驱动，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [契约](/docs/{{version}}/contracts)。因此，一个 MongoDB 缓存实现可能看起来如下：

    <?php

    namespace App\Extensions;

    use Illuminate\Contracts\Cache\Store;

    class MongoStore implements Store
    {
        public function get($key) {}
        public function many(array $keys) {}
        public function put($key, $value, $seconds) {}
        public function putMany(array $values, $seconds) {}
        public function increment($key, $value = 1) {}
        public function decrement($key, $value = 1) {}
        public function forever($key, $value) {}
        public function forget($key) {}
        public function flush() {}
        public function getPrefix() {}
    }

我们只需要使用 MongoDB 连接来实现上述每个方法。想了解如何实现其中每个方法，可以参考 [Laravel 框架源代码](https://github.com/laravel/framework)中的 `Illuminate\Cache\MemcachedStore`。实现完成后，我们就可以调用 `Cache` Facade 的 `extend` 方法来完成自定义驱动的注册：

    Cache::extend('mongo', function (Application $app) {
        return Cache::repository(new MongoStore);
    });

> [!NOTE]
> 如果你不确定该把自定义缓存驱动代码放在哪里，可以在 `app` 目录下创建一个 `Extensions` 命名空间。不过请记住，Laravel 并没有强制固定的应用结构，你可以按自己的偏好组织应用。

<a name="registering-the-driver"></a>
### 注册驱动

要把自定义缓存驱动注册到 Laravel，我们将使用 `Cache` Facade 上的 `extend` 方法。由于其他服务提供者可能会在其 `boot` 方法中读取缓存值，我们会在 `booting` 回调中注册自定义驱动。通过使用 `booting` 回调，可以确保自定义驱动在应用的各个服务提供者的 `boot` 方法被调用之前完成注册，同时又是在所有服务提供者的 `register` 方法被调用之后。我们会在应用 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册该 `booting` 回调：

    <?php

    namespace App\Providers;

    use App\Extensions\MongoStore;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任意应用服务。
         */
        public function register(): void
        {
            $this->app->booting(function () {
                 Cache::extend('mongo', function (Application $app) {
                     return Cache::repository(new MongoStore);
                 });
             });
        }

        /**
         * 引导任意应用服务。
         */
        public function boot(): void
        {
            // ...
        }
    }

传给 `extend` 方法的第一个参数是驱动名称，它对应 `config/cache.php` 配置文件中的 `driver` 选项。第二个参数是一个应当返回 `Illuminate\Cache\Repository` 实例的闭包。该闭包会收到一个 `$app` 实例，它正是[服务容器（Service Container）](/docs/{{version}}/container)的实例。

扩展注册完成后，请把应用的 `config/cache.php` 配置文件中的 `CACHE_STORE` 环境变量或 `default` 选项更新为你的扩展名称。

<a name="events"></a>
## 事件

要在每次缓存操作时执行代码，你可以监听缓存分发的各种[事件](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称 |
| --- |
| `Illuminate\Cache\Events\CacheHit` |
| `Illuminate\Cache\Events\CacheMissed` |
| `Illuminate\Cache\Events\KeyForgotten` |
| `Illuminate\Cache\Events\KeyWritten` |

</div>

为提升性能，你可以在应用 `config/cache.php` 配置文件中把某个缓存存储的 `events` 配置项设为 `false`，以禁用缓存事件：

```php
'database' => [
    'driver' => 'database',
    // ...
    'events' => false,
],
```
