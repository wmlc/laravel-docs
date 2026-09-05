# 控制器

## 简介

除了将所有请求处理逻辑定义为路由文件中的闭包之外，你也可以选择使用"控制器"类来组织这些行为。控制器可以将相关的请求处理逻辑归组到单个类中。例如，`UserController` 类可以处理所有与用户相关的传入请求，包括展示、创建、更新和删除用户。默认情况下，控制器存放在 `app/Http/Controllers` 目录中。

## 编写控制器

### 基础控制器

要快速生成一个新的控制器，可以运行 `make:controller` Artisan 命令。默认情况下，应用的所有控制器都存放在 `app/Http/Controllers` 目录中：

```shell
php artisan make:controller UserController
```

我们来看一个基础控制器的示例。控制器可以有任意数量的公共方法，用于响应传入的 HTTP 请求：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 展示给定用户的个人资料。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

写好控制器类和方法之后，就可以像下面这样定义一个指向该控制器方法的路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求匹配指定的路由 URI 时，就会调用 `App\Http\Controllers\UserController` 类上的 `show` 方法，并将路由参数传递给该方法。

> [!NOTE]
> 控制器并不**必须**继承某个基类。不过，有时继承一个包含所有控制器共享方法的基类控制器会很方便。

### 单一动作控制器

如果某个控制器动作特别复杂，你可能会希望将整个控制器类都专用于这一个动作。为此，可以在控制器中定义一个单独的 `__invoke` 方法：

```php
<?php

namespace App\Http\Controllers;

class ProvisionServer extends Controller
{
    /**
     * 配置一个新的 Web 服务器。
     */
    public function __invoke()
    {
        // ...
    }
}
```

为单动作控制器注册路由时，无需指定控制器方法，只需将控制器名称传递给路由即可：

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你可以使用 `make:controller` Artisan 命令的 `--invokable` 选项来生成一个可调用（invokable）控制器：

```shell
php artisan make:controller ProvisionServer --invokable
```

> [!NOTE]
> 控制器桩文件可以使用[桩文件发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

## 控制器中间件

[中间件](/docs/{{version}}/middleware)可以在你的路由文件中分配给控制器的路由：

```php
Route::get('/profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你也可以在控制器类内部指定中间件，这样会更方便。为此，你的控制器应当实现 `HasMiddleware` 接口，该接口规定控制器应当有一个静态的 `middleware` 方法。在该方法中，你可以返回一个应当应用于控制器动作的中间件数组：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController implements HasMiddleware
{
    /**
     * 获取应当分配给该控制器的中间件。
     */
    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('log', only: ['index']),
            new Middleware('subscribed', except: ['store']),
        ];
    }

    // ...
}
```

你也可以将控制器中间件定义为闭包，这提供了一种无需编写整个中间件类即可定义内联中间件的便捷方式：

```php
use Closure;
use Illuminate\Http\Request;

/**
 * 获取应当分配给该控制器的中间件。
 */
public static function middleware(): array
{
    return [
        function (Request $request, Closure $next) {
            return $next($request);
        },
    ];
}
```

### 中间件属性

你也可以使用 PHP 属性来将中间件分配给控制器：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
#[Middleware('log', only: ['index'])]
#[Middleware('subscribed', except: ['store'])]
class UserController
{
    // ...
}
```

你也可以将中间件属性放在单独的控制器方法上。分配给方法的的中间件会与类级别分配的中间件合并：

```php
<?php

namespace App\Http\Controllers;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
class UserController
{
    #[Middleware('log')]
    #[Middleware('subscribed')]
    public function index()
    {
        // ...
    }

    #[Middleware(static function (Request $request, Closure $next) {
        // ...

        return $next($request);
    })]
    public function store()
    {
        // ...
    }
}
```

要从控制器或单独的控制器方法中排除中间件，可以使用 `WithoutMiddleware` 属性。你可以使用 `only` 和 `except` 参数将类级别的属性限制为特定的控制器方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureTokenIsValid;
use Illuminate\Routing\Attributes\Controllers\WithoutMiddleware;

#[WithoutMiddleware('subscribed', except: ['index'])]
class UserController
{
    #[WithoutMiddleware(EnsureTokenIsValid::class)]
    public function index()
    {
        // ...
    }

    public function show()
    {
        // ...
    }
}
```

