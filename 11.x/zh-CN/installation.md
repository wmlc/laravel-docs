# 安装

- [认识 Laravel](#meet-laravel)
   - [为什么选择 Laravel？](#why-laravel)
- [创建 Laravel 应用](#creating-a-laravel-project)
   - [安装 PHP 与 Laravel 安装器](#installing-php)
   - [创建应用](#creating-an-application)
- [初始配置](#initial-configuration)
   - [基于环境的配置](#environment-based-configuration)
   - [数据库与数据库迁移](#databases-and-migrations)
   - [目录配置](#directory-configuration)
- [使用 Herd 进行本地安装](#local-installation-using-herd)
   - [macOS 上的 Herd](#herd-on-macos)
   - [Windows 上的 Herd](#herd-on-windows)
- [使用 Sail 进行 Docker 安装](#docker-installation-using-sail)
   - [macOS 上的 Sail](#sail-on-macos)
   - [Windows 上的 Sail](#sail-on-windows)
   - [Linux 上的 Sail](#sail-on-linux)
   - [选择你的 Sail 服务](#choosing-your-sail-services)
- [IDE 支持](#ide-support)
- [Laravel 与 AI](#laravel-and-ai)
   - [安装 Laravel Boost](#installing-laravel-boost)
- [后续步骤](#next-steps)
   - [Laravel 全栈框架](#laravel-the-fullstack-framework)
   - [Laravel API 后端](#laravel-the-api-backend)

<a name="meet-laravel"></a>
## 认识 Laravel

Laravel 是一个语法优雅、表达力丰富的 Web 应用框架。Web 框架为创建你的应用提供了结构和起点，让你得以专注于创造非凡的东西，而把细节交给我们来处理。

Laravel 力求提供出色的开发者体验，同时提供强大的功能，例如完善的依赖注入、富有表达力的数据库抽象层、队列与调度任务、单元测试和集成测试等。

无论你是 PHP Web 框架的新手，还是拥有多年经验，Laravel 都是一个能够与你共同成长的框架。我们会帮助你迈出作为 Web 开发者的第一步，也会在你把专长推向更高水平时为你加速。我们迫不及待地想看到你构建出的作品。

> [!NOTE]
> 刚接触 Laravel？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在我们带你构建第一个 Laravel 应用的同时，动手体验这个框架。

<a name="why-laravel"></a>
### 为什么选择 Laravel？

在构建 Web 应用时，你可以使用各种工具和框架。然而，我们相信 Laravel 是构建现代全栈 Web 应用的最佳选择。

#### 渐进式框架

我们喜欢把 Laravel 称为"渐进式"框架。这意味着 Laravel 会与你共同成长。如果你刚刚踏入 Web 开发，Laravel 海量的文档、指南和[视频教程](https://laracasts.com)会帮助你熟悉其中的门道，而不会让你不知所措。

如果你是一名资深开发者，Laravel 为你提供了用于[依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting)等场景的稳健工具。Laravel 针对构建专业 Web 应用做了精心调校，能够胜任企业级工作负载。

#### 可扩展的框架

Laravel 的扩展能力极强。得益于 PHP 对扩展友好的特性，以及 Laravel 内置对 Redis 这类快速分布式缓存系统的支持，使用 Laravel 进行水平扩展轻而易举。事实上，Laravel 应用已被轻松扩展到每月处理数亿次请求的规模。

需要极限扩展能力？[Laravel Vapor](https://vapor.laravel.com) 之类的平台允许你借助 AWS 最新的无服务器技术，让 Laravel 应用以近乎无限的规模运行。

#### 社区驱动的框架

Laravel 汇集了 PHP 生态中最优秀的包，提供当前最稳健、最友好的开发者体验框架。此外，全球数千名优秀开发者已[为框架做出贡献](https://github.com/laravel/framework)。谁知道呢，也许你也会成为 Laravel 的贡献者。

<a name="creating-a-laravel-project"></a>
## 创建 Laravel 应用

<a name="installing-php"></a>
### 安装 PHP 与 Laravel 安装器

在创建第一个 Laravel 应用之前，请确保本地机器上已安装 [PHP](https://php.net)、[Composer](https://getcomposer.org) 和 [Laravel 安装器](https://github.com/laravel/installer)。此外，你还应安装 [Node 与 NPM](https://nodejs.org) 或 [Bun](https://bun.sh/)，以便编译应用的前端资源。

如果你的本地机器上还没有安装 PHP 和 Composer，以下命令会在 macOS、Windows 或 Linux 上安装 PHP、Composer 和 Laravel 安装器：

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

运行上述命令之一后，你应该重新启动终端会话。如果你是通过 `php.new` 安装的 PHP、Composer 和 Laravel 安装器，重新在终端中运行相应命令即可更新它们。

如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器：

```shell
composer global require laravel/installer
```

> [!NOTE]
> 想要功能完整、图形化的 PHP 安装与管理体验？查看 [Laravel Herd](#local-installation-using-herd)。

<a name="creating-an-application"></a>
### 创建应用

安装好 PHP、Composer 和 Laravel 安装器后，你就可以创建新的 Laravel 应用了。Laravel 安装器会提示你选择偏好的测试框架、数据库和入门套件：

```nothing
laravel new example-app
```

应用创建完成后，你可以使用 `dev` Composer 脚本启动 Laravel 的本地开发服务器、队列工作进程和 Vite 开发服务器：

```nothing
cd example-app
npm install && npm run build
composer run dev
```

开发服务器启动后，你就可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问应用。接下来，你将[开始走进 Laravel 生态的下一步](#next-steps)。当然，你也可以考虑先[配置数据库](#databases-and-migrations)。

> [!NOTE]
> 如果你在开发 Laravel 应用时希望有个良好的起点，不妨试试我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为你的新 Laravel 应用提供后端和前端的认证脚手架。

<a name="initial-configuration"></a>
## 初始配置

Laravel 框架的所有配置文件都存放在 `config` 目录中。每个选项都有文档说明，因此请随意查阅这些文件，熟悉你可以使用的选项。

Laravel 开箱几乎不需要额外的配置，你可以直接开始开发！不过，你可能想看看 `config/app.php` 文件及其文档。它包含若干选项，例如 `url` 和 `locale`，你可以根据应用需要修改它们。

<a name="environment-based-configuration"></a>
### 基于环境的配置

由于 Laravel 的许多配置选项值会因应用运行在本地机器还是生产 Web 服务器而不同，许多重要的配置值都通过应用根目录下的 `.env` 文件来定义。

你不应把 `.env` 文件提交到应用的源代码管理中，因为每个使用你应用的开发者 / 服务器都可能需要不同的环境配置。此外，一旦入侵者获取了源代码仓库的访问权限，这也会带来安全风险，因为任何敏感凭据都会暴露出来。

> [!NOTE]
> 想了解 `.env` 文件和基于环境的配置的更多信息，请查阅完整的[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="databases-and-migrations"></a>
### 数据库与数据库迁移

现在你已经创建了 Laravel 应用，可能想在数据库中存储一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 将与一个 SQLite 数据库交互。

在创建应用的过程中，Laravel 已经为你创建了 `database/database.sqlite` 文件，并运行了必要的数据库迁移来创建应用的数据库表。

如果你更想使用 MySQL 或 PostgreSQL 等其他数据库驱动，可以更新 `.env` 配置文件以使用相应的数据库。例如，如果你希望使用 MySQL，可以这样更新 `.env` 配置文件中的 `DB_*` 变量：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果你选择使用 SQLite 以外的数据库，就需要自己创建数据库，并运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果你在 macOS 或 Windows 上开发，需要在本地安装 MySQL、PostgreSQL 或 Redis，不妨考虑使用 [Herd Pro](https://herd.laravel.com/#plans)。

<a name="directory-configuration"></a>
### 目录配置

Laravel 应当始终从为 Web 服务器配置的"网站根目录"中提供服务。你不应尝试从"网站根目录"的子目录中提供 Laravel 应用。这样做可能会暴露应用内的敏感文件。

<a name="local-installation-using-herd"></a>
## 使用 Herd 进行本地安装

[Laravel Herd](https://herd.laravel.com) 是一款适用于 macOS 和 Windows 的极速原生 Laravel 与 PHP 开发环境。Herd 包含你开始 Laravel 开发所需的一切，包括 PHP 和 Nginx。

安装 Herd 后，你就可以开始使用 Laravel 开发了。Herd 提供了 `php`、`composer`、`laravel`、`expose`、`node`、`npm` 和 `nvm` 等命令行工具。

> [!NOTE]
> [Herd Pro](https://herd.laravel.com/#plans) 为 Herd 增加了更多强大的功能，例如创建和管理本地 MySQL、Postgres 与 Redis 数据库的能力，以及本地邮件查看和日志监控。

<a name="herd-on-macos"></a>
### macOS 上的 Herd

如果你在 macOS 上开发，可以从 [Herd 官网](https://herd.laravel.com)下载 Herd 安装器。该安装器会自动下载最新版本的 PHP，并配置你的 Mac 始终在后台运行 [Nginx](https://www.nginx.com/)。

macOS 版 Herd 使用 [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) 来支持"停放"目录。任何位于停放目录中的 Laravel 应用都会被 Herd 自动提供访问服务。默认情况下，Herd 会在 `~/Herd` 创建一个停放目录，你可以在 `.test` 域名下使用目录名访问该目录中的任意 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方式是使用 Herd 附带的 Laravel CLI：

```nothing
cd ~/Herd
laravel new my-app
cd my-app
herd open
```

当然，你随时可以通过 Herd 的 UI 管理停放目录和其他 PHP 设置，该 UI 可以从系统托盘中的 Herd 菜单打开。

想进一步了解 Herd，请查阅 [Herd 文档](https://herd.laravel.com/docs)。

<a name="herd-on-windows"></a>
### Windows 上的 Herd

你可以在 [Herd 官网](https://herd.laravel.com/windows)下载 Herd 的 Windows 安装器。安装完成后，你可以启动 Herd 来完成引导流程，并首次访问 Herd UI。

在系统托盘中左键单击 Herd 图标即可打开 Herd UI。右键单击则会打开快捷菜单，其中可以访问你日常所需的各种工具。

安装期间，Herd 会在你的主目录中 `%USERPROFILE%\Herd` 处创建一个"停放"目录。任何位于停放目录中的 Laravel 应用都会被 Herd 自动提供访问服务，你可以在 `.test` 域名下使用目录名访问该目录中的任意 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方式是使用 Herd 附带的 Laravel CLI。要开始上手，请打开 Powershell 并运行以下命令：

```nothing
cd ~\Herd
laravel new my-app
cd my-app
herd open
```

想进一步了解 Herd，请查阅 [Windows 版 Herd 文档](https://herd.laravel.com/docs/windows)。

<a name="docker-installation-using-sail"></a>
## 使用 Sail 进行 Docker 安装

我们希望无论你偏好哪种操作系统，都能尽可能轻松地开始使用 Laravel。因此，在本地机器上开发和运行 Laravel 应用有多种选择。你可以稍后再去探索这些选项，而 Laravel 提供了 [Sail](/docs/{{version}}/sail)，这是一个开箱即用的方案，可以让你借助 [Docker](https://www.docker.com) 运行 Laravel 应用。

Docker 是一个在轻量级"容器"中运行应用和服务的工具，这些容器不会干扰你本地机器上已安装的软件或配置。这意味着你不必操心在本地机器上配置或搭建诸如 Web 服务器和数据库等复杂的开发工具。要开始上手，你只需安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)。

Laravel Sail 是一个轻量的命令行界面，用于与 Laravel 默认的 Docker 配置交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用提供了一个很好的起点，无需事先具备 Docker 经验。

> [!NOTE]
> 已经是 Docker 专家了？别担心！关于 Sail 的一切都可以通过 Laravel 附带的 `docker-compose.yml` 文件进行自定义。

<a name="sail-on-macos"></a>
### macOS 上的 Sail

如果你在 Mac 上开发，并且已经安装了 [Docker Desktop](https://www.docker.com/products/docker-desktop)，可以用一条简单的终端命令创建新的 Laravel 应用。例如，要在名为 "example-app" 的目录中创建新的 Laravel 应用，可以在终端中运行以下命令：

```shell
curl -s "https://laravel.build/example-app" | bash
```

当然，你可以把这个 URL 中的 "example-app" 换成任何你喜欢的名字，只需确保应用名称只包含字母数字字符、短横线和下划线。Laravel 应用的目录会在你执行命令所在的目录中创建。

Sail 的安装可能需要几分钟时间，因为要在你的本地机器上构建 Sail 的应用容器。

应用创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 默认的 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你应该运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，你可以在浏览器中通过以下地址访问应用：http://localhost。

> [!NOTE]
> 想继续深入了解 Laravel Sail，请查阅它的[完整文档](/docs/{{version}}/sail)。

<a name="sail-on-windows"></a>
### Windows 上的 Sail

在 Windows 机器上创建新的 Laravel 应用之前，请确保已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)。接下来，你应确保已安装并启用适用于 Linux 的 Windows 子系统 2（WSL2）。WSL 允许你在 Windows 10 上原生运行 Linux 二进制可执行文件。有关如何安装和启用 WSL2 的信息，可以在微软的[开发环境文档](https://docs.microsoft.com/en-us/windows/wsl/install-win10)中查到。

> [!NOTE]
> 安装并启用 WSL2 后，你应确保 Docker Desktop [已配置为使用 WSL2 后端](https://docs.docker.com/docker-for-windows/wsl/)。

接下来，你就可以创建第一个 Laravel 应用了。打开 [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?rtc=1&activetab=pivot:overviewtab)，为你的 WSL2 Linux 操作系统启动一个新的终端会话。然后，你可以用一条简单的终端命令创建新的 Laravel 应用。例如，要在名为 "example-app" 的目录中创建新的 Laravel 应用，可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，你可以把这个 URL 中的 "example-app" 换成任何你喜欢的名字，只需确保应用名称只包含字母数字字符、短横线和下划线。Laravel 应用的目录会在你执行命令所在的目录中创建。

Sail 的安装可能需要几分钟时间，因为要在你的本地机器上构建 Sail 的应用容器。

应用创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 默认的 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你应该运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，你可以在浏览器中通过以下地址访问应用：http://localhost。

> [!NOTE]
> 想继续深入了解 Laravel Sail，请查阅它的[完整文档](/docs/{{version}}/sail)。

#### 在 WSL2 中开发

当然，你必须能够修改 WSL2 安装中创建的 Laravel 应用文件。为此，我们推荐使用微软的 [Visual Studio Code](https://code.visualstudio.com) 编辑器及其第一方 [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) 扩展。

这些工具安装完成后，你可以使用 Windows Terminal，在应用根目录中执行 `code .` 命令来打开任意 Laravel 应用。

<a name="sail-on-linux"></a>
### Linux 上的 Sail

如果你在 Linux 上开发，并且已经安装了 [Docker Compose](https://docs.docker.com/compose/install/)，可以用一条简单的终端命令创建新的 Laravel 应用。

首先，如果你使用的是 Linux 版 Docker Desktop，应执行以下命令。如果你使用的不是 Linux 版 Docker Desktop，可以跳过这一步：

```shell
docker context use default
```

然后，要在名为 "example-app" 的目录中创建新的 Laravel 应用，可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，你可以把这个 URL 中的 "example-app" 换成任何你喜欢的名字，只需确保应用名称只包含字母数字字符、短横线和下划线。Laravel 应用的目录会在你执行命令所在的目录中创建。

Sail 的安装可能需要几分钟时间，因为要在你的本地机器上构建 Sail 的应用容器。

应用创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行界面，用于与 Laravel 默认的 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你应该运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
./vendor/bin/sail artisan migrate
```

最后，你可以在浏览器中通过以下地址访问应用：http://localhost。

> [!NOTE]
> 想继续深入了解 Laravel Sail，请查阅它的[完整文档](/docs/{{version}}/sail)。

<a name="choosing-your-sail-services"></a>
### 选择你的 Sail 服务

通过 Sail 创建新的 Laravel 应用时，你可以使用 `with` 查询字符串变量来选择新应用的 `docker-compose.yml` 文件中应配置哪些服务。可用服务包括 `mysql`、`pgsql`、`mariadb`、`redis`、`valkey`、`memcached`、`meilisearch`、`typesense`、`minio`、`selenium` 和 `mailpit`：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis" | bash
```

如果不指定想要配置哪些服务，系统会默认配置由 `mysql`、`redis`、`meilisearch`、`mailpit` 和 `selenium` 组成的栈。

你可以通过在 URL 中添加 `devcontainer` 参数，指示 Sail 安装一个默认的 [Devcontainer](/docs/{{version}}/sail#using-devcontainers)：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis&devcontainer" | bash
```

<a name="ide-support"></a>
## IDE 支持

开发 Laravel 应用时，你可以自由选择任何代码编辑器；不过 [PhpStorm](https://www.jetbrains.com/phpstorm/laravel/) 为 Laravel 及其生态系统提供了广泛支持，其中包括对 [Laravel Pint](https://www.jetbrains.com/help/phpstorm/using-laravel-pint.html) 的支持。

此外，由社区维护的 PhpStorm 插件 [Laravel Idea](https://laravel-idea.com/) 提供了多种实用的 IDE 增强功能，包括代码生成、Eloquent 语法补全、验证规则补全等。

<a name="laravel-and-ai"></a>
## Laravel 与 AI

[Laravel Boost](https://github.com/laravel/boost) 是一款强大的工具，架起了 AI 编码智能体与 Laravel 应用之间的桥梁。Boost 为 AI 智能体提供 Laravel 特有的上下文、工具和指导方针，让它们能够生成更准确、针对特定版本且符合 Laravel 规范的代码。

在你的 Laravel 应用中安装 Boost 后，AI 智能体可以访问 15 多项专用工具，包括了解你正在使用哪些包、查询数据库、搜索 Laravel 文档、读取浏览器日志、生成测试以及通过 Tinker 执行代码。

此外，Boost 让 AI 智能体可以访问超过 17,000 份已向量化的 Laravel 生态系统文档，并且针对你已安装的包版本定制。这意味着智能体可以针对你的项目所使用的确切版本提供指导。

Boost 还包含由 Laravel 维护的 AI 指导方针，用于提示智能体遵循框架约定、编写恰当的测试，并在生成 Laravel 代码时避开常见陷阱。

<a name="installing-laravel-boost"></a>
### 安装 Laravel Boost

Boost 可以安装在运行 PHP 8.1 或更高版本的 Laravel 10、11 和 12 应用中。要开始上手，请把 Boost 作为开发依赖安装：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装器：

```shell
php artisan boost:install
```

安装器会自动检测你的 IDE 和 AI 智能体，让你自行选择适合项目的功能。Boost 会尊重项目已有的约定，默认不会强加主观的代码风格规则。

> [!NOTE]
> 想进一步了解 Boost，请查阅 [GitHub 上的 Laravel Boost 仓库](https://github.com/laravel/boost)。

<a name="next-steps"></a>
## 后续步骤

现在你已经创建了 Laravel 应用，可能想知道接下来该学些什么。首先，我们强烈建议你通过阅读以下文档来熟悉 Laravel 的运作方式：

<div class="content-list" markdown="1">

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [Facade](/docs/{{version}}/facades)

</div>

你想如何使用 Laravel，也会决定你接下来的前进方向。使用 Laravel 有多种方式，下面我们将探讨该框架的两个主要使用场景。

> [!NOTE]
> 刚接触 Laravel？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在我们带你构建第一个 Laravel 应用的同时，动手体验这个框架。

<a name="laravel-the-fullstack-framework"></a>
### Laravel 全栈框架

Laravel 可以作为全栈框架使用。所谓"全栈"框架，是指你会使用 Laravel 把请求路由到你的应用，并通过 [Blade 模板](/docs/{{version}}/blade) 或 [Inertia](https://inertiajs.com) 这类单页应用混合技术来渲染前端。这是使用 Laravel 框架最常见的方式，也是我们眼中使用 Laravel 最高效的方式。

如果你计划这样使用 Laravel，不妨查阅我们关于[前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views)以及 [Eloquent ORM](/docs/{{version}}/eloquent)的文档。此外，你可能还有兴趣了解 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com) 这类社区包。这些包让你在享受单页 JavaScript 应用诸多 UI 优势的同时，把 Laravel 当作全栈框架来使用。

如果你把 Laravel 用作全栈框架，我们还强烈建议你了解如何使用 [Vite](/docs/{{version}}/vite) 编译应用的 CSS 和 JavaScript。

> [!NOTE]
> 如果你想抢先一步开始构建应用，不妨查看我们的官方[应用入门套件](/docs/{{version}}/starter-kits)之一。

<a name="laravel-the-api-backend"></a>
### Laravel API 后端

Laravel 也可以作为 JavaScript 单页应用或移动应用的 API 后端。例如，你可以把 Laravel 用作 [Next.js](https://nextjs.org) 应用的 API 后端。在这种情况下，你可以用 Laravel 为应用提供[认证](/docs/{{version}}/sanctum)和数据存储 / 获取能力，同时充分利用 Laravel 强大的服务，如队列、邮件、通知等。

如果你计划这样使用 Laravel，不妨查阅我们关于[路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum)以及 [Eloquent ORM](/docs/{{version}}/eloquent)的文档。

> [!NOTE]
> 想抢先一步为你的 Laravel 后端和 Next.js 前端搭建脚手架？Laravel Breeze 提供了一个 [API 技术栈](/docs/{{version}}/starter-kits#breeze-and-next)以及一套 [Next.js 前端实现](https://github.com/laravel/breeze-next)，让你几分钟内即可上手。
