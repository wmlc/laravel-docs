# Eloquent：序列化

- [简介](#introduction)
- [序列化模型与集合](#serializing-models-and-collections)
    - [序列化为数组](#serializing-to-arrays)
    - [序列化为 JSON](#serializing-to-json)
- [从 JSON 中隐藏属性](#hiding-attributes-from-json)
- [向 JSON 追加值](#appending-values-to-json)
- [日期序列化](#date-serialization)

<a name="introduction"></a>
## 简介

使用 Laravel 构建 API 时，你经常需要将模型（model）与关联（relationship）转换为数组或 JSON。Eloquent 内置了便捷的方法来执行这些转换，并控制哪些属性（attribute）被包含在模型的序列化表示中。

> [!NOTE]
> 如需更强大的 Eloquent 模型与集合 JSON 序列化处理方式，请查阅 [Eloquent API 资源](/docs/{{version}}/eloquent-resources) 的相关文档。

<a name="serializing-models-and-collections"></a>
## 序列化模型与集合

<a name="serializing-to-arrays"></a>
### 序列化为数组

要将模型及其已加载的 [关联](/docs/{{version}}/eloquent-relationships) 转换为数组，应使用 `toArray` 方法。该方法是递归的，因此所有属性与所有关联（包括关联的关联）都会被转换为数组：

```php
use App\Models\User;

$user = User::with('roles')->first();

return $user->toArray();
```

`attributesToArray` 方法可用于将模型的属性转换为数组，但不包含其关联：

```php
$user = User::first();

return $user->attributesToArray();
```

你也可以通过在集合（collection）实例上调用 `toArray` 方法，将整个模型 [集合](/docs/{{version}}/eloquent-collections) 转换为数组：

```php
$users = User::all();

return $users->toArray();
```

<a name="serializing-to-json"></a>
### 序列化为 JSON

要将模型转换为 JSON，应使用 `toJson` 方法。与 `toArray` 类似，`toJson` 方法也是递归的，因此所有属性与关联都会被转换为 JSON。你也可以指定任何 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

```php
use App\Models\User;

$user = User::find(1);

return $user->toJson();

return $user->toJson(JSON_PRETTY_PRINT);
```

另外，你也可以将模型或集合强制转换为字符串，这会自动调用模型或集合上的 `toJson` 方法：

```php
return (string) User::find(1);
```

由于模型和集合在被强制转换为字符串时会转换为 JSON，你可以直接从应用的路由或控制器返回 Eloquent 对象。当 Eloquent 模型和集合从路由或控制器返回时，Laravel 会自动将其序列化为 JSON：

```php
Route::get('/users', function () {
    return User::all();
});
```

<a name="relationships"></a>
#### 关联

当 Eloquent 模型被转换为 JSON 时，其已加载的关联会自动作为 JSON 对象上的属性被包含进来。此外，虽然 Eloquent 关联方法使用 "camel case"（驼峰式）方法名定义，但关联的 JSON 属性会采用 "snake case"（蛇形式）。

<a name="hiding-attributes-from-json"></a>
## 从 JSON 中隐藏属性

有时你可能希望限制被包含在模型数组或 JSON 表示中的属性，例如密码。为此，你可以在模型上使用 `Hidden` 属性（attribute）。列在 `Hidden` 属性中的属性不会出现在模型的序列化表示中：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Hidden(['password'])]
class User extends Model
{
    // ...
}
```


> [!NOTE]
> 如需隐藏关联，请将关联的方法名添加到 Eloquent 模型的 `Hidden` 属性中。

或者，你可以使用 `Visible` 属性来定义一个应当被包含在模型数组与 JSON 表示中的属性「白名单」。所有未出现在 `Visible` 属性中的属性，在模型被转换为数组或 JSON 时都会被隐藏：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Visible;
use Illuminate\Database\Eloquent\Model;

#[Visible(['first_name', 'last_name'])]
class User extends Model
{
    // ...
}
```

<a name="temporarily-modifying-attribute-visibility"></a>
#### 临时修改属性可见性

如果你想在给定模型实例上让某些通常被隐藏的属性可见，可以使用 `makeVisible` 或 `mergeVisible` 方法。`makeVisible` 方法会返回模型实例：

```php
return $user->makeVisible('attribute')->toArray();

return $user->mergeVisible(['name', 'email'])->toArray();
```

类似地，如果你想隐藏某些通常可见的属性，可以使用 `makeHidden` 或 `mergeHidden` 方法：

```php
return $user->makeHidden('attribute')->toArray();

return $user->mergeHidden(['name', 'email'])->toArray();
```

如果你想临时覆盖所有可见或隐藏属性，可以分别使用 `setVisible` 与 `setHidden` 方法：

```php
return $user->setVisible(['id', 'name'])->toArray();

return $user->setHidden(['email', 'password', 'remember_token'])->toArray();
```

<a name="appending-values-to-json"></a>
## 向 JSON 追加值

有时在将模型转换为数组或 JSON 时，你可能希望添加一些在数据库中不存在对应列的属性。为此，首先为该值定义一个 [访问器](/docs/{{version}}/eloquent-mutators)（accessor）：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * Determine if the user is an administrator.
     */
    protected function isAdmin(): Attribute
    {
        return new Attribute(
            get: fn () => 'yes',
        );
    }
}
```

如果你希望该访问器始终被追加到模型的数组与 JSON 表示中，可以在模型上使用 `Appends` 属性。请注意，属性名通常使用其「snake case」（蛇形）序列化表示来引用，即使访问器的 PHP 方法使用「camel case」（驼峰式）定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Model;

#[Appends(['is_admin'])]
class User extends Model
{
    // ...
}
```

一旦该属性被加入 `appends` 列表，它就会被包含在模型的数组与 JSON 表示中。`appends` 数组中的属性也会遵循模型上配置的 `visible` 与 `hidden` 设置。

<a name="appending-at-run-time"></a>
#### 运行时追加

在运行时，你可以指示模型实例使用 `append` 或 `mergeAppends` 方法追加额外的属性。或者，你也可以使用 `setAppends` 方法覆盖给定模型实例上被追加的整个属性数组：

```php
return $user->append('is_admin')->toArray();

return $user->mergeAppends(['is_admin', 'status'])->toArray();

return $user->setAppends(['is_admin'])->toArray();
```

类似地，如果你想从模型中移除所有被追加的属性，可以使用 `withoutAppends` 方法：

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
 * Prepare a date for array / JSON serialization.
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

<a name="customizing-the-date-format-per-attribute"></a>
#### 按属性自定义日期格式

你可以通过在模型的 [类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting)（cast declaration）中指定日期格式，来自定义单个 Eloquent 日期属性的序列化格式：

```php
protected function casts(): array
{
    return [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
}
```
