# Eloquent：序列化

- [简介](#introduction)
- [序列化模型与集合](#serializing-models-and-collections)
    - [序列化为数组](#serializing-to-arrays)
    - [序列化为 JSON](#serializing-to-json)
- [在 JSON 中隐藏属性](#hiding-attributes-from-json)
- [在 JSON 中追加值](#appending-values-to-json)
- [日期序列化](#date-serialization)

<a name="introduction"></a>
## 简介

使用 Laravel 构建 API 时，经常需要将模型和关联转换为数组或 JSON。Eloquent 提供了便捷的方法来完成这些转换，并能控制哪些属性包含在模型的序列化表示中。

> **Note**  
> 如需更健壮地处理 Eloquent 模型和集合的 JSON 序列化，请查阅 [Eloquent API 资源](/docs/{{version}}/eloquent-resources)文档。

<a name="serializing-models-and-collections"></a>
## 序列化模型与集合

<a name="serializing-to-arrays"></a>
### 序列化为数组

要将模型及其加载的[关联](/docs/{{version}}/eloquent-relationships)转换为数组，应使用 `toArray` 方法。该方法是递归的，因此所有属性和所有关联（包括关联的关联）都会被转换为数组：

    use App\Models\User;

    $user = User::with('roles')->first();

    return $user->toArray();

可以使用 `attributesToArray` 方法将模型的属性转换为数组，但不包含关联：

    $user = User::first();

    return $user->attributesToArray();

也可以在集合实例上调用 `toArray` 方法，将整个模型[集合](/docs/{{version}}/eloquent-collections)转换为数组：

    $users = User::all();

    return $users->toArray();

<a name="serializing-to-json"></a>
### 序列化为 JSON

要将模型转换为 JSON，应使用 `toJson` 方法。与 `toArray` 一样，`toJson` 方法也是递归的，所有属性和关联都会被转换为 JSON。还可以指定任何 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

    use App\Models\User;

    $user = User::find(1);

    return $user->toJson();

    return $user->toJson(JSON_PRETTY_PRINT);

或者，可以将模型或集合转换为字符串，这会自动调用模型或集合上的 `toJson` 方法：

    return (string) User::find(1);

由于模型和集合在转换为字符串时会被转为 JSON，因此可以直接从应用的路由或控制器返回 Eloquent 对象。当从路由或控制器返回 Eloquent 模型和集合时，Laravel 会自动将其序列化为 JSON：

    Route::get('users', function () {
        return User::all();
    });

<a name="relationships"></a>
#### 关联

当 Eloquent 模型转换为 JSON 时，其加载的关联会自动作为属性包含在 JSON 对象中。此外，虽然 Eloquent 关联方法使用"驼峰式"方法名定义，但关联的 JSON 属性将采用"蛇形"命名。

<a name="hiding-attributes-from-json"></a>
## 在 JSON 中隐藏属性

有时可能希望限制包含在模型数组或 JSON 表示中的属性，例如密码。为此，可以在模型中添加 `$hidden` 属性。列在 `$hidden` 属性数组中的属性不会包含在模型的序列化表示中：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 应在数组中隐藏的属性。
         *
         * @var array
         */
        protected $hidden = ['password'];
    }

> **Note**  
> 如需隐藏关联，请将关联的方法名添加到 Eloquent 模型的 `$hidden` 属性中。

或者，可以使用 `visible` 属性定义一个"允许列表"，指定应包含在模型数组和 JSON 表示中的属性。当模型转换为数组或 JSON 时，所有不在 `$visible` 数组中的属性都会被隐藏：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 应在数组中可见的属性。
         *
         * @var array
         */
        protected $visible = ['first_name', 'last_name'];
    }

<a name="temporarily-modifying-attribute-visibility"></a>
#### 临时修改属性可见性

如果希望让某些通常隐藏的属性在给定模型实例中可见，可以使用 `makeVisible` 方法。`makeVisible` 方法会返回模型实例：

    return $user->makeVisible('attribute')->toArray();

同样，如果希望隐藏某些通常可见的属性，可以使用 `makeHidden` 方法。

    return $user->makeHidden('attribute')->toArray();

如果希望临时覆盖所有可见或隐藏的属性，可以分别使用 `setVisible` 和 `setHidden` 方法：

    return $user->setVisible(['id', 'name'])->toArray();

    return $user->setHidden(['email', 'password', 'remember_token'])->toArray();

<a name="appending-values-to-json"></a>
## 在 JSON 中追加值

有时在将模型转换为数组或 JSON 时，可能希望添加数据库中没有对应字段的属性。为此，首先为该值定义一个[访问器](/docs/{{version}}/eloquent-mutators)：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Casts\Attribute;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 判断用户是否为管理员。
         *
         * @return \Illuminate\Database\Eloquent\Casts\Attribute
         */
        protected function isAdmin(): Attribute
        {
            return new Attribute(
                get: fn () => 'yes',
            );
        }
    }

创建访问器后，将属性名添加到模型的 `appends` 属性中。请注意，属性名通常使用其"蛇形"序列化表示来引用，即使访问器的 PHP 方法使用"驼峰式"定义：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 应追加到模型数组形式的访问器。
         *
         * @var array
         */
        protected $appends = ['is_admin'];
    }

将属性添加到 `appends` 列表后，它会同时包含在模型的数组和 JSON 表示中。`appends` 数组中的属性也会遵循模型上配置的 `visible` 和 `hidden` 设置。

<a name="appending-at-run-time"></a>
#### 运行时追加

在运行时，可以使用 `append` 方法指示模型实例追加额外属性。或者，使用 `setAppends` 方法覆盖给定模型实例的整个追加属性数组：

    return $user->append('is_admin')->toArray();

    return $user->setAppends(['is_admin'])->toArray();

<a name="date-serialization"></a>
## 日期序列化

<a name="customizing-the-default-date-format"></a>
#### 自定义默认日期格式

可以通过重写 `serializeDate` 方法来自定义默认的序列化格式。此方法不会影响日期在数据库中存储的格式：

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

<a name="customizing-the-date-format-per-attribute"></a>
#### 按属性自定义日期格式

可以通过在模型的[类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting)中指定日期格式，来为单个 Eloquent 日期属性自定义序列化格式：

    protected $casts = [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
