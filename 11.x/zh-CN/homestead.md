# Laravel Homestead

- [简介](#introduction)
- [安装与配置](#installation-and-setup)
    - [最初步骤](#first-steps)
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
    - [配置 Cron 定时任务](#configuring-cron-schedules)
    - [配置 Mailpit](#configuring-mailpit)
    - [配置 Minio](#configuring-minio)
    - [Laravel Dusk](#laravel-dusk)
    - [共享你的环境](#sharing-your-environment)
- [调试与性能分析](#debugging-and-profiling)
    - [使用 Xdebug 调试 Web 请求](#debugging-web-requests)
    - [调试 CLI 应用](#debugging-cli-applications)
    - [使用 Blackfire 分析应用性能](#profiling-applications-with-blackfire)
- [网络接口](#network-interfaces)
- [扩展 Homestead](#extending-homestead)
- [特定 Provider 的设置](#provider-specific-settings)
    - [VirtualBox](#provider-specific-virtualbox)

<a name="introduction"></a>
## 简介

Laravel 力求让整个 PHP 开发体验变得愉快，其中也包括你的本地开发环境。[Laravel Homestead](https://github.com/laravel/homestead) 是一个官方预配置的 Vagrant box，可以为你提供出色的开发环境，无需在本地机器上安装 PHP、Web 服务器或任何其它服务器软件。

[Vagrant](https://www.vagrantup.com) 提供了一种简单优雅的方式来管理和配置虚拟机。Vagrant box 是完全一次性的。如果出了问题，你可以在几分钟内销毁并重新创建它！

Homestead 可以运行在任意 Windows、macOS 或 Linux 系统上，并包含 Nginx、PHP、MySQL、PostgreSQL、Redis、Memcached、Node，以及开发优秀 Laravel 应用所需的其它全部软件。

> [!WARNING]
> 如果你使用 Windows，可能需要启用硬件虚拟化（VT-x）。它通常可以通过 BIOS 启用。如果你在 UEFI 系统上使用 Hyper-V，可能还需要禁用 Hyper-V 才能访问 VT-x。

<a name="included-software"></a>
### 包含的软件

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
- Node（包含 Yarn、Bower、Grunt 和 Gulp）
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
- Crystal 与 Lucky 框架
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
- RVM（Ruby Version Manager）
- Solr
- TimescaleDB
- Trader <small>（PHP 扩展）</small>
- Webdriver 与 Laravel Dusk 工具

</div>

<a name="installation-and-setup"></a>
## 安装与配置

<a name="first-steps"></a>
### 最初步骤

在启动 Homestead 环境之前，你必须安装 [Vagrant](https://developer.hashicorp.com/vagrant/downloads)，以及以下受支持的 provider 之一：

- [VirtualBox 6.1.x](https://www.virtualbox.org/wiki/Download_Old_Builds_6_1)
- [Parallels](https://www.parallels.com/products/desktop/)

所有这些软件包都为各主流操作系统提供了易用的可视化安装程序。

要使用 Parallels provider，你需要安装 [Parallels Vagrant 插件](https://github.com/Parallels/vagrant-parallels)。它是免费使用的。

<a name="installing-homestead"></a>
#### 安装 Homestead

你可以通过把 Homestead 仓库克隆到主机上来安装 Homestead。建议把仓库克隆到你的「home」目录下的 `Homestead` 文件夹中，因为 Homestead 虚拟机将作为你所有 Laravel 应用的宿主机。在本文档中，我们把这个目录称为「Homestead 目录」：

```shell
git clone https://github.com/laravel/homestead.git ~/Homestead
```

克隆 Laravel Homestead 仓库后，你应当检出 `release` 分支。该分支始终包含 Homestead 最新的稳定发行版：

```shell
cd ~/Homestead

git checkout release
```

接下来，在 Homestead 目录中执行 `bash init.sh` 命令，创建 `Homestead.yaml` 配置文件。你将在 `Homestead.yaml` 文件中配置 Homestead 安装的全部设置。该文件会被放在 Homestead 目录中：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

<a name="configuring-homestead"></a>
### 配置 Homestead

<a name="setting-your-provider"></a>
#### 设置你的 Provider

`Homestead.yaml` 文件中的 `provider` 键指示应使用哪个 Vagrant provider：`virtualbox` 或 `parallels`：

```yaml
provider: virtualbox
```

> [!WARNING]
> 如果你使用 Apple Silicon，则必须使用 Parallels provider。

<a name="configuring-shared-folders"></a>
#### 配置共享文件夹

`Homestead.yaml` 文件的 `folders` 属性列出你希望与 Homestead 环境共享的所有文件夹。当这些文件夹内的文件发生变化时，你的本地机器与 Homestead 虚拟环境之间会保持同步。你可以按需配置任意数量的共享文件夹：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
```

> [!WARNING]
> Windows 用户不应使用 `~/` 路径写法，而应使用项目的完整路径，例如 `C:\Users\user\Code\project1`。

你应当始终把各个应用分别映射到各自的文件夹，而不是映射一个包含所有应用的大目录。当你映射一个文件夹时，虚拟机必须跟踪该文件夹中*每一个*文件的所有磁盘 IO。如果一个文件夹中文件数量很多，可能会遇到性能下降：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
    - map: ~/code/project2
      to: /home/vagrant/project2
```

> [!WARNING]
> 使用 Homestead 时，绝不要挂载 `.`（当前目录）。这会导致 Vagrant 不把当前文件夹映射到 `/vagrant`，从而破坏可选功能，并在配置过程中产生意外结果。

要启用 [NFS](https://developer.hashicorp.com/vagrant/docs/synced-folders/nfs)，可以在文件夹映射中添加 `type` 选项：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
      type: "nfs"
```

> [!WARNING]
> 在 Windows 上使用 NFS 时，建议安装 [vagrant-winnfsd](https://github.com/winnfsd/vagrant-winnfsd) 插件。该插件会为 Homestead 虚拟机内的文件和目录保持正确的用户／组权限。

你也可以把 Vagrant [同步文件夹](https://developer.hashicorp.com/vagrant/docs/synced-folders/basic_usage)支持的任何选项列在 `options` 键下来传递：

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

不熟悉 Nginx？没问题。`Homestead.yaml` 文件的 `sites` 属性让你可以轻松地把一个「域名」映射到 Homestead 环境中的某个文件夹。`Homestead.yaml` 文件中已包含一份站点配置示例。同样地，你可以按需向 Homestead 环境添加任意数量的站点。Homestead 可以作为你正在开发的每个 Laravel 应用便捷的虚拟化环境：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
```

如果在配置 Homestead 虚拟机之后再更改 `sites` 属性，应当在终端中执行 `vagrant reload --provision` 命令，以更新虚拟机上的 Nginx 配置。

> [!WARNING]
> Homestead 脚本尽可能地设计为幂等的。不过，如果在配置过程中遇到问题，可以执行 `vagrant destroy && vagrant up` 命令销毁并重建虚拟机。

<a name="hostname-resolution"></a>
#### 主机名解析

Homestead 使用 `mDNS` 发布主机名，以实现自动主机解析。如果你在 `Homestead.yaml` 文件中设置 `hostname: homestead`，该主机将通过 `homestead.local` 访问。macOS、iOS 和 Linux 桌面发行版默认都包含 `mDNS` 支持。如果你使用 Windows，必须安装 [Bonjour Print Services for Windows](https://support.apple.com/kb/DL999?viewlocale=en_US&locale=en_US)。

使用自动主机名对 Homestead 的[按项目安装](#per-project-installation)效果最好。如果你在单个 Homestead 实例上托管多个站点，可以把你这些站点的「域名」添加到机器上的 `hosts` 文件中。`hosts` 文件会把针对 Homestead 站点的请求重定向到你的 Homestead 虚拟机。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`；在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`。你添加到该文件中的行看起来像这样：

```text
192.168.56.56  homestead.test
```

请确保列出的 IP 地址与 `Homestead.yaml` 文件中设置的 IP 地址一致。把域名添加到 `hosts` 文件并启动 Vagrant box 之后，你就可以通过 web 浏览器访问该站点了：

```shell
http://homestead.test
```

<a name="configuring-services"></a>
### 配置服务

Homestead 默认会启动若干服务；不过，你可以在配置过程中自定义启用或禁用哪些服务。例如，你可以在 `Homestead.yaml` 文件中修改 `services` 选项，启用 PostgreSQL 并禁用 MySQL：

```yaml
services:
    - enabled:
        - "postgresql"
    - disabled:
        - "mysql"
```

指定的服务会依据它们在 `enabled` 和 `disabled` 指令中的顺序来决定启动还是停止。

<a name="launching-the-vagrant-box"></a>
### 启动 Vagrant Box

按你的喜好编辑完 `Homestead.yaml` 后，在 Homestead 目录中运行 `vagrant up` 命令。Vagrant 会启动虚拟机，并自动配置你的共享文件夹和 Nginx 站点。

要销毁这台虚拟机，可以使用 `vagrant destroy` 命令。

<a name="per-project-installation"></a>
### 按项目安装

你不必在全局安装 Homestead 并让所有项目共用同一台 Homestead 虚拟机，也可以为你管理的每个项目分别配置一个 Homestead 实例。如果你希望把 `Vagrantfile` 与项目一起分发，让其他参与该项目的人克隆完仓库后立刻就能执行 `vagrant up`，那么按项目安装 Homestead 会很方便。

你可以使用 Composer 包管理器把 Homestead 安装到项目中：

```shell
composer require laravel/homestead --dev
```

Homestead 安装完成后，调用 Homestead 的 `make` 命令，为你的项目生成 `Vagrantfile` 和 `Homestead.yaml` 文件。这些文件会被放到项目根目录。`make` 命令会自动配置 `Homestead.yaml` 文件中的 `sites` 与 `folders` 指令：

```shell
# macOS / Linux...
php vendor/bin/homestead make

# Windows...
vendor\\bin\\homestead make
```

接下来，在终端中运行 `vagrant up` 命令，并在浏览器中通过 `http://homestead.test` 访问你的项目。请记住，如果你没有使用自动的[主机名解析](#hostname-resolution)，仍然需要为 `homestead.test` 或你自选域名添加一条 `/etc/hosts` 文件记录。

<a name="installing-optional-features"></a>
### 安装可选功能

可选软件通过 `Homestead.yaml` 文件中的 `features` 选项安装。大多数功能可以用布尔值启用或禁用，部分功能则允许多个配置选项：

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

你可以指定一个受支持的 Elasticsearch 版本，该版本必须是精确的版本号（主版本.次版本.补丁版本）。默认安装会创建一个名为 'homestead' 的集群。你绝不应该给 Elasticsearch 分配超过操作系统一半的内存，因此请确保你的 Homestead 虚拟机分配的内存至少是 Elasticsearch 分配量的两倍。

> [!NOTE]
> 查看 [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current)，了解如何定制你的配置。

<a name="mariadb"></a>
#### MariaDB

启用 MariaDB 会移除 MySQL 并安装 MariaDB。MariaDB 通常可以作为 MySQL 的直接替代品，因此你仍应在应用的数据库配置中使用 `mysql` 数据库驱动。

<a name="mongodb"></a>
#### MongoDB

默认的 MongoDB 安装会把数据库用户名设置为 `homestead`，对应密码设置为 `secret`。

<a name="neo4j"></a>
#### Neo4j

默认的 Neo4j 安装会把数据库用户名设置为 `homestead`，对应密码设置为 `secret`。要访问 Neo4j 浏览器，请通过 web 浏览器访问 `http://homestead.test:7474`。端口 `7687`（Bolt）、`7474`（HTTP）和 `7473`（HTTPS）已准备好为来自 Neo4j 客户端的请求提供服务。

<a name="aliases"></a>
### 别名

你可以通过修改 Homestead 目录中的 `aliases` 文件，为 Homestead 虚拟机添加 Bash 别名：

```shell
alias c='clear'
alias ..='cd ..'
```

更新 `aliases` 文件后，应当使用 `vagrant reload --provision` 命令重新配置 Homestead 虚拟机。这样可以确保你的新别名在该机器上可用。

<a name="updating-homestead"></a>
## 更新 Homestead

开始更新 Homestead 之前，请确保你已通过在 Homestead 目录中运行以下命令移除当前的虚拟机：

```shell
vagrant destroy
```

接下来，你需要更新 Homestead 源代码。如果你是通过克隆获取的仓库，可以在最初克隆仓库的位置执行以下命令：

```shell
git fetch

git pull origin release
```

这些命令会从 GitHub 仓库拉取最新的 Homestead 代码、获取最新的标签，然后检出最新的带标签发行版。你可以在 Homestead 的 [GitHub 发行版页面](https://github.com/laravel/homestead/releases)上找到最新的稳定发行版本。

如果你通过项目的 `composer.json` 文件安装的 Homestead，请确保 `composer.json` 文件中包含 `"laravel/homestead": "^12"`，然后更新你的依赖：

```shell
composer update
```

接下来，你应当使用 `vagrant box update` 命令更新 Vagrant box：

```shell
vagrant box update
```

更新 Vagrant box 后，你应当在 Homestead 目录中运行 `bash init.sh` 命令，以更新 Homestead 的额外配置文件。系统会询问你是否希望覆盖现有的 `Homestead.yaml`、`after.sh` 和 `aliases` 文件：

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

你可以在 Homestead 目录中执行 `vagrant ssh` 终端命令，通过 SSH 进入你的虚拟机。

<a name="adding-additional-sites"></a>
### 添加更多站点

Homestead 环境配置完成并运行起来后，你可能想为其它 Laravel 项目添加更多 Nginx 站点。你可以在单个 Homestead 环境中运行任意数量的 Laravel 项目。要添加额外站点，把该站点添加到你的 `Homestead.yaml` 文件中。

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
    - map: another.test
      to: /home/vagrant/project2/public
```

> [!WARNING]
> 添加站点之前，请确保已为该项目所在目录配置了[文件夹映射](#configuring-shared-folders)。

如果 Vagrant 没有自动管理你的「hosts」文件，你可能还需要把新站点添加到该文件中。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`；在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`：

```text
192.168.56.56  homestead.test
192.168.56.56  another.test
```

站点添加完成后，在 Homestead 目录中执行 `vagrant reload --provision` 终端命令。

<a name="site-types"></a>
#### 站点类型

Homestead 支持若干「类型」的站点，让你能够轻松运行并非基于 Laravel 的项目。例如，我们可以使用 `statamic` 站点类型轻松地把一个 Statamic 应用添加到 Homestead：

```yaml
sites:
    - map: statamic.test
      to: /home/vagrant/my-symfony-project/web
      type: "statamic"
```

可用的站点类型有：`apache`、`apache-proxy`、`apigility`、`expressive`、`laravel`（默认）、`proxy`（用于 nginx）、`silverstripe`、`statamic`、`symfony2`、`symfony4` 和 `zf`。

<a name="site-parameters"></a>
#### 站点参数

你可以通过 `params` 站点指令，为你的站点添加额外的 Nginx `fastcgi_param` 值：

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

你可以通过把全局环境变量添加到 `Homestead.yaml` 文件中来定义它们：

```yaml
variables:
    - key: APP_ENV
      value: local
    - key: FOO
      value: bar
```

更新 `Homestead.yaml` 文件后，务必执行 `vagrant reload --provision` 命令重新配置虚拟机。这会为所有已安装的 PHP 版本更新 PHP-FPM 配置，也会更新 `vagrant` 用户的环境。

<a name="ports"></a>
### 端口

默认情况下，以下端口会被转发到你的 Homestead 环境：

<div class="content-list" markdown="1">

- **HTTP：** 8000 &rarr; 转发到 80
- **HTTPS：** 44300 &rarr; 转发到 443

</div>

<a name="forwarding-additional-ports"></a>
#### 转发额外端口

如果需要，你可以在 `Homestead.yaml` 文件中定义一个 `ports` 配置项，把额外端口转发到 Vagrant box。更新 `Homestead.yaml` 文件后，务必执行 `vagrant reload --provision` 命令重新配置虚拟机：

```yaml
ports:
    - send: 50000
      to: 5000
    - send: 7777
      to: 777
      protocol: udp
```

下面是一份额外的 Homestead 服务端口列表，你可能希望把它们从主机映射到 Vagrant box：

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

Homestead 支持在同一台虚拟机上运行多个 PHP 版本。你可以在 `Homestead.yaml` 文件中指定某个站点使用哪个 PHP 版本。可用的 PHP 版本有："5.6"、"7.0"、"7.1"、"7.2"、"7.3"、"7.4"、"8.0"、"8.1"、"8.2" 和 "8.3"（默认）：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      php: "7.1"
```

[在你的 Homestead 虚拟机中](#connecting-via-ssh)，你可以通过 CLI 使用任意受支持的 PHP 版本：

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

你可以在 Homestead 虚拟机中执行以下命令，更改 CLI 使用的默认 PHP 版本：

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

开箱即用地，MySQL 和 PostgreSQL 都已经配置好了一个 `homestead` 数据库。要从主机上的数据库客户端连接你的 MySQL 或 PostgreSQL 数据库，请连接 `127.0.0.1` 的 `33060`（MySQL）或 `54320`（PostgreSQL）端口。两个数据库的用户名和密码都是 `homestead` / `secret`。

> [!WARNING]
> 只有在从主机连接数据库时才应使用这些非标准端口。由于 Laravel 运行在虚拟机*内部*，你会在应用的 `database` 配置文件中使用默认的 3306 和 5432 端口。

<a name="database-backups"></a>
### 数据库备份

Homestead 可以在虚拟机被销毁时自动备份你的数据库。要使用该特性，你必须使用 Vagrant 2.1.0 或更高版本。或者，如果你使用的是较旧的 Vagrant 版本，则必须安装 `vagrant-triggers` 插件。要启用自动数据库备份，把下面这行添加到你的 `Homestead.yaml` 文件中：

```yaml
backup: true
```

配置完成后，执行 `vagrant destroy` 命令时，Homestead 会把数据库导出到 `.backup/mysql_backup` 和 `.backup/postgres_backup` 目录。你可以安装 Homestead 的文件夹中找到这些目录；如果使用的是[按项目安装](#per-project-installation)方式，则可以在项目根目录中找到它们。

<a name="configuring-cron-schedules"></a>
### 配置 Cron 定时任务

Laravel 提供了一种便捷方式来[调度 cron 作业](/docs/{{version}}/scheduling)：只需调度一个每分钟运行一次的 `schedule:run` Artisan 命令。`schedule:run` 命令会检查 `routes/console.php` 文件中定义的作业计划，以确定要运行哪些定时任务。

如果你希望某个 Homestead 站点运行 `schedule:run` 命令，可以在定义该站点时把 `schedule` 选项设为 `true`：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      schedule: true
```

该站点的 cron 作业会定义在 Homestead 虚拟机的 `/etc/cron.d` 目录中。

<a name="configuring-mailpit"></a>
### 配置 Mailpit

[Mailpit](https://github.com/axllent/mailpit) 让你可以拦截发出的邮件并加以查看，而不会真正把邮件发送给收件人。要开始使用，请更新应用的 `.env` 文件，改用以下邮件设置：

```ini
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

Mailpit 配置完成后，你可以通过 `http://localhost:8025` 访问 Mailpit 仪表盘。

<a name="configuring-minio"></a>
### 配置 Minio

[Minio](https://github.com/minio/minio) 是一个开源对象存储服务器，提供兼容 Amazon S3 的 API。要安装 Minio，请在 `Homestead.yaml` 文件的 [features](#installing-optional-features) 部分添加以下配置项：

```yaml
minio: true
```

默认情况下，Minio 在 9600 端口上可用。通过访问 `http://localhost:9600` 可以打开 Minio 控制面板。默认访问密钥为 `homestead`，默认秘密密钥为 `secretkey`。访问 Minio 时，应始终使用 `us-east-1` 区域。

要使用 Minio，请确保 `.env` 文件中包含以下选项：

```ini
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_ENDPOINT=http://localhost:9600
AWS_ACCESS_KEY_ID=homestead
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
```

要预置由 Minio 支撑的「S3」存储桶，请把 `buckets` 指令添加到你的 `Homestead.yaml` 文件中。定义好存储桶后，在终端中执行 `vagrant reload --provision` 命令：

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

要在 Homestead 中运行 [Laravel Dusk](/docs/{{version}}/dusk) 测试，你应当在 Homestead 配置中启用 [`webdriver` 功能](#installing-optional-features)：

```yaml
features:
    - webdriver: true
```

启用 `webdriver` 功能后，在终端中执行 `vagrant reload --provision` 命令。

<a name="sharing-your-environment"></a>
### 共享你的环境

有时你可能希望把当前正在开发的内容分享给同事或客户。Vagrant 通过 `vagrant share` 命令内置了对这种场景的支持；不过，如果你在 `Homestead.yaml` 文件中配置了多个站点，该命令将无法正常工作。

为解决这个问题，Homestead 自带了一个 `share` 命令。要开始使用，请通过 `vagrant ssh` [SSH 进入 Homestead 虚拟机](#connecting-via-ssh)，然后执行 `share homestead.test` 命令。该命令会共享 `Homestead.yaml` 配置文件中的 `homestead.test` 站点。你也可以把 `homestead.test` 替换为你配置的任何其它站点：

```shell
share homestead.test
```

运行该命令后，你会看到一个 Ngrok 界面，其中包含活动日志以及共享站点的公开访问 URL。如果你想指定自定义区域、子域名或其它 Ngrok 运行时选项，可以把它们添加到 `share` 命令中：

```shell
share homestead.test -region=eu -subdomain=laravel
```

如果你需要通过 HTTPS 而非 HTTP 共享内容，可以使用 `sshare` 命令代替 `share`。

> [!WARNING]
> 请记住，Vagrant 本身并不安全，运行 `share` 命令会把你的虚拟机暴露到互联网上。

<a name="debugging-and-profiling"></a>
## 调试与性能分析

<a name="debugging-web-requests"></a>
### 使用 Xdebug 调试 Web 请求

Homestead 内置了对使用 [Xdebug](https://xdebug.org)进行单步调试的支持。例如，你可以在浏览器中访问某个页面，PHP 会连接到你的 IDE，从而允许你检查和修改正在运行的代码。

默认情况下，Xdebug 已经在运行，随时可以接受连接。如果需要在 CLI 上启用 Xdebug，请在 Homestead 虚拟机中执行 `sudo phpenmod xdebug` 命令。接下来，按照你的 IDE 的说明启用调试。最后，配置浏览器通过扩展或[书签小程序](https://www.jetbrains.com/phpstorm/marklets/)触发 Xdebug。

> [!WARNING]
> Xdebug 会显著拖慢 PHP 的运行速度。要禁用 Xdebug，请在 Homestead 虚拟机中运行 `sudo phpdismod xdebug` 并重启 FPM 服务。

<a name="autostarting-xdebug"></a>
#### 自动启动 Xdebug

调试向 Web 服务器发起请求的功能测试时，自动启动调试比修改测试以传递自定义请求头或 Cookie 来触发调试要方便得多。要强制 Xdebug 自动启动，请修改 Homestead 虚拟机内的 `/etc/php/7.x/fpm/conf.d/20-xdebug.ini` 文件，并添加以下配置：

```ini
; 如果 Homestead.yaml 中为 IP 地址配置了不同的子网，该地址可能有所不同...
xdebug.client_host = 192.168.10.1
xdebug.mode = debug
xdebug.start_with_request = yes
```

<a name="debugging-cli-applications"></a>
### 调试 CLI 应用

要调试 PHP CLI 应用，请在 Homestead 虚拟机中使用 `xphp` shell 别名：

```shell
xphp /path/to/script
```

<a name="profiling-applications-with-blackfire"></a>
### 使用 Blackfire 分析应用性能

[Blackfire](https://blackfire.io/docs/introduction) 是一项用于分析 Web 请求和 CLI 应用性能的服务。它提供交互式用户界面，以调用图和时间线的形式展示性能分析数据。它适用于开发、预发布和生产环境，且对终端用户没有任何性能开销。此外，Blackfire 还能对代码和 `php.ini` 配置项进行性能、质量和安全检查。

[Blackfire Player](https://blackfire.io/docs/player/index) 是一个开源的 Web 爬取、Web 测试和 Web 数据抓取应用，可以与 Blackfire 协同工作，以编排性能分析场景。

要启用 Blackfire，请在 Homestead 配置文件中使用 "features" 设置：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
```

Blackfire 的服务器凭据和客户端凭据[需要一个 Blackfire 账号](https://blackfire.io/signup)。Blackfire 提供了多种分析应用的选项，包括 CLI 工具和浏览器扩展。详情请[查阅 Blackfire 文档](https://blackfire.io/docs/php/integrations/laravel/index)。

<a name="network-interfaces"></a>
## 网络接口

`Homestead.yaml` 文件的 `networks` 属性用于配置 Homestead 虚拟机的网络接口。你可以按需配置任意数量的接口：

```yaml
networks:
    - type: "private_network"
      ip: "192.168.10.20"
```

要启用[桥接](https://developer.hashicorp.com/vagrant/docs/networking/public_network)接口，请为网络配置一个 `bridge` 设置，并把网络类型改为 `public_network`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
```

要启用 [DHCP](https://developer.hashicorp.com/vagrant/docs/networking/public_network#dhcp)，只需从配置中移除 `ip` 选项：

```yaml
networks:
    - type: "public_network"
      bridge: "en1: Wi-Fi (AirPort)"
```

要更新网络所使用的设备，可以向网络配置中添加 `dev` 选项。`dev` 的默认值为 `eth0`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
      dev: "enp2s0"
```

<a name="extending-homestead"></a>
## 扩展 Homestead

你可以通过 Homestead 目录根部的 `after.sh` 脚本来扩展 Homestead。在该文件中，你可以添加任何正确配置和定制虚拟机所需的 shell 命令。

定制 Homestead 时，Ubuntu 可能会询问你是想保留某个软件包的原始配置，还是用新的配置文件覆盖它。为避免这种情况，安装软件包时应使用以下命令，从而避免覆盖 Homestead 之前写入的任何配置：

```shell
sudo apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    install package-name
```

<a name="user-customizations"></a>
### 用户定制

与团队一起使用 Homestead 时，你可能想对 Homestead 稍作调整，以更好地适应你的个人开发风格。为此，你可以在 Homestead 目录根部（也就是包含 `Homestead.yaml` 文件的同一目录）创建一个 `user-customizations.sh` 文件。在该文件中，你可以做任何想要的定制；不过，`user-customizations.sh` 不应纳入版本控制。

<a name="provider-specific-settings"></a>
## 特定 Provider 的设置

<a name="provider-specific-virtualbox"></a>
### VirtualBox

<a name="natdnshostresolver"></a>
#### `natdnshostresolver`

默认情况下，Homestead 会把 `natdnshostresolver` 设置配置为 `on`。这允许 Homestead 使用你主机操作系统的 DNS 设置。如果你想覆盖这一行为，请把以下配置项添加到你的 `Homestead.yaml` 文件中：

```yaml
provider: virtualbox
natdnshostresolver: 'off'
```
