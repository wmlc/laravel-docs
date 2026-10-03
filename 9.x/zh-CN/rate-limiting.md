# 速率限制

- [简介](#introduction)
    - [缓存配置](#cache-configuration)
- [基本用法](#basic-usage)
    - [手动递增尝试次数](#manually-incrementing-attempts)
    - [清除尝试次数](#clearing-attempts)

<a name="introduction"></a>
## 简介

Laravel 提供了一个简单易用的速率限制抽象，结合应用程序的[缓存](cache)，可以轻松地在指定时间窗口内限制任何操作。

> **Note**  
> 如果你想对传入的 HTTP 请求进行速率限制，请查阅[速率限制器中间件文档](routing#rate-limiting)。

<a name="cache-configuration"></a>
### 缓存配置

通常，速率限制器使用应用程序的默认缓存，该缓存由应用程序的 `cache` 配置文件中的 `default` 键定义。但是，你可以通过在应用程序的 `cache` 配置文件中定义 `limiter` 键来指定速率限制器使用的缓存驱动：

```php
'default' => 'memcached',

'limiter' => 'redis',
```

<a name="basic-usage"></a>
## 基本用法

可以使用 `Illuminate\Support\Facades\RateLimiter` Facade 与速率限制器交互。速率限制器提供的最简单方法是 `attempt` 方法，它可以在给定秒数内对回调进行速率限制。

当回调没有剩余尝试次数时，`attempt` 方法返回 `false`；否则，`attempt` 方法将返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是速率限制器"键"，它可以是任意字符串，用于表示被速率限制的操作：

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

<a name="manually-incrementing-attempts"></a>
### 手动递增尝试次数

如果你想手动与速率限制器交互，还有多种其他方法可用。例如，你可以调用 `tooManyAttempts` 方法来判断给定的速率限制器键是否已超过每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return 'Too many attempts!';
}
```

或者，你可以使用 `remaining` 方法获取给定键的剩余尝试次数。如果给定键还有剩余重试次数，你可以调用 `hit` 方法来递增总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::hit('send-message:'.$user->id);

    // 发送消息...
}
```

<a name="determining-limiter-availability"></a>
#### 确定限制器可用性

当键没有剩余尝试次数时，`availableIn` 方法返回直到有更多尝试次数可用前剩余的秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return 'You may try again in '.$seconds.' seconds.';
}
```

<a name="clearing-attempts"></a>
### 清除尝试次数

可以使用 `clear` 方法重置给定速率限制器键的尝试次数。例如，你可以在接收者阅读给定消息时重置尝试次数：

```php
use App\Models\Message;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 将消息标记为已读。
 *
 * @param  \App\Models\Message  $message
 * @return \App\Models\Message
 */
public function read(Message $message)
{
    $message->markAsRead();

    RateLimiter::clear('send-message:'.$message->user_id);

    return $message;
}
```