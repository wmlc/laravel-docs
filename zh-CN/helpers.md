# 辅助函数

## 介绍

Laravel 包含各种全局"辅助" PHP 函数。其中许多函数由框架本身使用；但是，如果你觉得方便，你也可以在你自己的应用程序中自由使用它们。

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

### 数组与对象

<div class="collection-method-list" markdown="1">

Arr::accessible
Arr::add
Arr::array
Arr::boolean
Arr::collapse
Arr::crossJoin
Arr::divide
Arr::dot
Arr::every
Arr::except
Arr::exceptValues
Arr::exists
Arr::first
Arr::flatten
Arr::float
Arr::forget
Arr::from
Arr::get
Arr::has
Arr::hasAll
Arr::hasAny
Arr::integer
Arr::isAssoc
Arr::isList
Arr::join
Arr::keyBy
Arr::last
Arr::map
Arr::mapSpread
Arr::mapWithKeys
Arr::only
Arr::onlyValues
Arr::partition
Arr::pluck
Arr::prepend
Arr::prependKeysWith
Arr::pull
Arr::push
Arr::query
Arr::random
Arr::reject
Arr::select
Arr::set
Arr::shuffle
Arr::sole
Arr::some
Arr::sort
Arr::sortDesc
Arr::sortRecursive
Arr::string
Arr::take
Arr::toCssClasses
Arr::toCssStyles
Arr::undot
Arr::where
Arr::whereNotNull
Arr::wrap
data_fill
data_get
data_set
data_forget
head
last
</div>

### 数字

<div class="collection-method-list" markdown="1">

Number::abbreviate
Number::clamp
Number::currency
Number::defaultCurrency
Number::defaultLocale
Number::fileSize
Number::forHumans
Number::format
Number::ordinal
Number::pairs
Number::parse
Number::parseInt
Number::parseFloat
Number::percentage
Number::spell
Number::spellOrdinal
Number::trim
Number::useLocale
Number::withLocale
Number::useCurrency
Number::withCurrency

</div>

### 路径

<div class="collection-method-list" markdown="1">

app_path
base_path
config_path
database_path
lang_path
public_path
resource_path
storage_path

</div>

### URL

<div class="collection-method-list" markdown="1">

action
asset
route
secure_asset
secure_url
to_action
to_route
uri
url

</div>

### 杂项

<div class="collection-method-list" markdown="1">

abort
abort_if
abort_unless
app
auth
back
bcrypt
blank
broadcast
broadcast_if
broadcast_unless
cache
class_uses_recursive
collect
config
context
cookie
csrf_field
csrf_token
decrypt
dd
dispatch
dispatch_sync
dump
encrypt
env
event
fake
filled
info
literal
logger
method_field
now
old
once
optional
policy
redirect
report
report_if
report_unless
request
rescue
resolve
response
retry
session
tap
throw_if
throw_unless
today
trait_uses_recursive
transform
validator
value
view
with
when

</div>

## 数组与对象

#### `Arr::accessible()` {.collection-method .first-collection-method}

`Arr::accessible` 方法确定给定的值是否可进行数组访问：

```php
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
```

#### `Arr::add()` {.collection-method}

如果给定的键在数组中不存在或设置为 `null`，`Arr::add` 方法会将给定的键 / 值对添加到数组：

```php
use Illuminate\Support\Arr;

$array = Arr::add(['name' => 'Desk'], 'price', 100);

// ['name' => 'Desk', 'price' => 100]

$array = Arr::add(['name' => 'Desk', 'price' => null], 'price', 100);

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::array()` {.collection-method}

`Arr::array` 方法使用"点"表示法从深度嵌套的数组中检索值（就像 Arr::get() 一样），但如果请求的值不是 `array`，则会抛出 `InvalidArgumentException`：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

$value = Arr::array($array, 'languages');

// ['PHP', 'Ruby']

$value = Arr::array($array, 'name');

// 抛出 InvalidArgumentException
```

#### `Arr::boolean()` {.collection-method}

`Arr::boolean` 方法使用"点"表示法从深度嵌套的数组中检索值（就像 Arr::get() 一样），但如果请求的值不是 `boolean`，则会抛出 `InvalidArgumentException`：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'available' => true];

$value = Arr::boolean($array, 'available');

// true

$value = Arr::boolean($array, 'name');

// 抛出 InvalidArgumentException
```


#### `Arr::collapse()` {.collection-method}

`Arr::collapse` 方法将数组的数组或集合折叠为单个数组：

```php
use Illuminate\Support\Arr;

$array = Arr::collapse([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);

// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

#### `Arr::crossJoin()` {.collection-method}

`Arr::crossJoin` 方法对给定的数组进行交叉连接，返回一个包含所有可能排列的笛卡尔积：

```php
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
```

#### `Arr::divide()` {.collection-method}

`Arr::divide` 方法返回两个数组：一个包含给定数组的键，另一个包含其值：

```php
use Illuminate\Support\Arr;

[$keys, $values] = Arr::divide(['name' => 'Desk']);

// $keys: ['name']

// $values: ['Desk']
```

#### `Arr::dot()` {.collection-method}

`Arr::dot` 方法将多维数组扁平化为单层数组，该数组使用"点"表示法来指示深度：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

$flattened = Arr::dot($array);

// ['products.desk.price' => 100]
```

#### `Arr::every()` {.collection-method}

`Arr::every` 方法确保数组中的所有值都通过给定的真值测试：

```php
use Illuminate\Support\Arr;

$array = [1, 2, 3];

Arr::every($array, fn ($i) => $i > 0);

// true

Arr::every($array, fn ($i) => $i > 2);

// false
```

#### `Arr::except()` {.collection-method}

`Arr::except` 方法从数组中移除给定的键 / 值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100];

$filtered = Arr::except($array, ['price']);

// ['name' => 'Desk']
```

#### `Arr::exceptValues()` {.collection-method}

`Arr::exceptValues` 方法从数组中移除指定的值：

```php
use Illuminate\Support\Arr;

$array = ['foo', 'bar', 'baz', 'qux'];

$filtered = Arr::exceptValues($array, ['foo', 'baz']);

// ['bar', 'qux']
```

你还可以将 `true` 传递给 `strict` 参数，以在过滤时使用严格类型比较：

```php
use Illuminate\Support\Arr;

$array = [1, '1', 2, '2'];

$filtered = Arr::exceptValues($array, [1, 2], strict: true);

// ['1', '2']
```

#### `Arr::exists()` {.collection-method}

`Arr::exists` 方法检查给定的键是否存在于提供的数组中：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'John Doe', 'age' => 17];

$exists = Arr::exists($array, 'name');

// true

$exists = Arr::exists($array, 'salary');

// false
```

#### `Arr::first()` {.collection-method}

`Arr::first` 方法返回通过给定真值测试的数组的第一个元素：

```php
use Illuminate\Support\Arr;

$array = [100, 200, 300];

$first = Arr::first($array, function (int $value, int $key) {
    return $value >= 150;
});

// 200
```

还可以将默认值作为第三个参数传递给该方法。如果没有值通过真值测试，将返回此值：

```php
use Illuminate\Support\Arr;

$first = Arr::first($array, $callback, $default);
```

#### `Arr::flatten()` {.collection-method}

`Arr::flatten` 方法将多维数组扁平化为单层数组：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

$flattened = Arr::flatten($array);

// ['Joe', 'PHP', 'Ruby']
```

#### `Arr::float()` {.collection-method}

`Arr::float` 方法使用"点"表示法从深度嵌套的数组中检索值（就像 Arr::get() 一样），但如果请求的值不是 `float`，则会抛出 `InvalidArgumentException`：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'balance' => 123.45];

$value = Arr::float($array, 'balance');

// 123.45

$value = Arr::float($array, 'name');

// 抛出 InvalidArgumentException
```

#### `Arr::forget()` {.collection-method}

`Arr::forget` 方法使用"点"表示法从深度嵌套的数组中移除给定的键 / 值对：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

Arr::forget($array, 'products.desk');

// ['products' => []]
```

#### `Arr::from()` {.collection-method}

`Arr::from` 方法将各种输入类型转换为普通的 PHP 数组。它支持一系列输入类型，包括数组、对象以及几个常见的 Laravel 接口，例如 `Arrayable`、`Enumerable`、`Jsonable` 和 `JsonSerializable`。此外，它还处理 `Traversable` 和 `WeakMap` 实例：

```php
use Illuminate\Support\Arr;

Arr::from((object) ['foo' => 'bar']); // ['foo' => 'bar']

class TestJsonableObject implements Jsonable
{
    public function toJson($options = 0)
    {
        return json_encode(['foo' => 'bar']);
    }
}

Arr::from(new TestJsonableObject); // ['foo' => 'bar']
```

#### `Arr::get()` {.collection-method}

`Arr::get` 方法使用"点"表示法从深度嵌套的数组中检索值：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

$price = Arr::get($array, 'products.desk.price');

// 100
```

`Arr::get` 方法还接受一个默认值，如果指定的键不在数组中，将返回该默认值：

```php
use Illuminate\Support\Arr;

$discount = Arr::get($array, 'products.desk.discount', 0);

// 0
```

#### `Arr::has()` {.collection-method}

`Arr::has` 方法使用"点"表示法检查给定的一项或多项是否存在于数组中：

```php
use Illuminate\Support\Arr;

$array = ['product' => ['name' => 'Desk', 'price' => 100]];

$contains = Arr::has($array, 'product.name');

// true

$contains = Arr::has($array, ['product.price', 'product.discount']);

// false
```

#### `Arr::hasAll()` {.collection-method}

`Arr::hasAll` 方法使用"点"表示法确定所有指定的键是否存在于给定数组中：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Taylor', 'language' => 'PHP'];

Arr::hasAll($array, ['name']); // true
Arr::hasAll($array, ['name', 'language']); // true
Arr::hasAll($array, ['name', 'IDE']); // false
```

#### `Arr::hasAny()` {.collection-method}

`Arr::hasAny` 方法使用"点"表示法检查给定集合中的任何一项是否存在于数组中：

```php
use Illuminate\Support\Arr;

