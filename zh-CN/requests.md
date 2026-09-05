# HTTP 请求

## 介绍

Laravel 的 `Illuminate\Http\Request` 类提供了一种面向对象的方式来与当前 HTTP 请求交互，并能取出请求携带的输入、Cookie 和文件。

## 与请求交互

### 访问请求

要通过依赖注入获得当前 HTTP 请求的实例，应当在路由闭包或控制器方法中类型提示 `Illuminate\Http\Request` 类。进来的请求实例会由 Laravel [服务容器](/docs/{{version}}/container) 自动注入：

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

如前所述，你也可以在路由闭包里类型提示 `Illuminate\Http\Request` 类。服务容器在执行闭包时会自动把进来的请求注入进去：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

#### 依赖注入与路由参数

如果你的控制器方法还需要接收来自路由参数的输入，那么应当把路由参数放到其它依赖之后。例如，你的路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍可以类型提示 `Illuminate\Http\Request`，并通过如下方式把控制器方法中的 `id` 路由参数也拿到：

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

### 请求路径、主机与方法

`Illuminate\Http\Request` 实例提供了多种用于检查进来 HTTP 请求的方法，并继承自 `Symfony\Component\HttpFoundation\Request`。下面我们会介绍其中几个最常用的方法。

#### 获取请求路径

`path` 方法返回请求的路径信息。因此，如果进来的请求目标是 `http://example.com/foo/bar`，那么 `path` 方法将返回 `foo/bar`：

```php
$uri = $request->path();
```

#### 检查请求路径/路由

`is` 方法允许你验证进来请求的路径是否匹配给定的模式。在使用该方法时，可以用 `*` 字符作为通配符：

```php
if ($request->is('admin/*')) {
    // ...
}
```

