# 授权

- [简介](#introduction)
- [守卫](#gates)
    - [编写守卫](#writing-gates)
    - [授权操作](#authorizing-actions-via-gates)
    - [守卫响应](#gate-responses)
    - [拦截守卫检查](#intercepting-gate-checks)
    - [内联授权](#inline-authorization)
- [创建策略](#creating-policies)
    - [生成策略](#generating-policies)
    - [注册策略](#registering-policies)
- [编写策略](#writing-policies)
    - [策略方法](#policy-methods)
    - [策略响应](#policy-responses)
    - [不含模型的方法](#methods-without-models)
    - [访客用户](#guest-users)
    - [策略过滤器](#policy-filters)
- [使用策略授权操作](#authorizing-actions-using-policies)
    - [通过用户模型](#via-the-user-model)
    - [通过 Gate Facade](#via-the-gate-facade)
    - [通过中间件](#via-middleware)
    - [通过 Blade 模板](#via-blade-templates)
    - [提供额外上下文](#supplying-additional-context)
- [授权与 Inertia](#authorization-and-inertia)

<a name="introduction"></a>
## 简介

除了提供内置的[认证](/docs/{{version}}/authentication)服务之外，Laravel 还提供了一种简单的方式来针对给定资源授权用户操作。例如，即使用户已经通过认证，他也不一定有权限更新或删除你的应用所管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一条轻松且有条理的方式来管理这类授权检查。

Laravel 提供两种主要的授权操作方式：[守卫](#gates)和[策略](#creating-policies)。你可以把守卫和策略类比为路由与控制器。守卫提供了一种简单的、基于闭包的授权方式，而策略则像控制器一样，围绕特定模型或资源对逻辑进行分组。本文档将先介绍守卫，再探讨策略。

在构建应用时，你不必在只使用守卫和只使用策略之间做非此即彼的选择。大多数应用很可能同时包含守卫和策略，这完全没问题！守卫最适用于与任何模型或资源都无关的操作，例如查看管理员仪表盘。相比之下，如果你希望针对特定模型或资源授权某个操作，就应当使用策略。

<a name="gates"></a>
## 守卫

<a name="writing-gates"></a>
### 编写守卫

> [!WARNING]
> 守卫是学习 Laravel 授权功能基础的好方式；不过，在构建稳健的 Laravel 应用时，你应当考虑使用[策略](#creating-policies)来组织你的授权规则。

守卫其实就是闭包，用来判断用户是否有权执行某个操作。通常，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Gate` Facade 定义守卫。守卫的第一个参数总是接收一个用户实例，还可以选择接收额外的参数，例如相关的 Eloquent 模型。

在这个例子中，我们将定义一个守卫，用于判断用户能否更新给定的 `App\Models\Post` 模型。该守卫会把用户的 `id` 与创建该文章的用户 `user_id` 进行比较来实现这一点：

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

和控制器一样，守卫也可以使用类回调数组来定义：

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

要使用守卫授权某个操作，你应当使用 `Gate` Facade 提供的 `allows` 或 `denies` 方法。请注意，你不必把当前已认证用户传给这些方法。Laravel 会自动把用户传给守卫闭包。通常，你会在应用的控制器中调用守卫授权方法，然后再执行需要授权的操作：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的文章。
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

如果你想判断当前已认证用户之外的其他用户是否有权执行某个操作，可以使用 `Gate` Facade 上的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 该用户可以更新这篇文章...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 该用户不能更新这篇文章...
}
```

你还可以使用 `any` 或 `none` 方法一次性授权多个操作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 该用户可以更新或删除这篇文章...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 该用户不能更新或删除这篇文章...
}
```

<a name="authorizing-or-throwing-exceptions"></a>
#### 授权或抛出异常

如果你想尝试授权某个操作，并在用户无权执行该操作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，可以使用 `Gate` Facade 的 `authorize` 方法。Laravel 会自动把 `AuthorizationException` 实例转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 该操作已获授权...
```

<a name="gates-supplying-additional-context"></a>
#### 提供额外上下文

用于授权能力的守卫方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）以及授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）都可以把一个数组作为第二个参数接收。这些数组元素会作为参数传给守卫闭包，在做出授权决策时可用于提供额外上下文：

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
    // 该用户可以创建这篇文章...
}
```

<a name="gate-responses"></a>
### 守卫响应

到目前为止，我们只考察了返回简单布尔值的守卫。不过，有时你可能希望返回一个更详细的响应，其中包含错误消息。为此，你可以从守卫中返回一个 `Illuminate\Auth\Access\Response`：

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

即使你从守卫返回了授权响应，`Gate::allows` 方法仍然会返回一个简单的布尔值；不过，你可以使用 `Gate::inspect` 方法获取守卫返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 该操作已获授权...
} else {
    echo $response->message();
}
```

使用会在操作未获授权时抛出 `AuthorizationException` 的 `Gate::authorize` 方法时，授权响应提供的错误消息会传递到 HTTP 响应中：

```php
Gate::authorize('edit-settings');

// 该操作已获授权...
```

<a name="customizing-gate-response-status"></a>
#### 自定义 HTTP 响应状态

当某个操作被守卫拒绝时，会返回一个 `403` HTTP 响应；不过，有时返回另一个 HTTP 状态码会更有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数，自定义授权检查失败时返回的 HTTP 状态码：

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

由于用 `404` 响应隐藏资源是 Web 应用中极为常见的做法，因此还提供了 `denyAsNotFound` 方法以便使用：

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
### 拦截守卫检查

有时，你可能希望把全部能力授予某个特定用户。你可以使用 `before` 方法定义一个闭包，该闭包会在所有其他授权检查之前运行：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回的结果不是 `null`，该结果就会被视为授权检查的结果。

你可以使用 `after` 方法定义一个闭包，该闭包会在所有其他授权检查之后执行：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

除非守卫或策略返回了 `null`，否则 `after` 闭包返回的值不会覆盖授权检查的结果。

<a name="inline-authorization"></a>
### 内联授权

偶尔，你可能希望在不专门编写与该操作对应的守卫的情况下，判断当前已认证用户是否有权执行某个操作。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这类"内联"授权检查。内联授权不会执行任何已定义的["before" 或 "after" 授权钩子](#intercepting-gate-checks)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果操作未获授权，或当前没有已认证用户，Laravel 会自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。Laravel 的异常处理器会自动把 `AuthorizationException` 实例转换为 403 HTTP 响应。

<a name="creating-policies"></a>
## 创建策略

<a name="generating-policies"></a>
### 生成策略

策略是围绕特定模型或资源组织授权逻辑的类。例如，如果你的应用是一个博客，你可能有一个 `App\Models\Post` 模型以及与之对应的 `App\Policies\PostPolicy`，用于授权创建或更新文章之类的用户操作。

你可以使用 `make:policy` Artisan 命令生成策略。生成的策略会被放到 `app/Policies` 目录中。如果你的应用中不存在该目录，Laravel 会为你创建：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令会生成一个空的策略类。如果你想生成一个包含示例策略方法的类，涵盖查看、创建、更新和删除该资源的操作，可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="registering-policies"></a>
### 注册策略

<a name="policy-discovery"></a>
#### 策略发现

默认情况下，只要模型和策略遵循标准的 Laravel 命名约定，Laravel 就会自动发现策略。具体来说，策略必须位于 `Policies` 目录中，该目录需与存放模型的目录同级或更上层。例如，模型可以放在 `app/Models` 目录中，而策略可以放在 `app/Policies` 目录中。在这种情况下，Laravel 会先检查 `app/Models/Policies`，然后检查 `app/Policies`。此外，策略名称必须与模型名称匹配并带有 `Policy` 后缀。因此，`User` 模型会对应 `UserPolicy` 策略类。

如果你想定义自己的策略发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册一个自定义的策略发现回调。通常，应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用该方法：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型对应的策略类名称...
});
```

<a name="manually-registering-policies"></a>
#### 手动注册策略

借助 `Gate` Facade，你可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

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

<a name="writing-policies"></a>
## 编写策略

<a name="policy-methods"></a>
### 策略方法

策略类注册完成后，你可以为它授权的每个操作添加方法。例如，让我们在 `PostPolicy` 中定义一个 `update` 方法，用于判断给定的 `App\Models\User` 能否更新给定的 `App\Models\Post` 实例。

`update` 方法会接收一个 `User` 和一个 `Post` 实例作为参数，并应返回 `true` 或 `false`，表示该用户是否有权更新给定的 `Post`。因此，在这个例子中，我们将验证用户的 `id` 是否与文章上的 `user_id` 相匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断该用户是否可以更新给定的文章。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据策略所授权的各种操作，继续在策略上定义额外方法。例如，你可以定义 `view` 或 `delete` 方法来授权与 `Post` 相关的各类操作，但请记住，你可以自由为策略方法取任何你喜欢的名字。

如果你在通过 Artisan 控制台生成策略时使用了 `--model` 选项，生成的策略中已经包含了 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 操作对应的方法。

> [!NOTE]
> 所有策略都通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)解析，这让你可以在策略的构造函数中类型提示所需的任何依赖，它们会被自动注入。

<a name="policy-responses"></a>
### 策略响应

到目前为止，我们只考察了返回简单布尔值的策略方法。不过，有时你可能希望返回一个更详细的响应，其中包含错误消息。为此，你可以从策略方法中返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断该用户是否可以更新给定的文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('You do not own this post.');
}
```

当你从策略返回授权响应时，`Gate::allows` 方法仍然会返回一个简单的布尔值；不过，你可以使用 `Gate::inspect` 方法获取守卫返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 该操作已获授权...
} else {
    echo $response->message();
}
```

使用会在操作未获授权时抛出 `AuthorizationException` 的 `Gate::authorize` 方法时，授权响应提供的错误消息会传递到 HTTP 响应中：

```php
Gate::authorize('update', $post);

// 该操作已获授权...
```

<a name="customizing-policy-response-status"></a>
#### 自定义 HTTP 响应状态

当某个操作被策略方法拒绝时，会返回一个 `403` HTTP 响应；不过，有时返回另一个 HTTP 状态码会更有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数，自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断该用户是否可以更新给定的文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

由于用 `404` 响应隐藏资源是 Web 应用中极为常见的做法，因此还提供了 `denyAsNotFound` 方法以便使用：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 判断该用户是否可以更新给定的文章。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="methods-without-models"></a>
### 不含模型的方法

有些策略方法只接收当前已认证用户的实例。这种情况最常见于授权 `create` 操作时。例如，如果你正在创建一个博客，你可能希望判断某个用户是否有权创建任何文章。在这些情况下，你的策略方法应当只接收一个用户实例：

```php
/**
 * 判断给定的用户是否可以创建文章。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

<a name="guest-users"></a>
### 访客用户

默认情况下，如果传入的 HTTP 请求并非由已认证用户发起，所有守卫和策略都会自动返回 `false`。不过，你可以在定义用户参数时声明"可选"类型提示，或为其提供 `null` 默认值，从而允许这些授权检查穿透到你的守卫和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 判断该用户是否可以更新给定的文章。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

<a name="policy-filters"></a>
### 策略过滤器

对于某些用户，你可能希望授权其执行给定策略内的所有操作。为此，请在策略上定义一个 `before` 方法。`before` 方法会在策略上的任何其他方法之前执行，让你在真正调用目标策略方法之前先完成授权。该功能最常用于授权应用管理员执行任意操作：

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

如果你想拒绝某一类用户的所有授权检查，可以从 `before` 方法返回 `false`。如果返回 `null`，授权检查将继续向下传递到策略方法。

> [!WARNING]
> 如果策略类中不存在与所检查能力名称同名的方法，那么该策略类的 `before` 方法将不会被调用。

<a name="authorizing-actions-using-policies"></a>
## 使用策略授权操作

<a name="via-the-user-model"></a>
### 通过用户模型

Laravel 应用自带的 `App\Models\User` 模型包含两个用于授权操作的便捷方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你希望授权的操作名称以及相关模型。例如，让我们判断某个用户是否有权更新给定的 `App\Models\Post` 模型。这通常会在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定的文章。
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

如果为给定模型[注册了策略](#registering-policies)，`can` 方法会自动调用相应的策略并返回布尔结果。如果没有为该模型注册策略，`can` 方法会尝试调用与给定操作名称匹配的、基于闭包的 Gate。

<a name="user-model-actions-that-dont-require-models"></a>
#### 不需要模型的操作

请记住，有些操作可能对应 `create` 这类不需要模型实例的策略方法。在这些情况下，你可以把类名传给 `can` 方法。该类名将用于确定授权该操作时应使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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

        // 创建这篇文章...

        return redirect('/posts');
    }
}
```

<a name="via-the-gate-facade"></a>
### 通过 `Gate` Facade

除了 `App\Models\User` 模型提供的便捷方法之外，你始终可以通过 `Gate` Facade 的 `authorize` 方法来授权操作。

和 `can` 方法一样，该方法接收你希望授权的操作名称以及相关模型。如果操作未获授权，`authorize` 方法会抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 的异常处理器会自动把它转换为状态码为 403 的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的博客文章。
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // 当前用户可以更新这篇博客文章...

        return redirect('/posts');
    }
}
```

<a name="controller-actions-that-dont-require-models"></a>
#### 不需要模型的操作

如前所述，`create` 这类策略方法不需要模型实例。在这些情况下，你应当把类名传给 `authorize` 方法。该类名将用于确定授权该操作时应使用哪个策略：

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

<a name="via-middleware"></a>
### 通过中间件

Laravel 内置了一个中间件，可以在传入请求到达你的路由或控制器之前就完成操作授权。默认情况下，可以使用 `can` [中间件别名](/docs/{{version}}/middleware#middleware-aliases)把 `Illuminate\Auth\Middleware\Authorize` 中间件附加到路由上，该别名由 Laravel 自动注册。让我们探讨一个使用 `can` 中间件授权用户更新文章的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新这篇文章...
})->middleware('can:update,post');
```

在这个例子中，我们向 `can` 中间件传入了两个参数。第一个是我们希望授权的操作名称，第二个是我们希望传给策略方法的路由参数。在这个场景中，由于我们使用了[隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，因此传给策略方法的会是 `App\Models\Post` 模型。如果用户无权执行给定操作，中间件会返回一个状态码为 403 的 HTTP 响应。

为了方便，你也可以使用 `can` 方法把 `can` 中间件附加到路由上：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新这篇文章...
})->can('update', 'post');
```

<a name="middleware-actions-that-dont-require-models"></a>
#### 不需要模型的操作

同样，`create` 这类策略方法不需要模型实例。在这些情况下，你可以把类名传给中间件。该类名将用于确定授权该操作时应使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建文章...
})->middleware('can:create,App\Models\Post');
```

在字符串形式的中间件定义中写出完整类名会显得很繁琐。因此，你也可以选择使用 `can` 方法把 `can` 中间件附加到路由上：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建文章...
})->can('create', Post::class);
```

<a name="via-blade-templates"></a>
### 通过 Blade 模板

在编写 Blade 模板时，你可能希望只在用户有权执行某个操作时才显示页面的一部分。例如，你可能希望只在用户确实能更新某篇博客文章时才显示更新表单。在这种情况下，你可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新这篇文章... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新文章... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户不能更新这篇文章... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建新文章... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷简写。上面的 `@can` 和 `@cannot` 语句等价于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新这篇文章... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户不能更新这篇文章... -->
@endunless
```

你也可以判断某个用户是否有权执行给定操作数组中的任意一项操作。为此，请使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除这篇文章... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建一篇文章... -->
@endcanany
```

<a name="blade-actions-that-dont-require-models"></a>
#### 不需要模型的操作

和大多数其他授权方法一样，如果某个操作不需要模型实例，你可以把类名传给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建文章... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建文章... -->
@endcannot
```

<a name="supplying-additional-context"></a>
### 提供额外上下文

使用策略授权操作时，你可以把一个数组作为第二个参数传给各个授权函数和辅助方法。数组的第一个元素用于确定应调用哪个策略，数组的其余元素则作为参数传给策略方法，在做出授权决策时可用于提供额外上下文。例如，请看下面这个包含额外 `$category` 参数的 `PostPolicy` 方法定义：

```php
/**
 * 判断该用户是否可以更新给定的文章。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

在尝试判断已认证用户能否更新给定文章时，可以这样调用该策略方法：

```php
/**
 * 更新给定的博客文章。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // 当前用户可以更新这篇博客文章...

    return redirect('/posts');
}
```

<a name="authorization-and-inertia"></a>
## 授权与 Inertia

虽然授权始终必须在服务端处理，但向前端应用提供授权数据以便正确渲染 UI，通常会非常方便。Laravel 并未规定一套将授权信息暴露给 Inertia 前端的必需约定。

不过，如果你正在使用 Laravel 某个基于 Inertia 的[入门套件](/docs/{{version}}/starter-kits)，你的应用中已经包含一个 `HandleInertiaRequests` 中间件。在该中间件的 `share` 方法中，你可以返回共享数据，这些数据将提供给应用中所有的 Inertia 页面。这份共享数据可以作为一个便利的场所，用来定义面向用户的授权信息：

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