$array = ['product' => ['name' => 'Desk', 'price' => 100]];

$contains = Arr::hasAny($array, 'product.name');

// true

$contains = Arr::hasAny($array, ['product.name', 'product.discount']);

// true

$contains = Arr::hasAny($array, ['category', 'product.discount']);

// false
```

#### `Arr::integer()` {.collection-method}

`Arr::integer` 方法使用"点"表示法从深度嵌套的数组中检索值（就像 Arr::get() 一样），但如果请求的值不是 `int`，则会抛出 `InvalidArgumentException`：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'age' => 42];

$value = Arr::integer($array, 'age');

// 42

$value = Arr::integer($array, 'name');

// 抛出 InvalidArgumentException
```

#### `Arr::isAssoc()` {.collection-method}

如果给定数组是关联数组，`Arr::isAssoc` 方法返回 `true`。如果数组没有从零开始的连续数字键，则该数组被视为"关联数组"：

```php
use Illuminate\Support\Arr;

$isAssoc = Arr::isAssoc(['product' => ['name' => 'Desk', 'price' => 100]]);

// true

$isAssoc = Arr::isAssoc([1, 2, 3]);

// false
```

#### `Arr::isList()` {.collection-method}

如果给定数组的键是从零开始的连续整数，`Arr::isList` 方法返回 `true`：

```php
use Illuminate\Support\Arr;

$isList = Arr::isList(['foo', 'bar', 'baz']);

// true

$isList = Arr::isList(['product' => ['name' => 'Desk', 'price' => 100]]);

// false
```

#### `Arr::join()` {.collection-method}

`Arr::join` 方法用字符串连接数组元素。使用此方法的第三个参数，你还可以指定数组最后一个元素的连接字符串：

```php
use Illuminate\Support\Arr;

$array = ['Tailwind', 'Alpine', 'Laravel', 'Livewire'];

$joined = Arr::join($array, ', ');

// Tailwind, Alpine, Laravel, Livewire

$joined = Arr::join($array, ', ', ', and ');

// Tailwind, Alpine, Laravel, and Livewire
```

#### `Arr::keyBy()` {.collection-method}

`Arr::keyBy` 方法按给定键对数组进行键控。如果多个项具有相同的键，则只有最后一个会出现在新数组中：

```php
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
```

#### `Arr::last()` {.collection-method}

`Arr::last` 方法返回通过给定真值测试的数组的最后一个元素：

```php
use Illuminate\Support\Arr;

$array = [100, 200, 300, 110];

$last = Arr::last($array, function (int $value, int $key) {
    return $value >= 150;
});

// 300
```

可以将默认值作为第三个参数传递给该方法。如果没有值通过真值测试，将返回此值：

```php
use Illuminate\Support\Arr;

$last = Arr::last($array, $callback, $default);
```

#### `Arr::map()` {.collection-method}

`Arr::map` 方法遍历数组并将每个值和键传递给给定的回调。数组值将被回调返回的值替换：

```php
use Illuminate\Support\Arr;

$array = ['first' => 'james', 'last' => 'kirk'];

$mapped = Arr::map($array, function (string $value, string $key) {
    return ucfirst($value);
});

// ['first' => 'James', 'last' => 'Kirk']
```

#### `Arr::mapSpread()` {.collection-method}

`Arr::mapSpread` 方法遍历数组，将每个嵌套项的值传递给给定的闭包。闭包可以自由修改该项并返回它，从而形成一个由修改后的项组成的新数组：

```php
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
```

#### `Arr::mapWithKeys()` {.collection-method}

`Arr::mapWithKeys` 方法遍历数组并将每个值传递给给定的回调。回调应返回一个包含单个键 / 值对的关联数组：

```php
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
```

#### `Arr::only()` {.collection-method}

`Arr::only` 方法只返回给定数组中的指定键 / 值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100, 'orders' => 10];

$slice = Arr::only($array, ['name', 'price']);

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::onlyValues()` {.collection-method}

`Arr::onlyValues` 方法只返回数组中的指定值：

```php
use Illuminate\Support\Arr;

$array = ['foo', 'bar', 'baz', 'qux'];

$filtered = Arr::onlyValues($array, ['foo', 'baz']);

// ['foo', 'baz']
```

你还可以将 `true` 传递给 `strict` 参数，以在过滤时使用严格类型比较：

```php
use Illuminate\Support\Arr;

$array = [1, '1', 2, '2'];

$filtered = Arr::onlyValues($array, [1, 2], strict: true);

// [1, 2]
```

#### `Arr::partition()` {.collection-method}

`Arr::partition` 方法可以与 PHP 数组解构结合使用，将通过给定真值测试的元素与未通过的元素分开：

```php
<?php

use Illuminate\Support\Arr;

$numbers = [1, 2, 3, 4, 5, 6];

[$underThree, $equalOrAboveThree] = Arr::partition($numbers, function (int $i) {
    return $i < 3;
});

dump($underThree);

// [1, 2]

dump($equalOrAboveThree);

// [3, 4, 5, 6]
```

#### `Arr::pluck()` {.collection-method}

`Arr::pluck` 方法从数组中检索给定键的所有值：

```php
use Illuminate\Support\Arr;

$array = [
    ['developer' => ['id' => 1, 'name' => 'Taylor']],
    ['developer' => ['id' => 2, 'name' => 'Abigail']],
];

$names = Arr::pluck($array, 'developer.name');

// ['Taylor', 'Abigail']
```

你还可以指定你希望结果列表如何被键控：

```php
use Illuminate\Support\Arr;

$names = Arr::pluck($array, 'developer.name', 'developer.id');

// [1 => 'Taylor', 2 => 'Abigail']
```

#### `Arr::prepend()` {.collection-method}

`Arr::prepend` 方法会将一项推到数组的开头：

```php
use Illuminate\Support\Arr;

$array = ['one', 'two', 'three', 'four'];

$array = Arr::prepend($array, 'zero');

// ['zero', 'one', 'two', 'three', 'four']
```

如果需要，你可以指定应用于该值的键：

```php
use Illuminate\Support\Arr;

$array = ['price' => 100];

$array = Arr::prepend($array, 'Desk', 'name');

// ['name' => 'Desk', 'price' => 100]
```

#### `Arr::prependKeysWith()` {.collection-method}

`Arr::prependKeysWith` 为关联数组的所有键名添加给定的前缀：

```php
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
```

#### `Arr::pull()` {.collection-method}

`Arr::pull` 方法返回并移除数组中的键 / 值对：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Desk', 'price' => 100];

$name = Arr::pull($array, 'name');

// $name: Desk

// $array: ['price' => 100]
```

可以将默认值作为第三个参数传递给该方法。如果键不存在，将返回此值：

```php
use Illuminate\Support\Arr;

$value = Arr::pull($array, $key, $default);
```

#### `Arr::push()` {.collection-method}

`Arr::push` 方法使用"点"表示法将一项推入数组。如果给定键处不存在数组，则会创建它：

```php
use Illuminate\Support\Arr;

$array = [];

Arr::push($array, 'office.furniture', 'Desk');

// $array: ['office' => ['furniture' => ['Desk']]]
```

#### `Arr::query()` {.collection-method}

`Arr::query` 方法将数组转换为查询字符串：

```php
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
```

#### `Arr::random()` {.collection-method}

`Arr::random` 方法从数组中返回一个随机值：

```php
use Illuminate\Support\Arr;

$array = [1, 2, 3, 4, 5];

$random = Arr::random($array);

// 4 -（随机检索）
```

你还可以将返回的项数作为可选的第二个参数指定。请注意，提供此参数将返回一个数组，即使只需要一项：

```php
use Illuminate\Support\Arr;

$items = Arr::random($array, 2);

// [2, 5] -（随机检索）
```

#### `Arr::reject()` {.collection-method}

`Arr::reject` 方法使用给定的闭包从数组中移除项：

```php
use Illuminate\Support\Arr;

$array = [100, '200', 300, '400', 500];

$filtered = Arr::reject($array, function (string|int $value, int $key) {
    return is_string($value);
});

// [0 => 100, 2 => 300, 4 => 500]
```

#### `Arr::select()` {.collection-method}

`Arr::select` 方法从数组中选择一个值数组：

```php
use Illuminate\Support\Arr;

$array = [
    ['id' => 1, 'name' => 'Desk', 'price' => 200],
    ['id' => 2, 'name' => 'Table', 'price' => 150],
    ['id' => 3, 'name' => 'Chair', 'price' => 300],
];

Arr::select($array, ['name', 'price']);

// [['name' => 'Desk', 'price' => 200], ['name' => 'Table', 'price' => 150], ['name' => 'Chair', 'price' => 300]]
```

#### `Arr::set()` {.collection-method}

`Arr::set` 方法使用"点"表示法在深度嵌套的数组中设置值：

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

Arr::set($array, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 200]]]
```

#### `Arr::shuffle()` {.collection-method}

`Arr::shuffle` 方法随机打乱数组中的项：

```php
use Illuminate\Support\Arr;

$array = Arr::shuffle([1, 2, 3, 4, 5]);

// [3, 2, 5, 1, 4] -（随机生成）
```

#### `Arr::sole()` {.collection-method}

`Arr::sole` 方法使用给定的闭包从数组中检索单个值。如果数组中有一个以上的值匹配给定的真值测试，则会抛出 `Illuminate\Support\MultipleItemsFoundException` 异常。如果没有值匹配真值测试，则会抛出 `Illuminate\Support\ItemNotFoundException` 异常：

```php
use Illuminate\Support\Arr;

$array = ['Desk', 'Table', 'Chair'];

$value = Arr::sole($array, fn (string $value) => $value === 'Desk');

// 'Desk'
```

#### `Arr::some()` {.collection-method}

`Arr::some` 方法确保数组中至少有一个值通过给定的真值测试：

```php
use Illuminate\Support\Arr;

$array = [1, 2, 3];

Arr::some($array, fn ($i) => $i > 2);

// true
```

#### `Arr::sort()` {.collection-method}

`Arr::sort` 方法按数组的值对数组进行排序：

```php
use Illuminate\Support\Arr;

