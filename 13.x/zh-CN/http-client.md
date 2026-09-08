# HTTP 客户端

## 简介

Laravel 在 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/) 之上提供了一个富有表现力、极简的 API，让你可以快速发起对外 HTTP 请求，与其他 Web 应用通信。Laravel 对 Guzzle 的封装专注于最常见的使用场景和出色的开发者体验。

## 发起请求

要发起请求，可以使用 `Http` Facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，我们来看看如何向另一个 URL 发起一个基础的 `GET` 请求：

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

`Illuminate\Http\Client\Response` 对象还实现了 PHP 的 `ArrayAccess` 接口，让你可以直接在响应上访问 JSON 响应数据：

```php
return Http::get('http://example.com/users/1')['name'];
```

除了上面列出的响应方法之外，还可以使用以下方法来确定响应是否具有特定的状态码：

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

#### URI 模板

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570) 来构造请求 URL。要定义可以由 URI 模板展开的 URL 参数，可以使用 `withUrlParameters` 方法：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '13.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

#### 转储请求

如果你想在发送请求实例之前将其 dump 出来并终止脚本执行，可以在请求定义的开头添加 `dd` 方法：

```php
return Http::dd()->get('http://example.com');
```

### 请求数据

当然，在发起 `POST`、`PUT` 和 `PATCH` 请求时，携带额外数据是很常见的，因此这些方法接受以数组形式作为第二个参数传入的数据。默认情况下，数据会使用 `application/json` 内容类型发送：

```php
use Illuminate\Support\Facades\Http;

$response = Http::post('http://example.com/users', [
    'name' => 'Steve',
    'role' => 'Network Administrator',
]);
```

#### GET 请求查询参数

发起 `GET` 请求时，你可以直接将查询字符串附加到 URL 上，或者将键值对数组作为第二个参数传递给 `get` 方法：

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

#### 发送表单 URL 编码请求

如果你想使用 `application/x-www-form-urlencoded` 内容类型发送数据，应该在发起请求之前调用 `asForm` 方法：

```php
$response = Http::asForm()->post('http://example.com/users', [
    'name' => 'Sara',
    'role' => 'Privacy Consultant',
]);
```

#### 发送原始请求体

如果你想在发起请求时提供原始请求体，可以使用 `withBody` 方法。内容类型可以通过该方法的第二个参数提供：

```php
$response = Http::withBody(
    base64_encode($photo), 'image/jpeg'
)->post('http://example.com/photo');
```

#### 多部分请求

如果你想以多部分（multi-part）请求的形式发送文件，应该在发起请求之前调用 `attach` 方法。该方法接受文件名及其内容。如果需要，可以提供第三个参数，作为文件的文件名；第四个参数可用于提供与文件相关的 Header：

```php
$response = Http::attach(
    'attachment', file_get_contents('photo.jpg'), 'photo.jpg', ['Content-Type' => 'image/jpeg']
)->post('http://example.com/attachments');
```

你可以传递一个流资源，而不是传递文件的原始内容：

```php
$photo = fopen('photo.jpg', 'r');

$response = Http::attach(
    'attachment', $photo, 'photo.jpg'
)->post('http://example.com/attachments');
```

### 请求头

可以使用 `withHeaders` 方法向请求添加 Header。该 `withHeaders` 方法接受键值对数组：

```php
$response = Http::withHeaders([
    'X-First' => 'foo',
    'X-Second' => 'bar'
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

你可以使用 `accept` 方法来指定你的应用期望在响应该请求时返回的内容类型：

```php
$response = Http::accept('application/json')->get('http://example.com/users');
```

为方便起见，你可以使用 `acceptJson` 方法快速指定你的应用期望在响应该请求时返回 `application/json` 内容类型：

```php
$response = Http::acceptJson()->get('http://example.com/users');
```

`withHeaders` 方法会将新 Header 合并到请求现有的 Header 中。如果需要，可以使用 `replaceHeaders` 方法完全替换所有 Header：

```php
$response = Http::withHeaders([
    'X-Original' => 'foo',
])->replaceHeaders([
    'X-Replacement' => 'bar',
])->post('http://example.com/users', [
    'name' => 'Taylor',
]);
```

### 认证

可以分别使用 `withBasicAuth` 和 `withDigestAuth` 方法指定基本认证和摘要认证凭据：

```php
// 基本认证...
$response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

