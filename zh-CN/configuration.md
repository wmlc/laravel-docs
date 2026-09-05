# 配置

## 简介

Laravel 框架的所有配置文件都存放在 `config` 目录下。每个选项都有相应注释，建议浏览这些文件，熟悉可配置的选项。

通过这些配置文件，你可以配置数据库连接信息、邮件服务器信息以及应用 URL、加密密钥等其他核心配置值。

#### `about` 命令

Laravel 可以通过 `about` Artisan 命令，展示应用配置、驱动与环境的高层概览：

```shell
php artisan about
```

如果只关心概览的某一部分，可以使用 `--only` 选项过滤：

```shell
php artisan about --only=environment
```

若要详细查看某个配置文件的值，可以使用 `config:show` Artisan 命令：

```shell
php artisan config:show database
```

## 环境配置

通常，根据应用运行环境的不同，让配置值有所差异会比较方便。例如，你可能希望本地与生产环境使用不同的缓存驱动。

为简化这一点，Laravel 使用了 [DotEnv](https://github.com/vlucas/phpdotenv) PHP 库。在全新安装的 Laravel 项目中，应用根目录会有一个 `.env.example` 文件，里面定义了许多通用环境变量。在 Laravel 安装过程中，该文件会自动复制为 `.env`。

Laravel 默认的 `.env` 文件包含一些常见配置值——这些值会因应用运行在本地还是生产服务器上而不同。然后，`config` 目录下的配置文件通过 Laravel 的 `env` 函数读取这些值。

如果是团队协作开发，建议持续保留并更新项目中的 `.env.example` 文件。在示例配置文件中使用占位值，团队其他开发者就能清楚看到运行应用所需的所有环境变量。

> [!NOTE]
> `.env` 文件中的任何变量都可以被外部环境变量（例如服务器级或系统级环境变量）覆盖。

#### 环境文件安全

`.env` 文件不应提交到应用的源代码控制中——每位开发者 / 每台服务器使用应用时可能需要不同的环境配置。此外，如果入侵者获得源码仓库的访问权限，把敏感凭证暴露在 `.env` 里还会带来安全风险。

不过，可以使用 Laravel 内置的 [环境文件加密](#encrypting-environment-files) 来加密环境文件。加密后的环境文件可以安全地提交到源码控制。

#### 额外的环境文件

在加载应用环境变量之前，Laravel 会先判断是否从外部提供了 `APP_ENV` 环境变量，或者是否通过 `--env` CLI 参数指定了环境。如果指定了，Laravel 会尝试加载对应的 `.env.[APP_ENV]` 文件。如果该文件不存在，则加载默认的 `.env` 文件。

### 环境变量类型

`.env` 文件中的所有变量通常会被解析为字符串，因此预留了一些特殊值，以便 `env()` 函数能返回更广泛的类型：

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

如果某个环境变量的值需要包含空格，可以用双引号把值包起来：

```ini
APP_NAME="My Application"
```

### 读取环境配置

`.env` 文件中列出的所有变量会在应用收到请求时加载到 PHP 的 `$_ENV` 超全局变量中。不过，你可以在配置文件中通过 `env` 函数读取它们的值。事实上，只要你查看 Laravel 的配置文件就会发现，许多选项已经在使用这个函数：

```php
'debug' => (bool) env('APP_DEBUG', false),
```

传给 `env` 函数的第二个值是「默认值」——当指定 key 没有对应的环境变量时，会返回该默认值。

### 判断当前环境

当前应用环境由 `.env` 中的 `APP_ENV` 变量决定。可以通过 `App` [门面](/docs/{{version}}/facades) 的 `environment` 方法访问该值：

```php
use Illuminate\Support\Facades\App;

$environment = App::environment();
```

也可以向 `environment` 方法传入参数，判断当前环境是否为某个给定值。当当前环境匹配传入的任意值时，方法返回 `true`：

```php
if (App::environment('local')) {
    // 当前环境是 local
}

if (App::environment(['local', 'staging'])) {
    // 当前环境是 local 或 staging...
}
```

> [!NOTE]
> 通过定义服务器级 `APP_ENV` 环境变量，可以覆盖当前应用环境的检测。

### 加密环境文件

未加密的环境文件绝不应放进源码控制。但 Laravel 支持你把环境文件加密，使它与应用其余部分一起安全地加入源码控制。

#### 加密

要加密环境文件，可以使用 `env:encrypt` 命令：

```shell
php artisan env:encrypt
```

运行 `env:encrypt` 会加密 `.env` 文件，并把加密后的内容写入 `.env.encrypted`。解密密钥会在命令输出中给出，请把它保存在安全的密码管理器中。如果希望自己提供加密密钥，调用命令时可以加上 `--key` 选项：

```shell
php artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

> [!NOTE]
> 提供的密钥长度应与所用加密算法要求的密钥长度匹配。默认情况下，Laravel 使用 `AES-256-CBC` 算法，需要 32 位字符长度的密钥。可以传入 `--cipher` 选项来使用 Laravel [encrypter](/docs/{{version}}/encryption) 支持的任何算法。

如果应用有多个环境文件（例如 `.env` 与 `.env.staging`），可以通过 `--env` 选项指定要加密的环境文件：

```shell
php artisan env:encrypt --env=staging
```

#### 可读的变量名

加密环境文件时，可以使用 `--readable` 选项，保留可见的变量名同时加密其值：

```shell
php artisan env:encrypt --readable
```

这会生成如下格式的加密文件：

```ini
APP_NAME=eyJpdiI6...
APP_ENV=eyJpdiI6...
APP_KEY=eyJpdiI6...
APP_DEBUG=eyJpdiI6...
APP_URL=eyJpdiI6...
```

使用「可读」格式可以查看存在哪些环境变量，而不会暴露敏感数据。它也让 PR 评审更轻松——你可以一眼看出哪些变量被新增、删除或重命名，而无需解密文件。

解密环境文件时，Laravel 会自动识别所使用的格式，因此无需为 `env:decrypt` 命令额外指定选项。

> [!NOTE]
> 使用 `--readable` 选项时，原始环境文件中的注释和空行不会包含在加密输出中。

#### 解密

要解密环境文件，可以使用 `env:decrypt` 命令。该命令需要一个解密密钥，Laravel 会从 `LARAVEL_ENV_ENCRYPTION_KEY` 环境变量读取：

```shell
php artisan env:decrypt
```

也可以通过 `--key` 选项直接将密钥传给命令：

```shell
php artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF
```

当 `env:decrypt` 命令被调用时，Laravel 会解密 `.env.encrypted` 文件的内容，并把解密后的内容写入 `.env`。

可以为 `env:decrypt` 命令传入 `--cipher` 选项来使用自定义加密算法：

```shell
php artisan env:decrypt --key=qUWuNRdfuImXcKxZ --cipher=AES-128-CBC
```

如果应用有多个环境文件（例如 `.env` 与 `.env.staging`），可以通过 `--env` 选项指定要解密的环境文件：

```shell
php artisan env:decrypt --env=staging
```

若要覆盖一个已存在的环境文件，可以为 `env:decrypt` 命令传入 `--force` 选项：

```shell
php artisan env:decrypt --force
```

## 访问配置值

可以在应用的任何位置通过 `Config` 门面或全局 `config` 函数轻松访问配置值。配置值采用「点」语法访问，包括你希望访问的文件名与选项名。你也可以指定默认值——当配置项不存在时，将返回这个默认值：

```php
use Illuminate\Support\Facades\Config;

$value = Config::get('app.timezone');

$value = config('app.timezone');

// 当配置值不存在时返回默认值……
$value = config('app.timezone', 'Asia/Seoul');
```

要在运行时设置配置值，可以调用 `Config` 门面的 `set` 方法，或者向 `config` 函数传入数组：

```php
Config::set('app.timezone', 'America/Chicago');

config(['app.timezone' => 'America/Chicago']);
```

为辅助静态分析，`Config` 门面还提供了带类型限定的配置读取方法。如果读取到的配置值与预期类型不符，会抛出异常：

```php
Config::string('config-key');
Config::integer('config-key');
Config::float('config-key');
Config::boolean('config-key');
Config::array('config-key');
Config::collection('config-key');
```

## 配置缓存

为了让应用跑得更快，你应该使用 `config:cache` Artisan 命令把所有配置文件缓存到单个文件中。这会把应用的所有配置项合并到一个文件里，框架可以快速加载。

通常，应在生产部署流程中运行 `php artisan config:cache` 命令。在本地开发期间不要运行该命令——因为开发过程中配置项经常需要修改。

配置缓存后，应用的 `.env` 文件在请求或 Artisan 命令中不会再被框架加载；因此 `env` 函数只会返回外部的、系统级的环境变量。

基于这个原因，你应确保 `env` 函数只在应用的配置（`config`）文件中被调用。查看 Laravel 默认的配置文件就能看到大量这样的例子。其他位置可以使用 [上文所述](#accessing-configuration-values) 的 `config` 函数访问配置值。

`config:clear` 命令可以用来清除已缓存的配置：

```shell
php artisan config:clear
```

> [!WARNING]
> 如果在部署流程中执行 `config:cache` 命令，请确保 `env` 函数只被从配置文件中调用。一旦配置被缓存，`.env` 文件就不会被加载；此时 `env` 函数只会返回外部的、系统级的环境变量。

## 发布配置

Laravel 的大多数配置文件已经发布到应用的 `config` 目录下了；不过，像 `cors.php`、`view.php` 等配置文件默认不会发布，因为大多数应用基本不需要修改它们。

但你可以使用 `config:publish` Artisan 命令，来发布这些默认未发布的配置文件：

```shell
php artisan config:publish

php artisan config:publish --all
```

## 调试模式

`config/app.php` 中的 `debug` 选项决定了实际向用户展示多少错误信息。默认情况下，该选项会采用 `.env` 中 `APP_DEBUG` 环境变量的值。

> [!WARNING]
> 在本地开发时，应将 `APP_DEBUG` 环境变量设置为 `true`。**在生产环境中，该值应始终为 `false`。如果在生产中将其设为 `true`，有把敏感配置值暴露给应用最终用户的风险。**

## 维护模式

当应用处于维护模式时，所有请求都会显示一个自定义视图。这让你在更新应用或进行维护时可以方便地「停用」应用。应用的默认中间件栈中包含了维护模式检查。若应用处于维护模式，会抛出 `Symfony\Component\HttpKernel\Exception\HttpException`，状态码为 503。

要启用维护模式，执行 `down` Artisan 命令：

```shell
php artisan down
```

如果希望所有维护模式响应都带上 `Refresh` HTTP 头，可以在调用 `down` 时传入 `refresh` 选项。`Refresh` 头会指示浏览器在指定的秒数后自动刷新页面：

```shell
php artisan down --refresh=15
```

也可以为 `down` 命令指定 `retry` 选项，它会作为 `Retry-After` HTTP 头的值——不过浏览器通常忽略该头：

```shell
php artisan down --retry=60
```

#### 绕过维护模式

若要允许用一个 secret token 绕过维护模式，可以使用 `secret` 选项指定绕过令牌：

```shell
php artisan down --secret="1630542a-246b-4b66-afa1-dd72a4c43515"
```

启用维护模式后，可以导航到与该 token 匹配的应用 URL，Laravel 会向你的浏览器颁发一个维护模式绕过 cookie：

```shell
https://example.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

如果希望 Laravel 为你生成 secret token，可以使用 `with-secret` 选项。应用进入维护模式后，secret 会输出给你：

```shell
php artisan down --with-secret
```

访问这个隐藏路由时，会被重定向到应用的 `/` 路由。一旦浏览器拿到该 cookie，就能像平时一样浏览应用——就像没有处于维护模式一样。

> [!NOTE]
> 维护模式 secret 通常应只包含字母数字字符，可选地包含短横线。URL 中具有特殊意义的字符（如 `?` 或 `&`）应当避免。

#### 多服务器下的维护模式

默认情况下，Laravel 通过基于文件的系统判断应用是否处于维护模式。这意味着 `php artisan down` 命令必须在托管应用的每一台服务器上执行才能激活维护模式。

Laravel 也提供基于缓存的方式来处理维护模式。这种方式只需在其中一台服务器上运行 `php artisan down` 命令即可启用。要使用这种方式，请修改应用的 `.env` 文件中与维护模式相关的变量。应选择一个所有服务器都能访问的缓存 `store`，确保维护模式状态在所有服务器间保持一致：

```ini
APP_MAINTENANCE_DRIVER=cache
APP_MAINTENANCE_STORE=database
```

#### 预渲染维护模式视图

如果在部署过程中使用 `php artisan down` 命令，当用户在 Composer 依赖或其他基础设施组件更新期间访问应用，仍可能会遇到错误。这是因为 Laravel 框架有相当一部分组件需要在请求开始时启动，才能判断应用处于维护模式并通过模板引擎渲染维护视图。

为此，Laravel 允许你预渲染一个维护模式视图，该视图会在请求周期最一开始就被返回——此时应用的任何依赖都还未加载。可以通过 `down` 命令的 `render` 选项预渲染指定模板：

```shell
php artisan down --render="errors::503"
```

#### 重定向维护模式请求

处于维护模式时，Laravel 会针对用户尝试访问的所有应用 URL 显示维护视图。如果你希望 Laravel 把所有请求重定向到指定 URL，也可以——使用 `redirect` 选项即可。例如，可能希望把全部请求重定向到 `/`：

```shell
php artisan down --redirect=/
```

#### 关闭维护模式

要关闭维护模式，使用 `up` 命令：

```shell
php artisan up
```

> [!NOTE]
> 你可以通过在 `resources/views/errors/503.blade.php` 定义自己的模板，自定义默认的维护模式视图。

#### 维护模式与队列

应用处于维护模式时，所有 [队列任务](/docs/{{version}}/queues) 都不会被处理。一旦应用脱离维护模式，任务会恢复正常处理。

#### 维护模式的替代方案

由于维护模式会导致应用有若干秒不可用，建议改用全托管平台（例如 [Laravel Cloud](https://cloud.laravel.com)）实现 Laravel 的零停机部署。
