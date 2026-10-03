# Eloquent：序列化

- [简介](#introduction)
- [序列化模型与集合](#serializing-models-and-collections)
    - [序列化为数组](#serializing-to-arrays)
    - [序列化为 JSON](#serializing-to-json)
- [在 JSON 中隐藏属性](#hiding-attributes-from-json)
- [向 JSON 追加值](#appending-values-to-json)
- [日期序列化](#date-serialization)

<a name="introduction"></a>
## 简介

使用 Laravel 构建 API 时，你经常需要把模型和关联转换为数组或 JSON。Eloquent 提供了便捷的方法来完成这些转换，也能让你控制模型的序列化表示中包含哪些属性。

> [!NOTE]
> 想了解处理 Eloquent 模型与集合 JSON 序列化更稳健的方式，请查阅 [Eloquent API 资源](/docs/{{version}}/eloquent-resources)相关文档。

<a name="serializing-models-and-collections"></a>
## 序列化模型与集合

<a name="serializing-to-arrays"></a>
### 序列化为数组

要把模型及其已加载的[关联](/docs/{{version}}/eloquent-relationships)转换为数组，应使用 `toArray` 方法。该方法是递归的，因此所有属性和所有关联（包括关联的关联）都会被转换为数组：

    use App\Models\User;

    $user = User::with('roles')->first();

    return $user->toArray();

`attributesToArray` 方法可用于把模型的属性转换为数组，但不转换其关联：

    $user = User::first();

    return $user->attributesToArray();

你也可以在集合实例上调用 `toArray` 方法，把整个模型[集合](/docs/{{version}}/eloquent-collections)转换为数组：

    $users = User::all();

    return $users->toArray();

<a name="serializing-to-json"></a>
### 序列化为 JSON

要把模型转换为 JSON，应使用 `toJson` 方法。与 `toArray` 一样，`toJson` 方法也是递归的，因此所有属性和关联都会被转换为 JSON。你还可以指定任意 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

    use App\Models\User;

    $user = User::find(1);

    return $user->toJson();

    return $user->toJson(JSON_PRETTY_PRINT);

或者，你也可以把模型或集合强制转换为字符串，这会自动调用模型或集合上的 `toJson` 方法：

    return (string) User::find(1);

由于模型和集合在转换为字符串时会被序列化为 JSON，你可以直接从应用的路由或控制器中返回 Eloquent 对象。当它们从路由或控制器返回时，Laravel 会自动把 Eloquent 模型和集合序列化为 JSON：

    Route::get('/users', function () {
        return User::all();
    });

<a name="relationships"></a>
#### 关联

当 Eloquent 模型被转换为 JSON 时，其已加载的关联会自动作为属性包含在 JSON 对象中。此外，虽然 Eloquent 关联方法是使用"驼峰式"方法名定义的，但关联在 JSON 中的属性名会采用"下划线式"。

<a name="hiding-attributes-from-json"></a>
## 在 JSON 中隐藏属性

有时你可能希望限制模型数组或 JSON 表示中包含的属性（例如密码）。为此，请给你的模型添加一个 `$hidden` 属性。列在 `$hidden` 属性数组中的属性不会包含在模型的序列化表示中：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 序列化时应该隐藏的属性。
         *
         * @var array<string>
         */
        protected $hidden = ['password'];
    }

> [!NOTE]
> 要隐藏关联，请把该关联的方法名添加到 Eloquent 模型的 `$hidden` 属性中。

或者，你也可以使用 `visible` 属性定义一份应包含在模型数组和 JSON 表示中的属性"允许列表"。模型转换为数组或 JSON 时，所有不在 `$visible` 数组中的属性都会被隐藏：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 在数组中应该可见的属性。
         *
         * @var array
         */
        protected $visible = ['first_name', 'last_name'];
    }

<a name="temporarily-modifying-attribute-visibility"></a>
#### 临时修改属性可见性

如果你希望在某个模型实例上让一些通常隐藏的属性变为可见，可以使用 `makeVisible` 方法。`makeVisible` 方法返回该模型实例：

    return $user->makeVisible('attribute')->toArray();

同理，如果你想隐藏一些通常可见的属性，可以使用 `makeHidden` 方法。

    return $user->makeHidden('attribute')->toArray();

如果你希望临时覆盖所有可见或隐藏的属性，可以分别使用 `setVisible` 和 `setHidden` 方法：

    return $user->setVisible(['id', 'name'])->toArray();

    return $user->setHidden(['email', 'password', 'remember_token'])->toArray();

<a name="appending-values-to-json"></a>
## 向 JSON 追加值

偶尔，在把模型转换为数组或 JSON 时，你可能希望添加一些在数据库中没有对应列的属性。为此，请先为该值定义一个[访问器](/docs/{{version}}/eloquent-mutators)：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Casts\Attribute;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 判断该用户是否为管理员。
         */
        protected function isAdmin(): Attribute
        {
            return new Attribute(
                get: fn () => 'yes',
            );
        }
    }

如果你希望该访问器始终被追加到模型的数组和 JSON 表示中，可以把属性名添加到模型的 `appends` 属性中。请注意：尽管访问器的 PHP 方法使用"驼峰式"定义，属性名在引用时通常使用其序列化后的"下划线式"形式：

    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 要追加到模型数组形式的访问器。
         *
         * @var array
         */
        protected $appends = ['is_admin'];
    }

属性一旦被添加到 `appends` 列表，就会同时包含在模型的数组和 JSON 表示中。`appends` 数组中的属性也会遵循模型上配置的 `visible` 和 `hidden` 设置。

<a name="appending-at-run-time"></a>
#### 在运行时追加

在运行时，你可以使用 `append` 方法指示某个模型实例追加额外属性。你也可以使用 `setAppends` 方法覆盖给定模型实例的整个追加属性数组：

    return $user->append('is_admin')->toArray();

    return $user->setAppends(['is_admin'])->toArray();

<a name="date-serialization"></a>
## 日期序列化

<a name="customizing-the-default-date-format"></a>
#### 自定义默认日期格式

你可以通过覆盖 `serializeDate` 方法来自定义默认的序列化格式。该方法不会影响日期在数据库中存储时的格式：

    /**
     * 为数组 / JSON 序列化准备日期。
     */
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

<a name="customizing-the-date-format-per-attribute"></a>
#### 按属性自定义日期格式

你可以在模型的[类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting)中指定日期格式来自定义单个 Eloquent 日期属性的序列化格式：

    protected function casts(): array
    {
        return [
            'birthday' => 'date:Y-m-d',
            'joined_at' => 'datetime:Y-m-d H:00',
        ];
    }
