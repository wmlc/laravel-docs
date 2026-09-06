# Eloquent：修改器与类型转换

## 简介

访问器、修改器和属性转换（attribute casting）允许你在模型实例上获取或设置 Eloquent 属性值时，对属性值进行转换。例如，你可能希望使用 [Laravel 加密器](/topic/Laravel%2013.x/enyd5k197d.html) 将某个值在存入数据库时进行加密，然后在 Eloquent 模型上访问该属性时自动解密。或者，你可能希望将数据库中存储的 JSON 字符串，通过 Eloquent 模型访问时转换为数组。

## 访问器与修改器

### 定义访问器

访问器会在访问某个 Eloquent 属性值时对其进行转换。要定义访问器，你可以在模型上创建一个受保护的方法来表示该可访问属性。在适用的情况下，该方法名应与真实底层模型属性 / 数据库列的"驼峰式（camel case）"表示相对应。

在此示例中，我们将为 `first_name` 属性定义一个访问器。当尝试获取 `first_name` 属性的值时，Eloquent 会自动调用该访问器。所有属性访问器 / 修改器方法都必须声明 `Illuminate\Database\Eloquent\Casts\Attribute` 返回类型提示：

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

所有访问器方法都会返回一个 `Attribute` 实例，该实例定义了如何访问（以及可选的修改）该属性。在此示例中，我们仅定义了如何访问该属性。为此，我们向 `Attribute` 类构造函数提供了 `get` 参数。

如你所见，列的原始值会传给访问器，让你能够操作并返回该值。要访问访问器的值，你只需访问模型实例上的 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> [!NOTE]
> 如果你希望这些计算值被添加到模型的数组 / JSON 表示中，[你需要将它们追加进去](/topic/Laravel%2013.x/m892ge6y01.html)。

#### 从多个属性构建值对象

有时你的访问器可能需要将多个模型属性转换为一个单一的"值对象（value object）"。为此，你的 `get` 闭包可以接受第二个 `$attributes` 参数，该参数会被自动提供给闭包，并包含模型所有当前属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 处理用户的地址。
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

#### 访问器缓存

当从访问器返回值对象时，对该值对象所做的任何更改都会在模型保存前自动同步回模型。这之所以可行，是因为 Eloquent 会保留访问器返回的实例，这样每次调用访问器时都会返回同一个实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Line 1 Value';
$user->address->lineTwo = 'Updated Address Line 2 Value';

