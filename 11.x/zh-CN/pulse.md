# Laravel Pulse

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
- [仪表盘](#dashboard)
    - [授权](#dashboard-authorization)
    - [定制](#dashboard-customization)
    - [解析用户](#dashboard-resolving-users)
    - [卡片](#dashboard-cards)
- [捕获条目](#capturing-entries)
    - [记录器](#recorders)
    - [过滤](#filtering)
- [性能](#performance)
    - [使用其它数据库](#using-a-different-database)
    - [Redis 摄取](#ingest)
    - [采样](#sampling)
    - [修剪](#trimming)
    - [处理 Pulse 异常](#pulse-exceptions)
- [自定义卡片](#custom-cards)
    - [卡片组件](#custom-card-components)
    - [样式](#custom-card-styling)
    - [数据捕获与聚合](#custom-card-data)

<a name="introduction"></a>
## 简介

[Laravel Pulse](https://github.com/laravel/pulse) 让你一眼就能洞察应用的性能和使用情况。借助 Pulse，你可以追踪慢作业、慢接口等瓶颈，找出最活跃的用户，等等。

如需对单个事件进行深入调试，请查看 [Laravel Telescope](/docs/{{version}}/telescope)。

<a name="installation"></a>
## 安装

> [!WARNING]
> Pulse 的第一方存储实现目前需要 MySQL、MariaDB 或 PostgreSQL 数据库。如果你使用的是其它数据库引擎，就需要为 Pulse 数据单独准备一个 MySQL、MariaDB 或 PostgreSQL 数据库。

你可以使用 Composer 包管理器安装 Pulse：

```sh
composer require laravel/pulse
```

接下来，你应当使用 `vendor:publish` Artisan 命令发布 Pulse 的配置文件和数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

最后，你应当运行 `migrate` 命令，创建存储 Pulse 数据所需的表：

```shell
php artisan migrate
```

Pulse 的数据库迁移运行完成后，你就可以通过 `/pulse` 路由访问 Pulse 仪表盘。

> [!NOTE]
> 如果你不想把 Pulse 数据存放在应用的主数据库中，可以[指定一个专用的数据库连接](#using-a-different-database)。

<a name="configuration"></a>
### 配置

Pulse 的许多配置选项都可以通过环境变量控制。要查看可用选项、注册新的记录器或配置高级选项，你可以发布 `config/pulse.php` 配置文件：

```sh
php artisan vendor:publish --tag=pulse-config
```

<a name="dashboard"></a>
## 仪表盘

<a name="dashboard-authorization"></a>
### 授权

Pulse 仪表盘可以通过 `/pulse` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘，因此需要通过自定义 `'viewPulse'` 授权门控为生产环境配置授权。你可以在应用的 `app/Providers/AppServiceProvider.php` 文件中完成这一配置：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::define('viewPulse', function (User $user) {
        return $user->isAdmin();
    });

    // ...
}
```

<a name="dashboard-customization"></a>
### 定制

通过发布仪表盘视图，可以配置 Pulse 仪表盘的卡片和布局。仪表盘视图会被发布到 `resources/views/vendor/pulse/dashboard.blade.php`：

```sh
php artisan vendor:publish --tag=pulse-dashboard
```

仪表盘由 [Livewire](https://livewire.laravel.com/) 驱动，让你无需重新构建任何 JavaScript 资源即可定制卡片和布局。

在该文件中，`<x-pulse>` 组件负责渲染仪表盘，并为卡片提供网格布局。如果希望仪表盘占满屏幕宽度，可以向组件传入 `full-width` 属性：

```blade
<x-pulse full-width>
    ...
</x-pulse>
```

默认情况下，`<x-pulse>` 组件会创建 12 列网格，但你可以通过 `cols` 属性进行定制：

```blade
<x-pulse cols="16">
    ...
</x-pulse>
```

每个卡片都接受 `cols` 和 `rows` 属性，用于控制空间和位置：

```blade
<livewire:pulse.usage cols="4" rows="2" />
```

大多数卡片还接受 `expand` 属性，用于展示完整卡片而不是滚动查看：

```blade
<livewire:pulse.slow-queries expand />
```

<a name="dashboard-resolving-users"></a>
### 解析用户

对于展示用户信息的卡片（例如「应用使用情况」卡片），Pulse 只会记录用户 ID。渲染仪表盘时，Pulse 会从你默认的 `Authenticatable` 模型中解析出 `name` 和 `email` 字段，并使用 Gravatar 网络服务显示头像。

你可以在应用的 `App\Providers\AppServiceProvider` 类中调用 `Pulse::user` 方法来自定义字段和头像。

`user` 方法接受一个闭包，该闭包会接收待展示的 `Authenticatable` 模型，并应返回一个包含该用户 `name`、`extra` 和 `avatar` 信息的数组：

```php
use Laravel\Pulse\Facades\Pulse;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Pulse::user(fn ($user) => [
        'name' => $user->name,
        'extra' => $user->email,
        'avatar' => $user->avatar_url,
    ]);

    // ...
}
```

> [!NOTE]
> 你可以实现 `Laravel\Pulse\Contracts\ResolvesUsers` 契约并把它绑定到 Laravel 的[服务容器](/docs/{{version}}/container#binding-a-singleton)，从而完全定制已认证用户的捕获与解析方式。

<a name="dashboard-cards"></a>
### 卡片

<a name="servers-card"></a>
#### 服务器

`<livewire:pulse.servers />` 卡片展示所有运行 `pulse:check` 命令的服务器的系统资源使用情况。关于系统资源上报的更多信息，请参阅[服务器记录器](#servers-recorder)的相关文档。

如果你替换了基础设施中的某台服务器，可能希望在给定时间之后不再于 Pulse 仪表盘中显示这台已停用的服务器。为此可以使用 `ignore-after` 属性，它接受一个秒数，表示在该秒数之后把已停用的服务器从 Pulse 仪表盘中移除。你也可以提供一个相对时间格式的字符串，例如 `1 hour` 或 `3 days and 1 hour`：

```blade
<livewire:pulse.servers ignore-after="3 hours" />
```

<a name="application-usage-card"></a>
#### 应用使用情况

`<livewire:pulse.usage />` 卡片展示请求你的应用、派发作业以及经历慢请求的前 10 位用户。

如果你希望同时在屏幕上查看全部使用指标，可以多次包含该卡片并指定 `type` 属性：

```blade
<livewire:pulse.usage type="requests" />
<livewire:pulse.usage type="slow_requests" />
<livewire:pulse.usage type="jobs" />
```

如需了解如何定制 Pulse 获取和展示用户信息，请查阅[解析用户](#dashboard-resolving-users)的文档。

> [!NOTE]
> 如果你的应用接收大量请求或派发大量作业，可以考虑启用[采样](#sampling)。更多信息请参阅[用户请求记录器](#user-requests-recorder)、[用户作业记录器](#user-jobs-recorder)和[慢作业记录器](#slow-jobs-recorder)的文档。

<a name="exceptions-card"></a>
#### 异常

`<livewire:pulse.exceptions />` 卡片展示应用中异常发生的频率和最近发生时间。默认情况下，异常按异常类和发生位置进行分组。更多信息请参阅[异常记录器](#exceptions-recorder)的文档。

<a name="queues-card"></a>
#### 队列

`<livewire:pulse.queues />` 卡片展示应用中各队列的吞吐量，包括入队、处理中、已处理、已释放和失败的作业数量。更多信息请参阅[队列记录器](#queues-recorder)的文档。

<a name="slow-requests-card"></a>
#### 慢请求

`<livewire:pulse.slow-requests />` 卡片展示超过所配置阈值的传入应用请求，默认阈值为 1,000ms。更多信息请参阅[慢请求记录器](#slow-requests-recorder)的文档。

<a name="slow-jobs-card"></a>
#### 慢作业

`<livewire:pulse.slow-jobs />` 卡片展示超过所配置阈值的应用入队作业，默认阈值为 1,000ms。更多信息请参阅[慢作业记录器](#slow-jobs-recorder)的文档。

<a name="slow-queries-card"></a>
#### 慢查询

`<livewire:pulse.slow-queries />` 卡片展示超过所配置阈值的应用数据库查询，默认阈值为 1,000ms。

默认情况下，慢查询按 SQL 查询（不含绑定值）和发生位置进行分组；不过，你也可以选择不捕获位置信息，从而只按 SQL 查询分组。

如果你因为超大 SQL 查询被语法高亮处理而遇到渲染性能问题，可以添加 `without-highlighting` 属性来禁用高亮：

```blade
<livewire:pulse.slow-queries without-highlighting />
```

更多信息请参阅[慢查询记录器](#slow-queries-recorder)的文档。

<a name="slow-outgoing-requests-card"></a>
#### 慢的出站请求

`<livewire:pulse.slow-outgoing-requests />` 卡片展示使用 Laravel 的 [HTTP 客户端](/docs/{{version}}/http-client)发出且超过所配置阈值的出站请求，默认阈值为 1,000ms。

默认情况下，条目会按完整 URL 分组。不过，你也可以使用正则表达式规范化或归并相似的出站请求。更多信息请参阅[慢出站请求记录器](#slow-outgoing-requests-recorder)的文档。

<a name="cache-card"></a>
#### 缓存

`<livewire:pulse.cache />` 卡片展示应用的缓存命中与未命中统计，既包括全局数据，也包括各个键的数据。

默认情况下，条目会按键分组。不过，你也可以使用正则表达式规范化或归并相似的键。更多信息请参阅[缓存交互记录器](#cache-interactions-recorder)的文档。

<a name="capturing-entries"></a>
## 捕获条目

大多数 Pulse 记录器会自动依据 Laravel 派发的框架事件捕获条目。不过，[服务器记录器](#servers-recorder)和某些第三方卡片必须定期轮询信息。要使用这些卡片，你必须在每一台应用服务器上运行 `pulse:check` 守护进程：

```php
php artisan pulse:check
```

> [!NOTE]
> 为了让 `pulse:check` 进程在后台永久运行，你应当使用 Supervisor 之类的进程监控工具，确保该命令不会停止运行。

由于 `pulse:check` 命令是长驻进程，如果不重启它就无法感知代码库的变更。你应当在应用部署过程中调用 `pulse:restart` 命令，让该命令平滑重启：

```sh
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)存储重启信号，因此在使用该特性前，请确认已为应用正确配置了缓存驱动。

<a name="recorders"></a>
### 记录器

记录器负责从应用中捕获条目，以便记录到 Pulse 数据库中。记录器在 [Pulse 配置文件](#configuration)的 `recorders` 部分注册和配置。

<a name="cache-interactions-recorder"></a>
#### 缓存交互

`CacheInteractions` 记录器捕获应用中[缓存](/docs/{{version}}/cache)命中与未命中的信息，用于在[缓存](#cache-card)卡片上展示。

你也可以选择调整[采样率](#sampling)和需要忽略的键模式。

你还可以配置键分组，把相似的键归并为单个条目。例如，你可能希望从缓存同类信息的键中移除唯一 ID。分组通过一个正则表达式来「查找并替换」键的某一部分进行配置，配置文件中已包含示例：

```php
Recorders\CacheInteractions::class => [
    // ...
    'groups' => [
        // '/:\d+/' => ':*',
    ],
],
```

会使用第一个匹配成功的模式。如果没有模式匹配，该键将按原样捕获。

<a name="exceptions-recorder"></a>
#### 异常

`Exceptions` 记录器捕获应用中可报告异常的信息，用于在[异常](#exceptions-card)卡片上展示。

你也可以选择调整[采样率](#sampling)和需要忽略的异常模式，还可以配置是否捕获异常来源位置。捕获到的位置会显示在 Pulse 仪表盘上，有助于追踪异常源头；不过，如果同一个异常在多个位置出现，它会针对每个不同的位置分别出现。

<a name="queues-recorder"></a>
#### 队列

`Queues` 记录器捕获应用各队列的信息，用于在[队列](#queues-card)卡片上展示。

你也可以选择调整[采样率](#sampling)和需要忽略的作业模式。

<a name="slow-jobs-recorder"></a>
#### 慢作业

`SlowJobs` 记录器捕获应用中慢作业的信息，用于在[慢作业](#slow-jobs-recorder)卡片上展示。

你也可以选择调整慢作业阈值、[采样率](#sampling)和需要忽略的作业模式。

你可能有一些预期耗时比其它作业更长的作业。这种情况下，可以为每个作业配置各自的阈值：

```php
Recorders\SlowJobs::class => [
    // ...
    'threshold' => [
        '#^App\\Jobs\\GenerateYearlyReports$#' => 5000,
        'default' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到该作业的类名，就会使用 `'default'` 值。

<a name="slow-outgoing-requests-recorder"></a>
#### 慢出站请求

`SlowOutgoingRequests` 记录器捕获使用 Laravel 的 [HTTP 客户端](/docs/{{version}}/http-client)发出且超过所配置阈值的 HTTP 出站请求，用于在[慢出站请求](#slow-outgoing-requests-card)卡片上展示。

你也可以选择调整慢出站请求阈值、[采样率](#sampling)和需要忽略的 URL 模式。

你可能有一些预期耗时比其它请求更长的出站请求。这种情况下，可以为每个请求配置各自的阈值：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'threshold' => [
        '#backup.zip$#' => 5000,
        'default' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到该请求的 URL，就会使用 `'default'` 值。

你还可以配置 URL 分组，把相似的 URL 归并为单个条目。例如，你可能希望从 URL 路径中移除唯一 ID，或者只按域名分组。分组通过一个正则表达式来「查找并替换」URL 的某一部分进行配置，配置文件中已包含一些示例：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'groups' => [
        // '#^https://api\.github\.com/repos/.*$#' => 'api.github.com/repos/*',
        // '#^https?://([^/]*).*$#' => '\1',
        // '#/\d+#' => '/*',
    ],
],
```

会使用第一个匹配成功的模式。如果没有模式匹配，该 URL 将按原样捕获。

<a name="slow-queries-recorder"></a>
#### 慢查询

`SlowQueries` 记录器捕获应用中超过所配置阈值的数据库查询，用于在[慢查询](#slow-queries-card)卡片上展示。

你也可以选择调整慢查询阈值、[采样率](#sampling)和需要忽略的查询模式，还可以配置是否捕获查询位置。捕获到的位置会显示在 Pulse 仪表盘上，有助于追踪查询源头；不过，如果同一条查询在多个位置发出，它会针对每个不同的位置分别出现。

你可能有一些预期耗时比其它查询更长的查询。这种情况下，可以为每条查询配置各自的阈值：

```php
Recorders\SlowQueries::class => [
    // ...
    'threshold' => [
        '#^insert into `yearly_reports`#' => 5000,
        'default' => env('PULSE_SLOW_QUERIES_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到该查询的 SQL，就会使用 `'default'` 值。

<a name="slow-requests-recorder"></a>
#### 慢请求

`Requests` 记录器捕获发往你应用的请求信息，用于在[慢请求](#slow-requests-card)和[应用使用情况](#application-usage-card)卡片上展示。

你也可以选择调整慢路由阈值、[采样率](#sampling)和需要忽略的路径。

你可能有一些预期耗时比其它请求更长的请求。这种情况下，可以为每个请求配置各自的阈值：

```php
Recorders\SlowRequests::class => [
    // ...
    'threshold' => [
        '#^/admin/#' => 5000,
        'default' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到该请求的 URL，就会使用 `'default'` 值。

<a name="servers-recorder"></a>
#### 服务器

`Servers` 记录器捕获为你的应用提供支持的服务器的 CPU、内存和存储使用情况，用于在[服务器](#servers-card)卡片上展示。该记录器要求你希望监控的每台服务器上都运行着 [`pulse:check` 命令](#capturing-entries)。

每台上报的服务器必须有唯一的名称。默认情况下，Pulse 会使用 PHP 的 `gethostname` 函数返回的值。如果你想定制该名称，可以设置 `PULSE_SERVER_NAME` 环境变量：

```env
PULSE_SERVER_NAME=load-balancer
```

Pulse 配置文件还允许你自定义要监控的目录。

<a name="user-jobs-recorder"></a>
#### 用户作业

`UserJobs` 记录器捕获在应用中派发作业的用户信息，用于在[应用使用情况](#application-usage-card)卡片上展示。

你也可以选择调整[采样率](#sampling)和需要忽略的作业模式。

<a name="user-requests-recorder"></a>
#### 用户请求

`UserRequests` 记录器捕获向你的应用发起请求的用户信息，用于在[应用使用情况](#application-usage-card)卡片上展示。

你也可以选择调整[采样率](#sampling)和需要忽略的 URL 模式。

<a name="filtering"></a>
### 过滤

如我们所见，许多[记录器](#recorders)都能通过配置依据条目的值（例如请求的 URL）「忽略」传入的条目。不过，有时依据其它因素过滤掉记录会很有用，比如当前已认证的用户。要过滤掉这些记录，你可以向 Pulse 的 `filter` 方法传入一个闭包。通常，`filter` 方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Entry;
use Laravel\Pulse\Facades\Pulse;
use Laravel\Pulse\Value;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Pulse::filter(function (Entry|Value $entry) {
        return Auth::user()->isNotAdmin();
    });

    // ...
}
```

<a name="performance"></a>
## 性能

Pulse 的设计目标是可直接接入现有应用，无需任何额外基础设施。不过，对于高流量应用，有多种方式可以消除 Pulse 对应用性能可能造成的影响。

<a name="using-a-different-database"></a>
### 使用其它数据库

对于高流量应用，你可能更愿意为 Pulse 使用一个专用的数据库连接，以免影响应用数据库。

你可以通过设置 `PULSE_DB_CONNECTION` 环境变量，定制 Pulse 使用的[数据库连接](/docs/{{version}}/database#configuration)。

```env
PULSE_DB_CONNECTION=pulse
```

<a name="ingest"></a>
### Redis 摄取

> [!WARNING]
> Redis 摄取要求 Redis 6.2 或更高版本，并且应用配置的 Redis 客户端驱动为 `phpredis` 或 `predis`。

默认情况下，Pulse 会在 HTTP 响应发送给客户端之后或作业处理完毕之后，把条目直接存入[已配置的数据库连接](#using-a-different-database)；不过，你也可以使用 Pulse 的 Redis 摄取驱动，把条目发送到 Redis 流。通过配置 `PULSE_INGEST_DRIVER` 环境变量即可启用：

```
PULSE_INGEST_DRIVER=redis
```

Pulse 默认会使用你默认的 [Redis 连接](/docs/{{version}}/redis#configuration)，但你也可以通过 `PULSE_REDIS_CONNECTION` 环境变量进行定制：

```
PULSE_REDIS_CONNECTION=pulse
```

使用 Redis 摄取时，你需要运行 `pulse:work` 命令来监控该流，并把条目从 Redis 移入 Pulse 的数据库表。

```php
php artisan pulse:work
```

> [!NOTE]
> 为了让 `pulse:work` 进程在后台永久运行，你应当使用 Supervisor 之类的进程监控工具，确保 Pulse 工作进程不会停止运行。

由于 `pulse:work` 命令是长驻进程，如果不重启它就无法感知代码库的变更。你应当在应用部署过程中调用 `pulse:restart` 命令，让该命令平滑重启：

```sh
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)存储重启信号，因此在使用该特性前，请确认已为应用正确配置了缓存驱动。

<a name="sampling"></a>
### 采样

默认情况下，Pulse 会捕获应用中发生的每一个相关事件。对于高流量应用而言，这可能导致仪表盘需要聚合数百万条数据库记录，在时间跨度较长时尤为明显。

你可以选择为某些 Pulse 数据记录器启用「采样」。例如，把 [`User Requests`](#user-requests-recorder) 记录器的采样率设为 `0.1`，意味着你只记录大约 10% 的应用请求。在仪表盘中，这些数值会按比例放大，并以 `~` 作为前缀，表示它们是近似值。

一般来说，某项指标的条目越多，你就可以越放心地把采样率设得越低，而不会牺牲太多准确性。

<a name="trimming"></a>
### 修剪

一旦所存储的条目超出仪表盘的时间窗口，Pulse 会自动对其进行修剪。修剪在摄取数据时通过一个抽签系统完成，该系统可以在 Pulse [配置文件](#configuration)中定制。

<a name="pulse-exceptions"></a>
### 处理 Pulse 异常

如果捕获 Pulse 数据时发生异常，例如无法连接到存储数据库，Pulse 会静默失败，以免影响你的应用。

如果你想定制这些异常的处理方式，可以向 `handleExceptionsUsing` 方法提供一个闭包：

```php
use Laravel\Pulse\Facades\Pulse;
use Illuminate\Support\Facades\Log;

Pulse::handleExceptionsUsing(function ($e) {
    Log::debug('An exception happened in Pulse', [
        'message' => $e->getMessage(),
        'stack' => $e->getTraceAsString(),
    ]);
});
```

<a name="custom-cards"></a>
## 自定义卡片

Pulse 允许你构建自定义卡片，以展示与你应用特定需求相关的数据。Pulse 使用 [Livewire](https://livewire.laravel.com)，因此在构建第一个自定义卡片之前，你可能需要先[阅读它的文档](https://livewire.laravel.com/docs)。

<a name="custom-card-components"></a>
### 卡片组件

在 Laravel Pulse 中创建自定义卡片，首先需要继承基础的 `Card` Livewire 组件并定义对应的视图：

```php
namespace App\Livewire\Pulse;

use Laravel\Pulse\Livewire\Card;
use Livewire\Attributes\Lazy;

#[Lazy]
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers');
    }
}
```

在使用 Livewire 的[懒加载](https://livewire.laravel.com/docs/lazy)特性时，`Card` 组件会自动提供一个占位符，并遵循传入你组件的 `cols` 和 `rows` 属性。

编写 Pulse 卡片对应的视图时，你可以利用 Pulse 的 Blade 组件来保持一致的观感与风格：

```blade
<x-pulse::card :cols="$cols" :rows="$rows" :class="$class" wire:poll.5s="">
    <x-pulse::card-header name="Top Sellers">
        <x-slot:icon>
            ...
        </x-slot:icon>
    </x-pulse::card-header>

    <x-pulse::scroll :expand="$expand">
        ...
    </x-pulse::scroll>
</x-pulse::card>
```

应当把 `$cols`、`$rows`、`$class` 和 `$expand` 变量分别传给对应的 Blade 组件，以便可以从仪表盘视图中定制卡片布局。你也可以在视图中加入 `wire:poll.5s=""` 属性，让卡片自动更新。

定义好 Livewire 组件和模板后，就可以把该卡片包含到你的[仪表盘视图](#dashboard-customization)中：

```blade
<x-pulse>
    ...

    <livewire:pulse.top-sellers cols="4" />
</x-pulse>
```

> [!NOTE]
> 如果你的卡片包含在某个包中，就需要使用 `Livewire::component` 方法把该组件注册到 Livewire。

<a name="custom-card-styling"></a>
### 样式

如果你的卡片需要 Pulse 自带的类与组件之外的额外样式，有几种方式可以为卡片引入自定义 CSS。

<a name="custom-card-styling-vite"></a>
#### Laravel Vite 集成

如果你的自定义卡片位于应用代码库中，并且使用了 Laravel 的 [Vite 集成](/docs/{{version}}/vite)，可以更新 `vite.config.js` 文件，为你的卡片添加一个专用的 CSS 入口：

```js
laravel({
    input: [
        'resources/css/pulse/top-sellers.css',
        // ...
    ],
}),
```

随后，你可以在[仪表盘视图](#dashboard-customization)中使用 `@vite` Blade 指令，并指定卡片的 CSS 入口：

```blade
<x-pulse>
    @vite('resources/css/pulse/top-sellers.css')

    ...
</x-pulse>
```

<a name="custom-card-styling-css"></a>
#### CSS 文件

对于其它用例，包括包含在包中的 Pulse 卡片，你可以在 Livewire 组件上定义一个 `css` 方法并返回 CSS 文件路径，从而让 Pulse 加载额外的样式表：

```php
class TopSellers extends Card
{
    // ...

    protected function css()
    {
        return __DIR__.'/../../dist/top-sellers.css';
    }
}
```

当该卡片被包含到仪表盘上时，Pulse 会自动把该文件的内容放进 `<style>` 标签中，因此无需把它发布到 `public` 目录。

<a name="custom-card-styling-tailwind"></a>
#### Tailwind CSS

使用 Tailwind CSS 时，你应当创建一个专用的 Tailwind 配置文件，以避免加载无用的 CSS 或与 Pulse 的 Tailwind 类冲突：

```js
export default {
    darkMode: 'class',
    important: '#top-sellers',
    content: [
        './resources/views/livewire/pulse/top-sellers.blade.php',
    ],
    corePlugins: {
        preflight: false,
    },
};
```

随后，你可以在 CSS 入口中指定该配置文件：

```css
@config "../../tailwind.top-sellers.config.js";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

你还需要在卡片视图中加入与传给 Tailwind [`important` 选择器策略](https://tailwindcss.com/docs/configuration#selector-strategy)的选择器相匹配的 `id` 或 `class` 属性：

```blade
<x-pulse::card id="top-sellers" :cols="$cols" :rows="$rows" class="$class">
    ...
</x-pulse::card>
```

<a name="custom-card-data"></a>
### 数据捕获与聚合

自定义卡片可以从任意位置获取并展示数据；不过，你可能更希望利用 Pulse 强大而高效的数据记录与聚合系统。

<a name="custom-card-data-capture"></a>
#### 捕获条目

Pulse 允许你使用 `Pulse::record` 方法记录「条目」：

```php
use Laravel\Pulse\Facades\Pulse;

Pulse::record('user_sale', $user->id, $sale->amount)
    ->sum()
    ->count();
```

传给 `record` 方法的第一个参数是你所记录条目的 `type`，第二个参数是决定聚合数据如何分组的 `key`。对于大多数聚合方法，你还需要指定一个待聚合的 `value`。在上例中，被聚合的值是 `$sale->amount`。随后你可以调用一个或多个聚合方法（例如 `sum`），这样 Pulse 就能把预先聚合的值捕获到「桶」中，以便日后高效检索。

可用的聚合方法有：

* `avg`
* `count`
* `max`
* `min`
* `sum`

> [!NOTE]
> 构建用于捕获当前已认证用户 ID 的卡片包时，你应当使用 `Pulse::resolveAuthenticatedUserId()` 方法，它会遵循应用中对[用户解析器](#dashboard-resolving-users)所做的任何定制。

<a name="custom-card-data-retrieval"></a>
#### 检索聚合数据

扩展 Pulse 的 `Card` Livewire 组件时，你可以使用 `aggregate` 方法获取仪表盘当前所查看时间段的聚合数据：

```php
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers', [
            'topSellers' => $this->aggregate('user_sale', ['sum', 'count'])
        ]);
    }
}
```

`aggregate` 方法返回一组 PHP `stdClass` 对象。每个对象都包含先前捕获的 `key` 属性，以及每个所请求聚合值对应的键：

```
@foreach ($topSellers as $seller)
    {{ $seller->key }}
    {{ $seller->sum }}
    {{ $seller->count }}
@endforeach
```

Pulse 主要从预先聚合的桶中获取数据；因此，指定的聚合值必须事先已通过 `Pulse::record` 方法捕获。最旧的桶通常会部分落在该时间段之外，因此 Pulse 会聚合最旧的条目来填补空缺，从而给出整个时间段的准确值，而无需在每次轮询请求时都聚合整个时间段。

你也可以使用 `aggregateTotal` 方法获取给定类型的总计值。例如，以下方法会获取所有用户销售的总计，而不是按用户分组：

```php
$total = $this->aggregateTotal('user_sale', 'sum');
```

<a name="custom-card-displaying-users"></a>
#### 展示用户

处理以用户 ID 作为键的聚合数据时，你可以使用 `Pulse::resolveUsers` 方法把这些键解析为用户记录：

```php
$aggregates = $this->aggregate('user_sale', ['sum', 'count']);

$users = Pulse::resolveUsers($aggregates->pluck('key'));

return view('livewire.pulse.top-sellers', [
    'sellers' => $aggregates->map(fn ($aggregate) => (object) [
        'user' => $users->find($aggregate->key),
        'sum' => $aggregate->sum,
        'count' => $aggregate->count,
    ])
]);
```

`find` 方法返回一个包含 `name`、`extra` 和 `avatar` 键的对象，你可以选择把它直接传给 `<x-pulse::user-card>` Blade 组件：

```blade
<x-pulse::user-card :user="{{ $seller->user }}" :stats="{{ $seller->sum }}" />
```

<a name="custom-recorders"></a>
#### 自定义记录器

包的作者可以提供记录器类，让用户能够配置数据捕获行为。

记录器在应用的 `config/pulse.php` 配置文件的 `recorders` 部分注册：

```php
[
    // ...
    'recorders' => [
        Acme\Recorders\Deployments::class => [
            // ...
        ],

        // ...
    ],
]
```

记录器可以通过指定 `$listen` 属性来监听事件。Pulse 会自动注册这些监听器并调用记录器的 `record` 方法：

```php
<?php

namespace Acme\Recorders;

use Acme\Events\Deployment;
use Illuminate\Support\Facades\Config;
use Laravel\Pulse\Facades\Pulse;

class Deployments
{
    /**
     * 需要监听的事件。
     *
     * @var array<int, class-string>
     */
    public array $listen = [
        Deployment::class,
    ];

    /**
     * 记录本次部署。
     */
    public function record(Deployment $event): void
    {
        $config = Config::get('pulse.recorders.'.static::class);

        Pulse::record(
            // ...
        );
    }
}
```
