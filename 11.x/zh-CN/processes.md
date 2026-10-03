# 进程

- [简介](#introduction)
- [调用进程](#invoking-processes)
    - [进程选项](#process-options)
    - [进程输出](#process-output)
    - [管道](#process-pipelines)
- [异步进程](#asynchronous-processes)
    - [进程 ID 与信号](#process-ids-and-signals)
    - [异步进程输出](#asynchronous-process-output)
- [并发进程](#concurrent-processes)
    - [为池中进程命名](#naming-pool-processes)
    - [进程池的 ID 与信号](#pool-process-ids-and-signals)
- [测试](#testing)
    - [模拟进程](#faking-processes)
    - [模拟指定进程](#faking-specific-processes)
    - [模拟进程序列](#faking-process-sequences)
    - [模拟异步进程生命周期](#faking-asynchronous-process-lifecycles)
    - [可用断言](#available-assertions)
    - [防止意外执行的进程](#preventing-stray-processes)

<a name="introduction"></a>
## 简介

Laravel 在 [Symfony Process 组件](https://symfony.com/doc/7.0/components/process.html)之上提供了一套表达力强且极简的 API，让你能够方便地从 Laravel 应用中调用外部进程。Laravel 的进程功能聚焦于最常见的用例，并带来出色的开发体验。

<a name="invoking-processes"></a>
## 调用进程

要调用进程，可以使用 `Process` Facade 提供的 `run` 和 `start` 方法。`run` 方法会调用进程并等待该进程执行完毕，而 `start` 方法用于异步执行进程。本文档会介绍这两种方式。首先，我们来看如何调用一个基本的同步进程并检查其结果：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

return $result->output();
```

当然，`run` 方法返回的 `Illuminate\Contracts\Process\ProcessResult` 实例提供了多种便于检查进程结果的方法：

```php
$result = Process::run('ls -la');

$result->successful();
$result->failed();
$result->exitCode();
$result->output();
$result->errorOutput();
```

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你拿到了进程结果，并希望在退出码大于零（即表示失败）时抛出 `Illuminate\Process\Exceptions\ProcessFailedException` 实例，可以使用 `throw` 和 `throwIf` 方法。如果进程没有失败，则会返回进程结果实例：

```php
$result = Process::run('ls -la')->throw();

$result = Process::run('ls -la')->throwIf($condition);
```

<a name="process-options"></a>
### 进程选项

当然，你可能需要在调用进程之前自定义其行为。幸运的是，Laravel 允许你调整各种进程特性，例如工作目录、超时以及环境变量。

<a name="working-directory-path"></a>
#### 工作目录路径

你可以使用 `path` 方法指定进程的工作目录。如果不调用该方法，进程将继承当前执行的 PHP 脚本的工作目录：

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

默认情况下，进程执行超过 60 秒后会抛出 `Illuminate\Process\Exceptions\ProcessTimedOutException` 实例。不过，你可以通过 `timeout` 方法自定义该行为：

```php
$result = Process::timeout(120)->run('bash import.sh');
```

或者，如果你想完全禁用进程超时，可以调用 `forever` 方法：

```php
$result = Process::forever()->run('bash import.sh');
```

`idleTimeout` 方法可用于指定进程在未返回任何输出的情况下最多可以运行的秒数：

```php
$result = Process::timeout(60)->idleTimeout(30)->run('bash import.sh');
```

<a name="environment-variables"></a>
#### 环境变量

可以通过 `env` 方法向进程提供环境变量。被调用的进程还会继承你系统定义的所有环境变量：

```php
$result = Process::forever()
    ->env(['IMPORT_PATH' => __DIR__])
    ->run('bash import.sh');
```

如果你希望从被调用的进程中移除某个继承而来的环境变量，可以把该环境变量的值设为 `false`：

```php
$result = Process::forever()
    ->env(['LOAD_PATH' => false])
    ->run('bash import.sh');
```

<a name="tty-mode"></a>
#### TTY 模式

`tty` 方法可用于为你的进程启用 TTY 模式。TTY 模式把进程的输入输出与你程序的输入输出连接起来，让你的进程能够打开 Vim 或 Nano 这类编辑器：

```php
Process::forever()->tty()->run('vim');
```

<a name="process-output"></a>
### 进程输出

如前所述，可以使用进程结果上的 `output`（stdout）和 `errorOutput`（stderr）方法访问进程输出：

```php
use Illuminate\Support\Facades\Process;

$result = Process::run('ls -la');

echo $result->output();
echo $result->errorOutput();
```

不过，你也可以把闭包作为 `run` 方法的第二个参数，实时收集输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::run('ls -la', function (string $type, string $output) {
    echo $output;
});
```

Laravel 还提供 `seeInOutput` 和 `seeInErrorOutput` 方法，便于判断给定字符串是否出现在进程输出中：

```php
if (Process::run('ls -la')->seeInOutput('laravel')) {
    // ...
}
```

<a name="disabling-process-output"></a>
#### 禁用进程输出

如果你的进程会输出大量你并不关心的内容，可以通过完全禁用输出检索来节省内存。为此，在构建进程时调用 `quietly` 方法：

```php
use Illuminate\Support\Facades\Process;

$result = Process::quietly()->run('bash import.sh');
```

<a name="process-pipelines"></a>
### 管道

有时你可能希望把一个进程的输出作为另一个进程的输入。这通常被称为把进程的输出"管道"给另一个进程。`Process` Facade 提供的 `pipe` 方法让这件事变得简单。`pipe` 方法会同步执行被管道连接的各个进程，并返回管道中最后一个进程的进程结果：

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

如果你不需要自定义组成管道的各个进程，可以直接把一个命令字符串数组传给 `pipe` 方法：

```php
$result = Process::pipe([
    'cat example.txt',
    'grep -i "laravel"',
]);
```

你可以把闭包作为 `pipe` 方法的第二个参数，实时收集进程输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->command('cat example.txt');
    $pipe->command('grep -i "laravel"');
}, function (string $type, string $output) {
    echo $output;
});
```

Laravel 还允许你通过 `as` 方法为管道内的每个进程分配字符串键。该键也会被传给 `pipe` 方法所接收的输出闭包，从而让你判断输出来自哪个进程：

```php
$result = Process::pipe(function (Pipe $pipe) {
    $pipe->as('first')->command('cat example.txt');
    $pipe->as('second')->command('grep -i "laravel"');
})->start(function (string $type, string $output, string $key) {
    // ...
});
```

<a name="asynchronous-processes"></a>
## 异步进程

`run` 方法同步调用进程，而 `start` 方法可用于异步调用进程。这让你的应用可以在进程于后台运行时继续执行其他任务。进程被调用之后，你可以使用 `running` 方法判断该进程是否仍在运行：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    // ...
}

$result = $process->wait();
```

如你所见，你可以调用 `wait` 方法等待进程执行完毕，并获取进程结果实例：

```php
$process = Process::timeout(120)->start('bash import.sh');

// ...

$result = $process->wait();
```

<a name="process-ids-and-signals"></a>
### 进程 ID 与信号

`id` 方法可用于获取操作系统分配给运行中进程的进程 ID：

```php
$process = Process::start('bash import.sh');

return $process->id();
```

你可以使用 `signal` 方法向运行中的进程发送"信号"。预定义信号常量的列表可以在 [PHP 文档](https://www.php.net/manual/en/pcntl.constants.php)中查到：

```php
$process->signal(SIGUSR2);
```

<a name="asynchronous-process-output"></a>
### 异步进程输出

在异步进程运行期间，你可以使用 `output` 和 `errorOutput` 方法访问它当前的全部输出；不过，你也可以使用 `latestOutput` 和 `latestErrorOutput` 访问上次获取输出之后新产生的输出：

```php
$process = Process::timeout(120)->start('bash import.sh');

while ($process->running()) {
    echo $process->latestOutput();
    echo $process->latestErrorOutput();

    sleep(1);
}
```

与 `run` 方法一样，你也可以把闭包作为 `start` 方法的第二个参数，实时收集异步进程的输出。该闭包会接收两个参数：输出的"类型"（`stdout` 或 `stderr`）以及输出字符串本身：

```php
$process = Process::start('bash import.sh', function (string $type, string $output) {
    echo $output;
});

$result = $process->wait();
```

你不必一直等到进程执行结束，而可以使用 `waitUntil` 方法根据进程输出决定何时停止等待。当传给 `waitUntil` 方法的闭包返回 `true` 时，Laravel 就会停止等待该进程执行完毕：

```php
$process = Process::start('bash import.sh');

$process->waitUntil(function (string $type, string $output) {
    return $output === 'Ready...';
});
```

<a name="concurrent-processes"></a>
## 并发进程

Laravel 还让你可以轻松管理一组并发的异步进程，方便你同时执行许多任务。要开始使用，调用 `pool` 方法，该方法接受一个闭包，闭包会收到一个 `Illuminate\Process\Pool` 实例。

在该闭包内部，你可以定义属于这个池的各个进程。一旦通过 `start` 方法启动了进程池，就可以使用 `running` 方法访问正在运行的进程的[集合](/docs/{{version}}/collections)：

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

如你所见，你可以通过 `wait` 方法等待池中所有进程执行完毕并解析它们的结果。`wait` 方法返回一个可按数组访问的对象，让你可以通过键访问池中每个进程的进程结果实例：

```php
$results = $pool->wait();

echo $results[0]->output();
```

或者，为方便起见，你可以使用 `concurrently` 方法启动一个异步进程池并立即等待其结果。当与 PHP 的数组解构能力结合使用时，这能提供非常有表现力的语法：

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

通过数字键访问进程池结果并不具有太强的表达力，因此 Laravel 允许你通过 `as` 方法为池中每个进程分配字符串键。该键也会被传给 `start` 方法所接收的闭包，从而让你判断输出来自哪个进程：

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
### 进程池的 ID 与信号

由于进程池的 `running` 方法提供了池内所有已调用进程的集合，你可以轻松访问底层的进程池进程 ID：

```php
$processIds = $pool->running()->each->id();
```

此外，为方便起见，你可以在进程池上调用 `signal` 方法，向池中每个进程发送信号：

```php
$pool->signal(SIGUSR2);
```

<a name="testing"></a>
## 测试

Laravel 的许多服务都提供了帮助你轻松且富有表达力地编写测试的功能，Laravel 的进程服务也不例外。`Process` Facade 的 `fake` 方法允许你指示 Laravel 在调用进程时返回存根 / 虚拟结果。

<a name="faking-processes"></a>
### 模拟进程

为了探索 Laravel 模拟进程的能力，我们假设有一条会调用进程的路由：

```php
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

Route::get('/import', function () {
    Process::run('bash import.sh');

    return 'Import complete!';
});
```

测试这条路由时，我们可以不带参数调用 `Process` Facade 上的 `fake` 方法，指示 Laravel 为每个被调用的进程返回一个模拟的、成功的结果。此外，我们甚至可以[断言](#available-assertions)某个给定进程是否已"运行"：

```php tab=Pest
<?php

use Illuminate\Process\PendingProcess;
use Illuminate\Contracts\Process\ProcessResult;
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

use Illuminate\Process\PendingProcess;
use Illuminate\Contracts\Process\ProcessResult;
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

如前所述，在 `Process` Facade 上调用 `fake` 方法，会指示 Laravel 始终返回一个不含输出的成功进程结果。不过，你也可以使用 `Process` Facade 的 `result` 方法，轻松地为模拟进程指定输出和退出码：

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
### 模拟指定进程

正如你在前面的示例中看到的，`Process` Facade 允许你通过向 `fake` 方法传入数组，为不同进程指定不同的模拟结果。

该数组的键应当代表你希望模拟的命令模式及其对应结果。`*` 字符可用作通配符。任何未被模拟的进程命令都会被真正执行。你可以使用 `Process` Facade 的 `result` 方法为这些命令构建存根 / 模拟结果：

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

如果你不需要自定义模拟进程的退出码或错误输出，把模拟的进程结果直接指定为简单字符串可能会更方便：

```php
Process::fake([
    'cat *' => 'Test "cat" output',
    'ls *' => 'Test "ls" output',
]);
```

<a name="faking-process-sequences"></a>
### 模拟进程序列

如果你正在测试的代码会以相同命令调用多个进程，你可能希望为每次进程调用分配不同的模拟进程结果。你可以通过 `Process` Facade 的 `sequence` 方法来实现：

```php
Process::fake([
    'ls *' => Process::sequence()
        ->push(Process::result('First invocation'))
        ->push(Process::result('Second invocation')),
]);
```

<a name="faking-asynchronous-process-lifecycles"></a>
### 模拟异步进程生命周期

到目前为止，我们主要讨论的是通过 `run` 方法同步调用的进程模拟。不过，如果你要测试的是与通过 `start` 方法调用的异步进程交互的代码，可能需要一种更精细的方式来描述你的模拟进程。

例如，假设有下面这条与异步进程交互的路由：

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

要正确模拟这个进程，我们需要能够描述 `running` 方法应当返回 `true` 多少次。此外，我们可能还希望指定多行按顺序返回的输出。为此，可以使用 `Process` Facade 的 `describe` 方法：

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

我们来深入看看上面的示例。通过 `output` 和 `errorOutput` 方法，可以指定多行按顺序返回的输出。`exitCode` 方法可用于指定模拟进程的最终退出码。最后，`iterations` 方法可用于指定 `running` 方法应当返回 `true` 多少次。

<a name="available-assertions"></a>
### 可用断言

如[前面所述](#faking-processes)，Laravel 为你的功能测试提供了若干进程断言。下面我们逐一介绍这些断言。

<a name="assert-process-ran"></a>
#### assertRan

断言某个给定进程已被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertRan('ls -la');
```

`assertRan` 方法还接受一个闭包，该闭包会收到一个进程实例和一个进程结果，让你能够检查该进程所配置的选项。如果该闭包返回 `true`，断言就会"通过"：

```php
Process::assertRan(fn ($process, $result) =>
    $process->command === 'ls -la' &&
    $process->path === __DIR__ &&
    $process->timeout === 60
);
```

传给 `assertRan` 闭包的 `$process` 是 `Illuminate\Process\PendingProcess` 的实例，而 `$result` 则是 `Illuminate\Contracts\Process\ProcessResult` 的实例。

<a name="assert-process-didnt-run"></a>
#### assertDidntRun

断言某个给定进程未被调用：

```php
use Illuminate\Support\Facades\Process;

Process::assertDidntRun('ls -la');
```

与 `assertRan` 方法一样，`assertDidntRun` 方法也接受一个闭包，该闭包会收到一个进程实例和一个进程结果，让你能够检查该进程所配置的选项。如果该闭包返回 `true`，断言就会"失败"：

```php
Process::assertDidntRun(fn (PendingProcess $process, ProcessResult $result) =>
    $process->command === 'ls -la'
);
```

<a name="assert-process-ran-times"></a>
#### assertRanTimes

断言某个给定进程被调用了指定次数：

```php
use Illuminate\Support\Facades\Process;

Process::assertRanTimes('ls -la', times: 3);
```

`assertRanTimes` 方法还接受一个闭包，该闭包会收到一个进程实例和一个进程结果，让你能够检查该进程所配置的选项。如果该闭包返回 `true` 且该进程确实被调用了指定次数，断言就会"通过"：

```php
Process::assertRanTimes(function (PendingProcess $process, ProcessResult $result) {
    return $process->command === 'ls -la';
}, times: 3);
```

<a name="preventing-stray-processes"></a>
### 防止意外执行的进程

如果你希望确保在某个单独测试或整个测试套件中被调用的所有进程都已模拟，可以调用 `preventStrayProcesses` 方法。调用该方法之后，任何没有对应模拟结果的进程都会抛出异常，而不是真正启动进程：

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