# 配置

- [简介](#introduction)
- [环境配置](#environment-configuration)
    - [环境变量类型](#environment-variable-types)
    - [检索环境配置](#retrieving-environment-configuration)
    - [判断当前环境](#determining-the-current-environment)
    - [加密环境文件](#encrypting-environment-files)
- [访问配置值](#accessing-configuration-values)
- [配置缓存](#configuration-caching)
- [配置发布](#configuration-publishing)
- [调试模式](#debug-mode)
- [维护模式](#maintenance-mode)

<a name="introduction"></a>
## 简介

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，欢迎你浏览这些文件并熟悉可用的选项。

这些配置文件允许你配置数据库连接信息、邮件服务器信息，以及其他各种核心配置值，例如应用程序 URL 和加密密钥。

<a name="the-about-command"></a>
#### `about` 命令

Laravel 可以通过 `about` Artisan 命令显示应用程序配置、驱动和环境的概览。

```shell
php artisan about
```

如果你只对应用程序概览输出的某个特定部分感兴趣，可以使用 `--only` 选项来筛选该部分：

```shell
php artisan about --only=environment
```

或者，要详细查看某个特定配置文件的值，可以使用 `config:show` Artisan 命令：

```shell
php artisan config:show database
```

<a name="environment-configuration"></a>
## 环境配置

根据应用程序运行的环境使用不同的配置值通常很有帮助。例如，你可能希望在本地使用与生产服务器不同的缓存驱动。

为了让这件事轻而易举，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在一个全新的 Laravel 安装中，应用程序的根目录会包含一个 `.env.example` 文件，其中定义了许多常见的环境变量。在 Laravel 安装过程中，该文件会自动被复制为 `.env`。

Laravel 默认的 `.env` 文件包含一些常见的配置值，这些值可能会因应用程序是在本地运行还是在生产 Web 服务器上运行而有所不同。然后，这些配置值会被 `config` 目录中的配置文件通过 Laravel 的 `env` 函数读取。

如果你正在团队中开发，你可能希望继续包含并更新应用程序的 `.env.example` 文件。通过在示例配置文件中放入占位值，团队中的其他开发人员可以清楚地看到运行你的应用程序需要哪些环境变量。

> [!NOTE]
> `.env` 文件中的任何变量都可以被外部环境变量（例如服务器级或系统级环境变量）覆盖。

<a name="environment-file-security"></a>
#### 环境文件安全

你的 `.env` 文件不应提交到应用程序的源代码控制中，因为每个使用你应用程序的开发人员 / 服务器可能需要不同的环境配置。此外，如果入侵者获得了你的源代码控制仓库的访问权限，这会带来安全风险，因为所有敏感凭据都会暴露。

不过，你可以使用 Laravel 内置的 [环境加密](#encrypting-environment-files) 来加密你的环境文件。加密后的环境文件可以安全地放入源代码控制中。

<a name="additional-environment-files"></a>
#### 额外的环境文件

在加载应用程序的环境变量之前，Laravel 会判断是否已经外部提供了 `APP_ENV` 环境变量，或者是否指定了 `--env` CLI 参数。如果是，Laravel 会尝试加载 `.env.[APP_ENV]` 文件（如果存在）。如果不存在，则会加载默认的 `.env` 文件。

<a name="environment-variable-types"></a>
### 环境变量类型

`.env` 文件中的所有变量通常都被解析为字符串，因此创建了一些保留值，以便你可以从 `env()` 函数返回更广泛的类型：

<div class="overflow-auto">

| `.env` Value | `env()` Value |
| ------------ | ------------- |
| true         | (bool) true   |
| (true)       | (bool) true   |
| false        | (bool) false  |
| (false)      | (bool) false  |
| empty        | (string) ''   |
| (empty)      | (string) ''   |
| null         | (null) null   |
| (null)       | (null) null   |

</div>

如果你需要定义一个值中包含空格的环境变量，可以通过将值用双引号括起来来实现：

```ini
APP_NAME="My Application"
```

<a name="retrieving-environment-configuration"></a>
### 检索环境配置

`.env` 文件中列出的所有变量都会在应用程序接收到请求时加载到 `$_ENV` PHP 超全局变量中。不过，你可以在配置文件中使用 `env` 函数来检索这些变量的值。事实上，如果你查看 Laravel 的配置文件，你会发现许多选项已经在使用这个函数：

```php
'debug' => (bool) env('APP_DEBUG', false),
```

传递给 `env` 函数的第二个值是“默认值”。如果给定键不存在对应的环境变量，则返回该值。

<a name="determining-the-current-environment"></a>
### 判断当前环境

当前应用程序环境通过 `.env` 文件中的 `APP_ENV` 变量来确定。你可以通过 `App` [Facade](/docs/{{version}}/facades) 上的 `environment` 方法来访问该值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

你也可以向 `environment` 方法传递参数，以判断环境是否与给定值匹配。如果环境与任意一个给定值匹配，该方法将返回 `true`：

```php
if (App::environment('local')) {
    // 环境为 local
}

if (App::environment(['local', 'staging'])) {
    // 环境为 local 或 staging……
}
```

> [!NOTE]
> 当前应用程序环境的判断可以通过定义服务器级的 `APP_ENV` 环境变量来覆盖。

<a name="encrypting-environment-files"></a>
### 加密环境文件

未加密的环境文件绝不应存储在源代码控制中。不过，Laravel 允许你加密环境文件，以便它们可以安全地与应用程序的其余部分一起添加到源代码控制中。

<a name="encryption"></a>
#### 加密

要加密环境文件，可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

运行 `env:encrypt` 命令会加密你的 `.env` 文件，并将加密内容放入 `.env.encrypted` 文件。解密密钥会在命令的输出中展示，应当存储在安全的密码管理器中。如果你想提供自己的加密密钥，可以在调用命令时使用 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

> [!NOTE]
> 提供的密钥长度应与所用加密密码所需的密钥长度相匹配。默认情况下，Laravel 会使用 `AES-256-CBC` 密码，它需要 32 个字符的密钥。你可以通过在调用命令时传递 `--cipher` 选项，自由使用 Laravel 的 [加密器](/docs/{{version}}/encryption) 支持的任何密码。

如果你的应用程序有多个环境文件，例如 `.env` 和 `.env.staging`，你可以通过 `--env` 选项提供环境名称来指定要加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

<a name="readable-variable-names"></a>
#### 可读的变量名

加密环境文件时，可以使用 `--readable` 选项在加密值的同时保留可见的变量名：

```shell
php artisan env:encrypt --readable
```

这将生成一个如下格式的加密文件：

```ini
APP_NAME=eyJpdiI6...
APP_ENV=eyJpdiI6...
APP_KEY=eyJpdiI6...
APP_DEBUG=eyJpdiI6...
APP_URL=eyJpdiI6...
```

使用可读格式可以让你在无需暴露敏感数据的情况下查看存在哪些环境变量。这也使审查拉取请求变得容易得多，因为你可以在不需要解密文件的情况下看到哪些变量被添加、删除或重命名。

解密环境文件时，Laravel 会自动检测所使用的格式，因此 `env:decrypt` 命令不需要额外的选项。

> [!NOTE]
> 使用 `--readable` 选项时，原始环境文件中的注释和空行不会包含在加密输出中。

<a name="decryption"></a>
#### 解密

要解密环境文件，可以使用 `env:decrypt` 命令。该命令需要一个解密密钥，Laravel 将从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量中获取该密钥：

```shell
php artisan env:decrypt
```

或者，可以通过 `--key` 选项直接将密钥提供给命令：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

调用 `env:decrypt` 命令时，Laravel 会解密 `.env.encrypted` 文件的内容，并将解密后的内容放入 `.env` 文件。

可以向 `env:decrypt` 命令提供 `--cipher` 选项以使用自定义加密密码：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果你的应用程序有多个环境文件，例如 `.env` 和 `.env.staging`，你可以通过 `--env` 选项提供环境名称来指定要解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

为了覆盖已有的环境文件，可以向 `env:decrypt` 命令提供 `--force` 选项：

```shell
php artisan env:decrypt --force
```

<a name="accessing-configuration-values"></a>
## 访问配置值

你可以轻松地在应用程序的任何位置使用 `Config` Facade 或全局 `config` 函数访问你的配置值。可以使用“点”语法访问配置值，其中包含你要访问的文件名和选项名。也可以指定一个默认值，如果配置选项不存在，则返回该默认值：

```php
use Illuminate\Support\Facades\Config;

$value = Config::get('app.timezone');

$value = config('app.timezone');

// 如果配置值不存在则检索一个默认值……
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，可以调用 `Config` Facade 的 `set` 方法，或者向 `config` 函数传递一个数组：

```php
Config::set('app.timezone', 'America/Chicago');

config(['app.timezone' => 'America/Chicago']);
```

为了辅助静态分析，`Config` Facade 还提供了带类型的配置检索方法。如果检索到的配置值与期望的类型不匹配，将抛出异常：

```php
Config::string('config-key');
Config::integer('config-key');
Config::float('config-key');
Config::boolean('config-key');
Config::array('config-key');
Config::collection('config-key');
```

<a name="configuration-caching"></a>
## 配置缓存

为了给应用程序提速，应当使用 `config:cache` Artisan 命令将所有配置文件缓存到单个文件中。这会将应用程序的所有配置选项合并到一个文件中，框架可以快速加载该文件。

通常应当在生产部署流程中运行 `php artisan config:cache` 命令。不应在本地开发期间运行该命令，因为在应用程序开发过程中配置选项会频繁更改。

配置缓存后，框架在请求或 Artisan 命令期间不会加载应用程序的 `.env` 文件；因此，`env` 函数只会返回外部的、系统级的环境变量。

出于这个原因，你应当确保只在应用程序的配置文件（`config` 文件）中调用 `env` 函数。通过检查 Laravel 的默认配置文件，你可以看到许多这样的示例。配置值可以在应用程序的任何位置使用 [上文所述的](#accessing-configuration-values) `config` 函数来访问。

可以使用 `config:clear` 命令清除缓存的配置：

```shell
php artisan config:clear
```

> [!WARNING]
> 如果在部署流程中执行了 `config:cache` 命令，你应当确保只在配置文件中调用 `env` 函数。配置缓存后，`.env` 文件将不会被加载；因此，`env` 函数只会返回外部的、系统级的环境变量。

<a name="configuration-publishing"></a>
## 配置发布

大多数 Laravel 的配置文件已经发布到应用程序的 `config` 目录中；不过，某些配置文件（如 `cors.php` 和 `view.php`）默认不会发布，因为大多数应用程序永远不需要修改它们。

不过，你可以使用 `config:publish` Artisan 命令发布任何默认未发布的配置文件：

```shell
php artisan config:publish

php artisan config:publish --all
```

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 `debug` 选项决定了向用户显示多少关于错误的信息。默认情况下，该选项被设置为遵循 `APP_DEBUG` 环境变量的值，该变量存储在你的 `.env` 文件中。

> [!WARNING]
> 对于本地开发，你应当将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，该值应始终为 `false`。如果在生产中将变量设置为 `true`，你就有将敏感配置值暴露给应用程序最终用户的风险。**

<a name="maintenance-mode"></a>
## 维护模式

当应用程序处于维护模式时，所有进入应用程序的请求都会显示一个自定义视图。这使得在应用程序更新或你正在执行维护时，可以轻松“禁用”你的应用程序。默认的维护模式检查已包含在应用程序的中间件栈中。如果应用程序处于维护模式，将抛出一个 `Symfony\Component\HttpKernel\Exception\HttpException` 实例，其状态码为 503。

要启用维护模式，执行 `down` Artisan 命令：

```shell
php artisan down
```

如果你希望所有维护模式响应都发送 `Refresh` HTTP 头部，可以在调用 `down` 命令时提供 `refresh` 选项。`Refresh` 头部会指示浏览器在指定的秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

你还可以向 `down` 命令提供 `retry` 选项，该值将被设置为 `Retry-After` HTTP 头部的值，不过浏览器通常会忽略该头部：

```shell
php artisan down --retry=60
```

<a name="bypassing-maintenance-mode"></a>
#### 绕过维护模式

要允许使用密钥令牌绕过维护模式，可以使用 `secret` 选项来指定一个维护模式绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

将应用程序置于维护模式后，你可以导航到与该令牌匹配的应用程序 URL，Laravel 会向你的浏览器签发一个维护模式绕过 Cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

如果你希望 Laravel 为你生成密钥令牌，可以使用 `with-secret` 选项。一旦应用程序进入维护模式，该密钥就会显示给你：

```shell
php artisan down --with-secret
```

访问此隐藏路由后，你将被重定向到应用程序的 `/` 路由。一旦 Cookie 签发到你的浏览器，你就可以像应用程序未处于维护模式一样正常浏览。

> [!NOTE]
> 你的维护模式密钥通常应由字母数字字符以及可选的横杠组成。你应当避免使用在 URL 中具有特殊含义的字符，例如 `?` 或 `&`。

<a name="maintenance-mode-on-multiple-servers"></a>
#### 多服务器上的维护模式

默认情况下，Laravel 使用基于文件系统的机制来判断应用程序是否处于维护模式。这意味着要激活维护模式，必须在托管你的应用程序的每台服务器上执行 `php artisan down` 命令。

或者，Laravel 提供了一种基于缓存的维护模式处理方式。这种方式只需要在其中一台服务器上运行 `php artisan down` 命令。要使用这种方式，请修改应用程序 `.env` 文件中的维护模式变量。你应当选择一个所有服务器都可访问的缓存 `store`。这能确保维护模式状态在每台服务器上保持一致：

```ini
APP_MAINTENANCE_DRIVER=cache
APP_MAINTENANCE_STORE=database
```

<a name="pre-rendering-the-maintenance-mode-view"></a>
#### 预渲染维护模式视图

如果你在部署期间使用 `php artisan down` 命令，当你的 Composer 依赖或其他基础设施组件正在更新时，如果用户访问应用程序，他们可能仍会偶尔遇到错误。这是因为必须先启动 Laravel 框架的很大一部分，才能判断应用程序处于维护模式并使用模板引擎渲染维护模式视图。

出于这个原因，Laravel 允许你预渲染一个维护模式视图，该视图会在请求周期的最开始返回。该视图在你的任何应用程序依赖加载之前就渲染。你可以使用 `down` 命令的 `render` 选项来预渲染你选择的模板：

```shell
php artisan down --render="errors::503"
```

<a name="redirecting-maintenance-mode-requests"></a>
#### 重定向维护模式请求

在维护模式下，Laravel 会对用户尝试访问的所有应用程序 URL 显示维护模式视图。如果你愿意，可以指示 Laravel 将所有请求重定向到特定的 URL。这可以通过 `redirect` 选项来实现。例如，你可能希望将所有请求重定向到 `/` URI：

```shell
php artisan down --redirect=/
```

<a name="disabling-maintenance-mode"></a>
#### 禁用维护模式

要禁用维护模式，使用 `up` 命令：

```shell
php artisan up
```

> [!NOTE]
> 你可以通过在 `resources/views/errors/503.blade.php` 定义自己的模板来自定义默认的维护模式模板。

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当你的应用程序处于维护模式时，不会处理任何 [队列任务](/docs/{{version}}/queues)。一旦应用程序退出维护模式，任务将继续照常处理。

<a name="alternatives-to-maintenance-mode"></a>
#### 维护模式的替代方案

由于维护模式要求你的应用程序有数秒的停机时间，请考虑在像 [Laravel Cloud](https://cloud.laravel.com) 这样的全托管平台上运行你的应用程序，以使用 Laravel 实现零停机部署。
