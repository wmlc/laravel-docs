# 上下文

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [捕获上下文](#capturing-context)
    - [栈](#stacks)
- [读取上下文](#retrieving-context)
    - [判断数据项是否存在](#determining-item-existence)
- [移除上下文](#removing-context)
- [隐藏上下文](#hidden-context)
- [事件](#events)
    - [脱水（Dehydrating）](#dehydrating)
    - [水合（Hydrated）](#hydrated)

<a name="introduction"></a>
## 简介

Laravel 的「上下文（Context）」功能让你能够在应用内执行的请求、任务和命令中捕获、读取和共享信息。捕获到的信息还会包含在应用写入的日志中，让你更深入地了解日志条目写入之前的代码执行历史，并能在分布式系统中追踪执行流程。

<a name="how-it-works"></a>
### 工作原理

理解 Laravel 上下文功能的最好方式，就是结合内置的日志功能看看它的实际效果。开始使用时，你可以使用 `Context` Facade 向上下文[添加信息](#capturing-context)。在本例中，我们将使用一个[中间件](/docs/{{version}}/middleware)，在每个进入的请求中把请求 URL 和唯一的追踪 ID 添加到上下文：

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
     * 处理进入的请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('url', $request->url());
        Context::add('trace_id', Str::uuid()->toString());

        return $next($request);
    }
}
```

添加到上下文中的信息会自动作为元数据，追加到请求期间写入的所有[日志条目](/docs/{{version}}/logging)中。将上下文作为元数据追加，可以把传递给单个日志条目的信息与通过 `Context` 共享的信息区分开来。例如，假设我们写入以下日志条目：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

写入的日志会包含传递给日志条目的 `auth_id`，同时还会包含上下文的 `url` 和 `trace_id` 元数据：

```text
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文中的信息对分发到队列的任务同样可用。例如，假设我们在向上下文添加一些信息后，将一个 `ProcessPodcast` 任务分发到队列：

```php
// 在我们的中间件中...
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// 在我们的控制器中...
ProcessPodcast::dispatch($podcast);
```

任务被分发时，上下文中当前存储的所有信息都会被捕获并与任务共享。任务执行期间，这些捕获的信息会被「水合」回当前上下文。因此，如果我们的任务 handle 方法要写日志：

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

生成的日志条目将包含最初分发该任务的请求期间添加到上下文中的信息：

```text
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

虽然我们一直聚焦于 Laravel 上下文与内置日志相关的功能，但接下来的文档将展示上下文如何让你跨 HTTP 请求 / 队列任务边界共享信息，以及如何添加不随日志条目写入的[隐藏上下文数据](#hidden-context)。

<a name="capturing-context"></a>
## 捕获上下文

你可以使用 `Context` Facade 的 `add` 方法将信息存储到当前上下文：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

要一次添加多个数据项，可以向 `add` 方法传递一个关联数组：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法会覆盖同键的现有值。如果你只想在键不存在时才向上下文添加信息，可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

Context 还提供了便捷的方法来递增或递减给定的键。这两个方法都至少接受一个参数：要跟踪的键。可以提供第二个参数来指定键递增或递减的幅度：

```php
Context::increment('records_added');
Context::increment('records_added', 5);

Context::decrement('records_added');
Context::decrement('records_added', 5);
```

<a name="conditional-context"></a>
#### 条件上下文

`when` 方法可用于根据给定条件向上下文添加数据。如果给定条件求值为 `true`，将调用传递给 `when` 方法的第一个闭包；如果条件求值为 `false`，则调用第二个闭包：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;

Context::when(
    Auth::user()->isAdmin(),
    fn ($context) => $context->add('permissions', Auth::user()->permissions),
    fn ($context) => $context->add('permissions', []),
);
```

<a name="scoped-context"></a>
#### 作用域上下文

`scope` 方法提供了一种方式，可以在执行给定回调期间临时修改上下文，并在回调执行完毕后将上下文恢复到原始状态。此外，你还可以传递在闭包执行期间应合并到上下文中的额外数据（作为第二个和第三个参数）：

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
> 如果作用域闭包内部修改了上下文中的某个对象，该修改会反映到作用域之外。

<a name="stacks"></a>
### 栈

Context 提供了创建「栈」的能力，栈是按添加顺序存储的数据列表。你可以通过调用 `push` 方法向栈中添加信息：

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

栈对于捕获请求的历史信息非常有用，例如应用中正在发生的各种事件。例如，你可以创建一个事件监听器，每次执行查询时向栈中推入数据，把查询 SQL 和执行时长作为一个元组捕获：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

// 在 AppServiceProvider.php 中...
DB::listen(function ($event) {
    Context::push('queries', [$event->time, $event->sql]);
});
```

你可以使用 `stackContains` 和 `hiddenStackContains` 方法判断某个值是否在栈中：

```php
if (Context::stackContains('breadcrumbs', 'first_value')) {
    //
}

if (Context::hiddenStackContains('secrets', 'first_value')) {
    //
}
```

`stackContains` 和 `hiddenStackContains` 方法还接受闭包作为第二个参数，从而对值比较操作进行更精细的控制：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;

return Context::stackContains('breadcrumbs', function ($value) {
    return Str::startsWith($value, 'query_');
});
```

<a name="retrieving-context"></a>
## 读取上下文

你可以使用 `Context` Facade 的 `get` 方法从上下文中读取信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

`only` 和 `except` 方法可用于读取上下文信息的一个子集：

```php
$data = Context::only(['first_key', 'second_key']);

$data = Context::except(['first_key']);
```

`pull` 方法可用于从上下文中读取信息，并立即将其从上下文中移除：

```php
$value = Context::pull('key');
```

如果上下文数据存储在[栈](#stacks)中，你可以使用 `pop` 方法从栈中弹出数据项：

```php
Context::push('breadcrumbs', 'first_value', 'second_value');

Context::pop('breadcrumbs');
// second_value

Context::get('breadcrumbs');
// ['first_value']
```

`remember` 和 `rememberHidden` 方法可用于从上下文中读取信息，如果请求的信息不存在，则将上下文值设置为给定闭包返回的值：

```php
$permissions = Context::remember(
    'user-permissions',
    fn () => $user->permissions,
);
```

如果想读取上下文中存储的所有信息，可以调用 `all` 方法：

```php
$data = Context::all();
```

<a name="determining-item-existence"></a>
### 判断数据项是否存在

你可以使用 `has` 和 `missing` 方法判断上下文中是否为给定键存储了值：

```php
use Illuminate\Support\Facades\Context;

if (Context::has('key')) {
    // ...
}

if (Context::missing('key')) {
    // ...
}
```

无论存储的值是什么，`has` 方法都会返回 `true`。因此，例如值为 `null` 的键也会被视为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

<a name="removing-context"></a>
## 移除上下文

`forget` 方法可用于从当前上下文中移除一个键及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

你可以向 `forget` 方法传递一个数组，一次移除多个键：

```php
Context::forget(['first_key', 'second_key']);
```

<a name="hidden-context"></a>
## 隐藏上下文

Context 提供了存储「隐藏」数据的能力。这些隐藏信息不会追加到日志中，也无法通过上文介绍的读取方法访问。Context 提供了一组不同的方法来操作隐藏的上下文信息：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

这些「隐藏」方法与上文介绍的非隐藏方法功能一一对应：

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

<a name="events"></a>
## 事件

Context 会派发两个事件，允许你挂载到上下文的水合与脱水过程中。

为了说明这些事件的用法，假设你在应用的一个中间件中，根据进入的 HTTP 请求的 `Accept-Language` 头来设置 `app.locale` 配置值。Context 的事件允许你在请求期间捕获该值，并在队列中恢复它，从而确保在队列上发送的通知具有正确的 `app.locale` 值。我们可以结合 Context 的事件和[隐藏](#hidden-context)数据来实现，下面将予以说明。

<a name="dehydrating"></a>
### 脱水

每当任务被分发到队列时，上下文中的数据都会被「脱水」，并随任务负载一起捕获。`Context::dehydrating` 方法允许你注册一个在脱水过程中调用的闭包。在这个闭包中，你可以修改将与队列任务共享的数据。

通常，你应该在应用 `AppServiceProvider` 类的 `boot` 方法中注册 `dehydrating` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Context::dehydrating(function (Repository $context) {
        $context->addHidden('locale', Config::get('app.locale'));
    });
}
```

> [!NOTE]
> 你不应在 `dehydrating` 回调中使用 `Context` Facade，因为这会改变当前进程的上下文。请确保只修改传递给回调的仓库实例。

<a name="hydrated"></a>
### 水合

每当队列任务开始在队列上执行时，与该任务共享的所有上下文都会被「水合」回当前上下文。`Context::hydrated` 方法允许你注册一个在水合过程中调用的闭包。

通常，你应该在应用 `AppServiceProvider` 类的 `boot` 方法中注册 `hydrated` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任意应用服务。
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
> 你不应在 `hydrated` 回调中使用 `Context` Facade，而应确保只修改传递给回调的仓库实例。
