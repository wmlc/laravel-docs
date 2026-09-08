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
    - [输入存在性](#input-presence)
    - [合并额外输入](#merging-additional-input)
    - [旧输入](#old-input)
    - [Cookie](#cookies)
    - [输入修剪与规范化](#input-trimming-and-normalization)
- [文件](#files)
    - [检索上传的文件](#retrieving-uploaded-files)
    - [存储上传的文件](#storing-uploaded-files)
- [配置受信代理](#configuring-trusted-proxies)
- [配置受信主机](#configuring-trusted-hosts)

<a name="introduction"></a>
## 简介

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式，用于与应用当前处理的 HTTP 请求交互，并检索随请求提交的输入、Cookie 和文件。

<a name="interacting-with-the-request"></a>
## 与请求交互

<a name="accessing-the-request"></a>
### 访问请求

要通过依赖注入获取当前 HTTP 请求的实例，你应在路由闭包或控制器方法上类型提示 `Illuminate\Http\Request` 类。传入的请求实例将由 Laravel [服务容器](/docs/{{version}}/container)自动注入：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Store a new user.
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->input('name');

        // Store the user...

        return redirect('/users');
    }
}
```

如前所述，你也可以在路由闭包上类型提示 `Illuminate\Http\Request` 类。执行闭包时，服务容器将自动将传入的请求注入到闭包中：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

<a name="dependency-injection-route-parameters"></a>
#### 依赖注入与路由参数

如果你的控制器方法还期望从路由参数中获取输入，你应在其他依赖之后列出路由参数。例如，如果你的路由是这样定义的：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以通过如下定义控制器方法，类型提示 `Illuminate\Http\Request` 并访问 `id` 路由参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // Update the user...

        return redirect('/users');
    }
}
```

<a name="request-path-and-method"></a>
### 请求路径、主机与方法

`Illuminate\Http\Request` 实例提供了多种检查传入 HTTP 请求的方法，并继承了 `Symfony\Component\HttpFoundation\Request` 类。下面我们将讨论几个最重要的方法。

<a name="retrieving-the-request-path"></a>
#### 检索请求路径

`path` 方法返回请求的路径信息。因此，如果传入请求指向 `http://example.com/foo/bar`，`path` 方法将返回 `foo/bar`：

```php
$uri = $request->path();
```

<a name="inspecting-the-request-path"></a>
#### 检查请求路径 / 路由

`is` 方法允许你验证传入的请求路径是否与给定模式匹配。使用此方法时，可以使用 `*` 字符作为通配符：

```php
if ($request->is('admin/*')) {
    // ...
}
```

使用 `routeIs` 方法，你可以判断传入的请求是否匹配了[命名路由](/docs/{{version}}/routing#named-routes)：

```php
if ($request->routeIs('admin.*')) {
    // ...
}
```

<a name="retrieving-the-request-url"></a>
#### 检索请求 URL

要检索传入请求的完整 URL，可以使用 `url` 或 `fullUrl` 方法。`url` 方法将返回不带查询字符串的 URL，而 `fullUrl` 方法包含查询字符串：

```php
$url = $request->url();

$urlWithQueryString = $request->fullUrl();
```

如果你想向当前 URL 追加查询字符串数据，可以调用 `fullUrlWithQuery` 方法。此方法将给定的查询字符串变量数组与当前查询字符串合并：

```php
$request->fullUrlWithQuery(['type' => 'phone']);
```

如果你想获取不带给定查询字符串参数的当前 URL，可以使用 `fullUrlWithoutQuery` 方法：

```php
$request->fullUrlWithoutQuery(['type']);
```

<a name="retrieving-the-request-host"></a>
#### 检索请求主机

你可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法检索传入请求的"主机"：

```php
// http://localhost:8000
$request->host(); // localhost
$request->httpHost(); // localhost:8000
$request->schemeAndHttpHost(); // http://localhost:8000
```

<a name="retrieving-the-request-method"></a>
#### 检索请求方法

`method` 方法将返回请求的 HTTP 动词。你可以使用 `isMethod` 方法验证 HTTP 动词是否与给定字符串匹配：

```php
$method = $request->method();

if ($request->isMethod('post')) {
    // ...
}
```

<a name="request-headers"></a>
### 请求头

你可以使用 `header` 方法从 `Illuminate\Http\Request` 实例中检索请求头。如果请求头不存在于请求中，将返回 `null`。不过，`header` 方法接受一个可选的第二个参数，当请求头不存在于请求中时将返回该参数：

```php
$value = $request->header('X-Header-Name');

$value = $request->header('X-Header-Name', 'default');
```

`hasHeader` 方法可用于判断请求是否包含给定的请求头：

```php
if ($request->hasHeader('X-Header-Name')) {
    // ...
}
```

为方便起见，`bearerToken` 方法可用于从 `Authorization` 请求头中检索 bearer 令牌。如果不存在此类请求头，将返回空字符串：

```php
$token = $request->bearerToken();
```

<a name="request-ip-address"></a>
### 请求 IP 地址

`ip` 方法可用于检索向你的应用发起请求的客户端的 IP 地址：

```php
$ipAddress = $request->ip();
```

如果你想检索 IP 地址数组，包括由代理转发的所有客户端 IP 地址，可以使用 `ips` 方法。"原始"客户端 IP 地址将位于数组末尾：

```php
$ipAddresses = $request->ips();
```

一般来说，IP 地址应被视为不可信、由用户控制的输入，仅用于信息目的。

<a name="content-negotiation"></a>
### 内容协商

Laravel 提供了几种通过 `Accept` 请求头检查传入请求所请求内容类型的方法。首先，`getAcceptableContentTypes` 方法将返回一个包含请求接受的所有内容类型的数组：

```php
$contentTypes = $request->getAcceptableContentTypes();
```

`accepts` 方法接受一个内容类型数组，如果请求接受其中任何内容类型，则返回 `true`。否则，将返回 `false`：

```php
if ($request->accepts(['text/html', 'application/json'])) {
    // ...
}
```

你可以使用 `prefers` 方法判断给定内容类型数组中，请求最偏好哪一种。如果请求不接受所提供的任何内容类型，将返回 `null`：

```php
$preferred = $request->prefers(['text/html', 'application/json']);
```

由于许多应用只提供 HTML 或 JSON，你可以使用 `expectsJson` 方法快速判断传入请求是否期望 JSON 响应：

```php
if ($request->expectsJson()) {
    // ...
}
```

如果你需要判断请求是特别偏好 Markdown，还是在其他内容类型中会接受 Markdown，例如在向 AI 代理或其他消费 Markdown 响应的客户端提供服务时，可以使用 `wantsMarkdown` 和 `acceptsMarkdown` 方法：

```php
if ($request->wantsMarkdown()) {
    // The client's most preferred content type is text/markdown...
}

if ($request->acceptsMarkdown()) {
    // The client accepts Markdown responses...
}
```

<a name="psr7-requests"></a>
### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/)为 HTTP 消息（包括请求和响应）指定了接口。如果你想获取 PSR-7 请求实例而不是 Laravel 请求，首先需要安装几个库。Laravel 使用 *Symfony HTTP Message Bridge* 组件将典型的 Laravel 请求和响应转换为 PSR-7 兼容的实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装这些库后，你可以通过在路由闭包或控制器方法上类型提示请求接口来获取 PSR-7 请求：

```php
use Psr\Http\Message\ServerRequestInterface;

Route::get('/', function (ServerRequestInterface $request) {
    // ...
});
```

> [!NOTE]
> 如果你从路由或控制器返回 PSR-7 响应实例，它将自动被转换回 Laravel 响应实例并由框架显示。

<a name="input"></a>
## 输入

<a name="retrieving-input"></a>
### 检索输入

<a name="retrieving-all-input-data"></a>
#### 检索所有输入数据

你可以使用 `all` 方法将传入请求的所有输入数据作为 `array` 检索。无论传入请求来自 HTML 表单还是 XHR 请求，都可以使用此方法：

```php
$input = $request->all();
```

使用 `collect` 方法，你可以将传入请求的所有输入数据作为[集合](/docs/{{version}}/collections)检索：

```php
$input = $request->collect();
```

`collect` 方法还允许你将传入请求输入的子集作为集合检索：

```php
$request->collect('users')->each(function (string $user) {
    // ...
});
```

<a name="retrieving-an-input-value"></a>
#### 检索输入值

使用几个简单的方法，你就可以访问 `Illuminate\Http\Request` 实例的所有用户输入，而无需担心请求使用的 HTTP 动词。无论 HTTP 动词如何，都可以使用 `input` 方法检索用户输入：

```php
$name = $request->input('name');
```

你可以将默认值作为第二个参数传递给 `input` 方法。如果请求中不存在所请求的输入值，将返回此值：

```php
$name = $request->input('name', 'Sally');
```

处理包含数组输入的表单时，使用"点"符号访问数组：

```php
$name = $request->input('products.0.name');

$names = $request->input('products.*.name');
```

你可以不带任何参数地调用 `input` 方法，以将所有输入值作为关联数组检索：

```php
$input = $request->input();
```

<a name="retrieving-input-from-the-query-string"></a>
#### 从查询字符串检索输入

`input` 方法从整个请求负载（包括查询字符串）中检索值，而 `query` 方法将只从查询字符串中检索值：

```php
$name = $request->query('name');
```

如果所请求的查询字符串值数据不存在，将返回此方法的第二个参数：

```php
$name = $request->query('name', 'Helen');
```

你可以不带任何参数地调用 `query` 方法，以将所有查询字符串值作为关联数组检索：

```php
$query = $request->query();
```

<a name="retrieving-json-input-values"></a>
#### 检索 JSON 输入值

向应用发送 JSON 请求时，只要请求的 `Content-Type` 请求头正确设置为 `application/json`，就可以通过 `input` 方法访问 JSON 数据。你甚至可以使用"点"语法检索嵌套在 JSON 数组 / 对象中的值：

```php
$name = $request->input('user.name');
```

<a name="retrieving-stringable-input-values"></a>
#### 检索 Stringable 输入值

与其将请求的输入数据作为原始 `string` 检索，你可以使用 `string` 方法将请求数据作为 [Illuminate\Support\Stringable](/docs/{{version}}/strings) 的实例检索：

```php
$name = $request->string('name')->trim();
```

<a name="retrieving-integer-input-values"></a>
#### 检索整数输入值

要将输入值作为整数检索，可以使用 `integer` 方法。此方法将尝试将输入值转换为整数。如果输入不存在或转换失败，它将返回你指定的默认值。这对于分页或其他数字输入特别有用：

```php
$perPage = $request->integer('per_page');
```

<a name="retrieving-boolean-input-values"></a>
#### 检索布尔输入值

处理复选框等 HTML 元素时，你的应用可能会收到实际上是字符串的"truthy"值。例如，"true"或"on"。为方便起见，你可以使用 `boolean` 方法将这些值作为布尔值检索。`boolean` 方法对 1、"1"、true、"true"、"on" 和 "yes" 返回 `true`。所有其他值将返回 `false`：

```php
$archived = $request->boolean('archived');
```

<a name="retrieving-array-input-values"></a>
#### 检索数组输入值

可以使用 `array` 方法检索包含数组的输入值。此方法总是将输入值转换为数组。如果请求不包含具有给定名称的输入值，将返回空数组：

```php
$versions = $request->array('versions');
```

<a name="retrieving-date-input-values"></a>
#### 检索日期输入值

为方便起见，可以使用 `date` 方法将包含日期 / 时间的输入值作为 Carbon 实例检索。如果请求不包含具有给定名称的输入值，将返回 `null`：

```php
$birthday = $request->date('birthday');
```

`date` 方法接受的第二和第三个参数可分别用于指定日期的格式和时区：

```php
$elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');
```

如果输入值存在但格式无效，将抛出 `InvalidArgumentException`；因此，建议在调用 `date` 方法之前验证输入。

<a name="retrieving-interval-input-values"></a>
#### 检索 Interval 输入值

可以使用 `interval` 方法将包含时长的输入值作为 `CarbonInterval` 实例检索。如果请求不包含具有给定名称的输入值，将返回 `null`：

```php
$duration = $request->interval('duration');
```

如果输入值是数字，你可以提供单位作为第二个参数。该单位可以是 `second`、`minute` 或 `day` 等字符串，也可以是 `Carbon\Unit` 枚举实例：

```php
use Carbon\Unit;

$timeout = $request->interval('timeout', 'second');

$delay = $request->interval('delay', Unit::Minute);
```

如果输入值存在但格式无效，将抛出 `InvalidArgumentException`；因此，建议在调用 `interval` 方法之前验证输入。

<a name="retrieving-enum-input-values"></a>
#### 检索枚举输入值

与 [PHP 枚举](https://www.php.net/manual/en/language.types.enumerations.php)对应的输入值也可以从请求中检索。如果请求不包含具有给定名称的输入值，或枚举没有与输入值匹配的后备值，将返回 `null`。`enum` 方法将输入值的名称和枚举类作为其第一和第二个参数：

```php
use App\Enums\Status;

$status = $request->enum('status', Status::class);
```

你还可以提供默认值，当值缺失或无效时将返回该默认值：

```php
$status = $request->enum('status', Status::class, Status::Pending);
```

如果输入值是与 PHP 枚举对应的值数组，你可以使用 `enums` 方法将值数组作为枚举实例检索：

```php
use App\Enums\Product;

$products = $request->enums('products', Product::class);
```

<a name="retrieving-input-via-dynamic-properties"></a>
#### 通过动态属性检索输入

你也可以使用 `Illuminate\Http\Request` 实例上的动态属性访问用户输入。例如，如果应用的一个表单包含 `name` 字段，你可以这样访问字段的值：

```php
$name = $request->name;
```

使用动态属性时，Laravel 将首先在请求负载中查找参数的值。如果不存在，Laravel 将在匹配路由的参数中搜索该字段。

<a name="retrieving-a-portion-of-the-input-data"></a>
#### 检索部分输入数据

如果你需要检索输入数据的子集，可以使用 `only` 和 `except` 方法。这两种方法都接受单个 `array` 或动态的参数列表：

```php
$input = $request->only(['username', 'password']);

$input = $request->only('username', 'password');

$input = $request->except(['credit_card']);

$input = $request->except('credit_card');
```

> [!WARNING]
> `only` 方法返回你请求的所有键 / 值对；但是，它不会返回请求中不存在的键 / 值对。

<a name="input-presence"></a>
### 输入存在性

你可以使用 `has` 方法判断值是否存在于请求中。如果值存在于请求中，`has` 方法返回 `true`：

```php
if ($request->has('name')) {
    // ...
}
```

给定数组时，`has` 方法将判断所有指定值是否存在：

```php
if ($request->has(['name', 'email'])) {
    // ...
}
```

如果任何指定值存在，`hasAny` 方法返回 `true`：

```php
if ($request->hasAny(['name', 'email'])) {
    // ...
}
```

如果值存在于请求中，`whenHas` 方法将执行给定的闭包：

```php
$request->whenHas('name', function (string $input) {
    // ...
});
```

可以向 `whenHas` 方法传递第二个闭包，当指定值不存在于请求中时执行：

```php
$request->whenHas('name', function (string $input) {
    // The "name" value is present...
}, function () {
    // The "name" value is not present...
});
```

如果你想判断值是否存在于请求中且不是空字符串，可以使用 `filled` 方法：

```php
if ($request->filled('name')) {
    // ...
}
```

如果你想判断值是否缺失于请求中或为空字符串，可以使用 `isNotFilled` 方法：

```php
if ($request->isNotFilled('name')) {
    // ...
}
```

给定数组时，`isNotFilled` 方法将判断所有指定值是否缺失或为空：

```php
if ($request->isNotFilled(['name', 'email'])) {
    // ...
}
```

如果任何指定值不是空字符串，`anyFilled` 方法返回 `true`：

```php
if ($request->anyFilled(['name', 'email'])) {
    // ...
}
```

如果值存在于请求中且不是空字符串，`whenFilled` 方法将执行给定的闭包：

```php
$request->whenFilled('name', function (string $input) {
    // ...
});
```

可以向 `whenFilled` 方法传递第二个闭包，当指定值未"填充"时执行：

```php
$request->whenFilled('name', function (string $input) {
    // The "name" value is filled...
}, function () {
    // The "name" value is not filled...
});
```

要判断给定键是否缺失于请求中，可以使用 `missing` 和 `whenMissing` 方法：

```php
if ($request->missing('name')) {
    // ...
}

$request->whenMissing('name', function () {
    // The "name" value is missing...
}, function () {
    // The "name" value is present...
});
```

<a name="merging-additional-input"></a>
### 合并额外输入

有时你可能需要手动将额外输入合并到请求的现有输入数据中。为此，可以使用 `merge` 方法。如果给定输入键已存在于请求中，它将被 `merge` 方法提供的数据覆盖：

```php
$request->merge(['votes' => 0]);
```

如果相应键尚不存在于请求的输入数据中，可以使用 `mergeIfMissing` 方法将输入合并到请求中：

```php
$request->mergeIfMissing(['votes' => 0]);
```

<a name="old-input"></a>
### 旧输入

Laravel 允许你在下一次请求期间保留上一次请求的输入。此功能对于在检测到验证错误后重新填充表单特别有用。但是，如果你使用 Laravel 内置的[验证功能](/docs/{{version}}/validation)，你可能无需手动使用这些会话输入闪存方法，因为 Laravel 的某些内置验证机制会自动调用它们。

<a name="flashing-input-to-the-session"></a>
#### 将输入闪存到会话

`Illuminate\Http\Request` 类上的 `flash` 方法会将当前输入闪存到[会话](/docs/{{version}}/session)，以便在用户对应用的下一次请求期间可用：

```php
$request->flash();
```

你也可以使用 `flashOnly` 和 `flashExcept` 方法将请求数据的子集闪存到会话。这些方法对于将密码等敏感信息排除在会话之外很有用：

```php
$request->flashOnly(['username', 'email']);

$request->flashExcept('password');
```

<a name="flashing-input-then-redirecting"></a>
#### 闪存输入然后重定向

由于你通常希望将输入闪存到会话然后重定向到上一页，你可以使用 `withInput` 方法轻松地将输入闪存链式附加到重定向上：

```php
return redirect('/form')->withInput();

return redirect()->route('user.create')->withInput();

return redirect('/form')->withInput(
    $request->except('password')
);
```

<a name="retrieving-old-input"></a>
#### 检索旧输入

要检索上一次请求中闪存的输入，请在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法将从[会话](/docs/{{version}}/session)中拉取先前闪存的输入数据：

```php
$username = $request->old('username');
```

Laravel 还提供了一个全局 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数重新填充表单更方便。如果给定字段没有旧输入，将返回 `null`：

```blade
<input type="text" name="username" value="{{ old('username') }}">
```

<a name="cookies"></a>
### Cookie

<a name="retrieving-cookies-from-requests"></a>
#### 从请求中检索 Cookie

由 Laravel 框架创建的所有 Cookie 都经过加密并使用认证代码签名，这意味着如果它们被客户端更改，将被视为无效。要从请求中检索 Cookie 值，请在 `Illuminate\Http\Request` 实例上使用 `cookie` 方法：

```php
$value = $request->cookie('name');
```

<a name="input-trimming-and-normalization"></a>
## 输入修剪与规范化

默认情况下，Laravel 会在应用的全局中间件栈中包含 `Illuminate\Foundation\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 中间件。这些中间件会自动修剪请求的所有传入字符串字段，并将任何空字符串字段转换为 `null`。这使你不必在路由和控制器中担心这些规范化问题。

#### 禁用输入规范化

如果你想为所有请求禁用此行为，可以通过在应用 `bootstrap/app.php` 文件中调用 `$middleware->remove` 方法，从应用中间件栈中移除这两个中间件：

```php
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->remove([
        ConvertEmptyStringsToNull::class,
        TrimStrings::class,
    ]);
})
```

如果你想为应用的部分请求禁用字符串修剪和空字符串转换，可以在应用 `bootstrap/app.php` 文件中使用 `trimStrings` 和 `convertEmptyStringsToNull` 中间件方法。两种方法都接受一个闭包数组，这些闭包应返回 `true` 或 `false`，以指示是否应跳过输入规范化：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->convertEmptyStringsToNull(except: [
        fn (Request $request) => $request->is('admin/*'),
    ]);

    $middleware->trimStrings(except: [
        fn (Request $request) => $request->is('admin/*'),
    ]);
})
```

<a name="files"></a>
## 文件

<a name="retrieving-uploaded-files"></a>
### 检索上传的文件

你可以使用 `file` 方法或使用动态属性从 `Illuminate\Http\Request` 实例中检索上传的文件。`file` 方法返回 `Illuminate\Http\UploadedFile` 类的实例，该类扩展了 PHP 的 `SplFileInfo` 类，并提供多种与文件交互的方法：

```php
$file = $request->file('photo');

$file = $request->photo;
```

你可以使用 `hasFile` 方法判断文件是否存在于请求中：

```php
if ($request->hasFile('photo')) {
    // ...
}
```

如果上传的文件是需要在存储之前处理的图片，你可以使用 `image` 方法检索 `Illuminate\Image\Image` 实例，如果文件不存在则返回 `null`：

```php
$image = $request->image('photo');
```

有关处理图片的更多信息，请查阅完整的[图片处理文档](/docs/{{version}}/images)。

<a name="validating-successful-uploads"></a>
#### 验证成功上传

除了检查文件是否存在之外，你还可以通过 `isValid` 方法验证文件上传过程中没有出现问题：

```php
if ($request->file('photo')->isValid()) {
    // ...
}
```

<a name="file-paths-extensions"></a>
#### 文件路径与扩展名

`UploadedFile` 类还包含用于访问文件的完整限定路径及其扩展名的方法。`extension` 方法将尝试根据文件内容猜测文件的扩展名。此扩展名可能与客户端提供的扩展名不同：

```php
$path = $request->photo->path();

$extension = $request->photo->extension();
```

<a name="other-file-methods"></a>
#### 其他文件方法

`UploadedFile` 实例上还有许多其他方法可用。请查看[该类的 API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php)了解这些方法的更多信息。

<a name="storing-uploaded-files"></a>
### 存储上传的文件

要存储上传的文件，你通常会使用你配置的[文件系统](/docs/{{version}}/filesystem)之一。`UploadedFile` 类有一个 `store` 方法，它将上传的文件移动到你的某个磁盘，该磁盘可以是本地文件系统上的位置，也可以是 Amazon S3 等云存储位置。

`store` 方法接受文件应相对于文件系统配置的根目录存储的路径。此路径不应包含文件名，因为会自动生成唯一 ID 作为文件名。

`store` 方法还接受一个可选的第二个参数，用于指定应存储文件的磁盘名称。该方法将返回文件相对于磁盘根目录的路径：

```php
$path = $request->photo->store('images');

$path = $request->photo->store('images', 's3');
```

如果你不希望自动生成文件名，可以使用 `storeAs` 方法，它接受路径、文件名和磁盘名称作为参数：

```php
$path = $request->photo->storeAs('images', 'filename.jpg');

$path = $request->photo->storeAs('images', 'filename.jpg', 's3');
```

> [!NOTE]
> 有关 Laravel 中文件存储的更多信息，请查看完整的[文件存储文档](/docs/{{version}}/filesystem)。

<a name="configuring-trusted-proxies"></a>
## 配置受信代理

当你的应用运行在终止 TLS / SSL 证书的负载均衡器后面时，你可能会注意到应用在使用 `url` 辅助函数时有时不会生成 HTTPS 链接。通常这是因为你的应用从负载均衡器通过 80 端口接收转发流量，并且不知道应生成安全链接。

要解决此问题，你可以启用 Laravel 应用中包含的 `Illuminate\Http\Middleware\TrustProxies` 中间件，它允许你快速自定义应用应信任的负载均衡器或代理。你应使用应用 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法指定受信代理：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: [
        '192.168.1.1',
        '10.0.0.0/8',
    ]);
})
```

除了配置受信代理之外，你还可以配置应信任的代理请求头：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB
    );
})
```

> [!NOTE]
> 如果你使用 AWS Elastic Load Balancing，`headers` 值应为 `Request::HEADER_X_FORWARDED_AWS_ELB`。如果你的负载均衡器使用 [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239#section-4) 的标准 `Forwarded` 请求头，`headers` 值应为 `Request::HEADER_FORWARDED`。有关 `headers` 值中可使用的常量的更多信息，请查看 Symfony 关于[信任代理](https://symfony.com/doc/current/deployment/proxies.html)的文档。

<a name="trusting-all-proxies"></a>
#### 信任所有代理

如果你使用 Amazon AWS 或其他"云"负载均衡器提供方，你可能不知道实际均衡器的 IP 地址。在这种情况下，你可以使用 `*` 信任所有代理：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

<a name="configuring-trusted-hosts"></a>
## 配置受信主机

默认情况下，Laravel 会响应它收到的所有请求，而不管 HTTP 请求的 `Host` 请求头的内容是什么。此外，在 Web 请求期间，`Host` 请求头的值将用于生成指向你应用的绝对 URL。

通常，你应配置 Web 服务器（如 Nginx 或 Apache），使其只向应用发送与给定主机名匹配的请求。但是，如果你无法直接自定义 Web 服务器，并且需要指示 Laravel 只响应某些主机名，可以通过为应用启用 `Illuminate\Http\Middleware\TrustHosts` 中间件来实现。

要启用 `TrustHosts` 中间件，你应在应用 `bootstrap/app.php` 文件中调用 `trustHosts` 中间件方法。使用此方法的 `at` 参数，你可以指定应用应响应的主机名。主机名字符串被视为正则表达式。具有其他 `Host` 请求头的传入请求将被拒绝：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$']);
})
```

默认情况下，来自应用 URL 子域的请求也会自动被信任。如果你想禁用此行为，可以使用 `subdomains` 参数：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$'], subdomains: false);
})
```

如果你需要访问应用的配置文件或数据库来确定受信主机，可以向 `at` 参数提供一个闭包：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: fn () => config('app.trusted_hosts'));
})
```
