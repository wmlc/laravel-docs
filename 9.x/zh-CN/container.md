# 服务容器

- [简介](#introduction)
    - [零配置解析](#zero-configuration-resolution)
    - [何时使用容器](#when-to-use-the-container)
- [绑定](#binding)
    - [绑定基础](#binding-basics)
    - [将接口绑定到实现](#binding-interfaces-to-implementations)
    - [上下文绑定](#contextual-binding)
    - [绑定基本类型](#binding-primitives)
    - [绑定类型化可变参数](#binding-typed-variadics)
    - [标签](#tagging)
    - [扩展绑定](#extending-bindings)
- [解析](#resolving)
    - [make 方法](#the-make-method)
    - [自动注入](#automatic-injection)
- [方法调用与注入](#method-invocation-and-injection)
- [容器事件](#container-events)
- [PSR-11](#psr-11)

<a name="introduction"></a>
## 简介

Laravel 服务容器（Service Container）是一个用于管理类依赖和执行依赖注入的强大工具。依赖注入是一个花哨的术语，其本质含义是：类的依赖通过构造函数或某些情况下的「setter」方法「注入」到类中。

让我们看一个简单的示例：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Repositories\UserRepository;
use App\Models\User;

class UserController extends Controller
{
    /**
     * 用户仓库实现。
     *
     * @var UserRepository
     */
    protected $users;

    /**
     * 创建新的控制器实例。
     *
     * @param  UserRepository  $users
     * @return void
     */
    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    /**
     * 显示指定用户的资料。
     *
     * @param  int  $id
     * @return Response
     */
    public function show($id)
    {
        $user = $this->users->find($id);

        return view('user.profile', ['user' => $user]);
    }
}
```

在此示例中，`UserController` 需要从数据源检索用户。因此，我们将**注入**一个能够检索用户的服务。在此上下文中，我们的 `UserRepository` 很可能使用 [Eloquent](/docs/{{version}}/eloquent) 从数据库检索用户信息。然而，由于仓库是通过注入方式提供的，我们可以轻松将其替换为另一个实现。在测试应用时，我们也能够轻松地「mock」或创建 `UserRepository` 的虚拟实现。

深入理解 Laravel 服务容器对于构建强大的大型应用以及为 Laravel 核心本身做出贡献都是必不可少的。

<a name="zero-configuration-resolution"></a>
### 零配置解析

如果一个类没有依赖，或仅依赖于其他具体类（而非接口），则无需告知容器如何解析该类。例如，你可以在 `routes/web.php` 文件中放置以下代码：

```php
<?php

class Service
{
    //
}

Route::get('/', function (Service $service) {
    die(get_class($service));
});
```

在此示例中，访问应用的 `/` 路由时会自动解析 `Service` 类并将其注入到路由处理器中。这是革命性的变化。这意味着你可以开发应用并利用依赖注入，而无需担心臃肿的配置文件。

幸运的是，在构建 Laravel 应用时你将编写的大多数类都会通过容器自动接收其依赖，包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中类型提示依赖。一旦你体验到自动零配置依赖注入的强大功能，就再也离不开它了。

<a name="when-to-use-the-container"></a>
### 何时使用容器

得益于零配置解析，你通常会在路由、控制器、事件监听器等地方类型提示依赖，而无需手动与容器交互。例如，你可以在路由定义中类型提示 `Illuminate\Http\Request` 对象，以便轻松访问当前请求。尽管我们无需与容器交互即可编写此代码，但容器在幕后管理着这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，得益于自动依赖注入和 [Facade](/docs/{{version}}/facades)，你可以构建 Laravel 应用而**无需**手动绑定或从容器中解析任何东西。**那么，什么时候需要手动与容器交互呢？** 让我们来看看两种情况。

首先，如果你编写了一个实现接口的类，并希望在路由或类构造函数中类型提示该接口，你必须[告知容器如何解析该接口](#binding-interfaces-to-implementations)。其次，如果你正在[编写 Laravel 包](/docs/{{version}}/packages)并计划与其他 Laravel 开发者共享，你可能需要将包的服务绑定到容器中。

<a name="binding"></a>
## 绑定

<a name="binding-basics"></a>
### 绑定基础

<a name="simple-bindings"></a>
#### 简单绑定

几乎所有的服务容器绑定都会在[服务提供者](/docs/{{version}}/providers)中注册，因此这些示例大多会在该上下文中演示容器的使用。

在服务提供者中，你始终可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册绑定，传入我们希望注册的类或接口名称，以及一个返回类实例的闭包：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$this->app->bind(Transistor::class, function ($app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

注意，我们将容器本身作为解析器的参数接收。然后我们可以使用容器来解析正在构建的对象的子依赖。

如前所述，你通常会在服务提供者中与容器交互；但是，如果你希望在服务提供者之外与容器交互，可以通过 `App` [Facade](/docs/{{version}}/facades) 来实现：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function ($app) {
    // ...
});
```

> **Note**
> 如果类不依赖任何接口，则无需将其绑定到容器中。容器无需被告知如何构建这些对象，因为它可以使用反射自动解析这些对象。

<a name="binding-a-singleton"></a>
#### 绑定单例

`singleton` 方法将类或接口绑定到容器中，该类或接口只应被解析一次。单例绑定一旦被解析，后续对容器的调用将返回相同的对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$this->app->singleton(Transistor::class, function ($app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="binding-scoped"></a>
#### 绑定作用域单例

`scoped` 方法将类或接口绑定到容器中，该类或接口在给定的 Laravel 请求/任务生命周期内只应被解析一次。虽然此方法类似于 `singleton` 方法，但使用 `scoped` 方法注册的实例会在 Laravel 应用启动新「生命周期」时被刷新，例如当 [Laravel Octane](/docs/{{version}}/octane) 工作进程处理新请求时，或当 Laravel [队列工作进程](/docs/{{version}}/queues)处理新任务时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$this->app->scoped(Transistor::class, function ($app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="binding-instances"></a>
#### 绑定实例

你还可以使用 `instance` 方法将已存在的对象实例绑定到容器中。给定的实例在后续对容器的调用中将始终被返回：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

<a name="binding-interfaces-to-implementations"></a>
### 将接口绑定到实现

服务容器的一个强大功能是能够将接口绑定到给定的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。一旦我们编写了该接口的 `RedisEventPusher` 实现，就可以像这样将其注册到服务容器中：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

此语句告知容器，当类需要 `EventPusher` 的实现时应注入 `RedisEventPusher`。现在，我们可以在由容器解析的类的构造函数中类型提示 `EventPusher` 接口。请记住，Laravel 应用中的控制器、事件监听器、中间件以及各种其他类型的类始终通过容器解析：

```php
use App\Contracts\EventPusher;

/**
 * 创建新的类实例。
 *
 * @param  \App\Contracts\EventPusher  $pusher
 * @return void
 */
public function __construct(EventPusher $pusher)
{
    $this->pusher = $pusher;
}
```

<a name="contextual-binding"></a>
### 上下文绑定

有时你可能有两个类使用相同的接口，但你希望为每个类注入不同的实现。例如，两个控制器可能依赖于 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/{{version}}/contracts)的不同实现。Laravel 提供了一个简单、流畅的接口来定义此行为：

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

<a name="binding-primitives"></a>
### 绑定基本类型

有时你可能有一个类接收一些注入的类，但还需要注入一个基本类型值（如整数）。你可以轻松使用上下文绑定来注入类可能需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
          ->needs('$variableName')
          ->give($value);
```

有时类可能依赖于一个[已标记](#tagging)实例的数组。使用 `giveTagged` 方法，你可以轻松注入具有该标签的所有容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果你需要从应用的配置文件中注入值，可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

<a name="binding-typed-variadics"></a>
### 绑定类型化可变参数

有时你可能有一个类，通过可变参数构造函数参数接收一组类型化对象：

```php
<?php

use App\Models\Filter;
use App\Services\Logger;

class Firewall
{
    /**
     * 日志器实例。
     *
     * @var \App\Services\Logger
     */
    protected $logger;

    /**
     * 过滤器实例。
     *
     * @var array
     */
    protected $filters;

    /**
     * 创建新的类实例。
     *
     * @param  \App\Services\Logger  $logger
     * @param  array  $filters
     * @return void
     */
    public function __construct(Logger $logger, Filter ...$filters)
    {
        $this->logger = $logger;
        $this->filters = $filters;
    }
}
```

使用上下文绑定，你可以通过为 `give` 方法提供一个返回已解析 `Filter` 实例数组的闭包来解析此依赖：

```php
$this->app->when(Firewall::class)
          ->needs(Filter::class)
          ->give(function ($app) {
                return [
                    $app->make(NullFilter::class),
                    $app->make(ProfanityFilter::class),
                    $app->make(TooLongFilter::class),
                ];
          });
```

为方便起见，你也可以直接提供一个类名数组，当 `Firewall` 需要 `Filter` 实例时由容器解析：

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

有时类可能有一个可变参数依赖，类型提示为给定类（`Report ...$reports`）。使用 `needs` 和 `giveTagged` 方法，你可以轻松为给定依赖注入具有该[标签](#tagging)的所有容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

<a name="tagging"></a>
### 标签

有时你可能需要解析某个「类别」的所有绑定。例如，也许你正在构建一个报告分析器，它接收包含许多不同 `Report` 接口实现的数组。注册 `Report` 实现后，你可以使用 `tag` 方法为它们分配标签：

```php
$this->app->bind(CpuReport::class, function () {
    //
});

$this->app->bind(MemoryReport::class, function () {
    //
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

服务被标记后，你可以通过容器的 `tagged` 方法轻松解析它们全部：

```php
$this->app->bind(ReportAnalyzer::class, function ($app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

<a name="extending-bindings"></a>
### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当服务被解析时，你可以运行额外的代码来装饰或配置该服务。`extend` 方法接受两个参数：你要扩展的服务类和一个应返回修改后服务的闭包。闭包接收正在解析的服务和容器实例：

```php
$this->app->extend(Service::class, function ($service, $app) {
    return new DecoratedService($service);
});
```

<a name="resolving"></a>
## 解析

<a name="the-make-method"></a>
### `make` 方法

你可以使用 `make` 方法从容器中解析类实例。`make` 方法接受你希望解析的类或接口的名称：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果类的某些依赖无法通过容器解析，你可以通过将它们作为关联数组传入 `makeWith` 方法来注入。例如，我们可以手动传递 `Transistor` 服务所需的 `$id` 构造函数参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

如果你在服务提供者之外的代码位置中无法访问 `$app` 变量，可以使用 `App` [Facade](/docs/{{version}}/facades) 或 `app` [辅助函数](/docs/{{version}}/helpers#method-app)从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望将 Laravel 容器实例本身注入到由容器解析的类中，可以在类的构造函数中类型提示 `Illuminate\Container\Container` 类：

```php
use Illuminate\Container\Container;

/**
 * 创建新的类实例。
 *
 * @param  \Illuminate\Container\Container  $container
 * @return void
 */
public function __construct(Container $container)
{
    $this->container = $container;
}
```

<a name="automatic-injection"></a>
### 自动注入

或者，更重要的是，你可以在由容器解析的类的构造函数中类型提示依赖，包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你还可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中类型提示依赖。在实践中，这是大多数对象应当由容器解析的方式。

例如，你可以在控制器的构造函数中类型提示应用定义的仓库。该仓库将被自动解析并注入到类中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;

class UserController extends Controller
{
    /**
     * 用户仓库实例。
     *
     * @var \App\Repositories\UserRepository
     */
    protected $users;

    /**
     * 创建新的控制器实例。
     *
     * @param  \App\Repositories\UserRepository  $users
     * @return void
     */
    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    /**
     * 显示指定 ID 的用户。
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }
}
```

<a name="method-invocation-and-injection"></a>
## 方法调用与注入

有时你可能希望在对象实例上调用方法，同时让容器自动注入该方法的依赖。例如，给定以下类：

```php
<?php

namespace App;

use App\Repositories\UserRepository;

class UserReport
{
    /**
     * 生成新的用户报告。
     *
     * @param  \App\Repositories\UserRepository  $repository
     * @return array
     */
    public function generate(UserRepository $repository)
    {
        // ...
    }
}
```

你可以像这样通过容器调用 `generate` 方法：

```php
use App\UserReport;
use Illuminate\Support\Facades\App;

$report = App::call([new UserReport, 'generate']);
```

`call` 方法接受任何 PHP 可调用对象。容器的 `call` 方法甚至可以用于调用闭包，同时自动注入其依赖：

```php
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\App;

$result = App::call(function (UserRepository $repository) {
    // ...
});
```

<a name="container-events"></a>
## 容器事件

服务容器每次解析对象时都会触发一个事件。你可以使用 `resolving` 方法监听此事件：

```php
use App\Services\Transistor;

$this->app->resolving(Transistor::class, function ($transistor, $app) {
    // 当容器解析 "Transistor" 类型的对象时调用...
});

$this->app->resolving(function ($object, $app) {
    // 当容器解析任何类型的对象时调用...
});
```

如你所见，正在解析的对象将被传递给回调，允许你在对象交给其消费者之前为其设置任何额外的属性。

<a name="psr-11"></a>
## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md) 接口。因此，你可以类型提示 PSR-11 容器接口来获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    //
});
```

如果给定的标识符无法解析，将抛出异常。如果标识符从未被绑定，异常将是 `Psr\Container\NotFoundExceptionInterface` 的实例。如果标识符已绑定但无法解析，将抛出 `Psr\Container\ContainerExceptionInterface` 的实例。
