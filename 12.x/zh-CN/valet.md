# Laravel Valet

- [简介](#introduction)
- [安装](#installation)
    - [升级 Valet](#upgrading-valet)
- [站点服务](#serving-sites)
    - [`park` 命令](#the-park-command)
    - [`link` 命令](#the-link-command)
    - [使用 TLS 保护站点](#securing-sites)
    - [提供默认站点](#serving-a-default-site)
    - [按站点指定 PHP 版本](#per-site-php-versions)
- [共享站点](#sharing-sites)
    - [在本地网络中共享站点](#sharing-sites-on-your-local-network)
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
> 想在 macOS 或 Windows 上以更轻松的方式开发 Laravel 应用？不妨了解一下 [Laravel Herd](https://herd.laravel.com)。Herd 包含了 Laravel 开发所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是面向 macOS 极简主义者的开发环境。Laravel Valet 会配置你的 Mac，让机器开机时总是在后台运行 [Nginx](https://www.nginx.com/)。然后，Valet 借助 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq)，把 `*.test` 域名上的所有请求代理到本地机器上安装的站点。

换句话说，Valet 是一个极速的 Laravel 开发环境，只占用大约 7 MB 内存。Valet 并不能完全替代 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead)，但如果你想要灵活的基础功能、追求极致速度，或者使用的机器内存有限，它是一个绝佳的选择。

Valet 开箱即支持的框架包括但不限于：

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

当然，你也可以通过自己的[自定义驱动](#custom-valet-drivers)来扩展 Valet。

<a name="installation"></a>
## 安装

> [!WARNING]
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。安装之前，你应当确保没有其他程序（如 Apache 或 Nginx）占用了本地机器的 80 端口。

首先，你需要使用 `update` 命令确保 Homebrew 是最新的：

```shell
brew update
```

接下来，你应当使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装 PHP 之后，就可以安装 [Composer 包管理器](https://getcomposer.org)了。此外，你应当确保 `$HOME/.composer/vendor/bin` 目录位于系统的 "PATH" 中。Composer 安装完成后，你就可以把 Laravel Valet 作为全局 Composer 包来安装：

```shell
composer global require laravel/valet
```

最后，执行 Valet 的 `install` 命令。该命令会配置并安装 Valet 和 DnsMasq。此外，Valet 依赖的守护进程也会被配置为随系统启动：

```shell
valet install
```

Valet 安装完成后，可以在终端尝试 ping 任意 `*.test` 域名，例如执行 `ping foobar.test`。如果 Valet 安装正确，你会看到该域名在 `127.0.0.1` 上做出响应。

每次机器启动时，Valet 都会自动启动它所需的服务。

<a name="php-versions"></a>
#### PHP 版本

> [!NOTE]
> 不必修改全局 PHP 版本，你可以通过 `isolate` [命令](#per-site-php-versions)让 Valet 按站点使用不同的 PHP 版本。

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果指定的 PHP 版本尚未安装，Valet 会通过 Homebrew 来安装它：

```shell
valet use php@8.2

valet use php
```

你也可以在项目根目录下创建一个 `.valetrc` 文件。`.valetrc` 文件应当包含站点要使用的 PHP 版本：

```shell
php=php@8.2
```

创建该文件后，只需执行 `valet use` 命令，命令就会读取该文件来确定站点首选的 PHP 版本。

> [!WARNING]
> Valet 一次只能服务一个 PHP 版本，即使你安装了多个 PHP 版本也是如此。

<a name="database"></a>
#### 数据库

如果你的应用需要数据库，可以了解一下 [DBngin](https://dbngin.com)。它是一款免费的一体化数据库管理工具，支持 MySQL、PostgreSQL 和 Redis。安装 DBngin 之后，你可以使用 `root` 用户名和空字符串密码，通过 `127.0.0.1` 连接数据库。

<a name="resetting-your-installation"></a>
#### 重置安装

如果你的 Valet 安装无法正常运行，依次执行 `composer global require laravel/valet` 和 `valet install` 命令可以重置安装，并解决各种问题。在极少数情况下，可能需要"硬重置"Valet，即执行 `valet uninstall --force` 再执行 `valet install`。

<a name="upgrading-valet"></a>
### 升级 Valet

你可以在终端执行 `composer global require laravel/valet` 命令来更新 Valet 安装。升级之后，最好运行一下 `valet install` 命令，让 Valet 在必要时对配置文件进行额外的升级。

<a name="upgrading-to-valet-4"></a>
#### 升级到 Valet 4

如果你正从 Valet 3 升级到 Valet 4，请按以下步骤正确升级你的 Valet 安装：

- 如果你添加过 `.valetphprc` 文件来自定义站点的 PHP 版本，请将每个 `.valetphprc` 文件重命名为 `.valetrc`，并在 `.valetrc` 文件的现有内容前加上 `php=`。
- 更新所有自定义驱动，使其匹配新驱动系统的命名空间、扩展名、类型提示和返回类型提示。你可以参考 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例。
- 如果你使用 PHP 7.1 - 7.4 来服务站点，请确保仍使用 Homebrew 安装一个 8.0 或更高版本的 PHP。因为 Valet 会使用该版本来运行它的部分脚本，即使它不是你的主链接版本。

<a name="serving-sites"></a>
## 站点服务

Valet 安装完成后，你就可以开始为 Laravel 应用提供服务了。Valet 提供了两个命令来帮助你服务应用：`park` 和 `link`。

<a name="the-park-command"></a>
### `park` 命令

`park` 命令会在你的机器上注册一个包含应用的目录。一旦该目录被 Valet"驻留"（park），该目录下的所有子目录就都可以通过浏览器以 `http://<directory-name>.test` 的形式访问：

```shell
cd ~/Sites

valet park
```

就是这么简单。现在，你在"驻留"目录中创建的任何应用，都会自动以 `http://<directory-name>.test` 的约定提供服务。例如，如果驻留目录中有一个名为 "laravel" 的目录，那么该目录下的应用就可以通过 `http://laravel.test` 访问。此外，Valet 还自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

<a name="the-link-command"></a>
### `link` 命令

`link` 命令也可以用来服务 Laravel 应用。当你只想服务某个目录下的单个站点而不是整个目录时，这个命令会很有用：

```shell
cd ~/Sites/laravel

valet link
```

一旦应用通过 `link` 命令链接到 Valet，你就可以使用其目录名访问该应用。因此，上例中链接的站点可以通过 `http://laravel.test` 访问。此外，Valet 还自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

如果想在其他主机名下提供应用，可以把主机名传给 `link` 命令。例如，运行以下命令可以让应用通过 `http://application.test` 访问：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域名上提供应用：

```shell
valet link api.application
```

你可以执行 `links` 命令来显示所有已链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于删除站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

<a name="securing-sites"></a>
### 使用 TLS 保护站点

默认情况下，Valet 通过 HTTP 服务站点。不过，如果你想使用 HTTP/2 以加密 TLS 的方式服务站点，可以使用 `secure` 命令。例如，如果你的站点由 Valet 在 `laravel.test` 域名上提供服务，你应当运行以下命令来保护它：

```shell
valet secure laravel
```

要"解除"站点的安全保护并恢复为通过普通 HTTP 服务其流量，请使用 `unsecure` 命令。与 `secure` 命令一样，该命令接受你想要解除保护的主机名：

```shell
valet unsecure laravel
```

<a name="serving-a-default-site"></a>
### 提供默认站点

有时，你可能希望配置 Valet 在访问未知的 `test` 域名时提供一个"默认"站点，而不是 `404`。为此，你可以在 `~/.config/valet/config.json` 配置文件中添加一个 `default` 选项，其值为作为默认站点的站点路径：

    "default": "/Users/Sally/Sites/example-site",

<a name="per-site-php-versions"></a>
### 按站点指定 PHP 版本

默认情况下，Valet 使用你的全局 PHP 安装来服务站点。不过，如果你需要在多个站点上支持多个 PHP 版本，可以使用 `isolate` 命令来指定特定站点应使用的 PHP 版本。`isolate` 命令会让 Valet 对当前工作目录下的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果站点名与其所在目录的名称不一致，你可以使用 `--site` 选项指定站点名：

```shell
valet isolate php@8.0 --site="site-name"
```

为了方便，你可以使用 `valet php`、`composer` 和 `which-php` 命令，根据站点配置的 PHP 版本，把调用代理到对应的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令，显示所有已隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要让站点恢复使用 Valet 全局安装的 PHP 版本，可以在站点根目录下执行 `unisolate` 命令：

```shell
valet unisolate
```

<a name="sharing-sites"></a>
## 共享站点

Valet 内置了一个与外界共享本地站点的命令，让你可以轻松在移动设备上测试站点，或与团队成员和客户分享。

开箱即用时，Valet 支持通过 ngrok 或 Expose 共享站点。在共享站点之前，你应当使用 `share-tool` 命令更新 Valet 配置，指定 `ngrok`、`expose` 或 `cloudflared`：

```shell
valet share-tool ngrok
```

如果你选择的工具尚未通过 Homebrew（针对 ngrok 和 cloudflared）或 Composer（针对 Expose）安装，Valet 会自动提示你安装它。当然，在使用这两个工具开始共享站点之前，你都需要先认证你的 ngrok 或 Expose 账户。

要共享站点，请在终端中进入站点目录，然后运行 Valet 的 `share` 命令。一个可公开访问的 URL 会被放入你的剪贴板，可以直接粘贴到浏览器中，或分享给你的团队：

```shell
cd ~/Sites/laravel

valet share
```

要停止共享站点，可以按 `Control + C`。

> [!WARNING]
> 如果你使用了自定义 DNS 服务器（如 `1.1.1.1`），ngrok 共享可能无法正常工作。如果你的机器属于这种情况，请打开 Mac 的系统设置，进入"网络"设置，打开"高级"设置，然后在 DNS 标签页中将 `127.0.0.1` 添加为第一个 DNS 服务器。

<a name="sharing-sites-via-ngrok"></a>
#### 通过 Ngrok 共享站点

使用 ngrok 共享站点需要你[创建 ngrok 账户](https://dashboard.ngrok.com/signup)并[设置身份验证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。获得身份验证令牌后，你就可以用它更新你的 Valet 配置：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]
> 你可以向 share 命令传递额外的 ngrok 参数，例如 `valet share --region=eu`。更多信息请查阅 [ngrok 文档](https://ngrok.com/docs)。

<a name="sharing-sites-via-expose"></a>
#### 通过 Expose 共享站点

使用 Expose 共享站点需要你[创建 Expose 账户](https://expose.dev/register)，并[使用你的身份验证令牌向 Expose 认证](https://expose.dev/docs/getting-started/getting-your-token)。

你可以查阅 [Expose 文档](https://expose.dev/docs)，了解它支持的更多命令行参数。

<a name="sharing-sites-on-your-local-network"></a>
### 在本地网络中共享站点

默认情况下，Valet 会把传入流量限制在内部 `127.0.0.1` 接口上，以免你的开发机器暴露在来自互联网的安全风险之中。

如果你希望允许本地网络中的其他设备通过你机器的 IP 地址（例如 `192.168.1.10/application.test`）访问你机器上的 Valet 站点，需要手动编辑该站点对应的 Nginx 配置文件，移除 `listen` 指令上的限制。你应当删除 80 和 443 端口 `listen` 指令的 `127.0.0.1:` 前缀。

如果你还没有对该项目运行过 `valet secure`，可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件，为所有非 HTTPS 站点开放网络访问。但是，如果你在通过 HTTPS 服务该站点（即你已经对该站点运行过 `valet secure`），则应当编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令使配置更改生效。

<a name="site-specific-environment-variables"></a>
## 站点专属环境变量

一些使用其他框架的应用可能依赖服务器环境变量，却没有提供在项目内配置这些变量的途径。Valet 允许你在项目根目录下添加一个 `.valet-env.php` 文件，来配置站点专属的环境变量。该文件应当返回一个"站点 / 环境变量"对的数组。对于数组中指定的每个站点，这些变量都会被添加到全局 `$_SERVER` 数组中：

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

有时你可能希望把 Valet 域名代理到本地机器上的另一个服务。例如，你可能偶尔需要在运行 Valet 的同时，在 Docker 中运行另一个站点；然而，Valet 和 Docker 无法同时绑定 80 端口。

为了解决这个问题，你可以使用 `proxy` 命令生成一个代理。例如，你可以把 `http://elasticsearch.test` 的所有流量代理到 `http://127.0.0.1:9200`：

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

你可以编写自己的 Valet "驱动"（driver），来服务运行在 Valet 原生不支持的框架或 CMS 上的 PHP 应用。安装 Valet 时，会创建一个 `~/.config/valet/Drivers` 目录，其中包含一个 `SampleValetDriver.php` 文件。该文件包含一个示例驱动实现，用于演示如何编写自定义驱动。编写驱动只需要实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

这三个方法都接收 `$sitePath`、`$siteName` 和 `$uri` 作为参数。`$sitePath` 是机器上被服务站点的完整路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域名中的"主机" / "站点名"部分（`my-project`）。`$uri` 是传入请求的 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，请按照 `FrameworkValetDriver.php` 的命名约定，把它放到 `~/.config/valet/Drivers` 目录中。例如，如果你在为 WordPress 编写自定义 Valet 驱动，文件名应当为 `WordPressValetDriver.php`。

下面我们逐个看看自定义 Valet 驱动需要实现的每个方法的示例实现。

<a name="the-serves-method"></a>
#### `serves` 方法

如果驱动应当处理传入请求，`serves` 方法就应返回 `true`；否则应返回 `false`。因此，在该方法中，你应当尝试判断给定的 `$sitePath` 中是否包含你想要服务的那种类型的项目。

例如，假设我们正在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能类似这样：

```php
/**
 * 判断该驱动是否服务此请求。
 */
public function serves(string $sitePath, string $siteName, string $uri): bool
{
    return is_dir($sitePath.'/wp-admin');
}
```

<a name="the-isstaticfile-method"></a>
#### `isStaticFile` 方法

`isStaticFile` 方法应当判断传入请求是否针对一个"静态"文件，例如图片或样式表。如果文件是静态的，该方法应当返回该静态文件在磁盘上的完整路径；如果传入请求不是针对静态文件，该方法应返回 `false`：

```php
/**
 * 判断传入请求是否针对静态文件。
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
> 只有当 `serves` 方法对传入请求返回 `true`，并且请求 URI 不是 `/` 时，才会调用 `isStaticFile` 方法。

<a name="the-frontcontrollerpath-method"></a>
#### `frontControllerPath` 方法

`frontControllerPath` 方法应当返回应用"前端控制器"的完整路径，它通常是一个 "index.php" 文件或等效文件：

```php
/**
 * 获取应用前端控制器的完整解析路径。
 */
public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
{
    return $sitePath.'/public/index.php';
}
```

<a name="local-drivers"></a>
### 本地驱动

如果你想为单个应用定义自定义 Valet 驱动，可以在应用根目录下创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以继承基类 `ValetDriver`，也可以继承现有的应用专属驱动，例如 `LaravelValetDriver`：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * 判断该驱动是否服务此请求。
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * 获取应用前端控制器的完整解析路径。
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

<a name="other-valet-commands"></a>
## 其他 Valet 命令

| 命令 | 说明 |
| --- | --- |
| `valet list` | 显示所有 Valet 命令的列表。 |
| `valet diagnose` | 输出诊断信息，帮助调试 Valet。 |
| `valet directory-listing` | 决定目录列表行为。默认为 "off"，即为目录渲染 404 页面。 |
| `valet forget` | 在"驻留"目录中运行此命令，将其从驻留目录列表中移除。 |
| `valet log` | 查看 Valet 各服务写入的日志列表。 |
| `valet paths` | 查看所有"驻留"路径。 |
| `valet restart` | 重启 Valet 守护进程。 |
| `valet start` | 启动 Valet 守护进程。 |
| `valet stop` | 停止 Valet 守护进程。 |
| `valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，允许运行 Valet 命令时无需提示输入密码。 |
| `valet uninstall` | 卸载 Valet：显示手动卸载的说明。传入 `--force` 选项将强制删除 Valet 的所有资源。 |

<a name="valet-directories-and-files"></a>
## Valet 目录与文件

排查 Valet 环境问题时，以下目录和文件信息可能会对你有所帮助：

#### `~/.config/valet`

包含 Valet 的全部配置。你可以考虑为该目录保留备份。

#### `~/.config/valet/dnsmasq.d/`

该目录包含 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

该目录包含 Valet 的驱动。驱动决定了如何服务特定的框架 / CMS。

#### `~/.config/valet/Nginx/`

该目录包含 Valet 的所有 Nginx 站点配置。运行 `install` 和 `secure` 命令时会重新生成这些文件。

#### `~/.config/valet/Sites/`

该目录包含你所有[已链接项目](#the-link-command)的符号链接。

#### `~/.config/valet/config.json`

该文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

该文件是 Valet 的 Nginx 安装所使用的 PHP-FPM socket。只有在 PHP 正常运行时它才会存在。

#### `~/.config/valet/Log/fpm-php.www.log`

该文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

该文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

该文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

该目录包含 Nginx 的访问日志和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

该目录包含各种 PHP 配置项的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

该文件是 PHP-FPM 的池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

该文件是为站点构建 SSL 证书时使用的默认 Nginx 配置。

<a name="disk-access"></a>
### 磁盘访问

自 macOS 10.14 起，[对某些文件和目录的访问默认受到限制](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制涉及"桌面"、"文稿"和"下载"目录。此外，网络卷和可移除卷的访问也受到限制。因此，Valet 建议你的站点文件夹不要位于这些受保护的位置。

不过，如果你希望在这些位置之一中服务站点，就需要授予 Nginx "完全磁盘访问权限"。否则，Nginx 可能会出现服务器错误或其他不可预测的行为，尤其是在服务静态资源时。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。你也可以手动操作：进入 `系统偏好设置` > `安全性与隐私` > `隐私`，选择 `完全磁盘访问权限`，然后在主窗口中启用所有 `nginx` 条目。
