# 验证

- [简介](#introduction)
- [验证快速上手](#validation-quickstart)
    - [定义路由](#quick-defining-the-routes)
    - [创建控制器](#quick-creating-the-controller)
    - [编写验证逻辑](#quick-writing-the-validation-logic)
    - [显示验证错误](#quick-displaying-the-validation-errors)
    - [重新填充表单](#repopulating-forms)
    - [关于可选字段的说明](#a-note-on-optional-fields)
    - [验证错误响应格式](#validation-error-response-format)
- [表单请求验证](#form-request-validation)
    - [创建表单请求](#creating-form-requests)
    - [授权表单请求](#authorizing-form-requests)
    - [自定义错误消息](#customizing-the-error-messages)
    - [为验证准备输入](#preparing-input-for-validation)
- [手动创建验证器](#manually-creating-validators)
    - [自动重定向](#automatic-redirection)
    - [命名错误包](#named-error-bags)
    - [自定义错误消息](#manual-customizing-the-error-messages)
    - [执行额外验证](#performing-additional-validation)
- [使用已验证的输入](#working-with-validated-input)
- [使用错误消息](#working-with-error-messages)
    - [在语言文件中指定自定义消息](#specifying-custom-messages-in-language-files)
    - [在语言文件中指定属性](#specifying-attribute-in-language-files)
    - [在语言文件中指定值](#specifying-values-in-language-files)
- [可用的验证规则](#available-validation-rules)
- [条件式添加规则](#conditionally-adding-rules)
- [验证数组](#validating-arrays)
    - [验证嵌套数组输入](#validating-nested-array-input)
    - [错误消息的索引与位置](#error-message-indexes-and-positions)
- [验证文件](#validating-files)
- [验证密码](#validating-passwords)
- [自定义验证规则](#custom-validation-rules)
    - [使用规则对象](#using-rule-objects)
    - [使用闭包](#using-closures)
    - [隐式规则](#implicit-rules)

<a name="introduction"></a>
## 简介

Laravel 提供了几种不同的方式来验证应用的传入数据。最常见的做法是使用所有传入 HTTP 请求都提供的 `validate` 方法。不过，我们也会讨论其它验证方式。

Laravel 内置了种类繁多的便捷验证规则，你可以把它们应用到数据上，甚至能够验证某个值在给定数据库表中是否唯一。我们会详细介绍每一条验证规则，让你熟悉 Laravel 的全部验证功能。

<a name="validation-quickstart"></a>
## 验证快速上手

要了解 Laravel 强大的验证功能，我们来看一个完整示例：验证表单并把错误消息显示回给用户。通过阅读这份高层概览，你将对如何用 Laravel 验证传入的请求数据形成整体理解：

<a name="quick-defining-the-routes"></a>
### 定义路由

首先，假设我们已经在 `routes/web.php` 文件中定义了如下路由：

```php
use App\Http\Controllers\PostController;

Route::get('/post/create', [PostController::class, 'create']);
Route::post('/post', [PostController::class, 'store']);
```

`GET` 路由会显示一个供用户创建新博客文章的表单，而 `POST` 路由会把新的博客文章存入数据库。

<a name="quick-creating-the-controller"></a>
### 创建控制器

接下来，我们来看一个处理发往这些路由的请求的简单控制器。暂时让 `store` 方法保持为空：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PostController extends Controller
{
    /**
     * 显示用于创建新博客文章的表单。
     */
    public function create(): View
    {
        return view('post.create');
    }

    /**
     * 存储一篇新的博客文章。
     */
    public function store(Request $request): RedirectResponse
    {
        // 验证并存储这篇博客文章……

        $post = /** ... */

        return to_route('post.show', ['post' => $post->id]);
    }
}
```

<a name="quick-writing-the-validation-logic"></a>
### 编写验证逻辑

现在我们可以在 `store` 方法中填入验证新博客文章的逻辑。为此，我们将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，你的代码将继续正常执行；但如果验证失败，则会抛出 `Illuminate\Validation\ValidationException` 异常，并自动向用户返回相应的错误响应。

如果验证在传统 HTTP 请求期间失败，框架会生成一个指向上一个 URL 的重定向响应。如果传入请求是 XHR 请求，则会返回一个[包含验证错误消息的 JSON 响应](#validation-error-response-format)。

想更深入地了解 `validate` 方法，我们回到 `store` 方法：

```php
/**
 * 存储一篇新的博客文章。
 */
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ]);

    // 博客文章验证通过……

    return redirect('/posts');
}
```

如你所见，验证规则被传入了 `validate` 方法。别担心，所有可用的验证规则都已有[文档](#available-validation-rules)。同样地，如果验证失败，相应的响应会自动生成；如果验证通过，我们的控制器将继续正常执行。

此外，你也可以把验证规则指定为规则数组，而不是单个以 `|` 分隔的字符串：

```php
$validatedData = $request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

另外，你还可以使用 `validateWithBag` 方法验证请求，并把错误消息存入[命名错误包](#named-error-bags)：

```php
$validatedData = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

<a name="stopping-on-first-validation-failure"></a>
#### 在首次验证失败时停止

有时你可能希望某个属性在首次验证失败后就不再继续执行后续验证规则。为此，可以为该属性指定 `bail` 规则：

```php
$request->validate([
    'title' => 'bail|required|unique:posts|max:255',
    'body' => 'required',
]);
```

在这个例子中，如果 `title` 属性上的 `unique` 规则失败，那么 `max` 规则就不会再被检查。规则会按照被指定的顺序依次验证。

<a name="a-note-on-nested-attributes"></a>
#### 关于嵌套属性的说明

如果传入的 HTTP 请求包含 "嵌套" 字段数据，你可以在验证规则中使用 "点" 语法来指定这些字段：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'author.name' => 'required',
    'author.description' => 'required',
]);
```

另一方面，如果你的字段名中包含字面上的句点，可以用反斜杠转义该句点，明确阻止它被当作 "点" 语法解析：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'v1\.0' => 'required',
]);
```

<a name="quick-displaying-the-validation-errors"></a>
### 显示验证错误

那么，如果传入的请求字段没有通过给定的验证规则该怎么办？如前所述，Laravel 会自动把用户重定向回上一个位置。此外，所有验证错误和[请求输入](/docs/{{version}}/requests#retrieving-old-input)都会自动[闪存到会话](/docs/{{version}}/session#flash-data)中。

`Illuminate\View\Middleware\ShareErrorsFromSession` 中间件会与应用的所有视图共享一个 `$errors` 变量，该中间件由 `web` 中间件组提供。当这个中间件生效时，视图 中始终可以访问 `$errors` 变量，因此你可以放心假定 `$errors` 变量总是已定义且可安全使用。`$errors` 变量是 `Illuminate\Support\MessageBag` 的实例。关于如何使用该对象，请参阅它的[文档](#working-with-error-messages)。

于是，在我们的例子中，验证失败时用户会被重定向到控制器的 `create` 方法，我们便可以在视图中显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<h1>Create Post</h1>

@if ($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<!-- 创建文章表单 -->
```

<a name="quick-customizing-the-error-messages"></a>
#### 自定义错误消息

Laravel 内置的每条验证规则都有一条错误消息，位于你应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以指示 Laravel 使用 `lang:publish` Artisan 命令创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则对应的翻译条目。你可以根据应用需求自由修改这些消息。

此外，你还可以把该文件复制到另一个语言目录，以翻译应用所用语言的消息。如需了解更多关于 Laravel 本地化的内容，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="quick-xhr-requests-and-validation"></a>
#### XHR 请求与验证

在这个例子中，我们使用传统表单向应用发送数据。然而，许多应用会从 JavaScript 驱动的前端接收 XHR 请求。在 XHR 请求期间使用 `validate` 方法时，Laravel 不会生成重定向响应，而是生成一个[包含全部验证错误的 JSON 响应](#validation-error-response-format)。该 JSON 响应会带有 422 HTTP 状态码一起发送。

<a name="the-at-error-directive"></a>
#### `@error` 指令

你可以使用 `@error` [Blade](/docs/{{version}}/blade) 指令快速判断某个属性是否存在验证错误消息。在 `@error` 指令内部，你可以输出 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">Post Title</label>

<input
    id="title"
    type="text"
    name="title"
    class="@error('title') is-invalid @enderror"
/>

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

如果你在使用[命名错误包](#named-error-bags)，可以把错误包名称作为 `@error` 指令的第二个参数传入：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

<a name="repopulating-forms"></a>
### 重新填充表单

当 Laravel 因验证错误而生成重定向响应时，框架会自动把请求的所有输入[闪存到会话](/docs/{{version}}/session#flash-data)中。这样一来，你就可以在下次请求中便捷地访问这些输入，并重新填充用户尝试提交的表单。

要获取上一次请求闪存的输入，请在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法会从[会话](/docs/{{version}}/session)中取出先前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，用 `old` 辅助函数重新填充表单会更方便。如果给定字段不存在旧输入，将返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

<a name="a-note-on-optional-fields"></a>
### 关于可选字段的说明

默认情况下，Laravel 在应用的全局中间件栈中包含 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。因此，如果你不希望验证器把 `null` 值视为无效，就需要把"可选"的请求字段标记为 `nullable`。例如：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
    'publish_at' => 'nullable|date',
]);
```

在这个例子中，我们指定 `publish_at` 字段可以是 `null`，也可以是有效的日期表示。如果没有在规则定义中添加 `nullable` 修饰符，验证器会把 `null` 视为无效的日期。

<a name="validation-error-response-format"></a>
### 验证错误响应格式

当你的应用抛出 `Illuminate\Validation\ValidationException` 异常，而传入的 HTTP 请求期望得到 JSON 响应时，Laravel 会自动为你格式化错误消息，并返回一个 `422 Unprocessable Entity` HTTP 响应。

下面你可以查看验证错误对应的 JSON 响应格式示例。请注意，嵌套的错误键会被扁平化为 "点" 记号格式：

```json
{
    "message": "The team name must be a string. (and 4 more errors)",
    "errors": {
        "team_name": [
            "The team name must be a string.",
            "The team name must be at least 1 characters."
        ],
        "authorization.role": [
            "The selected authorization.role is invalid."
        ],
        "users.0.email": [
            "The users.0.email field is required."
        ],
        "users.2.email": [
            "The users.2.email must be a valid email address."
        ]
    }
}
```

<a name="form-request-validation"></a>
## 表单请求验证

<a name="creating-form-requests"></a>
### 创建表单请求

对于更复杂的验证场景，你可能希望创建一个"表单请求"。表单请求是封装了自身验证与授权逻辑的自定义请求类。要创建表单请求类，可以使用 `make:request` Artisan 命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类会被放在 `app/Http/Requests` 目录下。如果该目录不存在，运行 `make:request` 命令时会自动创建。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

你可能已经猜到了，`authorize` 方法负责确定当前已认证的用户是否可以执行该请求所代表的动作，而 `rules` 方法返回应该应用于请求数据的验证规则：

```php
/**
 * 获取适用于该请求的验证规则。
 *
 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
 */
public function rules(): array
{
    return [
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ];
}
```

> [!NOTE]
> 你可以在 `rules` 方法的签名中类型提示所需的任何依赖项。它们会通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)自动解析。

那么，验证规则是如何被求值的？你只需要在控制器方法上类型提示该请求即可。传入的表单请求会在控制器方法被调用之前完成验证，这意味着你无需在控制器中塞入任何验证逻辑：

```php
/**
 * 存储一篇新的博客文章。
 */
public function store(StorePostRequest $request): RedirectResponse
{
    // 传入请求验证通过……

    // 获取已验证的输入数据……
    $validated = $request->validated();

    // 获取已验证输入数据的一部分……
    $validated = $request->safe()->only(['name', 'email']);
    $validated = $request->safe()->except(['name', 'email']);

    // 存储这篇博客文章……

    return redirect('/posts');
}
```

如果验证失败，框架会生成一个重定向响应，把用户送回上一个位置。错误也会被闪存到会话中，以便展示。如果请求是 XHR 请求，则会向用户返回一个带 422 状态码的 HTTP 响应，其中包含[验证错误的 JSON 表示](#validation-error-response-format)。

> [!NOTE]
> 想为基于 Inertia 的 Laravel 前端添加实时表单请求验证？请查看 [Laravel Precognition](/docs/{{version}}/precognition)。

<a name="performing-additional-validation-on-form-requests"></a>
#### 执行额外的验证

有时你需要在初次验证完成之后执行额外的验证。可以使用表单请求的 `after` 方法来实现。

`after` 方法应当返回一个 callable 或闭包数组，它们会在验证完成后被调用。传入的 callable 会收到一个 `Illuminate\Validation\Validator` 实例，让你可以按需抛出额外的错误消息：

```php
use Illuminate\Validation\Validator;

/**
 * 获取该请求的 "after" 验证回调。
 */
public function after(): array
{
    return [
        function (Validator $validator) {
            if ($this->somethingElseIsInvalid()) {
                $validator->errors()->add(
                    'field',
                    'Something is wrong with this field!'
                );
            }
        }
    ];
}
```

如前所述，`after` 方法返回的数组也可以包含可调用类。这些类的 `__invoke` 方法会收到一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;
use Illuminate\Validation\Validator;

/**
 * 获取该请求的 "after" 验证回调。
 */
public function after(): array
{
    return [
        new ValidateUserStatus,
        new ValidateShippingTime,
        function (Validator $validator) {
            //
        }
    ];
}
```

<a name="request-stopping-on-first-validation-rule-failure"></a>
#### 在首次验证失败时停止

通过在请求类上添加 `stopOnFirstFailure` 属性，可以让验证器知道：一旦出现一次验证失败，就应停止验证所有属性：

```php
/**
 * 指示验证器是否应在首次规则失败时停止。
 *
 * @var bool
 */
protected $stopOnFirstFailure = true;
```

<a name="customizing-the-redirect-location"></a>
#### 自定义重定向位置

当表单请求验证失败时，框架会生成一个重定向响应，把用户送回上一个位置。不过你可以自由自定义这一行为。为此，在你的表单请求上定义一个 `$redirect` 属性：

```php
/**
 * 验证失败时应将用户重定向到的 URI。
 *
 * @var string
 */
protected $redirect = '/dashboard';
```

或者，如果你希望把用户重定向到某个命名路由，可以改为定义一个 `$redirectRoute` 属性：

```php
/**
 * 验证失败时应将用户重定向到的路由。
 *
 * @var string
 */
protected $redirectRoute = 'dashboard';
```

<a name="authorizing-form-requests"></a>
### 授权表单请求

表单请求类还包含一个 `authorize` 方法。在该方法中，你可以确定已认证的用户是否确实有权更新某个资源。例如，你可以判断用户是否确实拥有他尝试更新的那条博客评论。多数情况下，你会在该方法中与[授权门和策略](/docs/{{version}}/authorization)进行交互：

```php
use App\Models\Comment;

/**
 * 确定用户是否有权发起此请求。
 */
public function authorize(): bool
{
    $comment = Comment::find($this->route('comment'));

    return $comment && $this->user()->can('update', $comment);
}
```

由于所有表单请求都继承自 Laravel 的基础请求类，我们可以使用 `user` 方法访问当前已认证的用户。同时请注意上面示例中对 `route` 方法的调用。该方法让你可以访问当前所调用路由上定义的 URI 参数，例如下面示例中的 `{comment}` 参数：

```php
Route::post('/comment/{comment}');
```

因此，如果你的应用启用了[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，把解析出的模型作为请求的属性来访问，代码还可以写得更简洁：

```php
return $this->user()->can('update', $this->comment);
```

如果 `authorize` 方法返回 `false`，框架会自动返回一个带 403 状态码的 HTTP 响应，并且你的控制器方法不会执行。

如果你打算在应用的其它位置处理该请求的授权逻辑，可以完全移除 `authorize` 方法，或者简单地返回 `true`：

```php
/**
 * 确定用户是否有权发起此请求。
 */
public function authorize(): bool
{
    return true;
}
```

> [!NOTE]
> 你可以在 `authorize` 方法的签名中类型提示所需的任何依赖项。它们会通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)自动解析。

<a name="customizing-the-error-messages"></a>
### 自定义错误消息

你可以通过重写 `messages` 方法来自定义表单请求所使用的错误消息。该方法应当返回一个属性 / 规则对及其对应错误消息的数组：

```php
/**
 * 获取已定义验证规则的错误消息。
 *
 * @return array<string, string>
 */
public function messages(): array
{
    return [
        'title.required' => 'A title is required',
        'body.required' => 'A message is required',
    ];
}
```

<a name="customizing-the-validation-attributes"></a>
#### 自定义验证属性

Laravel 许多内置验证规则的错误消息中都包含 `:attribute` 占位符。如果你希望把验证消息中的 `:attribute` 占位符替换为自定义的属性名，可以通过重写 `attributes` 方法来指定自定义名称。该方法应当返回一个属性 / 名称对数组：

```php
/**
 * 获取验证器错误的自定义属性。
 *
 * @return array<string, string>
 */
public function attributes(): array
{
    return [
        'email' => 'email address',
    ];
}
```

<a name="preparing-input-for-validation"></a>
### 为验证准备输入

如果你需要在应用验证规则之前准备或清理请求中的数据，可以使用 `prepareForValidation` 方法：

```php
use Illuminate\Support\Str;

/**
 * 为验证准备数据。
 */
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->slug),
    ]);
}
```

同样地，如果你需要在验证完成之后对请求数据做规范化处理，可以使用 `passedValidation` 方法：

```php
/**
 * 处理已通过的验证尝试。
 */
protected function passedValidation(): void
{
    $this->replace(['name' => 'Taylor']);
}
```

<a name="manually-creating-validators"></a>
## 手动创建验证器

如果你不想在请求上使用 `validate` 方法，可以使用 `Validator` [Facade](/docs/{{version}}/facades) 手动创建验证器实例。该 Facade 上的 `make` 方法会生成一个新的验证器实例：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    /**
     * 存储一篇新的博客文章。
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|unique:posts|max:255',
            'body' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect('/post/create')
                ->withErrors($validator)
                ->withInput();
        }

        // 获取已验证的输入……
        $validated = $validator->validated();

        // 获取已验证输入的一部分……
        $validated = $validator->safe()->only(['name', 'email']);
        $validated = $validator->safe()->except(['name', 'email']);

        // 存储这篇博客文章……

        return redirect('/posts');
    }
}
```

传给 `make` 方法的第一个参数是待验证的数据。第二个参数是应该应用于该数据的验证规则数组。

在确定请求验证是否失败之后，你可以使用 `withErrors` 方法把错误消息闪存到会话中。使用该方法时，重定向后 `$errors` 变量会自动与你的视图共享，让你可以轻松地把它们显示回给用户。`withErrors` 方法接受一个验证器、一个 `MessageBag` 或一个 PHP `array`。

#### 在首次验证失败时停止

`stopOnFirstFailure` 方法会让验证器知道：一旦出现一次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="automatic-redirection"></a>
### 自动重定向

如果你希望手动创建验证器实例，同时仍能利用 HTTP 请求的 `validate` 方法所提供的自动重定向，可以在已有的验证器实例上调用 `validate` 方法。如果验证失败，用户会自动被重定向；在 XHR 请求的情况下则会返回[JSON 响应](#validation-error-response-format)：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validate();
```

如果验证失败，可以使用 `validateWithBag` 方法把错误消息存入[命名错误包](#named-error-bags)：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validateWithBag('post');
```

<a name="named-error-bags"></a>
### 命名错误包

如果单个页面上有多个表单，你可能希望为包含验证错误的 `MessageBag` 命名，从而可以单独获取某个表单的错误消息。为此，把一个名称作为第二个参数传给 `withErrors`：

```php
return redirect('/register')->withErrors($validator, 'login');
```

随后，你就可以从 `$errors` 变量中访问这个命名的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

<a name="manual-customizing-the-error-messages"></a>
### 自定义错误消息

如果需要，你可以提供自定义错误消息，让验证器实例使用它们替代 Laravel 提供的默认错误消息。指定自定义消息有多种方式。首先，可以把自定义消息作为第三个参数传给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages = [
    'required' => 'The :attribute field is required.',
]);
```

在这个例子中，`:attribute` 占位符会被替换为待验证字段的实际名称。你也可以在验证消息中使用其它占位符。例如：

```php
$messages = [
    'same' => 'The :attribute and :other must match.',
    'size' => 'The :attribute must be exactly :size.',
    'between' => 'The :attribute value :input is not between :min - :max.',
    'in' => 'The :attribute must be one of the following types: :values',
];
```

<a name="specifying-a-custom-message-for-a-given-attribute"></a>
#### 为指定属性指定自定义消息

有时你可能只想为某个特定属性指定自定义错误消息，可以使用 "点" 记号来实现。先指定属性名称，然后是规则：

```php
$messages = [
    'email.required' => 'We need to know your email address!',
];
```

<a name="specifying-custom-attribute-values"></a>
#### 指定自定义属性值

Laravel 许多内置错误消息中都包含 `:attribute` 占位符，它会被替换为待验证字段或属性的名称。如果想为特定字段自定义用于替换这些占位符的值，可以把一个自定义属性数组作为第四个参数传给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages, [
    'email' => 'email address',
]);
```

<a name="performing-additional-validation"></a>
### 执行额外的验证

有时你需要在初次验证完成之后执行额外的验证。可以使用验证器的 `after` 方法来实现。`after` 方法接受一个闭包或一个 callable 数组，它们会在验证完成后被调用。传入的 callable 会收到一个 `Illuminate\Validation\Validator` 实例，让你可以按需抛出额外的错误消息：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make(/* ... */);

$validator->after(function ($validator) {
    if ($this->somethingElseIsInvalid()) {
        $validator->errors()->add(
            'field', 'Something is wrong with this field!'
        );
    }
});

if ($validator->fails()) {
    // ...
}
```

如前所述，`after` 方法还接受一个 callable 数组。如果你的 "验证后" 逻辑封装在可调用类中，这一点会尤为方便：这些类会通过各自的 `__invoke` 方法收到一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;

$validator->after([
    new ValidateUserStatus,
    new ValidateShippingTime,
    function ($validator) {
        // ...
    },
]);
```

<a name="working-with-validated-input"></a>
## 使用已验证的输入

在使用表单请求或手动创建的验证器实例验证传入请求数据之后，你可能希望取出真正经过验证的那部分传入请求数据。这可以通过多种方式实现。首先，你可以在表单请求或验证器实例上调用 `validated` 方法。该方法返回一个由已验证数据组成的数组：

```php
$validated = $request->validated();

$validated = $validator->validated();
```

或者，你可以在表单请求或验证器实例上调用 `safe` 方法。该方法返回一个 `Illuminate\Support\ValidatedInput` 实例。该对象提供了 `only`、`except` 和 `all` 方法，用于取出已验证数据的子集或完整的已验证数据数组：

```php
$validated = $request->safe()->only(['name', 'email']);

$validated = $request->safe()->except(['name', 'email']);

$validated = $request->safe()->all();
```

此外，`Illuminate\Support\ValidatedInput` 实例还可以被遍历，并像数组一样访问：

```php
// 已验证的数据可以迭代……
foreach ($request->safe() as $key => $value) {
    // ...
}

// 已验证的数据可以按数组访问……
$validated = $request->safe();

$email = $validated['email'];
```

如果你希望向已验证数据中添加额外字段，可以调用 `merge` 方法：

```php
$validated = $request->safe()->merge(['name' => 'Taylor Otwell']);
```

如果你希望以[集合](/docs/{{version}}/collections)实例的形式取出已验证数据，可以调用 `collect` 方法：

```php
$collection = $request->safe()->collect();
```

<a name="working-with-error-messages"></a>
## 使用错误消息

在 `Validator` 实例上调用 `errors` 方法后，你会得到一个 `Illuminate\Support\MessageBag` 实例，它提供了多种便捷方法用于处理错误消息。自动提供给所有视图的 `$errors` 变量也是 `MessageBag` 类的实例。

<a name="retrieving-the-first-error-message-for-a-field"></a>
#### 获取某个字段的第一条错误消息

要获取某个给定字段的第一条错误消息，可以使用 `first` 方法：

```php
$errors = $validator->errors();

echo $errors->first('email');
```

<a name="retrieving-all-error-messages-for-a-field"></a>
#### 获取某个字段的所有错误消息

如果你需要获取某个给定字段的全部消息数组，可以使用 `get` 方法：

```php
foreach ($errors->get('email') as $message) {
    // ...
}
```

如果你正在验证一个数组表单字段，可以使用 `*` 字符取出每个数组元素的全部消息：

```php
foreach ($errors->get('attachments.*') as $message) {
    // ...
}
```

<a name="retrieving-all-error-messages-for-all-fields"></a>
#### 获取所有字段的所有错误消息

要获取所有字段的全部消息数组，可以使用 `all` 方法：

```php
foreach ($errors->all() as $message) {
    // ...
}
```

<a name="determining-if-messages-exist-for-a-field"></a>
#### 判断某个字段是否存在错误消息

可以使用 `has` 方法判断某个给定字段是否存在错误消息：

```php
if ($errors->has('email')) {
    // ...
}
```

<a name="specifying-custom-messages-in-language-files"></a>
### 在语言文件中指定自定义消息

Laravel 内置的每条验证规则都有一条错误消息，位于你应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以指示 Laravel 使用 `lang:publish` Artisan 命令创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则对应的翻译条目。你可以根据应用需求自由修改这些消息。

此外，你还可以把该文件复制到另一个语言目录，以翻译应用所用语言的消息。如需了解更多关于 Laravel 本地化的内容，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="custom-messages-for-specific-attributes"></a>
#### 针对特定属性的自定义消息

你可以在应用的验证语言文件中，为指定的属性与规则组合自定义错误消息。为此，把消息自定义项添加到应用 `lang/xx/validation.php` 语言文件的 `custom` 数组中：

```php
'custom' => [
    'email' => [
        'required' => 'We need to know your email address!',
        'max' => 'Your email address is too long!'
    ],
],
```

<a name="specifying-attribute-in-language-files"></a>
### 在语言文件中指定属性

Laravel 许多内置错误消息中都包含 `:attribute` 占位符，它会被替换为待验证字段或属性的名称。如果你希望把验证消息中的 `:attribute` 部分替换为自定义值，可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名：

```php
'attributes' => [
    'email' => 'email address',
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="specifying-values-in-language-files"></a>
### 在语言文件中指定值

Laravel 某些内置验证规则的错误消息中含有 `:value` 占位符，它会被替换为请求属性的当前值。不过，你偶尔会希望把验证消息中的 `:value` 部分替换为该值的自定义表示形式。例如，考虑下面这条规则，它规定当 `payment_type` 的值为 `cc` 时信用卡号是必填的：

```php
Validator::make($request->all(), [
    'credit_card_number' => 'required_if:payment_type,cc'
]);
```

如果这条验证规则失败，会产生如下错误消息：

```none
The credit card number field is required when payment type is cc.
```

你可以在 `lang/xx/validation.php` 语言文件中定义一个 `values` 数组，从而指定对用户更友好的值表示，而不是把 `cc` 直接显示为支付类型：

```php
'values' => [
    'payment_type' => [
        'cc' => 'credit card'
    ],
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

定义该值之后，验证规则会产生如下错误消息：

```none
The credit card number field is required when payment type is credit card.
```

<a name="available-validation-rules"></a>
## 可用的验证规则

下面是所有可用验证规则的列表及其作用：

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

#### 布尔值

<div class="collection-method-list" markdown="1">

[Accepted](#rule-accepted)
[Accepted If](#rule-accepted-if)
[Boolean](#rule-boolean)
[Declined](#rule-declined)
[Declined If](#rule-declined-if)

</div>

#### 字符串

<div class="collection-method-list" markdown="1">

[Active URL](#rule-active-url)
[Alpha](#rule-alpha)
[Alpha Dash](#rule-alpha-dash)
[Alpha Numeric](#rule-alpha-num)
[Ascii](#rule-ascii)
[Confirmed](#rule-confirmed)
[Current Password](#rule-current-password)
[Different](#rule-different)
[Doesnt Start With](#rule-doesnt-start-with)
[Doesnt End With](#rule-doesnt-end-with)
[Email](#rule-email)
[Ends With](#rule-ends-with)
[Enum](#rule-enum)
[Hex Color](#rule-hex-color)
[In](#rule-in)
[IP Address](#rule-ip)
[JSON](#rule-json)
[Lowercase](#rule-lowercase)
[MAC Address](#rule-mac)
[Max](#rule-max)
[Min](#rule-min)
[Not In](#rule-not-in)
[Regular Expression](#rule-regex)
[Not Regular Expression](#rule-not-regex)
[Same](#rule-same)
[Size](#rule-size)
[Starts With](#rule-starts-with)
[String](#rule-string)
[Uppercase](#rule-uppercase)
[URL](#rule-url)
[ULID](#rule-ulid)
[UUID](#rule-uuid)

</div>

#### 数字

<div class="collection-method-list" markdown="1">

[Between](#rule-between)
[Decimal](#rule-decimal)
[Different](#rule-different)
[Digits](#rule-digits)
[Digits Between](#rule-digits-between)
[Greater Than](#rule-gt)
[Greater Than Or Equal](#rule-gte)
[Integer](#rule-integer)
[Less Than](#rule-lt)
[Less Than Or Equal](#rule-lte)
[Max](#rule-max)
[Max Digits](#rule-max-digits)
[Min](#rule-min)
[Min Digits](#rule-min-digits)
[Multiple Of](#rule-multiple-of)
[Numeric](#rule-numeric)
[Same](#rule-same)
[Size](#rule-size)

</div>

#### 数组

<div class="collection-method-list" markdown="1">

[Array](#rule-array)
[Between](#rule-between)
[Contains](#rule-contains)
[Distinct](#rule-distinct)
[In Array](#rule-in-array)
[List](#rule-list)
[Max](#rule-max)
[Min](#rule-min)
[Size](#rule-size)

</div>

#### 日期

<div class="collection-method-list" markdown="1">

[After](#rule-after)
[After Or Equal](#rule-after-or-equal)
[Before](#rule-before)
[Before Or Equal](#rule-before-or-equal)
[Date](#rule-date)
[Date Equals](#rule-date-equals)
[Date Format](#rule-date-format)
[Different](#rule-different)
[Timezone](#rule-timezone)

</div>

#### 文件

<div class="collection-method-list" markdown="1">

[Between](#rule-between)
[Dimensions](#rule-dimensions)
[Extensions](#rule-extensions)
[File](#rule-file)
[Image](#rule-image)
[Max](#rule-max)
[MIME Types](#rule-mimetypes)
[MIME Type By File Extension](#rule-mimes)
[Size](#rule-size)

</div>

#### 数据库

<div class="collection-method-list" markdown="1">

[Exists](#rule-exists)
[Unique](#rule-unique)

</div>

#### 工具

<div class="collection-method-list" markdown="1">

[Bail](#rule-bail)
[Exclude](#rule-exclude)
[Exclude If](#rule-exclude-if)
[Exclude Unless](#rule-exclude-unless)
[Exclude With](#rule-exclude-with)
[Exclude Without](#rule-exclude-without)
[Filled](#rule-filled)
[Missing](#rule-missing)
[Missing If](#rule-missing-if)
[Missing Unless](#rule-missing-unless)
[Missing With](#rule-missing-with)
[Missing With All](#rule-missing-with-all)
[Nullable](#rule-nullable)
[Present](#rule-present)
[Present If](#rule-present-if)
[Present Unless](#rule-present-unless)
[Present With](#rule-present-with)
[Present With All](#rule-present-with-all)
[Prohibited](#rule-prohibited)
[Prohibited If](#rule-prohibited-if)
[Prohibited Unless](#rule-prohibited-unless)
[Prohibits](#rule-prohibits)
[Required](#rule-required)
[Required If](#rule-required-if)
[Required If Accepted](#rule-required-if-accepted)
[Required If Declined](#rule-required-if-declined)
[Required Unless](#rule-required-unless)
[Required With](#rule-required-with)
[Required With All](#rule-required-with-all)
[Required Without](#rule-required-without)
[Required Without All](#rule-required-without-all)
[Required Array Keys](#rule-required-array-keys)
[Sometimes](#validating-when-present)

</div>

<a name="rule-accepted"></a>
#### accepted

待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。该规则适用于验证"服务条款"接受情况之类的字段。

<a name="rule-accepted-if"></a>
#### accepted_if:anotherfield,value,...

如果另一个待验证字段等于指定值，那么待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。该规则适用于验证"服务条款"接受情况之类的字段。

<a name="rule-active-url"></a>
#### active_url

待验证字段必须根据 PHP `dns_get_record` 函数拥有有效的 A 或 AAAA 记录。传入的 URL 会先通过 PHP `parse_url` 函数提取主机名，再传给 `dns_get_record`。

<a name="rule-after"></a>
#### after:_date_

待验证字段必须是给定日期之后的值。日期会传入 `strtotime` PHP 函数，从而转换为有效的 `DateTime` 实例：

```php
'start_date' => 'required|date|after:tomorrow'
```

除了把日期字符串交给 `strtotime` 求值之外，你还可以指定另一个字段来与该日期比较：

```php
'finish_date' => 'required|date|after:start_date'
```

为方便起见，可以把 `date` 规则构造器以链式写法用于构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->after(today()->addDays(7)),
],
```

`afterToday` 和 `todayOrAfter` 方法可以用链式写法分别表达"日期必须晚于今天"或"日期必须是今天或晚于今天"：

```php
'start_date' => [
    'required',
    Rule::date()->afterToday(),
],
```

<a name="rule-after-or-equal"></a>
#### after\_or\_equal:_date_

待验证字段必须是给定日期之后或等于该日期的值。更多信息请参阅 [`after`](#rule-after) 规则。

为方便起见，可以把 `date` 规则构造器以链式写法用于构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->afterOrEqual(today()->addDays(7)),
],
```

<a name="rule-alpha"></a>
#### alpha

待验证字段必须完全由 Unicode 字母字符组成，即包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 中。

如果要把该验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha:ascii',
```

<a name="rule-alpha-dash"></a>
#### alpha_dash

待验证字段必须完全由 Unicode 字母数字字符组成，即包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中，另外还允许 ASCII 短横线（`-`）和 ASCII 下划线（`_`）。

如果要把该验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_dash:ascii',
```

<a name="rule-alpha-num"></a>
#### alpha_num

待验证字段必须完全由 Unicode 字母数字字符组成，即包含在 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 和 [`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中。

如果要把该验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_num:ascii',
```

<a name="rule-array"></a>
#### array

待验证字段必须是一个 PHP `array`。

当向 `array` 规则提供额外的值时，输入数组中的每个键都必须出现在传给该规则的值列表中。在下面这个例子中，输入数组中的 `admin` 键是无效的，因为它不在传给 `array` 规则的值列表中：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => 'array:name,username',
]);
```

一般来说，你应当始终明确指定数组中允许出现的键。

<a name="rule-ascii"></a>
#### ascii

待验证字段必须完全由 7 位 ASCII 字符组成。

<a name="rule-bail"></a>
#### bail

在该字段首次验证失败后，停止对其执行后续验证规则。

`bail` 规则只会在遇到验证失败时停止验证某个特定字段，而 `stopOnFirstFailure` 方法会告知验证器：一旦出现一次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="rule-before"></a>
#### before:_date_

待验证字段必须是给定日期之前的值。日期会传入 PHP `strtotime` 函数，从而转换为有效的 `DateTime` 实例。此外，与 [`after`](#rule-after) 规则一样，可以把另一个待验证字段的名称作为 `date` 的值提供。

为方便起见，同样可以把 `date` 规则构造器以链式写法用于构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->before(today()->subDays(7)),
],
```

`beforeToday` 和 `todayOrBefore` 方法可以用链式写法分别表达"日期必须早于今天"或"日期必须是今天或早于今天"：

```php
'start_date' => [
    'required',
    Rule::date()->beforeToday(),
],
```

<a name="rule-before-or-equal"></a>
#### before\_or\_equal:_date_

待验证字段必须是给定日期之前或等于该日期的值。日期会传入 PHP `strtotime` 函数，从而转换为有效的 `DateTime` 实例。此外，与 [`after`](#rule-after) 规则一样，可以把另一个待验证字段的名称作为 `date` 的值提供。

为方便起见，同样可以把 `date` 规则构造器以链式写法用于构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->beforeOrEqual(today()->subDays(7)),
],
```

<a name="rule-between"></a>
#### between:_min_,_max_

待验证字段的大小必须介于给定的 _min_ 与 _max_ 之间（含两端）。字符串、数值、数组和文件的判定方式与 [`size`](#rule-size) 规则相同。

<a name="rule-boolean"></a>
#### boolean

待验证字段必须能被转换为布尔值。接受的输入包括 `true`、`false`、`1`、`0`、`"1"` 和 `"0"`。

<a name="rule-confirmed"></a>
#### confirmed

待验证字段必须存在一个匹配的 `{field}_confirmation` 字段。例如，如果待验证字段是 `password`，输入中就必须存在匹配的 `password_confirmation` 字段。

你也可以传入一个自定义的确认字段名称。例如，`confirmed:repeat_username` 会要求字段 `repeat_username` 与待验证字段匹配。

<a name="rule-contains"></a>
#### contains:_foo_,_bar_,...

待验证字段必须是一个数组，且包含给定的所有参数值。

<a name="rule-current-password"></a>
#### current_password

待验证字段必须与已认证用户的密码匹配。你可以用该规则的第一个参数指定一个[认证 guard](/docs/{{version}}/authentication)：

```php
'password' => 'current_password:api'
```

<a name="rule-date"></a>
#### date

待验证字段必须是符合 `strtotime` PHP 函数的有效非相对日期。

<a name="rule-date-equals"></a>
#### date_equals:_date_

待验证字段必须等于给定日期。日期会传入 PHP `strtotime` 函数，从而转换为有效的 `DateTime` 实例。

<a name="rule-date-format"></a>
#### date_format:_format_,...

待验证字段必须匹配给定的某个 _format_。验证某个字段时，你应当**只使用** `date` 或 `date_format` 其中之一，而不是两者都用。该验证规则支持 PHP [DateTime](https://www.php.net/manual/en/class.datetime.php) 类所支持的全部格式。

为方便起见，可以把 `date` 规则构造器以链式写法用于构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->format('Y-m-d'),
],
```

<a name="rule-decimal"></a>
#### decimal:_min_,_max_

待验证字段必须是数值，并且必须包含指定数量的小数位：

```php
// 必须恰好有两位小数（9.99）……
'price' => 'decimal:2'

// 必须有 2 到 4 位小数……
'price' => 'decimal:2,4'
```

<a name="rule-declined"></a>
#### declined

待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-declined-if"></a>
#### declined_if:anotherfield,value,...

如果另一个待验证字段等于指定值，那么待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-different"></a>
#### different:_field_

待验证字段的值必须与 _field_ 不同。

<a name="rule-digits"></a>
#### digits:_value_

待验证的整数必须恰好有 _value_ 位长度。

<a name="rule-digits-between"></a>
#### digits_between:_min_,_max_

待验证的整数长度必须介于给定的 _min_ 与 _max_ 之间。

<a name="rule-dimensions"></a>
#### dimensions

待验证文件必须是一张符合规则参数所指定尺寸约束的图片：

```php
'avatar' => 'dimensions:min_width=100,min_height=200'
```

可用的约束有：_min\_width_、_max\_width_、_min\_height_、_max\_height_、_width_、_height_、_ratio_。

_ratio_ 约束应表示为宽度除以高度，既可以用 `3/2` 这样的分数表示，也可以用 `1.5` 这样的浮点数表示：

```php
'avatar' => 'dimensions:ratio=3/2'
```

由于该规则需要多个参数，通常使用 `Rule::dimensions` 方法以链式写法构造规则会更方便：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'avatar' => [
        'required',
        Rule::dimensions()
            ->maxWidth(1000)
            ->maxHeight(500)
            ->ratio(3 / 2),
    ],
]);
```

<a name="rule-distinct"></a>
#### distinct

验证数组时，待验证字段不能包含任何重复值：

```php
'foo.*.id' => 'distinct'
```

`distinct` 默认使用宽松的变量比较。如果要使用严格比较，可以在验证规则定义中添加 `strict` 参数：

```php
'foo.*.id' => 'distinct:strict'
```

你可以在验证规则的参数中加入 `ignore_case`，让该规则忽略大小写差异：

```php
'foo.*.id' => 'distinct:ignore_case'
```

<a name="rule-doesnt-start-with"></a>
#### doesnt_start_with:_foo_,_bar_,...

待验证字段不能以给定值中的任何一个开头。

<a name="rule-doesnt-end-with"></a>
#### doesnt_end_with:_foo_,_bar_,...

待验证字段不能以给定值中的任何一个结尾。

<a name="rule-email"></a>
#### email

待验证字段必须符合电子邮件地址的格式。该验证规则使用 [`egulias/email-validator`](https://github.com/egulias/EmailValidator) 包来验证电子邮件地址。默认情况下会应用 `RFCValidation` 验证器，但你也可以应用其它验证风格：

```php
'email' => 'email:rfc,dns'
```

上面的例子会同时应用 `RFCValidation` 和 `DNSCheckValidation` 验证。下面是你可以应用的全部验证风格列表：

<div class="content-list" markdown="1">

- `rfc`: `RFCValidation` - 根据 RFC 5322 验证电子邮件地址。
- `strict`: `NoRFCWarningsValidation` - 根据 RFC 5322 验证电子邮件，拒绝结尾的句点或多个连续的句点。
- `dns`: `DNSCheckValidation` - 确保电子邮件地址的域名拥有有效的 MX 记录。
- `spoof`: `SpoofCheckValidation` - 确保电子邮件地址不包含同形异义字符或欺骗性的 Unicode 字符。
- `filter`: `FilterEmailValidation` - 根据 PHP 的 `filter_var` 函数确保电子邮件地址有效。
- `filter_unicode`: `FilterEmailValidation::unicode()` - 根据 PHP 的 `filter_var` 函数确保电子邮件地址有效，同时允许某些 Unicode 字符。

</div>

为方便起见，可以使用链式规则构造器来构建邮件验证规则：

```php
use Illuminate\Validation\Rule;

$request->validate([
    'email' => [
        'required',
        Rule::email()
            ->rfcCompliant(strict: false)
            ->validateMxRecord()
            ->preventSpoofing()
    ],
]);
```

> [!WARNING]
> `dns` 和 `spoof` 验证器需要 PHP `intl` 扩展。

<a name="rule-ends-with"></a>
#### ends_with:_foo_,_bar_,...

待验证字段必须以给定值中的任何一个结尾。

<a name="rule-enum"></a>
#### enum

`Enum` 是一条基于类的规则，用于验证待验证字段是否包含有效的枚举值。`Enum` 规则只接受枚举名称作为其构造函数参数。在验证基础类型值时，应向 `Enum` 规则提供一个支持值枚举：

```php
use App\Enums\ServerStatus;
use Illuminate\Validation\Rule;

$request->validate([
    'status' => [Rule::enum(ServerStatus::class)],
]);
```

`Enum` 规则的 `only` 和 `except` 方法可用于限定哪些枚举情形被视为有效：

```php
Rule::enum(ServerStatus::class)
    ->only([ServerStatus::Pending, ServerStatus::Active]);

Rule::enum(ServerStatus::class)
    ->except([ServerStatus::Pending, ServerStatus::Active]);
```

`when` 方法可用于按条件修改 `Enum` 规则：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

Rule::enum(ServerStatus::class)
    ->when(
        Auth::user()->isAdmin(),
        fn ($rule) => $rule->only(...),
        fn ($rule) => $rule->only(...),
    );
```

<a name="rule-exclude"></a>
#### exclude

待验证字段会从 `validate` 和 `validated` 方法返回的请求数据中被排除。

<a name="rule-exclude-if"></a>
#### exclude_if:_anotherfield_,_value_

如果 _anotherfield_ 字段等于 _value_，待验证字段会从 `validate` 和 `validated` 方法返回的请求数据中被排除。

如果需要复杂的条件排除逻辑，可以使用 `Rule::excludeIf` 方法。该方法接受一个布尔值或一个闭包。传入闭包时，该闭包应返回 `true` 或 `false`，以指示是否应排除待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::excludeIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::excludeIf(fn () => $request->user()->is_admin),
]);
```

<a name="rule-exclude-unless"></a>
#### exclude_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于 _value_，否则待验证字段会从 `validate` 和 `validated` 方法返回的请求数据中被排除。如果 _value_ 为 `null`（`exclude_unless:name,null`），那么除非比较字段为 `null` 或该比较字段在请求数据中缺失，否则待验证字段会被排除。

<a name="rule-exclude-with"></a>
#### exclude_with:_anotherfield_

如果 _anotherfield_ 字段存在，待验证字段会从 `validate` 和 `validated` 方法返回的请求数据中被排除。

<a name="rule-exclude-without"></a>
#### exclude_without:_anotherfield_

如果 _anotherfield_ 字段不存在，待验证字段会从 `validate` 和 `validated` 方法返回的请求数据中被排除。

<a name="rule-exists"></a>
#### exists:_table_,_column_

待验证字段必须存在于给定的数据库表中。

<a name="basic-usage-of-exists-rule"></a>
#### exists 规则的基本用法

```php
'state' => 'exists:states'
```

如果没有指定 `column` 选项，就会使用字段名。因此在这个例子中，该规则会验证 `states` 数据库表中是否存在一条记录，其 `state` 列的值与请求的 `state` 属性值匹配。

<a name="specifying-a-custom-column-name"></a>
#### 指定自定义列名

你可以把数据库列名放在数据库表名之后，明确指定该验证规则应当使用哪个数据库列：

```php
'state' => 'exists:states,abbreviation'
```

有时你可能需要为 `exists` 查询指定特定的数据库连接。为此，可以把连接名放在表名之前：

```php
'email' => 'exists:connection.staff,email'
```

除了直接指定表名之外，你还可以指定应用于确定表名的 Eloquent 模型：

```php
'user_id' => 'exists:App\Models\User,id'
```

如果你希望自定义该验证规则所执行的查询，可以使用 `Rule` 类以链式写法定义该规则。在这个例子中，我们还会把验证规则指定为数组，而不是用 `|` 字符来分隔它们：

```php
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::exists('staff')->where(function (Builder $query) {
            $query->where('account_id', 1);
        }),
    ],
]);
```

你也可以把列名作为 `exists` 方法的第二个参数提供，从而明确指定 `Rule::exists` 方法所生成的 `exists` 规则应当使用哪个数据库列名：

```php
'state' => Rule::exists('states', 'abbreviation'),
```

<a name="rule-extensions"></a>
#### extensions:_foo_,_bar_,...

待验证文件必须具有与所列扩展名之一相对应的用户指定扩展名：

```php
'photo' => ['required', 'extensions:jpg,png'],
```

> [!WARNING]
> 你绝不应仅依赖用户指定的扩展名来验证文件。该规则通常应始终与 [`mimes`](#rule-mimes) 或 [`mimetypes`](#rule-mimetypes) 规则结合使用。

<a name="rule-file"></a>
#### file

待验证字段必须是一个成功上传的文件。

<a name="rule-filled"></a>
#### filled

待验证字段存在时，其值不得为空。

<a name="rule-gt"></a>
#### gt:_field_

待验证字段必须大于给定的 _field_ 或 _value_。两个字段必须属于相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定进行判定。

<a name="rule-gte"></a>
#### gte:_field_

待验证字段必须大于或等于给定的 _field_ 或 _value_。两个字段必须属于相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定进行判定。

<a name="rule-hex-color"></a>
#### hex_color

待验证字段必须包含有效的[十六进制](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color)格式颜色值。

<a name="rule-image"></a>
#### image

待验证文件必须是一张图片（jpg、jpeg、png、bmp、gif、svg 或 webp）。

<a name="rule-in"></a>
#### in:_foo_,_bar_,...

待验证字段必须包含在给定的值列表中。由于该规则经常要求你对数组执行 `implode`，因此可以使用 `Rule::in` 方法以链式写法构造该规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'zones' => [
        'required',
        Rule::in(['first-zone', 'second-zone']),
    ],
]);
```

当 `in` 规则与 `array` 规则结合使用时，输入数组中的每个值都必须出现在传给 `in` 规则的值列表中。在下面这个例子中，输入数组中的 `LAS` 机场代码是无效的，因为它不在传给 `in` 规则的机场列表中：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$input = [
    'airports' => ['NYC', 'LAS'],
];

Validator::make($input, [
    'airports' => [
        'required',
        'array',
    ],
    'airports.*' => Rule::in(['NYC', 'LIT']),
]);
```

<a name="rule-in-array"></a>
#### in_array:_anotherfield_.*

待验证字段必须存在于 _anotherfield_ 的值中。

<a name="rule-integer"></a>
#### integer

待验证字段必须是一个整数。

> [!WARNING]
> 该验证规则不会验证输入是否为 "integer" 变量类型，只会验证输入是否为 PHP `FILTER_VALIDATE_INT` 规则所接受的类型。如果你需要把输入验证为数字，请把该规则与 [`numeric` 验证规则](#rule-numeric)结合使用。

<a name="rule-ip"></a>
#### ip

待验证字段必须是一个 IP 地址。

<a name="ipv4"></a>
#### ipv4

待验证字段必须是一个 IPv4 地址。

<a name="ipv6"></a>
#### ipv6

待验证字段必须是一个 IPv6 地址。

<a name="rule-json"></a>
#### json

待验证字段必须是一个有效的 JSON 字符串。

<a name="rule-lt"></a>
#### lt:_field_

待验证字段必须小于给定的 _field_。两个字段必须属于相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定进行判定。

<a name="rule-lte"></a>
#### lte:_field_

待验证字段必须小于或等于给定的 _field_。两个字段必须属于相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定进行判定。

<a name="rule-lowercase"></a>
#### lowercase

待验证字段必须是小写。

<a name="rule-list"></a>
#### list

待验证字段必须是一个列表形式的数组。如果数组的键由 0 到 `count($array) - 1` 的连续数字组成，就认为该数组是一个列表。

<a name="rule-mac"></a>
#### mac_address

待验证字段必须是一个 MAC 地址。

<a name="rule-max"></a>
#### max:_value_

待验证字段必须小于或等于最大值 _value_。字符串、数值、数组和文件的判定方式与 [`size`](#rule-size) 规则相同。

<a name="rule-max-digits"></a>
#### max_digits:_value_

待验证的整数长度最多为 _value_。

<a name="rule-mimetypes"></a>
#### mimetypes:_text/plain_,...

待验证文件必须匹配给定的某个 MIME 类型：

```php
'video' => 'mimetypes:video/avi,video/mpeg,video/quicktime'
```

要确定所上传文件的 MIME 类型，框架会读取文件内容并尝试猜测其 MIME 类型，该结果可能与客户端提供的 MIME 类型不同。

<a name="rule-mimes"></a>
#### mimes:_foo_,_bar_,...

待验证文件的 MIME 类型必须与所列扩展名之一相对应：

```php
'photo' => 'mimes:jpg,bmp,png'
```

尽管你只需指定扩展名，该规则实际上会通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。完整的 MIME 类型及其对应扩展名列表可在以下位置查看：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="mime-types-and-extensions"></a>
#### MIME 类型与扩展名

该验证规则不会校验 MIME 类型与用户为文件指定的扩展名是否一致。例如，`mimes:png` 验证规则会把包含有效 PNG 内容的文件视为有效的 PNG 图片，即使该文件名为 `photo.txt`。如果你希望验证文件由用户指定的扩展名，可以使用 [`extensions`](#rule-extensions) 规则。

<a name="rule-min"></a>
#### min:_value_

待验证字段必须不小于最小值 _value_。字符串、数值、数组和文件的判定方式与 [`size`](#rule-size) 规则相同。

<a name="rule-min-digits"></a>
#### min_digits:_value_

待验证的整数长度至少为 _value_。

<a name="rule-multiple-of"></a>
#### multiple_of:_value_

待验证字段必须是 _value_ 的倍数。

<a name="rule-missing"></a>
#### missing

待验证字段不能出现在输入数据中。

<a name="rule-missing-if"></a>
#### missing_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意一个 _value_，待验证字段就不能存在。

<a name="rule-missing-unless"></a>
#### missing_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任意一个 _value_，否则待验证字段不能存在。

<a name="rule-missing-with"></a>
#### missing_with:_foo_,_bar_,...

仅当其它指定字段中的任意一个存在时，待验证字段才不能存在。

<a name="rule-missing-with-all"></a>
#### missing_with_all:_foo_,_bar_,...

仅当其它指定字段全部存在时，待验证字段才不能存在。

<a name="rule-not-in"></a>
#### not_in:_foo_,_bar_,...

待验证字段不能包含在给定的值列表中。可以使用 `Rule::notIn` 方法以链式写法构造该规则：

```php
use Illuminate\Validation\Rule;

Validator::make($data, [
    'toppings' => [
        'required',
        Rule::notIn(['sprinkles', 'cherries']),
    ],
]);
```

<a name="rule-not-regex"></a>
#### not_regex:_pattern_

待验证字段不能匹配给定的正则表达式。

在内部，该规则使用 PHP `preg_match` 函数。所指定的模式应遵循 `preg_match` 所要求的相同格式，因此也需要包含有效的分隔符。例如：`'email' => 'not_regex:/^.+$/i'`。

> [!WARNING]
> 使用 `regex` / `not_regex` 模式时，可能需要用数组而不是 `|` 分隔符来指定验证规则，尤其是在正则表达式包含 `|` 字符时。

<a name="rule-nullable"></a>
#### nullable

待验证字段可以是 `null`。

<a name="rule-numeric"></a>
#### numeric

待验证字段必须是[数值](https://www.php.net/manual/en/function.is-numeric.php)。

<a name="rule-present"></a>
#### present

待验证字段必须存在于输入数据中。

<a name="rule-present-if"></a>
#### present_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意一个 _value_，待验证字段就必须存在。

<a name="rule-present-unless"></a>
#### present_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任意一个 _value_，否则待验证字段必须存在。

<a name="rule-present-with"></a>
#### present_with:_foo_,_bar_,...

仅当其它指定字段中的任意一个存在时，待验证字段才必须存在。

<a name="rule-present-with-all"></a>
#### present_with_all:_foo_,_bar_,...

仅当其它指定字段全部存在时，待验证字段才必须存在。

<a name="rule-prohibited"></a>
#### prohibited

待验证字段必须缺失或为空。如果字段满足以下任一条件，就认为它是"空"的：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值是空字符串。
- 值是空数组或空的 `Countable` 对象。
- 值是路径为空的上传文件。

</div>

<a name="rule-prohibited-if"></a>
#### prohibited_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意一个 _value_，待验证字段就必须缺失或为空。如果字段满足以下任一条件，就认为它是"空"的：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值是空字符串。
- 值是空数组或空的 `Countable` 对象。
- 值是路径为空的上传文件。

</div>

如果需要复杂的条件禁止逻辑，可以使用 `Rule::prohibitedIf` 方法。该方法接受一个布尔值或一个闭包。传入闭包时，该闭包应返回 `true` 或 `false`，以指示是否应禁止待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::prohibitedIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::prohibitedIf(fn () => $request->user()->is_admin),
]);
```

<a name="rule-prohibited-unless"></a>
#### prohibited_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任意一个 _value_，否则待验证字段必须缺失或为空。如果字段满足以下任一条件，就认为它是"空"的：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值是空字符串。
- 值是空数组或空的 `Countable` 对象。
- 值是路径为空的上传文件。

</div>

<a name="rule-prohibits"></a>
#### prohibits:_anotherfield_,...

如果待验证字段既非缺失也非空，那么 _anotherfield_ 中的所有字段都必须缺失或为空。如果字段满足以下任一条件，就认为它是"空"的：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值是空字符串。
- 值是空数组或空的 `Countable` 对象。
- 值是路径为空的上传文件。

</div>

<a name="rule-regex"></a>
#### regex:_pattern_

待验证字段必须匹配给定的正则表达式。

在内部，该规则使用 PHP `preg_match` 函数。所指定的模式应遵循 `preg_match` 所要求的相同格式，因此也需要包含有效的分隔符。例如：`'email' => 'regex:/^.+@.+$/i'`。

> [!WARNING]
> 使用 `regex` / `not_regex` 模式时，可能需要用数组而不是 `|` 分隔符来指定规则，尤其是在正则表达式包含 `|` 字符时。

<a name="rule-required"></a>
#### required

待验证字段必须存在于输入数据中且不得为空。如果字段满足以下任一条件，就认为它是"空"的：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值是空字符串。
- 值是空数组或空的 `Countable` 对象。
- 值是没有路径的上传文件。

</div>

<a name="rule-required-if"></a>
#### required_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意一个 _value_，待验证字段就必须存在且不得为空。

如果你想为 `required_if` 规则构造更复杂的条件，可以使用 `Rule::requiredIf` 方法。该方法接受一个布尔值或一个闭包。传入闭包时，该闭包应返回 `true` 或 `false`，以指示待验证字段是否必填：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => Rule::requiredIf($request->user()->is_admin),
]);

Validator::make($request->all(), [
    'role_id' => Rule::requiredIf(fn () => $request->user()->is_admin),
]);
```

<a name="rule-required-if-accepted"></a>
#### required_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，待验证字段就必须存在且不得为空。

<a name="rule-required-if-declined"></a>
#### required_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，待验证字段就必须存在且不得为空。

<a name="rule-required-unless"></a>
#### required_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任意一个 _value_，否则待验证字段必须存在且不得为空。这同时意味着，除非 _value_ 为 `null`，否则 _anotherfield_ 也必须存在于请求数据中。如果 _value_ 为 `null`（`required_unless:name,null`），那么除非比较字段为 `null` 或该比较字段在请求数据中缺失，否则待验证字段为必填。

<a name="rule-required-with"></a>
#### required_with:_foo_,_bar_,...

仅当其它指定字段中的任意一个存在且非空时，待验证字段才必须存在且不得为空。

<a name="rule-required-with-all"></a>
#### required_with_all:_foo_,_bar_,...

仅当其它指定字段全部存在且非空时，待验证字段才必须存在且不得为空。

<a name="rule-required-without"></a>
#### required_without:_foo_,_bar_,...

仅当其它指定字段中的任意一个为空或不存在时，待验证字段才必须存在且不得为空。

<a name="rule-required-without-all"></a>
#### required_without_all:_foo_,_bar_,...

仅当其它指定字段全部为空或不存在时，待验证字段才必须存在且不得为空。

<a name="rule-required-array-keys"></a>
#### required_array_keys:_foo_,_bar_,...

待验证字段必须是一个数组，并且必须至少包含指定的那些键。

<a name="rule-same"></a>
#### same:_field_

给定的 _field_ 必须与待验证字段匹配。

<a name="rule-size"></a>
#### size:_value_

待验证字段的大小必须与给定的 _value_ 相匹配。对于字符串数据，_value_ 对应字符数量；对于数值数据，_value_ 对应给定的整数值（该属性还必须具有 `numeric` 或 `integer` 规则）；对于数组，_size_ 对应数组的 `count`；对于文件，_size_ 对应以 KB 为单位的文件大小。我们来看几个例子：

```php
// 验证字符串长度恰好为 12 个字符……
'title' => 'size:12';

// 验证提供的整数等于 10……
'seats' => 'integer|size:10';

// 验证数组恰好有 5 个元素……
'tags' => 'array|size:5';

// 验证上传的文件恰好为 512 KB……
'image' => 'file|size:512';
```

<a name="rule-starts-with"></a>
#### starts_with:_foo_,_bar_,...

待验证字段必须以给定值中的某一个开头。

<a name="rule-string"></a>
#### string

待验证字段必须是一个字符串。如果你希望允许该字段同时为 `null`，应当为该字段指定 `nullable` 规则。

<a name="rule-timezone"></a>
#### timezone

待验证字段必须是符合 `DateTimeZone::listIdentifiers` 方法的有效时区标识符。

也可以把 [`DateTimeZone::listIdentifiers` 方法所接受的参数](https://www.php.net/manual/en/datetimezone.listidentifiers.php)提供给该验证规则：

```php
'timezone' => 'required|timezone:all';

'timezone' => 'required|timezone:Africa';

'timezone' => 'required|timezone:per_country,US';
```

<a name="rule-unique"></a>
#### unique:_table_,_column_

待验证字段不能存在于给定的数据库表中。

**指定自定义表名 / 列名：**

除了直接指定表名之外，你还可以指定应用于确定表名的 Eloquent 模型：

```php
'email' => 'unique:App\Models\User,email_address'
```

可以使用 `column` 选项指定该字段对应的数据库列。如果未指定 `column` 选项，就会使用待验证字段的名称。

```php
'email' => 'unique:users,email_address'
```

**指定自定义数据库连接**

有时你可能需要为验证器发起的数据库查询设置自定义连接。为此，可以把连接名放在表名之前：

```php
'email' => 'unique:connection.users,email_address'
```

**让 unique 规则忽略指定 ID：**

有时你可能希望在唯一性验证期间忽略某个给定的 ID。例如，假设有一个"更新资料"界面，其中包含用户的姓名、电子邮件地址和所在地。你大概会希望验证电子邮件地址是唯一的。但如果用户只更改了姓名字段而没有更改邮箱字段，你就不希望抛出验证错误，因为该用户本就是这个邮箱地址的所有者。

要指示验证器忽略该用户的 ID，我们使用 `Rule` 类以链式写法定义该规则。在这个例子中，我们还会把验证规则指定为数组，而不是用 `|` 字符来分隔规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::unique('users')->ignore($user->id),
    ],
]);
```

> [!WARNING]
> 你绝不应把任何用户可控的请求输入传给 `ignore` 方法。相反，你只应传入系统生成的唯一 ID，例如自增 ID 或来自 Eloquent 模型实例的 UUID。否则，你的应用将容易受到 SQL 注入攻击。

除了把模型主键的值传给 `ignore` 方法之外，你也可以传入整个模型实例。Laravel 会自动从模型中提取主键：

```php
Rule::unique('users')->ignore($user)
```

如果你的表使用的主键列名不是 `id`，可以在调用 `ignore` 方法时指定列名：

```php
Rule::unique('users')->ignore($user->id, 'user_id')
```

默认情况下，`unique` 规则会检查与待验证属性同名的列是否唯一。不过，你也可以把不同的列名作为 `unique` 方法的第二个参数传入：

```php
Rule::unique('users', 'email_address')->ignore($user->id)
```

**添加额外的 where 子句：**

你可以使用 `where` 方法自定义查询，以指定额外的查询条件。例如，我们添加一个查询条件，把查询范围限定为只查找 `account_id` 列值为 `1` 的记录：

```php
'email' => Rule::unique('users')->where(fn (Builder $query) => $query->where('account_id', 1))
```

**在唯一性检查中忽略软删除的记录：**

默认情况下，unique 规则在判断唯一性时会包含软删除的记录。如果要在唯一性检查中排除软删除的记录，可以调用 `withoutTrashed` 方法：

```php
Rule::unique('users')->withoutTrashed();
```

如果你的模型对软删除记录使用的主键列名不是 `deleted_at`，可以在调用 `withoutTrashed` 方法时提供该列名：

```php
Rule::unique('users')->withoutTrashed('was_deleted_at');
```

<a name="rule-uppercase"></a>
#### uppercase

待验证字段必须是大写。

<a name="rule-url"></a>
#### url

待验证字段必须是一个有效的 URL。

如果你希望指定哪些 URL 协议被视为有效，可以把协议作为验证规则参数传入：

```php
'url' => 'url:http,https',

'game' => 'url:minecraft,steam',
```

<a name="rule-ulid"></a>
#### ulid

待验证字段必须是一个有效的[通用唯一字典序可排序标识符](https://github.com/ulid/spec)（ULID）。

<a name="rule-uuid"></a>
#### uuid

待验证字段必须是一个有效的 RFC 9562（版本 1、3、4、5、6、7 或 8）通用唯一标识符（UUID）。

<a name="conditionally-adding-rules"></a>
## 条件式添加规则

<a name="skipping-validation-when-fields-have-certain-values"></a>
#### 在字段具有特定值时跳过验证

你偶尔会希望在某个字段具有给定值时不验证另一个字段，可以使用 `exclude_if` 验证规则实现。在这个例子中，如果 `has_appointment` 字段的值为 `false`，那么 `appointment_date` 和 `doctor_name` 字段就不会被验证：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_if:has_appointment,false|required|date',
    'doctor_name' => 'exclude_if:has_appointment,false|required|string',
]);
```

或者，你也可以使用 `exclude_unless` 规则在某个字段没有给定值时不验证另一个字段：

```php
$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_unless:has_appointment,true|required|date',
    'doctor_name' => 'exclude_unless:has_appointment,true|required|string',
]);
```

<a name="validating-when-present"></a>
#### 仅在字段存在时验证

在某些场景中，你可能希望**仅**当某个字段存在于待验证数据中时才对它执行验证检查。为此，只需在规则列表中添加 `sometimes` 规则：

```php
$validator = Validator::make($data, [
    'email' => 'sometimes|required|email',
]);
```

在上面的例子中，只有当 `email` 字段存在于 `$data` 数组中时才会被验证。

> [!NOTE]
> 如果你要验证的字段应当始终存在、但可能为空，请参阅[关于可选字段的说明](#a-note-on-optional-fields)。

<a name="complex-conditional-validation"></a>
#### 复杂的条件验证

有时你可能希望基于更复杂的条件逻辑添加验证规则。例如，你可能希望仅在另一个字段的值大于 100 时才要求某个字段必填；又或者，你可能需要仅在某个字段存在时，两个字段才具有某个给定值。添加这些验证规则并不麻烦。首先，用你那些从不改变的_静态规则_创建一个 `Validator` 实例：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'email' => 'required|email',
    'games' => 'required|numeric',
]);
```

假设我们的 Web 应用是面向游戏收藏者的。如果一位游戏收藏者注册了我们的应用，并且他拥有超过 100 款游戏，我们希望他解释为什么拥有这么多游戏。例如，也许他经营一家游戏转卖店，或者只是单纯喜欢收藏游戏。为了按条件添加这项要求，我们可以在 `Validator` 实例上使用 `sometimes` 方法。

```php
use Illuminate\Support\Fluent;

$validator->sometimes('reason', 'required|max:500', function (Fluent $input) {
    return $input->games >= 100;
});
```

传给 `sometimes` 方法的第一个参数是要按条件验证的字段名称。第二个参数是我们想要添加的规则列表。如果作为第三个参数传入的闭包返回 `true`，这些规则就会被添加。该方法让构建复杂的条件验证变得轻而易举。你甚至可以一次为多个字段添加条件验证：

```php
$validator->sometimes(['reason', 'cost'], 'required', function (Fluent $input) {
    return $input->games >= 100;
});
```

> [!NOTE]
> 传给闭包的 `$input` 参数是一个 `Illuminate\Support\Fluent` 实例，可用于访问待验证的输入和文件。

<a name="complex-conditional-array-validation"></a>
#### 复杂的条件数组验证

有时你可能想根据同一嵌套数组中某个索引未知的另一个字段来验证一个字段。在这些场景中，你可以允许闭包接收第二个参数，该参数就是待验证数组中当前的那个元素：

```php
$input = [
    'channels' => [
        [
            'type' => 'email',
            'address' => 'abigail@example.com',
        ],
        [
            'type' => 'url',
            'address' => 'https://example.com',
        ],
    ],
];

$validator->sometimes('channels.*.address', 'email', function (Fluent $input, Fluent $item) {
    return $item->type === 'email';
});

$validator->sometimes('channels.*.address', 'url', function (Fluent $input, Fluent $item) {
    return $item->type !== 'email';
});
```

与传给闭包的 `$input` 参数一样，当属性数据是数组时，`$item` 参数是一个 `Illuminate\Support\Fluent` 实例；否则它是一个字符串。

<a name="validating-arrays"></a>
## 验证数组

如 [`array` 验证规则文档](#rule-array)中所述，`array` 规则接受一份允许出现的数组键列表。如果数组中出现了任何额外的键，验证都会失败：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => 'array:name,username',
]);
```

一般来说，你应当始终明确指定数组中允许出现的键。否则，验证器的 `validate` 和 `validated` 方法会返回全部已验证数据，包括该数组及其所有键，即使这些键并未被其它嵌套数组验证规则所验证。

<a name="validating-nested-array-input"></a>
### 验证嵌套数组输入

验证基于嵌套数组的表单输入字段并不麻烦。你可以使用"点记号"来验证数组中的属性。例如，如果传入的 HTTP 请求包含一个 `photos[profile]` 字段，可以这样验证：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'photos.profile' => 'required|image',
]);
```

你也可以验证数组的每个元素。例如，要验证某个数组输入字段中的每个邮箱地址都是唯一的，可以这样做：

```php
$validator = Validator::make($request->all(), [
    'person.*.email' => 'email|unique:users',
    'person.*.first_name' => 'required_with:person.*.last_name',
]);
```

同样地，在[语言文件中指定自定义验证消息](#custom-messages-for-specific-attributes)时你也可以使用 `*` 字符，从而轻松地为基于数组的字段使用同一条验证消息：

```php
'custom' => [
    'person.*.email' => [
        'unique' => 'Each person must have a unique email address',
    ]
],
```

<a name="accessing-nested-array-data"></a>
#### 访问嵌套数组数据

有时在为属性指定验证规则时，你需要访问某个嵌套数组元素的值。可以使用 `Rule::forEach` 方法实现。该方法接受一个闭包，在待验证的数组属性每次迭代时都会调用它，并接收该属性的值以及完整的、已展开的属性名。该闭包应返回一个规则数组，用于指派给该数组元素：

```php
use App\Rules\HasPermission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$validator = Validator::make($request->all(), [
    'companies.*.id' => Rule::forEach(function (string|null $value, string $attribute) {
        return [
            Rule::exists(Company::class, 'id'),
            new HasPermission('manage-company', $value),
        ];
    }),
]);
```

<a name="error-message-indexes-and-positions"></a>
### 错误消息的索引与位置

验证数组时，你可能希望在应用展示的错误消息中引用某个验证失败项的索引或位置。为此，可以在[自定义验证消息](#manual-customizing-the-error-messages)中包含 `:index`（从 `0` 开始）和 `:position`（从 `1` 开始）占位符：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'photos' => [
        [
            'name' => 'BeachVacation.jpg',
            'description' => 'A photo of my beach vacation!',
        ],
        [
            'name' => 'GrandCanyon.jpg',
            'description' => '',
        ],
    ],
];

Validator::validate($input, [
    'photos.*.description' => 'required',
], [
    'photos.*.description.required' => 'Please describe photo #:position.',
]);
```

在上面的例子中，验证会失败，用户会看到如下错误：_"请描述照片 #2。"_

如有需要，你可以通过 `second-index`、`second-position`、`third-index`、`third-position` 等引用更深层的索引与位置。

```php
'photos.*.attributes.*.string' => 'Invalid attribute for photo #:second-position.',
```

<a name="validating-files"></a>
## 验证文件

Laravel 提供了多种可用于验证上传文件的验证规则，例如 `mimes`、`image`、`min` 和 `max`。虽然验证文件时你可以自由地单独指定这些规则，但 Laravel 还提供了一个链式的文件验证规则构造器，可能会让你的工作更方便：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'attachment' => [
        'required',
        File::types(['mp3', 'wav'])
            ->min(1024)
            ->max(12 * 1024),
    ],
]);
```

<a name="validating-files-file-types"></a>
#### 验证文件类型

尽管调用 `types` 方法时你只需指定扩展名，该方法实际上会通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。完整的 MIME 类型及其对应扩展名列表可在以下位置查看：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="validating-files-file-sizes"></a>
#### 验证文件大小

为方便起见，最小和最大文件大小可以指定为带后缀的字符串，后缀用于标明文件大小单位。支持 `kb`、`mb`、`gb` 和 `tb` 后缀：

```php
File::types(['mp3', 'wav'])
    ->min('1kb')
    ->max('10mb');
```

<a name="validating-files-image-files"></a>
#### 验证图片文件

要验证所上传的文件是图片，可以使用 `File` 规则的 `image` 构造方法。`File::image()` 规则确保待验证文件是一张图片（jpg、jpeg、png、bmp、gif、svg 或 webp）：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'photo' => [
        'required',
        File::image(),
    ],
]);
```

<a name="validating-files-image-dimensions"></a>
#### 验证图片尺寸

你也可以验证图片的尺寸。例如，要验证所上传的图片宽度至少为 1000 像素且高度至少为 500 像素，可以使用 `dimensions` 规则：

```php
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

File::image()->dimensions(
    Rule::dimensions()
        ->maxWidth(1000)
        ->maxHeight(500)
)
```

> [!NOTE]
> 关于验证图片尺寸的更多信息，请参阅 [dimensions 规则文档](#rule-dimensions)。

<a name="validating-passwords"></a>
## 验证密码

为确保密码具备足够的复杂度，你可以使用 Laravel 的 `Password` 规则对象：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

$validator = Validator::make($request->all(), [
    'password' => ['required', 'confirmed', Password::min(8)],
]);
```

`Password` 规则对象让你可以轻松定制应用的密码复杂度要求，例如指定密码至少包含一个字母、数字、符号，或包含大小写混合的字符：

```php
// 要求至少 8 个字符……
Password::min(8)

// 要求至少包含一个字母……
Password::min(8)->letters()

// 要求至少包含一个大写字母和一个小写字母……
Password::min(8)->mixedCase()

// 要求至少包含一个数字……
Password::min(8)->numbers()

// 要求至少包含一个符号……
Password::min(8)->symbols()
```

此外，你还可以使用 `uncompromised` 方法确保某个密码未出现在公开的密码数据泄露中：

```php
Password::min(8)->uncompromised()
```

在内部，`Password` 规则对象使用 [k-匿名](https://en.wikipedia.org/wiki/K-anonymity)模型来判断某个密码是否已通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务泄露，同时不会牺牲用户的隐私或安全。

默认情况下，如果某个密码在数据泄露中至少出现过一次，就会被视为已泄露。你可以使用 `uncompromised` 方法的第一个参数自定义这一阈值：

```php
// 确保密码在同一处数据泄露中出现少于 3 次……
Password::min(8)->uncompromised(3);
```

当然，你也可以把上面示例中的所有方法链式组合起来：

```php
Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
```

<a name="defining-default-password-rules"></a>
#### 定义默认密码规则

你可能希望在一个集中的位置指定密码的默认验证规则。这很容易做到，只需使用接受闭包的 `Password::defaults` 方法。传给 `defaults` 方法的闭包应返回 Password 规则的默认配置。通常，应在应用的某个服务提供者的 `boot` 方法内调用 `defaults` 规则：

```php
use Illuminate\Validation\Rules\Password;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Password::defaults(function () {
        $rule = Password::min(8);

        return $this->app->isProduction()
            ? $rule->mixedCase()->uncompromised()
            : $rule;
    });
}
```

之后，当你想把默认规则应用到某个待验证的密码时，可以不带参数地调用 `defaults` 方法：

```php
'password' => ['required', Password::defaults()],
```

有时你可能希望为默认密码验证规则附加额外的验证规则，可以使用 `rules` 方法实现：

```php
use App\Rules\ZxcvbnRule;

Password::defaults(function () {
    $rule = Password::min(8)->rules([new ZxcvbnRule]);

    // ...
});
```

<a name="custom-validation-rules"></a>
## 自定义验证规则

<a name="using-rule-objects"></a>
### 使用规则对象

Laravel 提供了多种实用的验证规则；不过，你可能希望指定一些自己的规则。注册自定义验证规则的一种方式是使用规则对象。要生成一个新的规则对象，可以使用 `make:rule` Artisan 命令。我们用这个命令生成一个验证字符串为大写的规则。Laravel 会把新规则放在 `app/Rules` 目录下。如果该目录不存在，执行创建规则的 Artisan 命令时 Laravel 会自动创建它：

```shell
php artisan make:rule Uppercase
```

规则创建完成后，我们就可以定义它的行为。规则对象只包含一个方法：`validate`。该方法接收属性名称、属性值，以及一个失败时应调用的回调（需传入验证错误消息）：

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements ValidationRule
{
    /**
     * 运行验证规则。
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strtoupper($value) !== $value) {
            $fail('The :attribute must be uppercase.');
        }
    }
}
```

规则定义完成后，你可以把该规则对象的实例与其它的验证规则一起传入，从而把它附加到验证器上：

```php
use App\Rules\Uppercase;

$request->validate([
    'name' => ['required', 'string', new Uppercase],
]);
```

#### 翻译验证消息

除了向 `$fail` 闭包提供字面量错误消息之外，你也可以提供一个[翻译字符串键](/docs/{{version}}/localization)，并指示 Laravel 翻译该错误消息：

```php
if (strtoupper($value) !== $value) {
    $fail('validation.uppercase')->translate();
}
```

如有需要，你可以把占位符替换值和首选语言分别作为 `translate` 方法的第一个和第二个参数提供：

```php
$fail('validation.location')->translate([
    'value' => $this->value,
], 'fr')
```

#### 访问额外数据

如果你的自定义验证规则类需要访问正在验证的其它全部数据，可以在规则类上实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。该接口要求你的类定义一个 `setData` 方法。在验证开始之前，Laravel 会自动调用该方法并传入全部待验证数据：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements DataAwareRule, ValidationRule
{
    /**
     * 全部待验证数据。
     *
     * @var array<string, mixed>
     */
    protected $data = [];

    // ...

    /**
     * 设置待验证数据。
     *
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }
}
```

或者，如果你的验证规则需要访问执行验证的验证器实例，可以实现 `ValidatorAwareRule` 接口：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\ValidatorAwareRule;
use Illuminate\Validation\Validator;

class Uppercase implements ValidationRule, ValidatorAwareRule
{
    /**
     * 验证器实例。
     *
     * @var \Illuminate\Validation\Validator
     */
    protected $validator;

    // ...

    /**
     * 设置当前验证器。
     */
    public function setValidator(Validator $validator): static
    {
        $this->validator = $validator;

        return $this;
    }
}
```

<a name="using-closures"></a>
### 使用闭包

如果你在整个应用中只需要某条自定义规则的功能一次，可以改用闭包代替规则对象。该闭包会接收属性名称、属性值，以及一个在验证失败时应该调用的 `$fail` 回调：

```php
use Illuminate\Support\Facades\Validator;
use Closure;

$validator = Validator::make($request->all(), [
    'title' => [
        'required',
        'max:255',
        function (string $attribute, mixed $value, Closure $fail) {
            if ($value === 'foo') {
                $fail("The {$attribute} is invalid.");
            }
        },
    ],
]);
```

<a name="implicit-rules"></a>
### 隐式规则

默认情况下，当某个待验证属性不存在或包含空字符串时，包括自定义规则在内的普通验证规则都不会执行。例如，[`unique`](#rule-unique) 规则不会对空字符串执行：

```php
use Illuminate\Support\Facades\Validator;

$rules = ['name' => 'unique:users,name'];

$input = ['name' => ''];

Validator::make($input, $rules)->passes(); // true
```

要让自定义规则在属性为空时也执行，该规则必须隐含地表明该属性为必填。要快速生成一个新的隐式规则对象，可以使用带 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --implicit
```

> [!WARNING]
> "隐式"规则只是_暗示_该属性为必填。至于它是否真正让缺失或为空的属性验证失败，则由你自己决定。
