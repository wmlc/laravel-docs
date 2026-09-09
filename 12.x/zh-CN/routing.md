# 路由

- [基础路由](#basic-routing)
    - [默认路由文件](#the-default-route-files)
    - [重定向路由](#redirect-routes)
    - [视图路由](#view-routes)
    - [列出你的路由](#listing-your-routes)
    - [路由自定义](#routing-customization)
- [路由参数](#route-parameters)
    - [必选参数](#required-parameters)
    - [可选参数](#parameters-optional-parameters)
    - [正则表达式约束](#parameters-regular-expression-constraints)
- [命名路由](#named-routes)
- [路由分组](#route-groups)
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
- [限流](#rate-limiting)
    - [定义限流器](#defining-rate-limiters)
    - [将限流器附加到路由](#attaching-rate-limiters-to-routes)
- [表单方法伪造](#form-method-spoofing)
- [访问当前路由](#accessing-the-current-route)
- [跨源资源共享（CORS）](#cors)
- [路由缓存](#route-caching)

<a name="basic-routing"></a>
## 基础路由

最简单的 Laravel 路由接受一个 URI 和一个闭包，提供了一种非常简单、富有表现力的方式来定义路由和行为，而无需复杂的路由配置文件：

```php
use Illuminate\Support\Facades\Route;

Route::get('/greeting', function () {
    return 'Hello World';
});
```

<a name="the-default-route-files"></a>
### 默认路由文件

所有 Laravel 路由都定义在路由文件中，这些文件位于 `routes` 目录下。Laravel 会使用应用的 `bootstrap/app.php` 文件中指定的配置自动加载这些文件。`routes/web.php` 文件定义用于 Web 界面的路由。这些路由被分配了 `web` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)，该组提供了会话状态和 CSRF 保护等功能。

对大多数应用而言，你会从在 `routes/web.php` 文件中定义路由开始。`routes/web.php` 中定义的路由，可以通过在浏览器中输入所定义路由的 URL 来访问。例如，你可以在浏览器中访问 `http://example.com/user` 来访问以下路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user', [UserController::class, 'index']);
```

<a name="api-routes"></a>
#### API 路由

如果你的应用还需要提供无状态 API，可以使用 `install:api` Artisan 命令启用 API 路由：

```shell
php artisan install:api
```

`install:api` 命令会安装 [Laravel Sanctum](/docs/{{version}}/sanctum)，它提供了一个强大而简单的 API 令牌认证守卫，可用于认证第三方 API 使用者、SPA 或移动应用。此外，`install:api` 命令还会创建 `routes/api.php` 文件：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

当然，对于需要公开访问的路由，你可以自由地省略 `auth:sanctum` 中间件。

`routes/api.php` 中的路由是无状态的，并被分配到 `api` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)。此外，这些路由会自动应用 `/api` URI 前缀，因此你无需手动为文件中的每个路由添加前缀。你可以通过修改应用的 `bootstrap/app.php` 文件来更改前缀：

```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'api/admin',
    // ...
)
```

<a name="available-router-methods"></a>
#### 可用的路由器方法

路由器允许你注册响应任何 HTTP 动词（verb）的路由：

```php
Route::get($uri, $callback);
Route::post($uri, $callback);
Route::put($uri, $callback);
Route::patch($uri, $callback);
Route::delete($uri, $callback);
Route::options($uri, $callback);
```

有时你可能需要注册响应多个 HTTP 动词的路由，可以使用 `match` 方法来实现。甚至，你还可以使用 `any` 方法注册响应所有 HTTP 动词的路由：

```php
Route::match(['get', 'post'], '/', function () {
    // ...
});

Route::any('/', function () {
    // ...
});
```

> [!NOTE]
> 当定义多个共享同一 URI 的路由时，使用 `get`、`post`、`put`、`patch`、`delete` 和 `options` 方法的路由，应当在 `any`、`match` 和 `redirect` 方法的路由之前定义。这样可以确保传入请求匹配到正确的路由。

<a name="dependency-injection"></a>
#### 依赖注入

你可以在路由的回调签名中，对路由所需的任何依赖进行类型提示。Laravel [服务容器](/docs/{{version}}/container)会自动解析声明的依赖并注入到回调中。例如，你可以对 `Illuminate\Http\Request` 类进行类型提示，让当前的 HTTP 请求自动注入到路由回调中：

```php
use Illuminate\Http\Request;

Route::get('/users', function (Request $request) {
    // ...
});
```

<a name="csrf-protection"></a>
#### CSRF 保护

请记住，任何指向 `web` 路由文件中定义的 `POST`、`PUT`、`PATCH` 或 `DELETE` 路由的 HTML 表单，都应当包含 CSRF 令牌字段。否则，请求将被拒绝。你可以在 [CSRF 文档](/docs/{{version}}/csrf)中阅读更多关于 CSRF 保护的内容：

```blade
<form method="POST" action="/profile">
    @csrf
    ...
</form>
```

<a name="redirect-routes"></a>
### 重定向路由

如果你要定义一个重定向到另一个 URI 的路由，可以使用 `Route::redirect` 方法。该方法提供了一个便捷的快捷方式，这样你就无需为执行一个简单的重定向而定义完整的路由或控制器：

```php
Route::redirect('/here', '/there');
```

默认情况下，`Route::redirect` 返回 `302` 状态码。你可以使用可选的第三个参数自定义状态码：

```php
Route::redirect('/here', '/there', 301);
```

或者，你可以使用 `Route::permanentRedirect` 方法返回 `301` 状态码：

```php
Route::permanentRedirect('/here', '/there');
```

> [!WARNING]
> 在重定向路由中使用路由参数时，以下参数已被 Laravel 保留，不能使用：`destination` 和 `status`。

<a name="view-routes"></a>
### 视图路由

如果你的路由只需返回一个[视图](/docs/{{version}}/views)，可以使用 `Route::view` 方法。与 `redirect` 方法一样，该方法提供了一个简单的快捷方式，这样你就无需定义完整的路由或控制器。`view` 方法接受 URI 作为第一个参数，视图名称作为第二个参数。此外，你还可以提供一个数据数组作为可选的第三个参数，传递给视图：

```php
Route::view('/welcome', 'welcome');

Route::view('/welcome', 'welcome', ['name' => 'Taylor']);
```

> [!WARNING]
> 在视图路由中使用路由参数时，以下参数已被 Laravel 保留，不能使用：`view`、`data`、`status` 和 `headers`。

<a name="listing-your-routes"></a>
### 列出你的路由

`route:list` Artisan 命令可以轻松提供应用定义的所有路由的概览：

```shell
php artisan route:list
```

默认情况下，分配给每个路由的路由中间件不会显示在 `route:list` 的输出中；不过，你可以通过在命令中添加 `-v` 选项，让 Laravel 显示路由中间件和中间件组名称：

```shell
php artisan route:list -v

# 展开中间件组...
php artisan route:list -vv
```

你还可以让 Laravel 只显示以指定 URI 开头的路由：

```shell
php artisan route:list --path=api
```

此外，在执行 `route:list` 命令时，你可以通过提供 `--except-vendor` 选项，让 Laravel 隐藏由第三方扩展包定义的路由：

```shell
php artisan route:list --except-vendor
```

类似地，你还可以通过提供 `--only-vendor` 选项，让 Laravel 只显示由第三方扩展包定义的路由：

```shell
php artisan route:list --only-vendor
```

<a name="routing-customization"></a>
### 路由自定义

默认情况下，应用的路由由 `bootstrap/app.php` 文件配置和加载：

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

不过，有时你可能想定义一个全新的文件来存放应用路由的一个子集。为此，你可以向 `withRouting` 方法提供一个 `then` 闭包。在这个闭包中，你可以注册应用所需的任何额外路由：

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

或者，你甚至可以通过向 `withRouting` 方法提供一个 `using` 闭包，来完全掌控路由注册。传递该参数时，框架不会注册任何 HTTP 路由，你需要自行手动注册所有路由：

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
### 必选参数

有时你需要在路由中捕获 URI 的某些片段。例如，你可能需要从 URL 中捕获用户的 ID。你可以通过定义路由参数来实现：

```php
Route::get('/user/{id}', function (string $id) {
    return 'User '.$id;
});
```

你可以根据路由的需要定义任意数量的路由参数：

```php
Route::get('/posts/{post}/comments/{comment}', function (string $postId, string $commentId) {
    // ...
});
```

路由参数始终包含在 `{}` 花括号中，且应由字母字符组成。路由参数名中也允许使用下划线（`_`）。路由参数按其顺序注入到路由回调 / 控制器中，路由回调 / 控制器参数的名称并不重要。

<a name="parameters-and-dependency-injection"></a>
#### 参数与依赖注入

如果你的路由有希望由 Laravel 服务容器自动注入到路由回调中的依赖，你应当将路由参数列在依赖之后：

```php
use Illuminate\Http\Request;

Route::get('/user/{id}', function (Request $request, string $id) {
    return 'User '.$id;
});
```

<a name="parameters-optional-parameters"></a>
### 可选参数

有时你可能需要指定一个并不总是出现在 URI 中的路由参数。你可以在参数名后面加上 `?` 标记来实现。请确保为路由对应的变量提供一个默认值：

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

你可以使用路由实例上的 `where` 方法来约束路由参数的格式。`where` 方法接受参数名和定义该参数约束方式的正则表达式：

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

为了方便起见，一些常用的正则表达式模式已经有了辅助方法，让你可以快速为路由添加模式约束：

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

如果传入请求与路由模式约束不匹配，将返回 404 HTTP 响应。

<a name="parameters-global-constraints"></a>
#### 全局约束

如果你希望某个路由参数始终受指定正则表达式的约束，可以使用 `pattern` 方法。你应当在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义这些模式：

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

一旦定义了模式，它就会自动应用到使用该参数名的所有路由上：

```php
Route::get('/user/{id}', function (string $id) {
    // 只有当 {id} 为数字时才会执行...
});
```

<a name="parameters-encoded-forward-slashes"></a>
#### 编码的正斜杠

Laravel 路由组件允许路由参数值中出现除 `/` 之外的所有字符。你必须使用 `where` 条件正则表达式，显式允许 `/` 作为占位符的一部分：

```php
Route::get('/search/{search}', function (string $search) {
    return $search;
})->where('search', '.*');
```

> [!WARNING]
> 编码的正斜杠只在路由的最后一个分段中受支持。

<a name="named-routes"></a>
## 命名路由

命名路由允许为特定路由便捷地生成 URL 或重定向。你可以通过将 `name` 方法链式调用到路由定义上，为路由指定一个名称：

```php
Route::get('/user/profile', function () {
    // ...
})->name('profile');
```

你也可以为控制器动作指定路由名称：

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

为指定路由分配名称后，你就可以在通过 Laravel 的 `route` 和 `redirect` 辅助函数生成 URL 或重定向时，使用该路由的名称：

```php
// 生成 URL...
$url = route('profile');

// 生成重定向...
return redirect()->route('profile');

return to_route('profile');
```

如果命名路由定义了参数，你可以将这些参数作为第二个参数传递给 `route` 函数。给定的参数会自动插入到生成 URL 的正确位置：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1]);
```

如果你在数组中传递了额外的参数，这些键 / 值对会自动添加到生成 URL 的查询字符串中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1, 'photos' => 'yes']);

// http://example.com/user/1/profile?photos=yes
```

> [!NOTE]
> 有时，你可能希望为 URL 参数指定请求范围内的默认值，例如当前的语言区域。为此，你可以使用 [URL::defaults 方法](/docs/{{version}}/urls#default-values)。

<a name="inspecting-the-current-route"></a>
#### 检查当前路由

如果你想确定当前请求是否被路由到了指定的命名路由，可以使用 Route 实例上的 `named` 方法。例如，你可以在路由中间件中检查当前路由的名称：

```php
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 处理传入请求。
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
## 路由分组

路由分组允许你在大量路由之间共享路由属性（例如中间件），而无需在每个单独的路由上定义这些属性。

嵌套的分组会尝试智能地与其父分组「合并」属性。中间件和 `where` 条件会被合并，而名称和前缀则会被追加。URI 前缀中的命名空间分隔符和斜杠会在适当的位置自动添加。

<a name="route-group-middleware"></a>
### 中间件

要为分组内的所有路由分配[中间件](/docs/{{version}}/middleware)，你可以在定义分组之前使用 `middleware` 方法。中间件按其在数组中列出的顺序执行：

```php
Route::middleware(['first', 'second'])->group(function () {
    Route::get('/', function () {
        // 使用 first 和 second 中间件...
    });

    Route::get('/user/profile', function () {
        // 使用 first 和 second 中间件...
    });
});
```

<a name="route-group-controllers"></a>
### 控制器

如果一组路由全部使用相同的[控制器](/docs/{{version}}/controllers)，你可以使用 `controller` 方法为分组内的所有路由定义共同的控制器。这样，在定义路由时，你只需提供它们调用的控制器方法：

```php
use App\Http\Controllers\OrderController;

Route::controller(OrderController::class)->group(function () {
    Route::get('/orders/{id}', 'show');
    Route::post('/orders', 'store');
});
```

<a name="route-group-subdomain-routing"></a>
### 子域名路由

路由分组也可用于处理子域名路由。子域名可以像路由 URI 一样被分配路由参数，让你能够捕获子域名的一部分，供路由或控制器使用。可以在定义分组之前调用 `domain` 方法来指定子域名：

```php
Route::domain('{account}.example.com')->group(function () {
    Route::get('/user/{id}', function (string $account, string $id) {
        // ...
    });
});
```

> [!WARNING]
> 为了确保你的子域名路由可以访问，你应当在注册根域名路由之前注册子域名路由。这样可以防止根域名路由覆盖具有相同 URI 路径的子域名路由。

<a name="route-group-prefixes"></a>
### 路由前缀

可以使用 `prefix` 方法为分组中的每个路由添加指定的 URI 前缀。例如，你可能希望为分组内的所有路由 URI 加上 `admin` 前缀：

```php
Route::prefix('admin')->group(function () {
    Route::get('/users', function () {
        // 匹配 "/admin/users" URL
    });
});
```

<a name="route-group-name-prefixes"></a>
### 路由名称前缀

可以使用 `name` 方法为分组中的每个路由名称添加指定的字符串前缀。例如，你可能希望为分组内所有路由的名称加上 `admin` 前缀。给定的字符串会完全按照指定的形式加到路由名称前面，因此我们要确保在前缀中提供末尾的 `.` 字符：

```php
Route::name('admin.')->group(function () {
    Route::get('/users', function () {
        // 路由被分配名称 "admin.users"...
    })->name('users');
});
```

<a name="route-model-binding"></a>
## 路由模型绑定

向路由或控制器动作注入模型 ID 时，你通常需要查询数据库来检索与该 ID 对应的模型。Laravel 路由模型绑定提供了一种便捷的方式，将模型实例直接自动注入到路由中。例如，你可以注入与指定 ID 匹配的整个 `User` 模型实例，而不是注入用户的 ID。

<a name="implicit-binding"></a>
### 隐式绑定

Laravel 会自动解析在路由或控制器动作中定义的、类型提示的变量名与路由分段名相匹配的 Eloquent 模型。例如：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
});
```

由于 `$user` 变量的类型提示为 `App\Models\User` Eloquent 模型，且变量名与 `{user}` URI 分段匹配，Laravel 会自动注入 ID 与请求 URI 中对应值相匹配的模型实例。如果在数据库中没有找到匹配的模型实例，将自动生成 404 HTTP 响应。

当然，使用控制器方法时也可以进行隐式绑定。再次注意，`{user}` URI 分段与控制器中包含 `App\Models\User` 类型提示的 `$user` 变量相匹配：

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

通常，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型。不过，你可以通过将 `withTrashed` 方法链式调用到路由定义上，指示隐式绑定检索这些模型：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
})->withTrashed();
```

<a name="customizing-the-default-key-name"></a>
#### 自定义键名

有时你可能希望使用 `id` 以外的列来解析 Eloquent 模型。为此，你可以在路由参数定义中指定该列：

```php
use App\Models\Post;

Route::get('/posts/{post:slug}', function (Post $post) {
    return $post;
});
```

如果你希望模型绑定在检索指定模型类时，始终使用 `id` 以外的数据库列，可以在 Eloquent 模型上重写 `getRouteKeyName` 方法：

```php
/**
 * 获取模型的路由键。
 */
public function getRouteKeyName(): string
{
    return 'slug';
}
```

<a name="implicit-model-binding-scoping"></a>
#### 自定义键与作用域

在单个路由定义中隐式绑定多个 Eloquent 模型时，你可能希望对第二个 Eloquent 模型进行作用域限制，使其必须是前一个 Eloquent 模型的子级。例如，考虑下面这个为指定用户按 slug 检索博客文章的路由定义：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
});
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动通过约定来猜测父模型上的关联名称，从而将查询限定为通过其父级检索嵌套模型。在本例中，将假定 `User` 模型有一个名为 `posts`（路由参数名的复数形式）的关联，可用于检索 `Post` 模型。

如果你愿意，即使没有提供自定义键，你也可以指示 Laravel 对「子级」绑定进行作用域限制。为此，你可以在定义路由时调用 `scopeBindings` 方法：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

或者，你可以指示一整组路由定义使用作用域绑定：

```php
Route::scopeBindings()->group(function () {
    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    });
});
```

类似地，你也可以通过调用 `withoutScopedBindings` 方法，显式指示 Laravel 不对绑定进行作用域限制：

```php
Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
})->withoutScopedBindings();
```

<a name="customizing-missing-model-behavior"></a>
#### 自定义模型缺失行为

通常，如果找不到隐式绑定的模型，将生成 404 HTTP 响应。不过，你可以在定义路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，当找不到隐式绑定的模型时，将调用该闭包：

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

PHP 8.1 引入了对 [Enums](https://www.php.net/manual/en/language.enumerations.backed.php) 的支持。为了配合这一特性，Laravel 允许你在路由定义中对[字符串回退（string-backed）Enum](https://www.php.net/manual/en/language.enumerations.backed.php) 进行类型提示，只有当该路由分段对应一个有效的 Enum 值时，Laravel 才会调用该路由。否则，将自动返回 404 HTTP 响应。例如，给定以下 Enum：

```php
<?php

namespace App\Enums;

enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

你可以定义一个只有当 `{category}` 路由分段为 `fruits` 或 `people` 时才会被调用的路由。否则，Laravel 将返回 404 HTTP 响应：

```php
use App\Enums\Category;
use Illuminate\Support\Facades\Route;

Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

<a name="explicit-binding"></a>
### 显式绑定

使用模型绑定并不要求你使用 Laravel 基于约定的隐式模型解析。你还可以显式定义路由参数与模型的对应关系。要注册显式绑定，可以使用路由器的 `model` 方法为指定参数指定类。你应当在 `AppServiceProvider` 类的 `boot` 方法开头定义显式模型绑定：

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

接下来，定义一个包含 `{user}` 参数的路由：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    // ...
});
```

由于我们已将所有 `{user}` 参数绑定到 `App\Models\User` 模型，该类的实例会被注入到路由中。因此，例如，请求 `users/1` 时，会注入数据库中 ID 为 `1` 的 `User` 实例。

如果在数据库中没有找到匹配的模型实例，将自动生成 404 HTTP 响应。

<a name="customizing-the-resolution-logic"></a>
#### 自定义解析逻辑

如果你想定义自己的模型绑定解析逻辑，可以使用 `Route::bind` 方法。传递给 `bind` 方法的闭包会接收 URI 分段的值，并应返回应注入到路由中的类实例。同样，这种自定义应当在应用的 `AppServiceProvider` 的 `boot` 方法中进行：

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

或者，你也可以在 Eloquent 模型上重写 `resolveRouteBinding` 方法。该方法会接收 URI 分段的值，并应返回应注入到路由中的类实例：

```php
/**
 * 为绑定的值检索模型。
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

如果路由使用了[隐式绑定作用域](#implicit-model-binding-scoping)，`resolveChildRouteBinding` 方法将被用于解析父模型的子级绑定：

```php
/**
 * 为绑定的值检索子模型。
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

使用 `Route::fallback` 方法，你可以定义一个在没有其他路由匹配传入请求时执行的路由。通常，未处理的请求会通过应用的异常处理器自动渲染「404」页面。不过，由于你通常会在 `routes/web.php` 文件中定义 `fallback` 路由，`web` 中间件组中的所有中间件都将应用到该路由上。你可以根据需要自由地为该路由添加额外的中间件：

```php
Route::fallback(function () {
    // ...
});
```

<a name="rate-limiting"></a>
## 限流

<a name="defining-rate-limiters"></a>
### 定义限流器

Laravel 包含功能强大且可自定义的限流服务，你可以用它来限制指定路由或一组路由的流量。开始之前，你应当定义符合应用需求的限流器配置。

限流器可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```

限流器使用 `RateLimiter` facade 的 `for` 方法定义。`for` 方法接受一个限流器名称和一个闭包，该闭包返回应用于分配给该限流器的路由的限额配置。限额配置是 `Illuminate\Cache\RateLimiting\Limit` 类的实例。该类包含有用的「构建器」方法，让你可以快速定义限额。限流器名称可以是你希望的任何字符串：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    RateLimiter::for('global', function (Request $request) {
        return Limit::perMinute(1000);
    });
}
```

如果传入请求超过了指定的限流限额，Laravel 会自动返回带有 429 HTTP 状态码的响应。如果你想定义限流触发时应返回的自定义响应，可以使用 `response` 方法：

```php
RateLimiter::for('global', function (Request $request) {
    return Limit::perMinute(1000)->response(function (Request $request, array $headers) {
        return response('Custom response...', 429, $headers);
    });
});
```

由于限流器回调接收传入的 HTTP 请求实例，你可以根据传入请求或已认证用户动态构建合适的限额：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
        ? Limit::none()
        : Limit::perHour(10);
});
```

<a name="segmenting-rate-limits"></a>
#### 限额分段

有时你可能希望按某个任意值对限额进行分段。例如，你可能希望允许用户每个 IP 地址每分钟访问指定路由 100 次。为此，你可以在构建限额时使用 `by` 方法：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
        ? Limit::none()
        : Limit::perMinute(100)->by($request->ip());
});
```

用另一个例子来说明这个特性：我们可以限制已认证用户按用户 ID 计每分钟访问该路由 100 次，而游客按 IP 地址计每分钟访问 10 次：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(100)->by($request->user()->id)
        : Limit::perMinute(10)->by($request->ip());
});
```

<a name="multiple-rate-limits"></a>
#### 多重限额

如有需要，你可以为指定的限流器配置返回一个限额数组。每个限额都会按其在数组中的排列顺序对该路由进行评估：

```php
RateLimiter::for('login', function (Request $request) {
    return [
        Limit::perMinute(500),
        Limit::perMinute(3)->by($request->input('email')),
    ];
});
```

如果你分配了多个按相同 `by` 值分段的限额，应当确保每个 `by` 值都是唯一的。最简单的实现方式是为传递给 `by` 方法的值添加前缀：

```php
RateLimiter::for('uploads', function (Request $request) {
    return [
        Limit::perMinute(10)->by('minute:'.$request->user()->id),
        Limit::perDay(1000)->by('day:'.$request->user()->id),
    ];
});
```

<a name="response-base-rate-limiting"></a>
#### 基于响应的限流

除了对传入请求进行限流之外，Laravel 还允许你使用 `after` 方法基于响应进行限流。当你只想让某些响应计入限额时，例如验证错误、404 响应或其他特定的 HTTP 状态码，这会很有用。

`after` 方法接受一个接收响应的闭包，如果该响应应计入限额则返回 `true`，应忽略则返回 `false`。这对于通过限制连续的 404 响应来防止枚举攻击，或者允许用户重试验证失败的请求而不耗尽仅应节流成功操作的端点上的限额，特别有用：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

RateLimiter::for('resource-not-found', function (Request $request) {
    return Limit::perMinute(10)
        ->by($request->user()?->id ?: $request->ip())
        ->after(function (Response $response) {
            // 只将 404 响应计入限额，以防止枚举...
            return $response->status() === 404;
        });
});
```

<a name="attaching-rate-limiters-to-routes"></a>
### 将限流器附加到路由

可以使用 `throttle` [中间件](/docs/{{version}}/middleware)将限流器附加到路由或路由分组。throttle 中间件接受你希望分配给该路由的限流器的名称：

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
#### 使用 Redis 进行节流

默认情况下，`throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequests` 类。不过，如果你使用 Redis 作为应用的缓存驱动，可能希望指示 Laravel 使用 Redis 来管理限流。为此，你应当在应用的 `bootstrap/app.php` 文件中使用 `throttleWithRedis` 方法。该方法将 `throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` 中间件类：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->throttleWithRedis();
    // ...
})
```

<a name="form-method-spoofing"></a>
## 表单方法伪造

HTML 表单不支持 `PUT`、`PATCH` 或 `DELETE` 动作。因此，在定义从 HTML 表单调用的 `PUT`、`PATCH` 或 `DELETE` 路由时，你需要在表单中添加一个隐藏的 `_method` 字段。`_method` 字段发送的值将被用作 HTTP 请求方法：

```blade
<form action="/example" method="POST">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
</form>
```

为了方便，你可以使用 `@method` [Blade 指令](/docs/{{version}}/blade)来生成 `_method` 输入字段：

```blade
<form action="/example" method="POST">
    @method('PUT')
    @csrf
</form>
```

<a name="accessing-the-current-route"></a>
## 访问当前路由

你可以使用 `Route` facade 上的 `current`、`currentRouteName` 和 `currentRouteAction` 方法，访问关于处理传入请求的路由的信息：

```php
use Illuminate\Support\Facades\Route;

$route = Route::current(); // Illuminate\Routing\Route
$name = Route::currentRouteName(); // string
$action = Route::currentRouteAction(); // string
```

你可以查阅 [Route facade 底层类](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Router.html)和 [Route 实例](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Route.html)的 API 文档，了解路由器和路由类上所有可用的方法。

<a name="cors"></a>
## 跨源资源共享（CORS）

Laravel 可以使用你配置的值自动响应 CORS `OPTIONS` HTTP 请求。`OPTIONS` 请求将由 `HandleCors` [中间件](/docs/{{version}}/middleware)自动处理，该中间件已自动包含在应用的全局中间件栈中。

有时，你可能需要为应用自定义 CORS 配置值。你可以使用 `config:publish` Artisan 命令发布 `cors` 配置文件来实现：

```shell
php artisan config:publish cors
```

该命令会在应用的 `config` 目录中生成一个 `cors.php` 配置文件。

> [!NOTE]
> 有关 CORS 和 CORS 头的更多信息，请查阅 [MDN Web 文档中关于 CORS 的部分](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers)。

<a name="route-caching"></a>
## 路由缓存

将应用部署到生产环境时，你应当利用 Laravel 的路由缓存。使用路由缓存可以大幅减少注册应用所有路由所需的时间。要生成路由缓存，请执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

运行此命令后，每次请求都会加载你缓存的路由文件。请记住，如果你添加了任何新路由，就需要重新生成路由缓存。因此，你应当只在项目部署期间运行 `route:cache` 命令。

你可以使用 `route:clear` 命令清除路由缓存：

```shell
php artisan route:clear
```