$user->save();
```

不过，有时你可能会希望对字符串和布尔值这样的基本类型启用缓存，尤其是当它们的计算开销较大时。为此，你可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你希望禁用属性的对象缓存行为，可以在定义属性时调用 `withoutObjectCaching` 方法：

```php
/**
 * 处理用户的地址。
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

### 定义修改器

修改器会在设置某个 Eloquent 属性值时对其进行转换。要定义修改器，你可以在定义属性时提供 `set` 参数。我们来为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，会自动调用该修改器：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 处理用户的名字。
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

修改器闭包会接收正在设置到该属性上的值，让你可以操作该值并返回操作后的结果。要使用我们的修改器，只需在 Eloquent 模型上设置 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在此示例中，`set` 回调会以值 `Sally` 被调用。然后修改器会对该名字应用 `strtolower` 函数，并将结果值设置到模型的内部 `$attributes` 数组中。

#### 修改多个属性

有时你的修改器可能需要在底层模型上设置多个属性。为此，你可以从 `set` 闭包中返回一个数组。数组中的每个键都应与模型关联的某个底层属性 / 数据库列相对应：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 处理用户的地址。
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

## 属性转换

属性转换提供了与访问器和修改器类似的功能，而无需你在模型上定义任何额外方法。相反，模型的 `casts` 方法提供了一种便捷的方式，将属性转换为常见数据类型。

`casts` 方法应返回一个数组，其中键是要转换的属性名，值是你希望将该列转换成的类型。支持的类型转换包括：

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

为了演示属性转换，我们来将 `is_admin` 属性转换为布尔值，该属性在数据库中以整数（`0` 或 `1`）形式存储：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
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

定义转换后，即使底层值在数据库中以整数形式存储，当你访问 `is_admin` 属性时，它也会始终被转换为布尔值：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    // ...
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
> 值为 `null` 的属性不会被转换。此外，你绝不应定义一个与某个关联同名的转换（或属性），也不应将转换分配给模型的主键。

#### Stringable 转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 转换类，将模型属性转换为 [流畅的 Illuminate\Support\Stringable 对象](/topic/Laravel%2013.x/2ev86royor.html)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
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

### 数组与 JSON 转换

当你处理以序列化 JSON 形式存储的列时，`array` 转换特别有用。例如，如果你的数据库中有一个包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，为该属性添加 `array` 转换后，当你在 Eloquent 模型上访问它时，它会自动将该属性反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
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

定义转换后，你可以访问 `options` 属性，它会自动从 JSON 反序列化为 PHP 数组。当你设置 `options` 属性的值时，给定的数组会自动被序列化回 JSON 以便存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

要以更简洁的语法更新 JSON 属性的单个字段，你可以 [使该属性可批量赋值](/topic/Laravel%2013.x/rwyl2kxvz8.html)，并在调用 `update` 方法时使用 `->` 运算符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

#### JSON 与 Unicode

如果你希望将数组属性存储为带有未转义 Unicode 字符的 JSON，可以使用 `json:unicode` 转换：

```php
/**
 * 获取应进行类型转换的属性。
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

#### 数组对象与集合转换

尽管标准的 `array` 转换对许多应用来说已经足够，但它确实有一些缺点。由于 `array` 转换返回的是基本类型，因此无法直接修改数组的某个偏移量。例如，以下代码会触发 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为了解决这个问题，Laravel 提供了 `AsArrayObject` 转换，它将你的 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。该特性是通过 Laravel 的 自定义转换 实现来完成的，这让 Laravel 能够智能地缓存并转换被修改的对象，从而可以在不触发 PHP 错误的情况下修改单个偏移量。要使用 `AsArrayObject` 转换，只需将它赋值给某个属性：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 获取应进行类型转换的属性。
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

类似地，Laravel 提供了 `AsCollection` 转换，它将你的 JSON 属性转换为 Laravel [集合（Collection）](/topic/Laravel%2013.x/4rvgn63ydj.html) 实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
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

如果你希望 `AsCollection` 转换实例化一个自定义集合类，而不是 Laravel 的基础集合类，你可以将集合类名作为转换参数提供：

```php
use App\Collections\OptionCollection;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
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

`of` 方法可用于指示集合项应通过集合的 [mapInto 方法](/topic/Laravel%2013.x/4rvgn63ydj.html) 映射到一个给定类：

```php
use App\ValueObjects\Option;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
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

将集合映射到对象时，该对象应实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，以定义其实例应如何作为 JSON 序列化到数据库：

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
     * 指定应序列化为 JSON 的数据。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

### 向量转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsVector` 转换类，将数据库的向量（vector）列在 PHP 数组之间进行转换：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

/**
 * 获取应进行类型转换的属性。
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

### 二进制转换

如果你的 Eloquent 模型除了自增 ID 列之外，还有一个 [二进制类型](/topic/Laravel%2013.x/x3vo0g4vm1.html) 的 `uuid` 或 `ulid` 列，你可以使用 `AsBinary` 转换，自动将值在其二进制表示形式之间进行转换：

```php
use Illuminate\Database\Eloquent\Casts\AsBinary;

/**
 * 获取应进行类型转换的属性。
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

在模型上定义转换后，你可以将 UUID / ULID 属性值设置为对象实例或字符串。Eloquent 会自动将该值转换为其二进制表示形式。获取该属性的值时，你始终会收到一个纯文本字符串值：

```php
use Illuminate\Support\Str;

$user->uuid = Str::uuid();

return $user->uuid;

// "6e8cdeed-2f32-40bd-b109-1e4405be2140"
```

### 日期转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 的实例，它继承自 PHP 的 `DateTime` 类，并提供一系列实用方法。你可以通过在模型的 `casts` 方法中定义额外的日期转换，来转换其他日期属性。通常，日期应使用 `datetime` 或 `immutable_datetime` 转换类型进行转换。

在定义 `date` 或 `datetime` 转换时，你还可以指定日期的格式。当 [模型被序列化为数组或 JSON](/topic/Laravel%2013.x/m892ge6y01.html) 时，会使用该格式：

```php
/**
 * 获取应进行类型转换的属性。
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

当某列被转换为日期时，你可以将对应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串，或 `DateTime` / `Carbon` 实例。该日期的值会被正确转换并存储到你的数据库中。

你可以通过在模型上定义 `serializeDate` 方法，来自定义模型所有日期的默认序列化格式。该方法不影响你的日期在数据库中的存储格式：

```php
/**
 * 为数组 / JSON 序列化准备一个日期。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

要指定将模型日期实际存入数据库时所使用的格式，你应该使用模型 `Table` 属性上的 `dateFormat` 参数：

```php
use Illuminate\Database\Eloquent\Attributes\Table;

#[Table(dateFormat: 'U')]
class Flight extends Model
{
    // ...
}
```

#### 日期转换、序列化与时区

默认情况下，`date` 和 `datetime` 转换会将日期序列化为 UTC 的 ISO-8601 日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`），无论你应用的 `timezone` 配置选项中指定的时区是什么。我们强烈建议你始终使用这种序列化格式，并且不要将应用的 `timezone` 配置选项从其默认的 `UTC` 值更改，从而将应用的日期存储在 UTC 时区中。在整个应用中一致地使用 UTC 时区，能够与 PHP 和 JavaScript 编写的其它日期操作库提供最高程度的互操作性。

如果对 `date` 或 `datetime` 转换应用了自定义格式（例如 `datetime:Y-m-d H:i:s`），在日期序列化时会使用 Carbon 实例的内部时区。通常，这就是你应用 `timezone` 配置选项中指定的时区。不过需要注意，`created_at` 和 `updated_at` 这样的 `timestamp` 列不受此行为影响，无论应用的时区设置如何，它们始终以 UTC 格式进行格式化。

### 枚举转换

Eloquent 还允许你将属性值转换为 PHP [枚举（Enum）](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，你可以在模型的 `casts` 方法中指定你希望转换的属性与枚举：

```php
use App\Enums\ServerStatus;

/**
 * 获取应进行类型转换的属性。
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

在模型上定义转换后，当你与该属性交互时，指定的属性会自动在枚举之间进行转换：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

#### 枚举数组转换

有时你可能需要让模型在单个列中存储一组枚举值。为此，你可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 获取应进行类型转换的属性。
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

### 加密转换

`encrypted` 转换会使用 Laravel 内置的 [加密](/topic/Laravel%2013.x/enyd5k197d.html) 功能对模型属性值进行加密。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 转换与其未加密的对应转换工作方式相同；不过正如你所料，底层值在存入数据库时会被加密。

由于加密文本的最终长度不可预测，且比其明文对应物更长，请确保相关的数据库列是 `TEXT` 类型或更大的类型。此外，由于这些值在数据库中是加密的，你将无法查询或搜索已加密的属性值。

#### 密钥轮换

如你所知，Laravel 使用应用 `app` 配置文件中指定的 `key` 配置值来加密字符串。通常，该值对应于 `APP_KEY` 环境变量的值。如果你需要轮换应用的加密密钥，可以 [优雅地进行](/topic/Laravel%2013.x/enyd5k197d.html)。

### 查询时转换

有时你可能需要在执行查询时应用转换，例如从表中选取原始值时。请看以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->get();
```

此查询结果中的 `last_posted_at` 属性将是一个简单的字符串。如果我们能在执行查询时对这个属性应用 `datetime` 转换就太好了。幸运的是，我们可以使用 `withCasts` 方法来实现：

```php
$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->withCasts([
    'last_posted_at' => 'datetime'
])->get();
```

## 自定义转换

Laravel 有各种内置的、实用的转换类型；不过，有时你可能需要定义自己的转换类型。要创建一个转换，请执行 `make:cast` Artisan 命令。新的转换类会被放置在你的 `app/Casts` 目录中：

```shell
php artisan make:cast AsJson
```

所有自定义转换类都实现了 `CastsAttributes` 接口。实现该接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责将数据库中的原始值转换为转换后的值，而 `set` 方法应将转换后的值转换为可存入数据库的原始值。作为示例，我们将把内置的 `json` 转换类型重新实现为一个自定义转换类型：

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
     * 为存储准备给定的值。
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

定义好自定义转换类型后，你可以使用它的类名将其附加到模型属性上：

```php
<?php

namespace App\Models;

use App\Casts\AsJson;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
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

### 值对象转换

你不仅限于将值转换为基本类型，也可以将值转换为对象。定义将值转换为对象的自定义转换，与转换为基本类型非常相似；不过，如果你的对象值包含多个数据库列，那么 `set` 方法必须返回一个键值对数组，用于在模型上设置原始的、可存储的值。如果你的对象值只影响单个列，你只需返回可存储的值即可。

作为示例，我们将定义一个自定义转换类，将多个模型值转换为一个单一的 `Address` 值对象。我们假设 `Address` 值对象有两个公共属性：`lineOne` 和 `lineTwo`：

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
     * 为存储准备给定的值。
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
> 如果你计划将包含值对象的 Eloquent 模型序列化为 JSON 或数组，你应该在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

#### 值对象缓存

当转换为值对象的属性被解析时，它们会被 Eloquent 缓存。因此，如果再次访问该属性，会返回同一个对象实例。

如果你希望禁用自定义转换类的对象缓存行为，可以在自定义转换类上声明一个公共的 `withoutObjectCaching` 属性：

```php
class AsAddress implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ...
}
```

### 数组 / JSON 序列化

当使用 `toArray` 和 `toJson` 方法将 Eloquent 模型转换为数组或 JSON 时，只要你的自定义转换值对象实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，它们通常也会被序列化。不过，在使用第三方库提供的值对象时，你可能无法为该对象添加这些接口。

因此，你可以指定由你的自定义转换类来负责序列化该值对象。为此，你的自定义转换类应实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。该接口要求你的类包含一个 `serialize` 方法，该方法应返回你值对象的序列化形式：

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

### 入站转换

有时你可能需要编写一个自定义转换类，它只转换正在设置到模型上的值，而在从模型获取属性时不执行任何操作。

仅入站的自定义转换应实现 `CastsInboundAttributes` 接口，该接口只要求定义一个 `set` 方法。可以使用带 `--inbound` 选项的 `make:cast` Artisan 命令来生成仅入站的转换类：

```shell
php artisan make:cast AsHash --inbound
```

仅入站转换的一个典型示例是"哈希"转换。例如，我们可以定义一个通过给定算法对入站值进行哈希的转换：

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
     * 为存储准备给定的值。
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

### 转换参数

将自定义转换附加到模型时，可以通过 `:` 字符将转换参数与类名分隔开，多个参数之间用逗号分隔。这些参数会被传给转换类的构造函数：

```php
/**
 * 获取应进行类型转换的属性。
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

### 比较转换值

如果你希望定义如何比较两个给定的转换值，以判断它们是否发生了变化，你的自定义转换类可以实现 `Illuminate\Contracts\Database\Eloquent\ComparesCastableAttributes` 接口。这让你能够精细控制 Eloquent 认为哪些值发生了变化，从而在模型更新时保存到数据库。

该接口要求你的类包含一个 `compare` 方法，如果两个给定值被认为相等，该方法应返回 `true`：

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

### Castables

你可能希望让应用的值对象定义它们自己的自定义转换类。除了将自定义转换类附加到模型上之外，你也可以附加一个实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class,
    ];
}
```

实现了 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责与该 `Castable` 类之间进行转换的自定义转换类名：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\AsAddress;

class Address implements Castable
{
    /**
     * 获取从 / 向此转换目标进行转换时应使用的转换类名。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): string
    {
        return AsAddress::class;
    }
}
```

使用 `Castable` 类时，你仍然可以在 `casts` 方法定义中提供参数。这些参数会被传给 `castUsing` 方法：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class.':argument',
    ];
}
```

#### Castables 与匿名转换类

通过将"castables"与 PHP 的 [匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php) 结合，你可以将值对象及其转换逻辑定义为单个可转换对象。为此，从值对象的 `castUsing` 方法返回一个匿名类。该匿名类应实现 `CastsAttributes` 接口：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ...

    /**
     * 获取从 / 向此转换目标进行转换时应使用的转换类。
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