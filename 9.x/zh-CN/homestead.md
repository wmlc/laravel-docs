# Laravel Homestead

- [简介](#introduction)
- [安装与设置](#installation-and-setup)
    - [初始步骤](#first-steps)
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
    - [添加额外站点](#adding-additional-sites)
    - [环境变量](#environment-variables)
    - [端口](#ports)
    - [PHP 版本](#php-versions)
    - [连接数据库](#connecting-to-databases)
    - [创建数据库](#creating-databases)
    - [数据库备份](#database-backups)
    - [配置 Cron 计划任务](#configuring-cron-schedules)
    - [配置 MailHog](#configuring-mailhog)
    - [配置 Minio](#configuring-minio)
    - [Laravel Dusk](#laravel-dusk)
    - [共享你的环境](#sharing-your-environment)
- [调试与分析](#debugging-and-profiling)
    - [使用 Xdebug 调试 Web 请求](#debugging-web-requests)
    - [调试 CLI 应用](#debugging-cli-applications)
    - [使用 Blackfire 分析应用](#profiling-applications-with-blackfire)
- [网络接口](#network-interfaces)
- [扩展 Homestead](#extending-homestead)
- [提供商特定设置](#provider-specific-settings)
    - [VirtualBox](#provider-specific-virtualbox)

<a name="introduction"></a>
## 简介

Laravel 致力于让整个 PHP 开发体验令人愉悦，包括你的本地开发环境。[Laravel Homestead](https://github.com/laravel/homestead) 是一个官方的预打包 Vagrant box，为你提供了出色的开发环境，无需在本地机器上安装 PHP、Web 服务器和其他服务器软件。

[Vagrant](https://www.vagrantup.com) 提供了一种简单、优雅的方式来管理和配置虚拟机。Vagrant box 是完全可丢弃的。如果出现问题，你可以在几分钟内销毁并重新创建 box！

Homestead 可运行于任何 Windows、macOS 或 Linux 系统，并包含 Nginx、PHP、MySQL、PostgreSQL、Redis、Memcached、Node 以及开发出色 Laravel 应用所需的所有其他软件。

> **Warning**
> 如果你使用 Windows，可能需要启用硬件虚拟化（VT-x）。通常可以通过 BIOS 启用。如果你在 UEFI 系统上使用 Hyper-V，可能还需要禁用 Hyper-V 才能访问 VT-x。

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

- Ubuntu 20.04
- Git
- PHP 8.2 (Default)
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
- Node 18 (With Yarn, Bower, Grunt, and Gulp)
- Redis
- Memcached
- Beanstalkd
- Mailhog
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
- Heroku CLI
- InfluxDB
- MariaDB
- Meilisearch
- MinIO
- MongoDB
- Neo4j
- Oh My Zsh
- Open Resty
- PM2
- Python 3
- R
- RabbitMQ
- RVM (Ruby Version Manager)
- Solr
- TimescaleDB
- Trader <small>(PHP extension)</small>
- Webdriver & Laravel Dusk Utilities

</div>

<a name="installation-and-setup"></a>
## 安装与设置

<a name="first-steps"></a>
### 初始步骤

在启动 Homestead 环境之前，你必须安装 [Vagrant](https://developer.hashicorp.com/vagrant/downloads) 以及以下受支持的提供商之一：

- [VirtualBox 6.1.x](https://www.virtualbox.org/wiki/Downloads)
- [Parallels](https://www.parallels.com/products/desktop/)

所有这些软件包都为所有主流操作系统提供了易于使用的可视化安装程序。

要使用 Parallels 提供商，你需要安装 [Parallels Vagrant 插件](https://github.com/Parallels/vagrant-parallels)。它是免费的。

<a name="installing-homestead"></a>
#### 安装 Homestead

你可以通过将 Homestead 仓库克隆到主机上来安装 Homestead。建议将仓库克隆到「home」目录下的 `Homestead` 文件夹中，因为 Homestead 虚拟机将作为所有 Laravel 应用的主机。在本文档中，我们将此目录称为你的「Homestead 目录」：

```shell
git clone https://github.com/laravel/homestead.git ~/Homestead
```

克隆 Laravel Homestead 仓库后，你应当检出 `release` 分支。此分支始终包含最新的 Homestead 稳定版本：

```shell
cd ~/Homestead

git checkout release
```

接下来，从 Homestead 目录执行 `bash init.sh` 命令来创建 `Homestead.yaml` 配置文件。`Homestead.yaml` 文件是你配置 Homestead 安装所有设置的地方。此文件将放置在 Homestead 目录中：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

<a name="configuring-homestead"></a>
### 配置 Homestead

<a name="setting-your-provider"></a>
#### 设置提供商

`Homestead.yaml` 文件中的 `provider` 键指示应使用哪个 Vagrant 提供商：`virtualbox` 或 `parallels`：

    provider: virtualbox

> **Warning**
> 如果你使用 Apple Silicon，应当在 `Homestead.yaml` 文件中添加 `box: laravel/homestead-arm`。Apple Silicon 需要使用 Parallels 提供商。

<a name="configuring-shared-folders"></a>
#### 配置共享文件夹

`Homestead.yaml` 文件的 `folders` 属性列出了你希望与 Homestead 环境共享的所有文件夹。当这些文件夹中的文件发生变化时，它们将在本地机器和 Homestead 虚拟环境之间保持同步。你可以根据需要配置任意数量的共享文件夹：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
```

> **Warning**
> Windows 用户不应使用 `~/` 路径语法，而应使用项目的完整路径，如 `C:\Users\user\Code\project1`。

你应当始终将各个应用映射到其自己的文件夹映射，而不是映射一个包含所有应用的大型目录。映射文件夹时，虚拟机必须跟踪文件夹中*每个*文件的所有磁盘 IO。如果文件夹中有大量文件，你可能会遇到性能下降：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
    - map: ~/code/project2
      to: /home/vagrant/project2
```

> **Warning**
> 使用 Homestead 时，你永远不应当挂载 `.`（当前目录）。这会导致 Vagrant 不将当前文件夹映射到 `/vagrant`，并会破坏可选功能，在配置期间导致意外结果。

要启用 [NFS](https://www.vagrantup.com/docs/synced-folders/nfs.html)，你可以在文件夹映射中添加 `type` 选项：

```yaml
folders:
    - map: ~/code/project1
      to: /home/vagrant/project1
      type: "nfs"
```

> **Warning**
> 在 Windows 上使用 NFS 时，你应当考虑安装 [vagrant-winnfsd](https://github.com/winnfsd/vagrant-winnfsd) 插件。此插件将为 Homestead 虚拟机中的文件和目录维护正确的用户/组权限。

你还可以通过在 `options` 键下列出 Vagrant [同步文件夹](https://www.vagrantup.com/docs/synced-folders/basic_usage.html)支持的任何选项来传递它们：

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

不熟悉 Nginx？没问题。`Homestead.yaml` 文件的 `sites` 属性允许你轻松地将「域名」映射到 Homestead 环境上的文件夹。`Homestead.yaml` 文件中包含了一个示例站点配置。同样，你可以根据需要向 Homestead 环境添加任意数量的站点。Homestead 可以作为你正在开发的每个 Laravel 应用的便捷虚拟化环境：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
```

如果在配置 Homestead 虚拟机后更改了 `sites` 属性，你应当在终端执行 `vagrant reload --provision` 命令来更新虚拟机上的 Nginx 配置。

> **Warning**
> Homestead 脚本尽可能构建为幂等的。但是，如果在配置期间遇到问题，你应当通过执行 `vagrant destroy && vagrant up` 命令来销毁并重建机器。

<a name="hostname-resolution"></a>
#### 主机名解析

Homestead 使用 `mDNS` 发布主机名以实现自动主机解析。如果在 `Homestead.yaml` 文件中设置 `hostname: homestead`，主机将通过 `homestead.local` 访问。macOS、iOS 和 Linux 桌面发行版默认包含 `mDNS` 支持。如果你使用 Windows，必须安装 [Bonjour Print Services for Windows](https://support.apple.com/kb/DL999?viewlocale=en_US&locale=en_US)。

使用自动主机名最适合 Homestead 的[按项目安装](#per-project-installation)。如果在单个 Homestead 实例上托管多个站点，你可以将网站的「域名」添加到机器上的 `hosts` 文件中。`hosts` 文件会将 Homestead 站点的请求重定向到你的 Homestead 虚拟机。在 macOS 和 Linux 上，此文件位于 `/etc/hosts`。在 Windows 上，位于 `C:\Windows\System32\drivers\etc\hosts`。你添加到此文件的行如下所示：

    192.168.56.56  homestead.test

确保列出的 IP 地址是 `Homestead.yaml` 文件中设置的地址。将域名添加到 `hosts` 文件并启动 Vagrant box 后，你就可以通过浏览器访问站点：

```shell
http://homestead.test
```

<a name="configuring-services"></a>
### 配置服务

Homestead 默认启动多个服务；但是，你可以自定义配置期间启用或禁用哪些服务。例如，你可以通过修改 `Homestead.yaml` 文件中的 `services` 选项来启用 PostgreSQL 并禁用 MySQL：

```yaml
services:
    - enabled:
        - "postgresql"
    - disabled:
        - "mysql"
```

指定的服务将根据其在 `enabled` 和 `disabled` 指令中的顺序启动或停止。

<a name="launching-the-vagrant-box"></a>
### 启动 Vagrant Box

按照你的喜好编辑 `Homestead.yaml` 后，从 Homestead 目录运行 `vagrant up` 命令。Vagrant 将启动虚拟机并自动配置共享文件夹和 Nginx 站点。

要销毁机器，可以使用 `vagrant destroy` 命令。

<a name="per-project-installation"></a>
### 按项目安装

你可以不全局安装 Homestead 并在所有项目中共享同一个 Homestead 虚拟机，而是为每个项目配置一个 Homestead 实例。如果你希望随项目附带 `Vagrantfile`，让其他参与者在克隆项目仓库后立即 `vagrant up`，按项目安装 Homestead 会很有益。

你可以使用 Composer 包管理器将 Homestead 安装到项目中：

```shell
composer require laravel/homestead --dev
```

安装 Homestead 后，调用 Homestead 的 `make` 命令为项目生成 `Vagrantfile` 和 `Homestead.yaml` 文件。这些文件将放置在项目根目录中。`make` 命令会自动配置 `Homestead.yaml` 文件中的 `sites` 和 `folders` 指令：

```shell
# macOS / Linux...
php vendor/bin/homestead make

# Windows...
vendor\\bin\\homestead make
```

接下来，在终端运行 `vagrant up` 命令，并在浏览器中通过 `http://homestead.test` 访问项目。请记住，如果不使用自动[主机名解析](#hostname-resolution)，你仍需为 `homestead.test` 或你选择的域名添加 `/etc/hosts` 文件条目。

<a name="installing-optional-features"></a>
### 安装可选功能

可选软件使用 `Homestead.yaml` 文件中的 `features` 选项安装。大多数功能可以通过布尔值启用或禁用，而某些功能允许多个配置选项：

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
    - elasticsearch:
        version: 7.9.0
    - eventstore: true
        version: 21.2.0
    - flyway: true
    - gearman: true
    - golang: true
    - grafana: true
    - heroku: true
    - influxdb: true
    - mariadb: true
    - meilisearch: true
    - minio: true
    - mongodb: true
    - mysql: true
    - neo4j: true
    - ohmyzsh: true
    - openresty: true
    - pm2: true
    - python: true
    - r-base: true
    - rabbitmq: true
    - rvm: true
    - solr: true
    - timescaledb: true
    - trader: true
    - webdriver: true
```

<a name="elasticsearch"></a>
#### Elasticsearch

你可以指定受支持的 Elasticsearch 版本，必须是确切的版本号（major.minor.patch）。默认安装将创建名为 'homestead' 的集群。你永远不应给 Elasticsearch 分配超过操作系统一半的内存，因此请确保 Homestead 虚拟机至少有 Elasticsearch 分配量的两倍内存。

> **Note**
> 查看 [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current)了解如何自定义配置。

<a name="mariadb"></a>
#### MariaDB

启用 MariaDB 将移除 MySQL 并安装 MariaDB。MariaDB 通常作为 MySQL 的直接替代品，因此你仍应在应用的数据库配置中使用 `mysql` 数据库驱动：

```yaml
features:
  - mariadb: true
```

<a name="mongodb"></a>
#### MongoDB

默认的 MongoDB 安装会将数据库用户名设置为 `homestead`，对应密码设置为 `secret`。

<a name="neo4j"></a>
#### Neo4j

默认的 Neo4j 安装会将数据库用户名设置为 `homestead`，对应密码设置为 `secret`。要访问 Neo4j 浏览器，通过浏览器访问 `http://homestead.test:7474`。端口 `7687`（Bolt）、`7474`（HTTP）和 `7473`（HTTPS）已准备好为 Neo4j 客户端提供服务。

<a name="aliases"></a>
### 别名

你可以通过修改 Homestead 目录中的 `aliases` 文件来向 Homestead 虚拟机添加 Bash 别名：

```shell
alias c='clear'
alias ..='cd ..'
```

更新 `aliases` 文件后，你应当使用 `vagrant reload --provision` 命令重新配置 Homestead 虚拟机。这将确保新别名在机器上可用。

<a name="updating-homestead"></a>
## 更新 Homestead

开始更新 Homestead 之前，你应当确保通过在 Homestead 目录中运行以下命令来移除当前虚拟机：

```shell
vagrant destroy
```

接下来，你需要更新 Homestead 源代码。如果你克隆了仓库，可以在最初克隆仓库的位置执行以下命令：

```shell
git fetch

git pull origin release
```

这些命令从 GitHub 仓库拉取最新的 Homestead 代码，获取最新标签，然后检出最新的标记版本。你可以在 Homestead 的 [GitHub 发布页面](https://github.com/laravel/homestead/releases)找到最新的稳定版本。

如果你通过项目的 `composer.json` 文件安装了 Homestead，你应当确保 `composer.json` 文件包含 `"laravel/homestead": "^12"` 并更新依赖：

```shell
composer update
```

接下来，你应当使用 `vagrant box update` 命令更新 Vagrant box：

```shell
vagrant box update
```

更新 Vagrant box 后，你应当从 Homestead 目录运行 `bash init.sh` 命令来更新 Homestead 的额外配置文件。系统会询问你是否希望覆盖现有的 `Homestead.yaml`、`after.sh` 和 `aliases` 文件：

```shell
# macOS / Linux...
bash init.sh

# Windows...
init.bat
```

最后，你需要重新生成 Homestead 虚拟机以使用最新的 Vagrant 安装：

```shell
vagrant up
```

<a name="daily-usage"></a>
## 日常使用

<a name="connecting-via-ssh"></a>
### 通过 SSH 连接

你可以从 Homestead 目录执行 `vagrant ssh` 终端命令来 SSH 连接到虚拟机。

<a name="adding-additional-sites"></a>
### 添加额外站点

Homestead 环境配置并运行后，你可能希望为其他 Laravel 项目添加额外的 Nginx 站点。你可以在单个 Homestead 环境上运行任意数量的 Laravel 项目。要添加额外站点，请将站点添加到 `Homestead.yaml` 文件中。

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
    - map: another.test
      to: /home/vagrant/project2/public
```

> **Warning**
> 在添加站点之前，你应当确保已为项目目录配置了[文件夹映射](#configuring-shared-folders)。

如果 Vagrant 没有自动管理你的「hosts」文件，你可能还需要将新站点添加到该文件中。在 macOS 和 Linux 上，此文件位于 `/etc/hosts`。在 Windows 上，位于 `C:\Windows\System32\drivers\etc\hosts`：

    192.168.56.56  homestead.test
    192.168.56.56  another.test

添加站点后，从 Homestead 目录执行 `vagrant reload --provision` 终端命令。

<a name="site-types"></a>
#### 站点类型

Homestead 支持多种「类型」的站点，允许你轻松运行非基于 Laravel 的项目。例如，我们可以使用 `statamic` 站点类型轻松将 Statamic 应用添加到 Homestead：

```yaml
sites:
    - map: statamic.test
      to: /home/vagrant/my-symfony-project/web
      type: "statamic"
```

可用的站点类型有：`apache`、`apigility`、`expressive`、`laravel`（默认）、`proxy`、`silverstripe`、`statamic`、`symfony2`、`symfony4` 和 `zf`。

<a name="site-parameters"></a>
#### 站点参数

你可以通过 `params` 站点指令向站点添加额外的 Nginx `fastcgi_param` 值：

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

更新 `Homestead.yaml` 文件后，务必通过执行 `vagrant reload --provision` 命令重新配置机器。这将更新所有已安装 PHP 版本的 PHP-FPM 配置，并更新 `vagrant` 用户的环境。

<a name="ports"></a>
### 端口

默认情况下，以下端口转发到你的 Homestead 环境：

- **HTTP:** 8000 &rarr; 转发到 80
- **HTTPS:** 44300 &rarr; 转发到 443

<a name="forwarding-additional-ports"></a>
#### 转发额外端口

如果需要，你可以通过在 `Homestead.yaml` 文件中定义 `ports` 配置条目来向 Vagrant box 转发额外端口。更新 `Homestead.yaml` 文件后，务必通过执行 `vagrant reload --provision` 命令重新配置机器：

```yaml
ports:
    - send: 50000
      to: 5000
    - send: 7777
      to: 777
      protocol: udp
```

以下是你可能希望从主机映射到 Vagrant box 的额外 Homestead 服务端口列表：

- **SSH:** 2222 &rarr; 到 22
- **ngrok UI:** 4040 &rarr; 到 4040
- **MySQL:** 33060 &rarr; 到 3306
- **PostgreSQL:** 54320 &rarr; 到 5432
- **MongoDB:** 27017 &rarr; 到 27017
- **Mailhog:** 8025 &rarr; 到 8025
- **Minio:** 9600 &rarr; 到 9600

<a name="php-versions"></a>
### PHP 版本

Homestead 支持在同一虚拟机上运行多个 PHP 版本。你可以在 `Homestead.yaml` 文件中为给定站点指定要使用的 PHP 版本。可用的 PHP 版本有："5.6"、"7.0"、"7.1"、"7.2"、"7.3"、"7.4"、"8.0"、"8.1" 和 "8.2"（默认）：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      php: "7.4"
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
```

你还可以在 `Homestead.yaml` 文件中指定 CLI 应使用的 PHP 版本：

```yaml
php: 8.0
```

或者，你可以通过在 Homestead 虚拟机内执行以下命令来手动更改：

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
```

<a name="connecting-to-databases"></a>
### 连接数据库

开箱即用，为 MySQL 和 PostgreSQL 都配置了 `homestead` 数据库。要从主机的数据库客户端连接到 MySQL 或 PostgreSQL 数据库，你应当连接到 `127.0.0.1` 的 `33060` 端口（MySQL）或 `54320` 端口（PostgreSQL）。两个数据库的用户名和密码都是 `homestead` / `secret`。

> **Warning**
> 你应当仅在从主机连接数据库时使用这些非标准端口。在 Laravel 应用的 `database` 配置文件中，你将使用默认的 3306 和 5432 端口，因为 Laravel 运行在虚拟机_内部_。

<a name="creating-databases"></a>
### 创建数据库

Homestead 可以自动创建应用所需的任何数据库。如果在配置过程中数据库服务正在运行，Homestead 将确保 `Homestead.yaml` 配置文件中的每个数据库在不存在时被创建：

```yaml
databases:
  - database_1
  - database_2
```

<a name="database-backups"></a>
### 数据库备份

当 Homestead 虚拟机被销毁时，Homestead 可以自动备份你的数据库。要使用此功能，你必须使用 Vagrant 2.1.0 或更高版本。或者，如果你使用较旧版本的 Vagrant，必须安装 `vagrant-triggers` 插件。要启用自动数据库备份，请在 `Homestead.yaml` 文件中添加以下行：

    backup: true

配置后，当执行 `vagrant destroy` 命令时，Homestead 会将数据库导出到 `.backup/mysql_backup` 和 `.backup/postgres_backup` 目录。这些目录可以在安装 Homestead 的文件夹中找到，如果使用[按项目安装](#per-project-installation)方法，则在项目根目录中。

<a name="configuring-cron-schedules"></a>
### 配置 Cron 计划任务

Laravel 提供了一种便捷的方式来[调度 cron 任务](/docs/{{version}}/scheduling)，只需将单个 `schedule:run` Artisan 命令调度为每分钟运行。`schedule:run` 命令将检查 `App\Console\Kernel` 类中定义的任务调度，以确定要运行哪些计划任务。

如果你希望为 Homestead 站点运行 `schedule:run` 命令，可以在定义站点时将 `schedule` 选项设置为 `true`：

```yaml
sites:
    - map: homestead.test
      to: /home/vagrant/project1/public
      schedule: true
```

站点的 cron 任务将定义在 Homestead 虚拟机的 `/etc/cron.d` 目录中。

<a name="configuring-mailhog"></a>
### 配置 MailHog

[MailHog](https://github.com/mailhog/MailHog) 允许你拦截外发邮件并检查它，而无需实际将邮件发送给收件人。要开始使用，请更新应用的 `.env` 文件以使用以下邮件设置：

```ini
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

配置 MailHog 后，你可以通过 `http://localhost:8025` 访问 MailHog 仪表板。

<a name="configuring-minio"></a>
### 配置 Minio

[Minio](https://github.com/minio/minio) 是一个具有 Amazon S3 兼容 API 的开源对象存储服务器。要安装 Minio，请在 `Homestead.yaml` 文件的 [features](#installing-optional-features) 部分添加以下配置选项：

    minio: true

默认情况下，Minio 可通过端口 9600 访问。你可以通过访问 `http://localhost:9600` 来访问 Minio 控制面板。默认访问密钥为 `homestead`，默认密钥为 `secretkey`。访问 Minio 时，你应当始终使用区域 `us-east-1`。

要使用 Minio，你需要调整应用 `config/filesystems.php` 配置文件中的 S3 磁盘配置。你需要在磁盘配置中添加 `use_path_style_endpoint` 选项，并将 `url` 键更改为 `endpoint`：

    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
        'endpoint' => env('AWS_URL'),
        'use_path_style_endpoint' => true,
    ]

最后，确保 `.env` 文件具有以下选项：

```ini
AWS_ACCESS_KEY_ID=homestead
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
AWS_URL=http://localhost:9600
```

要配置 Minio 驱动的「S3」存储桶，请在 `Homestead.yaml` 文件中添加 `buckets` 指令。定义存储桶后，你应当在终端执行 `vagrant reload --provision` 命令：

```yaml
buckets:
    - name: your-bucket
      policy: public
    - name: your-private-bucket
      policy: none
```

支持的 `policy` 值包括：`none`、`download`、`upload` 和 `public`。

<a name="laravel-dusk"></a>
### Laravel Dusk

要在 Homestead 中运行 [Laravel Dusk](/docs/{{version}}/dusk) 测试，你应当在 Homestead 配置中启用 [`webdriver` 功能](#installing-optional-features)：

```yaml
features:
    - webdriver: true
```

启用 `webdriver` 功能后，你应当在终端执行 `vagrant reload --provision` 命令。

<a name="sharing-your-environment"></a>
### 共享你的环境

有时你可能希望与同事或客户分享你当前正在进行的工作。Vagrant 通过 `vagrant share` 命令内置支持此功能；但是，如果 `Homestead.yaml` 文件中配置了多个站点，这将无法工作。

为解决此问题，Homestead 包含了自己的 `share` 命令。要开始使用，通过 `vagrant ssh` [SSH 连接到 Homestead 虚拟机](#connecting-via-ssh)并执行 `share homestead.test` 命令。此命令将从 `Homestead.yaml` 配置文件中共享 `homestead.test` 站点。你可以用其他配置的站点替换 `homestead.test`：

```shell
share homestead.test
```

运行命令后，你将看到一个 Ngrok 界面，其中包含活动日志和共享站点的公开访问 URL。如果你想指定自定义区域、子域或其他 Ngrok 运行时选项，可以将它们添加到 `share` 命令中：

```shell
share homestead.test -region=eu -subdomain=laravel
```

> **Warning**
> 请记住，Vagrant 本质上是不安全的，运行 `share` 命令时你正在将虚拟机暴露到互联网。

<a name="debugging-and-profiling"></a>
## 调试与分析

<a name="debugging-web-requests"></a>
### 使用 Xdebug 调试 Web 请求

Homestead 包含使用 [Xdebug](https://xdebug.org) 进行步骤调试的支持。例如，你可以在浏览器中访问页面，PHP 将连接到你的 IDE，允许检查和修改运行中的代码。

默认情况下，Xdebug 已在运行并准备好接受连接。如果你需要在 CLI 上启用或禁用 Xdebug，请在 Homestead 虚拟机内执行 `sudo phpenmod xdebug` 或 `sudo phpdismod xdebug` 命令。

接下来，按照 IDE 的说明启用调试。最后，配置浏览器通过扩展或[书签](https://www.jetbrains.com/phpstorm/marklets/)触发 Xdebug。

> **Warning**
> Xdebug 会导致 PHP 运行速度显著降低。要禁用 Xdebug，请在 Homestead 虚拟机内运行 `sudo phpdismod xdebug` 并重启 FPM 服务。

<a name="autostarting-xdebug"></a>
#### 自动启动 Xdebug

在调试向 Web 服务器发起请求的功能测试时，自动启动调试比修改测试以通过自定义头或 Cookie 触发调试更容易。要强制 Xdebug 自动启动，请修改 Homestead 虚拟机内的 `/etc/php/7.x/fpm/conf.d/20-xdebug.ini` 文件并添加以下配置：

```ini
; 如果 Homestead.yaml 包含不同的 IP 地址子网，此地址可能不同...
xdebug.client_host = 192.168.10.1
xdebug.mode = debug
xdebug.start_with_request = yes
```

<a name="debugging-cli-applications"></a>
### 调试 CLI 应用

要调试 PHP CLI 应用，请在 Homestead 虚拟机内使用 `xphp` shell 别名：

    xphp /path/to/script

<a name="profiling-applications-with-blackfire"></a>
### 使用 Blackfire 分析应用

[Blackfire](https://blackfire.io/docs/introduction) 是一个用于分析 Web 请求和 CLI 应用的服务。它提供了交互式用户界面，以调用图和时间线显示分析数据。它专为开发、预发布和生产环境使用而构建，对最终用户没有开销。此外，Blackfire 对代码和 `php.ini` 配置设置提供性能、质量和安全检查。

[Blackfire Player](https://blackfire.io/docs/player/index) 是一个开源的 Web 爬取、Web 测试和 Web 抓取应用，可与 Blackfire 协同工作以编写分析场景。

要启用 Blackfire，请在 Homestead 配置文件中使用「features」设置：

```yaml
features:
    - blackfire:
        server_id: "server_id"
        server_token: "server_value"
        client_id: "client_id"
        client_token: "client_value"
```

Blackfire 服务器凭证和客户端凭证[需要 Blackfire 账户](https://blackfire.io/signup)。Blackfire 提供了多种分析应用的选项，包括 CLI 工具和浏览器扩展。请[查看 Blackfire 文档了解更多详情](https://blackfire.io/docs/php/integrations/laravel/index)。

<a name="network-interfaces"></a>
## 网络接口

`Homestead.yaml` 文件的 `networks` 属性为 Homestead 虚拟机配置网络接口。你可以根据需要配置任意数量的接口：

```yaml
networks:
    - type: "private_network"
      ip: "192.168.10.20"
```

要启用[桥接](https://www.vagrantup.com/docs/networking/public_network.html)接口，请为网络配置 `bridge` 设置并将网络类型更改为 `public_network`：

```yaml
networks:
    - type: "public_network"
      ip: "192.168.10.20"
      bridge: "en1: Wi-Fi (AirPort)"
```

要启用 [DHCP](https://www.vagrantup.com/docs/networking/public_network.html)，只需从配置中移除 `ip` 选项：

```yaml
networks:
    - type: "public_network"
      bridge: "en1: Wi-Fi (AirPort)"
```

<a name="extending-homestead"></a>
## 扩展 Homestead

你可以使用 Homestead 目录根目录中的 `after.sh` 脚本来扩展 Homestead。在此文件中，你可以添加正确配置和自定义虚拟机所需的任何 shell 命令。

自定义 Homestead 时，Ubuntu 可能会询问你是否希望保留软件包的原始配置或用新配置文件覆盖它。为避免这种情况，你应当在安装软件包时使用以下命令，以避免覆盖 Homestead 之前编写的任何配置：

```shell
sudo apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    install package-name
```

<a name="user-customizations"></a>
### 用户自定义

与团队一起使用 Homestead 时，你可能希望调整 Homestead 以更好地适应你的个人开发风格。为此，你可以在 Homestead 目录根目录（包含 `Homestead.yaml` 文件的同一目录）中创建 `user-customizations.sh` 文件。在此文件中，你可以进行任何你想要的自定义；但是，`user-customizations.sh` 不应纳入版本控制。

<a name="provider-specific-settings"></a>
## 提供商特定设置

<a name="provider-specific-virtualbox"></a>
### VirtualBox

<a name="natdnshostresolver"></a>
#### `natdnshostresolver`

默认情况下，Homestead 将 `natdnshostresolver` 设置配置为 `on`。这允许 Homestead 使用主机操作系统的 DNS 设置。如果你想覆盖此行为，请在 `Homestead.yaml` 文件中添加以下配置选项：

```yaml
provider: virtualbox
natdnshostresolver: 'off'
```

<a name="symbolic-links-on-windows"></a>
#### Windows 上的符号链接

如果符号链接在 Windows 机器上无法正常工作，你可能需要在 `Vagrantfile` 中添加以下代码块：

```ruby
config.vm.provider "virtualbox" do |v|
    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
end
```
