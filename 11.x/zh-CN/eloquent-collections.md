# Eloquent：集合

- [简介](#introduction)
- [可用方法](#available-methods)
- [自定义集合](#custom-collections)

<a name="introduction"></a>
## 简介

所有返回多个模型结果的 Eloquent 方法都会返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索到的结果或通过关联访问到的结果。Eloquent 集合对象继承 Laravel 的[基础集合](/docs/{{version}}/collections)，因此它自然继承了数十种用于流畅操作底层 Eloquent 模型数组的方法。一定要查阅 Laravel 集合文档，了解这些有用的方法！

所有集合同时也是迭代器，允许你像遍历普通 PHP 数组那样遍历它们：

    use App\Models\User;

    $users = User::where('active', 1)->get();

    foreach ($users as $user) {
        echo $user->name;
    }

不过，如前所述，集合比数组强大得多，并提供各种可以通过直观接口进行链式调用的 map / reduce 操作。例如，我们可以移除所有非活跃模型，然后收集每位剩余用户的名字：

    $names = User::all()->reject(function (User $user) {
        return $user->active === false;
    })->map(function (User $user) {
        return $user->name;
    });

<a name="eloquent-collection-conversion"></a>
#### Eloquent 集合转换

虽然大多数 Eloquent 集合方法都会返回一个 Eloquent 集合的新实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法会返回一个[基础集合](/docs/{{version}}/collections)实例。同理，如果某个 `map` 操作返回的集合不包含任何 Eloquent 模型，它也会被转换为基础集合实例。

<a name="available-methods"></a>
## 可用方法

所有 Eloquent 集合都继承基础的 [Laravel 集合](/docs/{{version}}/collections#available-methods)对象，因此它们继承了基础集合类提供的所有强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类提供了更多方法，帮助你管理模型集合。大多数方法会返回 `Illuminate\Database\Eloquent\Collection` 实例；不过有些方法（如 `modelKeys`）会返回 `Illuminate\Support\Collection` 实例。

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
[only](#method-only)
[setVisible](#method-setVisible)
[setHidden](#method-setHidden)
[toQuery](#method-toquery)
[unique](#method-unique)

</div>

<a name="method-append"></a>
#### `append($attributes)` {.collection-method .first-collection-method}

`append` 方法可用于指示某个属性应当为集合中的每个模型被[追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。该方法接受一个属性数组或单个属性：

    $users->append('team');

    $users->append(['team', 'is_admin']);

<a name="method-contains"></a>
#### `contains($key, $operator = null, $value = null)` {.collection-method}

`contains` 方法可用于判断集合中是否包含给定的模型实例。该方法接受一个主键或一个模型实例：

    $users->contains(1);

    $users->contains(User::find(1));

<a name="method-diff"></a>
#### `diff($items)` {.collection-method}

`diff` 方法返回给定集合中不存在的所有模型：

    use App\Models\User;

    $users = $users->diff(User::whereIn('id', [1, 2, 3])->get());

<a name="method-except"></a>
#### `except($keys)` {.collection-method}

`except` 方法返回不具有给定主键的所有模型：

    $users = $users->except([1, 2, 3]);

<a name="method-find"></a>
#### `find($key)` {.collection-method}

`find` 方法返回主键与给定键匹配的模型。如果 `$key` 是一个模型实例，`find` 会尝试返回主键匹配的模型。如果 `$key` 是一个键数组，`find` 会返回主键在该数组中的所有模型：

    $users = User::all();

    $user = $users->find(1);

<a name="method-find-or-fail"></a>
#### `findOrFail($key)` {.collection-method}

`findOrFail` 方法返回主键与给定键匹配的模型；如果在集合中找不到匹配的模型，则抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

    $users = User::all();

    $user = $users->findOrFail(1);

<a name="method-fresh"></a>
#### `fresh($with = [])` {.collection-method}

`fresh` 方法从数据库中重新获取集合中每个模型的新实例。此外，指定的任何关联都会被预加载：

    $users = $users->fresh();

    $users = $users->fresh('comments');

<a name="method-intersect"></a>
#### `intersect($items)` {.collection-method}

`intersect` 方法返回同时存在于给定集合中的所有模型：

    use App\Models\User;

    $users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());

<a name="method-load"></a>
#### `load($relations)` {.collection-method}

`load` 方法为集合中的所有模型预加载给定的关联：

    $users->load(['comments', 'posts']);

    $users->load('comments.author');

    $users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);

<a name="method-loadMissing"></a>
#### `loadMissing($relations)` {.collection-method}

如果关联尚未加载，`loadMissing` 方法会为集合中的所有模型预加载给定的关联：

    $users->loadMissing(['comments', 'posts']);

    $users->loadMissing('comments.author');

    $users->loadMissing(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);

<a name="method-modelKeys"></a>
#### `modelKeys()` {.collection-method}

`modelKeys` 方法返回集合中所有模型的主键：

    $users->modelKeys();

    // [1, 2, 3, 4, 5]

<a name="method-makeVisible"></a>
#### `makeVisible($attributes)` {.collection-method}

`makeVisible` 方法把集合中每个模型上通常"隐藏"的属性[变为可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

    $users = $users->makeVisible(['address', 'phone_number']);

<a name="method-makeHidden"></a>
#### `makeHidden($attributes)` {.collection-method}

`makeHidden` 方法把集合中每个模型上通常"可见"的属性[隐藏起来](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

    $users = $users->makeHidden(['address', 'phone_number']);

<a name="method-only"></a>
#### `only($keys)` {.collection-method}

`only` 方法返回具有给定主键的所有模型：

    $users = $users->only([1, 2, 3]);

<a name="method-setVisible"></a>
#### `setVisible($attributes)` {.collection-method}

`setVisible` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型上的所有可见属性：

    $users = $users->setVisible(['id', 'name']);

<a name="method-setHidden"></a>
#### `setHidden($attributes)` {.collection-method}

`setHidden` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型上的所有隐藏属性：

    $users = $users->setHidden(['email', 'password', 'remember_token']);

<a name="method-toquery"></a>
#### `toQuery()` {.collection-method}

`toQuery` 方法返回一个 Eloquent 查询构造器实例，其中包含针对集合模型主键的 `whereIn` 约束：

    use App\Models\User;

    $users = User::where('status', 'VIP')->get();

    $users->toQuery()->update([
        'status' => 'Administrator',
    ]);

<a name="method-unique"></a>
#### `unique($key = null, $strict = false)` {.collection-method}

`unique` 方法返回集合中所有唯一的模型。主键与集合中其他模型相同的模型都会被移除：

    $users = $users->unique();

<a name="custom-collections"></a>
## 自定义集合

如果你在与某个给定模型交互时希望使用自定义的 `Collection` 对象，可以给模型添加 `CollectedBy` 属性：

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

或者，你也可以在模型上定义一个 `newCollection` 方法：

    <?php

    namespace App\Models;

    use App\Support\UserCollection;
    use Illuminate\Database\Eloquent\Collection;
    use Illuminate\Database\Eloquent\Model;

    class User extends Model
    {
        /**
         * 创建一个新的 Eloquent 集合实例。
         *
         * @param  array<int, \Illuminate\Database\Eloquent\Model>  $models
         * @return \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Database\Eloquent\Model>
         */
        public function newCollection(array $models = []): Collection
        {
            return new UserCollection($models);
        }
    }

定义好 `newCollection` 方法或给模型添加 `CollectedBy` 属性后，凡是 Eloquent 原本会返回 `Illuminate\Database\Eloquent\Collection` 实例的地方，你都会收到自定义集合的实例。

如果你希望应用中的每个模型都使用自定义集合，应当在一个基础模型类上定义 `newCollection` 方法，并让应用中所有模型都继承该基础类。
