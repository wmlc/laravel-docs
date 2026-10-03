# 上下文

- [简介](#introduction)
   - [工作原理](#how-it-works)
- [捕获上下文](#capturing-context)
   - [栈](#stacks)
- [获取上下文](#retrieving-context)
   - [判断条目是否存在](#determining-item-existence)
- [移除上下文](#removing-context)
- [隐藏上下文](#hidden-context)
- [事件](#events)
   - [脱水](#dehydrating)
   - [水合](#hydrated)

<a name="introduction"></a>
## 简介

Laravel 的"上下文"能力让你可以在应用内执行的请求、任务和命令中捕获、获取并共享信息。捕获到的信息还会一并写入应用生成的日志，让你更深入地了解写入某条日志之前的代码执行历史，并让你能够在分布式系统中追踪执行流程。

<a name="how-it-works"></a>
### 工作原理

理解 Laravel 上下文能力的最佳方式，是使用内置日志功能亲眼看看它的实际效果。要开始上手，你可以使用 `Context` Facade [向上下文添加信息](#capturing-context)。在这个例子中，我们会用一个[中间件](/docs/{{version}}/middleware)，在每次传入请求时把请求 URL 和唯一的追踪 ID 添加到上下文中：

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

添加到上下文中的信息会自动作为元数据追加到整个请求过程中写入的每条[日志条目](/docs/{{version}}/logging)末尾。把上下文作为元数据追加，可以让单条日志条目传入的信息与通过 `Context` 共享的信息区分开来。例如，假设我们写入下面这条日志：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

生成的日志会包含传给这条日志条目的 `auth_id`，同时也会把上下文中的 `url` 和 `trace_id` 作为元数据一并写入：

```
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文中的信息，同样可供投放到队列的任务使用。例如，假设我们在向上下文添加一些信息之后，把一个 `ProcessPodcast` 任务投放到队列：

```php
// 在我们的中间件中...
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// 在我们的控制器中...
ProcessPodcast::dispatch($podcast);
```

任务被投放时，当前存储在上下文中的所有信息都会被捕获，并与该任务共享。任务执行期间，被捕获的信息又会水合回当前上下文。因此，如果我们任务的 `handle` 方法要写入日志：

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

最终生成的日志条目会包含当初投放该任务的请求期间添加到上下文中的信息：

```
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

尽管我们这里聚焦于 Laravel 上下文与日志相关的内置功能，但接下来的文档将说明上下文如何让你跨越 HTTP 请求与队列任务的边界共享信息，以及如何添加[隐藏上下文数据](#hidden-context)，使其不随日志条目一起写入。

<a name="capturing-context"></a>
## 捕获上下文

你可以使用 `Context` Facade 的 `add` 方法把信息存储到当前上下文中：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

若要一次添加多个条目，可以向 `add` 方法传入一个关联数组：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法会覆盖任何键名相同的已有值。如果你只希望在键尚不存在时才向上下文添加信息，可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

<a name="conditional-context"></a>
#### 条件上下文

你可以根据给定条件使用 `when` 方法向上下文添加数据。当给定条件求值为 `true` 时，`when` 方法会调用第一个闭包；当条件求值为 `false` 时，则调用第二个闭包：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;

Context::when(
    Auth::user()->isAdmin(),
    fn ($context) => $context->add('permissions', Auth::user()->permissions),
    fn ($context) => $context->add('permissions', []),
);
```

<a name="stacks"></a>
### 栈

上下文提供了创建"栈"的能力，栈是按添加顺序存储的数据列表。你可以通过调用 `push` 方法向栈中添加信息：

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

栈有助于捕获关于某个请求的历史信息，例如应用中不断发生的各类事件。例如，你可以创建一个事件监听器，在每次执行查询时向栈中推送一条数据，把查询的 SQL 和耗时作为元组捕获下来：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

DB::listen(function ($event) {
    Context::push('queries', [$event->time, $event->sql]);
});
```

你可以使用 `stackContains` 和 `hiddenStackContains` 方法判断某个值是否存在于栈中：

```php
if (Context::stackContains('breadcrumbs', 'first_value')) {
    //
}

if (Context::hiddenStackContains('secrets', 'first_value')) {
    //
}
```

`stackContains` 和 `hiddenStackContains` 方法的第二个参数还可以接受闭包，从而让你对值比较操作拥有更多控制能力：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;

return Context::stackContains('breadcrumbs', function ($value) {
    return Str::startsWith($value, 'query_');
});
```

<a name="retrieving-context"></a>
## 获取上下文

你可以使用 `Context` Facade 的 `get` 方法从上下文中获取信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

你可以使用 `only` 方法获取上下文中的部分信息：

```php
$data = Context::only(['first_key', 'second_key']);
```

你可以使用 `pull` 方法从上下文中获取信息，并立即将其从上下文中移除：

```php
$value = Context::pull('key');
```

如果上下文数据以[栈](#stacks)的形式存储，你可以使用 `pop` 方法从栈中弹出条目：

```php
Context::push('breadcrumbs', 'first_value', 'second_value');

Context::pop('breadcrumbs')
// second_value

Context::get('breadcrumbs');
// ['first_value'] 
```

如果你想获取存储在上下文中的全部信息，可以调用 `all` 方法：

```php
$data = Context::all();
```

<a name="determining-item-existence"></a>
### 判断条目是否存在

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

无论存储的值是什么，`has` 方法都会返回 `true`。因此，例如一个值为 `null` 的键也会被视为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

<a name="removing-context"></a>
## 移除上下文

你可以使用 `forget` 方法从当前上下文中移除某个键及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

你可以向 `forget` 方法传入一个数组，一次移除多个键：

```php
Context::forget(['first_key', 'second_key']);
```

<a name="hidden-context"></a>
## 隐藏上下文

上下文提供了存储"隐藏"数据的能力。这些隐藏信息不会追加到日志中，也无法通过上文记录的数据获取方法访问。上下文提供另一组方法来与隐藏上下文信息交互：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

这些"隐藏"方法与非隐藏方法的功能一一对应：

```php
Context::addHidden(/* ... */);
Context::addHiddenIf(/* ... */);
Context::pushHidden(/* ... */);
Context::getHidden(/* ... */);
Context::pullHidden(/* ... */);
Context::popHidden(/* ... */);
Context::onlyHidden(/* ... */);
Context::allHidden(/* ... */);
Context::hasHidden(/* ... */);
Context::forgetHidden(/* ... */);
```

<a name="events"></a>
## 事件

上下文会派发两个事件，让你能够挂接到上下文的脱水与水合流程上。

为说明这些事件可以如何使用，假设你在应用的某个中间件中根据传入 HTTP 请求的 `Accept-Language` 头设置 `app.locale` 配置值。上下文的事件让你可以在请求期间捕获该值，并在队列上恢复它，从而确保队列发送的通知带有正确的 `app.locale` 值。我们可以利用上下文的事件和[隐藏](#hidden-context)数据来实现这一点，下面的文档将具体说明。

<a name="dehydrating"></a>
### 脱水

每当任务被投放到队列时，上下文中的数据都会被"脱水"，并与任务的载荷一同捕获。`Context::dehydrating` 方法允许你注册一个闭包，该闭包会在脱水过程中被调用。在这个闭包内，你可以修改将要与队列任务共享的数据。

通常，你应该在应用的 `AppServiceProvider` 类的 `boot` 方法内注册 `dehydrating` 回调：

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
> 你不应该在 `dehydrating` 回调内使用 `Context` Facade，否则会改变当前进程的上下文。请确保你只修改传给该回调的仓库对象。

<a name="hydrated"></a>
### 水合

每当队列任务开始执行时，与该任务共享过的上下文都会被"水合"回当前上下文。`Context::hydrated` 方法允许你注册一个闭包，该闭包会在水合过程中被调用。

通常，你应该在应用的 `AppServiceProvider` 类的 `boot` 方法内注册 `hydrated` 回调：

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
> 你不应该在 `hydrated` 回调内使用 `Context` Facade，而应确保你只修改传给该回调的仓库对象。
