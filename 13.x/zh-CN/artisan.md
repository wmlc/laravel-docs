# Artisan 控制台

- [简介](#introduction)
    - [Tinker（REPL）](#tinker)
- [编写命令](#writing-commands)
    - [生成命令](#generating-commands)
    - [命令结构](#command-structure)
    - [闭包命令](#closure-commands)
    - [可隔离命令](#isolatable-commands)
- [定义输入预期](#defining-input-expectations)
    - [参数](#arguments)
    - [选项](#options)
    - [输入数组](#input-arrays)
    - [输入描述](#input-descriptions)
    - [提示缺失输入](#prompting-for-missing-input)
- [命令输入/输出](#command-io)
    - [检索输入](#retrieving-input)
    - [提示输入](#prompting-for-input)
    - [输出内容](#writing-output)
- [注册命令](#registering-commands)
- [以编程方式执行命令](#programmatically-executing-commands)
    - [从其他命令调用命令](#calling-commands-from-other-commands)
- [信号处理](#signal-handling)
- [Dev 命令](#the-dev-command)
    - [自定义 Dev 进程](#customizing-dev-processes)
    - [过滤 Dev 进程](#filtering-dev-processes)
- [Stub 自定义](#stub-customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

Artisan 是 Laravel 内置的命令行界面。Artisan 以 `artisan` 脚本的形式存在于应用程序的根目录，并提供了许多有用的命令，可在构建应用程序时为你提供帮助。要查看所有可用 Artisan 命令的列表，可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还包含一个"帮助"界面，用于显示并描述该命令可用的参数和选项。要查看帮助界面，可以在命令名称前加上 `help`：

```shell
php artisan help migrate
```

<a name="laravel-sail"></a>
#### Laravel Sail

如果你使用 [Laravel Sail](/docs/{{version}}/sail) 作为本地开发环境，请记得使用 `sail` 命令行来调用 Artisan 命令。Sail 会在应用程序的 Docker 容器中执行你的 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

<a name="tinker"></a>
### Tinker（REPL）

[Laravel Tinker](https://github.com/laravel/tinker) 是 Laravel 框架的一个强大的 REPL，由 [PsySH](https://github.com/bobthecow/psysh) 包驱动。

<a name="installation"></a>
#### 安装

默认情况下，所有 Laravel 应用程序都包含 Tinker。不过，如果你之前已从应用程序中移除了它，可以使用 Composer 安装 Tinker：

```shell
composer require laravel/tinker
```

> [!NOTE]
> 在使用 Laravel 应用程序时想要热重载、多行代码编辑和自动补全功能？快来看看 [Tinkerwell](https://tinkerwell.app)！

<a name="usage"></a>
#### 用法

Tinker 允许你在命令行中与整个 Laravel 应用程序交互，包括你的 Eloquent 模型、任务、事件等。要进入 Tinker 环境，运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> [!WARNING]
> `Dispatchable` 类上的 `dispatch` 辅助函数与 `dispatch` 方法依赖垃圾回收来将任务放入队列。因此，在使用 Tinker 时，你应该使用 `Bus::dispatch` 或 `Queue::push` 来调度任务。

<a name="command-allow-list"></a>
#### 命令允许列表

Tinker 使用一个"允许"列表来决定哪些 Artisan 命令可以在其 shell 中运行。默认情况下，你可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`migrate:install`、`up` 和 `optimize` 命令。如果你想允许更多命令，可以将它们添加到 `tinker.php` 配置文件中的 `commands` 数组：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

<a name="classes-that-should-not-be-aliased"></a>
#### 不应被设置别名的类

通常，当你在 Tinker 中与类交互时，Tinker 会自动为它们设置别名。不过，你可能希望某些类永远不被设置别名。你可以将这些类列在 `tinker.php` 配置文件的 `dont_alias` 数组中来实现：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

<a name="writing-commands"></a>
## 编写命令

除了 Artisan 自带的命令外，你还可以构建自己的自定义命令。命令通常存储在 `app/Console/Commands` 目录中；不过，只要你指示 Laravel [扫描其他目录中的 Artisan 命令](#registering-commands)，就可以自由选择自己的存储位置。

<a name="generating-commands"></a>
### 生成命令

要创建新命令，可以使用 `make:command` Artisan 命令。该命令会在 `app/Console/Commands` 目录中创建一个新命令类。如果这个目录在你的应用程序中不存在也不用担心——它会在你首次运行 `make:command` Artisan 命令时自动创建：

```shell
php artisan make:command SendEmails
```

<a name="command-structure"></a>
### 命令结构

生成命令后，你应该使用 `Signature` 和 `Description` 属性定义命令的签名和描述。`Signature` 属性还允许你定义[命令的输入预期](#defining-input-expectations)。命令执行时会调用 `handle` 方法。你可以将命令逻辑放在该方法中。

我们来看一个示例命令。注意，我们可以通过命令的 `handle` 方法请求所需的任何依赖。Laravel [服务容器](/docs/{{version}}/container)（Service Container）会自动注入该方法签名中类型提示的所有依赖：

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('mail:send {user}')]
#[Description('Send a marketing email to a user')]
class SendEmails extends Command
{
    /**
     * 执行控制台命令。
     */
    public function handle(DripEmailer $drip): void
    {
        $drip->send(User::find($this->argument('user')));
    }
}
```

> [!NOTE]
> 为了提高代码复用性，良好的做法是将控制台命令保持轻量，让它们将任务委托给应用服务来完成。在上面的示例中，注意我们注入了一个服务类来完成发送邮件的"重活"。

<a name="exit-codes"></a>
#### 退出码

如果 `handle` 方法没有返回任何内容且命令执行成功，命令将以 `0` 退出码退出，表示成功。不过，`handle` 方法也可以返回一个整数来手动指定命令的退出码：

```php
$this->error('Something went wrong.');

return 1;
```

如果你想在命令内的任何方法中"失败"该命令，可以使用 `fail` 方法。`fail` 方法会立即终止命令的执行并返回 `1` 退出码：

```php
$this->fail('Something went wrong.');
```

<a name="closure-commands"></a>
### 闭包命令

基于闭包的命令为将控制台命令定义为类提供了一种替代方案。正如路由闭包是控制器的替代方案一样，可以把命令闭包看作命令类的替代方案。

尽管 `routes/console.php` 文件不定义 HTTP 路由，但它定义了基于控制台的入口点（路由）到你的应用程序。在这个文件中，你可以使用 `Artisan::command` 方法定义所有基于闭包的 console 命令。`command` 方法接受两个参数：[命令签名](#defining-input-expectations)和一个接收命令参数与选项的闭包：

```php
Artisan::command('mail:send {user}', function (string $user) {
    $this->info("Sending email to: {$user}!");
});
```

闭包绑定到底层的命令实例，因此你可以完全访问通常在完整命令类上可用的所有辅助方法。

<a name="type-hinting-dependencies"></a>
#### 类型提示依赖

除了接收命令的参数和选项外，命令闭包还可以对希望从[服务容器](/docs/{{version}}/container)（Service Container）中解析的额外依赖进行类型提示：

```php
use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Support\Facades\Artisan;

Artisan::command('mail:send {user}', function (DripEmailer $drip, string $user) {
    $drip->send(User::find($user));
});
```

<a name="closure-command-descriptions"></a>
#### 闭包命令描述

定义基于闭包的命令时，可以使用 `purpose` 方法为命令添加描述。运行 `php artisan list` 或 `php artisan help` 命令时会显示该描述：

```php
Artisan::command('mail:send {user}', function (string $user) {
    // ...
})->purpose('Send a marketing email to a user');
```

<a name="isolatable-commands"></a>
### 可隔离命令

> [!WARNING]
> 要使用此功能，你的应用程序必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中心缓存服务器通信。

有时你可能希望确保一个命令一次只能运行一个实例。为此，你可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

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

当将一个命令标记为 `Isolatable` 时，Laravel 会自动为该命令提供 `--isolated` 选项，而无需在命令的选项中显式定义它。当使用该选项调用命令时，Laravel 会确保没有其他该命令的实例正在运行。Laravel 通过使用应用程序的默认缓存驱动尝试获取原子锁来实现这一点。如果命令的其他实例正在运行，则该命令不会执行；不过，命令仍会以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果你想指定命令在无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供所需的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

<a name="lock-id"></a>
#### 锁 ID

默认情况下，Laravel 会使用命令的名称生成用于在应用程序缓存中获取原子锁的字符串键。不过，你可以通过在 Artisan 命令类上定义 `isolatableId` 方法来自定义此键，从而将命令的参数或选项整合到键中：

```php
/**
 * 获取命令的 isolatable ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

<a name="lock-expiration-time"></a>
#### 锁过期时间

默认情况下，隔离锁会在命令完成后过期。或者，如果命令被中断且无法完成，锁会在一小时后过期。不过，你可以通过在命令上定义 `isolationLockExpiresAt` 方法来调整锁的过期时间：

```php
use DateTimeInterface;
use DateInterval;

/**
 * 确定命令的隔离锁何时过期。
 */
public function isolationLockExpiresAt(): DateTimeInterface|DateInterval
{
    return now()->plus(minutes: 5);
}
```

<a name="defining-input-expectations"></a>
## 定义输入预期

编写控制台命令时，通常通过参数或选项从用户处收集输入。Laravel 使用命令上的 `signature` 属性定义你期望从用户处获得的输入，非常方便。`signature` 属性允许你使用单一、富有表现力的、类似路由的语法来定义命令的名称、参数和选项。

<a name="arguments"></a>
### 参数

所有用户提供的参数和选项都包裹在花括号中。在下面的示例中，命令定义了一个必需参数：`user`：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

你也可以将参数设为可选或为其定义默认值：

```php
// 可选参数……
'mail:send {user?}'

// 带默认值的可选参数……
'mail:send {user=foo}'
```

<a name="options"></a>
### 选项

与参数一样，选项是另一种形式的用户输入。通过命令行提供选项时，选项以两个连字符（`--`）为前缀。选项有两种类型：接收值的和不接收值的。不接收值的选项充当布尔"开关"。我们来看一个这种类型选项的示例：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在此示例中，调用 Artisan 命令时可以指定 `--queue` 开关。如果传入了 `--queue` 开关，选项的值将为 `true`。否则，值将为 `false`：

```shell
php artisan mail:send 1 --queue
```

<a name="options-with-values"></a>
#### 带值的选项

接下来，我们来看一个需要值的选项。如果用户必须为选项指定值，应在选项名称后加上 `=` 符号：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在此示例中，用户可以像这样为选项传值。如果在调用命令时未指定该选项，其值将为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

你可以通过在选项名称后指定默认值来为选项分配默认值。如果用户未传入选项值，将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

<a name="option-shortcuts"></a>
#### 选项快捷方式

要在定义选项时分配快捷方式，可以在选项名称前指定它，并使用 `|` 字符作为分隔符将快捷方式与完整选项名称分开：

```php
'mail:send {user} {--Q|queue=}'
```

在终端上调用命令时，选项快捷方式应以单个连字符为前缀，并且在为选项指定值时不应包含 `=` 字符：

```shell
php artisan mail:send 1 -Qdefault
```

<a name="input-arrays"></a>
### 输入数组

如果你想定义参数或选项以接收多个输入值，可以使用 `*` 字符。首先，我们来看一个指定此类参数的示例：

```php
'mail:send {user*}'
```

运行此命令时，可以按顺序将 `user` 参数传递到命令行。例如，以下命令会将 `user` 的值设为包含 `1` 和 `2` 的数组：

```shell
php artisan mail:send 1 2
```

这个 `*` 字符可以与可选参数定义结合使用，以允许零个或多个该参数实例：

```php
'mail:send {user?*}'
```

<a name="option-arrays"></a>
#### 选项数组

定义需要多个输入值的选项时，传递给命令的每个选项值都应以选项名称为前缀：

```php
'mail:send {--id=*}'
```

可以通过传递多个 `--id` 参数来调用此类命令：

```shell
php artisan mail:send --id=1 --id=2
```

<a name="input-descriptions"></a>
### 输入描述

你可以通过使用冒号将参数名称与描述分开，为输入参数和选项分配描述。如果需要更多空间来定义命令，可以放心地跨多行展开定义：

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

<a name="prompting-for-missing-input"></a>
### 提示缺失输入

如果你的命令包含必需参数，在参数未提供时用户会收到错误消息。或者，你可以通过实现 `PromptsForMissingInput` 接口，将命令配置为在缺少必需参数时自动提示用户：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\PromptsForMissingInput;

class SendEmails extends Command implements PromptsForMissingInput
{
    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    // ...
}
```

如果 Laravel 需要从用户处收集必需参数，它会利用参数名称或描述智能地组织问题，自动向用户询问该参数。如果你想自定义用于收集必需参数的问题，可以实现 `promptForMissingArgumentsUsing` 方法，返回以参数名称为键的问题数组：

```php
/**
 * 使用返回的问题提示缺失的输入参数。
 *
 * @return array<string, string>
 */
protected function promptForMissingArgumentsUsing(): array
{
    return [
        'user' => 'Which user ID should receive the mail?',
    ];
}
```

你还可以使用包含问题和占位符的元组来提供占位文本：

```php
return [
    'user' => ['Which user ID should receive the mail?', 'E.g. 123'],
];
```

如果你希望完全控制提示，可以提供一个应向用户提问并返回其答案的闭包：

```php
use App\Models\User;
use function Laravel\Prompts\search;

// ...

return [
    'user' => fn () => search(
        label: 'Search for a user:',
        placeholder: 'E.g. Taylor Otwell',
        options: fn ($value) => strlen($value) > 0
            ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
            : []
    ),
];
```

> [!NOTE]
> 全面的 [Laravel Prompts](/docs/{{version}}/prompts) 文档包含有关可用提示及其用法的更多信息。

如果你想提示用户选择或输入[选项](#options)，可以在命令的 `handle` 方法中包含提示。不过，如果你只希望在用户也已被自动提示缺少参数时才提示用户，则可以实现 `afterPromptingForMissingArguments` 方法：

```php
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use function Laravel\Prompts\confirm;

// ...

/**
 * 在用户被提示缺失参数后执行操作。
 */
protected function afterPromptingForMissingArguments(InputInterface $input, OutputInterface $output): void
{
    $input->setOption('queue', confirm(
        label: 'Would you like to queue the mail?',
        default: $this->option('queue')
    ));
}
```

<a name="command-io"></a>
## 命令输入/输出

<a name="retrieving-input"></a>
### 检索输入

在命令执行期间，你很可能需要访问命令所接受的参数和选项的值。为此，可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，将返回 `null`：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $userId = $this->argument('user');
}
```

如果需要以 `array` 形式检索所有参数，请调用 `arguments` 方法：

```php
$arguments = $this->arguments();
```

使用 `option` 方法检索选项与检索参数一样简单。要以数组形式检索所有选项，请调用 `options` 方法：

```php
// 检索特定选项……
$queueName = $this->option('queue');

// 以数组形式检索所有选项……
$options = $this->options();
```

你可以使用 `input` 方法将命令的参数和选项作为 `Illuminate\Console\CommandInput` 实例检索，该实例提供与 HTTP 请求和其他数据容器上相同的类型化访问器：

```php
use App\Enums\ReportType;

/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $input = $this->input()->date('from');

    // ...
}
```

`input` 方法还可用于从参数或选项中检索单个输入值：

```php
$queue = $this->input('queue', 'default');
```

<a name="prompting-for-input"></a>
### 提示输入

> [!NOTE]
> [Laravel Prompts](/docs/{{version}}/prompts) 是一个 PHP 包，用于为命令行应用程序添加美观且用户友好的表单，具有类似浏览器的特性，包括占位文本和验证。

除了显示输出外，你还可以在命令执行期间要求用户提供输入。`ask` 方法会向用户提出给定问题，接受其输入，然后将用户输入返回给你的命令：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $name = $this->ask('What is your name?');

    // ...
}
```

`ask` 方法还接受可选的第二个参数，用于指定在未提供用户输入时应返回的默认值：

```php
$name = $this->ask('What is your name?', 'Taylor');
```

`secret` 方法类似于 `ask`，但用户在控制台中输入时其输入对他们不可见。此方法在询问密码等敏感信息时很有用：

```php
$password = $this->secret('What is the password?');
```

<a name="asking-for-confirmation"></a>
#### 请求确认

如果你需要向用户询问简单的"是或否"确认，可以使用 `confirm` 方法。默认情况下，此方法返回 `false`。不过，如果用户在提示中输入 `y` 或 `yes`，该方法将返回 `true`。

```php
if ($this->confirm('Do you wish to continue?')) {
    // ...
}
```

如有必要，可以通过将 `true` 作为第二个参数传递给 `confirm` 方法，来指定确认提示默认返回 `true`：

```php
if ($this->confirm('Do you wish to continue?', true)) {
    // ...
}
```

<a name="auto-completion"></a>
#### 自动补全

`anticipate` 方法可用于为可能的选项提供自动补全。用户仍然可以提供任何答案，无论自动补全提示如何：

```php
$name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以将闭包作为第二个参数传递给 `anticipate` 方法。每次用户输入一个字符时都会调用该闭包。闭包应接受一个包含用户迄今输入的字符串参数，并返回用于自动补全的选项数组：

```php
use App\Models\Address;

$name = $this->anticipate('What is your address?', function (string $input) {
    return Address::whereLike('name', "{$input}%")
        ->limit(5)
        ->pluck('name')
        ->all();
});
```

<a name="multiple-choice-questions"></a>
#### 多项选择问题

如果你需要在提问时为用户提供一组预定义的选项，可以使用 `choice` 方法。通过将索引作为第三个参数传递给该方法，可以设置在没有选择任何选项时返回的默认值的数组索引：

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
### 输出内容

要向控制台发送输出，可以使用 `line`、`newLine`、`info`、`comment`、`question`、`warn`、`alert` 和 `error` 方法。这些方法都会使用适当的 ANSI 颜色来实现其用途。例如，我们向用户显示一些一般信息。通常，`info` 方法在控制台中显示为绿色文本：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    // ...

    $this->info('The command was successful!');
}
```

要显示错误消息，请使用 `error` 方法。错误消息文本通常显示为红色：

```php
$this->error('Something went wrong!');
```

你可以使用 `line` 方法显示纯文本、无颜色的文本：

```php
$this->line('Display this on the screen');
```

你可以使用 `newLine` 方法显示空行：

```php
// 写入一行空行……
$this->newLine();

// 写入三行空行……
$this->newLine(3);
```

<a name="tables"></a>
#### 表格

`table` 方法可以轻松正确地格式化多行/多列数据。你只需提供列名和表格数据，Laravel 就会自动为你计算表格的适当宽度和高度：

```php
use App\Models\User;

$this->table(
    ['Name', 'Email'],
    User::all(['name', 'email'])->toArray()
);
```

<a name="progress-bars"></a>
#### 进度条

对于长时间运行的任务，显示进度条以告知用户任务完成程度会很有帮助。使用 `withProgressBar` 方法，Laravel 会显示一个进度条，并在遍历给定可迭代值的每次迭代时推进其进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function (User $user) {
    $this->performTask($user);
});
```

有时，你可能需要对进度条的推进方式有更多手动控制。首先，定义流程将遍历的总步数。然后，在处理完每个项目后推进进度条：

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

> [!NOTE]
> 有关更高级的选项，请查看 [Symfony 进度条组件文档](https://symfony.com/doc/current/components/console/helpers/progressbar.html)。

<a name="registering-commands"></a>
## 注册命令

默认情况下，Laravel 会自动注册 `app/Console/Commands` 目录中的所有命令。不过，你可以使用应用程序 `bootstrap/app.php` 文件中的 `withCommands` 方法指示 Laravel 扫描其他目录中的 Artisan 命令：

```php
->withCommands([
    __DIR__.'/../app/Domain/Orders/Commands',
])
```

如有必要，你还可以通过将命令的类名提供给 `withCommands` 方法来手动注册命令：

```php
use App\Domain\Orders\Commands\SendEmails;

->withCommands([
    SendEmails::class,
])
```

当 Artisan 启动时，应用程序中的所有命令都将由[服务容器](/docs/{{version}}/container)（Service Container）解析并注册到 Artisan。

<a name="programmatically-executing-commands"></a>
## 以编程方式执行命令

有时你可能希望在 CLI 之外执行 Artisan 命令。例如，你可能希望从路由或控制器执行 Artisan 命令。可以使用 `Artisan` Facade 上的 `call` 方法来实现。`call` 方法接受命令的签名名称或类名作为第一个参数，命令参数数组作为第二个参数。将返回退出码：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/user/{user}/mail', function (string $user) {
    $exitCode = Artisan::call('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

或者，你可以将整个 Artisan 命令作为字符串传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

<a name="passing-array-values"></a>
#### 传递数组值

如果你的命令定义了一个接受数组的选项，你可以向该选项传递一个值数组：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/mail', function () {
    $exitCode = Artisan::call('mail:send', [
        '--id' => [5, 13]
    ]);
});
```

<a name="passing-boolean-values"></a>
#### 传递布尔值

如果你需要指定不接受字符串值的选项的值（例如 `migrate:refresh` 命令上的 `--force` 标志），应将 `true` 或 `false` 作为该选项的值传递：

```php
$exitCode = Artisan::call('migrate:refresh', [
    '--force' => true,
]);
```

<a name="queueing-artisan-commands"></a>
#### 队列化 Artisan 命令

使用 `Artisan` Facade 上的 `queue` 方法，你甚至可以队列化 Artisan 命令，使它们在后台由你的[队列 worker](/docs/{{version}}/queues)（queue workers）处理。在使用此方法之前，请确保已配置队列并正在运行队列监听器：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/user/{user}/mail', function (string $user) {
    Artisan::queue('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

使用 `onConnection` 和 `onQueue` 方法，你可以指定 Artisan 命令应调度到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

<a name="calling-commands-from-other-commands"></a>
### 从其他命令调用命令

有时你可能希望从现有的 Artisan 命令调用其他命令。可以使用 `call` 方法来实现。这个 `call` 方法接受命令名称以及命令参数/选项数组：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->call('mail:send', [
        'user' => 1, '--queue' => 'default'
    ]);

    // ...
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

如你所知，操作系统允许向正在运行的进程发送信号。例如，`SIGTERM` 信号是操作系统要求程序优雅终止的方式。如果你想在 Artisan 控制台命令中监听信号并在它们发生时执行代码，可以使用 `trap` 方法：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->trap(SIGTERM, fn () => $this->shouldKeepRunning = false);

    while ($this->shouldKeepRunning) {
        // ...
    }
}
```

要同时监听多个信号，可以向 `trap` 方法提供一个信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function (int $signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

<a name="the-dev-command"></a>
## Dev 命令

`dev` Artisan 命令在单个终端窗口中启动本地开发所需的所有进程。默认情况下，它会并发运行 PHP 开发服务器、队列 worker、通过 [Pail](/docs/{{version}}/logging#tailing-log-messages-using-pail) 的日志跟踪以及 Vite 资源编译：

```shell
php artisan dev
```

在底层，`dev` 命令使用 `@laravel/multiplex` npm 包来管理进程，为每个进程提供带有可搜索、可滚动输出的独立标签页。每个进程都有标签和颜色编码，方便你轻松区分它们。如果某个进程崩溃，它会自动重启，并且当你退出时，所有输出都会写回你的终端，因此不会丢失任何内容。

> [!NOTE]
> `dev` 命令需要 Node 22.13 或更高版本。在 Windows 上，它会回退到 `concurrently` npm 包，且标签页界面不可用。

默认的进程如下：

| Name | Command |
| --- | --- |
| `server` | `php artisan serve --host=localhost` |
| `queue` | `php artisan queue:listen --tries=1 --timeout=0` |
| `logs` | `php artisan pail --timeout=0` |
| `vite` | `npm run dev` |

> [!NOTE]
> `vite` 进程会自动检测你的 Node 包管理器（npm、pnpm、Yarn 或 Bun）并使用相应的运行命令。

<a name="customizing-dev-processes"></a>
### 自定义 Dev 进程

你可以使用 `DevCommands` 类来自定义 `dev` 命令运行的进程，通常是在应用程序的 `AppServiceProvider` 的 `boot` 方法中。`register` 方法接受命令字符串和可选名称：

```php
use Illuminate\Foundation\DevCommands;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    DevCommands::register('some-command --flag', 'my-process');
}
```

注册 Artisan 命令时，可以使用 `artisan` 方法，它会自动为命令加上 `php artisan` 前缀：

```php
DevCommands::artisan('horizon', 'horizon');
```

同样地，`node` 方法会为命令加上检测到的包管理器的运行命令（例如 `npm run`）前缀，而 `nodeExec` 方法会为命令加上包管理器的 exec 命令（例如 `npx`）前缀：

```php
DevCommands::node('storybook', 'storybook');

DevCommands::nodeExec('tailwindcss -i resources/css/app.css -o public/css/app.css --watch', 'tailwind');
```

如果你注册的进程与默认进程同名，你的进程将替换默认进程。例如，你可以自定义 server 进程以使用不同的端口：

```php
DevCommands::artisan('serve --host=localhost --port=9000', 'server');
```

你还可以自定义终端中进程标签的颜色。可用的颜色方法有 `blue`、`purple`、`pink`、`orange`、`green` 和 `yellow`。你还可以向 `color` 方法传递自定义十六进制颜色：

```php
DevCommands::register('my-command', 'my-process')->green();

DevCommands::register('my-command', 'my-process')->color('#ff6347');
```

要查看所有已注册的 dev 进程而不启动它们，请使用 `dev:list` 命令：

```shell
php artisan dev:list
```

<a name="restarting-failed-processes"></a>
#### 重启失败的进程

如果进程崩溃，Laravel 会在短暂延迟后重启它，最多五次，然后将其标记为失败。启动后一秒内就死掉的进程不会被重启，因为它很可能一开始就没有成功启动。使用 `r` 手动重启进程会重置计数器。

你可以使用 `--no-restart` 选项在单次运行中禁用此行为：

```shell
php artisan dev --no-restart
```

或者，你可以使用 `disableAutoRestart` 方法为整个应用程序禁用它：

```php
DevCommands::disableAutoRestart();
```

<a name="filtering-dev-processes"></a>
### 过滤 Dev 进程

你可以使用 `only` 方法指示 `dev` 命令在调用时仅运行特定进程。同样，你可以使用 `except` 方法排除特定进程：

```php
// 仅运行 server 和 vite 进程……
DevCommands::only('server', 'vite');

// 运行除队列 worker 外的所有进程……
DevCommands::except('queue');
```

你可以使用 `withoutVendorCommands` 和 `withoutDefaultCommands` 方法排除由包或 Laravel 默认命令注册的命令：

```php
DevCommands::withoutVendorCommands();

DevCommands::withoutDefaultCommands();
```

<a name="stub-customization"></a>
## Stub 自定义

Artisan 控制台的 `make` 命令用于创建各种类，例如控制器、任务、数据库迁移和测试。这些类是使用"stub"文件生成的，这些文件会根据你的输入填充值。不过，你可能希望对 Artisan 生成的文件做一些小改动。为此，可以使用 `stub:publish` 命令将最常见的 stub 发布到你的应用程序中，以便你可以自定义它们：

```shell
php artisan stub:publish
```

已发布的 stub 将位于应用程序根目录下的 `stubs` 目录中。当你使用 Artisan 的 `make` 命令生成相应的类时，你对这些 stub 所做的任何更改都会体现出来。

<a name="events"></a>
## 事件

运行命令时，Artisan 会派发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。Artisan 开始运行时立即派发 `ArtisanStarting` 事件。接下来，在命令运行之前立即派发 `CommandStarting` 事件。最后，命令执行完成后派发 `CommandFinished` 事件。
