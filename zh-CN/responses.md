# HTTP 响应

## 创建响应

#### 字符串和数组

所有路由和控制器都应返回一个响应以发送回用户的浏览器。Laravel 提供了多种返回响应的方式。最基本的响应是从路由或控制器返回字符串。框架会自动将字符串转换为完整的 HTTP 响应：

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

> [!NOTE]
> 你知道吗？还可以从路由或控制器返回 [Eloquent 集合](/topic/Laravel%2013.x/d6vroqrv3g.html)。它们会自动转换为 JSON。试试看！

#### 响应对象

通常，你不会仅从路由操作返回简单的字符串或数组。相反，你会返回完整的 `Illuminate\Http\Response` 实例或[视图](/topic/Laravel%2013.x/m892gz6y01.html)。

返回完整的 `Response` 实例允许自定义响应的 HTTP 状态码和标头。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了多种用于构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
        ->header('Content-Type', 'text/plain');
});
```

#### Eloquent 模型和集合

还可以直接从路由和控制器返回 [Eloquent ORM](/topic/Laravel%2013.x/rwyl2kxvz8.html) 模型和集合。这样做时，Laravel 会自动将模型和集合转换为 JSON 响应，同时遵守模型的[隐藏属性](/topic/Laravel%2013.x/m892ge6y01.html)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

### 为响应附加标头

请记住，大多数响应方法都是可链式调用的，允许流畅地构建响应实例。例如，可以使用 `header` 方法在将响应发送回用户之前向响应添加一系列标头：

```php
return response($content)
    ->header('Content-Type', $type)
    ->header('X-Header-One', 'Header Value')
    ->header('X-Header-Two', 'Header Value');
```

或者，可以使用 `withHeaders` 方法指定要添加到响应的标头数组：

```php
return response($content)
    ->withHeaders([
        'Content-Type' => $type,
        'X-Header-One' => 'Header Value',
        'X-Header-Two' => 'Header Value',
    ]);
```

可以使用 `withoutHeader` 方法从传出响应中删除特定标头：

```php
return response($content)->withoutHeader('X-Debug');

return response($content)->withoutHeader(['X-Debug', 'X-Powered-By']);
```

#### 缓存控制中间件

Laravel 包含一个 `cache.headers` 中间件，可用于为一组路由快速设置 `Cache-Control` 标头。指令应使用相应 cache-control 指令的「蛇形命名」（snake case）等效项提供，并应以分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希将自动设置为 ETag 标识符：

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

### 为响应附加 Cookie

可以使用 `cookie` 方法将 cookie 附加到传出的 `Illuminate\Http\Response` 实例。应向此方法传递名称、值以及 cookie 应被视为有效的分钟数：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受一些使用频率较低的其他参数。通常，这些参数具有与 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法参数相同的目的和含义：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果希望确保在传出响应中发送 cookie，但还没有该响应的实例，可以使用 `Cookie` Facade 来「排队」cookie，以便在发送时附加到响应。`queue` 方法接受创建 cookie 实例所需的参数。这些 cookie 将在传出响应发送到浏览器之前附加到该响应：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

#### 生成 Cookie 实例

如果希望生成可以在稍后附加到响应实例的 `Symfony\Component\HttpFoundation\Cookie` 实例，可以使用全局 `cookie` 辅助函数。除非将此 cookie 附加到响应实例，否则不会将其发送回客户端：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

#### 提前过期 Cookie

可以通过传出响应的 `withoutCookie` 或 `withoutCookies` 方法使 cookie 过期，从而删除该 cookie：

```php
return response('Hello World')->withoutCookie('name');

return response('Hello World')->withoutCookies([
    'name',
    'email',
    'preferences',
]);
```

如果还没有传出响应的实例，可以使用 `Cookie` Facade 的 `expire` 方法使 cookie 过期：

```php
Cookie::expire('name');
```

### Cookie 与加密

默认情况下，由于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件，Laravel 生成的所有 cookie 都是加密和签名的，因此客户端无法修改或读取它们。如果希望对应用生成的部分 cookie 禁用加密，可以在应用的 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

> [!NOTE]
> 一般来说，永远不应禁用 cookie 加密，因为这会使你的 cookie 暴露给潜在的客户端数据泄露和篡改。

## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的正确标头。有多种方法可以生成 `RedirectResponse` 实例。最简单的方法是使用全局 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('/home/dashboard');
});
```