$array = ['Desk', 'Table', 'Chair'];

$sorted = Arr::sort($array);

// ['Chair', 'Desk', 'Table']
```

你还可以按给定闭包的结果对数组进行排序：

```php
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
```

#### `Arr::sortDesc()` {.collection-method}

`Arr::sortDesc` 方法按数组的值对数组进行降序排序：

```php
use Illuminate\Support\Arr;

$array = ['Desk', 'Table', 'Chair'];

$sorted = Arr::sortDesc($array);

// ['Table', 'Desk', 'Chair']
```

你还可以按给定闭包的结果对数组进行排序：

```php
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
```

#### `Arr::sortRecursive()` {.collection-method}

`Arr::sortRecursive` 方法递归地对数组进行排序，对数字索引的子数组使用 `sort` 函数，对关联子数组使用 `ksort` 函数：

```php
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
```

如果你希望结果按降序排序，你可以使用 `Arr::sortRecursiveDesc` 方法。

```php
$sorted = Arr::sortRecursiveDesc($array);
```

#### `Arr::string()` {.collection-method}

`Arr::string` 方法使用"点"表示法从深度嵌套的数组中检索值（就像 Arr::get() 一样），但如果请求的值不是 `string`，则会抛出 `InvalidArgumentException`：

```php
use Illuminate\Support\Arr;

$array = ['name' => 'Joe', 'languages' => ['PHP', 'Ruby']];

$value = Arr::string($array, 'name');

// Joe

$value = Arr::string($array, 'languages');

// 抛出 InvalidArgumentException
```

#### `Arr::take()` {.collection-method}

`Arr::take` 方法返回一个包含指定数量项的新数组：

```php
use Illuminate\Support\Arr;

$array = [0, 1, 2, 3, 4, 5];

$chunk = Arr::take($array, 3);

// [0, 1, 2]
```

你还可以传递一个负整数来从数组末尾取指定数量的项：

```php
$array = [0, 1, 2, 3, 4, 5];

$chunk = Arr::take($array, -2);

// [4, 5]
```

#### `Arr::toCssClasses()` {.collection-method}

`Arr::toCssClasses` 方法有条件地编译 CSS 类字符串。该方法接受一个类数组，其中数组键包含你要添加的类，而值是布尔表达式。如果数组元素具有数字键，它将始终包含在渲染的类列表中：

```php
use Illuminate\Support\Arr;

$isActive = false;
$hasError = true;

$array = ['p-4', 'font-bold' => $isActive, 'bg-red' => $hasError];

$classes = Arr::toCssClasses($array);

/*
    'p-4 bg-red'
*/
```

#### `Arr::toCssStyles()` {.collection-method}

`Arr::toCssStyles` 方法有条件地编译 CSS 样式字符串。该方法接受一个 CSS 声明数组，其中数组键包含你要添加的 CSS 声明，而值是布尔表达式。如果数组元素具有数字键，它将始终包含在编译的 CSS 样式字符串中：

```php
use Illuminate\Support\Arr;

$hasColor = true;

$array = ['background-color: blue', 'color: blue' => $hasColor];

$classes = Arr::toCssStyles($array);

/*
    'background-color: blue; color: blue;'
*/
```

此方法为 Laravel 的功能提供支持，允许 [将类与 Blade 组件的属性包合并](/topic/Laravel%2013.x/wevwmrz9l2.html) 以及 `@class` [Blade 指令](/topic/Laravel%2013.x/wevwmrz9l2.html)。

#### `Arr::undot()` {.collection-method}

`Arr::undot` 方法将使用"点"表示法的单维数组扩展为多维数组：

```php
use Illuminate\Support\Arr;

$array = [
    'user.name' => 'Kevin Malone',
    'user.occupation' => 'Accountant',
];

$array = Arr::undot($array);

// ['user' => ['name' => 'Kevin Malone', 'occupation' => 'Accountant']]
```

#### `Arr::where()` {.collection-method}

`Arr::where` 方法使用给定的闭包过滤数组：

```php
use Illuminate\Support\Arr;

$array = [100, '200', 300, '400', 500];

$filtered = Arr::where($array, function (string|int $value, int $key) {
    return is_string($value);
});

// [1 => '200', 3 => '400']
```

#### `Arr::whereNotNull()` {.collection-method}

`Arr::whereNotNull` 方法从给定数组中移除所有 `null` 值：

```php
use Illuminate\Support\Arr;

$array = [0, null];

$filtered = Arr::whereNotNull($array);

// [0 => 0]
```

#### `Arr::wrap()` {.collection-method}

`Arr::wrap` 方法将给定值包装在数组中。如果给定值已经是数组，它将不做修改地返回：

```php
use Illuminate\Support\Arr;

$string = 'Laravel';

$array = Arr::wrap($string);

// ['Laravel']
```

如果给定值为 `null`，将返回一个空数组：

```php
use Illuminate\Support\Arr;

$array = Arr::wrap(null);

// []
```

#### `data_fill()` {.collection-method}

`data_fill` 函数使用"点"表示法在嵌套数组或对象中设置缺失的值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_fill($data, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 100]]]

data_fill($data, 'products.desk.discount', 10);

// ['products' => ['desk' => ['price' => 100, 'discount' => 10]]]
```

此函数还接受星号作为通配符，并将相应地填充目标：

```php
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
```

#### `data_get()` {.collection-method}

`data_get` 函数使用"点"表示法从嵌套数组或对象中检索值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

$price = data_get($data, 'products.desk.price');

// 100
```

`data_get` 函数还接受一个默认值，如果找不到指定的键，将返回该默认值：

```php
$discount = data_get($data, 'products.desk.discount', 0);

// 0
```

该函数还接受使用星号的通配符，它可以定位数组或对象的任何键：

```php
$data = [
    'product-one' => ['name' => 'Desk 1', 'price' => 100],
    'product-two' => ['name' => 'Desk 2', 'price' => 150],
];

data_get($data, '*.name');

// ['Desk 1', 'Desk 2'];
```

`{first}` 和 `{last}` 占位符可用于检索数组中的第一项或最后一项：

```php
$flight = [
    'segments' => [
        ['from' => 'LHR', 'departure' => '9:00', 'to' => 'IST', 'arrival' => '15:00'],
        ['from' => 'IST', 'departure' => '16:00', 'to' => 'PKX', 'arrival' => '20:00'],
    ],
];

data_get($flight, 'segments.{first}.arrival');

// 15:00
```

#### `data_set()` {.collection-method}

`data_set` 函数使用"点"表示法在嵌套数组或对象中设置值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_set($data, 'products.desk.price', 200);

// ['products' => ['desk' => ['price' => 200]]]
```

此函数还接受使用星号的通配符，并将相应地设置目标上的值：

```php
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
```

默认情况下，任何现有值都会被覆盖。如果你希望仅在值不存在时才设置它，你可以将 `false` 作为第四个参数传递给该函数：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_set($data, 'products.desk.price', 200, overwrite: false);

// ['products' => ['desk' => ['price' => 100]]]
```

#### `data_forget()` {.collection-method}

`data_forget` 函数使用"点"表示法移除嵌套数组或对象中的值：

```php
$data = ['products' => ['desk' => ['price' => 100]]];

data_forget($data, 'products.desk.price');

// ['products' => ['desk' => []]]
```

此函数还接受使用星号的通配符，并将相应地移除目标上的值：

```php
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
```

#### `head()` {.collection-method}

`head` 函数返回给定数组中的第一个元素。如果数组为空，将返回 `false`：

```php
$array = [100, 200, 300];

$first = head($array);

// 100
```

#### `last()` {.collection-method}

`last` 函数返回给定数组中的最后一个元素。如果数组为空，将返回 `false`：

```php
$array = [100, 200, 300];

$last = last($array);

// 300
```

## 数字

#### `Number::abbreviate()` {.collection-method}

`Number::abbreviate` 方法返回所提供数值的人类可读格式，并带有单位的缩写：

```php
use Illuminate\Support\Number;

$number = Number::abbreviate(1000);

// 1K

$number = Number::abbreviate(489939);

// 490K

$number = Number::abbreviate(1230000, precision: 2);

// 1.23M
```

#### `Number::clamp()` {.collection-method}

`Number::clamp` 方法确保给定数字保持在指定范围内。如果数字低于最小值，则返回最小值。如果数字高于最大值，则返回最大值：

```php
use Illuminate\Support\Number;

$number = Number::clamp(105, min: 10, max: 100);

// 100

$number = Number::clamp(5, min: 10, max: 100);

// 10

$number = Number::clamp(10, min: 10, max: 100);

// 10

$number = Number::clamp(20, min: 10, max: 100);

// 20
```

#### `Number::currency()` {.collection-method}

`Number::currency` 方法将给定值的货币表示形式作为字符串返回：

```php
use Illuminate\Support\Number;

$currency = Number::currency(1000);

// $1,000.00

$currency = Number::currency(1000, in: 'EUR');

// €1,000.00

$currency = Number::currency(1000, in: 'EUR', locale: 'de');

// 1.000,00 €

$currency = Number::currency(1000, in: 'EUR', locale: 'de', precision: 0);

// 1.000 €
```

#### `Number::defaultCurrency()` {.collection-method}

`Number::defaultCurrency` 方法返回 `Number` 类正在使用的默认货币：

```php
use Illuminate\Support\Number;

$currency = Number::defaultCurrency();

// USD
```

#### `Number::defaultLocale()` {.collection-method}

`Number::defaultLocale` 方法返回 `Number` 类正在使用的默认语言环境：

```php
use Illuminate\Support\Number;

$locale = Number::defaultLocale();

// en
```

#### `Number::fileSize()` {.collection-method}

`Number::fileSize` 方法将给定字节值的文件大小表示形式作为字符串返回：

```php
use Illuminate\Support\Number;

$size = Number::fileSize(1024);

// 1 KB

$size = Number::fileSize(1024 * 1024);

// 1 MB

$size = Number::fileSize(1024, precision: 2);

// 1.00 KB
```

#### `Number::forHumans()` {.collection-method}

`Number::forHumans` 方法返回所提供数值的人类可读格式：

```php
use Illuminate\Support\Number;

