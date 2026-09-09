# HTTP 客户端

- [简介](#introduction)
- [发起请求](#making-requests)
    - [请求数据](#request-data)
    - [请求头](#headers)
    - [身份认证](#authentication)
    - [超时](#timeout)
    - [重试](#retries)
    - [错误处理](#error-handling)
    - [Guzzle 中间件](#guzzle-middleware)
    - [Guzzle 选项](#guzzle-options)
- [并发请求](#concurrent-requests)
    - [请求池](#request-pooling)
    - [请求批处理](#request-batching)
- [宏](#macros)
- [测试](#testing)
    - [伪造响应](#faking-responses)
    - [检查请求](#inspecting-requests)
    - [防止游离请求](#preventing-stray-requests)
- [事件](#events)

<a name="introduction"></a>
## 简介

Laravel 在 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/)的基础上提供了一个富有表现力的极简 API，让你可以快速发起传出 HTTP 请求，与其他 Web 应用通信。Laravel 对 Guzzle 的封装聚焦于其最常见的用例和绝佳的开发者体验。

<a name="making-requests"></a>
## 发起请求

要发起请求，你可以使用 `Http` facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，我们来看看如何向另一个 URL 发起一个基本的 `GET` 请求：

```php
use Illuminate\Support\Facades\Http;

$response = Http::get('http://example.com');
```

`get` 方法返回一个 `Illuminate\Http\Client\Response` 实例，该实例提供了多种可用于检查响应的方法：

```php
$response->body() : string;
$response->json($key = null, $default = null, $flags = null) : mixed;
$response->object() : object;
$response->collect($key = null) : Illuminate\Support\Collection;
$response->resource() : resource;
$response->status() : int;
$response->successful() : bool;
$response->redirect(): bool;
$response->failed() : bool;
$response->clientError() : bool;
$response->header($header) : string;
$response->headers() : array;
```

`Illuminate\Http\Client\Response` 对象还实现了 PHP 的 `ArrayAccess` 接口，允许你直接在响应上访问 JSON 响应数据：

```php
return Http::get('http://example.com/users/1')['name'];
```

除了上面列出的响应方法之外，还可以使用以下方法来判断响应是否具有特定的状态码：

```php
$response->ok() : bool;                  // 200 OK
$response->created() : bool;             // 201 Created
$response->accepted() : bool;            // 202 Accepted
$response->noContent() : bool;           // 204 No Content
$response->movedPermanently() : bool;    // 301 Moved Permanently
$response->found() : bool;               // 302 Found
$response->badRequest() : bool;          // 400 Bad Request
$response->unauthorized() : bool;        // 401 Unauthorized
$response->paymentRequired() : bool;     // 402 Payment Required
$response->forbidden() : bool;           // 403 Forbidden
$response->notFound() : bool;            // 404 Not Found
$response->requestTimeout() : bool;      // 408 Request Timeout
$response->conflict() : bool;            // 409 Conflict
$response->unprocessableEntity() : bool; // 422 Unprocessable Entity
$response->tooManyRequests() : bool;     // 429 Too Many Requests
$response->serverError() : bool;         // 500 Internal Server Error
```

<a name="uri-templates"></a>
#### URI 模板

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570)来构造请求 URL。你可以使用 `withUrlParameters` 方法定义可由 URI 模板展开的 URL 参数：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '12.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

<a name="dumping-requests"></a>
#### 转储请求

如果你想在传出请求实例发送之前将其转储并终止脚本执行，可以在请求定义的开头添加 `dd` 方法：

```php
return Http::dd()->get('http://example.com');
```

<a name="request-data"></a>
### 请求数据

当然，在发起 `POST`、`PUT` 和 `PATCH` 请求时，通常会随请求发送额外的数据，因此这些方法接受一个数据数组作为第二个参数。默认情况下，数据将使用 `application/json` 内容类型发送：

```php
use Illuminate\Support\Facades\Http;

$response = Http::post('http://example.com/users', [
    'name' => 'Steve',
    'role' => 'Network Administrator',
]);
```

<a name="get-request-query-parameters"></a>
#### GET 请求查询参数

发起 `GET` 请求时，你可以直接在 URL 后面拼接查询字符串，也可以将一个键 / 值对数组作为 `get` 方法的第二个参数传入：

```php
$response = Http::get('http://example.com/users', [
    'name' => 'Taylor',
    'page' => 1,
]);
```

或者，也可以使用 `withQueryParameters` 方法：

```php
Http::retry(3, 100)->withQueryParameters([
    'name' => 'Taylor',
    'page' => 1,
])->get('http://example.com/users');
```

<a name="sending-form-url-encoded-requests"></a>
#### 发送表单 URL 编码请求

如果你想使用 `application/x-www-form-urlencoded` 内容类型发送数据，应当在发起请求之前调用 `asForm` 方法：

```php
$response = Http::asForm()->post('http://example.com/users', [
    'name' => 'Sara',
    'role' => 'Privacy Consultant',
]);
```

<a name="sending-a-raw-request-body"></a>
#### 发送原始请求体

如果你想在发起请求时提供原始请求体，可以使用 `withBody` 方法。内容类型可以通过该方法的第二个参数提供：

```php
$response = Http::withBody(
    base64_encode($photo), 'image/jpeg'
)->post('http://example.com/photo');
```

<a name="multi-part-requests"></a>
#### 多部分请求

如果你想以多部分（multi-part）请求的形式发送文件，应当在发起请求之前调用 `attach` 方法。该方法接受文件名和文件内容。如有需要，你可以提供第三个参数作为文件的文件名，第四个参数则可用于提供与该文件关联的请求头：

```php
$response = Http::attach(
    'attachment', file_get_contents('photo.jpg'), 'photo.jpg', ['Content-Type' => 'image/jpeg']
)->post('http://example.com/attachments');
```

除了传递文件的原始内容之外，你还可以传递一个流资源：

```php
$photo = fopen('photo.jpg', 'r');

$response = Http::attach(
    'attachment', $photo, 'photo.jpg'
)->post('http://example.com/attachments');
```

<a name="headers"></a>
### 请求头

可以使用 `withHeaders` 方法向请求添加请求头。`withHeaders` 方法接受一个键 / 值对数组：

```php
$response = Http::withHeaders([
    'X-First' => 'foo',
    'X-Second' => 'bar'
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

你可以使用 `accept` 方法指定应用期望请求返回的内容类型：

```php
$response = Http::accept('application/json')->get('http://example.com/users');
```

为了方便，你可以使用 `acceptJson` 方法快速指定应用期望请求返回 `application/json` 内容类型：

```php
$response = Http::acceptJson()->get('http://example.com/users');
```

`withHeaders` 方法会将新的请求头合并到请求现有的请求头中。如有需要，你可以使用 `replaceHeaders` 方法完全替换所有请求头：

```php
$response = Http::withHeaders([
    'X-Original' => 'foo',
])->replaceHeaders([
    'X-Replacement' => 'bar',
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

<a name="authentication"></a>
### 身份认证

你可以分别使用 `withBasicAuth` 和 `withDigestAuth` 方法来指定基本（basic）认证和摘要（digest）认证凭据：

```php
// 基本认证...
$response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

// 摘要认证...
$response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);
```

<a name="bearer-tokens"></a>
#### Bearer 令牌

如果你想快速将一个 Bearer 令牌添加到请求的 `Authorization` 请求头中，可以使用 `withToken` 方法：

```php
$response = Http::withToken('token')->post(/* ... */);
```

<a name="timeout"></a>
### 超时

可以使用 `timeout` 方法指定等待响应的最大秒数。默认情况下，HTTP 客户端将在 30 秒后超时：

```php
$response = Http::timeout(3)->get(/* ... */);
```

如果超过了指定的超时时间，将抛出 `Illuminate\Http\Client\ConnectionException` 实例。

你可以使用 `connectTimeout` 方法指定尝试连接服务器时等待的最大秒数。默认为 10 秒：

```php
$response = Http::connectTimeout(3)->get(/* ... */);
```

<a name="retries"></a>
### 重试

如果你希望 HTTP 客户端在发生客户端或服务端错误时自动重试请求，可以使用 `retry` 方法。`retry` 方法接受请求应尝试的最大次数，以及 Laravel 在两次尝试之间等待的毫秒数：

```php
$response = Http::retry(3, 100)->post(/* ... */);
```

如果你想手动计算每次尝试之间应休眠的毫秒数，可以将一个闭包作为 `retry` 方法的第二个参数传入：

```php
use Exception;

$response = Http::retry(3, function (int $attempt, Exception $exception) {
    return $attempt * 100;
})->post(/* ... */);
```

为了方便，你也可以提供一个数组作为 `retry` 方法的第一个参数。该数组将用于确定后续尝试之间应休眠的毫秒数：

```php
$response = Http::retry([100, 200])->post(/* ... */);
```

如有需要，你可以向 `retry` 方法传递第三个参数。第三个参数应当是一个可调用对象（callable），用于决定是否真的要尝试重试。例如，你可能希望只在初始请求遇到 `ConnectionException` 时才重试该请求：

```php
use Illuminate\Http\Client\PendingRequest;
use Throwable;

$response = Http::retry(3, 100, function (Throwable $exception, PendingRequest $request) {
    return $exception instanceof ConnectionException;
})->post(/* ... */);
```

如果某次请求尝试失败，你可能希望在进行新的尝试之前对请求做一些修改。你可以通过修改传递给 `retry` 方法的可调用对象的请求参数来实现。例如，如果第一次尝试返回了认证错误，你可能希望使用新的授权令牌重试该请求：

```php
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Throwable;

$response = Http::withToken($this->getToken())->retry(2, 0, function (Throwable $exception, PendingRequest $request) {
    if (! $exception instanceof RequestException || $exception->response->status() !== 401) {
        return false;
    }

    $request->withToken($this->getNewToken());

    return true;
})->post(/* ... */);
```

如果所有请求都失败了，将抛出 `Illuminate\Http\Client\RequestException` 实例。如果你想禁用此行为，可以提供一个值为 `false` 的 `throw` 参数。禁用后，在所有重试尝试完毕后，将返回客户端接收到的最后一个响应：

```php
$response = Http::retry(3, 100, throw: false)->post(/* ... */);
```

> [!WARNING]
> 如果所有请求都因连接问题而失败，即使 `throw` 参数设置为 `false`，也仍然会抛出 `Illuminate\Http\Client\ConnectionException`。

<a name="error-handling"></a>
### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端封装不会在客户端或服务端错误（服务器返回的 `400` 和 `500` 级响应）时抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法来判断是否返回了这类错误：

```php
// 判断状态码是否 >= 200 且 < 300...
$response->successful();

// 判断状态码是否 >= 400...
$response->failed();

// 判断响应是否具有 400 级状态码...
$response->clientError();

// 判断响应是否具有 500 级状态码...
$response->serverError();

// 如果发生客户端或服务端错误，立即执行给定的回调...
$response->onError(callable $callback);
```

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你有一个响应实例，并且希望在响应状态码指示客户端或服务端错误时抛出 `Illuminate\Http\Client\RequestException` 实例，可以使用 `throw` 或 `throwIf` 方法：

```php
use Illuminate\Http\Client\Response;

$response = Http::post(/* ... */);

// 如果发生客户端或服务端错误，则抛出异常...
$response->throw();

// 如果发生错误且给定条件为真，则抛出异常...
$response->throwIf($condition);

// 如果发生错误且给定闭包的求值结果为真，则抛出异常...
$response->throwIf(fn (Response $response) => true);

// 如果发生错误且给定条件为假，则抛出异常...
$response->throwUnless($condition);

// 如果发生错误且给定闭包的求值结果为假，则抛出异常...
$response->throwUnless(fn (Response $response) => false);

// 如果响应具有指定的状态码，则抛出异常...
$response->throwIfStatus(403);

// 除非响应具有指定的状态码，否则抛出异常...
$response->throwUnlessStatus(200);

return $response['user']['id'];
```

`Illuminate\Http\Client\RequestException` 实例有一个公开的 `$response` 属性，你可以用它来检查返回的响应。

如果没有发生错误，`throw` 方法会返回响应实例，因此你可以在 `throw` 方法后链式调用其他操作：

```php
return Http::post(/* ... */)->throw()->json();
```

如果你希望在抛出异常之前执行一些额外的逻辑，可以向 `throw` 方法传递一个闭包。该闭包被调用后会自动抛出异常，因此你无需在闭包内重新抛出异常：

```php
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;

return Http::post(/* ... */)->throw(function (Response $response, RequestException $e) {
    // ...
})->json();
```

默认情况下，`RequestException` 的消息在记录或报告时会被截断为 120 个字符。要自定义或禁用此行为，你可以在 `bootstrap/app.php` 文件中配置应用注册行为时，使用 `truncateAt` 和 `dontTruncate` 方法：

```php
use Illuminate\Http\Client\RequestException;

->registered(function (): void {
    // 将请求异常消息截断为 240 个字符...
    RequestException::truncateAt(240);

    // 禁用请求异常消息截断...
    RequestException::dontTruncate();
})
```

或者，你也可以使用 `truncateExceptionsAt` 方法，按请求自定义异常截断行为：

```php
return Http::truncateExceptionsAt(240)->post(/* ... */);
```

<a name="guzzle-middleware"></a>
### Guzzle 中间件

由于 Laravel 的 HTTP 客户端由 Guzzle 驱动，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html)来操作传出请求或检查传入响应。要操作传出请求，可以通过 `withRequestMiddleware` 方法注册一个 Guzzle 中间件：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\RequestInterface;

$response = Http::withRequestMiddleware(
    function (RequestInterface $request) {
        return $request->withHeader('X-Example', 'Value');
    }
)->get('http://example.com');
```

同样，你可以通过 `withResponseMiddleware` 方法注册中间件，来检查传入的 HTTP 响应：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\ResponseInterface;

$response = Http::withResponseMiddleware(
    function (ResponseInterface $response) {
        $header = $response->getHeader('X-Example');

        // ...

        return $response;
    }
)->get('http://example.com');
```

<a name="global-middleware"></a>
#### 全局中间件

有时，你可能希望注册一个应用于每个传出请求和传入响应的中间件。为此，你可以使用 `globalRequestMiddleware` 和 `globalResponseMiddleware` 方法。通常，这些方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

Http::globalRequestMiddleware(fn ($request) => $request->withHeader(
    'User-Agent', 'Example Application/1.0'
));

Http::globalResponseMiddleware(fn ($response) => $response->withHeader(
    'X-Finished-At', now()->toDateTimeString()
));
```

<a name="guzzle-options"></a>
### Guzzle 选项

你可以使用 `withOptions` 方法为传出请求指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受一个键 / 值对数组：

```php
$response = Http::withOptions([
    'debug' => true,
])->get('http://example.com/users');
```

<a name="global-options"></a>
#### 全局选项

要为每个传出请求配置默认选项，你可以使用 `globalOptions` 方法。通常，该方法应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Http::globalOptions([
        'allow_redirects' => false,
    ]);
}
```

<a name="concurrent-requests"></a>
## 并发请求

有时，你可能希望并发地发起多个 HTTP 请求。也就是说，你希望多个请求同时发出，而不是按顺序逐个发起。在与响应缓慢的 HTTP API 交互时，这可以带来显著的性能提升。

<a name="request-pooling"></a>
### 请求池

所幸，你可以使用 `pool` 方法来实现。`pool` 方法接受一个闭包，该闭包接收一个 `Illuminate\Http\Client\Pool` 实例，让你可以轻松地将请求添加到请求池中进行派发：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$responses = Http::pool(fn (Pool $pool) => [
    $pool->get('http://localhost/first'),
    $pool->get('http://localhost/second'),
    $pool->get('http://localhost/third'),
]);

return $responses[0]->ok() &&
       $responses[1]->ok() &&
       $responses[2]->ok();
```

如你所见，每个响应实例都可以按其被添加到池中的顺序来访问。如果你愿意，可以使用 `as` 方法为请求命名，这样就可以通过名称访问相应的响应：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$responses = Http::pool(fn (Pool $pool) => [
    $pool->as('first')->get('http://localhost/first'),
    $pool->as('second')->get('http://localhost/second'),
    $pool->as('third')->get('http://localhost/third'),
]);

return $responses['first']->ok();
```

可以通过向 `pool` 方法提供 `concurrency` 参数来控制请求池的最大并发数。该值决定了处理请求池时可以同时进行的 HTTP 请求的最大数量：

```php
$responses = Http::pool(fn (Pool $pool) => [
    // ...
], concurrency: 5);
```

<a name="customizing-concurrent-requests"></a>
#### 自定义并发请求

`pool` 方法无法与 `withHeaders` 或 `middleware` 等其他 HTTP 客户端方法链式调用。如果你想为池中的请求应用自定义请求头或中间件，应当在池中的每个请求上分别配置这些选项：

```php
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

$headers = [
    'X-Example' => 'example',
];

$responses = Http::pool(fn (Pool $pool) => [
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
    $pool->withHeaders($headers)->get('http://laravel.test/test'),
]);
```

<a name="request-batching"></a>
### 请求批处理

在 Laravel 中处理并发请求的另一种方式是使用 `batch` 方法。与 `pool` 方法一样，它接受一个接收 `Illuminate\Http\Client\Batch` 实例的闭包，让你可以轻松地将请求添加到请求池中进行派发。不过，它还允许你定义完成回调：

```php
use Illuminate\Http\Client\Batch;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

$responses = Http::batch(fn (Batch $batch) => [
    $batch->get('http://localhost/first'),
    $batch->get('http://localhost/second'),
    $batch->get('http://localhost/third'),
])->before(function (Batch $batch) {
    // 批处理已创建，但尚未初始化任何请求...
})->progress(function (Batch $batch, int|string $key, Response $response) {
    // 单个请求已成功完成...
})->then(function (Batch $batch, array $results) {
    // 所有请求都已成功完成...
})->catch(function (Batch $batch, int|string $key, Response|RequestException|ConnectionException $response) {
    // 检测到批处理请求失败...
})->finally(function (Batch $batch, array $results) {
    // 批处理已执行完毕...
})->send();
```

与 `pool` 方法一样，你可以使用 `as` 方法为请求命名：

```php
$responses = Http::batch(fn (Batch $batch) => [
    $batch->as('first')->get('http://localhost/first'),
    $batch->as('second')->get('http://localhost/second'),
    $batch->as('third')->get('http://localhost/third'),
])->send();
```

调用 `send` 方法启动批处理之后，你就无法再向其添加新请求了。尝试这样做将抛出 `Illuminate\Http\Client\BatchInProgressException` 异常。

可以通过 `concurrency` 方法控制请求批处理的最大并发数。该值决定了处理请求批处理时可以同时进行的 HTTP 请求的最大数量：

```php
$responses = Http::batch(fn (Batch $batch) => [
    // ...
])->concurrency(5)->send();
```

<a name="inspecting-batches"></a>
#### 检查批处理

传递给批处理完成回调的 `Illuminate\Http\Client\Batch` 实例提供了多种属性和方法，帮助你与指定的请求批处理进行交互和检查：

```php
// 分配给该批处理的请求数量...
$batch->totalRequests;

// 尚未被处理的请求数量...
$batch->pendingRequests;

// 已失败的请求数量...
$batch->failedRequests;

// 到目前为止已处理的请求数量...
$batch->processedRequests();

// 指示批处理是否已执行完毕...
$batch->finished();

// 指示批处理是否有失败的请求...
$batch->hasFailures();
```
<a name="deferring-batches"></a>
#### 延迟批处理

调用 `defer` 方法时，请求批处理不会立即执行。相反，Laravel 会在当前应用请求的 HTTP 响应发送给用户之后再执行该批处理，从而保持应用的快速响应体验：

```php
use Illuminate\Http\Client\Batch;
use Illuminate\Support\Facades\Http;

$responses = Http::batch(fn (Batch $batch) => [
    $batch->get('http://localhost/first'),
    $batch->get('http://localhost/second'),
    $batch->get('http://localhost/third'),
])->then(function (Batch $batch, array $results) {
    // 所有请求都已成功完成...
})->defer();
```

<a name="macros"></a>
## 宏

Laravel HTTP 客户端允许你定义「宏（macro）」，它可以作为一种流式且富有表现力的机制，在与应用中的各种服务交互时配置常用的请求路径和请求头。首先，你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义宏：

```php
use Illuminate\Support\Facades\Http;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Http::macro('github', function () {
        return Http::withHeaders([
            'X-Example' => 'example',
        ])->baseUrl('https://github.com');
    });
}
```

宏配置好之后，你就可以在应用的任何地方调用它，创建一个带有指定配置的待处理请求：

```php
$response = Http::github()->get('/');
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供了帮助你轻松、优雅地编写测试的功能，Laravel 的 HTTP 客户端也不例外。`Http` facade 的 `fake` 方法允许你指示 HTTP 客户端在发起请求时返回桩（stub）/ 虚拟响应。

<a name="faking-responses"></a>
### 伪造响应

例如，要指示 HTTP 客户端为每个请求返回空的、`200` 状态码的响应，可以不带参数地调用 `fake` 方法：

```php
use Illuminate\Support\Facades\Http;

Http::fake();

$response = Http::post(/* ... */);
```

<a name="faking-specific-urls"></a>
#### 伪造指定 URL

或者，你可以向 `fake` 方法传递一个数组。数组的键应当表示你希望伪造的 URL 模式及其对应的响应。`*` 字符可以用作通配符。你可以使用 `Http` facade 的 `response` 方法为这些端点构造桩 / 伪造响应：

```php
Http::fake([
    // 为 GitHub 端点伪造一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

    // 为 Google 端点伪造一个字符串响应...
    'google.com/*' => Http::response('Hello World', 200, $headers),
]);
```

对未被伪造的 URL 发起的任何请求都将会真正执行。如果你想指定一个可以桩化所有未匹配 URL 的回退 URL 模式，可以使用单个 `*` 字符：

```php
Http::fake([
    // 为 GitHub 端点伪造一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

    // 为所有其他端点伪造一个字符串响应...
    '*' => Http::response('Hello World', 200, ['Headers']),
]);
```

为了方便，你可以通过提供字符串、数组或整数作为响应，来生成简单的字符串、JSON 和空响应：

```php
Http::fake([
    'google.com/*' => 'Hello World',
    'github.com/*' => ['foo' => 'bar'],
    'chatgpt.com/*' => 200,
]);
```

<a name="faking-connection-exceptions"></a>
#### 伪造异常

有时你可能需要测试当 HTTP 客户端在尝试发起请求时遇到 `Illuminate\Http\Client\ConnectionException` 的应用行为。你可以使用 `failedConnection` 方法指示 HTTP 客户端抛出连接异常：

```php
Http::fake([
    'github.com/*' => Http::failedConnection(),
]);
```

要测试当抛出 `Illuminate\Http\Client\RequestException` 时的应用行为，可以使用 `failedRequest` 方法：

```php
$this->mock(GithubService::class);
    ->shouldReceive('getUser')
    ->andThrow(
        Http::failedRequest(['code' => 'not_found'], 404)
    );
```

<a name="faking-response-sequences"></a>
#### 伪造响应序列

有时你可能需要指定单个 URL 按特定顺序返回一系列伪造响应。你可以使用 `Http::sequence` 方法来构建这些响应：

```php
Http::fake([
    // 为 GitHub 端点伪造一系列响应...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->pushStatus(404),
]);
```

当响应序列中的所有响应都被消耗完后，任何后续请求都将导致响应序列抛出异常。如果你想指定序列为空时应返回的默认响应，可以使用 `whenEmpty` 方法：

```php
Http::fake([
    // 为 GitHub 端点伪造一系列响应...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->whenEmpty(Http::response()),
]);
```

如果你想伪造一系列响应，但不需要指定要伪造的特定 URL 模式，可以使用 `Http::fakeSequence` 方法：

```php
Http::fakeSequence()
    ->push('Hello World', 200)
    ->whenEmpty(Http::response());
```

<a name="fake-callback"></a>
#### 伪造回调

如果你需要更复杂的逻辑来决定某些端点应返回什么响应，可以向 `fake` 方法传递一个闭包。该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个响应实例。在闭包中，你可以执行任何必要的逻辑来确定要返回的响应类型：

```php
use Illuminate\Http\Client\Request;

Http::fake(function (Request $request) {
    return Http::response('Hello World', 200);
});
```

<a name="inspecting-requests"></a>
### 检查请求

在伪造响应时，你可能偶尔希望检查客户端收到的请求，以确保应用发送了正确的数据或请求头。你可以在调用 `Http::fake` 之后调用 `Http::assertSent` 方法来实现。

`assertSent` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，指示该请求是否符合你的预期。要通过测试，至少必须有一个发出的请求符合给定的预期：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

Http::fake();

Http::withHeaders([
    'X-First' => 'foo',
])->post('http://example.com/users', [
    'name' => 'Taylor',
    'role' => 'Developer',
]);

Http::assertSent(function (Request $request) {
    return $request->hasHeader('X-First', 'foo') &&
           $request->url() == 'http://example.com/users' &&
           $request['name'] == 'Taylor' &&
           $request['role'] == 'Developer';
});
```

如有需要，你可以使用 `assertNotSent` 方法断言未发送指定的请求：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

Http::fake();

Http::post('http://example.com/users', [
    'name' => 'Taylor',
    'role' => 'Developer',
]);

Http::assertNotSent(function (Request $request) {
    return $request->url() === 'http://example.com/posts';
});
```

你可以使用 `assertSentCount` 方法断言测试期间「发送」了多少个请求：

```php
Http::fake();

Http::assertSentCount(5);
```

或者，你可以使用 `assertNothingSent` 方法断言测试期间没有发送任何请求：

```php
Http::fake();

Http::assertNothingSent();
```

<a name="recording-requests-and-responses"></a>
#### 记录请求 / 响应

你可以使用 `recorded` 方法收集所有请求及其对应的响应。`recorded` 方法返回一个数组的集合，其中包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例：

```php
Http::fake([
    'https://laravel.com' => Http::response(status: 500),
    'https://nova.laravel.com/' => Http::response(),
]);

Http::get('https://laravel.com');
Http::get('https://nova.laravel.com/');

$recorded = Http::recorded();

[$request, $response] = $recorded[0];
```

此外，`recorded` 方法还接受一个闭包，该闭包会接收 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例，可用于根据你的预期过滤请求 / 响应对：

```php
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\Response;

Http::fake([
    'https://laravel.com' => Http::response(status: 500),
    'https://nova.laravel.com/' => Http::response(),
]);

Http::get('https://laravel.com');
Http::get('https://nova.laravel.com/');

$recorded = Http::recorded(function (Request $request, Response $response) {
    return $request->url() !== 'https://laravel.com' &&
           $response->successful();
});
```

<a name="preventing-stray-requests"></a>
### 防止游离请求

如果你想确保在单个测试或整个测试套件中，通过 HTTP 客户端发送的所有请求都已被伪造，可以调用 `preventStrayRequests` 方法。调用此方法后，任何没有对应伪造响应的请求都将抛出异常，而不是发起真实的 HTTP 请求：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::fake([
    'github.com/*' => Http::response('ok'),
]);

// 返回 "ok" 响应...
Http::get('https://github.com/laravel/framework');

// 抛出异常...
Http::get('https://laravel.com');
```

有时，你可能希望阻止大多数游离请求，同时仍允许特定的请求执行。为此，你可以向 `allowStrayRequests` 方法传递一个 URL 模式数组。匹配任一给定模式的请求都将被允许，而所有其他请求将继续抛出异常：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::allowStrayRequests([
    'http://127.0.0.1:5000/*',
]);

// 此请求会被执行...
Http::get('http://127.0.0.1:5000/generate');

// 抛出异常...
Http::get('https://laravel.com');
```

<a name="events"></a>
## 事件

Laravel 在发送 HTTP 请求的过程中会触发三个事件。`RequestSending` 事件在请求发送之前触发，`ResponseReceived` 事件在收到指定请求的响应之后触发。如果没有收到指定请求的响应，则触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都包含一个公开的 `$request` 属性，你可以用它来检查 `Illuminate\Http\Client\Request` 实例。同样，`ResponseReceived` 事件包含 `$request` 属性和 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以在应用中为这些事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Http\Client\Events\RequestSending;

class LogRequest
{
    /**
     * 处理事件。
     */
    public function handle(RequestSending $event): void
    {
        // $event->request ...
    }
}
```
