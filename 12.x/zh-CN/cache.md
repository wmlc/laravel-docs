# 缓存

- [简介](#introduction)
- [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
- [缓存使用](#cache-usage)
    - [获取缓存实例](#obtaining-a-cache-instance)
    - [从缓存中检索数据](#retrieving-items-from-the-cache)
    - [将数据存入缓存](#storing-items-in-the-cache)
    - [从缓存中移除数据](#removing-items-from-the-cache)
    - [缓存记忆化](#cache-memoization)
    - [缓存辅助函数](#the-cache-helper)
- [缓存标签](#cache-tags)
- [原子锁](#atomic-locks)
    - [管理锁](#managing-locks)
    - [跨进程管理锁](#managing-locks-across-processes)
    - [并发限制](#concurrency-limiting)
- [缓存故障转移](#cache-failover)
- [添加自定义缓存驱动](#adding-custom-cache-drivers)
    - [编写驱动](#writing-the-driver)
    - [注册驱动](#registering-the-driver)
- [事件](#events)

<a name="introduction"></a>
## 简介

应用执行的一些数据检索或处理任务可能非常消耗 CPU，或需要几秒钟才能完成。这种情况下，通常会把检索到的数据缓存一段时间，以便在后续请求相同数据时快速获取。缓存的数据通常存储在非常快速的数据存储中，例如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io)。

值得庆幸的是，Laravel 为各种缓存后端提供了一套富有表现力且统一的 API，让你能够利用它们极速的数据检索能力，从而加速你的 Web 应用。

<a name="configuration"></a>
## 配置

应用的缓存配置文件位于 `config/cache.php`。你可以在该文件中指定整个应用默认使用哪个缓存存储。Laravel 开箱即支持 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb) 和关系型数据库等流行的缓存后端。此外，还提供了基于文件的缓存驱动，而 `array` 和 `null` 缓存驱动则为自动化测试提供了便捷的缓存后端。

缓存配置文件还包含许多其他可供查看的选项。默认情况下，Laravel 配置为使用 `database` 缓存驱动，它会将序列化后的缓存对象存储在应用的数据库中。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="prerequisites-database"></a>
#### 数据库

使用 `database` 缓存驱动时，你需要一个数据库表来存放缓存数据。通常，这已包含在 Laravel 默认的 `0001_01_01_000001_create_cache_table.php` [数据库迁移](/docs/{{version}}/migrations)中；不过，如果你的应用不包含这个迁移，可以使用 `make:cache-table` Artisan 命令来创建它：

```shell
php artisan make:cache-table

php artisan migrate
```

<a name="memcached"></a>
#### Memcached

使用 Memcached 驱动需要安装 [Memcached PECL 扩展包](https://pecl.php.net/package/memcached)。你可以在 `config/cache.php` 配置文件中列出所有的 Memcached 服务器。该文件已经包含一个 `memcached.servers` 条目供你入门：

```php
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
```

如有需要，你可以将 `host` 选项设置为 UNIX socket 路径。这样做时，`port` 选项应设置为 `0`：

```php
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
```

<a name="redis"></a>
#### Redis

在 Laravel 中使用 Redis 缓存之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 扩展包（~2.0）。[Laravel Sail](/docs/{{version}}/sail) 已经包含了这个扩展。此外，官方 Laravel 应用托管平台（如 [Laravel Cloud](https://cloud.laravel.com) 和 [Laravel Forge](https://forge.laravel.com)）默认安装了 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅其 [Laravel 文档页面](/docs/{{version}}/redis#configuration)。

<a name="dynamodb"></a>
#### DynamoDB

在使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动之前，你必须创建一个 DynamoDB 表来存储所有缓存数据。通常，这个表应命名为 `cache`。不过，你应该根据 `cache` 配置文件中 `stores.dynamodb.table` 配置项的值来命名该表。表名也可以通过 `DYNAMODB_CACHE_TABLE` 环境变量来设置。

该表还应具有一个字符串分区键，其名称与应用 `cache` 配置文件中 `stores.dynamodb.attributes.key` 配置项的值相对应。默认情况下，分区键应命名为 `key`。

通常，DynamoDB 不会主动从表中移除过期数据。因此，你应该在该表上[启用生存时间（TTL）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)。配置表的 TTL 设置时，应将 TTL 属性名设置为 `expires_at`。

接下来，安装 AWS SDK，以便你的 Laravel 应用能与 DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

此外，你应确保为 DynamoDB 缓存存储的配置选项提供了相应的值。通常，这些选项（如 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`）应在应用的 `.env` 配置文件中定义：

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

如果你在使用 MongoDB，官方的 `mongodb/laravel-mongodb` 扩展包提供了 `mongodb` 缓存驱动，可以通过 `mongodb` 数据库连接来配置。MongoDB 支持 TTL 索引，可用于自动清除过期的缓存数据。

有关配置 MongoDB 的更多信息，请参阅 MongoDB 的[缓存与锁文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)。

<a name="cache-usage"></a>
## 缓存使用

<a name="obtaining-a-cache-instance"></a>
### 获取缓存实例

要获取缓存存储实例，可以使用 `Cache` Facade，本文档将全程使用它。`Cache` Facade 为 Laravel 缓存契约的底层实现提供了便捷、简洁的访问方式：

```php
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
```

<a name="accessing-multiple-cache-stores"></a>
#### 访问多个缓存存储

使用 `Cache` Facade，你可以通过 `store` 方法访问各种缓存存储。传递给 `store` 方法的键名应对应 `cache` 配置文件中 `stores` 配置数组里列出的某个存储：

```php
$value = Cache::store('file')->get('foo');

Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟
```

<a name="retrieving-items-from-the-cache"></a>
### 从缓存中检索数据

`Cache` Facade 的 `get` 方法用于从缓存中检索数据。如果缓存中不存在该项，将返回 `null`。如果需要，你可以向 `get` 方法传递第二个参数，指定该项不存在时希望返回的默认值：

```php
$value = Cache::get('key');

$value = Cache::get('key', 'default');
```

你甚至可以传递一个闭包作为默认值。如果指定的项在缓存中不存在，将返回闭包的执行结果。传递闭包可以让你把从数据库或其他外部服务获取默认值的操作延迟到必要时才执行：

```php
$value = Cache::get('key', function () {
    return DB::table(/* ... */)->get();
});
```

<a name="determining-item-existence"></a>
#### 判断数据是否存在

`has` 方法可用于判断缓存中是否存在某个项。如果该项存在但其值为 `null`，此方法也会返回 `false`：

```php
if (Cache::has('key')) {
    // ...
}
```

<a name="incrementing-decrementing-values"></a>
#### 递增 / 递减值

`increment` 和 `decrement` 方法可用于调整缓存中整数值项的大小。这两个方法都接受一个可选的第二个参数，用于指明递增或递减该项值的幅度：

```php
// 如果值不存在则初始化...
Cache::add('key', 0, now()->plus(hours: 4));

// 递增或递减值...
Cache::increment('key');
Cache::increment('key', $amount);
Cache::decrement('key');
Cache::decrement('key', $amount);
```

<a name="retrieve-store"></a>
#### 检索并存储

有时你可能希望从缓存中检索一个项，同时在该项不存在时存储一个默认值。例如，你可能希望从缓存中检索所有用户，如果不存在，则从数据库中检索并添加到缓存中。你可以使用 `Cache::remember` 方法来完成：

```php
$value = Cache::remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

如果缓存中不存在该项，传递给 `remember` 方法的闭包将被执行，其结果会被放入缓存。

你可以使用 `rememberForever` 方法从缓存中检索某个项，或在它不存在时将其永久存储：

```php
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});
```

<a name="swr"></a>
#### 过期同时重验证

使用 `Cache::remember` 方法时，如果缓存值已过期，部分用户可能会遇到响应缓慢的情况。对于某些类型的数据，允许在后台重新计算缓存值的同时提供略微过期的数据，可以避免部分用户在缓存值计算期间经历缓慢的响应。这种模式通常称为「stale-while-revalidate」（过期同时重验证），`Cache::flexible` 方法提供了这一模式的实现。

`flexible` 方法接受一个数组，用于指定缓存值被视为「新鲜」的时长以及何时变为「过期」。数组中的第一个值表示缓存保持新鲜的秒数，第二个值定义在必须重新计算之前，该值还能作为过期数据提供多长时间。

如果请求发生在新鲜期内（第一个值之前），缓存会被立即返回，无需重新计算。如果请求发生在过期期内（两个值之间），系统会将过期值提供给用户，并注册一个[延迟函数](/docs/{{version}}/helpers#deferred-functions)，在响应发送给用户后刷新缓存值。如果请求发生在第二个值之后，缓存被视为已过期，值会被立即重新计算，这可能导致用户获得较慢的响应：

```php
$value = Cache::flexible('users', [5, 10], function () {
    return DB::table('users')->get();
});
```

<a name="retrieve-delete"></a>
#### 检索并删除

如果你需要从缓存中检索一个项然后将其删除，可以使用 `pull` 方法。与 `get` 方法一样，如果缓存中不存在该项，将返回 `null`：

```php
$value = Cache::pull('key');

$value = Cache::pull('key', 'default');
```

<a name="storing-items-in-the-cache"></a>
### 将数据存入缓存

你可以使用 `Cache` Facade 的 `put` 方法将数据存入缓存：

```php
Cache::put('key', 'value', $seconds = 10);
```

如果不向 `put` 方法传递存储时间，该项将被无限期存储：

```php
Cache::put('key', 'value');
```

除了传递表示秒数的整数，你还可以传递一个 `DateTime` 实例来表示缓存项的期望过期时间：

```php
Cache::put('key', 'value', now()->plus(minutes: 10));
```

<a name="store-if-not-present"></a>
#### 不存在时才存储

`add` 方法只会在缓存存储中尚不存在该项时才将其添加到缓存。如果该项确实被添加到缓存，方法将返回 `true`；否则，方法将返回 `false`。`add` 方法是一个原子操作：

```php
Cache::add('key', 'value', $seconds);
```

<a name="storing-items-forever"></a>
#### 永久存储数据

`forever` 方法可用于将某个项永久存储在缓存中。由于这些项不会过期，必须使用 `forget` 方法手动将它们从缓存中移除：

```php
Cache::forever('key', 'value');
```

> [!NOTE]
> 如果你使用的是 Memcached 驱动，「永久」存储的项在缓存达到大小限制时可能会被移除。

<a name="removing-items-from-the-cache"></a>
### 从缓存中移除数据

你可以使用 `forget` 方法从缓存中移除数据：

```php
Cache::forget('key');
```

你也可以通过提供零或负数的过期秒数来移除数据：

```php
Cache::put('key', 'value', 0);

Cache::put('key', 'value', -5);
```

你可以使用 `flush` 方法清空整个缓存：

```php
Cache::flush();
```

> [!WARNING]
> 清空缓存不会考虑你配置的缓存「前缀」，而是会移除缓存中的所有条目。在清空被其他应用共享的缓存时，请谨慎考虑。

<a name="cache-memoization"></a>
### 缓存记忆化

Laravel 的 `memo` 缓存驱动允许你在单次请求或作业执行期间，将已解析的缓存值临时存储在内存中。这样可以避免同一次执行中重复访问缓存，从而显著提升性能。

要使用记忆化缓存，请调用 `memo` 方法：

```php
use Illuminate\Support\Facades\Cache;

$value = Cache::memo()->get('key');
```

`memo` 方法可选地接受一个缓存存储的名称，用于指定记忆化驱动要装饰的底层缓存存储：

```php
// 使用默认缓存存储...
$value = Cache::memo()->get('key');

// 使用 Redis 缓存存储...
$value = Cache::memo('redis')->get('key');
```

对给定键的第一次 `get` 调用会从缓存存储中检索值，但同一请求或作业内的后续调用将从内存中检索该值：

```php
// 访问缓存...
$value = Cache::memo()->get('key');

// 不访问缓存，返回记忆化的值...
$value = Cache::memo()->get('key');
```

当调用会修改缓存值的方法（如 `put`、`increment`、`remember` 等）时，记忆化缓存会自动遗忘记忆化的值，并将修改类方法的调用委托给底层缓存存储：

```php
Cache::memo()->put('name', 'Taylor'); // 写入底层缓存...
Cache::memo()->get('name');           // 访问底层缓存...
Cache::memo()->get('name');           // 已记忆化，不访问缓存...

Cache::memo()->put('name', 'Tim');    // 遗忘记忆化的值，写入新值...
Cache::memo()->get('name');           // 再次访问底层缓存...
```

<a name="the-cache-helper"></a>
### 缓存辅助函数

除了使用 `Cache` Facade，你还可以使用全局 `cache` 函数通过缓存来检索和存储数据。当 `cache` 函数以单个字符串参数调用时，它会返回给定键的值：

```php
$value = cache('key');
```

如果你向该函数提供一个键 / 值对数组以及过期时间，它会将值存储到缓存中并持续指定时长：

```php
cache(['key' => 'value'], $seconds);

cache(['key' => 'value'], now()->plus(minutes: 10));
```

当 `cache` 函数不带任何参数调用时，它会返回 `Illuminate\Contracts\Cache\Factory` 实现的一个实例，让你可以调用其他缓存方法：

```php
cache()->remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

> [!NOTE]
> 测试对全局 `cache` 函数的调用时，你可以使用 `Cache::shouldReceive` 方法，就像[测试 Facade](/docs/{{version}}/mocking#mocking-facades) 一样。

<a name="cache-tags"></a>
## 缓存标签

> [!WARNING]
> 使用 `file`、`dynamodb` 或 `database` 缓存驱动时不支持缓存标签。

<a name="storing-tagged-cache-items"></a>
### 存储带标签的缓存数据

缓存标签允许你为缓存中的相关项打上标签，然后清空所有被分配了指定标签的缓存值。你可以通过传入一个有序的标签名称数组来访问带标签的缓存。例如，让我们访问一个带标签的缓存并 `put` 一个值到缓存中：

```php
use Illuminate\Support\Facades\Cache;

Cache::tags(['people', 'artists'])->put('John', $john, $seconds);
Cache::tags(['people', 'authors'])->put('Anne', $anne, $seconds);
```

<a name="accessing-tagged-cache-items"></a>
### 访问带标签的缓存数据

通过标签存储的项，必须同时提供存储该值时所用的标签才能访问。要检索一个带标签的缓存项，请向 `tags` 方法传递相同的有序标签列表，然后用你想检索的键调用 `get` 方法：

```php
$john = Cache::tags(['people', 'artists'])->get('John');

$anne = Cache::tags(['people', 'authors'])->get('Anne');
```

<a name="removing-tagged-cache-items"></a>
### 移除带标签的缓存数据

你可以清空所有被分配了某个标签或一组标签的项。例如，以下代码将移除所有带有 `people`、`authors` 标签之一或两者兼有的缓存。因此，`Anne` 和 `John` 都会从缓存中移除：

```php
Cache::tags(['people', 'authors'])->flush();
```

相比之下，下面的代码只会移除带有 `authors` 标签的缓存值，因此 `Anne` 会被移除，而 `John` 不会：

```php
Cache::tags('authors')->flush();
```

<a name="atomic-locks"></a>
## 原子锁

> [!WARNING]
> 要使用此功能，你的应用必须将 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="managing-locks"></a>
### 管理锁

原子锁允许你操作分布式锁而无需担心竞态条件。例如，[Laravel Cloud](https://cloud.laravel.com) 使用原子锁来确保同一时刻一台服务器上只执行一个远程任务。你可以使用 `Cache::lock` 方法来创建和管理锁：

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // 锁已获取，持续 10 秒...

    $lock->release();
}
```

`get` 方法也接受一个闭包。闭包执行完毕后，Laravel 会自动释放锁：

```php
Cache::lock('foo', 10)->get(function () {
    // 锁已获取 10 秒并自动释放...
});
```

如果在你请求锁的时刻它不可用，你可以让 Laravel 等待指定的秒数。如果在指定时限内无法获取锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException` 异常：

```php
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
```

上面的例子可以通过向 `block` 方法传递闭包来简化。向该方法传递闭包时，Laravel 会尝试在指定的秒数内获取锁，并在闭包执行完毕后自动释放锁：

```php
Cache::lock('foo', 10)->block(5, function () {
    // 最多等待 5 秒后获取到锁，持续 10 秒...
});
```

<a name="managing-locks-across-processes"></a>
### 跨进程管理锁

有时，你可能希望在一个进程中获取锁，而在另一个进程中释放它。例如，你可能想在 Web 请求期间获取锁，并希望在该请求触发的队列作业结束时释放锁。在这种场景下，你应该将锁的作用域「所有者令牌」传递给队列作业，以便该作业可以使用给定的令牌重新实例化锁。

在下面的例子中，如果成功获取锁，我们将分发一个队列作业。此外，我们会通过锁的 `owner` 方法将锁的所有者令牌传递给队列作业：

```php
$podcast = Podcast::find($id);

$lock = Cache::lock('processing', 120);

if ($lock->get()) {
    ProcessPodcast::dispatch($podcast, $lock->owner());
}
```

在应用的 `ProcessPodcast` 作业中，我们可以使用所有者令牌来恢复并释放锁：

```php
Cache::restoreLock('processing', $this->owner)->release();
```

如果你想释放锁而不考虑其当前所有者，可以使用 `forceRelease` 方法：

```php
Cache::lock('processing')->forceRelease();
```

<a name="concurrency-limiting"></a>
### 并发限制

Laravel 的原子锁功能还提供了几种限制闭包并发执行的方式。当你希望在整个基础设施中只允许一个运行实例时，可使用 `withoutOverlapping`：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 10 秒后获取到锁...
});
```

默认情况下，锁会一直保持到闭包执行完毕，该方法最多等待 10 秒来获取锁。你可以使用额外的参数来自定义这些值：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 5 秒后获取到锁，持续 120 秒...
}, lockFor: 120, waitFor: 5);
```

如果在指定的等待时间内无法获取锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException` 异常。

如果你想要可控的并行度，可以使用 `funnel` 方法来设置并发执行的最大数量。`funnel` 方法适用于任何支持锁的缓存驱动：

```php
Cache::funnel('foo')
    ->limit(3)
    ->releaseAfter(60)
    ->block(10)
    ->then(function () {
        // 已获取并发锁...
    }, function () {
        // 无法获取并发锁...
    });
```

`funnel` 的键标识被限制的资源。`limit` 方法定义最大并发执行数。`releaseAfter` 方法设置一个安全超时秒数，超过该时间后已获取的槽位将被自动释放。`block` 方法设置等待可用槽位的秒数。

如果你希望通过异常来处理超时，而不是提供失败闭包，可以省略第二个闭包。如果在指定的等待时间内无法获取锁，将抛出 `Illuminate\Cache\Limiters\LimiterTimeoutException` 异常：

```php
use Illuminate\Cache\Limiters\LimiterTimeoutException;

try {
    Cache::funnel('foo')
        ->limit(3)
        ->releaseAfter(60)
        ->block(10)
        ->then(function () {
            // 已获取并发锁...
        });
} catch (LimiterTimeoutException $e) {
    // 无法获取并发锁...
}
```

如果你想为并发限制器使用特定的缓存存储，可以在所需的存储上调用 `funnel` 方法：

```php
Cache::store('redis')->funnel('foo')
    ->limit(3)
    ->block(10)
    ->then(function () {
        // 使用 "redis" 存储获取并发锁...
    });
```

> [!NOTE]
> `funnel` 方法要求缓存存储实现 `Illuminate\Contracts\Cache\LockProvider` 接口。如果你尝试在不支持锁的缓存存储上使用 `funnel`，将抛出 `BadMethodCallException` 异常。

<a name="cache-failover"></a>
## 缓存故障转移

`failover` 缓存驱动在与缓存交互时提供自动故障转移功能。如果 `failover` 存储的主缓存存储因任何原因失败，Laravel 会自动尝试使用列表中配置的下一个存储。这对于在生产环境中确保高可用性尤其有用，因为在这种环境下缓存的可靠性至关重要。

要配置故障转移缓存存储，需指定 `failover` 驱动并提供一个按顺序尝试的存储名称数组。默认情况下，Laravel 已在应用的 `config/cache.php` 配置文件中包含了一个故障转移配置示例：

```php
'failover' => [
    'driver' => 'failover',
    'stores' => [
        'database',
        'array',
    ],
],
```

配置好使用 `failover` 驱动的存储后，你需要在应用的 `.env` 文件中将故障转移存储设置为默认缓存存储，才能使用故障转移功能：

```ini
CACHE_STORE=failover
```

当缓存存储操作失败并触发故障转移时，Laravel 会分发 `Illuminate\Cache\Events\CacheFailedOver` 事件，让你能够报告或记录缓存存储已发生故障。

<a name="adding-custom-cache-drivers"></a>
## 添加自定义缓存驱动

<a name="writing-the-driver"></a>
### 编写驱动

要创建自定义缓存驱动，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [契约](/docs/{{version}}/contracts)。一个 MongoDB 缓存实现可能类似下面这样：

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

我们只需要使用 MongoDB 连接来实现这些方法即可。关于如何实现各个方法的示例，可以查看 [Laravel 框架源代码](https://github.com/laravel/framework)中的 `Illuminate\Cache\MemcachedStore`。完成实现后，我们可以调用 `Cache` Facade 的 `extend` 方法来完成自定义驱动的注册：

```php
Cache::extend('mongo', function (Application $app) {
    return Cache::repository(new MongoStore);
});
```

> [!NOTE]
> 如果你不确定自定义缓存驱动的代码放在哪里，可以在 `app` 目录下创建一个 `Extensions` 命名空间。不过请记住，Laravel 没有僵化的应用结构，你可以按照自己的喜好来组织应用。

<a name="registering-the-driver"></a>
### 注册驱动

要向 Laravel 注册自定义缓存驱动，我们将使用 `Cache` Facade 的 `extend` 方法。由于其他服务提供者（Service Provider）可能会在其 `boot` 方法中读取缓存值，我们将在 `booting` 回调中注册自定义驱动。通过使用 `booting` 回调，可以确保自定义驱动在应用的服务提供者的 `boot` 方法被调用之前、而在所有服务提供者的 `register` 方法被调用之后注册。我们将在应用的 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册 `booting` 回调：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoStore;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册应用的任何服务。
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
     * 引导应用的任何服务。
     */
    public function boot(): void
    {
        // ...
    }
}
```

传递给 `extend` 方法的第一个参数是驱动名称。它将对应 `config/cache.php` 配置文件中你的 `driver` 选项。第二个参数是一个应返回 `Illuminate\Cache\Repository` 实例的闭包。该闭包会接收一个 `$app` 实例，即[服务容器](/docs/{{version}}/container)的一个实例。

注册好扩展后，将应用的 `config/cache.php` 配置文件中的 `CACHE_STORE` 环境变量或 `default` 选项更新为你的扩展名称即可。

<a name="events"></a>
## 事件

要在每次缓存操作时执行代码，你可以监听缓存分发的各种[事件](/docs/{{version}}/events)：

| 事件名称                                      |
|----------------------------------------------|
| `Illuminate\Cache\Events\CacheFlushed`       |
| `Illuminate\Cache\Events\CacheFlushing`      |
| `Illuminate\Cache\Events\CacheHit`           |
| `Illuminate\Cache\Events\CacheMissed`        |
| `Illuminate\Cache\Events\ForgettingKey`      |
| `Illuminate\Cache\Events\KeyForgetFailed`    |
| `Illuminate\Cache\Events\KeyForgotten`       |
| `Illuminate\Cache\Events\KeyWriteFailed`     |
| `Illuminate\Cache\Events\KeyWritten`         |
| `Illuminate\Cache\Events\RetrievingKey`      |
| `Illuminate\Cache\Events\RetrievingManyKeys` |
| `Illuminate\Cache\Events\WritingKey`         |
| `Illuminate\Cache\Events\WritingManyKeys`    |

为了提升性能，你可以在应用的 `config/cache.php` 配置文件中，将某个缓存存储的 `events` 配置选项设置为 `false`，以禁用缓存事件：

```php
'database' => [
    'driver' => 'database',
    // ...
    'events' => false,
],
```
