# 控制器

- [简介](#introduction)
- [编写控制器](#writing-controllers)
    - [基础控制器](#basic-controllers)
    - [单动作控制器](#single-action-controllers)
- [控制器中间件](#controller-middleware)
- [资源控制器](#resource-controllers)
    - [部分资源路由](#restful-partial-resource-routes)
    - [嵌套资源](#restful-nested-resources)
    - [命名资源路由](#restful-naming-resource-routes)
    - [命名资源路由参数](#restful-naming-resource-route-parameters)
    - [限定资源路由作用域](#restful-scoping-resource-routes)
    - [本地化资源 URI](#restful-localizing-resource-uris)
    - [补充资源控制器](#restful-supplementing-resource-controllers)
    - [单例资源控制器](#singleton-resource-controllers)
    - [中间件与资源控制器](#middleware-and-resource-controllers)
- [依赖注入与控制器](#dependency-injection-and-controllers)

<a name="introduction"></a>
## 简介

与其把所有请求处理逻辑都定义为路由文件中的闭包，你或许更希望使用"控制器"类来组织这些行为。控制器可以将相关的请求处理逻辑分组到单个类中。例如，`UserController` 类可以处理所有与用户相关的传入请求，包括展示、创建、更新和删除用户。默认情况下，控制器存放在 `app/Http/Controllers` 目录中。

<a name="writing-controllers"></a>
## 编写控制器

<a name="basic-controllers"></a>
### 基础控制器

要快速生成一个新控制器，可以运行 `make:controller` Artisan 命令。默认情况下，应用的所有控制器都存放在 `app/Http/Controllers` 目录中：

```shell
php artisan make:controller UserController
```

下面来看一个基础控制器的例子。控制器可以拥有任意数量的公共方法，这些方法将响应传入的 HTTP 请求：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

编写好控制器类和方法后，你就可以像这样定义一条指向该控制器方法的路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求匹配到指定的路由 URI 时，`App\Http\Controllers\UserController` 类上的 `show` 方法就会被调用，路由参数也会传递给该方法。

> [!NOTE]
> 控制器并不**要求**继承某个基础类。不过，继承一个包含所有控制器共享方法的基础控制器类，有时会很方便。

<a name="single-action-controllers"></a>
### 单动作控制器

如果某个控制器动作特别复杂，你可能会发现为这一个动作专门编写整个控制器类会很方便。为此，你可以在控制器中定义一个单独的 `__invoke` 方法：

```php
<?php

namespace App\Http\Controllers;

class ProvisionServer extends Controller
{
    /**
     * 配置一台新的 Web 服务器。
     */
    public function __invoke()
    {
        // ...
    }
}
```

为单动作控制器注册路由时，不需要指定控制器方法。只需将控制器的名称传递给路由器即可：

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你可以使用 `make:controller` Artisan 命令的 `--invokable` 选项来生成可调用控制器：

```shell
php artisan make:controller ProvisionServer --invokable
```

> [!NOTE]
> 控制器模板（stub）可以通过[模板发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="controller-middleware"></a>
## 控制器中间件

[中间件](/docs/{{version}}/middleware)可以在路由文件中分配给控制器的路由：

```php
Route::get('/profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你也可以在控制器类中指定中间件，这样可能更方便。为此，你的控制器应实现 `HasMiddleware` 接口，该接口要求控制器具有一个静态 `middleware` 方法。在这个方法中，你可以返回一个应应用到控制器各动作的中间件数组：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController implements HasMiddleware
{
    /**
     * 获取应分配给控制器的中间件。
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

你也可以将控制器中间件定义为闭包，这样无需编写完整的中间件类，就能方便地定义内联中间件：

```php
use Closure;
use Illuminate\Http\Request;

/**
 * 获取应分配给控制器的中间件。
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

<a name="resource-controllers"></a>
## 资源控制器

如果你把应用中的每个 Eloquent 模型都看作一种"资源"，那么通常需要对每种资源执行相同的操作集。例如，假设你的应用包含 `Photo` 模型和 `Movie` 模型，用户很可能需要创建、读取、更新或删除这些资源。

针对这一常见场景，Laravel 资源路由只需一行代码，就能将典型的创建、读取、更新和删除（"CRUD"）路由分配给一个控制器。首先，我们可以使用 `make:controller` Artisan 命令的 `--resource` 选项，快速创建一个处理这些动作的控制器：

```shell
php artisan make:controller PhotoController --resource
```

这条命令会在 `app/Http/Controllers/PhotoController.php` 生成一个控制器。该控制器将为每个可用的资源操作包含一个对应的方法。接下来，你可以注册一条指向该控制器的资源路由：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这一条路由声明会创建多条路由，用于处理针对资源的各种动作。生成的控制器已经为每个动作预置了对应的方法。记住，你随时可以通过运行 `route:list` Artisan 命令快速浏览应用的路由。

你甚至可以向 `resources` 方法传递一个数组，一次注册多个资源控制器：

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

`softDeletableResources` 方法可以注册多个都使用 `withTrashed` 方法的资源控制器：

```php
Route::softDeletableResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

<a name="actions-handled-by-resource-controllers"></a>
#### 资源控制器处理的动作

| 动词      | URI                    | 动作    | 路由名称        |
| --------- | ---------------------- | ------- | -------------- |
| GET       | `/photos`              | index   | photos.index   |
| GET       | `/photos/create`       | create  | photos.create  |
| POST      | `/photos`              | store   | photos.store   |
| GET       | `/photos/{photo}`      | show    | photos.show    |
| GET       | `/photos/{photo}/edit` | edit    | photos.edit    |
| PUT/PATCH | `/photos/{photo}`      | update  | photos.update  |
| DELETE    | `/photos/{photo}`      | destroy | photos.destroy |

<a name="customizing-missing-model-behavior"></a>
#### 自定义模型缺失时的行为

通常情况下，如果隐式绑定的资源模型未找到，将生成 404 HTTP 响应。不过，你可以在定义资源路由时调用 `missing` 方法来自定义这一行为。`missing` 方法接受一个闭包，当任何资源路由找不到隐式绑定的模型时，就会调用该闭包：

```php
use App\Http\Controllers\PhotoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::resource('photos', PhotoController::class)
    ->missing(function (Request $request) {
        return Redirect::route('photos.index');
    });
```

<a name="soft-deleted-models"></a>
#### 软删除的模型

通常情况下，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型，而是返回 404 HTTP 响应。不过，你可以在定义资源路由时调用 `withTrashed` 方法，指示框架允许软删除的模型：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

不带参数调用 `withTrashed` 将允许 `show`、`edit` 和 `update` 资源路由使用软删除的模型。你可以通过向 `withTrashed` 方法传递一个数组来指定这些路由的子集：

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

<a name="specifying-the-resource-model"></a>
#### 指定资源模型

如果你正在使用[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，并希望资源控制器的方法对模型实例进行类型提示，可以在生成控制器时使用 `--model` 选项：

```shell
php artisan make:controller PhotoController --model=Photo --resource
```

<a name="generating-form-requests"></a>
#### 生成表单请求

生成资源控制器时，你可以提供 `--requests` 选项，指示 Artisan 为控制器的存储和更新方法生成[表单请求类](/docs/{{version}}/validation#form-request-validation)：

```shell
php artisan make:controller PhotoController --model=Photo --resource --requests
```

<a name="restful-partial-resource-routes"></a>
### 部分资源路由

声明资源路由时，你可以指定控制器只处理一部分动作，而不是全部默认动作：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->only([
    'index', 'show'
]);

Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
```

<a name="api-resource-routes"></a>
#### API 资源路由

在声明供 API 使用的资源路由时，你通常需要排除那些渲染 HTML 模板的路由，比如 `create` 和 `edit`。为方便起见，你可以使用 `apiResource` 方法自动排除这两个路由：

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传递一个数组，一次注册多个 API 资源控制器：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成一个不包含 `create` 和 `edit` 方法的 API 资源控制器，可以在执行 `make:controller` 命令时使用 `--api` 开关：

```shell
php artisan make:controller PhotoController --api
```

<a name="restful-nested-resources"></a>
### 嵌套资源

有时你可能需要为嵌套资源定义路由。例如，一个照片资源可能有多条附加到该照片的评论。要嵌套资源控制器，你可以在路由声明中使用"点"记法：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

这条路由将注册一个嵌套资源，可以通过如下 URI 访问：

```text
/photos/{photo}/comments/{comment}
```

<a name="scoping-nested-resources"></a>
#### 限定嵌套资源作用域

Laravel 的[隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的作用范围，确保解析出的子模型确实属于父模型。在定义嵌套资源时使用 `scoped` 方法，既可以启用自动作用域限定，又能告知 Laravel 应通过哪个字段检索子资源。更多相关信息，请参阅[限定资源路由作用域](#restful-scoping-resource-routes)的文档。

<a name="shallow-nesting"></a>
#### 浅层嵌套

通常，URI 中同时包含父 ID 和子 ID 并非完全必要，因为子 ID 本身已经是唯一标识符。当在 URI 片段中使用自增主键等唯一标识符来标识模型时，你可以选择使用"浅层嵌套"：

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

这个路由定义将生成以下路由：

| 动词      | URI                               | 动作    | 路由名称                |
| --------- | --------------------------------- | ------- | ---------------------- |
| GET       | `/photos/{photo}/comments`        | index   | photos.comments.index  |
| GET       | `/photos/{photo}/comments/create` | create  | photos.comments.create |
| POST      | `/photos/{photo}/comments`        | store   | photos.comments.store  |
| GET       | `/comments/{comment}`             | show    | comments.show          |
| GET       | `/comments/{comment}/edit`        | edit    | comments.edit          |
| PUT/PATCH | `/comments/{comment}`             | update  | comments.update        |
| DELETE    | `/comments/{comment}`             | destroy | comments.destroy       |

<a name="restful-naming-resource-routes"></a>
### 命名资源路由

默认情况下，所有资源控制器动作都有路由名称；不过，你可以通过传递包含期望路由名称的 `names` 数组来覆盖这些名称：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

<a name="restful-naming-resource-route-parameters"></a>
### 命名资源路由参数

默认情况下，`Route::resource` 会基于资源名称的"单数"形式为资源路由创建路由参数。你可以使用 `parameters` 方法，轻松地针对每个资源覆盖这一行为。传递给 `parameters` 方法的数组应是一个由资源名称和参数名称组成的关联数组：

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

上面的例子会为资源的 `show` 路由生成如下 URI：

```text
/users/{admin_user}
```

<a name="restful-scoping-resource-routes"></a>
### 限定资源路由作用域

Laravel 的[作用域隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的作用范围，确保解析出的子模型确实属于父模型。在定义嵌套资源时使用 `scoped` 方法，既可以启用自动作用域限定，又能告知 Laravel 应通过哪个字段检索子资源：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

这条路由将注册一个作用域限定的嵌套资源，可以通过如下 URI 访问：

```text
/photos/{photo}/comments/{comment:slug}
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动限定查询的作用范围，依据约定猜测父模型上的关联名称，从而通过父模型检索嵌套模型。在这个例子中，Laravel 会假定 `Photo` 模型有一个名为 `comments`（路由参数名称的复数形式）的关联，可用于检索 `Comment` 模型。

<a name="restful-localizing-resource-uris"></a>
### 本地化资源 URI

默认情况下，`Route::resource` 会使用英文动词和复数规则创建资源 URI。如果需要本地化 `create` 和 `edit` 动作动词，可以使用 `Route::resourceVerbs` 方法。这一操作可以在应用的 `App\Providers\AppServiceProvider` 的 `boot` 方法开头完成：

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

Laravel 的复数器支持[多种不同语言，你可以根据需要配置](/docs/{{version}}/localization#pluralization-language)。自定义动词和复数化语言后，`Route::resource('publicacion', PublicacionController::class)` 这样的资源路由注册将生成如下 URI：

```text
/publicacion/crear

/publicacion/{publicaciones}/editar
```

<a name="restful-supplementing-resource-controllers"></a>
### 补充资源控制器

如果需要在资源控制器上添加默认资源路由之外的附加路由，应将这些路由定义在调用 `Route::resource` 方法之前；否则，`resource` 方法定义的路由可能会意外地优先于你的附加路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> [!NOTE]
> 记住要让控制器保持职责单一。如果你发现自己经常需要典型资源动作集合之外的方法，可以考虑将控制器拆分为两个更小的控制器。

<a name="singleton-resource-controllers"></a>
### 单例资源控制器

有时，你的应用中会存在只能有单个实例的资源。例如，用户的"资料"可以被编辑或更新，但一个用户不会拥有多个"资料"。同样，一张图片可能只有一个"缩略图"。这类资源被称为"单例资源"（singleton resources），即资源有且仅能存在一个实例。在这些场景下，你可以注册"单例"资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义将注册以下路由。如你所见，单例资源不会注册"创建"路由，而且已注册的路由不接受标识符，因为资源只能存在一个实例：

| 动词      | URI             | 动作   | 路由名称        |
| --------- | --------------- | ------ | -------------- |
| GET       | `/profile`      | show   | profile.show   |
| GET       | `/profile/edit` | edit   | profile.edit   |
| PUT/PATCH | `/profile`      | update | profile.update |

单例资源也可以嵌套在标准资源中：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在这个例子中，`photos` 资源将获得所有[标准资源路由](#actions-handled-by-resource-controllers)；而 `thumbnail` 资源将是一个单例资源，具有以下路由：

| 动词      | URI                              | 动作   | 路由名称                 |
| --------- | -------------------------------- | ------ | ----------------------- |
| GET       | `/photos/{photo}/thumbnail`      | show   | photos.thumbnail.show   |
| GET       | `/photos/{photo}/thumbnail/edit` | edit   | photos.thumbnail.edit   |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update | photos.thumbnail.update |

<a name="creatable-singleton-resources"></a>
#### 可创建的单例资源

有时，你可能希望为单例资源定义创建和存储路由。为此，你可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在这个例子中，将注册以下路由。如你所见，可创建的单例资源还会注册一条 `DELETE` 路由：

| 动词      | URI                                | 动作    | 路由名称                  |
| --------- | ---------------------------------- | ------- | ------------------------ |
| GET       | `/photos/{photo}/thumbnail/create` | create  | photos.thumbnail.create  |
| POST      | `/photos/{photo}/thumbnail`        | store   | photos.thumbnail.store   |
| GET       | `/photos/{photo}/thumbnail`        | show    | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit`   | edit    | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`        | update  | photos.thumbnail.update  |
| DELETE    | `/photos/{photo}/thumbnail`        | destroy | photos.thumbnail.destroy |

如果你希望 Laravel 为单例资源注册 `DELETE` 路由，但不注册创建和存储路由，可以使用 `destroyable` 方法：

```php
Route::singleton(...)->destroyable();
```

<a name="api-singleton-resources"></a>
#### API 单例资源

`apiSingleton` 方法可用于注册将通过 API 操作的单例资源，因此无需 `create` 和 `edit` 路由：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable` 的，这将为资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```
<a name="middleware-and-resource-controllers"></a>
### 中间件与资源控制器

Laravel 允许你使用 `middleware`、`middlewareFor` 和 `withoutMiddlewareFor` 方法，将中间件分配给资源路由的全部方法或仅特定方法。这些方法为每个资源动作应用哪些中间件提供了精细的控制。

#### 为所有方法应用中间件

你可以使用 `middleware` 方法，将中间件分配给资源或单例资源路由生成的所有路由：

```php
Route::resource('users', UserController::class)
    ->middleware(['auth', 'verified']);

Route::singleton('profile', ProfileController::class)
    ->middleware('auth');
```

#### 为特定方法应用中间件

你可以使用 `middlewareFor` 方法，将中间件分配给给定资源控制器的一个或多个特定方法：

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

`middlewareFor` 方法也可以与单例及 API 单例资源控制器配合使用：

```php
Route::singleton('profile', ProfileController::class)
    ->middlewareFor('show', 'auth');

Route::apiSingleton('profile', ProfileController::class)
    ->middlewareFor(['show', 'update'], 'auth');
```

#### 从特定方法排除中间件

你可以使用 `withoutMiddlewareFor` 方法，从资源控制器的特定方法中排除中间件：

```php
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::resource('users', UserController::class)
        ->withoutMiddlewareFor('index', ['auth', 'verified'])
        ->withoutMiddlewareFor(['create', 'store'], 'verified')
        ->withoutMiddlewareFor('destroy', 'subscribed');
});
```

<a name="dependency-injection-and-controllers"></a>
## 依赖注入与控制器

<a name="constructor-injection"></a>
#### 构造函数注入

Laravel [服务容器（Service Container）](/docs/{{version}}/container)用于解析所有的 Laravel 控制器。因此，你可以在控制器的构造函数中对控制器所需的任何依赖进行类型提示。声明的依赖会被自动解析并注入到控制器实例中：

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

<a name="method-injection"></a>
#### 方法注入

除了构造函数注入，你还可以在控制器的方法中对依赖进行类型提示。方法注入的一个常见用例是将 `Illuminate\Http\Request` 实例注入到控制器方法中：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->name;

        // 存储用户...

        return redirect('/users');
    }
}
```

如果你的控制器方法还需要接收路由参数的输入，请将路由参数列在其他依赖之后。例如，假设你的路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以对 `Illuminate\Http\Request` 进行类型提示，并按如下方式定义控制器方法来访问 `id` 参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新给定用户。
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 更新用户...

        return redirect('/users');
    }
}
```
