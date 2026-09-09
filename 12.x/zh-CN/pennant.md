# Laravel Pennant

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
- [定义功能](#defining-features)
    - [基于类的功能](#class-based-features)
- [检查功能](#checking-features)
    - [条件执行](#conditional-execution)
    - [`HasFeatures` Trait](#the-has-features-trait)
    - [Blade 指令](#blade-directive)
    - [中间件](#middleware)
    - [拦截功能检查](#intercepting-feature-checks)
    - [内存缓存](#in-memory-cache)
- [作用域](#scope)
    - [指定作用域](#specifying-the-scope)
    - [默认作用域](#default-scope)
    - [可空作用域](#nullable-scope)
    - [标识作用域](#identifying-scope)
    - [序列化作用域](#serializing-scope)
- [丰富的功能值](#rich-feature-values)
- [检索多个功能](#retrieving-multiple-features)
- [预加载](#eager-loading)
- [更新值](#updating-values)
    - [批量更新](#bulk-updates)
    - [清除功能](#purging-features)
- [测试](#testing)
- [添加自定义 Pennant 驱动](#adding-custom-pennant-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)
    - [在外部定义功能](#defining-features-externally)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel Pennant](https://github.com/laravel/pennant) 是一个简单、轻量的功能开关（Feature Flag）包，没有任何多余的东西。借助功能开关，你可以放心地 incremental 发布新应用功能、对新界面设计进行 A/B 测试、配合主干开发策略使用等等。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器将 Pennant 安装到你的项目中：

```shell
composer require laravel/pennant
```

接下来，使用 `vendor:publish` Artisan 命令发布 Pennant 的配置文件和数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，运行应用的数据库迁移。这会创建一个 `features` 表，Pennant 的 `database` 驱动正是依托该表来工作：

```shell
php artisan migrate
```

<a name="configuration"></a>
## 配置

发布 Pennant 的资源文件后，其配置文件位于 `config/pennant.php`。你可以在这个配置文件中指定默认的存储机制，Pennant 将用它来存储已解析的功能开关值。

Pennant 支持通过 `array` 驱动将已解析的功能开关值存储在内存数组中。此外，Pennant 还可以通过 `database` 驱动将已解析的功能开关值持久化存储到关系型数据库中，这也是 Pennant 默认使用的存储机制。

<a name="defining-features"></a>
## 定义功能

要定义一个功能，可以使用 `Feature` Facade 提供的 `define` 方法。你需要为功能指定一个名称，以及一个用于解析功能初始值的闭包。

通常，功能会在服务提供者（Service Provider）中使用 `Feature` Facade 来定义。该闭包会接收功能检查的「作用域」。最常见的作用域是当前认证用户。在下面的例子中，我们将定义一个功能，用于向应用用户渐进式发布一个新的 API：

```php
<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Lottery;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Feature::define('new-api', fn (User $user) => match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        });
    }
}
```

如你所见，我们为这个功能设定了如下规则：

- 所有内部团队成员都应使用新 API。
- 任何高流量客户都不应使用新 API。
- 其他情况下，将以百分之一的概率随机为用户启用该功能。

当某个用户第一次检查 `new-api` 功能时，闭包的结果会被存储驱动保存下来。下次对同一用户检查该功能时，将直接从存储中取值，而不会再调用闭包。

为方便起见，如果功能定义只返回一个抽奖（Lottery），可以完全省略闭包：

    Feature::define('site-redesign', Lottery::odds(1, 1000));

<a name="class-based-features"></a>
### 基于类的功能

Pennant 也允许你定义基于类的功能。与基于闭包的功能定义不同，基于类的功能无需在服务提供者中注册。要创建基于类的功能，可以调用 `pennant:feature` Artisan 命令。默认情况下，功能类会被放置在应用的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能类时，你只需定义一个 `resolve` 方法，该方法会在解析给定作用域下功能的初始值时被调用。同样，作用域通常是当前认证用户：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * 解析功能的初始值。
     */
    public function resolve(User $user): mixed
    {
        return match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        };
    }
}
```

如果你想手动解析基于类的功能的实例，可以调用 `Feature` Facade 的 `instance` 方法：

```php
use Illuminate\Support\Facades\Feature;

$instance = Feature::instance(NewApi::class);
```

> [!NOTE]
> 功能类通过[容器](/docs/{{version}}/container)解析，因此你可以在需要时向功能类的构造函数中注入依赖。

#### 自定义存储的功能名称

默认情况下，Pennant 会存储功能类的完全限定类名。如果希望将存储的功能名称与应用的内部结构解耦，可以在功能类上添加 `Name` 属性。该属性的值将代替类名被存储：

```php
<?php

namespace App\Features;

use Laravel\Pennant\Attributes\Name;

#[Name('new-api')]
class NewApi
{
    // ...
}
```

<a name="checking-features"></a>
## 检查功能

要判断某个功能是否处于激活状态，可以使用 `Feature` Facade 的 `active` 方法。默认情况下，功能会针对当前认证用户进行检查：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * 显示资源列表。
     */
    public function index(Request $request): Response
    {
        return Feature::active('new-api')
            ? $this->resolveNewApiResponse($request)
            : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

虽然功能默认针对当前认证用户进行检查，但你也可以方便地针对其他用户或[作用域](#scope)进行检查。为此，可以使用 `Feature` Facade 提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了另外一些便捷方法，在判断功能是否激活时可能很有用：

```php
// 判断给定的功能是否全部处于激活状态...
Feature::allAreActive(['new-api', 'site-redesign']);

// 判断给定的功能是否有任一处于激活状态...
Feature::someAreActive(['new-api', 'site-redesign']);

// 判断某个功能是否处于未激活状态...
Feature::inactive('new-api');

// 判断给定的功能是否全部处于未激活状态...
Feature::allAreInactive(['new-api', 'site-redesign']);

// 判断给定的功能是否有任一处于未激活状态...
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]
> 在 HTTP 上下文之外使用 Pennant 时，例如在 Artisan 命令或队列任务中，你通常应当[显式指定功能的作用域](#specifying-the-scope)。或者，你也可以定义一个兼顾已认证 HTTP 上下文与未认证上下文的[默认作用域](#default-scope)。

<a name="checking-class-based-features"></a>
#### 检查基于类的功能

对于基于类的功能，检查功能时应传入类名：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * 显示资源列表。
     */
    public function index(Request $request): Response
    {
        return Feature::active(NewApi::class)
            ? $this->resolveNewApiResponse($request)
            : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

<a name="conditional-execution"></a>
### 条件执行

`when` 方法可用于在功能处于激活状态时流畅地执行给定的闭包。此外，还可以提供第二个闭包，当功能处于未激活状态时执行：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * 显示资源列表。
     */
    public function index(Request $request): Response
    {
        return Feature::when(NewApi::class,
            fn () => $this->resolveNewApiResponse($request),
            fn () => $this->resolveLegacyApiResponse($request),
        );
    }

    // ...
}
```

`unless` 方法与 `when` 方法正好相反，当功能处于未激活状态时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

<a name="the-has-features-trait"></a>
### `HasFeatures` Trait

Pennant 的 `HasFeatures` Trait 可以添加到应用的 `User` 模型（或任何拥有功能的模型）上，从而提供一种流畅、便捷的方式，直接从模型上检查功能：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Pennant\Concerns\HasFeatures;

class User extends Authenticatable
{
    use HasFeatures;

    // ...
}
```

将该 Trait 添加到模型后，你只需调用 `features` 方法即可方便地检查功能：

```php
if ($user->features()->active('new-api')) {
    // ...
}
```

当然，`features` 方法还提供了许多与功能交互的其他便捷方法：

```php
// 值...
$value = $user->features()->value('purchase-button')
$values = $user->features()->values(['new-api', 'purchase-button']);

// 状态...
$user->features()->active('new-api');
$user->features()->allAreActive(['new-api', 'server-api']);
$user->features()->someAreActive(['new-api', 'server-api']);

$user->features()->inactive('new-api');
$user->features()->allAreInactive(['new-api', 'server-api']);
$user->features()->someAreInactive(['new-api', 'server-api']);

// 条件执行...
$user->features()->when('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);

$user->features()->unless('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);
```

<a name="blade-directive"></a>
### Blade 指令

为了让在 Blade 中检查功能变得无缝，Pennant 提供了 `@feature` 和 `@featureany` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' 处于激活状态 -->
@else
    <!-- 'site-redesign' 处于未激活状态 -->
@endfeature

@featureany(['site-redesign', 'beta'])
    <!-- 'site-redesign' 或 `beta` 处于激活状态 -->
@endfeatureany
```

<a name="middleware"></a>
### 中间件

Pennant 还包含一个[中间件](/docs/{{version}}/middleware)，可用于在调用路由之前验证当前认证用户是否有权访问某个功能。你可以将中间件分配给路由，并指定访问该路由所需的功能。如果当前认证用户的任一指定功能处于未激活状态，路由将返回 `400 Bad Request` HTTP 响应。可以向静态的 `using` 方法传递多个功能。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ...
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

<a name="customizing-the-response"></a>
#### 自定义响应

如果你想自定义中间件在所列功能处于未激活状态时返回的响应，可以使用 `EnsureFeaturesAreActive` 中间件提供的 `whenInactive` 方法。通常，这个方法应当在应用某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * 引导所有应用服务。
 */
public function boot(): void
{
    EnsureFeaturesAreActive::whenInactive(
        function (Request $request, array $features) {
            return new Response(status: 403);
        }
    );

    // ...
}
```

<a name="intercepting-feature-checks"></a>
### 拦截功能检查

有时候，在读取某个功能的存储值之前先执行一些内存中的检查会很有用。想象一下，你正在功能开关之后开发一个新 API，希望在停用新 API 的同时，不丢失存储中已解析的功能值。一旦发现新 API 存在 Bug，你就可以先对内部团队成员之外的所有人停用它，修复 Bug 后，再为之前有权访问该功能的用户重新启用。

你可以通过[基于类的功能](#class-based-features)的 `before` 方法来实现。如果定义了该方法，`before` 方法总会在从存储中取值之前在内存中执行。如果该方法返回非 `null` 值，那么在本次请求期间，该值将替代功能的存储值被使用：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * 在读取存储值之前，始终在内存中执行的检查。
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }
    }

    /**
     * 解析功能的初始值。
     */
    public function resolve(User $user): mixed
    {
        return match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        };
    }
}
```

你还可以利用这个特性，为之前处于功能开关之后的功能安排一次全局发布：

```php
<?php

namespace App\Features;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class NewApi
{
    /**
     * 在读取存储值之前，始终在内存中执行的检查。
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }

        if (Carbon::parse(Config::get('features.new-api.rollout-date'))->isPast()) {
            return true;
        }
    }

    // ...
}
```

<a name="in-memory-cache"></a>
### 内存缓存

检查功能时，Pennant 会将结果缓存到内存中。如果你使用的是 `database` 驱动，这意味着在同一次请求中重复检查同一个功能开关，不会触发额外的数据库查询。这也保证了功能在同一次请求期间结果的一致性。

如果你需要手动清空内存缓存，可以使用 `Feature` Facade 提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

<a name="scope"></a>
## 作用域

<a name="specifying-the-scope"></a>
### 指定作用域

如前所述，功能通常针对当前认证用户进行检查。但这未必总能满足你的需求。因此，你可以通过 `Feature` Facade 的 `for` 方法，指定检查某个功能时所依据的作用域：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

当然，功能作用域并不限于「用户」。想象你正在构建一个新的计费体验，并将其发布给整个团队而非单个用户。也许你希望老团队的发布节奏比新团队更慢。你的功能解析闭包可能类似下面这样：

```php
use App\Models\Team;
use Illuminate\Support\Carbon;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('billing-v2', function (Team $team) {
    if ($team->created_at->isAfter(new Carbon('1st Jan, 2023'))) {
        return true;
    }

    if ($team->created_at->isAfter(new Carbon('1st Jan, 2019'))) {
        return Lottery::odds(1 / 100);
    }

    return Lottery::odds(1 / 1000);
});
```

你会注意到，我们定义的闭包期望的并不是 `User`，而是一个 `Team` 模型。要判断某个功能对用户所在的团队是否处于激活状态，应当将该团队传给 `Feature` Facade 的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect('/billing/v2');
}

// ...
```

<a name="default-scope"></a>
### 默认作用域

你还可以自定义 Pennant 检查功能时所使用的默认作用域。例如，也许你的所有功能都要针对当前认证用户所在的团队而非用户本人进行检查。与其每次检查功能时都调用 `Feature::for($user->team)`，不如直接将团队指定为默认作用域。通常，这应当在应用的某个服务提供者中完成：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ...
    }
}
```

此后，如果没有通过 `for` 方法显式指定作用域，功能检查将把当前认证用户所在的团队作为默认作用域：

```php
Feature::active('billing-v2');

// 现在等价于...

Feature::for($user->team)->active('billing-v2');
```

<a name="nullable-scope"></a>
### 可空作用域

如果检查功能时传入的作用域为 `null`，且功能定义并未通过可空类型或在联合类型中包含 `null` 来支持 `null`，Pennant 会自动返回 `false` 作为功能的结果值。

因此，如果你传给功能的作用域有可能为 `null`，并且希望功能值解析器仍被调用，就应当在功能定义中对这种情况加以处理。当你在 Artisan 命令、队列任务或未认证路由中检查功能时，就可能出现 `null` 作用域。这些场景下通常没有认证用户，因此默认作用域会是 `null`。

如果你并不总是[显式指定功能作用域](#specifying-the-scope)，就应当确保作用域类型为「可空」，并在功能定义逻辑中处理 `null` 作用域值：

```php
use App\Models\User;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('new-api', fn (User $user) => match (true) {// [tl! remove]
Feature::define('new-api', fn (User|null $user) => match (true) {// [tl! add]
    $user === null => true,// [tl! add]
    $user->isInternalTeamMember() => true,
    $user->isHighTrafficCustomer() => false,
    default => Lottery::odds(1 / 100),
});
```

<a name="identifying-scope"></a>
### 标识作用域

Pennant 内置的 `array` 和 `database` 存储驱动知道如何正确存储所有 PHP 数据类型以及 Eloquent 模型的作用域标识符。但如果你的应用使用了第三方 Pennant 驱动，该驱动可能不知道如何正确存储 Eloquent 模型或应用中其他自定义类型的标识符。

鉴于此，Pennant 允许你在应用中用作 Pennant 作用域的对象上实现 `FeatureScopeable` 契约，从而为存储格式化作用域值。

举个例子，假设你在同一个应用中使用两种不同的功能驱动：内置的 `database` 驱动和第三方的「Flag Rocket」驱动。「Flag Rocket」驱动不知道如何正确存储 Eloquent 模型，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier` 方法，我们可以自定义提供给应用中每个驱动的可存储作用域值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * 将对象转换为给定驱动对应的功能作用域标识符。
     */
    public function toFeatureIdentifier(string $driver): mixed
    {
        return match($driver) {
            'database' => $this,
            'flag-rocket' => FlagRocketUser::fromId($this->flag_rocket_id),
        };
    }
}
```

<a name="serializing-scope"></a>
### 序列化作用域

默认情况下，Pennant 在存储与 Eloquent 模型相关联的功能时会使用完全限定类名。如果你已经在使用 [Eloquent 多态映射](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，也可以让 Pennant 一并使用该映射，将存储的功能与应用结构解耦。

要做到这一点，你可以在服务提供者中定义好 Eloquent 多态映射后，调用 `Feature` Facade 的 `useMorphMap` 方法：

```php
use Illuminate\Database\Eloquent\Relations\Relation;
use Laravel\Pennant\Feature;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);

Feature::useMorphMap();
```

<a name="rich-feature-values"></a>
## 丰富的功能值

到目前为止，我们展示的功能主要处于二元状态，即要么「激活」要么「未激活」。不过，Pennant 也允许你存储更丰富的值。

例如，假设你正在为应用的「立即购买」按钮测试三种新颜色。你可以在功能定义中不返回 `true` 或 `false`，而是返回一个字符串：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn (User $user) => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

你可以使用 `value` 方法获取 `purchase-button` 功能的值：

```php
$color = Feature::value('purchase-button');
```

Pennant 内置的 Blade 指令也让根据功能当前值来条件渲染内容变得轻而易举：

```blade
@feature('purchase-button', 'blue-sapphire')
    <!-- 'blue-sapphire' 处于激活状态 -->
@elsefeature('purchase-button', 'seafoam-green')
    <!-- 'seafoam-green' 处于激活状态 -->
@elsefeature('purchase-button', 'tart-orange')
    <!-- 'tart-orange' 处于激活状态 -->
@endfeature
```

> [!NOTE]
> 使用丰富的值时，有一点很重要：只要功能持有的值不是 `false`，就会被视为「激活」。

调用[条件性的 `when`](#conditional-execution) 方法时，功能的丰富值会被传给第一个闭包：

```php
Feature::when('purchase-button',
    fn ($color) => /* ... */,
    fn () => /* ... */,
);
```

类似地，调用条件性的 `unless` 方法时，功能的丰富值会被传给可选的第二个闭包：

```php
Feature::unless('purchase-button',
    fn () => /* ... */,
    fn ($color) => /* ... */,
);
```

<a name="retrieving-multiple-features"></a>
## 检索多个功能

`values` 方法可以为给定作用域检索多个功能：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，你可以使用 `all` 方法来检索给定作用域下所有已定义功能的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

然而，基于类的功能是动态注册的，在被显式检查之前，Pennant 并不知道它们的存在。这意味着，如果应用中的基于类的功能在当前请求期间尚未被检查过，它们可能不会出现在 `all` 方法返回的结果中。

如果你希望在使用 `all` 方法时始终包含功能类，可以使用 Pennant 的功能发现能力。首先，在应用的某个服务提供者中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Feature::discover();

        // ...
    }
}
```

`discover` 方法会注册应用 `app/Features` 目录下的所有功能类。这样一来，无论这些类在当前请求期间是否被检查过，`all` 方法都会将它们包含在结果中：

```php
Feature::all();

// [
//     'App\Features\NewApi' => true,
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

<a name="eager-loading"></a>
## 预加载

虽然 Pennant 会为单次请求将所有已解析的功能缓存到内存中，但仍然可能遇到性能问题。为了缓解这一问题，Pennant 提供了预加载功能值的能力。

为了说明这一点，假设我们正在循环中检查某个功能是否处于激活状态：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用的是数据库驱动，这段代码会为循环中的每个用户执行一次数据库查询，执行的查询可能多达数百条。而使用 Pennant 的 `load` 方法，我们可以为一组用户或作用域预加载功能值，从而消除这一潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

如果只想在功能值尚未加载时才加载它们，可以使用 `loadMissing` 方法：

```php
Feature::for($users)->loadMissing([
    'new-api',
    'purchase-button',
    'notifications-beta',
]);
```

你可以使用 `loadAll` 方法加载所有已定义的功能：

```php
Feature::for($users)->loadAll();
```

<a name="updating-values"></a>
## 更新值

功能的值在第一次被解析时，底层驱动会将结果存入存储。这通常是必要的，可以确保你的用户在多次请求之间获得一致的体验。不过，有时你可能需要手动更新功能存储的值。

为此，你可以使用 `activate` 和 `deactivate` 方法来开启或关闭功能：

```php
use Laravel\Pennant\Feature;

// 为默认作用域激活功能...
Feature::activate('new-api');

// 为给定作用域停用功能...
Feature::for($user->team)->deactivate('billing-v2');
```

你也可以通过向 `activate` 方法提供第二个参数来手动为功能设置丰富的值：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要让 Pennant 忘记某个功能存储的值，可以使用 `forget` 方法。当该功能再次被检查时，Pennant 会根据功能定义重新解析其值：

```php
Feature::forget('purchase-button');
```

<a name="bulk-updates"></a>
### 批量更新

要批量更新已存储的功能值，可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，假设你现在确信 `new-api` 功能已经稳定，并且已为结算流程敲定了最佳的 `'purchase-button'` 颜色，你就可以相应地为所有用户更新存储的值：

```php
use Laravel\Pennant\Feature;

Feature::activateForEveryone('new-api');

Feature::activateForEveryone('purchase-button', 'seafoam-green');
```

或者，你可以为所有用户停用该功能：

```php
Feature::deactivateForEveryone('new-api');
```

> [!NOTE]
> 这只会更新由 Pennant 存储驱动存储的已解析功能值。你还需要更新应用中的功能定义。

<a name="purging-features"></a>
### 清除功能

有时候，从存储中彻底清除某个功能会很有用。当你已将某个功能从应用中移除，或者对其定义做了调整并希望对所有用户生效时，通常就需要这样做。

你可以使用 `purge` 方法移除某个功能所有已存储的值：

```php
// 清除单个功能...
Feature::purge('new-api');

// 清除多个功能...
Feature::purge(['new-api', 'purchase-button']);
```

如果你想从存储中清除_所有_功能，可以不带任何参数调用 `purge` 方法：

```php
Feature::purge();
```

由于在应用的部署流水线中清除功能往往很有用，Pennant 提供了 `pennant:purge` Artisan 命令，用于从存储中清除指定的功能：

```shell
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也可以清除_除_给定功能列表之外的所有功能。例如，假设你想清除所有功能，但保留存储中「new-api」和「purchase-button」这两个功能的值。为此，你可以将这两个功能名传给 `--except` 选项：

```shell
php artisan pennant:purge --except=new-api --except=purchase-button
```

为方便起见，`pennant:purge` 命令还支持 `--except-registered` 标志。该标志表示，除了在服务提供者中显式注册的功能之外，其余所有功能都将被清除：

```shell
php artisan pennant:purge --except-registered
```

<a name="testing"></a>
## 测试

在测试与功能开关交互的代码时，控制功能开关在测试中返回值最简单的方法，就是重新定义该功能。例如，假设你在应用的某个服务提供者中定义了如下功能：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要修改该功能在测试中的返回值，你可以在测试开头重新定义该功能。下面的测试将始终通过，即使服务提供者中仍然存在 `Arr::random()` 实现：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define('purchase-button', 'seafoam-green');

    expect(Feature::value('purchase-button'))->toBe('seafoam-green');
});
```

```php tab=PHPUnit
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define('purchase-button', 'seafoam-green');

    $this->assertSame('seafoam-green', Feature::value('purchase-button'));
}
```

同样的方法也适用于基于类的功能：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define(NewApi::class, true);

    expect(Feature::value(NewApi::class))->toBeTrue();
});
```

```php tab=PHPUnit
use App\Features\NewApi;
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define(NewApi::class, true);

    $this->assertTrue(Feature::value(NewApi::class));
}
```

如果你的功能返回的是 `Lottery` 实例，这里有一些实用的[测试辅助函数](/docs/{{version}}/helpers#testing-lotteries)。

<a name="store-configuration"></a>
#### 存储配置

你可以在应用的 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量，以配置 Pennant 在测试期间使用的存储：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit colors="true">
    <!-- ... -->
    <php>
        <env name="PENNANT_STORE" value="array"/>
        <!-- ... -->
    </php>
</phpunit>
```

<a name="adding-custom-pennant-drivers"></a>
## 添加自定义 Pennant 驱动

<a name="implementing-the-driver"></a>
#### 实现驱动

如果 Pennant 现有的存储驱动都无法满足应用的需求，你可以编写自己的存储驱动。你的自定义驱动应当实现 `Laravel\Pennant\Contracts\Driver` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;

class RedisFeatureDriver implements Driver
{
    public function define(string $feature, callable $resolver): void {}
    public function defined(): array {}
    public function getAll(array $features): array {}
    public function get(string $feature, mixed $scope): mixed {}
    public function set(string $feature, mixed $scope, mixed $value): void {}
    public function setForAllScopes(string $feature, mixed $value): void {}
    public function delete(string $feature, mixed $scope): void {}
    public function purge(array|null $features): void {}
}
```

接下来，我们只需使用 Redis 连接实现上述每个方法即可。关于如何实现这些方法的示例，可以查看 [Pennant 源代码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php)中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]
> Laravel 并未自带用于存放扩展的目录。你可以自由地将它们放在任何位置。在本例中，我们创建了一个 `Extensions` 目录来存放 `RedisFeatureDriver`。

<a name="registering-the-driver"></a>
#### 注册驱动

驱动实现完成后，你就可以将其注册到 Laravel 中了。要向 Pennant 添加额外的驱动，可以使用 `Feature` Facade 提供的 `extend` 方法。你应当在应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法：

```php
<?php

namespace App\Providers;

use App\Extensions\RedisFeatureDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册所有应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

驱动注册完成后，你就可以在应用的 `config/pennant.php` 配置文件中使用 `redis` 驱动了：

```php
'stores' => [

    'redis' => [
        'driver' => 'redis',
        'connection' => null,
    ],

    // ...

],
```

<a name="defining-features-externally"></a>
### 在外部定义功能

如果你的驱动是对第三方功能开关平台的封装，那么功能很可能会在平台上定义，而不是使用 Pennant 的 `Feature::define` 方法。如果是这种情况，你的自定义驱动还应当实现 `Laravel\Pennant\Contracts\DefinesFeaturesExternally` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;
use Laravel\Pennant\Contracts\DefinesFeaturesExternally;

class FeatureFlagServiceDriver implements Driver, DefinesFeaturesExternally
{
    /**
     * 获取给定作用域已定义的功能。
     */
    public function definedFeaturesForScope(mixed $scope): array {}

    /* ... */
}
```

`definedFeaturesForScope` 方法应当返回为给定作用域定义的功能名称列表。

<a name="events"></a>
## 事件

Pennant 会派发多种事件，可用于在整个应用中跟踪功能开关。

### `Laravel\Pennant\Events\FeatureRetrieved`

每当[检查功能](#checking-features)时都会派发此事件。此事件可用于针对功能开关在应用中的使用情况创建并跟踪指标。

### `Laravel\Pennant\Events\FeatureResolved`

此事件在某个功能第一次针对特定作用域解析其值时派发。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

此事件在某个未知功能第一次针对特定作用域被解析时派发。如果你本打算移除某个功能开关，却不小心在应用中留下了零星的引用，监听此事件会很有用：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnknownFeatureResolved;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Event::listen(function (UnknownFeatureResolved $event) {
            Log::error("Resolving unknown feature [{$event->feature}].");
        });
    }
}
```

### `Laravel\Pennant\Events\DynamicallyRegisteringFeatureClass`

此事件在[基于类的功能](#class-based-features)在请求期间第一次被动态检查时派发。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

此事件在向[不支持 null](#nullable-scope) 的功能定义传入 `null` 作用域时派发。

这种情况会被优雅地处理，功能将返回 `false`。不过，如果你不想采用这种默认的优雅处理行为，可以在应用的 `AppServiceProvider` 的 `boot` 方法中为此事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * 引导所有应用服务。
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}
```

### `Laravel\Pennant\Events\FeatureUpdated`

此事件在为某个作用域更新功能时派发，通常由 `activate` 或 `deactivate` 调用触发。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

此事件在为所有作用域更新功能时派发，通常由 `activateForEveryone` 或 `deactivateForEveryone` 调用触发。

### `Laravel\Pennant\Events\FeatureDeleted`

此事件在为某个作用域删除功能时派发，通常由 `forget` 调用触发。

### `Laravel\Pennant\Events\FeaturesPurged`

此事件在清除特定功能时派发。

### `Laravel\Pennant\Events\AllFeaturesPurged`

此事件在清除所有功能时派发。
