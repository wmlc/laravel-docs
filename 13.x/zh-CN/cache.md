# 缓存

- [简介](#introduction)
- [配置](#configuration)
    - [驱动前置条件](#driver-prerequisites)
- [缓存使用](#cache-usage)
    - [获取缓存实例](#obtaining-a-cache-instance)
    - [从缓存中检索条目](#retrieving-items-from-the-cache)
    - [在缓存中存储条目](#storing-items-in-the-cache)
    - [延长条目生命周期](#extending-item-lifetime)
    - [从缓存中移除条目](#removing-items-from-the-cache)
    - [缓存记忆化](#cache-memoization)
    - [缓存辅助函数](#the-cache-helper)
- [缓存标签](#cache-tags)
    - [存储带标签的缓存条目](#storing-tagged-cache-items)
    - [访问带标签的缓存条目](#accessing-tagged-cache-items)
    - [移除带标签的缓存条目](#removing-tagged-cache-items)
- [原子锁](#atomic-locks)
    - [管理锁](#managing-locks)
    - [跨进程管理锁](#managing-locks-across-processes)
    - [刷新锁](#refreshing-locks)
    - [并发限制](#concurrency-limiting)
- [缓存故障转移](#cache-failover)
- [添加自定义缓存驱动](#adding-custom-cache-drivers)
    - [编写驱动](#writing-the-driver)
    - [注册驱动](#registering-the-driver)
- [事件](#events)

<a name="introduction"></a>
## 简介

你的应用执行的某些数据检索或处理任务可能非常消耗 CPU，或需要几秒钟才能完成。遇到这种情况时，通常会将数据缓存一段时间，以便在后续对同一数据的请求中能够快速检索。缓存的数据通常存储在一个非常快速的数据存储中，例如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io)。

幸运的是，Laravel 为各种缓存后端提供了富有表现力、统一的 API，让你可以利用它们极快的数据检索速度来加速你的 Web 应用。

<a name="configuration"></a>
## 配置

应用的缓存配置文件位于 `config/cache.php`。在该文件中，你可以指定希望在整个应用中默认使用的缓存存储。Laravel 开箱即用地支持流行的缓存后端，例如 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb)、关系型数据库以及文件系统磁盘。此外，还提供了一个基于文件的缓存驱动，而 `array` 与 `null` 缓存驱动则为你的自动化测试提供了便利的缓存后端。

缓存配置文件还包含其他多种你可以查看的选项。默认情况下，Laravel 配置为使用 `database` 缓存驱动，它将序列化后的缓存对象存储在应用的数据库中。

<a name="driver-prerequisites"></a>
### 驱动前置条件

<a name="prerequisites-database"></a>
#### 数据库

使用 `database` 缓存驱动时，你需要一张数据库表来存放缓存数据。通常，这已包含在 Laravel 默认的 `0001_01_01_000001_create_cache_table.php` [数据库迁移](/docs/{{version}}/migrations) 中；不过，如果你的应用不包含该迁移，可以使用 `make:cache-table` Artisan 命令来创建它：

```shell
php artisan make:cache-table

php artisan migrate
```

<a name="memcached"></a>
#### Memcached

使用 Memcached 驱动需要安装 [Memcached PECL 包](https://pecl.php.net/package/memcached)。你可以在 `config/cache.php` 配置文件中列出你所有的 Memcached 服务器。该文件已经包含了一个 `memcached.servers` 条目供你起步：

```php
'memcached' => [
    // ……

    'servers' => [
        [
            'host' => env('MEMCACHED_HOST', '127.0.0.1'),
            'port' => env('MEMCACHED_PORT', 11211),
            'weight' => 100,
        ],
    ],
],
```

如果需要，你可以将 `host` 选项设置为一个 UNIX socket 路径。如果这样做，则 `port` 选项应设置为 `0`：

```php
'memcached' => [
    // ……

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

在 Laravel 中使用 Redis 缓存之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或者通过 Composer 安装 `predis/predis` 包。[Laravel Sail](/docs/{{version}}/sail) 已包含此扩展。此外，官方的 Laravel 应用平台，例如 [Laravel Cloud](https://cloud.laravel.com) 与 [Laravel Forge](https://forge.laravel.com)，默认已安装 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅其 [Laravel 文档页](/docs/{{version}}/redis#configuration)。

<a name="storage"></a>
#### Storage

`storage` 缓存驱动允许你将缓存值存储在任何已配置的 [文件系统磁盘](/docs/{{version}}/filesystem) 上。当你希望使用一个已有的磁盘（例如 S3 磁盘）作为键 / 值缓存存储时，这会很有用：

```php
'storage' => [
    'driver' => 'storage',
    'disk' => env('CACHE_STORAGE_DISK'),
    'path' => env('CACHE_STORAGE_PATH', 'framework/cache/data'),
],
```

<a name="dynamodb"></a>
#### DynamoDB

使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动之前，你必须创建一个 DynamoDB 表来存储所有缓存数据。通常，该表应命名为 `cache`。不过，你应根据 `cache` 配置文件中 `stores.dynamodb.table` 配置项的值来为表命名。表名也可以通过 `DYNAMODB_CACHE_TABLE` 环境变量设置。

该表还应当有一个字符串分区键，其名称对应于应用 `cache` 配置文件中 `stores.dynamodb.attributes.key` 配置项的值。默认情况下，分区键应命名为 `key`。

通常，DynamoDB 不会主动从表中移除已过期的条目。因此，你应当在表上 [启用生存时间（TTL）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)。配置表的 TTL 设置时，你应将 TTL 属性名称设置为 `expires_at`。

接下来，安装 AWS SDK，以便你的 Laravel 应用能够与 DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

此外，你应当确保为 DynamoDB 缓存存储的配置选项提供了值。通常，这些选项（例如 `AWS_ACCESS_KEY_ID` 与 `AWS_SECRET_ACCESS_KEY`）应当在应用的 `.env` 配置文件中定义：

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

如果你正在使用 MongoDB，官方 `mongodb/laravel-mongodb` 包提供了 `mongodb` 缓存驱动，可以使用 `mongodb` 数据库连接进行配置。MongoDB 支持 TTL 索引，可用于自动清理已过期的缓存条目。

有关配置 MongoDB 的更多信息，请参阅 MongoDB 的 [缓存与锁文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)。

<a name="cache-usage"></a>
## 缓存使用

<a name="obtaining-a-cache-instance"></a>
### 获取缓存实例

要获取一个缓存存储实例，可以使用 `Cache` facade，这也是我们贯穿本文档所使用的方式。`Cache` facade 为 Laravel 缓存契约的底层实现提供了便捷、简洁的访问：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 显示应用中所有用户的列表。
     */
    public function index(): array
    {
        $value = Cache::get('key');

        return [
            // ……
        ];
    }
}
```

<a name="accessing-multiple-cache-stores"></a>
#### 访问多个缓存存储

使用 `Cache` facade，你可以通过 `store` 方法访问各种缓存存储。传给 `store` 方法的键应当对应于你的 `cache` 配置文件中 `stores` 配置数组里列出的某个存储：

```php
$value = Cache::store('file')->get('foo');

Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟
```

<a name="retrieving-items-from-the-cache"></a>
### 从缓存中检索条目

`Cache` facade 的 `get` 方法用于从缓存中检索条目。如果条目不存在于缓存中，将返回 `null`。如果你愿意，可以传入第二个参数给 `get` 方法，指定在条目不存在时希望返回的默认值：

```php
$value = Cache::get('key');

$value = Cache::get('key', 'default');
```

你甚至可以传入一个闭包作为默认值。如果指定的条目不存在于缓存中，将返回该闭包的结果。传入闭包让你可以延迟从数据库或其他外部服务检索默认值：

```php
$value = Cache::get('key', function () {
    return DB::table(/* …… */)->get();
});
```

<a name="determining-item-existence"></a>
#### 判断条目是否存在

`has` 方法可用于判断某个条目是否存在于缓存中。如果条目存在但值为 `null`，该方法也会返回 `false`：

```php
if (Cache::has('key')) {
    // ……
}
```

<a name="incrementing-decrementing-values"></a>
#### 递增 / 递减值

`increment` 与 `decrement` 方法可用于调整缓存中整型条目的值。这两个方法都接受一个可选的第二个参数，指示条目值要递增或递减的数量：

```php
// 如果值不存在则初始化……
Cache::add('key', 0, now()->plus(hours: 4));

// 递增或递减值……
Cache::increment('key');
Cache::increment('key', $amount);
Cache::decrement('key');
Cache::decrement('key', $amount);
```

<a name="retrieve-store"></a>
#### 检索并存储

有时你可能希望从缓存中检索一个条目，但如果所请求的条目不存在，则同时存储一个默认值。例如，你可能希望从缓存中检索所有用户，如果不存在，则从数据库中检索并将它们加入缓存。你可以使用 `Cache::remember` 方法来做到这一点：

```php
$value = Cache::remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

如果条目不存在于缓存中，传给 `remember` 方法的闭包会被执行，其结果会被放入缓存。

如果你需要知道条目是从缓存中检索出来的，还是通过执行给定闭包得到的，可以使用 `rememberWithWarmth` 方法。该方法返回一个数组，包含缓存值以及一个布尔值，指示该条目是否"温热"（warm），即它是从缓存中检索出来的，而不是从闭包解析出来的：

```php
[$value, $warm] = Cache::rememberWithWarmth('users', $seconds, function () {
    return DB::table('users')->get();
});
```

你可以使用 `rememberForever` 方法从缓存中检索条目，如果它不存在则永久存储：

```php
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});
```

<a name="swr"></a>
#### 过期期间重验证（Stale While Revalidate）

使用 `Cache::remember` 方法时，如果缓存值已过期，某些用户可能会遇到响应缓慢的情况。对于某些类型的数据，在服务端重新计算缓存值的同时，允许提供部分过期的数据是有用的，这样可以防止某些用户在缓存值计算期间遇到响应缓慢。这通常被称为"stale-while-revalidate"（过期期间重验证）模式，`Cache::flexible` 方法提供了该模式的实现。

`flexible` 方法接受一个数组，指定缓存值被视为"新鲜"（fresh）多长时间，以及何时变为"过期"（stale）。数组中的第一个值表示缓存被视为新鲜的秒数，第二个值定义在被重新计算之前，它可以作为过期数据提供多长时间。

如果在新鲜期内（第一个值之前）发起请求，缓存会立即返回而无需重新计算。如果在过期期内（两个值之间）发起请求，过期值会提供给用户，并注册一个 [延迟函数](/docs/{{version}}/helpers#deferred-functions)，以便在响应发送给用户之后刷新缓存值。如果在第二个值之后发起请求，则缓存被视为已过期，值会被立即重新计算，这可能会导致用户响应变慢：

```php
$value = Cache::flexible('users', [5, 10], function () {
    return DB::table('users')->get();
});
```

<a name="retrieve-delete"></a>
#### 检索并删除

如果你需要从缓存中检索一个条目，然后删除该条目，可以使用 `pull` 方法。与 `get` 方法一样，如果条目不存在于缓存中，将返回 `null`：

```php
$value = Cache::pull('key');

$value = Cache::pull('key', 'default');
```

<a name="storing-items-in-the-cache"></a>
### 在缓存中存储条目

你可以使用 `Cache` facade 上的 `put` 方法将条目存储到缓存中：

```php
Cache::put('key', 'value', $seconds = 10);
```

如果没有将存储时间传给 `put` 方法，条目将被无限期存储：

```php
Cache::put('key', 'value');
```

除了传入秒数整数外，你也可以传入一个 `DateTime` 实例，表示缓存条目所需的过期时间：

```php
Cache::put('key', 'value', now()->plus(minutes: 10));
```

<a name="store-if-not-present"></a>
#### 不存在时才存储

`add` 方法只会在条目尚未存在于缓存存储中时才将其加入缓存。如果条目确实被加入缓存，该方法会返回 `true`。否则，该方法会返回 `false`。`add` 方法是一个原子操作：

```php
Cache::add('key', 'value', $seconds);
```

<a name="extending-item-lifetime"></a>
### 延长条目生命周期

`touch` 方法允许你延长一个已有缓存条目的生命周期（TTL）。如果缓存条目存在且其过期时间被成功延长，`touch` 方法会返回 `true`。如果条目不存在于缓存中，该方法会返回 `false`：

```php
Cache::touch('key', 3600);
```

你可以提供一个 `DateTimeInterface`、`DateInterval` 或 `Carbon` 实例来指定确切的过期时间：

```php
Cache::touch('key', now()->addHours(2));
```

<a name="storing-items-forever"></a>
#### 永久存储条目

`forever` 方法可用于将条目永久存储在缓存中。由于这些条目不会过期，必须使用 `forget` 方法手动将它们从缓存中移除：

```php
Cache::forever('key', 'value');
```

> [!NOTE]
> 如果你使用的是 Memcached 驱动，被存储为"永久"的条目可能会在缓存达到其大小上限时被移除。

<a name="removing-items-from-the-cache"></a>
### 从缓存中移除条目

你可以使用 `forget` 方法从缓存中移除条目：

```php
Cache::forget('key');
```

你也可以通过提供零或负数的过期秒数来移除条目：

```php
Cache::put('key', 'value', 0);

Cache::put('key', 'value', -5);
```

你可以使用 `flush` 方法清空整个缓存：

```php
Cache::flush();
```

你可以使用 `flushLocks` 方法清空缓存中的所有原子锁：

```php
Cache::flushLocks();
```

> [!WARNING]
> 清空缓存不会遵从你配置的缓存"前缀"（prefix），并会移除缓存中的所有条目。在清空被其他应用共享的缓存时，请仔细考虑这一点。

<a name="cache-memoization"></a>
### 缓存记忆化

Laravel 的 `memo` 缓存驱动允许你在单次请求或任务执行期间，将已解析的缓存值临时存储在内存中。这可以防止在同一执行过程中重复访问缓存，从而显著提升性能。

要使用被记忆化的缓存，调用 `memo` 方法：

```php
use Illuminate\Support\Facades\Cache;

$value = Cache::memo()->get('key');
```

`memo` 方法可选地接受一个缓存存储的名称，用于指定被记忆化驱动所装饰的底层缓存存储：

```php
// 使用默认缓存存储……
$value = Cache::memo()->get('key');

// 使用 Redis 缓存存储……
$value = Cache::memo('redis')->get('key');
```

对于给定的键，第一次 `get` 调用会从你的缓存存储中检索值，但同一请求或任务内的后续调用将从内存中检索值：

```php
// 命中缓存……
$value = Cache::memo()->get('key');

// 不命中缓存，返回被记忆的值……
$value = Cache::memo()->get('key');
```

当调用修改缓存值的方法（例如 `put`、`increment`、`remember` 等）时，被记忆化的缓存会自动遗忘被记忆化的值，并将该变更方法的调用委派给底层缓存存储：

```php
Cache::memo()->put('name', 'Taylor'); // 写入底层缓存……
Cache::memo()->get('name');           // 命中底层缓存……
Cache::memo()->get('name');           // 已被记忆化，不命中缓存……

Cache::memo()->put('name', 'Tim');    // 遗忘被记忆化的值，写入新值……
Cache::memo()->get('name');           // 再次命中底层缓存……
```

<a name="the-cache-helper"></a>
### 缓存辅助函数

除了使用 `Cache` facade，你还可以使用全局的 `cache` 函数来通过缓存检索和存储数据。当 `cache` 函数被传入一个单独的字符串参数调用时，它会返回给定键的值：

```php
$value = cache('key');
```

如果你向该函数提供一个键 / 值对数组和一个过期时间，它会在指定持续时间内将值存储到缓存中：

```php
cache(['key' => 'value'], $seconds);

cache(['key' => 'value'], now()->plus(minutes: 10));
```

当不带任何参数调用 `cache` 函数时，它会返回 `Illuminate\Contracts\Cache\Factory` 实现的一个实例，让你可以调用其他缓存方法：

```php
cache()->remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

> [!NOTE]
> 在测试对全局 `cache` 函数的调用时，你可以像 [测试 facade](/docs/{{version}}/mocking#mocking-facades) 一样使用 `Cache::shouldReceive` 方法。

<a name="cache-tags"></a>
## 缓存标签

> [!WARNING]
> 使用 `file`、`dynamodb`、`database` 或 `storage` 缓存驱动时，不支持缓存标签。

<a name="storing-tagged-cache-items"></a>
### 存储带标签的缓存条目

缓存标签允许你为缓存中的相关条目打上标签，然后刷新所有被赋予给定标签的缓存值。你可以通过传入一个有序的标签名数组来访问带标签的缓存。例如，让我们访问一个带标签的缓存并向其中 `put` 一个值：

```php
use Illuminate\Support\Facades\Cache;

Cache::tags(['people', 'artists'])->put('John', $john, $seconds);
Cache::tags(['people', 'authors'])->put('Anne', $anne, $seconds);
```

<a name="accessing-tagged-cache-items"></a>
### 访问带标签的缓存条目

通过标签存储的条目，必须同时提供用于存储该值时所使用的标签才能被访问。要检索带标签的缓存条目，请将相同的有序标签列表传给 `tags` 方法，然后调用 `get` 方法并传入你希望检索的键：

```php
$john = Cache::tags(['people', 'artists'])->get('John');

$anne = Cache::tags(['people', 'authors'])->get('Anne');
```

<a name="removing-tagged-cache-items"></a>
### 移除带标签的缓存条目

你可以刷新所有被赋予某个标签或标签列表的条目。例如，下面的代码会移除所有带有 `people`、`authors` 或两者的标签的缓存。因此，`Anne` 与 `John` 都会被从缓存中移除：

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
> 要使用此特性，你的应用必须将 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器都必须与同一个中心缓存服务器通信。

<a name="managing-locks"></a>
### 管理锁

原子锁允许你操作分布式锁，而无需担心竞态条件。例如，[Laravel Cloud](https://cloud.laravel.com) 使用原子锁来确保服务器上一次只执行一个远程任务。你可以使用 `Cache::lock` 方法创建并管理锁：

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // 锁已获取 10 秒……

    $lock->release();
}
```

`get` 方法也接受一个闭包。闭包执行完毕后，Laravel 会自动释放该锁：

```php
Cache::lock('foo', 10)->get(function () {
    // 锁已获取 10 秒并自动释放……
});
```

如果在你请求锁时锁当前不可用，你可以指示 Laravel 等待指定的秒数。如果在指定的时间限制内无法获取锁，会抛出 `Illuminate\Contracts\Cache\LockTimeoutException`：

```php
use Illuminate\Contracts\Cache\LockTimeoutException;

$lock = Cache::lock('foo', 10);

try {
    $lock->block(5);

    // 最多等待 5 秒后获取锁……
} catch (LockTimeoutException $e) {
    // 无法获取锁……
} finally {
    $lock->release();
}
```

上面的示例可以通过向 `block` 方法传入一个闭包来简化。当向该方法传入闭包时，Laravel 会尝试在指定的秒数内获取锁，并在闭包执行完毕后自动释放锁：

```php
Cache::lock('foo', 10)->block(5, function () {
    // 最多等待 5 秒后获取锁 10 秒……
});
```

<a name="managing-locks-across-processes"></a>
### 跨进程管理锁

有时，你可能希望在一个进程中获取锁，并在另一个进程中释放它。例如，你可能在一次 Web 请求期间获取锁，并希望在由该请求触发的队列任务结束时释放锁。在这种场景下，你应该将锁的作用域"所有者令牌"（owner token）传递给队列任务，以便该任务可以使用给定的令牌重新实例化锁。

在下面的示例中，如果成功获取锁，我们将分发一个队列任务。此外，我们会通过锁的 `owner` 方法将锁的所有者令牌传递给队列任务：

```php
$podcast = Podcast::find($id);

$lock = Cache::lock('processing', 120);

if ($lock->get()) {
    ProcessPodcast::dispatch($podcast, $lock->owner());
}
```

在应用的 `ProcessPodcast` 任务中，我们可以使用所有者令牌恢复并释放锁：

```php
Cache::restoreLock('processing', $this->owner)->release();
```

如果你希望在不考虑当前所有者的情况下释放锁，可以使用 `forceRelease` 方法：

```php
Cache::lock('processing')->forceRelease();
```

<a name="refreshing-locks"></a>
### 刷新锁

如果你需要延长当前拥有的锁的过期时间，可以使用 `refresh` 方法。如果没有提供秒数，将使用锁的原始持续时间。这对于长时间运行的操作很有用，在这种操作中你更倾向于获取一个短锁并定期延长它，而不是获取一个过期时间很长的锁：

```php
$lock = Cache::lock('generate-reports', 60);

if ($lock->get()) {
    foreach ($reports as $report) {
        $report->generate();

        // 将锁再延长 60 秒……
        $lock->refresh();
    }

    $lock->release();
}
```

<a name="concurrency-limiting"></a>
### 并发限制

Laravel 的原子锁功能还提供了几种限制闭包并发执行的方式。当你希望在整个基础设施中只允许一个运行实例时，请使用 `withoutOverlapping`：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 10 秒后获取锁……
});
```

默认情况下，锁会一直保持到闭包执行完毕，并且该方法会等待最多 10 秒以获取锁。你可以使用额外的参数来自定义这些值：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 5 秒后获取锁 120 秒……
}, lockFor: 120, waitFor: 5);
```

如果在指定的等待时间内无法获取锁，会抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果你希望受控的并行，请使用 `funnel` 方法来设置最大并发执行数。`funnel` 方法适用于任何支持锁的缓存驱动：

```php
Cache::funnel('foo')
    ->limit(3)
    ->releaseAfter(60)
    ->block(10)
    ->then(function () {
        // 并发锁已获取……
    }, function () {
        // 无法获取并发锁……
    });
```

`funnel` 键标识被限制的资源。`limit` 方法定义最大并发执行数。`releaseAfter` 方法设置在自动释放已获取的槽位之前的安全超时（秒）。`block` 方法设置等待可用槽位的秒数。

如果你希望通过异常而非提供失败闭包来处理超时，可以省略第二个闭包。如果在指定的等待时间内无法获取锁，会抛出 `Illuminate\Cache\Limiters\LimiterTimeoutException`：

```php
use Illuminate\Cache\Limiters\LimiterTimeoutException;

try {
    Cache::funnel('foo')
        ->limit(3)
        ->releaseAfter(60)
        ->block(10)
        ->then(function () {
            // 并发锁已获取……
        });
} catch (LimiterTimeoutException $e) {
    // 无法获取并发锁……
}
```

如果你希望为并发限制器使用特定的缓存存储，可以在所需的存储上调用 `funnel` 方法：

```php
Cache::store('redis')->funnel('foo')
    ->limit(3)
    ->block(10)
    ->then(function () {
        // 使用 "redis" 存储获取的并发锁……
    });
```

> [!NOTE]
> `funnel` 方法要求缓存存储实现 `Illuminate\Contracts\Cache\LockProvider` 接口。如果你尝试对不支持锁的缓存存储使用 `funnel`，会抛出 `BadMethodCallException`。

<a name="cache-failover"></a>
## 缓存故障转移

`failover` 缓存驱动在与缓存交互时提供自动故障转移功能。如果 `failover` 存储的主缓存存储因任何原因发生故障，Laravel 会自动尝试按顺序使用列表中下一个已配置的存储。这对于在缓存可靠性至关重要的生产环境中确保高可用性特别有用。

要配置一个故障转移缓存存储，请指定 `failover` 驱动，并提供一个按顺序尝试的存储名称数组。默认情况下，Laravel 在你的应用 `config/cache.php` 配置文件中包含了一个示例故障转移配置：

```php
'failover' => [
    'driver' => 'failover',
    'stores' => [
        'database',
        'array',
    ],
],
```

一旦你配置了一个使用 `failover` 驱动的存储，你需要将故障转移存储设置为应用 `.env` 文件中的默认缓存存储，以启用故障转移功能：

```ini
CACHE_STORE=failover
```

当缓存存储操作失败并触发故障转移时，Laravel 会分发 `Illuminate\Cache\Events\CacheFailedOver` 事件，让你能够报告或记录某个缓存存储已发生故障。

<a name="adding-custom-cache-drivers"></a>
## 添加自定义缓存驱动

<a name="writing-the-driver"></a>
### 编写驱动

要创建我们的自定义缓存驱动，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [契约](/docs/{{version}}/contracts)。因此，一个 MongoDB 缓存实现可能看起来像这样：

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

我们只需要使用 MongoDB 连接来实现这些方法中的每一个。有关如何实现这些方法的示例，请查看 [Laravel 框架源码](https://github.com/laravel/framework) 中的 `Illuminate\Cache\MemcachedStore`。一旦我们的实现完成，我们就可以通过调用 `Cache` facade 的 `extend` 方法来完成我们的自定义驱动注册：

```php
Cache::extend('mongo', function (Application $app) {
    return Cache::repository(new MongoStore);
});
```

> [!NOTE]
> 如果你在疑惑应该把自定义缓存驱动代码放在哪里，你可以在 `app` 目录中创建一个 `Extensions` 命名空间。不过，请记住 Laravel 并没有僵化的应用结构，你可以根据自己的偏好自由组织应用。

<a name="registering-the-driver"></a>
### 注册驱动

要向我们注册自定义缓存驱动，我们将使用 `Cache` facade 上的 `extend` 方法。由于其他服务提供者可能会尝试在其 `boot` 方法中读取缓存值，我们将在一个 `booting` 回调中注册我们的自定义驱动。通过使用 `booting` 回调，我们可以确保自定义驱动恰好在服务提供者上的 `boot` 方法被调用之前、但在所有服务提供者的 `register` 方法被调用之后注册。我们将在应用的 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册我们的 `booting` 回调：

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
        // ……
    }
}
```

传给 `extend` 方法的第一个参数是驱动的名称。它将对应于你 `config/cache.php` 配置文件中的 `driver` 选项。第二个参数是一个闭包，应当返回一个 `Illuminate\Cache\Repository` 实例。该闭包会接收到一个 `$app` 实例，它是 [服务容器](/docs/{{version}}/container) 的一个实例。

一旦你的扩展被注册，请更新应用 `config/cache.php` 配置文件中的 `CACHE_STORE` 环境变量或 `default` 选项，将其改为你的扩展的名称。

<a name="events"></a>
## 事件

要对每一次缓存操作执行代码，你可以监听缓存分发的各种 [事件](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称                                      |
|-----------------------------------------------|
| `Illuminate\Cache\Events\CacheFlushed`          |
| `Illuminate\Cache\Events\CacheFlushing`         |
| `Illuminate\Cache\Events\CacheFlushFailed`      |
| `Illuminate\Cache\Events\CacheLocksFlushed`     |
| `Illuminate\Cache\Events\CacheLocksFlushing`    |
| `Illuminate\Cache\Events\CacheLocksFlushFailed` |
| `Illuminate\Cache\Events\CacheHit`              |
| `Illuminate\Cache\Events\CacheMissed`           |
| `Illuminate\Cache\Events\ForgettingKey`         |
| `Illuminate\Cache\Events\KeyForgetFailed`       |
| `Illuminate\Cache\Events\KeyForgotten`          |
| `Illuminate\Cache\Events\KeyWriteFailed`        |
| `Illuminate\Cache\Events\KeyWritten`            |
| `Illuminate\Cache\Events\RetrievingKey`         |
| `Illuminate\Cache\Events\RetrievingManyKeys`    |
| `Illuminate\Cache\Events\WritingKey`            |
| `Illuminate\Cache\Events\WritingManyKeys`       |

</div>

为了提升性能，你可以通过将 `events` 配置选项设置为 `false` 来禁用缓存事件，针对应用 `config/cache.php` 配置文件中的某个给定缓存存储：

```php
'database' => [
    'driver' => 'database',
    // ……
    'events' => false,
],
```
