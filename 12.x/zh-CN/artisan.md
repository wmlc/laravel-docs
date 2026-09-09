# Artisan 控制台

- [简介](#introduction)
    - [Tinker（REPL）](#tinker)
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
    - [提示缺失的输入](#prompting-for-missing-input)
- [命令输入 / 输出](#command-io)
    - [检索输入](#retrieving-input)
    - [提示输入](#prompting-for-input)
    - [写出输出](#writing-output)
- [注册命令](#registering-commands)
- [以编程方式执行命令](#programmatically-executing-commands)
    - [从其他命令调用命令](#calling-commands-from-other-commands)
- [信号处理](#signal-handling)
- [自定义 Stub](#stub-customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

Artisan 是 Laravel 自带的命令行接口。Artisan 以 `artisan` 脚本的形式存在于应用根目录，并提供了许多实用的命令，可以在你构建应用的过程中提供帮助。要查看所有可用 Artisan 命令的列表，可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还包含一个「帮助」界面，用于展示并说明该命令可用的参数和选项。要查看帮助界面，请在命令名称前加上 `help`：

```shell
php artisan help migrate
```

<a name="laravel-sail"></a>
#### Laravel Sail

如果你使用 [Laravel Sail](/docs/{{version}}/sail) 作为本地开发环境，请记住使用 `sail` 命令行来调用 Artisan 命令。Sail 会在应用的 Docker 容器内执行你的 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

<a name="tinker"></a>
### Tinker（REPL）

[Laravel Tinker](https://github.com/laravel/tinker) 是一个由 [PsySH](https://github.com/bobthecow/psysh) 包驱动的、面向 Laravel 框架的强大 REPL。

<a name="installation"></a>
#### 安装

所有 Laravel 应用默认都包含 Tinker。不过，如果你之前从应用中移除了它，可以使用 Composer 重新安装：

```shell
composer require laravel/tinker
```

> [!NOTE]
> 想在与 Laravel 应用交互时获得热重载、多行代码编辑和自动补全功能？请查看 [Tinkerwell](https://tinkerwell.app)！

<a name="usage"></a>
#### 用法

Tinker 允许你在命令行中与整个 Laravel 应用进行交互，包括 Eloquent 模型、任务、事件等。要进入 Tinker 环境，请运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> [!WARNING]
> `dispatch` 辅助函数以及 `Dispatchable` 类上的 `dispatch` 方法依赖垃圾回收将任务放入队列。因此，在使用 Tinker 时，你应当使用 `Bus::dispatch` 或 `Queue::push` 来分发任务。

<a name="command-allow-list"></a>
#### 命令允许列表

Tinker 使用一个「允许」列表来确定哪些 Artisan 命令可以在其 shell 中运行。默认情况下，你可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`migrate:install`、`up` 和 `optimize` 命令。如果你想允许更多命令，可以将它们添加到 `tinker.php` 配置文件中的 `commands` 数组中：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

<a name="classes-that-should-not-be-aliased"></a>
#### 不应设置别名的类

通常，Tinker 会自动为你在 Tinker 中交互的类设置别名。但有些类你可能永远不希望被设置别名。为此，你可以将这些类罗列在 `tinker.php` 配置文件的 `dont_alias` 数组中：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

<a name="writing-commands"></a>
## 编写命令

除了 Artisan 自带的命令之外，你还可以构建自己的自定义命令。命令通常存储在 `app/Console/Commands` 目录中；不过，只要你告知 Laravel [扫描其他目录来查找 Artisan 命令](#registering-commands)，你可以自由选择存储位置。

<a name="generating-commands"></a>
### 生成命令

要创建新命令，可以使用 `make:command` Artisan 命令。该命令会在 `app/Console/Commands` 目录中创建一个新的命令类。如果应用中不存在该目录也不必担心——首次运行 `make:command` Artisan 命令时会自动创建它：

```shell
php artisan make:command SendEmails
```

<a name="command-structure"></a>
### 命令结构

生成命令之后，你应当为类的 `signature` 和 `description` 属性定义合适的值。在 `list` 界面上显示命令时会用到这些属性。`signature` 属性还允许你定义[命令的输入期望](#defining-input-expectations)。命令执行时会调用 `handle` 方法，你可以将命令逻辑放在这个方法中。

让我们来看一个示例命令。注意，我们可以通过命令的 `handle` 方法请求所需的任何依赖。Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)会自动注入该方法签名中所有经过类型提示的依赖：

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
     * 控制台命令的描述。
     *
     * @var string
     */
    protected $description = 'Send a marketing email to a user';

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
> 为了提高代码复用性，最佳实践是让控制台命令保持轻量，并让它们委托应用服务来完成具体任务。请注意，在上面的示例中，我们注入了一个服务类来完成发送邮件的「繁重工作」。

<a name="exit-codes"></a>
#### 退出码

如果 `handle` 方法没有返回任何值且命令成功执行，命令将以 `0` 退出码退出，表示成功。不过，`handle` 方法也可以返回一个整数，手动指定命令的退出码：

```php
$this->error('Something went wrong.');

return 1;
```

如果你想在命令内部的任何方法中让命令「失败」，可以使用 `fail` 方法。`fail` 方法会立即终止命令的执行，并返回退出码 `1`：

```php
$this->fail('Something went wrong.');
```

<a name="closure-commands"></a>
### 闭包命令

基于闭包的命令提供了一种替代方式，让你无需以类的形式定义控制台命令。正如路由闭包是控制器的替代方案一样，可以把命令闭包视为命令类的替代方案。

虽然 `routes/console.php` 文件不定义 HTTP 路由，但它定义了进入应用的控制台入口点（路由）。在这个文件中，你可以使用 `Artisan::command` 方法定义所有基于闭包的控制台命令。`command` 方法接受两个参数：[命令签名](#defining-input-expectations)和一个接收命令参数与选项的闭包：

```php
Artisan::command('mail:send {user}', function (string $user) {
    $this->info("Sending email to: {$user}!");
});
```

该闭包会绑定到底层的命令实例，因此你可以完全访问完整命令类上通常能访问的所有辅助方法。

<a name="type-hinting-dependencies"></a>
#### 类型提示依赖

除了接收命令的参数和选项之外，命令闭包还可以对希望从[服务容器](/docs/{{version}}/container)解析的其他依赖进行类型提示：

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
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

有时你可能希望确保一个命令同一时间只能运行一个实例。为此，你可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

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

将命令标记为 `Isolatable` 后，Laravel 会自动让 `--isolated` 选项可用于该命令，而无需在命令的选项中显式定义。当命令携带该选项被调用时，Laravel 会确保没有其他实例正在运行该命令。Laravel 通过使用应用的默认缓存驱动尝试获取一个原子锁来实现这一点。如果该命令的其他实例正在运行，命令将不会执行；不过，命令仍会以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果你想指定命令无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供所需的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

<a name="lock-id"></a>
#### 锁 ID

默认情况下，Laravel 会使用命令的名称来生成用于在应用缓存中获取原子锁的字符串键。不过，你可以通过在 Artisan 命令类上定义 `isolatableId` 方法来自定义此键，从而将命令的参数或选项整合到键中：

```php
/**
 * 获取命令的可隔离 ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

<a name="lock-expiration-time"></a>
#### 锁过期时间

默认情况下，隔离锁会在命令结束后过期。或者，如果命令被中断而未能完成，锁将在一小时后过期。不过，你可以通过在命令上定义 `isolationLockExpiresAt` 方法来调整锁的过期时间：

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
## 定义输入期望

编写控制台命令时，通常需要通过参数或选项收集用户的输入。Laravel 让你可以利用命令上的 `signature` 属性，非常便捷地定义你期望从用户获得的输入。`signature` 属性允许你以单一、富有表现力、类似路由的语法定义命令的名称、参数和选项。

<a name="arguments"></a>
### 参数

所有用户提供参数和选项都包裹在花括号中。在下面的示例中，命令定义了一个必填参数：`user`：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

你还可以将参数设为可选，或为参数定义默认值：

```php
// 可选参数...
'mail:send {user?}'

// 带默认值的可选参数...
'mail:send {user=foo}'
```

<a name="options"></a>
### 选项

选项与参数类似，是另一种形式的用户输入。选项通过命令行提供时以两个连字符（`--`）作为前缀。选项有两种类型：接收值的选项和不接收值的选项。不接收值的选项充当布尔「开关」。让我们来看一个这种类型选项的示例：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在本例中，调用 Artisan 命令时可以指定 `--queue` 开关。如果传入了 `--queue` 开关，该选项的值为 `true`；否则，值为 `false`：

```shell
php artisan mail:send 1 --queue
```

<a name="options-with-values"></a>
#### 带值的选项

接下来，让我们看一个需要接收值的选项。如果用户必须为选项指定值，你应当在选项名称后面加上 `=` 号：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在本例中，用户可以像这样为选项传递值。如果调用命令时未指定该选项，其值将为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

你可以在选项名称后面指定默认值，从而为选项分配默认值。如果用户没有传递选项值，将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

<a name="option-shortcuts"></a>
#### 选项快捷方式

要在定义选项时为其分配快捷方式，你可以在选项名称之前指定它，并使用 `|` 字符作为分隔符，将快捷方式与完整选项名称分开：

```php
'mail:send {user} {--Q|queue=}'
```

在终端中调用命令时，选项快捷方式应以单个连字符作为前缀，并且为选项指定值时不应包含 `=` 字符：

```shell
php artisan mail:send 1 -Qdefault
```

<a name="input-arrays"></a>
### 输入数组

如果你想定义接收多个输入值的参数或选项，可以使用 `*` 字符。首先，让我们来看一个指定此类参数的示例：

```php
'mail:send {user*}'
```

运行此命令时，可以按顺序向命令行传递多个 `user` 参数。例如，以下命令会将 `user` 的值设置为包含 `1` 和 `2` 两个值的数组：

```shell
php artisan mail:send 1 2
```

`*` 字符可以与可选参数定义结合使用，允许参数出现零次或多次：

```php
'mail:send {user?*}'
```

<a name="option-arrays"></a>
#### 选项数组

定义接收多个输入值的选项时，传递给命令的每个选项值都应以选项名称作为前缀：

```php
'mail:send {--id=*}'
```

这样的命令可以通过传递多个 `--id` 参数来调用：

```shell
php artisan mail:send --id=1 --id=2
```

<a name="input-descriptions"></a>
### 输入描述

你可以使用冒号将参数名称与描述分隔开，从而为输入参数和选项分配描述。如果需要更多空间来定义命令，可以随意将定义拆分到多行：

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
### 提示缺失的输入

如果你的命令包含必填参数，当用户未提供这些参数时会收到错误消息。或者，你也可以通过实现 `PromptsForMissingInput` 接口，将命令配置为在缺少必填参数时自动提示用户：

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

如果 Laravel 需要从用户处收集必填参数，它会利用参数名称或描述来智能组织提问，自动向用户询问该参数。如果你想自定义收集必填参数时使用的问题，可以实现 `promptForMissingArgumentsUsing` 方法，返回一个以参数名称为键的问题数组：

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

你还可以通过使用包含问题和占位符的元组来提供占位符文本：

```php
return [
    'user' => ['Which user ID should receive the mail?', 'E.g. 123'],
];
```

如果你想完全控制提示，可以提供一个应提示用户并返回其答案的闭包：

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
> 详尽的 [Laravel Prompts](/docs/{{version}}/prompts) 文档包含了关于可用提示及其用法的更多信息。

如果你希望提示用户选择或输入[选项](#options)，可以在命令的 `handle` 方法中加入提示。但是，如果你只希望在被自动提示缺失参数的同时提示用户，那么可以实现 `afterPromptingForMissingArguments` 方法：

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
## 命令输入 / 输出

<a name="retrieving-input"></a>
### 检索输入

命令执行期间，你可能需要访问命令所接收的参数和选项的值。为此，可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，将返回 `null`：

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
// 检索特定选项...
$queueName = $this->option('queue');

// 以数组形式检索所有选项...
$options = $this->options();
```

<a name="prompting-for-input"></a>
### 提示输入

> [!NOTE]
> [Laravel Prompts](/docs/{{version}}/prompts) 是一个 PHP 包，用于为命令行应用添加美观且用户友好的表单，具备占位符文本和验证等类似浏览器的功能。

除了显示输出之外，你还可以在命令执行期间要求用户提供输入。`ask` 方法会以给定的问题提示用户，接收其输入，然后将用户的输入返回给你的命令：

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

`ask` 方法还接受可选的第二个参数，用于指定在用户没有提供输入时应返回的默认值：

```php
$name = $this->ask('What is your name?', 'Taylor');
```

`secret` 方法与 `ask` 类似，但用户在控制台中输入时对其不可见。该方法适用于询问密码等敏感信息：

```php
$password = $this->secret('What is the password?');
```

<a name="asking-for-confirmation"></a>
#### 请求确认

如果你需要向用户询问简单的「是或否」确认，可以使用 `confirm` 方法。默认情况下，该方法返回 `false`。不过，如果用户在提示后输入 `y` 或 `yes`，方法将返回 `true`。

```php
if ($this->confirm('Do you wish to continue?')) {
    // ...
}
```

如有需要，你可以通过给 `confirm` 方法传递 `true` 作为第二个参数，指定确认提示默认返回 `true`：

```php
if ($this->confirm('Do you wish to continue?', true)) {
    // ...
}
```

<a name="auto-completion"></a>
#### 自动补全

`anticipate` 方法可用于为可能的选择提供自动补全。无论自动补全提示如何，用户仍然可以提供任何答案：

```php
$name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以给 `anticipate` 方法传递一个闭包作为第二个参数。用户每输入一个字符，该闭包就会被调用一次。闭包应接收一个包含用户当前输入的字符串参数，并返回一个用于自动补全的选项数组：

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
#### 多选题

如果你需要在提问时给用户提供一组预定义的选择，可以使用 `choice` 方法。你可以通过将索引作为该方法的第三个参数，设置未选择任何选项时返回的默认值所对应的数组索引：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex
);
```

此外，`choice` 方法还接受可选的第四和第五个参数，分别用于确定选择有效响应的最大尝试次数，以及是否允许进行多项选择：

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
### 写出输出

要向控制台发送输出，可以使用 `line`、`newLine`、`info`、`comment`、`question`、`warn`、`alert` 和 `error` 方法。这些方法中的每一个都会根据各自的用途使用合适的 ANSI 颜色。例如，让我们向用户显示一些常规信息。通常，`info` 方法会在控制台中显示为绿色文本：

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

要显示错误消息，请使用 `error` 方法。错误消息文本通常以红色显示：

```php
$this->error('Something went wrong!');
```

你可以使用 `line` 方法显示不带颜色的纯文本：

```php
$this->line('Display this on the screen');
```

你可以使用 `newLine` 方法显示空行：

```php
// 写出一个空行...
$this->newLine();

// 写出三个空行...
$this->newLine(3);
```

<a name="tables"></a>
#### 表格

`table` 方法让你能够轻松地正确格式化多行 / 多列数据。你只需提供列名和表格数据，Laravel 就会自动为你计算表格合适的宽度和高度：

```php
use App\Models\User;

$this->table(
    ['Name', 'Email'],
    User::all(['name', 'email'])->toArray()
);
```

<a name="progress-bars"></a>
#### 进度条

对于长时间运行的任务，显示一个进度条来告知用户任务的完成情况会很有帮助。使用 `withProgressBar` 方法，Laravel 会显示一个进度条，并在对给定可迭代值的每次迭代中推进其进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function (User $user) {
    $this->performTask($user);
});
```

有时，你可能需要对进度条的推进方式进行更多的手动控制。首先，定义流程将要迭代的总步数。然后，在处理完每个条目后推进进度条：

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
> 更多高级选项，请查阅 [Symfony Progress Bar 组件文档](https://symfony.com/doc/current/components/console/helpers/progressbar.html)。

<a name="registering-commands"></a>
## 注册命令

默认情况下，Laravel 会自动注册 `app/Console/Commands` 目录中的所有命令。不过，你也可以在应用的 `bootstrap/app.php` 文件中使用 `withCommands` 方法，让 Laravel 扫描其他目录来查找 Artisan 命令：

```php
->withCommands([
    __DIR__.'/../app/Domain/Orders/Commands',
])
```

如有需要，你还可以通过向 `withCommands` 方法提供命令的类名来手动注册命令：

```php
use App\Domain\Orders\Commands\SendEmails;

->withCommands([
    SendEmails::class,
])
```

当 Artisan 启动时，应用中的所有命令都会由[服务容器](/docs/{{version}}/container)解析，并注册到 Artisan。

<a name="programmatically-executing-commands"></a>
## 以编程方式执行命令

有时你可能希望在 CLI 之外执行 Artisan 命令。例如，你可能希望在路由或控制器中执行 Artisan 命令。为此，可以使用 `Artisan` Facade 的 `call` 方法。`call` 方法接受命令的签名名称或类名作为第一个参数，以及一个命令参数数组作为第二个参数，并返回退出码：

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

或者，你也可以将整个 Artisan 命令以字符串形式传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

<a name="passing-array-values"></a>
#### 传递数组值

如果你的命令定义了一个接受数组的选项，你可以为该选项传递一个值数组：

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

如果你需要为不接受字符串值的选项指定值，例如 `migrate:refresh` 命令上的 `--force` 标志，应当传递 `true` 或 `false` 作为该选项的值：

```php
$exitCode = Artisan::call('migrate:refresh', [
    '--force' => true,
]);
```

<a name="queueing-artisan-commands"></a>
#### 队列化 Artisan 命令

使用 `Artisan` Facade 的 `queue` 方法，你甚至可以将 Artisan 命令放入队列，让[队列工作进程](/docs/{{version}}/queues)在后台处理它们。在使用此方法之前，请确保你已经配置好队列并正在运行队列监听器：

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

使用 `onConnection` 和 `onQueue` 方法，你可以指定 Artisan 命令应分发到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

<a name="calling-commands-from-other-commands"></a>
### 从其他命令调用命令

有时你可能希望从一个现有的 Artisan 命令中调用其他命令。你可以使用 `call` 方法来实现。这个 `call` 方法接受命令名称以及一个由命令参数 / 选项组成的数组：

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

如果你想调用另一个控制台命令并抑制其所有输出，可以使用 `callSilently` 方法。`callSilently` 方法与 `call` 方法具有相同的签名：

```php
$this->callSilently('mail:send', [
    'user' => 1, '--queue' => 'default'
]);
```

<a name="signal-handling"></a>
## 信号处理

众所周知，操作系统允许向运行中的进程发送信号。例如，`SIGTERM` 信号是操作系统要求程序优雅终止的方式。如果你希望在 Artisan 控制台命令中监听信号，并在信号发生时执行代码，可以使用 `trap` 方法：

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

要同时监听多个信号，你可以向 `trap` 方法提供一个信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function (int $signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

<a name="stub-customization"></a>
## 自定义 Stub

Artisan 控制台的 `make` 命令用于创建各种类，例如控制器、任务、数据库迁移和测试。这些类是使用根据你的输入填充值的「stub」文件生成的。不过，你可能希望对 Artisan 生成的文件做一些小的修改。为此，你可以使用 `stub:publish` 命令将最常用的 stub 发布到应用中，以便对它们进行自定义：

```shell
php artisan stub:publish
```

已发布的 stub 将位于应用根目录的 `stubs` 目录中。当你使用 Artisan 的 `make` 命令生成相应类时，对这些 stub 所做的任何修改都会体现出来。

<a name="events"></a>
## 事件

Artisan 在运行命令时会分发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。`ArtisanStarting` 事件在 Artisan 开始运行时立即分发。接着，`CommandStarting` 事件在命令运行之前立即分发。最后，`CommandFinished` 事件在命令执行完成后分发。
