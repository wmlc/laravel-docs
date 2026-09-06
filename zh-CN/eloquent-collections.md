# Eloquent：集合

## 简介

所有返回多个模型结果的 Eloquent 方法，都会返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索到的结果，或是通过关联访问到的结果。Eloquent 集合对象继承自 Laravel 的[基础集合](/topic/Laravel%2013.x/4rvgn63ydj.html)，因此天然继承了数十个用于流畅操作底层 Eloquent 模型数组的方法。务必查阅 Laravel 集合文档，了解所有这些实用方法！

所有集合也都充当迭代器，让你可以像遍历简单的 PHP 数组一样遍历它们：

```php
use App\Models\User;

$users = User::where('active', 1)->get();

foreach ($users as $user) {
    echo $user->name;
}
```

不过，正如前面提到的，集合远比数组强大，它提供了一系列 map / reduce 操作，可以通过直观的接口链式调用。例如，我们可以移除所有未激活的模型，然后收集其余每个用户的名字：

```php
$names = User::all()->reject(function (User $user) {
    return $user->active === false;
})->map(function (User $user) {
    return $user->name;
});
```

#### Eloquent 集合转换

虽然大多数 Eloquent 集合方法都会返回一个新的 Eloquent 集合实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法会返回[基础集合](/topic/Laravel%2013.x/4rvgn63ydj.html)实例。同样地，如果 `map` 操作返回的集合不包含任何 Eloquent 模型，它会被转换为基础集合实例。

## 可用方法

所有 Eloquent 集合都继承自[基础 Laravel 集合](/topic/Laravel%2013.x/4rvgn63ydj.html)对象；因此，它们继承了基础集合类提供的所有强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类还提供了一组超集方法，用于协助管理你的模型集合。大多数方法返回 `Illuminate\Database\Eloquent\Collection` 实例；不过，部分方法（如 `modelKeys`）会返回 `Illuminate\Support\Collection` 实例。

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

append
contains
diff
except
find
findOrFail
fresh
intersect
load
loadMissing
modelKeys
makeVisible
makeHidden
mergeVisible
mergeHidden
only
partition
setAppends
setVisible
setHidden
toQuery
unique
withoutAppends

#### `append($attributes)` {.collection-method .first-collection-method}

`append` 方法可用于指示集合中的每个模型都应当[追加](/topic/Laravel%2013.x/m892ge6y01.html)某个属性。该方法接受一个属性数组或单个属性：

```php
$users->append('team');

$users->append(['team', 'is_admin']);
```

#### `contains($key, $operator = null, $value = null)` {.collection-method}

`contains` 方法可用于判断集合是否包含给定的模型实例。该方法接受主键或模型实例：

```php
$users->contains(1);

$users->contains(User::find(1));
```

#### `diff($items)` {.collection-method}

`diff` 方法返回所有未出现在给定集合中的模型：

```php
use App\Models\User;

$users = $users->diff(User::whereIn('id', [1, 2, 3])->get());
```

#### `except($keys)` {.collection-method}

`except` 方法返回所有不具有给定主键的模型：

```php
$users = $users->except([1, 2, 3]);
```

#### `find($key)` {.collection-method}

`find` 方法返回主键与给定键匹配的模型。如果 `$key` 是一个模型实例，`find` 会尝试返回主键匹配的模型。如果 `$key` 是一个键数组，`find` 会返回所有主键在该给定数组中的模型：

```php
$users = User::all();

$user = $users->find(1);
```

#### `findOrFail($key)` {.collection-method}

`findOrFail` 方法返回主键与给定键匹配的模型；如果在集合中找不到匹配的模型，则抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$users = User::all();

$user = $users->findOrFail(1);
```

#### `fresh($with = [])` {.collection-method}

`fresh` 方法从数据库中检索集合中每个模型的全新实例。此外，任何指定的关联都会被预加载：

```php
$users = $users->fresh();

$users = $users->fresh('comments');
```

#### `intersect($items)` {.collection-method}

`intersect` 方法返回所有同时也出现在给定集合中的模型：

```php
use App\Models\User;

$users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());
```

#### `load($relations)` {.collection-method}

`load` 方法会为集合中的所有模型预加载给定的关联：

```php
$users->load(['comments', 'posts']);

$users->load('comments.author');

$users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

#### `loadMissing($relations)` {.collection-method}

