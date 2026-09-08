# Laravel Sail

[Laravel Sail](https://github.com/laravel/sail) 是一个轻量级的命令行界面，用于与 Laravel 默认的 Docker 开发环境交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用提供了很好的起点，且无需事先具备 Docker 经验。

Sail 的核心是存放在你项目根目录下的 `compose.yaml` 文件和 `sail` 脚本。`sail` 脚本提供了一个带有便捷方法的 CLI，用于与 `compose.yaml` 文件所定义的 Docker 容器交互。

Laravel Sail 支持 macOS、Linux 以及 Windows（通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)）。

## 安装与设置

你可以使用 Composer 包管理器安装 Sail：

```shell
composer require laravel/sail --dev
```

安装 Sail 后，你可以运行 `sail:install` Artisan 命令。该命令会将 Sail 的 `compose.yaml` 文件发布到你的应用根目录，并修改你的 `.env` 文件，填入连接 Docker 服务所需的环境变量：

```shell
php artisan sail:install
```

最后，你可以启动 Sail。要继续了解如何使用 Sail，请继续阅读本文档的其余部分：

```shell
./vendor/bin/sail up
```

> [!WARNING]
> 如果你使用的是 Docker Desktop for Linux，应通过执行以下命令来使用 `default` Docker 上下文：`docker context use default`。此外，如果你在容器内遇到文件权限错误，可能需要将 `SUPERVISOR_PHP_USER` 环境变量设置为 `root`。

#### 添加额外服务

如果你想为现有的 Sail 安装添加额外的服务，可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

#### 使用开发容器

如果你想在 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中进行开发，可以在 `sail:install` 命令上提供 `--devcontainer` 选项。`--devcontainer` 选项会指示 `sail:install` 命令向你的应用根目录发布一个默认的 `.devcontainer/devcontainer.json ` 文件：

```shell
php artisan sail:install --devcontainer
```

### 重建 Sail 镜像

有时你可能希望完全重建你的 Sail 镜像，以确保镜像中的所有包和软件都是最新的。你可以使用 `build` 命令来完成：

```shell
docker compose down -v

sail build --no-cache

sail up
```

### 配置 Shell 别名

默认情况下，Sail 命令通过所有新的 Laravel 应用自带的 `vendor/bin/sail` 脚本来调用：

```shell
./vendor/bin/sail up
```

不过，与其反复输入 `vendor/bin/sail` 来执行 Sail 命令，你可能希望配置一个 shell 别名，让你更轻松地执行 Sail 的命令：

```shell
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

为确保这始终可用，你可以将它添加到你主目录下的 shell 配置文件中，例如 `~/.zshrc` 或 `~/.bashrc`，然后重启你的 shell。

配置好 shell 别名后，你只需输入 `sail` 即可执行 Sail 命令。本文档其余部分的示例都假设你已配置了该别名：

```shell
sail up
```

## 启动与停止 Sail

Laravel Sail 的 `compose.yaml` 文件定义了多种协同工作的 Docker 容器，帮助你构建 Laravel 应用。这些容器中的每一个都是你 `compose.yaml` 文件 `services` 配置中的一个条目。`laravel.test` 容器是负责为你的应用提供服务的主要应用容器。

在启动 Sail 之前，你应确保本地计算机上没有运行其他 Web 服务器或数据库。要启动你应用 `compose.yaml` 文件中定义的所有 Docker 容器，你应执行 `up` 命令：

```shell
sail up
```

要在后台启动所有 Docker 容器，你可以以"分离（detached）"模式启动 Sail：

```shell
sail up -d
```

一旦应用的容器启动，你就可以在 Web 浏览器中通过 http://localhost 访问该项目。

要停止所有容器，你只需按 Control + C 停止容器的执行即可。或者，如果容器正在后台运行，你可以使用 `stop` 命令：

```shell
sail stop
```

## 执行命令

使用 Laravel Sail 时，你的应用在 Docker 容器内执行，并与本地计算机隔离。不过，Sail 提供了便捷的方式来针对你的应用运行各种命令，例如任意 PHP 命令、Artisan 命令、Composer 命令，以及 Node / NPM 命令。

**阅读 Laravel 文档时，你会经常看到引用 Composer、Artisan 和 Node / NPM 命令、却没有提及 Sail 的说明。** 那些示例假设这些工具已安装在你的本地计算机上。如果你使用 Sail 作为本地 Laravel 开发环境，你应该使用 Sail 来执行那些命令：

```shell
# 在本地运行 Artisan 命令...
php artisan queue:work

# 在 Laravel Sail 中运行 Artisan 命令...
sail artisan queue:work
```

### 执行 PHP 命令

PHP 命令可以使用 `php` 命令执行。当然，这些命令会使用为你的应用配置的 PHP 版本执行。要了解 Laravel Sail 可用的 PHP 版本，请参阅 PHP 版本文档：

```shell
sail php --version

