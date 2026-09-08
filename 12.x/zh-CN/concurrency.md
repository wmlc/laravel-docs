# 并发

- [简介](#introduction)
- [运行并发任务](#running-concurrent-tasks)
- [延迟并发任务](#deferring-concurrent-tasks)

<a name="introduction"></a>
## 简介

有时候，你可能需要执行多个互不依赖的耗时任务。在许多情况下，并发执行这些任务可以带来显著的性能提升。Laravel 的 `Concurrency` Facade 提供了一套简单、便捷的 API，用于并发执行闭包。

<a name="how-it-works"></a>
#### 工作原理

Laravel 实现并发的方式是：将给定的闭包序列化，并将其分发给一个隐藏的 Artisan CLI 命令；该命令会对闭包进行反序列化，然后在独立的 PHP 进程中调用它。闭包调用完成后，返回值会被序列化回传给父进程。

`Concurrency` Facade 支持三种驱动：`process`（默认）、`fork` 和 `sync`。

与默认的 `process` 驱动相比，`fork` 驱动性能更好，但它只能在 PHP 的 CLI 环境中使用，因为 PHP 不支持在 Web 请求期间进行 fork 操作。在使用 `fork` 驱动之前，你需要先安装 `spatie/fork` 软件包：

```shell
composer require spatie/fork
```

`sync` 驱动主要用于测试场景，当你希望禁用所有并发、直接在父进程中按顺序执行给定闭包时，它会非常有用。

<a name="running-concurrent-tasks"></a>
## 运行并发任务

要运行并发任务，可以调用 `Concurrency` Facade 的 `run` 方法。`run` 方法接受一个闭包数组，这些闭包将在子 PHP 进程中同时执行：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
]);
```

要使用特定的驱动，可以使用 `driver` 方法：

```php
$results = Concurrency::driver('fork')->run(...);
```

如果想更改默认的并发驱动，你应该通过 `config:publish` Artisan 命令发布 `concurrency` 配置文件，并更新文件中的 `default` 选项：

```shell
php artisan config:publish concurrency
```

<a name="deferring-concurrent-tasks"></a>
## 延迟并发任务

如果你想并发执行一组闭包，但并不关心这些闭包的返回结果，可以考虑使用 `defer` 方法。调用 `defer` 方法时，给定的闭包并不会立即执行。相反，Laravel 会在 HTTP 响应发送给用户之后再并发执行这些闭包：

```php
use App\Services\Metrics;
use Illuminate\Support\Facades\Concurrency;

Concurrency::defer([
    fn () => Metrics::report('users'),
    fn () => Metrics::report('orders'),
]);
```
