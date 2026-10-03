# 提示

- [简介](#introduction)
- [安装](#installation)
- [可用的提示](#available-prompts)
    - [文本](#text)
    - [多行文本](#textarea)
    - [密码](#password)
    - [确认](#confirm)
    - [单选](#select)
    - [多选](#multiselect)
    - [建议](#suggest)
    - [搜索](#search)
    - [多选搜索](#multisearch)
    - [暂停](#pause)
- [在验证前转换输入](#transforming-input-before-validation)
- [表单](#forms)
- [信息提示](#informational-messages)
- [表格](#tables)
- [加载动画](#spin)
- [进度条](#progress)
- [清空终端](#clear)
- [终端注意事项](#terminal-considerations)
- [不受支持的环境与回退方案](#fallbacks)

<a name="introduction"></a>
## 简介

[Laravel Prompts](https://github.com/laravel/prompts) 是一个 PHP 包，用于为你的命令行应用添加美观且友好的表单，并提供类似浏览器的功能，包括占位文本和验证。

<img src="https://laravel.com/img/docs/prompts-example.png">

Laravel Prompts 非常适合在 [Artisan 命令行命令](/docs/{{version}}/artisan#writing-commands)中获取用户输入，也可以用于任意命令行 PHP 项目。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 以及搭配 WSL 的 Windows。更多信息请查看[不受支持的环境与回退方案](#fallbacks)的文档。

<a name="installation"></a>
## 安装

Laravel Prompts 已随 Laravel 的最新发行版一同提供。

你也可以使用 Composer 包管理器把它安装到其它 PHP 项目中：

```shell
composer require laravel/prompts
```

<a name="available-prompts"></a>
## 可用的提示

<a name="text"></a>
### 文本

`text` 函数会用给定的问题提示用户、接收其输入，然后返回该输入：

```php
use function Laravel\Prompts\text;

$name = text('What is your name?');
```

你还可以加入占位文本、默认值以及信息提示：

```php
$name = text(
    label: 'What is your name?',
    placeholder: 'E.g. Taylor Otwell',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

<a name="text-required"></a>
#### 必填值

如果你要求必须输入某个值，可以传入 `required` 参数：

```php
$name = text(
    label: 'What is your name?',
    required: true
);
```

如果你想定制验证消息，也可以传入一个字符串：

```php
$name = text(
    label: 'What is your name?',
    required: 'Your name is required.'
);
```

<a name="text-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

该闭包会接收到已输入的值，可以返回一条错误消息，验证通过时则返回 `null`。

此外，你还可以借助 Laravel 的[验证器](/docs/{{version}}/validation)的力量。为此，向 `validate` 参数提供一个包含属性名和期望验证规则的数组：

```php
$name = text(
    label: 'What is your name?',
    validate: ['name' => 'required|max:255|unique:users']
);
```

<a name="textarea"></a>
### 多行文本

`textarea` 函数会用给定的问题提示用户、通过多行文本域接收其输入，然后返回该输入：

```php
use function Laravel\Prompts\textarea;

$story = textarea('Tell me a story.');
```

你还可以加入占位文本、默认值以及信息提示：

```php
$story = textarea(
    label: 'Tell me a story.',
    placeholder: 'This is a story about...',
    hint: 'This will be displayed on your profile.'
);
```

<a name="textarea-required"></a>
#### 必填值

如果你要求必须输入某个值，可以传入 `required` 参数：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: true
);
```

如果你想定制验证消息，也可以传入一个字符串：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: 'A story is required.'
);
```

<a name="textarea-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$story = textarea(
    label: 'Tell me a story.',
    validate: fn (string $value) => match (true) {
        strlen($value) < 250 => 'The story must be at least 250 characters.',
        strlen($value) > 10000 => 'The story must not exceed 10,000 characters.',
        default => null
    }
);
```

该闭包会接收到已输入的值，可以返回一条错误消息，验证通过时则返回 `null`。

此外，你还可以借助 Laravel 的[验证器](/docs/{{version}}/validation)的力量。为此，向 `validate` 参数提供一个包含属性名和期望验证规则的数组：

```php
$story = textarea(
    label: 'Tell me a story.',
    validate: ['story' => 'required|max:10000']
);
```

<a name="password"></a>
### 密码

`password` 函数与 `text` 函数类似，但用户在控制台中输入时内容会被掩码显示。当询问密码这类敏感信息时，这会很有用：

```php
use function Laravel\Prompts\password;

$password = password('What is your password?');
```

你还可以加入占位文本和信息提示：

```php
$password = password(
    label: 'What is your password?',
    placeholder: 'password',
    hint: 'Minimum 8 characters.'
);
```

<a name="password-required"></a>
#### 必填值

如果你要求必须输入某个值，可以传入 `required` 参数：

```php
$password = password(
    label: 'What is your password?',
    required: true
);
```

如果你想定制验证消息，也可以传入一个字符串：

```php
$password = password(
    label: 'What is your password?',
    required: 'The password is required.'
);
```

<a name="password-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$password = password(
    label: 'What is your password?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 8 => 'The password must be at least 8 characters.',
        default => null
    }
);
```

该闭包会接收到已输入的值，可以返回一条错误消息，验证通过时则返回 `null`。

此外，你还可以借助 Laravel 的[验证器](/docs/{{version}}/validation)的力量。为此，向 `validate` 参数提供一个包含属性名和期望验证规则的数组：

```php
$password = password(
    label: 'What is your password?',
    validate: ['password' => 'min:8']
);
```

<a name="confirm"></a>
### 确认

如果你需要向用户询问「是或否」的确认，可以使用 `confirm` 函数。用户可以用方向键，或按 `y` 或 `n` 来选择回答。该函数会返回 `true` 或 `false`。

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('Do you accept the terms?');
```

你还可以加入默认值、为「Yes」和「No」标签定制文案，以及信息提示：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    default: false,
    yes: 'I accept',
    no: 'I decline',
    hint: 'The terms must be accepted to continue.'
);
```

<a name="confirm-required"></a>
#### 必须选择「Yes」

必要时，你可以通过传入 `required` 参数要求用户选择「Yes」：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: true
);
```

如果你想定制验证消息，也可以传入一个字符串：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: 'You must accept the terms to continue.'
);
```

<a name="select"></a>
### 单选

如果你需要用户从一组预定义的选项中选择，可以使用 `select` 函数：

```php
use function Laravel\Prompts\select;

$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner']
);
```

你还可以指定默认选项和信息提示：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner'],
    default: 'Owner',
    hint: 'The role may be changed at any time.'
);
```

你也可以向 `options` 参数传入一个关联数组，这样返回的就是所选选项的键而不是其值：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner',
    ],
    default: 'owner'
);
```

最多会显示五个选项，之后列表才开始滚动。你可以通过传入 `scroll` 参数来自定义这一行为：

```php
$role = select(
    label: 'Which category would you like to assign?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="select-validation"></a>
#### 额外验证

与其它提示函数不同，`select` 函数不接受 `required` 参数，因为不可能什么都不选。不过，如果你需要展示某个选项但阻止它被选中，可以向 `validate` 参数传入一个闭包：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner',
    ],
    validate: fn (string $value) =>
        $value === 'owner' && User::where('role', 'owner')->exists()
            ? 'An owner already exists.'
            : null
);
```

如果 `options` 参数是关联数组，该闭包会接收到所选的键；否则它接收到所选的值。该闭包可以返回一条错误消息，验证通过时则返回 `null`。

<a name="multiselect"></a>
### 多选

如果你需要用户能够选择多个选项，可以使用 `multiselect` 函数：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: ['Read', 'Create', 'Update', 'Delete']
);
```

你还可以指定默认选项和信息提示：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: ['Read', 'Create', 'Update', 'Delete'],
    default: ['Read', 'Create'],
    hint: 'Permissions may be updated at any time.'
);
```

你也可以向 `options` 参数传入一个关联数组，这样返回的就是所选选项的键而不是其值：

```php
$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
    ],
    default: ['read', 'create']
);
```

最多会显示五个选项，之后列表才开始滚动。你可以通过传入 `scroll` 参数来自定义这一行为：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="multiselect-required"></a>
#### 必须选择值

默认情况下，用户可以选择零个或多个选项。你可以传入 `required` 参数，改为要求选择一个或多个选项：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: true
);
```

如果你想定制验证消息，可以向 `required` 参数提供一个字符串：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: 'You must select at least one category'
);
```

<a name="multiselect-validation"></a>
#### 额外验证

如果你需要展示某个选项但阻止它被选中，可以向 `validate` 参数传入一个闭包：

```php
$permissions = multiselect(
    label: 'What permissions should the user have?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
    ],
    validate: fn (array $values) => ! in_array('read', $values)
        ? 'All users require the read permission.'
        : null
);
```

如果 `options` 参数是关联数组，该闭包会接收到所选的键；否则它接收到所选的值。该闭包可以返回一条错误消息，验证通过时则返回 `null`。

<a name="suggest"></a>
### 建议

`suggest` 函数可用于为可能的选项提供自动补全。无论是否有自动补全提示，用户仍然可以提供任何回答：

```php
use function Laravel\Prompts\suggest;

$name = suggest('What is your name?', ['Taylor', 'Dayle']);
```

此外，你也可以把闭包作为 `suggest` 函数的第二个参数传入。用户每输入一个字符，该闭包都会被调用一次。该闭包应当接受一个字符串参数，其中包含用户目前的输入，并返回用于自动补全的选项数组：

```php
$name = suggest(
    label: 'What is your name?',
    options: fn ($value) => collect(['Taylor', 'Dayle'])
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
:)
```

你还可以加入占位文本、默认值以及信息提示：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    placeholder: 'E.g. Taylor',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

<a name="suggest-required"></a>
#### 必填值

如果你要求必须输入某个值，可以传入 `required` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: true
);
```

如果你想定制验证消息，也可以传入一个字符串：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: 'Your name is required.'
);
```

<a name="suggest-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

该闭包会接收到已输入的值，可以返回一条错误消息，验证通过时则返回 `null`。

此外，你还可以借助 Laravel 的[验证器](/docs/{{version}}/validation)的力量。为此，向 `validate` 参数提供一个包含属性名和期望验证规则的数组：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: ['name' => 'required|min:3|max:255']
);
```

<a name="search"></a>
### 搜索

如果可供用户选择的选项很多，`search` 函数允许用户输入搜索查询来过滤结果，然后再用方向键选择某个选项：

```php
use function Laravel\Prompts\search;

$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

该闭包会接收到用户目前已输入的文本，并且必须返回一个选项数组。如果你返回关联数组，那么返回的就是所选选项的键；否则返回其值。

当你打算返回选项值而对数组进行过滤时，应使用 `array_values` 函数或集合的 `values` 方法，以确保数组不会变成关联数组：

```php
$names = collect(['Taylor', 'Abigail']);

$selected = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => $names
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
        ->values()
        ->all(),
);
```

你还可以加入占位文本和信息提示：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    placeholder: 'E.g. Taylor Otwell',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: 'The user will receive an email immediately.'
);
```

最多会显示五个选项，之后列表才开始滚动。你可以通过传入 `scroll` 参数来自定义这一行为：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="search-validation"></a>
#### 额外验证

如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (int|string $value) {
        $user = User::findOrFail($value);

        if ($user->opted_out) {
            return 'This user has opted-out of receiving mail.';
        }
    }
);
```

如果 `options` 闭包返回关联数组，那么该闭包会接收到所选的键；否则它接收到所选的值。该闭包可以返回一条错误消息，验证通过时则返回 `null`。

<a name="multisearch"></a>
### 多选搜索

如果可搜索的选项很多，同时需要用户能够选择多个条目，`multisearch` 函数允许用户输入搜索查询来过滤结果，然后再用方向键和空格键选择选项：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    'Search for the users that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

该闭包会接收到用户目前已输入的文本，并且必须返回一个选项数组。如果你返回关联数组，那么返回的就是所选选项的键；否则返回它们的值。

当你打算返回选项值而对数组进行过滤时，应使用 `array_values` 函数或集合的 `values` 方法，以确保数组不会变成关联数组：

```php
$names = collect(['Taylor', 'Abigail']);

$selected = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => $names
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
        ->values()
        ->all(),
);
```

你还可以加入占位文本和信息提示：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    placeholder: 'E.g. Taylor Otwell',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: 'The user will receive an email immediately.'
);
```

最多会显示五个选项，之后列表才开始滚动。你可以通过提供 `scroll` 参数来自定义这一行为：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="multisearch-required"></a>
#### 必须选择值

默认情况下，用户可以选择零个或多个选项。你可以传入 `required` 参数，改为要求选择一个或多个选项：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: true
);
```

如果你想定制验证消息，也可以向 `required` 参数提供一个字符串：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: 'You must select at least one user.'
);
```

<a name="multisearch-validation"></a>
#### 额外验证

如果你想执行额外的验证逻辑，可以向 `validate` 参数传入一个闭包：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (array $values) {
        $optedOut = User::whereLike('name', '%a%')->findMany($values);

        if ($optedOut->isNotEmpty()) {
            return $optedOut->pluck('name')->join(', ', ', and ').' have opted out.';
        }
    }
);
```

如果 `options` 闭包返回关联数组，那么该闭包会接收到所选的键；否则它接收到所选的值。该闭包可以返回一条错误消息，验证通过时则返回 `null`。

<a name="pause"></a>
### 暂停

`pause` 函数可用于向用户展示信息文本，并等待用户按 Enter／Return 键确认希望继续：

```php
use function Laravel\Prompts\pause;

pause('Press ENTER to continue.');
```

<a name="transforming-input-before-validation"></a>
## 在验证前转换输入

有时你可能希望在验证发生之前转换提示输入的内容。例如，你可能希望移除所提供字符串中的空白字符。为此，许多提示函数都提供了 `transform` 参数，它接受一个闭包：

```php
$name = text(
    label: 'What is your name?',
    transform: fn (string $value) => trim($value),
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

<a name="forms"></a>
## 表单

通常情况下，你会有多个提示按顺序展示以收集信息，然后再执行其它操作。你可以使用 `form` 函数创建一组分组提示，供用户逐一填写：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', required: true)
    ->password('What is your password?', validate: ['password' => 'min:8'])
    ->confirm('Do you accept the terms?')
    ->submit();
```

`submit` 方法会返回一个以数字为索引的数组，其中包含表单中所有提示的回答。不过，你也可以通过 `name` 参数为每个提示指定名称。当提供了名称后，就可以用该名称访问相应提示的回答：

```php
use App\Models\User;
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', required: true, name: 'name')
    ->password(
        label: 'What is your password?',
        validate: ['password' => 'min:8'],
        name: 'password'
    )
    ->confirm('Do you accept the terms?')
    ->submit();

User::create([
    'name' => $responses['name'],
    'password' => $responses['password'],
]);
```

使用 `form` 函数的主要好处是，用户可以用 `CTRL + U` 返回表单中的前一个提示。这样用户就能修正错误或更改选择，而无需取消并重新填写整张表单。

如果你需要对表单中的某个提示进行更精细的控制，可以调用 `add` 方法，而不是直接调用某个提示函数。`add` 方法会接收用户此前提供的所有回答：

```php
use function Laravel\Prompts\form;
use function Laravel\Prompts\outro;

$responses = form()
    ->text('What is your name?', required: true, name: 'name')
    ->add(function ($responses) {
        return text("How old are you, {$responses['name']}?");
    }, name: 'age')
    ->submit();

outro("Your name is {$responses['name']} and you are {$responses['age']} years old.");
```

<a name="informational-messages"></a>
## 信息提示

`note`、`info`、`warning`、`error` 和 `alert` 函数可用于展示信息提示：

```php
use function Laravel\Prompts\info;

info('Package installed successfully.');
```

<a name="tables"></a>
## 表格

`table` 函数让你可以轻松地展示多行多列的数据。你只需提供列名和表格数据：

```php
use function Laravel\Prompts\table;

table(
    headers: ['Name', 'Email'],
    rows: User::all(['name', 'email'])->toArray()
);
```

<a name="spin"></a>
## 加载动画

`spin` 函数会在执行指定回调期间展示一个加载动画以及一条可选消息。它用于指示进程正在进行，并在完成后返回回调的结果：

```php
use function Laravel\Prompts\spin;

$response = spin(
    message: 'Fetching response...',
    callback: fn () => Http::get('http://example.com')
);
```

> [!WARNING]
> `spin` 函数需要 `pcntl` PHP 扩展来驱动加载动画。当该扩展不可用时，会改为展示一个静态版本的加载动画。

<a name="progress"></a>
## 进度条

对于长时间运行的任务，显示进度条有助于告知用户任务的完成情况。使用 `progress` 函数，Laravel 会显示一个进度条，并在每次遍历给定的可迭代值时推进进度：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: fn ($user) => $this->performTask($user)
);
```

`progress` 函数的行为类似于映射函数，会返回一个数组，其中包含回调每次迭代的返回值。

回调还可以接受 `Laravel\Prompts\Progress` 实例，让你能在每次迭代时修改标签和提示：

```php
$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: function ($user, $progress) {
        $progress
            ->label("Updating {$user->name}")
            ->hint("Created on {$user->created_at}");

        return $this->performTask($user);
    },
    hint: 'This may take some time.'
);
```

有时你可能需要对进度条的推进方式进行更多手动控制。首先，定义整个过程将遍历的总步数。然后，在处理完每个条目后通过 `advance` 方法推进进度条：

```php
$progress = progress(label: 'Updating users', steps: 10);

$users = User::all();

$progress->start();

foreach ($users as $user) {
    $this->performTask($user);

    $progress->advance();
}

$progress->finish();
```

<a name="clear"></a>
## 清空终端

`clear` 函数可用于清空用户的终端：

```
use function Laravel\Prompts\clear;

clear();
```

<a name="terminal-considerations"></a>
## 终端注意事项

<a name="terminal-width"></a>
#### 终端宽度

如果任何标签、选项或验证消息的长度超过了用户终端的「列」数，它会被自动截断以适应。如果你的用户可能使用较窄的终端，请考虑缩短这些字符串的长度。一个通常安全的最大长度是 74 个字符，这样可以兼容 80 字符宽的终端。

<a name="terminal-height"></a>
#### 终端高度

对于任何接受 `scroll` 参数的提示，所配置的值都会自动缩减以适应用户终端的高度，其中包括为验证消息预留的空间。

<a name="fallbacks"></a>
## 不受支持的环境与回退方案

Laravel Prompts 支持 macOS、Linux 以及搭配 WSL 的 Windows。由于 Windows 版 PHP 存在限制，目前无法在 WSL 之外的 Windows 环境中使用 Laravel Prompts。

出于这个原因，Laravel Prompts 支持回退到备选实现，例如 [Symfony Console Question Helper](https://symfony.com/doc/7.0/components/console/helpers/questionhelper.html)。

> [!NOTE]
> 在 Laravel 框架中使用 Laravel Prompts 时，每个提示的回退方案都已为你配置好，并会在不受支持的环境中自动启用。

<a name="fallback-conditions"></a>
#### 回退条件

如果你不使用 Laravel，或需要定制何时启用回退行为，可以向 `Prompt` 类的 `fallbackWhen` 静态方法传入一个布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

<a name="fallback-behavior"></a>
#### 回退行为

如果你不使用 Laravel，或需要定制回退行为，可以向各个提示类的 `fallbackUsing` 静态方法传入一个闭包：

```php
use Laravel\Prompts\TextPrompt;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;

TextPrompt::fallbackUsing(function (TextPrompt $prompt) use ($input, $output) {
    $question = (new Question($prompt->label, $prompt->default ?: null))
        ->setValidator(function ($answer) use ($prompt) {
            if ($prompt->required && $answer === null) {
                throw new \RuntimeException(
                    is_string($prompt->required) ? $prompt->required : 'Required.'
                );
            }

            if ($prompt->validate) {
                $error = ($prompt->validate)($answer ?? '');

                if ($error) {
                    throw new \RuntimeException($error);
                }
            }

            return $answer;
        });

    return (new SymfonyStyle($input, $output))
        ->askQuestion($question);
});
```

回退方案必须为每个提示类单独配置。该闭包会接收到该提示类的一个实例，并且必须返回与该提示相匹配的合适类型。
