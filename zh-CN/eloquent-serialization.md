# Eloquent：序列化

## 简介

在使用 Laravel 构建 API 时，你经常需要将模型和关联转换为数组或 JSON。Eloquent 提供了便捷的方法来完成这些转换，并控制模型的序列化表示中包含哪些属性。

> [!NOTE]
> 如需更强大的方式来处理 Eloquent 模型和集合的 JSON 序列化，请查阅 [Eloquent API 资源](/docs/{{version}}/eloquent-resources) 文档。

## 序列化模型和集合

### 序列化为数组

要将一个模型及其已加载的 [关联](/docs/{{version}}/eloquent-relationships) 转换为数组，你应该使用 `toArray` 方法。该方法是递归的，因此所有属性和所有关联（包括关联的关联）都会被转换为数组：

```php
use App\Models\User;

$user = User::with('roles')->first();

return $user->toArray();
```

可以使用 `attributesToArray` 方法将模型的属性转换为数组，但不包含其关联：

```php
$user = User::first();

return $user->attributesToArray();
```

你也可以通过调用集合实例上的 `toArray` 方法，将整个模型 [集合](/docs/{{version}}/eloquent-collections) 转换为数组：

```php
$users = User::all();

return $users->toArray();
```

### 序列化为 JSON

要将模型转换为 JSON，你应该使用 `toJson` 方法。与 `toArray` 类似，`toJson` 方法也是递归的，因此所有属性和关联都会被转换为 JSON。你还可以指定 PHP [支持的任何 JSON 编码选项](https://secure.php.net/manual/en/function.json-encode.php)：

```php
use App\Models\User;

$user = User::find(1);

return $user->toJson();

return $user->toJson(JSON_PRETTY_PRINT);
```

或者，你可以将模型或集合强制转换为字符串，这将自动调用模型或集合上的 `toJson` 方法：

```php
return (string) User::find(1);
```

由于模型和集合在被强制转换为字符串时会转换为 JSON，因此你可以直接从应用的路由或控制器返回 Eloquent 对象。Laravel 会在从路由或控制器返回 Eloquent 模型和集合时，自动将它们序列化为 JSON：

```php
Route::get('/users', function () {
    return User::all();
});
```

#### 关联

当 Eloquent 模型被转换为 JSON 时，其已加载的关联会自动作为属性包含在 JSON 对象中。此外，尽管 Eloquent 关联方法使用"驼峰式（camel case）"方法名定义，但关联的 JSON 属性将是"蛇形式（snake case）"。

## 在 JSON 中隐藏属性

有时你可能希望限制包含在模型数组或 JSON 表示中的属性，例如密码。要做到这一点，你可以在模型上使用 `Hidden` 属性。列在 `Hidden` 属性中的属性不会出现在模型的序列化表示中：

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
> 要隐藏关联，请将关联的方法名添加到 Eloquent 模型的 `Hidden` 属性中。

或者，你可以使用 `Visible` 属性来定义应该包含在模型数组和 JSON 表示中的属性"允许列表"。所有未出现在 `Visible` 属性中的属性在模型转换为数组或 JSON 时都会被隐藏：

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

#### 临时修改属性可见性

如果你想在给定模型实例上让某些通常被隐藏的属性变为可见，可以使用 `makeVisible` 或 `mergeVisible` 方法。`makeVisible` 方法会返回模型实例：

```php
return $user->makeVisible('attribute')->toArray();

return $user->mergeVisible(['name', 'email'])->toArray();
```

同样，如果你想隐藏某些通常可见的属性，可以使用 `makeHidden` 或 `mergeHidden` 方法：

```php
return $user->makeHidden('attribute')->toArray();

return $user->mergeHidden(['name', 'email'])->toArray();
```

如果你希望临时覆盖所有可见或隐藏的属性，可以分别使用 `setVisible` 和 `setHidden` 方法：

```php
return $user->setVisible(['id', 'name'])->toArray();

return $user->setHidden(['email', 'password', 'remember_token'])->toArray();
```

## 向 JSON 追加值

有时，在将模型转换为数组或 JSON 时，你可能希望添加一些在数据库中没有对应列的属性。要做到这一点，首先为该值定义一个 [访问器](/docs/{{version}}/eloquent-mutators)：

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

如果你希望该访问器始终被追加到模型的数组和 JSON 表示中，可以在模型上使用 `Appends` 属性。请注意，即使访问器的 PHP 方法使用"驼峰式（camel case）"定义，属性名通常也要使用其"蛇形式（snake case）"的序列化表示来引用：

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

一旦该属性被添加到 `appends` 列表，它就会被包含在模型的数组和 JSON 表示中。`appends` 数组中的属性同样会遵循模型上配置的 `visible` 和 `hidden` 设置。

#### 运行时追加

在运行时，你可以指示模型实例使用 `append` 或 `mergeAppends` 方法追加额外的属性。或者，你可以使用 `setAppends` 方法为给定模型实例覆盖整个追加属性数组：

```php
return $user->append('is_admin')->toArray();

return $user->mergeAppends(['is_admin', 'status'])->toArray();

return $user->setAppends(['is_admin'])->toArray();
```

同样，如果你想从模型中移除所有追加属性，可以使用 `withoutAppends` 方法：

```php
return $user->withoutAppends()->toArray();
```

## 日期序列化

#### 自定义默认日期格式

你可以通过重写 `serializeDate` 方法来自定义默认序列化格式。该方法不影响你的日期在数据库中的存储格式：

```php
/**
 * 为数组 / JSON 序列化准备一个日期。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

#### 为每个属性自定义日期格式

你可以通过在模型的 [类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting) 中指定日期格式，来自定义各个 Eloquent 日期属性的序列化格式：

```php
protected function casts(): array
{
    return [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
}
```
