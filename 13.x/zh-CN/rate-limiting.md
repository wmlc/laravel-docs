# 速率限制

- [简介](#introduction)
    - [缓存配置](#cache-configuration)
- [基本用法](#basic-usage)
    - [手动递增尝试次数](#manually-incrementing-attempts)
    - [清除尝试次数](#clearing-attempts)

<a name="introduction"></a>
## 简介

Laravel 内置了一个易于使用的速率限制抽象层，与应用的[缓存](cache)结合后，可以轻松地在指定时间窗口内限制任何操作。

> [!NOTE]
> 如果你关心的是对传入 HTTP 请求进行速率限制，请查阅[速率限制中间件文档](/docs/{{version}}/routing#rate-limiting)。

<a name="cache-configuration"></a>
### 缓存配置

通常，速率限制器使用应用的默认缓存，即由应用 `cache` 配置文件中的 `default` 键指定。不过，你可以通过在 `cache` 配置文件中定义 `limiter` 键，来指定速率限制器应使用的缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis', // [tl! add]
```

<a name="basic-usage"></a>
## 基本用法

`Illuminate\Support\Facades\RateLimiter` Facade 可用于与速率限制器交互。速率限制器提供的最简单方法是 `attempt` 方法，它在指定的秒数内对给定回调进行速率限制。

当回调没有剩余可用尝试次数时，`attempt` 方法返回 `false`；否则，`attempt` 方法将返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是速率限制器"键"，它可以是任意字符串，代表正在被速率限制的操作：

```php
use Illuminate\Support\Facades\RateLimiter;

$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perMinute = 5,
    function() {
        // Send message...
    }
);

if (! $executed) {
    return 'Too many messages sent!';
}
```

如有必要，你可以为 `attempt` 方法提供第四个参数，即"衰减速率"，也就是可用尝试次数重置前等待的秒数。例如，我们可以修改上面的示例，使其每两分钟允许五次尝试：

```php
$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perTwoMinutes = 5,
    function() {
        // Send message...
    },
    $decayRate = 120,
);
```

<a name="manually-incrementing-attempts"></a>
### 手动递增尝试次数

如果你想手动与速率限制器交互，还可以使用其他各种方法。例如，你可以调用 `tooManyAttempts` 方法，判断给定速率限制器键是否已超过每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return 'Too many attempts!';
}

RateLimiter::increment('send-message:'.$user->id);

// Send message...
```

当对可能接收大量并发请求的端点进行速率限制时，你可能会希望检查 `increment` 方法返回的值，而不是将 `tooManyAttempts` 与 `increment` 作为两个独立操作使用。当使用 `redis`、`memcached` 或 `database` 缓存存储时，该值是原子递增的，确保每个并发请求都能获得唯一的计数：

```php
use Illuminate\Support\Facades\RateLimiter;

$perMinute = 5;

if (RateLimiter::increment('send-message:'.$user->id) > $perMinute) {
    return 'Too many attempts!';
}

// Send message...
```

另外，你可以使用 `remaining` 方法检索给定键的剩余尝试次数。如果给定键还有剩余重试次数，你可以调用 `increment` 方法递增总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // Send message...
}
```

如果你想将给定速率限制器键的值递增超过 1，可以向 `increment` 方法提供所需的数量：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

<a name="determining-limiter-availability"></a>
#### 判断限制器何时可用

当某个键不再有剩余尝试次数时，`availableIn` 方法会返回距更多尝试可用的剩余秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return 'You may try again in '.$seconds.' seconds.';
}

RateLimiter::increment('send-message:'.$user->id);

// Send message...
```

<a name="clearing-attempts"></a>
### 清除尝试次数

你可以使用 `clear` 方法重置给定速率限制器键的尝试次数。例如，当收件人阅读了给定消息时，你可以重置尝试次数：

```php
use App\Models\Message;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Mark the message as read.
 */
public function read(Message $message): Message
{
    $message->markAsRead();

    RateLimiter::clear('send-message:'.$message->user_id);

    return $message;
}
```
