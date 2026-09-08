# 服务容器（Service Container）

- [简介](#introduction)
    - [零配置解析](#zero-configuration-resolution)
    - [何时使用容器](#when-to-use-the-container)
- [绑定](#binding)
    - [绑定基础](#binding-basics)
    - [绑定接口到实现](#binding-interfaces-to-implementations)
    - [上下文绑定](#contextual-binding)
    - [上下文属性](#contextual-attributes)
    - [绑定基本值](#binding-primitives)
    - [绑定类型化可变参数](#binding-typed-variadics)
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

Laravel 服务容器（Service Container）是一个用于管理类依赖和执行依赖注入的强大工具。依赖注入是一个花哨的说法，本质上意思是：类的依赖通过构造函数，或者在某些情况下通过“setter”方法“注入”到类中。

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

在此示例中，`PodcastController` 需要从像 Apple Music 这样的数据源检索播客。因此，我们将注入一个能够检索播客的服务。由于该服务是被注入的，我们在测试应用程序时可以轻松“模拟（mock）”，或者创建一个 `AppleMusic` 服务的虚拟实现。

深入理解 Laravel 服务容器对于构建强大、大型的应用程序，以及为 Laravel 核心本身做贡献，都是至关重要的。

<a name="zero-configuration-resolution"></a>
### 零配置解析

如果一个类没有依赖，或者只依赖于其他具体类（而非接口），则无需指示容器如何解析该类。例如，你可以将以下代码放在你的 `routes/web.php` 文件中：

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

在此示例中，访问应用程序的 `/` 路由会自动解析 `Service` 类并将其注入到你的路由处理器中。这改变了游戏规则。这意味着你可以开发应用程序并利用依赖注入，而无需担心臃肿的配置文件。

值得庆幸的是，你在构建 Laravel 应用程序时编写的许多类都会自动通过容器接收它们的依赖，包括 [控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware) 等等。此外，你可以在 [队列任务](/docs/{{version}}/queues) 的 `handle` 方法中类型提示依赖。一旦你体验过自动且零配置的依赖注入的强大之处，就再也无法在没有它的情况下开发了。

<a name="when-to-use-the-container"></a>
### 何时使用容器

得益于零配置解析，你通常会对路由、控制器、事件监听器以及其他地方的依赖进行类型提示，而无需手动与容器交互。例如，你可以在路由定义中对 `Illuminate\Http\Request` 对象进行类型提示，以便你可以轻松访问当前请求。尽管我们编写这段代码时从不需要与容器交互，但它在幕后管理着这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，得益于自动依赖注入和 [Facade](/docs/{{version}}/facades)，你可以在不**手动**从容器中绑定或解析任何东西的情况下构建 Laravel 应用程序。**那么，你什么时候会手动与容器交互呢？** 我们来看两种情况。

首先，如果你编写了一个实现某个接口的类，并且希望在路由或类的构造函数中对那个接口进行类型提示，你必须 [告诉容器如何解析该接口](#binding-interfaces-to-implementations)。其次，如果你正在 [编写一个计划与其他 Laravel 开发者分享的 Laravel 包](/docs/{{version}}/packages)，你可能需要将你的包的服务绑定到容器中。

<a name="binding"></a>
## 绑定

<a name="binding-basics"></a>
### 绑定基础

<a name="simple-bindings"></a>
#### 简单绑定

几乎你所有的服务容器绑定都会在 [服务提供者（Service Provider）](/docs/{{version}}/providers) 中注册，因此这些示例大多会演示在该上下文中使用容器。

在服务提供者中，你始终可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册一个绑定，传入我们希望注册的类或接口名，以及一个返回该类实例的闭包：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

请注意，我们接收容器本身作为解析器的参数。然后我们可以使用容器来解析正在构建的对象的子依赖。

如前所述，你通常会在服务提供者中与容器交互；不过，如果你希望在服务提供者之外与容器交互，可以通过 `App` [Facade](/docs/{{version}}/facades) 来实现：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

你可以使用 `bindIf` 方法仅在尚未为给定类型注册绑定时才注册一个容器绑定：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

为方便起见，你可以省略将要注册的单独的类或接口名参数，而是让 Laravel 从你提供给 `bind` 方法的闭包的返回类型推断该类型：

```php
App::bind(function (Application $app): Transistor {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果类不依赖任何接口，则无需将它们绑定到容器中。容器无需被指示如何构建这些对象，因为它可以使用反射自动解析这些对象。

<a name="binding-a-singleton"></a>
#### 绑定单例

`singleton` 方法将类或接口绑定到容器中，该绑定只应被解析一次。一旦解析了单例绑定，后续对容器的调用将返回相同的对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `singletonIf` 方法仅在尚未为给定类型注册绑定时才注册一个单例容器绑定：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="singleton-attribute"></a>
#### 单例属性

或者，你可以用 `#[Singleton]` 属性标记一个接口或类，以向容器指示它只应被解析一次：

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

`scoped` 方法将类或接口绑定到容器中，该绑定只应在给定的 Laravel 请求 / 任务生命周期内被解析一次。虽然该方法与 `singleton` 方法类似，但使用 `scoped` 方法注册的实例会在 Laravel 应用程序启动新的“生命周期”时被刷新，例如当 [Laravel Octane](/docs/{{version}}/octane) 工作进程处理新请求，或当 Laravel [队列工作进程](/docs/{{version}}/queues) 处理新任务时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->scoped(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `scopedIf` 方法仅在尚未为给定类型注册绑定时才注册一个作用域容器绑定：

```php
$this->app->scopedIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="scoped-attribute"></a>
#### 作用域属性

或者，你可以用 `#[Scoped]` 属性标记一个接口或类，以向容器指示它应在给定的 Laravel 请求 / 任务生命周期内被解析一次：

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

你也可以使用 `instance` 方法将一个已有的对象实例绑定到容器中。后续对容器的调用将始终返回该给定实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

<a name="binding-interfaces-to-implementations"></a>
### 绑定接口到实现

服务容器的一个非常强大的特性是它能够将接口绑定到给定的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。一旦我们编写好了这个接口的 `RedisEventPusher` 实现，我们就可以像这样将其注册到服务容器中：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这条语句告诉容器，当一个类需要 `EventPusher` 的实现时，应当注入 `RedisEventPusher`。现在我们可以在由容器解析的类的构造函数中对 `EventPusher` 接口进行类型提示。请记住，Laravel 应用程序中的控制器、事件监听器、中间件以及各种其他类型的类始终是通过容器解析的：

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

Laravel 还提供了一个 `Bind` 属性以方便使用。你可以将此属性应用到任何接口上，以告诉 Laravel 在请求该接口时应自动注入哪个实现。使用 `Bind` 属性时，无需在应用程序的服务提供者中执行任何额外的服务注册。

此外，可以在一个接口上放置多个 `Bind` 属性，以便为一组给定的环境配置不同的注入实现：

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

此外，可以应用 [Singleton](#singleton-attribute) 和 [Scoped](#scoped-attribute) 属性来指示容器绑定是应被解析一次，还是在每次请求 / 任务生命周期内解析一次：

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

对于依赖于任意条件的绑定，可以使用 `BindWhen` 属性。该闭包可以接收容器，并应在绑定应被应用并返回 `true`。`Bind` 与 `BindWhen` 属性会按照它们声明的顺序进行求值：

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

<a name="contextual-binding"></a>
### 上下文绑定

有时你可能有两个类使用了相同的接口，但你希望向每个类注入不同的实现。例如，两个控制器可能依赖于 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/{{version}}/contracts) 的不同实现。Laravel 提供了一个简单、流畅的接口来定义这种行为：

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

由于上下文绑定经常用于注入驱动或配置值的实现，Laravel 提供了一系列上下文绑定属性，允许在不手动于服务提供者中定义上下文绑定的情况下注入这些类型的值。

例如，`Storage` 属性可用于注入一个特定的 [存储磁盘](/docs/{{version}}/filesystem)：

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

除了 `Storage` 属性之外，Laravel 还提供 `Auth`、`Cache`、`Config`、`Context`、`DB`、`Give`、`Log`、`RequestAttribute`、`RouteParameter` 以及 [Tag](#tagging) 属性：

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

`RouteParameter` 属性会解析与变量名匹配的路由参数。如有需要，你可以显式指定路由参数名：`#[RouteParameter('photo')]`。

`RequestAttribute` 属性会解析当前请求的 [属性包](https://symfony.com/doc/current/components/http_foundation.html#accessing-request-data) 中给定键下存储的值：`#[RequestAttribute('organization')]`。

此外，Laravel 提供了一个 `CurrentUser` 属性，用于将当前已认证的用户注入到给定的路由或类中：

```php
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

Route::get('/user', function (#[CurrentUser] User $user) {
    return $user;
})->middleware('auth');
```

<a name="defining-custom-attributes"></a>
#### 定义自定义属性

你可以通过实现 `Illuminate\Contracts\Container\ContextualAttribute` 契约来创建自己的上下文属性。容器会调用你的属性的 `resolve` 方法，该方法应解析出应被注入到使用该属性的类中的值。在下面的示例中，我们将重新实现 Laravel 内置的 `Config` 属性：

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

<a name="binding-primitives"></a>
### 绑定基本值

有时你可能有一个类，它接收一些被注入的类，但也需要一个被注入的基本值，例如一个整数。你可以轻松地使用上下文绑定来注入你的类可能需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
    ->needs('$variableName')
    ->give($value);
```

有时一个类可能依赖于一组 [被标记](#tagging) 的实例。使用 `giveTagged` 方法，你可以轻松注入所有带有该标签的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果你需要从应用程序的某个配置文件中注入一个值，可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

<a name="binding-typed-variadics"></a>
### 绑定类型化可变参数

有时你可能有一个类，它通过可变构造函数参数接收一个类型化对象的数组：

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

使用上下文绑定，你可以通过向 `give` 方法提供一个返回已解析的 `Filter` 实例数组的闭包来解析该依赖：

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

为方便起见，你也可以直接提供一个由类名组成的数组，让容器在 `Firewall` 需要 `Filter` 实例时解析这些类：

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

有时一个类可能有一个被类型提示为给定类（`Report ...$reports`）的可变依赖。使用 `needs` 和 `giveTagged` 方法，你可以轻松注入所有带有该 [标签](#tagging) 的容器绑定，用于给定的依赖：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

<a name="tagging"></a>
### 标签

有时你可能需要解析某个特定“类别”的所有绑定。例如，也许你正在构建一个报告分析器，它接收一个由许多不同的 `Report` 接口实现组成的数组。在注册了 `Report` 实现之后，你可以使用 `tag` 方法为它们分配一个标签：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

一旦这些服务被标记，你就可以轻松地通过容器的 `tagged` 方法解析它们全部：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

<a name="extending-bindings"></a>
### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当一个服务被解析时，你可以运行额外的代码来装饰或配置该服务。`extend` 方法接受两个参数：你正在扩展的服务类，以及一个应当返回被修改服务的闭包。该闭包接收正在被解析的服务和容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

<a name="resolving"></a>
## 解析

<a name="the-make-method"></a>
### `make` 方法

你可以使用 `make` 方法从容器中解析一个类实例。`make` 方法接受你希望解析的类或接口名：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果你的某些类的依赖无法通过容器解析，你可以通过将依赖作为关联数组传入 `makeWith` 方法来注入它们。例如，我们可以手动传入 `Transistor` 服务所需的 `$id` 构造函数参数：

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

如果你在代码中无法访问 `$app` 变量的服务提供者之外，可以使用 `App` [Facade](/docs/{{version}}/facades) 或 `app` [辅助函数](/docs/{{version}}/helpers#method-app) 来从容器中解析一个类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望将 Laravel 容器实例本身注入到由容器解析的类中，可以在类的构造函数中对 `Illuminate\Container\Container` 类进行类型提示：

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

或者，同样重要的是，你可以在由容器解析的类的构造函数中对依赖进行类型提示，包括 [控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware) 等等。此外，你可以在 [队列任务](/docs/{{version}}/queues) 的 `handle` 方法中对依赖进行类型提示。在实践中，这是你的对象应当被容器解析的主要方式。

例如，你可以在控制器的构造函数中对应用程序定义的服务进行类型提示。该服务将自动被解析并注入到类中：

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

有时你可能希望在对象实例上调用一个方法，同时允许容器自动注入该方法的依赖。例如，给定以下类：

```php
<?php

namespace App;

use App\Services\AppleMusic;

class PodcastStats
{
    /**
     * 生成一个新的播客统计报告。
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

`call` 方法接受任何 PHP 可调用对象。容器的 `call` 方法甚至可以用于调用一个闭包，同时自动注入它的依赖：

```php
use App\Services\AppleMusic;
use Illuminate\Support\Facades\App;

$result = App::call(function (AppleMusic $apple) {
    // ...
});
```

<a name="container-events"></a>
## 容器事件

服务容器在每次解析一个对象时都会触发一个事件。你可以使用 `resolving` 方法监听该事件：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;

$this->app->resolving(Transistor::class, function (Transistor $transistor, Application $app) {
    // 当容器解析 "Transistor" 类型的对象时调用……
});

$this->app->resolving(function (mixed $object, Application $app) {
    // 当容器解析任何类型的对象时调用……
});
```

如你所见，正在被解析的对象会被传给回调，允许你在对象交给其使用者之前在该对象上设置任何额外的属性。

<a name="rebinding"></a>
### 重新绑定

`rebinding` 方法允许你监听一个服务何时被重新绑定到容器，这意味着它在首次绑定之后被再次注册或覆盖。当你需要在每次更新某个特定绑定时更新依赖或修改行为时，这会很有用：

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

// 新的绑定会触发重新绑定闭包……
$this->app->bind(PodcastPublisher::class, TransistorPublisher::class);
```

<a name="psr-11"></a>
## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md) 接口。因此，你可以对 PSR-11 容器接口进行类型提示，以获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    // ...
});
```

如果给定的标识符无法被解析，则会抛出异常。如果该标识符从未被绑定，异常将是 `Psr\Container\NotFoundExceptionInterface` 的一个实例。如果标识符已被绑定但无法被解析，则会抛出 `Psr\Container\ContainerExceptionInterface` 的一个实例。
