# 验证

Laravel 提供了多种不同的方式来验证应用接收到的数据。最常见的方式是使用所有传入 HTTP 请求上都提供的 `validate` 方法。不过，我们也会讨论其他的验证方式。

Laravel 内置了种类丰富的便捷验证规则，你可以将其应用于数据，甚至能验证某个值是否在指定的数据库表中唯一。我们将详细介绍每一条验证规则，让你熟悉 Laravel 的所有验证功能。

## 验证快速入门

要了解 Laravel 强大的验证功能，让我们来看一个完整的示例：验证一个表单并将错误信息显示回给用户。通过阅读这个高层概览，你将对如何使用 Laravel 验证传入的请求数据建立一个良好的整体认知：

### 定义路由

首先，假设我们在 `routes/web.php` 文件中定义了以下路由：

```php
use App\Http\Controllers\PostController;

Route::get('/post/create', [PostController::class, 'create']);
Route::post('/post', [PostController::class, 'store']);
```

`GET` 路由会显示一个表单，供用户创建一个新的博客文章；而 `POST` 路由会将新的博客文章存储到数据库中。

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
     * 显示创建新博客文章的表单。
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
        // 验证并存储博客文章……

        $post = /** ... */

        return to_route('post.show', ['post' => $post->id]);
    }
}
```

### 编写验证规则

现在，我们可以开始填充 `store` 方法，加入验证新博客文章的逻辑。我们将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，你的代码会照常继续执行；但如果验证失败，会抛出 `Illuminate\Validation\ValidationException` 异常，并自动向用户发送正确的错误响应。

如果在传统的 HTTP 请求期间验证失败，系统会生成一个重定向响应，返回上一个 URL。如果传入的请求是 XHR 请求，则会返回 包含验证错误信息的 JSON 响应。

为了更好地理解 `validate` 方法，让我们回到 `store` 方法：

```php
/**
 * 存储一篇新的博客文章。
 */
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ]);

    // 博客文章有效……

    return redirect('/posts');
}
```

如你所见，验证规则被传入了 `validate` 方法。不必担心 —— 所有可用的验证规则都在 文档中 有说明。再次强调，如果验证失败，正确的响应会自动生成；如果验证通过，我们的控制器会继续照常执行。

此外，你还可以使用 `validateWithBag` 方法验证请求，并将任何错误信息存储到 命名的错误包 中：

```php
$validated = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

#### 在首次验证失败时停止

有时，你可能希望在某个属性首次验证失败后，停止对该属性运行后续验证规则。为此，可以将 `bail` 规则分配给该属性：

```php
$request->validate([
    'title' => ['bail', 'required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

在本例中，如果 `title` 属性上的 `unique` 规则失败，`max` 规则就不会被检查。规则会按照分配的顺序进行验证。

#### 关于嵌套属性

如果传入的 HTTP 请求包含 "嵌套" 字段数据，你可以使用 "点" 记法在验证规则中指定这些字段：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'author.name' => ['required'],
    'author.description' => ['required'],
]);
```

另一方面，如果你的字段名包含字面的点号，你可以通过使用反斜杠对点号进行转义，明确阻止它被解释为 "点" 记法：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'v1\.0' => ['required'],
]);
```

### 显示验证错误

那么，如果传入的请求字段没有通过给定的验证规则会怎样？如前所述，Laravel 会自动将用户重定向回之前的位置。此外，所有的验证错误和 [请求输入](/topic/Laravel%2013.x/2ky040l9z8.html) 都会自动被 [闪存到会话](/topic/Laravel%2013.x/2ev86noyor.html) 中。

`$errors` 变量由 `Illuminate\View\Middleware\ShareErrorsFromSession` 中间件（由 `web` 中间件组提供）共享给应用的所有视图。应用该中间件后，`$errors` 变量在你的视图中始终可用，让你可以放心地假定 `$errors` 变量总是已定义且可安全使用。`$errors` 变量会是 `Illuminate\Support\MessageBag` 的一个实例。想了解更多关于使用该对象的信息，请参阅 它的文档。

因此，在我们的示例中，验证失败时用户会被重定向到控制器的 `create` 方法，让我们可以在视图中显示错误信息：

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

#### 自定义错误信息

Laravel 内置的每条验证规则都有一条错误信息，位于应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以通过 `lang:publish` Artisan 命令让 Laravel 创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则的翻译条目。你可以根据应用的需要自由更改或修改这些消息。

此外，你可以将此文件复制到另一个语言目录，为应用所用的语言翻译消息。想了解更多关于 Laravel 本地化的信息，请查阅完整的 [本地化文档](/topic/Laravel%2013.x/kpv13q298w.html)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

#### XHR 请求与验证

在本例中，我们使用了一个传统表单向应用发送数据。不过，许多应用会从由 JavaScript 驱动的前端接收 XHR 请求。在 XHR 请求期间使用 `validate` 方法时，Laravel 不会生成重定向响应，而是会生成 包含全部验证错误的 JSON 响应。该 JSON 响应会以 422 HTTP 状态码返回。

#### `@error` 指令

你可以使用 `@error` [Blade](/topic/Laravel%2013.x/wevwmrz9l2.html) 指令，快速判断某个给定属性是否存在验证错误信息。在 `@error` 指令内部，你可以输出 `$message` 变量来显示错误信息：

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

如果你在使用 命名的错误包，可以将错误包的名称作为第二个参数传给 `@error` 指令：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

### 表单数据回填

当 Laravel 因验证错误而生成重定向响应时，框架会自动将 [请求的所有输入闪存到会话](/topic/Laravel%2013.x/2ev86noyor.html) 中。这样做是为了让你能在下一次请求期间方便地访问这些输入，并回填用户尝试提交的表单。

要从上一次请求中获取被闪存的输入，可以调用 `Illuminate\Http\Request` 实例上的 `old` 方法。`old` 方法会从 [会话](/topic/Laravel%2013.x/2ev86noyor.html) 中取出之前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你在 [Blade 模板](/topic/Laravel%2013.x/wevwmrz9l2.html) 中显示旧的输入，使用 `old` 辅助函数来回填表单会更方便。如果给定字段没有旧的输入，则会返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

### 关于可选字段的说明

默认情况下，Laravel 会在应用的全局中间件栈中包含 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。因此，如果你不希望验证器将 `null` 值视为无效，通常需要将 "可选" 请求字段标记为 `nullable`。例如：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
    'publish_at' => ['nullable', 'date'],
]);
```

在本例中，我们指定 `publish_at` 字段可以是 `null`，也可以是一个有效的日期表示。如果没有在规则定义中添加 `nullable` 修饰符，验证器会将 `null` 视为无效的日期。

### 验证错误响应格式

当应用抛出 `Illuminate\Validation\ValidationException` 异常，且传入的 HTTP 请求期望得到 JSON 响应时，Laravel 会自动为你格式化错误信息，并返回 `422 Unprocessable Entity` HTTP 响应。

下面可以查看验证错误的 JSON 响应格式示例。请注意，嵌套的错误键会被扁平化为 "点" 记法格式：

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

## 表单请求验证

### 创建表单请求

对于更复杂的验证场景，你可能希望创建一个 "表单请求"。表单请求是封装了自身验证和授权逻辑的自定义请求类。要创建一个表单请求类，可以使用 `make:request` Artisan CLI 命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类会被放置在 `app/Http/Requests` 目录中。如果该目录不存在，它会在你运行 `make:request` 命令时创建。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

正如你可能猜到的那样，`authorize` 方法负责判断当前已认证的用户是否可以执行该请求所代表的操作；而 `rules` 方法返回应当应用于请求数据的验证规则：

```php
/**
 * 获取适用于该请求的验证规则。
 *
 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
 */
public function rules(): array
{
    return [
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ];
}
```

> [!NOTE]
> 你可以在 `rules` 方法的签名中类型提示任何所需的依赖。它们会通过 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 自动解析。

那么，验证规则是如何被求值的？你只需在控制器方法中对请求进行类型提示即可。传入的表单请求会在控制器方法被调用之前完成验证，这意味着你无需在控制器中塞入任何验证逻辑：

```php
/**
 * 存储一篇新的博客文章。
 */
public function store(StorePostRequest $request): RedirectResponse
{
    // 传入的请求有效……

    // 获取已验证的输入数据……
    $validated = $request->validated();

    // 获取一部分已验证的输入数据……
    $validated = $request->safe()->only(['name', 'email']);
    $validated = $request->safe()->except(['name', 'email']);

    // 存储博客文章……

    return redirect('/posts');
}
```

如果验证失败，会生成一个重定向响应，将用户送回之前的位置。错误信息也会被闪存到会话中，以便显示。如果请求是 XHR 请求，则会向用户返回带有 422 状态码的 HTTP 响应，其中包含 验证错误的 JSON 表示。

