# HTTP 响应

- [创建响应](#creating-responses)
    - [给响应添加标头](#attaching-headers-to-responses)
    - [给响应添加 Cookie](#attaching-cookies-to-responses)
    - [Cookie 与加密](#cookies-and-encryption)
- [重定向](#redirects)
    - [重定向到命名路由](#redirecting-named-routes)
    - [重定向到控制器动作](#redirecting-controller-actions)
    - [重定向到外部域名](#redirecting-external-domains)
    - [携带闪存会话数据重定向](#redirecting-with-flashed-session-data)
- [其它响应类型](#other-response-types)
    - [视图响应](#view-responses)
    - [JSON 响应](#json-responses)
    - [文件下载](#file-downloads)
    - [文件响应](#file-responses)
    - [流式响应](#streamed-responses)
- [响应宏](#response-macros)

<a name="creating-responses"></a>
## 创建响应

<a name="strings-arrays"></a>
#### 字符串与数组

所有路由和控制器都应当返回一个响应，以便发送回用户浏览器。Laravel 提供了多种返回响应的方式。最基本的响应是从路由或控制器中返回一个字符串，框架会自动把该字符串转换为完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串，你也可以返回数组。框架会自动把该数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> [!NOTE]
> 你知道也可以从路由或控制器返回 [Eloquent 集合](/docs/{{version}}/eloquent-collections)吗？它们会被自动转换为 JSON。快来试试吧！

<a name="response-objects"></a>
#### 响应对象

通常，你从路由动作中返回的不是简单字符串或数组，而是完整的 `Illuminate\Http\Response` 实例或[视图](/docs/{{version}}/views)。

返回完整的 `Response` 实例让你可以自定义响应的 HTTP 状态码和标头。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了多种构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
        ->header('Content-Type', 'text/plain');
});
```

<a name="eloquent-models-and-collections"></a>
#### Eloquent 模型与集合

你也可以直接从路由和控制器返回 [Eloquent ORM](/docs/{{version}}/eloquent) 模型与集合。这样做时，Laravel 会自动把模型和集合转换为 JSON 响应，同时遵守模型的[隐藏属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

<a name="attaching-headers-to-responses"></a>
### 给响应添加标头

请注意，大多数响应方法都是可链式调用的，可以用它流畅地构建响应实例。例如，你可以使用 `header` 方法在把响应发送回用户之前为其添加一系列标头：

```php
return response($content)
    ->header('Content-Type', $type)
    ->header('X-Header-One', 'Header Value')
    ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定要添加到响应上的标头数组：

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

Laravel 内置了一个 `cache.headers` 中间件，可用于快速为一组路由设置 `Cache-Control` 标头。指令应以对应缓存控制指令的"蛇形命名"形式提供，并用分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希会自动被设为 ETag 标识：

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
### 给响应添加 Cookie

你可以使用 `cookie` 方法给传出的 `Illuminate\Http\Response` 实例附加一个 Cookie。调用该方法时应传入名称、值以及该 Cookie 被视为有效的分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受几个使用频率较低的参数。一般来说，这些参数的作用和含义与传给 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法的参数相同：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你希望确保某个 Cookie 随传出的响应一起发送，但手中还没有该响应的实例，可以使用 `Cookie` Facade 把 Cookie "排队"，以便在响应发送时附加上去。`queue` 方法接受创建 Cookie 实例所需的参数。这些 Cookie 会在响应被发送到浏览器之前附加到响应上：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

<a name="generating-cookie-instances"></a>
#### 生成 Cookie 实例

如果你想生成一个 `Symfony\Component\HttpFoundation\Cookie` 实例，以便稍后附加到某个响应实例上，可以使用全局 `cookie` 辅助函数。除非把它附加到响应实例上，否则该 Cookie 不会被发送回客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

<a name="expiring-cookies-early"></a>
#### 提前让 Cookie 过期

你可以通过传出响应的 `withoutCookie` 方法让某个 Cookie 过期，从而将其移除：

```php
return response('Hello World')->withoutCookie('name');
```

如果你手中还没有传出响应的实例，可以使用 `Cookie` Facade 的 `expire` 方法让某个 Cookie 过期：

```php
Cookie::expire('name');
```

<a name="cookies-and-encryption"></a>
### Cookie 与加密

默认情况下，得益于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件，Laravel 生成的所有 Cookie 都经过加密和签名，客户端无法修改或读取它们。如果你想对应用生成的部分 Cookie 禁用加密，可以在应用的 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

<a name="redirects"></a>
## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含把用户重定向到另一个 URL 所需的正确标头。生成 `RedirectResponse` 实例有多种方式。最简单的方法是使用全局 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('/home/dashboard');
});
```

有时你可能希望把用户重定向回他之前的位置，例如提交的表单无效时。可以通过全局 `back` 辅助函数做到这一点。由于该特性使用了[会话](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用了 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // 验证请求……

    return back()->withInput();
});
```

<a name="redirecting-named-routes"></a>
### 重定向到命名路由

不带参数调用 `redirect` 辅助函数时，会返回一个 `Illuminate\Routing\Redirector` 实例，你可以在该 `Redirector` 实例上调用任意方法。例如，要生成指向某个命名路由的 `RedirectResponse`，可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果你的路由带有参数，可以把它们作为 `route` 方法的第二个参数传入：

```php
// 对于具有如下 URI 的路由：/profile/{id}

return redirect()->route('profile', ['id' => 1]);
```

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到一个带有"ID"参数的路由，且该参数来自 Eloquent 模型，可以直接把模型本身传过去，ID 会被自动提取：

```php
// 对于具有如下 URI 的路由：/profile/{id}

return redirect()->route('profile', [$user]);
```

如果你想自定义放入路由参数的值，可以在路由参数定义中指定列（`/profile/{id:slug}`），也可以覆盖 Eloquent 模型上的 `getRouteKey` 方法：

```php
/**
 * 获取该模型的路由键值。
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

<a name="redirecting-controller-actions"></a>
### 重定向到控制器动作

你也可以生成指向[控制器动作](/docs/{{version}}/controllers)的重定向。为此，把控制器和动作名传给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果你的控制器路由需要参数，可以把它们作为 `action` 方法的第二个参数传入：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

<a name="redirecting-external-domains"></a>
### 重定向到外部域名

有时你可能需要重定向到应用之外的域名。可以调用 `away` 方法做到这一点，它会创建一个 `RedirectResponse`，且不附带任何额外的 URL 编码、验证或校验：

```php
return redirect()->away('https://www.google.com');
```

<a name="redirecting-with-flashed-session-data"></a>
### 携带闪存会话数据重定向

重定向到新 URL 与[把数据闪存到会话](/docs/{{version}}/session#flash-data)通常会同时进行。一般是在成功执行某个操作后，把一条成功消息闪存到会话中。为方便起见，你可以用一条流畅的方法链创建一个 `RedirectResponse` 实例并把数据闪存到会话：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('/dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，你可以显示来自[会话](/docs/{{version}}/session)的闪存消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

<a name="redirecting-with-input"></a>
#### 携带输入重定向

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在把用户重定向到新位置之前把当前请求的输入数据闪存到会话中。这通常在用户遇到验证错误时进行。输入被闪存到会话后，你可以在下一次请求中轻松地[取回它](/docs/{{version}}/requests#retrieving-old-input)来重新填充表单：

```php
return back()->withInput();
```

<a name="other-response-types"></a>
## 其它响应类型

`response` 辅助函数可用于生成其它类型的响应实例。不带参数调用 `response` 辅助函数时，会返回一个 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/docs/{{version}}/contracts)的实现。该契约提供了若干便于生成响应的方法。

<a name="view-responses"></a>
### 视图响应

如果你需要控制响应的状态和标头，同时又要把[视图](/docs/{{version}}/views)作为响应内容返回，应使用 `view` 方法：

```php
return response()
    ->view('hello', $data, 200)
    ->header('Content-Type', $type);
```

当然，如果你不需要传入自定义 HTTP 状态码或自定义标头，可以使用全局 `view` 辅助函数。

<a name="json-responses"></a>
### JSON 响应

`json` 方法会自动把 `Content-Type` 标头设置为 `application/json`，并使用 PHP 的 `json_encode` 函数把给定数组转换为 JSON：

```php
return response()->json([
    'name' => 'Abigail',
    'state' => 'CA',
]);
```

如果你想创建 JSONP 响应，可以把 `json` 方法与 `withCallback` 方法结合使用：

```php
return response()
    ->json(['name' => 'Abigail', 'state' => 'CA'])
    ->withCallback($request->input('callback'));
```

<a name="file-downloads"></a>
### 文件下载

`download` 方法可用于生成一个响应，强制用户浏览器下载指定路径上的文件。`download` 方法的第二个参数接收文件名，它决定用户下载文件时看到的文件名。最后，你还可以把一组 HTTP 标头数组作为该方法的第三个参数传入：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 负责管理文件下载的 Symfony HttpFoundation 要求被下载的文件使用 ASCII 文件名。

<a name="file-responses"></a>
### 文件响应

`file` 方法可用于在用户浏览器中直接显示文件（例如图片或 PDF），而不触发下载。该方法的第一个参数接收文件的绝对路径，第二个参数接收一组标头数组：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

<a name="streamed-responses"></a>
### 流式响应

在数据生成的同时就把它流式发送给客户端，可以显著降低内存占用并提升性能，对于非常大的响应尤其如此。流式响应允许客户端在服务器尚未发送完毕时就开始处理数据：

```php
function streamedContent(): Generator {
    yield 'Hello, ';
    yield 'World!';
}

Route::get('/stream', function () {
    return response()->stream(function (): void {
        foreach (streamedContent() as $chunk) {
            echo $chunk;
            ob_flush();
            flush();
            sleep(2); // 模拟各块之间的延迟……
        }
    }, 200, ['X-Accel-Buffering' => 'no']);
});
```

> [!NOTE]
> 在内部，Laravel 使用 PHP 的输出缓冲功能。如上面的例子所示，你应当使用 `ob_flush` 和 `flush` 函数把缓冲内容推送给客户端。

<a name="streamed-json-responses"></a>
#### 流式 JSON 响应

如果你需要增量地流式发送 JSON 数据，可以使用 `streamJson` 方法。该方法对于需要以易于被 JavaScript 解析的格式逐步发送到浏览器的大型数据集尤其有用：

```php
use App\Models\User;

Route::get('/users.json', function () {
    return response()->streamJson([
        'users' => User::cursor(),
    ]);
});
```

<a name="event-streams"></a>
#### 事件流

`eventStream` 方法可用于返回 `text/event-stream` 内容类型的服务器推送事件（SSE）流式响应。`eventStream` 方法接受一个闭包，随着响应陆续可用，该闭包应当把它们[产出](https://www.php.net/manual/en/language.generators.overview.php)到流中：

```php
Route::get('/chat', function () {
    return response()->eventStream(function () {
        $stream = OpenAI::client()->chat()->createStreamed(...);

        foreach ($stream as $response) {
            yield $response->choices[0];
        }
    });
});
```

你的应用前端可以通过 [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) 对象消费该事件流。流完成时，`eventStream` 方法会自动向事件流发送一个 `</stream>` 更新：

```js
const source = new EventSource('/chat');

source.addEventListener('update', (event) => {
    if (event.data === '</stream>') {
        source.close();

        return;
    }

    console.log(event.data);
})
```

<a name="streamed-downloads"></a>
#### 流式下载

有时你可能希望把某个操作的字符串响应变成可下载的响应，而不必把操作内容写入磁盘。这种情况下可以使用 `streamDownload` 方法。该方法接受一个回调、文件名以及可选的标头数组作为参数：

```php
use App\Services\GitHub;

return response()->streamDownload(function () {
    echo GitHub::api('repo')
        ->contents()
        ->readme('laravel', 'laravel')['contents'];
}, 'laravel-readme.md');
```

<a name="response-macros"></a>
## 响应宏

如果你想定义一个自定义响应，以便在各种路由和控制器中重复使用，可以在 `Response` Facade 上使用 `macro` 方法。通常，你应当从应用中某个[服务提供者](/docs/{{version}}/providers)（例如 `App\Providers\AppServiceProvider` 服务提供者）的 `boot` 方法中调用该方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Response::macro('caps', function (string $value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数的第一个参数接收一个名称，第二个参数接收一个闭包。当从 `ResponseFactory` 实现或 `response` 辅助函数调用该宏名称时，宏的闭包就会被执行：

```php
return response()->caps('foo');
```