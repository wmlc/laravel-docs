# 辅助函数

- [简介](#introduction)
- [可用方法](#available-methods)
- [其他工具](#other-utilities)
    - [基准测试](#benchmarking)
    - [Lottery](#lottery)

<a name="introduction"></a>
## 简介

Laravel 包含各种全局「辅助」PHP 函数。其中许多函数被框架自身使用；不过，如果你觉得方便，也可以在自己的应用中自由使用它们。

<a name="available-methods"></a>
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

<a name="arrays-and-objects-method-list"></a>
### 数组与对象

[Arr::accessible](#method-array-accessible)
[Arr::add](#method-array-add)
[Arr::collapse](#method-array-collapse)
[Arr::crossJoin](#method-array-crossjoin)
[Arr::divide](#method-array-divide)
[Arr::dot](#method-array-dot)
[Arr::except](#method-array-except)
[Arr::exists](#method-array-exists)
[Arr::first](#method-array-first)
[Arr::flatten](#method-array-flatten)
[Arr::forget](#method-array-forget)
[Arr::get](#method-array-get)
[Arr::has](#method-array-has)
[Arr::hasAny](#method-array-hasany)
[Arr::isAssoc](#method-array-isassoc)
[Arr::isList](#method-array-islist)
[Arr::join](#method-array-join)
[Arr::keyBy](#method-array-keyby)
[Arr::last](#method-array-last)
[Arr::map](#method-array-map)
[Arr::only](#method-array-only)
[Arr::pluck](#method-array-pluck)
[Arr::prepend](#method-array-prepend)
[Arr::prependKeysWith](#method-array-prependkeyswith)
[Arr::pull](#method-array-pull)
[Arr::query](#method-array-query)
[Arr::random](#method-array-random)
[Arr::set](#method-array-set)
[Arr::shuffle](#method-array-shuffle)
[Arr::sort](#method-array-sort)
[Arr::sortDesc](#method-array-sort-desc)
[Arr::sortRecursive](#method-array-sort-recursive)
[Arr::toCssClasses](#method-array-to-css-classes)
[Arr::undot](#method-array-undot)
[Arr::where](#method-array-where)
[Arr::whereNotNull](#method-array-where-not-null)
[Arr::wrap](#method-array-wrap)
[data_fill](#method-data-fill)
[data_get](#method-data-get)
[data_set](#method-data-set)
[head](#method-head)
[last](#method-last)

<a name="paths-method-list"></a>
### 路径

[app_path](#method-app-path)
[base_path](#method-base-path)
[config_path](#method-config-path)
[database_path](#method-database-path)
[lang_path](#method-lang-path)
[mix](#method-mix)
[public_path](#method-public-path)
[resource_path](#method-resource-path)
[storage_path](#method-storage-path)

<a name="strings-method-list"></a>
### 字符串

[\__](#method-__)
[class_basename](#method-class-basename)
[e](#method-e)
[preg_replace_array](#method-preg-replace-array)
[Str::after](#method-str-after)
[Str::afterLast](#method-str-after-last)
[Str::ascii](#method-str-ascii)
[Str::before](#method-str-before)
[Str::beforeLast](#method-str-before-last)
[Str::between](#method-str-between)
[Str::betweenFirst](#method-str-between-first)
[Str::camel](#method-camel-case)
[Str::contains](#method-str-contains)
[Str::containsAll](#method-str-contains-all)
[Str::endsWith](#method-ends-with)
[Str::excerpt](#method-excerpt)
[Str::finish](#method-str-finish)
[Str::headline](#method-str-headline)
[Str::inlineMarkdown](#method-str-inline-markdown)
[Str::is](#method-str-is)
[Str::isAscii](#method-str-is-ascii)
[Str::isJson](#method-str-is-json)
[Str::isUlid](#method-str-is-ulid)
[Str::isUuid](#method-str-is-uuid)
[Str::kebab](#method-kebab-case)
[Str::lcfirst](#method-str-lcfirst)
[Str::length](#method-str-length)
[Str::limit](#method-str-limit)
[Str::lower](#method-str-lower)
[Str::markdown](#method-str-markdown)
[Str::mask](#method-str-mask)
[Str::orderedUuid](#method-str-ordered-uuid)
[Str::padBoth](#method-str-padboth)
[Str::padLeft](#method-str-padleft)
[Str::padRight](#method-str-padright)
[Str::plural](#method-str-plural)
[Str::pluralStudly](#method-str-plural-studly)
[Str::random](#method-str-random)
[Str::remove](#method-str-remove)
[Str::replace](#method-str-replace)
[Str::replaceArray](#method-str-replace-array)
[Str::replaceFirst](#method-str-replace-first)
[Str::replaceLast](#method-str-replace-last)
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
[Str::title](#method-title-case)
[Str::toHtmlString](#method-str-to-html-string)
[Str::ucfirst](#method-str-ucfirst)
[Str::ucsplit](#method-str-ucsplit)
[Str::upper](#method-str-upper)
[Str::ulid](#method-str-ulid)
[Str::uuid](#method-str-uuid)
[Str::wordCount](#method-str-word-count)
[Str::words](#method-str-words)
[str](#method-str)
[trans](#method-trans)
[trans_choice](#method-trans-choice)

<a name="fluent-strings-method-list"></a>
### 流式字符串

[after](#method-fluent-str-after)
[afterLast](#method-fluent-str-after-last)
[append](#method-fluent-str-append)
[ascii](#method-fluent-str-ascii)
[basename](#method-fluent-str-basename)
[before](#method-fluent-str-before)
[beforeLast](#method-fluent-str-before-last)
[between](#method-fluent-str-between)
[betweenFirst](#method-fluent-str-between-first)
[camel](#method-fluent-str-camel)
[classBasename](#method-fluent-str-class-basename)
[contains](#method-fluent-str-contains)
[containsAll](#method-fluent-str-contains-all)
[dirname](#method-fluent-str-dirname)
[endsWith](#method-fluent-str-ends-with)
[excerpt](#method-fluent-str-excerpt)
[exactly](#method-fluent-str-exactly)
[explode](#method-fluent-str-explode)
[finish](#method-fluent-str-finish)
[headline](#method-fluent-str-headline)
[inlineMarkdown](#method-fluent-str-inline-markdown)
[is](#method-fluent-str-is)
[isAscii](#method-fluent-str-is-ascii)
[isEmpty](#method-fluent-str-is-empty)
[isNotEmpty](#method-fluent-str-is-not-empty)
[isJson](#method-fluent-str-is-json)
[isUlid](#method-fluent-str-is-ulid)
[isUuid](#method-fluent-str-is-uuid)
[kebab](#method-fluent-str-kebab)
[lcfirst](#method-fluent-str-lcfirst)
[length](#method-fluent-str-length)
[limit](#method-fluent-str-limit)
[lower](#method-fluent-str-lower)
[ltrim](#method-fluent-str-ltrim)
[markdown](#method-fluent-str-markdown)
[mask](#method-fluent-str-mask)
[match](#method-fluent-str-match)
[matchAll](#method-fluent-str-match-all)
[newLine](#method-fluent-str-new-line)
[padBoth](#method-fluent-str-padboth)
[padLeft](#method-fluent-str-padleft)
[padRight](#method-fluent-str-padright)
[pipe](#method-fluent-str-pipe)
[plural](#method-fluent-str-plural)
[prepend](#method-fluent-str-prepend)
[remove](#method-fluent-str-remove)
[replace](#method-fluent-str-replace)
[replaceArray](#method-fluent-str-replace-array)
[replaceFirst](#method-fluent-str-replace-first)
[replaceLast](#method-fluent-str-replace-last)
[replaceMatches](#method-fluent-str-replace-matches)
[rtrim](#method-fluent-str-rtrim)
[scan](#method-fluent-str-scan)
[singular](#method-fluent-str-singular)
[slug](#method-fluent-str-slug)
[snake](#method-fluent-str-snake)
[split](#method-fluent-str-split)
[squish](#method-fluent-str-squish)
[start](#method-fluent-str-start)
[startsWith](#method-fluent-str-starts-with)
[studly](#method-fluent-str-studly)
[substr](#method-fluent-str-substr)
[substrReplace](#method-fluent-str-substrreplace)
[swap](#method-fluent-str-swap)
[tap](#method-fluent-str-tap)
[test](#method-fluent-str-test)
[title](#method-fluent-str-title)
[trim](#method-fluent-str-trim)
[ucfirst](#method-fluent-str-ucfirst)
[ucsplit](#method-fluent-str-ucsplit)
[upper](#method-fluent-str-upper)
[when](#method-fluent-str-when)
[whenContains](#method-fluent-str-when-contains)
[whenContainsAll](#method-fluent-str-when-contains-all)
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

<a name="urls-method-list"></a>
### URL

[action](#method-action)
[asset](#method-asset)
[route](#method-route)
[secure_asset](#method-secure-asset)
[secure_url](#method-secure-url)
[to_route](#method-to-route)
[url](#method-url)

<a name="miscellaneous-method-list"></a>
### 杂项

[abort](#method-abort)
[abort_if](#method-abort-if)
[abort_unless](#method-abort-unless)
[app](#method-app)
[auth](#method-auth)
[back](#method-back)
[bcrypt](#method-bcrypt)
[blank](#method-blank)
[broadcast](#method-broadcast)
[cache](#method-cache)
[class_uses_recursive](#method-class-uses-recursive)
[collect](#method-collect)
[config](#method-config)
[cookie](#method-cookie)
[csrf_field](#method-csrf-field)
[csrf_token](#method-csrf-token)
[decrypt](#method-decrypt)
[dd](#method-dd)
[dispatch](#method-dispatch)
[dump](#method-dump)
[encrypt](#method-encrypt)
[env](#method-env)
[event](#method-event)
[fake](#method-fake)
[filled](#method-filled)
[info](#method-info)
[logger](#method-logger)
[method_field](#method-method-field)
[now](#method-now)
[old](#method-old)
[optional](#method-optional)
[policy](#method-policy)
[redirect](#method-redirect)
[report](#method-report)
[report_if](#method-report-if)
[report_unless](#method-report-unless)
[request](#method-request)
[rescue](#method-rescue)
[resolve](#method-resolve)
[response](#method-response)
[retry](#method-retry)
[session](#method-session)
[tap](#method-tap)
[throw_if](#method-throw-if)
[throw_unless](#method-throw-unless)
[today](#method-today)
[trait_uses_recursive](#method-trait-uses-recursive)
[transform](#method-transform)
[validator](#method-validator)
[value](#method-value)
[view](#method-view)
[with](#method-with)

<a name="method-listing"></a>
## 方法列表

<style>
    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

<a name="arrays"></a>
## 数组与对象

<a name="method-array-accessible"></a>
#### `Arr::accessible()` {.collection-method .first-collection-method}

`Arr::accessible` 方法判断给定值是否可按数组方式访问：

    use Illuminate\Support\Arr;
    use Illuminate\Support\Collection;

    $isAccessible = Arr::accessible(['a' => 1, 'b' => 2]);

    // true

    $isAccessible = Arr::accessible(new Collection);

    // true

    $isAccessible = Arr::accessible('abc');

    // false

    $isAccessible = Arr::accessible(new stdClass);

    // false

<a name="method-array-add"></a>
#### `Arr::add()` {.collection-method}

`Arr::add` 方法在给定键不存在于数组中或其值为 `null` 时，向数组添加给定的键值对：

    use Illuminate\Support\Arr;

    $array = Arr::add(['name' => 'Desk'], 'price', 100);

    // ['name' => 'Desk', 'price' => 100]

    $array = Arr::add(['name' => 'Desk', 'price' => null], 'price', 100);

    // ['name' => 'Desk', 'price' => 100]


<a name="method-array-collapse"></a>
#### `Arr::collapse()` {.collection-method}

`Arr::collapse` 方法将数组的数组合并为单个数组：

    use Illuminate\Support\Arr;

    $array = Arr::collapse([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);

    // [1, 2, 3, 4, 5, 6, 7, 8, 9]

<a name="method-array-crossjoin"></a>
#### `Arr::crossJoin()` {.collection-method}

`Arr::crossJoin` 方法对给定数组进行交叉连接，返回包含所有可能排列的笛卡尔积：

    use Illuminate\Support\Arr;

    $matrix = Arr::crossJoin([1, 2], ['a', 'b']);

    /*
        [
            [1, 'a'],
            [1, 'b'],
            [2, 'a'],
            [2, 'b'],
        ]
    */

    $matrix = Arr::crossJoin([1, 2], ['a', 'b'], ['I', 'II']);

    /*
        [
            [1, 'a', 'I'],
            [1, 'a', 'II'],
            [1, 'b', 'I'],
            [1, 'b', 'II'],
            [2, 'a', 'I'],
            [2, 'a', 'II'],
            [2, 'b', 'I'],
            [2, 'b', 'II'],
        ]
    */

<a name="method-array-divide"></a>
#### `Arr::divide()` {.collection-method}

`Arr::divide` 方法返回两个数组：一个包含给定数组的键，另一个包含其值：

    use Illuminate\Support\Arr;

    [$keys, $values] = Arr::divide(['name' => 'Desk']);

    // $keys: ['name']

    // $values: ['Desk']

<a name="method-array-dot"></a>
#### `Arr::dot()` {.collection-method}

`Arr::dot` 方法将多维数组扁平化为单层数组，使用「点」表示法标识深度：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    $flattened = Arr::dot($array);

    // ['products.desk.price' => 100]

<a name="method-array-except"></a>
#### `Arr::except()` {.collection-method}

`Arr::except` 方法从数组中移除给定的键值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100];

    $filtered = Arr::except($array, ['price']);

    // ['name' => 'Desk']

<a name="method-array-exists"></a>
#### `Arr::exists()` {.collection-method}

`Arr::exists` 方法检查给定键是否存在于提供的数组中：

    use Illuminate\Support\Arr;

    $array = ['name' => 'John Doe', 'age' => 17];

    $exists = Arr::exists($array, 'name');

    // true

    $exists = Arr::exists($array, 'salary');

    // false

<a name="method-array-first"></a>
#### `Arr::first()` {.collection-method}

`Arr::first` 方法返回数组中第一个通过给定真值测试的元素：

    use Illuminate\Support\Arr;

    $array = [100, 200, 300];

    $first = Arr::first($array, function ($value, $key) {
        return $value >= 150;
    });

    // 200

也可向该方法传入默认值作为第三个参数。如果没有值通过真值测试，将返回该默认值：

    use Illuminate\Support\Arr;

    $first = Arr::first($array, $callback, $default);

<a name="method-array-flatten"></a>
#### `Arr::flatten()` {.collection-method}

`Arr::flatten` 方法将多维数组扁平化为单层数组：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

    $flattened = Arr::flatten($array);

    // ['Joe', 'PHP', 'Ruby']

<a name="method-array-forget"></a>
#### `Arr::forget()` {.collection-method}

`Arr::forget` 方法使用「点」表示法从深层嵌套数组中移除给定的键值对：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    Arr::forget($array, 'products.desk');

    // ['products' => []]

<a name="method-array-get"></a>
#### `Arr::get()` {.collection-method}

`Arr::get` 方法使用「点」表示法从深层嵌套数组中获取值：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    $price = Arr::get($array, 'products.desk.price');

    // 100

`Arr::get` 方法还接受一个默认值，如果指定键不存在于数组中，将返回该默认值：

    use Illuminate\Support\Arr;

    $discount = Arr::get($array, 'products.desk.discount', 0);

    // 0

<a name="method-array-has"></a>
#### `Arr::has()` {.collection-method}

`Arr::has` 方法使用「点」表示法检查给定项或多项是否存在于数组中：

    use Illuminate\Support\Arr;

    $array = ['product' => ['name' => 'Desk', 'price' => 100]];

    $contains = Arr::has($array, 'product.name');

    // true

    $contains = Arr::has($array, ['product.price', 'product.discount']);

    // false

<a name="method-array-hasany"></a>
#### `Arr::hasAny()` {.collection-method}

`Arr::hasAny` 方法使用「点」表示法检查给定集合中是否有任何项存在于数组中：

    use Illuminate\Support\Arr;

    $array = ['product' => ['name' => 'Desk', 'price' => 100]];

    $contains = Arr::hasAny($array, 'product.name');

    // true

    $contains = Arr::hasAny($array, ['product.name', 'product.discount']);

    // true

    $contains = Arr::hasAny($array, ['category', 'product.discount']);

    // false

<a name="method-array-isassoc"></a>
#### `Arr::isAssoc()` {.collection-method}

`Arr::isAssoc` 方法在给定数组为关联数组时返回 `true`。如果数组的键不是从零开始的连续数字键，则视为「关联」数组：

    use Illuminate\Support\Arr;

    $isAssoc = Arr::isAssoc(['product' => ['name' => 'Desk', 'price' => 100]]);

    // true

    $isAssoc = Arr::isAssoc([1, 2, 3]);

    // false

<a name="method-array-islist"></a>
#### `Arr::isList()` {.collection-method}

`Arr::isList` 方法在给定数组的键为从零开始的连续整数时返回 `true`：

    use Illuminate\Support\Arr;

    $isList = Arr::isList(['foo', 'bar', 'baz']);

    // true

    $isList = Arr::isList(['product' => ['name' => 'Desk', 'price' => 100]]);

    // false

<a name="method-array-join"></a>
#### `Arr::join()` {.collection-method}

`Arr::join` 方法使用字符串连接数组元素。通过该方法的第二个参数，你还可以为数组的最后一个元素指定连接字符串：

    use Illuminate\Support\Arr;

    $array = ['Tailwind', 'Alpine', 'Laravel', 'Livewire'];

    $joined = Arr::join($array, ', ');

    // Tailwind, Alpine, Laravel, Livewire

    $joined = Arr::join($array, ', ', ' and ');

    // Tailwind, Alpine, Laravel and Livewire

<a name="method-array-keyby"></a>
#### `Arr::keyBy()` {.collection-method}

`Arr::keyBy` 方法按给定键对数组进行键索引。如果多个项具有相同的键，新数组中只保留最后一个：

    use Illuminate\Support\Arr;

    $array = [
        ['product_id' => 'prod-100', 'name' => 'Desk'],
        ['product_id' => 'prod-200', 'name' => 'Chair'],
    ];

    $keyed = Arr::keyBy($array, 'product_id');

    /*
        [
            'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
            'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
        ]
    */

<a name="method-array-last"></a>
#### `Arr::last()` {.collection-method}

`Arr::last` 方法返回数组中最后一个通过给定真值测试的元素：

    use Illuminate\Support\Arr;

    $array = [100, 200, 300, 110];

    $last = Arr::last($array, function ($value, $key) {
        return $value >= 150;
    });

    // 300

也可向该方法传入默认值作为第三个参数。如果没有值通过真值测试，将返回该默认值：

    use Illuminate\Support\Arr;

    $last = Arr::last($array, $callback, $default);

<a name="method-array-map"></a>
#### `Arr::map()` {.collection-method}

`Arr::map` 方法遍历数组，将每个值和键传递给给定的回调函数。数组的值将被回调函数返回的值替换：

    use Illuminate\Support\Arr;

    $array = ['first' => 'james', 'last' => 'kirk'];

    $mapped = Arr::map($array, function ($value, $key) {
        return ucfirst($value);
    });

    // ['first' => 'James', 'last' => 'Kirk']

<a name="method-array-only"></a>
#### `Arr::only()` {.collection-method}

`Arr::only` 方法从给定数组中仅返回指定的键值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100, 'orders' => 10];

    $slice = Arr::only($array, ['name', 'price']);

    // ['name' => 'Desk', 'price' => 100]

<a name="method-array-pluck"></a>
#### `Arr::pluck()` {.collection-method}

`Arr::pluck` 方法从数组中获取给定键的所有值：

    use Illuminate\Support\Arr;

    $array = [
        ['developer' => ['id' => 1, 'name' => 'Taylor']],
        ['developer' => ['id' => 2, 'name' => 'Abigail']],
    ];

    $names = Arr::pluck($array, 'developer.name');

    // ['Taylor', 'Abigail']

你还可以指定结果列表的键名方式：

    use Illuminate\Support\Arr;

    $names = Arr::pluck($array, 'developer.name', 'developer.id');

    // [1 => 'Taylor', 2 => 'Abigail']

<a name="method-array-prepend"></a>
#### `Arr::prepend()` {.collection-method}

`Arr::prepend` 方法将一个项推到数组的开头：

    use Illuminate\Support\Arr;

    $array = ['one', 'two', 'three', 'four'];

    $array = Arr::prepend($array, 'zero');

    // ['zero', 'one', 'two', 'three', 'four']

如有需要，你可以指定用于该值的键：

    use Illuminate\Support\Arr;

    $array = ['price' => 100];

    $array = Arr::prepend($array, 'Desk', 'name');

    // ['name' => 'Desk', 'price' => 100]

<a name="method-array-prependkeyswith"></a>
#### `Arr::prependKeysWith()` {.collection-method}

`Arr::prependKeysWith` 方法用给定前缀为关联数组的所有键名添加前缀：

    use Illuminate\Support\Arr;

    $array = [
        'name' => 'Desk',
        'price' => 100,
    ];

    $keyed = Arr::prependKeysWith($array, 'product.');

    /*
        [
            'product.name' => 'Desk',
            'product.price' => 100,
        ]
    */

<a name="method-array-pull"></a>
#### `Arr::pull()` {.collection-method}

`Arr::pull` 方法返回并移除数组中的键值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100];

    $name = Arr::pull($array, 'name');

    // $name: Desk

    // $array: ['price' => 100]

也可向该方法传入默认值作为第三个参数。如果键不存在，将返回该默认值：

    use Illuminate\Support\Arr;

    $value = Arr::pull($array, $key, $default);

<a name="method-array-query"></a>
#### `Arr::query()` {.collection-method}

`Arr::query` 方法将数组转换为查询字符串：

    use Illuminate\Support\Arr;

    $array = [
        'name' => 'Taylor',
        'order' => [
            'column' => 'created_at',
            'direction' => 'desc'
        ]
    ];

    Arr::query($array);

    // name=Taylor&order[column]=created_at&order[direction]=desc

<a name="method-array-random"></a>
#### `Arr::random()` {.collection-method}

`Arr::random` 方法从数组中返回一个随机值：

    use Illuminate\Support\Arr;

    $array = [1, 2, 3, 4, 5];

    $random = Arr::random($array);

    // 4 -（随机获取）

你也可以通过可选的第二个参数指定要返回的项数。注意，提供此参数时即使只需要一个项，也将返回数组：

    use Illuminate\Support\Arr;

    $items = Arr::random($array, 2);

    // [2, 5] -（随机获取）

<a name="method-array-set"></a>
#### `Arr::set()` {.collection-method}

`Arr::set` 方法使用「点」表示法在深层嵌套数组中设置值：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    Arr::set($array, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 200]]]

<a name="method-array-shuffle"></a>
#### `Arr::shuffle()` {.collection-method}

`Arr::shuffle` 方法随机打乱数组中的项：

    use Illuminate\Support\Arr;

    $array = Arr::shuffle([1, 2, 3, 4, 5]);

    // [3, 2, 5, 1, 4] -（随机生成）

<a name="method-array-sort"></a>
#### `Arr::sort()` {.collection-method}

`Arr::sort` 方法按值对数组进行排序：

    use Illuminate\Support\Arr;

    $array = ['Desk', 'Table', 'Chair'];

    $sorted = Arr::sort($array);

    // ['Chair', 'Desk', 'Table']

你也可以按给定闭包的结果对数组进行排序：

    use Illuminate\Support\Arr;

    $array = [
        ['name' => 'Desk'],
        ['name' => 'Table'],
        ['name' => 'Chair'],
    ];

    $sorted = array_values(Arr::sort($array, function ($value) {
        return $value['name'];
    }));

    /*
        [
            ['name' => 'Chair'],
            ['name' => 'Desk'],
            ['name' => 'Table'],
        ]
    */

<a name="method-array-sort-desc"></a>
#### `Arr::sortDesc()` {.collection-method}

`Arr::sortDesc` 方法按值以降序对数组进行排序：

    use Illuminate\Support\Arr;

    $array = ['Desk', 'Table', 'Chair'];

    $sorted = Arr::sortDesc($array);

    // ['Table', 'Desk', 'Chair']

你也可以按给定闭包的结果对数组进行排序：

    use Illuminate\Support\Arr;

    $array = [
        ['name' => 'Desk'],
        ['name' => 'Table'],
        ['name' => 'Chair'],
    ];

    $sorted = array_values(Arr::sortDesc($array, function ($value) {
        return $value['name'];
    }));

    /*
        [
            ['name' => 'Table'],
            ['name' => 'Desk'],
            ['name' => 'Chair'],
        ]
    */

<a name="method-array-sort-recursive"></a>
#### `Arr::sortRecursive()` {.collection-method}

`Arr::sortRecursive` 方法递归排序数组，对数字索引子数组使用 `sort` 函数，对关联子数组使用 `ksort` 函数：

    use Illuminate\Support\Arr;

    $array = [
        ['Roman', 'Taylor', 'Li'],
        ['PHP', 'Ruby', 'JavaScript'],
        ['one' => 1, 'two' => 2, 'three' => 3],
    ];

    $sorted = Arr::sortRecursive($array);

    /*
        [
            ['JavaScript', 'PHP', 'Ruby'],
            ['one' => 1, 'three' => 3, 'two' => 2],
            ['Li', 'Roman', 'Taylor'],
        ]
    */

<a name="method-array-to-css-classes"></a>
#### `Arr::toCssClasses()` {.collection-method}

`Arr::toCssClasses` 方法按条件编译 CSS 类字符串。该方法接受一个类数组，数组的键包含你希望添加的类，而值是布尔表达式。如果数组元素具有数字键，它将始终包含在渲染的类列表中：

    use Illuminate\Support\Arr;

    $isActive = false;
    $hasError = true;

    $array = ['p-4', 'font-bold' => $isActive, 'bg-red' => $hasError];

    $classes = Arr::toCssClasses($array);

    /*
        'p-4 bg-red'
    */

该方法支撑了 Laravel 的功能，允许[将类与 Blade 组件的属性包合并](/docs/{{version}}/blade#conditionally-merge-classes)，以及 `@class` [Blade 指令](/docs/{{version}}/blade#conditional-classes)。

<a name="method-array-undot"></a>
#### `Arr::undot()` {.collection-method}

`Arr::undot` 方法将使用「点」表示法的单维数组展开为多维数组：

    use Illuminate\Support\Arr;

    $array = [
        'user.name' => 'Kevin Malone',
        'user.occupation' => 'Accountant',
    ];

    $array = Arr::undot($array);

    // ['user' => ['name' => 'Kevin Malone', 'occupation' => 'Accountant']]

<a name="method-array-where"></a>
#### `Arr::where()` {.collection-method}

`Arr::where` 方法使用给定闭包过滤数组：

    use Illuminate\Support\Arr;

    $array = [100, '200', 300, '400', 500];

    $filtered = Arr::where($array, function ($value, $key) {
        return is_string($value);
    });

    // [1 => '200', 3 => '400']

<a name="method-array-where-not-null"></a>
#### `Arr::whereNotNull()` {.collection-method}

`Arr::whereNotNull` 方法从给定数组中移除所有 `null` 值：

    use Illuminate\Support\Arr;

    $array = [0, null];

    $filtered = Arr::whereNotNull($array);

    // [0 => 0]

<a name="method-array-wrap"></a>
#### `Arr::wrap()` {.collection-method}

`Arr::wrap` 方法将给定值包装为数组。如果给定值已经是数组，则直接返回不做修改：

    use Illuminate\Support\Arr;

    $string = 'Laravel';

    $array = Arr::wrap($string);

    // ['Laravel']

如果给定值为 `null`，将返回空数组：

    use Illuminate\Support\Arr;

    $array = Arr::wrap(null);

    // []

<a name="method-data-fill"></a>
#### `data_fill()` {.collection-method}

`data_fill` 函数使用「点」表示法在嵌套数组或对象中设置缺失的值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_fill($data, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 100]]]

    data_fill($data, 'products.desk.discount', 10);

    // ['products' => ['desk' => ['price' => 100, 'discount' => 10]]]

该函数还接受星号作为通配符，并相应地填充目标：

    $data = [
        'products' => [
            ['name' => 'Desk 1', 'price' => 100],
            ['name' => 'Desk 2'],
        ],
    ];

    data_fill($data, 'products.*.price', 200);

    /*
        [
            'products' => [
                ['name' => 'Desk 1', 'price' => 100],
                ['name' => 'Desk 2', 'price' => 200],
            ],
        ]
    */

<a name="method-data-get"></a>
#### `data_get()` {.collection-method}

`data_get` 函数使用「点」表示法从嵌套数组或对象中获取值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    $price = data_get($data, 'products.desk.price');

    // 100

`data_get` 函数还接受一个默认值，如果指定键未找到，将返回该默认值：

    $discount = data_get($data, 'products.desk.discount', 0);

    // 0

该函数还接受使用星号的通配符，可以匹配数组或对象的任何键：

    $data = [
        'product-one' => ['name' => 'Desk 1', 'price' => 100],
        'product-two' => ['name' => 'Desk 2', 'price' => 150],
    ];

    data_get($data, '*.name');

    // ['Desk 1', 'Desk 2'];

<a name="method-data-set"></a>
#### `data_set()` {.collection-method}

`data_set` 函数使用「点」表示法在嵌套数组或对象中设置值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_set($data, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 200]]]

该函数还接受使用星号的通配符，并相应地在目标上设置值：

    $data = [
        'products' => [
            ['name' => 'Desk 1', 'price' => 100],
            ['name' => 'Desk 2', 'price' => 150],
        ],
    ];

    data_set($data, 'products.*.price', 200);

    /*
        [
            'products' => [
                ['name' => 'Desk 1', 'price' => 200],
                ['name' => 'Desk 2', 'price' => 200],
            ],
        ]
    */

默认情况下，任何现有值都会被覆盖。如果你只想在值不存在时才设置，可以向该函数传入 `false` 作为第四个参数：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_set($data, 'products.desk.price', 200, overwrite: false);

    // ['products' => ['desk' => ['price' => 100]]]

<a name="method-head"></a>
#### `head()` {.collection-method}

`head` 函数返回给定数组中的第一个元素：

    $array = [100, 200, 300];

    $first = head($array);

    // 100

<a name="method-last"></a>
#### `last()` {.collection-method}

`last` 函数返回给定数组中的最后一个元素：

    $array = [100, 200, 300];

    $last = last($array);

    // 300

<a name="paths"></a>
## 路径

<a name="method-app-path"></a>
#### `app_path()` {.collection-method}

`app_path` 函数返回应用 `app` 目录的完全限定路径。你也可以使用 `app_path` 函数生成相对于应用目录的文件的完全限定路径：

    $path = app_path();

    $path = app_path('Http/Controllers/Controller.php');

<a name="method-base-path"></a>
#### `base_path()` {.collection-method}

`base_path` 函数返回应用根目录的完全限定路径。你也可以使用 `base_path` 函数生成相对于项目根目录的给定文件的完全限定路径：

    $path = base_path();

    $path = base_path('vendor/bin');

<a name="method-config-path"></a>
#### `config_path()` {.collection-method}

`config_path` 函数返回应用 `config` 目录的完全限定路径。你也可以使用 `config_path` 函数生成应用配置目录内给定文件的完全限定路径：

    $path = config_path();

    $path = config_path('app.php');

<a name="method-database-path"></a>
#### `database_path()` {.collection-method}

`database_path` 函数返回应用 `database` 目录的完全限定路径。你也可以使用 `database_path` 函数生成数据库目录内给定文件的完全限定路径：

    $path = database_path();

    $path = database_path('factories/UserFactory.php');

<a name="method-lang-path"></a>
#### `lang_path()` {.collection-method}

`lang_path` 函数返回应用 `lang` 目录的完全限定路径。你也可以使用 `lang_path` 函数生成该目录内给定文件的完全限定路径：

    $path = lang_path();

    $path = lang_path('en/messages.php');

<a name="method-mix"></a>
#### `mix()` {.collection-method}

`mix` 函数返回[版本化的 Mix 文件](/docs/{{version}}/mix)的路径：

    $path = mix('css/app.css');

<a name="method-public-path"></a>
#### `public_path()` {.collection-method}

`public_path` 函数返回应用 `public` 目录的完全限定路径。你也可以使用 `public_path` 函数生成 public 目录内给定文件的完全限定路径：

    $path = public_path();

    $path = public_path('css/app.css');

<a name="method-resource-path"></a>
#### `resource_path()` {.collection-method}

`resource_path` 函数返回应用 `resources` 目录的完全限定路径。你也可以使用 `resource_path` 函数生成 resources 目录内给定文件的完全限定路径：

    $path = resource_path();

    $path = resource_path('sass/app.scss');

<a name="method-storage-path"></a>
#### `storage_path()` {.collection-method}

`storage_path` 函数返回应用 `storage` 目录的完全限定路径。你也可以使用 `storage_path` 函数生成 storage 目录内给定文件的完全限定路径：

    $path = storage_path();

    $path = storage_path('app/file.txt');

<a name="strings"></a>
## 字符串

<a name="method-__"></a>
#### `__()` {.collection-method}

`__` 函数使用你的[本地化文件](/docs/{{version}}/localization)翻译给定的翻译字符串或翻译键：

    echo __('Welcome to our application');

    echo __('messages.welcome');

如果指定的翻译字符串或键不存在，`__` 函数将返回给定的值。因此，使用上面的示例，如果该翻译键不存在，`__` 函数将返回 `messages.welcome`。

<a name="method-class-basename"></a>
#### `class_basename()` {.collection-method}

`class_basename` 函数返回给定类的类名，并去除该类的命名空间：

    $class = class_basename('Foo\Bar\Baz');

    // Baz

<a name="method-e"></a>
#### `e()` {.collection-method}

`e` 函数运行 PHP 的 `htmlspecialchars` 函数，并将 `double_encode` 选项默认设置为 `true`：

    echo e('<html>foo</html>');

    // &lt;html&gt;foo&lt;/html&gt;

<a name="method-preg-replace-array"></a>
#### `preg_replace_array()` {.collection-method}

`preg_replace_array` 函数使用数组按顺序替换字符串中给定的模式：

    $string = 'The event will take place between :start and :end';

    $replaced = preg_replace_array('/:[a-z_]+/', ['8:30', '9:00'], $string);

    // The event will take place between 8:30 and 9:00

<a name="method-str-after"></a>
#### `Str::after()` {.collection-method}

`Str::after` 方法返回字符串中给定值之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

    use Illuminate\Support\Str;

    $slice = Str::after('This is my name', 'This is');

    // ' my name'

<a name="method-str-after-last"></a>
#### `Str::afterLast()` {.collection-method}

`Str::afterLast` 方法返回字符串中给定值最后一次出现之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

    use Illuminate\Support\Str;

    $slice = Str::afterLast('App\Http\Controllers\Controller', '\\');

    // 'Controller'

<a name="method-str-ascii"></a>
#### `Str::ascii()` {.collection-method}

`Str::ascii` 方法尝试将字符串音译为 ASCII 值：

    use Illuminate\Support\Str;

    $slice = Str::ascii('û');

    // 'u'

<a name="method-str-before"></a>
#### `Str::before()` {.collection-method}

`Str::before` 方法返回字符串中给定值之前的所有内容：

    use Illuminate\Support\Str;

    $slice = Str::before('This is my name', 'my name');

    // 'This is '

<a name="method-str-before-last"></a>
#### `Str::beforeLast()` {.collection-method}

`Str::beforeLast` 方法返回字符串中给定值最后一次出现之前的所有内容：

    use Illuminate\Support\Str;

    $slice = Str::beforeLast('This is my name', 'is');

    // 'This '

<a name="method-str-between"></a>
#### `Str::between()` {.collection-method}

`Str::between` 方法返回字符串中两个值之间的部分：

    use Illuminate\Support\Str;

    $slice = Str::between('This is my name', 'This', 'name');

    // ' is my '

<a name="method-str-between-first"></a>
#### `Str::betweenFirst()` {.collection-method}

`Str::betweenFirst` 方法返回字符串中两个值之间最小的可能部分：

    use Illuminate\Support\Str;

    $slice = Str::betweenFirst('[a] bc [d]', '[', ']');

    // 'a'

<a name="method-camel-case"></a>
#### `Str::camel()` {.collection-method}

`Str::camel` 方法将给定字符串转换为 `camelCase`：

    use Illuminate\Support\Str;

    $converted = Str::camel('foo_bar');

    // fooBar

<a name="method-str-contains"></a>
#### `Str::contains()` {.collection-method}

`Str::contains` 方法判断给定字符串是否包含给定值。此方法区分大小写：

    use Illuminate\Support\Str;

    $contains = Str::contains('This is my name', 'my');

    // true

你也可以传递一个值数组，以判断给定字符串是否包含数组中的任意值：

    use Illuminate\Support\Str;

    $contains = Str::contains('This is my name', ['my', 'foo']);

    // true

<a name="method-str-contains-all"></a>
#### `Str::containsAll()` {.collection-method}

`Str::containsAll` 方法判断给定字符串是否包含给定数组中的所有值：

    use Illuminate\Support\Str;

    $containsAll = Str::containsAll('This is my name', ['my', 'name']);

    // true

<a name="method-ends-with"></a>
#### `Str::endsWith()` {.collection-method}

`Str::endsWith` 方法判断给定字符串是否以给定值结尾：

    use Illuminate\Support\Str;

    $result = Str::endsWith('This is my name', 'name');

    // true


你也可以传递一个值数组，以判断给定字符串是否以数组中的任意值结尾：

    use Illuminate\Support\Str;

    $result = Str::endsWith('This is my name', ['name', 'foo']);

    // true

    $result = Str::endsWith('This is my name', ['this', 'foo']);

    // false

<a name="method-excerpt"></a>
#### `Str::excerpt()` {.collection-method}

`Str::excerpt` 方法从给定字符串中提取摘要，该摘要匹配字符串中短语的第一次出现：

    use Illuminate\Support\Str;

    $excerpt = Str::excerpt('This is my name', 'my', [
        'radius' => 3
    ]);

    // '...is my na...'

`radius` 选项默认为 `100`，用于定义截断字符串两侧应显示的字符数。

此外，你可以使用 `omission` 选项来定义将添加到截断字符串前后端的字符串：

    use Illuminate\Support\Str;

    $excerpt = Str::excerpt('This is my name', 'name', [
        'radius' => 3,
        'omission' => '(...) '
    ]);

    // '(...) my name'

<a name="method-str-finish"></a>
#### `Str::finish()` {.collection-method}

`Str::finish` 方法在字符串尚未以给定值结尾时，向字符串添加一个该值的实例：

    use Illuminate\Support\Str;

    $adjusted = Str::finish('this/string', '/');

    // this/string/

    $adjusted = Str::finish('this/string/', '/');

    // this/string/

<a name="method-str-headline"></a>
#### `Str::headline()` {.collection-method}

`Str::headline` 方法将按大小写、连字符或下划线分隔的字符串转换为以空格分隔的字符串，并将每个单词的首字母大写：

    use Illuminate\Support\Str;

    $headline = Str::headline('steve_jobs');

    // Steve Jobs

    $headline = Str::headline('EmailNotificationSent');

    // Email Notification Sent

<a name="method-str-inline-markdown"></a>
#### `Str::inlineMarkdown()` {.collection-method}

`Str::inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但是，与 `markdown` 方法不同的是，它不会将所有生成的 HTML 包裹在块级元素中：

    use Illuminate\Support\Str;

    $html = Str::inlineMarkdown('**Laravel**');

    // <strong>Laravel</strong>

<a name="method-str-is"></a>
#### `Str::is()` {.collection-method}

`Str::is` 方法判断给定字符串是否匹配给定模式。星号可用作通配符值：

    use Illuminate\Support\Str;

    $matches = Str::is('foo*', 'foobar');

    // true

    $matches = Str::is('baz*', 'foobar');

    // false

<a name="method-str-is-ascii"></a>
#### `Str::isAscii()` {.collection-method}

`Str::isAscii` 方法判断给定字符串是否为 7 位 ASCII：

    use Illuminate\Support\Str;

    $isAscii = Str::isAscii('Taylor');

    // true

    $isAscii = Str::isAscii('ü');

    // false

<a name="method-str-is-json"></a>
#### `Str::isJson()` {.collection-method}

`Str::isJson` 方法判断给定字符串是否为有效的 JSON：

    use Illuminate\Support\Str;

    $result = Str::isJson('[1,2,3]');

    // true

    $result = Str::isJson('{"first": "John", "last": "Doe"}');

    // true

    $result = Str::isJson('{first: "John", last: "Doe"}');

    // false

<a name="method-str-is-ulid"></a>
#### `Str::isUlid()` {.collection-method}

`Str::isUlid` 方法判断给定字符串是否为有效的 ULID：

    use Illuminate\Support\Str;

    $isUlid = Str::isUlid('01gd6r360bp37zj17nxb55yv40');

    // true

    $isUlid = Str::isUlid('laravel');

    // false

<a name="method-str-is-uuid"></a>
#### `Str::isUuid()` {.collection-method}

`Str::isUuid` 方法判断给定字符串是否为有效的 UUID：

    use Illuminate\Support\Str;

    $isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de');

    // true

    $isUuid = Str::isUuid('laravel');

    // false

<a name="method-kebab-case"></a>
#### `Str::kebab()` {.collection-method}

`Str::kebab` 方法将给定字符串转换为 `kebab-case`：

    use Illuminate\Support\Str;

    $converted = Str::kebab('fooBar');

    // foo-bar

<a name="method-str-lcfirst"></a>
#### `Str::lcfirst()` {.collection-method}

`Str::lcfirst` 方法返回将首字符小写后的给定字符串：

    use Illuminate\Support\Str;

    $string = Str::lcfirst('Foo Bar');

    // foo Bar

<a name="method-str-length"></a>
#### `Str::length()` {.collection-method}

`Str::length` 方法返回给定字符串的长度：

    use Illuminate\Support\Str;

    $length = Str::length('Laravel');

    // 7

<a name="method-str-limit"></a>
#### `Str::limit()` {.collection-method}

`Str::limit` 方法将给定字符串截断到指定长度：

    use Illuminate\Support\Str;

    $truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20);

    // The quick brown fox...

你可以向该方法传递第三个参数，以更改追加到截断字符串末尾的字符串：

    use Illuminate\Support\Str;

    $truncated = Str::limit('The quick brown fox jumps over the lazy dog', 20, ' (...)');

    // The quick brown fox (...)

<a name="method-str-lower"></a>
#### `Str::lower()` {.collection-method}

`Str::lower` 方法将给定字符串转换为小写：

    use Illuminate\Support\Str;

    $converted = Str::lower('LARAVEL');

    // laravel

<a name="method-str-markdown"></a>
#### `Str::markdown()` {.collection-method}

`Str::markdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为 HTML：

    use Illuminate\Support\Str;

    $html = Str::markdown('# Laravel');

    // <h1>Laravel</h1>

    $html = Str::markdown('# Taylor <b>Otwell</b>', [
        'html_input' => 'strip',
    ]);

    // <h1>Taylor Otwell</h1>

<a name="method-str-mask"></a>
#### `Str::mask()` {.collection-method}

`Str::mask` 方法用重复字符遮蔽字符串的一部分，可用于混淆电子邮件地址和电话号码等字符串片段：

    use Illuminate\Support\Str;

    $string = Str::mask('taylor@example.com', '*', 3);

    // tay***************

如有需要，你可以向 `mask` 方法传递一个负数作为第三个参数，指示方法从字符串末尾的给定距离处开始遮蔽：

    $string = Str::mask('taylor@example.com', '*', -15, 3);

    // tay***@example.com

<a name="method-str-ordered-uuid"></a>
#### `Str::orderedUuid()` {.collection-method}

`Str::orderedUuid` 方法生成一个 "timestamp first" UUID，可以高效地存储在索引数据库列中。使用此方法生成的每个 UUID 都会排在之前使用该方法生成的 UUID 之后：

    use Illuminate\Support\Str;

    return (string) Str::orderedUuid();

<a name="method-str-padboth"></a>
#### `Str::padBoth()` {.collection-method}

`Str::padBoth` 方法封装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的两侧，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::padBoth('James', 10, '_');

    // '__James___'

    $padded = Str::padBoth('James', 10);

    // '  James   '

<a name="method-str-padleft"></a>
#### `Str::padLeft()` {.collection-method}

`Str::padLeft` 方法封装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的左侧，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::padLeft('James', 10, '-=');

    // '-=-=-James'

    $padded = Str::padLeft('James', 10);

    // '     James'

<a name="method-str-padright"></a>
#### `Str::padRight()` {.collection-method}

`Str::padRight` 方法封装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的右侧，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::padRight('James', 10, '-');

    // 'James-----'

    $padded = Str::padRight('James', 10);

    // 'James     '

<a name="method-str-plural"></a>
#### `Str::plural()` {.collection-method}

`Str::plural` 方法将单数单词字符串转换为其复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

    use Illuminate\Support\Str;

    $plural = Str::plural('car');

    // cars

    $plural = Str::plural('child');

    // children

你可以向该函数提供一个整数作为第二个参数，以获取字符串的单数或复数形式：

    use Illuminate\Support\Str;

    $plural = Str::plural('child', 2);

    // children

    $singular = Str::plural('child', 1);

    // child

<a name="method-str-plural-studly"></a>
#### `Str::pluralStudly()` {.collection-method}

`Str::pluralStudly` 方法将以 studly 大写格式格式化的单数单词字符串转换为其复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

    use Illuminate\Support\Str;

    $plural = Str::pluralStudly('VerifiedHuman');

    // VerifiedHumans

    $plural = Str::pluralStudly('UserFeedback');

    // UserFeedback

你可以向该函数提供一个整数作为第二个参数，以获取字符串的单数或复数形式：

    use Illuminate\Support\Str;

    $plural = Str::pluralStudly('VerifiedHuman', 2);

    // VerifiedHumans

    $singular = Str::pluralStudly('VerifiedHuman', 1);

    // VerifiedHuman

<a name="method-str-random"></a>
#### `Str::random()` {.collection-method}

`Str::random` 方法生成指定长度的随机字符串。此函数使用 PHP 的 `random_bytes` 函数：

    use Illuminate\Support\Str;

    $random = Str::random(40);

<a name="method-str-remove"></a>
#### `Str::remove()` {.collection-method}

`Str::remove` 方法从字符串中移除给定值或值数组：

    use Illuminate\Support\Str;

    $string = 'Peter Piper picked a peck of pickled peppers.';

    $removed = Str::remove('e', $string);

    // Ptr Pipr pickd a pck of pickld ppprs.

你也可以向 `remove` 方法传递 `false` 作为第三个参数，以在移除字符串时忽略大小写。

<a name="method-str-replace"></a>
#### `Str::replace()` {.collection-method}

`Str::replace` 方法替换字符串中的给定字符串：

    use Illuminate\Support\Str;

    $string = 'Laravel 8.x';

    $replaced = Str::replace('8.x', '9.x', $string);

    // Laravel 9.x

<a name="method-str-replace-array"></a>
#### `Str::replaceArray()` {.collection-method}

`Str::replaceArray` 方法使用数组按顺序替换字符串中给定的值：

    use Illuminate\Support\Str;

    $string = 'The event will take place between ? and ?';

    $replaced = Str::replaceArray('?', ['8:30', '9:00'], $string);

    // The event will take place between 8:30 and 9:00

<a name="method-str-replace-first"></a>
#### `Str::replaceFirst()` {.collection-method}

`Str::replaceFirst` 方法替换字符串中给定值的第一次出现：

    use Illuminate\Support\Str;

    $replaced = Str::replaceFirst('the', 'a', 'the quick brown fox jumps over the lazy dog');

    // a quick brown fox jumps over the lazy dog

<a name="method-str-replace-last"></a>
#### `Str::replaceLast()` {.collection-method}

`Str::replaceLast` 方法替换字符串中给定值的最后一次出现：

    use Illuminate\Support\Str;

    $replaced = Str::replaceLast('the', 'a', 'the quick brown fox jumps over the lazy dog');

    // the quick brown fox jumps over a lazy dog


<a name="method-str-reverse"></a>
#### `Str::reverse()` {.collection-method}

`Str::reverse` 方法反转给定字符串：

    use Illuminate\Support\Str;

    $reversed = Str::reverse('Hello World');

    // dlroW olleH

<a name="method-str-singular"></a>
#### `Str::singular()` {.collection-method}

`Str::singular` 方法将字符串转换为其单数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

    use Illuminate\Support\Str;

    $singular = Str::singular('cars');

    // car

    $singular = Str::singular('children');

    // child

<a name="method-str-slug"></a>
#### `Str::slug()` {.collection-method}

`Str::slug` 方法从给定字符串生成 URL 友好的 "slug"：

    use Illuminate\Support\Str;

    $slug = Str::slug('Laravel 5 Framework', '-');

    // laravel-5-framework

<a name="method-snake-case"></a>
#### `Str::snake()` {.collection-method}

`Str::snake` 方法将给定字符串转换为 `snake_case`：

    use Illuminate\Support\Str;

    $converted = Str::snake('fooBar');

    // foo_bar

    $converted = Str::snake('fooBar', '-');

    // foo-bar

<a name="method-str-squish"></a>
#### `Str::squish()` {.collection-method}

`Str::squish` 方法移除字符串中所有多余的空白字符，包括单词之间多余的空白字符：

    use Illuminate\Support\Str;

    $string = Str::squish('    laravel    framework    ');

    // laravel framework

<a name="method-str-start"></a>
#### `Str::start()` {.collection-method}

`Str::start` 方法在字符串尚未以给定值开头时，向字符串添加一个该值的实例：

    use Illuminate\Support\Str;

    $adjusted = Str::start('this/string', '/');

    // /this/string

    $adjusted = Str::start('/this/string', '/');

    // /this/string

<a name="method-starts-with"></a>
#### `Str::startsWith()` {.collection-method}

`Str::startsWith` 方法判断给定字符串是否以给定值开头：

    use Illuminate\Support\Str;

    $result = Str::startsWith('This is my name', 'This');

    // true

如果传递一个可能值的数组，当字符串以任意给定值开头时，`startsWith` 方法将返回 `true`：

    $result = Str::startsWith('This is my name', ['This', 'That', 'There']);

    // true

<a name="method-studly-case"></a>
#### `Str::studly()` {.collection-method}

`Str::studly` 方法将给定字符串转换为 `StudlyCase`：

    use Illuminate\Support\Str;

    $converted = Str::studly('foo_bar');

    // FooBar

<a name="method-str-substr"></a>
#### `Str::substr()` {.collection-method}

`Str::substr` 方法返回由 start 和 length 参数指定的字符串部分：

    use Illuminate\Support\Str;

    $converted = Str::substr('The Laravel Framework', 4, 7);

    // Laravel

<a name="method-str-substrcount"></a>
#### `Str::substrCount()` {.collection-method}

`Str::substrCount` 方法返回给定值在给定字符串中出现的次数：

    use Illuminate\Support\Str;

    $count = Str::substrCount('If you like ice cream, you will like snow cones.', 'like');

    // 2

<a name="method-str-substrreplace"></a>
#### `Str::substrReplace()` {.collection-method}

`Str::substrReplace` 方法替换字符串某一部分中的文本，从第三个参数指定的位置开始，替换第四个参数指定的字符数。向方法的第四个参数传递 `0` 将在指定位置插入字符串，而不替换字符串中的任何现有字符：

    use Illuminate\Support\Str;

    $result = Str::substrReplace('1300', ':', 2);
    // 13:

    $result = Str::substrReplace('1300', ':', 2, 0);
    // 13:00

<a name="method-str-swap"></a>
#### `Str::swap()` {.collection-method}

`Str::swap` 方法使用 PHP 的 `strtr` 函数替换给定字符串中的多个值：

    use Illuminate\Support\Str;

    $string = Str::swap([
        'Tacos' => 'Burritos',
        'great' => 'fantastic',
    ], 'Tacos are great!');

    // Burritos are fantastic!

<a name="method-title-case"></a>
#### `Str::title()` {.collection-method}

`Str::title` 方法将给定字符串转换为 `Title Case`：

    use Illuminate\Support\Str;

    $converted = Str::title('a nice title uses the correct case');

    // A Nice Title Uses The Correct Case

<a name="method-str-to-html-string"></a>
#### `Str::toHtmlString()` {.collection-method}

`Str::toHtmlString` 方法将字符串实例转换为 `Illuminate\Support\HtmlString` 实例，可在 Blade 模板中显示：

    use Illuminate\Support\Str;

    $htmlString = Str::of('Nuno Maduro')->toHtmlString();

<a name="method-str-ucfirst"></a>
#### `Str::ucfirst()` {.collection-method}

`Str::ucfirst` 方法返回将首字符大写后的给定字符串：

    use Illuminate\Support\Str;

    $string = Str::ucfirst('foo bar');

    // Foo bar

<a name="method-str-ucsplit"></a>
#### `Str::ucsplit()` {.collection-method}

`Str::ucsplit` 方法按大写字符将给定字符串拆分为数组：

    use Illuminate\Support\Str;

    $segments = Str::ucsplit('FooBar');

    // [0 => 'Foo', 1 => 'Bar']

<a name="method-str-upper"></a>
#### `Str::upper()` {.collection-method}

`Str::upper` 方法将给定字符串转换为大写：

    use Illuminate\Support\Str;

    $string = Str::upper('laravel');

    // LARAVEL

<a name="method-str-ulid"></a>
#### `Str::ulid()` {.collection-method}

`Str::ulid` 方法生成一个 ULID：

    use Illuminate\Support\Str;

    return (string) Str::ulid();

    // 01gd6r360bp37zj17nxb55yv40

<a name="method-str-uuid"></a>
#### `Str::uuid()` {.collection-method}

`Str::uuid` 方法生成一个 UUID（版本 4）：

    use Illuminate\Support\Str;

    return (string) Str::uuid();

<a name="method-str-word-count"></a>
#### `Str::wordCount()` {.collection-method}

`Str::wordCount` 方法返回字符串包含的单词数：

```php
use Illuminate\Support\Str;

Str::wordCount('Hello, world!'); // 2
```

<a name="method-str-words"></a>
#### `Str::words()` {.collection-method}

`Str::words` 方法限制字符串中的单词数。可以通过第三个参数向该方法传递一个额外的字符串，以指定追加到截断字符串末尾的字符串：

    use Illuminate\Support\Str;

    return Str::words('Perfectly balanced, as all things should be.', 3, ' >>>');

    // Perfectly balanced, as >>>

<a name="method-str"></a>
#### `str()` {.collection-method}

`str` 函数返回给定字符串的新 `Illuminate\Support\Stringable` 实例。此函数等同于 `Str::of` 方法：

    $string = str('Taylor')->append(' Otwell');

    // 'Taylor Otwell'

如果没有向 `str` 函数提供参数，该函数将返回 `Illuminate\Support\Str` 的实例：

    $snake = str()->snake('FooBar');

    // 'foo_bar'

<a name="method-trans"></a>
#### `trans()` {.collection-method}

`trans` 函数使用你的[本地化文件](/docs/{{version}}/localization)翻译给定的翻译键：

    echo trans('messages.welcome');

如果指定的翻译键不存在，`trans` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans` 函数将返回 `messages.welcome`。

<a name="method-trans-choice"></a>
#### `trans_choice()` {.collection-method}

`trans_choice` 函数根据词形变化翻译给定的翻译键：

    echo trans_choice('messages.notifications', $unreadCount);

如果指定的翻译键不存在，`trans_choice` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans_choice` 函数将返回 `messages.notifications`。

<a name="fluent-strings"></a>
## Fluent 字符串

Fluent 字符串提供了一个更流畅、面向对象的接口来处理字符串值，允许你使用比传统字符串操作更易读的语法将多个字符串操作链接在一起。

<a name="method-fluent-str-after"></a>
#### `after` {.collection-method}

`after` 方法返回字符串中给定值之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

    use Illuminate\Support\Str;

    $slice = Str::of('This is my name')->after('This is');

    // ' my name'

<a name="method-fluent-str-after-last"></a>
#### `afterLast` {.collection-method}

`afterLast` 方法返回字符串中给定值最后一次出现之后的所有内容。如果该值不存在于字符串中，则返回整个字符串：

    use Illuminate\Support\Str;

    $slice = Str::of('App\Http\Controllers\Controller')->afterLast('\\');

    // 'Controller'

<a name="method-fluent-str-append"></a>
#### `append` {.collection-method}

`append` 方法将给定值追加到字符串：

    use Illuminate\Support\Str;

    $string = Str::of('Taylor')->append(' Otwell');

    // 'Taylor Otwell'

<a name="method-fluent-str-ascii"></a>
#### `ascii` {.collection-method}

`ascii` 方法尝试将字符串音译为 ASCII 值：

    use Illuminate\Support\Str;

    $string = Str::of('ü')->ascii();

    // 'u'

<a name="method-fluent-str-basename"></a>
#### `basename` {.collection-method}

`basename` 方法返回给定字符串的尾部名称组件：

    use Illuminate\Support\Str;

    $string = Str::of('/foo/bar/baz')->basename();

    // 'baz'

如有需要，你可以提供一个 "extension"，它将从尾部组件中移除：

    use Illuminate\Support\Str;

    $string = Str::of('/foo/bar/baz.jpg')->basename('.jpg');

    // 'baz'

<a name="method-fluent-str-before"></a>
#### `before` {.collection-method}

`before` 方法返回字符串中给定值之前的所有内容：

    use Illuminate\Support\Str;

    $slice = Str::of('This is my name')->before('my name');

    // 'This is '

<a name="method-fluent-str-before-last"></a>
#### `beforeLast` {.collection-method}

`beforeLast` 方法返回字符串中给定值最后一次出现之前的所有内容：

    use Illuminate\Support\Str;

    $slice = Str::of('This is my name')->beforeLast('is');

    // 'This '

<a name="method-fluent-str-between"></a>
#### `between` {.collection-method}

`between` 方法返回字符串中两个值之间的部分：

    use Illuminate\Support\Str;

    $converted = Str::of('This is my name')->between('This', 'name');

    // ' is my '

<a name="method-fluent-str-between-first"></a>
#### `betweenFirst` {.collection-method}

`betweenFirst` 方法返回字符串中两个值之间最小的可能部分：

    use Illuminate\Support\Str;

    $converted = Str::of('[a] bc [d]')->betweenFirst('[', ']');

    // 'a'

<a name="method-fluent-str-camel"></a>
#### `camel` {.collection-method}

`camel` 方法将给定字符串转换为 `camelCase`：

    use Illuminate\Support\Str;

    $converted = Str::of('foo_bar')->camel();

    // fooBar

<a name="method-fluent-str-class-basename"></a>
#### `classBasename` {.collection-method}

`classBasename` 方法返回给定类的类名，并去除该类的命名空间：

    use Illuminate\Support\Str;

    $class = Str::of('Foo\Bar\Baz')->classBasename();

    // Baz

<a name="method-fluent-str-contains"></a>
#### `contains` {.collection-method}

`contains` 方法判断给定字符串是否包含给定值。此方法区分大小写：

    use Illuminate\Support\Str;

    $contains = Str::of('This is my name')->contains('my');

    // true

你也可以传递一个值数组，以判断给定字符串是否包含数组中的任意值：

    use Illuminate\Support\Str;

    $contains = Str::of('This is my name')->contains(['my', 'foo']);

    // true

<a name="method-fluent-str-contains-all"></a>
#### `containsAll` {.collection-method}

`containsAll` 方法判断给定字符串是否包含给定数组中的所有值：

    use Illuminate\Support\Str;

    $containsAll = Str::of('This is my name')->containsAll(['my', 'name']);

    // true

<a name="method-fluent-str-dirname"></a>
#### `dirname` {.collection-method}

`dirname` 方法返回给定字符串的父目录部分：

    use Illuminate\Support\Str;

    $string = Str::of('/foo/bar/baz')->dirname();

    // '/foo/bar'

如有必要，你可以指定希望从字符串中裁剪的目录层级数：

    use Illuminate\Support\Str;

    $string = Str::of('/foo/bar/baz')->dirname(2);

    // '/foo'

<a name="method-fluent-str-excerpt"></a>
#### `excerpt` {.collection-method}

`excerpt` 方法从字符串中提取摘要，该摘要匹配字符串中短语的第一次出现：

    use Illuminate\Support\Str;

    $excerpt = Str::of('This is my name')->excerpt('my', [
        'radius' => 3
    ]);

    // '...is my na...'

`radius` 选项默认为 `100`，用于定义截断字符串两侧应显示的字符数。

此外，你可以使用 `omission` 选项来更改将添加到截断字符串前后端的字符串：

    use Illuminate\Support\Str;

    $excerpt = Str::of('This is my name')->excerpt('name', [
        'radius' => 3,
        'omission' => '(...) '
    ]);

    // '(...) my name'

<a name="method-fluent-str-ends-with"></a>
#### `endsWith` {.collection-method}

`endsWith` 方法判断给定字符串是否以给定值结尾：

    use Illuminate\Support\Str;

    $result = Str::of('This is my name')->endsWith('name');

    // true

你也可以传递一个值数组，以判断给定字符串是否以数组中的任意值结尾：

    use Illuminate\Support\Str;

    $result = Str::of('This is my name')->endsWith(['name', 'foo']);

    // true

    $result = Str::of('This is my name')->endsWith(['this', 'foo']);

    // false

<a name="method-fluent-str-exactly"></a>
#### `exactly` {.collection-method}

`exactly` 方法判断给定字符串是否与另一个字符串完全匹配：

    use Illuminate\Support\Str;

    $result = Str::of('Laravel')->exactly('Laravel');

    // true

<a name="method-fluent-str-explode"></a>
#### `explode` {.collection-method}

`explode` 方法按给定分隔符拆分字符串，并返回一个包含拆分字符串各部分的集合：

    use Illuminate\Support\Str;

    $collection = Str::of('foo bar baz')->explode(' ');

    // collect(['foo', 'bar', 'baz'])

<a name="method-fluent-str-finish"></a>
#### `finish` {.collection-method}

`finish` 方法在字符串尚未以给定值结尾时，向字符串添加一个该值的实例：

    use Illuminate\Support\Str;

    $adjusted = Str::of('this/string')->finish('/');

    // this/string/

    $adjusted = Str::of('this/string/')->finish('/');

    // this/string/

<a name="method-fluent-str-headline"></a>
#### `headline` {.collection-method}

`headline` 方法将按大小写、连字符或下划线分隔的字符串转换为以空格分隔的字符串，并将每个单词的首字母大写：

    use Illuminate\Support\Str;

    $headline = Str::of('taylor_otwell')->headline();

    // Taylor Otwell

    $headline = Str::of('EmailNotificationSent')->headline();

    // Email Notification Sent

<a name="method-fluent-str-inline-markdown"></a>
#### `inlineMarkdown` {.collection-method}

`inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但是，与 `markdown` 方法不同的是，它不会将所有生成的 HTML 包裹在块级元素中：

    use Illuminate\Support\Str;

    $html = Str::of('**Laravel**')->inlineMarkdown();

    // <strong>Laravel</strong>

<a name="method-fluent-str-is"></a>
#### `is` {.collection-method}

`is` 方法判断给定字符串是否匹配给定模式。星号可用作通配符值

    use Illuminate\Support\Str;

    $matches = Str::of('foobar')->is('foo*');

    // true

    $matches = Str::of('foobar')->is('baz*');

    // false

<a name="method-fluent-str-is-ascii"></a>
#### `isAscii` {.collection-method}

`isAscii` 方法判断给定字符串是否为 ASCII 字符串：

    use Illuminate\Support\Str;

    $result = Str::of('Taylor')->isAscii();

    // true

    $result = Str::of('ü')->isAscii();

    // false

<a name="method-fluent-str-is-empty"></a>
#### `isEmpty` {.collection-method}

`isEmpty` 方法判断给定字符串是否为空：

    use Illuminate\Support\Str;

    $result = Str::of('  ')->trim()->isEmpty();

    // true

    $result = Str::of('Laravel')->trim()->isEmpty();

    // false

<a name="method-fluent-str-is-not-empty"></a>
#### `isNotEmpty` {.collection-method}

`isNotEmpty` 方法判断给定字符串是否不为空：


    use Illuminate\Support\Str;

    $result = Str::of('  ')->trim()->isNotEmpty();

    // false
    $result = Str::of('Laravel')->trim()->isNotEmpty();

    // true

<a name="method-fluent-str-is-json"></a>
#### `isJson` {.collection-method}

`isJson` 方法判断给定字符串是否为有效的 JSON：

    use Illuminate\Support\Str;

    $result = Str::of('[1,2,3]')->isJson();

    // true

    $result = Str::of('{"first": "John", "last": "Doe"}')->isJson();

    // true

    $result = Str::of('{first: "John", last: "Doe"}')->isJson();

    // false

<a name="method-fluent-str-is-ulid"></a>
#### `isUlid` {.collection-method}

`isUlid` 方法判断给定字符串是否为 ULID：

    use Illuminate\Support\Str;

    $result = Str::of('01gd6r360bp37zj17nxb55yv40')->isUlid();

    // true

    $result = Str::of('Taylor')->isUlid();

    // false

<a name="method-fluent-str-is-uuid"></a>
#### `isUuid` {.collection-method}

`isUuid` 方法判断给定字符串是否为 UUID：

    use Illuminate\Support\Str;

    $result = Str::of('5ace9ab9-e9cf-4ec6-a19d-5881212a452c')->isUuid();

    // true

    $result = Str::of('Taylor')->isUuid();

    // false

<a name="method-fluent-str-kebab"></a>
#### `kebab` {.collection-method}

`kebab` 方法将给定字符串转换为 `kebab-case`：

    use Illuminate\Support\Str;

    $converted = Str::of('fooBar')->kebab();

    // foo-bar

<a name="method-fluent-str-lcfirst"></a>
#### `lcfirst` {.collection-method}

`lcfirst` 方法返回首字符小写后的字符串：

    use Illuminate\Support\Str;

    $string = Str::of('Foo Bar')->lcfirst();

    // foo Bar

<a name="method-fluent-str-length"></a>
#### `length` {.collection-method}

`length` 方法返回给定字符串的长度：

    use Illuminate\Support\Str;

    $length = Str::of('Laravel')->length();

    // 7

<a name="method-fluent-str-limit"></a>
#### `limit` {.collection-method}

`limit` 方法将给定字符串截断到指定长度：

    use Illuminate\Support\Str;

    $truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20);

    // The quick brown fox...

你也可以传入第二个参数来更改追加到截断字符串末尾的内容：

    use Illuminate\Support\Str;

    $truncated = Str::of('The quick brown fox jumps over the lazy dog')->limit(20, ' (...)');

    // The quick brown fox (...)

<a name="method-fluent-str-lower"></a>
#### `lower` {.collection-method}

`lower` 方法将给定字符串转换为小写：

    use Illuminate\Support\Str;

    $result = Str::of('LARAVEL')->lower();

    // 'laravel'

<a name="method-fluent-str-ltrim"></a>
#### `ltrim` {.collection-method}

`ltrim` 方法去除字符串左侧的字符：

    use Illuminate\Support\Str;

    $string = Str::of('  Laravel  ')->ltrim();

    // 'Laravel  '

    $string = Str::of('/Laravel/')->ltrim('/');

    // 'Laravel/'

<a name="method-fluent-str-markdown"></a>
#### `markdown` {.collection-method}

`markdown` 方法将 GitHub 风格的 Markdown 转换为 HTML：

    use Illuminate\Support\Str;

    $html = Str::of('# Laravel')->markdown();

    // <h1>Laravel</h1>

    $html = Str::of('# Taylor <b>Otwell</b>')->markdown([
        'html_input' => 'strip',
    ]);

    // <h1>Taylor Otwell</h1>

<a name="method-fluent-str-mask"></a>
#### `mask` {.collection-method}

`mask` 方法使用重复字符遮蔽字符串的一部分，可用于模糊化电子邮件地址和电话号码等字符串片段：

    use Illuminate\Support\Str;

    $string = Str::of('taylor@example.com')->mask('*', 3);

    // tay***************

如有需要，可以向 `mask` 方法的第三个或第四个参数传入负数，指示方法从字符串末尾的指定距离处开始遮蔽：

    $string = Str::of('taylor@example.com')->mask('*', -15, 3);

    // tay***@example.com

    $string = Str::of('taylor@example.com')->mask('*', 4, -4);

    // tayl**********.com

<a name="method-fluent-str-match"></a>
#### `match` {.collection-method}

`match` 方法返回字符串中匹配给定正则表达式模式的部分：

    use Illuminate\Support\Str;

    $result = Str::of('foo bar')->match('/bar/');

    // 'bar'

    $result = Str::of('foo bar')->match('/foo (.*)/');

    // 'bar'

<a name="method-fluent-str-match-all"></a>
#### `matchAll` {.collection-method}

`matchAll` 方法返回一个集合，其中包含字符串中匹配给定正则表达式模式的所有部分：

    use Illuminate\Support\Str;

    $result = Str::of('bar foo bar')->matchAll('/bar/');

    // collect(['bar', 'bar'])

如果在表达式中指定了匹配组，Laravel 将返回该组匹配项的集合：

    use Illuminate\Support\Str;

    $result = Str::of('bar fun bar fly')->matchAll('/f(\w*)/');

    // collect(['un', 'ly']);

如果未找到匹配项，将返回一个空集合。

<a name="method-fluent-str-new-line"></a>
#### `newLine` {.collection-method}

`newLine` 方法向字符串追加一个"行尾"字符：

    use Illuminate\Support\Str;

    $padded = Str::of('Laravel')->newLine()->append('Framework');

    // 'Laravel
    //  Framework'

<a name="method-fluent-str-padboth"></a>
#### `padBoth` {.collection-method}

`padBoth` 方法封装了 PHP 的 `str_pad` 函数，在字符串两侧用另一个字符串填充，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::of('James')->padBoth(10, '_');

    // '__James___'

    $padded = Str::of('James')->padBoth(10);

    // '  James   '

<a name="method-fluent-str-padleft"></a>
#### `padLeft` {.collection-method}

`padLeft` 方法封装了 PHP 的 `str_pad` 函数，在字符串左侧用另一个字符串填充，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::of('James')->padLeft(10, '-=');

    // '-=-=-James'

    $padded = Str::of('James')->padLeft(10);

    // '     James'

<a name="method-fluent-str-padright"></a>
#### `padRight` {.collection-method}

`padRight` 方法封装了 PHP 的 `str_pad` 函数，在字符串右侧用另一个字符串填充，直到最终字符串达到所需长度：

    use Illuminate\Support\Str;

    $padded = Str::of('James')->padRight(10, '-');

    // 'James-----'

    $padded = Str::of('James')->padRight(10);

    // 'James     '

<a name="method-fluent-str-pipe"></a>
#### `pipe` {.collection-method}

`pipe` 方法允许你将字符串的当前值传递给给定的 callable 来进行转换：

    use Illuminate\Support\Str;

    $hash = Str::of('Laravel')->pipe('md5')->prepend('Checksum: ');

    // 'Checksum: a5c95b86291ea299fcbe64458ed12702'

    $closure = Str::of('foo')->pipe(function ($str) {
        return 'bar';
    });

    // 'bar'

<a name="method-fluent-str-plural"></a>
#### `plural` {.collection-method}

`plural` 方法将单数形式的字符串转换为复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

    use Illuminate\Support\Str;

    $plural = Str::of('car')->plural();

    // cars

    $plural = Str::of('child')->plural();

    // children

可以向函数传入一个整数作为第二个参数，以获取字符串的单数或复数形式：

    use Illuminate\Support\Str;

    $plural = Str::of('child')->plural(2);

    // children

    $plural = Str::of('child')->plural(1);

    // child

<a name="method-fluent-str-prepend"></a>
#### `prepend` {.collection-method}

`prepend` 方法将给定值前置到字符串：

    use Illuminate\Support\Str;

    $string = Str::of('Framework')->prepend('Laravel ');

    // Laravel Framework

<a name="method-fluent-str-remove"></a>
#### `remove` {.collection-method}

`remove` 方法从字符串中移除给定的值或值数组：

    use Illuminate\Support\Str;

    $string = Str::of('Arkansas is quite beautiful!')->remove('quite');

    // Arkansas is beautiful!

你也可以传入 `false` 作为第二个参数，在移除字符串时忽略大小写。

<a name="method-fluent-str-replace"></a>
#### `replace` {.collection-method}

`replace` 方法替换字符串中的给定字符串：

    use Illuminate\Support\Str;

    $replaced = Str::of('Laravel 6.x')->replace('6.x', '7.x');

    // Laravel 7.x

<a name="method-fluent-str-replace-array"></a>
#### `replaceArray` {.collection-method}

`replaceArray` 方法使用数组依次替换字符串中的给定值：

    use Illuminate\Support\Str;

    $string = 'The event will take place between ? and ?';

    $replaced = Str::of($string)->replaceArray('?', ['8:30', '9:00']);

    // The event will take place between 8:30 and 9:00

<a name="method-fluent-str-replace-first"></a>
#### `replaceFirst` {.collection-method}

`replaceFirst` 方法替换字符串中给定值的第一次出现：

    use Illuminate\Support\Str;

    $replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceFirst('the', 'a');

    // a quick brown fox jumps over the lazy dog

<a name="method-fluent-str-replace-last"></a>
#### `replaceLast` {.collection-method}

`replaceLast` 方法替换字符串中给定值的最后一次出现：

    use Illuminate\Support\Str;

    $replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceLast('the', 'a');

    // the quick brown fox jumps over a lazy dog

<a name="method-fluent-str-replace-matches"></a>
#### `replaceMatches` {.collection-method}

`replaceMatches` 方法用给定的替换字符串替换字符串中所有匹配模式的部分：

    use Illuminate\Support\Str;

    $replaced = Str::of('(+1) 501-555-1000')->replaceMatches('/[^A-Za-z0-9]++/', '')

    // '15015551000'

`replaceMatches` 方法还接受一个闭包，该闭包会针对字符串中匹配给定模式的每个部分被调用，允许你在闭包内执行替换逻辑并返回替换后的值：

    use Illuminate\Support\Str;

    $replaced = Str::of('123')->replaceMatches('/\d/', function ($match) {
        return '['.$match[0].']';
    });

    // '[1][2][3]'

<a name="method-fluent-str-rtrim"></a>
#### `rtrim` {.collection-method}

`rtrim` 方法去除给定字符串右侧的字符：

    use Illuminate\Support\Str;

    $string = Str::of('  Laravel  ')->rtrim();

    // '  Laravel'

    $string = Str::of('/Laravel/')->rtrim('/');

    // '/Laravel'

<a name="method-fluent-str-scan"></a>
#### `scan` {.collection-method}

`scan` 方法根据 [`sscanf` PHP 函数](https://www.php.net/manual/en/function.sscanf.php)支持的格式，将字符串中的输入解析为集合：

    use Illuminate\Support\Str;

    $collection = Str::of('filename.jpg')->scan('%[^.].%s');

    // collect(['filename', 'jpg'])

<a name="method-fluent-str-singular"></a>
#### `singular` {.collection-method}

`singular` 方法将字符串转换为单数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

    use Illuminate\Support\Str;

    $singular = Str::of('cars')->singular();

    // car

    $singular = Str::of('children')->singular();

    // child

<a name="method-fluent-str-slug"></a>
#### `slug` {.collection-method}

`slug` 方法根据给定字符串生成 URL 友好的 "slug"：

    use Illuminate\Support\Str;

    $slug = Str::of('Laravel Framework')->slug('-');

    // laravel-framework

<a name="method-fluent-str-snake"></a>
#### `snake` {.collection-method}

`snake` 方法将给定字符串转换为 `snake_case`：

    use Illuminate\Support\Str;

    $converted = Str::of('fooBar')->snake();

    // foo_bar

<a name="method-fluent-str-split"></a>
#### `split` {.collection-method}

`split` 方法使用正则表达式将字符串拆分为集合：

    use Illuminate\Support\Str;

    $segments = Str::of('one, two, three')->split('/[\s,]+/');

    // collect(["one", "two", "three"])

<a name="method-fluent-str-squish"></a>
#### `squish` {.collection-method}

`squish` 方法移除字符串中所有多余的空白字符，包括单词之间多余的空白：

    use Illuminate\Support\Str;

    $string = Str::of('    laravel    framework    ')->squish();

    // laravel framework

<a name="method-fluent-str-start"></a>
#### `start` {.collection-method}

`start` 方法在字符串尚未以给定值开头时，向字符串添加单个给定值实例：

    use Illuminate\Support\Str;

    $adjusted = Str::of('this/string')->start('/');

    // /this/string

    $adjusted = Str::of('/this/string')->start('/');

    // /this/string

<a name="method-fluent-str-starts-with"></a>
#### `startsWith` {.collection-method}

`startsWith` 方法判断给定字符串是否以给定值开头：

    use Illuminate\Support\Str;

    $result = Str::of('This is my name')->startsWith('This');

    // true

<a name="method-fluent-str-studly"></a>
#### `studly` {.collection-method}

`studly` 方法将给定字符串转换为 `StudlyCase`：

    use Illuminate\Support\Str;

    $converted = Str::of('foo_bar')->studly();

    // FooBar

<a name="method-fluent-str-substr"></a>
#### `substr` {.collection-method}

`substr` 方法返回由给定起始位置和长度参数指定的字符串部分：

    use Illuminate\Support\Str;

    $string = Str::of('Laravel Framework')->substr(8);

    // Framework

    $string = Str::of('Laravel Framework')->substr(8, 5);

    // Frame

<a name="method-fluent-str-substrreplace"></a>
#### `substrReplace` {.collection-method}

`substrReplace` 方法替换字符串中某一部分的文本，从第二个参数指定的位置开始，替换第三个参数指定数量的字符。向方法的第三个参数传入 `0` 将在指定位置插入字符串，而不替换字符串中的任何现有字符：

    use Illuminate\Support\Str;

    $string = Str::of('1300')->substrReplace(':', 2);

    // 13:

    $string = Str::of('The Framework')->substrReplace(' Laravel', 3, 0);

    // The Laravel Framework

<a name="method-fluent-str-swap"></a>
#### `swap` {.collection-method}

`swap` 方法使用 PHP 的 `strtr` 函数替换字符串中的多个值：

    use Illuminate\Support\Str;

    $string = Str::of('Tacos are great!')
        ->swap([
            'Tacos' => 'Burritos',
            'great' => 'fantastic',
        ]);

    // Burritos are fantastic!

<a name="method-fluent-str-tap"></a>
#### `tap` {.collection-method}

`tap` 方法将字符串传递给给定的闭包，允许你检查并操作字符串而不影响字符串本身。无论闭包返回什么，`tap` 方法都会返回原始字符串：

    use Illuminate\Support\Str;

    $string = Str::of('Laravel')
        ->append(' Framework')
        ->tap(function ($string) {
            dump('String after append: '.$string);
        })
        ->upper();

    // LARAVEL FRAMEWORK

<a name="method-fluent-str-test"></a>
#### `test` {.collection-method}

`test` 方法判断字符串是否匹配给定的正则表达式模式：

    use Illuminate\Support\Str;

    $result = Str::of('Laravel Framework')->test('/Laravel/');

    // true

<a name="method-fluent-str-title"></a>
#### `title` {.collection-method}

`title` 方法将给定字符串转换为 `Title Case`：

    use Illuminate\Support\Str;

    $converted = Str::of('a nice title uses the correct case')->title();

    // A Nice Title Uses The Correct Case

<a name="method-fluent-str-trim"></a>
#### `trim` {.collection-method}

`trim` 方法去除给定字符串两侧的字符：

    use Illuminate\Support\Str;

    $string = Str::of('  Laravel  ')->trim();

    // 'Laravel'

    $string = Str::of('/Laravel/')->trim('/');

    // 'Laravel'

<a name="method-fluent-str-ucfirst"></a>
#### `ucfirst` {.collection-method}

`ucfirst` 方法返回首字符大写后的字符串：

    use Illuminate\Support\Str;

    $string = Str::of('foo bar')->ucfirst();

    // Foo bar

<a name="method-fluent-str-ucsplit"></a>
#### `ucsplit` {.collection-method}

`ucsplit` 方法按大写字符将给定字符串拆分为集合：

    use Illuminate\Support\Str;

    $string = Str::of('Foo Bar')->ucsplit();

    // collect(['Foo', 'Bar'])

<a name="method-fluent-str-upper"></a>
#### `upper` {.collection-method}

`upper` 方法将给定字符串转换为大写：

    use Illuminate\Support\Str;

    $adjusted = Str::of('laravel')->upper();

    // LARAVEL

<a name="method-fluent-str-when"></a>
#### `when` {.collection-method}

`when` 方法在给定条件为 `true` 时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('Taylor')
                    ->when(true, function ($string) {
                        return $string->append(' Otwell');
                    });

    // 'Taylor Otwell'

如有必要，可以向 `when` 方法传入另一个闭包作为第三个参数。当条件参数求值为 `false` 时，将执行此闭包。

<a name="method-fluent-str-when-contains"></a>
#### `whenContains` {.collection-method}

`whenContains` 方法在字符串包含给定值时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('tony stark')
                ->whenContains('tony', function ($string) {
                    return $string->title();
                });

    // 'Tony Stark'

如有必要，可以向 `when` 方法传入另一个闭包作为第三个参数。当字符串不包含给定值时，将执行此闭包。

你也可以传入一个值数组，以判断给定字符串是否包含数组中的任意值：

    use Illuminate\Support\Str;

    $string = Str::of('tony stark')
                ->whenContains(['tony', 'hulk'], function ($string) {
                    return $string->title();
                });

    // Tony Stark

<a name="method-fluent-str-when-contains-all"></a>
#### `whenContainsAll` {.collection-method}

`whenContainsAll` 方法在字符串包含所有给定子字符串时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('tony stark')
                    ->whenContainsAll(['tony', 'stark'], function ($string) {
                        return $string->title();
                    });

    // 'Tony Stark'

如有必要，可以向 `when` 方法传入另一个闭包作为第三个参数。当条件参数求值为 `false` 时，将执行此闭包。

<a name="method-fluent-str-when-empty"></a>
#### `whenEmpty` {.collection-method}

`whenEmpty` 方法在字符串为空时调用给定的闭包。如果闭包返回一个值，`whenEmpty` 方法也将返回该值。如果闭包未返回值，则返回流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('  ')->whenEmpty(function ($string) {
        return $string->trim()->prepend('Laravel');
    });

    // 'Laravel'

<a name="method-fluent-str-when-not-empty"></a>
#### `whenNotEmpty` {.collection-method}

`whenNotEmpty` 方法在字符串不为空时调用给定的闭包。如果闭包返回一个值，`whenNotEmpty` 方法也将返回该值。如果闭包未返回值，则返回流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('Framework')->whenNotEmpty(function ($string) {
        return $string->prepend('Laravel ');
    });

    // 'Laravel Framework'

<a name="method-fluent-str-when-starts-with"></a>
#### `whenStartsWith` {.collection-method}

`whenStartsWith` 方法在字符串以给定子字符串开头时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('disney world')->whenStartsWith('disney', function ($string) {
        return $string->title();
    });

    // 'Disney World'

<a name="method-fluent-str-when-ends-with"></a>
#### `whenEndsWith` {.collection-method}

`whenEndsWith` 方法在字符串以给定子字符串结尾时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('disney world')->whenEndsWith('world', function ($string) {
        return $string->title();
    });

    // 'Disney World'

<a name="method-fluent-str-when-exactly"></a>
#### `whenExactly` {.collection-method}

`whenExactly` 方法在字符串与给定字符串完全匹配时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('laravel')->whenExactly('laravel', function ($string) {
        return $string->title();
    });

    // 'Laravel'

<a name="method-fluent-str-when-not-exactly"></a>
#### `whenNotExactly` {.collection-method}

`whenNotExactly` 方法在字符串与给定字符串不完全匹配时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('framework')->whenNotExactly('laravel', function ($string) {
        return $string->title();
    });

    // 'Framework'

<a name="method-fluent-str-when-is"></a>
#### `whenIs` {.collection-method}

`whenIs` 方法在字符串匹配给定模式时调用给定的闭包。星号可用作通配符。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('foo/bar')->whenIs('foo/*', function ($string) {
        return $string->append('/baz');
    });

    // 'foo/bar/baz'

<a name="method-fluent-str-when-is-ascii"></a>
#### `whenIsAscii` {.collection-method}

`whenIsAscii` 方法在字符串为 7 位 ASCII 时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('laravel')->whenIsAscii(function ($string) {
        return $string->title();
    });

    // 'Laravel'

<a name="method-fluent-str-when-is-ulid"></a>
#### `whenIsUlid` {.collection-method}

`whenIsUlid` 方法在字符串为有效 ULID 时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('01gd6r360bp37zj17nxb55yv40')->whenIsUlid(function ($string) {
        return $string->substr(0, 8);
    });

    // '01gd6r36'

<a name="method-fluent-str-when-is-uuid"></a>
#### `whenIsUuid` {.collection-method}

`whenIsUuid` 方法在字符串为有效 UUID 时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->whenIsUuid(function ($string) {
        return $string->substr(0, 8);
    });

    // 'a0a2a2d2'

<a name="method-fluent-str-when-test"></a>
#### `whenTest` {.collection-method}

`whenTest` 方法在字符串匹配给定正则表达式时调用给定的闭包。闭包将接收流畅字符串实例：

    use Illuminate\Support\Str;

    $string = Str::of('laravel framework')->whenTest('/laravel/', function ($string) {
        return $string->title();
    });

    // 'Laravel Framework'

<a name="method-fluent-str-word-count"></a>
#### `wordCount` {.collection-method}

`wordCount` 方法返回字符串包含的单词数量：

```php
use Illuminate\Support\Str;

Str::of('Hello, world!')->wordCount(); // 2
```

<a name="method-fluent-str-words"></a>
#### `words` {.collection-method}

`words` 方法限制字符串中的单词数量。如有必要，可以指定一个追加到截断字符串末尾的额外字符串：

    use Illuminate\Support\Str;

    $string = Str::of('Perfectly balanced, as all things should be.')->words(3, ' >>>');

    // Perfectly balanced, as >>>

<a name="urls"></a>
## URLs

<a name="method-action"></a>
#### `action()` {.collection-method}

`action` 函数为给定的控制器动作生成 URL：

    use App\Http\Controllers\HomeController;

    $url = action([HomeController::class, 'index']);

如果方法接受路由参数，可以将参数作为第二个参数传递给该方法：

    $url = action([UserController::class, 'profile'], ['id' => 1]);

<a name="method-asset"></a>
#### `asset()` {.collection-method}

`asset` 函数使用请求的当前协议（HTTP 或 HTTPS）为资源生成 URL：

    $url = asset('img/photo.jpg');

可以通过在 `.env` 文件中设置 `ASSET_URL` 变量来配置资源 URL 的主机。如果你将资源托管在 Amazon S3 或其他 CDN 等外部服务上，这会很有用：

    // ASSET_URL=http://example.com/assets

    $url = asset('img/photo.jpg'); // http://example.com/assets/img/photo.jpg

<a name="method-route"></a>
#### `route()` {.collection-method}

`route` 函数为给定的[命名路由](/docs/{{version}}/routing#named-routes)生成 URL：

    $url = route('route.name');

如果路由接受参数，可以将参数作为第二个参数传递给该函数：

    $url = route('route.name', ['id' => 1]);

默认情况下，`route` 函数生成绝对 URL。如果希望生成相对 URL，可以向该函数传入 `false` 作为第三个参数：

    $url = route('route.name', ['id' => 1], false);

<a name="method-secure-asset"></a>
#### `secure_asset()` {.collection-method}

`secure_asset` 函数使用 HTTPS 为资源生成 URL：

    $url = secure_asset('img/photo.jpg');

<a name="method-secure-url"></a>
#### `secure_url()` {.collection-method}

`secure_url` 函数为给定路径生成完全限定的 HTTPS URL。可以在函数的第二个参数中传入额外的 URL 片段：

    $url = secure_url('user/profile');

    $url = secure_url('user/profile', [1]);

<a name="method-to-route"></a>
#### `to_route()` {.collection-method}

`to_route` 函数为给定的[命名路由](/docs/{{version}}/routing#named-routes)生成[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)：

    return to_route('users.show', ['user' => 1]);

如有必要，可以将应分配给重定向的 HTTP 状态码和任何额外的响应头作为 `to_route` 方法的第三个和第四个参数传入：

    return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);

<a name="method-url"></a>
#### `url()` {.collection-method}

`url` 函数为给定路径生成完全限定的 URL：

    $url = url('user/profile');

    $url = url('user/profile', [1]);

如果未提供路径，则返回 `Illuminate\Routing\UrlGenerator` 实例：

    $current = url()->current();

    $full = url()->full();

    $previous = url()->previous();

<a name="miscellaneous"></a>
## 其他

<a name="method-abort"></a>
#### `abort()` {.collection-method}

`abort` 函数抛出 [HTTP 异常](/docs/{{version}}/errors#http-exceptions)，该异常将由[异常处理器](/docs/{{version}}/errors#the-exception-handler)渲染：

    abort(403);

还可以提供异常的消息和应发送到浏览器的自定义 HTTP 响应头：

    abort(403, 'Unauthorized.', $headers);

<a name="method-abort-if"></a>
#### `abort_if()` {.collection-method}

`abort_if` 函数在给定布尔表达式求值为 `true` 时抛出 HTTP 异常：

    abort_if(! Auth::user()->isAdmin(), 403);

与 `abort` 方法类似，也可以将异常的响应文本作为第三个参数、自定义响应头数组作为第四个参数传递给该函数。

<a name="method-abort-unless"></a>
#### `abort_unless()` {.collection-method}

`abort_unless` 函数在给定布尔表达式求值为 `false` 时抛出 HTTP 异常：

    abort_unless(Auth::user()->isAdmin(), 403);

与 `abort` 方法类似，也可以将异常的响应文本作为第三个参数、自定义响应头数组作为第四个参数传递给该函数。

<a name="method-app"></a>
#### `app()` {.collection-method}

`app` 函数返回[服务容器](/docs/{{version}}/container)实例：
    $container = app();

你可以传入类或接口名称，从容器中解析它：

    $api = app('HelpSpot\API');

<a name="method-auth"></a>
#### `auth()` {.collection-method}

`auth` 函数返回一个[认证器](/docs/{{version}}/authentication)实例。你可以将其作为 `Auth` facade 的替代使用：

    $user = auth()->user();

如果需要，你可以指定要访问哪个 guard 实例：

    $user = auth('admin')->user();

<a name="method-back"></a>
#### `back()` {.collection-method}

`back` 函数生成一个[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)，指向用户的上一个位置：

    return back($status = 302, $headers = [], $fallback = '/');

    return back();

<a name="method-bcrypt"></a>
#### `bcrypt()` {.collection-method}

`bcrypt` 函数使用 Bcrypt 对给定值进行[哈希处理](/docs/{{version}}/hashing)。你可以将此函数作为 `Hash` facade 的替代使用：

    $password = bcrypt('my-secret-password');

<a name="method-blank"></a>
#### `blank()` {.collection-method}

`blank` 函数判断给定值是否为"空白"：

    blank('');
    blank('   ');
    blank(null);
    blank(collect());

    // true

    blank(0);
    blank(true);
    blank(false);

    // false

关于 `blank` 的相反方法，请参见 [`filled`](#method-filled) 方法。

<a name="method-broadcast"></a>
#### `broadcast()` {.collection-method}

`broadcast` 函数将给定的[事件](/docs/{{version}}/events)[广播](/docs/{{version}}/broadcasting)给其监听器：

    broadcast(new UserRegistered($user));

    broadcast(new UserRegistered($user))->toOthers();

<a name="method-cache"></a>
#### `cache()` {.collection-method}

`cache` 函数可用于从[缓存](/docs/{{version}}/cache)中获取值。如果给定的键在缓存中不存在，将返回可选的默认值：

    $value = cache('key');

    $value = cache('key', 'default');

你可以通过向函数传递键 / 值对数组来向缓存添加项。你还应传递缓存值应被视为有效的秒数或持续时间：

    cache(['key' => 'value'], 300);

    cache(['key' => 'value'], now()->addSeconds(10));

<a name="method-class-uses-recursive"></a>
#### `class_uses_recursive()` {.collection-method}

`class_uses_recursive` 函数返回一个类使用的所有 trait，包括其所有父类使用的 trait：

    $traits = class_uses_recursive(App\Models\User::class);

<a name="method-collect"></a>
#### `collect()` {.collection-method}

`collect` 函数根据给定值创建一个[集合](/docs/{{version}}/collections)实例：

    $collection = collect(['taylor', 'abigail']);

<a name="method-config"></a>
#### `config()` {.collection-method}

`config` 函数获取[配置](/docs/{{version}}/configuration)变量的值。可以使用"点"语法访问配置值，其中包括文件名和你希望访问的选项。可以指定一个默认值，当配置选项不存在时将返回该默认值：

    $value = config('app.timezone');

    $value = config('app.timezone', $default);

你可以通过传递键 / 值对数组在运行时设置配置变量。但是，请注意此函数仅影响当前请求的配置值，不会更新实际的配置值：

    config(['app.debug' => true]);

<a name="method-cookie"></a>
#### `cookie()` {.collection-method}

`cookie` 函数创建一个新的 [cookie](/docs/{{version}}/requests#cookies) 实例：

    $cookie = cookie('name', 'value', $minutes);

<a name="method-csrf-field"></a>
#### `csrf_field()` {.collection-method}

`csrf_field` 函数生成一个包含 CSRF token 值的 HTML `hidden` 输入字段。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

    {{ csrf_field() }}

<a name="method-csrf-token"></a>
#### `csrf_token()` {.collection-method}

`csrf_token` 函数获取当前 CSRF token 的值：

    $token = csrf_token();

<a name="method-decrypt"></a>
#### `decrypt()` {.collection-method}

`decrypt` 函数对给定值进行[解密](/docs/{{version}}/encryption)。你可以将此函数作为 `Crypt` facade 的替代使用：

    $password = decrypt($value);

<a name="method-dd"></a>
#### `dd()` {.collection-method}

`dd` 函数转储给定的变量并结束脚本执行：

    dd($value);

    dd($value1, $value2, $value3, ...);

如果你不想中止脚本执行，请使用 [`dump`](#method-dump) 函数。

<a name="method-dispatch"></a>
#### `dispatch()` {.collection-method}

`dispatch` 函数将给定的[作业](/docs/{{version}}/queues#creating-jobs)推入 Laravel 的[作业队列](/docs/{{version}}/queues)：

    dispatch(new App\Jobs\SendEmails);

<a name="method-dump"></a>
#### `dump()` {.collection-method}

`dump` 函数转储给定的变量：

    dump($value);

    dump($value1, $value2, $value3, ...);

如果你想在转储变量后停止执行脚本，请使用 [`dd`](#method-dd) 函数。

<a name="method-encrypt"></a>
#### `encrypt()` {.collection-method}

`encrypt` 函数对给定值进行[加密](/docs/{{version}}/encryption)。你可以将此函数作为 `Crypt` facade 的替代使用：

    $secret = encrypt('my-secret-value');

<a name="method-env"></a>
#### `env()` {.collection-method}

`env` 函数获取[环境变量](/docs/{{version}}/configuration#environment-configuration)的值或返回一个默认值：

    $env = env('APP_ENV');

    $env = env('APP_ENV', 'production');

> **警告**
> 如果你在部署过程中执行了 `config:cache` 命令，应确保仅在配置文件中调用 `env` 函数。配置被缓存后，`.env` 文件将不会被加载，所有对 `env` 函数的调用都将返回 `null`。

<a name="method-event"></a>
#### `event()` {.collection-method}

`event` 函数将给定的[事件](/docs/{{version}}/events)分发给其监听器：

    event(new UserRegistered($user));

<a name="method-fake"></a>
#### `fake()` {.collection-method}

`fake` 函数从容器中解析一个 [Faker](https://github.com/FakerPHP/Faker) 单例，这在模型工厂、数据填充、测试和视图原型设计中创建假数据时非常有用：

```blade
@for($i = 0; $i < 10; $i++)
    <dl>
        <dt>Name</dt>
        <dd>{{ fake()->name() }}</dd>

        <dt>Email</dt>
        <dd>{{ fake()->unique()->safeEmail() }}</dd>
    </dl>
@endfor
```

默认情况下，`fake` 函数将使用 `config/app.php` 配置文件中的 `app.faker_locale` 配置选项；不过，你也可以通过将区域设置传递给 `fake` 函数来指定它。每个区域设置将解析一个独立的单例：

    fake('nl_NL')->name()

<a name="method-filled"></a>
#### `filled()` {.collection-method}

`filled` 函数判断给定值是否不为"空白"：

    filled(0);
    filled(true);
    filled(false);

    // true

    filled('');
    filled('   ');
    filled(null);
    filled(collect());

    // false

关于 `filled` 的相反方法，请参见 [`blank`](#method-blank) 方法。

<a name="method-info"></a>
#### `info()` {.collection-method}

`info` 函数将信息写入应用程序的[日志](/docs/{{version}}/logging)：

    info('Some helpful information!');

也可以向函数传递一个上下文数据数组：

    info('User login attempt failed.', ['id' => $user->id]);

<a name="method-logger"></a>
#### `logger()` {.collection-method}

`logger` 函数可用于向[日志](/docs/{{version}}/logging)写入一条 `debug` 级别的消息：

    logger('Debug message');

也可以向函数传递一个上下文数据数组：

    logger('User has logged in.', ['id' => $user->id]);

如果没有向函数传递值，将返回一个 [logger](/docs/{{version}}/errors#logging) 实例：

    logger()->error('You are not allowed here.');

<a name="method-method-field"></a>
#### `method_field()` {.collection-method}

`method_field` 函数生成一个 HTML `hidden` 输入字段，包含表单 HTTP 动词的伪装值。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

    <form method="POST">
        {{ method_field('DELETE') }}
    </form>

<a name="method-now"></a>
#### `now()` {.collection-method}

`now` 函数为当前时间创建一个新的 `Illuminate\Support\Carbon` 实例：

    $now = now();

<a name="method-old"></a>
#### `old()` {.collection-method}

`old` 函数[获取](/docs/{{version}}/requests#retrieving-input)闪存到会话中的[旧输入](/docs/{{version}}/requests#old-input)值：

    $value = old('value');

    $value = old('value', 'default');

由于作为 `old` 函数第二个参数提供的"默认值"通常是 Eloquent 模型的属性，Laravel 允许你直接将整个 Eloquent 模型作为 `old` 函数的第二个参数传递。此时，Laravel 会假定 `old` 函数的第一个参数是应被视为"默认值"的 Eloquent 属性名称：

    {{ old('name', $user->name) }}

    // 等价于...

    {{ old('name', $user) }}

<a name="method-optional"></a>
#### `optional()` {.collection-method}

`optional` 函数接受任何参数，允许你访问该对象的属性或调用其方法。如果给定对象为 `null`，属性和方法将返回 `null` 而不会引发错误：

    return optional($user->address)->street;

    {!! old('name', optional($user)->name) !!}

`optional` 函数还接受一个闭包作为第二个参数。如果作为第一个参数提供的值不为 null，将调用该闭包：

    return optional(User::find($id), function ($user) {
        return $user->name;
    });

<a name="method-policy"></a>
#### `policy()` {.collection-method}

`policy` 方法获取给定类的[策略](/docs/{{version}}/authorization#creating-policies)实例：

    $policy = policy(App\Models\User::class);

<a name="method-redirect"></a>
#### `redirect()` {.collection-method}

`redirect` 函数返回一个[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)，如果在无参数调用时则返回重定向器实例：

    return redirect($to = null, $status = 302, $headers = [], $https = null);

    return redirect('/home');

    return redirect()->route('route.name');

<a name="method-report"></a>
#### `report()` {.collection-method}

`report` 函数将使用你的[异常处理器](/docs/{{version}}/errors#the-exception-handler)报告一个异常：

    report($e);

`report` 函数还接受字符串作为参数。当向函数传递字符串时，函数将使用该字符串作为消息创建一个异常：

    report('Something went wrong.');

<a name="method-report-if"></a>
#### `report_if()` {.collection-method}

`report_if` 函数在给定条件为 `true` 时，使用你的[异常处理器](/docs/{{version}}/errors#the-exception-handler)报告一个异常：

    report_if($shouldReport, $e);

    report_if($shouldReport, 'Something went wrong.');

<a name="method-report-unless"></a>
#### `report_unless()` {.collection-method}

`report_unless` 函数在给定条件为 `false` 时，使用你的[异常处理器](/docs/{{version}}/errors#the-exception-handler)报告一个异常：

    report_unless($reportingDisabled, $e);

    report_unless($reportingDisabled, 'Something went wrong.');

<a name="method-request"></a>
#### `request()` {.collection-method}

`request` 函数返回当前[请求](/docs/{{version}}/requests)实例，或从当前请求中获取输入字段的值：

    $request = request();

    $value = request('key', $default);

<a name="method-rescue"></a>
#### `rescue()` {.collection-method}

`rescue` 函数执行给定的闭包并捕获其执行期间发生的任何异常。所有被捕获的异常都将发送到你的[异常处理器](/docs/{{version}}/errors#the-exception-handler)；但是，请求将继续处理：

    return rescue(function () {
        return $this->method();
    });

你也可以向 `rescue` 函数传递第二个参数。此参数将是在执行闭包时发生异常时应返回的"默认"值：

    return rescue(function () {
        return $this->method();
    }, false);

    return rescue(function () {
        return $this->method();
    }, function () {
        return $this->failure();
    });

<a name="method-resolve"></a>
#### `resolve()` {.collection-method}

`resolve` 函数使用[服务容器](/docs/{{version}}/container)将给定的类或接口名称解析为一个实例：

    $api = resolve('HelpSpot\API');

<a name="method-response"></a>
#### `response()` {.collection-method}

`response` 函数创建一个[响应](/docs/{{version}}/responses)实例，或获取响应工厂的实例：

    return response('Hello World', 200, $headers);

    return response()->json(['foo' => 'bar'], 200, $headers);

<a name="method-retry"></a>
#### `retry()` {.collection-method}

`retry` 函数尝试执行给定的回调，直到达到给定的最大尝试次数。如果回调没有抛出异常，将返回其返回值。如果回调抛出异常，将自动重试。如果超过最大尝试次数，将抛出异常：

    return retry(5, function () {
        // 尝试 5 次，每次尝试之间间隔 100ms...
    }, 100);

如果你想手动计算每次尝试之间休眠的毫秒数，可以将闭包作为 `retry` 函数的第三个参数传递：

    return retry(5, function () {
        // ...
    }, function ($attempt, $exception) {
        return $attempt * 100;
    });

为方便起见，你可以提供一个数组作为 `retry` 函数的第一个参数。此数组将用于确定后续尝试之间休眠的毫秒数：

    return retry([100, 200], function () {
        // 第一次重试休眠 100ms，第二次重试休眠 200ms...
    });

如果只想在特定条件下重试，可以将闭包作为 `retry` 函数的第四个参数传递：

    return retry(5, function () {
        // ...
    }, 100, function ($exception) {
        return $exception instanceof RetryException;
    });

<a name="method-session"></a>
#### `session()` {.collection-method}

`session` 函数可用于获取或设置[会话](/docs/{{version}}/session)值：

    $value = session('key');

你可以通过向函数传递键 / 值对数组来设置值：

    session(['chairs' => 7, 'instruments' => 3]);

如果没有向函数传递值，将返回会话存储：

    $value = session()->get('key');

    session()->put('key', $value);

<a name="method-tap"></a>
#### `tap()` {.collection-method}

`tap` 函数接受两个参数：一个任意的 `$value` 和一个闭包。`$value` 将被传递给闭包，然后由 `tap` 函数返回。闭包的返回值无关紧要：

    $user = tap(User::first(), function ($user) {
        $user->name = 'taylor';

        $user->save();
    });

如果没有向 `tap` 函数传递闭包，你可以在给定的 `$value` 上调用任何方法。你调用的方法的返回值将始终是 `$value`，无论该方法在其定义中实际返回什么。例如，Eloquent 的 `update` 方法通常返回一个整数。但是，我们可以通过 `tap` 函数链式调用 `update` 方法来强制该方法返回模型本身：

    $user = tap($user)->update([
        'name' => $name,
        'email' => $email,
    ]);

要为类添加 `tap` 方法，你可以将 `Illuminate\Support\Traits\Tappable` trait 添加到该类。此 trait 的 `tap` 方法接受一个闭包作为其唯一参数。对象实例本身将被传递给闭包，然后由 `tap` 方法返回：

    return $user->tap(function ($user) {
        //
    });

<a name="method-throw-if"></a>
#### `throw_if()` {.collection-method}

`throw_if` 函数在给定布尔表达式求值为 `true` 时抛出给定的异常：

    throw_if(! Auth::user()->isAdmin(), AuthorizationException::class);

    throw_if(
        ! Auth::user()->isAdmin(),
        AuthorizationException::class,
        'You are not allowed to access this page.'
    );

<a name="method-throw-unless"></a>
#### `throw_unless()` {.collection-method}

`throw_unless` 函数在给定布尔表达式求值为 `false` 时抛出给定的异常：

    throw_unless(Auth::user()->isAdmin(), AuthorizationException::class);

    throw_unless(
        Auth::user()->isAdmin(),
        AuthorizationException::class,
        'You are not allowed to access this page.'
    );

<a name="method-today"></a>
#### `today()` {.collection-method}

`today` 函数为当前日期创建一个新的 `Illuminate\Support\Carbon` 实例：

    $today = today();

<a name="method-trait-uses-recursive"></a>
#### `trait_uses_recursive()` {.collection-method}

`trait_uses_recursive` 函数返回一个 trait 使用的所有 trait：

    $traits = trait_uses_recursive(\Illuminate\Notifications\Notifiable::class);

<a name="method-transform"></a>
#### `transform()` {.collection-method}

`transform` 函数在给定值不为[空白](#method-blank)时对该值执行闭包，然后返回闭包的返回值：

    $callback = function ($value) {
        return $value * 2;
    };

    $result = transform(5, $callback);

    // 10

可以将默认值或闭包作为函数的第三个参数传递。如果给定值为空白，将返回此值：

    $result = transform(null, $callback, 'The value is blank');

    // The value is blank

<a name="method-validator"></a>
#### `validator()` {.collection-method}

`validator` 函数根据给定参数创建一个新的[验证器](/docs/{{version}}/validation)实例。你可以将其作为 `Validator` facade 的替代使用：

    $validator = validator($data, $rules, $messages);

<a name="method-value"></a>
#### `value()` {.collection-method}

`value` 函数返回其给定的值。但是，如果你向函数传递一个闭包，将执行该闭包并返回其返回值：

    $result = value(true);

    // true

    $result = value(function () {
        return false;
    });

    // false

可以向 `value` 函数传递额外的参数。如果第一个参数是闭包，则额外的参数将作为参数传递给闭包，否则将被忽略：

    $result = value(function ($name) {
        return $parameter;
    }, 'Taylor');

    // 'Taylor'

<a name="method-view"></a>
#### `view()` {.collection-method}

`view` 函数获取一个[视图](/docs/{{version}}/views)实例：

    return view('auth.login');

<a name="method-with"></a>
#### `with()` {.collection-method}

`with` 函数返回其给定的值。如果将闭包作为函数的第二个参数传递，将执行该闭包并返回其返回值：

    $callback = function ($value) {
        return is_numeric($value) ? $value * 2 : 0;
    };

    $result = with(5, $callback);

    // 10

    $result = with(null, $callback);

    // 0

    $result = with(5, null);

    // 5

<a name="other-utilities"></a>
## 其他实用工具

<a name="benchmarking"></a>
### 性能基准测试

有时你可能希望快速测试应用程序某些部分的性能。在这种情况下，你可以使用 `Benchmark` 支持类来测量给定回调完成所需的毫秒数：

    <?php

    use App\Models\User;
    use Illuminate\Support\Benchmark;

    Benchmark::dd(fn () => User::find(1)); // 0.1 ms

    Benchmark::dd([
        'Scenario 1' => fn () => User::count(), // 0.5 ms
        'Scenario 2' => fn () => User::all()->count(), // 20.0 ms
    ]);

默认情况下，给定的回调将执行一次（一次迭代），其持续时间将显示在浏览器 / 控制台中。

要多次调用回调，你可以指定回调应调用的迭代次数作为方法的第二个参数。当多次执行回调时，`Benchmark` 类将返回所有迭代中执行回调所需的平均毫秒数：

    Benchmark::dd(fn () => User::count(), iterations: 10); // 0.5 ms

<a name="lottery"></a>
### Lottery

Laravel 的 lottery 类可用于根据一组给定的赔率执行回调。当你只想对传入请求的一部分执行代码时，这尤其有用：

    use Illuminate\Support\Lottery;

    Lottery::odds(1, 20)
        ->winner(fn () => $user->won())
        ->loser(fn () => $user->lost())
        ->choose();

你可以将 Laravel 的 lottery 类与其他 Laravel 功能结合使用。例如，你可能希望仅将一小部分慢查询报告给异常处理器。而且，由于 lottery 类是可调用的，我们可以将该类的实例传递给任何接受可调用参数的方法：

    use Carbon\CarbonInterval;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Lottery;

    DB::whenQueryingForLongerThan(
        CarbonInterval::seconds(2),
        Lottery::odds(1, 100)->winner(fn () => report('Querying > 2 seconds.')),
    );

<a name="testing-lotteries"></a>
#### 测试 Lottery

Laravel 提供了一些简单的方法，让你能够轻松测试应用程序的 lottery 调用：

    // Lottery 将始终获胜...
    Lottery::alwaysWin();

    // Lottery 将始终失败...
    Lottery::alwaysLose();

    // Lottery 先获胜再失败，最后恢复正常行为...
    Lottery::fix([true, false]);

    // Lottery 将恢复正常行为...
    Lottery::determineResultsNormally();
