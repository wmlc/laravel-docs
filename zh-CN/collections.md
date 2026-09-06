# 集合

## 简介

`Illuminate\Support\Collection` 类为处理数据数组提供了一个富有表现力且便捷的包装器。例如，看看下面的代码。我们将使用 `collect` 辅助函数从数组创建一个新的集合实例，对每个元素运行 `strtoupper` 函数，然后移除所有空元素：

```php
$collection = collect(['Taylor', 'Abigail', null])->map(function (?string $name) {
    return strtoupper($name);
})->reject(function (string $name) {
    return empty($name);
});
```

如你所见，`Collection` 类允许你链式调用其方法，以对底层数组执行流畅的映射和归约。一般来说，集合是不可变的，意味着每个 `Collection` 方法都会返回一个全新的 `Collection` 实例。

### 创建集合

如上所述，`collect` 辅助函数会为给定的数组返回一个新的 `Illuminate\Support\Collection` 实例。因此，创建集合非常简单：

```php
$collection = collect([1, 2, 3]);
```

你也可以使用 make 和 fromJson 方法来创建集合。

> [!NOTE]
> [Eloquent](/topic/Laravel%2013.x/rwyl2kxvz8.html) 查询的结果总是以 `Collection` 实例的形式返回。

### 扩展集合

集合是"可宏化的"（macroable），这允许你在运行时向 `Collection` 类添加额外的方法。`Illuminate\Support\Collection` 类的 `macro` 方法接受一个闭包，该闭包会在你的宏被调用时执行。宏闭包可以通过 `$this` 访问集合的其他方法，就像它是集合类的真实方法一样。例如，下面的代码向 `Collection` 类添加了一个 `toUpper` 方法：

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

通常，你应该在 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中声明集合宏。

#### 宏参数

如有必要，你可以定义接受额外参数的宏：

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

## 可用方法

在集合文档的其余大部分内容中，我们将讨论 `Collection` 类上可用的每个方法。请记住，所有这些方法都可以链式调用，以流畅地操作底层数组。此外，几乎每个方法都会返回一个新的 `Collection` 实例，让你在必要时保留集合的原始副本：

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

after
all
average
avg
before
chunk
chunkBy
chunkWhile
collapse
collapseWithKeys
collect
combine
concat
contains
containsStrict
count
countBy
crossJoin
dd
diff
diffAssoc
diffAssocUsing
diffKeys
doesntContain
doesntContainStrict
dot
dump
duplicates
duplicatesStrict
each
eachSpread
ensure
every
except
filter
first
firstOrFail
firstWhere
flatMap
flatten
flip
forget
forPage
fromJson
get
groupBy
has
hasAny
hasMany
hasSole
implode
intersect
intersectUsing
intersectAssoc
intersectAssocUsing
intersectByKeys
isEmpty
isNotEmpty
join
keyBy
keys
last
lazy
macro
make
map
mapInto
mapSpread
mapToGroups
mapWithKeys
max
median
merge
mergeRecursive
min
mode
multiply
nth
only
pad
partition
percentage
pipe
pipeInto
pipeThrough
pluck
pop
prepend
pull
push
put
random
range
reduce
reduceInto
reduceSpread
reject
replace
replaceRecursive
reverse
search
select
shift
shuffle
skip
skipUntil
skipWhile
slice
sliding
sole
some
sort
sortBy
sortByDesc
sortDesc
sortKeys
sortKeysDesc
sortKeysUsing
splice
split
splitIn
sum
take
takeUntil
takeWhile
tap
times
toArray
toJson
toPrettyJson
transform
undot
union
unique
uniqueStrict
unless
unlessEmpty
unlessNotEmpty
unwrap
value
values
when
whenEmpty
whenNotEmpty
where
whereStrict
whereBetween
whereIn
whereInStrict
whereInstanceOf
whereNotBetween
whereNotIn
whereNotInStrict
whereNotNull
whereNull
wrap
zip

## 方法列表

<style>
    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

#### `after()` {.collection-method .first-collection-method}

`after` 方法返回给定条目之后的那个条目。如果给定的条目未找到或是最后一个条目，则返回 `null`：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->after(3);

// 4

$collection->after(5);

// null
```

该方法使用"宽松"比较来搜索给定条目，意味着包含整数值的字符串会被视为与相同值的整数相等。要使用"严格"比较，可以向该方法提供 `strict` 参数：

```php
collect([2, 4, 6, 8])->after('4', strict: true);

// null
```

或者，你可以提供自己的闭包来搜索第一个通过给定真值测试的条目：

```php
collect([2, 4, 6, 8])->after(function (int $item, int $key) {
    return $item > 5;
});

// 8
```

#### `all()` {.collection-method}

`all` 方法返回集合所表示的底层数组：

```php
collect([1, 2, 3])->all();

// [1, 2, 3]
```

#### `average()` {.collection-method}

avg 方法的别名。

#### `avg()` {.collection-method}

`avg` 方法返回给定键的 [平均值](https://en.wikipedia.org/wiki/Average)：

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

#### `before()` {.collection-method}

`before` 方法与 after 方法相反。它返回给定条目之前的那个条目。如果给定的条目未找到或是第一个条目，则返回 `null`：

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

#### `chunk()` {.collection-method}

`chunk` 方法将集合拆分为多个给定大小的小集合：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7]);

$chunks = $collection->chunk(4);

$chunks->all();

// [[1, 2, 3, 4], [5, 6, 7]]
```

该方法在配合 [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/) 等网格系统使用 [视图](/topic/Laravel%2013.x/m892gz6y01.html) 时特别有用。例如，想象你有一个 [Eloquent](/topic/Laravel%2013.x/rwyl2kxvz8.html) 模型集合想要在网格中显示：

```blade
@foreach ($products->chunk(3) as $chunk)
    <div class="row">
        @foreach ($chunk as $product)
            <div class="col-xs-4">{{ $product->name }}</div>
        @endforeach
    </div>
@endforeach
```

#### `chunkBy()` {.collection-method}

`chunkBy` 方法通过按给定键或回调分组相邻且具有相同值的条目，将集合拆分为多个小集合。例如，你可以将共享同一父级的相邻产品分组：

```php
$chunks = $products->chunkBy('parent');
```

与 `groupBy` 方法不同，值相同但不相邻的条目会被放在单独的块中：

```php
$collection = collect([1, 1, 2, 2, 1]);

$chunks = $collection->chunkBy(fn (int $value) => $value);

$chunks->all();

// [[1, 1], [2, 2], [1]]
```

#### `chunkWhile()` {.collection-method}

`chunkWhile` 方法根据给定回调的评估将集合拆分为多个小集合。传给闭包的 `$chunk` 变量可用于检查前一个元素：

```php
$collection = collect(str_split('AABBCCCD'));

$chunks = $collection->chunkWhile(function (string $value, int $key, Collection $chunk) {
    return $value === $chunk->last();
});

$chunks->all();

// [['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]
```

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

#### `collapseWithKeys()` {.collection-method}

`collapseWithKeys` 方法将数组或集合的集合扁平化为单个集合，同时保留原始键不变。如果集合已经是扁平的，它将返回一个空集合：

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

#### `collect()` {.collection-method}

`collect` 方法返回一个包含集合当前条目的新 `Collection` 实例：

```php
$collectionA = collect([1, 2, 3]);

$collectionB = $collectionA->collect();

$collectionB->all();

// [1, 2, 3]
```

`collect` 方法主要用于将 惰性集合 转换为标准的 `Collection` 实例：

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
> 当你拥有 `Enumerable` 实例并需要一个非惰性的集合实例时，`collect` 方法特别有用。由于 `collect()` 是 `Enumerable` 契约的一部分，你可以安全地使用它来获取 `Collection` 实例。