如果关联尚未加载，`loadMissing` 方法会为集合中的所有模型预加载给定的关联：

```php
$users->loadMissing(['comments', 'posts']);

$users->loadMissing('comments.author');

$users->loadMissing(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

#### `modelKeys()` {.collection-method}

`modelKeys` 方法返回集合中所有模型的主键：

```php
$users->modelKeys();

// [1, 2, 3, 4, 5]
```

#### `makeVisible($attributes)` {.collection-method}

`makeVisible` 方法会[让属性在集合中每个模型上可见](/topic/Laravel%2013.x/m892ge6y01.html)，这些属性通常处于"隐藏"状态：

```php
$users = $users->makeVisible(['address', 'phone_number']);
```

#### `makeHidden($attributes)` {.collection-method}

`makeHidden` 方法会[隐藏属性](/topic/Laravel%2013.x/m892ge6y01.html)，这些属性通常在集合中每个模型上处于"可见"状态：

```php
$users = $users->makeHidden(['address', 'phone_number']);
```

#### `mergeVisible($attributes)` {.collection-method}

`mergeVisible` 方法在保留现有可见属性的同时，[让额外的属性可见](/topic/Laravel%2013.x/m892ge6y01.html)：

```php
$users = $users->mergeVisible(['middle_name']);
```

#### `mergeHidden($attributes)` {.collection-method}

`mergeHidden` 方法在保留现有隐藏属性的同时，[隐藏额外的属性](/topic/Laravel%2013.x/m892ge6y01.html)：

```php
$users = $users->mergeHidden(['last_login_at']);
```

#### `only($keys)` {.collection-method}

`only` 方法返回所有具有给定主键的模型：

```php
$users = $users->only([1, 2, 3]);
```

#### `partition` {.collection-method}

`partition` 方法返回一个包含 `Illuminate\Database\Eloquent\Collection` 集合实例的 `Illuminate\Support\Collection` 实例：

```php
$partition = $users->partition(fn ($user) => $user->age > 18);

dump($partition::class);    // Illuminate\Support\Collection
dump($partition[0]::class); // Illuminate\Database\Eloquent\Collection
dump($partition[1]::class); // Illuminate\Database\Eloquent\Collection
```

#### `setAppends($attributes)` {.collection-method}

`setAppends` 方法会临时覆盖集合中每个模型上的[追加属性](/topic/Laravel%2013.x/m892ge6y01.html)：

```php
$users = $users->setAppends(['is_admin']);
```

#### `setVisible($attributes)` {.collection-method}

`setVisible` 方法会[临时覆盖](/topic/Laravel%2013.x/m892ge6y01.html)集合中每个模型上的所有可见属性：

```php
$users = $users->setVisible(['id', 'name']);
```

#### `setHidden($attributes)` {.collection-method}

`setHidden` 方法会[临时覆盖](/topic/Laravel%2013.x/m892ge6y01.html)集合中每个模型上的所有隐藏属性：

```php
$users = $users->setHidden(['email', 'password', 'remember_token']);
```

#### `toQuery()` {.collection-method}

`toQuery` 方法返回一个 Eloquent 查询构造器实例，其中包含针对集合模型主键的 `whereIn` 约束：

```php
use App\Models\User;

$users = User::where('status', 'VIP')->get();

$users->toQuery()->update([
    'status' => 'Administrator',
]);
```

#### `unique($key = null, $strict = false)` {.collection-method}

`unique` 方法返回集合中所有唯一的模型。任何与集合中另一个模型拥有相同主键的模型都会被移除：

```php
$users = $users->unique();
```

#### `withoutAppends()` {.collection-method}

`withoutAppends` 方法会临时移除集合中每个模型上的[追加属性](/topic/Laravel%2013.x/m892ge6y01.html)：

```php
$users = $users->withoutAppends();
```

## 自定义集合

如果你希望在与某个给定模型交互时使用自定义的 `Collection` 对象，可以向模型添加 `CollectedBy` 属性：

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

或者，你可以在模型上定义 `newCollection` 方法：

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

一旦你在模型上定义了 `newCollection` 方法或添加了 `CollectedBy` 属性，任何原本会返回 `Illuminate\Database\Eloquent\Collection` 实例的地方，你都会收到自定义集合的实例。

如果你希望为应用中的每个模型都使用自定义集合，应当在所有模型都继承的基础模型类上定义 `newCollection` 方法。