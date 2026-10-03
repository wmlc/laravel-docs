# Artisan 命令行

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
    - [缺失输入的提示](#prompting-for-missing-input)
- [命令输入输出](#command-io)
    - [获取输入](#retrieving-input)
    - [提示输入](#prompting-for-input)
    - [输出内容](#writing-output)
- [注册命令](#registering-commands)
- [以编程方式执行命令](#programmatically-executing-commands)
    - [从其他命令调用命令](#calling-commands-from-other-commands)
- [信号处理](#signal-handling)
- [桩文件定制](#stub-customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

Artisan 是 Laravel 自带的命令行界面。Artisan 以 `artisan` 脚本的形式位于应用根目录，提供大量实用命令，帮助你构建应用。要查看所有可用的 Artisan 命令，可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还提供一个「帮助」界面，用于展示并说明该命令可用的参数与选项。要查看帮助界面，请在命令名前加上 `help`：

```shell
php artisan help migrate
```

<a name="laravel-sail"></a>
#### Laravel Sail

如果你使用 [Laravel Sail](/docs/{{version}}/sail) 作为本地开发环境，请记得使用 `sail` 命令行来调用 Artisan 命令。Sail 会在应用的 Docker 容器中执行 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

<a name="tinker"></a>
### Tinker（REPL）

Laravel Tinker 是 Laravel 框架强大的 REPL 工具，由 [PsySH](https://github.com/bobthecow/psysh) 包提供支持。

<a name="installation"></a>
#### 安装

所有 Laravel 应用默认都包含 Tinker。不过，如果你此前已从应用中移除 Tinker，可以使用 Composer 重新安装：

```shell
composer require laravel/tinker
```

> [!NOTE]
> 需要热重载、多行代码编辑，以及与 Laravel 应用交互时的自动补全？快去看看 [Tinkerwell](https://tinkerwell.app)！

<a name="usage"></a>
#### 使用方法

Tinker 让你在命令行中与整个 Laravel 应用交互，包括 Eloquent 模型、作业、事件等。要进入 Tinker 环境，请运行 `tinker` Artisan 命令：

```shell
php artisan tinker
```

你可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

> [!WARNING]
> `dispatch` 辅助函数以及 `Dispatchable` 类上的 `dispatch` 方法都依赖垃圾回收机制把作业放入队列。因此，使用 tinker 时你应当使用 `Bus::dispatch` 或 `Queue::push` 来派发作业。

<a name="command-allow-list"></a>
#### 命令白名单

Tinker 使用一份「允许」列表来决定哪些 Artisan 命令可以在其 shell 中运行。默认情况下，你可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`migrate:install`、`up` 和 `optimize` 命令。如果想允许更多命令，可以把它们添加到 `tinker.php` 配置文件的 `commands` 数组中：

    'commands' => [
        // App\Console\Commands\ExampleCommand::class,
    ],

<a name="classes-that-should-not-be-aliased"></a>
#### 不应被别名的类

通常情况下，你在使用 Tinker 与类交互时，Tinker 会自动为类创建别名。不过，你可能希望某些类永远不被别名化。为此，可以把这些类列在 `tinker.php` 配置文件的 `dont_alias` 数组中：

    'dont_alias' => [
        App\Models\User::class,
    ],

<a name="writing-commands"></a>
## 编写命令

除了 Artisan 自带的命令外，你还可以构建自己的自定义命令。命令通常存放在 `app/Console/Commands` 目录中；不过，只要 Composer 能够加载你的命令，你可以自由选择存放位置。

<a name="generating-commands"></a>
### 生成命令

要创建新命令，可以使用 `make:command` Artisan 命令。该命令会在 `app/Console/Commands` 目录下创建一个新的命令类。如果你的应用中还没有这个目录，也不必担心——首次运行 `make:command` Artisan 命令时它会自动创建：

```shell
php artisan make:command SendEmails
```

<a name="command-structure"></a>
### 命令结构

生成命令后，你应该为类的 `signature` 和 `description` 属性定义合适的值。这些属性会用于在 `list` 界面中展示你的命令。`signature` 属性还允许你定义[命令的输入预期](#defining-input-expectations)。执行命令时，系统会调用 `handle` 方法，你可以把命令逻辑写在该方法中。

我们来看一个命令示例。注意，我们可以通过命令的 `handle` 方法请求所需的任何依赖。Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)会自动注入该方法签名中所有类型提示的依赖：

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
         */
        public function handle(DripEmailer $drip): void
        {
            $drip->send(User::find($this->argument('user')));
        }
    }

> [!NOTE]
> 为了更好地复用代码，建议让控制台命令保持轻量，把具体任务交给应用服务去完成。上面的示例中，我们注入了一个服务类来承担发送邮件的「重活」。

<a name="exit-codes"></a>
#### 退出码

如果 `handle` 方法没有返回值并且命令执行成功，命令将以 `0` 退出码退出，表示成功。不过，`handle` 方法也可以选择返回一个整数，手动指定命令的退出码：

    $this->error('Something went wrong.');

    return 1;

如果你想在命令中的任意方法里「判定失败」，可以使用 `fail` 方法。`fail` 方法会立即终止命令的执行，并返回退出码 `1`：

    $this->fail('Something went wrong.');

<a name="closure-commands"></a>
### 闭包命令

基于闭包的命令提供了以类定义控制台命令之外的另一种选择。就像路由闭包是控制器的替代方案一样，你可以把命令闭包看作命令类的替代方案。

虽然 `routes/console.php` 文件不定义 HTTP 路由，但它定义了进入应用的基于控制台的入口（路由）。在该文件中，你可以使用 `Artisan::command` 方法定义所有基于闭包的控制台命令。`command` 方法接收两个参数：[命令签名](#defining-input-expectations)和一个闭包，该闭包接收命令的参数与选项：

    Artisan::command('mail:send {user}', function (string $user) {
        $this->info("Sending email to: {$user}!");
    });

该闭包会绑定到底层的命令实例，因此你可以完整访问完整命令类上通常能用的所有辅助方法。

<a name="type-hinting-dependencies"></a>
#### 类型提示依赖

除了接收命令的参数和选项外，命令闭包还可以对其它的依赖做类型提示，这些依赖将从[服务容器](/docs/{{version}}/container)中解析：

    use App\Models\User;
    use App\Support\DripEmailer;

    Artisan::command('mail:send {user}', function (DripEmailer $drip, string $user) {
        $drip->send(User::find($user));
    });

<a name="closure-command-descriptions"></a>
#### 闭包命令描述

定义基于闭包的命令时，你可以使用 `purpose` 方法为命令添加描述。运行 `php artisan list` 或 `php artisan help` 命令时，该描述会显示出来：

    Artisan::command('mail:send {user}', function (string $user) {
        // ...
    })->purpose('Send a marketing email to a user');

<a name="isolatable-commands"></a>
### 可隔离命令

> [!WARNING]
> 要使用该特性，你的应用必须以 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

有时你可能希望确保某个命令同一时刻只能运行一个实例。为此，你可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

    <?php

    namespace App\Console\Commands;

    use Illuminate\Console\Command;
    use Illuminate\Contracts\Console\Isolatable;

    class SendEmails extends Command implements Isolatable
    {
        // ...
    }

当命令被标记为 `Isolatable` 后，Laravel 会自动为该命令添加一个 `--isolated` 选项。当使用该选项调用命令时，Laravel 会确保没有其它该命令的实例正在运行。Laravel 通过尝试使用应用的默认缓存驱动获取原子锁来实现这一点。如果该命令的其它实例正在运行，命令将不会执行；不过，命令仍会以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果你想指定命令无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供期望的状态码：

```shell
php artisan mail:send 1 --isolated=12
```

<a name="lock-id"></a>
#### 锁 ID

默认情况下，Laravel 会使用命令名称生成字符串键，用于在你的应用缓存中获取原子锁。不过，你可以在 Artisan 命令类上定义 `isolatableId` 方法来自定义这个键，从而把命令的参数或选项整合进键中：

```php
/**
 * 获取该命令的可隔离 ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

<a name="lock-expiration-time"></a>
#### 锁过期时间

默认情况下，隔离锁会在命令结束后过期。如果命令被中断而无法结束，锁会在一小时后过期。不过，你可以在命令上定义 `isolationLockExpiresAt` 方法来调整锁的过期时间：

```php
use DateTimeInterface;
use DateInterval;

/**
 * 确定该命令的隔离锁何时过期。
 */
public function isolationLockExpiresAt(): DateTimeInterface|DateInterval
{
    return now()->addMinutes(5);
}
```

<a name="defining-input-expectations"></a>
## 定义输入预期

编写控制台命令时，通常需要通过参数或选项从用户那里收集输入。Laravel 让你可以十分便捷地使用命令上的 `signature` 属性来定义期望用户提供的输入。`signature` 属性允许你用一套简洁、类路由的语法一次性定义命令的名称、参数和选项。

<a name="arguments"></a>
### 参数

所有用户提供的参数和选项都用花括号包裹。在下面的示例中，命令定义了一个必需参数：`user`：

    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

你也可以把参数设为可选，或为参数定义默认值：

    // 可选参数...
    'mail:send {user?}'

    // 带默认值的可选参数...
    'mail:send {user=foo}'

<a name="options"></a>
### 选项

选项和参数一样，也是用户输入的一种形式。通过命令行提供时，选项以两个连字符（`--`）为前缀。选项分为两类：接收值的选项和不接收值的选项。不接收值的选项充当布尔「开关」。我们来看一个这类选项的示例：

    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user} {--queue}';

在这个示例中，调用 Artisan 命令时可以指定 `--queue` 开关。如果传入 `--queue` 开关，选项的值为 `true`；否则该值为 `false`：

```shell
php artisan mail:send 1 --queue
```

<a name="options-with-values"></a>
#### 带值的选项

接下来，我们来看一个期望接收值的选项。如果用户必须为某个选项指定值，你应当在选项名后加上 `=` 号：

    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user} {--queue=}';

在这个示例中，用户可以这样为选项传入值。如果调用命令时没有指定该选项，其值为 `null`：

```shell
php artisan mail:send 1 --queue=default
```

你可以通过在选项名后写上默认值来为选项指定默认值。如果用户没有传入选项值，就会使用该默认值：

    'mail:send {user} {--queue=default}'

<a name="option-shortcuts"></a>
#### 选项快捷键

定义选项时如果想指定快捷键，可以把快捷键写在选项名之前，并用 `|` 字符作为分隔符，将快捷键与完整的选项名分开：

    'mail:send {user} {--Q|queue}'

在终端中调用命令时，选项快捷键应以单个连字符为前缀，并且指定选项值时不要包含 `=` 字符：

```shell
php artisan mail:send 1 -Qdefault
```

<a name="input-arrays"></a>
### 输入数组

如果你希望某个参数或选项接收多个输入值，可以使用 `*` 字符。首先，我们来看一个指定这类参数的示例：

    'mail:send {user*}'

调用该命令时，可以按顺序向命令行传入 `user` 参数。例如，以下命令会把 `user` 的值设为一个数组，其元素为 `1` 和 `2`：

```shell
php artisan mail:send 1 2
```

`*` 字符可以与可选参数定义结合使用，从而允许传入零个或多个该参数：

    'mail:send {user?*}'

<a name="option-arrays"></a>
#### 选项数组

定义期望接收多个输入值的选项时，传入命令的每个选项值都应以选项名为前缀：

    'mail:send {--id=*}'

调用这类命令时，可以传入多个 `--id` 参数：

```shell
php artisan mail:send --id=1 --id=2
```

<a name="input-descriptions"></a>
### 输入描述

你可以通过用冒号把参数名与描述分开，为输入参数和选项指定描述。如果定义命令时需要更多空间，可以把定义分散到多行：

    /**
     * 控制台命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send
                            {user : The ID of the user}
                            {--queue : Whether the job should be queued}';

<a name="prompting-for-missing-input"></a>
### 缺失输入的提示

如果命令包含必需参数，而用户没有提供这些参数，就会收到一条错误信息。你也可以实现 `PromptsForMissingInput` 接口，配置命令在缺少必需参数时自动提示用户：

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

当 Laravel 需要从用户那里获取某个必需参数时，它会自动向用户询问该参数，并依据参数名或描述智能地组织问题文本。如果你想自定义用于获取必需参数的问题，可以实现 `promptForMissingArgumentsUsing` 方法，返回一个以参数名为键的问答数组：

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

你也可以提供一个包含问题与占位符的元组来提供占位文本：

    return [
        'user' => ['Which user ID should receive the mail?', 'E.g. 123'],
    ];

如果你想完全控制提示内容，可以提供一个闭包，由该闭包提示用户并返回用户的回答：

    use App\Models\User;
    use function Laravel\Prompts\search;

    // ...

    return [
        'user' => fn () => search(
            label: 'Search for a user:',
            placeholder: 'E.g. Taylor Otwell',
            options: fn ($value) => strlen($value) > 0
                ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
                : []
        ),
    ];

> [!NOTE]
完整的 [Laravel Prompts](/docs/{{version}}/prompts) 文档包含可用提示及其用法的更多信息。

如果你想提示用户选择或输入[选项](#options)，可以在命令的 `handle` 方法中加入提示。不过，如果你只希望在用户同时被提示缺失参数后再进行提示，可以实现 `afterPromptingForMissingArguments` 方法：

    use Symfony\Component\Console\Input\InputInterface;
    use Symfony\Component\Console\Output\OutputInterface;
    use function Laravel\Prompts\confirm;

    // ...

    /**
     * 在提示用户缺失参数之后执行操作。
     */
    protected function afterPromptingForMissingArguments(InputInterface $input, OutputInterface $output): void
    {
        $input->setOption('queue', confirm(
            label: 'Would you like to queue the mail?',
            default: $this->option('queue')
        ));
    }

<a name="command-io"></a>
## 命令输入输出

<a name="retrieving-input"></a>
### 获取输入

命令执行期间，你很可能需要访问命令所接受的参数与选项的值。为此，你可以使用 `argument` 和 `option` 方法。如果某个参数或选项不存在，将返回 `null`：

    /**
     * 执行控制台命令。
     */
    public function handle(): void
    {
        $userId = $this->argument('user');
    }

如果需要以 `array` 形式获取全部参数，请调用 `arguments` 方法：

    $arguments = $this->arguments();

选项的获取方式与参数完全相同，同样使用 `option` 方法。要以数组形式获取全部选项，请调用 `options` 方法：

    // 获取特定选项...
    $queueName = $this->option('queue');

    // 以数组形式获取全部选项...
    $options = $this->options();

<a name="prompting-for-input"></a>
### 提示输入

> [!NOTE]
> [Laravel Prompts](/docs/{{version}}/prompts) 是一个 PHP 包，用于为命令行应用添加美观且友好的表单，并提供类似浏览器的功能，包括占位文本和验证。

除了输出内容外，你还可以在命令执行期间要求用户提供输入。`ask` 方法会提示用户回答给定问题、接收其输入，然后把用户输入返回给你的命令：

    /**
     * 执行控制台命令。
     */
    public function handle(): void
    {
        $name = $this->ask('What is your name?');

        // ...
    }

`ask` 方法还接受可选的第二个参数，用于指定用户未提供输入时返回的默认值：

    $name = $this->ask('What is your name?', 'Taylor');

`secret` 方法与 `ask` 类似，但用户在控制台中输入时看不到自己输入的内容。该方法适用于询问密码等敏感信息：

    $password = $this->secret('What is the password?');

<a name="asking-for-confirmation"></a>
#### 请求确认

如果你需要向用户询问简单的「是或否」确认，可以使用 `confirm` 方法。默认情况下，该方法返回 `false`。不过，如果用户针对提示输入 `y` 或 `yes`，该方法将返回 `true`。

    if ($this->confirm('Do you wish to continue?')) {
        // ...
    }

必要时，你可以把 `true` 作为 `confirm` 方法的第二个参数传入，指定确认提示默认返回 `true`：

    if ($this->confirm('Do you wish to continue?', true)) {
        // ...
    }

<a name="auto-completion"></a>
#### 自动补全

`anticipate` 方法可用于为可能的选项提供自动补全。无论是否有自动补全提示，用户仍然可以提供任何回答：

    $name = $this->anticipate('What is your name?', ['Taylor', 'Dayle']);

此外，你也可以把闭包作为 `anticipate` 方法的第二个参数传入。用户每输入一个字符，该闭包都会被调用一次。闭包应接收一个字符串参数，其中包含用户目前的输入，并返回用于自动补全的选项数组：

    $name = $this->anticipate('What is your address?', function (string $input) {
        // 返回自动补全选项...
    });

<a name="multiple-choice-questions"></a>
#### 多选题

如果你需要在提问时给用户提供一组预定义的选项，可以使用 `choice` 方法。通过把索引作为方法的第三个参数传入，可以设置未选择任何选项时返回的默认值的数组下标：

    $name = $this->choice(
        'What is your name?',
        ['Taylor', 'Dayle'],
        $defaultIndex
    );

此外，`choice` 方法还接受可选的第四、第五个参数，用于确定选择有效答案的最大尝试次数，以及是否允许选择多项：

    $name = $this->choice(
        'What is your name?',
        ['Taylor', 'Dayle'],
        $defaultIndex,
        $maxAttempts = null,
        $allowMultipleSelections = false
    );

<a name="writing-output"></a>
### 输出内容

要向控制台输出内容，你可以使用 `line`、`info`、`comment`、`question`、`warn` 和 `error` 方法。这些方法会按各自用途使用恰当的 ANSI 颜色。例如，我们向用户展示一些常规信息。通常 `info` 方法会以绿色文字显示在控制台中：

    /**
     * 执行控制台命令。
     */
    public function handle(): void
    {
        // ...

        $this->info('The command was successful!');
    }

要显示错误信息，请使用 `error` 方法。错误信息文本通常以红色显示：

    $this->error('Something went wrong!');

你可以使用 `line` 方法显示无颜色的纯文本：

    $this->line('Display this on the screen');

你可以使用 `newLine` 方法显示一个空行：

    // 写入一个空行...
    $this->newLine();

    // 写入三个空行...
    $this->newLine(3);

<a name="tables"></a>
#### 表格

`table` 方法让你可以轻松地正确格式化多行多列的数据。你只需提供列名和表格数据，Laravel 就会
自动为你计算表格的合适宽度和高度：

    use App\Models\User;

    $this->table(
        ['Name', 'Email'],
        User::all(['name', 'email'])->toArray()
    );

<a name="progress-bars"></a>
#### 进度条

对于长时间运行的任务，显示进度条有助于告知用户任务的完成情况。使用 `withProgressBar` 方法，Laravel 会显示一个进度条，并在每次遍历给定的可迭代值时推进进度：

    use App\Models\User;

    $users = $this->withProgressBar(User::all(), function (User $user) {
        $this->performTask($user);
    });

有时你可能需要对进度条的推进方式进行更多手动控制。首先，定义整个过程将遍历的总步数。然后，在处理完每个条目后推进进度条：

    $users = App\Models\User::all();

    $bar = $this->output->createProgressBar(count($users));

    $bar->start();

    foreach ($users as $user) {
        $this->performTask($user);

        $bar->advance();
    }

    $bar->finish();

> [!NOTE]
> 想了解更高级的选项，请查阅 [Symfony Progress Bar 组件文档](https://symfony.com/doc/7.0/components/console/helpers/progressbar.html)。

<a name="registering-commands"></a>
## 注册命令

默认情况下，Laravel 会自动注册 `app/Console/Commands` 目录下的所有命令。不过，你可以在应用的 `bootstrap/app.php` 文件中使用 `withCommands` 方法，让 Laravel 扫描其它目录中的 Artisan 命令：

    ->withCommands([
        __DIR__.'/../app/Domain/Orders/Commands',
    ])

必要时，你也可以把命令的类名传给 `withCommands` 方法，手动注册命令：

    use App\Domain\Orders\Commands\SendEmails;

    ->withCommands([
        SendEmails::class,
    ])

Artisan 启动时，应用中的所有命令都会由[服务容器](/docs/{{version}}/container)解析并注册到 Artisan。

<a name="programmatically-executing-commands"></a>
## 以编程方式执行命令

有时你可能希望在 CLI 之外执行 Artisan 命令。例如，你可能想从路由或控制器中执行某个 Artisan 命令。为此，可以使用 `Artisan` Facade 上的 `call` 方法。`call` 方法的第一个参数接受命令签名名称或类名，第二个参数接受命令参数数组，并返回退出码：

    use Illuminate\Support\Facades\Artisan;

    Route::post('/user/{user}/mail', function (string $user) {
        $exitCode = Artisan::call('mail:send', [
            'user' => $user, '--queue' => 'default'
        ]);

        // ...
    });

此外，你也可以把整条 Artisan 命令作为字符串传给 `call` 方法：

    Artisan::call('mail:send 1 --queue=default');

<a name="passing-array-values"></a>
#### 传递数组值

如果命令定义了接受数组的选项，你可以向该选项传入一组值：

    use Illuminate\Support\Facades\Artisan;

    Route::post('/mail', function () {
        $exitCode = Artisan::call('mail:send', [
            '--id' => [5, 13]
        ]);
    });

<a name="passing-boolean-values"></a>
#### 传递布尔值

如果需要指定不接受字符串值的选项，例如 `migrate:refresh` 命令上的 `--force` 标志，你应当把 `true` 或 `false` 作为选项值传入：

    $exitCode = Artisan::call('migrate:refresh', [
        '--force' => true,
    ]);

<a name="queueing-artisan-commands"></a>
#### 将 Artisan 命令加入队列

通过 `Artisan` Facade 上的 `queue` 方法，你甚至可以把 Artisan 命令加入队列，让[队列工作进程](/docs/{{version}}/queues)在后台处理它们。使用该方法前，请确保已配置好队列并运行着队列监听进程：

    use Illuminate\Support\Facades\Artisan;

    Route::post('/user/{user}/mail', function (string $user) {
        Artisan::queue('mail:send', [
            'user' => $user, '--queue' => 'default'
        ]);

        // ...
    });

使用 `onConnection` 和 `onQueue` 方法，你可以指定派发 Artisan 命令时使用的连接或队列：

    Artisan::queue('mail:send', [
        'user' => 1, '--queue' => 'default'
    ])->onConnection('redis')->onQueue('commands');

<a name="calling-commands-from-other-commands"></a>
### 从其他命令调用命令

有时你可能想从已有的 Artisan 命令中调用其它命令。为此可以使用 `call` 方法。`call` 方法接受命令名称和命令参数／选项数组：

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

如果你想调用另一个控制台命令并抑制其全部输出，可以使用 `callSilently` 方法。`callSilently` 方法的签名与 `call` 方法相同：

    $this->callSilently('mail:send', [
        'user' => 1, '--queue' => 'default'
    ]);

<a name="signal-handling"></a>
## 信号处理

你可能已经知道，操作系统允许向运行中的进程发送信号。例如，`SIGTERM` 信号是操作系统请求程序终止的方式。如果你希望在 Artisan 命令中监听信号并在信号发生时执行代码，可以使用 `trap` 方法：

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

要同时监听多个信号，可以向 `trap` 方法传入一个信号数组：

    $this->trap([SIGTERM, SIGQUIT], function (int $signal) {
        $this->shouldKeepRunning = false;

        dump($signal); // SIGTERM / SIGQUIT
    });

<a name="stub-customization"></a>
## 桩文件定制

Artisan 命令行的 `make` 命令用于创建各类类，例如控制器、作业、数据库迁移和测试。这些类由「桩」（stub）文件生成，生成时会依据你的输入填充相应内容。不过，你可能想对 Artisan 生成的文件做少量修改。为此，可以使用 `stub:publish` 命令把最常用的桩发布到你的应用中，以便进行定制：

```shell
php artisan stub:publish
```

发布的桩文件会位于应用根目录下的 `stubs` 目录中。你对这些桩文件所做的任何改动，都会在使用 Artisan 的 `make` 命令生成对应类时生效。

<a name="events"></a>
## 事件

Artisan 在运行命令时会派发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。Artisan 开始运行时立即派发 `ArtisanStarting` 事件。接着，在命令运行前立即派发 `CommandStarting` 事件。最后，命令执行完毕后派发 `CommandFinished` 事件。