> [!NOTE]
> 需要为你的 Inertia 驱动的 Laravel 前端添加实时表单请求验证？请查看 [Laravel Precognition](/topic/Laravel%2013.x/wevwmwz9l2.html)。

#### 执行额外的验证

有时，你需要在初次验证完成后再执行额外的验证。你可以使用表单请求的 `after` 方法完成。

`after` 方法应返回一个由可调用对象或闭包组成的数组，这些对象会在验证完成后被调用。给定的可调用对象会接收到一个 `Illuminate\Validation\Validator` 实例，让你可以根据需要抛出额外的错误信息：

```php
use Illuminate\Validation\Validator;

/**
 * 获取该请求的 "after" 验证可调用对象。
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

如前所述，`after` 方法返回的数组也可以包含可调用类。这些类的 `__invoke` 方法会接收到一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;
use Illuminate\Validation\Validator;

/**
 * 获取该请求的 "after" 验证可调用对象。
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

#### 在首次验证失败时停止

通过向请求类添加 `StopOnFirstFailure` 属性，你可以告知验证器：一旦发生了单次验证失败，就应停止验证所有属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\StopOnFirstFailure;
use Illuminate\Foundation\Http\FormRequest;

#[StopOnFirstFailure]
class StorePostRequest extends FormRequest
{
    // ...
}
```

#### 在遇到未知字段时失败

通过向请求类添加 `FailOnUnknownFields` 属性，你可以指示 Laravel 拒绝任何未被请求验证规则定义的传入字段：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\FailOnUnknownFields;
use Illuminate\Foundation\Http\FormRequest;

#[FailOnUnknownFields]
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'body' => ['required', 'string'],
        ];
    }
}
```

你也可以从 `AppServiceProvider` 中全局为所有表单请求启用这一行为：

```php
use Illuminate\Foundation\Http\FormRequest;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    FormRequest::failOnUnknownFields();
}
```

如果需要，你可以通过向该属性传入 `false`，为某个特定请求禁用这一行为：

```php
#[FailOnUnknownFields(false)]
class PublicWebhookRequest extends FormRequest
{
    // ...
}
```

拒绝未知字段可以通过阻止意外的输入键深入你的应用，为批量赋值类问题提供额外的防护。不过，你仍应配置模型的 `$fillable` / `$guarded` 属性，并且只持久化受信任的、已验证的输入。

#### 自定义重定向位置

当表单请求验证失败时，会生成一个重定向响应，将用户送回之前的位置。不过，你可以自由自定义这一行为。为此，可以在表单请求上使用 `RedirectTo` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\RedirectTo;
use Illuminate\Foundation\Http\FormRequest;

#[RedirectTo('/dashboard')]
class StorePostRequest extends FormRequest
{
    // ...
}
```

或者，如果你想将用户重定向到一个命名路由，可以改用 `RedirectToRoute` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\RedirectToRoute;
use Illuminate\Foundation\Http\FormRequest;

#[RedirectToRoute('dashboard')]
class StorePostRequest extends FormRequest
{
    // ...
}
```

#### 自定义错误包

当表单请求验证失败时，错误信息会被闪存到 `default` 错误包中。如果你需要将错误信息存储到不同的 命名错误包，可以在表单请求上使用 `ErrorBag` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\ErrorBag;
use Illuminate\Foundation\Http\FormRequest;

#[ErrorBag('login')]
class LoginRequest extends FormRequest
{
    // ...
}
```

### 表单请求的授权

表单请求类还包含一个 `authorize` 方法。在该方法内部，你可以判断已认证的用户是否真的有权限更新某个给定资源。例如，你可以判断用户是否真的拥有他试图更新的某条博客评论。很可能，你会在这个方法中与你的 [授权 gate 和策略](/topic/Laravel%2013.x/2wy3l43ykm.html) 交互：

```php
use App\Models\Comment;

/**
 * 判断用户是否有权进行此请求。
 */
public function authorize(): bool
{
    $comment = Comment::find($this->route('comment'));

    return $comment && $this->user()->can('update', $comment);
}
```

由于所有表单请求都继承自 Laravel 基础的请求类，我们可以使用 `user` 方法来访问当前已认证的用户。另外，请注意上例中调用了 `route` 方法。该方法让你可以访问被调用路由上定义的 URI 参数，例如下例中的 `{comment}` 参数：

```php
Route::post('/comment/{comment}');
```

因此，如果你的应用利用了 [路由模型绑定](/topic/Laravel%2013.x/dgy7xg5vw2.html)，你可以通过像访问请求的属性一样访问已解析的模型，让代码更加简洁：

```php
return $this->user()->can('update', $this->comment);
```

如果 `authorize` 方法返回 `false`，会自动返回一个带有 403 状态码的 HTTP 响应，你的控制器方法不会被执行。

如果你打算在应用的其他部分处理该请求的授权逻辑，可以完全移除 `authorize` 方法，或者直接返回 `true`：

```php
/**
 * 判断用户是否有权进行此请求。
 */
public function authorize(): bool
{
    return true;
}
```

> [!NOTE]
> 你可以在 `authorize` 方法的签名中类型提示任何所需的依赖。它们会通过 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 自动解析。

### 自定义错误信息

你可以通过重写 `messages` 方法，自定义表单请求使用的错误信息。该方法应返回一个由属性 / 规则对及其对应错误信息组成的数组：

```php
/**
 * 获取已定义验证规则的错误信息。
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

#### 自定义验证属性

Laravel 许多内置的验证规则错误信息都包含一个 `:attribute` 占位符。如果你想让验证信息中的 `:attribute` 占位符被替换为自定义的属性名称，可以通过重写 `attributes` 方法来指定自定义名称。该方法应返回一个由属性 / 名称对组成的数组：

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

### 为验证准备输入

如果你需要在应用验证规则之前，对请求中的某些数据进行准备或清理，可以使用 `prepareForValidation` 方法：

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

同样地，如果你需要在验证完成后规范化任何请求数据，可以使用 `passedValidation` 方法：

```php
/**
 * 处理一次通过的验证尝试。
 */
protected function passedValidation(): void
{
    $this->replace(['name' => 'Taylor']);
}
```

## 手动创建验证器

如果你不想使用请求上的 `validate` 方法，可以使用 `Validator` [Facade](/topic/Laravel%2013.x/569x508yep.html) 手动创建一个验证器实例。Facade 上的 `make` 方法会生成一个新的验证器实例：

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
            'title' => ['required', 'unique:posts', 'max:255'],
            'body' => ['required'],
        ]);

        if ($validator->fails()) {
            return redirect('/post/create')
                ->withErrors($validator)
                ->withInput();
        }

        // 获取已验证的输入……
        $validated = $validator->validated();

        // 获取一部分已验证的输入……
        $validated = $validator->safe()->only(['name', 'email']);
        $validated = $validator->safe()->except(['name', 'email']);

        // 存储博客文章……

        return redirect('/posts');
    }
}
```

传给 `make` 方法的第一个参数是待验证的数据。第二个参数是一个应用于该数据的验证规则数组。

在判断请求验证是否失败后，你可以使用 `withErrors` 方法将错误信息闪存到会话中。使用该方法时，`$errors` 变量在重定向后会自动共享给你的视图，让你可以轻松地将它们显示回给用户。`withErrors` 方法接受验证器、`MessageBag` 或 PHP `array`。

#### 在首次验证失败时停止

`stopOnFirstFailure` 方法会告知验证器：一旦发生了单次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

### 自动重定向

如果你想手动创建一个验证器实例，但仍想利用 HTTP 请求 `validate` 方法所提供的自动重定向，可以调用现有验证器实例上的 `validate` 方法。如果验证失败，用户会自动被重定向，或者在 XHR 请求的情况下，返回 JSON 响应：

```php
Validator::make($request->all(), [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
])->validate();
```

如果验证失败，你可以使用 `validateWithBag` 方法将错误信息存储到 命名错误包 中：

```php
Validator::make($request->all(), [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
])->validateWithBag('post');
```

### 命名的错误包

如果你的单个页面上有多个表单，你可能希望为包含验证错误的 `MessageBag` 命名，以便检索某个特定表单的错误信息。为此，请将名称作为第二个参数传给 `withErrors`：

```php
return redirect('/register')->withErrors($validator, 'login');
```

然后，你可以从 `$errors` 变量中访问命名的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

### 自定义错误信息

