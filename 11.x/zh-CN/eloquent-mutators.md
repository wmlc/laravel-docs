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
    - [数组／JSON 序列化](#array-json-serialization)
    - [入站类型转换](#inbound-casting)
    - [转换参数](#cast-parameters)
    - [可转换对象](#castables)

<a name="introduction"></a>
## 简介

访问器、修改器和属性类型转换让你在模型实例上获取或设置 Eloquent 属性值时对其进行转换。例如，你可能希望使用 [Laravel 加密器](/docs/{{version}}/encryption)在值存入数据库时对其加密，并在通过 Eloquent 模型访问该属性时自动解密。又或者，你可能希望把存放在数据库中的 JSON 字符串在通过 Eloquent 模型访问时转换为数组。

<a name="accessors-and-mutators"></a>
## 访问器与修改器

<a name="defining-an-accessor"></a>
### 定义访问器

访问器在访问 Eloquent 属性值时对其进行转换。要定义访问器，请在模型上创建一个受保护的方法来表示该可访问属性。在适用的情况下，该方法名应当对应底层真实模型属性／数据库列的「驼峰式」写法。

在这个示例中，我们将为 `first_name` 属性定义一个访问器。当尝试获取 `first_name` 属性的值时，Eloquent 会自动调用该访问器。所有属性访问器／修改器方法都必须声明返回类型提示 `Illuminate\Database\Eloquent\Casts\Attribute`：

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

所有访问器方法都返回一个 `Attribute` 实例，它定义了该属性如何被访问，以及可选地如何被修改。在这个示例中，我们只定义了该属性如何被访问。为此，我们向 `Attribute` 类构造函数传入 `get` 参数。

如你所见，列的原始值会被传入访问器，让你能够对该值进行加工并返回。要获取访问器的值，只需在模型实例上访问 `first_name` 属性即可：

    use App\Models\User;

    $user = User::find(1);

    $firstName = $user->first_name;

> [!NOTE]
> 如果希望把这些计算得出的值也加入模型的数组／JSON 表示中，[你需要把它们追加进去](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。

<a name="building-value-objects-from-multiple-attributes"></a>
#### 从多个属性构建值对象

有时你的访问器需要把多个模型属性转换为单个「值对象」。为此，你的 `get` 闭包可以接受第二个参数 `$attributes`，该参数会自动传入闭包，其中包含模型当前所有属性的数组：

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

当从访问器返回值对象时，对该值对象所做的任何改动都会在模型保存之前自动同步回模型。之所以能这样做，是因为 Eloquent 会保留访问器返回的实例，从而在每次调用访问器时都返回同一个实例：

    use App\Models\User;

    $user = User::find(1);

    $user->address->lineOne = 'Updated Address Line 1 Value';
    $user->address->lineTwo = 'Updated Address Line 2 Value';

    $user->save();

不过，有时你可能希望为字符串、布尔值这类基本类型启用缓存，尤其是在它们计算量较大时。为此，你可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你想禁用属性的对象缓存行为，可以在定义该属性时调用 `withoutObjectCaching` 方法：

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

修改器在设置 Eloquent 属性值时对其进行转换。要定义修改器，你可以在定义属性时传入 `set` 参数。让我们为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，该修改器会被自动调用：

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

修改器闭包会接收到正在设置到该属性上的值，让你能够对该值进行加工并返回加工后的值。要使用我们的修改器，只需在 Eloquent 模型上设置 `first_name` 属性：

    use App\Models\User;

    $user = User::find(1);

    $user->first_name = 'Sally';

在这个示例中，`set` 回调会接收到值 `Sally`。随后修改器会对该名字应用 `strtolower` 函数，并把结果存入模型内部的 `$attributes` 数组。

<a name="mutating-multiple-attributes"></a>
#### 修改多个属性

有时你的修改器需要在底层模型上设置多个属性。为此，你可以在 `set` 闭包中返回一个数组。数组中的每个键都应对应与该模型关联的底层属性／数据库列：

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
## 属性类型转换

属性类型转换提供与访问器、修改器类似的功能，无需你在模型上定义任何额外方法。相反，你的模型的 `casts` 方法提供了一种便捷方式，把属性转换为常见数据类型。

`casts` 方法应当返回一个数组，其中键为被转换属性的名称，值为你希望把该列转换成的类型。支持的转换类型有：

<div class="content-list" markdown="1">

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
- `hashed`
- `integer`
- `object`
- `real`
- `string`
- `timestamp`

</div>

为了演示属性类型转换，我们把 `is_admin` 属性（它在数据库中以整数 `0` 或 `1` 存储）转换为布尔值：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 获取应当被转换的属性。
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

定义转换后，访问 `is_admin` 属性时它总会转换为布尔值，即使底层值在数据库中以整数形式存储：

    $user = App\Models\User::find(1);

    if ($user->is_admin) {
        // ...
    }

如果需要在运行时添加一个新的临时转换，可以使用 `mergeCasts` 方法。这些转换定义会被添加到模型上已有的任何转换之上：

    $user->mergeCasts([
        'is_admin' => 'integer',
        'options' => 'object',
    ]);

> [!WARNING]
> 值为 `null` 的属性不会被转换。此外，你绝不应当定义与某个关联同名的转换（或属性），也不应当把转换赋给模型的主键。

<a name="stringable-casting"></a>
#### Stringable 类型转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 转换类，把模型属性转换为[链式的 `Illuminate\Support\Stringable` 对象](/docs/{{version}}/strings#fluent-strings-method-list)：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Casts\AsStringable;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 获取应当被转换的属性。
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

<a name="array-and-json-casting"></a>
### 数组与 JSON 类型转换

`array` 转换在处理以序列化 JSON 存储的列时尤为有用。例如，如果你的数据库有一个包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，为该属性添加 `array` 转换后，通过 Eloquent 模型访问它时会自动把该属性反序列化为 PHP 数组：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 获取应当被转换的属性。
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

定义转换后，你可以访问 `options` 属性，它会自动从 JSON 反序列化为 PHP 数组。当你设置 `options` 属性的值时，给定的数组会自动被序列化回 JSON 以便存储：

    use App\Models\User;

    $user = User::find(1);

    $options = $user->options;

    $options['key'] = 'value';

    $user->options = $options;

    $user->save();

如果想用更简洁的语法更新 JSON 属性中的单个字段，你可以[让该属性可批量赋值](/docs/{{version}}/eloquent#mass-assignment-json-columns)，并在调用 `update` 方法时使用 `->` 运算符：

    $user = User::find(1);

    $user->update(['options->key' => 'value']);

<a name="array-object-and-collection-casting"></a>
#### 数组对象与集合类型转换

虽然标准的 `array` 转换对许多应用来说已经足够，但它确实存在一些缺点。由于 `array` 转换返回的是基本类型，因此无法直接修改数组的某个下标。例如，以下代码会触发 PHP 错误：

    $user = User::find(1);

    $user->options['key'] = $value;

为解决这一问题，Laravel 提供了 `AsArrayObject` 转换，可把 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。该特性使用 Laravel 的[自定义转换](#custom-casts)实现，这让 Laravel 能够智能地缓存并转换被修改的对象，从而可以修改单个下标而不会触发 PHP 错误。要使用 `AsArrayObject` 转换，只需把它赋给某个属性：

    use Illuminate\Database\Eloquent\Casts\AsArrayObject;

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsArrayObject::class,
        ];
    }

类似地，Laravel 提供了 `AsCollection` 转换，可把 JSON 属性转换为 Laravel 的[集合](/docs/{{version}}/collections)实例：

    use Illuminate\Database\Eloquent\Casts\AsCollection;

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsCollection::class,
        ];
    }

如果你希望 `AsCollection` 转换实例化一个自定义集合类，而不是 Laravel 的基础集合类，可以把集合类名作为转换参数传入：

    use App\Collections\OptionCollection;
    use Illuminate\Database\Eloquent\Casts\AsCollection;

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsCollection::using(OptionCollection::class),
        ];
    }

<a name="date-casting"></a>
### 日期类型转换

默认情况下，Eloquent 会把 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 实例，它继承自 PHP 的 `DateTime` 类并提供了丰富实用的方法。你可以通过在模型的 `casts` 方法中定义额外的日期转换来转换其它日期属性。通常情况下，日期应当使用 `datetime` 或 `immutable_datetime` 转换类型。

定义 `date` 或 `datetime` 转换时，你还可以指定日期格式。该格式会在[模型被序列化为数组或 JSON](/docs/{{version}}/eloquent-serialization)时使用：

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime:Y-m-d',
        ];
    }

