# 路由

## 基础路由

最简单的 Laravel 路由接受一个 URI 和一个闭包，提供了一种非常简单且富有表现力的方式来定义路由和行为，无需复杂的路由配置文件：

```php
use Illuminate\Support\Facades\Route;

Route::get('/greeting', function () {
    return 'Hello World';
});
```

### 默认路由文件

所有 Laravel 路由都定义在路由文件中，这些文件位于 `routes` 目录下。这些文件由 Laravel 根据 `bootstrap/app.php` 文件中指定的配置自动加载。`routes/web.php` 文件定义了用于 Web 界面的路由。这些路由被分配到 `web` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)，提供会话状态和 CSRF 保护等功能。

对于大多数应用，你会从在 `routes/web.php` 文件中定义路由开始。`routes/web.php` 中定义的路由可以通过在浏览器中输入所定义的路由 URL 来访问。例如，可以通过在浏览器中导航到 `http://example.com/user` 来访问以下路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user', [UserController::class, 'index']);
```

#### API 路由

如果应用还将提供无状态 API，可以使用 `install:api` Artisan 命令启用 API 路由：

```shell
php artisan install:api
```

`install:api` 命令会安装 [Laravel Sanctum](/docs/{{version}}/sanctum)，它提供了强大而简单的 API 令牌身份验证守卫，可用于对第三方 API 消费者、SPA 或移动应用进行身份验证。此外，`install:api` 命令会创建 `routes/api.php` 文件：

```php
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
```

当然，对于那些应公开访问的路由，可以省略 `auth:sanctum` 中间件。

`routes/api.php` 中的路由是无状态的，并被分配到 `api` [中间件组](/docs/{{version}}/middleware#laravels-default-middleware-groups)。此外，`/api` URI 前缀会自动应用到这些路由，因此无需手动为文件中的每个路由应用该前缀。可以通过修改应用的 `bootstrap/app.php` 文件来更改前缀：

```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'api/admin',
    // ...
)
```

#### 可用的路由器方法

路由器允许注册响应任何 HTTP 谓词的路由：

```php
Route::get($uri, $callback);
Route::post($uri, $callback);
Route::put($uri, $callback);
Route::patch($uri, $callback);
Route::delete($uri, $callback);
Route::options($uri, $callback);
```

有时你可能需要注册响应多个 HTTP 谓词的路由。可以使用 `match` 方法来实现。或者，可以使用 `any` 方法注册响应所有 HTTP 谓词的路由：

```php
Route::match(['get', 'post'], '/', function () {
    // ...
});

Route::any('/', function () {
    // ...
});
```

> [!NOTE]
> 当定义共享同一 URI 的多个路由时，使用 `get`、`post`、`put`、`patch`、`delete` 和 `options` 方法的路由应在使用 `any`、`match` 和 `redirect` 方法的路由之前定义。这确保传入请求能与正确的路由匹配。

#### 依赖注入

你可以在路由的回调签名中对路由所需的任何依赖进行类型提示。所声明的依赖将由 Laravel 的[服务容器](/docs/{{version}}/container) 自动解析并注入到回调中。例如，可以对 `Illuminate\Http\Request` 类进行类型提示，以将当前 HTTP 请求自动注入到路由回调中：

```php
use Illuminate\Http\Request;

Route::get('/users', function (Request $request) {
    // ...
});
```

#### CSRF 保护

请记住，任何指向 `web` 路由文件中定义的 `POST`、`PUT`、`PATCH` 或 `DELETE` 路由的 HTML 表单都应包含 CSRF token 字段。否则，请求将被拒绝。可以在 [CSRF 文档](/docs/{{version}}/csrf) 中阅读有关 CSRF 保护的更多信息：

```blade
<form method="POST" action="/profile">
    @csrf
    ...