如果需要，你可以提供验证器实例应当使用的自定义错误信息，以替代 Laravel 提供的默认错误信息。有多种方式可以指定自定义消息。首先，你可以将自定义消息作为第三个参数传给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages = [
    'required' => 'The :attribute field is required.',
]);
```

在本例中，`:attribute` 占位符会被替换为待验证字段的实际名称。你还可以在验证消息中使用其他占位符。例如：

```php
$messages = [
    'same' => 'The :attribute and :other must match.',
    'size' => 'The :attribute must be exactly :size.',
    'between' => 'The :attribute value :input is not between :min - :max.',
    'in' => 'The :attribute must be one of the following types: :values',
];
```

#### 为给定属性指定自定义消息

有时，你可能希望仅为某个特定属性指定一条自定义错误信息。你可以使用 "点" 记法来完成。先指定属性名称，后接规则：

```php
$messages = [
    'email.required' => 'We need to know your email address!',
];
```

#### 指定自定义属性值

Laravel 许多内置的错误信息都包含一个 `:attribute` 占位符，该占位符会被替换为待验证字段或属性的名称。要为特定字段自定义用于替换这些占位符的值，可以将一个自定义属性数组作为第四个参数传给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages, [
    'email' => 'email address',
]);
```

### 执行额外的验证

有时，你需要在初次验证完成后再执行额外的验证。你可以使用验证器的 `after` 方法完成。该方法接受一个闭包或一个由可调用对象组成的数组，这些对象会在验证完成后被调用。给定的可调用对象会接收到一个 `Illuminate\Validation\Validator` 实例，让你可以根据需要抛出额外的错误信息：

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

如前所述，`after` 方法也接受一个由可调用对象组成的数组，当你的 "验证后" 逻辑被封装在可调用类中时，这会特别方便 —— 这些类会通过它们的 `__invoke` 方法接收到一个 `Illuminate\Validation\Validator` 实例：

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

## 使用已验证的输入

使用表单请求或手动创建的验证器实例验证传入的请求数据后，你可能希望取出实际经过验证的传入请求数据。这可以通过几种方式完成。首先，你可以在表单请求或验证器实例上调用 `validated` 方法。该方法返回经过验证的数据数组：

```php
$validated = $request->validated();

$validated = $validator->validated();
```

或者，你可以在表单请求或验证器实例上调用 `safe` 方法。该方法返回 `Illuminate\Support\ValidatedInput` 的一个实例。该对象暴露了 `only`、`except` 和 `all` 方法，用于取出已验证数据的一个子集，或整个已验证数据数组：

```php
$validated = $request->safe()->only(['name', 'email']);

$validated = $request->safe()->except(['name', 'email']);

$validated = $request->safe()->all();
```

此外，`Illuminate\Support\ValidatedInput` 实例可以像数组一样被遍历和访问：

```php
// 已验证数据可以被遍历……
foreach ($request->safe() as $key => $value) {
    // ...
}

// 已验证数据可以像数组一样被访问……
$validated = $request->safe();

$email = $validated['email'];
```

如果你想向已验证的数据添加额外的字段，可以调用 `merge` 方法：

```php
$validated = $request->safe()->merge(['name' => 'Taylor Otwell']);
```

如果你想以 [集合](/topic/Laravel%2013.x/4rvgn63ydj.html) 实例的形式取出已验证的数据，可以调用 `collect` 方法：

```php
$collection = $request->safe()->collect();
```

## 使用错误信息

在 `Validator` 实例上调用 `errors` 方法后，你会收到一个 `Illuminate\Support\MessageBag` 实例，它提供了多种用于处理错误信息的便捷方法。自动提供给所有视图的 `$errors` 变量，同样是 `MessageBag` 类的一个实例。

#### 获取字段的第一条错误信息

要获取某个给定字段的第一条错误信息，可以使用 `first` 方法：

```php
$errors = $validator->errors();

echo $errors->first('email');
```

#### 获取字段的全部错误信息

如果你需要取出某个给定字段的所有消息组成的数组，可以使用 `get` 方法：

```php
foreach ($errors->get('email') as $message) {
    // ...
}
```

如果你正在验证一个数组形式的字段，可以使用 `*` 字符取出数组每个元素的全部消息：

```php
foreach ($errors->get('attachments.*') as $message) {
    // ...
}
```

#### 获取所有字段的全部错误信息

要取出所有字段的全部消息组成的数组，可以使用 `all` 方法：

```php
foreach ($errors->all() as $message) {
    // ...
}
```

#### 判断字段是否存在错误信息

`has` 方法可用于判断某个给定字段是否存在任何错误信息：

```php
if ($errors->has('email')) {
    // ...
}
```

### 在语言文件中指定自定义消息

Laravel 内置的每条验证规则都有一条错误信息，位于应用的 `lang/en/validation.php` 文件中。如果你的应用没有 `lang` 目录，可以通过 `lang:publish` Artisan 命令让 Laravel 创建它。

在 `lang/en/validation.php` 文件中，你会找到每条验证规则的翻译条目。你可以根据应用的需要自由更改或修改这些消息。

此外，你可以将此文件复制到另一个语言目录，为应用所用的语言翻译消息。想了解更多关于 Laravel 本地化的信息，请查阅完整的 [本地化文档](/topic/Laravel%2013.x/kpv13q298w.html)。

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

#### 针对特定属性的自定义消息

你可以在应用的验证语言文件中，自定义用于指定属性和规则组合的错误信息。为此，请将你的消息自定义内容添加到应用 `lang/xx/validation.php` 语言文件的 `custom` 数组中：

```php
'custom' => [
    'email' => [
        'required' => 'We need to know your email address!',
        'max' => 'Your email address is too long!'
    ],
],
```

### 在语言文件中指定属性

Laravel 许多内置的错误信息都包含一个 `:attribute` 占位符，该占位符会被替换为待验证字段或属性的名称。如果你希望验证信息中的 `:attribute` 部分被替换为自定义值，可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名称：

```php
'attributes' => [
    'email' => 'email address',
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

### 在语言文件中指定值

Laravel 某些内置验证规则的错误信息包含一个 `:value` 占位符，该占位符会被替换为请求属性的当前值。不过，你有时可能需要将验证信息中的 `:value` 部分替换为该值的自定义表示。例如，考虑以下规则：它指定当 `payment_type` 的值为 `cc` 时，信用卡号为必填项：

```php
Validator::make($request->all(), [
    'credit_card_number' => ['required_if:payment_type,cc']
]);
```

如果该验证规则失败，会产生以下错误信息：

```text
The credit card number field is required when payment type is cc.
```

你可以不在支付类型值处显示 `cc`，而是在 `lang/xx/validation.php` 语言文件中通过定义一个 `values` 数组，指定一个更友好的值表示：

```php
'values' => [
    'payment_type' => [
        'cc' => 'credit card'
    ],
],
```

> [!WARNING]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

定义这个值之后，验证规则会产生以下错误信息：

```text
The credit card number field is required when payment type is credit card.
```

## 可用的验证规则

下面是所有可用验证规则及其功能的列表：

#### 布尔值

Accepted
Accepted If
Boolean
Declined
Declined If

#### 字符串

Active URL
Alpha
Alpha Dash
Alpha Numeric
Ascii
Confirmed
Current Password
Different
Doesnt Start With
Doesnt End With
Email
Ends With
Enum
Hex Color
In
IP Address
JSON
Lowercase
MAC Address
Max
Min
Not In
Regular Expression
Not Regular Expression
Same
Size
Starts With
String
Uppercase
URL
ULID
UUID

#### 数字

Between
Decimal
Different
Digits
Digits Between
Greater Than
Greater Than Or Equal
Integer
Less Than
Less Than Or Equal
Max
Max Digits
Min
Min Digits
Multiple Of
Numeric
Same
Size

#### 数组

Array
Array Keys
Between
Contains
Doesnt Contain
Distinct
In Array
In Array Keys
List
Max
Min
Size

#### 日期

After
After Or Equal
Before
Before Or Equal
Date
Date Equals
Date Format
Different
Timezone

#### 文件

Between
Dimensions
Encoding
Extensions
File
Image
Max
Min
MIME Types
MIME Type By File Extension
Size

#### 数据库

Exists
Unique

#### 工具类

Any Of
Bail
Exclude
Exclude If
Exclude Unless
Exclude With
Exclude Without
Filled
Missing
Missing If
Missing Unless
Missing With
Missing With All
Nullable
Present
Present If
Present Unless
Present With
Present With All
Prohibited
Prohibited If
Prohibited If Accepted
Prohibited If Declined
Prohibited Unless
Prohibits
Required
Required If
Required If Accepted
Required If Declined
Required Unless
Required With
Required With All
Required Without
Required Without All
Required Array Keys
Sometimes

#### accepted

待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证 "服务条款" 同意或类似字段很有用。

#### accepted_if:anotherfield,value,...

如果另一个待验证字段等于指定值，待验证字段必须是 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证 "服务条款" 同意或类似字段很有用。

#### active_url

根据 PHP 的 `dns_get_record` 函数，待验证字段必须具有有效的 A 或 AAAA 记录。在传入 `dns_get_record` 之前，所提供的 URL 主机名会通过 PHP 的 `parse_url` 函数提取。

在测试会执行 DNS 查询的验证规则（如 `active_url` 和 `email:dns`）时，可以使用 `Validator::fakeDnsLookups` 方法。这会在保留规则其他验证行为的同时，伪造 DNS 查询：

```php
use Illuminate\Support\Facades\Validator;

