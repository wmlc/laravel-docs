# 进程

## 简介

Laravel 对 [Symfony Process 组件](https://symfony.com/doc/current/components/process.html) 提供了一套表达力强、精练的封装，让我们能方便地在 Laravel 应用中调用外部进程。Laravel 的进程特性专注于最常见的用例与出色的开发体验。

## 调用进程

要调用一个进程，可以使用 `Process` 门面提供的 `run` 与 `start` 方法。`run` 方法会调用进程并等待其执行结束；`start` 方法用于异步调用进程。两种方式都会在本节中介绍。首先看一下如何调用一个基础的同步进程并读取结果：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

return $result->output();
```

当然，`run` 方法返回的 `Illuminate\Contracts\Process\ProcessResult` 实例还提供了多种用于检查结果的有用方法：

```php
$result = Process::run('ls -la');

$result->command();
$result->successful();
$result->failed();
$result->output();
$result->errorOutput();
$result->exitCode();
```

#### 抛出异常

如果希望在退出码大于零（表示失败）时抛出 `Illuminate\Process\Exceptions\ProcessFailedException` 实例，可以使用 `throw` 与 `throwIf` 方法。如果进程没有失败，则返回原 `ProcessResult` 实例：

```php
$result = Process::run('ls -la')->throw();

$result = Process::run('ls -la')->throwIf($condition);
```

### 进程选项

调用进程前，通常需要对它的行为进行一些自定义。Laravel 允许你调整多种进程特性，例如工作目录、超时、环境变量等。

#### 工作目录

可以使用 `path` 方法指定进程的工作目录。如果不调用此方法，进程会继承当前执行 PHP 脚本的工作目录：

```php
$result = Process::path(__DIR__)->run('ls -la');
```

#### 输入

可以通过 `input` 方法把数据写入进程的「标准输入」：

```php
$result = Process::input('Hello World')->run('cat');
```

#### 超时

默认情况下，进程执行超过 60 秒后会抛出 `Illuminate\Process\Exceptions\ProcessTimedOutException` 实例。但可以通过 `timeout` 方法自定义这一行为：

```php
$result = Process::timeout(120)->run('bash import.sh');
```

`timeout` 与 `idleTimeout` 方法也接收 `CarbonInterval` 实例：

```php
use function Illuminate\Support\minutes;

$result = Process::timeout(minutes(2))->run('bash import.sh');
```

如果希望完全禁用进程超时，可以调用 `forever` 方法：

```php
$result = Process::forever()->run('bash import.sh');
```

`idleTimeout` 方法可用于指定进程在没有任何输出时允许运行的最长秒数：

```php
$result = Process::timeout(60)->idleTimeout(30)->run('bash import.sh');
```

#### 环境变量

可以通过 `env` 方法向进程提供环境变量。被调用的进程还会继承系统定义的全部环境变量：

```php
$result = Process::forever()
    ->env(['IMPORT_PATH' => __DIR__])
    ->run('bash import.sh');
```

如果希望移除被调用进程继承的某个环境变量，可以把该变量设为 `false`：

```php
$result = Process::forever()
    ->env(['LOAD_PATH' => false])
    ->run('bash import.sh');
```

#### TTY 模式

`tty` 方法可以为进程启用 TTY 模式。该模式会把进程的输入输出连接到当前程序的输入输出，使进程可以像 Vim、Nano 那样以编辑器形式打开：

```php
Process::forever()->tty()->run('vim');
```

> [!WARNING]
> TTY 模式在 Windows 上不受支持。

### 进程输出

如前所述，可以通过结果实例上的 `output`（stdout）与 `errorOutput`（stderr）方法获取进程输出：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

echo $result->output();
echo $result->errorOutput();
```

还可以通过把一个闭包作为 `run` 方法的第二个参数传入来实时收集输出。该闭包会接收两个参数：输出的「类型」（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::run('ls -la', function (string $type, string $output) {
    echo $output;
});
```

Laravel 还提供了 `seeInOutput` 与 `seeInErrorOutput` 方法，便于快速判断进程输出是否包含某个字符串：

```php
if (Process::run('ls -la')->seeInOutput('laravel')) {
    // ...
}
```

#### 禁用进程输出

如果进程会输出大量数据，而你并不关心，可以完全禁用输出采集以节省内存。要做到这点，在构建进程时调用 `quietly` 方法：

```php
use Illuminate\Support\Facades\Process;

$result = Process::quietly()->run('bash import.sh');
```

### 管道（Pipelines）

有时希望把一个进程的输出作为另一个进程的输入。这就是通常所说的把进程的输出「管道化」到另一个进程。`Process` 门面提供的 `pipe` 方法可以方便地实现这一点。`pipe` 方法会同步执行管道中的进程，并返回管道中**最后**一个进程的结果：

```php
use Illuminate\Process\Pipe;
use Illuminate\Support\Facades\Process;

$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
});

