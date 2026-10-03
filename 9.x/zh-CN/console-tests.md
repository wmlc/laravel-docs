# 控制台测试

- [简介](#introduction)
- [成功 / 失败预期](#success-failure-expectations)
- [输入 / 输出预期](#input-output-expectations)

<a name="introduction"></a>
## 简介

除了简化 HTTP 测试之外，Laravel 还提供了简单的 API 用于测试应用的[自定义控制台命令](/docs/{{version}}/artisan)。

<a name="success-failure-expectations"></a>
## 成功 / 失败预期

首先，我们来探讨如何对 Artisan 命令的退出码进行断言。为此，我们将在测试中使用 `artisan` 方法调用一个 Artisan 命令。然后，使用 `assertExitCode` 方法断言命令以给定的退出码结束：

    /**
     * 测试控制台命令。
     *
     * @return void
     */
    public function test_console_command()
    {
        $this->artisan('inspire')->assertExitCode(0);
    }

可以使用 `assertNotExitCode` 方法断言命令没有以给定的退出码结束：

    $this->artisan('inspire')->assertNotExitCode(1);

当然，所有终端命令在成功时通常以状态码 `0` 退出，失败时以非零退出码退出。因此，为方便起见，可以使用 `assertSuccessful` 和 `assertFailed` 断言来断言给定命令是否以成功的退出码退出：

    $this->artisan('inspire')->assertSuccessful();

    $this->artisan('inspire')->assertFailed();

<a name="input-output-expectations"></a>
## 输入 / 输出预期

Laravel 允许通过 `expectsQuestion` 方法轻松为控制台命令"模拟"用户输入。此外，可以使用 `assertExitCode` 和 `expectsOutput` 方法指定期望的退出码和命令输出的文本。例如，考虑以下控制台命令：

    Artisan::command('question', function () {
        $name = $this->ask('What is your name?');

        $language = $this->choice('Which language do you prefer?', [
            'PHP',
            'Ruby',
            'Python',
        ]);

        $this->line('Your name is '.$name.' and you prefer '.$language.'.');
    });

可以使用以下测试来测试此命令，其中用到了 `expectsQuestion`、`expectsOutput`、`doesntExpectOutput`、`expectsOutputToContain`、`doesntExpectOutputToContain` 和 `assertExitCode` 方法：

    /**
     * 测试控制台命令。
     *
     * @return void
     */
    public function test_console_command()
    {
        $this->artisan('question')
             ->expectsQuestion('What is your name?', 'Taylor Otwell')
             ->expectsQuestion('Which language do you prefer?', 'PHP')
             ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
             ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
             ->expectsOutputToContain('Taylor Otwell')
             ->doesntExpectOutputToContain('you prefer Ruby')
             ->assertExitCode(0);
    }

<a name="confirmation-expectations"></a>
#### 确认预期

当编写的命令需要以"yes"或"no"形式的确认回答时，可以使用 `expectsConfirmation` 方法：

    $this->artisan('module:import')
        ->expectsConfirmation('Do you really wish to run this command?', 'no')
        ->assertExitCode(1);

<a name="table-expectations"></a>
#### 表格预期

如果命令使用 Artisan 的 `table` 方法显示信息表格，为整个表格编写输出预期会相当繁琐。此时可以使用 `expectsTable` 方法。该方法接受表格的表头作为第一个参数，表格数据作为第二个参数：

    $this->artisan('users:all')
        ->expectsTable([
            'ID',
            'Email',
        ], [
            [1, 'taylor@example.com'],
            [2, 'abigail@example.com'],
        ]);
