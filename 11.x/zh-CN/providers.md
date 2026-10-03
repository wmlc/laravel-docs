# 服务提供者（Service Provider）

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
    - [register 方法](#the-register-method)
    - [boot 方法](#the-boot-method)
- [注册提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

<a name="introduction"></a>
## 简介

服务提供者（Service Provider）是 Laravel 应用所有引导工作的中心环节。你自己的应用以及 Laravel 的所有核心服务，都是通过服务提供者完成引导的。

那么，"引导"具体指什么？一般来说，它指的是**注册**各种东西，包括注册服务容器绑定、事件监听器、中间件，甚至路由。服务提供者是配置你的应用的核心位置。

Laravel 内部使用数十个服务提供者为 mailer、queue、cache 等核心服务完成引导。其中许多提供者属于"延迟加载"的提供者，也就是说它们不会在每个请求中都加载，只有当它们提供的服务真正被需要时才加载。

所有用户自定义的服务提供者都在 `bootstrap/providers.php` 文件中注册。在接下来的文档中，你将了解如何编写自己的服务提供者并注册到 Laravel 应用中。

> [!NOTE]
> 如果你想进一步了解 Laravel 如何处理请求以及内部工作原理，请查阅关于 Laravel [请求生命周期](/docs/{{version}}/lifecycle)的文档。

<a name="writing-service-providers"></a>
## 编写服务提供者

所有服务提供者都继承自 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含一个 `register` 方法和一个 `boot` 方法。在 `register` 方法中，你应当**只把东西绑定到[服务容器（Service Container）](/docs/{{version}}/container)**。绝不要在 `register` 方法中注册任何事件监听器、路由或其他功能。

Artisan CLI 可以通过 `make:provider` 命令生成新的服务提供者。Laravel 会自动把新的服务提供者注册到应用的 `bootstrap/providers.php` 文件中：

```shell
php artisan make:provider RiakServiceProvider
```

<a name="the-register-method"></a>
### register 方法

如前所述，在 `register` 方法中，你应当只把东西绑定到[服务容器](/docs/{{version}}/container)。绝不要在 `register` 方法中注册任何事件监听器、路由或其他功能。否则你可能不小心用到某个尚未加载的服务提供者所提供的服务。

我们来看一个基础的服务提供者。在服务提供者的任何方法中，你都可以访问 `$app` 属性，它提供了访问服务容器的途径：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection(config('riak'));
        });
    }
}
```

这个服务提供者只定义了 `register` 方法，并借助该方法在服务容器中定义了 `App\Services\Riak\Connection` 的一个实现。如果你还不熟悉 Laravel 的服务容器，请查阅[相关文档](/docs/{{version}}/container)。

<a name="the-bindings-and-singletons-properties"></a>
#### bindings 与 singletons 属性

如果你的服务提供者要注册许多简单的绑定，可以使用 `bindings` 和 `singletons` 属性，而不必手动逐个注册容器绑定。当框架加载该服务提供者时，会自动检查这两个属性并注册其中声明的绑定：

```php
<?php

namespace App\Providers;

use App\Contracts\DowntimeNotifier;
use App\Contracts\ServerProvider;
use App\Services\DigitalOceanServerProvider;
use App\Services\PingdomDowntimeNotifier;
use App\Services\ServerToolsProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 需要注册的所有容器绑定。
     *
     * @var array
     */
    public $bindings = [
        ServerProvider::class => DigitalOceanServerProvider::class,
    ];

    /**
     * 需要注册的所有容器单例。
     *
     * @var array
     */
    public $singletons = [
        DowntimeNotifier::class => PingdomDowntimeNotifier::class,
        ServerProvider::class => ServerToolsProvider::class,
    ];
}
```

<a name="the-boot-method"></a>
### boot 方法

那么，如果我们需要在自己的服务提供者中注册一个[视图 composers](/docs/{{version}}/views#view-composers)该怎么办？这应当在 `boot` 方法中完成。**该方法会在所有其他服务提供者都注册完毕之后被调用**，这意味着你可以访问框架已注册的所有其他服务：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        View::composer('view', function () {
            // ...
        });
    }
}
```

<a name="boot-method-dependency-injection"></a>
#### boot 方法的依赖注入

你可以为服务提供者的 `boot` 方法类型提示所需依赖。[服务容器](/docs/{{version}}/container)会自动注入你需要的任何依赖：

```php
use Illuminate\Contracts\Routing\ResponseFactory;

/**
 * 引导任何应用服务。
 */
public function boot(ResponseFactory $response): void
{
    $response->macro('serialized', function (mixed $value) {
        // ...
    });
}
```

<a name="registering-providers"></a>
## 注册提供者

所有服务提供者都在 `bootstrap/providers.php` 配置文件中注册。该文件返回一个数组，其中包含应用的服务提供者类名：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
];
```

当你执行 `make:provider` Artisan 命令时，Laravel 会自动把生成的服务提供者添加到 `bootstrap/providers.php` 文件中。不过，如果你是手动创建的服务提供者类，就应当手动把该提供者类添加到数组中：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

<a name="deferred-providers"></a>
## 延迟提供者

如果你的服务提供者**仅仅**是在[服务容器](/docs/{{version}}/container)中注册绑定，可以选择推迟它的注册，直到其中某个已注册的绑定真正被需要时才加载。推迟这类服务提供者的加载可以提升应用性能，因为它不必在每个请求中都从文件系统加载。

Laravel 会编译并存储一份由延迟服务提供者提供的所有服务列表，同时记录其服务提供者类名。只有当你尝试解析其中某个服务时，Laravel 才会加载对应的服务提供者。

要推迟某个服务提供者的加载，请实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义 `provides` 方法。`provides` 方法应返回该服务提供者注册的服务容器绑定：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection($app['config']['riak']);
        });
    }

    /**
     * 获取该服务提供者提供的服务。
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [Connection::class];
    }
}
```