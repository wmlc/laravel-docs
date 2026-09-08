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
    - [全局作用域](#global-scope)
    - [默认作用域](#default-scope)
    - [可空作用域](#nullable-scope)
    - [识别作用域](#identifying-scope)
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

[Laravel Pennant](https://github.com/laravel/pennant) 是一个简单、轻量的功能开关包——没有多余的复杂功能。功能开关使你能自信地逐步推出新的应用功能、A/B 测试新的界面设计、补充基于主干（trunk-based）的开发策略等等。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器将 Pennant 安装到项目中：

```shell
composer require laravel/pennant
```

接下来，你应使用 `vendor:publish` Artisan 命令发布 Pennant 的配置和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，你应运行应用的数据库迁移。这将创建一个 `features` 表，Pennant 使用它来驱动其 `database` 存储：

```shell
php artisan migrate
```

<a name="configuration"></a>
## 配置

发布 Pennant 的资源后，其配置文件将位于 `config/pennant.php`。该配置文件允许你指定 Pennant 用于存储已解析功能开关值的默认存储机制。

Pennant 支持通过 `array` 驱动将已解析的功能开关值存储在内存数组中。或者，Pennant 可以通过 `database` 驱动将已解析的功能开关值持久存储在关系数据库中，这是 Pennant 使用的默认存储机制。

<a name="defining-features"></a>
## 定义功能

要定义功能，你可以使用 `Feature` Facade 提供的 `define` 方法。你需要提供功能的名称，以及一个将被调用来解析功能初始值的闭包。

通常，功能在服务提供者中使用 `Feature` Facade 定义。该闭包将接收功能检查的"作用域"。最常见的是当前已认证的用户。在此示例中，我们将定义一个向应用用户逐步推出新 API 的功能：

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
     * Bootstrap any application services.
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

如你所见，我们为功能制定了以下规则：

- 所有内部团队成员都应使用新 API。
- 任何高流量客户都不应使用新 API。
- 否则，该功能应以 1/100 的概率随机分配给用户。

首次为给定用户检查 `new-api` 功能时，闭包的结果将由存储驱动存储。下次对同一用户检查该功能时，将从存储中检索该值，而不会调用闭包。

为方便起见，如果功能定义只返回一个彩票（lottery），你可以完全省略闭包：

    Feature::define('site-redesign', Lottery::odds(1, 1000));

<a name="class-based-features"></a>
### 基于类的功能

Pennant 还允许你定义基于类的功能。与基于闭包的功能定义不同，无需在服务提供者中注册基于类的功能。要创建基于类的功能，你可以调用 `pennant:feature` Artisan 命令。默认情况下，功能类将放置在应用的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能类时，你只需要定义一个 `resolve` 方法，该方法将被调用来解析给定作用域的功能初始值。同样，作用域通常是当前已认证的用户：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * Resolve the feature's initial value.
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

如果你想手动解析基于类的功能实例，可以在 `Feature` Facade 上调用 `instance` 方法：

```php
use Illuminate\Support\Facades\Feature;

$instance = Feature::instance(NewApi::class);
```

> [!NOTE]
> 功能类通过[容器](/docs/{{version}}/container)解析，因此你可以在需要时向功能类的构造函数注入依赖。

#### 自定义存储的功能名称

默认情况下，Pennant 会存储功能类的完整限定类名。如果你想将存储的功能名称与应用内部结构解耦，可以在功能类上添加 `Name` 属性。该属性的值将代替类名被存储：

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

要判断功能是否处于活动状态，你可以使用 `Feature` Facade 上的 `active` 方法。默认情况下，功能会针对当前已认证的用户进行检查：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
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

尽管默认情况下功能会针对当前已认证的用户进行检查，但你可以轻松地针对其他用户或[作用域](#scope)检查功能。为此，请使用 `Feature` Facade 提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了一些额外的便捷方法，在判断功能是否处于活动状态时可能有用：

```php
// Determine if all of the given features are active...
Feature::allAreActive(['new-api', 'site-redesign']);

// Determine if any of the given features are active...
Feature::someAreActive(['new-api', 'site-redesign']);

// Determine if a feature is inactive...
Feature::inactive('new-api');

// Determine if all of the given features are inactive...
Feature::allAreInactive(['new-api', 'site-redesign']);

// Determine if any of the given features are inactive...
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]
> 在 HTTP 上下文之外使用 Pennant 时（例如在 Artisan 命令或队列任务中），你通常应[显式指定功能的作用域](#specifying-the-scope)。或者，你可以定义一个同时兼顾已认证 HTTP 上下文和未认证上下文的[默认作用域](#default-scope)。

<a name="checking-class-based-features"></a>
#### 检查基于类的功能

对于基于类的功能，你应在检查功能时提供类名：

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
     * Display a listing of the resource.
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

如果功能处于活动状态，可以使用 `when` 方法流畅地执行给定的闭包。此外，可以提供第二个闭包，当功能不活跃时执行：

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
     * Display a listing of the resource.
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

`unless` 方法是 `when` 方法的逆操作，当功能不活跃时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

<a name="the-has-features-trait"></a>
### `HasFeatures` Trait

Pennant 的 `HasFeatures` Trait 可以添加到应用的 `User` 模型（或任何其他拥有功能开关的模型）上，以提供一种直接从模型检查功能的流畅、便捷方式：

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

将 Trait 添加到模型后，你可以通过调用 `features` 方法轻松检查功能：

```php
if ($user->features()->active('new-api')) {
    // ...
}
```

当然，`features` 方法还提供许多其他与功能交互的便捷方法：

```php
// Values...
$value = $user->features()->value('purchase-button')
$values = $user->features()->values(['new-api', 'purchase-button']);

// State...
$user->features()->active('new-api');
$user->features()->allAreActive(['new-api', 'server-api']);
$user->features()->someAreActive(['new-api', 'server-api']);

$user->features()->inactive('new-api');
$user->features()->allAreInactive(['new-api', 'server-api']);
$user->features()->someAreInactive(['new-api', 'server-api']);

// Conditional execution...
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

为了让在 Blade 中检查功能成为无缝体验，Pennant 提供了 `@feature` 和 `@featureany` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' is active -->
@else
    <!-- 'site-redesign' is inactive -->
@endfeature

@featureany(['site-redesign', 'beta'])
    <!-- 'site-redesign' or `beta` is active -->
@endfeatureany
```

<a name="middleware"></a>
### 中间件

Pennant 还包含一个[中间件](/docs/{{version}}/middleware)，可用于在路由被调用之前验证当前已认证用户是否有权访问某个功能。你可以将中间件分配给路由，并指定访问该路由所需的功能。如果当前已认证用户的任何指定功能处于不活跃状态，路由将返回 `400 Bad Request` HTTP 响应。可以将多个功能传递给静态的 `using` 方法。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ...
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

<a name="customizing-the-response"></a>
#### 自定义响应

如果列出的某个功能不活跃，你想自定义中间件返回的响应，可以使用 `EnsureFeaturesAreActive` 中间件提供的 `whenInactive` 方法。通常，此方法应在应用某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * Bootstrap any application services.
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

有时，在检索给定功能的存储值之前执行一些内存检查可能很有用。假设你正在功能开关后面开发一个新 API，并希望能够在不让存储中的任何已解析功能值丢失的情况下禁用新 API。如果你在新 API 中发现了一个 bug，你可以轻松地为除内部团队成员之外的所有人禁用该功能，修复 bug，然后为之前有权访问该功能的用户重新启用新 API。

你可以通过[基于类的功能](#class-based-features)的 `before` 方法实现这一点。当存在该方法时，`before` 方法总是在从存储中检索值之前于内存中运行。如果该方法返回非 `null` 值，则该值将在请求期间代替功能的存储值被使用：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * Run an always-in-memory check before the stored value is retrieved.
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }
    }

    /**
     * Resolve the feature's initial value.
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

你也可以使用此功能来计划先前处于功能开关后面的功能的全局发布：

```php
<?php

namespace App\Features;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class NewApi
{
    /**
     * Run an always-in-memory check before the stored value is retrieved.
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

检查功能时，Pennant 会创建结果的内存缓存。如果你使用 `database` 驱动，这意味着在单个请求中重复检查同一个功能开关不会触发额外的数据库查询。这也确保了功能在请求期间有一致的结果。

如果你需要手动清除内存缓存，可以使用 `Feature` Facade 提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

<a name="scope"></a>
## 作用域

<a name="specifying-the-scope"></a>
### 指定作用域

如前所述，功能通常针对当前已认证的用户进行检查。但这可能并不总是适合你的需求。因此，可以通过 `Feature` Facade 的 `for` 方法指定你要检查给定功能的作用域：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

当然，功能作用域不仅限于"用户"。假设你构建了一个新的计费体验，要向整个团队而不是单个用户推出。也许你希望老团队的推出速度比新团队慢。你的功能解析闭包可能如下所示：

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

你会注意到，我们定义的闭包不是接收 `User`，而是接收 `Team` 模型。要判断该功能是否对用户的团队处于活动状态，你应将团队传递给 `Feature` Facade 提供的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect('/billing/v2');
}

// ...
```

<a name="global-scope"></a>
### 全局作用域

要使用全局作用域检查或交互功能，而不管配置的默认作用域解析器是什么，请使用 `globally` 方法。这对于全应用范围的功能开关非常有用，例如临时启用维护行为或向每个用户推出功能：

```php
Feature::globally()->active('new-api');

Feature::globally()->activate('new-api');
```

<a name="default-scope"></a>
### 默认作用域

还可以自定义 Pennant 用于检查功能的默认作用域。例如，也许你的所有功能都针对当前已认证用户的团队而不是用户进行检查。与其每次检查功能时都调用 `Feature::for($user->team)`，你可以将团队指定为默认作用域。通常，这应在应用的一个服务提供者中完成：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ...
    }
}
```

如果未通过 `for` 方法显式提供作用域，功能检查现在将使用当前已认证用户的团队作为默认作用域：

```php
Feature::active('billing-v2');

// Is now equivalent to...

Feature::for($user->team)->active('billing-v2');
```

<a name="nullable-scope"></a>
### 可空作用域

如果你在检查功能时提供的作用域为 `null`，且功能定义不支持 `null`（通过可空类型或将 `null` 包含在联合类型中），Pennant 将自动返回 `false` 作为功能的结果值。

因此，如果你传递给功能的作用域可能为 `null`，并且你希望调用功能的值解析器，你应该在功能定义中考虑到这一点。在 Artisan 命令、队列任务或未认证路由中检查功能时，可能会出现 `null` 作用域。由于这些上下文中通常没有已认证用户，因此默认作用域将为 `null`。

如果你不总是[显式指定功能作用域](#specifying-the-scope)，则应确保作用域类型是"可空的"，并在功能定义逻辑中处理 `null` 作用域值：

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
### 识别作用域

Pennant 内置的 `array` 和 `database` 存储驱动知道如何为所有 PHP 数据类型以及 Eloquent 模型正确存储作用域标识符。但是，如果你的应用使用了第三方 Pennant 驱动，该驱动可能不知道如何为 Eloquent 模型或应用中的其他自定义类型正确存储标识符。

鉴于这一点，Pennant 允许你通过在应用中用作 Pennant 作用域的对象上实现 `FeatureScopeable` 契约，来格式化用于存储的作用域值。

例如，假设你在单个应用中使用两个不同的功能驱动：内置的 `database` 驱动和一个第三方的"Flag Rocket"驱动。"Flag Rocket"驱动不知道如何正确存储 Eloquent 模型。相反，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier`，我们可以为应用使用的每个驱动自定义可存储的作用域值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * Cast the object to a feature scope identifier for the given driver.
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

默认情况下，Pennant 在存储与 Eloquent 模型关联的功能时，会使用完整限定的类名。如果你已经在使用 [Eloquent 多态映射](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，你可以选择让 Pennant 也使用多态映射，以将存储的功能与应用结构解耦。

要实现这一点，在服务提供者中定义 Eloquent 多态映射后，你可以调用 `Feature` Facade 的 `useMorphMap` 方法：

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

到目前为止，我们主要将功能展示为二元状态，即它们要么"活跃"要么"不活跃"，但 Pennant 也允许你存储丰富的值。

例如，假设你在测试应用的"立即购买"按钮的三种新颜色。与其从功能定义返回 `true` 或 `false`，你可以返回一个字符串：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn (User $user) => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

你可以使用 `value` 方法检索 `purchase-button` 功能的值：

```php
$color = Feature::value('purchase-button');
```

Pennant 包含的 Blade 指令也使得根据功能的当前值条件渲染内容变得容易：

```blade
@feature('purchase-button', 'blue-sapphire')
    <!-- 'blue-sapphire' is active -->
@elsefeature('purchase-button', 'seafoam-green')
    <!-- 'seafoam-green' is active -->
@elsefeature('purchase-button', 'tart-orange')
    <!-- 'tart-orange' is active -->
@endfeature
```

> [!NOTE]
> 使用丰富的值时，重要的是要知道：当功能具有除 `false` 之外的任何值时，它被视为"活跃"。

调用[条件 `when`](#conditional-execution)方法时，功能的丰富值将提供给第一个闭包：

```php
Feature::when('purchase-button',
    fn ($color) => /* ... */,
    fn () => /* ... */,
);
```

同样，调用条件 `unless` 方法时，功能的丰富值将提供给可选的第二个闭包：

```php
Feature::unless('purchase-button',
    fn () => /* ... */,
    fn ($color) => /* ... */,
);
```

<a name="retrieving-multiple-features"></a>
## 检索多个功能

`values` 方法允许检索给定作用域的多个功能：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，你可以使用 `all` 方法检索给定作用域的所有已定义功能的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

但是，基于类的功能是动态注册的，在它们被显式检查之前，Pennant 并不知道它们。这意味着，如果应用基于类的功能在当前请求期间尚未被检查，它们可能不会出现在 `all` 方法返回的结果中。

如果你想确保使用 `all` 方法时始终包含功能类，可以使用 Pennant 的功能发现能力。要开始，请在应用的一个服务提供者中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::discover();

        // ...
    }
}
```

`discover` 方法将注册应用 `app/Features` 目录中的所有功能类。现在，`all` 方法将把所有这些类包含在结果中，无论它们是否在当前请求期间已被检查：

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

虽然 Pennant 会在单个请求期间保留所有已解析功能的内存缓存，但仍可能遇到性能问题。为缓解此问题，Pennant 提供了预加载功能值的能力。

为了说明这一点，假设我们在循环中检查某个功能是否处于活动状态：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用数据库驱动，这段代码将为循环中的每个用户执行一次数据库查询——可能执行数百次查询。但是，使用 Pennant 的 `load` 方法，我们可以通过为一组用户或作用域预加载功能值来消除这个潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

要仅在功能值尚未加载时才加载它们，可以使用 `loadMissing` 方法：

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

当功能的值首次被解析时，底层驱动会将结果存储在存储中。这通常是必要的，以确保你的用户跨请求获得一致的体验。但是，有时你可能希望手动更新功能的存储值。

为此，你可以使用 `activate` 和 `deactivate` 方法将功能切换为"开"或"关"：

```php
use Laravel\Pennant\Feature;

// Activate the feature for the default scope...
Feature::activate('new-api');

// Deactivate the feature for the given scope...
Feature::for($user->team)->deactivate('billing-v2');
```

还可以通过向 `activate` 方法提供第二个参数来手动设置功能的丰富值：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要指示 Pennant 忘记功能的存储值，可以使用 `forget` 方法。当再次检查该功能时，Pennant 将从其功能定义中解析功能的值：

```php
Feature::forget('purchase-button');
```

<a name="bulk-updates"></a>
### 批量更新

要批量更新存储的功能值，可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，假设你现在对 `new-api` 功能的稳定性充满信心，并且已经为结账流程确定了最佳的 `'purchase-button'` 颜色——你可以相应地更新所有用户的存储值：

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
> 这只会更新已由 Pennant 存储驱动存储的已解析功能值。你还需要更新应用中的功能定义。

<a name="purging-features"></a>
### 清除功能

有时，从存储中清除整个功能可能很有用。如果你已从应用中移除该功能，或对功能定义进行了希望向所有用户推出的调整，这通常是必要的。

你可以使用 `purge` 方法移除功能的所有存储值：

```php
// Purging a single feature...
Feature::purge('new-api');

// Purging multiple features...
Feature::purge(['new-api', 'purchase-button']);
```

如果你想从存储中清除_所有_功能，可以在不提供任何参数的情况下调用 `purge` 方法：

```php
Feature::purge();
```

由于在应用部署流水线中清除功能可能很有用，Pennant 包含一个 `pennant:purge` Artisan 命令，它将从存储中清除提供的功能：

```shell
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也可以清除除给定功能列表之外的_所有_功能。例如，假设你想清除所有功能，但在存储中保留"new-api"和"purchase-button"功能的值。为此，你可以将这些功能名称传递给 `--except` 选项：

```shell
php artisan pennant:purge --except=new-api --except=purchase-button
```

为方便起见，`pennant:purge` 命令还支持 `--except-registered` 标志。此标志指示应清除除在服务提供者中显式注册的功能之外的所有功能：

```shell
php artisan pennant:purge --except-registered
```

<a name="testing"></a>
## 测试

测试与功能开关交互的代码时，在测试中控制功能开关返回值的最简单方法是重新定义该功能。例如，假设你在应用的一个服务提供者中定义了以下功能：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要在测试中修改功能的返回值，你可以在测试开始时重新定义该功能。即使服务提供者中仍然存在 `Arr::random()` 实现，以下测试也始终会通过：

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

同样的方法也可用于基于类的功能：

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

如果你的功能返回 `Lottery` 实例，有若干有用的[测试辅助方法可用](/docs/{{version}}/helpers#testing-lotteries)。

<a name="store-configuration"></a>
#### 存储配置

你可以在应用 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量，以配置 Pennant 在测试期间将使用的存储：

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

如果 Pennant 的现有存储驱动都不适合你的应用需求，你可以编写自己的存储驱动。你的自定义驱动应实现 `Laravel\Pennant\Contracts\Driver` 接口：

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

现在，我们只需要使用 Redis 连接实现这些方法。关于如何实现这些方法的示例，请查看 [Pennant 源码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php)中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]
> Laravel 不附带存放扩展的目录。你可以自由地将它们放在任何喜欢的地方。在此示例中，我们创建了一个 `Extensions` 目录来存放 `RedisFeatureDriver`。

<a name="registering-the-driver"></a>
#### 注册驱动

驱动实现完成后，你就可以在 Laravel 中注册它了。要向 Pennant 添加额外驱动，可以使用 `Feature` Facade 提供的 `extend` 方法。你应在应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法：

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
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

驱动注册后，你可以在应用 `config/pennant.php` 配置文件中使用 `redis` 驱动：

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

如果你的驱动是第三方功能开关平台的封装，你很可能在该平台上定义功能，而不是使用 Pennant 的 `Feature::define` 方法。如果是这种情况，你的自定义驱动还应实现 `Laravel\Pennant\Contracts\DefinesFeaturesExternally` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;
use Laravel\Pennant\Contracts\DefinesFeaturesExternally;

class FeatureFlagServiceDriver implements Driver, DefinesFeaturesExternally
{
    /**
     * Get the features defined for the given scope.
     */
    public function definedFeaturesForScope(mixed $scope): array {}

    /* ... */
}
```

`definedFeaturesForScope` 方法应返回为所提供作用域定义的功能名称列表。

<a name="events"></a>
## 事件

Pennant 会分发各种事件，这些事件在跟踪整个应用中的功能开关时可能很有用。

### `Laravel\Pennant\Events\FeatureRetrieved`

每当[检查功能](#checking-features)时触发此事件。此事件可能有助于创建和跟踪应用内功能开关使用情况的指标。

### `Laravel\Pennant\Events\FeatureResolved`

首次为特定作用域解析功能值时触发此事件。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

首次为特定作用域解析未知功能时触发此事件。如果你本打算移除某个功能开关，却意外地在应用中留下了对它的零散引用，监听此事件可能会很有用：

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
     * Bootstrap any application services.
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

当在请求期间首次动态检查[基于类的功能](#class-based-features)时触发此事件。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

当向[不支持 null](#nullable-scope)的功能定义传递 `null` 作用域时触发此事件。

这种情况会被优雅处理，功能将返回 `false`。但是，如果你想退出此功能的默认优雅行为，可以在应用 `AppServiceProvider` 的 `boot` 方法中为此事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}
```

### `Laravel\Pennant\Events\FeatureUpdated`

在为作用域更新功能时触发此事件，通常通过调用 `activate` 或 `deactivate`。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

在为所有作用域更新功能时触发此事件，通常通过调用 `activateForEveryone` 或 `deactivateForEveryone`。

### `Laravel\Pennant\Events\FeatureDeleted`

在为作用域删除功能时触发此事件，通常通过调用 `forget`。

### `Laravel\Pennant\Events\FeaturesPurged`

在清除特定功能时触发此事件。

### `Laravel\Pennant\Events\AllFeaturesPurged`

在清除所有功能时触发此事件。
