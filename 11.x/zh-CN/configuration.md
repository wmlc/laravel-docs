# 配置

- [简介](#introduction)
- [环境配置](#environment-configuration)
    - [环境变量类型](#environment-variable-types)
    - [获取环境配置](#retrieving-environment-configuration)
    - [确定当前环境](#determining-the-current-environment)
    - [加密环境文件](#encrypting-environment-files)
- [访问配置值](#accessing-configuration-values)
- [配置缓存](#configuration-caching)
- [配置发布](#configuration-publishing)
- [调试模式](#debug-mode)
- [维护模式](#maintenance-mode)

<a name="introduction"></a>
## 简介

Laravel 框架的所有配置文件都存放在 `config` 目录中。每个选项都有文档说明，请随意浏览这些文件，熟悉你可用的选项。

这些配置文件让你可以配置数据库连接信息、邮件服务器信息，以及应用 URL、加密密钥等其他核心配置值。

<a name="the-about-command"></a>
#### `about` 命令

Laravel 可以通过 `about` Artisan 命令展示应用配置、驱动和环境的概览。

```shell
php artisan about
```

如果你只对应用概览输出中的某个特定部分感兴趣，可以使用 `--only` 选项筛选该部分：

```shell
php artisan about --only=environment
```

或者，要详细查看某个配置文件的值，可以使用 `config:show` Artisan 命令：

```shell
php artisan config:show database
```

<a name="environment-configuration"></a>
## 环境配置

根据应用运行的环境使用不同的配置值通常很有帮助。例如，你可能希望在本地使用与生产服务器不同的缓存驱动。

为让这件事变得简单，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在全新的 Laravel 安装中，应用根目录会包含一个 `.env.example` 文件，其中定义了许多常见环境变量。在 Laravel 安装过程中，该文件会自动被复制为 `.env`。

Laravel 默认的 `.env` 文件包含一些常见的配置值，这些值可能因应用是在本地运行还是在生产 Web 服务器上运行而有所不同。然后，配置文件会通过 Laravel 的 `env` 函数从 `config` 目录中读取这些值。

如果你与团队一起开发，你可能希望继续随应用一起包含并更新 `.env.example` 文件。通过在示例配置文件中放入占位值，团队中的其他开发者就能清楚地看到运行你的应用需要哪些环境变量。

> [!NOTE]
> `.env` 文件中的任何变量都可以被服务器级或系统级环境变量等外部环境变量覆盖。

<a name="environment-file-security"></a>
#### 环境文件安全

你的 `.env` 文件不应提交到应用的源代码管理中，因为使用你应用的每位开发者 / 每台服务器都可能需要不同的环境配置。此外，如果入侵者获得了你的源代码仓库访问权限，这还会构成安全风险，因为任何敏感凭据都会因此暴露。

不过，你可以使用 Laravel 内置的[环境加密](#encrypting-environment-files)功能来加密环境文件。加密后的环境文件可以安全地放入源代码管理中。

<a name="additional-environment-files"></a>
#### 额外的环境文件

在加载应用的环境变量之前，Laravel 会判断 `APP_ENV` 环境变量是否已从外部提供，或者是否指定了 `--env` CLI 参数。如果是，Laravel 会尝试加载存在的 `.env.[APP_ENV]` 文件。如果该文件不存在，则会加载默认的 `.env` 文件。

<a name="environment-variable-types"></a>
### 环境变量类型

`.env` 文件中的所有变量通常都被解析为字符串，因此 Laravel 预定义了一些保留值，让你可以通过 `env()` 函数返回更广泛的类型：

<div class="overflow-auto">

| `.env` 值 | `env()` 值 |
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

如果你需要定义一个值中包含空格的环境变量，可以用双引号把该值括起来：

```ini
APP_NAME="My Application"
```

<a name="retrieving-environment-configuration"></a>
### 获取环境配置

当应用收到请求时，`.env` 文件中列出的所有变量都会被加载到 PHP 的 `$_ENV` 超全局数组中。不过，你可以在配置文件中使用 `env` 函数从这些变量中获取值。事实上，如果你查看 Laravel 的配置文件，会发现许多选项已经在使用该函数：

```php
'debug' => env('APP_DEBUG', false),
```

传给 `env` 函数的第二个值是"默认值"。如果给定键不存在对应的环境变量，就会返回该值。

<a name="determining-the-current-environment"></a>
### 确定当前环境

当前应用环境由 `.env` 文件中的 `APP_ENV` 变量决定。你可以通过 `App` [Facade](/docs/{{version}}/facades)上的 `environment` 方法访问该值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

你也可以向 `environment` 方法传参，判断环境是否与给定值匹配。如果环境与给定值之一匹配，该方法会返回 `true`：

```php
if (App::environment('local')) {
    // 环境是 local
}

if (App::environment(['local', 'staging'])) {
    // 环境是 local 或 staging……
}
```

> [!NOTE]
> 通过定义服务器级 `APP_ENV` 环境变量，可以覆盖当前应用环境的检测结果。

<a name="encrypting-environment-files"></a>
### 加密环境文件

未加密的环境文件绝不应存入源代码管理。不过，Laravel 允许你加密环境文件，使其可以随应用一起安全地加入源代码管理。

<a name="encryption"></a>
#### 加密

要加密环境文件，你可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

运行 `env:encrypt` 命令会加密你的 `.env` 文件，并把加密后的内容放入 `.env.encrypted` 文件。解密密钥会显示在命令输出中，应将其保存在安全的密码管理器中。如果你想使用自己的加密密钥，可以在调用命令时使用 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

> [!NOTE]
> 你提供的密钥长度应与所用加密算法要求的密钥长度一致。默认情况下，Laravel 使用 `AES-256-CBC` 算法，它需要 32 个字符的密钥。你也可以在调用命令时传入 `--cipher` 选项，使用 Laravel [加密器](/docs/{{version}}/encryption)支持的任意算法。

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名，指定要加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

<a name="decryption"></a>
#### 解密

要解密环境文件，你可以使用 `env:decrypt` 命令。该命令需要一个解密密钥，Laravel 会从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量中读取它：

```shell
php artisan env:decrypt
```

或者，你可以通过 `--key` 选项直接把密钥传给该命令：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

调用 `env:decrypt` 命令时，Laravel 会解密 `.env.encrypted` 文件的内容，并把解密后的内容放入 `.env` 文件。

你可以向 `env:decrypt` 命令传入 `--cipher` 选项，以使用自定义加密算法：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名，指定要解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

要覆盖已存在的环境文件，可以向 `env:decrypt` 命令传入 `--force` 选项：

```shell
php artisan env:decrypt --force
```

<a name="accessing-configuration-values"></a>
## 访问配置值

你可以在应用中的任何位置通过 `Config` Facade 或全局 `config` 函数轻松访问配置值。访问配置值时可以使用"点"语法，其中包含你希望访问的文件名和选项名。你也可以指定一个默认值，在配置选项不存在时返回该值：

```php
use Illuminate\Support\Facades\Config;

$value = Config::get('app.timezone');

$value = config('app.timezone');

// 如果配置值不存在，则获取默认值……
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，可以调用 `Config` Facade 的 `set` 方法，或给 `config` 函数传入一个数组：

```php
Config::set('app.timezone', 'America/Chicago');

config(['app.timezone' => 'America/Chicago']);
```

为了便于静态分析，`Config` Facade 还提供了带类型的配置读取方法。如果读取到的配置值与预期类型不符，将抛出异常：

```php
Config::string('config-key');
Config::integer('config-key');
Config::float('config-key');
Config::boolean('config-key');
Config::array('config-key');
```

<a name="configuration-caching"></a>
## 配置缓存

为了提升应用速度，你应该使用 `config:cache` Artisan 命令把全部配置文件缓存到单个文件中。这会把应用的所有配置选项合并到一个文件里，框架可以快速加载该文件。

你通常应当在生产部署流程中运行 `php artisan config:cache` 命令。开发期间不要运行该命令，因为开发过程中经常需要改动配置选项。

配置缓存完成后，框架在处理请求或执行 Artisan 命令时不再加载应用的 `.env` 文件；因此，`env` 函数只会返回外部的系统级环境变量。

因此，你应确保只在应用的配置文件（`config`）中调用 `env` 函数。查看 Laravel 默认的配置文件可以看到大量这样的示例。你可以在应用中的任何位置使用 `config` 函数访问配置值，[详见上文](#accessing-configuration-values)。

你可以使用 `config:clear` 命令清除已缓存的配置：

```shell
php artisan config:clear
```

> [!WARNING]
> 如果你在部署流程中执行 `config:cache` 命令，请务必确保只在配置文件中调用 `env` 函数。配置缓存完成后，`.env` 文件不再被加载；因此，`env` 函数只会返回外部的系统级环境变量。

<a name="configuration-publishing"></a>
## 配置发布

Laravel 大部分配置文件已经发布到应用的 `config` 目录中；不过，`cors.php` 和 `view.php` 等配置文件默认不会发布，因为多数应用都不需要修改它们。

不过，你可以使用 `config:publish` Artisan 命令发布任何默认未发布的配置文件：

```shell
php artisan config:publish

php artisan config:publish --all
```

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 `debug` 选项决定实际向用户显示多少错误信息。默认情况下，该选项设置为遵循 `APP_DEBUG` 环境变量的值，该变量存放在你的 `.env` 文件中。

> [!WARNING]
> 本地开发时，你应把 `APP_DEBUG` 环境变量设为 `true`。**在生产环境中，该值应始终为 `false`。如果该变量在生产环境中被设为 `true`，你可能把敏感的配置值暴露给应用的终端用户。**

<a name="maintenance-mode"></a>
## 维护模式

当应用处于维护模式时，所有进入应用的请求都会显示一个自定义视图。这让你可以在更新应用或执行维护期间轻松"停用"应用。应用的默认中间件栈中包含一次维护模式检查。如果应用处于维护模式，系统会抛出一个状态码为 503 的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例。

要启用维护模式，请执行 `down` Artisan 命令：

```shell
php artisan down
```

如果你希望所有维护模式响应都带上 `Refresh` HTTP 头，可以在调用 `down` 命令时提供 `refresh` 选项。`Refresh` 头会指示浏览器在指定秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

你也可以向 `down` 命令提供 `retry` 选项，它会作为 `Retry-After` HTTP 头的值，不过浏览器通常会忽略该头：

```shell
php artisan down --retry=60
```

<a name="bypassing-maintenance-mode"></a>
#### 绕过维护模式

要允许使用一个私密令牌绕过维护模式，你可以使用 `secret` 选项指定一个维护模式绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

把应用置于维护模式后，你可以访问与该令牌匹配的应用 URL，Laravel 会向你的浏览器下发一个维护模式绕过 Cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

如果你希望 Laravel 帮你生成该私密令牌，可以使用 `with-secret` 选项。当应用进入维护模式后，该私密值会显示给你：

```shell
php artisan down --with-secret
```

访问这条隐藏路由时，你会被重定向到应用的 `/` 路由。一旦该 Cookie 下发到你的浏览器，你就能像应用未处于维护模式时一样正常浏览它。

> [!NOTE]
> 你的维护模式私密值通常应由字母数字字符组成，可以选择包含短横线。应避免使用在 URL 中具有特殊含义的字符，例如 `?` 或 `&`。

<a name="maintenance-mode-on-multiple-servers"></a>
#### 多台服务器上的维护模式

默认情况下，Laravel 使用基于文件的系统判断应用是否处于维护模式。这意味着要启用维护模式，必须在托管应用的每台服务器上执行 `php artisan down` 命令。

另外，Laravel 提供了一种基于缓存的方式来处理维护模式。该方式只需在一台服务器上运行 `php artisan down` 命令。要使用它，请修改应用 `.env` 文件中的维护模式变量。你应选择一个所有服务器都能访问的缓存 `store`。这样可以确保维护模式状态在每台服务器上保持一致：

```ini
APP_MAINTENANCE_DRIVER=cache
APP_MAINTENANCE_STORE=database
```

<a name="pre-rendering-the-maintenance-mode-view"></a>
#### 预渲染维护模式视图

如果你在部署期间使用 `php artisan down` 命令，用户在 Composer 依赖或其他基础设施组件更新期间访问应用时，仍可能偶尔遇到错误。这是因为 Laravel 框架必须启动相当一部分，才能判断你的应用处于维护模式并使用模板引擎渲染维护模式视图。

因此，Laravel 允许你预渲染一个维护模式视图，在请求周期最开始就返回它。该视图会在应用的任何依赖加载之前完成渲染。你可以使用 `down` 命令的 `render` 选项预渲染任意模板：

```shell
php artisan down --render="errors::503"
```

<a name="redirecting-maintenance-mode-requests"></a>
#### 重定向维护模式请求

处于维护模式时，对于用户尝试访问的所有应用 URL，Laravel 都会显示维护模式视图。如果需要，你也可以让 Laravel 把所有请求重定向到某个特定 URL。这可以通过 `redirect` 选项实现。例如，你可能希望把所有请求重定向到 `/` URI：

```shell
php artisan down --redirect=/
```

<a name="disabling-maintenance-mode"></a>
#### 禁用维护模式

要禁用维护模式，请使用 `up` 命令：

```shell
php artisan up
```

> [!NOTE]
> 你可以通过在 `resources/views/errors/503.blade.php` 中定义自己的模板，来自定义默认的维护模式模板。

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当应用处于维护模式时，不会处理任何[队列任务](/docs/{{version}}/queues)。应用退出维护模式后，这些任务会恢复正常处理。

<a name="alternatives-to-maintenance-mode"></a>
#### 维护模式的替代方案

由于维护模式需要应用停机数秒，你可以考虑使用 [Laravel Vapor](https://vapor.laravel.com) 和 [Envoyer](https://envoyer.io) 等替代方案，在 Laravel 中实现零停机部署。