sail php script.php
```

### 执行 Composer 命令

Composer 命令可以使用 `composer` 命令执行。Laravel Sail 的应用容器中包含了 Composer 安装：

```shell
sail composer require laravel/sanctum
```

### 执行 Artisan 命令

Laravel Artisan 命令可以使用 `artisan` 命令执行：

```shell
sail artisan queue:work
```

### 执行 Node / NPM 命令

Node 命令可以使用 `node` 命令执行，而 NPM 命令可以使用 `npm` 命令执行：

```shell
sail node --version

sail npm run dev
```

如果你愿意，也可以使用 Yarn 代替 NPM：

```shell
sail yarn
```

## 与数据库交互

### MySQL

你可能已经注意到，你应用的 `compose.yaml` 文件中包含了一个 MySQL 容器的条目。该容器使用了 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，存储在数据库中的数据也会被持久化。

此外，MySQL 容器首次启动时，会为你创建两个数据库。第一个数据库使用你的 `DB_DATABASE` 环境变量的值命名，用于本地开发。第二个是名为 `testing` 的专用测试数据库，它会确保你的测试不会干扰你的开发数据。

一旦你启动了容器，你就可以通过将应用 `.env` 文件中的 `DB_HOST` 环境变量设置为 `mysql`，来连接到应用内的 MySQL 实例。

要从本地机器连接到应用的 MySQL 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，MySQL 数据库可通过 `localhost` 的 3306 端口访问，访问凭据与你 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值相对应。或者，你也可以以 `root` 用户身份连接，它同样使用你的 `DB_PASSWORD` 环境变量的值作为密码。

### MongoDB

如果在安装 Sail 时你选择安装了 [MongoDB](https://www.mongodb.com/) 服务，你应用的 `compose.yaml` 文件中就会包含一个 [MongoDB Atlas Local](https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-local-cloud/) 容器的条目，它提供了带有 Atlas 功能（如 [Search Indexes](https://www.mongodb.com/docs/atlas/atlas-search/)）的 MongoDB 文档数据库。该容器使用了 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，存储在数据库中的数据也会被持久化。

一旦你启动了容器，你就可以通过将应用 `.env` 文件中的 `MONGODB_URI` 环境变量设置为 `mongodb://mongodb:27017`，来连接到应用内的 MongoDB 实例。默认情况下身份验证是禁用的，但你可以在启动 `mongodb` 容器之前设置 `MONGODB_USERNAME` 和 `MONGODB_PASSWORD` 环境变量来启用身份验证。然后，将凭据添加到连接字符串中：

```ini
MONGODB_USERNAME=user
MONGODB_PASSWORD=laravel
MONGODB_URI=mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@mongodb:27017
```

为了让 MongoDB 与你的应用无缝集成，你可以安装 [MongoDB 维护的官方包](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/)。