Validator::fakeDnsLookups();
```

#### after:_date_

待验证字段必须是给定日期之后的值。日期会被传入 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例：

```php
'start_date' => ['required', 'date', 'after:tomorrow']
```

除了传入由 `strtotime` 求值的日期字符串，你还可以指定另一个字段与日期进行比较：

```php
'finish_date' => ['required', 'date', 'after:start_date']
```

为方便起见，可以使用流畅的 `date` 规则构造器来构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->after(today()->addDays(7)),
],
```

`afterToday` 和 `todayOrAfter` 方法可用于流畅地表达日期必须晚于今天，或今天及之后：

```php
'start_date' => [
    'required',
    Rule::date()->afterToday(),
],
```

#### after\_or\_equal:_date_

待验证字段必须是给定日期当天或之后的值。更多信息，请参阅 after 规则。

为方便起见，可以使用流畅的 `date` 规则构造器来构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->afterOrEqual(today()->addDays(7)),
],
```

#### anyOf

`Rule::anyOf` 验证规则允许你指定：待验证字段必须满足给定验证规则集中的任意一条。例如，以下规则会验证 `username` 字段是一个邮箱地址，或一个至少 6 个字符长（包含连字符）的字母数字字符串：

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

#### alpha

待验证字段必须完全由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 所包含的 Unicode 字母字符组成。

要将此验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），可以向验证规则提供 `ascii` 选项：

```php
'username' => ['alpha:ascii'],
```

#### alpha_dash

待验证字段必须完全由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=)，以及 ASCII 连字符（`-`）和 ASCII 下划线（`_`）所包含的 Unicode 字母数字字符组成。

要将此验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），可以向验证规则提供 `ascii` 选项：

```php
'username' => ['alpha_dash:ascii'],
```

#### alpha_num

待验证字段必须完全由 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 所包含的 Unicode 字母数字字符组成。

要将此验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），可以向验证规则提供 `ascii` 选项：

```php
'username' => ['alpha_num:ascii'],
```

#### array

待验证字段必须是一个 PHP `array`。

当向 `array` 规则提供额外的值时，输入数组中的每个键都必须出现在提供给规则的值列表中。在下面的示例中，输入数组中的 `admin` 键是无效的，因为它没有包含在提供给 `array` 规则的值列表中：

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
    'user' => ['array:name,username'],
]);
```

一般来说，你应该始终指定允许出现在数组中的数组键。

#### array_keys:_foo_,_bar_,...

待验证字段必须是一个 PHP `array`，且其所有键都包含在给定列表中。必须至少提供一个键：

```php
'user' => ['array_keys:name,username'],
```

为方便起见，你可以使用 `Rule::arrayKeys` 方法：

```php
'user' => [Rule::arrayKeys('name', 'username')],
```

#### ascii

待验证字段必须完全由 7 位 ASCII 字符组成。

#### bail

在首次验证失败后，停止运行该字段的验证规则。

虽然 `bail` 规则只会在遇到验证失败时停止验证特定字段，但 `stopOnFirstFailure` 方法会告知验证器：一旦发生了单次验证失败，就应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

#### before:_date_

待验证字段必须是给定日期之前的值。日期会被传入 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 after 规则一样，可以提供另一个待验证字段的名称作为 `date` 的值。

为方便起见，也可以使用流畅的 `date` 规则构造器来构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->before(today()->subDays(7)),
],
```

`beforeToday` 和 `todayOrBefore` 方法可用于流畅地表达日期必须早于今天，或今天及之前：

```php
'start_date' => [
    'required',
    Rule::date()->beforeToday(),
],
```

#### before\_or\_equal:_date_

待验证字段必须是给定日期当天或之前的值。日期会被传入 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 after 规则一样，可以提供另一个待验证字段的名称作为 `date` 的值。

为方便起见，也可以使用流畅的 `date` 规则构造器来构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->beforeOrEqual(today()->subDays(7)),
],
```

#### between:_min_,_max_

待验证字段的大小必须介于给定的 _min_ 和 _max_ 之间（含边界）。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### boolean

待验证字段必须能够被转换为布尔值。可接受输入为 `true`、`false`、`1`、`0`、`"1"` 和 `"0"`。

你可以使用 `strict` 参数，仅在该字段值为 `true` 或 `false` 时才视为有效：

```php
'foo' => ['boolean:strict']
```

#### confirmed

待验证字段必须具有一个匹配的 `{field}_confirmation` 字段。例如，如果待验证字段是 `password`，则输入中必须存在一个匹配的 `password_confirmation` 字段。

你也可以传入一个自定义的确认字段名称。例如，`confirmed:repeat_username` 会期望 `repeat_username` 字段与待验证字段相匹配。

#### contains:_foo_,_bar_,...

待验证字段必须是一个包含全部给定参数值的数组。由于此规则通常要求你对数组执行 `implode`，可以使用 `Rule::contains` 方法来流畅地构建规则：

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

#### doesnt_contain:_foo_,_bar_,...

待验证字段必须是一个不包含任何给定参数值的数组。由于此规则通常要求你对数组执行 `implode`，可以使用 `Rule::doesntContain` 方法来流畅地构建规则：

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

#### current_password

待验证字段必须与已认证用户的密码相匹配。可以使用规则的第一个参数指定一个 [认证 guard](/topic/Laravel%2013.x/xq9zrgjvdo.html)：

```php
'password' => ['current_password:api']
```

#### date

待验证字段必须是根据 PHP 的 `strtotime` 函数得出的一个有效、非相对的日期。

#### date_equals:_date_

待验证字段必须等于给定日期。日期会被传入 PHP 的 `strtotime` 函数，以便转换为有效的 `DateTime` 实例。

#### date_format:_format_,...

待验证字段必须与给定的某个 _format_ 相匹配。验证字段时应使用 **要么** `date` **要么** `date_format`，而不是两者都用。此验证规则支持 PHP [DateTime](https://www.php.net/manual/en/class.datetime.php) 类支持的所有格式。

为方便起见，也可以使用流畅的 `date` 规则构造器来构建基于日期的规则：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->format('Y-m-d'),
],
```

#### decimal:_min_,_max_

待验证字段必须是数字，且必须包含指定数量的小数位：

```php
// 必须正好有两位小数位（9.99）……
'price' => ['decimal:2']

// 必须有 2 到 4 位小数位……
'price' => ['decimal:2,4']
```

#### declined

待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

#### declined_if:anotherfield,value,...

如果另一个待验证字段等于指定值，待验证字段必须是 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

#### different:_field_

待验证字段必须具有与 _field_ 不同的值。

#### digits:_value_

待验证的整数必须具有精确的 _value_ 长度。

#### digits_between:_min_,_max_

待验证的整数长度必须介于给定的 _min_ 和 _max_ 之间。

#### dimensions

待验证的文件必须是一张满足规则参数所指定尺寸约束的图片：

```php
'avatar' => ['dimensions:min_width=100,min_height=200']
```

可用的约束有：_min\_width_、_max\_width_、_min\_height_、_max\_height_、_width_、_height_、_ratio_、_min\_ratio_、_max\_ratio_。

_ratio_ 约束应表示为宽度除以高度。它可以用分数（如 `3/2`）或浮点数（如 `1.5`）来指定：

```php
'avatar' => ['dimensions:ratio=3/2']
```

_min\_ratio_ 和 _max\_ratio_ 约束可用于定义一个可接受的宽高比范围：

```php
'avatar' => ['dimensions:min_ratio=1/2,max_ratio=3/2']
```

由于此规则需要多个参数，使用 `Rule::dimensions` 方法来流畅地构建规则通常会更方便：

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

你也可以使用 `minRatio`、`maxRatio` 和 `ratioBetween` 方法来流畅地定义宽高比约束：

```php
Rule::dimensions()->ratioBetween(min: 1 / 2, max: 3 / 2)
```

#### distinct

验证数组时，待验证字段不能有重复的值：

```php
'foo.*.id' => ['distinct']
```

默认情况下，`distinct` 使用宽松的变量比较。要使用严格比较，可以向验证规则定义添加 `strict` 参数：

```php
'foo.*.id' => ['distinct:strict']
```

你可以向验证规则的参数添加 `ignore_case`，让规则忽略大小写差异：

```php
'foo.*.id' => ['distinct:ignore_case']
```

#### doesnt_start_with:_foo_,_bar_,...

待验证字段不能以给定值中的任意一个开头。

#### doesnt_end_with:_foo_,_bar_,...

待验证字段不能以给定值中的任意一个结尾。

#### email

待验证字段必须被格式化为电子邮件地址。此验证规则使用 [egulias/email-validator](https://github.com/egulias/EmailValidator) 包来验证电子邮件地址。默认会应用 `RFCValidation` 验证器，但你也可以应用其他验证风格：

```php
'email' => ['email:rfc,dns']
```

上面的示例会应用 `RFCValidation` 和 `DNSCheckValidation` 验证。以下是你可以应用的所有验证风格列表：

- `rfc`：`RFCValidation` —— 根据 [支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件地址。
- `strict`：`NoRFCWarningsValidation` —— 根据 [支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件，并在发现警告（例如末尾句号和多个连续句号）时判定失败。
- `dns`：`DNSCheckValidation` —— 确保电子邮件地址的域具有有效的 MX 记录。
- `spoof`：`SpoofCheckValidation` —— 确保电子邮件地址不包含同形异义字或欺骗性的 Unicode 字符。
- `filter`：`FilterEmailValidation` —— 根据 PHP 的 `filter_var` 函数确保电子邮件地址有效。
- `filter_unicode`：`FilterEmailValidation::unicode()` —— 根据 PHP 的 `filter_var` 函数确保电子邮件地址有效，同时允许部分 Unicode 字符。

为方便起见，可以使用流畅的规则构造器构建电子邮件验证规则：

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

`dns` 验证器会执行一次真实的 DNS 查询，以确认地址的域具有有效的 MX 记录。它不会判断单个邮箱是否存在。

由于你的测试不应依赖实时的 DNS 查询，可以使用 `Validator::fakeDnsLookups` 方法 伪造 DNS 查询，同时其他被请求的验证（如 `rfc`）继续运行：

```php
use Illuminate\Support\Facades\Validator;

