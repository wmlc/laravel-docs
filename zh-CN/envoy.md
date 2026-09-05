# Laravel Envoy

## 简介

[Laravel Envoy](https://github.com/laravel/envoy) 是一个用于在远程服务器上执行常见任务的工具。借助 [Blade](/docs/{{version}}/blade) 风格的语法，你可以轻松地为部署、Artisan 命令等设置任务。目前，Envoy 仅支持 Mac 和 Linux 操作系统。不过，使用 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 也可以在 Windows 上运行。

## 安装

首先，使用 Composer 包管理器将 Envoy 安装到你的项目中：

```shell
composer require laravel/envoy --dev
```

安装 Envoy 后，Envoy 二进制文件将位于你应用的 `vendor/bin` 目录中：

```shell
php vendor/bin/envoy
```

## 编写任务

### 定义任务

任务是 Envoy 的基本构建块。任务定义了在调用任务时，应该在远程服务器上执行的 Shell 命令。例如，你可以定义一个任务，在所有应用队列工作服务器上执行 `php artisan queue:restart` 命令。

你所有的 Envoy 任务都应该定义在应用根目录下的 `Envoy.blade.php` 文件中。下面是一个入门示例：

```blade
@servers(['web' => ['user@192.168.1.1'], 'workers' => ['user@192.168.1.2']])

@task('restart-queues', ['on' => 'workers'])
    cd /home/user/example.com
    php artisan queue:restart
@endtask
```

如你所见，文件顶部定义了一个 `@servers` 数组，让你可以通过任务声明中的 `on` 选项来引用这些服务器。`@servers` 声明应始终写在一行内。在 `@task` 声明中，你应该放置调用任务时应在服务器上执行的 Shell 命令。

#### 本地任务

你可以将服务器的 IP 地址指定为 `127.0.0.1`，强制脚本在你的本地计算机上运行：

```blade
@servers(['localhost' => '127.0.0.1'])
```

#### 导入 Envoy 任务

使用 `@import` 指令，你可以导入其他 Envoy 文件，从而将它们的 story 和任务添加到你的文件中。导入文件后，你就可以像执行自己 Envoy 文件中定义的任务一样，执行它们包含的任务：

```blade
@import('vendor/package/Envoy.blade.php')
```

### 多台服务器

Envoy 允许你轻松地在多台服务器上运行任务。首先，在你的 `@servers` 声明中添加更多服务器。每台服务器应分配一个唯一的名称。定义好额外的服务器后，你可以在任务的 `on` 数组中列出每台服务器：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2']])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

#### 并行执行

默认情况下，任务会依次在各台服务器上执行。换句话说，任务会在第一台服务器上运行完成，才会继续在第二台服务器上执行。如果你希望在多台服务器上并行运行任务，可以在任务声明中添加 `parallel` 选项：

```blade
@servers(['web-1' => '192.168.1.1', 'web-2' => '192.168.1.2'])

@task('deploy', ['on' => ['web-1', 'web-2'], 'parallel' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate --force
@endtask
```

### 设置

有时，你可能需要在运行 Envoy 任务之前执行任意 PHP 代码。你可以使用 `@setup` 指令定义一个应该在任务执行前运行的 PHP 代码块：

```php
@setup
    $now = new DateTime;
@endsetup
```

如果你需要在任务执行前引入其他 PHP 文件，可以在 `Envoy.blade.php` 文件的顶部使用 `@include` 指令：

```blade
@include('vendor/autoload.php')

@task('restart-queues')
    # ...
@endtask
```

### 变量

如果需要，你可以在调用 Envoy 时在命令行中指定参数，从而将它们传递给 Envoy 任务：

```shell
php vendor/bin/envoy run deploy --branch=master
```

你可以使用 Blade 的"输出（echo）"语法在任务中访问这些选项。你也可以在任务中定义 Blade 的 `if` 语句和循环。例如，我们在执行 `git pull` 命令之前，先验证 `$branch` 变量是否存在：

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

### Stories

Stories 将一组任务归到一个方便的名称下。例如，一个 `deploy` story 可以通过在其定义中列出任务名来运行 `update-code` 和 `install-dependencies` 任务：

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

story 编写完成后，你可以像调用任务一样调用它：

```shell
php vendor/bin/envoy run deploy
```

### 钩子（Hooks）

当任务和 story 运行时，会执行若干钩子。Envoy 支持的钩子类型有 `@before`、`@after`、`@error`、`@success` 和 `@finished`。这些钩子中的所有代码都会被当作 PHP 解释并在本地执行，而非在任务交互的远程服务器上执行。

你可以根据需要定义任意数量的上述钩子。它们会按照在 Envoy 脚本中出现的顺序执行。

#### `@before`

在每次任务执行之前，Envoy 脚本中注册的所有 `@before` 钩子都会执行。`@before` 钩子会接收将要执行的任务名称：

```blade
@before
    if ($task === 'deploy') {
        // ...
    }
@endbefore
```

#### `@after`

在每次任务执行之后，Envoy 脚本中注册的所有 `@after` 钩子都会执行。`@after` 钩子会接收已执行的任务名称：

```blade
@after
    if ($task === 'deploy') {
        // ...
    }
@endafter
```

#### `@error`

在每次任务失败（退出状态码大于 `0`）之后，Envoy 脚本中注册的所有 `@error` 钩子都会执行。`@error` 钩子会接收已执行的任务名称：

```blade
@error
    if ($task === 'deploy') {
        // ...
    }
@enderror
```

#### `@success`

如果所有任务都成功执行、没有出错，Envoy 脚本中注册的所有 `@success` 钩子都会执行：

```blade
@success
    // ...
@endsuccess
```

#### `@finished`

在所有任务执行完毕（无论退出状态如何）之后，所有 `@finished` 钩子都会执行。`@finished` 钩子会接收已完成任务的状态码，该状态码可能为 `null` 或一个大于等于 `0` 的 `integer`：

```blade
@finished
    if ($exitCode > 0) {
        // 某个任务中出现了错误……
    }
@endfinished
```

## 运行任务

要运行定义在应用 `Envoy.blade.php` 文件中的任务或 story，请执行 Envoy 的 `run` 命令，并传入你想要执行的任务或 story 名称。Envoy 会执行该任务，并在任务运行时显示来自远程服务器的输出：

```shell
php vendor/bin/envoy run deploy
```

### 确认任务执行

如果你希望在服务器上运行某个给定任务之前弹出确认提示，应该在任务声明中添加 `confirm` 指令。该选项对于破坏性操作尤其有用：

```blade
@task('deploy', ['on' => 'web', 'confirm' => true])
    cd /home/user/example.com
    git pull origin {{ $branch }}
    php artisan migrate
@endtask
```

## 通知

### Slack

Envoy 支持在每次任务执行后向 [Slack](https://slack.com) 发送通知。`@slack` 指令接受一个 Slack hook URL 以及一个频道 / 用户名。你可以在 Slack 控制面板中创建"Incoming WebHooks"集成来获取你的 webhook URL。

你应该将完整的 webhook URL 作为传给 `@slack` 指令的第一个参数。传给 `@slack` 指令的第二个参数应该是一个频道名（`#channel`）或用户名（`@user`）：

```blade
@finished
    @slack('webhook-url', '#bots')
@endfinished
```

默认情况下，Envoy 通知会向通知频道发送一条描述已执行任务的信息。不过，你可以通过向 `@slack` 指令传入第三个参数，来用自己的自定义消息覆盖这条消息：

```blade
@finished
    @slack('webhook-url', '#bots', 'Hello, Slack.')
@endfinished
```

### Discord

Envoy 还支持在每次任务执行后向 [Discord](https://discord.com) 发送通知。`@discord` 指令接受一个 Discord hook URL 和一条消息。你可以在"服务器设置（Server Settings）"中创建一个"Webhook"并选择该 webhook 应该发布到的频道，从而获取你的 webhook URL。你应该将完整的 Webhook URL 传入 `@discord` 指令：

```blade
@finished
    @discord('discord-webhook-url')
@endfinished
```

### Telegram

Envoy 还支持在每次任务执行后向 [Telegram](https://telegram.org) 发送通知。`@telegram` 指令接受一个 Telegram Bot ID 和一个 Chat ID。你可以通过使用 [BotFather](https://t.me/botfather) 创建一个新机器人来获取你的 Bot ID。你可以使用 [@username_to_id_bot](https://t.me/username_to_id_bot) 获取一个有效的 Chat ID。你应该将完整的 Bot ID 和 Chat ID 传入 `@telegram` 指令：

```blade
@finished
    @telegram('bot-id','chat-id')
@endfinished
```

### Microsoft Teams

Envoy 还支持在每次任务执行后向 [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams) 发送通知。`@microsoftTeams` 指令接受一个 Teams Webhook（必填）、一条消息、主题颜色（success、info、warning、error）以及一个选项数组。你可以通过创建一个新的 [incoming webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) 来获取你的 Teams Webhook。Teams API 还有许多其他属性可用于自定义你的消息框，例如 title、summary 和 sections。你可以在 [Microsoft Teams 文档](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using?tabs=cURL#example-of-connector-message) 中找到更多信息。你应该将完整的 Webhook URL 传入 `@microsoftTeams` 指令：

```blade
@finished
    @microsoftTeams('webhook-url')
@endfinished
```
