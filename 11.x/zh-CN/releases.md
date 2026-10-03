# 发布说明

- [版本方案](#versioning-scheme)
- [支持策略](#support-policy)
- [Laravel 11](#laravel-11)

<a name="versioning-scheme"></a>
## 版本方案

Laravel 及其其它第一方包遵循[语义化版本](https://semver.org)。框架的主要版本每年（约在第一季度）发布一次，而次要版本和修订版本可能每周都会发布。次要版本和修订版本**绝不**应包含破坏性变更。

在应用或包中引用 Laravel 框架或其组件时，应始终使用 `^11.0` 这样的版本约束，因为 Laravel 的主要版本确实包含破坏性变更。不过，我们始终力求确保你能在一天之内完成向新主要版本的升级。

<a name="named-arguments"></a>
#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)不在 Laravel 向后兼容规范的覆盖范围内。为了改进 Laravel 代码库，我们可能在必要时重命名函数参数。因此，调用 Laravel 方法时使用命名参数应谨慎进行，并理解参数名称未来可能发生变化。

<a name="support-policy"></a>
## 支持策略

所有 Laravel 版本都提供 18 个月的 bug 修复和 2 年的安全修复。对于包括 Lumen 在内的所有附加库，只有最新的主要版本会获得 bug 修复。此外，请查阅 [Laravel 支持的数据库版本](/docs/{{version}}/database#introduction)。

<div class="overflow-auto">

| 版本 | PHP (*) | 发布日期 | Bug 修复截止 | 安全修复截止 |
| --- | --- | --- | --- | --- |
| 9 | 8.0 - 8.2 | 2022 年 2 月 8 日 | 2023 年 8 月 8 日 | 2024 年 2 月 6 日 |
| 10 | 8.1 - 8.3 | 2023 年 2 月 14 日 | 2024 年 8 月 6 日 | 2025 年 2 月 4 日 |
| 11 | 8.2 - 8.4 | 2024 年 3 月 12 日 | 2025 年 9 月 3 日 | 2026 年 3 月 12 日 |
| 12 | 8.2 - 8.4 | 2025 年 2 月 24 日 | 2026 年 8 月 13 日 | 2027 年 2 月 24 日 |

</div>

<div class="version-colors">
    <div class="end-of-life">
        <div class="color-box"></div>
        <div>生命周期结束</div>
    </div>
    <div class="security-fixes">
        <div class="color-box"></div>
        <div>仅安全修复</div>
    </div>
</div>

(*) 支持的 PHP 版本

<a name="laravel-11"></a>
## Laravel 11

Laravel 11 延续了 Laravel 10.x 中的改进，引入了精简的应用结构、按秒限流、健康检查路由、优雅的加密密钥轮换、队列测试改进、[Resend](https://resend.com) 邮件传输、Prompt 验证器集成、新的 Artisan 命令等。此外，还引入了第一方可扩展 WebSocket 服务器 Laravel Reverb，为你的应用提供稳健的实时能力。

<a name="php-8"></a>
### PHP 8.2

Laravel 11.x 要求 PHP 版本至少为 8.2。

<a name="structure"></a>
### 精简的应用结构

_Laravel 的精简应用结构由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Nuno Maduro](https://github.com/nunomaduro) 开发_。

Laravel 11 为**全新**的 Laravel 应用引入了精简的应用结构，无需对现有应用做任何改动。新的应用结构旨在提供更精简、更现代的体验，同时保留 Laravel 开发者已经熟悉的许多概念。下面我们讨论 Laravel 新应用结构的亮点。

#### 应用引导文件

`bootstrap/app.php` 文件已被改造为一个代码优先的应用配置文件。现在，你可以通过该文件自定义应用的路由、中间件、服务提供者、异常处理等。该文件统一了此前散落在应用文件结构各处的各种高层应用行为设置：

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

<a name="service-providers"></a>
#### 服务提供者

默认 Laravel 应用结构中包含五个服务提供者，而 Laravel 11 只包含一个 `AppServiceProvider`。原服务提供者的功能已被整合进 `bootstrap/app.php`、由框架自动处理，或可放入你应用的 `AppServiceProvider` 中。

例如，事件发现现在默认启用，这在很大程度上免除了手动注册事件及其监听器的需要。不过，如果确实需要手动注册事件，完全可以在 `AppServiceProvider` 中完成。同样，你此前在 `AuthServiceProvider` 中注册的路由模型绑定或授权门也可以改在 `AppServiceProvider` 中注册。

<a name="opt-in-routing"></a>
#### 可选的 API 与广播路由

`api.php` 和 `channels.php` 路由文件默认不再存在，因为许多应用并不需要这些文件。你可以使用简单的 Artisan 命令来创建它们：

```shell
php artisan install:api

php artisan install:broadcasting
```

<a name="middleware"></a>
#### 中间件

此前，全新的 Laravel 应用包含九个中间件。这些中间件承担各种任务，例如对请求进行认证、裁剪输入字符串、校验 CSRF 令牌等。

在 Laravel 11 中，这些中间件已被移入框架本身，从而不会给你的应用结构增加冗余。框架新增了用于自定义这些中间件行为的方法，可从应用的 `bootstrap/app.php` 文件中调用：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(
        except: ['stripe/*']
    );

    $middleware->web(append: [
        EnsureUserIsSubscribed::class,
    ])
})
```

由于所有中间件都可以通过应用的 `bootstrap/app.php` 轻松自定义，独立 HTTP "kernel" 类已不再需要。

<a name="scheduling"></a>
#### 任务调度

借助新的 `Schedule` Facade，现在可以直接在应用的 `routes/console.php` 文件中定义调度任务，从而不再需要独立的控制台"kernel"类：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->daily();
```

<a name="exception-handling"></a>
#### 异常处理

与路由和中间件一样，异常处理现在也可以在应用的 `bootstrap/app.php` 文件中定制，而无需独立的异常处理器类，从而减少全新 Laravel 应用所包含的文件总数：

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontReport(MissedFlightException::class);

    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

<a name="base-controller-class"></a>
#### 基础 `Controller` 类

全新 Laravel 应用中包含的基础控制器已被简化。它不再继承 Laravel 内部的 `Controller` 类，`AuthorizesRequests` 和 `ValidatesRequests` Trait 也已被移除；如果需要，你可以把它们包含到应用各自的控制器中：

```php
<?php

namespace App\Http\Controllers;

abstract class Controller
{
    //
}
```

<a name="application-defaults"></a>
#### 应用默认值

默认情况下，全新的 Laravel 应用使用 SQLite 作为数据库存储，并对 Laravel 的会话、缓存和队列使用 `database` 驱动。这样一来，你创建全新 Laravel 应用后即可立刻开始构建，无需安装额外软件或创建额外的数据库迁移。

此外，随着时间推移，这些 Laravel 服务的 `database` 驱动已经足够稳健，可以在许多应用场景中用于生产；因此，无论本地应用还是生产应用，它们都是合理而统一的选择。

<a name="reverb"></a>
### Laravel Reverb

_Laravel Reverb 由 [Joe Dixon](https://github.com/joedixon) 开发_。

[Laravel Reverb](https://reverb.laravel.com) 把疾速、可扩展的实时 WebSocket 通信直接带到你 Laravel 应用中，并与 Laravel 现有的事件广播工具套件（如 Laravel Echo）无缝集成。

```shell
php artisan reverb:start
```

此外，Reverb 通过 Redis 的发布 / 订阅能力支持水平扩展，让你可以把 WebSocket 流量分散到多台后端 Reverb 服务器上，共同支撑单个高负载应用。

想了解更多关于 Laravel Reverb 的信息，请查阅完整的 [Reverb 文档](/docs/{{version}}/reverb)。

<a name="rate-limiting"></a>
### 按秒限流

_按秒限流由 [Tim MacDonald](https://github.com/timacdonald) 贡献_。

Laravel 现在对所有限流器都支持"按秒"限流，包括 HTTP 请求和排队任务的限流器。此前，Laravel 的限流器只能达到"按分钟"的粒度：

```php
RateLimiter::for('invoices', function (Request $request) {
    return Limit::perSecond(1);
});
```

想了解更多关于 Laravel 限流的信息，请查看[限流文档](/docs/{{version}}/routing#rate-limiting)。

<a name="health"></a>
### 健康检查路由

_健康检查路由由 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

全新的 Laravel 11 应用包含一个 `health` 路由指令，它指示 Laravel 定义一个简单的健康检查端点，可由第三方应用健康监控服务或 Kubernetes 之类的编排系统调用。默认情况下，该路由在 `/up` 提供服务：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

当对该路由发起 HTTP 请求时，Laravel 还会分发一个 `DiagnosingHealth` 事件，让你执行与你的应用相关的额外健康检查。

<a name="encryption"></a>
### 优雅的加密密钥轮换

_优雅的加密密钥轮换由 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

由于 Laravel 会加密所有 Cookie（包括你应用的会话 Cookie），实际上对 Laravel 应用的每个请求都依赖加密。但也正因如此，轮换应用的加密密钥会让所有用户被登出。此外，用上一个加密密钥加密的数据将无法再解密。

Laravel 11 允许你通过 `APP_PREVIOUS_KEYS` 环境变量，把应用此前使用过的加密密钥定义为一个以逗号分隔的列表。

加密值时，Laravel 始终使用 `APP_KEY` 环境变量中的"当前"加密密钥。解密值时，Laravel 会先尝试当前密钥。如果使用当前密钥解密失败，Laravel 会依次尝试所有旧密钥，直到其中某个密钥能够解密该值。

这种优雅解密的方式使用户即使在加密密钥被轮换后，也能不中断地继续使用你的应用。

想了解更多关于 Laravel 加密的信息，请查看[加密文档](/docs/{{version}}/encryption)。

<a name="automatic-password-rehashing"></a>
### 密码自动重新哈希

_密码自动重新哈希由 [Stephen Rees-Carter](https://github.com/valorin) 贡献_。

Laravel 默认的密码哈希算法是 bcrypt。bcrypt 哈希的"工作因子"可以通过 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量调整。

通常，随着 CPU / GPU 处理能力提升，应逐步提高 bcrypt 的工作因子。如果你为应用提高了 bcrypt 工作因子，Laravel 现在会在用户通过你的应用认证时，优雅且自动地重新哈希用户密码。

<a name="prompt-validation"></a>
### Prompt 验证

_Prompt 验证器集成由 [Andrea Marco Sartori](https://github.com/cerbero90) 贡献_。

[Laravel Prompts](/docs/{{version}}/prompts) 是一个 PHP 包，用于为你的命令行应用添加美观且易用的表单，并提供类似浏览器的特性，包括占位文本和验证。

Laravel Prompts 支持通过闭包进行输入验证：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

不过，当涉及大量输入或复杂验证场景时，这会变得很繁琐。因此在 Laravel 11 中，验证 prompt 输入时你可以利用 Laravel [验证器](/docs/{{version}}/validation)的全部能力：

```php
$name = text('What is your name?', validate: [
    'name' => 'required|min:3|max:255',
]);
```

<a name="queue-interaction-testing"></a>
### 队列交互测试

_队列交互测试由 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

此前，要测试某个排队任务被重新放回、被删除或被手动标记为失败都很繁琐，需要定义自定义的队列 fake 和 stub。不过在 Laravel 11 中，你可以使用 `withFakeQueueInteractions` 方法轻松测试这些队列交互：

```php
use App\Jobs\ProcessPodcast;

$job = (new ProcessPodcast)->withFakeQueueInteractions();

$job->handle();

$job->assertReleased(delay: 30);
```

想了解更多关于测试排队任务的信息，请查看[队列文档](/docs/{{version}}/queues#testing)。

<a name="new-artisan-commands"></a>
### 新的 Artisan 命令

_类创建 Artisan 命令由 [Taylor Otwell](https://github.com/taylorotwell) 贡献_。

新增了 Artisan 命令，用于快速创建类、枚举、接口和 Trait：

```shell
php artisan make:class
php artisan make:enum
php artisan make:interface
php artisan make:trait
```

<a name="model-cast-improvements"></a>
### 模型类型转换改进

_模型类型转换改进由 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

Laravel 11 支持使用方法而不是属性来定义模型的类型转换。这让类型转换定义更精简、更流畅，在使用带参数的类型转换时尤其如此：

```php
/**
 * 获取应当进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::using(OptionCollection::class),
                  // AsEncryptedCollection::using(OptionCollection::class),
                  // AsEnumArrayObject::using(OptionEnum::class),
                  // AsEnumCollection::using(OptionEnum::class),
    ];
}
```

想了解更多关于属性类型转换的信息，请查阅 [Eloquent 文档](/docs/{{version}}/eloquent-mutators#attribute-casting)。

<a name="the-once-function"></a>
### `once` 函数

_`once` 辅助函数由 [Taylor Otwell](https://github.com/taylorotwell) 和 [Nuno Maduro](https://github.com/nunomaduro) 贡献_。

`once` 辅助函数会执行给定的回调，并在整个请求期间把结果缓存在内存中。之后用同一个回调再次调用 `once` 函数时，会返回先前缓存的结果：

```php
function random(): int
{
    return once(function () {
        return random_int(1, 1000);
    });
}

random(); // 123
random(); // 123（缓存结果）
random(); // 123（缓存结果）
```

想了解更多关于 `once` 辅助函数的信息，请查看[辅助函数文档](/docs/{{version}}/helpers#method-once)。

<a name="database-performance"></a>
### 使用内存数据库测试时的性能改进

_内存数据库测试性能改进由 [Anders Jenbo](https://github.com/AJenbo) 贡献_

在测试中使用 `:memory:` SQLite 数据库时，Laravel 11 提供了显著的速度提升。为此，Laravel 现在会维护一个对 PHP PDO 对象的引用，并在多个连接之间复用它，通常能把测试总耗时减半。

<a name="mariadb"></a>
### 改进的 MariaDB 支持

_MariaDB 支持改进由 [Jonas Staudenmeir](https://github.com/staudenmeir) 和 [Julius Kiekbusch](https://github.com/Jubeki) 贡献_

Laravel 11 改进了对 MariaDB 的支持。在之前的 Laravel 版本中，你可以通过 Laravel 的 MySQL 驱动使用 MariaDB。不过 Laravel 11 现在内置了专用的 MariaDB 驱动，为该数据库系统提供了更好的默认配置。

想了解更多关于 Laravel 数据库驱动的信息，请查看[数据库文档](/docs/{{version}}/database)。

<a name="inspecting-database"></a>
### 检查数据库与改进的 Schema 操作

_Schema 操作与数据库检查的改进由 [Hafez Divandari](https://github.com/hafezdivandari) 贡献_

Laravel 11 提供了更多数据库 Schema 操作与检查方法，包括原生的修改、重命名和删除列。此外，还提供了高级空间类型、非默认 Schema 名称，以及用于操作表、视图、列、索引和外键的原生 Schema 方法：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```