Validator::fakeDnsLookups();
```

这样，你的应用可以在测试时继续使用现有的验证规则：

```php
'email' => ['required', 'email:rfc,dns'],
```

> [!WARNING]
> `dns` 和 `spoof` 验证器需要 PHP 的 `intl` 扩展。

#### encoding:*encoding_type*

待验证字段必须与指定的字符编码相匹配。此规则使用 PHP 的 `mb_check_encoding` 函数来验证给定文件或字符串值的编码。为方便起见，可以使用 Laravel 流畅的文件规则构造器来构建 `encoding` 规则：

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

#### ends_with:_foo_,_bar_,...

待验证字段必须以给定值中的某一个结尾。

#### enum

`Enum` 规则是一个基于类的规则，用于验证待验证字段是否包含一个有效的枚举值。`Enum` 规则接受枚举的名称作为其唯一的构造函数参数。在验证基本类型值时，应向 `Enum` 规则提供一个带值的枚举（backed Enum）：

```php
use App\Enums\ServerStatus;
use Illuminate\Validation\Rule;

$request->validate([
    'status' => [Rule::enum(ServerStatus::class)],
]);
```

`Enum` 规则的 `only` 和 `except` 方法可用于限制哪些枚举 case 应被视为有效：

```php
Rule::enum(ServerStatus::class)
    ->only([ServerStatus::Pending, ServerStatus::Active]);

Rule::enum(ServerStatus::class)
    ->except([ServerStatus::Pending, ServerStatus::Active]);
```

`when` 方法可用于有条件地修改 `Enum` 规则：

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

#### exclude

待验证字段会被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

#### exclude_if:_anotherfield_,_value_

如果 _anotherfield_ 字段等于 _value_，待验证字段会被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

如果需要复杂的条件排除逻辑，可以使用 `Rule::excludeIf` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示是否应排除待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::excludeIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::excludeIf(fn () => $request->user()->is_admin)],
]);
```

#### exclude_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于 _value_，否则待验证字段会被排除在 `validate` 和 `validated` 方法返回的请求数据之外。如果 _value_ 是 `null`（`exclude_unless:name,null`），则除非比较字段为 `null` 或比较字段在请求数据中缺失，否则待验证字段会被排除。

如果需要复杂的条件排除逻辑，可以使用 `Rule::excludeUnless` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示是否不应排除待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::excludeUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::excludeUnless(fn () => $request->user()->is_admin)],
]);
```

#### exclude_with:_anotherfield_

如果 _anotherfield_ 字段存在，待验证字段会被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

#### exclude_without:_anotherfield_

如果 _anotherfield_ 字段不存在，待验证字段会被排除在 `validate` 和 `validated` 方法返回的请求数据之外。

#### exists:_table_,_column_

待验证字段必须存在于给定的数据库表中。

#### 使用 Exists 规则的基本用法

```php
'state' => ['exists:states']
```

如果未指定 `column` 选项，将使用字段名。因此，在本例中，规则会验证 `states` 数据库表是否包含一条 `state` 列的值与请求的 `state` 属性值相匹配的记录。

#### 指定自定义列名

你可以通过将数据库列名放在数据库表名之后，显式指定验证规则应当使用的数据库列名：

```php
'state' => ['exists:states,abbreviation']
```

有时，你可能需要为 `exists` 查询指定一个特定的数据库连接。你可以将连接名作为前缀加到表名前来完成：

```php
'email' => ['exists:connection.staff,email']
```

除了直接指定表名，你还可以指定应当用于确定表名的 Eloquent 模型：

```php
'user_id' => ['exists:App\Models\User,id']
```

如果你想自定义验证规则执行的查询，可以使用 `Rule` 类来流畅地定义规则。

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

你可以通过向 `exists` 方法的 `Rule::exists` 提供列名作为第二个参数，显式指定由 `Rule::exists` 方法生成的 `exists` 规则所使用的数据库列名：

```php
'state' => [Rule::exists('states', 'abbreviation')],
```

有时，你可能希望验证一组值是否存在于数据库中。为此，可以将 `exists` 规则和 array 规则都添加到待验证字段上：

```php
'states' => ['array', Rule::exists('states', 'abbreviation')],
```

当这两个规则都被分配给一个字段时，Laravel 会自动构建单个查询，以确定所有给定值是否存在于指定的表中。

#### extensions:_foo_,_bar_,...

待验证的文件必须具有与所列扩展名之一相对应的、由用户指定的扩展名：

```php
'photo' => ['required', 'extensions:jpg,png'],
```

> [!WARNING]
> 你绝不应仅依赖通过用户指定的扩展名来验证文件。此规则通常应始终与 mimes 或 mimetypes 规则结合使用。

#### file

待验证字段必须是一个成功上传的文件。

#### filled

待验证字段在存在时不能为空。

#### gt:_field_

待验证字段必须大于给定的 _field_ 或 _value_。两个字段必须是相同类型。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### gte:_field_

待验证字段必须大于或等于给定的 _field_ 或 _value_。两个字段必须是相同类型。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### hex_color

待验证字段必须包含一个 [十六进制](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color) 格式的有效颜色值。

#### image

待验证的文件必须是一张图片（jpg、jpeg、png、bmp、gif 或 webp）。

> [!WARNING]
> 默认情况下，image 规则由于存在 XSS 漏洞风险而不允许 SVG 文件。如果你需要允许 SVG 文件，可以向 `image` 规则提供 `allow_svg` 指令（`image:allow_svg`）。

#### in:_foo_,_bar_,...

待验证字段必须包含在给定的值列表中。由于此规则通常要求你对数组执行 `implode`，可以使用 `Rule::in` 方法来流畅地构建规则：

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

当 `in` 规则与 `array` 规则结合使用时，输入数组中的每个值都必须出现在提供给 `in` 规则的值列表中。在下面的示例中，输入数组中的 `LAS` 机场代码是无效的，因为它没有包含在提供给 `in` 规则的机场列表中：

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

#### in_array:_anotherfield_.*

待验证字段必须存在于 _anotherfield_ 的值中。

#### in_array_keys:_value_.*

待验证字段必须是一个至少包含给定 _values_ 中某一个作为键的数组：

```php
'config' => ['array', 'in_array_keys:timezone']
```

#### integer

待验证字段必须是一个整数。

你可以使用 `strict` 参数，仅在该字段的类型为 `integer` 时才视为有效。值为整数字符串的会被视为无效：

```php
'age' => ['integer:strict']
```

> [!WARNING]
> 此验证规则并不验证输入是否为 "integer" 变量类型，只验证输入是否为 PHP 的 `FILTER_VALIDATE_INT` 规则所接受的类型。如果你需要验证输入是一个数字，请将此规则与 the `numeric` 验证规则 结合使用。

#### ip

待验证字段必须是一个 IP 地址。

#### ipv4

待验证字段必须是一个 IPv4 地址。

#### ipv6

待验证字段必须是一个 IPv6 地址。

#### json

待验证字段必须是一个有效的 JSON 字符串。

#### lt:_field_

待验证字段必须小于给定的 _field_。两个字段必须是相同类型。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### lte:_field_

待验证字段必须小于或等于给定的 _field_。两个字段必须是相同类型。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### lowercase

待验证字段必须是小写。

#### list

待验证字段必须是一个列表形式的数组。如果一个数组的键由从 0 到 `count($array) - 1` 的连续数字组成，则该数组被视为列表。

#### mac_address

待验证字段必须是一个 MAC 地址。

#### max:_value_

待验证字段必须小于或等于最大 _value_。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### max_digits:_value_

待验证的整数最大长度必须为 _value_。

#### mimetypes:_text/plain_,...

待验证的文件必须匹配给定的某个 MIME 类型：

```php
'video' => ['mimetypes:video/avi,video/mpeg,video/quicktime'],

