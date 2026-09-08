# 授权

- [简介](#introduction)
- [Gates](#gates)
    - [编写 Gates](#writing-gates)
    - [授权操作](#authorizing-actions-via-gates)
    - [Gate 响应](#gate-responses)
    - [拦截 Gate 检查](#intercepting-gate-checks)
    - [内联授权](#inline-authorization)
- [创建策略](#creating-policies)
    - [生成策略](#generating-policies)
    - [注册策略](#registering-policies)
- [编写策略](#writing-policies)
    - [策略方法](#policy-methods)
    - [策略响应](#policy-responses)
    - [不使用模型的方法](#methods-without-models)
    - [访客用户](#guest-users)
    - [策略过滤器](#policy-filters)
- [使用策略授权操作](#authorizing-actions-using-policies)
    - [通过 User 模型](#via-the-user-model)
    - [通过 Gate Facade](#via-the-gate-facade)
    - [通过中间件](#via-middleware)
    - [通过 Blade 模板](#via-blade-templates)
    - [提供附加上下文](#supplying-additional-context)
- [授权与 Inertia](#authorization-and-inertia)

<a name="introduction"></a>
## 简介

除了提供内置的 [authentication](/docs/{{version}}/authentication)（认证）服务外，Laravel 还提供了一种简单的方式来针对给定资源授权用户操作。例如，即使用户已通过认证，他们也可能未被授权更新或删除你的应用程序管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一种简单、有组织的方式来管理这类授权检查。

Laravel 提供了两种主要的授权操作方式：[Gates](#gates) 和[策略](#creating-policies)（policies）。可以把 Gates 和策略类比于路由和控制器。Gates 提供了一种简单的、基于闭包的授权方法，而策略（就像控制器一样）将逻辑围绕特定的模型或资源进行分组。在本文档中，我们将先探讨 Gates，然后再研究策略。

在构建应用程序时，你不需要在仅使用 Gates 或仅使用策略之间做出选择。大多数应用程序很可能包含 Gates 和策略的某种混合，这完全没有问题！Gates 最适用于与任何模型或资源无关的操作，例如查看管理员仪表盘。相反，当你希望针对特定模型或资源授权操作时，应使用策略。

<a name="gates"></a>
## Gates

<a name="writing-gates"></a>
### 编写 Gates

> [!WARNING]
> Gates 是学习 Laravel 授权功能基础的好方法；但是，在构建健壮的 Laravel 应用程序时，你应该考虑使用[策略](#creating-policies)来组织你的授权规则。

Gates 只是一些闭包，用于确定用户是否有权执行给定操作。通常，Gates 使用 `Gate` Facade 定义在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中。Gates 始终将用户实例作为第一个参数，并可以选择接收额外的参数，例如相关的 Eloquent 模型。

在此示例中，我们将定义一个 gate 来确定用户是否可以更新给定的 `App\Models\Post` 模型。该 gate 通过将用户的 `id` 与创建帖子的用户的 `user_id` 进行比较来实现：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

与控制器一样，Gates 也可以使用类回调数组来定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

<a name="authorizing-actions-via-gates"></a>
### 授权操作

要使用 Gates 授权操作，应使用 `Gate` Facade 提供的 `allows` 或 `denies` 方法。注意，你不需要将当前已认证的用户传递给这些方法。Laravel 会自动负责将用户传入 gate 闭包。通常会在执行需要授权的操作之前，在应用程序的控制器中调用 gate 授权方法：

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
     * 更新给定的帖子。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // 更新帖子……

        return redirect('/posts');
    }
}
```

如果你想确定除当前已认证用户之外的其他用户是否有权执行操作，可以使用 `Gate` Facade 上的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 用户可以更新帖子……
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 用户无法更新帖子……
}
```

你可以使用 `any` 或 `none` 方法一次授权多个操作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 用户可以更新或删除帖子……
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 用户无法更新或删除帖子……
}
```

<a name="authorizing-or-throwing-exceptions"></a>
#### 授权或抛出异常

如果你希望尝试授权一个操作，并在用户不被允许执行该给定操作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，可以使用 `Gate` Facade 的 `authorize` 方法。`AuthorizationException` 的实例会被 Laravel 自动转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 操作已获授权……
```

<a name="gates-supplying-additional-context"></a>
#### 提供附加上下文

用于授权能力的 gate 方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）以及授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）可以将数组作为第二个参数接收。这些数组元素作为参数传递给 gate 闭包，并可在做出授权决策时用作附加上下文：

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
    // 用户可以创建帖子……
}
```

<a name="gate-responses"></a>
### Gate 响应

到目前为止，我们只研究了返回简单布尔值的 Gates。然而，有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从 gate 返回一个 `Illuminate\Auth\Access\Response`：

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

即使你从 gate 返回授权响应，`Gate::allows` 方法仍会返回简单的布尔值；但是，你可以使用 `Gate::inspect` 方法获取 gate 返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 操作已获授权……
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（如果操作未获授权则会抛出 `AuthorizationException`），授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('edit-settings');

// 操作已获授权……
```

<a name="customizing-gate-response-status"></a>
#### 自定义 HTTP 响应状态码

当操作被 Gate 拒绝时，会返回 `403` HTTP 响应；但是，有时返回替代的 HTTP 状态码会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数自定义失败授权检查返回的 HTTP 状态码：

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

由于通过 `404` 响应隐藏资源是 Web 应用程序的一种常见模式，因此提供了 `denyAsNotFound` 方法以方便使用：

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

有时，你可能希望向特定用户授予所有能力。你可以使用 `before` 方法定义一个在所有其他授权检查之前运行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回非 null 结果，则该结果将被视为授权检查的结果。

你可以使用 `after` 方法定义一个在所有其他授权检查之后执行的闭包：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

`after` 闭包返回的值不会覆盖授权检查的结果，除非 gate 或策略返回了 `null`。

<a name="inline-authorization"></a>
### 内联授权

有时，你可能希望确定当前已认证的用户是否有权执行给定操作，而无需编写与该操作对应的专用 gate。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这类"内联"授权检查。内联授权不会执行任何已定义的["before"或"after"授权钩子](#intercepting-gate-checks)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果操作未获授权或当前没有用户通过认证，Laravel 会自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。`AuthorizationException` 的实例会被 Laravel 的异常处理器自动转换为 403 HTTP 响应。

<a name="creating-policies"></a>
## 创建策略

策略（Policy）是围绕特定模型或资源组织授权逻辑的类。例如，如果你的应用程序是一个博客，你可能有一个 `App\Models\Post` 模型和一个相应的 `App\Policies\PostPolicy` 来授权用户操作，例如创建或更新帖子。

<a name="generating-policies"></a>
### 生成策略

你可以使用 `make:policy` Artisan 命令生成策略。生成的策略将放置在 `app/Policies` 目录中。如果此目录在你的应用程序中不存在，Laravel 会为你创建它：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令会生成一个空的策略类。如果你想生成一个包含与查看、创建、更新和删除资源相关的示例策略方法的类，可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="registering-policies"></a>
### 注册策略

<a name="policy-discovery"></a>
#### 策略发现

默认情况下，只要模型和策略遵循标准的 Laravel 命名约定，Laravel 就会自动发现策略。具体来说，策略必须位于包含你的模型的目录中或其上层目录中的 `Policies` 目录。因此，例如，模型可以放在 `app/Models` 目录中，而策略可以放在 `app/Policies` 目录中。在这种情况下，Laravel 会先在 `app/Models/Policies` 中查找策略，然后在 `app/Policies` 中查找。此外，策略名称必须与模型名称匹配，并具有 `Policy` 后缀。因此，`User` 模型将对应于 `UserPolicy` 策略类。

如果你想定义自己的策略发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册自定义的策略发现回调。通常，此方法应从应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型的策略类名称……
});
```

<a name="manually-registering-policies"></a>
#### 手动注册策略

使用 `Gate` Facade，你可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

或者，你可以在模型类上放置 `UsePolicy` 属性，以告知 Laravel 该模型对应的策略：

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

注册策略类后，你可以为其授权的每个操作添加方法。例如，我们在 `PostPolicy` 上定义一个 `update` 方法，用于确定给定的 `App\Models\User` 是否可以更新给定的 `App\Models\Post` 实例。

`update` 方法将接收 `User` 和 `Post` 实例作为参数，并应返回 `true` 或 `false`，指示用户是否有权更新给定的 `Post`。因此，在此示例中，我们将验证用户的 `id` 与帖子上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定的帖子是否可以被该用户更新。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据需要为策略授权的各种操作继续定义其他方法。例如，你可以定义 `view` 或 `delete` 方法来授权各种与 `Post` 相关的操作，但记住你可以自由地为策略方法起任何你喜欢的名称。

如果你在通过 Artisan 控制台生成策略时使用了 `--model` 选项，它将已经包含用于 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 操作的方法。

> [!NOTE]
> 所有策略都通过 Laravel [服务容器](/docs/{{version}}/container)（Service Container）解析，允许你在策略的构造函数中对任何需要的依赖进行类型提示，以便它们被自动注入。

<a name="policy-responses"></a>
### 策略响应

到目前为止，我们只研究了返回简单布尔值的策略方法。然而，有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从策略方法返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否可以被该用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('You do not own this post.');
}
```

当从策略返回授权响应时，`Gate::allows` 方法仍会返回简单的布尔值；但是，你可以使用 `Gate::inspect` 方法获取 gate 返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 操作已获授权……
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（如果操作未获授权则会抛出 `AuthorizationException`），授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('update', $post);

// 操作已获授权……
```

<a name="customizing-policy-response-status"></a>
#### 自定义 HTTP 响应状态码

当操作被策略方法拒绝时，会返回 `403` HTTP 响应；但是，有时返回替代的 HTTP 状态码会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数自定义失败授权检查返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否可以被该用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

由于通过 `404` 响应隐藏资源是 Web 应用程序的一种常见模式，因此提供了 `denyAsNotFound` 方法以方便使用：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定的帖子是否可以被该用户更新。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="methods-without-models"></a>
### 不使用模型的方法

某些策略方法仅接收当前已认证用户的实例。这种情况在授权 `create` 操作时最常见。例如，如果你正在创建一个博客，你可能希望确定用户是否有权创建任何帖子。在这种情况下，你的策略方法应只期望接收一个用户实例：

```php
/**
 * 确定给定的用户是否可以创建帖子。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

<a name="guest-users"></a>
### 访客用户

默认情况下，如果传入的 HTTP 请求不是由已认证的用户发起的，所有 Gates 和策略都会自动返回 `false`。但是，你可以通过声明"可选"类型提示或为用户参数定义提供 `null` 默认值，来允许这些授权检查传递到你的 Gates 和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定的帖子是否可以被该用户更新。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

<a name="policy-filters"></a>
### 策略过滤器

对于某些用户，你可能希望授权给定策略中的所有操作。为此，在策略上定义一个 `before` 方法。`before` 方法将在策略上的任何其他方法之前执行，让你有机会在预期的策略方法实际被调用之前授权该操作。此功能最常用于授权应用程序管理员执行任何操作：

```php
use App\Models\User;

/**
 * 执行授权前检查。
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果你想拒绝特定类型用户的所有授权检查，可以从 `before` 方法返回 `false`。如果返回 `null`，授权检查将落到策略方法。

> [!WARNING]
> 如果策略类不包含名称与正在检查的能力名称匹配的方法，则不会调用该策略类的 `before` 方法。

<a name="authorizing-actions-using-policies"></a>
## 使用策略授权操作

<a name="via-the-user-model"></a>
### 通过 User 模型

Laravel 应用程序自带的 `App\Models\User` 模型包含两个用于授权操作的有用方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你希望授权的操作名称以及相关的模型。例如，我们来确定用户是否有权更新给定的 `App\Models\Post` 模型。通常，这会在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定的帖子。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // 更新帖子……

        return redirect('/posts');
    }
}
```

如果为给定模型[注册了策略](#registering-policies)（已注册策略），`can` 方法将自动调用适当的策略并返回布尔结果。如果未为该模型注册策略，`can` 方法将尝试调用与给定操作名称匹配的基于闭包的 Gate。

<a name="user-model-actions-that-dont-require-models"></a>
#### 不需要模型的操作

记住，某些操作可能对应于像 `create` 这样不需要模型实例的策略方法。在这种情况下，你可以将类名传递给 `can` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建帖子。
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // 创建帖子……

        return redirect('/posts');
    }
}
```

<a name="via-the-gate-facade"></a>
### 通过 Gate Facade

除了提供给 `App\Models\User` 模型的有用方法外，你始终可以通过 `Gate` Facade 的 `authorize` 方法授权操作。

与 `can` 方法一样，此方法接受你希望授权的操作名称以及相关的模型。如果操作未获授权，`authorize` 方法将抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 异常处理器会自动将其转换为状态码为 403 的 HTTP 响应：

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
     * 更新给定的博客帖子。
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // 当前用户可以更新博客帖子……

        return redirect('/posts');
    }
}
```

<a name="controller-actions-that-dont-require-models"></a>
#### 不需要模型的操作

如前所述，某些策略方法（如 `create`）不需要模型实例。在这种情况下，你应该将类名传递给 `authorize` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * 创建新的博客帖子。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function create(Request $request): RedirectResponse
{
    Gate::authorize('create', Post::class);

    // 当前用户可以创建博客帖子……

    return redirect('/posts');
}
```

<a name="via-middleware"></a>
### 通过中间件

Laravel 包含一个中间件，可以在传入请求到达你的路由或控制器之前授权操作。默认情况下，可以使用 `can` [中间件别名](/docs/{{version}}/middleware#middleware-aliases) 将 `Illuminate\Auth\Middleware\Authorize` 中间件附加到路由，该别名由 Laravel 自动注册。我们来看一个使用 `can` 中间件授权用户可以更新帖子的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子……
})->middleware('can:update,post');
```

在此示例中，我们向 `can` 中间件传递了两个参数。第一个是我们希望授权的操作名称，第二个是我们希望传递给策略方法的路由参数。在这种情况下，由于我们使用的是[隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，一个 `App\Models\Post` 模型将被传递给策略方法。如果用户无权执行给定操作，中间件将返回状态码为 403 的 HTTP 响应。

为方便起见，你也可以使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子……
})->can('update', 'post');
```

如果你使用的是[控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，可以通过 `Authorize` 属性应用 `can` 中间件：

```php
use Illuminate\Routing\Attributes\Controllers\Authorize;

#[Authorize('update', 'post')]
public function update(Post $post)
{
    // 当前用户可以更新帖子……
}
```

<a name="middleware-actions-that-dont-require-models"></a>
#### 不需要模型的操作

同样，某些策略方法（如 `create`）不需要模型实例。在这种情况下，你可以将类名传递给中间件。类名将用于确定在授权操作时使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建帖子……
})->middleware('can:create,App\Models\Post');
```

在字符串中间件定义中指定完整类名可能会变得繁琐。因此，你可以选择使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建帖子……
})->can('create', Post::class);
```

<a name="via-blade-templates"></a>
### 通过 Blade 模板

编写 Blade 模板时，你可能希望仅在用户有权执行给定操作时才显示页面的一部分。例如，你可能希望仅在用户确实可以更新帖子时才显示博客帖子的更新表单。在这种情况下，你可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新帖子…… -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新帖子…… -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户无法更新帖子…… -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户无法创建新帖子…… -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷快捷方式。上面的 `@can` 和 `@cannot` 语句等同于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新帖子…… -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户无法更新帖子…… -->
@endunless
```

你还可以确定用户是否有权从给定的操作数组中执行任何操作。为此，请使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除帖子…… -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建帖子…… -->
@endcanany
```

<a name="blade-actions-that-dont-require-models"></a>
#### 不需要模型的操作

与大多数其他授权方法一样，如果操作不需要模型实例，你可以将类名传递给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建帖子…… -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户无法创建帖子…… -->
@endcannot
```

<a name="supplying-additional-context"></a>
### 提供附加上下文

使用策略授权操作时，你可以将数组作为第二个参数传递给各种授权函数和辅助方法。数组中的第一个元素将用于确定应调用哪个策略，而数组的其余元素将作为参数传递给策略方法，并可在做出授权决策时用作附加上下文。例如，考虑以下包含额外 `$category` 参数的 `PostPolicy` 方法定义：

```php
/**
 * 确定给定的帖子是否可以被该用户更新。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当试图确定已认证的用户是否可以更新给定的帖子时，我们可以像这样调用此策略方法：

```php
/**
 * 更新给定的博客帖子。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // 当前用户可以更新博客帖子……

    return redirect('/posts');
}
```

<a name="authorization-and-inertia"></a>
## 授权与 Inertia

尽管授权必须始终在服务器端处理，但为前端应用程序提供授权数据以便正确渲染应用程序的 UI 通常会很方便。Laravel 没有定义向 Inertia 驱动的前端暴露授权信息的必需约定。

但是，如果你使用的是 Laravel 基于 Inertia 的[入门套件](/docs/{{version}}/starter-kits) 之一，你的应用程序已经包含一个 `HandleInertiaRequests` 中间件。在此中间件的 `share` 方法中，你可以返回将提供给应用程序中所有 Inertia 页面的共享数据。这些共享数据可以作为为用户定义授权信息的便捷位置：

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
