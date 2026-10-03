# 路由

- [基础路由](#basic-routing)
    - [默认路由文件](#the-default-route-files)
    - [重定向路由](#redirect-routes)
    - [视图路由](#view-routes)
    - [列出你的路由](#listing-your-routes)
    - [路由定制](#routing-customization)
- [路由参数](#route-parameters)
    - [必需参数](#required-parameters)
    - [可选参数](#parameters-optional-parameters)
    - [正则表达式约束](#parameters-regular-expression-constraints)
- [命名路由](#named-routes)
- [路由组](#route-groups)
    - [中间件](#route-group-middleware)
    - [控制器](#route-group-controllers)
    - [子域名路由](#route-group-subdomain-routing)
    - [路由前缀](#route-group-prefixes)
    - [路由名称前缀](#route-group-name-prefixes)
- [路由模型绑定](#route-model-binding)
    - [隐式绑定](#implicit-binding)
    - [隐式枚举绑定](#implicit-enum-binding)
    - [显式绑定](#explicit-binding)
- [回退路由](#fallback-routes)
- [速率限制](#rate-limiting)
    - [定义速率限制器](#defining-rate-limiters)
    - [把速率限制器附加到路由](#attaching-rate-limiters-to-routes)
- [表单方法伪装](#form-method-spoofing)
- [访问当前路由](#accessing-the-current-route)
- [跨域资源共享（CORS）](#cors)
- [路由缓存](#route-caching)

<a name="basic-routing"></a>
## 基础路由

最基础的 Laravel 路由接受一个 URI 和一个闭包，提供了一种非常简单且富有表达力的方式来定义路由和行为，无需复杂的路由配置文件：

```php
use Illuminate\Support\Facades\Route;

Route::get('/greeting', function () {
    return 'Hello World';
});
```

<a name="the-default-route-files"></a>
### 默认路由文件

所有 Laravel 路由都定义在你的路由文件中，这些文件位于 `routes` 目录。Laravel 会依据应用 `bootstrap/app.php` 文件中指定的配置自动加载这些文件。`routes/web.php` 文件定义用于 Web 界面的路由。这些路由会被分配到 `web` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)，从而获得会话状态和 CSRF 保护等特性。

对大多数应用来说，你会先在 `routes/web.php` 文件中定义路由。在 `routes/web.php` 中定义的路由，可以通过在浏览器中输入相应路由的 URL 来访问。例如，你可以在浏览器中访问 `http://example.com/user` 来访问下面这条路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user', [UserController::class, 'index']);
```

<a name="api-routes"></a>
#### API 路由

如果你的应用还要提供无状态的 API，可以使用 `install:api` Artisan 命令启用 API 路由：

```shell
php artisan install:api
```

`install:api` 命令会安装 [Laravel Sanctum](/docs/{{version}}/sanctum)，它提供了一套健壮而简单的 API 令牌认证守卫，可用于对第三方 API 消费者、SPA 或移动应用进行认证。此外，`install:api` 命令还会创建 `routes/api.php` 文件：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

`routes/api.php` 中的路由是无状态的，会被分配到 `api` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)。此外，`/api` URI 前缀会自动应用到这些路由上，因此无需手动为文件中的每条路由添加该前缀。你可以通过修改应用的 `bootstrap/app.php` 文件来更改此前缀：

```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'api/admin',
    // ...
)
```

<a name="available-router-methods"></a>
#### 可用的路由方法

路由器允许你注册响应任意 HTTP 动词的路由：

```php
Route::get($uri, $callback);
Route::post($uri, $callback);
Route::put($uri, $callback);
Route::patch($uri, $callback);
Route::delete($uri, $callback);
Route::options($uri, $callback);
```

有时你可能需要注册一条响应多个 HTTP 动词的路由。为此可以使用 `match` 方法。你甚至可以使用 `any` 方法注册一条响应所有 HTTP 动词的路由：

```php
Route::match(['get', 'post'], '/', function () {
    // ...
});

Route::any('/', function () {
    // ...
});
```

> [!NOTE]
> 当定义多条共享同一 URI 的路由时，使用 `get`、`post`、`put`、`patch`、`delete` 和 `options` 方法的路由应当定义在使用 `any`、`match` 和 `redirect` 方法的路由之前。这样可以确保传入的请求匹配到正确的路由。

<a name="dependency-injection"></a>
#### 依赖注入

你可以在路由回调的签名中对路由所需的任何依赖做类型提示。所声明的依赖会由 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)自动解析并注入回调。例如，你可以对 `Illuminate\Http\Request` 类做类型提示，让当前的 HTTP 请求自动注入你的路由回调：

```php
use Illuminate\Http\Request;

Route::get('/users', function (Request $request) {
    // ...
});
```

<a name="csrf-protection"></a>
#### CSRF 保护

请记住，任何指向 `web` 路由文件中定义的 `POST`、`PUT`、`PATCH` 或 `DELETE` 路由的 HTML 表单，都应当包含一个 CSRF 令牌字段。否则请求会被拒绝。你可以在 [CSRF 文档](/docs/{{version}}/csrf)中了解更多关于 CSRF 保护的内容：

```blade
<form method="POST" action="/profile">
    @csrf
    ...
</form>
```

<a name="redirect-routes"></a>
### 重定向路由

如果你要定义一条重定向到另一个 URI 的路由，可以使用 `Route::redirect` 方法。该方法提供了一个便捷的捷径，让你无需为简单的重定向定义完整的路由或控制器：

```php
Route::redirect('/here', '/there');
```

默认情况下，`Route::redirect` 返回 `302` 状态码。你可以使用可选的第三个参数来自定义状态码：

```php
Route::redirect('/here', '/there', 301);
```

或者，你也可以使用 `Route::permanentRedirect` 方法返回 `301` 状态码：

```php
Route::permanentRedirect('/here', '/there');
```

> [!WARNING]
> 在重定向路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`destination` 和 `status`。

<a name="view-routes"></a>
### 视图路由

如果你的路由只需要返回一个[视图](/docs/{{version}}/views)，可以使用 `Route::view` 方法。与 `redirect` 方法一样，该方法提供了一个简单的捷径，让你无需定义完整的路由或控制器。`view` 方法的第一个参数接受一个 URI，第二个参数接受视图名称。此外，你还可以提供一组数据作为可选的第三个参数传给视图：

```php
Route::view('/welcome', 'welcome');

Route::view('/welcome', 'welcome', ['name' => 'Taylor']);
```

> [!WARNING]
> 在视图路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`view`、`data`、`status` 和 `headers`。

<a name="listing-your-routes"></a>
### 列出你的路由

`route:list` Artisan 命令可以轻松概览应用定义的所有路由：

```shell
php artisan route:list
```

默认情况下，分配给每条路由的路由中间件不会显示在 `route:list` 输出中；不过，你可以在命令中加入 `-v` 选项，指示 Laravel 显示路由中间件和中间件组名称：

```shell
php artisan route:list -v

# 展开中间件组...
php artisan route:list -vv
```

你还可以指示 Laravel 只显示以给定 URI 开头的路由：

```shell
php artisan route:list --path=api
```

此外，执行 `route:list` 命令时提供 `--except-vendor` 选项，可以指示 Laravel 隐藏由第三方包定义的路由：

```shell
php artisan route:list --except-vendor
```

同样地，执行 `route:list` 命令时提供 `--only-vendor` 选项，可以指示 Laravel 只显示由第三方包定义的路由：

```shell
php artisan route:list --only-vendor
```

<a name="routing-customization"></a>
### 路由定制

默认情况下，你的应用路由由 `bootstrap/app.php` 文件配置并加载：

```php
<?php

use Illuminate\Foundation\Application;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )->create();
```

不过，有时你可能想定义一个全新的文件来承载应用中的一部分路由。为此，可以向 `withRouting` 方法传入一个 `then` 闭包。在这个闭包内，你可以注册应用所需的任何额外路由：

```php
use Illuminate\Support\Facades\Route;

->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
    then: function () {
        Route::middleware('api')
            ->prefix('webhooks')
            ->name('webhooks.')
            ->group(base_path('routes/webhooks.php'));
    },
)
```

或者，你甚至可以通过向 `withRouting` 方法传入一个 `using` 闭包，完全掌控路由注册。传入该参数后，框架不会注册任何 HTTP 路由，你需要手动注册所有路由：

```php
use Illuminate\Support\Facades\Route;

->withRouting(
    commands: __DIR__.'/../routes/console.php',
    using: function () {
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    },
)
```

<a name="route-parameters"></a>
## 路由参数

<a name="required-parameters"></a>
### 必需参数

有时你需要在路由中捕获 URI 的某些片段。例如，你可能需要从 URL 中捕获用户 ID。为此可以定义路由参数：

```php
Route::get('/user/{id}', function (string $id) {
    return 'User '.$id;
});
```

你可以根据路由需要定义任意数量的路由参数：

```php
Route::get('/posts/{post}/comments/{comment}', function (string $postId, string $commentId) {
    // ...
});
```

路由参数始终用 `{}` 花括号包裹，并且应由字母字符组成。路由参数名称中也可以使用下划线（`_`）。路由参数会按顺序注入路由回调／控制器——路由回调／控制器参数的名字并不重要。

<a name="parameters-and-dependency-injection"></a>
#### 参数与依赖注入

如果你的路由有依赖项，希望 Laravel 服务容器把它们自动注入路由回调中，就应当把路由参数列在依赖项之后：

```php
use Illuminate\Http\Request;

Route::get('/user/{id}', function (Request $request, string $id) {
    return 'User '.$id;
});
```

<a name="parameters-optional-parameters"></a>
### 可选参数

偶尔你可能需要指定一个不一定总出现在 URI 中的路由参数。为此，可以在参数名后加上一个 `?` 标记。请务必为路由中对应的变量给出默认值：

```php
Route::get('/user/{name?}', function (?string $name = null) {
    return $name;
});

Route::get('/user/{name?}', function (?string $name = 'John') {
    return $name;
});
```

<a name="parameters-regular-expression-constraints"></a>
### 正则表达式约束

你可以使用路由实例上的 `where` 方法来约束路由参数的格式。`where` 方法接受参数名称和一个定义该参数应如何被约束的正则表达式：

```php
Route::get('/user/{name}', function (string $name) {
    // ...
})->where('name', '[A-Za-z]+');

Route::get('/user/{id}', function (string $id) {
    // ...
})->where('id', '[0-9]+');

Route::get('/user/{id}/{name}', function (string $id, string $name) {
    // ...
})->where(['id' => '[0-9]+', 'name' => '[a-z]+']);
```

为方便起见，一些常用的正则表达式模式提供了辅助方法，让你能够快速为路由添加模式约束：

```php
Route::get('/user/{id}/{name}', function (string $id, string $name) {
    // ...
})->whereNumber('id')->whereAlpha('name');

Route::get('/user/{name}', function (string $name) {
    // ...
})->whereAlphaNumeric('name');

Route::get('/user/{id}', function (string $id) {
    // ...
})->whereUuid('id');

Route::get('/user/{id}', function (string $id) {
    // ...
})->whereUlid('id');

Route::get('/category/{category}', function (string $category) {
    // ...
})->whereIn('category', ['movie', 'song', 'painting']);

Route::get('/category/{category}', function (string $category) {
    // ...
})->whereIn('category', CategoryEnum::cases());
```

如果传入的请求与路由模式约束不匹配，将返回 404 HTTP 响应。

<a name="parameters-global-constraints"></a>
#### 全局约束

如果你希望某个路由参数始终受给定正则表达式的约束，可以使用 `pattern` 方法。你应当在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义这些模式：

```php
use Illuminate\Support\Facades\Route;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Route::pattern('id', '[0-9]+');
}
```

模式定义完成后，它会自动应用到所有使用该参数名称的路由上：

```php
Route::get('/user/{id}', function (string $id) {
    // 仅当 {id} 为数字时才会执行...
});
```

<a name="parameters-encoded-forward-slashes"></a>
#### 编码后的正斜杠

Laravel 路由组件允许路由参数值中出现除 `/` 之外的所有字符。你必须使用 `where` 条件正则表达式显式允许 `/` 成为占位符的一部分：

```php
Route::get('/search/{search}', function (string $search) {
    return $search;
})->where('search', '.*');
```

> [!WARNING]
> 编码后的正斜杠仅在最后一个路由片段中受支持。

<a name="named-routes"></a>
## 命名路由

命名路由让你可以便捷地为特定路由生成 URL 或重定向。你可以通过把 `name` 方法链式调用到路由定义上来指定路由名称：

```php
Route::get('/user/profile', function () {
    // ...
})->name('profile');
```

你也可以为控制器操作指定路由名称：

```php
Route::get(
    '/user/profile',
    [UserProfileController::class, 'show']
)->name('profile');
```

> [!WARNING]
> 路由名称应当始终保持唯一。

<a name="generating-urls-to-named-routes"></a>
#### 生成指向命名路由的 URL

为某条路由指定名称后，你就可以在通过 Laravel 的 `route` 和 `redirect` 辅助函数生成 URL 或重定向时使用该路由名称：

```php
// 生成 URL...
$url = route('profile');

// 生成重定向...
return redirect()->route('profile');

return to_route('profile');
```

如果命名路由定义了参数，可以把这些参数作为 `route` 函数的第二个参数传入。给定的参数会自动按正确位置插入生成的 URL 中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1]);
```

如果你在数组中传入额外的参数，这些键／值对会自动被添加到生成 URL 的查询字符串中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1, 'photos' => 'yes']);

// /user/1/profile?photos=yes
```

> [!NOTE]
> 有时你可能希望为 URL 参数指定请求级别的默认值，例如当前语言区域。为此，可以使用 [`URL::defaults` 方法](/docs/{{version}}/urls#default-values)。

<a name="inspecting-the-current-route"></a>
#### 检查当前路由

如果你想确定当前请求是否被路由到某个命名路由，可以在路由实例上使用 `named` 方法。例如，你可以在路由中间件中检查当前的路由名称：

```php
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 处理传入的请求。
 *
 * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
 */
public function handle(Request $request, Closure $next): Response
{
    if ($request->route()->named('profile')) {
        // ...
    }

    return $next($request);
}
```

<a name="route-groups"></a>
## 路由组

路由组让你可以在大量路由之间共享路由属性（例如中间件），而无需在每条单独的路由上定义这些属性。

嵌套组会尝试智能地与父组「合并」属性。中间件和 `where` 条件会被合并，而名称和前缀会被追加。命名空间分隔符以及 URI 前缀中的斜杠会在合适的位置自动添加。

<a name="route-group-middleware"></a>
### 中间件

要为组内所有路由分配[中间件](/docs/{{version}}/middleware)，可以在定义组之前使用 `middleware` 方法。中间件会按它们在数组中列出的顺序执行：

```php
Route::middleware(['first', 'second'])->group(function () {
    Route::get('/', function () {
        // 使用 first 与 second 中间件...
    });

    Route::get('/user/profile', function () {
        // 使用 first 与 second 中间件...
    });
});
```

<a name="route-group-controllers"></a>
### 控制器

如果一组路由都使用同一个[控制器](/docs/{{version}}/controllers)，可以使用 `controller` 方法为组内所有路由定义公共控制器。之后定义路由时，只需提供它们调用的控制器方法：

```php
use App\Http\Controllers\OrderController;

Route::controller(OrderController::class)->group(function () {
    Route::get('/orders/{id}', 'show');
    Route::post('/orders', 'store');
});
```

<a name="route-group-subdomain-routing"></a>
### 子域名路由

路由组也可以用来处理子域名路由。子域名可以像路由 URI 一样被赋予路由参数，让你能够捕获子域名的一部分用于路由或控制器。可以通过在定义组之前调用 `domain` 方法来指定子域名：

```php
Route::domain('{account}.example.com')->group(function () {
    Route::get('/user/{id}', function (string $account, string $id) {
        // ...
    });
});
```

> [!WARNING]
> 为确保你的子域名路由可以被访问，你应当先注册子域名路由，再注册根域名路由。这样可以防止根域名路由覆盖具有相同 URI 路径的子域名路由。

<a name="route-group-prefixes"></a>
### 路由前缀

`prefix` 方法可用于给组内每条路由加上给定的 URI 前缀。例如，你可能想给组内所有路由 URI 加上 `admin` 前缀：

```php
Route::prefix('admin')->group(function () {
    Route::get('/users', function () {
        // 匹配 "/admin/users" URL
    });
});
```

<a name="route-group-name-prefixes"></a>
### 路由名称前缀

`name` 方法可用于给组内每个路由名称加上给定字符串前缀。例如，你可能想给组内所有路由名称加上 `admin` 前缀。给定字符串会按原样添加到路由名称之前，因此请务必在前缀中提供末尾的 `.` 字符：

```php
Route::name('admin.')->group(function () {
    Route::get('/users', function () {
        // 被分配的路由名称为 "admin.users"...
    })->name('users');
});
```

<a name="route-model-binding"></a>
## 路由模型绑定

向路由或控制器操作注入模型 ID 时，你通常需要查询数据库来获取与该 ID 对应的模型。Laravel 的路由模型绑定提供了一种便捷方式，可以把模型实例直接自动注入你的路由。例如，你可以注入与给定 ID 匹配的整个 `User` 模型实例，而不是注入用户 ID。

<a name="implicit-binding"></a>
### 隐式绑定

Laravel 会自动解析路由或控制器操作中定义的 Eloquent 模型，只要其类型提示的变量名与某个路由片段名称匹配。例如：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
});
```

由于 `$user` 变量的类型提示是 `App\Models\User` Eloquent 模型，且变量名与 `{user}` URI 片段匹配，Laravel 会自动注入 ID 与请求 URI 中相应值匹配的模型实例。如果在数据库中未找到匹配的模型实例，将自动生成 404 HTTP 响应。

当然，使用控制器方法时也可以进行隐式绑定。再次注意，`{user}` URI 片段与控制器中的 `$user` 变量匹配，后者包含 `App\Models\User` 类型提示：

```php
use App\Http\Controllers\UserController;
use App\Models\User;

// 路由定义...
Route::get('/users/{user}', [UserController::class, 'show']);

// 控制器方法定义...
public function show(User $user)
{
    return view('user.profile', ['user' => $user]);
}
```

<a name="implicit-soft-deleted-models"></a>
#### 软删除模型

通常情况下，隐式模型绑定不会获取已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型。不过，你可以通过把 `withTrashed` 方法链式调用到路由定义上，指示隐式绑定去获取这些模型：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
})->withTrashed();
```

<a name="customizing-the-default-key-name"></a>
#### 自定义键

有时你可能希望使用 `id` 之外的列来解析 Eloquent 模型。为此，可以在路由参数定义中指定该列：

```php
use App\Models\Post;

Route::get('/posts/{post:slug}', function (Post $post) {
    return $post;
});
```

如果你希望模型绑定在获取某个模型类时始终使用 `id` 之外的数据库列，可以在 Eloquent 模型上覆盖 `getRouteKeyName` 方法：

```php
/**
 * 获取该模型的路由键。
 */
public function getRouteKeyName(): string
{
    return 'slug';
}
```

<a name="implicit-model-binding-scoping"></a>
#### 自定义键与作用域限定

在单条路由定义中隐式绑定多个 Eloquent 模型时，你可能希望对第二个 Eloquent 模型加以限定，使它必须是前一个 Eloquent 模型的子项。例如，考虑下面这条按 slug 获取某个特定用户博客文章的路由定义：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
});
```

把带自定义键的隐式绑定作为嵌套路由参数使用时，Laravel 会自动按父模型限定查询范围，以获取嵌套模型，并按约定猜测父模型上的关联名称。这种情况下，会假定 `User` 模型有一个名为 `posts` 的关联（路由参数名的复数形式），可用于获取 `Post` 模型。

如果需要，即使没有提供自定义键，你也可以指示 Laravel 对「子」绑定进行范围限定。为此，可以在定义路由时调用 `scopeBindings` 方法：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

或者，你也可以指示整组路由定义都使用限定范围的绑定：

```php
Route::scopeBindings()->group(function () {
    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    });
});
```

类似地，你也可以调用 `withoutScopedBindings` 方法，显式指示 Laravel 不要对绑定进行范围限定：

```php
Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
})->withoutScopedBindings();
```

<a name="customizing-missing-model-behavior"></a>
#### 自定义模型缺失行为

通常情况下，如果找不到隐式绑定的模型，会生成 404 HTTP 响应。不过，你可以在定义路由时调用 `missing` 方法来自定义该行为。`missing` 方法接受一个闭包，当找不到隐式绑定的模型时该闭包会被调用：

```php
use App\Http\Controllers\LocationsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::get('/locations/{location:slug}', [LocationsController::class, 'show'])
    ->name('locations.view')
    ->missing(function (Request $request) {
        return Redirect::route('locations.index');
    });
```

<a name="implicit-enum-binding"></a>
### 隐式枚举绑定

PHP 8.1 引入了对[枚举](https://www.php.net/manual/en/language.enumerations.backed.php)的支持。为了补充这一特性，Laravel 允许你在路由定义中对[字符串支持的枚举](https://www.php.net/manual/en/language.enumerations.backed.php)做类型提示，只有当该路由片段对应一个有效的枚举值时，Laravel 才会调用该路由。否则，将自动返回 404 HTTP 响应。例如，给定下面这个枚举：

```php
<?php

namespace App\Enums;

enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

你可以定义一条只有当 `{category}` 路由片段为 `fruits` 或 `people` 时才会被调用的路由。否则，Laravel 将返回 404 HTTP 响应：

```php
use App\Enums\Category;
use Illuminate\Support\Facades\Route;

Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

<a name="explicit-binding"></a>
### 显式绑定

使用模型绑定并不要求你必须使用 Laravel 基于约定的隐式模型解析。你也可以显式定义路由参数如何与模型对应。要注册显式绑定，使用路由器的 `model` 方法为给定参数指定类。你应当在 `AppServiceProvider` 类的 `boot` 方法开头定义显式模型绑定：

```php
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Route::model('user', User::class);
}
```

接下来，定义一条包含 `{user}` 参数的路由：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    // ...
});
```

由于我们已把所有 `{user}` 参数绑定到 `App\Models\User` 模型，该类的实例就会被注入路由。因此，例如，对 `users/1` 的请求会注入数据库中 ID 为 `1` 的 `User` 实例。

如果在数据库中未找到匹配的模型实例，将自动生成 404 HTTP 响应。

<a name="customizing-the-resolution-logic"></a>
#### 自定义解析逻辑

如果你想定义自己的模型绑定解析逻辑，可以使用 `Route::bind` 方法。你传给 `bind` 方法的闭包会接收到该 URI 片段的值，并应返回应当注入路由的类实例。同样，这一自定义应当放在应用 `AppServiceProvider` 的 `boot` 方法中：

```php
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Route::bind('user', function (string $value) {
        return User::where('name', $value)->firstOrFail();
    });
}
```

此外，你还可以在 Eloquent 模型上覆盖 `resolveRouteBinding` 方法。该方法会接收到该 URI 片段的值，并应返回应当注入路由的类实例：

```php
/**
 * 获取绑定值对应的模型。
 *
 * @param  mixed  $value
 * @param  string|null  $field
 * @return \Illuminate\Database\Eloquent\Model|null
 */
public function resolveRouteBinding($value, $field = null)
{
    return $this->where('name', $value)->firstOrFail();
}
```

如果某条路由使用了[隐式绑定范围限定](#implicit-model-binding-scoping)，则会使用 `resolveChildRouteBinding` 方法来解析父模型的子绑定：

```php
/**
 * 获取绑定值对应的子模型。
 *
 * @param  string  $childType
 * @param  mixed  $value
 * @param  string|null  $field
 * @return \Illuminate\Database\Eloquent\Model|null
 */
public function resolveChildRouteBinding($childType, $value, $field)
{
    return parent::resolveChildRouteBinding($childType, $value, $field);
}
```

<a name="fallback-routes"></a>
## 回退路由

使用 `Route::fallback` 方法，你可以定义一条当没有其它路由匹配传入请求时执行的路由。通常情况下，未处理的请求会自动通过应用的异常处理器渲染「404」页面。不过，由于你通常会在 `routes/web.php` 文件中定义 `fallback` 路由，因此 `web` 中间件组中的所有中间件都会应用到该路由。你可以按需为该路由添加额外的中间件：

```php
Route::fallback(function () {
    // ...
});
```

<a name="rate-limiting"></a>
## 速率限制

<a name="defining-rate-limiters"></a>
### 定义速率限制器

Laravel 内置了强大且可定制的速率限制服务，你可以利用它限制某个路由或某组路由的流量。要开始使用，你应当定义符合你应用需求的速率限制器配置。

速率限制器可以在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任何应用服务。
 */
protected function boot(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```

速率限制器使用 `RateLimiter` Facade 的 `for` 方法定义。该方法接受一个速率限制器名称，以及一个返回限制配置的闭包，该配置会应用到被分配到该速率限制器的路由上。限制配置是 `Illuminate\Cache\RateLimiting\Limit` 类的实例。这个类包含便捷的「构建器」方法，让你能够快速定义限制。速率限制器名称可以是你想要的任意字符串：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任何应用服务。
 */
protected function boot(): void
{
    RateLimiter::for('global', function (Request $request) {
        return Limit::perMinute(1000);
    });
}
```

如果传入的请求超出指定的速率限制，Laravel 会自动返回一个状态码为 429 的 HTTP 响应。如果你想定义自己的速率限制响应，可以使用 `response` 方法：

```php
RateLimiter::for('global', function (Request $request) {
    return Limit::perMinute(1000)->response(function (Request $request, array $headers) {
        return response('Custom response...', 429, $headers);
    });
});
```

由于速率限制器回调会接收到传入的 HTTP 请求实例，你可以根据传入请求或已认证用户动态构建合适的速率限制：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
        ? Limit::none()
        : Limit::perMinute(100);
});
```

<a name="segmenting-rate-limits"></a>
#### 对速率限制进行分段

有时你可能希望按某个任意值对速率限制进行分段。例如，你可能希望每个 IP 地址每分钟可以访问某条路由 100 次。为此，可以在构建速率限制时使用 `by` 方法：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
        ? Limit::none()
        : Limit::perMinute(100)->by($request->ip());
});
```

再用另一个示例来说明这一特性，我们可以把访问该路由的频率限制为：每个已认证用户 ID 每分钟 100 次，或每位访客按 IP 地址每分钟 10 次：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(100)->by($request->user()->id)
        : Limit::perMinute(10)->by($request->ip());
});
```

<a name="multiple-rate-limits"></a>
#### 多个速率限制

如有需要，你可以为某个速率限制器配置返回一组速率限制。每条速率限制会按它们在数组中的放置顺序针对该路由进行评估：

```php
RateLimiter::for('login', function (Request $request) {
    return [
        Limit::perMinute(500),
        Limit::perMinute(3)->by($request->input('email')),
    ];
});
```

如果你要分配多条按相同 `by` 值分段的速率限制，应确保每个 `by` 值都是唯一的。最简单的做法是给传给 `by` 方法的值加上前缀：

```php
RateLimiter::for('uploads', function (Request $request) {
    return [
        Limit::perMinute(10)->by('minute:'.$request->user()->id),
        Limit::perDay(1000)->by('day:'.$request->user()->id),
    ];
});
```

<a name="attaching-rate-limiters-to-routes"></a>
### 把速率限制器附加到路由

可以使用 `throttle` [中间件](/docs/{{version}}/middleware)把速率限制器附加到路由或路由组上。throttle 中间件接受你希望分配给该路由的速率限制器名称：

```php
Route::middleware(['throttle:uploads'])->group(function () {
    Route::post('/audio', function () {
        // ...
    });

    Route::post('/video', function () {
        // ...
    });
});
```

<a name="throttling-with-redis"></a>
#### 使用 Redis 进行限流

默认情况下，`throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequests` 类。不过，如果你使用 Redis 作为应用的缓存驱动，你可能希望指示 Laravel 使用 Redis 管理速率限制。为此，应在应用 `bootstrap/app.php` 文件中使用 `throttleWithRedis` 方法。该方法会把 `throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` 中间件类：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->throttleWithRedis();
    // ...
})
```

<a name="form-method-spoofing"></a>
## 表单方法伪装

HTML 表单不支持 `PUT`、`PATCH` 或 `DELETE` 操作。因此，当你定义由 HTML 表单调用的 `PUT`、`PATCH` 或 `DELETE` 路由时，需要在表单中添加一个隐藏的 `_method` 字段。随 `_method` 字段发送的值将被用作 HTTP 请求方法：

```blade
<form action="/example" method="POST">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
</form>
```

为方便起见，你可以使用 `@method` [Blade 指令](/docs/{{version}}/blade)生成 `_method` 输入字段：

```blade
<form action="/example" method="POST">
    @method('PUT')
    @csrf
</form>
```

<a name="accessing-the-current-route"></a>
## 访问当前路由

你可以使用 `Route` Facade 上的 `current`、`currentRouteName` 和 `currentRouteAction` 方法，访问处理传入请求的路由的相关信息：

```php
use Illuminate\Support\Facades\Route;

$route = Route::current(); // Illuminate\Routing\Route
$name = Route::currentRouteName(); // string
$action = Route::currentRouteAction(); // string
```

你可以查阅 [Route Facade 底层类](https://laravel.com/api/{{version}}/Illuminate/Routing/Router.html)和[路由实例](https://laravel.com/api/{{version}}/Illuminate/Routing/Route.html)的 API 文档，了解路由器和路由类上可用的全部方法。

<a name="cors"></a>
## 跨域资源共享（CORS）

Laravel 可以自动响应 CORS `OPTIONS` HTTP 请求，并使用你配置的值。该 `OPTIONS` 请求会自动由 `HandleCors` [中间件](/docs/{{version}}/middleware)处理，该中间件已自动包含在应用的全局中间件栈中。

有时你可能需要为应用定制 CORS 配置值。为此，可以使用 `config:publish` Artisan 命令发布 `cors` 配置文件：

```shell
php artisan config:publish cors
```

该命令会把 `cors.php` 配置文件放到应用的 `config` 目录中。

> [!NOTE]
> 关于 CORS 和 CORS 响应头的更多信息，请查阅 [MDN 关于 CORS 的 Web 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers)。

<a name="route-caching"></a>
## 路由缓存

把应用部署到生产环境时，你应当充分利用 Laravel 的路由缓存。使用路由缓存会大幅缩短注册应用全部路由所需的时间。要生成路由缓存，执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

运行该命令后，缓存的路由文件会在每次请求时被加载。请记住，如果你添加了任何新路由，就需要重新生成路由缓存。因此，你只应在项目部署期间运行 `route:cache` 命令。

你可以使用 `route:clear` 命令清除路由缓存：

```shell
php artisan route:clear
```
