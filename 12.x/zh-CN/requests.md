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
    - [合并附加输入](#merging-additional-input)
    - [旧输入](#old-input)
    - [Cookies](#cookies)
    - [输入修剪与规范化](#input-trimming-and-normalization)
- [文件](#files)
    - [检索上传的文件](#retrieving-uploaded-files)
    - [存储上传的文件](#storing-uploaded-files)
- [配置信任代理](#configuring-trusted-proxies)
- [配置信任主机](#configuring-trusted-hosts)

<a name="introduction"></a>
## 简介

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式来与当前应用正在处理的 HTTP 请求交互，同时可以检索随请求提交的输入、Cookie 和文件。

<a name="interacting-with-the-request"></a>
## 与请求交互

<a name="accessing-the-request"></a>
### 访问请求

要通过依赖注入获取当前 HTTP 请求的实例，你应当在路由闭包或控制器方法中对 `Illuminate\Http\Request` 类进行类型提示。Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)会自动注入传入的请求实例：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->input('name');

        // 存储用户...

        return redirect('/users');
    }
}
```

如前所述，你也可以在路由闭包中对 `Illuminate\Http\Request` 类进行类型提示。服务容器会在闭包执行时自动将传入的请求注入其中：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

<a name="dependency-injection-route-parameters"></a>
#### 依赖注入与路由参数

如果控制器方法还需要接收来自路由参数的输入，你应当把路由参数列在其他依赖之后。例如，假设路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你依然可以对 `Illuminate\Http\Request` 进行类型提示，并按如下方式定义控制器方法来访问 `id` 路由参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新指定用户。
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 更新用户...

        return redirect('/users');
    }
}
```

<a name="request-path-and-method"></a>
### 请求路径、主机与方法

`Illuminate\Http\Request` 实例提供了多种方法来检查传入的 HTTP 请求，并且继承了 `Symfony\Component\HttpFoundation\Request` 类。下面我们讨论其中几个最重要的方法。

<a name="retrieving-the-request-path"></a>
#### 检索请求路径

`path` 方法返回请求的路径信息。因此，如果传入请求的目标是 `http://example.com/foo/bar`，`path` 方法将返回 `foo/bar`：

```php
$uri = $request->path();
```

<a name="inspecting-the-request-path"></a>
#### 检查请求路径 / 路由

`is` 方法用于验证传入请求的路径是否与给定模式匹配。使用该方法时，可以用 `*` 字符作为通配符：

```php
if ($request->is('admin/*')) {
    // ...
}
```

使用 `routeIs` 方法可以判断传入请求是否匹配某个[命名路由](/docs/{{version}}/routing#named-routes)：

```php
if ($request->routeIs('admin.*')) {
    // ...
}
```

<a name="retrieving-the-request-url"></a>
#### 检索请求 URL

要检索传入请求的完整 URL，可以使用 `url` 或 `fullUrl` 方法。`url` 方法返回不带查询字符串的 URL，而 `fullUrl` 方法则包含查询字符串：

```php
$url = $request->url();

$urlWithQueryString = $request->fullUrl();
```

如果想向当前 URL 追加查询字符串数据，可以调用 `fullUrlWithQuery` 方法。该方法会将给定的查询字符串变量数组与当前查询字符串合并：

```php
$request->fullUrlWithQuery(['type' => 'phone']);
```

如果想获取去掉某个查询字符串参数后的当前 URL，可以使用 `fullUrlWithoutQuery` 方法：

```php
$request->fullUrlWithoutQuery(['type']);
```

<a name="retrieving-the-request-host"></a>
#### 检索请求主机

你可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法检索传入请求的「主机」：

```php
$request->host();
$request->httpHost();
$request->schemeAndHttpHost();
```

<a name="retrieving-the-request-method"></a>
#### 检索请求方法

`method` 方法将返回请求使用的 HTTP 动词。你可以使用 `isMethod` 方法来验证 HTTP 动词是否与给定字符串匹配：

```php
$method = $request->method();

if ($request->isMethod('post')) {
    // ...
}
```

<a name="request-headers"></a>
### 请求头

你可以使用 `header` 方法从 `Illuminate\Http\Request` 实例中检索请求头。如果请求中没有该头部，将返回 `null`。不过，`header` 方法接受可选的第二个参数，当请求中不存在该头部时将返回这个默认值：

```php
$value = $request->header('X-Header-Name');

$value = $request->header('X-Header-Name', 'default');
```

`hasHeader` 方法可用于判断请求是否包含给定的头部：

```php
if ($request->hasHeader('X-Header-Name')) {
    // ...
}
```

为方便起见，`bearerToken` 方法可用于从 `Authorization` 头部检索 Bearer 令牌。如果不存在该头部，则返回空字符串：

```php
$token = $request->bearerToken();
```

<a name="request-ip-address"></a>
### 请求 IP 地址

`ip` 方法可用于获取向你的应用发起请求的客户端 IP 地址：

```php
$ipAddress = $request->ip();
```

如果想获取包含所有由代理转发的客户端 IP 地址在内的 IP 地址数组，可以使用 `ips` 方法。「原始」客户端 IP 地址位于数组的末尾：

```php
$ipAddresses = $request->ips();
```

一般来说，应将 IP 地址视为不可信的、由用户控制的输入，仅用于参考目的。

<a name="content-negotiation"></a>
### 内容协商

Laravel 提供了多种方法，通过 `Accept` 头部来检查传入请求所请求的内容类型。首先，`getAcceptableContentTypes` 方法返回一个数组，其中包含请求可接受的所有内容类型：

```php
$contentTypes = $request->getAcceptableContentTypes();
```

`accepts` 方法接受一个内容类型数组，只要请求接受其中任何一个内容类型，就返回 `true`；否则返回 `false`：

```php
if ($request->accepts(['text/html', 'application/json'])) {
    // ...
}
```

你可以使用 `prefers` 方法来确定在给定的一组内容类型中，请求最偏好哪一个。如果请求不接受提供的任何内容类型，则返回 `null`：

```php
$preferred = $request->prefers(['text/html', 'application/json']);
```

由于许多应用只提供 HTML 或 JSON，你可以使用 `expectsJson` 方法快速判断传入请求是否期望获得 JSON 响应：

```php
if ($request->expectsJson()) {
    // ...
}
```

<a name="psr7-requests"></a>
### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/)规定了 HTTP 消息（包括请求和响应）的接口。如果你想获取 PSR-7 请求的实例而非 Laravel 请求，首先需要安装一些库。Laravel 使用 *Symfony HTTP Message Bridge* 组件将典型的 Laravel 请求和响应转换为与 PSR-7 兼容的实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装这些库之后，你可以在路由闭包或控制器方法中对请求接口进行类型提示，从而获取 PSR-7 请求：

```php
use Psr\Http\Message\ServerRequestInterface;

Route::get('/', function (ServerRequestInterface $request) {
    // ...
});
```

> [!NOTE]
> 如果从路由或控制器返回 PSR-7 响应实例，框架会自动将其转换回 Laravel 响应实例并显示。

<a name="input"></a>
## 输入

<a name="retrieving-input"></a>
### 检索输入

<a name="retrieving-all-input-data"></a>
#### 检索所有输入数据

你可以使用 `all` 方法以 `array` 形式检索传入请求的所有输入数据。无论传入请求来自 HTML 表单还是 XHR 请求，都可以使用该方法：

```php
$input = $request->all();
```

使用 `collect` 方法，你可以将传入请求的所有输入数据作为[集合](/docs/{{version}}/collections)来检索：

```php
$input = $request->collect();
```

`collect` 方法还允许你将传入请求输入的一部分作为集合来检索：

```php
$request->collect('users')->each(function (string $user) {
    // ...
});
```

<a name="retrieving-an-input-value"></a>
#### 检索输入值

只需使用几个简单的方法，你就能从 `Illuminate\Http\Request` 实例访问所有用户输入，而无需关心请求使用了哪个 HTTP 动词。无论使用何种 HTTP 动词，都可以使用 `input` 方法来检索用户输入：

```php
$name = $request->input('name');
```

你可以给 `input` 方法传递第二个参数作为默认值。如果请求中不存在指定的输入值，将返回该默认值：

```php
$name = $request->input('name', 'Sally');
```

处理包含数组输入的表单时，可以使用「点」记法来访问数组：

```php
$name = $request->input('products.0.name');

$names = $request->input('products.*.name');
```

你也可以不带任何参数调用 `input` 方法，以关联数组的形式检索所有输入值：

```php
$input = $request->input();
```

<a name="retrieving-input-from-the-query-string"></a>
#### 从查询字符串检索输入

`input` 方法从整个请求载荷（包括查询字符串）中检索值，而 `query` 方法只从查询字符串中检索值：

```php
$name = $request->query('name');
```

如果请求中不存在指定的查询字符串数据，将返回该方法的第二个参数：

```php
$name = $request->query('name', 'Helen');
```

你也可以不带任何参数调用 `query` 方法，以关联数组的形式检索所有查询字符串的值：

```php
$query = $request->query();
```

<a name="retrieving-json-input-values"></a>
#### 检索 JSON 输入值

向应用发送 JSON 请求时，只要请求的 `Content-Type` 头部被正确设置为 `application/json`，你就可以通过 `input` 方法访问 JSON 数据。你甚至可以使用「点」语法来检索嵌套在 JSON 数组 / 对象中的值：

```php
$name = $request->input('user.name');
```

<a name="retrieving-stringable-input-values"></a>
#### 检索 Stringable 输入值

如果不想以原生 `string` 的形式检索请求的输入数据，你可以使用 `string` 方法将请求数据作为 [Illuminate\Support\Stringable](/docs/{{version}}/strings) 实例来检索：

```php
$name = $request->string('name')->trim();
```

<a name="retrieving-integer-input-values"></a>
#### 检索整型输入值

要将输入值检索为整数，可以使用 `integer` 方法。该方法会尝试将输入值转换为整数。如果输入不存在或转换失败，则返回你指定的默认值。这在分页或其他数值输入的场景中特别有用：

```php
$perPage = $request->integer('per_page');
```

<a name="retrieving-boolean-input-values"></a>
#### 检索布尔输入值

处理复选框这类 HTML 元素时，应用可能会接收到实际为字符串的「真值」，例如 "true" 或 "on"。为方便起见，你可以使用 `boolean` 方法将这些值检索为布尔值。对于 1、"1"、true、"true"、"on" 和 "yes"，`boolean` 方法返回 `true`；其他所有值都会返回 `false`：

```php
$archived = $request->boolean('archived');
```

<a name="retrieving-array-input-values"></a>
#### 检索数组输入值

包含数组的输入值可以使用 `array` 方法来检索。该方法始终会将输入值转换为数组。如果请求中不存在指定名称的输入值，将返回空数组：

```php
$versions = $request->array('versions');
```

<a name="retrieving-date-input-values"></a>
#### 检索日期输入值

为方便起见，包含日期 / 时间的输入值可以使用 `date` 方法检索为 Carbon 实例。如果请求中不存在指定名称的输入值，将返回 `null`：

```php
$birthday = $request->date('birthday');
```

`date` 方法接受的第二和第三个参数，分别用于指定日期的格式和时区：

```php
$elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');
```

如果输入值存在但格式无效，将抛出 `InvalidArgumentException` 异常；因此建议在调用 `date` 方法之前先对输入进行验证。

<a name="retrieving-enum-input-values"></a>
#### 检索枚举输入值

与 [PHP 枚举](https://www.php.net/manual/en/language.types.enumerations.php)对应的输入值也可以从请求中检索。如果请求中不存在指定名称的输入值，或者枚举中没有与输入值匹配的回填值（backing value），将返回 `null`。`enum` 方法接受输入值的名称和枚举类分别作为第一和第二个参数：

```php
use App\Enums\Status;

$status = $request->enum('status', Status::class);
```

你还可以提供一个默认值，当该值缺失或无效时将返回此默认值：

```php
$status = $request->enum('status', Status::class, Status::Pending);
```

如果输入值是一个与 PHP 枚举对应的值数组，可以使用 `enums` 方法将该值数组检索为枚举实例：

```php
use App\Enums\Product;

$products = $request->enums('products', Product::class);
```

<a name="retrieving-input-via-dynamic-properties"></a>
#### 通过动态属性检索输入

你也可以通过 `Illuminate\Http\Request` 实例上的动态属性来访问用户输入。例如，如果应用的某个表单包含 `name` 字段，可以这样访问该字段的值：

```php
$name = $request->name;
```

使用动态属性时，Laravel 会首先在请求载荷中查找参数的值。如果不存在，Laravel 会在匹配路由的参数中查找该字段。

<a name="retrieving-a-portion-of-the-input-data"></a>
#### 检索部分输入数据

如果只需要检索输入数据的一个子集，可以使用 `only` 和 `except` 方法。这两个方法都接受单个 `array` 或动态的参数列表：

```php
$input = $request->only(['username', 'password']);

$input = $request->only('username', 'password');

$input = $request->except(['credit_card']);

$input = $request->except('credit_card');
```

> [!WARNING]
> `only` 方法返回你所请求的所有键 / 值对；但它不会返回请求中不存在的键 / 值对。

<a name="input-presence"></a>
### 输入存在性

你可以使用 `has` 方法判断某个值是否存在于请求中。如果值存在，`has` 方法返回 `true`：

```php
if ($request->has('name')) {
    // ...
}
```

传入数组时，`has` 方法会判断所有指定的值是否都存在：

```php
if ($request->has(['name', 'email'])) {
    // ...
}
```

`hasAny` 方法在任意一个指定值存在时返回 `true`：

```php
if ($request->hasAny(['name', 'email'])) {
    // ...
}
```

`whenHas` 方法会在请求中存在某个值时执行给定的闭包：

```php
$request->whenHas('name', function (string $input) {
    // ...
});
```

你也可以给 `whenHas` 方法传递第二个闭包，当请求中不存在指定的值时执行该闭包：

```php
$request->whenHas('name', function (string $input) {
    // "name" 值存在...
}, function () {
    // "name" 值不存在...
});
```

如果想判断某个值在请求中存在且不是空字符串，可以使用 `filled` 方法：

```php
if ($request->filled('name')) {
    // ...
}
```

如果想判断某个值在请求中缺失或为空字符串，可以使用 `isNotFilled` 方法：

```php
if ($request->isNotFilled('name')) {
    // ...
}
```

传入数组时，`isNotFilled` 方法会判断所有指定的值是否都缺失或为空：

```php
if ($request->isNotFilled(['name', 'email'])) {
    // ...
}
```

`anyFilled` 方法在任意一个指定值不是空字符串时返回 `true`：

```php
if ($request->anyFilled(['name', 'email'])) {
    // ...
}
```

`whenFilled` 方法会在请求中的某个值存在且不是空字符串时执行给定的闭包：

```php
$request->whenFilled('name', function (string $input) {
    // ...
});
```

你也可以给 `whenFilled` 方法传递第二个闭包，当指定的值未被「填充」时执行该闭包：

```php
$request->whenFilled('name', function (string $input) {
    // "name" 值已填充...
}, function () {
    // "name" 值未填充...
});
```

要判断请求中是否缺少某个给定的键，可以使用 `missing` 和 `whenMissing` 方法：

```php
if ($request->missing('name')) {
    // ...
}

$request->whenMissing('name', function () {
    // "name" 值缺失...
}, function () {
    // "name" 值存在...
});
```

<a name="merging-additional-input"></a>
### 合并附加输入

有时你可能需要手动将附加输入合并到请求的现有输入数据中。为此，可以使用 `merge` 方法。如果请求中已经存在某个输入键，它将被传递给 `merge` 方法的数据覆盖：

```php
$request->merge(['votes' => 0]);
```

`mergeIfMissing` 方法可用于在请求的输入数据中尚不存在相应键时，将输入合并到请求中：

```php
$request->mergeIfMissing(['votes' => 0]);
```

<a name="old-input"></a>
### 旧输入

Laravel 允许你在下一次请求中保留上一次请求的输入。这一功能在检测到验证错误后重新填充表单时特别有用。不过，如果你使用的是 Laravel 内置的[验证功能](/docs/{{version}}/validation)，可能无需直接手动使用这些会话输入闪存方法，因为 Laravel 的一些内置验证设施会自动调用它们。

<a name="flashing-input-to-the-session"></a>
#### 将输入闪存到会话

`Illuminate\Http\Request` 类的 `flash` 方法会把当前输入闪存到[会话（Session）](/docs/{{version}}/session)中，以便在用户下一次请求应用时使用：

```php
$request->flash();
```

你也可以使用 `flashOnly` 和 `flashExcept` 方法，将请求数据的一部分闪存到会话中。这些方法有助于将密码等敏感信息排除在会话之外：

```php
$request->flashOnly(['username', 'email']);

$request->flashExcept('password');
```

<a name="flashing-input-then-redirecting"></a>
#### 闪存输入后重定向

由于经常需要在将输入闪存到会话后重定向到上一个页面，你可以使用 `withInput` 方法将输入闪存轻松地链式附加到重定向上：

```php
return redirect('/form')->withInput();

return redirect()->route('user.create')->withInput();

return redirect('/form')->withInput(
    $request->except('password')
);
```

<a name="retrieving-old-input"></a>
#### 检索旧输入

要检索上一次请求中闪存的输入，可以在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法会从[会话](/docs/{{version}}/session)中取出之前闪存的输入数据：

```php
$username = $request->old('username');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你要在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数来重新填充表单会更加方便。如果指定字段没有旧输入，将返回 `null`：

```blade
<input type="text" name="username" value="{{ old('username') }}">
```

<a name="cookies"></a>
### Cookies

<a name="retrieving-cookies-from-requests"></a>
#### 从请求中检索 Cookies

Laravel 框架创建的所有 Cookie 都经过加密并使用认证代码签名，这意味着一旦被客户端更改，它们就会被视为无效。要从请求中检索 Cookie 的值，请在 `Illuminate\Http\Request` 实例上使用 `cookie` 方法：

```php
$value = $request->cookie('name');
```

<a name="input-trimming-and-normalization"></a>
## 输入修剪与规范化

默认情况下，Laravel 会在应用的全局中间件堆栈中包含 `Illuminate\Foundation\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 中间件。这些中间件会自动修剪请求中所有传入的字符串字段，并将所有空字符串字段转换为 `null`。这样你就无需在路由和控制器中担心这些规范化问题。

#### 禁用输入规范化

如果希望对所有请求禁用此行为，你可以在应用的 `bootstrap/app.php` 文件中调用 `$middleware->remove` 方法，将这两个中间件从应用的中间件堆栈中移除：

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

如果只想对应用的某一部分请求禁用字符串修剪和空字符串转换，你可以在应用的 `bootstrap/app.php` 文件中使用 `trimStrings` 和 `convertEmptyStringsToNull` 中间件方法。这两个方法都接受一个闭包数组，闭包应返回 `true` 或 `false`，以指示是否应跳过输入规范化：

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

你可以使用 `file` 方法或动态属性从 `Illuminate\Http\Request` 实例中检索上传的文件。`file` 方法返回 `Illuminate\Http\UploadedFile` 类的实例，该类继承了 PHP 的 `SplFileInfo` 类，并提供了多种与文件交互的方法：

```php
$file = $request->file('photo');

$file = $request->photo;
```

你可以使用 `hasFile` 方法判断请求中是否存在文件：

```php
if ($request->hasFile('photo')) {
    // ...
}
```

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

`UploadedFile` 类还包含一些方法，用于访问文件的完整限定路径及其扩展名。`extension` 方法会尝试根据文件内容来猜测其扩展名。该扩展名可能与客户端提供的扩展名不同：

```php
$path = $request->photo->path();

$extension = $request->photo->extension();
```

<a name="other-file-methods"></a>
#### 其他文件方法

`UploadedFile` 实例上还有许多其他可用的方法。关于这些方法的更多信息，请查阅[该类的 API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php)。

<a name="storing-uploaded-files"></a>
### 存储上传的文件

要存储上传的文件，通常需要使用你配置的某个[文件系统](/docs/{{version}}/filesystem)。`UploadedFile` 类有一个 `store` 方法，可以将上传的文件移动到你的某个磁盘上，该磁盘可以是本地文件系统上的位置，也可以是 Amazon S3 之类的云存储位置。

`store` 方法接受文件存储路径，该路径相对于文件系统配置的根目录。此路径不应包含文件名，因为系统会自动生成一个唯一 ID 作为文件名。

`store` 方法还接受可选的第二个参数，用于指定存储文件所使用的磁盘名称。该方法将返回文件相对于磁盘根目录的路径：

```php
$path = $request->photo->store('images');

$path = $request->photo->store('images', 's3');
```

如果不想自动生成文件名，可以使用 `storeAs` 方法，该方法接受路径、文件名和磁盘名称作为参数：

```php
$path = $request->photo->storeAs('images', 'filename.jpg');

$path = $request->photo->storeAs('images', 'filename.jpg', 's3');
```

> [!NOTE]
> 有关 Laravel 中文件存储的更多信息，请查阅完整的[文件存储文档](/docs/{{version}}/filesystem)。

<a name="configuring-trusted-proxies"></a>
## 配置信任代理

当应用运行在终止 TLS / SSL 证书的负载均衡器之后时，你可能会发现应用在使用 `url` 辅助函数时有时不会生成 HTTPS 链接。这通常是因为应用的流量由负载均衡器通过 80 端口转发而来，应用并不知道应当生成安全链接。

要解决这个问题，你可以启用 Laravel 应用内置的 `Illuminate\Http\Middleware\TrustProxies` 中间件，它允许你快速自定义应用应信任的负载均衡器或代理。你应当在应用的 `bootstrap/app.php` 文件中使用 `trustProxies` 中间件方法指定信任的代理：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: [
        '192.168.1.1',
        '10.0.0.0/8',
    ]);
})
```

除了配置信任的代理之外，你还可以配置应当信任的代理头部：

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
> 如果你使用的是 AWS Elastic Load Balancing，`headers` 值应为 `Request::HEADER_X_FORWARDED_AWS_ELB`。如果你的负载均衡器使用 [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239#section-4) 中标准的 `Forwarded` 头部，则 `headers` 值应为 `Request::HEADER_FORWARDED`。有关 `headers` 值中可用常量的更多信息，请查阅 Symfony 关于[信任代理](https://symfony.com/doc/current/deployment/proxies.html)的文档。

<a name="trusting-all-proxies"></a>
#### 信任所有代理

如果你使用的是 Amazon AWS 或其他「云」负载均衡器提供商，可能无法得知实际均衡器的 IP 地址。这种情况下，可以使用 `*` 来信任所有代理：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

<a name="configuring-trusted-hosts"></a>
## 配置信任主机

默认情况下，无论 HTTP 请求的 `Host` 头部内容为何，Laravel 都会响应其收到的所有请求。此外，在 Web 请求期间生成指向应用的绝对 URL 时，也会使用 `Host` 头部的值。

通常，你应当配置 Web 服务器（如 Nginx 或 Apache），使其只将与给定主机名匹配的请求发送给应用。但如果无法直接自定义 Web 服务器，又需要让 Laravel 只响应特定的主机名，可以为应用启用 `Illuminate\Http\Middleware\TrustHosts` 中间件来实现。

要启用 `TrustHosts` 中间件，你应当在应用的 `bootstrap/app.php` 文件中调用 `trustHosts` 中间件方法。通过该方法的 `at` 参数，你可以指定应用应响应的主机名。主机名字符串会被当作正则表达式处理。带有其他 `Host` 头部的传入请求将被拒绝：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$']);
})
```

默认情况下，来自应用 URL 子域的请求也会被自动信任。如果想禁用此行为，可以使用 `subdomains` 参数：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$'], subdomains: false);
})
```

如果需要访问应用的配置文件或数据库来确定信任的主机，你可以给 `at` 参数传递一个闭包：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: fn () => config('app.trusted_hosts'));
})
```
