# Laravel Pennant

## 简介

[Laravel Pennant](https://github.com/laravel/pennant) 是一个简单、轻量的功能开关（feature flag）包——没有多余的累赘。功能开关（feature flag）让你能够从容地逐步上线新的应用功能、对新的界面设计进行 A/B 测试、补充主干开发（trunk-based development）策略，以及更多。

## 安装

首先，使用 Composer 包管理器将 Pennant 安装到你的项目中：

```shell
composer require laravel/pennant
```

接下来，你应当使用 `vendor:publish` Artisan 命令发布 Pennant 的配置文件和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，你应当运行应用的数据库迁移。这会创建一张 `features` 表，Pennant 用它来驱动其 `database` 驱动：

```shell
php artisan migrate
```

## 配置

发布 Pennant 的资源后，它的配置文件会位于 `config/pennant.php`。该配置文件允许你指定 Pennant 用来存储已解析功能开关（feature flag）值的默认存储机制。

Pennant 支持通过 `array` 驱动将已解析的功能开关（feature flag）值存储在内存数组中。或者，Pennant 可以通过 `database` 驱动将已解析的功能开关（feature flag）值持久化存储在关系型数据库中，这是 Pennant 使用的默认存储机制。

## 定义功能

要定义一个功能（feature），你可以使用 `Feature` Facade 提供的 `define` 方法。你需要为功能（feature）提供一个名称，以及一个会被调用来解析该功能（feature）初始值的闭包。

通常，功能（feature）是在服务提供者（Service Provider）中使用 `Feature` Facade 定义的。该闭包会接收功能（feature）检查的"作用域（scope）"。最常见的情况是，作用域（scope）是当前已认证的用户。在此示例中，我们将为向应用用户逐步上线的新 API 定义一个功能（feature）：

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
     * 引导任意应用服务。
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

如你所见，我们的功能（feature）有以下规则：

- 所有内部团队成员都应当使用新 API。
- 任何高流量客户都不应使用新 API。
- 其他情况下，该功能（feature）应以 100 分之一的概率被随机分配给用户并处于启用状态。

首次针对给定用户检查 `new-api` 功能（feature）时，闭包的结果会被存储驱动保存。下次针对同一用户检查该功能（feature）时，值会从存储中获取，不会再次调用闭包。

为方便起见，如果一个功能（feature）定义只返回一个 lottery，你可以完全省略闭包：

    Feature::define('site-redesign', Lottery::odds(1, 1000));

### 基于类的功能

Pennant 还允许你定义基于类的功能（feature）。与基于闭包的功能（feature）定义不同，基于类的功能（feature）无需在服务提供者（Service Provider）中注册。要创建基于类的功能（feature），你可以调用 `pennant:feature` Artisan 命令。默认情况下，功能（feature）类会放置在应用的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能（feature）类时，你只需定义一个 `resolve` 方法，该方法会被调用来解析给定作用域（scope）下该功能（feature）的初始值。同样地，作用域（scope）通常就是当前已认证的用户：

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

如果你希望手动解析一个基于类的功能（feature）实例，可以调用 `Feature` Facade 上的 `instance` 方法：

```php
use Illuminate\Support\Facades\Feature;

$instance = Feature::instance(NewApi::class);
```

> [!NOTE]
> 功能（feature）类是通过[容器（container）](/docs/{{version}}/container)解析的，因此你可以在需要时将依赖注入到功能（feature）类的构造函数中。

#### 自定义存储的功能名称

默认情况下，Pennant 会存储功能（feature）类的完全限定类名。如果你希望将存储的功能（feature）名称与应用内部结构解耦，可以在功能（feature）类上添加 `Name` 属性。该属性的值会代替类名被存储：

```php
<?php

namespace App\Features;

use Laravel\Pennant\Attributes\Name;

#[Name('new-api')]
class NewApi
{
    // ……
}
```

## 检查功能

要确定某个功能（feature）是否启用，可以使用 `Feature` Facade 上的 `active` 方法。默认情况下，功能（feature）是针对当前已认证的用户检查的：

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

    // ……
}
```

尽管默认情况下功能（feature）是针对当前已认证的用户检查的，你也可以轻松针对另一个用户或[作用域（scope）](#scope)检查功能（feature）。为此，请使用 `Feature` Facade 提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了一些额外的便捷方法，在确定功能（feature）是否启用时可能很有用：

```php
// 判断给定的所有功能是否都启用……
Feature::allAreActive(['new-api', 'site-redesign']);

