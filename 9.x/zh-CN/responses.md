# HTTP 响应

- [创建响应](#creating-responses)
    - [为响应附加响应头](#attaching-headers-to-responses)
    - [为响应附加 Cookie](#attaching-cookies-to-responses)
    - [Cookie 与加密](#cookies-and-encryption)
- [重定向](#redirects)
    - [重定向到命名路由](#redirecting-named-routes)
    - [重定向到控制器动作](#redirecting-controller-actions)
    - [重定向到外部域名](#redirecting-external-domains)
    - [带闪存 Session 数据的重定向](#redirecting-with-flashed-session-data)
- [其他响应类型](#other-response-types)
    - [视图响应](#view-responses)
    - [JSON 响应](#json-responses)
    - [文件下载](#file-downloads)
    - [文件响应](#file-responses)
- [响应宏](#response-macros)

<a name="creating-responses"></a>
## 创建响应

<a name="strings-arrays"></a>
#### 字符串与数组

所有路由和控制器都应返回一个响应，以便发送回用户浏览器。Laravel 提供了几种不同的方式来返回响应。最基本的响应是从路由或控制器返回一个字符串。框架会自动将字符串转换为完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串外，还可以返回数组。框架会自动将数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> **注意**
> 你知道吗？你也可以从路由或控制器返回 [Eloquent 集合](/docs/{{version}}/eloquent-collections)。它们会自动转换为 JSON。试一下吧！

<a name="response-objects"></a>
#### 响应对象

通常，你不会只从路由动作中返回简单的字符串或数组。相反，你会返回完整的 `Illuminate\Http\Response` 实例或[视图](/docs/{{version}}/views)。

返回完整的 `Response` 实例允许你自定义响应的 HTTP 状态码和响应头。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了多种构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
                  ->header('Content-Type', 'text/plain');
});
```

<a name="eloquent-models-and-collections"></a>
#### Eloquent 模型与集合

你也可以直接从路由和控制器返回 [Eloquent ORM](/docs/{{version}}/eloquent) 模型和集合。这样做时，Laravel 会自动将模型和集合转换为 JSON 响应，同时遵循模型的[隐藏属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

<a name="attaching-headers-to-responses"></a>
### 为响应附加响应头

请记住，大多数响应方法都支持链式调用，允许流式构建响应实例。例如，你可以使用 `header` 方法在将响应发送回用户之前为其添加一系列响应头：

```php
return response($content)
            ->header('Content-Type', $type)
            ->header('X-Header-One', 'Header Value')
            ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定一个要添加到响应的响应头数组：

```php
return response($content)
            ->withHeaders([
                'Content-Type' => $type,
                'X-Header-One' => 'Header Value',
                'X-Header-Two' => 'Header Value',
            ]);
```

<a name="cache-control-middleware"></a>
#### 缓存控制中间件

Laravel 包含一个 `cache.headers` 中间件（Middleware），可用于为一组路由快速设置 `Cache-Control` 响应头。指令应使用对应 cache-control 指令的「蛇形命名」（snake case）等价形式提供，并用分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希将自动设置为 ETag 标识符：

```php
Route::middleware('cache.headers:public;max_age=2628000;etag')->group(function () {
    Route::get('/privacy', function () {
        // ...
    });

    Route::get('/terms', function () {
        // ...
    });
});
```

<a name="attaching-cookies-to-responses"></a>
### 为响应附加 Cookie

你可以使用 `cookie` 方法将一个 cookie 附加到输出的 `Illuminate\Http\Response` 实例上。你应该向该方法传递 cookie 的名称、值以及有效分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受几个较少使用的参数。通常，这些参数的目的和含义与 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法的参数相同：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你想确保某个 cookie 随输出响应一起发送，但还没有该响应的实例，可以使用 `Cookie` Facade 来「排队」cookie，以便在响应发送时附加到响应上。`queue` 方法接受创建 cookie 实例所需的参数。这些 cookie 会在响应发送到浏览器之前附加到输出响应上：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

<a name="generating-cookie-instances"></a>
#### 生成 Cookie 实例

如果你想生成一个 `Symfony\Component\HttpFoundation\Cookie` 实例，以便稍后附加到响应实例上，可以使用全局 `cookie` 助手函数。除非将此 cookie 附加到响应实例上，否则它不会发送回客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

<a name="expiring-cookies-early"></a>
#### 提前过期 Cookie

你可以通过输出响应的 `withoutCookie` 方法使 cookie 过期来将其移除：

```php
return response('Hello World')->withoutCookie('name');
```

如果还没有输出响应的实例，可以使用 `Cookie` Facade 的 `expire` 方法使 cookie 过期：

```php
Cookie::expire('name');
```

<a name="cookies-and-encryption"></a>
### Cookie 与加密

默认情况下，Laravel 生成的所有 cookie 都经过加密和签名，以确保客户端无法修改或读取。如果你想对应用程序生成的部分 cookie 禁用加密，可以使用位于 `app/Http/Middleware` 目录下的 `App\Http\Middleware\EncryptCookies` 中间件的 `$except` 属性：

```php
/**
 * 不应加密的 cookie 名称。
 *
 * @var array
 */
protected $except = [
    'cookie_name',
];
```

<a name="redirects"></a>
## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的适当响应头。有多种方式可以生成 `RedirectResponse` 实例。最简单的方法是使用全局 `redirect` 助手函数：

```php
Route::get('/dashboard', function () {
    return redirect('home/dashboard');
});
```

有时你可能希望将用户重定向到之前的位置，例如当提交的表单无效时。你可以使用全局 `back` 助手函数来实现。由于此功能使用了 [session](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用了 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // 验证请求...

    return back()->withInput();
});
```

<a name="redirecting-named-routes"></a>
### 重定向到命名路由

当你不带参数调用 `redirect` 助手函数时，会返回一个 `Illuminate\Routing\Redirector` 实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成指向命名路由的 `RedirectResponse`，可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果路由有参数，可以将它们作为第二个参数传递给 `route` 方法：

```php
// 对于 URI 为 /profile/{id} 的路由

return redirect()->route('profile', ['id' => 1]);
```

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到带有「ID」参数的路由，且该参数来自 Eloquent 模型，可以直接传递模型本身。ID 会被自动提取：

```php
// 对于 URI 为 /profile/{id} 的路由

return redirect()->route('profile', [$user]);
```

如果你想自定义放入路由参数的值，可以在路由参数定义（`/profile/{id:slug}`）中指定列，或者在 Eloquent 模型上重写 `getRouteKey` 方法：

```php
/**
 * 获取模型路由键的值。
 *
 * @return mixed
 */
public function getRouteKey()
{
    return $this->slug;
}
```

<a name="redirecting-controller-actions"></a>
### 重定向到控制器动作

你也可以生成指向[控制器动作](/docs/{{version}}/controllers)的重定向。为此，将控制器和动作名称传递给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果控制器路由需要参数，可以将它们作为第二个参数传递给 `action` 方法：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

<a name="redirecting-external-domains"></a>
### 重定向到外部域名

有时你可能需要重定向到应用程序之外的域名。你可以调用 `away` 方法来实现，该方法创建的 `RedirectResponse` 不会进行任何额外的 URL 编码、验证或检查：

```php
return redirect()->away('https://www.google.com');
```

<a name="redirecting-with-flashed-session-data"></a>
### 带闪存 Session 数据的重定向

重定向到新 URL 和[将数据闪存到 session](/docs/{{version}}/session#flash-data) 通常同时进行。通常，这是在成功执行操作后将成功消息闪存到 session 时完成的。为方便起见，你可以在一个流畅的方法链中创建 `RedirectResponse` 实例并将数据闪存到 session：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，你可以从 [session](/docs/{{version}}/session) 中显示闪存的消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

<a name="redirecting-with-input"></a>
### 带输入数据的重定向

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前，将当前请求的输入数据闪存到 session。这通常在用户遇到验证错误时完成。一旦输入数据闪存到 session，你就可以在下一次请求期间轻松[获取它](/docs/{{version}}/requests#retrieving-old-input)以重新填充表单：

```php
return back()->withInput();
```

<a name="other-response-types"></a>
## 其他响应类型

`response` 助手函数可用于生成其他类型的响应实例。当不带参数调用 `response` 助手函数时，会返回 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/docs/{{version}}/contracts) 的一个实现。该契约提供了几种有用的方法来生成响应。

<a name="view-responses"></a>
### 视图响应

如果你需要控制响应的状态和响应头，同时又需要返回一个[视图](/docs/{{version}}/views)作为响应内容，应该使用 `view` 方法：

```php
return response()
            ->view('hello', $data, 200)
            ->header('Content-Type', $type);
```

当然，如果不需要传递自定义 HTTP 状态码或自定义响应头，可以使用全局 `view` 助手函数。

<a name="json-responses"></a>
### JSON 响应

`json` 方法会自动将 `Content-Type` 响应头设置为 `application/json`，并使用 PHP 的 `json_encode` 函数将给定数组转换为 JSON：

```php
return response()->json([
    'name' => 'Abigail',
    'state' => 'CA',
]);
```

如果你想创建 JSONP 响应，可以将 `json` 方法与 `withCallback` 方法结合使用：

```php
return response()
            ->json(['name' => 'Abigail', 'state' => 'CA'])
            ->withCallback($request->input('callback'));
```

<a name="file-downloads"></a>
### 文件下载

`download` 方法可用于生成一个响应，强制用户浏览器下载指定路径的文件。`download` 方法接受文件名作为第二个参数，该参数决定了用户下载文件时看到的文件名。最后，你可以将一个 HTTP 响应头数组作为第三个参数传递给该方法：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> **警告**
> 管理文件下载的 Symfony HttpFoundation 要求被下载的文件具有 ASCII 文件名。

<a name="streamed-downloads"></a>
#### 流式下载

有时你可能希望将某个操作的字符串响应转换为可下载的响应，而无需将操作内容写入磁盘。在这种情况下，可以使用 `streamDownload` 方法。该方法接受回调函数、文件名和可选的响应头数组作为参数：

```php
use App\Services\GitHub;

return response()->streamDownload(function () {
    echo GitHub::api('repo')
                ->contents()
                ->readme('laravel', 'laravel')['contents'];
}, 'laravel-readme.md');
```

<a name="file-responses"></a>
### 文件响应

`file` 方法可用于在用户浏览器中直接显示文件（如图片或 PDF），而不是触发下载。该方法接受文件路径作为第一个参数，响应头数组作为第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

<a name="response-macros"></a>
## 响应宏

如果你想定义一个可在多个路由和控制器中复用的自定义响应，可以使用 `Response` Facade 上的 `macro` 方法。通常，你应该从应用程序的某个[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用此方法，例如 `App\Providers\AppServiceProvider` 服务提供者：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任意应用服务。
     *
     * @return void
     */
    public function boot()
    {
        Response::macro('caps', function ($value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数接受名称作为第一个参数，闭包作为第二个参数。当从 `ResponseFactory` 实现或 `response` 助手函数调用宏名称时，宏的闭包将被执行：

```php
return response()->caps('foo');
```