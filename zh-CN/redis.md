# Redis

## 简介

[Redis](https://redis.io) 是一个开源的高级键值存储。它常被称为数据结构服务器，因为键可以包含[字符串](https://redis.io/docs/latest/develop/data-types/strings/)、[哈希](https://redis.io/docs/latest/develop/data-types/hashes/)、[列表](https://redis.io/docs/latest/develop/data-types/lists/)、[集合](https://redis.io/docs/latest/develop/data-types/sets/)和[有序集合](https://redis.io/docs/latest/develop/data-types/sorted-sets/)。

在将 Redis 与 Laravel 配合使用之前，我们建议你通过 PECL 安装并使用 [PhpRedis](https://github.com/phpredis/phpredis) PHP 扩展。与"用户态"PHP 包相比，该扩展安装更复杂，但对于重度使用 Redis 的应用可能带来更好的性能。如果你正在使用 [Laravel Sail](/docs/{{version}}/sail)，该扩展已经安装在应用的 Docker 容器中。

如果你无法安装 PhpRedis 扩展，可以通过 Composer 安装 `predis/predis` 包。Predis 是一个完全用 PHP 编写的 Redis 客户端，不需要任何额外的扩展：

```shell
composer require predis/predis
```

## 配置

你可以通过 `config/database.php` 配置文件来配置应用的 Redis 设置。在该文件中，你会看到一个包含应用所用 Redis 服务器的 `redis` 数组：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

],
```

配置文件中定义的每个 Redis 服务器都需要有名称、主机和端口，除非你定义单个 URL 来表示 Redis 连接：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => 'tcp://127.0.0.1:6379?database=0',
    ],

    'cache' => [
        'url' => 'tls://user:password@127.0.0.1:6380?database=1',
    ],

],
```

#### 配置连接方案

默认情况下，Redis 客户端在连接到 Redis 服务器时使用 `tcp` 方案；不过，你可以通过在 Redis 服务器的配置数组中指定 `scheme` 配置选项来使用 TLS / SSL 加密：

```php
'default' => [
    'scheme' => 'tls',
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
],
```

### 集群

如果你的应用使用 Redis 服务器集群，应在 Redis 配置的 `clusters` 键中定义这些集群。该配置键默认不存在，因此你需要在应用的 `config/database.php` 配置文件中创建它：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'clusters' => [
        'default' => [
            [
                'url' => env('REDIS_URL'),
                'host' => env('REDIS_HOST', '127.0.0.1'),
                'username' => env('REDIS_USERNAME'),
                'password' => env('REDIS_PASSWORD'),
                'port' => env('REDIS_PORT', '6379'),
                'database' => env('REDIS_DB', '0'),
            ],
        ],
    ],

    // ...
],
```

默认情况下，Laravel 会使用原生的 Redis 集群，因为 `options.cluster` 配置值被设为 `redis`。Redis 集群是一个很好的默认选项，因为它能优雅地处理故障转移。

使用 Predis 时，Laravel 也支持客户端分片。不过，客户端分片不处理故障转移；因此，它主要适用于可从另一个主数据存储获取的临时缓存数据。

如果你想使用客户端分片而非原生 Redis 集群，可以在应用的 `config/database.php` 配置文件中移除 `options.cluster` 配置值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'clusters' => [
        // ...
    ],

    // ...
],
```

### Predis

如果你想让应用通过 Predis 包与 Redis 交互，应确保 `REDIS_CLIENT` 环境变量的值为 `predis`：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'predis'),

    // ...
],
```

除默认配置选项外，Predis 还支持可为每个 Redis 服务器定义的额外[连接参数](https://github.com/nrk/predis/wiki/Connection-Parameters)。要使用这些额外配置选项，请将它们添加到应用 `config/database.php` 配置文件中的 Redis 服务器配置里：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_write_timeout' => 60,
],
```

### PhpRedis

默认情况下，Laravel 会使用 PhpRedis 扩展与 Redis 通信。Laravel 用于与 Redis 通信的客户端由 `redis.client` 配置选项的值决定，该值通常反映 `REDIS_CLIENT` 环境变量的值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    // ...
],
```

除默认配置选项外，PhpRedis 还支持以下额外连接参数：`name`、`persistent`、`persistent_id`、`prefix`、`read_timeout`、`retry_interval`、`max_retries`、`backoff_algorithm`、`backoff_base`、`backoff_cap`、`timeout` 和 `context`。你可以将这些选项中的任意一个添加到 `config/database.php` 配置文件中的 Redis 服务器配置里：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_timeout' => 60,
    'context' => [
        // 'auth' => ['username', 'secret'],
        // 'stream' => ['verify_peer' => false],
    ],
],
```

