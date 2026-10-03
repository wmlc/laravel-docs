# HTTP 请求

- [简介](#introduction)
- [与请求交互](#interacting-with-the-request)
    - [访问请求](#accessing-the-request)
    - [请求路径、主机与方法](#request-path-and-method)
    - [请求头](#request-headers)
    - [请求 IP 地址](#request-ip-address)
    - [内容协商](#content-negotiation)
    - [PSR-7 请求](#psr7-requests)
- [输入](#input)
    - [检索输入](#retrieving-input)
    - [判断输入是否存在](#determining-if-input-is-present)
    - [合并额外输入](#merging-additional-input)
    - [旧输入](#old-input)
    - [Cookie](#cookies)
    - [输入修剪与规范化](#input-trimming-and-normalization)
- [文件](#files)
    - [检索上传文件](#retrieving-uploaded-files)
    - [存储上传文件](#storing-uploaded-files)
- [配置信任代理](#configuring-trusted-proxies)
- [配置信任主机](#configuring-trusted-hosts)

<a name="introduction"></a>
## 简介

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式来与当前应用处理的 HTTP 请求交互，并检索随请求提交的输入、cookie 和文件。

<a name="interacting-with-the-request"></a>
## 与请求交互

<a name="accessing-the-request"></a>
### 访问请求

要通过依赖注入获取当前 HTTP 请求的实例，你应该在路由闭包或控制器方法上对 `Illuminate\Http\Request` 类进行类型提示。传入的请求实例将由 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动注入：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;

    class UserController extends Controller
    {
        /**
         * 存储一个新用户。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function store(Request $request)
        {
            $name = $request->input('name');

            //
        }
    }

如前所述，你也可以在路由闭包上对 `Illuminate\Http\Request` 类进行类型提示。服务容器会在闭包执行时自动将传入请求注入闭包：

    use Illuminate\Http\Request;

    Route::get('/', function (Request $request) {
        //
    });

<a name="dependency-injection-route-parameters"></a>
#### 依赖注入与路由参数

如果你的控制器方法还需要从路由参数获取输入，应将路由参数列在其他依赖项之后。例如，如果你的路由定义如下：

    use App\Http\Controllers\UserController;

    Route::put('/user/{id}', [UserController::class, 'update']);

你仍然可以对 `Illuminate\Http\Request` 进行类型提示并通过如下定义控制器方法来访问 `id` 路由参数：

    <?php

    namespace App\Http\Controllers;

    use Illuminate\Http\Request;

    class UserController extends Controller
    {
        /**
         * 更新指定用户。
         *
         * @param  \Illuminate\Http\Request  $request
         * @param  string  $id
         * @return \Illuminate\Http\Response
         */
        public function update(Request $request, $id)
        {
            //
        }
    }

<a name="request-path-and-method"></a>
### 请求路径、主机与方法

`Illuminate\Http\Request` 实例提供了多种方法来检查传入的 HTTP 请求，并继承了 `Symfony\Component\HttpFoundation\Request` 类。我们将在下面讨论几个最重要的方法。

<a name="retrieving-the-request-path"></a>
#### 检索请求路径

`path` 方法返回请求的路径信息。因此，如果传入请求的目标是 `http://example.com/foo/bar`，`path` 方法将返回 `foo/bar`：

    $uri = $request->path();

<a name="inspecting-the-request-path"></a>
#### 检查请求路径 / 路由

`is` 方法允许你验证传入请求路径是否匹配给定模式。使用此方法时，你可以使用 `*` 字符作为通配符：

    if ($request->is('admin/*')) {
        //
    }

使用 `routeIs` 方法，你可以判断传入请求是否匹配了一个[命名路由](/docs/{{version}}/routing#named-routes)：

    if ($request->routeIs('admin.*')) {
        //
    }

<a name="retrieving-the-request-url"></a>
#### 检索请求 URL

要检索传入请求的完整 URL，可以使用 `url` 或 `fullUrl` 方法。`url` 方法将返回不带查询字符串的 URL，而 `fullUrl` 方法包含查询字符串：

    $url = $request->url();

    $urlWithQueryString = $request->fullUrl();

如果你想将查询字符串数据追加到当前 URL，可以调用 `fullUrlWithQuery` 方法。此方法将给定的查询字符串变量数组与当前查询字符串合并：

    $request->fullUrlWithQuery(['type' => 'phone']);

<a name="retrieving-the-request-host"></a>
#### 检索请求主机

你可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法检索传入请求的「主机」：

    $request->host();
    $request->httpHost();
    $request->schemeAndHttpHost();

<a name="retrieving-the-request-method"></a>
#### 检索请求方法

`method` 方法将返回请求的 HTTP 动词。你可以使用 `isMethod` 方法验证 HTTP 动词是否匹配给定字符串：

    $method = $request->method();

    if ($request->isMethod('post')) {
        //
    }

<a name="request-headers"></a>
### 请求头

你可以使用 `header` 方法从 `Illuminate\Http\Request` 实例检索请求头。如果请求中不存在该头，将返回 `null`。不过，`header` 方法接受一个可选的第二个参数，如果请求中不存在该头，将返回此参数：

    $value = $request->header('X-Header-Name');

    $value = $request->header('X-Header-Name', 'default');

`hasHeader` 方法可用于判断请求是否包含给定头：

    if ($request->hasHeader('X-Header-Name')) {
        //
    }

为方便起见，`bearerToken` 方法可用于从 `Authorization` 头检索 bearer 令牌。如果不存在此类头，将返回空字符串：

    $token = $request->bearerToken();

<a name="request-ip-address"></a>
### 请求 IP 地址

`ip` 方法可用于检索向应用发起请求的客户端的 IP 地址：

    $ipAddress = $request->ip();

<a name="content-negotiation"></a>
### 内容协商

Laravel 提供了多种方法通过 `Accept` 头检查传入请求所请求的内容类型。首先，`getAcceptableContentTypes` 方法将返回一个包含请求接受的所有内容类型的数组：

    $contentTypes = $request->getAcceptableContentTypes();

`accepts` 方法接受一个内容类型数组，如果请求接受其中任何一种内容类型，则返回 `true`。否则，将返回 `false`：

    if ($request->accepts(['text/html', 'application/json'])) {
        // ...
    }

你可以使用 `prefers` 方法判断给定内容类型数组中请求最偏好哪种内容类型。如果请求不接受任何提供的内容类型，将返回 `null`：

    $preferred = $request->prefers(['text/html', 'application/json']);

由于许多应用仅提供 HTML 或 JSON，你可以使用 `expectsJson` 方法快速判断传入请求是否期望 JSON 响应：

    if ($request->expectsJson()) {
        // ...
    }

<a name="psr7-requests"></a>
### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/)指定了 HTTP 消息的接口，包括请求和响应。如果你想获取 PSR-7 请求实例而不是 Laravel 请求，首先需要安装几个库。Laravel 使用 *Symfony HTTP Message Bridge* 组件将典型的 Laravel 请求和响应转换为 PSR-7 兼容的实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装这些库后，你可以通过在路由闭包或控制器方法上对请求接口进行类型提示来获取 PSR-7 请求：

    use Psr\Http\Message\ServerRequestInterface;

    Route::get('/', function (ServerRequestInterface $request) {
        //
    });

> **Note**  
> 如果你从路由或控制器返回 PSR-7 响应实例，它将自动转换回 Laravel 响应实例并由框架显示。

<a name="input"></a>
## 输入

<a name="retrieving-input"></a>
### 检索输入

<a name="retrieving-all-input-data"></a>
#### 检索所有输入数据

你可以使用 `all` 方法将传入请求的所有输入数据作为 `array` 检索。无论传入请求是来自 HTML 表单还是 XHR 请求，都可以使用此方法：

    $input = $request->all();

使用 `collect` 方法，你可以将传入请求的所有输入数据作为[集合](/docs/{{version}}/collections)检索：

    $input = $request->collect();

`collect` 方法还允许你将传入请求输入的子集作为集合检索：

    $request->collect('users')->each(function ($user) {
        // ...
    });

<a name="retrieving-an-input-value"></a>
#### 检索输入值

使用几个简单的方法，你可以从 `Illuminate\Http\Request` 实例访问所有用户输入，而无需担心请求使用了哪种 HTTP 动词。无论使用哪种 HTTP 动词，都可以使用 `input` 方法检索用户输入：

    $name = $request->input('name');

你可以将默认值作为第二个参数传递给 `input` 方法。如果请求中不存在所请求的输入值，将返回此值：

    $name = $request->input('name', 'Sally');

处理包含数组输入的表单时，使用「点」符号访问数组：

    $name = $request->input('products.0.name');

    $names = $request->input('products.*.name');

你可以不带任何参数调用 `input` 方法，以关联数组形式检索所有输入值：

    $input = $request->input();

<a name="retrieving-input-from-the-query-string"></a>
#### 从查询字符串检索输入

`input` 方法从整个请求载荷（包括查询字符串）检索值，而 `query` 方法仅从查询字符串检索值：

    $name = $request->query('name');

如果请求的查询字符串值数据不存在，将返回此方法的第二个参数：

    $name = $request->query('name', 'Helen');

你可以不带任何参数调用 `query` 方法，以关联数组形式检索所有查询字符串值：

    $query = $request->query();

<a name="retrieving-json-input-values"></a>
#### 检索 JSON 输入值

向应用发送 JSON 请求时，只要请求的 `Content-Type` 头正确设置为 `application/json`，就可以通过 `input` 方法访问 JSON 数据。你甚至可以使用「点」语法检索嵌套在 JSON 数组 / 对象中的值：

    $name = $request->input('user.name');

<a name="retrieving-stringable-input-values"></a>
#### 检索 Stringable 输入值

你可以使用 `string` 方法将请求数据作为 [`Illuminate\Support\Stringable`](/docs/{{version}}/helpers#fluent-strings) 实例检索，而不是作为原始 `string` 检索请求的输入数据：

    $name = $request->string('name')->trim();

<a name="retrieving-boolean-input-values"></a>
#### 检索布尔输入值

处理复选框等 HTML 元素时，你的应用可能会收到实际上是字符串的「真值」。例如，「true」或「on」。为方便起见，你可以使用 `boolean` 方法将这些值作为布尔值检索。`boolean` 方法对 1、「1」、true、「true」、「on」和「yes」返回 `true`。所有其他值将返回 `false`：

    $archived = $request->boolean('archived');

<a name="retrieving-date-input-values"></a>
#### 检索日期输入值

为方便起见，包含日期 / 时间的输入值可以使用 `date` 方法作为 Carbon 实例检索。如果请求不包含给定名称的输入值，将返回 `null`：

    $birthday = $request->date('birthday');

`date` 方法接受的第二和第三个参数可分别用于指定日期的格式和时区：

    $elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');

如果输入值存在但格式无效，将抛出 `InvalidArgumentException`；因此，建议在调用 `date` 方法之前验证输入。

<a name="retrieving-enum-input-values"></a>
#### 检索 Enum 输入值

对应 [PHP enum](https://www.php.net/manual/en/language.types.enumerations.php) 的输入值也可以从请求中检索。如果请求不包含给定名称的输入值或 enum 没有与输入值匹配的底层值，将返回 `null`。`enum` 方法接受输入值的名称和 enum 类作为第一和第二个参数：

    use App\Enums\Status;

    $status = $request->enum('status', Status::class);

<a name="retrieving-input-via-dynamic-properties"></a>
#### 通过动态属性检索输入

你也可以使用 `Illuminate\Http\Request` 实例上的动态属性访问用户输入。例如，如果应用的一个表单包含 `name` 字段，可以这样访问该字段的值：

    $name = $request->name;

使用动态属性时，Laravel 会首先在请求载荷中查找参数的值。如果不存在，Laravel 将在匹配路由的参数中搜索该字段。

<a name="retrieving-a-portion-of-the-input-data"></a>
#### 检索部分输入数据

如果需要检索输入数据的子集，可以使用 `only` 和 `except` 方法。这两个方法都接受单个 `array` 或动态参数列表：

    $input = $request->only(['username', 'password']);

    $input = $request->only('username', 'password');

    $input = $request->except(['credit_card']);

    $input = $request->except('credit_card');

> **Warning**  
> `only` 方法返回你请求的所有键 / 值对；但是，它不会返回请求中不存在的键 / 值对。

<a name="determining-if-input-is-present"></a>
### 判断输入是否存在

你可以使用 `has` 方法判断请求中是否存在某个值。`has` 方法在值存在时返回 `true`：

    if ($request->has('name')) {
        //
    }

给定数组时，`has` 方法将判断是否所有指定值都存在：

    if ($request->has(['name', 'email'])) {
        //
    }

`whenHas` 方法将在请求中存在某个值时执行给定闭包：

    $request->whenHas('name', function ($input) {
        //
    });

可以向 `whenHas` 方法传递第二个闭包，如果请求中不存在指定值，将执行此闭包：

    $request->whenHas('name', function ($input) {
        // "name" 值存在...
    }, function () {
        // "name" 值不存在...
    });

`hasAny` 方法在任一指定值存在时返回 `true`：

    if ($request->hasAny(['name', 'email'])) {
        //
    }

如果你想判断请求中是否存在某个值且不是空字符串，可以使用 `filled` 方法：

    if ($request->filled('name')) {
        //
    }

`whenFilled` 方法将在请求中存在某个值且不是空字符串时执行给定闭包：

    $request->whenFilled('name', function ($input) {
        //
    });

可以向 `whenFilled` 方法传递第二个闭包，如果指定值未「填充」，将执行此闭包：

    $request->whenFilled('name', function ($input) {
        // "name" 值已填充...
    }, function () {
        // "name" 值未填充...
    });

要判断请求中是否缺少给定键，可以使用 `missing` 和 `whenMissing` 方法：

    if ($request->missing('name')) {
        //
    }

    $request->whenMissing('name', function ($input) {
        // "name" 值缺失...
    }, function () {
        // "name" 值存在...
    });

<a name="merging-additional-input"></a>
### 合并额外输入

有时你可能需要手动将额外输入合并到请求的现有输入数据中。为此，可以使用 `merge` 方法。如果请求中已存在给定输入键，它将被传递给 `merge` 方法的数据覆盖：

    $request->merge(['votes' => 0]);

`mergeIfMissing` 方法可用于在请求的输入数据中相应键尚不存在时将输入合并到请求中：

    $request->mergeIfMissing(['votes' => 0]);

<a name="old-input"></a>
### 旧输入

Laravel 允许你在一个请求期间保留输入到下一个请求。此功能在检测到验证错误后重新填充表单时特别有用。但是，如果你使用 Laravel 内置的[验证功能](/docs/{{version}}/validation)，可能不需要直接手动使用这些 session 输入闪存方法，因为 Laravel 的一些内置验证设施会自动调用它们。

<a name="flashing-input-to-the-session"></a>
#### 将输入闪存到 Session

`Illuminate\Http\Request` 类上的 `flash` 方法会将当前输入闪存到 [session](/docs/{{version}}/session)，以便在用户下一次请求应用时可用：

    $request->flash();

你也可以使用 `flashOnly` 和 `flashExcept` 方法将请求数据的子集闪存到 session。这些方法适用于将密码等敏感信息排除在 session 之外：

    $request->flashOnly(['username', 'email']);

    $request->flashExcept('password');

<a name="flashing-input-then-redirecting"></a>
#### 闪存输入后重定向

由于你通常希望将输入闪存到 session 然后重定向到上一页，你可以使用 `withInput` 方法轻松地将输入闪存链接到重定向：

    return redirect('form')->withInput();

    return redirect()->route('user.create')->withInput();

    return redirect('form')->withInput(
        $request->except('password')
    );

<a name="retrieving-old-input"></a>
#### 检索旧输入

要检索上一个请求闪存的输入，在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法将从 [session](/docs/{{version}}/session) 中提取之前闪存的输入数据：

    $username = $request->old('username');

Laravel 还提供了一个全局 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数来重新填充表单更为方便。如果给定字段没有旧输入，将返回 `null`：

    <input type="text" name="username" value="{{ old('username') }}">

<a name="cookies"></a>
### Cookie

<a name="retrieving-cookies-from-requests"></a>
#### 从请求检索 Cookie

Laravel 框架创建的所有 cookie 都经过加密并使用认证代码签名，这意味着如果客户端修改了它们，将被视为无效。要从请求中检索 cookie 值，在 `Illuminate\Http\Request` 实例上使用 `cookie` 方法：

    $value = $request->cookie('name');

<a name="input-trimming-and-normalization"></a>
## 输入修剪与规范化

默认情况下，Laravel 在应用的全局中间件堆栈中包含 `App\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 中间件。这些中间件由 `App\Http\Kernel` 类列在全局中间件堆栈中。这些中间件会自动修剪请求上所有传入的字符串字段，并将任何空字符串字段转换为 `null`。这让你无需在路由和控制器中担心这些规范化问题。

#### 禁用输入规范化

如果你想为所有请求禁用此行为，可以通过从 `App\Http\Kernel` 类的 `$middleware` 属性中移除这两个中间件，将它们从应用的中间件堆栈中移除。

如果你想为应用的部分请求禁用字符串修剪和空字符串转换，可以使用两个中间件都提供的 `skipWhen` 方法。此方法接受一个闭包，该闭包应返回 `true` 或 `false` 以指示是否应跳过输入规范化。通常，`skipWhen` 方法应在应用的 `AppServiceProvider` 的 `boot` 方法中调用。

```php
use App\Http\Middleware\TrimStrings;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    TrimStrings::skipWhen(function ($request) {
        return $request->is('admin/*');
    });

    ConvertEmptyStringsToNull::skipWhen(function ($request) {
        // ...
    });
}
```

<a name="files"></a>
## 文件

<a name="retrieving-uploaded-files"></a>
### 检索上传文件

你可以使用 `file` 方法或动态属性从 `Illuminate\Http\Request` 实例检索上传文件。`file` 方法返回 `Illuminate\Http\UploadedFile` 类的实例，该类继承自 PHP `SplFileInfo` 类，并提供了多种与文件交互的方法：

    $file = $request->file('photo');

    $file = $request->photo;

你可以使用 `hasFile` 方法判断请求中是否存在文件：

    if ($request->hasFile('photo')) {
        //
    }

<a name="validating-successful-uploads"></a>
#### 验证成功上传

除了检查文件是否存在外，你还可以通过 `isValid` 方法验证上传文件没有问题：

    if ($request->file('photo')->isValid()) {
        //
    }

<a name="file-paths-extensions"></a>
#### 文件路径与扩展名

`UploadedFile` 类还包含访问文件完全限定路径及其扩展名的方法。`extension` 方法会尝试根据文件内容猜测文件扩展名。此扩展名可能与客户端提供的扩展名不同：

    $path = $request->photo->path();

    $extension = $request->photo->extension();

<a name="other-file-methods"></a>
#### 其他文件方法

`UploadedFile` 实例上还有多种其他方法可用。查看[该类的 API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php)以了解有关这些方法的更多信息。

<a name="storing-uploaded-files"></a>
### 存储上传文件

要存储上传文件，通常会使用你配置的[文件系统](/docs/{{version}}/filesystem)之一。`UploadedFile` 类有一个 `store` 方法，会将上传文件移动到你的一个磁盘上，磁盘可以是本地文件系统上的位置或 Amazon S3 等云存储位置。

`store` 方法接受文件应存储的路径（相对于文件系统配置的根目录）。此路径不应包含文件名，因为会自动生成一个唯一 ID 作为文件名。

`store` 方法还接受一个可选的第二个参数，用于指定存储文件应使用的磁盘名称。该方法将返回文件相对于磁盘根目录的路径：

    $path = $request->photo->store('images');

    $path = $request->photo->store('images', 's3');

如果你不希望自动生成文件名，可以使用 `storeAs` 方法，该方法接受路径、文件名和磁盘名称作为参数：

    $path = $request->photo->storeAs('images', 'filename.jpg');

    $path = $request->photo->storeAs('images', 'filename.jpg', 's3');

> **Note**  
> 有关 Laravel 中文件存储的更多信息，请查阅完整的[文件存储文档](/docs/{{version}}/filesystem)。

<a name="configuring-trusted-proxies"></a>
## 配置信任代理

在终止 TLS / SSL 证书的负载均衡器后运行应用时，你可能会注意到使用 `url` 辅助函数时应用有时不会生成 HTTPS 链接。这通常是因为你的应用从负载均衡器的 80 端口接收转发流量，而不知道应该生成安全链接。

要解决此问题，你可以使用 Laravel 应用中包含的 `App\Http\Middleware\TrustProxies` 中间件，它允许你快速自定义应用应信任的负载均衡器或代理。你信任的代理应在此中间件的 `$proxies` 属性上以数组形式列出。除了配置信任代理外，你还可以配置应信任的代理 `$headers`：

    <?php

    namespace App\Http\Middleware;

    use Illuminate\Http\Middleware\TrustProxies as Middleware;
    use Illuminate\Http\Request;

    class TrustProxies extends Middleware
    {
        /**
         * 此应用信任的代理。
         *
         * @var string|array
         */
        protected $proxies = [
            '192.168.1.1',
            '192.168.1.2',
        ];

        /**
         * 用于检测代理的头。
         *
         * @var int
         */
        protected $headers = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO;
    }

> **Note**  
> 如果你使用 AWS Elastic Load Balancing，你的 `$headers` 值应为 `Request::HEADER_X_FORWARDED_AWS_ELB`。有关可在 `$headers` 属性中使用的常量的更多信息，请查阅 Symfony 关于[信任代理](https://symfony.com/doc/current/deployment/proxies.html)的文档。

<a name="trusting-all-proxies"></a>
#### 信任所有代理

如果你使用 Amazon AWS 或其他「云」负载均衡器提供商，你可能不知道实际均衡器的 IP 地址。在这种情况下，你可以使用 `*` 信任所有代理：

    /**
     * 此应用信任的代理。
     *
     * @var string|array
     */
    protected $proxies = '*';

<a name="configuring-trusted-hosts"></a>
## 配置信任主机

默认情况下，无论 HTTP 请求的 `Host` 头内容如何，Laravel 都会响应其接收的所有请求。此外，在 Web 请求期间生成应用的绝对 URL 时，会使用 `Host` 头的值。

通常，你应该配置 Web 服务器（如 Nginx 或 Apache）仅将匹配给定主机名的请求发送到你的应用。但是，如果你无法直接自定义 Web 服务器且需要指示 Laravel 仅响应特定主机名，可以通过为应用启用 `App\Http\Middleware\TrustHosts` 中间件来实现。

`TrustHosts` 中间件已包含在应用的 `$middleware` 堆栈中；但是，你应该取消注释使其变为活动状态。在此中间件的 `hosts` 方法中，你可以指定应用应响应的主机名。具有其他 `Host` 值头的传入请求将被拒绝：

    /**
     * 获取应信任的主机模式。
     *
     * @return array
     */
    public function hosts()
    {
        return [
            'laravel.test',
            $this->allSubdomainsOfApplicationUrl(),
        ];
    }

`allSubdomainsOfApplicationUrl` 辅助方法将返回一个匹配应用 `app.url` 配置值所有子域的正则表达式。此辅助方法提供了一种便捷的方式，在构建使用通配符子域的应用时允许应用的所有子域。
