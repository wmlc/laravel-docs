# 授权

- [简介](#introduction)
- [Gate](#gates)
    - [编写 Gate](#writing-gates)
    - [授权动作](#authorizing-actions-via-gates)
    - [Gate 响应](#gate-responses)
    - [拦截 Gate 检查](#intercepting-gate-checks)
    - [内联授权](#inline-authorization)
- [创建策略](#creating-policies)
    - [生成策略](#generating-policies)
    - [注册策略](#registering-policies)
- [编写策略](#writing-policies)
    - [策略方法](#policy-methods)
    - [策略响应](#policy-responses)
    - [无模型的方法](#methods-without-models)
    - [游客用户](#guest-users)
    - [策略过滤器](#policy-filters)
- [使用策略授权动作](#authorizing-actions-using-policies)
    - [通过 User 模型](#via-the-user-model)
    - [通过 Gate Facade](#via-the-gate-facade)
    - [通过中间件](#via-middleware)
    - [通过 Blade 模板](#via-blade-templates)
    - [提供附加上下文](#supplying-additional-context)
- [授权与 Inertia](#authorization-and-inertia)

<a name="introduction"></a>
## 简介

除了提供内置的[认证](/docs/{{version}}/authentication)服务之外，Laravel 还提供了一种简单的方式来针对给定资源授权用户动作。例如，即使用户已通过认证，也可能无权更新或删除应用所管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能为管理此类授权检查提供了一种简单、有条理的方式。

Laravel 提供了两种主要的授权动作方式：[Gate](#gates) 和[策略](#creating-policies)。可以把 Gate 和策略的关系类比为路由和控制器。Gate 提供了一种简单的、基于闭包的授权方式；而策略则与控制器类似，将围绕特定模型或资源的逻辑进行分组。在本文档中，我们将先探讨 Gate，再考察策略。

构建应用时，你不需要在「只用 Gate」和「只用策略」之间做出选择。大多数应用很可能同时包含 Gate 和策略的某种组合，这完全没有问题！Gate 最适合那些与任何模型或资源无关的动作，比如查看管理员控制面板。相反，当你想针对特定模型或资源授权某个动作时，就应当使用策略。

<a name="gates"></a>
## Gate

<a name="writing-gates"></a>
### 编写 Gate

> [!WARNING]
> Gate 是学习 Laravel 授权功能基础的好方式；不过，在构建健壮的 Laravel 应用时，应当考虑使用[策略](#creating-policies)来组织你的授权规则。

Gate 只是一些闭包，用于判断用户是否有权执行给定的动作。通常，Gate 会在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Gate` Facade 来定义。Gate 总是接收一个用户实例作为第一个参数，还可以选择接收额外的参数，比如相关的 Eloquent 模型。

在本例中，我们将定义一个 Gate 来判断用户能否更新给定的 `App\Models\Post` 模型。该 Gate 会将用户的 `id` 与创建该文章的用户的 `user_id` 进行比较来实现这一判断：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

与控制器类似，Gate 也可以使用类回调数组来定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

<a name="authorizing-actions-via-gates"></a>
### 授权动作

要使用 Gate 授权某个动作，你应当使用 `Gate` Facade 提供的 `allows` 或 `denies` 方法。注意，你无需将当前已认证的用户传递给这些方法，Laravel 会自动负责将用户传入 Gate 闭包。通常，这些 Gate 授权方法会在应用的控制器中调用，位于执行需要授权的动作之前：

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
     * 更新给定文章。
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

如果想判断「当前已认证用户以外的其他用户」是否有权执行某个动作，可以使用 `Gate` Facade 的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 该用户可以更新文章...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 该用户不能更新文章...
}
```

你可以使用 `any` 或 `none` 方法一次授权多个动作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 该用户可以更新或删除文章...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 该用户不能更新或删除文章...
}
```

<a name="authorizing-or-throwing-exceptions"></a>
#### 授权或抛出异常

如果你想尝试授权某个动作，并在用户不被允许执行该动作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，可以使用 `Gate` Facade 的 `authorize` 方法。Laravel 会自动将 `AuthorizationException` 实例转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 动作已授权...
```

<a name="gates-supplying-additional-context"></a>
#### 提供附加上下文

用于授权能力的 Gate 方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）以及授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）都可以接收一个数组作为第二个参数。数组中的元素会作为参数传递给 Gate 闭包，可在做出授权决策时提供附加上下文：

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
    // 该用户可以创建文章...
}
```

<a name="gate-responses"></a>
### Gate 响应

到目前为止，我们只考察了返回简单布尔值的 Gate。但有时你可能希望返回一个更详细的响应，包括错误消息。为此，可以在 Gate 中返回一个 `Illuminate\Auth\Access\Response`：

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

即使从 Gate 返回了授权响应，`Gate::allows` 方法仍会返回简单的布尔值；不过，你可以使用 `Gate::inspect` 方法来获取 Gate 返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 动作已授权...
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（该方法在动作未获授权时会抛出 `AuthorizationException`），授权响应所提供的错误消息会被传递到 HTTP 响应中：

```php
Gate::authorize('edit-settings');

// 动作已授权...
```

<a name="customizing-gate-response-status"></a>
#### 自定义 HTTP 响应状态码

当某个动作被 Gate 拒绝时，会返回 `403` HTTP 响应；但有时返回其他 HTTP 状态码可能更有用。你可以使用 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造器，自定义授权检查失败时返回的 HTTP 状态码：

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

由于通过 `404` 响应来隐藏资源是 Web 应用中极为常见的模式，因此出于便利提供了 `denyAsNotFound` 方法：

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

<a name="intercepting-gate-checks"></a>
### 拦截 Gate 检查

有时，你可能希望授予特定用户所有能力。你可以使用 `before` 方法定义一个在所有其他授权检查之前运行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回了非 `null` 的结果，该结果将被视为授权检查的结果。

你可以使用 `after` 方法定义一个在所有其他授权检查之后执行的闭包：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

除非 Gate 或策略返回了 `null`，否则 `after` 闭包返回的值不会覆盖授权检查的结果。

<a name="inline-authorization"></a>
### 内联授权

有时，你可能想判断当前已认证的用户是否有权执行某个给定动作，而又不想编写与该动作对应的专用 Gate。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这类「内联」授权检查。内联授权不会执行已定义的任何[「before」或「after」授权钩子](#intercepting-gate-checks)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果动作未获授权，或者当前没有已认证的用户，Laravel 将自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。Laravel 的异常处理器会自动将 `AuthorizationException` 实例转换为 403 HTTP 响应。

<a name="creating-policies"></a>
## 创建策略

<a name="generating-policies"></a>
### 生成策略

策略（Policy）是围绕特定模型或资源来组织授权逻辑的类。例如，如果你的应用是一个博客，可能会有一个 `App\Models\Post` 模型以及一个对应的 `App\Policies\PostPolicy`，用于授权创建或更新文章之类的用户动作。

你可以使用 `make:policy` Artisan 命令生成策略。生成的策略会被放置在 `app/Policies` 目录中。如果你的应用中不存在该目录，Laravel 会为你创建：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令将生成一个空的策略类。如果你想生成一个包含查看、创建、更新和删除资源相关示例策略方法的类，可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="registering-policies"></a>
### 注册策略

<a name="policy-discovery"></a>
#### 策略发现

默认情况下，只要模型和策略遵循 Laravel 的标准命名约定，Laravel 就会自动发现策略。具体而言，策略必须位于包含模型的目录或其上级目录中的一个 `Policies` 目录内。例如，模型可以放置在 `app/Models` 目录中，而策略放置在 `app/Policies` 目录中。在这种情况下，Laravel 会依次在 `app/Models/Policies` 和 `app/Policies` 中查找策略。此外，策略的名称必须与模型名称一致，并以 `Policy` 作为后缀。因此，`User` 模型应对应 `UserPolicy` 策略类。

如果你想定义自己的策略发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册一个自定义的策略发现回调。通常，该方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型对应的策略类名...
});
```

<a name="manually-registering-policies"></a>
#### 手动注册策略

使用 `Gate` Facade，你可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

另外，你也可以在模型类上放置 `UsePolicy` 属性，告知 Laravel 该模型对应的策略：

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

<a name="writing-policies"></a>
## 编写策略

<a name="policy-methods"></a>
### 策略方法

策略类注册之后，你可以为它所授权的每个动作添加方法。例如，让我们在 `PostPolicy` 上定义一个 `update` 方法，用于判断给定的 `App\Models\User` 能否更新给定的 `App\Models\Post` 实例。

`update` 方法将接收一个 `User` 实例和一个 `Post` 实例作为参数，并应返回 `true` 或 `false`，以表明用户是否有权更新给定的 `Post`。因此，在本例中，我们将验证用户的 `id` 是否与文章的 `user_id` 一致：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断用户能否更新给定文章。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据策略所授权的各种动作，按需继续在策略上定义更多方法。例如，你可以定义 `view` 或 `delete` 方法来授权与 `Post` 相关的各种动作；但请记住，策略方法的命名完全由你决定。

如果你在通过 Artisan 控制台生成策略时使用了 `--model` 选项，生成的策略将已经包含 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 动作对应的方法。

> [!NOTE]
> 所有策略都通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)解析，因此你可以在策略的构造函数中对所需依赖进行类型提示，让它们被自动注入。

<a name="policy-responses"></a>
### 策略响应

到目前为止，我们只考察了返回简单布尔值的策略方法。但有时你可能希望返回一个更详细的响应，包括错误消息。为此，你可以在策略方法中返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断用户能否更新给定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('You do not own this post.');
}
```

当从策略返回授权响应时，`Gate::allows` 方法仍会返回简单的布尔值；不过，你可以使用 `Gate::inspect` 方法来获取 Gate 返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 动作已授权...
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（该方法在动作未获授权时会抛出 `AuthorizationException`），授权响应所提供的错误消息会被传递到 HTTP 响应中：

```php
Gate::authorize('update', $post);

// 动作已授权...
```

<a name="customizing-policy-response-status"></a>
#### 自定义 HTTP 响应状态码

当某个动作被策略方法拒绝时，会返回 `403` HTTP 响应；但有时返回其他 HTTP 状态码可能更有用。你可以使用 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造器，自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断用户能否更新给定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

由于通过 `404` 响应来隐藏资源是 Web 应用中极为常见的模式，因此出于便利提供了 `denyAsNotFound` 方法：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断用户能否更新给定文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="methods-without-models"></a>
### 无模型的方法

有些策略方法只会接收当前已认证用户的实例。这种情况在授权 `create` 动作时最为常见。例如，如果你正在构建博客，可能想判断用户是否有权创建任何文章。在这些情况下，你的策略方法应当只接收一个用户实例：

```php
/**
 * 判断给定用户能否创建文章。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

<a name="guest-users"></a>
### 游客用户

默认情况下，如果传入的 HTTP 请求不是由已认证的用户发起的，所有 Gate 和策略都会自动返回 `false`。不过，你可以将用户参数声明为「可选」类型提示，或为其提供 `null` 默认值，从而让这些授权检查继续传递给你的 Gate 和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断用户能否更新给定文章。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

<a name="policy-filters"></a>
### 策略过滤器

对于某些用户，你可能希望直接授权给定策略内的所有动作。为此，可以在策略上定义一个 `before` 方法。`before` 方法会在策略上的所有其他方法之前执行，让你有机会在真正调用目标策略方法之前完成授权。此功能最常用于授权应用管理员执行任何动作：

```php
use App\Models\User;

/**
 * 执行前置授权检查。
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果你想对某一类用户拒绝所有授权检查，可以在 `before` 方法中返回 `false`。如果返回 `null`，授权检查将继续传递给策略方法。

> [!WARNING]
> 如果策略类中不存在与所检查能力名称相匹配的方法，该策略类的 `before` 方法将不会被调用。

<a name="authorizing-actions-using-policies"></a>
## 使用策略授权动作

<a name="via-the-user-model"></a>
### 通过 User 模型

Laravel 应用自带的 `App\Models\User` 模型包含两个用于授权动作的实用方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你想授权的动作名称以及相关模型。例如，让我们来判断用户是否有权更新给定的 `App\Models\Post` 模型。通常，这会在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定文章。
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

如果给定模型已经[注册了策略](#registering-policies)，`can` 方法将自动调用相应的策略并返回布尔结果。如果该模型没有注册策略，`can` 方法会尝试调用与给定动作名称匹配的、基于闭包的 Gate。

<a name="user-model-actions-that-dont-require-models"></a>
#### 不需要模型的动作

请记住，有些动作可能对应像 `create` 这样不需要模型实例的策略方法。在这些情况下，你可以向 `can` 方法传递类名。该类名将被用来确定授权该动作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建文章。
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

<a name="via-the-gate-facade"></a>
### 通过 `Gate` Facade

除了为 `App\Models\User` 模型提供的实用方法之外，你还可以随时通过 `Gate` Facade 的 `authorize` 方法来授权动作。

与 `can` 方法一样，该方法接收你想授权的动作名称以及相关模型。如果动作未获授权，`authorize` 方法将抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 的异常处理器会自动将其转换为 403 状态码的 HTTP 响应：

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
     * 更新给定博客文章。
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

<a name="controller-actions-that-dont-require-models"></a>
#### 不需要模型的动作

如前所述，有些策略方法（如 `create`）不需要模型实例。在这些情况下，你应当向 `authorize` 方法传递类名。该类名将被用来确定授权该动作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * 创建新的博客文章。
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

<a name="via-middleware"></a>
### 通过中间件

Laravel 包含一个中间件，可以在传入请求到达路由或控制器之前就完成动作授权。默认情况下，`Illuminate\Auth\Middleware\Authorize` 中间件可以通过 `can` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)附加到路由上，该别名由 Laravel 自动注册。让我们看一个使用 `can` 中间件授权用户更新文章的例子：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新该文章...
})->middleware('can:update,post');
```

在本例中，我们给 `can` 中间件传递了两个参数。第一个是我们想要授权的动作名称，第二个是我们想要传递给策略方法的路由参数。在本例中，由于使用了[隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，一个 `App\Models\Post` 模型会被传递给策略方法。如果用户无权执行给定动作，中间件将返回 403 状态码的 HTTP 响应。

为方便起见，你也可以使用 `can` 方法将 `can` 中间件附加到路由上：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新该文章...
})->can('update', 'post');
```

<a name="middleware-actions-that-dont-require-models"></a>
#### 不需要模型的动作

再次强调，有些策略方法（如 `create`）不需要模型实例。在这些情况下，你可以向中间件传递类名。该类名将被用来确定授权该动作时使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建文章...
})->middleware('can:create,App\Models\Post');
```

在字符串形式的中间件定义中写出完整的类名可能相当繁琐。因此，你可以选择使用 `can` 方法将 `can` 中间件附加到路由上：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建文章...
})->can('create', Post::class);
```

<a name="via-blade-templates"></a>
### 通过 Blade 模板

编写 Blade 模板时，你可能希望只在用户有权执行给定动作时才显示页面的某一部分。例如，你可能希望只在用户确实能更新文章时，才显示博客文章的更新表单。在这种情况下，你可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新该文章... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新文章... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户不能更新该文章... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建新文章... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷快捷方式。上面的 `@can` 和 `@cannot` 语句等价于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新该文章... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户不能更新该文章... -->
@endunless
```

你还可以判断用户是否有权执行给定动作数组中的任意一个动作。为此，可以使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除该文章... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcanany
```

<a name="blade-actions-that-dont-require-models"></a>
#### 不需要模型的动作

与其他大多数授权方法一样，如果动作不需要模型实例，你可以向 `@can` 和 `@cannot` 指令传递类名：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建文章... -->
@endcannot
```

<a name="supplying-additional-context"></a>
### 提供附加上下文

使用策略授权动作时，你可以向各种授权函数和辅助方法传递一个数组作为第二个参数。数组中的第一个元素将被用来确定应调用哪个策略，而数组中的其余元素会作为参数传递给策略方法，可在做出授权决策时提供附加上下文。例如，考虑下面这个包含额外 `$category` 参数的 `PostPolicy` 方法定义：

```php
/**
 * 判断用户能否更新给定文章。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

在尝试判断已认证用户能否更新给定文章时，我们可以像这样调用该策略方法：

```php
/**
 * 更新给定博客文章。
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

<a name="authorization-and-inertia"></a>
## 授权与 Inertia

虽然授权必须始终在服务器端处理，但向前端应用提供授权数据通常有助于正确渲染应用的 UI。Laravel 并没有规定向 Inertia 驱动的前端暴露授权信息的固定约定。

不过，如果你使用的是 Laravel 基于 Inertia 的某个[入门套件](/docs/{{version}}/starter-kits)，你的应用已经包含一个 `HandleInertiaRequests` 中间件。在该中间件的 `share` 方法中，你可以返回要提供给应用中所有 Inertia 页面的共享数据。这些共享数据可以作为定义用户授权信息的便捷位置：

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
