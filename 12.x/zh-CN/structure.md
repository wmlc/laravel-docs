# 目录结构

- [简介](#introduction)
- [根目录](#the-root-directory)
    - [`app` 目录](#the-root-app-directory)
    - [`bootstrap` 目录](#the-bootstrap-directory)
    - [`config` 目录](#the-config-directory)
    - [`database` 目录](#the-database-directory)
    - [`public` 目录](#the-public-directory)
    - [`resources` 目录](#the-resources-directory)
    - [`routes` 目录](#the-routes-directory)
    - [`storage` 目录](#the-storage-directory)
    - [`tests` 目录](#the-tests-directory)
    - [`vendor` 目录](#the-vendor-directory)
- [App 目录](#the-app-directory)
    - [`Broadcasting` 目录](#the-broadcasting-directory)
    - [`Console` 目录](#the-console-directory)
    - [`Events` 目录](#the-events-directory)
    - [`Exceptions` 目录](#the-exceptions-directory)
    - [`Http` 目录](#the-http-directory)
    - [`Jobs` 目录](#the-jobs-directory)
    - [`Listeners` 目录](#the-listeners-directory)
    - [`Mail` 目录](#the-mail-directory)
    - [`Models` 目录](#the-models-directory)
    - [`Notifications` 目录](#the-notifications-directory)
    - [`Policies` 目录](#the-policies-directory)
    - [`Providers` 目录](#the-providers-directory)
    - [`Rules` 目录](#the-rules-directory)

<a name="introduction"></a>
## 简介

Laravel 默认的应用结构旨在为大型和小型应用都提供一个出色的起点。但你完全可以按照自己的喜好组织应用。Laravel 几乎不限制任何类的存放位置——只要 Composer 能自动加载该类即可。

<a name="the-root-directory"></a>
## 根目录

<a name="the-root-app-directory"></a>
### `app` 目录

`app` 目录包含应用的核心代码。稍后我们会更详细地探讨这个目录；不过，应用中几乎所有的类都位于该目录中。

<a name="the-bootstrap-directory"></a>
### `bootstrap` 目录

`bootstrap` 目录包含用于引导框架的 `app.php` 文件。该目录下还有一个 `cache` 目录，存放框架为性能优化而生成的文件，例如路由缓存文件和服务缓存文件。

<a name="the-config-directory"></a>
### `config` 目录

`config` 目录正如其名，包含应用的所有配置文件。建议通读这些文件，熟悉所有可用的配置选项。

<a name="the-database-directory"></a>
### `database` 目录

`database` 目录包含数据库迁移、模型工厂以及数据填充文件。如果愿意，你也可以用这个目录存放 SQLite 数据库。

<a name="the-public-directory"></a>
### `public` 目录

`public` 目录包含 `index.php` 文件，它是进入应用的所有请求的入口文件，并负责配置自动加载。该目录还存放图片、JavaScript、CSS 等资源文件。

<a name="the-resources-directory"></a>
### `resources` 目录

`resources` 目录包含[视图](/docs/{{version}}/views)，以及 CSS、JavaScript 等尚未编译的原始资源文件。

<a name="the-routes-directory"></a>
### `routes` 目录

`routes` 目录包含应用的所有路由定义。默认情况下，Laravel 提供两个路由文件：`web.php` 和 `console.php`。

`web.php` 文件中的路由会被 Laravel 放入 `web` 中间件组，该中间件组提供会话状态、CSRF 保护和 Cookie 加密。如果你的应用不提供无状态的 RESTful API，那么所有路由多半都会定义在 `web.php` 文件中。

`console.php` 文件用于定义所有基于闭包的控制台命令。每个闭包都绑定到一个命令实例，让你能够以简单的方式与各命令的 IO 方法交互。尽管这个文件不定义 HTTP 路由，但它定义了进入应用的基于控制台的入口（路由）。你还可以在 `console.php` 文件中[调度](/docs/{{version}}/scheduling)任务。

此外，你可以通过 `install:api` 和 `install:broadcasting` Artisan 命令，为 API 路由（`api.php`）和广播频道（`channels.php`）安装额外的路由文件。

`api.php` 文件中的路由设计为无状态，因此通过这些路由进入应用的请求应[通过令牌](/docs/{{version}}/sanctum)进行认证，并且无法访问会话状态。

`channels.php` 文件用于注册应用支持的所有[事件广播](/docs/{{version}}/broadcasting)频道。

<a name="the-storage-directory"></a>
### `storage` 目录

`storage` 目录包含日志、编译后的 Blade 模板、基于文件的会话、文件缓存，以及框架生成的其他文件。该目录划分为 `app`、`framework` 和 `logs` 三个子目录。`app` 目录可用于存放应用生成的任何文件；`framework` 目录用于存放框架生成的文件和缓存；`logs` 目录则包含应用的日志文件。

`storage/app/public` 目录可用于存放需要公开访问的用户生成文件，例如用户头像。你应在 `public/storage` 处创建一个指向该目录的符号链接。可以使用 `php artisan storage:link` Artisan 命令创建这个链接。

<a name="the-tests-directory"></a>
### `tests` 目录

`tests` 目录包含你的自动化测试。框架开箱即用地提供了 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de/) 的单元测试和功能测试示例。每个测试类都应以 `Test` 一词作为后缀。你可以使用 `/vendor/bin/pest` 或 `/vendor/bin/phpunit` 命令运行测试。如果想要更详细、更美观的测试结果展示，也可以使用 `php artisan test` Artisan 命令运行测试。

<a name="the-vendor-directory"></a>
### `vendor` 目录

`vendor` 目录包含你的 [Composer](https://getcomposer.org) 依赖。

<a name="the-app-directory"></a>
## App 目录

应用的主体部分位于 `app` 目录中。默认情况下，该目录使用 `App` 命名空间，并由 Composer 依据 [PSR-4 自动加载标准](https://www.php-fig.org/psr/psr-4/)进行自动加载。

默认情况下，`app` 目录包含 `Http`、`Models` 和 `Providers` 目录。不过，随着你使用 make 系列 Artisan 命令生成各类类，目录中会逐渐生成许多其他目录。例如，在你执行 `make:command` Artisan 命令生成命令类之前，`app/Console` 目录并不存在。

`Console` 和 `Http` 目录将在下文各自的章节中详细说明。你可以把 `Console` 和 `Http` 目录看作通往应用核心的 API：HTTP 协议和 CLI 都是与应用交互的机制，本身并不包含应用逻辑。换句话说，它们是向应用发出指令的两种方式。`Console` 目录包含所有 Artisan 命令，而 `Http` 目录包含控制器、中间件和请求。

> [!NOTE]
> `app` 目录中的许多类都可以通过 Artisan 命令生成。要查看可用命令，请在终端中运行 `php artisan list make` 命令。

<a name="the-broadcasting-directory"></a>
### `Broadcasting` 目录

`Broadcasting` 目录包含应用的所有广播频道类。这些类通过 `make:channel` 命令生成。该目录默认不存在，会在你创建第一个频道时自动创建。想进一步了解频道，请查阅[事件广播](/docs/{{version}}/broadcasting)文档。

<a name="the-console-directory"></a>
### `Console` 目录

`Console` 目录包含应用的所有自定义 Artisan 命令。这些命令可以通过 `make:command` 命令生成。

<a name="the-events-directory"></a>
### `Events` 目录

该目录默认不存在，会在你执行 `event:generate` 和 `make:event` Artisan 命令时自动创建。`Events` 目录存放[事件类](/docs/{{version}}/events)。事件可用于通知应用的其他部分某个操作已经发生，从而提供极大的灵活性和解耦能力。

<a name="the-exceptions-directory"></a>
### `Exceptions` 目录

`Exceptions` 目录包含应用的所有自定义异常。这些异常可以通过 `make:exception` 命令生成。

<a name="the-http-directory"></a>
### `Http` 目录

`Http` 目录包含控制器、中间件和表单请求。处理进入应用的请求的几乎所有逻辑都会放在这个目录中。

<a name="the-jobs-directory"></a>
### `Jobs` 目录

该目录默认不存在，会在你执行 `make:job` Artisan 命令时自动创建。`Jobs` 目录存放应用的[队列任务](/docs/{{version}}/queues)。任务可以由应用放入队列，也可以在当前请求生命周期内同步运行。在当前请求期间同步运行的任务有时被称为「命令」（command），因为它们是[命令模式](https://en.wikipedia.org/wiki/Command_pattern)的一种实现。

<a name="the-listeners-directory"></a>
### `Listeners` 目录

该目录默认不存在，会在你执行 `event:generate` 或 `make:listener` Artisan 命令时自动创建。`Listeners` 目录包含处理[事件](/docs/{{version}}/events)的类。事件监听器接收一个事件实例，并执行响应事件触发的逻辑。例如，`UserRegistered` 事件可能由 `SendWelcomeEmail` 监听器处理。

<a name="the-mail-directory"></a>
### `Mail` 目录

该目录默认不存在，会在你执行 `make:mail` Artisan 命令时自动创建。`Mail` 目录包含应用发送的[邮件类](/docs/{{version}}/mail)。邮件对象让你把构建邮件的所有逻辑封装到一个简单独立的类中，并可以使用 `Mail::send` 方法发送。

<a name="the-models-directory"></a>
### `Models` 目录

`Models` 目录包含所有 [Eloquent 模型类](/docs/{{version}}/eloquent)。Laravel 内置的 Eloquent ORM 为操作数据库提供了优美、简洁的 ActiveRecord 实现。每张数据库表都有一个对应的「模型」，用于与该表交互。模型让你既能查询表中的数据，也能向表中插入新记录。

<a name="the-notifications-directory"></a>
### `Notifications` 目录

该目录默认不存在，会在你执行 `make:notification` Artisan 命令时自动创建。`Notifications` 目录包含应用发送的所有「事务性」[通知](/docs/{{version}}/notifications)，例如应用内发生事件时的简单通知。Laravel 的通知功能将通知的发送抽象到多种驱动之上，例如邮件、Slack、短信，或存入数据库。

<a name="the-policies-directory"></a>
### `Policies` 目录

该目录默认不存在，会在你执行 `make:policy` Artisan 命令时自动创建。`Policies` 目录包含应用的[授权策略类](/docs/{{version}}/authorization)。策略用于判断用户能否对某个资源执行指定操作。

<a name="the-providers-directory"></a>
### `Providers` 目录

`Providers` 目录包含应用的所有[服务提供者](/docs/{{version}}/providers)。服务提供者通过在服务容器中绑定服务、注册事件或执行其他任务来引导应用，使其为接收请求做好准备。

在全新的 Laravel 应用中，该目录已经包含 `AppServiceProvider`。你可以根据需要向该目录添加自己的服务提供者。

<a name="the-rules-directory"></a>
### `Rules` 目录

该目录默认不存在，会在你执行 `make:rule` Artisan 命令时自动创建。`Rules` 目录包含应用的自定义验证规则对象。规则用于将复杂的验证逻辑封装到一个简单的对象中。更多信息请查阅[验证文档](/docs/{{version}}/validation)。
