# 目录结构

## 简介

Laravel 默认的应用程序结构旨在为大型和小型应用都提供一个良好的起点。但你可以按照自己喜欢的方式组织应用程序。Laravel 对任何一个类所在的位置几乎没有限制——只要 Composer 能够自动加载该类即可。

## 根目录

### `app` 目录

`app` 目录包含应用程序的核心代码。我们稍后会更详细地探讨这个目录；不过，你的应用程序中几乎所有的类都位于此目录中。

### `bootstrap` 目录

`bootstrap` 目录包含 `app.php` 文件，该文件用于引导（Bootstrap）框架。此目录还包含一个 `cache` 目录，其中存放框架生成的用于性能优化的文件，例如 路由 和服务缓存文件。

### `config` 目录

`config` 目录（顾名思义）包含应用程序的所有配置文件。通读所有这些文件并熟悉所有可用的选项是个好主意。

### `database` 目录

`database` 目录包含你的数据库迁移、模型工厂和 Seeders。如果需要，你也可以使用此目录存放一个 SQLite 数据库。

### `public` 目录

`public` 目录包含 `index.php` 文件，它是进入应用程序的所有 请求 的入口点，并配置了自动加载。此目录还存放你的资源文件，例如图片、JavaScript 和 CSS。

### `resources` 目录

`resources` 目录包含你的[视图](/topic/Laravel%2013.x/m892gz6y01.html)以及原始的、未经编译的资源文件，例如 CSS 或 JavaScript。

### `routes` 目录

`routes` 目录包含应用程序的所有 路由 定义。默认情况下，Laravel 自带两个路由文件：`web.php` 和 `console.php`。

`web.php` 文件包含 Laravel 放置在 `web` 中间件 组中的路由，该中间件组提供会话状态、CSRF 保护和 Cookie 加密。如果你的应用程序不提供无状态的 RESTful API，那么你的所有路由很可能都定义在该 `web.php` 文件中。

`console.php` 文件用于定义所有基于闭包的命令行命令。每个闭包都绑定到一个命令实例，提供了一种与每个命令的 IO 方法交互的简单方式。尽管该文件不定义 HTTP 路由，但它定义了进入应用程序的基于控制台的入口点（路由）。你也可以在 `console.php` 文件中[调度](/topic/Laravel%2013.x/e296olw9q7.html)任务。

可选地，你可以通过 `install:api` 和 `install:broadcasting` Artisan 命令安装额外的路由文件，用于 API 路由（`api.php`）和广播频道（`channels.php`）。

`api.php` 文件包含旨在无状态的路由，因此通过这些路由进入应用程序的 请求 旨在通过[令牌](/topic/Laravel%2013.x/xq9zr3jvdo.html)进行身份验证，并且无法访问会话状态。

`channels.php` 文件用于注册你的应用程序支持的所有[事件广播](/topic/Laravel%2013.x/enyd5w197d.html)频道。

### `storage` 目录

`storage` 目录包含你的日志、已编译的 Blade 模板、基于文件的会话、文件缓存，以及框架生成的其他文件。该目录被划分为 `app`、`framework` 和 `logs` 三个子目录。`app` 目录可用于存放应用程序生成的任何文件。`framework` 目录用于存放框架生成的文件和缓存。最后，`logs` 目录包含应用程序的日志文件。

`storage/app/public` 目录可用于存放应由公众访问的用户生成文件，例如个人资料头像。你应在 `public/storage` 处创建一个指向该目录的符号链接。可以使用 `php artisan storage:link` Artisan 命令创建该链接。

### `tests` 目录

`tests` 目录包含你的自动化测试。开箱即提供 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de/) 的单元测试和功能测试示例。每个测试类都应以 `Test` 作为后缀。你可以使用 `/vendor/bin/pest` 或 `/vendor/bin/phpunit` 命令运行测试。或者，如果你想要更详细、更美观的测试结果展示，可以使用 `php artisan test` Artisan 命令运行测试。

### `vendor` 目录

