# 服务容器（Service Container）

- [简介](#introduction)
    - [零配置解析](#zero-configuration-resolution)
    - [何时使用容器](#when-to-use-the-container)
- [绑定](#binding)
    - [绑定基础](#binding-basics)
    - [绑定接口到实现](#binding-interfaces-to-implementations)
    - [上下文绑定](#contextual-binding)
    - [上下文属性](#contextual-attributes)
    - [绑定基础类型](#binding-primitives)
    - [绑定可变参数](#binding-typed-variadics)
    - [标签](#tagging)
    - [扩展绑定](#extending-bindings)
- [解析](#resolving)
    - [make 方法](#the-make-method)
    - [自动注入](#automatic-injection)
- [方法调用与注入](#method-invocation-and-injection)
- [容器事件](#container-events)
    - [重新绑定](#rebinding)
- [PSR-11](#psr-11)

<a name="introduction"></a>
## 简介

Laravel 的服务容器（Service Container）是一个用于管理类依赖和执行依赖注入的强大工具。依赖注入这个花哨的词本质上是指：类的依赖通过构造函数「注入」到类中，某些情况下也会通过「setter」方法注入。

我们来看一个简单的例子：

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

在这个例子中，`PodcastController` 需要从诸如 Apple Music 之类的数据源检索播客。因此，我们将**注入**一个能够检索播客的服务。由于该服务是被注入的，在测试应用时，我们可以轻松地为 `AppleMusic` 服务「模拟」或创建一个虚拟实现。

深入理解 Laravel 服务容器，对于构建强大的大型应用、以及为 Laravel 核心本身做贡献来说，都至关重要。

<a name="zero-configuration-resolution"></a>
### 零配置解析

如果一个类没有任何依赖，或者只依赖于其他具体类（而非接口），那么容器无需被告知如何解析该类。例如，你可以在 `routes/web.php` 文件中放置以下代码：

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

在这个例子中，访问应用的 `/` 路由会自动解析 `Service` 类并将其注入到路由的处理程序中。这带来了革命性的变化。它意味着你可以开发应用并利用依赖注入，而无需担心臃肿的配置文件。

值得庆幸的是，在构建 Laravel 应用时，你编写的许多类都会通过容器自动接收它们的依赖，包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列作业](/docs/{{version}}/queues)的 `handle` 方法中类型提示依赖。一旦你体会到自动零配置依赖注入的威力，就无法离开它进行开发了。

<a name="when-to-use-the-container"></a>
### 何时使用容器

得益于零配置解析，你通常只需在路由、控制器、事件监听器等地方类型提示依赖，而无需手动与容器交互。例如，你可以在路由定义中类型提示 `Illuminate\Http\Request` 对象，以便轻松访问当前请求。虽然编写这些代码时我们完全不必与容器打交道，但它确实在幕后管理着这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，得益于自动依赖注入和 [Facade](/docs/{{version}}/facades)，你可以在构建 Laravel 应用时**完全**不需要手动向容器绑定或解析任何东西。**那么，什么时候需要手动与容器交互呢？**让我们来看看两种情况。

第一，如果你编写了一个实现某个接口的类，并希望在路由或类的构造函数中类型提示该接口，你必须[告诉容器如何解析该接口](#binding-interfaces-to-implementations)。第二，如果你正在[编写 Laravel 扩展包](/docs/{{version}}/packages)并计划与其他 Laravel 开发者分享，你可能需要将扩展包的服务绑定到容器中。

<a name="binding"></a>
## 绑定

<a name="binding-basics"></a>
### 绑定基础

<a name="simple-bindings"></a>
#### 简单绑定

你几乎所有的服务容器绑定都会在[服务提供者（Service Provider）](/docs/{{version}}/providers)中注册，因此这些示例大多会演示在该场景下使用容器。

在服务提供者中，你总是可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册一个绑定，将想要注册的类名或接口名与一个返回该类实例的闭包一起传递：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

注意，我们将容器本身作为参数传递给了解析器。接下来，我们可以使用容器来解析正在构建的对象的子依赖。

如前所述，你通常会在服务提供者中与容器交互；不过，如果你想在服务提供者之外与容器交互，可以通过 `App` [Facade](/docs/{{version}}/facades) 来完成：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

你可以使用 `bindIf` 方法，仅当给定类型尚未注册绑定时才注册容器绑定：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

为了方便，你可以省略要注册的类名或接口名参数，转而让 Laravel 根据你提供给 `bind` 方法的闭包的返回类型来推断类型：

```php
App::bind(function (Application $app): Transistor {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果类不依赖任何接口，则无需将其绑定到容器中。容器无需被告知如何构建这些对象，因为它可以使用反射自动解析它们。

<a name="binding-a-singleton"></a>
#### 绑定单例

`singleton` 方法将一个类或接口绑定到容器中，该绑定只应被解析一次。单例绑定被解析之后，后续对容器的调用将返回同一个对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `singletonIf` 方法，仅当给定类型尚未注册绑定时才注册单例容器绑定：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="singleton-attribute"></a>
#### 单例属性

另外，你也可以使用 `#[Singleton]` 属性标记一个接口或类，告知容器它只应被解析一次：

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

<a name="binding-scoped"></a>
#### 绑定作用域单例

`scoped` 方法将一个类或接口绑定到容器中，该绑定在给定的 Laravel 请求 / 作业生命周期内只应被解析一次。虽然这个方法与 `singleton` 方法类似，但使用 `scoped` 方法注册的实例会在 Laravel 应用开启新的「生命周期」时被清空，例如 [Laravel Octane](/docs/{{version}}/octane) 的 worker 处理新请求时，或 Laravel [队列 worker](/docs/{{version}}/queues) 处理新作业时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->scoped(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `scopedIf` 方法，仅当给定类型尚未注册绑定时才注册作用域容器绑定：

```php
$this->app->scopedIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="scoped-attribute"></a>
#### 作用域属性

另外，你也可以使用 `#[Scoped]` 属性标记一个接口或类，告知容器它在给定的 Laravel 请求 / 作业生命周期内只应被解析一次：

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

<a name="binding-instances"></a>
#### 绑定实例

你还可以使用 `instance` 方法将一个已存在的对象实例绑定到容器中。后续对容器的调用将始终返回给定的实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

<a name="binding-interfaces-to-implementations"></a>
### 绑定接口到实现

服务容器有一个非常强大的特性：能够将接口绑定到给定的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。编写完该接口的 `RedisEventPusher` 实现后，我们可以像这样将它注册到服务容器：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这条语句告诉容器：当某个类需要 `EventPusher` 的实现时，应注入 `RedisEventPusher`。现在，我们可以在由容器解析的类的构造函数中类型提示 `EventPusher` 接口。请记住，Laravel 应用中的控制器、事件监听器、中间件以及各种其他类型的类，始终都是通过容器解析的：

```php
use App\Contracts\EventPusher;

/**
 * 创建一个新的类实例。
 */
public function __construct(
    protected EventPusher $pusher,
) {}
```

<a name="bind-attribute"></a>
#### Bind 属性

为了更加方便，Laravel 还提供了 `Bind` 属性。你可以将该属性应用于任何接口，告知 Laravel 每当请求该接口时应自动注入哪个实现。使用 `Bind` 属性时，无需在应用的服务提供者中执行任何额外的服务注册。

此外，可以在一个接口上放置多个 `Bind` 属性，从而为特定一组环境配置不同的注入实现：

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

此外，还可以应用 [Singleton](#singleton-attribute) 和 [Scoped](#scoped-attribute) 属性，来指明容器绑定应只解析一次，还是在每个请求 / 作业生命周期内解析一次：

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

<a name="contextual-binding"></a>
### 上下文绑定

有时你可能有两个类使用同一个接口，但你希望为每个类注入不同的实现。例如，两个控制器可能依赖于 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/{{version}}/contracts)的不同实现。Laravel 为定义这种行为提供了一个简单、流式的接口：

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

由于上下文绑定通常用于注入驱动的实现或配置值，Laravel 提供了多种上下文绑定属性，让你无需在服务提供者中手动定义上下文绑定，即可注入这些类型的值。

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
    ) {
        // ...
    }
}
```

除了 `Storage` 属性之外，Laravel 还提供了 `Auth`、`Cache`、`Config`、`Context`、`DB`、`Give`、`Log`、`RouteParameter` 和 [Tag](#tagging) 属性：

```php
<?php

namespace App\Http\Controllers;

use App\Contracts\UserRepository;
use App\Models\Photo;
use App\Repositories\DatabaseRepository;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Context;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Give;
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
        #[Context('uuid')] protected string $uuid,
        #[Context('ulid', hidden: true)] protected string $ulid,
        #[DB('mysql')] protected Connection $connection,
        #[Give(DatabaseRepository::class)] protected UserRepository $users,
        #[Log('daily')] protected LoggerInterface $log,
        #[RouteParameter('photo')] protected Photo $photo,
        #[Tag('reports')] protected iterable $reports,
    ) {
        // ...
    }
}
```

此外，Laravel 还提供了 `CurrentUser` 属性，用于将当前已认证的用户注入到给定的路由或类中：

```php
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

Route::get('/user', function (#[CurrentUser] User $user) {
    return $user;
})->middleware('auth');
```

<a name="defining-custom-attributes"></a>
#### 定义自定义属性

你可以通过实现 `Illuminate\Contracts\Container\ContextualAttribute` 契约来创建自己的上下文属性。容器会调用你的属性的 `resolve` 方法，该方法应解析要注入到使用该属性的类中的值。在下面的例子中，我们将重新实现 Laravel 内置的 `Config` 属性：

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
### 绑定基础类型

有时你可能有一个类，它既接收一些被注入的类，又需要注入一个基础类型的值，比如整数。你可以轻松地使用上下文绑定来注入你的类可能需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
    ->needs('$variableName')
    ->give($value);
```

有时一个类可能依赖于一组带有[标签](#tagging)的实例。使用 `giveTagged` 方法，你可以轻松注入所有带有该标签的容器绑定：

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
### 绑定可变参数

有时，你可能有一个类，它通过可变构造函数参数接收一组类型化的对象数组：

```php
<?php

use App\Models\Filter;
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

使用上下文绑定，你可以向 `give` 方法提供一个返回已解析的 `Filter` 实例数组的闭包，来解析这个依赖：

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

为了方便，你也可以只提供一个类名数组，容器会在 `Firewall` 需要 `Filter` 实例时解析它们：

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

有时一个类可能有一个可变参数依赖，其类型提示为某个给定类（`Report ...$reports`）。使用 `needs` 和 `giveTagged` 方法，你可以轻松地为该依赖注入所有带有指定[标签](#tagging)的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

<a name="tagging"></a>
### 标签

有时，你可能需要解析某一「类别」的所有绑定。例如，假设你正在构建一个报表分析器，它接收一个由多个不同的 `Report` 接口实现组成的数组。注册好 `Report` 实现之后，你可以使用 `tag` 方法为它们分配一个标签：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

服务被打上标签后，你可以通过容器的 `tagged` 方法轻松解析它们全部：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

<a name="extending-bindings"></a>
### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当一个服务被解析时，你可以运行额外的代码来装饰或配置该服务。`extend` 方法接受两个参数：你要扩展的服务类，以及一个应返回修改后服务的闭包。闭包会接收正在解析的服务和容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

<a name="resolving"></a>
## 解析

<a name="the-make-method"></a>
### `make` 方法

你可以使用 `make` 方法从容器中解析类实例。`make` 方法接受你希望解析的类名或接口名：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果类的某些依赖无法通过容器解析，你可以将它们作为关联数组传入 `makeWith` 方法来注入。例如，我们可以手动传递 `Transistor` 服务所需的 `$id` 构造函数参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

`bound` 方法可用于判断一个类或接口是否已在容器中被显式绑定：

```php
if ($this->app->bound(Transistor::class)) {
    // ...
}
```

如果你在服务提供者之外的、无法访问 `$app` 变量的代码位置，可以使用 `App` [Facade](/docs/{{version}}/facades) 或 `app` [辅助函数](/docs/{{version}}/helpers#method-app)从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望让 Laravel 容器实例本身被注入到由容器解析的类中，可以在该类的构造函数中类型提示 `Illuminate\Container\Container` 类：

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

另外，很重要的一点是，你可以在由容器解析的类的构造函数中类型提示依赖，这类类包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列作业](/docs/{{version}}/queues)的 `handle` 方法中类型提示依赖。在实践中，你的大多数对象都应通过这种方式由容器解析。

例如，你可以在控制器的构造函数中类型提示由应用定义的服务。该服务会被自动解析并注入到类中：

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

有时，你可能希望在对象实例上调用一个方法，同时让容器自动注入该方法的依赖。例如，给定以下类：

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

你可以像这样通过容器调用 `generate` 方法：

```php
use App\PodcastStats;
use Illuminate\Support\Facades\App;

$stats = App::call([new PodcastStats, 'generate']);
```

`call` 方法接受任何 PHP callable。容器的 `call` 方法甚至可以在自动注入依赖的同时调用一个闭包：

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
    // 当容器解析任何类型的对象时调用...
});
```

如你所见，正在解析的对象会被传递给回调，让你可以在对象交给它的使用者之前，为其设置任何额外的属性。

<a name="rebinding"></a>
### 重新绑定

`rebinding` 方法允许你监听某个服务何时被重新绑定到容器，也就是说，它在初始绑定之后被再次注册或覆盖。当你需要在某个特定绑定每次更新时更新依赖或修改行为时，这个方法会很有用：

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

<a name="psr-11"></a>
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

如果给定的标识符无法被解析，将抛出异常。如果该标识符从未被绑定，异常将是 `Psr\Container\NotFoundExceptionInterface` 的实例。如果该标识符已被绑定但无法被解析，将抛出 `Psr\Container\ContainerExceptionInterface` 的实例。
