# 目录结构

- [简介](#introduction)
- [根目录](#the-root-directory)
    - [`app` 目录](#the-root-app-directory)
    - [`bootstrap` 目录](#the-bootstrap-directory)
    - [`config` 目录](#the-config-directory)
    - [`database` 目录](#the-database-directory)
    - [`lang` 目录](#the-lang-directory)
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

默认的 Laravel 应用结构旨在为大型和小型应用都提供一个出色的起点。但你可以自由地按照自己喜欢的方式组织应用。Laravel 几乎不限制任何给定类的存放位置——只要 Composer 能自动加载该类即可。

> **Note**
> 刚接触 Laravel？请查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在引导你构建第一个 Laravel 应用的同时， hands-on 地了解该框架。

<a name="the-root-directory"></a>
## 根目录

<a name="the-root-app-directory"></a>
#### App 目录

`app` 目录包含应用的核心代码。我们很快会更详细地探讨这个目录；不过，应用中几乎所有的类都会放在这个目录中。

<a name="the-bootstrap-directory"></a>
#### Bootstrap 目录

`bootstrap` 目录包含用于引导（启动）框架的 `app.php` 文件。该目录还包含一个 `cache` 目录，用于存放框架生成的性能优化文件，例如路由和服务缓存文件。通常你不需要修改此目录中的任何文件。

<a name="the-config-directory"></a>
#### Config 目录

`config` 目录顾名思义，包含应用的所有配置文件。建议你通读这些文件，熟悉所有可用的配置选项。

<a name="the-database-directory"></a>
#### Database 目录

`database` 目录包含数据库迁移、模型工厂和数据填充。如果你愿意，也可以使用此目录存放 SQLite 数据库。

<a name="the-lang-directory"></a>
#### Lang 目录

`lang` 目录存放应用的所有语言文件。

<a name="the-public-directory"></a>
#### Public 目录

`public` 目录包含 `index.php` 文件，这是所有进入应用的请求的入口点，并配置了自动加载。该目录还存放你的静态资源，例如图片、JavaScript 和 CSS。

<a name="the-resources-directory"></a>
#### Resources 目录

`resources` 目录包含你的[视图](/docs/{{version}}/views)以及原始的、未编译的静态资源，例如 CSS 或 JavaScript。

<a name="the-routes-directory"></a>
#### Routes 目录

`routes` 目录包含应用的所有路由定义。默认情况下，Laravel 包含多个路由文件：`web.php`、`api.php`、`console.php` 和 `channels.php`。

`web.php` 文件包含的路由会被 `RouteServiceProvider` 放置在 `web` 中间件组中，该中间件组提供 session 状态、CSRF 保护和 cookie 加密。如果你的应用不提供无状态的 RESTful API，那么所有路由很可能都定义在 `web.php` 文件中。

`api.php` 文件包含的路由会被 `RouteServiceProvider` 放置在 `api` 中间件组中。这些路由旨在实现无状态，因此通过这些路由进入应用的请求将通过[令牌](/docs/{{version}}/sanctum)进行认证，且无法访问 session 状态。

`console.php` 文件是你定义所有基于闭包的控制台命令的地方。每个闭包都绑定到一个命令实例，从而可以简单地与每个命令的 IO 方法进行交互。尽管此文件不定义 HTTP 路由，但它定义了进入应用的控制台入口点（路由）。

`channels.php` 文件是你注册应用支持的所有[事件广播](/docs/{{version}}/broadcasting)频道的地方。

<a name="the-storage-directory"></a>
#### Storage 目录

`storage` 目录包含日志、编译后的 Blade 模板、基于文件的 session、文件缓存以及框架生成的其他文件。此目录分为 `app`、`framework` 和 `logs` 子目录。`app` 目录可用于存放应用生成的任何文件。`framework` 目录用于存放框架生成的文件和缓存。最后，`logs` 目录包含应用的日志文件。

`storage/app/public` 目录可用于存放用户生成的文件，例如头像等需要公开访问的文件。你应该创建一个指向此目录的 `public/storage` 符号链接。可以使用 `php artisan storage:link` Artisan 命令创建该链接。

<a name="the-tests-directory"></a>
#### Tests 目录

`tests` 目录包含自动化测试。开箱即用地提供了 [PHPUnit](https://phpunit.de/) 单元测试和功能测试示例。每个测试类应以 `Test` 结尾。你可以使用 `phpunit` 或 `php vendor/bin/phpunit` 命令运行测试。或者，如果你想要更详细、更美观的测试结果展示，可以使用 `php artisan test` Artisan 命令运行测试。

<a name="the-vendor-directory"></a>
#### Vendor 目录

`vendor` 目录包含 [Composer](https://getcomposer.org) 依赖。

<a name="the-app-directory"></a>
## App 目录

应用的大部分内容存放在 `app` 目录中。默认情况下，此目录的命名空间为 `App`，并由 Composer 使用 [PSR-4 自动加载标准](https://www.php-fig.org/psr/psr-4/)进行自动加载。

`app` 目录包含多个子目录，例如 `Console`、`Http` 和 `Providers`。可以将 `Console` 和 `Http` 目录视为提供进入应用核心的 API。HTTP 协议和 CLI 都是与应用交互的机制，但不包含应用逻辑。换句话说，它们是向应用发出命令的两种方式。`Console` 目录包含所有 Artisan 命令，而 `Http` 目录包含控制器、中间件和请求。

当你使用 `make` Artisan 命令生成类时，`app` 目录内会生成各种其他目录。例如，在执行 `make:job` Artisan 命令生成作业类之前，`app/Jobs` 目录不会存在。

> **Note**
> `app` 目录中的许多类都可以通过 Artisan 命令生成。要查看可用的命令，请在终端中运行 `php artisan list make` 命令。

<a name="the-broadcasting-directory"></a>
#### Broadcasting 目录

`Broadcasting` 目录包含应用的所有广播频道类。这些类通过 `make:channel` 命令生成。此目录默认不存在，但会在你创建第一个频道时自动创建。要了解更多关于频道的信息，请查看[事件广播](/docs/{{version}}/broadcasting)文档。

<a name="the-console-directory"></a>
#### Console 目录

`Console` 目录包含应用的所有自定义 Artisan 命令。这些命令可以通过 `make:command` 命令生成。此目录还存放控制台内核，你的自定义 Artisan 命令和[计划任务](/docs/{{version}}/scheduling)都在此处定义。

<a name="the-events-directory"></a>
#### Events 目录

此目录默认不存在，但会通过 `event:generate` 和 `make:event` Artisan 命令为你创建。`Events` 目录存放[事件类](/docs/{{version}}/events)。事件可用于通知应用的其他部分某个动作已发生，从而提供极大的灵活性和解耦能力。

<a name="the-exceptions-directory"></a>
#### Exceptions 目录

`Exceptions` 目录包含应用的异常处理器，也是放置应用抛出的任何异常的好地方。如果你想自定义异常的记录或渲染方式，应该修改此目录中的 `Handler` 类。

<a name="the-http-directory"></a>
#### Http 目录

`Http` 目录包含控制器、中间件和表单请求。处理进入应用的请求的几乎所有逻辑都会放在此目录中。

<a name="the-jobs-directory"></a>
#### Jobs 目录

此目录默认不存在，但会在执行 `make:job` Artisan 命令时为你创建。`Jobs` 目录存放应用的[可排队作业](/docs/{{version}}/queues)。作业可以被应用排队，或在当前请求生命周期内同步运行。在当前请求期间同步运行的作业有时被称为"命令"，因为它们是[命令模式](https://en.wikipedia.org/wiki/Command_pattern)的一种实现。

<a name="the-listeners-directory"></a>
#### Listeners 目录

此目录默认不存在，但会在执行 `event:generate` 或 `make:listener` Artisan 命令时为你创建。`Listeners` 目录包含处理[事件](/docs/{{version}}/events)的类。事件监听器接收一个事件实例，并在事件触发时执行响应逻辑。例如，`UserRegistered` 事件可能由 `SendWelcomeEmail` 监听器处理。

<a name="the-mail-directory"></a>
#### Mail 目录

此目录默认不存在，但会在执行 `make:mail` Artisan 命令时为你创建。`Mail` 目录包含所有表示应用发送的[电子邮件的类](/docs/{{version}}/mail)。邮件对象允许你将构建电子邮件的所有逻辑封装在一个简单的类中，并通过 `Mail::send` 方法发送。

<a name="the-models-directory"></a>
#### Models 目录

`Models` 目录包含所有 [Eloquent 模型类](/docs/{{version}}/eloquent)。Laravel 内置的 Eloquent ORM 为数据库操作提供了优雅、简单的 ActiveRecord 实现。每个数据库表都有一个对应的"模型"用于与该表交互。模型允许你查询表中的数据，以及向表中插入新记录。

<a name="the-notifications-directory"></a>
#### Notifications 目录

此目录默认不存在，但会在执行 `make:notification` Artisan 命令时为你创建。`Notifications` 目录包含应用发送的所有"事务性"[通知](/docs/{{version}}/notifications)，例如关于应用内发生的简单事件通知。Laravel 的通知功能将发送通知抽象到多种驱动上，例如电子邮件、Slack、SMS 或存储在数据库中。

<a name="the-policies-directory"></a>
#### Policies 目录

此目录默认不存在，但会在执行 `make:policy` Artisan 命令时为你创建。`Policies` 目录包含应用的[授权策略类](/docs/{{version}}/authorization)。策略用于确定用户是否可以对某个资源执行给定操作。

<a name="the-providers-directory"></a>
#### Providers 目录

`Providers` 目录包含应用的所有[服务提供者](/docs/{{version}}/providers)。服务提供者通过在服务容器（Service Container）中绑定服务、注册事件或执行其他任何任务来引导（启动）应用，为接收请求做好准备。

在全新的 Laravel 应用中，此目录已经包含多个服务提供者。你可以根据需要将自己的服务提供者添加到此目录中。

<a name="the-rules-directory"></a>
#### Rules 目录

此目录默认不存在，但会在执行 `make:rule` Artisan 命令时为你创建。`Rules` 目录包含应用的自定义验证规则对象。规则用于将复杂的验证逻辑封装在一个简单的对象中。更多信息请查看[验证文档](/docs/{{version}}/validation)。