类级别的 `WithoutMiddleware` 属性会被子控制器继承。该属性只能移除路由中间件，不适用于[全局中间件](/docs/{{version}}/middleware#global-middleware)。

### 授权属性

如果你通过策略（policy）来授权控制器动作，可以使用 `Authorize` 属性作为 `can` 中间件的便捷简写：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class CommentController
{
    #[Authorize('create', [Comment::class, 'post'])]
    public function store(Post $post)
    {
        // ...
    }

    #[Authorize('delete', 'comment')]
    public function destroy(Comment $comment)
    {
        // ...
    }
}
```

第一个参数是你希望授权的能力（ability）。第二个参数是应当传递给策略的模型类、路由参数或参数。

## 资源控制器

如果你将应用中的每个 Eloquent 模型都视为一个"资源"，那么对每个资源执行相同的一组动作是很常见的做法。例如，假设你的应用包含一个 `Photo` 模型和一个 `Movie` 模型。用户很可能会创建、读取、更新或删除这些资源。

由于这种常见用例，Laravel 的资源路由只需一行代码，就能将典型的创建、读取、更新和删除（"CRUD"）路由分配给一个控制器。首先，我们可以使用 `make:controller` Artisan 命令的 `--resource` 选项快速创建一个处理这些动作的控制器：

```shell
php artisan make:controller PhotoController --resource
```

该命令会在 `app/Http/Controllers/PhotoController.php` 处生成一个控制器。该控制器会为每个可用的资源操作包含一个方法。接下来，你可以注册一个指向该控制器的资源路由：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这一个路由声明会创建多个路由来处理对该资源的各种动作。生成的控制器已经为每个动作预置了方法桩。请记住，你随时可以通过运行 `route:list` Artisan 命令快速查看应用的路由概览。

你甚至可以通过向 `resources` 方法传入一个数组，一次性注册多个资源控制器：

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

`softDeletableResources` 方法会注册多个全部使用 `withTrashed` 方法的资源控制器：

```php
Route::softDeletableResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

#### 资源控制器处理的动作

| Verb      | URI                    | Action  | Route Name     |
| --------- | ---------------------- | ------- | -------------- |
| GET       | `/photos`              | index   | photos.index   |
| GET       | `/photos/create`       | create  | photos.create  |
| POST      | `/photos`              | store   | photos.store   |
| GET       | `/photos/{photo}`      | show    | photos.show    |
| GET       | `/photos/{photo}/edit` | edit    | photos.edit    |
| PUT/PATCH | `/photos/{photo}`      | update  | photos.update  |
| DELETE    | `/photos/{photo}`      | destroy | photos.destroy |

#### 自定义模型缺失时的行为

通常，如果隐式绑定的资源模型未找到，会生成 404 HTTP 响应。不过，你可以在定义资源路由时调用 `missing` 方法来自定义这种行为。`missing` 方法接受一个闭包，当该资源的任意路由无法找到隐式绑定的模型时会被调用：

```php
use App\Http\Controllers\PhotoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::resource('photos', PhotoController::class)
    ->missing(function (Request $request) {
        return Redirect::route('photos.index');
    });
```

#### 软删除模型

通常，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型，而是返回 404 HTTP 响应。不过，你可以在定义资源路由时调用 `withTrashed` 方法，指示框架允许软删除的模型：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

不带参数调用 `withTrashed` 会允许 `show`、`edit` 和 `update` 资源路由使用软删除的模型。你可以通过向 `withTrashed` 方法传入一个数组来指定这些路由的子集：

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

#### 指定资源模型

如果你正在使用[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，并且希望资源控制器的方法对模型实例进行类型提示，可以在生成控制器时使用 `--model` 选项：

```shell
php artisan make:controller PhotoController --model=Photo --resource
```

#### 生成表单请求

在生成资源控制器时，你可以提供 `--requests` 选项，以指示 Artisan 为控制器的存储和更新方法生成[表单请求类](/docs/{{version}}/validation#form-request-validation)：

```shell
php artisan make:controller PhotoController --model=Photo --resource --requests
```

### 部分资源路由

声明资源路由时，你可以指定控制器应当处理的一组动作子集，而不是完整的默认动作集合：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->only([
    'index', 'show'
]);

Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
```

#### API 资源路由

在声明将被 API 消费的的资源路由时，你通常希望排除呈现 HTML 模板的路由，例如 `create` 和 `edit`。为方便起见，你可以使用 `apiResource` 方法自动排除这两个路由：

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传入一个数组，一次性注册多个 API 资源控制器：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成一个不包含 `create` 或 `edit` 方法的 API 资源控制器，可以在执行 `make:controller` 命令时使用 `--api` 开关：

```shell
php artisan make:controller PhotoController --api
```

### 嵌套资源

有时你可能需要为嵌套资源定义路由。例如，一个 photo 资源可能拥有多个可以附加到该 photo 的评论。要嵌套资源控制器，可以在路由声明中使用"点"表示法：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

该路由会注册一个可以使用如下 URI 访问的嵌套资源：

```text
/photos/{photo}/comments/{comment}
```

#### 限定嵌套资源范围

Laravel 的[隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)特性可以自动限定嵌套绑定的范围，从而确认解析出的子模型确实属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动范围限定，并指示 Laravel 应当根据哪个字段来检索子资源。有关如何实现这一点，请参阅[限定资源路由范围](#restful-scoping-resource-routes)的文档。

#### 浅层嵌套

通常，URI 中并不一定需要同时包含父 ID 和子 ID，因为子 ID 本身就是一个唯一标识符。当使用自动递增主键这类唯一标识符在 URI 片段中标识模型时，你可以选择使用"浅嵌套"：

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

这个路由定义会定义以下路由：

| Verb      | URI                               | Action  | Route Name             |
| --------- | --------------------------------- | ------- | ---------------------- |
| GET       | `/photos/{photo}/comments`        | index   | photos.comments.index  |
| GET       | `/photos/{photo}/comments/create` | create  | photos.comments.create |
| POST      | `/photos/{photo}/comments`        | store   | photos.comments.store  |
| GET       | `/comments/{comment}`             | show    | comments.show          |
| GET       | `/comments/{comment}/edit`        | edit    | comments.edit          |
| PUT/PATCH | `/comments/{comment}`             | update  | comments.update        |
| DELETE    | `/comments/{comment}`             | destroy | comments.destroy       |

### 命名资源路由

默认情况下，所有资源控制器动作都拥有一个路由名称；不过，你可以通过传入一个 `names` 数组（包含你期望的路由名称）来覆盖这些名称：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

### 命名资源路由参数

默认情况下，`Route::resource` 会根据资源名的"单数化"版本来创建资源路由的参数。你可以使用 `parameters` 方法针对每个资源分别覆盖。传入 `parameters` 方法的数组应当是一个由资源名和参数名组成的关联数组：

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

上面的示例为资源的 `show` 路由生成了以下 URI：

```text
/users/{admin_user}
```

### 限定资源路由范围

Laravel 的[限定范围的隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)特性可以自动限定嵌套绑定的范围，从而确认解析出的子模型确实属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动范围限定，并指示 Laravel 应当根据哪个字段来检索子资源：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

该路由会注册一个限定范围的嵌套资源，可以使用如下 URI 访问：

```text
/photos/{photo}/comments/{comment:slug}
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动限定查询范围，通过父模型使用约定来推断父模型上的关联名，从而按父模型检索嵌套模型。在本例中，会假定 `Photo` 模型拥有一个名为 `comments`（路由参数名的复数形式）的关联，可用于检索 `Comment` 模型。

### 本地化资源 URI

默认情况下，`Route::resource` 会使用英文动词和复数规则来创建资源 URI。如果你需要本地化 `create` 和 `edit` 动作动词，可以使用 `Route::resourceVerbs` 方法。这可以在应用的 `App\Providers\AppServiceProvider` 的 `boot` 方法开头完成：

```php
/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Route::resourceVerbs([
        'create' => 'crear',
        'edit' => 'editar',
    ]);
}
```

Laravel 的复数化器支持[多种不同的语言，你可以根据需要自行配置](/docs/{{version}}/localization#pluralization-language)。一旦自定义了动词和复数化语言，像 `Route::resource('publicacion', PublicacionController::class)` 这样的资源路由注册就会生成以下 URI：

```text
/publicacion/crear

/publicacion/{publicaciones}/editar
```

### 补充资源控制器

如果你需要为资源控制器添加超出默认资源路由集合的额外路由，应当在调用 `Route::resource` 方法之前定义这些路由；否则，`resource` 方法定义的路由可能会无意中优先于你的补充路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> [!NOTE]
> 请记得保持控制器的专注。如果你发现自己经常需要典型资源动作集合之外的方法，可以考虑将控制器拆分为两个更小的控制器。

### 单例资源控制器

有时，你的应用会拥有只能存在单个实例的资源。例如，用户的"个人资料"可以被编辑或更新，但一个用户不能拥有多个"个人资料"。同样地，一张图片可能只有一个"缩略图"。这些资源被称为"单例资源"，意味着该资源有且仅有一个实例。在这些场景下，你可以注册一个"单例"资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义会注册以下路由。如你所见，单例资源不会注册"创建"路由，并且由于该资源只能存在一个实例，注册的路由也不接受标识符：

| Verb      | URI             | Action | Route Name     |
| --------- | --------------- | ------ | -------------- |
| GET       | `/profile`      | show   | profile.show   |
| GET       | `/profile/edit` | edit   | profile.edit   |
| PUT/PATCH | `/profile`      | update | profile.update |

单例资源也可以嵌套在标准的资源中：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在这个例子中，`photos` 资源会收到所有[标准资源路由](#actions-handled-by-resource-controllers)；而 `thumbnail` 资源则会是一个单例资源，拥有以下路由：

| Verb      | URI                              | Action | Route Name              |
| --------- | -------------------------------- | ------ | ----------------------- |
| GET       | `/photos/{photo}/thumbnail`      | show   | photos.thumbnail.show   |
| GET       | `/photos/{photo}/thumbnail/edit` | edit   | photos.thumbnail.edit   |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update | photos.thumbnail.update |

#### 可创建的单例资源

有时，你可能希望为单例资源定义创建和存储路由。为此，可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在这个例子中，会注册以下路由。如你所见，可创建的单例资源还会注册一个 `DELETE` 路由：

| Verb      | URI                                | Action  | Route Name               |
| --------- | ---------------------------------- | ------- | ------------------------ |
| GET       | `/photos/{photo}/thumbnail/create` | create  | photos.thumbnail.create  |
| POST      | `/photos/{photo}/thumbnail`        | store   | photos.thumbnail.store   |
| GET       | `/photos/{photo}/thumbnail`        | show    | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit`   | edit    | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`        | update  | photos.thumbnail.update  |
| DELETE    | `/photos/{photo}/thumbnail`        | destroy | photos.thumbnail.destroy |

如果你希望 Laravel 为单例资源注册 `DELETE` 路由，但不注册创建或存储路由，可以使用 `destroyable` 方法：

```php
Route::singleton(...)->destroyable();
```

#### API 单例资源

`apiSingleton` 方法可用于注册一个将通过 API 操作的单例资源，因此 `create` 和 `edit` 路由就变得不必要了：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable` 的，这会为该资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```

### 中间件与资源控制器

Laravel 允许你使用 `middleware`、`middlewareFor` 和 `withoutMiddlewareFor` 方法，将中间件分配给资源路由的全部方法或仅特定方法。这些方法提供了对哪些中间件应用于每个资源动作的细粒度控制。

#### 为所有方法应用中间件

你可以使用 `middleware` 方法将中间件分配给资源或单例资源路由生成的所有路由：

```php
Route::resource('users', UserController::class)
    ->middleware(['auth', 'verified']);

Route::singleton('profile', ProfileController::class)
    ->middleware('auth');
```

#### 为特定方法应用中间件

你可以使用 `middlewareFor` 方法将中间件分配给给定资源控制器的一个或多个特定方法：

```php
Route::resource('users', UserController::class)
    ->middlewareFor('show', 'auth');

Route::apiResource('users', UserController::class)
    ->middlewareFor(['show', 'update'], 'auth');

Route::resource('users', UserController::class)
    ->middlewareFor('show', 'auth')
    ->middlewareFor('update', 'auth');

Route::apiResource('users', UserController::class)
    ->middlewareFor(['show', 'update'], ['auth', 'verified']);
```

`middlewareFor` 方法也可以与单例和 API 单例资源控制器结合使用：

```php
Route::singleton('profile', ProfileController::class)
    ->middlewareFor('show', 'auth');

Route::apiSingleton('profile', ProfileController::class)
    ->middlewareFor(['show', 'update'], 'auth');
```

#### 从特定方法排除中间件

你可以使用 `withoutMiddlewareFor` 方法从资源控制器的特定方法中排除中间件：

```php
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::resource('users', UserController::class)
        ->withoutMiddlewareFor('index', ['auth', 'verified'])
        ->withoutMiddlewareFor(['create', 'store'], 'verified')
        ->withoutMiddlewareFor('destroy', 'subscribed');
});
```

## 依赖注入与控制器

### 构造函数注入

Laravel [服务容器](/docs/{{version}}/container)负责解析所有 Laravel 控制器。因此，你可以在控制器的构造函数中类型提示控制器可能需要的任何依赖。声明的依赖会被自动解析并注入到控制器实例中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;

class UserController extends Controller
{
    /**
     * 创建一个新的控制器实例。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}
}
```

### 方法注入

除了构造函数注入之外，你还可以在控制器方法上类型提示依赖。方法注入的一个常见用例是将 `Illuminate\Http\Request` 实例注入到控制器方法中：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储一个新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->name;

        // 存储用户...

        return redirect('/users');
    }
}
```

如果你的控制器方法还期望接收来自路由参数输入，请在你的其他依赖之后列出路由参数。例如，如果你的路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以通过如下定义控制器方法来类型提示 `Illuminate\Http\Request` 并访问你的 `id` 参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新给定的用户。
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 更新用户...

        return redirect('/users');
    }
}
```
