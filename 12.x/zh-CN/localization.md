# 本地化

- [简介](#introduction)
    - [发布语言文件](#publishing-the-language-files)
    - [配置语言环境](#configuring-the-locale)
    - [复数形式语言](#pluralization-language)
- [定义翻译字符串](#defining-translation-strings)
    - [使用短键](#using-short-keys)
    - [使用翻译字符串作为键](#using-translation-strings-as-keys)
- [检索翻译字符串](#retrieving-translation-strings)
    - [替换翻译字符串中的参数](#replacing-parameters-in-translation-strings)
    - [复数形式](#pluralization)
- [覆盖扩展包语言文件](#overriding-package-language-files)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令来发布它们。

Laravel 的本地化功能提供了一种便捷的方式来检索各种语言的字符串，让你能够轻松支持应用内的多语言。

Laravel 提供了两种管理翻译字符串的方式。第一种，语言字符串可以存储在应用 `lang` 目录下的文件中。该目录下可以为应用支持的每种语言建立一个子目录。Laravel 内置功能（比如验证错误消息）的翻译字符串就是采用这种方式管理的：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

第二种，翻译字符串也可以定义在放置于 `lang` 目录中的 JSON 文件里。采用这种方式时，应用支持的每种语言都会在该目录下有一个对应的 JSON 文件。对于可翻译字符串数量庞大的应用，推荐使用这种方式：

```text
/lang
    en.json
    es.json
```

本文档将逐一讨论这两种管理翻译字符串的方式。

<a name="publishing-the-language-files"></a>
### 发布语言文件

默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件或创建自己的语言文件，应该通过 `lang:publish` Artisan 命令来生成 `lang` 目录的脚手架。`lang:publish` 命令会在应用中创建 `lang` 目录，并发布 Laravel 使用的默认语言文件集：

```shell
php artisan lang:publish
```

<a name="configuring-the-locale"></a>
### 配置语言环境

应用的默认语言存储在 `config/app.php` 配置文件的 `locale` 配置选项中，该选项通常通过 `APP_LOCALE` 环境变量来设置。你可以随意修改该值以满足应用的需要。

你还可以配置「回退语言（fallback language）」，当默认语言中不包含某个翻译字符串时，就会使用回退语言。与默认语言一样，回退语言也是在 `config/app.php` 配置文件中配置的，其值通常通过 `APP_FALLBACK_LOCALE` 环境变量来设置。

你可以在运行时使用 `App` Facade 提供的 `setLocale` 方法，为单个 HTTP 请求修改默认语言：

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

<a name="determining-the-current-locale"></a>
#### 确定当前语言环境

你可以使用 `App` Facade 上的 `currentLocale` 和 `isLocale` 方法来确定当前的语言环境，或者检查语言环境是否为给定值：

```php
use Illuminate\Support\Facades\App;

$locale = App::currentLocale();

if (App::isLocale('en')) {
    // ...
}
```

<a name="pluralization-language"></a>
### 复数形式语言

你可以让 Laravel 的「复数形式转换器（pluralizer）」使用英语以外的语言，Eloquent 和框架的其他部分会使用它将单数字符串转换为复数字符串。要做到这一点，只需在应用的某个服务提供者（Service Provider）的 `boot` 方法中调用 `useLanguage` 方法。复数形式转换器目前支持的语言包括：`french`、`norwegian-bokmal`、`portuguese`、`spanish` 和 `turkish`：

```php
use Illuminate\Support\Pluralizer;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Pluralizer::useLanguage('spanish');

    // ...
}
```

> [!WARNING]
> 如果你自定义了复数形式转换器的语言，应该显式定义 Eloquent 模型的[表名](/docs/{{version}}/eloquent#table-names)。

<a name="defining-translation-strings"></a>
## 定义翻译字符串

<a name="using-short-keys"></a>
### 使用短键

通常，翻译字符串存储在 `lang` 目录下的文件中。该目录下应为应用支持的每种语言建立一个子目录。Laravel 内置功能（比如验证错误消息）的翻译字符串就是采用这种方式管理的：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

所有语言文件都返回一个以键为索引的字符串数组。例如：

```php
<?php

// lang/en/messages.php

return [
    'welcome' => 'Welcome to our application!',
];
```

> [!WARNING]
> 对于因地区而不同的语言，你应该按照 ISO 15897 标准命名语言目录。例如，英式英语应使用「en_GB」而不是「en-gb」。

<a name="using-translation-strings-as-keys"></a>
### 使用翻译字符串作为键

对于可翻译字符串数量庞大的应用来说，如果每个字符串都用「短键」来定义，那么在视图中引用这些键时很容易造成混乱，而且为应用支持的每条翻译字符串不断发明新键也十分繁琐。

因此，Laravel 还支持用字符串的「默认」翻译内容作为键来定义翻译字符串。使用翻译字符串作为键的语言文件以 JSON 文件的形式存储在 `lang` 目录中。例如，如果你的应用有西班牙语翻译，就应该创建一个 `lang/es.json` 文件：

```json
{
    "I love programming.": "Me encanta programar."
}
```

#### 键名 / 文件冲突

你不应定义与其他翻译文件名冲突的翻译字符串键名。例如，为「NL」语言环境翻译 `__('Action')` 时，如果存在 `nl/action.php` 文件而不存在 `nl.json` 文件，那么翻译器将返回 `nl/action.php` 的全部内容。

<a name="retrieving-translation-strings"></a>
## 检索翻译字符串

你可以使用 `__` 辅助函数从语言文件中检索翻译字符串。如果你使用「短键」来定义翻译字符串，应该使用「点号」语法将包含该键的文件和键本身传递给 `__` 函数。例如，让我们从 `lang/en/messages.php` 语言文件中检索 `welcome` 翻译字符串：

```php
echo __('messages.welcome');
```

如果指定的翻译字符串不存在，`__` 函数将返回翻译字符串的键。因此，使用上面的例子，如果翻译字符串不存在，`__` 函数将返回 `messages.welcome`。

如果你使用[默认翻译字符串作为翻译键](#using-translation-strings-as-keys)，则应将字符串的默认翻译内容传递给 `__` 函数：

```php
echo __('I love programming.');
```

同样，如果翻译字符串不存在，`__` 函数将返回传给它的翻译字符串键。

如果你使用 [Blade 模板引擎](/docs/{{version}}/blade)，可以使用 `{{ }}` 输出语法来显示翻译字符串：

```blade
{{ __('messages.welcome') }}
```

<a name="replacing-parameters-in-translation-strings"></a>
### 替换翻译字符串中的参数

如果需要，你可以在翻译字符串中定义占位符。所有占位符都以 `:` 为前缀。例如，你可以定义一条带有姓名占位符的欢迎消息：

```php
'welcome' => 'Welcome, :name',
```

要在检索翻译字符串时替换占位符，可以将替换数组作为第二个参数传递给 `__` 函数：

```php
echo __('messages.welcome', ['name' => 'dayle']);
```

如果占位符全部为大写字母，或者只有首字母大写，翻译后的值也会相应地转换大小写：

```php
'welcome' => 'Welcome, :NAME', // Welcome, DAYLE
'goodbye' => 'Goodbye, :Name', // Goodbye, Dayle
```

<a name="object-replacement-formatting"></a>
#### 对象替换格式化

如果你尝试将一个对象作为翻译占位符，该对象的 `__toString` 方法将被调用。[__toString](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的「魔术方法」之一。不过，有时你可能无法控制某个类的 `__toString` 方法，例如当你交互的类属于某个第三方库时。

对于这类情况，Laravel 允许你为该特定类型的对象注册自定义的格式化处理器。为此，你应该调用翻译器的 `stringable` 方法。`stringable` 方法接收一个闭包，闭包应通过类型提示指定它负责格式化的对象类型。通常，`stringable` 方法应在应用 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Lang;
use Money\Money;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Lang::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

<a name="pluralization"></a>
### 复数形式

复数形式是一个复杂的问题，因为不同语言有各式各样的复杂复数规则；不过，Laravel 可以根据你定义的复数形式规则，帮助你以不同方式翻译字符串。使用 `|` 字符，你可以区分字符串的单数形式和复数形式：

```php
'apples' => 'There is one apple|There are many apples',
```

当然，[使用翻译字符串作为键](#using-translation-strings-as-keys)时也支持复数形式：

```json
{
    "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

你甚至可以创建更复杂的复数形式规则，为多个数值范围指定不同的翻译字符串：

```php
'apples' => '{0} There are none|[1,19] There are some|[20,*] There are many',
```

定义好带有复数形式选项的翻译字符串后，你可以使用 `trans_choice` 函数来检索给定「数量」对应的语句。在下面的例子中，由于数量大于一，因此返回翻译字符串的复数形式：

```php
echo trans_choice('messages.apples', 10);
```

你还可以在复数形式字符串中定义占位符属性。将数组作为第三个参数传递给 `trans_choice` 函数，即可替换这些占位符：

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

有些扩展包可能自带语言文件。你无需修改扩展包的核心文件来调整这些语句，只需将文件放到 `lang/vendor/{package}/{locale}` 目录下即可覆盖它们。

举个例子，如果你需要覆盖名为 `skyrim/hearthfire` 的扩展包在 `messages.php` 中的英文翻译字符串，应该把语言文件放在：`lang/vendor/hearthfire/en/messages.php`。在这个文件中，你只需定义想要覆盖的翻译字符串即可。未覆盖的翻译字符串仍会从扩展包原本的语言文件中加载。
