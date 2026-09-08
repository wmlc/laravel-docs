# 服务提供者

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
    - [Register 方法](#the-register-method)
    - [Boot 方法](#the-boot-method)
- [注册提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

<a name="introduction"></a>
## 简介

服务提供者是所有 Laravel 应用引导流程的中心。你自己的应用以及 Laravel 的所有核心服务，都是通过服务提供者完成引导的。

但是，我们所说的"引导"是什么意思呢？通常，我们指的是**注册**各种内容，包括注册服务容器绑定、事件监听器、中间件，甚至路由。服务提供者是配置应用的中心场所。

Laravel 在内部使用数十个服务提供者来引导其核心服务，例如邮件器、队列、缓存等等。其中许多提供者是"延迟"提供者，这意味着它们不会在每个请求上都加载，而只会在它们提供的服务确实被需要时才加载。

所有用户自定义的服务提供者都注册在 `bootstrap/providers.php` 文件中。在下面的文档中，你将学习如何编写自己的服务提供者，并将它们注册到 Laravel 应用中。

> [!NOTE]
> 如果你想了解更多关于 Laravel 如何处理请求及其内部工作方式的信息，请查看我们的 Laravel [请求生命周期](/docs/{{version}}/lifecycle)文档。

<a name="writing-service-providers"></a>
## 编写服务提供者

所有服务提供者都继承自 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含 `register` 和 `boot` 方法。在 `register` 方法中，你应该**只将内容绑定到[服务容器](/docs/{{version}}/container)中**。你绝不应该尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。

Artisan CLI 可以通过 `make:provider` 命令生成新的提供者。Laravel 会自动将你的新提供者注册到应用的 `bootstrap/providers.php` 文件中：

```shell
php artisan make:provider RiakServiceProvider
```

<a name="the-register-method"></a>
### Register 方法

如前所述，在 `register` 方法中，你应该只将内容绑定到[服务容器](/docs/{{version}}/container)中。你绝不应该尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。否则，你可能会意外使用到尚未加载的服务提供者所提供的服务。

让我们来看一个基础的服务提供者。在服务提供者的任何方法中，你始终可以访问 `$app` 属性，它提供了对服务容器的访问：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection(config('riak'));
        });
    }
}
```

这个服务提供者只定义了一个 `register` 方法，并使用该方法在服务容器中定义了 `App\Services\Riak\Connection` 的一个实现。如果你还不熟悉 Laravel 的服务容器，请查看[它的文档](/docs/{{version}}/container)。

<a name="the-bindings-and-singletons-properties"></a>
#### `bindings` 和 `singletons` 属性

如果你的服务提供者注册了许多简单的绑定，你可能希望使用 `bindings` 和 `singletons` 属性，而不是手动注册每个容器绑定。当框架加载服务提供者时，它会自动检查这些属性并注册其中的绑定：

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
     * All of the container bindings that should be registered.
     *
     * @var array
     */
    public $bindings = [
        ServerProvider::class => DigitalOceanServerProvider::class,
    ];

    /**
     * All of the container singletons that should be registered.
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
### Boot 方法

那么，如果我们需要在服务提供者中注册一个[视图合成器](/docs/{{version}}/views#view-composers)该怎么办？这应该在 `boot` 方法中完成。**该方法在所有其他服务提供者注册之后才会被调用**，这意味着你可以访问框架已注册的所有其他服务：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
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
#### Boot 方法依赖注入

你可以为服务提供者的 `boot` 方法类型提示所需依赖。[服务容器](/docs/{{version}}/container)会自动注入你需要的任何依赖：

```php
use Illuminate\Contracts\Routing\ResponseFactory;

/**
 * Bootstrap any application services.
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

所有服务提供者都注册在 `bootstrap/providers.php` 配置文件中。该文件返回一个数组，其中包含应用服务提供者的类名：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
];
```

当你调用 `make:provider` Artisan 命令时，Laravel 会自动将生成的提供者添加到 `bootstrap/providers.php` 文件中。不过，如果你手动创建了提供者类，则应手动将提供者类添加到数组中：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

<a name="deferred-providers"></a>
## 延迟提供者

如果你的提供者**只**在[服务容器](/docs/{{version}}/container)中注册绑定，你可以选择将其注册延迟到某个已注册绑定确实被需要时。延迟加载此类提供者会提升应用的性能，因为它不会在每个请求中都从文件系统加载。

Laravel 会编译并存储延迟服务提供者所提供的所有服务列表，以及其服务提供者类的名称。然后，只有当你尝试解析其中一个服务时，Laravel 才会加载该服务提供者。

要延迟提供者的加载，请实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口，并定义一个 `provides` 方法。`provides` 方法应返回该提供者注册的服务容器绑定：

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
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection($app['config']['riak']);
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [Connection::class];
    }
}
```
