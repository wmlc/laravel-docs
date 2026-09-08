# HTTP 客户端

- [简介](#introduction)
- [发起请求](#making-requests)
    - [请求数据](#request-data)
    - [请求头](#headers)
    - [认证](#authentication)
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
    - [模拟响应](#faking-responses)
    - [检查请求](#inspecting-requests)
    - [阻止意外请求](#preventing-stray-requests)
- [事件](#events)

<a name="introduction"></a>
## 简介

Laravel 围绕 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/)提供了富有表现力、极简的 API，使你能够快速发起出站 HTTP 请求以与其他 Web 应用通信。Laravel 对 Guzzle 的封装专注于其最常见的用例，并提供了出色的开发者体验。

<a name="making-requests"></a>
## 发起请求

要发起请求，可以使用 `Http` Facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，让我们看看如何向另一个 URL 发起基本的 `GET` 请求：

```php
use Illuminate\Support\Facades\Http;

$response = Http::get('http://example.com');
```

`get` 方法返回一个 `Illuminate\Http\Client\Response` 实例，它提供了多种可用于检查响应的方法：

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

除了上面列出的响应方法之外，以下方法可用于判断响应是否具有特定的状态码：

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

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570)构造请求 URL。要定义可由 URI 模板展开的 URL 参数，可以使用 `withUrlParameters` 方法：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '13.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

<a name="dumping-requests"></a>
#### 转储请求

如果你想在出站请求被发送前转储请求实例并终止脚本执行，可以在请求定义的开头添加 `dd` 方法：

```php
return Http::dd()->get('http://example.com');
```

<a name="request-data"></a>
### 请求数据

当然，发起 `POST`、`PUT` 和 `PATCH` 请求时通常会随请求发送额外数据，因此这些方法接受一个数据数组作为第二个参数。默认情况下，数据将使用 `application/json` 内容类型发送：

```php
use Illuminate\Support\Facades\Http;

$response = Http::post('http://example.com/users', [
    'name' => 'Steve',
    'role' => 'Network Administrator',
]);
```

<a name="get-request-query-parameters"></a>
#### GET 请求查询参数

发起 `GET` 请求时，你可以直接在 URL 后附加查询字符串，也可以将键 / 值对数组作为第二个参数传递给 `get` 方法：

```php
$response = Http::get('http://example.com/users', [
    'name' => 'Taylor',
    'page' => 1,
]);
```

另外，也可以使用 `withQueryParameters` 方法：

```php
Http::retry(3, 100)->withQueryParameters([
    'name' => 'Taylor',
    'page' => 1,
])->get('http://example.com/users');
```

<a name="sending-form-url-encoded-requests"></a>
#### 发送表单 URL 编码的请求

如果你想使用 `application/x-www-form-urlencoded` 内容类型发送数据，应在发起请求前调用 `asForm` 方法：

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

如果你想以多部分请求发送文件，应在发起请求前调用 `attach` 方法。该方法接受文件名及其内容。如有需要，你可以提供第三个参数作为文件的文件名，第四个参数可用于提供与文件关联的请求头：

```php
$response = Http::attach(
    'attachment', file_get_contents('photo.jpg'), 'photo.jpg', ['Content-Type' => 'image/jpeg']
)->post('http://example.com/attachments');
```

与其传递文件的原始内容，不如传递流资源：

```php
$photo = fopen('photo.jpg', 'r');

$response = Http::attach(
    'attachment', $photo, 'photo.jpg'
)->post('http://example.com/attachments');
```

<a name="headers"></a>
### 请求头

可以使用 `withHeaders` 方法向请求添加请求头。`withHeaders` 方法接受键 / 值对数组：

```php
$response = Http::withHeaders([
    'X-First' => 'foo',
    'X-Second' => 'bar'
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

你可以使用 `accept` 方法指定应用期望在请求响应中获得的内容类型：

```php
$response = Http::accept('application/json')->get('http://example.com/users');
```

为方便起见，你可以使用 `acceptJson` 方法快速指定应用期望在请求响应中获得 `application/json` 内容类型：

```php
$response = Http::acceptJson()->get('http://example.com/users');
```

`withHeaders` 方法会将新请求头合并到请求现有的请求头中。如有需要，你可以使用 `replaceHeaders` 方法完全替换所有请求头：

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
### 认证

你可以分别使用 `withBasicAuth` 和 `withDigestAuth` 方法指定基本认证和摘要认证凭据：

```php
// Basic authentication...
$response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

// Digest authentication...
$response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);
```

<a name="bearer-tokens"></a>
#### Bearer 令牌

如果你想快速地向请求的 `Authorization` 请求头添加 bearer 令牌，可以使用 `withToken` 方法：

```php
$response = Http::withToken('token')->post(/* ... */);
```

<a name="timeout"></a>
### 超时

`timeout` 方法可用于指定等待响应的最大秒数。默认情况下，HTTP 客户端将在 30 秒后超时：

```php
$response = Http::timeout(3)->get(/* ... */);
```

如果超出了给定的超时时间，将抛出 `Illuminate\Http\Client\ConnectionException` 实例。

你可以使用 `connectTimeout` 方法指定尝试连接服务器时等待的最大秒数。默认值为 10 秒：

```php
$response = Http::connectTimeout(3)->get(/* ... */);
```

<a name="retries"></a>
### 重试

如果你希望 HTTP 客户端在发生客户端或服务器错误时自动重试请求，可以使用 `retry` 方法。`retry` 方法接受请求应尝试的最大次数以及 Laravel 在两次尝试之间应等待的毫秒数：

```php
$response = Http::retry(3, 100)->post(/* ... */);
```

如果你想手动计算两次尝试之间的休眠毫秒数，可以将闭包作为第二个参数传递给 `retry` 方法：

```php
use Exception;

$response = Http::retry(3, function (int $attempt, Exception $exception) {
    return $attempt * 100;
})->post(/* ... */);
```

为方便起见，你还可以将数组作为第一个参数提供给 `retry` 方法。该数组将用于确定后续尝试之间的休眠毫秒数：

```php
$response = Http::retry([100, 200])->post(/* ... */);
```

如有需要，可以向 `retry` 方法传递第三个参数。第三个参数应是一个可调用对象，用于确定是否确实应尝试重试。例如，你可能希望仅在初始请求遇到 `ConnectionException` 时才重试请求：

```php
use Illuminate\Http\Client\PendingRequest;
use Throwable;

$response = Http::retry(3, 100, function (Throwable $exception, PendingRequest $request) {
    return $exception instanceof ConnectionException;
})->post(/* ... */);
```

如果一次请求尝试失败，你可能希望在开始新尝试之前对请求进行修改。你可以通过修改提供给 `retry` 方法的可调用对象的请求参数来实现这一点。例如，如果第一次尝试返回认证错误，你可能希望使用新的授权令牌重试请求：

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

如果所有请求都失败了，将抛出 `Illuminate\Http\Client\RequestException` 实例。如果你想禁用此行为，可以提供值为 `false` 的 `throw` 参数。禁用后，在所有重试都尝试完毕后，客户端收到的最后一个响应将被返回：

```php
$response = Http::retry(3, 100, throw: false)->post(/* ... */);
```

> [!WARNING]
> 如果所有请求都因连接问题而失败，即使 `throw` 参数设置为 `false`，仍会抛出 `Illuminate\Http\Client\ConnectionException`。

<a name="error-handling"></a>
### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端封装不会在客户端或服务器错误（服务器返回的 `400` 和 `500` 级别响应）时抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法判断是否返回了这些错误之一：

```php
// Determine if the status code is >= 200 and < 300...
$response->successful();

// Determine if the status code is >= 400...
$response->failed();

// Determine if the response has a 400 level status code...
$response->clientError();

// Determine if the response has a 500 level status code...
$response->serverError();

// Immediately execute the given callback if there was a client or server error...
$response->onError(callable $callback);
```

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你有一个响应实例，并且希望在响应状态码表明客户端或服务器错误时抛出 `Illuminate\Http\Client\RequestException` 实例，可以使用 `throw` 或 `throwIf` 方法：

```php
use Illuminate\Http\Client\Response;

$response = Http::post(/* ... */);

// Throw an exception if a client or server error occurred...
$response->throw();

// Throw an exception if an error occurred and the given condition is true...
$response->throwIf($condition);

// Throw an exception if an error occurred and the given closure resolves to true...
$response->throwIf(fn (Response $response) => true);

// Throw an exception if an error occurred and the given condition is false...
$response->throwUnless($condition);

// Throw an exception if an error occurred and the given closure resolves to false...
$response->throwUnless(fn (Response $response) => false);

// Throw an exception if the response has a specific status code...
$response->throwIfStatus(403);

// Throw an exception unless the response has a specific status code...
$response->throwUnlessStatus(200);

// Throw an exception if a server error occurred (status >500)...
$response->throwIfServerError();

// Throw an exception if a client error occurred (status >400 and <500)...
$response->throwIfClientError();

return $response['user']['id'];
```

`Illuminate\Http\Client\RequestException` 实例有一个公共的 `$response` 属性，允许你检查返回的响应。

如果没有发生错误，`throw` 方法会返回响应实例，允许你将其他操作链式调用到 `throw` 方法上：

```php
return Http::post(/* ... */)->throw()->json();
```

如果你想在抛出异常前执行一些额外逻辑，可以将闭包传递给 `throw` 方法。在闭包被调用后，异常会自动抛出，因此你无需在闭包内重新抛出异常：

```php
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;

return Http::post(/* ... */)->throw(function (Response $response, RequestException $e) {
    // ...
})->json();
```

默认情况下，`RequestException` 消息在记录或报告时会被截断为 120 个字符。要自定义或禁用此行为，你可以在 `bootstrap/app.php` 文件中配置应用已注册行为时使用 `truncateAt` 和 `dontTruncate` 方法：

```php
use Illuminate\Http\Client\RequestException;

->registered(function (): void {
    // Truncate request exception messages to 240 characters...
    RequestException::truncateAt(240);

    // Disable request exception message truncation...
    RequestException::dontTruncate();
})
```

另外，你可以使用 `truncateExceptionsAt` 方法按请求自定义异常截断行为：

```php
return Http::truncateExceptionsAt(240)->post(/* ... */);
```

<a name="guzzle-middleware"></a>
### Guzzle 中间件

由于 Laravel 的 HTTP 客户端由 Guzzle 驱动，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html)来操作出站请求或检查入站响应。要操作出站请求，请通过 `withRequestMiddleware` 方法注册一个 Guzzle 中间件：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\RequestInterface;

$response = Http::withRequestMiddleware(
    function (RequestInterface $request) {
        return $request->withHeader('X-Example', 'Value');
    }
)->get('http://example.com');
```

同样，你可以通过 `withResponseMiddleware` 方法注册中间件来检查入站 HTTP 响应：

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

有时，你可能希望注册一个适用于每个出站请求和入站响应的中间件。为此，你可以使用 `globalRequestMiddleware` 和 `globalResponseMiddleware` 方法。通常，这些方法应在应用 `AppServiceProvider` 的 `boot` 方法中调用：

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

你可以使用 `withOptions` 方法为出站请求指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受键 / 值对数组：

```php
$response = Http::withOptions([
    'debug' => true,
])->get('http://example.com/users');
```

<a name="global-options"></a>
#### 全局选项

要为每个出站请求配置默认选项，你可以使用 `globalOptions` 方法。通常，此方法应从应用 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

/**
 * Bootstrap any application services.
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

有时，你可能希望同时发起多个 HTTP 请求。换句话说，你希望多个请求在同一时间被分发，而不是按顺序发出。在与慢速 HTTP API 交互时，这可以带来显著的性能提升。

<a name="request-pooling"></a>
### 请求池

幸运的是，你可以使用 `pool` 方法实现这一点。`pool` 方法接受一个闭包，该闭包接收 `Illuminate\Http\Client\Pool` 实例，允许你轻松地将请求添加到请求池中以供分发：

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

如你所见，可以根据每个响应实例被添加到池中的顺序来访问它。如果你愿意，可以使用 `as` 方法为请求命名，从而允许你按名称访问对应的响应：

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

请求池的最大并发数可以通过向 `pool` 方法提供 `concurrency` 参数来控制。此值决定在处理请求池时最多可同时处于进行中的 HTTP 请求数：

```php
$responses = Http::pool(fn (Pool $pool) => [
    // ...
], concurrency: 5);
```

如果池化请求在连接层面失败（例如超时或 DNS 失败），`$responses` 数组中对应的条目将是 `Illuminate\Http\Client\ConnectionException` 实例，而不是 `Response` 实例：

```php
foreach ($responses as $response) {
    if ($response instanceof Throwable) {
        // The request failed to connect...
    } elseif ($response->failed()) {
        // The request connected but received an error response...
    }
}
```

<a name="customizing-concurrent-requests"></a>
#### 自定义并发请求

`pool` 方法不能与其他 HTTP 客户端方法（如 `withHeaders` 或 `middleware` 方法）链式调用。如果你想对池化请求应用自定义请求头或中间件，应在池中的每个请求上配置这些选项：

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

在 Laravel 中处理并发请求的另一种方式是使用 `batch` 方法。与 `pool` 方法类似，它接受一个接收 `Illuminate\Http\Client\Batch` 实例的闭包，允许你轻松地将请求添加到请求池以供分发，但它还允许你定义完成回调：

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
    // The batch has been created but no requests have been initialized...
})->progress(function (Batch $batch, int|string $key, Response $response) {
    // An individual request has completed successfully...
})->then(function (Batch $batch, array $results) {
    // All requests completed successfully...
})->catch(function (Batch $batch, int|string $key, Response|RequestException|ConnectionException $response) {
    // Batch request failure detected...
})->finally(function (Batch $batch, array $results) {
    // The batch has finished executing...
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

通过调用 `send` 方法启动 `batch` 后，就不能再向它添加新请求。尝试这样做将导致抛出 `Illuminate\Http\Client\BatchInProgressException` 异常。

请求批处理的最大并发数可以通过 `concurrency` 方法控制。此值决定在处理请求批处理时最多可同时处于进行中的 HTTP 请求数：

```php
$responses = Http::batch(fn (Batch $batch) => [
    // ...
])->concurrency(5)->send();
```

<a name="inspecting-batches"></a>
#### 检查批处理

提供给批处理完成回调的 `Illuminate\Http\Client\Batch` 实例具有各种属性和方法，可帮助你与给定的请求批处理交互并检查它：

```php
// The number of requests assigned to the batch...
$batch->totalRequests;

// The number of requests that have not been processed yet...
$batch->pendingRequests;

// The number of requests that have failed...
$batch->failedRequests;

// The number of requests that have been processed thus far...
$batch->processedRequests();

// Indicates if the batch has finished executing...
$batch->finished();

// Indicates if the batch has request failures...
$batch->hasFailures();
```

<a name="deferring-batches"></a>
#### 延迟批处理

当调用 `defer` 方法时，请求批处理不会立即执行。相反，Laravel 会在当前应用请求的 HTTP 响应发送给用户后执行该批处理，让你的应用保持快速响应：

```php
use Illuminate\Http\Client\Batch;
use Illuminate\Support\Facades\Http;

$responses = Http::batch(fn (Batch $batch) => [
    $batch->get('http://localhost/first'),
    $batch->get('http://localhost/second'),
    $batch->get('http://localhost/third'),
])->then(function (Batch $batch, array $results) {
    // All requests completed successfully...
})->defer();
```

<a name="macros"></a>
## 宏

Laravel HTTP 客户端允许你定义"宏"，它可以作为一种流畅、富有表现力的机制，用于在应用各处与服务交互时配置常见的请求路径和请求头。要开始使用，你可以在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义宏：

```php
use Illuminate\Support\Facades\Http;

/**
 * Bootstrap any application services.
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

宏配置完成后，你可以从应用中的任何位置调用它，以创建具有指定配置的待处理请求：

```php
$response = Http::github()->get('/');
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供功能帮助你轻松且富有表现力地编写测试，Laravel 的 HTTP 客户端也不例外。`Http` Facade 的 `fake` 方法允许你指示 HTTP 客户端在发起请求时返回桩（stub）/ 虚拟响应。

<a name="faking-responses"></a>
### 模拟响应

例如，要指示 HTTP 客户端对每个请求返回空的、`200` 状态码的响应，你可以不带参数地调用 `fake` 方法：

```php
use Illuminate\Support\Facades\Http;

Http::fake();

$response = Http::post(/* ... */);
```

<a name="faking-specific-urls"></a>
#### 模拟特定 URL

另外，你可以向 `fake` 方法传递一个数组。数组的键应表示你想要模拟的 URL 模式及其关联的响应。`*` 字符可用作通配符。你可以使用 `Http` Facade 的 `response` 方法为这些端点构造桩 / 模拟响应：

```php
Http::fake([
    // Stub a JSON response for GitHub endpoints...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

    // Stub a string response for Google endpoints...
    'google.com/*' => Http::response('Hello World', 200, $headers),
]);
```

对尚未被模拟的 URL 发出的任何请求实际上都会被执行。如果你想指定一个将模拟所有不匹配 URL 的回退 URL 模式，可以使用单个 `*` 字符：

```php
Http::fake([
    // Stub a JSON response for GitHub endpoints...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

    // Stub a string response for all other endpoints...
    '*' => Http::response('Hello World', 200, ['Headers']),
]);
```

为方便起见，可以通过提供字符串、数组或整数作为响应来生成简单的字符串、JSON 和空响应：

```php
Http::fake([
    'google.com/*' => 'Hello World',
    'github.com/*' => ['foo' => 'bar'],
    'chatgpt.com/*' => 200,
]);
```

<a name="faking-connection-exceptions"></a>
#### 模拟连接异常

有时你可能需要测试应用在 HTTP 客户端尝试发起请求时遇到 `Illuminate\Http\Client\ConnectionException` 的行为。你可以使用 `failedConnection` 方法指示 HTTP 客户端抛出连接异常：

```php
Http::fake([
    'github.com/*' => Http::failedConnection(),
]);
```

要测试应用在抛出 `Illuminate\Http\Client\RequestException` 时的行为，可以使用 `failedRequest` 方法：

```php
$this->mock(GithubService::class);
    ->shouldReceive('getUser')
    ->andThrow(
        Http::failedRequest(['code' => 'not_found'], 404)
    );
```

<a name="faking-response-sequences"></a>
#### 模拟响应序列

有时你可能需要指定单个 URL 应按特定顺序返回一系列模拟响应。你可以使用 `Http::sequence` 方法构建这些响应：

```php
Http::fake([
    // Stub a series of responses for GitHub endpoints...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->pushStatus(404),
]);
```

当响应序列中的所有响应都被消耗完毕后，任何进一步的请求都会导致响应序列抛出异常。如果你想指定序列为空时应返回的默认响应，可以使用 `whenEmpty` 方法：

```php
Http::fake([
    // Stub a series of responses for GitHub endpoints...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->whenEmpty(Http::response()),
]);
```

如果你想模拟一系列响应，但无需指定应模拟的特定 URL 模式，可以使用 `Http::fakeSequence` 方法：

```php
Http::fakeSequence()
    ->push('Hello World', 200)
    ->whenEmpty(Http::response());
```

<a name="fake-callback"></a>
#### 模拟回调

如果你需要更复杂的逻辑来确定为某些端点返回哪些响应，可以将闭包传递给 `fake` 方法。该闭包将接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个响应实例。在你的闭包中，你可以执行确定要返回的响应类型所需的任何逻辑：

```php
use Illuminate\Http\Client\Request;

Http::fake(function (Request $request) {
    return Http::response('Hello World', 200);
});
```

<a name="inspecting-requests"></a>
### 检查请求

模拟响应时，你可能偶尔希望检查客户端接收到的请求，以确保你的应用正在发送正确的数据或请求头。你可以通过在调用 `Http::fake` 之后调用 `Http::assertSent` 方法来实现这一点。

`assertSent` 方法接受一个闭包，该闭包将接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，指示该请求是否符合你的预期。为了使测试通过，至少必须发出一个符合给定预期的请求：

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

如有需要，你可以使用 `assertNotSent` 方法断言某个特定请求未被发送：

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

你可以使用 `assertSentCount` 方法断言在测试期间"发送"了多少个请求：

```php
Http::fake();

Http::assertSentCount(5);
```

或者，你可以使用 `assertNothingSent` 方法断言测试期间未发送任何请求：

```php
Http::fake();

Http::assertNothingSent();
```

<a name="recording-requests-and-responses"></a>
#### 记录请求 / 响应

你可以使用 `recorded` 方法收集所有请求及其对应的响应。`recorded` 方法返回一个包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例的数组集合：

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

此外，`recorded` 方法接受一个闭包，该闭包将接收 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例，可用于根据你的预期过滤请求 / 响应对：

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
### 阻止意外请求

如果你想确保通过 HTTP 客户端发送的所有请求在你的单个测试或完整测试套件中都已被模拟，可以调用 `preventStrayRequests` 方法。调用此方法后，任何没有对应模拟响应的请求都将抛出异常，而不是发起实际的 HTTP 请求：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::fake([
    'github.com/*' => Http::response('ok'),
]);

// An "ok" response is returned...
Http::get('https://github.com/laravel/framework');

// An exception is thrown...
Http::get('https://laravel.com');
```

有时，你可能希望阻止大多数意外请求，同时仍允许特定请求执行。为此，你可以向 `allowStrayRequests` 方法传递一个 URL 模式数组。匹配给定模式之一的任何请求都将被允许，而所有其他请求将继续抛出异常：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::allowStrayRequests([
    'http://127.0.0.1:5000/*',
]);

// This request is executed...
Http::get('http://127.0.0.1:5000/generate');

// An exception is thrown...
Http::get('https://laravel.com');
```

<a name="events"></a>
## 事件

Laravel 在发送 HTTP 请求的过程中会触发三个事件。`RequestSending` 事件在请求被发送前触发，而 `ResponseReceived` 事件在给定请求收到响应后触发。如果给定请求未收到响应，则触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都包含一个公共的 `$request` 属性，你可以使用它检查 `Illuminate\Http\Client\Request` 实例。同样，`ResponseReceived` 事件包含 `$request` 属性以及 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以在应用中为这些事件创建[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Http\Client\Events\RequestSending;

class LogRequest
{
    /**
     * Handle the event.
     */
    public function handle(RequestSending $event): void
    {
        // $event->request ...
    }
}
```
