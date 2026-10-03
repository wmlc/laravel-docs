# 升级指南

- [从 10.x 升级到 11.0](#upgrade-11.0)

<a name="high-impact-changes"></a>
## 影响较大的变更

<div class="content-list" markdown="1">

- [更新依赖](#updating-dependencies)
- [应用结构](#application-structure)
- [浮点类型](#floating-point-types)
- [修改列](#modifying-columns)
- [SQLite 最低版本](#sqlite-minimum-version)
- [更新 Sanctum](#updating-sanctum)

</div>

<a name="medium-impact-changes"></a>
## 影响适中的变更

<div class="content-list" markdown="1">

- [Carbon 3](#carbon-3)
- [密码重新哈希](#password-rehashing)
- [按秒限流](#per-second-rate-limiting)
- [Spatie Once 包](#spatie-once-package)

</div>

<a name="low-impact-changes"></a>
## 影响较小的变更

<div class="content-list" markdown="1">

- [移除 Doctrine DBAL](#doctrine-dbal-removal)
- [Eloquent 模型的 `casts` 方法](#eloquent-model-casts-method)
- [空间类型](#spatial-types)
- [`Enumerable` 契约](#the-enumerable-contract)
- [`UserProvider` 契约](#the-user-provider-contract)
- [`Authenticatable` 契约](#the-authenticatable-contract)

</div>

<a name="upgrade-11.0"></a>
## 从 10.x 升级到 11.0

<a name="estimated-upgrade-time-??-minutes"></a>
#### 预计升级时间：15 分钟

> [!NOTE]
> 我们尽力记录了所有可能的破坏性变更。由于其中一些变更只涉及框架中不常被触及的部分，因此实际上可能只有一部分变更会影响你的应用。想节省时间？你可以使用 [Laravel Shift](https://laravelshift.com/) 帮助自动完成应用升级。

<a name="updating-dependencies"></a>
### 更新依赖

**影响可能性：高**

#### 需要 PHP 8.2.0

Laravel 现在需要 PHP 8.2.0 或更高版本。

#### 需要 curl 7.34.0

Laravel 的 HTTP 客户端现在需要 curl 7.34.0 或更高版本。

#### Composer 依赖

你应当在应用 `composer.json` 文件中更新以下依赖：

<div class="content-list" markdown="1">

- `laravel/framework` 改为 `^11.0`
- `nunomaduro/collision` 改为 `^8.1`
- `laravel/breeze` 改为 `^2.0`（如果已安装）
- `laravel/cashier` 改为 `^15.0`（如果已安装）
- `laravel/dusk` 改为 `^8.0`（如果已安装）
- `laravel/jetstream` 改为 `^5.0`（如果已安装）
- `laravel/octane` 改为 `^2.3`（如果已安装）
- `laravel/passport` 改为 `^12.0`（如果已安装）
- `laravel/sanctum` 改为 `^4.0`（如果已安装）
- `laravel/scout` 改为 `^10.0`（如果已安装）
- `laravel/spark-stripe` 改为 `^5.0`（如果已安装）
- `laravel/telescope` 改为 `^5.0`（如果已安装）
- `livewire/livewire` 改为 `^3.4`（如果已安装）
- `inertiajs/inertia-laravel` 改为 `^1.0`（如果已安装）

</div>

如果你的应用使用了 Laravel Cashier Stripe、Passport、Sanctum、Spark Stripe 或 Telescope，你需要把它们的数据库迁移发布到你的应用中。Cashier Stripe、Passport、Sanctum、Spark Stripe 和 Telescope **不再自动从各自的 migrations 目录加载数据库迁移**。因此，你应当运行以下命令，把它们的数据库迁移发布到你的应用中：

```bash
php artisan vendor:publish --tag=cashier-migrations
php artisan vendor:publish --tag=passport-migrations
php artisan vendor:publish --tag=sanctum-migrations
php artisan vendor:publish --tag=spark-migrations
php artisan vendor:publish --tag=telescope-migrations
```

此外，你应当查阅这些包各自的升级指南，以确保你了解任何额外的破坏性变更：

- [Laravel Cashier Stripe](#cashier-stripe)
- [Laravel Passport](#passport)
- [Laravel Sanctum](#sanctum)
- [Laravel Spark Stripe](#spark-stripe)
- [Laravel Telescope](#telescope)

如果你手动安装了 Laravel 安装器，应当通过 Composer 更新该安装器：

```bash
composer global require laravel/installer:^5.6
```

最后，如果你此前向应用添加过 `doctrine/dbal` Composer 依赖，可以把它移除，因为 Laravel 已不再依赖这个包。

<a name="application-structure"></a>
### 应用结构

Laravel 11 引入了一种全新的默认应用结构，默认文件更少。具体来说，新的 Laravel 应用包含的服务提供者、中间件和配置文件都更少。

不过，我们**不推荐**从 Laravel 10 升级到 Laravel 11 的应用迁移其应用结构，因为 Laravel 11 已经过精心调整，同样支持 Laravel 10 的应用结构。

<a name="authentication"></a>
### 认证

<a name="password-rehashing"></a>
#### 密码重新哈希

**影响可能性：低**

如果自上次哈希以来，你所用哈希算法的"工作因子"已经更新，Laravel 11 会在认证过程中自动重新哈希用户的密码。

通常情况下，这不会干扰你的应用；不过，如果你的 `User` 模型的"password"字段名称不是 `password`，就应当通过模型的 `authPasswordName` 属性指定该字段名称：

```php
protected $authPasswordName = 'custom_password_field';
```

或者，你可以通过在应用 `config/hashing.php` 配置文件中添加 `rehash_on_login` 选项来禁用密码重新哈希：

```php
'rehash_on_login' => false,
```

<a name="the-user-provider-contract"></a>
#### `UserProvider` 契约

**影响可能性：低**

`Illuminate\Contracts\Auth\UserProvider` 契约新增了 `rehashPasswordIfRequired` 方法。当应用的哈希算法工作因子发生变化时，该方法负责重新哈希用户密码并将其存储到存储层。

如果你的应用或包定义了实现该接口的类，应当把新的 `rehashPasswordIfRequired` 方法添加到你的实现中。参考实现可以在 `Illuminate\Auth\EloquentUserProvider` 类中查到：

```php
public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
```

<a name="the-authenticatable-contract"></a>
#### `Authenticatable` 契约

**影响可能性：低**

`Illuminate\Contracts\Auth\Authenticatable` 契约新增了 `getAuthPasswordName` 方法。该方法负责返回你的可认证实体的密码列名称。

如果你的应用或包定义了实现该接口的类，应当把新的 `getAuthPasswordName` 方法添加到你的实现中：

```php
public function getAuthPasswordName()
{
    return 'password';
}
```

Laravel 自带的默认 `User` 模型会自动获得该方法，因为该方法已包含在 `Illuminate\Auth\Authenticatable` Trait 中。

<a name="the-authentication-exception-class"></a>
#### `AuthenticationException` 类

**影响可能性：极低**

`Illuminate\Auth\AuthenticationException` 类的 `redirectTo` 方法现在要求把一个 `Illuminate\Http\Request` 实例作为第一个参数。如果你在手动捕获该异常并调用 `redirectTo` 方法，应当相应地更新代码：

```php
if ($e instanceof AuthenticationException) {
    $path = $e->redirectTo($request);
}
```

<a name="email-verification-notification-on-registration"></a>
#### 注册时的邮箱验证通知

**影响可能性：极低**

如果应用的 `EventServiceProvider` 尚未注册 `SendEmailVerificationNotification` 监听器，那么它现在会自动为 `Registered` 事件注册该监听器。如果你的应用 `EventServiceProvider` 没有注册该监听器，而你又不想让 Laravel 自动为你注册它，就应当在应用的 `EventServiceProvider` 中定义一个空的 `configureEmailVerification` 方法：

```php
protected function configureEmailVerification()
{
    // ...
}
```

<a name="cache"></a>
### 缓存

<a name="cache-key-prefixes"></a>
#### 缓存键前缀

**影响可能性：极低**

此前，如果为 DynamoDB、Memcached 或 Redis 缓存存储定义了缓存键前缀，Laravel 会在前缀后面追加一个 `:`。在 Laravel 11 中，缓存键前缀不再带 `:` 后缀。如果你希望保持原有的前缀行为，可以手动为缓存键前缀添加 `:` 后缀。

<a name="collections"></a>
### 集合

<a name="the-enumerable-contract"></a>
#### `Enumerable` 契约

**影响可能性：低**

`Illuminate\Support\Enumerable` 契约的 `dump` 方法已更新为接受可变参数 `...$args`。如果你正在实现该接口，应当相应地更新你的实现：

```php
public function dump(...$args);
```

<a name="database"></a>
### 数据库

<a name="sqlite-minimum-version"></a>
#### SQLite 3.26.0+

**影响可能性：高**

如果你的应用使用 SQLite 数据库，则需要 SQLite 3.26.0 或更高版本。

<a name="eloquent-model-casts-method"></a>
#### Eloquent 模型的 `casts` 方法

**影响可能性：低**

基础的 Eloquent 模型类现在定义了 `casts` 方法，以支持定义属性类型转换。如果你的应用中某个模型定义了 `casts` 关联，它可能会与现在基础 Eloquent 模型类上存在的 `casts` 方法产生冲突。

<a name="modifying-columns"></a>
#### 修改列

**影响可能性：高**

修改某一列时，你现在必须显式包含所有希望在列定义变更后保留的修饰符。任何缺失的属性都会被丢弃。例如，要保留 `unsigned`、`default` 和 `comment` 属性，你必须在修改该列时显式调用每个修饰符，即使这些属性此前已由某个数据库迁移赋给该列。

举个例子，假设你有一个数据库迁移，创建了一个带 `unsigned`、`default` 和 `comment` 属性的 `votes` 列：

```php
Schema::create('users', function (Blueprint $table) {
    $table->integer('votes')->unsigned()->default(1)->comment('The vote count');
});
```

之后，你编写了一个数据库迁移，把该列改为同时可为空：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')->nullable()->change();
});
```

在 Laravel 10 中，该数据库迁移会保留列上的 `unsigned`、`default` 和 `comment` 属性。然而在 Laravel 11 中，该数据库迁移现在还必须包含此前定义在该列上的所有属性。否则，它们会被丢弃：

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('votes')
        ->unsigned()
        ->default(1)
        ->comment('The vote count')
        ->nullable()
        ->change();
});
```

`change` 方法不会修改该列的索引。因此，你可以在修改列时使用索引修饰符显式添加或删除索引：

```php
// Add an index...
$table->bigIncrements('id')->primary()->change();

// Drop an index...
$table->char('postal_code', 10)->unique(false)->change();
```

如果你不想更新应用中所有已有的 "change" 数据库迁移以保留列的现有属性，可以直接[压缩你的数据库迁移](/docs/{{version}}/migrations#squashing-migrations)：

```bash
php artisan schema:dump
```

数据库迁移被压缩之后，Laravel 会在运行任何待处理的数据库迁移之前，先使用你应用的 schema 文件来"迁移"数据库。

<a name="floating-point-types"></a>
#### 浮点类型

**影响可能性：高**

`double` 和 `float` 迁移列类型已经重写，以便在所有数据库上保持一致。

`double` 列类型现在会创建一个不带总位数和小数位（小数点后的位数）的 `DOUBLE` 等价列，这也是标准 SQL 语法。因此，你可以移除 `$total` 和 `$places` 参数：

```php
$table->double('amount');
```

`float` 列类型现在会创建一个不带总位数和小数位（小数点后的位数）的 `FLOAT` 等价列，但可以选择通过 `$precision` 指定存储大小为 4 字节单精度列或 8 字节双精度列。因此，你可以移除 `$total` 和 `$places` 参数，并根据你的数据库文档把可选的 `$precision` 指定为你期望的值：

```php
$table->float('amount', precision: 53);
```

`unsignedDecimal`、`unsignedDouble` 和 `unsignedFloat` 方法已被移除，因为 MySQL 已弃用这些列类型的 unsigned 修饰符，而其他数据库系统也从未对其进行标准化。不过，如果你希望继续对这些列类型使用已弃用的 unsigned 属性，可以在该列的定义上链式调用 `unsigned` 方法：

```php
$table->decimal('amount', total: 8, places: 2)->unsigned();
$table->double('amount')->unsigned();
$table->float('amount', precision: 53)->unsigned();
```

<a name="dedicated-mariadb-driver"></a>
#### 专用 MariaDB 驱动

**影响可能性：极低**

Laravel 11 新增了一个专用于 MariaDB 的数据库驱动，连接 MariaDB 数据库时不再总是使用 MySQL 驱动。

如果你的应用连接到 MariaDB 数据库，可以把连接配置更新为新的 `mariadb` 驱动，以便将来受益于 MariaDB 特有的功能：

```php
'driver' => 'mariadb',
'url' => env('DB_URL'),
'host' => env('DB_HOST', '127.0.0.1'),
'port' => env('DB_PORT', '3306'),
// ...
```

目前，新的 MariaDB 驱动与当前的 MySQL 驱动行为一致，只有一点例外：`uuid` schema 构建器方法会创建原生 UUID 列，而不是 `char(36)` 列。

如果你现有的数据库迁移使用了 `uuid` schema 构建器方法，而你又选择使用新的 `mariadb` 数据库驱动，就应当把数据库迁移中对 `uuid` 方法的调用改为 `char`，以避免破坏性变更或意外行为：

```php
Schema::table('users', function (Blueprint $table) {
    $table->char('uuid', 36);

    // ...
});
```

<a name="spatial-types"></a>
#### 空间类型

**影响可能性：低**

数据库迁移的空间列类型已经重写，以便在所有数据库上保持一致。因此，你可以从数据库迁移中移除 `point`、`lineString`、`polygon`、`geometryCollection`、`multiPoint`、`multiLineString`、`multiPolygon` 和 `multiPolygonZ` 方法，改用 `geometry` 或 `geography` 方法：

```php
$table->geometry('shapes');
$table->geography('coordinates');
```

若要在 MySQL、MariaDB 和 PostgreSQL 上显式限制列中所存值的类型或空间参考系统标识符，可以把 `subtype` 和 `srid` 传给该方法：

```php
$table->geometry('dimension', subtype: 'polygon', srid: 0);
$table->geography('latitude', subtype: 'point', srid: 4326);
```

相应地，PostgreSQL 语法中的 `isGeometry` 和 `projection` 列修饰符也已被移除。

<a name="doctrine-dbal-removal"></a>
#### 移除 Doctrine DBAL

**影响可能性：低**

下面这些与 Doctrine DBAL 相关的类和方法已被移除。Laravel 已不再依赖这个包，注册自定义 Doctrine 类型也不再是正确创建和修改各种列类型（这些类型此前需要自定义类型）的必要条件：

<div class="content-list" markdown="1">

- `Illuminate\Database\Schema\Builder::$alwaysUsesNativeSchemaOperationsIfPossible` 类属性
- `Illuminate\Database\Schema\Builder::useNativeSchemaOperationsIfPossible()` 方法
- `Illuminate\Database\Connection::usingNativeSchemaOperations()` 方法
- `Illuminate\Database\Connection::isDoctrineAvailable()` 方法
- `Illuminate\Database\Connection::getDoctrineConnection()` 方法
- `Illuminate\Database\Connection::getDoctrineSchemaManager()` 方法
- `Illuminate\Database\Connection::getDoctrineColumn()` 方法
- `Illuminate\Database\Connection::registerDoctrineType()` 方法
- `Illuminate\Database\DatabaseManager::registerDoctrineType()` 方法
- `Illuminate\Database\PDO` 目录
- `Illuminate\Database\DBAL\TimestampType` 类
- `Illuminate\Database\Schema\Grammars\ChangeColumn` 类
- `Illuminate\Database\Schema\Grammars\RenameColumn` 类
- `Illuminate\Database\Schema\Grammars\Grammar::getDoctrineTableDiff()` 方法

</div>

此外，通过应用 `database` 配置文件中的 `dbal.types` 注册自定义 Doctrine 类型也就不再是必需的了。

如果你此前使用 Doctrine DBAL 来检查数据库及其关联表，可以改用 Laravel 新的原生 schema 方法（`Schema::getTables()`、`Schema::getColumns()`、`Schema::getIndexes()`、`Schema::getForeignKeys()` 等）。

<a name="deprecated-schema-methods"></a>
#### 已弃用的 schema 方法

**影响可能性：极低**

已弃用的、基于 Doctrine 的 `Schema::getAllTables()`、`Schema::getAllViews()` 和 `Schema::getAllTypes()` 方法已被移除，取而代之的是新的 Laravel 原生 `Schema::getTables()`、`Schema::getViews()` 和 `Schema::getTypes()` 方法。

在使用 PostgreSQL 和 SQL Server 时，新的 schema 方法都不会接受三段式引用（例如 `database.schema.table`）。因此，你应当改用 `connection()` 来声明数据库：

```php
Schema::connection('database')->hasTable('schema.table');
```

<a name="get-column-types"></a>
#### Schema 构建器 `getColumnType()` 方法

**影响可能性：极低**

`Schema::getColumnType()` 方法现在始终返回给定列的实际类型，而不是 Doctrine DBAL 的等价类型。

<a name="database-connection-interface"></a>
#### 数据库连接接口

**影响可能性：极低**

`Illuminate\Database\ConnectionInterface` 接口新增了 `scalar` 方法。如果你在定义自己对该接口的实现，应当把 `scalar` 方法添加到你的实现中：

```php
public function scalar($query, $bindings = [], $useReadPdo = true);
```

<a name="dates"></a>
### 日期

<a name="carbon-3"></a>
#### Carbon 3

**影响可能性：中**

Laravel 11 同时支持 Carbon 2 和 Carbon 3。Carbon 是 Laravel 及整个生态中各类包广泛使用的日期处理库。如果你升级到 Carbon 3，请注意 `diffIn*` 方法现在返回浮点数，并且可能返回负值来表示时间方向，这与 Carbon 2 相比是一项重大变更。有关如何处理这些变更及其他变更的详细信息，请查阅 Carbon 的[变更日志](https://github.com/briannesbitt/Carbon/releases/tag/3.0.0)和[文档](https://carbon.nesbot.com/guide/getting-started/migration.html)。

<a name="mail"></a>
### 邮件

<a name="the-mailer-contract"></a>
#### `Mailer` 契约

**影响可能性：极低**

`Illuminate\Contracts\Mail\Mailer` 契约新增了 `sendNow` 方法。如果你的应用或包手动实现了该契约，应当把新的 `sendNow` 方法添加到你的实现中：

```php
public function sendNow($mailable, array $data = [], $callback = null);
```

<a name="packages"></a>
### 包

<a name="publishing-service-providers"></a>
#### 把服务提供者发布到应用

**影响可能性：极低**

如果你编写了一个 Laravel 包，它会把服务提供者手动发布到应用的 `app/Providers` 目录，并手动修改应用的 `config/app.php` 配置文件来注册该服务提供者，那么你就应当更新你的包，改用新的 `ServiceProvider::addProviderToBootstrapFile` 方法。

由于在新的 Laravel 11 应用中 `config/app.php` 配置文件里已不存在 `providers` 数组，`addProviderToBootstrapFile` 方法会自动把你已发布的服务提供者添加到应用的 `bootstrap/providers.php` 文件中。

```php
use Illuminate\Support\ServiceProvider;

ServiceProvider::addProviderToBootstrapFile(Provider::class);
```

<a name="queues"></a>
### 队列

<a name="the-batch-repository-interface"></a>
#### `BatchRepository` 接口

**影响可能性：极低**

`Illuminate\Bus\BatchRepository` 接口新增了 `rollBack` 方法。如果你在自己的包或应用中实现了该接口，应当把这个方法添加到你的实现中：

```php
public function rollBack();
```

<a name="synchronous-jobs-in-database-transactions"></a>
#### 数据库事务中的同步任务

**影响可能性：极低**

此前，同步任务（使用 `sync` 队列驱动的任务）会立即执行，无论队列连接的 `after_commit` 配置项是否被设为 `true`，也无论是否在任务上调用了 `afterCommit` 方法。

在 Laravel 11 中，同步队列任务现在会遵循队列连接或任务的"提交后执行"配置。

<a name="rate-limiting"></a>
### 限流

<a name="per-second-rate-limiting"></a>
#### 按秒限流

**影响可能性：中**

Laravel 11 支持按秒限流，不再局限于按分钟的粒度。与这一变更相关的潜在破坏性变更有不少，你应当了解它们。

`GlobalLimit` 类的构造函数现在接受秒数而不是分钟数。该类没有文档说明，你的应用通常也不会使用它：

```php
new GlobalLimit($attempts, 2 * 60);
```

`Limit` 类的构造函数现在接受秒数而不是分钟数。该类所有有文档说明的用法都仅限于 `Limit::perMinute` 和 `Limit::perSecond` 这样的静态构造方法。不过，如果你在手动实例化该类，就应当更新应用，为类的构造函数提供秒数：

```php
new Limit($key, $attempts, 2 * 60);
```

`Limit` 类的 `decayMinutes` 属性已重命名为 `decaySeconds`，并且现在包含秒数而不是分钟数。

`Illuminate\Queue\Middleware\ThrottlesExceptions` 和 `Illuminate\Queue\Middleware\ThrottlesExceptionsWithRedis` 类的构造函数现在接受秒数而不是分钟数：

```php
new ThrottlesExceptions($attempts, 2 * 60);
new ThrottlesExceptionsWithRedis($attempts, 2 * 60);
```

<a name="cashier-stripe"></a>
### Cashier Stripe

<a name="updating-cashier-stripe"></a>
#### 更新 Cashier Stripe

**影响可能性：高**

Laravel 11 不再支持 Cashier Stripe 14.x。因此，你应当在 `composer.json` 文件中把应用的 Laravel Cashier Stripe 依赖更新为 `^15.0`。

Cashier Stripe 15.0 不再自动从其自身的 migrations 目录加载数据库迁移。相反，你应当运行以下命令，把 Cashier Stripe 的数据库迁移发布到你的应用中：

```shell
php artisan vendor:publish --tag=cashier-migrations
```

有关额外的破坏性变更，请查阅完整的 [Cashier Stripe 升级指南](https://github.com/laravel/cashier-stripe/blob/15.x/UPGRADE.md)。

<a name="spark-stripe"></a>
### Spark（Stripe）

<a name="updating-spark-stripe"></a>
#### 更新 Spark Stripe

**影响可能性：高**

Laravel 11 不再支持 Laravel Spark Stripe 4.x。因此，你应当在 `composer.json` 文件中把应用的 Laravel Spark Stripe 依赖更新为 `^5.0`。

Spark Stripe 5.0 不再自动从其自身的 migrations 目录加载数据库迁移。相反，你应当运行以下命令，把 Spark Stripe 的数据库迁移发布到你的应用中：

```shell
php artisan vendor:publish --tag=spark-migrations
```

有关额外的破坏性变更，请查阅完整的 [Spark Stripe 升级指南](https://spark.laravel.com/docs/spark-stripe/upgrade.html)。

<a name="passport"></a>
### Passport

<a name="updating-telescope"></a>
#### 更新 Passport

**影响可能性：高**

Laravel 11 不再支持 Laravel Passport 11.x。因此，你应当在 `composer.json` 文件中把应用的 Laravel Passport 依赖更新为 `^12.0`。

Passport 12.0 不再自动从其自身的 migrations 目录加载数据库迁移。相反，你应当运行以下命令，把 Passport 的数据库迁移发布到你的应用中：

```shell
php artisan vendor:publish --tag=passport-migrations
```

此外，密码授权类型默认被禁用。你可以在应用 `AppServiceProvider` 的 `boot` 方法中调用 `enablePasswordGrant` 方法来启用它：

```php
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

<a name="sanctum"></a>
### Sanctum

<a name="updating-sanctum"></a>
#### 更新 Sanctum

**影响可能性：高**

Laravel 11 不再支持 Laravel Sanctum 3.x。因此，你应当在 `composer.json` 文件中把应用的 Laravel Sanctum 依赖更新为 `^4.0`。

Sanctum 4.0 不再自动从其自身的 migrations 目录加载数据库迁移。相反，你应当运行以下命令，把 Sanctum 的数据库迁移发布到你的应用中：

```shell
php artisan vendor:publish --tag=sanctum-migrations
```

然后，在应用 `config/sanctum.php` 配置文件中，你应当把对 `authenticate_session`、`encrypt_cookies` 和 `validate_csrf_token` 中间件的引用更新为如下内容：

```php
'middleware' => [
    'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
    'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
],
```

<a name="telescope"></a>
### Telescope

<a name="updating-telescope"></a>
#### 更新 Telescope

**影响可能性：高**

Laravel 11 不再支持 Laravel Telescope 4.x。因此，你应当在 `composer.json` 文件中把应用的 Laravel Telescope 依赖更新为 `^5.0`。

Telescope 5.0 不再自动从其自身的 migrations 目录加载数据库迁移。相反，你应当运行以下命令，把 Telescope 的数据库迁移发布到你的应用中：

```shell
php artisan vendor:publish --tag=telescope-migrations
```

<a name="spatie-once-package"></a>
### Spatie Once 包

**影响可能性：中**

Laravel 11 现在自带 [`once` 函数](/docs/{{version}}/helpers#method-once)，用于确保给定的闭包只执行一次。因此，如果你的应用依赖 `spatie/once` 包，就应当把它从应用的 `composer.json` 文件中移除，以避免冲突。

<a name="miscellaneous"></a>
### 其他

我们也建议你查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel)中的变更。虽然其中许多变更并非必需，但你可能希望让这些文件与你的应用保持同步。其中一些变更会在本升级指南中介绍，而另一些（例如对配置文件或注释的变更）则不会。你可以用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/10.x...11.x)轻松查看这些变更，并挑选出对你重要的更新。
