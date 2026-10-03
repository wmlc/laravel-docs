# Laravel Valet

- [简介](#introduction)
- [安装](#installation)
    - [升级 Valet](#upgrading-valet)
- [提供站点服务](#serving-sites)
    - [`park` 命令](#the-park-command)
    - [`link` 命令](#the-link-command)
    - [使用 TLS 保护站点](#securing-sites)
    - [提供默认站点服务](#serving-a-default-site)
    - [按站点指定 PHP 版本](#per-site-php-versions)
- [共享站点](#sharing-sites)
    - [在本地网络中共享站点](#sharing-sites-on-your-local-network)
- [站点专属环境变量](#site-specific-environment-variables)
- [代理服务](#proxying-services)
- [自定义 Valet 驱动](#custom-valet-drivers)
    - [本地驱动](#local-drivers)
- [其他 Valet 命令](#other-valet-commands)
- [Valet 目录与文件](#valet-directories-and-files)
    - [磁盘访问权限](#disk-access)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 想找一种在 macOS 或 Windows 上开发 Laravel 应用的更简单方式吗？快来看看 [Laravel Herd](https://herd.laravel.com)。Herd 包含了上手 Laravel 开发所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是一款面向 macOS 极简主义者的开发环境。Laravel Valet 会配置你的 Mac，使 [Nginx](https://www.nginx.com/) 在机器启动时始终在后台运行。随后，Valet 使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq) 把 `*.test` 域名上的所有请求代理到安装在你本地机器上的站点。

换句话说，Valet 是一套极速的 Laravel 开发环境，仅占用大约 7 MB 内存。Valet 并不能完全替代 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead)，但如果你想要灵活的基础环境、追求极致速度，或者正在使用内存受限的机器，它会是一个很好的替代方案。

Valet 开箱即用的支持包括但不限于：

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

不过，你也可以通过自己的[自定义驱动](#custom-valet-drivers)来扩展 Valet。

<a name="installation"></a>
## 安装

> [!WARNING]
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。安装前，你应当确保没有 Apache 或 Nginx 等其他程序占用你本地机器的 80 端口。

要开始使用，你首先需要用 `update` 命令确保 Homebrew 已是最新版本：

```shell
brew update
```

接下来，你应当使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装好 PHP 后，你就可以安装 [Composer 包管理器](https://getcomposer.org)了。此外，你应当确保 `$HOME/.composer/vendor/bin` 目录在系统的"PATH"中。Composer 安装完成后，你可以把 Laravel Valet 作为全局 Composer 包安装：

```shell
composer global require laravel/valet
```

最后，你可以执行 Valet 的 `install` 命令。它会配置并安装 Valet 和 DnsMasq。此外，Valet 所依赖的守护进程会被配置为在系统启动时启动：

```shell
valet install
```

Valet 安装完成后，试着在终端里用 `ping foobar.test` 之类的命令 ping 任意 `*.test` 域名。如果 Valet 安装正确，你应该会看到该域名在 `127.0.0.1` 上作出响应。

每次机器启动时，Valet 都会自动启动所需的服务。

<a name="php-versions"></a>
#### PHP 版本

> [!NOTE]
> 与其修改全局 PHP 版本，你也可以通过 `isolate` [命令](#per-site-php-versions)指示 Valet 按站点使用不同的 PHP 版本。

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果指定版本尚未安装，Valet 会通过 Homebrew 进行安装：

```shell
valet use php@8.2

valet use php
```

你也可以在项目根目录创建一个 `.valetrc` 文件。该 `.valetrc` 文件应当包含站点要使用的 PHP 版本：

```shell
php=php@8.2
```

创建该文件后，你只需执行 `valet use` 命令，该命令会通过读取该文件来确定站点偏好的 PHP 版本。

> [!WARNING]
> 即使你安装了多个 PHP 版本，Valet 也只会同时提供一个 PHP 版本。

<a name="database"></a>
#### 数据库

如果你的应用需要数据库，可以看看 [DBngin](https://dbngin.com)，它提供了一款免费的一体化数据库管理工具，涵盖 MySQL、PostgreSQL 和 Redis。安装 DBngin 后，你就可以使用 `root` 用户名和空字符串密码，通过 `127.0.0.1` 连接到数据库。

<a name="resetting-your-installation"></a>
#### 重置你的安装

如果你的 Valet 安装运行不正常，执行 `composer global require laravel/valet` 命令后再执行 `valet install`，可以重置安装并解决各种问题。极少数情况下，你可能需要执行 `valet uninstall --force` 再执行 `valet install`，来"硬重置"Valet。

<a name="upgrading-valet"></a>
### 升级 Valet

你可以在终端里执行 `composer global require laravel/valet` 命令来更新 Valet 安装。升级完成后，最好再运行一次 `valet install` 命令，这样 Valet 就能在必要时对你的配置文件做额外升级。

<a name="upgrading-to-valet-4"></a>
#### 升级到 Valet 4

如果你要从 Valet 3 升级到 Valet 4，请执行以下步骤来正确升级 Valet 安装：

<div class="content-list" markdown="1">

- 如果你添加了 `.valetphprc` 文件来自定义站点的 PHP 版本，请把每个 `.valetphprc` 文件重命名为 `.valetrc`。然后，在 `.valetrc` 文件的现有内容前面加上 `php=`。
- 更新所有自定义驱动，使其命名空间、扩展名、类型提示和返回类型提示与新驱动系统保持一致。你可以把 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例参考。
- 如果你使用 PHP 7.1 - 7.4 来提供站点服务，请确保你仍然使用 Homebrew 安装 8.0 或更高版本的 PHP，因为 Valet 会使用该版本运行它的一些脚本，即使它不是你主要链接的版本。

</div>

<a name="serving-sites"></a>
## 提供站点服务

Valet 安装完成后，你就可以开始为你的 Laravel 应用提供服务。Valet 提供了两个命令来帮助你提供应用服务：`park` 和 `link`。

<a name="the-park-command"></a>
### `park` 命令

`park` 命令会在你的机器上注册一个存放应用的目录。一旦该目录被 Valet"停放"，其中的所有目录都可以在 Web 浏览器中通过 `http://<directory-name>.test` 访问：

```shell
cd ~/Sites

valet park
```

事情就这么简单。现在，你在"停放"目录中创建的任何应用，都会自动按照 `http://<directory-name>.test` 的约定提供服务。因此，如果你的停放目录中包含一个名为 "laravel" 的目录，该目录中的应用就可以通过 `http://laravel.test` 访问。此外，Valet 还自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

<a name="the-link-command"></a>
### `link` 命令

`link` 命令同样可以用来为你的 Laravel 应用提供服务。如果你想提供服务的是某个目录中的单个站点，而不是整个目录，这个命令会非常有用：

```shell
cd ~/Sites/laravel

valet link
```

一旦使用 `link` 命令把应用链接到 Valet，你就可以用其目录名访问该应用。因此，上面示例中链接的站点可以通过 `http://laravel.test` 访问。此外，Valet 还自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

如果你想在不同的主机名下提供该应用服务，可以把主机名传给 `link` 命令。例如，你可以运行以下命令，让应用可通过 `http://application.test` 访问：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域名上提供应用服务：

```shell
valet link api.application
```

你可以执行 `links` 命令，显示所有已链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于销毁某个站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

<a name="securing-sites"></a>
### 使用 TLS 保护站点

默认情况下，Valet 通过 HTTP 提供站点服务。不过，如果你想使用 HTTP/2 通过加密的 TLS 提供站点服务，可以使用 `secure` 命令。例如，如果你的站点正由 Valet 在 `laravel.test` 域名下提供服务，你应当运行以下命令来保护它：

```shell
valet secure laravel
```

要"取消保护"某个站点并恢复为通过纯 HTTP 提供其流量，请使用 `unsecure` 命令。与 `secure` 命令一样，该命令接受你希望取消保护的主机名：

```shell
valet unsecure laravel
```

<a name="serving-a-default-site"></a>
### 提供默认站点服务

有时你可能希望配置 Valet，让访问未知 `test` 域名时提供一个"默认"站点，而不是 `404`。为此，你可以在 `~/.config/valet/config.json` 配置文件中添加一个 `default` 选项，其中填入应作为默认站点的站点路径：

    "default": "/Users/Sally/Sites/example-site",

<a name="per-site-php-versions"></a>
### 按站点指定 PHP 版本

默认情况下，Valet 使用你全局安装的 PHP 来提供站点服务。不过，如果你需要在不同站点上支持多个 PHP 版本，可以使用 `isolate` 命令指定某个特定站点应使用的 PHP 版本。`isolate` 命令会配置 Valet 对当前工作目录中的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果你的站点名称与包含它的目录名不一致，可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为方便起见，你可以使用 `valet php`、`composer` 和 `which-php` 命令，根据站点配置的 PHP 版本把调用代理到相应的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令，显示所有已隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要把某个站点恢复为使用 Valet 全局安装的 PHP 版本，你可以在站点根目录中调用 `unisolate` 命令：

```shell
valet unisolate
```

<a name="sharing-sites"></a>
## 共享站点

Valet 内置了一个可以把本地站点分享到互联网的命令，方便你在移动设备上测试站点，或与团队成员和客户分享。

Valet 开箱即用地支持通过 ngrok 或 Expose 分享站点。在分享站点之前，你应当使用 `share-tool` 命令更新 Valet 配置，并指定 `ngrok` 或 `expose`：

```shell
valet share-tool ngrok
```

如果你选择了某个工具，但没有通过 Homebrew（ngrok）或 Composer（Expose）安装它，Valet 会自动提示你安装。当然，在开始分享站点之前，这两个工具都要求你先认证自己的 ngrok 或 Expose 账户。

要分享站点，请在终端中进入站点目录并运行 Valet 的 `share` 命令。一个可公开访问的 URL 会被放入你的剪贴板，你可以直接粘贴到浏览器中，或分享给你的团队：

```shell
cd ~/Sites/laravel

valet share
```

要停止分享站点，你可以按 `Control + C`。

> [!WARNING]
> 如果你使用自定义 DNS 服务器（如 `1.1.1.1`），ngrok 分享可能无法正常工作。如果你的机器上出现这种情况，请打开 Mac 的系统设置，进入网络设置，打开高级设置，然后转到 DNS 标签页，把 `127.0.0.1` 添加为你的第一个 DNS 服务器。

<a name="sharing-sites-via-ngrok"></a>
#### 通过 Ngrok 分享站点

使用 ngrok 分享站点需要你先[创建 ngrok 账户](https://dashboard.ngrok.com/signup)并[设置认证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。拿到认证令牌后，你就可以用该令牌更新 Valet 配置：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]
> 你可以向 share 命令传入额外的 ngrok 参数，例如 `valet share --region=eu`。更多信息请查阅 [ngrok 文档](https://ngrok.com/docs)。

<a name="sharing-sites-via-expose"></a>
#### 通过 Expose 分享站点

使用 Expose 分享站点需要你先[创建 Expose 账户](https://expose.dev/register)，并[通过认证令牌与 Expose 认证](https://expose.dev/docs/getting-started/getting-your-token)。

关于它支持的其他命令行参数，请查阅 [Expose 文档](https://expose.dev/docs)。

<a name="sharing-sites-on-your-local-network"></a>
### 在本地网络中共享站点

Valet 默认会把传入流量限制在内部的 `127.0.0.1` 接口上，以免你的开发机器暴露于来自互联网的安全风险。

如果你希望允许本地网络中的其他设备通过你机器的 IP 地址访问机器上的 Valet 站点（例如 `192.168.1.10/application.test`），就需要手动编辑该站点对应的 Nginx 配置文件，移除 `listen` 指令上的限制。你应当移除 80 和 443 端口的 `listen` 指令上的 `127.0.0.1:` 前缀。

如果你尚未对该项目运行 `valet secure`，可以编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件，为所有非 HTTPS 站点放开网络访问。不过，如果你正通过 HTTPS 提供项目站点服务（即已对该站点运行了 `valet secure`），则应当编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令以应用配置变更。

<a name="site-specific-environment-variables"></a>
## 站点专属环境变量

有些使用其他框架的应用可能依赖服务器环境变量，却没有提供在项目中配置这些变量的方式。Valet 允许你通过在项目根目录添加 `.valet-env.php` 文件来配置站点专属环境变量。该文件应当返回一个站点 / 环境变量对的数组，对于数组中指定的每个站点，这些变量都会被加入全局 `$_SERVER` 数组：

    <?php

    return [
        // 为 laravel.test 站点把 $_SERVER['key'] 设为 "value"...
        'laravel' => [
            'key' => 'value',
        ],

        // 为所有站点把 $_SERVER['key'] 设为 "value"...
        '*' => [
            'key' => 'value',
        ],
    ];

<a name="proxying-services"></a>
## 代理服务

有时你可能希望把某个 Valet 域名代理到本地机器上的另一个服务。例如，你偶尔需要一边运行 Valet，一边在 Docker 中运行另一个站点；然而，Valet 和 Docker 无法同时占用 80 端口。

为此，你可以使用 `proxy` 命令生成一个代理。例如，你可以把来自 `http://elasticsearch.test` 的所有流量代理到 `http://127.0.0.1:9200`：

```shell
# 通过 HTTP 代理...
valet proxy elasticsearch http://127.0.0.1:9200

# 通过 TLS + HTTP/2 代理...
valet proxy elasticsearch http://127.0.0.1:9200 --secure
```

你可以使用 `unproxy` 命令移除一个代理：

```shell
valet unproxy elasticsearch
```

你可以使用 `proxies` 命令列出所有已被代理的站点配置：

```shell
valet proxies
```

<a name="custom-valet-drivers"></a>
## 自定义 Valet 驱动

你可以编写自己的 Valet "驱动"，以便为运行在 Valet 本身不支持的框架或 CMS 上的 PHP 应用提供服务。安装 Valet 时会创建一个 `~/.config/valet/Drivers` 目录，其中包含一个 `SampleValetDriver.php` 文件。该文件包含一份驱动示例实现，用来演示如何编写自定义驱动。编写驱动只需要你实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

这三个方法都会接收 `$sitePath`、`$siteName` 和 `$uri` 作为参数。`$sitePath` 是你机器上正在提供服务的站点的完整路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域名中的"主机" / "站点名"部分（`my-project`）。`$uri` 是传入请求的 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，请按照 `FrameworkValetDriver.php` 的命名约定，把它放入 `~/.config/valet/Drivers` 目录。例如，如果你要为 WordPress 编写自定义 Valet 驱动，文件名应当是 `WordPressValetDriver.php`。

我们来看一下自定义 Valet 驱动应当实现的每个方法的示例实现。

<a name="the-serves-method"></a>
#### `serves` 方法

如果你的驱动应当处理传入请求，`serves` 方法应当返回 `true`；否则应当返回 `false`。因此，在这个方法中，你应当尝试判断给定的 `$sitePath` 是否包含一个你想提供服务的类型的项目。

例如，假设我们正在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能看起来如下：

    /**
     * 判断该驱动是否为请求提供服务。
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return is_dir($sitePath.'/wp-admin');
    }

<a name="the-isstaticfile-method"></a>
#### `isStaticFile` 方法

`isStaticFile` 方法用于判断传入请求是否针对某个"静态"文件，例如图片或样式表。如果该文件是静态的，该方法应当返回该静态文件在磁盘上的完整路径。如果传入请求并非针对静态文件，该方法应当返回 `false`：

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

> [!WARNING]
> 只有当 `serves` 方法对传入请求返回 `true`，且请求 URI 不是 `/` 时，才会调用 `isStaticFile` 方法。

<a name="the-frontcontrollerpath-method"></a>
#### `frontControllerPath` 方法

`frontControllerPath` 方法应当返回你的应用"前端控制器"的完整路径，它通常是一个 "index.php" 文件或类似文件：

    /**
     * 获取应用前端控制器的完整解析路径。
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public/index.php';
    }

<a name="local-drivers"></a>
### 本地驱动

如果你想为单个应用定义自定义 Valet 驱动，请在应用根目录创建 `LocalValetDriver.php` 文件。你的自定义驱动可以继承基础的 `ValetDriver` 类，也可以继承某个现有的应用专属驱动，例如 `LaravelValetDriver`：

    use Valet\Drivers\LaravelValetDriver;

    class LocalValetDriver extends LaravelValetDriver
    {
        /**
         * 判断该驱动是否为请求提供服务。
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

<a name="other-valet-commands"></a>
## 其他 Valet 命令

<div class="overflow-auto">

| 命令 | 说明 |
| --- | --- |
| `valet list` | 显示所有 Valet 命令的列表。 |
| `valet diagnose` | 输出诊断信息，帮助调试 Valet。 |
| `valet directory-listing` | 决定目录列表行为。默认为 "off"，即对目录渲染 404 页面。 |
| `valet forget` | 在"停放"目录中运行此命令，可将其从停放目录列表中移除。 |
| `valet log` | 查看由 Valet 各服务写入的日志列表。 |
| `valet paths` | 查看你所有"停放"的路径。 |
| `valet restart` | 重启 Valet 守护进程。 |
| `valet start` | 启动 Valet 守护进程。 |
| `valet stop` | 停止 Valet 守护进程。 |
| `valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，以便无需输入密码即可运行 Valet 命令。 |
| `valet uninstall` | 卸载 Valet：显示手动卸载的说明。传入 `--force` 选项可强制删除 Valet 的所有资源。 |

</div>

<a name="valet-directories-and-files"></a>
## Valet 目录与文件

排查 Valet 环境问题时，以下目录和文件信息可能会有所帮助：

#### `~/.config/valet`

包含 Valet 的全部配置。你可能需要为该目录保留一份备份。

#### `~/.config/valet/dnsmasq.d/`

该目录包含 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

该目录包含 Valet 的驱动。驱动决定了特定框架 / CMS 的服务方式。

#### `~/.config/valet/Nginx/`

该目录包含 Valet 的全部 Nginx 站点配置。运行 `install` 和 `secure` 命令时会重新生成这些文件。

#### `~/.config/valet/Sites/`

该目录包含你所有[已链接项目](#the-link-command)的符号链接。

#### `~/.config/valet/config.json`

该文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

该文件是 Valet 的 Nginx 安装所使用的 PHP-FPM 套接字。只有 PHP 正常运行后该文件才会存在。

#### `~/.config/valet/Log/fpm-php.www.log`

该文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

该文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

该文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

该目录包含 Nginx 的访问日志和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

该目录包含各种 PHP 配置设置对应的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

该文件是 PHP-FPM 池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

该文件是为你的站点构建 SSL 证书时所用的默认 Nginx 配置。

<a name="disk-access"></a>
### 磁盘访问权限

自 macOS 10.14 起，[访问某些文件和目录默认受到限制](https://manuals.info.apple.com/MANUALS/1000/MA1902/en_US/apple-platform-security-guide.pdf)。这些限制涉及桌面、文稿和下载目录。此外，网络卷和可移动卷的访问也受到限制。因此，Valet 建议把你的站点文件夹放在这些受保护位置之外。

不过，如果你希望从上述某个位置提供站点服务，就需要给 Nginx"完全磁盘访问权限"。否则，你可能会遇到 Nginx 的服务器错误或其他不可预测的行为，在提供静态资源时尤其明显。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。你也可以手动完成：依次打开`系统偏好设置` > `安全与隐私` > `隐私`，并选择`完全磁盘访问权限`。接下来，在主窗口面板中启用所有 `nginx` 条目。
