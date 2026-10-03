# Laravel Valet

- [简介](#introduction)
- [安装](#installation)
    - [升级 Valet](#upgrading-valet)
- [服务站点](#serving-sites)
    - [`park` 命令](#the-park-command)
    - [`link` 命令](#the-link-command)
    - [使用 TLS 保护站点](#securing-sites)
    - [服务默认站点](#serving-a-default-site)
    - [每站点 PHP 版本](#per-site-php-versions)
- [共享站点](#sharing-sites)
    - [通过 Ngrok 共享站点](#sharing-sites-via-ngrok)
    - [通过 Expose 共享站点](#sharing-sites-via-expose)
    - [在本地网络上共享站点](#sharing-sites-on-your-local-network)
- [站点特定环境变量](#site-specific-environment-variables)
- [代理服务](#proxying-services)
- [自定义 Valet 驱动](#custom-valet-drivers)
    - [本地驱动](#local-drivers)
- [其他 Valet 命令](#other-valet-commands)
- [Valet 目录与文件](#valet-directories-and-files)
    - [磁盘访问](#disk-access)

<a name="introduction"></a>
## 简介

[Laravel Valet](https://github.com/laravel/valet) 是面向 macOS 极简主义者的开发环境。Laravel Valet 将你的 Mac 配置为在机器启动时始终在后台运行 [Nginx](https://www.nginx.com/)。然后，使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq)，Valet 将 `*.test` 域上的所有请求代理到指向安装在本地机器上的站点。

换句话说，Valet 是一个极速的 Laravel 开发环境，使用约 7 MB 的内存。Valet 不是 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead) 的完全替代品，但如果你想要灵活的基础功能、偏好极致速度或在内存有限的机器上工作，它提供了一个很好的替代方案。

开箱即用的 Valet 支持包括但不限于：

<style>
    #valet-support > ul {
        column-count: 3; -moz-column-count: 3; -webkit-column-count: 3;
        line-height: 1.9;
    }
</style>

<div id="valet-support" markdown="1">

- [Laravel](https://laravel.com)
- [Bedrock](https://roots.io/bedrock/)
- [CakePHP 3](https://cakephp.org)
- [ConcreteCMS](https://www.concretecms.com/)
- [Contao](https://contao.org/en/)
- [Craft](https://craftcms.com)
- [Drupal](https://www.drupal.org/)
- [ExpressionEngine](https://www.expressionengine.com/)
- [Jigsaw](https://jigsaw.tighten.co)
- [Joomla](https://www.joomla.org/)
- [Katana](https://github.com/themsaid/katana)
- [Kirby](https://getkirby.com/)
- [Magento](https://magento.com/)
- [OctoberCMS](https://octobercms.com/)
- [Sculpin](https://sculpin.io/)
- [Slim](https://www.slimframework.com)
- [Statamic](https://statamic.com)
- Static HTML
- [Symfony](https://symfony.com)
- [WordPress](https://wordpress.org)
- [Zend](https://framework.zend.com)

</div>

但是，你可以使用自己的[自定义驱动](#custom-valet-drivers)扩展 Valet。

<a name="installation"></a>
## 安装

> **Warning**  
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。安装之前，你应确保没有其他程序（如 Apache 或 Nginx）绑定到本地机器的 80 端口。

首先，你需要使用 `update` 命令确保 Homebrew 是最新的：

```shell
brew update
```

接下来，你应使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装 PHP 后，你就可以安装 [Composer 包管理器](https://getcomposer.org)了。此外，你应确保 `~/.composer/vendor/bin` 目录在系统的"PATH"中。安装 Composer 后，你可以将 Laravel Valet 安装为全局 Composer 包：

```shell
composer global require laravel/valet
```

最后，你可以执行 Valet 的 `install` 命令。这将配置并安装 Valet 和 DnsMasq。此外，Valet 依赖的守护进程将被配置为在系统启动时启动：

```shell
valet install
```

安装 Valet 后，尝试在终端中 ping 任何 `*.test` 域，使用如 `ping foobar.test` 的命令。如果 Valet 安装正确，你应该看到此域在 `127.0.0.1` 上响应。

Valet 会在每次机器启动时自动启动其所需的服务。

<a name="php-versions"></a>
#### PHP 版本

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果指定的 PHP 版本尚未安装，Valet 将通过 Homebrew 安装：

```shell
valet use php@7.2

valet use php
```

你还可以在项目根目录中创建一个 `.valetphprc` 文件。`.valetphprc` 文件应包含站点应使用的 PHP 版本：

```shell
php@7.2
```

创建此文件后，你只需执行 `valet use` 命令，该命令将通过读取文件来确定站点的首选 PHP 版本。

> **Warning**  
> Valet 一次只服务一个 PHP 版本，即使你安装了多个 PHP 版本。

<a name="database"></a>
#### 数据库

如果你的应用程序需要数据库，请查看 [DBngin](https://dbngin.com)，它提供了一个免费的一体化数据库管理工具，包括 MySQL、PostgreSQL 和 Redis。安装 DBngin 后，你可以使用 `root` 用户名和空字符串密码在 `127.0.0.1` 连接到数据库。

<a name="resetting-your-installation"></a>
#### 重置安装

如果你在使 Valet 安装正常运行时遇到问题，执行 `composer global require laravel/valet` 命令后跟 `valet install` 将重置你的安装并可以解决各种问题。在极少数情况下，可能需要通过执行 `valet uninstall --force` 后跟 `valet install` 来"硬重置"Valet。

<a name="upgrading-valet"></a>
### 升级 Valet

你可以通过在终端中执行 `composer global require laravel/valet` 命令来更新 Valet 安装。升级后，最好运行 `valet install` 命令，以便 Valet 可以在必要时对配置文件进行额外升级。

<a name="serving-sites"></a>
## 服务站点

安装 Valet 后，你就可以开始服务 Laravel 应用程序了。Valet 提供两个命令来帮助你服务应用程序：`park` 和 `link`。

<a name="the-park-command"></a>
### `park` 命令

`park` 命令在机器上注册一个包含应用程序的目录。一旦该目录被 Valet"停放"，该目录中的所有目录都将可在 Web 浏览器中通过 `http://<directory-name>.test` 访问：

```shell
cd ~/Sites

valet park
```

就这么简单。现在，你在"停放"目录中创建的任何应用程序都将自动使用 `http://<directory-name>.test` 约定进行服务。因此，如果你停放的目录包含一个名为"laravel"的目录，该目录中的应用程序将在 `http://laravel.test` 可访问。此外，Valet 自动允许你使用通配符子域（`http://foo.laravel.test`）访问站点。

<a name="the-link-command"></a>
### `link` 命令

`link` 命令也可用于服务 Laravel 应用程序。此命令在你想要服务目录中的单个站点而非整个目录时很有用：

```shell
cd ~/Sites/laravel

valet link
```

使用 `link` 命令将应用程序链接到 Valet 后，你可以使用其目录名访问应用程序。因此，上面示例中链接的站点可在 `http://laravel.test` 访问。此外，Valet 自动允许你使用通配符子域（`http://foo.laravel.test`）访问站点。

如果你希望在不同的主机名上服务应用程序，可以将主机名传递给 `link` 命令。例如，你可以运行以下命令使应用程序在 `http://application.test` 可用：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域上服务应用程序：

```shell
valet link api.application
```

你可以执行 `links` 命令来显示所有链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于销毁站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

<a name="securing-sites"></a>
### 使用 TLS 保护站点

默认情况下，Valet 通过 HTTP 服务站点。但是，如果你希望使用 HTTP/2 通过加密 TLS 服务站点，可以使用 `secure` 命令。例如，如果你的站点由 Valet 在 `laravel.test` 域上服务，你应运行以下命令来保护它：

```shell
valet secure laravel
```

要"取消保护"站点并恢复为通过普通 HTTP 服务其流量，使用 `unsecure` 命令。与 `secure` 命令一样，此命令接受你希望取消保护的主机名：

```shell
valet unsecure laravel
```

<a name="serving-a-default-site"></a>
### 服务默认站点

有时，你可能希望配置 Valet 在访问未知的 `test` 域时服务"默认"站点而不是 `404`。为此，你可以在 `~/.config/valet/config.json` 配置文件中添加一个 `default` 选项，包含应作为默认站点的站点路径：

```yaml
"default": "/Users/Sally/Sites/example-site",
```

<a name="per-site-php-versions"></a>
### 每站点 PHP 版本

默认情况下，Valet 使用你的全局 PHP 安装来服务站点。但是，如果你需要在不同站点之间支持多个 PHP 版本，可以使用 `isolate` 命令指定特定站点应使用的 PHP 版本。`isolate` 命令配置 Valet 为当前工作目录中的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果你的站点名称与包含它的目录名称不匹配，可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为方便起见，你可以使用 `valet php`、`composer` 和 `which-php` 命令根据站点配置的 PHP 版本将调用代理到适当的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令来显示所有隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要将站点恢复为 Valet 的全局安装 PHP 版本，可以从站点根目录调用 `unisolate` 命令：

```shell
valet unisolate
```

<a name="sharing-sites"></a>
## 共享站点

Valet 甚至包含一个与世界共享本地站点的命令，提供了一种在移动设备上测试站点或与团队成员和客户共享的简单方法。

<a name="sharing-sites-via-ngrok"></a>
### 通过 Ngrok 共享站点

要共享站点，在终端中导航到站点目录并运行 Valet 的 `share` 命令。一个公开可访问的 URL 将被插入到你的剪贴板中，准备好直接粘贴到浏览器或与团队共享：

```shell
cd ~/Sites/laravel

valet share
```

要停止共享站点，你可以按 `Control + C`。使用 Ngrok 共享站点需要你[创建 Ngrok 帐户](https://dashboard.ngrok.com/signup)并[设置身份验证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。

> **Note**  
> 你可以将额外的 Ngrok 参数传递给 share 命令，例如 `valet share --region=eu`。更多信息请查阅 [ngrok 文档](https://ngrok.com/docs)。

<a name="sharing-sites-via-expose"></a>
### 通过 Expose 共享站点

如果你安装了 [Expose](https://expose.dev)，可以通过在终端中导航到站点目录并运行 `expose` 命令来共享站点。有关它支持的额外命令行参数的信息，请查阅 [Expose 文档](https://expose.dev/docs)。共享站点后，Expose 将显示可在其他设备上或团队成员之间使用的可共享 URL：

```shell
cd ~/Sites/laravel

expose
```

要停止共享站点，你可以按 `Control + C`。

<a name="sharing-sites-on-your-local-network"></a>
### 在本地网络上共享站点

Valet 默认将传入流量限制为内部 `127.0.0.1` 接口，以免你的开发机器暴露于来自互联网的安全风险。

如果你希望允许本地网络上的其他设备通过你机器的 IP 地址访问你机器上的 Valet 站点（例如：`192.168.1.10/application.test`），你需要手动编辑该站点的相应 Nginx 配置文件以移除 `listen` 指令上的限制。你应移除 80 和 443 端口 `listen` 指令上的 `127.0.0.1:` 前缀。

如果你尚未在项目上运行 `valet secure`，可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件为所有非 HTTPS 站点开放网络访问。但是，如果你通过 HTTPS 服务项目站点（你已为站点运行 `valet secure`），则应编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令以应用配置更改。

<a name="site-specific-environment-variables"></a>
## 站点特定环境变量

使用其他框架的一些应用程序可能依赖服务器环境变量，但不提供在项目中配置这些变量的方法。Valet 允许你通过在项目根目录中添加 `.valet-env.php` 文件来配置站点特定的环境变量。此文件应返回一个站点/环境变量对数组，这些变量对将添加到数组中指定的每个站点的全局 `$_SERVER` 数组中：

```php
<?php

return [
    // 为 laravel.test 站点将 $_SERVER['key'] 设置为 "value"...
    'laravel' => [
        'key' => 'value',
    ],

    // 为所有站点将 $_SERVER['key'] 设置为 "value"...
    '*' => [
        'key' => 'value',
    ],
];
```

<a name="proxying-services"></a>
## 代理服务

有时你可能希望将 Valet 域代理到本地机器上的另一个服务。例如，你可能偶尔需要在运行 Valet 的同时在 Docker 中运行单独的站点；但是，Valet 和 Docker 不能同时绑定到 80 端口。

为此，你可以使用 `proxy` 命令生成代理。例如，你可以将 `http://elasticsearch.test` 的所有流量代理到 `http://127.0.0.1:9200`：

```shell
# 通过 HTTP 代理...
valet proxy elasticsearch http://127.0.0.1:9200

# 通过 TLS + HTTP/2 代理...
valet proxy elasticsearch http://127.0.0.1:9200 --secure
```

你可以使用 `unproxy` 命令移除代理：

```shell
valet unproxy elasticsearch
```

你可以使用 `proxies` 命令列出所有被代理的站点配置：

```shell
valet proxies
```

<a name="custom-valet-drivers"></a>
## 自定义 Valet 驱动

你可以编写自己的 Valet"驱动"来服务运行在 Valet 原生不支持框架或 CMS 上的 PHP 应用程序。安装 Valet 时，会创建一个 `~/.config/valet/Drivers` 目录，其中包含一个 `SampleValetDriver.php` 文件。此文件包含一个示例驱动实现，用于演示如何编写自定义驱动。编写驱动只需要你实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

所有三个方法都接收 `$sitePath`、`$siteName` 和 `$uri` 值作为参数。`$sitePath` 是机器上被服务站点的完全限定路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域的"host"/"站点名"部分（`my-project`）。`$uri` 是传入请求的 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，使用 `FrameworkValetDriver.php` 命名约定将其放在 `~/.config/valet/Drivers` 目录中。例如，如果你正在为 WordPress 编写自定义 Valet 驱动，文件名应为 `WordPressValetDriver.php`。

让我们看看自定义 Valet 驱动应实现的每个方法的示例实现。

<a name="the-serves-method"></a>
#### `serves` 方法

如果你的驱动应处理传入请求，`serves` 方法应返回 `true`。否则，该方法应返回 `false`。因此，在此方法中，你应尝试确定给定的 `$sitePath` 是否包含你尝试服务的类型的项目。

例如，假设我们正在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能如下所示：

```php
/**
 * 确定驱动是否服务请求。
 *
 * @param  string  $sitePath
 * @param  string  $siteName
 * @param  string  $uri
 * @return bool
 */
public function serves($sitePath, $siteName, $uri)
{
    return is_dir($sitePath.'/wp-admin');
}
```

<a name="the-isstaticfile-method"></a>
#### `isStaticFile` 方法

`isStaticFile` 应确定传入请求是否针对"静态"文件，例如图像或样式表。如果文件是静态的，该方法应返回磁盘上静态文件的完全限定路径。如果传入请求不是针对静态文件，该方法应返回 `false`：

```php
/**
 * 确定传入请求是否针对静态文件。
 *
 * @param  string  $sitePath
 * @param  string  $siteName
 * @param  string  $uri
 * @return string|false
 */
public function isStaticFile($sitePath, $siteName, $uri)
{
    if (file_exists($staticFilePath = $sitePath.'/public/'.$uri)) {
        return $staticFilePath;
    }

    return false;
}
```

> **Warning**  
> `isStaticFile` 方法仅在 `serves` 方法对传入请求返回 `true` 且请求 URI 不是 `/` 时才会被调用。

<a name="the-frontcontrollerpath-method"></a>
#### `frontControllerPath` 方法

`frontControllerPath` 方法应返回应用程序"前端控制器"的完全限定路径，通常是"index.php"文件或等效文件：

```php
/**
 * 获取应用程序前端控制器的完全解析路径。
 *
 * @param  string  $sitePath
 * @param  string  $siteName
 * @param  string  $uri
 * @return string
 */
public function frontControllerPath($sitePath, $siteName, $uri)
{
    return $sitePath.'/public/index.php';
}
```

<a name="local-drivers"></a>
### 本地驱动

如果你想为单个应用程序定义自定义 Valet 驱动，在应用程序根目录中创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以扩展基础 `ValetDriver` 类或扩展现有的应用程序特定驱动，如 `LaravelValetDriver`：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * 确定驱动是否服务请求。
     *
     * @param  string  $sitePath
     * @param  string  $siteName
     * @param  string  $uri
     * @return bool
     */
    public function serves($sitePath, $siteName, $uri)
    {
        return true;
    }

    /**
     * 获取应用程序前端控制器的完全解析路径。
     *
     * @param  string  $sitePath
     * @param  string  $siteName
     * @param  string  $uri
     * @return string
     */
    public function frontControllerPath($sitePath, $siteName, $uri)
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

<a name="other-valet-commands"></a>
## 其他 Valet 命令

命令  | 描述
------------- | -------------
`valet list` | 显示所有 Valet 命令的列表。
`valet forget` | 从"停放"目录运行此命令以将其从停放目录列表中移除。
`valet log` | 查看 Valet 服务写入的日志列表。
`valet paths` | 查看所有"停放"路径。
`valet restart` | 重启 Valet 守护进程。
`valet start` | 启动 Valet 守护进程。
`valet stop` | 停止 Valet 守护进程。
`valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，允许在无需提示输入密码的情况下运行 Valet 命令。
`valet uninstall` | 卸载 Valet：显示手动卸载说明。传递 `--force` 选项以强制删除所有 Valet 资源。

<a name="valet-directories-and-files"></a>
## Valet 目录与文件

在排查 Valet 环境问题时，你可能会发现以下目录和文件信息很有用：

#### `~/.config/valet`

包含 Valet 的所有配置。你可能希望维护此目录的备份。

#### `~/.config/valet/dnsmasq.d/`

此目录包含 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

此目录包含 Valet 的驱动。驱动确定如何服务特定框架/CMS。

#### `~/.config/valet/Extensions/`

此目录包含自定义 Valet 扩展/命令。

#### `~/.config/valet/Nginx/`

此目录包含所有 Valet 的 Nginx 站点配置。这些文件在运行 `install` 和 `secure` 命令时重新构建。

#### `~/.config/valet/Sites/`

此目录包含所有[链接项目](#the-link-command)的符号链接。

#### `~/.config/valet/config.json`

此文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

此文件是 Valet 的 Nginx 安装使用的 PHP-FPM 套接字。仅在 PHP 正常运行时存在。

#### `~/.config/valet/Log/fpm-php.www.log`

此文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

此文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

此文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

此目录包含 Nginx 访问和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

此目录包含各种 PHP 配置设置的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

此文件是 PHP-FPM 池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

此文件是用于为站点构建 SSL 证书的默认 Nginx 配置。

<a name="disk-access"></a>
### 磁盘访问

自 macOS 10.14 起，[默认限制对某些文件和目录的访问](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制包括桌面、文档和下载目录。此外，网络卷和可移动卷的访问也受到限制。因此，Valet 建议你的站点文件夹位于这些受保护位置之外。

但是，如果你希望从这些位置之一服务站点，你需要授予 Nginx"完全磁盘访问"权限。否则，你可能会遇到来自 Nginx 的服务器错误或其他不可预测的行为，尤其是在服务静态资源时。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。或者，你可以通过`系统偏好设置` > `安全性与隐私` > `隐私`手动操作，并选择`完全磁盘访问`。然后，在主窗口窗格中启用任何 `nginx` 条目。