$number = Number::forHumans(1000);

// 1 thousand

$number = Number::forHumans(489939);

// 490 thousand

$number = Number::forHumans(1230000, precision: 2);

// 1.23 million
```

#### `Number::format()` {.collection-method}

`Number::format` 方法将给定数字格式化为特定于语言环境的字符串：

```php
use Illuminate\Support\Number;

$number = Number::format(100000);

// 100,000

$number = Number::format(100000, precision: 2);

// 100,000.00

$number = Number::format(100000.123, maxPrecision: 2);

// 100,000.12

$number = Number::format(100000, locale: 'de');

// 100.000
```

#### `Number::ordinal()` {.collection-method}

`Number::ordinal` 方法返回数字的序数表示形式：

```php
use Illuminate\Support\Number;

$number = Number::ordinal(1);

// 1st

$number = Number::ordinal(2);

// 2nd

$number = Number::ordinal(21);

// 21st
```

#### `Number::pairs()` {.collection-method}

`Number::pairs` 方法根据指定的范围和步长值生成一个数字对（子范围）数组。此方法可用于将较大的数字范围划分为更小、更易管理的子范围，用于分页或批处理任务等场景。`pairs` 方法返回一个数组的数组，其中每个内部数组表示一对数字（子范围）：

```php
use Illuminate\Support\Number;

$result = Number::pairs(25, 10);

// [[0, 9], [10, 19], [20, 25]]

$result = Number::pairs(25, 10, offset: 0);

// [[0, 10], [10, 20], [20, 25]]
```

#### `Number::parse()` {.collection-method}

`Number::parse` 方法使用 PHP 的 `NumberFormatter` 解析本地化的数字字符串：

```php
use Illuminate\Support\Number;

$result = Number::parse('10,123', locale: 'en');

// 10123.0

$result = Number::parse('10,123', locale: 'fr');

// 10.123
```

#### `Number::parseInt()` {.collection-method}

`Number::parseInt` 方法根据指定的语言环境将字符串解析为整数：

```php
use Illuminate\Support\Number;

$result = Number::parseInt('10.123');

// (int) 10

$result = Number::parseInt('10,123', locale: 'fr');

// (int) 10
```

#### `Number::parseFloat()` {.collection-method}

`Number::parseFloat` 方法根据指定的语言环境将字符串解析为浮点数：

```php
use Illuminate\Support\Number;

$result = Number::parseFloat('10');

// (float) 10.0

$result = Number::parseFloat('10', locale: 'fr');

// (float) 10.0
```

#### `Number::percentage()` {.collection-method}

`Number::percentage` 方法将给定值的百分比表示形式作为字符串返回：

```php
use Illuminate\Support\Number;

$percentage = Number::percentage(10);

// 10%

$percentage = Number::percentage(10, precision: 2);

// 10.00%

$percentage = Number::percentage(10.123, maxPrecision: 2);

// 10.12%

$percentage = Number::percentage(10, precision: 2, locale: 'de');

// 10,00%
```

#### `Number::spell()` {.collection-method}

`Number::spell` 方法将给定数字转换为单词字符串：

```php
use Illuminate\Support\Number;

$number = Number::spell(102);

// one hundred and two

$number = Number::spell(88, locale: 'fr');

// quatre-vingt-huit
```

`after` 参数允许你指定一个值，在该值之后所有数字都应被拼写出来：

```php
$number = Number::spell(10, after: 10);

// 10

$number = Number::spell(11, after: 10);

// eleven
```

`until` 参数允许你指定一个值，在该值之前所有数字都应被拼写出来：

```php
$number = Number::spell(5, until: 10);

// five

$number = Number::spell(10, until: 10);

// 10
```

#### `Number::spellOrdinal()` {.collection-method}

`Number::spellOrdinal` 方法将数字的序数表示形式作为单词字符串返回：

```php
use Illuminate\Support\Number;

$number = Number::spellOrdinal(1);

// first

$number = Number::spellOrdinal(2);

// second

$number = Number::spellOrdinal(21);

// twenty-first
```

#### `Number::trim()` {.collection-method}

`Number::trim` 方法移除给定数字小数点后的任何尾随零数字：

```php
use Illuminate\Support\Number;

$number = Number::trim(12.0);

// 12

$number = Number::trim(12.30);

// 12.3
```

#### `Number::useLocale()` {.collection-method}

`Number::useLocale` 方法全局设置默认的数字语言环境，这会影响后续对 `Number` 类方法的调用如何格式化数字和货币：

```php
use Illuminate\Support\Number;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Number::useLocale('de');
}
```

#### `Number::withLocale()` {.collection-method}

`Number::withLocale` 方法使用指定的语言环境执行给定的闭包，然后在回调执行后恢复原始语言环境：

```php
use Illuminate\Support\Number;

$number = Number::withLocale('de', function () {
    return Number::format(1500);
});
```

#### `Number::useCurrency()` {.collection-method}

`Number::useCurrency` 方法全局设置默认的数字货币，这会影响后续对 `Number` 类方法的调用如何格式化货币：

```php
use Illuminate\Support\Number;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Number::useCurrency('GBP');
}
```

#### `Number::withCurrency()` {.collection-method}

`Number::withCurrency` 方法使用指定的货币执行给定的闭包，然后在回调执行后恢复原始货币：

```php
use Illuminate\Support\Number;

$number = Number::withCurrency('GBP', function () {
    // ...
});
```

## 路径

#### `app_path()` {.collection-method}

`app_path` 函数返回你的应用程序的 `app` 目录的完全限定路径。你还可以使用 `app_path` 函数生成相对于应用程序目录的文件的完全限定路径：

```php
$path = app_path();

$path = app_path('Http/Controllers/Controller.php');
```

#### `base_path()` {.collection-method}

`base_path` 函数返回你的应用程序的根目录的完全限定路径。你还可以使用 `base_path` 函数生成相对于项目根目录的给定文件的完全限定路径：

```php
$path = base_path();

$path = base_path('vendor/bin');
```

#### `config_path()` {.collection-method}

`config_path` 函数返回你的应用程序的 `config` 目录的完全限定路径。你还可以使用 `config_path` 函数生成应用程序配置目录中给定文件的完全限定路径：

```php
$path = config_path();

$path = config_path('app.php');
```

#### `database_path()` {.collection-method}

`database_path` 函数返回你的应用程序的 `database` 目录的完全限定路径。你还可以使用 `database_path` 函数生成数据库目录中给定文件的完全限定路径：

```php
$path = database_path();

$path = database_path('factories/UserFactory.php');
```

#### `lang_path()` {.collection-method}

`lang_path` 函数返回你的应用程序的 `lang` 目录的完全限定路径。你还可以使用 `lang_path` 函数生成目录中给定文件的完全限定路径：

```php
$path = lang_path();

$path = lang_path('en/messages.php');
```

> [!NOTE]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，你可以通过 `lang:publish` Artisan 命令发布它们。

#### `public_path()` {.collection-method}

`public_path` 函数返回你的应用程序的 `public` 目录的完全限定路径。你还可以使用 `public_path` 函数生成公共目录中给定文件的完全限定路径：

```php
$path = public_path();

$path = public_path('css/app.css');
```

#### `resource_path()` {.collection-method}

`resource_path` 函数返回你的应用程序的 `resources` 目录的完全限定路径。你还可以使用 `resource_path` 函数生成资源目录中给定文件的完全限定路径：

```php
$path = resource_path();

$path = resource_path('sass/app.scss');
```

#### `storage_path()` {.collection-method}

`storage_path` 函数返回你的应用程序的 `storage` 目录的完全限定路径。你还可以使用 `storage_path` 函数生成存储目录中给定文件的完全限定路径：

```php
$path = storage_path();

$path = storage_path('app/file.txt');
```

## URL

#### `action()` {.collection-method}

`action` 函数为给定的控制器操作生成 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果该方法接受路由参数，你可以将它们作为第二个参数传递给该方法：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

#### `asset()` {.collection-method}

`asset` 函数使用请求的当前 scheme（HTTP 或 HTTPS）为资源生成 URL：

```php
$url = asset('img/photo.jpg');
```

你可以通过在 `.env` 文件中设置 `ASSET_URL` 变量来配置资源 URL 主机。如果你将资源托管在 Amazon S3 或其他 CDN 等外部服务上，这可能很有用：

```php
// ASSET_URL=http://example.com/assets

$url = asset('img/photo.jpg'); // http://example.com/assets/img/photo.jpg
```

#### `route()` {.collection-method}

`route` 函数为给定的 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html) 生成 URL：

```php
$url = route('route.name');
```

如果路由接受参数，你可以将它们作为第二个参数传递给该函数：

```php
$url = route('route.name', ['id' => 1]);
```

默认情况下，`route` 函数生成绝对 URL。如果你希望生成相对 URL，你可以将 `false` 作为第三个参数传递给该函数：

```php
$url = route('route.name', ['id' => 1], false);
```

#### `secure_asset()` {.collection-method}

`secure_asset` 函数使用 HTTPS 为资源生成 URL：

```php
$url = secure_asset('img/photo.jpg');
```

#### `secure_url()` {.collection-method}

`secure_url` 函数为给定路径生成完全限定的 HTTPS URL。额外的 URL 段可以在该函数的第二个参数中传递：

```php
$url = secure_url('user/profile');

$url = secure_url('user/profile', [1]);
```

#### `to_action()` {.collection-method}

`to_action` 函数为给定的控制器操作生成一个 [重定向 HTTP 响应](/topic/Laravel%2013.x/2qvpxqz93m.html)：

```php
use App\Http\Controllers\UserController;

