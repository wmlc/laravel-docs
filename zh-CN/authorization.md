# 授权

## 介绍

除了内置的 [认证](/docs/{{version}}/authentication) 服务外，Laravel 还提供了一种简单的方式来针对给定资源对用户动作进行授权。例如，即便某个用户已认证，也未必被授权更新或删除应用中由 Eloquent 模型或数据库记录管理的某些资源。Laravel 的授权特性提供了一种简单、有序的方式来管理这些授权检查。

Laravel 主要通过两种方式提供授权：[Gates](#gates) 和 [Policies](#creating-policies)。你可以把 Gate 和 Policy 想象成路由与控制器：Gate 提供了一种基于闭包的简单授权方案，而 Policy 则像控制器一样，围绕某个特定的模型或资源组织授权逻辑。本文档将先介绍 Gate，再来看 Policy。

构建应用时，并非只能在 Gate 或 Policy 之间二选一。大多数应用会同时混用 Gate 和 Policy，这完全没有问题！Gate 最适合用于那些与任何模型或资源无关的动作，例如查看管理员仪表盘；而当你希望针对某个特定模型或资源进行授权时，则应使用 Policy。

## Gates

### 编写 Gate

> [!WARNING]
> Gate 是学习 Laravel 授权特性基础的好方式；不过在构建健壮的 Laravel 应用时，建议使用 [Policies](#creating-policies) 来组织授权规则。

Gate 本质上是用于判断用户是否被授权执行某个给定动作的闭包。通常 Gate 在 `App\Providers\AppServiceProvider` 类的 `boot` 方法里通过 `Gate` Facade 定义。Gate 总是接收一个用户实例作为第一个参数，并可以可选地接收其它参数（如相关的 Eloquent 模型）。

下面这个示例中，我们将定义一个 Gate，用来判断用户是否可以更新给定的 `App\Models\Post` 模型。该 Gate 通过比较用户的 `id` 与文章创建者的 `user_id` 来实现：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

和控制器一样，Gate 也可以使用类回调数组的方式定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

### 通过 Gate 授权动作

要使用 Gate 进行授权，应当调用 `Gate` Facade 提供的 `allows` 或 `denies` 方法。注意，你无需向这些方法传入当前已认证用户，Laravel 会自动把当前用户传给 Gate 闭包。通常会在执行需要授权的动作之前，在控制器中调用这些授权方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新指定文章。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // 更新文章...

        return redirect('/posts');
    }
}
```

如果你想判断除当前已认证用户之外的某个用户是否有权执行某个动作，可以使用 `Gate` Facade 的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 该用户可以更新文章...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 该用户不能更新文章...
}
```

也可以一次授权多个动作，使用 `any` 或 `none` 方法：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 该用户可以更新或删除文章...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 该用户既不能更新也不能删除文章...
}
```

#### 授权或抛出异常

如果你希望在尝试授权某个动作时，如果用户不被允许就自动抛出一个 `Illuminate\Auth\Access\AuthorizationException`，可以使用 `Gate` Facade 的 `authorize` 方法。Laravel 会自动把 `AuthorizationException` 实例转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 该动作已获得授权...
```

#### 传入额外上下文

用于授权能力的方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）以及授权相关 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）均可以接收一个数组作为第二个参数。这些数组元素会作为参数传给 Gate 闭包，用于在做授权决策时提供更多上下文：

```php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('create-post', function (User $user, Category $category, bool $pinned) {
    if (! $user->canPublishToGroup($category->group)) {
        return false;
    } elseif ($pinned && ! $user->canPinPosts()) {
        return false;
    }

    return true;
});

if (Gate::check('create-post', [$category, $pinned])) {
    // 该用户可以创建该文章...
}
```

### Gate 响应

到目前为止，我们只看到了返回简单布尔值的 Gate。但有时候你可能希望返回一个更详细的响应，包含错误信息。为此，可以从 Gate 中返回一个 `Illuminate\Auth\Access\Response`：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::deny('You must be an administrator.');
});
```

即使你从 Gate 返回了授权响应，`Gate::allows` 方法依旧会返回简单的布尔值；不过可以使用 `Gate::inspect` 方法来获取 Gate 返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 该动作已获得授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时（它在动作未被授权时会抛出 `AuthorizationException`），授权响应里提供的错误消息会被传递到 HTTP 响应中：

```php
Gate::authorize('edit-settings');

