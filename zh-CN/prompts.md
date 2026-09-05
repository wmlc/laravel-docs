# Prompts（交互式提示）

## 简介

[Laravel Prompts](https://github.com/laravel/prompts) 是一个 PHP 包，用于为命令行应用添加美观且易用的表单。它支持占位文本和验证等浏览器特性。

Laravel Prompts 非常适合在 [Artisan 控制台命令](/docs/{{version}}/artisan#writing-commands) 中接收用户输入，但也可用于任何命令行 PHP 项目。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 和 Windows（WSL 环境）。更多信息，请参阅文档中 [不支持的环境与回退方案](#fallbacks) 一节。

## 安装

Laravel Prompts 已经随最新版本的 Laravel 一起发布。

你也可以在其它 PHP 项目中使用 Composer 包管理器安装 Laravel Prompts：

```shell
composer require laravel/prompts
```

## 可用提示

### 文本（Text）

`text` 函数会向用户展示给定的问题，接收其输入，然后将其返回：

```php
use function Laravel\Prompts\text;

$name = text('What is your name?');
```

你还可以添加占位文本、默认值和提示信息：

```php
$name = text(
    label: 'What is your name?',
    placeholder: 'E.g. Taylor Otwell',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

#### 必填值

如果需要用户必须输入某个值，可以传入 `required` 参数：

```php
$name = text(
    label: 'What is your name?',
    required: true
);
```

如果希望自定义验证消息，也可以传入一个字符串：

```php
$name = text(
    label: 'What is your name?',
    required: 'Your name is required.'
);
```

#### 验证

如果希望对输入进行额外验证，可以向 `validate` 参数传入一个闭包：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        $value === 'Taylor' => 'You cannot be Taylor.',
        default => null
    }
);
```

闭包接收用户输入的字符串，并应返回验证错误消息；若通过验证则返回 `null`。

你也可以利用 Laravel 提供的 [` Validator`](/docs/{{version}}/validation) 功能：

```php
$name = text(
    label: 'What is your name?',
    validate: fn (string $value) => Validator::make(['name' => $value], [
        'name' => 'required|min:3',
    ])->errors()->first('name')
);
```

> [!WARNING]
> 大多数验证库（包括默认的 Laravel Validator）会在验证失败时抛出异常。Laravel Prompts 会捕获这些异常，将其转为错误消息显示给用户，而不是直接抛出。

#### 备用字体与颜色

你还可以指定提示使用的字体和颜色。Laravel Prompts 支持 Powerline 字体和「定制」颜色：

```php
$name = text(
    label: 'What is your name?',
    placeholder: 'E.g. Taylor Otwell',
    hint: 'This will be displayed on your profile.',
    theme: new \Laravel\Prompts\Themes\Powerline()
);
```

Laravel Prompts 内置的「默认」主题默认使用了 Tailwind CSS 调色板中的颜色。当未指定字体时，提示会使用 Powerline 符号，并假定用户的终端支持 256 色。如果你希望在不支持 256 色的终端上获得更好的兼容性，可以改用 `Themes\Simple` 主题。

你可以在终端中显示一个颜色选择器，让用户选择适合其偏好的颜色：

```php
$name = text(
    label: 'What is your name?',
    placeholder: 'E.g. Taylor Otwell',
    hint: 'This will be displayed on your profile.',
    theme: new \Laravel\Prompts\Themes\DynamicColors()
);
```

### 文本域（Textarea）

`textarea` 函数会提示用户输入多行文本：

```php
use function Laravel\Prompts\textarea;

$story = textarea('Tell me a story.');
```

你还可以添加占位文本、默认值和提示信息：

```php
$story = textarea(
    label: 'Tell me a story.',
    placeholder: 'This is a story about...',
    hint: 'It should be no longer than a paragraph.',
    rows: 5
);
```

#### 必填值

如果要求用户必须填写值，可以传入 `required` 参数：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: true
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$story = textarea(
    label: 'Tell me a story.',
    required: 'A story is required.'
);
```

#### 验证

如果需要对输入进行额外验证，可以向 `validate` 参数传入一个闭包：

```php
$story = textarea(
    label: 'Tell me a story.',
    validate: fn (string $value) => match (true) {
        strlen($value) < 100 => 'The story must be at least 100 characters.',
        default => null
    }
);
```

闭包接收用户输入字符串，并应返回验证错误消息；若通过验证则返回 `null`。

### 数字（Number）

`number` 函数会提示用户输入一个数字，并返回其输入：

```php
use function Laravel\Prompts\number;

$number = number('How many items should be ordered?');
```

你还可以添加占位文本、默认值和提示信息：

```php
$number = number(
    label: 'How many items should be ordered?',
    placeholder: 'E.g. 10',
    default: 1,
    hint: 'The minimum order quantity is 10.'
);
```

#### 必填值

如果要求用户必须填写，可以传入 `required` 参数：

```php
$number = number(
    label: 'How many items should be ordered?',
    required: true
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$number = number(
    label: 'How many items should be ordered?',
    required: 'A number is required.'
);
```

#### 验证

如果需要对输入进行额外验证，可以向 `validate` 参数传入一个闭包：

```php
$number = number(
    label: 'How many items should be ordered?',
    validate: fn (int|string $value) => match (true) {
        $value < 10 => 'You must order at least 10 items.',
        $value > 100 => 'You may not order more than 100 items.',
        default => null
    }
);
```

闭包接收用户输入（字符串或整数），并应返回验证错误消息；若通过验证则返回 `null`。

### 密码（Password）

`password` 函数与 `text` 函数类似，但用户在终端输入内容时会被遮盖，遮挡其输入内容：

```php
use function Laravel\Prompts\password;

$password = password('What is your password?');
```

你还可以添加占位文本和提示信息：

```php
$password = password(
    label: 'What is your password?',
    placeholder: 'Password',
    hint: 'Passwords must be at least 8 characters.'
);
```

#### 必填值

如果要求用户必须填写，可以传入 `required` 参数：

```php
$password = password(
    label: 'What is your password?',
    required: true
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$password = password(
    label: 'What is your password?',
    required: 'A password is required.'
);
```

#### 验证

如果需要对输入进行额外验证，可以向 `validate` 参数传入一个闭包：

```php
$password = password(
    label: 'What is your password?',
    validate: fn (string $value) => match (true) {
        strlen($value) < 8 => 'The password must be at least 8 characters.',
        default => null
    }
);
```

闭包接收用户输入字符串，并应返回验证错误消息；若通过验证则返回 `null`。

### 确认（Confirm）

如果你需要向用户询问「是」或「否」的问题，可以使用 `confirm` 函数。用户在终端中可通过方向键或 `y`、`n` 键选择。函数返回 `true` 或 `false`：

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('Do you accept the terms?');
```

你也可以选择默认值、「是」和「否」对应的标签：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    default: false,
    yes: 'I accept',
    no: 'I decline',
    hint: 'The terms must be accepted to continue.'
);
```

#### 必填值

如果你要求用户必须选择，可以传入 `required` 参数：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: true
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$confirmed = confirm(
    label: 'Do you accept the terms?',
    required: 'You must accept the terms to continue.'
);
```

### 选择（Select）

如果你需要让用户从一组预定义选项中选择，可以使用 `select` 函数：

```php
use function Laravel\Prompts\select;

$role = select(
    'What role should the user have?',
    ['Member', 'Contributor', 'Owner', 'Admin'],
);
```

你也可以指定默认值以及提示信息：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner', 'Admin'],
    default: 'Member',
    hint: 'The role may be updated at any time.'
);
```

你也可以将选项数组的键作为返回值的键：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'member' => 'Member',
        'contributor' => 'Contributor',
        'owner' => 'Owner',
        'admin' => 'Admin',
    ],
    default: 'member',
);
```

如果需要展示一组带描述的选项但又不希望键被返回，可以将选项作为 `array_label => value` 形式传入：

```php
$role = select(
    label: 'What role should the user have?',
    options: [
        'Member' => 'member',
        'Contributor' => 'contributor',
        'Owner' => 'owner',
    ],
);
```

> [!WARNING]
> 当键是整数（数字键）时，select 提示仅展示值而不展示键；但在传入时仍必须提供「选择」选项（值为非 null、非空字符串或非整数的键），否则会抛出异常。

#### 验证

与其他提示一样，你也可以传入一个 `validate` 闭包：

```php
$role = select(
    label: 'What role should the user have?',
    options: ['Member', 'Contributor', 'Owner', 'Admin'],
    validate: fn (string $value) => match (true) {
        $value === 'Admin' => 'Admins must be added by another admin.',
        default => null
    }
);
```

如果选项是数组形式，闭包接收所选项的值；如果选项是关联数组（键/值对），闭包接收用户所选键；否则，闭包接收用户所选选项。

#### 多选（Multi-select）

如果你需要让用户可以选择多个选项，可以使用 `multiselect` 函数：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    'What permissions should the user have?',
    ['Read', 'Create', 'Update', 'Delete']
);
```

你也可以指定默认值和提示信息：

```php
$permissions = multiselect(
    label: 'What permissions should the user have?',
    options: ['Read', 'Create', 'Update', 'Delete'],
    default: ['Read', 'Create'],
    hint: 'Permissions may be updated at any time.'
);
```

你也可以将选项数组的键作为返回值的键：

```php
$permissions = multiselect(
    label: 'What permissions should the user have?',
    options: [
        'read' => 'Read',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
    ],
    default: ['read', 'create'],
);
```

如果选项中包含整型键，multiselect 仅展示选项值；但在传入时仍必须提供「选择」选项（值为非 null、非空字符串或非整数的键），否则会抛出异常。

#### 验证

你可以通过 `validate` 闭包对所选项进行验证。例如，如果用户必须选择至少 3 个选项：

```php
$permissions = multiselect(
    label: 'What permissions should the user have?',
    options: ['Read', 'Create', 'Update', 'Delete'],
    validate: fn (array $values) => count($values) < 3
        ? 'You must select at least 3 permissions.'
        : null
);
```

如果选项是数组形式，闭包接收所选项值的数组；如果选项是关联数组（键/值对），闭包接收用户所选键的数组。

### 建议（Suggest）

`suggest` 函数可用于为用户提供一组可能选项的自动建议。用户仍可以输入任意回答，不限于建议中的选项：

```php
use function Laravel\Prompts\suggest;

$name = suggest('What is your name?', ['Taylor', 'Dayle']);
```

或者，你可以将闭包作为第二个参数传递。闭包接收用户当前的输入，并应返回一个选项数组：

```php
$name = suggest('What is your name?', function (string $value) {
    return ['Taylor', 'Dayle'];
});
```

你可以为提示提供占位文本、默认值和提示信息：

```php
$name = suggest(
    label: 'What is your name?',
    options: fn (string $value) => $this->getSuggestedNames($value),
    placeholder: 'E.g. Taylor Otwell',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

#### 必填值

如果要求用户必须填写，可以传入 `required` 参数：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: true
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    required: 'Your name is required.'
);
```

#### 验证

如果需要对所选或输入内容进行额外验证，可以向 `validate` 参数传入一个闭包：

```php
$name = suggest(
    label: 'What is your name?',
    options: ['Taylor', 'Dayle'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        $value === 'Taylor' => 'You cannot be Taylor.',
        default => null
    }
);
```

闭包接收用户输入字符串，并应返回验证错误消息；若通过验证则返回 `null`。

### 搜索（Search）

`search` 函数会向用户提供一个可自动补全的建议列表，且必须从中选择一个选项：

```php
use function Laravel\Prompts\search;

$id = search(
    'Search for the user that should receive the mail.',
    fn (string $value) => array_filter(
        $this->users,
        fn ($user) => str_contains($user['name'], $value),
    ),
);
```

`search` 函数接收一个闭包，闭包接收用户当前输入，并应返回一个选项数组。如果用户输入了无匹配内容的文本，会显示「无匹配项」消息，用户可按 `Ctrl+U` 清空。

你也可以向其传入一个字符串数组：

```php
$id = search(
    'Search for the user that should receive the mail.',
    ['Taylor', 'Dayle'],
);
```

你还可以提供占位文本、默认值和提示信息：

```php
$id = search(
    label: 'Search for the user that should receive the mail.',
    placeholder: 'Search...',
    options: fn (string $value) => array_filter(
        $this->users,
        fn ($user) => str_contains($user['name'], $value),
    ),
    hint: 'The user will receive an email immediately.'
);
```

#### 必填值

如果你要求用户必须选择，可以传入 `required` 参数：

```php
$id = search(
    label: 'Search for the user that should receive the mail.',
    options: fn (string $value) => [...],
    required: true,
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$id = search(
    label: 'Search for the user that should receive the mail.',
    options: fn (string $value) => [...],
    required: 'You must select a user.',
);
```

#### 验证

如果需要对所选项进行额外验证，可以向 `validate` 参数传入一个闭包。闭包接收用户输入的字符串：

```php
$id = search(
    label: 'Search for the user that should receive the mail.',
    options: fn (string $value) => [...],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        default => null
    }
);
```

闭包接收用户输入字符串，并应返回验证错误消息；若通过验证则返回 `null`。

### 多选搜索（Multi-search）

如果你需要用户选择多个选项，可以使用 `multisearch` 函数：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    'Search for the users that should receive the mail.',
    fn (string $value) => array_filter(
        $this->users,
        fn ($user) => str_contains($user['name'], $value),
    ),
);
```

`multisearch` 函数接收一个闭包，闭包接收用户当前输入，并应返回一个选项数组。选项数组的键即为用户提交时所返回的值。

你也可以向其传入一个字符串数组：

```php
$ids = multisearch(
    'Search for the users that should receive the mail.',
    ['Taylor', 'Dayle'],
);
```

你还可以提供占位文本和提示信息：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail.',
    placeholder: 'Search...',
    options: fn (string $value) => array_filter(
        $this->users,
        fn ($user) => str_contains($user['name'], $value),
    ),
    hint: 'The users will receive an email immediately.'
);
```

#### 必填值

如果你要求用户必须选择，可以传入 `required` 参数：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail.',
    options: fn (string $value) => [...],
    required: true,
);
```

