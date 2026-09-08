# 安装

- [初识 Laravel](#meet-laravel)
    - [为什么选择 Laravel？](#why-laravel)
- [创建 Laravel 应用](#creating-a-laravel-project)
    - [使用 AI 快速上手](#getting-started-using-ai)
    - [安装 PHP 与 Laravel 安装器](#installing-php)
    - [创建应用](#creating-an-application)
- [初始配置](#initial-configuration)
    - [基于环境的配置](#environment-based-configuration)
    - [数据库与迁移](#databases-and-migrations)
    - [目录配置](#directory-configuration)
- [使用 Herd 安装](#installation-using-herd)
    - [macOS 上的 Herd](#herd-on-macos)
    - [Windows 上的 Herd](#herd-on-windows)
- [IDE 支持](#ide-support)
- [Laravel 与 AI](#laravel-and-ai)
    - [安装 Laravel Boost](#installing-laravel-boost)
- [后续步骤](#next-steps)
    - [Laravel 全栈框架](#laravel-the-fullstack-framework)
    - [Laravel 作为 API 后端](#laravel-the-api-backend)

<a name="meet-laravel"></a>
## 初识 Laravel

Laravel 是一个拥有富有表现力、优雅语法的 Web 应用框架。Web 框架为创建应用提供了结构和起点，让你能够专注于打造精彩的应用，而把细节交给我们处理。

Laravel 致力于在提供强大功能的同时带来出色的开发者体验，这些功能包括完善的依赖注入、富有表现力的数据库抽象层、队列与计划任务、单元与集成测试等等。

无论你是 PHP Web 框架的新手，还是拥有多年经验，Laravel 都是一个能与你共同成长的框架。我们将帮助你迈出 Web 开发的第一步，或者在你将专业知识提升到新水平时助你一臂之力。我们迫不及待地想看到你构建的作品。

<a name="why-laravel"></a>
### 为什么选择 Laravel？

在构建 Web 应用时，有各种各样的工具和框架可供选择。但我们相信，Laravel 是构建现代全栈 Web 应用的最佳选择。

#### 渐进式框架

我们喜欢把 Laravel 称为"渐进式"框架。这意味着 Laravel 会与你一同成长。如果你刚刚迈入 Web 开发领域，Laravel 庞大的文档、指南和[视频教程](https://laracasts.com)库将帮助你轻松入门，而不至于不知所措。

如果你是资深开发者，Laravel 会为你提供[依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting)等方面的强大工具。Laravel 专为构建专业的 Web 应用而精心调优，并已准备好应对企业级工作负载。

#### 可扩展框架

Laravel 具有惊人的可扩展性。得益于 PHP 天生对扩展友好的特性，以及 Laravel 对 Redis 等快速分布式缓存系统的内置支持，使用 Laravel 进行水平扩展轻而易举。事实上，Laravel 应用已被轻松扩展至每月处理数亿请求。

需要极端的扩展能力？[Laravel Cloud](https://cloud.laravel.com) 等平台允许你以几乎无限规模运行 Laravel 应用。

#### 对 AI 代理友好的框架

Laravel 有主见的约定和清晰定义的结构，使其成为使用 Cursor 和 Claude Code 等工具进行 [AI 辅助开发](/docs/{{version}}/ai)的理想框架。当你要求 AI 代理添加一个控制器时，它确切地知道该把它放在哪里。当你需要一个新的迁移时，命名约定和文件位置都是可预测的。这种一致性消除了那些在更灵活的框架中常常让 AI 工具栽跟头的猜测过程。

除了文件组织之外，Laravel 富有表现力的语法和全面的文档也为 AI 代理提供了生成准确、地道代码所需的上下文。Eloquent 关联、表单请求和中间件等功能都遵循代理可以可靠理解和复制的模式。其结果是：AI 生成的代码看起来像是经验丰富的 Laravel 开发者编写的，而不是由通用 PHP 片段拼凑而成。

想了解更多关于 Laravel 是 AI 辅助开发完美选择的原因，请查看我们关于[智能体开发](/docs/{{version}}/ai)的文档。

#### 社区框架

Laravel 整合了 PHP 生态中最优秀的包，提供了最强大、最对开发者友好的框架。此外，来自世界各地的数千名才华横溢的开发者都为[这个框架做出了贡献](https://github.com/laravel/framework)。谁知道呢，也许你也会成为 Laravel 的贡献者。

<a name="creating-a-laravel-project"></a>
## 创建 Laravel 应用

<a name="getting-started-using-ai"></a>
### 使用 AI 快速上手

如果你正在使用 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [OpenCode](https://opencode.ai) 等 AI 编码代理，你可以从一个提示开始，在代理接触你的项目之前，为它提供一份 Laravel 专用的行动手册。

下面的提示会告诉代理在哪里找到 Laravel 的安装指南、应该优先处理什么，以及当你尚未做出选择时如何做出合理的默认决策。将此提示粘贴给你的代理即可开始：

```text
I'm building a new Laravel application.

Fetch and follow the instructions from https://laravel.com/for/agents. Treat the returned Markdown as the source of truth for how to install and set up Laravel in this session.
```

代理阅读完说明后，应当一步一步引导你，并让环境设置与 Laravel 的默认约定保持一致。

<a name="installing-php"></a>
### 安装 PHP 与 Laravel 安装器

在创建第一个 Laravel 应用之前，请确保你的本地机器已安装 [PHP](https://php.net)、[Composer](https://getcomposer.org) 和 [Laravel 安装器](https://github.com/laravel/installer)。此外，你还需要安装 [Node 和 NPM](https://nodejs.org) 或 [Bun](https://bun.sh/)，以便编译应用的前端资源。

如果你还没有在本地机器上安装 PHP 和 Composer，以下命令可以在 macOS、Windows 或 Linux 上安装 PHP、Composer 和 Laravel 安装器：

```shell tab=macOS
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

```shell tab=Windows PowerShell
# Run as administrator...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

```shell tab=Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

运行上述命令之一后，你应该重启终端会话。若要通过 `php.new` 安装 PHP、Composer 和 Laravel 安装器后对其更新，可以在终端中重新运行该命令。

如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器：

```shell
composer global require laravel/installer
```

> [!NOTE]
> 如需体验功能齐全、图形化的 PHP 安装与管理，请查看 [Laravel Herd](#installation-using-herd)。

<a name="creating-an-application"></a>
### 创建应用

安装好 PHP、Composer 和 Laravel 安装器之后，你就可以创建新的 Laravel 应用了：

```shell
laravel new example-app
```

应用创建完成后，你可以使用 `dev` Composer 脚本启动 Laravel 的本地开发服务器、队列工作进程和 Vite 开发服务器：

```shell
cd example-app
npm install && npm run build
composer run dev
```

启动开发服务器后，你可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问应用。接下来，你就可以[迈入 Laravel 生态的下一步](#next-steps)了。当然，你可能还需要[配置数据库](#databases-and-migrations)并运行必要的迁移。

> [!NOTE]
> 如果你希望在开发 Laravel 应用时抢占先机，可以考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 入门套件为你的新 Laravel 应用提供后端和前端的认证脚手架。

<a name="initial-configuration"></a>
## 初始配置

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，所以请随意浏览这些文件，熟悉可供你使用的选项。

Laravel 开箱即用几乎不需要额外配置。你可以立即开始开发！不过，你可能希望查看 `config/app.php` 文件及其文档。它包含几个选项，例如 `url` 和 `locale`，你可能希望根据自己的应用进行调整。

<a name="environment-based-configuration"></a>
### 基于环境的配置

由于 Laravel 的许多配置选项值可能因应用运行在本地机器上还是生产 Web 服务器上而有所不同，许多重要的配置值都是通过位于应用根目录的 `.env` 文件定义的。

你的 `.env` 文件不应提交到应用的源代码控制中，因为使用该应用的每个开发者 / 服务器可能需要不同的环境配置。此外，一旦入侵者获得了你的源代码控制仓库的访问权限，提交它还会带来安全风险，因为任何敏感凭据都会暴露。

> [!NOTE]
> 关于 `.env` 文件和基于环境的配置的更多信息，请查看完整的[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="databases-and-migrations"></a>
### 数据库与迁移

现在你已经创建了 Laravel 应用，很可能希望在数据库中存储一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 将与 SQLite 数据库交互。

在应用创建过程中，Laravel 已经为你创建了 `database/database.sqlite` 文件，并运行了必要的迁移来创建应用的数据库表。

如果你更愿意使用 MySQL 或 PostgreSQL 等其他数据库驱动，可以更新 `.env` 配置文件以使用相应的数据库。例如，如果你想使用 MySQL，请这样更新 `.env` 配置文件中的 `DB_*` 变量：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果你选择使用 SQLite 以外的数据库，你需要创建数据库并运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果你在 macOS 或 Windows 上进行开发，且需要在本地安装 MySQL、PostgreSQL 或 Redis，可以考虑使用 [Herd Pro](https://herd.laravel.com/#plans) 或 [DBngin](https://dbngin.com/)。

<a name="directory-configuration"></a>
### 目录配置

Laravel 应始终从为你的 Web 服务器配置的"Web 目录"根目录提供服务。你不应尝试从"Web 目录"的子目录中提供 Laravel 应用。这样做可能会暴露应用中存在的敏感文件。

<a name="installation-using-herd"></a>
## 使用 Herd 安装

[Laravel Herd](https://herd.laravel.com) 是一个面向 macOS 和 Windows 的、极速的原生 Laravel 与 PHP 开发环境。Herd 包含 Laravel 开发入门所需的一切，包括 PHP 和 Nginx。

安装 Herd 后，你就可以开始使用 Laravel 进行开发了。Herd 包含 `php`、`composer`、`laravel`、`expose`、`node`、`npm` 和 `nvm` 的命令行工具。

> [!NOTE]
> [Herd Pro](https://herd.laravel.com/#plans) 为 Herd 增加了额外的强大功能，例如创建和管理本地 MySQL、Postgres 和 Redis 数据库的能力，以及本地邮件查看和日志监控。

<a name="herd-on-macos"></a>
### macOS 上的 Herd

如果你在 macOS 上开发，可以从 [Herd 网站](https://herd.laravel.com)下载 Herd 安装程序。安装程序会自动下载最新版本的 PHP，并配置你的 Mac 始终在后台运行 [Nginx](https://www.nginx.com/)。

macOS 版 Herd 使用 [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) 来支持"托管"目录。托管目录中的任何 Laravel 应用都会自动由 Herd 提供服务。默认情况下，Herd 会在 `~/Herd` 创建一个托管目录，你可以通过目录名在 `.test` 域名下访问此目录中的任何 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方法是使用随 Herd 捆绑的 Laravel CLI：

```shell
cd ~/Herd
laravel new my-app
cd my-app
herd open
```

当然，你始终可以通过 Herd 的 UI 管理托管目录和其他 PHP 设置，Herd UI 可以从系统托盘中的 Herd 菜单打开。

你可以通过查看 [Herd 文档](https://herd.laravel.com/docs)了解更多关于 Herd 的信息。

<a name="herd-on-windows"></a>
### Windows 上的 Herd

你可以在 [Herd 网站](https://herd.laravel.com/windows)下载 Herd 的 Windows 安装程序。安装完成后，你可以启动 Herd 完成引导流程，并首次访问 Herd UI。

Herd UI 可以通过左键单击 Herd 的系统托盘图标访问。右键单击可打开快速菜单，访问你日常需要的所有工具。

安装过程中，Herd 会在你的主目录 `%USERPROFILE%\Herd` 创建一个"托管"目录。托管目录中的任何 Laravel 应用都会自动由 Herd 提供服务，你可以通过目录名在 `.test` 域名下访问此目录中的任何 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方法是使用随 Herd 捆绑的 Laravel CLI。要开始使用，请打开 Powershell 并运行以下命令：

```shell
cd ~\Herd
laravel new my-app
cd my-app
herd open
```

你可以通过查看 [Windows 版 Herd 文档](https://herd.laravel.com/docs/windows)了解更多关于 Herd 的信息。

<a name="ide-support"></a>
## IDE 支持

开发 Laravel 应用时，你可以自由使用任何你喜欢的代码编辑器。[Laravel LSP](https://github.com/laravel/lsp) 提供框架感知的编辑器支持，包括 Laravel 和 Blade 代码的代码补全、悬停信息、诊断、文档链接、跳转到定义和快速修复。

要安装 Laravel LSP，请通过 Composer 全局安装。确保 Composer 的全局 vendor bin 目录在你的 `PATH` 中：

```shell
composer global require laravel/lsp
```

如果你在寻找轻量且可扩展的编辑器，[VS Code](https://code.visualstudio.com) 或 [Cursor](https://cursor.com) 结合官方的 [Laravel VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel)可提供语法高亮、代码片段、Artisan 命令集成以及自动化的 Laravel LSP 支持。官方 Laravel 扩展也适用于 [Sublime Text](https://github.com/laravel/sublime-extension) 和 [Zed](https://github.com/laravel/zed-extension)。关于其他兼容语言服务器的编辑器（包括 Neovim 和 OpenCode）的设置说明，请参阅 [Laravel LSP 仓库](https://github.com/laravel/lsp)。

如需对 Laravel 进行广泛而稳健的支持，可以看看 [PhpStorm](https://www.jetbrains.com/phpstorm/laravel/?utm_source=laravel.com&utm_medium=link&utm_campaign=laravel-2025&utm_content=partner&ref=laravel-2025)，这是一款 JetBrains IDE。PhpStorm 内置的 Laravel 框架支持包括 Blade 模板、针对 Eloquent 模型、路由、视图、翻译和组件的智能自动补全，以及跨 Laravel 项目的强大代码生成和导航功能。

对于寻求基于云端开发体验的用户，[Firebase Studio](https://firebase.studio/) 可以让你直接在浏览器中即时开始使用 Laravel 进行构建。Firebase Studio 无需任何设置，让你可以轻松地从任何设备开始构建 Laravel 应用。

<a name="laravel-and-ai"></a>
## Laravel 与 AI

[Laravel Boost](https://github.com/laravel/boost) 是一个强大的工具，弥合了 AI 编码代理与 Laravel 应用之间的鸿沟。Boost 为 AI 代理提供 Laravel 特定的上下文、工具和指南，使它们能够生成更准确、针对特定版本且遵循 Laravel 约定的代码。

当你将 Boost 安装到 Laravel 应用中时，AI 代理将获得 15 种以上的专用工具，包括了解你正在使用哪些包、查询数据库、搜索 Laravel 文档、读取浏览器日志、生成测试以及通过 Tinker 执行代码的能力。

此外，Boost 还为 AI 代理提供了超过 17,000 条向量化的 Laravel 生态文档，专门针对你安装的包版本。这意味着代理可以提供针对你项目所使用确切版本的指导。

Boost 还包含由 Laravel 维护的 AI 指南，帮助代理遵循框架约定、编写适当的测试，并在生成 Laravel 代码时避免常见陷阱。

<a name="installing-laravel-boost"></a>
### 安装 Laravel Boost

Boost 可以安装在运行 PHP 8.1 及以上版本的 Laravel 10、11、12 和 13 应用中。要开始使用，请将 Boost 作为开发依赖安装：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装程序：

```shell
php artisan boost:install
```

安装程序会自动检测你的 IDE 和 AI 代理，让你选择对项目有意义的功能。Boost 尊重现有的项目约定，默认不会强制执行有主见的风格规则。

> [!NOTE]
> 想了解更多关于 Boost 的信息，请查看 [GitHub 上的 Laravel Boost 仓库](https://github.com/laravel/boost)。

<a name="adding-custom-ai-guidelines"></a>
#### 添加自定义 AI 指南

要用你自己的自定义 AI 指南增强 Laravel Boost，请将 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录。当你运行 `boost:install` 时，这些文件会自动与 Laravel Boost 的指南合并使用。

<a name="next-steps"></a>
## 后续步骤

既然你已经创建了 Laravel 应用，你可能会想知道接下来该学什么。首先，我们强烈建议通过阅读以下文档来熟悉 Laravel 的工作方式：

<div class="content-list" markdown="1">

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [Facade](/docs/{{version}}/facades)

</div>

你希望如何使用 Laravel，也将决定你旅程中的后续步骤。使用 Laravel 的方式多种多样，下面我们将探讨该框架的两个主要用例。

<a name="laravel-the-fullstack-framework"></a>
### Laravel 全栈框架

Laravel 可以充当全栈框架。所谓"全栈"框架，是指你将使用 Laravel 将请求路由到你的应用，并通过 [Blade 模板](/docs/{{version}}/blade)或 [Inertia](https://inertiajs.com) 之类的单页应用混合技术渲染前端。这是使用 Laravel 框架最常见的方式，而且在我们看来，也是最高效的使用方式。

如果你打算这样使用 Laravel，你可能希望查看我们关于[前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views)或 [Eloquent ORM](/docs/{{version}}/eloquent)的文档。此外，你可能还有兴趣了解 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com) 等社区包。这些包允许你将 Laravel 用作全栈框架，同时享受单页 JavaScript 应用提供的许多 UI 优势。

如果你将 Laravel 用作全栈框架，我们也强烈建议你学习如何使用 [Vite](/docs/{{version}}/vite) 编译应用的 CSS 和 JavaScript。

> [!NOTE]
> 如果你想在构建应用时抢占先机，请查看我们官方的[应用入门套件](/docs/{{version}}/starter-kits)之一。

<a name="laravel-the-api-backend"></a>
### Laravel 作为 API 后端

Laravel 也可以作为 JavaScript 单页应用或移动应用的 API 后端。例如，你可以将 Laravel 用作 [Next.js](https://nextjs.org) 应用的 API 后端。在这种场景下，你可以使用 Laravel 为应用提供[认证](/docs/{{version}}/sanctum)以及数据存储 / 检索，同时还可以利用队列、邮件、通知等强大的 Laravel 服务。

如果你打算这样使用 Laravel，你可能希望查看我们关于[路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum)和 [Eloquent ORM](/docs/{{version}}/eloquent)的文档。