要从本地机器连接到应用的 MongoDB 数据库，你可以使用图形化界面，例如 [Compass](https://www.mongodb.com/products/tools/compass)。默认情况下，MongoDB 数据库可通过 `localhost` 的 `27017` 端口访问。

### Redis

你应用的 `compose.yaml` 文件还包含了一个 [Redis](https://redis.io) 容器的条目。该容器使用了 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，存储在 Redis 实例中的数据也会被持久化。一旦你启动了容器，你就可以通过将应用 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `redis`，来连接到应用内的 Redis 实例。

要从本地机器连接到应用的 Redis 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Redis 数据库可通过 `localhost` 的 6379 端口访问。

### Valkey

如果在安装 Sail 时你选择安装 Valkey 服务，你应用的 `compose.yaml` 文件中就会包含一个 [Valkey](https://valkey.io/) 容器的条目。该容器使用了 [Docker 卷](https://docs.docker.com/storage/volumes/)，因此即使停止并重启容器，存储在 Valkey 实例中的数据也会被持久化。你可以通过将应用 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `valkey`，来在应用中连接到该容器。

要从本地机器连接到应用的 Valkey 数据库，你可以使用图形化数据库管理应用，例如 [TablePlus](https://tableplus.com)。默认情况下，Valkey 数据库可通过 `localhost` 的 6379 端口访问。

### Meilisearch

如果在安装 Sail 时你选择安装了 [Meilisearch](https://www.meilisearch.com) 服务，你应用的 `compose.yaml` 文件中就会包含这个与 [Laravel Scout](/topic/Laravel%2013.x/2wy3l13ykm.html) 集成的强大搜索引擎的条目。一旦你启动了容器，你就可以通过将 `MEILISEARCH_HOST` 环境变量设置为 `http://meilisearch:7700`，来连接到应用内的 Meilisearch 实例。

从你的本地机器上，你可以通过在 Web 浏览器中访问 `http://localhost:7700` 来使用 Meilisearch 基于 Web 的管理面板。

### Typesense

如果在安装 Sail 时你选择安装了 [Typesense](https://typesense.org) 服务，你应用的 `compose.yaml` 文件中就会包含这个与 [Laravel Scout](/topic/Laravel%2013.x/2wy3l13ykm.html) 原生集成的极速开源搜索引擎的条目。一旦你启动了容器，你就可以通过设置以下环境变量来连接到应用内的 Typesense 实例：

```ini
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

从你的本地机器上，你可以通过 `http://localhost:8108` 访问 Typesense 的 API。

## 文件存储

如果你计划在生产环境中运行应用时使用 Amazon S3 存储文件，你可能希望在安装 Sail 时安装 [RustFS](https://rustfs.com) 服务。RustFS 提供了与 S3 兼容的 API，让你可以在本地使用 Laravel 的 `s3` 文件存储驱动进行开发，而无需在生产环境的 S3 中创建"测试"存储桶。如果你在安装 Sail 时选择安装 RustFS，你的应用 `compose.yaml` 文件中会添加一个 RustFS 配置区块。

默认情况下，你应用的 `filesystems` 配置文件已经包含了 `s3` 磁盘的磁盘配置。除了使用这个磁盘与 Amazon S3 交互之外，你还可以将其用于与任何 S3 兼容的文件存储服务（如 RustFS）交互，只需修改控制其配置的相关环境变量即可。例如，使用 RustFS 时，你的文件系统环境变量配置应定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://rustfs:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

## 运行测试

Laravel 开箱即用地提供了出色的测试支持，你可以使用 Sail 的 `test` 命令来运行应用的 [功能测试与单元测试](/topic/Laravel%2013.x/e296oqw9q7.html)。Pest / PHPUnit 接受的任意 CLI 选项也都可以传给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail 的 `test` 命令等同于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 会创建一个专用的 `testing` 数据库，这样你的测试就不会干扰数据库的当前状态。在默认的 Laravel 安装中，Sail 还会配置你的 `phpunit.xml` 文件，使其在执行测试时使用该数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

### Laravel Dusk

[Laravel Dusk](/topic/Laravel%2013.x/xpv520gv86.html) 提供了一个富有表现力、易于使用的浏览器自动化与测试 API。借助 Sail，你可以在本地计算机上无需安装 Selenium 或其他工具即可运行这些测试。要开始使用，请取消注释你应用 `compose.yaml` 文件中的 Selenium 服务：

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

接下来，确保你应用 `compose.yaml` 文件中的 `laravel.test` 服务有一个针对 `selenium` 的 `depends_on` 条目：

```yaml
depends_on:
    - mysql
    - redis
    - selenium
```

最后，你可以通过启动 Sail 并运行 `dusk` 命令来运行你的 Dusk 测试套件：

```shell
sail dusk
```

#### Apple Silicon 上的 Selenium

如果你的本地机器包含 Apple Silicon 芯片，你的 `selenium` 服务必须使用 `selenium/standalone-chromium` 镜像：

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

## 预览邮件

Laravel Sail 默认的 `compose.yaml` 文件包含了一个 [Mailpit](https://github.com/axllent/mailpit) 服务条目。Mailpit 会拦截本地开发期间由你的应用发送的电子邮件，并提供一个便捷的 Web 界面，让你可以在浏览器中预览邮件消息。使用 Sail 时，Mailpit 的默认主机是 `mailpit`，并可通过 1025 端口访问：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

当 Sail 运行时，你可以通过 http://localhost:8025 访问 Mailpit 的 Web 界面。

## 容器 CLI

有时你可能希望在应用的容器内启动一个 Bash 会话。你可以使用 `shell` 命令连接到应用的容器，从而检查其文件和已安装的服务，并在容器内部执行任意 shell 命令：

```shell
sail shell

sail root-shell
```

要启动一个新的 [Laravel Tinker](https://github.com/laravel/tinker) 会话，你可以执行 `tinker` 命令：

```shell
sail tinker
```

## PHP 版本

Sail 目前支持通过 PHP 8.5、8.4、8.3、8.2、8.1 或 PHP 8.0 为你的应用提供服务。Sail 当前默认使用的 PHP 版本是 PHP 8.5。要更改用于为应用提供服务的 PHP 版本，你应更新应用 `compose.yaml` 文件中 `laravel.test` 容器的 `build` 定义：

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

此外，你可能希望更新你的 `image` 名称，以反映应用所使用的 PHP 版本。这个选项同样定义在应用的 `compose.yaml` 文件中：

```yaml
image: sail-8.2/app
```

更新应用的 `compose.yaml` 文件后，你应该重建你的容器镜像：

```shell
sail build --no-cache

sail up
```

### 其他 PHP 扩展

Sail 的运行时镜像包含一组常用的 PHP 扩展。如果你的应用需要额外的扩展，你可以在构建镜像时，向应用 `compose.yaml` 文件中 `laravel.test` 服务添加一个以空格分隔的 `PHP_EXTENSIONS` 构建参数来安装它们：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        PHP_EXTENSIONS: 'gmp imagick'
```

更新应用的 `compose.yaml` 文件后，你应该重建你的容器镜像。

## Node 版本

Sail 默认安装 Node 24。要更改构建镜像时安装的 Node 版本，你可以更新应用 `compose.yaml` 文件中 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        NODE_VERSION: '18'
```

更新应用的 `compose.yaml` 文件后，你应该重建你的容器镜像：

```shell
sail build --no-cache

sail up
```

## 共享你的站点

有时你可能需要公开分享你的站点，以便为同事预览站点或与你的应用测试 Webhook 集成。要分享你的站点，你可以使用 `share` 命令。执行此命令后，你会获得一个随机的 `laravel-sail.site` URL，你可以用它来访问你的应用：

```shell
sail share
```

通过 `share` 命令分享你的站点时，你应该使用应用 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法配置应用的可信代理。否则，像 `url` 和 `route` 这样的 URL 生成辅助函数将无法确定 URL 生成期间应使用的正确 HTTP 主机：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

如果你想为分享的站点选择子域名，可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> [!NOTE]
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 提供支持，它是 [BeyondCode](https://beyondco.de) 提供的一个开源隧道服务。

## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置包含对 [Xdebug](https://xdebug.org/) 的支持，这是一个流行且强大的 PHP 调试器。要启用 Xdebug，请确保你已 发布 Sail 配置。然后，将以下变量添加到应用的 `.env` 文件中来配置 Xdebug：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

接下来，确保你发布的 `php.ini` 文件包含以下配置，以便 Xdebug 在指定模式下被激活：

```ini
[xdebug]
xdebug.mode=${XDEBUG_MODE}
```

修改 `php.ini` 文件后，记得重建你的 Docker 镜像，以便对 `php.ini` 文件的更改生效：

```shell
sail build --no-cache
```

#### Linux 主机 IP 配置

在内部，`XDEBUG_CONFIG` 环境变量被定义为 `client_host=host.docker.internal`，以便 Xdebug 能为 Mac 和 Windows（WSL2）正确配置。如果你的本地机器运行的是 Linux 且你使用的是 Docker 20.10+，`host.docker.internal` 是可用的，无需手动配置。

对于 20.10 之前的 Docker 版本，`host.docker.internal` 在 Linux 上不受支持，你需要手动定义主机 IP。为此，请通过在 `compose.yaml` 文件中定义一个自定义网络来为你的容器配置静态 IP：

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

设置好静态 IP 后，在应用的 `.env` 文件中定义 SAIL_XDEBUG_CONFIG 变量：

```ini
SAIL_XDEBUG_CONFIG="client_host=172.20.0.2"
```

### 在 CLI 中使用 Xdebug

可以使用 `sail debug` 命令在运行 Artisan 命令时启动调试会话：

```shell
# 不使用 Xdebug 运行 Artisan 命令...
sail artisan migrate

# 使用 Xdebug 运行 Artisan 命令...
sail debug migrate
```

### 在浏览器中使用 Xdebug

要通过 Web 浏览器与应用交互来调试应用，请遵循 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application) 来从 Web 浏览器发起 Xdebug 会话。

如果你使用的是 PhpStorm，请查阅 JetBrains 关于 [零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html) 的文档。

> [!WARNING]
> Laravel Sail 依赖 `artisan serve` 来为你的应用提供服务。`artisan serve` 命令从 Laravel 8.53.0 版本起才开始接受 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。旧版本的 Laravel（8.52.0 及以下）不支持这些变量，也不会接受调试连接。

## 自定义

由于 Sail 本质上就是 Docker，你几乎可以自由地定制关于它的一切。要发布 Sail 自带的 Dockerfile，你可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

运行此命令后，Laravel Sail 使用的 Dockerfile 和其他配置文件会被放置到应用根目录下的 `docker` 目录中。定制 Sail 安装后，你可能希望更改应用 `compose.yaml` 文件中应用容器的镜像名称。这样做之后，使用 `build` 命令重建应用的容器。如果你在一台机器上使用 Sail 开发多个 Laravel 应用，为应用镜像分配一个唯一的名称尤为重要：

```shell
sail build --no-cache
```