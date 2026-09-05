# 升级指南

## 高影响变更

- [更新依赖](#updating-dependencies)
- [更新 Laravel 安装器](#updating-the-laravel-installer)
- [请求伪造防护](#request-forgery-protection)

## 中等影响变更

- [缓存 `serializable_classes` 配置](#cache-serializable_classes-configuration)
- [使用 MySQL 或 MariaDB 的数据库 `upsert`](#database-upsert-mariadb-mysql)

## 低影响变更

- [缓存前缀与会话 Cookie 名称](#cache-prefixes-and-session-cookie-names)
- [集合模型序列化恢复预加载的关联](#collection-model-serialization-restores-eager-loaded-relations)
- [`Container::call` 与可空类默认值](#containercall-and-nullable-class-defaults)
- [域路由注册优先级](#domain-route-registration-precedence)
- [`JobAttempted` 事件异常负载](#jobattempted-event-exception-payload)
- [Manager `extend` 回调绑定](#manager-extend-callback-binding)
- [带 `JOIN`、`ORDER BY` 和 `LIMIT` 的 MySQL `DELETE` 查询](#mysql-delete-queries-with-join-order-by-and-limit)
- [分页 Bootstrap 视图名称](#pagination-bootstrap-view-names)
- [多态数据透视表名称生成](#polymorphic-pivot-table-name-generation)
- [`QueueBusy` 事件属性重命名](#queuebusy-event-property-rename)
- [会话 `serialization` 配置](#session-serialization-configuration)
- [`Str` 工厂在测试间重置](#str-factories-reset-between-tests)

## 从 12.x 升级到 13.0

#### 预计升级耗时：10 分钟

> [!NOTE]
> 我们试图记录每一个可能的破坏性变更。由于其中一些破坏性变更位于框架中较为冷僻的部分，只有一部分变更可能真正影响你的应用程序。为了节省时间，你可以使用 [Shift](https://laravelshift.com)。Shift 是一个社区维护的服务，可自动化 Laravel 升级。

### 使用 AI 升级

你可以使用 [Laravel Boost](https://github.com/laravel/boost) 自动执行升级。Boost 是一个官方的 MCP 服务器，为你的 AI 助手提供引导式升级提示——一旦安装在任何 Laravel 12 应用程序中，就可以在 Claude Code、Cursor、OpenCode、Gemini 或 VS Code 中使用 `/upgrade-laravel-v13` 斜杠命令开始升级到 Laravel 13。该命令需要 Laravel Boost `^2.0`。

### 更新依赖

**受影响可能性：高**

你应该更新应用程序 `composer.json` 文件中的以下依赖：

- `laravel/framework` 更新至 `^13.0`
- `laravel/boost` 更新至 `^2.0`
- `laravel/tinker` 更新至 `^3.0`
- `phpunit/phpunit` 更新至 `^12.0`
- `pestphp/pest` 更新至 `^4.0`

### 更新 Laravel 安装器

如果你使用 Laravel 安装器 CLI 工具创建新的 Laravel 应用程序，你应该更新你的安装器以兼容 Laravel 13.x。

如果你是通过 `composer global require` 安装 Laravel 安装器的，可以使用 `composer global update` 更新安装器：

```shell
composer global update laravel/installer
```

或者，如果你使用的是 [Laravel Herd](https://herd.laravel.com) 自带的 Laravel 安装器副本，你应该将 Herd 安装更新到最新版本。

### 缓存

#### 缓存前缀与 Session Cookie 名称

**受影响可能性：低**

Laravel 默认的缓存和 Redis 键前缀现在使用连字符后缀。

在大多数应用程序中，此变更不会生效，因为应用级配置文件已经定义了这些值。这主要影响那些在相应的应用配置值不存在时依赖框架级回退配置的应用程序。

如果你的应用程序依赖这些生成的默认值，升级后缓存键和会话 Cookie 名称可能会改变：

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

要保留之前的行为，请在你的环境中显式配置 `CACHE_PREFIX`、`REDIS_PREFIX` 和 `SESSION_COOKIE`。

#### `Store` and `Repository` Contracts: `touch`

**受影响可能性：极低**

缓存契约现在包含了一个用于延长条目 TTL 的 `touch` 方法。如果你维护自定义的缓存存储实现，你应该添加此方法：

```php
// Illuminate\Contracts\Cache\Store
public function touch($key, $seconds);
```

#### Cache `serializable_classes` 配置

**受影响可能性：中**

默认的应用程序 `cache` 配置现在包含一个设置为 `false` 的 `serializable_classes` 选项。这加固了缓存反序列化行为，有助于在应用程序的 `APP_KEY` 泄露时防止 PHP 反序列化 gadget 链攻击。如果你的应用程序有意在缓存中存储 PHP 对象，你应该显式列出可以反序列化的类：

```php
'serializable_classes' => [
    App\Data\CachedDashboardStats::class,
    App\Support\CachedPricingSnapshot::class,
],
```

如果你的应用程序以前依赖反序列化任意缓存对象，你需要将这种用法迁移到显式的类白名单，或者迁移到非对象的缓存负载（例如数组）。

### 容器

#### `Container::call` and Nullable Class Defaults

**受影响可能性：低**

`Container::call` 现在在没有绑定时遵循可空的类参数默认值，这与 Laravel 12 中引入的构造函数注入行为一致：

```php
$container->call(function (?Carbon $date = null) {
    return $date;
});

// Laravel <= 12.x: Carbon 实例
// Laravel >= 13.x: null
```

如果你的方法调用注入逻辑依赖之前的行为，你可能需要更新它。

### 契约

#### `Dispatcher` Contract: `dispatchAfterResponse`

**受影响可能性：极低**

`Illuminate\Contracts\Bus\Dispatcher` 契约现在包含了 `dispatchAfterResponse($command, $handler = null)` 方法。

如果你维护自定义的调度器实现，请向你的类添加此方法。

#### `ResponseFactory` Contract: `eventStream`

**受影响可能性：极低**

`Illuminate\Contracts\Routing\ResponseFactory` 契约现在包含了一个 `eventStream` 签名。

如果你维护该契约的自定义实现，你应该添加此方法。

#### `MustVerifyEmail` Contract: `markEmailAsUnverified`

**受影响可能性：极低**

`Illuminate\Contracts\Auth\MustVerifyEmail` 契约现在包含 `markEmailAsUnverified()`。

如果你提供该契约的自定义实现，请添加此方法以保持兼容。

### 数据库

#### 在 MySQL 或 MariaDB 中使用数据库 `upsert`

**受影响可能性：中**

Laravel 现在会验证调用方为 `uniqueBy` 提供了非空值，并会抛出 `InvalidArgumentException` 而不是生成无效的 SQL。

尽管 MariaDB 和 MySQL 数据库驱动会忽略 `uniqueBy` 值，始终使用表的主键和唯一索引来检测现有记录，但验证仍然适用。如果 `uniqueBy` 为空，将抛出 `InvalidArgumentException`。

#### 带 `JOIN`、`ORDER BY` 和 `LIMIT` 的 MySQL `DELETE` 查询

**受影响可能性：低**

Laravel 现在会为 MySQL 语法编译完整的 `DELETE ... JOIN` 查询，包括 `ORDER BY` 和 `LIMIT`。

在之前的版本中，`ORDER BY` / `LIMIT` 子句可能在连接删除时被静默忽略。在 Laravel 13 中，这些子句被包含在生成的 SQL 中。因此，不支持此语法的数据库引擎（例如标准 MySQL / MariaDB 变体）现在可能会抛出 `QueryException` 而不是执行无限制的删除。

### Eloquent

#### 模型引导与嵌套实例化

**受影响可能性：极低**

现在禁止在该模型仍在引导（Bootstrap）期间创建新的模型实例，否则会抛出 `LogicException`。

这会影响从模型 `boot` 方法或 Trait 的 `boot*` 方法中实例化模型的代码：

```php
protected static function boot()
{
    parent::boot();

    // 引导期间不再允许...
    (new static())->getTable();
}
```

将此逻辑移出引导周期，以避免嵌套引导。

#### 多态中间表名称生成

**受影响可能性：低**

当使用自定义数据透视模型类为多态数据透视模型推断表名时，Laravel 现在会生成复数形式的名称。

如果你的应用程序依赖之前为 morph 数据透视表推断的单数名称，并使用了自定义数据透视类，你应该在数据透视模型上显式定义表名。

#### 集合模型序列化会恢复预加载关联

**受影响可能性：低**

当 Eloquent 模型集合被序列化并恢复时（例如在排队任务中），现在会为集合中的模型恢复预加载的关联。

如果你的代码依赖反序列化后不存在关联，你可能需要调整该逻辑。

### HTTP 客户端

#### HTTP 客户端 `Response::throw` 与 `throwIf` 签名

**受影响可能性：极低**

HTTP 客户端 响应 方法现在在方法签名中声明了它们的回调参数：

```php
public function throw($callback = null);
public function throwIf($condition, $callback = null);
```

如果你在自定义的 响应 类中重写了这些方法，请确保你的方法签名兼容。

### 通知

#### 默认密码重置主题

**受影响可能性：极低**

Laravel 默认的密码重置邮件主题已更改：

```text
// Laravel <= 12.x
Reset Password Notification

// Laravel >= 13.x
Reset your password
```

如果你的测试、断言或翻译覆盖依赖之前的默认字符串，请相应更新它们。

#### 队列通知与模型缺失

**受影响可能性：极低**

排队的通知现在会遵守通知类上定义的 `#[DeleteWhenMissingModels]` 属性和 `$deleteWhenMissingModels` 属性。

在之前的版本中，在你期望它们被删除的情况下，缺失的模型仍可能导致排队通知任务失败。

### 队列

#### `JobAttempted` Event Exception Payload

**受影响可能性：低**

`Illuminate\Queue\Events\JobAttempted` 事件现在通过 `$exception` 暴露异常对象（或 `null`），取代之前的布尔属性 `$exceptionOccurred`：

```php
// Laravel <= 12.x
$event->exceptionOccurred;

// Laravel >= 13.x
$event->exception;
```

如果你监听此事件，请相应更新你的监听器代码。

#### `QueueBusy` Event Property Rename

**受影响可能性：低**

`Illuminate\Queue\Events\QueueBusy` 事件的属性 `$connection` 已重命名为 `$connectionName`，以与其他队列事件保持一致。

如果你的监听器引用了 `$connection`，请将其更新为 `$connectionName`。

#### `Queue` Contract Method Additions

**受影响可能性：极低**

`Illuminate\Contracts\Queue\Queue` 契约现在包含了之前仅在文档注释中声明的队列大小检查方法。

如果你维护该契约的自定义队列驱动实现，请添加以下实现：

- `pendingSize`
- `delayedSize`
- `reservedSize`
- `creationTimeOfOldestPendingJob`

### 路由

#### 域名路由注册优先级

**受影响可能性：低**

带有显式域的路由现在会在路由匹配中优先于非域路由。

这使得通配子域路由即使在非域路由更早注册时也能表现一致。如果你的应用程序依赖之前域路由与非域路由之间的注册优先级，请检查路由匹配行为。

### Session

#### Session `serialization` 配置

**受影响可能性：低**

为帮助防止 PHP 反序列化 gadget 链攻击，默认的应用程序骨架现在在 `config/session.php` 文件中将会话 `serialization` 选项设置为 `json`。

如果你正在升级现有应用程序并将其配置文件与 Laravel 13 骨架同步，将此值从 `php` 更新为 `json` 会使所有活动用户会话失效。

如果你希望在升级期间无缝保留活动会话，应确保此值保持为 `php`。不过，如果你的应用程序不在会话中存储 PHP 对象，并且你愿意要求用户重新身份验证，我们建议将此值更新为 `json` 以提高安全性。

### 计划任务

#### `withScheduling` Registration Timing

**受影响可能性：极低**

通过 `ApplicationBuilder::withScheduling()` 注册的调度现在会延迟到解析 `Schedule` 时执行。

如果你的应用程序依赖引导（Bootstrap）期间立即注册调度的时机，你可能需要调整该逻辑。

### 安全

#### 请求伪造防护

**受影响可能性：高**

Laravel 的 CSRF 中间件已从 `VerifyCsrfToken` 重命名为 `PreventRequestForgery`，现在包含使用 `Sec-Fetch-Site` Header 的 请求 来源验证。

`VerifyCsrfToken` 和 `ValidateCsrfToken` 仍作为已弃用的别名保留，但应更新直接引用为 `PreventRequestForgery`，尤其是在测试中或路由定义中排除中间件时：

```php
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

// Laravel <= 12.x
->withoutMiddleware([VerifyCsrfToken::class]);

// Laravel >= 13.x
->withoutMiddleware([PreventRequestForgery::class]);
```

中间件配置 API 现在还提供 `preventRequestForgery(...)`。

### 支持

#### 管理器 `extend` 回调绑定

**受影响可能性：低**

通过 Manager 的 `extend` 方法注册的自定义驱动闭包现在会绑定到 Manager 实例。

如果你之前依赖另一个被绑定的对象（例如服务提供者实例）作为这些回调中的 `$this`，你应该使用 `use (...)` 将这些值移入闭包捕获中。

#### `Str` Factories Reset Between Tests

**受影响可能性：低**

Laravel 现在会在测试拆解期间重置自定义的 `Str` 工厂。

如果你的测试依赖自定义 UUID / ULID / 随机字符串工厂在测试方法之间持久化，你应该在每个相关测试或设置钩子中设置它们。

#### `Js::from` Uses Unescaped Unicode By Default

**受影响可能性：极低**

`Illuminate\Support\Js::from` 现在默认使用 `JSON_UNESCAPED_UNICODE`。

如果你的测试或前端输出比较依赖转义的 Unicode 序列（例如 `\u00e8`），请更新你的预期。

### 实用工具

#### Symfony PHP 8.5 Polyfill 与全局函数冲突

**受影响可能性：低**

Laravel 13 引入了对 `symfony/polyfill-php85` 的依赖。在低于 8.5 的 PHP 版本上，该 polyfill 会定义全局函数，例如 `array_first()` 和 `array_last()`，除非它们在引导（Bootstrap）期间更早已经被定义。

这些函数可能会与遗留的辅助包（如 `laravel/helpers`）或使用相同名称的自定义全局辅助函数冲突。例如，历史上的 `array_first()` 辅助函数接受一个回调以返回第一个匹配的元素，而 polyfill 版本仅返回数组的第一个元素。

为避免冲突并确保跨 PHP 版本的一致行为，你应该优先使用 `Illuminate\Support\Arr` 方法：

```php
use Illuminate\Support\Arr;

Arr::first($array, function ($value) {
  return /* condition */;
});
```

### 视图

#### 分页 Bootstrap 视图名称

**受影响可能性：低**

Bootstrap 3 默认值对应的内部分页视图名称现在是显式的：

```nothing
// Laravel <= 12.x
pagination::default
pagination::simple-default

// Laravel >= 13.x
pagination::bootstrap-3
pagination::simple-bootstrap-3
```

如果你的应用程序直接引用了旧的分页视图名称，请更新这些引用。

### 其他

我们还鼓励你查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel)中的变更。虽然其中许多变更并非必需，但你可能希望使这些文件与你的应用程序保持同步。其中一些变更将包含在本升级指南中，但其他如配置文件或注释的变更则不会。你可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/12.x...13.x) 轻松查看变更，并选择哪些更新对你很重要。