if ($result->successful()) {
    // ...
}
```

如果不需要定制管道中的各个进程，可以直接向 `pipe` 方法传入命令字符串数组：

```php
$result = Process::pipe([
    'cat example.txt',
    'grep -i "laravel"',
]);
```

通过把闭包作为 `pipe` 方法的第二个参数传入，可以实时收集进程输出。闭包会接收两个参数：输出的「类型」（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
}, function (string $type, string $output) {
    echo $output;
});
```

Laravel 还允许通过 `as` 方法为管道内的每个进程分配字符串 key。该 key 也会被传给 `pipe` 方法的输出闭包，方便判断输出归属：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->as('first')->command('cat example.txt');
    $pipe->as('second')->command('grep -i "laravel"');
}, function (string $type, string $output, string $key) {
    // ...
});
```

## 异步进程

`run` 方法是同步调用进程的，而 `start` 方法可用于异步调用进程。这允许你的应用在进程于后台执行的同时继续完成其他任务。一旦进程被调用，你可以使用 `running` 方法判断它是否仍在运行：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    // ...
}

$result = $process->wait();
```

正如下面所示，可以调用 `wait` 方法等待进程执行结束，并获取 `ProcessResult` 实例：

```php
$process = Process::timeout(120)->start('bash import.sh');

// ...

$result = $process->wait();
```

### 进程 ID 与信号

可以使用 `id` 方法获取操作系统为运行中的进程分配的进程 ID：

```php
$process = Process::start('bash import.sh');

return $process->id();
```

可以使用 `signal` 方法向运行中的进程发送「信号」。预定义信号常量可以在 [PHP 文档](https://www.php.net/manual/en/pcntl.constants.php) 中查找：

```php
$process->signal(SIGUSR2);
```

### 异步进程的输出

当一个异步进程运行时，可以通过 `output` 与 `errorOutput` 方法读取目前累计的全部输出；不过，你也可以使用 `latestOutput` 与 `latestErrorOutput` 仅读取上次读取后产生的输出：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    echo $process->latestOutput();
    echo $process->latestErrorOutput();

    sleep(1);
}
```

和 `run` 方法类似，通过给 `start` 方法传一个闭包作为第二参数，也能实时收集异步进程的输出。闭包会接收两个参数：输出的「类型」（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$process = Process::start('bash import.sh', function (string $type, string $output) {
    echo $output;
});

$result = $process->wait();
```

如果不想一直等待进程完成，可以使用 `waitUntil` 方法。当传给 `waitUntil` 的闭包返回 `true` 时，Laravel 会立即停止等待：

```php
$process = Process::start('bash import.sh');

$process->waitUntil(function (string $type, string $output) {
    return $output === 'Ready...';
});
```

### 异步进程的超时

在异步进程运行过程中，可以使用 `ensureNotTimedOut` 方法确认进程是否已经超时。如果已经超时，该方法会抛出 [超时异常](#timeouts)：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    $process->ensureNotTimedOut();

    // ...

    sleep(1);
}
```

## 并发进程

Laravel 还内置了一组便捷的能力来管理一组并发、异步的进程，让你能轻松地并行执行许多任务。要开始使用，可以调用 `pool` 方法，它接收一个接收 `Illuminate\Process\Pool` 实例的闭包。

在该闭包内可以定义属于进程池的进程。一旦通过 `start` 方法启动了进程池，就可以通过 `running` 方法访问当前正在运行的进程 [集合](/docs/{{version}}/collections)：

```php
use Illuminate\Process\Pool;
use Illuminate\Support\Facades\Process;

$pool = Process::pool(function (Pool $pool) {
    $pool->path(__DIR__)->command('bash import-1.sh');
    $pool->path(__DIR__)->command('bash import-2.sh');
    $pool->path(__DIR__)->command('bash import-3.sh');
})->start(function (string $type, string $output, int $key) {
    // ...
});

