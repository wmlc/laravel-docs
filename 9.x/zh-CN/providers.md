# 服务提供者（Service Provider）

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
    - [register 方法](#the-register-method)
    - [boot 方法](#the-boot-method)
- [注册提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

<a name="introduction"></a>
## 简介

服务提供者是所有 Laravel 应用引导（bootstrap）的中心位置。你自己的应用以及 Laravel 的所有核心服务，都是通过服务提供者进行引导的。

但是，我们所说的"引导"是什么意思？通常来说，我们指的是**注册**事物，包括注册服务容器（Service Container）绑定、事件监听器、中间件，甚至路由。服务提供者是配置应用的中心位置。

如果你打开 Laravel 自带的 `config/app.php` 文件，会看到一个 `providers` 数组。其中列出了将为你的应用加载的所有服务提供者类。默认情况下，该数组中列出了一组 Laravel 核心服务提供者。这些提供者负责引导 Laravel 的核心组件，例如邮件器、队列、缓存等。其中许多提供者是"延迟"提供者，意味着它们不会在每次请求时都加载，而仅在实际需要其提供的服务时才加载。

在本概述中，你将学习如何编写自己的服务提供者，并将其注册到 Laravel 应用中。

> **Note**  
> 如果你想进一步了解 Laravel 如何处理请求及其内部工作原理，请查阅关于 Laravel [请求生命周期](/docs/{{version}}/lifecycle)的文档。

<a name="writing-service-providers"></a>
## 编写服务提供者

所有服务提供者都继承 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含 `register` 和 `boot` 方法。在 `register` 方法中，你应当**仅将事物绑定到[服务容器](/docs/{{version}}/container)**。切勿在 `register` 方法中尝试注册任何事件监听器、路由或其他功能。

Artisan CLI 可通过 `make:provider` 命令生成新的提供者：

```shell
php artisan make:provider RiakServiceProvider
```

<a name="the-register-method"></a>
### register 方法

如前所述，在 `register` 方法中，你应当仅将事物绑定到[服务容器](/docs/{{version}}/container)。切勿在 `register` 方法中尝试注册任何事件监听器、路由或其他功能。否则，你可能会意外使用到一个尚未加载的服务提供者所提供的服务。

让我们来看一个基础的服务提供者。在任何服务提供者方法中，你始终可以访问 `$app` 属性，该属性提供了对服务容器的访问：

    <?php

    namespace App\Providers;

    use App\Services\Riak\Connection;
    use Illuminate\Support\ServiceProvider;

    class RiakServiceProvider extends ServiceProvider
    {
        /**
         * 注册任意应用服务。
         *
         * @return void
         */
        public function register()
        {
            $this->app->singleton(Connection::class, function ($app) {
                return new Connection(config('riak'));
            });
        }
    }

该服务提供者仅定义了 `register` 方法，并使用该方法在服务容器中定义 `App\Services\Riak\Connection` 的实现。如果你尚不熟悉 Laravel 的服务容器，请查阅[其文档](/docs/{{version}}/container)。

<a name="the-bindings-and-singletons-properties"></a>
#### `bindings` 与 `singletons` 属性

如果你的服务提供者注册了许多简单绑定，可以使用 `bindings` 和 `singletons` 属性，而无需手动注册每个容器绑定。当框架加载该服务提供者时，会自动检查这些属性并注册其绑定：

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
         * 所有应注册的容器绑定。
         *
         * @var array
         */
        public $bindings = [
            ServerProvider::class => DigitalOceanServerProvider::class,
        ];

        /**
         * 所有应注册的容器单例。
         *
         * @var array
         */
        public $singletons = [
            DowntimeNotifier::class => PingdomDowntimeNotifier::class,
            ServerProvider::class => ServerToolsProvider::class,
        ];
    }

<a name="the-boot-method"></a>
### boot 方法

那么，如果我们需要在服务提供者中注册一个[视图合成器](/docs/{{version}}/views#view-composers)该怎么办？这应当在 `boot` 方法中完成。**该方法会在所有其他服务提供者注册完毕后被调用**，这意味着你可以访问由框架注册的所有其他服务：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\View;
    use Illuminate\Support\ServiceProvider;

    class ComposerServiceProvider extends ServiceProvider
    {
        /**
         * 引导任意应用服务。
         *
         * @return void
         */
        public function boot()
        {
            View::composer('view', function () {
                //
            });
        }
    }

<a name="boot-method-dependency-injection"></a>
#### boot 方法的依赖注入

你可以为服务提供者的 `boot` 方法类型提示依赖。[服务容器](/docs/{{version}}/container)会自动注入你所需的任何依赖：

    use Illuminate\Contracts\Routing\ResponseFactory;

    /**
     * 引导任意应用服务。
     *
     * @param  \Illuminate\Contracts\Routing\ResponseFactory  $response
     * @return void
     */
    public function boot(ResponseFactory $response)
    {
        $response->macro('serialized', function ($value) {
            //
        });
    }

<a name="registering-providers"></a>
## 注册提供者

所有服务提供者都在 `config/app.php` 配置文件中注册。该文件包含一个 `providers` 数组，你可以在其中列出服务提供者的类名。默认情况下，该数组中列出了一组 Laravel 核心服务提供者。这些提供者负责引导 Laravel 的核心组件，例如邮件器、队列、缓存等。

要注册你的提供者，将其添加到该数组中：

    'providers' => [
        // 其他服务提供者

        App\Providers\ComposerServiceProvider::class,
    ],

<a name="deferred-providers"></a>
## 延迟提供者

如果你的提供者**仅**在[服务容器](/docs/{{version}}/container)中注册绑定，你可以选择延迟其注册，直到实际需要某个已注册的绑定时才执行。延迟加载此类提供者可以提升应用性能，因为它不会在每次请求时都从文件系统加载。

Laravel 会编译并存储一份由延迟服务提供者提供的所有服务列表，同时记录其服务提供者类名。随后，仅当你尝试解析其中某个服务时，Laravel 才会加载该服务提供者。

要延迟加载提供者，需实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义 `provides` 方法。`provides` 方法应返回该提供者注册的服务容器绑定：

    <?php

    namespace App\Providers;

    use App\Services\Riak\Connection;
    use Illuminate\Contracts\Support\DeferrableProvider;
    use Illuminate\Support\ServiceProvider;

    class RiakServiceProvider extends ServiceProvider implements DeferrableProvider
    {
        /**
         * 注册任意应用服务。
         *
         * @return void
         */
        public function register()
        {
            $this->app->singleton(Connection::class, function ($app) {
                return new Connection($app['config']['riak']);
            });
        }

        /**
         * 获取该提供者提供的服务。
         *
         * @return array
         */
        public function provides()
        {
            return [Connection::class];
        }
    }
