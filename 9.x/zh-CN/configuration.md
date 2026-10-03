# 配置

- [简介](#introduction)
- [环境配置](#environment-configuration)
    - [环境变量类型](#environment-variable-types)
    - [获取环境配置](#retrieving-environment-configuration)
    - [确定当前环境](#determining-the-current-environment)
    - [加密环境文件](#encrypting-environment-files)
- [访问配置值](#accessing-configuration-values)
- [配置缓存](#configuration-caching)
- [调试模式](#debug-mode)
- [维护模式](#maintenance-mode)

<a name="introduction"></a>
## 简介

Laravel 框架的所有配置文件都存放在 `config` 目录下。每个选项都有文档说明，你可以随意浏览这些文件，熟悉可用的选项。

这些配置文件允许你配置数据库连接信息、邮件服务器信息，以及各种其他核心配置值，例如应用时区和加密密钥。

<a name="application-overview"></a>
#### 应用概览

赶时间？你可以通过 `about` Artisan 命令快速查看应用的配置、驱动和环境概览：

```shell
php artisan about
```

如果你只对应用概览输出的某个部分感兴趣，可以使用 `--only` 选项筛选该部分：

```shell
php artisan about --only=environment
```

<a name="environment-configuration"></a>
## 环境配置

根据应用运行的环境使用不同的配置值通常很有用。例如，你可能希望在本地使用与生产服务器不同的缓存驱动。

为了让这件事变得轻而易举，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在全新的 Laravel 安装中，应用的根目录会包含一个 `.env.example` 文件，其中定义了许多常见的环境变量。在 Laravel 安装过程中，该文件会自动复制为 `.env`。

Laravel 默认的 `.env` 文件包含一些常见的配置值，这些值可能因应用是在本地运行还是在生产 Web 服务器上运行而有所不同。随后，这些值会通过 Laravel 的 `env` 函数从 `config` 目录下的各个配置文件中读取。

如果你在团队中开发，可能希望继续在应用中包含 `.env.example` 文件。通过在示例配置文件中放入占位值，团队中的其他开发者可以清楚地看到运行你的应用需要哪些环境变量。

> **注意**
> `.env` 文件中的任何变量都可以被外部环境变量覆盖，例如服务器级或系统级环境变量。

<a name="environment-file-security"></a>
#### 环境文件安全

你的 `.env` 文件不应该提交到应用的源代码版本控制中，因为每个使用你的应用的开发者或服务器可能需要不同的环境配置。此外，如果入侵者获取了你的源代码版本控制仓库的访问权限，这还会带来安全风险，因为所有敏感凭证都会暴露。

不过，你可以使用 Laravel 内置的[环境加密](#encrypting-environment-files)功能对环境文件进行加密。加密后的环境文件可以安全地放入源代码版本控制中。

<a name="additional-environment-files"></a>
#### 额外的环境文件

在加载应用的环境变量之前，Laravel 会判断是否已从外部提供了 `APP_ENV` 环境变量，或者是否指定了 `--env` CLI 参数。如果是，Laravel 会尝试加载 `.env.[APP_ENV]` 文件（如果存在）。如果该文件不存在，则加载默认的 `.env` 文件。

<a name="environment-variable-types"></a>
### 环境变量类型

`.env` 文件中的所有变量通常会被解析为字符串，因此创建了一些保留值，让你可以从 `env()` 函数返回更广泛的类型：

| `.env` Value | `env()` Value |
|--------------|---------------|
| true         | (bool) true   |
| (true)       | (bool) true   |
| false        | (bool) false  |
| (false)      | (bool) false  |
| empty        | (string) ''   |
| (empty)      | (string) ''   |
| null         | (null) null   |
| (null)       | (null) null   |

如果需要定义一个值中包含空格的环境变量，可以将值用双引号括起来：

```ini
APP_NAME="My Application"
```

<a name="retrieving-environment-configuration"></a>
### 获取环境配置

当应用接收到请求时，`.env` 文件中列出的所有变量都会被加载到 `$_ENV` PHP 超级全局数组中。不过，你可以在配置文件中使用 `env` 函数从这些变量中获取值。事实上，如果你查看 Laravel 的配置文件，会发现许多选项已经在使用这个函数：

```php
'debug' => env('APP_DEBUG', false),
```

传递给 `env` 函数的第二个值是"默认值"。如果给定的键不存在对应的环境变量，就会返回该值。

<a name="determining-the-current-environment"></a>
### 确定当前环境

当前应用环境通过 `.env` 文件中的 `APP_ENV` 变量确定。你可以通过 `App` [Facade](/docs/{{version}}/facades) 的 `environment` 方法访问该值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

你也可以向 `environment` 方法传递参数，判断环境是否与给定值匹配。如果环境匹配任何一个给定值，该方法会返回 `true`：

```php
if (App::environment('local')) {
    // 当前环境是 local
}

if (App::environment(['local', 'staging'])) {
    // 当前环境是 local 或 staging...
}
```

> **注意**
> 可以通过定义服务器级的 `APP_ENV` 环境变量来覆盖当前应用环境的检测。

<a name="encrypting-environment-files"></a>
### 加密环境文件

未加密的环境文件绝不应该存储在源代码版本控制中。不过，Laravel 允许你加密环境文件，以便将其与应用的其余部分一起安全地添加到源代码版本控制中。

<a name="encryption"></a>
#### 加密

要加密环境文件，可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

运行 `env:encrypt` 命令会加密你的 `.env` 文件，并将加密后的内容放入 `.env.encrypted` 文件。解密密钥会显示在命令输出中，应将其存储在安全的密码管理器中。如果你想提供自己的加密密钥，可以在调用命令时使用 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

> **注意**
> 提供的密钥长度应与所使用的加密算法要求的密钥长度匹配。默认情况下，Laravel 使用 `AES-256-CBC` 算法，需要 32 个字符的密钥。你可以在调用命令时通过 `--cipher` 选项使用 Laravel [加密器](/docs/{{version}}/encryption)支持的任何算法。

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名称，指定要加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

<a name="decryption"></a>
#### 解密

要解密环境文件，可以使用 `env:decrypt` 命令。该命令需要解密密钥，Laravel 会从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量中获取：

```shell
php artisan env:decrypt
```

或者，可以通过 `--key` 选项直接向命令提供密钥：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

调用 `env:decrypt` 命令时，Laravel 会解密 `.env.encrypted` 文件的内容，并将解密后的内容放入 `.env` 文件。

可以向 `env:decrypt` 命令提供 `--cipher` 选项，以使用自定义的加密算法：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名称，指定要解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

要覆盖现有的环境文件，可以向 `env:decrypt` 命令提供 `--force` 选项：

```shell
php artisan env:decrypt --force
```

<a name="accessing-configuration-values"></a>
## 访问配置值

你可以在应用的任何地方使用全局 `config` 函数轻松访问配置值。配置值可以通过"点"语法访问，其中包含你要访问的文件名和选项名。还可以指定一个默认值，当配置选项不存在时将返回该默认值：

```php
$value = config('app.timezone');

// 如果配置值不存在，则获取默认值...
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，可以向 `config` 函数传递一个数组：

```php
config(['app.timezone' => 'America/Chicago']);
```

<a name="configuration-caching"></a>
## 配置缓存

为了提升应用的速度，你应该使用 `config:cache` Artisan 命令将所有配置文件缓存到单个文件中。这会将应用的所有配置选项合并到一个文件中，框架可以快速加载该文件。

你通常应该将 `php artisan config:cache` 命令作为生产部署流程的一部分来运行。在本地开发期间不应运行该命令，因为在应用开发过程中经常需要更改配置选项。

可以使用 `config:clear` 命令清除缓存的配置：

```shell
php artisan config:clear
```

> **警告**
> 如果在部署过程中执行了 `config:cache` 命令，你应该确保只在配置文件中调用 `env` 函数。配置被缓存后，`.env` 文件将不再加载；因此，`env` 函数只会返回外部的系统级环境变量。

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 `debug` 选项决定了向用户实际显示多少错误信息。默认情况下，该选项设置为遵循 `APP_DEBUG` 环境变量的值，该变量存储在 `.env` 文件中。

在本地开发中，你应该将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，该值应始终为 `false`。如果在生产环境中将该变量设置为 `true`，你可能会将敏感的配置值暴露给应用的最终用户。**

<a name="maintenance-mode"></a>
## 维护模式

当应用处于维护模式时，所有进入应用的请求都会显示一个自定义视图。这使得在应用更新或执行维护时可以轻松地"禁用"应用。应用的默认中间件堆栈中包含维护模式检查。如果应用处于维护模式，会抛出一个状态码为 503 的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例。

要启用维护模式，请执行 `down` Artisan 命令：

```shell
php artisan down
```

如果希望在所有维护模式响应中发送 `Refresh` HTTP 头，可以在调用 `down` 命令时提供 `refresh` 选项。`Refresh` 头会指示浏览器在指定秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

还可以向 `down` 命令提供 `retry` 选项，该值会设置为 `Retry-After` HTTP 头的值，不过浏览器通常会忽略该头：

```shell
php artisan down --retry=60
```

<a name="bypassing-maintenance-mode"></a>
#### 绕过维护模式

要允许通过密钥令牌绕过维护模式，可以使用 `secret` 选项指定维护模式绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

将应用置于维护模式后，你可以访问与此令牌匹配的应用 URL，Laravel 会向你的浏览器颁发维护模式绕过 cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

访问此隐藏路由后，你会被重定向到应用的 `/` 路由。一旦浏览器获得了该 cookie，你就可以正常浏览应用，就像它未处于维护模式一样。

> **注意**
> 维护模式密钥通常应由字母数字字符组成，可选地包含连字符。应避免使用在 URL 中有特殊含义的字符，例如 `?` 或 `&`。

<a name="pre-rendering-the-maintenance-mode-view"></a>
#### 预渲染维护模式视图

如果在部署期间使用 `php artisan down` 命令，当你的 Composer 依赖或其他基础设施组件正在更新时，用户访问应用可能仍会偶尔遇到错误。这是因为必须引导 Laravel 框架的很大一部分才能确定应用处于维护模式，并使用模板引擎渲染维护模式视图。

因此，Laravel 允许你预渲染一个维护模式视图，该视图会在请求周期的最开始返回。此视图在应用的任何依赖加载之前渲染。你可以使用 `down` 命令的 `render` 选项预渲染所选模板：

```shell
php artisan down --render="errors::503"
```

<a name="redirecting-maintenance-mode-requests"></a>
#### 重定向维护模式请求

在维护模式下，Laravel 会为用户尝试访问的所有应用 URL 显示维护模式视图。如果你愿意，可以指示 Laravel 将所有请求重定向到特定 URL。这可以通过 `redirect` 选项实现。例如，你可能希望将所有请求重定向到 `/` URI：

```shell
php artisan down --redirect=/
```

<a name="disabling-maintenance-mode"></a>
#### 禁用维护模式

要禁用维护模式，请使用 `up` 命令：

```shell
php artisan up
```

> **注意**
> 你可以通过在 `resources/views/errors/503.blade.php` 中定义自己的模板来自定义默认的维护模式模板。

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

当应用处于维护模式时，不会处理任何[队列任务](/docs/{{version}}/queues)。一旦应用退出维护模式，任务将继续正常处理。

<a name="alternatives-to-maintenance-mode"></a>
#### 维护模式的替代方案

由于维护模式要求应用有几秒钟的停机时间，可以考虑使用 [Laravel Vapor](https://vapor.laravel.com) 和 [Envoyer](https://envoyer.io) 等替代方案来实现 Laravel 的零停机部署。