有时你可能希望将用户重定向到他们之前的位置，例如当提交表单无效时。可以使用全局 `back` 辅助函数来实现这一点。由于此功能利用了[会话](/topic/Laravel%2013.x/2ev86noyor.html)，请确保调用 `back` 函数的路由使用的是 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // 验证请求...

    return back()->withInput();
});
```

### 重定向到命名路由

当使用不带参数的 `redirect` 辅助函数时，将返回 `Illuminate\Routing\Redirector` 实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成到命名路由的 `RedirectResponse`，可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果路由有参数，可以将它们作为第二个参数传递给 `route` 方法：

```php
// 对于 URI 为 /profile/{id} 的路由...

return redirect()->route('profile', ['id' => 1]);
```

#### 通过 Eloquent 模型填充参数

如果要重定向到带有从 Eloquent 模型填充的「ID」参数的路由，则可以传递模型本身。ID 将自动提取：

```php
// 对于 URI 为 /profile/{id} 的路由...

return redirect()->route('profile', [$user]);
```

如果希望自定义放入路由参数的值，可以在路由参数定义中指定列（`/profile/{id:slug}`），也可以重写 Eloquent 模型上的 `getRouteKey` 方法：

```php
/**
 * 获取模型的路由键值。
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

### 重定向到控制器操作

还可以生成到[控制器操作](/topic/Laravel%2013.x/d6vro4rv3g.html) 的重定向。为此，将控制器和操作名称传递给 `action` 方法：

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

### 重定向到外部域

有时你可能需要重定向到应用外部的域。可以通过调用 `away` 方法来实现这一点，它会创建一个 `RedirectResponse`，而无需任何额外的 URL 编码、验证或检查：

```php
return redirect()->away('https://www.google.com');
```

### 使用闪现 Session 数据重定向

重定向到新 URL 并[将数据闪现到会话](/topic/Laravel%2013.x/2ev86noyor.html) 通常同时完成。通常，在成功执行操作后执行此操作，此时将成功消息闪现到会话。为方便起见，可以创建一个 `RedirectResponse` 实例，并通过单一流畅的方法链将数据闪现到会话：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('/dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，可以从[会话](/topic/Laravel%2013.x/2ev86noyor.html) 显示闪现的消息。例如，使用 [Blade 语法](/topic/Laravel%2013.x/wevwmrz9l2.html)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

#### 使用输入重定向

可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前将当前请求的输入数据闪现到会话。如果用户遇到验证错误，通常会执行此操作。一旦输入被闪现到会话，就可以在下一个请求期间轻松[检索它](/topic/Laravel%2013.x/2ky040l9z8.html) 以重新填充表单：

```php
return back()->withInput();
```

## 其他响应类型

`response` 辅助函数可用于生成其他类型的响应实例。当调用 `response` 辅助函数而不带参数时，将返回 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/topic/Laravel%2013.x/3xyq4r4vmq.html) 的实现。该契约提供了多种用于生成响应的有用方法。

### 视图响应

如果需要控制响应的状态和标头，但又需要将[视图](/topic/Laravel%2013.x/m892gz6y01.html) 作为响应的内容返回，则应使用 `view` 方法：

```php
return response()
    ->view('hello', $data, 200)
    ->header('Content-Type', $type);
```

当然，如果不需要传递自定义 HTTP 状态码或自定义标头，可以使用全局 `view` 辅助函数。

### JSON 响应

`json` 方法会自动将 `Content-Type` 标头设置为 `application/json`，并使用 `json_encode` PHP 函数将给定数组转换为 JSON：

```php
return response()->json([
    'name' => 'Abigail',
    'state' => 'CA',
]);
```

如果希望创建 JSONP 响应，可以将 `json` 方法与 `withCallback` 方法结合使用：

```php
return response()
    ->json(['name' => 'Abigail', 'state' => 'CA'])
    ->withCallback($request->input('callback'));
```

### 文件下载

`download` 方法可用于生成强制用户浏览器下载给定路径文件的响应。`download` 方法接受文件名作为第二个参数，该参数将决定下载文件的用户看到的文件名。最后，可以将 HTTP 标头数组作为第三个参数传递给该方法：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 管理文件下载的 Symfony HttpFoundation 要求下载的文件具有 ASCII 文件名。

### 文件响应

`file` 方法可用于直接在用户浏览器中显示文件（如图像或 PDF），而不是启动下载。此方法接受文件的绝对路径作为第一个参数，接受标头数组作为第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

## 流式响应

通过在生成数据时将其流式传输到客户端，可以显著降低内存使用量并提高性能，特别是对于非常大的响应。流式响应允许客户端在服务器完成发送之前就开始处理数据：

```php
Route::get('/stream', function () {
    return response()->stream(function (): void {
        foreach (['developer', 'admin'] as $string) {
            echo $string;
            ob_flush();
            flush();
            sleep(2); // 模拟块之间的延迟...
        }
    }, 200, ['X-Accel-Buffering' => 'no']);
});
```

为方便起见，如果提供给 `stream` 方法的闭包返回 [Generator](https://www.php.net/manual/en/language.generators.overview.php)，Laravel 将自动在生成器返回的字符串之间刷新输出缓冲区，并禁用 Nginx 输出缓冲：

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

### 消费流式响应

可以使用 Laravel 的 `stream` npm 包来消费流式响应，该包为与 Laravel 响应和事件流交互提供了便捷的 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useStream` 来消费事件流。提供流 URL 后，当 Laravel 应用返回内容时，hook 将自动更新 `data` 并将响应拼接起来：

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

通过 `send` 向流发送数据时，活动连接到流会在发送新数据之前被取消。所有请求都以 JSON `POST` 请求形式发送。

> [!WARNING]
> 由于 `useStream` hook 会向应用发出 `POST` 请求，因此需要有效的 CSRF token。提供 CSRF token 最简单的方法是[通过应用布局头部中的 meta 标签包含它](/topic/Laravel%2013.x/kpv136298w.html)。

传递给 `useStream` 的第二个参数是一个选项对象，可用于自定义流消费行为。此对象的默认值如下所示：

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

`onResponse` 在流成功返回初始响应后触发，并将原始 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 对象传递给回调。`onData` 在接收每个块时调用 —— 当前块被传递给回调。`onFinish` 在流完成时以及在 fetch/读取周期中抛出错误时调用。

默认情况下，初始化时不会向流发出请求。可以使用 `initialInput` 选项向流传递初始有效负载：

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

每次使用 `useStream` hook 时，都会生成一个随机 `id` 来标识该流。此 `id` 会通过每个请求中的 `X-STREAM-ID` 标头发送回服务器。当从多个组件消费同一个流时，可以通过提供自己的 `id` 来读写该流：

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

### 流式 JSON 响应

如果需要以增量方式流式传输 JSON 数据，可以使用 `streamJson` 方法。该方法对于需要以可由 JavaScript 轻松解析的格式逐步发送到浏览器的大型数据集特别有用：

```php
use App\Models\User;

Route::get('/users.json', function () {
    return response()->streamJson([
        'users' => User::cursor(),
    ]);
});
```

`useJsonStream` hook 与 useStream hook 相同，只是它会在流完成后尝试将数据解析为 JSON：

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
        <button @click="loadUsers}>Load Users</button>
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

### 事件流（SSE）

`eventStream` 方法可用于使用 `text/event-stream` 内容类型返回服务器推送事件（SSE）流式响应。`eventStream` 方法接受一个闭包，当响应可用时，该闭包应[yield](https://www.php.net/manual/en/language.generators.overview.php) 响应到流中：

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

如果希望自定义事件的名称，可以 yield 一个 `StreamedEvent` 类的实例：

```php
use Illuminate\Http\StreamedEvent;

yield new StreamedEvent(
    event: 'update',
    data: $response->choices[0],
);
```

#### 消费事件流

可以使用 Laravel 的 `stream` npm 包来消费事件流，该包为与 Laravel 事件流交互提供了便捷的 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useEventStream` 来消费事件流。提供流 URL 后，当 Laravel 应用返回消息时，hook 将自动更新 `message` 并将响应拼接起来：

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

传递给 `useEventStream` 的第二个参数是一个选项对象，可用于自定义流消费行为。此对象的默认值如下所示：

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

事件流也可以由应用前端通过 [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) 对象手动消费。当流完成时，`eventStream` 方法会自动将 `</stream>` 更新发送到事件流：

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

要自定义发送到事件流的最终事件，可以向 `eventStream` 方法的 `endStreamWith` 参数提供一个 `StreamedEvent` 实例：

```php
return response()->eventStream(function () {
    // ...
}, endStreamWith: new StreamedEvent(event: 'update', data: '</stream>'));
```

### 流式下载

有时你可能希望将给定操作的字符串响应转换为可下载的响应，而无需将操作的内容写入磁盘。在这种情况下可以使用 `streamDownload` 方法。此方法接受回调、文件名和可选的标头数组作为其参数：

```php
use App\Services\GitHub;

return response()->streamDownload(function () {
    echo GitHub::api('repo')
        ->contents()
        ->readme('laravel', 'laravel')['contents'];
}, 'laravel-readme.md');
```

## 响应宏

如果希望定义可在各种路由和控制器中重用的自定义响应，可以使用 `Response` Facade 上的 `macro` 方法。通常，应该从应用的某个[服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用此方法，例如 `App\Providers\AppServiceProvider` 服务提供者：

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

`macro` 函数接受名称作为第一个参数，接受闭包作为第二个参数。从 `ResponseFactory` 实现或 `response` 辅助函数调用宏名称时，将执行该宏的闭包：

```php
return response()->caps('foo');
```