# Prompts（交互式提示）

- [简介](#introduction)
- [安装](#installation)
- [可用的 Prompt](#available-prompts)
    - [文本](#text)
    - [文本域](#textarea)
    - [数字](#number)
    - [密码](#password)
    - [确认](#confirm)
    - [选择](#select)
    - [多选](#multiselect)
    - [建议](#suggest)
    - [搜索](#search)
    - [多选搜索](#multisearch)
    - [暂停](#pause)
    - [自动补全](#autocomplete)
- [在验证之前转换输入](#transforming-input-before-validation)
- [表单](#forms)
- [信息消息](#informational-messages)
- [标注框](#callouts)
- [表格](#tables)
- [旋转指示器](#spin)
- [进度条](#progress)
- [任务](#task)
- [流式输出](#stream)
- [终端标题](#terminal-title)
- [清空终端](#clear)
- [终端注意事项](#terminal-considerations)
- [不支持的环境与回退](#fallbacks)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Prompts](https://github.com/laravel/prompts) 是一个 PHP 包，用于为命令行应用添加美观、用户友好的表单，并具备占位文本和验证等浏览器式功能。

<img src="https://laravel.com/img/docs/prompts-example.png">

Laravel Prompts 非常适合在你的 [Artisan 控制台命令](/docs/{{version}}/artisan#writing-commands)中接收用户输入，但也可以在任何命令行 PHP 项目中使用。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 以及带 WSL 的 Windows。有关更多信息，请参阅我们关于[不支持的环境与回退](#fallbacks)的文档。

<a name="installation"></a>
## 安装

Laravel Prompts 已包含在最新版本的 Laravel 中。

你也可以使用 Composer 包管理器将 Laravel Prompts 安装到其他 PHP 项目中：

```shell
composer require laravel/prompts
```

<a name="available-prompts"></a>
## 可用的 Prompt

<a name="text"></a>
### 文本

`text` 函数会使用给定问题提示用户，接受他们的输入，然后返回它：

```php
use function Laravel\Prompts\text;

$name = text('What is your name?');
```

你还可以包含占位文本、默认值和信息提示：

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

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$name = text(
    label: 'What is your name?',
    validate: ['name' => 'required|max:255|unique:users']
);
```

<a name="textarea"></a>
### 文本域

`textarea` 函数会使用给定问题提示用户，通过多行文本域接受他们的输入，然后返回它：

```php
use function Laravel\Prompts\textarea;

$story = textarea('Tell me a story.');
```

你还可以包含占位文本、默认值和信息提示：

```php
$story = textarea(
    label: 'Tell me a story.',
    placeholder: 'This is a story about...',
    hint: 'This will be displayed on your profile.'
);
```

<a name="textarea-required"></a>
#### 必填值

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$story = textarea(
    label: 'Tell me a story.',
    validate: ['story' => 'required|max:10000']
);
```

<a name="number"></a>
### 数字

`number` 函数会使用给定问题提示用户，接受他们的数字输入，然后返回它。`number` 函数允许用户使用上下箭头键来操作数字：

```php
use function Laravel\Prompts\number;

$number = number('How many copies would you like?');
```

你还可以包含占位文本、默认值和信息提示：

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

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$copies = number(
    label: 'How many copies would you like?',
    validate: ['copies' => 'required|integer|min:1|max:100']
);
```

<a name="password"></a>
### 密码

`password` 函数与 `text` 函数类似，但用户的输入在控制台中输入时会进行掩码处理。这在询问密码等敏感信息时很有用：

```php
use function Laravel\Prompts\password;

$password = password('What is your password?');
```

你还可以包含占位文本和信息提示：

```php
$password = password(
    label: 'What is your password?',
    placeholder: 'password',
    hint: 'Minimum 8 characters.'
);
```

<a name="password-required"></a>
#### 必填值

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$password = password(
    label: 'What is your password?',
    validate: ['password' => 'min:8']
);
```

<a name="confirm"></a>
### 确认

如果你需要询问用户"是或否"的确认，可以使用 `confirm` 函数。用户可以使用箭头键或按 `y` 或 `n` 来选择他们的响应。此函数将返回 `true` 或 `false`。

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('Do you accept the terms?');
```

你还可以包含默认值、为"是"和"否"标签自定义措辞，以及信息提示：

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
#### 要求选择"是"

如有必要，你可以通过传递 `required` 参数要求用户选择"是"：

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
### 选择

如果你需要用户从一组预定义的选项中进行选择，可以使用 `select` 函数：

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

你还可以向 `options` 参数传递关联数组，以返回所选键而不是其值：

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

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数自定义此行为：

```php
$role = select(
    label: 'Which category would you like to assign?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="select-info"></a>
#### 次要信息

`info` 参数可用于显示有关当前高亮选项的额外信息。提供闭包时，它将接收当前高亮选项的值，并应返回字符串或 `null`：

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

如果信息不依赖于高亮选项，你也可以向 `info` 参数传递静态字符串：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner'],
    info: 'The role may be changed at any time.'
);
```

<a name="select-validation"></a>
#### 额外验证

与其他 prompt 函数不同，`select` 函数不接受 `required` 参数，因为不可能什么都不选择。但是，如果你需要展示某个选项但阻止其被选中，可以向 `validate` 参数传递闭包：

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

如果 `options` 参数是关联数组，则闭包将接收所选键，否则接收所选值。闭包可以返回错误消息，如果验证通过则返回 `null`。

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

你还可以向 `options` 参数传递关联数组，以返回所选选项的键而不是其值：

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

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数自定义此行为：

```php
$categories = multiselect(
    label: 'What categories should be assigned?',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="multiselect-info"></a>
#### 次要信息

`info` 参数可用于显示有关当前高亮选项的额外信息。提供闭包时，它将接收当前高亮选项的值，并应返回字符串或 `null`：

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
#### 要求选择值

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制执行一个或多个选项：

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

如果你需要展示某个选项但阻止其被选中，可以向 `validate` 参数传递闭包：

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

如果 `options` 参数是关联数组，则闭包将接收所选键，否则接收所选值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="suggest"></a>
### 建议

`suggest` 函数可用于为可能的选择提供自动补全。用户仍然可以提供任何答案，无论自动补全提示如何：

```php
use function Laravel\Prompts\suggest;

$name = suggest('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以向 `suggest` 函数传递闭包作为第二个参数。每次用户输入一个字符时都会调用该闭包。闭包应接受一个包含用户到目前为止输入的字符串参数，并返回一个用于自动补全的选项数组：

```php
$name = suggest(
    label: 'What is your name?',
    options: fn ($value) => collect(['Taylor', 'Dayle'])
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
)
```

你还可以包含占位文本、默认值和信息提示：

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

`info` 参数可用于显示有关当前高亮选项的额外信息。提供闭包时，它将接收当前高亮选项的值，并应返回字符串或 `null`：

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

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: ['name' => 'required|min:3|max:255']
);
```

<a name="search"></a>
### 搜索

如果你有大量选项供用户选择，`search` 函数允许用户输入搜索查询来过滤结果，然后再使用箭头键选择选项：

```php
use function Laravel\Prompts\search;

$id = search(
    label: 'Search for the user that should receive the mail',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收用户到目前为止输入的文本，并且必须返回选项数组。如果你返回关联数组，则将返回所选选项的键，否则返回其值。

当过滤数组且你打算返回值时，应使用 `array_values` 函数或 `values` 集合方法，以确保数组不会变成关联数组：

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

你还可以包含占位文本和信息提示：

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

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数自定义此行为：

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

`info` 参数可用于显示有关当前高亮选项的额外信息。提供闭包时，它将接收当前高亮选项的值，并应返回字符串或 `null`：

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

如果 `options` 闭包返回关联数组，则闭包将接收所选键，否则接收所选值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="multisearch"></a>
### 多选搜索

如果你有大量可搜索的选项，并且需要用户能够选择多个项目，`multisearch` 函数允许用户输入搜索查询来过滤结果，然后再使用箭头键和空格键选择选项：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    'Search for users who should receive the mail',
    fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收用户到目前为止输入的文本，并且必须返回选项数组。如果你返回关联数组，则将返回所选选项的键；否则，返回其值。

当过滤数组且你打算返回值时，应使用 `array_values` 函数或 `values` 集合方法，以确保数组不会变成关联数组：

```php
$names = collect(['Taylor', 'Abigail']);

$selected = multisearch(
    label: 'Search for users who should receive the mail',
    options: fn (string $value) => $names
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
        ->values()
        ->all(),
);
```

你还可以包含占位文本和信息提示：

```php
$ids = multisearch(
    label: 'Search for users who should receive the mail',
    placeholder: 'E.g. Taylor Otwell',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: 'The user will receive an email immediately.'
);
```

列表开始滚动前最多显示五个选项。你可以通过提供 `scroll` 参数自定义此行为：

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

`info` 参数可用于显示有关当前高亮选项的额外信息。提供闭包时，它将接收当前高亮选项的值，并应返回字符串或 `null`：

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
#### 要求选择值

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制执行一个或多个选项：

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

如果 `options` 闭包返回关联数组，则闭包将接收所选键；否则，接收所选值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="pause"></a>
### 暂停

`pause` 函数可用于向用户显示信息文本，并等待他们按 Enter / Return 键确认继续的意愿：

```php
use function Laravel\Prompts\pause;

pause('Press ENTER to continue.');
```

<a name="autocomplete"></a>
### 自动补全

`autocomplete` 函数可用于为可能的选择提供内联自动补全。用户输入时，匹配其输入的选项会作为幽灵文本出现，可以通过按 `Tab` 或右箭头键接受：

```php
use function Laravel\Prompts\autocomplete;

$name = autocomplete(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle', 'Jess', 'Nuno', 'Tim']
);
```

你还可以包含占位文本、默认值和信息提示：

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

你也可以传递闭包来根据用户输入动态生成选项。每次用户输入一个字符时都会调用该闭包，并应返回用于自动补全的选项数组：

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

如果你要求输入值，可以传递 `required` 参数：

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

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

<a name="transforming-input-before-validation"></a>
## 在验证之前转换输入

有时你可能希望在验证发生之前转换 prompt 输入。例如，你可能希望移除任何提供字符串中的空白。为此，许多 prompt 函数提供了一个 `transform` 参数，它接受一个闭包：

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

通常，在执行额外操作之前，会有多个 prompt 按顺序显示以收集信息。你可以使用 `form` 函数创建一组供用户完成的 prompt：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', required: true)
    ->password('What is your password?', validate: ['password' => 'min:8'])
    ->confirm('Do you accept the terms?')
    ->submit();
```

`submit` 方法将返回一个包含表单所有 prompt 响应的数字索引数组。但是，你可以通过 `name` 参数为每个 prompt 提供一个名称。提供名称后，可以通过该名称访问命名 prompt 的响应：

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

使用 `form` 函数的主要好处是用户可以使用 `CTRL + U` 返回表单中之前的 prompt。这允许用户修复错误或更改选择，而无需取消并重启整个表单。

如果你需要对表单中的 prompt 进行更细粒度的控制，可以调用 `add` 方法，而不是直接调用某个 prompt 函数。`add` 方法会收到用户提供的所有先前响应：

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

<a name="callouts"></a>
## 标注框

`callout` 函数显示一个带标签和内容的框式消息。标注框非常适合显示应突出的重要信息，例如部署摘要、错误详情或状态更新：

```php
use function Laravel\Prompts\callout;

callout(
    label: 'Environment Configured',
    content: 'Your application is running in production mode with 4 workers.',
);
```

你可以传递 `warning` 或 `error` 作为 `type` 参数来更改标注框的视觉样式：

```php
callout(
    label: 'Deprecation Notice',
    content: 'The `--prefer-stable` flag will be removed in v4.0. Use `--stability=stable` instead.',
    type: 'warning',
);

callout(
    label: 'Database Connection Failed',
    content: 'Could not connect to MySQL on 127.0.0.1:3306.',
    type: 'error',
);
```

`info` 参数向标注框添加页脚行，这对于显示 ID 或时间戳等元数据很有用：

```php
callout(
    label: 'Deployment Summary',
    content: 'Your application was deployed to production.',
    info: 'deploy-id: d4f8a2c',
);
```

<a name="callout-rich-content"></a>
#### 富内容

你可以传递字符串和元素的数组，而不是传递字符串，以构建丰富、结构化的标注框。`Element` 类提供了用于创建标题、项目符号列表、编号列表、键值列表和链接的工厂方法：

```php
use Laravel\Prompts\Elements\Element;

use function Laravel\Prompts\callout;

callout('Deployment Summary', [
    'Your application was deployed to production at 2024-03-15 14:32 UTC.',
    Element::heading('What Changed'),
    Element::bulletedList([
        'Migrated 3 pending database migrations',
        'Cleared and rebuilt route cache',
        'Restarted 4 queue workers',
    ]),
    Element::heading('Next Steps'),
    Element::numberedList([
        'Verify the health check endpoint at /up',
        'Monitor error rates for the next 15 minutes',
        'Confirm background jobs are processing',
    ]),
]);
```

你还可以使用 `Element::keyValueList` 显示带标签的数据：

```php
callout('Database Connection Failed', [
    'Could not connect to the database server.',
    Element::keyValueList([
        'Host' => '127.0.0.1',
        'Port' => '3306',
        'Database' => 'forge',
        'Status' => 'Connection refused',
    ]),
], type: 'error');
```

`Element::link` 方法在支持 [OSC 8](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) 的终端中创建可点击的超链接。你可以单独提供 URL，或提供带自定义标签的 URL：

```php
callout('Server Health Check', [
    'Multiple services are reporting degraded performance.',
    Element::heading('Affected Services'),
    'Look here: '.Element::link('https://example.com/health', 'Health Dashboard'),
    Element::link('https://example.com/health'),
]);
```

如果未提供标签，URL 本身将显示为链接文本。

<a name="tables"></a>
## 表格

`table` 函数使显示多行多列数据变得容易。你只需提供列名和表格数据：

```php
use function Laravel\Prompts\table;

table(
    headers: ['Name', 'Email'],
    rows: User::all(['name', 'email'])->toArray()
);
```

<a name="spin"></a>
## 旋转指示器

`spin` 函数在执行指定回调时显示旋转指示器以及可选消息。它用于指示正在进行的进程，并在完成后返回回调的结果：

```php
use function Laravel\Prompts\spin;

$response = spin(
    callback: fn () => Http::get('http://example.com'),
    message: 'Fetching response...'
);
```

> [!WARNING]
> `spin` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来动画旋转指示器。当此扩展不可用时，将显示旋转指示器的静态版本。

<a name="progress"></a>
## 进度条

对于长时间运行的任务，显示告知用户任务完成程度的进度条会很有帮助。使用 `progress` 函数，Laravel 将显示一个进度条，并在每次迭代给定可迭代值时推进其进度：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: 'Updating users',
    steps: User::all(),
    callback: fn ($user) => $this->performTask($user)
);
```

`progress` 函数类似于映射函数，将返回一个数组，其中包含回调每次迭代的返回值。

回调还可以接受 `Laravel\Prompts\Progress` 实例，允许你在每次迭代时修改标签和提示：

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

有时，你可能需要对进度条的推进方式进行更多手动控制。首先，定义进程将迭代的总步数。然后，在处理每个项目后通过 `advance` 方法推进进度条：

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

`task` 函数在给定回调执行时，显示一个带旋转指示器和滚动实时输出区域的带标签任务。它非常适合包装依赖安装或部署脚本等长时间运行的进程，提供正在发生内容的实时可见性：

```php
use function Laravel\Prompts\task;

task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        // Long-running process...
    }
);
```

回调接收一个 `Logger` 实例，你可以使用它在任务的输出区域显示日志行、状态消息和流式文本。

> [!WARNING]
> `task` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来动画旋转指示器。当此扩展不可用时，将显示任务的静态版本。

<a name="task-logging"></a>
#### 记录日志行

`line` 方法向任务的滚动输出区域写入单条日志行：

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

你可以使用 `success`、`warning` 和 `error` 方法显示状态消息。它们会作为稳定的、高亮的消息显示在滚动日志区域上方：

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

`label` 方法允许你在任务运行时更新其标签：

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

<a name="task-sub-label"></a>
#### 显示子标签

`subLabel` 方法在任务主标签下方显示一行暗淡的文本，这对于传达临时状态（如当前正在进行的步骤）很有用。传递空字符串以清除子标签：

```php
task(
    label: 'Deploying',
    callback: function ($logger) {
        $logger->subLabel('Building assets...');
        // ...
        $logger->subLabel('Running migrations...');
        // ...
        $logger->subLabel('');
    }
);
```

你也可以通过 `subLabel` 参数提供初始子标签：

```php
task(
    label: 'Deploying',
    callback: function ($logger) {
        // ...
    },
    subLabel: 'Preparing...'
);
```

<a name="task-streaming"></a>
#### 流式文本

对于逐步产生输出的进程（如 AI 生成的响应），`partial` 方法允许你逐字或逐块地流式传输文本。流完成后，调用 `commitPartial` 以完成输出：

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
#### 自定义输出限制

默认情况下，任务最多显示 10 行滚动输出。你可以通过 `limit` 参数自定义此行为：

```php
task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        // ...
    },
    limit: 20
);
```

<a name="task-keep-summary"></a>
#### 保留摘要

默认情况下，回调结束后任务的输出会被擦除。如果你想在任务完成后将状态消息保留在屏幕上，可以传递 `keepSummary` 参数：

```php
task(
    label: 'Deploying',
    callback: function ($logger) {
        $logger->success('Assets built');
        // ...
        $logger->success('Migrations complete');
    },
    keepSummary: true,
);
```

<a name="stream"></a>
## 流式输出

`stream` 函数显示流入终端的文本，非常适合显示 AI 生成的内容或任何逐步到达的文本：

```php
use function Laravel\Prompts\stream;

$stream = stream();

foreach ($words as $word) {
    $stream->append($word . ' ');
    usleep(25_000); // Simulate delay between chunks...
}

$stream->close();
```

`append` 方法向流添加文本，以渐入效果渲染它。所有内容流式传输完成后，调用 `close` 方法完成输出并恢复光标。

<a name="terminal-title"></a>
## 终端标题

`title` 函数更新用户终端窗口或标签页的标题：

```php
use function Laravel\Prompts\title;

title('Installing Dependencies');
```

要将终端标题重置为默认值，请传递空字符串：

```php
title('');
```

<a name="clear"></a>
## 清空终端

`clear` 函数可用于清空用户的终端：

```php
use function Laravel\Prompts\clear;

clear();
```

<a name="terminal-considerations"></a>
## 终端注意事项

<a name="terminal-width"></a>
#### 终端宽度

如果任何标签、选项或验证消息的长度超过用户终端的"列"数，它将被自动截断以适应。如果你的用户可能使用较窄的终端，请考虑最小化这些字符串的长度。通常安全的最大长度是 74 个字符，以支持 80 字符终端。

<a name="terminal-height"></a>
#### 终端高度

对于任何接受 `scroll` 参数的 prompt，配置的值将自动减少以适应用户终端的高度，包括为验证消息留出空间。

<a name="fallbacks"></a>
## 不支持的环境与回退

Laravel Prompts 支持 macOS、Linux 以及带 WSL 的 Windows。由于 Windows 版 PHP 的限制，目前无法在 WSL 之外的 Windows 上使用 Laravel Prompts。

因此，Laravel Prompts 支持回退到替代实现，例如 [Symfony Console Question Helper](https://symfony.com/doc/current/components/console/helpers/questionhelper.html)。

> [!NOTE]
> 在 Laravel 框架中使用 Laravel Prompts 时，已为你配置了每个 prompt 的回退，并将在不支持的环境中自动启用。

<a name="fallback-conditions"></a>
#### 回退条件

如果你不使用 Laravel，或需要自定义何时使用回退行为，可以向 `Prompt` 类上的 `fallbackWhen` 静态方法传递布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

<a name="fallback-behavior"></a>
#### 回退行为

如果你不使用 Laravel，或需要自定义回退行为，可以向每个 prompt 类上的 `fallbackUsing` 静态方法传递闭包：

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

必须为每个 prompt 类单独配置回退。闭包将接收 prompt 类的实例，并且必须为 prompt 返回适当的类型。

<a name="testing"></a>
## 测试

Laravel 提供了各种方法，用于测试你的命令是否显示预期的 Prompt 消息：

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