// 摘要认证...
$response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);
```

#### Bearer 令牌

如果你想快速向请求的 `Authorization` Header 添加 bearer 令牌，可以使用 `withToken` 方法：

```php
$response = Http::withToken('token')->post(/* ... */);
```

### 超时

`timeout` 方法可用于指定等待响应的最大秒数。默认情况下，HTTP 客户端会在 30 秒后超时：

```php
$response = Http::timeout(3)->get(/* ... */);
```

如果超过了给定的超时时间，会抛出 `Illuminate\Http\Client\ConnectionException` 实例。

你可以使用 `connectTimeout` 方法指定在尝试连接到服务器时等待的最大秒数。默认值为 10 秒：

```php
$response = Http::connectTimeout(3)->get(/* ... */);
```

### 重试

如果你希望 HTTP 客户端在发生客户端或服务器错误时自动重试请求，可以使用 `retry` 方法。`retry` 方法接受请求应尝试的最大次数，以及 Laravel 在两次尝试之间应等待的毫秒数：

```php
$response = Http::retry(3, 100)->post(/* ... */);
```

如果你想手动计算两次尝试之间应休眠的毫秒数，可以将一个闭包作为第二个参数传递给 `retry` 方法：

```php
use Exception;

$response = Http::retry(3, function (int $attempt, Exception $exception) {
    return $attempt * 100;
})->post(/* ... */);
```

为方便起见，你也可以将数组作为第一个参数传递给 `retry` 方法。该数组将用于确定后续各次尝试之间应休眠的毫秒数：

```php
$response = Http::retry([100, 200])->post(/* ... */);
```

如果需要，可以将第三个参数传递给 `retry` 方法。第三个参数应该是一个可调用对象，用于决定是否应真正执行重试。例如，你可能希望仅在首次请求遇到 `ConnectionException` 时才重试：

```php
use Illuminate\Http\Client\PendingRequest;
use Throwable;

$response = Http::retry(3, 100, function (Throwable $exception, PendingRequest $request) {
    return $exception instanceof ConnectionException;
})->post(/* ... */);
```

如果一次请求尝试失败，你可能希望在发起新尝试之前对请求做一些修改。你可以通过修改传给 `retry` 方法的可调用对象的 `request` 参数来实现。例如，如果首次尝试返回了认证错误，你可能希望使用一个新授权令牌重试该请求：

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

如果所有请求都失败了，会抛出 `Illuminate\Http\Client\RequestException` 实例。如果你想禁用此行为，可以提供一个值为 `false` 的 `throw` 参数。禁用后，在所有重试尝试完成后，客户端会返回收到的最后一个响应：

```php
$response = Http::retry(3, 100, throw: false)->post(/* ... */);
```

> [!WARNING]
> 如果所有请求都因为连接问题而失败，即使 `throw` 参数设置为 `false`，仍然会抛出 `Illuminate\Http\Client\ConnectionException`。

### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端封装不会在客户端或服务器错误（服务器的 `400` 和 `500` 级别响应）时抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法判断是否返回了这些错误之一：

```php
// 判断状态码是否 >= 200 且 < 300...
$response->successful();

// 判断状态码是否 >= 400...
$response->failed();

// 判断响应是否具有 400 级别的状态码...
$response->clientError();

// 判断响应是否具有 500 级别的状态码...
$response->serverError();

// 如果发生客户端或服务器错误，立即执行给定的回调...
$response->onError(callable $callback);
```

#### 抛出异常

如果你有一个响应实例，并且希望在响应状态码表示客户端或服务器错误时抛出 `Illuminate\Http\Client\RequestException` 实例，可以使用 `throw` 或 `throwIf` 方法：

```php
use Illuminate\Http\Client\Response;

$response = Http::post(/* ... */);

// 如果发生客户端或服务器错误，抛出异常...
$response->throw();

// 如果发生错误且给定条件为真，抛出异常...
$response->throwIf($condition);

// 如果发生错误且给定闭包求值为真，抛出异常...
$response->throwIf(fn (Response $response) => true);

// 如果发生错误且给定条件为假，抛出异常...
$response->throwUnless($condition);

// 如果发生错误且给定闭包求值为假，抛出异常...
$response->throwUnless(fn (Response $response) => false);

// 如果响应具有特定状态码，抛出异常...
$response->throwIfStatus(403);

// 除非响应具有特定状态码，否则抛出异常...
$response->throwUnlessStatus(200);

// 如果发生服务器错误（状态码 > 500），抛出异常...
$response->throwIfServerError();

// 如果发生客户端错误（状态码 > 400 且 < 500），抛出异常...
$response->throwIfClientError();

