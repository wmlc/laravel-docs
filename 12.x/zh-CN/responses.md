# HTTP 响应

- [创建响应](#creating-responses)
    - [为响应附加 Header](#attaching-headers-to-responses)
    - [为响应附加 Cookie](#attaching-cookies-to-responses)
    - [Cookie 与加密](#cookies-and-encryption)
- [重定向](#redirects)
    - [重定向到命名路由](#redirecting-named-routes)
    - [重定向到控制器动作](#redirecting-controller-actions)
    - [重定向到外部域名](#redirecting-external-domains)
    - [重定向并闪存 Session 数据](#redirecting-with-flashed-session-data)
- [其他响应类型](#other-response-types)
    - [视图响应](#view-responses)
    - [JSON 响应](#json-responses)
    - [文件下载](#file-downloads)
    - [文件响应](#file-responses)
- [流式响应](#streamed-responses)
    - [消费流式响应](#consuming-streamed-responses)
    - [流式 JSON 响应](#streamed-json-responses)
    - [事件流（SSE）](#event-streams)
    - [流式下载](#streamed-downloads)
- [响应宏](#response-macros)

<a name="creating-responses"></a>
## 创建响应

<a name="strings-arrays"></a>
#### 字符串与数组

所有路由和控制器都应当返回一个响应，并发回给用户的浏览器。Laravel 提供了多种返回响应的方式。最基本的响应就是从路由或控制器返回一个字符串。框架会自动将这个字符串转换为完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串之外，你还可以返回数组。框架会自动将数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> [!NOTE]
> 你知道吗？你还可以从路由或控制器返回 [Eloquent 集合](/docs/{{version}}/eloquent-collections)，它们会被自动转换为 JSON。快试试吧！

<a name="response-objects"></a>
#### 响应对象

通常，你不会只在路由动作中返回简单的字符串或数组。你将会返回完整的 `Illuminate\Http\Response` 实例或[视图](/docs/{{version}}/views)。

返回完整的 `Response` 实例允许你自定义响应的 HTTP 状态码和 Header。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了多种构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
        ->header('Content-Type', 'text/plain');
});
```

<a name="eloquent-models-and-collections"></a>
#### Eloquent 模型与集合

你还可以直接从路由和控制器返回 [Eloquent ORM](/docs/{{version}}/eloquent) 模型和集合。这时，Laravel 会自动将模型和集合转换为 JSON 响应，同时遵循模型的[隐藏属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)配置：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

<a name="attaching-headers-to-responses"></a>
### 为响应附加 Header

请记住，大多数响应方法都是可链式调用的，以便流畅地构建响应实例。例如，你可以在将响应发回给用户之前，使用 `header` 方法为响应添加一系列 Header：

```php
return response($content)
    ->header('Content-Type', $type)
    ->header('X-Header-One', 'Header Value')
    ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定一个要添加到响应中的 Header 数组：

```php
return response($content)
    ->withHeaders([
        'Content-Type' => $type,
        'X-Header-One' => 'Header Value',
        'X-Header-Two' => 'Header Value',
    ]);
```

你可以使用 `withoutHeader` 方法从待发送的响应中移除特定的 Header：

```php
return response($content)->withoutHeader('X-Debug');

return response($content)->withoutHeader(['X-Debug', 'X-Powered-By']);
```

<a name="cache-control-middleware"></a>
#### 缓存控制中间件

Laravel 包含一个 `cache.headers` 中间件，可用于快速为一组路由设置 `Cache-Control` Header。指令应当使用相应 cache-control 指令的「snake case」形式提供，并以分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希值将被自动设置为 ETag 标识符：

```php
Route::middleware('cache.headers:public;max_age=30;s_maxage=300;stale_while_revalidate=600;etag')->group(function () {
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

你可以使用 `cookie` 方法将 Cookie 附加到待发送的 `Illuminate\Http\Response` 实例上。你应当向该方法传入 Cookie 的名称、值，以及 Cookie 保持有效的分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受另外几个不太常用的参数。一般来说，这些参数的用途和含义与传给 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法的参数相同：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你想确保某个 Cookie 会随待发送的响应一起发送，但此刻还没有该响应的实例，可以使用 `Cookie` Facade 将 Cookie「排队」，以便在响应发送时附加上。`queue` 方法接受创建 Cookie 实例所需的参数。这些 Cookie 会在待发送的响应发送到浏览器之前，被附加到响应上：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

<a name="generating-cookie-instances"></a>
#### 生成 Cookie 实例

如果你想生成一个 `Symfony\Component\HttpFoundation\Cookie` 实例，以便稍后附加到响应实例上，可以使用全局 `cookie` 辅助函数。除非该 Cookie 被附加到响应实例上，否则它不会被发回给客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

<a name="expiring-cookies-early"></a>
#### 提前过期 Cookie

你可以通过待发送响应的 `withoutCookie` 方法使 Cookie 过期，从而将其移除：

```php
return response('Hello World')->withoutCookie('name');
```

如果你还没有待发送响应的实例，可以使用 `Cookie` Facade 的 `expire` 方法使 Cookie 过期：

```php
Cookie::expire('name');
```

<a name="cookies-and-encryption"></a>
### Cookie 与加密

默认情况下，得益于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件，Laravel 生成的所有 Cookie 都经过加密和签名，客户端无法修改或读取它们。如果你想对应用生成的部分 Cookie 禁用加密，可以在应用的 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

> [!NOTE]
> 一般而言，永远不要禁用 Cookie 加密，否则你的 Cookie 将面临客户端数据泄露和篡改的风险。

<a name="redirects"></a>
## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的相应 Header。生成 `RedirectResponse` 实例的方式有好几种。最简单的方法是使用全局 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('/home/dashboard');
});
```

有时你可能希望将用户重定向到之前的位置，例如提交的表单验证失败时。你可以使用全局 `back` 辅助函数来实现。由于该功能依赖于 [session](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用了 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // 验证请求...

    return back()->withInput();
});
```

<a name="redirecting-named-routes"></a>
### 重定向到命名路由

当你不带参数调用 `redirect` 辅助函数时，会返回一个 `Illuminate\Routing\Redirector` 实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成一个指向命名路由的 `RedirectResponse`，可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果路由带有参数，你可以将它们作为第二个参数传给 `route` 方法：

```php
// 对于 URI 如下的路由：/profile/{id}

return redirect()->route('profile', ['id' => 1]);
```

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到的路由带有一个「ID」参数，而该参数的值来自某个 Eloquent 模型，你可以直接传入模型本身，ID 会被自动提取：

```php
// 对于 URI 如下的路由：/profile/{id}

return redirect()->route('profile', [$user]);
```

如果你想自定义放入路由参数中的值，可以在路由参数定义中指定字段（`/profile/{id:slug}`），或者重写 Eloquent 模型上的 `getRouteKey` 方法：

```php
/**
 * 获取模型路由键的值。
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

<a name="redirecting-controller-actions"></a>
### 重定向到控制器动作

你还可以生成指向[控制器动作](/docs/{{version}}/controllers)的重定向。为此，请将控制器和动作名传给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果你的控制器路由需要参数，可以将它们作为第二个参数传给 `action` 方法：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

<a name="redirecting-external-domains"></a>
### 重定向到外部域名

有时你可能需要重定向到应用之外的域名。你可以调用 `away` 方法来实现，该方法会创建一个不进行任何额外 URL 编码、验证或校验的 `RedirectResponse`：

```php
return redirect()->away('https://www.google.com');
```

<a name="redirecting-with-flashed-session-data"></a>
### 重定向并闪存 Session 数据

重定向到新 URL 与[向 session 闪存数据](/docs/{{version}}/session#flash-data)通常是同时进行的。典型场景是在成功执行某个操作后，将成功消息闪存到 session。为方便起见，你可以在一个流畅的方法链中，同时创建 `RedirectResponse` 实例并向 session 闪存数据：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('/dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向之后，你可以从 [session](/docs/{{version}}/session) 中显示闪存的消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

<a name="redirecting-with-input"></a>
#### 重定向并携带输入

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前，把当前请求的输入数据闪存到 session。这通常在用户遇到验证错误时使用。输入被闪存到 session 之后，你可以在下一次请求中轻松[获取它](/docs/{{version}}/requests#retrieving-old-input)，以便重新填充表单：

```php
return back()->withInput();
```

<a name="other-response-types"></a>
## 其他响应类型

`response` 辅助函数也可用于生成其他类型的响应实例。当不带参数调用 `response` 辅助函数时，会返回 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/docs/{{version}}/contracts)的一个实现。该契约提供了几种用于生成响应的实用方法。

<a name="view-responses"></a>
### 视图响应

如果你既需要控制响应的状态码和 Header，又需要返回一个[视图](/docs/{{version}}/views)作为响应内容，就应当使用 `view` 方法：

```php
return response()
    ->view('hello', $data, 200)
    ->header('Content-Type', $type);
```

当然，如果你不需要传递自定义的 HTTP 状态码或自定义 Header，可以直接使用全局 `view` 辅助函数。

<a name="json-responses"></a>
### JSON 响应

`json` 方法会自动将 `Content-Type` Header 设置为 `application/json`，并使用 PHP 的 `json_encode` 函数将给定的数组转换为 JSON：

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

`download` 方法可用于生成一个强制用户浏览器下载给定路径文件的响应。`download` 方法接受文件名作为第二个参数，该参数决定了用户下载文件时看到的文件名。最后，你可以将一个 HTTP Header 数组作为第三个参数传给该方法：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 管理文件下载的 Symfony HttpFoundation 要求被下载的文件具有 ASCII 文件名。

<a name="file-responses"></a>
### 文件响应

`file` 方法可用于在用户浏览器中直接显示文件（例如图片或 PDF），而非发起下载。该方法接受文件的绝对路径作为第一个参数，接受一个 Header 数组作为第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

<a name="streamed-responses"></a>
## 流式响应

通过在数据生成的同时将其流式发送给客户端，你可以显著降低内存占用并提升性能，对于超大响应尤其如此。流式响应允许客户端在服务器尚未发送完毕时，就开始处理数据：

```php
Route::get('/stream', function () {
    return response()->stream(function (): void {
        foreach (['developer', 'admin'] as $string) {
            echo $string;
            ob_flush();
            flush();
            sleep(2); // 模拟数据块之间的延迟...
        }
    }, 200, ['X-Accel-Buffering' => 'no']);
});
```

为方便起见，如果你提供给 `stream` 方法的闭包返回一个 [Generator](https://www.php.net/manual/en/language.generators.overview.php)，Laravel 会自动在生成器返回的各个字符串之间刷新输出缓冲，并禁用 Nginx 输出缓冲：

```php
Route::post('/chat', function () {
    return response()->stream(function (): Generator {
        $stream = OpenAI::client()->chat()->createStreamed(...);

        foreach ($stream as $response) {
            yield $response->choices[0];
        }
    });
});
```

<a name="consuming-streamed-responses"></a>
### 消费流式响应

流式响应可以使用 Laravel 的 `stream` npm 包来消费，该包为与 Laravel 响应流和事件流交互提供了便捷的 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，就可以使用 `useStream` 来消费事件流。提供流式 URL 之后，当 Laravel 应用不断返回内容时，该 hook 会自动将 `data` 更新为拼接后的响应：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, isFetching, isStreaming, send } = useStream("chat");

    const sendMessage = () => {
        send({
            message: `Current timestamp: ${Date.now()}`,
        });
    };

    return (
        <div>
            <div>{data}</div>
            {isFetching && <div>Connecting...</div>}
            {isStreaming && <div>Generating...</div>}
            <button onClick={sendMessage}>Send Message</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data, isFetching, isStreaming, send } = useStream("chat");

const sendMessage = () => {
    send({
        message: `Current timestamp: ${Date.now()}`,
    });
};
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <div v-if="isFetching">Connecting...</div>
        <div v-if="isStreaming">Generating...</div>
        <button @click="sendMessage">Send Message</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat");

const sendMessage = () => {
    stream.send({
        message: `Current timestamp: ${Date.now()}`,
    });
};
</script>

<div>
    <div>{$stream.data}</div>
    {#if $stream.isFetching}
        <div>Connecting...</div>
    {/if}
    {#if $stream.isStreaming}
        <div>Generating...</div>
    {/if}
    <button onclick={sendMessage}>Send Message</button>
</div>
```

当通过 `send` 向流发送数据时，当前活跃的流连接会先被取消，然后再发送新数据。所有请求都以 JSON `POST` 请求的形式发送。

> [!WARNING]
> 由于 `useStream` hook 会向你的应用发起 `POST` 请求，因此需要有效的 CSRF 令牌。提供 CSRF 令牌最简单的方法，是[在应用布局的 head 中通过 meta 标签引入](/docs/{{version}}/csrf#csrf-x-csrf-token)。

传给 `useStream` 的第二个参数是一个选项对象，你可以用它自定义流消费行为。该对象的默认值如下所示：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data } = useStream("chat", {
        id: undefined,
        initialInput: undefined,
        headers: undefined,
        csrfToken: undefined,
        onResponse: (response: Response) => void,
        onData: (data: string) => void,
        onCancel: () => void,
        onFinish: () => void,
        onError: (error: Error) => void,
    });

    return <div>{data}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data } = useStream("chat", {
    id: undefined,
    initialInput: undefined,
    headers: undefined,
    csrfToken: undefined,
    onResponse: (response: Response) => void,
    onData: (data: string) => void,
    onCancel: () => void,
    onFinish: () => void,
    onError: (error: Error) => void,
});
</script>

<template>
    <div>{{ data }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat", {
    id: undefined,
    initialInput: undefined,
    headers: undefined,
    csrfToken: undefined,
    onResponse: (response) => {},
    onData: (data) => {},
    onCancel: () => {},
    onFinish: () => {},
    onError: (error) => {},
});
</script>

<div>{$stream.data}</div>
```

`onResponse` 在流成功返回初始响应后触发，原始的 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 会被传给回调。`onData` 在每收到一个数据块时调用，当前数据块会被传给回调。`onFinish` 在流结束以及 fetch / 读取循环期间抛出错误时调用。

默认情况下，初始化时不会向流发起请求。你可以通过 `initialInput` 选项向流传递一个初始载荷：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data } = useStream("chat", {
        initialInput: {
            message: "Introduce yourself.",
        },
    });

    return <div>{data}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data } = useStream("chat", {
    initialInput: {
        message: "Introduce yourself.",
    },
});
</script>

<template>
    <div>{{ data }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat", {
    initialInput: {
        message: "Introduce yourself.",
    },
});
</script>

<div>{$stream.data}</div>
```

要手动取消流，可以使用 hook 返回的 `cancel` 方法：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, cancel } = useStream("chat");

    return (
        <div>
            <div>{data}</div>
            <button onClick={cancel}>Cancel</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data, cancel } = useStream("chat");
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <button @click="cancel">Cancel</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat");
</script>

<div>
    <div>{$stream.data}</div>
    <button onclick={() => stream.cancel()}>Cancel</button>
</div>
```

每次使用 `useStream` hook 时，都会生成一个随机的 `id` 来标识该流。该 ID 会随每次请求通过 `X-STREAM-ID` Header 发回给服务器。当从多个组件消费同一个流时，你可以提供自己的 `id` 来读写该流：

```tsx tab=React
// App.tsx
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, id } = useStream("chat");

    return (
        <div>
            <div>{data}</div>
            <StreamStatus id={id} />
        </div>
    );
}

// StreamStatus.tsx
import { useStream } from "@laravel/stream-react";

function StreamStatus({ id }) {
    const { isFetching, isStreaming } = useStream("chat", { id });

    return (
        <div>
            {isFetching && <div>Connecting...</div>}
            {isStreaming && <div>Generating...</div>}
        </div>
    );
}
```

```vue tab=Vue
<!-- App.vue -->
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";
import StreamStatus from "./StreamStatus.vue";

const { data, id } = useStream("chat");
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <StreamStatus :id="id" />
    </div>
</template>

<!-- StreamStatus.vue -->
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const props = defineProps<{
    id: string;
}>();

const { isFetching, isStreaming } = useStream("chat", { id: props.id });
</script>

<template>
    <div>
        <div v-if="isFetching">Connecting...</div>
        <div v-if="isStreaming">Generating...</div>
    </div>
</template>
```

```svelte tab=Svelte
<!-- App.svelte -->
<script>
import { useStream } from "@laravel/stream-svelte";
import StreamStatus from "./StreamStatus.svelte";

const stream = useStream("chat");
</script>

<div>
    <div>{$stream.data}</div>
    <StreamStatus id={stream.id} />
</div>

<!-- StreamStatus.svelte -->
<script>
import { useStream } from "@laravel/stream-svelte";

let { id } = $props();

const stream = useStream("chat", { id });
</script>

<div>
    {#if $stream.isFetching}
        <div>Connecting...</div>
    {/if}
    {#if $stream.isStreaming}
        <div>Generating...</div>
    {/if}
</div>
```

<a name="streamed-json-responses"></a>
### 流式 JSON 响应

如果你需要渐进式地流式发送 JSON 数据，可以使用 `streamJson` 方法。该方法对于需要以 JavaScript 易于解析的格式逐步发送到浏览器的大型数据集尤其有用：

```php
use App\Models\User;

Route::get('/users.json', function () {
    return response()->streamJson([
        'users' => User::cursor(),
    ]);
});
```

`useJsonStream` hook 与 [useStream hook](#consuming-streamed-responses) 的用法相同，区别在于它会在流式传输结束后尝试将数据解析为 JSON：

```tsx tab=React
import { useJsonStream } from "@laravel/stream-react";

type User = {
    id: number;
    name: string;
    email: string;
};

function App() {
    const { data, send } = useJsonStream<{ users: User[] }>("users");

    const loadUsers = () => {
        send({
            query: "taylor",
        });
    };

    return (
        <div>
            <ul>
                {data?.users.map((user) => (
                    <li>
                        {user.id}: {user.name}
                    </li>
                ))}
            </ul>
            <button onClick={loadUsers}>Load Users</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useJsonStream } from "@laravel/stream-vue";

type User = {
    id: number;
    name: string;
    email: string;
};

const { data, send } = useJsonStream<{ users: User[] }>("users");

const loadUsers = () => {
    send({
        query: "taylor",
    });
};
</script>

<template>
    <div>
        <ul>
            <li v-for="user in data?.users" :key="user.id">
                {{ user.id }}: {{ user.name }}
            </li>
        </ul>
        <button @click="loadUsers">Load Users</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useJsonStream } from "@laravel/stream-svelte";

const stream = useJsonStream("users");

const loadUsers = () => {
    stream.send({
        query: "taylor",
    });
};
</script>

<div>
    <ul>
        {#if $stream.data?.users}
            {#each $stream.data.users as user (user.id)}
                <li>{user.id}: {user.name}</li>
            {/each}
        {/if}
    </ul>
    <button onclick={loadUsers}>Load Users</button>
</div>
```

<a name="event-streams"></a>
### 事件流（SSE）

`eventStream` 方法可用于返回一个使用 `text/event-stream` 内容类型的服务器发送事件（SSE）流式响应。`eventStream` 方法接受一个闭包，该闭包应在响应可用时将其 [yield](https://www.php.net/manual/en/language.generators.overview.php) 给流：

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

如果你想自定义事件的名称，可以 yield 一个 `StreamedEvent` 类的实例：

```php
use Illuminate\Http\StreamedEvent;

yield new StreamedEvent(
    event: 'update',
    data: $response->choices[0],
);
```

<a name="consuming-event-streams"></a>
#### 消费事件流

事件流可以使用 Laravel 的 `stream` npm 包来消费，该包为与 Laravel 事件流交互提供了便捷的 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，就可以使用 `useEventStream` 来消费事件流。提供流式 URL 之后，当 Laravel 应用不断返回消息时，该 hook 会自动将 `message` 更新为拼接后的响应：

```jsx tab=React
import { useEventStream } from "@laravel/stream-react";

function App() {
  const { message } = useEventStream("/chat");

  return <div>{message}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useEventStream } from "@laravel/stream-vue";

const { message } = useEventStream("/chat");
</script>

<template>
  <div>{{ message }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useEventStream } from "@laravel/stream-svelte";

const eventStream = useEventStream("/chat");
</script>

<div>{$eventStream.message}</div>
```

传给 `useEventStream` 的第二个参数是一个选项对象，你可以用它自定义流消费行为。该对象的默认值如下所示：

```jsx tab=React
import { useEventStream } from "@laravel/stream-react";

function App() {
  const { message } = useEventStream("/stream", {
    eventName: "update",
    onMessage: (message) => {
      //
    },
    onError: (error) => {
      //
    },
    onComplete: () => {
      //
    },
    endSignal: "</stream>",
    glue: " ",
  });

  return <div>{message}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useEventStream } from "@laravel/stream-vue";

const { message } = useEventStream("/chat", {
  eventName: "update",
  onMessage: (message) => {
    // ...
  },
  onError: (error) => {
    // ...
  },
  onComplete: () => {
    // ...
  },
  endSignal: "</stream>",
  glue: " ",
});
</script>
```

```svelte tab=Svelte
<script>
import { useEventStream } from "@laravel/stream-svelte";

const eventStream = useEventStream("/chat", {
    eventName: "update",
    onMessage: (event) => {
        //
    },
    onError: (error) => {
        //
    },
    onComplete: () => {
        //
    },
    endSignal: "</stream>",
    glue: " ",
    replace: false,
});
</script>
```

事件流也可以由应用前端通过 [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) 对象手动消费。当流结束时，`eventStream` 方法会自动向事件流发送一个 `</stream>` 更新：

```js
const source = new EventSource('/chat');

source.addEventListener('update', (event) => {
    if (event.data === '</stream>') {
        source.close();

        return;
    }

    console.log(event.data);
});
```

要自定义发送到事件流的最后一个事件，可以向 `eventStream` 方法的 `endStreamWith` 参数提供一个 `StreamedEvent` 实例：

```php
return response()->eventStream(function () {
    // ...
}, endStreamWith: new StreamedEvent(event: 'update', data: '</stream>'));
```

<a name="streamed-downloads"></a>
### 流式下载

有时你可能希望将某个操作的字符串结果直接转换为可下载的响应，而无需将该操作的内容写入磁盘。在这种场景下，你可以使用 `streamDownload` 方法。该方法接受一个回调、文件名以及一个可选的 Header 数组作为参数：

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

如果你想定义一个可在多个路由和控制器中复用的自定义响应，可以使用 `Response` Facade 的 `macro` 方法。通常，你应当在应用某个[服务提供者](/docs/{{version}}/providers)（例如 `App\Providers\AppServiceProvider` 服务提供者）的 `boot` 方法中调用该方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导所有应用服务。
     */
    public function boot(): void
    {
        Response::macro('caps', function (string $value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数接受一个名称作为第一个参数，一个闭包作为第二个参数。当通过 `ResponseFactory` 实现或 `response` 辅助函数调用该宏名称时，宏的闭包将被执行：

```php
return response()->caps('foo');
```
