# 速率限制

- [简介](#introduction)
    - [缓存配置](#cache-configuration)
- [基本用法](#basic-usage)
    - [手动递增尝试次数](#manually-incrementing-attempts)
    - [清除尝试次数](#clearing-attempts)

<a name="introduction"></a>
## 简介

Laravel 内置了一套简单易用的速率限制抽象，它与应用的[缓存](cache)配合，为你提供了一种在指定时间窗口内限制任何操作的方法。

> [!NOTE]
> 如果你想对进入的 HTTP 请求做速率限制，请查阅[速率限制中间件文档](/docs/{{version}}/routing#rate-limiting)。

<a name="cache-configuration"></a>
### 缓存配置

通常情况下，速率限制器会使用应用 `cache` 配置文件中 `default` 键所指定的默认缓存。不过，你也可以在应用的 `cache` 配置文件中定义 `limiter` 键，指定速率限制器要使用的缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis',
```

<a name="basic-usage"></a>
## 基本用法

`Illuminate\Support\Facades\RateLimiter` Facade 可用于与速率限制器交互。速率限制器提供的最简单方法是 `attempt` 方法，它可以在给定的秒数内对某个回调进行速率限制。

当回调已无可用尝试次数时，`attempt` 方法返回 `false`；否则它会返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是速率限制器的"键"，它可以是任意字符串，用来表示被限速的操作：

```php
use Illuminate\Support\Facades\RateLimiter;

$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perMinute = 5,
    function() {
        // 发送消息……
    }
);

if (! $executed) {
  return 'Too many messages sent!';
}
```

如有必要，你可以给 `attempt` 方法提供第四个参数，也就是"衰减速率"，即距离可用尝试次数重置还有多少秒。例如，我们可以把上面的例子改为每两分钟允许五次尝试：

```php
$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perTwoMinutes = 5,
    function() {
        // 发送消息……
    },
    $decayRate = 120,
);
```

<a name="manually-incrementing-attempts"></a>
### 手动递增尝试次数

如果你想手动与速率限制器交互，速率限制器还提供了其他多种方法。例如，你可以调用 `tooManyAttempts` 方法判断某个速率限制器键是否已超过每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return 'Too many attempts!';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息……
```

或者，你可以使用 `remaining` 方法获取某个键剩余的尝试次数。如果某个键还有可用重试次数，你可以调用 `increment` 方法递增总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // 发送消息……
}
```

如果你想把某个速率限制器键的值递增超过 1，可以给 `increment` 方法提供想要的项目：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

<a name="determining-limiter-availability"></a>
#### 判断限制器可用状态

当某个键的尝试次数已经用完时，`availableIn` 方法会返回距离下一次可用尝试次数还需等待的秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return 'You may try again in '.$seconds.' seconds.';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息……
```

<a name="clearing-attempts"></a>
### 清除尝试次数

你可以用 `clear` 方法重置某个速率限制器键的尝试次数。例如，可以在某条消息被接收方读取时重置尝试次数：

```php
use App\Models\Message;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 将消息标记为已读。
 */
public function read(Message $message): Message
{
    $message->markAsRead();

    RateLimiter::clear('send-message:'.$message->user_id);

    return $message;
}
```