# 配置

- [简介](#introduction)
- [环境配置](#environment-configuration)
    - [环境变量类型](#environment-variable-types)
    - [获取环境配置](#retrieving-environment-configuration)
    - [判断当前环境](#determining-the-current-environment)
    - [加密环境文件](#encrypting-environment-files)
- [访问配置值](#accessing-configuration-values)
- [配置缓存](#configuration-caching)
- [配置发布](#configuration-publishing)
- [调试模式](#debug-mode)
- [维护模式](#maintenance-mode)

<a name="introduction"></a>
## 简介

Laravel 框架的所有配置文件都存放在 `config` 目录中。每个选项都有文档说明，你可以随意浏览这些文件，熟悉可用的选项。

通过这些配置文件，你可以配置数据库连接信息、邮件服务器信息，以及应用 URL、加密密钥等各种其他核心配置值。

<a name="the-about-command"></a>
#### `about` 命令

Laravel 可以通过 `about` Artisan 命令展示应用的配置、驱动和环境概览。

```shell
php artisan about
```

如果你只关心应用概览输出中的某个部分，可以使用 `--only` 选项对该部分进行过滤：

```shell
php artisan about --only=environment
```

如果想详细查看某个配置文件中的值，可以使用 `config:show` Artisan 命令：

```shell
php artisan config:show database
```

<a name="environment-configuration"></a>
## 环境配置

根据应用运行环境的不同使用不同的配置值，往往很有用。例如，你可能希望本地环境使用的缓存驱动与生产服务器不同。

为了让这件事轻而易举，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在全新的 Laravel 安装中，应用根目录会包含一个 `.env.example` 文件，其中定义了许多通用的环境变量。在 Laravel 安装过程中，该文件会被自动复制为 `.env`。

Laravel 默认的 `.env` 文件包含一些常见的配置值，这些值会因应用是在本地运行还是在生产 Web 服务器上运行而有所不同。`config` 目录中的配置文件会使用 Laravel 的 `env` 函数读取这些值。

如果你是与团队协作开发，可以继续随应用维护和更新 `.env.example` 文件。在示例配置文件中放置占位值，能让团队中的其他开发者清楚地看到运行你的应用需要哪些环境变量。

> [!NOTE]
> `.env` 文件中的任何变量都可以被外部环境变量覆盖，例如服务器级或系统级的环境变量。

<a name="environment-file-security"></a>
#### 环境文件安全

`.env` 文件不应提交到应用的源代码版本控制中，因为使用你应用的每个开发者 / 服务器可能需要不同的环境配置。此外，一旦入侵者获得你的源代码仓库的访问权限，其中的敏感凭据就会暴露，这将带来安全风险。

不过，你可以使用 Laravel 内置的[环境加密](#encrypting-environment-files)功能对环境文件进行加密。加密后的环境文件可以安全地放入源代码版本控制中。

<a name="additional-environment-files"></a>
#### 额外的环境文件

在加载应用的环境变量之前，Laravel 会判断是否从外部提供了 `APP_ENV` 环境变量，或是否指定了 `--env` CLI 参数。如果是，Laravel 会尝试加载 `.env.[APP_ENV]` 文件（如果存在）。如果该文件不存在，则加载默认的 `.env` 文件。

<a name="environment-variable-types"></a>
### 环境变量类型

`.env` 文件中的所有变量通常都会被解析为字符串，因此 Laravel 预留了一些特定值，让你能够通过 `env()` 函数返回更多样的类型：

| `.env` 值   | `env()` 值    |
| ------------ | ------------- |
| true         | (bool) true   |
| (true)       | (bool) true   |
| false        | (bool) false  |
| (false)      | (bool) false  |
| empty        | (string) ''   |
| (empty)      | (string) ''   |
| null         | (null) null   |
| (null)       | (null) null   |

如果需要定义值中包含空格的环境变量，可以将值用双引号包裹起来：

```ini
APP_NAME="My Application"
```

<a name="retrieving-environment-configuration"></a>
### 获取环境配置

当应用收到请求时，`.env` 文件中列出的所有变量都会被加载到 `$_ENV` PHP 超全局数组中。不过，你可以在配置文件中使用 `env` 函数来获取这些变量的值。实际上，如果你查看 Laravel 的配置文件，就会发现许多选项已经在使用这个函数了：

```php
'debug' => (bool) env('APP_DEBUG', false),
```

传递给 `env` 函数的第二个值是「默认值」。如果指定键不存在对应的环境变量，就会返回该值。

<a name="determining-the-current-environment"></a>
### 判断当前环境

当前应用环境由 `.env` 文件中的 `APP_ENV` 变量决定。你可以通过 `App` [Facade](/docs/{{version}}/facades) 的 `environment` 方法访问该值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

你也可以向 `environment` 方法传递参数，判断环境是否与给定值匹配。只要环境与任一给定值匹配，该方法就会返回 `true`：

```php
if (App::environment('local')) {
    // 当前环境为 local
}

if (App::environment(['local', 'staging'])) {
    // 当前环境为 local 或 staging...
}
```

> [!NOTE]
> 通过定义服务器级的 `APP_ENV` 环境变量，可以覆盖默认的当前应用环境检测。

<a name="encrypting-environment-files"></a>
### 加密环境文件

未经加密的环境文件绝不应存储在源代码版本控制中。不过，Laravel 允许你对环境文件进行加密，这样就可以将它们与应用的其余部分一起安全地加入源代码版本控制。

<a name="encryption"></a>
#### 加密

要加密环境文件，可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

运行 `env:encrypt` 命令会加密你的 `.env` 文件，并将加密后的内容放入 `.env.encrypted` 文件中。解密密钥会显示在命令输出中，应将其存储在安全的密码管理器中。如果你想自行提供加密密钥，可以在调用命令时使用 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

> [!NOTE]
> 所提供密钥的长度应与所用加密算法要求的密钥长度一致。默认情况下，Laravel 使用 `AES-256-CBC` 算法，它需要一个 32 字符的密钥。你可以在调用命令时传入 `--cipher` 选项，自由使用 Laravel [加密器](/docs/{{version}}/encryption)支持的任何算法。

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名称，指定要加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

<a name="readable-variable-names"></a>
#### 可读的变量名

加密环境文件时，你可以使用 `--readable` 选项，在加密变量值的同时保留可见的变量名：

```shell
php artisan env:encrypt --readable
```

这会生成一个如下格式的加密文件：

```ini
APP_NAME=eyJpdiI6...
APP_ENV=eyJpdiI6...
APP_KEY=eyJpdiI6...
APP_DEBUG=eyJpdiI6...
APP_URL=eyJpdiI6...
```

使用可读格式让你无需暴露敏感数据就能看到存在哪些环境变量。它也让审查拉取请求（pull request）变得容易得多，因为你无需解密文件就能看到哪些变量被添加、删除或重命名。

解密环境文件时，Laravel 会自动检测所使用的格式，因此 `env:decrypt` 命令不需要任何额外的选项。

> [!NOTE]
> 使用 `--readable` 选项时，原始环境文件中的注释和空行不会包含在加密输出中。

<a name="decryption"></a>
#### 解密

要解密环境文件，可以使用 `env:decrypt` 命令。该命令需要解密密钥，Laravel 会从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量中获取：

```shell
php artisan env:decrypt
```

也可以通过 `--key` 选项直接向命令提供密钥：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

调用 `env:decrypt` 命令时，Laravel 会解密 `.env.encrypted` 文件的内容，并将解密后的内容写入 `.env` 文件。

可以向 `env:decrypt` 命令提供 `--cipher` 选项，以使用自定义的加密算法：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果你的应用有多个环境文件，例如 `.env` 和 `.env.staging`，可以通过 `--env` 选项提供环境名称，指定要解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

要覆盖已有的环境文件，可以向 `env:decrypt` 命令提供 `--force` 选项：

```shell
php artisan env:decrypt --force
```

<a name="accessing-configuration-values"></a>
## 访问配置值

你可以在应用的任何位置使用 `Config` Facade 或全局 `config` 函数轻松访问配置值。配置值使用「点」语法访问，其中包含你想要访问的文件名和选项名。还可以指定一个默认值，当配置选项不存在时会返回该默认值：

```php
use Illuminate\Support\Facades\Config;

$value = Config::get('app.timezone');

$value = config('app.timezone');

// 配置值不存在时获取默认值...
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，可以调用 `Config` Facade 的 `set` 方法，或向 `config` 函数传递一个数组：

```php
Config::set('app.timezone', 'America/Chicago');

config(['app.timezone' => 'America/Chicago']);
```

为了便于静态分析，`Config` Facade 还提供了带类型的配置获取方法。如果获取到的配置值与期望类型不匹配，将会抛出异常：

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

为了让应用获得速度提升，你应该使用 `config:cache` Artisan 命令将所有配置文件缓存到单个文件中。这会把应用的所有配置选项合并到一个文件里，框架可以快速加载该文件。

你通常应该在生产部署流程中运行 `php artisan config:cache` 命令。该命令不应在本地开发期间运行，因为在应用开发过程中，配置选项经常需要修改。

配置缓存之后，应用在处理请求或执行 Artisan 命令时，框架不会再加载 `.env` 文件；因此，`env` 函数将只会返回外部的系统级环境变量。

基于这个原因，你应该确保只在应用的配置（`config`）文件中调用 `env` 函数。查看 Laravel 的默认配置文件，你可以看到许多这样的例子。在应用的任何位置，都可以使用[上文](#accessing-configuration-values)介绍的 `config` 函数访问配置值。

可以使用 `config:clear` 命令清除配置缓存：

```shell
php artisan config:clear
```

> [!WARNING]
> 如果你在部署流程中执行了 `config:cache` 命令，应确保只在配置文件中调用 `env` 函数。配置缓存之后，`.env` 文件将不会被加载；因此，`env` 函数将只会返回外部的系统级环境变量。

<a name="configuration-publishing"></a>
## 配置发布

Laravel 的大部分配置文件已经发布到应用的 `config` 目录中；不过，某些配置文件（如 `cors.php` 和 `view.php`）默认不会发布，因为大多数应用永远不需要修改它们。

但是，你可以使用 `config:publish` Artisan 命令发布任何默认未发布的配置文件：

```shell
php artisan config:publish

php artisan config:publish --all
```

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的 `debug` 选项决定了向用户实际展示多少错误信息。默认情况下，该选项的值取自存储在 `.env` 文件中的 `APP_DEBUG` 环境变量。

> [!WARNING]
> 在本地开发环境中，你应该将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，该值必须始终为 `false`。如果在生产环境中将该变量设置为 `true`，你可能会向应用的最终用户暴露敏感的配置值。**

<a name="maintenance-mode"></a>
## 维护模式

当应用处于维护模式时，所有进入应用的请求都会展示一个自定义视图。这样，在应用更新或你进行维护期间，就可以轻松地「停用」应用。应用的默认中间件栈中包含维护模式检查。如果应用处于维护模式，将抛出状态码为 503 的 `Symfony\Component\HttpKernel\Exception\HttpException` 异常实例。

要启用维护模式，请执行 `down` Artisan 命令：

```shell
php artisan down
```

如果希望所有维护模式响应都发送 `Refresh` HTTP 头，可以在调用 `down` 命令时提供 `refresh` 选项。`Refresh` 头会指示浏览器在指定秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

你也可以向 `down` 命令提供 `retry` 选项，该选项的值会被设置为 `Retry-After` HTTP 头的值，不过浏览器通常会忽略这个头：

```shell
php artisan down --retry=60
```

<a name="bypassing-maintenance-mode"></a>
#### 绕过维护模式

如果想通过秘密令牌绕过维护模式，可以使用 `secret` 选项指定维护模式绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

将应用置于维护模式后，你可以访问与此令牌匹配的应用 URL，Laravel 会向你的浏览器颁发维护模式绕过 cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

如果你希望 Laravel 替你生成秘密令牌，可以使用 `with-secret` 选项。应用进入维护模式后，该秘密令牌会展示给你：

```shell
php artisan down --with-secret
```

访问这个隐藏路由后，你会被重定向到应用的 `/` 路由。一旦浏览器获得了该 cookie，你就可以正常浏览应用，就像它不处于维护模式一样。

> [!NOTE]
> 维护模式秘密令牌通常应由字母数字字符以及可选的连字符组成。应避免使用在 URL 中具有特殊含义的字符，例如 `?` 或 `&`。

<a name="maintenance-mode-on-multiple-servers"></a>
#### 多服务器上的维护模式

默认情况下，Laravel 使用基于文件的机制判断应用是否处于维护模式。这意味着要激活维护模式，必须在托管应用的每台服务器上执行 `php artisan down` 命令。

除此之外，Laravel 还提供了一种基于缓存的维护模式处理方式。这种方式只需在一台服务器上运行 `php artisan down` 命令。要使用这种方式，请修改应用 `.env` 文件中的维护模式相关变量。你应选择一个所有服务器都能访问的缓存 `store`。这能确保维护模式状态在每台服务器上保持一致：

```ini
APP_MAINTENANCE_DRIVER=cache
APP_MAINTENANCE_STORE=database
```

<a name="pre-rendering-the-maintenance-mode-view"></a>
#### 预渲染维护模式视图

如果你在部署期间使用 `php artisan down` 命令，当你的 Composer 依赖或其他基础设施组件正在更新时，用户访问应用仍可能偶尔遇到错误。这是因为 Laravel 框架的相当一部分必须完成启动，才能判断应用是否处于维护模式，并使用模板引擎渲染维护模式视图。

出于这个原因，Laravel 允许你预渲染一个维护模式视图，它会在请求周期的最开始返回。该视图会在应用的任何依赖加载之前渲染。你可以使用 `down` 命令的 `render` 选项预渲染你选择的模板：

```shell
php artisan down --render="errors::503"
```

<a name="redirecting-maintenance-mode-requests"></a>
#### 重定向维护模式请求

在维护模式期间，Laravel 会对用户尝试访问的所有应用 URL 展示维护模式视图。如果你愿意，也可以让 Laravel 将所有请求重定向到一个指定的 URL。这可以通过 `redirect` 选项来实现。例如，你可能希望将所有请求重定向到 `/` URI：

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
> 你可以在 `resources/views/errors/503.blade.php` 定义自己的模板，来自定义默认的维护模式模板。

<a name="maintenance-mode-queues"></a>
#### 维护模式与队列

应用处于维护模式时，不会处理任何[队列任务](/docs/{{version}}/queues)。一旦应用退出维护模式，任务就会恢复正常处理。

<a name="alternatives-to-maintenance-mode"></a>
#### 维护模式的替代方案

由于维护模式要求应用有数秒的停机时间，你可以考虑将应用运行在 [Laravel Cloud](https://cloud.laravel.com) 这类全托管平台上，用 Laravel 实现零停机部署。
