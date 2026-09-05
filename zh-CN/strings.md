# 字符串

## 简介

Laravel 包含多种用于操作字符串值的函数。框架本身使用了其中许多函数；不过，如果你觉得方便，也可以在自己的应用程序中自由使用它们。

## 可用方法

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

### 字符串

[\__](#method-__)
[class_basename](#method-class-basename)
[e](#method-e)
[preg_replace_array](#method-preg-replace-array)
[Str::after](#method-str-after)
[Str::afterLast](#method-str-after-last)
[Str::apa](#method-str-apa)
[Str::ascii](#method-str-ascii)
[Str::before](#method-str-before)
[Str::beforeLast](#method-str-before-last)
[Str::between](#method-str-between)
[Str::betweenFirst](#method-str-between-first)
[Str::camel](#method-camel-case)
[Str::charAt](#method-char-at)
[Str::chopStart](#method-str-chop-start)
[Str::chopEnd](#method-str-chop-end)
[Str::contains](#method-str-contains)
[Str::containsAll](#method-str-contains-all)
[Str::counted](#method-str-counted)
[Str::doesntContain](#method-str-doesnt-contain)
[Str::doesntEndWith](#method-str-doesnt-end-with)
[Str::doesntStartWith](#method-str-doesnt-start-with)
[Str::deduplicate](#method-deduplicate)
[Str::endsWith](#method-ends-with)
[Str::excerpt](#method-excerpt)
[Str::finish](#method-str-finish)
[Str::fromBase64](#method-str-from-base64)
[Str::headline](#method-str-headline)
[Str::initials](#method-str-initials)
[Str::inlineMarkdown](#method-str-inline-markdown)
[Str::is](#method-str-is)
[Str::isAscii](#method-str-is-ascii)
[Str::isJson](#method-str-is-json)
[Str::isUlid](#method-str-is-ulid)
[Str::isUrl](#method-str-is-url)
[Str::isUuid](#method-str-is-uuid)
[Str::kebab](#method-kebab-case)
[Str::lcfirst](#method-str-lcfirst)
[Str::length](#method-str-length)
[Str::limit](#method-str-limit)
[Str::lower](#method-str-lower)
[Str::markdown](#method-str-markdown)
[Str::mask](#method-str-mask)
[Str::match](#method-str-match)
[Str::matchAll](#method-str-match-all)
[Str::isMatch](#method-str-is-match)
[Str::orderedUuid](#method-str-ordered-uuid)
[Str::padBoth](#method-str-padboth)
[Str::padLeft](#method-str-padleft)
[Str::padRight](#method-str-padright)
[Str::password](#method-str-password)
[Str::plural](#method-str-plural)
[Str::pluralStudly](#method-str-plural-studly)
[Str::position](#method-str-position)
[Str::random](#method-str-random)
[Str::remove](#method-str-remove)
[Str::repeat](#method-str-repeat)
[Str::replace](#method-str-replace)
[Str::replaceArray](#method-str-replace-array)
[Str::replaceFirst](#method-str-replace-first)
[Str::replaceLast](#method-str-replace-last)
[Str::replaceMatches](#method-str-replace-matches)
[Str::replaceStart](#method-str-replace-start)
[Str::replaceEnd](#method-str-replace-end)
[Str::reverse](#method-str-reverse)
[Str::singular](#method-str-singular)
[Str::slug](#method-str-slug)
[Str::snake](#method-snake-case)
[Str::squish](#method-str-squish)
[Str::start](#method-str-start)
[Str::startsWith](#method-starts-with)
[Str::studly](#method-studly-case)
[Str::substr](#method-str-substr)
[Str::substrCount](#method-str-substrcount)
[Str::substrReplace](#method-str-substrreplace)
[Str::swap](#method-str-swap)
[Str::take](#method-take)
[Str::title](#method-title-case)
[Str::toBase64](#method-str-to-base64)
[Str::transliterate](#method-str-transliterate)
[Str::trim](#method-str-trim)
[Str::ltrim](#method-str-ltrim)
[Str::rtrim](#method-str-rtrim)
[Str::ucfirst](#method-str-ucfirst)
[Str::ucsplit](#method-str-ucsplit)
[Str::ucwords](#method-str-ucwords)
[Str::upper](#method-str-upper)
[Str::ulid](#method-str-ulid)
[Str::unwrap](#method-str-unwrap)
[Str::uuid](#method-str-uuid)
[Str::uuid7](#method-str-uuid7)
[Str::wordCount](#method-str-word-count)
[Str::wordWrap](#method-str-word-wrap)
[Str::words](#method-str-words)
[Str::wrap](#method-str-wrap)
[str](#method-str)
[trans](#method-trans)
[trans_choice](#method-trans-choice)

### 流式字符串

[after](#method-fluent-str-after)
[afterLast](#method-fluent-str-after-last)
[apa](#method-fluent-str-apa)
[append](#method-fluent-str-append)
[ascii](#method-fluent-str-ascii)
[basename](#method-fluent-str-basename)
[before](#method-fluent-str-before)
[beforeLast](#method-fluent-str-before-last)
[between](#method-fluent-str-between)
[betweenFirst](#method-fluent-str-between-first)
[camel](#method-fluent-str-camel)
[charAt](#method-fluent-str-char-at)
[classBasename](#method-fluent-str-class-basename)
[chopStart](#method-fluent-str-chop-start)
[chopEnd](#method-fluent-str-chop-end)
[contains](#method-fluent-str-contains)
[containsAll](#method-fluent-str-contains-all)
[counted](#method-fluent-str-counted)
[decrypt](#method-fluent-str-decrypt)
[deduplicate](#method-fluent-str-deduplicate)
[dirname](#method-fluent-str-dirname)
[doesntContain](#method-fluent-str-doesnt-contain)
[doesntEndWith](#method-fluent-str-doesnt-end-with)
[doesntStartWith](#method-fluent-str-doesnt-start-with)
[encrypt](#method-fluent-str-encrypt)
[endsWith](#method-fluent-str-ends-with)
[exactly](#method-fluent-str-exactly)
[excerpt](#method-fluent-str-excerpt)
[explode](#method-fluent-str-explode)
[finish](#method-fluent-str-finish)
[fromBase64](#method-fluent-str-from-base64)
[hash](#method-fluent-str-hash)
[headline](#method-fluent-str-headline)
[initials](#method-fluent-str-initials)
[inlineMarkdown](#method-fluent-str-inline-markdown)
[is](#method-fluent-str-is)
[isAscii](#method-fluent-str-is-ascii)
[isEmpty](#method-fluent-str-is-empty)
[isNotEmpty](#method-fluent-str-is-not-empty)
[isJson](#method-fluent-str-is-json)
[isUlid](#method-fluent-str-is-ulid)
[isUrl](#method-fluent-str-is-url)
[isUuid](#method-fluent-str-is-uuid)
[kebab](#method-fluent-str-kebab)
[lcfirst](#method-fluent-str-lcfirst)
[length](#method-fluent-str-length)
[limit](#method-fluent-str-limit)
[lower](#method-fluent-str-lower)
[markdown](#method-fluent-str-markdown)
[mask](#method-fluent-str-mask)
[match](#method-fluent-str-match)
[matchAll](#method-fluent-str-match-all)
[isMatch](#method-fluent-str-is-match)
[newLine](#method-fluent-str-new-line)
[padBoth](#method-fluent-str-padboth)
[padLeft](#method-fluent-str-padleft)
[padRight](#method-fluent-str-padright)
[pipe](#method-fluent-str-pipe)
[plural](#method-fluent-str-plural)
[position](#method-fluent-str-position)
[prepend](#method-fluent-str-prepend)
[remove](#method-fluent-str-remove)
[repeat](#method-fluent-str-repeat)
[replace](#method-fluent-str-replace)
[replaceArray](#method-fluent-str-replace-array)
[replaceFirst](#method-fluent-str-replace-first)
[replaceLast](#method-fluent-str-replace-last)
[replaceMatches](#method-fluent-str-replace-matches)
[replaceStart](#method-fluent-str-replace-start)
[replaceEnd](#method-fluent-str-replace-end)
[scan](#method-fluent-str-scan)
[singular](#method-fluent-str-singular)
[slug](#method-fluent-str-slug)
[snake](#method-fluent-str-snake)
[split](#method-fluent-str-split)
[squish](#method-fluent-str-squish)
[start](#method-fluent-str-start)
[startsWith](#method-fluent-str-starts-with)
[stripTags](#method-fluent-str-strip-tags)
[studly](#method-fluent-str-studly)
[substr](#method-fluent-str-substr)
[substrReplace](#method-fluent-str-substrreplace)
[swap](#method-fluent-str-swap)
[take](#method-fluent-str-take)
[tap](#method-fluent-str-tap)
[test](#method-fluent-str-test)
[title](#method-fluent-str-title)
[toBase64](#method-fluent-str-to-base64)
[toHtmlString](#method-fluent-str-to-html-string)
[toUri](#method-fluent-str-to-uri)
[transliterate](#method-fluent-str-transliterate)
[trim](#method-fluent-str-trim)
[ltrim](#method-fluent-str-ltrim)
[rtrim](#method-fluent-str-rtrim)
[ucfirst](#method-fluent-str-ucfirst)
[ucsplit](#method-fluent-str-ucsplit)
[ucwords](#method-fluent-str-ucwords)
[unwrap](#method-fluent-str-unwrap)
[upper](#method-fluent-str-upper)
[when](#method-fluent-str-when)
[whenContains](#method-fluent-str-when-contains)
[whenContainsAll](#method-fluent-str-when-contains-all)
[whenDoesntEndWith](#method-fluent-str-when-doesnt-end-with)
[whenDoesntStartWith](#method-fluent-str-when-doesnt-start-with)
[whenEmpty](#method-fluent-str-when-empty)
[whenNotEmpty](#method-fluent-str-when-not-empty)
[whenStartsWith](#method-fluent-str-when-starts-with)
[whenEndsWith](#method-fluent-str-when-ends-with)
[whenExactly](#method-fluent-str-when-exactly)
[whenNotExactly](#method-fluent-str-when-not-exactly)
[whenIs](#method-fluent-str-when-is)
[whenIsAscii](#method-fluent-str-when-is-ascii)
[whenIsUlid](#method-fluent-str-when-is-ulid)
[whenIsUuid](#method-fluent-str-when-is-uuid)
[whenTest](#method-fluent-str-when-test)
[wordCount](#method-fluent-str-word-count)
[words](#method-fluent-str-words)
[wrap](#method-fluent-str-wrap)

## 字符串

#### `__()` {.collection-method}

`__` 函数使用你的[语言文件](/docs/{{version}}/localization)翻译给定的翻译字符串或翻译键：

```php
echo __('Welcome to our application');

echo __('messages.welcome');
```

如果指定的翻译字符串或键不存在，`__` 函数将返回给定的值。因此，使用上面的示例，如果该翻译键不存在，`__` 函数会返回 `messages.welcome`。

#### `class_basename()` {.collection-method}

`class_basename` 函数返回去除命名空间后的给定类的类名：

```php
$class = class_basename('Foo\Bar\Baz');

// Baz
```

#### `e()` {.collection-method}

`e` 函数以 `double_encode` 选项默认为 `true` 的方式运行 PHP 的 `htmlspecialchars` 函数：

```php
echo e('<html>foo</html>');

// &lt;html&gt;foo&lt;/html&gt;
```

#### `preg_replace_array()` {.collection-method}

`preg_replace_array` 函数使用数组按顺序替换字符串中给定的模式：

```php
$string = 'The event will take place between :start and :end';

$replaced = preg_replace_array('/:[a-z_]+/', ['8:30', '9:00'], $string);

// The event will take place between 8:30 and 9:00
```

#### `Str::after()` {.collection-method}

`Str::after` 方法返回字符串中给定值之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::after('This is my name', 'This is');

// ' my name'
```

#### `Str::afterLast()` {.collection-method}

`Str::afterLast` 方法返回字符串中给定值最后一次出现之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::afterLast('App\Http\Controllers\Controller', '\\');

// 'Controller'
```

#### `Str::apa()` {.collection-method}

`Str::apa` 方法按照 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case)将给定字符串转换为标题大小写：

```php
use Illuminate\Support\Str;

$title = Str::apa('Creating A Project');

// 'Creating a Project'
```

#### `Str::ascii()` {.collection-method}

`Str::ascii` 方法会尝试将字符串音译为 ASCII 值：

```php
use Illuminate\Support\Str;

$slice = Str::ascii('û');

// 'u'
```

#### `Str::before()` {.collection-method}

`Str::before` 方法返回字符串中给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::before('This is my name', 'my name');

// 'This is '
```

#### `Str::beforeLast()` {.collection-method}

`Str::beforeLast` 方法返回字符串中给定值最后一次出现之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::beforeLast('This is my name', 'is');

// 'This '
```

#### `Str::between()` {.collection-method}

`Str::between` 方法返回两个值之间的字符串部分：

```php
use Illuminate\Support\Str;

$slice = Str::between('This is my name', 'This', 'name');

// ' is my '
```

#### `Str::betweenFirst()` {.collection-method}

`Str::betweenFirst` 方法返回两个值之间尽可能小的字符串部分：

```php
use Illuminate\Support\Str;

$slice = Str::betweenFirst('[a] bc [d]', '[', ']');

// 'a'
```

#### `Str::camel()` {.collection-method}

`Str::camel` 方法将给定字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::camel('foo_bar');

// 'fooBar'
```

#### `Str::charAt()` {.collection-method}

`Str::charAt` 方法返回指定索引处的字符。如果索引越界，则返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::charAt('This is my name.', 6);

// 's'
```

#### `Str::chopStart()` {.collection-method}

`Str::chopStart` 方法仅在值出现在字符串开头时移除其首次出现：

```php
use Illuminate\Support\Str;

$url = Str::chopStart('https://laravel.com', 'https://');

// 'laravel.com'
```

你也可以将数组作为第二个参数传递。如果字符串以数组中的任意值开头，则该值会从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::chopStart('http://laravel.com', ['https://', 'http://']);

// 'laravel.com'
```

#### `Str::chopEnd()` {.collection-method}

`Str::chopEnd` 方法仅在值出现在字符串结尾时移除其最后一次出现：

```php
use Illuminate\Support\Str;

$url = Str::chopEnd('app/Models/Photograph.php', '.php');

// 'app/Models/Photograph'
```

你也可以将数组作为第二个参数传递。如果字符串以数组中的任意值结尾，则该值会从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::chopEnd('laravel.com/index.php', ['/index.html', '/index.php']);

// 'laravel.com'
```

#### `Str::contains()` {.collection-method}

`Str::contains` 方法判断给定字符串是否包含给定值。默认情况下，该方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::contains('This is my name', 'my');

// true
```

你也可以传递一个值数组来判断给定字符串是否包含数组中的任意值：

```php
use Illuminate\Support\Str;

$contains = Str::contains('This is my name', ['my', 'foo']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$contains = Str::contains('This is my name', 'MY', ignoreCase: true);

// true
```

#### `Str::containsAll()` {.collection-method}

`Str::containsAll` 方法判断给定字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::containsAll('This is my name', ['my', 'name']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$containsAll = Str::containsAll('This is my name', ['MY', 'NAME'], ignoreCase: true);

// true
```

#### `Str::doesntContain()` {.collection-method}

`Str::doesntContain` 方法判断给定字符串是否不包含给定值。默认情况下，该方法区分大小写：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('This is name', 'my');

// true
```

你也可以传递一个值数组来判断给定字符串是否不包含数组中的任意值：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('This is name', ['my', 'framework']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('This is name', 'MY', ignoreCase: true);

// true
```

#### `Str::deduplicate()` {.collection-method}

`Str::deduplicate` 方法将字符串中连续出现的某字符替换为该字符的单个实例。默认情况下，该方法去重空格：

```php
use Illuminate\Support\Str;

$result = Str::deduplicate('The   Laravel   Framework');

// The Laravel Framework
```

你可以通过将另一个字符作为第二个参数传递给该方法来指定要对其去重的字符：

```php
use Illuminate\Support\Str;

$result = Str::deduplicate('The---Laravel---Framework', '-');

// The-Laravel-Framework
```

#### `Str::doesntEndWith()` {.collection-method}

`Str::doesntEndWith` 方法判断给定字符串是否不以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::doesntEndWith('This is my name', 'dog');

// true
```

你也可以传递一个值数组来判断给定字符串是否不以数组中的任意值结尾：

```php
use Illuminate\Support\Str;

$result = Str::doesntEndWith('This is my name', ['this', 'foo']);

// true

$result = Str::doesntEndWith('This is my name', ['name', 'foo']);

// false
```

#### `Str::doesntStartWith()` {.collection-method}

`Str::doesntStartWith` 方法判断给定字符串是否不以给定值开头：

```php
use Illuminate\Support\Str;

$result = Str::doesntStartWith('This is my name', 'That');

// true
```

如果传入了可能的取值数组，只要字符串不以其中任意值开头，`doesntStartWith` 方法就会返回 `true`：

```php
$result = Str::doesntStartWith('This is my name', ['What', 'That', 'There']);

// true
```

#### `Str::endsWith()` {.collection-method}

`Str::endsWith` 方法判断给定字符串是否以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('This is my name', 'name');

// true
```

你也可以传递一个值数组来判断给定字符串是否以数组中的任意值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('This is my name', ['name', 'foo']);

// true

$result = Str::endsWith('This is my name', ['this', 'foo']);

// false
```

#### `Str::excerpt()` {.collection-method}

`Str::excerpt` 方法从给定字符串中提取与其中某短语首次出现相匹配的摘要：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('This is my name', 'my', [
    'radius' => 3
]);

// '...is my na...'
```

`radius` 选项默认为 `100`，允许你定义被截断字符串两侧应出现的字符数量。

此外，你可以使用 `omission` 选项定义将被前置和追加到被截断字符串上的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('This is my name', 'name', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) my name'
```

#### `Str::finish()` {.collection-method}

`Str::finish` 方法如果字符串尚未以给定值结尾，则为其添加该值的单个实例：

```php
use Illuminate\Support\Str;

$adjusted = Str::finish('this/string', '/');

// this/string/

$adjusted = Str::finish('this/string/', '/');

// this/string/
```

#### `Str::fromBase64()` {.collection-method}

`Str::fromBase64` 方法解码给定的 Base64 字符串：

```php
use Illuminate\Support\Str;

$decoded = Str::fromBase64('TGFyYXZlbA==');

// Laravel
```

#### `Str::headline()` {.collection-method}

`Str::headline` 方法将以大小写、连字符或下划线分隔的字符串转换为以空格分隔、每个单词首字母大写的字符串：

```php
use Illuminate\Support\Str;

$headline = Str::headline('steve_jobs');

// Steve Jobs

$headline = Str::headline('EmailNotificationSent');

// Email Notification Sent
```

#### `Str::initials()` {.collection-method}

`Str::initials` 方法返回给定字符串的首字母缩写，可选择将其大写：

```php
use Illuminate\Support\Str;

$initials = Str::initials('taylor otwell');

// to

$initials = Str::initials('taylor otwell', capitalize: true);

// TO
```

#### `Str::inlineMarkdown()` {.collection-method}

`Str::inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但与 `markdown` 方法不同，它不会将所有生成的 HTML 包裹在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::inlineMarkdown('**Laravel**');

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，在与原始用户输入一起使用时会产生跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或去除原始 HTML，并使用 `allow_unsafe_links` 选项指定是否允许不安全的链接。如果你需要允许一些原始 HTML，应该将已编译的 Markdown 通过 HTML Purifier 处理：

```php
use Illuminate\Support\Str;

Str::inlineMarkdown('Inject: <script>alert("Hello XSS!");</script>', [
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// Inject: alert(&quot;Hello XSS!&quot;);
```

#### `Str::is()` {.collection-method}

`Str::is` 方法判断给定字符串是否匹配给定模式。星号可用作通配值：

```php
use Illuminate\Support\Str;

$matches = Str::is('foo*', 'foobar');

// true

$matches = Str::is('baz*', 'foobar');

// false
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$matches = Str::is('*.jpg', 'photo.JPG', ignoreCase: true);

// true
```

#### `Str::isAscii()` {.collection-method}

`Str::isAscii` 方法判断给定字符串是否为 7 位 ASCII：

```php
use Illuminate\Support\Str;

$isAscii = Str::isAscii('Taylor');

// true

$isAscii = Str::isAscii('ü');

// false
```

#### `Str::isJson()` {.collection-method}

`Str::isJson` 方法判断给定字符串是否为有效 JSON：

```php
use Illuminate\Support\Str;

$result = Str::isJson('[1,2,3]');

// true

$result = Str::isJson('{"first": "John", "last": "Doe"}');

// true

$result = Str::isJson('{first: "John", last: "Doe"}');

// false
```

#### `Str::isUrl()` {.collection-method}

`Str::isUrl` 方法判断给定字符串是否为有效 URL：

```php
use Illuminate\Support\Str;

$isUrl = Str::isUrl('http://example.com');

// true

$isUrl = Str::isUrl('laravel');

// false
```

`isUrl` 方法将多种协议视为有效。不过，你可以通过向 `isUrl` 方法提供协议来指定哪些协议应被视为有效：

```php
$isUrl = Str::isUrl('http://example.com', ['http', 'https']);
```

#### `Str::isUlid()` {.collection-method}

`Str::isUlid` 方法判断给定字符串是否为有效 ULID：

```php
use Illuminate\Support\Str;

$isUlid = Str::isUlid('01gd6r360bp37zj17nxb55yv40');

// true

$isUlid = Str::isUlid('laravel');

// false
```

#### `Str::isUuid()` {.collection-method}

`Str::isUuid` 方法判断给定字符串是否为有效 UUID：

```php
use Illuminate\Support\Str;

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de');

// true

$isUuid = Str::isUuid('laravel');

// false
```

你还可以验证给定 UUID 是否匹配某个版本的规范（1、3、4、5、6、7 或 8）：

```php
use Illuminate\Support\Str;

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de', version: 4);

// true

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de', version: 1);

// false
```

#### `Str::kebab()` {.collection-method}

`Str::kebab` 方法将给定字符串转换为 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::kebab('fooBar');

// foo-bar
```

#### `Str::lcfirst()` {.collection-method}

`Str::lcfirst` 方法返回首字符小写的给定字符串：

```php
use Illuminate\Support\Str;

$string = Str::lcfirst('Foo Bar');

// foo Bar
```

#### `Str::length()` {.collection-method}

`Str::length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::length('Laravel');

// 7
```

#### `Str::limit()` {.collection-method}

`Str::limit` 方法将给定字符串截断到指定长度：

```php
use Illuminate\Support\Str;

$truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20);

// The quick brown fox...
```

你可以向该方法传递第三个参数来更改将被追加到被截断字符串末尾的字符串：

```php
$truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20, ' (...)');

// The quick brown fox (...)
```

如果你想在截断字符串时保留完整的单词，可以使用 `preserveWords` 参数。当该参数为 `true` 时，字符串将被截断到最近的完整单词边界：

```php
$truncated = Str::limit('The quick brown fox', 12, preserveWords: true);

// The quick...
```

#### `Str::lower()` {.collection-method}

`Str::lower` 方法将给定字符串转换为小写：

```php
use Illuminate\Support\Str;

$converted = Str::lower('LARAVEL');

// laravel
```

#### `Str::markdown()` {.collection-method}

`Str::markdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为 HTML：

```php
use Illuminate\Support\Str;

$html = Str::markdown('# Laravel');

// <h1>Laravel</h1>

$html = Str::markdown('# Taylor <b>Otwell</b>', [
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，在与原始用户输入一起使用时会产生跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或去除原始 HTML，并使用 `allow_unsafe_links` 选项指定是否允许不安全的链接。如果你需要允许一些原始 HTML，应该将已编译的 Markdown 通过 HTML Purifier 处理：

```php
use Illuminate\Support\Str;

Str::markdown('Inject: <script>alert("Hello XSS!");</script>', [
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// <p>Inject: alert(&quot;Hello XSS!&quot;);</p>
```

#### `Str::mask()` {.collection-method}

`Str::mask` 方法使用重复字符遮盖字符串的某部分，可用于混淆电子邮件地址和电话号码等字符串片段：

```php
use Illuminate\Support\Str;

$string = Str::mask('taylor@example.com', '*', 3);

// tay***************
```

如果需要，你可以向 `mask` 方法提供负数作为第三个参数，这会指示该方法从字符串末尾的给定距离处开始遮盖：

```php
$string = Str::mask('taylor@example.com', '*', -15, 3);

// tay***@example.com
```

#### `Str::match()` {.collection-method}

`Str::match` 方法返回与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::match('/bar/', 'foo bar');

// 'bar'

$result = Str::match('/foo (.*)/', 'foo bar');

// 'bar'
```

#### `Str::matchAll()` {.collection-method}

`Str::matchAll` 方法返回包含与给定正则表达式模式匹配的字符串部分的集合：

```php
use Illuminate\Support\Str;

$result = Str::matchAll('/bar/', 'bar foo bar');

// collect(['bar', 'bar'])
```

如果你在表达式中指定了匹配组，Laravel 将返回第一个匹配组的匹配项组成的集合：

```php
use Illuminate\Support\Str;

$result = Str::matchAll('/f(\w*)/', 'bar fun bar fly');

// collect(['un', 'ly'])
```

如果未找到任何匹配项，将返回一个空集合。

#### `Str::isMatch()` {.collection-method}

`Str::isMatch` 方法如果字符串匹配给定的正则表达式，则返回 `true`：

```php
use Illuminate\Support\Str;

$result = Str::isMatch('/foo (.*)/', 'foo bar');

// true

$result = Str::isMatch('/foo (.*)/', 'laravel');

// false
```

#### `Str::orderedUuid()` {.collection-method}

`Str::orderedUuid` 方法生成"时间戳优先"的 UUID，可高效存储于索引数据库列中。使用该方法生成的每个 UUID 都会排在之前使用该方法生成的 UUID 之后：

```php
use Illuminate\Support\Str;

return (string) Str::orderedUuid();
```

#### `Str::padBoth()` {.collection-method}

`Str::padBoth` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在两侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::padBoth('James', 10, '_');

// '__James___'

$padded = Str::padBoth('James', 10);

// '  James   '
```

#### `Str::padLeft()` {.collection-method}

`Str::padLeft` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在左侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::padLeft('James', 10, '-=');

// '-=-=-James'

$padded = Str::padLeft('James', 10);

// '     James'
```

#### `Str::padRight()` {.collection-method}

`Str::padRight` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在右侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::padRight('James', 10, '-');

// 'James-----'

$padded = Str::padRight('James', 10);

// 'James     '
```

#### `Str::password()` {.collection-method}

`Str::password` 方法可用于生成给定长度的、安全的随机密码。密码由字母、数字、符号和空格组合而成。默认情况下，密码长度为 32 个字符：

```php
use Illuminate\Support\Str;

$password = Str::password();

// 'EbJo2vE-AS:U,$%_gkrV4n,q~1xy/-_4'

$password = Str::password(12);

// 'qwuar>#V|i]N'
```

#### `Str::counted()` {.collection-method}

`Str::counted` 方法根据给定数量将单数单词字符串转换为单数或复数形式，并用格式化后的数量作为前缀：

```php
use Illuminate\Support\Str;

$label = Str::counted('order', 1);

// 1 order

$label = Str::counted('order', 1000);

// 1,000 orders
```

#### `Str::plural()` {.collection-method}

`Str::plural` 方法将单数单词字符串转换为复数形式。该函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::plural('car');

// cars

$plural = Str::plural('child');

// children
```

你可以将整数作为第二个参数传递给该函数，以检索字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::plural('child', 2);

// children

$singular = Str::plural('child', 1);

// child
```

可以提供 `prependCount` 参数，用格式化后的 `$count` 作为复数化字符串的前缀：

```php
use Illuminate\Support\Str;

$label = Str::plural('car', 1000, prependCount: true);

// 1,000 cars
```

#### `Str::pluralStudly()` {.collection-method}

`Str::pluralStudly` 方法将以 studly caps 大小写格式化的单数单词字符串转换为复数形式。该函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman');

// VerifiedHumans

$plural = Str::pluralStudly('UserFeedback');

// UserFeedback
```

你可以将整数作为第二个参数传递给该函数，以检索字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman', 2);

// VerifiedHumans

$singular = Str::pluralStudly('VerifiedHuman', 1);

// VerifiedHuman
```

#### `Str::position()` {.collection-method}

`Str::position` 方法返回子字符串在字符串中首次出现的位置。如果子字符串不存在于给定字符串中，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::position('Hello, World!', 'Hello');

// 0

$position = Str::position('Hello, World!', 'W');

// 7
```

#### `Str::random()` {.collection-method}

`Str::random` 方法生成指定长度的随机字符串。该函数使用 PHP 的 `random_bytes` 函数：

```php
use Illuminate\Support\Str;

$random = Str::random(40);
```

在测试期间，将 `Str::random` 方法返回的值"伪造"可能会很有用。为此，你可以使用 `createRandomStringsUsing` 方法：

```php
Str::createRandomStringsUsing(function () {
    return 'fake-random-string';
});
```

要指示 `random` 方法恢复正常生成随机字符串，可以调用 `createRandomStringsNormally` 方法：

```php
Str::createRandomStringsNormally();
```

#### `Str::remove()` {.collection-method}

`Str::remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = 'Peter Piper picked a peck of pickled peppers.';

$removed = Str::remove('e', $string);

// Ptr Pipr pickd a pck of pickld ppprs.
```

你也可以向 `remove` 方法传递 `false` 作为第三个参数，以在移除字符串时忽略大小写。

#### `Str::repeat()` {.collection-method}

`Str::repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$string = 'a';

$repeat = Str::repeat($string, 5);

// aaaaa
```

#### `Str::replace()` {.collection-method}

`Str::replace` 方法替换字符串中的给定字符串：

```php
use Illuminate\Support\Str;

$string = 'Laravel 11.x';

$replaced = Str::replace('11.x', '12.x', $string);

// Laravel 12.x
```

`replace` 方法还接受 `caseSensitive` 参数。默认情况下，`replace` 方法区分大小写：

```php
$replaced = Str::replace(
    'php',
    'Laravel',
    'PHP Framework for Web Artisans',
    caseSensitive: false
);

// Laravel Framework for Web Artisans
```

#### `Str::replaceArray()` {.collection-method}

`Str::replaceArray` 方法使用数组按顺序替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = 'The event will take place between ? and ?';

$replaced = Str::replaceArray('?', ['8:30', '9:00'], $string);

// The event will take place between 8:30 and 9:00
```

#### `Str::replaceFirst()` {.collection-method}

`Str::replaceFirst` 方法替换字符串中给定值的首次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceFirst('the', 'a', 'the quick brown fox jumps over the lazy dog');

// a quick brown fox jumps over the lazy dog
```

#### `Str::replaceLast()` {.collection-method}

`Str::replaceLast` 方法替换字符串中给定值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceLast('the', 'a', 'the quick brown fox jumps over the lazy dog');

// the quick brown fox jumps over a lazy dog
```

#### `Str::replaceMatches()` {.collection-method}

`Str::replaceMatches` 方法将匹配模式的字符串所有部分替换为给定的替换字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches(
    pattern: '/[^A-Za-z0-9]++/',
    replace: '',
    subject: '(+1) 501-555-1000'
)

// '15015551000'
```

`replaceMatches` 方法还接受一个闭包，该闭包将针对匹配给定模式的字符串的每个部分被调用，让你可以执行替换逻辑并返回替换后的值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
}, '123');

// '[1][2][3]'
```

#### `Str::replaceStart()` {.collection-method}

`Str::replaceStart` 方法仅在值出现在字符串开头时替换其首次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceStart('Hello', 'Laravel', 'Hello World');

// Laravel World

$replaced = Str::replaceStart('World', 'Laravel', 'Hello World');

// Hello World
```

#### `Str::replaceEnd()` {.collection-method}

`Str::replaceEnd` 方法仅在值出现在字符串结尾时替换其最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceEnd('World', 'Laravel', 'Hello World');

// Hello Laravel

$replaced = Str::replaceEnd('Hello', 'Laravel', 'Hello World');

// Hello World
```

#### `Str::reverse()` {.collection-method}

`Str::reverse` 方法反转给定的字符串：

```php
use Illuminate\Support\Str;

$reversed = Str::reverse('Hello World');

// dlroW olleH
```

#### `Str::singular()` {.collection-method}

`Str::singular` 方法将字符串转换为单数形式。该函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::singular('cars');

// car

$singular = Str::singular('children');

// child
```

#### `Str::slug()` {.collection-method}

`Str::slug` 方法从给定字符串生成对 URL 友好的"slug"：

```php
use Illuminate\Support\Str;

$slug = Str::slug('Laravel 5 Framework', '-');

// laravel-5-framework
```

#### `Str::snake()` {.collection-method}

`Str::snake` 方法将给定字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::snake('fooBar');

// foo_bar

$converted = Str::snake('fooBar', '-');

// foo-bar
```

#### `Str::squish()` {.collection-method}

`Str::squish` 方法移除字符串中所有多余的空白，包括单词之间多余的空白：

```php
use Illuminate\Support\Str;

$string = Str::squish('    laravel    framework    ');

// laravel framework
```

#### `Str::start()` {.collection-method}

`Str::start` 方法如果字符串尚未以给定值开头，则为其添加该值的单个实例：

```php
use Illuminate\Support\Str;

$adjusted = Str::start('this/string', '/');

// /this/string

$adjusted = Str::start('/this/string', '/');

// /this/string
```

#### `Str::startsWith()` {.collection-method}

`Str::startsWith` 方法判断给定字符串是否以给定值开头：

```php
use Illuminate\Support\Str;

$result = Str::startsWith('This is my name', 'This');

// true
```

如果传入了可能的取值数组，只要字符串以其中任意值开头，`startsWith` 方法就会返回 `true`：

```php
$result = Str::startsWith('This is my name', ['This', 'That', 'There']);

// true
```

#### `Str::studly()` {.collection-method}

`Str::studly` 方法将给定字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::studly('foo_bar');

// FooBar
```

#### `Str::substr()` {.collection-method}

`Str::substr` 方法返回由起始和长度参数指定的字符串部分：

```php
use Illuminate\Support\Str;

$converted = Str::substr('The Laravel Framework', 4, 7);

// Laravel
```

#### `Str::substrCount()` {.collection-method}

`Str::substrCount` 方法返回给定值在给定字符串中出现的次数：

```php
use Illuminate\Support\Str;

$count = Str::substrCount('If you like ice cream, you will like snow cones.', 'like');

// 2
```

#### `Str::substrReplace()` {.collection-method}

`Str::substrReplace` 方法替换字符串某部分中的文本，从第三个参数指定的位置开始，替换第四个参数指定的字符数。向方法第四个参数传递 `0` 会在指定位置插入字符串而不替换字符串中的任何现有字符：

```php
use Illuminate\Support\Str;

$result = Str::substrReplace('1300', ':', 2);
// 13:

$result = Str::substrReplace('1300', ':', 2, 0);
// 13:00
```

#### `Str::swap()` {.collection-method}

`Str::swap` 方法使用 PHP 的 `strtr` 函数替换给定字符串中的多个值：

```php
use Illuminate\Support\Str;

$string = Str::swap([
    'Tacos' => 'Burritos',
    'great' => 'fantastic',
], 'Tacos are great!');

// Burritos are fantastic!
```

#### `Str::take()` {.collection-method}

`Str::take` 方法返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::take('Build something amazing!', 5);

// Build
```

#### `Str::title()` {.collection-method}

`Str::title` 方法将给定字符串转换为 `Title Case`：

```php
use Illuminate\Support\Str;

$converted = Str::title('a nice title uses the correct case');

// A Nice Title Uses The Correct Case
```

#### `Str::toBase64()` {.collection-method}

`Str::toBase64` 方法将给定字符串转换为 Base64：

```php
use Illuminate\Support\Str;

$base64 = Str::toBase64('Laravel');

// TGFyYXZlbA==
```

#### `Str::transliterate()` {.collection-method}

`Str::transliterate` 方法会尝试将给定字符串转换为其最接近的 ASCII 表示：

```php
use Illuminate\Support\Str;

$email = Str::transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ');

// 'test@laravel.com'
```

#### `Str::trim()` {.collection-method}

`Str::trim` 方法去除给定字符串开头和结尾的空白（或其他字符）。与 PHP 原生的 `trim` 函数不同，`Str::trim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::trim(' foo bar ');

// 'foo bar'
```

#### `Str::ltrim()` {.collection-method}

`Str::ltrim` 方法去除给定字符串开头的空白（或其他字符）。与 PHP 原生的 `ltrim` 函数不同，`Str::ltrim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::ltrim('  foo bar  ');

// 'foo bar  '
```

#### `Str::rtrim()` {.collection-method}

`Str::rtrim` 方法去除给定字符串结尾的空白（或其他字符）。与 PHP 原生的 `rtrim` 函数不同，`Str::rtrim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::rtrim('  foo bar  ');

// '  foo bar'
```

#### `Str::ucfirst()` {.collection-method}

`Str::ucfirst` 方法返回首字符大写的给定字符串：

```php
use Illuminate\Support\Str;

$string = Str::ucfirst('foo bar');

// Foo bar
```

#### `Str::ucsplit()` {.collection-method}

`Str::ucsplit` 方法按大写字符将给定字符串拆分为数组：

```php
use Illuminate\Support\Str;

$segments = Str::ucsplit('FooBar');

// [0 => 'Foo', 1 => 'Bar']
```

#### `Str::ucwords()` {.collection-method}

`Str::ucwords` 方法将给定字符串中每个单词的首字符转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::ucwords('laravel framework');

// Laravel Framework
```

#### `Str::upper()` {.collection-method}

`Str::upper` 方法将给定字符串转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::upper('laravel');

// LARAVEL
```

#### `Str::ulid()` {.collection-method}

`Str::ulid` 方法生成 ULID，这是一种紧凑的、按时间排序的唯一标识符：

```php
use Illuminate\Support\Str;

return (string) Str::ulid();

// 01gd6r360bp37zj17nxb55yv40
```

如果你想获取表示给定 ULID 创建日期和时间的 `Illuminate\Support\Carbon` 日期实例，可以使用 Laravel 的 Carbon 集成提供的 `createFromId` 方法：

```php
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

$date = Carbon::createFromId((string) Str::ulid());
```

在测试期间，将 `Str::ulid` 方法返回的值"伪造"可能会很有用。为此，你可以使用 `createUlidsUsing` 方法：

```php
use Symfony\Component\Uid\Ulid;

Str::createUlidsUsing(function () {
    return new Ulid('01HRDBNHHCKNW2AK4Z29SN82T9');
});
```

要指示 `ulid` 方法恢复正常生成 ULID，可以调用 `createUlidsNormally` 方法：

```php
Str::createUlidsNormally();
```

#### `Str::unwrap()` {.collection-method}

`Str::unwrap` 方法从给定字符串的开头和结尾移除指定的字符串：

```php
use Illuminate\Support\Str;

Str::unwrap('-Laravel-', '-');

// Laravel

Str::unwrap('{framework: "Laravel"}', '{', '}');

// framework: "Laravel"
```

#### `Str::uuid()` {.collection-method}

`Str::uuid` 方法生成 UUID（版本 4）：

```php
use Illuminate\Support\Str;

return (string) Str::uuid();
```

在测试期间，将 `Str::uuid` 方法返回的值"伪造"可能会很有用。为此，你可以使用 `createUuidsUsing` 方法：

```php
use Ramsey\Uuid\Uuid;

Str::createUuidsUsing(function () {
    return Uuid::fromString('eadbfeac-5258-45c2-bab7-ccb9b5ef74f9');
});
```

要指示 `uuid` 方法恢复正常生成 UUID，可以调用 `createUuidsNormally` 方法：

```php
Str::createUuidsNormally();
```

#### `Str::uuid7()` {.collection-method}

`Str::uuid7` 方法生成 UUID（版本 7）：

```php
use Illuminate\Support\Str;

return (string) Str::uuid7();
```

可以传递一个 `DateTimeInterface` 作为可选参数，用于生成按时间排序的 UUID：

```php
return (string) Str::uuid7(time: now());
```

#### `Str::wordCount()` {.collection-method}

`Str::wordCount` 方法返回字符串包含的单词数量：

```php
use Illuminate\Support\Str;

Str::wordCount('Hello, world!'); // 2
```

#### `Str::wordWrap()` {.collection-method}

`Str::wordWrap` 方法将字符串按照给定字符数换行：

```php
use Illuminate\Support\Str;

$text = "The quick brown fox jumped over the lazy dog."

Str::wordWrap($text, characters: 20, break: "<br />\n");

/*
The quick brown fox<br />
jumped over the lazy<br />
dog.
*/
```

#### `Str::words()` {.collection-method}

`Str::words` 方法限制字符串中的单词数量。可以通过第三个参数传递额外的字符串，指定在截断字符串末尾追加哪个字符串：

```php
use Illuminate\Support\Str;

return Str::words('Perfectly balanced, as all things should be.', 3, ' >>>');

// Perfectly balanced, as >>>
```

#### `Str::wrap()` {.collection-method}

`Str::wrap` 方法用额外的字符串或一对字符串包裹给定字符串：

```php
use Illuminate\Support\Str;

Str::wrap('Laravel', '"');

// "Laravel"

Str::wrap('is', before: 'This ', after: ' Laravel!');

// This is Laravel!
```

#### `str()` {.collection-method}

`str` 函数返回给定字符串的新 `Illuminate\Support\Stringable` 实例。该函数等同于 `Str::of` 方法：

```php
$string = str('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

如果没有向 `str` 函数提供参数，该函数返回 `Illuminate\Support\Str` 的实例：

```php
$snake = str()->snake('FooBar');

// 'foo_bar'
```

#### `trans()` {.collection-method}

`trans` 函数使用你的[语言文件](/docs/{{version}}/localization)翻译给定的翻译键：

```php
echo trans('messages.welcome');
```

如果指定的翻译键不存在，`trans` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans` 函数会返回 `messages.welcome`。

#### `trans_choice()` {.collection-method}

`trans_choice` 函数转换带有词形变化的给定翻译键：

```php
echo trans_choice('messages.notifications', $unreadCount);
```

如果指定的翻译键不存在，`trans_choice` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans_choice` 函数会返回 `messages.notifications`。

## 流式字符串

Fluent Strings 提供了一种更流畅、面向对象的接口来处理字符串值，让你能够使用比传统字符串操作更具可读性的语法将多个字符串操作链接在一起。

#### `after` {.collection-method}

`after` 方法返回字符串中给定值之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->after('This is');

// ' my name'
```

#### `afterLast` {.collection-method}

`afterLast` 方法返回字符串中给定值最后一次出现之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('App\Http\Controllers\Controller')->afterLast('\\');

// 'Controller'
```

#### `apa` {.collection-method}

`apa` 方法按照 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case)将给定字符串转换为标题大小写：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->apa();

// A Nice Title Uses the Correct Case
```

#### `append` {.collection-method}

`append` 方法将给定的值追加到字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

#### `ascii` {.collection-method}

`ascii` 方法会尝试将字符串音译为 ASCII 值：

```php
use Illuminate\Support\Str;

$string = Str::of('ü')->ascii();

// 'u'
```

#### `basename` {.collection-method}

`basename` 方法返回给定字符串的尾部名称部分：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->basename();

// 'baz'
```

如果需要，你可以提供一个将被从尾部部分移除的"扩展名"：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz.jpg')->basename('.jpg');

// 'baz'
```

#### `before` {.collection-method}

`before` 方法返回字符串中给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->before('my name');

// 'This is '
```

#### `beforeLast` {.collection-method}

`beforeLast` 方法返回字符串中给定值最后一次出现之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('This is my name')->beforeLast('is');

// 'This '
```

#### `between` {.collection-method}

`between` 方法返回两个值之间的字符串部分：

```php
use Illuminate\Support\Str;

$converted = Str::of('This is my name')->between('This', 'name');

// ' is my '
```

#### `betweenFirst` {.collection-method}

`betweenFirst` 方法返回两个值之间尽可能小的字符串部分：

```php
use Illuminate\Support\Str;

$converted = Str::of('[a] bc [d]')->betweenFirst('[', ']');

// 'a'
```

#### `camel` {.collection-method}

`camel` 方法将给定字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->camel();

// 'fooBar'
```

#### `charAt` {.collection-method}

`charAt` 方法返回指定索引处的字符。如果索引越界，则返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::of('This is my name.')->charAt(6);

// 's'
```

#### `classBasename` {.collection-method}

`classBasename` 方法返回去除命名空间后的给定类的类名：

```php
use Illuminate\Support\Str;

$class = Str::of('Foo\Bar\Baz')->classBasename();

// 'Baz'
```

#### `chopStart` {.collection-method}

`chopStart` 方法仅在值出现在字符串开头时移除其首次出现：

```php
use Illuminate\Support\Str;

$url = Str::of('https://laravel.com')->chopStart('https://');

// 'laravel.com'
```

你也可以传递数组。如果字符串以数组中的任意值开头，则该值会从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::of('http://laravel.com')->chopStart(['https://', 'http://']);

// 'laravel.com'
```

#### `chopEnd` {.collection-method}

`chopEnd` 方法仅在值出现在字符串结尾时移除其最后一次出现：

```php
use Illuminate\Support\Str;

$url = Str::of('https://laravel.com')->chopEnd('.com');

// 'https://laravel'
```

你也可以传递数组。如果字符串以数组中的任意值结尾，则该值会从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::of('http://laravel.com')->chopEnd(['.com', '.io']);

// 'http://laravel'
```

#### `contains` {.collection-method}

`contains` 方法判断给定字符串是否包含给定值。默认情况下，该方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::of('This is my name')->contains('my');

// true
```

你也可以传递一个值数组来判断给定字符串是否包含数组中的任意值：

```php
use Illuminate\Support\Str;

$contains = Str::of('This is my name')->contains(['my', 'foo']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$contains = Str::of('This is my name')->contains('MY', ignoreCase: true);

// true
```

#### `containsAll` {.collection-method}

`containsAll` 方法判断给定字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::of('This is my name')->containsAll(['my', 'name']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$containsAll = Str::of('This is my name')->containsAll(['MY', 'NAME'], ignoreCase: true);

// true
```

#### `decrypt` {.collection-method}

`decrypt` 方法[解密](/docs/{{version}}/encryption)加密的字符串：

```php
use Illuminate\Support\Str;

$decrypted = $encrypted->decrypt();

// 'secret'
```

`decrypt` 的逆方法，请参阅 [encrypt](#method-fluent-str-encrypt) 方法。

#### `deduplicate` {.collection-method}

`deduplicate` 方法将字符串中连续出现的某字符替换为该字符的单个实例。默认情况下，该方法去重空格：

```php
use Illuminate\Support\Str;

$result = Str::of('The   Laravel   Framework')->deduplicate();

// The Laravel Framework
```

你可以通过将另一个字符作为第二个参数传递给该方法来指定要对其去重的字符：

```php
use Illuminate\Support\Str;

$result = Str::of('The---Laravel---Framework')->deduplicate('-');

// The-Laravel-Framework
```

#### `dirname` {.collection-method}

`dirname` 方法返回给定字符串的父目录部分：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname();

// '/foo/bar'
```

如有必要，你可以指定希望从字符串中裁剪的目录层级数：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname(2);

// '/foo'
```

#### `doesntContain()` {.collection-method}

`doesntContain` 方法判断给定字符串是否不包含给定值。该方法是 [contains](#method-fluent-str-contains) 方法的逆方法。默认情况下，该方法区分大小写：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('This is name')->doesntContain('my');

// true
```

你也可以传递一个值数组来判断给定字符串是否不包含数组中的任意值：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('This is name')->doesntContain(['my', 'framework']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('This is my name')->doesntContain('MY', ignoreCase: true);

// false
```

#### `doesntEndWith` {.collection-method}

`doesntEndWith` 方法判断给定字符串是否不以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->doesntEndWith('dog');

// true
```

你也可以传递一个值数组来判断给定字符串是否不以数组中的任意值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->doesntEndWith(['this', 'foo']);

// true

$result = Str::of('This is my name')->doesntEndWith(['name', 'foo']);

// false
```

#### `doesntStartWith` {.collection-method}

`doesntStartWith` 方法判断给定字符串是否不以给定值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->doesntStartWith('That');

// true
```

你也可以传递一个值数组来判断给定字符串是否不以数组中的任意值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->doesntStartWith(['What', 'That', 'There']);

// true
```

#### `encrypt` {.collection-method}

`encrypt` 方法[加密](/docs/{{version}}/encryption)字符串：

```php
use Illuminate\Support\Str;

$encrypted = Str::of('secret')->encrypt();
```

`encrypt` 的逆方法，请参阅 [decrypt](#method-fluent-str-decrypt) 方法。

#### `endsWith` {.collection-method}

`endsWith` 方法判断给定字符串是否以给定值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->endsWith('name');

// true
```

你也可以传递一个值数组来判断给定字符串是否以数组中的任意值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->endsWith(['name', 'foo']);

// true

$result = Str::of('This is my name')->endsWith(['this', 'foo']);

// false
```

#### `exactly` {.collection-method}

`exactly` 方法判断给定字符串是否与另一个字符串完全匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel')->exactly('Laravel');

// true
```

#### `excerpt` {.collection-method}

`excerpt` 方法从字符串中提取与其中某短语首次出现相匹配的摘要：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('This is my name')->excerpt('my', [
    'radius' => 3
]);

// '...is my na...'
```

`radius` 选项默认为 `100`，允许你定义被截断字符串两侧应出现的字符数量。

此外，你可以使用 `omission` 选项更改将被前置和追加到被截断字符串上的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('This is my name')->excerpt('name', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) my name'
```

#### `explode` {.collection-method}

`explode` 方法按给定分隔符拆分字符串，并返回包含拆分后各部分的集合：

```php
use Illuminate\Support\Str;

$collection = Str::of('foo bar baz')->explode(' ');

// collect(['foo', 'bar', 'baz'])
```

#### `finish` {.collection-method}

`finish` 方法如果字符串尚未以给定值结尾，则为其添加该值的单个实例：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->finish('/');

// this/string/

$adjusted = Str::of('this/string/')->finish('/');

// this/string/
```

#### `fromBase64` {.collection-method}

`fromBase64` 方法解码给定的 Base64 字符串：

```php
use Illuminate\Support\Str;

$decoded = Str::of('TGFyYXZlbA==')->fromBase64();

// Laravel
```

#### `hash` {.collection-method}

`hash` 方法使用给定的[算法](https://www.php.net/manual/en/function.hash-algos.php)对字符串进行哈希：

```php
use Illuminate\Support\Str;

$hashed = Str::of('secret')->hash(algorithm: 'sha256');

// '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'
```

#### `headline` {.collection-method}

`headline` 方法将以大小写、连字符或下划线分隔的字符串转换为以空格分隔、每个单词首字母大写的字符串：

```php
use Illuminate\Support\Str;

$headline = Str::of('taylor_otwell')->headline();

// Taylor Otwell

$headline = Str::of('EmailNotificationSent')->headline();

// Email Notification Sent
```

#### `initials` {.collection-method}

`initials` 方法将字符串转换为其首字母缩写：

```php
use Illuminate\Support\Str;

$initials = Str::of('Taylor Otwell')->initials()->upper();

// TO
```

#### `inlineMarkdown` {.collection-method}

`inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但与 `markdown` 方法不同，它不会将所有生成的 HTML 包裹在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::of('**Laravel**')->inlineMarkdown();

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，在与原始用户输入一起使用时会产生跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或去除原始 HTML，并使用 `allow_unsafe_links` 选项指定是否允许不安全的链接。如果你需要允许一些原始 HTML，应该将已编译的 Markdown 通过 HTML Purifier 处理：

```php
use Illuminate\Support\Str;

Str::of('Inject: <script>alert("Hello XSS!");</script>')->inlineMarkdown([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// Inject: alert(&quot;Hello XSS!&quot;);
```

#### `is` {.collection-method}

`is` 方法判断给定字符串是否匹配给定模式。星号可用作通配值：

```php
use Illuminate\Support\Str;

$matches = Str::of('foobar')->is('foo*');

// true

$matches = Str::of('foobar')->is('baz*');

// false
```

#### `isAscii` {.collection-method}

`isAscii` 方法判断给定字符串是否为 ASCII 字符串：

```php
use Illuminate\Support\Str;

$result = Str::of('Taylor')->isAscii();

// true

$result = Str::of('ü')->isAscii();

// false
```

#### `isEmpty` {.collection-method}

`isEmpty` 方法判断给定字符串是否为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isEmpty();

// true

$result = Str::of('Laravel')->trim()->isEmpty();

// false
```

#### `isNotEmpty` {.collection-method}

`isNotEmpty` 方法判断给定字符串是否不为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isNotEmpty();

// false

$result = Str::of('Laravel')->trim()->isNotEmpty();

// true
```

#### `isJson` {.collection-method}

`isJson` 方法判断给定字符串是否为有效 JSON：

```php
use Illuminate\Support\Str;

$result = Str::of('[1,2,3]')->isJson();

// true

$result = Str::of('{"first": "John", "last": "Doe"}')->isJson();

// true

$result = Str::of('{first: "John", "last": "Doe"}')->isJson();

// false
```

#### `isUlid` {.collection-method}

`isUlid` 方法判断给定字符串是否为 ULID：

```php
use Illuminate\Support\Str;

$result = Str::of('01gd6r360bp37zj17nxb55yv40')->isUlid();

// true

$result = Str::of('Taylor')->isUlid();

// false
```

#### `isUrl` {.collection-method}

`isUrl` 方法判断给定字符串是否为 URL：

```php
use Illuminate\Support\Str;

$result = Str::of('http://example.com')->isUrl();

// true

$result = Str::of('Taylor')->isUrl();

// false
```

`isUrl` 方法将多种协议视为有效。不过，你可以通过向 `isUrl` 方法提供协议来指定哪些协议应被视为有效：

```php
$result = Str::of('http://example.com')->isUrl(['http', 'https']);
```

#### `isUuid` {.collection-method}

`isUuid` 方法判断给定字符串是否为 UUID：

```php
use Illuminate\Support\Str;

$result = Str::of('5ace9ab9-e9cf-4ec6-a19d-5881212a452c')->isUuid();

// true

$result = Str::of('Taylor')->isUuid();

// false
```

你还可以验证给定 UUID 是否匹配某个版本的规范（1、3、4、5、6、7 或 8）：

```php
use Illuminate\Support\Str;

$isUuid = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->isUuid(version: 4);

// true

$isUuid = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->isUuid(version: 1);

// false
```

#### `kebab` {.collection-method}

`kebab` 方法将给定字符串转换为 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->kebab();

// foo-bar
```

#### `lcfirst` {.collection-method}

`lcfirst` 方法返回首字符小写的给定字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->lcfirst();

// foo Bar
```

#### `length` {.collection-method}

`length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::of('Laravel')->length();

// 7
```

#### `limit` {.collection-method}

`limit` 方法将给定字符串截断到指定长度：

```php
use Illuminate\Support\Str;

$truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20);

// The quick brown fox...
```

你也可以传递第二个参数来更改将被追加到被截断字符串末尾的字符串：

```php
$truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20, ' (...)');

// The quick brown fox (...)
```

如果你想在截断字符串时保留完整的单词，可以使用 `preserveWords` 参数。当该参数为 `true` 时，字符串将被截断到最近的完整单词边界：

```php
$truncated = Str::of('The quick brown fox')->limit(12, preserveWords: true);

// The quick...
```

#### `lower` {.collection-method}

`lower` 方法将给定字符串转换为小写：

```php
use Illuminate\Support\Str;

$result = Str::of('LARAVEL')->lower();

// 'laravel'
```

#### `markdown` {.collection-method}

`markdown` 方法将 GitHub 风格的 Markdown 转换为 HTML：

```php
use Illuminate\Support\Str;

$html = Str::of('# Laravel')->markdown();

// <h1>Laravel</h1>

$html = Str::of('# Taylor <b>Otwell</b>')->markdown([
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，在与原始用户输入一起使用时会产生跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或去除原始 HTML，并使用 `allow_unsafe_links` 选项指定是否允许不安全的链接。如果你需要允许一些原始 HTML，应该将已编译的 Markdown 通过 HTML Purifier 处理：

```php
use Illuminate\Support\Str;

Str::of('Inject: <script>alert("Hello XSS!");</script>')->markdown([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// <p>Inject: alert(&quot;Hello XSS!&quot;);</p>
```

#### `mask` {.collection-method}

`mask` 方法使用重复字符遮盖字符串的某部分，可用于混淆电子邮件地址和电话号码等字符串片段：

```php
use Illuminate\Support\Str;

$string = Str::of('taylor@example.com')->mask('*', 3);

// tay***************
```

如果需要，你可以向 `mask` 方法提供负数作为第三个或第四个参数，这会指示该方法从字符串末尾的给定距离处开始遮盖：

```php
$string = Str::of('taylor@example.com')->mask('*', -15, 3);

// tay***@example.com

$string = Str::of('taylor@example.com')->mask('*', 4, -4);

// tayl**********.com
```

#### `match` {.collection-method}

`match` 方法返回与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->match('/bar/');

// 'bar'

$result = Str::of('foo bar')->match('/foo (.*)/');

// 'bar'
```

#### `matchAll` {.collection-method}

`matchAll` 方法返回包含与给定正则表达式模式匹配的字符串部分的集合：

```php
use Illuminate\Support\Str;

$result = Str::of('bar foo bar')->matchAll('/bar/');

// collect(['bar', 'bar'])
```

如果你在表达式中指定了匹配组，Laravel 将返回第一个匹配组的匹配项组成的集合：

```php
use Illuminate\Support\Str;

$result = Str::of('bar fun bar fly')->matchAll('/f(\w*)/');

// collect(['un', 'ly'])
```

如果未找到任何匹配项，将返回一个空集合。

#### `isMatch` {.collection-method}

`isMatch` 方法如果字符串匹配给定的正则表达式，则返回 `true`：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->isMatch('/foo (.*)/');

// true

$result = Str::of('laravel')->isMatch('/foo (.*)/');

// false
```

#### `newLine` {.collection-method}

`newLine` 方法向字符串追加一个"行尾"字符：

```php
use Illuminate\Support\Str;

$padded = Str::of('Laravel')->newLine()->append('Framework');

// 'Laravel
//  Framework'
```

#### `padBoth` {.collection-method}

`padBoth` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在两侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padBoth(10, '_');

// '__James___'

$padded = Str::of('James')->padBoth(10);

// '  James   '
```

#### `padLeft` {.collection-method}

`padLeft` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在左侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padLeft(10, '-=');

// '-=-=-James'

$padded = Str::of('James')->padLeft(10);

// '     James'
```

#### `padRight` {.collection-method}

`padRight` 方法封装 PHP 的 `str_pad` 函数，用另一个字符串在右侧填充字符串，直到最终字符串达到期望长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padRight(10, '-');

// 'James-----'

$padded = Str::of('James')->padRight(10);

// 'James     '
```

#### `pipe` {.collection-method}

`pipe` 方法通过将字符串的当前值传递给给定的可调用对象来转换字符串：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$hash = Str::of('Laravel')->pipe('md5')->prepend('Checksum: ');

// 'Checksum: a5c95b86291ea299fcbe64458ed12702'

$closure = Str::of('foo')->pipe(function (Stringable $str) {
    return 'bar';
});

// 'bar'
```

#### `counted` {.collection-method}

`counted` 方法根据给定数量将单数单词字符串转换为单数或复数形式，并用格式化后的数量作为前缀：

```php
use Illuminate\Support\Str;

$label = Str::of('order')->counted(1);

// 1 order

$label = Str::of('order')->counted(1000);

// 1,000 orders
```

#### `plural` {.collection-method}

`plural` 方法将单数单词字符串转换为复数形式。该函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::of('car')->plural();

// cars

$plural = Str::of('child')->plural();

// children
```

你可以将整数参数传递给该函数，以检索字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::of('child')->plural(2);

// children

$plural = Str::of('child')->plural(1);

// child
```

你可以提供 `prependCount` 参数，用格式化后的 `$count` 作为复数化字符串的前缀：

```php
use Illuminate\Support\Str;

$label = Str::of('car')->plural(1000, prependCount: true);

// 1,000 cars
```

#### `position` {.collection-method}

`position` 方法返回子字符串在字符串中首次出现的位置。如果子字符串不存在于字符串中，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::of('Hello, World!')->position('Hello');

// 0

$position = Str::of('Hello, World!')->position('W');

// 7
```

#### `prepend` {.collection-method}

`prepend` 方法将给定的值前置到字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Framework')->prepend('Laravel ');

// Laravel Framework
```

#### `remove` {.collection-method}

`remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = Str::of('Arkansas is quite beautiful!')->remove('quite ');

// Arkansas is beautiful!
```

你也可以将 `false` 作为第二个参数传递，以在移除字符串时忽略大小写。

#### `repeat` {.collection-method}

`repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$repeated = Str::of('a')->repeat(5);

// aaaaa
```

#### `replace` {.collection-method}

`replace` 方法替换字符串中的给定字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Laravel 6.x')->replace('6.x', '7.x');

// Laravel 7.x
```

`replace` 方法还接受 `caseSensitive` 参数。默认情况下，`replace` 方法区分大小写：

```php
use Illuminate\Support\Str;

$replaced = Str::of('macOS 13.x')->replace(
    'macOS', 'iOS', caseSensitive: false
);
```

#### `replaceArray` {.collection-method}

`replaceArray` 方法使用数组按顺序替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = 'The event will take place between ? and ?';

$replaced = Str::of($string)->replaceArray('?', ['8:30', '9:00']);

// The event will take place between 8:30 and 9:00
```

#### `replaceFirst` {.collection-method}

`replaceFirst` 方法替换字符串中给定值的首次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceFirst('the', 'a');

// a quick brown fox jumps over the lazy dog
```

#### `replaceLast` {.collection-method}

`replaceLast` 方法替换字符串中给定值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceLast('the', 'a');

// the quick brown fox jumps over a lazy dog
```

#### `replaceMatches` {.collection-method}

`replaceMatches` 方法将匹配模式的字符串所有部分替换为给定的替换字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::of('(+1) 501-555-1000')->replaceMatches('/[^A-Za-z0-9]++/', '')

// '15015551000'
```

`replaceMatches` 方法还接受一个闭包，该闭包将针对匹配给定模式的字符串的每个部分被调用，让你可以执行替换逻辑并返回替换后的值：

```php
use Illuminate\Support\Str;

$replaced = Str::of('123')->replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
});

// '[1][2][3]'
```

#### `replaceStart` {.collection-method}

`replaceStart` 方法仅在值出现在字符串开头时替换其首次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceStart('Hello', 'Laravel');

// Laravel World

$replaced = Str::of('Hello World')->replaceStart('World', 'Laravel');

// Hello World
```

#### `replaceEnd` {.collection-method}

`replaceEnd` 方法仅在值出现在字符串结尾时替换其最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceEnd('World', 'Laravel');

// Hello Laravel

$replaced = Str::of('Hello World')->replaceEnd('Hello', 'Laravel');

// Hello World
```

#### `scan` {.collection-method}

`scan` 方法根据 [`sscanf` PHP 函数](https://www.php.net/manual/en/function.sscanf.php)支持的格式，将输入从字符串解析为集合：

```php
use Illuminate\Support\Str;

$collection = Str::of('filename.jpg')->scan('%[^.].%s');

// collect(['filename', 'jpg'])
```

#### `singular` {.collection-method}

`singular` 方法将字符串转换为单数形式。该函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::of('cars')->singular();

// car

$singular = Str::of('children')->singular();

// child
```

#### `slug` {.collection-method}

`slug` 方法从给定字符串生成对 URL 友好的"slug"：

```php
use Illuminate\Support\Str;

$slug = Str::of('Laravel Framework')->slug('-');

// laravel-framework
```

#### `snake` {.collection-method}

`snake` 方法将给定字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->snake();

// foo_bar
```

#### `split` {.collection-method}

`split` 方法使用正则表达式将字符串拆分为集合：

```php
use Illuminate\Support\Str;

$segments = Str::of('one, two, three')->split('/[\s,]+/');

// collect(["one", "two", "three"])
```

#### `squish` {.collection-method}

`squish` 方法移除字符串中所有多余的空白，包括单词之间多余的空白：

```php
use Illuminate\Support\Str;

$string = Str::of('    laravel    framework    ')->squish();

// laravel framework
```

#### `start` {.collection-method}

`start` 方法如果字符串尚未以给定值开头，则为其添加该值的单个实例：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->start('/');

// /this/string

$adjusted = Str::of('/this/string')->start('/');

// /this/string
```

#### `startsWith` {.collection-method}

`startsWith` 方法判断给定字符串是否以给定值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->startsWith('This');

// true
```

你也可以传递一个值数组来判断给定字符串是否以数组中的任意值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('This is my name')->startsWith(['This', 'That']);

// true
```

#### `stripTags` {.collection-method}

`stripTags` 方法移除字符串中的所有 HTML 和 PHP 标签：

```php
use Illuminate\Support\Str;

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags();

// Taylor Otwell

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags('<b>');

// Taylor <b>Otwell</b>
```

#### `studly` {.collection-method}

`studly` 方法将给定字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->studly();

// FooBar
```

#### `substr` {.collection-method}

`substr` 方法返回由给定起始和长度参数指定的字符串部分：

```php
use Illuminate\Support\Str;

$string = Str::of('Laravel Framework')->substr(8);

// Framework

$string = Str::of('Laravel Framework')->substr(8, 5);

// Frame
```

#### `substrReplace` {.collection-method}

`substrReplace` 方法替换字符串某部分中的文本，从第二个参数指定的位置开始，替换第三个参数指定的字符数。向方法第三个参数传递 `0` 会在指定位置插入字符串而不替换字符串中的任何现有字符：

```php
use Illuminate\Support\Str;

$string = Str::of('1300')->substrReplace(':', 2);

// 13:

$string = Str::of('The Framework')->substrReplace(' Laravel', 3, 0);

// The Laravel Framework
```

#### `swap` {.collection-method}

`swap` 方法使用 PHP 的 `strtr` 函数替换字符串中的多个值：

```php
use Illuminate\Support\Str;

$string = Str::of('Tacos are great!')
    ->swap([
        'Tacos' => 'Burritos',
        'great' => 'fantastic',
    ]);

// Burritos are fantastic!
```

#### `take` {.collection-method}

`take` 方法返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::of('Build something amazing!')->take(5);

// Build
```

#### `tap` {.collection-method}

`tap` 方法将字符串传递给给定的闭包，让你可以在不影响字符串本身的情况下检查和与之交互。无论闭包返回什么，`tap` 方法都返回原始字符串：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Laravel')
    ->append(' Framework')
    ->tap(function (Stringable $string) {
        dump('String after append: '.$string);
    })
    ->upper();

// LARAVEL FRAMEWORK
```

#### `test` {.collection-method}

`test` 方法判断字符串是否匹配给定的正则表达式模式：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel Framework')->test('/Laravel/');

// true
```

#### `title` {.collection-method}

`title` 方法将给定字符串转换为 `Title Case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->title();

// A Nice Title Uses The Correct Case
```

#### `toBase64` {.collection-method}

`toBase64` 方法将给定字符串转换为 Base64：

```php
use Illuminate\Support\Str;

$base64 = Str::of('Laravel')->toBase64();

// TGFyYXZlbA==
```

#### `toHtmlString` {.collection-method}

`toHtmlString` 方法将给定字符串转换为 `Illuminate\Support\HtmlString` 实例，该实例在 Blade 模板中渲染时不会被转义：

```php
use Illuminate\Support\Str;

$htmlString = Str::of('Nuno Maduro')->toHtmlString();
```

#### `toUri` {.collection-method}

`toUri` 方法将给定字符串转换为 [Illuminate\Support\Uri](/docs/{{version}}/helpers#uri) 实例：

```php
use Illuminate\Support\Str;

$uri = Str::of('https://example.com')->toUri();
```

#### `transliterate` {.collection-method}

`transliterate` 方法会尝试将给定字符串转换为其最接近的 ASCII 表示：

```php
use Illuminate\Support\Str;

$email = Str::of('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ')->transliterate()

// 'test@laravel.com'
```

#### `trim` {.collection-method}

`trim` 方法去除给定字符串。与 PHP 原生的 `trim` 函数不同，Laravel 的 `trim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->trim();

// 'Laravel'

$string = Str::of('/Laravel/')->trim('/');

// 'Laravel'
```

#### `ltrim` {.collection-method}

`ltrim` 方法去除字符串的左侧。与 PHP 原生的 `ltrim` 函数不同，Laravel 的 `ltrim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->ltrim();

// 'Laravel  '

$string = Str::of('/Laravel/')->ltrim('/');

// 'Laravel/'
```

#### `rtrim` {.collection-method}

`rtrim` 方法去除给定字符串的右侧。与 PHP 原生的 `rtrim` 函数不同，Laravel 的 `rtrim` 方法还会移除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->rtrim();

// '  Laravel'

$string = Str::of('/Laravel/')->rtrim('/');

// '/Laravel'
```

#### `ucfirst` {.collection-method}

`ucfirst` 方法返回首字符大写的给定字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('foo bar')->ucfirst();

// Foo bar
```

#### `ucsplit` {.collection-method}

`ucsplit` 方法按大写字符将给定字符串拆分为集合：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->ucsplit();

// collect(['Foo ', 'Bar'])
```

#### `ucwords` {.collection-method}

`ucwords` 方法将给定字符串中每个单词的首字符转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::of('laravel framework')->ucwords();

// Laravel Framework
```

#### `unwrap` {.collection-method}

`unwrap` 方法从给定字符串的开头和结尾移除指定的字符串：

```php
use Illuminate\Support\Str;

Str::of('-Laravel-')->unwrap('-');

// Laravel

Str::of('{framework: "Laravel"}')->unwrap('{', '}');

// framework: "Laravel"
```

#### `upper` {.collection-method}

`upper` 方法将给定字符串转换为大写：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('laravel')->upper();

// LARAVEL
```

#### `when` {.collection-method}

`when` 方法如果给定条件为 `true`，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Taylor')
    ->when(true, function (Stringable $string) {
        return $string->append(' Otwell');
    });

// 'Taylor Otwell'
```

如有必要，你可以将另一个闭包作为第三个参数传递给 `when` 方法。该闭包将在条件参数求值为 `false` 时执行。

#### `whenContains` {.collection-method}

`whenContains` 方法如果字符串包含给定值，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContains('tony', function (Stringable $string) {
        return $string->title();
    });

// 'Tony Stark'
```

如有必要，你可以将另一个闭包作为第三个参数传递。该闭包将在字符串不包含给定值时被调用。

你也可以传递一个值数组来判断给定字符串是否包含数组中的任意值：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContains(['tony', 'hulk'], function (Stringable $string) {
        return $string->title();
    });

// Tony Stark
```

#### `whenContainsAll` {.collection-method}

`whenContainsAll` 方法如果字符串包含所有给定的子字符串，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContainsAll(['tony', 'stark'], function (Stringable $string) {
        return $string->title();
    });

// 'Tony Stark'
```

如有必要，你可以将另一个闭包作为第三个参数传递。该闭包将在条件参数求值为 `false` 时执行。

#### `whenDoesntEndWith` {.collection-method}

`whenDoesntEndWith` 方法如果字符串不以给定子字符串结尾，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenDoesntEndWith('land', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenDoesntStartWith` {.collection-method}

`whenDoesntStartWith` 方法如果字符串不以给定子字符串开头，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenDoesntStartWith('sea', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenEmpty` {.collection-method}

`whenEmpty` 方法如果字符串为空，则调用给定的闭包。如果闭包返回值，该值也会由 `whenEmpty` 方法返回。如果闭包不返回值，则返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('  ')->trim()->whenEmpty(function (Stringable $string) {
    return $string->prepend('Laravel');
});

// 'Laravel'
```

#### `whenNotEmpty` {.collection-method}

`whenNotEmpty` 方法如果字符串不为空，则调用给定的闭包。如果闭包返回值，该值也会由 `whenNotEmpty` 方法返回。如果闭包不返回值，则返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Framework')->whenNotEmpty(function (Stringable $string) {
    return $string->prepend('Laravel ');
});

// 'Laravel Framework'
```

#### `whenStartsWith` {.collection-method}

`whenStartsWith` 方法如果字符串以给定子字符串开头，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenStartsWith('disney', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenEndsWith` {.collection-method}

`whenEndsWith` 方法如果字符串以给定子字符串结尾，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenEndsWith('world', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

#### `whenExactly` {.collection-method}

`whenExactly` 方法如果字符串与给定字符串完全匹配，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

#### `whenNotExactly` {.collection-method}

`whenNotExactly` 方法如果字符串与给定字符串不完全匹配，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('framework')->whenNotExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Framework'
```

#### `whenIs` {.collection-method}

`whenIs` 方法如果字符串匹配给定模式，则调用给定的闭包。星号可用作通配值。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('foo/bar')->whenIs('foo/*', function (Stringable $string) {
    return $string->append('/baz');
});

// 'foo/bar/baz'
```

#### `whenIsAscii` {.collection-method}

`whenIsAscii` 方法如果字符串为 7 位 ASCII，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenIsAscii(function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

#### `whenIsUlid` {.collection-method}

`whenIsUlid` 方法如果字符串为有效 ULID，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;

$string = Str::of('01gd6r360bp37zj17nxb55yv40')->whenIsUlid(function (Stringable $string) {
    return $string->substr(0, 8);
});

// '01gd6r36'
```

#### `whenIsUuid` {.collection-method}

`whenIsUuid` 方法如果字符串为有效 UUID，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->whenIsUuid(function (Stringable $string) {
    return $string->substr(0, 8);
});

// 'a0a2a2d2'
```

#### `whenTest` {.collection-method}

`whenTest` 方法如果字符串匹配给定的正则表达式，则调用给定的闭包。该闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel framework')->whenTest('/laravel/', function (Stringable $string) {
    return $string->title();
});

// 'Laravel Framework'
```

#### `wordCount` {.collection-method}

`wordCount` 方法返回字符串包含的单词数量：

```php
use Illuminate\Support\Str;

Str::of('Hello, world!')->wordCount(); // 2
```

#### `words` {.collection-method}

`words` 方法限制字符串中的单词数量。如有必要，你可以指定一个将被追加到被截断字符串上的额外字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Perfectly balanced, as all things should be.')->words(3, ' >>>');

// Perfectly balanced, as >>>
```

#### `wrap` {.collection-method}

`wrap` 方法用额外的字符串或一对字符串包裹给定字符串：

```php
use Illuminate\Support\Str;

Str::of('Laravel')->wrap('"');

// "Laravel"

Str::is('is')->wrap(before: 'This ', after: ' Laravel!');

// This is Laravel!
```