</form>
```

### 重定向路由

如果正在定义一个重定向到其他 URI 的路由，可以使用 `Route::redirect` 方法。该方法提供了一个便捷的快捷方式，因此不必为了执行简单的重定向而定义完整的路由或控制器：

```php
Route::redirect('/here', '/there');
```

默认情况下，`Route::redirect` 返回 `302` 状态码。可以使用可选的第三个参数自定义状态码：

```php
Route::redirect('/here', '/there', 301);
```

或者，可以使用 `Route::permanentRedirect` 方法返回 `301` 状态码：

```php
Route::permanentRedirect('/here', '/there');
```

> [!WARNING]
> 在重定向路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`destination` 和 `status`。

### 视图路由

如果路由仅需要返回[视图](/docs/{{version}}/views)，可以使用 `Route::view` 方法。与 `redirect` 方法类似，该方法提供了一个简单的快捷方式，因此不必定义完整的路由或控制器。`view` 方法接受 URI 作为第一个参数，接受视图名作为第二个参数。此外，可以提供数据数组作为可选的第三个参数传递给视图：

```php
Route::view('/welcome', 'welcome');

Route::view('/welcome', 'welcome', ['name' => 'Taylor']);
```

> [!WARNING]
> 在视图路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`view`、`data`、`status` 和 `headers`。

### 列出你的路由

`route:list` Artisan 命令可以轻松提供应用中定义的所有路由的概览：

```shell
php artisan route:list
```

默认情况下，`route:list` 输出中不会显示分配给每个路由的路由中间件；但是，可以通过向命令添加 `-v` 选项来指示 Laravel 显示路由中间件和中间件组名称：

```shell
php artisan route:list -v

# 展开中间件组...
php artisan route:list -vv
```

还可以指示 Laravel 仅显示以给定 URI 开头的路由：

```shell
php artisan route:list --path=api
```

此外，可以通过在执行 `route:list` 命令时提供 `--except-vendor` 选项来指示 Laravel 隐藏由第三方包定义的任何路由：

```shell
php artisan route:list --except-vendor
```

类似地，可以通过在执行 `route:list` 命令时提供 `--only-vendor` 选项来指示 Laravel 仅显示由第三方包定义的路由：

```shell
php artisan route:list --only-vendor
```

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

但是，有时你可能希望定义一个全新的文件来包含应用路由的子集。为此，可以向 `withRouting` 方法提供一个 `then` 闭包。在此闭包内，可以注册应用所需的任何其他路由：

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

或者，甚至可以通过向 `withRouting` 方法提供 `using` 闭包来完全控制路由注册。当传递此参数时，框架不会注册任何 HTTP 路由，你需要负责手动注册所有路由：

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

## 路由参数

### 必需参数

有时你需要在路由中捕获 URI 的片段。例如，可能需要从 URL 捕获用户的 ID。可以通过定义路由参数来实现：

```php
Route::get('/user/{id}', function (string $id) {
    return 'User '.$id;
});
```

可以根据路由需要定义任意数量的路由参数：

```php
Route::get('/posts/{post}/comments/{comment}', function (string $postId, string $commentId) {
    // ...
});
```

路由参数始终用 `{}` 花括号包裹，应由字母字符组成。路由参数名中也允许使用下划线（`_`）。路由参数根据其顺序注入到路由回调/控制器中——路由回调/控制器参数的名称无关紧要。

#### 参数和依赖注入

如果路由有希望 Laravel 服务容器自动注入到路由回调中的依赖，应在依赖之后列出路由参数：

```php
use Illuminate\Http\Request;

Route::get('/user/{id}', function (Request $request, string $id) {
    return 'User '.$id;
});
```

### 可选参数

有时你可能需要指定 URI 中不一定存在的路由参数。可以通过在参数名称后放置 `?` 标记来实现。请确保为路由的相应变量提供默认值：

```php
Route::get('/user/{name?}', function (?string $name = null) {
    return $name;
});

