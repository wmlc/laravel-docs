# Eloquent：修改器与类型转换

- [简介](#introduction)
- [访问器与修改器](#accessors-and-mutators)
    - [定义访问器](#defining-an-accessor)
    - [定义修改器](#defining-a-mutator)
- [属性类型转换](#attribute-casting)
    - [数组与 JSON 类型转换](#array-and-json-casting)
    - [二进制类型转换](#binary-casting)
    - [日期类型转换](#date-casting)
    - [枚举类型转换](#enum-casting)
    - [加密类型转换](#encrypted-casting)
    - [查询时类型转换](#query-time-casting)
- [自定义类型转换](#custom-casts)
    - [值对象类型转换](#value-object-casting)
    - [数组 / JSON 序列化](#array-json-serialization)
    - [入站类型转换](#inbound-casting)
    - [类型转换参数](#cast-parameters)
    - [比较类型转换后的值](#comparing-cast-values)
    - [可转换类（Castables）](#castables)

<a name="introduction"></a>
## 简介

访问器、修改器和属性类型转换让你能够在模型实例上获取或设置 Eloquent 属性值时对其进行转换。例如，你可能希望在值存入数据库时使用 [Laravel 加密器](/docs/{{version}}/encryption)对其加密，然后在 Eloquent 模型上访问该属性时自动解密。或者，你可能希望在通过 Eloquent 模型访问存储在数据库中的 JSON 字符串时，将其转换为数组。

<a name="accessors-and-mutators"></a>
## 访问器与修改器

<a name="defining-an-accessor"></a>
### 定义访问器

访问器会在 Eloquent 属性值被访问时对其进行转换。要定义访问器，请在模型上创建一个 protected 方法来表示这个可访问的属性。在适用的情况下，方法名应当与模型底层属性 / 数据库列的「camel case」形式相对应。

在本例中，我们将为 `first_name` 属性定义一个访问器。当尝试获取 `first_name` 属性的值时，Eloquent 会自动调用该访问器。所有属性访问器 / 修改器方法都必须声明 `Illuminate\Database\Eloquent\Casts\Attribute` 返回类型提示：

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

所有访问器方法都返回一个 `Attribute` 实例，该实例定义了属性将被如何访问，以及（可选的）如何被修改。在本例中，我们只定义了属性将被如何访问。为此，我们向 `Attribute` 类构造函数提供了 `get` 参数。

如你所见，列的原始值会被传给访问器，因此你可以对值进行操作并返回。要访问访问器的值，只需访问模型实例上的 `first_name` 属性即可：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> [!NOTE]
> 如果你希望这些计算出来的值也被添加到模型的数组 / JSON 表示形式中，[你需要将它们追加进去](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。

<a name="building-value-objects-from-multiple-attributes"></a>
#### 从多个属性构建值对象

有时你的访问器可能需要将多个模型属性转换为一个单独的「值对象」。为此，你的 `get` 闭包可以接受第二个参数 `$attributes`。该参数会被自动传给闭包，其中包含模型当前所有属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址进行交互。
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

当访问器返回值对象时，对值对象所做的任何更改都会在模型保存之前自动同步回模型。这之所以可行，是因为 Eloquent 会保留访问器返回的实例，从而在每次调用访问器时都能返回同一个实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Line 1 Value';
$user->address->lineTwo = 'Updated Address Line 2 Value';

$user->save();
```

不过，有时你可能希望对字符串和布尔值等原始值启用缓存，尤其是当它们的计算开销较大时。为此，你可以在定义访问器时调用 `shouldCache` 方法：

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
 * 与用户的地址进行交互。
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

修改器会在 Eloquent 属性值被设置时对其进行转换。要定义修改器，你可以在定义属性时提供 `set` 参数。我们来为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，该修改器将被自动调用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 与用户的名字进行交互。
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

修改器闭包会接收正在设置的属性值，因此你可以对值进行操作并返回处理后的值。要使用我们定义的修改器，只需在 Eloquent 模型上设置 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在本例中，`set` 回调会以值 `Sally` 被调用。随后，修改器会对该名称应用 `strtolower` 函数，并将结果值设置到模型内部的 `$attributes` 数组中。

<a name="mutating-multiple-attributes"></a>
#### 修改多个属性

有时你的修改器可能需要在底层模型上设置多个属性。为此，你可以从 `set` 闭包返回一个数组。数组中的每个键都应当对应模型的一个底层属性 / 数据库列：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址进行交互。
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
## 属性类型转换

属性类型转换提供了与访问器和修改器类似的功能，而无需你在模型上定义任何额外的方法。取而代之，模型的 `casts` 方法提供了一种将属性转换为常见数据类型的便捷方式。

`casts` 方法应当返回一个数组，键是正在进行类型转换的属性名称，值是你希望将列转换成的类型。支持的类型转换类型包括：

- `array`
- `AsFluent::class`
- `AsStringable::class`
- `AsUri::class`
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

为了演示属性类型转换，我们将 `is_admin` 属性从数据库中存储的整数（`0` 或 `1`）转换为布尔值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应当进行类型转换的属性。
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

定义类型转换之后，无论底层值在数据库中以何种形式存储，当你访问 `is_admin` 属性时，它总会被转换为布尔值：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    // ...
}
```

如果你需要在运行时添加新的、临时性的类型转换，可以使用 `mergeCasts` 方法。这些类型转换定义会被添加到模型上已定义的任何类型转换之上：

```php
$user->mergeCasts([
    'is_admin' => 'integer',
    'options' => 'object',
]);
```

> [!WARNING]
> 值为 `null` 的属性不会被转换。此外，你永远不要定义与关联同名的类型转换（或属性），也不要为模型的主键指定类型转换。

<a name="stringable-casting"></a>
#### Stringable 类型转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 类型转换类，将模型属性转换为[流畅的 Illuminate\Support\Stringable 对象](/docs/{{version}}/strings#fluent-strings-method-list)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应当进行类型转换的属性。
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
### 数组与 JSON 类型转换

在处理以序列化 JSON 形式存储的列时，`array` 类型转换尤其有用。例如，如果你的数据库中有一个包含序列化 JSON 的 `JSON` 或 `TEXT` 类型字段，为该属性添加 `array` 类型转换后，在 Eloquent 模型上访问它时，就会自动将属性反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应当进行类型转换的属性。
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

定义类型转换之后，你就可以访问 `options` 属性了，它会自动从 JSON 反序列化为 PHP 数组。当你设置 `options` 属性的值时，给定的数组会被自动序列化回 JSON 以便存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

要以更简洁的语法更新 JSON 属性的某个字段，你可以[将属性设为可批量赋值](/docs/{{version}}/eloquent#mass-assignment-json-columns)，并在调用 `update` 方法时使用 `->` 操作符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

<a name="json-and-unicode"></a>
#### JSON 与 Unicode

如果你希望将数组属性以不转义 Unicode 字符的 JSON 形式存储，可以使用 `json:unicode` 类型转换：

```php
/**
 * 获取应当进行类型转换的属性。
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
#### ArrayObject 与集合类型转换

虽然标准的 `array` 类型转换对许多应用来说已经足够，但它确实存在一些缺点。由于 `array` 类型转换返回的是原始类型，因此无法直接修改数组的某个下标。例如，以下代码会触发 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为了解决这个问题，Laravel 提供了 `AsArrayObject` 类型转换，可以将你的 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。该特性基于 Laravel 的[自定义类型转换](#custom-casts)实现，使 Laravel 能够智能地缓存和转换被修改的对象，从而允许修改单个下标而不会触发 PHP 错误。要使用 `AsArrayObject` 类型转换，只需将其分配给属性即可：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 获取应当进行类型转换的属性。
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

类似地，Laravel 提供了 `AsCollection` 类型转换，可以将你的 JSON 属性转换为 Laravel [集合](/docs/{{version}}/collections)实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应当进行类型转换的属性。
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

如果你希望 `AsCollection` 类型转换实例化自定义集合类，而非 Laravel 的基础集合类，可以将集合类名作为类型转换参数提供：

```php
use App\Collections\OptionCollection;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应当进行类型转换的属性。
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

可以使用 `of` 方法来指示集合的项应当通过集合的 [mapInto 方法](/docs/{{version}}/collections#method-mapinto)映射到给定的类：

```php
use App\ValueObjects\Option;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应当进行类型转换的属性。
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

将集合映射到对象时，对象应当实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，以定义其实例应当如何序列化为 JSON 存入数据库：

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
     * 创建新的 Option 实例。
     */
    public function __construct(array $data)
    {
        $this->name = $data['name'];
        $this->value = $data['value'];
        $this->isLocked = $data['is_locked'];
    }

    /**
     * 将实例转换为数组。
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
     * 指定应当序列化为 JSON 的数据。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

<a name="binary-casting"></a>
### 二进制类型转换

如果你的 Eloquent 模型除了自增 ID 列之外，还有一个[二进制类型](/docs/{{version}}/migrations#column-method-binary)的 `uuid` 或 `ulid` 列，你可以使用 `AsBinary` 类型转换，自动在二进制表示与普通表示之间转换该值：

```php
use Illuminate\Database\Eloquent\Casts\AsBinary;

/**
 * 获取应当进行类型转换的属性。
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

在模型上定义该类型转换后，你可以将 UUID / ULID 属性的值设置为对象实例或字符串，Eloquent 会自动将该值转换为其二进制表示。而在获取该属性的值时，你得到的始终是纯文本字符串：

```php
use Illuminate\Support\Str;

$user->uuid = Str::uuid();

return $user->uuid;

// "6e8cdeed-2f32-40bd-b109-1e4405be2140"
```

<a name="date-casting"></a>
### 日期类型转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 实例。Carbon 继承自 PHP 的 `DateTime` 类，并提供了大量实用的方法。你可以在模型的 `casts` 方法中定义额外的日期类型转换，以转换其他日期属性。通常，日期应当使用 `datetime` 或 `immutable_datetime` 类型转换。

在定义 `date` 或 `datetime` 类型转换时，你还可以指定日期的格式。当[模型被序列化为数组或 JSON](/docs/{{version}}/eloquent-serialization)时，将使用该格式：

```php
/**
 * 获取应当进行类型转换的属性。
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

当某个列被转换为日期类型后，你可以将相应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串，或者 `DateTime` / `Carbon` 实例。日期值会被正确转换并存储到数据库中。

你可以通过在模型上定义 `serializeDate` 方法，来自定义模型所有日期的默认序列化格式。该方法不会影响日期在数据库中的存储格式：

```php
/**
 * 准备日期以进行数组 / JSON 序列化。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

要指定在数据库中实际存储模型日期时所使用的格式，你应当在模型上定义 `$dateFormat` 属性：

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

默认情况下，`date` 和 `datetime` 类型转换会将日期序列化为 UTC ISO-8601 格式的日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`），而不受应用 `timezone` 配置选项中指定时区的影响。我们强烈建议你始终使用这种序列化格式，并且不要将应用的 `timezone` 配置选项从默认值 `UTC` 改为其他值，以便将应用的日期始终存储在 UTC 时区中。在整个应用中一致地使用 UTC 时区，可以与 PHP 和 JavaScript 编写的其他日期处理库实现最大程度的互操作性。

如果为 `date` 或 `datetime` 类型转换应用了自定义格式（例如 `datetime:Y-m-d H:i:s`），那么在日期序列化时将使用 Carbon 实例的内部时区。通常，这就是应用的 `timezone` 配置选项中指定的时区。不过需要注意的是，`created_at` 和 `updated_at` 等 `timestamp` 列不适用此行为，无论应用的时区设置如何，它们始终以 UTC 格式化。

<a name="enum-casting"></a>
### 枚举类型转换

Eloquent 还允许你将属性值转换为 PHP [枚举](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，你可以在模型的 `casts` 方法中指定希望转换的属性和枚举：

```php
use App\Enums\ServerStatus;

/**
 * 获取应当进行类型转换的属性。
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

在模型上定义该类型转换之后，当你与该属性交互时，指定的属性会被自动转换为枚举或从枚举转换回来：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

<a name="casting-arrays-of-enums"></a>
#### 转换枚举数组

有时你可能需要让模型在单个列中存储一组枚举值。为此，你可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 类型转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 获取应当进行类型转换的属性。
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
### 加密类型转换

`encrypted` 类型转换会使用 Laravel 内置的[加密](/docs/{{version}}/encryption)功能对模型属性值进行加密。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 类型转换的工作方式与其未加密的对应版本相同；不过，正如你可能预料到的，底层值在存储到数据库时是加密的。

由于加密文本的最终长度不可预测，且比其明文对应值更长，请确保相关的数据库列采用 `TEXT` 类型或更大的类型。此外，由于值在数据库中是加密的，你将无法查询或搜索加密的属性值。

<a name="key-rotation"></a>
#### 密钥轮换

如你所知，Laravel 使用应用 `app` 配置文件中指定的 `key` 配置值来加密字符串。通常，该值对应 `APP_KEY` 环境变量的值。如果你需要轮换应用的加密密钥，可以[优雅地进行轮换](/docs/{{version}}/encryption#gracefully-rotating-encryption-keys)。

<a name="query-time-casting"></a>
### 查询时类型转换

有时你可能需要在执行查询时应用类型转换，例如从表中选择一个原始值时。例如，考虑以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->get();
```

该查询结果中的 `last_posted_at` 属性将是一个简单的字符串。如果我们能在执行查询时为该属性应用 `datetime` 类型转换，那就太好了。所幸，我们可以使用 `withCasts` 方法来实现：

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

Laravel 内置了多种实用的类型转换；不过，你偶尔也需要定义自己的类型转换。要创建类型转换，请执行 `make:cast` Artisan 命令。新的类型转换类会被放置在 `app/Casts` 目录中：

```shell
php artisan make:cast AsJson
```

所有自定义类型转换类都要实现 `CastsAttributes` 接口。实现该接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责将来自数据库的原始值转换为转换后的值，而 `set` 方法应当将转换后的值转换为可以存储在数据库中的原始值。作为示例，我们将以内置 `json` 类型转换为基础，重新实现一个自定义的类型转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AsJson implements CastsAttributes
{
    /**
     * 转换给定的值。
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
     * 准备给定的值以便存储。
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

定义好自定义类型转换后，你就可以通过类名将其附加到模型属性上：

```php
<?php

namespace App\Models;

use App\Casts\AsJson;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应当进行类型转换的属性。
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
### 值对象类型转换

类型转换并不局限于将值转换为原始类型，你还可以将值转换为对象。定义将值转换为对象的自定义类型转换，与转换为原始类型非常相似；不过，如果你的值对象涵盖多个数据库列，`set` 方法必须返回一个键 / 值对数组，用于在模型上设置原始的、可存储的值。如果你的值对象只影响单个列，则只需直接返回可存储的值。

作为示例，我们将定义一个自定义类型转换类，将多个模型值转换为单个 `Address` 值对象。我们假设 `Address` 值对象有两个公共属性：`lineOne` 和 `lineTwo`：

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
     * 转换给定的值。
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
     * 准备给定的值以便存储。
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

当转换为值对象时，对值对象所做的任何更改都会在模型保存之前自动同步回模型：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Value';

$user->save();
```

> [!NOTE]
> 如果你打算将包含值对象的 Eloquent 模型序列化为 JSON 或数组，应当在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

<a name="value-object-caching"></a>
#### 值对象缓存

被转换为值对象的属性在解析时会被 Eloquent 缓存。因此，如果再次访问该属性，将返回同一个对象实例。

如果你想禁用自定义类型转换类的对象缓存行为，可以在自定义类型转换类上声明一个公共的 `withoutObjectCaching` 属性：

```php
class AsAddress implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ...
}
```

<a name="array-json-serialization"></a>
### 数组 / JSON 序列化

当 Eloquent 模型通过 `toArray` 和 `toJson` 方法被转换为数组或 JSON 时，你的自定义类型转换值对象通常也会被序列化，前提是它们实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。然而，在使用第三方库提供的值对象时，你可能无法为这些对象添加上述接口。

因此，你可以指定由自定义类型转换类来负责序列化值对象。为此，你的自定义类型转换类应当实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。该接口要求你的类包含一个 `serialize` 方法，该方法应当返回值对象序列化后的形式：

```php
/**
 * 获取值的序列化表示形式。
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
### 入站类型转换

有时，你可能需要编写一个自定义类型转换类，它只转换那些正在被设置到模型上的值，而在从模型获取属性时不执行任何操作。

仅入站的自定义类型转换应当实现 `CastsInboundAttributes` 接口，该接口只要求定义一个 `set` 方法。可以带上 `--inbound` 选项调用 `make:cast` Artisan 命令，来生成仅入站的类型转换类：

```shell
php artisan make:cast AsHash --inbound
```

「哈希」类型转换是仅入站类型转换的经典示例。例如，我们可以定义一个类型转换，通过给定的算法对入站值进行哈希处理：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;
use Illuminate\Database\Eloquent\Model;

class AsHash implements CastsInboundAttributes
{
    /**
     * 创建新的类型转换类实例。
     */
    public function __construct(
        protected string|null $algorithm = null,
    ) {}

    /**
     * 准备给定的值以便存储。
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
### 类型转换参数

将自定义类型转换附加到模型时，可以用 `:` 字符将类型转换参数与类名分隔开，多个参数之间用逗号分隔。这些参数将被传给类型转换类的构造函数：

```php
/**
 * 获取应当进行类型转换的属性。
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
### 比较类型转换后的值

如果你想定义两个给定的转换值应当如何比较，以确定它们是否发生了变化，你的自定义类型转换类可以实现 `Illuminate\Contracts\Database\Eloquent\ComparesCastableAttributes` 接口。这让你能够精细控制 Eloquent 认为哪些值发生了变化，从而在模型更新时保存到数据库。

该接口要求你的类包含一个 `compare` 方法，当给定的值被视为相等时，该方法应返回 `true`：

```php
/**
 * 判断给定的值是否相等。
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
### 可转换类（Castables）

你可能希望让应用的值对象定义自己的自定义类型转换类。除了将自定义类型转换类附加到模型之外，你还可以附加一个实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class,
    ];
}
```

实现 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责转换到 / 从该 `Castable` 类的自定义转换器类的类名：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\AsAddress;

class Address implements Castable
{
    /**
     * 获取转换到 / 从该转换目标时使用的转换器类名。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): string
    {
        return AsAddress::class;
    }
}
```

使用 `Castable` 类时，你仍然可以在 `casts` 方法定义中提供参数。这些参数将被传给 `castUsing` 方法：

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
#### Castable 与匿名类型转换类

通过将「Castable」与 PHP 的[匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php)相结合，你可以将值对象及其转换逻辑定义为单个可转换对象。为此，请从值对象的 `castUsing` 方法返回一个匿名类。该匿名类应当实现 `CastsAttributes` 接口：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ...

    /**
     * 获取转换到 / 从该转换目标时使用的转换器类。
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