当某一列被转换为日期时，你可以把对应的模型属性值设为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串，或一个 `DateTime`／`Carbon` 实例。该日期的值会被正确转换并存入数据库。

你可以通过在模型上定义 `serializeDate` 方法，自定义模型所有日期的默认序列化格式。该方法不会影响日期在数据库中存储时的格式：

    /**
     * 为数组／JSON 序列化准备日期。
     */
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

要指定模型日期实际存入数据库时所使用的格式，你应当在模型上定义 `$dateFormat` 属性：

    /**
     * 模型日期列的存储格式。
     *
     * @var string
     */
    protected $dateFormat = 'U';

<a name="date-casting-and-timezones"></a>
#### 日期类型转换、序列化与时区

默认情况下，`date` 和 `datetime` 转换会把日期序列化为 UTC ISO-8601 日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`），无论你的应用 `timezone` 配置选项指定的是哪个时区。我们强烈建议你始终使用这一序列化格式，并且不要把应用的 `timezone` 配置选项从其默认值 `UTC` 改掉，从而让应用的日期以 UTC 时区存储。在整个应用中一致地使用 UTC 时区，可以让你与其它用 PHP 和 JavaScript 编写的日期处理库获得最大程度的互操作性。

如果对 `date` 或 `datetime` 转换应用了自定义格式，例如 `datetime:Y-m-d H:i:s`，那么日期序列化时将使用 Carbon 实例内部的时区。通常情况下，这就是你的应用 `timezone` 配置选项所指定的时区。不过需要注意，像 `created_at` 和 `updated_at` 这样的 `timestamp` 列不受此行为影响，它们始终以 UTC 格式化，无论应用的时区设置如何。

<a name="enum-casting"></a>
### 枚举类型转换

Eloquent 还允许你把属性值转换为 PHP [枚举](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，你可以在模型的 `casts` 方法中指定希望转换的属性和枚举：

    use App\Enums\ServerStatus;

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ServerStatus::class,
        ];
    }

在模型上定义好转换后，当你与该属性交互时，指定属性会自动在枚举与原始值之间双向转换：

    if ($server->status == ServerStatus::Provisioned) {
        $server->status = ServerStatus::Ready;

        $server->save();
    }

<a name="casting-arrays-of-enums"></a>
#### 转换枚举数组

有时你可能需要让模型在单个列中存储一组枚举值。为此，你可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 转换：

    use App\Enums\ServerStatus;
    use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'statuses' => AsEnumCollection::of(ServerStatus::class),
        ];
    }

<a name="encrypted-casting"></a>
### 加密类型转换

`encrypted` 转换会使用 Laravel 内置的[加密](/docs/{{version}}/encryption)特性加密模型的属性值。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 转换的工作方式与它们未加密的对应版本相同；不过正如你所料，其底层值在数据库中存储时会被加密。

由于加密文本的最终长度不可预测，且比对应的明文更长，请确保相关的数据库列类型为 `TEXT` 或更大。此外，由于这些值在数据库中是加密的，你将无法查询或搜索加密的属性值。

<a name="key-rotation"></a>
#### 密钥轮换

你可能已经知道，Laravel 使用应用 `app` 配置文件中指定的 `key` 配置值对字符串进行加密。通常情况下，该值对应 `APP_KEY` 环境变量的值。如果你需要轮换应用的加密密钥，就必须使用新密钥手动重新加密已加密的属性。

<a name="query-time-casting"></a>
### 查询时类型转换

有时你可能需要在执行查询时应用转换，例如从表中选取原始值时。举例来说，请考虑以下查询：

    use App\Models\Post;
    use App\Models\User;

    $users = User::select([
        'users.*',
        'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
    ])->get();

该查询结果中的 `last_posted_at` 属性会是一个简单字符串。如果能在执行查询时对该属性应用 `datetime` 转换那就太好了。幸运的是，我们可以用 `withCasts` 方法实现这一点：

    $users = User::select([
        'users.*',
        'last_posted_at' => Post::selectRaw('MAX(created_at)')
            ->whereColumn('user_id', 'users.id')
    ])->withCasts([
        'last_posted_at' => 'datetime'
    ])->get();

<a name="custom-casts"></a>
## 自定义类型转换

Laravel 内置了多种实用的转换类型；不过，你偶尔可能需要定义自己的转换类型。要创建转换，请执行 `make:cast` Artisan 命令。新的转换类会被放到 `app/Casts` 目录中：

```shell
php artisan make:cast Json
```

所有自定义转换类都实现 `CastsAttributes` 接口。实现该接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责把来自数据库的原始值转换为转换后的值，而 `set` 方法应当把转换后的值转换为可存入数据库的原始值。举个例子，我们将把内置的 `json` 转换类型重新实现为一个自定义转换类型：

    <?php

    namespace App\Casts;

    use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
    use Illuminate\Database\Eloquent\Model;

    class Json implements CastsAttributes
    {
        /**
         * 转换给定的值。
         *
         * @param  array<string, mixed>  $attributes
         * @return array<string, mixed>
         */
        public function get(Model $model, string $key, mixed $value, array $attributes): array
        {
            return json_decode($value, true);
        }

        /**
         * 为存储准备给定的值。
         *
         * @param  array<string, mixed>  $attributes
         */
        public function set(Model $model, string $key, mixed $value, array $attributes): string
        {
            return json_encode($value);
        }
    }

定义好自定义转换类型后，你可以使用其类名把它挂到模型属性上：

    <?php

    namespace App\Models;

    use App\Casts\Json;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 获取应当被转换的属性。
         *
         * @return array<string, string>
         */
        protected function casts(): array
        {
            return [
                'options' => Json::class,
            ];
        }
    }

<a name="value-object-casting"></a>
### 值对象类型转换

你并不局限于把值转换为基本类型，也可以把值转换为对象。定义把值转换为对象的自定义转换，与转换为基本类型非常类似；不过 `set` 方法应当返回一个键／值对数组，用于在模型上设置可存储的原始值。

举个例子，我们将定义一个自定义转换类，把多个模型值转换为单个 `Address` 值对象。我们假设 `Address` 值有两个公开属性：`lineOne` 和 `lineTwo`：

    <?php

    namespace App\Casts;

    use App\ValueObjects\Address as AddressValueObject;
    use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
    use Illuminate\Database\Eloquent\Model;
    use InvalidArgumentException;

    class Address implements CastsAttributes
    {
        /**
         * 转换给定的值。
         *
         * @param  array<string, mixed>  $attributes
         */
        public function get(Model $model, string $key, mixed $value, array $attributes): AddressValueObject
        {
            return new AddressValueObject(
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
        public function set(Model $model, string $key, mixed $value, array $attributes): array
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

当转换为值对象时，对该值对象所做的任何改动都会在模型保存之前自动同步回模型：

    use App\Models\User;

    $user = User::find(1);

    $user->address->lineOne = 'Updated Address Value';

    $user->save();

> [!NOTE]
> 如果你打算把包含值对象的 Eloquent 模型序列化为 JSON 或数组，就应当在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

<a name="value-object-caching"></a>
#### 值对象缓存

当被转换为值对象的属性被解析时，Eloquent 会对其加以缓存。因此，再次访问该属性时返回的是同一个对象实例。

如果你想禁用自定义转换类的对象缓存行为，可以在自定义转换类上声明一个公开的 `withoutObjectCaching` 属性：

```php
class Address implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ...
}
```

<a name="array-json-serialization"></a>
### 数组／JSON 序列化

当使用 `toArray` 和 `toJson` 方法把 Eloquent 模型转换为数组或 JSON 时，只要自定义转换的值对象实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，它们通常也会被一并序列化。不过，使用第三方库提供的值对象时，你可能无法为该对象添加这些接口。

因此，你可以指定由自定义转换类负责序列化该值对象。为此，你的自定义转换类应当实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。该接口要求你的类包含一个 `serialize` 方法，该方法应返回值对象的序列化形式：

    /**
     * 获取该值的序列化表示。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function serialize(Model $model, string $key, mixed $value, array $attributes): string
    {
        return (string) $value;
    }

<a name="inbound-casting"></a>
### 入站类型转换

偶尔你可能需要编写一个自定义转换类，它只转换设置到模型上的值，而在从模型获取属性时不执行任何操作。

仅入站的自定义转换应当实现 `CastsInboundAttributes` 接口，该接口只要求定义 `set` 方法。调用 `make:cast` Artisan 命令时可以加上 `--inbound` 选项，以生成一个仅入站的转换类：

```shell
php artisan make:cast Hash --inbound
```

仅入站转换的经典例子是「哈希」转换。例如，我们可以定义一个通过指定算法对入站值进行哈希的转换：

    <?php

    namespace App\Casts;

    use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;
    use Illuminate\Database\Eloquent\Model;

    class Hash implements CastsInboundAttributes
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
        public function set(Model $model, string $key, mixed $value, array $attributes): string
        {
            return is_null($this->algorithm)
                ? bcrypt($value)
                : hash($this->algorithm, $value);
        }
    }

<a name="cast-parameters"></a>
### 转换参数

把自定义转换挂到模型上时，可以用 `:` 字符把转换参数与类名分开，并用逗号分隔多个参数，从而指定转换参数。这些参数会被传给转换类的构造函数：

    /**
     * 获取应当被转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'secret' => Hash::class.':sha256',
        ];
    }

<a name="castables"></a>
### 可转换对象

你可能希望允许应用的值对象自行定义自定义转换类。为此，你可以不把自定义转换类挂到模型上，而是改为挂一个实现了 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类：

    use App\ValueObjects\Address;

    protected function casts(): array
    {
        return [
            'address' => Address::class,
        ];
    }

实现了 `Castable` 接口的对象必须定义一个 `castUsing` 方法，它返回负责与该 `Castable` 类相互转换的自定义转换器类名：

    <?php

    namespace App\ValueObjects;

    use Illuminate\Contracts\Database\Eloquent\Castable;
    use App\Casts\Address as AddressCast;

    class Address implements Castable
    {
        /**
         * 获取与该转换目标相互转换时使用的转换器类名。
         *
         * @param  array<string, mixed>  $arguments
         */
        public static function castUsing(array $arguments): string
        {
            return AddressCast::class;
        }
    }

使用 `Castable` 类时，你仍然可以在 `casts` 方法定义中提供参数。这些参数会被传给 `castUsing` 方法：

    use App\ValueObjects\Address;

    protected function casts(): array
    {
        return [
            'address' => Address::class.':argument',
        ];
    }

<a name="anonymous-cast-classes"></a>
#### 可转换对象与匿名转换类

把「可转换对象」与 PHP 的[匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php)结合起来，你就可以把一个值对象及其转换逻辑定义为单个可转换对象。为此，请从你的值对象的 `castUsing` 方法中返回一个匿名类。该匿名类应当实现 `CastsAttributes` 接口：

    <?php

    namespace App\ValueObjects;

    use Illuminate\Contracts\Database\Eloquent\Castable;
    use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

    class Address implements Castable
    {
        // ...

        /**
         * 获取与该转换目标相互转换时使用的转换器类。
         *
         * @param  array<string, mixed>  $arguments
         */
        public static function castUsing(array $arguments): CastsAttributes
        {
            return new class implements CastsAttributes
            {
                public function get(Model $model, string $key, mixed $value, array $attributes): Address
                {
                    return new Address(
                        $attributes['address_line_one'],
                        $attributes['address_line_two']
                    );
                }

                public function set(Model $model, string $key, mixed $value, array $attributes): array
                {
                    return [
                        'address_line_one' => $value->lineOne,
                        'address_line_two' => $value->lineTwo,
                    ];
                }
            };
        }
    }