Route::get('/user/{name?}', function (?string $name = 'John') {
    return $name;
});
```

### 正则表达式约束

可以使用路由实例上的 `where` 方法来约束路由参数的格式。`where` 方法接受参数名和定义参数如何被约束的正则表达式：

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

为方便起见，一些常用的正则表达式模式有辅助方法，允许你快速向路由添加模式约束：

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

#### 全局约束

如果希望路由参数始终由给定的正则表达式约束，可以使用 `pattern` 方法。应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义这些模式：

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

一旦定义了模式，它将自动应用于所有使用该参数名的路由：

```php
Route::get('/user/{id}', function (string $id) {
    // 仅当 {id} 为数字时才执行...
});
```

#### 编码后的正斜杠

Laravel 路由组件允许除 `/` 之外的所有字符出现在路由参数值中。必须使用 `where` 条件正则表达式显式允许 `/` 作为占位符的一部分：

```php
Route::get('/search/{search}', function (string $search) {
    return $search;
})->where('search', '.*');
```

> [!WARNING]
> 编码后的正斜杠仅在最后一个路由段中受支持。

## 命名路由

命名路由可以方便地为特定路由生成 URL 或重定向。可以通过将 `name` 方法链接到路由定义来为路由指定名称：

```php
Route::get('/user/profile', function () {
    // ...
})->name('profile');
```

还可以为控制器操作指定路由名称：

```php
Route::get(
    '/user/profile',
    [UserProfileController::class, 'show']
)->name('profile');
```

> [!WARNING]
> 路由名称应始终保持唯一。

#### 为命名路由生成 URL

一旦为给定路由分配了名称，就可以在通过 Laravel 的 `route` 和 `redirect` 辅助函数生成 URL 或重定向时使用路由的名称：

```php
// 生成 URL...
$url = route('profile');

// 生成重定向...
return redirect()->route('profile');

return to_route('profile');
```

如果命名路由定义了参数，可以将参数作为第二个参数传递给 `route` 函数。给定的参数将自动插入到生成 URL 的正确位置：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1]);
```

如果在数组中传递额外的参数，那些键/值对将自动作为查询字符串添加到生成的 URL 中：

```php
Route::get('/user/{id}/profile', function (string $id) {
    // ...
})->name('profile');

$url = route('profile', ['id' => 1, 'photos' => 'yes']);

// http://example.com/user/1/profile?photos=yes
```

> [!NOTE]
> 有时你可能希望为 URL 参数指定请求范围的默认值，例如当前区域设置。为此，可以使用 [URL::defaults 方法](/docs/{{version}}/urls#default-values)。

#### 检查当前路由

如果希望确定当前请求是否被路由到给定的命名路由，可以在 Route 实例上使用 `named` 方法。例如，可以从路由中间件检查当前路由名称：

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

## 路由组

路由组允许在大量路由之间共享路由属性（例如中间件），而无需在每个单独的路由上定义这些属性。

嵌套组尝试智能地将其属性与其父组「合并」。中间件和 `where` 条件被合并，而名称和前缀被追加。命名空间分隔符和 URI 前缀中的斜杠会在适当位置自动添加。

### 中间件

要将[中间件](/docs/{{version}}/middleware) 分配给组内的所有路由，可以在定义组之前使用 `middleware` 方法。中间件按数组中列出的顺序执行：

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

### 控制器

如果一组路由都使用相同的[控制器](/docs/{{version}}/controllers)，则可以使用 `controller` 方法为组内的所有路由定义公共控制器。然后，在定义路由时，只需提供它们调用的控制器方法：

```php
use App\Http\Controllers\OrderController;

Route::controller(OrderController::class)->group(function () {
    Route::get('/orders/{id}', 'show');
    Route::post('/orders', 'store');
});
```

### 子域路由

路由组也可用于处理子域路由。子域可以像路由 URI 一样分配路由参数，允许你捕获子域的一部分用于路由或控制器。可以通过在定义组之前调用 `domain` 方法来指定子域：

```php
Route::domain('{account}.example.com')->group(function () {
    Route::get('/user/{id}', function (string $account, string $id) {
        // ...
    });
});
```

### 路由前缀

`prefix` 方法可用于为组内的每个路由添加给定的 URI 前缀。例如，可能希望为组内的所有路由 URI 添加 `admin` 前缀：

```php
Route::prefix('admin')->group(function () {
    Route::get('/users', function () {
        // 匹配 "/admin/users" URL
    });
});
```

### 路由名称前缀

`name` 方法可用于为组内的每个路由名称添加给定的字符串前缀。例如，可能希望为组内所有路由的名称添加 `admin` 前缀。给定的字符串会按原样作为前缀添加到路由名称，因此请确保在前缀中提供尾部的 `.` 字符：

```php
Route::name('admin.')->group(function () {
    Route::get('/users', function () {
        // 路由名称为 "admin.users"...
    })->name('users');
});
```

## 路由模型绑定

将模型 ID 注入到路由或控制器操作时，通常会查询数据库以检索与该 ID 对应的模型。Laravel 路由模型绑定提供了一种便捷的方式，可以将模型实例直接自动注入到路由中。例如，可以注入与给定 ID 匹配的整个 `User` 模型实例，而不是注入用户的 ID。

### 隐式绑定

Laravel 会自动解析路由或控制器操作中定义的 Eloquent 模型，其类型提示变量名与路由段名匹配。例如：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
});
```

由于 `$user` 变量被类型提示为 `App\Models\User` Eloquent 模型，且变量名与 `{user}` URI 段匹配，Laravel 将自动注入其 ID 与请求 URI 中相应值匹配的模型实例。如果在数据库中未找到匹配的模型实例，则会自动生成 404 HTTP 响应。

当然，使用控制器方法时也可以进行隐式绑定。同样，请注意 `{user}` URI 段与控制器中包含 `App\Models\User` 类型提示的 `$user` 变量匹配：

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

#### 软删除模型

通常，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting) 的模型。但是，可以通过将 `withTrashed` 方法链接到路由定义上来指示隐式绑定检索这些模型：

```php
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return $user->email;
})->withTrashed();
```

#### 自定义键

有时你可能希望使用 `id` 以外的列解析 Eloquent 模型。为此，可以在路由参数定义中指定该列：

```php
use App\Models\Post;