// 判断给定的任意功能是否启用……
Feature::someAreActive(['new-api', 'site-redesign']);

// 判断某个功能是否停用……
Feature::inactive('new-api');

// 判断给定的所有功能是否都停用……
Feature::allAreInactive(['new-api', 'site-redesign']);

// 判断给定的任意功能是否停用……
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]
> 在 HTTP 上下文之外使用 Pennant 时（例如在 Artisan 命令或队列任务中），通常应当[显式指定功能（feature）的作用域（scope）](#specifying-the-scope)。或者，你可以定义一个同时兼顾已认证 HTTP 上下文和未认证上下文的[默认作用域（scope）](#default-scope)。

#### 检查基于类的功能

对于基于类的功能（feature），在检查功能（feature）时应当提供类名：

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

    // ……
}
```

### 条件执行

`when` 方法可用于在功能（feature）启用时流畅地执行给定的闭包。此外，还可以提供第二个闭包，它会在功能（feature）停用执行：

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

    // ……
}
```

`unless` 方法的作用与 `when` 方法相反，它会在功能（feature）停用时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

### `HasFeatures` Trait

Pennant 的 `HasFeatures` Trait 可以添加到应用的 `User` 模型（或任何其他拥有功能（feature）的模型）上，以提供流畅、便捷的方式来直接从模型检查功能（feature）：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Pennant\Concerns\HasFeatures;

class User extends Authenticatable
{
    use HasFeatures;

    // ……
}
```

一旦将该 Trait 添加到模型，你就可以通过调用 `features` 方法轻松检查功能（feature）：

```php
if ($user->features()->active('new-api')) {
    // ……
}
```

当然，`features` 方法还提供了许多其他便捷方法来与功能（feature）交互：

```php
// 值……
$value = $user->features()->value('purchase-button')
$values = $user->features()->values(['new-api', 'purchase-button']);

// 状态……
$user->features()->active('new-api');
$user->features()->allAreActive(['new-api', 'server-api']);
$user->features()->someAreActive(['new-api', 'server-api']);

$user->features()->inactive('new-api');
$user->features()->allAreInactive(['new-api', 'server-api']);
$user->features()->someAreInactive(['new-api', 'server-api']);

// 条件执行……
$user->features()->when('new-api',
    fn () => /* …… */,
    fn () => /* …… */,
);

$user->features()->unless('new-api',
    fn () => /* …… */,
    fn () => /* …… */,
);
```

### Blade 指令

为了让在 Blade 中检查功能（feature）成为无缝体验，Pennant 提供了 `@feature` 和 `@featureany` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' 已启用 -->
@else
    <!-- 'site-redesign' 已停用 -->
@endfeature

@featureany(['site-redesign', 'beta'])
    <!-- 'site-redesign' 或 `beta` 已启用 -->
@endfeatureany
```

### 中间件

Pennant 还包含一个[中间件（middleware）](/docs/{{version}}/middleware)，可在路由被调用之前用来验证当前已认证的用户是否有权访问某功能（feature）。你可以将中间件（middleware）分配给路由，并指定访问该路由所需的功能（feature）。如果当前已认证的用户有任何指定的功能（feature）处于停用状态，路由会返回 `400 Bad Request` HTTP 响应。可以向静态的 `using` 方法传入多个功能（feature）。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ……
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

#### 自定义响应

