# Eloquent：修改器与类型转换

- [简介](#introduction)
- [访问器与修改器](#accessors-and-mutators)
    - [定义访问器](#defining-an-accessor)
    - [定义修改器](#defining-a-mutator)
- [属性转换](#attribute-casting)
    - [数组与 JSON 转换](#array-and-json-casting)
    - [向量转换](#vector-casting)
    - [二进制转换](#binary-casting)
    - [日期转换](#date-casting)
    - [枚举转换](#enum-casting)
    - [加密转换](#encrypted-casting)
    - [查询时转换](#query-time-casting)
- [自定义转换](#custom-casts)
    - [值对象转换](#value-object-casting)
    - [数组 / JSON 序列化](#array-json-serialization)
    - [入站转换](#inbound-casting)
    - [转换参数](#cast-parameters)
    - [比较转换值](#comparing-cast-values)
    - [Castables](#castables)

<a name="introduction"></a>
## 简介

访问器（accessor）、修改器（mutator）和属性转换（attribute casting）允许你在模型实例上获取或设置 Eloquent 属性值时，对属性值进行转换。例如，你可能希望使用 [Laravel 加密器](/docs/{{version}}/encryption) 在值存入数据库时对其进行加密，然后在使用 Eloquent 模型访问该属性时自动解密。或者，你可能希望将数据库中存储的 JSON 字符串通过 Eloquent 模型访问时转换为数组。

<a name="accessors-and-mutators"></a>
## 访问器与修改器

<a name="defining-an-accessor"></a>
### 定义访问器

访问器在访问 Eloquent 属性值时对其值进行转换。要定义访问器，请在你的模型上创建一个受保护的方法来表示该可访问属性。在适用的情况下，该方法名应与真实底层模型属性 / 数据库列的“驼峰式（camel case）”表示相对应。

在此示例中，我们为 `first_name` 属性定义一个访问器。当尝试获取 `first_name` 属性的值时，Eloquent 会自动调用该访问器。所有属性访问器 / 修改器方法都必须声明 `Illuminate\Database\Eloquent\Casts\Attribute` 的返回类型提示：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取用户的名字。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
        );
    }
}
```

所有访问器方法都返回一个 `Attribute` 实例，该实例定义了属性将如何被访问以及（可选地）如何被修改。在此示例中，我们仅定义了属性将如何被访问。为此，我们向 `Attribute` 类的构造函数提供了 `get` 参数。

如你所见，列的原始值被传入访问器，使你能够操作并返回该值。要访问访问器的值，你只需直接访问模型实例上的 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> [!NOTE]
> 如果你希望将这些计算值添加到模型的数组 / JSON 表示中，需要[将它们追加进去](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。

<a name="building-value-objects-from-multiple-attributes"></a>
#### 由多个属性构建值对象

有时你的访问器可能需要将多个模型属性转换为一个“值对象（value object）”。为此，你的 `get` 闭包可以接受第二个参数 `$attributes`，它会自动提供给该闭包，并包含模型所有当前属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    );
}
```

<a name="accessor-caching"></a>
#### 访问器缓存

当从访问器返回值对象时，对该值对象所做的任何更改都会在该模型保存前自动同步回模型。这是可行的，因为 Eloquent 会保留访问器返回的实例，从而在每次调用访问器时返回同一个实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Line 1 Value';
$user->address->lineTwo = 'Updated Address Line 2 Value';

$user->save();
```

不过，有时你可能希望为字符串和布尔值等原始值启用缓存，尤其是当它们的计算开销较大时。为此，你可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你想禁用属性的对象缓存行为，可以在定义属性时调用 `withoutObjectCaching` 方法：

```php
/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    )->withoutObjectCaching();
}
```

<a name="defining-a-mutator"></a>
### 定义修改器

修改器在设置 Eloquent 属性值时对其值进行转换。要定义修改器，你可以在定义属性时提供 `set` 参数。我们为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，会自动调用该修改器：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 与用户的名字交互。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }
}
```

修改器闭包会接收正被设置到该属性上的值，使你能够操作该值并返回操作后的结果。要使用我们的修改器，只需在 Eloquent 模型上设置 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在此示例中，`set` 回调会以值 `Sally` 被调用。随后修改器会对该名称应用 `strtolower` 函数，并将其结果值设置到模型内部的 `$attributes` 数组中。

<a name="mutating-multiple-attributes"></a>
#### 修改多个属性

有时你的修改器可能需要在底层模型上设置多个属性。为此，你可以从 `set` 闭包中返回一个数组。数组中的每个键都应与模型关联的一个底层属性 / 数据库列相对应：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
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
## 属性转换

属性转换提供了与访问器和修改器类似的功能，而无需你在模型上定义任何额外的方法。相反，你模型的 `casts` 方法提供了一种将属性转换为常见数据类型的便捷方式。

`casts` 方法应返回一个数组，其中键是要转换的属性的名称，值是你希望将该列转换成的类型。支持的转换类型包括：

<div class="content-list" markdown="1">

- `array`
- `AsFluent::class`
- `AsStringable::class`
- `AsUri::class`
- `AsVector::class`
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
- `hashed`
- `integer`
- `object`
- `real`
- `string`
- `timestamp`

</div>

为了演示属性转换，我们将 `is_admin` 属性（在数据库中以整数（`0` 或 `1`）存储）转换为布尔值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
        ];
    }
}
```

定义转换后，无论底层值是否以整数形式存储在数据库中，当你访问 `is_admin` 属性时，它始终会被转换为布尔值：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    // ……
}
```

如果你需要在运行时添加一个新的临时转换，可以使用 `mergeCasts` 方法。这些转换定义会被添加到模型上已定义的任何转换之上：

```php
$user->mergeCasts([
    'is_admin' => 'integer',
    'options' => 'object',
]);
```

> [!WARNING]
> 为 `null` 的属性不会被转换。此外，你绝不应定义与关联同名的转换（或属性），也不应为模型的主键分配转换。

<a name="stringable-casting"></a>
#### Stringable 转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 转换类将模型属性转换为 [流畅的 Illuminate\Support\Stringable 对象](/docs/{{version}}/strings#fluent-strings-method-list)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'directory' => AsStringable::class,
        ];
    }
}
```

<a name="array-and-json-casting"></a>
### 数组与 JSON 转换

当处理以序列化 JSON 形式存储的列时，`array` 转换尤为有用。例如，如果你的数据库有一个包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，为该属性添加 `array` 转换后，当你在 Eloquent 模型上访问它时，该属性会自动反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }
}
```

定义转换后，你可以访问 `options` 属性，它会自动从 JSON 反序列化为 PHP 数组。当你设置 `options` 属性的值时，给定的数组会自动重新序列化为 JSON 以便存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

要以更简洁的语法更新 JSON 属性的单个字段，你可以[使该属性可批量赋值](/docs/{{version}}/eloquent#mass-assignment-json-columns)，并在调用 `update` 方法时使用 `->` 运算符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

<a name="json-and-unicode"></a>
#### JSON 与 Unicode

如果你希望将数组属性以包含未转义 Unicode 字符的 JSON 形式存储，可以使用 `json:unicode` 转换：

```php
/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => 'json:unicode',
    ];
}
```

<a name="array-object-and-collection-casting"></a>
#### 数组对象与集合转换

尽管标准的 `array` 转换对许多应用来说已经足够，但它确实存在一些缺点。由于 `array` 转换返回的是原始类型，无法直接修改数组的某个偏移量。例如，以下代码会触发 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为了解决这个问题，Laravel 提供了 `AsArrayObject` 转换，可将你的 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。此功能通过 Laravel 的[自定义转换](#custom-casts)实现，使 Laravel 能够智能地缓存并转换被修改的对象，从而可以在不触发 PHP 错误的情况下修改单个偏移量。要使用 `AsArrayObject` 转换，只需将其赋值给某个属性：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsArrayObject::class,
    ];
}
```

类似地，Laravel 提供了 `AsCollection` 转换，可将你的 JSON 属性转换为 Laravel [集合（Collection）](/docs/{{version}}/collections) 实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::class,
    ];
}
```

如果你希望 `AsCollection` 转换实例化一个自定义集合类，而不是 Laravel 的基础集合类，可以将该集合类名作为转换参数提供：

```php
use App\Collections\OptionCollection;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::using(OptionCollection::class),
    ];
}
```

`of` 方法可用于指示集合项应通过集合的 [mapInto 方法](/docs/{{version}}/collections#method-mapinto) 映射到给定类：

```php
use App\ValueObjects\Option;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::of(Option::class)
    ];
}
```

当将集合映射到对象时，该对象应实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，以定义其实例应如何作为 JSON 序列化到数据库中：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

class Option implements Arrayable, JsonSerializable
{
    public string $name;
    public mixed $value;
    public bool $isLocked;

    /**
     * 创建一个新的 Option 实例。
     */
    public function __construct(array $data)
    {
        $this->name = $data['name'];
        $this->value = $data['value'];
        $this->isLocked = $data['is_locked'];
    }

    /**
     * 以数组形式获取该实例。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'value' => $this->value,
            'is_locked' => $this->isLocked,
        ];
    }

    /**
     * 指定应被序列化到 JSON 的数据。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

<a name="vector-casting"></a>
### 向量转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsVector` 转换类将数据库向量列与 PHP 数组相互转换：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

设置该属性时，转换接受 PHP 数组或 `Arrayable` 实例（例如 Laravel 集合）。获取该属性时，转换返回一个浮点数数组。

<a name="binary-casting"></a>
### 二进制转换

如果你的 Eloquent 模型除了自增 ID 列之外，还有一个 [binary 类型](/docs/{{version}}/migrations#column-method-binary) 的 `uuid` 或 `ulid` 列，你可以使用 `AsBinary` 转换自动将值在二进制表示形式之间相互转换：

```php
use Illuminate\Database\Eloquent\Casts\AsBinary;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'uuid' => AsBinary::uuid(),
        'ulid' => AsBinary::ulid(),
    ];
}
```

一旦在模型上定义了该转换，你可以将 UUID / ULID 属性值设置为对象实例或字符串。Eloquent 会自动将该值转换为其二进制表示形式。当获取该属性的值时，你始终会收到一个纯文本字符串值：

```php
use Illuminate\Support\Str;

$user->uuid = Str::uuid();

return $user->uuid;

// "6e8cdeed-2f32-40bd-b109-1e4405be2140"
```

<a name="date-casting"></a>
### 日期转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 实例，Carbon 扩展了 PHP 的 `DateTime` 类并提供了许多实用方法。你可以通过在模型的 `casts` 方法中定义额外的日期转换，来转换其它日期属性。通常，日期应使用 `datetime` 或 `immutable_datetime` 转换类型进行转换。

当定义 `date` 或 `datetime` 转换时，你还可以指定日期的格式。当[模型被序列化为数组或 JSON](/docs/{{version}}/eloquent-serialization) 时，将使用此格式：

```php
/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'created_at' => 'datetime:Y-m-d',
    ];
}
```

当列被转换为日期时，你可以将相应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串，或 `DateTime` / `Carbon` 实例。该日期值会被正确转换并存储到你的数据库中。

你可以通过在模型上定义 `serializeDate` 方法来自定义所有模型日期的默认序列化格式。该方法不会影响日期在数据库中存储时的格式：

```php
/**
 * 为数组 / JSON 序列化准备日期。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

要指定在数据库中实际存储模型日期时应使用的格式，应在模型的 `Table` 属性上使用 `dateFormat` 参数：

```php
use Illuminate\Database\Eloquent\Attributes\Table;

#[Table(dateFormat: 'U')]
class Flight extends Model
{
    // ……
}
```

<a name="date-casting-and-timezones"></a>
#### 日期转换、序列化与时区

默认情况下，无论你应用的 `timezone` 配置选项中指定了何种时区，`date` 和 `datetime` 转换都会将日期序列化为 UTC 的 ISO-8601 日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`）。我们强烈建议你始终使用这种序列化格式，并且不要修改应用 `timezone` 配置选项的默认值 `UTC`，从而将应用的日期以 UTC 时区存储。在整个应用中始终使用 UTC 时区，能与 PHP 和 JavaScript 编写的其它日期处理库提供最高程度的互操作性。

如果为 `date` 或 `datetime` 转换应用了自定义格式（如 `datetime:Y-m-d H:i:s`），在日期序列化时会使用 Carbon 实例的内部时区。通常，这就是你应用 `timezone` 配置选项中指定的时区。不过需要注意的是，诸如 `created_at` 和 `updated_at` 这样的 `timestamp` 列不受此行为影响，无论应用的时区设置如何，它们始终以 UTC 格式化。

<a name="enum-casting"></a>
### 枚举转换

Eloquent 还允许你将属性值转换为 PHP [枚举（Enum）](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，你可以在模型的 `casts` 方法中指定希望转换的属性和枚举：

```php
use App\Enums\ServerStatus;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'status' => ServerStatus::class,
    ];
}
```

一旦在模型上定义了该转换，当你与该属性交互时，指定属性会自动在枚举之间转换：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

<a name="casting-arrays-of-enums"></a>
#### 枚举数组转换

有时你可能需要模型在单个列中存储一组枚举值。为此，你可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'statuses' => AsEnumCollection::of(ServerStatus::class),
    ];
}
```

<a name="encrypted-casting"></a>
### 加密转换

`encrypted` 转换会使用 Laravel 内置的[加密](/docs/{{version}}/encryption)功能对模型属性值进行加密。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 转换的工作方式与其未加密的对应转换相同；不过正如你所料，底层值在存入数据库时会被加密。

由于加密文本的最终长度不可预测且比明文更长，请确保关联的数据库列类型为 `TEXT` 或更宽的类型。此外，由于这些值在数据库中已加密，你将无法查询或搜索已加密的属性值。

<a name="key-rotation"></a>
#### 密钥轮换

如你所知，Laravel 使用应用 `app` 配置文件中指定的 `key` 配置值对字符串进行加密。通常，该值与 `APP_KEY` 环境变量的值相对应。如果你需要轮换应用的加密密钥，可以[平稳地完成](/docs/{{version}}/encryption#gracefully-rotating-encryption-keys)。

<a name="query-time-casting"></a>
### 查询时转换

有时你需要在执行查询时应用转换，例如从表中选取一个原始值时。例如，考虑以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->get();
```

此查询结果上的 `last_posted_at` 属性将是一个简单的字符串。如果我们在执行查询时能对这一属性应用 `datetime` 转换就太好了。所幸，我们可以使用 `withCasts` 方法实现这一点：

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
## 自定义转换

Laravel 提供了多种内置的、实用的转换类型；不过，有时你可能需要定义自己的转换类型。要创建转换，执行 `make:cast` Artisan 命令。新的转换类将被放置在你的 `app/Casts` 目录：

```shell
php artisan make:cast AsJson
```

所有自定义转换类都实现了 `CastsAttributes` 接口。实现该接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责将数据库中的原始值转换为转换后的值，而 `set` 方法应将转换后的值转换为可存储到数据库中的原始值。作为示例，我们将把内置的 `json` 转换类型重新实现为一个自定义转换类型：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AsJson implements CastsAttributes
{
    /**
     * 转换给定值。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function get(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): array {
        return json_decode($value, true);
    }

    /**
     * 为存储准备给定值。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): string {
        return json_encode($value);
    }
}
```

定义自定义转换类型后，你可以使用其类名将其附加到模型属性：

```php
<?php

namespace App\Models;

use App\Casts\AsJson;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsJson::class,
        ];
    }
}
```

<a name="value-object-casting"></a>
### 值对象转换

你并不局限于将值转换为原始类型。你也可以将值转换为对象。定义将值转换为对象的自定义转换，与转换为原始类型非常相似；不过，如果你的值对象涵盖多个数据库列，则 `set` 方法必须返回一个键值对数组，用于设置模型上的原始可存储值。如果你的值对象只影响单个列，则只需返回可存储的值。

作为示例，我们将定义一个自定义转换类，将多个模型值转换为单一的 `Address` 值对象。我们假设 `Address` 值对象有两个公共属性：`lineOne` 和 `lineTwo`：

```php
<?php

namespace App\Casts;

use App\ValueObjects\Address;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class AsAddress implements CastsAttributes
{
    /**
     * 转换给定值。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): Address {
        return new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two']
        );
    }

    /**
     * 为存储准备给定值。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, string>
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): array {
        if (! $value instanceof Address) {
            throw new InvalidArgumentException('The given value is not an Address instance.');
        }

        return [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ];
    }
}
```

当转换为值对象时，对该值对象所做的任何更改都会在模型保存前自动同步回模型：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Value';

$user->save();
```

> [!NOTE]
> 如果你打算将包含值对象的 Eloquent 模型序列化为 JSON 或数组，应在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

<a name="value-object-caching"></a>
#### 值对象缓存

当转换为值对象的属性被解析时，它们会被 Eloquent 缓存。因此，如果该属性再次被访问，会返回同一个对象实例。

如果你想禁用自定义转换类的对象缓存行为，可以在自定义转换类上声明一个公共的 `withoutObjectCaching` 属性：

```php
class AsAddress implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ……
}
```

<a name="array-json-serialization"></a>
### 数组 / JSON 序列化

当使用 `toArray` 和 `toJson` 方法将 Eloquent 模型转换为数组或 JSON 时，只要你的自定义转换值对象实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，它们通常也会被序列化。不过，当使用第三方库提供的值对象时，你可能无法为对象添加这些接口。

因此，你可以指定你的自定义转换类负责序列化该值对象。为此，你的自定义转换类应实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。该接口规定你的类应包含一个 `serialize` 方法，该方法应返回值对象的序列化形式：

```php
/**
 * 获取该值的序列化表示。
 *
 * @param  array<string, mixed>  $attributes
 */
public function serialize(
    Model $model,
    string $key,
    mixed $value,
    array $attributes,
): string {
    return (string) $value;
}
```

<a name="inbound-casting"></a>
### 入站转换

有时你可能需要编写一个自定义转换类，它只对正被设置到模型上的值进行转换，而在从模型获取属性时不执行任何操作。

仅入站的自定义转换应实现 `CastsInboundAttributes` 接口，该接口只要求定义 `set` 方法。可以使用 `--inbound` 选项调用 `make:cast` Artisan 命令来生成仅入站的转换类：

```shell
php artisan make:cast AsHash --inbound
```

仅入站转换的一个典型示例是“哈希（hashing）”转换。例如，我们可以定义一个通过给定算法对入站值进行哈希的转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;
use Illuminate\Database\Eloquent\Model;

class AsHash implements CastsInboundAttributes
{
    /**
     * 创建一个新的转换类实例。
     */
    public function __construct(
        protected string|null $algorithm = null,
    ) {}

    /**
     * 为存储准备给定值。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): string {
        return is_null($this->algorithm)
            ? bcrypt($value)
            : hash($this->algorithm, $value);
    }
}
```

<a name="cast-parameters"></a>
### 转换参数

将自定义转换附加到模型时，可以通过 `:` 字符将转换参数与类名分隔，并使用逗号分隔多个参数来指定它们。这些参数会被传递给转换类的构造函数：

```php
/**
 * 获取应被转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'secret' => AsHash::class.':sha256',
    ];
}
```

<a name="comparing-cast-values"></a>
### 比较转换值

如果你想定义应如何比较两个给定的转换值以确定它们是否已被更改，你的自定义转换类可以实现 `Illuminate\Contracts\Database\Eloquent\ComparesCastableAttributes` 接口。这使你能够精细控制 Eloquent 将哪些值视为已更改，从而在模型更新时保存到数据库。

该接口规定你的类应包含一个 `compare` 方法，当给定值被视为相等时应返回 `true`：

```php
/**
 * 确定给定值是否相等。
 *
 * @param  \Illuminate\Database\Eloquent\Model  $model
 * @param  string  $key
 * @param  mixed  $firstValue
 * @param  mixed  $secondValue
 * @return bool
 */
public function compare(
    Model $model,
    string $key,
    mixed $firstValue,
    mixed $secondValue
): bool {
    return $firstValue === $secondValue;
}
```

<a name="castables"></a>
### Castables

你可能希望允许应用的值对象定义它们自己的自定义转换类。除了将自定义转换类附加到模型之外，你还可以附加一个实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class,
    ];
}
```

实现了 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责在 `Castable` 类之间相互转换的自定义转换类的类名：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\AsAddress;

class Address implements Castable
{
    /**
     * 获取在从此转换目标转换时应使用的转换类名称。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): string
    {
        return AsAddress::class;
    }
}
```

使用 `Castable` 类时，你仍可以在 `casts` 方法定义中提供参数。这些参数会被传递给 `castUsing` 方法：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class.':argument',
    ];
}
```

<a name="anonymous-cast-classes"></a>
#### Castables 与匿名转换类

通过将“castables”与 PHP 的 [匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php) 相结合，你可以将值对象及其转换逻辑定义为单一的可转换（castable）对象。为此，从值对象的 `castUsing` 方法返回一个匿名类。该匿名类应实现 `CastsAttributes` 接口：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ……

    /**
     * 获取在从此转换目标转换时应使用的转换类。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get(
                Model $model,
                string $key,
                mixed $value,
                array $attributes,
            ): Address {
                return new Address(
                    $attributes['address_line_one'],
                    $attributes['address_line_two']
                );
            }

            public function set(
                Model $model,
                string $key,
                mixed $value,
                array $attributes,
            ): array {
                return [
                    'address_line_one' => $value->lineOne,
                    'address_line_two' => $value->lineTwo,
                ];
            }
        };
    }
}
```