Route::get('/posts/{post:slug}', function (Post $post) {
    return $post;
});
```

如果希望模型绑定在检索给定模型类时始终使用 `id` 之外的数据库列，可以将 `RouteKey` 属性应用于 Eloquent 模型：

```php
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Model;

#[RouteKey('slug')]
class Post extends Model
{
    // ...
}
```

#### 自定义键和作用域

在单个路由定义中隐式绑定多个 Eloquent 模型时，可能希望对第二个 Eloquent 模型进行作用域限定，使其必须是先前 Eloquent 模型的子级。例如，考虑以下按特定用户的 slug 检索博客文章的路由定义：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
});
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动限定查询范围，以通过其父级检索嵌套模型，使用约定来猜测父级上的关联名称。在这种情况下，将假定 `User` 模型具有名为 `posts`（路由参数名的复数形式）的关联，可用于检索 `Post` 模型。

如果需要，你甚至可以在未提供自定义键时指示 Laravel 对「子级」绑定进行作用域限定。为此，可以在定义路由时调用 `scopeBindings` 方法：

```php
use App\Models\Post;
use App\Models\User;

Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

或者，可以指示整个路由定义组使用作用域绑定：

```php
Route::scopeBindings()->group(function () {
    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    });
});
```

类似地，可以通过调用 `withoutScopedBindings` 方法来显式指示 Laravel 不对绑定进行作用域限定：

```php
Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post;
})->withoutScopedBindings();
```

#### 自定义缺失模型的行为

通常，如果找不到隐式绑定的模型，则会生成 404 HTTP 响应。但是，可以通过在定义路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，当找不到隐式绑定的模型时将调用该闭包：

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

### 隐式枚举绑定

