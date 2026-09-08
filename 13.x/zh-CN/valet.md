# Laravel Valet

- [简介](#introduction)
- [安装](#installation)
    - [升级 Valet](#upgrading-valet)
- [运行站点](#serving-sites)
    - [`park` 命令](#the-park-command)
    - [`link` 命令](#the-link-command)
    - [使用 TLS 保护站点](#securing-sites)
    - [运行默认站点](#serving-a-default-site)
    - [按站点指定 PHP 版本](#per-site-php-versions)
- [分享站点](#sharing-sites)
    - [在本地网络中分享站点](#sharing-sites-on-your-local-network)
- [站点专属环境变量](#site-specific-environment-variables)
- [代理服务](#proxying-services)
- [自定义 Valet 驱动](#custom-valet-drivers)
    - [本地驱动](#local-drivers)
- [其他 Valet 命令](#other-valet-commands)
- [Valet 目录与文件](#valet-directories-and-files)
    - [磁盘访问](#disk-access)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 想找一种在 macOS 或 Windows 上更简单的 Laravel 开发方式？请查看 [Laravel Herd](https://herd.laravel.com)。Herd 包含 Laravel 开发入门所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是面向 macOS 极简主义者的开发环境。Laravel Valet 会配置你的 Mac 在机器启动时始终在后台运行 [Nginx](https://www.nginx.com/)。然后，使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq)，Valet 会代理 `*.test` 域上的所有请求，使其指向安装在你本地机器上的站点。

换句话说，Valet 是一个极速的 Laravel 开发环境，仅占用约 7 MB 内存。Valet 并不能完全替代 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead)，但如果你想要灵活的基础功能、偏爱极致速度，或正在内存有限的机器上工作，它是一个绝佳的选择。

开箱即用，Valet 支持（但不限于）以下框架：

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
- 静态 HTML
- [Symfony](https://symfony.com)
- [WordPress](https://wordpress.org)
- [Zend](https://framework.zend.com)

</div>

不过，你可以通过自己的[自定义驱动](#custom-valet-drivers)扩展 Valet。

<a name="installation"></a>
## 安装

> [!WARNING]
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。安装之前，你应确保没有其他程序（如 Apache 或 Nginx）绑定在你本地机器的 80 端口上。

要开始，你首先需要使用 `update` 命令确保 Homebrew 是最新的：

```shell
brew update
```

接下来，你应该使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装 PHP 后，你就可以安装 [Composer 包管理器](https://getcomposer.org)了。此外，你应确保 `$HOME/.composer/vendor/bin` 目录位于系统的"PATH"中。Composer 安装完成后，你可以将 Laravel Valet 作为全局 Composer 包安装：

```shell
composer global require laravel/valet
```

最后，你可以执行 Valet 的 `install` 命令。这将配置并安装 Valet 和 DnsMasq。此外，Valet 依赖的守护进程将被配置为在系统启动时启动：

```shell
valet install
```

Valet 安装完成后，尝试在你的终端中使用 `ping foobar.test` 之类的命令 ping 任意 `*.test` 域。如果 Valet 安装正确，你应该会看到该域在 `127.0.0.1` 上响应。

每次机器启动时，Valet 都会自动启动其所需的服务。

<a name="php-versions"></a>
#### PHP 版本

> [!NOTE]
> 与其修改你的全局 PHP 版本，你可以通过 `isolate` [命令](#per-site-php-versions)指示 Valet 使用按站点指定的 PHP 版本。

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果指定的 PHP 版本尚未安装，Valet 会通过 Homebrew 安装它：

```shell
valet use php@8.2

valet use php
```

你也可以在项目根目录创建一个 `.valetrc` 文件。`.valetrc` 文件应包含站点应使用的 PHP 版本：

```shell
php=php@8.2
```

创建此文件后，你只需执行 `valet use` 命令，该命令就会通过读取文件来确定站点偏好的 PHP 版本。

> [!WARNING]
> 即使你安装了多个 PHP 版本，Valet 一次只运行一个 PHP 版本。

<a name="database"></a>
#### 数据库

如果你的应用需要数据库，请查看 [DBngin](https://dbngin.com)，它提供了一款免费的、一体化的数据库管理工具，包含 MySQL、PostgreSQL 和 Redis。安装 DBngin 后，你可以使用 `root` 用户名和空字符串密码连接到 `127.0.0.1` 上的数据库。

<a name="resetting-your-installation"></a>
#### 重置你的安装

如果你的 Valet 安装无法正常运行，执行 `composer global require laravel/valet` 命令后再执行 `valet install` 将重置你的安装，并能解决各种问题。在极少数情况下，可能需要通过执行 `valet uninstall --force` 后再执行 `valet install` 来"硬重置"Valet。

<a name="upgrading-valet"></a>
### 升级 Valet

你可以在终端中执行 `composer global require laravel/valet` 命令来更新 Valet 安装。升级后，最好运行 `valet install` 命令，这样 Valet 可以在必要时对你的配置文件进行额外升级。

<a name="upgrading-to-valet-4"></a>
#### 升级到 Valet 4

如果你要从 Valet 3 升级到 Valet 4，请按照以下步骤正确升级你的 Valet 安装：

<div class="content-list" markdown="1">

- 如果你添加了 `.valetphprc` 文件来自定义站点的 PHP 版本，请将每个 `.valetphprc` 文件重命名为 `.valetrc`。然后，在 `.valetrc` 文件的现有内容前面加上 `php=`。
- 更新任何自定义驱动，使其与新驱动系统的命名空间、扩展名、类型提示和返回类型提示相匹配。你可以参考 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例。
- 如果你使用 PHP 7.1 - 7.4 运行站点，请确保仍然使用 Homebrew 安装 8.0 或更高版本的 PHP，因为即使它不是你的主链接版本，Valet 也会使用此版本来运行其部分脚本。

</div>

<a name="serving-sites"></a>
## 运行站点

Valet 安装完成后，你就可以开始运行你的 Laravel 应用了。Valet 提供了两个命令来帮助你运行应用：`park` 和 `link`。

<a name="the-park-command"></a>
### `park` 命令

`park` 命令会注册你机器上包含应用的一个目录。一旦该目录被 Valet"托管"，该目录中的所有子目录都可以在浏览器中通过 `http://<目录名>.test` 访问：

```shell
cd ~/Sites

valet park
```

仅此而已。现在，你在"托管"目录中创建的任何应用都将自动使用 `http://<目录名>.test` 约定运行。因此，如果你的托管目录包含一个名为 "laravel" 的目录，该目录中的应用就可以通过 `http://laravel.test` 访问。此外，Valet 会自动允许你使用通配符子域（`http://foo.laravel.test`）访问站点。

<a name="the-link-command"></a>
### `link` 命令

`link` 命令也可用于运行你的 Laravel 应用。如果你只想运行目录中的单个站点而不是整个目录，此命令非常有用：

```shell
cd ~/Sites/laravel

valet link
```

一旦应用通过 `link` 命令链接到 Valet，你就可以使用其目录名访问该应用。因此，上面示例中链接的站点可以通过 `http://laravel.test` 访问。此外，Valet 会自动允许你使用通配符子域（`http://foo.laravel.test`）访问站点。

如果你想在不同的主机名下运行该应用，可以将主机名传递给 `link` 命令。例如，你可以运行以下命令使应用在 `http://application.test` 下可用：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域上运行应用：

```shell
valet link api.application
```

你可以执行 `links` 命令显示所有已链接目录的列表：

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

默认情况下，Valet 通过 HTTP 运行站点。但是，如果你想使用 HTTP/2 通过加密的 TLS 运行站点，可以使用 `secure` 命令。例如，如果你的站点由 Valet 在 `laravel.test` 域上运行，你应该运行以下命令来保护它：

```shell
valet secure laravel
```

要"取消保护"站点并恢复为通过普通 HTTP 运行其流量，请使用 `unsecure` 命令。与 `secure` 命令一样，此命令接受你想要取消保护的主机名：

```shell
valet unsecure laravel
```

<a name="serving-a-default-site"></a>
### 运行默认站点

有时，你可能希望配置 Valet 在访问未知 `test` 域时运行一个"默认"站点，而不是返回 `404`。为此，你可以向 `~/.config/valet/config.json` 配置文件添加一个 `default` 选项，其中包含应作为默认站点的站点路径：

    "default": "/Users/Sally/Sites/example-site",

<a name="per-site-php-versions"></a>
### 按站点指定 PHP 版本

默认情况下，Valet 使用你的全局 PHP 安装来运行站点。但是，如果你需要在不同站点之间支持多个 PHP 版本，可以使用 `isolate` 命令为特定站点指定应使用的 PHP 版本。`isolate` 命令会配置 Valet，为你当前工作目录中的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果你的站点名称与包含它的目录名称不匹配，可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为方便起见，你可以使用 `valet php`、`composer` 和 `which-php` 命令，根据站点配置的 PHP 版本代理调用相应的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令显示所有隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要将站点恢复为 Valet 的全局安装 PHP 版本，你可以从站点根目录调用 `unisolate` 命令：

```shell
valet unisolate
```

<a name="sharing-sites"></a>
## 分享站点

Valet 包含一个与世界分享本地站点的命令，提供了一种在移动设备上测试站点或与团队成员和客户分享的简便方式。

开箱即用，Valet 支持通过 ngrok 或 Expose 分享你的站点。在分享站点之前，你应该使用 `share-tool` 命令更新 Valet 配置，指定 `ngrok`、`expose` 或 `cloudflared`：

```shell
valet share-tool ngrok
```

如果你选择了一个工具，但尚未通过 Homebrew（适用于 ngrok 和 cloudflared）或 Composer（适用于 Expose）安装，Valet 会自动提示你安装它。当然，这两个工具都要求你认证 ngrok 或 Expose 账户后才能开始分享站点。

要分享站点，请在终端中导航到站点目录并运行 Valet 的 `share` 命令。一个公开可访问的 URL 将被放入你的剪贴板，可以直接粘贴到浏览器中或与团队分享：

```shell
cd ~/Sites/laravel

valet share
```

要停止分享你的站点，可以按 `Control + C`。

> [!WARNING]
> 如果你使用自定义 DNS 服务器（如 `1.1.1.1`），ngrok 分享可能无法正常工作。如果你的机器出现这种情况，请打开 Mac 的系统设置，进入网络设置，打开高级设置，然后转到 DNS 选项卡，将 `127.0.0.1` 添加为你的第一个 DNS 服务器。

<a name="sharing-sites-via-ngrok"></a>
#### 通过 Ngrok 分享站点

使用 ngrok 分享站点需要你[创建一个 ngrok 账户](https://dashboard.ngrok.com/signup)并[设置认证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。获得认证令牌后，你可以使用该令牌更新 Valet 配置：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]
> 你可以向 share 命令传递额外的 ngrok 参数，例如 `valet share --region=eu`。有关更多信息，请查阅 [ngrok 文档](https://ngrok.com/docs)。

<a name="sharing-sites-via-expose"></a>
#### 通过 Expose 分享站点

使用 Expose 分享站点需要你[创建一个 Expose 账户](https://expose.dev/register)并[通过你的认证令牌向 Expose 认证](https://expose.dev/docs/getting-started/getting-your-token)。

你可以查阅 [Expose 文档](https://expose.dev/docs)，了解其支持的其他命令行参数。

<a name="sharing-sites-on-your-local-network"></a>
### 在本地网络中分享站点

默认情况下，Valet 将传入流量限制在内部 `127.0.0.1` 接口，这样你的开发机器就不会暴露在来自互联网的安全风险中。

如果你希望允许本地网络中的其他设备通过你机器的 IP 地址（例如 `192.168.1.10/application.test`）访问你机器上的 Valet 站点，你需要手动编辑该站点的相应 Nginx 配置文件，以移除 `listen` 指令上的限制。你应该移除 80 和 443 端口 `listen` 指令上的 `127.0.0.1:` 前缀。

如果你没有对项目运行 `valet secure`，可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件为所有非 HTTPS 站点开放网络访问。但是，如果你通过 HTTPS 运行项目站点（已为该站点运行 `valet secure`），则应编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令以应用配置更改。

<a name="site-specific-environment-variables"></a>
## 站点专属环境变量

某些使用其他框架的应用可能依赖服务器环境变量，但没有提供在项目中配置这些变量的方式。Valet 允许你通过在项目根目录添加 `.valet-env.php` 文件来配置站点专属的环境变量。该文件应返回一个站点 / 环境变量对数组，这些变量将被添加到全局 `$_SERVER` 数组中，作用于数组中指定的每个站点：

```php
<?php

return [
    // Set $_SERVER['key'] to "value" for the laravel.test site...
    'laravel' => [
        'key' => 'value',
    ],

    // Set $_SERVER['key'] to "value" for all sites...
    '*' => [
        'key' => 'value',
    ],
];
```

<a name="proxying-services"></a>
## 代理服务

有时你可能希望将 Valet 域代理到本地机器上的另一个服务。例如，你可能偶尔需要在运行 Valet 的同时在 Docker 中运行一个单独的站点；但是，Valet 和 Docker 不能同时绑定到 80 端口。

为解决此问题，你可以使用 `proxy` 命令生成一个代理。例如，你可以将 `http://elasticsearch.test` 的所有流量代理到 `http://127.0.0.1:9200`：

```shell
# Proxy over HTTP...
valet proxy elasticsearch http://127.0.0.1:9200

# Proxy over TLS + HTTP/2...
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

你可以编写自己的 Valet"驱动"来运行基于 Valet 原生不支持的框架或 CMS 的 PHP 应用。安装 Valet 时，会创建一个 `~/.config/valet/Drivers` 目录，其中包含一个 `SampleValetDriver.php` 文件。该文件包含一个示例驱动实现，用于演示如何编写自定义驱动。编写驱动只需要你实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

这三个方法都接收 `$sitePath`、`$siteName` 和 `$uri` 值作为参数。`$sitePath` 是你机器上被运行站点的完整限定路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域的"主机"/"站点名称"部分（`my-project`）。`$uri` 是传入的请求 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，使用 `FrameworkValetDriver.php` 命名约定将其放在 `~/.config/valet/Drivers` 目录中。例如，如果你正在为 WordPress 编写自定义 valet 驱动，文件名应为 `WordPressValetDriver.php`。

让我们看看自定义 Valet 驱动应实现的每个方法的示例实现。

<a name="the-serves-method"></a>
#### `serves` 方法

如果你的驱动应处理传入请求，`serves` 方法应返回 `true`。否则，该方法应返回 `false`。因此，在此方法中，你应尝试判断给定的 `$sitePath` 是否包含你正试图运行的类型的项目。

例如，假设我们在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能如下所示：

```php
/**
 * Determine if the driver serves the request.
 */
public function serves(string $sitePath, string $siteName, string $uri): bool
{
    return is_dir($sitePath.'/wp-admin');
}
```

<a name="the-isstaticfile-method"></a>
#### `isStaticFile` 方法

`isStaticFile` 应判断传入请求是否针对"静态"文件，例如图片或样式表。如果文件是静态的，该方法应返回磁盘上静态文件的完整限定路径。如果传入请求不是针对静态文件，该方法应返回 `false`：

```php
/**
 * Determine if the incoming request is for a static file.
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
> 只有当传入请求的 `serves` 方法返回 `true` 且请求 URI 不是 `/` 时，才会调用 `isStaticFile` 方法。

<a name="the-frontcontrollerpath-method"></a>
#### `frontControllerPath` 方法

`frontControllerPath` 方法应返回应用"前端控制器"的完整限定路径，通常是"index.php"文件或等效文件：

```php
/**
 * Get the fully resolved path to the application's front controller.
 */
public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
{
    return $sitePath.'/public/index.php';
}
```

<a name="local-drivers"></a>
### 本地驱动

如果你想为单个应用定义自定义 Valet 驱动，请在应用的根目录创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以继承基础 `ValetDriver` 类，或继承现有的应用专属驱动，如 `LaravelValetDriver`：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * Determine if the driver serves the request.
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * Get the fully resolved path to the application's front controller.
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

<a name="other-valet-commands"></a>
## 其他 Valet 命令

<div class="overflow-auto">

| 命令 | 描述 |
| --- | --- |
| `valet list` | 显示所有 Valet 命令的列表。 |
| `valet diagnose` | 输出诊断信息以帮助调试 Valet。 |
| `valet directory-listing` | 决定目录列表行为。默认值为 "off"，即对目录渲染 404 页面。 |
| `valet forget` | 从"托管"目录中运行此命令，将其从托管目录列表中移除。 |
| `valet log` | 查看由 Valet 服务写入的日志列表。 |
| `valet paths` | 查看你的所有"托管"路径。 |
| `valet restart` | 重启 Valet 守护进程。 |
| `valet start` | 启动 Valet 守护进程。 |
| `valet stop` | 停止 Valet 守护进程。 |
| `valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，使 Valet 命令无需输入密码即可运行。 |
| `valet uninstall` | 卸载 Valet：显示手动卸载说明。传递 `--force` 选项可彻底删除 Valet 的所有资源。 |

</div>

<a name="valet-directories-and-files"></a>
## Valet 目录与文件

在排查 Valet 环境问题时，你可能会发现以下目录和文件信息很有帮助：

#### `~/.config/valet`

包含 Valet 的所有配置。你可能希望保留此目录的备份。

#### `~/.config/valet/dnsmasq.d/`

此目录包含 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

此目录包含 Valet 的驱动。驱动决定了特定框架 / CMS 如何被运行。

#### `~/.config/valet/Nginx/`

此目录包含 Valet 的所有 Nginx 站点配置。这些文件会在运行 `install` 和 `secure` 命令时重新构建。

#### `~/.config/valet/Sites/`

此目录包含你的[链接项目](#the-link-command)的所有符号链接。

#### `~/.config/valet/config.json`

此文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

此文件是 Valet 的 Nginx 安装使用的 PHP-FPM socket。只有当 PHP 正常运行时才存在。

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

此文件是用于为你的站点构建 SSL 证书的默认 Nginx 配置。

<a name="disk-access"></a>
### 磁盘访问

自 macOS 10.14 起，[默认会限制对某些文件和目录的访问](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制包括桌面、文稿和下载目录。此外，网络卷和可移动卷的访问也受到限制。因此，Valet 建议你的站点文件夹位于这些受保护位置之外。

但是，如果你想从这些位置之一运行站点，你需要为 Nginx 授予"完全磁盘访问权限"。否则，你可能会遇到来自 Nginx 的服务器错误或其他不可预测的行为，尤其是在提供静态资源时。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。或者，你也可以通过 `系统偏好设置` > `安全性与隐私` > `隐私`并选择`完全磁盘访问权限`来手动完成。然后，在主窗口窗格中启用任何 `nginx` 条目。
