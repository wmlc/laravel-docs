# 集合

- [简介](#introduction)
    - [创建集合](#creating-collections)
    - [扩展集合](#extending-collections)
- [可用方法](#available-methods)
- [高阶消息](#higher-order-messages)
- [惰性集合](#lazy-collections)
    - [简介](#lazy-collection-introduction)
    - [创建惰性集合](#creating-lazy-collections)
    - [Enumerable 契约](#the-enumerable-contract)
    - [惰性集合方法](#lazy-collection-methods)

<a name="introduction"></a>
## 简介

`Illuminate\Support\Collection` 类为处理数据数组提供了一种流畅且便捷的封装。例如，请查看以下代码。我们将使用 `collect` 辅助函数从数组创建一个新的集合实例，对每个元素执行 `strtoupper` 函数，然后移除所有空元素：

```php
$collection = collect(['Taylor', 'Abigail', null])->map(function (?string $name) {
    return strtoupper($name);
})->reject(function (string $name) {
    return empty($name);
});
```

如你所见，`Collection` 类允许你链式调用其方法，以流畅地对底层数组进行映射和归约。通常，集合是不可变的，这意味着每个 `Collection` 方法都会返回一个全新的 `Collection` 实例。

<a name="creating-collections"></a>
### 创建集合

如上所述，`collect` 辅助函数会为给定的数组返回一个新的 `Illuminate\Support\Collection` 实例。因此，创建集合非常简单：

```php
$collection = collect([1, 2, 3]);
```

你也可以使用方法 [make](#method-make) 和 [fromJson](#method-fromjson) 来创建集合。

> [!NOTE]
> [Eloquent](/docs/{{version}}/eloquent) 查询的结果始终以 `Collection` 实例的形式返回。

<a name="extending-collections"></a>
### 扩展集合

集合是"可宏化"（macroable）的，允许你在运行时向 `Collection` 类添加额外的方法。`Illuminate\Support\Collection` 类的 `macro` 方法接受一个闭包，该闭包会在宏被调用时执行。宏闭包可以通过 `$this` 访问集合的其他方法，就像它是集合类的真实方法一样。例如，以下代码向 `Collection` 类添加了一个 `toUpper` 方法：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

Collection::macro('toUpper', function () {
    return $this->map(function (string $value) {
        return Str::upper($value);
    });
});

$collection = collect(['first', 'second']);

$upper = $collection->toUpper();

// ['FIRST', 'SECOND']
```

通常，你应该在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中声明集合宏。

<a name="macro-arguments"></a>
#### 宏参数

如有需要，你可以定义接受额外参数的宏：

```php
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Lang;

Collection::macro('toLocale', function (string $locale) {
    return $this->map(function (string $value) use ($locale) {
        return Lang::get($value, [], $locale);
    });
});

$collection = collect(['first', 'second']);

$translated = $collection->toLocale('es');

// ['primero', 'segundo'];
```

<a name="available-methods"></a>
## 可用方法

在集合文档的剩余部分中，我们将讨论 `Collection` 类上可用的每个方法。请记住，所有这些方法都可以链式调用，以流畅地操作底层数组。此外，几乎每个方法都会返回一个新的 `Collection` 实例，让你在需要时可以保留集合的原始副本：

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

<div class="collection-method-list" markdown="1">

[after](#method-after)
[all](#method-all)
[average](#method-average)
[avg](#method-avg)
[before](#method-before)
[chunk](#method-chunk)
[chunkBy](#method-chunkby)
[chunkWhile](#method-chunkwhile)
[collapse](#method-collapse)
[collapseWithKeys](#method-collapsewithkeys)
[collect](#method-collect)
[combine](#method-combine)
[concat](#method-concat)
[contains](#method-contains)
[containsStrict](#method-containsstrict)
[count](#method-count)
[countBy](#method-countBy)
[crossJoin](#method-crossjoin)
[dd](#method-dd)
[diff](#method-diff)
[diffAssoc](#method-diffassoc)
[diffAssocUsing](#method-diffassocusing)
[diffKeys](#method-diffkeys)
[doesntContain](#method-doesntcontain)
[doesntContainStrict](#method-doesntcontainstrict)
[dot](#method-dot)
[dump](#method-dump)
[duplicates](#method-duplicates)
[duplicatesStrict](#method-duplicatesstrict)
[each](#method-each)
[eachSpread](#method-eachspread)
[ensure](#method-ensure)
[every](#method-every)
[except](#method-except)
[filter](#method-filter)
[first](#method-first)
[firstOrFail](#method-first-or-fail)
[firstWhere](#method-first-where)
[flatMap](#method-flatmap)
[flatten](#method-flatten)
[flip](#method-flip)
[forget](#method-forget)
[forPage](#method-forpage)
[fromJson](#method-fromjson)
[get](#method-get)
[groupBy](#method-groupby)
[has](#method-has)
[hasAny](#method-hasany)
[hasMany](#method-hasmany)
[hasSole](#method-hassole)
[implode](#method-implode)
[intersect](#method-intersect)
[intersectUsing](#method-intersectusing)
[intersectAssoc](#method-intersectAssoc)
[intersectAssocUsing](#method-intersectassocusing)
[intersectByKeys](#method-intersectbykeys)
[isEmpty](#method-isempty)
[isNotEmpty](#method-isnotempty)
[join](#method-join)
[keyBy](#method-keyby)
[keys](#method-keys)
[last](#method-last)
[lazy](#method-lazy)
[macro](#method-macro)
[make](#method-make)
[map](#method-map)
[mapInto](#method-mapinto)
[mapSpread](#method-mapspread)
[mapToGroups](#method-maptogroups)
[mapWithKeys](#method-mapwithkeys)
[max](#method-max)
[median](#method-median)
[merge](#method-merge)
[mergeRecursive](#method-mergerecursive)
[min](#method-min)
[mode](#method-mode)
[multiply](#method-multiply)
[nth](#method-nth)
[only](#method-only)
[pad](#method-pad)
[partition](#method-partition)
[percentage](#method-percentage)
[pipe](#method-pipe)
[pipeInto](#method-pipeinto)
[pipeThrough](#method-pipethrough)
[pluck](#method-pluck)
[pop](#method-pop)
[prepend](#method-prepend)
[pull](#method-pull)
[push](#method-push)
[put](#method-put)
[random](#method-random)
[range](#method-range)
[reduce](#method-reduce)
[reduceInto](#method-reduce-into)
[reduceSpread](#method-reduce-spread)
[reject](#method-reject)
[replace](#method-replace)
[replaceRecursive](#method-replacerecursive)
[reverse](#method-reverse)
[search](#method-search)
[select](#method-select)
[shift](#method-shift)
[shuffle](#method-shuffle)
[skip](#method-skip)
[skipUntil](#method-skipuntil)
[skipWhile](#method-skipwhile)
[slice](#method-slice)
[sliding](#method-sliding)
[sole](#method-sole)
[some](#method-some)
[sort](#method-sort)
[sortBy](#method-sortby)
[sortByDesc](#method-sortbydesc)
[sortDesc](#method-sortdesc)
[sortKeys](#method-sortkeys)
[sortKeysDesc](#method-sortkeysdesc)
[sortKeysUsing](#method-sortkeysusing)
[splice](#method-splice)
[split](#method-split)
[splitIn](#method-splitin)
[sum](#method-sum)
[take](#method-take)
[takeUntil](#method-takeuntil)
[takeWhile](#method-takewhile)
[tap](#method-tap)
[times](#method-times)
[toArray](#method-toarray)
[toJson](#method-tojson)
[toPrettyJson](#method-to-pretty-json)
[transform](#method-transform)
[undot](#method-undot)
[union](#method-union)
[unique](#method-unique)
[uniqueStrict](#method-uniquestrict)
[unless](#method-unless)
[unlessEmpty](#method-unlessempty)
[unlessNotEmpty](#method-unlessnotempty)
[unwrap](#method-unwrap)
[value](#method-value)
[values](#method-values)
[when](#method-when)
[whenEmpty](#method-whenempty)
[whenNotEmpty](#method-whennotempty)
[where](#method-where)
[whereStrict](#method-wherestrict)
[whereBetween](#method-wherebetween)
[whereIn](#method-wherein)
[whereInStrict](#method-whereinstrict)
[whereInstanceOf](#method-whereinstanceof)
[whereNotBetween](#method-wherenotbetween)
[whereNotIn](#method-wherenotin)
[whereNotInStrict](#method-wherenotinstrict)
[whereNotNull](#method-wherenotnull)
[whereNull](#method-wherenull)
[wrap](#method-wrap)
[zip](#method-zip)

</div>

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

<a name="method-after"></a>
#### `after()` {.collection-method .first-collection-method}

`after` 方法返回给定项之后的项。如果给定项未找到或是最后一项，则返回 `null`：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->after(3);

// 4

$collection->after(5);

// null
```

该方法使用"松散"（loose）比较来查找给定项，这意味着包含整数值的字符串会被视为与该整数值相等。若要使用"严格"（strict）比较，你可以向方法提供 `strict` 参数：

```php
collect([2, 4, 6, 8])->after('4', strict: true);

// null
```

或者，你可以提供自己的闭包，以查找通过给定真值测试的第一个项：

```php
collect([2, 4, 6, 8])->after(function (int $item, int $key) {
    return $item > 5;
});

// 8
```

<a name="method-all"></a>
#### `all()` {.collection-method}

`all` 方法返回集合所表示的底层数组：

```php
collect([1, 2, 3])->all();

// [1, 2, 3]
```

<a name="method-average"></a>
#### `average()` {.collection-method}

[avg](#method-avg) 方法的别名。

<a name="method-avg"></a>
#### `avg()` {.collection-method}

`avg` 方法返回给定键的[平均值](https://en.wikipedia.org/wiki/Average)：

```php
$average = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->avg('foo');

// 20

$average = collect([1, 1, 2, 4])->avg();

// 2
```

<a name="method-before"></a>
#### `before()` {.collection-method}

`before` 方法与 [after](#method-after) 方法相反。它返回给定项之前的项。如果给定项未找到或是第一项，则返回 `null`：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->before(3);

// 2

$collection->before(1);

// null

collect([2, 4, 6, 8])->before('4', strict: true);

// null

collect([2, 4, 6, 8])->before(function (int $item, int $key) {
    return $item > 5;
});

// 4
```

<a name="method-chunk"></a>
#### `chunk()` {.collection-method}

`chunk` 方法将集合拆分为多个给定大小的较小集合：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7]);

$chunks = $collection->chunk(4);

$chunks->all();

// [[1, 2, 3, 4], [5, 6, 7]]
```

在使用诸如 [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/) 这样的网格系统时，该方法在[视图](/docs/{{version}}/views)中特别有用。例如，假设你有一组想要在网格中显示的 [Eloquent](/docs/{{version}}/eloquent) 模型：

```blade
@foreach ($products->chunk(3) as $chunk)
    <div class="row">
        @foreach ($chunk as $product)
            <div class="col-xs-4">{{ $product->name }}</div>
        @endforeach
    </div>
@endforeach
```

<a name="method-chunkby"></a>
#### `chunkBy()` {.collection-method}

`chunkBy` 方法通过将给定的键或回调具有相同值的相邻项分组，将集合拆分为多个较小的集合。例如，你可以将拥有相同父级的相邻产品分组：

```php
$chunks = $products->chunkBy('parent');
```

与 `groupBy` 方法不同，相同但不相邻的项会被放入独立的分组中：

```php
$collection = collect([1, 1, 2, 2, 1]);

$chunks = $collection->chunkBy(fn (int $value) => $value);

$chunks->all();

// [[1, 1], [2, 2], [1]]
```

<a name="method-chunkwhile"></a>
#### `chunkWhile()` {.collection-method}

`chunkWhile` 方法根据给定的回调评估结果，将集合拆分为多个较小的集合。传入闭包的 `$chunk` 变量可用于检查前一个元素：

```php
$collection = collect(str_split('AABBCCCD'));

$chunks = $collection->chunkWhile(function (string $value, int $key, Collection $chunk) {
    return $value === $chunk->last();
});

$chunks->all();

// [['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]
```

<a name="method-collapse"></a>
#### `collapse()` {.collection-method}

`collapse` 方法将数组或集合的集合折叠为单个扁平集合：

```php
$collection = collect([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]);

$collapsed = $collection->collapse();

$collapsed->all();

// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

<a name="method-collapsewithkeys"></a>
#### `collapseWithKeys()` {.collection-method}

`collapseWithKeys` 方法将数组或集合的集合扁平化为单个集合，并保持原始键不变。如果集合已经是扁平的，它将返回一个空集合：

```php
$collection = collect([
    ['first'  => collect([1, 2, 3])],
    ['second' => [4, 5, 6]],
    ['third'  => collect([7, 8, 9])]
]);

$collapsed = $collection->collapseWithKeys();

$collapsed->all();

// [
//     'first'  => [1, 2, 3],
//     'second' => [4, 5, 6],
//     'third'  => [7, 8, 9],
// ]
```

<a name="method-collect"></a>
#### `collect()` {.collection-method}

`collect` 方法返回一个新的 `Collection` 实例，其中包含集合当前的所有项：

```php
$collectionA = collect([1, 2, 3]);

$collectionB = $collectionA->collect();

$collectionB->all();

// [1, 2, 3]
```

`collect` 方法主要用于将[惰性集合](#lazy-collections)转换为标准的 `Collection` 实例：

```php
$lazyCollection = LazyCollection::make(function () {
    yield 1;
    yield 2;
    yield 3;
});

$collection = $lazyCollection->collect();

$collection::class;

// 'Illuminate\Support\Collection'

$collection->all();

// [1, 2, 3]
```

> [!NOTE]
> 当你拥有 `Enumerable` 实例并需要一个非惰性集合实例时，`collect` 方法特别有用。由于 `collect()` 是 `Enumerable` 契约的一部分，你可以安全地使用它来获取 `Collection` 实例。

<a name="method-combine"></a>
#### `combine()` {.collection-method}

`combine` 方法将集合的值（作为键）与另一个数组或集合的值组合：

```php
$collection = collect(['name', 'age']);

$combined = $collection->combine(['George', 29]);

$combined->all();

// ['name' => 'George', 'age' => 29]
```

<a name="method-concat"></a>
#### `concat()` {.collection-method}

`concat` 方法将给定的数组或集合的值追加到另一个集合的末尾：

```php
$collection = collect(['John Doe']);

$concatenated = $collection->concat(['Jane Doe'])->concat(['name' => 'Johnny Doe']);

$concatenated->all();

// ['John Doe', 'Jane Doe', 'Johnny Doe']
```

`concat` 方法会为追加到原始集合的项重新进行数字索引。若要在关联集合中保留键，请参阅 [merge](#method-merge) 方法。

<a name="method-contains"></a>
#### `contains()` {.collection-method}

`contains` 方法用于判断集合是否包含给定项。你可以向 `contains` 方法传入一个闭包，以判断集合中是否存在通过给定真值测试的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->contains(function (int $value, int $key) {
    return $value > 5;
});

// false
```

或者，你可以向 `contains` 方法传入一个字符串，以判断集合是否包含给定的项值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->contains('Desk');

// true

$collection->contains('New York');

// false
```

你还可以向 `contains` 方法传入一个键/值对，用于判断给定键值对是否存在于集合中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->contains('product', 'Bookcase');

// false
```

`contains` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。使用 [containsStrict](#method-containsstrict) 方法可进行"严格"比较的筛选。

关于 `contains` 的反向操作，请参阅 [doesntContain](#method-doesntcontain) 方法。

<a name="method-containsstrict"></a>
#### `containsStrict()` {.collection-method}

该方法的签名与 [contains](#method-contains) 方法相同；但所有值都使用"严格"比较。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-contains) 时，该方法的行为会有所改变。

<a name="method-count"></a>
#### `count()` {.collection-method}

`count` 方法返回集合中的项总数：

```php
$collection = collect([1, 2, 3, 4]);

$collection->count();

// 4
```

<a name="method-countBy"></a>
#### `countBy()` {.collection-method}

`countBy` 方法统计集合中各值的出现次数。默认情况下，该方法统计每个元素的出现次数，让你可以统计集合中某些"类型"的元素：

```php
$collection = collect([1, 2, 2, 2, 3]);

$counted = $collection->countBy();

$counted->all();

// [1 => 1, 2 => 3, 3 => 1]
```

你可以向 `countBy` 方法传入一个闭包，按自定义值统计所有项：

```php
$collection = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']);

$counted = $collection->countBy(function (string $email) {
    return substr(strrchr($email, '@'), 1);
});

$counted->all();

// ['gmail.com' => 2, 'yahoo.com' => 1]
```

<a name="method-crossjoin"></a>
#### `crossJoin()` {.collection-method}

`crossJoin` 方法在给定的数组或集合之间对集合的值进行交叉连接，返回包含所有可能组合的笛卡尔积：

```php
$collection = collect([1, 2]);

$matrix = $collection->crossJoin(['a', 'b']);

$matrix->all();

/*
    [
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
    ]
*/

$collection = collect([1, 2]);

$matrix = $collection->crossJoin(['a', 'b'], ['I', 'II']);

$matrix->all();

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
```

<a name="method-dd"></a>
#### `dd()` {.collection-method}

`dd` 方法会打印集合的项并终止脚本的执行：

```php
$collection = collect(['John Doe', 'Jane Doe']);

$collection->dd();

/*
    array:2 [
        0 => "John Doe"
        1 => "Jane Doe"
    ]
*/
```

如果你不想终止脚本的执行，请改用 [dump](#method-dump) 方法。

<a name="method-diff"></a>
#### `diff()` {.collection-method}

`diff` 方法根据值将集合与另一个集合或普通的 PHP `array` 进行比较。该方法会返回原集合中不存在于给定集合中的值：

```php
$collection = collect([1, 2, 3, 4, 5]);

$diff = $collection->diff([2, 4, 6, 8]);

$diff->all();

// [1, 3, 5]
```

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-diff) 时，该方法的行为会有所改变。

<a name="method-diffassoc"></a>
#### `diffAssoc()` {.collection-method}

`diffAssoc` 方法根据键和值将集合与另一个集合或普通的 PHP `array` 进行比较。该方法会返回原集合中不存在于给定集合中的键值对：

```php
$collection = collect([
    'color' => 'orange',
    'type' => 'fruit',
    'remain' => 6,
]);

$diff = $collection->diffAssoc([
    'color' => 'yellow',
    'type' => 'fruit',
    'remain' => 3,
    'used' => 6,
]);

$diff->all();

// ['color' => 'orange', 'remain' => 6]
```

<a name="method-diffassocusing"></a>
#### `diffAssocUsing()` {.collection-method}

与 `diffAssoc` 不同，`diffAssocUsing` 接受一个用户提供的回调函数用于索引比较：

```php
$collection = collect([
    'color' => 'orange',
    'type' => 'fruit',
    'remain' => 6,
]);

$diff = $collection->diffAssocUsing([
    'Color' => 'yellow',
    'Type' => 'fruit',
    'Remain' => 3,
], 'strnatcasecmp');

$diff->all();

// ['color' => 'orange', 'remain' => 6]
```

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息请参考 PHP 关于 [array_diff_uassoc](https://www.php.net/array_diff_uassoc#refsect1-function.array-diff-uassoc-parameters) 的文档，该方法是 `diffAssocUsing` 在内部使用的 PHP 函数。

<a name="method-diffkeys"></a>
#### `diffKeys()` {.collection-method}

`diffKeys` 方法根据键将集合与另一个集合或普通的 PHP `array` 进行比较。该方法会返回原集合中不存在于给定集合中的键值对：

```php
$collection = collect([
    'one' => 10,
    'two' => 20,
    'three' => 30,
    'four' => 40,
    'five' => 50,
]);

$diff = $collection->diffKeys([
    'two' => 2,
    'four' => 4,
    'six' => 6,
    'eight' => 8,
]);

$diff->all();

// ['one' => 10, 'three' => 30, 'five' => 50]
```

<a name="method-doesntcontain"></a>
#### `doesntContain()` {.collection-method}

`doesntContain` 方法用于判断集合是否不包含给定项。你可以向 `doesntContain` 方法传入一个闭包，以判断集合中是否不存在通过给定真值测试的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->doesntContain(function (int $value, int $key) {
    return $value < 5;
});

// false
```

或者，你可以向 `doesntContain` 方法传入一个字符串，以判断集合是否不包含给定的项值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->doesntContain('Table');

// true

$collection->doesntContain('Desk');

// false
```

你还可以向 `doesntContain` 方法传入一个键/值对，用于判断给定键值对是否不存在于集合中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->doesntContain('product', 'Bookcase');

// true
```

`doesntContain` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。

<a name="method-doesntcontainstrict"></a>
#### `doesntContainStrict()` {.collection-method}

该方法的签名与 [doesntContain](#method-doesntcontain) 方法相同；但所有值都使用"严格"比较。

<a name="method-dot"></a>
#### `dot()` {.collection-method}

`dot` 方法将多维集合扁平化为单层集合，并使用"点"（dot）表示法来指示深度：

```php
$collection = collect(['products' => ['desk' => ['price' => 100]]]);

$flattened = $collection->dot();

$flattened->all();

// ['products.desk.price' => 100]
```

<a name="method-dump"></a>
#### `dump()` {.collection-method}

`dump` 方法会打印集合的项：

```php
$collection = collect(['John Doe', 'Jane Doe']);

$collection->dump();

/*
    array:2 [
        0 => "John Doe"
        1 => "Jane Doe"
    ]
*/
```

如果你希望在打印集合后终止脚本的执行，请改用 [dd](#method-dd) 方法。

<a name="method-duplicates"></a>
#### `duplicates()` {.collection-method}

`duplicates` 方法从集合中检索并返回重复的值：

```php
$collection = collect(['a', 'b', 'a', 'c', 'b']);

$collection->duplicates();

// [2 => 'a', 4 => 'b']
```

如果集合包含数组或对象，你可以传入希望检查重复值的属性键：

```php
$employees = collect([
    ['email' => 'abigail@example.com', 'position' => 'Developer'],
    ['email' => 'james@example.com', 'position' => 'Designer'],
    ['email' => 'victoria@example.com', 'position' => 'Developer'],
]);

$employees->duplicates('position');

// [2 => 'Developer']
```

<a name="method-duplicatesstrict"></a>
#### `duplicatesStrict()` {.collection-method}

该方法的签名与 [duplicates](#method-duplicates) 方法相同；但所有值都使用"严格"比较。

<a name="method-each"></a>
#### `each()` {.collection-method}

`each` 方法遍历集合中的项，并将每一项传入一个闭包：

```php
$collection = collect([1, 2, 3, 4]);

$collection->each(function (int $item, int $key) {
    // ...
});
```

如果你希望停止遍历项，可以从闭包中返回 `false`：

```php
$collection->each(function (int $item, int $key) {
    if (/* condition */) {
        return false;
    }
});
```

<a name="method-eachspread"></a>
#### `eachSpread()` {.collection-method}

`eachSpread` 方法遍历集合的项，将每个嵌套项的值传入给定的回调：

```php
$collection = collect([['John Doe', 35], ['Jane Doe', 33]]);

$collection->eachSpread(function (string $name, int $age) {
    // ...
});
```

你可以通过从回调中返回 `false` 来停止遍历项：

```php
$collection->eachSpread(function (string $name, int $age) {
    return false;
});
```

<a name="method-ensure"></a>
#### `ensure()` {.collection-method}

`ensure` 方法可用于验证集合的所有元素是否属于给定类型或类型列表。否则，将抛出 `UnexpectedValueException`：

```php
return $collection->ensure(User::class);

return $collection->ensure([User::class, Customer::class]);
```

也可以指定 `string`、`int`、`float`、`bool` 和 `array` 等原始类型：

```php
return $collection->ensure('int');
```

> [!WARNING]
> `ensure` 方法不能保证后续不会向集合中添加不同类型的元素。

<a name="method-every"></a>
#### `every()` {.collection-method}

`every` 方法可用于验证集合的所有元素是否都通过给定的真值测试：

```php
collect([1, 2, 3, 4])->every(function (int $value, int $key) {
    return $value > 2;
});

// false
```

如果集合为空，`every` 方法将返回 `true`：

```php
$collection = collect([]);

$collection->every(function (int $value, int $key) {
    return $value > 2;
});

// true
```

<a name="method-except"></a>
#### `except()` {.collection-method}

`except` 方法返回集合中除指定键之外的所有项：

```php
$collection = collect(['product_id' => 1, 'price' => 100, 'discount' => false]);

$filtered = $collection->except(['price', 'discount']);

$filtered->all();

// ['product_id' => 1]
```

关于 `except` 的反向操作，请参阅 [only](#method-only) 方法。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-except) 时，该方法的行为会有所改变。

<a name="method-filter"></a>
#### `filter()` {.collection-method}

`filter` 方法使用给定的回调对集合进行筛选，仅保留通过给定真值测试的项：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->filter(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [3, 4]
```

如果未提供回调，集合中等同于 `false` 的所有项都会被移除：

```php
$collection = collect([1, 2, 3, null, false, '', 0, []]);

$collection->filter()->all();

// [1, 2, 3]
```

关于 `filter` 的反向操作，请参阅 [reject](#method-reject) 方法。

<a name="method-first"></a>
#### `first()` {.collection-method}

`first` 方法返回集合中通过给定真值测试的第一个元素：

```php
collect([1, 2, 3, 4])->first(function (int $value, int $key) {
    return $value > 2;
});

// 3
```

你也可以不带参数调用 `first` 方法以获取集合中的第一个元素。如果集合为空，则返回 `null`：

```php
collect([1, 2, 3, 4])->first();

// 1
```

<a name="method-first-or-fail"></a>
#### `firstOrFail()` {.collection-method}

`firstOrFail` 方法与 `first` 方法相同；但如果未找到结果，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([1, 2, 3, 4])->firstOrFail(function (int $value, int $key) {
    return $value > 5;
});

// 抛出 ItemNotFoundException...
```

你也可以不带参数调用 `firstOrFail` 方法以获取集合中的第一个元素。如果集合为空，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([])->firstOrFail();

// 抛出 ItemNotFoundException...
```

<a name="method-first-where"></a>
#### `firstWhere()` {.collection-method}

`firstWhere` 方法返回集合中具有给定键值对的第一个元素：

```php
$collection = collect([
    ['name' => 'Regena', 'age' => null],
    ['name' => 'Linda', 'age' => 14],
    ['name' => 'Diego', 'age' => 23],
    ['name' => 'Linda', 'age' => 84],
]);

$collection->firstWhere('name', 'Linda');

// ['name' => 'Linda', 'age' => 14]
```

你也可以向 `firstWhere` 方法传入一个比较运算符：

```php
$collection->firstWhere('age', '>=', 18);

// ['name' => 'Diego', 'age' => 23]
```

与 [where](#method-where) 方法类似，你可以向 `firstWhere` 方法传入一个参数。在这种情况下，`firstWhere` 方法会返回第一个给定项键的值为"真值"（truthy）的项：

```php
$collection->firstWhere('age');

// ['name' => 'Linda', 'age' => 14]
```

<a name="method-flatmap"></a>
#### `flatMap()` {.collection-method}

`flatMap` 方法遍历集合，并将每个值传入给定的闭包。闭包可以自由地修改该项并将其返回，从而形成一个由修改后的项组成的新集合。然后，该数组会被扁平化一层：

```php
$collection = collect([
    ['name' => 'Sally'],
    ['school' => 'Arkansas'],
    ['age' => 28]
]);

$flattened = $collection->flatMap(function (array $values) {
    return array_map('strtoupper', $values);
});

$flattened->all();

// ['name' => 'SALLY', 'school' => 'ARKANSAS', 'age' => '28'];
```

<a name="method-flatten"></a>
#### `flatten()` {.collection-method}

`flatten` 方法将多维集合扁平化为单维：

```php
$collection = collect([
    'name' => 'Taylor',
    'languages' => [
        'PHP', 'JavaScript'
    ]
]);

$flattened = $collection->flatten();

$flattened->all();

// ['Taylor', 'PHP', 'JavaScript'];
```

如有需要，你可以向 `flatten` 方法传入一个"深度"（depth）参数：

```php
$collection = collect([
    'Apple' => [
        [
            'name' => 'iPhone 6S',
            'brand' => 'Apple'
        ],
    ],
    'Samsung' => [
        [
            'name' => 'Galaxy S7',
            'brand' => 'Samsung'
        ],
    ],
]);

$products = $collection->flatten(1);

$products->values()->all();

/*
    [
        ['name' => 'iPhone 6S', 'brand' => 'Apple'],
        ['name' => 'Galaxy S7', 'brand' => 'Samsung'],
    ]
*/
```

在此例中，如果调用 `flatten` 时不提供深度，嵌套数组也会被扁平化，结果将是 `['iPhone 6S', 'Apple', 'Galaxy S7', 'Samsung']`。提供深度可以让你指定嵌套数组被扁平化的层级数。

<a name="method-flip"></a>
#### `flip()` {.collection-method}

`flip` 方法将集合的键与其对应的值互换：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$flipped = $collection->flip();

$flipped->all();

// ['Taylor' => 'name', 'Laravel' => 'framework']
```

<a name="method-forget"></a>
#### `forget()` {.collection-method}

`forget` 方法根据键从集合中移除一项：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

// 移除单个键...
$collection->forget('name');

// ['framework' => 'Laravel']

// 移除多个键...
$collection->forget(['name', 'framework']);

// []
```

> [!WARNING]
> 与大多数其他集合方法不同，`forget` 不会返回一个新的已修改集合；它会修改并返回被调用的集合本身。

<a name="method-forpage"></a>
#### `forPage()` {.collection-method}

`forPage` 方法返回一个新集合，其中包含给定页码上应出现的项。该方法接受页码作为其第一个参数，以及每页显示的项数作为其第二个参数：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunk = $collection->forPage(2, 3);

$chunk->all();

// [4, 5, 6]
```

<a name="method-fromjson"></a>
#### `fromJson()` {.collection-method}

静态方法 `fromJson` 通过 `json_decode` 这个 PHP 函数解码给定的 JSON 字符串来创建一个新的集合实例：

```php
use Illuminate\Support\Collection;

$json = json_encode([
    'name' => 'Taylor Otwell',
    'role' => 'Developer',
    'status' => 'Active',
]);

$collection = Collection::fromJson($json);
```

<a name="method-get"></a>
#### `get()` {.collection-method}

`get` 方法返回给定键处对应的项。如果键不存在，则返回 `null`：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$value = $collection->get('name');

// Taylor
```

你可以选择性地传入一个默认值作为第二个参数：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$value = $collection->get('age', 34);

// 34
```

你甚至可以将一个回调作为该方法的默认值传入。如果指定的键不存在，则返回该回调的执行结果：

```php
$collection->get('email', function () {
    return 'taylor@example.com';
});

// taylor@example.com
```

<a name="method-groupby"></a>
#### `groupBy()` {.collection-method}

`groupBy` 方法按给定键对集合的项进行分组：

```php
$collection = collect([
    ['account_id' => 'account-x10', 'product' => 'Chair'],
    ['account_id' => 'account-x10', 'product' => 'Bookcase'],
    ['account_id' => 'account-x11', 'product' => 'Desk'],
]);

$grouped = $collection->groupBy('account_id');

$grouped->all();

/*
    [
        'account-x10' => [
            ['account_id' => 'account-x10', 'product' => 'Chair'],
            ['account_id' => 'account-x10', 'product' => 'Bookcase'],
        ],
        'account-x11' => [
            ['account_id' => 'account-x11', 'product' => 'Desk'],
        ],
    ]
*/
```

除了传入字符串形式的 `key`，你还可以传入一个回调。该回调应返回你希望用作分组键的值：

```php
$grouped = $collection->groupBy(function (array $item, int $key) {
    return substr($item['account_id'], -3);
});

$grouped->all();

/*
    [
        'x10' => [
            ['account_id' => 'account-x10', 'product' => 'Chair'],
            ['account_id' => 'account-x10', 'product' => 'Bookcase'],
        ],
        'x11' => [
            ['account_id' => 'account-x11', 'product' => 'Desk'],
        ],
    ]
*/
```

可以传入多个分组条件作为数组。数组中的每个元素都会应用到多维数组中对应的层级：

```php
$data = new Collection([
    10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
    20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
    30 => ['user' => 3, 'skill' => 2, 'roles' => ['Role_1']],
    40 => ['user' => 4, 'skill' => 2, 'roles' => ['Role_2']],
]);

$result = $data->groupBy(['skill', function (array $item) {
    return $item['roles'];
}], preserveKeys: true);

/*
[
    1 => [
        'Role_1' => [
            10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
            20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
        ],
        'Role_2' => [
            20 => ['user' => 2, 'skill' => 1, 'roles' => ['Role_1', 'Role_2']],
        ],
        'Role_3' => [
            10 => ['user' => 1, 'skill' => 1, 'roles' => ['Role_1', 'Role_3']],
        ],
    ],
    2 => [
        'Role_1' => [
            30 => ['user' => 3, 'skill' => 2, 'roles' => ['Role_1']],
        ],
        'Role_2' => [
            40 => ['user' => 4, 'skill' => 2, 'roles' => ['Role_2']],
        ],
    ],
];
*/
```

<a name="method-has"></a>
#### `has()` {.collection-method}

`has` 方法判断给定键是否存在于集合中：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->has('product');

// true

$collection->has(['product', 'amount']);

// true

$collection->has(['amount', 'price']);

// false
```

<a name="method-hasany"></a>
#### `hasAny()` {.collection-method}

`hasAny` 方法判断给定键中是否有任意一个存在于集合中：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->hasAny(['product', 'price']);

// true

$collection->hasAny(['name', 'price']);

// false
```

<a name="method-hasmany"></a>
#### `hasMany()` {.collection-method}

`hasMany` 方法判断集合是否包含多个项：

```php
collect([])->hasMany();

// false

collect(['1'])->hasMany();

// false

collect([1, 2, 3])->hasMany();

// true

collect([
    ['age' => 2],
    ['age' => 3],
])->hasMany(fn ($item) => $item['age'] === 2)

// false
```

<a name="method-hassole"></a>
#### `hasSole()` {.collection-method}

`hasSole` 方法判断集合是否仅包含单个项，可选择匹配给定条件：

```php
collect([])->hasSole();

// false

collect(['1'])->hasSole();

// true

collect([1, 2, 3])->hasSole(fn (int $item) => $item === 2);

// true
```

<a name="method-implode"></a>
#### `implode()` {.collection-method}

`implode` 方法将集合中的项连接起来。其参数取决于集合中项的类型。如果集合包含数组或对象，你应该传入希望连接的属性键，以及希望放置在值之间的"胶水"（glue）字符串：

```php
$collection = collect([
    ['account_id' => 1, 'product' => 'Desk'],
    ['account_id' => 2, 'product' => 'Chair'],
]);

$collection->implode('product', ', ');

// 'Desk, Chair'
```

如果集合包含简单的字符串或数值，你应该将"胶水"作为该方法的唯一参数传入：

```php
collect([1, 2, 3, 4, 5])->implode('-');

// '1-2-3-4-5'
```

如果你希望对被连接的值进行格式化，可以向 `implode` 方法传入一个闭包：

```php
$collection->implode(function (array $item, int $key) {
    return strtoupper($item['product']);
}, ', ');

// 'DESK, CHAIR'
```

<a name="method-intersect"></a>
#### `intersect()` {.collection-method}

`intersect` 方法会从原集合中移除给定数组或集合中不存在的值。结果集合会保留原集合的键：

```php
$collection = collect(['Desk', 'Sofa', 'Chair']);

$intersect = $collection->intersect(['Desk', 'Chair', 'Bookcase']);

$intersect->all();

// [0 => 'Desk', 2 => 'Chair']
```

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-intersect) 时，该方法的行为会有所改变。

<a name="method-intersectusing"></a>
#### `intersectUsing()` {.collection-method}

`intersectUsing` 方法会从原集合中移除给定数组或集合中不存在的值，使用自定义回调来比较值。结果集合会保留原集合的键：

```php
$collection = collect(['Desk', 'Sofa', 'Chair']);

$intersect = $collection->intersectUsing(['desk', 'chair', 'bookcase'], function (string $a, string $b) {
    return strcasecmp($a, $b);
});

$intersect->all();

// [0 => 'Desk', 2 => 'Chair']
```

<a name="method-intersectAssoc"></a>
#### `intersectAssoc()` {.collection-method}

`intersectAssoc` 方法将原集合与另一个集合或数组进行比较，返回在所有给定集合中都存在的键值对：

```php
$collection = collect([
    'color' => 'red',
    'size' => 'M',
    'material' => 'cotton'
]);

$intersect = $collection->intersectAssoc([
    'color' => 'blue',
    'size' => 'M',
    'material' => 'polyester'
]);

$intersect->all();

// ['size' => 'M']
```

<a name="method-intersectassocusing"></a>
#### `intersectAssocUsing()` {.collection-method}

`intersectAssocUsing` 方法将原集合与另一个集合或数组进行比较，返回在两者中都存在的键值对，并使用自定义比较回调来确定键和值是否相等：

```php
$collection = collect([
    'color' => 'red',
    'Size' => 'M',
    'material' => 'cotton',
]);

$intersect = $collection->intersectAssocUsing([
    'color' => 'blue',
    'size' => 'M',
    'material' => 'polyester',
], function (string $a, string $b) {
    return strcasecmp($a, $b);
});

$intersect->all();

// ['Size' => 'M']
```

<a name="method-intersectbykeys"></a>
#### `intersectByKeys()` {.collection-method}

`intersectByKeys` 方法会从原集合中移除给定数组或集合中不存在的键及其对应的值：

```php
$collection = collect([
    'serial' => 'UX301', 'type' => 'screen', 'year' => 2009,
]);

$intersect = $collection->intersectByKeys([
    'reference' => 'UX404', 'type' => 'tab', 'year' => 2011,
]);

$intersect->all();

// ['type' => 'screen', 'year' => 2009]
```

<a name="method-isempty"></a>
#### `isEmpty()` {.collection-method}

如果集合为空，`isEmpty` 方法返回 `true`；否则返回 `false`：

```php
collect([])->isEmpty();

// true
```

<a name="method-isnotempty"></a>
#### `isNotEmpty()` {.collection-method}

如果集合不为空，`isNotEmpty` 方法返回 `true`；否则返回 `false`：

```php
collect([])->isNotEmpty();

// false
```

<a name="method-join"></a>
#### `join()` {.collection-method}

`join` 方法用字符串将集合的值连接起来。使用该方法的第二个参数，你还可以指定最后一个元素应如何追加到字符串中：

```php
collect(['a', 'b', 'c'])->join(', '); // 'a, b, c'
collect(['a', 'b', 'c'])->join(', ', ', and '); // 'a, b, and c'
collect(['a', 'b'])->join(', ', ' and '); // 'a and b'
collect(['a'])->join(', ', ' and '); // 'a'
collect([])->join(', ', ' and '); // ''
```

<a name="method-keyby"></a>
#### `keyBy()` {.collection-method}

`keyBy` 方法按给定键为集合建立键。如果多个项具有相同的键，则只有最后一个会显示在新集合中：

```php
$collection = collect([
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$keyed = $collection->keyBy('product_id');

$keyed->all();

/*
    [
        'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]
*/
```

你也可以向该方法传入一个回调。该回调应返回用作集合键的值：

```php
$keyed = $collection->keyBy(function (array $item, int $key) {
    return strtoupper($item['product_id']);
});

$keyed->all();

/*
    [
        'PROD-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'PROD-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]
*/
```

<a name="method-keys"></a>
#### `keys()` {.collection-method}

`keys` 方法返回集合的所有键：

```php
$collection = collect([
    'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
    'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$keys = $collection->keys();

$keys->all();

// ['prod-100', 'prod-200']
```

<a name="method-last"></a>
#### `last()` {.collection-method}

`last` 方法返回集合中通过给定真值测试的最后一个元素：

```php
collect([1, 2, 3, 4])->last(function (int $value, int $key) {
    return $value < 3;
});

// 2
```

你也可以不带参数调用 `last` 方法以获取集合中的最后一个元素。如果集合为空，则返回 `null`：

```php
collect([1, 2, 3, 4])->last();

// 4
```

<a name="method-lazy"></a>
#### `lazy()` {.collection-method}

`lazy` 方法从底层项数组返回一个新的 [LazyCollection](#lazy-collections) 实例：

```php
$lazyCollection = collect([1, 2, 3, 4])->lazy();

$lazyCollection::class;

// Illuminate\Support\LazyCollection

$lazyCollection->all();

// [1, 2, 3, 4]
```

当你需要对包含大量项的巨型 `Collection` 执行转换时，这特别有用：

```php
$count = $hugeCollection
    ->lazy()
    ->where('country', 'FR')
    ->where('balance', '>', '100')
    ->count();
```

通过将集合转换为 `LazyCollection`，我们避免了分配大量额外的内存。虽然原始集合仍将其值保留在内存中，但后续的筛选不会。因此，在筛选集合结果时几乎不会分配额外的内存。

<a name="method-macro"></a>
#### `macro()` {.collection-method}

静态方法 `macro` 允许你在运行时向 `Collection` 类添加方法。更多信息请参阅[扩展集合](#extending-collections)的文档。

<a name="method-make"></a>
#### `make()` {.collection-method}

静态方法 `make` 用于创建一个新的集合实例。请参阅[创建集合](#creating-collections)一节。

```php
use Illuminate\Support\Collection;

$collection = Collection::make([1, 2, 3]);
```

<a name="method-map"></a>
#### `map()` {.collection-method}

`map` 方法遍历集合，并将每个值传入给定的回调。闭包可以自由地修改该项并将其返回，从而形成一个由修改后的项组成的新集合：

```php
$collection = collect([1, 2, 3, 4, 5]);

$multiplied = $collection->map(function (int $item, int $key) {
    return $item * 2;
});

$multiplied->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 与大多数其他集合方法一样，`map` 返回一个新集合实例；它不会修改被调用的集合。如果你想转换原始集合，请使用 [transform](#method-transform) 方法。

<a name="method-mapinto"></a>
#### `mapInto()` {.collection-method}

`mapInto()` 方法遍历集合，通过将值传入构造函数来创建给定类的新实例：

```php
class Currency
{
    /**
     * 创建新的货币实例。
     */
    function __construct(
        public string $code,
    ) {}
}

$collection = collect(['USD', 'EUR', 'GBP']);

$currencies = $collection->mapInto(Currency::class);

$currencies->all();

// [Currency('USD'), Currency('EUR'), Currency('GBP')]
```

<a name="method-mapspread"></a>
#### `mapSpread()` {.collection-method}

`mapSpread` 方法遍历集合的项，将每个嵌套项的值传入给定的闭包。闭包可以自由地修改该项并将其返回，从而形成一个由修改后的项组成的新集合：

```php
$collection = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunks = $collection->chunk(2);

$sequence = $chunks->mapSpread(function (int $even, int $odd) {
    return $even + $odd;
});

$sequence->all();

// [1, 5, 9, 13, 17]
```

<a name="method-maptogroups"></a>
#### `mapToGroups()` {.collection-method}

`mapToGroups` 方法按给定的闭包对集合的项进行分组。该闭包应返回一个包含单个键值对的关联数组，从而形成一个由分组值组成的新集合：

```php
$collection = collect([
    [
        'name' => 'John Doe',
        'department' => 'Sales',
    ],
    [
        'name' => 'Jane Doe',
        'department' => 'Sales',
    ],
    [
        'name' => 'Johnny Doe',
        'department' => 'Marketing',
    ]
]);

$grouped = $collection->mapToGroups(function (array $item, int $key) {
    return [$item['department'] => $item['name']];
});

$grouped->all();

/*
    [
        'Sales' => ['John Doe', 'Jane Doe'],
        'Marketing' => ['Johnny Doe'],
    ]
*/

$grouped->get('Sales')->all();

// ['John Doe', 'Jane Doe']
```

<a name="method-mapwithkeys"></a>
#### `mapWithKeys()` {.collection-method}

`mapWithKeys` 方法遍历集合，并将每个值传入给定的回调。该回调应返回一个包含单个键值对的关联数组：

```php
$collection = collect([
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
]);

$keyed = $collection->mapWithKeys(function (array $item, int $key) {
    return [$item['email'] => $item['name']];
});

$keyed->all();

/*
    [
        'john@example.com' => 'John',
        'jane@example.com' => 'Jane',
    ]
*/
```

<a name="method-max"></a>
#### `max()` {.collection-method}

`max` 方法返回给定键的最大值：

```php
$max = collect([
    ['foo' => 10],
    ['foo' => 20]
])->max('foo');

// 20

$max = collect([1, 2, 3, 4, 5])->max();

// 5
```

<a name="method-median"></a>
#### `median()` {.collection-method}

`median` 方法返回给定键的[中位数](https://en.wikipedia.org/wiki/Median)：

```php
$median = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->median('foo');

// 15

$median = collect([1, 1, 2, 4])->median();

// 1.5
```

<a name="method-merge"></a>
#### `merge()` {.collection-method}

`merge` 方法将给定的数组或集合与原集合合并。如果给定项中的字符串键与原集合中的字符串键相同，则给定项的值会覆盖原集合中的值：

```php
$collection = collect(['product_id' => 1, 'price' => 100]);

$merged = $collection->merge(['price' => 200, 'discount' => false]);

$merged->all();

// ['product_id' => 1, 'price' => 200, 'discount' => false]
```

如果给定项的键是数字，则这些值会被追加到集合的末尾：

```php
$collection = collect(['Desk', 'Chair']);

$merged = $collection->merge(['Bookcase', 'Door']);

$merged->all();

// ['Desk', 'Chair', 'Bookcase', 'Door']
```

<a name="method-mergerecursive"></a>
#### `mergeRecursive()` {.collection-method}

`mergeRecursive` 方法将给定数组或集合与原集合递归地合并。如果给定项中的字符串键与原集合中的字符串键相同，则这些键对应的值会被合并为一个数组，且这一过程是递归进行的：

```php
$collection = collect(['product_id' => 1, 'price' => 100]);

$merged = $collection->mergeRecursive([
    'product_id' => 2,
    'price' => 200,
    'discount' => false
]);

$merged->all();

// ['product_id' => [1, 2], 'price' => [100, 200], 'discount' => false]
```

<a name="method-min"></a>
#### `min()` {.collection-method}

`min` 方法返回给定键的最小值：

```php
$min = collect([
    ['foo' => 10],
    ['foo' => 20]
])->min('foo');

// 10

$min = collect([1, 2, 3, 4, 5])->min();

// 1
```

<a name="method-mode"></a>
#### `mode()` {.collection-method}

`mode` 方法返回给定键的[众数](https://en.wikipedia.org/wiki/Mode_(statistics))：

```php
$mode = collect([
    ['foo' => 10],
    ['foo' => 10],
    ['foo' => 20],
    ['foo' => 40]
])->mode('foo');

// [10]

$mode = collect([1, 1, 2, 4])->mode();

// [1]

$mode = collect([1, 1, 2, 2])->mode();

// [1, 2]
```

<a name="method-multiply"></a>
#### `multiply()` {.collection-method}

`multiply` 方法创建集合中全部项的指定数量的副本：

```php
$users = collect([
    ['name' => 'User #1', 'email' => 'user1@example.com'],
    ['name' => 'User #2', 'email' => 'user2@example.com'],
])->multiply(3);

/*
    [
        ['name' => 'User #1', 'email' => 'user1@example.com'],
        ['name' => 'User #2', 'email' => 'user2@example.com'],
        ['name' => 'User #1', 'email' => 'user1@example.com'],
        ['name' => 'User #2', 'email' => 'user2@example.com'],
        ['name' => 'User #1', 'email' => 'user1@example.com'],
        ['name' => 'User #2', 'email' => 'user2@example.com'],
    ]
*/
```

<a name="method-nth"></a>
#### `nth()` {.collection-method}

`nth` 方法创建一个由每隔 n 个元素组成的新集合：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e', 'f']);

$collection->nth(4);

// ['a', 'e']
```

你可以选择性地传入一个起始偏移量作为第二个参数：

```php
$collection->nth(4, 1);

// ['b', 'f']
```

<a name="method-only"></a>
#### `only()` {.collection-method}

`only` 方法返回集合中具有指定键的项：

```php
$collection = collect([
    'product_id' => 1,
    'name' => 'Desk',
    'price' => 100,
    'discount' => false
]);

$filtered = $collection->only(['product_id', 'name']);

$filtered->all();

// ['product_id' => 1, 'name' => 'Desk']
```

关于 `only` 的反向操作，请参阅 [except](#method-except) 方法。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-only) 时，该方法的行为会有所改变。

<a name="method-pad"></a>
#### `pad()` {.collection-method}

`pad` 方法会用给定的值填充数组，直到数组达到指定大小。该方法的行为类似于 PHP 的 [array_pad](https://secure.php.net/manual/en/function.array-pad.php) 函数。

若要在左侧填充，你应该指定一个负数大小。如果给定大小的绝对值小于或等于数组的长度，则不会进行填充：

```php
$collection = collect(['A', 'B', 'C']);

$filtered = $collection->pad(5, 0);

$filtered->all();

// ['A', 'B', 'C', 0, 0]

$filtered = $collection->pad(-5, 0);

$filtered->all();

// [0, 0, 'A', 'B', 'C']
```

<a name="method-partition"></a>
#### `partition()` {.collection-method}

`partition` 方法可以与 PHP 的数组解构结合使用，将通过与未通过给定真值测试的元素分开：

```php
$collection = collect([1, 2, 3, 4, 5, 6]);

[$underThree, $equalOrAboveThree] = $collection->partition(function (int $i) {
    return $i < 3;
});

$underThree->all();

// [1, 2]

$equalOrAboveThree->all();

// [3, 4, 5, 6]
```

> [!NOTE]
> 与 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-partition) 交互时，该方法的行为会有所改变。

<a name="method-percentage"></a>
#### `percentage()` {.collection-method}

`percentage` 方法可用于快速确定集合中通过给定真值测试的项所占的百分比：

```php
$collection = collect([1, 1, 2, 2, 2, 3]);

$percentage = $collection->percentage(fn (int $value) => $value === 1);

// 33.33
```

默认情况下，百分比会被四舍五入到两位小数。不过，你可以通过向该方法提供第二个参数来自定义这一行为：

```php
$percentage = $collection->percentage(fn (int $value) => $value === 1, precision: 3);

// 33.333
```

<a name="method-pipe"></a>
#### `pipe()` {.collection-method}

`pipe` 方法将集合传入给定的闭包，并返回该闭包执行后的结果：

```php
$collection = collect([1, 2, 3]);

$piped = $collection->pipe(function (Collection $collection) {
    return $collection->sum();
});

// 6
```

<a name="method-pipeinto"></a>
#### `pipeInto()` {.collection-method}

`pipeInto` 方法创建给定类的新实例，并将集合传入其构造函数：

```php
class ResourceCollection
{
    /**
     * 创建新的 ResourceCollection 实例。
     */
    public function __construct(
        public Collection $collection,
    ) {}
}

$collection = collect([1, 2, 3]);

$resource = $collection->pipeInto(ResourceCollection::class);

$resource->collection->all();

// [1, 2, 3]
```

<a name="method-pipethrough"></a>
#### `pipeThrough()` {.collection-method}

`pipeThrough` 方法将集合传入给定的闭包数组，并返回这些闭包执行后的结果：

```php
use Illuminate\Support\Collection;

$collection = collect([1, 2, 3]);

$result = $collection->pipeThrough([
    function (Collection $collection) {
        return $collection->merge([4, 5]);
    },
    function (Collection $collection) {
        return $collection->sum();
    },
]);

// 15
```

<a name="method-pluck"></a>
#### `pluck()` {.collection-method}

`pluck` 方法检索给定键对应的所有值：

```php
$collection = collect([
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$plucked = $collection->pluck('name');

$plucked->all();

// ['Desk', 'Chair']
```

你也可以指定希望结果集合以何种方式建立键：

```php
$plucked = $collection->pluck('name', 'product_id');

$plucked->all();

// ['prod-100' => 'Desk', 'prod-200' => 'Chair']
```

`pluck` 方法还支持使用"点"（dot）表示法检索嵌套值：

```php
$collection = collect([
    [
        'name' => 'Laracon',
        'speakers' => [
            'first_day' => ['Rosa', 'Judith'],
        ],
    ],
    [
        'name' => 'VueConf',
        'speakers' => [
            'first_day' => ['Abigail', 'Joey'],
        ],
    ],
]);

$plucked = $collection->pluck('speakers.first_day');

$plucked->all();

// [['Rosa', 'Judith'], ['Abigail', 'Joey']]
```

如果存在重复的键，则最后一个匹配的元素会被插入到提取出的集合中：

```php
$collection = collect([
    ['brand' => 'Tesla',  'color' => 'red'],
    ['brand' => 'Pagani', 'color' => 'white'],
    ['brand' => 'Tesla',  'color' => 'black'],
    ['brand' => 'Pagani', 'color' => 'orange'],
]);

$plucked = $collection->pluck('color', 'brand');

$plucked->all();

// ['Tesla' => 'black', 'Pagani' => 'orange']
```

<a name="method-pop"></a>
#### `pop()` {.collection-method}

`pop` 方法移除并返回集合中的最后一个项。如果集合为空，则返回 `null`：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop();

// 5

$collection->all();

// [1, 2, 3, 4]
```

你可以向 `pop` 方法传入一个整数，以从集合末尾移除并返回多个项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop(3);

// collect([5, 4, 3])

$collection->all();

// [1, 2]
```

<a name="method-prepend"></a>
#### `prepend()` {.collection-method}

`prepend` 方法向集合的开头添加一个项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->prepend(0);

$collection->all();

// [0, 1, 2, 3, 4, 5]
```

你也可以传入第二个参数来指定被添加项的键：

```php
$collection = collect(['one' => 1, 'two' => 2]);

$collection->prepend(0, 'zero');

$collection->all();

// ['zero' => 0, 'one' => 1, 'two' => 2]
```

<a name="method-pull"></a>
#### `pull()` {.collection-method}

`pull` 方法根据键从集合中移除并返回一项：

```php
$collection = collect(['product_id' => 'prod-100', 'name' => 'Desk']);

$collection->pull('name');

// 'Desk'

$collection->all();

// ['product_id' => 'prod-100']
```

<a name="method-push"></a>
#### `push()` {.collection-method}

`push` 方法向集合末尾追加一个项：

```php
$collection = collect([1, 2, 3, 4]);

$collection->push(5);

$collection->all();

// [1, 2, 3, 4, 5]
```

你也可以提供多个项以追加到集合末尾：

```php
$collection = collect([1, 2, 3, 4]);

$collection->push(5, 6, 7);

$collection->all();

// [1, 2, 3, 4, 5, 6, 7]
```

<a name="method-put"></a>
#### `put()` {.collection-method}

`put` 方法在集合中设置给定的键和值：

```php
$collection = collect(['product_id' => 1, 'name' => 'Desk']);

$collection->put('price', 100);

$collection->all();

// ['product_id' => 1, 'name' => 'Desk', 'price' => 100]
```

<a name="method-random"></a>
#### `random()` {.collection-method}

`random` 方法从集合中随机返回一个项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->random();

// 4 - (随机获取)
```

你可以向 `random` 传入一个整数，以指定希望随机检索的项数。当显式传入希望接收的项数时，始终会返回一个项的集合：

```php
$random = $collection->random(3);

$random->all();

// [2, 4, 5] - (随机获取)
```

如果集合实例中的项少于请求的数量，`random` 方法将抛出 `InvalidArgumentException`。

`random` 方法还接受一个闭包，该闭包会接收当前的集合实例：

```php
use Illuminate\Support\Collection;

$random = $collection->random(fn (Collection $items) => min(10, count($items)));

$random->all();

// [1, 2, 3, 4, 5] - (随机获取)
```

<a name="method-range"></a>
#### `range()` {.collection-method}

`range` 方法返回一个包含指定范围内整数的集合：

```php
$collection = collect()->range(3, 6);

$collection->all();

// [3, 4, 5, 6]
```

<a name="method-reduce"></a>
#### `reduce()` {.collection-method}

`reduce` 方法将集合归约为单个值，将每次迭代的结果传入下一次迭代：

```php
$collection = collect([1, 2, 3]);

$total = $collection->reduce(function (?int $carry, int $item) {
    return $carry + $item;
});

// 6
```

第一次迭代时 `$carry` 的值为 `null`；不过，你可以通过向 `reduce` 传入第二个参数来指定其初始值：

```php
$collection->reduce(function (int $carry, int $item) {
    return $carry + $item;
}, 4);

// 10
```

`reduce` 方法还会将数组的键传入给定的回调：

```php
$collection = collect([
    'usd' => 1400,
    'gbp' => 1200,
    'eur' => 1000,
]);

$ratio = [
    'usd' => 1,
    'gbp' => 1.37,
    'eur' => 1.22,
];

$collection->reduce(function (int $carry, int $value, string $key) use ($ratio) {
    return $carry + ($value * $ratio[$key]);
}, 0);

// 4264
```

<a name="method-reduce-into"></a>
#### `reduceInto()` {.collection-method}

`reduceInto` 方法通过修改给定的初始值将集合归约为单个值。与 `reduce` 方法不同，给定的回调不需要返回累计值：

```php
class OrderStats
{
    public int $total = 0;

    public int $count = 0;
}

$orders = collect([
    ['amount' => 100],
    ['amount' => 250],
    ['amount' => 50],
]);

$stats = $orders->reduceInto(new OrderStats, function (OrderStats $stats, array $order) {
    $stats->total += $order['amount'];
    $stats->count++;
});

$stats->total;

// 400
```

当归约到一个标量或数组时，你应该在回调中通过引用接收它，以便你的修改能应用到原始值上：

```php
$collection = collect([1, 2, 3, 4, 5]);

$even = $collection->reduceInto([], function (array &$result, int $value) {
    if ($value % 2 === 0) {
        $result[] = $value;
    }
});

// [2, 4]
```

<a name="method-reduce-spread"></a>
#### `reduceSpread()` {.collection-method}

`reduceSpread` 方法将集合归约为一个值数组，将每次迭代的结果传入下一次迭代。该方法与 `reduce` 方法类似；但它可以接受多个初始值：

```php
[$creditsRemaining, $batch] = Image::where('status', 'unprocessed')
    ->get()
    ->reduceSpread(function (int $creditsRemaining, Collection $batch, Image $image) {
        if ($creditsRemaining >= $image->creditsRequired()) {
            $batch->push($image);

            $creditsRemaining -= $image->creditsRequired();
        }

        return [$creditsRemaining, $batch];
    }, $creditsAvailable, collect());
```

<a name="method-reject"></a>
#### `reject()` {.collection-method}

`reject` 方法使用给定的闭包对集合进行筛选。如果项应从结果集合中移除，闭包应返回 `true`：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->reject(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [1, 2]
```

关于 `reject` 方法的反向操作，请参阅 [filter](#method-filter) 方法。

<a name="method-replace"></a>
#### `replace()` {.collection-method}

`replace` 方法与 `merge` 行为类似；不过，除了覆盖具有字符串键的匹配项之外，`replace` 方法还会覆盖集合中具有匹配数字键的项：

```php
$collection = collect(['Taylor', 'Abigail', 'James']);

$replaced = $collection->replace([1 => 'Victoria', 3 => 'Finn']);

$replaced->all();

// ['Taylor', 'Victoria', 'James', 'Finn']
```

<a name="method-replacerecursive"></a>
#### `replaceRecursive()` {.collection-method}

`replaceRecursive` 方法的行为与 `replace` 类似，但它会递归进入数组，并对内部值应用相同的替换过程：

```php
$collection = collect([
    'Taylor',
    'Abigail',
    [
        'James',
        'Victoria',
        'Finn'
    ]
]);

$replaced = $collection->replaceRecursive([
    'Charlie',
    2 => [1 => 'King']
]);

$replaced->all();

// ['Charlie', 'Abigail', ['James', 'King', 'Finn']]
```

<a name="method-reverse"></a>
#### `reverse()` {.collection-method}

`reverse` 方法反转集合中项的顺序，并保留原始键：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e']);

$reversed = $collection->reverse();

$reversed->all();

/*
    [
        4 => 'e',
        3 => 'd',
        2 => 'c',
        1 => 'b',
        0 => 'a',
    ]
*/
```

<a name="method-search"></a>
#### `search()` {.collection-method}

`search` 方法在集合中搜索给定的值，并在找到时返回其键。如果未找到该项，则返回 `false`：

```php
$collection = collect([2, 4, 6, 8]);

$collection->search(4);

// 1
```

搜索使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。若要使用"严格"比较，请向该方法传入 `true` 作为第二个参数：

```php
collect([2, 4, 6, 8])->search('4', strict: true);

// false
```

或者，你可以提供自己的闭包，以搜索通过给定真值测试的第一个项：

```php
collect([2, 4, 6, 8])->search(function (int $item, int $key) {
    return $item > 5;
});

// 2
```

<a name="method-select"></a>
#### `select()` {.collection-method}

`select` 方法从集合中选择给定的键，类似于 SQL 的 `SELECT` 语句：

```php
$users = collect([
    ['name' => 'Taylor Otwell', 'role' => 'Developer', 'status' => 'active'],
    ['name' => 'Victoria Faith', 'role' => 'Researcher', 'status' => 'active'],
]);

$users->select(['name', 'role']);

/*
    [
        ['name' => 'Taylor Otwell', 'role' => 'Developer'],
        ['name' => 'Victoria Faith', 'role' => 'Researcher'],
    ],
*/
```

<a name="method-shift"></a>
#### `shift()` {.collection-method}

`shift` 方法移除并返回集合中的第一个项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift();

// 1

$collection->all();

// [2, 3, 4, 5]
```

你可以向 `shift` 方法传入一个整数，以从集合开头移除并返回多个项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift(3);

// collect([1, 2, 3])

$collection->all();

// [4, 5]
```

<a name="method-shuffle"></a>
#### `shuffle()` {.collection-method}

`shuffle` 方法随机打乱集合中的项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$shuffled = $collection->shuffle();

$shuffled->all();

// [3, 2, 5, 1, 4] - (随机生成)
```

<a name="method-skip"></a>
#### `skip()` {.collection-method}

`skip` 方法返回一个新集合，并从集合开头移除给定数量的元素：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$collection = $collection->skip(4);

$collection->all();

// [5, 6, 7, 8, 9, 10]
```

<a name="method-skipuntil"></a>
#### `skipUntil()` {.collection-method}

`skipUntil` 方法会在给定回调返回 `false` 时跳过集合中的项。一旦回调返回 `true`，集合中所有剩余的项都会作为一个新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [3, 4]
```

你也可以向 `skipUntil` 方法传入一个简单的值，以跳过所有项，直到找到该给定值为止：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(3);

$subset->all();

// [3, 4]
```

> [!WARNING]
> 如果未找到给定值，或回调始终不返回 `true`，`skipUntil` 方法将返回一个空集合。

<a name="method-skipwhile"></a>
#### `skipWhile()` {.collection-method}

`skipWhile` 方法会在给定回调返回 `true` 时跳过集合中的项。一旦回调返回 `false`，集合中所有剩余的项都会作为一个新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipWhile(function (int $item) {
    return $item <= 3;
});

$subset->all();

// [4]
```

> [!WARNING]
> 如果回调始终不返回 `false`，`skipWhile` 方法将返回一个空集合。

<a name="method-slice"></a>
#### `slice()` {.collection-method}

`slice` 方法返回从给定索引开始的集合切片：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$slice = $collection->slice(4);

$slice->all();

// [5, 6, 7, 8, 9, 10]
```

如果你希望限制返回切片的大小，请将期望的大小作为第二个参数传入该方法：

```php
$slice = $collection->slice(4, 2);

$slice->all();

// [5, 6]
```

默认情况下，返回的切片会保留键。如果你不希望保留原始键，可以使用 [values](#method-values) 方法对它们重新索引。

<a name="method-sliding"></a>
#### `sliding()` {.collection-method}

`sliding` 方法返回一个新的分块集合，表示集合中项的"滑动窗口"（sliding window）视图：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(2);

$chunks->toArray();

// [[1, 2], [2, 3], [3, 4], [4, 5]]
```

这在与 [eachSpread](#method-eachspread) 方法结合使用时特别有用：

```php
$transactions->sliding(2)->eachSpread(function (Collection $previous, Collection $current) {
    $current->total = $previous->total + $current->amount;
});
```

你可以选择性地传入第二个"步长"（step）值，它决定了每个分块的第一项之间的距离：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(3, step: 2);

$chunks->toArray();

// [[1, 2, 3], [3, 4, 5]]
```

<a name="method-sole"></a>
#### `sole()` {.collection-method}

`sole` 方法返回集合中通过给定真值测试的第一个元素，但前提是该真值测试恰好只匹配一个元素：

```php
collect([1, 2, 3, 4])->sole(function (int $value, int $key) {
    return $value === 2;
});

// 2
```

你也可以向 `sole` 方法传入一个键/值对，它会返回集合中匹配该给定对的第一个元素，但前提是该匹配恰好只对应一个元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->sole('product', 'Chair');

// ['product' => 'Chair', 'price' => 100]
```

或者，如果集合中只有一个元素，你也可以不带参数调用 `sole` 方法以获取该元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
]);

$collection->sole();

// ['product' => 'Desk', 'price' => 200]
```

如果集合中没有任何元素应被 `sole` 方法返回，则会抛出 `\Illuminate\Collections\ItemNotFoundException` 异常。如果应返回的元素不止一个，则会抛出 `\Illuminate\Collections\MultipleItemsFoundException` 异常。

<a name="method-some"></a>
#### `some()` {.collection-method}

[contains](#method-contains) 方法的别名。

<a name="method-sort"></a>
#### `sort()` {.collection-method}

`sort` 方法对集合进行排序。排序后的集合会保留原始的数组键，因此在下面的示例中我们将使用 [values](#method-values) 方法将键重置为连续的编号索引：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sort();

$sorted->values()->all();

// [1, 2, 3, 4, 5]
```

如果你的排序需求更复杂，可以向 `sort` 传入一个带有自定义算法的回调。请参阅 PHP 关于 [uasort](https://secure.php.net/manual/en/function.uasort.php#refsect1-function.uasort-parameters) 的文档，集合的 `sort` 方法在内部就是调用它。

> [!NOTE]
> 如果你需要对由嵌套数组或对象组成的集合进行排序，请参阅 [sortBy](#method-sortby) 和 [sortByDesc](#method-sortbydesc) 方法。

<a name="method-sortby"></a>
#### `sortBy()` {.collection-method}

`sortBy` 方法按给定键对集合进行排序。排序后的集合会保留原始的数组键，因此在下面的示例中我们将使用 [values](#method-values) 方法将键重置为连续的编号索引：

```php
$collection = collect([
    ['name' => 'Desk', 'price' => 200],
    ['name' => 'Chair', 'price' => 100],
    ['name' => 'Bookcase', 'price' => 150],
]);

$sorted = $collection->sortBy('price');

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'price' => 100],
        ['name' => 'Bookcase', 'price' => 150],
        ['name' => 'Desk', 'price' => 200],
    ]
*/
```

`sortBy` 方法接受[排序标志](https://www.php.net/manual/en/function.sort.php)作为第二个参数：

```php
$collection = collect([
    ['title' => 'Item 1'],
    ['title' => 'Item 12'],
    ['title' => 'Item 3'],
]);

$sorted = $collection->sortBy('title', SORT_NATURAL);

$sorted->values()->all();

/*
    [
        ['title' => 'Item 1'],
        ['title' => 'Item 3'],
        ['title' => 'Item 12'],
    ]
*/
```

或者，你可以传入自己的闭包来决定如何对集合的值进行排序：

```php
$collection = collect([
    ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
    ['name' => 'Chair', 'colors' => ['Black']],
    ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
]);

$sorted = $collection->sortBy(function (array $product, int $key) {
    return count($product['colors']);
});

$sorted->values()->all();

/*
    [
        ['name' => 'Chair', 'colors' => ['Black']],
        ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
        ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
    ]
*/
```

如果你想按多个属性对集合进行排序，可以向 `sortBy` 方法传入一个排序操作数组。每个排序操作应是一个由"你希望按其排序的属性"和"期望的排序方向"组成的数组：

```php
$collection = collect([
    ['name' => 'Taylor Otwell', 'age' => 34],
    ['name' => 'Abigail Otwell', 'age' => 30],
    ['name' => 'Taylor Otwell', 'age' => 36],
    ['name' => 'Abigail Otwell', 'age' => 32],
]);

$sorted = $collection->sortBy([
    ['name', 'asc'],
    ['age', 'desc'],
]);

$sorted->values()->all();

/*
    [
        ['name' => 'Abigail Otwell', 'age' => 32],
        ['name' => 'Abigail Otwell', 'age' => 30],
        ['name' => 'Taylor Otwell', 'age' => 36],
        ['name' => 'Taylor Otwell', 'age' => 34],
    ]
*/
```

按多个属性对集合排序时，你也可以提供用于定义每个排序操作的闭包：

```php
$collection = collect([
    ['name' => 'Taylor Otwell', 'age' => 34],
    ['name' => 'Abigail Otwell', 'age' => 30],
    ['name' => 'Taylor Otwell', 'age' => 36],
    ['name' => 'Abigail Otwell', 'age' => 32],
]);

$sorted = $collection->sortBy([
    fn (array $a, array $b) => $a['name'] <=> $b['name'],
    fn (array $a, array $b) => $b['age'] <=> $a['age'],
]);

$sorted->values()->all();

/*
    [
        ['name' => 'Abigail Otwell', 'age' => 32],
        ['name' => 'Abigail Otwell', 'age' => 30],
        ['name' => 'Taylor Otwell', 'age' => 36],
        ['name' => 'Taylor Otwell', 'age' => 34],
    ]
*/
```

<a name="method-sortbydesc"></a>
#### `sortByDesc()` {.collection-method}

该方法的签名与 [sortBy](#method-sortby) 方法相同，但会以相反的顺序对集合进行排序。

<a name="method-sortdesc"></a>
#### `sortDesc()` {.collection-method}

该方法会以与 [sort](#method-sort) 方法相反的顺序对集合进行排序：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sortDesc();

$sorted->values()->all();

// [5, 4, 3, 2, 1]
```

与 `sort` 不同，你无法向 `sortDesc` 传入闭包。相反，你应该使用 [sort](#method-sort) 方法并反转你的比较逻辑。

<a name="method-sortkeys"></a>
#### `sortKeys()` {.collection-method}

`sortKeys` 方法按底层关联数组的键对集合进行排序：

```php
$collection = collect([
    'id' => 22345,
    'first' => 'John',
    'last' => 'Doe',
]);

$sorted = $collection->sortKeys();

$sorted->all();

/*
    [
        'first' => 'John',
        'id' => 22345,
        'last' => 'Doe',
    ]
*/
```

<a name="method-sortkeysdesc"></a>
#### `sortKeysDesc()` {.collection-method}

该方法的签名与 [sortKeys](#method-sortkeys) 方法相同，但会以相反的顺序对集合进行排序。

<a name="method-sortkeysusing"></a>
#### `sortKeysUsing()` {.collection-method}

`sortKeysUsing` 方法使用回调按底层关联数组的键对集合进行排序：

```php
$collection = collect([
    'ID' => 22345,
    'first' => 'John',
    'last' => 'Doe',
]);

$sorted = $collection->sortKeysUsing('strnatcasecmp');

$sorted->all();

/*
    [
        'first' => 'John',
        'ID' => 22345,
        'last' => 'Doe',
    ]
*/
```

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息请参考 PHP 关于 [uksort](https://www.php.net/manual/en/function.uksort.php#refsect1-function.uksort-parameters) 的文档，该方法是 `sortKeysUsing` 方法在内部使用的 PHP 函数。

<a name="method-splice"></a>
#### `splice()` {.collection-method}

`splice` 方法移除并返回从指定索引开始的一段项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2);

$chunk->all();

// [3, 4, 5]

$collection->all();

// [1, 2]
```

你可以传入第二个参数来限制结果集合的大小：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2, 1);

$chunk->all();

// [3]

$collection->all();

// [1, 2, 4, 5]
```

此外，你还可以传入第三个参数，其中包含用于替换从集合中移除的项的新项：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2, 1, [10, 11]);

$chunk->all();

// [3]

$collection->all();

// [1, 2, 10, 11, 4, 5]
```

<a name="method-split"></a>
#### `split()` {.collection-method}

`split` 方法将集合拆分为给定数量的组：

```php
$collection = collect([1, 2, 3, 4, 5]);

$groups = $collection->split(3);

$groups->all();

// [[1, 2], [3, 4], [5]]
```

<a name="method-splitin"></a>
#### `splitIn()` {.collection-method}

`splitIn` 方法将集合拆分为给定数量的组，在将剩余项分配给最后一个组之前，先完全填满非末尾的组：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$groups = $collection->splitIn(3);

$groups->all();

// [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```

<a name="method-sum"></a>
#### `sum()` {.collection-method}

`sum` 方法返回集合中所有项的求和结果：

```php
collect([1, 2, 3, 4, 5])->sum();

// 15
```

如果集合包含嵌套数组或对象，你应该传入一个键，用于确定要对哪些值求和：

```php
$collection = collect([
    ['name' => 'JavaScript: The Good Parts', 'pages' => 176],
    ['name' => 'JavaScript: The Definitive Guide', 'pages' => 1096],
]);

$collection->sum('pages');

// 1272
```

此外，你可以传入自己的闭包来决定对集合中的哪些值求和：

```php
$collection = collect([
    ['name' => 'Chair', 'colors' => ['Black']],
    ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
    ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
]);

$collection->sum(function (array $product) {
    return count($product['colors']);
});

// 6
```

<a name="method-take"></a>
#### `take()` {.collection-method}

`take` 方法返回一个包含指定数量项的新集合：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(3);

$chunk->all();

// [0, 1, 2]
```

你也可以传入一个负整数，以从集合末尾取出指定数量的项：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(-2);

$chunk->all();

// [4, 5]
```

<a name="method-takeuntil"></a>
#### `takeUntil()` {.collection-method}

`takeUntil` 方法返回集合中的项，直到给定回调返回 `true`：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [1, 2]
```

你也可以向 `takeUntil` 方法传入一个简单的值，以在找到该给定值之前获取项：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(3);

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果未找到给定值，或回调始终不返回 `true`，`takeUntil` 方法将返回集合中的所有项。

<a name="method-takewhile"></a>
#### `takeWhile()` {.collection-method}

`takeWhile` 方法返回集合中的项，直到给定回调返回 `false`：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeWhile(function (int $item) {
    return $item < 3;
});

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果回调始终不返回 `false`，`takeWhile` 方法将返回集合中的所有项。

<a name="method-tap"></a>
#### `tap()` {.collection-method}

`tap` 方法将集合传入给定的回调，让你可以"介入"（tap）到集合的某个特定位置并对项执行某些操作，同时不影响集合本身。随后集合会由 `tap` 方法返回：

```php
collect([2, 4, 3, 1, 5])
    ->sort()
    ->tap(function (Collection $collection) {
        Log::debug('Values after sorting', $collection->values()->all());
    })
    ->shift();

// 1
```

<a name="method-times"></a>
#### `times()` {.collection-method}

静态方法 `times` 通过调用给定闭包指定次数来创建一个新的集合：

```php
$collection = Collection::times(10, function (int $number) {
    return $number * 9;
});

$collection->all();

// [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]
```

<a name="method-toarray"></a>
#### `toArray()` {.collection-method}

`toArray` 方法将集合转换为普通的 PHP `array`。如果集合的值是 [Eloquent](/docs/{{version}}/eloquent) 模型，这些模型也会被转换为数组：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toArray();

/*
    [
        ['name' => 'Desk', 'price' => 200],
    ]
*/
```

> [!WARNING]
> `toArray` 还会将集合中所有属于 `Arrayable` 实例的嵌套对象转换为数组。如果你希望获取集合底层的原始数组，请改用 [all](#method-all) 方法。

<a name="method-tojson"></a>
#### `toJson()` {.collection-method}

`toJson` 方法将集合转换为一个 JSON 序列化字符串：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toJson();

// '{"name":"Desk", "price":200}'
```

<a name="method-to-pretty-json"></a>
#### `toPrettyJson()` {.collection-method}

`toPrettyJson` 方法使用 `JSON_PRETTY_PRINT` 选项将集合转换为格式化的 JSON 字符串：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toPrettyJson();
```

<a name="method-transform"></a>
#### `transform()` {.collection-method}

`transform` 方法遍历集合，并对集合中的每一项调用给定的回调。集合中的项会被回调返回的值替换：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->transform(function (int $item, int $key) {
    return $item * 2;
});

$collection->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 与大多数其他集合方法不同，`transform` 会修改集合本身。如果你想创建一个新集合，请改用 [map](#method-map) 方法。

<a name="method-undot"></a>
#### `undot()` {.collection-method}

`undot` 方法将使用"点"（dot）表示法的单维集合展开为多维集合：

```php
$person = collect([
    'name.first_name' => 'Marie',
    'name.last_name' => 'Valentine',
    'address.line_1' => '2992 Eagle Drive',
    'address.line_2' => '',
    'address.suburb' => 'Detroit',
    'address.state' => 'MI',
    'address.postcode' => '48219'
]);

$person = $person->undot();

$person->toArray();

/*
    [
        "name" => [
            "first_name" => "Marie",
            "last_name" => "Valentine",
        ],
        "address" => [
            "line_1" => "2992 Eagle Drive",
            "line_2" => "",
            "suburb" => "Detroit",
            "state" => "MI",
            "postcode" => "48219",
        ],
    ]
*/
```

<a name="method-union"></a>
#### `union()` {.collection-method}

`union` 方法将给定的数组添加到集合中。如果给定数组中包含原始集合已有的键，则优先保留原始集合的值：

```php
$collection = collect([1 => ['a'], 2 => ['b']]);

$union = $collection->union([3 => ['c'], 1 => ['d']]);

$union->all();

// [1 => ['a'], 2 => ['b'], 3 => ['c']]
```

<a name="method-unique"></a>
#### `unique()` {.collection-method}

`unique` 方法返回集合中的所有不重复项。返回的集合会保留原始的数组键，因此在下面的示例中我们将使用 [values](#method-values) 方法将键重置为连续的编号索引：

```php
$collection = collect([1, 1, 2, 2, 3, 4, 2]);

$unique = $collection->unique();

$unique->values()->all();

// [1, 2, 3, 4]
```

在处理嵌套数组或对象时，你可以指定用于确定唯一性的键：

```php
$collection = collect([
    ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
    ['name' => 'iPhone 5', 'brand' => 'Apple', 'type' => 'phone'],
    ['name' => 'Apple Watch', 'brand' => 'Apple', 'type' => 'watch'],
    ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
    ['name' => 'Galaxy Gear', 'brand' => 'Samsung', 'type' => 'watch'],
]);

$unique = $collection->unique('brand');

$unique->values()->all();

/*
    [
        ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
        ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
    ]
*/
```

最后，你也可以向 `unique` 方法传入自己的闭包，以指定应由哪个值来确定项的唯一性：

```php
$unique = $collection->unique(function (array $item) {
    return $item['brand'].$item['type'];
});

$unique->values()->all();

/*
    [
        ['name' => 'iPhone 6', 'brand' => 'Apple', 'type' => 'phone'],
        ['name' => 'Apple Watch', 'brand' => 'Apple', 'type' => 'watch'],
        ['name' => 'Galaxy S6', 'brand' => 'Samsung', 'type' => 'phone'],
        ['name' => 'Galaxy Gear', 'brand' => 'Samsung', 'type' => 'watch'],
    ]
*/
```

`unique` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。使用 [uniqueStrict](#method-uniquestrict) 方法可进行"严格"比较的筛选。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-unique) 时，该方法的行为会有所改变。

<a name="method-uniquestrict"></a>
#### `uniqueStrict()` {.collection-method}

该方法的签名与 [unique](#method-unique) 方法相同；但所有值都使用"严格"比较。

<a name="method-unless"></a>
#### `unless()` {.collection-method}

`unless` 方法会执行给定的回调，除非传给该方法的第一个参数求值为 `true`。集合实例以及传给 `unless` 方法的第一个参数都会被提供给闭包：

```php
$collection = collect([1, 2, 3]);

$collection->unless(true, function (Collection $collection, bool $value) {
    return $collection->push(4);
});

$collection->unless(false, function (Collection $collection, bool $value) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

可以向 `unless` 方法传入第二个回调。当传给 `unless` 方法的第一个参数求值为 `true` 时，会执行第二个回调：

```php
$collection = collect([1, 2, 3]);

$collection->unless(true, function (Collection $collection, bool $value) {
    return $collection->push(4);
}, function (Collection $collection, bool $value) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

关于 `unless` 的反向操作，请参阅 [when](#method-when) 方法。

<a name="method-unlessempty"></a>
#### `unlessEmpty()` {.collection-method}

[whenNotEmpty](#method-whennotempty) 方法的别名。

<a name="method-unlessnotempty"></a>
#### `unlessNotEmpty()` {.collection-method}

[whenEmpty](#method-whenempty) 方法的别名。

<a name="method-unwrap"></a>
#### `unwrap()` {.collection-method}

静态方法 `unwrap` 会在适用时从给定值中返回集合底层的项：

```php
Collection::unwrap(collect('John Doe'));

// ['John Doe']

Collection::unwrap(['John Doe']);

// ['John Doe']

Collection::unwrap('John Doe');

// 'John Doe'
```

<a name="method-value"></a>
#### `value()` {.collection-method}

`value` 方法从集合的第一个元素中检索给定值：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Speaker', 'price' => 400],
]);

$value = $collection->value('price');

// 200
```

<a name="method-values"></a>
#### `values()` {.collection-method}

`values` 方法返回一个新集合，其键被重置为连续的整数：

```php
$collection = collect([
    10 => ['product' => 'Desk', 'price' => 200],
    11 => ['product' => 'Speaker', 'price' => 400],
]);

$values = $collection->values();

$values->all();

/*
    [
        0 => ['product' => 'Desk', 'price' => 200],
        1 => ['product' => 'Speaker', 'price' => 400],
    ]
*/
```

<a name="method-when"></a>
#### `when()` {.collection-method}

`when` 方法会在传给该方法的第一个参数求值为 `true` 时执行给定的回调。集合实例以及传给 `when` 方法的第一个参数都会被提供给闭包：

```php
$collection = collect([1, 2, 3]);

$collection->when(true, function (Collection $collection, bool $value) {
    return $collection->push(4);
});

$collection->when(false, function (Collection $collection, bool $value) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 4]
```

可以向 `when` 方法传入第二个回调。当传给 `when` 方法的第一个参数求值为 `false` 时，会执行第二个回调：

```php
$collection = collect([1, 2, 3]);

$collection->when(false, function (Collection $collection, bool $value) {
    return $collection->push(4);
}, function (Collection $collection, bool $value) {
    return $collection->push(5);
});

$collection->all();

// [1, 2, 3, 5]
```

关于 `when` 的反向操作，请参阅 [unless](#method-unless) 方法。

<a name="method-whenempty"></a>
#### `whenEmpty()` {.collection-method}

`whenEmpty` 方法会在集合为空时执行给定的回调：

```php
$collection = collect(['Michael', 'Tom']);

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// ['Michael', 'Tom']

$collection = collect();

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// ['Adam']
```

可以向 `whenEmpty` 方法传入第二个闭包，它会在集合不为空时执行：

```php
$collection = collect(['Michael', 'Tom']);

$collection->whenEmpty(function (Collection $collection) {
    return $collection->push('Adam');
}, function (Collection $collection) {
    return $collection->push('Taylor');
});

$collection->all();

// ['Michael', 'Tom', 'Taylor']
```

关于 `whenEmpty` 的反向操作，请参阅 [whenNotEmpty](#method-whennotempty) 方法。

<a name="method-whennotempty"></a>
#### `whenNotEmpty()` {.collection-method}

`whenNotEmpty` 方法会在集合不为空时执行给定的回调：

```php
$collection = collect(['Michael', 'Tom']);

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// ['Michael', 'Tom', 'Adam']

$collection = collect();

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('Adam');
});

$collection->all();

// []
```

可以向 `whenNotEmpty` 方法传入第二个闭包，它会在集合为空时执行：

```php
$collection = collect();

$collection->whenNotEmpty(function (Collection $collection) {
    return $collection->push('Adam');
}, function (Collection $collection) {
    return $collection->push('Taylor');
});

$collection->all();

// ['Taylor']
```

关于 `whenNotEmpty` 的反向操作，请参阅 [whenEmpty](#method-whenempty) 方法。

<a name="method-where"></a>
#### `where()` {.collection-method}

`where` 方法按给定的键/值对筛选集合：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->where('price', 100);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 100],
        ['product' => 'Door', 'price' => 100],
    ]
*/
```

`where` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。使用 [whereStrict](#method-wherestrict) 方法进行"严格"比较的筛选，或使用 [whereNull](#method-wherenull) 和 [whereNotNull](#method-wherenotnull) 方法来筛选 `null` 值。

你也可以选择性地传入一个比较运算符作为第二个参数。支持的运算符有：'==='、'!=='、'!='、'=='、'='、'<>'、'>'、'<'、'>=' 和 '<='：

```php
$collection = collect([
    ['name' => 'Jim', 'platform' => 'Mac'],
    ['name' => 'Sally', 'platform' => 'Mac'],
    ['name' => 'Sue', 'platform' => 'Linux'],
]);

$filtered = $collection->where('platform', '!=', 'Linux');

$filtered->all();

/*
    [
        ['name' => 'Jim', 'platform' => 'Mac'],
        ['name' => 'Sally', 'platform' => 'Mac'],
    ]
*/
```

<a name="method-wherestrict"></a>
#### `whereStrict()` {.collection-method}

该方法的签名与 [where](#method-where) 方法相同；但所有值都使用"严格"比较。

<a name="method-wherebetween"></a>
#### `whereBetween()` {.collection-method}

`whereBetween` 方法通过判断指定项值是否在给定的范围内来筛选集合：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 80],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Pencil', 'price' => 30],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereBetween('price', [100, 200]);

$filtered->all();

/*
    [
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Bookcase', 'price' => 150],
        ['product' => 'Door', 'price' => 100],
    ]
*/
```

<a name="method-wherein"></a>
#### `whereIn()` {.collection-method}

`whereIn` 方法会从集合中移除那些在给定数组中不包含指定项值的元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereIn('price', [150, 200]);

$filtered->all();

/*
    [
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Bookcase', 'price' => 150],
    ]
*/
```

`whereIn` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。使用 [whereInStrict](#method-whereinstrict) 方法进行"严格"比较的筛选。

<a name="method-whereinstrict"></a>
#### `whereInStrict()` {.collection-method}

该方法的签名与 [whereIn](#method-wherein) 方法相同；但所有值都使用"严格"比较。

<a name="method-whereinstanceof"></a>
#### `whereInstanceOf()` {.collection-method}

`whereInstanceOf` 方法按给定的类类型筛选集合：

```php
use App\Models\User;
use App\Models\Post;

$collection = collect([
    new User,
    new User,
    new Post,
]);

$filtered = $collection->whereInstanceOf(User::class);

$filtered->all();

// [App\Models\User, App\Models\User]
```

<a name="method-wherenotbetween"></a>
#### `whereNotBetween()` {.collection-method}

`whereNotBetween` 方法通过判断指定项值是否在给定的范围之外来筛选集合：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 80],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Pencil', 'price' => 30],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereNotBetween('price', [100, 200]);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 80],
        ['product' => 'Pencil', 'price' => 30],
    ]
*/
```

<a name="method-wherenotin"></a>
#### `whereNotIn()` {.collection-method}

`whereNotIn` 方法会从集合中移除那些在给定数组中包含指定项值的元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
    ['product' => 'Bookcase', 'price' => 150],
    ['product' => 'Door', 'price' => 100],
]);

$filtered = $collection->whereNotIn('price', [150, 200]);

$filtered->all();

/*
    [
        ['product' => 'Chair', 'price' => 100],
        ['product' => 'Door', 'price' => 100],
    ]
*/
```

`whereNotIn` 方法在检查项值时使用"松散"比较，这意味着包含整数值的字符串会被视为与该整数值相等。使用 [whereNotInStrict](#method-wherenotinstrict) 方法进行"严格"比较的筛选。

<a name="method-wherenotinstrict"></a>
#### `whereNotInStrict()` {.collection-method}

该方法的签名与 [whereNotIn](#method-wherenotin) 方法相同；但所有值都使用"严格"比较。

<a name="method-wherenotnull"></a>
#### `whereNotNull()` {.collection-method}

`whereNotNull` 方法返回集合中给定键不为 `null` 的项：

```php
$collection = collect([
    ['name' => 'Desk'],
    ['name' => null],
    ['name' => 'Bookcase'],
    ['name' => 0],
    ['name' => ''],
]);

$filtered = $collection->whereNotNull('name');

$filtered->all();

/*
    [
        ['name' => 'Desk'],
        ['name' => 'Bookcase'],
        ['name' => 0],
        ['name' => ''],
    ]
*/
```

<a name="method-wherenull"></a>
#### `whereNull()` {.collection-method}

`whereNull` 方法返回集合中给定键为 `null` 的项：

```php
$collection = collect([
    ['name' => 'Desk'],
    ['name' => null],
    ['name' => 'Bookcase'],
    ['name' => 0],
    ['name' => ''],
]);

$filtered = $collection->whereNull('name');

$filtered->all();

/*
    [
        ['name' => null],
    ]
*/
```

<a name="method-wrap"></a>
#### `wrap()` {.collection-method}

静态方法 `wrap` 会在适用时将给定值包装为一个集合：

```php
use Illuminate\Support\Collection;

$collection = Collection::wrap('John Doe');

$collection->all();

// ['John Doe']

$collection = Collection::wrap(['John Doe']);

$collection->all();

// ['John Doe']

$collection = Collection::wrap(collect('John Doe'));

$collection->all();

// ['John Doe']
```

<a name="method-zip"></a>
#### `zip()` {.collection-method}

`zip` 方法将给定数组的值与原集合在对应索引处的值合并在一起：

```php
$collection = collect(['Chair', 'Desk']);

$zipped = $collection->zip([100, 200]);

$zipped->all();

// [['Chair', 100], ['Desk', 200]]
```

<a name="higher-order-messages"></a>
## 高阶消息

集合还提供对"高阶消息"（higher order messages）的支持，它们是对集合执行常见操作的快捷方式。提供高阶消息的集合方法有：[average](#method-average)、[avg](#method-avg)、[contains](#method-contains)、[each](#method-each)、[every](#method-every)、[filter](#method-filter)、[first](#method-first)、[flatMap](#method-flatmap)、[groupBy](#method-groupby)、[keyBy](#method-keyby)、[map](#method-map)、[max](#method-max)、[min](#method-min)、[partition](#method-partition)、[reject](#method-reject)、[skipUntil](#method-skipuntil)、[skipWhile](#method-skipwhile)、[some](#method-some)、[sortBy](#method-sortby)、[sortByDesc](#method-sortbydesc)、[sum](#method-sum)、[takeUntil](#method-takeuntil)、[takeWhile](#method-takewhile) 和 [unique](#method-unique)。

每个高阶消息都可以作为集合实例上的动态属性来访问。例如，让我们使用 `each` 高阶消息来调用集合中每个对象的方法：

```php
use App\Models\User;

$users = User::where('votes', '>', 500)->get();

$users->each->markAsVip();
```

同样地，我们可以使用 `sum` 高阶消息来汇总一组用户的总"票数"（votes）：

```php
$users = User::where('group', 'Development')->get();

return $users->sum->votes;
```

<a name="lazy-collections"></a>
## 惰性集合

<a name="lazy-collection-introduction"></a>
### 简介

> [!WARNING]
> 在深入了解 Laravel 的惰性集合之前，请先花些时间熟悉 [PHP 生成器](https://www.php.net/manual/en/language.generators.overview.php)。

为了补充已经十分强大的 `Collection` 类，`LazyCollection` 类借助 PHP 的[生成器](https://www.php.net/manual/en/language.generators.overview.php)（generators），让你在处理非常庞大的数据集时仍能保持较低的内存占用。

例如，假设你的应用需要处理一个多 GB 的日志文件，同时利用 Laravel 的集合方法来解析日志。惰性集合不会一次性将整个文件读入内存，而是可以在给定时间只保留文件的一小部分在内存中：

```php
use App\Models\LogEntry;
use Illuminate\Support\LazyCollection;

LazyCollection::make(function () {
    $handle = fopen('log.txt', 'r');

    while (($line = fgets($handle)) !== false) {
        yield $line;
    }

    fclose($handle);
})->chunk(4)->map(function (array $lines) {
    return LogEntry::fromLines($lines);
})->each(function (LogEntry $logEntry) {
    // 处理日志条目...
});
```

再比如，假设你需要遍历 10000 个 Eloquent 模型。使用传统的 Laravel 集合时，所有 10000 个 Eloquent 模型都必须同时加载到内存中：

```php
use App\Models\User;

$users = User::all()->filter(function (User $user) {
    return $user->id > 500;
});
```

不过，查询构造器的 `cursor` 方法会返回一个 `LazyCollection` 实例。这样你仍然只需对数据库执行一次查询，同时每次只在内存中保留一个 Eloquent 模型。在此例中，`filter` 回调直到我们真正逐个遍历每个用户时才会执行，从而大幅降低了内存占用：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

<a name="creating-lazy-collections"></a>
### 创建惰性集合

要创建惰性集合实例，你应该向集合的 `make` 方法传入一个 PHP 生成器函数：

```php
use Illuminate\Support\LazyCollection;

LazyCollection::make(function () {
    $handle = fopen('log.txt', 'r');

    while (($line = fgets($handle)) !== false) {
        yield $line;
    }

    fclose($handle);
});
```

<a name="the-enumerable-contract"></a>
### Enumerable 契约

`Collection` 类上几乎所有可用的方法在 `LazyCollection` 类上也同样可用。这两个类都实现了 `Illuminate\Support\Enumerable` 契约，该契约定义了以下方法：

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

<div class="collection-method-list" markdown="1">

[all](#method-all)
[average](#method-average)
[avg](#method-avg)
[chunk](#method-chunk)
[chunkBy](#method-chunkby)
[chunkWhile](#method-chunkwhile)
[collapse](#method-collapse)
[collect](#method-collect)
[combine](#method-combine)
[concat](#method-concat)
[contains](#method-contains)
[containsStrict](#method-containsstrict)
[count](#method-count)
[countBy](#method-countBy)
[crossJoin](#method-crossjoin)
[dd](#method-dd)
[diff](#method-diff)
[diffAssoc](#method-diffassoc)
[diffKeys](#method-diffkeys)
[dump](#method-dump)
[duplicates](#method-duplicates)
[duplicatesStrict](#method-duplicatesstrict)
[each](#method-each)
[eachSpread](#method-eachspread)
[every](#method-every)
[except](#method-except)
[filter](#method-filter)
[first](#method-first)
[firstOrFail](#method-first-or-fail)
[firstWhere](#method-first-where)
[flatMap](#method-flatmap)
[flatten](#method-flatten)
[flip](#method-flip)
[forPage](#method-forpage)
[get](#method-get)
[groupBy](#method-groupby)
[has](#method-has)
[implode](#method-implode)
[intersect](#method-intersect)
[intersectAssoc](#method-intersectAssoc)
[intersectByKeys](#method-intersectbykeys)
[isEmpty](#method-isempty)
[isNotEmpty](#method-isnotempty)
[join](#method-join)
[keyBy](#method-keyby)
[keys](#method-keys)
[last](#method-last)
[macro](#method-macro)
[make](#method-make)
[map](#method-map)
[mapInto](#method-mapinto)
[mapSpread](#method-mapspread)
[mapToGroups](#method-maptogroups)
[mapWithKeys](#method-mapwithkeys)
[max](#method-max)
[median](#method-median)
[merge](#method-merge)
[mergeRecursive](#method-mergerecursive)
[min](#method-min)
[mode](#method-mode)
[nth](#method-nth)
[only](#method-only)
[pad](#method-pad)
[partition](#method-partition)
[pipe](#method-pipe)
[pluck](#method-pluck)
[random](#method-random)
[reduce](#method-reduce)
[reduceInto](#method-reduce-into)
[reject](#method-reject)
[replace](#method-replace)
[replaceRecursive](#method-replacerecursive)
[reverse](#method-reverse)
[search](#method-search)
[shuffle](#method-shuffle)
[skip](#method-skip)
[slice](#method-slice)
[sole](#method-sole)
[some](#method-some)
[sort](#method-sort)
[sortBy](#method-sortby)
[sortByDesc](#method-sortbydesc)
[sortKeys](#method-sortkeys)
[sortKeysDesc](#method-sortkeysdesc)
[split](#method-split)
[sum](#method-sum)
[take](#method-take)
[tap](#method-tap)
[times](#method-times)
[toArray](#method-toarray)
[toJson](#method-tojson)
[union](#method-union)
[unique](#method-unique)
[uniqueStrict](#method-uniquestrict)
[unless](#method-unless)
[unlessEmpty](#method-unlessempty)
[unlessNotEmpty](#method-unlessnotempty)
[unwrap](#method-unwrap)
[values](#method-values)
[when](#method-when)
[whenEmpty](#method-whenempty)
[whenNotEmpty](#method-whennotempty)
[where](#method-where)
[whereStrict](#method-wherestrict)
[whereBetween](#method-wherebetween)
[whereIn](#method-wherein)
[whereInStrict](#method-whereinstrict)
[whereInstanceOf](#method-whereinstanceof)
[whereNotBetween](#method-wherenotbetween)
[whereNotIn](#method-wherenotin)
[whereNotInStrict](#method-wherenotinstrict)
[wrap](#method-wrap)
[zip](#method-zip)

</div>

> [!WARNING]
> 会修改集合的方法（如 `shift`、`pop`、`prepend` 等）在 `LazyCollection` 类上**不可用**。

<a name="lazy-collection-methods"></a>
### 惰性集合方法

除了 `Enumerable` 契约中定义的方法外，`LazyCollection` 类还包含以下方法：

<a name="method-takeUntilTimeout"></a>
#### `takeUntilTimeout()` {.collection-method}

`takeUntilTimeout` 方法返回一个新惰性集合，它会枚举值直到指定时间为止。超过该时间后，集合将停止枚举：

```php
$lazyCollection = LazyCollection::times(INF)
    ->takeUntilTimeout(now()->plus(minutes: 1));

$lazyCollection->each(function (int $number) {
    dump($number);

    sleep(1);
});

// 1
// 2
// ...
// 58
// 59
```

为了说明该方法的用法，假设有一个应用通过游标从数据库提交发票。你可以定义一个[定时任务](/docs/{{version}}/scheduling)，它每 15 分钟运行一次，最多只处理 14 分钟的发票：

```php
use App\Models\Invoice;
use Illuminate\Support\Carbon;

Invoice::pending()->cursor()
    ->takeUntilTimeout(
        Carbon::createFromTimestamp(LARAVEL_START)->add(14, 'minutes')
    )
    ->each(fn (Invoice $invoice) => $invoice->submit());
```

<a name="method-tapEach"></a>
#### `tapEach()` {.collection-method}

`each` 方法会立即对集合中的每一项调用给定的回调，而 `tapEach` 方法只会在项被逐个从列表中取出时调用给定的回调：

```php
// 到目前为止还没有任何内容被 dump...
$lazyCollection = LazyCollection::times(INF)->tapEach(function (int $value) {
    dump($value);
});

// 三个项被 dump...
$array = $lazyCollection->take(3)->all();

// 1
// 2
// 3
```

<a name="method-throttle"></a>
#### `throttle()` {.collection-method}

`throttle` 方法会对惰性集合进行节流，使每个值在经过指定秒数后才返回。当你需要与限制请求频率的外部 API 交互时，该方法特别有用：

```php
use App\Models\User;

User::where('vip', true)
    ->cursor()
    ->throttle(seconds: 1)
    ->each(function (User $user) {
        // 调用外部 API...
    });
```

<a name="method-remember"></a>
#### `remember()` {.collection-method}

`remember` 方法返回一个新惰性集合，它会记住任何已经被枚举过的值，并在后续枚举集合时不再重复获取它们：

```php
// 还没有执行任何查询...
$users = User::cursor()->remember();

// 查询已执行...
// 前 5 个用户从数据库中水合（hydrate）...
$users->take(5)->all();

// 前 5 个用户来自集合的缓存...
// 其余用户从数据库中水合...
$users->take(20)->all();
```

<a name="method-with-heartbeat"></a>
#### `withHeartbeat()` {.collection-method}

`withHeartbeat` 方法允许你在惰性集合枚举的过程中，按固定的时间间隔执行回调。这对于需要定期执行维护任务（如延长锁的持有时间或发送进度更新）的长时间运行操作特别有用：

```php
use Carbon\CarbonInterval;
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('generate-reports', seconds: 60 * 5);

if ($lock->get()) {
    try {
        Report::where('status', 'pending')
            ->lazy()
            ->withHeartbeat(
                CarbonInterval::minutes(4),
                fn () => $lock->extend(CarbonInterval::minutes(5))
            )
            ->each(fn ($report) => $report->process());
    } finally {
        $lock->release();
    }
}
```