'media' => ['mimetypes:image/*,video/*'],
```

为确定上传文件的 MIME 类型，会读取文件内容，框架会尝试猜测 MIME 类型，这可能与客户端提供的 MIME 类型不同。

#### mimes:_foo_,_bar_,...

待验证的文件必须具有与所列扩展名之一相对应的 MIME 类型：

```php
'photo' => ['mimes:jpg,bmp,png']
```

尽管你只需指定扩展名，但此规则实际上会通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。完整的 MIME 类型及其对应扩展名列表可以在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

#### MIME 类型与扩展名

此验证规则不会验证 MIME 类型与用户为文件指定的扩展名之间是否一致。例如，`mimes:png` 验证规则会认为一个包含有效 PNG 内容的文件是有效的 PNG 图片，即使该文件名为 `photo.txt`。如果你想验证用户为文件指定的扩展名，可以使用 extensions 规则。

#### min:_value_

待验证字段必须具有最小 _value_。字符串、数字、数组和文件的求值方式与 size 规则相同。

#### min_digits:_value_

待验证的整数最小长度必须为 _value_。

#### multiple_of:_value_

待验证字段必须是 _value_ 的倍数。

#### missing

待验证字段不能出现在输入数据中。

#### missing_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意 _value_，待验证字段不能出现。

#### missing_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任意 _value_，否则待验证字段不能出现。

#### missing_with:_foo_,_bar_,...

只有当其他指定字段中的任意一个存在时，待验证字段才不能出现。

#### missing_with_all:_foo_,_bar_,...

只有当其他指定字段全部存在时，待验证字段才不能出现。

#### not_in:_foo_,_bar_,...

待验证字段不能包含在给定的值列表中。可以使用 `Rule::notIn` 方法来流畅地构建规则：

```php
use Illuminate\Validation\Rule;

Validator::make($data, [
    'toppings' => [
        'required',
        Rule::notIn(['sprinkles', 'cherries']),
    ],
]);
```

#### not_regex:_pattern_

待验证字段必须与给定的正则表达式不匹配。

在内部，此规则使用 PHP 的 `preg_match` 函数。指定的模式应遵循 `preg_match` 所要求的相同格式，因此也必须包含有效的定界符。例如：`'email' => ['not_regex:/^.+$/i']`。

#### nullable

待验证字段可以是 `null`。

#### numeric

待验证字段必须是 [数字](https://www.php.net/manual/en/function.is-numeric.php)。

你可以使用 `strict` 参数，仅在该字段值为整数或浮点数类型时才视为有效。数字字符串会被视为无效：

```php
'amount' => ['numeric:strict']
```

#### present

待验证字段必须存在于输入数据中。

#### present_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意 _value_，待验证字段必须存在。

#### present_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任意 _value_，否则待验证字段必须存在。

#### present_with:_foo_,_bar_,...

只有当其他指定字段中的任意一个存在时，待验证字段才必须存在。

#### present_with_all:_foo_,_bar_,...

只有当其他指定字段全部存在时，待验证字段才必须存在。

#### prohibited

待验证字段必须缺失或为空。如果满足以下任一条件，字段即为 "空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

#### prohibited_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意 _value_，待验证字段必须缺失或为空。如果满足以下任一条件，字段即为 "空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

如果需要复杂的条件禁止逻辑，可以使用 `Rule::prohibitedIf` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示是否应禁止待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedIf(fn () => $request->user()->is_admin)],
]);
```

#### prohibited_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，待验证字段必须缺失或为空。

#### prohibited_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，待验证字段必须缺失或为空。

#### prohibited_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任意 _value_，否则待验证字段必须缺失或为空。如果满足以下任一条件，字段即为 "空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

如果需要复杂的条件禁止逻辑，可以使用 `Rule::prohibitedUnless` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示是否不应禁止待验证字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedUnless(fn () => $request->user()->is_admin)],
]);
```

#### prohibits:_anotherfield_,...

如果待验证字段不缺失且不为空，则 _anotherfield_ 中的所有字段都必须缺失或为空。如果满足以下任一条件，字段即为 "空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为路径为空的已上传文件。

#### regex:_pattern_

待验证字段必须与给定的正则表达式相匹配。

在内部，此规则使用 PHP 的 `preg_match` 函数。指定的模式应遵循 `preg_match` 所要求的相同格式，因此也必须包含有效的定界符。例如：`'email' => ['regex:/^.+@.+$/i']`。

#### required

待验证字段必须存在于输入数据中且不为空。如果满足以下任一条件，字段即为 "空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为没有路径的已上传文件。

#### required_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任意 _value_，待验证字段必须存在且不为空。

如果你想为 `required_if` 规则构建更复杂的条件，可以使用 `Rule::requiredIf` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示待验证字段是否为必填：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::requiredIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::requiredIf(fn () => $request->user()->is_admin)],
]);
```

#### required_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，待验证字段必须存在且不为空。

#### required_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，待验证字段必须存在且不为空。

#### required_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任意 _value_，否则待验证字段必须存在且不为空。这也意味着，除非 _value_ 为 `null`，否则 _anotherfield_ 必须出现在请求数据中。如果 _value_ 为 `null`（`required_unless:name,null`），则除非比较字段为 `null` 或比较字段在请求数据中缺失，否则待验证字段为必填。

如果你想为 `required_unless` 规则构建更复杂的条件，可以使用 `Rule::requiredUnless` 方法。该方法接受一个布尔值或闭包。当传入闭包时，闭包应返回 `true` 或 `false`，以指示待验证字段是否非必填：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::requiredUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::requiredUnless(fn () => $request->user()->is_admin)],
]);
```

#### required_with:_foo_,_bar_,...

只有当其他指定字段中的任意一个存在且不为空时，待验证字段才必须存在且不为空。

#### required_with_all:_foo_,_bar_,...

只有当其他指定字段全部存在且不为空时，待验证字段才必须存在且不为空。

#### required_without:_foo_,_bar_,...

只有当其他指定字段中的任意一个为空或不存在时，待验证字段才必须存在且不为空。

#### required_without_all:_foo_,_bar_,...

只有当其他指定字段全部为空或不存在时，待验证字段才必须存在且不为空。

#### required_array_keys:_foo_,_bar_,...

待验证字段必须是一个数组，且必须至少包含指定的键。

#### same:_field_

给定的 _field_ 必须与待验证字段相匹配。

#### size:_value_

待验证字段的大小必须与给定的 _value_ 相匹配。对于字符串数据，_value_ 对应字符数。对于数字数据，_value_ 对应给定的整数值（该属性还必须具有 `numeric` 或 `integer` 规则）。对于数组，_size_ 对应数组的 `count`。对于文件，_size_ 对应文件大小（以千字节为单位）。来看一些示例：

```php
// 验证字符串正好为 12 个字符长……
'title' => ['size:12'];

// 验证提供的整数等于 10……
'seats' => ['integer', 'size:10'];

// 验证数组正好有 5 个元素……
'tags' => ['array', 'size:5'];

// 验证上传的文件正好为 512 千字节……
'image' => ['file', 'size:512'];
```

#### starts_with:_foo_,_bar_,...

待验证字段必须以给定值中的某一个开头。

#### string

待验证字段必须是字符串。如果你想让该字段也可以为 `null`，应当为该字段分配 `nullable` 规则。

为方便起见，字符串验证规则也可以使用流畅的 `Rule::string()` 规则构造器构建：

```php
use Illuminate\Validation\Rule;

'title' => [
    'required',
    Rule::string()
        ->min(3)
        ->max(255)
        ->alphaDash(ascii: true),
],
```

字符串规则构造器为常见的字符串约束提供了方法，包括 `alpha`、`alphaDash`、`alphaNumeric`、`ascii`、`between`、`doesntEndWith`、`doesntStartWith`、`endsWith`、`exactly`、`lowercase`、`max`、`min`、`startsWith` 和 `uppercase`。由于该规则构造器是可条件化的，你还可以使用 `when` 和 `unless` 方法来有条件地应用约束。

#### timezone

待验证字段必须是根据 `DateTimeZone::listIdentifiers` 方法得出的有效时区标识符。

也可以将 [被 `DateTimeZone::listIdentifiers` 方法接受的参数](https://www.php.net/manual/en/datetimezone.listidentifiers.php) 提供给此验证规则：

```php
'timezone' => ['required', 'timezone:all'];

