# 验证

- [简介](#introduction)
- [验证快速入门](#validation-quickstart)
    - [定义路由](#quick-defining-the-routes)
    - [创建控制器](#quick-creating-the-controller)
    - [编写验证逻辑](#quick-writing-the-validation-logic)
    - [显示验证错误](#quick-displaying-the-validation-errors)
    - [回填表单](#repopulating-forms)
    - [关于可选字段的说明](#a-note-on-optional-fields)
    - [验证错误响应格式](#validation-error-response-format)
- [表单请求验证](#form-request-validation)
    - [创建表单请求](#creating-form-requests)
    - [表单请求授权](#authorizing-form-requests)
    - [自定义错误消息](#customizing-the-error-messages)
    - [为验证准备输入](#preparing-input-for-validation)
- [手动创建验证器](#manually-creating-validators)
    - [自动重定向](#automatic-redirection)
    - [命名的错误袋](#named-error-bags)
    - [自定义错误消息](#manual-customizing-the-error-messages)
    - [执行额外的验证](#performing-additional-validation)
- [使用已验证的输入](#working-with-validated-input)
- [处理错误消息](#working-with-error-messages)
    - [在语言文件中指定自定义消息](#specifying-custom-messages-in-language-files)
    - [在语言文件中指定属性](#specifying-attribute-in-language-files)
    - [在语言文件中指定值](#specifying-values-in-language-files)
- [可用的验证规则](#available-validation-rules)
- [按条件添加规则](#conditionally-adding-rules)
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

Laravel 提供了几种不同的方式来验证应用的传入数据。最常见的是使用所有传入 HTTP 请求上都可用的 `validate` 方法。不过，我们也会讨论其他验证方式。

Laravel 内置了大量便捷的验证规则，你可以将它们应用到数据上，甚至能够验证值在给定数据库表中是否唯一。我们将逐一详细介绍这些验证规则，让你熟悉 Laravel 的所有验证功能。

<a name="validation-quickstart"></a>
## 验证快速入门

为了了解 Laravel 强大的验证功能，我们来看一个完整的示例：验证一个表单并将错误消息显示给用户。通过阅读这个概览，你将对如何使用 Laravel 验证传入请求数据有一个很好的整体认识：

<a name="quick-defining-the-routes"></a>
### 定义路由

首先，假设我们在 `routes/web.php` 文件中定义了以下路由：

```php
use App\Http\Controllers\PostController;

Route::get('/post/create', [PostController::class, 'create']);
Route::post('/post', [PostController::class, 'store']);
```

`GET` 路由会显示一个供用户创建新博客文章的表单，而 `POST` 路由会将新的博客文章存储到数据库中。

<a name="quick-creating-the-controller"></a>
### 创建控制器

接下来，我们来看一个处理这些路由传入请求的简单控制器。我们暂时将 `store` 方法留空：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PostController extends Controller
{
    /**
     * Show the form to create a new blog post.
     */
    public function create(): View
    {
        return view('post.create');
    }

    /**
     * Store a new blog post.
     */
    public function store(Request $request): RedirectResponse
    {
        // Validate and store the blog post...

        $post = /** ... */

        return to_route('post.show', ['post' => $post->id]);
    }
}
```

<a name="quick-writing-the-validation-logic"></a>
### 编写验证逻辑

现在，我们准备在 `store` 方法中填入验证新博客文章的逻辑。为此，我们将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，代码将继续正常执行；如果验证失败，将抛出 `Illuminate\Validation\ValidationException` 异常，并自动向用户发送相应的错误响应。

如果验证在传统 HTTP 请求中失败，将生成一个重定向到之前 URL 的响应。如果传入请求是 XHR 请求，则会返回一个[包含验证错误消息的 JSON 响应](#validation-error-response-format)。

为了更好地理解 `validate` 方法，让我们回到 `store` 方法：

```php
/**
 * Store a new blog post.
 */
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ]);

    // The blog post is valid...

    return redirect('/posts');
}
```

如你所见，验证规则被传递给了 `validate` 方法。不用担心——所有可用的验证规则都已[记录在文档中](#available-validation-rules)。再次强调，如果验证失败，将自动生成相应的响应。如果验证通过，控制器将继续正常执行。

此外，验证规则也可以指定为数组形式，而非使用单个 `|` 分隔的字符串：

```php
$validatedData = $request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

另外，你可以使用 `validateWithBag` 方法验证请求，并将任何错误消息存储到[命名的错误袋](#named-error-bags)中：

```php
$validatedData = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

<a name="stopping-on-first-validation-failure"></a>
#### 在首次验证失败时停止

有时，你可能希望某个属性在首次验证失败后就停止运行后续验证规则。为此，请为该属性分配 `bail` 规则：

```php
$request->validate([
    'title' => 'bail|required|unique:posts|max:255',
    'body' => 'required',
]);
```

在本例中，如果 `title` 属性的 `unique` 规则验证失败，就不会再检查 `max` 规则。规则将按照分配的顺序进行验证。

<a name="a-note-on-nested-attributes"></a>
#### 关于嵌套属性的说明

如果传入的 HTTP 请求包含「嵌套」的字段数据，你可以在验证规则中使用「点」语法来指定这些字段：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'author.name' => 'required',
    'author.description' => 'required',
]);
```

反之，如果你的字段名本身就包含句点，可以通过反斜杠转义句点，显式阻止它被解释为「点」语法：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'v1\.0' => 'required',
]);
```

<a name="quick-displaying-the-validation-errors"></a>
### 显示验证错误

那么，如果传入请求的字段没有通过给定的验证规则，会发生什么呢？如前所述，Laravel 会自动将用户重定向到之前的位置。此外，所有验证错误和[请求输入](/docs/{{version}}/requests#retrieving-old-input)都会自动[闪存到会话](/docs/{{version}}/session#flash-data)中。

`Illuminate\View\Middleware\ShareErrorsFromSession` 中间件（由 `web` 中间件组提供）会向应用的所有视图共享一个 `$errors` 变量。应用了该中间件后，视图中将始终可以使用 `$errors` 变量，因此你可以放心地假定 `$errors` 变量总是已定义并可安全使用。`$errors` 变量是 `Illuminate\Support\MessageBag` 的实例。更多关于使用该对象的信息，请[查阅其文档](#working-with-error-messages)。

因此，在我们的示例中，验证失败时用户将被重定向到控制器的 `create` 方法，这样我们就可以在视图中显示错误消息：

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

<!-- Create Post Form -->
```

<a name="quick-customizing-the-error-messages"></a>
#### 自定义错误消息

Laravel 内置的每条验证规则都有一个错误消息，位于应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以指示 Laravel 使用 `lang:publish` Artisan 命令来创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则对应的翻译条目。你可以根据应用的需要自由修改这些消息。

此外，你可以将该文件复制到另一种语言的目录中，为应用的语言翻译这些消息。要进一步了解 Laravel 本地化，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="quick-xhr-requests-and-validation"></a>
#### XHR 请求与验证

在本例中，我们使用传统表单向应用发送数据。然而，许多应用会接收来自 JavaScript 驱动的前端的 XHR 请求。在 XHR 请求期间使用 `validate` 方法时，Laravel 不会生成重定向响应，而是生成一个[包含所有验证错误的 JSON 响应](#validation-error-response-format)。该 JSON 响应将以 422 HTTP 状态码发送。

<a name="the-at-error-directive"></a>
#### `@error` 指令

你可以使用 `@error` [Blade](/docs/{{version}}/blade) 指令快速判断给定属性是否存在验证错误消息。在 `@error` 指令内部，你可以输出 `$message` 变量来显示错误消息：

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

如果你使用的是[命名的错误袋](#named-error-bags)，可以将错误袋的名称作为 `@error` 指令的第二个参数传递：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

<a name="repopulating-forms"></a>
### 回填表单

当 Laravel 因验证错误而生成重定向响应时，框架会自动[将请求的所有输入闪存到会话](/docs/{{version}}/session#flash-data)。这样做是为了让你在下一个请求中能够方便地访问这些输入，并回填用户尝试提交的表单。

要获取上一个请求闪存的输入，请在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法会从[会话](/docs/{{version}}/session)中提取此前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你要在 [Blade 模板](/docs/{{version}}/blade)中显示旧的输入，使用 `old` 辅助函数来回填表单会更加方便。如果给定字段没有旧的输入，将返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

<a name="a-note-on-optional-fields"></a>
### 关于可选字段的说明

默认情况下，Laravel 在应用的全局中间件栈中包含了 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。因此，如果你不希望验证器将 `null` 值视为无效，通常需要将「可选」的请求字段标记为 `nullable`。例如：

```php
$request->validate([
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
    'publish_at' => 'nullable|date',
]);
```

在本例中，我们指定 `publish_at` 字段可以为 `null` 或一个有效的日期表示。如果没有在规则定义中添加 `nullable` 修饰符，验证器会将 `null` 视为无效日期。

<a name="validation-error-response-format"></a>
### 验证错误响应格式

当你的应用抛出 `Illuminate\Validation\ValidationException` 异常，且传入的 HTTP 请求期望得到 JSON 响应时，Laravel 会自动为你格式化错误消息，并返回 `422 Unprocessable Entity` HTTP 响应。

下面是一个验证错误的 JSON 响应格式示例。请注意，嵌套的错误键会被扁平化为「点」记法格式：

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

对于更复杂的验证场景，你可能希望创建一个「表单请求」。表单请求是封装了自身验证和授权逻辑的自定义请求类。要创建表单请求类，可以使用 `make:request` Artisan CLI 命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类将被放置在 `app/Http/Requests` 目录中。如果该目录不存在，运行 `make:request` 命令时会自动创建。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

你或许已经猜到，`authorize` 方法负责确定当前经过认证的用户是否可以执行该请求所代表的动作，而 `rules` 方法返回应用于请求数据的验证规则：

```php
/**
 * Get the validation rules that apply to the request.
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
> 你可以在 `rules` 方法的方法签名中对所需的任何依赖进行类型提示。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

那么，验证规则是如何执行的呢？你所需要做的就是在控制器方法上对该请求进行类型提示。传入的表单请求会在控制器方法被调用之前完成验证，也就是说，你无需在控制器中堆砌任何验证逻辑：

```php
/**
 * Store a new blog post.
 */
public function store(StorePostRequest $request): RedirectResponse
{
    // The incoming request is valid...

    // Retrieve the validated input data...
    $validated = $request->validated();

    // Retrieve a portion of the validated input data...
    $validated = $request->safe()->only(['name', 'email']);
    $validated = $request->safe()->except(['name', 'email']);

    // Store the blog post...

    return redirect('/posts');
}
```

如果验证失败，将生成一个重定向响应，把用户送回之前的位置。错误也会被闪存到会话中，以便显示。如果该请求是 XHR 请求，则会向用户返回一个带有 422 状态码的 HTTP 响应，其中包含[验证错误的 JSON 表示](#validation-error-response-format)。

> [!NOTE]
> 需要为由 Inertia 驱动的 Laravel 前端添加实时的表单请求验证？请查看 [Laravel Precognition](/docs/{{version}}/precognition)。

<a name="performing-additional-validation-on-form-requests"></a>
#### 执行额外的验证

有时，你需要在初始验证完成之后执行额外的验证。这可以通过表单请求的 `after` 方法来实现。

`after` 方法应返回一个可调用对象或闭包的数组，它们会在验证完成之后被调用。给定的可调用对象会接收到一个 `Illuminate\Validation\Validator` 实例，让你能够在必要时抛出额外的错误消息：

```php
use Illuminate\Validation\Validator;

/**
 * Get the "after" validation callables for the request.
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

如前所述，`after` 方法返回的数组也可以包含可调用类。这些类的 `__invoke` 方法将接收到一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;
use Illuminate\Validation\Validator;

/**
 * Get the "after" validation callables for the request.
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

通过在请求类中添加 `stopOnFirstFailure` 属性，你可以告知验证器：一旦发生一次验证失败，就应停止验证所有属性：

```php
/**
 * Indicates if the validator should stop on the first rule failure.
 *
 * @var bool
 */
protected $stopOnFirstFailure = true;
```

<a name="customizing-the-redirect-location"></a>
#### 自定义重定向位置

当表单请求验证失败时，将生成一个重定向响应，把用户送回之前的位置。不过，你可以随意自定义这一行为。为此，请在表单请求上定义一个 `$redirect` 属性：

```php
/**
 * The URI that users should be redirected to if validation fails.
 *
 * @var string
 */
protected $redirect = '/dashboard';
```

或者，如果你想将用户重定向到命名路由，可以改为定义 `$redirectRoute` 属性：

```php
/**
 * The route that users should be redirected to if validation fails.
 *
 * @var string
 */
protected $redirectRoute = 'dashboard';
```

<a name="authorizing-form-requests"></a>
### 表单请求授权

表单请求类还包含一个 `authorize` 方法。在这个方法中，你可以确定经过认证的用户是否真正有权更新给定资源。例如，你可以确定用户是否确实拥有其尝试更新的博客评论。通常，你会在这个方法中与你的[授权门与策略](/docs/{{version}}/authorization)交互：

```php
use App\Models\Comment;

/**
 * Determine if the user is authorized to make this request.
 */
public function authorize(): bool
{
    $comment = Comment::find($this->route('comment'));

    return $comment && $this->user()->can('update', $comment);
}
```

由于所有表单请求都继承自基础的 Laravel 请求类，我们可以使用 `user` 方法来访问当前经过认证的用户。另外，请注意上例中对 `route` 方法的调用。该方法让你能够访问被调用路由上定义的 URI 参数，例如下面示例中的 `{comment}` 参数：

```php
Route::post('/comment/{comment}');
```

因此，如果你的应用使用了[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，通过以请求属性的形式访问已解析的模型，代码还可以写得更简洁：

```php
return $this->user()->can('update', $this->comment);
```

如果 `authorize` 方法返回 `false`，将自动返回一个带有 403 状态码的 HTTP 响应，控制器方法不会执行。

如果你计划在应用的其他部分处理该请求的授权逻辑，可以完全移除 `authorize` 方法，或者直接返回 `true`：

```php
/**
 * Determine if the user is authorized to make this request.
 */
public function authorize(): bool
{
    return true;
}
```

> [!NOTE]
> 你可以在 `authorize` 方法的方法签名中对所需的任何依赖进行类型提示。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

<a name="customizing-the-error-messages"></a>
### 自定义错误消息

你可以通过重写 `messages` 方法来自定义表单请求使用的错误消息。该方法应返回一个由属性／规则对及其对应错误消息组成的数组：

```php
/**
 * Get the error messages for the defined validation rules.
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

Laravel 内置的许多验证规则错误消息都包含 `:attribute` 占位符。如果你希望验证消息中的 `:attribute` 占位符被替换为自定义的属性名，可以通过重写 `attributes` 方法来指定自定义名称。该方法应返回一个由属性／名称对组成的数组：

```php
/**
 * Get custom attributes for validator errors.
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

如果你需要在应用验证规则之前对请求数据进行准备或净化，可以使用 `prepareForValidation` 方法：

```php
use Illuminate\Support\Str;

/**
 * Prepare the data for validation.
 */
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->slug),
    ]);
}
```

同样，如果你需要在验证完成之后对请求数据进行规范化，可以使用 `passedValidation` 方法：

```php
/**
 * Handle a passed validation attempt.
 */
protected function passedValidation(): void
{
    $this->replace(['name' => 'Taylor']);
}
```

<a name="manually-creating-validators"></a>
## 手动创建验证器

如果你不想使用请求上的 `validate` 方法，可以使用 `Validator` [Facade](/docs/{{version}}/facades) 手动创建验证器实例。该 Facade 的 `make` 方法会生成一个新的验证器实例：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    /**
     * Store a new blog post.
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

        // Retrieve the validated input...
        $validated = $validator->validated();

        // Retrieve a portion of the validated input...
        $validated = $validator->safe()->only(['name', 'email']);
        $validated = $validator->safe()->except(['name', 'email']);

        // Store the blog post...

        return redirect('/posts');
    }
}
```

传递给 `make` 方法的第一个参数是待验证的数据。第二个参数是一个由应用于该数据的验证规则组成的数组。

在判断请求验证是否失败之后，你可以使用 `withErrors` 方法将错误消息闪存到会话。使用此方法时，`$errors` 变量会在重定向后自动与你的视图共享，让你能够轻松地将其展示给用户。`withErrors` 方法接受一个验证器、一个 `MessageBag` 或一个 PHP `array`。

#### 在首次验证失败时停止

`stopOnFirstFailure` 方法会告知验证器：一旦发生一次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="automatic-redirection"></a>
### 自动重定向

如果你想手动创建验证器实例，但仍希望利用 HTTP 请求 `validate` 方法提供的自动重定向，可以在现有的验证器实例上调用 `validate` 方法。如果验证失败，用户将被自动重定向；如果传入的是 XHR 请求，则会[返回 JSON 响应](#validation-error-response-format)：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validate();
```

你可以使用 `validateWithBag` 方法，在验证失败时将错误消息存储到[命名的错误袋](#named-error-bags)中：

```php
Validator::make($request->all(), [
    'title' => 'required|unique:posts|max:255',
    'body' => 'required',
])->validateWithBag('post');
```

<a name="named-error-bags"></a>
### 命名的错误袋

如果单个页面上有多个表单，你可能希望为包含验证错误的 `MessageBag` 命名，以便获取特定表单的错误消息。为此，请将一个名称作为 `withErrors` 的第二个参数传递：

```php
return redirect('/register')->withErrors($validator, 'login');
```

然后，你可以从 `$errors` 变量访问命名的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

<a name="manual-customizing-the-error-messages"></a>
### 自定义错误消息

必要时，你可以提供自定义的错误消息，让验证器实例使用它们来替代 Laravel 提供的默认错误消息。指定自定义消息有几种方式。首先，你可以将自定义消息作为 `Validator::make` 方法的第三个参数传递：

```php
$validator = Validator::make($input, $rules, $messages = [
    'required' => 'The :attribute field is required.',
]);
```

在本例中，`:attribute` 占位符将被替换为被验证字段的实际名称。你还可以在验证消息中使用其他占位符。例如：

```php
$messages = [
    'same' => 'The :attribute and :other must match.',
    'size' => 'The :attribute must be exactly :size.',
    'between' => 'The :attribute value :input is not between :min - :max.',
    'in' => 'The :attribute must be one of the following types: :values',
];
```

<a name="specifying-a-custom-message-for-a-given-attribute"></a>
#### 为给定属性指定自定义消息

有时，你可能只想为特定属性指定自定义错误消息。这可以使用「点」记法来实现。先指定属性名，再跟上规则：

```php
$messages = [
    'email.required' => 'We need to know your email address!',
];
```

<a name="specifying-custom-attribute-values"></a>
#### 指定自定义属性值

Laravel 内置的许多错误消息都包含一个 `:attribute` 占位符，它会被替换为被验证字段或属性的名称。要自定义特定字段替换这些占位符时使用的值，可以将一个由自定义属性组成的数组作为 `Validator::make` 方法的第四个参数传递：

```php
$validator = Validator::make($input, $rules, $messages, [
    'email' => 'email address',
]);
```

<a name="performing-additional-validation"></a>
### 执行额外的验证

有时，你需要在初始验证完成之后执行额外的验证。这可以通过验证器的 `after` 方法来实现。`after` 方法接受一个闭包或一个由可调用对象组成的数组，它们会在验证完成之后被调用。给定的可调用对象会接收到一个 `Illuminate\Validation\Validator` 实例，让你能够在必要时抛出额外的错误消息：

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

如前所述，`after` 方法也接受一个由可调用对象组成的数组。如果你的「验证之后」逻辑封装在可调用类中，这种方式会特别方便，这些类将通过其 `__invoke` 方法接收到一个 `Illuminate\Validation\Validator` 实例：

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

在使用表单请求或手动创建的验证器实例验证传入请求数据之后，你可能希望获取实际经过验证的传入请求数据。这可以通过几种方式实现。首先，你可以在表单请求或验证器实例上调用 `validated` 方法。该方法返回一个由已验证数据组成的数组：

```php
$validated = $request->validated();

$validated = $validator->validated();
```

或者，你可以在表单请求或验证器实例上调用 `safe` 方法。该方法返回一个 `Illuminate\Support\ValidatedInput` 实例。该对象提供了 `only`、`except` 和 `all` 方法，用于获取已验证数据的子集或整个已验证数据数组：

```php
$validated = $request->safe()->only(['name', 'email']);

$validated = $request->safe()->except(['name', 'email']);

$validated = $request->safe()->all();
```

此外，`Illuminate\Support\ValidatedInput` 实例可以像数组一样被迭代和访问：

```php
// Validated data may be iterated...
foreach ($request->safe() as $key => $value) {
    // ...
}

// Validated data may be accessed as an array...
$validated = $request->safe();

$email = $validated['email'];
```

如果你想向已验证数据中添加额外的字段，可以调用 `merge` 方法：

```php
$validated = $request->safe()->merge(['name' => 'Taylor Otwell']);
```

如果你想以[集合](/docs/{{version}}/collections)实例的形式获取已验证数据，可以调用 `collect` 方法：

```php
$collection = $request->safe()->collect();
```

<a name="working-with-error-messages"></a>
## 处理错误消息

在 `Validator` 实例上调用 `errors` 方法后，你会得到一个 `Illuminate\Support\MessageBag` 实例，它提供了多种便捷的错误消息处理方法。自动对所有视图可用的 `$errors` 变量也是 `MessageBag` 类的实例。

<a name="retrieving-the-first-error-message-for-a-field"></a>
#### 获取字段的第一个错误消息

要获取给定字段的第一个错误消息，请使用 `first` 方法：

```php
$errors = $validator->errors();

echo $errors->first('email');
```

<a name="retrieving-all-error-messages-for-a-field"></a>
#### 获取字段的所有错误消息

如果需要获取给定字段所有消息组成的数组，请使用 `get` 方法：

```php
foreach ($errors->get('email') as $message) {
    // ...
}
```

如果你正在验证一个数组形式的字段，可以使用 `*` 字符获取每个数组元素的所有消息：

```php
foreach ($errors->get('attachments.*') as $message) {
    // ...
}
```

<a name="retrieving-all-error-messages-for-all-fields"></a>
#### 获取所有字段的所有错误消息

要获取所有字段的所有消息组成的数组，请使用 `all` 方法：

```php
foreach ($errors->all() as $message) {
    // ...
}
```

<a name="determining-if-messages-exist-for-a-field"></a>
#### 判断字段是否存在消息

`has` 方法可用于判断给定字段是否存在任何错误消息：

```php
if ($errors->has('email')) {
    // ...
}
```

<a name="specifying-custom-messages-in-language-files"></a>
### 在语言文件中指定自定义消息

Laravel 内置的每条验证规则都有一个错误消息，位于应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以指示 Laravel 使用 `lang:publish` Artisan 命令来创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则对应的翻译条目。你可以根据应用的需要自由修改这些消息。

此外，你可以将该文件复制到另一种语言的目录中，为应用的语言翻译这些消息。要进一步了解 Laravel 本地化，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="custom-messages-for-specific-attributes"></a>
#### 针对特定属性的自定义消息

你可以在应用的验证语言文件中，自定义用于特定属性与规则组合的错误消息。为此，请将你的消息自定义添加到应用 `lang/xx/validation.php` 语言文件的 `custom` 数组中：

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

Laravel 内置的许多错误消息都包含一个 `:attribute` 占位符，它会被替换为被验证字段或属性的名称。如果你希望验证消息中的 `:attribute` 部分被替换为自定义值，可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名：

```php
'attributes' => [
    'email' => 'email address',
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="specifying-values-in-language-files"></a>
### 在语言文件中指定值

Laravel 内置的一些验证规则错误消息包含一个 `:value` 占位符，它会被替换为请求属性的当前值。不过，有时你可能需要将验证消息中的 `:value` 部分替换为该值的自定义表示形式。例如，考虑下面这条规则，它指定当 `payment_type` 的值为 `cc` 时，信用卡号是必填的：

```php
Validator::make($request->all(), [
    'credit_card_number' => 'required_if:payment_type,cc'
]);
```

如果这条验证规则失败，将产生如下错误消息：

```text
The credit card number field is required when payment type is cc.
```

为了让支付类型值显示得更友好，而不直接显示 `cc`，你可以在 `lang/xx/validation.php` 语言文件中定义一个 `values` 数组，为该值指定更友好的表示形式：

```php
'values' => [
    'payment_type' => [
        'cc' => 'credit card'
    ],
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

定义这个值之后，验证规则将产生如下错误消息：

```text
The credit card number field is required when payment type is credit card.
```

<a name="available-validation-rules"></a>
## 可用的验证规则

下面是所有可用验证规则及其功能的列表：

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

[Accepted](#rule-accepted)
[Accepted If](#rule-accepted-if)
[Boolean](#rule-boolean)
[Declined](#rule-declined)
[Declined If](#rule-declined-if)

#### 字符串

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

#### 数字

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

#### 数组

[Array](#rule-array)
[Between](#rule-between)
[Contains](#rule-contains)
[Doesnt Contain](#rule-doesnt-contain)
[Distinct](#rule-distinct)
[In Array](#rule-in-array)
[In Array Keys](#rule-in-array-keys)
[List](#rule-list)
[Max](#rule-max)
[Min](#rule-min)
[Size](#rule-size)

#### 日期

[After](#rule-after)
[After Or Equal](#rule-after-or-equal)
[Before](#rule-before)
[Before Or Equal](#rule-before-or-equal)
[Date](#rule-date)
[Date Equals](#rule-date-equals)
[Date Format](#rule-date-format)
[Different](#rule-different)
[Timezone](#rule-timezone)

#### 文件

[Between](#rule-between)
[Dimensions](#rule-dimensions)
[Encoding](#rule-encoding)
[Extensions](#rule-extensions)
[File](#rule-file)
[Image](#rule-image)
[Max](#rule-max)
[Min](#rule-min)
[MIME Types](#rule-mimetypes)
[MIME Type By File Extension](#rule-mimes)
[Size](#rule-size)

#### 数据库

[Exists](#rule-exists)
[Unique](#rule-unique)

#### 实用规则

[Any Of](#rule-anyof)
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
[Prohibited If Accepted](#rule-prohibited-if-accepted)
[Prohibited If Declined](#rule-prohibited-if-declined)
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

<a name="rule-accepted"></a>
#### accepted

待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证「服务条款」的接受情况或类似字段很有用。

<a name="rule-accepted-if"></a>
#### accepted_if:anotherfield,value,...

如果待验证的另一个字段等于指定值，则待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证「服务条款」的接受情况或类似字段很有用。

<a name="rule-active-url"></a>
#### active_url

根据 `dns_get_record` PHP 函数，待验证字段必须具有有效的 A 或 AAAA 记录。所提供 URL 的主机名会先使用 `parse_url` PHP 函数提取出来，再传递给 `dns_get_record`。

<a name="rule-after"></a>
#### after:_date_

待验证字段必须是给定日期之后的值。日期会被传递给 `strtotime` PHP 函数，以便转换为有效的 `DateTime` 实例：

```php
'start_date' => 'required|date|after:tomorrow'
```

除了传递一个由 `strtotime` 求值的日期字符串，你还可以指定另一个字段来与日期进行比较：

```php
'finish_date' => 'required|date|after:start_date'
```

为了方便，基于日期的规则也可以使用流式的 `date` 规则构建器来构造：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->after(today()->addDays(7)),
],
```

`afterToday` 和 `todayOrAfter` 方法可分别用于流式表达「必须晚于今天」和「必须是今天或更晚」：

```php
'start_date' => [
    'required',
    Rule::date()->afterToday(),
],
```

<a name="rule-after-or-equal"></a>
#### after\_or\_equal:_date_

待验证字段必须是给定日期之后或等于给定日期的值。更多信息请参见 [after](#rule-after) 规则。

为了方便，基于日期的规则也可以使用流式的 `date` 规则构建器来构造：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->afterOrEqual(today()->addDays(7)),
],
```

<a name="rule-anyof"></a>
#### anyOf

`Rule::anyOf` 验证规则允许你指定待验证字段必须满足给定验证规则集中的任意一组。例如，以下规则将验证 `username` 字段是一个电子邮件地址，或是一个至少 6 个字符长的字母数字字符串（包含连字符）：

```php
use Illuminate\Validation\Rule;

'username' => [
    'required',
    Rule::anyOf([
        ['string', 'email'],
        ['string', 'alpha_dash', 'min:6'],
    ]),
],
```

<a name="rule-alpha"></a>
#### alpha

待验证字段必须全部由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 中的 Unicode 字母字符组成。

要将该验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha:ascii',
```

<a name="rule-alpha-dash"></a>
#### alpha_dash

待验证字段必须全部由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中的 Unicode 字母数字字符，以及 ASCII 连字符（`-`）和 ASCII 下划线（`_`）组成。

要将该验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_dash:ascii',
```

<a name="rule-alpha-num"></a>
#### alpha_num

待验证字段必须全部由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 和 [\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中的 Unicode 字母数字字符组成。

要将该验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），可以为验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_num:ascii',
```

<a name="rule-array"></a>
#### array

待验证字段必须是一个 PHP `array`。

当向 `array` 规则提供额外的值时，输入数组中的每个键都必须存在于提供给该规则的值列表中。在下面的示例中，输入数组中的 `admin` 键是无效的，因为它不包含在提供给 `array` 规则的值列表中：

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

一般来说，你应当始终指定允许出现在数组中的数组键。

<a name="rule-ascii"></a>
#### ascii

待验证字段必须全部是 7 位 ASCII 字符。

<a name="rule-bail"></a>
#### bail

在首次验证失败后停止运行该字段的验证规则。

`bail` 规则只会在遇到某个特定字段的验证失败时停止验证该字段，而 `stopOnFirstFailure` 方法则会告知验证器：一旦发生一次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="rule-before"></a>
#### before:_date_

待验证字段必须是早于给定日期的值。日期会被传递给 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 [after](#rule-after) 规则类似，可以将另一个待验证字段的名称作为 `date` 的值。

为了方便，基于日期的规则也可以使用流式的 `date` 规则构建器来构造：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->before(today()->subDays(7)),
],
```

`beforeToday` 和 `todayOrBefore` 方法可分别用于流式表达「必须早于今天」和「必须是今天或更早」：

```php
'start_date' => [
    'required',
    Rule::date()->beforeToday(),
],
```

<a name="rule-before-or-equal"></a>
#### before\_or\_equal:_date_

待验证字段必须是早于或等于给定日期的值。日期会被传递给 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 [after](#rule-after) 规则类似，可以将另一个待验证字段的名称作为 `date` 的值。

为了方便，基于日期的规则也可以使用流式的 `date` 规则构建器来构造：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->beforeOrEqual(today()->subDays(7)),
],
```

<a name="rule-between"></a>
#### between:_min_,_max_

待验证字段的尺寸必须在给定的 _min_ 和 _max_ 之间（含边界）。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-boolean"></a>
#### boolean

待验证字段必须能够被转换为布尔值。接受的输入有 `true`、`false`、`1`、`0`、`"1"` 和 `"0"`。

你可以使用 `strict` 参数，使该字段仅在其值为 `true` 或 `false` 时才被视为有效：

```php
'foo' => 'boolean:strict'
```

<a name="rule-confirmed"></a>
#### confirmed

待验证字段必须有一个与之匹配的 `{field}_confirmation` 字段。例如，如果待验证字段是 `password`，输入中就必须存在与之匹配的 `password_confirmation` 字段。

你也可以传递自定义的确认字段名。例如，`confirmed:repeat_username` 会期望 `repeat_username` 字段与待验证字段相匹配。

<a name="rule-contains"></a>
#### contains:_foo_,_bar_,...

待验证字段必须是一个包含所有给定参数值的数组。由于该规则通常需要你对数组执行 `implode`，因此可以使用 `Rule::contains` 方法来流式构造该规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'roles' => [
        'required',
        'array',
        Rule::contains(['admin', 'editor']),
    ],
]);
```

<a name="rule-doesnt-contain"></a>
#### doesnt_contain:_foo_,_bar_,...

待验证字段必须是一个不包含任何给定参数值的数组。由于该规则通常需要你对数组执行 `implode`，因此可以使用 `Rule::doesntContain` 方法来流式构造该规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'roles' => [
        'required',
        'array',
        Rule::doesntContain(['admin', 'editor']),
    ],
]);
```

<a name="rule-current-password"></a>
#### current_password

待验证字段必须与经过认证的用户的密码相匹配。你可以使用该规则的第一个参数指定[认证守卫](/docs/{{version}}/authentication)：

```php
'password' => 'current_password:api'
```

<a name="rule-date"></a>
#### date

根据 `strtotime` PHP 函数，待验证字段必须是一个有效的、非相对的日期。

<a name="rule-date-equals"></a>
#### date_equals:_date_

待验证字段必须等于给定的日期。日期会被传递给 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。

<a name="rule-date-format"></a>
#### date_format:_format_,...

待验证字段必须匹配给定的某种 _format_（格式）。在验证字段时，你应当使用 `date` **或者** `date_format`，而不是两者都用。该验证规则支持 PHP [DateTime](https://www.php.net/manual/en/class.datetime.php) 类支持的所有格式。

为了方便，基于日期的规则也可以使用流式的 `date` 规则构建器来构造：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->format('Y-m-d'),
],
```

<a name="rule-decimal"></a>
#### decimal:_min_,_max_

待验证字段必须是数字，且必须包含指定数量的小数位：

```php
// Must have exactly two decimal places (9.99)...
'price' => 'decimal:2'

// Must have between 2 and 4 decimal places...
'price' => 'decimal:2,4'
```

<a name="rule-declined"></a>
#### declined

待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-declined-if"></a>
#### declined_if:anotherfield,value,...

如果待验证的另一个字段等于指定值，则待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-different"></a>
#### different:_field_

待验证字段的值必须与 _field_ 不同。

<a name="rule-digits"></a>
#### digits:_value_

被验证的整数必须具有确切的 _value_ 位长度。

<a name="rule-digits-between"></a>
#### digits_between:_min_,_max_

被验证的整数的长度必须在给定的 _min_ 和 _max_ 之间。

<a name="rule-dimensions"></a>
#### dimensions

被验证的文件必须是一个满足规则参数所指定尺寸约束的图片：

```php
'avatar' => 'dimensions:min_width=100,min_height=200'
```

可用的约束有：_min\_width_、_max\_width_、_min\_height_、_max\_height_、_width_、_height_、_ratio_。

_ratio_（宽高比）约束应以宽度除以高度来表示。既可以使用 `3/2` 这样的分数，也可以使用 `1.5` 这样的浮点数来指定：

```php
'avatar' => 'dimensions:ratio=3/2'
```

由于该规则需要多个参数，使用 `Rule::dimensions` 方法来流式构造规则通常会更方便：

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

在验证数组时，待验证字段不能有任何重复的值：

```php
'foo.*.id' => 'distinct'
```

distinct 默认使用松散的变量比较。要使用严格比较，可以在验证规则定义中添加 `strict` 参数：

```php
'foo.*.id' => 'distinct:strict'
```

你可以向验证规则的参数中添加 `ignore_case`，使该规则忽略大小写差异：

```php
'foo.*.id' => 'distinct:ignore_case'
```

<a name="rule-doesnt-start-with"></a>
#### doesnt_start_with:_foo_,_bar_,...

待验证字段不能以任何给定值开头。

<a name="rule-doesnt-end-with"></a>
#### doesnt_end_with:_foo_,_bar_,...

待验证字段不能以任何给定值结尾。

<a name="rule-email"></a>
#### email

待验证字段的格式必须是电子邮件地址。该验证规则使用 [egulias/email-validator](https://github.com/egulias/EmailValidator) 软件包来验证电子邮件地址。默认情况下应用的是 `RFCValidation` 验证器，但你也可以应用其他验证风格：

```php
'email' => 'email:rfc,dns'
```

上面的示例会应用 `RFCValidation` 和 `DNSCheckValidation` 验证。以下是你可以应用的全部验证风格列表：

- `rfc`：`RFCValidation`——根据[受支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件地址。
- `strict`：`NoRFCWarningsValidation`——根据[受支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件地址，发现警告（例如结尾句点和多个连续句点）时判定为失败。
- `dns`：`DNSCheckValidation`——确保电子邮件地址的域名具有有效的 MX 记录。
- `spoof`：`SpoofCheckValidation`——确保电子邮件地址不包含同形异义或欺骗性的 Unicode 字符。
- `filter`：`FilterEmailValidation`——确保电子邮件地址符合 PHP 的 `filter_var` 函数的有效性要求。
- `filter_unicode`：`FilterEmailValidation::unicode()`——确保电子邮件地址符合 PHP 的 `filter_var` 函数的有效性要求，并允许部分 Unicode 字符。

为了方便，电子邮件验证规则也可以使用流式规则构建器来构造：

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
> `dns` 和 `spoof` 验证器需要 PHP 的 `intl` 扩展。

<a name="rule-encoding"></a>
#### encoding:*encoding_type*

待验证字段必须匹配指定的字符编码。该规则使用 PHP 的 `mb_check_encoding` 函数来验证给定文件或字符串值的编码。为了方便，`encoding` 规则可以使用 Laravel 的流式文件规则构建器来构造：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'attachment' => [
        'required',
        File::types(['csv'])
            ->encoding('utf-8'),
    ],
]);
```

<a name="rule-ends-with"></a>
#### ends_with:_foo_,_bar_,...

待验证字段必须以某个给定值结尾。

<a name="rule-enum"></a>
#### enum

`Enum` 规则是一个基于类的规则，用于验证待验证字段是否包含有效的枚举值。`Enum` 规则接受枚举的名称作为其唯一的构造函数参数。在验证原始值时，应当为 `Enum` 规则提供一个有值的（backed）枚举：

```php
use App\Enums\ServerStatus;
use Illuminate\Validation\Rule;

$request->validate([
    'status' => [Rule::enum(ServerStatus::class)],
]);
```

可以使用 `Enum` 规则的 `only` 和 `except` 方法来限制哪些枚举项应当被视为有效：

```php
Rule::enum(ServerStatus::class)
    ->only([ServerStatus::Pending, ServerStatus::Active]);

Rule::enum(ServerStatus::class)
    ->except([ServerStatus::Pending, ServerStatus::Active]);
```

可以使用 `when` 方法按条件修改 `Enum` 规则：

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

待验证字段将被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

<a name="rule-exclude-if"></a>
#### exclude_if:_anotherfield_,_value_

如果 _anotherfield_ 字段等于 _value_，则待验证字段将被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

如果需要复杂的条件排除逻辑，可以使用 `Rule::excludeIf` 方法。该方法接受一个布尔值或一个闭包。当传递闭包时，闭包应返回 `true` 或 `false`，以指示待验证字段是否应被排除：

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

除非 _anotherfield_ 字段等于 _value_，否则待验证字段将被排除在 `validate` 和 `validated` 方法返回的请求数据之外。如果 _value_ 为 `null`（`exclude_unless:name,null`），则除非比较字段为 `null` 或比较字段在请求数据中缺失，否则待验证字段将被排除。

<a name="rule-exclude-with"></a>
#### exclude_with:_anotherfield_

如果 _anotherfield_ 字段存在，则待验证字段将被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

<a name="rule-exclude-without"></a>
#### exclude_without:_anotherfield_

如果 _anotherfield_ 字段不存在，则待验证字段将被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

<a name="rule-exists"></a>
#### exists:_table_,_column_

待验证字段必须存在于给定的数据库表中。

<a name="basic-usage-of-exists-rule"></a>
#### Exists 规则的基本用法

```php
'state' => 'exists:states'
```

如果未指定 `column` 选项，将使用字段名。因此在本例中，该规则会验证 `states` 数据库表中是否存在一条记录，其 `state` 列的值与请求的 `state` 属性值相匹配。

<a name="specifying-a-custom-column-name"></a>
#### 指定自定义列名

你可以在数据库表名之后放置列名，显式指定验证规则应使用的数据库列名：

```php
'state' => 'exists:states,abbreviation'
```

有时，你可能需要为 `exists` 查询指定特定的数据库连接。这可以通过在表名前面加上连接名来实现：

```php
'email' => 'exists:connection.staff,email'
```

除了直接指定表名，你还可以指定用于确定表名的 Eloquent 模型：

```php
'user_id' => 'exists:App\Models\User,id'
```

如果你想自定义验证规则执行的查询，可以使用 `Rule` 类来流式定义该规则。在本例中，我们还将以数组形式指定验证规则，而不使用 `|` 字符进行分隔：

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

通过将列名作为 `exists` 方法的第二个参数，你可以显式指定 `Rule::exists` 方法生成的 `exists` 规则应使用的数据库列名：

```php
'state' => Rule::exists('states', 'abbreviation'),
```

有时，你可能希望验证一个值数组是否存在于数据库中。这可以通过在待验证字段上同时添加 `exists` 和 [array](#rule-array) 规则来实现：

```php
'states' => ['array', Rule::exists('states', 'abbreviation')],
```

当这两个规则同时分配给某个字段时，Laravel 会自动构建一个查询，来判断所有给定的值是否都存在于指定的表中。

<a name="rule-extensions"></a>
#### extensions:_foo_,_bar_,...

被验证的文件必须具有与所列扩展名之一对应的、由用户指定的扩展名：

```php
'photo' => ['required', 'extensions:jpg,png'],
```

> [!WARNING]
> 你绝不应当仅凭用户指定的扩展名来验证文件。该规则通常应始终与 [mimes](#rule-mimes) 或 [mimetypes](#rule-mimetypes) 规则结合使用。

<a name="rule-file"></a>
#### file

待验证字段必须是一个成功上传的文件。

<a name="rule-filled"></a>
#### filled

待验证字段在存在时不能为空。

<a name="rule-gt"></a>
#### gt:_field_

待验证字段必须大于给定的 _field_ 或 _value_。两个字段必须是同一类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-gte"></a>
#### gte:_field_

待验证字段必须大于或等于给定的 _field_ 或 _value_。两个字段必须是同一类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-hex-color"></a>
#### hex_color

待验证字段必须包含有效的[十六进制](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color)格式颜色值。

<a name="rule-image"></a>
#### image

被验证的文件必须是图片（jpg、jpeg、png、bmp、gif 或 webp）。

> [!WARNING]
> 默认情况下，由于可能存在 XSS 漏洞，image 规则不允许 SVG 文件。如果你需要允许 SVG 文件，可以为 `image` 规则提供 `allow_svg` 指令（`image:allow_svg`）。

<a name="rule-in"></a>
#### in:_foo_,_bar_,...

待验证字段必须包含在给定的值列表中。由于该规则通常需要你对数组执行 `implode`，因此可以使用 `Rule::in` 方法来流式构造该规则：

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

当 `in` 规则和 `array` 规则组合使用时，输入数组中的每个值都必须存在于提供给 `in` 规则的值列表中。在下面的示例中，输入数组中的 `LAS` 机场代码是无效的，因为它不包含在提供给 `in` 规则的机场列表中：

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

<a name="rule-in-array-keys"></a>
#### in_array_keys:_value_.*

待验证字段必须是一个数组，且至少将其中一个给定 _value_ 作为数组的键：

```php
'config' => 'array|in_array_keys:timezone'
```

<a name="rule-integer"></a>
#### integer

待验证字段必须是一个整数。

你可以使用 `strict` 参数，使该字段仅在其类型为 `integer` 时才被视为有效。值为整数的字符串将被视为无效：

```php
'age' => 'integer:strict'
```

> [!WARNING]
> 该验证规则并不验证输入是否为「integer」变量类型，只验证输入是否属于 PHP 的 `FILTER_VALIDATE_INT` 规则所接受的类型。如果你需要验证输入是一个数字，请将该规则与[`numeric` 验证规则](#rule-numeric)结合使用。

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

待验证字段必须小于给定的 _field_。两个字段必须是同一类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-lte"></a>
#### lte:_field_

待验证字段必须小于或等于给定的 _field_。两个字段必须是同一类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-lowercase"></a>
#### lowercase

待验证字段必须是小写。

<a name="rule-list"></a>
#### list

待验证字段必须是一个列表（list）形式的数组。如果一个数组的键由从 0 到 `count($array) - 1` 的连续数字组成，则该数组被视为列表。

<a name="rule-mac"></a>
#### mac_address

待验证字段必须是一个 MAC 地址。

<a name="rule-max"></a>
#### max:_value_

待验证字段必须小于或等于最大 _value_。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-max-digits"></a>
#### max_digits:_value_

被验证的整数的长度不能超过 _value_ 位。

<a name="rule-mimetypes"></a>
#### mimetypes:_text/plain_,...

被验证的文件必须匹配给定的某种 MIME 类型：

```php
'video' => 'mimetypes:video/avi,video/mpeg,video/quicktime',

'media' => 'mimetypes:image/*,video/*',
```

为了确定上传文件的 MIME 类型，框架会读取文件的内容并尝试猜测其 MIME 类型，该结果可能与客户端提供的 MIME 类型不同。

<a name="rule-mimes"></a>
#### mimes:_foo_,_bar_,...

被验证的文件必须具有与所列扩展名之一对应的 MIME 类型：

```php
'photo' => 'mimes:jpg,bmp,png'
```

尽管你只需要指定扩展名，但该规则实际上是通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="mime-types-and-extensions"></a>
#### MIME 类型与扩展名

该验证规则并不验证 MIME 类型与用户为文件指定的扩展名是否一致。例如，`mimes:png` 验证规则会将一个包含有效 PNG 内容的文件视为有效的 PNG 图片，即使该文件名为 `photo.txt`。如果你想验证文件由用户指定的扩展名，可以使用 [extensions](#rule-extensions) 规则。

<a name="rule-min"></a>
#### min:_value_

待验证字段必须具有最小 _value_。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-min-digits"></a>
#### min_digits:_value_

被验证的整数的长度不能少于 _value_ 位。

<a name="rule-multiple-of"></a>
#### multiple_of:_value_

待验证字段必须是 _value_ 的倍数。

<a name="rule-missing"></a>
#### missing

待验证字段不能出现在输入数据中。

<a name="rule-missing-if"></a>
#### missing_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则待验证字段不能存在。

<a name="rule-missing-unless"></a>
#### missing_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任何 _value_，否则待验证字段不能存在。

<a name="rule-missing-with"></a>
#### missing_with:_foo_,_bar_,...

仅当任何其他指定字段存在时，待验证字段才不能存在。

<a name="rule-missing-with-all"></a>
#### missing_with_all:_foo_,_bar_,...

仅当所有其他指定字段都存在时，待验证字段才不能存在。

<a name="rule-not-in"></a>
#### not_in:_foo_,_bar_,...

待验证字段不能包含在给定的值列表中。可以使用 `Rule::notIn` 方法来流式构造该规则：

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

在内部，该规则使用 PHP 的 `preg_match` 函数。指定的模式应当遵循 `preg_match` 所要求的格式，因此也必须包含有效的分隔符。例如：`'email' => 'not_regex:/^.+$/i'`。

> [!WARNING]
> 使用 `regex` / `not_regex` 模式时，可能需要以数组形式指定验证规则，而不使用 `|` 分隔符，尤其是在正则表达式包含 `|` 字符的情况下。

<a name="rule-nullable"></a>
#### nullable

待验证字段可以为 `null`。

<a name="rule-numeric"></a>
#### numeric

待验证字段必须是[数字](https://www.php.net/manual/en/function.is-numeric.php)。

你可以使用 `strict` 参数，使该字段仅在其值为整数或浮点类型时才被视为有效。数字字符串将被视为无效：

```php
'amount' => 'numeric:strict'
```

<a name="rule-present"></a>
#### present

待验证字段必须存在于输入数据中。

<a name="rule-present-if"></a>
#### present_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则待验证字段必须存在。

<a name="rule-present-unless"></a>
#### present_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任何 _value_，否则待验证字段必须存在。

<a name="rule-present-with"></a>
#### present_with:_foo_,_bar_,...

仅当任何其他指定字段存在时，待验证字段才必须存在。

<a name="rule-present-with-all"></a>
#### present_with_all:_foo_,_bar_,...

仅当所有其他指定字段都存在时，待验证字段才必须存在。

<a name="rule-prohibited"></a>
#### prohibited

待验证字段必须缺失或为空。如果一个字段满足以下条件之一，则被视为「空」：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-prohibited-if"></a>
#### prohibited_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则待验证字段必须缺失或为空。如果一个字段满足以下条件之一，则被视为「空」：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的上传文件。

如果需要复杂的条件禁止逻辑，可以使用 `Rule::prohibitedIf` 方法。该方法接受一个布尔值或一个闭包。当传递闭包时，闭包应返回 `true` 或 `false`，以指示待验证字段是否应被禁止：

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
<a name="rule-prohibited-if-accepted"></a>
#### prohibited_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，则待验证字段必须缺失或为空。

<a name="rule-prohibited-if-declined"></a>
#### prohibited_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，则待验证字段必须缺失或为空。

<a name="rule-prohibited-unless"></a>
#### prohibited_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，否则待验证字段必须缺失或为空。如果一个字段满足以下条件之一，则被视为「空」：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-prohibits"></a>
#### prohibits:_anotherfield_,...

如果待验证字段没有缺失且不为空，则 _anotherfield_ 中的所有字段都必须缺失或为空。如果一个字段满足以下条件之一，则被视为「空」：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-regex"></a>
#### regex:_pattern_

待验证字段必须匹配给定的正则表达式。

在内部，该规则使用 PHP 的 `preg_match` 函数。指定的模式应当遵循 `preg_match` 所要求的格式，因此也必须包含有效的分隔符。例如：`'email' => 'regex:/^.+@.+$/i'`。

> [!WARNING]
> 使用 `regex` / `not_regex` 模式时，可能需要以数组形式指定规则，而不使用 `|` 分隔符，尤其是在正则表达式包含 `|` 字符的情况下。

<a name="rule-required"></a>
#### required

待验证字段必须存在于输入数据中且不为空。如果一个字段满足以下条件之一，则被视为「空」：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为没有路径的上传文件。

<a name="rule-required-if"></a>
#### required_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则待验证字段必须存在且不为空。

如果你想为 `required_if` 规则构造更复杂的条件，可以使用 `Rule::requiredIf` 方法。该方法接受一个布尔值或一个闭包。当传递闭包时，闭包应返回 `true` 或 `false`，以指示待验证字段是否为必填：

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

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，则待验证字段必须存在且不为空。

<a name="rule-required-if-declined"></a>
#### required_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，则待验证字段必须存在且不为空。

<a name="rule-required-unless"></a>
#### required_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，否则待验证字段必须存在且不为空。这也意味着，除非 _value_ 为 `null`，否则 _anotherfield_ 必须存在于请求数据中。如果 _value_ 为 `null`（`required_unless:name,null`），则除非比较字段为 `null` 或比较字段在请求数据中缺失，否则待验证字段为必填。

<a name="rule-required-with"></a>
#### required_with:_foo_,_bar_,...

仅当任何其他指定字段存在且不为空时，待验证字段才必须存在且不为空。

<a name="rule-required-with-all"></a>
#### required_with_all:_foo_,_bar_,...

仅当所有其他指定字段都存在且不为空时，待验证字段才必须存在且不为空。

<a name="rule-required-without"></a>
#### required_without:_foo_,_bar_,...

仅当任何其他指定字段为空或不存在时，待验证字段才必须存在且不为空。

<a name="rule-required-without-all"></a>
#### required_without_all:_foo_,_bar_,...

仅当所有其他指定字段都为空或不存在时，待验证字段才必须存在且不为空。

<a name="rule-required-array-keys"></a>
#### required_array_keys:_foo_,_bar_,...

待验证字段必须是一个数组，且必须至少包含指定的键。

<a name="rule-same"></a>
#### same:_field_

给定的 _field_ 必须与待验证字段相匹配。

<a name="rule-size"></a>
#### size:_value_

待验证字段的尺寸必须与给定的 _value_ 相匹配。对于字符串数据，_value_ 对应字符数；对于数字数据，_value_ 对应给定的整数值（该属性还必须带有 `numeric` 或 `integer` 规则）；对于数组，_size_ 对应数组的 `count`；对于文件，_size_ 对应以千字节为单位的文件大小。我们来看一些示例：

```php
// Validate that a string is exactly 12 characters long...
'title' => 'size:12';

// Validate that a provided integer equals 10...
'seats' => 'integer|size:10';

// Validate that an array has exactly 5 elements...
'tags' => 'array|size:5';

// Validate that an uploaded file is exactly 512 kilobytes...
'image' => 'file|size:512';
```

<a name="rule-starts-with"></a>
#### starts_with:_foo_,_bar_,...

待验证字段必须以某个给定值开头。

<a name="rule-string"></a>
#### string

待验证字段必须是一个字符串。如果你希望允许该字段为 `null`，则应当为该字段分配 `nullable` 规则。

<a name="rule-timezone"></a>
#### timezone

根据 `DateTimeZone::listIdentifiers` 方法，待验证字段必须是一个有效的时区标识符。

也可以为该验证规则提供 [`DateTimeZone::listIdentifiers` 方法接受的参数](https://www.php.net/manual/en/datetimezone.listidentifiers.php)：

```php
'timezone' => 'required|timezone:all';

'timezone' => 'required|timezone:Africa';

'timezone' => 'required|timezone:per_country,US';
```

<a name="rule-unique"></a>
#### unique:_table_,_column_

待验证字段在给定的数据库表中必须不存在。

**指定自定义表名 / 列名：**

除了直接指定表名，你还可以指定用于确定表名的 Eloquent 模型：

```php
'email' => 'unique:App\Models\User,email_address'
```

可以使用 `column` 选项来指定该字段对应的数据库列。如果未指定 `column` 选项，将使用待验证字段的名称。

```php
'email' => 'unique:users,email_address'
```

**指定自定义数据库连接**

有时，你可能需要为验证器执行的数据库查询设置自定义连接。为此，你可以在表名前面加上连接名：

```php
'email' => 'unique:connection.users,email_address'
```

**强制 Unique 规则忽略给定的 ID：**

有时，你可能希望在唯一性验证期间忽略给定的 ID。例如，设想一个包含用户名、电子邮件地址和所在地的「更新资料」页面。你多半会希望验证电子邮件地址是唯一的。然而，如果用户只修改了名字字段而没有修改电子邮件字段，你不会希望因为用户本来就是该电子邮件地址的所有者而抛出验证错误。

为了指示验证器忽略用户的 ID，我们将使用 `Rule` 类来流式定义规则。在本例中，我们还将以数组形式指定验证规则，而不使用 `|` 字符进行分隔：

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
> 你绝不应将任何用户控制的请求输入传递给 `ignore` 方法。相反，你只应传递系统生成的唯一 ID，例如来自 Eloquent 模型实例的自增 ID 或 UUID。否则，你的应用将面临 SQL 注入攻击的风险。

除了将模型键的值传递给 `ignore` 方法，你还可以传递整个模型实例。Laravel 会自动从模型中提取键：

```php
Rule::unique('users')->ignore($user)
```

如果你的表使用的主键列名不是 `id`，可以在调用 `ignore` 方法时指定列名：

```php
Rule::unique('users')->ignore($user->id, 'user_id')
```

默认情况下，`unique` 规则会检查与被验证属性名同名的列的唯一性。不过，你也可以将不同的列名作为 `unique` 方法的第二个参数传递：

```php
Rule::unique('users', 'email_address')->ignore($user->id)
```

**添加额外的 Where 子句：**

你可以通过使用 `where` 方法自定义查询来指定额外的查询条件。例如，我们添加一个查询条件，将查询范围限定为只搜索 `account_id` 列值为 `1` 的记录：

```php
'email' => Rule::unique('users')->where(fn (Builder $query) => $query->where('account_id', 1))
```

**在唯一性检查中忽略软删除记录：**

默认情况下，unique 规则在判断唯一性时会包含软删除的记录。要将软删除记录排除在唯一性检查之外，可以调用 `withoutTrashed` 方法：

```php
Rule::unique('users')->withoutTrashed();
```

如果你的模型为软删除记录使用 `deleted_at` 以外的列名，可以在调用 `withoutTrashed` 方法时提供该列名：

```php
Rule::unique('users')->withoutTrashed('was_deleted_at');
```

<a name="rule-uppercase"></a>
#### uppercase

待验证字段必须是大写。

<a name="rule-url"></a>
#### url

待验证字段必须是一个有效的 URL。

如果你想指定应被视为有效的 URL 协议，可以将协议作为验证规则的参数传递：

```php
'url' => 'url:http,https',

'game' => 'url:minecraft,steam',
```

<a name="rule-ulid"></a>
#### ulid

待验证字段必须是一个有效的[通用字典序可排序唯一标识符](https://github.com/ulid/spec)（Universally Unique Lexicographically Sortable Identifier，ULID）。

<a name="rule-uuid"></a>
#### uuid

待验证字段必须是一个有效的 RFC 9562（版本 1、3、4、5、6、7 或 8）通用唯一标识符（UUID）。

你还可以验证给定的 UUID 匹配特定版本的 UUID 规范：

```php
'uuid' => 'uuid:4'
```

<a name="conditionally-adding-rules"></a>
## 按条件添加规则

<a name="skipping-validation-when-fields-have-certain-values"></a>
#### 当字段具有特定值时跳过验证

有时，如果另一个字段具有给定值，你可能不希望验证某个给定字段。这可以使用 `exclude_if` 验证规则来实现。在本例中，如果 `has_appointment` 字段的值为 `false`，则不会验证 `appointment_date` 和 `doctor_name` 字段：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_if:has_appointment,false|required|date',
    'doctor_name' => 'exclude_if:has_appointment,false|required|string',
]);
```

或者，你可以使用 `exclude_unless` 规则，仅当另一个字段具有给定值时才验证某个给定字段：

```php
$validator = Validator::make($data, [
    'has_appointment' => 'required|boolean',
    'appointment_date' => 'exclude_unless:has_appointment,true|required|date',
    'doctor_name' => 'exclude_unless:has_appointment,true|required|string',
]);
```

<a name="validating-when-present"></a>
#### 存在时才验证

在某些情况下，你可能希望仅当字段存在于被验证数据中时，才**对其**运行验证检查。要快速实现这一点，请在你的规则列表中添加 `sometimes` 规则：

```php
$validator = Validator::make($data, [
    'email' => 'sometimes|required|email',
]);
```

在上面的示例中，只有当 `email` 字段存在于 `$data` 数组中时，才会对其进行验证。

> [!NOTE]
> 如果你要验证的字段应当始终存在但可能为空，请查看[这条关于可选字段的说明](#a-note-on-optional-fields)。

<a name="complex-conditional-validation"></a>
#### 复杂条件验证

有时，你可能希望基于更复杂的条件逻辑来添加验证规则。例如，你可能希望仅当另一个字段的值大于 100 时才要求某个给定字段必填。或者，你可能需要两个字段仅当另一个字段存在时才具有给定值。添加这些验证规则并不麻烦。首先，使用永远不会变化的_静态规则_创建一个 `Validator` 实例：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'email' => 'required|email',
    'games' => 'required|integer|min:0',
]);
```

假设我们的 Web 应用是为游戏收藏者服务的。如果某位游戏收藏者注册了我们的应用，且其拥有的游戏超过 100 款，我们就希望他解释为什么拥有这么多游戏。例如，也许他经营着一家游戏转售店，又或者他只是喜欢收藏游戏。要按条件添加这一要求，我们可以使用 `Validator` 实例上的 `sometimes` 方法。

```php
use Illuminate\Support\Fluent;

$validator->sometimes('reason', 'required|max:500', function (Fluent $input) {
    return $input->games >= 100;
});
```

传递给 `sometimes` 方法的第一个参数是我们有条件验证的字段名。第二个参数是我们要添加的规则列表。如果作为第三个参数传递的闭包返回 `true`，就会添加这些规则。该方法让构建复杂的条件验证变得轻而易举。你甚至可以一次性为多个字段添加条件验证：

```php
$validator->sometimes(['reason', 'cost'], 'required', function (Fluent $input) {
    return $input->games >= 100;
});
```

> [!NOTE]
> 传递给闭包的 `$input` 参数是 `Illuminate\Support\Fluent` 的实例，可用于访问正在验证的输入和文件。

<a name="complex-conditional-array-validation"></a>
#### 复杂的数组条件验证

有时，你可能需要基于同一嵌套数组中另一个字段来验证某个字段，但你并不知道后者的索引。在这些情况下，你可以让闭包接收第二个参数，它是被验证数组中的当前单个元素：

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

与传递给闭包的 `$input` 参数一样，当属性数据是数组时，`$item` 参数是 `Illuminate\Support\Fluent` 的实例；否则，它是一个字符串。

<a name="validating-arrays"></a>
## 验证数组

正如 [array 验证规则文档](#rule-array)中所讨论的，`array` 规则接受一个允许的数组键列表。如果数组中存在任何额外的键，验证将会失败：

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

一般来说，你应当始终指定允许出现在数组中的数组键。否则，验证器的 `validate` 和 `validated` 方法将返回所有已验证的数据，包括该数组及其所有键，即使这些键未经其他嵌套数组验证规则验证。

<a name="validating-nested-array-input"></a>
### 验证嵌套数组输入

验证基于嵌套数组的表单输入字段并不麻烦。你可以使用「点记法」来验证数组中的属性。例如，如果传入的 HTTP 请求包含 `photos[profile]` 字段，可以这样验证它：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'photos.profile' => 'required|image',
]);
```

你还可以验证数组的每个元素。例如，要验证给定数组输入字段中的每个电子邮件地址都是唯一的，可以这样做：

```php
$validator = Validator::make($request->all(), [
    'users.*.email' => 'email|unique:users',
    'users.*.first_name' => 'required_with:users.*.last_name',
]);
```

同样，你可以在指定[语言文件中的自定义验证消息](#custom-messages-for-specific-attributes)时使用 `*` 字符，从而轻松地为基于数组的字段使用单个验证消息：

```php
'custom' => [
    'users.*.email' => [
        'unique' => 'Each user must have a unique email address',
    ]
],
```

<a name="accessing-nested-array-data"></a>
#### 访问嵌套数组数据

有时，在为属性分配验证规则时，你可能需要访问给定嵌套数组元素的值。这可以通过 `Rule::forEach` 方法来实现。`forEach` 方法接受一个闭包，该闭包会在被验证数组属性的每次迭代中被调用，并接收属性的值以及显式的、完全展开的属性名。闭包应返回一个分配给该数组元素的规则数组：

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

在验证数组时，你可能希望在应用显示的错误消息中引用验证失败项的索引或位置。为此，你可以在[自定义验证消息](#manual-customizing-the-error-messages)中包含 `:index`（从 `0` 开始）、`:position`（从 `1` 开始）或 `:ordinal-position`（从 `1st` 开始）占位符：

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

按照上面的示例，验证将会失败，用户会看到 _"Please describe photo #2."_ 这样的错误。

必要时，你还可以通过 `second-index`、`second-position`、`third-index`、`third-position` 等引用更深层的嵌套索引和位置。

```php
'photos.*.attributes.*.string' => 'Invalid attribute for photo #:second-position.',
```

<a name="validating-files"></a>
## 验证文件

Laravel 提供了多种可用于验证上传文件的验证规则，例如 `mimes`、`image`、`min` 和 `max`。虽然你在验证文件时可以随意单独指定这些规则，但 Laravel 还提供了一个流式文件验证规则构建器，你可能会觉得它很方便：

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

尽管在调用 `types` 方法时你只需要指定扩展名，但该方法实际上是通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="validating-files-file-sizes"></a>
#### 验证文件大小

为了方便，最小和最大文件大小可以指定为带有单位后缀的字符串。支持 `kb`、`mb`、`gb` 和 `tb` 后缀：

```php
File::types(['mp3', 'wav'])
    ->min('1kb')
    ->max('10mb');
```

<a name="validating-files-image-files"></a>
#### 验证图片文件

如果你的应用接受用户上传的图片，可以使用 `File` 规则的 `image` 构造方法，确保被验证的文件是一张图片（jpg、jpeg、png、bmp、gif 或 webp）。

此外，可以使用 `dimensions` 规则来限制图片的尺寸：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'photo' => [
        'required',
        File::image()
            ->min(1024)
            ->max(12 * 1024)
            ->dimensions(Rule::dimensions()->maxWidth(1000)->maxHeight(500)),
    ],
]);
```

> [!NOTE]
> 有关验证图片尺寸的更多信息，请查阅 [dimensions 规则文档](#rule-dimensions)。

> [!WARNING]
> 默认情况下，由于可能存在 XSS 漏洞，`image` 规则不允许 SVG 文件。如果你需要允许 SVG 文件，可以向 `image` 规则传递 `allowSvg: true`：`File::image(allowSvg: true)`。

<a name="validating-files-image-dimensions"></a>
#### 验证图片尺寸

你还可以验证图片的尺寸。例如，要验证上传的图片至少有 1000 像素宽、500 像素高，可以使用 `dimensions` 规则：

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
> 有关验证图片尺寸的更多信息，请查阅 [dimensions 规则文档](#rule-dimensions)。

<a name="validating-passwords"></a>
## 验证密码

为了确保密码具有足够的复杂度，你可以使用 Laravel 的 `Password` 规则对象：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

$validator = Validator::make($request->all(), [
    'password' => ['required', 'confirmed', Password::min(8)],
]);
```

`Password` 规则对象让你能够轻松自定义应用的密码复杂度要求，例如指定密码至少需要一个字母、数字、符号或大小写混合的字符：

```php
// Require at least 8 characters...
Password::min(8)

// Require at least one letter...
Password::min(8)->letters()

// Require at least one uppercase and one lowercase letter...
Password::min(8)->mixedCase()

// Require at least one number...
Password::min(8)->numbers()

// Require at least one symbol...
Password::min(8)->symbols()
```

此外，你可以使用 `uncompromised` 方法确保密码没有在公开的密码数据泄露事件中泄露过：

```php
Password::min(8)->uncompromised()
```

在内部，`Password` 规则对象使用 [k-Anonymity](https://en.wikipedia.org/wiki/K-anonymity)（k-匿名）模型，通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务判断密码是否已泄露，且不会牺牲用户的隐私或安全。

默认情况下，只要密码在数据泄露中出现过至少一次，就会被视为已泄露。你可以使用 `uncompromised` 方法的第一个参数自定义这一阈值：

```php
// Ensure the password appears less than 3 times in the same data leak...
Password::min(8)->uncompromised(3);
```

当然，你可以将上述示例中的所有方法链式调用：

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

在应用的单一位置指定密码的默认验证规则可能会带来便利。你可以使用 `Password::defaults` 方法轻松实现这一点，该方法接受一个闭包。传递给 `defaults` 方法的闭包应返回 Password 规则的默认配置。通常，`defaults` 规则应当在应用某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Validation\Rules\Password;

/**
 * Bootstrap any application services.
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

之后，当你想将默认规则应用到正在验证的某个密码时，可以不带参数地调用 `defaults` 方法：

```php
'password' => ['required', Password::defaults()],
```

有时，你可能想在默认的密码验证规则之上附加额外的验证规则。可以使用 `rules` 方法来实现：

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

Laravel 提供了多种有用的验证规则；不过，你可能希望指定一些自己的规则。注册自定义验证规则的一种方式是使用规则对象。要生成新的规则对象，可以使用 `make:rule` Artisan 命令。我们用这个命令来生成一个验证字符串是否为大写的规则。Laravel 会将新规则放置在 `app/Rules` 目录中。如果该目录不存在，Laravel 会在你执行创建规则的 Artisan 命令时自动创建它：

```shell
php artisan make:rule Uppercase
```

规则创建完成后，我们就可以定义它的行为。规则对象只包含一个方法：`validate`。该方法接收属性名、属性值，以及一个在验证失败时应被调用并接收验证错误消息的回调：

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strtoupper($value) !== $value) {
            $fail('The :attribute must be uppercase.');
        }
    }
}
```

定义好规则之后，你可以将规则对象的实例与其他验证规则一起传递给验证器，从而附加该规则：

```php
use App\Rules\Uppercase;

$request->validate([
    'name' => ['required', 'string', new Uppercase],
]);
```

#### 翻译验证消息

除了向 `$fail` 闭包提供字面量的错误消息，你还可以提供[翻译字符串键](/docs/{{version}}/localization)，并指示 Laravel 翻译该错误消息：

```php
if (strtoupper($value) !== $value) {
    $fail('validation.uppercase')->translate();
}
```

必要时，你可以将占位符替换和首选语言分别作为 `translate` 方法的第一个和第二个参数提供：

```php
$fail('validation.location')->translate([
    'value' => $this->value,
], 'fr');
```

#### 访问额外数据

如果你的自定义验证规则类需要访问其他所有正在验证的数据，可以让规则类实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。该接口要求你的类定义一个 `setData` 方法。Laravel 会（在验证继续之前）自动调用该方法，并将所有被验证的数据传递给它：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements DataAwareRule, ValidationRule
{
    /**
     * All of the data under validation.
     *
     * @var array<string, mixed>
     */
    protected $data = [];

    // ...

    /**
     * Set the data under validation.
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
     * The validator instance.
     *
     * @var \Illuminate\Validation\Validator
     */
    protected $validator;

    // ...

    /**
     * Set the current validator.
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

如果某个自定义规则的功能在整个应用中只需要用到一次，你可以使用闭包来代替规则对象。闭包接收属性名、属性值，以及一个在验证失败时应被调用的 `$fail` 回调：

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

默认情况下，当被验证的属性不存在或包含空字符串时，包括自定义规则在内的普通验证规则不会运行。例如，[unique](#rule-unique) 规则不会针对空字符串运行：

```php
use Illuminate\Support\Facades\Validator;

$rules = ['name' => 'unique:users,name'];

$input = ['name' => ''];

Validator::make($input, $rules)->passes(); // true
```

要让自定义规则在属性为空时也能运行，该规则必须隐含该属性是必填的。要快速生成新的隐式规则对象，可以使用带 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --implicit
```

> [!WARNING]
> 「隐式」规则只是_隐含_该属性是必填的。至于它是否真的将缺失或为空的属性判定为无效，由你自己决定。