如果需要自定义验证消息，也可以传入字符串：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail.',
    options: fn (string $value) => [...],
    required: 'You must select at least one user.',
);
```

#### 验证

如果需要对所选项进行额外验证，可以向 `validate` 参数传入一个闭包。闭包接收一个值数组：

```php
$ids = multisearch(
    label: 'Search for the users that should receive the mail.',
    options: fn (string $value) => [...],
    validate: fn (array $values) => count($values) < 1
        ? 'You must select at least one user.'
        : null
);
```

闭包接收用户所选值的数组，并应返回验证错误消息；若通过验证则返回 `null`。

### 暂停（Pause）

`pause` 函数会在终端显示一条带可选提示信息的「按 Enter 继续…」消息，等待用户按 Enter 键继续。适用于希望让用户有意识地确认某条消息后再继续的场景：

```php
use function Laravel\Prompts\pause;

pause('Press enter to continue.');
```

### 自动补全（Autocomplete）

`autocomplete` 函数会向用户提供一组建议的自动补全，但**不**限制用户必须从建议中选择。用户可以输入任何内容：

```php
use function Laravel\Prompts\autocomplete;

$name = autocomplete('What is your name?', ['Taylor', 'Dayle']);
```

你也可以将闭包作为第二个参数传递。闭包接收用户当前的输入，并应返回一个选项数组：

```php
$name = autocomplete('What is your name?', function (string $value) {
    return ['Taylor', 'Dayle'];
});
```

你可以为提示提供占位文本、默认值和提示信息：

```php
$name = autocomplete(
    label: 'What is your name?',
    options: fn (string $value) => $this->getSuggestedNames($value),
    placeholder: 'E.g. Taylor Otwell',
    default: $user?->name,
    hint: 'This will be displayed on your profile.'
);
```

## 在验证前转换输入

有时你可能希望在执行验证之前对提示输入进行预处理。例如，你可能希望先将输入去除首尾空白后再进行验证。你可以使用 `transform` 参数：

```php
$name = text(
    label: 'What is your name?',
    transform: fn (string $value) => trim($value),
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => 'The name must be at least 3 characters.',
        default => null
    }
);
```

## 表单（Forms）

如果你需要在同一提示中收集多个项目，可以使用 `form` 函数。它会向用户依次展示一系列提示，并将所有答案收集到一个数组中：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', required: true)
    ->password('What is your password?', required: true)
    ->confirm('Do you accept the terms?')
    ->submit();
```