return to_action([UserController::class, 'show'], ['user' => 1]);
```

如有必要，你可以将应分配给重定向的 HTTP 状态码以及任何额外的响应头作为 `to_action` 方法的第三个和第四个参数传递：

```php
return to_action(
    [UserController::class, 'show'],
    ['user' => 1],
    302,
    ['X-Framework' => 'Laravel']
);
```

#### `to_route()` {.collection-method}

`to_route` 函数为给定的 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html) 生成一个 [重定向 HTTP 响应](/topic/Laravel%2013.x/2qvpxqz93m.html)：

```php
return to_route('users.show', ['user' => 1]);
```

如有必要，你可以将应分配给重定向的 HTTP 状态码以及任何额外的响应头作为 `to_route` 方法的第三个和第四个参数传递：

```php
return to_route('users.show', ['user' => 1], 302, ['X-Framework' => 'Laravel']);
```

#### `uri()` {.collection-method}

`uri` 函数为给定的 URI 生成一个 流畅的 URI 实例：

```php
$uri = uri('https://example.com')
    ->withPath('/users')
    ->withQuery(['page' => 1]);
```

如果给 `uri` 函数一个包含可调用控制器和方法对的数组，该函数将为控制器方法的路由路径创建一个 `Uri` 实例：

```php
use App\Http\Controllers\UserController;

$uri = uri([UserController::class, 'show'], ['user' => $user]);
```

如果控制器是可调用的，你可以简单地提供控制器类名：

```php
use App\Http\Controllers\UserIndexController;

$uri = uri(UserIndexController::class);
```

如果给 `uri` 函数的值与 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html) 的名称匹配，将为该路由的路径生成一个 `Uri` 实例：

```php
$uri = uri('users.show', ['user' => $user]);
```

#### `url()` {.collection-method}

`url` 函数为给定路径生成完全限定的 URL：

```php
$url = url('user/profile');

$url = url('user/profile', [1]);
```

如果没有提供路径，将返回一个 `Illuminate\Routing\UrlGenerator` 实例：

```php
$current = url()->current();

$full = url()->full();

$previous = url()->previous();
```

有关使用 `url` 函数的更多信息，请查阅 [URL 生成文档](/topic/Laravel%2013.x/3oyjdkxyp5.html)。

## 杂项

#### `abort()` {.collection-method}

`abort` 函数抛出 [一个 HTTP 异常](/topic/Laravel%2013.x/xq9zrzjvdo.html)，该异常将由 [异常处理器](/topic/Laravel%2013.x/xq9zrzjvdo.html) 渲染：

```php
abort(403);
```

你还可以提供异常的消息以及应发送到浏览器的自定义 HTTP 响应头：

```php
abort(403, 'Unauthorized.', $headers);
```

#### `abort_if()` {.collection-method}

如果给定布尔表达式求值为 `true`，`abort_if` 函数会抛出 HTTP 异常：

```php
abort_if(! Auth::user()->isAdmin(), 403);
```

与 `abort` 方法一样，你还可以将异常的响应文本作为第三个参数，以及将自定义响应头数组作为第四个参数传递给该函数。

#### `abort_unless()` {.collection-method}

如果给定布尔表达式求值为 `false`，`abort_unless` 函数会抛出 HTTP 异常：

```php
abort_unless(Auth::user()->isAdmin(), 403);
```

与 `abort` 方法一样，你还可以将异常的响应文本作为第三个参数，以及将自定义响应头数组作为第四个参数传递给该函数。

#### `app()` {.collection-method}

`app` 函数返回 [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 实例：

```php
$container = app();
```

你可以传递类名或接口名以从容器中解析它：

```php
$api = app('HelpSpot\API');
```

#### `auth()` {.collection-method}

`auth` 函数返回一个 [认证器](/topic/Laravel%2013.x/xq9zrgjvdo.html) 实例。你可以将它用作 `Auth` 门面的替代品：

```php
$user = auth()->user();
```

如果需要，你可以指定你想要访问的 guard 实例：

```php
$user = auth('admin')->user();
```

#### `back()` {.collection-method}

`back` 函数生成一个到用户先前位置的 [重定向 HTTP 响应](/topic/Laravel%2013.x/2qvpxqz93m.html)：

```php
return back($status = 302, $headers = [], $fallback = '/');

return back();
```

#### `bcrypt()` {.collection-method}

`bcrypt` 函数使用 Bcrypt [哈希](/topic/Laravel%2013.x/5dve2d3v4x.html) 给定值。你可以将此函数用作 `Hash` 门面的替代品：

```php
$password = bcrypt('my-secret-password');
```

#### `blank()` {.collection-method}

`blank` 函数确定给定值是否为"空白"：

```php
blank('');
blank('   ');
blank(null);
blank(collect());

// true

blank(0);
blank(true);
blank(false);

// false
```

对于 `blank` 的反向操作，请参见 filled 函数。

#### `broadcast()` {.collection-method}

`broadcast` 函数将给定的 [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html) [广播](/topic/Laravel%2013.x/enyd5w197d.html) 到其监听器：

```php
broadcast(new UserRegistered($user));

broadcast(new UserRegistered($user))->toOthers();
```

#### `broadcast_if()` {.collection-method}

如果给定布尔表达式求值为 `true`，`broadcast_if` 函数将给定的 [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html) [广播](/topic/Laravel%2013.x/enyd5w197d.html) 到其监听器：

```php
broadcast_if($user->isActive(), new UserRegistered($user));

broadcast_if($user->isActive(), new UserRegistered($user))->toOthers();
```

#### `broadcast_unless()` {.collection-method}

如果给定布尔表达式求值为 `false`，`broadcast_unless` 函数将给定的 [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html) [广播](/topic/Laravel%2013.x/enyd5w197d.html) 到其监听器：

```php
broadcast_unless($user->isBanned(), new UserRegistered($user));

broadcast_unless($user->isBanned(), new UserRegistered($user))->toOthers();
```

#### `cache()` {.collection-method}

`cache` 函数可用于从 [缓存](/topic/Laravel%2013.x/5dve2w3v4x.html) 中获取值。如果给定的键不存在于缓存中，将返回一个可选的默认值：

```php
$value = cache('key');

$value = cache('key', 'default');
```

你可以通过将键 / 值对数组传递给该函数来向缓存中添加项。你还应该传递缓存值应被视为有效的秒数或持续时间：

```php
cache(['key' => 'value'], 300);

cache(['key' => 'value'], now()->plus(seconds: 10));
```

#### `class_uses_recursive()` {.collection-method}

`class_uses_recursive` 函数返回类使用的所有 trait，包括其所有父类使用的 trait：

```php
$traits = class_uses_recursive(App\Models\User::class);
```

#### `collect()` {.collection-method}

`collect` 函数从给定值创建一个 [集合](/topic/Laravel%2013.x/4rvgn63ydj.html) 实例：

```php
$collection = collect(['Taylor', 'Abigail']);
```

#### `config()` {.collection-method}

`config` 函数获取 [配置](/topic/Laravel%2013.x/3dykqpoyl0.html) 变量的值。配置值可以使用"点"语法访问，该语法包括文件名和你希望访问的选项。你还可以提供一个默认值，如果配置选项不存在，将返回该默认值：

```php
$value = config('app.timezone');

$value = config('app.timezone', $default);
```

你可以通过传递键 / 值对数组在运行时设置配置变量。但是，请注意，此函数只影响当前请求的配置值，不会更新你的实际配置值：

```php
config(['app.debug' => true]);
```

#### `context()` {.collection-method}

`context` 函数从当前 [上下文](/topic/Laravel%2013.x/xpv527gv86.html) 中获取值。你还可以提供一个默认值，如果上下文键不存在，将返回该默认值：

```php
$value = context('trace_id');

$value = context('trace_id', $default);
```

你可以通过传递键 / 值对数组来设置上下文值：

```php
use Illuminate\Support\Str;

context(['trace_id' => Str::uuid()->toString()]);
```

#### `cookie()` {.collection-method}

`cookie` 函数创建一个新的 [Cookie](/topic/Laravel%2013.x/2ky040l9z8.html) 实例：

```php
$cookie = cookie('name', 'value', $minutes);
```

#### `csrf_field()` {.collection-method}

`csrf_field` 函数生成一个包含 CSRF 令牌值的 HTML `hidden` 输入字段。例如，使用 [Blade 语法](/topic/Laravel%2013.x/wevwmrz9l2.html)：

```blade
{{ csrf_field() }}
```

#### `csrf_token()` {.collection-method}

`csrf_token` 函数检索当前 CSRF 令牌的值：

```php
$token = csrf_token();
```

#### `decrypt()` {.collection-method}

`decrypt` 函数 [解密](/topic/Laravel%2013.x/enyd5k197d.html) 给定值。你可以将此函数用作 `Crypt` 门面的替代品：

```php
$password = decrypt($value);
```

对于 `decrypt` 的反向操作，请参见 encrypt 函数。

#### `dd()` {.collection-method}

`dd` 函数转储给定变量并结束脚本的执行：

```php
dd($value);

dd($value1, $value2, $value3, ...);
```

如果你不想停止脚本的执行，请改用 dump 函数。

#### `dispatch()` {.collection-method}

`dispatch` 函数将给定的 [任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 推送到 Laravel [任务队列](/topic/Laravel%2013.x/wevwmkz9l2.html)：

```php
dispatch(new App\Jobs\SendEmails);
```

#### `dispatch_sync()` {.collection-method}

`dispatch_sync` 函数将给定任务推送到 [sync](/topic/Laravel%2013.x/wevwmkz9l2.html) 队列，以便立即处理：

```php
dispatch_sync(new App\Jobs\SendEmails);
```

#### `dump()` {.collection-method}

`dump` 函数转储给定变量：

```php
dump($value);

dump($value1, $value2, $value3, ...);
```

如果你想在转储变量后停止执行脚本，请改用 dd 函数。

#### `encrypt()` {.collection-method}

`encrypt` 函数 [加密](/topic/Laravel%2013.x/enyd5k197d.html) 给定值。你可以将此函数用作 `Crypt` 门面的替代品：

```php
$secret = encrypt('my-secret-value');
```

对于 `encrypt` 的反向操作，请参见 decrypt 函数。

#### `env()` {.collection-method}

`env` 函数检索 [环境变量](/topic/Laravel%2013.x/3dykqpoyl0.html) 的值或返回默认值：

```php
$env = env('APP_ENV');

