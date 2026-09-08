# Laravel Sail

- [简介](#introduction)
- [安装与设置](#installation)
    - [在已有应用中安装 Sail](#installing-sail-into-existing-applications)
    - [重建 Sail 镜像](#rebuilding-sail-images)
    - [配置 Shell 别名](#configuring-a-shell-alias)
- [启动与停止 Sail](#starting-and-stopping-sail)
- [执行命令](#executing-sail-commands)
    - [执行 PHP 命令](#executing-php-commands)
    - [执行 Composer 命令](#executing-composer-commands)
    - [执行 Artisan 命令](#executing-artisan-commands)
    - [执行 Node / NPM 命令](#executing-node-npm-commands)
- [与数据库交互](#interacting-with-sail-databases)
    - [MySQL](#mysql)
    - [MongoDB](#mongodb)
    - [Redis](#redis)
    - [Valkey](#valkey)
    - [Meilisearch](#meilisearch)
    - [Typesense](#typesense)
- [文件存储](#file-storage)
- [运行测试](#running-tests)
    - [Laravel Dusk](#laravel-dusk)
- [预览邮件](#previewing-emails)
- [容器 CLI](#sail-container-cli)
- [PHP 版本](#sail-php-versions)
- [Node 版本](#sail-node-versions)
- [共享站点](#sharing-your-site)
- [使用 Xdebug 调试](#debugging-with-xdebug)
  - [Xdebug 命令行用法](#xdebug-cli-usage)
  - [Xdebug 浏览器用法](#xdebug-browser-usage)
- [自定义](#sail-customization)

<a name="introduction"></a>
## 简介

[Laravel Sail](https://github.com/laravel/sail) 是一个轻量级命令行接口，用于与 Laravel 默认的 Docker 开发环境交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用提供了一个绝佳的起点，无需事先具备 Docker 经验。

Sail 的核心是存储在项目根目录下的 `compose.yaml` 文件和 `sail` 脚本。`sail` 脚本提供了一个 CLI，其中包含与 `compose.yaml` 文件所定义 Docker 容器交互的便捷方法。

Laravel Sail 支持 macOS、Linux 和 Windows（通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)）。

<a name="installation"></a>
## 安装与设置

所有新建的 Laravel 应用都会自动安装 Laravel Sail，因此你可以立即开始使用它。

<a name="installing-sail-into-existing-applications"></a>
### 在已有应用中安装 Sail

如果你想在已有的 Laravel 应用中使用 Sail，只需使用 Composer 包管理器安装 Sail 即可。当然，这些步骤假设你现有的本地开发环境允许你安装 Composer 依赖：

```shell
composer require laravel/sail --dev
```

安装 Sail 之后，你可以运行 `sail:install` Artisan 命令。该命令会将 Sail 的 `compose.yaml` 文件发布到应用根目录，并修改你的 `.env` 文件、写入连接 Docker 服务所需的环境变量：

```shell
php artisan sail:install
```

最后，你就可以启动 Sail 了。要继续学习如何使用 Sail，请继续阅读本文档的其余部分：

```shell
./vendor/bin/sail up
```

> [!WARNING]
> 如果你使用的是 Docker Desktop for Linux，应执行命令 `docker context use default` 来使用 `default` Docker 上下文。此外，如果你在容器内遇到文件权限错误，可能需要将 `SUPERVISOR_PHP_USER` 环境变量设置为 `root`。

<a name="adding-additional-services"></a>
#### 添加额外服务

如果你想为现有的 Sail 安装添加额外的服务，可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

<a name="using-devcontainers"></a>
#### 使用 Devcontainers

如果你想 在 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中进行开发，可以为 `sail:install` 命令提供 `--devcontainer` 选项。`--devcontainer` 选项会让 `sail:install` 命令将一个默认的 `.devcontainer/devcontainer.json ` 文件发布到应用根目录：

```shell
php artisan sail:install --devcontainer
```

<a name="rebuilding-sail-images"></a>
### 重建 Sail 镜像

有时你可能希望完全重建 Sail 镜像，以确保镜像中的所有软件包和软件都是最新的。你可以使用 `build` 命令来完成：

```shell
docker compose down -v

sail build --no-cache

sail up
```

<a name="configuring-a-shell-alias"></a>
### 配置 Shell 别名

默认情况下，Sail 命令通过所有新建 Laravel 应用都自带的 `vendor/bin/sail` 脚本来调用：

```shell
./vendor/bin/sail up
```

不过，与其反复输入 `vendor/bin/sail` 来执行 Sail 命令，你或许更愿意配置一个 shell 别名，以便更轻松地执行 Sail 的命令：

```shell
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

为了确保该别名始终可用，你可以把它添加到主目录下的 shell 配置文件中，例如 `~/.zshrc` 或 `~/.bashrc`，然后重启 shell。

配置好 shell 别名后，你只需输入 `sail` 即可执行 Sail 命令。本文档后续的示例都将假设你已经配置了这个别名：

```shell
sail up
```

<a name="starting-and-stopping-sail"></a>
## 启动与停止 Sail

Laravel Sail 的 `compose.yaml` 文件定义了多个协同工作的 Docker 容器，帮助你构建 Laravel 应用。其中每个容器都是 `compose.yaml` 文件 `services` 配置中的一个条目。`laravel.test` 容器是主应用容器，它将为你提供应用服务。

启动 Sail 之前，你应确保本地计算机上没有运行其他 Web 服务器或数据库。要启动应用 `compose.yaml` 文件中定义的所有 Docker 容器，应执行 `up` 命令：

```shell
sail up
```

要在后台启动所有 Docker 容器，可以「分离」模式启动 Sail：

```shell
sail up -d
```

应用的容器启动后，你可以在浏览器中访问 http://localhost 来打开项目。

要停止所有容器，只需按下 Control + C 即可停止容器运行。或者，如果容器正在后台运行，你可以使用 `stop` 命令：

```shell
sail stop
```

<a name="executing-sail-commands"></a>
## 执行命令

使用 Laravel Sail 时，你的应用运行在 Docker 容器中，与本地计算机相互隔离。不过，Sail 提供了一种便捷的方式来对应用运行各种命令，例如任意 PHP 命令、Artisan 命令、Composer 命令以及 Node / NPM 命令。

**在阅读 Laravel 文档时，你经常会看到提及 Composer、Artisan 和 Node / NPM 命令但没有提到 Sail 的地方。**那些示例假设这些工具安装在本地计算机上。如果你在本地 Laravel 开发环境中使用 Sail，则应通过 Sail 来执行这些命令：

```shell
# 在本地运行 Artisan 命令……
php artisan queue:work

# 在 Laravel Sail 中运行 Artisan 命令……
sail artisan queue:work
```

<a name="executing-php-commands"></a>
### 执行 PHP 命令

PHP 命令可以通过 `php` 命令来执行。当然，这些命令将使用为你的应用配置的 PHP 版本来运行。要详细了解 Laravel Sail 可用的 PHP 版本，请查阅 [PHP 版本文档](#sail-php-versions)：

```shell
sail php --version

sail php script.php
```

<a name="executing-composer-commands"></a>
### 执行 Composer 命令

Composer 命令可以通过 `composer` 命令来执行。Laravel Sail 的应用容器中已包含 Composer 安装：

```shell
sail composer require laravel/sanctum
```

<a name="executing-artisan-commands"></a>
### 执行 Artisan 命令

Laravel Artisan 命令可以通过 `artisan` 命令来执行：

```shell
sail artisan queue:work
```

<a name="executing-node-npm-commands"></a>
### 执行 Node / NPM 命令

Node 命令可以通过 `node` 命令来执行，而 NPM 命令可以通过 `npm` 命令来执行：

```shell
sail node --version

sail npm run dev
```

如果你愿意，也可以使用 Yarn 来代替 NPM：

```shell
sail yarn
```

<a name="interacting-with-sail-databases"></a>
## 与数据库交互

<a name="mysql"></a>
### MySQL

你可能已经注意到，应用的 `compose.yaml` 文件中包含一个 MySQL 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，数据库中存储的数据也会持久保留。

此外，MySQL 容器首次启动时会为你创建两个数据库。第一个数据库以 `DB_DATABASE` 环境变量的值命名，用于本地开发。第二个是名为 `testing` 的专用测试数据库，可确保你的测试不会干扰开发数据。

容器启动后，你可以将应用 `.env` 文件中的 `DB_HOST` 环境变量设置为 `mysql`，从而在应用中连接到 MySQL 实例。

要从本地计算机连接到应用的 MySQL 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，MySQL 数据库可通过 `localhost` 的 3306 端口访问，访问凭据与 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值一致。或者，你也可以以 `root` 用户身份连接，其密码同样使用 `DB_PASSWORD` 环境变量的值。

<a name="mongodb"></a>
### MongoDB

如果你在安装 Sail 时选择安装 [MongoDB](https://www.mongodb.com/) 服务，应用的 `compose.yaml` 文件中会包含一个 [MongoDB Atlas Local](https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-local-cloud/) 容器的条目。该容器提供 MongoDB 文档数据库，并带有 [Search Indexes](https://www.mongodb.com/docs/atlas/atlas-search/) 等 Atlas 特性。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，数据库中存储的数据也会持久保留。

容器启动后，你可以将应用 `.env` 文件中的 `MONGODB_URI` 环境变量设置为 `mongodb://mongodb:27017`，从而在应用中连接到 MongoDB 实例。默认情况下不启用身份验证，但你可以在启动 `mongodb` 容器之前设置 `MONGODB_USERNAME` 和 `MONGODB_PASSWORD` 环境变量来启用身份验证。然后，将凭据添加到连接字符串中：

```ini
MONGODB_USERNAME=user
MONGODB_PASSWORD=laravel
MONGODB_URI=mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@mongodb:27017
```

为了将 MongoDB 与你的应用无缝集成，你可以安装 [由 MongoDB 官方维护的扩展包](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/)。

要从本地计算机连接到应用的 MongoDB 数据库，你可以使用图形化界面工具，例如 [Compass](https://www.mongodb.com/products/tools/compass)。默认情况下，MongoDB 数据库可通过 `localhost` 的 `27017` 端口访问。

<a name="redis"></a>
### Redis

应用的 `compose.yaml` 文件中还包含一个 [Redis](https://redis.io) 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，Redis 实例中存储的数据也会持久保留。容器启动后，你可以将应用 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `redis`，从而在应用中连接到 Redis 实例。

要从本地计算机连接到应用的 Redis 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Redis 数据库可通过 `localhost` 的 6379 端口访问。

<a name="valkey"></a>
### Valkey

如果你在安装 Sail 时选择安装 Valkey 服务，应用的 `compose.yaml` 文件中会包含 [Valkey](https://valkey.io/) 的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，Valkey 实例中存储的数据也会持久保留。你可以将应用 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `valkey`，从而在应用中连接到该容器。

要从本地计算机连接到应用的 Valkey 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Valkey 数据库可通过 `localhost` 的 6379 端口访问。

<a name="meilisearch"></a>
### Meilisearch

如果你在安装 Sail 时选择安装 [Meilisearch](https://www.meilisearch.com) 服务，应用的 `compose.yaml` 文件中会包含这个强大搜索引擎的条目，它与 [Laravel Scout](/docs/{{version}}/scout) 集成。容器启动后，你可以将 `MEILISEARCH_HOST` 环境变量设置为 `http://meilisearch:7700`，从而在应用中连接到 Meilisearch 实例。

在本地计算机上，你可以在浏览器中访问 `http://localhost:7700`，进入 Meilisearch 的网页版管理面板。

<a name="typesense"></a>
### Typesense

如果你在安装 Sail 时选择安装 [Typesense](https://typesense.org) 服务，应用的 `compose.yaml` 文件中会包含这个极速开源搜索引擎的条目，它与 [Laravel Scout](/docs/{{version}}/scout#typesense) 原生集成。容器启动后，你可以设置以下环境变量，从而在应用中连接到 Typesense 实例：

```ini
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

在本地计算机上，你可以通过 `http://localhost:8108` 访问 Typesense 的 API。

<a name="file-storage"></a>
## 文件存储

如果你计划在应用的生产环境中运行时使用 Amazon S3 存储文件，可以在安装 Sail 时选择安装 [RustFS](https://rustfs.com) 服务。RustFS 提供与 S3 兼容的 API，让你能够在本地使用 Laravel 的 `s3` 文件存储驱动进行开发，而无需在生产 S3 环境中创建「测试」存储桶。如果你在安装 Sail 时选择安装 RustFS，应用的 `compose.yaml` 文件中会添加一个 RustFS 配置段。

默认情况下，应用的 `filesystems` 配置文件中已经包含 `s3` 磁盘的磁盘配置。除了使用该磁盘与 Amazon S3 交互之外，你只需修改控制其配置的相关环境变量，就可以用它与任何 S3 兼容的文件存储服务（例如 RustFS）交互。例如，使用 RustFS 时，你的文件系统环境变量配置应定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://rustfs:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

<a name="running-tests"></a>
## 运行测试

Laravel 开箱即用地提供了出色的测试支持，你可以使用 Sail 的 `test` 命令来运行应用的[功能测试和单元测试](/docs/{{version}}/testing)。Pest / PHPUnit 接受的任何 CLI 选项也都可以传递给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail 的 `test` 命令等同于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 会创建一个专用的 `testing` 数据库，以免你的测试干扰数据库的当前状态。在默认的 Laravel 安装中，Sail 还会配置你的 `phpunit.xml` 文件，使其在执行测试时使用该数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

<a name="laravel-dusk"></a>
### Laravel Dusk

[Laravel Dusk](/docs/{{version}}/dusk) 提供了一套富有表现力、易于使用的浏览器自动化与测试 API。得益于 Sail，你无需在本地计算机上安装 Selenium 或其他工具即可运行这些测试。首先，请取消应用 `compose.yaml` 文件中 Selenium 服务的注释：

```yaml
selenium:
    image: 'selenium/standalone-chrome'
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

接着，确保应用 `compose.yaml` 文件中的 `laravel.test` 服务包含对 `selenium` 的 `depends_on` 条目：

```yaml
depends_on:
    - mysql
    - redis
    - selenium
```

最后，启动 Sail 并运行 `dusk` 命令，即可运行你的 Dusk 测试套件：

```shell
sail dusk
```

<a name="selenium-on-apple-silicon"></a>
#### Apple Silicon 上的 Selenium

如果你的本地计算机使用 Apple Silicon 芯片，你的 `selenium` 服务必须使用 `selenium/standalone-chromium` 镜像：

```yaml
selenium:
    image: 'selenium/standalone-chromium'
    extra_hosts:
        - 'host.docker.internal:host-gateway'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

<a name="previewing-emails"></a>
## 预览邮件

Laravel Sail 的默认 `compose.yaml` 文件包含 [Mailpit](https://github.com/axllent/mailpit) 的服务条目。Mailpit 会在本地开发过程中拦截应用发送的邮件，并提供一个便捷的 Web 界面，让你可以在浏览器中预览邮件内容。使用 Sail 时，Mailpit 的默认主机为 `mailpit`，可通过 1025 端口访问：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

Sail 运行时，你可以通过 http://localhost:8025 访问 Mailpit 的 Web 界面。

<a name="sail-container-cli"></a>
## 容器 CLI

有时你可能希望在应用的容器中启动一个 Bash 会话。你可以使用 `shell` 命令连接到应用的容器，从而查看其中的文件和已安装的服务，以及在容器内执行任意 shell 命令：

```shell
sail shell

sail root-shell
```

要启动一个新的 [Laravel Tinker](https://github.com/laravel/tinker) 会话，可以执行 `tinker` 命令：

```shell
sail tinker
```

<a name="sail-php-versions"></a>
## PHP 版本

目前，Sail 支持通过 PHP 8.5、8.4、8.3、8.2、8.1 或 PHP 8.0 来提供应用服务。Sail 默认使用的 PHP 版本目前是 PHP 8.5。要更改用于提供应用服务的 PHP 版本，你应更新应用 `compose.yaml` 文件中 `laravel.test` 容器的 `build` 定义：

```yaml
# PHP 8.5
context: ./vendor/laravel/sail/runtimes/8.5

# PHP 8.4
context: ./vendor/laravel/sail/runtimes/8.4

# PHP 8.3
context: ./vendor/laravel/sail/runtimes/8.3

# PHP 8.2
context: ./vendor/laravel/sail/runtimes/8.2

# PHP 8.1
context: ./vendor/laravel/sail/runtimes/8.1

# PHP 8.0
context: ./vendor/laravel/sail/runtimes/8.0
```

此外，你可能希望更新 `image` 名称，以反映应用所使用的 PHP 版本。该选项同样定义在应用的 `compose.yaml` 文件中：

```yaml
image: sail-8.2/app
```

更新应用的 `compose.yaml` 文件后，你应重建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sail-node-versions"></a>
## Node 版本

Sail 默认安装 Node 22。要更改构建镜像时安装的 Node 版本，你可以更新应用 `compose.yaml` 文件中 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        NODE_VERSION: '18'
```

更新应用的 `compose.yaml` 文件后，你应重建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sharing-your-site"></a>
## 共享站点

有时你可能需要公开共享你的站点，以便为同事预览站点，或测试与应用的 webhook 集成。要共享站点，你可以使用 `share` 命令。执行该命令后，你会获得一个随机的 `laravel-sail.site` URL，可用于访问你的应用：

```shell
sail share
```

通过 `share` 命令共享站点时，你应使用应用 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法来配置应用的信任代理。否则，`url` 和 `route` 等 URL 生成辅助函数将无法确定 URL 生成时应使用的正确 HTTP 主机：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

如果你想为共享的站点选择子域名，可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> [!NOTE]
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 驱动，这是 [BeyondCode](https://beyondco.de) 提供的开源隧道服务。

<a name="debugging-with-xdebug"></a>
## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置包含对 [Xdebug](https://xdebug.org/) 的支持。Xdebug 是一款广受欢迎且功能强大的 PHP 调试器。要启用 Xdebug，请确保你已经[发布了 Sail 配置](#sail-customization)。然后，将以下变量添加到应用的 `.env` 文件中，以配置 Xdebug：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

接下来，确保你发布的 `php.ini` 文件包含以下配置，以便 Xdebug 以指定模式激活：

```ini
[xdebug]
xdebug.mode=${XDEBUG_MODE}
```

修改 `php.ini` 文件后，请记得重建 Docker 镜像，使你对 `php.ini` 文件的修改生效：

```shell
sail build --no-cache
```

#### Linux 主机 IP 配置

在内部，`XDEBUG_CONFIG` 环境变量被定义为 `client_host=host.docker.internal`，以便为 Mac 和 Windows（WSL2）正确配置 Xdebug。如果你的本地计算机运行的是 Linux 并且使用 Docker 20.10+，则 `host.docker.internal` 可用，无需手动配置。

对于低于 20.10 的 Docker 版本，Linux 不支持 `host.docker.internal`，你需要手动定义主机 IP。为此，你可以在 `compose.yaml` 文件中定义一个自定义网络，为容器配置静态 IP：

```yaml
networks:
  custom_network:
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  laravel.test:
    networks:
      custom_network:
        ipv4_address: 172.20.0.2
```

设置好静态 IP 后，在应用的 .env 文件中定义 SAIL_XDEBUG_CONFIG 变量：

```ini
SAIL_XDEBUG_CONFIG="client_host=172.20.0.2"
```

<a name="xdebug-cli-usage"></a>
### Xdebug 命令行用法

在运行 Artisan 命令时，可以使用 `sail debug` 命令来启动调试会话：

```shell
# 运行不带 Xdebug 的 Artisan 命令……
sail artisan migrate

# 运行带 Xdebug 的 Artisan 命令……
sail debug migrate
```

<a name="xdebug-browser-usage"></a>
### Xdebug 浏览器用法

要在通过浏览器与应用交互时调试应用，请按照 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application)，从浏览器发起 Xdebug 会话。

如果你使用的是 PhpStorm，请查阅 JetBrains 关于[零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html)的文档。

> [!WARNING]
> Laravel Sail 依赖 `artisan serve` 来提供应用服务。从 Laravel 8.53.0 版本起，`artisan serve` 命令才支持 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。更早的 Laravel 版本（8.52.0 及以下）不支持这些变量，也不会接受调试连接。

<a name="sail-customization"></a>
## 自定义

由于 Sail 本质上就是 Docker，你几乎可以自由定制它的方方面面。要发布 Sail 自身的 Dockerfile，可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

运行该命令后，Laravel Sail 使用的 Dockerfile 及其他配置文件会被放置到应用根目录下的 `docker` 目录中。自定义 Sail 安装后，你可能希望更改应用 `compose.yaml` 文件中应用容器的镜像名称。随后，使用 `build` 命令重建应用的容器。如果你在同一台机器上使用 Sail 开发多个 Laravel 应用，为应用镜像分配唯一名称尤为重要：

```shell
sail build --no-cache
```
