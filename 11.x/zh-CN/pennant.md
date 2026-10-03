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
- [获取多个功能](#retrieving-multiple-features)
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

[Laravel Pennant](https://github.com/laravel/pennant) 是一个简单轻量的功能开关包——没有任何多余负担。功能开关让你可以有信心地逐步推出新的应用功能、对新的界面设计做 A/B 测试、作为基于主干（trunk-based）开发策略的补充，等等。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器把 Pennant 安装到你的项目中：

```shell
composer require laravel/pennant
```

接下来，你应当使用 `vendor:publish` Artisan 命令发布 Pennant 的配置文件和数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，你应当运行应用的数据库迁移。这会创建一个 `features` 表，Pennant 用它来驱动 `database` 驱动：

```shell
php artisan migrate
```

<a name="configuration"></a>
## 配置

发布 Pennant 的资源后，其配置文件会位于 `config/pennant.php`。该配置文件允许你指定 Pennant 用来存储已解析功能开关值的默认存储机制。

Pennant 支持通过 `array` 驱动把已解析的功能开关值存储在内存数组中。或者，Pennant 也可以通过 `database` 驱动把已解析的功能开关值持久化到关系型数据库中，这也是 Pennant 默认使用的存储机制。

<a name="defining-features"></a>
## 定义功能

要定义一个功能，可以使用 `Feature` Facade 提供的 `define` 方法。你需要为该功能提供一个名称，以及一个用于解析该功能初始值的闭包。

通常，功能会在服务提供者中使用 `Feature` Facade 定义。该闭包会接收到功能检查的「作用域」。作用域通常是当前已认证的用户。在这个示例中，我们将定义一个功能，用于逐步向应用用户推出新的 API：

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
     * 引导任何应用服务。
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

如你所见，我们为该功能设定了如下规则：

- 所有内部团队成员都应使用新 API。
- 任何高流量客户都不应使用新 API。
- 其余情况下，该功能应以 1/100 的概率随机分配给用户并启用。

首次为某个用户检查 `new-api` 功能时，闭包的结果会由存储驱动保存下来。下一次针对同一用户检查该功能时，会从存储中取回该值，闭包不会被调用。

为方便起见，如果某个功能定义只返回一个 Lottery，可以完全省略闭包：

```php
Feature::define('site-redesign', Lottery::odds(1, 1000));
```

<a name="class-based-features"></a>
### 基于类的功能

Pennant 还允许你定义基于类的功能。与基于闭包的功能定义不同，基于类的功能无需在服务提供者中注册。要创建基于类的功能，可以调用 `pennant:feature` Artisan 命令。默认情况下，功能类会被放在应用的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能类时，你只需定义一个 `resolve` 方法，该方法会被调用以解析给定作用域下该功能的初始值。同样，作用域通常是当前已认证的用户：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * 解析该功能的初始值。
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

如果你想手动解析某个基于类的功能的实例，可以在 `Feature` Facade 上调用 `instance` 方法：

```php
use Illuminate\Support\Facades\Feature;

$instance = Feature::instance(NewApi::class);
```

> [!NOTE]
> 功能类通过[容器](/docs/{{version}}/container)解析，因此你可以按需向功能类的构造函数注入依赖。

#### 自定义存储的功能名称

默认情况下，Pennant 会存储功能类的完整类名。如果你希望把存储的功能名称与应用的内部结构解耦，可以在功能类上指定一个 `$name` 属性。该属性的值会代替类名被存储：

```php
<?php

namespace App\Features;

class NewApi
{
    /**
     * 该功能存储时使用的名称。
     *
     * @var string
     */
    public $name = 'new-api';

    // ...
}
```

<a name="checking-features"></a>
## 检查功能

要判断某个功能是否已启用，可以在 `Feature` Facade 上使用 `active` 方法。默认情况下，功能是针对当前已认证的用户检查的：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * 展示资源列表。
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

尽管功能默认是针对当前已认证的用户检查的，但你也可以轻松地针对另一个用户或[作用域](#scope)来检查。为此，使用 `Feature` Facade 提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了一些额外的便捷方法，在判断某个功能是否启用时可能很有用：

```php
// 判断给定的所有功能是否都已启用...
Feature::allAreActive(['new-api', 'site-redesign']);

// 判断给定的功能中是否有任意一个已启用...
Feature::someAreActive(['new-api', 'site-redesign']);

// 判断某个功能是否未启用...
Feature::inactive('new-api');

// 判断给定的所有功能是否都未启用...
Feature::allAreInactive(['new-api', 'site-redesign']);

// 判断给定的功能中是否有任意一个未启用...
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]
> 在 HTTP 上下文之外使用 Pennant 时（例如在 Artisan 命令或队列作业中），你通常应当[显式指定功能的作用域](#specifying-the-scope)。或者，你可以定义一个兼顾已认证 HTTP 上下文与未认证上下文的[默认作用域](#default-scope)。

<a name="checking-class-based-features"></a>
#### 检查基于类的功能

对于基于类的功能，检查功能时应当提供类名：

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
     * 展示资源列表。
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

如果某个功能已启用，可以使用 `when` 方法以链式方式执行给定闭包。此外，你还可以提供第二个闭包，它会在功能未启用时执行：

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
     * 展示资源列表。
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

`unless` 方法与 `when` 方法相反，它在功能未启用时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

<a name="the-has-features-trait"></a>
### `HasFeatures` Trait

Pennant 的 `HasFeatures` Trait 可以添加到应用的 `User` 模型（或任何拥有功能的其它模型）上，从而提供一种流畅便捷的方式，直接从模型上检查功能：

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

把该 Trait 添加到模型后，你可以通过调用 `features` 方法轻松地检查功能：

```php
if ($user->features()->active('new-api')) {
    // ...
}
```

当然，`features` 方法还提供了许多其它便于与功能交互的方法：

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

为了让在 Blade 中检查功能变得轻松愉快，Pennant 提供了 `@feature` 和 `@featureany` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' 已启用 -->
@else
    <!-- 'site-redesign' 未启用 -->
@endfeature

@featureany(['site-redesign', 'beta'])
    <!-- 'site-redesign' 或 `beta` 已启用 -->
@endfeatureany
```

<a name="middleware"></a>
### 中间件

Pennant 还包含一个[中间件](/docs/{{version}}/middleware)，可在路由被调用之前验证当前已认证的用户是否有权访问某个功能。你可以把该中间件分配给路由，并指定访问该路由所需的功能。如果指定的功能中任意一个对当前已认证的用户未启用，该路由会返回 `400 Bad Request` HTTP 响应。可以向静态的 `using` 方法传入多个功能。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ...
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

<a name="customizing-the-response"></a>
#### 自定义响应

如果你想定制某个所列功能未启用时中间件返回的响应，可以使用 `EnsureFeaturesAreActive` 中间件提供的 `whenInactive` 方法。通常，应当在你应用某个服务提供者的 `boot` 方法中调用该方法：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * 引导任何应用服务。
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

有时，在取回某个给定功能的存储值之前先做一些内存中的检查会很有用。设想你正在一个功能开关之后开发一个新 API，并希望能够禁用该新 API，同时不丢失存储中任何已解析的功能值。如果你发现新 API 中存在某个缺陷，可以轻松地为除内部团队成员之外的所有人禁用它，修好缺陷后再为此前拥有该功能访问权的用户重新启用新 API。

你可以通过[基于类的功能](#class-based-features)的 `before` 方法实现这一点。该方法存在时，会在从存储中取回值之前始终于内存中运行。如果该方法返回一个非 `null` 的值，在本次请求期间就会用该值代替该功能的存储值：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * 在取回存储值之前始终于内存中执行的检查。
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }
    }

    /**
     * 解析该功能的初始值。
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

你也可以利用该功能来为此前置于某个功能开关之后的功能安排全局推出：

```php
<?php

namespace App\Features;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class NewApi
{
    /**
     * 在取回存储值之前始终于内存中执行的检查。
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

检查某个功能时，Pennant 会为结果创建一个内存缓存。如果你使用 `database` 驱动，这意味着在单次请求内重复检查同一个功能开关不会触发额外的数据库查询。这也确保了该功能在本次请求期间结果保持一致。

如果需要手动清空内存缓存，可以使用 `Feature` Facade 提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

<a name="scope"></a>
## 作用域

<a name="specifying-the-scope"></a>
### 指定作用域

如前所述，功能通常是针对当前已认证的用户检查的。但这未必总符合你的需求。因此，你可以通过 `Feature` Facade 的 `for` 方法指定你希望针对哪个作用域检查某个给定功能：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

当然，功能作用域并不限于「用户」。设想你构建了一套全新的计费体验，正面向整个团队而非单个用户推出。也许你希望较老的团队比新团队推出得更慢一些。你的功能解析闭包可能类似下面这样：

```php
use App\Models\Team;
use Carbon\Carbon;
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

你会注意到我们定义的闭包期望接收的是 `Team` 而不是 `User`。要判断某个功能对某个用户的团队是否启用，应当把该团队传给 `Feature` Facade 提供的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect('/billing/v2');
}

// ...
```

<a name="default-scope"></a>
### 默认作用域

你也可以定制 Pennant 检查功能时使用的默认作用域。例如，你的所有功能可能是针对当前已认证用户的团队而非用户进行检查。与其每次检查功能时都不得不调用 `Feature::for($user->team)`，你可以改为把该团队指定为默认作用域。通常，应当在应用某个服务提供者中完成这一操作：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ...
    }
}
```

如果没有通过 `for` 方法显式提供作用域，功能检查现在就会使用当前已认证用户的团队作为默认作用域：

```php
Feature::active('billing-v2');

// 现在等价于...

Feature::for($user->team)->active('billing-v2');
```

<a name="nullable-scope"></a>
### 可空作用域

如果你在检查某个功能时提供的作用域为 `null`，并且该功能的定义没有通过可空类型或把 `null` 包含在联合类型中来支持 `null`，那么 Pennant 会自动返回 `false` 作为该功能的结果值。

因此，如果你传给某个功能的作用域可能是 `null`，并且希望该功能的值解析器被调用，就应当在功能定义中考虑这一点。在 Artisan 命令、队列作业或未认证路由中检查功能时，可能出现 `null` 作用域。由于在这些上下文中通常没有已认证的用户，默认作用域会是 `null`。

如果你并非总是[显式指定功能作用域](#specifying-the-scope)，就应当确保作用域的类型是「可空的」，并在功能定义逻辑中处理 `null` 作用域值：

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

Pennant 内置的 `array` 和 `database` 存储驱动知道如何正确存储所有 PHP 数据类型以及 Eloquent 模型的作用域标识符。不过，如果你的应用使用了第三方 Pennant 驱动，该驱动可能并不知道如何正确存储你应用中 Eloquent 模型或其它自定义类型的标识符。

鉴于此，Pennant 允许你通过在应用中作为 Pennant 作用域使用的对象上实现 `FeatureScopeable` 契约，来格式化用于存储的作用域值。

例如，设想你在单个应用中使用了两个不同的功能驱动：内置的 `database` 驱动和第三方「Flag Rocket」驱动。「Flag Rocket」驱动并不知道如何正确存储 Eloquent 模型，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier`，我们可以定制提供给应用所用各个驱动的可存储作用域值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * 把该对象转换为给定驱动的功能作用域标识符。
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

默认情况下，Pennant 在存储与 Eloquent 模型关联的功能时会使用完整类名。如果你已经在使用 [Eloquent 多态映射](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，你也可以选择让 Pennant 同样使用该映射，从而把存储的功能与应用结构解耦。

为此，在服务提供者中定义好 Eloquent 多态映射之后，你可以调用 `Feature` Facade 的 `useMorphMap` 方法：

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

到目前为止，我们主要把功能展示为二元状态，也就是说它们要么「已启用」要么「未启用」，但 Pennant 还允许你存储更丰富的值。

例如，设想你正在为应用的「立即购买」按钮测试三种新颜色。你可以在功能定义中返回一个字符串，而不是返回 `true` 或 `false`：

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

Pennant 附带的 Blade 指令也让你可以轻松地根据功能的当前值有条件地渲染内容：

```blade
@feature('purchase-button', 'blue-sapphire')
    <!-- 'blue-sapphire' 已启用 -->
@elsefeature('purchase-button', 'seafoam-green')
    <!-- 'seafoam-green' 已启用 -->
@elsefeature('purchase-button', 'tart-orange')
    <!-- 'tart-orange' 已启用 -->
@endfeature
```

> [!NOTE]
> 使用丰富值时，务必知道：只要功能的值不是 `false`，就被视为「已启用」。

调用[条件 `when`](#conditional-execution)方法时，该功能的丰富值会被传给第一个闭包：

```php
Feature::when('purchase-button',
    fn ($color) => /* ... */,
    fn () => /* ... */,
);
```

同理，调用条件 `unless` 方法时，该功能的丰富值会被传给可选的第二个闭包：

```php
Feature::unless('purchase-button',
    fn () => /* ... */,
    fn ($color) => /* ... */,
);
```

<a name="retrieving-multiple-features"></a>
## 获取多个功能

`values` 方法允许获取给定作用域下的多个功能：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，你可以使用 `all` 方法获取给定作用域下所有已定义功能的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

不过，基于类的功能是动态注册的，在被显式检查之前 Pennant 并不知道它们的存在。这意味着如果你的基于类的功能在当前请求期间尚未被检查，它们就不会出现在 `all` 方法返回的结果中。

如果你希望确保在使用 `all` 方法时始终包含功能类，可以使用 Pennant 的功能发现能力。要开始使用，在应用某个服务提供者中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Feature::discover();

        // ...
    }
}
```

`discover` 方法会注册你应用 `app/Features` 目录中的所有功能类。现在 `all` 方法会在结果中包含这些类，无论它们在当前请求期间是否已被检查：

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

尽管 Pennant 会为单次请求中所有已解析的功能保留一份内存缓存，但仍然可能遇到性能问题。为缓解这一点，Pennant 提供了预加载功能值的能力。

举例来说，设想我们在循环中检查某个功能是否启用：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用的是数据库驱动，这段代码会为循环中的每个用户执行一次数据库查询——可能执行数百次查询。不过，借助 Pennant 的 `load` 方法，可以为一批用户或作用域预加载功能值，从而消除这个潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

如果只想在功能值尚未被加载时才加载它们，可以使用 `loadMissing` 方法：

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

某个功能的值首次被解析时，底层驱动会把结果存入存储。这通常对确保你的用户在多次请求之间获得一致体验是必要的。不过，有时你可能想手动更新该功能的存储值。

为此，你可以使用 `activate` 和 `deactivate` 方法把某个功能「打开」或「关闭」：

```php
use Laravel\Pennant\Feature;

// 为默认作用域启用该功能...
Feature::activate('new-api');

// 为给定作用域停用该功能...
Feature::for($user->team)->deactivate('billing-v2');
```

你也可以通过向 `activate` 方法提供第二个参数，为某个功能手动设置一个丰富值：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要指示 Pennant 遗忘某个功能的存储值，可以使用 `forget` 方法。当该功能被再次检查时，Pennant 会根据其功能定义重新解析该功能的值：

```php
Feature::forget('purchase-button');
```

<a name="bulk-updates"></a>
### 批量更新

要批量更新存储的功能值，可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，设想你现在确信 `new-api` 功能已经稳定，并为结账流程选定了最佳的 `'purchase-button'` 颜色——你可以相应地更新所有用户的存储值：

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
> 这只会更新已由 Pennant 存储驱动保存的已解析功能值。你还需要更新应用中的功能定义。

<a name="purging-features"></a>
### 清除功能

有时，把某个功能从存储中完全清除会很有用。如果你已从应用中移除该功能，或者对该功能的定义做了调整并希望向所有用户推出，通常就需要这样做。

你可以使用 `purge` 方法移除某个功能的全部存储值：

```php
// 清除单个功能...
Feature::purge('new-api');

// 清除多个功能...
Feature::purge(['new-api', 'purchase-button']);
```

如果你想从存储中清除_所有_功能，可以在不传任何参数的情况下调用 `purge` 方法：

```php
Feature::purge();
```

由于把清除功能作为应用部署流程的一部分会很有用，Pennant 提供了 `pennant:purge` Artisan 命令，它会把指定的功能从存储中清除：

```sh
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也可以清除给定功能列表之外的所有功能。例如，设想你想清除所有功能，但把「new-api」和「purchase-button」功能的值保留在存储中。为此，可以把这些功能名传给 `--except` 选项：

```sh
php artisan pennant:purge --except=new-api --except=purchase-button
```

为方便起见，`pennant:purge` 命令还支持 `--except-registered` 标志。该标志表示除那些在服务提供者中显式注册的功能之外，其余功能都应被清除：

```sh
php artisan pennant:purge --except-registered
```

<a name="testing"></a>
## 测试

测试与功能开关交互的代码时，控制测试中功能开关返回值最简单的方式就是重新定义该功能。例如，设想你在应用某个服务提供者中定义了如下功能：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要在测试中修改该功能的返回值，可以在测试开头重新定义该功能。下面的测试将始终通过，即使服务提供者中仍保留着 `Arr::random()` 实现：

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

同样的做法也适用于基于类的功能：

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

如果你的某个功能返回的是 `Lottery` 实例，可以使用一些实用的[测试辅助方法](/docs/{{version}}/helpers#testing-lotteries)。

<a name="store-configuration"></a>
#### 存储配置

你可以通过在应用的 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量，配置 Pennant 在测试期间使用的存储：

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

如果 Pennant 现有的存储驱动都不符合你的应用需求，你可以编写自己的存储驱动。你的自定义驱动应当实现 `Laravel\Pennant\Contracts\Driver` 接口：

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

现在，我们只需使用 Redis 连接来实现其中每个方法。关于如何实现这些方法，请参阅 [Pennant 源代码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php)中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]
> Laravel 并未附带用于放置扩展的目录。你可以自由地把它们放在任意位置。在这个示例中，我们创建了一个 `Extensions` 目录来存放 `RedisFeatureDriver`。

<a name="registering-the-driver"></a>
#### 注册驱动

驱动实现完成后，就可以把它注册到 Laravel。要给 Pennant 添加额外的驱动，可以使用 `Feature` Facade 提供的 `extend` 方法。你应当在应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法：

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
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

驱动注册完成后，你就可以在应用的 `config/pennant.php` 配置文件中使用 `redis` 驱动：

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

如果你的驱动是某个第三方功能开关平台的封装，你很可能会在该平台上定义功能，而不是使用 Pennant 的 `Feature::define` 方法。如果是这种情况，你的自定义驱动还应当实现 `Laravel\Pennant\Contracts\DefinesFeaturesExternally` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;
use Laravel\Pennant\Contracts\DefinesFeaturesExternally;

class FeatureFlagServiceDriver implements Driver, DefinesFeaturesExternally
{
    /**
     * 获取为给定作用域定义的功能。
     */
    public function definedFeaturesForScope(mixed $scope): array {}

    /* ... */
}
```

`definedFeaturesForScope` 方法应当返回为所提供作用域定义的功能名称列表。

<a name="events"></a>
## 事件

Pennant 会派发一系列事件，在整个应用中跟踪功能开关时可能很有用。

### `Laravel\Pennant\Events\FeatureRetrieved`

每次[检查某个功能](#checking-features)时都会派发该事件。该事件可能有助于创建并跟踪功能开关在整个应用中的使用指标。

### `Laravel\Pennant\Events\FeatureResolved`

某个功能的值首次为特定作用域被解析时派发该事件。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

某个未知功能首次为特定作用域被解析时派发该事件。如果你本打算移除某个功能开关，却在应用中不小心留下了指向它的残留引用，那么监听该事件会很有帮助：

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
     * 引导任何应用服务。
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

某个[基于类的功能](#class-based-features)在请求期间首次被动态检查时派发该事件。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

向某个[不支持 null](#nullable-scope)的功能定义传入 `null` 作用域时派发该事件。

这种情况会被优雅地处理，该功能将返回 `false`。不过，如果你想退出该功能默认的优雅处理行为，可以在应用 `AppServiceProvider` 的 `boot` 方法中为该事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}

```

### `Laravel\Pennant\Events\FeatureUpdated`

为某个作用域更新某个功能时派发该事件，通常通过调用 `activate` 或 `deactivate` 完成。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

为所有作用域更新某个功能时派发该事件，通常通过调用 `activateForEveryone` 或 `deactivateForEveryone` 完成。

### `Laravel\Pennant\Events\FeatureDeleted`

为某个作用域删除某个功能时派发该事件，通常通过调用 `forget` 完成。

### `Laravel\Pennant\Events\FeaturesPurged`

清除特定功能时派发该事件。

### `Laravel\Pennant\Events\AllFeaturesPurged`

清除所有功能时派发该事件。
