# 安装

- [认识 Laravel](#meet-laravel)
    - [为什么选择 Laravel？](#why-laravel)
- [你的第一个 Laravel 项目](#your-first-laravel-project)
- [Laravel 与 Docker](#laravel-and-docker)
    - [在 macOS 上入门](#getting-started-on-macos)
    - [在 Windows 上入门](#getting-started-on-windows)
    - [在 Linux 上入门](#getting-started-on-linux)
    - [选择你的 Sail 服务](#choosing-your-sail-services)
- [初始配置](#initial-configuration)
    - [基于环境的配置](#environment-based-configuration)
    - [数据库与迁移](#databases-and-migrations)
- [后续步骤](#next-steps)
    - [Laravel 作为全栈框架](#laravel-the-fullstack-framework)
    - [Laravel 作为 API 后端](#laravel-the-api-backend)

<a name="meet-laravel"></a>
## 认识 Laravel

Laravel 是一个具有表现力、优雅语法的 Web 应用框架。Web 框架为创建应用提供了结构和起点，让你可以专注于创造令人惊叹的作品，而我们来处理细节。

Laravel 致力于提供出色的开发者体验，同时提供强大的功能，如完善的依赖注入、表现力丰富的数据库抽象层、队列和计划任务、单元测试和集成测试等。

无论你是 PHP Web 框架的新手还是拥有多年经验，Laravel 都是一个能与你共同成长的框架。我们将帮助你迈出 Web 开发者的第一步，或者在你将专业技能提升到新水平时助你一臂之力。我们迫不及待地想看到你构建的作品。

> **Note**
> Laravel 新手？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在引导你构建第一个 Laravel 应用的同时，为你提供框架的实践导览。

<a name="why-laravel"></a>
### 为什么选择 Laravel？

构建 Web 应用时，你可以选择多种工具和框架。然而，我们相信 Laravel 是构建现代全栈 Web 应用的最佳选择。

#### 渐进式框架

我们喜欢将 Laravel 称为「渐进式」框架。我们的意思是 Laravel 会与你共同成长。如果你刚刚踏入 Web 开发领域，Laravel 庞大的文档库、指南和[视频教程](https://laracasts.com)将帮助你轻松上手，而不会感到不知所措。

如果你是资深开发者，Laravel 为你提供了[依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting)等方面的强大工具。Laravel 经过精心调优，适合构建专业的 Web 应用，并已准备好应对企业级工作负载。

#### 可扩展框架

Laravel 具有极强的可扩展性。得益于 PHP 对扩展友好的特性以及 Laravel 对 Redis 等快速分布式缓存系统的内置支持，Laravel 的水平扩展轻而易举。事实上，Laravel 应用已被轻松扩展到每月处理数亿次请求。

需要极致扩展？[Laravel Vapor](https://vapor.laravel.com) 等平台允许你在 AWS 最新的无服务器技术上以近乎无限的规模运行 Laravel 应用。

#### 社区框架

Laravel 结合了 PHP 生态系统中最优秀的包，提供了最健壮且对开发者友好的框架。此外，来自世界各地的数千名优秀开发者已经[为框架做出了贡献](https://github.com/laravel/framework)。谁知道呢，也许你也会成为 Laravel 的贡献者。

<a name="your-first-laravel-project"></a>
## 你的第一个 Laravel 项目

在创建第一个 Laravel 项目之前，你应当确保本地机器已安装 PHP 和 [Composer](https://getcomposer.org)。如果你在 macOS 上开发，可以通过 [Homebrew](https://brew.sh/) 安装 PHP 和 Composer。此外，我们建议[安装 Node 和 NPM](https://nodejs.org)。

安装 PHP 和 Composer 后，你可以通过 Composer 的 `create-project` 命令创建新的 Laravel 项目：

```nothing
composer create-project laravel/laravel:^9.0 example-app
```

或者，你可以通过 Composer 全局安装 Laravel 安装器来创建新的 Laravel 项目：

```nothing
composer global require laravel/installer

laravel new example-app
```

项目创建完成后，使用 Laravel 的 Artisan CLI `serve` 命令启动本地开发服务器：

```nothing
cd example-app

php artisan serve
```

启动 Artisan 开发服务器后，你可以在浏览器中通过 `http://localhost:8000` 访问应用。接下来，你就可以[开始在 Laravel 生态系统中迈出下一步](#next-steps)了。当然，你可能还需要[配置数据库](#databases-and-migrations)。

> **Note**
> 如果你在开发 Laravel 应用时想要一个良好的起点，可以考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为你的新 Laravel 应用提供后端和前端认证脚手架。

<a name="laravel-and-docker"></a>
## Laravel 与 Docker

我们希望无论你使用什么操作系统，都能尽可能轻松地开始使用 Laravel。因此，在本地机器上开发和运行 Laravel 项目有多种选择。虽然你可能希望以后再探索这些选项，但 Laravel 提供了 [Sail](/docs/{{version}}/sail)，这是一个使用 [Docker](https://www.docker.com) 运行 Laravel 项目的内置解决方案。

Docker 是一种在小型、轻量级「容器」中运行应用和服务的工具，这些容器不会干扰本地机器上已安装的软件或配置。这意味着你不必担心在本地机器上配置或安装复杂的开发工具（如 Web 服务器和数据库）。要开始使用，你只需安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)。

Laravel Sail 是一个轻量级命令行接口，用于与 Laravel 的默认 Docker 配置交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用提供了一个绝佳的起点，无需事先具备 Docker 经验。

> **Note**
> 已经是 Docker 专家？不用担心！Sail 的一切都可以通过 Laravel 附带的 `docker-compose.yml` 文件进行自定义。

<a name="getting-started-on-macos"></a>
### 在 macOS 上入门

如果你在 Mac 上开发且已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)，你可以使用一个简单的终端命令来创建新的 Laravel 项目。例如，要在名为 "example-app" 的目录中创建新的 Laravel 应用，你可以在终端中运行以下命令：

```shell
curl -s "https://laravel.build/example-app" | bash
```

当然，你可以将此 URL 中的 "example-app" 改为任何你喜欢的名称——只需确保应用名称只包含字母数字字符、连字符和下划线。Laravel 应用的目录将在你执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用容器会在本地机器上构建。

项目创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行接口来与 Laravel 的默认 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你可以在浏览器中通过 http://localhost 访问应用。

> **Note**
> 要继续了解更多关于 Laravel Sail 的信息，请查阅其[完整文档](/docs/{{version}}/sail)。

<a name="getting-started-on-windows"></a>
### 在 Windows 上入门

在 Windows 机器上创建新的 Laravel 应用之前，请确保已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)。接下来，你应当确保已安装并启用 Windows Subsystem for Linux 2（WSL2）。WSL 允许你在 Windows 10 上原生运行 Linux 二进制可执行文件。有关如何安装和启用 WSL2 的信息，请参阅 Microsoft 的[开发者环境文档](https://docs.microsoft.com/en-us/windows/wsl/install-win10)。

> **Note**
> 安装并启用 WSL2 后，你应当确保 Docker Desktop 已[配置为使用 WSL2 后端](https://docs.docker.com/docker-for-windows/wsl/)。

接下来，你就可以创建第一个 Laravel 项目了。启动 [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?rtc=1&activetab=pivot:overviewtab)，为你的 WSL2 Linux 操作系统开启一个新的终端会话。然后，你可以使用一个简单的终端命令来创建新的 Laravel 项目。例如，要在名为 "example-app" 的目录中创建新的 Laravel 应用，你可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，你可以将此 URL 中的 "example-app" 改为任何你喜欢的名称——只需确保应用名称只包含字母数字字符、连字符和下划线。Laravel 应用的目录将在你执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用容器会在本地机器上构建。

项目创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行接口来与 Laravel 的默认 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你可以在浏览器中通过 http://localhost 访问应用。

> **Note**
> 要继续了解更多关于 Laravel Sail 的信息，请查阅其[完整文档](/docs/{{version}}/sail)。

#### 在 WSL2 中开发

当然，你需要能够修改在 WSL2 安装中创建的 Laravel 应用文件。为此，我们建议使用 Microsoft 的 [Visual Studio Code](https://code.visualstudio.com) 编辑器及其官方的 [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) 扩展。

安装这些工具后，你可以使用 Windows Terminal 从应用的根目录执行 `code .` 命令来打开任何 Laravel 项目。

<a name="getting-started-on-linux"></a>
### 在 Linux 上入门

如果你在 Linux 上开发且已安装 [Docker Compose](https://docs.docker.com/compose/install/)，你可以使用一个简单的终端命令来创建新的 Laravel 项目。例如，要在名为 "example-app" 的目录中创建新的 Laravel 应用，你可以在终端中运行以下命令：

```shell
curl -s https://laravel.build/example-app | bash
```

当然，你可以将此 URL 中的 "example-app" 改为任何你喜欢的名称——只需确保应用名称只包含字母数字字符、连字符和下划线。Laravel 应用的目录将在你执行命令的目录中创建。

Sail 安装可能需要几分钟，因为 Sail 的应用容器会在本地机器上构建。

项目创建完成后，你可以进入应用目录并启动 Laravel Sail。Laravel Sail 提供了一个简单的命令行接口来与 Laravel 的默认 Docker 配置交互：

```shell
cd example-app

./vendor/bin/sail up
```

应用的 Docker 容器启动后，你可以在浏览器中通过 http://localhost 访问应用。

> **Note**
> 要继续了解更多关于 Laravel Sail 的信息，请查阅其[完整文档](/docs/{{version}}/sail)。

<a name="choosing-your-sail-services"></a>
### 选择你的 Sail 服务

通过 Sail 创建新的 Laravel 应用时，你可以使用 `with` 查询字符串变量来选择在新应用的 `docker-compose.yml` 文件中应配置哪些服务。可用服务包括 `mysql`、`pgsql`、`mariadb`、`redis`、`memcached`、`meilisearch`、`minio`、`selenium` 和 `mailpit`：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis" | bash
```

如果你未指定要配置的服务，将默认配置 `mysql`、`redis`、`meilisearch`、`mailpit` 和 `selenium` 技术栈。

你可以通过在 URL 中添加 `devcontainer` 参数来指示 Sail 安装默认的 [Devcontainer](/docs/{{version}}/sail#using-devcontainers)：

```shell
curl -s "https://laravel.build/example-app?with=mysql,redis&devcontainer" | bash
```

<a name="initial-configuration"></a>
## 初始配置

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，你可以随意浏览这些文件以熟悉可用选项。

Laravel 开箱即用，几乎不需要额外配置。你可以直接开始开发！不过，你可能希望查看 `config/app.php` 文件及其文档。它包含一些你可能需要根据应用进行修改的选项，如 `timezone` 和 `locale`。

<a name="environment-based-configuration"></a>
### 基于环境的配置

由于 Laravel 的许多配置选项值可能因应用运行在本地机器还是生产 Web 服务器上而有所不同，许多重要的配置值通过应用根目录下的 `.env` 文件来定义。

你的 `.env` 文件不应当提交到应用的源代码控制中，因为每个使用你应用的开发者或服务器可能需要不同的环境配置。此外，如果入侵者获得了源代码控制仓库的访问权限，这会带来安全风险，因为任何敏感凭证都会被暴露。

> **Note**
> 有关 `.env` 文件和基于环境配置的更多信息，请查看完整的[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="databases-and-migrations"></a>
### 数据库与迁移

创建 Laravel 应用后，你可能想在数据库中存储一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 将与 MySQL 数据库交互，并通过 `127.0.0.1` 访问数据库。如果你在 macOS 上开发且需要在本地安装 MySQL、Postgres 或 Redis，使用 [DBngin](https://dbngin.com/) 可能会很方便。

如果你不想在本地机器上安装 MySQL 或 Postgres，始终可以使用 [SQLite](https://www.sqlite.org/index.html) 数据库。SQLite 是一个小型、快速、自包含的数据库引擎。要开始使用，请更新 `.env` 配置文件以使用 Laravel 的 `sqlite` 数据库驱动。你可以移除其他数据库配置选项：

```ini
DB_CONNECTION=sqlite # [tl! add]
DB_CONNECTION=mysql # [tl! remove]
DB_HOST=127.0.0.1 # [tl! remove]
DB_PORT=3306 # [tl! remove]
DB_DATABASE=laravel # [tl! remove]
DB_USERNAME=root # [tl! remove]
DB_PASSWORD= # [tl! remove]
```

配置好 SQLite 数据库后，你可以运行应用的[数据库迁移](/docs/{{version}}/migrations)，这将创建应用的数据库表：

```shell
php artisan migrate
```

如果应用不存在 SQLite 数据库，Laravel 会询问你是否要创建该数据库。通常，SQLite 数据库文件会创建在 `database/database.sqlite`。

<a name="next-steps"></a>
## 后续步骤

创建 Laravel 项目后，你可能想知道接下来该学什么。首先，我们强烈建议通过阅读以下文档来熟悉 Laravel 的工作方式：

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [Facade](/docs/{{version}}/facades)

你希望如何使用 Laravel 也将决定你接下来的学习路径。使用 Laravel 的方式多种多样，下面我们将探讨框架的两个主要用例。

> **Note**
> Laravel 新手？查看 [Laravel Bootcamp](https://bootcamp.laravel.com)，在引导你构建第一个 Laravel 应用的同时，为你提供框架的实践导览。

<a name="laravel-the-fullstack-framework"></a>
### Laravel 作为全栈框架

Laravel 可以作为全栈框架使用。所谓「全栈」框架，是指你将使用 Laravel 将请求路由到应用，并通过 [Blade 模板](/docs/{{version}}/blade)或 [Inertia](https://inertiajs.com) 等单页应用混合技术来渲染前端。这是使用 Laravel 框架最常见的方式，在我们看来，也是使用 Laravel 最高效的方式。

如果你计划以这种方式使用 Laravel，你可能需要查看我们关于[前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views)或 [Eloquent ORM](/docs/{{version}}/eloquent) 的文档。此外，你可能对 [Livewire](https://laravel-livewire.com) 和 [Inertia](https://inertiajs.com) 等社区包感兴趣。这些包允许你将 Laravel 作为全栈框架使用，同时享受单页 JavaScript 应用提供的许多 UI 优势。

如果你将 Laravel 用作全栈框架，我们还强烈建议你学习如何使用 [Vite](/docs/{{version}}/vite) 编译应用的 CSS 和 JavaScript。

> **Note**
> 如果你想在构建应用时有一个良好的起点，请查看我们的官方[应用入门套件](/docs/{{version}}/starter-kits)之一。

<a name="laravel-the-api-backend"></a>
### Laravel 作为 API 后端

Laravel 也可以作为 JavaScript 单页应用或移动应用的 API 后端。例如，你可以将 Laravel 用作 [Next.js](https://nextjs.org) 应用的 API 后端。在此场景下，你可以使用 Laravel 为应用提供[认证](/docs/{{version}}/sanctum)和数据存储/检索，同时利用 Laravel 的强大服务，如队列、邮件、通知等。

如果你计划以这种方式使用 Laravel，你可能需要查看我们关于[路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的文档。

> **Note**
> 需要为 Laravel 后端和 Next.js 前端搭建脚手架的起点？Laravel Breeze 提供了 [API 技术栈](/docs/{{version}}/starter-kits#breeze-and-next)以及 [Next.js 前端实现](https://github.com/laravel/breeze-next)，让你在几分钟内即可开始。