通过 `routeIs` 方法，你可以判断进来的请求是否匹配了某个 [命名路由](/docs/{{version}}/routing#named-routes)：

```php
if ($request->routeIs('admin.*')) {
    // ...
}
```

#### 获取请求 URL

可以使用 `url` 或 `fullUrl` 方法获取进来请求的完整 URL。`url` 方法返回不包含查询字符串的 URL，而 `fullUrl` 方法包含查询字符串：

```php
$url = $request->url();

$urlWithQueryString = $request->fullUrl();
```

如果希望在当前 URL 上追加查询字符串数据，可以调用 `fullUrlWithQuery` 方法。该方法会把传入的查询字符串变量与当前查询字符串合并：

```php
$request->fullUrlWithQuery(['type' => 'phone']);
```

如果希望在当前 URL 中去掉某个查询字符串参数，可以使用 `fullUrlWithoutQuery` 方法：

```php
$request->fullUrlWithoutQuery(['type']);
```

#### 获取请求主机

可以通过 `host`、`httpHost` 和 `schemeAndHttpHost` 方法获取进来请求的"主机（host）"：

```php
// http://localhost:8000
$request->host(); // localhost
$request->httpHost(); // localhost:8000
$request->schemeAndHttpHost(); // http://localhost:8000
```

#### 获取请求方法

`method` 方法会返回请求的 HTTP 动词。可以使用 `isMethod` 方法来验证 HTTP 动词是否匹配给定的字符串：

```php
$method = $request->method();

if ($request->isMethod('post')) {
    // ...
}
```

### 请求头

可以使用 `header` 方法从 `Illuminate\Http\Request` 实例中获取某个请求头。如果请求中没有该请求头，将返回 `null`。不过，`header` 方法可以接收一个可选的第二个参数，在请求头不存在时作为默认值返回：

```php
$value = $request->header('X-Header-Name');

$value = $request->header('X-Header-Name', 'default');
```

`hasHeader` 方法可用于判断请求中是否包含给定的请求头：

```php
if ($request->hasHeader('X-Header-Name')) {
    // ...
}
```

为了方便，可以使用 `bearerToken` 方法从 `Authorization` 头中获取 bearer token。如果没有该头，则返回空字符串：

```php
$token = $request->bearerToken();
```

### 请求 IP 地址

可以使用 `ip` 方法获取发起请求到应用的客户端 IP 地址：

```php
$ipAddress = $request->ip();
```

如果希望获得一个包含所有客户端 IP 地址（包括由代理转发的 IP）的数组，可以使用 `ips` 方法。"原始"客户端 IP 地址会位于数组末尾：

```php
$ipAddresses = $request->ips();
```

通常来说，IP 地址应当被视为不可信的、由用户控制的输入，仅用于信息展示之类的用途。

### 内容协商

Laravel 提供了多种方法，通过 `Accept` 请求头来检查进来请求所期望的内容类型。首先，`getAcceptableContentTypes` 方法会返回一个数组，其中包含请求所接受的所有内容类型：

```php
$contentTypes = $request->getAcceptableContentTypes();
```

`accepts` 方法接收一个内容类型数组，如果请求接受其中任意一种内容类型则返回 `true`，否则返回 `false`：

```php
if ($request->accepts(['text/html', 'application/json'])) {
    // ...
}
```

你可以使用 `prefers` 方法来判断在一组给定的内容类型中，哪一个最受该请求偏爱。如果提供的所有内容类型都不被请求接受，将返回 `null`：

```php
$preferred = $request->prefers(['text/html', 'application/json']);
```

由于很多应用只提供 HTML 或 JSON，你可以使用 `expectsJson` 方法快速判断进来请求是否期待 JSON 响应：

```php
if ($request->expectsJson()) {
    // ...
}
```

如果你希望判断请求是否明确偏爱 Markdown，或者是否在其它内容类型之外也能接受 Markdown——比如在给 AI 代理或其它消费 Markdown 响应的客户端提供响应时——可以使用 `wantsMarkdown` 和 `acceptsMarkdown` 方法：

```php
if ($request->wantsMarkdown()) {
    // 客户端最偏爱的内容类型是 text/markdown...
}

if ($request->acceptsMarkdown()) {
    // 客户端接受 Markdown 响应...
}
```

### PSR-7 请求

[PSR-7 标准](https://www.php-fig.org/psr/psr-7/) 为 HTTP 消息（包括请求和响应）规定了接口。如果你希望获得一个 PSR-7 请求实例，而不是 Laravel 请求，那么需要先安装几个库。Laravel 使用 *Symfony HTTP Message Bridge* 组件把典型的 Laravel 请求和响应转换为 PSR-7 兼容实现：

```shell
composer require symfony/psr-http-message-bridge
composer require nyholm/psr7
```

安装好这些库之后，就可以在路由闭包或控制器方法里通过类型提示该请求接口来获得 PSR-7 请求：

```php
use Psr\Http\Message\ServerRequestInterface;

Route::get('/', function (ServerRequestInterface $request) {
    // ...
});
```

> [!NOTE]
> 如果你在路由或控制器里返回了一个 PSR-7 响应实例，它会被自动转换回 Laravel 响应实例并由框架渲染。

## 输入

### 获取输入

#### 获取全部输入数据

你可以使用 `all` 方法把进来请求的所有输入数据作为一个 `array` 获取。该方法无论进来的是来自 HTML 表单还是 XHR 请求都能使用：

```php
$input = $request->all();
```

使用 `collect` 方法，可以把进来请求的所有输入数据作为一个 [集合](/docs/{{version}}/collections) 获取：

```php
$input = $request->collect();
```

`collect` 方法也允许你把进来请求中输入的某一个子集作为集合获取：

```php
$request->collect('users')->each(function (string $user) {
    // ...
});
```

#### 获取单个输入值

通过几个简单的方法，你可以从 `Illuminate\Http\Request` 实例访问所有用户输入，而不必关心请求使用的 HTTP 动词。无论 HTTP 动词如何，都可以用 `input` 方法来获取用户输入：

```php
$name = $request->input('name');
```

你可以给 `input` 方法传入默认值作为第二个参数。当请求中不存在请求的输入值时，将返回该默认值：

```php
$name = $request->input('name', 'Sally');
```

当处理包含数组输入的表单时，可以使用"点"语法来访问数组：

```php
$name = $request->input('products.0.name');

$names = $request->input('products.*.name');
```

你也可以不加任何参数地调用 `input` 方法，从而把全部输入值作为一个关联数组获取：

```php
$input = $request->input();
```

#### 从查询字符串获取输入

`input` 方法会从整个请求负载（包括查询字符串）中取值，而 `query` 方法只会从查询字符串中取值：

```php
$name = $request->query('name');
```

如果请求的查询字符串值不存在，会返回该方法的第二个参数：

```php
$name = $request->query('name', 'Helen');
```

你也可以不加任何参数地调用 `query` 方法，从而把全部查询字符串值作为一个关联数组获取：

```php
$query = $request->query();
```

#### 获取 JSON 输入值

当向应用发送 JSON 请求时，只要把请求的 `Content-Type` 头正确设置为 `application/json`，就可以通过 `input` 方法访问 JSON 数据。你甚至可以使用"点"语法来获取嵌套在 JSON 数组/对象里的值：

```php
$name = $request->input('user.name');
```

#### 获取可字符串化输入值

你不必把请求的输入数据作为原始 `string` 获取，而是可以使用 `string` 方法把请求数据作为 [Illuminate\Support\Stringable](/docs/{{version}}/strings) 实例获取：

```php
$name = $request->string('name')->trim();
```

#### 获取整数输入值

要把输入值作为整数获取，可以使用 `integer` 方法。该方法会尝试把输入值转换为整数。如果输入值不存在或者转换失败，会返回你指定的默认值。这在分页或其它数字输入场景中尤为有用：

```php
$perPage = $request->integer('per_page');
```

#### 获取布尔输入值

在处理像复选框这样的 HTML 元素时，你的应用可能会收到看似"真值"但实际上是字符串的值。例如 `"true"` 或 `"on"`。为方便起见，你可以使用 `boolean` 方法以布尔值的形式取出它们。`boolean` 方法对 `1`、`"1"`、`true`、`"true"`、`"on"` 和 `"yes"` 返回 `true`，对其它所有值返回 `false`：

```php
$archived = $request->boolean('archived');
```

#### 获取数组输入值

可以使用 `array` 方法获取包含数组的输入值。该方法总会把输入值强制转换为数组。如果请求中没有给定名字的输入值，将返回空数组：

```php
$versions = $request->array('versions');
```

#### 获取日期输入值

为了方便，可以使用 `date` 方法把包含日期/时间的输入值作为 Carbon 实例获取。如果请求中没有给定名字的输入值，将返回 `null`：

```php
$birthday = $request->date('birthday');
```

`date` 方法接受的第二个和第三个参数可以分别指定日期的格式和时区：

```php
$elapsed = $request->date('elapsed', '!H:i', 'Europe/Madrid');
```

如果输入值存在但格式不合法，会抛出 `InvalidArgumentException`；因此建议在调用 `date` 方法之前先校验输入。

#### 获取时间间隔输入值

可以使用 `interval` 方法把包含时长（duration）的输入值作为 `CarbonInterval` 实例获取。如果请求中没有给定名字的输入值，将返回 `null`：

```php
$duration = $request->interval('duration');
```

如果输入值是数字，可以把单位作为第二个参数传入。单位可以是 `second`、`minute` 或 `day` 等字符串，也可以是 `Carbon\Unit` 枚举实例：

```php
use Carbon\Unit;

$timeout = $request->interval('timeout', 'second');

$delay = $request->interval('delay', Unit::Minute);
```

如果输入值存在但格式不合法，会抛出 `InvalidArgumentException`；因此建议在调用 `interval` 方法之前先校验输入。

#### 获取枚举输入值

与 [PHP 枚举](https://www.php.net/manual/en/language.types.enumerations.php) 对应的输入值也可以从请求中获取。如果请求中没有给定名字的输入值，或者枚举没有与输入值匹配的标量值，则返回 `null`。`enum` 方法的第一个参数是输入值的名字，第二个参数是枚举类：

```php
use App\Enums\Status;

$status = $request->enum('status', Status::class);
```

你也可以提供一个默认值，在值缺失或不合法时返回它：

```php
$status = $request->enum('status', Status::class, Status::Pending);
```

如果输入值是对应某个 PHP 枚举的数组，可以使用 `enums` 方法把这些值以枚举实例数组的形式取出：

```php
use App\Enums\Product;

$products = $request->enums('products', Product::class);
```

#### 通过动态属性获取输入

你也可以通过 `Illuminate\Http\Request` 实例的动态属性访问用户输入。例如，如果你的应用表单中包含一个 `name` 字段，可以这样访问它的值：

```php
$name = $request->name;
```

在使用动态属性时，Laravel 会先在请求负载里查找该参数的值。如果不存在，则会在已匹配路由的参数中查找。

#### 获取输入数据的子集

如果需要取出输入数据的一个子集，可以使用 `only` 和 `except` 方法。这两个方法都接受一个 `array` 或一组动态参数：

```php
$input = $request->only(['username', 'password']);

$input = $request->only('username', 'password');

$input = $request->except(['credit_card']);

$input = $request->except('credit_card');
```

> [!WARNING]
> `only` 方法会返回你请求的、所有键/值对；但是它不会返回请求中本来不存在的键/值对。

### 输入存在性

可以使用 `has` 方法来判断某个值是否存在于请求中。如果请求中存在该值，`has` 方法会返回 `true`：

```php
if ($request->has('name')) {
    // ...
}
```

当传入一个数组时，`has` 方法会判断所有指定的值是否都存在：

```php
if ($request->has(['name', 'email'])) {
    // ...
}
```

`hasAny` 方法会在任意一个指定值存在时返回 `true`：

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

可以向 `whenHas` 方法传入第二个闭包，它会在指定的值不存在时被执行：

```php
$request->whenHas('name', function (string $input) {
    // "name" 值存在...
}, function () {
    // "name" 值不存在...
});
```

如果你希望判断某个值是否存在于请求中且不是空字符串，可以使用 `filled` 方法：

```php
if ($request->filled('name')) {
    // ...
}
```

如果你希望判断某个值是否缺失或为空字符串，可以使用 `isNotFilled` 方法：

```php
if ($request->isNotFilled('name')) {
    // ...
}
```

当传入一个数组时，`isNotFilled` 方法会判断所有指定的值是否都缺失或为空：

```php
if ($request->isNotFilled(['name', 'email'])) {
    // ...
}
```

`anyFilled` 方法会在任意一个指定的值不是空字符串时返回 `true`：

```php
if ($request->anyFilled(['name', 'email'])) {
    // ...
}
```

`whenFilled` 方法会在请求中存在某个值且该值不是空字符串时执行给定的闭包：

```php
$request->whenFilled('name', function (string $input) {
    // ...
});
```

可以向 `whenFilled` 方法传入第二个闭包，它会在指定的值不是"已填充"时被执行：

```php
$request->whenFilled('name', function (string $input) {
    // "name" 值已填充...
}, function () {
    // "name" 值未填充...
});
```

要判断某个键在请求中是否缺失，可以使用 `missing` 和 `whenMissing` 方法：

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

### 合并额外输入

有时你可能需要把额外的输入手动合并到请求已有的输入数据中。此时可以使用 `merge` 方法。如果请求中已存在某个给定的输入键，`merge` 方法提供的数据会覆盖它：

```php
$request->merge(['votes' => 0]);
```

`mergeIfMissing` 方法可以在请求中对应键不存在时把输入合并进去：

```php
$request->mergeIfMissing(['votes' => 0]);
```

### 旧输入

Laravel 允许你在下一次请求中使用上一次请求的输入。该特性在检测到校验错误、需要重新填充表单时尤其有用。不过，如果你正在使用 Laravel 自带的 [校验特性](/docs/{{version}}/validation)，通常无需直接使用这些 Session 输入闪存（flashing）方法，因为 Laravel 一些内置的校验设施会自动调用它们。

#### 把输入闪存到 Session

`Illuminate\Http\Request` 类的 `flash` 方法会把当前输入闪存到 [会话](/docs/{{version}}/session) 中，使其在用户的下一次请求中可用：

```php
$request->flash();
```

你也可以使用 `flashOnly` 和 `flashExcept` 方法把请求数据的子集闪存到会话中。这些方法在避免把密码等敏感信息写入 Session 时很有用：

```php
$request->flashOnly(['username', 'email']);

$request->flashExcept('password');
```

#### 闪存输入并重定向

由于你常常希望把输入闪存到会话后跳转到上一个页面，因此可以使用 `withInput` 方法把输入闪存链到重定向操作上：

```php
return redirect('/form')->withInput();

return redirect()->route('user.create')->withInput();

return redirect('/form')->withInput(
    $request->except('password')
);
```

#### 获取旧输入

要获取上一次请求闪存的输入，需要在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法会从 [会话](/docs/{{version}}/session) 中取出上一次的输入数据：

```php
$username = $request->old('username');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade) 中显示旧输入，使用 `old` 辅助函数重新填充表单会更方便。如果指定字段不存在旧输入，将返回 `null`：

```blade
<input type="text" name="username" value="{{ old('username') }}">
```

### Cookie

#### 从请求中获取 Cookie

由 Laravel 框架创建的所有 Cookie 都会被加密并用认证码签名，因此如果 Cookie 被客户端修改过，Laravel 会认为它们无效。要从请求中获取 Cookie 值，可以使用 `Illuminate\Http\Request` 实例上的 `cookie` 方法：

```php
$value = $request->cookie('name');
```

### 输入的修剪与规范化

默认情况下，Laravel 会把 `Illuminate\Foundation\Http\Middleware\TrimStrings` 和 `Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` 这两个中间件包含在应用的全局中间件栈中。这两个中间件会自动对请求中的所有字符串字段进行修剪，并把任何空字符串字段转换为 `null`。这样一来，你就不必在路由和控制器里额外操心这些规范化的问题。

#### 禁用输入规范化

如果希望对所有请求禁用该行为，可以在应用 `bootstrap/app.php` 文件中通过 `$middleware->remove` 方法把这两个中间件从中间件栈中移除：

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

如果只想对应用的某一部分请求禁用字符串修剪和空字符串转换，可以在应用 `bootstrap/app.php` 文件中使用中间件的 `trimStrings` 和 `convertEmptyStringsToNull` 方法。这两个方法都接收一个闭包数组，闭包应返回 `true` 或 `false` 表示是否跳过输入规范化：

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

## 文件

### 获取上传的文件

可以使用 `file` 方法或动态属性从 `Illuminate\Http\Request` 实例中获取上传的文件。`file` 方法返回一个 `Illuminate\Http\UploadedFile` 类的实例，该类继承自 PHP 的 `SplFileInfo`，并提供了多种与文件交互的方法：

```php
$file = $request->file('photo');

$file = $request->photo;
```

你可以使用 `hasFile` 方法判断请求中是否存在某个文件：

```php
if ($request->hasFile('photo')) {
    // ...
}
```

如果上传的文件是一个需要在存储前进行处理的图片，可以使用 `image` 方法获取一个 `Illuminate\Image\Image` 实例；如果该文件不存在，则返回 `null`：

```php
$image = $request->image('photo');
```

关于处理图片的更多细节，请参阅完整的 [图片处理文档](/docs/{{version}}/images)。

#### 校验上传是否成功

除了判断文件是否存在之外，你还可以通过 `isValid` 方法验证文件上传没有出现问题：

```php
if ($request->file('photo')->isValid()) {
    // ...
}
```

#### 文件路径与扩展名

`UploadedFile` 类还提供了访问文件完整路径和扩展名的方法。`extension` 方法会尝试基于文件内容猜测扩展名。这个扩展名可能与客户端提供的扩展名不同：

```php
$path = $request->photo->path();

$extension = $request->photo->extension();
```

#### 其它文件方法

`UploadedFile` 实例还有许多其它方法可用。请查阅 [该类的 API 文档](https://github.com/symfony/symfony/blob/6.0/src/Symfony/Component/HttpFoundation/File/UploadedFile.php) 以了解这些方法的更多信息。

### 存储上传的文件

要存储一个上传的文件，通常会使用你配置好的某个 [文件系统](/docs/{{version}}/filesystem)。`UploadedFile` 类有一个 `store` 方法，它会把上传的文件移动到你的一块磁盘上，磁盘可以是本地文件系统的某个位置，也可以是像 Amazon S3 这样的云存储位置。

`store` 方法接收相对于文件系统根目录的存储路径作为参数。该路径不应该包含文件名，因为会自动生成一个唯一 ID 作为文件名。

`store` 方法还可以接收一个可选的第二个参数，用来指定应该用来存储文件的磁盘名。该方法会返回文件相对于磁盘根目录的路径：

```php
$path = $request->photo->store('images');

$path = $request->photo->store('images', 's3');
```

如果你不想自动生成文件名，可以使用 `storeAs` 方法，它的参数依次为路径、文件名和磁盘名：

```php
$path = $request->photo->storeAs('images', 'filename.jpg');

$path = $request->photo->storeAs('images', 'filename.jpg', 's3');
```

> [!NOTE]
> 关于 Laravel 中文件存储的更多信息，请参阅完整的 [文件存储文档](/docs/{{version}}/filesystem)。

## 配置受信代理

当你的应用部署在会终止 TLS/SSL 证书的负载均衡器后面时，你可能会发现使用 `url` 辅助函数时，应用有时不会生成 HTTPS 链接。这通常是因为你的应用是通过负载均衡器在 80 端口接收流量，它并不知道应该生成安全的链接。

要解决此问题，你可以启用 Laravel 应用中自带的 `Illuminate\Http\Middleware\TrustProxies` 中间件，从而让你能快速自定义应用应当信任的负载均衡器或代理。受信代理应当通过应用 `bootstrap/app.php` 文件中的 `trustProxies` 中间件方法来指定：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: [
        '192.168.1.1',
        '10.0.0.0/8',
    ]);
})
```

除了配置受信代理，还可以配置应当信任的代理头：

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
> 如果你正在使用 AWS Elastic Load Balancing，那么 `headers` 的值应该设为 `Request::HEADER_X_FORWARDED_AWS_ELB`。如果负载均衡器使用的是 [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239#section-4) 中的标准 `Forwarded` 头，那么 `headers` 的值应该设为 `Request::HEADER_FORWARDED`。关于 `headers` 值中可以使用的常量，请参考 Symfony 关于 [信任代理](https://symfony.com/doc/current/deployment/proxies.html) 的文档。

#### 信任所有代理

如果你正在使用 Amazon AWS 或其它"云"负载均衡器提供商，可能并不清楚实际负载均衡器的 IP 地址。这种情况下，可以使用 `*` 来信任所有代理：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

## 配置受信主机

默认情况下，Laravel 会响应它收到的所有请求，而不去检查 HTTP 请求 `Host` 头的内容。此外，在 Web 请求期间生成应用的绝对 URL 时，会使用 `Host` 头的值。

通常，你应当配置你的 Web 服务器（比如 Nginx 或 Apache），只把与某个给定主机名匹配的请求转发给应用。不过，如果你无法直接定制 Web 服务器，且需要让 Laravel 只响应特定的主机名，那么可以为应用启用 `Illuminate\Http\Middleware\TrustHosts` 中间件。

要启用 `TrustHosts` 中间件，应当在应用 `bootstrap/app.php` 文件中调用 `trustHosts` 中间件方法。通过该方法的 `at` 参数，你可以指定应用应该响应的主机名字符串。该主机名字符串被视为正则表达式。其它 `Host` 头的进来请求会被拒绝：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$']);
})
```

默认情况下，来自应用 URL 子域的请求也会被自动信任。如果你希望禁用该行为，可以使用 `subdomains` 参数：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: ['^laravel\.test$'], subdomains: false);
})
```

如果你需要访问应用的配置文件或数据库以确定受信主机，可以给 `at` 参数提供一个闭包：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustHosts(at: fn () => config('app.trusted_hosts'));
})
```
