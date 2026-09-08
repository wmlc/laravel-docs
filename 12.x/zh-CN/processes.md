# 进程管理

- [简介](#introduction)
- [调用进程](#invoking-processes)
    - [进程选项](#process-options)
    - [进程输出](#process-output)
    - [管道](#process-pipelines)
- [异步进程](#asynchronous-processes)
    - [进程 ID 与信号](#process-ids-and-signals)
    - [异步进程输出](#asynchronous-process-output)
    - [异步进程超时](#asynchronous-process-timeouts)
- [并发进程](#concurrent-processes)
    - [为进程池中的进程命名](#naming-pool-processes)
    - [进程池的进程 ID 与信号](#pool-process-ids-and-signals)
- [测试](#testing)
    - [模拟进程](#faking-processes)
    - [模拟特定进程](#faking-specific-processes)
    - [模拟进程序列](#faking-process-sequences)
    - [模拟异步进程生命周期](#faking-asynchronous-process-lifecycles)
    - [可用的断言](#available-assertions)
    - [防止游离进程](#preventing-stray-processes)

<a name="introduction"></a>
## 简介

Laravel 在 [Symfony Process 组件](https://symfony.com/doc/current/components/process.html)之上提供了一套富有表现力的极简 API，让你可以方便地从 Laravel 应用中调用外部进程。Laravel 的进程功能专注于最常见的使用场景，并带来极佳的开发体验。

<a name="invoking-processes"></a>
## 调用进程

调用进程可以使用 `Process` Facade 提供的 `run` 和 `start` 方法。`run` 方法会调用进程并等待其执行完毕，而 `start` 方法用于异步执行进程。本文档将逐一介绍这两种方式。首先来看看如何调用一个基本的同步进程并检查其结果：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

return $result->output();
```

当然，`run` 方法返回的 `Illuminate\Contracts\Process\ProcessResult` 实例提供了多种实用的方法，可用于检查进程结果：

```php
$result = Process::run('ls -la');

$result->command();
$result->successful();
$result->failed();
$result->output();
$result->errorOutput();
$result->exitCode();
```

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你拿到了一个进程结果，并希望在退出码大于零（即表明执行失败）时抛出 `Illuminate\Process\Exceptions\ProcessFailedException` 实例，可以使用 `throw` 和 `throwIf` 方法。如果进程没有失败，则会返回 `ProcessResult` 实例：

```php
$result = Process::run('ls -la')->throw();

$result = Process::run('ls -la')->throwIf($condition);
```

<a name="process-options"></a>
### 进程选项

当然，在调用进程之前，你可能需要自定义进程的行为。Laravel 允许你调整多种进程特性，比如工作目录、超时时间和环境变量。

<a name="working-directory-path"></a>
#### 工作目录路径

你可以使用 `path` 方法指定进程的工作目录。如果不调用该方法，进程将继承当前正在执行的 PHP 脚本的工作目录：

```php
$result = Process::path(__DIR__)->run('ls -la');
```

<a name="input"></a>
#### 输入

你可以使用 `input` 方法，通过进程的"标准输入"提供输入内容：

```php
$result = Process::input('Hello World')->run('cat');
```

<a name="timeouts"></a>
#### 超时

默认情况下，进程执行超过 60 秒后会抛出 `Illuminate\Process\Exceptions\ProcessTimedOutException` 实例。不过，你可以通过 `timeout` 方法自定义这一行为：

```php
$result = Process::timeout(120)->run('bash import.sh');
```

或者，如果你想完全禁用进程超时，可以调用 `forever` 方法：

```php
$result = Process::forever()->run('bash import.sh');
```

`idleTimeout` 方法可用于指定进程在没有任何输出的情况下最多可以运行的秒数：

```php
$result = Process::timeout(60)->idleTimeout(30)->run('bash import.sh');
```

<a name="environment-variables"></a>
#### 环境变量

可以通过 `env` 方法为进程提供环境变量。所调用的进程还会继承系统定义的全部环境变量：

```php
$result = Process::forever()
    ->env(['IMPORT_PATH' => __DIR__])
    ->run('bash import.sh');
```

如果希望从所调用的进程中移除某个继承的环境变量，可以将该环境变量的值设置为 `false`：

```php
$result = Process::forever()
    ->env(['LOAD_PATH' => false])
    ->run('bash import.sh');
```

<a name="tty-mode"></a>
#### TTY 模式

`tty` 方法可用于为进程启用 TTY 模式。TTY 模式将进程的输入输出连接到你程序的输入输出，使你的进程能够打开 Vim 或 Nano 这样的编辑器：

```php
Process::forever()->tty()->run('vim');
```

> [!WARNING]
> Windows 不支持 TTY 模式。

<a name="process-output"></a>
### 进程输出

如前所述，可以通过进程结果上的 `output`（stdout）和 `errorOutput`（stderr）方法访问进程输出：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

echo $result->output();
echo $result->errorOutput();
```

不过，你也可以向 `run` 方法传递一个闭包作为第二个参数，以实时收集输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::run('ls -la', function (string $type, string $output) {
    echo $output;
});
```

Laravel 还提供了 `seeInOutput` 和 `seeInErrorOutput` 方法，为判断进程输出中是否包含给定字符串提供了便捷方式：

```php
if (Process::run('ls -la')->seeInOutput('laravel')) {
    // ...
}
```

<a name="disabling-process-output"></a>
#### 禁用进程输出

如果进程会产生大量你不关心的输出，你可以完全禁用输出获取以节省内存。为此，在构建进程时调用 `quietly` 方法：

```php
use Illuminate\Support\Facades\Process;

$result = Process::quietly()->run('bash import.sh');
```

<a name="process-pipelines"></a>
### 管道

有时你可能希望将一个进程的输出作为另一个进程的输入，这通常被称为把一个进程的输出"管道"（pipe）到另一个进程。`Process` Facade 提供的 `pipe` 方法让这一操作变得轻而易举。`pipe` 方法会同步执行管道中的进程，并返回管道中最后一个进程的进程结果：

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

如果不需要自定义构成管道的各个进程，可以直接向 `pipe` 方法传递一个命令字符串数组：

```php
$result = Process::pipe([
    'cat example.txt',
    'grep -i "laravel"',
]);
```

你可以向 `pipe` 方法传递一个闭包作为第二个参数，以实时收集进程输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
}, function (string $type, string $output) {
    echo $output;
});
```

Laravel 还允许你通过 `as` 方法为管道中的每个进程分配字符串键。这个键也会传递给提供给 `pipe` 方法的输出闭包，让你能够判断输出来自哪个进程：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->as('first')->command('cat example.txt');
    $pipe->as('second')->command('grep -i "laravel"');
}, function (string $type, string $output, string $key) {
    // ...
});
```

<a name="asynchronous-processes"></a>
## 异步进程

`run` 方法以同步方式调用进程，而 `start` 方法可用于异步调用进程。这样，进程在后台运行时，你的应用可以继续执行其他任务。调用进程后，你可以使用 `running` 方法来判断进程是否仍在运行：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    // ...
}

$result = $process->wait();
```

你可能已经注意到，可以调用 `wait` 方法等待进程执行完毕，并获取 `ProcessResult` 实例：

```php
$process = Process::timeout(120)->start('bash import.sh');

// ...

$result = $process->wait();
```

<a name="process-ids-and-signals"></a>
### 进程 ID 与信号

`id` 方法可用于获取运行中进程由操作系统分配的进程 ID：

```php
$process = Process::start('bash import.sh');

return $process->id();
```

你可以使用 `signal` 方法向运行中的进程发送"信号"。预定义的信号常量列表可以在 [PHP 文档](https://www.php.net/manual/en/pcntl.constants.php)中找到：

```php
$process->signal(SIGUSR2);
```

<a name="asynchronous-process-output"></a>
### 异步进程输出

异步进程运行期间，你可以使用 `output` 和 `errorOutput` 方法访问其当前的全部输出；此外，你还可以使用 `latestOutput` 和 `latestErrorOutput` 来访问自上次获取输出以来进程新产生的输出：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    echo $process->latestOutput();
    echo $process->latestErrorOutput();

    sleep(1);
}
```

与 `run` 方法类似，你可以向 `start` 方法传递一个闭包作为第二个参数，以实时收集异步进程的输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$process = Process::start('bash import.sh', function (string $type, string $output) {
    echo $output;
});

$result = $process->wait();
```

除了等待进程执行完毕之外，你还可以使用 `waitUntil` 方法根据进程的输出来停止等待。当传递给 `waitUntil` 方法的闭包返回 `true` 时，Laravel 就会停止等待进程结束：

```php
$process = Process::start('bash import.sh');

$process->waitUntil(function (string $type, string $output) {
    return $output === 'Ready...';
});
```

<a name="asynchronous-process-timeouts"></a>
### 异步进程超时

异步进程运行期间，你可以使用 `ensureNotTimedOut` 方法来验证进程是否已超时。如果进程已超时，该方法将抛出[超时异常](#timeouts)：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    $process->ensureNotTimedOut();

    // ...

    sleep(1);
}
```

<a name="concurrent-processes"></a>
## 并发进程

Laravel 还让管理并发异步进程池变得轻而易举，使你能够轻松地同时执行多个任务。首先调用 `pool` 方法，它接受一个接收 `Illuminate\Process\Pool` 实例的闭包。

在这个闭包中，你可以定义属于进程池的进程。通过 `start` 方法启动进程池后，你可以通过 `running` 方法访问正在运行的进程[集合](/docs/{{version}}/collections)：

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

如你所见，你可以通过 `wait` 方法等待进程池中的所有进程执行完毕并解析它们的结果。`wait` 方法返回一个可按数组方式访问的对象，让你能够通过键访问进程池中每个进程的 `ProcessResult` 实例：

```php
$results = $pool->wait();

echo $results[0]->output();
```

此外，为方便起见，`concurrently` 方法可用于启动一个异步进程池并立即等待其结果。与 PHP 的数组解构能力结合使用时，这能带来极具表现力的语法：

```php
[$first, $second, $third] = Process::concurrently(function (Pool $pool) {
    $pool->path(__DIR__)->command('ls -la');
    $pool->path(app_path())->command('ls -la');
    $pool->path(storage_path())->command('ls -la');
});

echo $first->output();
```

<a name="naming-pool-processes"></a>
### 为进程池中的进程命名

通过数字键访问进程池的结果不够直观；因此，Laravel 允许你通过 `as` 方法为进程池中的每个进程分配字符串键。这个键也会传递给提供给 `start` 方法的闭包，让你能够判断输出来自哪个进程：

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

<a name="pool-process-ids-and-signals"></a>
### 进程池的进程 ID 与信号

由于进程池的 `running` 方法会返回池内所有已调用进程的集合，你可以轻松访问底层的进程池进程 ID：

```php
$processIds = $pool->running()->each->id();
```

此外，为方便起见，你可以在进程池上调用 `signal` 方法，向池内的每个进程发送信号：

```php
$pool->signal(SIGUSR2);
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供了帮助你轻松、优雅地编写测试的功能，Laravel 的进程服务也不例外。`Process` Facade 的 `fake` 方法可以指示 Laravel 在调用进程时返回桩化（stub）/ 虚拟结果。

<a name="faking-processes"></a>
### 模拟进程

为了探索 Laravel 模拟进程的能力，我们假设有一个调用进程的路由：

```php
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    Process::run('bash import.sh');

    return 'Import complete!';
});
```

在测试这个路由时，我们可以不带参数地调用 `Process` Facade 上的 `fake` 方法，指示 Laravel 为每个被调用的进程返回一个模拟的成功结果。此外，我们甚至可以[断言](#available-assertions)某个进程已被"运行"：

```php tab=Pest
<?php

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

test('process is invoked', function () {
    Process::fake();

    $response = $this->get('/import');

    // 简单的进程断言...
    Process::assertRan('bash import.sh');

    // 或者，检查进程配置...
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

        // 简单的进程断言...
        Process::assertRan('bash import.sh');

        // 或者，检查进程配置...
        Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
            return $process->command === 'bash import.sh' &&
                   $process->timeout === 60;
        });
    }
}
```

如前所述，调用 `Process` Facade 上的 `fake` 方法会让 Laravel 始终返回一个没有输出的成功进程结果。不过，你可以使用 `Process` Facade 的 `result` 方法轻松指定模拟进程的输出和退出码：

```php
Process::fake([
    '*' => Process::result(
        output: 'Test output',
        errorOutput: 'Test error output',
        exitCode: 1,
    ),
]);
```

<a name="faking-specific-processes"></a>
### 模拟特定进程

正如你在前面例子中注意到的，`Process` Facade 允许你通过向 `fake` 方法传递一个数组，为每个进程指定不同的模拟结果。

数组的键代表你希望模拟的命令模式及其关联的结果。`*` 字符可用作通配符。任何未被模拟的进程命令都将被实际调用。你可以使用 `Process` Facade 的 `result` 方法为这些命令构建桩化 / 模拟结果：

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

如果不需要自定义模拟进程的退出码或错误输出，你会发现直接将模拟进程结果指定为简单字符串更加方便：

```php
Process::fake([
    'cat *' => 'Test "cat" output',
    'ls *' => 'Test "ls" output',
]);
```

<a name="faking-process-sequences"></a>
### 模拟进程序列

如果你要测试的代码使用相同的命令调用多个进程，你可能希望为每次进程调用分配不同的模拟进程结果。这可以通过 `Process` Facade 的 `sequence` 方法来实现：

```php
Process::fake([
    'ls *' => Process::sequence()
        ->push(Process::result('First invocation'))
        ->push(Process::result('Second invocation')),
]);
```

<a name="faking-asynchronous-process-lifecycles"></a>
### 模拟异步进程生命周期

到目前为止，我们主要讨论的是模拟通过 `run` 方法同步调用的进程。但是，如果你要测试的代码与通过 `start` 调用的异步进程交互，你可能需要一种更精细的方式来描述模拟进程。

例如，假设有以下与异步进程交互的路由：

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

要正确模拟这个进程，我们需要能够描述 `running` 方法应返回多少次 `true`。此外，我们可能还希望指定按顺序返回的多行输出。为此，可以使用 `Process` Facade 的 `describe` 方法：

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

让我们深入分析上面的例子。通过 `output` 和 `errorOutput` 方法，我们可以指定按顺序返回的多行输出。`exitCode` 方法可用于指定模拟进程的最终退出码。最后，`iterations` 方法可用于指定 `running` 方法应返回多少次 `true`。

<a name="available-assertions"></a>
### 可用的断言

正如[前文所述](#faking-processes)，Laravel 为功能测试提供了多种进程断言。下面将逐一讨论这些断言。

<a name="assert-process-ran"></a>
#### assertRan

断言某个给定进程已被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertRan('ls -la');
```

`assertRan` 方法也接受一个闭包，该闭包会接收进程实例和进程结果，让你能够检查进程所配置的选项。如果该闭包返回 `true`，断言将"通过"：

```php
Process::assertRan(fn ($process, $result) =>
    $process->command === 'ls -la' &&
    $process->path === __DIR__ &&
    $process->timeout === 60
);
```

传递给 `assertRan` 闭包的 `$process` 是 `Illuminate\Process\PendingProcess` 的实例，而 `$result` 是 `Illuminate\Contracts\Process\ProcessResult` 的实例。

<a name="assert-process-didnt-run"></a>
#### assertDidntRun

断言某个给定进程未被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertDidntRun('ls -la');
```

与 `assertRan` 方法类似，`assertDidntRun` 方法也接受一个闭包，该闭包会接收进程实例和进程结果，让你能够检查进程所配置的选项。如果该闭包返回 `true`，断言将"失败"：

```php
Process::assertDidntRun(fn (PendingProcess $process, ProcessResult $result) =>
    $process->command === 'ls -la'
);
```

<a name="assert-process-ran-times"></a>
#### assertRanTimes

断言某个给定进程被调用了给定的次数：

```php
use Illuminate\Support\Facades\Process;

Process::assertRanTimes('ls -la', times: 3);
```

`assertRanTimes` 方法也接受一个闭包，该闭包会接收 `PendingProcess` 和 `ProcessResult` 的实例，让你能够检查进程所配置的选项。如果该闭包返回 `true` 且进程被调用了指定次数，断言将"通过"：

```php
Process::assertRanTimes(function (PendingProcess $process, ProcessResult $result) {
    return $process->command === 'ls -la';
}, times: 3);
```

<a name="preventing-stray-processes"></a>
### 防止游离进程

如果你想确保在整个单独测试或完整测试套件中，所有被调用的进程都已被模拟，可以调用 `preventStrayProcesses` 方法。调用此方法后，任何没有对应模拟结果的进程都会抛出异常，而不是启动真实的进程：

```php
use Illuminate\Support\Facades\Process;

Process::preventStrayProcesses();

Process::fake([
    'ls *' => 'Test output...',
]);

// 返回模拟的响应...
Process::run('ls -la');

// 抛出异常...
Process::run('bash import.sh');
```
