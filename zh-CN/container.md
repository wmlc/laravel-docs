# 服务容器

## 介绍

Laravel 服务容器是一个用于管理类依赖、执行依赖注入的强大工具。所谓依赖注入，本质上是这样一回事：类的依赖通过构造函数，或在某些情况下通过 "setter" 方法，被"注入"到类中。

我们看一个简单的示例：

```php
<?php

namespace App\Http\Controllers;

use App\Services\AppleMusic;
use Illuminate\View\View;

class PodcastController extends Controller
{
    /**
     * 创建一个新的控制器实例。
     */
    public function __construct(
        protected AppleMusic $apple,
    ) {}

    /**
     * 显示指定播客的信息。
     */
    public function show(string $id): View
    {
        return view('podcasts.show', [
            'podcast' => $this->apple->findPodcast($id)
        ]);
    }
}
```

在这个示例中，`PodcastController` 需要从某个数据源（例如 Apple Music）获取播客。因此，我们会**注入**一个能够获取播客的服务。由于服务是通过注入方式传入的，我们就能在测试应用时轻松地"模拟（mock）"该服务，或者为其创建一个虚拟实现。

深入理解 Laravel 服务容器，对构建一个强大的大型应用，乃至为 Laravel 核心本身贡献代码，都是至关重要的。

### 零配置解析

如果某个类没有依赖，或者只依赖于其他具体类（而不是接口），那么容器无需任何额外配置就能解析它。例如，你可以在 `routes/web.php` 文件中编写如下代码：

```php
<?php

class Service
{
    // ...
}

Route::get('/', function (Service $service) {
    dd($service::class);
});
```

在这个示例中，访问应用的 `/` 路由会自动解析 `Service` 类，并将其注入到路由处理器中。这具有变革性的意义：你可以一边开发应用，一边享受依赖注入的便利，而无需担心配置文件变得越来越臃肿。

