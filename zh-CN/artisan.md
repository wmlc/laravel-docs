# Artisan 控制台

## 简介

Artisan 是 Laravel 内置的命令行接口。Artisan 以 `artisan` 脚本的形式存在于应用的根目录，提供了大量用于辅助构建应用的命令。要查看所有可用的 Artisan 命令，可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还包含一个「help」界面，用于展示并描述该命令可用的参数与选项。要查看某个命令的帮助界面，在命令名前加 `help`：

```shell
php artisan help migrate
```

#### Laravel Sail

如果使用 [Laravel Sail](/docs/{{version}}/sail) 作为本地开发环境，记得使用 `sail` 命令行工具来调用 Artisan 命令。Sail 会在应用的 Docker 容器内执行 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

### Tinker（REPL）

[Laravel Tinker](https://github.com/laravel/tinker) 是 Laravel 框架功能强大的 REPL，基于 [PsySH](https://github.com/bobthecow/psysh) 包。

#### 安装

所有 Laravel 应用默认都包含 Tinker。但如果之前从应用中移除了它，可以使用 Composer 重新安装：

```shell
composer require laravel/tinker
```

> [!NOTE]
> 想要在 Laravel 应用中获得热重载、多行代码编辑和自动补全体验？可以试试 [Tinkerwell](https://tinkerwell.app)！

#### 使用

Tinker 允许你在命令行与整个 Laravel 应用进行交互，包括 Eloquent 模型、任务（job）、事件等。要进入 Tinker 环境，运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> [!WARNING]
> `dispatch` 辅助函数与 `Dispatchable` trait 上的 `dispatch` 方法依赖垃圾回收机制将任务放入队列。因此，在 Tinker 中派发任务时，应该使用 `Bus::dispatch` 或 `Queue::push`。

#### 命令白名单

Tinker 使用「允许」列表（allow list）来确定哪些 Artisan 命令可以在其 Shell 内运行。默认情况下，可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`migrate:install`、`up` 和 `optimize` 命令。如果想允许更多命令，可以在 `tinker.php` 配置文件的 `commands` 数组中添加它们：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

#### 不应被别名化的类

通常 Tinker 会在你与其交互时自动为类创建别名。但你可能希望某些类永远不被别名化。可以通过在 `tinker.php` 配置文件的 `dont_alias` 数组中列出这些类来实现：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

## 编写命令

除了 Artisan 自带的命令外，你还可以构建自己的自定义命令。命令通常保存在 `app/Console/Commands` 目录下；但只要指示 Laravel [扫描其他目录以查找 Artisan 命令](#registering-commands)，就可以自由选择其他存储位置。

### 生成命令

要创建新命令，可以使用 `make:command` Artisan 命令。该命令会在 `app/Console/Commands` 目录下创建一个新的命令类。即使应用里不存在该目录，也不用担心——第一次运行 `make:command` Artisan 命令时它会被自动创建：

```shell
php artisan make:command SendEmails
```

### 命令结构

生成命令后，应使用 `Signature` 与 `Description` 属性定义命令的签名（signature）和描述（description）。`Signature` 属性还允许定义[命令的输入期望](#defining-input-expectations)。当命令被执行时会调用 `handle` 方法，可以在该方法中编写命令逻辑。

来看一个示例命令。注意，我们可以通过命令的 `handle` 方法请求所需的任何依赖。Laravel 的[服务容器（Service Container）](/docs/{{version}}/container) 会自动注入该方法签名中类型提示的所有依赖：

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
> 为了更高的代码复用，建议保持控制台命令轻量化，让它们把工作委托给应用服务来完成。在上面的示例中，注入了服务类来完成发送邮件的「重活」。

#### 退出码

如果 `handle` 方法没有返回值且命令执行成功，命令将以 `0` 退出码退出，表示成功。但 `handle` 方法也可以返回一个整数，用来手动指定命令的退出码：

```php
$this->error('Something went wrong.');

return 1;
```

如果想在命令的任何方法内「失败」该命令，可以使用 `fail` 方法。`fail` 方法会立即终止命令执行，并返回退出码 `1`：

```php
$this->fail('Something went wrong.');
```

### 闭包命令

基于闭包的命令为将控制台命令定义为类提供了另一种方式。正如路由闭包是控制器的一种替代形式，可以把命令闭包视为命令类的替代形式。

尽管 `routes/console.php` 文件并不定义 HTTP 路由，但它定义了进入应用的基于控制台的入口点（路由）。在该文件中，可以使用 `Artisan::command` 方法定义所有基于闭包的控制台命令。`command` 方法接受两个参数：[命令签名](#defining-input-expectations) 与一个接收命令参数和选项的闭包：

```php
Artisan::command('mail:send {user}', function (string $user) {
    $this->info("Sending email to: {$user}!");
});
```

闭包会绑定到底层的命令实例，因此你拥有通常可以在完整命令类上访问的所有辅助方法的完整访问权限。

#### 类型提示依赖

除了接收命令的参数和选项外，命令闭包还可以类型提示希望从[服务容器](/docs/{{version}}/container) 解析的其他依赖：

```php
use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Support\Facades\Artisan;

Artisan::command('mail:send {user}', function (DripEmailer $drip, string $user) {
    $drip->send(User::find($user));
});
```

#### 闭包命令的描述

在定义基于闭包的命令时，可以使用 `purpose` 方法为命令添加描述。运行 `php artisan list` 或 `php artisan help` 命令时，会显示该描述：

```php
Artisan::command('mail:send {user}', function (string $user) {
    // ...
})->purpose('Send a marketing email to a user');
```

### 可隔离的命令

> [!WARNING]
> 要使用该特性，应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

有时你可能希望确保一次只能运行一个命令实例。为此，可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

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

当将命令标记为 `Isolatable` 后，Laravel 会自动为该命令启用 `--isolated` 选项，无需在命令的选项中显式定义。当使用该选项调用命令时，Laravel 会确保该命令没有其他实例正在运行。Laravel 通过尝试使用应用的默认缓存驱动获取原子锁来实现这一点。如果命令的其他实例正在运行，则该命令不会执行；但命令仍会以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果希望指定命令在无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供所需的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

#### 锁 ID

默认情况下，Laravel 会使用命令的名称生成用于在应用缓存中获取原子锁的字符串键。但可以通过在 Artisan 命令类上定义 `isolatableId` 方法来自定义该键，从而将命令的参数或选项纳入键中：

```php
/**
 * 获取命令的可隔离 ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

#### 锁过期时间

默认情况下，隔离锁会在命令完成后过期。或者，如果命令被中断且无法完成，锁将在 1 小时后过期。但可以通过在命令上定义 `isolationLockExpiresAt` 方法来调整锁的过期时间：

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

## 定义输入期望

编写控制台命令时，通常需要通过参数或选项从用户那里收集输入。Laravel 通过命令上的 `signature` 属性，可以非常便捷地声明从用户那里期望接收的输入。`signature` 属性允许以单一、富有表现力且类路由的语法定义命令的名称、参数和选项。

### 参数

所有用户提供参数和选项都包裹在花括号中。在下面的示例中，命令定义了一个必需参数：`user`：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

也可以将参数设为可选，或为参数定义默认值：

```php
// 可选参数...
'mail:send {user?}'

// 带默认值的可选参数...
'mail:send {user=foo}'
```

### 选项

选项与参数一样，是另一种形式的用户输入。选项在通过命令行提供时以两个连字符（`--`）为前缀。选项有两种类型：接收值的选项和不接收值的选项。不接收值的选项充当布尔「开关」。来看一个这种类型选项的示例：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在这个示例中，可以在调用 Artisan 命令时指定 `--queue` 开关。如果传入 `--queue` 开关，则该选项的值为 `true`；否则，值为 `false`：

```shell
php artisan mail:send 1 --queue
```

#### 带值的选项

接下来看一个期望接收值的选项。如果用户必须为选项指定值，应在选项名称后加上 `=` 符号：

```php
/**
 * 控制台命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在这个示例中，用户可以像下面这样为选项传递值。如果调用命令时未指定该选项，则其值为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

可以通过在选项名称后指定默认值来为选项设置默认值。如果用户未传入选项值，将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

#### 选项快捷方式

在定义选项时为其分配快捷方式，可以在选项名前指定，并用 `|` 字符作为分隔符把快捷方式与完整选项名分开：

```php
'mail:send {user} {--Q|queue=}'
```

在终端调用命令时，选项快捷方式应以单个连字符为前缀，并且在为选项指定值时不应包含 `=` 字符：

```shell
php artisan mail:send 1 -Qdefault
```

### 输入数组

如果希望参数或选项接收多个输入值，可以使用 `*` 字符。首先，看一个指定此类参数的示例：

```php
'mail:send {user*}'
```

运行该命令时，`user` 参数可以按顺序传入命令行。例如，下面的命令会将 `user` 的值设为包含 `1` 和 `2` 的数组：

```shell
php artisan mail:send 1 2
```

`*` 字符可以与可选参数定义组合使用，以允许零个或多个参数实例：

```php
'mail:send {user?*}'
```

#### 选项数组

在定义期望接收多个输入值的选项时，传递给命令的每个选项值都应以选项名为前缀：

```php
'mail:send {--id=*}'
```

可以通过传入多个 `--id` 参数来调用这样的命令：

```shell
php artisan mail:send --id=1 --id=2
```

### 输入描述

可以为输入参数和选项分配描述，方法是用冒号将参数名与描述分开。如果需要更多空间来定义命令，可以将定义拆分成多行：

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

### 缺失输入的提示

如果命令包含必需参数，但在调用时未提供，用户会收到错误消息。或者，可以将命令配置为在必需参数缺失时自动提示用户输入，只需实现 `PromptsForMissingInput` 接口：

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

当 Laravel 需要向用户收集必需参数时，会智能地使用参数名或描述来构造提问，向用户询问。如果希望自定义用于收集必需参数的提问，可以实现 `promptForMissingArgumentsUsing` 方法，返回以参数名为键的提问数组：

```php
/**
 * 使用返回的提问来提示缺失的输入参数。
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

也可以通过使用包含提问和占位符的元组来提供占位文本：

```php
return [
    'user' => ['Which user ID should receive the mail?', 'E.g. 123'],
];
```

如果希望完全控制提示，可以提供一个负责提示用户并返回其答案的闭包：

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
> 完整的 [Laravel Prompts](/docs/{{version}}/prompts) 文档包含有关可用提示及其用法的更多信息。

如果希望提示用户选择或输入[选项](#options)，可以在命令的 `handle` 方法中加入提示。但是，如果只希望在用户同时被自动提示缺失参数时才进行提示，可以实现 `afterPromptingForMissingArguments` 方法：

```php
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use function Laravel\Prompts\confirm;

// ...

/**
 * 在用户被提示缺失参数之后执行操作。
 */
protected function afterPromptingForMissingArguments(InputInterface $input, OutputInterface $output): void
{
    $input->setOption('queue', confirm(
        label: 'Would you like to queue the mail?',
        default: $this->option('queue')
    ));
}
```

## 命令 I/O

### 获取输入

命令执行期间，很可能需要访问命令所接收参数和选项的值。为此，可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，则返回 `null`：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $userId = $this->argument('user');
}
```

如果需要以数组形式获取所有参数，可以调用 `arguments` 方法：

```php
$arguments = $this->arguments();
```

选项也可以像参数一样方便地使用 `option` 方法获取。要以数组形式获取所有选项，调用 `options` 方法：

```php
// 获取指定的选项...
$queueName = $this->option('queue');

// 以数组形式获取所有选项...
$options = $this->options();
```

可以使用 `input` 方法将命令的参数和选项作为 `Illuminate\Console\CommandInput` 实例检索，该实例提供了与 HTTP 请求及其他数据容器相同的类型化访问器：

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

`input` 方法也可用于从参数或选项中检索单个输入值：

```php
$queue = $this->input('queue', 'default');
```

### 提示输入

> [!NOTE]
> [Laravel Prompts](/docs/{{version}}/prompts) 是一个 PHP 包，用于为命令行应用添加美观且用户友好的表单，包含占位文本和验证等浏览器特性。

除了显示输出外，还可以在命令执行期间要求用户提供输入。`ask` 方法会向用户展示给定问题，接受他们的输入，然后将用户的输入返回给命令：

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

`secret` 方法与 `ask` 类似，但用户在控制台输入时不会显示输入的内容。该方法在询问密码等敏感信息时非常有用：

```php
$password = $this->secret('What is the password?');
```

#### 请求确认

如果需要向用户询问简单的「是或否」确认，可以使用 `confirm` 方法。默认情况下，该方法返回 `false`。但是，如果用户在提示中输入 `y` 或 `yes`，该方法将返回 `true`。

```php
if ($this->confirm('Do you wish to continue?')) {
    // ...
}
```

必要时，可以通过将 `true` 作为第二个参数传递给 `confirm` 方法来指定确认提示默认返回 `true`：

```php
if ($this->confirm('Do you wish to continue?', true)) {
    // ...
}
```

#### 自动补全

`anticipate` 方法可用于为可能的选项提供自动补全。无论是否提供自动补全提示，用户都可以给出任意回答：

```php
$name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);
```

或者，可以将闭包作为第二个参数传递给 `anticipate` 方法。每次用户输入字符时都会调用该闭包。闭包应接受一个包含用户当前输入的字符串参数，并返回用于自动补全的选项数组：

```php
use App\Models\Address;

$name = $this->anticipate('What is your address?', function (string $input) {
    return Address::whereLike('name', "{$input}%")
        ->limit(5)
        ->pluck('name')
        ->all();
});
```

#### 多项选择题

如果需要在提问时为用户提供预定义的选项集，可以使用 `choice` 方法。可以通过将数组索引作为第三个参数传递给该方法来设置在未选择任何选项时应返回的默认值：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex
);
```

此外，`choice` 方法还接受可选的第四和第五个参数，用于确定选择有效响应的最大尝试次数以及是否允许多选：

```php
$name = $this->choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex,
    $maxAttempts = null,
    $allowMultipleSelections = false
);
```

### 写入输出

要向控制台发送输出，可以使用 `line`、`newLine`、`info`、`comment`、`question`、`warn`、`alert` 和 `error` 方法。这些方法都会根据用途使用适当的 ANSI 颜色。例如，让我们向用户显示一些常规信息。通常 `info` 方法会以绿色文本显示在控制台：

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

要显示错误消息，使用 `error` 方法。错误消息文本通常以红色显示：

```php
$this->error('Something went wrong!');
```

可以使用 `line` 方法显示纯文本（无颜色）：

```php
$this->line('Display this on the screen');
```

可以使用 `newLine` 方法显示一个空行：

```php
// 输出单个空行...
$this->newLine();

// 输出三个空行...
$this->newLine(3);
```

#### 表格

`table` 方法可以方便地正确格式化多行/多列数据。只需提供列名与表格数据，Laravel 就会自动为你计算表格的合适宽度与高度：

```php
use App\Models\User;

$this->table(
    ['Name', 'Email'],
    User::all(['name', 'email'])->toArray()
);
```

#### 进度条

对于长时间运行的任务，显示一个进度条以告知用户任务完成度很有帮助。使用 `withProgressBar` 方法，Laravel 会显示一个进度条，并在遍历给定可迭代对象的每次迭代中推进其进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function (User $user) {
    $this->performTask($user);
});
```

有时你可能需要对进度条的推进方式进行更精细的控制。首先，定义过程将迭代的总步数。然后，在处理完每个项目后推进进度条：

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
> 更多高级选项请参阅 [Symfony Progress Bar 组件文档](https://symfony.com/doc/current/components/console/helpers/progressbar.html)。

## 注册命令

默认情况下，Laravel 会自动注册 `app/Console/Commands` 目录下的所有命令。不过，可以通过应用 `bootstrap/app.php` 文件中的 `withCommands` 方法指示 Laravel 扫描其他目录以查找 Artisan 命令：

```php
->withCommands([
    __DIR__.'/../app/Domain/Orders/Commands',
])
```

必要时，也可以通过将命令的类名提供给 `withCommands` 方法来手动注册命令：

```php
use App\Domain\Orders\Commands\SendEmails;

->withCommands([
    SendEmails::class,
])
```

当 Artisan 启动时，应用中的所有命令都会通过[服务容器](/docs/{{version}}/container) 解析，并注册到 Artisan。

## 以编程方式执行命令

有时你可能希望在 CLI 之外执行 Artisan 命令。例如，希望从路由或控制器执行 Artisan 命令。可以使用 `Artisan` Facade 上的 `call` 方法来实现这一点。`call` 方法的第一个参数接受命令的签名名称或类名，第二个参数接受命令参数组成的数组。返回值是退出码：

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

或者，也可以将完整的 Artisan 命令作为字符串传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

#### 传递数组值

如果命令定义了接受数组的选项，可以向该选项传递一个值数组：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/mail', function () {
    $exitCode = Artisan::call('mail:send', [
        '--id' => [5, 13]
    ]);
});
```

#### 传递布尔值

如果需要为不接受字符串值的选项指定值（例如 `migrate:refresh` 命令上的 `--force` 标志），应将 `true` 或 `false` 作为选项的值传递：

```php
$exitCode = Artisan::call('migrate:refresh', [
    '--force' => true,
]);
```

#### 队列化 Artisan 命令

使用 `Artisan` Facade 上的 `queue` 方法，甚至可以将 Artisan 命令放入队列，以便由[队列工作进程](/docs/{{version}}/queues) 在后台处理。在使用此方法之前，请确保已配置队列并正在运行队列监听器：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/user/{user}/mail', function (string $user) {
    Artisan::queue('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
}
```

使用 `onConnection` 和 `onQueue` 方法，可以指定 Artisan 命令应派发到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

### 从其他命令调用命令

有时你可能希望从现有 Artisan 命令中调用其他命令。可以使用 `call` 方法完成此操作。`call` 方法接受命令名与命令参数/选项数组：

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

如果希望调用另一个控制台命令并抑制其所有输出，可以使用 `callSilently` 方法。`callSilently` 方法的签名与 `call` 方法相同：

```php
$this->callSilently('mail:send', [
    'user' => 1, '--queue' => 'default'
]);
```

## 信号处理

你可能知道，操作系统允许向正在运行的进程发送信号。例如，`SIGTERM` 信号是操作系统请求程序优雅终止的方式。如果希望在 Artisan 控制台命令中监听信号并在信号发生时执行代码，可以使用 `trap` 方法：

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

要同时监听多个信号，可以向 `trap` 方法提供信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function (int $signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

## `dev` 命令

`dev` Artisan 命令会在单个终端窗口中启动本地开发所需的所有进程。默认情况下，它会同时运行 PHP 开发服务器、队列工作进程、通过 [Pail](/docs/{{version}}/logging#tailing-log-messages-using-pail) 进行的日志跟踪，以及 Vite 资源编译：

```shell
php artisan dev
```

在底层，`dev` 命令使用 `@laravel/multiplex` npm 包来管理这些进程，为每个进程提供独立且可搜索、可滚动的标签页输出。每个进程都会被标记并配以颜色编码，便于区分。如果某个进程崩溃，它会自动重启；当你退出时，所有输出都会写回终端，确保不会丢失任何内容。

> [!NOTE]
> `dev` 命令要求 Node 22.13 或更高版本。在 Windows 上，它会回退到 `concurrently` npm 包，且标签页界面不可用。

默认进程如下：

| Name | Command |
| --- | --- |
| `server` | `php artisan serve --host=localhost` |
| `queue` | `php artisan queue:listen --tries=1 --timeout=0` |
| `logs` | `php artisan pail --timeout=0` |
| `vite` | `npm run dev` |

> [!NOTE]
> `vite` 进程会自动检测你的 Node 包管理器（npm、pnpm、Yarn 或 Bun），并使用相应的运行命令。

### 自定义开发进程

可以通过 `DevCommands` 类自定义 `dev` 命令运行的进程，通常在应用的 `AppServiceProvider` 的 `boot` 方法中进行。`register` 方法接受命令字符串和可选名称：

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

注册 Artisan 命令时，可以使用 `artisan` 方法，它会自动在命令前添加 `php artisan` 前缀：

```php
DevCommands::artisan('horizon', 'horizon');
```

类似地，`node` 方法会在命令前添加检测到的包管理器的运行命令（例如 `npm run`），而 `nodeExec` 方法会在命令前添加包管理器的 exec 命令（例如 `npx`）：

```php
DevCommands::node('storybook', 'storybook');

DevCommands::nodeExec('tailwindcss -i resources/css/app.css -o public/css/app.css --watch', 'tailwind');
```

如果使用与默认进程同名的名称注册进程，你的进程将替换默认进程。例如，可以将 server 进程自定义为使用其他端口：

```php
DevCommands::artisan('serve --host=localhost --port=9000', 'server');
```

还可以自定义终端中进程标签的颜色。可用的颜色方法有 `blue`、`purple`、`pink`、`orange`、`green` 和 `yellow`。也可以将自定义十六进制颜色传递给 `color` 方法：

```php
DevCommands::register('my-command', 'my-process')->green();

DevCommands::register('my-command', 'my-process')->color('#ff6347');
```

要在不启动它们的情况下查看所有已注册的开发进程，请使用 `dev:list` 命令：

```shell
php artisan dev:list
```

#### 重启失败的进程

如果某个进程崩溃，Laravel 会在短暂延迟后重启它，最多重启五次，然后才将其标记为失败。启动后一秒钟内死亡的进程不会被重启，因为它很可能从未成功启动过。使用 `r` 手动重启进程会重置计数器。

可以使用 `--no-restart` 选项在单次运行中禁用此行为：

```shell
php artisan dev --no-restart
```

或者，可以使用 `disableAutoRestart` 方法在整个应用中禁用它：

```php
DevCommands::disableAutoRestart();
```

### 过滤开发进程

可以使用 `only` 方法指示 `dev` 命令在被调用时仅运行指定进程。类似地，可以使用 `except` 方法排除特定进程：

```php
// 仅运行 server 与 vite 进程...
DevCommands::only('server', 'vite');

// 运行除 queue 工作进程之外的所有进程...
DevCommands::except('queue');
```

可以使用 `withoutVendorCommands` 和 `withoutDefaultCommands` 方法排除由包或 Laravel 默认命令注册的进程：

```php
DevCommands::withoutVendorCommands();

DevCommands::withoutDefaultCommands();
```

## 自定义存根

Artisan 控制台的 `make` 命令用于创建各种类，例如控制器、任务（job）、迁移和测试。这些类是使用「存根」文件生成的，并基于你的输入填充值。但你可能希望对 Artisan 生成的文件进行小幅修改。为此，可以使用 `stub:publish` 命令将最常用的存根发布到应用中，以便自定义它们：

```shell
php artisan stub:publish
```

发布的存根将位于应用根目录下的 `stubs` 目录中。对这些存根所做的任何更改都会在使用 Artisan 的 `make` 命令生成相应类时生效。

## 事件

Artisan 在运行命令时分发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。`ArtisanStarting` 事件在 Artisan 开始运行时立即分发。接下来，`CommandStarting` 事件在命令运行之前立即分发。最后，`CommandFinished` 事件在命令执行完毕后分发。