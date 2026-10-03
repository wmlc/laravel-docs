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

`Illuminate\Support\Collection` 类为处理数据数组提供了一套流畅、便捷的封装。来看下面的例子。我们将使用 `collect` 辅助函数从数组创建一个新的集合实例，对每个元素执行 `strtoupper` 函数，然后移除所有空元素：

    $collection = collect(['taylor', 'abigail', null])->map(function (?string $name) {
        return strtoupper($name);
    })->reject(function (string $name) {
        return empty($name);
    });

如你所见，`Collection` 类允许你链式调用其方法，从而以流畅方式对底层数组做映射和归约。一般来说，集合是不可变的，也就是说每个 `Collection` 方法都会返回一个全新的 `Collection` 实例。

<a name="creating-collections"></a>
### 创建集合

如上所述，`collect` 辅助函数会为给定数组返回一个全新的 `Illuminate\Support\Collection` 实例。因此，创建集合非常简单：

    $collection = collect([1, 2, 3]);

> [!NOTE]
> [Eloquent](/docs/{{version}}/eloquent) 查询的结果总是以 `Collection` 实例的形式返回。

<a name="extending-collections"></a>
### 扩展集合

集合支持"宏化"，这让你可以在运行时向 `Collection` 类添加额外的方法。`Illuminate\Support\Collection` 类的 `macro` 方法接受一个闭包，调用宏时该闭包就会执行。在宏闭包中，你可以像访问集合类的真实方法一样，通过 `$this` 访问集合的其他方法。例如，以下代码为 `Collection` 类添加了一个 `toUpper` 方法：

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

通常，你应当在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中声明集合宏。

<a name="macro-arguments"></a>
#### 宏参数

如果需要，你可以定义接受额外参数的宏：

    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\Lang;

    Collection::macro('toLocale', function (string $locale) {
        return $this->map(function (string $value) use ($locale) {
            return Lang::get($value, [], $locale);
        });
    });

    $collection = collect(['first', 'second']);

    $translated = $collection->toLocale('es');

<a name="available-methods"></a>
## 可用方法

