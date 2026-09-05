# 控制台测试

## 简介

除了简化 HTTP 测试，Laravel 还提供了一个简洁的 API，用于测试应用的 [自定义控制台命令](/docs/{{version}}/artisan)。

## 成功 / 失败预期

作为入门，我们先看如何对 Artisan 命令的退出码进行断言。可以使用测试中的 `artisan` 方法来调用 Artisan 命令，然后通过 `assertExitCode` 方法断言命令以指定退出码结束：

```php tab=Pest
test('console command', function () {
    $this->artisan('inspire')->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('inspire')->assertExitCode(0);
}
```

也可以使用 `assertNotExitCode` 方法断言命令**没有**以某个退出码结束：

```php
$this->artisan('inspire')->assertNotExitCode(1);
```

默认情况下，所有终端命令成功执行时通常以 `0` 退出码结束，失败时则是非零退出码。因此，为了方便起见，可以使用 `assertSuccessful` 与 `assertFailed` 断言方法，快速断言命令是否成功退出：

```php
$this->artisan('inspire')->assertSuccessful();

$this->artisan('inspire')->assertFailed();
```

## 输入 / 输出预期

Laravel 让你可以方便地用 `expectsQuestion` 方法对控制台命令的"用户输入"做 Mock。此外，还可以用 `assertExitCode` 与 `expectsOutput` 指定命令预期的退出码与输出文本。例如，请看下面的控制台命令：

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

可以使用下面的测试来验证该命令：

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
 * 测试控制台命令。
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

如果你使用的是 [Laravel Prompts](/docs/{{version}}/prompts) 提供的 `search` 或 `multisearch` 函数，可以用 `expectsSearch` 断言来 Mock 用户的输入、搜索结果以及选项：

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
 * 测试控制台命令。
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

也可以使用 `doesntExpectOutput` 方法断言命令不产生任何输出：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
}
```

`expectsOutputToContain` 和 `doesntExpectOutputToContain` 方法可用于对输出的某一部分做断言：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
}
```

#### 确认预期

当命令期待用户以"是 / 否"作答时，可以使用 `expectsConfirmation` 方法：

```php
$this->artisan('module:import')
    ->expectsConfirmation('Do you really wish to run this command?', 'no')
    ->assertExitCode(1);
```

#### 表格预期

如果命令使用 Artisan 的 `table` 方法显示信息表格，为整个表格写输出预期会很麻烦。此时可以使用 `expectsTable` 方法：第一个参数为表头，第二个参数为表格数据：

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

## 控制台事件

默认情况下，`Illuminate\Console\Events\CommandStarting` 与 `Illuminate\Console\Events\CommandFinished` 事件不会在运行应用测试时被分发。但是，可以通过给测试类添加 `Illuminate\Foundation\Testing\WithConsoleEvents` trait 来为某个测试类启用这些事件：

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
