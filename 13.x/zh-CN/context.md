# Context

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [捕获上下文](#capturing-context)
    - [栈](#stacks)
- [检索上下文](#retrieving-context)
    - [判断项是否存在](#determining-item-existence)
- [删除上下文](#removing-context)
- [隐藏的上下文](#hidden-context)
- [事件](#events)
    - [脱水](#dehydrating)
    - [水合](#hydrated)

<a name="introduction"></a>
## 简介

Laravel 的“Context”能力使你可以在应用程序内执行的请求、任务和命令中捕获、检索和共享信息。这些被捕获的信息也会包含在应用程序写入的日志中，让你更深入地了解在写入日志条目之前所发生的周边代码执行历史，并允许你在分布式系统中追踪执行流程。

<a name="how-it-works"></a>
### 工作原理

理解 Laravel 的 Context 能力的最佳方式是通过内置的日志功能来观察它的实际运作。开始前，你可以使用 `Context` Facade [将信息添加到上下文中](#capturing-context)。在此示例中，我们将使用一个 [中间件](/docs/{{version}}/middleware)，在每次传入请求时向上下文添加请求 URL 和一个唯一的 trace ID：

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
     * 处理传入的请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('url', $request->url());
        Context::add('trace_id', Str::uuid()->toString());

        return $next($request);
    }
}
```

添加到上下文中的信息会自动作为元数据附加到整个请求期间写入的任何 [日志条目](/docs/{{version}}/logging) 上。将上下文作为元数据附加，可以将传递给单个日志条目的信息与通过 `Context` 共享的信息区分开来。例如，假设我们写入以下日志条目：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

写入的日志将包含传递给日志条目的 `auth_id`，同时还会包含上下文的 `url` 和 `trace_id` 作为元数据：

```text
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文中的信息也会对派发到队列的任务可用。例如，假设我们在向上下文添加了一些信息之后，将 `ProcessPodcast` 任务派发到队列：

```php
// 在我们的中间件中……
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// 在我们的控制器中……
ProcessPodcast::dispatch($podcast);
```

当任务被派发时，当前存储在上下文中的任何信息都会被捕获并与任务共享。然后，这些被捕获的信息会在任务执行期间被重新填充回当前上下文。因此，如果我们的任务的 handle 方法要写入日志：

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

生成的日志条目将包含在最初派发该任务的请求期间添加到上下文中的信息：

```text
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

尽管我们一直聚焦于 Laravel Context 的内置日志相关功能，但接下来的文档将说明上下文如何让你在 HTTP 请求 / 队列任务的边界之间共享信息，甚至如何添加不会随日志条目一起写入的 [隐藏上下文数据](#hidden-context)。

<a name="capturing-context"></a>
## 捕获上下文

你可以使用 `Context` Facade 的 `add` 方法将信息存储到当前上下文中：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

要一次性添加多个条目，你可以向 `add` 方法传递一个关联数组：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法会覆盖任何共享相同键的已有值。如果你只希望在键尚不存在时才向上下文添加信息，可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

Context 还提供了用于递增或递减给定键的便捷方法。这两个方法都至少接受一个参数：要跟踪的键。可以提供第二个参数来指定该键应被递增或递减的数量：

```php
Context::increment('records_added');
Context::increment('records_added', 5);

Context::decrement('records_added');
Context::decrement('records_added', 5);
```

<a name="conditional-context"></a>
#### 条件上下文

`when` 方法可用于根据给定的条件向上下文添加数据。提供给 `when` 方法的第一个闭包会在给定条件求值为 `true` 时被调用，而第二个闭包会在条件求值为 `false` 时被调用：

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

`scope` 方法提供了一种方式，可以在给定回调执行期间临时修改上下文，并在回调执行完毕时将上下文恢复到原始状态。此外，你可以传递应当在闭包执行期间合并到上下文中的额外数据（作为第二个和第三个参数）。

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
> 如果上下文中的对象在作用域闭包内部被修改，该变更将反映到作用域之外。

<a name="stacks"></a>
### 栈

Context 提供了创建“栈（stack）”的能力，栈是按添加顺序存储的数据列表。你可以通过调用 `push` 方法向栈添加信息：

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

栈可用于捕获关于请求的历史信息，例如你的应用程序中正在发生的事件。例如，你可以创建一个事件监听器，在每次执行查询时向栈推送数据，将查询的 SQL 和耗时作为一个元组捕获：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

// 在 AppServiceProvider.php 中……
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

`stackContains` 和 `hiddenStackContains` 方法也接受一个闭包作为第二个参数，从而可以更多地控制值比较操作：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;

return Context::stackContains('breadcrumbs', function ($value) {
    return Str::startsWith($value, 'query_');
});
```

<a name="retrieving-context"></a>
## 检索上下文

你可以使用 `Context` Facade 的 `get` 方法从上下文中检索信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

`only` 和 `except` 方法可用于检索上下文中信息的子集：

```php
$data = Context::only(['first_key', 'second_key']);

$data = Context::except(['first_key']);
```

`pull` 方法可用于从上下文中检索信息并立即将其从上下文中移除：

```php
$value = Context::pull('key');
```

如果上下文数据存储在 [栈](#stacks) 中，你可以使用 `pop` 方法从栈中弹出条目：

```php
Context::push('breadcrumbs', 'first_value', 'second_value');

Context::pop('breadcrumbs');
// second_value

Context::get('breadcrumbs');
// ['first_value']
```

`remember` 和 `rememberHidden` 方法可用于从上下文中检索信息，同时如果所请求的信息不存在，则将上下文的值设置为给定闭包返回的值：

```php
$permissions = Context::remember(
    'user-permissions',
    fn () => $user->permissions,
);
```

如果你希望检索存储在上下文中的所有信息，可以调用 `all` 方法：

```php
$data = Context::all();
```

<a name="determining-item-existence"></a>
### 判断项是否存在

你可以使用 `has` 和 `missing` 方法判断上下文是否为给定键存储了任何值：

```php
use Illuminate\Support\Facades\Context;

if (Context::has('key')) {
    // ...
}

if (Context::missing('key')) {
    // ...
}
```

无论存储的值是什么，`has` 方法都会返回 `true`。因此，例如，一个值为 `null` 的键将被视为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

<a name="removing-context"></a>
## 删除上下文

`forget` 方法可用于从当前上下文中移除一个键及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

你可以通过向 `forget` 方法提供数组来一次性移除多个键：

```php
Context::forget(['first_key', 'second_key']);
```

<a name="hidden-context"></a>
## 隐藏的上下文

Context 提供了存储“隐藏”数据的能力。这些隐藏信息不会附加到日志中，也无法通过上述数据检索方法访问。Context 提供了一组不同的方法来与隐藏上下文信息交互：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

这些“隐藏”方法镜像了上文所述非隐藏方法的功能：

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

Context 派发两个事件，让你可以钩入上下文的填充（hydration）与脱水（dehydration）过程。

为了说明这些事件可能如何使用，想象一下，在你的应用程序的某个中间件中，你根据传入 HTTP 请求的 `Accept-Language` 头部设置了 `app.locale` 配置值。Context 的事件允许你在请求期间捕获该值，并在队列上恢复它，确保队列上发送的通知具有正确的 `app.locale` 值。我们可以使用 Context 的事件和 [隐藏](#hidden-context) 数据来实现这一点，接下来的文档将加以说明。

<a name="dehydrating"></a>
### 脱水

每当一个任务被派发到队列时，上下文中的数据都会被“脱水（dehydrated）”并与任务的负载一起被捕获。`Context::dehydrating` 方法允许你注册一个将在脱水过程中被调用的闭包。在该闭包内，你可以对将与队列任务共享的数据进行更改。

通常，你应当在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `dehydrating` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Context::dehydrating(function (Repository $context) {
        $context->addHidden('locale', Config::get('app.locale'));
    });
}
```

> [!NOTE]
> 你不应在 `dehydrating` 回调中使用 `Context` Facade，因为那会改变当前进程的上下文。请确保你只对被传给回调的存储库进行更改。

<a name="hydrated"></a>
### 水合

每当一个队列任务在队列上开始执行时，任何与该任务共享的上下文都会被“水合（hydrated）”回当前上下文。`Context::hydrated` 方法允许你注册一个将在水合过程中被调用的闭包。

通常，你应当在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `hydrated` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * 引导任何应用服务。
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
> 你不应在 `hydrated` 回调中使用 `Context` Facade，而应确保你只对被传给回调的存储库进行更改。
