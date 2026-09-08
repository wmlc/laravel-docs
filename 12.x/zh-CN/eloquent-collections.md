# Eloquent：集合

- [简介](#introduction)
- [可用方法](#available-methods)
- [自定义集合](#custom-collections)

<a name="introduction"></a>
## 简介

所有返回多个模型结果的 Eloquent 方法都会返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索的结果以及通过关联访问的结果。Eloquent 集合对象继承自 Laravel 的[基础集合](/docs/{{version}}/collections)，因此天然继承了几十个方法，可用于流畅地操作底层的 Eloquent 模型数组。请务必阅读 Laravel 集合文档，全面了解这些实用的方法！

所有集合同时也是迭代器，你可以像遍历普通 PHP 数组一样遍历它们：

```php
use App\Models\User;

$users = User::where('active', 1)->get();

foreach ($users as $user) {
    echo $user->name;
}
```

不过，正如前面提到的，集合比数组强大得多，它提供了各种 map / reduce 操作，并支持通过直观的接口进行链式调用。例如，我们可以先移除所有未激活的模型，再收集剩余每个用户的名字：

```php
$names = User::all()->reject(function (User $user) {
    return $user->active === false;
})->map(function (User $user) {
    return $user->name;
});
```

<a name="eloquent-collection-conversion"></a>
#### Eloquent 集合转换

大多数 Eloquent 集合方法都会返回一个新的 Eloquent 集合实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法会返回[基础集合](/docs/{{version}}/collections)实例。同样，如果 `map` 操作返回的集合中不含任何 Eloquent 模型，该集合也会被转换为基础集合实例。

<a name="available-methods"></a>
## 可用方法

所有 Eloquent 集合都继承自基础的 [Laravel 集合](/docs/{{version}}/collections#available-methods)对象，因此它们继承了基础集合类提供的全部强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类还提供了一组超集方法，帮助你管理模型集合。大多数方法返回 `Illuminate\Database\Eloquent\Collection` 实例；不过有些方法（例如 `modelKeys`）会返回 `Illuminate\Support\Collection` 实例。

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

<div class="collection-method-list" markdown="1">

[append](#method-append)
[contains](#method-contains)
[diff](#method-diff)
[except](#method-except)
[find](#method-find)
[findOrFail](#method-find-or-fail)
[fresh](#method-fresh)
[intersect](#method-intersect)
[load](#method-load)
[loadMissing](#method-loadMissing)
[modelKeys](#method-modelKeys)
[makeVisible](#method-makeVisible)
[makeHidden](#method-makeHidden)
[mergeVisible](#method-mergeVisible)
[mergeHidden](#method-mergeHidden)
[only](#method-only)
[partition](#method-partition)
[setAppends](#method-setAppends)
[setVisible](#method-setVisible)
[setHidden](#method-setHidden)
[toQuery](#method-toquery)
[unique](#method-unique)
[withoutAppends](#method-withoutAppends)

</div>

<a name="method-append"></a>
#### `append($attributes)` {.collection-method .first-collection-method}

`append` 方法可用于指示为集合中的每个模型[追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)某个属性。该方法接受一个属性数组或单个属性：

```php
$users->append('team');

$users->append(['team', 'is_admin']);
```

<a name="method-contains"></a>
#### `contains($key, $operator = null, $value = null)` {.collection-method}

`contains` 方法可用于判断集合中是否包含给定的模型实例。该方法接受一个主键或一个模型实例：

```php
$users->contains(1);

$users->contains(User::find(1));
```

<a name="method-diff"></a>
#### `diff($items)` {.collection-method}

`diff` 方法返回所有不存在于给定集合中的模型：

```php
use App\Models\User;

$users = $users->diff(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-except"></a>
#### `except($keys)` {.collection-method}

`except` 方法返回所有主键不等于给定主键的模型：

```php
$users = $users->except([1, 2, 3]);
```

<a name="method-find"></a>
#### `find($key)` {.collection-method}

`find` 方法返回主键与给定键匹配的模型。如果 `$key` 是一个模型实例，`find` 会尝试返回主键与之匹配的模型。如果 `$key` 是一个键数组，`find` 会返回主键包含在该数组中的所有模型：

```php
$users = User::all();

$user = $users->find(1);
```

<a name="method-find-or-fail"></a>
#### `findOrFail($key)` {.collection-method}

`findOrFail` 方法返回主键与给定键匹配的模型；如果在集合中找不到匹配的模型，则抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$users = User::all();

$user = $users->findOrFail(1);
```

<a name="method-fresh"></a>
#### `fresh($with = [])` {.collection-method}

`fresh` 方法从数据库中重新获取集合中每个模型的新实例。此外，任何指定的关联都会被预加载（eager load）：

```php
$users = $users->fresh();

$users = $users->fresh('comments');
```

<a name="method-intersect"></a>
#### `intersect($items)` {.collection-method}

`intersect` 方法返回所有同时存在于给定集合中的模型：

```php
use App\Models\User;

$users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-load"></a>
#### `load($relations)` {.collection-method}

`load` 方法为集合中的所有模型预加载（eager load）给定的关联：

```php
$users->load(['comments', 'posts']);

$users->load('comments.author');

$users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

<a name="method-loadMissing"></a>
#### `loadMissing($relations)` {.collection-method}

`loadMissing` 方法会在给定的关联尚未加载时，为集合中的所有模型预加载（eager load）这些关联：

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

`makeVisible` 方法将集合中每个模型上通常处于「隐藏」状态的属性[设置为可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeVisible(['address', 'phone_number']);
```

<a name="method-makeHidden"></a>
#### `makeHidden($attributes)` {.collection-method}

`makeHidden` 方法将集合中每个模型上通常处于「可见」状态的属性[设置为隐藏](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeHidden(['address', 'phone_number']);
```

<a name="method-mergeVisible"></a>
#### `mergeVisible($attributes)` {.collection-method}

`mergeVisible` 方法在保留现有可见属性的同时，[将额外的属性设置为可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->mergeVisible(['middle_name']);
```

<a name="method-mergeHidden"></a>
#### `mergeHidden($attributes)` {.collection-method}

`mergeHidden` 方法在保留现有隐藏属性的同时，[将额外的属性设置为隐藏](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->mergeHidden(['last_login_at']);
```

<a name="method-only"></a>
#### `only($keys)` {.collection-method}

`only` 方法返回所有主键等于给定主键的模型：

```php
$users = $users->only([1, 2, 3]);
```

<a name="method-partition"></a>
#### `partition` {.collection-method}

`partition` 方法返回一个 `Illuminate\Support\Collection` 实例，其中包含多个 `Illuminate\Database\Eloquent\Collection` 集合实例：

```php
$partition = $users->partition(fn ($user) => $user->age > 18);

dump($partition::class);    // Illuminate\Support\Collection
dump($partition[0]::class); // Illuminate\Database\Eloquent\Collection
dump($partition[1]::class); // Illuminate\Database\Eloquent\Collection
```

<a name="method-setAppends"></a>
#### `setAppends($attributes)` {.collection-method}

`setAppends` 方法临时覆盖集合中每个模型的所有[追加属性](/docs/{{version}}/eloquent-serialization#appending-values-to-json)：

```php
$users = $users->setAppends(['is_admin']);
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

`toQuery` 方法返回一个 Eloquent 查询构造器实例，其中包含针对集合模型主键的 `whereIn` 约束：

```php
use App\Models\User;

$users = User::where('status', 'VIP')->get();

$users->toQuery()->update([
    'status' => 'Administrator',
]);
```

<a name="method-unique"></a>
#### `unique($key = null, $strict = false)` {.collection-method}

`unique` 方法返回集合中所有唯一的模型。与集合中其他模型主键相同的模型都会被移除：

```php
$users = $users->unique();
```

<a name="method-withoutAppends"></a>
#### `withoutAppends()` {.collection-method}

`withoutAppends` 方法临时移除集合中每个模型的所有[追加属性](/docs/{{version}}/eloquent-serialization#appending-values-to-json)：

```php
$users = $users->withoutAppends();
```

<a name="custom-collections"></a>
## 自定义集合

如果在操作某个模型时想使用自定义的 `Collection` 对象，可以为该模型添加 `CollectedBy` 属性：

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;

#[CollectedBy(UserCollection::class)]
class User extends Model
{
    // ...
}
```

此外，你也可以在模型上定义一个 `newCollection` 方法：

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 创建一个新的 Eloquent Collection 实例。
     *
     * @param  array<int, \Illuminate\Database\Eloquent\Model>  $models
     * @return \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Database\Eloquent\Model>
     */
    public function newCollection(array $models = []): Collection
    {
        $collection = new UserCollection($models);

        if (Model::isAutomaticallyEagerLoadingRelationships()) {
            $collection->withRelationshipAutoloading();
        }

        return $collection;
    }
}
```

定义了 `newCollection` 方法或为模型添加了 `CollectedBy` 属性之后，每当 Eloquent 正常返回 `Illuminate\Database\Eloquent\Collection` 实例时，你得到的都会是自定义集合的实例。

如果想为应用中的每个模型都使用自定义集合，你应该在一个基础模型类上定义 `newCollection` 方法，并让应用中的所有模型都继承该基础模型类。
