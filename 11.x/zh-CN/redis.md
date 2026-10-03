# Redis

- [简介](#introduction)
- [配置](#configuration)
    - [集群](#clusters)
    - [Predis](#predis)
    - [PhpRedis](#phpredis)
- [与 Redis 交互](#interacting-with-redis)
    - [事务](#transactions)
    - [流水线命令](#pipelining-commands)
- [发布 / 订阅](#pubsub)

<a name="introduction"></a>
## 简介

[Redis](https://redis.io) 是一个开源的高级键值存储。由于键可以包含[字符串](https://redis.io/docs/latest/develop/data-types/strings/)、[哈希](https://redis.io/docs/latest/develop/data-types/hashes/)、[列表](https://redis.io/docs/latest/develop/data-types/lists/)、[集合](https://redis.io/docs/latest/develop/data-types/sets/)和[有序集合](https://redis.io/docs/latest/develop/data-types/sorted-sets/)，它常被称为数据结构服务器。

在 Laravel 中使用 Redis 之前，我们建议你通过 PECL 安装并使用 [PhpRedis](https://github.com/phpredis/phpredis) PHP 扩展。与"用户态"PHP 包相比，该扩展的安装过程更复杂，但对于大量使用 Redis 的应用，它可能带来更好的性能。如果你使用 [Laravel Sail](/docs/{{version}}/sail)，该扩展已经安装在你的应用 Docker 容器中。

如果无法安装 PhpRedis 扩展，可以通过 Composer 安装 `predis/predis` 包。Predis 是一个完全用 PHP 编写的 Redis 客户端，不需要任何额外扩展：

```shell
composer require predis/predis:^2.0
```

<a name="configuration"></a>
## 配置

你可以通过 `config/database.php` 配置文件来配置应用的 Redis 设置。在该文件中，你会看到一个 `redis` 数组，其中包含应用所使用的 Redis 服务器：

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

在配置文件中定义的每个 Redis 服务器都必须有名称、主机和端口，除非你定义一个单独的 URL 来表示 Redis 连接：

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

<a name="configuring-the-connection-scheme"></a>
#### 配置连接协议

默认情况下，Redis 客户端连接 Redis 服务器时会使用 `tcp` 协议；不过，你可以在 Redis 服务器的配置数组中指定 `scheme` 配置项，以使用 TLS / SSL 加密：

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

<a name="clusters"></a>
### 集群

如果你的应用使用 Redis 服务器集群，应当在 Redis 配置的 `clusters` 键中定义这些集群。该配置键默认不存在，因此你需要在自己的 `config/database.php` 配置文件中创建它：

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

默认情况下，由于 `options.cluster` 配置值被设为 `redis`，Laravel 会使用原生 Redis 集群。Redis 集群是一个很好的默认选项，因为它能优雅地处理故障转移。

使用 Predis 时，Laravel 也支持客户端分片。不过，客户端分片不处理故障转移；因此它主要适用于可以从另一个主数据存储中获取的临时缓存数据。

如果你希望使用客户端分片代替原生 Redis 集群，可以从应用的 `config/database.php` 配置文件中移除 `options.cluster` 配置值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'clusters' => [
        // ...
    ],

    // ...
],
```

<a name="predis"></a>
### Predis

如果你希望应用通过 Predis 包与 Redis 交互，应确保 `REDIS_CLIENT` 环境变量的值为 `predis`：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'predis'),

    // ...
],
```

除默认配置项之外，Predis 还支持为每个 Redis 服务器定义额外的[连接参数](https://github.com/nrk/predis/wiki/Connection-Parameters)。要使用这些额外的配置项，请把它们添加到应用 `config/database.php` 配置文件中的 Redis 服务器配置里：

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

<a name="phpredis"></a>
### PhpRedis

默认情况下，Laravel 会使用 PhpRedis 扩展与 Redis 通信。Laravel 用于与 Redis 通信的客户端由 `redis.client` 配置项的值决定，该值通常反映 `REDIS_CLIENT` 环境变量的值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    // ...
],
```

除默认配置项之外，PhpRedis 还支持以下额外的连接参数：`name`、`persistent`、`persistent_id`、`prefix`、`read_timeout`、`retry_interval`、`max_retries`、`backoff_algorithm`、`backoff_base`、`backoff_cap`、`timeout` 和 `context`。你可以把其中任意选项添加到 `config/database.php` 配置文件中的 Redis 服务器配置里：

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

<a name="phpredis-serialization"></a>
#### PhpRedis 序列化与压缩

PhpRedis 扩展还可以配置为使用各种序列化器和压缩算法。这些算法通过 Redis 配置的 `options` 数组来配置：

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

目前支持的序列化器包括：`Redis::SERIALIZER_NONE`（默认）、`Redis::SERIALIZER_PHP`、`Redis::SERIALIZER_JSON`、`Redis::SERIALIZER_IGBINARY` 和 `Redis::SERIALIZER_MSGPACK`。

支持的压缩算法包括：`Redis::COMPRESSION_NONE`（默认）、`Redis::COMPRESSION_LZF`、`Redis::COMPRESSION_ZSTD` 和 `Redis::COMPRESSION_LZ4`。

<a name="interacting-with-redis"></a>
## 与 Redis 交互

你可以通过在 `Redis` [Facade](/docs/{{version}}/facades)上调用各种方法与 Redis 交互。`Redis` Facade 支持动态方法，意味着你可以在该 Facade 上调用任意 [Redis 命令](https://redis.io/commands)，命令会直接传递给 Redis。在这个例子中，我们通过调用 `Redis` Facade 上的 `get` 方法来执行 Redis 的 `GET` 命令：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Redis;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => Redis::get('user:profile:'.$id)
        ]);
    }
}
```

如上文所述，你可以在 `Redis` Facade 上调用任意 Redis 命令。Laravel 使用魔术方法把命令传递给 Redis 服务器。如果某个 Redis 命令需要参数，应把这些参数传给该 Facade 上对应的方法：

```php
use Illuminate\Support\Facades\Redis;

Redis::set('name', 'Taylor');

$values = Redis::lrange('names', 5, 10);
```

另外，你也可以使用 `Redis` Facade 的 `command` 方法把命令传给服务器，该方法的第一个参数接收命令名称，第二个参数接收一个值数组：

```php
$values = Redis::command('lrange', ['name', 5, 10]);
```

<a name="using-multiple-redis-connections"></a>
#### 使用多个 Redis 连接

应用的 `config/database.php` 配置文件允许你定义多个 Redis 连接 / 服务器。你可以使用 `Redis` Facade 的 `connection` 方法获取指向某个特定 Redis 连接的连接实例：

```php
$redis = Redis::connection('connection-name');
```

要获取默认 Redis 连接的实例，可以不带任何额外参数调用 `connection` 方法：

```php
$redis = Redis::connection();
```

<a name="transactions"></a>
### 事务

`Redis` Facade 的 `transaction` 方法为 Redis 原生的 `MULTI` 和 `EXEC` 命令提供了便捷的封装。`transaction` 方法只接受一个闭包参数。该闭包会收到一个 Redis 连接实例，可以向该实例发出任意命令。闭包内发出的所有 Redis 命令都会在单个原子事务中执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::transaction(function (Redis $redis) {
    $redis->incr('user_visits', 1);
    $redis->incr('total_visits', 1);
});
```

> [!WARNING]
> 定义 Redis 事务时，你不能从 Redis 连接中检索任何值。请记住，你的事务会作为一个原子操作执行，并且只有在你整个闭包执行完其命令后，该操作才会真正执行。

#### Lua 脚本

`eval` 方法提供了另一种在单个原子操作中执行多个 Redis 命令的方式。不过，`eval` 方法的好处在于，它能在该操作过程中与 Redis 键值交互并检查它们。Redis 脚本使用 [Lua 编程语言](https://www.lua.org)编写。

`eval` 方法一开始可能让人望而生畏，不过我们用一个基础示例来轻松入门。`eval` 方法需要若干参数。首先，你应把 Lua 脚本（作为字符串）传给该方法。其次，你应传入脚本会交互的键数量（作为整数）。第三，你应传入这些键的名称。最后，你还可以传入脚本中需要访问的任何其它参数。

在这个例子中，我们会让一个计数器自增，检查它的新值，并在第一个计数器的值大于 5 时让第二个计数器自增。最后，我们返回第一个计数器的值：

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
> 想了解更多关于 Redis 脚本的信息，请查阅 [Redis 文档](https://redis.io/commands/eval)。

<a name="pipelining-commands"></a>
### 流水线命令

有时你可能需要执行数十条 Redis 命令。与其为每条命令都往返一次 Redis 服务器，你可以使用 `pipeline` 方法。`pipeline` 方法接受一个参数：一个接收 Redis 实例的闭包。你可以把所有命令都发给这个 Redis 实例，它们会被同时发送到 Redis 服务器，从而减少与服务器的网络往返次数。这些命令仍会按发出的顺序执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::pipeline(function (Redis $pipe) {
    for ($i = 0; $i < 1000; $i++) {
        $pipe->set("key:$i", $i);
    }
});
```

<a name="pubsub"></a>
## 发布 / 订阅

Laravel 为 Redis 的 `publish` 和 `subscribe` 命令提供了便捷的接口。这两个 Redis 命令让你能够监听某个"频道"上的消息。你可以从另一个应用，甚至用另一种编程语言向该频道发布消息，从而在应用与进程之间实现便捷通信。

首先，让我们使用 `subscribe` 方法建立一个频道监听器。由于调用 `subscribe` 方法会启动一个长时间运行的进程，我们会把该方法调用放在一个 [Artisan 命令](/docs/{{version}}/artisan)中：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisSubscribe extends Command
{
    /**
     * 控制台命令的名称和签名。
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

现在，我们可以使用 `publish` 方法向该频道发布消息：

```php
use Illuminate\Support\Facades\Redis;

Route::get('/publish', function () {
    // ...

    Redis::publish('test-channel', json_encode([
        'name' => 'Adam Wathan'
    ]));
});
```

<a name="wildcard-subscriptions"></a>
#### 通配符订阅

使用 `psubscribe` 方法，你可以订阅通配符频道，这有助于捕获所有频道上的所有消息。频道名称会作为第二个参数传给所提供的闭包：

```php
Redis::psubscribe(['*'], function (string $message, string $channel) {
    echo $message;
});

Redis::psubscribe(['users.*'], function (string $message, string $channel) {
    echo $message;
});
```