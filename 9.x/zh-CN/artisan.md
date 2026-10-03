# Artisan 控制台

- [简介](#introduction)
    - [Tinker (REPL)](#tinker)
- [编写命令](#writing-commands)
    - [生成命令](#generating-commands)
    - [命令结构](#command-structure)
    - [闭包命令](#closure-commands)
    - [可隔离命令](#isolatable-commands)
- [定义输入期望](#defining-input-expectations)
    - [参数](#arguments)
    - [选项](#options)
    - [输入数组](#input-arrays)
    - [输入描述](#input-descriptions)
- [命令输入/输出](#command-io)
    - [检索输入](#retrieving-input)
    - [提示输入](#prompting-for-input)
    - [写入输出](#writing-output)
- [注册命令](#registering-commands)
- [以编程方式执行命令](#programmatically-executing-commands)
    - [从其他命令调用命令](#calling-commands-from-other-commands)
- [信号处理](#signal-handling)
- [自定义存根](#stub-customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

Artisan 是 Laravel 内置的命令行接口。Artisan 位于应用根目录下的 `artisan` 脚本中，提供了许多有用的命令来辅助你构建应用。要查看所有可用的 Artisan 命令列表，可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还包含一个「帮助」界面，用于显示和描述命令的可用参数和选项。要查看帮助界面，请在命令名称前加上 `help`：

```shell
php artisan help migrate
```

<a name="laravel-sail"></a>
#### Laravel Sail

如果你使用 [Laravel Sail](/docs/{{version}}/sail) 作为本地开发环境，请记住使用 `sail` 命令行来调用 Artisan 命令。Sail 会在应用的 Docker 容器中执行你的 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

<a name="tinker"></a>
### Tinker (REPL)

Laravel Tinker 是 Laravel 框架的强大 REPL，由 [PsySH](https://github.com/bobthecow/psysh) 包驱动。

<a name="installation"></a>
#### 安装

所有 Laravel 应用默认都包含 Tinker。但是，如果你之前从应用中移除了 Tinker，可以使用 Composer 安装：

```shell
composer require laravel/tinker
```

> **Note**
> 想要图形化界面来与 Laravel 应用交互？查看 [Tinkerwell](https://tinkerwell.app)！

<a name="usage"></a>
#### 用法

Tinker 允许你在命令行上与整个 Laravel 应用交互，包括 Eloquent 模型、任务、事件等。要进入 Tinker 环境，请运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> **Warning**
> `dispatch` 辅助函数和 `Dispatchable` 类上的 `dispatch` 方法依赖垃圾回收将任务放入队列。因此，使用 tinker 时，你应当使用 `Bus::dispatch` 或 `Queue::push` 来分发任务。

<a name="command-allow-list"></a>
#### 命令允许列表

Tinker 使用「允许」列表来确定哪些 Artisan 命令可以在其 shell 中运行。默认情况下，你可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`optimize` 和 `up` 命令。如果你想允许更多命令，可以将它们添加到 `tinker.php` 配置文件的 `commands` 数组中：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

<a name="classes-that-should-not-be-aliased"></a>
#### 不应被别名的类

通常，Tinker 会在你与其交互时自动为类别名。但是，你可能希望某些类永不被别名。你可以通过在 `tinker.php` 配置文件的 `dont_alias` 数组中列出这些类来实现：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

<a name="writing-commands"></a>
## 编写命令

除了 Artisan 提供的命令外，你还可以构建自己的自定义命令。命令通常存储在 `app/Console/Commands` 目录中；但是，只要你的命令能被 Composer 加载，你可以自由选择存储位置。

<a name="generating-commands"></a>
### 生成命令

要创建新命令，可以使用 `make:command` Artisan 命令。此命令将在 `app/Console/Commands` 目录中创建新的命令类。如果应用中不存在此目录也不必担心——首次运行 `make:command` Artisan 命令时会自动创建：

```shell
php artisan make:command SendEmails
```

<a name="command-structure"></a>
### 命令结构

生成命令后，你应当为类的 `signature` 和 `description` 属性定义适当的值。这些属性将在 `list` 界面显示命令时使用。`signature` 属性还允许你定义[命令的输入期望](#defining-input-expectations)。`handle` 方法将在命令执行时被调用。你可以将命令逻辑放在此方法中。

让我们看一个示例命令。注意，我们可以通过命令的 `handle` 方法请求所需的任何依赖。Laravel [服务容器](/docs/{{version}}/container) 会自动注入此方法签名中类型提示的所有依赖：

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Console\Command;

class SendEmails extends Command
{
    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    /**
     * 控制台命令描述。
     *
     * @var string
     */
    protected $description = 'Send a marketing email to a user';

    /**
     * 执行控制台命令。
     *
     * @param  \App\Support\DripEmailer  $drip
     * @return mixed
     */
    public function handle(DripEmailer $drip)
    {
        $drip->send(User::find($this->argument('user')));
    }
}
```

> **Note**
> 为了更好的代码复用，保持控制台命令轻量并让它们委托应用服务来完成任务是良好的实践。在上面的示例中，注意我们注入了一个服务类来完成发送邮件的「繁重工作」。

<a name="closure-commands"></a>
### 闭包命令

基于闭包的命令提供了一种将控制台命令定义为类的替代方式。就像路由闭包是控制器的替代一样，可以将命令闭包视为命令类的替代。在 `app/Console/Kernel.php` 文件的 `commands` 方法中，Laravel 加载 `routes/console.php` 文件：

```php
/**
 * 为应用注册基于闭包的命令。
 *
 * @return void
 */
protected function commands()
{
    require base_path('routes/console.php');
}
```

尽管此文件不定义 HTTP 路由，但它定义了基于控制台的应用入口点（路由）。在此文件中，你可以使用 `Artisan::command` 方法定义所有基于闭包的控制台命令。`command` 方法接受两个参数：[命令签名](#defining-input-expectations)和一个接收命令参数和选项的闭包：

```php
Artisan::command('mail:send {user}', function ($user) {
    $this->info("Sending email to: {$user}!");
});
```

闭包绑定到底层命令实例，因此你可以完全访问通常在完整命令类上能够访问的所有辅助方法。

<a name="type-hinting-dependencies"></a>
#### 类型提示依赖

除了接收命令的参数和选项外，命令闭包还可以类型提示你希望从[服务容器](/docs/{{version}}/container)中解析的额外依赖：

```php
use App\Models\User;
use App\Support\DripEmailer;

Artisan::command('mail:send {user}', function (DripEmailer $drip, $user) {
    $drip->send(User::find($user));
});
```

<a name="closure-command-descriptions"></a>
#### 闭包命令描述

定义基于闭包的命令时，可以使用 `purpose` 方法为命令添加描述。运行 `php artisan list` 或 `php artisan help` 命令时会显示此描述：

```php
Artisan::command('mail:send {user}', function ($user) {
    // ...
})->purpose('Send a marketing email to a user');
```

<a name="isolatable-commands"></a>
### 可隔离命令

> **Warning**
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

有时你可能希望确保命令一次只能运行一个实例。为此，你可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

class SendEmails extends Command implements Isolatable
{
    // ...
}
```

当命令被标记为 `Isolatable` 时，Laravel 会自动为命令添加 `--isolated` 选项。当使用该选项调用命令时，Laravel 会确保该命令没有其他实例正在运行。Laravel 通过使用应用的默认缓存驱动尝试获取原子锁来实现这一点。如果命令的其他实例正在运行，该命令将不会执行；但是，命令仍将以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果你想指定命令无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供所需的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

<a name="lock-expiration-time"></a>
#### 锁过期时间

默认情况下，隔离锁在命令完成后过期。或者，如果命令被中断且无法完成，锁将在一小时后过期。但是，你可以通过在命令上定义 `isolationLockExpiresAt` 方法来调整锁过期时间：

```php
/**
 * 确定命令的隔离锁何时过期。
 *
 * @return \DateTimeInterface|\DateInterval
 */
public function isolationLockExpiresAt()
{
    return now()->addMinutes(5);
}
```

<a name="defining-input-expectations"></a>
## 定义输入期望

编写控制台命令时，通常需要通过参数或选项从用户收集输入。Laravel 让你能够非常方便地使用命令的 `signature` 属性来定义期望从用户获取的输入。`signature` 属性允许你使用单一的表达式路由式语法定义命令的名称、参数和选项。

<a name="arguments"></a>
### 参数

所有用户提供的参数和选项都包含在花括号中。在以下示例中，命令定义了一个必需参数：`user`：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

你还可以将参数设为可选或为参数定义默认值：

```php
// 可选参数...
'mail:send {user?}'

// 带默认值的可选参数...
'mail:send {user=foo}'
```

<a name="options"></a>
### 选项

选项与参数类似，是另一种用户输入形式。选项通过命令行提供时以两个连字符（`--`）为前缀。选项有两种类型：接收值和不接收值。不接收值的选项充当布尔「开关」。让我们看看这种选项的示例：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在此示例中，调用 Artisan 命令时可以指定 `--queue` 开关。如果传递了 `--queue` 开关，选项的值将为 `true`。否则，值将为 `false`：

```shell
php artisan mail:send 1 --queue
```

<a name="options-with-values"></a>
#### 带值的选项

接下来，让我们看看期望接收值的选项。如果用户必须为选项指定值，你应当在选项名称后加上 `=` 符号：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在此示例中，用户可以像这样为选项传递值。如果调用命令时未指定选项，其值将为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

你可以通过在选项名称后指定默认值来为选项分配默认值。如果用户未传递选项值，将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

<a name="option-shortcuts"></a>
#### 选项快捷方式

定义选项时，要分配快捷方式，可以在选项名称前指定它，并使用 `|` 字符作为分隔符将快捷方式与完整选项名称分开：

```php
'mail:send {user} {--Q|queue}'
```

在终端调用命令时，选项快捷方式应以单个连字符为前缀：

```shell
php artisan mail:send 1 -Q
```

<a name="input-arrays"></a>
### 输入数组

如果你想定义参数或选项以期望多个输入值，可以使用 `*` 字符。首先，让我们看看指定此类参数的示例：

```php
'mail:send {user*}'
```

调用此方法时，`user` 参数可以按顺序传递到命令行。例如，以下命令会将 `user` 的值设置为包含 `1` 和 `2` 的数组：

```shell
php artisan mail:send 1 2
```

此 `*` 字符可以与可选参数定义组合，以允许零个或多个参数实例：

```php
'mail:send {user?*}'
```

<a name="option-arrays"></a>
#### 选项数组

定义期望多个输入值的选项时，传递给命令的每个选项值都应以选项名称为前缀：

```php
'mail:send {--id=*}'
```

可以通过传递多个 `--id` 参数来调用此类命令：

```shell
php artisan mail:send --id=1 --id=2
```

<a name="input-descriptions"></a>
### 输入描述

你可以通过使用冒号将参数名称与描述分开来为输入参数和选项分配描述。如果需要更多空间来定义命令，可以将定义展开到多行：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send
                        {user : The ID of the user}
                        {--queue : Whether the job should be queued}';
```

<a name="command-io"></a>
## 命令输入/输出

<a name="retrieving-input"></a>
### 检索输入

命令执行时，你可能需要访问命令接受的参数和选项的值。为此，可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，将返回 `null`：

```php
/**
 * 执行控制台命令。
 *
 * @return int
 */
public function handle()
{
    $userId = $this->argument('user');

    //
}
```

如果需要以 `array` 形式检索所有参数，请调用 `arguments` 方法：

```php
$arguments = $this->arguments();
```

使用 `option` 方法可以像检索参数一样轻松检索选项。要以数组形式检索所有选项，请调用 `options` 方法：

```php
// 检索特定选项...
$queueName = $this->option('queue');

// 以数组形式检索所有选项...
$options = $this->options();
```

<a name="prompting-for-input"></a>
### 提示输入

除了显示输出外，你还可以在命令执行期间要求用户提供输入。`ask` 方法会用给定的问题提示用户，接受其输入，然后将用户的输入返回给命令：

```php
/**
 * 执行控制台命令。
 *
 * @return mixed
 */
public function handle()
{
    $name = $this->ask('What is your name?');
}
```

`secret` 方法类似于 `ask`，但用户在控制台输入时其输入内容不可见。此方法在询问密码等敏感信息时很有用：

```php
$password = $this->secret('What is the password?');
```

<a name="asking-for-confirmation"></a>
#### 请求确认

如果你需要向用户请求简单的「是或否」确认，可以使用 `confirm` 方法。默认情况下，此方法返回 `false`。但是，如果用户在提示中输入 `y` 或 `yes`，方法将返回 `true`。

```php
if ($this->confirm('Do you wish to continue?')) {
    //
}
```

如有必要，你可以通过将 `true` 作为 `confirm` 方法的第二个参数来指定确认提示默认返回 `true`：

```php
if ($this->confirm('Do you wish to continue?', true)) {
    //
}
```

<a name="auto-completion"></a>
#### 自动补全

`anticipate` 方法可用于为可能的选择提供自动补全。无论自动补全提示如何，用户仍可提供任何答案：

```php
$name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以将闭包作为 `anticipate` 方法的第二个参数传递。每次用户输入字符时都会调用该闭包。闭包应接受包含用户当前输入的字符串参数，并返回自动补全选项数组：

```php
$name = $this->anticipate('What is your address?', function ($input) {
    // 返回自动补全选项...
});
```

<a name="multiple-choice-questions"></a>
#### 多选问题

如果在提问时需要给用户一组预定义的选择，可以使用 `choice` 方法。如果未选择任何选项，你可以通过将索引作为方法的第三个参数传递来设置要返回的默认值的数组索引：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex
);
```

此外，`choice` 方法接受可选的第四和第五个参数，用于确定选择有效响应的最大尝试次数以及是否允许多选：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex,
    $maxAttempts = null,
    $allowMultipleSelections = false
);
```

<a name="writing-output"></a>
### 写入输出

要向控制台发送输出，可以使用 `line`、`info`、`comment`、`question`、`warn` 和 `error` 方法。这些方法都会根据其用途使用适当的 ANSI 颜色。例如，让我们向用户显示一些一般信息。通常，`info` 方法会在控制台中以绿色文本显示：

```php
/**
 * 执行控制台命令。
 *
 * @return mixed
 */
public function handle()
{
    // ...

    $this->info('The command was successful!');
}
```

要显示错误消息，请使用 `error` 方法。错误消息文本通常以红色显示：

```php
$this->error('Something went wrong!');
```

你可以使用 `line` 方法显示纯文本、无颜色文本：

```php
$this->line('Display this on the screen');
```

你可以使用 `newLine` 方法显示空行：

```php
// 写入单个空行...
$this->newLine();

// 写入三个空行...
$this->newLine(3);
```

<a name="tables"></a>
#### 表格

`table` 方法使正确格式化多行/多列数据变得简单。你只需提供列名和表格数据，Laravel 会自动为你计算表格的适当宽度和高度：

```php
use App\Models\User;

$this->table(
    ['Name', 'Email'],
    User::all(['name', 'email'])->toArray()
);
```

<a name="progress-bars"></a>
#### 进度条

对于长时间运行的任务，显示进度条以告知用户任务完成度会很有帮助。使用 `withProgressBar` 方法，Laravel 会显示进度条并在每次迭代给定可迭代值时推进进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function ($user) {
    $this->performTask($user);
});
```

有时，你可能需要更手动地控制进度条的推进方式。首先，定义进程将迭代的总步数。然后，在处理每个项目后推进进度条：

```php
$users = App\Models\User::all();

$bar = $this->output->createProgressBar(count($users));

$bar->start();

foreach ($users as $user) {
    $this->performTask($user);

    $bar->advance();
}

$bar->finish();
```

> **Note**
> 有关更多高级选项，请查看 [Symfony Progress Bar 组件文档](https://symfony.com/doc/current/components/console/helpers/progressbar.html)。

<a name="registering-commands"></a>
## 注册命令

所有控制台命令都在应用的 `App\Console\Kernel` 类中注册，该类是应用的「控制台内核」。在此类的 `commands` 方法中，你会看到对内核 `load` 方法的调用。`load` 方法会扫描 `app/Console/Commands` 目录并自动将其包含的每个命令注册到 Artisan。你甚至可以自由地额外调用 `load` 方法来扫描其他目录中的 Artisan 命令：

```php
/**
 * 为应用注册命令。
 *
 * @return void
 */
protected function commands()
{
    $this->load(__DIR__.'/Commands');
    $this->load(__DIR__.'/../Domain/Orders/Commands');

    // ...
}
```

如有必要，你可以通过将命令的类名添加到 `App\Console\Kernel` 类的 `$commands` 属性来手动注册命令。如果内核上尚未定义此属性，你应当手动定义它。Artisan 引导启动时，此属性中列出的所有命令都将由[服务容器](/docs/{{version}}/container)解析并注册到 Artisan：

```php
protected $commands = [
    Commands\SendEmails::class
];
```

<a name="programmatically-executing-commands"></a>
## 以编程方式执行命令

有时你可能希望在 CLI 之外执行 Artisan 命令。例如，你可能希望从路由或控制器执行 Artisan 命令。你可以使用 `Artisan` Facade 上的 `call` 方法来实现。`call` 方法接受命令的签名名称或类名作为第一个参数，以及命令参数数组作为第二个参数。将返回退出码：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function ($user) {
    $exitCode = Artisan::call('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    //
});
```

或者，你可以将整个 Artisan 命令作为字符串传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

<a name="passing-array-values"></a>
#### 传递数组值

如果你的命令定义了接受数组的选项，你可以向该选项传递值数组：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/mail', function () {
    $exitCode = Artisan::call('mail:send', [
        '--id' => [5, 13]
    ]);
});
```

<a name="passing-boolean-values"></a>
#### 传递布尔值

如果需要指定不接受字符串值的选项的值（例如 `migrate:refresh` 命令上的 `--force` 标志），你应当传递 `true` 或 `false` 作为选项的值：

```php
$exitCode = Artisan::call('migrate:refresh', [
    '--force' => true,
]);
```

<a name="queueing-artisan-commands"></a>
#### 队列化 Artisan 命令

使用 `Artisan` Facade 上的 `queue` 方法，你甚至可以将 Artisan 命令放入队列，使其由[队列工作进程](/docs/{{version}}/queues)在后台处理。使用此方法前，请确保已配置队列并正在运行队列监听器：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function ($user) {
    Artisan::queue('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    //
});
```

使用 `onConnection` 和 `onQueue` 方法，你可以指定 Artisan 命令应分发到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

<a name="calling-commands-from-other-commands"></a>
### 从其他命令调用命令

有时你可能希望从现有的 Artisan 命令调用其他命令。你可以使用 `call` 方法来实现。此 `call` 方法接受命令名称和命令参数/选项数组：

```php
/**
 * 执行控制台命令。
 *
 * @return mixed
 */
public function handle()
{
    $this->call('mail:send', [
        'user' => 1, '--queue' => 'default'
    ]);

    //
}
```

如果你想调用另一个控制台命令并抑制其所有输出，可以使用 `callSilently` 方法。`callSilently` 方法具有与 `call` 方法相同的签名：

```php
$this->callSilently('mail:send', [
    'user' => 1, '--queue' => 'default'
]);
```

<a name="signal-handling"></a>
## 信号处理

如你所知，操作系统允许向运行中的进程发送信号。例如，`SIGTERM` 信号是操作系统请求程序终止的方式。如果你希望在 Artisan 控制台命令中监听信号并在信号发生时执行代码，可以使用 `trap` 方法：

```php
/**
 * 执行控制台命令。
 *
 * @return mixed
 */
public function handle()
{
    $this->trap(SIGTERM, fn () => $this->shouldKeepRunning = false);

    while ($this->shouldKeepRunning) {
        // ...
    }
}
```

要同时监听多个信号，可以向 `trap` 方法提供信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function ($signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

<a name="stub-customization"></a>
## 自定义存根

Artisan 控制台的 `make` 命令用于创建各种类，如控制器、任务、迁移和测试。这些类使用「存根」文件生成，存根文件根据你的输入填充值。但是，你可能希望对 Artisan 生成的文件进行小修改。为此，你可以使用 `stub:publish` 命令将最常见的存根发布到应用中，以便自定义它们：

```shell
php artisan stub:publish
```

发布的存根将位于应用根目录下的 `stubs` 目录中。你对这些存根所做的任何更改都将在使用 Artisan 的 `make` 命令生成相应类时反映出来。

<a name="events"></a>
## 事件

Artisan 在运行命令时分发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。`ArtisanStarting` 事件在 Artisan 开始运行时立即分发。接下来，`CommandStarting` 事件在命令运行前立即分发。最后，`CommandFinished` 事件在命令完成执行后分发。
