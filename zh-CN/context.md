# 上下文

## 简介

Laravel 的「上下文（context）」能力使你能在请求、任务和命令的执行过程中捕获、检索并共享信息。这些被捕获的信息也会被附加到应用写入的日志中，让你更深入地洞察某条日志写入前周围的代码执行历史，并让你能够追踪分布式系统中的执行流程。

### 工作原理

理解 Laravel 上下文能力的最佳方式是结合内置的日志功能进行实战。可以使用 `Context` 门面的 [`add` 方法](#capturing-context) 向上下文添加信息。下面的示例中，我们用一个 [中间件](/docs/{{version}}/middleware) 在每次请求进入时，把请求 URL 和一个唯一的 trace ID 加入上下文：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AddContext
{
    /**
     * 处理传入请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('url', $request->url());
        Context::add('trace_id', Str::uuid()->toString());

        return $next($request);
    }
}
```

添加到上下文的信息会自动作为元数据追加到本次请求期间写入的任何 [日志条目](/docs/{{version}}/logging) 中。把上下文作为元数据追加，可以让传入单条日志条目的信息与通过 `Context` 共享的信息区分开。例如，假设我们写入下面这条日志：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

写入的日志会包含传给日志条目的 `auth_id`，同时也会包含上下文中的 `url` 与 `trace_id` 作为元数据：

```text
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文的信息对分发到队列的任务同样可用。例如，假设我们在向上下文添加一些信息后，把一个 `ProcessPodcast` 任务分发到队列：

```php
// 在我们中间件中……
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// 在控制器中……
ProcessPodcast::dispatch($podcast);
```

任务被分发时，当前存储在上下文中的任何信息都会被捕获并与任务一起共享。这些信息在任务执行过程中会被重新水合回当前上下文。因此，如果任务中的 handle 方法写入如下日志：

```php
class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    // ...

    /**
     * 执行任务。
     */
    public function handle(): void
    {
        Log::info('Processing podcast.', [
            'podcast_id' => $this->podcast->id,
        ]);

        // ...
    }
}
```

最终日志条目将包含在最初分发任务的请求期间被添加到上下文中的信息：

```text
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

虽然上文重点介绍了 Laravel context 与内置日志相关的特性，下面的文档将进一步展示 context 如何让你在 HTTP 请求 / 队列任务的边界之间共享信息，甚至如何添加不会随日志条目写入的 [隐藏上下文数据](#hidden-context)。

## 捕获上下文

可以使用 `Context` 门面的 `add` 方法把信息存储到当前上下文中：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

要一次添加多个项，可以向 `add` 方法传入一个关联数组：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法会覆盖同名 key 已存在的值。如果你只希望在 key 不存在时向上下文添加信息，可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

上下文还提供了便捷的方法对指定的 key 进行递增或递减。这两个方法至少接收一个参数：要追踪的 key。还可以提供第二个参数指定递增或递减的步长：

```php
Context::increment('records_added');
Context::increment('records_added', 5);

Context::decrement('records_added');
Context::decrement('records_added', 5);
```

#### 条件上下文

`when` 方法可以根据指定条件向上下文添加数据。当条件求值为 `true` 时，`when` 接收的第一个闭包会被调用；条件求值为 `false` 时则调用第二个闭包：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;

Context::when(
    Auth::user()->isAdmin(),
    fn ($context) => $context->add('permissions', Auth::user()->permissions),
    fn ($context) => $context->add('permissions', []),
);
```

#### 作用域上下文

`scope` 方法提供一种方式：在一个回调执行期间临时修改上下文，并在回调执行完毕后把上下文恢复到原状态。此外，还可以在闭包执行期间传入需要合并到上下文的额外数据（作为第二和第三个参数）。

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;

Context::add('trace_id', 'abc-999');
Context::addHidden('user_id', 123);

Context::scope(
    function () {
        Context::add('action', 'adding_friend');

        $userId = Context::getHidden('user_id');

        Log::debug("Adding user [{$userId}] to friends list.");
        // Adding user [987] to friends list.  {"trace_id":"abc-999","user_name":"taylor_otwell","action":"adding_friend"}
    },
    data: ['user_name' => 'taylor_otwell'],
    hidden: ['user_id' => 987],
);

Context::all();
// [
//     'trace_id' => 'abc-999',
// ]

Context::allHidden();
// [
//     'user_id' => 123,
// ]
```

> [!WARNING]
> 如果在作用域闭包内对上下文中的某个对象进行了修改，那么这一变更会反映到作用域之外。

### 栈（Stacks）

上下文还支持创建「栈（stacks）」，即按添加顺序存储的列表数据。可以通过调用 `push` 方法向栈添加信息：

```php
use Illuminate\Support\Facades\Context;

Context::push('breadcrumbs', 'first_value');

Context::push('breadcrumbs', 'second_value', 'third_value');

Context::get('breadcrumbs');
// [
//     'first_value',
//     'second_value',
//     'third_value',
// ]
```

栈非常适合捕获请求的历史信息，例如应用中发生的各种事件。比如可以创建一个事件监听器，每次执行查询时都向栈中推入一项，把查询 SQL 与耗时作为元组记录下来：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

// 在 AppServiceProvider.php 中……
DB::listen(function ($event) {
    Context::push('queries', [$event->time, $event->sql]);
});
```

可以使用 `stackContains` 与 `hiddenStackContains` 方法判断某个值是否在栈中：

```php
if (Context::stackContains('breadcrumbs', 'first_value')) {
    //
}

if (Context::hiddenStackContains('secrets', 'first_value')) {
    //
}
```

`stackContains` 与 `hiddenStackContains` 方法的第二个参数也可以是一个闭包，从而更精细地控制值的比较方式：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;

return Context::stackContains('breadcrumbs', function ($value) {
    return Str::startsWith($value, 'query_');
});
```

## 读取上下文

可以使用 `Context` 门面的 `get` 方法从上下文中读取信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

`only` 与 `except` 方法可用于读取上下文中信息的一个子集：

```php
$data = Context::only(['first_key', 'second_key']);

$data = Context::except(['first_key']);
```

`pull` 方法可以读取上下文中的信息，并立即将它从上下文中移除：

```php
$value = Context::pull('key');
```

如果上下文数据存储在一个 [栈](#stacks) 中，可以使用 `pop` 方法从栈中弹出项：

```php
Context::push('breadcrumbs', 'first_value', 'second_value');

Context::pop('breadcrumbs');
// second_value

Context::get('breadcrumbs');
// ['first_value']
```

`remember` 与 `rememberHidden` 方法可用于在读取信息时，如果请求的信息不存在就把该 key 的值设为闭包返回的值：

```php
$permissions = Context::remember(
    'user-permissions',
    fn () => $user->permissions,
);
```

如果希望读取存储在上下文中的所有信息，可以调用 `all` 方法：

```php
$data = Context::all();
```

### 判断项是否存在

可以使用 `has` 与 `missing` 方法判断上下文中是否存在某个 key 对应的值：

```php
use Illuminate\Support\Facades\Context;

if (Context::has('key')) {
    // ...
}

if (Context::missing('key')) {
    // ...
}
```

`has` 方法无论存储的值是什么都会返回 `true`。因此，例如，值为 `null` 的 key 也会被视为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

## 移除上下文

`forget` 方法可用于移除当前上下文中某个 key 及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

也可以通过向 `forget` 方法传入数组，一次性忘记多个 key：

```php
Context::forget(['first_key', 'second_key']);
```

## 隐藏上下文

上下文还支持存储「隐藏」数据。这类隐藏信息不会附加到日志中，也无法通过上文介绍的数据读取方法访问。上下文提供了一组专门的方法用于操作隐藏的上下文信息：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

这些「hidden」方法是上文非隐藏方法的对应版本：

```php
Context::addHidden(/* ... */);
Context::addHiddenIf(/* ... */);
Context::pushHidden(/* ... */);
Context::getHidden(/* ... */);
Context::pullHidden(/* ... */);
Context::popHidden(/* ... */);
Context::onlyHidden(/* ... */);
Context::exceptHidden(/* ... */);
Context::allHidden(/* ... */);
Context::hasHidden(/* ... */);
Context::missingHidden(/* ... */);
Context::forgetHidden(/* ... */);
```

## 事件

上下文会派发两个事件，允许你挂接 context 的水合与脱水过程。

为了说明这些事件的用途，假设你在应用的某个中间件中根据传入 HTTP 请求的 `Accept-Language` 头来设置 `app.locale` 配置项。Context 的事件允许你在请求期间捕获这个值，并在队列中恢复它，从而确保队列上发送的通知具备正确的 `app.locale` 值。我们可以利用 context 的事件与 [隐藏](#hidden-context) 数据实现这一点，下面的文档将进行演示。

### 脱水（Dehydrating）

每当任务被分发到队列时，上下文中的数据都会被「脱水」，并随任务 payload 一起被捕获。`Context::dehydrating` 方法允许你注册一个在脱水过程中被调用的闭包。在该闭包内，可以对将共享给队列任务的数据进行修改。

通常应在应用的 `AppServiceProvider` 的 `boot` 方法中注册 `dehydrating` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导应用服务。
 */
public function boot(): void
{
    Context::dehydrating(function (Repository $context) {
        $context->addHidden('locale', Config::get('app.locale'));
    });
}
```

> [!NOTE]
> 不要在 `dehydrating` 回调中使用 `Context` 门面——那会改变当前进程的上下文。请只修改传给回调的 repository。

### 水合（Hydrated）

每当队列任务开始在队列上执行时，随任务共享的上下文都会被「水合」回当前上下文。`Context::hydrated` 方法允许你注册一个在水合过程中被调用的闭包。

通常应在应用的 `AppServiceProvider` 的 `boot` 方法中注册 `hydrated` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导应用服务。
 */
public function boot(): void
{
    Context::hydrated(function (Repository $context) {
        if ($context->hasHidden('locale')) {
            Config::set('app.locale', $context->getHidden('locale'));
        }
    });
}
```

> [!NOTE]
> 不要在 `hydrated` 回调中使用 `Context` 门面，请只修改传给回调的 repository。
