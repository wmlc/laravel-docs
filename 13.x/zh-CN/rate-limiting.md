# 速率限制

## 简介

Laravel 内置了一个易于使用的速率限制抽象层，它与应用的 [缓存](cache) 配合，提供了一种在指定时间窗口内限制任意操作的简便方式。

> [!NOTE]
> 如果你希望对传入的 HTTP 请求进行速率限制，请查阅[速率限制中间件文档](/topic/Laravel%2013.x/dgy7xg5vw2.html)。

### 缓存配置

通常，速率限制器会使用应用的默认缓存，该缓存由应用 `cache` 配置文件中的 `default` 键定义。不过，你可以通过在应用 `cache` 配置文件中定义 `limiter` 键来指定速率限制器应当使用的缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis', // [tl! add]
```

## 基本用法

`Illuminate\Support\Facades\RateLimiter` Facade 可用于与速率限制器交互。速率限制器提供的最简单方法是 `attempt` 方法，它会对给定的回调在指定的秒数内进行速率限制。

当回调已无剩余可用次数时，`attempt` 方法返回 `false`；否则，`attempt` 方法会返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是一个速率限制器"键"，它可以是你选择的、表示被限制操作的任意字符串：

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

如有需要，你可以向 `attempt` 方法提供第四个参数，即"衰减速率"，也就是剩余可用次数被重置前的秒数。例如，我们可以修改上面的示例，允许每两分钟 5 次：

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

### 手动增加次数

如果你想手动与速率限制器交互，还有其他多种方法可用。例如，你可以调用 `tooManyAttempts` 方法来判断某个给定的速率限制器键是否已超出每分钟允许的最大次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return 'Too many attempts!';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息……
```

当对可能收到大量并发请求的端点进行速率限制时，你可能希望检查 `increment` 方法返回的值，而不是将 `tooManyAttempts` 和 `increment` 作为独立操作使用。在使用 `redis`、`memcached` 或 `database` 缓存存储时，该值是原子递增的，确保每个并发请求都获得一个唯一的计数：

```php
use Illuminate\Support\Facades\RateLimiter;

$perMinute = 5;

if (RateLimiter::increment('send-message:'.$user->id) > $perMinute) {
    return 'Too many attempts!';
}

// 发送消息……
```

此外，你可以使用 `remaining` 方法获取某个给定键剩余的可用次数。如果某个给定键还有剩余重试次数，你可以调用 `increment` 方法来增加总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // 发送消息……
}
```

如果你想将某个给定速率限制器键的值一次增加多于 1，可以向 `increment` 方法提供期望的数量：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

#### 判断限制器可用性

当一个键没有剩余次数时，`availableIn` 方法返回距离可用次数恢复所需的剩余秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return 'You may try again in '.$seconds.' seconds.';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息……
```

### 清除次数

你可以使用 `clear` 方法重置某个给定速率限制器键的尝试次数。例如，当接收方读取某条给定消息时，你可以重置其尝试次数：

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