#### `combine()` {.collection-method}

`combine` 方法将集合的值作为键，与另一个数组或集合的值组合在一起：

```php
$collection = collect(['name', 'age']);

$combined = $collection->combine(['George', 29]);

$combined->all();

// ['name' => 'George', 'age' => 29]
```

#### `concat()` {.collection-method}

`concat` 方法将给定的数组或集合的值追加到另一个集合的末尾：

```php
$collection = collect(['John Doe']);

$concatenated = $collection->concat(['Jane Doe'])->concat(['name' => 'Johnny Doe']);

$concatenated->all();

// ['John Doe', 'Jane Doe', 'Johnny Doe']
```

`concat` 方法会对追加到原始集合上的条目的键进行数字重新索引。要在关联集合中保留键，请参阅 merge 方法。

#### `contains()` {.collection-method}

`contains` 方法判断集合是否包含给定条目。你可以向 `contains` 方法传递一个闭包，以判断集合中是否存在匹配给定真值测试的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->contains(function (int $value, int $key) {
    return $value > 5;
});

// false
```

或者，你可以向 `contains` 方法传递一个字符串，以判断集合是否包含给定的条目值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->contains('Desk');

// true

$collection->contains('New York');

// false
```

你也可以向 `contains` 方法传递一个键/值对，以判断给定对是否存在于集合中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->contains('product', 'Bookcase');

// false
```

`contains` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。使用 containsStrict 方法以"严格"比较进行筛选。

有关 `contains` 的反向操作，请参阅 doesntContain 方法。

#### `containsStrict()` {.collection-method}

该方法的签名与 contains 方法相同；不过，所有值都使用"严格"比较进行比较。

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `count()` {.collection-method}

`count` 方法返回集合中条目的总数：

```php
$collection = collect([1, 2, 3, 4]);

$collection->count();

// 4
```

#### `countBy()` {.collection-method}

`countBy` 方法统计集合中值的出现次数。默认情况下，该方法统计每个元素的出现次数，让你能够统计集合中某些"类型"的元素：

```php
$collection = collect([1, 2, 2, 2, 3]);

$counted = $collection->countBy();

$counted->all();

// [1 => 1, 2 => 3, 3 => 1]
```

你可以向 `countBy` 方法传递一个闭包，以按自定义值统计所有条目：

```php
$collection = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']);

$counted = $collection->countBy(function (string $email) {
    return substr(strrchr($email, '@'), 1);
});

$counted->all();

// ['gmail.com' => 2, 'yahoo.com' => 1]
```

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

#### `dd()` {.collection-method}

`dd` 方法输出集合的条目并终止脚本的执行：

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

如果你不想停止执行脚本，请改用 dump 方法。

#### `diff()` {.collection-method}

`diff` 方法基于值将集合与另一个集合或普通 PHP `array` 进行比较。该方法将返回原始集合中不存在于给定集合中的值：

```php
$collection = collect([1, 2, 3, 4, 5]);

$diff = $collection->diff([2, 4, 6, 8]);

$diff->all();

// [1, 3, 5]
```

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `diffAssoc()` {.collection-method}

`diffAssoc` 方法基于键和值将集合与另一个集合或普通 PHP `array` 进行比较。该方法将返回原始集合中不存在于给定集合中的键/值对：

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

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息，请参阅 PHP 关于 [array_diff_uassoc](https://www.php.net/array_diff_uassoc#refsect1-function.array-diff-uassoc-parameters) 的文档，这是 `diffAssocUsing` 方法内部使用的 PHP 函数。

#### `diffKeys()` {.collection-method}

`diffKeys` 方法基于键将集合与另一个集合或普通 PHP `array` 进行比较。该方法将返回原始集合中不存在于给定集合中的键/值对：

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

#### `doesntContain()` {.collection-method}

`doesntContain` 方法判断集合是否不包含给定条目。你可以向 `doesntContain` 方法传递一个闭包，以判断集合中是否不存在匹配给定真值测试的元素：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->doesntContain(function (int $value, int $key) {
    return $value < 5;
});

// false
```

或者，你可以向 `doesntContain` 方法传递一个字符串，以判断集合是否不包含给定的条目值：

```php
$collection = collect(['name' => 'Desk', 'price' => 100]);

$collection->doesntContain('Table');

// true

$collection->doesntContain('Desk');

// false
```

你也可以向 `doesntContain` 方法传递一个键/值对，以判断给定对是否不存在于集合中：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->doesntContain('product', 'Bookcase');

// true
```

`doesntContain` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。

#### `doesntContainStrict()` {.collection-method}

该方法的签名与 doesntContain 方法相同；不过，所有值都使用"严格"比较进行比较。

#### `dot()` {.collection-method}

`dot` 方法将多维集合扁平化为单层集合，使用"点"符号来表示深度：

```php
$collection = collect(['products' => ['desk' => ['price' => 100]]]);

$flattened = $collection->dot();

$flattened->all();

// ['products.desk.price' => 100]
```

#### `dump()` {.collection-method}

`dump` 方法输出集合的条目：

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

如果你想在输出集合后停止执行脚本，请改用 dd 方法。

#### `duplicates()` {.collection-method}

`duplicates` 方法从集合中获取并返回重复的值：

```php
$collection = collect(['a', 'b', 'a', 'c', 'b']);

$collection->duplicates();

// [2 => 'a', 4 => 'b']
```

如果集合包含数组或对象，你可以传入要检查重复值的属性键：

```php
$employees = collect([
    ['email' => 'abigail@example.com', 'position' => 'Developer'],
    ['email' => 'james@example.com', 'position' => 'Designer'],
    ['email' => 'victoria@example.com', 'position' => 'Developer'],
]);

$employees->duplicates('position');

// [2 => 'Developer']
```

#### `duplicatesStrict()` {.collection-method}

该方法的签名与 duplicates 方法相同；不过，所有值都使用"严格"比较进行比较。

#### `each()` {.collection-method}

`each` 方法遍历集合中的条目，并将每个条目传给一个闭包：

```php
$collection = collect([1, 2, 3, 4]);

$collection->each(function (int $item, int $key) {
    // ...
});
```

如果你想停止遍历条目，可以从闭包中返回 `false`：

```php
$collection->each(function (int $item, int $key) {
    if (/* 条件 */) {
        return false;
    }
});
```

#### `eachSpread()` {.collection-method}

`eachSpread` 方法遍历集合的条目，将每个嵌套条目的值传入给定的回调：

```php
$collection = collect([['John Doe', 35], ['Jane Doe', 33]]);

$collection->eachSpread(function (string $name, int $age) {
    // ...
});
```

你可以通过从回调中返回 `false` 来停止遍历条目：

```php
$collection->eachSpread(function (string $name, int $age) {
    return false;
});
```

#### `ensure()` {.collection-method}

`ensure` 方法可用于验证集合的所有元素是否为给定类型或类型列表。否则，将抛出 `UnexpectedValueException`：

```php
return $collection->ensure(User::class);

return $collection->ensure([User::class, Customer::class]);
```

也可以指定基本类型，例如 `string`、`int`、`float`、`bool` 和 `array`：

```php
return $collection->ensure('int');
```

> [!WARNING]
> `ensure` 方法不能保证稍后不会将不同类型的元素添加到集合中。

#### `every()` {.collection-method}

`every` 方法可用于验证集合的所有元素是否都通过给定的真值测试：

```php
collect([1, 2, 3, 4])->every(function (int $value, int $key) {
    return $value > 2;
});

// false
```

如果集合为空，`every` 方法将返回 true：

```php
$collection = collect([]);