如果你希望自定义当列出的功能（feature）之一处于停用状态时由中间件（middleware）返回的响应，可以使用 `EnsureFeaturesAreActive` 中间件（middleware）提供的 `whenInactive` 方法。通常，该方法应当在一个应用的服务提供者（Service Provider）的 `boot` 方法中调用：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    EnsureFeaturesAreActive::whenInactive(
        function (Request $request, array $features) {
            return new Response(status: 403);
        }
    );

    // ……
}
```

### 拦截功能检查

有时，在获取某功能（feature）的存储值之前执行一些内存检查会很有用。想象你正在一个功能开关（feature flag）后开发一个新 API，并希望能够在不会丢失存储中任何已解析功能（feature）值的情况下禁用新 API。如果你注意到新 API 中存在 bug，可以轻松地为除内部团队成员以外的所有人禁用它，修复 bug，然后为之前有权访问该功能（feature）的用户重新启用新 API。

你可以通过[基于类的功能（feature）](#class-based-features)的 `before` 方法实现这一点。当存在时，`before` 方法总是在从存储获取值之前在内存中运行。如果该方法返回了非 `null` 的值，那么在请求的持续期间，它会代替该功能（feature）的存储值被使用：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * 在获取存储值之前，始终在内存中运行一次检查。
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

你也可以使用此功能（feature）来安排之前处于功能开关（feature flag）之后的功能（feature）的全局上线：

```php
<?php