`vendor` 目录包含你的 [Composer](https://getcomposer.org) 依赖。

## `app` 目录

你的应用程序的大部分代码都位于 `app` 目录中。默认情况下，该目录以 `App` 作为命名空间，并由 Composer 使用 [PSR-4 自动加载标准](https://www.php-fig.org/psr/psr-4/) 自动加载。

默认情况下，`app` 目录包含 `Http`、`Models` 和 `Providers` 目录。不过，随着你使用 make Artisan 命令生成类，随着时间的推移，`app` 目录中会生成各种其他目录。例如，在你执行 `make:command` Artisan 命令生成命令类之前，`app/Console` 目录并不存在。

`Console` 和 `Http` 目录都在其各自的章节中有更详细的说明，但可以将 `Console` 和 `Http` 目录视为提供了对你的应用程序核心的 API。HTTP 协议和 CLI 都是与你的应用程序交互的机制，但它们实际上并不包含应用程序逻辑。换言之，它们是向你的应用程序发出命令的两种方式。`Console` 目录包含你所有的 Artisan 命令，而 `Http` 目录包含你的控制器、中间件和请求。

> [!NOTE]
> `app` 目录中的许多类都可以通过 Artisan 命令生成。要查看可用的命令，请在终端中运行 `php artisan list make` 命令。

### `Broadcasting` 目录

`Broadcasting` 目录包含你的应用程序的所有广播频道类。这些类使用 `make:channel` 命令生成。该目录默认不存在，但在你创建第一个频道时会为你创建。要了解有关频道的更多信息，请查看[事件广播](/topic/Laravel%2013.x/enyd5w197d.html)文档。

### `Console` 目录

`Console` 目录包含你的应用程序的所有自定义 Artisan 命令。这些命令可以使用 `make:command` 命令生成。

### `Events` 目录

该目录默认不存在，但会由 `event:generate` 和 `make:event` Artisan 命令为你创建。`Events` 目录存放[事件类](/topic/Laravel%2013.x/x3vo0l4vm1.html)。事件可用于提醒应用程序的其他部分某个给定操作已发生，从而提供极大的灵活性与解耦能力。

### `Exceptions` 目录

`Exceptions` 目录包含你的应用程序的所有自定义异常。这些异常可以使用 `make:exception` 命令生成。

### `Http` 目录

`Http` 目录包含你的控制器、中间件和表单请求。处理进入应用程序的 请求 的几乎所有逻辑都会放在此目录中。

### `Jobs` 目录

该目录默认不存在，但如果你执行 `make:job` Artisan 命令，它会为你创建。`Jobs` 目录存放你的应用程序的[可排队任务](/topic/Laravel%2013.x/wevwmkz9l2.html)。任务可以由你的应用程序排队，也可以在当前 请求 生命周期内同步运行。在当前 请求 期间同步运行的任务有时被称为"命令"，因为它们是[命令模式](https://en.wikipedia.org/wiki/Command_pattern)的一种实现。

### `Listeners` 目录

该目录默认不存在，但如果你执行 `event:generate` 或 `make:listener` Artisan 命令，它会为你创建。`Listeners` 目录包含处理你的[事件](/topic/Laravel%2013.x/x3vo0l4vm1.html)的类。事件监听器接收一个事件实例，并在事件被触发时执行相应逻辑。例如，`UserRegistered` 事件可能由 `SendWelcomeEmail` 监听器处理。

### `Mail` 目录

该目录默认不存在，但如果你执行 `make:mail` Artisan 命令，它会为你创建。`Mail` 目录包含你的应用程序发送的所有[代表邮件的类](/topic/Laravel%2013.x/d6vro0rv3g.html)。邮件对象允许你将构建一封邮件的所有逻辑封装在一个简单类中，并通过 `Mail::send` 方法发送。

### `Models` 目录

`Models` 目录包含你所有的[Eloquent 模型类](/topic/Laravel%2013.x/rwyl2kxvz8.html)。Laravel 附带的 Eloquent ORM 提供了一个优美、简洁的 ActiveRecord 实现，用于处理你的数据库。每个数据库表都有一个对应的"模型"，用于与该表交互。模型允许你在表中查询数据，以及向表中插入新记录。

### `Notifications` 目录

该目录默认不存在，但如果你执行 `make:notification` Artisan 命令，它会为你创建。`Notifications` 目录包含你的应用程序发送的所有"事务性"[通知](/topic/Laravel%2013.x/2ky045l9z8.html)，例如你的应用程序中发生的事件相关的简单通知。Laravel 的通知功能抽象了通过多种驱动发送通知的方式，例如电子邮件、Slack、短信，或存储在数据库中。

### `Policies` 目录

该目录默认不存在，但如果你执行 `make:policy` Artisan 命令，它会为你创建。`Policies` 目录包含你的应用程序的[授权策略类](/topic/Laravel%2013.x/2wy3l43ykm.html)。策略用于判断用户是否可以对某个资源执行给定操作。

### `Providers` 目录

`Providers` 目录包含你的应用程序的所有[服务提供者](/topic/Laravel%2013.x/qk942kovw1.html)。服务提供者（Service Provider）通过以下方式引导（Bootstrap）你的应用程序：在服务容器（Service Container）中绑定服务、注册事件，或执行其他准备传入 请求 的任务。

在一个全新的 Laravel 应用程序中，该目录已经包含 `AppServiceProvider`。你可以根据需要向此目录添加自己的服务提供者。

### `Rules` 目录

该目录默认不存在，但如果你执行 `make:rule` Artisan 命令，它会为你创建。`Rules` 目录包含你的应用程序的自定义验证规则对象。规则用于将复杂的验证逻辑封装在一个简单对象中。更多信息，请查看[验证文档](/topic/Laravel%2013.x/e296oew9q7.html)。
