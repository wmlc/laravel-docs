# 安装

## 初识 Laravel

Laravel 是一套表达力强、语法优雅的 Web 应用框架。Web 框架为构建应用提供了结构和起点，让你专注于创造令人惊艳的体验，而细节交给我们。

Laravel 致力于提供卓越的开发体验，同时提供强大的特性——例如完善的依赖注入、表达力强的数据库抽象层、队列与定时任务、单元测试与集成测试，等等。

无论你是 PHP Web 框架的新手，还是拥有多年经验的资深开发者，Laravel 都是一个能与你一同成长的框架。我们将帮助你迈出 Web 开发的第一步，或在你追求更高水平的路上提供助力。迫不及待想看到你构建的作品。

### 为什么选择 Laravel？

构建 Web 应用时，可选的工具和框架有很多。但我们相信，Laravel 是构建现代化全栈 Web 应用的最好选择。

#### 一个渐进式框架

我们喜欢把 Laravel 称为「渐进式」框架，意思是 Laravel 会与你一同成长。如果你刚刚踏入 Web 开发，Laravel 庞大的文档、指南和 [视频教程](https://laracasts.com) 库会帮你顺利上手，不会被信息海洋淹没。

如果你是一名资深开发者，Laravel 提供了稳健的工具，包括 [依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting) 等。Laravel 已经为构建专业 Web 应用调校到位，并准备好应对企业级工作负载。

#### 一个可扩展的框架

Laravel 的可扩展能力极强。得益于 PHP 本身良好的伸缩性以及 Laravel 内置对 Redis 等快速、分布式缓存系统的支持，使用 Laravel 进行水平扩展非常轻松。实际上，Laravel 应用已经能够轻松应对每月数亿请求的规模。

需要极致的横向扩展？像 [Laravel Cloud](https://cloud.laravel.com) 这样的平台允许你以几乎无限制的规模运行 Laravel 应用。

#### 一个 Agent 友好的框架

Laravel 立场鲜明的约定和定义清晰的结构，使它成为 [AI 辅助开发](/docs/{{version}}/ai) 的理想框架，尤其是与 Cursor、Claude Code 等工具一起使用时。当你让 AI agent 添加一个控制器时，它清楚地知道该把文件放到哪里。需要新建迁移时，命名约定和文件位置都是可预期的。这种一致性消除了"猜"，让 AI 工具在更"灵活"的框架里常常感到吃力。

除了文件组织，Laravel 富有表达力的语法和完善的文档，也为 AI agent 提供了准确生成地道代码所需的上下文。Eloquent 关联、表单请求和中间件等特性都遵循一套确定的模式——agent 可以可靠地理解并复刻这些模式。最终结果是：AI 生成的代码看起来就像经验丰富的 Laravel 开发者写的，而不是用通用 PHP 片段拼凑出来的。

要进一步了解为何 Laravel 是 AI 辅助开发的理想之选，可以查阅 [agentic 开发文档](/docs/{{version}}/ai)。

#### 一个由社区驱动的框架

Laravel 整合了 PHP 生态最优秀的扩展包，提供了强大且对开发者友好的框架。此外，全球成千上万才华横溢的开发者都为 [框架做出了贡献](https://github.com/laravel/framework)。也许你也会成为一位 Laravel 贡献者。

## 创建 Laravel 应用

### 使用 AI 快速起步

如果你使用的是像 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [OpenCode](https://opencode.ai) 这样的 AI 编程 agent，可以用一段提示词先给 agent 一份 Laravel 专属的"剧本"，再让它接触你的项目。

下面的提示会告诉 agent 在哪里能找到 Laravel 的安装指南、应当优先做什么、在你还没做选择时该如何合理地选取默认值。把这段内容粘到你的 agent 里即可起步：

```text
I'm building a new Laravel application.

Fetch and follow the instructions from https://laravel.com/for/agents. Treat the returned Markdown as the source of truth for how to install and set up Laravel in this session.
```

agent 读完指令后，会一步步引导你，让整个搭建过程始终对齐 Laravel 的默认设置。

### 安装 PHP 与 Laravel 安装器

在创建第一个 Laravel 应用之前，请确认你的本地机器已经安装 [PHP](https://php.net)、[Composer](https://getcomposer.org) 与 [Laravel 安装器](https://github.com/laravel/installer)。此外，你还需要安装 [Node 与 NPM](https://nodejs.org) 或 [Bun](https://bun.sh/) 中的一个，以便编译应用的前端资源。

如果本地尚未安装 PHP 与 Composer，下面的命令可以在 macOS、Windows 或 Linux 上安装 PHP、Composer 与 Laravel 安装器：

```shell tab=macOS
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

```shell tab=Windows PowerShell
# 请以管理员身份运行...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

```shell tab=Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

运行上面的某条命令后，请重新打开终端会话。如果以后需要更新通过 `php.new` 安装的 PHP、Composer 或 Laravel 安装器，重新运行同一条命令即可。

如果已经安装了 PHP 和 Composer，也可以单独通过 Composer 安装 Laravel 安装器：

```shell
composer global require laravel/installer
```

> [!NOTE]
> 若希望拥有完整功能、图形化的 PHP 安装与管理体验，请查看 [Laravel Herd](#installation-using-herd)。

### 创建应用

安装好 PHP、Composer 和 Laravel 安装器后，就可以创建一个新的 Laravel 应用了：

```shell
laravel new example-app
```

应用创建完成后，就可以通过 `dev` Composer 脚本启动 Laravel 的本地开发服务器、队列 worker 和 Vite 开发服务器：

```shell
cd example-app
npm install && npm run build
composer run dev
```

启动开发服务器后，就可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问应用。准备好之后，可以 [开始你在 Laravel 生态的下一步旅程](#next-steps)。当然，你可能还想 [配置数据库](#databases-and-migrations)，并运行必要的迁移。

> [!NOTE]
> 如果想在 Laravel 开发中获得"快人一步"的体验，可以考虑使用我们的某个 [入门套件](/docs/{{version}}/starter-kits)。Laravel 的入门套件会为新应用预置后端与前端认证脚手架。

## 初始配置

Laravel 框架的所有配置文件都存放在 `config` 目录下。每个选项都有相应注释，建议你浏览这些文件，熟悉可配置的选项。

Laravel 几乎不需要额外的开箱配置，可以立即着手开发！不过，你也许希望查看 `config/app.php` 及其文档，其中包含 `url`、`locale` 等可以按应用需要调整的选项。

### 基于环境的配置

由于很多 Laravel 配置项的值会因运行环境（本地机器还是生产服务器）而异，许多重要的配置值都通过应用根目录下的 `.env` 文件定义。

`.env` 文件不应提交到应用的源代码控制——因为每位开发者 / 每台服务器上可能需要不同的环境配置。此外，一旦入侵者获得源码仓库的访问权限，把敏感凭证暴露在 `.env` 里也是一种安全风险。

> [!NOTE]
> 关于 `.env` 文件与基于环境的配置的更多信息，请查阅完整的 [配置文档](/docs/{{version}}/configuration#environment-configuration)。

### 数据库与迁移

既然已经创建好 Laravel 应用，你大概率会想往数据库里保存一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 使用 SQLite 数据库。

在创建应用的过程中，Laravel 已经为你创建了 `database/database.sqlite` 文件，并运行必要的迁移脚本来创建应用的数据表。

如果你更倾向于使用其他数据库驱动（例如 MySQL 或 PostgreSQL），可以修改 `.env` 配置文件使用对应的数据库。例如，若希望使用 MySQL，请按如下方式修改 `.env` 中的 `DB_*` 变量：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果选择 SQLite 之外的数据库，需要先创建数据库，再运行应用的 [数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果你在 macOS 或 Windows 上开发，且需要在本地安装 MySQL、PostgreSQL 或 Redis，可以考虑使用 [Herd Pro](https://herd.laravel.com/#plans) 或 [DBngin](https://dbngin.com/)。

### 目录配置

Laravel 应始终从 Web 服务器配置的「Web 目录」根目录提供访问。不应尝试从「Web 目录」的子目录提供 Laravel 应用，那样可能会暴露应用中的敏感文件。

## 使用 Herd 安装

[Laravel Herd](https://herd.laravel.com) 是一款运行于 macOS 和 Windows 上的、极速、原生的 Laravel + PHP 开发环境。Herd 包含开始 Laravel 开发所需的全部组件，包括 PHP 和 Nginx。

一旦安装好 Herd，就可以开始 Laravel 开发了。Herd 自带 `php`、`composer`、`laravel`、`expose`、`node`、`npm` 与 `nvm` 的命令行工具。

> [!NOTE]
> [Herd Pro](https://herd.laravel.com/#plans) 在 Herd 的基础上增加了更多强大能力，例如创建与管理本地 MySQL、Postgres、Redis 数据库，以及本地邮件查看与日志监控。

### macOS 上的 Herd

如果你在 macOS 上开发，可以从 [Herd 官网](https://herd.laravel.com) 下载 Herd 安装包。安装程序会自动下载最新版的 PHP，并把 Mac 配置为始终在后台运行 [Nginx](https://www.nginx.com/)。

macOS 版 Herd 使用 [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) 来支持「parked」目录。任何位于 parked 目录下的 Laravel 应用都会被 Herd 自动托管。默认情况下，Herd 会在 `~/Herd` 创建 parked 目录，你可以通过 `.test` 域名加目录名访问该目录下的任意 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方式是使用它自带的 Laravel CLI：

```shell
cd ~/Herd
laravel new my-app
cd my-app
herd open
```

当然，你也可以随时通过 Herd 的图形界面（从系统托盘中的 Herd 菜单打开）管理 parked 目录与其他 PHP 设置。

要进一步了解 Herd，请查阅 [Herd 文档](https://herd.laravel.com/docs)。

### Windows 上的 Herd

可以从 [Herd 官网](https://herd.laravel.com/windows) 下载 Windows 版 Herd 安装包。安装完成后，可以启动 Herd 完成引导流程，并首次访问 Herd 的图形界面。

通过左键单击系统托盘的 Herd 图标可以打开 Herd 图形界面；右键单击会打开包含日常所需全部工具的快捷菜单。

安装过程中，Herd 会在家目录下创建「parked」目录，路径为 `%USERPROFILE%\Herd`。任何位于该 parked 目录下的 Laravel 应用都会被 Herd 自动托管，你可以通过 `.test` 域名加目录名访问这些应用。

安装 Herd 后，最快创建新 Laravel 应用的方式还是使用它自带的 Laravel CLI。在 PowerShell 中依次执行以下命令即可：

```shell
cd ~\Herd
laravel new my-app
cd my-app
herd open
```

要进一步了解 Herd，请查阅 [Windows 版 Herd 文档](https://herd.laravel.com/docs/windows)。

## IDE 支持

开发 Laravel 应用时，你可以自由选择任何喜欢的代码编辑器。[Laravel LSP](https://github.com/laravel/lsp) 提供框架感知的编辑器支持，包括代码补全、悬停信息、诊断提示、文档链接、跳转到定义以及对 Laravel 和 Blade 代码的快速修复。

要安装 Laravel LSP，可通过 Composer 全局安装，并确保 Composer 的全局 vendor bin 目录在 `PATH` 中：

```shell
composer global require laravel/lsp
```

如果你在寻找轻量且可扩展的编辑器，可以试试将 [VS Code](https://code.visualstudio.com) 或 [Cursor](https://cursor.com) 与官方 [Laravel VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel) 搭配使用，能提供语法高亮、代码片段、Artisan 命令集成以及自动的 Laravel LSP 支持。官方 Laravel 扩展也支持 [Sublime Text](https://github.com/laravel/sublime-extension) 和 [Zed](https://github.com/laravel/zed-extension)。其他支持语言服务器的编辑器（包括 Neovim 和 OpenCode）的安装方法，请参考 [Laravel LSP 仓库](https://github.com/laravel/lsp)。

如果你希望获得更为完整、强健的 Laravel 支持，可以了解一下 [PhpStorm](https://www.jetbrains.com/phpstorm/laravel/?utm_source=laravel.com&utm_medium=link&utm_campaign=laravel-2025&utm_content=partner&ref=laravel-2025)，这是 JetBrains 旗下的 IDE。PhpStorm 内置的 Laravel 框架支持包括：Blade 模板、Eloquent 模型的智能补全、路由、视图、翻译、组件，以及在 Laravel 项目中的强大代码生成与导航功能。

如果你追求基于云端的开发体验，[Firebase Studio](https://firebase.studio/) 让你可以直接在浏览器中构建 Laravel 应用，几乎零配置，让你能随时随地从任何设备起步。

## Laravel 与 AI

[Laravel Boost](https://github.com/laravel/boost) 是一款在 AI 编程 agent 与 Laravel 应用之间架桥的强大工具。Boost 为 AI agent 提供 Laravel 专属的上下文、工具与准则，让它们能生成更准确、与 Laravel 版本特性相符且遵循约定的代码。

在 Laravel 应用中安装 Boost 后，AI agent 可以访问 15+ 个专用工具，包括：了解你正在使用的扩展包、查询数据库、搜索 Laravel 文档、读取浏览器日志、生成测试，以及通过 Tinker 执行代码。

此外，Boost 还会为 AI agent 提供 17,000+ 条向量化的 Laravel 生态文档，且与你安装的扩展包版本相关。这意味着 agent 能针对项目实际使用的版本给出精准指导。

Boost 还包含 Laravel 维护的 AI 准则，帮助 agent 遵循框架约定、编写合适的测试，并避免生成 Laravel 代码时的常见陷阱。

### 安装 Laravel Boost

Boost 可以安装在运行 PHP 8.1 及以上的 Laravel 10、11、12、13 应用中。首先以开发依赖的方式安装：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装脚本：

```shell
php artisan boost:install
```

安装脚本会自动检测你的 IDE 和 AI agent，允许你按需选择适合项目的特性。Boost 会尊重项目原有约定，默认不会强制推行强风格的代码规范。

> [!NOTE]
> 要进一步了解 Boost，请查阅 [GitHub 上的 Laravel Boost 仓库](https://github.com/laravel/boost)。

#### 添加自定义 AI 准则

如果想用你自己的 AI 准则增强 Laravel Boost，可以把 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录下。运行 `boost:install` 时，这些文件会自动并入 Laravel Boost 的准则集合。

## 下一步

现在你已经创建好了 Laravel 应用，可能在想下一步学什么。首先，强烈建议你通过阅读以下文档熟悉 Laravel 的工作方式：

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [门面](/docs/{{version}}/facades)

你打算如何使用 Laravel 也会决定接下来要走的路。Laravel 有着多种多样的使用方式，下面我们探讨其中两个最常见的用例。

### Laravel 作为全栈框架

Laravel 可以扮演全栈框架的角色。所谓「全栈」框架，就是说你将借助 Laravel 把请求路由到应用，并通过 [Blade 模板](/docs/{{version}}/blade) 或类似 [Inertia](https://inertiajs.com) 的单页应用混合技术来渲染前端。这是使用 Laravel 最常见的方式，也是我们认为最高效的方式。

如果你打算这样使用 Laravel，建议查阅我们的 [前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views) 或 [Eloquent ORM](/docs/{{version}}/eloquent) 文档。此外，你可能也想了解 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com) 等社区扩展包。这些扩展包让你在享受单页 JavaScript 应用带来的 UI 优势的同时，把 Laravel 当作全栈框架来使用。

如果你把 Laravel 用作全栈框架，我们还强烈建议学习如何使用 [Vite](/docs/{{version}}/vite) 编译应用的 CSS 与 JavaScript。

> [!NOTE]
> 如果你想更快地开始构建应用，可以试试我们的官方 [应用入门套件](/docs/{{version}}/starter-kits)。

### Laravel 作为 API 后端

Laravel 也可以充当 JavaScript 单页应用或移动应用的 API 后端。例如，你也许会用 Laravel 作为你的 [Next.js](https://nextjs.org) 应用的 API 后端。在这种情况下，你可以用 Laravel 提供 [认证](/docs/{{version}}/sanctum) 与数据存取能力，同时享受 Laravel 强大的队列、邮件、通知等服务。

如果你打算这样使用 Laravel，可以查看我们的 [路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum) 与 [Eloquent ORM](/docs/{{version}}/eloquent) 文档。
