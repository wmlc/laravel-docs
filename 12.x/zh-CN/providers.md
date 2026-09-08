# 服务提供者

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
    - [`register` 方法](#the-register-method)
    - [`boot` 方法](#the-boot-method)
- [注册服务提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

<a name="introduction"></a>
## 简介

服务提供者（Service Provider）是所有 Laravel 应用引导的核心所在。你自己的应用以及 Laravel 的所有核心服务，都是通过服务提供者来引导的。

那么，「引导」是什么意思？一般来说，我们指的是**注册**各种东西，包括注册服务容器绑定、事件监听器、中间件，甚至路由。服务提供者是配置应用的中心位置。

Laravel 内部使用数十个服务提供者来引导其核心服务，例如邮件、队列、缓存等。其中许多提供者是「延迟」提供者，也就是说，它们不会在每次请求时都加载，而只在其提供的服务真正被需要时才加载。

所有用户定义的服务提供者都注册在 `bootstrap/providers.php` 文件中。在接下来的文档中，你将学习如何编写自己的服务提供者，并将其注册到 Laravel 应用中。

> [!NOTE]
> 如果想进一步了解 Laravel 如何处理请求及其内部工作机制，请查阅我们关于 Laravel [请求生命周期](/docs/{{version}}/lifecycle)的文档。

<a name="writing-service-providers"></a>
## 编写服务提供者

所有服务提供者都继承 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含 `register` 和 `boot` 两个方法。在 `register` 方法中，你应当**只将内容绑定到[服务容器（Service Container）](/docs/{{version}}/container)**。切勿尝试在 `register` 方法中注册任何事件监听器、路由或其他任何功能。

Artisan CLI 可以通过 `make:provider` 命令生成新的服务提供者。Laravel 会自动将新生成的提供者注册到应用的 `bootstrap/providers.php` 文件中：

```shell
php artisan make:provider RiakServiceProvider
```

<a name="the-register-method"></a>
### `register` 方法

如前所述，在 `register` 方法中，你应当只将内容绑定到[服务容器](/docs/{{version}}/container)。切勿尝试在 `register` 方法中注册任何事件监听器、路由或其他任何功能。否则，你可能会不小心使用某个尚未加载的服务提供者所提供的服务。

让我们看一个基本的服务提供者。在任何服务提供者的方法中，你始终可以访问 `$app` 属性，通过它可以访问服务容器：

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

这个服务提供者只定义了一个 `register` 方法，并在该方法中向服务容器定义了 `App\Services\Riak\Connection` 的实现。如果你还不熟悉 Laravel 的服务容器，请查阅[它的文档](/docs/{{version}}/container)。

<a name="the-bindings-and-singletons-properties"></a>
#### `bindings` 和 `singletons` 属性

如果你的服务提供者要注册许多简单绑定，可以使用 `bindings` 和 `singletons` 属性，而不必手动逐个注册容器绑定。框架加载该服务提供者时，会自动检查这些属性并注册其中的绑定：

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
### `boot` 方法

那么，如果我们需要在服务提供者中注册一个[视图 composer](/docs/{{version}}/views#view-composers)，该怎么办？这应当在 `boot` 方法中完成。**该方法会在所有其他服务提供者注册完成之后调用**，也就是说，你可以访问框架已注册的所有其他服务：

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

<a name="boot-method-dependency-injection"></a>
#### `boot` 方法依赖注入

你可以为服务提供者的 `boot` 方法声明类型提示依赖。[服务容器](/docs/{{version}}/container)会自动注入你需要的所有依赖：

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

<a name="registering-providers"></a>
## 注册服务提供者

所有服务提供者都注册在 `bootstrap/providers.php` 配置文件中。该文件返回一个数组，包含应用所有服务提供者的类名：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
];
```

当你执行 `make:provider` Artisan 命令时，Laravel 会自动将生成的提供者添加到 `bootstrap/providers.php` 文件中。但如果你手动创建了提供者类，就应自行将该类添加到数组中：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

<a name="deferred-providers"></a>
## 延迟提供者

如果你的提供者**只**在[服务容器](/docs/{{version}}/container)中注册绑定，可以选择推迟其注册，直到其中的某个绑定真正被需要时再注册。延迟加载此类提供者可以提升应用的性能，因为它不必在每次请求时都从文件系统加载。

Laravel 会编译并保存所有延迟服务提供者提供的服务列表，以及对应的服务提供者类名。之后，只有当你尝试解析其中某个服务时，Laravel 才会加载该服务提供者。

要延迟加载一个提供者，需要实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义 `provides` 方法。`provides` 方法应返回该提供者注册的服务容器绑定：

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
     * 获取提供者提供的服务。
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [Connection::class];
    }
}
```
