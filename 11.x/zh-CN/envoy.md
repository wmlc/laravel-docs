# Laravel Envoy

- [简介](#introduction)
- [安装](#installation)
- [编写任务](#writing-tasks)
    - [定义任务](#defining-tasks)
    - [多台服务器](#multiple-servers)
    - [前置设置](#setup)
    - [变量](#variables)
    - [故事](#stories)
    - [钩子](#completion-hooks)
- [运行任务](#running-tasks)
    - [确认任务执行](#confirming-task-execution)
- [通知](#notifications)
    - [Slack](#slack)
    - [Discord](#discord)
    - [Telegram](#telegram)
    - [Microsoft Teams](#microsoft-teams)

<a name="introduction"></a>
## 简介

[Laravel Envoy](https://github.com/laravel/envoy) 是一个用于在远程服务器上执行常见任务的工具。使用 [Blade](/docs/{{version}}/blade) 风格的语法，你可以轻松地为部署、Artisan 命令等定义任务。目前 Envoy 仅支持 Mac 和 Linux 操作系统。不过，借助 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 也可以实现对 Windows 的支持。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器把 Envoy 安装到你的项目中：

```shell
composer require laravel/envoy --dev
```

Envoy 安装完成后，Envoy 可执行文件就会出现在应用的 `vendor/bin` 目录中：

```shell
php vendor/bin/envoy
```

<a name="writing-tasks"></a>
## 编写任务

<a name="defining-tasks"></a>
### 定义任务

任务是 Envoy 的基本构建块。任务定义了该任务被调用时应该在远程服务器上执行的 Shell 命令。例如，你可以定义一个任务，在应用的所有队列工作进程服务器上执行 `php artisan queue:restart` 命令。

所有 Envoy 任务都应定义在应用根目录下的 `Envoy.blade.php` 文件中。下面是一个帮你入门的示例：

```blade
@servers(['web' => ['user@192.168.1.1'], 'workers' => ['user@192.168.1.2']])

@task('restart-queues', ['on' => 'workers'])
    cd /home/user/example.com
    php artisan queue:restart
@endtask
```

如你所见，文件顶部定义了一个 `@servers` 数组，让你可以通过任务声明中的 `on` 选项引用这些服务器。`@servers` 声明应始终放在单独一行上。在 `@task` 声明中，你应该放置该任务被调用时应在服务器上执行的 Shell 命令。

<a name="local-tasks"></a>
#### 本地任务

你可以通过把服务器 IP 地址指定为 `127.0.0.1`，强制脚本在你自己的计算机上运行：

```blade
@servers(['localhost' => '127.0.0.1'])
```

<a name="importing-envoy-tasks"></a>
#### 导入 Envoy 任务

使用 `@import` 指令，你可以导入其他 Envoy 文件，把它们的 story 和任务加入你自己的文件。文件导入后，你就可以像执行自己 Envoy 文件中定义的任务一样执行它们所包含的任务：

```blade
@import('vendor/package/Envoy.blade.php')
```

<a name="multiple-servers"></a>
### 多台服务器

Envoy 让你可以轻松地在多台服务器上运行同一个任务。首先，在 `@servers` 声明中添加其他服务器。每台服务器都应分配一个唯一的名称。定义好其他服务器后，你可以在任务的 `on` 数组中列出每台服务器：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2']])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

<a name="parallel-execution"></a>
#### 并行执行

默认情况下，任务会在每台服务器上串行执行。换句话说，一个任务会在第一台服务器上运行完毕后，才继续在第二台服务器上执行。如果你想在多台服务器上并行运行同一个任务，请在任务声明中添加 `parallel` 选项：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2'], 'parallel' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

<a name="setup"></a>
### 前置设置

有时你需要在运行 Envoy 任务之前执行任意 PHP 代码。你可以使用 `@setup` 指令定义一段在任务之前执行的 PHP 代码块：

```php
@setup
    $now = new DateTime;
@endsetup
```

如果你需要在任务执行前引入其他 PHP 文件，可以在 `Envoy.blade.php` 文件顶部使用 `@include` 指令：

```blade
@include('vendor/autoload.php')

@task('restart-queues')
    # ...
@endtask
```

<a name="variables"></a>
### 变量

如果需要，你可以在调用 Envoy 时通过命令行指定参数，把它们传递给 Envoy 任务：

```shell
php vendor/bin/envoy run deploy --branch=master
```

你可以在任务中使用 Blade 的"echo"语法访问这些选项。你也可以在任务中定义 Blade 的 `if` 语句和循环。例如，让我们在执行 `git pull` 命令之前先验证 `$branch` 变量是否存在：

```blade
@servers(['web' => ['user@192.168.1.1']])

@task('deploy', ['on' => 'web'])
    cd /home/user/example.com

    @if ($branch)
        git pull origin {{ $branch }}
    @endif

    php artisan migrate --force
@endtask
```

<a name="stories"></a>
### 故事

Story 把一组任务归到一个方便调用的名称下。例如，一个 `deploy` story 可以在其定义中列出任务名，从而运行 `update-code` 和 `install-dependencies` 任务：

```blade
@servers(['web' => ['user@192.168.1.1']])

@story('deploy')
    update-code
    install-dependencies
@endstory

@task('update-code')
    cd /home/user/example.com
    git pull origin master
@endtask

@task('install-dependencies')
    cd /home/user/example.com
    composer install
@endtask
```

Story 写好之后，你就可以像调用任务一样调用它：

```shell
php vendor/bin/envoy run deploy
```

<a name="completion-hooks"></a>
### 钩子

当任务和 story 运行时，会执行一系列钩子。Envoy 支持的钩子类型有 `@before`、`@after`、`@error`、`@success` 和 `@finished`。这些钩子中的所有代码都会被解释为 PHP 并在本地执行，而不是在任务与之交互的远程服务器上执行。

每种钩子你都可以定义任意多个。它们会按照在 Envoy 脚本中出现的顺序执行。

<a name="hook-before"></a>
#### `@before`

每次任务执行之前，Envoy 脚本中注册的所有 `@before` 钩子都会执行。`@before` 钩子会接收到将要执行的任务名称：

```blade
@before
    if ($task === 'deploy') {
        // ...
    }
@endbefore
```

<a name="completion-after"></a>
#### `@after`

每次任务执行之后，Envoy 脚本中注册的所有 `@after` 钩子都会执行。`@after` 钩子会接收到已执行的任务名称：

```blade
@after
    if ($task === 'deploy') {
        // ...
    }
@endafter
```

<a name="completion-error"></a>
#### `@error`

每次任务失败（以大于 `0` 的状态码退出）之后，Envoy 脚本中注册的所有 `@error` 钩子都会执行。`@error` 钩子会接收到已执行的任务名称：

```blade
@error
    if ($task === 'deploy') {
        // ...
    }
@enderror
```

<a name="completion-success"></a>
#### `@success`

如果所有任务都没有错误地执行完毕，Envoy 脚本中注册的所有 `@success` 钩子都会执行：

```blade
@success
    // ...
@endsuccess
```

<a name="completion-finished"></a>
#### `@finished`

在所有任务都执行完毕之后（无论退出状态如何），所有 `@finished` 钩子都会执行。`@finished` 钩子会接收到已完成任务的状态码，它可能是 `null`，也可能是大于或等于 `0` 的 `integer`：

```blade
@finished
    if ($exitCode > 0) {
        // 某个任务中出现了错误……
    }
@endfinished
```

<a name="running-tasks"></a>
## 运行任务

要运行应用中 `Envoy.blade.php` 文件里定义的任务或 story，请执行 Envoy 的 `run` 命令，并传入你希望执行的任务或 story 名称。Envoy 会执行该任务，并在任务运行期间显示来自远程服务器的输出：

```shell
php vendor/bin/envoy run deploy
```

<a name="confirming-task-execution"></a>
### 确认任务执行

如果你希望在服务器上运行某个任务前得到确认提示，可以在任务声明中添加 `confirm` 指令。该选项对破坏性操作尤其有用：

```blade
@task('deploy', ['on' => 'web', 'confirm' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate
@endtask
```

<a name="notifications"></a>
## 通知

<a name="slack"></a>
### Slack

Envoy 支持在每个任务执行完毕后向 [Slack](https://slack.com) 发送通知。`@slack` 指令接受一个 Slack hook URL 和一个频道 / 用户名。你可以在 Slack 控制面板中创建"Incoming WebHooks"集成来获取 webhook URL。

你应当把完整的 webhook URL 作为 `@slack` 指令的第一个参数传入。`@slack` 指令的第二个参数应当是频道名（`#channel`）或用户名（`@user`）：

```blade
@finished
    @slack('webhook-url', '#bots')
@endfinished
```

默认情况下，Envoy 通知会向通知频道发送一条描述已执行任务的消息。不过，你可以通过向 `@slack` 指令传入第三个参数，用自己的自定义消息覆盖这条消息：

```blade
@finished
    @slack('webhook-url', '#bots', 'Hello, Slack.')
@endfinished
```

<a name="discord"></a>
### Discord

Envoy 也支持在每个任务执行完毕后向 [Discord](https://discord.com) 发送通知。`@discord` 指令接受一个 Discord hook URL 和一条消息。你可以在 Server Settings 中创建"Webhook"并选择该 webhook 应发布到哪个频道，来获取 webhook URL。你应当把完整的 Webhook URL 传入 `@discord` 指令：

```blade
@finished
    @discord('discord-webhook-url')
@endfinished
```

<a name="telegram"></a>
### Telegram

Envoy 也支持在每个任务执行完毕后向 [Telegram](https://telegram.org) 发送通知。`@telegram` 指令接受一个 Telegram Bot ID 和一个 Chat ID。你可以使用 [BotFather](https://t.me/botfather) 创建新机器人来获取 Bot ID。你可以使用 [@username_to_id_bot](https://t.me/username_to_id_bot) 获取有效的 Chat ID。你应当把完整的 Bot ID 和 Chat ID 传入 `@telegram` 指令：

```blade
@finished
    @telegram('bot-id','chat-id')
@endfinished
```

<a name="microsoft-teams"></a>
### Microsoft Teams

Envoy 也支持在每个任务执行完毕后向 [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams) 发送通知。`@microsoftTeams` 指令接受一个 Teams Webhook（必填）、一条消息、主题颜色（success、info、warning、error）以及一个选项数组。你可以创建新的[传入 webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)来获取 Teams Webhook。Teams API 还有许多其他属性可用于自定义消息框，例如标题、摘要和分区。你可以在 [Microsoft Teams 文档](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using?tabs=cURL#example-of-connector-message)中了解更多信息。你应当把完整的 Webhook URL 传入 `@microsoftTeams` 指令：

```blade
@finished
    @microsoftTeams('webhook-url')
@endfinished
```