`submit` 方法会返回一个包含每个提示答案的关联数组。键是提示的「标签」名称（`What is your name?` → `What is your name?`，因为标签中包含空格和问号，也可以通过 `name` 参数自定义键名）：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('What is your name?', name: 'name', required: true)
    ->password('What is your password?', name: 'password', required: true)
    ->confirm('Do you accept the terms?', name: 'accept')
    ->submit();

echo $responses['name'];
echo $responses['password'];
echo $responses['accept'];
```

你还可以向每个方法传入 `type` 参数，以自定义提示的类型。例如，你可以为 `text` 提示提供 `textarea` 类型：

```php
$responses = form()
    ->text('Tell me a story.', type: 'textarea')
    ->submit();
```

### 必填项的表单错误

如果在某个提示中启用了 `required`，但用户未填写，后续提示将不再展示，错误消息也会展示给用户；用户可以选择返回该提示进行填写。

## 信息性消息

`info`、`warning`、`error` 和 `alert` 函数可用于向用户展示信息性消息：

```php
use function Laravel\Prompts\info;

info('Package installed successfully.');
```

你也可以为消息附加标题：

```php
info('Package installed successfully.', 'Installation complete');

warning('Package installation failed.', 'Installation aborted');

error('Package installation failed.', 'Installation aborted');

