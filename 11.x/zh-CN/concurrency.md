# 并发

- [简介](#introduction)
- [运行并发任务](#running-concurrent-tasks)
- [延迟并发任务](#deferring-concurrent-tasks)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel 的 `Concurrency` Facade 目前仍处于 beta 阶段，我们正在收集社区反馈。

有时你可能需要执行若干互不依赖的慢任务。在许多情况下，并发执行这些任务能带来可观的性能提升。Laravel 的 `Concurrency` Facade 提供了一套简单便捷的 API，用于并发执行闭包。

<a name="concurrency-compatibility"></a>
#### 并发兼容性

如果你是从 Laravel 10.x 应用升级到 Laravel 11.x，可能需要在应用的 `config/app.php` 配置文件的 `providers` 数组中添加 `ConcurrencyServiceProvider`：

```php
'providers' => ServiceProvider::defaultProviders()->merge([
    /*
     * 包服务提供者...
     */
    Illuminate\Concurrency\ConcurrencyServiceProvider::class, // [tl! add]

    /*
     * 应用服务提供者...
     */
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    // App\Providers\BroadcastServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
])->toArray(),
```

<a name="how-it-works"></a>
#### 工作原理

Laravel 通过对给定的闭包进行序列化，并把它们分派到一个隐藏的 Artisan CLI 命令来实现并发；该命令负责反序列化这些闭包，并在自己的 PHP 进程中调用它。闭包调用完成后，得到的结果会被序列化回父进程。

`Concurrency` Facade 支持三种驱动：`process`（默认）、`fork` 和 `sync`。

与默认的 `process` 驱动相比，`fork` 驱动性能更好，但它只能在 PHP 的 CLI 上下文中使用，因为 PHP 在 Web 请求期间不支持 fork。使用 `fork` 驱动之前，你需要安装 `spatie/fork` 包：

```bash
composer require spatie/fork
```

`sync` 驱动主要在测试期间有用：当你希望禁用所有并发，只在父进程中按顺序执行给定闭包时使用它。

<a name="running-concurrent-tasks"></a>
## 运行并发任务

要运行并发任务，你可以调用 `Concurrency` Facade 的 `run` 方法。`run` 方法接收一个闭包数组，这些闭包将在子 PHP 进程中同时执行：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
]);
```

要使用特定驱动，你可以使用 `driver` 方法：

```php
$results = Concurrency::driver('fork')->run(...);
```

或者，若要更改默认的并发驱动，你应通过 `config:publish` Artisan 命令发布 `concurrency` 配置文件，并更新文件中的 `default` 选项：

```bash
php artisan config:publish concurrency
```

<a name="deferring-concurrent-tasks"></a>
## 延迟并发任务

如果你想并发执行一个闭包数组，却并不关心这些闭包返回的结果，可以考虑使用 `defer` 方法。调用 `defer` 方法时，给定的闭包不会立即执行；Laravel 会在 HTTP 响应发送给用户之后再并发执行这些闭包：

```php
use App\Services\Metrics;
use Illuminate\Support\Facades\Concurrency;

Concurrency::defer([
    fn () => Metrics::report('users'),
    fn () => Metrics::report('orders'),
]);
```
