# 升级指南

- [从 11.x 升级到 12.0](#upgrade-12.0)

<a name="high-impact-changes"></a>
## 高影响变更

- [更新依赖](#updating-dependencies)
- [更新 Laravel 安装器](#updating-the-laravel-installer)

<a name="medium-impact-changes"></a>
## 中等影响变更

- [模型与 UUIDv7](#models-and-uuidv7)

<a name="low-impact-changes"></a>
## 低影响变更

- [Carbon 3](#carbon-3)
- [并发结果索引映射](#concurrency-result-index-mapping)
- [容器类依赖解析](#container-class-dependency-resolution)
- [图像验证不再包含 SVG](#image-validation)
- [本地文件系统磁盘默认根路径](#local-filesystem-disk-default-root-path)
- [多 Schema 数据库检查](#multi-schema-database-inspecting)
- [嵌套数组请求合并](#nested-array-request-merging)

<a name="upgrade-12.0"></a>
## 从 11.x 升级到 12.0

#### 预计升级耗时：5 分钟

> [!NOTE]
> 我们尽力记录所有可能的破坏性变更。其中一些破坏性变更位于框架较冷门的部分，因此实际上只有一部分变更会影响你的应用。想节省时间？你可以使用 [Laravel Shift](https://laravelshift.com/) 来帮助自动化应用升级。

<a name="updating-dependencies"></a>
### 更新依赖

**影响可能性：高**

你应当更新应用 `composer.json` 文件中的以下依赖：

- `laravel/framework` 到 `^12.0`
- `phpunit/phpunit` 到 `^11.0`
- `pestphp/pest` 到 `^3.0`

<a name="carbon-3"></a>
#### Carbon 3

**影响可能性：低**

已移除对 Carbon 2.x 的支持。所有 Laravel 12 应用现在都要求使用 [Carbon 3.x](https://carbon.nesbot.com/guide/getting-started/migration.html)。

<a name="updating-the-laravel-installer"></a>
### 更新 Laravel 安装器

如果你使用 Laravel 安装器 CLI 工具来创建新的 Laravel 应用，应当更新你的安装器，使其兼容 Laravel 12.x 和[新版 Laravel 入门套件](https://laravel.com/starter-kits)。如果你是通过 `composer global require` 安装的 Laravel 安装器，可以使用 `composer global update` 来更新它：

```shell
composer global update laravel/installer
```

如果你最初是通过 `php.new` 安装的 PHP 和 Laravel，只需重新运行适用于你操作系统的 `php.new` 安装命令，即可安装最新版本的 PHP 和 Laravel 安装器：

```shell tab=macOS
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.4)"
```

```shell tab=Windows PowerShell
# 以管理员身份运行...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

```shell tab=Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.4)"
```

或者，如果你使用的是 [Laravel Herd](https://herd.laravel.com) 自带的 Laravel 安装器副本，应当将你的 Herd 更新到最新版本。

<a name="authentication"></a>
### 认证

<a name="updated-databasetokenrepository-constructor-signature"></a>
#### `DatabaseTokenRepository` 构造函数签名更新

**影响可能性：极低**

`Illuminate\Auth\Passwords\DatabaseTokenRepository` 类的构造函数现在要求 `$expires` 参数以秒为单位，而非分钟。

<a name="concurrency"></a>
### 并发

<a name="concurrency-result-index-mapping"></a>
#### 并发结果索引映射

**影响可能性：低**

使用关联数组调用 `Concurrency::run` 方法时，并发操作的结果现在会携带其关联的键返回：

```php
$result = Concurrency::run([
    'task-1' => fn () => 1 + 1,
    'task-2' => fn () => 2 + 2,
]);

// ['task-1' => 2, 'task-2' => 4]
```

<a name="container"></a>
### 容器

<a name="container-class-dependency-resolution"></a>
#### 容器类依赖解析

**影响可能性：低**

依赖注入容器在解析类实例时，现在会遵循类属性的默认值。如果你此前依赖容器解析类实例而不使用默认值，可能需要调整你的应用以适应这一新行为：

```php
class Example
{
    public function __construct(public ?Carbon $date = null) {}
}

$example = resolve(Example::class);

// <= 11.x
$example->date instanceof Carbon;

// >= 12.x
$example->date === null;
```

<a name="database"></a>
### 数据库

<a name="multi-schema-database-inspecting"></a>
#### 多 Schema 数据库检查

**影响可能性：低**

`Schema::getTables()`、`Schema::getViews()` 和 `Schema::getTypes()` 方法现在默认包含所有 schema 的结果。你可以传递 `schema` 参数来仅获取给定 schema 的结果：

```php
// 所有 schema 上的所有表...
$tables = Schema::getTables();

// 'main' schema 上的所有表...
$tables = Schema::getTables(schema: 'main');

// 'main' 和 'blog' schema 上的所有表...
$tables = Schema::getTables(schema: ['main', 'blog']);
```

`Schema::getTableListing()` 方法现在默认返回带 schema 前缀的表名。你可以传递 `schemaQualified` 参数来按需改变这一行为：

```php
$tables = Schema::getTableListing();
// ['main.migrations', 'main.users', 'blog.posts']

$tables = Schema::getTableListing(schema: 'main');
// ['main.migrations', 'main.users']

$tables = Schema::getTableListing(schema: 'main', schemaQualified: false);
// ['migrations', 'users']
```

`db:table` 和 `db:show` 命令现在在 MySQL、MariaDB 和 SQLite 上也会输出所有 schema 的结果，与 PostgreSQL 和 SQL Server 保持一致。

<a name="database-constructor-signature-changes"></a>
#### 数据库构造函数签名变更

**影响可能性：极低**

在 Laravel 12 中，若干底层数据库类现在要求通过其构造函数提供 `Illuminate\Database\Connection` 实例。

**这些变更主要适用于数据库软件包维护者——这些变更几乎不可能影响正常的应用开发。**

`Illuminate\Database\Schema\Blueprint`

`Illuminate\Database\Schema\Blueprint` 类的构造函数现在要求第一个参数为 `Connection` 实例。这主要影响手动实例化 `Blueprint` 实例的应用或软件包。

`Illuminate\Database\Grammar`

`Illuminate\Database\Grammar` 类的构造函数现在同样要求提供 `Connection` 实例。在以前的版本中，连接是在构造之后通过 `setConnection()` 方法赋值的。该方法在 Laravel 12 中已被移除：

```php
// Laravel <= 11.x
$grammar = new MySqlGrammar;
$grammar->setConnection($connection);

// Laravel >= 12.x
$grammar = new MySqlGrammar($connection);
````

此外，以下 API 已被移除或弃用：

- `Blueprint::getPrefix()` 方法已弃用。
- `Connection::withTablePrefix()` 方法已移除。
- `Grammar::getTablePrefix()` 和 `setTablePrefix()` 方法已弃用。
- `Grammar::setConnection()` 方法已移除。

在使用表前缀时，你现在应当直接从数据库连接中获取它们：

```php
$prefix = $connection->getTablePrefix();
```

如果你维护自定义的数据库驱动、schema 构建器或语法（grammar）实现，应当检查它们的构造函数，并确保提供了 `Connection` 实例。

<a name="eloquent"></a>
### Eloquent

<a name="models-and-uuidv7"></a>
#### 模型与 UUIDv7

**影响可能性：中**

`HasUuids` Trait 现在返回与 UUID 规范版本 7（有序 UUID）兼容的 UUID。如果你想继续为模型 ID 使用有序的 UUIDv4 字符串，现在应当使用 `HasVersion4Uuids` Trait：

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids; // [tl! remove]
use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids as HasUuids; // [tl! add]
```

`HasVersion7Uuids` Trait 已被移除。如果你此前使用的是这个 Trait，应当改用 `HasUuids` Trait，它现在提供相同的行为。

<a name="requests"></a>
### 请求

<a name="nested-array-request-merging"></a>
#### 嵌套数组请求合并

**影响可能性：低**

`$request->mergeIfMissing()` 方法现在允许使用「点」记法合并嵌套数组数据。如果你此前依赖该方法创建包含「点」记法形式键名的顶级数组键，可能需要调整你的应用以适应这一新行为：

```php
$request->mergeIfMissing([
    'user.last_name' => 'Otwell',
]);
```

<a name="routing"></a>
### 路由

<a name="route-precedence"></a>
#### 路由优先级

**影响可能性：低**

当多个路由拥有相同名称时，缓存与未缓存路由在这方面的行为已统一。也就是说，未缓存路由现在会匹配第一个以给定名称注册的路由，而非最后一个。

<a name="storage"></a>
### 存储

<a name="local-filesystem-disk-default-root-path"></a>
#### 本地文件系统磁盘默认根路径

**影响可能性：低**

如果你的应用没有在文件系统配置中显式定义 `local` 磁盘，Laravel 现在会将本地磁盘的根目录默认为 `storage/app/private`。在以前的版本中，该默认值为 `storage/app`。因此，除非另行配置，对 `Storage::disk('local')` 的调用将读写 `storage/app/private`。要恢复以前的行为，你可以手动定义 `local` 磁盘并设置所需的根路径。

<a name="validation"></a>
### 验证

<a name="image-validation"></a>
#### 图像验证不再包含 SVG

**影响可能性：低**

`image` 验证规则默认不再允许 SVG 图像。如果你想在使用 `image` 规则时允许 SVG，必须显式允许它们：

```php
use Illuminate\Validation\Rules\File;

'photo' => 'required|image:allow_svg'

// 或者...
'photo' => ['required', File::image(allowSvg: true)],
```

<a name="miscellaneous"></a>
### 杂项

我们也鼓励你查看 `laravel/laravel` [GitHub 仓库](https://github.com/laravel/laravel)中的变更。虽然其中许多变更并非必需，但你可能希望让这些文件与你的应用保持同步。本升级指南会涵盖其中一些变更，但其他变更（例如配置文件或注释的变更）不会涵盖。你可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/11.x...12.x)轻松查看这些变更，并选择对你重要的更新。