alert('Please review the following warnings:', 'Warnings');
```

## 标注（Callouts）

如果你希望以加粗、带颜色的样式向用户突出显示信息性消息，可以使用 `intro` 和 `outro` 函数。`intro` 通常用于显示消息开始前的「开始」消息，`outro` 则通常用于显示消息结束后的「结束」消息：

```php
use function Laravel\Prompts\intro;
use function Laravel\Prompts\outro;

intro('Welcome to the application.');

outro('Thank you for using the application.');
```

## 表格（Tables）

`table` 函数可以轻松地以表格形式向用户展示多行多列数据。只需提供列名和数据行：

```php
use function Laravel\Prompts\table;

table(
    headers: ['Name', 'Email'],
    rows: [
        ['Taylor Otwell', 'taylor@example.com'],
        ['Jason Beggs', 'jason@example.com'],
    ],
);
```

## 旋转（Spin）

`spin` 函数会在处理耗时任务时显示一个旋转加载动画，同时附带可选的状态消息。它返回一个回调的结果：

```php
use function Laravel\Prompts\spin;

$result = spin(
    message: 'Processing...',
    callback: fn () => SomeClass::process(),
);
```

> [!NOTE]
> `spin` 函数要求回调返回一个值。如果回调抛出异常，旋转动画会停止，异常会继续向上抛出给调用者。

如果你希望为旋转动画指定状态消息，可在回调中向函数传入一个闭包：

```php
use function Laravel\Prompts\spin;

