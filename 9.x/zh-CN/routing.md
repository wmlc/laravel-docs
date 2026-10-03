# 路由

- [基础路由](#basic-routing)
    - [重定向路由](#redirect-routes)
    - [视图路由](#view-routes)
    - [路由列表](#the-route-list)
- [路由参数](#route-parameters)
    - [必填参数](#required-parameters)
    - [可选参数](#parameters-optional-parameters)
    - [正则表达式约束](#parameters-regular-expression-constraints)
- [命名路由](#named-routes)
- [路由分组](#route-groups)
    - [中间件](#route-group-middleware)
    - [控制器](#route-group-controllers)
    - [子域路由](#route-group-subdomain-routing)
    - [路由前缀](#route-group-prefixes)
    - [路由名称前缀](#route-group-name-prefixes)
- [路由模型绑定](#route-model-binding)
    - [隐式绑定](#implicit-binding)
    - [隐式 Enum 绑定](#implicit-enum-binding)
    - [显式绑定](#explicit-binding)
- [兜底路由](#fallback-routes)
- [速率限制](#rate-limiting)
    - [定义速率限制器](#defining-rate-limiters)
    - [将速率限制器附加到路由](#attaching-rate-limiters-to-routes)
- [表单方法伪装](#form-method-spoofing)
- [访问当前路由](#accessing-the-current-route)
- [跨域资源共享（CORS）](#cors)
- [路由缓存](#route-caching)

<a name="basic-routing"></a>
## 基础路由

最基础的 Laravel 路由接受一个 URI 和一个闭包，提供了一种非常简单且富有表现力的方式来定义路由和行为，无需复杂的路由配置文件：

    use Illuminate\Support\Facades\Route;

    Route::get('/greeting', function () {
        return 'Hello World';
    });

<a name="the-default-route-files"></a>
#### 默认路由文件

所有 Laravel 路由都定义在路由文件中，这些文件位于 `routes` 目录。这些文件由应用的 `App\Providers\RouteServiceProvider` 自动加载。`routes/web.php` 文件定义用于 Web 界面的路由。这些路由被分配了 `web` 中间件组，提供了 session 状态和 CSRF 防护等功能。`routes/api.php` 中的路由是无状态的，被分配了 `api` 中间件组。

对于大多数应用，你将从在 `routes/web.php` 文件中定义路由开始。`routes/web.php` 中定义的路由可以通过在浏览器中输入定义的路由 URL 来访问。例如，你可以通过在浏览器中导航到 `http://example.com/user` 来访问以下路由：

    use App\Http\Controllers\UserController;

    Route::get('/user', [UserController::class, 'index']);

`routes/api.php` 文件中定义的路由由 `RouteServiceProvider` 嵌套在路由分组中。在此分组内，`/api` URI 前缀会自动应用，因此你无需手动将其应用于文件中的每个路由。你可以通过修改 `RouteServiceProvider` 类来修改前缀和其他路由分组选项。

<a name="available-router-methods"></a>
#### 可用的路由器方法

路由器允许你注册响应任何 HTTP 动词的路由：

    Route::get($uri, $callback);
    Route::post($uri, $callback);
    Route::put($uri, $callback);
    Route::patch($uri, $callback);
    Route::delete($uri, $callback);
    Route::options($uri, $callback);

有时你可能需要注册响应多个 HTTP 动词的路由。可以使用 `match` 方法实现。或者，你甚至可以使用 `any` 方法注册响应所有 HTTP 动词的路由：

    Route::match(['get', 'post'], '/', function () {
        //
    });

    Route::any('/', function () {
        //
    });

> **Note**  
> 定义共享相同 URI 的多个路由时，使用 `get`、`post`、`put`、`patch`、`delete` 和 `options` 方法的路由应在使用 `any`、`match` 和 `redirect` 方法的路由之前定义。这确保传入请求匹配到正确的路由。

<a name="dependency-injection"></a>
#### 依赖注入

你可以在路由的回调签名中对路由所需的任何依赖进行类型提示。声明的依赖将由 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动解析并注入到回调中。例如，你可以对 `Illuminate\Http\Request` 类进行类型提示，让当前 HTTP 请求自动注入到你的路由回调：

    use Illuminate\Http\Request;

    Route::get('/users', function (Request $request) {
        // ...
    });

<a name="csrf-protection"></a>
#### CSRF 防护

请记住，任何指向 `web` 路由文件中定义的 `POST`、`PUT`、`PATCH` 或 `DELETE` 路由的 HTML 表单都应包含 CSRF 令牌字段。否则，请求将被拒绝。你可以在 [CSRF 文档](/docs/{{version}}/csrf)中阅读更多关于 CSRF 防护的信息：

    <form method="POST" action="/profile">
        @csrf
        ...
    </form>

<a name="redirect-routes"></a>
### 重定向路由

如果你定义的路由需要重定向到另一个 URI，可以使用 `Route::redirect` 方法。此方法提供了一个便捷的快捷方式，无需为执行简单重定向而定义完整的路由或控制器：

    Route::redirect('/here', '/there');

默认情况下，`Route::redirect` 返回 `302` 状态码。你可以使用可选的第三个参数自定义状态码：

    Route::redirect('/here', '/there', 301);

或者，你可以使用 `Route::permanentRedirect` 方法返回 `301` 状态码：

    Route::permanentRedirect('/here', '/there');

> **Warning**  
> 在重定向路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`destination` 和 `status`。

<a name="view-routes"></a>
### 视图路由

如果你的路由只需返回一个[视图](/docs/{{version}}/views)，可以使用 `Route::view` 方法。与 `redirect` 方法类似，此方法提供了一个简单的快捷方式，无需定义完整的路由或控制器。`view` 方法接受 URI 作为第一个参数，视图名称作为第二个参数。此外，你可以提供一个数据数组作为可选的第三个参数传递给视图：

    Route::view('/welcome', 'welcome');

    Route::view('/welcome', 'welcome', ['name' => 'Taylor']);

> **Warning**  
> 在视图路由中使用路由参数时，以下参数由 Laravel 保留，不能使用：`view`、`data`、`status` 和 `headers`。

<a name="the-route-list"></a>
### 路由列表

`route:list` Artisan 命令可以轻松提供应用定义的所有路由的概览：

```shell
php artisan route:list
```

默认情况下，分配给每个路由的路由中间件不会显示在 `route:list` 输出中；但是，你可以通过向命令添加 `-v` 选项来指示 Laravel 显示路由中间件：

```shell
php artisan route:list -v
```

你还可以指示 Laravel 仅显示以给定 URI 开头的路由：

```shell
php artisan route:list --path=api
```

此外，你可以通过在执行 `route:list` 命令时提供 `--except-vendor` 选项来指示 Laravel 隐藏由第三方包定义的任何路由：

```shell
php artisan route:list --except-vendor
```

同样，你也可以通过提供 `--only-vendor` 选项来指示 Laravel 仅显示由第三方包定义的路由：

```shell
php artisan route:list --only-vendor
```

<a name="route-parameters"></a>
## 路由参数

<a name="required-parameters"></a>
### 必填参数

有时你需要捕获路由中 URI 的片段。例如，你可能需要从 URL 中捕获用户的 ID。可以通过定义路由参数来实现：

    Route::get('/user/{id}', function ($id) {
        return 'User '.$id;
    });

你可以根据路由需要定义任意多个路由参数：

    Route::get('/posts/{post}/comments/{comment}', function ($postId, $commentId) {
        //
    });

路由参数始终包含在 `{}` 花括号内，应由字母字符组成。路由参数名称中也接受下划线（`_`）。路由参数基于其顺序注入到路由回调 / 控制器中 —— 路由回调 / 控制器参数的名称无关紧要。

<a name="parameters-and-dependency-injection"></a>
#### 参数与依赖注入

如果你的路由有希望由 Laravel 服务容器自动注入到路由回调的依赖，应将路由参数列在依赖之后：

    use Illuminate\Http\Request;

    Route::get('/user/{id}', function (Request $request, $id) {
        return 'User '.$id;
    });

<a name="parameters-optional-parameters"></a>
### 可选参数

有时你可能需要指定一个可能并不总是存在于 URI 中的路由参数。可以通过在参数名称后放置 `?` 标记来实现。确保为路由的相应变量提供默认值：

    Route::get('/user/{name?}', function ($name = null) {
        return $name;
    });

    Route::get('/user/{name?}', function ($name = 'John') {
        return $name;
    });

<a name="parameters-regular-expression-constraints"></a>
### 正则表达式约束

你可以使用路由实例上的 `where` 方法约束路由参数的格式。`where` 方法接受参数名称和定义参数应如何约束的正则表达式：

    Route::get('/user/{name}', function ($name) {
        //
    })->where('name', '[A-Za-z]+');

    Route::get('/user/{id}', function ($id) {
        //
    })->where('id', '[0-9]+');

    Route::get('/user/{id}/{name}', function ($id, $name) {
        //
    })->where(['id' => '[0-9]+', 'name' => '[a-z]+']);

为方便起见，一些常用的正则表达式模式有辅助方法，允许你快速为路由添加模式约束：

    Route::get('/user/{id}/{name}', function ($id, $name) {
        //
    })->whereNumber('id')->whereAlpha('name');

    Route::get('/user/{name}', function ($name) {
        //
    })->whereAlphaNumeric('name');

    Route::get('/user/{id}', function ($id) {
        //
    })->whereUuid('id');

    Route::get('/user/{id}', function ($id) {
        //
    })->whereUlid('id');

    Route::get('/category/{category}', function ($category) {
        //
    })->whereIn('category', ['movie', 'song', 'painting']);

如果传入请求不匹配路由模式约束，将返回 404 HTTP 响应。

<a name="parameters-global-constraints"></a>
#### 全局约束

如果你希望路由参数始终受给定正则表达式约束，可以使用 `pattern` 方法。你应在 `App\Providers\RouteServiceProvider` 类的 `boot` 方法定义这些模式：

    /**
     * 定义你的路由模型绑定、模式过滤器等。
     *
     * @return void
     */
    public function boot()
    {
        Route::pattern('id', '[0-9]+');
    }

一旦定义了模式，它会自动应用于使用该参数名称的所有路由：

    Route::get('/user/{id}', function ($id) {
        // 仅在 {id} 为数字时执行...
    });

<a name="parameters-encoded-forward-slashes"></a>
#### 编码的正斜杠

Laravel 路由组件允许路由参数值中存在除 `/` 之外的所有字符。你必须使用 `where` 条件正则表达式显式允许 `/` 成为占位符的一部分：

    Route::get('/search/{search}', function ($search) {
        return $search;
    })->where('search', '.*');

> **Warning**  
> 编码的正斜杠仅在最后一个路由段中受支持。

<a name="named-routes"></a>
## 命名路由

命名路由允许为特定路由便捷地生成 URL 或重定向。你可以通过将 `name` 方法链式调用到路由定义来为路由指定名称：

    Route::get('/user/profile', function () {
        //
    })->name('profile');

你也可以为控制器动作指定路由名称：

    Route::get(
        '/user/profile',
        [UserProfileController::class, 'show']
    )->name('profile');

> **Warning**  
> 路由名称应始终唯一。

<a name="generating-urls-to-named-routes"></a>
#### 生成命名路由的 URL

为给定路由分配名称后，你可以通过 Laravel 的 `route` 和 `redirect` 辅助函数使用路由名称生成 URL 或重定向：

    // 生成 URL...
    $url = route('profile');

    // 生成重定向...
    return redirect()->route('profile');

    return to_route('profile');

如果命名路由定义了参数，你可以将参数作为第二个参数传递给 `route` 函数。给定参数将自动插入到生成 URL 的正确位置：

    Route::get('/user/{id}/profile', function ($id) {
        //
    })->name('profile');

    $url = route('profile', ['id' => 1]);

如果你在数组中传递额外参数，这些键 / 值对将自动添加到生成 URL 的查询字符串中：

    Route::get('/user/{id}/profile', function ($id) {
        //
    })->name('profile');

    $url = route('profile', ['id' => 1, 'photos' => 'yes']);

    // /user/1/profile?photos=yes

> **Note**  
> 有时，你可能希望为 URL 参数指定请求范围内的默认值，例如当前语言区域。为此，你可以使用 [`URL::defaults` 方法](/docs/{{version}}/urls#default-values)。

<a name="inspecting-the-current-route"></a>
#### 检查当前路由

如果你想判断当前请求是否路由到了给定的命名路由，可以在 Route 实例上使用 `named` 方法。例如，你可以从路由中间件检查当前路由名称：

    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if ($request->route()->named('profile')) {
            //
        }

        return $next($request);
    }

<a name="route-groups"></a>
## 路由分组

路由分组允许你在大量路由间共享路由属性（如中间件），而无需在每个单独路由上定义这些属性。

嵌套分组会尝试智能地与父分组「合并」属性。中间件和 `where` 条件会被合并，而名称和前缀会被追加。命名空间分隔符和 URI 前缀中的斜杠会在适当位置自动添加。

<a name="route-group-middleware"></a>
### 中间件

要将[中间件](/docs/{{version}}/middleware)分配给分组内的所有路由，可以在定义分组之前使用 `middleware` 方法。中间件按其在数组中列出的顺序执行：

    Route::middleware(['first', 'second'])->group(function () {
        Route::get('/', function () {
            // 使用 first 和 second 中间件...
        });

        Route::get('/user/profile', function () {
            // 使用 first 和 second 中间件...
        });
    });

<a name="route-group-controllers"></a>
### 控制器

如果一组路由都使用相同的[控制器](/docs/{{version}}/controllers)，可以使用 `controller` 方法为分组内的所有路由定义通用控制器。然后，定义路由时，只需提供它们调用的控制器方法：

    use App\Http\Controllers\OrderController;

    Route::controller(OrderController::class)->group(function () {
        Route::get('/orders/{id}', 'show');
        Route::post('/orders', 'store');
    });

<a name="route-group-subdomain-routing"></a>
### 子域路由

路由分组也可用于处理子域路由。子域可以像路由 URI 一样分配路由参数，允许你捕获子域的一部分用于路由或控制器。可以在定义分组之前调用 `domain` 方法来指定子域：

    Route::domain('{account}.example.com')->group(function () {
        Route::get('user/{id}', function ($account, $id) {
            //
        });
    });

> **Warning**  
> 为确保子域路由可访问，你应在注册根域路由之前注册子域路由。这可以防止根域路由覆盖具有相同 URI 路径的子域路由。

<a name="route-group-prefixes"></a>
### 路由前缀

可以使用 `prefix` 方法为分组内的每个路由添加给定 URI 前缀。例如，你可能希望为分组内的所有路由 URI 添加 `admin` 前缀：

    Route::prefix('admin')->group(function () {
        Route::get('/users', function () {
            // 匹配 "/admin/users" URL
        });
    });

<a name="route-group-name-prefixes"></a>
### 路由名称前缀

可以使用 `name` 方法为分组内的每个路由名称添加给定字符串前缀。例如，你可能希望为所有分组路由的名称添加 `admin` 前缀。给定字符串会完全按指定方式前缀到路由名称，因此我们确保在前缀中提供尾部的 `.` 字符：

    Route::name('admin.')->group(function () {
        Route::get('/users', function () {
            // 路由分配名称 "admin.users"...
        })->name('users');
    });

<a name="route-model-binding"></a>
## 路由模型绑定

向路由或控制器动作注入模型 ID 时，你通常会查询数据库以检索与该 ID 对应的模型。Laravel 路由模型绑定提供了一种便捷的方式，将模型实例直接自动注入到你的路由中。例如，你可以注入与给定 ID 匹配的整个 `User` 模型实例，而不是注入用户 ID。

<a name="implicit-binding"></a>
### 隐式绑定

Laravel 会自动解析在路由或控制器动作中定义的 Eloquent 模型，其类型提示的变量名称匹配路由段名称。例如：

    use App\Models\User;

    Route::get('/users/{user}', function (User $user) {
        return $user->email;
    });

由于 `$user` 变量类型提示为 `App\Models\User` Eloquent 模型，且变量名称匹配 `{user}` URI 段，Laravel 会自动注入具有与请求 URI 中相应值匹配的 ID 的模型实例。如果在数据库中未找到匹配的模型实例，将自动生成 404 HTTP 响应。

当然，使用控制器方法时也可以进行隐式绑定。再次注意 `{user}` URI 段匹配控制器中包含 `App\Models\User` 类型提示的 `$user` 变量：

    use App\Http\Controllers\UserController;
    use App\Models\User;

    // 路由定义...
    Route::get('/users/{user}', [UserController::class, 'show']);

    // 控制器方法定义...
    public function show(User $user)
    {
        return view('user.profile', ['user' => $user]);
    }

<a name="implicit-soft-deleted-models"></a>
#### 软删除模型

通常，隐式模型绑定不会检索已[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型。但是，你可以通过将 `withTrashed` 方法链式调用到路由定义来指示隐式绑定检索这些模型：

    use App\Models\User;

    Route::get('/users/{user}', function (User $user) {
        return $user->email;
    })->withTrashed();

<a name="customizing-the-default-key-name"></a>
#### 自定义键

有时你可能希望使用 `id` 以外的列解析 Eloquent 模型。为此，可以在路由参数定义中指定该列：

    use App\Models\Post;

    Route::get('/posts/{post:slug}', function (Post $post) {
        return $post;
    });

如果你希望模型绑定在检索给定模型类时始终使用 `id` 以外的数据库列，可以在 Eloquent 模型上覆盖 `getRouteKeyName` 方法：

    /**
     * 获取模型的路由键。
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }

<a name="implicit-model-binding-scoping"></a>
#### 自定义键与作用域

在单个路由定义中隐式绑定多个 Eloquent 模型时，你可能希望对第二个 Eloquent 模型进行作用域限制，使其必须是前一个 Eloquent 模型的子级。例如，考虑这个为特定用户按 slug 检索博客文章的路由定义：

    use App\Models\Post;
    use App\Models\User;

    Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
        return $post;
    });

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 会自动通过约定猜测父级上的关联名称来作用域查询以检索嵌套模型。在此情况下，将假设 `User` 模型有一个名为 `posts`（路由参数名称的复数形式）的关联，可用于检索 `Post` 模型。

如果你愿意，即使未提供自定义键，你也可以指示 Laravel 对「子」绑定进行作用域限制。为此，在定义路由时调用 `scopeBindings` 方法：

    use App\Models\Post;
    use App\Models\User;

    Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
        return $post;
    })->scopeBindings();

或者，你可以指示整组路由定义使用作用域绑定：

    Route::scopeBindings()->group(function () {
        Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
            return $post;
        });
    });

同样，你可以通过调用 `withoutScopedBindings` 方法显式指示 Laravel 不对绑定进行作用域限制：

    Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
        return $post;
    })->withoutScopedBindings();

<a name="customizing-missing-model-behavior"></a>
#### 自定义缺失模型行为

通常，如果未找到隐式绑定的模型，将生成 404 HTTP 响应。但是，你可以通过在定义路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，当找不到隐式绑定的模型时将调用此闭包：

    use App\Http\Controllers\LocationsController;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Redirect;

    Route::get('/locations/{location:slug}', [LocationsController::class, 'show'])
            ->name('locations.view')
            ->missing(function (Request $request) {
                return Redirect::route('locations.index');
            });

<a name="implicit-enum-binding"></a>
### 隐式 Enum 绑定

PHP 8.1 引入了对 [Enum](https://www.php.net/manual/en/language.enumerations.backed.php) 的支持。为补充此功能，Laravel 允许你在路由定义上对[字符串支持的 Enum](https://www.php.net/manual/en/language.enumerations.backed.php) 进行类型提示，Laravel 仅在该路由段对应有效 Enum 值时调用路由。否则，将自动返回 404 HTTP 响应。例如，给定以下 Enum：

```php
<?php

namespace App\Enums;

enum Category: string
{
    case Fruits = 'fruits';
    case People = 'people';
}
```

你可以定义一个仅在 `{category}` 路由段为 `fruits` 或 `people` 时才调用的路由。否则，Laravel 将返回 404 HTTP 响应：

```php
use App\Enums\Category;
use Illuminate\Support\Facades\Route;

Route::get('/categories/{category}', function (Category $category) {
    return $category->value;
});
```

<a name="explicit-binding"></a>
### 显式绑定

使用模型绑定无需使用 Laravel 基于约定的隐式模型解析。你也可以显式定义路由参数如何对应模型。要注册显式绑定，使用路由器的 `model` 方法为给定参数指定类。你应在 `RouteServiceProvider` 类的 `boot` 方法开头定义显式模型绑定：

    use App\Models\User;
    use Illuminate\Support\Facades\Route;

    /**
     * 定义你的路由模型绑定、模式过滤器等。
     *
     * @return void
     */
    public function boot()
    {
        Route::model('user', User::class);

        // ...
    }

接下来，定义一个包含 `{user}` 参数的路由：

    use App\Models\User;

    Route::get('/users/{user}', function (User $user) {
        //
    });

由于我们已将所有 `{user}` 参数绑定到 `App\Models\User` 模型，该类的实例将被注入到路由中。例如，对 `users/1` 的请求将注入数据库中 ID 为 `1` 的 `User` 实例。

如果在数据库中未找到匹配的模型实例，将自动生成 404 HTTP 响应。

<a name="customizing-the-resolution-logic"></a>
#### 自定义解析逻辑

如果你想定义自己的模型绑定解析逻辑，可以使用 `Route::bind` 方法。传递给 `bind` 方法的闭包将接收 URI 段的值，并应返回应注入到路由中的类实例。同样，此自定义应在应用 `RouteServiceProvider` 的 `boot` 方法中进行：

    use App\Models\User;
    use Illuminate\Support\Facades\Route;

    /**
     * 定义你的路由模型绑定、模式过滤器等。
     *
     * @return void
     */
    public function boot()
    {
        Route::bind('user', function ($value) {
            return User::where('name', $value)->firstOrFail();
        });

        // ...
    }

或者，你可以在 Eloquent 模型上覆盖 `resolveRouteBinding` 方法。此方法将接收 URI 段的值，并应返回应注入到路由中的类实例：

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

如果路由使用[隐式绑定作用域](#implicit-model-binding-scoping)，`resolveChildRouteBinding` 方法将用于解析父模型的子绑定：

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

<a name="fallback-routes"></a>
## 兜底路由

使用 `Route::fallback` 方法，你可以定义一个在没有其他路由匹配传入请求时执行的路由。通常，未处理的请求会通过应用的异常处理器自动渲染「404」页面。但是，由于你通常会在 `routes/web.php` 文件中定义 `fallback` 路由，`web` 中间件组中的所有中间件都将应用于该路由。你可以根据需要自由添加额外中间件：

    Route::fallback(function () {
        //
    });

> **Warning**  
> 兜底路由应始终是应用注册的最后一个路由。

<a name="rate-limiting"></a>
## 速率限制

<a name="defining-rate-limiters"></a>
### 定义速率限制器

Laravel 包含强大且可自定义的速率限制服务，你可以利用它来限制给定路由或路由组的流量。要开始使用，你应定义满足应用需求的速率限制器配置。通常，这应在应用 `App\Providers\RouteServiceProvider` 类的 `configureRateLimiting` 方法中完成，该方法已包含一个应用于应用 `routes/api.php` 文件中路由的速率限制器定义：

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 配置应用的速率限制器。
 */
protected function configureRateLimiting(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```

速率限制器使用 `RateLimiter` Facade 的 `for` 方法定义。`for` 方法接受速率限制器名称和一个闭包，该闭包返回应应用于分配给速率限制器的路由的限制配置。限制配置是 `Illuminate\Cache\RateLimiting\Limit` 类的实例。此类包含有用的「构建器」方法，让你快速定义限制。速率限制器名称可以是你希望的任何字符串：

    use Illuminate\Cache\RateLimiting\Limit;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\RateLimiter;

    /**
     * 配置应用的速率限制器。
     *
     * @return void
     */
    protected function configureRateLimiting()
    {
        RateLimiter::for('global', function (Request $request) {
            return Limit::perMinute(1000);
        });
    }

如果传入请求超过指定的速率限制，Laravel 将自动返回带有 429 HTTP 状态码的响应。如果你想定义速率限制应返回的自定义响应，可以使用 `response` 方法：

    RateLimiter::for('global', function (Request $request) {
        return Limit::perMinute(1000)->response(function (Request $request, array $headers) {
            return response('Custom response...', 429, $headers);
        });
    });

由于速率限制器回调接收传入 HTTP 请求实例，你可以根据传入请求或已认证用户动态构建适当的速率限制：

    RateLimiter::for('uploads', function (Request $request) {
        return $request->user()->vipCustomer()
                    ? Limit::none()
                    : Limit::perMinute(100);
    });

<a name="segmenting-rate-limits"></a>
#### 分段速率限制

有时你可能希望按某个任意值对速率限制进行分段。例如，你可能希望允许用户每个 IP 地址每分钟访问给定路由 100 次。为此，在构建速率限制时可以使用 `by` 方法：

    RateLimiter::for('uploads', function (Request $request) {
        return $request->user()->vipCustomer()
                    ? Limit::none()
                    : Limit::perMinute(100)->by($request->ip());
    });

用另一个示例说明此功能，我们可以将路由访问限制为每个已认证用户 ID 每分钟 100 次，或每个 IP 地址每分钟 10 次（对于访客）：

    RateLimiter::for('uploads', function (Request $request) {
        return $request->user()
                    ? Limit::perMinute(100)->by($request->user()->id)
                    : Limit::perMinute(10)->by($request->ip());
    });

<a name="multiple-rate-limits"></a>
#### 多重速率限制

如果需要，你可以为给定速率限制器配置返回一组速率限制。每个速率限制将根据其在数组中的放置顺序对路由进行评估：

    RateLimiter::for('login', function (Request $request) {
        return [
            Limit::perMinute(500),
            Limit::perMinute(3)->by($request->input('email')),
        ];
    });

<a name="attaching-rate-limiters-to-routes"></a>
### 将速率限制器附加到路由

可以使用 `throttle` [中间件](/docs/{{version}}/middleware)将速率限制器附加到路由或路由分组。throttle 中间件接受你希望分配给路由的速率限制器名称：

    Route::middleware(['throttle:uploads'])->group(function () {
        Route::post('/audio', function () {
            //
        });

        Route::post('/video', function () {
            //
        });
    });

<a name="throttling-with-redis"></a>
#### 使用 Redis 进行限流

通常，`throttle` 中间件映射到 `Illuminate\Routing\Middleware\ThrottleRequests` 类。此映射在应用的 HTTP 内核（`App\Http\Kernel`）中定义。但是，如果你使用 Redis 作为应用的缓存驱动，可能希望更改此映射以使用 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` 类。此类在使用 Redis 管理速率限制时更高效：

    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,

<a name="form-method-spoofing"></a>
## 表单方法伪装

HTML 表单不支持 `PUT`、`PATCH` 或 `DELETE` 动作。因此，当定义从 HTML 表单调用的 `PUT`、`PATCH` 或 `DELETE` 路由时，你需要向表单添加一个隐藏的 `_method` 字段。`_method` 字段发送的值将用作 HTTP 请求方法：

    <form action="/example" method="POST">
        <input type="hidden" name="_method" value="PUT">
        <input type="hidden" name="_token" value="{{ csrf_token() }}">
    </form>

为方便起见，你可以使用 `@method` [Blade 指令](/docs/{{version}}/blade)生成 `_method` 输入字段：

    <form action="/example" method="POST">
        @method('PUT')
        @csrf
    </form>

<a name="accessing-the-current-route"></a>
## 访问当前路由

你可以使用 `Route` Facade 上的 `current`、`currentRouteName` 和 `currentRouteAction` 方法访问有关处理传入请求的路由的信息：

    use Illuminate\Support\Facades\Route;

    $route = Route::current(); // Illuminate\Routing\Route
    $name = Route::currentRouteName(); // string
    $action = Route::currentRouteAction(); // string

你可以查阅 [Route Facade 底层类](https://laravel.com/api/{{version}}/Illuminate/Routing/Router.html)和 [Route 实例](https://laravel.com/api/{{version}}/Illuminate/Routing/Route.html)的 API 文档，查看路由器和路由类上可用的所有方法。

<a name="cors"></a>
## 跨域资源共享（CORS）

Laravel 可以使用你配置的值自动响应 CORS `OPTIONS` HTTP 请求。所有 CORS 设置可在应用的 `config/cors.php` 配置文件中配置。`OPTIONS` 请求将由默认包含在全局中间件堆栈中的 `HandleCors` [中间件](/docs/{{version}}/middleware)自动处理。你的全局中间件堆栈位于应用的 HTTP 内核（`App\Http\Kernel`）。

> **Note**  
> 有关 CORS 和 CORS 头的更多信息，请查阅 [MDN Web 文档关于 CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers)。

<a name="route-caching"></a>
## 路由缓存

将应用部署到生产环境时，你应利用 Laravel 的路由缓存。使用路由缓存将大幅减少注册所有应用路由所需的时间。要生成路由缓存，执行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

运行此命令后，你的缓存路由文件将在每次请求时加载。请记住，如果添加任何新路由，你需要生成新的路由缓存。因此，你应仅在项目部署期间运行 `route:cache` 命令。

你可以使用 `route:clear` 命令清除路由缓存：

```shell
php artisan route:clear
```
