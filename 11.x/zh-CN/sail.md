# Laravel Sail

- [简介](#introduction)
- [安装与配置](#installation)
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
- [共享你的站点](#sharing-your-site)
- [使用 Xdebug 调试](#debugging-with-xdebug)
  - [Xdebug 命令行用法](#xdebug-cli-usage)
  - [Xdebug 浏览器用法](#xdebug-browser-usage)
- [自定义](#sail-customization)

<a name="introduction"></a>
## 简介

[Laravel Sail](https://github.com/laravel/sail) 是一套轻量级的命令行界面，用于与 Laravel 默认的 Docker 开发环境交互。借助 Sail，你无需具备 Docker 使用经验，就能以 PHP、MySQL 和 Redis 为基础构建 Laravel 应用，拥有一个很好的起点。

Sail 的核心其实就是一个 `docker-compose.yml` 文件，以及存放在项目根目录的 `sail` 脚本。`sail` 脚本提供了一套 CLI，包含若干便捷方法，用于与 `docker-compose.yml` 文件中定义的 Docker 容器交互。

Laravel Sail 支持 macOS、Linux 和 Windows（通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)）。

<a name="installation"></a>
## 安装与配置

Laravel Sail 会随所有新建的 Laravel 应用自动安装，因此你可以立即开始使用。要了解如何创建新的 Laravel 应用，请查阅针对你操作系统的 Laravel [安装文档](/docs/{{version}}/installation#docker-installation-using-sail)。安装过程中，你会被告知选择应用要交互使用哪些受 Sail 支持的服务。

<a name="installing-sail-into-existing-applications"></a>
### 在已有应用中安装 Sail

如果你想在已有的 Laravel 应用中使用 Sail，只需通过 Composer 包管理器安装 Sail。当然，这些步骤的前提是你的本地开发环境允许你安装 Composer 依赖：

```shell
composer require laravel/sail --dev
```

Sail 安装完成后，你可以运行 `sail:install` Artisan 命令。该命令会把 Sail 的 `docker-compose.yml` 文件发布到应用根目录，并修改你的 `.env` 文件，加入连接 Docker 服务所需的环境变量：

```shell
php artisan sail:install
```

最后，你可以启动 Sail。要继续了解如何使用 Sail，请继续阅读本文档余下部分：

```shell
./vendor/bin/sail up
```

> [!WARNING]
> 如果你使用 Docker Desktop for Linux，应当执行以下命令以使用 `default` Docker 上下文：`docker context use default`。

<a name="adding-additional-services"></a>
#### 添加其他服务

如果你想在已有的 Sail 安装中添加其他服务，可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

<a name="using-devcontainers"></a>
#### 使用 Devcontainer

如果你想在 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中开发，可以向 `sail:install` 命令提供 `--devcontainer` 选项。`--devcontainer` 选项会指示 `sail:install` 命令把一个默认的 `.devcontainer/devcontainer.json ` 文件发布到应用根目录：

```shell
php artisan sail:install --devcontainer
```

<a name="rebuilding-sail-images"></a>
### 重建 Sail 镜像

有时你可能希望彻底重建 Sail 镜像，以确保镜像中的所有包和软件都是最新的。你可以使用 `build` 命令来实现：

```shell
docker compose down -v

sail build --no-cache

sail up
```

<a name="configuring-a-shell-alias"></a>
### 配置 Shell 别名

默认情况下，Sail 命令通过所有新 Laravel 应用都自带的 `vendor/bin/sail` 脚本调用：

```shell
./vendor/bin/sail up
```

不过，与其反复输入 `vendor/bin/sail` 来执行 Sail 命令，你可能更希望配置一个 shell 别名，以便更轻松地执行 Sail 的命令：

```shell
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

为确保该别名始终可用，你可以把它添加到 home 目录下的 shell 配置文件（例如 `~/.zshrc` 或 `~/.bashrc`）中，然后重启你的 shell。

配置好 shell 别名后，你只需输入 `sail` 即可执行 Sail 命令。本文档余下的示例都将假设你已经配置了该别名：

```shell
sail up
```

<a name="starting-and-stopping-sail"></a>
## 启动与停止 Sail

Laravel Sail 的 `docker-compose.yml` 文件定义了一系列协同工作的 Docker 容器，帮助你构建 Laravel 应用。其中每个容器都是 `docker-compose.yml` 文件 `services` 配置中的一项。`laravel.test` 容器是主应用容器，将为你的应用提供服务。

启动 Sail 之前，你应当确保本地计算机上没有运行其他 Web 服务器或数据库。要启动应用 `docker-compose.yml` 文件中定义的所有 Docker 容器，应当执行 `up` 命令：

```shell
sail up
```

要在后台启动所有 Docker 容器，可以以"分离"模式启动 Sail：

```shell
sail up -d
```

应用的容器启动后，你就可以在 Web 浏览器中通过 http://localhost 访问该项目。

要停止所有容器，你只需按 Control + C 即可终止容器的运行。或者，如果容器在后台运行，可以使用 `stop` 命令：

```shell
sail stop
```

<a name="executing-sail-commands"></a>
## 执行命令

使用 Laravel Sail 时，你的应用运行在 Docker 容器中，与本地计算机相互隔离。不过，Sail 提供了一种便捷方式，可以对你的应用运行各种命令，例如任意 PHP 命令、Artisan 命令、Composer 命令以及 Node / NPM 命令。

**在阅读 Laravel 文档时，你经常会看到没有提到 Sail 的 Composer、Artisan 和 Node / NPM 命令。** 这些示例假设这些工具已安装在你的本地计算机上。如果你在本地 Laravel 开发环境中使用 Sail，就应当通过 Sail 执行这些命令：

```shell
# Running Artisan commands locally...
php artisan queue:work

# Running Artisan commands within Laravel Sail...
sail artisan queue:work
```

<a name="executing-php-commands"></a>
### 执行 PHP 命令

PHP 命令可以通过 `php` 命令执行。当然，这些命令会使用为你的应用配置的 PHP 版本运行。要了解 Laravel Sail 支持哪些 PHP 版本，请查阅 [PHP 版本文档](#sail-php-versions)：

```shell
sail php --version

sail php script.php
```

<a name="executing-composer-commands"></a>
### 执行 Composer 命令

Composer 命令可以通过 `composer` 命令执行。Laravel Sail 的应用容器中已包含一份 Composer 安装：

```shell
sail composer require laravel/sanctum
```

<a name="installing-composer-dependencies-for-existing-projects"></a>
#### 为已有应用安装 Composer 依赖

如果你与团队一起开发应用，初始创建 Laravel 应用的人可能并不是你。因此，当你把应用仓库克隆到本地计算机后，该应用的任何 Composer 依赖（包括 Sail）都不会被安装。

你可以通过进入应用目录并执行以下命令来安装应用依赖。该命令使用一个包含 PHP 和 Composer 的小型 Docker 容器来安装应用依赖：

```shell
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
```

使用 `laravelsail/phpXX-composer` 镜像时，你应当使用计划为应用所用的同一 PHP 版本（`80`、`81`、`82`、`83` 或 `84`）。

<a name="executing-artisan-commands"></a>
### 执行 Artisan 命令

Laravel Artisan 命令可以通过 `artisan` 命令执行：

```shell
sail artisan queue:work
```

<a name="executing-node-npm-commands"></a>
### 执行 Node / NPM 命令

Node 命令可以通过 `node` 命令执行，NPM 命令则可以通过 `npm` 命令执行：

```shell
sail node --version

sail npm run dev
```

如果你愿意，也可以使用 Yarn 代替 NPM：

```shell
sail yarn
```

<a name="interacting-with-sail-databases"></a>
## 与数据库交互

<a name="mysql"></a>
### MySQL

你可能已经注意到，你的应用 `docker-compose.yml` 文件中包含一个 MySQL 容器条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使你停止并重新启动容器，数据库中存储的数据依然会保留。

此外，MySQL 容器首次启动时会为你创建两个数据库。第一个数据库以 `DB_DATABASE` 环境变量的值命名，供本地开发使用；第二个是名为 `testing` 的专用测试数据库，它能确保你的测试不会干扰开发数据。

启动容器后，你只需把应用 `.env` 文件中的 `DB_HOST` 环境变量设为 `mysql`，即可在应用内连接到 MySQL 实例。

要从本地机器连接应用的 MySQL 数据库，可以使用图形化的数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，MySQL 数据库可通过 `localhost` 的 3306 端口访问，访问凭据对应 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值。或者，你也可以使用 `root` 用户连接，其密码同样使用 `DB_PASSWORD` 环境变量的值。

<a name="mongodb"></a>
### MongoDB

如果你在安装 Sail 时选择了安装 [MongoDB](https://www.mongodb.com/) 服务，那么你的应用 `docker-compose.yml` 文件中会包含一个 [MongoDB Atlas Local](https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-local-cloud/) 容器条目，它提供 MongoDB 文档数据库，并带有 [Search Indexes](https://www.mongodb.com/docs/atlas/atlas-search/) 等 Atlas 特性。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使你停止并重新启动容器，数据库中存储的数据依然会保留。

启动容器后，你只需把应用 `.env` 文件中的 `MONGODB_URI` 环境变量设为 `mongodb://mongodb:27017`，即可在应用内连接到 MongoDB 实例。默认情况下认证是关闭的，但你可以在启动 `mongodb` 容器之前设置 `MONGODB_USERNAME` 和 `MONGODB_PASSWORD` 环境变量来启用认证，然后把凭据加入连接字符串：

```ini
MONGODB_USERNAME=user
MONGODB_PASSWORD=laravel
MONGODB_URI=mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@mongodb:27017
```

要实现 MongoDB 与应用的无缝集成，你可以安装[由 MongoDB 维护的官方包](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/)。

要从本地机器连接应用的 MongoDB 数据库，可以使用图形界面，例如 [Compass](https://www.mongodb.com/products/tools/compass)。默认情况下，MongoDB 数据库可通过 `localhost` 的 `27017` 端口访问。

<a name="redis"></a>
### Redis

你的应用 `docker-compose.yml` 文件中还包含一个 [Redis](https://redis.io) 容器条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使你停止并重新启动容器，Redis 实例中存储的数据依然会保留。启动容器后，你只需把应用 `.env` 文件中的 `REDIS_HOST` 环境变量设为 `redis`，即可在应用内连接到 Redis 实例。

要从本地机器连接应用的 Redis 数据库，可以使用图形化的数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Redis 数据库可通过 `localhost` 的 6379 端口访问。

<a name="valkey"></a>
### Valkey

如果你在安装 Sail 时选择了安装 Valkey 服务，那么你的应用 `docker-compose.yml` 文件中会包含一个 [Valkey](https://valkey.io/) 容器条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使你停止并重新启动容器，Valkey 实例中存储的数据依然会保留。你只需把应用 `.env` 文件中的 `REDIS_HOST` 环境变量设为 `valkey`，即可在应用中连接到该容器。

要从本地机器连接应用的 Valkey 数据库，可以使用图形化的数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Valkey 数据库可通过 `localhost` 的 6379 端口访问。

<a name="meilisearch"></a>
### Meilisearch

如果你在安装 Sail 时选择了安装 [Meilisearch](https://www.meilisearch.com) 服务，那么你的应用 `docker-compose.yml` 文件中会包含这个与 [Laravel Scout](/docs/{{version}}/scout)集成的强大搜索引擎条目。启动容器后，你只需把 `MEILISEARCH_HOST` 环境变量设为 `http://meilisearch:7700`，即可在应用内连接到 Meilisearch 实例。

从本地机器访问 Meilisearch 的 Web 管理面板，只需在 Web 浏览器中访问 `http://localhost:7700`。

<a name="typesense"></a>
### Typesense

如果你在安装 Sail 时选择了安装 [Typesense](https://typesense.org) 服务，那么你的应用 `docker-compose.yml` 文件中会包含这个与 [Laravel Scout](/docs/{{version}}/scout#typesense)原生集成的极速开源搜索引擎条目。启动容器后，你可以通过设置以下环境变量在应用内连接到 Typesense 实例：

```ini
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

从本地机器，你可以通过 `http://localhost:8108` 访问 Typesense 的 API。

<a name="file-storage"></a>
## 文件存储

如果你计划在生产环境运行时使用 Amazon S3 存储文件，那么在安装 Sail 时可能需要安装 [MinIO](https://min.io) 服务。MinIO 提供了一套兼容 S3 的 API，让你可以在本地使用 Laravel 的 `s3` 文件存储驱动进行开发，而无需在生产 S3 环境中创建"测试"存储桶。如果你在安装 Sail 时选择安装 MinIO，应用 `docker-compose.yml` 文件中会新增一个 MinIO 配置区块。

默认情况下，你的应用 `filesystems` 配置文件已经包含了一个 `s3` 磁盘配置。除了用该磁盘与 Amazon S3 交互之外，你还可以通过修改控制其配置的相关环境变量，直接用它来与任何兼容 S3 的文件存储服务（例如 MinIO）交互。例如，使用 MinIO 时，文件系统环境变量配置应当定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

为了让 Laravel 的 Flysystem 集成在使用 MinIO 时生成正确的 URL，你应当定义 `AWS_URL` 环境变量，使其与应用本地 URL 一致，并在 URL 路径中包含桶名：

```ini
AWS_URL=http://localhost:9000/local
```

你可以通过 MinIO 控制台创建桶，该控制台可通过 `http://localhost:8900` 访问。MinIO 控制台的默认用户名为 `sail`，默认密码为 `password`。

> [!WARNING]
> 使用 MinIO 时不支持通过 `temporaryUrl` 方法生成临时存储 URL。

<a name="running-tests"></a>
## 运行测试

Laravel 开箱即用地提供了出色的测试支持，你可以使用 Sail 的 `test` 命令来运行应用的[功能测试和单元测试](/docs/{{version}}/testing)。Pest / PHPUnit 接受的任何 CLI 选项也都可以传给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail 的 `test` 命令等价于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 会创建一个专用的 `testing` 数据库，以确保测试不会干扰数据库的当前状态。在默认的 Laravel 安装中，Sail 还会配置你的 `phpunit.xml` 文件，使其在执行测试时使用该数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

<a name="laravel-dusk"></a>
### Laravel Dusk

[Laravel Dusk](/docs/{{version}}/dusk) 提供了一套表达力强、易于使用的浏览器自动化与测试 API。借助 Sail，你无需在本地计算机上安装 Selenium 或其他工具即可运行这些测试。要开始使用，请在应用 `docker-compose.yml` 文件中取消 Selenium 服务的注释：

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

接下来，确保应用 `docker-compose.yml` 文件中的 `laravel.test` 服务有一个指向 `selenium` 的 `depends_on` 条目：

```yaml
depends_on:
    - mysql
    - redis
    - selenium
```

最后，你可以通过启动 Sail 并运行 `dusk` 命令来运行 Dusk 测试套件：

```shell
sail dusk
```

<a name="selenium-on-apple-silicon"></a>
#### Apple Silicon 上的 Selenium

如果你的本地机器使用 Apple Silicon 芯片，你的 `selenium` 服务必须使用 `selenium/standalone-chromium` 镜像：

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

Laravel Sail 默认的 `docker-compose.yml` 文件中包含一个 [Mailpit](https://github.com/axllent/mailpit) 服务条目。Mailpit 会拦截本地开发期间你的应用所发送的邮件，并提供一套便捷的 Web 界面，让你可以在浏览器中预览邮件内容。使用 Sail 时，Mailpit 的默认主机为 `mailpit`，可通过 1025 端口访问：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

Sail 运行时，你可以通过 http://localhost:8025 访问 Mailpit 的 Web 界面。

<a name="sail-container-cli"></a>
## 容器 CLI

有时你可能希望在应用的容器中启动一个 Bash 会话。你可以使用 `shell` 命令连接到应用容器，从而检查其中的文件和已安装服务，并在容器内执行任意 shell 命令：

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

Sail 目前支持通过 PHP 8.4、8.3、8.2、8.1 或 PHP 8.0 为你的应用提供服务。Sail 当前默认使用的 PHP 版本是 PHP 8.4。要更改用于为你的应用提供服务的 PHP 版本，应当更新应用 `docker-compose.yml` 文件中 `laravel.test` 容器的 `build` 定义：

```yaml
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

此外，你可能希望更新 `image` 名称，以反映你的应用所使用的 PHP 版本。该选项同样在你的应用 `docker-compose.yml` 文件中定义：

```yaml
image: sail-8.2/app
```

更新应用的 `docker-compose.yml` 文件后，应当重新构建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sail-node-versions"></a>
## Node 版本

Sail 默认安装 Node 20。要更改构建镜像时安装的 Node 版本，可以更新应用 `docker-compose.yml` 文件中 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        NODE_VERSION: '18'
```

更新应用的 `docker-compose.yml` 文件后，应当重新构建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sharing-your-site"></a>
## 共享你的站点

有时你可能需要公开共享自己的站点，以便为同事预览站点，或测试与你的应用之间的 Webhook 集成。要共享站点，可以使用 `share` 命令。执行该命令后，你会获得一个随机的 `laravel-sail.site` URL，可用它访问你的应用：

```shell
sail share
```

通过 `share` 命令共享站点时，你应当使用应用 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法配置应用的可信代理。否则，`url` 和 `route` 等 URL 生成辅助函数将无法在生成 URL 时确定正确使用的 HTTP 主机：

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
    })

如果你想为共享站点选择子域名，可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> [!NOTE]
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 提供支持，它是 [BeyondCode](https://beyondco.de) 打造的开源隧道服务。

<a name="debugging-with-xdebug"></a>
## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置包含对 [Xdebug](https://xdebug.org/) 的支持，它是 PHP 中一款流行而强大的调试器。要启用 Xdebug，请确保你已[发布 Sail 配置](#sail-customization)。然后，把以下变量添加到应用 `.env` 文件中以配置 Xdebug：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

接下来，确保你发布的 `php.ini` 文件包含以下配置，以便在指定模式下启用 Xdebug：

```ini
[xdebug]
xdebug.mode=${XDEBUG_MODE}
```

修改 `php.ini` 文件后，请记得重新构建 Docker 镜像，以便对 `php.ini` 文件的更改生效：

```shell
sail build --no-cache
```

#### Linux 主机 IP 配置

在内部，`XDEBUG_CONFIG` 环境变量被定义为 `client_host=host.docker.internal`，以便为 Mac 和 Windows（WSL2）正确配置 Xdebug。如果你的本地机器运行 Linux 且使用 Docker 20.10+，`host.docker.internal` 可用，无需手动配置。

对于早于 20.10 的 Docker 版本，Linux 上不支持 `host.docker.internal`，你需要手动定义主机 IP。为此，请在 `docker-compose.yml` 文件中定义一个自定义网络，为你的容器配置静态 IP：

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

运行 Artisan 命令时，可以使用 `sail debug` 命令启动调试会话：

```shell
# Run an Artisan command without Xdebug...
sail artisan migrate

# Run an Artisan command with Xdebug...
sail debug migrate
```

<a name="xdebug-browser-usage"></a>
### Xdebug 浏览器用法

要在通过 Web 浏览器与应用交互的同时调试应用，请遵循 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application)，了解如何从 Web 浏览器发起 Xdebug 会话。

如果你在使用 PhpStorm，请查阅 JetBrains 关于[零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html)的文档。

> [!WARNING]
> Laravel Sail 依赖 `artisan serve` 来为你的应用提供服务。截至 Laravel 8.53.0 版本，`artisan serve` 命令仅接受 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。更早的 Laravel 版本（8.52.0 及以下）不支持这些变量，也不会接受调试连接。

<a name="sail-customization"></a>
## 自定义

由于 Sail 就是 Docker，你可以自由地自定义它的几乎一切。要发布 Sail 自带的 Dockerfile，可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

运行该命令后，Laravel Sail 所使用的 Dockerfile 和其他配置文件会被放到应用根目录下的 `docker` 目录中。自定义 Sail 安装后，你可能希望更改应用 `docker-compose.yml` 文件中应用容器的镜像名称。完成后，使用 `build` 命令重新构建应用的容器。如果你使用 Sail 在单台机器上开发多个 Laravel 应用，为应用镜像指定唯一名称尤为重要：

```shell
sail build --no-cache
```
