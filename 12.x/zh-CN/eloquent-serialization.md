# Eloquent：序列化

- [简介](#introduction)
- [序列化模型和集合](#serializing-models-and-collections)
    - [序列化为数组](#serializing-to-arrays)
    - [序列化为 JSON](#serializing-to-json)
- [在 JSON 中隐藏属性](#hiding-attributes-from-json)
- [向 JSON 追加值](#appending-values-to-json)
- [日期序列化](#date-serialization)

<a name="introduction"></a>
## 简介

使用 Laravel 构建 API 时，你经常需要将模型和关联转换为数组或 JSON。Eloquent 提供了便捷的方法来完成这些转换，同时还能控制模型的序列化表示中包含哪些属性。

> [!NOTE]
> 如果想以更加强健的方式处理 Eloquent 模型和集合的 JSON 序列化，请查阅 [Eloquent API 资源](/docs/{{version}}/eloquent-resources)文档。

<a name="serializing-models-and-collections"></a>
## 序列化模型和集合

<a name="serializing-to-arrays"></a>
### 序列化为数组

要将模型及其已加载的[关联](/docs/{{version}}/eloquent-relationships)转换为数组，你应该使用 `toArray` 方法。该方法是递归的，因此所有属性和所有关联（包括关联的关联）都会被转换为数组：

```php
use App\Models\User;

$user = User::with('roles')->first();

return $user->toArray();
```

`attributesToArray` 方法可用于只将模型的属性转换为数组，而不包含其关联：

```php
$user = User::first();

return $user->attributesToArray();
```

你也可以在集合实例上调用 `toArray` 方法，将整批模型[集合](/docs/{{version}}/eloquent-collections)转换为数组：

```php
$users = User::all();

return $users->toArray();
```

<a name="serializing-to-json"></a>
### 序列化为 JSON

要将模型转换为 JSON，你应该使用 `toJson` 方法。与 `toArray` 一样，`toJson` 方法也是递归的，因此所有属性和关联都会被转换为 JSON。你还可以指定任何 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

```php
use App\Models\User;

$user = User::find(1);

return $user->toJson();

return $user->toJson(JSON_PRETTY_PRINT);
```

此外，你也可以将模型或集合转换为字符串，这会自动调用模型或集合上的 `toJson` 方法：

```php
return (string) User::find(1);
```

由于模型和集合在被转换为字符串时会转换为 JSON，你可以直接从应用的路由或控制器返回 Eloquent 对象。当 Eloquent 模型和集合从路由或控制器返回时，Laravel 会自动将它们序列化为 JSON：

```php
Route::get('/users', function () {
    return User::all();
});
```

<a name="relationships"></a>
#### 关联

当 Eloquent 模型被转换为 JSON 时，其已加载的关联会自动作为属性包含在 JSON 对象中。另外，尽管 Eloquent 的关联方法使用「驼峰式（camel case）」方法名定义，但关联的 JSON 属性会采用「蛇形（snake case）」命名。

<a name="hiding-attributes-from-json"></a>
## 在 JSON 中隐藏属性

有时你可能希望限制模型数组或 JSON 表示中包含的属性，比如密码。为此，可以在模型中添加 `$hidden` 属性。列在 `$hidden` 属性数组中的属性不会出现在模型的序列化表示中：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 序列化时应隐藏的属性。
     *
     * @var array<string>
     */
    protected $hidden = ['password'];
}
```

> [!NOTE]
> 要隐藏关联，请将关联的方法名添加到 Eloquent 模型的 `$hidden` 属性中。

或者，你也可以使用 `visible` 属性定义一个「允许列表」，指定模型的数组和 JSON 表示中应包含哪些属性。当模型被转换为数组或 JSON 时，所有不在 `$visible` 数组中的属性都会被隐藏：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 在数组中可见的属性。
     *
     * @var array
     */
    protected $visible = ['first_name', 'last_name'];
}
```

<a name="temporarily-modifying-attribute-visibility"></a>
#### 临时修改属性可见性

如果想让某些通常隐藏的属性在给定模型实例上可见，可以使用 `makeVisible` 或 `mergeVisible` 方法。`makeVisible` 方法会返回模型实例：

```php
return $user->makeVisible('attribute')->toArray();

return $user->mergeVisible(['name', 'email'])->toArray();
```

类似地，如果想隐藏某些通常可见的属性，可以使用 `makeHidden` 或 `mergeHidden` 方法：

```php
return $user->makeHidden('attribute')->toArray();

return $user->mergeHidden(['name', 'email'])->toArray();
```

如果想临时覆盖全部可见或隐藏属性，可以分别使用 `setVisible` 和 `setHidden` 方法：

```php
return $user->setVisible(['id', 'name'])->toArray();

return $user->setHidden(['email', 'password', 'remember_token'])->toArray();
```

<a name="appending-values-to-json"></a>
## 向 JSON 追加值

有时，在将模型转换为数组或 JSON 时，你可能希望添加一些在数据库中没有对应字段的属性。为此，首先要为该值定义一个[访问器](/docs/{{version}}/eloquent-mutators)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 判断用户是否为管理员。
     */
    protected function isAdmin(): Attribute
    {
        return new Attribute(
            get: fn () => 'yes',
        );
    }
}
```

如果希望该访问器始终追加到模型的数组和 JSON 表示中，可以将属性名添加到模型的 `appends` 属性中。注意，尽管访问器的 PHP 方法使用「驼峰式」命名定义，但属性名通常使用其「蛇形」序列化表示来引用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 追加到模型数组形式的访问器。
     *
     * @var array
     */
    protected $appends = ['is_admin'];
}
```

一旦属性被添加到 `appends` 列表，它就会同时包含在模型的数组和 JSON 表示中。`appends` 数组中的属性同样会遵循模型上配置的 `visible` 和 `hidden` 设置。

<a name="appending-at-run-time"></a>
#### 运行时追加

在运行时，你可以使用 `append` 或 `mergeAppends` 方法让模型实例追加额外的属性。或者，你也可以使用 `setAppends` 方法为给定的模型实例覆盖整个追加属性数组：

```php
return $user->append('is_admin')->toArray();

return $user->mergeAppends(['is_admin', 'status'])->toArray();

return $user->setAppends(['is_admin'])->toArray();
```

类似地，如果想从模型中移除所有已追加的属性，可以使用 `withoutAppends` 方法：

```php
return $user->withoutAppends()->toArray();
```

<a name="date-serialization"></a>
## 日期序列化

<a name="customizing-the-default-date-format"></a>
#### 自定义默认日期格式

你可以通过重写 `serializeDate` 方法来自定义默认的序列化格式。该方法不会影响日期在数据库中的存储格式：

```php
/**
 * 为数组 / JSON 序列化准备日期。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

<a name="customizing-the-date-format-per-attribute"></a>
#### 按属性自定义日期格式

你可以在模型的[类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting)中指定日期格式，从而为各个 Eloquent 日期属性自定义序列化格式：

```php
protected function casts(): array
{
    return [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
}
```