while ($pool->running()->isNotEmpty()) {
    // ...
}

$results = $pool->wait();
```

如上所示，你可以通过 `wait` 方法等待所有进程池中的进程执行完毕并解析它们的结果。`wait` 方法返回一个可按数组访问的对象，让你能通过 key 获取池中每个进程的 `ProcessResult` 实例：

```php
$results = $pool->wait();

echo $results[0]->output();
```

为方便起见，也可以使用 `concurrently` 方法来启动一个异步进程池并立刻等待结果。配合 PHP 的数组解构，语法非常简洁：

```php
[$first, $second, $third] = Process::concurrently(function (Pool $pool) {
    $pool->path(__DIR__)->command('ls -la');
    $pool->path(app_path())->command('ls -la');
    $pool->path(storage_path())->command('ls -la');
});

echo $first->output();
```

### 命名进程池

按数字 key 获取进程池结果表达力不强；Laravel 允许通过 `as` 方法为每个进程分配一个字符串 key。该 key 还会传给 `start` 方法的闭包，方便判断输出归属：

```php
$pool = Process::pool(function (Pool $pool) {
    $pool->as('first')->command('bash import-1.sh');
    $pool->as('second')->command('bash import-2.sh');
    $pool->as('third')->command('bash import-3.sh');
})->start(function (string $type, string $output, string $key) {
    // ...
});

$results = $pool->wait();

return $results['first']->output();
```

### 进程池 ID 与信号

由于进程池的 `running` 方法返回池内全部已调用进程的集合，可以方便地访问底层进程 ID：

```php
$processIds = $pool->running()->each->id();
```

同时，为方便起见，你可以在进程池上调用 `signal` 方法，向池内所有进程发送信号：

```php
$pool->signal(SIGUSR2);
```

## 测试

许多 Laravel 服务都提供了简单直观的测试支持，Laravel 的进程服务也不例外。`Process` 门面的 `fake` 方法可以指示 Laravel 在调用进程时返回桩（dummy）结果。

### Faking 进程

为了演示 Laravel 的进程 fake 能力，假设我们有这样一条调用进程的路由：

```php
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    Process::run('bash import.sh');

    return 'Import complete!';
});
```

在测试这条路由时，我们可以对 `Process` 门面无参调用 `fake` 方法，让 Laravel 在每次调用进程时返回一个假的、成功的结果。同时，我们还能 [断言](#available-assertions) 某个进程是否被「调用过」：

```php tab=Pest
<?php

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

test('process is invoked', function () {
    Process::fake();

    $response = $this->get('/import');

    // 简单进程断言……
    Process::assertRan('bash import.sh');

    // 或者，检查进程的配置……
    Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
        return $process->command === 'bash import.sh' &&
               $process->timeout === 60;
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_process_is_invoked(): void
    {
        Process::fake();

        $response = $this->get('/import');

        // 简单进程断言……
        Process::assertRan('bash import.sh');

        // 或者，检查进程的配置……
        Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
            return $process->command === 'bash import.sh' &&
                   $process->timeout === 60;
        });
    }
}
```

如前所述，对 `Process` 门面调用 `fake` 方法会让 Laravel 总返回没有输出的成功结果。但使用 `Process` 门面的 `result` 方法，可以轻松指定 fake 进程的输出与退出码：

```php
Process::fake([
    '*' => Process::result(
        output: 'Test output',
        errorOutput: 'Test error output',
        exitCode: 1,
    ),
]);
```

### Fake 特定进程

在前面的示例中已经看到，`Process` 门面允许通过给 `fake` 方法传一个数组，为不同的进程指定不同的 fake 结果。

数组的 key 表示要 fake 的命令模式，对应的值是返回结果。`*` 字符可以用作通配符。任何未被 fake 的进程命令仍会真正执行。可以用 `Process` 门面的 `result` 方法来构造这些命令的桩结果：

```php
Process::fake([
    'cat *' => Process::result(
        output: 'Test "cat" output',
    ),
    'ls *' => Process::result(
        output: 'Test "ls" output',
    ),
]);
```

如果不需要定制 fake 进程的退出码或错误输出，更简便的方式是直接把 fake 进程结果写成字符串：

```php
Process::fake([
    'cat *' => 'Test "cat" output',
    'ls *' => 'Test "ls" output',
]);
```

### Fake 进程序列

如果要测试的代码使用相同命令多次调用进程，可能希望为每次调用分配不同的 fake 结果。可以通过 `Process` 门面的 `sequence` 方法实现：

```php
Process::fake([
    'ls *' => Process::sequence()
        ->push(Process::result('First invocation'))
        ->push(Process::result('Second invocation')),
]);
```

### Fake 异步进程生命周期

到目前为止，我们主要讨论了通过 `run` 方法同步调用的进程的 fake。但要测试与通过 `start` 调用的异步进程交互的代码时，可能需要更精细的 fake 描述。

例如，假设有如下与异步进程交互的路由：

```php
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    $process = Process::start('bash import.sh');

    while ($process->running()) {
        Log::info($process->latestOutput());
        Log::info($process->latestErrorOutput());
    }

    return 'Done';
});
```

要正确 fake 此进程，我们需要能够描述 `running` 方法应该返回多少次 `true`。此外，我们可能希望按顺序指定多行输出。可以使用 `Process` 门面的 `describe` 方法实现：

```php
Process::fake([
    'bash import.sh' => Process::describe()
        ->output('First line of standard output')
        ->errorOutput('First line of error output')
        ->output('Second line of standard output')
        ->exitCode(0)
        ->iterations(3),
]);
```

我们来拆解上面的示例。通过 `output` 与 `errorOutput` 方法，可以按顺序返回多行输出。`exitCode` 方法用于指定 fake 进程的最终退出码。最后，`iterations` 方法用于指定 `running` 方法应该返回多少次 `true`。

### 可用的断言

如 [前文](#faking-processes) 所述，Laravel 为功能测试提供了多种进程断言。下面分别介绍这些断言。

#### assertRan

断言某个指定的进程被调用过：

```php
use Illuminate\Support\Facades\Process;