namespace App\Features;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class NewApi
{
    /**
     * 在获取存储值之前，始终在内存中运行一次检查。
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

    // ……
}
```

### 内存缓存

检查功能（feature）时，Pennant 会创建结果的内存缓存。如果你使用的是 `database` 驱动，这意味着在同一请求内重新检查相同的功能开关（feature flag）不会触发额外的数据库查询。这也确保了该功能（feature）在请求的持续期间内拥有一致的结果。

如果你需要手动刷新内存缓存，可以使用 `Feature` Facade 提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

## 作用域

### 指定作用域

如前所述，功能（feature）通常是针对当前已认证的用户检查的。但是，这可能并不总是适合你的需求。因此，可以通过 `Feature` Facade 的 `for` 方法指定你希望针对其检查给定功能（feature）的作用域（scope）：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

当然，功能（feature）作用域（scope）并不限于"用户"。想象你构建了一个新的计费体验，你正将其面向整个团队而非单个用户上线。也许你希望较老的团队比新团队有更慢的上线速度。你的功能（feature）解析闭包可能如下所示：

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

你会注意到，我们定义的闭包并不期望接收 `User`，而是期望接收 `Team` 模型。要确定该功能（feature）对于用户所属团队是否启用，你应当将团队传给 `Feature` Facade 提供的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect('/billing/v2');
}

// ……
```

### 全局作用域

要使用全局作用域（scope）检查或与功能（feature）交互，而不管配置的默认作用域（scope）解析器如何，请使用 `globally` 方法。这对于应用级的功能开关（feature flag）很有用，例如临时启用维护行为或向每个用户上线某功能（feature）：

```php
Feature::globally()->active('new-api');

Feature::globally()->activate('new-api');
```

### 默认作用域

也可以自定义 Pennant 用来检查功能（feature）的默认作用域（scope）。例如，也许你的所有功能（feature）都是针对当前已认证用户所属团队而非用户本身检查的。与其在每次检查功能（feature）时都调用 `Feature::for($user->team)`，不如将团队指定为默认作用域（scope）。通常，这应当在一个应用的服务提供者（Service Provider）中完成：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ……
    }
}
```

如果没有通过 `for` 方法显式提供作用域（scope），功能（feature）检查现在会使用当前已认证用户所属的团队作为默认作用域（scope）：

```php
Feature::active('billing-v2');

// 现在等价于……

Feature::for($user->team)->active('billing-v2');
```

### 可空作用域

如果你检查功能（feature）时提供的作用域（scope）为 `null`，且功能（feature）的定义不支持通过可空类型或联合类型中包含 `null` 来支持 `null`，Pennant 会自动返回 `false` 作为该功能（feature）的结果值。

因此，如果你传给功能（feature）的作用域（scope）可能为 `null`，并且你希望功能（feature）的值解析器被调用，你应当在功能（feature）定义中考虑到这一点。如果你在 Artisan 命令、队列任务或未认证路由中检查功能（feature），就可能出现 `null` 作用域（scope）。由于在这些上下文中通常没有已认证的用户，默认作用域（scope）会是 `null`。

如果你并非总是[显式指定功能（feature）的作用域（scope）](#specifying-the-scope)，那么你应该确保作用域（scope）的类型是"可空的"，并在功能（feature）定义逻辑中处理 `null` 作用域（scope）值：

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

### 识别作用域

Pennant 内置的 `array` 和 `database` 存储驱动知道如何为所有 PHP 数据类型以及 Eloquent 模型正确存储作用域（scope）标识符。但是，如果你的应用使用了第三方的 Pennant 驱动，该驱动可能不知道如何为应用中的 Eloquent 模型或其他自定义类型正确存储标识符。

鉴于此，Pennant 允许你通过在应用中用作 Pennant 作用域（scope）的对象上实现 `FeatureScopeable` 契约来格式化待存储的作用域（scope）值。

例如，想象你在单个应用中使用了两个不同的功能（feature）驱动：内置的 `database` 驱动和一个第三方的"Flag Rocket"驱动。"Flag Rocket"驱动不知道如何正确存储 Eloquent 模型。相反，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier`，我们可以自定义提供给应用所使用的每个驱动的、可存储的作用域（scope）值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * 将对象转换为给定驱动的功能作用域标识符。
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

### 序列化作用域

默认情况下，Pennant 在存储与 Eloquent 模型关联的功能（feature）时会使用完全限定类名。如果你已经在使用 [Eloquent 多态映射（morph map）](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，你可以选择让 Pennant 也使用多态映射（morph map）来将存储的功能（feature）与应用结构解耦。

为此，在服务提供者（Service Provider）中定义 Eloquent 多态映射（morph map）之后，你可以调用 `Feature` Facade 的 `useMorphMap` 方法：

```php
use Illuminate\Database\Eloquent\Relations\Relation;
use Laravel\Pennant\Feature;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);

Feature::useMorphMap();
```

## 丰富的功能值

到目前为止，我们主要将功能（feature）展示为处于二元状态，意味着它们要么"启用"要么"停用"，但 Pennant 也允许你存储富值（rich value）。

例如，想象你正在为应用的"立即购买"按钮测试三种新颜色。你可以返回一个字符串，而不是从功能（feature）定义返回 `true` 或 `false`：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn (User $user) => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

你可以使用 `value` 方法获取 `purchase-button` 功能（feature）的值：

```php
$color = Feature::value('purchase-button');
```

Pennant 内置的 Blade 指令也让根据功能（feature）的当前值有条件地渲染内容变得容易：

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
> 使用富值（rich value）时，很重要的一点是，当功能（feature）具有除 `false` 之外的任何值时，它就被视为"启用"。

调用条件 [`when`](#conditional-execution) 方法时，功能（feature）的富值（rich value）会被提供给第一个闭包：

```php
Feature::when('purchase-button',
    fn ($color) => /* …… */,
    fn () => /* …… */,
);
```

同样地，调用条件 `unless` 方法时，功能（feature）的富值（rich value）会被提供给可选的第二个闭包：

```php
Feature::unless('purchase-button',
    fn () => /* …… */,
    fn ($color) => /* …… */,
);
```

## 获取多个功能

`values` 方法允许获取给定作用域（scope）的多个功能（feature）：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，你可以使用 `all` 方法获取给定作用域（scope）所有已定义功能（feature）的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

不过，基于类的功能（feature）是动态注册的，在显式检查之前 Pennant 并不知道它们。这意味着，如果应用基于类的功能（feature）在当前请求期间尚未被检查，它们可能不会出现在 `all` 方法返回的结果中。

如果你希望确保在使用 `all` 方法时始终包含功能（feature）类，可以使用 Pennant 的功能（feature）发现能力。开始之前，在一个应用的服务提供者（Service Provider）中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Feature::discover();

        // ……
    }
}
```

`discover` 方法会注册应用 `app/Features` 目录中的所有功能（feature）类。`all` 方法现在会在其结果中包含这些类，无论它们是否已在当前请求期间被检查：

