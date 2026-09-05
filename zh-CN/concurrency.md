# 并发

## 简介

有时你需要执行若干相互独立的慢任务。在很多场景下，并发执行这些任务可以获得显著的性能提升。Laravel 的 `Concurrency` 门面（facade）提供了一个简单方便的 API，用于并发执行闭包。

#### 实现原理

Laravel 通过序列化给定闭包并派发给一个隐藏的 Artisan CLI 命令来实现并发——该命令反序列化闭包，并在自己的 PHP 进程中调用它。闭包执行完毕后，结果值被序列化回父进程。

`Concurrency` 门面支持三种驱动：`process`（默认）、`fork` 和 `sync`。

`fork` 驱动相对默认的 `process` 驱动性能更好，但只能在 PHP 的 CLI 上下文里使用，因为 PHP 不支持在 Web 请求中派生子进程。使用 `fork` 驱动前，需要安装 `spatie/fork` 包：

```shell
composer require spatie/fork
```

`sync` 驱动主要用于测试场景——当我们想关闭所有并发、只在父进程里按顺序执行给定闭包时非常有用。

## 运行并发任务

要并发执行任务，可以调用 `Concurrency` 门面的 `run` 方法。`run` 方法接收一个闭包数组，这些闭包会在子 PHP 进程中同时执行：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
]);
```

要使用指定驱动，可以调用 `driver` 方法：

```php
$results = Concurrency::driver('fork')->run(...);
```

要修改默认的并发驱动，可以通过 `config:publish` Artisan 命令发布 `concurrency` 配置文件，然后修改文件中的 `default` 选项：

```shell
php artisan config:publish concurrency
```

### 命名结果

如果你希望按名称（而不是按位置）访问并发任务的结果，可以传入关联数组形式的闭包。结果会使用与闭包对应的同一个 key 返回：

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

### 任务超时

在使用 `process` 驱动（默认）时，可通过给 `run` 方法传入 `timeout` 参数，指定并发任务在终止前最多允许运行的秒数：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
], timeout: 30);
```

如果希望用更具表现力的方式定义超时，也可以传入 `CarbonInterval` 实例：

```php
use Illuminate\Support\Facades\Concurrency;

use function Illuminate\Support\seconds;

Concurrency::run([...], timeout: seconds(30));
```

## 延迟并发任务

如果你希望并发执行一组闭包，但不关心它们的返回值，建议考虑使用 `defer` 方法。调用 `defer` 时，给定的闭包不会立即执行；而是在 HTTP 响应发送给用户之后，Laravel 才会并发地执行这些闭包：

```php
use App\Services\Metrics;
use Illuminate\Support\Facades\Concurrency;

Concurrency::defer([
    fn () => Metrics::report('users'),
    fn () => Metrics::report('orders'),
]);
```