$env = env('APP_ENV', 'production');
```

> [!WARNING]
> 如果你在部署过程中执行 `config:cache` 命令，你应该确保你只从你的配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件将不会被加载，所有对 `env` 函数的调用都将返回外部环境变量，例如服务器级或系统级环境变量或 `null`。

#### `event()` {.collection-method}

`event` 函数将给定的 [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html) 分发到其监听器：

```php
event(new UserRegistered($user));
```

#### `fake()` {.collection-method}

`fake` 函数从容器中解析一个 [Faker](https://github.com/FakerPHP/Faker) 单例，这在模型工厂、数据库填充、测试和视图原型设计中创建假数据时可能很有用：

```blade
@for ($i = 0; $i < 10; $i++)
    <dl>
        <dt>Name</dt>
        <dd>{{ fake()->name() }}</dd>

        <dt>Email</dt>
        <dd>{{ fake()->unique()->safeEmail() }}</dd>
    </dl>
@endfor
```

默认情况下，`fake` 函数将利用你的 `config/app.php` 配置中的 `app.faker_locale` 配置选项。通常，此配置选项通过 `APP_FAKER_LOCALE` 环境变量设置。你还可以通过将其传递给 `fake` 函数来指定语言环境。每个语言环境将解析一个单独的单例：

```php
fake('nl_NL')->name()
```

#### `filled()` {.collection-method}

`filled` 函数确定给定值是否不是"空白"：

```php
filled(0);
filled(true);
filled(false);

// true

filled('');
filled('   ');
filled(null);
filled(collect());

// false
```

对于 `filled` 的反向操作，请参见 blank 函数。

#### `info()` {.collection-method}

`info` 函数将信息写入你的应用程序的 [日志](/topic/Laravel%2013.x/2wy3l33ykm.html)：

```php
info('Some helpful information!');
```

还可以将上下文数据数组传递给该函数：

```php
info('User login attempt failed.', ['id' => $user->id]);
```

#### `literal()` {.collection-method}

`literal` 函数使用给定的命名参数作为属性创建一个新的 [stdClass](https://www.php.net/manual/en/class.stdclass.php) 实例：

```php
$obj = literal(
    name: 'Joe',
    languages: ['PHP', 'Ruby'],
);

$obj->name; // 'Joe'
$obj->languages; // ['PHP', 'Ruby']
```

#### `logger()` {.collection-method}

`logger` 函数可用于将 `debug` 级别的消息写入 [日志](/topic/Laravel%2013.x/2wy3l33ykm.html)：

```php
logger('Debug message');
```

还可以将上下文数据数组传递给该函数：

```php
logger('User has logged in.', ['id' => $user->id]);
```

如果没有值传递给该函数，将返回一个 [logger](/topic/Laravel%2013.x/2wy3l33ykm.html) 实例：

```php
logger()->error('You are not allowed here.');
```

#### `method_field()` {.collection-method}

`method_field` 函数生成一个 HTML `hidden` 输入字段，包含表单的 HTTP 动词的伪装值。例如，使用 [Blade 语法](/topic/Laravel%2013.x/wevwmrz9l2.html)：

```blade
<form method="POST">
    {{ method_field('DELETE') }}
</form>
```

#### `now()` {.collection-method}

`now` 函数为当前时间创建一个新的 `Illuminate\Support\Carbon` 实例：

```php
$now = now();
```

#### `old()` {.collection-method}

`old` 函数 [检索](/topic/Laravel%2013.x/2ky040l9z8.html) 一个被闪存到会话中的 [旧输入](/topic/Laravel%2013.x/2ky040l9z8.html) 值：

```php
$value = old('value');

$value = old('value', 'default');
```

由于作为第二个参数提供给 `old` 函数的"默认值"通常是 Eloquent 模型的属性，Laravel 允许你简单地将整个 Eloquent 模型作为第二个参数传递给 `old` 函数。这样做时，Laravel 会假定提供给 `old` 函数的第一个参数是应被视为"默认值"的 Eloquent 属性名称：

```blade
{{ old('name', $user->name) }}

// 等价于...

{{ old('name', $user) }}
```

#### `once()` {.collection-method}

`once` 函数执行给定的回调并将结果缓存在内存中，持续到请求结束。任何后续使用相同回调对 `once` 函数的调用都将返回先前缓存的结果：

```php
function random(): int
{
    return once(function () {
        return random_int(1, 1000);
    });
}

random(); // 123
random(); // 123（缓存的结果）
random(); // 123（缓存的结果）
```

当 `once` 函数从对象实例内执行时，缓存的结果将对该对象实例唯一：

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
$service->all(); //（缓存的结果）

$secondService = new NumberService;

$secondService->all();
$secondService->all(); //（缓存的结果）
```
#### `optional()` {.collection-method}

`optional` 函数接受任意参数，并允许你访问该对象上的属性或调用方法。如果给定对象为 `null`，属性和方法将返回 `null` 而不是导致错误：

```php
return optional($user->address)->street;

{!! old('name', optional($user)->name) !!}
```

`optional` 函数还接受一个闭包作为其第二个参数。如果作为第一个参数提供的值不为 null，则闭包将被调用：

```php
return optional(User::find($id), function (User $user) {
    return $user->name;
});
```

#### `policy()` {.collection-method}

`policy` 方法为给定类检索一个 [策略](/topic/Laravel%2013.x/2wy3l43ykm.html) 实例：

```php
$policy = policy(App\Models\User::class);
```

#### `redirect()` {.collection-method}

`redirect` 函数返回一个 [重定向 HTTP 响应](/topic/Laravel%2013.x/2qvpxqz93m.html)，或者如果调用时没有参数，则返回重定向器实例：

```php
return redirect($to = null, $status = 302, $headers = [], $secure = null);

return redirect('/home');

return redirect()->route('route.name');
```

#### `report()` {.collection-method}

`report` 函数将使用你的 [异常处理器](/topic/Laravel%2013.x/xq9zrzjvdo.html) 报告异常：

```php
report($e);
```

`report` 函数还接受字符串作为参数。当给该函数一个字符串时，该函数将创建一个以给定字符串作为其消息的异常：

```php
report('Something went wrong.');
```

#### `report_if()` {.collection-method}

如果给定布尔表达式求值为 `true`，`report_if` 函数将使用你的 [异常处理器](/topic/Laravel%2013.x/xq9zrzjvdo.html) 报告异常：

```php
report_if($shouldReport, $e);

report_if($shouldReport, 'Something went wrong.');
```

#### `report_unless()` {.collection-method}

如果给定布尔表达式求值为 `false`，`report_unless` 函数将使用你的 [异常处理器](/topic/Laravel%2013.x/xq9zrzjvdo.html) 报告异常：

```php
report_unless($reportingDisabled, $e);

report_unless($reportingDisabled, 'Something went wrong.');
```

#### `request()` {.collection-method}

`request` 函数返回当前的 [请求](/topic/Laravel%2013.x/2ky040l9z8.html) 实例，或从当前请求中获取输入字段的值：

```php
$request = request();

$value = request('key', $default);
```

#### `rescue()` {.collection-method}

`rescue` 函数执行给定的闭包并捕获其执行期间发生的任何异常。所有捕获的异常都将发送到你的 [异常处理器](/topic/Laravel%2013.x/xq9zrzjvdo.html)；但是，请求将继续处理：

```php
return rescue(function () {
    return $this->method();
});
```

你还可以向 `rescue` 函数传递第二个参数。此参数将是执行闭包时发生异常应返回的"默认"值：

```php
return rescue(function () {
    return $this->method();
}, false);

return rescue(function () {
    return $this->method();
}, function () {
    return $this->failure();
});
```

可以向 `rescue` 函数提供一个 `report` 参数来确定是否应通过 `report` 函数报告异常：

```php
return rescue(function () {
    return $this->method();
}, report: function (Throwable $throwable) {
    return $throwable instanceof InvalidArgumentException;
});
```

#### `resolve()` {.collection-method}

