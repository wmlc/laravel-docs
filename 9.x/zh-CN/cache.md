# 缓存

- [简介](#introduction)
- [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
- [缓存用法](#cache-usage)
    - [获取缓存实例](#obtaining-a-cache-instance)
    - [从缓存中检索数据](#retrieving-items-from-the-cache)
    - [在缓存中存储数据](#storing-items-in-the-cache)
    - [从缓存中移除数据](#removing-items-from-the-cache)
    - [缓存助手函数](#the-cache-helper)
- [缓存标签](#cache-tags)
    - [存储带标签的缓存数据](#storing-tagged-cache-items)
    - [访问带标签的缓存数据](#accessing-tagged-cache-items)
    - [移除带标签的缓存数据](#removing-tagged-cache-items)
- [原子锁](#atomic-locks)
    - [驱动前提条件](#lock-driver-prerequisites)
    - [管理锁](#managing-locks)
    - [跨进程管理锁](#managing-locks-across-processes)
- [添加自定义缓存驱动](#adding-custom-cache-drivers)
    - [编写驱动](#writing-the-driver)
    - [注册驱动](#registering-the-driver)
- [事件](#events)

<a name="introduction"></a>
## 简介

应用执行的某些数据检索或处理任务可能是 CPU 密集型的，或者需要几秒钟才能完成。在这种情况下，通常会将被检索的数据缓存一段时间，以便在后续请求相同数据时快速检索。缓存数据通常存储在非常快速的数据存储中，例如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io)。

值得庆幸的是，Laravel 为各种缓存后端提供了富有表现力的统一 API，让你能够利用其极速的数据检索能力来加速 Web 应用。

<a name="configuration"></a>
## 配置

应用的缓存配置文件位于 `config/cache.php`。在此文件中，你可以指定应用默认使用的缓存驱动。Laravel 开箱即用地支持流行的缓存后端，如 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb) 和关系型数据库。此外，还提供了基于文件的缓存驱动，而 `array` 和 "null" 缓存驱动为自动化测试提供了便捷的缓存后端。

缓存配置文件还包含各种其他选项，这些选项都在文件内有文档说明，请务必阅读这些选项。默认情况下，Laravel 配置为使用 `file` 缓存驱动，它将序列化的缓存对象存储在服务器的文件系统上。对于大型应用，建议使用更强大的驱动，如 Memcached 或 Redis。你甚至可以为同一驱动配置多个缓存配置。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="prerequisites-database"></a>
#### Database

使用 `database` 缓存驱动时，你需要设置一个表来存放缓存数据。下面是该表的 `Schema` 声明示例：

```php
Schema::create('cache', function ($table) {
    $table->string('key')->unique();
    $table->text('value');
    $table->integer('expiration');
});
```

> **Note**
> 你也可以使用 `php artisan cache:table` Artisan 命令生成具有正确表结构的数据库迁移。

<a name="memcached"></a>
#### Memcached

使用 Memcached 驱动需要安装 [Memcached PECL 包](https://pecl.php.net/package/memcached)。你可以在 `config/cache.php` 配置文件中列出所有 Memcached 服务器。此文件已经包含一个 `memcached.servers` 条目来帮助你入门：

```php
'memcached' => [
    'servers' => [
        [
            'host' => env('MEMCACHED_HOST', '127.0.0.1'),
            'port' => env('MEMCACHED_PORT', 11211),
            'weight' => 100,
        ],
    ],
],
```

如果需要，你可以将 `host` 选项设置为 UNIX socket 路径。如果这样做，`port` 选项应设置为 `0`：

```php
'memcached' => [
    [
        'host' => '/var/run/memcached/memcached.sock',
        'port' => 0,
        'weight' => 100
    ],
],
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis 缓存之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包（~1.0）。[Laravel Sail](/docs/{{version}}/sail) 已经包含此扩展。此外，官方 Laravel 部署平台如 [Laravel Forge](https://forge.laravel.com) 和 [Laravel Vapor](https://vapor.laravel.com) 默认安装了 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅其 [Laravel 文档页面](/docs/{{version}}/redis#configuration)。

<a name="dynamodb"></a>
#### DynamoDB

使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动之前，你必须创建一个 DynamoDB 表来存储所有缓存数据。通常，此表应命名为 `cache`。但你应该根据应用 `cache` 配置文件中 `stores.dynamodb.table` 配置值来命名表。

此表还应有一个字符串分区键，其名称与应用 `cache` 配置文件中 `stores.dynamodb.attributes.key` 配置项的值对应。默认情况下，分区键应命名为 `key`。

<a name="cache-usage"></a>
## 缓存用法

<a name="obtaining-a-cache-instance"></a>
### 获取缓存实例

要获取缓存存储实例，你可以使用 `Cache` Facade，这也是我们在本文档中一直使用的方式。`Cache` Facade 为 Laravel 缓存契约的底层实现提供了便捷、简洁的访问：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 显示应用所有用户的列表。
     *
     * @return Response
     */
    public function index()
    {
        $value = Cache::get('key');

        //
    }
}
```

<a name="accessing-multiple-cache-stores"></a>
#### 访问多个缓存存储

使用 `Cache` Facade，你可以通过 `store` 方法访问各种缓存存储。传递给 `store` 方法的键应对应 `cache` 配置文件中 `stores` 配置数组中列出的某个存储：

```php
$value = Cache::store('file')->get('foo');

Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟
```

<a name="retrieving-items-from-the-cache"></a>
### 从缓存中检索数据

`Cache` Facade 的 `get` 方法用于从缓存中检索数据。如果缓存中不存在该项，将返回 `null`。如果需要，你可以向 `get` 方法传递第二个参数，指定当项不存在时希望返回的默认值：

```php
$value = Cache::get('key');

$value = Cache::get('key', 'default');
```

你甚至可以传递闭包作为默认值。如果指定项不存在于缓存中，将返回闭包的结果。传递闭包允许你延迟从数据库或其他外部服务获取默认值：

```php
$value = Cache::get('key', function () {
    return DB::table(/* ... */)->get();
});
```

<a name="checking-for-item-existence"></a>
#### 检查项是否存在

`has` 方法可用于确定缓存中是否存在某项。如果项存在但其值为 `null`，此方法也会返回 `false`：

```php
if (Cache::has('key')) {
    //
}
```

<a name="incrementing-decrementing-values"></a>
#### 递增 / 递减值

`increment` 和 `decrement` 方法可用于调整缓存中整数项的值。这两个方法都接受一个可选的第二个参数，指示递增或递减项值的数量：

```php
Cache::increment('key');
Cache::increment('key', $amount);
Cache::decrement('key');
Cache::decrement('key', $amount);
```

<a name="retrieve-store"></a>
#### 检索并存储

有时你可能希望从缓存中检索一项，但如果请求的项不存在，同时存储一个默认值。例如，你可能希望从缓存中检索所有用户，如果不存在则从数据库检索并添加到缓存。你可以使用 `Cache::remember` 方法来实现：

```php
$value = Cache::remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

如果缓存中不存在该项，传递给 `remember` 方法的闭包将被执行，其结果将放入缓存。

你可以使用 `rememberForever` 方法从缓存中检索一项，或如果不存在则永久存储：

```php
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});
```

<a name="retrieve-delete"></a>
#### 检索并删除

如果你需要从缓存中检索一项然后删除该项，可以使用 `pull` 方法。与 `get` 方法类似，如果缓存中不存在该项，将返回 `null`：

```php
$value = Cache::pull('key');
```

<a name="storing-items-in-the-cache"></a>
### 在缓存中存储数据

你可以使用 `Cache` Facade 的 `put` 方法在缓存中存储数据：

```php
Cache::put('key', 'value', $seconds = 10);
```

如果不向 `put` 方法传递存储时间，该项将无限期存储：

```php
Cache::put('key', 'value');
```

除了传递整数秒数外，你还可以传递表示缓存项期望过期时间的 `DateTime` 实例：

```php
Cache::put('key', 'value', now()->addMinutes(10));
```

<a name="store-if-not-present"></a>
#### 不存在时存储

`add` 方法仅在缓存存储中不存在该项时才将其添加到缓存。如果项确实被添加到缓存，方法将返回 `true`。否则，方法将返回 `false`。`add` 方法是一个原子操作：

```php
Cache::add('key', 'value', $seconds);
```

<a name="storing-items-forever"></a>
#### 永久存储数据

`forever` 方法可用于将项永久存储在缓存中。由于这些项不会过期，必须使用 `forget` 方法手动从缓存中移除：

```php
Cache::forever('key', 'value');
```

> **Note**
> 如果你使用 Memcached 驱动，"永久"存储的项可能会在缓存达到大小限制时被移除。

<a name="removing-items-from-the-cache"></a>
### 从缓存中移除数据

你可以使用 `forget` 方法从缓存中移除项：

```php
Cache::forget('key');
```

你也可以通过提供零或负数的过期秒数来移除项：

```php
Cache::put('key', 'value', 0);

Cache::put('key', 'value', -5);
```

你可以使用 `flush` 方法清空整个缓存：

```php
Cache::flush();
```

> **Warning**
> 清空缓存不会考虑你配置的缓存"前缀"，会移除缓存中的所有条目。在清空被其他应用共享的缓存时请谨慎考虑。

<a name="the-cache-helper"></a>
### 缓存助手函数

除了使用 `Cache` Facade 外，你还可以使用全局 `cache` 函数通过缓存检索和存储数据。当 `cache` 函数以单个字符串参数调用时，它将返回给定键的值：

```php
$value = cache('key');
```

如果你向函数提供键 / 值对数组和过期时间，它将在指定时长内将值存储到缓存中：

```php
cache(['key' => 'value'], $seconds);

cache(['key' => 'value'], now()->addMinutes(10));
```

当 `cache` 函数不带任何参数调用时，它返回 `Illuminate\Contracts\Cache\Factory` 实现的实例，允许你调用其他缓存方法：

```php
cache()->remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

> **Note**
> 测试全局 `cache` 函数的调用时，你可以使用 `Cache::shouldReceive` 方法，就像[测试 Facade](/docs/{{version}}/mocking#mocking-facades) 一样。

<a name="cache-tags"></a>
## 缓存标签

> **Warning**
> 使用 `file`、`dynamodb` 或 `database` 缓存驱动时不支持缓存标签。此外，当使用多个标签存储"永久"缓存时，使用 `memcached` 等会自动清除过期记录的驱动性能最佳。

<a name="storing-tagged-cache-items"></a>
### 存储带标签的缓存数据

缓存标签允许你标记缓存中相关的项，然后清除分配了给定标签的所有缓存值。你可以通过传入有序标签名数组来访问带标签的缓存。例如，让我们访问一个带标签的缓存并将一个值 `put` 到缓存中：

```php
Cache::tags(['people', 'artists'])->put('John', $john, $seconds);

Cache::tags(['people', 'authors'])->put('Anne', $anne, $seconds);
```

<a name="accessing-tagged-cache-items"></a>
### 访问带标签的缓存数据

通过标签存储的项如果不提供用于存储该值的标签则无法访问。要检索带标签的缓存项，将相同的有序标签列表传递给 `tags` 方法，然后使用你要检索的键调用 `get` 方法：

```php
$john = Cache::tags(['people', 'artists'])->get('John');

$anne = Cache::tags(['people', 'authors'])->get('Anne');
```

<a name="removing-tagged-cache-items"></a>
### 移除带标签的缓存数据

你可以清除分配了某个标签或标签列表的所有项。例如，此语句将移除所有标记为 `people`、`authors` 或两者兼有的缓存。因此，`Anne` 和 `John` 都会从缓存中移除：

```php
Cache::tags(['people', 'authors'])->flush();
```

相比之下，此语句将仅移除标记为 `authors` 的缓存值，因此 `Anne` 会被移除，但 `John` 不会：

```php
Cache::tags('authors')->flush();
```

<a name="atomic-locks"></a>
## 原子锁

> **Warning**
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="lock-driver-prerequisites"></a>
### 驱动前提条件

<a name="atomic-locks-prerequisites-database"></a>
#### Database

使用 `database` 缓存驱动时，你需要设置一个表来存放应用的缓存锁。下面是该表的 `Schema` 声明示例：

```php
Schema::create('cache_locks', function ($table) {
    $table->string('key')->primary();
    $table->string('owner');
    $table->integer('expiration');
});
```

<a name="managing-locks"></a>
### 管理锁

原子锁允许操作分布式锁而无需担心竞态条件。例如，[Laravel Forge](https://forge.laravel.com) 使用原子锁确保一台服务器上同时只执行一个远程任务。你可以使用 `Cache::lock` 方法创建和管理锁：

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // 获取了 10 秒的锁...

    $lock->release();
}
```

`get` 方法也接受一个闭包。闭包执行后，Laravel 会自动释放锁：

```php
Cache::lock('foo', 10)->get(function () {
    // 获取了 10 秒的锁并自动释放...
});
```

如果在你请求时锁不可用，你可以指示 Laravel 等待指定的秒数。如果在指定时间限制内无法获取锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException` 异常：

```php
use Illuminate\Contracts\Cache\LockTimeoutException;

$lock = Cache::lock('foo', 10);

try {
    $lock->block(5);

    // 等待最多 5 秒后获取了锁...
} catch (LockTimeoutException $e) {
    // 无法获取锁...
} finally {
    optional($lock)->release();
}
```

上面的示例可以通过向 `block` 方法传递闭包来简化。当向此方法传递闭包时，Laravel 会尝试在指定秒数内获取锁，并在闭包执行后自动释放锁：

```php
Cache::lock('foo', 10)->block(5, function () {
    // 等待最多 5 秒后获取了锁...
});
```

<a name="managing-locks-across-processes"></a>
### 跨进程管理锁

有时，你可能希望在一个进程中获取锁并在另一个进程中释放。例如，你可能在 Web 请求期间获取锁，并希望在该请求触发的排队作业结束时释放锁。在这种情况下，你应该将锁的作用域"所有者令牌"传递给排队作业，以便作业可以使用给定令牌重新实例化锁。

在下面的示例中，如果成功获取锁，我们将分发一个排队作业。此外，我们通过锁的 `owner` 方法将锁的所有者令牌传递给排队作业：

```php
$podcast = Podcast::find($id);

$lock = Cache::lock('processing', 120);

if ($lock->get()) {
    ProcessPodcast::dispatch($podcast, $lock->owner());
}
```

在应用的 `ProcessPodcast` 作业中，我们可以使用所有者令牌恢复并释放锁：

```php
Cache::restoreLock('processing', $this->owner)->release();
```

如果你想在不考虑当前所有者的情况下释放锁，可以使用 `forceRelease` 方法：

```php
Cache::lock('processing')->forceRelease();
```

<a name="adding-custom-cache-drivers"></a>
## 添加自定义缓存驱动

<a name="writing-the-driver"></a>
### 编写驱动

要创建自定义缓存驱动，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [契约](/docs/{{version}}/contracts)。因此，MongoDB 缓存实现可能看起来像这样：

```php
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
```

我们只需要使用 MongoDB 连接实现这些方法。有关如何实现每个方法的示例，请查看 [Laravel 框架源代码](https://github.com/laravel/framework) 中的 `Illuminate\Cache\MemcachedStore`。实现完成后，我们可以通过调用 `Cache` Facade 的 `extend` 方法来完成自定义驱动注册：

```php
Cache::extend('mongo', function ($app) {
    return Cache::repository(new MongoStore);
});
```

> **Note**
> 如果你想知道自定义缓存驱动代码放在哪里，可以在 `app` 目录中创建一个 `Extensions` 命名空间。但请记住，Laravel 没有严格的应用结构，你可以根据自己的偏好组织应用。

<a name="registering-the-driver"></a>
### 注册驱动

要向 Laravel 注册自定义缓存驱动，我们将使用 `Cache` Facade 的 `extend` 方法。由于其他服务提供者可能在其 `boot` 方法中尝试读取缓存值，我们将在 `booting` 回调中注册自定义驱动。通过使用 `booting` 回调，我们可以确保自定义驱动在应用服务提供者的 `boot` 方法调用之前注册，但在所有服务提供者的 `register` 方法调用之后。我们将在应用 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册 `booting` 回调：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoStore;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class CacheServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     *
     * @return void
     */
    public function register()
    {
        $this->app->booting(function () {
             Cache::extend('mongo', function ($app) {
                 return Cache::repository(new MongoStore);
             });
         });
    }

    /**
     * 引导任何应用服务。
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
```

传递给 `extend` 方法的第一个参数是驱动名称。这将对应 `config/cache.php` 配置文件中的 `driver` 选项。第二个参数是一个应返回 `Illuminate\Cache\Repository` 实例的闭包。该闭包将接收一个 `$app` 实例，即[服务容器](/docs/{{version}}/container)的实例。

注册扩展后，将 `config/cache.php` 配置文件中的 `driver` 选项更新为你的扩展名称。

<a name="events"></a>
## 事件

要在每次缓存操作时执行代码，你可以监听缓存触发的[事件](/docs/{{version}}/events)。通常，你应该将这些事件监听器放在应用的 `App\Providers\EventServiceProvider` 类中：

```php
use App\Listeners\LogCacheHit;
use App\Listeners\LogCacheMissed;
use App\Listeners\LogKeyForgotten;
use App\Listeners\LogKeyWritten;
use Illuminate\Cache\Events\CacheHit;
use Illuminate\Cache\Events\CacheMissed;
use Illuminate\Cache\Events\KeyForgotten;
use Illuminate\Cache\Events\KeyWritten;

/**
 * 应用的事件监听器映射。
 *
 * @var array
 */
protected $listen = [
    CacheHit::class => [
        LogCacheHit::class,
    ],

    CacheMissed::class => [
        LogCacheMissed::class,
    ],

    KeyForgotten::class => [
        LogKeyForgotten::class,
    ],

    KeyWritten::class => [
        LogKeyWritten::class,
    ],
];
```