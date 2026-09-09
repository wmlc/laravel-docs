# 交互式提示

- [简介](#introduction)
- [安装](#installation)
- [可用的提示类型](#available-prompts)
    - [文本](#text)
    - [多行文本](#textarea)
    - [数字](#number)
    - [密码](#password)
    - [确认](#confirm)
    - [单选](#select)
    - [多选](#multiselect)
    - [建议](#suggest)
    - [搜索](#search)
    - [多选搜索](#multisearch)
    - [暂停](#pause)
    - [自动补全](#autocomplete)
- [在验证前转换输入](#transforming-input-before-validation)
- [表单](#forms)
- [信息消息](#informational-messages)
- [表格](#tables)
- [加载动画](#spin)
- [进度条](#progress)
- [任务](#task)
- [流式输出](#stream)
- [终端标题](#terminal-title)
- [通知](#notifications)
- [清空终端](#clear)
- [终端相关注意事项](#terminal-considerations)
- [不支持的环境与后备方案](#fallbacks)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Prompts](https://github.com/laravel/prompts) 是一个 PHP 包，用于为命令行应用添加美观且友好的表单，并具备占位符文本和验证等类似浏览器的功能。

<img src="https://laravel.com/img/docs/prompts-example.png">

Laravel Prompts 非常适合在 [Artisan 控制台命令](/docs/{{version}}/artisan#writing-commands)中接收用户输入，但它也可以用于任何命令行 PHP 项目。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 以及带有 WSL 的 Windows。更多信息请参阅我们的[不支持的环境与后备方案](#fallbacks)文档。

<a name="installation"></a>
## 安装

Laravel Prompts 已包含在最新版本的 Laravel 中。

你也可以使用 Composer 包管理器将 Laravel Prompts 安装到其他 PHP 项目中：

```shell
composer require laravel/prompts
```

<a name="available-prompts"></a>
## 可用的提示类型

<a name="text"></a>
### 文本

`text` 函数会向用户展示给定的问题，接收用户输入，然后将其返回：

```php
use function Laravel\Prompts\text;

$name = text('What is your name?');
```

你还可以包含占位符文本、默认值和提示信息：

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

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$name = text(
    label: 'What is your name?',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = text(
    label: 'What is your name?',
    required: 'Your name is required.'
);
```

<a name="text-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

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

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

或者，你也可以借助 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数传递一个数组，其中包含属性名称和期望的验证规则：

```php
$name = text(
    label: 'What is your name?',
    validate: ['name' => 'required|max:255|unique:users']
);
```

<a name="textarea"></a>
### 多行文本

`textarea` 函数会向用户展示给定的问题，通过多行文本域接收用户输入，然后将其返回：

```php
use function Laravel\Prompts\textarea;

$story = textarea('Tell me a story.');
```

你还可以包含占位符文本、默认值和提示信息：

```php
$story = textarea(
    label: 'Tell me a story.',
    placeholder: 'This is a story about...',
    hint: 'This will be displayed on your profile.'
);
```

<a name="textarea-required"></a>
#### 必填值

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: 'A story is required.'
);
```

<a name="textarea-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

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

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

或者，你也可以借助 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数传递一个数组，其中包含属性名称和期望的验证规则：

```php
$story = textarea(
    label: 'Tell me a story.',
    validate: ['story' => 'required|max:10000']
);
```

<a name="number"></a>
### 数字

`number` 函数会向用户展示给定的问题，接收用户输入的数字，然后将其返回。`number` 函数允许用户使用上下箭头键来调整数字：

```php
use function Laravel\Prompts\number;

$number = number('How many copies would you like?');
```

你还可以包含占位符文本、默认值和提示信息：

```php
$name = number(
    label: 'How many copies would you like?',
    placeholder: '5',
    default: 1,
    hint: 'This will be determine how many copies to create.'
);
```

<a name="number-required"></a>
#### 必填值

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$copies = number(
    label: 'How many copies would you like?',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$copies = number(
    label: 'How many copies would you like?',
    required: 'A number of copies is required.'
);
```

<a name="number-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

```php
$copies = number(
    label: 'How many copies would you like?',
    validate: fn (?int $value) => match (true) {
        $value < 1 => 'At least one copy is required.',
        $value > 100 => 'You may not create more than 100 copies.',
        default => null
    }
);
```

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

或者，你也可以借助 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数传递一个数组，其中包含属性名称和期望的验证规则：

```php
$copies = number(
    label: 'How many copies would you like?',
    validate: ['copies' => 'required|integer|min:1|max:100']
);
```

<a name="password"></a>
### 密码

`password` 函数与 `text` 函数类似，但用户在控制台中输入时会以掩码显示。这在询问密码等敏感信息时非常有用：

```php
use function Laravel\Prompts\password;

$password = password('What is your password?');
```

你还可以包含占位符文本和提示信息：

```php
$password = password(
    label: 'What is your password?',
    placeholder: 'password',
    hint: 'Minimum 8 characters.'
);
```

<a name="password-required"></a>
#### 必填值

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$password = password(
    label: 'What is your password?',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$password = password(
    label: 'What is your password?',
    required: 'The password is required.'
);
```

<a name="password-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

```php
$password = password(
    label: 'What is your password?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 8 => 'The password must be at least 8 characters.',
        default => null
    }
);
```

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

或者，你也可以借助 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数传递一个数组，其中包含属性名称和期望的验证规则：

```php
$password = password(
    label: 'What is your password?',
    validate: ['password' => 'min:8']
);
```

<a name="confirm"></a>
### 确认

如果你需要向用户询问「是或否」的确认，可以使用 `confirm` 函数。用户可以使用箭头键或按 `y` 或 `n` 来选择回答。该函数会返回 `true` 或 `false`。

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('Do you accept the terms?');
```

你还可以包含默认值、自定义的「是」和「否」标签文案，以及提示信息：

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
#### 要求必须选择「是」

必要时，你可以通过传递 `required` 参数来要求用户必须选择「是」：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: 'You must accept the terms to continue.'
);
```

<a name="select"></a>
### 单选

如果你需要用户从一组预定义的选项中进行选择，可以使用 `select` 函数：

```php
use function Laravel\Prompts\select;

$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner']
);
```

你还可以指定默认选项和提示信息：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner'],
    default: 'Owner',
    hint: 'The role may be changed at any time.'
);
```

你也可以向 `options` 参数传递一个关联数组，这样返回的将是所选选项的键而非其值：

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

列表最多显示五个选项，超出后开始滚动。你可以通过传递 `scroll` 参数来自定义这个数量：

```php
$role = select(
    label: 'Which category would you like to assign?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="select-info"></a>
#### 次要信息

`info` 参数可用于显示当前高亮选项的附加信息。当提供闭包时，闭包会接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner',
    ],
    info: fn (string $value) => match ($value) {
        'member' => 'Can view and comment.',
        'contributor' => 'Can view, comment, and edit.',
        'owner' => 'Full access to all resources.',
        default => null,
    }
);
```

如果信息不依赖于高亮选项，你也可以向 `info` 参数传递一个静态字符串：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner'],
    info: 'The role may be changed at any time.'
);
```

<a name="select-validation"></a>
#### 额外验证

与其他提示函数不同，`select` 函数不接受 `required` 参数，因为不可能什么都不选。不过，如果你需要展示某个选项但不允许选择它，可以向 `validate` 参数传递一个闭包：

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

如果 `options` 参数是关联数组，闭包将接收到所选的键；否则将接收到所选的值。该闭包可以返回一条错误消息；如果验证通过，则返回 `null`。

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

你还可以指定默认选项和提示信息：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: ['Read', 'Create', 'Update', 'Delete'],
    default: ['Read', 'Create'],
    hint: 'Permissions may be updated at any time.'
);
```

你也可以向 `options` 参数传递一个关联数组，这样返回的将是所选选项的键而非其值：

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

列表最多显示五个选项，超出后开始滚动。你可以通过传递 `scroll` 参数来自定义这个数量：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="multiselect-info"></a>
#### 次要信息

`info` 参数可用于显示当前高亮选项的附加信息。当提供闭包时，闭包会接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$permissions = multiselect(
    label: 'What permissions should be assigned?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
    ],
    info: fn (string $value) => match ($value) {
        'read' => 'View resources and their properties.',
        'create' => 'Create new resources.',
        'update' => 'Modify existing resources.',
        'delete' => 'Permanently remove resources.',
        default => null,
    }
);
```

<a name="multiselect-required"></a>
#### 要求必须选择

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制要求至少选择一个选项：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: true
);
```

如果你想自定义验证消息，可以向 `required` 参数提供一个字符串：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    required: 'You must select at least one category'
);
```

<a name="multiselect-validation"></a>
#### 额外验证

如果你需要展示某个选项但不允许选择它，可以向 `validate` 参数传递一个闭包：

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

如果 `options` 参数是关联数组，闭包将接收到所选的键；否则将接收到所选的值。该闭包可以返回一条错误消息；如果验证通过，则返回 `null`。

<a name="suggest"></a>
### 建议

`suggest` 函数可用于为可能的选项提供自动补全。无论自动补全提示如何，用户仍可以输入任何答案：

```php
use function Laravel\Prompts\suggest;

$name = suggest('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以向 `suggest` 函数的第二个参数传递一个闭包。该闭包会在用户每输入一个字符时被调用。闭包应接受一个包含用户当前输入的字符串参数，并返回一个用于自动补全的选项数组：

```php
$name = suggest(
    label: 'What is your name?',
    options: fn ($value) => collect(['Taylor', 'Dayle'])
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
)
```

你还可以包含占位符文本、默认值和提示信息：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    placeholder: 'E.g. Taylor',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

<a name="suggest-info"></a>
#### 次要信息

`info` 参数可用于显示当前高亮选项的附加信息。当提供闭包时，闭包会接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    info: fn (string $value) => match ($value) {
        'Taylor' => 'Administrator',
        'Dayle' => 'Contributor',
        default => null,
    }
);
```

<a name="suggest-required"></a>
#### 必填值

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: 'Your name is required.'
);
```

<a name="suggest-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

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

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

或者，你也可以借助 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数传递一个数组，其中包含属性名称和期望的验证规则：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: ['name' => 'required|min:3|max:255']
);
```

<a name="search"></a>
### 搜索

如果你有大量选项供用户选择，`search` 函数允许用户先输入搜索关键词来过滤结果，再使用箭头键选择选项：

```php
use function Laravel\Prompts\search;

$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

该闭包会接收用户当前输入的文本，且必须返回一个选项数组。如果你返回关联数组，则返回的是所选选项的键；否则返回的是其值。

在过滤一个打算返回值的数组时，应使用 `array_values` 函数或集合的 `values` 方法，以确保数组不会变成关联数组：

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

你还可以包含占位符文本和提示信息：

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

列表最多显示五个选项，超出后开始滚动。你可以通过传递 `scroll` 参数来自定义这个数量：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="search-info"></a>
#### 次要信息

`info` 参数可用于显示当前高亮选项的附加信息。当提供闭包时，闭包会接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    info: fn (int $userId) => User::find($userId)?->email
);
```

<a name="search-validation"></a>
#### 额外验证

如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

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

如果 `options` 闭包返回关联数组，则该闭包将接收到所选的键；否则将接收到所选的值。该闭包可以返回一条错误消息；如果验证通过，则返回 `null`。

<a name="multisearch"></a>
### 多选搜索

如果你有大量可搜索的选项，并且需要用户能够选择多个条目，`multisearch` 函数允许用户先输入搜索关键词来过滤结果，再使用箭头键和空格键选择选项：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    'Search for the users that should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

该闭包会接收用户当前输入的文本，且必须返回一个选项数组。如果你返回关联数组，则返回的是所选选项的键；否则返回的是其值。

在过滤一个打算返回值的数组时，应使用 `array_values` 函数或集合的 `values` 方法，以确保数组不会变成关联数组：

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

你还可以包含占位符文本和提示信息：

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

列表最多显示五个选项，超出后开始滚动。你可以通过提供 `scroll` 参数来自定义这个数量：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="multisearch-info"></a>
#### 次要信息

`info` 参数可用于显示当前高亮选项的附加信息。当提供闭包时，闭包会接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    info: fn (int $userId) => User::find($userId)?->email
);
```

<a name="multisearch-required"></a>
#### 要求必须选择

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制要求至少选择一个选项：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: true
);
```

如果你想自定义验证消息，也可以向 `required` 参数提供一个字符串：

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

如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

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

如果 `options` 闭包返回关联数组，则该闭包将接收到所选的键；否则将接收到所选的值。该闭包可以返回一条错误消息；如果验证通过，则返回 `null`。

<a name="pause"></a>
### 暂停

`pause` 函数可用于向用户展示信息文本，并等待用户按下 Enter / Return 键确认继续：

```php
use function Laravel\Prompts\pause;

pause('Press ENTER to continue.');
```

<a name="autocomplete"></a>
### 自动补全

`autocomplete` 函数可用于为可能的选项提供内联自动补全。用户输入时，与其输入匹配的建议会以幽灵文本的形式出现，可以按 `Tab` 或右箭头键来接受：

```php
use function Laravel\Prompts\autocomplete;

$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim']
);
```

你还可以包含占位符文本、默认值和提示信息：

```php
$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim'],
    placeholder: 'E.g. Taylor',
    default: $user?->name,
    hint: 'Use tab to accept, up/down to cycle.'
);
```

<a name="autocomplete-closure"></a>
#### 动态选项

你也可以传递一个闭包来根据用户输入动态生成选项。该闭包会在用户每输入一个字符时被调用，并应返回一个用于自动补全的选项数组：

```php
$file = autocomplete(
    label: 'Which file?',
    options: fn (string $value) => collect($files)
        ->filter(fn ($file) => str_starts_with(strtolower($file), strtolower($value)))
        ->values()
        ->all(),
);
```

<a name="autocomplete-required"></a>
#### 必填值

如果要求用户必须输入一个值，可以传递 `required` 参数：

```php
$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim'],
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim'],
    required: 'Your name is required.'
);
```

<a name="autocomplete-validation"></a>
#### 额外验证

最后，如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

```php
$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        strlen($value) > 255 => 'The name must not exceed 255 characters.',
        default => null
    }
);
```

该闭包会接收已输入的值，可以返回一条错误消息；如果验证通过，则返回 `null`。

<a name="transforming-input-before-validation"></a>
## 在验证前转换输入

有时，你可能希望在验证之前先转换提示的输入。例如，你可能希望移除字符串中的空白字符。为此，许多提示函数都提供了 `transform` 参数，它接受一个闭包：

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

通常，你会有多个按顺序展示的提示，用于在执行后续操作之前收集信息。你可以使用 `form` 函数创建一组分组的提示，供用户依次填写：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', required: true)
    ->password('What is your password?', validate: ['password' => 'min:8'])
    ->confirm('Do you accept the terms?')
    ->submit();
```

`submit` 方法将返回一个数字索引的数组，包含表单中所有提示的响应。不过，你可以通过 `name` 参数为每个提示指定名称。指定名称后，就可以通过该名称访问对应提示的响应：

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

使用 `form` 函数的主要好处是，用户可以通过 `CTRL + U` 返回表单中之前的提示。这样，用户无需取消并重新填写整个表单，就能修正错误或更改选择。

如果你需要对表单中的某个提示进行更细粒度的控制，可以调用 `add` 方法，而非直接调用某个提示函数。`add` 方法会接收用户此前提供的所有响应：

```php
use function Laravel\Prompts\form;
use function Laravel\Prompts\outro;
use function Laravel\Prompts\text;

$responses = form()
    ->text('What is your name?', required: true, name: 'name')
    ->add(function ($responses) {
        return text("How old are you, {$responses['name']}?");
    }, name: 'age')
    ->submit();

outro("Your name is {$responses['name']} and you are {$responses['age']} years old.");
```

<a name="informational-messages"></a>
## 信息消息

`note`、`info`、`warning`、`error` 和 `alert` 函数可用于显示信息消息：

```php
use function Laravel\Prompts\info;

info('Package installed successfully.');
```

<a name="tables"></a>
## 表格

`table` 函数让展示多行多列数据变得轻而易举。你只需提供列名和表格数据即可：

```php
use function Laravel\Prompts\table;

table(
    headers: ['Name', 'Email'],
    rows: User::all(['name', 'email'])->toArray()
);
```

<a name="spin"></a>
## 加载动画

`spin` 函数在执行指定回调期间，会显示一个加载动画（spinner）以及一条可选的消息。它用于指示正在进行的处理过程，并在完成后返回回调的结果：

```php
use function Laravel\Prompts\spin;

$response = spin(
    callback: fn () => Http::get('http://example.com'),
    message: 'Fetching response...'
);
```

> [!WARNING]
> `spin` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来驱动加载动画。当该扩展不可用时，将显示一个静态版本的加载动画。

<a name="progress"></a>
## 进度条

对于长时间运行的任务，显示一个告知用户任务完成进度的进度条会很有帮助。使用 `progress` 函数时，Laravel 会显示一个进度条，并在每次迭代给定可迭代值时推进其进度：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: fn ($user) => $this->performTask($user)
);
```

`progress` 函数的行为类似 map 函数，会返回一个数组，其中包含回调每次迭代的返回值。

回调还可以接受 `Laravel\Prompts\Progress` 实例，让你可以在每次迭代时修改标签和提示信息：

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

有时，你可能需要更手动地控制进度条的推进方式。首先，定义处理过程将要迭代的总步数。然后，每处理完一个条目，就通过 `advance` 方法推进进度条：

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

<a name="task"></a>
## 任务

`task` 函数在执行给定回调期间，会显示一个带标签的任务、一个加载动画以及一个滚动的实时输出区域。它非常适合包装依赖安装或部署脚本等长时间运行的处理过程，让你能够实时了解正在发生的事情：

```php
use function Laravel\Prompts\task;

task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        // 长时间运行的处理过程...
    }
);
```

回调会接收一个 `Logger` 实例，你可以用它来在任务的输出区域中显示日志行、状态消息和流式文本。

> [!WARNING]
> `task` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来驱动加载动画。当该扩展不可用时，将显示一个静态版本的任务。

<a name="task-logging"></a>
#### 记录日志行

`line` 方法会向任务的滚动输出区域写入一行日志：

```php
task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        $logger->line('Resolving packages...');
        // ...
        $logger->line('Downloading laravel/framework');
        // ...
    }
);
```

<a name="task-status-messages"></a>
#### 状态消息

你可以使用 `success`、`warning` 和 `error` 方法来显示状态消息。这些消息会以固定的高亮形式显示在滚动日志区域的上方：

```php
task(
    label: 'Deploying application',
    callback: function ($logger) {
        $logger->line('Pulling latest changes...');
        // ...
        $logger->success('Changes pulled!');

        $logger->line('Running migrations...');
        // ...
        $logger->warning('No new migrations to run.');

        $logger->line('Clearing cache...');
        // ...
        $logger->success('Cache cleared!');
    }
);
```

<a name="task-label"></a>
#### 更新标签

`label` 方法允许你在任务运行期间更新任务标签：

```php
task(
    label: 'Starting deployment...',
    callback: function ($logger) {
        $logger->label('Pulling latest changes...');
        // ...
        $logger->label('Running migrations...');
        // ...
        $logger->label('Clearing cache...');
        // ...
    }
);
```

<a name="task-streaming"></a>
#### 流式文本

对于逐步产生输出的处理过程（例如 AI 生成的回复），`partial` 方法允许你逐词或逐块地流式输出文本。流式输出完成后，调用 `commitPartial` 来完成输出：

```php
task(
    label: 'Generating response...',
    callback: function ($logger) {
        foreach ($words as $word) {
            $logger->partial($word . ' ');
        }

        $logger->commitPartial();
    }
);
```

<a name="task-limit"></a>
#### 自定义输出行数限制

默认情况下，任务最多显示 10 行滚动输出。你可以通过 `limit` 参数自定义这个数量：

```php
task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        // ...
    },
    limit: 20
);
```

<a name="stream"></a>
## 流式输出

`stream` 函数会显示流入终端的文本，非常适合展示 AI 生成的内容或任何逐步到达的文本：

```php
use function Laravel\Prompts\stream;

$stream = stream();

foreach ($words as $word) {
    $stream->append($word . ' ');
    usleep(25_000); // 模拟数据块之间的延迟...
}

$stream->close();
```

`append` 方法会向流中添加文本，并以渐进的淡入效果渲染。所有内容流式输出完成后，调用 `close` 方法来完成输出并恢复光标。

<a name="terminal-title"></a>
## 终端标题

`title` 函数会更新用户终端窗口或标签页的标题：

```php
use function Laravel\Prompts\title;

title('Installing Dependencies');
```

要将终端标题重置为默认值，请传递一个空字符串：

```php
title('');
```

<a name="notifications"></a>
## 通知

`notify` 函数会从终端发送原生桌面通知：

```php
use function Laravel\Prompts\notify;

notify('Build Complete', 'Deployed to production');
```

通知在 macOS（通过 `osascript`）和 Linux（通过 `notify-send`，并带有 `kdialog` 后备）上受支持。

在 macOS 上，你还可以包含 `subtitle` 和 `sound`：

```php
notify(
    title: 'Build Complete',
    body: 'Deployed to production',
    subtitle: 'staging-server',
    sound: 'Glass',
);
```

在 Linux 上，你可以提供自定义的 `icon`：

```php
notify(
    title: 'Build Complete',
    body: 'Deployed to production',
    icon: '/path/to/icon.png',
);
```

<a name="clear"></a>
## 清空终端

`clear` 函数可用于清空用户的终端：

```php
use function Laravel\Prompts\clear;

clear();
```

<a name="terminal-considerations"></a>
## 终端相关注意事项

<a name="terminal-width"></a>
#### 终端宽度

如果任何标签、选项或验证消息的长度超过了用户终端的「列」数，它们将被自动截断以适应终端宽度。如果你的用户可能使用较窄的终端，请考虑尽量缩短这些字符串的长度。通常，74 个字符是一个安全的最大长度，可以支持 80 字符宽的终端。

<a name="terminal-height"></a>
#### 终端高度

对于任何接受 `scroll` 参数的提示，所配置的值会被自动缩小，以适应用户终端的高度，同时为验证消息预留空间。

<a name="fallbacks"></a>
## 不支持的环境与后备方案

Laravel Prompts 支持 macOS、Linux 以及带有 WSL 的 Windows。由于 Windows 版 PHP 的限制，目前在 WSL 之外的 Windows 上无法使用 Laravel Prompts。

因此，Laravel Prompts 支持回退到替代实现，例如 [Symfony Console Question Helper](https://symfony.com/doc/current/components/console/helpers/questionhelper.html)。

> [!NOTE]
> 在将 Laravel Prompts 与 Laravel 框架一起使用时，每个提示的后备方案都已为你配置好，并会在不支持的环境中自动启用。

<a name="fallback-conditions"></a>
#### 后备条件

如果你没有使用 Laravel，或者需要自定义何时启用后备行为，可以向 `Prompt` 类的 `fallbackWhen` 静态方法传递一个布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

<a name="fallback-behavior"></a>
#### 后备行为

如果你没有使用 Laravel，或者需要自定义后备行为，可以向每个提示类的 `fallbackUsing` 静态方法传递一个闭包：

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

必须为每个提示类单独配置后备方案。闭包会接收提示类的一个实例，且必须返回该提示所对应的合适类型。

<a name="testing"></a>
## 测试

Laravel 提供了多种方法，用于测试你的命令是否显示了预期的 Prompt 消息：

```php tab=Pest
test('report generation', function () {
    $this->artisan('report:generate')
        ->expectsPromptsInfo('Welcome to the application!')
        ->expectsPromptsWarning('This action cannot be undone')
        ->expectsPromptsError('Something went wrong')
        ->expectsPromptsAlert('Important notice!')
        ->expectsPromptsIntro('Starting process...')
        ->expectsPromptsOutro('Process completed!')
        ->expectsPromptsTable(
            headers: ['Name', 'Email'],
            rows: [
                ['Taylor Otwell', 'taylor@example.com'],
                ['Jason Beggs', 'jason@example.com'],
            ]
        )
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
public function test_report_generation(): void
{
    $this->artisan('report:generate')
        ->expectsPromptsInfo('Welcome to the application!')
        ->expectsPromptsWarning('This action cannot be undone')
        ->expectsPromptsError('Something went wrong')
        ->expectsPromptsAlert('Important notice!')
        ->expectsPromptsIntro('Starting process...')
        ->expectsPromptsOutro('Process completed!')
        ->expectsPromptsTable(
            headers: ['Name', 'Email'],
            rows: [
                ['Taylor Otwell', 'taylor@example.com'],
                ['Jason Beggs', 'jason@example.com'],
            ]
        )
        ->assertExitCode(0);
}
```
