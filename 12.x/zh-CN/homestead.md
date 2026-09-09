# Laravel Homestead

- [简介](#introduction)
- [安装与设置](#installation-and-setup)
    - [准备工作](#first-steps)
    - [配置 Homestead](#configuring-homestead)
    - [配置 Nginx 站点](#configuring-nginx-sites)
    - [配置服务](#configuring-services)
    - [启动 Vagrant Box](#launching-the-vagrant-box)
    - [按项目安装](#per-project-installation)
    - [安装可选功能](#installing-optional-features)
    - [别名](#aliases)
- [更新 Homestead](#updating-homestead)
- [日常使用](#daily-usage)
    - [通过 SSH 连接](#connecting-via-ssh)
    - [添加更多站点](#adding-additional-sites)
    - [环境变量](#environment-variables)
    - [端口](#ports)
    - [PHP 版本](#php-versions)
    - [连接数据库](#connecting-to-databases)
    - [数据库备份](#database-backups)
    - [配置 Cron 调度](#configuring-cron-schedules)
    - [配置 Mailpit](#configuring-mailpit)
    - [配置 Minio](#configuring-minio)
    - [Laravel Dusk](#laravel-dusk)
    - [共享你的环境](#sharing-your-environment)
- [调试与分析](#debugging-and-profiling)
    - [使用 Xdebug 调试 Web 请求](#debugging-web-requests)
    - [调试 CLI 应用](#debugging-cli-applications)
    - [使用 Blackfire 分析应用](#profiling-applications-with-blackfire)
- [网络接口](#network-interfaces)
- [扩展 Homestead](#extending-homestead)
- [特定虚拟化提供商的设置](#provider-specific-settings)
    - [VirtualBox](#provider-specific-virtualbox)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel Homestead 是一个遗留软件包，目前已不再积极维护。可以使用 [Laravel Sail](/docs/{{version}}/sail) 作为现代化的替代方案。

Laravel 致力于让整个 PHP 开发体验变得愉悦，包括你的本地开发环境。[Laravel Homestead](https://github.com/laravel/homestead) 是一个官方预打包的 Vagrant box，它为你提供了出色的开发环境，无需在本地机器上安装 PHP、Web 服务器或任何其他服务器软件。

[Vagrant](https://www.vagrantup.com) 提供了一种简单优雅的方式来管理和预配虚拟机。Vagrant box 完全可丢弃。如果出现问题，你可以在几分钟内销毁并重新创建 box！

Homestead 可以运行在任何 Windows、macOS 或 Linux 系统上，并且包含 Nginx、PHP、MySQL、PostgreSQL、Redis、Memcached、Node，以及开发出色 Laravel 应用所需的所有其他软件。

> [!WARNING]
> 如果你使用的是 Windows，可能需要启用硬件虚拟化（VT-x）。通常可以通过 BIOS 启用。如果你在 UEFI 系统上使用 Hyper-V，可能还需要禁用 Hyper-V 才能使用 VT-x。

<a name="included-software"></a>
### 内置软件

<style>
    #software-list > ul {
        column-count: 2; -moz-column-count: 2; -webkit-column-count: 2;
        column-gap: 5em; -moz-column-gap: 5em; -webkit-column-gap: 5em;
        line-height: 1.9;
    }
</style>

<div id="software-list" markdown="1">

- Ubuntu 22.04
- Git
- PHP 8.3
- PHP 8.2
- PHP 8.1
- PHP 8.0
- PHP 7.4
- PHP 7.3
- PHP 7.2
- PHP 7.1
- PHP 7.0
- PHP 5.6
- Nginx
- MySQL 8.0
- lmm
- Sqlite3
- PostgreSQL 15
- Composer
- Docker
- Node（附带 Yarn、Bower、Grunt 和 Gulp）
- Redis
- Memcached
- Beanstalkd
- Mailpit
- avahi
- ngrok
- Xdebug
- XHProf / Tideways / XHGui
- wp-cli

</div>

<a name="optional-software"></a>
### 可选软件

<style>
    #software-list > ul {
        column-count: 2; -moz-column-count: 2; -webkit-column-count: 2;
        column-gap: 5em; -moz-column-gap: 5em; -webkit-column-gap: 5em;
        line-height: 1.9;
    }
</style>

<div id="software-list" markdown="1">

- Apache
- Blackfire
- Cassandra
- Chronograf
- CouchDB
- Crystal & Lucky Framework
- Elasticsearch
- EventStoreDB
- Flyway
- Gearman
- Go
- Grafana
- InfluxDB
- Logstash
- MariaDB
- Meilisearch
- MinIO
- MongoDB
- Neo4j
- Oh My Zsh
- Open Resty
- PM2
- Python
- R
- RabbitMQ
- Rust
- RVM（Ruby 版本管理器）
- Solr
- TimescaleDB
- Trader <small>（PHP 扩展）</small>
- Webdriver & Laravel Dusk 工具

</div>

<a name="installation-and-setup"></a>
## 安装与设置

<a name="first-steps"></a>
### 准备工作

在启动 Homestead 环境之前，你必须先安装 [Vagrant](https://developer.hashicorp.com/vagrant/downloads) 以及以下受支持的虚拟化提供商之一：

- [VirtualBox 6.1.x](https://www.virtualbox.org/wiki/Download_Old_Builds_6_1)
- [Parallels](https://www.parallels.com/products/desktop/)

所有这些软件包都为各大主流操作系统提供了易于使用的图形化安装程序。

要使用 Parallels 提供商，你需要安装 [Parallels Vagrant 插件](https://github.com/Parallels/vagrant-parallels)。它是免费的。

<a name="installing-homestead"></a>
#### 安装 Homestead

你可以通过将 Homestead 仓库克隆到主机上来安装 Homestead。建议将仓库克隆到你的「主」目录下的 `Homestead` 文件夹中，因为 Homestead 虚拟机将作为你所有 Laravel 应用的宿主。在本文档中，我们将这个目录称为你的「Homestead 目录」：

```shell
git clone https://github.com/laravel/homestead.git ~/Homestead
```

克隆 Laravel Homestead 仓库后，你应当检出（checkout）`release` 分支。该分支始终包含 Homestead 的最新稳定版本：

```shell
cd ~/Homestead

git checkout release
```

接着，在 Homestead 目录中执行 `bash init.sh` 命令来创建 `Homestead.yaml` 配置文件。你将在 `Homestead.yaml` 文件中配置 Homestead 安装的所有设置。该文件会被放置在 Homestead 目录中：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

<a name="configuring-homestead"></a>
### 配置 Homestead

<a name="setting-your-provider"></a>
#### 设置虚拟化提供商

`Homestead.yaml` 文件中的 `provider` 键指明应使用哪个 Vagrant 提供商：`virtualbox` 或 `parallels`：

    provider: virtualbox

> [!WARNING]
> 如果你使用的是 Apple Silicon（Apple 芯片），则必须使用 Parallels 提供商。

<a name="configuring-shared-folders"></a>
#### 配置共享文件夹

`Homestead.yaml` 文件的 `folders` 属性列出了你想与 Homestead 环境共享的所有文件夹。当这些文件夹中的文件发生变化时，它们会在你的本地机器与 Homestead 虚拟环境之间保持同步。你可以按需配置任意数量的共享文件夹：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
```

> [!WARNING]
> Windows 用户不应使用 `~/` 路径语法，而应使用项目的完整路径，例如 `C:\Users\user\Code\project1`。

你应当始终将每个应用映射到各自独立的文件夹映射中，而不是把包含所有应用的单个大目录映射进去。映射文件夹时，虚拟机必须跟踪该文件夹中*每一个*文件的所有磁盘 IO。如果文件夹中的文件数量庞大，可能会导致性能下降：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
    - map: ~/code/project2
      to: /home/vagrant/project2
```

> [!WARNING]
> 使用 Homestead 时，千万不要挂载 `.`（当前目录）。这会导致 Vagrant 无法将当前文件夹映射到 `/vagrant`，会破坏可选功能，并在预配时产生意外结果。

要启用 [NFS](https://developer.hashicorp.com/vagrant/docs/synced-folders/nfs)，你可以在文件夹映射中添加 `type` 选项：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
      type: "nfs"
```

> [!WARNING]
> 在 Windows 上使用 NFS 时，应当考虑安装 [vagrant-winnfsd](https://github.com/winnfsd/vagrant-winnfsd) 插件。该插件会为 Homestead 虚拟机内的文件和目录维护正确的用户 / 组权限。

你还可以在 `options` 键下罗列 Vagrant [Synced Folders](https://developer.hashicorp.com/vagrant/docs/synced-folders/basic_usage) 所支持的任何选项：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
      type: "rsync"
      options:
          rsync__args: ["--verbose", "--archive", "--delete", "-zz"]
          rsync__exclude: ["node_modules"]
```

<a name="configuring-nginx-sites"></a>
### 配置 Nginx 站点

不熟悉 Nginx？没关系。`Homestead.yaml` 文件的 `sites` 属性允许你轻松地将一个「域名」映射到 Homestead 环境中的某个文件夹。`Homestead.yaml` 文件中已经包含了一份示例站点配置。同样，你可以按需向 Homestead 环境添加任意数量的站点。Homestead 可以为你正在开发的每一个 Laravel 应用充当便捷的虚拟化环境：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
```

如果在预配 Homestead 虚拟机之后修改了 `sites` 属性，你应当在终端中执行 `vagrant reload --provision` 命令来更新虚拟机上的 Nginx 配置。

> [!WARNING]
> Homestead 脚本构建时尽可能保证幂等。但是，如果预配过程中遇到问题，你应当通过执行 `vagrant destroy && vagrant up` 命令来销毁并重建虚拟机。

<a name="hostname-resolution"></a>
#### 主机名解析

Homestead 使用 `mDNS` 发布主机名，实现自动主机解析。如果你在 `Homestead.yaml` 文件中设置了 `hostname: homestead`，就可以通过 `homestead.local` 访问该主机。macOS、iOS 和 Linux 桌面发行版默认包含 `mDNS` 支持。如果你使用的是 Windows，则必须安装 [Bonjour Print Services for Windows](https://support.apple.com/kb/DL999?viewlocale=en_US&locale=en_US)。

自动主机名最适合 Homestead 的[按项目安装](#per-project-installation)方式。如果你在单个 Homestead 实例上托管多个站点，可以将网站的「域名」添加到机器上的 `hosts` 文件中。`hosts` 文件会将针对 Homestead 站点的请求重定向到你的 Homestead 虚拟机。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`；在 Windows 上，位于 `C:\Windows\System32\drivers\etc\hosts`。你添加到该文件中的内容如下所示：

```text
192.168.56.56  homestead.test
```

请确保所列的 IP 地址与 `Homestead.yaml` 文件中设置的一致。将域名添加到 `hosts` 文件并启动 Vagrant box 之后，你就可以通过浏览器访问站点了：

```shell
http://homestead.test
```

<a name="configuring-services"></a>
### 配置服务

Homestead 默认会启动若干服务；不过，你可以自定义预配期间启用或禁用哪些服务。例如，通过修改 `Homestead.yaml` 文件中的 `services` 选项，你可以启用 PostgreSQL 并禁用 MySQL：

```yaml
services:
    - enabled:
        - "postgresql"
    - disabled:
        - "mysql"
```

指定的服务将根据它们在 `enabled` 和 `disabled` 指令中的顺序被启动或停止。

<a name="launching-the-vagrant-box"></a>
### 启动 Vagrant Box

按照自己的需求编辑好 `Homestead.yaml` 之后，在 Homestead 目录中运行 `vagrant up` 命令。Vagrant 会启动虚拟机，并自动配置你的共享文件夹和 Nginx 站点。

要销毁虚拟机，可以使用 `vagrant destroy` 命令。

<a name="per-project-installation"></a>
### 按项目安装

除了全局安装 Homestead 并在所有项目之间共享同一个 Homestead 虚拟机之外，你还可以为你管理的每个项目单独配置一个 Homestead 实例。如果你想随项目附带一个 `Vagrantfile`，让参与项目的其他人在克隆项目仓库后立即执行 `vagrant up`，那么按项目安装 Homestead 会很有帮助。

你可以使用 Composer 包管理器将 Homestead 安装到项目中：

```shell
composer require laravel/homestead --dev
```

安装好 Homestead 之后，调用 Homestead 的 `make` 命令为项目生成 `Vagrantfile` 和 `Homestead.yaml` 文件。这些文件会被放置在项目根目录。`make` 命令会自动配置 `Homestead.yaml` 文件中的 `sites` 和 `folders` 指令：

```shell
# macOS / Linux...
php vendor/bin/homestead make

# Windows...
vendor\\bin\\homestead make
```

接着，在终端中运行 `vagrant up` 命令，然后在浏览器中通过 `http://homestead.test` 访问你的项目。请记住，如果你没有使用自动[主机名解析](#hostname-resolution)，仍然需要为 `homestead.test` 或你选择的域名添加 `/etc/hosts` 文件条目。

<a name="installing-optional-features"></a>
### 安装可选功能

可选软件通过 `Homestead.yaml` 文件中的 `features` 选项来安装。大多数功能都可以通过布尔值启用或禁用，而有些功能则支持多个配置选项：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
    - cassandra: true
    - chronograf: true
    - couchdb: true
    - crystal: true
    - dragonflydb: true
    - elasticsearch:
        version: 7.9.0
    - eventstore: true
        version: 21.2.0
    - flyway: true
    - gearman: true
    - golang: true
    - grafana: true
    - influxdb: true
    - logstash: true
    - mariadb: true
    - meilisearch: true
    - minio: true
    - mongodb: true
    - neo4j: true
    - ohmyzsh: true
    - openresty: true
    - pm2: true
    - python: true
    - r-base: true
    - rabbitmq: true
    - rustc: true
    - rvm: true
    - solr: true
    - timescaledb: true
    - trader: true
    - webdriver: true
```

<a name="elasticsearch"></a>
#### Elasticsearch

你可以指定受支持的 Elasticsearch 版本，版本号必须是精确的版本号（major.minor.patch）。默认安装会创建一个名为 'homestead' 的集群。切勿给 Elasticsearch 分配超过操作系统内存一半的量，因此请确保 Homestead 虚拟机的内存至少是 Elasticsearch 分配量的两倍。

> [!NOTE]
> 请查阅 [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current)，了解如何自定义配置。

<a name="mariadb"></a>
#### MariaDB

启用 MariaDB 将移除 MySQL 并安装 MariaDB。MariaDB 通常是 MySQL 的直接替代品，因此在应用的数据库配置中，你仍应使用 `mysql` 数据库驱动。

<a name="mongodb"></a>
#### MongoDB

默认的 MongoDB 安装会将数据库用户名设置为 `homestead`，对应的密码设置为 `secret`。

<a name="neo4j"></a>
#### Neo4j

默认的 Neo4j 安装会将数据库用户名设置为 `homestead`，对应的密码设置为 `secret`。要访问 Neo4j 浏览器，请通过浏览器访问 `http://homestead.test:7474`。端口 `7687`（Bolt）、`7474`（HTTP）和 `7473`（HTTPS）已准备好为来自 Neo4j 客户端的请求提供服务。

<a name="aliases"></a>
### 别名

你可以通过修改 Homestead 目录中的 `aliases` 文件，向 Homestead 虚拟机添加 Bash 别名：

```shell
alias c='clear'
alias ..='cd ..'
```

更新 `aliases` 文件之后，你应当使用 `vagrant reload --provision` 命令重新预配 Homestead 虚拟机，以确保新的别名在虚拟机上可用。

<a name="updating-homestead"></a>
## 更新 Homestead

在开始更新 Homestead 之前，你应当确保已移除当前的虚拟机，方法是在 Homestead 目录中运行以下命令：

```shell
vagrant destroy
```

接下来，需要更新 Homestead 源代码。如果你是通过克隆仓库方式安装的，可以在最初克隆仓库的位置执行以下命令：

```shell
git fetch

git pull origin release
```

这些命令会从 GitHub 仓库拉取最新的 Homestead 代码、获取最新的标签，然后检出最新的打标签版本。你可以在 Homestead 的 [GitHub releases 页面](https://github.com/laravel/homestead/releases)上找到最新的稳定版本号。

如果你是通过项目的 `composer.json` 文件安装的 Homestead，则应当确保 `composer.json` 文件中包含 `"laravel/homestead": "^12"`，并更新依赖：

```shell
composer update
```

接下来，你应当使用 `vagrant box update` 命令更新 Vagrant box：

```shell
vagrant box update
```

更新 Vagrant box 之后，你应当在 Homestead 目录中运行 `bash init.sh` 命令，以更新 Homestead 的其他配置文件。系统会询问你是否要覆盖现有的 `Homestead.yaml`、`after.sh` 和 `aliases` 文件：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

最后，你需要重新生成 Homestead 虚拟机，以使用最新的 Vagrant 安装：

```shell
vagrant up
```

<a name="daily-usage"></a>
## 日常使用

<a name="connecting-via-ssh"></a>
### 通过 SSH 连接

你可以在 Homestead 目录中执行 `vagrant ssh` 终端命令，通过 SSH 连接到虚拟机。

<a name="adding-additional-sites"></a>
### 添加更多站点

Homestead 环境预配并运行起来之后，你可能想为其他 Laravel 项目添加更多的 Nginx 站点。你可以在单个 Homestead 环境中运行任意数量的 Laravel 项目。要添加站点，将该站点添加到你的 `Homestead.yaml` 文件中即可。

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
    - map: another.test
      to: /home/vagrant/project2/public
```

> [!WARNING]
> 在添加站点之前，你应当确保已经为该项目的目录配置了[文件夹映射](#configuring-shared-folders)。

如果 Vagrant 没有自动管理你的「hosts」文件，你可能还需要将新站点添加到该文件中。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`；在 Windows 上，位于 `C:\Windows\System32\drivers\etc\hosts`：

```text
192.168.56.56  homestead.test
192.168.56.56  another.test
```

添加站点之后，在 Homestead 目录中执行 `vagrant reload --provision` 终端命令。

<a name="site-types"></a>
#### 站点类型

Homestead 支持多种「类型」的站点，让你能够轻松运行并非基于 Laravel 的项目。例如，我们可以使用 `statamic` 站点类型轻松地将一个 Statamic 应用添加到 Homestead：

```yaml
sites:
    - map: statamic.test
      to: /home/vagrant/my-symfony-project/web
      type: "statamic"
```

可用的站点类型包括：`apache`、`apache-proxy`、`apigility`、`expressive`、`laravel`（默认）、`proxy`（用于 nginx）、`silverstripe`、`statamic`、`symfony2`、`symfony4` 和 `zf`。

<a name="site-parameters"></a>
#### 站点参数

你可以通过 `params` 站点指令为站点添加额外的 Nginx `fastcgi_param` 值：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      params:
          - key: FOO
            value: BAR
```

<a name="environment-variables"></a>
### 环境变量

你可以通过将全局环境变量添加到 `Homestead.yaml` 文件中来定义它们：

```yaml
variables:
    - key: APP_ENV
      value: local
    - key: FOO
      value: bar
```

更新 `Homestead.yaml` 文件之后，请务必通过执行 `vagrant reload --provision` 命令重新预配虚拟机。这会更新所有已安装 PHP 版本的 PHP-FPM 配置，并更新 `vagrant` 用户的环境。

<a name="ports"></a>
### 端口

默认情况下，以下端口会被转发到你的 Homestead 环境：

<div class="content-list" markdown="1">

- **HTTP：** 8000 &rarr; 转发到 80
- **HTTPS：** 44300 &rarr; 转发到 443

</div>

<a name="forwarding-additional-ports"></a>
#### 转发额外端口

如有需要，你可以通过在 `Homestead.yaml` 文件中定义 `ports` 配置项，将更多端口转发到 Vagrant box。更新 `Homestead.yaml` 文件之后，请务必通过执行 `vagrant reload --provision` 命令重新预配虚拟机：

```yaml
ports:
    - send: 50000
      to: 5000
    - send: 7777
      to: 777
      protocol: udp
```

下面列出了你可能希望从主机映射到 Vagrant box 的其他 Homestead 服务端口：

<div class="content-list" markdown="1">

- **SSH：** 2222 &rarr; 到 22
- **ngrok UI：** 4040 &rarr; 到 4040
- **MySQL：** 33060 &rarr; 到 3306
- **PostgreSQL：** 54320 &rarr; 到 5432
- **MongoDB：** 27017 &rarr; 到 27017
- **Mailpit：** 8025 &rarr; 到 8025
- **Minio：** 9600 &rarr; 到 9600

</div>

<a name="php-versions"></a>
### PHP 版本

Homestead 支持在同一台虚拟机上运行多个 PHP 版本。你可以在 `Homestead.yaml` 文件中为给定站点指定要使用的 PHP 版本。可用的 PHP 版本包括："5.6"、"7.0"、"7.1"、"7.2"、"7.3"、"7.4"、"8.0"、"8.1"、"8.2" 和 "8.3"（默认）：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      php: "7.1"
```

[在 Homestead 虚拟机内](#connecting-via-ssh)，你可以通过 CLI 使用任何受支持的 PHP 版本：

```shell
php5.6 artisan list
php7.0 artisan list
php7.1 artisan list
php7.2 artisan list
php7.3 artisan list
php7.4 artisan list
php8.0 artisan list
php8.1 artisan list
php8.2 artisan list
php8.3 artisan list
```

你可以在 Homestead 虚拟机内执行以下命令，来切换 CLI 使用的默认 PHP 版本：

```shell
php56
php70
php71
php72
php73
php74
php80
php81
php82
php83
```

<a name="connecting-to-databases"></a>
### 连接数据库

Homestead 开箱即用，已为 MySQL 和 PostgreSQL 配置好了一个 `homestead` 数据库。要从主机的数据库客户端连接 MySQL 或 PostgreSQL 数据库，你应当连接 `127.0.0.1` 上的 `33060`（MySQL）或 `54320`（PostgreSQL）端口。这两个数据库的用户名和密码均为 `homestead` / `secret`。

> [!WARNING]
> 只有从主机连接数据库时才应使用这些非标准端口。在 Laravel 应用的 `database` 配置文件中，你应使用默认的 3306 和 5432 端口，因为 Laravel 是运行在虚拟机*内部*的。

<a name="database-backups"></a>
### 数据库备份

Homestead 可以在销毁 Homestead 虚拟机时自动备份你的数据库。要使用此功能，你必须使用 Vagrant 2.1.0 或更高版本。或者，如果你使用的是旧版本的 Vagrant，则必须安装 `vagrant-triggers` 插件。要启用自动数据库备份，请将以下配置行添加到你的 `Homestead.yaml` 文件中：

```yaml
backup: true
```

配置完成后，当执行 `vagrant destroy` 命令时，Homestead 会将你的数据库导出到 `.backup/mysql_backup` 和 `.backup/postgres_backup` 目录。这些目录位于你安装 Homestead 的文件夹中；如果你使用的是[按项目安装](#per-project-installation)方式，则位于项目根目录。

<a name="configuring-cron-schedules"></a>
### 配置 Cron 调度

Laravel 提供了一种便捷的方式来[调度 cron 任务](/docs/{{version}}/scheduling)：只需调度一个每分钟运行一次的 `schedule:run` Artisan 命令。`schedule:run` 命令会检查 `routes/console.php` 文件中定义的任务调度，以确定要运行哪些计划任务。

如果你想让某个 Homestead 站点运行 `schedule:run` 命令，可以在定义站点时将 `schedule` 选项设置为 `true`：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      schedule: true
```

该站点的 cron 任务将被定义在 Homestead 虚拟机的 `/etc/cron.d` 目录中。

<a name="configuring-mailpit"></a>
### 配置 Mailpit

[Mailpit](https://github.com/axllent/mailpit) 允许你拦截外发邮件并进行查看，而无需真正将邮件发送给收件人。开始使用前，请更新应用的 `.env` 文件，使用以下邮件配置：

```ini
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

配置好 Mailpit 之后，你可以通过 `http://localhost:8025` 访问 Mailpit 控制面板。

<a name="configuring-minio"></a>
### 配置 Minio

[Minio](https://github.com/minio/minio) 是一个开源的对象存储服务器，提供与 Amazon S3 兼容的 API。要安装 Minio，请在你的 `Homestead.yaml` 文件的 [features](#installing-optional-features) 部分中添加以下配置选项：

    minio: true

默认情况下，Minio 在 9600 端口可用。你可以通过访问 `http://localhost:9600` 打开 Minio 控制面板。默认的 access key 是 `homestead`，默认的 secret key 是 `secretkey`。访问 Minio 时，应始终使用区域 `us-east-1`。

要使用 Minio，请确保你的 `.env` 文件包含以下选项：

```ini
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_ENDPOINT=http://localhost:9600
AWS_ACCESS_KEY_ID=homestead
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
```

要预配由 Minio 驱动的「S3」存储桶，请在 `Homestead.yaml` 文件中添加 `buckets` 指令。定义好存储桶之后，你应当在终端中执行 `vagrant reload --provision` 命令：

```yaml
buckets:
    - name: your-bucket
      policy: public
    - name: your-private-bucket
      policy: none
```

受支持的 `policy` 值包括：`none`、`download`、`upload` 和 `public`。

<a name="laravel-dusk"></a>
### Laravel Dusk

要在 Homestead 中运行 [Laravel Dusk](/docs/{{version}}/dusk) 测试，你应当在 Homestead 配置中启用 [webdriver 功能](#installing-optional-features)：

```yaml
features:
    - webdriver: true
```

启用 `webdriver` 功能之后，你应当在终端中执行 `vagrant reload --provision` 命令。

<a name="sharing-your-environment"></a>
### 共享你的环境

有时你可能希望与同事或客户分享你正在进行的工作。Vagrant 通过 `vagrant share` 命令内置了对这一功能的支持；但是，如果你的 `Homestead.yaml` 文件中配置了多个站点，该命令将无法工作。

为解决这一问题，Homestead 提供了自己的 `share` 命令。首先，通过 `vagrant ssh` [SSH 进入你的 Homestead 虚拟机](#connecting-via-ssh)，然后执行 `share homestead.test` 命令。该命令会共享你 `Homestead.yaml` 配置文件中的 `homestead.test` 站点。你也可以将 `homestead.test` 替换为你配置的其他任意站点：

```shell
share homestead.test
```

运行该命令后，你会看到一个 Ngrok 界面，其中包含活动日志以及共享站点的公开可访问 URL。如果你想指定自定义的区域、子域名或其他 Ngrok 运行时选项，可以将它们添加到 `share` 命令中：

```shell
share homestead.test -region=eu -subdomain=laravel
```

如果你需要通过 HTTPS 而非 HTTP 共享内容，可以使用 `sshare` 命令代替 `share`。

> [!WARNING]
> 请记住，Vagrant 本质上并不安全，运行 `share` 命令会将你的虚拟机暴露到互联网上。

<a name="debugging-and-profiling"></a>
## 调试与分析

<a name="debugging-web-requests"></a>
### 使用 Xdebug 调试 Web 请求

Homestead 内置了使用 [Xdebug](https://xdebug.org) 进行断点调试的支持。例如，你可以在浏览器中访问某个页面，PHP 将连接到你的 IDE，允许你检查并修改正在运行的代码。

默认情况下，Xdebug 已经在运行并准备好接受连接。如果你需要在 CLI 上启用 Xdebug，请在 Homestead 虚拟机内执行 `sudo phpenmod xdebug` 命令。接下来，按照 IDE 的说明启用调试。最后，配置浏览器，使其通过扩展或[书签小程序](https://www.jetbrains.com/phpstorm/marklets/)来触发 Xdebug。

> [!WARNING]
> Xdebug 会导致 PHP 的运行速度显著变慢。要禁用 Xdebug，请在 Homestead 虚拟机内运行 `sudo phpdismod xdebug` 并重启 FPM 服务。

<a name="autostarting-xdebug"></a>
#### 自动启动 Xdebug

在调试向 Web 服务器发起请求的功能测试时，让调试自动启动要比修改测试、通过自定义头部或 Cookie 来触发调试更简单。要强制 Xdebug 自动启动，请修改 Homestead 虚拟机内的 `/etc/php/7.x/fpm/conf.d/20-xdebug.ini` 文件，并添加以下配置：

```ini
; 如果 Homestead.yaml 中的 IP 地址使用了不同的子网，此地址可能会有所不同...
xdebug.client_host = 192.168.10.1
xdebug.mode = debug
xdebug.start_with_request = yes
```

<a name="debugging-cli-applications"></a>
### 调试 CLI 应用

要调试 PHP CLI 应用，请在 Homestead 虚拟机内使用 `xphp` shell 别名：

```shell
xphp /path/to/script
```

<a name="profiling-applications-with-blackfire"></a>
### 使用 Blackfire 分析应用

[Blackfire](https://blackfire.io/docs/introduction) 是一个用于分析 Web 请求和 CLI 应用的服务。它提供了一个交互式用户界面，以调用关系图（call-graph）和时间线的形式展示分析数据。它专为开发、预发布和生产环境而打造，不会给最终用户带来任何开销。此外，Blackfire 还能对代码和 `php.ini` 配置设置执行性能、质量和安全检查。

[Blackfire Player](https://blackfire.io/docs/player/index) 是一个开源的 Web 爬取、Web 测试和 Web 抓取应用，可以与 Blackfire 协同工作，用来编写分析场景脚本。

要启用 Blackfire，请使用 Homestead 配置文件中的 "features" 设置：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
```

Blackfire 的服务器凭据和客户端凭据[需要 Blackfire 账户](https://blackfire.io/signup)。Blackfire 提供了多种分析应用的方式，包括 CLI 工具和浏览器扩展。请[查阅 Blackfire 文档了解更多细节](https://blackfire.io/docs/php/integrations/laravel/index)。

<a name="network-interfaces"></a>
## 网络接口

`Homestead.yaml` 文件的 `networks` 属性用于为你的 Homestead 虚拟机配置网络接口。你可以按需配置任意数量的接口：

```yaml
networks:
    - type: "private_network"
      ip: "192.168.10.20"
```

要启用[桥接](https://developer.hashicorp.com/vagrant/docs/networking/public_network)接口，请为网络配置 `bridge` 设置，并将网络类型更改为 `public_network`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
```

要启用 [DHCP](https://developer.hashicorp.com/vagrant/docs/networking/public_network#dhcp)，只需从配置中移除 `ip` 选项即可：

```yaml
networks:
    - type: "public_network"
      bridge: "en1: Wi-Fi (AirPort)"
```

要更新网络使用的设备，你可以向网络配置中添加 `dev` 选项。默认的 `dev` 值为 `eth0`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
      dev: "enp2s0"
```

<a name="extending-homestead"></a>
## 扩展 Homestead

你可以使用 Homestead 目录根目录下的 `after.sh` 脚本来扩展 Homestead。在这个文件中，你可以添加任何正确配置和自定义虚拟机所需的 shell 命令。

在自定义 Homestead 时，Ubuntu 可能会询问你是保留软件包的原始配置，还是使用新的配置文件将其覆盖。为避免这种情况，你在安装软件包时应使用以下命令，以避免覆盖 Homestead 之前写入的任何配置：

```shell
sudo apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    install package-name
```

<a name="user-customizations"></a>
### 用户自定义

与团队一起使用 Homestead 时，你可能想对 Homestead 做一些调整，使其更契合你的个人开发风格。为此，你可以在 Homestead 目录的根目录（即包含 `Homestead.yaml` 文件的同一目录）中创建一个 `user-customizations.sh` 文件。你可以在这个文件中进行任何你想要的自定义；不过，`user-customizations.sh` 不应纳入版本控制。

<a name="provider-specific-settings"></a>
## 特定虚拟化提供商的设置

<a name="provider-specific-virtualbox"></a>
### VirtualBox

<a name="natdnshostresolver"></a>
#### `natdnshostresolver`

默认情况下，Homestead 会将 `natdnshostresolver` 设置配置为 `on`。这使得 Homestead 可以使用你主机操作系统的 DNS 设置。如果你想覆盖这一行为，请将以下配置选项添加到你的 `Homestead.yaml` 文件中：

```yaml
provider: virtualbox
natdnshostresolver: 'off'
```
