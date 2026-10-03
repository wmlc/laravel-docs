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
    - [作用域资源路由](#restful-scoping-resource-routes)
    - [本地化资源 URI](#restful-localizing-resource-uris)
    - [补充资源控制器](#restful-supplementing-resource-controllers)
    - [单例资源控制器](#singleton-resource-controllers)
- [依赖注入与控制器](#dependency-injection-and-controllers)

<a name="introduction"></a>
## 简介

与其将所有的请求处理逻辑以闭包形式定义在路由文件中，你也许更希望使用「控制器」类来组织这些行为。控制器可以将相关的请求处理逻辑分组到单个类中。例如，`UserController` 类可以处理所有与用户相关的传入请求，包括展示、创建、更新和删除用户。默认情况下，控制器存放在 `app/Http/Controllers` 目录中。

<a name="writing-controllers"></a>
## 编写控制器

<a name="basic-controllers"></a>
### 基础控制器

下面来看一个基础控制器的示例。注意，该控制器继承了 Laravel 附带的基础控制器类：`App\Http\Controllers\Controller`：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    /**
     * 显示指定用户的资料。
     *
     * @param  int  $id
     * @return \Illuminate\View\View
     */
    public function show($id)
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

你可以像这样定义指向该控制器方法的路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求匹配指定的路由 URI 时，`App\Http\Controllers\UserController` 类的 `show` 方法将被调用，路由参数也会传递给该方法。

> **Note**  
> 控制器**不要求**继承基类。但是，你将无法使用 `middleware` 和 `authorize` 等便捷方法。

<a name="single-action-controllers"></a>
### 单动作控制器

如果某个控制器动作特别复杂，你可能会发现为该单个动作专门编写一个完整的控制器类会很方便。为此，你可以在控制器中定义单个 `__invoke` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;

class ProvisionServer extends Controller
{
    /**
     * 配置一台新的 Web 服务器。
     *
     * @return \Illuminate\Http\Response
     */
    public function __invoke()
    {
        // ...
    }
}
```

为单动作控制器注册路由时，无需指定控制器方法。只需将控制器名称传递给路由器即可：

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你可以使用 `make:controller` Artisan 命令的 `--invokable` 选项来生成可调用的控制器：

```shell
php artisan make:controller ProvisionServer --invokable
```

> **Note**  
> 控制器存根可以通过 [存根发布](/docs/{{version}}/artisan#stub-customization) 进行自定义。

<a name="controller-middleware"></a>
## 控制器中间件

[中间件](/docs/{{version}}/middleware) 可以在路由文件中分配给控制器的路由：

```php
Route::get('profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你可能会发现在控制器构造函数中指定中间件更为方便。在控制器构造函数中使用 `middleware` 方法，可以将中间件分配给控制器的动作：

```php
class UserController extends Controller
{
    /**
     * 实例化一个新的控制器实例。
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('log')->only('index');
        $this->middleware('subscribed')->except('store');
    }
}
```

控制器还允许你使用闭包注册中间件。这提供了一种便捷的方式，可以为单个控制器定义内联中间件，而无需定义整个中间件类：

```php
$this->middleware(function ($request, $next) {
    return $next($request);
});
```

<a name="resource-controllers"></a>
## 资源控制器

如果你将应用中的每个 Eloquent 模型视为一个「资源」，通常会对每个资源执行相同的操作集合。例如，假设你的应用包含 `Photo` 模型和 `Movie` 模型。用户可能需要创建、读取、更新或删除这些资源。

针对这一常见用例，Laravel 资源路由只需一行代码即可将典型的创建、读取、更新和删除（「CRUD」）路由分配给控制器。首先，我们可以使用 `make:controller` Artisan 命令的 `--resource` 选项快速创建一个处理这些动作的控制器：

```shell
php artisan make:controller PhotoController --resource
```

此命令将在 `app/Http/Controllers/PhotoController.php` 处生成一个控制器。该控制器将为每个可用的资源操作包含一个方法。接下来，你可以注册一个指向该控制器的资源路由：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这一条路由声明会创建多个路由，以处理对资源的各种动作。生成的控制器已经为每个动作提供了方法存根。请记住，你可以随时运行 `route:list` Artisan 命令来快速查看应用的路由。

你甚至可以通过向 `resources` 方法传递数组来一次注册多个资源控制器：

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

<a name="actions-handled-by-resource-controller"></a>
#### 资源控制器处理的动作

Verb      | URI                    | Action       | Route Name
----------|------------------------|--------------|---------------------
GET       | `/photos`              | index        | photos.index
GET       | `/photos/create`       | create       | photos.create
POST      | `/photos`              | store        | photos.store
GET       | `/photos/{photo}`      | show         | photos.show
GET       | `/photos/{photo}/edit` | edit         | photos.edit
PUT/PATCH | `/photos/{photo}`      | update       | photos.update
DELETE    | `/photos/{photo}`      | destroy      | photos.destroy

<a name="customizing-missing-model-behavior"></a>
#### 自定义模型缺失行为

通常，如果找不到隐式绑定的资源模型，将生成 404 HTTP 响应。但是，你可以在定义资源路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，当无法为资源的任何路由找到隐式绑定的模型时，将调用该闭包：

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
#### 软删除模型

通常，隐式模型绑定不会检索已被 [软删除](/docs/{{version}}/eloquent#soft-deleting) 的模型，而是返回 404 HTTP 响应。但是，你可以在定义资源路由时调用 `withTrashed` 方法，指示框架允许软删除的模型：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

不带参数调用 `withTrashed` 将允许 `show`、`edit` 和 `update` 资源路由使用软删除的模型。你可以通过向 `withTrashed` 方法传递数组来指定这些路由的子集：

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

<a name="specifying-the-resource-model"></a>
#### 指定资源模型

如果你使用 [路由模型绑定](/docs/{{version}}/routing#route-model-binding) 并希望资源控制器的方法对模型实例进行类型提示，可以在生成控制器时使用 `--model` 选项：

```shell
php artisan make:controller PhotoController --model=Photo --resource
```

<a name="generating-form-requests"></a>
#### 生成表单请求

在生成资源控制器时，你可以提供 `--requests` 选项，指示 Artisan 为控制器的存储和更新方法生成 [表单请求类](/docs/{{version}}/validation#form-request-validation)：

```shell
php artisan make:controller PhotoController --model=Photo --resource --requests
```

<a name="restful-partial-resource-routes"></a>
### 部分资源路由

声明资源路由时，你可以指定控制器应处理的动作子集，而非全部默认动作：

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

声明将被 API 使用的资源路由时，通常会排除呈现 HTML 模板的路由，如 `create` 和 `edit`。为方便起见，你可以使用 `apiResource` 方法自动排除这两个路由：

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传递数组来一次注册多个 API 资源控制器：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成不包含 `create` 或 `edit` 方法的 API 资源控制器，请在执行 `make:controller` 命令时使用 `--api` 开关：

```shell
php artisan make:controller PhotoController --api
```

<a name="restful-nested-resources"></a>
### 嵌套资源

有时你可能需要定义嵌套资源的路由。例如，一个照片资源可能包含多个附加到该照片的评论。要嵌套资源控制器，你可以在路由声明中使用「点」号记法：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

此路由将注册一个嵌套资源，可以通过类似以下的 URI 访问：

```text
/photos/{photo}/comments/{comment}
```

<a name="scoping-nested-resources"></a>
#### 作用域嵌套资源

Laravel 的 [隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping) 功能可以自动对嵌套绑定进行作用域限制，以确保解析的子模型属于父模型。在定义嵌套资源时使用 `scoped` 方法，你可以启用自动作用域限制，并指示 Laravel 应通过哪个字段检索子资源。有关如何实现此功能的更多信息，请参阅 [作用域资源路由](#restful-scoping-resource-routes) 的文档。

<a name="shallow-nesting"></a>
#### 浅嵌套

通常，在 URI 中同时包含父 ID 和子 ID 并非完全必要，因为子 ID 本身已是唯一标识符。当使用自增主键等唯一标识符在 URI 段中标识模型时，你可以选择使用「浅嵌套」：

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

此路由定义将定义以下路由：

Verb      | URI                               | Action       | Route Name
----------|-----------------------------------|--------------|---------------------
GET       | `/photos/{photo}/comments`        | index        | photos.comments.index
GET       | `/photos/{photo}/comments/create` | create       | photos.comments.create
POST      | `/photos/{photo}/comments`        | store        | photos.comments.store
GET       | `/comments/{comment}`             | show         | comments.show
GET       | `/comments/{comment}/edit`        | edit         | comments.edit
PUT/PATCH | `/comments/{comment}`             | update       | comments.update
DELETE    | `/comments/{comment}`             | destroy      | comments.destroy

<a name="restful-naming-resource-routes"></a>
### 命名资源路由

默认情况下，所有资源控制器动作都有路由名称；但是，你可以通过传递包含所需路由名称的 `names` 数组来覆盖这些名称：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

<a name="restful-naming-resource-route-parameters"></a>
### 命名资源路由参数

默认情况下，`Route::resource` 会根据资源名称的「单数化」版本为资源路由创建路由参数。你可以使用 `parameters` 方法轻松地按资源覆盖此设置。传递给 `parameters` 方法的数组应为资源名称和参数名称的关联数组：

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

 上面的示例为资源的 `show` 路由生成以下 URI：

```text
/users/{admin_user}
```

<a name="restful-scoping-resource-routes"></a>
### 作用域资源路由

Laravel 的 [作用域隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping) 功能可以自动对嵌套绑定进行作用域限制，以确保解析的子模型属于父模型。在定义嵌套资源时使用 `scoped` 方法，你可以启用自动作用域限制，并指示 Laravel 应通过哪个字段检索子资源：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

此路由将注册一个作用域嵌套资源，可以通过类似以下的 URI 访问：

```text
/photos/{photo}/comments/{comment:slug}
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动对查询进行作用域限制，通过约定猜测父模型上的关联名称，以通过父模型检索嵌套模型。在此示例中，将假定 `Photo` 模型具有名为 `comments`（路由参数名称的复数形式）的关联，可用于检索 `Comment` 模型。

<a name="restful-localizing-resource-uris"></a>
### 本地化资源 URI

默认情况下，`Route::resource` 会使用英文动词和复数规则创建资源 URI。如果需要本地化 `create` 和 `edit` 动作动词，可以使用 `Route::resourceVerbs` 方法。这可以在应用的 `App\Providers\RouteServiceProvider` 的 `boot` 方法开头处完成：

```php
/**
 * 定义路由模型绑定、模式过滤器等。
 *
 * @return void
 */
public function boot()
{
    Route::resourceVerbs([
        'create' => 'crear',
        'edit' => 'editar',
    ]);

    // ...
}
```

Laravel 的复数化器支持 [多种不同的语言，你可以根据需要进行配置](/docs/{{version}}/localization#pluralization-language)。自定义动词和复数化语言后，诸如 `Route::resource('publicacion', PublicacionController::class)` 的资源路由注册将生成以下 URI：

```text
/publicacion/crear

/publicacion/{publicaciones}/editar
```

<a name="restful-supplementing-resource-controllers"></a>
### 补充资源控制器

如果需要在资源控制器中添加超出默认资源路由集合的额外路由，应在调用 `Route::resource` 方法之前定义这些路由；否则，`resource` 方法定义的路由可能会无意中优先于你的补充路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> **Note**  
> 请记住保持控制器的职责聚焦。如果你发现自己经常需要典型资源动作集合之外的方法，请考虑将控制器拆分为两个更小的控制器。

<a name="singleton-resource-controllers"></a>
### 单例资源控制器

有时，你的应用会包含只有一个实例的资源。例如，用户的「个人资料」可以被编辑或更新，但一个用户不会有多个「个人资料」。同样，一张图片可能只有一个「缩略图」。这类资源称为「单例资源」，意味着资源有且仅有一个实例。在这些场景下，你可以注册一个「单例」资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义将注册以下路由。如你所见，单例资源不会注册「创建」路由，且注册的路由不接受标识符，因为资源只有一个实例：

Verb      | URI                               | Action       | Route Name
----------|-----------------------------------|--------------|---------------------
GET       | `/profile`                        | show         | profile.show
GET       | `/profile/edit`                   | edit         | profile.edit
PUT/PATCH | `/profile`                        | update       | profile.update

单例资源也可以嵌套在标准资源中：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在此示例中，`photos` 资源将获得所有 [标准资源路由](#actions-handled-by-resource-controller)；而 `thumbnail` 资源将是具有以下路由的单例资源：

| Verb      | URI                              | Action  | Route Name               |
|-----------|----------------------------------|---------|--------------------------|
| GET       | `/photos/{photo}/thumbnail`      | show    | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit` | edit    | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update  | photos.thumbnail.update  |

<a name="creatable-singleton-resources"></a>
#### 可创建单例资源

有时，你可能希望为单例资源定义创建和存储路由。为此，你可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在此示例中，将注册以下路由。如你所见，可创建单例资源还会注册一个 `DELETE` 路由：

| Verb      | URI                                | Action  | Route Name               |
|-----------|------------------------------------|---------|--------------------------|
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

<a name="api-singleton-resources"></a>
#### API 单例资源

`apiSingleton` 方法可用于注册将通过 API 操作的单例资源，因此 `create` 和 `edit` 路由是不必要的：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable` 的，这将为资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```

<a name="dependency-injection-and-controllers"></a>
## 依赖注入与控制器

<a name="constructor-injection"></a>
#### 构造函数注入

Laravel 使用 [服务容器（Service Container）](/docs/{{version}}/container) 来解析所有的 Laravel 控制器。因此，你可以在控制器构造函数中对控制器可能需要的任何依赖进行类型提示。声明的依赖将被自动解析并注入到控制器实例中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;

class UserController extends Controller
{
    /**
     * 用户仓库实例。
     */
    protected $users;

    /**
     * 创建一个新的控制器实例。
     *
     * @param  \App\Repositories\UserRepository  $users
     * @return void
     */
    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }
}
```

<a name="method-injection"></a>
#### 方法注入

除了构造函数注入，你还可以在控制器方法中对依赖进行类型提示。方法注入的一个常见用例是将 `Illuminate\Http\Request` 实例注入到控制器方法中：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储一个新用户。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $name = $request->name;

        //
    }
}
```

如果控制器方法还需要从路由参数获取输入，请将路由参数列在其他依赖之后。例如，如果路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以对 `Illuminate\Http\Request` 进行类型提示，并通过如下定义控制器方法来访问 `id` 参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新指定的用户。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }
}
```