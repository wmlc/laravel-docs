# Laravel Homestead

- [简介](#introduction)
- [安装与配置](#installation-and-setup)
    - [第一步](#first-steps)
    - [配置 Homestead](#configuring-homestead)
    - [配置 Nginx 站点](#configuring-nginx-sites)
    - [配置服务](#configuring-services)
    - [启动 Vagrant 盒子](#launching-the-vagrant-box)
    - [按项目安装](#per-project-installation)
    - [安装可选功能](#installing-optional-features)
    - [别名](#aliases)
- [更新 Homestead](#updating-homestead)
- [日常使用](#daily-usage)
    - [通过 SSH 连接](#connecting-via-ssh)
    - [添加额外站点](#adding-additional-sites)
    - [环境变量](#environment-variables)
    - [端口](#ports)
    - [PHP 版本](#php-versions)
    - [连接数据库](#connecting-to-databases)
    - [数据库备份](#database-backups)
    - [配置 Cron 计划](#configuring-cron-schedules)
    - [配置 Mailpit](#configuring-mailpit)
    - [配置 Minio](#configuring-minio)
    - [Laravel Dusk](#laravel-dusk)
    - [共享你的环境](#sharing-your-environment)
- [调试与性能分析](#debugging-and-profiling)
    - [使用 Xdebug 调试 Web 请求](#debugging-web-requests)
    - [调试 CLI 应用](#debugging-cli-applications)
    - [使用 Blackfire 进行性能分析](#profiling-applications-with-blackfire)
- [网络接口](#network-interfaces)
- [扩展 Homestead](#extending-homestead)
- [提供商专属设置](#provider-specific-settings)
    - [VirtualBox](#provider-specific-virtualbox)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel Homestead 是一个已废弃的包，不再积极维护。[Laravel Sail](/docs/{{version}}/sail) 可用作现代的替代方案。

Laravel 致力于让整个 PHP 开发体验都令人愉悦，包括你的本地开发环境。[Laravel Homestead](https://github.com/laravel/homestead) 是一个官方的、预打包的 Vagrant 盒子，为你提供一个出色的开发环境，而无需在你的本地机器上安装 PHP、Web 服务器或任何其它服务器软件。

[Vagrant](https://www.vagrantup.com) 提供了一种简单、优雅的方式来管理和配置虚拟机。Vagrant 盒子是完全可丢弃的。如果出了问题，你可以在几分钟内销毁并重建盒子！

Homestead 可在任何 Windows、macOS 或 Linux 系统上运行，并包含 Nginx、PHP、MySQL、PostgreSQL、Redis、Memcached、Node 以及开发出色 Laravel 应用所需的其它所有软件。

> [!WARNING]
> 如果你使用的是 Windows，可能需要启用硬件虚拟化（VT-x）。它通常可以通过 BIOS 启用。如果你在 UEFI 系统上使用 Hyper-V，可能还需要额外禁用 Hyper-V 才能访问 VT-x。

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
- Node（含 Yarn、Bower、Grunt 和 Gulp）
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
## 安装与配置

<a name="first-steps"></a>
### 第一步

在启动你的 Homestead 环境之前，你必须安装 [Vagrant](https://developer.hashicorp.com/vagrant/downloads) 以及以下受支持提供商之一：

- [VirtualBox 6.1.x](https://www.virtualbox.org/wiki/Download_Old_Builds_6_1)
- [Parallels](https://www.parallels.com/products/desktop/)

所有这些软件包都为所有流行的操作系统提供易于使用的可视化安装程序。

要使用 Parallels 提供商，你需要安装 [Parallels Vagrant 插件](https://github.com/Parallels/vagrant-parallels)。它是免费的。

<a name="installing-homestead"></a>
#### 安装 Homestead

你可以通过将 Homestead 仓库克隆到你的宿主机上来安装 Homestead。考虑将仓库克隆到 "home" 目录下的 `Homestead` 文件夹中，因为 Homestead 虚拟机将作为你所有 Laravel 应用的主机。在本文档中，我们将此目录称为你的 "Homestead 目录"：

```shell
git clone https://github.com/laravel/homestead.git ~/Homestead
```

克隆 Laravel Homestead 仓库后，你应该切换到 `release` 分支。该分支始终包含 Homestead 最新的稳定发行版：

```shell
cd ~/Homestead

git checkout release
```

接下来，从 Homestead 目录执行 `bash init.sh` 命令以创建 `Homestead.yaml` 配置文件。`Homestead.yaml` 文件是你配置 Homestead 安装所有设置的地方。该文件会被放置在 Homestead 目录中：

```shell
# macOS / Linux……
bash init.sh

# Windows……
init.bat
```

<a name="configuring-homestead"></a>
### 配置 Homestead

<a name="setting-your-provider"></a>
#### 设置你的提供商

`Homestead.yaml` 文件中的 `provider` 键指示应使用哪个 Vagrant 提供商：`virtualbox` 或 `parallels`：

    provider: virtualbox

> [!WARNING]
> 如果你使用的是 Apple Silicon，则需要使用 Parallels 提供商。

<a name="configuring-shared-folders"></a>
#### 配置共享文件夹

`Homestead.yaml` 文件的 `folders` 属性列出了你希望与 Homestead 环境共享的所有文件夹。当这些文件夹中的文件发生更改时，它们会在你的本地机和 Homestead 虚拟环境之间保持同步。你可以根据需要配置任意数量的共享文件夹：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
```

> [!WARNING]
> Windows 用户不应使用 `~/` 路径语法，而应使用项目的完整路径，例如 `C:\Users\user\Code\project1`。

你应该始终将各个应用映射到它们各自的文件夹映射，而不是映射一个包含所有应用的大目录。当你映射一个文件夹时，虚拟机必须跟踪文件夹中*每一个*文件的磁盘 IO。如果你的文件夹中包含大量文件，可能会遇到性能下降：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
    - map: ~/code/project2
      to: /home/vagrant/project2
```

> [!WARNING]
> 使用 Homestead 时，你绝不应该挂载 `.`（当前目录）。这会导致 Vagrant 不将当前文件夹映射到 `/vagrant`，并会破坏可选功能，以及在 provision 期间导致意外结果。

要启用 [NFS](https://developer.hashicorp.com/vagrant/docs/synced-folders/nfs)，你可以为文件夹映射添加 `type` 选项：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
      type: "nfs"
```

> [!WARNING]
> 在 Windows 上使用 NFS 时，你应该考虑安装 [vagrant-winnfsd](https://github.com/winnfsd/vagrant-winnfsd) 插件。该插件会维护 Homestead 虚拟机中文件和目录的正确用户 / 组权限。

你也可以通过将选项列在 `options` 键下来传入 Vagrant 的 [Synced Folders](https://developer.hashicorp.com/vagrant/docs/synced-folders/basic_usage) 支持的任何选项：

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

不熟悉 Nginx？没问题。你的 `Homestead.yaml` 文件的 `sites` 属性让你可以轻松地将一个 "域名" 映射到 Homestead 环境中的一个文件夹。示例站点配置已包含在 `Homestead.yaml` 文件中。同样，你可以根据需要向 Homestead 环境添加任意数量的站点。Homestead 可以作为你正在开发的每个 Laravel 应用的便捷、虚拟化环境：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
```

如果在 provision 了 Homestead 虚拟机之后更改了 `sites` 属性，你应该执行 `vagrant reload --provision` 命令来更新虚拟机上的 Nginx 配置。

> [!WARNING]
> Homestead 脚本被构建得尽可能幂等。不过，如果你在 provision 期间遇到问题，应该通过执行 `vagrant destroy && vagrant up` 命令来销毁并重建机器。

<a name="hostname-resolution"></a>
#### 主机名解析

Homestead 使用 `mDNS` 发布主机名以实现自动主机解析。如果你在 `Homestead.yaml` 文件中设置了 `hostname: homestead`，该主机将可通过 `homestead.local` 访问。macOS、iOS 和 Linux 桌面发行版默认包含 `mDNS` 支持。如果你使用的是 Windows，你必须安装 [Bonjour Print Services for Windows](https://support.apple.com/kb/DL999?viewlocale=en_US&locale=en_US)。

使用自动主机名最适合 Homestead 的[按项目安装](#per-project-installation)。如果你在单个 Homestead 实例上托管多个站点，可以将你的网站的 "域名" 添加到你机器上的 `hosts` 文件中。`hosts` 文件会将针对你 Homestead 站点的请求重定向到你的 Homestead 虚拟机。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`。在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`。你添加到该文件中的行如下所示：

```text
192.168.56.56  homestead.test
```

确保列出的 IP 地址是你在 `Homestead.yaml` 文件中设置的那个。一旦你将域名添加到 `hosts` 文件并启动了 Vagrant 盒子，你就可以通过 Web 浏览器访问该站点：

```shell
http://homestead.test
```

<a name="configuring-services"></a>
### 配置服务

Homestead 默认启动多个服务；不过，你可以自定义在 provision 期间启用或禁用哪些服务。例如，你可以通过修改 `Homestead.yaml` 文件中的 `services` 选项来启用 PostgreSQL 并禁用 MySQL：

```yaml
services:
    - enabled:
        - "postgresql"
    - disabled:
        - "mysql"
```

指定的服务将根据其在该 `enabled` 和 `disabled` 指令中的顺序启动或停止。

<a name="launching-the-vagrant-box"></a>
### 启动 Vagrant 盒子

一旦你将 `Homestead.yaml` 编辑到满意，从你的 Homestead 目录运行 `vagrant up` 命令。Vagrant 会启动虚拟机并自动配置你的共享文件夹和 Nginx 站点。

要销毁机器，你可以使用 `vagrant destroy` 命令。

<a name="per-project-installation"></a>
### 按项目安装

除了全局安装 Homestead 并在你所有项目之间共享同一个 Homestead 虚拟机外，你也可以为你管理的每个项目配置一个 Homestead 实例。如果你希望随项目一起发布一个 `Vagrantfile`，让参与项目的其他人在克隆项目仓库后能够立即 `vagrant up`，按项目安装 Homestead 会很有好处。

你可以使用 Composer 包管理器将 Homestead 安装到你的项目中：

```shell
composer require laravel/homestead --dev
```

安装 Homestead 后，调用 Homestead 的 `make` 命令来为你的项目生成 `Vagrantfile` 和 `Homestead.yaml` 文件。这些文件会被放置在你的项目根目录中。`make` 命令会自动配置 `Homestead.yaml` 文件中的 `sites` 和 `folders` 指令：

```shell
# macOS / Linux……
php vendor/bin/homestead make

# Windows……
vendor\\bin\\homestead make
```

接下来，在你的终端中运行 `vagrant up` 命令，并在浏览器中通过 `http://homestead.test` 访问你的项目。请记住，如果你没有使用自动[主机名解析](#hostname-resolution)，你仍然需要为 `homestead.test` 或你选择的域名添加一条 `/etc/hosts` 文件记录。

<a name="installing-optional-features"></a>
### 安装可选功能

可选软件使用 `Homestead.yaml` 文件中的 `features` 选项安装。大多数功能可以通过布尔值启用或禁用，而某些功能允许多种配置选项：

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

你可以指定受支持的 Elasticsearch 版本，它必须是一个精确的版本号（主版本.次版本.修订版本）。默认安装会创建一个名为 'homestead' 的集群。你绝不应该给 Elasticsearch 超过操作系统一半的内存，因此请确保你的 Homestead 虚拟机至少有 Elasticsearch 分配值两倍的内存。

> [!NOTE]
> 查看 [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current) 以了解如何自定义你的配置。

<a name="mariadb"></a>
#### MariaDB

启用 MariaDB 会移除 MySQL 并安装 MariaDB。MariaDB 通常作为 MySQL 的替代品（drop-in replacement），因此你仍应在应用的数据库配置中使用 `mysql` 数据库驱动。

<a name="mongodb"></a>
#### MongoDB

默认的 MongoDB 安装会将数据库用户名设为 `homestead`，对应的密码设为 `secret`。

<a name="neo4j"></a>
#### Neo4j

默认的 Neo4j 安装会将数据库用户名设为 `homestead`，对应的密码设为 `secret`。要访问 Neo4j 浏览器，请通过你的 Web 浏览器访问 `http://homestead.test:7474`。端口 `7687`（Bolt）、`7474`（HTTP）和 `7473`（HTTPS）已准备好为 Neo4j 客户端提供请求服务。

<a name="aliases"></a>
### 别名

你可以通过修改 Homestead 目录中的 `aliases` 文件来向 Homestead 虚拟机添加 Bash 别名：

```shell
alias c='clear'
alias ..='cd ..'
```

更新 `aliases` 文件后，你应该使用 `vagrant reload --provision` 命令重新 provision Homestead 虚拟机。这将确保新别名在机器上可用。

<a name="updating-homestead"></a>
## 更新 Homestead

在开始更新 Homestead 之前，你应该确保在 Homestead 目录中运行以下命令移除了当前的虚拟机：

```shell
vagrant destroy
```

接下来，你需要更新 Homestead 源代码。如果你克隆了仓库，可以在你最初克隆仓库的位置执行以下命令：

```shell
git fetch

git pull origin release
```

这些命令从 GitHub 仓库拉取最新的 Homestead 代码，获取最新的标签，然后切换到最新的带标签发行版。你可以在 Homestead 的 [GitHub releases 页面](https://github.com/laravel/homestead/releases) 找到最新的稳定发行版本。

如果你是通过项目的 `composer.json` 文件安装的 Homestead，你应该确保 `composer.json` 文件包含 `"laravel/homestead": "^12"` 并更新你的依赖：

```shell
composer update
```

接下来，你应该使用 `vagrant box update` 命令更新 Vagrant 盒子：

```shell
vagrant box update
```

更新 Vagrant 盒子后，你应该从 Homestead 目录运行 `bash init.sh` 命令以更新 Homestead 的其它配置文件。系统会询问你是否希望覆盖现有的 `Homestead.yaml`、`after.sh` 和 `aliases` 文件：

```shell
# macOS / Linux……
bash init.sh

# Windows……
init.bat
```

最后，你需要重建 Homestead 虚拟机以使用最新的 Vagrant 安装：

```shell
vagrant up
```

<a name="daily-usage"></a>
## 日常使用

<a name="connecting-via-ssh"></a>
### 通过 SSH 连接

你可以通过从 Homestead 目录执行 `vagrant ssh` 终端命令来 SSH 进入你的虚拟机。

<a name="adding-additional-sites"></a>
### 添加额外站点

一旦你的 Homestead 环境已 provision 并运行，你可能希望为你的其它 Laravel 项目添加额外的 Nginx 站点。你可以在单个 Homestead 环境中运行任意数量的 Laravel 项目。要添加额外站点，请将站点添加到你的 `Homestead.yaml` 文件中。

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
    - map: another.test
      to: /home/vagrant/project2/public
```

> [!WARNING]
> 在添加站点之前，你应该确保已为该项目的目录配置了[文件夹映射](#configuring-shared-folders)。

如果 Vagrant 没有自动管理你的 "hosts" 文件，你可能还需要将新站点添加到该文件中。在 macOS 和 Linux 上，该文件位于 `/etc/hosts`。在 Windows 上，它位于 `C:\Windows\System32\drivers\etc\hosts`：

```text
192.168.56.56  homestead.test
192.168.56.56  another.test
```

添加站点后，从你的 Homestead 目录执行 `vagrant reload --provision` 终端命令。

<a name="site-types"></a>
#### 站点类型

Homestead 支持几种 "类型" 的站点，让你可以轻松运行非基于 Laravel 的项目。例如，我们可以使用 `statamic` 站点类型轻松地向 Homestead 添加一个 Statamic 应用：

```yaml
sites:
    - map: statamic.test
      to: /home/vagrant/my-symfony-project/web
      type: "statamic"
```

可用的站点类型有：`apache`、`apache-proxy`、`apigility`、`expressive`、`laravel`（默认）、`proxy`（用于 nginx）、`silverstripe`、`statamic`、`symfony2`、`symfony4` 和 `zf`。

<a name="site-parameters"></a>
#### 站点参数

你可以通过 `params` 站点指令向你的站点添加额外的 Nginx `fastcgi_param` 值：

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

你可以通过将全局环境变量添加到 `Homestead.yaml` 文件来定义它们：

```yaml
variables:
    - key: APP_ENV
      value: local
    - key: FOO
      value: bar
```

更新 `Homestead.yaml` 文件后，务必通过执行 `vagrant reload --provision` 命令重新 provision 机器。这将更新所有已安装 PHP 版本的 PHP-FPM 配置，同时更新 `vagrant` 用户的环境。

<a name="ports"></a>
### 端口

默认情况下，以下端口会被转发到你的 Homestead 环境：

<div class="content-list" markdown="1">

- **HTTP：** 8000 &rarr; 转发到 80
- **HTTPS：** 44300 &rarr; 转发到 443

</div>

<a name="forwarding-additional-ports"></a>
#### 转发额外端口

如果你愿意，可以通过在 `Homestead.yaml` 文件中定义 `ports` 配置项来向 Vagrant 盒子转发额外端口。更新 `Homestead.yaml` 文件后，务必通过执行 `vagrant reload --provision` 命令重新 provision 机器：

```yaml
ports:
    - send: 50000
      to: 5000
    - send: 7777
      to: 777
      protocol: udp
```

下面是你可能希望从宿主机映射到 Vagrant 盒子的额外 Homestead 服务端口列表：

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

Homestead 支持在同一虚拟机上运行多个版本的 PHP。你可以在 `Homestead.yaml` 文件中指定给定站点使用哪个 PHP 版本。可用的 PHP 版本有："5.6"、"7.0"、"7.1"、"7.2"、"7.3"、"7.4"、"8.0"、"8.1"、"8.2" 和 "8.3"（默认）：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      php: "7.1"
```

[在 Homestead 虚拟机内](#connecting-via-ssh)，你可以通过 CLI 使用任意受支持的 PHP 版本：

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

你可以通过在 Homestead 虚拟机内发出以下命令来更改 CLI 使用的默认 PHP 版本：

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

`homestead` 数据库开箱即用地为 MySQL 和 PostgreSQL 配置。要从你宿主机的数据库客户端连接到 MySQL 或 PostgreSQL 数据库，你应该连接到 `127.0.0.1` 的 `33060` 端口（MySQL）或 `54320` 端口（PostgreSQL）。这两个数据库的用户名和密码都是 `homestead` / `secret`。

> [!WARNING]
> 仅当从宿主机连接数据库时才应使用这些非标准端口。你将在 Laravel 应用的 `database` 配置文件中使用默认的 3306 和 5432 端口，因为 Laravel 运行在虚拟机*内部*。

<a name="database-backups"></a>
### 数据库备份

当你的 Homestead 虚拟机被销毁时，Homestead 可以自动备份你的数据库。要使用此功能，你必须使用 Vagrant 2.1.0 或更高版本。或者，如果你使用的是较旧版本的 Vagrant，则必须安装 `vagrant-triggers` 插件。要启用自动数据库备份，请将以下行添加到你的 `Homestead.yaml` 文件：

```yaml
backup: true
```

一旦配置好，当执行 `vagrant destroy` 命令时，Homestead 会将你的数据库导出到 `.backup/mysql_backup` 和 `.backup/postgres_backup` 目录。这些目录可以在你安装 Homestead 的文件夹中找到，如果你使用的是[按项目安装](#per-project-installation)方法，则可以在你项目的根目录中找到。

<a name="configuring-cron-schedules"></a>
### 配置 Cron 计划

Laravel 提供了一种便捷的方式来[调度 Cron 任务](/docs/{{version}}/scheduling)：调度一个每分钟运行的 `schedule:run` Artisan 命令。`schedule:run` 命令会检查你的 `routes/console.php` 文件中定义的任务计划，以确定要运行哪些计划任务。

如果你希望为某个 Homestead 站点运行 `schedule:run` 命令，可以在定义该站点时将 `schedule` 选项设为 `true`：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      schedule: true
```

该站点的 cron 任务将定义在 Homestead 虚拟机的 `/etc/cron.d` 目录中。

<a name="configuring-mailpit"></a>
### 配置 Mailpit

[Mailpit](https://github.com/axllent/mailpit) 让你可以拦截外发邮件并检查它，而无需真正将邮件发送给收件人。开始之前，更新应用的 `.env` 文件以使用以下邮件设置：

```ini
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

一旦配置好 Mailpit，你可以通过 `http://localhost:8025` 访问 Mailpit 仪表板。

<a name="configuring-minio"></a>
### 配置 Minio

[Minio](https://github.com/minio/minio) 是一个具有 Amazon S3 兼容 API 的开源对象存储服务器。要安装 Minio，请在 [features](#installing-optional-features) 一节中使用以下配置选项更新你的 `Homestead.yaml` 文件：

    minio: true

默认情况下，Minio 在端口 9600 上可用。你可以通过访问 `http://localhost:9600` 来访问 Minio 控制面板。默认访问密钥是 `homestead`，而默认密钥是 `secretkey`。访问 Minio 时，你应该始终使用 `us-east-1` 区域。

为了使用 Minio，请确保你的 `.env` 文件包含以下选项：

```ini
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_ENDPOINT=http://localhost:9600
AWS_ACCESS_KEY_ID=homestead
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
```

要 provision 由 Minio 提供支持的 "S3" 存储桶，请在你的 `Homestead.yaml` 文件中添加 `buckets` 指令。定义好存储桶后，你应该执行 `vagrant reload --provision` 命令：

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

为了在 Homestead 中运行 [Laravel Dusk](/docs/{{version}}/dusk) 测试，你应该启用配置中的 [webdriver 功能](#installing-optional-features)：

```yaml
features:
    - webdriver: true
```

启用 `webdriver` 功能后，你应该执行 `vagrant reload --provision` 命令。

<a name="sharing-your-environment"></a>
### 共享你的环境

有时你可能希望与同事或客户共享你当前正在处理的内容。Vagrant 通过 `vagrant share` 命令内置了对这一点的支持；不过，如果你的 `Homestead.yaml` 文件中配置了多个站点，这将无法工作。

为了解决这个问题，Homestead 包含了自己的 `share` 命令。开始之前，通过 `vagrant ssh` [SSH 进入你的 Homestead 虚拟机](#connecting-via-ssh)并执行 `share homestead.test` 命令。该命令会共享你 `Homestead.yaml` 配置文件中的 `homestead.test` 站点。你可以将 `homestead.test` 替换为任何其他已配置的站点：

```shell
share homestead.test
```

运行命令后，你会看到一个 Ngrok 屏幕出现，其中包含活动日志以及共享站点的可公开访问 URL。如果你希望指定自定义区域、子域名或其它 Ngrok 运行时选项，可以将它们添加到你的 `share` 命令中：

```shell
share homestead.test -region=eu -subdomain=laravel
```

如果你需要通过 HTTPS 而非 HTTP 共享内容，使用 `sshare` 命令代替 `share` 即可实现。

> [!WARNING]
> 请记住，Vagrant 本质上是不安全的，并且运行 `share` 命令时你正在将虚拟机暴露到互联网上。

<a name="debugging-and-profiling"></a>
## 调试与性能分析

<a name="debugging-web-requests"></a>
### 使用 Xdebug 调试 Web 请求

Homestead 包含对使用 [Xdebug](https://xdebug.org) 进行单步调试的支持。例如，你可以在浏览器中访问一个页面，PHP 会连接到你的 IDE，以便检查和修改正在运行的代码。

默认情况下，Xdebug 已经在运行并准备接受连接。如果你需要在 CLI 上启用 Xdebug，请在你的 Homestead 虚拟机中执行 `sudo phpenmod xdebug` 命令。接下来，按照你的 IDE 的说明启用调试。最后，配置你的浏览器，通过扩展或 [书签工具（bookmarklet）](https://www.jetbrains.com/phpstorm/marklets/) 来触发 Xdebug。

> [!WARNING]
> Xdebug 会导致 PHP 运行显著变慢。要禁用 Xdebug，请在你的 Homestead 虚拟机中运行 `sudo phpdismod xdebug` 并重启 FPM 服务。

<a name="autostarting-xdebug"></a>
#### 自动启动 Xdebug

在调试向 Web 服务器发起请求的 functional 测试时，自动启动调试比修改测试以传递自定义请求头或 Cookie 来触发调试要容易得多。要强制 Xdebug 自动启动，请修改 Homestead 虚拟机内的 `/etc/php/7.x/fpm/conf.d/20-xdebug.ini` 文件并添加以下配置：

```ini
; 如果 Homestead.yaml 中包含了不同的 IP 子网地址，此地址可能不同……
xdebug.client_host = 192.168.10.1
xdebug.mode = debug
xdebug.start_with_request = yes
```

<a name="debugging-cli-applications"></a>
### 调试 CLI 应用

要调试 PHP CLI 应用，请在你的 Homestead 虚拟机中使用 `xphp` shell 别名：

```shell
xphp /path/to/script
```

<a name="profiling-applications-with-blackfire"></a>
### 使用 Blackfire 进行性能分析

[Blackfire](https://blackfire.io/docs/introduction) 是一项用于分析 Web 请求和 CLI 应用的服务。它提供了一个交互式用户界面，以调用图和时间线的形式展示分析数据。它专为在开发、预发布和生产环境中使用而构建，对最终用户没有开销。此外，Blackfire 还对代码和 `php.ini` 配置设置提供性能、质量和安全检查。

[Blackfire Player](https://blackfire.io/docs/player/index) 是一个开源的 Web 爬取、Web 测试和 Web 抓取应用，它可以与 Blackfire 联合工作以编写分析场景脚本。

要启用 Blackfire，请使用 Homestead 配置文件中的 "features" 设置：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
```

Blackfire 服务器凭据和客户端凭据[需要 Blackfire 账户](https://blackfire.io/signup)。Blackfire 提供了多种分析应用的选项，包括 CLI 工具和浏览器扩展。请[查阅 Blackfire 文档了解更多详情](https://blackfire.io/docs/php/integrations/laravel/index)。

<a name="network-interfaces"></a>
## 网络接口

`Homestead.yaml` 文件的 `networks` 属性为你的 Homestead 虚拟机配置网络接口。你可以根据需要配置任意数量的接口：

```yaml
networks:
    - type: "private_network"
      ip: "192.168.10.20"
```

要启用 [桥接（bridged）](https://developer.hashicorp.com/vagrant/docs/networking/public_network) 接口，请为该网络配置 `bridge` 设置，并将网络类型更改为 `public_network`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
```

要启用 [DHCP](https://developer.hashicorp.com/vagrant/docs/networking/public_network#dhcp)，只需从你的配置中移除 `ip` 选项：

```yaml
networks:
    - type: "public_network"
      bridge: "en1: Wi-Fi (AirPort)"
```

要更新网络正在使用的设备，你可以为该网络的配置添加 `dev` 选项。默认的 `dev` 值是 `eth0`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
      dev: "enp2s0"
```

<a name="extending-homestead"></a>
## 扩展 Homestead

你可以使用 Homestead 目录根目录下的 `after.sh` 脚本来扩展 Homestead。在该文件中，你可以添加任何必要的 shell 命令来正确配置和自定义你的虚拟机。

在自定义 Homestead 时，Ubuntu 可能会询问你是想保留包的原有配置还是用新配置文件覆盖它。为避免这种情况，你在安装包时应使用以下命令，以避免覆盖 Homestead 之前写入的任何配置：

```shell
sudo apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    install package-name
```

<a name="user-customizations"></a>
### 用户自定义

当你与团队一起使用 Homestead 时，你可能希望调整 Homestead 以更好地契合你个人的开发风格。为此，你可以在 Homestead 目录的根目录（与包含 `Homestead.yaml` 文件的同一目录）中创建一个 `user-customizations.sh` 文件。在该文件中，你可以进行任何你想要的自定义；不过，`user-customizations.sh` 不应纳入版本控制。

<a name="provider-specific-settings"></a>
## 提供商专属设置

<a name="provider-specific-virtualbox"></a>
### VirtualBox

<a name="natdnshostresolver"></a>
#### `natdnshostresolver`

默认情况下，Homestead 将 `natdnshostresolver` 设置配置为 `on`。这让 Homestead 可以使用你宿主机的 DNS 设置。如果你想覆盖此行为，请将以下配置选项添加到你的 `Homestead.yaml` 文件：

```yaml
provider: virtualbox
natdnshostresolver: 'off'
```