$collection->every(function (int $value, int $key) {
    return $value > 2;
});

// true
```

#### `except()` {.collection-method}

`except` 方法返回集合中除指定键之外的所有条目：

```php
$collection = collect(['product_id' => 1, 'price' => 100, 'discount' => false]);

$filtered = $collection->except(['price', 'discount']);

$filtered->all();

// ['product_id' => 1]
```

有关 `except` 的反向操作，请参阅 only 方法。

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `filter()` {.collection-method}

`filter` 方法使用给定的回调筛选集合，仅保留通过给定真值测试的条目：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->filter(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [3, 4]
```

如果未提供回调，则集合中相当于 `false` 的所有条目都将被移除：

```php
$collection = collect([1, 2, 3, null, false, '', 0, []]);

$collection->filter()->all();

// [1, 2, 3]
```

有关 `filter` 的反向操作，请参阅 reject 方法。

#### `first()` {.collection-method}

`first` 方法返回集合中通过给定真值测试的第一个元素：

```php
collect([1, 2, 3, 4])->first(function (int $value, int $key) {
    return $value > 2;
});

// 3
```

你也可以不带参数调用 `first` 方法来获取集合中的第一个元素。如果集合为空，则返回 `null`：

```php
collect([1, 2, 3, 4])->first();

// 1
```

#### `firstOrFail()` {.collection-method}

`firstOrFail` 方法与 `first` 方法相同；不过，如果未找到结果，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([1, 2, 3, 4])->firstOrFail(function (int $value, int $key) {
    return $value > 5;
});

// 抛出 ItemNotFoundException...
```

你也可以不带参数调用 `firstOrFail` 方法来获取集合中的第一个元素。如果集合为空，将抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
collect([])->firstOrFail();

// 抛出 ItemNotFoundException...
```

#### `firstWhere()` {.collection-method}

`firstWhere` 方法返回集合中具有给定键/值对的第一个元素：

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

你也可以带比较运算符调用 `firstWhere` 方法：

```php
$collection->firstWhere('age', '>=', 18);

// ['name' => 'Diego', 'age' => 23]
```

与 where 方法一样，你可以向 `firstWhere` 方法传递一个参数。在这种情况下，`firstWhere` 方法将返回给定条目键的值为"真"的第一个条目：

```php
$collection->firstWhere('age');

// ['name' => 'Linda', 'age' => 14]
```

#### `flatMap()` {.collection-method}

`flatMap` 方法遍历集合，并将每个值传给给定的闭包。闭包可以修改条目并返回它，从而形成一个新的修改后条目的集合。然后，数组被扁平化一级：

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

如有必要，你可以向 `flatten` 方法传递一个"深度"参数：

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

在本示例中，如果不提供深度地调用 `flatten`，也会将嵌套数组扁平化，结果为 `['iPhone 6S', 'Apple', 'Galaxy S7', 'Samsung']`。提供深度可以让你指定嵌套数组被扁平化的层级数。

#### `flip()` {.collection-method}

`flip` 方法将集合的键与其对应的值互换：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$flipped = $collection->flip();

$flipped->all();

// ['Taylor' => 'name', 'Laravel' => 'framework']
```

#### `forget()` {.collection-method}

`forget` 方法按键从集合中移除一个条目：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

// 忘记单个键...
$collection->forget('name');

// ['framework' => 'Laravel']

// 忘记多个键...
$collection->forget(['name', 'framework']);

// []
```

> [!WARNING]
> 与大多数其他集合方法不同，`forget` 不会返回一个新的已修改集合；它会修改并返回被调用的集合本身。

#### `forPage()` {.collection-method}

`forPage` 方法返回一个新集合，其中包含出现在给定页码上的条目。该方法接受页码作为第一个参数，以及每页显示的条目数作为第二个参数：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunk = $collection->forPage(2, 3);

$chunk->all();

// [4, 5, 6]
```

#### `fromJson()` {.collection-method}

静态 `fromJson` 方法通过使用 `json_decode` PHP 函数解码给定的 JSON 字符串来创建一个新的集合实例：

```php
use Illuminate\Support\Collection;

$json = json_encode([
    'name' => 'Taylor Otwell',
    'role' => 'Developer',
    'status' => 'Active',
]);

$collection = Collection::fromJson($json);
```

#### `get()` {.collection-method}

`get` 方法返回给定键处的条目。如果键不存在，则返回 `null`：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$value = $collection->get('name');

// Taylor
```

你可以选择性地将默认值作为第二个参数传入：

```php
$collection = collect(['name' => 'Taylor', 'framework' => 'Laravel']);

$value = $collection->get('age', 34);

// 34
```

你甚至可以传递一个闭包作为该方法的默认值。如果指定的键不存在，则返回该闭包的结果：

```php
$collection->get('email', function () {
    return 'taylor@example.com';
});

// taylor@example.com
```

#### `groupBy()` {.collection-method}

`groupBy` 方法按给定键对集合的条目进行分组：

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

你可以传递一个回调，而不是传递字符串 `key`。回调应返回你希望按其分组的键值：

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

可以传递多个分组条件作为数组。每个数组元素将应用于多维数组中对应的层级：

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

#### `has()` {.collection-method}

`has` 方法判断给定的键是否存在于集合中：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->has('product');

// true

$collection->has(['product', 'amount']);

// true

$collection->has(['amount', 'price']);

// false
```

#### `hasAny()` {.collection-method}

`hasAny` 方法判断给定的键中是否有任何一个存在于集合中：

```php
$collection = collect(['account_id' => 1, 'product' => 'Desk', 'amount' => 5]);

$collection->hasAny(['product', 'price']);

// true

$collection->hasAny(['name', 'price']);

// false
```

#### `hasMany()` {.collection-method}

`hasMany` 方法判断集合是否包含多个条目：

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

#### `hasSole()` {.collection-method}

`hasSole` 方法判断集合是否包含单个条目，可选地与给定条件匹配：

```php
collect([])->hasSole();

// false

collect(['1'])->hasSole();

// true

collect([1, 2, 3])->hasSole(fn (int $item) => $item === 2);

// true
```

#### `implode()` {.collection-method}

`implode` 方法连接集合中的条目。其参数取决于集合中条目的类型。如果集合包含数组或对象，你应该传入要连接的属性的键，以及要放置在值之间的"胶水"字符串：

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

如果你想格式化被连接的值，可以向 `implode` 方法传递一个闭包：

```php
$collection->implode(function (array $item, int $key) {
    return strtoupper($item['product']);
}, ', ');

// 'DESK, CHAIR'
```

#### `intersect()` {.collection-method}

`intersect` 方法从原始集合中移除不存在于给定数组或集合中的任何值。生成的集合将保留原始集合的键：

```php
$collection = collect(['Desk', 'Sofa', 'Chair']);

$intersect = $collection->intersect(['Desk', 'Chair', 'Bookcase']);

$intersect->all();

// [0 => 'Desk', 2 => 'Chair']
```

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `intersectUsing()` {.collection-method}

`intersectUsing` 方法从原始集合中移除不存在于给定数组或集合中的任何值，使用自定义回调来比较值。生成的集合将保留原始集合的键：

```php
$collection = collect(['Desk', 'Sofa', 'Chair']);

$intersect = $collection->intersectUsing(['desk', 'chair', 'bookcase'], function (string $a, string $b) {
    return strcasecmp($a, $b);
});

$intersect->all();

