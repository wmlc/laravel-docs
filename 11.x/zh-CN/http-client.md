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
- [宏](#macros)
- [测试](#testing)
    - [伪造响应](#faking-responses)
    - [检查请求](#inspecting-requests)
    - [防止意外请求](#preventing-stray-requests)
- [事件](#events)

<a name="introduction"></a>
## 简介

Laravel 在 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/)之上提供了一套 expressive、极简的 API，让你能够快速发起对外 HTTP 请求，与其他 Web 应用进行通信。Laravel 对 Guzzle 的封装聚焦于其最常见的用例，并带来出色的开发者体验。

<a name="making-requests"></a>
## 发起请求

要发起请求，可以使用 `Http` Facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，我们来看看如何发起一个基本的 `GET` 请求：

    use Illuminate\Support\Facades\Http;

    $response = Http::get('http://example.com');

`get` 方法返回一个 `Illuminate\Http\Client\Response` 实例，该实例提供了多种可用于检查响应的方法：

    $response->body() : string;
    $response->json($key = null, $default = null) : mixed;
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

`Illuminate\Http\Client\Response` 对象还实现了 PHP 的 `ArrayAccess` 接口，因此你可以直接在响应上访问 JSON 响应数据：

    return Http::get('http://example.com/users/1')['name'];

除了上面列出的响应方法之外，还可以使用以下方法判断响应是否具有某个给定的状态码：

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

<a name="uri-templates"></a>
#### URI 模板

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570)来构造请求 URL。要定义可由 URI 模板展开的 URL 参数，可以使用 `withUrlParameters` 方法：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '11.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

<a name="dumping-requests"></a>
#### 转储请求

如果你希望在传出请求实例发送之前将其转储并终止脚本执行，可以在请求定义的开头添加 `dd` 方法：

    return Http::dd()->get('http://example.com');

<a name="request-data"></a>
### 请求数据

当然，在发起 `POST`、`PUT` 和 `PATCH` 请求时，通常会随请求一起发送额外数据，因此这些方法接受一个数据数组作为第二个参数。默认情况下，数据会使用 `application/json` 内容类型发送：

    use Illuminate\Support\Facades\Http;

    $response = Http::post('http://example.com/users', [
        'name' => 'Steve',
        'role' => 'Network Administrator',
    ]);

<a name="get-request-query-parameters"></a>
#### GET 请求的查询参数

发起 `GET` 请求时，你可以直接把查询字符串追加到 URL 上，也可以把一个键 / 值对数组作为 `get` 方法的第二个参数传入：

    $response = Http::get('http://example.com/users', [
        'name' => 'Taylor',
        'page' => 1,
    ]);

或者，也可以使用 `withQueryParameters` 方法：

    Http::retry(3, 100)->withQueryParameters([
        'name' => 'Taylor',
        'page' => 1,
    ])->get('http://example.com/users')

<a name="sending-form-url-encoded-requests"></a>
#### 发送表单 URL 编码的请求

如果你希望使用 `application/x-www-form-urlencoded` 内容类型发送数据，应当在发起请求之前调用 `asForm` 方法：

    $response = Http::asForm()->post('http://example.com/users', [
        'name' => 'Sara',
        'role' => 'Privacy Consultant',
    ]);

<a name="sending-a-raw-request-body"></a>
#### 发送原始请求体

如果你希望在发起请求时提供一个原始请求体，可以使用 `withBody` 方法。内容类型可通过该方法的第二个参数提供：

    $response = Http::withBody(
        base64_encode($photo), 'image/jpeg'
    )->post('http://example.com/photo');

<a name="multi-part-requests"></a>
#### 多部分请求

如果你希望以多部分请求的形式发送文件，应当在发起请求之前调用 `attach` 方法。该方法接受文件名及其内容。如有需要，你可以提供第三个参数作为文件名，第四个参数则用于提供与该文件关联的请求头：

    $response = Http::attach(
        'attachment', file_get_contents('photo.jpg'), 'photo.jpg', ['Content-Type' => 'image/jpeg']
    )->post('http://example.com/attachments');

除了传入文件的原始内容，你也可以传入一个流资源：

    $photo = fopen('photo.jpg', 'r');

    $response = Http::attach(
        'attachment', $photo, 'photo.jpg'
    )->post('http://example.com/attachments');

<a name="headers"></a>
### 请求头

可以使用 `withHeaders` 方法为请求添加请求头。该 `withHeaders` 方法接受一个键 / 值对数组：

    $response = Http::withHeaders([
        'X-First' => 'foo',
        'X-Second' => 'bar'
    ])->post('http://example.com/users', [
        'name' => 'Taylor',
    ]);

你可以使用 `accept` 方法指定你的应用期望响应返回的内容类型：

    $response = Http::accept('application/json')->get('http://example.com/users');

为了方便，你可以使用 `acceptJson` 方法快速指定你的应用期望响应返回 `application/json` 内容类型：

    $response = Http::acceptJson()->get('http://example.com/users');

`withHeaders` 方法会把新的请求头合并到请求已有的请求头中。如有需要，你可以使用 `replaceHeaders` 方法完全替换所有请求头：

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

    // 基本认证...
    $response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

    // 摘要认证...
    $response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);

<a name="bearer-tokens"></a>
#### Bearer 令牌

如果你希望快速把一个 Bearer 令牌添加到请求的 `Authorization` 请求头，可以使用 `withToken` 方法：

    $response = Http::withToken('token')->post(/* ... */);

<a name="timeout"></a>
### 超时

`timeout` 方法可用于指定等待响应的最大秒数。默认情况下，HTTP 客户端会在 30 秒后超时：

    $response = Http::timeout(3)->get(/* ... */);

如果超过给定的超时时间，系统会抛出一个 `Illuminate\Http\Client\ConnectionException` 实例。

你可以使用 `connectTimeout` 方法指定尝试连接到服务器时等待的最大秒数：

    $response = Http::connectTimeout(3)->get(/* ... */);

<a name="retries"></a>
### 重试

如果你希望 HTTP 客户端在发生客户端错误或服务器错误时自动重试请求，可以使用 `retry` 方法。`retry` 方法接受请求最多应尝试的次数，以及 Laravel 在两次尝试之间应等待的毫秒数：

    $response = Http::retry(3, 100)->post(/* ... */);

如果你希望手动计算两次尝试之间应休眠的毫秒数，可以把一个闭包作为 `retry` 方法的第二个参数传入：

    use Exception;

    $response = Http::retry(3, function (int $attempt, Exception $exception) {
        return $attempt * 100;
    })->post(/* ... */);

为了方便，你也可以把一个数组作为 `retry` 方法的第一个参数提供。该数组将用于确定后续两次尝试之间应休眠多少毫秒：

    $response = Http::retry([100, 200])->post(/* ... */);

如有需要，你可以向 `retry` 方法传入第三个参数。该第三个参数应是一个可调用对象，用于决定是否真正进行重试。例如，你可能希望只在初次请求遇到 `ConnectionException` 时才重试：

    use Exception;
    use Illuminate\Http\Client\PendingRequest;

    $response = Http::retry(3, 100, function (Exception $exception, PendingRequest $request) {
        return $exception instanceof ConnectionException;
    })->post(/* ... */);

如果某次请求尝试失败，你可能希望在进行新一次尝试之前对请求做一些修改。你可以实现这一点，方式是修改传给 `retry` 方法所接收可调用对象的请求参数。例如，如果第一次尝试返回了认证错误，你可能想用新的认证令牌重试该请求：

    use Exception;
    use Illuminate\Http\Client\PendingRequest;
    use Illuminate\Http\Client\RequestException;

    $response = Http::withToken($this->getToken())->retry(2, 0, function (Exception $exception, PendingRequest $request) {
        if (! $exception instanceof RequestException || $exception->response->status() !== 401) {
            return false;
        }

        $request->withToken($this->getNewToken());

        return true;
    })->post(/* ... */);

如果所有请求都失败，系统会抛出一个 `Illuminate\Http\Client\RequestException` 实例。如果你想禁用这一行为，可以提供一个值为 `false` 的 `throw` 参数。禁用之后，在所有重试都已尝试完毕后，客户端收到的最后一个响应会被返回：

    $response = Http::retry(3, 100, throw: false)->post(/* ... */);

> [!WARNING]
> 如果所有请求都因连接问题而失败，即使把 `throw` 参数设为 `false`，仍然会抛出 `Illuminate\Http\Client\ConnectionException`。

<a name="error-handling"></a>
### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端封装在客户端错误或服务器错误（服务器返回 `400` 和 `500` 级别的响应）时不会抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法判断是否返回了这类错误：

    // 判断状态码是否 >= 200 且 < 300...
    $response->successful();

    // 判断状态码是否 >= 400...
    $response->failed();

    // 判断响应是否具有 400 级别的状态码...
    $response->clientError();

    // 判断响应是否具有 500 级别的状态码...
    $response->serverError();

    // 如果发生客户端错误或服务器错误，立即执行给定的回调...
    $response->onError(callable $callback);

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你手上有一个响应实例，并且希望在响应状态码表明出现客户端错误或服务器错误时抛出 `Illuminate\Http\Client\RequestException` 实例，可以使用 `throw` 或 `throwIf` 方法：

    use Illuminate\Http\Client\Response;

    $response = Http::post(/* ... */);

    // 如果发生客户端错误或服务器错误，则抛出异常...
    $response->throw();

    // 如果发生错误且给定条件为 true，则抛出异常...
    $response->throwIf($condition);

    // 如果发生错误且给定闭包求值为 true，则抛出异常...
    $response->throwIf(fn (Response $response) => true);

    // 如果发生错误且给定条件为 false，则抛出异常...
    $response->throwUnless($condition);

    // 如果发生错误且给定闭包求值为 false，则抛出异常...
    $response->throwUnless(fn (Response $response) => false);

    // 如果响应具有特定状态码，则抛出异常...
    $response->throwIfStatus(403);

    // 除非响应具有特定状态码，否则抛出异常...
    $response->throwUnlessStatus(200);

    return $response['user']['id'];

`Illuminate\Http\Client\RequestException` 实例拥有一个公共的 `$response` 属性，你可以通过它检查返回的响应。

如果未发生错误，`throw` 方法会返回该响应实例，从而允许你把其他操作链式调用到 `throw` 方法之后：

    return Http::post(/* ... */)->throw()->json();

如果你希望在抛出异常之前执行一些额外的逻辑，可以把一个闭包传给 `throw` 方法。闭包被调用之后异常会自动抛出，因此你不需要在闭包内部重新抛出异常：

    use Illuminate\Http\Client\Response;
    use Illuminate\Http\Client\RequestException;

    return Http::post(/* ... */)->throw(function (Response $response, RequestException $e) {
        // ...
    })->json();

默认情况下，`RequestException` 消息在记录或报告时会被截断为 120 个字符。要自定义或禁用该行为，可以在应用的 `bootstrap/app.php` 文件中配置异常处理行为时使用 `truncateRequestExceptionsAt` 和 `dontTruncateRequestExceptions` 方法：

    ->withExceptions(function (Exceptions $exceptions) {
        // 将请求异常消息截断为 240 个字符...
        $exceptions->truncateRequestExceptionsAt(240);

        // 禁用请求异常消息截断...
        $exceptions->dontTruncateRequestExceptions();
    })

<a name="guzzle-middleware"></a>
### Guzzle 中间件

由于 Laravel 的 HTTP 客户端由 Guzzle 驱动，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html)来操作传出的请求或检查传入的响应。要操作传出的请求，可以通过 `withRequestMiddleware` 方法注册一个 Guzzle 中间件：

    use Illuminate\Support\Facades\Http;
    use Psr\Http\Message\RequestInterface;

    $response = Http::withRequestMiddleware(
        function (RequestInterface $request) {
            return $request->withHeader('X-Example', 'Value');
        }
    )->get('http://example.com');

同样地，你可以通过 `withResponseMiddleware` 方法注册一个中间件来检查传入的 HTTP 响应：

    use Illuminate\Support\Facades\Http;
    use Psr\Http\Message\ResponseInterface;

    $response = Http::withResponseMiddleware(
        function (ResponseInterface $response) {
            $header = $response->getHeader('X-Example');

            // ...

            return $response;
        }
    )->get('http://example.com');

<a name="global-middleware"></a>
#### 全局中间件

有时，你可能希望注册一个适用于每个传出请求和传入响应的中间件。为此，你可以使用 `globalRequestMiddleware` 和 `globalResponseMiddleware` 方法。通常，应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用这两个方法：

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

你可以使用 `withOptions` 方法为传出的请求指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受一个键 / 值对数组：

    $response = Http::withOptions([
        'debug' => true,
    ])->get('http://example.com/users');

<a name="global-options"></a>
#### 全局选项

要为每个传出请求配置默认选项，可以使用 `globalOptions` 方法。通常，应当在应用的 `AppServiceProvider` 的 `boot` 方法中调用该方法：

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

有时，你可能希望并发发起多个 HTTP 请求。换句话说，你希望同时派发多个请求，而不是依次发起这些请求。在与响应缓慢的 HTTP API 交互时，这可以带来可观的性能提升。

幸运的是，你可以使用 `pool` 方法来实现这一点。`pool` 方法接受一个接收 `Illuminate\Http\Client\Pool` 实例的闭包，让你能够轻松地把请求添加到请求池中以便派发：

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

如你所见，每个响应实例都可以根据其被添加到池中的顺序来访问。如果愿意，你可以使用 `as` 方法为请求命名，从而按名称访问相应的响应：

    use Illuminate\Http\Client\Pool;
    use Illuminate\Support\Facades\Http;

    $responses = Http::pool(fn (Pool $pool) => [
        $pool->as('first')->get('http://localhost/first'),
        $pool->as('second')->get('http://localhost/second'),
        $pool->as('third')->get('http://localhost/third'),
    ]);

    return $responses['first']->ok();

<a name="customizing-concurrent-requests"></a>
#### 自定义并发请求

`pool` 方法无法与 `withHeaders` 或 `middleware` 等其他 HTTP 客户端方法链式调用。如果你想对池中的请求应用自定义请求头或中间件，应当在池中为每个请求配置这些选项：

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

<a name="macros"></a>
## 宏

Laravel 的 HTTP 客户端允许你定义"宏"，它可以充当一种 fluent、富有表达力的机制，用于配置与应用中各个服务交互时常见的请求路径和请求头。要开始上手，你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义宏：

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

宏配置完成后，你就可以在应用中的任何位置调用它，以创建一个带有指定配置的待处理请求：

```php
$response = Http::github()->get('/');
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供相应功能，帮助你轻松且富有表达力地编写测试，Laravel 的 HTTP 客户端也不例外。`Http` Facade 的 `fake` 方法允许你指示 HTTP 客户端在发起请求时返回桩 / 虚拟响应。

<a name="faking-responses"></a>
### 伪造响应

例如，要指示 HTTP 客户端为每个请求返回状态码为空的 `200` 响应，可以不带参数调用 `fake` 方法：

    use Illuminate\Support\Facades\Http;

    Http::fake();

    $response = Http::post(/* ... */);

<a name="faking-specific-urls"></a>
#### 伪造特定 URL

或者，你可以向 `fake` 方法传入一个数组。该数组的键应表示你希望伪造的 URL 模式及其对应的响应。`*` 字符可用作通配符。任何发往未被伪造的 URL 的请求都会真正执行。你可以使用 `Http` Facade 的 `response` 方法为这些端点构造桩 / 伪造响应：

    Http::fake([
        // 为 GitHub 端点桩一个 JSON 响应...
        'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

        // 为 Google 端点桩一个字符串响应...
        'google.com/*' => Http::response('Hello World', 200, $headers),
    ]);

如果你想指定一个回退 URL 模式，用来为所有未匹配的 URL 桩响应，可以使用单个 `*` 字符：

    Http::fake([
        // 为 GitHub 端点桩一个 JSON 响应...
        'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

        // 为所有其他端点桩一个字符串响应...
        '*' => Http::response('Hello World', 200, ['Headers']),
    ]);

为了方便，你只需提供字符串、数组或整数作为响应，即可生成简单的字符串、JSON 和空响应：

    Http::fake([
        'google.com/*' => 'Hello World',
        'github.com/*' => ['foo' => 'bar'],
        'chatgpt.com/*' => 200,
    ]);

<a name="faking-connection-exceptions"></a>
#### 伪造连接异常

有时你可能需要测试应用在 HTTP 客户端尝试发起请求时遇到 `Illuminate\Http\Client\ConnectionException` 的行为。你可以使用 `failedConnection` 方法指示 HTTP 客户端抛出连接异常：

    Http::fake([
        'github.com/*' => Http::failedConnection(),
    ]);

<a name="faking-response-sequences"></a>
#### 伪造响应序列

有时你可能需要指定某个 URL 按特定顺序返回一系列伪造响应。你可以使用 `Http::sequence` 方法构建这些响应来实现：

    Http::fake([
        // 为 GitHub 端点桩一系列响应...
        'github.com/*' => Http::sequence()
            ->push('Hello World', 200)
            ->push(['foo' => 'bar'], 200)
            ->pushStatus(404),
    ]);

当一个响应序列中的所有响应都被消费完毕后，后续任何请求都会导致该响应序列抛出异常。如果你想指定在序列为空时返回的默认响应，可以使用 `whenEmpty` 方法：

    Http::fake([
        // 为 GitHub 端点桩一系列响应...
        'github.com/*' => Http::sequence()
            ->push('Hello World', 200)
            ->push(['foo' => 'bar'], 200)
            ->whenEmpty(Http::response()),
    ]);

如果你想伪造一系列响应，但不需要指定要伪造的特定 URL 模式，可以使用 `Http::fakeSequence` 方法：

    Http::fakeSequence()
        ->push('Hello World', 200)
        ->whenEmpty(Http::response());

<a name="fake-callback"></a>
#### 伪造回调

如果你需要更复杂的逻辑来判断某些端点应返回什么响应，可以把一个闭包传给 `fake` 方法。该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个响应实例。在闭包内部，你可以执行任何必要的逻辑来判断应返回哪种类型的响应：

    use Illuminate\Http\Client\Request;

    Http::fake(function (Request $request) {
        return Http::response('Hello World', 200);
    });

<a name="preventing-stray-requests"></a>
### 防止意外请求

如果你希望确保在某个测试或整个测试套件中，所有通过 HTTP 客户端发送的请求都已被伪造，可以调用 `preventStrayRequests` 方法。调用该方法之后，任何没有对应伪造响应的请求都会抛出异常，而不会真正发起 HTTP 请求：

    use Illuminate\Support\Facades\Http;

    Http::preventStrayRequests();

    Http::fake([
        'github.com/*' => Http::response('ok'),
    ]);

    // 会返回一个 "ok" 响应...
    Http::get('https://github.com/laravel/framework');

    // 会抛出一个异常...
    Http::get('https://laravel.com');

<a name="inspecting-requests"></a>
### 检查请求

在伪造响应时，你可能偶尔希望检查客户端收到的请求，以确保你的应用发送了正确的数据或请求头。你可以在调用 `Http::fake` 之后调用 `Http::assertSent` 方法来实现这一点。

`assertSent` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，指示该请求是否与你的预期相符。要让测试通过，至少必须有一个已发出的请求与给定预期相符：

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

如有需要，你可以使用 `assertNotSent` 方法断言某个特定请求没有被发送：

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

你可以使用 `assertSentCount` 方法断言测试期间"发送"了多少个请求：

    Http::fake();

    Http::assertSentCount(5);

或者，你可以使用 `assertNothingSent` 方法断言测试期间没有发送任何请求：

    Http::fake();

    Http::assertNothingSent();

<a name="recording-requests-and-responses"></a>
#### 记录请求 / 响应

你可以使用 `recorded` 方法收集所有请求及其对应的响应。`recorded` 方法返回一个数组集合，其中包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例：

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

此外，`recorded` 方法还接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例和一个 `Illuminate\Http\Client\Response` 实例，可用于根据你的预期筛选请求 / 响应对：

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

<a name="events"></a>
## 事件

Laravel 在发送 HTTP 请求的过程中会触发三个事件。`RequestSending` 事件在请求发送之前触发，而 `ResponseReceived` 事件在收到某个给定请求的响应之后触发。如果某个给定请求没有收到响应，则会触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都拥有一个公共的 `$request` 属性，你可以用它来检查 `Illuminate\Http\Client\Request` 实例。同样地，`ResponseReceived` 事件拥有一个 `$request` 属性和一个 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以在应用中为这些事件创建[事件监听器](/docs/{{version}}/events)：

    use Illuminate\Http\Client\Events\RequestSending;

    class LogRequest
    {
        /**
         * 处理给定的事件。
         */
        public function handle(RequestSending $event): void
        {
            // $event->request ...
        }
    }
