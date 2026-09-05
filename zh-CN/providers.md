# 服务提供者

## 简介

服务提供者是 Laravel 应用全部引导（Bootstrap）流程的核心所在。你自己的应用，以及 Laravel 的所有核心服务，都通过服务提供者完成引导。

但是，我们所说的"引导"是什么意思？通常，我们是指**注册**各种内容，包括注册服务容器绑定、事件监听器、中间件（Middleware），甚至是路由（Route）。服务提供者是配置应用的核心所在。

Laravel 在内部使用众多服务提供者来引导其核心服务，例如邮件、队列、缓存等。这些服务提供者中有许多是"延迟"服务提供者，意味着它们不会在每次请求（Request）时都加载，而只在实际需要其所提供的服务时才加载。

所有用户定义的服务提供者都注册在 `bootstrap/providers.php` 文件中。在下面的文档中，你将学习如何编写自己的服务提供者并将其注册到 Laravel 应用中。

> [!NOTE]
> 如果你想进一步了解 Laravel 如何处理请求以及其内部工作机制，请查阅我们关于 Laravel [请求生命周期](/docs/{{version}}/lifecycle) 的文档。

## 编写服务提供者

所有服务提供者都继承自 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含一个 `register` 和一个 `boot` 方法。在 `register` 方法中，你应当**只向[服务容器（Service Container）](/docs/{{version}}/container)绑定内容**。切勿在 `register` 方法中尝试注册任何事件监听器、路由（Route）或其他任何功能。

Artisan 命令行工具可通过 `make:provider` 命令生成一个新的服务提供者。Laravel 会自动将你的新服务提供者注册到应用的 `bootstrap/providers.php` 文件中：

```shell
php artisan make:provider RiakServiceProvider
```

### register 方法

如前所述，在 `register` 方法中，你应当只向[服务容器（Service Container）](/docs/{{version}}/container)绑定内容。切勿在 `register` 方法中尝试注册任何事件监听器、路由（Route）或其他任何功能。否则，你可能会意外使用到尚未加载的服务提供者所提供的服务。

我们来看一个基础的服务提供者。在服务提供者的任何方法中，你始终可以访问 `$app` 属性，它提供了对服务容器的访问：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection(config('riak'));
        });
    }
}
```

这个服务提供者只定义了一个 `register` 方法，并用该方法在服务容器中定义了 `App\Services\Riak\Connection` 的实现。如果你还不熟悉 Laravel 的服务容器，请查阅[它的文档](/docs/{{version}}/container)。

#### `bindings` 与 `singletons` 属性

如果你的服务提供者注册了许多简单的绑定，你可能希望使用 `bindings` 和 `singletons` 属性，而不是手动注册每一个容器绑定。当框架加载该服务提供者时，会自动检查这些属性并注册其中的绑定：

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
     * 应当注册的所有容器绑定。
     *
     * @var array
     */
    public $bindings = [
        ServerProvider::class => DigitalOceanServerProvider::class,
    ];

    /**
     * 应当注册的所有容器单例。
     *
     * @var array
     */
    public $singletons = [
        DowntimeNotifier::class => PingdomDowntimeNotifier::class,
        ServerProvider::class => ServerToolsProvider::class,
    ];
}
```

### boot 方法

那么，如果我们需要在服务提供者中注册一个[视图合成器](/docs/{{version}}/views#view-composers)该怎么做？这应当在 `boot` 方法中完成。**该方法在所有其他服务提供者都注册完成之后才会被调用**，这意味着你可以访问框架已注册的所有其他服务：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        View::composer('view', function () {
            // ...
        });
    }
}
```

#### Boot 方法依赖注入

你可以为服务提供者 `boot` 方法的依赖添加类型提示。服务容器（Service Container）会自动注入你所需的任何依赖：

```php
use Illuminate\Contracts\Routing\ResponseFactory;

/**
 * 引导任意应用服务。
 */
public function boot(ResponseFactory $response): void
{
    $response->macro('serialized', function (mixed $value) {
        // ...
    });
}
```

## 注册服务提供者

所有服务提供者都注册在 `bootstrap/providers.php` 配置文件中。该文件返回一个数组，其中包含应用的服务提供者类名：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
];
```

当你调用 `make:provider` Artisan 命令时，Laravel 会自动将生成的服务提供者添加到 `bootstrap/providers.php` 文件中。但是，如果你是手动创建了服务提供者类，则应手动将该服务提供者类添加到数组中：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

## 延迟服务提供者

如果你的服务提供者**只**在[服务容器（Service Container）](/docs/{{version}}/container)中注册绑定，你可以选择将其注册延迟到实际需要其中某个已注册绑定时再进行。延迟加载此类服务提供者可以提升应用性能，因为它不会在每次请求（Request）时都从文件系统加载。

Laravel 会编译并存储一份由延迟服务提供者提供的所有服务的列表，以及其服务提供者类的名称。然后，只有当你尝试解析其中某个服务时，Laravel 才会加载该服务提供者。

要延迟加载某个服务提供者，需实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义一个 `provides` 方法。`provides` 方法应返回该服务提供者注册的服务容器绑定：

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
     * 注册任意应用服务。
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