```php
Feature::all();

// [
//     'App\Features\NewApi' => true,
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

## 预加载

尽管 Pennant 在内存中缓存了单个请求的所有已解析功能（feature），仍然可能遇到性能问题。为缓解这一点，Pennant 提供了预加载功能（feature）值的能力。

为了说明这一点，想象我们在循环中检查某功能（feature）是否启用：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用的是 database 驱动，这段代码会为循环中的每个用户执行一次数据库查询——可能产生数百次查询。不过，使用 Pennant 的 `load` 方法，我们可以通过预加载一组用户或作用域（scope）的功能（feature）值来消除这个潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

要仅在功能（feature）值尚未加载时加载它们，可以使用 `loadMissing` 方法：

```php
Feature::for($users)->loadMissing([
    'new-api',
    'purchase-button',
    'notifications-beta',
]);
```

你可以使用 `loadAll` 方法加载所有已定义的功能（feature）：

```php
Feature::for($users)->loadAll();
```

## 更新值

当功能（feature）的值首次被解析时，底层驱动会将该结果存储到存储中。这通常对于确保用户在各请求之间获得一致的体验是必要的。不过，有时你可能希望手动更新功能（feature）的存储值。

为此，你可以使用 `activate` 和 `deactivate` 方法来切换功能（feature）的"开"或"关"：

```php
use Laravel\Pennant\Feature;

// 为默认作用域启用该功能……
Feature::activate('new-api');

// 为给定作用域停用该功能……
Feature::for($user->team)->deactivate('billing-v2');
```

也可以通过向 `activate` 方法提供第二个参数来手动为功能（feature）设置一个富值（rich value）：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要指示 Pennant 忘记功能（feature）的存储值，可以使用 `forget` 方法。当再次检查该功能（feature）时，Pennant 会根据其功能（feature）定义重新解析它的值：

```php
Feature::forget('purchase-button');
```

### 批量更新

要批量更新存储的功能（feature）值，可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，想象你现在对 `new-api` 功能（feature）的稳定性很有信心，并且已经确定了结账流程最佳的 `'purchase-button'` 颜色——你可以相应地更新所有用户的存储值：

```php
use Laravel\Pennant\Feature;

Feature::activateForEveryone('new-api');

Feature::activateForEveryone('purchase-button', 'seafoam-green');
```

或者，你可以为所有用户停用该功能（feature）：

```php
Feature::deactivateForEveryone('new-api');
```

> [!NOTE]
> 这只会更新已由 Pennant 的存储驱动存储的已解析功能（feature）值。你还需要更新应用中的功能（feature）定义。

### 清除功能

有时，从存储中清除整个功能（feature）会很有用。如果你已从应用中移除该功能（feature），或者你调整了功能（feature）定义并希望将其推送给所有用户，这通常是有必要的。

你可以使用 `purge` 方法移除某功能（feature）的所有存储值：

```php
// 清除单个功能……
Feature::purge('new-api');

// 清除多个功能……
Feature::purge(['new-api', 'purchase-button']);
```

如果你希望从存储中清除_所有_功能（feature），可以不带任何参数调用 `purge` 方法：

```php
Feature::purge();
```

由于将功能（feature）清除作为应用部署流水线的一部分会很有用，Pennant 包含了一个 `pennant:purge` Artisan 命令，它会从存储中清除提供的功能（feature）：

```shell
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也可以清除除给定功能（feature）列表之外的_所有_功能（feature）。例如，想象你希望清除所有功能（feature），但保留 `new-api` 和 `purchase-button` 功能（feature）的值在存储中。为此，你可以将这些功能（feature）名称传给 `--except` 选项：

```shell
php artisan pennant:purge --except=new-api --except=purchase-button
```

为方便起见，`pennant:purge` 命令还支持 `--except-registered` 标志。该标志表示应清除除显式注册在服务提供者（Service Provider）中的功能（feature）之外的所有功能（feature）：

```shell
php artisan pennant:purge --except-registered
```

## 测试

在测试与功能开关（feature flag）交互的代码时，在测试中控制功能开关（feature flag）返回值最简单的方式就是重新定义该功能（feature）。例如，想象你在应用的一个服务提供者（Service Provider）中定义了以下功能（feature）：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要在测试中修改功能（feature）的返回值，你可以在测试开始时重新定义该功能（feature）。以下测试将始终通过，即使服务提供者（Service Provider）中仍然存在 `Arr::random()` 实现：

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