`resolve` 函数使用 [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 将给定的类名或接口名解析为实例：

```php
$api = resolve('HelpSpot\API');
```

#### `response()` {.collection-method}

`response` 函数创建一个 [响应](/topic/Laravel%2013.x/2qvpxqz93m.html) 实例或获取响应工厂的实例：

```php
return response('Hello World', 200, $headers);

return response()->json(['foo' => 'bar'], 200, $headers);
```

#### `retry()` {.collection-method}

`retry` 函数尝试执行给定的回调，直到达到给定的最大尝试阈值。如果回调没有抛出异常，将返回其返回值。如果回调抛出异常，它将自动重试。如果超过最大尝试次数，将抛出异常：

```php
return retry(5, function () {
    // 尝试 5 次，每次尝试之间休息 100ms...
}, 100);
```

休眠时长还接受 `CarbonInterval` 实例：

```php
use function Illuminate\Support\seconds;

return retry(5, function () {
    // 尝试 5 次，每次尝试之间休息 5 秒...
}, seconds(5));
```

如果你想手动计算尝试之间要休眠的毫秒数，你可以将闭包作为第三个参数传递给 `retry` 函数：

```php
use Exception;

return retry(5, function () {
    // ...
}, function (int $attempt, Exception $exception) {
    return $attempt * 100;
});
```

为方便起见，你可以将数组作为第一个参数提供给 `retry` 函数。此数组将用于确定后续尝试之间要休眠多少毫秒：

```php
return retry([100, 200], function () {
    // 第一次重试休眠 100ms，第二次重试休眠 200ms...
});
```

要仅在特定条件下重试，你可以将闭包作为第四个参数传递给 `retry` 函数：

```php
use App\Exceptions\TemporaryException;
use Exception;

return retry(5, function () {
    // ...
}, 100, function (Exception $exception) {
    return $exception instanceof TemporaryException;
});
```

#### `session()` {.collection-method}

`session` 函数可用于获取或设置 [会话](/topic/Laravel%2013.x/2ev86noyor.html) 值：

```php
$value = session('key');
```

你可以通过将键 / 值对数组传递给该函数来设置值：

```php
session(['chairs' => 7, 'instruments' => 3]);
```

如果没有值传递给该函数，将返回会话存储：

```php
$value = session()->get('key');

session()->put('key', $value);
```

#### `tap()` {.collection-method}

`tap` 函数接受两个参数：一个任意的 `$value` 和一个闭包。`$value` 将被传递给闭包，然后由 `tap` 函数返回。闭包的返回值无关紧要：

```php
$user = tap(User::first(), function (User $user) {
    $user->name = 'Taylor';

    $user->save();
});
```

如果没有闭包传递给 `tap` 函数，你可以调用给定 `$value` 上的任何方法。你调用的方法的返回值将始终是 `$value`，无论该方法在其定义中实际返回什么。例如，Eloquent `update` 方法通常返回一个整数。但是，我们可以通过将 `update` 方法调用链接到 `tap` 函数来强制该方法返回模型本身：

```php
$user = tap($user)->update([
    'name' => $name,
    'email' => $email,
]);
```

要向类添加 `tap` 方法，你可以将 `Illuminate\Support\Traits\Tappable` trait 添加到该类。此 trait 的 `tap` 方法接受一个 Closure 作为其唯一参数。对象实例本身将被传递给 Closure，然后由 `tap` 方法返回：

```php
return $user->tap(function (User $user) {
    // ...
});
```

#### `throw_if()` {.collection-method}

如果给定布尔表达式求值为 `true`，`throw_if` 函数会抛出给定的异常：

```php
throw_if(! Auth::user()->isAdmin(), AuthorizationException::class);

throw_if(
    ! Auth::user()->isAdmin(),
    AuthorizationException::class,
    'You are not allowed to access this page.'
);
```

#### `throw_unless()` {.collection-method}

如果给定布尔表达式求值为 `false`，`throw_unless` 函数会抛出给定的异常：

```php
throw_unless(Auth::user()->isAdmin(), AuthorizationException::class);

throw_unless(
    Auth::user()->isAdmin(),
    AuthorizationException::class,
    'You are not allowed to access this page.'
);
```

#### `today()` {.collection-method}

`today` 函数为当前日期创建一个新的 `Illuminate\Support\Carbon` 实例：

```php
$today = today();
```

#### `trait_uses_recursive()` {.collection-method}

`trait_uses_recursive` 函数返回 trait 使用的所有 trait：

```php
$traits = trait_uses_recursive(\Illuminate\Notifications\Notifiable::class);
```

#### `transform()` {.collection-method}

`transform` 函数在给定值不为 空白 时对该值执行闭包，然后返回闭包的返回值：

```php
$callback = function (int $value) {
    return $value * 2;
};

$result = transform(5, $callback);

// 10
```

可以将默认值或闭包作为第三个参数传递给该函数。如果给定值为空白，将返回此值：

```php
$result = transform(null, $callback, 'The value is blank');

// The value is blank
```

#### `validator()` {.collection-method}

`validator` 函数使用给定的参数创建一个新的 [验证器](/topic/Laravel%2013.x/e296oew9q7.html) 实例。你可以将它用作 `Validator` 门面的替代品：

```php
$validator = validator($data, $rules, $messages);
```

#### `value()` {.collection-method}

`value` 函数返回它所给定的值。但是，如果你将闭包传递给该函数，闭包将被执行，其返回值将被返回：

```php
$result = value(true);

// true

$result = value(function () {
    return false;
});

// false
```

可以向 `value` 函数传递额外的参数。如果第一个参数是闭包，则额外的参数将作为参数传递给闭包，否则它们将被忽略：

```php
$result = value(function (string $name) {
    return $name;
}, 'Taylor');

// 'Taylor'
```

#### `view()` {.collection-method}

`view` 函数检索一个 [视图](/topic/Laravel%2013.x/m892gz6y01.html) 实例：

```php
return view('auth.login');
```

#### `with()` {.collection-method}

`with` 函数返回它所给定的值。如果闭包作为第二个参数传递给该函数，闭包将被执行，其返回值将被返回：

```php
$callback = function (mixed $value) {
    return is_numeric($value) ? $value * 2 : 0;
};

$result = with(5, $callback);

// 10

$result = with(null, $callback);

// 0

$result = with(5, null);

// 5
```

#### `when()` {.collection-method}

如果给定条件求值为 `true`，`when` 函数返回它所给定的值。否则，返回 `null`。如果闭包作为第二个参数传递给该函数，闭包将被执行，其返回值将被返回：

```php
$value = when(true, 'Hello World');

$value = when(true, fn () => 'Hello World');
```

`when` 函数主要用于有条件地渲染 HTML 属性：

```blade
<div {!! when($condition, 'wire:poll="calculate"') !!}>
    ...
</div>
```

## 其他实用工具

### 基准测试

有时你可能希望快速测试应用程序某些部分的性能。在这些情况下，你可以利用 `Benchmark` 支持类来测量给定回调完成所需的毫秒数：

```php
<?php

use App\Models\User;
use Illuminate\Support\Benchmark;

Benchmark::dd(fn () => User::find(1)); // 0.1 ms

Benchmark::dd([
    'Scenario 1' => fn () => User::count(), // 0.5 ms
    'Scenario 2' => fn () => User::all()->count(), // 20.0 ms
]);
```

默认情况下，给定的回调将执行一次（一次迭代），其持续时间将显示在浏览器 / 控制台中。

要多次调用回调，你可以将回调应被调用的迭代次数指定为该方法的第二个参数。当多次执行回调时，`Benchmark` 类将返回在所有迭代中执行回调所需的平均毫秒数：

```php
Benchmark::dd(fn () => User::count(), iterations: 10); // 0.5 ms
```

有时，你可能希望在仍然获得回调返回值的同时对回调的执行进行基准测试。`value` 方法将返回一个包含回调返回值和执行回调所需的毫秒数的元组：

```php
[$count, $duration] = Benchmark::value(fn () => User::count());
```

### 日期和时间

Laravel 包含 [Carbon](https://carbon.nesbot.com/guide/getting-started/introduction.html)，一个强大的日期和时间操作库。要创建新的 `Carbon` 实例，你可以调用 `now` 函数。此函数在你的 Laravel 应用程序中全局可用：

```php
$now = now();
```

或者，你可以使用 `Illuminate\Support\Carbon` 类创建新的 `Carbon` 实例：

```php
use Illuminate\Support\Carbon;

$now = Carbon::now();
```

Laravel 还使用 `plus` 和 `minus` 方法增强了 `Carbon` 实例，允许轻松操作实例的日期和时间：

```php
return now()->plus(minutes: 5);
return now()->plus(hours: 8);
return now()->plus(weeks: 4);

return now()->minus(minutes: 5);
return now()->minus(hours: 8);
return now()->minus(weeks: 4);
```

有关 Carbon 及其功能的全面讨论，请查阅 [官方 Carbon 文档](https://carbon.nesbot.com/guide/getting-started/introduction.html)。

#### 区间函数

Laravel 还提供 `milliseconds`、`seconds`、`minutes`、`hours`、`days`、`weeks`、`months` 和 `years` 函数，它们返回 `CarbonInterval` 实例，这些实例扩展了 PHP 的 [DateInterval](https://www.php.net/manual/en/class.dateinterval.php) 类。这些函数可用于 Laravel 接受 `DateInterval` 实例的任何地方：

```php
use Illuminate\Support\Facades\Cache;

use function Illuminate\Support\{minutes};

Cache::put('metrics', $metrics, minutes(10));
```

### 延迟函数

虽然 Laravel 的 [队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html) 允许你将任务排队以进行后台处理，但有时你可能有一些简单的任务希望延迟执行，而不需要配置或维护一个长时间运行的队列工作进程。

延迟函数允许你将闭包的执行延迟到 HTTP 响应发送给用户之后，从而保持你的应用程序感觉快速和响应迅速。要延迟执行闭包，只需将闭包传递给 `Illuminate\Support\defer` 函数：

```php
use App\Services\Metrics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use function Illuminate\Support\defer;

Route::post('/orders', function (Request $request) {
    // 创建订单...

    defer(fn () => Metrics::reportOrder($order));

    return $order;
});
```

默认情况下，延迟函数只有在调用 `Illuminate\Support\defer` 的 HTTP 响应、Artisan 命令或队列任务成功完成时才会执行。这意味着如果请求导致 `4xx` 或 `5xx` HTTP 响应，延迟函数将不会执行。如果你希望延迟函数始终执行，你可以将 `always` 方法链接到你的延迟函数上：

```php
defer(fn () => Metrics::reportOrder($order))->always();
```

> [!WARNING]
> 如果你安装了 [Swoole PHP 扩展](https://www.php.net/manual/en/book.swoole.php)，Laravel 的 `defer` 函数可能会与 Swoole 自己的全局 `defer` 函数冲突，导致 Web 服务器错误。请确保通过显式命名空间调用 Laravel 的 `defer` 辅助函数：`use function Illuminate\Support\defer;`

#### 取消延迟函数

如果你需要在延迟函数执行之前取消它，你可以使用 `forget` 方法按名称取消该函数。要命名延迟函数，请向 `Illuminate\Support\defer` 函数提供第二个参数：

```php
defer(fn () => Metrics::report(), 'reportMetrics');

defer()->forget('reportMetrics');
```

#### 在测试中禁用延迟函数

编写测试时，禁用延迟函数可能会有用。你可以在测试中调用 `withoutDefer` 来指示 Laravel 立即调用所有延迟函数：

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

如果你想为测试用例中的所有测试禁用延迟函数，你可以从你的基础 `TestCase` 类的 `setUp` 方法中调用 `withoutDefer` 方法：

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

### 抽奖

Laravel 的 lottery 类可用于根据给定的几率执行回调。当你只想为传入请求的一部分执行代码时，这可能特别有用：

```php
use Illuminate\Support\Lottery;

Lottery::odds(1, 20)
    ->winner(fn () => $user->won())
    ->loser(fn () => $user->lost())
    ->choose();
```

你可以将 Laravel 的 lottery 类与其他 Laravel 功能结合使用。例如，你可能希望只向你的异常处理器报告一小部分慢查询。而且，由于 lottery 类是可调用的，我们可以将类的实例传递给任何接受可调用对象的方法：

```php
use Carbon\CarbonInterval;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Lottery;

DB::whenQueryingForLongerThan(
    CarbonInterval::seconds(2),
    Lottery::odds(1, 100)->winner(fn () => report('Querying > 2 seconds.')),
);
```

#### 测试抽奖

Laravel 提供了一些简单的方法来让你轻松测试应用程序的 lottery 调用：

```php
// 抽奖将总是中奖...
Lottery::alwaysWin();

// 抽奖将总是不中奖...
Lottery::alwaysLose();

// 抽奖将先中奖然后不中奖，最后恢复正常行为...
Lottery::fix([true, false]);

// 抽奖将恢复正常行为...
Lottery::determineResultsNormally();
```

### 管道

Laravel 的 `Pipeline` 门面提供了一种方便的方法，将给定输入"管道"通过一系列可调用的类、闭包或可调用对象，让每个类都有机会检查或修改输入并调用管道中的下一个可调用对象：

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

如你所见，管道中的每个可调用类或闭包都会获得输入和一个 `$next` 闭包。调用 `$next` 闭包将调用管道中的下一个可调用对象。正如你可能已经注意到的，这与 [中间件](/topic/Laravel%2013.x/rwyl2exvz8.html) 非常相似。

当管道中的最后一个可调用对象调用 `$next` 闭包时，将调用提供给 `then` 方法的可调用对象。通常，此可调用对象将简单地返回给定的输入。为方便起见，如果你只希望在处理后返回输入，你可以使用 `thenReturn` 方法。

当然，如前所述，你不限于向管道提供闭包。你还可以提供可调用的类。如果提供了类名，该类将通过 Laravel 的 [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 实例化，从而允许将依赖项注入到可调用类中：

```php
$user = Pipeline::send($user)
    ->through([
        GenerateProfilePhoto::class,
        ActivateSubscription::class,
        SendWelcomeEmail::class,
    ])
    ->thenReturn();
```

可以在管道上调用 `withinTransaction` 方法，以自动将管道的所有步骤包装在单个数据库事务中：

```php
$user = Pipeline::send($user)
    ->withinTransaction()
    ->through([
        ProcessOrder::class,
        TransferFunds::class,
        UpdateInventory::class,
    ])
    ->thenReturn();
```

### 休眠

Laravel 的 `Sleep` 类是 PHP 原生 `sleep` 和 `usleep` 函数的轻量级包装器，提供了更高的可测试性，同时暴露了一个对开发者友好的处理时间的 API：

```php
use Illuminate\Support\Sleep;

$waiting = true;

while ($waiting) {
    Sleep::for(1)->second();

    $waiting = /* ... */;
}
```

`Sleep` 类提供了各种方法，允许你使用不同的时间单位：

```php
// 休眠后返回值...
$result = Sleep::for(1)->second()->then(fn () => 1 + 1);

// 在给定值为 true 时休眠...
Sleep::for(1)->second()->while(fn () => shouldKeepSleeping());

// 暂停执行 90 秒...
Sleep::for(1.5)->minutes();

// 暂停执行 2 秒...
Sleep::for(2)->seconds();

// 暂停执行 500 毫秒...
Sleep::for(500)->milliseconds();

// 暂停执行 5,000 微秒...
Sleep::for(5000)->microseconds();

// 暂停执行直到给定时间...
Sleep::until(now()->plus(minutes: 1));

// PHP 原生 "sleep" 函数的别名...
Sleep::sleep(2);

// PHP 原生 "usleep" 函数的别名...
Sleep::usleep(5000);
```

要轻松组合时间单位，你可以使用 `and` 方法：

```php
Sleep::for(1)->second()->and(10)->milliseconds();
```

#### 测试休眠

在测试利用 `Sleep` 类或 PHP 原生休眠函数的代码时，你的测试将暂停执行。正如你可能预期的那样，这会使你的测试套件明显变慢。例如，假设你正在测试以下代码：

```php
$waiting = /* ... */;

$seconds = 1;

while ($waiting) {
    Sleep::for($seconds++)->seconds();

    $waiting = /* ... */;
}
```

通常，测试此代码将花费 _至少_ 一秒钟。幸运的是，`Sleep` 类允许我们"伪造"休眠，以使我们的测试套件保持快速：

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

在伪造 `Sleep` 类时，实际的执行暂停被绕过，从而大大加快了测试速度。

一旦 `Sleep` 类被伪造，就可以对应该发生的预期"休眠"进行断言。为了说明这一点，让我们假设我们正在测试暂停执行三次的代码，每次暂停增加一秒。使用 `assertSequence` 方法，我们可以断言我们的代码"休眠"了适当的时间，同时保持我们的测试快速：

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

当然，`Sleep` 类还提供了各种其他你可以在测试时使用的断言：

```php
use Carbon\CarbonInterval as Duration;
use Illuminate\Support\Sleep;

// 断言休眠被调用了 3 次...
Sleep::assertSleptTimes(3);

// 断言休眠的时长...
Sleep::assertSlept(function (Duration $duration): bool {
    return /* ... */;
}, times: 1);

// 断言 Sleep 类从未被调用...
Sleep::assertNeverSlept();

// 断言即使调用了 Sleep，也没有发生执行暂停...
Sleep::assertInsomniac();
```

有时在每次发生伪造休眠时执行某个操作可能会很有用。要实现这一点，你可以向 `whenFakingSleep` 方法提供一个回调。在下面的示例中，我们使用 Laravel 的 [时间操作辅助函数](/topic/Laravel%2013.x/5dve2r3v4x.html) 来按每次休眠的时长立即推进时间：

```php
use Carbon\CarbonInterval as Duration;

$this->freezeTime();

Sleep::fake();

Sleep::whenFakingSleep(function (Duration $duration) {
    // 在伪造休眠时推进时间...
    $this->travel($duration->totalMilliseconds)->milliseconds();
});
```

由于推进时间是一个常见需求，`fake` 方法接受一个 `syncWithCarbon` 参数，以在测试中休眠时保持 Carbon 同步：

```php
Sleep::fake(syncWithCarbon: true);

$start = now();

Sleep::for(1)->second();

$start->diffForHumans(); // 1 秒前
```

每当 Laravel 暂停执行时，它都会在内部使用 `Sleep` 类。例如，retry 辅助函数在休眠时使用 `Sleep` 类，从而在使用该辅助函数时提高可测试性。

### 时间盒

Laravel 的 `Timebox` 类确保给定的回调始终花费固定的时间量来执行，即使其实际执行提前完成。这对于加密操作和用户认证检查特别有用，攻击者可能会利用执行时间的变化来推断敏感信息。

如果执行超过固定时长，`Timebox` 没有效果。由开发者选择足够长的固定时长作为时间，以应对最坏情况。

`call` 方法接受一个闭包和一个以微秒为单位的时间限制，然后执行闭包并等待直到达到时间限制：

```php
use Illuminate\Support\Timebox;

(new Timebox)->call(function ($timebox) {
    // ...
}, microseconds: 10000);
```

如果在闭包内抛出异常，此类将遵守定义的延迟，并在延迟后重新抛出异常。

### URI

Laravel 的 `Uri` 类为创建和操作 URI 提供了一个方便且流畅的接口。此类包装了底层 League URI 包提供的功能，并与 Laravel 的路由系统无缝集成。

你可以使用静态方法轻松创建 `Uri` 实例：

```php
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvokableController;
use Illuminate\Support\Uri;

// 从给定字符串生成 URI 实例...
$uri = Uri::of('https://example.com/path');

// 生成指向路径、命名路由或控制器操作的 URI 实例...
$uri = Uri::to('/dashboard');
$uri = Uri::route('users.show', ['user' => 1]);
$uri = Uri::signedRoute('users.show', ['user' => 1]);
$uri = Uri::temporarySignedRoute('user.index', now()->plus(minutes: 5));
$uri = Uri::action([UserController::class, 'index']);
$uri = Uri::action(InvokableController::class);

// 从当前请求 URL 生成 URI 实例...
$uri = $request->uri();
```

一旦你有了 URI 实例，你可以流畅地修改它：

```php
$uri = Uri::of('https://example.com')
    ->withScheme('http')
    ->withHost('test.com')
    ->withPort(8000)
    ->withPath('/users')
    ->withQuery(['page' => 2])
    ->withFragment('section-1');
```

#### 检查 URI

`Uri` 类还允许你轻松检查底层 URI 的各个组件：

```php
$scheme = $uri->scheme();
$authority = $uri->authority();
$host = $uri->host();
$port = $uri->port();
$path = $uri->path();
$segments = $uri->pathSegments();
$query = $uri->query();
$fragment = $uri->fragment();
```

#### 操作查询字符串

`Uri` 类提供了几个可用于操作 URI 查询字符串的方法。`withQuery` 方法可用于将其他查询字符串参数合并到现有查询字符串中：

```php
$uri = $uri->withQuery(['sort' => 'name']);
```

`withQueryIfMissing` 方法可用于在给定键尚未存在于查询字符串中时，将其他查询字符串参数合并到现有查询字符串中：

```php
$uri = $uri->withQueryIfMissing(['page' => 1]);
```

`replaceQuery` 方法可用于用新的查询字符串完全替换现有查询字符串：

```php
$uri = $uri->replaceQuery(['page' => 1]);
```

`pushOntoQuery` 方法可用于将其他参数推送到具有数组值的查询字符串参数上：

```php
$uri = $uri->pushOntoQuery('filter', ['active', 'pending']);
```

`withoutQuery` 方法可用于从查询字符串中移除参数：

```php
$uri = $uri->withoutQuery(['page']);
```

#### 从 URI 生成响应

`redirect` 方法可用于生成到给定 URI 的 `RedirectResponse` 实例：

```php
$uri = Uri::of('https://example.com');

return $uri->redirect();
```

或者，你可以简单地从路由或控制器操作返回 `Uri` 实例，这将自动生成到返回的 URI 的重定向响应：

```php
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Uri;

Route::get('/redirect', function () {
    return Uri::to('/index')
        ->withQuery(['sort' => 'name']);
});
```