Process::assertRan('ls -la');
```

当进程以参数数组形式被调用时，可以向断言传入同样的数组：

```php
Process::assertRan(['php', 'artisan', 'migrate']);
```

`assertRanTimes` 与 `assertDidntRun` 方法也接受数组形式的命令。

`assertRan` 方法还接受一个闭包，它会接收一个进程实例和进程结果，允许检查进程的配置选项。若该闭包返回 `true`，则断言通过：

```php
Process::assertRan(fn ($process, $result) =>
    $process->command === 'ls -la' &&
    $process->path === __DIR__ &&
    $process->timeout === 60
);
```

传给 `assertRan` 闭包的 `$process` 是 `Illuminate\Process\PendingProcess` 实例，`$result` 是 `Illuminate\Contracts\Process\ProcessResult` 实例。

#### assertDidntRun

断言某个指定的进程没有被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertDidntRun('ls -la');
```

与 `assertRan` 方法一样，`assertDidntRun` 也接受闭包，闭包会接收一个进程实例和进程结果，允许检查进程的配置选项。若闭包返回 `true`，则断言**失败**：

```php
Process::assertDidntRun(fn (PendingProcess $process, ProcessResult $result) =>
    $process->command === 'ls -la'
);
```

#### assertRanTimes

断言某个指定的进程被调用了指定次数：

```php
use Illuminate\Support\Facades\Process;

Process::assertRanTimes('ls -la', times: 3);
```

`assertRanTimes` 方法也接受闭包，闭包会接收一个 `PendingProcess` 与 `ProcessResult` 实例，允许检查进程的配置选项。若闭包返回 `true` 且进程确实被调用了指定的次数，则断言通过：

```php
Process::assertRanTimes(function (PendingProcess $process, ProcessResult $result) {
    return $process->command === 'ls -la';
}, times: 3);
```

#### assertRanInOrder

断言进程按指定顺序被调用：

```php
Process::assertRanInOrder([
    'git fetch',
    'composer install',
]);
```

`assertRanInOrder` 接受命令字符串、命令参数数组，或与其他进程断言相同的闭包。

### 防止漏 fake 的进程

如果希望确保在单个测试或整个测试套件中所有被调用的进程都被 fake 了，可以调用 `preventStrayProcesses` 方法。调用该方法后，任何没有对应 fake 结果的进程都会抛出异常，而不是启动真实的进程：

```php
use Illuminate\Support\Facades\Process;

Process::preventStrayProcesses();

Process::fake([
    'ls *' => 'Test output...',
]);

// 返回 fake 响应……
Process::run('ls -la');

// 抛出异常……
Process::run('bash import.sh');
```