// [0 => 'Desk', 2 => 'Chair']
```

#### `intersectAssoc()` {.collection-method}

`intersectAssoc` 方法将原始集合与另一个集合或数组进行比较，返回存在于所有给定集合中的键/值对：

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

#### `intersectAssocUsing()` {.collection-method}

`intersectAssocUsing` 方法将原始集合与另一个集合或数组进行比较，返回同时存在于两者中的键/值对，使用自定义比较回调来确定键和值的相等性：

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

#### `intersectByKeys()` {.collection-method}

`intersectByKeys` 方法从原始集合中移除不存在于给定数组或集合中的任何键及其对应的值：

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

#### `isEmpty()` {.collection-method}

如果集合为空，`isEmpty` 方法返回 `true`；否则返回 `false`：

```php
collect([])->isEmpty();

// true
```

#### `isNotEmpty()` {.collection-method}

如果集合不为空，`isNotEmpty` 方法返回 `true`；否则返回 `false`：

```php
collect([])->isNotEmpty();

// false
```

#### `join()` {.collection-method}

`join` 方法用字符串连接集合的值。使用该方法的第二个参数，你还可以指定最终元素应如何追加到字符串中：

```php
collect(['a', 'b', 'c'])->join(', '); // 'a, b, c'
collect(['a', 'b', 'c'])->join(', ', ', and '); // 'a, b, and c'
collect(['a', 'b'])->join(', ', ' and '); // 'a and b'
collect(['a'])->join(', ', ' and '); // 'a'
collect([])->join(', ', ' and '); // ''
```

#### `keyBy()` {.collection-method}

`keyBy` 方法按给定键为集合建立键。如果多个条目具有相同的键，只有最后一个会出现在新集合中：

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

你也可以向该方法传递一个回调。回调应返回用于为集合建立键的值：

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

#### `last()` {.collection-method}

`last` 方法返回集合中通过给定真值测试的最后一个元素：

```php
collect([1, 2, 3, 4])->last(function (int $value, int $key) {
    return $value < 3;
});

// 2
```

你也可以不带参数调用 `last` 方法来获取集合中的最后一个元素。如果集合为空，则返回 `null`：

```php
collect([1, 2, 3, 4])->last();

// 4
```

#### `lazy()` {.collection-method}

`lazy` 方法从底层条目数组返回一个新的 LazyCollection 实例：

```php
$lazyCollection = collect([1, 2, 3, 4])->lazy();

$lazyCollection::class;

// Illuminate\Support\LazyCollection

$lazyCollection->all();

// [1, 2, 3, 4]
```

当你需要对包含许多条目的庞大 `Collection` 执行转换时，这特别有用：

```php
$count = $hugeCollection
    ->lazy()
    ->where('country', 'FR')
    ->where('balance', '>', '100')
    ->count();
```

通过将集合转换为 `LazyCollection`，我们避免了分配大量额外内存。虽然原始集合仍将其值保留在内存中，但后续的筛选不会。因此，筛选集合结果时实际上不会分配额外的内存。

#### `macro()` {.collection-method}

静态 `macro` 方法允许你在运行时向 `Collection` 类添加方法。有关更多信息，请参阅关于 扩展集合 的文档。

#### `make()` {.collection-method}

静态 `make` 方法创建一个新的集合实例。请参阅 创建集合 一节。

```php
use Illuminate\Support\Collection;

$collection = Collection::make([1, 2, 3]);
```

#### `map()` {.collection-method}

`map` 方法遍历集合，并将每个值传给给定的回调。闭包可以修改条目并返回它，从而形成一个新的修改后条目的集合：

```php
$collection = collect([1, 2, 3, 4, 5]);

$multiplied = $collection->map(function (int $item, int $key) {
    return $item * 2;
});

$multiplied->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 与大多数其他集合方法一样，`map` 返回一个新的集合实例；它不会修改被调用的集合。如果你想转换原始集合，请使用 transform 方法。

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

#### `mapSpread()` {.collection-method}

`mapSpread` 方法遍历集合的条目，将每个嵌套条目的值传入给定的闭包。闭包可以修改条目并返回它，从而形成一个新的修改后条目的集合：

```php
$collection = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

$chunks = $collection->chunk(2);

$sequence = $chunks->mapSpread(function (int $even, int $odd) {
    return $even + $odd;
});

$sequence->all();

// [1, 5, 9, 13, 17]
```

#### `mapToGroups()` {.collection-method}

`mapToGroups` 方法按给定闭包对集合的条目进行分组。闭包应返回一个包含单个键/值对的关联数组，从而形成一个新的分组值集合：

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

#### `mapWithKeys()` {.collection-method}

`mapWithKeys` 方法遍历集合，并将每个值传给给定的闭包。闭包应返回一个包含单个键/值对的关联数组：

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

#### `median()` {.collection-method}