所幸，你在构建 Laravel 应用时编写的许多类都会自动经由容器获得它们的依赖，包括 [控制器](/topic/Laravel%2013.x/d6vro4rv3g.html)、[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)、[中间件](/topic/Laravel%2013.x/rwyl2exvz8.html) 等等。此外，你还可以在 [队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 的 `handle` 方法里类型提示依赖。一旦你体验过这种零配置的自动依赖注入，就再也不想回到过去那种写法了。

### 何时使用容器

得益于零配置解析，你经常会直接在路由、控制器、事件监听器等位置类型提示依赖，根本不需要手动与容器打交道。例如，你可以在路由定义中类型提示 `Illuminate\Http\Request` 对象，从而便捷地访问当前请求。即使我们从未与容器交互就写出了这样的代码，它依然会在幕后为我们完成依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在很多情况下，依靠自动依赖注入与 [Facades](/topic/Laravel%2013.x/569x508yep.html)，即便你完全不需要手动从容器中绑定或解析任何东西，也能构建出 Laravel 应用。**那么，什么时候才需要手动与容器交互呢？** 来看两种情况。

第一种情况：你写的类实现了某个接口，而你希望在路由或类构造函数中类型提示该接口，此时就必须告诉容器该如何解析这个接口。第二种情况：你正在[编写一个 Laravel 包](/topic/Laravel%2013.x/2qvpx1z93m.html) 并希望分享给其他 Laravel 开发者，这时可能需要把包内的服务绑定到容器中。

## 绑定

### 绑定基础

#### 简单绑定

几乎所有服务容器绑定都会注册在 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 中，因此下面的示例都会演示在那种上下文里使用容器的方式。

在服务提供者中，可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法来注册一个绑定，把想要注册的类或接口名，连同一个返回该类实例的闭包一起传入：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

请注意，我们把容器本身作为参数接收给了 resolver。接下来就可以用容器来解析我们正在构建对象的子依赖。

如前所述，你通常会在服务提供者里与容器交互；不过，如果你想在服务提供者之外操作容器，也可以通过 `App` [Facade](/topic/Laravel%2013.x/569x508yep.html) 来完成：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

你可以使用 `bindIf` 方法，仅在尚未为指定类型注册绑定时才进行绑定：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

为了方便起见，你也可以省略单独传递你想要注册的类或接口名，让 Laravel 从传入 `bind` 方法的闭包返回值类型中推断：

```php
App::bind(function (Application $app): Transistor {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果一个类不依赖任何接口，那么无需把它绑定到容器中。容器不需要被告知该如何构建这些对象，因为它可以通过反射自动解析它们。

#### 绑定单例

`singleton` 方法将一个类或接口绑定到容器中，使其在整个应用生命周期内只解析一次。一旦某个单例绑定被解析过，后续对容器的调用都会返回同一个对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `singletonIf` 方法，仅在尚未为指定类型注册单例绑定时才进行注册：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

#### `Singleton` 属性

另一种方式：你可以使用 `#[Singleton]` 属性来标记某个接口或类，向容器表明只应解析一次：

```php
<?php

namespace App\Services;

use Illuminate\Container\Attributes\Singleton;

#[Singleton]
class Transistor
{
    // ...
}
```

#### 绑定作用域单例

`scoped` 方法将一个类或接口绑定到容器中，使其在一次 Laravel 请求 / 任务生命周期内只解析一次。虽然这个方法与 `singleton` 很像，但是 `scoped` 方法注册的实例会在 Laravel 应用开启新"生命周期"时被清空，例如 [Laravel Octane](/topic/Laravel%2013.x/d6vro1rv3g.html) worker 处理新请求时，或 Laravel [队列 worker](/topic/Laravel%2013.x/wevwmkz9l2.html) 处理新任务时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->scoped(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `scopedIf` 方法，仅在尚未为指定类型注册作用域绑定时才进行注册：

```php
$this->app->scopedIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

#### `Scoped` 属性

另一种方式：你可以使用 `#[Scoped]` 属性来标记某个接口或类，向容器表明它应在一次 Laravel 请求 / 任务生命周期内只解析一次：

```php
<?php

namespace App\Services;

use Illuminate\Container\Attributes\Scoped;

#[Scoped]
class Transistor
{
    // ...
}
```

#### 绑定实例

你还可以使用 `instance` 方法把一个已存在的对象实例绑定到容器中。该实例会在后续对容器的调用中始终被返回：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

### 将接口绑定到实现

服务容器的一个非常强大的特性是它能够将接口绑定到具体的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。写好 `RedisEventPusher` 实现类之后，就可以像下面这样把它注册到服务容器里：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这条语句告诉容器：当某个类需要 `EventPusher` 的实现时，应注入 `RedisEventPusher`。之后，我们就可以在由容器解析的类的构造函数中类型提示 `EventPusher` 接口。请记住，Laravel 应用里的控制器、事件监听器、中间件等各种类都是由容器解析的：

```php
use App\Contracts\EventPusher;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected EventPusher $pusher,
) {}
```

#### `Bind` 属性

Laravel 还提供了一个 `Bind` 属性以提升便利性。可以把这个属性应用到任何接口上，告诉 Laravel 每当请求该接口时应自动注入哪个实现。使用 `Bind` 属性时，无需在应用的服务提供者里做任何额外注册。

此外，可以在同一个接口上放置多个 `Bind` 属性，以针对不同的环境配置注入不同的实现：

```php
<?php

namespace App\Contracts;

use App\Services\FakeEventPusher;
use App\Services\RedisEventPusher;
use Illuminate\Container\Attributes\Bind;

#[Bind(RedisEventPusher::class)]
#[Bind(FakeEventPusher::class, environments: ['local', 'testing'])]
interface EventPusher
{
    // ...
}
```

此外，还可以应用 Singleton 与 Scoped 属性来指明这些容器绑定是只解析一次，还是在每次请求 / 任务生命周期内只解析一次：

```php
use App\Services\RedisEventPusher;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

#[Bind(RedisEventPusher::class)]
#[Singleton]
interface EventPusher
{
    // ...
}
```

对于依赖任意条件的绑定，可以使用 `BindWhen` 属性。闭包可以接收容器并返回 `true`，用于判断该绑定是否生效。`Bind` 与 `BindWhen` 属性会按照声明顺序依次求值：

```php
use App\Services\BetaEventPusher;
use Illuminate\Container\Attributes\BindWhen;
use Laravel\Pennant\Feature;

#[BindWhen(BetaEventPusher::class, static fn () => Feature::active('beta-events'))]
interface EventPusher
{
    // ...
}
```

> [!NOTE]
> `BindWhen` 属性需要 PHP 8.5 或更高版本。

### 上下文绑定

有时你可能会有两个类使用同一个接口，但希望向它们分别注入不同的实现。例如，两个控制器可能会依赖 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/topic/Laravel%2013.x/3xyq4r4vmq.html) 的不同实现。Laravel 提供了一套简洁流畅的接口来定义这种行为：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\VideoController;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

$this->app->when(PhotoController::class)
    ->needs(Filesystem::class)
    ->give(function () {
        return Storage::disk('local');
    });

$this->app->when([VideoController::class, UploadController::class])
    ->needs(Filesystem::class)
    ->give(function () {
        return Storage::disk('s3');
    });
```

### 上下文属性

由于上下文绑定经常用来注入驱动实现或配置值，Laravel 提供了一系列上下文绑定属性，让你不必在服务提供者里手动定义上下文绑定，就能注入这些类型的值。

例如，可以使用 `Storage` 属性注入一个指定的 [存储磁盘](/topic/Laravel%2013.x/qk9428ovw1.html)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Container\Attributes\Storage;
use Illuminate\Contracts\Filesystem\Filesystem;

class PhotoController extends Controller
{
    public function __construct(
        #[Storage('local')] protected Filesystem $filesystem
    ) {
        // ...
    }
}
```

除了 `Storage` 属性外，Laravel 还提供了 `Auth`、`Cache`、`Config`、`Context`、`DB`、`Give`、`Log`、`RequestAttribute`、`RouteParameter` 以及 Tag 属性：

```php
<?php

namespace App\Http\Controllers;

use App\Contracts\UserRepository;
use App\Models\Organization;
use App\Models\Photo;
use App\Repositories\DatabaseRepository;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Context;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Give;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\RequestAttribute;
use Illuminate\Container\Attributes\RouteParameter;
use Illuminate\Container\Attributes\Tag;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Database\Connection;
use Psr\Log\LoggerInterface;

class PhotoController extends Controller
{
    public function __construct(
        #[Auth('web')] protected Guard $auth,
        #[Cache('redis')] protected Repository $cache,
        #[Config('app.timezone')] protected string $timezone,
        #[Context('uuid')] protected string $uuid,
        #[Context('ulid', hidden: true)] protected string $ulid,
        #[DB('mysql')] protected Connection $connection,
        #[Give(DatabaseRepository::class)] protected UserRepository $users,
        #[Log('daily')] protected LoggerInterface $log,
        #[RequestAttribute('organization')] protected Organization $organization,
        #[RouteParameter] protected Photo $photo,
        #[Tag('reports')] protected iterable $reports,
    ) {
        // ...
    }
}
```

`RouteParameter` 属性会解析与变量名匹配的路由参数。如有需要，也可以显式指定要解析的路由参数名：`#[RouteParameter('photo')]`。

`RequestAttribute` 属性会解析当前请求 [属性包](https://symfony.com/doc/current/components/http_foundation.html#accessing-request-data) 中指定键下的值：`#[RequestAttribute('organization')]`。

此外，Laravel 还提供了一个 `CurrentUser` 属性，用于在路由或类中注入当前已认证用户：

```php
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

Route::get('/user', function (#[CurrentUser] User $user) {
    return $user;
})->middleware('auth');
```

#### 自定义属性

你可以通过实现 `Illuminate\Contracts\Container\ContextualAttribute` 契约来创建自定义上下文属性。容器会调用属性的 `resolve` 方法，该方法应返回要注入到使用该属性的类中的值。下面的示例将重新实现 Laravel 内置的 `Config` 属性：

```php
<?php

namespace App\Attributes;

use Attribute;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Container\ContextualAttribute;
use ReflectionParameter;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Config implements ContextualAttribute
{
    /**
     * 创建一个新的属性实例。
     */
    public function __construct(public string $key, public mixed $default = null)
    {
    }

    /**
     * 解析配置值。
     *
     * @param  self  $attribute
     * @param  \Illuminate\Contracts\Container\Container  $container
     * @param  \ReflectionParameter  $parameter
     * @return mixed
     */
    public static function resolve(self $attribute, Container $container, ReflectionParameter $parameter)
    {
        return $container->make('config')->get($attribute->key, $attribute->default);
    }
}
```

### 绑定基本类型

有时你写的类除了会接收一些注入的类之外，还需要注入像整数这样的原始类型值。这时可以使用上下文绑定，轻松注入类需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
    ->needs('$variableName')
    ->give($value);
```

有时一个类会依赖一组 打了标签 的实例数组。借助 `giveTagged` 方法，你可以一次性注入所有带有该标签的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果需要从应用的某个配置文件中注入值，可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

### 绑定类型化可变参数

有时你的类会通过可变参数接收一组类型化对象：

```php
<?php

namespace App\Models;

use App\Services\Logger;

class Firewall
{
    /**
     * 过滤器实例。
     *
     * @var array
     */
    protected $filters;

    /**
     * 创建一个新的类实例。
     */
    public function __construct(
        protected Logger $logger,
        Filter ...$filters,
    ) {
        $this->filters = $filters;
    }
}
```

通过上下文绑定，可以给 `give` 方法传入一个返回 `Filter` 实例数组的闭包，从而解析这个依赖：

```php
$this->app->when(Firewall::class)
    ->needs(Filter::class)
    ->give(function (Application $app) {
          return [
              $app->make(NullFilter::class),
              $app->make(ProfanityFilter::class),
              $app->make(TooLongFilter::class),
          ];
    });
```

为了方便起见，你也可以直接传入一个类名数组，每当 `Firewall` 需要 `Filter` 实例时就由容器解析：

```php
$this->app->when(Firewall::class)
    ->needs(Filter::class)
    ->give([
        NullFilter::class,
        ProfanityFilter::class,
        TooLongFilter::class,
    ]);
```

#### 可变参数标签依赖

有时类的可变参数会以某个具体类作为类型提示（如 `Report ...$reports`）。借助 `needs` 与 `giveTagged` 方法，可以轻松为该依赖注入所有具有该 标签 的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

### 标签

有时你可能需要一次性解析某一"类"的所有绑定。例如，你可能正在构建一个报表分析器，需要接收多个不同的 `Report` 接口实现。注册完 `Report` 各个实现之后，可以使用 `tag` 方法给它们分配标签：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

给服务打好标签之后，就可以通过容器的 `tagged` 方法一次性解析它们：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当某个服务被解析时，可以执行额外的代码来装饰或配置它。`extend` 方法接收两个参数：你想要扩展的服务类，以及一个返回修改后服务的闭包。闭包接收正在解析的服务实例以及容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

## 解析

### `make` 方法

可以使用 `make` 方法从容器中解析出类实例。`make` 方法接收你想要解析的类名或接口名：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果你某些类的依赖无法由容器解析，可以通过 `makeWith` 方法把这些依赖作为关联数组传入。例如，我们可以手动传入 `Transistor` 服务所需的 `$id` 构造函数参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

可以使用 `bound` 方法来判断某个类或接口是否在容器中显式绑定过：

```php
if ($this->app->bound(Transistor::class)) {
    // ...
}
```

如果你在服务提供者之外，某个无法访问 `$app` 变量的位置，也可以使用 `App` [Facade](/topic/Laravel%2013.x/569x508yep.html) 或 `app` [辅助函数](/topic/Laravel%2013.x/569x5d8yep.html) 从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望把 Laravel 容器实例本身注入到由容器解析的类里，可以在类的构造函数中类型提示 `Illuminate\Container\Container` 类：

```php
use Illuminate\Container\Container;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected Container $container,
) {}
```

### 自动注入

另一种更重要的方式是：在由容器解析的类（包括 [控制器](/topic/Laravel%2013.x/d6vro4rv3g.html)、[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)、[中间件](/topic/Laravel%2013.x/rwyl2exvz8.html) 等）的构造函数里直接类型提示依赖；此外，你也可以在 [队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 的 `handle` 方法里类型提示依赖。实践中，这正是容器解析绝大多数对象的方式。

例如，你可以在某个控制器的构造函数里类型提示某个应用自定义服务。该服务会被自动解析并注入到这个类中：

```php
<?php

namespace App\Http\Controllers;

use App\Services\AppleMusic;

class PodcastController extends Controller
{
    /**
     * 创建一个新的控制器实例。
     */
    public function __construct(
        protected AppleMusic $apple,
    ) {}

    /**
     * 显示指定播客的信息。
     */
    public function show(string $id): Podcast
    {
        return $this->apple->findPodcast($id);
    }
}
```

## 方法调用与注入

有时你希望在调用某个对象实例的方法时，让容器自动注入该方法的依赖。例如，给定下面这个类：

```php
<?php

namespace App;

use App\Services\AppleMusic;

class PodcastStats
{
    /**
     * 生成新的播客统计报表。
     */
    public function generate(AppleMusic $apple): array
    {
        return [
            // ...
        ];
    }
}
```

可以像下面这样通过容器调用 `generate` 方法：

```php
use App\PodcastStats;
use Illuminate\Support\Facades\App;

$stats = App::call([new PodcastStats, 'generate']);
```

`call` 方法接受任意 PHP callable。容器的 `call` 方法甚至可以用来调用闭包，并自动注入其依赖：

```php
use App\Services\AppleMusic;
use Illuminate\Support\Facades\App;

$result = App::call(function (AppleMusic $apple) {
    // ...
});
```

## 容器事件

服务容器每次解析对象时都会触发一个事件，可以使用 `resolving` 方法监听这个事件：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;

$this->app->resolving(Transistor::class, function (Transistor $transistor, Application $app) {
    // 当容器解析类型为 "Transistor" 的对象时调用...
});

$this->app->resolving(function (mixed $object, Application $app) {
    // 当容器解析任意类型的对象时调用...
});
```

可以看到，正在解析的对象会被传给回调，便于你在对象被交给使用者之前设置任何额外的属性。

### 重新绑定

`rebinding` 方法允许你监听某个服务被重新绑定到容器的事件——也就是该服务在初次绑定之后再次注册或被覆盖时触发。当你需要在每次某个绑定更新时同步更新依赖或调整行为时，这会很有用：

```php
use App\Contracts\PodcastPublisher;
use App\Services\SpotifyPublisher;
use App\Services\TransistorPublisher;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(PodcastPublisher::class, SpotifyPublisher::class);

$this->app->rebinding(
    PodcastPublisher::class,
    function (Application $app, PodcastPublisher $newInstance) {
        //
    },
);

// 新的绑定将触发 rebinding 闭包...
$this->app->bind(PodcastPublisher::class, TransistorPublisher::class);
```

## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md) 接口。因此，你可以类型提示 PSR-11 容器接口来获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    // ...
});
```

如果给定的标识符无法解析，会抛出异常。若该标识符从未绑定过，则异常类型为 `Psr\Container\NotFoundExceptionInterface`；若已绑定但无法解析，则异常类型为 `Psr\Container\ContainerExceptionInterface`。