# 控制台测试

- [简介](#introduction)
- [成功 / 失败预期](#success-failure-expectations)
- [输入 / 输出预期](#input-output-expectations)
- [控制台事件](#console-events)

<a name="introduction"></a>
## 简介

除了简化 HTTP 测试之外，Laravel 还提供了一个简单的 API 来测试你的应用程序的 [自定义控制台命令](/docs/{{version}}/artisan)。

<a name="success-failure-expectations"></a>
## 成功 / 失败预期

我们先来了解如何对 Artisan 命令的退出码做出断言。为此，我们将使用 `artisan` 方法从测试中调用一个 Artisan 命令。然后，我们将使用 `assertExitCode` 方法来断言该命令以给定的退出码完成：

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

你可以使用 `assertNotExitCode` 方法来断言命令未以给定的退出码退出：

```php
$this->artisan('inspire')->assertNotExitCode(1);
```

当然，所有终端命令在成功时通常以状态码 `0` 退出，不成功时以非零退出码退出。因此，为方便起见，你可以使用 `assertSuccessful` 和 `assertFailed` 断言来断言给定命令是否以成功的退出码退出：

```php
$this->artisan('inspire')->assertSuccessful();

$this->artisan('inspire')->assertFailed();
```

<a name="input-output-expectations"></a>
## 输入 / 输出预期

Laravel 允许你使用 `expectsQuestion` 方法轻松地为你的控制台命令“模拟”用户输入。此外，你可以使用 `assertExitCode` 和 `expectsOutput` 方法来指定你期望控制台命令输出的退出码和文本。例如，考虑以下控制台命令：

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

你可以使用以下测试来测试该命令：

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

如果你正在使用 [Laravel Prompts](/docs/{{version}}/prompts) 提供的 `search` 或 `multisearch` 函数，可以使用 `expectsSearch` 断言来模拟用户的输入、搜索结果与选择：

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

你也可以使用 `doesntExpectOutput` 方法来断言控制台命令未生成任何输出：

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

`expectsOutputToContain` 和 `doesntExpectOutputToContain` 方法可用于对输出的部分内容做出断言：

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
#### 确认预期

当编写一个期望以“yes”或“no”形式进行确认的命令时，可以使用 `expectsConfirmation` 方法：

```php
$this->artisan('module:import')
    ->expectsConfirmation('Do you really wish to run this command?', 'no')
    ->assertExitCode(1);
```

<a name="table-expectations"></a>
#### 表格预期

如果你的命令使用 Artisan 的 `table` 方法显示信息表格，为整个表格编写输出预期会很麻烦。相反，你可以使用 `expectsTable` 方法。该方法接受表格的表头作为第一个参数，表格的数据作为第二个参数：

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

默认情况下，在运行应用程序的测试时，不会派发 `Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished` 事件。不过，你可以通过将 `Illuminate\Foundation\Testing\WithConsoleEvents` trait 添加到该类，来为给定的测试类启用这些事件：

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
