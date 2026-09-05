# Laravel Valet

## 简介

> [!NOTE]
> 正在寻找在 macOS 或 Windows 上开发 Laravel 应用程序的更简单方式？请查看 [Laravel Herd](https://herd.laravel.com)。Herd 包含了开始 Laravel 开发所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是一个面向 macOS 极简主义的开发环境。Laravel Valet 会在你的 Mac 开机时配置机器在后台始终运行 [Nginx](https://www.nginx.com)。然后，Valet 使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq) 将所有 `*.test` 域上的 请求 代理到指向安装在本机上的站点。

换句话说，Valet 是一个极速的 Laravel 开发环境，大约只占用 7 MB 的 RAM。Valet 并不是 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead) 的完整替代品，但如果你想要灵活的基础、偏好极致速度，或者在内存有限的机器上工作，它是一个很好的选择。

开箱即用的 Valet 支持（但不限于）以下内容：

<style>
    #valet-support > ul {
        column-count: 3; -moz-column-count: 3; -webkit-column-count: 3;
        line-height: 1.9;
    }
</style>

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
- 静态 HTML
- [Symfony](https://symfony.com)
- [WordPress](https://wordpress.org)
- [Zend](https://framework.zend.com)

不过，你可以通过自己的[自定义驱动](#custom-valet-drivers)扩展 Valet。

## 安装

> [!WARNING]
> Valet 需要 macOS 和 [Homebrew](https://brew.sh)。安装前，你应该确保没有其他程序（如 Apache 或 Nginx）占用本机的 80 端口。

要开始，你首先需要确保使用 `update` 命令将 Homebrew 更新到最新：

```shell
brew update
```

接下来，你应该使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装 PHP 后，你就可以安装 [Composer 包管理器](https://getcomposer.org)。此外，你应该确保 `$HOME/.composer/vendor/bin` 目录位于系统的 "PATH" 中。安装 Composer 后，你可以将 Laravel Valet 作为全局 Composer 包安装：

```shell
composer global require laravel/valet
```

最后，你可以执行 Valet 的 `install` 命令。这将配置并安装 Valet 和 DnsMasq。此外，Valet 所依赖的守护进程将被配置为在系统启动时启动：

```shell
valet install
```

安装 Valet 后，尝试在终端中使用 `ping foobar.test` 之类的命令 ping 任何 `*.test` 域。如果 Valet 安装正确，你应该看到该域在 `127.0.0.1` 上作出响应。

Valet 会在每次机器启动时自动启动其所需的服务。

#### PHP 版本

> [!NOTE]
> 你可以通过 `isolate` [命令](#per-site-php-versions) 指示 Valet 使用按站点指定的 PHP 版本，而无需修改全局 PHP 版本。

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果该 PHP 版本尚未安装，Valet 会通过 Homebrew 安装指定的版本：

```shell
valet use php@8.2

valet use php
```

你还可以在项目根目录中创建一个 `.valetrc` 文件。该 `.valetrc` 文件应包含站点应使用的 PHP 版本：

```shell
php=php@8.2
```

创建此文件后，你只需执行 `valet use` 命令，该命令就会通过读取文件来确定站点的首选 PHP 版本。

> [!WARNING]
> Valet 一次只提供一个 PHP 版本，即使你安装了多个 PHP 版本。

#### 数据库

如果你的应用程序需要数据库，请查看 [DBngin](https://dbngin.com)，它提供了一个免费的、集 MySQL、PostgreSQL 和 Redis 于一体的数据库管理工具。安装 DBngin 后，你可以使用 `root` 用户名和空字符串密码在 `127.0.0.1` 连接到你的数据库。

#### 重置你的安装

如果你在安装 Valet 时遇到运行不正常的问题，执行 `composer global require laravel/valet` 命令后再执行 `valet install` 将重置你的安装，并可以解决各种问题。在极少数情况下，可能需要通过执行 `valet uninstall --force` 再执行 `valet install` 来"硬重置"Valet。

### 升级 Valet

你可以通过在终端中执行 `composer global require laravel/valet` 命令来更新你的 Valet 安装。升级后，最好运行 `valet install` 命令，以便 Valet 在必要时对配置文件进行额外升级。

#### 升级到 Valet 4

如果你要从 Valet 3 升级到 Valet 4，请执行以下步骤以正确升级你的 Valet 安装：

- 如果你添加了 `.valetphprc` 文件来自定义站点的 PHP 版本，请将每个 `.valetphprc` 文件重命名为 `.valetrc`。然后，在 `.valetrc` 文件现有内容前加上 `php=`。
- 更新任何自定义驱动以匹配新驱动系统的命名空间、扩展名、类型提示和返回类型提示。你可以参考 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例。
- 如果你使用 PHP 7.1 - 7.4 来提供站点服务，请确保你仍然使用 Homebrew 安装一个 8.0 或更高版本的 PHP，因为 Valet 将使用此版本（即使它不是你的主链接版本）来运行其部分脚本。

## 服务站点

安装 Valet 后，你就可以开始提供 Laravel 应用程序的服务。Valet 提供两个命令来帮助你提供应用程序的服务：`park` 和 `link`。

### `park` 命令

`park` 命令会在你的机器上注册一个包含应用程序的目录。一旦该目录被 Valet "park"，该目录中的所有子目录都可以在 Web 浏览器中通过 `http://<directory-name>.test` 访问：

```shell
cd ~/Sites

valet park
```

就这么简单。现在，你在"park"目录中创建的任何应用程序都将使用 `http://<directory-name>.test` 约定自动提供服务。因此，如果你的 park 目录包含一个名为 "laravel" 的子目录，该目录中的应用程序可以通过 `http://laravel.test` 访问。此外，Valet 会自动允许你使用通配子域访问站点（`http://foo.laravel.test`）。

### `link` 命令

`link` 命令也可用于提供 Laravel 应用程序的服务。如果你想要提供目录中的单个站点而不是整个目录，此命令很有用：

```shell
cd ~/Sites/laravel

valet link
```

使用 `link` 命令将应用程序链接到 Valet 后，你可以使用其目录名访问该应用程序。因此，上面示例中链接的站点可以通过 `http://laravel.test` 访问。此外，Valet 会自动允许你使用通配子域访问站点（`http://foo.laravel.test`）。

如果你想在不同的主机名上提供应用程序，可以将主机名传递给 `link` 命令。例如，你可以运行以下命令使应用程序在 `http://application.test` 上可用：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域上提供应用程序：

```shell
valet link api.application
```

你可以执行 `links` 命令来显示所有已链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于销毁站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

### 使用 TLS 保护站点

默认情况下，Valet 通过 HTTP 提供站点服务。不过，如果你想通过加密的 TLS（使用 HTTP/2）提供站点服务，可以使用 `secure` 命令。例如，如果你的站点由 Valet 在 `laravel.test` 域上提供服务，你应该运行以下命令来保护它：

```shell
valet secure laravel
```

要"取消保护"站点并恢复为通过纯 HTTP 提供流量，请使用 `unsecure` 命令。与 `secure` 命令一样，此命令接受你想要取消保护的主机名：

```shell
valet unsecure laravel
```

### 服务默认站点

有时，你可能希望配置 Valet 提供一个"默认"站点，而不是在访问未知 `test` 域时显示 `404`。为此，你可以在 `~/.config/valet/config.json` 配置文件中添加一个 `default` 选项，其中包含应作为默认站点提供服务的站点路径：

    "default": "/Users/Sally/Sites/example-site",

### 按站点的 PHP 版本

默认情况下，Valet 使用你的全局 PHP 安装来提供站点服务。不过，如果你需要在不同站点之间支持多个 PHP 版本，可以使用 `isolate` 命令指定特定站点应使用的 PHP 版本。`isolate` 命令将 Valet 配置为对你当前工作目录中的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果你的站点名称与包含它的目录名称不匹配，可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为方便起见，你可以使用 `valet php`、`composer` 和 `which-php` 命令，根据站点的配置 PHP 版本代理调用相应的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令来显示所有隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要将站点恢复为 Valet 全局安装的 PHP 版本，可以从站点的根目录调用 `unisolate` 命令：

```shell
valet unisolate
```

## 共享站点

Valet 包含一个命令，可将你的本地站点分享给全世界，提供了一种在移动设备上测试站点或与团队成员和客户分享的便捷方式。

开箱即用的 Valet 支持通过 ngrok 或 Expose 分享你的站点。在分享站点之前，你应该使用 `share-tool` 命令更新 Valet 配置，指定 `ngrok`、`expose` 或 `cloudflared`：

```shell
valet share-tool ngrok
```

如果你选择了某个工具，但没有通过 Homebrew（针对 ngrok 和 cloudflared）或 Composer（针对 Expose）安装它，Valet 会自动提示你安装。当然，这两个工具都要求你在开始分享站点之前验证你的 ngrok 或 Expose 账户。

要分享站点，请在终端中导航到站点的目录并运行 Valet 的 `share` 命令。一个可公开访问的 URL 将被放入你的剪贴板，可以直接粘贴到浏览器中或与你的团队分享：

```shell
cd ~/Sites/laravel

valet share
```

要停止分享你的站点，可以按 `Control + C`。

> [!WARNING]
> 如果你使用自定义 DNS 服务器（如 `1.1.1.1`），ngrok 分享可能无法正常工作。如果你的机器出现这种情况，请打开 Mac 的系统设置，进入网络设置，打开高级设置，然后进入 DNS 选项卡，将 `127.0.0.1` 添加为你的第一个 DNS 服务器。

#### 通过 Ngrok 共享站点

使用 ngrok 分享你的站点需要你[创建一个 ngrok 账户](https://dashboard.ngrok.com/signup)并[设置身份验证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。获得身份验证令牌后，你可以用该令牌更新你的 Valet 配置：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]
> 你可以向 share 命令传递额外的 ngrok 参数，例如 `valet share --region=eu`。更多信息，请参阅 [ngrok 文档](https://ngrok.com/docs)。

#### 通过 Expose 共享站点

使用 Expose 分享你的站点需要你[创建一个 Expose 账户](https://expose.dev/register)并[通过身份验证令牌向 Expose 进行身份验证](https://expose.dev/docs/getting-started/getting-your-token)。

你可以查阅 [Expose 文档](https://expose.dev/docs) 了解其支持的其他命令行参数。

### 在局域网共享站点

Valet 默认将传入流量限制为内部的 `127.0.0.1` 接口，以便你的开发机器不会暴露于来自互联网的安全风险。

如果你想允许本地网络上的其他设备通过你机器的 IP 地址（例如 `192.168.1.10/application.test`）访问 Valet 站点，你需要手动编辑该站点相应的 Nginx 配置文件，移除 `listen` 指令上的限制。你应该移除端口 80 和 443 的 `listen` 指令上的 `127.0.0.1:` 前缀。

如果你尚未对项目运行 `valet secure`，可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件为所有非 HTTPS 站点开放网络访问。但是，如果你正在通过 HTTPS 提供项目服务（你已对该站点运行 `valet secure`），则应该编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令以应用配置更改。

## 站点专属环境变量

某些使用其他框架的应用程序可能依赖服务器环境变量，但不提供在项目内配置这些变量的方式。Valet 允许你通过在项目根目录中添加 `.valet-env.php` 文件来配置站点特定的环境变量。该文件应返回一个站点 / 环境变量对的数组，这些对将被添加到数组中指定的每个站点的全局 `$_SERVER` 数组中：

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

## 代理服务

有时你可能希望将 Valet 域代理到本机上的另一个服务。例如，你可能偶尔需要在运行 Docker 中独立站点的同时运行 Valet；但是，Valet 和 Docker 不能同时绑定到 80 端口。

为解决这个问题，你可以使用 `proxy` 命令生成代理。例如，你可以将 `http://elasticsearch.test` 的所有流量代理到 `http://127.0.0.1:9200`：

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

## 自定义 Valet 驱动

你可以编写自己的 Valet "驱动"来提供运行在 Valet 原生不支持的框架或 CMS 上的 PHP 应用程序。安装 Valet 时，会创建一个 `~/.config/valet/Drivers` 目录，其中包含 `SampleValetDriver.php` 文件。该文件包含一个示例驱动实现，用于演示如何编写自定义驱动。编写一个驱动只需要实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

所有三个方法都接收 `$sitePath`、`$siteName` 和 `$uri` 值作为参数。`$sitePath` 是被提供服务站点的完全限定路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域名的"主机" / "站点名称"部分（`my-project`）。`$uri` 是传入的 请求 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，使用 `FrameworkValetDriver.php` 命名约定将其放入 `~/.config/valet/Drivers` 目录。例如，如果你正在为 WordPress 编写自定义 Valet 驱动，你的文件名应为 `WordPressValetDriver.php`。

让我们看看自定义 Valet 驱动应实现的每个方法的示例。

#### `serves` 方法

如果驱动应处理传入的 请求，`serves` 方法应返回 `true`。否则，该方法应返回 `false`。因此，在该方法内，你应该尝试确定给定的 `$sitePath` 是否包含你试图提供服务的类型的项目。

例如，假设我们正在编写 `WordPressValetDriver`。我们的 `serves` 方法可能如下所示：

```php
/**
 * 判断该驱动是否处理请求。
 */
public function serves(string $sitePath, string $siteName, string $uri): bool
{
    return is_dir($sitePath.'/wp-admin');
}
```

#### `isStaticFile` 方法

`isStaticFile` 应确定传入的 请求 是否针对"静态"文件，例如图片或样式表。如果文件是静态的，该方法应返回磁盘上静态文件的完全限定路径。如果传入的 请求 不是针对静态文件，该方法应返回 `false`：

```php
/**
 * 判断传入的请求是否针对静态文件。
 *
 * @return string|false
 */
public function isStaticFile(string $sitePath, string $siteName, string $uri)
{
    if (file_exists($staticFilePath = $sitePath.'/public/'.$uri)) {
        return $staticFilePath;
    }

    return false;
}
```

> [!WARNING]
> 只有当 `serves` 方法对传入 请求 返回 `true` 且 请求 URI 不为 `/` 时，才会调用 `isStaticFile` 方法。

#### `frontControllerPath` 方法

`frontControllerPath` 方法应返回应用程序"前端控制器"的完全限定路径，通常是 "index.php" 文件或等效文件：

```php
/**
 * 获取应用程序前端控制器的完全解析路径。
 */
public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
{
    return $sitePath.'/public/index.php';
}
```

### 本地驱动

如果你想为单个应用程序定义自定义 Valet 驱动，请在应用程序的根目录中创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以扩展基类 `ValetDriver`，也可以扩展现有的应用程序特定驱动（例如 `LaravelValetDriver`）：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * 判断该驱动是否处理请求。
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * 获取应用程序前端控制器的完全解析路径。
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

## 其他 Valet 命令

| Command | Description |
| --- | --- |
| `valet list` | 显示所有 Valet 命令的列表。 |
| `valet diagnose` | 输出诊断信息以辅助调试 Valet。 |
| `valet directory-listing` | 确定目录列表行为。默认为 "off"，即目录渲染 404 页面。 |
| `valet forget` | 从已 park 目录列表中移除它，在 "parked" 目录中运行此命令。 |
| `valet log` | 查看 Valet 服务写入的日志列表。 |
| `valet paths` | 查看所有 "parked" 路径。 |
| `valet restart` | 重启 Valet 守护进程。 |
| `valet start` | 启动 Valet 守护进程。 |
| `valet stop` | 停止 Valet 守护进程。 |
| `valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，以便无需提示输入密码即可运行 Valet 命令。 |
| `valet uninstall` | 卸载 Valet：显示手动卸载说明。传递 `--force` 选项以强制删除 Valet 的所有资源。 |

## Valet 目录与文件

在为 Valet 环境排错时，你可能会发现以下目录和文件信息很有帮助：

#### `~/.config/valet`

包含 Valet 的所有配置。你可能希望备份此目录。

#### `~/.config/valet/dnsmasq.d/`

此目录包含 DnsMasq 的配置。

#### `~/.config/valet/Drivers/`

此目录包含 Valet 的驱动。驱动决定特定框架 / CMS 如何被提供服务。

#### `~/.config/valet/Nginx/`

此目录包含 Valet 的所有 Nginx 站点配置。这些文件在运行 `install` 和 `secure` 命令时会重新生成。

#### `~/.config/valet/Sites/`

此目录包含你所有[链接项目](#the-link-command)的符号链接。

#### `~/.config/valet/config.json`

此文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

此文件是 Valet 的 Nginx 安装所使用的 PHP-FPM 套接字。仅当 PHP 正常运行时才存在。

#### `~/.config/valet/Log/fpm-php.www.log`

此文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

此文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

此文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

此目录包含 Nginx 的访问和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

此目录包含各种 PHP 配置设置的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

此文件是 PHP-FPM 池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

此文件是用于为站点构建 SSL 证书的默认 Nginx 配置。

### 磁盘访问

自 macOS 10.14 起，[对某些文件和目录的访问默认受限](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制包括 Desktop、Documents 和 Downloads 目录。此外，网络卷和 removable 卷的访问也受限。因此，Valet 建议你的站点文件夹位于这些受保护位置之外。

不过，如果你想从其中一个位置提供站点服务，你需要授予 Nginx"完全磁盘访问（Full Disk Access）"权限。否则，你可能会遇到服务器错误或其他来自 Nginx 的不可预测行为，尤其是在提供静态资源时。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。或者，你可以通过 `System Preferences` > `Security & Privacy` > `Privacy` 手动操作，并选择 `Full Disk Access`，然后在主窗口窗格中启用任何 `nginx` 条目。
