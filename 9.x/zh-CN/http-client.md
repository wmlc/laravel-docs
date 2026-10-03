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
- [宏](#macros)
- [测试](#testing)
    - [伪造响应](#faking-responses)
    - [检查请求](#inspecting-requests)
    - [防止游离请求](#preventing-stray-requests)
- [事件](#events)

<a name="introduction"></a>
## 简介

Laravel 围绕 [Guzzle HTTP 客户端](http://docs.guzzlephp.org/en/stable/) 提供了一套富有表现力且简洁的 API，让你可以快速发起对外 HTTP 请求，与其他 Web 应用通信。Laravel 对 Guzzle 的封装聚焦于其最常见的使用场景，并提供了出色的开发体验。

开始之前，你应该确保已将 Guzzle 包安装为应用的依赖。默认情况下，Laravel 会自动包含此依赖。不过，如果你之前移除了该包，可以通过 Composer 重新安装：

```shell
composer require guzzlehttp/guzzle
```

<a name="making-requests"></a>
## 发起请求

要发起请求，可以使用 `Http` Facade 提供的 `head`、`get`、`post`、`put`、`patch` 和 `delete` 方法。首先，我们来看看如何向另一个 URL 发起一个基本的 `GET` 请求：

    use Illuminate\Support\Facades\Http;

    $response = Http::get('http://example.com');

`get` 方法会返回一个 `Illuminate\Http\Client\Response` 实例，该实例提供了多种方法可用于检查响应：

    $response->body() : string;
    $response->json($key = null, $default = null) : array|mixed;
    $response->object() : object;
    $response->collect($key = null) : Illuminate\Support\Collection;
    $response->status() : int;
    $response->successful() : bool;
    $response->redirect(): bool;
    $response->failed() : bool;
    $response->clientError() : bool;
    $response->header($header) : string;
    $response->headers() : array;

`Illuminate\Http\Client\Response` 对象还实现了 PHP 的 `ArrayAccess` 接口，让你可以直接在响应上访问 JSON 响应数据：

    return Http::get('http://example.com/users/1')['name'];

除了上面列出的响应方法外，还可以使用以下方法判断响应是否具有给定的状态码：

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

HTTP 客户端还允许你使用 [URI 模板规范](https://www.rfc-editor.org/rfc/rfc6570) 来构造请求 URL。要定义可由 URI 模板展开的 URL 参数，可以使用 `withUrlParameters` 方法：

```php
Http::withUrlParameters([
    'endpoint' => 'https://laravel.com',
    'page' => 'docs',
    'version' => '9.x',
    'topic' => 'validation',
])->get('{+endpoint}/{page}/{version}/{topic}');
```

<a name="dumping-requests"></a>
#### 转储请求

如果你想在发送请求之前转储发出的请求实例并终止脚本执行，可以在请求定义的开头添加 `dd` 方法：

    return Http::dd()->get('http://example.com');

<a name="request-data"></a>
### 请求数据

当然，在发起 `POST`、`PUT` 和 `PATCH` 请求时，通常会随请求发送额外的数据，因此这些方法接受一个数据数组作为第二个参数。默认情况下，数据会使用 `application/json` 内容类型发送：

    use Illuminate\Support\Facades\Http;

    $response = Http::post('http://example.com/users', [
        'name' => 'Steve',
        'role' => 'Network Administrator',
    ]);

<a name="get-request-query-parameters"></a>
#### GET 请求查询参数

发起 `GET` 请求时，你可以直接将查询字符串附加到 URL，也可以将一个键值对数组作为 `get` 方法的第二个参数传入：

    $response = Http::get('http://example.com/users', [
        'name' => 'Taylor',
        'page' => 1,
    ]);

<a name="sending-form-url-encoded-requests"></a>
#### 发送表单 URL 编码请求

如果你想使用 `application/x-www-form-urlencoded` 内容类型发送数据，应该在发起请求之前调用 `asForm` 方法：

    $response = Http::asForm()->post('http://example.com/users', [
        'name' => 'Sara',
        'role' => 'Privacy Consultant',
    ]);

<a name="sending-a-raw-request-body"></a>
#### 发送原始请求体

如果你想在发起请求时提供原始请求体，可以使用 `withBody` 方法。内容类型可以通过该方法的第二个参数提供：

    $response = Http::withBody(
        base64_encode($photo), 'image/jpeg'
    )->post('http://example.com/photo');

<a name="multi-part-requests"></a>
#### 多部分请求

如果你想以多部分请求的方式发送文件，应该在发起请求之前调用 `attach` 方法。此方法接受文件名和文件内容。如果需要，你可以提供第三个参数，它会被视为文件名：

    $response = Http::attach(
        'attachment', file_get_contents('photo.jpg'), 'photo.jpg'
    )->post('http://example.com/attachments');

除了传递文件的原始内容外，你还可以传递一个流资源：

    $photo = fopen('photo.jpg', 'r');

    $response = Http::attach(
        'attachment', $photo, 'photo.jpg'
    )->post('http://example.com/attachments');

<a name="headers"></a>
### 请求头

可以使用 `withHeaders` 方法向请求添加请求头。`withHeaders` 方法接受一个键值对数组：

    $response = Http::withHeaders([
        'X-First' => 'foo',
        'X-Second' => 'bar'
    ])->post('http://example.com/users', [
        'name' => 'Taylor',
    ]);

你可以使用 `accept` 方法指定应用期望在响应中收到的内容类型：

    $response = Http::accept('application/json')->get('http://example.com/users');

为方便起见，你可以使用 `acceptJson` 方法快速指定应用期望在响应中收到 `application/json` 内容类型：

    $response = Http::acceptJson()->get('http://example.com/users');

<a name="authentication"></a>
### 身份认证

你可以分别使用 `withBasicAuth` 和 `withDigestAuth` 方法指定基本认证和摘要认证凭据：

    // 基本认证...
    $response = Http::withBasicAuth('taylor@laravel.com', 'secret')->post(/* ... */);

    // 摘要认证...
    $response = Http::withDigestAuth('taylor@laravel.com', 'secret')->post(/* ... */);

<a name="bearer-tokens"></a>
#### Bearer 令牌

如果你想快速将 bearer 令牌添加到请求的 `Authorization` 请求头，可以使用 `withToken` 方法：

    $response = Http::withToken('token')->post(/* ... */);

<a name="timeout"></a>
### 超时

`timeout` 方法可用于指定等待响应的最大秒数：

    $response = Http::timeout(3)->get(/* ... */);

如果超过给定的超时时间，将抛出一个 `Illuminate\Http\Client\ConnectionException` 实例。

你可以使用 `connectTimeout` 方法指定尝试连接服务器时等待的最大秒数：

    $response = Http::connectTimeout(3)->get(/* ... */);

<a name="retries"></a>
### 重试

如果你希望 HTTP 客户端在发生客户端或服务器错误时自动重试请求，可以使用 `retry` 方法。`retry` 方法接受请求尝试的最大次数，以及 Laravel 在两次尝试之间等待的毫秒数：

    $response = Http::retry(3, 100)->post(/* ... */);

如果需要，你可以向 `retry` 方法传递第三个参数。第三个参数应该是一个可调用对象，用于决定是否真正进行重试。例如，你可能希望仅在初次请求遇到 `ConnectionException` 时才重试请求：

    $response = Http::retry(3, 100, function ($exception, $request) {
        return $exception instanceof ConnectionException;
    })->post(/* ... */);

如果某次请求尝试失败，你可能希望在发起新尝试之前对请求进行修改。你可以通过修改传递给 `retry` 方法可调用对象的请求参数来实现。例如，如果首次尝试返回了认证错误，你可能希望使用新的授权令牌重试请求：

    $response = Http::withToken($this->getToken())->retry(2, 0, function ($exception, $request) {
        if (! $exception instanceof RequestException || $exception->response->status() !== 401) {
            return false;
        }

        $request->withToken($this->getNewToken());

        return true;
    })->post(/* ... */);

如果所有请求都失败，将抛出一个 `Illuminate\Http\Client\RequestException` 实例。如果你想禁用此行为，可以提供一个值为 `false` 的 `throw` 参数。禁用后，客户端会在所有重试尝试完成后返回最后收到的响应：

    $response = Http::retry(3, 100, throw: false)->post(/* ... */);

> **Warning**  
> 如果所有请求都因连接问题而失败，即使将 `throw` 参数设置为 `false`，仍会抛出 `Illuminate\Http\Client\ConnectionException`。

<a name="error-handling"></a>
### 错误处理

与 Guzzle 的默认行为不同，Laravel 的 HTTP 客户端封装不会在客户端或服务器错误（服务器返回的 `400` 和 `500` 级别响应）时抛出异常。你可以使用 `successful`、`clientError` 或 `serverError` 方法判断是否返回了这类错误：

    // 判断状态码是否 >= 200 且 < 300...
    $response->successful();

    // 判断状态码是否 >= 400...
    $response->failed();

    // 判断响应是否具有 400 级别状态码...
    $response->clientError();

    // 判断响应是否具有 500 级别状态码...
    $response->serverError();

    // 如果发生客户端或服务器错误，立即执行给定的回调...
    $response->onError(callable $callback);

<a name="throwing-exceptions"></a>
#### 抛出异常

如果你已经有一个响应实例，并且希望在响应状态码表明发生客户端或服务器错误时抛出一个 `Illuminate\Http\Client\RequestException` 实例，可以使用 `throw` 或 `throwIf` 方法：

    $response = Http::post(/* ... */);

    // 如果发生客户端或服务器错误，抛出异常...
    $response->throw();

    // 如果发生错误且给定条件为真，抛出异常...
    $response->throwIf($condition);

    // 如果发生错误且给定闭包解析为真，抛出异常...
    $response->throwIf(fn ($response) => true);

    // 如果发生错误且给定条件为假，抛出异常...
    $response->throwUnless($condition);

    // 如果发生错误且给定闭包解析为假，抛出异常...
    $response->throwUnless(fn ($response) => false);

    // 如果响应具有特定状态码，抛出异常...
    $response->throwIfStatus(403);

    // 除非响应具有特定状态码，否则抛出异常...
    $response->throwUnlessStatus(200);

    return $response['user']['id'];

`Illuminate\Http\Client\RequestException` 实例有一个公开的 `$response` 属性，可用于检查返回的响应。

如果没有发生错误，`throw` 方法会返回响应实例，让你可以在 `throw` 方法之后链式调用其他操作：

    return Http::post(/* ... */)->throw()->json();

如果你希望在抛出异常之前执行一些额外逻辑，可以向 `throw` 方法传递一个闭包。该闭包调用后会自动抛出异常，因此你无需在闭包内重新抛出异常：

    return Http::post(/* ... */)->throw(function ($response, $e) {
        //
    })->json();

<a name="guzzle-middleware"></a>
### Guzzle 中间件

由于 Laravel 的 HTTP 客户端基于 Guzzle，你可以利用 [Guzzle 中间件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html) 来处理发出的请求或检查收到的响应。要处理发出的请求，可以通过 `withMiddleware` 方法结合 Guzzle 的 `mapRequest` 中间件工厂来注册 Guzzle 中间件：

    use GuzzleHttp\Middleware;
    use Illuminate\Support\Facades\Http;
    use Psr\Http\Message\RequestInterface;

    $response = Http::withMiddleware(
        Middleware::mapRequest(function (RequestInterface $request) {
            $request = $request->withHeader('X-Example', 'Value');
            
            return $request;
        })
    )->get('http://example.com');

同样，你可以通过 `withMiddleware` 方法结合 Guzzle 的 `mapResponse` 中间件工厂注册中间件，来检查收到的 HTTP 响应：

    use GuzzleHttp\Middleware;
    use Illuminate\Support\Facades\Http;
    use Psr\Http\Message\ResponseInterface;

    $response = Http::withMiddleware(
        Middleware::mapResponse(function (ResponseInterface $response) {
            $header = $response->getHeader('X-Example');

            // ...
            
            return $response;
        })
    )->get('http://example.com');

<a name="guzzle-options"></a>
### Guzzle 选项

你可以使用 `withOptions` 方法指定额外的 [Guzzle 请求选项](http://docs.guzzlephp.org/en/stable/request-options.html)。`withOptions` 方法接受一个键值对数组：

    $response = Http::withOptions([
        'debug' => true,
    ])->get('http://example.com/users');

<a name="concurrent-requests"></a>
## 并发请求

有时，你可能希望并发地发起多个 HTTP 请求。也就是说，你希望多个请求同时发出，而不是按顺序依次发出。在与慢速 HTTP API 交互时，这可以带来显著的性能提升。

幸好，你可以使用 `pool` 方法来实现。`pool` 方法接受一个闭包，该闭包接收一个 `Illuminate\Http\Client\Pool` 实例，让你可以轻松地将请求添加到请求池中进行派发：

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

如你所见，可以根据每个响应添加到池中的顺序来访问对应的响应实例。如果需要，你可以使用 `as` 方法为请求命名，这样就可以通过名称访问对应的响应：

    use Illuminate\Http\Client\Pool;
    use Illuminate\Support\Facades\Http;

    $responses = Http::pool(fn (Pool $pool) => [
        $pool->as('first')->get('http://localhost/first'),
        $pool->as('second')->get('http://localhost/second'),
        $pool->as('third')->get('http://localhost/third'),
    ]);

    return $responses['first']->ok();

<a name="macros"></a>
## 宏

Laravel HTTP 客户端允许你定义"宏"，作为一种流畅且富有表现力的机制，用于在与整个应用中的服务交互时配置通用的请求路径和请求头。开始之前，你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义宏：

```php
use Illuminate\Support\Facades\Http;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Http::macro('github', function () {
        return Http::withHeaders([
            'X-Example' => 'example',
        ])->baseUrl('https://github.com');
    });
}
```

宏配置完成后，你可以在应用的任何地方调用它，以创建一个带有指定配置的待发请求：

```php
$response = Http::github()->get('/');
```

<a name="testing"></a>
## 测试

许多 Laravel 服务都提供了帮助你轻松、富有表现力地编写测试的功能，Laravel 的 HTTP 客户端也不例外。`Http` Facade 的 `fake` 方法可以让你指示 HTTP 客户端在发起请求时返回存根/虚拟响应。

<a name="faking-responses"></a>
### 伪造响应

例如，要指示 HTTP 客户端为每个请求返回一个空的、`200` 状态码的响应，可以不带参数调用 `fake` 方法：

    use Illuminate\Support\Facades\Http;

    Http::fake();

    $response = Http::post(/* ... */);

<a name="faking-specific-urls"></a>
#### 伪造特定 URL

或者，你可以向 `fake` 方法传递一个数组。数组的键代表你希望伪造的 URL 模式，其对应的值为关联响应。`*` 字符可用作通配符。任何对未伪造 URL 发起的请求都将实际执行。你可以使用 `Http` Facade 的 `response` 方法为这些端点构造存根/伪造响应：

    Http::fake([
        // 为 GitHub 端点伪造 JSON 响应...
        'github.com/*' => Http::response(['foo' => 'bar'], 200, $headers),

        // 为 Google 端点伪造字符串响应...
        'google.com/*' => Http::response('Hello World', 200, $headers),
    ]);

如果你想指定一个回退 URL 模式来存根所有未匹配的 URL，可以使用单个 `*` 字符：

    Http::fake([
        // 为 GitHub 端点伪造 JSON 响应...
        'github.com/*' => Http::response(['foo' => 'bar'], 200, ['Headers']),

        // 为所有其他端点伪造字符串响应...
        '*' => Http::response('Hello World', 200, ['Headers']),
    ]);

<a name="faking-response-sequences"></a>
#### 伪造响应序列

有时你可能需要指定单个 URL 按特定顺序返回一系列伪造响应。你可以使用 `Http::sequence` 方法来构建这些响应：

    Http::fake([
        // 为 GitHub 端点伪造一系列响应...
        'github.com/*' => Http::sequence()
                                ->push('Hello World', 200)
                                ->push(['foo' => 'bar'], 200)
                                ->pushStatus(404),
    ]);

当响应序列中的所有响应都被消费完毕后，任何后续请求都会导致响应序列抛出异常。如果你想指定序列为空时应返回的默认响应，可以使用 `whenEmpty` 方法：

    Http::fake([
        // 为 GitHub 端点伪造一系列响应...
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

如果你需要更复杂的逻辑来决定为某些端点返回什么响应，可以向 `fake` 方法传递一个闭包。该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个响应实例。在闭包内，你可以执行任何必要的逻辑来决定返回什么类型的响应：

    use Illuminate\Http\Client\Request;

    Http::fake(function (Request $request) {
        return Http::response('Hello World', 200);
    });

<a name="preventing-stray-requests"></a>
### 防止游离请求

如果你想确保在整个单独测试或完整测试套件中，通过 HTTP 客户端发送的所有请求都已被伪造，可以调用 `preventStrayRequests` 方法。调用此方法后，任何没有对应伪造响应的请求都会抛出异常，而不是发起实际的 HTTP 请求：

    use Illuminate\Support\Facades\Http;

    Http::preventStrayRequests();

    Http::fake([
        'github.com/*' => Http::response('ok'),
    ]);

    // 返回 "ok" 响应...
    Http::get('https://github.com/laravel/framework');

    // 抛出异常...
    Http::get('https://laravel.com');

<a name="inspecting-requests"></a>
### 检查请求

在伪造响应时，你偶尔可能希望检查客户端收到的请求，以确保应用发送了正确的数据或请求头。你可以在调用 `Http::fake` 之后调用 `Http::assertSent` 方法来实现。

`assertSent` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例，并应返回一个布尔值，指示请求是否符合你的期望。要让测试通过，至少必须有一个发出的请求符合给定的期望：

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

如果需要，你可以使用 `assertNotSent` 方法断言某个特定请求未被发送：

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

你可以使用 `recorded` 方法收集所有请求及其对应的响应。`recorded` 方法返回一个集合，其中包含 `Illuminate\Http\Client\Request` 和 `Illuminate\Http\Client\Response` 实例的数组：

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

此外，`recorded` 方法接受一个闭包，该闭包会接收一个 `Illuminate\Http\Client\Request` 实例和一个 `Illuminate\Http\Client\Response` 实例，可用于根据你的期望过滤请求/响应对：

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

Laravel 在发送 HTTP 请求的过程中会触发三个事件。`RequestSending` 事件在请求发送之前触发，`ResponseReceived` 事件在收到给定请求的响应之后触发。如果给定请求没有收到响应，则会触发 `ConnectionFailed` 事件。

`RequestSending` 和 `ConnectionFailed` 事件都包含一个公开的 `$request` 属性，你可用它来检查 `Illuminate\Http\Client\Request` 实例。同样，`ResponseReceived` 事件包含一个 `$request` 属性和一个 `$response` 属性，可用于检查 `Illuminate\Http\Client\Response` 实例。你可以在 `App\Providers\EventServiceProvider` 服务提供者（Service Provider）中为这些事件注册事件监听器：

    /**
     * 应用的事件监听器映射。
     *
     * @var array
     */
    protected $listen = [
        'Illuminate\Http\Client\Events\RequestSending' => [
            'App\Listeners\LogRequestSending',
        ],
        'Illuminate\Http\Client\Events\ResponseReceived' => [
            'App\Listeners\LogResponseReceived',
        ],
        'Illuminate\Http\Client\Events\ConnectionFailed' => [
            'App\Listeners\LogConnectionFailed',
        ],
    ];
