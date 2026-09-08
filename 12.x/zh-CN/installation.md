# 安装

- [认识 Laravel](#meet-laravel)
    - [为什么选择 Laravel？](#why-laravel)
- [创建 Laravel 应用](#creating-a-laravel-project)
    - [安装 PHP 和 Laravel 安装器](#installing-php)
    - [创建应用](#creating-an-application)
- [初始配置](#initial-configuration)
    - [基于环境的配置](#environment-based-configuration)
    - [数据库与数据库迁移](#databases-and-migrations)
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
## 认识 Laravel

Laravel 是一个语法富有表现力、优雅的 Web 应用框架。Web 框架为创建应用提供了结构和起点，让你能够专注于创造精彩的作品，而由我们来处理那些繁琐的细节。

Laravel 致力于提供一流的开发者体验，同时提供强大的功能，例如完善的依赖注入、富有表现力的数据库抽象层、队列和计划任务、单元测试和集成测试等等。

无论你是刚接触 PHP Web 框架，还是已有多年经验，Laravel 都是一个能与你共同成长的框架。我们会帮助你迈出成为 Web 开发者的第一步，也会在你向更高水平进阶时助你一臂之力。我们迫不及待想看到你构建的作品。

<a name="why-laravel"></a>
### 为什么选择 Laravel？

构建 Web 应用时，你可以选择各种工具和框架。不过，我们相信 Laravel 是构建现代全栈 Web 应用的最佳选择。

#### 一个渐进式框架

我们喜欢把 Laravel 称为「渐进式」框架。意思是说，Laravel 会与你一同成长。如果你刚刚踏入 Web 开发领域，Laravel 庞大的文档、指南和[视频教程](https://laracasts.com)库会帮助你循序渐进地学习，而不会让你无所适从。

如果你是资深开发者，Laravel 则为[依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting)等提供了健壮的工具。Laravel 经过精心调优，非常适合构建专业的 Web 应用，并已准备好应对企业级工作负载。

#### 一个可扩展的框架

Laravel 拥有出色的可扩展性。得益于 PHP 对扩展友好的特性，以及 Laravel 对 Redis 等快速分布式缓存系统的内置支持，使用 Laravel 进行水平扩展轻而易举。事实上，Laravel 应用已经可以轻松扩展到每月处理数亿次请求。

需要极致的扩展能力？[Laravel Cloud](https://cloud.laravel.com) 之类的平台让你几乎可以不受限制地扩展 Laravel 应用。

#### 一个面向 AI Agent 的框架

Laravel 约定明确、结构清晰，这使它成为使用 Cursor、Claude Code 等工具进行 [AI 辅助开发](/docs/{{version}}/ai)的理想框架。当你让 AI agent 添加一个控制器时，它清楚该把它放在哪里。当你需要一个新的迁移文件时，命名约定和文件位置都是可预测的。这种一致性消除了 AI 工具在更灵活的框架中经常遇到的「猜测」问题。

除了文件组织之外，Laravel 富有表现力的语法和详尽的文档也为 AI agent 提供了生成准确、地道代码所需的上下文。Eloquent 关联、表单请求、中间件等功能遵循固定的模式，agent 能够可靠地理解并复刻这些模式。最终得到的 AI 生成代码，看起来就像出自经验丰富的 Laravel 开发者之手，而不是由通用 PHP 片段拼凑而成。

想进一步了解为什么 Laravel 是 AI 辅助开发的完美选择，请查阅我们关于 [Agent 开发](/docs/{{version}}/ai)的文档。

#### 一个社区驱动的框架

Laravel 集成了 PHP 生态中最优秀的扩展包，提供了目前最健壮、对开发者最友好的框架。此外，世界各地数以千计的优秀开发者已经为[框架做出了贡献](https://github.com/laravel/framework)。说不定，你也会成为 Laravel 的贡献者之一。

<a name="creating-a-laravel-project"></a>
## 创建 Laravel 应用

<a name="installing-php"></a>
### 安装 PHP 和 Laravel 安装器

在创建第一个 Laravel 应用之前，请确保你的本地机器已安装 [PHP](https://php.net)、[Composer](https://getcomposer.org) 和 [Laravel 安装器](https://github.com/laravel/installer)。此外，你还应该安装 [Node 和 NPM](https://nodejs.org) 或 [Bun](https://bun.sh/)，以便编译应用的前端资源。

如果你的本地机器尚未安装 PHP 和 Composer，以下命令可以在 macOS、Windows 或 Linux 上安装 PHP、Composer 和 Laravel 安装器：

```shell tab=macOS
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.4)"
```

```shell tab=Windows PowerShell
# 以管理员身份运行...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

```shell tab=Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.4)"
```

运行上述任一命令后，你应该重新启动终端会话。通过 `php.new` 安装 PHP、Composer 和 Laravel 安装器之后，如需更新它们，可以在终端中重新运行相应命令。

如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器：

```shell
composer global require laravel/installer
```

> [!NOTE]
> 如果想要功能完整、图形化的 PHP 安装与管理体验，请了解一下 [Laravel Herd](#installation-using-herd)。

<a name="creating-an-application"></a>
### 创建应用

安装好 PHP、Composer 和 Laravel 安装器之后，你就可以创建新的 Laravel 应用了。Laravel 安装器会提示你选择偏好的测试框架、数据库和入门套件：

```shell
laravel new example-app
```

应用创建完成后，你可以使用 `dev` Composer 脚本启动 Laravel 的本地开发服务器、队列工作进程以及 Vite 开发服务器：

```shell
cd example-app
npm install && npm run build
composer run dev
```

开发服务器启动后，你就可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问你的应用。接下来，你就可以[开始迈出进入 Laravel 生态的下一步](#next-steps)了。当然，你可能还需要[配置数据库](#databases-and-migrations)。

> [!NOTE]
> 如果想在开发 Laravel 应用时抢先一步，可以考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为你的新 Laravel 应用提供了后端和前端身份验证的脚手架。

<a name="initial-configuration"></a>
## 初始配置

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，请随意浏览这些文件，熟悉可用的选项。

Laravel 开箱即用，几乎不需要额外的配置。你可以直接开始开发！不过，建议你看看 `config/app.php` 文件及其文档。它包含 `url` 和 `locale` 等多个你可能需要根据应用情况修改的选项。

<a name="environment-based-configuration"></a>
### 基于环境的配置

由于 Laravel 的许多配置选项的值，会因应用是运行在本地机器还是生产环境 Web 服务器上而有所不同，因此许多重要的配置值都是通过应用根目录下的 `.env` 文件来定义的。

你的 `.env` 文件不应提交到应用的源代码管理中，因为每个使用你应用的开发者 / 服务器可能需要不同的环境配置。此外，一旦入侵者获得了你源代码管理仓库的访问权限，任何敏感凭据都会暴露，这会带来安全风险。

> [!NOTE]
> 关于 `.env` 文件和基于环境配置的更多信息，请查阅完整的[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="databases-and-migrations"></a>
### 数据库与数据库迁移

创建好 Laravel 应用之后，你可能想在数据库中存储一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 使用 SQLite 数据库。

在创建应用的过程中，Laravel 已经为你创建了 `database/database.sqlite` 文件，并运行了必要的数据库迁移来创建应用的数据库表。

如果你更愿意使用其他数据库驱动，例如 MySQL 或 PostgreSQL，可以更新 `.env` 配置文件来使用相应的数据库。例如，如果你想使用 MySQL，请按如下方式更新 `.env` 配置文件中的 `DB_*` 变量：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果你选择使用 SQLite 以外的数据库，就需要创建数据库并运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果你在 macOS 或 Windows 上开发，需要在本地安装 MySQL、PostgreSQL 或 Redis，可以考虑使用 [Herd Pro](https://herd.laravel.com/#plans) 或 [DBngin](https://dbngin.com/)。

<a name="directory-configuration"></a>
### 目录配置

Laravel 应始终部署在为 Web 服务器配置的「web 目录」的根目录下。你不应尝试在「web 目录」的子目录中部署 Laravel 应用。否则，可能会暴露应用内部的敏感文件。

<a name="installation-using-herd"></a>
## 使用 Herd 安装

[Laravel Herd](https://herd.laravel.com) 是一款适用于 macOS 和 Windows 的极速原生 Laravel 和 PHP 开发环境。Herd 包含了 Laravel 开发所需的一切，包括 PHP 和 Nginx。

安装好 Herd 之后，你就可以立即开始 Laravel 开发了。Herd 内置了 `php`、`composer`、`laravel`、`expose`、`node`、`npm` 和 `nvm` 的命令行工具。

> [!NOTE]
> [Herd Pro](https://herd.laravel.com/#plans) 在 Herd 的基础上增加了更多强大功能，例如创建和管理本地 MySQL、Postgres 和 Redis 数据库的能力，以及本地邮件查看和日志监控。

<a name="herd-on-macos"></a>
### macOS 上的 Herd

如果你在 macOS 上开发，可以从 [Herd 官网](https://herd.laravel.com)下载 Herd 安装器。安装器会自动下载最新版本的 PHP，并将你的 Mac 配置为始终在后台运行 [Nginx](https://www.nginx.com/)。

macOS 版 Herd 使用 [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) 来支持「停放（parked）」目录。任何位于停放目录中的 Laravel 应用都会自动由 Herd 提供服务。默认情况下，Herd 会在 `~/Herd` 创建停放目录，你可以通过目录名在 `.test` 域名下访问该目录中的任何 Laravel 应用。

安装 Herd 之后，创建新 Laravel 应用最快的方式是使用 Herd 自带的 Laravel CLI：

```shell
cd ~/Herd
laravel new my-app
cd my-app
herd open
```

当然，你也可以随时通过 Herd 的 UI 来管理停放目录和其他 PHP 设置，该 UI 可以从系统托盘中的 Herd 菜单打开。

你可以查阅 [Herd 文档](https://herd.laravel.com/docs)来了解更多信息。

<a name="herd-on-windows"></a>
### Windows 上的 Herd

你可以在 [Herd 官网](https://herd.laravel.com/windows)下载 Herd 的 Windows 安装器。安装完成后，你可以启动 Herd 来完成引导流程，并首次访问 Herd UI。

左键点击 Herd 的系统托盘图标即可打开 Herd UI。右键点击则会打开快捷菜单，其中包含你日常所需的所有工具。

安装过程中，Herd 会在你的用户主目录 `%USERPROFILE%\Herd` 下创建一个「停放」目录。任何位于停放目录中的 Laravel 应用都会自动由 Herd 提供服务，你可以通过目录名在 `.test` 域名下访问该目录中的任何 Laravel 应用。

安装 Herd 之后，创建新 Laravel 应用最快的方式是使用 Herd 自带的 Laravel CLI。首先，打开 Powershell 并运行以下命令：

```shell
cd ~\Herd
laravel new my-app
cd my-app
herd open
```

你可以查阅 [Herd 的 Windows 文档](https://herd.laravel.com/docs/windows)来了解更多信息。

<a name="ide-support"></a>
## IDE 支持

开发 Laravel 应用时，你可以随意使用任何喜欢的代码编辑器。如果你在寻找轻量且可扩展的编辑器，[VS Code](https://code.visualstudio.com) 或 [Cursor](https://cursor.com) 配合官方的 [Laravel VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel)可以提供出色的 Laravel 支持，其功能包括语法高亮、代码片段、Artisan 命令集成，以及针对 Eloquent 模型、路由、中间件、资源、配置和 Inertia.js 的智能自动补全。

如果需要全面而健壮的 Laravel 支持，可以了解一下 JetBrains 的 IDE [PhpStorm](https://www.jetbrains.com/phpstorm/laravel/?utm_source=laravel.com&utm_medium=link&utm_campaign=laravel-2025&utm_content=partner&ref=laravel-2025)。PhpStorm 内置的 Laravel 框架支持涵盖 Blade 模板，以及针对 Eloquent 模型、路由、视图、翻译和组件的智能自动补全，还提供强大的代码生成和项目内导航功能。

对于追求云端开发体验的开发者，[Firebase Studio](https://firebase.studio/) 让你可以直接在浏览器中即刻开始构建 Laravel 应用。Firebase Studio 无需任何配置，让你能在任何设备上轻松开始构建 Laravel 应用。

<a name="laravel-and-ai"></a>
## Laravel 与 AI

[Laravel Boost](https://github.com/laravel/boost) 是一款强大的工具，可以在 AI 编码 agent 与 Laravel 应用之间架起桥梁。Boost 为 AI agent 提供了 Laravel 特有的上下文、工具和指南，让它们能够生成更准确、符合特定版本且遵循 Laravel 约定的代码。

在你的 Laravel 应用中安装 Boost 后，AI agent 将可以使用 15 个以上的专用工具，包括查询你在使用的扩展包、查询数据库、搜索 Laravel 文档、读取浏览器日志、生成测试，以及通过 Tinker 执行代码等能力。

此外，Boost 还让 AI agent 能够访问 17000 多条向量化的 Laravel 生态文档，且与已安装的扩展包版本精确对应。这意味着 agent 可以针对你项目所使用的确切版本提供指导。

Boost 还包含 Laravel 官方维护的 AI 指南，帮助 agent 遵循框架约定、编写合适的测试，并在生成 Laravel 代码时避开常见的坑。

<a name="installing-laravel-boost"></a>
### 安装 Laravel Boost

Boost 可以安装在使用 PHP 8.1 或更高版本的 Laravel 10、11 和 12 应用中。首先，将 Boost 安装为开发依赖：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装器：

```shell
php artisan boost:install
```

安装器会自动检测你的 IDE 和 AI agent，让你能够选择适合你项目的功能。Boost 会尊重现有的项目约定，默认不会强推带有官方主张的风格规则。

> [!NOTE]
> 想进一步了解 Boost，请查阅 [GitHub 上的 Laravel Boost 仓库](https://github.com/laravel/boost)。

<a name="adding-custom-ai-guidelines"></a>
#### 添加自定义 AI 指南

想用你自己的自定义 AI 指南来增强 Laravel Boost，只需将 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录即可。当你运行 `boost:install` 时，这些文件会自动包含进 Laravel Boost 的指南中。

<a name="next-steps"></a>
## 后续步骤

创建好 Laravel 应用之后，你可能想知道接下来该学习什么。首先，我们强烈建议你阅读以下文档，以熟悉 Laravel 的工作方式：

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [Facade](/docs/{{version}}/facades)

你打算如何使用 Laravel，也决定了你接下来的学习路线。使用 Laravel 的方式多种多样，下面我们将探讨它的两种主要使用场景。

<a name="laravel-the-fullstack-framework"></a>
### Laravel 全栈框架

Laravel 可以作为全栈框架使用。所谓「全栈」框架，是指你将使用 Laravel 把请求路由到你的应用，并通过 [Blade 模板](/docs/{{version}}/blade)或 [Inertia](https://inertiajs.com) 之类的单页应用混合技术来渲染前端。这是使用 Laravel 框架最常见的方式，在我们看来，也是最高效的方式。

如果你打算这样使用 Laravel，可以查阅我们关于[前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views)或 [Eloquent ORM](/docs/{{version}}/eloquent) 的文档。此外，你可能还有兴趣了解 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com) 等社区扩展包。这些扩展包让你能够将 Laravel 用作全栈框架，同时享受单页 JavaScript 应用提供的诸多 UI 优势。

如果你将 Laravel 用作全栈框架，我们也强烈建议你学习如何使用 [Vite](/docs/{{version}}/vite) 来编译应用的 CSS 和 JavaScript。

> [!NOTE]
> 如果想在构建应用时抢先一步，可以了解一下我们的官方[应用入门套件](/docs/{{version}}/starter-kits)。

<a name="laravel-the-api-backend"></a>
### Laravel 作为 API 后端

Laravel 还可以作为 JavaScript 单页应用或移动应用的 API 后端。例如，你可以将 Laravel 用作 [Next.js](https://nextjs.org) 应用的 API 后端。在这种场景下，你可以使用 Laravel 为应用提供[身份验证](/docs/{{version}}/sanctum)以及数据存储 / 检索功能，同时还能利用 Laravel 强大的服务，比如队列、邮件、通知等等。

如果你打算这样使用 Laravel，可以查阅我们关于[路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的文档。