// 该动作已获得授权...
```

#### 自定义 HTTP 响应状态码

当某个动作被 Gate 拒绝时，默认会返回 `403` HTTP 响应；然而有时返回其它 HTTP 状态码会更加合适。可以通过 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造方法来自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::denyWithStatus(404);
});
```

由于通过 `404` 响应来隐藏资源是 Web 应用中非常常见的模式，因此提供了便捷方法 `denyAsNotFound`：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::denyAsNotFound();
});
```

### 拦截 Gate 检查

有时你可能希望给某个特定用户授予所有能力。可以使用 `before` 方法定义一个会在所有其它授权检查之前执行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回了一个非 null 的结果，那么该结果就会被视为这次授权检查的结果。

你也可以使用 `after` 方法定义一个在所有其它授权检查之后执行的闭包：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

`after` 闭包返回的值不会覆盖授权检查的结果，除非 Gate 或 Policy 自身返回的是 `null`。

### 内联授权

偶尔你需要判断当前已认证用户是否有权执行某个动作，但又不想为此专门写一个对应的 Gate。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这种"内联"授权检查。内联授权不会执行任何已定义的 ["before" 或 "after" 授权钩子](#intercepting-gate-checks)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果该动作未被授权或当前没有已认证用户，Laravel 会自动抛出一个 `Illuminate\Auth\Access\AuthorizationException` 异常。Laravel 的异常处理器会把 `AuthorizationException` 自动转换为 403 HTTP 响应。

## 创建 Policy

### 生成 Policy

Policy 是用于围绕某个特定模型或资源组织授权逻辑的类。例如，如果你的应用是一个博客，可能会有一个 `App\Models\Post` 模型，以及与之对应的 `App\Policies\PostPolicy`，用于授权用户的创建或更新文章等动作。

可以使用 `make:policy` Artisan 命令来生成 Policy。生成的 Policy 会放在 `app/Policies` 目录下。如果应用中没有该目录，Laravel 会自动创建：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令会生成一个空的 Policy 类。如果想生成包含"查看、创建、更新、删除"等示例 Policy 方法的类，可以在执行命令时加上 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

### 注册 Policy

#### Policy 自动发现

只要模型和 Policy 遵循标准的 Laravel 命名约定，Laravel 默认会自动发现 Policy。具体而言，Policy 必须位于包含模型的目录之上或同级目录下的 `Policies` 目录中。例如，模型放在 `app/Models` 目录中，而 Policy 放在 `app/Policies` 目录中。这种情况下，Laravel 会先在 `app/Models/Policies` 中查找 Policy，再到 `app/Policies` 中查找。另外，Policy 的类名必须与模型类名匹配，并以 `Policy` 结尾。所以，`User` 模型应当对应一个 `UserPolicy` 类。

如果想自定义 Policy 自动发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册一个自定义的回调。通常应当在 `AppServiceProvider` 的 `boot` 方法中调用该方法：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型对应的 Policy 类名...
});
```

#### 手动注册 Policy

可以在应用 `AppServiceProvider` 的 `boot` 方法中，使用 `Gate` Facade 手动注册 Policy 以及它们对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导启动任何应用服务。
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

另外，也可以把 `UsePolicy` 属性放在模型类上，告知 Laravel 该模型对应的 Policy：

```php
<?php

namespace App\Models;

use App\Policies\OrderPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;

#[UsePolicy(OrderPolicy::class)]
class Order extends Model
{
    //
}
```

## 编写 Policy

### Policy 方法

Policy 类注册好之后，就可以为它要授权的每个动作添加方法了。例如，假设我们在 `PostPolicy` 中定义一个 `update` 方法，用来判断给定的 `App\Models\User` 是否可以更新给定的 `App\Models\Post` 实例。

`update` 方法接收 `User` 和 `Post` 实例作为参数，并返回 `true` 或 `false`，表示该用户是否被授权更新给定的 `Post`。在下面的示例中，我们会校验用户的 `id` 是否与文章上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断给定用户是否可以更新指定文章。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据需要在 Policy 上继续定义更多方法。例如，可以定义 `view` 或 `delete` 方法来授权与 `Post` 相关的多种动作，但请记住，Policy 方法的名字可以随意取。

如果你在通过 Artisan 控制台生成 Policy 时使用了 `--model` 选项，那么它已经包含了针对 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 动作的方法。

> [!NOTE]
> 所有 Policy 都是通过 Laravel 的 [服务容器](/docs/{{version}}/container) 解析的，因此你可以在 Policy 的构造函数里类型提示所需的依赖，它们会被自动注入。

