# Laravel Pulse

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
- [仪表盘](#dashboard)
    - [授权](#dashboard-authorization)
    - [自定义](#dashboard-customization)
    - [解析用户](#dashboard-resolving-users)
    - [卡片](#dashboard-cards)
- [捕获条目](#capturing-entries)
    - [记录器](#recorders)
    - [过滤](#filtering)
- [性能](#performance)
    - [使用其他数据库](#using-a-different-database)
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

[Laravel Pulse](https://github.com/laravel/pulse) 让你一目了然地洞察应用的性能与使用情况。借助 Pulse，你可以定位慢作业、慢端点等瓶颈，找出最活跃的用户，等等。

如需对单个事件进行深入调试，请查看 [Laravel Telescope](/docs/{{version}}/telescope)。

<a name="installation"></a>
## 安装

> [!WARNING]
> Pulse 的第一方存储实现目前需要 MySQL、MariaDB 或 PostgreSQL 数据库。如果你使用的是其他数据库引擎，则需要为 Pulse 数据单独准备一个 MySQL、MariaDB 或 PostgreSQL 数据库。

你可以使用 Composer 包管理器安装 Pulse：

```shell
composer require laravel/pulse
```

接下来，你应使用 `vendor:publish` Artisan 命令发布 Pulse 的配置文件和数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

最后，你应运行 `migrate` 命令，创建存储 Pulse 数据所需的表：

```shell
php artisan migrate
```

Pulse 的数据库迁移运行完毕后，你就可以通过 `/pulse` 路由访问 Pulse 仪表盘了。

> [!NOTE]
> 如果你不想将 Pulse 数据存储在应用的主数据库中，可以[指定一个专用的数据库连接](#using-a-different-database)。

<a name="configuration"></a>
### 配置

Pulse 的许多配置选项都可以通过环境变量控制。要查看可用选项、注册新的记录器或配置高级选项，你可以发布 `config/pulse.php` 配置文件：

```shell
php artisan vendor:publish --tag=pulse-config
```

<a name="dashboard"></a>
## 仪表盘

<a name="dashboard-authorization"></a>
### 授权

Pulse 仪表盘可以通过 `/pulse` 路由访问。默认情况下，你只能在 `local` 环境中访问这个仪表盘，因此你需要通过自定义 `'viewPulse'` 授权门来为生产环境配置授权。你可以在应用的 `app/Providers/AppServiceProvider.php` 文件中完成：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * Bootstrap any application services.
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
### 自定义

你可以通过发布仪表盘视图来配置 Pulse 仪表盘的卡片和布局。仪表盘视图将被发布到 `resources/views/vendor/pulse/dashboard.blade.php`：

```shell
php artisan vendor:publish --tag=pulse-dashboard
```

仪表盘由 [Livewire](https://livewire.laravel.com/) 驱动，允许你自定义卡片和布局，而无需重新构建任何 JavaScript 资源。

在该文件中，`<x-pulse>` 组件负责渲染仪表盘，并为卡片提供网格布局。如果你希望仪表盘横跨整个屏幕宽度，可以为该组件提供 `full-width` 属性：

```blade
<x-pulse full-width>
    ...
</x-pulse>
```

默认情况下，`<x-pulse>` 组件会创建一个 12 列的网格，不过你可以使用 `cols` 属性来自定义：

```blade
<x-pulse cols="16">
    ...
</x-pulse>
```

每张卡片都接受 `cols` 和 `rows` 属性，用于控制空间占用和位置：

```blade
<livewire:pulse.usage cols="4" rows="2" />
```

大多数卡片还接受 `expand` 属性，用于完整显示卡片内容而不是滚动显示：

```blade
<livewire:pulse.slow-queries expand />
```

<a name="dashboard-resolving-users"></a>
### 解析用户

对于显示用户信息的卡片，例如「应用使用情况」卡片，Pulse 只会记录用户的 ID。渲染仪表盘时，Pulse 会从默认的 `Authenticatable` 模型中解析 `name` 和 `email` 字段，并使用 Gravatar 网络服务显示头像。

你可以通过在应用的 `App\Providers\AppServiceProvider` 类中调用 `Pulse::user` 方法来自定义这些字段和头像。

`user` 方法接受一个闭包，该闭包会接收要显示的 `Authenticatable` 模型，并应返回一个包含用户的 `name`、`extra` 和 `avatar` 信息的数组：

```php
use Laravel\Pulse\Facades\Pulse;

/**
 * Bootstrap any application services.
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
> 通过实现 `Laravel\Pulse\Contracts\ResolvesUsers` 契约并将其绑定到 Laravel 的[服务容器](/docs/{{version}}/container#binding-a-singleton)，你可以完全自定义已认证用户的捕获和获取方式。

<a name="dashboard-cards"></a>
### 卡片

<a name="servers-card"></a>
#### 服务器

`<livewire:pulse.servers />` 卡片显示所有运行 `pulse:check` 命令的服务器的系统资源使用情况。有关系统资源报告的更多信息，请参阅[服务器记录器](#servers-recorder)的文档。

如果你替换了基础设施中的某台服务器，可能希望在指定时长后停止在 Pulse 仪表盘中显示该不活跃的服务器。你可以使用 `ignore-after` 属性来完成，该属性接受一个秒数，表示不活跃的服务器在多少秒后从 Pulse 仪表盘中移除。此外，你也可以提供相对时间格式的字符串，例如 `1 hour` 或 `3 days and 1 hour`：

```blade
<livewire:pulse.servers ignore-after="3 hours" />
```

<a name="application-usage-card"></a>
#### 应用使用情况

`<livewire:pulse.usage />` 卡片显示向应用发起请求、分发作业以及遭遇慢请求次数最多的前 10 名用户。

如果你希望同时在屏幕上查看所有使用指标，可以多次包含该卡片并指定 `type` 属性：

```blade
<livewire:pulse.usage type="requests" />
<livewire:pulse.usage type="slow_requests" />
<livewire:pulse.usage type="jobs" />
```

要了解如何自定义 Pulse 获取和显示用户信息的方式，请查阅我们关于[解析用户](#dashboard-resolving-users)的文档。

> [!NOTE]
> 如果你的应用接收大量请求或分发大量作业，你可能需要启用[采样](#sampling)。更多信息请参阅[用户请求记录器](#user-requests-recorder)、[用户作业记录器](#user-jobs-recorder)和[慢作业记录器](#slow-jobs-recorder)的文档。

<a name="exceptions-card"></a>
#### 异常

`<livewire:pulse.exceptions />` 卡片显示应用中发生异常的频率和最近发生时间。默认情况下，异常按异常类和发生位置分组。更多信息请参阅[异常记录器](#exceptions-recorder)的文档。

<a name="queues-card"></a>
#### 队列

`<livewire:pulse.queues />` 卡片显示应用中队列的吞吐量，包括已入队、处理中、已处理、已释放和失败的作业数量。更多信息请参阅[队列记录器](#queues-recorder)的文档。

<a name="slow-requests-card"></a>
#### 慢请求

`<livewire:pulse.slow-requests />` 卡片显示应用中超过配置阈值的传入请求，默认阈值为 1,000ms。更多信息请参阅[慢请求记录器](#slow-requests-recorder)的文档。

<a name="slow-jobs-card"></a>
#### 慢作业

`<livewire:pulse.slow-jobs />` 卡片显示应用中超过配置阈值的队列作业，默认阈值为 1,000ms。更多信息请参阅[慢作业记录器](#slow-jobs-recorder)的文档。

<a name="slow-queries-card"></a>
#### 慢查询

`<livewire:pulse.slow-queries />` 卡片显示应用中超过配置阈值的数据库查询，默认阈值为 1,000ms。

默认情况下，慢查询按 SQL 查询（不含绑定值）和发生位置分组；但如果你只想按 SQL 查询分组，可以选择不捕获发生位置。

如果由于超长 SQL 查询进行语法高亮而导致渲染性能问题，你可以添加 `without-highlighting` 属性来禁用高亮：

```blade
<livewire:pulse.slow-queries without-highlighting />
```

更多信息请参阅[慢查询记录器](#slow-queries-recorder)的文档。

<a name="slow-outgoing-requests-card"></a>
#### 慢传出请求

`<livewire:pulse.slow-outgoing-requests />` 卡片显示使用 Laravel [HTTP 客户端](/docs/{{version}}/http-client)发起的、超过配置阈值的传出请求，默认阈值为 1,000ms。

默认情况下，条目按完整 URL 分组。不过，你可能希望使用正则表达式对相似的传出请求进行归一化或分组。更多信息请参阅[慢传出请求记录器](#slow-outgoing-requests-recorder)的文档。

<a name="cache-card"></a>
#### 缓存

`<livewire:pulse.cache />` 卡片显示应用的缓存命中和未命中统计，包括全局统计和单个键的统计。

默认情况下，条目按键分组。不过，你可能希望使用正则表达式对相似的键进行归一化或分组。更多信息请参阅[缓存交互记录器](#cache-interactions-recorder)的文档。

<a name="capturing-entries"></a>
## 捕获条目

大多数 Pulse 记录器会根据 Laravel 分发的框架事件自动捕获条目。不过，[服务器记录器](#servers-recorder)和某些第三方卡片必须定期轮询获取信息。要使用这些卡片，你必须在每台应用服务器上运行 `pulse:check` 守护进程：

```php
php artisan pulse:check
```

> [!NOTE]
> 要让 `pulse:check` 进程在后台永久运行，你应使用诸如 Supervisor 之类的进程监控器，确保该命令不会停止运行。

由于 `pulse:check` 命令是一个常驻进程，不重启就无法感知代码库的变更。你应在应用的部署过程中调用 `pulse:restart` 命令来优雅地重启它：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用此功能之前，你应确认应用已正确配置缓存驱动。

<a name="recorders"></a>
### 记录器

记录器负责从应用中捕获条目并记录到 Pulse 数据库。记录器在 [Pulse 配置文件](#configuration)的 `recorders` 部分注册和配置。

<a name="cache-interactions-recorder"></a>
#### 缓存交互

`CacheInteractions` 记录器捕获应用中[缓存](/docs/{{version}}/cache)命中和未命中的信息，用于在[缓存](#cache-card)卡片中显示。

你可以选择调整[采样率](#sampling)和忽略的键模式。

你还可以配置键分组，让相似的键作为单个条目分组显示。例如，你可能希望从缓存同一类型信息的键中移除唯一 ID。分组使用正则表达式来「查找和替换」键的部分内容进行配置。配置文件中包含了一个示例：

```php
Recorders\CacheInteractions::class => [
    // ...
    'groups' => [
        // '/:\d+/' => ':*',
    ],
],
```

系统会使用第一个匹配的模式。如果没有模式匹配，键将按原样捕获。

<a name="exceptions-recorder"></a>
#### 异常

`Exceptions` 记录器捕获应用中发生的可报告异常的信息，用于在[异常](#exceptions-card)卡片中显示。

你可以选择调整[采样率](#sampling)和忽略的异常模式。你还可以配置是否捕获异常的发生位置。捕获的位置会显示在 Pulse 仪表盘上，有助于追踪异常的来源；不过，如果同一个异常发生在多个位置，它会因每个不同的位置而多次显示。

<a name="queues-recorder"></a>
#### 队列

`Queues` 记录器捕获应用队列的相关信息，用于在[队列](#queues-card)卡片中显示。

你可以选择调整[采样率](#sampling)和忽略的作业模式。

<a name="slow-jobs-recorder"></a>
#### 慢作业

`SlowJobs` 记录器捕获应用中慢作业的信息，用于在[慢作业](#slow-jobs-recorder)卡片中显示。

你可以选择调整慢作业阈值、[采样率](#sampling)和忽略的作业模式。

某些作业可能天然会比其他作业耗时更长。对于这些情况，你可以按作业配置阈值：

```php
Recorders\SlowJobs::class => [
    // ...
    'threshold' => [
        '#^App\\Jobs\\GenerateYearlyReports$#' => 5000,
        'default' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配作业的类名，将使用 `'default'` 值。

<a name="slow-outgoing-requests-recorder"></a>
#### 慢传出请求

`SlowOutgoingRequests` 记录器捕获使用 Laravel [HTTP 客户端](/docs/{{version}}/http-client)发起的、超过配置阈值的传出 HTTP 请求，用于在[慢传出请求](#slow-outgoing-requests-card)卡片中显示。

你可以选择调整慢传出请求阈值、[采样率](#sampling)和忽略的 URL 模式。

某些传出请求可能天然会比其他请求耗时更长。对于这些情况，你可以按请求配置阈值：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'threshold' => [
        '#backup.zip$#' => 5000,
        'default' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配请求的 URL，将使用 `'default'` 值。

你还可以配置 URL 分组，让相似的 URL 作为单个条目分组显示。例如，你可能希望从 URL 路径中移除唯一 ID，或只按域名分组。分组使用正则表达式来「查找和替换」URL 的部分内容进行配置。配置文件中包含了一些示例：

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

系统会使用第一个匹配的模式。如果没有模式匹配，URL 将按原样捕获。

<a name="slow-queries-recorder"></a>
#### 慢查询

`SlowQueries` 记录器捕获应用中超过配置阈值的数据库查询，用于在[慢查询](#slow-queries-card)卡片中显示。

你可以选择调整慢查询阈值、[采样率](#sampling)和忽略的查询模式。你还可以配置是否捕获查询位置。捕获的位置会显示在 Pulse 仪表盘上，有助于追踪查询的来源；不过，如果同一个查询在多个位置执行，它会因每个不同的位置而多次显示。

某些查询可能天然会比其他查询耗时更长。对于这些情况，你可以按查询配置阈值：

```php
Recorders\SlowQueries::class => [
    // ...
    'threshold' => [
        '#^insert into `yearly_reports`#' => 5000,
        'default' => env('PULSE_SLOW_QUERIES_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配查询的 SQL，将使用 `'default'` 值。

<a name="slow-requests-recorder"></a>
#### 慢请求

`Requests` 记录器捕获向应用发起的请求的信息，用于在[慢请求](#slow-requests-card)和[应用使用情况](#application-usage-card)卡片中显示。

你可以选择调整慢路由阈值、[采样率](#sampling)和忽略的路径。

某些请求可能天然会比其他请求耗时更长。对于这些情况，你可以按请求配置阈值：

```php
Recorders\SlowRequests::class => [
    // ...
    'threshold' => [
        '#^/admin/#' => 5000,
        'default' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配请求的 URL，将使用 `'default'` 值。

<a name="servers-recorder"></a>
#### 服务器

`Servers` 记录器捕获支撑应用运行的服务器的 CPU、内存和存储使用情况，用于在[服务器](#servers-card)卡片中显示。此记录器需要在每台你希望监控的服务器上运行 [pulse:check 命令](#capturing-entries)。

每台报告的服务器必须有唯一的名称。默认情况下，Pulse 会使用 PHP 的 `gethostname` 函数返回的值。如果你想自定义它，可以设置 `PULSE_SERVER_NAME` 环境变量：

```env
PULSE_SERVER_NAME=load-balancer
```

Pulse 配置文件还允许你自定义要监控的目录。

<a name="user-jobs-recorder"></a>
#### 用户作业

`UserJobs` 记录器捕获在应用中分发作业的用户的信息，用于在[应用使用情况](#application-usage-card)卡片中显示。

你可以选择调整[采样率](#sampling)和忽略的作业模式。

<a name="user-requests-recorder"></a>
#### 用户请求

`UserRequests` 记录器捕获向应用发起请求的用户的信息，用于在[应用使用情况](#application-usage-card)卡片中显示。

你可以选择调整[采样率](#sampling)和忽略的 URL 模式。

<a name="filtering"></a>
### 过滤

正如我们所见，许多[记录器](#recorders)都支持通过配置，根据条目的值（例如请求的 URL）来「忽略」传入的条目。但有时基于其他因素（例如当前已认证的用户）来过滤记录可能更有用。要过滤这些记录，你可以向 Pulse 的 `filter` 方法传递一个闭包。通常，`filter` 方法应在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Entry;
use Laravel\Pulse\Facades\Pulse;
use Laravel\Pulse\Value;

/**
 * Bootstrap any application services.
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

Pulse 的设计初衷是能够直接接入现有应用，而不需要任何额外的基础设施。不过，对于高流量的应用，有多种方法可以消除 Pulse 对应用性能可能产生的影响。

<a name="using-a-different-database"></a>
### 使用其他数据库

对于高流量的应用，你可能更愿意为 Pulse 使用专用的数据库连接，以免影响应用数据库。

你可以通过设置 `PULSE_DB_CONNECTION` 环境变量来自定义 Pulse 使用的[数据库连接](/docs/{{version}}/database#configuration)。

```env
PULSE_DB_CONNECTION=pulse
```

<a name="ingest"></a>
### Redis 摄取

> [!WARNING]
> Redis 摄取需要 Redis 6.2 或更高版本，并且要求应用配置的 Redis 客户端驱动为 `phpredis` 或 `predis`。

默认情况下，Pulse 会在 HTTP 响应发送给客户端或作业处理完毕后，将条目直接存储到[配置的数据库连接](#using-a-different-database)；不过，你可以使用 Pulse 的 Redis 摄取驱动，将条目改为发送到 Redis 流。可以通过配置 `PULSE_INGEST_DRIVER` 环境变量来启用：

```ini
PULSE_INGEST_DRIVER=redis
```

Pulse 默认会使用你的默认 [Redis 连接](/docs/{{version}}/redis#configuration)，但你可以通过 `PULSE_REDIS_CONNECTION` 环境变量来自定义：

```ini
PULSE_REDIS_CONNECTION=pulse
```

> [!WARNING]
> 使用 Redis 摄取驱动时，你的 Pulse 安装应始终使用与 Redis 队列（如果有的话）不同的 Redis 连接。

使用 Redis 摄取时，你需要运行 `pulse:work` 命令来监听流，并将条目从 Redis 移动到 Pulse 的数据库表中。

```php
php artisan pulse:work
```

> [!NOTE]
> 要让 `pulse:work` 进程在后台永久运行，你应使用诸如 Supervisor 之类的进程监控器，确保 Pulse worker 不会停止运行。

由于 `pulse:work` 命令是一个常驻进程，不重启就无法感知代码库的变更。你应在应用的部署过程中调用 `pulse:restart` 命令来优雅地重启它：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用此功能之前，你应确认应用已正确配置缓存驱动。

<a name="sampling"></a>
### 采样

默认情况下，Pulse 会捕获应用中发生的每一个相关事件。对于高流量应用，这可能导致仪表盘中需要聚合数百万行数据库记录，尤其是在较长的时间段内。

作为替代，你可以选择为某些 Pulse 数据记录器启用「采样」。例如，将[用户请求](#user-requests-recorder)记录器的采样率设置为 `0.1`，意味着你只记录应用中大约 10% 的请求。在仪表盘中，数值会被放大显示，并加上 `~` 前缀以表明它们是近似值。

一般来说，某个特定指标的条目越多，你就可以在不过多牺牲准确性的前提下，把采样率安全地设置得越低。

<a name="trimming"></a>
### 修剪

一旦存储的条目超出仪表盘的时间窗口，Pulse 就会自动修剪它们。修剪在摄取数据时通过抽奖系统进行，该系统可在 Pulse [配置文件](#configuration)中自定义。

<a name="pulse-exceptions"></a>
### 处理 Pulse 异常

如果捕获 Pulse 数据时发生异常（例如无法连接到存储数据库），Pulse 会静默失败，以避免影响你的应用。

如果你想自定义这些异常的处理方式，可以向 `handleExceptionsUsing` 方法提供一个闭包：

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

Pulse 允许你构建自定义卡片，来显示与应用特定需求相关的数据。Pulse 使用 [Livewire](https://livewire.laravel.com)，因此在构建你的第一个自定义卡片之前，你可能需要先[查阅它的文档](https://livewire.laravel.com/docs)。

<a name="custom-card-components"></a>
### 卡片组件

在 Laravel Pulse 中创建自定义卡片，首先需要扩展基础的 `Card` Livewire 组件并定义相应的视图：

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

使用 Livewire 的[延迟加载](https://livewire.laravel.com/docs/lazy)功能时，`Card` 组件会自动提供一个占位符，并遵循传递给组件的 `cols` 和 `rows` 属性。

编写 Pulse 卡片的对应视图时，你可以利用 Pulse 的 Blade 组件来获得一致的外观和风格：

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

应将 `$cols`、`$rows`、`$class` 和 `$expand` 变量传递给相应的 Blade 组件，以便可以从仪表盘视图自定义卡片布局。你可能还希望在视图中包含 `wire:poll.5s=""` 属性，让卡片自动更新。

定义好 Livewire 组件和模板之后，就可以在[仪表盘视图](#dashboard-customization)中包含该卡片了：

```blade
<x-pulse>
    ...

    <livewire:pulse.top-sellers cols="4" />
</x-pulse>
```

> [!NOTE]
> 如果你的卡片包含在扩展包中，你需要使用 `Livewire::component` 方法向 Livewire 注册该组件。

<a name="custom-card-styling"></a>
### 样式

如果你的卡片需要超出 Pulse 自带的类和组件之外的额外样式，有几种方法可以为卡片引入自定义 CSS。

<a name="custom-card-styling-vite"></a>
#### Laravel Vite 集成

如果你的自定义卡片位于应用的代码库中，并且你正在使用 Laravel 的 [Vite 集成](/docs/{{version}}/vite)，你可以更新 `vite.config.js` 文件，为卡片引入一个专用的 CSS 入口：

```js
laravel({
    input: [
        'resources/css/pulse/top-sellers.css',
        // ...
    ],
}),
```

然后，你可以在[仪表盘视图](#dashboard-customization)中使用 `@vite` Blade 指令，并指定卡片的 CSS 入口：

```blade
<x-pulse>
    @vite('resources/css/pulse/top-sellers.css')

    ...
</x-pulse>
```

<a name="custom-card-styling-css"></a>
#### CSS 文件

对于其他场景，包括扩展包中的 Pulse 卡片，你可以在 Livewire 组件上定义一个 `css` 方法，返回 CSS 文件的路径，来指示 Pulse 加载额外的样式表：

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

当该卡片被包含到仪表盘中时，Pulse 会自动将此文件的内容包含在 `<style>` 标签内，因此无需将其发布到 `public` 目录。

<a name="custom-card-styling-tailwind"></a>
#### Tailwind CSS

使用 Tailwind CSS 时，你应创建一个专用的 CSS 入口。下面的示例排除了 Pulse 已包含的 Tailwind [Preflight](https://tailwindcss.com/docs/preflight) 基础样式，并使用 CSS 选择器限定 Tailwind 的作用范围，以避免与 Pulse 的 Tailwind 类冲突：

```css
@import "tailwindcss/theme.css";

@custom-variant dark (&:where(.dark, .dark *));
@source "./../../views/livewire/pulse/top-sellers.blade.php";

@theme {
  /* ... */
}

#top-sellers {
  @import "tailwindcss/utilities.css" source(none);
}
```

你还需要在卡片视图中包含一个与入口中 CSS 选择器匹配的 `id` 或 `class` 属性：

```blade
<x-pulse::card id="top-sellers" :cols="$cols" :rows="$rows" class="$class">
    ...
</x-pulse::card>
```

<a name="custom-card-data"></a>
### 数据捕获与聚合

自定义卡片可以从任何地方获取并显示数据；不过，你可能希望利用 Pulse 强大而高效的数据记录与聚合系统。

<a name="custom-card-data-capture"></a>
#### 捕获条目

Pulse 允许你使用 `Pulse::record` 方法记录「条目」：

```php
use Laravel\Pulse\Facades\Pulse;

Pulse::record('user_sale', $user->id, $sale->amount)
    ->sum()
    ->count();
```

提供给 `record` 方法的第一个参数是你要记录的条目的 `type`，第二个参数是决定聚合数据分组方式的 `key`。对于大多数聚合方法，你还需要指定一个要聚合的 `value`。在上面的例子中，被聚合的值是 `$sale->amount`。接下来，你可以调用一个或多个聚合方法（例如 `sum`），让 Pulse 将预聚合的值捕获到「桶」中，以便之后高效检索。

可用的聚合方法有：

* `avg`
* `count`
* `max`
* `min`
* `sum`

> [!NOTE]
> 在构建捕获当前已认证用户 ID 的卡片扩展包时，你应使用 `Pulse::resolveAuthenticatedUserId()` 方法，它会遵循应用中所做的任何[用户解析器自定义](#dashboard-resolving-users)。

<a name="custom-card-data-retrieval"></a>
#### 检索聚合数据

扩展 Pulse 的 `Card` Livewire 组件时，你可以使用 `aggregate` 方法检索仪表盘中当前查看时间段的聚合数据：

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

`aggregate` 方法返回一个 PHP `stdClass` 对象的集合。每个对象都包含之前捕获的 `key` 属性，以及每个所请求聚合值对应的键：

```blade
@foreach ($topSellers as $seller)
    {{ $seller->key }}
    {{ $seller->sum }}
    {{ $seller->count }}
@endforeach
```

Pulse 主要从预聚合的桶中检索数据；因此，指定的聚合值必须事先通过 `Pulse::record` 方法捕获。最旧的桶通常会部分超出时间段，所以 Pulse 会聚合最旧的条目来填补空缺，为整个时间段给出准确的值，而无需在每次轮询请求时聚合整个时间段。

你还可以使用 `aggregateTotal` 方法检索给定类型的总值。例如，以下方法将检索所有用户销售的总和，而不是按用户分组。

```php
$total = $this->aggregateTotal('user_sale', 'sum');
```

<a name="custom-card-displaying-users"></a>
#### 显示用户

在处理以用户 ID 作为键记录的聚合数据时，你可以使用 `Pulse::resolveUsers` 方法将键解析为用户记录：

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

`find` 方法返回一个包含 `name`、`extra` 和 `avatar` 键的对象，你可以选择将其直接传递给 `<x-pulse::user-card>` Blade 组件：

```blade
<x-pulse::user-card :user="{{ $seller->user }}" :stats="{{ $seller->sum }}" />
```

<a name="custom-recorders"></a>
#### 自定义记录器

扩展包作者可能希望提供记录器类，让用户可以配置数据的捕获方式。

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

记录器可以通过指定 `$listen` 属性来监听事件。Pulse 会自动注册监听器，并调用记录器的 `record` 方法：

```php
<?php

namespace Acme\Recorders;

use Acme\Events\Deployment;
use Illuminate\Support\Facades\Config;
use Laravel\Pulse\Facades\Pulse;

class Deployments
{
    /**
     * 要监听的事件。
     *
     * @var array<int, class-string>
     */
    public array $listen = [
        Deployment::class,
    ];

    /**
     * 记录部署。
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
