# Eloquent：集合

- [简介](#introduction)
- [可用方法](#available-methods)
- [自定义集合](#custom-collections)

<a name="introduction"></a>
## 简介

所有返回多个模型结果的 Eloquent 方法都会返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索的结果或通过关联访问的结果。Eloquent 集合对象继承了 Laravel 的[基础集合](/docs/{{version}}/collections)，因此自然地继承了几十种用于流畅地操作底层 Eloquent 模型数组的方法。请务必查阅 Laravel 集合文档以了解所有这些有用的方法！

所有集合同时也是迭代器，允许你像遍历简单的 PHP 数组一样遍历它们：

```php
use App\Models\User;

$users = User::where('active', 1)->get();

foreach ($users as $user) {
    echo $user->name;
}
```

然而，如前所述，集合比数组强大得多，并提供了各种可通过直观接口链式调用的 map / reduce 操作。例如，我们可以移除所有未激活的模型，然后收集剩余用户的名字：

```php
$names = User::all()->reject(function ($user) {
    return $user->active === false;
})->map(function ($user) {
    return $user->name;
});
```

<a name="eloquent-collection-conversion"></a>
#### Eloquent 集合转换

虽然大多数 Eloquent 集合方法会返回一个新的 Eloquent 集合实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法会返回[基础集合](/docs/{{version}}/collections)实例。同样，如果 `map` 操作返回的集合不包含任何 Eloquent 模型，它将被转换为基础集合实例。

<a name="available-methods"></a>
## 可用方法

所有 Eloquent 集合都继承了基础的 [Laravel 集合](/docs/{{version}}/collections#available-methods)对象；因此，它们继承了基础集合类提供的所有强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类提供了一组超集方法来帮助管理模型集合。大多数方法返回 `Illuminate\Database\Eloquent\Collection` 实例；但某些方法（如 `modelKeys`）会返回 `Illuminate\Support\Collection` 实例。

<style>
    .collection-method-list > p {
        columns: 14.4em 1; -moz-columns: 14.4em 1; -webkit-columns: 14.4em 1;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

[append](#method-append)
[contains](#method-contains)
[diff](#method-diff)
[except](#method-except)
[find](#method-find)
[fresh](#method-fresh)
[intersect](#method-intersect)
[load](#method-load)
[loadMissing](#method-loadMissing)
[modelKeys](#method-modelKeys)
[makeVisible](#method-makeVisible)
[makeHidden](#method-makeHidden)
[only](#method-only)
[setVisible](#method-setVisible)
[setHidden](#method-setHidden)
[toQuery](#method-toquery)
[unique](#method-unique)

<a name="method-append"></a>
#### `append($attributes)` {.collection-method .first-collection-method}

`append` 方法可用于指示应为集合中的每个模型[追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)某个属性。此方法接受属性数组或单个属性：

```php
$users->append('team');

$users->append(['team', 'is_admin']);
```

<a name="method-contains"></a>
#### `contains($key, $operator = null, $value = null)` {.collection-method}

`contains` 方法可用于确定集合中是否包含给定的模型实例。此方法接受主键或模型实例：

```php
$users->contains(1);

$users->contains(User::find(1));
```

<a name="method-diff"></a>
#### `diff($items)` {.collection-method}

`diff` 方法返回不存在于给定集合中的所有模型：

```php
use App\Models\User;

$users = $users->diff(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-except"></a>
#### `except($keys)` {.collection-method}

`except` 方法返回不具有给定主键的所有模型：

```php
$users = $users->except([1, 2, 3]);
```

<a name="method-find"></a>
#### `find($key)` {.collection-method}

`find` 方法返回主键与给定键匹配的模型。如果 `$key` 是模型实例，`find` 将尝试返回与该主键匹配的模型。如果 `$key` 是键数组，`find` 将返回主键在给定数组中的所有模型：

```php
$users = User::all();

$user = $users->find(1);
```

<a name="method-fresh"></a>
#### `fresh($with = [])` {.collection-method}

`fresh` 方法从数据库中检索集合中每个模型的新实例。此外，任何指定的关联都将被预加载：

```php
$users = $users->fresh();

$users = $users->fresh('comments');
```

<a name="method-intersect"></a>
#### `intersect($items)` {.collection-method}

`intersect` 方法返回也存在于给定集合中的所有模型：

```php
use App\Models\User;

$users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-load"></a>
#### `load($relations)` {.collection-method}

`load` 方法为集合中的所有模型预加载给定关联：

```php
$users->load(['comments', 'posts']);

$users->load('comments.author');

$users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

<a name="method-loadMissing"></a>
#### `loadMissing($relations)` {.collection-method}

`loadMissing` 方法在关联尚未加载时，为集合中的所有模型预加载给定关联：

```php
$users->loadMissing(['comments', 'posts']);

$users->loadMissing('comments.author');

$users->loadMissing(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

<a name="method-modelKeys"></a>
#### `modelKeys()` {.collection-method}

`modelKeys` 方法返回集合中所有模型的主键：

```php
$users->modelKeys();

// [1, 2, 3, 4, 5]
```

<a name="method-makeVisible"></a>
#### `makeVisible($attributes)` {.collection-method}

`makeVisible` 方法将集合中每个模型上通常"隐藏"的属性[设为可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeVisible(['address', 'phone_number']);
```

<a name="method-makeHidden"></a>
#### `makeHidden($attributes)` {.collection-method}

`makeHidden` 方法将集合中每个模型上通常"可见"的属性[设为隐藏](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeHidden(['address', 'phone_number']);
```

<a name="method-only"></a>
#### `only($keys)` {.collection-method}

`only` 方法返回具有给定主键的所有模型：

```php
$users = $users->only([1, 2, 3]);
```

<a name="method-setVisible"></a>
#### `setVisible($attributes)` {.collection-method}

`setVisible` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型的所有可见属性：

```php
$users = $users->setVisible(['id', 'name']);
```

<a name="method-setHidden"></a>
#### `setHidden($attributes)` {.collection-method}

`setHidden` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型的所有隐藏属性：

```php
$users = $users->setHidden(['email', 'password', 'remember_token']);
```

<a name="method-toquery"></a>
#### `toQuery()` {.collection-method}

`toQuery` 方法返回一个 Eloquent 查询构造器实例，该实例包含基于集合模型主键的 `whereIn` 约束：

```php
use App\Models\User;

$users = User::where('status', 'VIP')->get();

$users->toQuery()->update([
    'status' => 'Administrator',
]);
```

<a name="method-unique"></a>
#### `unique($key = null, $strict = false)` {.collection-method}

`unique` 方法返回集合中所有唯一的模型。任何与集合中另一个模型具有相同类型和相同主键的模型都会被移除：

```php
$users = $users->unique();
```

<a name="custom-collections"></a>
## 自定义集合

如果你想在与给定模型交互时使用自定义的 `Collection` 对象，可以在模型上定义一个 `newCollection` 方法：

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 创建一个新的 Eloquent 集合实例。
     *
     * @param  array  $models
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function newCollection(array $models = [])
    {
        return new UserCollection($models);
    }
}
```

一旦定义了 `newCollection` 方法，每当 Eloquent 通常返回 `Illuminate\Database\Eloquent\Collection` 实例时，你都会收到自定义集合的实例。如果你想为应用中的每个模型使用自定义集合，应该在所有应用模型继承的基础模型类上定义 `newCollection` 方法。
