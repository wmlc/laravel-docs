# Laravel Pulse

## 简介

[Laravel Pulse](https://github.com/laravel/pulse) 可让你一眼洞察应用的性能与使用情况。借助 Pulse，你可以定位诸如缓慢任务和端点之类的瓶颈，找到最活跃的用户，等等。

如需对单个事件进行深入调试，请查阅 [Laravel Telescope](/docs/{{version}}/telescope)。

## 安装

> [!WARNING]
> Pulse 的第一方存储实现当前要求使用 MySQL、MariaDB 或 PostgreSQL 数据库。如果你使用其他数据库引擎，则需要为 Pulse 数据单独准备一个 MySQL、MariaDB 或 PostgreSQL 数据库。

你可以使用 Composer 包管理器安装 Pulse：

```shell
composer require laravel/pulse
```

接下来，你应当使用 `vendor:publish` Artisan 命令发布 Pulse 的配置文件与数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

最后，你应当运行 `migrate` 命令以创建存储 Pulse 数据所需的表：

```shell
php artisan migrate
```

运行 Pulse 的数据库迁移后，你可以通过 `/pulse` 路由访问 Pulse 仪表盘。

> [!NOTE]
> 如果你不希望将 Pulse 数据存储在应用的主数据库中，可以[指定专用的数据库连接](#using-a-different-database)。

## 仪表盘

### 授权

Pulse 仪表盘可通过 `/pulse` 路由访问。默认情况下，你只能在 `local` 环境中访问该仪表盘，因此需要通过自定义 `'viewPulse'` 授权门限来为生产环境配置授权。你可以在应用的 `app/Providers/AppServiceProvider.php` 文件中完成此配置：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Gate::define('viewPulse', function (User $user) {
        return $user->isAdmin();
    });

    // ...
}
```

### 自定义

通过发布仪表盘视图，可以配置 Pulse 仪表盘的卡片与布局。该仪表盘视图会被发布到 `resources/views/vendor/pulse/dashboard.blade.php`：

```shell
php artisan vendor:publish --tag=pulse-dashboard
```

该仪表盘由 [Livewire](https://livewire.laravel.com/) 驱动，让你无需重新构建任何 JavaScript 资源即可自定义卡片与布局。

在该文件中，`<x-pulse>` 组件负责渲染仪表盘，并为卡片提供网格布局。如果你希望仪表盘占满整个屏幕宽度，可以为该组件提供 `full-width` 属性：

```blade
<x-pulse full-width>
    ...
</x-pulse>
```

默认情况下，`<x-pulse>` 组件会创建一个 12 列的网格，但你可以使用 `cols` 属性自定义：

```blade
<x-pulse cols="16">
    ...
</x-pulse>
```

每张卡片都接受 `cols` 和 `rows` 属性，用于控制所占空间与位置：

```blade
<livewire:pulse.usage cols="4" rows="2" />
```

大多数卡片还接受 `expand` 属性，用于展示完整卡片而非滚动显示：

```blade
<livewire:pulse.slow-queries expand />
```

### 解析用户

对于展示用户信息的卡片（例如 Application Usage 卡片），Pulse 只会记录用户的 ID。在渲染仪表盘时，Pulse 会从你默认的 `Authenticatable` 模型中解析 `name` 和 `email` 字段，并使用 Gravatar 网络服务显示头像。

你可以在应用的 `App\Providers\AppServiceProvider` 类中调用 `Pulse::user` 方法来自定义字段与头像。

`user` 方法接受一个闭包，该闭包会接收要显示的 `Authenticatable` 模型，并应返回一个包含用户 `name`、`extra` 和 `avatar` 信息的数组：

```php
use Laravel\Pulse\Facades\Pulse;

/**
 * 引导任意应用服务。
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
> 你可以通过实现 `Laravel\Pulse\Contracts\ResolvesUsers` 契约并将其绑定到 Laravel 的[服务容器](/docs/{{version}}/container#binding-a-singleton)中，来完全自定义已认证用户的捕获与获取方式。

### 卡片

#### 服务器

`<livewire:pulse.servers />` 卡片展示所有运行 `pulse:check` 命令的服务器的系统资源使用情况。有关系统资源上报的更多信息，请参阅 [servers 记录器](#servers-recorder) 文档。

如果你更换了基础设施中的某台服务器，可能希望在一段时间后停止在 Pulse 仪表盘中显示该不活跃的服务器。你可以使用 `ignore-after` 属性来实现，该属性接受失效服务器应从 Pulse 仪表盘移除的秒数。或者，你也可以提供相对时间格式的字符串，例如 `1 hour` 或 `3 days and 1 hour`：

```blade
<livewire:pulse.servers ignore-after="3 hours" />
```

#### 应用使用情况

`<livewire:pulse.usage />` 卡片展示向你的应用发起请求、派发任务以及遇到缓慢请求最多的前 10 名用户。

如果你希望同时在同一屏幕上查看所有使用指标，可以多次引入该卡片并指定 `type` 属性：

```blade
<livewire:pulse.usage type="requests" />
<livewire:pulse.usage type="slow_requests" />
<livewire:pulse.usage type="jobs" />
```

要了解如何自定义 Pulse 获取与展示用户信息的方式，请参阅我们关于[解析用户](#dashboard-resolving-users)的文档。

> [!NOTE]
> 如果你的应用收到大量请求或派发大量任务，你可能希望启用[采样](#sampling)。详情请参阅 [user requests 记录器](#user-requests-recorder)、[user jobs 记录器](#user-jobs-recorder) 和 [slow jobs 记录器](#slow-jobs-recorder) 文档。

#### 异常

`<livewire:pulse.exceptions />` 卡片展示应用中发生的异常出现的频率与最近发生时间。默认情况下，异常会根据异常类及其发生位置进行分组。详情请参阅 [exceptions 记录器](#exceptions-recorder) 文档。

#### 队列

`<livewire:pulse.queues />` 卡片展示应用中队列的吞吐量，包括已入队、处理中、已处理、已释放和已失败的任务数量。详情请参阅 [queues 记录器](#queues-recorder) 文档。

#### 缓慢请求

`<livewire:pulse.slow-requests />` 卡片展示应用中超出配置阈值的传入请求，该阈值默认是 1,000ms。详情请参阅 [slow requests 记录器](#slow-requests-recorder) 文档。

#### 缓慢任务

`<livewire:pulse.slow-jobs />` 卡片展示应用中超出配置阈值的排队任务，该阈值默认是 1,000ms。详情请参阅 [slow jobs 记录器](#slow-jobs-recorder) 文档。

#### 缓慢查询

`<livewire:pulse.slow-queries />` 卡片展示应用中超出配置阈值的数据库查询，该阈值默认是 1,000ms。

默认情况下，缓慢查询会根据 SQL 查询（不含绑定）及其发生位置进行分组，但如果你希望仅按 SQL 查询分组，可以选择不捕获位置。

如果你因超长 SQL 查询的语法高亮而遇到渲染性能问题，可以通过添加 `without-highlighting` 属性来禁用高亮：

```blade
<livewire:pulse.slow-queries without-highlighting />
```

详情请参阅 [slow queries 记录器](#slow-queries-recorder) 文档。

#### 缓慢的出站请求

`<livewire:pulse.slow-outgoing-requests />` 卡片展示使用 Laravel [HTTP 客户端](/docs/{{version}}/http-client) 发起、且超出配置阈值的出站请求，该阈值默认是 1,000ms。

默认情况下，条目会按完整 URL 分组。不过，你可能希望使用正则表达式对相似的出站请求进行归一化或分组。详情请参阅 [slow outgoing requests 记录器](#slow-outgoing-requests-recorder) 文档。

#### 缓存

`<livewire:pulse.cache />` 卡片展示应用的缓存命中与未命中统计，包括全局和单个键的统计数据。

默认情况下，条目会按键分组。不过，你可能希望使用正则表达式对相似的键进行归一化或分组。详情请参阅 [cache interactions 记录器](#cache-interactions-recorder) 文档。

## 捕获条目

大多数 Pulse 记录器会根据 Laravel 派发的框架事件自动捕获条目。不过，[servers 记录器](#servers-recorder) 和一些第三方卡片必须定期轮询信息。要使用这些卡片，你必须在所有应用服务器上运行 `pulse:check` 守护进程：

```php
php artisan pulse:check
```

> [!NOTE]
> 要让 `pulse:check` 进程在后台持续运行，应使用 Supervisor 之类的进程监视器，以确保该命令不会停止运行。

由于 `pulse:check` 命令是一个长生命周期进程，如果不重启，它将无法感知代码库的变更。你应在应用部署过程中通过调用 `pulse:restart` 命令来优雅地重启该命令：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)存储重启信号，因此在使用此功能前，你应确认应用已正确配置了缓存驱动。

### 记录器

记录器负责从应用中捕获条目并记录到 Pulse 数据库。记录器在[Pulse 配置文件](#configuration)的 `recorders` 部分注册和配置。

#### 缓存交互

`CacheInteractions` 记录器捕获应用中发生的[缓存](/docs/{{version}}/cache)命中与未命中信息，用于在 [Cache](#cache-card) 卡片上展示。

你可以选择性地调整[采样率](#sampling)和忽略的键模式。

你还可以配置键分组，使相似的键被归为同一个条目。例如，你可能希望从缓存同类信息的键中移除唯一 ID。分组通过正则表达式对键的某部分进行"查找并替换"来配置。配置文件中包含了一个示例：

```php
Recorders\CacheInteractions::class => [
    // ...
    'groups' => [
        // '/:\d+/' => ':*',
    ],
],
```

第一个匹配的模式会被使用。如果没有模式匹配，则键会按原样捕获。

#### 异常

`Exceptions` 记录器捕获应用中可报告的异常信息，用于在 [Exceptions](#exceptions-card) 卡片上展示。

你可以选择性地调整[采样率](#sampling)和忽略的异常模式。你还可以配置是否捕获异常发生的位置。捕获的位置会显示在 Pulse 仪表盘上，有助于定位异常来源；不过，如果同一个异常发生在多个位置，则每个不同位置都会出现一次。

#### 队列

`Queues` 记录器捕获应用队列的信息，用于在 [Queues](#queues-card) 卡片上展示。

你可以选择性地调整[采样率](#sampling)和忽略的任务模式。

#### 缓慢任务

`SlowJobs` 记录器捕获应用中缓慢任务的信息，用于在 [Slow Jobs](#slow-jobs-recorder) 卡片上展示。

你可以选择性地调整缓慢任务阈值、[采样率](#sampling)和忽略的任务模式。

有些任务你可能预期会比其他的耗时更长。在这种情况下，你可以配置按任务设定的阈值：

```php
Recorders\SlowJobs::class => [
    // ...
    'threshold' => [
        '#^App\\Jobs\\GenerateYearlyReports$#' => 5000,
        'default' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配任务的类名，则使用 `'default'` 值。

#### 缓慢的出站请求

`SlowOutgoingRequests` 记录器捕获使用 Laravel [HTTP 客户端](/docs/{{version}}/http-client) 发起、且超出配置阈值的出站 HTTP 请求信息，用于在 [Slow Outgoing Requests](#slow-outgoing-requests-card) 卡片上展示。

你可以选择性地调整缓慢出站请求阈值、[采样率](#sampling)和忽略的 URL 模式。

有些出站请求你可能预期会比其他的耗时更长。在这种情况下，你可以配置按请求设定的阈值：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'threshold' => [
        '#backup.zip$#' => 5000,
        'default' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配请求的 URL，则使用 `'default'` 值。

你还可以配置 URL 分组，使相似的 URL 被归为同一个条目。例如，你可能希望从 URL 路径中移除唯一 ID，或仅按域名分组。分组通过正则表达式对 URL 的某部分进行"查找并替换"来配置。配置文件中包含一些示例：

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

第一个匹配的模式会被使用。如果没有模式匹配，则 URL 会按原样捕获。

#### 缓慢查询

`SlowQueries` 记录器捕获应用中任何超出配置阈值的数据库查询，用于在 [Slow Queries](#slow-queries-card) 卡片上展示。

你可以选择性地调整缓慢查询阈值、[采样率](#sampling)和忽略的查询模式。你还可以配置是否捕获查询位置。捕获的位置会显示在 Pulse 仪表盘上，有助于定位查询来源；不过，如果同一个查询在多个位置执行，则每个不同位置都会出现一次。

有些查询你可能预期会比其他的耗时更长。在这种情况下，你可以配置按查询设定的阈值：

```php
Recorders\SlowQueries::class => [
    // ...
    'threshold' => [
        '#^insert into `yearly_reports`#' => 5000,
        'default' => env('PULSE_SLOW_QUERIES_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配查询的 SQL，则使用 `'default'` 值。

#### 缓慢请求

`Requests` 记录器捕获向应用发起请求的信息，用于在 [Slow Requests](#slow-requests-card) 和 [Application Usage](#application-usage-card) 卡片上展示。

你可以选择性地调整缓慢路由阈值、[采样率](#sampling)和忽略的路径。

有些请求你可能预期会比其他的耗时更长。在这种情况下，你可以配置按请求设定的阈值：

```php
Recorders\SlowRequests::class => [
    // ...
    'threshold' => [
        '#^/admin/#' => 5000,
        'default' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配请求的 URL，则使用 `'default'` 值。

#### 服务器

`Servers` 记录器捕获为应用提供算力的服务器的 CPU、内存和存储使用情况，用于在 [Servers](#servers-card) 卡片上展示。该记录器要求在你希望监控的每台服务器上运行 [pulse:check 命令](#capturing-entries)。

每台上报的服务器必须有唯一的名称。默认情况下，Pulse 会使用 PHP 的 `gethostname` 函数返回的值。如果你想自定义，可以设置 `PULSE_SERVER_NAME` 环境变量：

```env
PULSE_SERVER_NAME=load-balancer
```

Pulse 配置文件还允许你自定义被监控的目录。

#### 用户任务

`UserJobs` 记录器捕获应用中派发任务的用户信息，用于在 [Application Usage](#application-usage-card) 卡片上展示。

你可以选择性地调整[采样率](#sampling)和忽略的任务模式。

#### 用户请求

`UserRequests` 记录器捕获向应用发起请求的用户信息，用于在 [Application Usage](#application-usage-card) 卡片上展示。

你可以选择性地调整[采样率](#sampling)和忽略的 URL 模式。

### 过滤

如前所述，许多[记录器](#recorders)都提供通过配置根据条目的值（例如请求的 URL）来"忽略"传入条目的能力。但有时根据其他因素（例如当前已认证的用户）过滤记录会很有用。要过滤这些记录，你可以向 Pulse 的 `filter` 方法传入一个闭包。通常，`filter` 方法应在应用 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Entry;
use Laravel\Pulse\Facades\Pulse;
use Laravel\Pulse\Value;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Pulse::filter(function (Entry|Value $entry) {
        return Auth::user()->isNotAdmin();
    });

    // ...
}
```

## 性能

Pulse 的设计初衷是无需额外基础设施即可接入现有应用。不过，对于高流量应用，有几种方法可以消除 Pulse 可能对应用性能产生的影响。

### 使用不同的数据库

对于高流量应用，你可能倾向于为 Pulse 使用专用的数据库连接，以避免影响应用数据库。

你可以通过设置 `PULSE_DB_CONNECTION` 环境变量来自定义 Pulse 使用的[数据库连接](/docs/{{version}}/database#configuration)。

```env
PULSE_DB_CONNECTION=pulse
```

### Redis 摄取

> [!WARNING]
> Redis 摄取要求 Redis 6.2 或更高版本，并且应用的 Redis 客户端驱动需配置为 `phpredis` 或 `predis`。

默认情况下，在 HTTP 响应发送给客户端或任务处理完成后，Pulse 会将条目直接存储到[配置的数据库连接](#using-a-different-database)；不过，你可以使用 Pulse 的 Redis 摄取驱动将条目发送到 Redis 流。可以通过配置 `PULSE_INGEST_DRIVER` 环境变量来启用：

```ini
PULSE_INGEST_DRIVER=redis
```

默认情况下，Pulse 会使用你默认的[Redis 连接](/docs/{{version}}/redis#configuration)，但你可以通过 `PULSE_REDIS_CONNECTION` 环境变量自定义：

```ini
PULSE_REDIS_CONNECTION=pulse
```

> [!WARNING]
> 使用 Redis 摄取驱动时，你的 Pulse 安装应始终使用与 Redis 驱动的队列不同的 Redis 连接（如适用）。

使用 Redis 摄取时，你需要运行 `pulse:work` 命令来监控流，并将条目从 Redis 移动到 Pulse 的数据库表中。

```php
php artisan pulse:work
```

> [!NOTE]
> 要让 `pulse:work` 进程在后台持续运行，应使用 Supervisor 之类的进程监视器，以确保 Pulse 工作进程不会停止运行。

由于 `pulse:work` 命令是一个长生命周期进程，如果不重启，它将无法感知代码库的变更。你应在应用部署过程中通过调用 `pulse:restart` 命令来优雅地重启该命令：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)存储重启信号，因此在使用此功能前，你应确认应用已正确配置了缓存驱动。

### 采样

默认情况下，Pulse 会捕获应用中发生的每一个相关事件。对于高流量应用，这可能会导致仪表盘需要聚合数以百万计的数据库行，尤其是较长的时间段。

你可以改为在某些 Pulse 数据记录器上启用"采样"。例如，在 [User Requests](#user-requests-recorder) 记录器上将采样率设为 `0.1`，意味着你只记录约 10% 的访问你应用的请求。在仪表盘中，数值会被放大并加上 `~` 前缀，表示它们为近似值。

一般来说，某个指标拥有的条目越多，你就能在不过多牺牲准确性的情况下将采样率设得越低。

### 修剪

一旦存储的条目超出仪表盘时间窗口，Pulse 会自动修剪它们。修剪在摄取数据时发生，采用可通过 Pulse [配置文件](#configuration)自定义的抽奖机制。

### 处理 Pulse 异常

如果在捕获 Pulse 数据时发生了异常（例如无法连接到存储数据库），Pulse 会静默失败，以避免影响你的应用。

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

## 自定义卡片

Pulse 允许你构建自定义卡片来展示与应用特定需求相关的数据。Pulse 使用 [Livewire](https://livewire.laravel.com)，因此在构建你的第一个自定义卡片前，你可能想[查阅其文档](https://livewire.laravel.com/docs)。

### 卡片组件

在 Laravel Pulse 中创建自定义卡片，首先要继承基础的 `Card` Livewire 组件并定义相应的视图：

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

使用 Livewire 的 [懒加载](https://livewire.laravel.com/docs/lazy) 特性时，`Card` 组件会自动提供一个占位符，该占位符会遵循传入组件的 `cols` 和 `rows` 属性。

编写 Pulse 卡片对应的视图时，你可以利用 Pulse 的 Blade 组件来获得一致的外观与体验：

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

`$cols`、`$rows`、`$class` 和 `$expand` 变量应传递给它们各自的 Blade 组件，以便从仪表盘视图自定义卡片布局。你可能还希望在视图中包含 `wire:poll.5s=""` 属性，使卡片自动更新。

定义好 Livewire 组件和模板后，该卡片就可以被引入到你的[仪表盘视图](#dashboard-customization)中：

```blade
<x-pulse>
    ...

    <livewire:pulse.top-sellers cols="4" />
</x-pulse>
```

> [!NOTE]
> 如果你的卡片包含在一个扩展包中，你需要使用 `Livewire::component` 方法向 Livewire 注册该组件。

### 样式

如果你的卡片需要 Pulse 自带的类和组件之外的额外样式，有几种方式为卡片引入自定义 CSS。

#### Laravel Vite 集成

如果你的自定义卡片位于应用代码库中，并且你正在使用 Laravel 的 [Vite 集成](/docs/{{version}}/vite)，你可以更新 `vite.config.js` 文件，为卡片引入一个专用的 CSS 入口点：

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

#### CSS 文件

对于其他使用场景（包括包含在扩展包中的 Pulse 卡片），你可以通过在 Livewire 组件上定义一个 `css` 方法（返回 CSS 文件的路径）来指示 Pulse 加载额外的样式表：

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

当该卡片被引入到仪表盘时，Pulse 会自动将该文件的内容包含在一个 `<style>` 标签中，因此无需将其发布到 `public` 目录。

#### Tailwind CSS

使用 Tailwind CSS 时，你应创建一个专用的 CSS 入口点。以下示例排除了 Tailwind 的 [Preflight](https://tailwindcss.com/docs/preflight) 基础样式（Pulse 已包含），并使用 CSS 选择器限定 Tailwind 的作用范围，以避免与 Pulse 的 Tailwind 类冲突：

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

你还需要在卡片视图中包含一个与入口点中 CSS 选择器匹配的 `id` 或 `class` 属性：

```blade
<x-pulse::card id="top-sellers" :cols="$cols" :rows="$rows" class="$class">
    ...
</x-pulse::card>
```

### 数据捕获与聚合

自定义卡片可以从任何地方获取并展示数据；不过，你可能希望利用 Pulse 强大且高效的数据记录与聚合系统。

#### 捕获条目

Pulse 允许你使用 `Pulse::record` 方法记录"条目"：

```php
use Laravel\Pulse\Facades\Pulse;

Pulse::record('user_sale', $user->id, $sale->amount)
    ->sum()
    ->count();
```

提供给 `record` 方法的第一个参数是你正在记录的条目的 `type`，第二个参数是决定聚合数据如何分组的 `key`。对于大多数聚合方法，你还需要指定一个要聚合的 `value`。在上例中，被聚合的值是 `$sale->amount`。然后你可以调用一个或多个聚合方法（例如 `sum`），以便 Pulse 将预聚合的值捕获到"桶"中，便于后续高效检索。

可用的聚合方法有：

* `avg`
* `count`
* `max`
* `min`
* `sum`

> [!NOTE]
> 在构建捕获当前已认证用户 ID 的卡片扩展包时，你应使用 `Pulse::resolveAuthenticatedUserId()` 方法，该方法会遵循对应用所做的任何[用户解析器自定义](#dashboard-resolving-users)。

#### 检索聚合数据

继承 Pulse 的 `Card` Livewire 组件时，你可以使用 `aggregate` 方法检索仪表盘当前查看时间段内的聚合数据：

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

`aggregate` 方法返回一个由 PHP `stdClass` 对象组成的集合。每个对象会包含之前捕获的 `key` 属性，以及每个被请求聚合对应的键：

```blade
@foreach ($topSellers as $seller)
    {{ $seller->key }}
    {{ $seller->sum }}
    {{ $seller->count }}
@endforeach
```

Pulse 主要从预聚合的桶中检索数据；因此，指定的聚合必须已使用 `Pulse::record` 方法预先捕获。最旧的桶通常会部分落在时间段之外，因此 Pulse 会聚合最旧的条目来填补空缺，从而得到整个时间段的准确值，而无需在每次轮询请求时聚合整个时间段。

你还可以使用 `aggregateTotal` 方法检索某个给定类型的总值。例如，以下方法会检索所有用户销售的总和，而不是按用户分组。

```php
$total = $this->aggregateTotal('user_sale', 'sum');
```

#### 展示用户

当处理以用户 ID 作为键的聚合时，你可以使用 `Pulse::resolveUsers` 方法将键解析为用户记录：

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

`find` 方法返回一个包含 `name`、`extra` 和 `avatar` 键的对象，你可以选择性地将其直接传递给 `<x-pulse::user-card>` Blade 组件：

```blade
<x-pulse::user-card :user="{{ $seller->user }}" :stats="{{ $seller->sum }}" />
```

#### 自定义记录器

扩展包作者可能希望提供记录器类，以便用户配置数据的捕获。

记录器在应用 `config/pulse.php` 配置文件的 `recorders` 部分注册：

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

记录器可以通过指定 `$listen` 属性来监听事件。Pulse 会自动注册监听器并调用记录器的 `record` 方法：

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
