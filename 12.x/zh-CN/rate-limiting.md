# 速率限制

- [简介](#introduction)
    - [缓存配置](#cache-configuration)
- [基本用法](#basic-usage)
    - [手动增加尝试次数](#manually-incrementing-attempts)
    - [清除尝试次数](#clearing-attempts)

<a name="introduction"></a>
## 简介

Laravel 提供了一个简单易用的速率限制抽象层，它与应用的[缓存](cache)配合，为在指定时间窗口内限制任意操作提供了一种便捷方式。

> [!NOTE]
> 如果你想对传入的 HTTP 请求进行速率限制，请参阅[速率限制器中间件文档](/docs/{{version}}/routing#rate-limiting)。

<a name="cache-configuration"></a>
### 缓存配置

通常，速率限制器会使用应用的 `cache` 配置文件中 `default` 键所定义的默认应用缓存。不过，你也可以在应用的 `cache` 配置文件中定义 `limiter` 键，以指定速率限制器使用的缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis', // [tl! add]
```

<a name="basic-usage"></a>
## 基本用法

可以使用 `Illuminate\Support\Facades\RateLimiter` Facade 与速率限制器交互。速率限制器提供的最简单的方法是 `attempt` 方法，它会在给定的秒数内对给定的回调执行速率限制。

当回调没有剩余可用尝试次数时，`attempt` 方法返回 `false`；否则，`attempt` 方法会返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是速率限制器的「键」，它可以是任意字符串，用来表示被速率限制的操作：

```php
use Illuminate\Support\Facades\RateLimiter;

$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perMinute = 5,
    function() {
        // 发送消息...
    }
);

if (! $executed) {
    return 'Too many messages sent!';
}
```

如有需要，你可以为 `attempt` 方法提供第四个参数，即「衰减速率」（decay rate），也就是可用尝试次数重置前的秒数。例如，我们可以修改上面的示例，改为每两分钟允许五次尝试：

```php
$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perTwoMinutes = 5,
    function() {
        // 发送消息...
    },
    $decayRate = 120,
);
```

<a name="manually-incrementing-attempts"></a>
### 手动增加尝试次数

如果你想手动与速率限制器交互，还有许多其他方法可用。例如，可以调用 `tooManyAttempts` 方法来判断某个速率限制器键是否已超出每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return 'Too many attempts!';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

或者，你也可以使用 `remaining` 方法获取指定键的剩余尝试次数。如果指定的键还有剩余的重试机会，就可以调用 `increment` 方法增加总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // 发送消息...
}
```

如果想将某个速率限制器键的数值一次增加多个，可以向 `increment` 方法传入希望增加的数量：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

<a name="determining-limiter-availability"></a>
#### 判断限制器可用时间

当某个键的尝试次数用尽时，`availableIn` 方法会返回距离再次获得可用尝试次数的剩余秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return 'You may try again in '.$seconds.' seconds.';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

<a name="clearing-attempts"></a>
### 清除尝试次数

你可以使用 `clear` 方法重置某个速率限制器键的尝试次数。例如，当某条消息被接收方读取时，你可以重置对应的尝试次数：

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
