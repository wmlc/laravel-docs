# 验证

- [简介](#introduction)
- [验证快速入门](#validation-quickstart)
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
    - [验证后钩子](#after-validation-hook)
- [处理已验证输入](#working-with-validated-input)
- [处理错误消息](#working-with-error-messages)
    - [在语言文件中指定自定义消息](#specifying-custom-messages-in-language-files)
    - [在语言文件中指定属性](#specifying-attribute-in-language-files)
    - [在语言文件中指定值](#specifying-values-in-language-files)
- [可用验证规则](#available-validation-rules)
- [条件添加规则](#conditionally-adding-rules)
- [验证数组](#validating-arrays)
    - [验证嵌套数组输入](#validating-nested-array-input)
    - [错误消息索引与位置](#error-message-indexes-and-positions)
- [验证文件](#validating-files)
- [验证密码](#validating-passwords)
- [自定义验证规则](#custom-validation-rules)
    - [使用规则对象](#using-rule-objects)
    - [使用闭包](#using-closures)
    - [隐式规则](#implicit-rules)

<a name="introduction"></a>
## 简介

Laravel 提供了几种不同的方法来验证应用的传入数据。最常见的是使用所有传入 HTTP 请求上可用的 `validate` 方法。但我们也会讨论其他验证方法。

Laravel 包含大量便捷的验证规则，可以应用于数据，甚至提供验证值在给定数据库表中是否唯一的能力。我们将详细介绍每个验证规则，以便熟悉 Laravel 的所有验证功能。

<a name="validation-quickstart"></a>
## 验证快速入门

要了解 Laravel 强大的验证功能，让我们看一个验证表单并向用户显示错误消息的完整示例。通过阅读此高层次概述，可以对如何使用 Laravel 验证传入请求数据有良好的总体了解：

<a name="quick-defining-the-routes"></a>
### 定义路由

首先，假设 `routes/web.php` 文件中定义了以下路由：

    use App\Http\Controllers\PostController;

    Route::get('/post/create', [PostController::class, 'create']);
    Route::post('/post', [PostController::class, 'store']);

`GET` 路由将显示供用户创建新博客文章的表单，而 `POST` 路由将把新博客文章存储到数据库中。

<a name="quick-creating-the-controller"></a>
### 创建控制器

接下来，看一个处理这些路由传入请求的简单控制器。暂时将 `store` 方法留空：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Http\Request;

    class PostController extends Controller
    {
        /**
         * 显示创建新博客文章的表单。
         *
         * @return \Illuminate\View\View
         */
        public function create()
        {
            return view('post.create');
        }

        /**
         * 存储新博客文章。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function store(Request $request)
        {
            // 验证并存储博客文章...
        }
    }

<a name="quick-writing-the-validation-logic"></a>
### 编写验证逻辑

现在准备好用验证新博客文章的逻辑填充 `store` 方法。为此，将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，代码将继续正常执行；但如果验证失败，将抛出 `Illuminate\Validation\ValidationException` 异常并自动向用户发送正确的错误响应。

如果传统 HTTP 请求期间验证失败，将生成重定向到之前 URL 的响应。如果传入请求是 XHR 请求，将返回[包含验证错误消息的 JSON 响应](#validation-error-response-format)。

为了更好地理解 `validate` 方法，让我们回到 `store` 方法：

    /**
     * 存储新博客文章。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|unique:posts|max:255',
            'body' => 'required',
        ]);

        // 博客文章有效...
    }

如上所示，验证规则传递给 `validate` 方法。不用担心——所有可用的验证规则都已[文档化](#available-validation-rules)。同样，如果验证失败，将自动生成正确的响应。如果验证通过，控制器将继续正常执行。

或者，验证规则可以指定为规则数组，而非以 `|` 分隔的单个字符串：

    $validatedData = $request->validate([
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ]);

此外，可以使用 `validateWithBag` 方法验证请求并将任何错误消息存储在[命名错误包](#named-error-bags)中：

    $validatedData = $request->validateWithBag('post', [
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ]);

<a name="stopping-on-first-validation-failure"></a>
#### 首次验证失败时停止

有时可能希望在首次验证失败后停止运行某个属性的验证规则。为此，将该属性的 `bail` 规则分配给它：

    $request->validate([
        'title' => 'bail|required|unique:posts|max:255',
        'body' => 'required',
    ]);

在此示例中，如果 `title` 属性上的 `unique` 规则失败，将不会检查 `max` 规则。规则将按分配顺序验证。

<a name="a-note-on-nested-attributes"></a>
#### 关于嵌套属性的说明

如果传入 HTTP 请求包含"嵌套"字段数据，可以在验证规则中使用"点"语法指定这些字段：

    $request->validate([
        'title' => 'required|unique:posts|max:255',
        'author.name' => 'required',
        'author.description' => 'required',
    ]);

另一方面，如果字段名包含字面意义的句点，可以通过用反斜杠转义句点来显式阻止将其解释为"点"语法：

    $request->validate([
        'title' => 'required|unique:posts|max:255',
        'v1\.0' => 'required',
    ]);

<a name="quick-displaying-the-validation-errors"></a>
### 显示验证错误

那么，如果传入请求字段未通过给定的验证规则会怎样？如前所述，Laravel 会自动将用户重定向回其之前的位置。此外，所有验证错误和[请求输入](/docs/{{version}}/requests#retrieving-old-input)将自动[闪存到会话](/docs/{{version}}/session#flash-data)。

`$errors` 变量由 `web` 中间件组提供的 `Illuminate\View\Middleware\ShareErrorsFromSession` 中间件共享给应用的所有视图。应用此中间件后，视图中将始终可用 `$errors` 变量，允许方便地假设 `$errors` 变量始终已定义且可安全使用。`$errors` 变量将是 `Illuminate\Support\MessageBag` 的实例。有关使用此对象的更多信息，[查阅其文档](#working-with-error-messages)。

因此，在我们的示例中，验证失败时用户将被重定向到控制器的 `create` 方法，允许我们在视图中显示错误消息：

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

Laravel 的内置验证规则每个都有错误消息，位于应用的 `lang/en/validation.php` 文件中。在此文件中，将为每个验证规则找到翻译条目。可以根据应用需要自由更改或修改这些消息。

此外，可以将此文件复制到另一个翻译语言目录，以为应用语言翻译消息。要了解有关 Laravel 本地化的更多信息，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

<a name="quick-xhr-requests-and-validation"></a>
#### XHR 请求与验证

在此示例中，我们使用传统表单向应用发送数据。但许多应用从 JavaScript 驱动的前端接收 XHR 请求。在 XHR 请求期间使用 `validate` 方法时，Laravel 不会生成重定向响应。相反，Laravel 生成[包含所有验证错误的 JSON 响应](#validation-error-response-format)。此 JSON 响应将以 422 HTTP 状态码发送。

<a name="the-at-error-directive"></a>
#### `@error` 指令

可以使用 `@error` [Blade](/docs/{{version}}/blade) 指令快速确定给定属性是否存在验证错误消息。在 `@error` 指令内，可以输出 `$message` 变量以显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">Post Title</label>

<input id="title"
    type="text"
    name="title"
    class="@error('title') is-invalid @enderror">

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

如果使用[命名错误包](#named-error-bags)，可以将错误包名称作为 `@error` 指令的第二个参数传递：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

<a name="repopulating-forms"></a>
### 重新填充表单

当 Laravel 因验证错误生成重定向响应时，框架将自动[将请求的所有输入闪存到会话](/docs/{{version}}/session#flash-data)。这样做是为了方便在下一个请求期间访问输入并重新填充用户尝试提交的表单。

要从上一个请求检索闪存的输入，在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法将从[会话](/docs/{{version}}/session)中提取之前闪存的输入数据：

    $title = $request->old('title');

Laravel 还提供全局 `old` 辅助函数。如果在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数重新填充表单更方便。如果给定字段不存在旧输入，将返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

<a name="a-note-on-optional-fields"></a>
### 关于可选字段的说明

默认情况下，Laravel 在应用的全局中间件栈中包含 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。这些中间件由 `App\Http\Kernel` 类列在栈中。因此，如果不希望验证器将 `null` 值视为无效，通常需要将"可选"请求字段标记为 `nullable`。例如：

    $request->validate([
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
        'publish_at' => 'nullable|date',
    ]);

在此示例中，指定 `publish_at` 字段可以为 `null` 或有效的日期表示。如果未将 `nullable` 修饰符添加到规则定义中，验证器会将 `null` 视为无效日期。

<a name="validation-error-response-format"></a>
### 验证错误响应格式

当应用抛出 `Illuminate\Validation\ValidationException` 异常且传入 HTTP 请求期望 JSON 响应时，Laravel 会自动格式化错误消息并返回 `422 Unprocessable Entity` HTTP 响应。

以下可以查看验证错误的 JSON 响应格式示例。注意嵌套的错误键被展平为"点"表示法格式：

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

对于更复杂的验证场景，可能希望创建"表单请求"。表单请求是自定义请求类，封装了自己的验证和授权逻辑。要创建表单请求类，可以使用 `make:request` Artisan CLI 命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类将放置在 `app/Http/Requests` 目录中。如果此目录不存在，运行 `make:request` 命令时将创建它。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

如可能猜测的那样，`authorize` 方法负责确定当前已认证用户是否可以执行请求所代表的操作，而 `rules` 方法返回应应用于请求数据的验证规则：

    /**
     * 获取应用于请求的验证规则。
     *
     * @return array
     */
    public function rules()
    {
        return [
            'title' => 'required|unique:posts|max:255',
            'body' => 'required',
        ];
    }

> **Note**  
> 可以在 `rules` 方法签名中类型提示所需的任何依赖。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

那么，验证规则如何被评估？只需在控制器方法上类型提示请求。传入的表单请求在控制器方法被调用之前验证，这意味着无需用任何验证逻辑混乱控制器：

    /**
     * 存储新博客文章。
     *
     * @param  \App\Http\Requests\StorePostRequest  $request
     * @return Illuminate\Http\Response
     */
    public function store(StorePostRequest $request)
    {
        // 传入请求有效...

        // 检索已验证的输入数据...
        $validated = $request->validated();

        // 检索部分已验证输入数据...
        $validated = $request->safe()->only(['name', 'email']);
        $validated = $request->safe()->except(['name', 'email']);
    }

如果验证失败，将生成重定向响应将用户送回其之前的位置。错误也将闪存到会话以便显示。如果请求是 XHR 请求，将向用户返回包含 422 状态码的 HTTP 响应，其中包含[验证错误的 JSON 表示](#validation-error-response-format)。

<a name="adding-after-hooks-to-form-requests"></a>
#### 为表单请求添加后置钩子

如果希望为表单请求添加"后置"验证钩子，可以使用 `withValidator` 方法。此方法接收完全构造的验证器，允许在验证规则实际评估之前调用其任何方法：

    /**
     * 配置验证器实例。
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->somethingElseIsInvalid()) {
                $validator->errors()->add('field', 'Something is wrong with this field!');
            }
        });
    }


<a name="request-stopping-on-first-validation-rule-failure"></a>
#### 首次验证失败停止属性

通过在请求类中添加 `stopOnFirstFailure` 属性，可以告知验证器在发生单个验证失败后应停止验证所有属性：

    /**
     * 指示验证器是否在首次规则失败时停止。
     *
     * @var bool
     */
    protected $stopOnFirstFailure = true;

<a name="customizing-the-redirect-location"></a>
#### 自定义重定向位置

如前所述，表单请求验证失败时将生成重定向响应将用户送回其之前的位置。但可以自由自定义此行为。为此，在表单请求上定义 `$redirect` 属性：

    /**
     * 验证失败时用户应重定向到的 URI。
     *
     * @var string
     */
    protected $redirect = '/dashboard';

或者，如果希望将用户重定向到命名路由，可以定义 `$redirectRoute` 属性：

    /**
     * 验证失败时用户应重定向到的路由。
     *
     * @var string
     */
    protected $redirectRoute = 'dashboard';

<a name="authorizing-form-requests"></a>
### 授权表单请求

表单请求类还包含 `authorize` 方法。在此方法中，可以确定已认证用户是否确实有权更新给定资源。例如，可以确定用户是否确实拥有其尝试更新的博客评论。很可能，将在此方法中与[授权门和策略](/docs/{{version}}/authorization)交互：

    use App\Models\Comment;

    /**
     * 确定用户是否有权发起此请求。
     *
     * @return bool
     */
    public function authorize()
    {
        $comment = Comment::find($this->route('comment'));

        return $comment && $this->user()->can('update', $comment);
    }

由于所有表单请求都继承基础 Laravel 请求类，可以使用 `user` 方法访问当前已认证用户。还请注意上面示例中对 `route` 方法的调用。此方法允许访问正在调用的路由上定义的 URI 参数，例如以下示例中的 `{comment}` 参数：

    Route::post('/comment/{comment});

因此，如果应用利用[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，代码可以更简洁，通过将解析的模型作为请求属性访问：

    return $this->user()->can('update', $this->comment);

如果 `authorize` 方法返回 `false`，将自动返回 403 状态码的 HTTP 响应，控制器方法不会执行。

如果计划在应用的其他部分处理请求的授权逻辑，可以简单地从 `authorize` 方法返回 `true`：

    /**
     * 确定用户是否有权发起此请求。
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

> **Note**  
> 可以在 `authorize` 方法签名中类型提示所需的任何依赖。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

<a name="customizing-the-error-messages"></a>
### 自定义错误消息

可以通过覆盖 `messages` 方法来自定义表单请求使用的错误消息。此方法应返回属性 / 规则对及其对应错误消息的数组：

    /**
     * 获取定义验证规则的错误消息。
     *
     * @return array
     */
    public function messages()
    {
        return [
            'title.required' => 'A title is required',
            'body.required' => 'A message is required',
        ];
    }

<a name="customizing-the-validation-attributes"></a>
#### 自定义验证属性

Laravel 许多内置验证规则错误消息包含 `:attribute` 占位符。如果希望验证消息的 `:attribute` 占位符替换为自定义属性名称，可以通过覆盖 `attributes` 方法指定自定义名称。此方法应返回属性 / 名称对的数组：

    /**
     * 获取验证器错误的自定义属性。
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'email' => 'email address',
        ];
    }

<a name="preparing-input-for-validation"></a>
### 为验证准备输入

如果需要在应用验证规则之前准备或清理请求中的任何数据，可以使用 `prepareForValidation` 方法：

    use Illuminate\Support\Str;

    /**
     * 为验证准备数据。
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'slug' => Str::slug($this->slug),
        ]);
    }

同样，如果需要在验证完成后规范化任何请求数据，可以使用 `passedValidation` 方法：

    use Illuminate\Support\Str;

    /**
     * 处理通过的验证尝试。
     *
     * @return void
     */
    protected function passedValidation()
    {
        $this->replace(['name' => 'Taylor']);
    }

<a name="manually-creating-validators"></a>
## 手动创建验证器

如果不想在请求上使用 `validate` 方法，可以使用 `Validator` [Facade](/docs/{{version}}/facades)手动创建验证器实例。Facade 上的 `make` 方法生成新的验证器实例：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;

    class PostController extends Controller
    {
        /**
         * 存储新博客文章。
         *
         * @param  Request  $request
         * @return Response
         */
        public function store(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'title' => 'required|unique:posts|max:255',
                'body' => 'required',
            ]);

            if ($validator->fails()) {
                return redirect('post/create')
                            ->withErrors($validator)
                            ->withInput();
            }

            // 检索已验证的输入...
            $validated = $validator->validated();

            // 检索部分已验证输入...
            $validated = $validator->safe()->only(['name', 'email']);
            $validated = $validator->safe()->except(['name', 'email']);

            // 存储博客文章...
        }
    }

传递给 `make` 方法的第一个参数是正在验证的数据。第二个参数是应应用于数据的验证规则数组。

确定请求验证失败后，可以使用 `withErrors` 方法将错误消息闪存到会话。使用此方法时，重定向后 `$errors` 变量将自动与视图共享，允许轻松向用户显示。`withErrors` 方法接受验证器、`MessageBag` 或 PHP `array`。

#### 首次验证失败时停止

`stopOnFirstFailure` 方法将告知验证器在发生单个验证失败后应停止验证所有属性：

    if ($validator->stopOnFirstFailure()->fails()) {
        // ...
    }

<a name="automatic-redirection"></a>
### 自动重定向

如果希望手动创建验证器实例但仍利用 HTTP 请求 `validate` 方法提供的自动重定向，可以在现有验证器实例上调用 `validate` 方法。如果验证失败，用户将自动重定向，或者对于 XHR 请求，将返回 [JSON 响应](#validation-error-response-format)：

    Validator::make($request->all(), [
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ])->validate();

可以使用 `validateWithBag` 方法在验证失败时将错误消息存储在[命名错误包](#named-error-bags)中：

    Validator::make($request->all(), [
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ])->validateWithBag('post');

<a name="named-error-bags"></a>
### 命名错误包

如果单个页面上有多个表单，可能希望命名包含验证错误的 `MessageBag`，以便检索特定表单的错误消息。为此，将名称作为第二个参数传递给 `withErrors`：

    return redirect('register')->withErrors($validator, 'login');

然后可以从 `$errors` 变量访问命名的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

<a name="manual-customizing-the-error-messages"></a>
### 自定义错误消息

如果需要，可以提供验证器实例应使用的自定义错误消息，而非 Laravel 提供的默认错误消息。有几种方式指定自定义消息。首先，可以将自定义消息作为第三个参数传递给 `Validator::make` 方法：

    $validator = Validator::make($input, $rules, $messages = [
        'required' => 'The :attribute field is required.',
    ]);

在此示例中，`:attribute` 占位符将被替换为正在验证的字段的实际名称。还可以在验证消息中使用其他占位符。例如：

    $messages = [
        'same' => 'The :attribute and :other must match.',
        'size' => 'The :attribute must be exactly :size.',
        'between' => 'The :attribute value :input is not between :min - :max.',
        'in' => 'The :attribute must be one of the following types: :values',
    ];

<a name="specifying-a-custom-message-for-a-given-attribute"></a>
#### 为给定属性指定自定义消息

有时可能希望仅为特定属性指定自定义错误消息。可以使用"点"表示法实现。先指定属性名称，然后是规则：

    $messages = [
        'email.required' => 'We need to know your email address!',
    ];

<a name="specifying-custom-attribute-values"></a>
#### 指定自定义属性值

Laravel 许多内置错误消息包含 `:attribute` 占位符，替换为正在验证的字段或属性名称。要自定义用于替换特定字段这些占位符的值，可以将自定义属性数组作为第四个参数传递给 `Validator::make` 方法：

    $validator = Validator::make($input, $rules, $messages, [
        'email' => 'email address',
    ]);

<a name="after-validation-hook"></a>
### 验证后钩子

还可以附加在验证完成后运行的回调。这允许轻松执行进一步验证，甚至向消息集合添加更多错误消息。首先，在验证器实例上调用 `after` 方法：

    $validator = Validator::make(/* ... */);

    $validator->after(function ($validator) {
        if ($this->somethingElseIsInvalid()) {
            $validator->errors()->add(
                'field', 'Something is wrong with this field!'
            );
        }
    });

    if ($validator->fails()) {
        //
    }

<a name="working-with-validated-input"></a>
## 处理已验证输入

使用表单请求或手动创建的验证器实例验证传入请求数据后，可能希望检索实际经过验证的传入请求数据。这可以通过几种方式完成。首先，可以在表单请求或验证器实例上调用 `validated` 方法。此方法返回已验证数据的数组：

    $validated = $request->validated();

    $validated = $validator->validated();

或者，可以在表单请求或验证器实例上调用 `safe` 方法。此方法返回 `Illuminate\Support\ValidatedInput` 实例。此对象暴露 `only`、`except` 和 `all` 方法，用于检索已验证数据的子集或整个已验证数据数组：

    $validated = $request->safe()->only(['name', 'email']);

    $validated = $request->safe()->except(['name', 'email']);

    $validated = $request->safe()->all();

此外，`Illuminate\Support\ValidatedInput` 实例可以像数组一样迭代和访问：

    // 已验证数据可迭代...
    foreach ($request->safe() as $key => $value) {
        //
    }

    // 已验证数据可作为数组访问...
    $validated = $request->safe();

    $email = $validated['email'];

如果希望向已验证数据添加额外字段，可以调用 `merge` 方法：

    $validated = $request->safe()->merge(['name' => 'Taylor Otwell']);

如果希望将已验证数据检索为[集合](/docs/{{version}}/collections)实例，可以调用 `collect` 方法：

    $collection = $request->safe()->collect();

<a name="working-with-error-messages"></a>
## 处理错误消息

在 `Validator` 实例上调用 `errors` 方法后，将收到 `Illuminate\Support\MessageBag` 实例，它有多种便捷方法用于处理错误消息。自动提供给所有视图的 `$errors` 变量也是 `MessageBag` 类的实例。

<a name="retrieving-the-first-error-message-for-a-field"></a>
#### 检索字段的第一个错误消息

要检索给定字段的第一个错误消息，使用 `first` 方法：

    $errors = $validator->errors();

    echo $errors->first('email');

<a name="retrieving-all-error-messages-for-a-field"></a>
#### 检索字段的所有错误消息

如果需要检索给定字段的所有消息数组，使用 `get` 方法：

    foreach ($errors->get('email') as $message) {
        //
    }

如果正在验证数组表单字段，可以使用 `*` 字符检索每个数组元素的所有消息：

    foreach ($errors->get('attachments.*') as $message) {
        //
    }

<a name="retrieving-all-error-messages-for-all-fields"></a>
#### 检索所有字段的所有错误消息

要检索所有字段的所有消息数组，使用 `all` 方法：

    foreach ($errors->all() as $message) {
        //
    }

<a name="determining-if-messages-exist-for-a-field"></a>
#### 确定字段是否存在消息

`has` 方法可用于确定给定字段是否存在任何错误消息：

    if ($errors->has('email')) {
        //
    }

<a name="specifying-custom-messages-in-language-files"></a>
### 在语言文件中指定自定义消息

Laravel 的内置验证规则每个都有错误消息，位于应用的 `lang/en/validation.php` 文件中。在此文件中，将为每个验证规则找到翻译条目。可以根据应用需要自由更改或修改这些消息。

此外，可以将此文件复制到另一个翻译语言目录，以为应用语言翻译消息。要了解有关 Laravel 本地化的更多信息，请查阅完整的[本地化文档](/docs/{{version}}/localization)。

<a name="custom-messages-for-specific-attributes"></a>
#### 特定属性的自定义消息

可以在应用的验证语言文件中自定义用于指定属性和规则组合的错误消息。为此，将消息自定义添加到应用 `lang/xx/validation.php` 语言文件的 `custom` 数组：

    'custom' => [
        'email' => [
            'required' => 'We need to know your email address!',
            'max' => 'Your email address is too long!'
        ],
    ],

<a name="specifying-attribute-in-language-files"></a>
### 在语言文件中指定属性

Laravel 许多内置错误消息包含 `:attribute` 占位符，替换为正在验证的字段或属性名称。如果希望验证消息的 `:attribute` 部分替换为自定义值，可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名称：

    'attributes' => [
        'email' => 'email address',
    ],

<a name="specifying-values-in-language-files"></a>
### 在语言文件中指定值

Laravel 一些内置验证规则错误消息包含 `:value` 占位符，替换为请求属性的当前值。但偶尔可能需要验证消息的 `:value` 部分替换为值的自定义表示。例如，考虑以下规则，指定如果 `payment_type` 值为 `cc` 则信用卡号必填：

    Validator::make($request->all(), [
        'credit_card_number' => 'required_if:payment_type,cc'
    ]);

如果此验证规则失败，将产生以下错误消息：

```none
The credit card number field is required when payment type is cc.
```

可以在 `lang/xx/validation.php` 语言文件中通过定义 `values` 数组，指定更用户友好的值表示，而非显示 `cc` 作为支付类型值：

    'values' => [
        'payment_type' => [
            'cc' => 'credit card'
        ],
    ],

定义此值后，验证规则将产生以下错误消息：

```none
The credit card number field is required when payment type is credit card.
```

<a name="available-validation-rules"></a>
## 可用验证规则

以下是所有可用验证规则及其功能的列表：

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

<div class="collection-method-list" markdown="1">

[Accepted](#rule-accepted)
[Accepted If](#rule-accepted-if)
[Active URL](#rule-active-url)
[After (Date)](#rule-after)
[After Or Equal (Date)](#rule-after-or-equal)
[Alpha](#rule-alpha)
[Alpha Dash](#rule-alpha-dash)
[Alpha Numeric](#rule-alpha-num)
[Array](#rule-array)
[Ascii](#rule-ascii)
[Bail](#rule-bail)
[Before (Date)](#rule-before)
[Before Or Equal (Date)](#rule-before-or-equal)
[Between](#rule-between)
[Boolean](#rule-boolean)
[Confirmed](#rule-confirmed)
[Current Password](#rule-current-password)
[Date](#rule-date)
[Date Equals](#rule-date-equals)
[Date Format](#rule-date-format)
[Decimal](#rule-decimal)
[Declined](#rule-declined)
[Declined If](#rule-declined-if)
[Different](#rule-different)
[Digits](#rule-digits)
[Digits Between](#rule-digits-between)
[Dimensions (Image Files)](#rule-dimensions)
[Distinct](#rule-distinct)
[Doesnt Start With](#rule-doesnt-start-with)
[Doesnt End With](#rule-doesnt-end-with)
[Email](#rule-email)
[Ends With](#rule-ends-with)
[Enum](#rule-enum)
[Exclude](#rule-exclude)
[Exclude If](#rule-exclude-if)
[Exclude Unless](#rule-exclude-unless)
[Exclude With](#rule-exclude-with)
[Exclude Without](#rule-exclude-without)
[Exists (Database)](#rule-exists)
[File](#rule-file)
[Filled](#rule-filled)
[Greater Than](#rule-gt)
[Greater Than Or Equal](#rule-gte)
[Image (File)](#rule-image)
[In](#rule-in)
[In Array](#rule-in-array)
[Integer](#rule-integer)
[IP Address](#rule-ip)
[JSON](#rule-json)
[Less Than](#rule-lt)
[Less Than Or Equal](#rule-lte)
[Lowercase](#rule-lowercase)
[MAC Address](#rule-mac)
[Max](#rule-max)
[Max Digits](#rule-max-digits)
[MIME Types](#rule-mimetypes)
[MIME Type By File Extension](#rule-mimes)
[Min](#rule-min)
[Min Digits](#rule-min-digits)
[Missing](#rule-missing)
[Missing If](#rule-missing-if)
[Missing Unless](#rule-missing-unless)
[Missing With](#rule-missing-with)
[Missing With All](#rule-missing-with-all)
[Multiple Of](#rule-multiple-of)
[Not In](#rule-not-in)
[Not Regex](#rule-not-regex)
[Nullable](#rule-nullable)
[Numeric](#rule-numeric)
[Password](#rule-password)
[Present](#rule-present)
[Prohibited](#rule-prohibited)
[Prohibited If](#rule-prohibited-if)
[Prohibited Unless](#rule-prohibited-unless)
[Prohibits](#rule-prohibits)
[Regular Expression](#rule-regex)
[Required](#rule-required)
[Required If](#rule-required-if)
[Required Unless](#rule-required-unless)
[Required With](#rule-required-with)
[Required With All](#rule-required-with-all)
[Required Without](#rule-required-without)
[Required Without All](#rule-required-without-all)
[Required Array Keys](#rule-required-array-keys)
[Same](#rule-same)
[Size](#rule-size)
[Sometimes](#validating-when-present)
[Starts With](#rule-starts-with)
[String](#rule-string)
[Timezone](#rule-timezone)
[Unique (Database)](#rule-unique)
[Uppercase](#rule-uppercase)
[URL](#rule-url)
[ULID](#rule-ulid)
[UUID](#rule-uuid)

</div>

<a name="rule-accepted"></a>
#### accepted

验证字段必须为 `"yes"`、`"on"`、`1` 或 `true`。这适用于验证"服务条款"接受或类似字段。

<a name="rule-accepted-if"></a>
#### accepted_if:anotherfield,value,...

如果另一个验证字段等于指定值，则验证字段必须为 `"yes"`、`"on"`、`1` 或 `true`。这适用于验证"服务条款"接受或类似字段。

<a name="rule-active-url"></a>
#### active_url

验证字段必须根据 `dns_get_record` PHP 函数具有有效的 A 或 AAAA 记录。提供的 URL 的主机名使用 `parse_url` PHP 函数提取，然后传递给 `dns_get_record`。

<a name="rule-after"></a>
#### after:_date_

验证字段必须是给定日期之后的值。日期将传递给 `strtotime` PHP 函数以转换为有效的 `DateTime` 实例：

    'start_date' => 'required|date|after:tomorrow'

除了传递要由 `strtotime` 评估的日期字符串外，可以指定另一个字段与日期比较：

    'finish_date' => 'required|date|after:start_date'

<a name="rule-after-or-equal"></a>
#### after\_or\_equal:_date_

验证字段必须是给定日期之后或等于的值。更多信息请参见 [after](#rule-after) 规则。

<a name="rule-alpha"></a>
#### alpha

验证字段必须完全是 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 中包含的 Unicode 字母字符。

要将此验证规则限制为 ASCII 范围（`a-z` 和 `A-Z`）内的字符，可以向验证规则提供 `ascii` 选项：

```php
'username' => 'alpha:ascii',
```

<a name="rule-alpha-dash"></a>
#### alpha_dash

验证字段必须完全是 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中包含的 Unicode 字母数字字符，以及 ASCII 破折号（`-`）和 ASCII 下划线（`_`）。

要将此验证规则限制为 ASCII 范围（`a-z` 和 `A-Z`）内的字符，可以向验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_dash:ascii',
```

<a name="rule-alpha-num"></a>
#### alpha_num

验证字段必须完全是 [`\p{L}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[`\p{M}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 和 [`\p{N}`](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中包含的 Unicode 字母数字字符。

要将此验证规则限制为 ASCII 范围（`a-z` 和 `A-Z`）内的字符，可以向验证规则提供 `ascii` 选项：

```php
'username' => 'alpha_num:ascii',
```

<a name="rule-array"></a>
#### array

验证字段必须是 PHP `array`。

当向 `array` 规则提供额外值时，输入数组中的每个键必须存在于提供给规则的值列表中。在以下示例中，输入数组中的 `admin` 键无效，因为它不包含在提供给 `array` 规则的值列表中：

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

通常，应始终指定数组中允许存在的数组键。

<a name="rule-ascii"></a>
#### ascii

验证字段必须完全是 7 位 ASCII 字符。

<a name="rule-bail"></a>
#### bail

在首次验证失败后停止运行该字段的验证规则。

虽然 `bail` 规则仅在遇到验证失败时停止验证特定字段，但 `stopOnFirstFailure` 方法将告知验证器在发生单个验证失败后应停止验证所有属性：

    if ($validator->stopOnFirstFailure()->fails()) {
        // ...
    }

<a name="rule-before"></a>
#### before:_date_

验证字段必须是给定日期之前的值。日期将传递给 PHP `strtotime` 函数以转换为有效的 `DateTime` 实例。此外，与 [`after`](#rule-after) 规则一样，可以提供另一个验证字段的名称作为 `date` 的值。

<a name="rule-before-or-equal"></a>
#### before\_or\_equal:_date_

验证字段必须是给定日期之前或等于的值。日期将传递给 PHP `strtotime` 函数以转换为有效的 `DateTime` 实例。此外，与 [`after`](#rule-after) 规则一样，可以提供另一个验证字段的名称作为 `date` 的值。

<a name="rule-between"></a>
#### between:_min_,_max_

验证字段的大小必须在给定的 _min_ 和 _max_（含）之间。字符串、数值、数组和文件的评估方式与 [`size`](#rule-size) 规则相同。

<a name="rule-boolean"></a>
#### boolean

验证字段必须能够转换为布尔值。接受的输入为 `true`、`false`、`1`、`0`、`"1"` 和 `"0"`。

<a name="rule-confirmed"></a>
#### confirmed

验证字段必须有匹配的 `{field}_confirmation` 字段。例如，如果验证字段是 `password`，输入中必须存在匹配的 `password_confirmation` 字段。

<a name="rule-current-password"></a>
#### current_password

验证字段必须与已认证用户的密码匹配。可以使用规则的第一个参数指定[认证守卫](/docs/{{version}}/authentication)：

    'password' => 'current_password:api'

<a name="rule-date"></a>
#### date

验证字段必须是根据 `strtotime` PHP 函数的有效非相对日期。

<a name="rule-date-equals"></a>
#### date_equals:_date_

验证字段必须等于给定日期。日期将传递给 PHP `strtotime` 函数以转换为有效的 `DateTime` 实例。

<a name="rule-date-format"></a>
#### date_format:_format_,...

验证字段必须匹配给定的 _formats_ 之一。验证字段时应使用 `date` 或 `date_format` 之一，而非两者。此验证规则支持 PHP [DateTime](https://www.php.net/manual/en/class.datetime.php) 类支持的所有格式。

<a name="rule-decimal"></a>
#### decimal:_min_,_max_

验证字段必须是数值且必须包含指定的小数位数：

    // 必须恰好有两位小数 (9.99)...
    'price' => 'decimal:2'

    // 必须有 2 到 4 位小数...
    'price' => 'decimal:2,4'

<a name="rule-declined"></a>
#### declined

验证字段必须为 `"no"`、`"off"`、`0` 或 `false`。

<a name="rule-declined-if"></a>
#### declined_if:anotherfield,value,...

如果另一个验证字段等于指定值，则验证字段必须为 `"no"`、`"off"`、`0` 或 `false`。

<a name="rule-different"></a>
#### different:_field_

验证字段必须与 _field_ 具有不同的值。

<a name="rule-digits"></a>
#### digits:_value_

验证的整数必须具有精确长度 _value_。

<a name="rule-digits-between"></a>
#### digits_between:_min_,_max_

验证的整数长度必须在给定的 _min_ 和 _max_ 之间。

<a name="rule-dimensions"></a>
#### dimensions

验证的文件必须是满足规则参数指定尺寸约束的图像：

    'avatar' => 'dimensions:min_width=100,min_height=200'

可用约束有：_min\_width_、_max\_width_、_min\_height_、_max\_height_、_width_、_height_、_ratio_。

_ratio_ 约束应表示为宽度除以高度。可以由 `3/2` 这样的分数或 `1.5` 这样的浮点数指定：

    'avatar' => 'dimensions:ratio=3/2'

由于此规则需要多个参数，可以使用 `Rule::dimensions` 方法流畅构造规则：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($data, [
        'avatar' => [
            'required',
            Rule::dimensions()->maxWidth(1000)->maxHeight(500)->ratio(3 / 2),
        ],
    ]);

<a name="rule-distinct"></a>
#### distinct

验证数组时，验证字段不能有任何重复值：

    'foo.*.id' => 'distinct'

默认情况下，distinct 使用松散变量比较。要使用严格比较，可以在验证规则定义中添加 `strict` 参数：

    'foo.*.id' => 'distinct:strict'

可以在验证规则参数中添加 `ignore_case` 使规则忽略大小写差异：

    'foo.*.id' => 'distinct:ignore_case'

<a name="rule-doesnt-start-with"></a>
#### doesnt_start_with:_foo_,_bar_,...

验证字段不能以给定值之一开头。

<a name="rule-doesnt-end-with"></a>
#### doesnt_end_with:_foo_,_bar_,...

验证字段不能以给定值之一结尾。

<a name="rule-email"></a>
#### email

验证字段必须格式化为电子邮件地址。此验证规则利用 [`egulias/email-validator`](https://github.com/egulias/EmailValidator) 包验证电子邮件地址。默认应用 `RFCValidation` 验证器，但也可以应用其他验证样式：

    'email' => 'email:rfc,dns'

以上示例将应用 `RFCValidation` 和 `DNSCheckValidation` 验证。以下是可应用的验证样式完整列表：

- `rfc`: `RFCValidation`
- `strict`: `NoRFCWarningsValidation`
- `dns`: `DNSCheckValidation`
- `spoof`: `SpoofCheckValidation`
- `filter`: `FilterEmailValidation`
- `filter_unicode`: `FilterEmailValidation::unicode()`

`filter` 验证器使用 PHP 的 `filter_var` 函数，随 Laravel 提供，是 Laravel 5.8 版本之前的默认电子邮件验证行为。

> **Warning**  
> `dns` 和 `spoof` 验证器需要 PHP `intl` 扩展。

<a name="rule-ends-with"></a>
#### ends_with:_foo_,_bar_,...

验证字段必须以给定值之一结尾。

<a name="rule-enum"></a>
#### enum

`Enum` 规则是基于类的规则，验证验证字段是否包含有效的枚举值。`Enum` 规则接受枚举名称作为其唯一构造函数参数：

    use App\Enums\ServerStatus;
    use Illuminate\Validation\Rules\Enum;

    $request->validate([
        'status' => [new Enum(ServerStatus::class)],
    ]);

> **Warning**  
> 枚举仅在 PHP 8.1+ 上可用。

<a name="rule-exclude"></a>
#### exclude

验证字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exclude-if"></a>
#### exclude_if:_anotherfield_,_value_

如果 _anotherfield_ 字段等于 _value_，验证字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

如果需要复杂的条件排除逻辑，可以使用 `Rule::excludeIf` 方法。此方法接受布尔值或闭包。给定闭包时，闭包应返回 `true` 或 `false` 以指示验证字段是否应排除：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($request->all(), [
        'role_id' => Rule::excludeIf($request->user()->is_admin),
    ]);

    Validator::make($request->all(), [
        'role_id' => Rule::excludeIf(fn () => $request->user()->is_admin),
    ]);

<a name="rule-exclude-unless"></a>
#### exclude_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于 _value_，验证字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。如果 _value_ 为 `null`（`exclude_unless:name,null`），除非比较字段为 `null` 或比较字段在请求数据中缺失，否则验证字段将被排除。

<a name="rule-exclude-with"></a>
#### exclude_with:_anotherfield_

如果 _anotherfield_ 字段存在，验证字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exclude-without"></a>
#### exclude_without:_anotherfield_

如果 _anotherfield_ 字段不存在，验证字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exists"></a>
#### exists:_table_,_column_

验证字段必须存在于给定数据库表中。

<a name="basic-usage-of-exists-rule"></a>
#### Exists 规则的基本用法

    'state' => 'exists:states'

如果未指定 `column` 选项，将使用字段名。因此，在此情况下，规则将验证 `states` 数据库表包含 `state` 列值匹配请求 `state` 属性值的记录。

<a name="specifying-a-custom-column-name"></a>
#### 指定自定义列名

可以通过将数据库列名放在数据库表名之后来显式指定验证规则应使用的数据库列名：

    'state' => 'exists:states,abbreviation'

偶尔，可能需要为 `exists` 查询指定特定数据库连接。可以通过将连接名前置于表名来实现：

    'email' => 'exists:connection.staff,email'

除了直接指定表名外，可以指定应用于确定表名的 Eloquent 模型：

    'user_id' => 'exists:App\Models\User,id'

如果希望自定义验证规则执行的查询，可以使用 `Rule` 类流畅定义规则。在此示例中，我们还将验证规则指定为数组，而非使用 `|` 字符分隔：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($data, [
        'email' => [
            'required',
            Rule::exists('staff')->where(function ($query) {
                return $query->where('account_id', 1);
            }),
        ],
    ]);

可以通过将列名作为 `exists` 方法的第二个参数提供，显式指定 `Rule::exists` 方法生成的 `exists` 规则应使用的数据库列名：

    'state' => Rule::exists('states', 'abbreviation'),

<a name="rule-file"></a>
#### file

验证字段必须是成功上传的文件。

<a name="rule-filled"></a>
#### filled

验证字段在存在时不能为空。

<a name="rule-gt"></a>
#### gt:_field_

验证字段必须大于给定 _field_。两个字段必须是相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定评估。

<a name="rule-gte"></a>
#### gte:_field_

验证字段必须大于或等于给定 _field_。两个字段必须是相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定评估。

<a name="rule-image"></a>
#### image

验证的文件必须是图像（jpg、jpeg、png、bmp、gif、svg 或 webp）。

<a name="rule-in"></a>
#### in:_foo_,_bar_,...

验证字段必须包含在给定值列表中。由于此规则通常需要 `implode` 数组，可以使用 `Rule::in` 方法流畅构造规则：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($data, [
        'zones' => [
            'required',
            Rule::in(['first-zone', 'second-zone']),
        ],
    ]);

当 `in` 规则与 `array` 规则结合时，输入数组中的每个值必须存在于提供给 `in` 规则的值列表中。在以下示例中，输入数组中的 `LAS` 机场代码无效，因为它不包含在提供给 `in` 规则的机场列表中：

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

<a name="rule-in-array"></a>
#### in_array:_anotherfield_.*

验证字段必须存在于 _anotherfield_ 的值中。

<a name="rule-integer"></a>
#### integer

验证字段必须是整数。

> **Warning**  
> 此验证规则不验证输入是否为"integer"变量类型，仅验证输入是否为 PHP `FILTER_VALIDATE_INT` 规则接受的类型。如果需要验证输入为数字，请将此规则与 [`numeric` 验证规则](#rule-numeric)结合使用。

<a name="rule-ip"></a>
#### ip

验证字段必须是 IP 地址。

<a name="ipv4"></a>
#### ipv4

验证字段必须是 IPv4 地址。

<a name="ipv6"></a>
#### ipv6

验证字段必须是 IPv6 地址。

<a name="rule-json"></a>
#### json

验证字段必须是有效的 JSON 字符串。

<a name="rule-lt"></a>
#### lt:_field_

验证字段必须小于给定 _field_。两个字段必须是相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定评估。

<a name="rule-lte"></a>
#### lte:_field_

验证字段必须小于或等于给定 _field_。两个字段必须是相同类型。字符串、数值、数组和文件使用与 [`size`](#rule-size) 规则相同的约定评估。

<a name="rule-lowercase"></a>
#### lowercase

验证字段必须为小写。

<a name="rule-mac"></a>
#### mac_address

验证字段必须是 MAC 地址。

<a name="rule-max"></a>
#### max:_value_

验证字段必须小于或等于最大 _value_。字符串、数值、数组和文件的评估方式与 [`size`](#rule-size) 规则相同。

<a name="rule-max-digits"></a>
#### max_digits:_value_

验证的整数最大长度必须为 _value_。

<a name="rule-mimetypes"></a>
#### mimetypes:_text/plain_,...

验证的文件必须匹配给定的 MIME 类型之一：

    'video' => 'mimetypes:video/avi,video/mpeg,video/quicktime'

为确定上传文件的 MIME 类型，将读取文件内容并由框架尝试猜测 MIME 类型，可能与客户端提供的 MIME 类型不同。

<a name="rule-mimes"></a>
#### mimes:_foo_,_bar_,...

验证的文件必须具有与列出的扩展名之一对应的 MIME 类型。

<a name="basic-usage-of-mime-rule"></a>
#### MIME 规则的基本用法

    'photo' => 'mimes:jpg,bmp,png'

即使只需指定扩展名，此规则实际上通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="rule-min"></a>
#### min:_value_

验证字段必须具有最小 _value_。字符串、数值、数组和文件的评估方式与 [`size`](#rule-size) 规则相同。

<a name="rule-min-digits"></a>
#### min_digits:_value_

验证的整数最小长度必须为 _value_。

<a name="rule-multiple-of"></a>
#### multiple_of:_value_

验证字段必须是 _value_ 的倍数。

<a name="rule-missing"></a>
#### missing

验证字段不能存在于输入数据中。

 <a name="rule-missing-if"></a>
 #### missing_if:_anotherfield_,_value_,...

 如果 _anotherfield_ 字段等于任何 _value_，验证字段不能存在。

 <a name="rule-missing-unless"></a>
 #### missing_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任何 _value_，验证字段不能存在。

 <a name="rule-missing-with"></a>
 #### missing_with:_foo_,_bar_,...

仅当其他指定字段中的任何一个存在时，验证字段才不能存在。

 <a name="rule-missing-with-all"></a>
 #### missing_with_all:_foo_,_bar_,...

仅当所有其他指定字段都存在时，验证字段才不能存在。

<a name="rule-not-in"></a>
#### not_in:_foo_,_bar_,...

验证字段不能包含在给定值列表中。可以使用 `Rule::notIn` 方法流畅构造规则：

    use Illuminate\Validation\Rule;

    Validator::make($data, [
        'toppings' => [
            'required',
            Rule::notIn(['sprinkles', 'cherries']),
        ],
    ]);

<a name="rule-not-regex"></a>
#### not_regex:_pattern_

验证字段不能匹配给定的正则表达式。

内部，此规则使用 PHP `preg_match` 函数。指定的模式应遵循 `preg_match` 要求的相同格式，因此也应包含有效的分隔符。例如：`'email' => 'not_regex:/^.+$/i'`。

> **Warning**  
> 使用 `regex` / `not_regex` 模式时，可能需要使用数组而非 `|` 分隔符指定验证规则，特别是当正则表达式包含 `|` 字符时。

<a name="rule-nullable"></a>
#### nullable

验证字段可以为 `null`。

<a name="rule-numeric"></a>
#### numeric

验证字段必须是[数值](https://www.php.net/manual/en/function.is-numeric.php)。

<a name="rule-password"></a>
#### password

验证字段必须与已认证用户的密码匹配。

> **Warning**  
> 此规则已重命名为 `current_password`，计划在 Laravel 9 中移除。请改用 [Current Password](#rule-current-password) 规则。

<a name="rule-present"></a>
#### present

验证字段必须存在于输入数据中。

<a name="rule-prohibited"></a>
#### prohibited

验证字段必须缺失或为空。如果满足以下条件之一，字段为"空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-prohibited-if"></a>
#### prohibited_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，验证字段必须缺失或为空。如果满足以下条件之一，字段为"空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空 `Countable` 对象。
- 值为路径为空的上传文件。

如果需要复杂的条件禁止逻辑，可以使用 `Rule::prohibitedIf` 方法。此方法接受布尔值或闭包。给定闭包时，闭包应返回 `true` 或 `false` 以指示验证字段是否应禁止：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($request->all(), [
        'role_id' => Rule::prohibitedIf($request->user()->is_admin),
    ]);

    Validator::make($request->all(), [
        'role_id' => Rule::prohibitedIf(fn () => $request->user()->is_admin),
    ]);

<a name="rule-prohibited-unless"></a>
#### prohibited_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，验证字段必须缺失或为空。如果满足以下条件之一，字段为"空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-prohibits"></a>
#### prohibits:_anotherfield_,...

如果验证字段不缺失或为空，_anotherfield_ 中的所有字段必须缺失或为空。如果满足以下条件之一，字段为"空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空 `Countable` 对象。
- 值为路径为空的上传文件。

<a name="rule-regex"></a>
#### regex:_pattern_

验证字段必须匹配给定的正则表达式。

内部，此规则使用 PHP `preg_match` 函数。指定的模式应遵循 `preg_match` 要求的相同格式，因此也应包含有效的分隔符。例如：`'email' => 'regex:/^.+@.+$/i'`。

> **Warning**  
> 使用 `regex` / `not_regex` 模式时，可能需要使用数组而非 `|` 分隔符指定规则，特别是当正则表达式包含 `|` 字符时。

<a name="rule-required"></a>
#### required

验证字段必须存在于输入数据中且不为空。如果满足以下条件之一，字段为"空"：

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空 `Countable` 对象。
- 值为无路径的上传文件。

<a name="rule-required-if"></a>
#### required_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，验证字段必须存在且不为空。

如果希望为 `required_if` 规则构造更复杂的条件，可以使用 `Rule::requiredIf` 方法。此方法接受布尔值或闭包。传递闭包时，闭包应返回 `true` 或 `false` 以指示验证字段是否必填：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($request->all(), [
        'role_id' => Rule::requiredIf($request->user()->is_admin),
    ]);

    Validator::make($request->all(), [
        'role_id' => Rule::requiredIf(fn () => $request->user()->is_admin),
    ]);

<a name="rule-required-unless"></a>
#### required_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，验证字段必须存在且不为空。这也意味着除非 _value_ 为 `null`，否则 _anotherfield_ 必须存在于请求数据中。如果 _value_ 为 `null`（`required_unless:name,null`），除非比较字段为 `null` 或比较字段在请求数据中缺失，否则验证字段将必填。

<a name="rule-required-with"></a>
#### required_with:_foo_,_bar_,...

仅当其他指定字段中的任何一个存在且不为空时，验证字段才必须存在且不为空。

<a name="rule-required-with-all"></a>
#### required_with_all:_foo_,_bar_,...

仅当所有其他指定字段都存在且不为空时，验证字段才必须存在且不为空。

<a name="rule-required-without"></a>
#### required_without:_foo_,_bar_,...

仅当其他指定字段中的任何一个为空或不存在时，验证字段才必须存在且不为空。

<a name="rule-required-without-all"></a>
#### required_without_all:_foo_,_bar_,...

仅当所有其他指定字段都为空或不存在时，验证字段才必须存在且不为空。

<a name="rule-required-array-keys"></a>
#### required_array_keys:_foo_,_bar_,...

验证字段必须是数组且必须至少包含指定的键。

<a name="rule-same"></a>
#### same:_field_

给定 _field_ 必须与验证字段匹配。

<a name="rule-size"></a>
#### size:_value_

验证字段的大小必须匹配给定 _value_。对于字符串数据，_value_ 对应字符数。对于数值数据，_value_ 对应给定的整数值（属性还必须具有 `numeric` 或 `integer` 规则）。对于数组，_size_ 对应数组的 `count`。对于文件，_size_ 对应文件大小（千字节）。看一些示例：

    // 验证字符串恰好 12 个字符长...
    'title' => 'size:12';

    // 验证提供的整数等于 10...
    'seats' => 'integer|size:10';

    // 验证数组恰好有 5 个元素...
    'tags' => 'array|size:5';

    // 验证上传文件恰好 512 千字节...
    'image' => 'file|size:512';

<a name="rule-starts-with"></a>
#### starts_with:_foo_,_bar_,...

验证字段必须以给定值之一开头。

<a name="rule-string"></a>
#### string

验证字段必须是字符串。如果希望允许字段也为 `null`，应为字段分配 `nullable` 规则。

<a name="rule-timezone"></a>
#### timezone

验证字段必须是根据 `timezone_identifiers_list` PHP 函数的有效时区标识符。

<a name="rule-unique"></a>
#### unique:_table_,_column_

验证字段不能存在于给定数据库表中。

**指定自定义表 / 列名：**

除了直接指定表名外，可以指定应用于确定表名的 Eloquent 模型：

    'email' => 'unique:App\Models\User,email_address'

`column` 选项可用于指定字段对应的数据库列。如果未指定 `column` 选项，将使用验证字段的名称。

    'email' => 'unique:users,email_address'

**指定自定义数据库连接**

偶尔，可能需要为验证器进行的数据库查询设置自定义连接。为此，可以将连接名前置于表名：

    'email' => 'unique:connection.users,email_address'

**强制唯一规则忽略给定 ID：**

有时，可能希望在唯一验证期间忽略给定 ID。例如，考虑包含用户名、邮箱地址和位置的"更新资料"页面。可能希望验证邮箱地址唯一。但如果用户仅更改名字字段而不更改邮箱字段，不希望因用户已是该邮箱地址的所有者而抛出验证错误。

为指示验证器忽略用户 ID，我们将使用 `Rule` 类流畅定义规则。在此示例中，我们还将验证规则指定为数组，而非使用 `|` 字符分隔规则：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    Validator::make($data, [
        'email' => [
            'required',
            Rule::unique('users')->ignore($user->id),
        ],
    ]);

> **Warning**  
> 切勿将任何用户控制的请求输入传递给 `ignore` 方法。相反，应仅传递系统生成的唯一 ID，如 Eloquent 模型实例的自增 ID 或 UUID。否则，应用将容易受到 SQL 注入攻击。

除了将模型键的值传递给 `ignore` 方法外，还可以传递整个模型实例。Laravel 将自动从模型中提取键：

    Rule::unique('users')->ignore($user)

如果表使用 `id` 以外的主键列名，可以在调用 `ignore` 方法时指定列名：

    Rule::unique('users')->ignore($user->id, 'user_id')

默认情况下，`unique` 规则将检查与正在验证的属性名称匹配的列的唯一性。但可以将不同的列名作为 `unique` 方法的第二个参数传递：

    Rule::unique('users', 'email_address')->ignore($user->id),

**添加额外 Where 子句：**

可以通过使用 `where` 方法自定义查询来指定额外查询条件。例如，添加一个查询条件，将查询范围限制为仅搜索 `account_id` 列值为 `1` 的记录：

    'email' => Rule::unique('users')->where(fn ($query) => $query->where('account_id', 1))

<a name="rule-uppercase"></a>
#### uppercase

验证字段必须为大写。

<a name="rule-url"></a>
#### url

验证字段必须是有效的 URL。

<a name="rule-ulid"></a>
#### ulid

验证字段必须是有效的[通用唯一词典可排序标识符](https://github.com/ulid/spec)（ULID）。

<a name="rule-uuid"></a>
#### uuid

验证字段必须是有效的 RFC 4122（版本 1、3、4 或 5）通用唯一标识符（UUID）。

<a name="conditionally-adding-rules"></a>
## 条件添加规则

<a name="skipping-validation-when-fields-have-certain-values"></a>
#### 字段具有特定值时跳过验证

偶尔可能希望如果另一个字段具有给定值则不验证给定字段。可以使用 `exclude_if` 验证规则实现。在此示例中，如果 `has_appointment` 字段值为 `false`，则不会验证 `appointment_date` 和 `doctor_name` 字段：

    use Illuminate\Support\Facades\Validator;

    $validator = Validator::make($data, [
        'has_appointment' => 'required|boolean',
        'appointment_date' => 'exclude_if:has_appointment,false|required|date',
        'doctor_name' => 'exclude_if:has_appointment,false|required|string',
    ]);

或者，可以使用 `exclude_unless` 规则在另一个字段具有给定值之前不验证给定字段：

    $validator = Validator::make($data, [
        'has_appointment' => 'required|boolean',
        'appointment_date' => 'exclude_unless:has_appointment,true|required|date',
        'doctor_name' => 'exclude_unless:has_appointment,true|required|string',
    ]);

<a name="validating-when-present"></a>
#### 存在时验证

在某些情况下，可能希望仅当字段存在于正在验证的数据中时才对该字段运行验证检查。要快速实现此目的，将 `sometimes` 规则添加到规则列表：

    $v = Validator::make($data, [
        'email' => 'sometimes|required|email',
    ]);

在以上示例中，仅当 `email` 字段存在于 `$data` 数组中时才会验证。

> **Note**  
> 如果尝试验证应始终存在但可能为空的字段，请查阅[关于可选字段的说明](#a-note-on-optional-fields)。

<a name="complex-conditional-validation"></a>
#### 复杂条件验证

有时可能希望基于更复杂的条件逻辑添加验证规则。例如，可能希望仅当另一个字段的值大于 100 时才要求给定字段。或者，可能需要两个字段仅当另一个字段存在时才具有给定值。添加这些验证规则不必痛苦。首先，使用永不更改的 _静态规则_ 创建 `Validator` 实例：

    use Illuminate\Support\Facades\Validator;

    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'games' => 'required|numeric',
    ]);

假设我们的 Web 应用用于游戏收藏者。如果游戏收藏者注册应用且拥有超过 100 个游戏，我们希望他们解释为什么拥有这么多游戏。例如，也许他们经营游戏转售店，或者只是喜欢收藏游戏。要有条件地添加此要求，可以在 `Validator` 实例上使用 `sometimes` 方法。

    $validator->sometimes('reason', 'required|max:500', function ($input) {
        return $input->games >= 100;
    });

传递给 `sometimes` 方法的第一个参数是条件验证的字段名。第二个参数是要添加的规则列表。如果作为第三个参数传递的闭包返回 `true`，将添加规则。此方法使构建复杂条件验证轻而易举。甚至可以一次为多个字段添加条件验证：

    $validator->sometimes(['reason', 'cost'], 'required', function ($input) {
        return $input->games >= 100;
    });

> **Note**  
> 传递给闭包的 `$input` 参数将是 `Illuminate\Support\Fluent` 实例，可用于访问正在验证的输入和文件。

<a name="complex-conditional-array-validation"></a>
#### 复杂条件数组验证

有时可能希望基于同一嵌套数组中索引未知的另一个字段验证字段。在这些情况下，可以允许闭包接收第二个参数，即正在验证的数组中的当前单个项：

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

    $validator->sometimes('channels.*.address', 'email', function ($input, $item) {
        return $item->type === 'email';
    });

    $validator->sometimes('channels.*.address', 'url', function ($input, $item) {
        return $item->type !== 'email';
    });

与传递给闭包的 `$input` 参数一样，当属性数据是数组时 `$item` 参数是 `Illuminate\Support\Fluent` 实例；否则为字符串。

<a name="validating-arrays"></a>
## 验证数组

如 [`array` 验证规则文档](#rule-array)所述，`array` 规则接受允许的数组键列表。如果数组中存在任何额外键，验证将失败：

    use Illuminate\Support\Facades\Validator;

    $input = [
        'user' => [
            'name' => 'Taylor Otwell',
            'username' => 'taylorotwell',
            'admin' => true,
        ],
    ];

    Validator::make($input, [
        'user' => 'array:username,locale',
    ]);

通常，应始终指定数组中允许存在的数组键。否则，验证器的 `validate` 和 `validated` 方法将返回所有已验证数据，包括数组及其所有键，即使这些键未被其他嵌套数组验证规则验证。

<a name="validating-nested-array-input"></a>
### 验证嵌套数组输入

验证基于嵌套数组的表单输入字段不必痛苦。可以使用"点表示法"验证数组中的属性。例如，如果传入 HTTP 请求包含 `photos[profile]` 字段，可以这样验证：

    use Illuminate\Support\Facades\Validator;

    $validator = Validator::make($request->all(), [
        'photos.profile' => 'required|image',
    ]);

也可以验证数组的每个元素。例如，要验证给定数组输入字段中的每个邮箱唯一，可以执行以下操作：

    $validator = Validator::make($request->all(), [
        'person.*.email' => 'email|unique:users',
        'person.*.first_name' => 'required_with:person.*.last_name',
    ]);

同样，可以在[语言文件中指定自定义验证消息](#custom-messages-for-specific-attributes)时使用 `*` 字符，使为基于数组的字段使用单一验证消息轻而易举：

    'custom' => [
        'person.*.email' => [
            'unique' => 'Each person must have a unique email address',
        ]
    ],

<a name="accessing-nested-array-data"></a>
#### 访问嵌套数组数据

有时在为属性分配验证规则时可能需要访问给定嵌套数组元素的值。可以使用 `Rule::forEach` 方法实现。`forEach` 方法接受一个闭包，将为正在验证的数组属性的每次迭代调用，并接收属性的值和显式、完全展开的属性名称。闭包应返回分配给数组元素的规则数组：

    use App\Rules\HasPermission;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;

    $validator = Validator::make($request->all(), [
        'companies.*.id' => Rule::forEach(function ($value, $attribute) {
            return [
                Rule::exists(Company::class, 'id'),
                new HasPermission('manage-company', $value),
            ];
        }),
    ]);

<a name="error-message-indexes-and-positions"></a>
### 错误消息索引与位置

验证数组时，可能希望在应用显示的错误消息中引用验证失败的特定项的索引或位置。为此，可以在[自定义验证消息](#manual-customizing-the-error-messages)中包含 `:index`（从 `0` 开始）和 `:position`（从 `1` 开始）占位符：

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

给定以上示例，验证将失败，用户将看到 _"Please describe photo #2."_ 的错误。

<a name="validating-files"></a>
## 验证文件

Laravel 提供了多种验证规则用于验证上传文件，如 `mimes`、`image`、`min` 和 `max`。虽然可以自由在验证文件时单独指定这些规则，Laravel 还提供了流畅的文件验证规则构建器，可能更方便：

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

如果应用接受用户上传的图像，可以使用 `File` 规则的 `image` 构造方法指示上传文件应为图像。此外，可以使用 `dimensions` 规则限制图像尺寸：

    use Illuminate\Support\Facades\Validator;
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

> **Note**  
> 有关验证图像尺寸的更多信息可在[尺寸规则文档](#rule-dimensions)中找到。

<a name="validating-files-file-types"></a>
#### 文件类型

即使调用 `types` 方法时只需指定扩展名，此方法实际上通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="validating-passwords"></a>
## 验证密码

为确保密码具有足够的复杂度，可以使用 Laravel 的 `Password` 规则对象：

    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rules\Password;

    $validator = Validator::make($request->all(), [
        'password' => ['required', 'confirmed', Password::min(8)],
    ]);

`Password` 规则对象允许轻松自定义应用的密码复杂度要求，如指定密码至少需要一个字母、数字、符号或混合大小写字符：

    // 至少 8 个字符...
    Password::min(8)

    // 至少一个字母...
    Password::min(8)->letters()

    // 至少一个大写和一个小写字母...
    Password::min(8)->mixedCase()

    // 至少一个数字...
    Password::min(8)->numbers()

    // 至少一个符号...
    Password::min(8)->symbols()

此外，可以使用 `uncompromised` 方法确保密码未在公共密码数据泄露中泄露：

    Password::min(8)->uncompromised()

内部，`Password` 规则对象使用 [k-Anonymity](https://en.wikipedia.org/wiki/K-anonymity) 模型，通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务确定密码是否已泄露，而不牺牲用户的隐私或安全。

默认情况下，如果密码在数据泄露中出现至少一次，将被视为已泄露。可以使用 `uncompromised` 方法的第一个参数自定义此阈值：

    // 确保密码在同一数据泄露中出现少于 3 次...
    Password::min(8)->uncompromised(3);

当然，可以链式调用以上示例中的所有方法：

    Password::min(8)
        ->letters()
        ->mixedCase()
        ->numbers()
        ->symbols()
        ->uncompromised()

<a name="defining-default-password-rules"></a>
#### 定义默认密码规则

可能发现在应用的单个位置指定密码的默认验证规则很方便。可以使用 `Password::defaults` 方法轻松实现，此方法接受闭包。传递给 `defaults` 方法的闭包应返回 Password 规则的默认配置。通常，应在应用某个服务提供者的 `boot` 方法中调用 `defaults` 规则：

```php
use Illuminate\Validation\Rules\Password;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Password::defaults(function () {
        $rule = Password::min(8);

        return $this->app->isProduction()
                    ? $rule->mixedCase()->uncompromised()
                    : $rule;
    });
}
```

然后，当希望将默认规则应用于正在验证的特定密码时，可以不带参数调用 `defaults` 方法：

    'password' => ['required', Password::defaults()],

偶尔，可能希望将额外验证规则附加到默认密码验证规则。可以使用 `rules` 方法实现：

    use App\Rules\ZxcvbnRule;

    Password::defaults(function () {
        $rule = Password::min(8)->rules([new ZxcvbnRule]);

        // ...
    });

<a name="custom-validation-rules"></a>
## 自定义验证规则

<a name="using-rule-objects"></a>
### 使用规则对象

Laravel 提供了多种有用的验证规则；但可能希望指定一些自己的规则。注册自定义验证规则的一种方法是使用规则对象。要生成新的规则对象，可以使用 `make:rule` Artisan 命令。让我们使用此命令生成一个验证字符串为大写的规则。Laravel 将把新规则放在 `app/Rules` 目录。如果此目录不存在，执行 Artisan 命令创建规则时 Laravel 将创建它：

```shell
php artisan make:rule Uppercase --invokable
```

创建规则后，就可以定义其行为。规则对象包含单个方法：`__invoke`。此方法接收属性名、其值和失败时应调用的回调（带验证错误消息）：

    <?php

    namespace App\Rules;

    use Illuminate\Contracts\Validation\InvokableRule;

    class Uppercase implements InvokableRule
    {
        /**
         * 运行验证规则。
         *
         * @param  string  $attribute
         * @param  mixed  $value
         * @param  \Closure  $fail
         * @return void
         */
        public function __invoke($attribute, $value, $fail)
        {
            if (strtoupper($value) !== $value) {
                $fail('The :attribute must be uppercase.');
            }
        }
    }

定义规则后，可以通过将规则对象实例与其他验证规则一起传递来将其附加到验证器：

    use App\Rules\Uppercase;

    $request->validate([
        'name' => ['required', 'string', new Uppercase],
    ]);

#### 翻译验证消息

除了向 `$fail` 闭包提供字面错误消息外，还可以提供[翻译字符串键](/docs/{{version}}/localization)并指示 Laravel 翻译错误消息：

    if (strtoupper($value) !== $value) {
        $fail('validation.uppercase')->translate();
    }

如有必要，可以向 `translate` 方法提供占位符替换和首选语言作为第一个和第二个参数：

    $fail('validation.location')->translate([
        'value' => $this->value,
    ], 'fr')

#### 访问额外数据

如果自定义验证规则类需要访问正在验证的所有其他数据，规则类可以实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。此接口要求类定义 `setData` 方法。此方法将由 Laravel 自动调用（在验证继续之前），带所有正在验证的数据：

    <?php

    namespace App\Rules;

    use Illuminate\Contracts\Validation\DataAwareRule;
    use Illuminate\Contracts\Validation\InvokableRule;

    class Uppercase implements DataAwareRule, InvokableRule
    {
        /**
         * 所有正在验证的数据。
         *
         * @var array
         */
        protected $data = [];

        // ...

        /**
         * 设置正在验证的数据。
         *
         * @param  array  $data
         * @return $this
         */
        public function setData($data)
        {
            $this->data = $data;

            return $this;
        }
    }

或者，如果验证规则需要访问执行验证的验证器实例，可以实现 `ValidatorAwareRule` 接口：

    <?php

    namespace App\Rules;

    use Illuminate\Contracts\Validation\InvokableRule;
    use Illuminate\Contracts\Validation\ValidatorAwareRule;

    class Uppercase implements InvokableRule, ValidatorAwareRule
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
         *
         * @param  \Illuminate\Validation\Validator  $validator
         * @return $this
         */
        public function setValidator($validator)
        {
            $this->validator = $validator;

            return $this;
        }
    }

<a name="using-closures"></a>
### 使用闭包

如果只需在整个应用中使用一次自定义规则的功能，可以使用闭包而非规则对象。闭包接收属性名、属性值和验证失败时应调用的 `$fail` 回调：

    use Illuminate\Support\Facades\Validator;

    $validator = Validator::make($request->all(), [
        'title' => [
            'required',
            'max:255',
            function ($attribute, $value, $fail) {
                if ($value === 'foo') {
                    $fail('The '.$attribute.' is invalid.');
                }
            },
        ],
    ]);

<a name="implicit-rules"></a>
### 隐式规则

默认情况下，当正在验证的属性不存在或包含空字符串时，不运行正常验证规则（包括自定义规则）。例如，[`unique`](#rule-unique) 规则不会对空字符串运行：

    use Illuminate\Support\Facades\Validator;

    $rules = ['name' => 'unique:users,name'];

    $input = ['name' => ''];

    Validator::make($input, $rules)->passes(); // true

要使自定义规则在属性为空时也运行，规则必须暗示属性必填。要快速生成新的隐式规则对象，可以使用带 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --invokable --implicit
```

> **Warning**  
> "隐式"规则仅 _暗示_ 属性必填。是否实际使缺失或空属性无效由你决定。