return $response['user']['id'];
```

`Illuminate\Http\Client\RequestException` 实例有一个公开的 `$response` 属性，让你可以检查返回的响应。

`throw` 方法在没有发生错误时会返回响应实例，让你可以将其他操作链式调用到 `throw` 方法上：

```php
return Http::post(/* ... */)->throw()->json();
```

如果你想在抛出异常之前执行一些额外逻辑，可以向 `throw` 方法传递一个闭包。该闭包被调用后，异常会自动抛出，因此你无需在闭包内部重新抛出异常：

```php
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;

return Http::post(/* ... */)->throw(function (Response $response, RequestException $e) {
    // ...
})->json();
```

默认情况下，`RequestException` 消息在被记录或上报时会截断为 120 个字符。要自定义或禁用此行为，可以在 `bootstrap/app.php` 文件中配置应用的注册行为时使用 `truncateAt` 和 `dontTruncate` 方法：

```php
use Illuminate\Http\Client\RequestException;

->registered(function (): void {
    // 将请求异常消息截断为 240 个字符...
    RequestException::truncateAt(240);

    // 禁用请求异常消息截断...
    RequestException::dontTruncate();
})
```

或者，你可以使用 `truncateExceptionsAt` 方法为每个请求自定义异常截断行为：

```php
return Http::truncateExceptionsAt(240)->post(/* ... */);
```

### Guzzle 中间件

由于 Laravel 的 HTTP 客户端由 Guzzle 驱动，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html) 来操纵对外请求或检查传入响应。要操纵对外请求，可以通过 `withRequestMiddleware` 方法注册一个 Guzzle 中间件：

```php
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\RequestInterface;

$response = Http::withRequestMiddleware(
    function (RequestInterface $request) {
        return $request->withHeader('X-Example', 'Value');
    }
)->get('http://example.com');
```

同样，你可以通过 `withResponseMiddleware` 方法注册一个中间件来检查传入的 HTTP 响应：

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

#### 全局中间件

有时，你可能希望注册一个适用于每个对外请求和传入响应的中间件。为此，可以使用 `globalRequestMiddleware` 和 `globalResponseMiddleware` 方法。通常，这些方法应该在应用 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

Http::globalRequestMiddleware(fn ($request) => $request->withHeader(
    'User-Agent', 'Example Application/1.0'
));

Http::globalResponseMiddleware(fn ($response) => $response->withHeader(
    'X-Finished-At', now()->toDateTimeString()
));
```

### Guzzle 选项

你可以使用 `withOptions` 方法为对外请求指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受键值对数组：

```php
$response = Http::withOptions([
    'debug' => true,
])->get('http://example.com/users');
```

#### 全局选项

要为每一个对外请求配置默认选项，可以使用 `globalOptions` 方法。通常，该方法应该从应用 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Http;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Http::globalOptions([
        'allow_redirects' => false,
    ]);
}
```

## 并发请求

有时，你可能希望并发发起多个 HTTP 请求。换句话说，你希望同时分发多个请求，而不是按顺序发起请求。在与响应缓慢的 HTTP API 交互时，这可以带来显著的性能提升。

### 请求池

值得庆幸的是，你可以使用 `pool` 方法来实现这一点。`pool` 方法接受一个闭包，该闭包接收一个 `Illuminate\Http\Client\Pool` 实例，让你可以轻松地将请求添加到请求池中以进行分发：

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

如你所见，每个响应实例都可以根据它被添加到池中的顺序来访问。如果需要，你可以使用 `as` 方法为请求命名，从而按名称访问对应的响应：

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

请求池的最大并发数可以通过向 `pool` 方法提供 `concurrency` 参数来控制。该值决定了在处理请求池时，最大可以有多少个 HTTP 请求同时处于进行中（in-flight）：

```php
$responses = Http::pool(fn (Pool $pool) => [
    // ...
], concurrency: 5);
```

如果池中的某个请求在连接级别失败（例如超时或 DNS 失败），`$responses` 数组中对应的条目将是一个 `Illuminate\Http\Client\ConnectionException` 实例，而不是 `Response` 实例：

```php
foreach ($responses as $response) {
    if ($response instanceof Throwable) {
        // 请求连接失败...
    } elseif ($response->failed()) {
        // 请求已连接但收到了错误响应...
    }
}
```

#### 自定义并发请求

`pool` 方法无法与其他 HTTP 客户端方法（如 `withHeaders` 或 `middleware` 方法）链式调用。如果你想将自定义 Header 或中间件应用到池中的请求，应该在池中的每个请求上配置这些选项：

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

### 请求批处理

在 Laravel 中处理并发请求的另一种方式是使用 `batch` 方法。与 `pool` 方法类似，它接受一个闭包，该闭包接收一个 `Illuminate\Http\Client\Batch` 实例，让你可以轻松地将请求添加到请求池中以进行分发，但它还允许你定义完成回调：

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
    // 批次已创建，但尚未初始化任何请求...
})->progress(function (Batch $batch, int|string $key, Response $response) {
    // 单个请求已成功完成...
})->then(function (Batch $batch, array $results) {
    // 所有请求已成功完成...
})->catch(function (Batch $batch, int|string $key, Response|RequestException|ConnectionException $response) {
    // 检测到批次请求失败...
})->finally(function (Batch $batch, array $results) {
    // 批次已完成执行...
})->send();
```

