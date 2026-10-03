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
    - [获取输入](#retrieving-input)
    - [输入的存在性](#input-presence)
    - [合并额外输入](#merging-additional-input)
    - [旧输入](#old-input)
    - [Cookie](#cookies)
    - [输入裁剪与规范化](#input-trimming-and-normalization)
- [文件](#files)
    - [获取上传的文件](#retrieving-uploaded-files)
    - [存储上传的文件](#storing-uploaded-files)
- [配置可信代理](#configuring-trusted-proxies)
- [配置可信主机](#configuring-trusted-hosts)

<a name="introduction"></a>
## 简介

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式，用于与你的应用当前正在处理的 HTTP 请求交互，并获取随该请求一起提交的输入、Cookie 和文件。

<a name="interacting-with-the-request"></a>
## 与请求交互

<a name="accessing-the-request"></a>
### 访问请求

要通过依赖注入获取当前 HTTP 请求的实例，你应当在路由闭包或控制器方法上类型提示 `Illuminate\Http\Request` 类。传入的请求实例会由 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)自动注入：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储一个新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->input('name');

        // 存储用户...

        return redirect('/users');
    }
}
```

如前所述，你也可以在路由闭包上类型提示 `Illuminate\Http\Request` 类。闭包执行时，服务容器会自动把传入的请求注入其中：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

<a name="dependency-injection-route-parameters"></a>
#### 依赖注入与路由参数

如果你的控制器方法还期望接收来自路由参数的输入，就应当把路由参数列在其他依赖之后。例如，如果你的路由这样定义：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你依然可以类型提示 `Illuminate\Http\Request`，并通过如下方式定义控制器方法来访问 `id` 路由参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新指定的用户。
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

`Illuminate\Http\Request` 实例提供了多种用于检查传入 HTTP 请求的方法，并扩展了 `Symfony\Component\HttpFoundation\Request` 类。下面我们讨论其中最重要的一些方法。

<a name="retrieving-the-request-path"></a>
#### 获取请求路径

`path` 方法返回请求的路径信息。因此，如果传入请求的目标是 `http://example.com/foo/bar`，`path` 方法会返回 `foo/bar`：

```php
$uri = $request->path();
```

<a name="inspecting-the-request-path"></a>
#### 检查请求路径 / 路由

`is` 方法允许你验证传入请求的路径是否匹配给定模式。使用该方法时，你可以用 `*` 字符作为通配符：

```php
if ($request->is('admin/*')) {
    // ...
}
```

借助 `routeIs` 方法，你可以判断传入请求是否匹配了某个[命名路由](/docs/{{version}}/routing#named-routes)：

```php
if ($request->routeIs('admin.*')) {
    // ...
}
```

<a name="retrieving-the-request-url"></a>
#### 获取请求 URL

要获取传入请求的完整 URL，可以使用 `url` 或 `fullUrl` 方法。`url` 方法返回不带查询字符串的 URL，而 `fullUrl` 方法则包含查询字符串：

```php
$url = $request->url();

$urlWithQueryString = $request->fullUrl();
```

如果你想把查询字符串数据追加到当前 URL 上，可以调用 `fullUrlWithQuery` 方法。该方法会把给定的查询字符串变量数组与当前查询字符串合并：

```php
$request->fullUrlWithQuery(['type' => 'phone']);
```

如果你想获取不含某个给定查询字符串参数的当前 URL，可以使用 `fullUrlWithoutQuery` 方法：

```php
$request->fullUrlWithoutQuery(['type']);
```

<a name="retrieving-the-request-host"></a>
#### 获取请求主机

你可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法获取传入请求的"主机"：

```php
$request->host();
$request->httpHost();
$request->schemeAndHttpHost();
```

<a name="retrieving-the-request-method"></a>
#### 获取请求方法

`method` 方法会返回该请求的 HTTP 动词。你可以使用 `isMethod` 方法验证 HTTP 动词是否匹配给定字符串：

```php
$method = $request->method();

if ($request->isMethod('post')) {
    // ...
}
```

<a name="request-headers"></a>
### 请求头

你可以使用 `header` 方法从 `Illuminate\Http\Request` 实例中获取请求头。如果请求中不存在该头，则会返回 `null`。不过，`header` 方法还接受一个可选的第二个参数，用于在请求中不存在该头时返回：

```php
$value = $request->header('X-Header-Name');

$value = $request->header('X-Header-Name', 'default');
```

`hasHeader` 方法可用于判断请求中是否包含某个给定的头：

```php
if ($request->hasHeader('X-Header-Name')) {
    // ...
}
```

为方便起见，可以使用 `bearerToken` 方法从 `Authorization` 头中获取 Bearer 令牌。如果不存在该头，则会返回一个空字符串：

```php
$token = $request->bearerToken();
```

<a name="request-ip-address"></a>
### 请求 IP 地址

`ip` 方法可用于获取向你的应用发起请求的客户端 IP 地址：

```php
$ipAddress = $request->ip();
```

如果你想获取一组 IP 地址（包括代理转发的所有客户端 IP 地址），可以使用 `ips` 方法。"原始"客户端 IP 地址会位于数组末尾：

```php
$ipAddresses = $request->ips();
```

一般来说，IP 地址应当被视为不可信、由用户控制的输入，仅用于提供信息。

<a name="content-negotiation"></a>
### 内容协商

Laravel 提供了多种方法，用于通过 `Accept` 头检查传入请求所请求的内容类型。首先，`getAcceptableContentTypes` 方法会返回一个数组，其中包含该请求所接受的所有内容类型：

```php
$contentTypes = $request->getAcceptableContentTypes();
```

`accepts` 方法接受一个内容类型数组，如果其中任何一种内容类型被该请求接受，就返回 `true`；否则返回 `false`：

```php
if ($request->accepts(['text/html', 'application/json'])) {
    // ...
}
```

你可以使用 `prefers` 方法，从给定的内容类型数组中判断哪一种最受该请求偏好。如果所提供的内容类型都不被该请求接受，则返回 `null`：

```php
$preferred = $request->prefers(['text/html', 'application/json']);
```

由于许多应用只提供 HTML 或 JSON，你可以使用 `expectsJson` 方法快速判断传入请求是否期望 JSON 响应：

```php
if ($request->expectsJson()) {
    // ...
}
```

<a name="psr7-requests"></a>
### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/)规定了 HTTP 消息的接口，包括请求和响应。如果你想获取 PSR-7 请求实例而非 Laravel 请求，就需要先安装几个库。Laravel 使用 *Symfony HTTP Message Bridge* 组件把典型的 Laravel 请求和响应转换为兼容 PSR-7 的实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装好这些库之后，你可以在路由闭包或控制器方法上类型提示请求接口，从而获取 PSR-7 请求：

```php
use Psr\Http\Message\ServerRequestInterface;

Route::get('/', function (ServerRequestInterface $request) {
    // ...
});
```

> [!NOTE]
> 如果你从路由或控制器返回 PSR-7 响应实例，它会被自动转换回 Laravel 响应实例，并由框架输出。

<a name="input"></a>
## 输入

<a name="retrieving-input"></a>
### 获取输入

<a name="retrieving-all-input-data"></a>
#### 获取全部输入数据

你可以使用 `all` 方法把传入请求的全部输入数据获取为一个 `array`。无论传入请求来自 HTML 表单还是 XHR 请求，都可以使用该方法：

```php
$input = $request->all();
```

借助 `collect` 方法，你可以把传入请求的全部输入数据获取为一个[集合](/docs/{{version}}/collections)：

```php
$input = $request->collect();
```

`collect` 方法还允许你把传入请求的输入子集获取为一个集合：

```php
$request->collect('users')->each(function (string $user) {
    // ...
});
```

<a name="retrieving-an-input-value"></a>
#### 获取单个输入值

通过几个简单的方法，你就可以访问 `Illuminate\Http\Request` 实例上的全部用户输入，而不必担心请求使用的是哪个 HTTP 动词。无论使用何种 HTTP 动词，都可以用 `input` 方法获取用户输入：

```php
$name = $request->input('name');
```

你可以把一个默认值作为 `input` 方法的第二个参数传入。如果请求中不存在所请求的输入值，就会返回该值：

```php
$name = $request->input('name', 'Sally');
```

处理包含数组输入的表单时，使用"点"记法来访问数组：

```php
$name = $request->input('products.0.name');

$names = $request->input('products.*.name');
```

你也可以不带参数调用 `input` 方法，以便把所有输入值获取为一个关联数组：

```php
$input = $request->input();
```

<a name="retrieving-input-from-the-query-string"></a>
#### 从查询字符串获取输入

`input` 方法会从整个请求载荷（包括查询字符串）中获取值，而 `query` 方法只从查询字符串中获取值：

```php
$name = $request->query('name');
```

如果不存在所请求的查询字符串值数据，就会返回该方法的第二个参数：

```php
$name = $request->query('name', 'Helen');
```

你也可以不带参数调用 `query` 方法，以便把所有查询字符串值获取为一个关联数组：

```php
$query = $request->query();
```

<a name="retrieving-json-input-values"></a>
#### 获取 JSON 输入值

当向你的应用发送 JSON 请求时，只要请求的 `Content-Type` 头被正确设置为 `application/json`，你就可以通过 `input` 方法访问 JSON 数据。你甚至可以用"点"语法获取嵌套在 JSON 数组 / 对象中的值：

```php
$name = $request->input('user.name');
```

<a name="retrieving-stringable-input-values"></a>
#### 获取 Stringable 输入值

除了把请求输入数据获取为基本类型 `string`，你还可以使用 `string` 方法把请求数据获取为 [`Illuminate\Support\Stringable`](/docs/{{version}}/strings) 实例：

```php
$name = $request->string('name')->trim();
```

<a name="retrieving-integer-input-values"></a>
#### 获取整数输入值

要以整数形式获取输入值，你可以使用 `integer` 方法。该方法会尝试把输入值转换为整数。如果输入不存在或转换失败，它会返回你指定的默认值。这在分页或其他数值输入场景中尤其有用：

```php
$perPage = $request->integer('per_page');
```

<a name="retrieving-boolean-input-values"></a>
#### 获取布尔输入值

处理复选框之类的 HTML 元素时，你的应用收到的"真值"实际上可能是字符串，例如 "true" 或 "on"。为方便起见，你可以使用 `boolean` 方法把这些值获取为布尔值。对于 1、"1"、true、"true"、"on" 和 "yes"，`boolean` 方法返回 `true`；其他所有值均返回 `false`：

```php
$archived = $request->boolean('archived');
```

<a name="retrieving-date-input-values"></a>
#### 获取日期输入值

为方便起见，包含日期 / 时间的输入值可以使用 `date` 方法获取为 Carbon 实例。如果请求中不存在指定名称的输入值，将返回 `null`：

```php
$birthday = $request->date('birthday');
```

`date` 方法接受的第二个和第三个参数可分别用于指定日期的格式和时区：

```php
$elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');
```

如果输入值存在但格式无效，将抛出 `InvalidArgumentException`；因此建议在调用 `date` 方法之前先验证输入。

<a name="retrieving-enum-input-values"></a>
#### 获取枚举输入值

与 [PHP 枚举](https://www.php.net/manual/en/language.types.enumerations.php)对应的输入值也可以从请求中获取。如果请求中不存在指定名称的输入值，或者该枚举没有与输入值匹配的支撑值，将返回 `null`。`enum` 方法的第一个和第二个参数分别接受输入值的名称和枚举类：

```php
use App\Enums\Status;

$status = $request->enum('status', Status::class);
```

如果输入值是一组与 PHP 枚举对应的值的数组，你可以使用 `enums` 方法把这些值获取为枚举实例数组：

```php
use App\Enums\Product;

$products = $request->enums('products', Product::class);
```

<a name="retrieving-input-via-dynamic-properties"></a>
#### 通过动态属性获取输入

你也可以通过 `Illuminate\Http\Request` 实例上的动态属性访问用户输入。例如，如果应用中某个表单包含 `name` 字段，你可以这样访问该字段的值：

```php
$name = $request->name;
```

使用动态属性时，Laravel 会先在请求载荷中查找该参数的值。如果不存在，Laravel 会在匹配到的路由参数中查找该字段。

<a name="retrieving-a-portion-of-the-input-data"></a>
#### 获取部分输入数据

如果你需要获取输入数据的一个子集，可以使用 `only` 和 `except` 方法。这两个方法都接受单个 `array` 或一份动态参数列表：

```php
$input = $request->only(['username', 'password']);

$input = $request->only('username', 'password');

$input = $request->except(['credit_card']);

$input = $request->except('credit_card');
```

> [!WARNING]
> `only` 方法会返回你请求的所有键 / 值对；但请求中不存在的键 / 值对不会被返回。

<a name="input-presence"></a>
### 输入存在性

你可以使用 `has` 方法判断请求中是否存在某个值。如果请求中存在该值，`has` 方法返回 `true`：

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

只要任一指定值存在，`hasAny` 方法就返回 `true`：

```php
if ($request->hasAny(['name', 'email'])) {
    // ...
}
```

如果请求中存在某个值，`whenHas` 方法会执行给定的闭包：

```php
$request->whenHas('name', function (string $input) {
    // ...
});
```

你还可以向 `whenHas` 方法传入第二个闭包，当指定值在请求中不存在时执行它：

```php
$request->whenHas('name', function (string $input) {
    // "name" 值存在……
}, function () {
    // "name" 值不存在……
});
```

如果你想判断请求中是否存在某个值且该值不是空字符串，可以使用 `filled` 方法：

```php
if ($request->filled('name')) {
    // ...
}
```

如果你想判断请求中缺少某个值或该值为空字符串，可以使用 `isNotFilled` 方法：

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

只要任一指定值不是空字符串，`anyFilled` 方法就返回 `true`：

```php
if ($request->anyFilled(['name', 'email'])) {
    // ...
}
```

如果请求中存在某个值且该值不是空字符串，`whenFilled` 方法会执行给定的闭包：

```php
$request->whenFilled('name', function (string $input) {
    // ...
});
```

你还可以向 `whenFilled` 方法传入第二个闭包，当指定值"未填充"时执行它：

```php
$request->whenFilled('name', function (string $input) {
    // "name" 值已填充……
}, function () {
    // "name" 值未填充……
});
```

要判断请求中是否缺少某个键，可以使用 `missing` 和 `whenMissing` 方法：

```php
if ($request->missing('name')) {
    // ...
}

$request->whenMissing('name', function () {
    // "name" 值缺失……
}, function () {
    // "name" 值存在……
});
```

<a name="merging-additional-input"></a>
### 合并额外输入

有时你可能需要手动把额外输入合并到请求已有的输入数据中。为此，你可以使用 `merge` 方法。如果请求中已存在某个输入键，传入 `merge` 方法的数据会覆盖它：

```php
$request->merge(['votes' => 0]);
```

如果相应的键尚未存在于请求的输入数据中，可以使用 `mergeIfMissing` 方法把输入合并到请求中：

```php
$request->mergeIfMissing(['votes' => 0]);
```

<a name="old-input"></a>
### 旧输入

Laravel 允许你在下一个请求期间保留上一个请求的输入。该特性在检测到验证错误后重新填充表单时尤其有用。不过，如果你使用 Laravel 自带的[验证功能](/docs/{{version}}/validation)，那么可能无需直接手动使用这些会话输入闪存方法，因为 Laravel 内置的部分验证机制会自动调用它们。

<a name="flashing-input-to-the-session"></a>
#### 将输入闪存到会话

`Illuminate\Http\Request` 类上的 `flash` 方法会把当前输入闪存到[会话](/docs/{{version}}/session)，以便在用户下一次请求应用时可用：

```php
$request->flash();
```

你也可以使用 `flashOnly` 和 `flashExcept` 方法把请求数据的一个子集闪存到会话中。这些方法有助于把密码等敏感信息排除在会话之外：

```php
$request->flashOnly(['username', 'email']);

$request->flashExcept('password');
```

<a name="flashing-input-then-redirecting"></a>
#### 闪存输入后重定向

由于你通常希望把输入闪存到会话后再重定向回上一页，可以使用 `withInput` 方法把输入闪存链到重定向上：

```php
return redirect('/form')->withInput();

return redirect()->route('user.create')->withInput();

return redirect('/form')->withInput(
    $request->except('password')
);
```

<a name="retrieving-old-input"></a>
#### 获取旧输入

要获取上一个请求中闪存的输入，请调用 `Illuminate\Http\Request` 实例上的 `old` 方法。`old` 方法会从[会话](/docs/{{version}}/session)中取出此前闪存的输入数据：

```php
$username = $request->old('username');
```

Laravel 还提供了一个全局 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数重新填充表单会更方便。如果给定字段没有旧输入，将返回 `null`：

```blade
<input type="text" name="username" value="{{ old('username') }}">
```

<a name="cookies"></a>
### Cookie

<a name="retrieving-cookies-from-requests"></a>
#### 从请求中获取 Cookie

Laravel 框架创建的所有 Cookie 都经过加密并使用认证码签名，也就是说客户端一旦篡改就会被视为无效。要从请求中获取 Cookie 值，请在 `Illuminate\Http\Request` 实例上使用 `cookie` 方法：

```php
$value = $request->cookie('name');
```

<a name="input-trimming-and-normalization"></a>
## 输入裁剪与规范化

默认情况下，Laravel 会把 `Illuminate\Foundation\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 中间件加入应用的全局中间件栈。这些中间件会自动裁剪请求中所有传入的字符串字段，并把任何空字符串字段转换为 `null`。这样你在路由和控制器中就无需再操心这些规范化问题。

#### 禁用输入规范化

如果你想对所有请求禁用该行为，可以在应用的 `bootstrap/app.php` 文件中调用 `$middleware->remove` 方法，把这两个中间件从应用的中间件栈中移除：

```php
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;

->withMiddleware(function (Middleware $middleware) {
    $middleware->remove([
        ConvertEmptyStringsToNull::class,
        TrimStrings::class,
    ]);
})
```

如果你想对应用中的一部分请求禁用字符串裁剪和空字符串转换，可以在应用的 `bootstrap/app.php` 文件中使用 `trimStrings` 和 `convertEmptyStringsToNull` 中间件方法。两个方法都接受一个闭包数组，闭包应返回 `true` 或 `false`，表示是否跳过输入规范化：

```php
->withMiddleware(function (Middleware $middleware) {
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
### 获取上传的文件

你可以使用 `file` 方法或动态属性从 `Illuminate\Http\Request` 实例中获取上传的文件。`file` 方法返回 `Illuminate\Http\UploadedFile` 类的实例，该类继承 PHP 的 `SplFileInfo` 类，并提供多种与文件交互的方法：

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
#### 校验上传是否成功

除了检查文件是否存在之外，还可以通过 `isValid` 方法验证上传过程中是否出现问题：

```php
if ($request->file('photo')->isValid()) {
    // ...
}
```

<a name="file-paths-extensions"></a>
#### 文件路径与扩展名

`UploadedFile` 类还包含访问文件完全限定路径和扩展名的方法。`extension` 方法会根据文件内容尝试猜测其扩展名。猜测出的扩展名可能与客户端提供的扩展名不同：

```php
$path = $request->photo->path();

$extension = $request->photo->extension();
```

<a name="other-file-methods"></a>
#### 其他文件方法

`UploadedFile` 实例上还提供了多种其他方法。有关这些方法的更多信息，请查看[该类的 API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php)。

<a name="storing-uploaded-files"></a>
### 存储上传的文件

要存储上传的文件，通常需要使用你配置好的某个[文件系统](/docs/{{version}}/filesystem)。`UploadedFile` 类提供了 `store` 方法，它会把上传的文件移动到你的某个磁盘上，该磁盘可以是本地文件系统上的位置，也可以是 Amazon S3 之类的云存储位置。

`store` 方法接受一个路径，表示文件相对于文件系统所配置根目录的存储位置。该路径不应包含文件名，因为系统会自动生成一个唯一 ID 作为文件名。

`store` 方法还接受一个可选的第二个参数，用于指定存储文件所用的磁盘名称。该方法会返回文件相对于磁盘根目录的路径：

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
> 想了解更多关于 Laravel 文件存储的信息，请查看完整的[文件存储文档](/docs/{{version}}/filesystem)。

<a name="configuring-trusted-proxies"></a>
## 配置受信任的代理

当应用运行在终止 TLS / SSL 证书的负载均衡器之后时，你可能会发现使用 `url` 辅助函数有时并不会生成 HTTPS 链接。通常是因为你的应用从负载均衡器的 80 端口接收转发流量，并不知道应该生成安全链接。

要解决这个问题，你可以启用 Laravel 应用中自带的 `Illuminate\Http\Middleware\TrustProxies` 中间件，它让你可以快速自定义应用应当信任的负载均衡器或代理。受信任的代理应通过应用的 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法指定：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: [
        '192.168.1.1',
        '10.0.0.0/8',
    ]);
})
```

除了配置受信任的代理之外，你还可以配置应当信任哪些代理头：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB
    );
})
```

> [!NOTE]
> 如果你使用 AWS Elastic Load Balancing，`headers` 值应为 `Request::HEADER_X_FORWARDED_AWS_ELB`。如果你的负载均衡器使用 [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239#section-4) 的标准 `Forwarded` 头，`headers` 值应为 `Request::HEADER_FORWARDED`。有关 `headers` 值中可用的常量，请参阅 Symfony 关于[信任代理](https://symfony.com/doc/7.0/deployment/proxies.html)的文档。

<a name="trusting-all-proxies"></a>
#### 信任所有代理

如果你使用 Amazon AWS 或其他"云"负载均衡器提供商，可能并不清楚实际负载均衡器的 IP 地址。这种情况下，可以使用 `*` 信任所有代理：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: '*');
})
```

<a name="configuring-trusted-hosts"></a>
## 配置受信任的主机

默认情况下，无论 HTTP 请求的 `Host` 头内容如何，Laravel 都会响应收到的所有请求。此外，在处理 Web 请求时，生成指向你应用的绝对 URL 会使用 `Host` 头的值。

通常，你应当配置 Web 服务器（例如 Nginx 或 Apache），只把与给定主机名匹配的请求发送给应用。不过，如果你无法直接自定义 Web 服务器，又需要让 Laravel 只响应特定主机名，可以为你的应用启用 `Illuminate\Http\Middleware\TrustHosts` 中间件。

要启用 `TrustHosts` 中间件，请在应用的 `bootstrap/app.php` 文件中调用 `trustHosts` 中间件方法。通过该方法的 `at` 参数，你可以指定应用应当响应哪些主机名。其他 `Host` 头的传入请求将被拒绝：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustHosts(at: ['laravel.test']);
})
```

默认情况下，来自应用 URL 子域的请求也会被自动信任。如果你想禁用该行为，可以使用 `subdomains` 参数：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustHosts(at: ['laravel.test'], subdomains: false);
})
```

如果你需要访问应用的配置文件或数据库来确定受信任的主机，可以向 `at` 参数传入一个闭包：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustHosts(at: fn () => config('app.trusted_hosts'));
})
```