在余下的大部分集合文档中，我们会逐一介绍 `Collection` 类上可用的每个方法。请记住，所有这些方法都可以链式调用，以流畅的方式操作底层数组。此外，几乎每个方法都会返回一个新的 `Collection` 实例，让你在必要时保留集合的原始副本：

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
[chunkWhile](#method-chunkwhile)
[collapse](#method-collapse)
[collapseWithKeys](#method-collapsewithkeys)
[collect](#method-collect)
[combine](#method-combine)
[concat](#method-concat)
[contains](#method-contains)
[containsOneItem](#method-containsoneitem)
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
[get](#method-get)
[groupBy](#method-groupby)
[has](#method-has)
[hasAny](#method-hasany)
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

`after` 方法返回给定元素之后的那一项。如果未找到给定元素，或该元素是最后一项，则返回 `null`：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->after(3);

    // 4

    $collection->after(5);

    // null

该方法使用"宽松"比较来查找给定元素，也就是说，包含整数值的字符串会被视为与同值整数相等。若要使用"严格"比较，可以向该方法传入 `strict` 参数：

    collect([2, 4, 6, 8])->after('4', strict: true);

    // null

此外，你也可以传入自己的闭包，来查找第一个通过给定真值测试的元素：

    collect([2, 4, 6, 8])->after(function (int $item, int $key) {
        return $item > 5;
    });

    // 8

<a name="method-all"></a>
#### `all()` {.collection-method}

`all` 方法返回集合所表示的底层数组：

    collect([1, 2, 3])->all();

    // [1, 2, 3]

<a name="method-average"></a>
#### `average()` {.collection-method}

[`avg`](#method-avg) 方法的别名。

<a name="method-avg"></a>
#### `avg()` {.collection-method}

`avg` 方法返回给定键的[平均值](https://en.wikipedia.org/wiki/Average)：

    $average = collect([
        ['foo' => 10],
        ['foo' => 10],
        ['foo' => 20],
        ['foo' => 40]
    ])->avg('foo');

    // 20

    $average = collect([1, 1, 2, 4])->avg();

    // 2

<a name="method-before"></a>
#### `before()` {.collection-method}

`before` 方法与 [`after`](#method-after) 方法相反，它返回给定元素之前的那一项。如果未找到给定元素，或该元素是第一项，则返回 `null`：

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

<a name="method-chunk"></a>
#### `chunk()` {.collection-method}

`chunk` 方法将集合拆分为多个指定大小的、更小的集合：

    $collection = collect([1, 2, 3, 4, 5, 6, 7]);

    $chunks = $collection->chunk(4);

    $chunks->all();

    // [[1, 2, 3, 4], [5, 6, 7]]

在[视图](/docs/{{version}}/views)中使用网格系统（例如 [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/)）时，该方法尤其有用。例如，假设你有一个想要以网格形式展示的 [Eloquent](/docs/{{version}}/eloquent) 模型集合：

```blade
@foreach ($products->chunk(3) as $chunk)
    <div class="row">
        @foreach ($chunk as $product)
            <div class="col-xs-4">{{ $product->name }}</div>
        @endforeach
    </div>
@endforeach
```

<a name="method-chunkwhile"></a>
#### `chunkWhile()` {.collection-method}

`chunkWhile` 方法根据给定回调的求值结果，将集合拆分为多个更小的集合。传给闭包的 `$chunk` 变量可用于检查上一个元素：

    $collection = collect(str_split('AABBCCCD'));

    $chunks = $collection->chunkWhile(function (string $value, int $key, Collection $chunk) {
        return $value === $chunk->last();
    });

    $chunks->all();

    // [['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]

<a name="method-collapse"></a>
#### `collapse()` {.collection-method}

`collapse` 方法将一组数组的集合合并为单个扁平的集合：

    $collection = collect([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ]);

    $collapsed = $collection->collapse();

    $collapsed->all();

    // [1, 2, 3, 4, 5, 6, 7, 8, 9]

<a name="method-collapsewithkeys"></a>
#### `collapseWithKeys()` {.collection-method}

`collapseWithKeys` 方法将一组数组或集合的集合扁平化为单个集合，同时保留原始键：

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

<a name="method-collect"></a>
#### `collect()` {.collection-method}

`collect` 方法返回一个全新的 `Collection` 实例，其中包含当前集合里的元素：

    $collectionA = collect([1, 2, 3]);

    $collectionB = $collectionA->collect();

    $collectionB->all();

    // [1, 2, 3]

`collect` 方法主要用于把[惰性集合](#lazy-collections)转换为标准的 `Collection` 实例：

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

> [!NOTE]
> 当你手上有一个 `Enumerable` 实例却需要非惰性集合实例时，`collect` 方法尤其有用。由于 `collect()` 属于 `Enumerable` 契约的一部分，你可以放心地使用它来获取 `Collection` 实例。

<a name="method-combine"></a>
#### `combine()` {.collection-method}

`combine` 方法把集合的值作为键，与另一个数组或集合的值进行组合：

    $collection = collect(['name', 'age']);

    $combined = $collection->combine(['George', 29]);

    $combined->all();

    // ['name' => 'George', 'age' => 29]

<a name="method-concat"></a>
#### `concat()` {.collection-method}

`concat` 方法把给定 `array` 或集合的值追加到另一个集合的末尾：

    $collection = collect(['John Doe']);

    $concatenated = $collection->concat(['Jane Doe'])->concat(['name' => 'Johnny Doe']);

    $concatenated->all();

    // ['John Doe', 'Jane Doe', 'Johnny Doe']

`concat` 方法会对追加到原集合的元素按数字重新索引键。若要在关联集合中保留键，请参阅 [merge](#method-merge) 方法。

<a name="method-contains"></a>
#### `contains()` {.collection-method}

`contains` 方法判断集合中是否包含给定元素。你可以向 `contains` 方法传入一个闭包，用来判断集合中是否存在满足给定真值测试的元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->contains(function (int $value, int $key) {
        return $value > 5;
    });

    // false

此外，你可以向 `contains` 方法传入一个字符串，用来判断集合中是否包含给定的元素值：

    $collection = collect(['name' => 'Desk', 'price' => 100]);

    $collection->contains('Desk');

    // true

    $collection->contains('New York');

    // false

你也可以向 `contains` 方法传入一个键 / 值对，用来判断该键值对是否存在于集合中：

    $collection = collect([
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Chair', 'price' => 100],
    ]);

    $collection->contains('product', 'Bookcase');

    // false

`contains` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。如需使用"严格"比较进行过滤，请使用 [`containsStrict`](#method-containsstrict) 方法。

关于 `contains` 的反操作，请参阅 [doesntContain](#method-doesntcontain) 方法。

<a name="method-containsoneitem"></a>
#### `containsOneItem()` {.collection-method}

`containsOneItem` 方法判断集合中是否只包含一个元素：

    collect([])->containsOneItem();

    // false

    collect(['1'])->containsOneItem();

    // true

    collect(['1', '2'])->containsOneItem();

    // false

<a name="method-containsstrict"></a>
#### `containsStrict()` {.collection-method}

该方法与 [`contains`](#method-contains) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-contains) 时，该方法的行为会有所改变。

<a name="method-count"></a>
#### `count()` {.collection-method}

`count` 方法返回集合中元素的总数量：

    $collection = collect([1, 2, 3, 4]);

    $collection->count();

    // 4

<a name="method-countBy"></a>
#### `countBy()` {.collection-method}

`countBy` 方法统计集合中各个值的出现次数。默认情况下，该方法会统计每个元素的出现次数，从而让你统计集合中特定"类型"的元素：

    $collection = collect([1, 2, 2, 2, 3]);

    $counted = $collection->countBy();

    $counted->all();

    // [1 => 1, 2 => 3, 3 => 1]

你可以向 `countBy` 方法传入一个闭包，按自定义值对所有元素进行统计：

    $collection = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']);

    $counted = $collection->countBy(function (string $email) {
        return substr(strrchr($email, "@"), 1);
    });

    $counted->all();

    // ['gmail.com' => 2, 'yahoo.com' => 1]

<a name="method-crossjoin"></a>
#### `crossJoin()` {.collection-method}

`crossJoin` 方法在给定的数组或集合之间对集合的值做交叉连接，返回包含所有可能组合的笛卡尔积：

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

<a name="method-dd"></a>
#### `dd()` {.collection-method}

`dd` 方法转储集合中的元素并终止脚本执行：

    $collection = collect(['John Doe', 'Jane Doe']);

    $collection->dd();

    /*
        Collection {
            #items: array:2 [
                0 => "John Doe"
                1 => "Jane Doe"
            ]
        }
    */

如果你不想终止脚本执行，请改用 [`dump`](#method-dump) 方法。

<a name="method-diff"></a>
#### `diff()` {.collection-method}

`diff` 方法基于值将集合与另一个集合或普通 PHP `array` 进行比较。该方法会返回原集合中未出现在给定集合里的值：

    $collection = collect([1, 2, 3, 4, 5]);

    $diff = $collection->diff([2, 4, 6, 8]);

    $diff->all();

    // [1, 3, 5]

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-diff) 时，该方法的行为会有所改变。

<a name="method-diffassoc"></a>
#### `diffAssoc()` {.collection-method}

`diffAssoc` 方法基于键和值将集合与另一个集合或普通 PHP `array` 进行比较。该方法会返回原集合中未出现在给定集合里的键 / 值对：

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

<a name="method-diffassocusing"></a>
#### `diffAssocUsing()` {.collection-method}

与 `diffAssoc` 不同，`diffAssocUsing` 接受一个由用户提供的回调函数用于索引比较：

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

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息请参考 PHP 文档中关于 [`array_diff_uassoc`](https://www.php.net/array_diff_uassoc#refsect1-function.array-diff-uassoc-parameters) 的说明，`diffAssocUsing` 方法内部正是使用这个 PHP 函数。

<a name="method-diffkeys"></a>
#### `diffKeys()` {.collection-method}

`diffKeys` 方法基于键将集合与另一个集合或普通 PHP `array` 进行比较。该方法会返回原集合中未出现在给定集合里的键 / 值对：

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

<a name="method-doesntcontain"></a>
#### `doesntContain()` {.collection-method}

`doesntContain` 方法判断集合中是否不包含给定元素。你可以向 `doesntContain` 方法传入一个闭包，用来判断集合中是否存在不满足给定真值测试的元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->doesntContain(function (int $value, int $key) {
        return $value < 5;
    });

    // false

此外，你可以向 `doesntContain` 方法传入一个字符串，用来判断集合中是否不包含给定的元素值：

    $collection = collect(['name' => 'Desk', 'price' => 100]);

    $collection->doesntContain('Table');

    // true

    $collection->doesntContain('Desk');

    // false

你也可以向 `doesntContain` 方法传入一个键 / 值对，用来判断该键值对是否不存在于集合中：

    $collection = collect([
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Chair', 'price' => 100],
    ]);

    $collection->doesntContain('product', 'Bookcase');

    // true

`doesntContain` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。

<a name="method-dot"></a>
#### `dot()` {.collection-method}

`dot` 方法将多维集合扁平化为单层集合，并使用"点"记号来表示深度：

    $collection = collect(['products' => ['desk' => ['price' => 100]]]);

    $flattened = $collection->dot();

    $flattened->all();

    // ['products.desk.price' => 100]

<a name="method-dump"></a>
#### `dump()` {.collection-method}

`dump` 方法转储集合中的元素：

    $collection = collect(['John Doe', 'Jane Doe']);

    $collection->dump();

    /*
        Collection {
            #items: array:2 [
                0 => "John Doe"
                1 => "Jane Doe"
            ]
        }
    */

如果你希望在转储集合后终止脚本执行，请改用 [`dd`](#method-dd) 方法。

<a name="method-duplicates"></a>
#### `duplicates()` {.collection-method}

`duplicates` 方法获取并返回集合中重复的值：

    $collection = collect(['a', 'b', 'a', 'c', 'b']);

    $collection->duplicates();

    // [2 => 'a', 4 => 'b']

如果集合中包含数组或对象，你可以传入希望检查重复值的属性键：

    $employees = collect([
        ['email' => 'abigail@example.com', 'position' => 'Developer'],
        ['email' => 'james@example.com', 'position' => 'Designer'],
        ['email' => 'victoria@example.com', 'position' => 'Developer'],
    ]);

    $employees->duplicates('position');

    // [2 => 'Developer']

<a name="method-duplicatesstrict"></a>
#### `duplicatesStrict()` {.collection-method}

该方法与 [`duplicates`](#method-duplicates) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

<a name="method-each"></a>
#### `each()` {.collection-method}

`each` 方法遍历集合中的元素，并把每个元素传给一个闭包：

    $collection = collect([1, 2, 3, 4]);

    $collection->each(function (int $item, int $key) {
        // ...
    });

如果你想提前结束遍历，可以在闭包中返回 `false`：

    $collection->each(function (int $item, int $key) {
        if (/* condition */) {
            return false;
        }
    });

<a name="method-eachspread"></a>
#### `eachSpread()` {.collection-method}

`eachSpread` 方法遍历集合中的元素，把每个嵌套的元素值传给给定回调：

    $collection = collect([['John Doe', 35], ['Jane Doe', 33]]);

    $collection->eachSpread(function (string $name, int $age) {
        // ...
    });

你可以在回调中返回 `false` 以提前结束遍历：

    $collection->eachSpread(function (string $name, int $age) {
        return false;
    });

<a name="method-ensure"></a>
#### `ensure()` {.collection-method}

`ensure` 方法可用于验证集合中的所有元素都是给定类型或给定类型列表之一。否则将抛出 `UnexpectedValueException` 异常：

    return $collection->ensure(User::class);

    return $collection->ensure([User::class, Customer::class]);

也可以指定 `string`、`int`、`float`、`bool` 和 `array` 等基本类型：

    return $collection->ensure('int');

> [!WARNING]
> `ensure` 方法并不保证日后不会有其他类型的元素被加入该集合。

<a name="method-every"></a>
#### `every()` {.collection-method}

`every` 方法可用于验证集合中所有元素是否都通过给定真值测试：

    collect([1, 2, 3, 4])->every(function (int $value, int $key) {
        return $value > 2;
    });

    // false

如果集合为空，`every` 方法将返回 true：

    $collection = collect([]);

    $collection->every(function (int $value, int $key) {
        return $value > 2;
    });

    // true

<a name="method-except"></a>
#### `except()` {.collection-method}

`except` 方法返回集合中除指定键之外的所有元素：

    $collection = collect(['product_id' => 1, 'price' => 100, 'discount' => false]);

    $filtered = $collection->except(['price', 'discount']);

    $filtered->all();

    // ['product_id' => 1]

关于 `except` 的反操作，请参阅 [only](#method-only) 方法。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-except) 时，该方法的行为会有所改变。

<a name="method-filter"></a>
#### `filter()` {.collection-method}

`filter` 方法使用给定回调过滤集合，只保留通过给定真值测试的元素：

    $collection = collect([1, 2, 3, 4]);

    $filtered = $collection->filter(function (int $value, int $key) {
        return $value > 2;
    });

    $filtered->all();

    // [3, 4]

如果不提供回调，集合中所有等同于 `false` 的条目都会被移除：

    $collection = collect([1, 2, 3, null, false, '', 0, []]);

    $collection->filter()->all();

    // [1, 2, 3]

关于 `filter` 的反操作，请参阅 [reject](#method-reject) 方法。

<a name="method-first"></a>
#### `first()` {.collection-method}

`first` 方法返回集合中第一个通过给定真值测试的元素：

    collect([1, 2, 3, 4])->first(function (int $value, int $key) {
        return $value > 2;
    });

    // 3

你也可以不带参数调用 `first` 方法来获取集合中的第一个元素。如果集合为空，则返回 `null`：

    collect([1, 2, 3, 4])->first();

    // 1

<a name="method-first-or-fail"></a>
#### `firstOrFail()` {.collection-method}

`firstOrFail` 方法与 `first` 方法完全相同；区别在于如果没有找到结果，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

    collect([1, 2, 3, 4])->firstOrFail(function (int $value, int $key) {
        return $value > 5;
    });

    // Throws ItemNotFoundException...

你也可以不带参数调用 `firstOrFail` 方法来获取集合中的第一个元素。如果集合为空，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

    collect([])->firstOrFail();

    // Throws ItemNotFoundException...

<a name="method-first-where"></a>
#### `firstWhere()` {.collection-method}

`firstWhere` 方法返回集合中具有给定键 / 值对的第一个元素：

    $collection = collect([
        ['name' => 'Regena', 'age' => null],
        ['name' => 'Linda', 'age' => 14],
        ['name' => 'Diego', 'age' => 23],
        ['name' => 'Linda', 'age' => 84],
    ]);

    $collection->firstWhere('name', 'Linda');

    // ['name' => 'Linda', 'age' => 14]

你也可以带比较运算符调用 `firstWhere` 方法：

    $collection->firstWhere('age', '>=', 18);

    // ['name' => 'Diego', 'age' => 23]

与 [where](#method-where) 方法一样，你可以只向 `firstWhere` 方法传入一个参数。在这种情况下，`firstWhere` 方法会返回给定元素键的值为"真"的第一个元素：

    $collection->firstWhere('age');

    // ['name' => 'Linda', 'age' => 14]

<a name="method-flatmap"></a>
#### `flatMap()` {.collection-method}

`flatMap` 方法遍历集合并把每个值传给给定闭包。闭包可以修改该元素并返回它，从而形成一个新的、包含修改后元素的集合。随后，数组会被扁平化一层：

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

<a name="method-flatten"></a>
#### `flatten()` {.collection-method}

`flatten` 方法将多维集合扁平化为单一维度：

    $collection = collect([
        'name' => 'taylor',
        'languages' => [
            'php', 'javascript'
        ]
    ]);

    $flattened = $collection->flatten();

    $flattened->all();

    // ['taylor', 'php', 'javascript'];

如果需要，你还可以向 `flatten` 方法传入一个"深度"参数：

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

在本例中，如果调用 `flatten` 时不提供深度，嵌套数组也会被扁平化，结果为 `['iPhone 6S', 'Apple', 'Galaxy S7', 'Samsung']`。提供深度可以让你指定嵌套数组将被扁平化的层数。

<a name="method-flip"></a>
#### `flip()` {.collection-method}

`flip` 方法交换集合的键与对应的值：

    $collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

    $flipped = $collection->flip();

    $flipped->all();

    // ['taylor' => 'name', 'laravel' => 'framework']

<a name="method-forget"></a>
#### `forget()` {.collection-method}

`forget` 方法按键从集合中移除某个元素：

    $collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

    // 移除单个键...
    $collection->forget('name');

    // ['framework' => 'laravel']

    // 移除多个键...
    $collection->forget(['name', 'framework']);

    // []

> [!WARNING]
> 与大多数其他集合方法不同，`forget` 不会返回一个新的、经过修改的集合；它会修改并返回调用它的那个集合。

<a name="method-forpage"></a>
#### `forPage()` {.collection-method}

`forPage` 方法返回一个全新集合，其中包含指定页码上应有的元素。该方法的第一个参数是页码，第二个参数是每页显示的元素数量：

    $collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    $chunk = $collection->forPage(2, 3);

    $chunk->all();

    // [4, 5, 6]

<a name="method-get"></a>
#### `get()` {.collection-method}

`get` 方法返回给定键对应的元素。如果该键不存在，则返回 `null`：

    $collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

    $value = $collection->get('name');

    // taylor

你还可以选择性地把默认值作为第二个参数传入：

    $collection = collect(['name' => 'taylor', 'framework' => 'laravel']);

    $value = $collection->get('age', 34);

    // 34

你甚至可以把回调作为该方法的默认值传入。如果指定的键不存在，就会返回回调的执行结果：

    $collection->get('email', function () {
        return 'taylor@example.com';
    });

    // taylor@example.com

<a name="method-groupby"></a>
#### `groupBy()` {.collection-method}

`groupBy` 方法按给定键对集合中的元素进行分组：

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

除了传入字符串 `key` 之外，你也可以传入一个回调。该回调应返回你希望用于分组的值：

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

可以传入数组形式的多个分组条件。每个数组元素都会应用到多维数组中对应的层级：

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

<a name="method-has"></a>
#### `has()` {.collection-method}

`has` 方法判断给定键是否存在于集合中：

    $collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

    $collection->has('product');

    // true

    $collection->has(['product', 'amount']);

    // true

    $collection->has(['amount', 'price']);

    // false

<a name="method-hasany"></a>
#### `hasAny()` {.collection-method}

`hasAny` 方法判断给定的任意一个键是否存在于集合中：

    $collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

    $collection->hasAny(['product', 'price']);

    // true

    $collection->hasAny(['name', 'price']);

    // false

<a name="method-implode"></a>
#### `implode()` {.collection-method}

`implode` 方法把集合中的元素连接成一个字符串。它的参数取决于集合中元素的类型。如果集合中包含数组或对象，你应当传入希望连接的属性键，以及希望放置在值之间的"粘合"字符串：

    $collection = collect([
        ['account_id' => 1, 'product' => 'Desk'],
        ['account_id' => 2, 'product' => 'Chair'],
    ]);

    $collection->implode('product', ', ');

    // Desk, Chair

如果集合中包含简单字符串或数值，你应当把"粘合"字符串作为该方法的唯一参数传入：

    collect([1, 2, 3, 4, 5])->implode('-');

    // '1-2-3-4-5'

如果你希望对被连接的值进行格式化，可以向 `implode` 方法传入一个回调：

    $collection->implode(function (array $item, int $key) {
        return strtoupper($item['product']);
    }, ', ');

    // DESK, CHAIR

<a name="method-intersect"></a>
#### `intersect()` {.collection-method}

`intersect` 方法从原集合中移除所有未出现在给定 `array` 或集合中的值。得到的集合会保留原集合的键：

    $collection = collect(['Desk', 'Sofa', 'Chair']);

    $intersect = $collection->intersect(['Desk', 'Chair', 'Bookcase']);

    $intersect->all();

    // [0 => 'Desk', 2 => 'Chair']

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-intersect) 时，该方法的行为会有所改变。

<a name="method-intersectusing"></a>
#### `intersectUsing()` {.collection-method}

`intersectUsing` 方法使用自定义回调来比较值，并从原集合中移除所有未出现在给定 `array` 或集合中的值。得到的集合会保留原集合的键：

    $collection = collect(['Desk', 'Sofa', 'Chair']);

    $intersect = $collection->intersectUsing(['desk', 'chair', 'bookcase'], function ($a, $b) {
        return strcasecmp($a, $b);
    });
    
    $intersect->all();
    
    // [0 => 'Desk', 2 => 'Chair']

<a name="method-intersectAssoc"></a>
#### `intersectAssoc()` {.collection-method}

`intersectAssoc` 方法将原集合与另一个集合或 `array` 进行比较，返回所有给定集合中都存在的键 / 值对：

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

<a name="method-intersectassocusing"></a>
#### `intersectAssocUsing()` {.collection-method}

`intersectAssocUsing` 方法将原集合与另一个集合或 `array` 进行比较，使用自定义比较回调来判断键和值是否相等，并返回两者都存在的键 / 值对：

    $collection = collect([
        'color' => 'red',
        'Size' => 'M',
        'material' => 'cotton',
    ]);

    $intersect = $collection->intersectAssocUsing([
        'color' => 'blue',
        'size' => 'M',
        'material' => 'polyester',
    ], function ($a, $b) {
        return strcasecmp($a, $b);
    });

    $intersect->all();

    // ['Size' => 'M']

<a name="method-intersectbykeys"></a>
#### `intersectByKeys()` {.collection-method}

`intersectByKeys` 方法从原集合中移除所有未出现在给定 `array` 或集合中的键及其对应的值：

    $collection = collect([
        'serial' => 'UX301', 'type' => 'screen', 'year' => 2009,
    ]);

    $intersect = $collection->intersectByKeys([
        'reference' => 'UX404', 'type' => 'tab', 'year' => 2011,
    ]);

    $intersect->all();

    // ['type' => 'screen', 'year' => 2009]

<a name="method-isempty"></a>
#### `isEmpty()` {.collection-method}

如果集合为空，`isEmpty` 方法返回 `true`；否则返回 `false`：

    collect([])->isEmpty();

    // true

<a name="method-isnotempty"></a>
#### `isNotEmpty()` {.collection-method}

如果集合不为空，`isNotEmpty` 方法返回 `true`；否则返回 `false`：

    collect([])->isNotEmpty();

    // false

<a name="method-join"></a>
#### `join()` {.collection-method}

`join` 方法用一个字符串把集合的值连接起来。通过该方法的第二个参数，你还可以指定最后一个元素应如何追加到字符串上：

    collect(['a', 'b', 'c'])->join(', '); // 'a, b, c'
    collect(['a', 'b', 'c'])->join(', ', ', and '); // 'a, b, and c'
    collect(['a', 'b'])->join(', ', ' and '); // 'a and b'
    collect(['a'])->join(', ', ' and '); // 'a'
    collect([])->join(', ', ' and '); // ''

<a name="method-keyby"></a>
#### `keyBy()` {.collection-method}

`keyBy` 方法按给定键为集合设定键。如果多个元素拥有相同的键，那么只有最后一个会出现在新集合中：

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

你也可以向该方法传入一个回调。该回调应返回用于为集合设定键的值：

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

<a name="method-keys"></a>
#### `keys()` {.collection-method}

`keys` 方法返回集合中所有的键：

    $collection = collect([
        'prod-100' => ['product_id' => 'prod-100', 'name' => 'Desk'],
        'prod-200' => ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]);

    $keys = $collection->keys();

    $keys->all();

    // ['prod-100', 'prod-200']

<a name="method-last"></a>
#### `last()` {.collection-method}

`last` 方法返回集合中最后一个通过给定真值测试的元素：

    collect([1, 2, 3, 4])->last(function (int $value, int $key) {
        return $value < 3;
    });

    // 2

你也可以不带参数调用 `last` 方法来获取集合中的最后一个元素。如果集合为空，则返回 `null`：

    collect([1, 2, 3, 4])->last();

    // 4

<a name="method-lazy"></a>
#### `lazy()` {.collection-method}

`lazy` 方法从底层的元素数组返回一个全新的 [`LazyCollection`](#lazy-collections) 实例：

    $lazyCollection = collect([1, 2, 3, 4])->lazy();

    $lazyCollection::class;

    // Illuminate\Support\LazyCollection

    $lazyCollection->all();

    // [1, 2, 3, 4]

当你想对一个包含大量元素的 `Collection` 进行转换时，该方法尤其有用：

    $count = $hugeCollection
        ->lazy()
        ->where('country', 'FR')
        ->where('balance', '>', '100')
        ->count();

把集合转换为 `LazyCollection` 后，你就无需再分配大量额外内存。虽然原集合仍会把_它自己_的值保留在内存中，但后续的过滤操作不会如此。因此，在过滤集合结果时几乎不会分配额外的内存。

<a name="method-macro"></a>
#### `macro()` {.collection-method}

静态 `macro` 方法允许你在运行时向 `Collection` 类添加方法。更多信息请参阅[扩展集合](#extending-collections)相关文档。

<a name="method-make"></a>
#### `make()` {.collection-method}

静态 `make` 方法创建一个全新的集合实例。请参阅[创建集合](#creating-collections)一节。

<a name="method-map"></a>
#### `map()` {.collection-method}

`map` 方法遍历集合并把每个值传给给定回调。回调可以修改该元素并返回它，从而形成一个新的、包含修改后元素的集合：

    $collection = collect([1, 2, 3, 4, 5]);

    $multiplied = $collection->map(function (int $item, int $key) {
        return $item * 2;
    });

    $multiplied->all();

    // [2, 4, 6, 8, 10]

> [!WARNING]
> 与大多数其他集合方法一样，`map` 返回一个新的集合实例；它不会修改调用它的那个集合。如果你想转换原集合，请使用 [`transform`](#method-transform) 方法。

<a name="method-mapinto"></a>
#### `mapInto()` {.collection-method}

`mapInto()` 方法遍历集合，把值传入给定类的构造函数，从而创建该类的新实例：

    class Currency
    {
        /**
         * 创建一个新的 Currency 实例。
         */
        function __construct(
            public string $code,
        ) {}
    }

    $collection = collect(['USD', 'EUR', 'GBP']);

    $currencies = $collection->mapInto(Currency::class);

    $currencies->all();

    // [Currency('USD'), Currency('EUR'), Currency('GBP')]

<a name="method-mapspread"></a>
#### `mapSpread()` {.collection-method}

`mapSpread` 方法遍历集合中的元素，把每个嵌套的元素值传给给定闭包。闭包可以修改该元素并返回它，从而形成一个新的、包含修改后元素的集合：

    $collection = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    $chunks = $collection->chunk(2);

    $sequence = $chunks->mapSpread(function (int $even, int $odd) {
        return $even + $odd;
    });

    $sequence->all();

    // [1, 5, 9, 13, 17]

<a name="method-maptogroups"></a>
#### `mapToGroups()` {.collection-method}

`mapToGroups` 方法按给定闭包对集合中的元素进行分组。该闭包应返回一个包含单个键 / 值对的关联数组，从而形成一个新的、包含分组值的集合：

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

<a name="method-mapwithkeys"></a>
#### `mapWithKeys()` {.collection-method}

`mapWithKeys` 方法遍历集合并把每个值传给给定回调。该回调应返回一个包含单个键 / 值对的关联数组：

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

<a name="method-max"></a>
#### `max()` {.collection-method}

`max` 方法返回给定键的最大值：

    $max = collect([
        ['foo' => 10],
        ['foo' => 20]
    ])->max('foo');

    // 20

    $max = collect([1, 2, 3, 4, 5])->max();

    // 5

<a name="method-median"></a>
#### `median()` {.collection-method}

`median` 方法返回给定键的[中位数](https://en.wikipedia.org/wiki/Median)：

    $median = collect([
        ['foo' => 10],
        ['foo' => 10],
        ['foo' => 20],
        ['foo' => 40]
    ])->median('foo');

    // 15

    $median = collect([1, 1, 2, 4])->median();

    // 1.5

<a name="method-merge"></a>
#### `merge()` {.collection-method}

`merge` 方法把给定数组或集合与原集合合并。如果给定元素中的字符串键与原集合中的字符串键匹配，那么给定元素的值将覆盖原集合中的值：

    $collection = collect(['product_id' => 1, 'price' => 100]);

    $merged = $collection->merge(['price' => 200, 'discount' => false]);

    $merged->all();

    // ['product_id' => 1, 'price' => 200, 'discount' => false]

如果给定元素的键是数值，其值将被追加到集合末尾：

    $collection = collect(['Desk', 'Chair']);

    $merged = $collection->merge(['Bookcase', 'Door']);

    $merged->all();

    // ['Desk', 'Chair', 'Bookcase', 'Door']

<a name="method-mergerecursive"></a>
#### `mergeRecursive()` {.collection-method}

`mergeRecursive` 方法递归地把给定数组或集合与原集合合并。如果给定元素中的字符串键与原集合中的字符串键匹配，那么这些键对应的值会被合并到一个数组中，并且这一过程是递归进行的：

    $collection = collect(['product_id' => 1, 'price' => 100]);

    $merged = $collection->mergeRecursive([
        'product_id' => 2,
        'price' => 200,
        'discount' => false
    ]);

    $merged->all();

    // ['product_id' => [1, 2], 'price' => [100, 200], 'discount' => false]

<a name="method-min"></a>
#### `min()` {.collection-method}

`min` 方法返回给定键的最小值：

    $min = collect([['foo' => 10], ['foo' => 20]])->min('foo');

    // 10

    $min = collect([1, 2, 3, 4, 5])->min();

    // 1

<a name="method-mode"></a>
#### `mode()` {.collection-method}

`mode` 方法返回给定键的[众数](https://en.wikipedia.org/wiki/Mode_(statistics))：

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

<a name="method-multiply"></a>
#### `multiply()` {.collection-method}

`multiply` 方法为集合中所有元素创建指定数量的副本：

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

`nth` 方法创建一个由每第 n 个元素组成的新集合：

    $collection = collect(['a', 'b', 'c', 'd', 'e', 'f']);

    $collection->nth(4);

    // ['a', 'e']

你还可以选择性地把起始偏移量作为第二个参数传入：

    $collection->nth(4, 1);

    // ['b', 'f']

<a name="method-only"></a>
#### `only()` {.collection-method}

`only` 方法返回集合中具有指定键的元素：

    $collection = collect([
        'product_id' => 1,
        'name' => 'Desk',
        'price' => 100,
        'discount' => false
    ]);

    $filtered = $collection->only(['product_id', 'name']);

    $filtered->all();

    // ['product_id' => 1, 'name' => 'Desk']

关于 `only` 的反操作，请参阅 [except](#method-except) 方法。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-only) 时，该方法的行为会有所改变。

<a name="method-pad"></a>
#### `pad()` {.collection-method}

`pad` 方法会用给定值填充数组，直到数组达到指定大小。该方法的行为与 PHP 的 [array_pad](https://secure.php.net/manual/en/function.array-pad.php) 函数一致。

若要从左侧填充，应当指定一个负的大小。如果给定大小的绝对值小于或等于数组长度，则不会进行任何填充：

    $collection = collect(['A', 'B', 'C']);

    $filtered = $collection->pad(5, 0);

    $filtered->all();

    // ['A', 'B', 'C', 0, 0]

    $filtered = $collection->pad(-5, 0);

    $filtered->all();

    // [0, 0, 'A', 'B', 'C']

<a name="method-partition"></a>
#### `partition()` {.collection-method}

`partition` 方法可以与 PHP 数组解构配合使用，把通过给定真值测试的元素与未通过的元素分离开来：

    $collection = collect([1, 2, 3, 4, 5, 6]);

    [$underThree, $equalOrAboveThree] = $collection->partition(function (int $i) {
        return $i < 3;
    });

    $underThree->all();

    // [1, 2]

    $equalOrAboveThree->all();

    // [3, 4, 5, 6]

<a name="method-percentage"></a>
#### `percentage()` {.collection-method}

`percentage` 方法可用于快速确定集合中通过给定真值测试的元素所占的百分比：

```php
$collection = collect([1, 1, 2, 2, 2, 3]);

$percentage = $collection->percentage(fn ($value) => $value === 1);

// 33.33
```

默认情况下，百分比会四舍五入到两位小数。不过，你可以通过向该方法提供第二个参数来定制这一行为：

```php
$percentage = $collection->percentage(fn ($value) => $value === 1, precision: 3);

// 33.333
```

<a name="method-pipe"></a>
#### `pipe()` {.collection-method}

`pipe` 方法把集合传给给定闭包，并返回闭包执行后的结果：

    $collection = collect([1, 2, 3]);

    $piped = $collection->pipe(function (Collection $collection) {
        return $collection->sum();
    });

    // 6

<a name="method-pipeinto"></a>
#### `pipeInto()` {.collection-method}

`pipeInto` 方法创建给定类的新实例，并把集合传入其构造函数：

    class ResourceCollection
    {
        /**
         * 创建一个新的 ResourceCollection 实例。
         */
        public function __construct(
            public Collection $collection,
        ) {}
    }

    $collection = collect([1, 2, 3]);

    $resource = $collection->pipeInto(ResourceCollection::class);

    $resource->collection->all();

    // [1, 2, 3]

<a name="method-pipethrough"></a>
#### `pipeThrough()` {.collection-method}

`pipeThrough` 方法把集合传给给定的闭包数组，并返回这些闭包执行后的结果：

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

<a name="method-pluck"></a>
#### `pluck()` {.collection-method}

`pluck` 方法获取给定键的所有值：

    $collection = collect([
        ['product_id' => 'prod-100', 'name' => 'Desk'],
        ['product_id' => 'prod-200', 'name' => 'Chair'],
    ]);

    $plucked = $collection->pluck('name');

    $plucked->all();

    // ['Desk', 'Chair']

你还可以指定你希望结果集合使用什么键：

    $plucked = $collection->pluck('name', 'product_id');

    $plucked->all();

    // ['prod-100' => 'Desk', 'prod-200' => 'Chair']

`pluck` 方法也支持使用"点"记号获取嵌套值：

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

如果存在重复的键，那么最后匹配的元素会被放入 pluck 得到的集合中：

    $collection = collect([
        ['brand' => 'Tesla',  'color' => 'red'],
        ['brand' => 'Pagani', 'color' => 'white'],
        ['brand' => 'Tesla',  'color' => 'black'],
        ['brand' => 'Pagani', 'color' => 'orange'],
    ]);

    $plucked = $collection->pluck('color', 'brand');

    $plucked->all();

    // ['Tesla' => 'black', 'Pagani' => 'orange']

<a name="method-pop"></a>
#### `pop()` {.collection-method}

`pop` 方法移除并返回集合中的最后一个元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->pop();

    // 5

    $collection->all();

    // [1, 2, 3, 4]

你可以向 `pop` 方法传入一个整数，以移除并返回集合末尾的多个元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->pop(3);

    // collect([5, 4, 3])

    $collection->all();

    // [1, 2]

<a name="method-prepend"></a>
#### `prepend()` {.collection-method}

`prepend` 方法把一个元素添加到集合开头：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->prepend(0);

    $collection->all();

    // [0, 1, 2, 3, 4, 5]

你还可以传入第二个参数来指定被前置元素的键：

    $collection = collect(['one' => 1, 'two' => 2]);

    $collection->prepend(0, 'zero');

    $collection->all();

    // ['zero' => 0, 'one' => 1, 'two' => 2]

<a name="method-pull"></a>
#### `pull()` {.collection-method}

`pull` 方法按键移除并返回集合中的某个元素：

    $collection = collect(['product_id' => 'prod-100', 'name' => 'Desk']);

    $collection->pull('name');

    // 'Desk'

    $collection->all();

    // ['product_id' => 'prod-100']

<a name="method-push"></a>
#### `push()` {.collection-method}

`push` 方法把一个元素追加到集合末尾：

    $collection = collect([1, 2, 3, 4]);

    $collection->push(5);

    $collection->all();

    // [1, 2, 3, 4, 5]

<a name="method-put"></a>
#### `put()` {.collection-method}

`put` 方法在集合中设置给定的键和值：

    $collection = collect(['product_id' => 1, 'name' => 'Desk']);

    $collection->put('price', 100);

    $collection->all();

    // ['product_id' => 1, 'name' => 'Desk', 'price' => 100]

<a name="method-random"></a>
#### `random()` {.collection-method}

`random` 方法从集合中返回一个随机元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->random();

    // 4 -（随机获取）

你可以向 `random` 传入一个整数，指定希望随机获取多少个元素。当明确传入希望获取的元素数量时，总会返回一个元素集合：

    $random = $collection->random(3);

    $random->all();

    // [2, 4, 5] -（随机获取）

如果集合实例的元素数量少于请求的数量，`random` 方法会抛出 `InvalidArgumentException` 异常。

`random` 方法还接受一个闭包，该闭包会收到当前的集合实例：

    use Illuminate\Support\Collection;

    $random = $collection->random(fn (Collection $items) => min(10, count($items)));

    $random->all();

    // [1, 2, 3, 4, 5] -（随机获取）

<a name="method-range"></a>
#### `range()` {.collection-method}

`range` 方法返回一个包含指定范围内整数的集合：

    $collection = collect()->range(3, 6);

    $collection->all();

    // [3, 4, 5, 6]

<a name="method-reduce"></a>
#### `reduce()` {.collection-method}

`reduce` 方法把集合归约为单个值，并把每次迭代的结果传入下一次迭代：

    $collection = collect([1, 2, 3]);

    $total = $collection->reduce(function (?int $carry, int $item) {
        return $carry + $item;
    });

    // 6

第一次迭代时 `$carry` 的值为 `null`；不过，你可以通过向 `reduce` 传入第二个参数来指定它的初始值：

    $collection->reduce(function (int $carry, int $item) {
        return $carry + $item;
    }, 4);

    // 10

在关联集合中，`reduce` 方法还会把数组键传给给定回调：

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

    $collection->reduce(function (int $carry, int $value, int $key) use ($ratio) {
        return $carry + ($value * $ratio[$key]);
    });

    // 4264

<a name="method-reduce-spread"></a>
#### `reduceSpread()` {.collection-method}

`reduceSpread` 方法把集合归约为一个值数组，并把每次迭代的结果传入下一次迭代。该方法与 `reduce` 方法类似；区别在于它可以接受多个初始值：

    [$creditsRemaining, $batch] = Image::where('status', 'unprocessed')
        ->get()
        ->reduceSpread(function (int $creditsRemaining, Collection $batch, Image $image) {
            if ($creditsRemaining >= $image->creditsRequired()) {
                $batch->push($image);

                $creditsRemaining -= $image->creditsRequired();
            }

            return [$creditsRemaining, $batch];
        }, $creditsAvailable, collect());

<a name="method-reject"></a>
#### `reject()` {.collection-method}

`reject` 方法使用给定闭包过滤集合。如果某个元素应当从结果集合中移除，闭包应返回 `true`：

    $collection = collect([1, 2, 3, 4]);

    $filtered = $collection->reject(function (int $value, int $key) {
        return $value > 2;
    });

    $filtered->all();

    // [1, 2]

关于 `reject` 方法的反操作，请参阅 [`filter`](#method-filter) 方法。

<a name="method-replace"></a>
#### `replace()` {.collection-method}

`replace` 方法的行为与 `merge` 类似；区别在于，除了覆盖具有相同字符串键的元素之外，`replace` 方法还会覆盖集合中具有相同数字键的元素：

    $collection = collect(['Taylor', 'Abigail', 'James']);

    $replaced = $collection->replace([1 => 'Victoria', 3 => 'Finn']);

    $replaced->all();

    // ['Taylor', 'Victoria', 'James', 'Finn']

<a name="method-replacerecursive"></a>
#### `replaceRecursive()` {.collection-method}

该方法的工作方式与 `replace` 类似，但它会递归进入数组，并对内部的值应用相同的替换过程：

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

<a name="method-reverse"></a>
#### `reverse()` {.collection-method}

`reverse` 方法反转集合中元素的顺序，同时保留原始键：

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

<a name="method-search"></a>
#### `search()` {.collection-method}

`search` 方法在集合中查找给定值，找到后返回其键。如果未找到该元素，则返回 `false`：

    $collection = collect([2, 4, 6, 8]);

    $collection->search(4);

    // 1

查找过程使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。若要使用"严格"比较，请把 `true` 作为该方法的第二个参数传入：

    collect([2, 4, 6, 8])->search('4', strict: true);

    // false

此外，你也可以传入自己的闭包，来查找第一个通过给定真值测试的元素：

    collect([2, 4, 6, 8])->search(function (int $item, int $key) {
        return $item > 5;
    });

    // 2

<a name="method-select"></a>
#### `select()` {.collection-method}

`select` 方法从集合中选出给定的键，类似于 SQL 的 `SELECT` 语句：

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

`shift` 方法移除并返回集合中的第一个元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->shift();

    // 1

    $collection->all();

    // [2, 3, 4, 5]

你可以向 `shift` 方法传入一个整数，以移除并返回集合开头的多个元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->shift(3);

    // collect([1, 2, 3])

    $collection->all();

    // [4, 5]

<a name="method-shuffle"></a>
#### `shuffle()` {.collection-method}

`shuffle` 方法随机打乱集合中的元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $shuffled = $collection->shuffle();

    $shuffled->all();

    // [3, 2, 5, 1, 4] -（随机生成）

<a name="method-skip"></a>
#### `skip()` {.collection-method}

`skip` 方法返回一个全新集合，其中已从集合开头移除了给定数量的元素：

    $collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    $collection = $collection->skip(4);

    $collection->all();

    // [5, 6, 7, 8, 9, 10]

<a name="method-skipuntil"></a>
#### `skipUntil()` {.collection-method}

只要给定回调返回 `false`，`skipUntil` 方法就会跳过集合中的元素。一旦回调返回 `true`，集合中剩余的所有元素都会作为一个新集合被返回：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->skipUntil(function (int $item) {
        return $item >= 3;
    });

    $subset->all();

    // [3, 4]

你也可以向 `skipUntil` 方法传入一个简单值，以跳过所有元素，直到找到该值为止：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->skipUntil(3);

    $subset->all();

    // [3, 4]

> [!WARNING]
> 如果未找到给定值，或回调始终没有返回 `true`，`skipUntil` 方法将返回一个空集合。

<a name="method-skipwhile"></a>
#### `skipWhile()` {.collection-method}

只要给定回调返回 `true`，`skipWhile` 方法就会跳过集合中的元素。一旦回调返回 `false`，集合中剩余的所有元素都会作为一个新集合被返回：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->skipWhile(function (int $item) {
        return $item <= 3;
    });

    $subset->all();

    // [4]

> [!WARNING]
> 如果回调始终没有返回 `false`，`skipWhile` 方法将返回一个空集合。

<a name="method-slice"></a>
#### `slice()` {.collection-method}

`slice` 方法返回从给定索引开始的一段集合切片：

    $collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    $slice = $collection->slice(4);

    $slice->all();

    // [5, 6, 7, 8, 9, 10]

如果你希望限制返回切片的大小，请把期望的大小作为该方法的第二个参数传入：

    $slice = $collection->slice(4, 2);

    $slice->all();

    // [5, 6]

返回的切片默认会保留键。如果不希望保留原始键，可以使用 [`values`](#method-values) 方法重新索引。

<a name="method-sliding"></a>
#### `sliding()` {.collection-method}

`sliding` 方法返回一个由若干块组成的新集合，它呈现了集合中元素的"滑动窗口"视图：

    $collection = collect([1, 2, 3, 4, 5]);

    $chunks = $collection->sliding(2);

    $chunks->toArray();

    // [[1, 2], [2, 3], [3, 4], [4, 5]]

该方法与 [`eachSpread`](#method-eachspread) 方法配合使用时尤其有用：

    $transactions->sliding(2)->eachSpread(function (Collection $previous, Collection $current) {
        $current->total = $previous->total + $current->amount;
    });

你还可以选择性地传入第二个"步长"值，它决定了每个块首元素之间的距离：

    $collection = collect([1, 2, 3, 4, 5]);

    $chunks = $collection->sliding(3, step: 2);

    $chunks->toArray();

    // [[1, 2, 3], [3, 4, 5]]

<a name="method-sole"></a>
#### `sole()` {.collection-method}

`sole` 方法返回集合中第一个通过给定真值测试的元素，但前提是该真值测试恰好只匹配一个元素：

    collect([1, 2, 3, 4])->sole(function (int $value, int $key) {
        return $value === 2;
    });

    // 2

你也可以向 `sole` 方法传入一个键 / 值对，它会返回集合中与该键值对匹配的第一个元素，但前提是恰好只有一个元素匹配：

    $collection = collect([
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Chair', 'price' => 100],
    ]);

    $collection->sole('product', 'Chair');

    // ['product' => 'Chair', 'price' => 100]

此外，如果集合中只有一个元素，你也可以不带参数调用 `sole` 方法来获取该元素：

    $collection = collect([
        ['product' => 'Desk', 'price' => 200],
    ]);

    $collection->sole();

    // ['product' => 'Desk', 'price' => 200]

如果集合中没有任何元素应由 `sole` 方法返回，将抛出 `\Illuminate\Collections\ItemNotFoundException` 异常。如果有多个元素应当被返回，将抛出 `\Illuminate\Collections\MultipleItemsFoundException` 异常。

<a name="method-some"></a>
#### `some()` {.collection-method}

[`contains`](#method-contains) 方法的别名。

<a name="method-sort"></a>
#### `sort()` {.collection-method}

`sort` 方法对集合进行排序。排序后的集合会保留原始数组键，因此在下面的例子中，我们会使用 [`values`](#method-values) 方法把键重置为连续编号的索引：

    $collection = collect([5, 3, 1, 2, 4]);

    $sorted = $collection->sort();

    $sorted->values()->all();

    // [1, 2, 3, 4, 5]

如果你的排序需求更复杂，可以向 `sort` 传入一个带有自定义算法的回调。请参考 PHP 文档中关于 [`uasort`](https://secure.php.net/manual/en/function.uasort.php#refsect1-function.uasort-parameters) 的说明，集合的 `sort` 方法内部正是使用这个函数。

> [!NOTE]
> 如果你需要对嵌套数组或对象的集合进行排序，请参阅 [`sortBy`](#method-sortby) 和 [`sortByDesc`](#method-sortbydesc) 方法。

<a name="method-sortby"></a>
#### `sortBy()` {.collection-method}

`sortBy` 方法按给定键对集合进行排序。排序后的集合会保留原始数组键，因此在下面的例子中，我们会使用 [`values`](#method-values) 方法把键重置为连续编号的索引：

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

`sortBy` 方法接受[排序标记](https://www.php.net/manual/en/function.sort.php)作为其第二个参数：

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

此外，你可以传入自己的闭包，来决定如何对集合的值进行排序：

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

如果你希望按多个属性对集合进行排序，可以向 `sortBy` 方法传入一个排序操作数组。每个排序操作都应是一个数组，包含你希望排序的属性以及期望的排序方向：

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

按多个属性对集合进行排序时，你也可以提供用于定义各个排序操作的闭包：

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

<a name="method-sortbydesc"></a>
#### `sortByDesc()` {.collection-method}

该方法与 [`sortBy`](#method-sortby) 方法签名相同，但会以相反的顺序对集合进行排序。

<a name="method-sortdesc"></a>
#### `sortDesc()` {.collection-method}

该方法会以与 [`sort`](#method-sort) 方法相反的顺序对集合进行排序：

    $collection = collect([5, 3, 1, 2, 4]);

    $sorted = $collection->sortDesc();

    $sorted->values()->all();

    // [5, 4, 3, 2, 1]

与 `sort` 不同，你不能向 `sortDesc` 传入闭包。相反，你应当使用 [`sort`](#method-sort) 方法并反转比较逻辑。

<a name="method-sortkeys"></a>
#### `sortKeys()` {.collection-method}

`sortKeys` 方法按底层关联数组的键对集合进行排序：

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

<a name="method-sortkeysdesc"></a>
#### `sortKeysDesc()` {.collection-method}

该方法与 [`sortKeys`](#method-sortkeys) 方法签名相同，但会以相反的顺序对集合进行排序。

<a name="method-sortkeysusing"></a>
#### `sortKeysUsing()` {.collection-method}

`sortKeysUsing` 方法使用回调，按底层关联数组的键对集合进行排序：

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

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息请参考 PHP 文档中关于 [`uksort`](https://www.php.net/manual/en/function.uksort.php#refsect1-function.uksort-parameters) 的说明，`sortKeysUsing` 方法内部正是使用这个 PHP 函数。

<a name="method-splice"></a>
#### `splice()` {.collection-method}

`splice` 方法移除并返回从指定索引开始的一段元素切片：

    $collection = collect([1, 2, 3, 4, 5]);

    $chunk = $collection->splice(2);

    $chunk->all();

    // [3, 4, 5]

    $collection->all();

    // [1, 2]

你可以传入第二个参数来限制结果集合的大小：

    $collection = collect([1, 2, 3, 4, 5]);

    $chunk = $collection->splice(2, 1);

    $chunk->all();

    // [3]

    $collection->all();

    // [1, 2, 4, 5]

此外，你还可以传入第三个参数，其中包含用于替换从集合中移除元素的新元素：

    $collection = collect([1, 2, 3, 4, 5]);

    $chunk = $collection->splice(2, 1, [10, 11]);

    $chunk->all();

    // [3]

    $collection->all();

    // [1, 2, 10, 11, 4, 5]

<a name="method-split"></a>
#### `split()` {.collection-method}

`split` 方法把集合拆分为给定数量的分组：

    $collection = collect([1, 2, 3, 4, 5]);

    $groups = $collection->split(3);

    $groups->all();

    // [[1, 2], [3, 4], [5]]

<a name="method-splitin"></a>
#### `splitIn()` {.collection-method}

`splitIn` 方法把集合拆分为给定数量的分组，它会先把非末尾分组填满，再把剩余元素分配给最后一个分组：

    $collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    $groups = $collection->splitIn(3);

    $groups->all();

    // [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]

<a name="method-sum"></a>
#### `sum()` {.collection-method}

`sum` 方法返回集合中所有元素的总和：

    collect([1, 2, 3, 4, 5])->sum();

    // 15

如果集合中包含嵌套数组或对象，你应当传入一个键，用来决定对哪些值求和：

    $collection = collect([
        ['name' => 'JavaScript: The Good Parts', 'pages' => 176],
        ['name' => 'JavaScript: The Definitive Guide', 'pages' => 1096],
    ]);

    $collection->sum('pages');

    // 1272

此外，你还可以传入自己的闭包，来决定对集合中的哪些值求和：

    $collection = collect([
        ['name' => 'Chair', 'colors' => ['Black']],
        ['name' => 'Desk', 'colors' => ['Black', 'Mahogany']],
        ['name' => 'Bookcase', 'colors' => ['Red', 'Beige', 'Brown']],
    ]);

    $collection->sum(function (array $product) {
        return count($product['colors']);
    });

    // 6

<a name="method-take"></a>
#### `take()` {.collection-method}

`take` 方法返回一个包含指定数量元素的新集合：

    $collection = collect([0, 1, 2, 3, 4, 5]);

    $chunk = $collection->take(3);

    $chunk->all();

    // [0, 1, 2]

你也可以传入一个负整数，以从集合末尾获取指定数量的元素：

    $collection = collect([0, 1, 2, 3, 4, 5]);

    $chunk = $collection->take(-2);

    $chunk->all();

    // [4, 5]

<a name="method-takeuntil"></a>
#### `takeUntil()` {.collection-method}

`takeUntil` 方法返回集合中的元素，直到给定回调返回 `true`：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->takeUntil(function (int $item) {
        return $item >= 3;
    });

    $subset->all();

    // [1, 2]

你也可以向 `takeUntil` 方法传入一个简单值，以获取元素直到找到该值为止：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->takeUntil(3);

    $subset->all();

    // [1, 2]

> [!WARNING]
> 如果未找到给定值，或回调始终没有返回 `true`，`takeUntil` 方法将返回集合中的所有元素。

<a name="method-takewhile"></a>
#### `takeWhile()` {.collection-method}

`takeWhile` 方法返回集合中的元素，直到给定回调返回 `false`：

    $collection = collect([1, 2, 3, 4]);

    $subset = $collection->takeWhile(function (int $item) {
        return $item < 3;
    });

    $subset->all();

    // [1, 2]

> [!WARNING]
> 如果回调始终没有返回 `false`，`takeWhile` 方法将返回集合中的所有元素。

<a name="method-tap"></a>
#### `tap()` {.collection-method}

`tap` 方法把集合传给给定回调，让你在某个特定位置"插入"集合、对元素做些处理，同时又不影响集合本身。随后，`tap` 方法会返回该集合：

    collect([2, 4, 3, 1, 5])
        ->sort()
        ->tap(function (Collection $collection) {
            Log::debug('Values after sorting', $collection->values()->all());
        })
        ->shift();

    // 1

<a name="method-times"></a>
#### `times()` {.collection-method}

静态 `times` 方法通过按指定次数调用给定闭包来创建一个新集合：

    $collection = Collection::times(10, function (int $number) {
        return $number * 9;
    });

    $collection->all();

    // [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]

<a name="method-toarray"></a>
#### `toArray()` {.collection-method}

`toArray` 方法把集合转换为普通 PHP `array`。如果集合的值是 [Eloquent](/docs/{{version}}/eloquent) 模型，那么这些模型也会被转换为数组：

    $collection = collect(['name' => 'Desk', 'price' => 200]);

    $collection->toArray();

    /*
        [
            ['name' => 'Desk', 'price' => 200],
        ]
    */

> [!WARNING]
> `toArray` 还会把集合中所有属于 `Arrayable` 实例的嵌套对象转换为数组。如果你想获取集合底层的原始数组，请改用 [`all`](#method-all) 方法。

<a name="method-tojson"></a>
#### `toJson()` {.collection-method}

`toJson` 方法把集合转换为 JSON 序列化字符串：

    $collection = collect(['name' => 'Desk', 'price' => 200]);

    $collection->toJson();

    // '{"name":"Desk", "price":200}'

<a name="method-transform"></a>
#### `transform()` {.collection-method}

`transform` 方法遍历集合，并用集合中的每个元素调用给定回调。集合中的元素会被回调返回的值替换：

    $collection = collect([1, 2, 3, 4, 5]);

    $collection->transform(function (int $item, int $key) {
        return $item * 2;
    });

    $collection->all();

    // [2, 4, 6, 8, 10]

> [!WARNING]
> 与大多数其他集合方法不同，`transform` 会修改集合本身。如果你希望创建一个新集合，请使用 [`map`](#method-map) 方法。

<a name="method-undot"></a>
#### `undot()` {.collection-method}

`undot` 方法把使用"点"记号的单维集合展开为多维集合：

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

<a name="method-union"></a>
#### `union()` {.collection-method}

`union` 方法把给定数组添加到集合中。如果给定数组包含原集合中已存在的键，那么优先保留原集合的值：

    $collection = collect([1 => ['a'], 2 => ['b']]);

    $union = $collection->union([3 => ['c'], 1 => ['d']]);

    $union->all();

    // [1 => ['a'], 2 => ['b'], 3 => ['c']]

<a name="method-unique"></a>
#### `unique()` {.collection-method}

`unique` 方法返回集合中所有不重复的元素。返回的集合会保留原始数组键，因此在下面的例子中，我们会使用 [`values`](#method-values) 方法把键重置为连续编号的索引：

    $collection = collect([1, 1, 2, 2, 3, 4, 2]);

    $unique = $collection->unique();

    $unique->values()->all();

    // [1, 2, 3, 4]

在处理嵌套数组或对象时，你可以指定用于判断唯一性的键：

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

最后，你还可以向 `unique` 方法传入自己的闭包，以指定用哪个值来判断元素是否唯一：

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

`unique` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。如需使用"严格"比较进行过滤，请使用 [`uniqueStrict`](#method-uniquestrict) 方法。

> [!NOTE]
> 使用 [Eloquent 集合](/docs/{{version}}/eloquent-collections#method-unique) 时，该方法的行为会有所改变。

<a name="method-uniquestrict"></a>
#### `uniqueStrict()` {.collection-method}

该方法与 [`unique`](#method-unique) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

<a name="method-unless"></a>
#### `unless()` {.collection-method}

除非传给该方法的第一个参数求值为 `true`，否则 `unless` 方法会执行给定回调：

    $collection = collect([1, 2, 3]);

    $collection->unless(true, function (Collection $collection) {
        return $collection->push(4);
    });

    $collection->unless(false, function (Collection $collection) {
        return $collection->push(5);
    });

    $collection->all();

    // [1, 2, 3, 5]

可以向 `unless` 方法传入第二个回调。当传给 `unless` 方法的第一个参数求值为 `true` 时，第二个回调会被执行：

    $collection = collect([1, 2, 3]);

    $collection->unless(true, function (Collection $collection) {
        return $collection->push(4);
    }, function (Collection $collection) {
        return $collection->push(5);
    });

    $collection->all();

    // [1, 2, 3, 5]

关于 `unless` 的反操作，请参阅 [`when`](#method-when) 方法。

<a name="method-unlessempty"></a>
#### `unlessEmpty()` {.collection-method}

[`whenNotEmpty`](#method-whennotempty) 方法的别名。

<a name="method-unlessnotempty"></a>
#### `unlessNotEmpty()` {.collection-method}

[`whenEmpty`](#method-whenempty) 方法的别名。

<a name="method-unwrap"></a>
#### `unwrap()` {.collection-method}

在适用的情况下，静态 `unwrap` 方法会从给定值中返回集合底层的元素：

    Collection::unwrap(collect('John Doe'));

    // ['John Doe']

    Collection::unwrap(['John Doe']);

    // ['John Doe']

    Collection::unwrap('John Doe');

    // 'John Doe'

<a name="method-value"></a>
#### `value()` {.collection-method}

`value` 方法从集合的第一个元素中获取给定值：

    $collection = collect([
        ['product' => 'Desk', 'price' => 200],
        ['product' => 'Speaker', 'price' => 400],
    ]);

    $value = $collection->value('price');

    // 200

<a name="method-values"></a>
#### `values()` {.collection-method}

`values` 方法返回一个全新集合，其中键被重置为连续整数：

    $collection = collect([
        10 => ['product' => 'Desk', 'price' => 200],
        11 => ['product' => 'Desk', 'price' => 200],
    ]);

    $values = $collection->values();

    $values->all();

    /*
        [
            0 => ['product' => 'Desk', 'price' => 200],
            1 => ['product' => 'Desk', 'price' => 200],
        ]
    */

<a name="method-when"></a>
#### `when()` {.collection-method}

当传给该方法的第一个参数求值为 `true` 时，`when` 方法会执行给定回调。集合实例以及传给 `when` 方法的第一个参数都会提供给闭包：

    $collection = collect([1, 2, 3]);

    $collection->when(true, function (Collection $collection, int $value) {
        return $collection->push(4);
    });

    $collection->when(false, function (Collection $collection, int $value) {
        return $collection->push(5);
    });

    $collection->all();

    // [1, 2, 3, 4]

可以向 `when` 方法传入第二个回调。当传给 `when` 方法的第一个参数求值为 `false` 时，第二个回调会被执行：

    $collection = collect([1, 2, 3]);

    $collection->when(false, function (Collection $collection, int $value) {
        return $collection->push(4);
    }, function (Collection $collection) {
        return $collection->push(5);
    });

    $collection->all();

    // [1, 2, 3, 5]

关于 `when` 的反操作，请参阅 [`unless`](#method-unless) 方法。

<a name="method-whenempty"></a>
#### `whenEmpty()` {.collection-method}

当集合为空时，`whenEmpty` 方法会执行给定回调：

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

可以向 `whenEmpty` 方法传入第二个闭包，当集合不为空时执行：

    $collection = collect(['Michael', 'Tom']);

    $collection->whenEmpty(function (Collection $collection) {
        return $collection->push('Adam');
    }, function (Collection $collection) {
        return $collection->push('Taylor');
    });

    $collection->all();

    // ['Michael', 'Tom', 'Taylor']

关于 `whenEmpty` 的反操作，请参阅 [`whenNotEmpty`](#method-whennotempty) 方法。

<a name="method-whennotempty"></a>
#### `whenNotEmpty()` {.collection-method}

当集合不为空时，`whenNotEmpty` 方法会执行给定回调：

    $collection = collect(['michael', 'tom']);

    $collection->whenNotEmpty(function (Collection $collection) {
        return $collection->push('adam');
    });

    $collection->all();

    // ['michael', 'tom', 'adam']


    $collection = collect();

    $collection->whenNotEmpty(function (Collection $collection) {
        return $collection->push('adam');
    });

    $collection->all();

    // []

可以向 `whenNotEmpty` 方法传入第二个闭包，当集合为空时执行：

    $collection = collect();

    $collection->whenNotEmpty(function (Collection $collection) {
        return $collection->push('adam');
    }, function (Collection $collection) {
        return $collection->push('taylor');
    });

    $collection->all();

    // ['taylor']

关于 `whenNotEmpty` 的反操作，请参阅 [`whenEmpty`](#method-whenempty) 方法。

<a name="method-where"></a>
#### `where()` {.collection-method}

`where` 方法按给定的键 / 值对过滤集合：

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

`where` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。如需使用"严格"比较进行过滤，请使用 [`whereStrict`](#method-wherestrict) 方法。

你还可以选择性地把比较运算符作为第二个参数传入。支持的运算符包括：`'==='`、`'!=='`、`'!='`、`'=='`、`'='`、`'<>'`、`'>'`、`'<'`、`'>='` 和 `'<='`：

    $collection = collect([
        ['name' => 'Jim', 'deleted_at' => '2019-01-01 00:00:00'],
        ['name' => 'Sally', 'deleted_at' => '2019-01-02 00:00:00'],
        ['name' => 'Sue', 'deleted_at' => null],
    ]);

    $filtered = $collection->where('deleted_at', '!=', null);

    $filtered->all();

    /*
        [
            ['name' => 'Jim', 'deleted_at' => '2019-01-01 00:00:00'],
            ['name' => 'Sally', 'deleted_at' => '2019-01-02 00:00:00'],
        ]
    */

<a name="method-wherestrict"></a>
#### `whereStrict()` {.collection-method}

该方法与 [`where`](#method-where) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

<a name="method-wherebetween"></a>
#### `whereBetween()` {.collection-method}

`whereBetween` 方法通过判断指定元素值是否落在给定范围内来过滤集合：

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

<a name="method-wherein"></a>
#### `whereIn()` {.collection-method}

`whereIn` 方法从集合中移除那些指定元素值不在给定数组内的元素：

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

`whereIn` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。如需使用"严格"比较进行过滤，请使用 [`whereInStrict`](#method-whereinstrict) 方法。

<a name="method-whereinstrict"></a>
#### `whereInStrict()` {.collection-method}

该方法与 [`whereIn`](#method-wherein) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

<a name="method-whereinstanceof"></a>
#### `whereInstanceOf()` {.collection-method}

`whereInstanceOf` 方法按给定的类类型过滤集合：

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

<a name="method-wherenotbetween"></a>
#### `whereNotBetween()` {.collection-method}

`whereNotBetween` 方法通过判断指定元素值是否落在给定范围之外来过滤集合：

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

<a name="method-wherenotin"></a>
#### `whereNotIn()` {.collection-method}

`whereNotIn` 方法从集合中移除那些指定元素值包含在给定数组内的元素：

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

`whereNotIn` 方法在检查元素值时使用"宽松"比较，也就是说，包含整数值的字符串会被视为与同值整数相等。如需使用"严格"比较进行过滤，请使用 [`whereNotInStrict`](#method-wherenotinstrict) 方法。

<a name="method-wherenotinstrict"></a>
#### `whereNotInStrict()` {.collection-method}

该方法与 [`whereNotIn`](#method-wherenotin) 方法签名相同；区别在于所有值都使用"严格"比较进行比对。

<a name="method-wherenotnull"></a>
#### `whereNotNull()` {.collection-method}

`whereNotNull` 方法返回集合中给定键不为 `null` 的元素：

    $collection = collect([
        ['name' => 'Desk'],
        ['name' => null],
        ['name' => 'Bookcase'],
    ]);

    $filtered = $collection->whereNotNull('name');

    $filtered->all();

    /*
        [
            ['name' => 'Desk'],
            ['name' => 'Bookcase'],
        ]
    */

<a name="method-wherenull"></a>
#### `whereNull()` {.collection-method}

`whereNull` 方法返回集合中给定键为 `null` 的元素：

    $collection = collect([
        ['name' => 'Desk'],
        ['name' => null],
        ['name' => 'Bookcase'],
    ]);

    $filtered = $collection->whereNull('name');

    $filtered->all();

    /*
        [
            ['name' => null],
        ]
    */

<a name="method-wrap"></a>
#### `wrap()` {.collection-method}

在适用的情况下，静态 `wrap` 方法会把给定值包装进一个集合：

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

<a name="method-zip"></a>
#### `zip()` {.collection-method}

`zip` 方法按对应的索引，把给定数组的值与原集合的值合并在一起：

    $collection = collect(['Chair', 'Desk']);

    $zipped = $collection->zip([100, 200]);

    $zipped->all();

    // [['Chair', 100], ['Desk', 200]]

<a name="higher-order-messages"></a>
## 高阶消息

集合还支持"高阶消息"，它们是执行集合常见操作的快捷方式。提供高阶消息的集合方法包括：[`average`](#method-average)、[`avg`](#method-avg)、[`contains`](#method-contains)、[`each`](#method-each)、[`every`](#method-every)、[`filter`](#method-filter)、[`first`](#method-first)、[`flatMap`](#method-flatmap)、[`groupBy`](#method-groupby)、[`keyBy`](#method-keyby)、[`map`](#method-map)、[`max`](#method-max)、[`min`](#method-min)、[`partition`](#method-partition)、[`reject`](#method-reject)、[`skipUntil`](#method-skipuntil)、[`skipWhile`](#method-skipwhile)、[`some`](#method-some)、[`sortBy`](#method-sortby)、[`sortByDesc`](#method-sortbydesc)、[`sum`](#method-sum)、[`takeUntil`](#method-takeuntil)、[`takeWhile`](#method-takewhile) 以及 [`unique`](#method-unique)。

每个高阶消息都可以作为集合实例上的动态属性访问。例如，我们用 `each` 高阶消息来调用集合中每个对象的方法：

    use App\Models\User;

    $users = User::where('votes', '>', 500)->get();

    $users->each->markAsVip();

同样地，我们可以用 `sum` 高阶消息来汇总一组用户的"票数"总数：

    $users = User::where('group', 'Development')->get();

    return $users->sum->votes;

<a name="lazy-collections"></a>
## 惰性集合

<a name="lazy-collection-introduction"></a>
### 简介

> [!WARNING]
> 在进一步了解 Laravel 的惰性集合之前，请先花点时间熟悉一下 [PHP 生成器](https://www.php.net/manual/en/language.generators.overview.php)。

作为对已经非常强大的 `Collection` 类的补充，`LazyCollection` 类借助 PHP 的[生成器](https://www.php.net/manual/en/language.generators.overview.php)，让你能够在保持低内存占用的同时处理非常大的数据集。

例如，假设你的应用需要处理一个数 GB 的日志文件，同时利用 Laravel 的集合方法解析日志。你不必一次性把整个文件读入内存，而可以使用惰性集合，在任一时刻只把文件的一小部分保留在内存中：

    use App\Models\LogEntry;
    use Illuminate\Support\LazyCollection;

    LazyCollection::make(function () {
        $handle = fopen('log.txt', 'r');

        while (($line = fgets($handle)) !== false) {
            yield $line;
        }
    })->chunk(4)->map(function (array $lines) {
        return LogEntry::fromLines($lines);
    })->each(function (LogEntry $logEntry) {
        // 处理日志条目...
    });

再比如，假设你需要遍历 10,000 个 Eloquent 模型。使用传统的 Laravel 集合时，必须同时把全部 10,000 个 Eloquent 模型载入内存：

    use App\Models\User;

    $users = User::all()->filter(function (User $user) {
        return $user->id > 500;
    });

然而，查询构造器的 `cursor` 方法会返回一个 `LazyCollection` 实例。这让你既只需对数据库执行一次查询，又能在任一时刻只把一个 Eloquent 模型保留在内存中。在本例中，只有当我们真正逐个遍历用户时，`filter` 回调才会执行，从而大幅降低内存占用：

    use App\Models\User;

    $users = User::cursor()->filter(function (User $user) {
        return $user->id > 500;
    });

    foreach ($users as $user) {
        echo $user->id;
    }

<a name="creating-lazy-collections"></a>
### 创建惰性集合

要创建一个惰性集合实例，你应当把一个 PHP 生成器函数传给集合的 `make` 方法：

    use Illuminate\Support\LazyCollection;

    LazyCollection::make(function () {
        $handle = fopen('log.txt', 'r');

        while (($line = fgets($handle)) !== false) {
            yield $line;
        }
    });

<a name="the-enumerable-contract"></a>
### Enumerable 契约

`Collection` 类上可用的方法几乎在 `LazyCollection` 类上也都可用。这两个类都实现了 `Illuminate\Support\Enumerable` 契约，该契约定义了以下方法：

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
> 会修改集合的方法（例如 `shift`、`pop`、`prepend` 等）在 `LazyCollection` 类上**不可用**。

<a name="lazy-collection-methods"></a>
### 惰性集合方法

除了 `Enumerable` 契约中定义的方法之外，`LazyCollection` 类还包含以下方法：

<a name="method-takeUntilTimeout"></a>
#### `takeUntilTimeout()` {.collection-method}

`takeUntilTimeout` 方法返回一个新的惰性集合，它会一直枚举值直到指定时间。到达该时间后，集合将停止枚举：

    $lazyCollection = LazyCollection::times(INF)
        ->takeUntilTimeout(now()->addMinute());

    $lazyCollection->each(function (int $number) {
        dump($number);

        sleep(1);
    });

    // 1
    // 2
    // ...
    // 58
    // 59

为说明该方法的用法，假设某个应用使用游标从数据库中提交发票。你可以定义一个每 15 分钟运行一次的[定时任务](/docs/{{version}}/scheduling)，并且最多只处理 14 分钟的发票：

    use App\Models\Invoice;
    use Illuminate\Support\Carbon;

    Invoice::pending()->cursor()
        ->takeUntilTimeout(
            Carbon::createFromTimestamp(LARAVEL_START)->add(14, 'minutes')
        )
        ->each(fn (Invoice $invoice) => $invoice->submit());

<a name="method-tapEach"></a>
#### `tapEach()` {.collection-method}

`each` 方法会立即为集合中的每个元素调用给定回调，而 `tapEach` 方法只会在元素被逐个从列表中取出时才调用给定回调：

    // 目前还没有转储任何内容...
    $lazyCollection = LazyCollection::times(INF)->tapEach(function (int $value) {
        dump($value);
    });

    // 已转储三个元素...
    $array = $lazyCollection->take(3)->all();

    // 1
    // 2
    // 3

<a name="method-throttle"></a>
#### `throttle()` {.collection-method}

`throttle` 方法会对惰性集合进行节流，使每个值都在指定的秒数之后才返回。该方法尤其适合以下场景：你可能需要与那些对传入请求有速率限制的外部 API 交互：

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

`remember` 方法返回一个全新的惰性集合，它会记住已经枚举过的所有值，在后续的集合枚举中不会再次获取这些值：

    // 尚未执行任何查询...
    $users = User::cursor()->remember();

    // 查询已执行...
    // 前 5 个用户从数据库中加载...
    $users->take(5)->all();

    // 前 5 个用户来自集合的缓存...
    // 其余用户从数据库中加载...
    $users->take(20)->all();
