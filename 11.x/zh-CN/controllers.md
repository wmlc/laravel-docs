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
    - [限定资源路由范围](#restful-scoping-resource-routes)
    - [本地化资源 URI](#restful-localizing-resource-uris)
    - [补充资源控制器](#restful-supplementing-resource-controllers)
    - [单例资源控制器](#singleton-resource-controllers)
- [依赖注入与控制器](#dependency-injection-and-controllers)

<a name="introduction"></a>
## 简介

如果不想把全部请求处理逻辑都定义为路由文件中的闭包，你可能希望使用"控制器"类来组织这些行为。控制器可以把相关的请求处理逻辑归入同一个类。例如，`UserController` 类可以处理所有与用户有关的传入请求，包括展示、创建、更新和删除用户。默认情况下，控制器存放在 `app/Http/Controllers` 目录中。

<a name="writing-controllers"></a>
## 编写控制器

<a name="basic-controllers"></a>
### 基础控制器

要快速生成新的控制器，可以运行 `make:controller` Artisan 命令。默认情况下，你的应用所有控制器都存放在 `app/Http/Controllers` 目录中：

```shell
php artisan make:controller UserController
```

我们来看一个基础控制器的示例。控制器可以有任意数量的公共方法，用来响应传入的 HTTP 请求：

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

编写好控制器类和方法之后，你就可以这样定义一条指向该控制器方法的路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求匹配到指定的路由 URI 时，`App\Http\Controllers\UserController` 类上的 `show` 方法会被调用，路由参数也会被传入该方法。

> [!NOTE]
> 控制器并**不强制要求**继承某个基础类。不过，有时继承一个包含所有控制器都应共享方法的基础控制器类会更为方便。

<a name="single-action-controllers"></a>
### 单动作控制器

如果某个控制器动作特别复杂，你可能会发现为这一个动作专门准备一个完整的控制器类更为方便。为此，你可以在控制器中定义一个 `__invoke` 方法：

```php
<?php

namespace App\Http\Controllers;

class ProvisionServer extends Controller
{
    /**
     * 置备一台新的 Web 服务器。
     */
    public function __invoke()
    {
        // ...
    }
}
```

为单动作控制器注册路由时，你不需要指定控制器方法，只需把控制器名称传给路由即可：

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你也可以使用 `make:controller` Artisan 命令的 `--invokable` 选项来生成可调用控制器：

```shell
php artisan make:controller ProvisionServer --invokable
```

> [!NOTE]
> 控制器存根可以通过[发布存根](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="controller-middleware"></a>
## 控制器中间件

[中间件](/docs/{{version}}/middleware)可以在路由文件中被分配给控制器的路由：

```php
Route::get('/profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你可能发现直接在控制器类中指定中间件更为方便。为此，你的控制器应当实现 `HasMiddleware` 接口，该接口规定控制器必须拥有一个静态的 `middleware` 方法。在这个方法中，你可以返回一个中间件数组，其中包含应当应用到控制器各个动作上的中间件：

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

你也可以把控制器中间件定义为闭包，这样无需编写完整的中间件类就能定义一个内联中间件，非常方便：

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

> [!WARNING]
> 实现了 `Illuminate\Routing\Controllers\HasMiddleware` 的控制器不应当继承 `Illuminate\Routing\Controller`。

<a name="resource-controllers"></a>
## 资源控制器

如果你把应用中的每个 Eloquent 模型都视为一种"资源"，那么通常会对每个资源执行相同的一组操作。例如，假设你的应用包含一个 `Photo` 模型和一个 `Movie` 模型。用户很可能可以创建、读取、更新或删除这些资源。

由于这一常见用例，Laravel 的资源路由只用一行代码就能把典型的创建、读取、更新和删除（"CRUD"）路由分配给控制器。要开始使用，可以使用 `make:controller` Artisan 命令的 `--resource` 选项快速创建一个用于处理这些操作的控制器：

```shell
php artisan make:controller PhotoController --resource
```

该命令会在 `app/Http/Controllers/PhotoController.php` 生成一个控制器。控制器中会包含每个可用资源操作对应的方法。接下来，你可以注册一条指向该控制器的资源路由：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这一条路由声明会创建多条路由，用于处理该资源上的各种操作。生成的控制器中已经为每个操作提供了方法存根。请记住，你随时可以运行 `route:list` Artisan 命令，快速总览应用的路由。

你甚至可以把一个数组传给 `resources` 方法，一次注册多个资源控制器：

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

<a name="actions-handled-by-resource-controllers"></a>
#### 资源控制器处理的动作

<div class="overflow-auto">

| 动词      | URI                    | 动作    | 路由名称       |
| --------- | ---------------------- | ------- | -------------- |
| GET       | `/photos`              | index   | photos.index   |
| GET       | `/photos/create`       | create  | photos.create  |
| POST      | `/photos`              | store   | photos.store   |
| GET       | `/photos/{photo}`      | show    | photos.show    |
| GET       | `/photos/{photo}/edit` | edit    | photos.edit    |
| PUT/PATCH | `/photos/{photo}`      | update  | photos.update  |
| DELETE    | `/photos/{photo}`      | destroy | photos.destroy |

</div>

<a name="customizing-missing-model-behavior"></a>
#### 自定义模型缺失时的行为

通常情况下，如果隐式绑定的资源模型未找到，会返回一个 404 HTTP 响应。不过，你可以在定义资源路由时调用 `missing` 方法来自定义该行为。`missing` 方法接受一个闭包，当资源的任意路由无法找到隐式绑定的模型时，该闭包就会被调用：

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
#### 已软删除的模型

通常情况下，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型，而是返回一个 404 HTTP 响应。不过，你可以在定义资源路由时调用 `withTrashed` 方法，指示框架允许使用已软删除的模型：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

不带参数调用 `withTrashed` 会让 `show`、`edit` 和 `update` 资源路由都允许使用已软删除的模型。你也可以向 `withTrashed` 方法传入一个数组，指定这些路由中的一个子集：

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

<a name="specifying-the-resource-model"></a>
#### 指定资源模型

如果你在使用[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，并希望资源控制器的方法对模型实例进行类型提示，可以在生成控制器时使用 `--model` 选项：

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

声明资源路由时，你可以指定控制器应当处理的动作子集，而不是完整的默认动作集：

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

声明供 API 使用的资源路由时，你通常会希望排除呈现 HTML 模板的路由，例如 `create` 和 `edit`。为方便起见，你可以使用 `apiResource` 方法自动排除这两条路由：

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传入一个数组，一次注册多个 API 资源控制器：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成一个不包含 `create` 或 `edit` 方法的 API 资源控制器，请在执行 `make:controller` 命令时使用 `--api` 开关：

```shell
php artisan make:controller PhotoController --api
```

<a name="restful-nested-resources"></a>
### 嵌套资源

有时你需要定义指向嵌套资源的路由。例如，一张照片资源可以有多个与之关联的评论。要嵌套资源控制器，可以在路由声明中使用"点"记法：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

该路由会注册一个嵌套资源，可以通过类似下面的 URI 访问：

```text
/photos/{photo}/comments/{comment}
```

<a name="scoping-nested-resources"></a>
#### 限定嵌套资源范围

Laravel 的[隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的范围，从而确认解析出的子模型确实属于父模型。在定义嵌套资源时使用 `scoped` 方法，你就能启用自动范围限定，同时指示 Laravel 应当按哪个字段检索子资源。有关更多信息，请参阅[限定资源路由范围](#restful-scoping-resource-routes)的文档。

<a name="shallow-nesting"></a>
#### 浅层嵌套

通常来说，由于子 ID 本身已是唯一标识符，URI 中同时包含父 ID 和子 ID 并不是完全必要的。当使用自动递增主键这类唯一标识符在 URI 片段中标识模型时，你可以选择使用"浅层嵌套"：

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

该路由定义会定义以下路由：

<div class="overflow-auto">

| 动词      | URI                               | 动作    | 路由名称               |
| --------- | --------------------------------- | ------- | ---------------------- |
| GET       | `/photos/{photo}/comments`        | index   | photos.comments.index  |
| GET       | `/photos/{photo}/comments/create` | create  | photos.comments.create |
| POST      | `/photos/{photo}/comments`        | store   | photos.comments.store  |
| GET       | `/comments/{comment}`             | show    | comments.show          |
| GET       | `/comments/{comment}/edit`        | edit    | comments.edit          |
| PUT/PATCH | `/comments/{comment}`             | update  | comments.update        |
| DELETE    | `/comments/{comment}`             | destroy | comments.destroy       |

</div>

<a name="restful-naming-resource-routes"></a>
### 命名资源路由

默认情况下，所有资源控制器动作都有路由名称；不过，你可以通过传入一个 `names` 数组来自定义这些名称，数组中给出你期望的路由名称：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

<a name="restful-naming-resource-route-parameters"></a>
### 命名资源路由参数

默认情况下，`Route::resource` 会根据资源名称的"单数化"版本为你的资源路由创建路由参数。你可以使用 `parameters` 方法轻松地按资源逐一覆盖这一行为。传给 `parameters` 方法的数组应当是一个由资源名称和参数名称组成的关联数组：

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

上面的示例会为该资源的 `show` 路由生成以下 URI：

```text
/users/{admin_user}
```

<a name="restful-scoping-resource-routes"></a>
### 限定资源路由范围

Laravel 的[限定范围的隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的范围，从而确认解析出的子模型确实属于父模型。在定义嵌套资源时使用 `scoped` 方法，你就能启用自动范围限定，同时指示 Laravel 应当按哪个字段检索子资源：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

该路由会注册一个带范围限定的嵌套资源，可以通过类似下面的 URI 访问：

```text
/photos/{photo}/comments/{comment:slug}
```

把自定义键值的隐式绑定用作嵌套路由参数时，Laravel 会自动按父模型限定查询范围，并按照约定推测父模型上的关联名称。在这种情况下，可以假定 `Photo` 模型拥有一个名为 `comments` 的关联（即路由参数名的复数形式），可用于检索 `Comment` 模型。

<a name="restful-localizing-resource-uris"></a>
### 本地化资源 URI

默认情况下，`Route::resource` 会使用英文动词和复数规则创建资源 URI。如果你需要本地化 `create` 和 `edit` 这两个动作动词，可以使用 `Route::resourceVerbs` 方法。这可以在应用 `App\Providers\AppServiceProvider` 的 `boot` 方法开头完成：

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

Laravel 的复数化器支持[多种不同语言，你可以根据需要配置](/docs/{{version}}/localization#pluralization-language)。一旦自定义好动词和复数化语言，像 `Route::resource('publicacion', PublicacionController::class)` 这样的资源路由注册就会生成以下 URI：

```text
/publicacion/crear

/publicacion/{publicaciones}/editar
```

<a name="restful-supplementing-resource-controllers"></a>
### 补充资源控制器

如果你需要在默认资源路由之外为资源控制器添加额外的路由，就应当在调用 `Route::resource` 方法之前定义这些路由；否则，`resource` 方法所定义的路由可能会无意中优先于你的补充路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> [!NOTE]
> 请记住让控制器保持聚焦。如果你发现自己经常需要使用典型资源动作之外的方法，可以考虑把控制器拆分成两个更小的控制器。

<a name="singleton-resource-controllers"></a>
### 单例资源控制器

有时你的应用中会存在只能有单个实例的资源。例如，用户的"资料"可以被编辑或更新，但一个用户不可能有多个"资料"。同样，一张图片可能只有一个"缩略图"。这类资源被称为"单例资源"，即该资源有且仅有一个实例。在这种场景下，你可以注册一个"单例"资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义会注册以下路由。如你所见，单例资源不会注册"创建"路由，而且已注册的路由不接受标识符，因为该资源只能存在一个实例：

<div class="overflow-auto">

| 动词      | URI             | 动作    | 路由名称       |
| --------- | --------------- | ------- | -------------- |
| GET       | `/profile`      | show    | profile.show   |
| GET       | `/profile/edit` | edit    | profile.edit   |
| PUT/PATCH | `/profile`      | update  | profile.update |

</div>

单例资源也可以嵌套在标准资源之内：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在这个例子中，`photos` 资源会获得全部的[标准资源路由](#actions-handled-by-resource-controllers)；而 `thumbnail` 资源则是一个单例资源，具有以下路由：

<div class="overflow-auto">

| 动词      | URI                              | 动作    | 路由名称              |
| --------- | -------------------------------- | ------- | --------------------- |
| GET       | `/photos/{photo}/thumbnail`      | show    | photos.thumbnail.show |
| GET       | `/photos/{photo}/thumbnail/edit` | edit    | photos.thumbnail.edit |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update  | photos.thumbnail.update |

</div>

<a name="creatable-singleton-resources"></a>
#### 可创建的单例资源

偶尔你可能希望为单例资源定义创建和存储路由。为此，你可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在这个例子中，会注册以下路由。如你所见，可创建的单例资源还会注册一条 `DELETE` 路由：

<div class="overflow-auto">

| 动词      | URI                                | 动作     | 路由名称                 |
| --------- | ---------------------------------- | -------- | ------------------------ |
| GET       | `/photos/{photo}/thumbnail/create` | create   | photos.thumbnail.create  |
| POST      | `/photos/{photo}/thumbnail`        | store    | photos.thumbnail.store   |
| GET       | `/photos/{photo}/thumbnail`        | show     | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit`   | edit     | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`        | update   | photos.thumbnail.update  |
| DELETE    | `/photos/{photo}/thumbnail`        | destroy  | photos.thumbnail.destroy |

</div>

如果你希望 Laravel 为单例资源注册 `DELETE` 路由，但不注册创建或存储路由，可以使用 `destroyable` 方法：

```php
Route::singleton(...)->destroyable();
```

<a name="api-singleton-resources"></a>
#### API 单例资源

`apiSingleton` 方法可用于注册一个通过 API 操作的单例资源，从而让 `create` 和 `edit` 路由变得不必要：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable`，这会为该资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```

<a name="dependency-injection-and-controllers"></a>
## 依赖注入与控制器

<a name="constructor-injection"></a>
#### 构造器注入

Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)用于解析所有 Laravel 控制器。因此，你可以在控制器构造函数中对所需的任何依赖进行类型提示。声明的依赖会被自动解析并注入到控制器实例中：

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

除了构造器注入之外，你还可以在控制器方法中对依赖进行类型提示。方法注入的一个常见用例是把 `Illuminate\Http\Request` 实例注入控制器方法：

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

如果你的控制器方法还期望接收来自路由参数的输入，请把路由参数列在其他依赖之后。例如，如果你的路由这样定义：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你依然可以对 `Illuminate\Http\Request` 进行类型提示，并通过以下方式定义控制器方法来访问 `id` 参数：

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