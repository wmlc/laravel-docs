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
    - [不需要模型的方法](#methods-without-models)
    - [访客用户](#guest-users)
    - [策略过滤器](#policy-filters)
- [使用策略授权动作](#authorizing-actions-using-policies)
    - [通过 User 模型](#via-the-user-model)
    - [通过控制器助手](#via-controller-helpers)
    - [通过中间件](#via-middleware)
    - [通过 Blade 模板](#via-blade-templates)
    - [提供额外上下文](#supplying-additional-context)

<a name="introduction"></a>
## 简介

除了提供内置的[认证](/docs/{{version}}/authentication)服务外，Laravel 还提供了一种简单的方式来授权用户对给定资源执行操作。例如，即使用户已通过认证，他们也可能无权更新或删除应用管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一种简单、有组织的方式来管理这些类型的授权检查。

Laravel 提供了两种主要的授权动作方式：[Gate](#gates) 和[策略](#creating-policies)。可以将 Gate 和策略想象为路由和控制器。Gate 提供了简单的、基于闭包的授权方式，而策略则像控制器一样，将逻辑围绕特定模型或资源进行分组。在本文档中，我们将先探讨 Gate，然后研究策略。

构建应用时，你不需要在专门使用 Gate 或专门使用策略之间做出选择。大多数应用很可能包含 Gate 和策略的混合，这完全没问题！Gate 最适用于与任何模型或资源无关的动作，例如查看管理员仪表盘。相比之下，当你希望为特定模型或资源授权某个动作时，应该使用策略。

<a name="gates"></a>
## Gate

<a name="writing-gates"></a>
### 编写 Gate

> **Warning**
> Gate 是学习 Laravel 授权功能基础的好方法；但在构建健壮的 Laravel 应用时，你应该考虑使用[策略](#creating-policies)来组织授权规则。

Gate 只是确定用户是否有权执行给定操作的闭包。通常，Gate 使用 `Gate` Facade 在 `App\Providers\AuthServiceProvider` 类的 `boot` 方法定义。Gate 总是接收用户实例作为第一个参数，并可选择接收额外参数，如相关的 Eloquent 模型。

在此示例中，我们将定义一个 Gate 来确定用户是否可以更新给定的 `App\Models\Post` 模型。Gate 通过将用户的 `id` 与创建帖子的用户的 `user_id` 进行比较来实现：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 注册任何认证 / 授权服务。
 *
 * @return void
 */
public function boot()
{
    $this->registerPolicies();

    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

与控制器类似，Gate 也可以使用类回调数组定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 注册任何认证 / 授权服务。
 *
 * @return void
 */
public function boot()
{
    $this->registerPolicies();

    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

<a name="authorizing-actions-via-gates"></a>
### 授权动作

要使用 Gate 授权动作，你应该使用 `Gate` Facade 提供的 `allows` 或 `denies` 方法。注意，你不需要将当前已认证用户传递给这些方法。Laravel 会自动将用户传递给 Gate 闭包。通常在应用控制器中执行需要授权的动作之前调用 Gate 授权方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定帖子。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Post  $post
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Post $post)
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // 更新帖子...
    }
}
```

如果你想确定当前已认证用户以外的用户是否有权执行某个动作，可以使用 `Gate` Facade 的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 该用户可以更新帖子...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 该用户不能更新帖子...
}
```

你可以使用 `any` 或 `none` 方法一次授权多个动作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 该用户可以更新或删除帖子...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 该用户不能更新或删除帖子...
}
```

<a name="authorizing-or-throwing-exceptions"></a>
#### 授权或抛出异常

如果你想尝试授权动作并在用户不允许执行该操作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，可以使用 `Gate` Facade 的 `authorize` 方法。`AuthorizationException` 实例会被 Laravel 的异常处理器自动转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 动作已授权...
```

<a name="gates-supplying-additional-context"></a>
#### 提供额外上下文

授权能力的 Gate 方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）和授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）可以接收数组作为第二个参数。这些数组元素作为参数传递给 Gate 闭包，可在做出授权决策时用于提供额外上下文：

```php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('create-post', function (User $user, Category $category, $pinned) {
    if (! $user->canPublishToGroup($category->group)) {
        return false;
    } elseif ($pinned && ! $user->canPinPosts()) {
        return false;
    }

    return true;
});

if (Gate::check('create-post', [$category, $pinned])) {
    // 该用户可以创建帖子...
}
```

<a name="gate-responses"></a>
### Gate 响应

到目前为止，我们只研究了返回简单布尔值的 Gate。但有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从 Gate 返回 `Illuminate\Auth\Access\Response`：

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

即使从 Gate 返回授权响应，`Gate::allows` 方法仍将返回简单的布尔值；但你可以使用 `Gate::inspect` 方法获取 Gate 返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 动作已授权...
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（如果动作未授权会抛出 `AuthorizationException`），授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('edit-settings');

// 动作已授权...
```

<a name="customising-gate-response-status"></a>
#### 自定义 HTTP 响应状态码

当动作被 Gate 拒绝时，返回 `403` HTTP 响应；但有时返回替代的 HTTP 状态码会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造器来自定义授权检查失败时返回的 HTTP 状态码：

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

由于通过 `404` 响应隐藏资源是 Web 应用的常见模式，为方便起见提供了 `denyAsNotFound` 方法：

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

有时，你可能希望为特定用户授予所有能力。你可以使用 `before` 方法定义一个在所有其他授权检查之前运行的闭包：

```php
use Illuminate\Support\Facades\Gate;

Gate::before(function ($user, $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回非 null 结果，该结果将被视为授权检查的结果。

你可以使用 `after` 方法定义一个在所有其他授权检查之后执行的闭包：

```php
Gate::after(function ($user, $ability, $result, $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

与 `before` 方法类似，如果 `after` 闭包返回非 null 结果，该结果将被视为授权检查的结果。

<a name="inline-authorization"></a>
### 内联授权

有时，你可能希望确定当前已认证用户是否有权执行给定操作，而无需编写与该操作对应的专用 Gate。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这些"内联"授权检查：

```php
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn ($user) => $user->isAdministrator());

Gate::denyIf(fn ($user) => $user->banned());
```

如果动作未授权或当前没有已认证用户，Laravel 将自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。`AuthorizationException` 实例会被 Laravel 的异常处理器自动转换为 403 HTTP 响应。

<a name="creating-policies"></a>
## 创建策略

<a name="generating-policies"></a>
### 生成策略

策略是围绕特定模型或资源组织授权逻辑的类。例如，如果你的应用是博客，你可能有一个 `App\Models\Post` 模型和对应的 `App\Policies\PostPolicy` 来授权创建或更新帖子等用户操作。

你可以使用 `make:policy` Artisan 命令生成策略。生成的策略将放在 `app/Policies` 目录中。如果此目录在你的应用中不存在，Laravel 会为你创建它：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令将生成一个空的策略类。如果你想生成一个包含与查看、创建、更新和删除资源相关的示例策略方法的类，可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="registering-policies"></a>
### 注册策略

创建策略类后，需要注册它。注册策略是我们告知 Laravel 在对给定模型类型授权动作时使用哪个策略的方式。

全新 Laravel 应用中包含的 `App\Providers\AuthServiceProvider` 有一个 `policies` 属性，将 Eloquent 模型映射到对应的策略。注册策略将指示 Laravel 在对给定 Eloquent 模型授权动作时使用哪个策略：

```php
<?php

namespace App\Providers;

use App\Models\Post;
use App\Policies\PostPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * 应用的策略映射。
     *
     * @var array
     */
    protected $policies = [
        Post::class => PostPolicy::class,
    ];

    /**
     * 注册任何应用认证 / 授权服务。
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        //
    }
}
```

<a name="policy-auto-discovery"></a>
#### 策略自动发现

Laravel 可以自动发现策略，只要模型和策略遵循标准的 Laravel 命名约定，就无需手动注册模型策略。具体来说，策略必须位于包含模型的目录之上或同级的 `Policies` 目录中。例如，模型可以放在 `app/Models` 目录中，而策略可以放在 `app/Policies` 目录中。在这种情况下，Laravel 会先检查 `app/Models/Policies` 再检查 `app/Policies` 中的策略。此外，策略名称必须与模型名称匹配并具有 `Policy` 后缀。因此，`User` 模型将对应 `UserPolicy` 策略类。

如果你想定义自己的策略发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册自定义策略发现回调。通常，此方法应从应用 `AuthServiceProvider` 的 `boot` 方法调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function ($modelClass) {
    // 返回给定模型的策略类名...
});
```

> **Warning**
> 在 `AuthServiceProvider` 中显式映射的任何策略都将优先于任何可能自动发现的策略。

<a name="writing-policies"></a>
## 编写策略

<a name="policy-methods"></a>
### 策略方法

注册策略类后，你可以为它授权的每个动作添加方法。例如，让我们在 `PostPolicy` 上定义一个 `update` 方法，确定给定的 `App\Models\User` 是否可以更新给定的 `App\Models\Post` 实例。

`update` 方法将接收 `User` 和 `Post` 实例作为参数，并应返回 `true` 或 `false` 以指示用户是否有权更新给定的 `Post`。因此，在此示例中，我们将验证用户的 `id` 与帖子上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定帖子是否可被用户更新。
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Post  $post
     * @return bool
     */
    public function update(User $user, Post $post)
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据需要继续在策略上为它授权的各种动作定义额外方法。例如，你可以定义 `view` 或 `delete` 方法来授权各种与 `Post` 相关的动作，但请记住你可以自由地为策略方法命名。

如果你通过 Artisan 控制台生成策略时使用了 `--model` 选项，它将已经包含 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 动作的方法。

> **Note**
> 所有策略都通过 Laravel [服务容器](/docs/{{version}}/container)解析，允许你在策略的构造函数中类型提示任何需要的依赖，让它们自动注入。

<a name="policy-responses"></a>
### 策略响应

到目前为止，我们只研究了返回简单布尔值的策略方法。但有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从策略方法返回 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定帖子是否可被用户更新。
 *
 * @param  \App\Models\User  $user
 * @param  \App\Models\Post  $post
 * @return \Illuminate\Auth\Access\Response
 */
public function update(User $user, Post $post)
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::deny('You do not own this post.');
}
```

从策略返回授权响应时，`Gate::allows` 方法仍将返回简单的布尔值；但你可以使用 `Gate::inspect` 方法获取 Gate 返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 动作已授权...
} else {
    echo $response->message();
}
```

使用 `Gate::authorize` 方法时（如果动作未授权会抛出 `AuthorizationException`），授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('update', $post);

// 动作已授权...
```

<a name="customising-policy-response-status"></a>
#### 自定义 HTTP 响应状态码

当动作被策略方法拒绝时，返回 `403` HTTP 响应；但有时返回替代的 HTTP 状态码会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类的 `denyWithStatus` 静态构造器来自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定帖子是否可被用户更新。
 *
 * @param  \App\Models\User  $user
 * @param  \App\Models\Post  $post
 * @return \Illuminate\Auth\Access\Response
 */
public function update(User $user, Post $post)
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::denyWithStatus(404);
}
```

由于通过 `404` 响应隐藏资源是 Web 应用的常见模式，为方便起见提供了 `denyAsNotFound` 方法：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定给定帖子是否可被用户更新。
 *
 * @param  \App\Models\User  $user
 * @param  \App\Models\Post  $post
 * @return \Illuminate\Auth\Access\Response
 */
public function update(User $user, Post $post)
{
    return $user->id === $post->user_id
                ? Response::allow()
                : Response::denyAsNotFound();
}
```

<a name="methods-without-models"></a>
### 不需要模型的方法

某些策略方法只接收当前已认证用户的实例。这种情况在授权 `create` 动作时最常见。例如，如果你正在创建博客，你可能希望确定用户是否有权创建任何帖子。在这些情况下，你的策略方法应该只期望接收用户实例：

```php
/**
 * 确定给定用户是否可以创建帖子。
 *
 * @param  \App\Models\User  $user
 * @return bool
 */
public function create(User $user)
{
    return $user->role == 'writer';
}
```

<a name="guest-users"></a>
### 访客用户

默认情况下，如果传入的 HTTP 请求不是由已认证用户发起的，所有 Gate 和策略都会自动返回 `false`。但你可以通过声明"可选"类型提示或为用户参数定义提供 `null` 默认值，来允许这些授权检查传递到你的 Gate 和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定给定帖子是否可被用户更新。
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Post  $post
     * @return bool
     */
    public function update(?User $user, Post $post)
    {
        return optional($user)->id === $post->user_id;
    }
}
```

<a name="policy-filters"></a>
### 策略过滤器

对于某些用户，你可能希望授权给定策略内的所有动作。为此，在策略上定义一个 `before` 方法。`before` 方法将在策略上任何其他方法之前执行，让你有机会在预期的策略方法实际调用之前授权该动作。此功能最常用于授权应用管理员执行任何操作：

```php
use App\Models\User;

/**
 * 执行预授权检查。
 *
 * @param  \App\Models\User  $user
 * @param  string  $ability
 * @return void|bool
 */
public function before(User $user, $ability)
{
    if ($user->isAdministrator()) {
        return true;
    }
}
```

如果你想拒绝特定类型用户的所有授权检查，可以从 `before` 方法返回 `false`。如果返回 `null`，授权检查将传递到策略方法。

> **Warning**
> 如果策略类不包含与正在检查的能力名称匹配的方法，则不会调用该策略类的 `before` 方法。

<a name="authorizing-actions-using-policies"></a>
## 使用策略授权动作

<a name="via-the-user-model"></a>
### 通过 User 模型

Laravel 应用包含的 `App\Models\User` 模型提供了两个有用的授权动作方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你希望授权的动作名称和相关模型。例如，让我们确定用户是否有权更新给定的 `App\Models\Post` 模型。通常，这将在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定帖子。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Post  $post
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Post $post)
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // 更新帖子...
    }
}
```

如果给定模型[已注册策略](#registering-policies)，`can` 方法将自动调用适当的策略并返回布尔结果。如果模型未注册策略，`can` 方法将尝试调用与给定动作名称匹配的基于闭包的 Gate。

<a name="user-model-actions-that-dont-require-models"></a>
#### 不需要模型的动作

请记住，某些动作可能对应不需要模型实例的策略方法，如 `create`。在这些情况下，你可以向 `can` 方法传递类名。类名将用于确定授权动作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建帖子。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // 创建帖子...
    }
}
```

<a name="via-controller-helpers"></a>
### 通过控制器助手

除了为 `App\Models\User` 模型提供有用的方法外，Laravel 还为任何继承 `App\Http\Controllers\Controller` 基类的控制器提供了有用的 `authorize` 方法。

与 `can` 方法类似，此方法接受你希望授权的动作名称和相关模型。如果动作未授权，`authorize` 方法将抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 异常处理器会自动将其转换为 403 状态码的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定博客帖子。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Post  $post
     * @return \Illuminate\Http\Response
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post)
    {
        $this->authorize('update', $post);

        // 当前用户可以更新博客帖子...
    }
}
```

<a name="controller-actions-that-dont-require-models"></a>
#### 不需要模型的动作

如前所述，某些策略方法（如 `create`）不需要模型实例。在这些情况下，你应该向 `authorize` 方法传递类名。类名将用于确定授权动作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\Request;

/**
 * 创建新的博客帖子。
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\Response
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function create(Request $request)
{
    $this->authorize('create', Post::class);

    // 当前用户可以创建博客帖子...
}
```

<a name="authorizing-resource-controllers"></a>
#### 授权资源控制器

如果你使用[资源控制器](/docs/{{version}}/controllers#resource-controllers)，可以在控制器的构造函数中使用 `authorizeResource` 方法。此方法将把适当的 `can` 中间件定义附加到资源控制器的方法上。

`authorizeResource` 方法接受模型类名作为第一个参数，包含模型 ID 的路由 / 请求参数名作为第二个参数。你应该确保使用 `--model` 标志创建[资源控制器](/docs/{{version}}/controllers#resource-controllers)，使其具有所需的方法签名和类型提示：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建控制器实例。
     *
     * @return void
     */
    public function __construct()
    {
        $this->authorizeResource(Post::class, 'post');
    }
}
```

以下控制器方法将映射到对应的策略方法。当请求路由到给定控制器方法时，对应的策略方法将在控制器方法执行之前自动调用：

| 控制器方法 | 策略方法 |
| --- | --- |
| index | viewAny |
| show | view |
| create | create |
| store | create |
| edit | update |
| update | update |
| destroy | delete |

> **Note**
> 你可以使用 `make:policy` 命令配合 `--model` 选项快速为给定模型生成策略类：`php artisan make:policy PostPolicy --model=Post`。

<a name="via-middleware"></a>
### 通过中间件

Laravel 包含一个可以在传入请求到达路由或控制器之前授权动作的中间件。默认情况下，`Illuminate\Auth\Middleware\Authorize` 中间件在你的 `App\Http\Kernel` 类中被分配了 `can` 键。让我们探索使用 `can` 中间件授权用户可以更新帖子的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子...
})->middleware('can:update,post');
```

在此示例中，我们向 `can` 中间件传递了两个参数。第一个是我们希望授权的动作名称，第二个是我们希望传递给策略方法的路由参数。在这种情况下，由于我们使用[隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，`App\Models\Post` 模型将传递给策略方法。如果用户无权执行给定动作，中间件将返回 403 状态码的 HTTP 响应。

为方便起见，你也可以使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子...
})->can('update', 'post');
```

<a name="middleware-actions-that-dont-require-models"></a>
#### 不需要模型的动作

同样，某些策略方法（如 `create`）不需要模型实例。在这些情况下，你可以向中间件传递类名。类名将用于确定授权动作时使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建帖子...
})->middleware('can:create,App\Models\Post');
```

在字符串中间件定义中指定整个类名可能变得繁琐。因此，你可以选择使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建帖子...
})->can('create', Post::class);
```

<a name="via-blade-templates"></a>
### 通过 Blade 模板

编写 Blade 模板时，你可能希望仅在用户有权执行给定操作时才显示页面的某部分。例如，你可能希望仅在用户确实可以更新帖子时才显示博客帖子的更新表单。在这种情况下，你可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新帖子... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新帖子... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户不能更新帖子... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建新帖子... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷快捷方式。上面的 `@can` 和 `@cannot` 语句等同于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新帖子... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户不能更新帖子... -->
@endunless
```

你还可以确定用户是否有权执行给定动作数组中的任何动作。为此，使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除帖子... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建帖子... -->
@endcanany
```

<a name="blade-actions-that-dont-require-models"></a>
#### 不需要模型的动作

与大多数其他授权方法类似，如果动作不需要模型实例，你可以向 `@can` 和 `@cannot` 指令传递类名：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建帖子... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建帖子... -->
@endcannot
```

<a name="supplying-additional-context"></a>
### 提供额外上下文

使用策略授权动作时，你可以将数组作为第二个参数传递给各种授权函数和助手。数组中的第一个元素将用于确定应调用哪个策略，而数组的其余元素作为参数传递给策略方法，可在做出授权决策时用于提供额外上下文。例如，考虑以下包含额外 `$category` 参数的 `PostPolicy` 方法定义：

```php
/**
 * 确定给定帖子是否可被用户更新。
 *
 * @param  \App\Models\User  $user
 * @param  \App\Models\Post  $post
 * @param  int  $category
 * @return bool
 */
public function update(User $user, Post $post, int $category)
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当尝试确定已认证用户是否可以更新给定帖子时，我们可以像这样调用此策略方法：

```php
/**
 * 更新给定博客帖子。
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  \App\Models\Post  $post
 * @return \Illuminate\Http\Response
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post)
{
    $this->authorize('update', [$post, $request->category]);

    // 当前用户可以更新博客帖子...
}
```