$result = spin(
    fn () => SomeClass::process(),
    message: 'Processing...',
);
```

如果回调需要更多时间完成，你可以向其传入一个进度更新回调作为第三个参数。该回调接收当前累计的迭代计数与预期的总迭代计数：

```php
$result = spin(
    message: 'Processing...',
    callback: function () {
        // ...
    },
    advance: fn ($count, $total) => $count / $total * 100,
);
```

## 进度条（Progress Bar）

`progress` 函数适用于显示长时间运行任务的进度。它接收三个参数：一个可迭代对象（通常是 `LazyCollection` 或数组）、表示每个步骤进度的闭包，以及一个可选的标签：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: 'Updating users',
    steps: $this->users,
    callback: fn ($user) => $this->updateUser($user),
);
```

进度条完成后，回调的返回值将由 `progress` 函数返回。

`steps` 参数也可以传入一个整数，表示步骤数量：

```php
$total = $this->users->count();

progress(
    label: 'Updating users',
    steps: $total,
    callback: fn ($step) => $this->updateUser($step),
);
```

最后，你也可以向 `progress` 函数传入一个零参数闭包，对其手动调用 `advance` 方法来推进进度条：

```php
progress(
    label: 'Updating users',
    steps: 10,
    callback: function () {
        // ...
        $this->advance();
        // ...
    },
);
```

进度条也支持「提示信息」（hint）。`hint` 方法显示一行辅助说明（暗淡样式），便于指示当前步骤的临时状态：

```php
progress(
    label: 'Updating users',
    steps: 10,
    callback: function ($step) {
        $this->hint("Currently updating user {$step}...");
        // ...
    },
);
```

如果你希望进度条持续显示而不是在完成后清除，可以传入 `persistent` 参数：

```php
progress(
    label: 'Updating users',
    steps: 10,
    callback: function ($step) {
        // ...
    },
    persistent: true,
);
```

你也可以使用 `redraw` 方法手动控制进度条重绘频率，避免因频繁重绘而影响性能：

```php
progress(
    label: 'Updating users',
    steps: 10,
    callback: function ($step) {
        // ...

        $this->redraw(fn ($progress) => $progress->advance());
    },
);
```

## 任务（Task）

与进度条类似，`task` 函数会向用户展示一个正在运行的任务，但通常用于不确定总步骤数目的任务。每当任务产生新的输出时，用户都会看到更新后的输出区域。

使用 `task` 函数时，传入一个标签与一个闭包。闭包会接收一个 `$logger` 实例，可在闭包内调用 `$logger` 的方法输出信息：