与 `pool` 方法类似，你可以使用 `as` 方法为请求命名：

```php
$responses = Http::batch(fn (Batch $batch) => [
    $batch->as('first')->get('http://localhost/first'),
    $batch->as('second')->get('http://localhost/second'),
    $batch->as('third')->get('http://localhost/third'),
])->send();
```

调用 `send` 方法启动 `batch` 后，不能再向其中添加新请求。尝试这样做会导致抛出 `Illuminate\Http\Client\BatchInProgressException` 异常。

请求批次的最大并发数可以通过 `concurrency` 方法控制。该值决定了在处理请求批次时，最大可以有多少个 HTTP 请求同时处于进行中（in-flight）：

```php
$responses = Http::batch(fn (Batch $batch) => [
    // ...
])->concurrency(5)->send();
```

#### 检查批处理

提供给批次完成回调的 `Illuminate\Http\Client\Batch` 实例拥有多种属性和方法，帮助你与给定的请求批次交互并检查它：

```php
// 分配给批次的请求数量...
$batch->totalRequests;

// 尚未处理的请求数量...
$batch->pendingRequests;

// 已失败的请求数量...
$batch->failedRequests;

// 迄今已处理的请求数量...
$batch->processedRequests();

// 指示批次是否已执行完毕...
$batch->finished();

// 指示批次是否存在请求失败...
$batch->hasFailures();
```

#### 延迟批处理

当调用 `defer` 方法时，请求批次不会立即执行。相反，Laravel 会在当前应用请求的 HTTP 响应发送给用户之后再执行该批次，让你的应用保持快速和响应灵敏：

```php
use Illuminate\Http\Client\Batch;
use Illuminate\Support\Facades\Http;

$responses = Http::batch(fn (Batch $batch) => [
    $batch->get('http://localhost/first'),
    $batch->get('http://localhost/second'),
    $batch->get('http://localhost/third'),
])->then(function (Batch $batch, array $results) {
    // 所有请求已成功完成...
})->defer();
```

## 宏

Laravel HTTP 客户端允许你定义"macro（宏）"，它可以作为一种流畅、富有表现力的机制，用于在与整个应用中的服务交互时配置通用的请求路径和 Header。要开始使用，你可以在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义该宏：

```php
use Illuminate\Support\Facades\Http;

/**
 * 引导任意应用服务。
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

配置好宏之后，你可以从应用的任何位置调用它，以使用指定配置创建一个待处理请求：

```php
$response = Http::github()->get('/');
```

## 测试

许多 Laravel 服务都提供了帮助你轻松且富有表现力地编写测试的功能，Laravel 的 HTTP 客户端也不例外。`Http` Facade 的 `fake` 方法允许你指示 HTTP 客户端在发起请求时返回桩（stub）/ 虚拟响应。

### 伪造响应

例如，要指示 HTTP 客户端为每个请求返回空的 `200` 状态码响应，可以不带参数地调用 `fake` 方法：

```php
use Illuminate\Support\Facades\Http;

Http::fake();

