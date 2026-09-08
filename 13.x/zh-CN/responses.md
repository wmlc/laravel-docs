# HTTP 响应

- [创建响应](#creating-responses)
    - [为响应附加请求头](#attaching-headers-to-responses)
    - [为响应附加 Cookie](#attaching-cookies-to-responses)
    - [Cookie 与加密](#cookies-and-encryption)
- [重定向](#redirects)
    - [重定向到命名路由](#redirecting-named-routes)
    - [重定向到控制器动作](#redirecting-controller-actions)
    - [重定向到外部域](#redirecting-external-domains)
    - [使用闪存会话数据重定向](#redirecting-with-flashed-session-data)
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

所有路由和控制器都应返回一个响应，以发送回用户的浏览器。Laravel 提供了几种不同的返回响应方式。最基本的响应是从路由或控制器返回一个字符串。框架将自动将字符串转换为完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串之外，你还可以返回数组。框架将自动将数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> [!NOTE]
> 你知道吗，你也可以从路由或控制器返回 [Eloquent 集合](/docs/{{version}}/eloquent-collections)？它们将自动转换为 JSON。试试看吧！

<a name="response-objects"></a>
#### 响应对象

通常，你不会只是从路由动作返回简单的字符串或数组。相反，你将返回完整的 `Illuminate\Http\Response` 实例或[视图](/docs/{{version}}/views)。

返回完整的 `Response` 实例允许你自定义响应的 HTTP 状态码和请求头。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了多种构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
        ->header('Content-Type', 'text/plain');
});
```

<a name="eloquent-models-and-collections"></a>
#### Eloquent 模型与集合

你也可以直接从路由和控制器返回 [Eloquent ORM](/docs/{{version}}/eloquent) 模型和集合。此时，Laravel 会自动将模型和集合转换为 JSON 响应，同时遵循模型的[隐藏属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

<a name="attaching-headers-to-responses"></a>
### 为响应附加请求头

请记住，大多数响应方法都是可链式调用的，允许你流畅地构建响应实例。例如，你可以使用 `header` 方法在将响应发送回用户之前为响应添加一系列请求头：

```php
return response($content)
    ->header('Content-Type', $type)
    ->header('X-Header-One', 'Header Value')
    ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定要添加到响应中的请求头数组：

```php
return response($content)
    ->withHeaders([
        'Content-Type' => $type,
        'X-Header-One' => 'Header Value',
        'X-Header-Two' => 'Header Value',
    ]);
```

你可以使用 `withoutHeader` 方法从出站响应中移除特定的请求头：

```php
return response($content)->withoutHeader('X-Debug');

return response($content)->withoutHeader(['X-Debug', 'X-Powered-By']);
```

<a name="cache-control-middleware"></a>
#### 缓存控制中间件

Laravel 包含一个 `cache.headers` 中间件，可用于快速为一组路由设置 `Cache-Control` 请求头。指令应使用相应 cache-control 指令的"蛇形命名"等效形式提供，并用分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希将自动设置为 ETag 标识符：

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

你可以使用 `cookie` 方法将 Cookie 附加到出站的 `Illuminate\Http\Response` 实例。你应向此方法传递名称、值和 Cookie 应被视为有效的分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受一些不太常用的额外参数。通常，这些参数与传递给 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法的参数具有相同的目的和含义：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你想确保 Cookie 随出站响应一起发送，但尚没有该响应的实例，可以使用 `Cookie` Facade "排队"Cookie 以在响应发送时附加。`queue` 方法接受创建 Cookie 实例所需的参数。这些 Cookie 将在发送到浏览器之前附加到出站响应：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

<a name="generating-cookie-instances"></a>
#### 生成 Cookie 实例

如果你想生成一个可以在稍后附加到响应实例的 `Symfony\Component\HttpFoundation\Cookie` 实例，可以使用全局 `cookie` 辅助函数。除非该 Cookie 被附加到响应实例，否则不会发送回客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

<a name="expiring-cookies-early"></a>
#### 提前过期 Cookie

你可以通过出站响应的 `withoutCookie` 或 `withoutCookies` 方法使 Cookie 过期来移除它：

```php
return response('Hello World')->withoutCookie('name');

return response('Hello World')->withoutCookies([
    'name',
    'email',
    'preferences',
]);
```

如果你尚没有出站响应的实例，可以使用 `Cookie` Facade 的 `expire` 方法使 Cookie 过期：

```php
Cookie::expire('name');
```

<a name="cookies-and-encryption"></a>
### Cookie 与加密

默认情况下，得益于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件，Laravel 生成的所有 Cookie 都会被加密和签名，因此它们无法被客户端修改或读取。如果你想为应用生成的子集 Cookie 禁用加密，可以在应用 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

> [!NOTE]
> 通常不应禁用 Cookie 加密，因为这会暴露你的 Cookie 并使其面临潜在的客户端数据泄露和篡改风险。

<a name="redirects"></a>
## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的适当请求头。有几种方法可以生成 `RedirectResponse` 实例。最简单的方法是使用全局 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('/home/dashboard');
});
```

有时你可能希望将用户重定向到他们之前的位置，例如当提交的表单无效时。你可以使用全局 `back` 辅助函数实现这一点。由于此功能利用[会话](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // Validate the request...

    return back()->withInput();
});
```

<a name="redirecting-named-routes"></a>
### 重定向到命名路由

当你无参数调用 `redirect` 辅助函数时，会返回 `Illuminate\Routing\Redirector` 的实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成指向命名路由的 `RedirectResponse`，可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果你的路由有参数，可以将它们作为第二个参数传递给 `route` 方法：

```php
// For a route with the following URI: /profile/{id}

return redirect()->route('profile', ['id' => 1]);
```

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到具有从 Eloquent 模型填充的"ID"参数的路由，可以直接传递模型本身。ID 将被自动提取：

```php
// For a route with the following URI: /profile/{id}

return redirect()->route('profile', [$user]);
```

如果你想自定义放入路由参数中的值，可以在路由参数定义中指定列（`/profile/{id:slug}`），也可以在 Eloquent 模型上覆盖 `getRouteKey` 方法：

```php
/**
 * Get the value of the model's route key.
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

<a name="redirecting-controller-actions"></a>
### 重定向到控制器动作

你也可以生成指向[控制器动作](/docs/{{version}}/controllers)的重定向。为此，请将控制器和动作名称传递给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果你的控制器路由需要参数，可以将它们作为第二个参数传递给 `action` 方法：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

<a name="redirecting-external-domains"></a>
### 重定向到外部域

有时你可能需要重定向到应用之外的域。你可以通过调用 `away` 方法来实现，它会创建一个不带任何额外 URL 编码、验证或检查的 `RedirectResponse`：

```php
return redirect()->away('https://www.google.com');
```

<a name="redirecting-with-flashed-session-data"></a>
### 使用闪存会话数据重定向

重定向到新 URL 并[向会话闪存数据](/docs/{{version}}/session#flash-data)通常是同时进行的。通常，这是在成功执行操作后向会话闪存成功消息时进行的。为方便起见，你可以通过单个流畅的方法链创建 `RedirectResponse` 实例并向会话闪存数据：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('/dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，你可以从[会话](/docs/{{version}}/session)中显示闪存消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

<a name="redirecting-with-input"></a>
#### 携带输入重定向

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前将当前请求的输入数据闪存到会话。这通常在用户遇到验证错误时进行。输入被闪存到会话后，你可以在下一次请求期间轻松[检索它](/docs/{{version}}/requests#retrieving-old-input)以重新填充表单：

```php
return back()->withInput();
```

<a name="other-response-types"></a>
## 其他响应类型

`response` 辅助函数可用于生成其他类型的响应实例。当 `response` 辅助函数无参数调用时，会返回 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/docs/{{version}}/contracts)的实现。该契约提供了几种用于生成响应的实用方法。

<a name="view-responses"></a>
### 视图响应

如果你需要控制响应的状态和请求头，但又需要将[视图](/docs/{{version}}/views)作为响应内容返回，应使用 `view` 方法：

```php
return response()
    ->view('hello', $data, 200)
    ->header('Content-Type', $type);
```

当然，如果你不需要传递自定义 HTTP 状态码或自定义请求头，可以使用全局 `view` 辅助函数。

<a name="json-responses"></a>
### JSON 响应

`json` 方法将自动将 `Content-Type` 请求头设置为 `application/json`，并使用 `json_encode` PHP 函数将给定数组转换为 JSON：

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

`download` 方法可用于生成强制用户浏览器下载给定路径文件的响应。`download` 方法接受一个文件名作为方法的第二个参数，它将决定下载文件的用户看到的文件名。最后，你可以将 HTTP 请求头数组作为方法的第三个参数传递：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 管理文件下载的 Symfony HttpFoundation 要求被下载的文件具有 ASCII 文件名。

<a name="file-responses"></a>
### 文件响应

`file` 方法可用于直接在用户浏览器中显示文件（如图片或 PDF），而不是启动下载。此方法接受文件的绝对路径作为第一个参数，请求头数组作为第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

<a name="streamed-responses"></a>
## 流式响应

通过在生成数据时将数据流式传输给客户端，你可以显著减少内存使用并提高性能，尤其是对于非常大的响应。流式响应允许客户端在服务器完成发送之前就开始处理数据：

```php
Route::get('/stream', function () {
    return response()->stream(function (): void {
        foreach (['developer', 'admin'] as $string) {
            echo $string;
            ob_flush();
            flush();
            sleep(2); // Simulate delay between chunks...
        }
    }, 200, ['X-Accel-Buffering' => 'no']);
});
```

为方便起见，如果你提供给 `stream` 方法的闭包返回一个 [Generator](https://www.php.net/manual/en/language.generators.overview.php)，Laravel 将自动刷新生成器返回的字符串之间的输出缓冲区，并禁用 Nginx 输出缓冲：

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

可以使用 Laravel 的 `stream` npm 包消费流式响应，它提供了与 Laravel 响应和事件流交互的便捷 API。要开始，请安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useStream` 消费事件流。提供流 URL 后，随着内容从 Laravel 应用返回，该 hook 将自动用拼接的响应更新 `data`：

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

通过 `send` 将数据发送回流时，与流的活动连接会在发送新数据之前被取消。所有请求都作为 JSON `POST` 请求发送。

> [!WARNING]
> 由于 `useStream` hook 会向你的应用发起 `POST` 请求，因此需要有效的 CSRF 令牌。提供 CSRF 令牌的最简单方法是[通过应用布局头部中的 meta 标签包含它](/docs/{{version}}/csrf#csrf-x-csrf-token)。

提供给 `useStream` 的第二个参数是一个 options 对象，你可以使用它来自定义流消费行为。此对象的默认值如下所示：

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

`onResponse` 在流成功返回初始响应后触发，原始 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 会传递给回调。`onData` 在收到每个块时被调用——当前块会传递给回调。`onFinish` 在流完成以及 fetch / read 周期中抛出错误时被调用。

默认情况下，初始化时不会向流发起请求。你可以使用 `initialInput` 选项向流传递初始负载：

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

每次使用 `useStream` hook 时，都会生成一个随机的 `id` 来标识流。它会随每个请求在 `X-STREAM-ID` 请求头中发送回服务器。当从多个组件消费同一个流时，你可以通过提供自己的 `id` 来读写流：

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

如果你需要增量流式传输 JSON 数据，可以使用 `streamJson` 方法。此方法特别适用于需要以易于 JavaScript 解析的格式渐进发送到浏览器的大型数据集：

```php
use App\Models\User;

Route::get('/users.json', function () {
    return response()->streamJson([
        'users' => User::cursor(),
    ]);
});
```

`useJsonStream` hook 与 [useStream hook](#consuming-streamed-responses) 相同，只是它会在流式传输完成后尝试将数据解析为 JSON：

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

`eventStream` 方法可用于使用 `text/event-stream` 内容类型返回服务器发送事件（SSE）流式响应。`eventStream` 方法接受一个闭包，该闭包应在响应可用时[产出](https://www.php.net/manual/en/language.generators.overview.php)响应到流中：

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

如果你想自定义事件的名称，可以产出 `StreamedEvent` 类的实例：

```php
use Illuminate\Http\StreamedEvent;

yield new StreamedEvent(
    event: 'update',
    data: $response->choices[0],
);
```

<a name="consuming-event-streams"></a>
#### 消费事件流

可以使用 Laravel 的 `stream` npm 包消费事件流，它提供了与 Laravel 事件流交互的便捷 API。要开始，请安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useEventStream` 消费事件流。提供流 URL 后，随着消息从 Laravel 应用返回，该 hook 将自动用拼接的响应更新 `message`：

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

提供给 `useEventStream` 的第二个参数是一个 options 对象，你可以使用它来自定义流消费行为。此对象的默认值如下所示：

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

事件流也可以通过应用前端使用 [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) 对象手动消费。流完成后，`eventStream` 方法将自动向事件流发送 `</stream>` 更新：

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

要自定义发送到事件流的最终事件，你可以向 `eventStream` 方法的 `endStreamWith` 参数提供一个 `StreamedEvent` 实例：

```php
return response()->eventStream(function () {
    // ...
}, endStreamWith: new StreamedEvent(event: 'update', data: '</stream>'));
```

<a name="streamed-downloads"></a>
### 流式下载

有时你可能希望将给定操作的字符串响应转换为可下载的响应，而无需将操作内容写入磁盘。在这种情况下，你可以使用 `streamDownload` 方法。此方法接受一个回调、文件名和一个可选的请求头数组作为参数：

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

如果你想定义一个可以在各种路由和控制器中重复使用的自定义响应，可以在 `Response` Facade 上使用 `macro` 方法。通常，你应从应用某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用此方法，例如 `App\Providers\AppServiceProvider` 服务提供者：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Response::macro('caps', function (string $value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数接受一个名称作为第一个参数，一个闭包作为第二个参数。当从 `ResponseFactory` 实现或 `response` 辅助函数调用宏名称时，宏的闭包将被执行：

```php
return response()->caps('foo');
```