'timezone' => ['required', 'timezone:Africa'];

'timezone' => ['required', 'timezone:per_country,US'];
```

#### unique:_table_,_column_

待验证字段不能存在于给定的数据库表中。

**指定自定义表 / 列名：**

除了直接指定表名，你还可以指定应当用于确定表名的 Eloquent 模型：

```php
'email' => ['unique:App\Models\User,email_address']
```

`column` 选项可用于指定字段对应的数据库列。如果未指定 `column` 选项，将使用待验证字段的名称。

```php
'email' => ['unique:users,email_address']
```

**指定自定义数据库连接**

有时，你可能需要为验证器执行的数据库查询设置自定义连接。为此，可以将连接名作为前缀加到表名前：

```php
'email' => ['unique:connection.users,email_address']
```

**强制 Unique 规则忽略某个给定 ID：**

有时，你可能希望在唯一性验证期间忽略某个给定 ID。例如，考虑一个 "更新个人资料" 页面，其中包含用户的姓名、邮箱地址和位置。你很可能想验证邮箱地址是唯一的。但是，如果用户只修改了姓名字段而没有修改邮箱字段，你不会希望抛出验证错误，因为该用户本身就是该邮箱地址的拥有者。

为了指示验证器忽略用户的 ID，我们将使用 `Rule` 类来流畅地定义规则。

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
> 你绝不应将任何用户控制的请求输入传入 `ignore` 方法。相反，你只应传入系统生成的唯一 ID，例如来自 Eloquent 模型实例的自增 ID 或 UUID。否则，你的应用将面临 SQL 注入攻击的风险。

除了将模型键的值传给 `ignore` 方法，你也可以传入整个模型实例。Laravel 会自动从模型中提取键：

```php
Rule::unique('users')->ignore($user)
```

如果你的表使用的主键列名不是 `id`，可以在调用 `ignore` 方法时指定该列名：

```php
Rule::unique('users')->ignore($user->id, 'user_id')
```

默认情况下，`unique` 规则会检查与待验证属性名称相匹配的列的唯一性。不过，你可以将不同的列名作为第二个参数传给 `unique` 方法：

```php
Rule::unique('users', 'email_address')->ignore($user->id)
```

**添加额外的 Where 子句：**

你可以通过 `where` 方法自定义查询来指定额外的查询条件。例如，我们添加一个查询条件，将查询范围限定为只搜索 `account_id` 列值为 `1` 的记录：

```php
'email' => Rule::unique('users')->where(fn (Builder $query) => $query->where('account_id', 1))
```

**在唯一性检查中忽略被软删除的记录：**

默认情况下，unique 规则在确定唯一性时会包含被软删除的记录。要将被软删除的记录排除在唯一性检查之外，可以调用 `withoutTrashed` 方法：

```php
Rule::unique('users')->withoutTrashed();
```

如果你的模型用于被软删除记录的列名不是 `deleted_at`，可以在调用 `withoutTrashed` 方法时提供该列名：

```php
Rule::unique('users')->withoutTrashed('was_deleted_at');
```

#### uppercase

待验证字段必须是大写。

#### url

待验证字段必须是有效的 URL。

如果你想指定应当视为有效的 URL 协议，可以将协议作为验证规则参数传入：

```php
'url' => ['url:http,https'],

'game' => ['url:minecraft,steam'],
```

#### ulid

待验证字段必须是有效的 [通用唯一按字典序可排序标识符](https://github.com/ulid/spec)（ULID）。

#### uuid

待验证字段必须是有效的 RFC 9562（版本 1、3、4、5、6、7 或 8）通用唯一标识符（UUID）。

你也可以验证给定的 UUID 是否匹配某个具体版本的 UUID 规范：

```php
'uuid' => ['uuid:4']
```

## 有条件地添加规则

### 当字段具有某些值时跳过验证

你可能偶尔希望在另一个字段具有给定值时，不验证某个给定字段。你可以使用 `exclude_if` 验证规则来完成。在本例中，如果 `has_appointment` 字段的值为 `false`，则不会验证 `appointment_date` 和 `doctor_name` 字段：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($data, [
    'has_appointment' => ['required', 'boolean'],
    'appointment_date' => ['exclude_if:has_appointment,false', 'required', 'date'],
    'doctor_name' => ['exclude_if:has_appointment,false', 'required', 'string'],
]);
```

或者，你可以使用 `exclude_unless` 规则，仅在另一个字段具有给定值时才验证某个给定字段：

```php
$validator = Validator::make($data, [
    'has_appointment' => ['required', 'boolean'],
    'appointment_date' => ['exclude_unless:has_appointment,true', 'required', 'date'],
    'doctor_name' => ['exclude_unless:has_appointment,true', 'required', 'string'],
]);
```

### 仅在存在时验证

在某些情况下，你可能希望 **仅当** 某个字段出现在被验证数据中时，才对其运行验证检查。要快速完成这一点，可以向规则列表添加 `sometimes` 规则：

```php
$validator = Validator::make($data, [
    'email' => ['sometimes', 'required', 'email'],
]);
```

在上面的示例中，只有当 `email` 字段存在于 `$data` 数组中时，才会被验证。

> [!NOTE]
> 如果你正在尝试验证一个应当始终存在但可能为空字段，请查看 这篇关于可选字段的说明。

### 复杂的条件验证

有时，你可能希望基于更复杂的条件逻辑来添加验证规则。例如，你可能在另一个字段的值大于 100 时，才要求某个给定字段。或者，你可能需要在另一个字段存在时，才要求两个字段具有某个给定值。添加这些验证规则并不麻烦。首先，用永不改变的 _静态规则_ 创建一个 `Validator` 实例：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'email' => ['required', 'email'],
    'games' => ['required', 'integer', 'min:0'],
]);
```

假设我们的 Web 应用是面向游戏收藏者的。如果一位游戏收藏者注册了我们的应用，并且他们拥有超过 100 款游戏，我们希望他们解释为何拥有这么多游戏。例如，也许他们经营一家游戏转售店，或者只是喜欢收藏游戏。为了有条件地添加这一要求，我们可以使用 `Validator` 实例上的 `sometimes` 方法。

```php
use Illuminate\Support\Fluent;

$validator->sometimes('reason', ['required', 'max:500'], function (Fluent $input) {
    return $input->games >= 100;
});
```

传给 `sometimes` 方法的第一个参数是我们正在有条件验证的字段名称。第二个参数是我们要添加的规则列表。如果作为第三个参数传入的闭包返回 `true`，则会添加这些规则。这个方法让构建复杂的条件验证变得轻而易举。你甚至可以为多个字段一次性添加条件验证：

```php
$validator->sometimes(['reason', 'cost'], 'required', function (Fluent $input) {
    return $input->games >= 100;
});
```

> [!NOTE]
> 传入闭包的 `$input` 参数会是 `Illuminate\Support\Fluent` 的一个实例，可用于访问待验证的输入和文件。

### 复杂的条件数组验证

有时，你可能希望基于同一嵌套数组中另一个你不知道索引的字段来验证某个字段。在这些情况下，你可以让你的闭包接收第二个参数，它将是被验证数组中的当前单个元素：

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

与传给闭包的 `$input` 参数一样，当属性数据是数组时，`$item` 参数是 `Illuminate\Support\Fluent` 的一个实例；否则，它是一个字符串。

## 验证数组

正如 array 验证规则文档 中所讨论的，`array` 规则接受一组允许的数组键。如果数组中存在任何额外的键，验证将失败：

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
    'user' => ['array:name,username'],
]);
```

一般来说，你应该始终指定允许出现在数组中的数组键。否则，验证器的 `validate` 和 `validated` 方法会返回所有经过验证的数据，包括该数组及其所有键，即使这些键并没有被其他嵌套数组验证规则验证过。

### 验证嵌套数组输入