#### 重试与退避配置

`retry_interval`、`max_retries`、`backoff_algorithm`、`backoff_base` 和 `backoff_cap` 选项可用于配置 PhpRedis 客户端应如何尝试重新连接到 Redis 服务器。支持以下退避算法：`default`、`decorrelated_jitter`、`equal_jitter`、`exponential`、`uniform` 和 `constant`：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'max_retries' => env('REDIS_MAX_RETRIES', 3),
    'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
    'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
    'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
],
```

在发生瞬时连接失败后，Laravel 会自动对安全的读取命令重试一次。你可以使用 `command_retries` 选项来配置所有 Redis 命令的重试次数：

```php
'default' => [
    // ...
    'command_retries' => env('REDIS_COMMAND_RETRIES', 0),
],
```

Predis 3.4.0 及更高版本通过 `Retry` 类支持内置的重试与退避配置。你可以使用 `max_retries` 选项配置重试次数，并使用 `retry` 选项配置退避策略。`retry` 选项应是一个以以下策略类之一为键的数组：`NoBackoff`、`EqualBackoff` 或 `ExponentialBackoff`：

```php
use Predis\Retry\Strategy\ExponentialBackoff;

'default' => [
    'url' => env('REDIS_URL'),
    // ...
    'retry' => [
        ExponentialBackoff::class => [
            env('REDIS_BACKOFF_BASE', 100),
            env('REDIS_BACKOFF_CAP', 1000),
            true, // 启用抖动……
        ],
    ],
    'max_retries' => env('REDIS_MAX_RETRIES', 3),
],
```

在 Redis 集群中使用 Predis 时，你可以在集群配置的 `parameters` 选项中定义重试配置：

```php
use Predis\Retry\Strategy\NoBackoff;

'clusters' => [
    'default' => [
        // ...
    ],
],

'options' => [
    'cluster' => env('REDIS_CLUSTER', 'redis'),
    'parameters' => [
        'retry' => [
            NoBackoff::class => [],
        ],
        'max_retries' => env('REDIS_MAX_RETRIES', 3),
    ],
],
```

#### Unix 套接字连接

Redis 连接也可以配置为使用 Unix 套接字而非 TCP。由于消除了与同一服务器上 Redis 实例建立连接时的 TCP 开销，这可以带来更好的性能。要将 Redis 配置为使用 Unix 套接字，请将 `REDIS_HOST` 环境变量设为 Redis 套接字的路径，并将 `REDIS_PORT` 环境变量设为 `0`：

```env
REDIS_HOST=/run/redis/redis.sock
REDIS_PORT=0
```

#### PhpRedis 序列化与压缩

PhpRedis 扩展也可以配置为使用多种序列化器和压缩算法。这些算法可以通过 Redis 配置的 `options` 数组进行配置：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        'serializer' => Redis::SERIALIZER_MSGPACK,
        'compression' => Redis::COMPRESSION_LZ4,
    ],

    // ...
],
```

当前支持的序列化器包括：`Redis::SERIALIZER_NONE`（默认）、`Redis::SERIALIZER_PHP`、`Redis::SERIALIZER_JSON`、`Redis::SERIALIZER_IGBINARY` 和 `Redis::SERIALIZER_MSGPACK`。

支持的压缩算法包括：`Redis::COMPRESSION_NONE`（默认）、`Redis::COMPRESSION_LZF`、`Redis::COMPRESSION_ZSTD` 和 `Redis::COMPRESSION_LZ4`。

## 与 Redis 交互

你可以通过在 `Redis` [Facade](/docs/{{version}}/facades) 上调用各种方法来与 Redis 交互。`Redis` Facade 支持动态方法，这意味着你可以在该 Facade 上调用任意 [Redis 命令](https://redis.io/commands)，该命令会被直接传递给 Redis。在本例中，我们将通过调用 `Redis` Facade 的 `get` 方法来调用 Redis 的 `GET` 命令：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Redis;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示给定用户的个人资料。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => Redis::get('user:profile:'.$id)
        ]);
    }
}
```

如上所述，你可以在 `Redis` Facade 上调用 Redis 的任何命令。Laravel 使用魔术方法将这些命令传递给 Redis 服务器。如果某个 Redis 命令需要参数，你应当将这些参数传递给 Facade 的对应方法：

```php
use Illuminate\Support\Facades\Redis;

Redis::set('name', 'Taylor');