$response = Http::post(/* ... */);
```

#### 伪造特定 URL

或者，你可以将一个数组传递给 `fake` 方法。数组的键应该表示你希望伪造的 URL 模式及其关联的响应。`*` 字符可以用作通配符。你可以使用 `Http` Facade 的 `response` 方法为这些端点构造桩 / 伪造响应：

```php
Http::fake([
    // 为 GitHub 端点桩一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

    // 为 Google 端点桩一个字符串响应...
    'google.com/*' => Http::response('Hello World', 200, $headers),
]);
```

任何向未伪造的 URL 发起的请求都将被实际执行。如果你想指定一个回退 URL 模式来桩所有未匹配的 URL，可以使用单个 `*` 字符：

```php
Http::fake([
    // 为 GitHub 端点桩一个 JSON 响应...
    'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

    // 为所有其他端点桩一个字符串响应...
    '*' => Http::response('Hello World', 200, ['Headers']),
]);
```

为方便起见，简单的字符串、JSON 和空响应可以通过提供字符串、数组或整数作为响应来生成：

```php
Http::fake([
    'google.com/*' => 'Hello World',
    'github.com/*' => ['foo' => 'bar'],
    'chatgpt.com/*' => 200,
]);
```

#### 伪造异常

有时你可能需要测试应用在 HTTP 客户端尝试发起请求时遇到 `Illuminate\Http\Client\ConnectionException` 的行为。你可以使用 `failedConnection` 方法指示 HTTP 客户端抛出一个连接异常：

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

#### 伪造响应序列

有时你可能需要指定单个 URL 应按特定顺序返回一系列伪造响应。你可以使用 `Http::sequence` 方法来构建这些响应：

```php
Http::fake([
    // 为 GitHub 端点桩一系列响应...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->pushStatus(404),
]);
```

当响应序列中的所有响应都被消耗完后，任何进一步的请求都会导致响应序列抛出异常。如果你想指定在序列为空时应返回的默认响应，可以使用 `whenEmpty` 方法：

```php
Http::fake([
    // 为 GitHub 端点桩一系列响应...
    'github.com/*' => Http::sequence()
        ->push('Hello World', 200)
        ->push(['foo' => 'bar'], 200)
        ->whenEmpty(Http::response()),
]);
```

如果你想伪造一系列响应，但不需要指定应伪造的特定 URL 模式，可以使用 `Http::fakeSequence` 方法：

```php
Http::fakeSequence()
    ->push('Hello World', 200)
    ->whenEmpty(Http::response());
```

#### 伪造回调

如果你需要更复杂的逻辑来确定为某些端点返回什么响应，可以向 `fake` 方法传递一个闭包。该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个响应实例。在闭包内部，你可以执行任何必要的逻辑来决定返回何种类型的响应：

```php
use Illuminate\Http\Client\Request;

Http::fake(function (Request $request) {
    return Http::response('Hello World', 200);
});
```

### 检查请求

伪造响应时，你偶尔可能希望检查客户端收到的请求，以确保你的应用发送了正确的数据或 Header。你可以在调用 `Http::fake` 之后调用 `Http::assertSent` 方法来实现。

`assertSent` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，指示该请求是否符合你的预期。为了让测试通过，必须至少发出一个符合给定预期的请求：

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

如果需要，可以使用 `assertNotSent` 方法断言某个特定请求未被发送：

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

你可以使用 `assertSentCount` 方法断言测试期间"发送"了多少个请求：

```php
Http::fake();

Http::assertSentCount(5);
```

或者，你可以使用 `assertNothingSent` 方法断言测试期间没有发送任何请求：

```php
Http::fake();

Http::assertNothingSent();
```

#### 记录请求 / 响应

你可以使用 `recorded` 方法收集所有请求及其对应的响应。`recorded` 方法返回一个数组集合，其中包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 的实例：

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

此外，`recorded` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例，并可用于根据你的预期过滤请求 / 响应对：

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

### 阻止多余请求

如果你希望确保通过 HTTP 客户端发送的所有请求在你的单个测试或完整测试套件中都已被伪造，可以调用 `preventStrayRequests` 方法。调用此方法后，任何没有对应伪造响应的请求都会抛出异常，而不是发出实际的 HTTP 请求：

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

有时，你可能希望阻止大多数游离请求，同时仍允许特定的请求执行。为此，你可以将一个 URL 模式数组传递给 `allowStrayRequests` 方法。任何匹配给定模式的请求都将被允许，而其他所有请求将继续抛出异常：

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();

Http::allowStrayRequests([
    'http://127.0.0.1:5000/*',
]);

// 该请求会被执行...
Http::get('http://127.0.0.1:5000/generate');

// 抛出异常...
Http::get('https://laravel.com');
```

## 事件

Laravel 在发送 HTTP 请求的过程中会触发三个事件。在请求被发送之前会触发 `RequestSending` 事件，而在收到给定请求的响应后会触发 `ResponseReceived` 事件。如果未收到给定请求的响应，则会触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都包含一个公开的 `$request` 属性，你可以使用它来检查 `Illuminate\Http\Client\Request` 实例。同样，`ResponseReceived` 事件包含 `$request` 属性以及 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以在应用中为这些事件创建[事件监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)：

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
