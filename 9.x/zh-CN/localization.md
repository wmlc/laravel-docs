# 本地化（Localization）

- [简介](#introduction)
    - [配置语言区域](#configuring-the-locale)
    - [复数形式语言](#pluralization-language)
- [定义翻译字符串](#defining-translation-strings)
    - [使用短键](#using-short-keys)
    - [使用翻译字符串作为键](#using-translation-strings-as-keys)
- [获取翻译字符串](#retrieving-translation-strings)
    - [替换翻译字符串中的参数](#replacing-parameters-in-translation-strings)
    - [复数形式](#pluralization)
- [覆盖扩展包语言文件](#overriding-package-language-files)

<a name="introduction"></a>
## 简介

Laravel 的本地化特性提供了一种便捷的方式来获取多种语言的字符串，让你能够轻松地在应用中支持多语言。

Laravel 提供了两种方式来管理翻译字符串。首先，语言字符串可以存储在 `lang` 目录中的文件里。在该目录中，可以为应用支持的每种语言创建子目录。这是 Laravel 用于管理内置功能（如验证错误消息）翻译字符串的方式：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

或者，翻译字符串可以定义在放置于 `lang` 目录中的 JSON 文件里。采用这种方式时，应用支持的每种语言都会在该目录中有一个对应的 JSON 文件。对于拥有大量可翻译字符串的应用，推荐使用这种方式：

```text
/lang
    en.json
    es.json
```

我们将在本文档中讨论每种管理翻译字符串的方式。

<a name="configuring-the-locale"></a>
### 配置语言区域

应用的默认语言存储在 `config/app.php` 配置文件的 `locale` 配置选项中。你可以根据应用的需要自由修改此值。

你可以在运行时使用 `App` Facade 提供的 `setLocale` 方法为单个 HTTP 请求修改默认语言：

```php
use Illuminate\Support\Facades\App;

Route::get('/greeting/{locale}', function ($locale) {
    if (! in_array($locale, ['en', 'es', 'fr'])) {
        abort(400);
    }

    App::setLocale($locale);

    //
});
```

你可以配置"回退语言"，当当前语言不包含某个翻译字符串时将使用该语言。与默认语言一样，回退语言也在 `config/app.php` 配置文件中配置：

```php
'fallback_locale' => 'en',
```

<a name="determining-the-current-locale"></a>
#### 确定当前语言区域

你可以使用 `App` Facade 上的 `currentLocale` 和 `isLocale` 方法来确定当前语言区域或检查语言区域是否为给定值：

```php
use Illuminate\Support\Facades\App;

$locale = App::currentLocale();

if (App::isLocale('en')) {
    //
}
```

<a name="pluralization-language"></a>
### 复数形式语言

你可以让 Laravel 的"复数化器"使用英语以外的语言。该复数化器被 Eloquent 和框架的其他部分用于将单数字符串转换为复数字符串。这可以通过在应用的服务提供者（Service Provider）之一的 `boot` 方法中调用 `useLanguage` 方法来实现。复数化器当前支持的语言有：`french`、`norwegian-bokmal`、`portuguese`、`spanish` 和 `turkish`：

```php
use Illuminate\Support\Pluralizer;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Pluralizer::useLanguage('spanish');

    // ...
}
```

> **Warning**  
> 如果你自定义了复数化器的语言，应该显式定义 Eloquent 模型的[表名](/docs/{{version}}/eloquent#table-names)。

<a name="defining-translation-strings"></a>
## 定义翻译字符串

<a name="using-short-keys"></a>
### 使用短键

通常，翻译字符串存储在 `lang` 目录中的文件里。在该目录中，应该为应用支持的每种语言创建一个子目录。这是 Laravel 用于管理内置功能（如验证错误消息）翻译字符串的方式：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

所有语言文件都返回一个键字符串数组。例如：

```php
<?php

// lang/en/messages.php

return [
    'welcome' => 'Welcome to our application!',
];
```

> **Warning**  
> 对于按地区区分的语言，应该按照 ISO 15897 标准命名语言目录。例如，英国英语应使用 "en_GB" 而不是 "en-gb"。

<a name="using-translation-strings-as-keys"></a>
### 使用翻译字符串作为键

对于拥有大量可翻译字符串的应用，使用"短键"定义每个字符串在视图中引用键时可能会变得混乱，而且为应用支持的每个翻译字符串不断发明键也很繁琐。

因此，Laravel 还支持使用字符串的"默认"翻译作为键来定义翻译字符串。使用翻译字符串作为键的翻译文件以 JSON 文件的形式存储在 `lang` 目录中。例如，如果你的应用有西班牙语翻译，应该创建一个 `lang/es.json` 文件：

```json
{
    "I love programming.": "Me encanta programar."
}
```

#### 键 / 文件冲突

你不应该定义与其他翻译文件名冲突的翻译字符串键。例如，在 "NL" 语言区域下翻译 `__('Action')` 时，如果存在 `nl/action.php` 文件但不存在 `nl.json` 文件，翻译器将返回 `nl/action.php` 的内容。

<a name="retrieving-translation-strings"></a>
## 获取翻译字符串

你可以使用 `__` 辅助函数从语言文件中获取翻译字符串。如果使用"短键"定义翻译字符串，应该使用"点"语法将包含键的文件和键本身传递给 `__` 函数。例如，让我们从 `lang/en/messages.php` 语言文件中获取 `welcome` 翻译字符串：

```php
echo __('messages.welcome');
```

如果指定的翻译字符串不存在，`__` 函数将返回翻译字符串键。因此，使用上面的例子，如果翻译字符串不存在，`__` 函数将返回 `messages.welcome`。

如果你使用[默认翻译字符串作为翻译键](#using-translation-strings-as-keys)，应该将字符串的默认翻译传递给 `__` 函数：

```php
echo __('I love programming.');
```

同样，如果翻译字符串不存在，`__` 函数将返回给它的翻译字符串键。

如果你使用 [Blade 模板引擎](/docs/{{version}}/blade)，可以使用 `{{ }}` 输出语法来显示翻译字符串：

```blade
{{ __('messages.welcome') }}
```

<a name="replacing-parameters-in-translation-strings"></a>
### 替换翻译字符串中的参数

如果你愿意，可以在翻译字符串中定义占位符。所有占位符都以 `:` 为前缀。例如，你可以定义一个带有占位符名称的欢迎消息：

```php
'welcome' => 'Welcome, :name',
```

要在获取翻译字符串时替换占位符，可以将替换数组作为第二个参数传递给 `__` 函数：

```php
echo __('messages.welcome', ['name' => 'dayle']);
```

如果占位符全部由大写字母组成，或者仅首字母大写，翻译值将相应地大写：

```php
'welcome' => 'Welcome, :NAME', // Welcome, DAYLE
'goodbye' => 'Goodbye, :Name', // Goodbye, Dayle
```

<a name="object-replacement-formatting"></a>
#### 对象替换格式化

如果你尝试将对象作为翻译占位符提供，将调用对象的 `__toString` 方法。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的"魔术方法"之一。但是，有时你可能无法控制给定类的 `__toString` 方法，例如当你交互的类属于第三方库时。

在这些情况下，Laravel 允许你为特定类型的对象注册自定义格式化处理器。为此，你应该调用翻译器的 `stringable` 方法。`stringable` 方法接受一个闭包，该闭包应该类型提示它负责格式化的对象类型。通常，`stringable` 方法应该在应用 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Lang;
use Money\Money;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Lang::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

<a name="pluralization"></a>
### 复数形式

复数形式是一个复杂的问题，因为不同的语言有各种复杂的复数规则；不过，Laravel 可以帮助你根据定义的复数规则以不同方式翻译字符串。使用 `|` 字符，你可以区分字符串的单数和复数形式：

```php
'apples' => 'There is one apple|There are many apples',
```

当然，使用[翻译字符串作为键](#using-translation-strings-as-keys)时也支持复数形式：

```json
{
    "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

你甚至可以创建更复杂的复数规则，为多个值范围指定翻译字符串：

```php
'apples' => '{0} There are none|[1,19] There are some|[20,*] There are many',
```

定义了带有复数选项的翻译字符串后，你可以使用 `trans_choice` 函数获取给定"数量"对应的行。在此示例中，由于数量大于一，将返回翻译字符串的复数形式：

```php
echo trans_choice('messages.apples', 10);
```

你还可以在复数字符串中定义占位符属性。可以通过将数组作为第三个参数传递给 `trans_choice` 函数来替换这些占位符：

```php
'minutes_ago' => '{1} :value minute ago|[2,*] :value minutes ago',

echo trans_choice('time.minutes_ago', 5, ['value' => 5]);
```

如果你想显示传递给 `trans_choice` 函数的整数值，可以使用内置的 `:count` 占位符：

```php
'apples' => '{0} There are none|{1} There is one|[2,*] There are :count',
```

<a name="overriding-package-language-files"></a>
## 覆盖扩展包语言文件

一些扩展包可能自带语言文件。你可以通过将文件放置在 `lang/vendor/{package}/{locale}` 目录中来覆盖这些行，而无需修改扩展包的核心文件。

因此，例如，如果你需要覆盖名为 `skyrim/hearthfire` 的扩展包中 `messages.php` 的英文翻译字符串，你应该将语言文件放置在：`lang/vendor/hearthfire/en/messages.php`。在此文件中，你应该只定义想要覆盖的翻译字符串。未覆盖的翻译字符串仍将从扩展包的原始语言文件中加载。
