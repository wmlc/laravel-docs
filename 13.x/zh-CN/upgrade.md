# 升级指南

- [从 12.x 升级到 13.0](#upgrade-13.0)
    - [使用 AI 升级](#upgrading-using-ai)

<a name="high-impact-changes"></a>
## 高影响变更

<div class="content-list" markdown="1">

- [更新依赖](#updating-dependencies)
- [更新 Laravel 安装器](#updating-the-laravel-installer)
- [请求伪造防护](#request-forgery-protection)

</div>

<a name="medium-impact-changes"></a>
## 中影响变更

<div class="content-list" markdown="1">

- [缓存 `serializable_classes` 配置](#cache-serializable_classes-configuration)
- [MySQL 或 MariaDB 的数据库 `upsert`](#database-upsert-mariadb-mysql)

</div>

<a name="low-impact-changes"></a>
## 低影响变更

<div class="content-list" markdown="1">

- [缓存前缀与会话 Cookie 名称](#cache-prefixes-and-session-cookie-names)
- [集合模型序列化恢复预加载关联](#collection-model-serialization-restores-eager-loaded-relations)
- [`Container::call` 与可空类默认值](#containercall-and-nullable-class-defaults)
- [域路由注册优先级](#domain-route-registration-precedence)
- [`JobAttempted` 事件异常负载](#jobattempted-event-exception-payload)
- [Manager `extend` 回调绑定](#manager-extend-callback-binding)
- [带 `JOIN`、`ORDER BY` 和 `LIMIT` 的 MySQL `DELETE` 查询](#mysql-delete-queries-with-join-order-by-and-limit)
- [分页 Bootstrap 视图名称](#pagination-bootstrap-view-names)
- [多态中间表名称生成](#polymorphic-pivot-table-name-generation)
- [`QueueBusy` 事件属性重命名](#queuebusy-event-property-rename)
- [会话 `serialization` 配置](#session-serialization-configuration)
- [`Str` 工厂在测试之间重置](#str-factories-reset-between-tests)

</div>

<a name="upgrade-13.0"></a>
## 从 12.x 升级到 13.0

#### 预计升级时间：10 分钟

> [!NOTE]
> 我们尝试记录每一个可能的破坏性变更。由于其中一些破坏性变更位于框架较为冷门的部分，因此可能只有部分变更会真正影响到你的应用。为节省时间，你可以使用 [Shift](https://laravelshift.com)。Shift 是一项社区维护的服务，可自动执行 Laravel 升级。

<a name="upgrading-using-ai"></a>
### 使用 AI 升级

你可以使用 [Laravel Boost](https://github.com/laravel/boost) 自动化升级过程。Boost 是一个第一方 MCP 服务器，为你的 AI 助手提供引导式升级提示——安装到任何 Laravel 12 应用后，在 Claude Code、Cursor、OpenCode、Gemini 或 VS Code 中使用 `/upgrade-laravel-v13` 斜杠命令即可开始升级到 Laravel 13。此命令需要 Laravel Boost `^2.0`。

<a name="updating-dependencies"></a>
### 更新依赖

**影响可能性：高**

你应在应用的 `composer.json` 文件中更新以下依赖：

<div class="content-list" markdown="1">

- 将 `laravel/framework` 更新为 `^13.0`
- 将 `laravel/boost` 更新为 `^2.0`
- 将 `laravel/tinker` 更新为 `^3.0`
- 将 `phpunit/phpunit` 更新为 `^12.0`
- 将 `pestphp/pest` 更新为 `^4.0`

</div>

<a name="updating-the-laravel-installer"></a>
### 更新 Laravel 安装器

如果你使用 Laravel 安装器 CLI 工具创建新的 Laravel 应用，则应更新你的安装器安装，以实现 Laravel 13.x 兼容。

如果你通过 `composer global require` 安装了 Laravel 安装器，可以使用 `composer global update` 更新安装器：

```shell
composer global update laravel/installer
```

或者，如果你正在使用 [Laravel Herd](https://herd.laravel.com) 捆绑的 Laravel 安装器副本，则应更新你的 Herd 安装到最新版本。

<a name="cache"></a>
### 缓存

<a name="cache-prefixes-and-session-cookie-names"></a>
#### 缓存前缀与会话 Cookie 名称

**影响可能性：低**

Laravel 的默认缓存和 Redis 键前缀现在使用连字符分隔的后缀。

在大多数应用中，此变更不会生效，因为应用级配置文件已经定义了这些值。这主要影响那些在相应应用配置值不存在时依赖框架级回退配置的应用。

如果你的应用依赖这些生成的默认值，升级后缓存键和会话 Cookie 名称可能会发生变化：

```php
// Laravel <= 12.x
Str::slug((string) env('APP_NAME', 'laravel'), '_').'_cache_';
Str::slug((string) env('APP_NAME', 'laravel'), '_').'_database_';
Str::slug((string) env('APP_NAME', 'laravel'), '_').'_session';

// Laravel >= 13.x
Str::slug((string) env('APP_NAME', 'laravel')).'-cache-';
Str::slug((string) env('APP_NAME', 'laravel')).'-database-';
Str::slug((string) env('APP_NAME', 'laravel')).'-session';
```

要保留以前的行为，请在你的环境中显式配置 `CACHE_PREFIX`、`REDIS_PREFIX` 和 `SESSION_COOKIE`。

<a name="store-and-repository-contracts-touch"></a>
#### `Store` 与 `Repository` 契约：`touch`

**影响可能性：极低**

缓存契约现在包含一个用于扩展条目 TTL 的 `touch` 方法。如果你维护自定义缓存存储实现，应添加此方法：

```php
// Illuminate\Contracts\Cache\Store
public function touch($key, $seconds);
```

<a name="cache-serializable_classes-configuration"></a>
#### 缓存 `serializable_classes` 配置

**影响可能性：中**

默认的应用 `cache` 配置现在包含一个设置为 `false` 的 `serializable_classes` 选项。这强化了缓存反序列化行为，有助于在应用的 `APP_KEY` 泄露时防止 PHP 反序列化 gadget 链攻击。如果你的应用有意在缓存中存储 PHP 对象，应显式列出允许反序列化的类：

```php
'serializable_classes' => [
    App\Data\CachedDashboardStats::class,
    App\Support\CachedPricingSnapshot::class,
],
```

如果你的应用以前依赖反序列化任意缓存对象，则需要将该用法迁移到显式的类允许列表，或迁移到非对象缓存负载（例如数组）。

<a name="container"></a>
### 容器

<a name="containercall-and-nullable-class-defaults"></a>
#### `Container::call` 与可空类默认值

**影响可能性：低**

当不存在绑定时，`Container::call` 现在会尊重可空的类参数默认值，与 Laravel 12 中引入的构造函数注入行为保持一致：

```php
$container->call(function (?Carbon $date = null) {
    return $date;
});

// Laravel <= 12.x: Carbon instance
// Laravel >= 13.x: null
```

如果你的方法调用注入逻辑依赖以前的行为，则可能需要更新它。

<a name="contracts"></a>
### 契约

<a name="dispatcher-contract-dispatchafterresponse"></a>
#### `Dispatcher` 契约：`dispatchAfterResponse`

**影响可能性：极低**

`Illuminate\Contracts\Bus\Dispatcher` 契约现在包含 `dispatchAfterResponse($command, $handler = null)` 方法。

如果你维护自定义的调度器实现，请将该方法添加到你的类中。

<a name="responsefactory-contract-eventstream"></a>
#### `ResponseFactory` 契约：`eventStream`

**影响可能性：极低**

`Illuminate\Contracts\Routing\ResponseFactory` 契约现在包含一个 `eventStream` 签名。

如果你维护此契约的自定义实现，应添加此方法。

<a name="mustverifyemail-contract-markemailasunverified"></a>
#### `MustVerifyEmail` 契约：`markEmailAsUnverified`

**影响可能性：极低**

`Illuminate\Contracts\Auth\MustVerifyEmail` 契约现在包含 `markEmailAsUnverified()`。

如果你为此契约提供自定义实现，请添加此方法以保持兼容。

<a name="database"></a>
### 数据库

<a name="database-upsert-mariadb-mysql"></a>
#### MySQL 或 MariaDB 的数据库 `upsert`

**影响可能性：中**

Laravel 现在会验证调用者为 `uniqueBy` 提供非空值，并在值无效时抛出 `InvalidArgumentException`，而不是生成无效 SQL。

尽管 MariaDB 和 MySQL 数据库驱动会忽略 `uniqueBy` 值，并始终使用表的主索引和唯一索引来检测现有记录，但该验证仍然生效。如果 `uniqueBy` 为空，将抛出 `InvalidArgumentException`。

<a name="mysql-delete-queries-with-join-order-by-and-limit"></a>
#### 带 `JOIN`、`ORDER BY` 和 `LIMIT` 的 MySQL `DELETE` 查询

**影响可能性：低**

Laravel 现在会为 MySQL 语法编译包含 `ORDER BY` 和 `LIMIT` 的完整 `DELETE ... JOIN` 查询。

在以前的版本中，`ORDER BY` / `LIMIT` 子句在连接删除时可能被静默忽略。在 Laravel 13 中，这些子句会包含在生成的 SQL 中。因此，不支持此语法的数据库引擎（例如标准的 MySQL / MariaDB 变体）现在可能抛出 `QueryException`，而不是执行无界删除。

<a name="eloquent"></a>
### Eloquent

<a name="model-booting-and-nested-instantiation"></a>
#### 模型启动与嵌套实例化

**影响可能性：极低**

在模型仍在启动时创建新的模型实例现在被禁止，并会抛出 `LogicException`。

这会影响从模型 `boot` 方法或 Trait 的 `boot*` 方法内部实例化模型的代码：

```php
protected static function boot()
{
    parent::boot();

    // No longer allowed during booting...
    (new static())->getTable();
}
```

请将此逻辑移出启动周期，以避免嵌套启动。

<a name="polymorphic-pivot-table-name-generation"></a>
#### 多态中间表名称生成

**影响可能性：低**

当使用自定义中间模型类推断多态中间表的表名时，Laravel 现在会生成复数名称。

如果你的应用在使用自定义中间类时依赖以前推断出的单数名称，则应在中间模型上显式定义表名。

<a name="collection-model-serialization-restores-eager-loaded-relations"></a>
#### 集合模型序列化恢复预加载关联

**影响可能性：低**

当 Eloquent 模型集合被序列化和恢复时（例如在队列任务中），现在会为集合中的模型恢复预加载的关联。

如果你的代码依赖反序列化后关联不存在的行为，则可能需要调整该逻辑。

<a name="http-client"></a>
### HTTP 客户端

<a name="http-client-response-throw-and-throwif-signatures"></a>
#### HTTP 客户端 `Response::throw` 与 `throwIf` 签名

**影响可能性：极低**

HTTP 客户端响应方法现在在其方法签名中声明了回调参数：

```php
public function throw($callback = null);
public function throwIf($condition, $callback = null);
```

如果你在自定义响应类中覆盖了这些方法，请确保你的方法签名兼容。

<a name="notifications"></a>
### 通知

<a name="default-password-reset-subject"></a>
#### 默认密码重置主题

**影响可能性：极低**

Laravel 默认的密码重置邮件主题已更改：

```text
// Laravel <= 12.x
Reset Password Notification

// Laravel >= 13.x
Reset your password
```

如果你的测试、断言或翻译覆盖依赖以前的默认字符串，请相应更新它们。

<a name="queued-notifications-and-missing-models"></a>
#### 队列通知与缺失模型

**影响可能性：极低**

队列通知现在会尊重通知类上定义的 `#[DeleteWhenMissingModels]` 属性和 `$deleteWhenMissingModels` 属性。

在以前的版本中，在你期望队列通知任务被删除的情况下，缺失的模型仍可能导致任务失败。

<a name="queue"></a>
### 队列

<a name="jobattempted-event-exception-payload"></a>
#### `JobAttempted` 事件异常负载

**影响可能性：低**

`Illuminate\Queue\Events\JobAttempted` 事件现在通过 `$exception` 暴露异常对象（或 `null`），取代了以前布尔类型的 `$exceptionOccurred` 属性：

```php
// Laravel <= 12.x
$event->exceptionOccurred;

// Laravel >= 13.x
$event->exception;
```

如果你监听此事件，请相应更新你的监听器代码。

<a name="queuebusy-event-property-rename"></a>
#### `QueueBusy` 事件属性重命名

**影响可能性：低**

`Illuminate\Queue\Events\QueueBusy` 事件的 `$connection` 属性已重命名为 `$connectionName`，以与其他队列事件保持一致。

如果你的监听器引用了 `$connection`，请将它们更新为 `$connectionName`。

<a name="queue-contract-method-additions"></a>
#### `Queue` 契约方法新增

**影响可能性：极低**

`Illuminate\Contracts\Queue\Queue` 契约现在包含之前仅在 PHPDoc 中声明的队列大小检查方法。

如果你维护此契约的自定义队列驱动实现，请为以下方法添加实现：

<div class="content-list" markdown="1">

- `pendingSize`
- `delayedSize`
- `reservedSize`
- `creationTimeOfOldestPendingJob`

</div>

<a name="routing"></a>
### 路由

<a name="domain-route-registration-precedence"></a>
#### 域路由注册优先级

**影响可能性：低**

带有显式域的路由现在在路由匹配中优先于非域路由。

这使得捕获所有子域路由即使在非域路由先注册时也能保持一致行为。如果你的应用依赖域路由与非域路由之间以前的注册优先级，请检查路由匹配行为。

<a name="session"></a>
### 会话

<a name="session-serialization-configuration"></a>
#### 会话 `serialization` 配置

**影响可能性：低**

为帮助防止 PHP 反序列化 gadget 链攻击，默认的应用骨架现在在 `config/session.php` 文件中将会话 `serialization` 选项设置为 `json`。

如果你正在升级现有应用，并将配置文件与 Laravel 13 骨架同步，则将此值从 `php` 更新为 `json` 将使所有活跃用户会话失效。

如果你希望在升级期间无缝保持活跃会话，则应确保此值保持为 `php`。但是，如果你的应用不在会话中存储 PHP 对象，并且你愿意要求用户重新认证，我们建议将此值更新为 `json` 以获得更好的安全性。

<a name="scheduling"></a>
### 计划任务

<a name="withscheduling-registration-timing"></a>
#### `withScheduling` 注册时机

**影响可能性：极低**

通过 `ApplicationBuilder::withScheduling()` 注册的计划任务现在会延迟到 `Schedule` 被解析时才注册。

如果你的应用依赖引导期间立即注册计划任务的时机，则可能需要调整该逻辑。

<a name="security"></a>
### 安全

<a name="request-forgery-protection"></a>
#### 请求伪造防护

**影响可能性：高**

Laravel 的 CSRF 中间件已从 `VerifyCsrfToken` 重命名为 `PreventRequestForgery`，并且现在包含使用 `Sec-Fetch-Site` 请求头的请求来源验证。

`VerifyCsrfToken` 和 `ValidateCsrfToken` 仍作为已弃用的别名保留，但应更新直接引用为 `PreventRequestForgery`，尤其是在测试或路由定义中排除中间件时：

```php
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

// Laravel <= 12.x
->withoutMiddleware([VerifyCsrfToken::class]);

// Laravel >= 13.x
->withoutMiddleware([PreventRequestForgery::class]);
```

中间件配置 API 现在还提供 `preventRequestForgery(...)`。

<a name="support"></a>
### 支持库

<a name="manager-extend-callback-binding"></a>
#### Manager `extend` 回调绑定

**影响可能性：低**

通过 Manager `extend` 方法注册的自定义驱动闭包现在绑定到 Manager 实例。

如果你以前依赖另一个绑定对象（例如服务提供者实例）作为这些回调中的 `$this`，则应使用 `use (...)` 将这些值移动到闭包捕获中。

<a name="str-factories-reset-between-tests"></a>
#### `Str` 工厂在测试之间重置

**影响可能性：低**

Laravel 现在会在测试拆除期间重置自定义的 `Str` 工厂。

如果你的测试依赖自定义的 UUID / ULID / 随机字符串工厂在测试方法之间保持有效，则应在每个相关测试或 setup 钩子中设置它们。

<a name="jsfrom-uses-unescaped-unicode-by-default"></a>
#### `Js::from` 默认使用未转义的 Unicode

**影响可能性：极低**

`Illuminate\Support\Js::from` 现在默认使用 `JSON_UNESCAPED_UNICODE`。

如果你的测试或前端输出比较依赖转义的 Unicode 序列（例如 `\u00e8`），请更新你的预期值。

<a name="utilities"></a>
### 工具

<a name="symfony-polyfill"></a>
#### Symfony PHP 8.5 Polyfill 与全局函数冲突

**影响可能性：低**

Laravel 13 引入了对 `symfony/polyfill-php85` 的依赖。在低于 8.5 的 PHP 版本上，除非这些函数已在引导期间更早定义，否则此 polyfill 会定义 `array_first()` 和 `array_last()` 等全局函数。

这些函数可能与 `laravel/helpers` 等遗留辅助包或使用相同名称的自定义全局辅助函数冲突。例如，历史上的 `array_first()` 辅助函数接受一个回调来返回第一个匹配元素，而 polyfill 版本只返回数组的第一个元素。

为避免冲突并确保跨 PHP 版本的一致行为，你应优先使用 `Illuminate\Support\Arr` 方法：

```php
use Illuminate\Support\Arr;

Arr::first($array, function ($value) {
  return /* condition */;
});
```

<a name="views"></a>
### 视图

<a name="pagination-bootstrap-view-names"></a>
#### 分页 Bootstrap 视图名称

**影响可能性：低**

Bootstrap 3 默认值的内部分页视图名称现在改为显式名称：

```nothing
// Laravel <= 12.x
pagination::default
pagination::simple-default

// Laravel >= 13.x
pagination::bootstrap-3
pagination::simple-bootstrap-3
```

如果你的应用直接引用旧的分页视图名称，请更新这些引用。

<a name="miscellaneous"></a>
### 其他

我们还鼓励你查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel)中的变更。虽然其中许多变更不是必需的，但你可能希望使这些文件与你的应用保持同步。其中一些变更会包含在本升级指南中，但其他变更（例如配置文件或注释的更改）则不会。你可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/12.x...13.x)轻松查看这些变更，并选择对你重要的更新。
