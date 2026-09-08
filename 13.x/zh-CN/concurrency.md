# 并发

- [简介](#introduction)
- [运行并发任务](#running-concurrent-tasks)
    - [具名结果](#named-results)
    - [任务超时](#task-timeouts)
- [延迟并发任务](#deferring-concurrent-tasks)

<a name="introduction"></a>
## 简介

有时你可能需要执行多个彼此之间互不依赖的耗时任务。在许多情况下，通过并发执行这些任务可以获得显著的性能提升。Laravel 的 `Concurrency` Facade 提供了一个简单、便捷的 API 用于并发执行闭包。

<a name="how-it-works"></a>
#### 工作原理

Laravel 通过序列化给定的闭包，并将其派发到一个隐藏的 Artisan CLI 命令来实现并发；该命令会在自身的 PHP 进程中反序列化闭包并调用它。闭包被调用后，其结果会被序列化回父进程。

`Concurrency` Facade 支持三种驱动：`process`（默认）、`fork` 和 `sync`。

与默认的 `process` 驱动相比，`fork` 驱动提供了更高的性能，但它只能在 PHP 的 CLI 上下文中使用，因为 PHP 不支持在 Web 请求期间进行 fork 操作。在使用 `fork` 驱动之前，你需要安装 `spatie/fork` 包：

```shell
composer require spatie/fork
```

`sync` 驱动主要在测试时非常有用，当你希望禁用所有并发、仅在父进程中按顺序执行给定的闭包时使用。

<a name="running-concurrent-tasks"></a>
## 运行并发任务

要运行并发任务，你可以调用 `Concurrency` Facade 的 `run` 方法。`run` 方法接受一个闭包数组，这些闭包将在子 PHP 进程中同时执行：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
]);
```

要使用特定的驱动，你可以使用 `driver` 方法：

```php
$results = Concurrency::driver('fork')->run(...);
```

或者，若要更改默认的并发驱动，你可以通过 `config:publish` Artisan 命令发布 `concurrency` 配置文件，并更新其中的 `default` 选项：

```shell
php artisan config:publish concurrency
```

<a name="named-results"></a>
### 具名结果

如果你希望通过名称而非位置来访问并发任务的结果，可以提供一个关联数组形式的闭包。每个结果都会以与其对应闭包相同的键名返回：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

$results = Concurrency::run([
    'users' => fn () => DB::table('users')->count(),
    'orders' => fn () => DB::table('orders')->count(),
]);

$userCount = $results['users'];
$orderCount = $results['orders'];
```

<a name="task-timeouts"></a>
### 任务超时

使用 `process` 驱动（默认）时，你可以通过向 `run` 方法提供超时时间，来指定并发任务在被终止之前允许运行的最大秒数：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
], timeout: 30);
```

如果你希望以更具表达性的方式定义超时，也可以提供一个 `CarbonInterval` 实例：

```php
use Illuminate\Support\Facades\Concurrency;

use function Illuminate\Support\seconds;

Concurrency::run([...], timeout: seconds(30));
```

<a name="deferring-concurrent-tasks"></a>
## 延迟并发任务

如果你希望并发执行一组闭包，但并不关心这些闭包返回的结果，可以考虑使用 `defer` 方法。调用 `defer` 方法时，给定的闭包不会立即执行。相反，Laravel 会在 HTTP 响应发送给用户之后，并发执行这些闭包：

```php
use App\Services\Metrics;
use Illuminate\Support\Facades\Concurrency;

Concurrency::defer([
    fn () => Metrics::report('users'),
    fn () => Metrics::report('orders'),
]);
```