`median` 方法返回给定键的 [中位数](https://en.wikipedia.org/wiki/Median)：

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

#### `merge()` {.collection-method}

`merge` 方法将给定的数组或集合与原始集合合并。如果给定条目中的字符串键与原始集合中的字符串键匹配，则给定条目的值将覆盖原始集合中的值：

```php
$collection = collect(['product_id' => 1, 'price' => 100]);

$merged = $collection->merge(['price' => 200, 'discount' => false]);

$merged->all();

// ['product_id' => 1, 'price' => 200, 'discount' => false]
```

如果给定条目的键是数字，则值将被追加到集合的末尾：

```php
$collection = collect(['Desk', 'Chair']);

$merged = $collection->merge(['Bookcase', 'Door']);

$merged->all();

// ['Desk', 'Chair', 'Bookcase', 'Door']
```

#### `mergeRecursive()` {.collection-method}

`mergeRecursive` 方法将给定的数组或集合与原始集合递归合并。如果给定条目中的字符串键与原始集合中的字符串键匹配，则这些键的值会合并到一个数组中，并且这个过程是递归进行的：

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

#### `mode()` {.collection-method}

`mode` 方法返回给定键的 [众数](https://en.wikipedia.org/wiki/Mode_(statistics))：

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

#### `multiply()` {.collection-method}

`multiply` 方法创建集合中所有条目的指定数量的副本：

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

#### `nth()` {.collection-method}

`nth` 方法创建一个由每隔 n 个元素组成的新集合：

```php
$collection = collect(['a', 'b', 'c', 'd', 'e', 'f']);

$collection->nth(4);

// ['a', 'e']
```

你可以选择性地将起始偏移量作为第二个参数传入：

```php
$collection->nth(4, 1);

// ['b', 'f']
```

#### `only()` {.collection-method}

`only` 方法返回集合中具有指定键的条目：

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

有关 `only` 的反向操作，请参阅 except 方法。

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `pad()` {.collection-method}

`pad` 方法将用给定值填充数组，直到数组达到指定大小。该方法的行为类似于 [array_pad](https://secure.php.net/manual/en/function.array-pad.php) PHP 函数。

要向左填充，你应该指定一个负数大小。如果给定大小的绝对值小于或等于数组的长度，则不会发生填充：

```php
$collection = collect(['A', 'B', 'C']);

$filtered = $collection->pad(5, 0);

$filtered->all();

// ['A', 'B', 'C', 0, 0]

$filtered = $collection->pad(-5, 0);

$filtered->all();

// [0, 0, 'A', 'B', 'C']
```

#### `partition()` {.collection-method}

`partition` 方法可以与 PHP 数组解构结合使用，以将通过一个给定真值测试的条目与未通过的条目分离开来：

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
> 与 [Eloquent collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 交互时，该方法的行为会被修改。

#### `percentage()` {.collection-method}

`percentage` 方法可用于快速确定集合中通过给定真值测试的条目的百分比：

```php
$collection = collect([1, 1, 2, 2, 2, 3]);

$percentage = $collection->percentage(fn (int $value) => $value === 1);

// 33.33
```

默认情况下，百分比将四舍五入到两位小数。不过，你可以通过向该方法提供第二个参数来自定义此行为：

```php
$percentage = $collection->percentage(fn (int $value) => $value === 1, precision: 3);

// 33.333
```

#### `pipe()` {.collection-method}

`pipe` 方法将集合传给给定的闭包，并返回所执行闭包的结果：

```php
$collection = collect([1, 2, 3]);

$piped = $collection->pipe(function (Collection $collection) {
    return $collection->sum();
});

// 6
```

#### `pipeInto()` {.collection-method}

`pipeInto` 方法创建给定类的新实例，并将集合传入构造函数：

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

#### `pipeThrough()` {.collection-method}

`pipeThrough` 方法将集合传给给定的闭包数组，并返回所执行闭包的结果：

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

#### `pluck()` {.collection-method}

`pluck` 方法检索给定键的所有值：

```php
$collection = collect([
    ['product_id' => 'prod-100', 'name' => 'Desk'],
    ['product_id' => 'prod-200', 'name' => 'Chair'],
]);

$plucked = $collection->pluck('name');

$plucked->all();

// ['Desk', 'Chair']
```

你也可以指定希望结果集合如何建立键：

```php
$plucked = $collection->pluck('name', 'product_id');

$plucked->all();

// ['prod-100' => 'Desk', 'prod-200' => 'Chair']
```

`pluck` 方法还支持使用"点"符号检索嵌套值：

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

如果存在重复键，最后一个匹配的元素将被插入到被取出的集合中：

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

#### `pop()` {.collection-method}

`pop` 方法移除并返回集合中的最后一个条目。如果集合为空，则返回 `null`：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop();

// 5

$collection->all();

// [1, 2, 3, 4]
```

你可以向 `pop` 方法传入一个整数，以从集合末尾移除并返回多个条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->pop(3);

// collect([5, 4, 3])

$collection->all();

// [1, 2]
```

#### `prepend()` {.collection-method}

`prepend` 方法将一个条目添加到集合的开头：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->prepend(0);

$collection->all();

// [0, 1, 2, 3, 4, 5]
```

你也可以传入第二个参数来指定被前置条目的键：

```php
$collection = collect(['one' => 1, 'two' => 2]);

$collection->prepend(0, 'zero');

$collection->all();

// ['zero' => 0, 'one' => 1, 'two' => 2]
```

#### `pull()` {.collection-method}

`pull` 方法按键从集合中移除并返回一个条目：

```php
$collection = collect(['product_id' => 'prod-100', 'name' => 'Desk']);

$collection->pull('name');

// 'Desk'

$collection->all();

// ['product_id' => 'prod-100']
```

#### `push()` {.collection-method}

`push` 方法将一个条目追加到集合的末尾：

```php
$collection = collect([1, 2, 3, 4]);

$collection->push(5);

$collection->all();

// [1, 2, 3, 4, 5]
```

你也可以提供多个条目追加到集合的末尾：

```php
$collection = collect([1, 2, 3, 4]);

$collection->push(5, 6, 7);

$collection->all();

// [1, 2, 3, 4, 5, 6, 7]
```

#### `put()` {.collection-method}

`put` 方法在集合中设置给定的键和值：

```php
$collection = collect(['product_id' => 1, 'name' => 'Desk']);

$collection->put('price', 100);

$collection->all();

// ['product_id' => 1, 'name' => 'Desk', 'price' => 100]
```

#### `random()` {.collection-method}

`random` 方法从集合返回一个随机条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->random();

// 4 - （随机获取）
```

你可以向 `random` 传入一个整数，以指定你希望随机检索的条目数量。当明确传入你希望接收的条目数量时，总是会返回一个条目集合：

```php
$random = $collection->random(3);

$random->all();

// [2, 4, 5] - （随机获取）
```

如果集合实例的条目数少于请求的数量，`random` 方法将抛出 `InvalidArgumentException`。

`random` 方法也接受一个闭包，该闭包将接收当前的集合实例：

```php
use Illuminate\Support\Collection;

$random = $collection->random(fn (Collection $items) => min(10, count($items)));

$random->all();

// [1, 2, 3, 4, 5] - （随机获取）
```

#### `range()` {.collection-method}

`range` 方法返回一个包含指定范围内整数的集合：

```php
$collection = collect()->range(3, 6);

$collection->all();

// [3, 4, 5, 6]
```

#### `reduce()` {.collection-method}

`reduce` 方法将集合归约为单个值，将每次迭代的结果传入后续迭代：

```php
$collection = collect([1, 2, 3]);

$total = $collection->reduce(function (?int $carry, int $item) {
    return $carry + $item;
});

// 6
```

第一次迭代时 `$carry` 的值为 `null`；不过，你可以向 `reduce` 传入第二个参数来指定其初始值：

```php
$collection->reduce(function (int $carry, int $item) {
    return $carry + $item;
}, 4);

// 10
```

`reduce` 方法也会将数组键传给给定的回调：

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

#### `reduceInto()` {.collection-method}

`reduceInto` 方法通过修改给定的初始值将集合归约为单个值。与 `reduce` 方法不同，给定的回调不需要返回累加值：

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

当归约到标量或数组时，你应该在回调中通过引用接受它，以便你的修改应用到原始值：

```php
$collection = collect([1, 2, 3, 4, 5]);

$even = $collection->reduceInto([], function (array &$result, int $value) {
    if ($value % 2 === 0) {
        $result[] = $value;
    }
});

// [2, 4]
```

#### `reduceSpread()` {.collection-method}

`reduceSpread` 方法将集合归约为一个值数组，将每次迭代的结果传入后续迭代。该方法类似于 `reduce` 方法；不过，它可以接受多个初始值：

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

#### `reject()` {.collection-method}

`reject` 方法使用给定的闭包筛选集合。如果条目应该从结果集合中移除，闭包应返回 `true`：

```php
$collection = collect([1, 2, 3, 4]);

$filtered = $collection->reject(function (int $value, int $key) {
    return $value > 2;
});

$filtered->all();

// [1, 2]
```

有关 `reject` 方法的反向操作，请参阅 filter 方法。

#### `replace()` {.collection-method}

`replace` 方法的行为类似于 `merge`；不过，除了覆盖具有字符串键的匹配条目之外，`replace` 方法还会覆盖集合中具有匹配数字键的条目：

```php
$collection = collect(['Taylor', 'Abigail', 'James']);

$replaced = $collection->replace([1 => 'Victoria', 3 => 'Finn']);

$replaced->all();

// ['Taylor', 'Victoria', 'James', 'Finn']
```

#### `replaceRecursive()` {.collection-method}

`replaceRecursive` 方法的行为类似于 `replace`，但它会递归进入数组，并对内部值应用相同的替换过程：

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

#### `reverse()` {.collection-method}

`reverse` 方法反转集合条目的顺序，同时保留原始键：

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

#### `search()` {.collection-method}

`search` 方法在集合中搜索给定值，并在找到时返回其键。如果未找到条目，则返回 `false`：

```php
$collection = collect([2, 4, 6, 8]);

$collection->search(4);

// 1
```

搜索使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。要使用"严格"比较，请将 `true` 作为第二个参数传给该方法：

```php
collect([2, 4, 6, 8])->search('4', strict: true);

// false
```

或者，你可以提供自己的闭包来搜索第一个通过给定真值测试的条目：

```php
collect([2, 4, 6, 8])->search(function (int $item, int $key) {
    return $item > 5;
});

// 2
```

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

#### `shift()` {.collection-method}

`shift` 方法移除并返回集合中的第一个条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift();

// 1

$collection->all();

// [2, 3, 4, 5]
```

你可以向 `shift` 方法传入一个整数，以从集合开头移除并返回多个条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->shift(3);

// collect([1, 2, 3])

$collection->all();

// [4, 5]
```

#### `shuffle()` {.collection-method}

`shuffle` 方法随机打乱集合中的条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$shuffled = $collection->shuffle();

$shuffled->all();

// [3, 2, 5, 1, 4] - （随机生成）
```

#### `skip()` {.collection-method}

`skip` 方法返回一个新集合，其中从集合开头移除了给定数量的条目：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$collection = $collection->skip(4);

$collection->all();

// [5, 6, 7, 8, 9, 10]
```

#### `skipUntil()` {.collection-method}

`skipUntil` 方法在给定回调返回 `false` 时跳过集合中的条目。一旦回调返回 `true`，集合中所有剩余条目将作为新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [3, 4]
```

你也可以向 `skipUntil` 方法传递一个简单的值，以跳过所有条目直到找到给定值：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipUntil(3);

$subset->all();

// [3, 4]
```

> [!WARNING]
> 如果未找到给定值，或者回调从未返回 `true`，`skipUntil` 方法将返回一个空集合。

#### `skipWhile()` {.collection-method}

`skipWhile` 方法在给定回调返回 `true` 时跳过集合中的条目。一旦回调返回 `false`，集合中所有剩余条目将作为新集合返回：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->skipWhile(function (int $item) {
    return $item <= 3;
});

$subset->all();

// [4]
```

> [!WARNING]
> 如果回调从未返回 `false`，`skipWhile` 方法将返回一个空集合。

#### `slice()` {.collection-method}

`slice` 方法返回从给定索引开始的集合切片：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$slice = $collection->slice(4);

$slice->all();

// [5, 6, 7, 8, 9, 10]
```

如果你想限制返回切片的大小，请将期望的大小作为第二个参数传给该方法：

```php
$slice = $collection->slice(4, 2);

$slice->all();

// [5, 6]
```

默认情况下，返回的切片会保留键。如果你不希望保留原始键，可以使用 values 方法重新索引它们。

#### `sliding()` {.collection-method}

`sliding` 方法返回一个新的块集合，表示集合中条目的"滑动窗口"视图：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(2);

$chunks->toArray();

// [[1, 2], [2, 3], [3, 4], [4, 5]]
```

这与 eachSpread 方法结合使用时特别有用：

```php
$transactions->sliding(2)->eachSpread(function (Collection $previous, Collection $current) {
    $current->total = $previous->total + $current->amount;
});
```

你可以选择性地传入第二个"步长"值，它决定每个块第一个条目之间的距离：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunks = $collection->sliding(3, step: 2);

$chunks->toArray();

// [[1, 2, 3], [3, 4, 5]]
```

#### `sole()` {.collection-method}

`sole` 方法返回集合中通过给定真值测试的第一个元素，但前提是真值测试恰好匹配一个元素：

```php
collect([1, 2, 3, 4])->sole(function (int $value, int $key) {
    return $value === 2;
});

// 2
```

你也可以向 `sole` 方法传递一个键/值对，它将返回集合中匹配给定对的第一个元素，但前提是恰好有一个元素匹配：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
    ['product' => 'Chair', 'price' => 100],
]);

$collection->sole('product', 'Chair');

// ['product' => 'Chair', 'price' => 100]
```

或者，你也可以不带参数调用 `sole` 方法，在只有一个元素时获取集合中的第一个元素：

```php
$collection = collect([
    ['product' => 'Desk', 'price' => 200],
]);

$collection->sole();

// ['product' => 'Desk', 'price' => 200]
```

如果集合中没有应由 `sole` 方法返回的元素，将抛出 `\Illuminate\Collections\ItemNotFoundException` 异常。如果要返回的元素多于一个，将抛出 `\Illuminate\Collections\MultipleItemsFoundException` 异常。

#### `some()` {.collection-method}

contains 方法的别名。

#### `sort()` {.collection-method}

`sort` 方法对集合进行排序。排序后的集合保留原始数组键，因此在下面的示例中我们将使用 values 方法将键重置为连续编号的索引：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sort();

$sorted->values()->all();

// [1, 2, 3, 4, 5]
```

如果你的排序需求更高级，可以向 `sort` 传入一个带有你自己算法的回调。请参阅 PHP 关于 [uasort](https://secure.php.net/manual/en/function.uasort.php#refsect1-function.uasort-parameters) 的文档，这是集合的 `sort` 方法内部调用的函数。

> [!NOTE]
> 如果你需要对嵌套数组或对象的集合进行排序，请参阅 sortBy 和 sortByDesc 方法。

#### `sortBy()` {.collection-method}

`sortBy` 方法按给定键对集合进行排序。排序后的集合保留原始数组键，因此在下面的示例中我们将使用 values 方法将键重置为连续编号的索引：

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

`sortBy` 方法接受 [排序标志](https://www.php.net/manual/en/function.sort.php) 作为第二个参数：

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

或者，你可以传入自己的闭包来确定如何对集合的值进行排序：

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

如果你想按多个属性对集合排序，可以向 `sortBy` 方法传入一个排序操作数组。每个排序操作应该是一个包含你要排序的属性以及期望排序方向的数组：

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

当按多个属性对集合排序时，你也可以提供定义每个排序操作的闭包：

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

#### `sortByDesc()` {.collection-method}

该方法的签名与 sortBy 方法相同，但会以相反的顺序对集合进行排序。

#### `sortDesc()` {.collection-method}

该方法将以与 sort 方法相反的顺序对集合进行排序：

```php
$collection = collect([5, 3, 1, 2, 4]);

$sorted = $collection->sortDesc();

$sorted->values()->all();

// [5, 4, 3, 2, 1]
```

与 `sort` 不同，你不能向 `sortDesc` 传入闭包。相反，你应该使用 sort 方法并反转你的比较。

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

#### `sortKeysDesc()` {.collection-method}

该方法的签名与 sortKeys 方法相同，但会以相反的顺序对集合进行排序。

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

该回调必须是一个比较函数，返回小于、等于或大于零的整数。更多信息，请参阅 PHP 关于 [uksort](https://www.php.net/manual/en/function.uksort.php#refsect1-function.uksort-parameters) 的文档，这是 `sortKeysUsing` 方法内部使用的 PHP 函数。

#### `splice()` {.collection-method}

`splice` 方法移除并返回从指定索引开始的切片条目：

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

此外，你可以传入第三个参数，其中包含用于替换从集合中移除的条目的新条目：

```php
$collection = collect([1, 2, 3, 4, 5]);

$chunk = $collection->splice(2, 1, [10, 11]);

$chunk->all();

// [3]

$collection->all();

// [1, 2, 10, 11, 4, 5]
```

#### `split()` {.collection-method}

`split` 方法将集合拆分为给定数量的组：

```php
$collection = collect([1, 2, 3, 4, 5]);

$groups = $collection->split(3);

$groups->all();

// [[1, 2], [3, 4], [5]]
```

#### `splitIn()` {.collection-method}

`splitIn` 方法将集合拆分为给定数量的组，在将剩余部分分配给最后一个组之前先完全填满非末尾组：

```php
$collection = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

$groups = $collection->splitIn(3);

$groups->all();

// [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```

#### `sum()` {.collection-method}

`sum` 方法返回集合中所有条目的总和：

```php
collect([1, 2, 3, 4, 5])->sum();

// 15
```

如果集合包含嵌套数组或对象，你应该传入一个键，用于确定要求和的值：

```php
$collection = collect([
    ['name' => 'JavaScript: The Good Parts', 'pages' => 176],
    ['name' => 'JavaScript: The Definitive Guide', 'pages' => 1096],
]);

$collection->sum('pages');

// 1272
```

此外，你可以传入自己的闭包来确定要求和的集合值：

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

#### `take()` {.collection-method}

`take` 方法返回一个包含指定数量条目的新集合：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(3);

$chunk->all();

// [0, 1, 2]
```

你也可以传入一个负整数，以从集合末尾获取指定数量的条目：

```php
$collection = collect([0, 1, 2, 3, 4, 5]);

$chunk = $collection->take(-2);

$chunk->all();

// [4, 5]
```

#### `takeUntil()` {.collection-method}

`takeUntil` 方法返回集合中直到给定回调返回 `true` 的条目：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(function (int $item) {
    return $item >= 3;
});

$subset->all();

// [1, 2]
```

你也可以向 `takeUntil` 方法传递一个简单的值，以获取直到找到给定值的条目：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeUntil(3);

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果未找到给定值，或者回调从未返回 `true`，`takeUntil` 方法将返回集合中的所有条目。

#### `takeWhile()` {.collection-method}

`takeWhile` 方法返回集合中直到给定回调返回 `false` 的条目：

```php
$collection = collect([1, 2, 3, 4]);

$subset = $collection->takeWhile(function (int $item) {
    return $item < 3;
});

$subset->all();

// [1, 2]
```

> [!WARNING]
> 如果回调从未返回 `false`，`takeWhile` 方法将返回集合中的所有条目。

#### `tap()` {.collection-method}

`tap` 方法将集合传给给定的闭包，让你可以"切入"集合的特定位置并对条目执行某些操作，同时不影响集合本身。然后集合由 `tap` 方法返回：

```php
collect([2, 4, 3, 1, 5])
    ->sort()
    ->tap(function (Collection $collection) {
        Log::debug('Values after sorting', $collection->values()->all());
    })
    ->shift();

// 1
```

#### `times()` {.collection-method}

静态 `times` 方法通过调用给定闭包指定次数来创建一个新的集合：

```php
$collection = Collection::times(10, function (int $number) {
    return $number * 9;
});

$collection->all();

// [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]
```

#### `toArray()` {.collection-method}

`toArray` 方法将集合转换为普通的 PHP `array`。如果集合的值是 [Eloquent](/topic/Laravel%2013.x/rwyl2kxvz8.html) 模型，这些模型也会被转换为数组：

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
> `toArray` 还会将集合中所有作为 `Arrayable` 实例的嵌套对象转换为数组。如果你想获取集合底层的原始数组，请改用 all 方法。

#### `toJson()` {.collection-method}

`toJson` 方法将集合转换为 JSON 序列化字符串：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toJson();

// '{"name":"Desk", "price":200}'
```

#### `toPrettyJson()` {.collection-method}

`toPrettyJson` 方法使用 `JSON_PRETTY_PRINT` 选项将集合转换为格式化的 JSON 字符串：

```php
$collection = collect(['name' => 'Desk', 'price' => 200]);

$collection->toPrettyJson();
```

#### `transform()` {.collection-method}

`transform` 方法遍历集合，并用集合中的每个条目调用给定的回调。集合中的条目将被回调返回的值替换：

```php
$collection = collect([1, 2, 3, 4, 5]);

$collection->transform(function (int $item, int $key) {
    return $item * 2;
});

$collection->all();

// [2, 4, 6, 8, 10]
```

> [!WARNING]
> 与大多数其他集合方法不同，`transform` 会修改集合本身。如果你想创建一个新的集合，请使用 map 方法。

#### `undot()` {.collection-method}

`undot` 方法将使用"点"符号的单维集合扩展为多维集合：

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

#### `union()` {.collection-method}

`union` 方法将给定的数组添加到集合中。如果给定的数组包含原始集合中已有的键，则优先使用原始集合的值：

```php
$collection = collect([1 => ['a'], 2 => ['b']]);

$union = $collection->union([3 => ['c'], 1 => ['d']]);

$union->all();

// [1 => ['a'], 2 => ['b'], 3 => ['c']]
```

#### `unique()` {.collection-method}

`unique` 方法返回集合中所有唯一的条目。返回的集合保留原始数组键，因此在下面的示例中我们将使用 values 方法将键重置为连续编号的索引：

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

最后，你也可以向 `unique` 方法传入自己的闭包，以指定哪个值应决定条目的唯一性：

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

`unique` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。使用 uniqueStrict 方法以"严格"比较进行筛选。

> [!NOTE]
> 使用 [Eloquent Collections](/topic/Laravel%2013.x/d6vroqrv3g.html) 时，该方法的行为会被修改。

#### `uniqueStrict()` {.collection-method}

该方法的签名与 unique 方法相同；不过，所有值都使用"严格"比较进行比较。

#### `unless()` {.collection-method}

`unless` 方法将执行给定的回调，除非传给该方法第一个参数的值为 `true`。集合实例以及传给 `unless` 方法的第一个参数会被提供给该闭包：

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

可以向 `unless` 方法传入第二个回调。当传给 `unless` 方法的第一个参数的值为 `true` 时，将执行第二个回调：

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

有关 `unless` 的反向操作，请参阅 when 方法。

#### `unlessEmpty()` {.collection-method}

whenNotEmpty 方法的别名。

#### `unlessNotEmpty()` {.collection-method}

whenEmpty 方法的别名。

#### `unwrap()` {.collection-method}

静态 `unwrap` 方法在适用时从给定值返回集合的底层条目：

```php
Collection::unwrap(collect('John Doe'));

// ['John Doe']

Collection::unwrap(['John Doe']);

// ['John Doe']

Collection::unwrap('John Doe');

// 'John Doe'
```

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

#### `values()` {.collection-method}

`values` 方法返回一个键被重置为连续整数的新集合：

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

#### `when()` {.collection-method}

`when` 方法将在传给该方法第一个参数的值为 `true` 时执行给定的回调。集合实例以及传给 `when` 方法的第一个参数会被提供给该闭包：

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

可以向 `when` 方法传入第二个回调。当传给 `when` 方法的第一个参数的值为 `false` 时，将执行第二个回调：

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

有关 `when` 的反向操作，请参阅 unless 方法。

#### `whenEmpty()` {.collection-method}

`whenEmpty` 方法将在集合为空时执行给定的回调：

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

可以向 `whenEmpty` 方法传入第二个闭包，该闭包将在集合不为空时执行：

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

有关 `whenEmpty` 的反向操作，请参阅 whenNotEmpty 方法。

#### `whenNotEmpty()` {.collection-method}

`whenNotEmpty` 方法将在集合不为空时执行给定的回调：

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

可以向 `whenNotEmpty` 方法传入第二个闭包，该闭包将在集合为空时执行：

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

有关 `whenNotEmpty` 的反向操作，请参阅 whenEmpty 方法。

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

`where` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。使用 whereStrict 方法以"严格"比较进行筛选，或使用 whereNull 和 whereNotNull 方法来筛选 `null` 值。

或者，你可以传入一个比较运算符作为第二个参数。支持的运算符有：'===', '!==', '!=', '==', '=', '<>', '>', '<', '>=', 和 '<='：

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

#### `whereStrict()` {.collection-method}

该方法的签名与 where 方法相同；不过，所有值都使用"严格"比较进行比较。

#### `whereBetween()` {.collection-method}

`whereBetween` 方法通过确定指定条目值是否在给定的范围内来筛选集合：

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

#### `whereIn()` {.collection-method}

`whereIn` 方法从集合中移除其指定条目值不包含在给定数组中的元素：

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

`whereIn` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。使用 whereInStrict 方法以"严格"比较进行筛选。

#### `whereInStrict()` {.collection-method}

该方法的签名与 whereIn 方法相同；不过，所有值都使用"严格"比较进行比较。

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

#### `whereNotBetween()` {.collection-method}

`whereNotBetween` 方法通过确定指定条目值是否在给定范围之外来筛选集合：

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

#### `whereNotIn()` {.collection-method}

`whereNotIn` 方法从集合中移除其指定条目值包含在给定数组中的元素：

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

`whereNotIn` 方法在检查条目值时使用"宽松"比较，意味着包含整数值的字符串会被视为与相同值的整数相等。使用 whereNotInStrict 方法以"严格"比较进行筛选。

#### `whereNotInStrict()` {.collection-method}

该方法的签名与 whereNotIn 方法相同；不过，所有值都使用"严格"比较进行比较。

#### `whereNotNull()` {.collection-method}

`whereNotNull` 方法返回集合中给定键不为 `null` 的条目：

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

#### `whereNull()` {.collection-method}

`whereNull` 方法返回集合中给定键为 `null` 的条目：

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

#### `wrap()` {.collection-method}

静态 `wrap` 方法在适用时将给定值包装在集合中：

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

#### `zip()` {.collection-method}

`zip` 方法在对应索引处将给定数组的值与原始集合的值合并在一起：

```php
$collection = collect(['Chair', 'Desk']);

$zipped = $collection->zip([100, 200]);

$zipped->all();

// [['Chair', 100], ['Desk', 200]]
```

## 高阶消息

集合还支持"高阶消息"（higher order messages），这是对集合执行常见操作的快捷方式。提供高阶消息的集合方法有：average、avg、contains、each、every、filter、first、flatMap、groupBy、keyBy、map、max、min、partition、reject、skipUntil、skipWhile、some、sortBy、sortByDesc、sum、takeUntil、takeWhile 和 unique。

每个高阶消息都可以作为集合实例上的动态属性来访问。例如，让我们使用 `each` 高阶消息来调用集合内每个对象上的一个方法：

```php
use App\Models\User;

$users = User::where('votes', '>', 500)->get();

$users->each->markAsVip();
```

同样，我们可以使用 `sum` 高阶消息来收集用户集合的"投票"总数：

```php
$users = User::where('group', 'Development')->get();

return $users->sum->votes;
```

## 惰性集合

### 简介

> [!WARNING]
> 在进一步了解 Laravel 的惰性集合之前，请花些时间熟悉 [PHP 生成器](https://www.php.net/manual/en/language.generators.overview.php)。

为了补充已经强大的 `Collection` 类，`LazyCollection` 类利用 PHP 的 [生成器](https://www.php.net/manual/en/language.generators.overview.php)，让你在处理非常大的数据集时保持较低的内存使用量。

例如，想象你的应用程序需要处理一个多 GB 的日志文件，同时利用 Laravel 的集合方法来解析日志。惰性集合可以用于在给定时间只在内存中保留文件的一小部分，而不是一次性将整个文件读入内存：

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

或者，想象你需要遍历 10,000 个 Eloquent 模型。使用传统的 Laravel 集合时，所有 10,000 个 Eloquent 模型必须同时加载到内存中：

```php
use App\Models\User;

$users = User::all()->filter(function (User $user) {
    return $user->id > 500;
});
```

不过，查询构造器的 `cursor` 方法会返回一个 `LazyCollection` 实例。这让你仍然只针对数据库运行单个查询，同时也只在内存中一次保留一个 Eloquent 模型。在本示例中，`filter` 回调直到我们实际逐个遍历每个用户时才会执行，从而大幅降低了内存使用量：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

### 创建惰性集合

要创建惰性集合实例，你应该将一个 PHP 生成器函数传给集合的 `make` 方法：

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

all
average
avg
chunk
chunkBy
chunkWhile
collapse
collect
combine
concat
contains
containsStrict
count
countBy
crossJoin
dd
diff
diffAssoc
diffKeys
dump
duplicates
duplicatesStrict
each
eachSpread
every
except
filter
first
firstOrFail
firstWhere
flatMap
flatten
flip
forPage
get
groupBy
has
implode
intersect
intersectAssoc
intersectByKeys
isEmpty
isNotEmpty
join
keyBy
keys
last
macro
make
map
mapInto
mapSpread
mapToGroups
mapWithKeys
max
median
merge
mergeRecursive
min
mode
nth
only
pad
partition
pipe
pluck
random
reduce
reduceInto
reject
replace
replaceRecursive
reverse
search
shuffle
skip
slice
sole
some
sort
sortBy
sortByDesc
sortKeys
sortKeysDesc
split
sum
take
tap
times
toArray
toJson
union
unique
uniqueStrict
unless
unlessEmpty
unlessNotEmpty
unwrap
values
when
whenEmpty
whenNotEmpty
where
whereStrict
whereBetween
whereIn
whereInStrict
whereInstanceOf
whereNotBetween
whereNotIn
whereNotInStrict
wrap
zip

> [!WARNING]
> 会修改集合的方法（如 `shift`、`pop`、`prepend` 等）在 `LazyCollection` 类上**不可用**。

### 惰性集合方法

除了 `Enumerable` 契约中定义的方法之外，`LazyCollection` 类还包含以下方法：

#### `takeUntilTimeout()` {.collection-method}

`takeUntilTimeout` 方法返回一个新惰性集合，该集合将枚举值直到指定时间。在此时间之后，集合将停止枚举：

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

为了说明该方法的使用，想象一个应用程序使用游标从数据库提交发票。你可以定义一个 [计划任务](/topic/Laravel%2013.x/e296olw9q7.html)，它每 15 分钟运行一次，并且最多只处理 14 分钟的发票：

```php
use App\Models\Invoice;
use Illuminate\Support\Carbon;

Invoice::pending()->cursor()
    ->takeUntilTimeout(
        Carbon::createFromTimestamp(LARAVEL_START)->add(14, 'minutes')
    )
    ->each(fn (Invoice $invoice) => $invoice->submit());
```

#### `tapEach()` {.collection-method}

`each` 方法会立即为集合中的每个条目调用给定的回调，而 `tapEach` 方法只会在条目被逐个从列表中取出时调用给定的回调：

```php
// 到目前为止还没有任何内容被输出...
$lazyCollection = LazyCollection::times(INF)->tapEach(function (int $value) {
    dump($value);
});

// 输出了三个条目...
$array = $lazyCollection->take(3)->all();

// 1
// 2
// 3
```

#### `throttle()` {.collection-method}

`throttle` 方法会对惰性集合进行节流，使每个值在指定的秒数之后才返回。该方法在与对传入请求进行速率限制的外部 API 交互时特别有用：

```php
use App\Models\User;

User::where('vip', true)
    ->cursor()
    ->throttle(seconds: 1)
    ->each(function (User $user) {
        // 调用外部 API...
    });
```

#### `remember()` {.collection-method}

`remember` 方法返回一个新惰性集合，它将记住任何已经枚举过的值，并且在后续集合枚举中不会再次获取它们：

```php
// 还没有执行任何查询...
$users = User::cursor()->remember();

// 查询被执行...
// 前 5 个用户从数据库中水合...
$users->take(5)->all();

// 前 5 个用户来自集合的缓存...
// 其余的从数据库中水合...
$users->take(20)->all();
```

#### `withHeartbeat()` {.collection-method}

`withHeartbeat` 方法允许你在惰性集合枚举过程中按固定的时间间隔执行一个回调。这对于需要定期维护任务的长时间运行操作特别有用，例如延长锁或发送进度更新：

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