$values = Redis::lrange('names', 5, 10);
```

另外，你可以使用 `Redis` Facade 的 `command` 方法将命令传递给服务器，该方法接受命令名称作为第一个参数，值的数组作为第二个参数：

```php
$values = Redis::command('lrange', ['name', 5, 10]);
```

#### 使用多个 Redis 连接

应用的 `config/database.php` 配置文件允许你定义多个 Redis 连接/服务器。你可以使用 `Redis` Facade 的 `connection` 方法获取特定 Redis 连接的连接实例：

```php
$redis = Redis::connection('connection-name');
```

要获取默认 Redis 连接的实例，你可以不带任何额外参数地调用 `connection` 方法：

```php
$redis = Redis::connection();
```

### 事务

`Redis` Facade 的 `transaction` 方法为 Redis 原生的 `MULTI` 和 `EXEC` 命令提供了一个便捷的封装。该 `transaction` 方法接受一个闭包作为唯一参数。该闭包会接收一个 Redis 连接实例，并可以向该实例发出任意它想要的命令。在闭包内发出的所有 Redis 命令都会在一个单一的原子事务中执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::transaction(function (Redis $redis) {
    $redis->incr('user_visits', 1);
    $redis->incr('total_visits', 1);
});
```

> [!WARNING]
> 定义 Redis 事务时，你可能无法从 Redis 连接中检索任何值。请记住，你的事务是作为一个单一的原子操作执行的，并且该操作要等到整个闭包执行完其命令后才会执行。

#### Lua 脚本

`eval` 方法提供了在单一原子操作中执行多个 Redis 命令的另一种方式。不过，`eval` 方法的优势在于能够在该操作过程中与 Redis 键值交互并检查它们。Redis 脚本使用 [Lua 编程语言](https://www.lua.org) 编写。

`eval` 方法起初可能有点吓人，但我们会通过一个基础示例来打破僵局。`eval` 方法需要几个参数。首先，你应将 Lua 脚本（作为字符串）传给该方法。其次，你应传入脚本交互的键的数量（作为整数）。第三，你应传入这些键的名称。最后，你可以传入在脚本中需要访问的任何其他额外参数。

在本例中，我们会递增一个计数器、检查它的新值，并在第一个计数器的值大于 5 时递增第二个计数器。最后，我们会返回第一个计数器的值：

```php
$value = Redis::eval(<<<'LUA'
    local counter = redis.call("incr", KEYS[1])

    if counter > 5 then
        redis.call("incr", KEYS[2])
    end

    return counter
LUA, 2, 'first-counter', 'second-counter');
```

> [!WARNING]
> 有关 Redis 脚本的更多信息，请查阅 [Redis 文档](https://redis.io/commands/eval)。

### 管道命令

有时你可能需要执行数十个 Redis 命令。与其为每个命令都向 Redis 服务器发起一次网络往返，你可以使用 `pipeline` 方法。该 `pipeline` 方法接受一个参数：一个接收 Redis 实例的闭包。你可以向该 Redis 实例发出所有命令，它们会同时被发送到 Redis 服务器，从而减少往返服务器的网络次数。这些命令仍会按发出的顺序执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::pipeline(function (Redis $pipe) {
    for ($i = 0; $i < 1000; $i++) {
        $pipe->set("key:$i", $i);
    }
});
```

## 发布/订阅

Laravel 为 Redis 的 `publish` 和 `subscribe` 命令提供了一个便捷的接口。这些 Redis 命令允许你监听给定"频道"上的消息。你可以从另一个应用、甚至使用另一种编程语言向该频道发布消息，从而实现应用与进程之间的轻松通信。

首先，让我们使用 `subscribe` 方法设置一个频道监听器。我们会将此方法调用放在一个 [Artisan 命令](/docs/{{version}}/artisan) 中，因为调用 `subscribe` 方法会启动一个长生命周期进程：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisSubscribe extends Command
{
    /**
     * 控制台命令的名称与签名。
     *
     * @var string
     */
    protected $signature = 'redis:subscribe';

    /**
     * 控制台命令描述。
     *
     * @var string
     */
    protected $description = 'Subscribe to a Redis channel';

    /**
     * 执行控制台命令。
     */
    public function handle(): void
    {
        Redis::subscribe(['test-channel'], function (string $message) {
            echo $message;
        });
    }
}
```

现在我们可以使用 `publish` 方法向该频道发布消息：

```php
use Illuminate\Support\Facades\Redis;

Route::get('/publish', function () {
    // ...

    Redis::publish('test-channel', json_encode([
        'name' => 'Adam Wathan'
    ]));
});
```

#### 通配符订阅

使用 `psubscribe` 方法，你可以订阅一个通配符频道，这对于捕获所有频道上的所有消息很有用。频道名称会作为第二个参数传递给所提供的闭包：

```php
Redis::psubscribe(['*'], function (string $message, string $channel) {
    echo $message;
});

Redis::psubscribe(['users.*'], function (string $message, string $channel) {
    echo $message;
});
```
