# 本地化

- [简介](#introduction)
    - [发布语言文件](#publishing-the-language-files)
    - [配置本地化区域设置](#configuring-the-locale)
    - [复数形式语言](#pluralization-language)
- [定义翻译字符串](#defining-translation-strings)
    - [使用短键](#using-short-keys)
    - [使用翻译字符串作为键](#using-translation-strings-as-keys)
- [获取翻译字符串](#retrieving-translation-strings)
    - [替换翻译字符串中的参数](#replacing-parameters-in-translation-strings)
    - [复数形式](#pluralization)
- [覆盖包的语言文件](#overriding-package-language-files)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

Laravel 的本地化功能提供了一种便捷方式来获取各种语言的字符串，让你轻松在应用中支持多种语言。

Laravel 提供两种管理翻译字符串的方式。第一种，翻译字符串可以存放在应用 `lang` 目录下的文件中。该目录中可以为应用支持的每种语言建立一个子目录。Laravel 就是用这种方式管理内置功能（如验证错误消息）的翻译字符串：

    /lang
        /en
            messages.php
        /es
            messages.php

或者，翻译字符串也可以定义在放在 `lang` 目录中的 JSON 文件里。采用这种方式时，应用支持的每种语言都对应该目录中的一个 JSON 文件。这种方式推荐用于翻译字符串数量较多的应用：

    /lang
        en.json
        es.json

本文将分别讨论管理翻译字符串的每种方式。

<a name="publishing-the-language-files"></a>
### 发布语言文件

默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件或创建自己的语言文件，应通过 `lang:publish` Artisan 命令搭建 `lang` 目录。`lang:publish` 命令会在你的应用中创建 `lang` 目录，并发布 Laravel 使用的默认语言文件集：

```shell
php artisan lang:publish
```

<a name="configuring-the-locale"></a>
### 配置本地化区域设置

应用的默认语言存储在 `config/app.php` 配置文件的 `locale` 配置选项中，该选项通常使用 `APP_LOCALE` 环境变量设置。你可以自由修改该值以适应应用的需求。

你还可以配置一个"回退语言"，当默认语言中不包含某个翻译字符串时就会使用它。与默认语言一样，回退语言也在 `config/app.php` 配置文件中配置，其值通常使用 `APP_FALLBACK_LOCALE` 环境变量设置。

在运行时，你可以使用 `App` Facade 提供的 `setLocale` 方法为单次 HTTP 请求修改默认语言：

    use Illuminate\Support\Facades\App;

    Route::get('/greeting/{locale}', function (string $locale) {
        if (! in_array($locale, ['en', 'es', 'fr'])) {
            abort(400);
        }

        App::setLocale($locale);

        // ...
    });

<a name="determining-the-current-locale"></a>
#### 确定当前的区域设置

你可以使用 `App` Facade 上的 `currentLocale` 和 `isLocale` 方法获取当前区域设置，或检查区域设置是否为某个给定值：

    use Illuminate\Support\Facades\App;

    $locale = App::currentLocale();

    if (App::isLocale('en')) {
        // ...
    }

<a name="pluralization-language"></a>
### 复数形式语言

Laravel 的"复数化器"被 Eloquent 和框架其他部分用于把单数形式的字符串转换为复数形式，你可以指示它使用英语以外的语言。只需在应用中某个服务提供者的 `boot` 方法内调用 `useLanguage` 方法即可实现。复数化器当前支持的语言有：`french`、`norwegian-bokmal`、`portuguese`、`spanish` 和 `turkish`：

    use Illuminate\Support\Pluralizer;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Pluralizer::useLanguage('spanish');

        // ...
    }

> [!WARNING]
> 如果你自定义了复数化器的语言，就应当显式定义 Eloquent 模型的[表名](/docs/{{version}}/eloquent#table-names)。

<a name="defining-translation-strings"></a>
## 定义翻译字符串

<a name="using-short-keys"></a>
### 使用短键

通常，翻译字符串存放在 `lang` 目录下的文件中。该目录中应当为应用支持的每种语言建立一个子目录。Laravel 就是用这种方式管理内置功能（如验证错误消息）的翻译字符串：

    /lang
        /en
            messages.php
        /es
            messages.php

所有语言文件都返回一个以字符串为键的数组。例如：

    <?php

    // lang/en/messages.php

    return [
        'welcome' => 'Welcome to our application!',
    ];

> [!WARNING]
> 对于按地区区分的语言，你应当按照 ISO 15897 命名语言目录。例如，英国英语应使用 "en_GB" 而不是 "en-gb"。

<a name="using-translation-strings-as-keys"></a>
### 使用翻译字符串作为键

对于翻译字符串数量较多的应用，用"短键"定义每个字符串会在视图中引用键时变得混乱，而且要为应用支持的每个翻译字符串不断想出新键也很麻烦。

出于这个原因，Laravel 也支持直接用字符串的"默认翻译"作为键来定义翻译字符串。使用翻译字符串作为键的语言文件，以 JSON 文件形式存放在 `lang` 目录中。例如，如果你的应用有西班牙语翻译，就应当创建 `lang/es.json` 文件：

```json
{
    "I love programming.": "Me encanta programar."
}
```

#### 键 / 文件冲突

你不应定义与其他翻译文件名冲突的翻译字符串键。例如，为 "NL" 区域设置翻译 `__('Action')` 时，如果存在 `nl/action.php` 文件但不存在 `nl.json` 文件，翻译器就会返回 `nl/action.php` 的全部内容。

<a name="retrieving-translation-strings"></a>
## 获取翻译字符串

你可以使用 `__` 辅助函数从语言文件中获取翻译字符串。如果你使用"短键"定义翻译字符串，应使用"点"语法把包含该键的文件和键本身传给 `__` 函数。例如，从 `lang/en/messages.php` 语言文件中获取 `welcome` 翻译字符串：

    echo __('messages.welcome');

如果指定的翻译字符串不存在，`__` 函数会返回该翻译字符串的键。因此，使用上面的例子，如果翻译字符串不存在，`__` 函数会返回 `messages.welcome`。

如果你[使用默认翻译字符串作为翻译键](#using-translation-strings-as-keys)，就应当把字符串的默认翻译传给 `__` 函数：

    echo __('I love programming.');

同样，如果翻译字符串不存在，`__` 函数会返回传给它的翻译字符串键。

如果你使用 [Blade 模板引擎](/docs/{{version}}/blade)，可以使用 `{{ }}` 输出语法显示翻译字符串：

    {{ __('messages.welcome') }}

<a name="replacing-parameters-in-translation-strings"></a>
### 替换翻译字符串中的参数

如果需要，你可以在翻译字符串中定义占位符。所有占位符都以 `:` 开头。例如，你可以定义一条带占位符名称的欢迎消息：

    'welcome' => 'Welcome, :name',

若要在获取翻译字符串时替换占位符，可以把替换项数组作为 `__` 函数的第二个参数传入：

    echo __('messages.welcome', ['name' => 'dayle']);

如果你的占位符全为大写字母，或只有首字母大写，那么翻译后的值也会相应地大写：

    'welcome' => 'Welcome, :NAME', // Welcome, DAYLE
    'goodbye' => 'Goodbye, :Name', // Goodbye, Dayle

<a name="object-replacement-formatting"></a>
#### 对象替换格式化

如果你尝试把对象作为翻译占位符传入，对象的 `__toString` 方法会被调用。[`__toString`](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 内置的"魔术方法"之一。不过，有时你无法控制某个类的 `__toString` 方法，比如你与之交互的类属于第三方库时。

在这些情况下，Laravel 允许你为该特定类型的对象注册自定义的格式化处理函数。为此，你应调用翻译器的 `stringable` 方法。`stringable` 方法接受一个闭包，该闭包应当类型提示它负责格式化的对象类型。通常，你应该在应用的 `AppServiceProvider` 类的 `boot` 方法中调用 `stringable` 方法：

    use Illuminate\Support\Facades\Lang;
    use Money\Money;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Lang::stringable(function (Money $money) {
            return $money->formatTo('en_GB');
        });
    }

<a name="pluralization"></a>
### 复数形式

复数形式是一个复杂的问题，因为不同语言有各种复杂的复数化规则；不过，Laravel 可以帮助你根据自己定义的复数规则翻译出不同的字符串。使用 `|` 字符，你可以区分字符串的单数形式和复数形式：

    'apples' => 'There is one apple|There are many apples',

当然，使用[翻译字符串作为键](#using-translation-strings-as-keys)时也支持复数形式：

```json
{
    "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

你甚至可以创建更复杂的复数规则，为多个数值范围指定翻译字符串：

    'apples' => '{0} There are none|[1,19] There are some|[20,*] There are many',

定义好带复数选项的翻译字符串后，你可以使用 `trans_choice` 函数获取给定"数量"对应的文本。在这个例子中，由于数量大于 1，因此会返回翻译字符串的复数形式：

    echo trans_choice('messages.apples', 10);

你也可以在复数形式字符串中定义占位符属性。通过把数组作为 `trans_choice` 函数的第三个参数传入，可以替换这些占位符：

    'minutes_ago' => '{1} :value minute ago|[2,*] :value minutes ago',

    echo trans_choice('time.minutes_ago', 5, ['value' => 5]);

如果你想显示传给 `trans_choice` 函数的整数值，可以使用内置的 `:count` 占位符：

    'apples' => '{0} There are none|{1} There is one|[2,*] There are :count',

<a name="overriding-package-language-files"></a>
## 覆盖包的语言文件

某些包可能自带语言文件。你不必修改包的核心文件来调整这些文本，而是可以把文件放在 `lang/vendor/{package}/{locale}` 目录中来覆盖它们。

例如，如果你需要覆盖名为 `skyrim/hearthfire` 的包中 `messages.php` 的英文翻译字符串，就应当把语言文件放在 `lang/vendor/hearthfire/en/messages.php`。在该文件中，你只需定义想要覆盖的翻译字符串。任何未覆盖的翻译字符串仍会从该包原有的语言文件中加载。
