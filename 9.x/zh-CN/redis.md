# Redis

- [简介](#introduction)
- [配置](#configuration)
    - [集群](#clusters)
    - [Predis](#predis)
    - [phpredis](#phpredis)
- [与 Redis 交互](#interacting-with-redis)
    - [事务](#transactions)
    - [管道命令](#pipelining-commands)
- [发布 / 订阅](#pubsub)

<a name="introduction"></a>
## 简介

[Redis](https://redis.io) 是一个开源的高级键值存储。它常被称为数据结构服务器，因为键可以包含[字符串](https://redis.io/topics/data-types#strings)、[哈希](https://redis.io/topics/data-types#hashes)、[列表](https://redis.io/topics/data-types#lists)、[集合](https://redis.io/topics/data-types#sets)和[有序集合](https://redis.io/topics/data-types#sorted-sets)。

在 Laravel 中使用 Redis 之前，我们建议你通过 PECL 安装并使用 [phpredis](https://github.com/phpredis/phpredis) PHP 扩展。与"用户态"PHP 包相比，该扩展安装更复杂，但对于大量使用 Redis 的应用可能提供更好的性能。如果你使用 [Laravel Sail](/docs/{{version}}/sail)，此扩展已经安装在你的应用 Docker 容器中。

如果你无法安装 phpredis 扩展，可以通过 Composer 安装 `predis/predis` 包。Predis 是一个完全用 PHP 编写的 Redis 客户端，不需要任何额外扩展：

```shell
composer require predis/predis
```

<a name="configuration"></a>
## 配置

你可以通过 `config/database.php` 配置文件来配置应用的 Redis 设置。在此文件中，你会看到一个 `redis` 数组，包含应用使用的 Redis 服务器：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
    ],

    'cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],

],
```

配置文件中定义的每个 Redis 服务器都需要有名称、主机和端口，除非你定义单个 URL 来表示 Redis 连接：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'url' => 'tcp://127.0.0.1:6379?database=0',
    ],

    'cache' => [
        'url' => 'tls://user:password@127.0.0.1:6380?database=1',
    ],

],
```

<a name="configuring-the-connection-scheme"></a>
#### 配置连接方案

默认情况下，Redis 客户端在连接 Redis 服务器时使用 `tcp` 方案；但你可以通过在 Redis 服务器的配置数组中指定 `scheme` 配置选项来使用 TLS / SSL 加密：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'scheme' => 'tls',
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
    ],

],
```

<a name="clusters"></a>
### 集群

如果你的应用使用 Redis 服务器集群，应该在 Redis 配置的 `clusters` 键中定义这些集群。此配置键默认不存在，因此你需要在应用的 `config/database.php` 配置文件中创建它：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'clusters' => [
        'default' => [
            [
                'host' => env('REDIS_HOST', 'localhost'),
                'password' => env('REDIS_PASSWORD'),
                'port' => env('REDIS_PORT', 6379),
                'database' => 0,
            ],
        ],
    ],

],
```

默认情况下，集群会在节点之间执行客户端分片，允许你池化节点并创建大量可用内存。但客户端分片不处理故障转移；因此，它主要适用于可从另一个主数据存储获取的临时缓存数据。

如果你想使用原生 Redis 集群而非客户端分片，可以通过在应用的 `config/database.php` 配置文件中将 `options.cluster` 配置值设置为 `redis` 来指定：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
    ],

    'clusters' => [
        // ...
    ],

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

除了默认的 `host`、`port`、`database` 和 `password` 服务器配置选项外，Predis 还支持额外的[连接参数](https://github.com/nrk/predis/wiki/Connection-Parameters)，可以为每个 Redis 服务器定义。要使用这些额外配置选项，将它们添加到应用的 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'host' => env('REDIS_HOST', 'localhost'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', 6379),
    'database' => 0,
    'read_write_timeout' => 60,
],
```

<a name="the-redis-facade-alias"></a>
#### Redis Facade 别名

Laravel 的 `config/app.php` 配置文件包含一个 `aliases` 数组，定义框架将注册的所有类别名。默认情况下，不包含 `Redis` 别名，因为它会与 phpredis 扩展提供的 `Redis` 类名冲突。如果你使用 Predis 客户端并希望添加 `Redis` 别名，可以将它添加到应用的 `config/app.php` 配置文件中的 `aliases` 数组：

```php
'aliases' => Facade::defaultAliases()->merge([
    'Redis' => Illuminate\Support\Facades\Redis::class,
])->toArray(),
```

<a name="phpredis"></a>
### phpredis

默认情况下，Laravel 使用 phpredis 扩展与 Redis 通信。Laravel 用于与 Redis 通信的客户端由 `redis.client` 配置选项的值决定，该值通常反映 `REDIS_CLIENT` 环境变量的值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    // 其余 Redis 配置...
],
```

除了默认的 `scheme`、`host`、`port`、`database` 和 `password` 服务器配置选项外，phpredis 还支持以下额外连接参数：`name`、`persistent`、`persistent_id`、`prefix`、`read_timeout`、`retry_interval`、`timeout` 和 `context`。你可以将其中任何选项添加到 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'host' => env('REDIS_HOST', 'localhost'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', 6379),
    'database' => 0,
    'read_timeout' => 60,
    'context' => [
        // 'auth' => ['username', 'secret'],
        // 'stream' => ['verify_peer' => false],
    ],
],
```

<a name="phpredis-serialization"></a>
#### phpredis 序列化与压缩

phpredis 扩展还可以配置使用多种序列化和压缩算法。这些算法可以通过 Redis 配置的 `options` 数组进行配置：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'serializer' => Redis::SERIALIZER_MSGPACK,
        'compression' => Redis::COMPRESSION_LZ4,
    ],

    // 其余 Redis 配置...
],
```

目前支持的序列化算法包括：`Redis::SERIALIZER_NONE`（默认）、`Redis::SERIALIZER_PHP`、`Redis::SERIALIZER_JSON`、`Redis::SERIALIZER_IGBINARY` 和 `Redis::SERIALIZER_MSGPACK`。

支持的压缩算法包括：`Redis::COMPRESSION_NONE`（默认）、`Redis::COMPRESSION_LZF`、`Redis::COMPRESSION_ZSTD` 和 `Redis::COMPRESSION_LZ4`。

<a name="interacting-with-redis"></a>
## 与 Redis 交互

你可以通过调用 `Redis` [Facade](/docs/{{version}}/facades) 上的各种方法来与 Redis 交互。`Redis` Facade 支持动态方法，这意味着你可以在 Facade 上调用任何 [Redis 命令](https://redis.io/commands)，该命令将直接传递给 Redis。在此示例中，我们通过调用 `Redis` Facade 上的 `get` 方法来调用 Redis `GET` 命令：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Redis;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        return view('user.profile', [
            'user' => Redis::get('user:profile:'.$id)
        ]);
    }
}
```

如上所述，你可以在 `Redis` Facade 上调用任何 Redis 命令。Laravel 使用魔术方法将命令传递给 Redis 服务器。如果 Redis 命令需要参数，你应该将这些参数传递给 Facade 的对应方法：

```php
use Illuminate\Support\Facades\Redis;

Redis::set('name', 'Taylor');

$values = Redis::lrange('names', 5, 10);
```

或者，你可以使用 `Redis` Facade 的 `command` 方法将命令传递给服务器，该方法接受命令名作为第一个参数，值数组作为第二个参数：

```php
$values = Redis::command('lrange', ['name', 5, 10]);
```

<a name="using-multiple-redis-connections"></a>
#### 使用多个 Redis 连接

应用的 `config/database.php` 配置文件允许你定义多个 Redis 连接 / 服务器。你可以使用 `Redis` Facade 的 `connection` 方法获取特定 Redis 连接的连接实例：

```php
$redis = Redis::connection('connection-name');
```

要获取默认 Redis 连接的实例，可以不带任何额外参数调用 `connection` 方法：

```php
$redis = Redis::connection();
```

<a name="transactions"></a>
### 事务

`Redis` Facade 的 `transaction` 方法为 Redis 原生的 `MULTI` 和 `EXEC` 命令提供了便捷的封装。`transaction` 方法接受一个闭包作为其唯一参数。该闭包将接收一个 Redis 连接实例，并可以在此实例上发出任何想要的命令。闭包内发出的所有 Redis 命令都将在单个原子事务中执行：

```php
use Illuminate\Support\Facades\Redis;

Redis::transaction(function ($redis) {
    $redis->incr('user_visits', 1);
    $redis->incr('total_visits', 1);
});
```

> **Warning**
> 定义 Redis 事务时，你不能从 Redis 连接中获取任何值。请记住，你的事务作为单个原子操作执行，该操作直到你的整个闭包执行完其命令后才会执行。

#### Lua 脚本

`eval` 方法提供了在单个原子操作中执行多个 Redis 命令的另一种方式。但 `eval` 方法的好处是能够在操作期间与 Redis 键值交互并检查。Redis 脚本使用 [Lua 编程语言](https://www.lua.org)编写。

`eval` 方法乍看可能有点令人生畏，但我们将通过一个基本示例来入门。`eval` 方法需要几个参数。首先，你应该将 Lua 脚本（作为字符串）传递给该方法。其次，你应该传递脚本交互的键数量（作为整数）。第三，你应该传递这些键的名称。最后，你可以传递需要在脚本中访问的任何其他额外参数。

在此示例中，我们将递增一个计数器，检查其新值，如果第一个计数器的值大于 5 则递增第二个计数器。最后，我们返回第一个计数器的值：

```php
$value = Redis::eval(<<<'LUA'
    local counter = redis.call("incr", KEYS[1])

    if counter > 5 then
        redis.call("incr", KEYS[2])
    end

    return counter
LUA, 2, 'first-counter', 'second-counter');
```

> **Warning**
> 请查阅 [Redis 文档](https://redis.io/commands/eval) 以获取有关 Redis 脚本的更多信息。

<a name="pipelining-commands"></a>
### 管道命令

有时你可能需要执行几十个 Redis 命令。你可以使用 `pipeline` 方法，而不是为每个命令都向 Redis 服务器发起一次网络请求。`pipeline` 方法接受一个参数：一个接收 Redis 实例的闭包。你可以向此 Redis 实例发出所有命令，它们将同时发送到 Redis 服务器以减少到服务器的网络往返。命令仍将按发出顺序执行：

```php
use Illuminate\Support\Facades\Redis;

Redis::pipeline(function ($pipe) {
    for ($i = 0; $i < 1000; $i++) {
        $pipe->set("key:$i", $i);
    }
});
```

<a name="pubsub"></a>
## 发布 / 订阅

Laravel 为 Redis 的 `publish` 和 `subscribe` 命令提供了便捷的接口。这些 Redis 命令允许你监听给定"频道"上的消息。你可以从另一个应用甚至使用另一种编程语言向频道发布消息，从而实现应用和进程之间的轻松通信。

首先，让我们使用 `subscribe` 方法设置一个频道监听器。我们将此方法调用放在一个 [Artisan 命令](/docs/{{version}}/artisan)中，因为调用 `subscribe` 方法会启动一个长时间运行的过程：

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
     *
     * @return mixed
     */
    public function handle()
    {
        Redis::subscribe(['test-channel'], function ($message) {
            echo $message;
        });
    }
}
```

现在我们可以使用 `publish` 方法向频道发布消息：

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

使用 `psubscribe` 方法，你可以订阅通配符频道，这对于捕获所有频道上的所有消息很有用。频道名称将作为第二个参数传递给提供的闭包：

```php
Redis::psubscribe(['*'], function ($message, $channel) {
    echo $message;
});

Redis::psubscribe(['users.*'], function ($message, $channel) {
    echo $message;
});
```