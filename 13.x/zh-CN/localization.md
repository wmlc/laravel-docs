# 本地化

## 简介

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令把它们发布出来。

Laravel 的本地化特性提供了一种便捷方式来获取各种语言的字符串，让你的应用能轻松支持多语言。

Laravel 提供两种管理翻译字符串的方式。第一种，把语言字符串存放在应用 `lang` 目录下的文件里；该目录下可以为每种支持的语言建立子目录。这是 Laravel 用于管理内置特性（如验证错误消息）翻译字符串的方式：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

或者，可以把翻译字符串定义为放在 `lang` 目录下的 JSON 文件。采用这种方式时，应用支持的每种语言在该目录下都会有一个对应的 JSON 文件。这种方式适合拥有大量可翻译字符串的应用：

```text
/lang
    en.json
    es.json
```

本文档会分别讨论这两种翻译字符串的管理方式。

### 发布语言文件

默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果想自定义 Laravel 语言文件或创建自己的语言文件，可以通过 `lang:publish` Artisan 命令来生成 `lang` 目录。`lang:publish` 命令会在应用中创建 `lang` 目录，并发布 Laravel 使用的默认语言文件集合：

```shell
php artisan lang:publish
```

### 配置语言（Locale）

应用的默认语言保存在 `config/app.php` 配置文件的 `locale` 配置项中，该值通常通过 `APP_LOCALE` 环境变量设置。你可以自由修改该值，以满足应用需要。

也可以配置一个「回退语言」，当默认语言不包含某个翻译字符串时，会使用回退语言。和默认语言一样，回退语言也在 `config/app.php` 中配置，值通常由 `APP_FALLBACK_LOCALE` 环境变量设置。

可以通过 `App` 门面提供的 `setLocale` 方法，在运行时为单次 HTTP 请求修改默认语言：

```php
use Illuminate\Support\Facades\App;

Route::get('/greeting/{locale}', function (string $locale) {
    if (! in_array($locale, ['en', 'es', 'fr'])) {
        abort(400);
    }

    App::setLocale($locale);

    // ...
});
```

#### 判断当前语言

可以使用 `App` 门面上的 `currentLocale` 与 `isLocale` 方法来判断当前语言，或检查语言是否为某个给定的值：

```php
use Illuminate\Support\Facades\App;

$locale = App::currentLocale();

if (App::isLocale('en')) {
    // ...
}
```

### 复数化语言

你可以让 Laravel 的「复数化器」（Eloquent 和框架其他部分会将单数字符串转为复数形式）使用英语以外的语言。在应用某个服务提供者的 `boot` 方法中调用 `useLanguage` 方法即可实现。复数化器当前支持的语言包括：`french`、`norwegian-bokmal`、`portuguese`、`spanish` 和 `turkish`：

```php
use Illuminate\Support\Pluralizer;

/**
 * 引导应用服务。
 */
public function boot(): void
{
    Pluralizer::useLanguage('spanish');

    // ...
}
```

> [!WARNING]
> 如果自定义了复数化器的语言，应同时显式定义 Eloquent 模型的 [数据表名](/topic/Laravel%2013.x/rwyl2kxvz8.html)。

## 定义翻译字符串

### 使用简短 Key

通常，翻译字符串被存放在 `lang` 目录下的文件里。在该目录下，应该为每种支持的语言建立一个子目录。这是 Laravel 用于管理内置特性（如验证错误消息）翻译字符串的方式：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

所有语言文件都会返回一个带 key 的字符串数组。例如：

```php
<?php

// lang/en/messages.php

return [
    'welcome' => 'Welcome to our application!',
];
```

> [!WARNING]
> 对于按地区区分的语言，语言目录名应遵循 ISO 15897。例如，英式英语应使用 `en_GB` 而不是 `en-gb`。

### 以翻译字符串本身作为 Key

对于拥有大量可翻译字符串的应用，给每个字符串定义一个"简短 key" 在视图中引用时容易变得混乱，并且需要为每个翻译字符串不断发明新 key，工作繁琐。

为此，Laravel 还支持以字符串的"默认翻译"作为 key 来定义翻译字符串。以翻译字符串本身为 key 的语言文件，是作为 JSON 文件存放在 `lang` 目录下的。例如，如果应用有西班牙语翻译，应该创建一个 `lang/es.json` 文件：

```json
{
    "I love programming.": "Me encanta programar."
}
```

#### Key / 文件冲突

