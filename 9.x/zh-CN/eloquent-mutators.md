# Eloquent：修改器与类型转换

- [简介](#introduction)
- [访问器与修改器](#accessors-and-mutators)
    - [定义访问器](#defining-an-accessor)
    - [定义修改器](#defining-a-mutator)
- [属性类型转换](#attribute-casting)
    - [数组与 JSON 类型转换](#array-and-json-casting)
    - [日期类型转换](#date-casting)
    - [枚举类型转换](#enum-casting)
    - [加密类型转换](#encrypted-casting)
    - [查询时类型转换](#query-time-casting)
- [自定义类型转换](#custom-casts)
    - [值对象类型转换](#value-object-casting)
    - [数组 / JSON 序列化](#array-json-serialization)
    - [入站类型转换](#inbound-casting)
    - [类型转换参数](#cast-parameters)
    - [可转换对象（Castables）](#castables)

<a name="introduction"></a>
## 简介

访问器、修改器和属性类型转换允许你在从模型实例中获取或设置 Eloquent 属性值时对其进行转换。例如，你可能希望使用 [Laravel 加密器](/docs/{{version}}/encryption) 在值存储到数据库时对其进行加密，然后在 Eloquent 模型上访问该属性时自动解密。或者，你可能希望将通过 Eloquent 模型访问的、存储在数据库中的 JSON 字符串转换为数组。

<a name="accessors-and-mutators"></a>
## 访问器与修改器

<a name="defining-an-accessor"></a>
### 定义访问器

访问器在访问 Eloquent 属性值时对其进行转换。要定义访问器，在模型上创建一个 protected 方法来表示可访问的属性。此方法名应与底层模型属性 / 数据库列的"驼峰"表示形式相对应（如适用）。

在本例中，我们将为 `first_name` 属性定义一个访问器。当尝试获取 `first_name` 属性的值时，Eloquent 会自动调用该访问器。所有属性访问器 / 修改器方法必须声明 `Illuminate\Database\Eloquent\Casts\Attribute` 返回类型提示：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取用户的名字。
     *
     * @return \Illuminate\Database\Eloquent\Casts\Attribute
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => ucfirst($value),
        );
    }
}
```

所有访问器方法返回一个 `Attribute` 实例，该实例定义了属性的访问方式，以及（可选的）修改方式。在本例中，我们仅定义了属性的访问方式。为此，我们向 `Attribute` 类构造器提供 `get` 参数。

如你所见，列的原始值会传递给访问器，允许你操作并返回该值。要访问访问器的值，只需在模型实例上访问 `first_name` 属性即可：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> **Note**
> 如果你希望将这些计算值添加到模型的数组 / JSON 表示中，[需要将它们追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。

<a name="building-value-objects-from-multiple-attributes"></a>
#### 从多个属性构建值对象

有时你的访问器可能需要将多个模型属性转换为单个"值对象"。为此，你的 `get` 闭包可以接受第二个参数 `$attributes`，该参数会自动传递给闭包，并包含模型所有当前属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 *
 * @return  \Illuminate\Database\Eloquent\Casts\Attribute
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn ($value, $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    );
}
```

<a name="accessor-caching"></a>
#### 访问器缓存

当从访问器返回值对象时，对值对象所做的任何更改都会在模型保存之前自动同步回模型。这是因为 Eloquent 会保留访问器返回的实例，以便每次调用访问器时都能返回同一实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Line 1 Value';
$user->address->lineTwo = 'Updated Address Line 2 Value';

$user->save();
```

但是，有时你可能希望为字符串和布尔值等原始值启用缓存，特别是在计算开销较大时。为此，可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn ($value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你想禁用属性的对象缓存行为，可以在定义属性时调用 `withoutObjectCaching` 方法：

```php
/**
 * 与用户的地址交互。
 *
 * @return  \Illuminate\Database\Eloquent\Casts\Attribute
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn ($value, $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    )->withoutObjectCaching();
}
```

<a name="defining-a-mutator"></a>
### 定义修改器

修改器在设置 Eloquent 属性值时对其进行转换。要定义修改器，可以在定义属性时提供 `set` 参数。让我们为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，该修改器会被自动调用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 与用户的名字交互。
     *
     * @return \Illuminate\Database\Eloquent\Casts\Attribute
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => ucfirst($value),
            set: fn ($value) => strtolower($value),
        );
    }
}
```

修改器闭包会接收正在设置到属性上的值，允许你操作该值并返回操作后的值。要使用修改器，只需在 Eloquent 模型上设置 `first_name` 属性即可：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在本例中，`set` 回调会以值 `Sally` 被调用。然后修改器会对该名字应用 `strtolower` 函数，并将结果值设置到模型的内部 `$attributes` 数组中。

<a name="mutating-multiple-attributes"></a>
#### 修改多个属性

有时你的修改器可能需要在底层模型上设置多个属性。为此，可以从 `set` 闭包返回一个数组。数组中的每个键应与模型关联的底层属性 / 数据库列相对应：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 *
 * @return  \Illuminate\Database\Eloquent\Casts\Attribute
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn ($value, $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
        set: fn (Address $value) => [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ],
    );
}
```

<a name="attribute-casting"></a>
## 属性类型转换

属性类型转换提供了类似于访问器和修改器的功能，而无需在模型上定义任何额外的方法。取而代之的是，模型的 `$casts` 属性提供了一种便捷的方式，将属性转换为常见的数据类型。

`$casts` 属性应是一个数组，其中键是要进行类型转换的属性名，值是你希望将列转换到的类型。支持的类型转换类型有：

- `array`
- `AsStringable::class`
- `boolean`
- `collection`
- `date`
- `datetime`
- `immutable_date`
- `immutable_datetime`
- <code>decimal:&lt;precision&gt;</code>
- `double`
- `encrypted`
- `encrypted:array`
- `encrypted:collection`
- `encrypted:object`
- `float`
- `integer`
- `object`
- `real`
- `string`
- `timestamp`

为了演示属性类型转换，让我们将数据库中存储为整数（`0` 或 `1`）的 `is_admin` 属性转换为布尔值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 应进行类型转换的属性。
     *
     * @var array
     */
    protected $casts = [
        'is_admin' => 'boolean',
    ];
}
```

定义类型转换后，访问 `is_admin` 属性时将始终转换为布尔值，即使底层值在数据库中存储为整数：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    //
}
```

如果需要在运行时添加新的临时类型转换，可以使用 `mergeCasts` 方法。这些类型转换定义会添加到模型上已定义的任何类型转换中：

```php
$user->mergeCasts([
    'is_admin' => 'integer',
    'options' => 'object',
]);
```

> **Warning**
> 值为 `null` 的属性不会进行类型转换。此外，切勿定义与关联同名的类型转换（或属性）。

<a name="stringable-casting"></a>
#### Stringable 类型转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 类型转换类将模型属性转换为[流式 `Illuminate\Support\Stringable` 对象](/docs/{{version}}/helpers#fluent-strings-method-list)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 应进行类型转换的属性。
     *
     * @var array
     */
    protected $casts = [
        'directory' => AsStringable::class,
    ];
}
```

<a name="array-and-json-casting"></a>
### 数组与 JSON 类型转换

`array` 类型转换在处理以序列化 JSON 存储的列时特别有用。例如，如果数据库中有包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，为该属性添加 `array` 类型转换后，在 Eloquent 模型上访问该属性时会自动将其反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 应进行类型转换的属性。
     *
     * @var array
     */
    protected $casts = [
        'options' => 'array',
    ];
}
```

定义类型转换后，你可以访问 `options` 属性，它会自动从 JSON 反序列化为 PHP 数组。设置 `options` 属性的值时，给定的数组会自动序列化回 JSON 以便存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

要使用更简洁的语法更新 JSON 属性的单个字段，可以在调用 `update` 方法时使用 `->` 操作符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

<a name="array-object-and-collection-casting"></a>
#### ArrayObject 与 Collection 类型转换

虽然标准的 `array` 类型转换对许多应用来说已经足够，但它确实有一些缺点。由于 `array` 类型转换返回的是原始类型，无法直接修改数组的偏移量。例如，以下代码会触发 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为解决此问题，Laravel 提供了 `AsArrayObject` 类型转换，将 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。此功能使用 Laravel 的[自定义类型转换](#custom-casts)实现，允许 Laravel 智能地缓存和转换被修改的对象，从而可以修改单个偏移量而不会触发 PHP 错误。要使用 `AsArrayObject` 类型转换，只需将其分配给属性即可：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'options' => AsArrayObject::class,
];
```

类似地，Laravel 提供了 `AsCollection` 类型转换，将 JSON 属性转换为 Laravel [Collection](/docs/{{version}}/collections) 实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'options' => AsCollection::class,
];
```

<a name="date-casting"></a>
### 日期类型转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 实例，该实例扩展了 PHP `DateTime` 类并提供了许多有用的方法。可以通过在模型的 `$casts` 属性数组中定义额外的日期类型转换来转换其他日期属性。通常，日期应使用 `datetime` 或 `immutable_datetime` 类型转换类型进行转换。

定义 `date` 或 `datetime` 类型转换时，还可以指定日期的格式。当[模型序列化为数组或 JSON](/docs/{{version}}/eloquent-serialization)时，会使用此格式：

```php
/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'created_at' => 'datetime:Y-m-d',
];
```

当列被转换为日期时，可以将相应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串或 `DateTime` / `Carbon` 实例。日期值会被正确转换并存储到数据库中。

可以通过在模型上定义 `serializeDate` 方法来自定义所有模型日期的默认序列化格式。此方法不影响日期在数据库中存储时的格式：

```php
/**
 * 为数组 / JSON 序列化准备日期。
 *
 * @param  \DateTimeInterface  $date
 * @return string
 */
protected function serializeDate(DateTimeInterface $date)
{
    return $date->format('Y-m-d');
}
```

要指定在数据库中实际存储模型日期时使用的格式，应在模型上定义 `$dateFormat` 属性：

```php
/**
 * 模型日期列的存储格式。
 *
 * @var string
 */
protected $dateFormat = 'U';
```

<a name="date-casting-and-timezones"></a>
#### 日期类型转换、序列化与时区

默认情况下，`date` 和 `datetime` 类型转换会将日期序列化为 UTC ISO-8601 日期字符串（`1986-05-28T21:05:54.000000Z`），无论应用的 `timezone` 配置选项中指定了什么时区。强烈建议始终使用此序列化格式，并将应用的日期存储在 UTC 时区中，即不将应用的 `timezone` 配置选项从默认值 `UTC` 更改。在整个应用中一致地使用 UTC 时区，可以最大程度地与其他用 PHP 和 JavaScript 编写的日期操作库实现互操作。

如果对 `date` 或 `datetime` 类型转换应用了自定义格式，如 `datetime:Y-m-d H:i:s`，则在日期序列化时会使用 Carbon 实例的内部时区。通常，这就是应用的 `timezone` 配置选项中指定的时区。

<a name="enum-casting"></a>
### 枚举类型转换

> **Warning**
> 枚举类型转换仅适用于 PHP 8.1+。

Eloquent 还允许你将属性值转换为 PHP [Enums](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，可以在模型的 `$casts` 属性数组中指定要进行类型转换的属性和枚举：

```php
use App\Enums\ServerStatus;

/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'status' => ServerStatus::class,
];
```

在模型上定义类型转换后，与属性交互时，指定的属性会自动在枚举之间进行转换：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

<a name="casting-arrays-of-enums"></a>
#### 枚举数组的类型转换

有时你可能需要模型在单个列中存储枚举值的数组。为此，可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 类型转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'statuses' => AsEnumCollection::class.':'.ServerStatus::class,
];
```

<a name="encrypted-casting"></a>
### 加密类型转换

`encrypted` 类型转换会使用 Laravel 内置的[加密](/docs/{{version}}/encryption)功能对模型属性值进行加密。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 类型转换的工作方式与其未加密的对应类型相同；但是，正如你所料，底层值在存储到数据库时会被加密。

由于加密文本的最终长度不可预测且比其明文更长，请确保关联的数据库列是 `TEXT` 类型或更大。此外，由于值在数据库中是加密的，你将无法查询或搜索加密的属性值。

<a name="key-rotation"></a>
#### 密钥轮换

如你所知，Laravel 使用应用的 `app` 配置文件中指定的 `key` 配置值来加密字符串。通常，此值对应于 `APP_KEY` 环境变量的值。如果需要轮换应用的加密密钥，需要使用新密钥手动重新加密已加密的属性。

<a name="query-time-casting"></a>
### 查询时类型转换

有时你可能需要在执行查询时应用类型转换，例如从表中选择原始值时。例如，考虑以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
])->get();
```

此查询结果中的 `last_posted_at` 属性将是一个简单的字符串。如果在执行查询时能对此属性应用 `datetime` 类型转换就太好了。幸运的是，我们可以使用 `withCasts` 方法来实现：

```php
$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
])->withCasts([
    'last_posted_at' => 'datetime'
])->get();
```

<a name="custom-casts"></a>
## 自定义类型转换

Laravel 有多种内置的有用的类型转换类型；但是，偶尔你可能需要定义自己的类型转换类型。要创建类型转换，执行 `make:cast` Artisan 命令。新的类型转换类会放在 `app/Casts` 目录中：

```shell
php artisan make:cast Json
```

所有自定义类型转换类都实现 `CastsAttributes` 接口。实现此接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责将数据库中的原始值转换为类型转换后的值，而 `set` 方法应将类型转换后的值转换为可以存储在数据库中的原始值。作为示例，我们将重新实现内置的 `json` 类型转换类型作为自定义类型转换类型：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Json implements CastsAttributes
{
    /**
     * 类型转换给定的值。
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return array
     */
    public function get($model, $key, $value, $attributes)
    {
        return json_decode($value, true);
    }

    /**
     * 为存储准备给定的值。
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  array  $value
     * @param  array  $attributes
     * @return string
     */
    public function set($model, $key, $value, $attributes)
    {
        return json_encode($value);
    }
}
```

定义自定义类型转换类型后，可以使用其类名将其附加到模型属性：

```php
<?php

namespace App\Models;

use App\Casts\Json;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 应进行类型转换的属性。
     *
     * @var array
     */
    protected $casts = [
        'options' => Json::class,
    ];
}
```

<a name="value-object-casting"></a>
### 值对象类型转换

你不限于将值转换为原始类型。也可以将值转换为对象。定义将值转换为对象的自定义类型转换与转换为原始类型非常相似；但是，`set` 方法应返回一个键 / 值对数组，用于在模型上设置原始的、可存储的值。

作为示例，我们将定义一个自定义类型转换类，将多个模型值转换为单个 `Address` 值对象。我们假设 `Address` 值有两个公共属性：`lineOne` 和 `lineTwo`：

```php
<?php

namespace App\Casts;

use App\ValueObjects\Address as AddressValueObject;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use InvalidArgumentException;

class Address implements CastsAttributes
{
    /**
     * 类型转换给定的值。
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return \App\ValueObjects\Address
     */
    public function get($model, $key, $value, $attributes)
    {
        return new AddressValueObject(
            $attributes['address_line_one'],
            $attributes['address_line_two']
        );
    }

    /**
     * 为存储准备给定的值。
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  \App\ValueObjects\Address  $value
     * @param  array  $attributes
     * @return array
     */
    public function set($model, $key, $value, $attributes)
    {
        if (! $value instanceof AddressValueObject) {
            throw new InvalidArgumentException('The given value is not an Address instance.');
        }

        return [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ];
    }
}
```

当转换为值对象时，对值对象所做的任何更改都会在模型保存之前自动同步回模型：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Value';

$user->save();
```

> **Note**
> 如果你计划将包含值对象的 Eloquent 模型序列化为 JSON 或数组，应在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

<a name="array-json-serialization"></a>
### 数组 / JSON 序列化

当使用 `toArray` 和 `toJson` 方法将 Eloquent 模型转换为数组或 JSON 时，自定义类型转换的值对象通常也会被序列化，只要它们实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。但是，当使用第三方库提供的值对象时，你可能无法为对象添加这些接口。

因此，你可以指定由自定义类型转换类负责序列化值对象。为此，自定义类型转换类应实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。此接口规定类应包含一个 `serialize` 方法，该方法应返回值对象的序列化形式：

```php
/**
 * 获取值的序列化表示。
 *
 * @param  \Illuminate\Database\Eloquent\Model  $model
 * @param  string  $key
 * @param  mixed  $value
 * @param  array  $attributes
 * @return mixed
 */
public function serialize($model, string $key, $value, array $attributes)
{
    return (string) $value;
}
```

<a name="inbound-casting"></a>
### 入站类型转换

偶尔，你可能需要编写一个自定义类型转换类，该类仅转换设置到模型上的值，而在从模型中获取属性时不执行任何操作。

仅入站的自定义类型转换应实现 `CastsInboundAttributes` 接口，该接口只需定义 `set` 方法。可以使用 `--inbound` 选项调用 `make:cast` Artisan 命令来生成仅入站的类型转换类：

```shell
php artisan make:cast Hash --inbound
```

仅入站类型转换的经典示例是"哈希"类型转换。例如，我们可以定义一个通过给定算法对入站值进行哈希的类型转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;

class Hash implements CastsInboundAttributes
{
    /**
     * 哈希算法。
     *
     * @var string
     */
    protected $algorithm;

    /**
     * 创建新的类型转换类实例。
     *
     * @param  string|null  $algorithm
     * @return void
     */
    public function __construct($algorithm = null)
    {
        $this->algorithm = $algorithm;
    }

    /**
     * 为存储准备给定的值。
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  array  $value
     * @param  array  $attributes
     * @return string
     */
    public function set($model, $key, $value, $attributes)
    {
        return is_null($this->algorithm)
                    ? bcrypt($value)
                    : hash($this->algorithm, $value);
    }
}
```

<a name="cast-parameters"></a>
### 类型转换参数

将自定义类型转换附加到模型时，可以使用 `:` 字符将参数与类名分隔，并使用逗号分隔多个参数来指定类型转换参数。参数会传递给类型转换类的构造器：

```php
/**
 * 应进行类型转换的属性。
 *
 * @var array
 */
protected $casts = [
    'secret' => Hash::class.':sha256',
];
```

<a name="castables"></a>
### 可转换对象（Castables）

你可能希望允许应用的值对象定义自己的自定义类型转换类。除了将自定义类型转换类附加到模型外，还可以附加一个实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

```php
use App\Models\Address;

protected $casts = [
    'address' => Address::class,
];
```

实现 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责与 `Castable` 类之间进行转换的自定义类型转换器类的类名：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\Address as AddressCast;

class Address implements Castable
{
    /**
     * 获取从 / 到此类型转换目标时使用的类型转换器类名。
     *
     * @param  array  $arguments
     * @return string
     */
    public static function castUsing(array $arguments)
    {
        return AddressCast::class;
    }
}
```

使用 `Castable` 类时，仍可以在 `$casts` 定义中提供参数。参数会传递给 `castUsing` 方法：

```php
use App\Models\Address;

protected $casts = [
    'address' => Address::class.':argument',
];
```

<a name="anonymous-cast-classes"></a>
#### Castables 与匿名类型转换类

通过将"castables"与 PHP 的[匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php)结合使用，可以将值对象及其类型转换逻辑定义为单个可转换对象。为此，从值对象的 `castUsing` 方法返回一个匿名类。该匿名类应实现 `CastsAttributes` 接口：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ...

    /**
     * 获取从 / 到此类型转换目标时使用的类型转换器类。
     *
     * @param  array  $arguments
     * @return object|string
     */
    public static function castUsing(array $arguments)
    {
        return new class implements CastsAttributes
        {
            public function get($model, $key, $value, $attributes)
            {
                return new Address(
                    $attributes['address_line_one'],
                    $attributes['address_line_two']
                );
            }

            public function set($model, $key, $value, $attributes)
            {
                return [
                    'address_line_one' => $value->lineOne,
                    'address_line_two' => $value->lineTwo,
                ];
            }
        };
    }
}
```