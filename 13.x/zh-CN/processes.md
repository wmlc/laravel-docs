# 进程

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
    - [为池中进程命名](#naming-pool-processes)
    - [池进程 ID 与信号](#pool-process-ids-and-signals)
- [测试](#testing)
    - [模拟进程](#faking-processes)
    - [模拟特定进程](#faking-specific-processes)
    - [模拟进程序列](#faking-process-sequences)
    - [模拟异步进程生命周期](#faking-asynchronous-process-lifecycles)
    - [可用的断言](#available-assertions)
    - [阻止意外进程](#preventing-stray-processes)

<a name="introduction"></a>
## 简介

Laravel 围绕 [Symfony Process 组件](https://symfony.com/doc/current/components/process.html)提供了富有表现力、极简的 API，使你能够方便地从 Laravel 应用中调用外部进程。Laravel 的进程功能专注于最常见的用例，并提供出色的开发者体验。

<a name="invoking-processes"></a>
## 调用进程

要调用进程，可以使用 `Process` Facade 提供的 `run` 和 `start` 方法。`run` 方法将调用进程并等待进程完成执行，而 `start` 方法用于异步进程执行。我们将在本文档中讨论这两种方法。首先，让我们看看如何调用一个基本的、同步的进程并检查其结果：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

return $result->output();
```

当然，`run` 方法返回的 `Illuminate\Contracts\Process\ProcessResult` 实例提供了多种可用于检查进程结果的实用方法：

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

如果你有一个进程结果，并且希望在退出码大于零（表示失败）时抛出 `Illuminate\Process\Exceptions\ProcessFailedException` 实例，可以使用 `throw` 和 `throwIf` 方法。如果进程没有失败，将返回 `ProcessResult` 实例：

```php
$result = Process::run('ls -la')->throw();

$result = Process::run('ls -la')->throwIf($condition);
```

<a name="process-options"></a>
### 进程选项

当然，你可能需要在调用进程之前自定义其行为。幸运的是，Laravel 允许你调整多种进程特性，例如工作目录、超时和环境变量。

<a name="working-directory-path"></a>
#### 工作目录路径

你可以使用 `path` 方法指定进程的工作目录。如果未调用此方法，进程将继承当前执行的 PHP 脚本的工作目录：

```php
$result = Process::path(__DIR__)->run('ls -la');
```

<a name="input"></a>
#### 输入

你可以使用 `input` 方法通过进程的"标准输入"提供输入：

```php
$result = Process::input('Hello World')->run('cat');
```

<a name="timeouts"></a>
#### 超时

默认情况下，进程在执行超过 60 秒后会抛出 `Illuminate\Process\Exceptions\ProcessTimedOutException` 实例。不过，你可以通过 `timeout` 方法自定义此行为：

```php
$result = Process::timeout(120)->run('bash import.sh');
```

`timeout` 和 `idleTimeout` 方法也接受 `CarbonInterval` 实例：

```php
use function Illuminate\Support\minutes;

$result = Process::timeout(minutes(2))->run('bash import.sh');
```

或者，如果你想完全禁用进程超时，可以调用 `forever` 方法：

```php
$result = Process::forever()->run('bash import.sh');
```

`idleTimeout` 方法可用于指定进程在未返回任何输出时可运行的最大秒数：

```php
$result = Process::timeout(60)->idleTimeout(30)->run('bash import.sh');
```

<a name="environment-variables"></a>
#### 环境变量

可以通过 `env` 方法向进程提供环境变量。被调用的进程还将继承系统定义的所有环境变量：

```php
$result = Process::forever()
    ->env(['IMPORT_PATH' => __DIR__])
    ->run('bash import.sh');
```

如果你想从被调用的进程中移除一个继承的环境变量，可以为该环境变量提供 `false` 值：

```php
$result = Process::forever()
    ->env(['LOAD_PATH' => false])
    ->run('bash import.sh');
```

<a name="tty-mode"></a>
#### TTY 模式

`tty` 方法可用于为你的进程启用 TTY 模式。TTY 模式将进程的输入和输出连接到程序的输入和输出，使你的进程可以像 Vim 或 Nano 这样的编辑器作为进程打开：

```php
Process::forever()->tty()->run('vim');
```

> [!WARNING]
> Windows 上不支持 TTY 模式。

<a name="process-output"></a>
### 进程输出

如前所述，可以使用进程结果上的 `output`（stdout）和 `errorOutput`（stderr）方法访问进程输出：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

echo $result->output();
echo $result->errorOutput();
```

不过，输出也可以通过向 `run` 方法传递闭包作为第二个参数来实时收集。该闭包将接收两个参数：输出的"类型"（`stdout` 或 `stderr`）和输出字符串本身：

```php
$result = Process::run('ls -la', function (string $type, string $output) {
    echo $output;
});
```

Laravel 还提供了 `seeInOutput` 和 `seeInErrorOutput` 方法，它们提供了一种便捷的方式来判断给定字符串是否包含在进程输出中：

```php
if (Process::run('ls -la')->seeInOutput('laravel')) {
    // ...
}
```

<a name="disabling-process-output"></a>
#### 禁用进程输出

如果你的进程写入了大量你不关心的输出，可以通过完全禁用输出来节省内存。为此，请在构建进程时调用 `quietly` 方法：

```php
use Illuminate\Support\Facades\Process;

$result = Process::quietly()->run('bash import.sh');
```

<a name="process-pipelines"></a>
### 管道

有时你可能希望将一个进程的输出作为另一个进程的输入。这通常被称为将一个进程的输出"管道"给另一个进程。`Process` Facade 提供的 `pipe` 方法使这变得容易。`pipe` 方法将同步执行管道中的进程，并返回管道中最后一个进程的进程结果：

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

如果你不需要自定义构成管道的单个进程，可以直接将命令字符串数组传递给 `pipe` 方法：

```php
$result = Process::pipe([
    'cat example.txt',
    'grep -i "laravel"',
]);
```

可以通过向 `pipe` 方法传递闭包作为第二个参数来实时收集进程输出。该闭包将接收两个参数：输出的"类型"（`stdout` 或 `stderr`）和输出字符串本身：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
}, function (string $type, string $output) {
    echo $output;
});
```

Laravel 还允许你通过 `as` 方法为管道中的每个进程分配字符串键。此键也将传递给提供给 `pipe` 方法的输出闭包，使你可以判断输出属于哪个进程：

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

虽然 `run` 方法同步调用进程，但 `start` 方法可用于异步调用进程。这允许你的应用在进程后台运行时继续执行其他任务。进程被调用后，你可以使用 `running` 方法判断进程是否仍在运行：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    // ...
}

$result = $process->wait();
```

你可能已经注意到，你可以调用 `wait` 方法，直到进程执行完毕并获取 `ProcessResult` 实例：

```php
$process = Process::timeout(120)->start('bash import.sh');

// ...

$result = $process->wait();
```

<a name="process-ids-and-signals"></a>
### 进程 ID 与信号

`id` 方法可用于获取运行进程的操作系统分配的进程 ID：

```php
$process = Process::start('bash import.sh');

return $process->id();
```

你可以使用 `signal` 方法向正在运行的进程发送"信号"。可以在 [PHP 文档](https://www.php.net/manual/en/pcntl.constants.php)中找到预定义的信号常量列表：

```php
$process->signal(SIGUSR2);
```

<a name="asynchronous-process-output"></a>
### 异步进程输出

异步进程运行时，你可以使用 `output` 和 `errorOutput` 方法访问其当前的完整输出；不过，你可以使用 `latestOutput` 和 `latestErrorOutput` 访问自上次检索输出以来进程产生的输出：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    echo $process->latestOutput();
    echo $process->latestErrorOutput();

    sleep(1);
}
```

与 `run` 方法类似，异步进程的输出也可以通过向 `start` 方法传递闭包作为第二个参数来实时收集。该闭包将接收两个参数：输出的"类型"（`stdout` 或 `stderr`）和输出字符串本身：

```php
$process = Process::start('bash import.sh', function (string $type, string $output) {
    echo $output;
});

$result = $process->wait();
```

与其等到进程完成，你可以使用 `waitUntil` 方法基于进程输出停止等待。当提供给 `waitUntil` 方法的闭包返回 `true` 时，Laravel 将停止等待进程完成：

```php
$process = Process::start('bash import.sh');

$process->waitUntil(function (string $type, string $output) {
    return $output === 'Ready...';
});
```

<a name="asynchronous-process-timeouts"></a>
### 异步进程超时

异步进程运行时，你可以使用 `ensureNotTimedOut` 方法验证进程是否超时。如果进程已超时，此方法将抛出[超时异常](#timeouts)：

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

Laravel 还使管理并发、异步进程池变得轻而易举，让你可以轻松地同时执行许多任务。要开始，请调用 `pool` 方法，它接受一个接收 `Illuminate\Process\Pool` 实例的闭包。

在此闭包内，你可以定义属于该池的进程。一旦通过 `start` 方法启动了进程池，你就可以通过 `running` 方法访问正在运行的进程的[集合](/docs/{{version}}/collections)：

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

如你所见，你可以等待所有池进程完成执行，并通过 `wait` 方法解析它们的结果。`wait` 方法返回一个可数组访问的对象，允许你通过键访问池中每个进程的 `ProcessResult` 实例：

```php
$results = $pool->wait();

echo $results[0]->output();
```

或者，为方便起见，可以使用 `concurrently` 方法启动一个异步进程池并立即等待其结果。与 PHP 的数组解构能力结合使用时，这可以提供特别富有表现力的语法：

```php
[$first, $second, $third] = Process::concurrently(function (Pool $pool) {
    $pool->path(__DIR__)->command('ls -la');
    $pool->path(app_path())->command('ls -la');
    $pool->path(storage_path())->command('ls -la');
});

echo $first->output();
```

<a name="naming-pool-processes"></a>
### 为池中进程命名

通过数字键访问进程池结果不太富有表现力；因此，Laravel 允许你通过 `as` 方法为池中的每个进程分配字符串键。此键也将传递给提供给 `start` 方法的闭包，使你可以判断输出属于哪个进程：

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
### 池进程 ID 与信号

由于进程池的 `running` 方法提供了池中所有已调用进程的集合，你可以轻松访问底层池进程 ID：

```php
$processIds = $pool->running()->each->id();
```

并且，为方便起见，你可以在进程池上调用 `signal` 方法，向池中的每个进程发送信号：

```php
$pool->signal(SIGUSR2);
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供功能来帮助你轻松且富有表现力地编写测试，Laravel 的进程服务也不例外。`Process` Facade 的 `fake` 方法允许你指示 Laravel 在调用进程时返回桩（stub）/ 虚拟结果。

<a name="faking-processes"></a>
### 模拟进程

为了探索 Laravel 模拟进程的能力，让我们设想一个调用进程的路由：

```php
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    Process::run('bash import.sh');

    return 'Import complete!';
});
```

测试此路由时，我们可以通过不带参数地调用 `Process` Facade 上的 `fake` 方法，指示 Laravel 为每个被调用的进程返回一个虚拟的、成功的进程结果。此外，我们甚至可以[断言](#available-assertions)某个给定进程已被"运行"：

```php tab=Pest
<?php

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

test('process is invoked', function () {
    Process::fake();

    $response = $this->get('/import');

    // Simple process assertion...
    Process::assertRan('bash import.sh');

    // Or, inspecting the process configuration...
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

        // Simple process assertion...
        Process::assertRan('bash import.sh');

        // Or, inspecting the process configuration...
        Process::assertRan(function (PendingProcess $process, ProcessResult $result) {
            return $process->command === 'bash import.sh' &&
                   $process->timeout === 60;
        });
    }
}
```

如前所述，在 `Process` Facade 上调用 `fake` 方法将指示 Laravel 始终返回一个没有输出的、成功的进程结果。不过，你可以使用 `Process` Facade 的 `result` 方法轻松指定模拟进程的输出和退出码：

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

你可能在之前的示例中注意到，`Process` Facade 允许你通过向 `fake` 方法传递数组，为每个进程指定不同的模拟结果。

数组的键应表示你想要模拟的命令模式及其关联的结果。`*` 字符可以用作通配符。任何未被模拟的进程命令实际上都会被调用。你可以使用 `Process` Facade 的 `result` 方法为这些命令构造桩 / 模拟结果：

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

如果你不需要自定义模拟进程的退出码或错误输出，你可能会发现将模拟进程结果指定为简单字符串更方便：

```php
Process::fake([
    'cat *' => 'Test "cat" output',
    'ls *' => 'Test "ls" output',
]);
```

<a name="faking-process-sequences"></a>
### 模拟进程序列

如果你正在测试的代码使用相同的命令调用多个进程，你可能希望为每次进程调用分配不同的模拟进程结果。你可以通过 `Process` Facade 的 `sequence` 方法实现这一点：

```php
Process::fake([
    'ls *' => Process::sequence()
        ->push(Process::result('First invocation'))
        ->push(Process::result('Second invocation')),
]);
```

<a name="faking-asynchronous-process-lifecycles"></a>
### 模拟异步进程生命周期

到目前为止，我们主要讨论了模拟使用 `run` 方法同步调用的进程。但是，如果你试图测试与通过 `start` 调用的异步进程交互的代码，可能需要更复杂的方法来描述模拟进程。

例如，让我们设想以下与异步进程交互的路由：

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

为了正确模拟此进程，我们需要能够描述 `running` 方法应返回 `true` 的次数。此外，我们可能希望指定应按顺序返回的多行输出。为此，我们可以使用 `Process` Facade 的 `describe` 方法：

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

让我们深入探讨上面的示例。使用 `output` 和 `errorOutput` 方法，我们可以指定应按顺序返回的多行输出。`exitCode` 方法可用于指定模拟进程的最终退出码。最后，`iterations` 方法可用于指定 `running` 方法应返回 `true` 的次数。

<a name="available-assertions"></a>
### 可用的断言

如[前面讨论的](#faking-processes)，Laravel 为你的功能测试提供了几个进程断言。我们将在下面讨论每个断言。

<a name="assert-process-ran"></a>
#### assertRan

断言给定进程已被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertRan('ls -la');
```

当进程以参数数组调用时，你可以向断言传递相同的数组：

```php
Process::assertRan(['php', 'artisan', 'migrate']);
```

`assertRanTimes` 和 `assertDidntRun` 方法也接受数组命令。

`assertRan` 方法还接受一个闭包，它将接收一个进程实例和一个进程结果，允许你检查进程的已配置选项。如果此闭包返回 `true`，断言将"通过"：

```php
Process::assertRan(fn ($process, $result) =>
    $process->command === 'ls -la' &&
    $process->path === __DIR__ &&
    $process->timeout === 60
);
```

传递给 `assertRan` 闭包的 `$process` 是 `Illuminate\Process\PendingProcess` 的一个实例，而 `$result` 是 `Illuminate\Contracts\Process\ProcessResult` 的一个实例。

<a name="assert-process-didnt-run"></a>
#### assertDidntRun

断言给定进程未被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertDidntRun('ls -la');
```

与 `assertRan` 方法一样，`assertDidntRun` 方法也接受一个闭包，它将接收一个进程实例和一个进程结果，允许你检查进程的已配置选项。如果此闭包返回 `true`，断言将"失败"：

```php
Process::assertDidntRun(fn (PendingProcess $process, ProcessResult $result) =>
    $process->command === 'ls -la'
);
```

<a name="assert-process-ran-times"></a>
#### assertRanTimes

断言给定进程已被调用给定次数：

```php
use Illuminate\Support\Facades\Process;

Process::assertRanTimes('ls -la', times: 3);
```

`assertRanTimes` 方法还接受一个闭包，它将接收 `PendingProcess` 和 `ProcessResult` 实例，允许你检查进程的已配置选项。如果此闭包返回 `true` 且进程已被调用指定次数，断言将"通过"：

```php
Process::assertRanTimes(function (PendingProcess $process, ProcessResult $result) {
    return $process->command === 'ls -la';
}, times: 3);
```

<a name="assert-processes-ran-in-order"></a>
#### assertRanInOrder

断言进程已按给定顺序调用：

```php
Process::assertRanInOrder([
    'git fetch',
    'composer install',
]);
```

`assertRanInOrder` 方法接受命令字符串、命令参数数组，或像其他进程断言一样的闭包。

<a name="preventing-stray-processes"></a>
### 阻止意外进程

如果你想确保在你的单个测试或完整测试套件中所有被调用的进程都已被模拟，可以调用 `preventStrayProcesses` 方法。调用此方法后，任何没有对应模拟结果的进程都将抛出异常，而不是启动实际进程：

```php
use Illuminate\Support\Facades\Process;

Process::preventStrayProcesses();

Process::fake([
    'ls *' => 'Test output...',
]);

// Fake response is returned...
Process::run('ls -la');

// An exception is thrown...
Process::run('bash import.sh');
```