不应定义与其他翻译文件同名的字符串 key。例如，在使用 `__('Action')` 翻译「NL」语言时，如果存在 `nl/action.php` 文件但没有 `nl.json` 文件，翻译器会返回 `nl/action.php` 的整个内容。

## 获取翻译字符串

可以使用 `__` 辅助函数从语言文件中获取翻译字符串。如果使用「简短 key」定义翻译字符串，应通过「点」语法把包含 key 的文件及 key 本身传给 `__`。例如，从 `lang/en/messages.php` 语言文件中获取 `welcome` 翻译字符串：

```php
echo __('messages.welcome');
```

如果指定的翻译字符串不存在，`__` 函数会返回翻译字符串的 key。因此，按上面的示例，当翻译字符串不存在时，`__` 函数会返回 `messages.welcome`。

如果使用 翻译字符串自身作为 key，应该把字符串的默认翻译传给 `__` 函数：

```php
echo __('I love programming.');
```

同样的，如果翻译字符串不存在，`__` 函数会返回传入的字符串 key。

如果使用 [Blade 模板引擎](/topic/Laravel%2013.x/wevwmrz9l2.html)，可以用 `{{ }}` 输出语法来显示翻译字符串：

```blade
{{ __('messages.welcome') }}
```

### 在翻译字符串中替换占位符

如果你愿意，可以在翻译字符串里定义占位符。所有占位符都以 `:` 开头。例如，可以定义一个带占位符名称的欢迎消息：

```php
'welcome' => 'Welcome, :name',
```

要在获取翻译字符串时替换占位符，可以把替换数组作为第二个参数传给 `__` 函数：

```php
echo __('messages.welcome', ['name' => 'dayle']);
```

如果占位符全部为字母大写、或只有首字母大写，翻译后的值也会相应地大写：

```php
'welcome' => 'Welcome, :NAME', // Welcome, DAYLE
'goodbye' => 'Goodbye, :Name', // Goodbye, Dayle
```

#### 对象占位符格式化

如果尝试把对象作为翻译占位符传入，对象的 `__toString` 方法会被调用。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 是 PHP 内置的「魔术方法」。但有些场景下你可能无法控制某个类的 `__toString` 方法——比如当你打交道的类来自第三方库时。

在这些情况下，Laravel 允许你为这种特定类型的对象注册一个自定义格式化处理器。可以通过调用翻译器的 `stringable` 方法实现。`stringable` 接收一个闭包，闭包应当类型提示它负责格式化的对象类型。通常，`stringable` 应在 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Lang;
use Money\Money;

/**
 * 引导应用服务。
 */
public function boot(): void
{
    Lang::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

### 复数化

复数化是个复杂的问题——不同语言的复数规则差异很大；不过 Laravel 可以根据你定义的复数规则对字符串进行不同的翻译。可以使用 `|` 字符来区分单数和复数形式：

```php
'apples' => 'There is one apple|There are many apples',
```

当然，使用 翻译字符串作为 key 时也支持复数化：

```json
{
    "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

甚至可以创建更复杂的复数规则，为多个数值范围指定不同的翻译字符串：

```php
'apples' => '{0} There are none|[1,19] There are some|[20,*] There are many',
```

定义好带复数选项的翻译字符串后，可以使用 `trans_choice` 函数根据给定的「count」获取对应那一行。在下面的示例中，由于 count 大于 1，会返回翻译字符串的复数形式：

```php
echo trans_choice('messages.apples', 10);
```

也可以在复数字符串中定义占位符属性。这些占位符通过 `trans_choice` 函数的第三个参数（数组）替换：

```php
'minutes_ago' => '{1} :value minute ago|[2,*] :value minutes ago',

echo trans_choice('time.minutes_ago', 5, ['value' => 5]);
```

如果想展示传入 `trans_choice` 函数的整数值，可以使用内置的 `:count` 占位符：

```php
'apples' => '{0} There are none|{1} There is one|[2,*] There are :count',
```

## 覆盖扩展包的语言文件

某些扩展包可能自带语言文件。与其修改扩展包的核心文件来调整这些字符串，不如通过在 `lang/vendor/{package}/{locale}` 目录下放置同名文件来覆盖它们。

例如，如果需要覆盖名为 `skyrim/hearthfire` 扩展包内 `messages.php` 的英语翻译字符串，应该把语言文件放在：`lang/vendor/hearthfire/en/messages.php`。在该文件中只需要定义你想覆盖的翻译字符串；未覆盖的字符串仍会从扩展包原始语言文件中加载。