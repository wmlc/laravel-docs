# 辅助函数

- [简介](#introduction)
- [可用方法](#available-methods)
- [其它工具](#other-utilities)
   - [基准测试](#benchmarking)
   - [日期](#dates)
   - [延迟函数](#deferred-functions)
   - [抽奖](#lottery)
   - [管道](#pipeline)
   - [休眠](#sleep)
   - [时间沙箱](#timebox)

<a name="introduction"></a>
## 简介

Laravel 内置了各种全局的 "helper" PHP 函数。其中许多函数由框架自身使用；不过，只要你觉得方便，也可以在自己的应用中使用它们。

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

<div class="collection-method-list" markdown="1">

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
[Arr::mapSpread](#method-array-map-spread)
[Arr::mapWithKeys](#method-array-map-with-keys)
[Arr::only](#method-array-only)
[Arr::pluck](#method-array-pluck)
[Arr::prepend](#method-array-prepend)
[Arr::prependKeysWith](#method-array-prependkeyswith)
[Arr::pull](#method-array-pull)
[Arr::query](#method-array-query)
[Arr::random](#method-array-random)
[Arr::reject](#method-array-reject)
[Arr::set](#method-array-set)
[Arr::shuffle](#method-array-shuffle)
[Arr::sort](#method-array-sort)
[Arr::sortDesc](#method-array-sort-desc)
[Arr::sortRecursive](#method-array-sort-recursive)
[Arr::take](#method-array-take)
[Arr::toCssClasses](#method-array-to-css-classes)
[Arr::toCssStyles](#method-array-to-css-styles)
[Arr::undot](#method-array-undot)
[Arr::where](#method-array-where)
[Arr::whereNotNull](#method-array-where-not-null)
[Arr::wrap](#method-array-wrap)
[data_fill](#method-data-fill)
[data_get](#method-data-get)
[data_set](#method-data-set)
[data_forget](#method-data-forget)
[head](#method-head)
[last](#method-last)
</div>

<a name="numbers-method-list"></a>
### 数字

<div class="collection-method-list" markdown="1">

[Number::abbreviate](#method-number-abbreviate)
[Number::clamp](#method-number-clamp)
[Number::currency](#method-number-currency)
[Number::defaultCurrency](#method-default-currency)
[Number::defaultLocale](#method-default-locale)
[Number::fileSize](#method-number-file-size)
[Number::forHumans](#method-number-for-humans)
[Number::format](#method-number-format)
[Number::ordinal](#method-number-ordinal)
[Number::pairs](#method-number-pairs)
[Number::percentage](#method-number-percentage)
[Number::spell](#method-number-spell)
[Number::trim](#method-number-trim)
[Number::useLocale](#method-number-use-locale)
[Number::withLocale](#method-number-with-locale)
[Number::useCurrency](#method-number-use-currency)
[Number::withCurrency](#method-number-with-currency)

</div>

<a name="paths-method-list"></a>
### 路径

<div class="collection-method-list" markdown="1">

[app_path](#method-app-path)
[base_path](#method-base-path)
[config_path](#method-config-path)
[database_path](#method-database-path)
[lang_path](#method-lang-path)
[mix](#method-mix)
[public_path](#method-public-path)
[resource_path](#method-resource-path)
[storage_path](#method-storage-path)

</div>

<a name="urls-method-list"></a>
### URL

<div class="collection-method-list" markdown="1">

[action](#method-action)
[asset](#method-asset)
[route](#method-route)
[secure_asset](#method-secure-asset)
[secure_url](#method-secure-url)
[to_route](#method-to-route)
[url](#method-url)

</div>

<a name="miscellaneous-method-list"></a>
### 杂项

<div class="collection-method-list" markdown="1">

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
[context](#method-context)
[cookie](#method-cookie)
[csrf_field](#method-csrf-field)
[csrf_token](#method-csrf-token)
[decrypt](#method-decrypt)
[dd](#method-dd)
[dispatch](#method-dispatch)
[dispatch_sync](#method-dispatch-sync)
[dump](#method-dump)
[encrypt](#method-encrypt)
[env](#method-env)
[event](#method-event)
[fake](#method-fake)
[filled](#method-filled)
[info](#method-info)
[literal](#method-literal)
[logger](#method-logger)
[method_field](#method-method-field)
[now](#method-now)
[old](#method-old)
[once](#method-once)
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
[when](#method-when)

</div>

<a name="arrays"></a>
## 数组与对象

<a name="method-array-accessible"></a>
#### `Arr::accessible()` {.collection-method .first-collection-method}

`Arr::accessible` 方法判断给定的值是否可作为数组访问：

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

如果给定的键在数组中不存在，或其值为 `null`，那么 `Arr::add` 方法会把给定的键 / 值对添加到数组中：

    use Illuminate\Support\Arr;

    $array = Arr::add(['name' => 'Desk'], 'price', 100);

    // ['name' => 'Desk', 'price' => 100]

    $array = Arr::add(['name' => 'Desk', 'price' => null], 'price', 100);

    // ['name' => 'Desk', 'price' => 100]

<a name="method-array-collapse"></a>
#### `Arr::collapse()` {.collection-method}

`Arr::collapse` 方法把数组的数组折叠为一个单一数组：

    use Illuminate\Support\Arr;

    $array = Arr::collapse([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);

    // [1, 2, 3, 4, 5, 6, 7, 8, 9]

<a name="method-array-crossjoin"></a>
#### `Arr::crossJoin()` {.collection-method}

`Arr::crossJoin` 方法交叉连接给定的数组，返回包含所有可能排列的笛卡尔积：

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

`Arr::dot` 方法把多维数组扁平化为单层数组，并用 "点" 记号表示深度：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    $flattened = Arr::dot($array);

    // ['products.desk.price' => 100]

<a name="method-array-except"></a>
#### `Arr::except()` {.collection-method}

`Arr::except` 方法从数组中移除给定的键 / 值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100];

    $filtered = Arr::except($array, ['price']);

    // ['name' => 'Desk']

<a name="method-array-exists"></a>
#### `Arr::exists()` {.collection-method}

`Arr::exists` 方法检查给定的键是否存在于所提供的数组中：

    use Illuminate\Support\Arr;

    $array = ['name' => 'John Doe', 'age' => 17];

    $exists = Arr::exists($array, 'name');

    // true

    $exists = Arr::exists($array, 'salary');

    // false

<a name="method-array-first"></a>
#### `Arr::first()` {.collection-method}

`Arr::first` 方法返回数组中通过给定真值测试的第一个元素：

    use Illuminate\Support\Arr;

    $array = [100, 200, 300];

    $first = Arr::first($array, function (int $value, int $key) {
        return $value >= 150;
    });

    // 200

你也可以把默认值作为该方法的第三个参数传入。如果没有元素通过真值测试，将返回这个值：

    use Illuminate\Support\Arr;

    $first = Arr::first($array, $callback, $default);

<a name="method-array-flatten"></a>
#### `Arr::flatten()` {.collection-method}

`Arr::flatten` 方法把多维数组扁平化为单层数组：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

    $flattened = Arr::flatten($array);

    // ['Joe', 'PHP', 'Ruby']

<a name="method-array-forget"></a>
#### `Arr::forget()` {.collection-method}

`Arr::forget` 方法使用 "点" 记号从深层嵌套的数组中移除给定的键 / 值对：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    Arr::forget($array, 'products.desk');

    // ['products' => []]

<a name="method-array-get"></a>
#### `Arr::get()` {.collection-method}

`Arr::get` 方法使用 "点" 记号从深层嵌套的数组中获取一个值：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    $price = Arr::get($array, 'products.desk.price');

    // 100

`Arr::get` 方法还接受一个默认值；如果数组中不存在指定的键，就返回该默认值：

    use Illuminate\Support\Arr;

    $discount = Arr::get($array, 'products.desk.discount', 0);

    // 0

<a name="method-array-has"></a>
#### `Arr::has()` {.collection-method}

`Arr::has` 方法使用 "点" 记号检查给定的一个或多个元素是否存在于数组中：

    use Illuminate\Support\Arr;

    $array = ['product' => ['name' => 'Desk', 'price' => 100]];

    $contains = Arr::has($array, 'product.name');

    // true

    $contains = Arr::has($array, ['product.price', 'product.discount']);

    // false

<a name="method-array-hasany"></a>
#### `Arr::hasAny()` {.collection-method}

`Arr::hasAny` 方法使用 "点" 记号检查给定集合中是否有任意元素存在于数组中：

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

如果给定数组是关联数组，`Arr::isAssoc` 方法返回 `true`。如果数组的键不是从零开始的连续数字键，就认为它是 "关联" 数组：

    use Illuminate\Support\Arr;

    $isAssoc = Arr::isAssoc(['product' => ['name' => 'Desk', 'price' => 100]]);

    // true

    $isAssoc = Arr::isAssoc([1, 2, 3]);

    // false

<a name="method-array-islist"></a>
#### `Arr::isList()` {.collection-method}

如果给定数组的键是从零开始连续的整数，`Arr::isList` 方法返回 `true`：

    use Illuminate\Support\Arr;

    $isList = Arr::isList(['foo', 'bar', 'baz']);

    // true

    $isList = Arr::isList(['product' => ['name' => 'Desk', 'price' => 100]]);

    // false

<a name="method-array-join"></a>
#### `Arr::join()` {.collection-method}

`Arr::join` 方法用字符串连接数组元素。通过该方法的第二个参数，你还可以指定数组最后一个元素所用的连接字符串：

    use Illuminate\Support\Arr;

    $array = ['Tailwind', 'Alpine', 'Laravel', 'Livewire'];

    $joined = Arr::join($array, ', ');

    // Tailwind, Alpine, Laravel, Livewire

    $joined = Arr::join($array, ', ', ' and ');

    // Tailwind, Alpine, Laravel and Livewire

<a name="method-array-keyby"></a>
#### `Arr::keyBy()` {.collection-method}

`Arr::keyBy` 方法按给定的键为数组重新索引。如果多个元素拥有相同的键，那么新数组中只会出现最后一个：

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

`Arr::last` 方法返回数组中通过给定真值测试的最后一个元素：

    use Illuminate\Support\Arr;

    $array = [100, 200, 300, 110];

    $last = Arr::last($array, function (int $value, int $key) {
        return $value >= 150;
    });

    // 300

你也可以把默认值作为该方法的第三个参数传入。如果没有元素通过真值测试，将返回这个值：

    use Illuminate\Support\Arr;

    $last = Arr::last($array, $callback, $default);

<a name="method-array-map"></a>
#### `Arr::map()` {.collection-method}

`Arr::map` 方法遍历数组，把每个值和键都传给给定的回调。数组中的值将被替换为回调返回的值：

    use Illuminate\Support\Arr;

    $array = ['first' => 'james', 'last' => 'kirk'];

    $mapped = Arr::map($array, function (string $value, string $key) {
        return ucfirst($value);
    });

    // ['first' => 'James', 'last' => 'Kirk']

<a name="method-array-map-spread"></a>
#### `Arr::mapSpread()` {.collection-method}

`Arr::mapSpread` 方法遍历数组，把每个嵌套元素的值传给给定的闭包。闭包可以修改该元素并返回它，从而组成一个由修改后元素构成的新数组：

    use Illuminate\Support\Arr;

    $array = [
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
        [8, 9],
    ];

    $mapped = Arr::mapSpread($array, function (int $even, int $odd) {
        return $even + $odd;
    });

    /*
        [1, 5, 9, 13, 17]
    */

<a name="method-array-map-with-keys"></a>
#### `Arr::mapWithKeys()` {.collection-method}

`Arr::mapWithKeys` 方法遍历数组，把每个值传给给定的回调。该回调应当返回一个包含单个键 / 值对的关联数组：

    use Illuminate\Support\Arr;

    $array = [
        [
            'name' => 'John',
            'department' => 'Sales',
            'email' => 'john@example.com',
        ],
        [
            'name' => 'Jane',
            'department' => 'Marketing',
            'email' => 'jane@example.com',
        ]
    ];

    $mapped = Arr::mapWithKeys($array, function (array $item, int $key) {
        return [$item['email'] => $item['name']];
    });

    /*
        [
            'john@example.com' => 'John',
            'jane@example.com' => 'Jane',
        ]
    */

<a name="method-array-only"></a>
#### `Arr::only()` {.collection-method}

`Arr::only` 方法只从给定数组中返回指定的键 / 值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100, 'orders' => 10];

    $slice = Arr::only($array, ['name', 'price']);

    // ['name' => 'Desk', 'price' => 100]

<a name="method-array-pluck"></a>
#### `Arr::pluck()` {.collection-method}

`Arr::pluck` 方法从数组中获取给定键对应的所有值：

    use Illuminate\Support\Arr;

    $array = [
        ['developer' => ['id' => 1, 'name' => 'Taylor']],
        ['developer' => ['id' => 2, 'name' => 'Abigail']],
    ];

    $names = Arr::pluck($array, 'developer.name');

    // ['Taylor', 'Abigail']

你也可以指定希望结果列表使用哪些键来索引：

    use Illuminate\Support\Arr;

    $names = Arr::pluck($array, 'developer.name', 'developer.id');

    // [1 => 'Taylor', 2 => 'Abigail']

<a name="method-array-prepend"></a>
#### `Arr::prepend()` {.collection-method}

`Arr::prepend` 方法会把一个元素添加到数组的开头：

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

`Arr::prependKeysWith` 会给关联数组的所有键名添加给定的前缀：

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

`Arr::pull` 方法从数组中返回并移除一个键 / 值对：

    use Illuminate\Support\Arr;

    $array = ['name' => 'Desk', 'price' => 100];

    $name = Arr::pull($array, 'name');

    // $name: Desk

    // $array: ['price' => 100]

你也可以把默认值作为该方法的第三个参数传入。如果该键不存在，将返回这个值：

    use Illuminate\Support\Arr;

    $value = Arr::pull($array, $key, $default);

<a name="method-array-query"></a>
#### `Arr::query()` {.collection-method}

`Arr::query` 方法把数组转换为查询字符串：

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

你也可以通过可选的第二个参数指定要返回的元素数量。请注意，一旦提供该参数，即使只需要一个元素也会返回数组：

    use Illuminate\Support\Arr;

    $items = Arr::random($array, 2);

    // [2, 5] -（随机获取）

<a name="method-array-reject"></a>
#### `Arr::reject()` {.collection-method}

`Arr::reject` 方法使用给定的闭包从数组中移除元素：

    use Illuminate\Support\Arr;

    $array = [100, '200', 300, '400', 500];

    $filtered = Arr::reject($array, function (string|int $value, int $key) {
        return is_string($value);
    });

    // [0 => 100, 2 => 300, 4 => 500]

<a name="method-array-set"></a>
#### `Arr::set()` {.collection-method}

`Arr::set` 方法使用 "点" 记号在深层嵌套的数组中设置一个值：

    use Illuminate\Support\Arr;

    $array = ['products' => ['desk' => ['price' => 100]]];

    Arr::set($array, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 200]]]

<a name="method-array-shuffle"></a>
#### `Arr::shuffle()` {.collection-method}

`Arr::shuffle` 方法随机打乱数组中的元素：

    use Illuminate\Support\Arr;

    $array = Arr::shuffle([1, 2, 3, 4, 5]);

    // [3, 2, 5, 1, 4] -（随机生成）

<a name="method-array-sort"></a>
#### `Arr::sort()` {.collection-method}

`Arr::sort` 方法按数组的值对其排序：

    use Illuminate\Support\Arr;

    $array = ['Desk', 'Table', 'Chair'];

    $sorted = Arr::sort($array);

    // ['Chair', 'Desk', 'Table']

你也可以根据给定闭包的返回值对数组排序：

    use Illuminate\Support\Arr;

    $array = [
        ['name' => 'Desk'],
        ['name' => 'Table'],
        ['name' => 'Chair'],
    ];

    $sorted = array_values(Arr::sort($array, function (array $value) {
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

`Arr::sortDesc` 方法按数组的值对其进行降序排序：

    use Illuminate\Support\Arr;

    $array = ['Desk', 'Table', 'Chair'];

    $sorted = Arr::sortDesc($array);

    // ['Table', 'Desk', 'Chair']

你也可以根据给定闭包的返回值对数组排序：

    use Illuminate\Support\Arr;

    $array = [
        ['name' => 'Desk'],
        ['name' => 'Table'],
        ['name' => 'Chair'],
    ];

    $sorted = array_values(Arr::sortDesc($array, function (array $value) {
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

`Arr::sortRecursive` 方法递归地对数组排序：对数字索引的子数组使用 `sort` 函数，对关联子数组使用 `ksort` 函数：

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

如果你希望结果按降序排列，可以使用 `Arr::sortRecursiveDesc` 方法。

    $sorted = Arr::sortRecursiveDesc($array);

<a name="method-array-take"></a>
#### `Arr::take()` {.collection-method}

`Arr::take` 方法返回一个包含指定数量元素的新数组：

    use Illuminate\Support\Arr;

    $array = [0, 1, 2, 3, 4, 5];

    $chunk = Arr::take($array, 3);

    // [0, 1, 2]

你也可以传入一个负整数，从数组末尾开始取指定数量的元素：

    $array = [0, 1, 2, 3, 4, 5];

    $chunk = Arr::take($array, -2);

    // [4, 5]

<a name="method-array-to-css-classes"></a>
#### `Arr::toCssClasses()` {.collection-method}

`Arr::toCssClasses` 方法按条件编译 CSS 类字符串。该方法接受一个类数组，数组的键是你想要添加的类，值则是布尔表达式。如果数组元素使用数字键，它总会出现在渲染后的类列表中：

    use Illuminate\Support\Arr;

    $isActive = false;
    $hasError = true;

    $array = ['p-4', 'font-bold' => $isActive, 'bg-red' => $hasError];

    $classes = Arr::toCssClasses($array);

    /*
        'p-4 bg-red'
    */

<a name="method-array-to-css-styles"></a>
#### `Arr::toCssStyles()` {.collection-method}

`Arr::toCssStyles` 方法按条件编译 CSS 样式字符串。该方法接受一个类数组，数组的键是你想要添加的类，值则是布尔表达式。如果数组元素使用数字键，它总会出现在渲染后的类列表中：

```php
use Illuminate\Support\Arr;

$hasColor = true;

$array = ['background-color: blue', 'color: blue' => $hasColor];

$classes = Arr::toCssStyles($array);

/*
    'background-color: blue; color: blue;'
*/
```

该方法支撑了 Laravel 的两项功能：[与 Blade 组件的属性包合并类](/docs/{{version}}/blade#conditionally-merge-classes)，以及 `@class` [Blade 指令](/docs/{{version}}/blade#conditional-classes)。

<a name="method-array-undot"></a>
#### `Arr::undot()` {.collection-method}

`Arr::undot` 方法把使用 "点" 记号的单维数组展开为多维数组：

    use Illuminate\Support\Arr;

    $array = [
        'user.name' => 'Kevin Malone',
        'user.occupation' => 'Accountant',
    ];

    $array = Arr::undot($array);

    // ['user' => ['name' => 'Kevin Malone', 'occupation' => 'Accountant']]

<a name="method-array-where"></a>
#### `Arr::where()` {.collection-method}

`Arr::where` 方法使用给定的闭包过滤数组：

    use Illuminate\Support\Arr;

    $array = [100, '200', 300, '400', 500];

    $filtered = Arr::where($array, function (string|int $value, int $key) {
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

`Arr::wrap` 方法把给定值包装进数组中。如果给定值本身已是数组，将原样返回：

    use Illuminate\Support\Arr;

    $string = 'Laravel';

    $array = Arr::wrap($string);

    // ['Laravel']

如果给定的值为 `null`，将返回一个空数组：

    use Illuminate\Support\Arr;

    $array = Arr::wrap(null);

    // []

<a name="method-data-fill"></a>
#### `data_fill()` {.collection-method}

`data_fill` 函数使用 "点" 记号在嵌套数组或对象中设置缺失的值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_fill($data, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 100]]]

    data_fill($data, 'products.desk.discount', 10);

    // ['products' => ['desk' => ['price' => 100, 'discount' => 10]]]

该函数也接受星号作为通配符，并据此填充目标：

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

`data_get` 函数使用 "点" 记号从嵌套数组或对象中获取一个值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    $price = data_get($data, 'products.desk.price');

    // 100

`data_get` 函数还接受一个默认值；如果找不到指定的键，就返回该默认值：

    $discount = data_get($data, 'products.desk.discount', 0);

    // 0

该函数还接受使用星号表示的通配符，可以命中数组或对象的任意键：

    $data = [
        'product-one' => ['name' => 'Desk 1', 'price' => 100],
        'product-two' => ['name' => 'Desk 2', 'price' => 150],
    ];

    data_get($data, '*.name');

    // ['Desk 1', 'Desk 2'];

可以使用 `{first}` 和 `{last}` 占位符获取数组中的第一个或最后一个元素：

    $flight = [
        'segments' => [
            ['from' => 'LHR', 'departure' => '9:00', 'to' => 'IST', 'arrival' => '15:00'],
            ['from' => 'IST', 'departure' => '16:00', 'to' => 'PKX', 'arrival' => '20:00'],
        ],
    ];

    data_get($flight, 'segments.{first}.arrival');

    // 15:00

<a name="method-data-set"></a>
#### `data_set()` {.collection-method}

`data_set` 函数使用 "点" 记号在嵌套数组或对象中设置一个值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_set($data, 'products.desk.price', 200);

    // ['products' => ['desk' => ['price' => 200]]]

该函数还接受使用星号表示的通配符，并据此设置目标上的值：

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

默认情况下，已存在的值会被覆盖。如果希望仅在值不存在时才设置，可以把 `false` 作为该函数的第四个参数传入：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_set($data, 'products.desk.price', 200, overwrite: false);

    // ['products' => ['desk' => ['price' => 100]]]

<a name="method-data-forget"></a>
#### `data_forget()` {.collection-method}

`data_forget` 函数使用 "点" 记号移除嵌套数组或对象中的一个值：

    $data = ['products' => ['desk' => ['price' => 100]]];

    data_forget($data, 'products.desk.price');

    // ['products' => ['desk' => []]]

该函数还接受使用星号表示的通配符，并据此移除目标上的值：

    $data = [
        'products' => [
            ['name' => 'Desk 1', 'price' => 100],
            ['name' => 'Desk 2', 'price' => 150],
        ],
    ];

    data_forget($data, 'products.*.price');

    /*
        [
            'products' => [
                ['name' => 'Desk 1'],
                ['name' => 'Desk 2'],
            ],
        ]
    */

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

<a name="numbers"></a>
## 数字

<a name="method-number-abbreviate"></a>
#### `Number::abbreviate()` {.collection-method}

`Number::abbreviate` 方法返回所给数值的易读格式，并对单位做缩写：

    use Illuminate\Support\Number;

    $number = Number::abbreviate(1000);

    // 1K

    $number = Number::abbreviate(489939);

    // 490K

    $number = Number::abbreviate(1230000, precision: 2);

    // 1.23M

<a name="method-number-clamp"></a>
#### `Number::clamp()` {.collection-method}

`Number::clamp` 方法确保给定数字始终落在指定范围内。如果数字小于最小值，将返回最小值；如果数字大于最大值，将返回最大值：

    use Illuminate\Support\Number;

    $number = Number::clamp(105, min: 10, max: 100);

    // 100

    $number = Number::clamp(5, min: 10, max: 100);

    // 10

    $number = Number::clamp(10, min: 10, max: 100);

    // 10

    $number = Number::clamp(20, min: 10, max: 100);

    // 20

<a name="method-number-currency"></a>
#### `Number::currency()` {.collection-method}

`Number::currency` 方法以字符串形式返回给定值的货币表示：

    use Illuminate\Support\Number;

    $currency = Number::currency(1000);

    // $1,000.00

    $currency = Number::currency(1000, in: 'EUR');

    // €1,000.00

    $currency = Number::currency(1000, in: 'EUR', locale: 'de');

    // 1.000,00 €

<a name="method-default-currency"></a>
#### `Number::defaultCurrency()` {.collection-method}

`Number::defaultCurrency` 方法返回 `Number` 类当前使用的默认货币：

    use Illuminate\Support\Number;

    $currency = Number::defaultCurrency();

    // USD

<a name="method-default-locale"></a>
#### `Number::defaultLocale()` {.collection-method}

`Number::defaultLocale` 方法返回 `Number` 类当前使用的默认区域设置：

    use Illuminate\Support\Number;

    $locale = Number::defaultLocale();

    // en

<a name="method-number-file-size"></a>
#### `Number::fileSize()` {.collection-method}

`Number::fileSize` 方法以字符串形式返回给定字节值的文件大小表示：

    use Illuminate\Support\Number;

    $size = Number::fileSize(1024);

    // 1 KB

    $size = Number::fileSize(1024 * 1024);

    // 1 MB

    $size = Number::fileSize(1024, precision: 2);

    // 1.00 KB

<a name="method-number-for-humans"></a>
#### `Number::forHumans()` {.collection-method}

`Number::forHumans` 方法返回所给数值的易读格式：

    use Illuminate\Support\Number;

    $number = Number::forHumans(1000);

    // 1 thousand

    $number = Number::forHumans(489939);

    // 490 thousand

    $number = Number::forHumans(1230000, precision: 2);

    // 1.23 million

<a name="method-number-format"></a>
#### `Number::format()` {.collection-method}

`Number::format` 方法把给定数字格式化为特定区域设置的字符串：

    use Illuminate\Support\Number;

    $number = Number::format(100000);

    // 100,000

    $number = Number::format(100000, precision: 2);

    // 100,000.00

    $number = Number::format(100000.123, maxPrecision: 2);

    // 100,000.12

    $number = Number::format(100000, locale: 'de');

    // 100.000

<a name="method-number-ordinal"></a>
#### `Number::ordinal()` {.collection-method}

`Number::ordinal` 方法返回数字的序数表示：

    use Illuminate\Support\Number;

    $number = Number::ordinal(1);

    // 1st

    $number = Number::ordinal(2);

    // 2nd

    $number = Number::ordinal(21);

    // 21st

<a name="method-number-pairs"></a>
#### `Number::pairs()` {.collection-method}

`Number::pairs` 方法根据指定的范围和步长生成数字对（子区间）数组。在分页或批处理等场景中，你可以用它把较大的数字范围切分为若干更小、更易处理的子区间。`pairs` 方法返回一个数组的数组，其中每个内层数组都表示一对（一个子区间）数字：

```php
use Illuminate\Support\Number;

$result = Number::pairs(25, 10);

// [[1, 10], [11, 20], [21, 25]]

$result = Number::pairs(25, 10, offset: 0);

// [[0, 10], [10, 20], [20, 25]]
```

<a name="method-number-percentage"></a>
#### `Number::percentage()` {.collection-method}

`Number::percentage` 方法以字符串形式返回给定值的百分比表示：

    use Illuminate\Support\Number;

    $percentage = Number::percentage(10);

    // 10%

    $percentage = Number::percentage(10, precision: 2);

    // 10.00%

    $percentage = Number::percentage(10.123, maxPrecision: 2);

    // 10.12%

    $percentage = Number::percentage(10, precision: 2, locale: 'de');

    // 10,00%

<a name="method-number-spell"></a>
#### `Number::spell()` {.collection-method}

`Number::spell` 方法把给定数字转换为单词形式的字符串：

    use Illuminate\Support\Number;

    $number = Number::spell(102);

    // one hundred and two

    $number = Number::spell(88, locale: 'fr');

    // quatre-vingt-huit

`after` 参数允许你指定一个值，只有超过该值的数字才会拼写为单词：

    $number = Number::spell(10, after: 10);

    // 10

    $number = Number::spell(11, after: 10);

    // eleven

`until` 参数允许你指定一个值，只有小于该值的数字才会拼写为单词：

    $number = Number::spell(5, until: 10);

    // five

    $number = Number::spell(10, until: 10);

    // 10

<a name="method-number-trim"></a>
#### `Number::trim()` {.collection-method}

`Number::trim` 方法移除给定数字小数点后的所有末尾零：

    use Illuminate\Support\Number;

    $number = Number::trim(12.0);

    // 12

    $number = Number::trim(12.30);

    // 12.3

<a name="method-number-use-locale"></a>
#### `Number::useLocale()` {.collection-method}

`Number::useLocale` 方法全局设置默认的数字区域设置，它会影响后续调用 `Number` 类方法时数字与货币的格式化方式：

    use Illuminate\Support\Number;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Number::useLocale('de');
    }

<a name="method-number-with-locale"></a>
#### `Number::withLocale()` {.collection-method}

`Number::withLocale` 方法使用指定的区域设置执行给定的闭包，回调执行完毕后恢复原来的区域设置：

    use Illuminate\Support\Number;

    $number = Number::withLocale('de', function () {
        return Number::format(1500);
    });

<a name="method-number-use-currency"></a>
#### `Number::useCurrency()` {.collection-method}

`Number::useCurrency` 方法全局设置默认的数字货币，它会影响后续调用 `Number` 类方法时货币的格式化方式：

    use Illuminate\Support\Number;

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Number::useCurrency('GBP');
    }

<a name="method-number-with-currency"></a>
#### `Number::withCurrency()` {.collection-method}

`Number::withCurrency` 方法使用指定的货币执行给定的闭包，回调执行完毕后恢复原来的货币：

    use Illuminate\Support\Number;

    $number = Number::withCurrency('GBP', function () {
        // ...
    });

<a name="paths"></a>
## 路径

<a name="method-app-path"></a>
#### `app_path()` {.collection-method}

`app_path` 函数返回应用 `app` 目录的完整路径。你也可以用 `app_path` 函数生成相对于该应用目录下某个文件的完整路径：

    $path = app_path();

    $path = app_path('Http/Controllers/Controller.php');

<a name="method-base-path"></a>
#### `base_path()` {.collection-method}

`base_path` 函数返回应用根目录的完整路径。你也可以用 `base_path` 函数生成相对于项目根目录下某个路径的完整路径：

    $path = base_path();

    $path = base_path('vendor/bin');

<a name="method-config-path"></a>
#### `config_path()` {.collection-method}

`config_path` 函数返回应用 `config` 目录的完整路径。你也可以用 `config_path` 函数生成该应用配置目录下某个文件的完整路径：

    $path = config_path();

    $path = config_path('app.php');

<a name="method-database-path"></a>
#### `database_path()` {.collection-method}

`database_path` 函数返回应用 `database` 目录的完整路径。你也可以用 `database_path` 函数生成数据库目录下某个文件的完整路径：

    $path = database_path();

    $path = database_path('factories/UserFactory.php');

<a name="method-lang-path"></a>
#### `lang_path()` {.collection-method}

`lang_path` 函数返回应用 `lang` 目录的完整路径。你也可以用 `lang_path` 函数生成该目录下某个文件的完整路径：

    $path = lang_path();

    $path = lang_path('en/messages.php');

> [!NOTE]
> 默认情况下，Laravel 应用骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="method-mix"></a>
#### `mix()` {.collection-method}

`mix` 函数返回[带版本号的 Mix 文件](/docs/{{version}}/mix)的路径：

    $path = mix('css/app.css');

<a name="method-public-path"></a>
#### `public_path()` {.collection-method}

`public_path` 函数返回应用 `public` 目录的完整路径。你也可以用 `public_path` 函数生成 public 目录下某个文件的完整路径：

    $path = public_path();

    $path = public_path('css/app.css');

<a name="method-resource-path"></a>
#### `resource_path()` {.collection-method}

`resource_path` 函数返回应用 `resources` 目录的完整路径。你也可以用 `resource_path` 函数生成 resources 目录下某个文件的完整路径：

    $path = resource_path();

    $path = resource_path('sass/app.scss');

<a name="method-storage-path"></a>
#### `storage_path()` {.collection-method}

`storage_path` 函数返回应用 `storage` 目录的完整路径。你也可以用 `storage_path` 函数生成 storage 目录下某个文件的完整路径：

    $path = storage_path();

    $path = storage_path('app/file.txt');

<a name="urls"></a>
## URL

<a name="method-action"></a>
#### `action()` {.collection-method}

`action` 函数为给定的控制器动作生成 URL：

    use App\Http\Controllers\HomeController;

    $url = action([HomeController::class, 'index']);

如果该方法接受路由参数，可以把它们作为方法的第二个参数传入：

    $url = action([UserController::class, 'profile'], ['id' => 1]);

<a name="method-asset"></a>
#### `asset()` {.collection-method}

`asset` 函数使用当前请求的协议（HTTP 或 HTTPS）为资源生成 URL：

    $url = asset('img/photo.jpg');

你可以在 `.env` 文件中设置 `ASSET_URL` 变量来配置资源 URL 的主机。如果资源托管在 Amazon S3 或其它 CDN 之类的外部服务上，这会很有用：

    // ASSET_URL=http://example.com/assets

    $url = asset('img/photo.jpg'); // http://example.com/assets/img/photo.jpg

<a name="method-route"></a>
#### `route()` {.collection-method}

`route` 函数为给定的[命名路由](/docs/{{version}}/routing#named-routes)生成 URL：

    $url = route('route.name');

如果该路由接受参数，可以把它们作为函数的第二个参数传入：

    $url = route('route.name', ['id' => 1]);

默认情况下，`route` 函数生成绝对 URL。如果希望生成相对 URL，可以把 `false` 作为函数的第三个参数传入：

    $url = route('route.name', ['id' => 1], false);

<a name="method-secure-asset"></a>
#### `secure_asset()` {.collection-method}

`secure_asset` 函数使用 HTTPS 为资源生成 URL：

    $url = secure_asset('img/photo.jpg');

<a name="method-secure-url"></a>
#### `secure_url()` {.collection-method}

`secure_url` 函数为给定路径生成完整的 HTTPS URL。可以通过函数的第二个参数传入额外的 URL 片段：

    $url = secure_url('user/profile');

    $url = secure_url('user/profile', [1]);

<a name="method-to-route"></a>
#### `to_route()` {.collection-method}

`to_route` 函数为给定的[命名路由](/docs/{{version}}/routing#named-routes)生成[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)：

    return to_route('users.show', ['user' => 1]);

如有需要，可以把要指派给该重定向的 HTTP 状态码以及额外的响应头，作为 `to_route` 方法的第三、第四个参数传入：

    return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);

<a name="method-url"></a>
#### `url()` {.collection-method}

`url` 函数为给定路径生成完整的 URL：

    $url = url('user/profile');

    $url = url('user/profile', [1]);

如果没有提供路径，则返回一个 `Illuminate\Routing\UrlGenerator` 实例：

    $current = url()->current();

    $full = url()->full();

    $previous = url()->previous();

<a name="miscellaneous"></a>
## 杂项

<a name="method-abort"></a>
#### `abort()` {.collection-method}

`abort` 函数抛出一个 [HTTP 异常](/docs/{{version}}/errors#http-exceptions)，该异常交由[异常处理器](/docs/{{version}}/errors#handling-exceptions)渲染：

    abort(403);

你还可以提供该异常的消息，以及要发送给浏览器的自定义 HTTP 响应头：

    abort(403, 'Unauthorized.', $headers);

<a name="method-abort-if"></a>
#### `abort_if()` {.collection-method}

如果给定的布尔表达式求值为 `true`，`abort_if` 函数会抛出一个 HTTP 异常：

    abort_if(! Auth::user()->isAdmin(), 403);

与 `abort` 方法一样，你还可以把异常的响应文本作为第三个参数、自定义响应头数组作为第四个参数传给该函数。

<a name="method-abort-unless"></a>
#### `abort_unless()` {.collection-method}

如果给定的布尔表达式求值为 `false`，`abort_unless` 函数会抛出一个 HTTP 异常：

    abort_unless(Auth::user()->isAdmin(), 403);

与 `abort` 方法一样，你还可以把异常的响应文本作为第三个参数、自定义响应头数组作为第四个参数传给该函数。

<a name="method-app"></a>
#### `app()` {.collection-method}

`app` 函数返回[服务容器（Service Container）](/docs/{{version}}/container)实例：

    $container = app();

你可以传入类名或接口名，从容器中解析出对应实例：

    $api = app('HelpSpot\API');

<a name="method-auth"></a>
#### `auth()` {.collection-method}

`auth` 函数返回一个[认证器](/docs/{{version}}/authentication)实例。你可以用它替代 `Auth` Facade：

    $user = auth()->user();

如有需要，你可以指定要访问哪个 guard 实例：

    $user = auth('admin')->user();

<a name="method-back"></a>
#### `back()` {.collection-method}

`back` 函数生成一个指向用户上一个位置的[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)：

    return back($status = 302, $headers = [], $fallback = '/');

    return back();

<a name="method-bcrypt"></a>
#### `bcrypt()` {.collection-method}

`bcrypt` 函数使用 Bcrypt 对给定值进行[哈希](/docs/{{version}}/hashing)。你可以用它替代 `Hash` Facade：

    $password = bcrypt('my-secret-password');

<a name="method-blank"></a>
#### `blank()` {.collection-method}

`blank` 函数判断给定值是否为 "空"：

    blank('');
    blank('   ');
    blank(null);
    blank(collect());

    // true

    blank(0);
    blank(true);
    blank(false);

    // false

关于 `blank` 的反向操作，请参阅 [`filled`](#method-filled) 方法。

<a name="method-broadcast"></a>
#### `broadcast()` {.collection-method}

`broadcast` 函数把给定的[事件](/docs/{{version}}/events)[广播](/docs/{{version}}/broadcasting)给它的监听器：

    broadcast(new UserRegistered($user));

    broadcast(new UserRegistered($user))->toOthers();

<a name="method-cache"></a>
#### `cache()` {.collection-method}

`cache` 函数可用于从[缓存](/docs/{{version}}/cache)中获取值。如果给定的键在缓存中不存在，将返回一个可选的默认值：

    $value = cache('key');

    $value = cache('key', 'default');

你可以向该函数传入一个键 / 值对数组，把条目加入缓存。同时还应传入缓存值被视为有效的秒数或时长：

    cache(['key' => 'value'], 300);

    cache(['key' => 'value'], now()->addSeconds(10));

<a name="method-class-uses-recursive"></a>
#### `class_uses_recursive()` {.collection-method}

`class_uses_recursive` 函数返回某个类使用的所有 Trait，包括其所有父类使用的 Trait：

    $traits = class_uses_recursive(App\Models\User::class);

<a name="method-collect"></a>
#### `collect()` {.collection-method}

`collect` 函数根据给定值创建一个[集合](/docs/{{version}}/collections)实例：

    $collection = collect(['taylor', 'abigail']);

<a name="method-config"></a>
#### `config()` {.collection-method}

`config` 函数获取[配置](/docs/{{version}}/configuration)变量的值。访问配置值时可以使用 "点" 语法，其中包含文件名和你想访问的选项。你还可以指定一个默认值，当该配置项不存在时就返回它：

    $value = config('app.timezone');

    $value = config('app.timezone', $default);

你可以在运行时通过传入键 / 值对数组来设置配置变量。不过请注意，该函数只影响当前请求的配置值，不会更新实际的配置文件：

    config(['app.debug' => true]);

<a name="method-context"></a>
#### `context()` {.collection-method}

`context` 函数从[当前上下文](/docs/{{version}}/context)中获取值。你还可以指定一个默认值，当该上下文键不存在时就返回它：

    $value = context('trace_id');

    $value = context('trace_id', $default);

你可以通过传入键 / 值对数组来设置上下文值：

    use Illuminate\Support\Str;

    context(['trace_id' => Str::uuid()->toString()]);

<a name="method-cookie"></a>
#### `cookie()` {.collection-method}

`cookie` 函数创建一个新的[Cookie](/docs/{{version}}/requests#cookies)实例：

    $cookie = cookie('name', 'value', $minutes);

<a name="method-csrf-field"></a>
#### `csrf_field()` {.collection-method}

`csrf_field` 函数生成一个包含 CSRF 令牌值的 HTML `hidden` 输入框。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

    {{ csrf_field() }}

<a name="method-csrf-token"></a>
#### `csrf_token()` {.collection-method}

`csrf_token` 函数获取当前 CSRF 令牌的值：

    $token = csrf_token();

<a name="method-decrypt"></a>
#### `decrypt()` {.collection-method}

`decrypt` 函数对给定值进行[解密](/docs/{{version}}/encryption)。你可以用它替代 `Crypt` Facade：

    $password = decrypt($value);

<a name="method-dd"></a>
#### `dd()` {.collection-method}

`dd` 函数转储给定变量并结束脚本执行：

    dd($value);

    dd($value1, $value2, $value3, ...);

如果你不希望中止脚本执行，请改用 [`dump`](#method-dump) 函数。

<a name="method-dispatch"></a>
#### `dispatch()` {.collection-method}

`dispatch` 函数把给定的[任务](/docs/{{version}}/queues#creating-jobs)推入 Laravel 的[任务队列](/docs/{{version}}/queues)：

    dispatch(new App\Jobs\SendEmails);

<a name="method-dispatch-sync"></a>
#### `dispatch_sync()` {.collection-method}

`dispatch_sync` 函数把给定任务推入[同步](/docs/{{version}}/queues#synchronous-dispatching)队列，使其立即被处理：

    dispatch_sync(new App\Jobs\SendEmails);

<a name="method-dump"></a>
#### `dump()` {.collection-method}

`dump` 函数转储给定变量：

    dump($value);

    dump($value1, $value2, $value3, ...);

如果你希望在转储变量后停止执行脚本，请改用 [`dd`](#method-dd) 函数。

<a name="method-encrypt"></a>
#### `encrypt()` {.collection-method}

`encrypt` 函数对给定值进行[加密](/docs/{{version}}/encryption)。你可以用它替代 `Crypt` Facade：

    $secret = encrypt('my-secret-value');

<a name="method-env"></a>
#### `env()` {.collection-method}

`env` 函数获取[环境变量](/docs/{{version}}/configuration#environment-configuration)的值，或返回一个默认值：

    $env = env('APP_ENV');

    $env = env('APP_ENV', 'production');

> [!WARNING]
> 如果你在部署过程中执行了 `config:cache` 命令，请确保只在配置文件中调用 `env` 函数。配置一旦被缓存，`.env` 文件就不会被加载，所有对 `env` 函数的调用都会返回 `null`。

<a name="method-event"></a>
#### `event()` {.collection-method}

`event` 函数把给定的[事件](/docs/{{version}}/events)分发给它的监听器：

    event(new UserRegistered($user));

<a name="method-fake"></a>
#### `fake()` {.collection-method}

`fake` 函数从容器中解析出 [Faker](https://github.com/FakerPHP/Faker) 单例。在模型工厂、数据库数据填充、测试和视图原型中创建假数据时，它会非常有用：

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

默认情况下，`fake` 函数会使用 `config/app.php` 配置中的 `app.faker_locale` 配置项。该配置项通常通过 `APP_FAKER_LOCALE` 环境变量设置。你也可以把区域设置传给 `fake` 函数来指定。每个区域设置都会解析出各自的单例：

    fake('nl_NL')->name()

<a name="method-filled"></a>
#### `filled()` {.collection-method}

`filled` 函数判断给定值是否 "非空"：

    filled(0);
    filled(true);
    filled(false);

    // true

    filled('');
    filled('   ');
    filled(null);
    filled(collect());

    // false

关于 `filled` 的反向操作，请参阅 [`blank`](#method-blank) 方法。

<a name="method-info"></a>
#### `info()` {.collection-method}

`info` 函数会向应用的[日志](/docs/{{version}}/logging)写入信息：

    info('Some helpful information!');

你还可以向该函数传入一个上下文数据数组：

    info('User login attempt failed.', ['id' => $user->id]);

<a name="method-literal"></a>
#### `literal()` {.collection-method}

`literal` 函数创建一个新的 [stdClass](https://www.php.net/manual/en/class.stdclass.php) 实例，并把给定的具名参数作为其属性：

    $obj = literal(
        name: 'Joe',
        languages: ['PHP', 'Ruby'],
    );

    $obj->name; // 'Joe'
    $obj->languages; // ['PHP', 'Ruby']

<a name="method-logger"></a>
#### `logger()` {.collection-method}

`logger` 函数可用于向[日志](/docs/{{version}}/logging)写入一条 `debug` 级别的消息：

    logger('Debug message');

你还可以向该函数传入一个上下文数据数组：

    logger('User has logged in.', ['id' => $user->id]);

如果不给该函数传值，将返回一个[日志记录器](/docs/{{version}}/logging)实例：

    logger()->error('You are not allowed here.');

<a name="method-method-field"></a>
#### `method_field()` {.collection-method}

`method_field` 函数生成一个 HTML `hidden` 输入框，其中包含表单 HTTP 动词的伪造值。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

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

由于作为 `old` 函数第二个参数传入的 "默认值" 通常是 Eloquent 模型的某个属性，Laravel 允许你直接把整个 Eloquent 模型作为 `old` 函数的第二个参数传入。这样做时，Laravel 会认为传给 `old` 函数的第一个参数就是应当被视为 "默认值" 的 Eloquent 属性名：

    {{ old('name', $user->name) }}

    // 等价于...

    {{ old('name', $user) }}

<a name="method-once"></a>
#### `once()` {.collection-method}

`once` 函数执行给定的回调，并在本次请求期间把结果缓存到内存中。之后使用同一回调再次调用 `once` 函数时，都会返回先前缓存的结果：

    function random(): int
    {
        return once(function () {
            return random_int(1, 1000);
        });
    }

    random(); // 123
    random(); // 123（缓存结果）
    random(); // 123（缓存结果）

如果在某个对象实例中执行 `once` 函数，缓存结果将仅限于该对象实例：

```php
<?php

class NumberService
{
    public function all(): array
    {
        return once(fn () => [1, 2, 3]);
    }
}

$service = new NumberService;

$service->all();
$service->all(); //（缓存结果）

$secondService = new NumberService;

$secondService->all();
$secondService->all(); //（缓存结果）
```
<a name="method-optional"></a>
#### `optional()` {.collection-method}

`optional` 函数接受任意参数，并允许你访问该对象的属性或调用其方法。如果给定对象为 `null`，属性和方法将返回 `null`，而不会抛出错误：

    return optional($user->address)->street;

    {!! old('name', optional($user)->name) !!}

`optional` 函数还接受一个闭包作为第二个参数。如果作为第一个参数传入的值不为 null，该闭包就会被调用：

    return optional(User::find($id), function (User $user) {
        return $user->name;
    });

<a name="method-policy"></a>
#### `policy()` {.collection-method}

`policy` 方法获取给定类对应的[策略](/docs/{{version}}/authorization#creating-policies)实例：

    $policy = policy(App\Models\User::class);

<a name="method-redirect"></a>
#### `redirect()` {.collection-method}

`redirect` 函数返回一个[重定向 HTTP 响应](/docs/{{version}}/responses#redirects)；如果不带参数调用，则返回重定向器实例：

    return redirect($to = null, $status = 302, $headers = [], $https = null);

    return redirect('/home');

    return redirect()->route('route.name');

<a name="method-report"></a>
#### `report()` {.collection-method}

`report` 函数会通过你的[异常处理器](/docs/{{version}}/errors#handling-exceptions)上报一个异常：

    report($e);

`report` 函数也接受一个字符串参数。当传入字符串时，该函数会以该字符串作为消息创建一个异常：

    report('Something went wrong.');

<a name="method-report-if"></a>
#### `report_if()` {.collection-method}

如果给定条件为 `true`，`report_if` 函数会通过你的[异常处理器](/docs/{{version}}/errors#handling-exceptions)上报一个异常：

    report_if($shouldReport, $e);

    report_if($shouldReport, 'Something went wrong.');

<a name="method-report-unless"></a>
#### `report_unless()` {.collection-method}

如果给定条件为 `false`，`report_unless` 函数会通过你的[异常处理器](/docs/{{version}}/errors#handling-exceptions)上报一个异常：

    report_unless($reportingDisabled, $e);

    report_unless($reportingDisabled, 'Something went wrong.');

<a name="method-request"></a>
#### `request()` {.collection-method}

`request` 函数返回当前[请求](/docs/{{version}}/requests)实例，或从当前请求中获取某个输入字段的值：

    $request = request();

    $value = request('key', $default);

<a name="method-rescue"></a>
#### `rescue()` {.collection-method}

`rescue` 函数执行给定的闭包，并捕获执行期间发生的所有异常。所有被捕获的异常都会交给你的[异常处理器](/docs/{{version}}/errors#handling-exceptions)处理，但请求会继续执行：

    return rescue(function () {
        return $this->method();
    });

你还可以向 `rescue` 函数传入第二个参数。该参数将作为执行闭包期间发生异常时返回的 "默认" 值：

    return rescue(function () {
        return $this->method();
    }, false);

    return rescue(function () {
        return $this->method();
    }, function () {
        return $this->failure();
    });

可以向 `rescue` 函数传入一个 `report` 参数，用于判断是否应通过 `report` 函数上报该异常：

    return rescue(function () {
        return $this->method();
    }, report: function (Throwable $throwable) {
        return $throwable instanceof InvalidArgumentException;
    });

<a name="method-resolve"></a>
#### `resolve()` {.collection-method}

`resolve` 函数使用[服务容器（Service Container）](/docs/{{version}}/container)把给定的类名或接口名解析为实例：

    $api = resolve('HelpSpot\API');

<a name="method-response"></a>
#### `response()` {.collection-method}

`response` 函数创建一个[响应](/docs/{{version}}/responses)实例，或获取响应工厂的实例：

    return response('Hello World', 200, $headers);

    return response()->json(['foo' => 'bar'], 200, $headers);

<a name="method-retry"></a>
#### `retry()` {.collection-method}

`retry` 函数会尝试执行给定的回调，直到达到给定的最大尝试次数。如果回调没有抛出异常，将返回其返回值；如果回调抛出异常，则会自动重试。如果超过最大尝试次数，则会抛出该异常：

    return retry(5, function () {
        // 尝试 5 次，每次尝试之间休息 100 毫秒……
    }, 100);

如果你希望自行计算每次尝试之间休眠的毫秒数，可以把一个闭包作为 `retry` 函数的第三个参数传入：

    use Exception;

    return retry(5, function () {
        // ...
    }, function (int $attempt, Exception $exception) {
        return $attempt * 100;
    });

为方便起见，你也可以把一个数组作为 `retry` 函数的第一个参数传入。该数组用于确定后续每次尝试之间休眠的毫秒数：

    return retry([100, 200], function () {
        // 第一次重试休眠 100 毫秒，第二次重试休眠 200 毫秒……
    });

如果只想在特定条件下重试，可以把一个闭包作为 `retry` 函数的第四个参数传入：

    use Exception;

    return retry(5, function () {
        // ...
    }, 100, function (Exception $exception) {
        return $exception instanceof RetryException;
    });

<a name="method-session"></a>
#### `session()` {.collection-method}

`session` 函数可用于获取或设置[会话](/docs/{{version}}/session)值：

    $value = session('key');

你可以通过向该函数传入一个键 / 值对数组来设置值：

    session(['chairs' => 7, 'instruments' => 3]);

如果不给该函数传值，将返回会话存储实例：

    $value = session()->get('key');

    session()->put('key', $value);

<a name="method-tap"></a>
#### `tap()` {.collection-method}

`tap` 函数接受两个参数：任意的 `$value` 和一个闭包。`$value` 会传给该闭包，随后由 `tap` 函数返回。闭包的返回值无关紧要：

    $user = tap(User::first(), function (User $user) {
        $user->name = 'taylor';

        $user->save();
    });

如果不向 `tap` 函数传入闭包，你可以对给定的 `$value` 调用任意方法。无论被调用方法在其定义中实际返回什么，你所调用方法的返回值始终是 `$value`。例如，Eloquent 的 `update` 方法通常返回一个整数。不过，通过 `tap` 函数链式调用 `update` 方法，可以强制该方法返回模型自身：

    $user = tap($user)->update([
        'name' => $name,
        'email' => $email,
    ]);

如果想为某个类添加 `tap` 方法，可以把 `Illuminate\Support\Traits\Tappable` Trait 加入该类。该 Trait 的 `tap` 方法只接受一个 Closure 参数。对象实例本身会传给该 Closure，随后由 `tap` 方法返回：

    return $user->tap(function (User $user) {
        // ...
    });

<a name="method-throw-if"></a>
#### `throw_if()` {.collection-method}

如果给定的布尔表达式求值为 `true`，`throw_if` 函数会抛出给定的异常：

    throw_if(! Auth::user()->isAdmin(), AuthorizationException::class);

    throw_if(
        ! Auth::user()->isAdmin(),
        AuthorizationException::class,
        'You are not allowed to access this page.'
    );

<a name="method-throw-unless"></a>
#### `throw_unless()` {.collection-method}

如果给定的布尔表达式求值为 `false`，`throw_unless` 函数会抛出给定的异常：

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

`trait_uses_recursive` 函数返回某个 Trait 使用的所有 Trait：

    $traits = trait_uses_recursive(\Illuminate\Notifications\Notifiable::class);

<a name="method-transform"></a>
#### `transform()` {.collection-method}

如果给定值不是 [blank](#method-blank)，`transform` 函数就会在它上面执行闭包，然后返回该闭包的返回值：

    $callback = function (int $value) {
        return $value * 2;
    };

    $result = transform(5, $callback);

    // 10

你还可以把默认值或闭包作为该函数的第三个参数传入。如果给定值为空，将返回这个值：

    $result = transform(null, $callback, 'The value is blank');

    // The value is blank

<a name="method-validator"></a>
#### `validator()` {.collection-method}

`validator` 函数用给定的参数创建一个新的[验证器](/docs/{{version}}/validation)实例。你可以用它替代 `Validator` Facade：

    $validator = validator($data, $rules, $messages);

<a name="method-value"></a>
#### `value()` {.collection-method}

`value` 函数返回传给它的值。不过，如果你向该函数传入一个闭包，那么闭包会被执行，并返回它所返回的值：

    $result = value(true);

    // true

    $result = value(function () {
        return false;
    });

    // false

可以向 `value` 函数传入额外参数。如果第一个参数是闭包，那么这些额外参数会作为参数传给该闭包；否则它们将被忽略：

    $result = value(function (string $name) {
        return $name;
    }, 'Taylor');

    // 'Taylor'

<a name="method-view"></a>
#### `view()` {.collection-method}

`view` 函数获取一个[视图](/docs/{{version}}/views)实例：

    return view('auth.login');

<a name="method-with"></a>
#### `with()` {.collection-method}

`with` 函数返回传给它的值。如果闭包作为第二个参数传给该函数，那么闭包会被执行，并返回它所返回的值：

    $callback = function (mixed $value) {
        return is_numeric($value) ? $value * 2 : 0;
    };

    $result = with(5, $callback);

    // 10

    $result = with(null, $callback);

    // 0

    $result = with(5, null);

    // 5

<a name="method-when"></a>
#### `when()` {.collection-method}

如果给定条件求值为 `true`，`when` 函数返回传给它的值；否则返回 `null`。如果闭包作为第二个参数传给该函数，那么闭包会被执行，并返回它所返回的值：

    $value = when(true, 'Hello World');

    $value = when(true, fn () => 'Hello World');

`when` 函数主要用于按条件渲染 HTML 属性：

```blade
<div {!! when($condition, 'wire:poll="calculate"') !!}>
    ...
</div>
```

<a name="other-utilities"></a>
## 其它工具

<a name="benchmarking"></a>
### 基准测试

有时你可能希望快速测试应用中某些部分的性能。这时你可以使用 `Benchmark` 支持类，测量给定回调完成所需的毫秒数：

    <?php

    use App\Models\User;
    use Illuminate\Support\Benchmark;

    Benchmark::dd(fn () => User::find(1)); // 0.1 ms

    Benchmark::dd([
        'Scenario 1' => fn () => User::count(), // 0.5 ms
        'Scenario 2' => fn () => User::all()->count(), // 20.0 ms
    ]);

默认情况下，给定的回调只会执行一次（一轮迭代），其耗时将显示在浏览器 / 控制台中。

如果想多次调用某个回调，可以把该回调应执行的迭代次数指定为方法的第二个参数。当回调被执行多次时，`Benchmark` 类会返回它在所有迭代中执行该回调所耗费的平均毫秒数：

    Benchmark::dd(fn () => User::count(), iterations: 10); // 0.5 ms

有时你可能想在测量回调执行时间的同时，仍然获得该回调返回的值。`value` 方法会返回一个元组，其中包含回调返回的值以及执行该回调所耗费的毫秒数：

    [$count, $duration] = Benchmark::value(fn () => User::count());

<a name="dates"></a>
### 日期

Laravel 内置了 [Carbon](https://carbon.nesbot.com/docs/)，这是一个功能强大的日期与时间操作库。要创建新的 `Carbon` 实例，可以调用 `now` 函数。该函数在 Laravel 应用中全局可用：

```php
$now = now();
```

或者，你也可以使用 `Illuminate\Support\Carbon` 类创建新的 `Carbon` 实例：

```php
use Illuminate\Support\Carbon;

$now = Carbon::now();
```

如需了解 Carbon 及其功能的详细说明，请查阅 [Carbon 官方文档](https://carbon.nesbot.com/docs/)。

<a name="deferred-functions"></a>
### 延迟函数

> [!WARNING]
> 延迟函数目前处于 beta 阶段，我们正在收集社区反馈。

Laravel 的[队列任务](/docs/{{version}}/queues)允许你把任务加入队列以便在后台处理，但有时你只是有一些简单任务希望延后执行，又不想为此配置并维护一个长期运行的队列工作进程。

延迟函数允许你把闭包的执行推迟到 HTTP 响应已经发送给用户之后，让应用保持快速、灵敏。要延迟执行某个闭包，只需把该闭包传给 `Illuminate\Support\defer` 函数：

```php
use App\Services\Metrics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use function Illuminate\Support\defer;

Route::post('/orders', function (Request $request) {
    // 创建订单……

    defer(fn () => Metrics::reportOrder($order));

    return $order;
});
```

默认情况下，只有在调用 `Illuminate\Support\defer` 的 HTTP 响应、Artisan 命令或队列任务成功完成后，延迟函数才会执行。这意味着，如果某个请求最终返回 `4xx` 或 `5xx` HTTP 响应，其中的延迟函数就不会执行。如果希望某个延迟函数始终执行，可以把 `always` 方法链式接到该延迟函数上：

```php
defer(fn () => Metrics::reportOrder($order))->always();
```

<a name="cancelling-deferred-functions"></a>
#### 取消延迟函数

如果需要在某个延迟函数执行之前取消它，可以使用 `forget` 方法按名称取消该函数。要为延迟函数命名，请向 `Illuminate\Support\defer` 函数提供第二个参数：

```php
defer(fn () => Metrics::report(), 'reportMetrics');

defer()->forget('reportMetrics');
```

<a name="deferred-function-compatibility"></a>
#### 延迟函数兼容性

如果你从 Laravel 10.x 应用升级到 Laravel 11.x，并且应用骨架中仍然包含 `app/Http/Kernel.php` 文件，那么你应该把 `InvokeDeferredCallbacks` 中间件添加到内核 `$middleware` 属性的开头：

```php
protected $middleware = [
    \Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks::class, // [tl! add]
    \App\Http\Middleware\TrustProxies::class,
    // ...
];
```

<a name="disabling-deferred-functions-in-tests"></a>
#### 在测试中禁用延迟函数

编写测试时，禁用延迟函数可能会很方便。你可以在测试中调用 `withoutDefer`，指示 Laravel 立即执行所有延迟函数：

```php tab=Pest
test('without defer', function () {
    $this->withoutDefer();

    // ...
});
```

```php tab=PHPUnit
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_without_defer(): void
    {
        $this->withoutDefer();

        // ...
    }
}
```

如果你希望为某个测试用例中的所有测试禁用延迟函数，可以在基础 `TestCase` 类的 `setUp` 方法中调用 `withoutDefer` 方法：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void// [tl! add:start]
    {
        parent::setUp();

        $this->withoutDefer();
    }// [tl! add:end]
}
```

<a name="lottery"></a>
### 抽奖

Laravel 的 Lottery 类可用于按一组给定的概率执行回调。当你只想对一部分比例的传入请求执行代码时，这会非常有用：

    use Illuminate\Support\Lottery;

    Lottery::odds(1, 20)
        ->winner(fn () => $user->won())
        ->loser(fn () => $user->lost())
        ->choose();

你可以把 Laravel 的 Lottery 类与其它 Laravel 功能结合使用。例如，你可能只想把一小部分慢查询上报给异常处理器。由于该 Lottery 类是可调用的，我们还可以把它的实例传入任何接受 callable 的方法：

    use Carbon\CarbonInterval;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Lottery;

    DB::whenQueryingForLongerThan(
        CarbonInterval::seconds(2),
        Lottery::odds(1, 100)->winner(fn () => report('Querying > 2 seconds.')),
    );

<a name="testing-lotteries"></a>
#### 测试抽奖

Laravel 提供了一些简单的方法，方便你轻松测试应用中的抽奖调用：

    // 抽奖总是会赢……
    Lottery::alwaysWin();

    // 抽奖总是会输……
    Lottery::alwaysLose();

    // 抽奖先赢后输，最后恢复正常行为……
    Lottery::fix([true, false]);

    // 抽奖恢复正常行为……
    Lottery::determineResultsNormally();

<a name="pipeline"></a>
### 管道

Laravel 的 `Pipeline` Facade 提供了一种便捷方式，把给定输入"传入"一系列可调用类、闭包或 callable 管道，让每个类都有机会检查或修改输入，并调用管道中的下一个 callable：

```php
use Closure;
use App\Models\User;
use Illuminate\Support\Facades\Pipeline;

$user = Pipeline::send($user)
    ->through([
        function (User $user, Closure $next) {
            // ...

            return $next($user);
        },
        function (User $user, Closure $next) {
            // ...

            return $next($user);
        },
    ])
    ->then(fn (User $user) => $user);
```

如你所见，管道中的每个可调用类或闭包都会收到输入和一个 `$next` 闭包。调用 `$next` 闭包就会调用管道中的下一个 callable。你可能已经注意到了，这与[中间件](/docs/{{version}}/middleware)非常相似。

当管道中最后一个 callable 调用 `$next` 闭包时，传给 `then` 方法的那个 callable 就会被调用。通常，该 callable 只是原样返回给定输入。

当然，正如前面讨论过的，你并不局限于向管道提供闭包，也可以提供可调用类。如果提供的是类名，该类会通过 Laravel 的[服务容器（Service Container）](/docs/{{version}}/container)实例化，从而允许把依赖项注入到该可调用类中：

```php
$user = Pipeline::send($user)
    ->through([
        GenerateProfilePhoto::class,
        ActivateSubscription::class,
        SendWelcomeEmail::class,
    ])
    ->then(fn (User $user) => $user);
```

<a name="sleep"></a>
### 休眠

Laravel 的 `Sleep` 类是 PHP 原生 `sleep` 和 `usleep` 函数的轻量封装，它在提供更高可测试性的同时，也对外暴露了一套对开发者友好的时间操作 API：

    use Illuminate\Support\Sleep;

    $waiting = true;

    while ($waiting) {
        Sleep::for(1)->second();

        $waiting = /* ... */;
    }

`Sleep` 类提供了多种方法，让你能够使用不同的时间单位：

    // 休眠后返回一个值……
    $result = Sleep::for(1)->second()->then(fn () => 1 + 1);

    // 当给定值为 true 时持续休眠……
    Sleep::for(1)->second()->while(fn () => shouldKeepSleeping());

    // 暂停执行 90 秒……
    Sleep::for(1.5)->minutes();

    // 暂停执行 2 秒……
    Sleep::for(2)->seconds();

    // 暂停执行 500 毫秒……
    Sleep::for(500)->milliseconds();

    // 暂停执行 5,000 微秒……
    Sleep::for(5000)->microseconds();

    // 暂停执行直到某个给定时间……
    Sleep::until(now()->addMinute());

    // PHP 原生 "sleep" 函数的别名……
    Sleep::sleep(2);

    // PHP 原生 "usleep" 函数的别名……
    Sleep::usleep(5000);

为了方便组合不同的时间单位，你可以使用 `and` 方法：

    Sleep::for(1)->second()->and(10)->milliseconds();

<a name="testing-sleep"></a>
#### 测试休眠

测试使用 `Sleep` 类或 PHP 原生休眠函数的代码时，你的测试会暂停执行。正如你所料，这会让测试套件明显变慢。例如，假设你正在测试如下代码：

    $waiting = /* ... */;

    $seconds = 1;

    while ($waiting) {
        Sleep::for($seconds++)->seconds();

        $waiting = /* ... */;
    }

通常，测试这段代码至少需要_一秒_。幸运的是，`Sleep` 类允许我们"伪造"休眠，从而让测试套件保持快速：

```php tab=Pest
it('waits until ready', function () {
    Sleep::fake();

    // ...
});
```

```php tab=PHPUnit
public function test_it_waits_until_ready()
{
    Sleep::fake();

    // ...
}
```

在伪造 `Sleep` 类时，实际的执行暂停会被跳过，测试速度因此大幅提升。

一旦 `Sleep` 类被伪造，就可以对应当发生的预期"休眠"进行断言。为说明这一点，假设我们正在测试一段会暂停执行三次、每次暂停都递增一秒的代码。使用 `assertSequence` 方法，我们可以断言代码确实"休眠"了恰当的时长，同时保持测试快速：

```php tab=Pest
it('checks if ready three times', function () {
    Sleep::fake();

    // ...

    Sleep::assertSequence([
        Sleep::for(1)->second(),
        Sleep::for(2)->seconds(),
        Sleep::for(3)->seconds(),
    ]);
}
```

```php tab=PHPUnit
public function test_it_checks_if_ready_three_times()
{
    Sleep::fake();

    // ...

    Sleep::assertSequence([
        Sleep::for(1)->second(),
        Sleep::for(2)->seconds(),
        Sleep::for(3)->seconds(),
    ]);
}
```

当然，`Sleep` 类还提供了你在测试时可以使用的其它各种断言：

    use Carbon\CarbonInterval as Duration;
    use Illuminate\Support\Sleep;

    // 断言调用了 3 次休眠……
    Sleep::assertSleptTimes(3);

    // 对休眠时长进行断言……
    Sleep::assertSlept(function (Duration $duration): bool {
        return /* ... */;
    }, times: 1);

    // 断言 Sleep 类从未被调用……
    Sleep::assertNeverSlept();

    // 断言即使调用了 Sleep，也没有发生执行暂停……
    Sleep::assertInsomniac();

有时你可能希望在应用代码中每次发生伪造休眠时都执行某个操作。为此，可以向 `whenFakingSleep` 方法提供一个回调。在下面的例子中，我们使用 Laravel 的[时间操作辅助函数](/docs/{{version}}/mocking#interacting-with-time)，按每次休眠的时长瞬间推进时间：

```php
use Carbon\CarbonInterval as Duration;

$this->freezeTime();

Sleep::fake();

Sleep::whenFakingSleep(function (Duration $duration) {
    // 在模拟休眠时推进时间……
    $this->travel($duration->totalMilliseconds)->milliseconds();
});
```

由于推进时间是一项常见需求，`fake` 方法接受 `syncWithCarbon` 参数，用于在测试中休眠时让 Carbon 保持同步：

```php
Sleep::fake(syncWithCarbon: true);

$start = now();

Sleep::for(1)->second();

$start->diffForHumans(); // 1 second ago
```

Laravel 在内部每次需要暂停执行时都会使用 `Sleep` 类。例如，[`retry`](#method-retry) 辅助函数在休眠时会使用 `Sleep` 类，这使得使用该辅助函数时测试性更好。

<a name="timebox"></a>
### 时间沙箱

Laravel 的 `Timebox` 类确保给定回调的执行时长始终固定，即使它实际很快就完成执行。这在加密运算和用户身份验证检查等场景中特别有用，因为攻击者可能会利用执行时间的差异来推断敏感信息。

如果执行时间超过固定时长，`Timebox` 不会产生任何影响。开发者需要自行选择足够长的固定时长，以覆盖最坏情况。

call 方法接受一个闭包和一个以微秒为单位的时间上限，然后执行该闭包并等待直到达到该时间上限：

```php
use Illuminate\Support\Timebox;

(new Timebox)->call(function ($timebox) {
    // ...
}, microseconds: 10000);
```

如果闭包内抛出异常，该类会遵守所定义的延迟时间，并在延迟之后重新抛出该异常。