验证嵌套的基于数组的表单输入字段并不麻烦。你可以使用 "点" 记法来验证数组中的属性。例如，如果传入的 HTTP 请求包含一个 `photos[profile]` 字段，你可以这样验证它：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'photos.profile' => ['required', 'image'],
]);
```

你也可以验证数组的每个元素。例如，要验证给定数组输入字段中的每个邮箱都是唯一的，可以这样做：

```php
$validator = Validator::make($request->all(), [
    'users.*.email' => ['email', 'unique:users'],
    'users.*.first_name' => ['required_with:users.*.last_name'],
]);
```

同样地，在指定 语言文件中的自定义验证消息 时，你可以使用 `*` 字符，从而轻松地为基于数组的字段使用单条验证消息：

```php
'custom' => [
    'users.*.email' => [
        'unique' => 'Each user must have a unique email address',
    ]
],
```

#### 访问嵌套数组数据

有时，在为属性分配验证规则时，你可能需要访问某个给定嵌套数组元素的值。你可以使用 `Rule::forEach` 方法完成。该方法接受一个闭包，该闭包会针对被验证数组属性的每次迭代被调用，并接收属性的值以及明确的、完全展开的属性的名称。闭包应返回一个要分配给该数组元素的规则数组：

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

### 错误信息的索引与位置

验证数组时，你可能希望在应用显示的错误信息中，引用某个验证失败的具体条目的索引或位置。为此，你可以在 自定义验证消息 中包含 `:index`（从 `0` 开始）、`:position`（从 `1` 开始）或 `:ordinal-position`（从 `1st` 开始）占位符：

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
    'photos.*.description' => ['required'],
], [
    'photos.*.description.required' => 'Please describe photo #:position.',
]);
```

给定上述示例，验证会失败，用户会看到 _"Please describe photo #2."_ 这样的错误信息。

如果需要，你可以通过 `second-index`、`second-position`、`third-index`、`third-position` 等，引用更深层的嵌套索引和位置。

```php
'photos.*.attributes.*.string' => 'Invalid attribute for photo #:second-position.',
```

## 验证文件

Laravel 提供了多种可用于验证上传文件的验证规则，例如 `mimes`、`image`、`min` 和 `max`。虽然你可以自由地在验证文件时单独指定这些规则，但 Laravel 也提供了一个流畅的文件验证规则构造器，你可能会觉得方便：

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

### 验证文件类型

尽管在调用 `types` 方法时你只需指定扩展名，但该方法实际上会通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。完整的 MIME 类型及其对应扩展名列表可以在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

### 验证文件大小

为方便起见，最小和最大文件大小可以指定为带有表示文件大小单位后缀的字符串。支持 `kb`、`mb`、`gb` 和 `tb` 后缀：

```php
File::types(['mp3', 'wav'])
    ->min('1kb')
    ->max('10mb');
```

### 验证图片文件

如果你的应用接受用户上传的图片，可以使用 `File` 规则的 `image` 构造方法，确保待验证文件是一张图片（jpg、jpeg、png、bmp、gif 或 webp）。

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
> 关于验证图片尺寸的更多信息，请参阅 dimensions 规则文档。

> [!WARNING]
> 默认情况下，`image` 规则由于存在 XSS 漏洞风险而不允许 SVG 文件。如果你需要允许 SVG 文件，可以向 `image` 规则传入 `allowSvg: true`：`File::image(allowSvg: true)`。

### 验证图片尺寸

你也可以验证图片的尺寸。例如，要验证上传的图片至少 1000 像素宽、500 像素高，可以使用 `dimensions` 规则：

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
> 关于验证图片尺寸的更多信息，请参阅 dimensions 规则文档。

## 验证密码

要确保密码具有足够的复杂度，可以使用 Laravel 的 `Password` 规则对象：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

$validator = Validator::make($request->all(), [
    'password' => ['required', 'confirmed', Password::min(8)],
]);
```

`Password` 规则对象让你可以轻松自定义应用的密码复杂度要求，例如指定密码至少需要一个字母、数字、符号，或大小写混合的字符：

```php
// 至少需要 8 个字符……
Password::min(8)

// 最多 256 个字符……
Password::min(16)->max(256)

// 至少需要一个字母……
Password::min(8)->letters()

// 至少需要一个大写和小写字母……
Password::min(8)->mixedCase()

// 至少需要一个数字……
Password::min(8)->numbers()

// 至少需要一个符号……
Password::min(8)->symbols()
```

此外，你可以使用 `uncompromised` 方法，确保某个密码没有在公开的密码数据泄露事件中被泄露：

```php
Password::min(8)->uncompromised()
```

在内部，`Password` 规则对象使用 [k-Anonymity](https://en.wikipedia.org/wiki/K-anonymity) 模型，通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务来判断某个密码是否已被泄露，同时不损害用户的隐私或安全。

默认情况下，如果一个密码在数据泄露中出现至少一次，就会被视为已泄露。你可以使用 `uncompromised` 方法的第一个参数自定义这个阈值：

```php
// 确保该密码在同一次数据泄露中出现的次数少于 3 次……
Password::min(8)->uncompromised(3);
```

当然，你可以链式调用上面示例中的所有方法：

```php
Password::min(8)
    ->max(256)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
```

你可以使用 `toPasswordRulesString` 方法，将 `Password` 规则对象转换为适合 HTML `passwordrules` 属性的字符串：

```blade
<input
    type="password"
    name="password"
    autocomplete="new-password"
    passwordrules="{{ Password::defaults()->toPasswordRulesString() }}"
/>
```

### 定义默认密码规则

你可能会觉得在应用的单一位置指定密码的默认验证规则会很方便。可以使用 `Password::defaults` 方法轻松完成，该方法接受一个闭包。传给 `defaults` 方法的闭包应返回 Password 规则的默认配置。通常，`defaults` 规则应当在应用某个服务提供者的 `boot` 方法中调用：

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

然后，当你想将默认规则应用到某个正在验证的密码时，可以不带参数地调用 `defaults` 方法：

```php
'password' => ['required', Password::defaults()],
```

有时，你可能想为默认的密码验证规则附加额外的验证规则。可以使用 `rules` 方法来完成：

```php
use App\Rules\ZxcvbnRule;

Password::defaults(function () {
    $rule = Password::min(8)->rules([new ZxcvbnRule]);

    // ...
});
```

## 自定义验证规则

### 使用规则对象

Laravel 提供了多种实用的验证规则；不过，你可能希望指定一些自己的规则。注册自定义验证规则的一种方法是使用规则对象。要生成一个新的规则对象，可以使用 `make:rule` Artisan 命令。我们使用该命令生成一个验证字符串是否为大写的规则。Laravel 会将新规则放置在 `app/Rules` 目录中。如果该目录不存在，Laravel 会在你执行 Artisan 命令创建规则时创建它：

```shell
php artisan make:rule Uppercase
```

规则创建完成后，我们就可以定义它的行为了。一个规则对象只包含一个方法：`validate`。该方法接收属性名称、其值，以及一个在失败时应当被调用的回调（携带验证错误信息）：

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

规则定义完成后，你可以通过将规则对象的实例与你的其他验证规则一起传入，将其附加到验证器上：

```php
use App\Rules\Uppercase;

$request->validate([
    'name' => ['required', 'string', new Uppercase],
]);
```

#### 翻译验证消息

除了向 `$fail` 闭包提供字面量的错误信息，你也可以提供一个 [翻译字符串键](/topic/Laravel%2013.x/kpv13q298w.html)，并指示 Laravel 翻译该错误信息：

```php
if (strtoupper($value) !== $value) {
    $fail('validation.uppercase')->translate();
}
```

如果需要，你可以将占位符替换和首选语言作为第一个和第二个参数传给 `translate` 方法：

```php
$fail('validation.location')->translate([
    'value' => $this->value,
], 'fr');
```

#### 访问额外数据

如果你的自定义验证规则类需要访问所有其他正在被验证的数据，你的规则类可以实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。该接口要求你的类定义一个 `setData` 方法。Laravel 会在验证开始前（自动）以所有待验证数据调用此方法：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements DataAwareRule, ValidationRule
{
    /**
     * 所有待验证的数据。
     *
     * @var array<string, mixed>
     */
    protected $data = [];

    // ...

    /**
     * 设置待验证的数据。
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

或者，如果你的验证规则需要访问执行验证的验证器实例，你可以实现 `ValidatorAwareRule` 接口：

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
     * 设置当前的验证器。
     */
    public function setValidator(Validator $validator): static
    {
        $this->validator = $validator;

        return $this;
    }
}
```

### 使用闭包

如果你只需要在整个应用中使用一次自定义规则的功能，可以使用闭包来代替规则对象。闭包接收属性的名称、属性的值，以及一个在验证失败时应被调用的 `$fail` 回调：

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

### 隐式规则

默认情况下，当待验证的属性不存在或包含空字符串时，普通的验证规则（包括自定义规则）不会运行。例如，unique 规则不会针对空字符串运行：

```php
use Illuminate\Support\Facades\Validator;

$rules = ['name' => ['unique:users,name']];

$input = ['name' => ''];

Validator::make($input, $rules)->passes(); // true
```

要让自定义规则即使在属性为空时也能运行，该规则必须暗示该属性是必填的。要快速生成一个新的隐式规则对象，可以使用带 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --implicit
```

> [!WARNING]
> 一个 "隐式" 规则只是 _暗示_ 该属性是必填的。它是否真的会让缺失或为空属性判定为无效，取决于你自己。