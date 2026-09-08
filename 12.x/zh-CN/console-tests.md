# 控制台测试

- [简介](#introduction)
- [成功 / 失败断言](#success-failure-expectations)
- [输入 / 输出断言](#input-output-expectations)
- [控制台事件](#console-events)

<a name="introduction"></a>
## 简介

除了简化 HTTP 测试之外，Laravel 还提供了一套简单的 API，用于测试应用的[自定义控制台命令](/docs/{{version}}/artisan)。

<a name="success-failure-expectations"></a>
## 成功 / 失败断言

首先，我们来探讨如何对 Artisan 命令的退出码进行断言。为此，我们将在测试中使用 `artisan` 方法调用一个 Artisan 命令，然后使用 `assertExitCode` 方法断言命令以指定的退出码结束：

```php tab=Pest
test('console command', function () {
    $this->artisan('inspire')->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试一个控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('inspire')->assertExitCode(0);
}
```

你可以使用 `assertNotExitCode` 方法断言命令没有以指定的退出码结束：

```php
$this->artisan('inspire')->assertNotExitCode(1);
```

当然，所有终端命令成功时通常以状态码 `0` 退出，失败时则以非零退出码退出。因此，为方便起见，你可以使用 `assertSuccessful` 和 `assertFailed` 断言来断言指定命令是否以成功的退出码结束：

```php
$this->artisan('inspire')->assertSuccessful();

$this->artisan('inspire')->assertFailed();
```

<a name="input-output-expectations"></a>
## 输入 / 输出断言

Laravel 让你能够通过 `expectsQuestion` 方法轻松地「模拟」控制台命令的用户输入。此外，你还可以使用 `assertExitCode` 和 `expectsOutput` 方法，指定期望控制台命令输出的退出码和文本。例如，考虑以下控制台命令：

```php
Artisan::command('question', function () {
    $name = $this->ask('What is your name?');

    $language = $this->choice('Which language do you prefer?', [
        'PHP',
        'Ruby',
        'Python',
    ]);

    $this->line('Your name is '.$name.' and you prefer '.$language.'.');
});
```

你可以使用以下测试来测试这个命令：

```php tab=Pest
test('console command', function () {
    $this->artisan('question')
        ->expectsQuestion('What is your name?', 'Taylor Otwell')
        ->expectsQuestion('Which language do you prefer?', 'PHP')
        ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
        ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试一个控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('question')
        ->expectsQuestion('What is your name?', 'Taylor Otwell')
        ->expectsQuestion('Which language do you prefer?', 'PHP')
        ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
        ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
        ->assertExitCode(0);
}
```

如果你使用了 [Laravel Prompts](/docs/{{version}}/prompts) 提供的 `search` 或 `multisearch` 函数，可以使用 `expectsSearch` 断言来模拟用户的输入、搜索结果和选择：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->expectsSearch('What is your name?', search: 'Tay', answers: [
            'Taylor Otwell',
            'Taylor Swift',
            'Darian Taylor'
        ], answer: 'Taylor Otwell')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试一个控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->expectsSearch('What is your name?', search: 'Tay', answers: [
            'Taylor Otwell',
            'Taylor Swift',
            'Darian Taylor'
        ], answer: 'Taylor Otwell')
        ->assertExitCode(0);
}
```

你还可以使用 `doesntExpectOutput` 方法断言控制台命令不产生任何输出：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试一个控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
}
```

`expectsOutputToContain` 和 `doesntExpectOutputToContain` 方法可用于对输出的部分内容进行断言：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试一个控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
}
```

<a name="confirmation-expectations"></a>
#### 确认断言

当编写的命令需要用户以「yes」或「no」的形式进行确认时，可以使用 `expectsConfirmation` 方法：

```php
$this->artisan('module:import')
    ->expectsConfirmation('Do you really wish to run this command?', 'no')
    ->assertExitCode(1);
```

<a name="table-expectations"></a>
#### 表格断言

如果你的命令使用 Artisan 的 `table` 方法展示信息表格，为整张表格编写输出断言会很繁琐。这时可以使用 `expectsTable` 方法。该方法第一个参数接收表格的表头，第二个参数接收表格的数据：

```php
$this->artisan('users:all')
    ->expectsTable([
        'ID',
        'Email',
    ], [
        [1, 'taylor@example.com'],
        [2, 'abigail@example.com'],
    ]);
```

<a name="console-events"></a>
## 控制台事件

默认情况下，运行应用的测试时不会分发 `Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished` 事件。不过，你可以通过在测试类中添加 `Illuminate\Foundation\Testing\WithConsoleEvents` Trait，为该测试类启用这些事件：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\WithConsoleEvents;

pest()->use(WithConsoleEvents::class);

// ...
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithConsoleEvents;
use Tests\TestCase;

class ConsoleEventTest extends TestCase
{
    use WithConsoleEvents;

    // ...
}
```