同样的方法也可用于基于类的功能（feature）：

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

如果你的功能（feature）返回的是 `Lottery` 实例，有一系列有用的[测试辅助函数可用](/docs/{{version}}/helpers#testing-lotteries)。

#### 存储配置

你可以通过在应用的 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量来配置 Pennant 在测试期间使用的存储：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit colors="true">
    <!-- …… -->
    <php>
        <env name="PENNANT_STORE" value="array"/>
        <!-- …… -->
    </php>
</phpunit>
```

## 添加自定义 Pennant 驱动

#### 实现驱动

如果 Pennant 现有的存储驱动都不适合你的应用需求，你可以编写自己的存储驱动。你的自定义驱动应当实现 `Laravel\Pennant\Contracts\Driver` 接口：

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

现在，我们只需要使用 Redis 连接实现这些方法中的每一个。有关如何实现每个方法的示例，请查看 [Pennant 源代码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php) 中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]
> Laravel 没有附带用于存放你的扩展的目录。你可以将它们放在任何你喜欢的位置。在此示例中，我们创建了一个 `Extensions` 目录来容纳 `RedisFeatureDriver`。

#### 注册驱动

一旦你的驱动实现完成，就可以将其注册到 Laravel 中。要向 Pennant 添加额外的驱动，可以使用 `Feature` Facade 提供的 `extend` 方法。你应当从一个应用[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法：

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
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ……
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

一旦驱动注册完成，你就可以在应用的 `config/pennant.php` 配置文件中使用 `redis` 驱动：

```php
'stores' => [

    'redis' => [
        'driver' => 'redis',
        'connection' => null,
    ],

    // ……

],
```

### 在外部定义功能

如果你的驱动是围绕第三方功能开关（feature flag）平台的封装，你很可能会在该平台上而非使用 Pennant 的 `Feature::define` 方法定义功能（feature）。如果是这种情况，你的自定义驱动还应当实现 `Laravel\Pennant\Contracts\DefinesFeaturesExternally` 接口：

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

    /* …… */
}
```

`definedFeaturesForScope` 方法应当返回为提供的作用域（scope）定义的功能（feature）名称列表。

## 事件

Pennant 会派发各种事件，在跟踪应用中的功能开关（feature flag）时很有用。

### `Laravel\Pennant\Events\FeatureRetrieved`

每当[检查功能（feature）](#checking-features)时都会派发此事件。在创建和跟踪应用内功能开关（feature flag）的使用指标时，此事件可能很有用。

### `Laravel\Pennant\Events\FeatureResolved`

当一个功能（feature）的值首次针对特定作用域（scope）被解析时派发此事件。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

当一个未知功能（feature）首次针对特定作用域（scope）被解析时派发此事件。如果你本打算移除某功能开关（feature flag）却不慎在应用中留下了它的游离引用，监听此事件可能很有用：

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
     * 引导任意应用服务。
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

当[基于类的功能（feature）](#class-based-features)在请求期间首次被动态检查时派发此事件。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

当向一个[不支持 null](#nullable-scope)的功能（feature）定义传入 `null` 作用域（scope）时派发此事件。

这种情况会被优雅地处理，功能（feature）会返回 `false`。但是，如果你希望退出该功能（feature）默认的优雅行为，可以在应用的 `AppServiceProvider` 的 `boot` 方法中为此事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}
```

### `Laravel\Pennant\Events\FeatureUpdated`

当针对作用域（scope）更新某功能（feature）时派发此事件，通常是通过调用 `activate` 或 `deactivate`。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

当针对所有作用域（scope）更新某功能（feature）时派发此事件，通常是通过调用 `activateForEveryone` 或 `deactivateForEveryone`。

### `Laravel\Pennant\Events\FeatureDeleted`

当针对作用域（scope）删除某功能（feature）时派发此事件，通常是通过调用 `forget`。

### `Laravel\Pennant\Events\FeaturesPurged`

当清除特定功能（feature）时派发此事件。

### `Laravel\Pennant\Events\AllFeaturesPurged`

当清除所有功能（feature）时派发此事件。