```php
use function Laravel\Prompts\task;

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

> [!NOTE]
> 在闭包中调用 `echo` 或 `print` 会显示在任务滚动输出区之外。如果你想把内容输出到任务的滚动输出区，请使用 `$logger` 实例。

#### 输出日志行（Logging Lines）

`line` 方法用于向任务的滚动输出区写入一行日志：

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

#### 状态消息（Status Messages）

你可以使用 `success`、`warning` 和 `error` 方法显示状态消息。这些消息以稳定的、高亮的形式出现在滚动日志区上方：

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

#### 更新标签（Updating the Label）

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

#### 显示子标签（Displaying a Sub-Label）

`subLabel` 方法会在任务主标签下方显示一行暗淡的辅助说明，适用于指示当前正在进行的步骤等临时状态。传入空字符串可以清除子标签：

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

你也可以通过 `subLabel` 参数提供初始的子标签：

```php
task(
    label: 'Deploying',
    callback: function ($logger) {
        // ...
    },
    subLabel: 'Preparing...'
);
```

#### 流式输出文本（Streaming Text）

对于增量产生输出的进程（例如 AI 生成的响应），`partial` 方法支持逐词或逐块地流式输出文本。当流式输出完成后，可调用 `commitPartial` 提交最终输出：

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

#### 自定义输出上限（Customizing the Output Limit）

默认情况下，任务最多展示 10 行滚动输出。你可以通过 `limit` 参数自定义该上限：

```php
task(
    label: 'Installing dependencies',
    callback: function ($logger) {
        // ...
    },
    limit: 20
);
```

#### 保留摘要（Keeping the Summary）

默认情况下，任务输出在回调结束后会被清除。如果你希望在任务完成后仍保留状态消息，可以传入 `keepSummary` 参数：

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

## 流式输出（Stream）

`stream` 函数用于在终端以流式方式显示文本，非常适合显示 AI 生成的内容或任何增量到达的文本：

```php
use function Laravel\Prompts\stream;

$stream = stream();

foreach ($words as $word) {
    $stream->append($word . ' ');
    usleep(25_000); // Simulate delay between chunks...
}

$stream->close();
```

`append` 方法向流中追加文本，并以渐进式的淡入效果渲染。当所有内容都已流式输出完毕后，调用 `close` 方法完成输出并恢复光标。

## 终端标题（Terminal Title）

`title` 函数用于更新用户的终端窗口或标签页标题：

```php
use function Laravel\Prompts\title;

title('Installing Dependencies');
```

要将终端标题恢复为默认值，可传入空字符串：

```php
title('');
```

## 清除终端（Clearing the Terminal）

`clear` 函数可用于清空用户的终端屏幕：

```php
use function Laravel\Prompts\clear;

clear();
```

## 终端相关注意事项（Terminal Considerations）

#### 终端宽度（Terminal Width）

如果任何标签、选项或验证消息的长度超出用户终端的「列数」，Laravel Prompts 会自动截断以适应列宽。如果你的用户可能使用较窄的终端，建议尽量缩短这些字符串。一个常见的推荐最大长度是 74 个字符，以兼容 80 列宽的终端。

#### 终端高度（Terminal Height）

对于接受 `scroll` 参数的提示，其配置的值会自动减小以适应用户终端的高度，并预留显示验证消息的空间。

## 不支持的环境与回退方案（Unsupported Environments and Fallbacks）

Laravel Prompts 支持 macOS、Linux 和 Windows（WSL）。由于 Windows 版本 PHP 的限制，目前无法在 WSL 之外的 Windows 环境中使用 Laravel Prompts。

因此，Laravel Prompts 支持回退到替代实现，例如 [Symfony Console Question Helper](https://symfony.com/doc/current/components/console/helpers/questionhelper.html)。

> [!NOTE]
> 在 Laravel 框架中使用时，每个提示的回退方案已经为你配置好，并在不支持的环境中自动启用。

#### 回退触发条件（Fallback Conditions）

如果你不使用 Laravel 或需要自定义何时启用回退行为，可以向 `Prompt` 类的静态方法 `fallbackWhen` 传入一个布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

#### 回退行为（Fallback Behavior）

如果你不使用 Laravel 或需要自定义回退行为，可以向每个提示类的 `fallbackUsing` 静态方法传入一个闭包：

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

每个提示类都需要单独配置回退方案。闭包会接收提示类的实例，并必须返回与该提示相匹配的类型。

## 测试（Testing）

Laravel 提供了多种方法用于测试命令是否按预期展示 Prompt 消息：

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