### Policy 响应

到目前为止，我们只看到了返回简单布尔值的 Policy 方法。但有时候你可能希望返回一个更详细的响应，包含错误信息。为此，可以让你的 Policy 方法返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断给定用户是否可以更新指定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('You do not own this post.');
}
```

当 Policy 返回了一个授权响应时，`Gate::allows` 方法依旧会返回简单的布尔值；不过可以使用 `Gate::inspect` 方法来获取 Policy 返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 该动作已获得授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时（它在动作未被授权时会抛出 `AuthorizationException`），授权响应中的错误消息会被传递到 HTTP 响应中：

```php
Gate::authorize('update', $post);

// 该动作已获得授权...
```

#### 自定义 HTTP 响应状态码

当某个动作被 Policy 方法拒绝时，默认会返回 `403` HTTP 响应；然而有时返回其它 HTTP 状态码会更合适。可以通过 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造方法来自定义授权检查失败时的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断给定用户是否可以更新指定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

由于通过 `404` 响应来隐藏资源是 Web 应用中非常常见的模式，因此提供了便捷方法 `denyAsNotFound`：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断给定用户是否可以更新指定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

### 不带模型的方法

有些 Policy 方法只接收当前已认证用户的实例。这种情形在对 `create` 这类动作进行授权时最为常见。例如，如果你正在做一个博客应用，你可能希望判断某个用户是否有权创建任何文章。在这种情况下，Policy 方法应当只期望接收一个用户实例：

```php
/**
 * 判断给定用户是否可以创建文章。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

### 访客用户

默认情况下，如果进来的 HTTP 请求并非由已认证用户发起，那么所有 Gate 和 Policy 都会自动返回 `false`。不过，你可以通过将用户参数类型声明为"可选"，或者提供一个 `null` 默认值，让这些授权检查继续传递给 Gate 和 Policy：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断给定用户是否可以更新指定文章。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

### Policy 过滤器

对于某些用户，你可能希望授权他们在某个 Policy 内的所有动作。要实现这一点，可以在该 Policy 中定义一个 `before` 方法。`before` 方法会在 Policy 中的其它方法之前执行，使你有机会在真正调用目标 Policy 方法之前先授权该动作。该特性最常见的用途是允许应用管理员执行任意动作：

```php
use App\Models\User;

/**
 * 执行授权前的预检查。
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果你希望对某一类用户始终拒绝所有授权检查，可以在 `before` 方法中返回 `false`。如果返回 `null`，则授权检查会继续转到 Policy 方法本身。

> [!WARNING]
> 如果 Policy 类中没有与待检查能力同名的方法，则该 Policy 的 `before` 方法不会被调用。

## 通过 Policy 授权动作

### 通过 User 模型

Laravel 应用自带的 `App\Models\User` 模型包含两个用于授权动作的便捷方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你想要授权的动作名以及相关模型。例如，我们来检查某个用户是否可以更新给定的 `App\Models\Post` 模型。通常会在控制器方法中进行：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新指定文章。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // 更新文章...

        return redirect('/posts');
    }
}
```

如果为给定模型 [注册了 Policy](#registering-policies)，那么 `can` 方法会自动调用相应的 Policy 并返回布尔结果。如果没有为该模型注册 Policy，`can` 方法会尝试调用与给定动作名同名的、基于闭包的 Gate。

#### 不需要模型的动作

请记住，有些动作可能对应像 `create` 这种不需要模型实例的 Policy 方法。在这种情况下，你可以把类名传给 `can` 方法。该类名将用于决定授权时应该使用哪个 Policy：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建一篇文章。
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // 创建文章...

        return redirect('/posts');
    }
}
```

### 通过 `Gate` Facade

除了 `App\Models\User` 模型提供的便捷方法外，你也可以随时通过 `Gate` Facade 的 `authorize` 方法进行授权。

与 `can` 方法一样，该方法接收你想要授权的动作名以及相关模型。如果该动作未被授权，`authorize` 方法会抛出一个 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 的异常处理器会自动把它转换为状态码为 403 的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新指定博客文章。
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // 当前用户可以更新该博客文章...

        return redirect('/posts');
    }
}
```

#### 不需要模型的动作

如前所述，有些 Policy 方法（如 `create`）不需要模型实例。在这种情况下，应当把类名传给 `authorize` 方法。该类名将用于决定授权时应该使用哪个 Policy：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * 创建一篇新的博客文章。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function create(Request $request): RedirectResponse
{
    Gate::authorize('create', Post::class);

    // 当前用户可以创建博客文章...

    return redirect('/posts');
}
```

### 通过中间件

Laravel 提供了一种中间件，它可以在请求到达路由或控制器之前就完成授权。默认情况下，可以通过 `can` [中间件别名](/docs/{{version}}/middleware#middleware-aliases) 把 `Illuminate\Auth\Middleware\Authorize` 中间件挂到一条路由上，该别名由 Laravel 自动注册。下面我们通过示例演示如何使用 `can` 中间件授权用户能否更新某篇文章：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新该文章...
})->middleware('can:update,post');
```

在这个示例中，我们给 `can` 中间件传入了两个参数：第一个是你希望授权的动作名，第二个是你希望传给 Policy 方法的路由参数。由于这里使用了 [隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，`App\Models\Post` 模型会被传给 Policy 方法。如果用户未被授权执行该动作，中间件会返回一个状态码为 403 的 HTTP 响应。

为了使用方便，你也可以通过 `can` 方法把 `can` 中间件挂到路由上：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新该文章...
})->can('update', 'post');
```

如果你正在使用 [控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，可以通过 `Authorize` 属性应用 `can` 中间件：

```php
use Illuminate\Routing\Attributes\Controllers\Authorize;

#[Authorize('update', 'post')]
public function update(Post $post)
{
    // 当前用户可以更新该文章...
}
```

#### 不需要模型的动作

同样，对于像 `create` 这种不需要模型实例的 Policy 方法，你可以把类名传给中间件。该类名将用于决定授权时应该使用哪个 Policy：

```php
Route::post('/post', function () {
    // 当前用户可以创建文章...
})->middleware('can:create,App\Models\Post');
```

在字符串形式定义的中间件中写完整的类名会比较繁琐。因此，你也可以通过 `can` 方法把 `can` 中间件挂到路由上：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建文章...
})->can('create', Post::class);
```

### 通过 Blade 模板

在编写 Blade 模板时，你可能希望只在用户被授权执行某个动作时才显示页面中的某一部分。例如，只有当用户可以更新一篇博客文章时才显示其编辑表单。在这种情况下，可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新该文章... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新文章... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户无法更新该文章... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户无法创建新文章... -->
@endcannot
```

这些指令相当于编写 `@if` 和 `@unless` 时的简洁形式。上面的 `@can` 和 `@cannot` 语句等价于：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新该文章... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户无法更新该文章... -->
@endunless
```

你也可以判断用户是否被授权执行给定动作数组中的任意一个。这可以通过 `@canany` 指令实现：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除该文章... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcanany
```

#### 不需要模型的动作

和大多数其它授权方法一样，如果该动作不需要模型实例，你可以把类名传给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户无法创建文章... -->
@endcannot
```

### 传入额外上下文

当使用 Policy 授权时，你可以把一个数组作为第二个参数传给各个授权函数和辅助函数。数组的第一项用于决定应该调用哪个 Policy，剩下的元素会作为参数传给 Policy 方法，用于在做授权决策时提供额外上下文。例如，下面这个 `PostPolicy` 方法定义包含了一个额外的 `$category` 参数：

```php
/**
 * 判断给定用户是否可以更新指定文章。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当我们想判断已认证用户是否能更新给定文章时，可以这样调用该 Policy 方法：

```php
/**
 * 更新指定博客文章。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // 当前用户可以更新该博客文章...

    return redirect('/posts');
}
```

## 授权与 Inertia

虽然授权操作必须在服务端完成，但为前端应用提供授权数据通常会更便于正确渲染 UI。Laravel 并没有为 Inertia 前端暴露授权信息规定强制的约定。

不过，如果你正在使用 Laravel 基于 Inertia 的某个 [入门套件](/docs/{{version}}/starter-kits)，那么你的应用已经包含一个 `HandleInertiaRequests` 中间件。可以在该中间件的 `share` 方法中返回一些共享数据，这些数据会被暴露给应用内的所有 Inertia 页面。这个共享数据就是为用户定义授权信息的便捷位置：

```php
<?php

namespace App\Http\Middleware;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    // ...

    /**
     * 定义默认共享的 props。
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => [
                    'post' => [
                        'create' => $request->user()->can('create', Post::class),
                    ],
                ],
            ],
        ];
    }
}
```