PHP 8.1 引入了对[枚举](https://www.php.net/manual/en/language.enumerations.backed.php) 的支持。作为对此功能的补充，Laravel 允许在路由定义中对[字符串支持的枚举](https://www.php.net/manual/en/language.enumerations.backed.php) 进行类型提示，并且仅当该路由段对应于有效的枚举值时，Laravel 才会调用该路由。否则，将自动返回 404 HTTP 响应。例如，给定以下枚举：

```php
<?php

namespace App\Enums;

enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

可以定义仅当 `{category}` 路由段为 `fruits` 或 `people` 时才会调用的路由。否则，Laravel 将返回 404 HTTP 响应：

```php
use App\Enums\Category;
use Illuminate\Support\Facades\Route;

Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

### 显式绑定

你不需要使用 Laravel 隐式的、基于约定的模型解析即可使用模型绑定。还可以显式定义路由参数如何对应于模型。要注册显式绑定，请使用路由器的 `model` 方法为给定参数指定类。应在 `AppServiceProvider` 类的 `boot` 方法的开头定义显式模型绑定：

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

由于我们将所有 `{user}` 参数绑定到了 `App\Models\User` 模型，该类的一个实例将被注入到路由中。因此，例如，对 `users/1` 的请求将注入数据库中 ID 为 `1` 的 `User` 实例。

如果在数据库中未找到匹配的模型实例，则会自动生成 404 HTTP 响应。

#### 自定义解析逻辑

如果希望定义自己的模型绑定解析逻辑，可以使用 `Route::bind` 方法。传递给 `bind` 方法的闭包将接收 URI 段的值，并应返回应注入路由的类实例。同样，此自定义应在应用的 `AppServiceProvider` 的 `boot` 方法中进行：

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

或者，可以重写 Eloquent 模型上的 `resolveRouteBinding` 方法。该方法将接收 URI 段的值，并应返回应注入路由的类实例：

```php
/**
 * 检索绑定值的模型。
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

如果路由正在使用[隐式绑定作用域](#implicit-model-binding-scoping)，则将使用 `resolveChildRouteBinding` 方法解析父模型的子绑定：

```php
/**
 * 检索绑定值的子模型。
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

## 回退路由

使用 `Route::fallback` 方法，可以定义一个在没有任何其他路由匹配传入请求时执行的路由。通常，未处理的请求会通过应用的异常处理程序自动渲染「404」页面。但是，由于你通常会在 `routes/web.php` 文件中定义 `fallback` 路由，`web` 中间件组中的所有中间件都将应用于该路由。你可以根据需要向此路由添加其他中间件：

```php
Route::fallback(function () {
    // ...
});
```

## 限流

### 定义限流器

Laravel 包含强大且可自定义的限流服务，你可以利用它来限制给定路由或一组路由的流量。首先，应根据应用需要定义限流器配置。

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

限流器使用 `RateLimiter` Facade 的 `for` 方法定义。`for` 方法接受限流器名称和闭包，该闭包返回应应用于分配给该限流器的路由的限制配置。限制配置是 `Illuminate\Cache\RateLimiting\Limit` 类的实例。该类包含有用的「构建器」方法，使你可以快速定义限制。限流器名称可以是任何你希望的字符串：

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

如果传入请求超出指定的速率限制，Laravel 将自动返回带 429 HTTP 状态码的响应。如果希望定义由速率限制返回的自定义响应，可以使用 `response` 方法：

```php
RateLimiter::for('global', function (Request $request) {
    return Limit::perMinute(1000)->response(function (Request $request, array $headers) {
        return response('Custom response...', 429, $headers);
    });
});
```

由于限流器回调接收传入的 HTTP 请求实例，因此可以根据传入请求或经过身份验证的用户动态构建适当的速率限制：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()?->vipCustomer()
        ? Limit::none()
        : Limit::perHour(10);
});
```

#### 分段速率限制

有时你可能希望按某个任意值对速率限制进行分段。例如，可能希望允许用户每分钟每个 IP 地址访问给定路由 100 次。为此，可以在构建速率限制时使用 `by` 方法：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()->vipCustomer()
        ? Limit::none()
        : Limit::perMinute(100)->by($request->ip());
});
```

为了使用另一个示例说明此功能，我们可以将每个经过身份验证的用户 ID 每分钟访问路由的次数限制为 100 次，或者将访客每个 IP 地址每分钟的访问次数限制为 10 次：

```php
RateLimiter::for('uploads', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(100)->by($request->user()->id)
        : Limit::perMinute(10)->by($request->ip());
});
```

#### 多重速率限制

如果需要，可以为给定的限流器配置返回速率限制数组。每个速率限制将根据它们在数组中的顺序针对路由进行评估：

```php
RateLimiter::for('login', function (Request $request) {
    return [
        Limit::perMinute(500),
        Limit::perMinute(3)->by($request->input('email')),
    ];
});
```

如果按相同的 `by` 值分配多个速率限制段，应确保每个 `by` 值是唯一的。实现此目的的最简单方法是为 `by` 方法提供的值添加前缀：

```php
RateLimiter::for('uploads', function (Request $request) {
    return [
        Limit::perMinute(10)->by('minute:'.$request->user()->id),
        Limit::perDay(1000)->by('day:'.$request->user()->id),
    ];
});
```

#### 基于响应的速率限制

除了限制传入请求外，Laravel 还允许使用 `after` 方法基于响应进行限流。当你只想将某些响应计入速率限制（例如验证错误、404 响应或其他特定 HTTP 状态码）时，这非常有用。

`after` 方法接受一个闭包，该闭包接收响应，如果响应应计入速率限制则应返回 `true`，如果应忽略则返回 `false`。这对于通过限制连续的 404 响应来防止枚举攻击，或者允许用户重试验证失败的请求而不会耗尽本应仅限制成功操作的端点的速率限制特别有用：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

RateLimiter::for('resource-not-found', function (Request $request) {
    return Limit::perMinute(10)
        ->by($request->user()?->id ?: $request->ip())
        ->after(function (Response $response) {
            // 仅将 404 响应计入速率限制以防止枚举...
            return $response->status() === 404;
        });
});
```

### 将限流器附加到路由

可以使用 `throttle` [中间件](/docs/{{version}}/middleware) 将限流器附加到路由或路由组。`throttle` 中间件接受希望分配给路由的限流器的名称：

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

#### 使用 Redis 进行限流

默认情况下，`throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequests` 类。但是，如果使用 Redis 作为应用的缓存驱动，则可能希望指示 Laravel 使用 Redis 来管理限流。为此，应在应用的 `bootstrap/app.php` 文件中使用 `throttleWithRedis` 方法。此方法将 `throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` 中间件类：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->throttleWithRedis();
    // ...
})
```

## 表单方法伪造

HTML 表单不支持 `PUT`、`PATCH` 或 `DELETE` 操作。因此，当定义从 HTML 表单调用的 `PUT`、`PATCH` 或 `DELETE` 路由时，需要向表单添加一个隐藏的 `_method` 字段。随 `_method` 字段发送的值将用作 HTTP 请求方法：

```blade
<form action="/example" method="POST">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
</form>
```

为方便起见，可以使用 `@method` [Blade 指令](/docs/{{version}}/blade) 来生成 `_method` 输入字段：

```blade
<form action="/example" method="POST">
    @method('PUT')
    @csrf
</form>
```

## 访问当前路由

可以使用 `Route` Facade 上的 `current`、`currentRouteName` 和 `currentRouteAction` 方法访问有关处理传入请求的路由的信息：

```php
use Illuminate\Support\Facades\Route;

$route = Route::current(); // Illuminate\Routing\Route
$name = Route::currentRouteName(); // string
$action = Route::currentRouteAction(); // string
```

可以参考 [Route Facade 底层类](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Router.html) 和 [Route 实例](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Route.html) 的 API 文档，查看路由器和路由类上可用的所有方法。

## 跨源资源共享（CORS）

Laravel 可以使用你配置的值自动响应 CORS `OPTIONS` HTTP 请求。`OPTIONS` 请求将由 `HandleCors` [中间件](/docs/{{version}}/middleware) 自动处理，该中间件自动包含在应用的全局中间件堆栈中。

有时，你可能需要为应用自定义 CORS 配置值。为此，可以使用 `config:publish` Artisan 命令发布 `cors` 配置文件：

```shell
php artisan config:publish cors
```

此命令将在应用的 `config` 目录中放置一个 `cors.php` 配置文件。

> [!NOTE]
> 有关 CORS 和 CORS 标头的更多信息，请参阅 [MDN 上有关 CORS 的 Web 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers)。

## 路由缓存

将应用部署到生产环境时，应利用 Laravel 的路由缓存。使用路由缓存将大幅减少注册应用所有路由所需的时间。要生成路由缓存，请执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

运行此命令后，缓存的路由文件将在每个请求中加载。请记住，如果添加任何新路由，则需要生成新的路由缓存。因此，只应在项目部署期间运行 `route:cache` 命令。

可以使用 `route:clear` 命令清除路由缓存：

```shell
php artisan route:clear
```