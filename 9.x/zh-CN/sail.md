# Laravel Sail

- [简介](#introduction)
- [安装与设置](#installation)
    - [将 Sail 安装到现有应用程序](#installing-sail-into-existing-applications)
    - [配置 Shell 别名](#configuring-a-shell-alias)
- [启动与停止 Sail](#starting-and-stopping-sail)
- [执行命令](#executing-sail-commands)
    - [执行 PHP 命令](#executing-php-commands)
    - [执行 Composer 命令](#executing-composer-commands)
    - [执行 Artisan 命令](#executing-artisan-commands)
    - [执行 Node / NPM 命令](#executing-node-npm-commands)
- [与数据库交互](#interacting-with-sail-databases)
    - [MySQL](#mysql)
    - [Redis](#redis)
    - [MeiliSearch](#meilisearch)
- [文件存储](#file-storage)
- [运行测试](#running-tests)
    - [Laravel Dusk](#laravel-dusk)
- [预览电子邮件](#previewing-emails)
- [容器 CLI](#sail-container-cli)
- [PHP 版本](#sail-php-versions)
- [Node 版本](#sail-node-versions)
- [共享站点](#sharing-your-site)
- [使用 Xdebug 调试](#debugging-with-xdebug)
  - [Xdebug CLI 用法](#xdebug-cli-usage)
  - [Xdebug 浏览器用法](#xdebug-browser-usage)
- [自定义](#sail-customization)

<a name="introduction"></a>
## 简介

[Laravel Sail](https://github.com/laravel/sail) 是一个轻量级命令行接口，用于与 Laravel 默认的 Docker 开发环境交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用程序提供了很好的起点，无需具备 Docker 经验。

Sail 的核心是存储在项目根目录的 `docker-compose.yml` 文件和 `sail` 脚本。`sail` 脚本提供了带有便捷方法的 CLI，用于与 `docker-compose.yml` 文件定义的 Docker 容器交互。

Laravel Sail 支持 macOS、Linux 和 Windows（通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)）。

<a name="installation"></a>
## 安装与设置

Laravel Sail 会随所有新 Laravel 应用程序自动安装，因此你可以立即开始使用。要了解如何创建新 Laravel 应用程序，请查阅适用于你操作系统的 Laravel [安装文档](/docs/{{version}}/installation)。安装过程中，系统会询问你选择应用程序将交互的 Sail 支持服务。

<a name="installing-sail-into-existing-applications"></a>
### 将 Sail 安装到现有应用程序

如果你想在现有 Laravel 应用程序中使用 Sail，只需使用 Composer 包管理器安装 Sail。当然，这些步骤假设你现有的本地开发环境允许安装 Composer 依赖：

```shell
composer require laravel/sail --dev
```

安装 Sail 后，可以运行 `sail:install` Artisan 命令。此命令会将 Sail 的 `docker-compose.yml` 文件发布到应用程序根目录：

```shell
php artisan sail:install
```

最后，可以启动 Sail。要继续学习如何使用 Sail，请继续阅读本文档的其余部分：

```shell
./vendor/bin/sail up
```

<a name="adding-additional-services"></a>
#### 添加额外服务

如果想向现有 Sail 安装添加额外服务，可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

<a name="using-devcontainers"></a>
#### 使用 Devcontainers

如果你想在 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中开发，可以向 `sail:install` 命令提供 `--devcontainer` 选项。`--devcontainer` 选项将指示 `sail:install` 命令将默认 `.devcontainer/devcontainer.json ` 文件发布到应用程序根目录：

```shell
php artisan sail:install --devcontainer
```

<a name="configuring-a-shell-alias"></a>
### 配置 Shell 别名

默认情况下，使用所有新 Laravel 应用程序中包含的 `vendor/bin/sail` 脚本调用 Sail 命令：

```shell
./vendor/bin/sail up
```

但是，与其反复输入 `vendor/bin/sail` 来执行 Sail 命令，你可能希望配置一个 shell 别名，以便更轻松地执行 Sail 命令：

```shell
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

为确保此别名始终可用，可以将其添加到主目录中的 shell 配置文件（如 `~/.zshrc` 或 `~/.bashrc`），然后重启 shell。

配置 shell 别名后，只需输入 `sail` 即可执行 Sail 命令。本文档其余部分的示例假设你已配置此别名：

```shell
sail up
```

<a name="starting-and-stopping-sail"></a>
## 启动与停止 Sail

Laravel Sail 的 `docker-compose.yml` 文件定义了多种协同工作的 Docker 容器，帮助你构建 Laravel 应用程序。每个容器都是 `docker-compose.yml` 文件 `services` 配置中的一个条目。`laravel.test` 容器是主应用程序容器，将服务于你的应用程序。

启动 Sail 之前，应确保本地计算机上没有运行其他 Web 服务器或数据库。要启动应用程序 `docker-compose.yml` 文件中定义的所有 Docker 容器，应执行 `up` 命令：

```shell
sail up
```

要在后台启动所有 Docker 容器，可以以"分离"模式启动 Sail：

```shell
sail up -d
```

应用程序容器启动后，可以在 Web 浏览器中访问项目：http://localhost。

要停止所有容器，只需按 Control + C 停止容器执行。或者，如果容器在后台运行，可以使用 `stop` 命令：

```shell
sail stop
```

<a name="executing-sail-commands"></a>
## 执行命令

使用 Laravel Sail 时，应用程序在 Docker 容器内执行，与本地计算机隔离。但是，Sail 提供了便捷的方式对应用程序运行各种命令，如任意 PHP 命令、Artisan 命令、Composer 命令和 Node / NPM 命令。

**阅读 Laravel 文档时，你经常会看到对 Composer、Artisan 和 Node / NPM 命令的引用，这些引用未提及 Sail。** 这些示例假设这些工具安装在本地计算机上。如果你使用 Sail 作为本地 Laravel 开发环境，应使用 Sail 执行这些命令：

```shell
# 本地运行 Artisan 命令...
php artisan queue:work

# 在 Laravel Sail 中运行 Artisan 命令...
sail artisan queue:work
```

<a name="executing-php-commands"></a>
### 执行 PHP 命令

可以使用 `php` 命令执行 PHP 命令。当然，这些命令将使用为应用程序配置的 PHP 版本执行。要了解有关 Laravel Sail 可用 PHP 版本的更多信息，请查阅 [PHP 版本文档](#sail-php-versions)：

```shell
sail php --version

sail php script.php
```

<a name="executing-composer-commands"></a>
### 执行 Composer 命令

可以使用 `composer` 命令执行 Composer 命令。Laravel Sail 的应用程序容器包含 Composer 2.x 安装：

```nothing
sail composer require laravel/sanctum
```

<a name="installing-composer-dependencies-for-existing-projects"></a>
#### 为现有应用程序安装 Composer 依赖

如果你与团队一起开发应用程序，可能不是你最初创建了 Laravel 应用程序。因此，将应用程序仓库克隆到本地计算机后，应用程序的 Composer 依赖（包括 Sail）都不会安装。

可以通过导航到应用程序目录并执行以下命令来安装应用程序的依赖。此命令使用包含 PHP 和 Composer 的小型 Docker 容器来安装应用程序的依赖：

```shell
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    composer install --ignore-platform-reqs
```

使用 `laravelsail/phpXX-composer` 镜像时，应使用与应用程序计划使用的相同 PHP 版本（`74`、`80`、`81` 或 `82`）。

<a name="executing-artisan-commands"></a>
### 执行 Artisan 命令

可以使用 `artisan` 命令执行 Laravel Artisan 命令：

```shell
sail artisan queue:work
```

<a name="executing-node-npm-commands"></a>
### 执行 Node / NPM 命令

可以使用 `node` 命令执行 Node 命令，使用 `npm` 命令执行 NPM 命令：

```shell
sail node --version

sail npm run dev
```

如果需要，可以使用 Yarn 代替 NPM：

```shell
sail yarn
```

<a name="interacting-with-sail-databases"></a>
## 与数据库交互

<a name="mysql"></a>
### MySQL

你可能已经注意到，应用程序的 `docker-compose.yml` 文件包含 MySQL 容器条目。此容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止和重启容器，数据库中存储的数据也会持久化。

此外，MySQL 容器首次启动时会为你创建两个数据库。第一个数据库使用 `DB_DATABASE` 环境变量的值命名，用于本地开发。第二个是专用的测试数据库，名为 `testing`，可确保测试不会干扰开发数据。

启动容器后，可以通过在应用程序 `.env` 文件中将 `DB_HOST` 环境变量设置为 `mysql` 来连接应用程序内的 MySQL 实例。

要从本地计算机连接应用程序的 MySQL 数据库，可以使用图形数据库管理应用程序（如 [TablePlus](https://tableplus.com)）。默认情况下，MySQL 数据库可在 `localhost` 端口 3306 访问，访问凭据对应 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值。或者，可以以 `root` 用户连接，其密码也使用 `DB_PASSWORD` 环境变量的值。

<a name="redis"></a>
### Redis

应用程序的 `docker-compose.yml` 文件还包含 [Redis](https://redis.io) 容器条目。此容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止和重启容器，Redis 中存储的数据也会持久化。启动容器后，可以通过在应用程序 `.env` 文件中将 `REDIS_HOST` 环境变量设置为 `redis` 来连接应用程序内的 Redis 实例。

要从本地计算机连接应用程序的 Redis 数据库，可以使用图形数据库管理应用程序（如 [TablePlus](https://tableplus.com)）。默认情况下，Redis 数据库可在 `localhost` 端口 6379 访问。

<a name="meilisearch"></a>
### MeiliSearch

如果在安装 Sail 时选择安装 [MeiliSearch](https://www.meilisearch.com) 服务，应用程序的 `docker-compose.yml` 文件将包含此强大搜索引擎的条目，它与 [Laravel Scout](/docs/{{version}}/scout)[兼容](https://github.com/meilisearch/meilisearch-laravel-scout)。启动容器后，可以通过将 `MEILISEARCH_HOST` 环境变量设置为 `http://meilisearch:7700` 来连接应用程序内的 MeiliSearch 实例。

从本地计算机，可以在 Web 浏览器中导航到 `http://localhost:7700` 访问 MeiliSearch 的基于 Web 的管理面板。

<a name="file-storage"></a>
## 文件存储

如果你计划在生产环境中运行应用程序时使用 Amazon S3 存储文件，可能希望在安装 Sail 时安装 [MinIO](https://min.io) 服务。MinIO 提供与 S3 兼容的 API，可用于使用 Laravel `s3` 文件存储驱动在本地开发，而无需在生产 S3 环境中创建"测试"存储桶。如果在安装 Sail 时选择安装 MinIO，应用程序的 `docker-compose.yml` 文件中将添加 MinIO 配置部分。

默认情况下，应用程序的 `filesystems` 配置文件已包含 `s3` 磁盘的磁盘配置。除了使用此磁盘与 Amazon S3 交互外，还可以通过修改控制其配置的相关环境变量，将其用于与任何 S3 兼容的文件存储服务（如 MinIO）交互。例如，使用 MinIO 时，文件系统环境变量配置应定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

为使 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，应定义 `AWS_URL` 环境变量，使其匹配应用程序的本地 URL 并在 URL 路径中包含桶名称：

```ini
AWS_URL=http://localhost:9000/local
```

可以通过 MinIO 控制台创建桶，控制台位于 `http://localhost:8900`。MinIO 控制台的默认用户名为 `sail`，默认密码为 `password`。

> **Warning**  
> 使用 MinIO 时不支持通过 `temporaryUrl` 方法生成临时存储 URL。

<a name="running-tests"></a>
## 运行测试

Laravel 开箱即用提供了出色的测试支持，你可以使用 Sail 的 `test` 命令运行应用程序的[功能和单元测试](/docs/{{version}}/testing)。PHPUnit 接受的任何 CLI 选项也可传递给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail `test` 命令等同于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 会创建专用的 `testing` 数据库，以确保测试不会干扰数据库的当前状态。在默认 Laravel 安装中，Sail 还会配置 `phpunit.xml` 文件在执行测试时使用此数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

<a name="laravel-dusk"></a>
### Laravel Dusk

[Laravel Dusk](/docs/{{version}}/dusk) 提供了富有表现力、易于使用的浏览器自动化和测试 API。得益于 Sail，你无需在本地计算机上安装 Selenium 或其他工具即可运行这些测试。首先，取消注释应用程序 `docker-compose.yml` 文件中的 Selenium 服务：

```yaml
selenium:
    image: 'selenium/standalone-chrome'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

接下来，确保应用程序 `docker-compose.yml` 文件中的 `laravel.test` 服务有 `selenium` 的 `depends_on` 条目：

```yaml
depends_on:
    - mysql
    - redis
    - selenium
```

最后，可以通过启动 Sail 并运行 `dusk` 命令来运行 Dusk 测试套件：

```shell
sail dusk
```

<a name="selenium-on-apple-silicon"></a>
#### Apple Silicon 上的 Selenium

如果本地计算机包含 Apple Silicon 芯片，`selenium` 服务必须使用 `seleniarm/standalone-chromium` 镜像：

```yaml
selenium:
    image: 'seleniarm/standalone-chromium'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

<a name="previewing-emails"></a>
## 预览电子邮件

Laravel Sail 的默认 `docker-compose.yml` 文件包含 [Mailpit](https://github.com/axllent/mailpit) 服务条目。Mailpit 在本地开发期间拦截应用程序发送的电子邮件，并提供便捷的 Web 界面，以便在浏览器中预览电子邮件。使用 Sail 时，Mailpit 的默认主机为 `mailpit`，通过端口 1025 可用：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

Sail 运行时，可以在以下地址访问 Mailpit Web 界面：http://localhost:8025

<a name="sail-container-cli"></a>
## 容器 CLI

有时你可能希望在应用程序容器内启动 Bash 会话。可以使用 `shell` 命令连接到应用程序容器，允许你检查其文件和已安装服务，以及在容器内执行任意 shell 命令：

```shell
sail shell

sail root-shell
```

要启动新的 [Laravel Tinker](https://github.com/laravel/tinker) 会话，可以执行 `tinker` 命令：

```shell
sail tinker
```

<a name="sail-php-versions"></a>
## PHP 版本

Sail 目前支持通过 PHP 8.2、8.1、PHP 8.0 或 PHP 7.4 服务应用程序。Sail 使用的默认 PHP 版本目前为 PHP 8.2。要更改用于服务应用程序的 PHP 版本，应更新应用程序 `docker-compose.yml` 文件中 `laravel.test` 容器的 `build` 定义：

```yaml
# PHP 8.2
context: ./vendor/laravel/sail/runtimes/8.2

# PHP 8.1
context: ./vendor/laravel/sail/runtimes/8.1

# PHP 8.0
context: ./vendor/laravel/sail/runtimes/8.0

# PHP 7.4
context: ./vendor/laravel/sail/runtimes/7.4
```

此外，你可能希望更新 `image` 名称以反映应用程序使用的 PHP 版本。此选项也定义在应用程序的 `docker-compose.yml` 文件中：

```yaml
image: sail-8.1/app
```

更新应用程序的 `docker-compose.yml` 文件后，应重新构建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sail-node-versions"></a>
## Node 版本

Sail 默认安装 Node 18。要更改构建镜像时安装的 Node 版本，可以更新应用程序 `docker-compose.yml` 文件中 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        NODE_VERSION: '14'
```

更新应用程序的 `docker-compose.yml` 文件后，应重新构建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sharing-your-site"></a>
## 共享站点

有时你可能需要公开共享站点，以便为同事预览站点或测试与应用程序的 webhook 集成。要共享站点，可以使用 `share` 命令。执行此命令后，你将获得一个随机 `laravel-sail.site` URL，可用于访问应用程序：

```shell
sail share
```

通过 `share` 命令共享站点时，应在 `TrustProxies` 中间件中配置应用程序的受信任代理。否则，`url` 和 `route` 等 URL 生成辅助函数将无法确定 URL 生成期间应使用的正确 HTTP 主机：

```php
/**
 * 此应用程序的受信任代理。
 *
 * @var array|string|null
 */
protected $proxies = '*';
```

如果想为共享站点选择子域，可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> **Note**  
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 驱动，这是 [BeyondCode](https://beyondco.de) 的开源隧道服务。

<a name="debugging-with-xdebug"></a>
## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置支持 [Xdebug](https://xdebug.org/)，这是一个流行且强大的 PHP 调试器。要启用 Xdebug，需要在应用程序 `.env` 文件中添加几个变量来[配置 Xdebug](https://xdebug.org/docs/step_debug#mode)。启用 Xdebug 必须在启动 Sail 之前设置适当的模式：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

#### Linux 主机 IP 配置

在内部，`XDEBUG_CONFIG` 环境变量定义为 `client_host=host.docker.internal`，以便为 Mac 和 Windows（WSL2）正确配置 Xdebug。如果本地计算机运行 Linux，应确保运行 Docker Engine 17.06.0+ 和 Compose 1.16.0+。否则，需要手动定义此环境变量，如下所示。

首先，应通过运行以下命令确定要添加到环境变量的正确主机 IP 地址。通常，`<container-name>` 应为服务于应用程序的容器名称，通常以 `_laravel.test_1` 结尾：

```shell
docker inspect -f {{range.NetworkSettings.Networks}}{{.Gateway}}{{end}} <container-name>
```

获取正确的主机 IP 地址后，应在应用程序 `.env` 文件中定义 `SAIL_XDEBUG_CONFIG` 变量：

```ini
SAIL_XDEBUG_CONFIG="client_host=<host-ip-address>"
```

<a name="xdebug-cli-usage"></a>
### Xdebug CLI 用法

可以使用 `sail debug` 命令在运行 Artisan 命令时启动调试会话：

```shell
# 不使用 Xdebug 运行 Artisan 命令...
sail artisan migrate

# 使用 Xdebug 运行 Artisan 命令...
sail debug migrate
```

<a name="xdebug-browser-usage"></a>
### Xdebug 浏览器用法

要通过 Web 浏览器与应用程序交互时调试应用程序，请按照 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application)从 Web 浏览器启动 Xdebug 会话。

如果你使用 PhpStorm，请查阅 JetBrains 关于[零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html)的文档。

> **Warning**  
> Laravel Sail 依赖 `artisan serve` 来服务应用程序。`artisan serve` 命令仅在 Laravel 8.53.0 版本起才接受 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。Laravel 旧版本（8.52.0 及以下）不支持这些变量，不接受调试连接。

<a name="sail-customization"></a>
## 自定义

由于 Sail 只是 Docker，你可以自由地自定义几乎一切。要发布 Sail 自己的 Dockerfile，可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

运行此命令后，Laravel Sail 使用的 Dockerfile 和其他配置文件将放置在应用程序根目录的 `docker` 目录中。自定义 Sail 安装后，你可能希望更改应用程序 `docker-compose.yml` 文件中应用程序容器的镜像名称。完成后，使用 `build` 命令重新构建应用程序容器。如果在单台机器上使用 Sail 开发多个 Laravel 应用程序，为应用程序镜像分配唯一名称尤为重要：

```shell
sail build --no-cache
```
