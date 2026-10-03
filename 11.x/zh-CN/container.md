# 服务容器

- [简介](#introduction)
    - [零配置解析](#zero-configuration-resolution)
    - [何时使用容器](#when-to-use-the-container)
- [绑定](#binding)
    - [绑定基础](#binding-basics)
    - [把接口绑定到实现](#binding-interfaces-to-implementations)
    - [上下文绑定](#contextual-binding)
    - [上下文属性](#contextual-attributes)
    - [绑定基本类型](#binding-primitives)
    - [绑定类型化可变参数](#binding-typed-variadics)
    - [标签](#tagging)
    - [扩展绑定](#extending-bindings)
- [解析](#resolving)
    - [`make` 方法](#the-make-method)
    - [自动注入](#automatic-injection)
- [方法调用与注入](#method-invocation-and-injection)
- [容器事件](#container-events)
    - [重新绑定](#rebinding)
- [PSR-11](#psr-11)

<a name="introduction"></a>
## 简介

Laravel 的服务容器（Service Container）是一个用于管理类依赖和执行依赖注入的强大工具。依赖注入其实就是一个时髦的说法，它的含义是：类的依赖通过构造函数，或在某些情况下通过"setter"方法被"注入"到类中。

我们来看一个简单的示例：

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
     * 显示给定播客的信息。
     */
    public function show(string $id): View
    {
        return view('podcasts.show', [
            'podcast' => $this->apple->findPodcast($id)
        ]);
    }
}
```

在这个示例中，`PodcastController` 需要从 Apple Music 之类的数据源检索播客。因此，我们会**注入**一个能够检索播客的服务。由于该服务是被注入的，测试应用时我们就能轻松地"mock"（模拟）`AppleMusic` 服务，或为其创建一个虚拟实现。

深入理解 Laravel 服务容器，对于构建强大的大型应用以及为 Laravel 核心本身做出贡献都是必需的。

<a name="zero-configuration-resolution"></a>
### 零配置解析

如果一个类没有依赖，或者只依赖其他具体的类（而不是接口），容器就不需要被告知如何解析该类。例如，你可以在 `routes/web.php` 文件中放入以下代码：

```php
<?php

class Service
{
    // ...
}

Route::get('/', function (Service $service) {
    die($service::class);
});
```

在这个示例中，访问应用的 `/` 路由会自动解析 `Service` 类并把它注入到路由处理器中。这一点非常关键。它意味着你可以一边开发应用、一边享受依赖注入的便利，而不必担心臃肿的配置文件。

幸运的是，你构建 Laravel 应用时编写的许多类都会自动通过容器获得它们的依赖，其中包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中对依赖进行类型提示。一旦体验到自动、零配置依赖注入的力量，就会觉得没有它就无法继续开发。

<a name="when-to-use-the-container"></a>
### 何时使用容器

得益于零配置解析，你经常会在路由、控制器、事件监听器以及其他地方对依赖进行类型提示，却从未手动与容器交互。例如，你可能会在路由定义中类型提示 `Illuminate\Http\Request` 对象，从而轻松访问当前请求。即使我们编写这段代码时完全不必与容器交互，容器实际上在幕后管理着这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，得益于自动依赖注入和 [Facade](/docs/{{version}}/facades)，你可以**从不必**手动绑定或解析容器中的任何东西。**那么，你究竟什么时候才需要手动与容器交互呢？** 让我们来看两种情况。

第一，如果你编写了一个实现某接口的类，并希望在路由或类的构造函数中对该接口进行类型提示，你就必须[告诉容器如何解析该接口](#binding-interfaces-to-implementations)。第二，如果你正在[编写 Laravel 包](/docs/{{version}}/packages)并打算与其他 Laravel 开发者分享，就可能需要把自己的包服务绑定到容器中。

<a name="binding"></a>
## 绑定

<a name="binding-basics"></a>
### 绑定基础

<a name="simple-bindings"></a>
#### 简单绑定

你的服务容器绑定几乎都会在[服务提供者（Service Provider）](/docs/{{version}}/providers)中注册，因此下面的大多数示例都会在该上下文中演示容器的使用。

在服务提供者内部，你始终可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册绑定，传入希望注册的类名或接口名，以及一个返回该类实例的闭包：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

请注意，解析器会把容器自身作为一个参数接收过来。这样我们就可以用容器来解析正在构建的对象的子依赖。

如前所述，你通常会在服务提供者内部与容器交互；不过，如果你想在服务提供者之外与容器交互，也可以通过 `App` [Facade](/docs/{{version}}/facades)来做：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

你可以使用 `bindIf` 方法，仅在给定类型尚未注册绑定时才注册容器绑定：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果某个类不依赖任何接口，就没有必要把它绑定到容器中。容器无需被告知如何构建这些对象，因为它可以使用反射自动解析它们。

<a name="binding-a-singleton"></a>
#### 绑定单例

`singleton` 方法把一个类或接口绑定到容器中，该绑定只会被解析一次。单例绑定解析完成后，后续对容器的调用都会返回同一个对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `singletonIf` 方法，仅在给定类型尚未注册绑定时才注册单例容器绑定：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="binding-scoped"></a>
#### 绑定作用域单例

`scoped` 方法把一个类或接口绑定到容器中，该绑定在给定的 Laravel 请求 / 任务生命周期内只会被解析一次。该方法与 `singleton` 方法类似，但使用 `scoped` 方法注册的实例会在 Laravel 应用开启新的"生命周期"时被清空，例如 [Laravel Octane](/docs/{{version}}/octane) 工作进程处理新请求时，或 Laravel [队列工作进程](/docs/{{version}}/queues)处理新任务时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->scoped(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `scopedIf` 方法，仅在给定类型尚未注册绑定时才注册带作用域的容器绑定：

```php
$this->app->scopedIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="binding-instances"></a>
#### 绑定实例

你也可以使用 `instance` 方法把已有的对象实例绑定到容器中。后续对容器的调用始终会返回该实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

<a name="binding-interfaces-to-implementations"></a>
### 把接口绑定到实现

服务容器最强大的功能之一，是它能把一个接口绑定到给定的实现上。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。编写好 `EventPusher` 接口的 `RedisEventPusher` 实现后，就可以这样把它注册到服务容器：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这条语句告诉容器：当某个类需要 `EventPusher` 的实现时，应当注入 `RedisEventPusher`。现在，我们就可以在被容器解析的类的构造函数中类型提示 `EventPusher` 接口了。请记住，Laravel 应用中的控制器、事件监听器、中间件以及其他各类都是通过容器解析的：

```php
use App\Contracts\EventPusher;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected EventPusher $pusher,
) {}
```

<a name="contextual-binding"></a>
### 上下文绑定

有时你可能有两个类使用同一个接口，但希望向每个类注入不同的实现。例如，两个控制器可能依赖 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/{{version}}/contracts)的不同实现。Laravel 提供了一套简单、流畅的接口来定义这种行为：

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

<a name="contextual-attributes"></a>
### 上下文属性

由于上下文绑定常用于注入驱动实现或配置值，Laravel 提供了各种上下文绑定属性，让你无需在服务提供者中手动定义上下文绑定就能注入这些类型的值。

例如，`Storage` 属性可用于注入特定的[存储磁盘](/docs/{{version}}/filesystem)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Container\Attributes\Storage;
use Illuminate\Contracts\Filesystem\Filesystem;

class PhotoController extends Controller
{
    public function __construct(
        #[Storage('local')] protected Filesystem $filesystem
    )
    {
        // ...
    }
}
```

除了 `Storage` 属性之外，Laravel 还提供 `Auth`、`Cache`、`Config`、`DB`、`Log`、`RouteParameter` 和 [`Tag`](#tagging)属性：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Log;
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
        #[DB('mysql')] protected Connection $connection,
        #[Log('daily')] protected LoggerInterface $log,
        #[RouteParameter('photo')] protected Photo $photo,
        #[Tag('reports')] protected iterable $reports,
    )
    {
        // ...
    }
}
```

此外，Laravel 还提供了 `CurrentUser` 属性，用于把当前已认证的用户注入给定的路由或类：

```php
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

Route::get('/user', function (#[CurrentUser] User $user) {
    return $user;
})->middleware('auth');
```

<a name="defining-custom-attributes"></a>
#### 定义自定义属性

你可以通过实现 `Illuminate\Contracts\Container\ContextualAttribute` 契约来创建自己的上下文属性。容器会调用该属性的 `resolve` 方法，该方法应当解析出要注入到使用该属性的类中的值。在下面的示例中，我们会重新实现 Laravel 内置的 `Config` 属性：

```php
<?php

namespace App\Attributes;

use Attribute;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Container\ContextualAttribute;

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
     * @return mixed
     */
    public static function resolve(self $attribute, Container $container)
    {
        return $container->make('config')->get($attribute->key, $attribute->default);
    }
}
```

<a name="binding-primitives"></a>
### 绑定基本类型

有时你可能有一个类，它接收了一些被注入的类，但还需要注入一个诸如整数这样的基本类型值。你可以轻松地使用上下文绑定来注入类所需的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
    ->needs('$variableName')
    ->give($value);
```

有时一个类可能依赖一组[带标签](#tagging)的实例。使用 `giveTagged` 方法，你可以轻松地注入所有带有该标签的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果你需要从应用的某个配置文件中注入一个值，可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

<a name="binding-typed-variadics"></a>
### 绑定类型化可变参数

偶尔你可能有一个类通过可变参数形式的构造参数接收一组类型化对象：

```php
<?php

use App\Models\Filter;
use App\Services\Logger;

class Firewall
{
    /**
     * 各个过滤器实例。
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

借助上下文绑定，你可以在 `give` 方法中提供一个返回已解析 `Filter` 实例数组的闭包，来解析该依赖：

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

为方便起见，你也可以直接提供一个类名数组，每当 `Firewall` 需要 `Filter` 实例时都会由容器解析它们：

```php
$this->app->when(Firewall::class)
    ->needs(Filter::class)
    ->give([
        NullFilter::class,
        ProfanityFilter::class,
        TooLongFilter::class,
    ]);
```

<a name="variadic-tag-dependencies"></a>
#### 可变参数标签依赖

有时一个类可能具有以某个类作为类型提示的可变参数依赖（`Report ...$reports`）。借助 `needs` 和 `giveTagged` 方法，你可以轻松地为该依赖注入所有带有相应[标签](#tagging)的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

<a name="tagging"></a>
### 标签

偶尔你可能需要解析某一"类别"的全部绑定。例如，也许你正在构建一个报表分析器，它接收一组不同的 `Report` 接口实现。注册完这些 `Report` 实现后，你可以使用 `tag` 方法为它们分配一个标签：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

这些服务被打上标签后，你就可以通过容器的 `tagged` 方法轻松地一次性解析全部：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

<a name="extending-bindings"></a>
### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当某个服务被解析时，你可以运行额外的代码来装饰或配置该服务。`extend` 方法接受两个参数：要扩展的服务类，以及一个应当返回修改后服务的闭包。该闭包会接收正在被解析的服务和容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

<a name="resolving"></a>
## 解析

<a name="the-make-method"></a>
### `make` 方法

你可以使用 `make` 方法从容器中解析一个类实例。`make` 方法接受你希望解析的类名或接口名：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果你的某些依赖无法通过容器解析，你可以把它们作为关联数组传给 `makeWith` 方法来注入。例如，我们可以手动传入 `Transistor` 服务所需的 `$id` 构造参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

`bound` 方法可用于判断某个类或接口是否已在容器中被显式绑定：

```php
if ($this->app->bound(Transistor::class)) {
    // ...
}
```

如果你在服务提供者之外、且所在位置的代码无法访问 `$app` 变量，可以使用 `App` [Facade](/docs/{{version}}/facades)或 `app` [辅助函数](/docs/{{version}}/helpers#method-app)从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望把 Laravel 容器实例本身注入到某个由容器解析的类中，可以在类的构造函数上类型提示 `Illuminate\Container\Container` 类：

```php
use Illuminate\Container\Container;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected Container $container,
) {}
```

<a name="automatic-injection"></a>
### 自动注入

另一种方式非常重要：你可以在由容器解析的类的构造函数中对依赖进行类型提示，其中包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中对依赖进行类型提示。实际上，你的绝大多数对象都应当通过这种方式由容器解析。

例如，你可以在控制器的构造函数中类型提示由你的应用定义的某个服务。该服务会被自动解析并注入到该类中：

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
     * 显示给定播客的信息。
     */
    public function show(string $id): Podcast
    {
        return $this->apple->findPodcast($id);
    }
}
```

<a name="method-invocation-and-injection"></a>
## 方法调用与注入

有时你可能希望在某个对象实例上调用方法，同时让容器自动注入该方法的依赖。例如，给定下面的类：

```php
<?php

namespace App;

use App\Services\AppleMusic;

class PodcastStats
{
    /**
     * 生成一份新的播客统计报告。
     */
    public function generate(AppleMusic $apple): array
    {
        return [
            // ...
        ];
    }
}
```

你可以这样通过容器调用 `generate` 方法：

```php
use App\PodcastStats;
use Illuminate\Support\Facades\App;

$stats = App::call([new PodcastStats, 'generate']);
```

`call` 方法接受任何 PHP 可调用对象。容器的 `call` 方法甚至可以用来调用闭包，并自动注入其依赖：

```php
use App\Services\AppleMusic;
use Illuminate\Support\Facades\App;

$result = App::call(function (AppleMusic $apple) {
    // ...
});
```

<a name="container-events"></a>
## 容器事件

服务容器每次解析对象时都会触发一个事件。你可以使用 `resolving` 方法监听该事件：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;

$this->app->resolving(Transistor::class, function (Transistor $transistor, Application $app) {
    // 当容器解析 "Transistor" 类型的对象时调用...
});

$this->app->resolving(function (mixed $object, Application $app) {
    // 当容器解析任意类型的对象时调用...
});
```

如你所见，正在被解析的对象会被传给回调，这样你就可以在它交给使用者之前为该对象设置额外的属性。

<a name="rebinding"></a>
### 重新绑定

`rebinding` 方法允许你监听某个服务被重新绑定到容器的时刻，也就是在初次绑定之后被再次注册或覆盖时。当某个特定绑定每次更新时你都需要更新依赖或修改行为，这会非常有用：

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

// 新的绑定将触发重新绑定闭包...
$this->app->bind(PodcastPublisher::class, TransistorPublisher::class);
```

<a name="psr-11"></a>
## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md)接口。因此，你可以类型提示 PSR-11 容器接口，以获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    // ...
});
```

如果给定的标识符无法被解析，就会抛出异常。如果该标识符从未被绑定，异常将是 `Psr\Container\NotFoundExceptionInterface` 的实例。如果标识符已被绑定但无法解析，则会抛出 `Psr\Container\ContainerExceptionInterface` 的实例。
