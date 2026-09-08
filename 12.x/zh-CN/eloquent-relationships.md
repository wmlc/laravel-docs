# Eloquent：关联

- [简介](#introduction)
- [定义关联](#defining-relationships)
    - [一对一 / Has One](#one-to-one)
    - [一对多 / Has Many](#one-to-many)
    - [一对多（反向）/ Belongs To](#one-to-many-inverse)
    - [多条中的一条（Has One of Many）](#has-one-of-many)
    - [远程一对一（Has One Through）](#has-one-through)
    - [远程一对多（Has Many Through）](#has-many-through)
- [带作用域的关联](#scoped-relationships)
- [多对多关联](#many-to-many)
    - [检索中间表字段](#retrieving-intermediate-table-columns)
    - [通过中间表字段过滤查询](#filtering-queries-via-intermediate-table-columns)
    - [通过中间表字段排序查询](#ordering-queries-via-intermediate-table-columns)
    - [定义自定义中间表模型](#defining-custom-intermediate-table-models)
- [多态关联](#polymorphic-relationships)
    - [一对一](#one-to-one-polymorphic-relations)
    - [一对多](#one-to-many-polymorphic-relations)
    - [多态取一](#one-of-many-polymorphic-relations)
    - [多对多](#many-to-many-polymorphic-relations)
    - [自定义多态类型](#custom-polymorphic-types)
- [动态关联](#dynamic-relationships)
- [查询关联](#querying-relations)
    - [关联方法与动态属性](#relationship-methods-vs-dynamic-properties)
    - [查询关联是否存在](#querying-relationship-existence)
    - [查询关联是否缺失](#querying-relationship-absence)
    - [查询 Morph To 关联](#querying-morph-to-relationships)
- [聚合关联模型](#aggregating-related-models)
    - [统计关联模型数量](#counting-related-models)
    - [其他聚合函数](#other-aggregate-functions)
    - [在 Morph To 关联上统计关联模型数量](#counting-related-models-on-morph-to-relationships)
- [预加载](#eager-loading)
    - [约束预加载](#constraining-eager-loads)
    - [延迟预加载](#lazy-eager-loading)
    - [自动预加载](#automatic-eager-loading)
    - [阻止延迟加载](#preventing-lazy-loading)
- [插入与更新关联模型](#inserting-and-updating-related-models)
    - [`save` 方法](#the-save-method)
    - [`create` 方法](#the-create-method)
    - [Belongs To 关联](#updating-belongs-to-relationships)
    - [多对多关联](#updating-many-to-many-relationships)
- [更新父模型时间戳](#touching-parent-timestamps)

<a name="introduction"></a>
## 简介

数据库表之间常常彼此关联。例如，一篇博客文章可能有众多评论，或者一个订单可能与下单用户相关联。Eloquent 让管理和使用这些关联变得十分简单，并支持多种常见的关联类型：

- [一对一](#one-to-one)
- [一对多](#one-to-many)
- [多对多](#many-to-many)
- [远程一对一（Has One Through）](#has-one-through)
- [远程一对多（Has Many Through）](#has-many-through)
- [一对一（多态）](#one-to-one-polymorphic-relations)
- [一对多（多态）](#one-to-many-polymorphic-relations)
- [多对多（多态）](#many-to-many-polymorphic-relations)

<a name="defining-relationships"></a>
## 定义关联

Eloquent 关联定义为 Eloquent 模型类上的方法。由于关联同时也是强大的[查询构造器](/docs/{{version}}/queries)，将关联定义为方法可以提供强大的方法链式调用和查询能力。例如，我们可以在 `posts` 关联上链式添加额外的查询约束：

```php
$user->posts()->where('active', 1)->get();
```

不过，在深入使用关联之前，让我们先学习如何定义 Eloquent 支持的每一种关联类型。

<a name="one-to-one"></a>
### 一对一 / Has One

一对一是一种非常基础的数据库关联类型。例如，一个 `User` 模型可能关联到一个 `Phone` 模型。要定义这种关联，我们要在 `User` 模型上放置一个 `phone` 方法。`phone` 方法应调用 `hasOne` 方法并返回其结果。`hasOne` 方法通过模型的 `Illuminate\Database\Eloquent\Model` 基类提供给你的模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * 获取与用户关联的电话。
     */
    public function phone(): HasOne
    {
        return $this->hasOne(Phone::class);
    }
}
```

传递给 `hasOne` 方法的第一个参数是关联模型类的名称。定义好关联之后，我们可以使用 Eloquent 的动态属性检索关联记录。动态属性让你能够像访问模型上定义的属性一样访问关联方法：

```php
$phone = User::find(1)->phone;
```

Eloquent 会根据父模型的名称来确定关联的外键。在本例中，Eloquent 会自动假定 `Phone` 模型拥有一个 `user_id` 外键。如果你想覆盖这一约定，可以向 `hasOne` 方法传递第二个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key');
```

此外，Eloquent 假定外键的值应与父模型的主键列匹配。换言之，Eloquent 会在 `Phone` 记录的 `user_id` 列中查找用户 `id` 列的值。如果你希望关联使用 `id` 或模型 `$primaryKey` 属性以外的主键值，可以向 `hasOne` 方法传递第三个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key', 'local_key');
```

<a name="one-to-one-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向关联

这样，我们就能从 `User` 模型访问 `Phone` 模型了。接下来，让我们在 `Phone` 模型上定义一个关联，让我们能够访问电话的所属用户。我们可以使用 `belongsTo` 方法定义 `hasOne` 关联的反向关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Phone extends Model
{
    /**
     * 获取电话的所属用户。
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

调用 `user` 方法时，Eloquent 会尝试查找一个 `id` 与 `Phone` 模型上 `user_id` 列相匹配的 `User` 模型。

Eloquent 通过检查关联方法的名称并在方法名后加上 `_id` 后缀来确定外键名称。因此，在本例中，Eloquent 假定 `Phone` 模型拥有一个 `user_id` 列。不过，如果 `Phone` 模型上的外键不是 `user_id`，你可以向 `belongsTo` 方法传递自定义键名作为第二个参数：

```php
/**
 * 获取电话的所属用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key');
}
```

如果父模型没有使用 `id` 作为主键，或者你希望使用其他列查找关联模型，可以向 `belongsTo` 方法传递第三个参数，指定父表的自定义键：

```php
/**
 * 获取电话的所属用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key', 'owner_key');
}
```

<a name="one-to-many"></a>
### 一对多 / Has Many

一对多关联用于定义单个模型作为一个或多个子模型父级的关联。例如，一篇博客文章可能有无数条评论。与所有其他 Eloquent 关联一样，一对多关联通过在 Eloquent 模型上定义方法来定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
```

请记住，Eloquent 会自动为 `Comment` 模型确定适当的外键列。按照约定，Eloquent 会取父模型的「蛇形命名」名称并加上 `_id` 后缀。因此，在本例中，Eloquent 会假定 `Comment` 模型上的外键列是 `post_id`。

定义好关联方法后，我们可以通过访问 `comments` 属性来访问关联评论的[集合](/docs/{{version}}/eloquent-collections)。请记住，由于 Eloquent 提供了「动态关联属性」，我们可以像访问模型上定义的属性一样访问关联方法：

```php
use App\Models\Post;

$comments = Post::find(1)->comments;

foreach ($comments as $comment) {
    // ...
}
```

由于所有关联同时也是查询构造器，你可以调用 `comments` 方法并继续在查询上链式添加条件，从而为关联查询添加更多约束：

```php
$comment = Post::find(1)->comments()
    ->where('title', 'foo')
    ->first();
```

与 `hasOne` 方法类似，你也可以通过向 `hasMany` 方法传递额外的参数来覆盖外键和本地键：

```php
return $this->hasMany(Comment::class, 'foreign_key');

return $this->hasMany(Comment::class, 'foreign_key', 'local_key');
```

<a name="automatically-hydrating-parent-models-on-children"></a>
#### 自动在子模型上填充父模型

即使使用了 Eloquent 预加载，如果在遍历子模型时尝试从子模型访问父模型，仍可能出现「N + 1」查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->post->title;
    }
}
```

在上面的示例中，尽管已经为每个 `Post` 模型预加载了评论，但 Eloquent 不会自动在每个子 `Comment` 模型上填充父 `Post`，因此引入了「N + 1」查询问题。

如果你希望 Eloquent 自动在子模型上填充（hydrate）父模型，可以在定义 `hasMany` 关联时调用 `chaperone` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->chaperone();
    }
}
```

或者，如果你希望在运行时启用自动父模型填充，可以在预加载关联时调用 `chaperone` 方法：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

<a name="one-to-many-inverse"></a>
### 一对多（反向）/ Belongs To

现在我们已经可以访问文章的所有评论，接下来定义一个关联，让评论能够访问其所属的父文章。要定义 `hasMany` 关联的反向关联，需要在子模型上定义一个调用 `belongsTo` 方法的关联方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * 获取评论的所属文章。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

定义好关联之后，我们可以通过访问 `post` 这个「动态关联属性」来检索评论的父文章：

```php
use App\Models\Comment;

$comment = Comment::find(1);

return $comment->post->title;
```

在上面的示例中，Eloquent 会尝试查找一个 `id` 与 `Comment` 模型上 `post_id` 列相匹配的 `Post` 模型。

Eloquent 通过检查关联方法的名称，并在方法名后加上 `_` 以及父模型主键列的名称，来确定默认外键名称。因此，在本例中，Eloquent 会假定 `Post` 模型在 `comments` 表上的外键是 `post_id`。

不过，如果你的关联外键没有遵循这些约定，你可以向 `belongsTo` 方法传递自定义外键名作为第二个参数：

```php
/**
 * 获取评论的所属文章。
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key');
}
```

如果你的父模型没有使用 `id` 作为主键，或者你希望使用其他列查找关联模型，可以向 `belongsTo` 方法传递第三个参数，指定父表的自定义键：

```php
/**
 * 获取评论的所属文章。
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key', 'owner_key');
}
```

<a name="default-models"></a>
#### 默认模型

`belongsTo`、`hasOne`、`hasOneThrough` 和 `morphOne` 关联允许你定义一个默认模型，当给定关联为 `null` 时将返回该模型。这种模式通常被称为[空对象模式（Null Object pattern）](https://en.wikipedia.org/wiki/Null_Object_pattern)，有助于减少代码中的条件检查。在下面的示例中，如果没有用户附加到 `Post` 模型，`user` 关联将返回一个空的 `App\Models\User` 模型：

```php
/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault();
}
```

要为默认模型填充属性，你可以向 `withDefault` 方法传递一个数组或闭包：

```php
/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author',
    ]);
}

/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault(function (User $user, Post $post) {
        $user->name = 'Guest Author';
    });
}
```

<a name="querying-belongs-to-relationships"></a>
#### 查询 Belongs To 关联

在查询「belongs to」关联的子模型时，你可以手动构建 `where` 子句来检索相应的 Eloquent 模型：

```php
use App\Models\Post;

$posts = Post::where('user_id', $user->id)->get();
```

不过，使用 `whereBelongsTo` 方法可能更加方便，它会自动为给定模型确定适当的关联和外键：

```php
$posts = Post::whereBelongsTo($user)->get();
```

你也可以向 `whereBelongsTo` 方法提供一个[集合](/docs/{{version}}/eloquent-collections)实例。这样，Laravel 将检索属于集合中任何父模型的模型：

```php
$users = User::where('vip', true)->get();

$posts = Post::whereBelongsTo($users)->get();
```

默认情况下，Laravel 会根据模型的类名确定与给定模型相关联的关联；不过，你可以通过将关联名称作为第二个参数提供给 `whereBelongsTo` 方法来手动指定关联名称：

```php
$posts = Post::whereBelongsTo($user, 'author')->get();
```

<a name="has-one-of-many"></a>
### 多条中的一条（Has One of Many）

有时，一个模型可能有许多关联模型，而你只想便捷地检索该关联中「最新」或「最旧」的关联模型。例如，一个 `User` 模型可能与许多 `Order` 模型相关联，但你希望定义一种便捷方式来与用户最近下的订单交互。你可以将 `hasOne` 关联类型与 `ofMany` 系列方法结合使用来实现：

```php
/**
 * 获取用户的最新订单。
 */
public function latestOrder(): HasOne
{
    return $this->hasOne(Order::class)->latestOfMany();
}
```

同样，你也可以定义一个方法来检索关联中「最旧」即第一条关联模型：

```php
/**
 * 获取用户最早的订单。
 */
public function oldestOrder(): HasOne
{
    return $this->hasOne(Order::class)->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法会基于模型的主键（该主键必须可排序）检索最新或最旧的关联模型。不过，有时你可能希望使用不同的排序条件，从更大的关联中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户金额最高的订单。`ofMany` 方法接收可排序的列作为第一个参数，以及查询关联模型时要应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户金额最大的订单。
 */
public function largestOrder(): HasOne
{
    return $this->hasOne(Order::class)->ofMany('price', 'max');
}
```

> [!WARNING]
> 由于 PostgreSQL 不支持对 UUID 列执行 `MAX` 函数，目前无法将「多取一」关联与 PostgreSQL 的 UUID 列结合使用。

<a name="converting-many-relationships-to-has-one-relationships"></a>
#### 将「多条」关联转换为 Has One 关联

通常，在使用 `latestOfMany`、`oldestOfMany` 或 `ofMany` 方法检索单个模型时，你已经为同一模型定义了「has many」关联。为了方便起见，Laravel 允许你通过在关联上调用 `one` 方法，轻松将该关联转换为「has one」关联：

```php
/**
 * 获取用户的订单。
 */
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

/**
 * 获取用户金额最大的订单。
 */
public function largestOrder(): HasOne
{
    return $this->orders()->one()->ofMany('price', 'max');
}
```

你也可以使用 `one` 方法将 `HasManyThrough` 关联转换为 `HasOneThrough` 关联：

```php
public function latestDeployment(): HasOneThrough
{
    return $this->deployments()->one()->latestOfMany();
}
```

<a name="advanced-has-one-of-many-relationships"></a>
#### 高级多条取一关联

你还可以构建更高级的「多条取一」关联。例如，一个 `Product` 模型可能有许多关联的 `Price` 模型，即使新定价发布后，旧的定价数据仍会保留在系统中。此外，产品的新定价数据可以提前发布，通过 `published_at` 列在未来的某个日期生效。

简而言之，我们需要检索发布日期不在未来的最新已发布定价。此外，如果两条价格的发布日期相同，我们将优先选择 ID 最大的那条。为此，我们必须向 `ofMany` 方法传递一个数组，其中包含用于确定最新价格的可排序列。此外，还要向 `ofMany` 方法提供一个闭包作为第二个参数。该闭包负责为关联查询添加额外的发布日期约束：

```php
/**
 * 获取产品的当前定价。
 */
public function currentPricing(): HasOne
{
    return $this->hasOne(Price::class)->ofMany([
        'published_at' => 'max',
        'id' => 'max',
    ], function (Builder $query) {
        $query->where('published_at', '<', now());
    });
}
```

<a name="has-one-through"></a>
### 远程一对一（Has One Through）

「远程一对一」关联定义与另一个模型的一对一关联。不过，这种关联表明声明关联的模型需要_通过_第三个模型才能与另一个模型的一个实例相匹配。

例如，在一家汽车修理店应用中，每个 `Mechanic` 模型可能与一个 `Car` 模型相关联，而每个 `Car` 模型可能与一个 `Owner` 模型相关联。虽然技工和车主在数据库中没有直接的关联，但技工可以_通过_ `Car` 模型访问车主。我们来看一下定义这种关联所需的表：

```text
mechanics
    id - integer
    name - string

cars
    id - integer
    model - string
    mechanic_id - integer

owners
    id - integer
    name - string
    car_id - integer
```

了解了关联的表结构之后，让我们在 `Mechanic` 模型上定义该关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Mechanic extends Model
{
    /**
     * 获取汽车的车主。
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(Owner::class, Car::class);
    }
}
```

传递给 `hasOneThrough` 方法的第一个参数是我们希望访问的最终模型的名称，而第二个参数是中间模型的名称。

或者，如果相关联的关联已经在关联涉及的所有模型上定义好了，你可以通过调用 `through` 方法并提供这些关联的名称，流畅地定义「远程一对一」关联。例如，如果 `Mechanic` 模型拥有 `cars` 关联，而 `Car` 模型拥有 `owner` 关联，你可以像这样定义连接技工和车主的「远程一对一」关联：

```php
// 基于字符串的语法……
return $this->through('cars')->has('owner');

// 动态语法……
return $this->throughCars()->hasOwner();
```

<a name="has-one-through-key-conventions"></a>
#### 键约定

执行关联查询时将使用 Eloquent 典型的外键约定。如果你想自定义关联的键，可以将它们作为第三个和第四个参数传递给 `hasOneThrough` 方法。第三个参数是中间模型上的外键名称，第四个参数是最终模型上的外键名称，第五个参数是本地键，而第六个参数是中间模型的本地键：

```php
class Mechanic extends Model
{
    /**
     * 获取汽车的车主。
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(
            Owner::class,
            Car::class,
            'mechanic_id', // cars 表的外键……
            'car_id', // owners 表的外键……
            'id', // mechanics 表的本地键……
            'id' // cars 表的本地键……
        );
    }
}
```

或者，如前所述，如果相关联的关联已经在关联涉及的所有模型上定义好了，你可以通过调用 `through` 方法并提供这些关联的名称，流畅地定义「远程一对一」关联。这种方式的优势在于，可以复用现有关联上已经定义的键约定：

```php
// 基于字符串的语法……
return $this->through('cars')->has('owner');

// 动态语法……
return $this->throughCars()->hasOwner();
```

<a name="has-many-through"></a>
### 远程一对多（Has Many Through）

「远程一对多」关联提供了一种通过中间关联访问间接关联的便捷方式。例如，假设我们正在构建一个类似 [Laravel Cloud](https://cloud.laravel.com) 的部署平台。`Application` 模型可能需要通过中间的 `Environment` 模型访问许多 `Deployment` 模型。使用这个示例，你可以轻松收集某个应用的所有部署。我们来看一下定义这种关联所需的表：

```text
applications
    id - integer
    name - string

environments
    id - integer
    application_id - integer
    name - string

deployments
    id - integer
    environment_id - integer
    commit_hash - string
```

了解了关联的表结构之后，让我们在 `Application` 模型上定义该关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Application extends Model
{
    /**
     * 获取应用的所有部署。
     */
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(Deployment::class, Environment::class);
    }
}
```

传递给 `hasManyThrough` 方法的第一个参数是我们希望访问的最终模型的名称，而第二个参数是中间模型的名称。

或者，如果相关联的关联已经在关联涉及的所有模型上定义好了，你可以通过调用 `through` 方法并提供这些关联的名称，流畅地定义「远程一对多」关联。例如，如果 `Application` 模型拥有 `environments` 关联，而 `Environment` 模型拥有 `deployments` 关联，你可以像这样定义连接应用和部署的「远程一对多」关联：

```php
// 基于字符串的语法……
return $this->through('environments')->has('deployments');

// 动态语法……
return $this->throughEnvironments()->hasDeployments();
```

尽管 `Deployment` 模型的表中不包含 `application_id` 列，但 `hasManyThrough` 关联让我们能够通过 `$application->deployments` 访问应用的部署。为了检索这些模型，Eloquent 会检查中间 `Environment` 模型表上的 `application_id` 列。找到相关的环境 ID 后，再用它们查询 `Deployment` 模型的表。

<a name="has-many-through-key-conventions"></a>
#### 键约定

执行关联查询时将使用 Eloquent 典型的外键约定。如果你想自定义关联的键，可以将它们作为第三个和第四个参数传递给 `hasManyThrough` 方法。第三个参数是中间模型上的外键名称，第四个参数是最终模型上的外键名称，第五个参数是本地键，而第六个参数是中间模型的本地键：

```php
class Application extends Model
{
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Deployment::class,
            Environment::class,
            'application_id', // environments 表的外键……
            'environment_id', // deployments 表的外键……
            'id', // applications 表的本地键……
            'id' // environments 表的本地键……
        );
    }
}
```

或者，如前所述，如果相关联的关联已经在关联涉及的所有模型上定义好了，你可以通过调用 `through` 方法并提供这些关联的名称，流畅地定义「远程一对多」关联。这种方式的优势在于，可以复用现有关联上已经定义的键约定：

```php
// 基于字符串的语法……
return $this->through('environments')->has('deployments');

// 动态语法……
return $this->throughEnvironments()->hasDeployments();
```

<a name="scoped-relationships"></a>
### 带作用域的关联

在模型上添加约束关联的额外方法十分常见。例如，你可以向 `User` 模型添加一个 `featuredPosts` 方法，它通过一个额外的 `where` 约束来限定更宽泛的 `posts` 关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * 获取用户的文章。
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->latest();
    }

    /**
     * 获取用户的精选文章。
     */
    public function featuredPosts(): HasMany
    {
        return $this->posts()->where('featured', true);
    }
}
```

不过，如果你尝试通过 `featuredPosts` 方法创建模型，其 `featured` 属性不会被设置为 `true`。如果你想通过关联方法创建模型，同时为通过该关联创建的所有模型指定应添加的属性，可以在构建关联查询时使用 `withAttributes` 方法：

```php
/**
 * 获取用户的精选文章。
 */
public function featuredPosts(): HasMany
{
    return $this->posts()->withAttributes(['featured' => true]);
}
```

`withAttributes` 方法会使用给定的属性为查询添加 `where` 条件，并且会将给定属性添加到通过该关联方法创建的所有模型上：

```php
$post = $user->featuredPosts()->create(['title' => 'Featured Post']);

$post->featured; // true
```

如果不想让 `withAttributes` 方法为查询添加 `where` 条件，可以将 `asConditions` 参数设置为 `false`：

```php
return $this->posts()->withAttributes(['featured' => true], asConditions: false);
```

<a name="many-to-many"></a>
## 多对多关联

多对多关联比 `hasOne` 和 `hasMany` 关联稍微复杂一些。多对多关联的一个例子是：一个用户拥有多个角色，而这些角色同时也被应用中的其他用户共享。例如，一个用户可能被分配「作者」和「编辑」两个角色；不过，这些角色也可能分配给其他用户。因此，一个用户拥有多个角色，一个角色也拥有多个用户。

<a name="many-to-many-table-structure"></a>
#### 表结构

要定义这种关联，需要三张数据库表：`users`、`roles` 和 `role_user`。`role_user` 表的名称由相关模型名称的字母顺序派生而来，包含 `user_id` 和 `role_id` 列。该表用作连接用户和角色的中间表。

请记住，由于一个角色可以属于多个用户，我们不能简单地在 `roles` 表上放置一个 `user_id` 列。否则，一个角色就只能属于单个用户了。为了支持将角色分配给多个用户，就需要 `role_user` 表。我们可以这样总结该关联的表结构：

```text
users
    id - integer
    name - string

roles
    id - integer
    name - string

role_user
    user_id - integer
    role_id - integer
```

<a name="many-to-many-model-structure"></a>
#### 模型结构

多对多关联通过编写一个返回 `belongsToMany` 方法结果的方法来定义。`belongsToMany` 方法由应用所有 Eloquent 模型使用的 `Illuminate\Database\Eloquent\Model` 基类提供。例如，让我们在 `User` 模型上定义一个 `roles` 方法。传递给该方法的第一个参数是关联模型类的名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    /**
     * 获取属于用户的角色。
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

定义好关联之后，你可以使用 `roles` 动态关联属性访问用户的角色：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    // ...
}
```

由于所有关联同时也是查询构造器，你可以调用 `roles` 方法并继续在查询上链式添加条件，从而为关联查询添加更多约束：

```php
$roles = User::find(1)->roles()->orderBy('name')->get();
```

为了确定关联中间表的表名，Eloquent 会按字母顺序拼接两个相关模型的名称。不过，你可以自由覆盖这一约定，方法是向 `belongsToMany` 方法传递第二个参数：

```php
return $this->belongsToMany(Role::class, 'role_user');
```

除了自定义中间表的名称，你还可以通过向 `belongsToMany` 方法传递额外的参数，自定义表上键的列名。第三个参数是定义关联的模型的外键名，第四个参数是要连接到的模型的外键名：

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

<a name="many-to-many-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向关联

要定义多对多关联的「反向」关联，你应在关联模型上定义一个同样返回 `belongsToMany` 方法结果的方法。为了完成我们的用户 / 角色示例，让我们在 `Role` 模型上定义 `users` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 获取属于该角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```

如你所见，除了引用 `App\Models\User` 模型之外，该关联的定义与其在 `User` 模型上的对应定义完全相同。由于我们复用了 `belongsToMany` 方法，在定义多对多关联的「反向」关联时，所有常规的表和键自定义选项都可用。

<a name="retrieving-intermediate-table-columns"></a>
### 检索中间表字段

正如你已经了解的，使用多对多关联需要有中间表。Eloquent 提供了一些非常有用的方式来与这张表交互。例如，假设我们的 `User` 模型关联到许多 `Role` 模型。访问该关联之后，我们可以通过模型上的 `pivot` 属性访问中间表：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

注意，我们检索到的每个 `Role` 模型都自动分配了一个 `pivot` 属性。该属性包含一个表示中间表的模型。

默认情况下，只有模型的键会出现在 `pivot` 模型上。如果你的中间表包含额外的属性，你必须在定义关联时指定它们：

```php
return $this->belongsToMany(Role::class)->withPivot('active', 'created_by');
```

如果你希望中间表拥有由 Eloquent 自动维护的 `created_at` 和 `updated_at` 时间戳，请在定义关联时调用 `withTimestamps` 方法：

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

> [!WARNING]
> 使用 Eloquent 自动维护时间戳的中间表，必须同时拥有 `created_at` 和 `updated_at` 时间戳列。

<a name="customizing-the-pivot-attribute-name"></a>
#### 自定义 `pivot` 属性名称

如前所述，中间表的属性可以通过 `pivot` 属性在模型上访问。不过，你可以自由自定义该属性的名称，使其更契合它在应用中的用途。

例如，如果你的应用中用户可以订阅播客，那么用户和播客之间很可能存在多对多关联。如果是这种情况，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。这可以在定义关联时使用 `as` 方法来完成：

```php
return $this->belongsToMany(Podcast::class)
    ->as('subscription')
    ->withTimestamps();
```

指定了自定义的中间表属性之后，你就可以使用自定义的名称访问中间表数据：

```php
$users = User::with('podcasts')->get();

foreach ($users->flatMap->podcasts as $podcast) {
    echo $podcast->subscription->created_at;
}
```

<a name="filtering-queries-via-intermediate-table-columns"></a>
### 通过中间表字段过滤查询

在定义关联时，你还可以使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法，对 `belongsToMany` 关联查询返回的结果进行过滤：

```php
return $this->belongsToMany(Role::class)
    ->wherePivot('approved', 1);

return $this->belongsToMany(Role::class)
    ->wherePivotIn('priority', [1, 2]);

return $this->belongsToMany(Role::class)
    ->wherePivotNotIn('priority', [1, 2]);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNull('expired_at');

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNotNull('expired_at');
```

`wherePivot` 会为查询添加一个 where 子句约束，但在通过定义的关联创建新模型时，不会添加指定的值。如果你既需要查询又需要创建带有特定中间表值的关联，可以使用 `withPivotValue` 方法：

```php
return $this->belongsToMany(Role::class)
    ->withPivotValue('approved', 1);
```

<a name="ordering-queries-via-intermediate-table-columns"></a>
### 通过中间表字段排序查询

你可以使用 `orderByPivot` 和 `orderByPivotDesc` 方法对 `belongsToMany` 关联查询返回的结果进行排序。在下面的示例中，我们将检索用户的所有最新徽章：

```php
return $this->belongsToMany(Badge::class)
    ->where('rank', 'gold')
    ->orderByPivotDesc('created_at');
```

<a name="defining-custom-intermediate-table-models"></a>
### 定义自定义中间表模型

如果你想定义一个自定义模型来表示多对多关联的中间表，可以在定义关联时调用 `using` 方法。自定义中间表模型让你有机会在中间表模型上定义额外的行为，例如方法和类型转换。

自定义的多对多中间表模型应继承 `Illuminate\Database\Eloquent\Relations\Pivot` 类，而自定义的多态多对多中间表模型应继承 `Illuminate\Database\Eloquent\Relations\MorphPivot` 类。例如，我们可以定义一个使用自定义 `RoleUser` 中间表模型的 `Role` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 获取属于该角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->using(RoleUser::class);
    }
}
```

定义 `RoleUser` 模型时，你应继承 `Illuminate\Database\Eloquent\Relations\Pivot` 类：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    // ...
}
```

> [!WARNING]
> 中间表模型不能使用 `SoftDeletes` trait。如果你需要对中间表记录进行软删除，请考虑将中间表模型转换为真正的 Eloquent 模型。

<a name="custom-pivot-models-and-incrementing-ids"></a>
#### 自定义中间表模型与自增 ID

如果你定义的多对多关联使用了自定义中间表模型，且该中间表模型拥有自增主键，你应确保自定义中间表模型类定义了一个设置为 `true` 的 `incrementing` 属性。

```php
/**
 * 指示 ID 是否自增。
 *
 * @var bool
 */
public $incrementing = true;
```

<a name="polymorphic-relationships"></a>
## 多态关联

多态关联允许子模型通过单个关联属于多种类型的模型。例如，假设你正在构建一个允许用户分享博客文章和视频的应用。在这样的应用中，一个 `Comment` 模型可能既属于 `Post` 模型，又属于 `Video` 模型。

<a name="one-to-one-polymorphic-relations"></a>
### 一对一（多态）

<a name="one-to-one-polymorphic-table-structure"></a>
#### 表结构

一对一多态关联与典型的一对一关联类似；不同的是，子模型可以通过单个关联属于多种类型的模型。例如，一篇博客 `Post` 和一个 `User` 可能与一个 `Image` 模型共享多态关联。使用一对一多态关联，你可以用一张唯一的图片表来保存可关联到文章和用户的图片。首先，我们来看一下表结构：

```text
posts
    id - integer
    name - string

users
    id - integer
    name - string

images
    id - integer
    url - string
    imageable_id - integer
    imageable_type - string
```

注意 `images` 表上的 `imageable_id` 和 `imageable_type` 列。`imageable_id` 列将包含文章或用户的 ID 值，而 `imageable_type` 列将包含父模型的类名。Eloquent 使用 `imageable_type` 列来确定访问 `imageable` 关联时应返回哪种「类型」的父模型。在本例中，该列的值可能是 `App\Models\Post` 或 `App\Models\User`。

<a name="one-to-one-polymorphic-model-structure"></a>
#### 模型结构

接下来，我们来看构建该关联所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Image extends Model
{
    /**
     * 获取父级 imageable 模型（用户或文章）。
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Post extends Model
{
    /**
     * 获取文章的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class User extends Model
{
    /**
     * 获取用户的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

<a name="one-to-one-polymorphic-retrieving-the-relationship"></a>
#### 检索关联

定义好数据库表和模型之后，你就可以通过模型访问关联了。例如，要检索一篇文章的图片，我们可以访问 `image` 动态关联属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

你可以通过访问调用 `morphTo` 的方法名来检索多态模型的父级。在本例中，就是 `Image` 模型上的 `imageable` 方法。因此，我们将该方法作为动态关联属性来访问：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关联将返回 `Post` 或 `User` 实例，具体取决于哪种类型的模型拥有该图片。

<a name="morph-one-to-one-key-conventions"></a>
#### 键约定

如有需要，你可以指定多态子模型所使用的「id」列和「type」列的名称。如果这样做，请确保始终将关联名称作为第一个参数传递给 `morphTo` 方法。通常，该值应与方法名一致，因此你可以使用 PHP 的 `__FUNCTION__` 常量：

```php
/**
 * 获取图片的所属模型。
 */
public function imageable(): MorphTo
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

<a name="one-to-many-polymorphic-relations"></a>
### 一对多（多态）

<a name="one-to-many-polymorphic-table-structure"></a>
#### 表结构

一对多多态关联与典型的一对多关联类似；不同的是，子模型可以通过单个关联属于多种类型的模型。例如，假设应用的用户可以对文章和视频进行「评论」。使用多态关联，你可以用一张 `comments` 表来同时保存文章和视频的评论。首先，我们来看构建该关联所需的表结构：

```text
posts
    id - integer
    title - string
    body - text

videos
    id - integer
    title - string
    url - string

comments
    id - integer
    body - text
    commentable_id - integer
    commentable_type - string
```

<a name="one-to-many-polymorphic-model-structure"></a>
#### 模型结构

接下来，我们来看构建该关联所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
    /**
     * 获取父级 commentable 模型（文章或视频）。
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * 获取文章的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Video extends Model
{
    /**
     * 获取视频的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

<a name="one-to-many-polymorphic-retrieving-the-relationship"></a>
#### 检索关联

定义好数据库表和模型之后，你就可以通过模型的动态关联属性访问关联了。例如，要访问一篇文章的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    // ...
}
```

你也可以通过访问调用 `morphTo` 的方法名来检索多态子模型的父级。在本例中，就是 `Comment` 模型上的 `commentable` 方法。因此，我们将该方法作为动态关联属性来访问，以便获取评论的父模型：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

`Comment` 模型上的 `commentable` 关联将返回 `Post` 或 `Video` 实例，具体取决于哪种类型的模型是该评论的父级。

<a name="polymorphic-automatically-hydrating-parent-models-on-children"></a>
#### 自动在子模型上填充父模型

即使使用了 Eloquent 预加载，如果在遍历子模型时尝试从子模型访问父模型，仍可能出现「N + 1」查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->commentable->title;
    }
}
```

在上面的示例中，尽管已经为每个 `Post` 模型预加载了评论，但 Eloquent 不会自动在每个子 `Comment` 模型上填充父 `Post`，因此引入了「N + 1」查询问题。

如果你希望 Eloquent 自动在子模型上填充父模型，可以在定义 `morphMany` 关联时调用 `chaperone` 方法：

```php
class Post extends Model
{
    /**
     * 获取文章的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')->chaperone();
    }
}
```

或者，如果你希望在运行时启用自动父模型填充，可以在预加载关联时调用 `chaperone` 方法：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

<a name="one-of-many-polymorphic-relations"></a>
### 多态取一（One of Many）

有时，一个模型可能有许多关联模型，而你只想便捷地检索该关联中「最新」或「最旧」的关联模型。例如，一个 `User` 模型可能与许多 `Image` 模型相关联，但你希望定义一种便捷方式来与用户最近上传的图片交互。你可以将 `morphOne` 关联类型与 `ofMany` 系列方法结合使用来实现：

```php
/**
 * 获取用户的最新图片。
 */
public function latestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->latestOfMany();
}
```

同样，你也可以定义一个方法来检索关联中「最旧」即第一条关联模型：

```php
/**
 * 获取用户最早的图片。
 */
public function oldestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法会基于模型的主键（该主键必须可排序）检索最新或最旧的关联模型。不过，有时你可能希望使用不同的排序条件，从更大的关联中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户「点赞」最多的图片。`ofMany` 方法接收可排序的列作为第一个参数，以及查询关联模型时要应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最受欢迎的图片。
 */
public function bestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->ofMany('likes', 'max');
}
```

> [!NOTE]
> 你可以构建更高级的「多态取一」关联。更多信息请查阅[多条取一文档](#advanced-has-one-of-many-relationships)。

<a name="many-to-many-polymorphic-relations"></a>
### 多对多（多态）

<a name="many-to-many-polymorphic-table-structure"></a>
#### 表结构

多对多多态关联比「morph one」和「morph many」关联稍微复杂一些。例如，`Post` 模型和 `Video` 模型可以与一个 `Tag` 模型共享多态关联。在这种情况下使用多对多多态关联，你的应用就可以用一张唯一的标签表来保存可关联到文章或视频的标签。首先，我们来看构建该关联所需的表结构：

```text
posts
    id - integer
    name - string

videos
    id - integer
    name - string

tags
    id - integer
    name - string

taggables
    tag_id - integer
    taggable_id - integer
    taggable_type - string
```

> [!NOTE]
> 在深入了解多态多对多关联之前，先阅读典型的[多对多关联](#many-to-many)文档可能会对你有所帮助。

<a name="many-to-many-polymorphic-model-structure"></a>
#### 模型结构

接下来，我们就可以在模型上定义关联了。`Post` 和 `Video` 模型都将包含一个 `tags` 方法，该方法调用 Eloquent 基类模型提供的 `morphToMany` 方法。

`morphToMany` 方法接收关联模型的名称以及「关联名称」。根据我们为中间表及其所含键指定的名称，我们将该关联称为「taggable」：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Post extends Model
{
    /**
     * 获取文章的所有标签。
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向关联

接下来，在 `Tag` 模型上，你应为每个可能的父模型定义一个方法。因此，在本例中，我们将定义 `posts` 方法和 `videos` 方法。这两个方法都应返回 `morphedByMany` 方法的结果。

`morphedByMany` 方法接收关联模型的名称以及「关联名称」。根据我们为中间表及其所含键指定的名称，我们将该关联称为「taggable」：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    /**
     * 获取被分配了该标签的所有文章。
     */
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    /**
     * 获取被分配了该标签的所有视频。
     */
    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-retrieving-the-relationship"></a>
#### 检索关联

定义好数据库表和模型之后，你就可以通过模型访问关联了。例如，要访问一篇文章的所有标签，可以使用 `tags` 动态关联属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->tags as $tag) {
    // ...
}
```

你可以从多态子模型出发，通过访问调用 `morphedByMany` 的方法名来检索多态关联的父级。在本例中，就是 `Tag` 模型上的 `posts` 或 `videos` 方法：

```php
use App\Models\Tag;

$tag = Tag::find(1);

foreach ($tag->posts as $post) {
    // ...
}

foreach ($tag->videos as $video) {
    // ...
}
```

<a name="custom-polymorphic-types"></a>
### 自定义多态类型

默认情况下，Laravel 会使用完全限定类名来存储关联模型的「类型」。例如，在上面的一对多关联示例中，`Comment` 模型可能属于 `Post` 或 `Video` 模型，默认的 `commentable_type` 将分别是 `App\Models\Post` 或 `App\Models\Video`。不过，你可能希望将这些值与应用的内部结构解耦。

例如，我们可以使用 `post` 和 `video` 这样的简单字符串来代替模型名作为「类型」。这样，即使模型被重命名，我们数据库中的多态「类型」列的值也依然有效：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);
```

你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enforceMorphMap` 方法，如果愿意，也可以创建一个单独的服务提供者。

你可以在运行时使用模型的 `getMorphClass` 方法确定给定模型的 morph 别名。反之，你可以使用 `Relation::getMorphedModel` 方法确定与某个 morph 别名关联的完全限定类名：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

$alias = $post->getMorphClass();

$class = Relation::getMorphedModel($alias);
```

> [!WARNING]
> 在现有应用中添加「morph 映射」时，数据库中每个仍包含完全限定类名的 morphable `*_type` 列值，都需要转换为其「映射」名称。

<a name="dynamic-relationships"></a>
### 动态关联

你可以使用 `resolveRelationUsing` 方法在运行时定义 Eloquent 模型之间的关联。虽然通常不推荐在常规应用开发中使用，但在开发 Laravel 扩展包时，它偶尔会派上用场。

`resolveRelationUsing` 方法接收所需的关联名称作为第一个参数。传递给该方法的第二个参数应是一个闭包，闭包接收模型实例并返回一个有效的 Eloquent 关联定义。通常，你应在[服务提供者](/docs/{{version}}/providers)的 boot 方法中配置动态关联：

```php
use App\Models\Order;
use App\Models\Customer;

Order::resolveRelationUsing('customer', function (Order $orderModel) {
    return $orderModel->belongsTo(Customer::class, 'customer_id');
});
```

> [!WARNING]
> 在定义动态关联时，请始终为 Eloquent 关联方法提供显式的键名参数。

<a name="querying-relations"></a>
## 查询关联

由于所有 Eloquent 关联都通过方法定义，你可以调用这些方法来获取关联的实例，而无需真正执行查询来加载关联模型。此外，所有类型的 Eloquent 关联同时也是[查询构造器](/docs/{{version}}/queries)，让你能够在最终对数据库执行 SQL 查询之前，继续在关联查询上链式添加约束。

例如，假设一个博客应用中，`User` 模型关联到许多 `Post` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * 获取用户的所有文章。
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

你可以像这样查询 `posts` 关联，并为关联添加额外的约束：

```php
use App\Models\User;

$user = User::find(1);

$user->posts()->where('active', 1)->get();
```

你可以在关联上使用 Laravel [查询构造器](/docs/{{version}}/queries)的任何方法，因此请务必查阅查询构造器文档，了解所有可用的方法。

<a name="chaining-orwhere-clauses-after-relationships"></a>
#### 在关联后链式调用 `orWhere` 子句

如上例所示，你可以在查询关联时自由添加额外的约束。但是，在关联上链式调用 `orWhere` 子句时要格外小心，因为 `orWhere` 子句会在逻辑上与关联约束处于同一分组层级：

```php
$user->posts()
    ->where('active', 1)
    ->orWhere('votes', '>=', 100)
    ->get();
```

上面的示例将生成以下 SQL。如你所见，`or` 子句会让查询返回_任何_票数大于 100 的文章，查询不再局限于特定用户：

```sql
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应该使用[逻辑分组](/docs/{{version}}/queries#logical-grouping)将条件检查用括号分组：

```php
use Illuminate\Database\Eloquent\Builder;

$user->posts()
    ->where(function (Builder $query) {
        return $query->where('active', 1)
            ->orWhere('votes', '>=', 100);
    })
    ->get();
```

上面的示例将生成以下 SQL。注意，逻辑分组已正确地对约束进行了分组，查询仍然局限于特定用户：

```sql
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

<a name="relationship-methods-vs-dynamic-properties"></a>
### 关联方法与动态属性

如果不需要为 Eloquent 关联查询添加额外的约束，你可以像访问属性一样访问关联。例如，继续使用我们的 `User` 和 `Post` 示例模型，我们可以像这样访问用户的所有文章：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->posts as $post) {
    // ...
}
```

动态关联属性执行的是「延迟加载」，即只有当你真正访问它们时，才会加载关联数据。因此，开发者经常使用[预加载](#eager-loading)来提前加载他们知道在模型加载后会被访问的关联。预加载能显著减少加载模型关联所必须执行的 SQL 查询数量。

<a name="querying-relationship-existence"></a>
### 查询关联是否存在

在检索模型记录时，你可能希望根据关联是否存在来限制结果。例如，假设你想检索所有至少有一条评论的博客文章。为此，你可以将关联名称传递给 `has` 和 `orHas` 方法：

```php
use App\Models\Post;

// 检索所有至少有一条评论的文章……
$posts = Post::has('comments')->get();
```

你还可以指定运算符和数量值，进一步自定义查询：

```php
// 检索所有拥有三条及以上评论的文章……
$posts = Post::has('comments', '>=', 3)->get();
```

可以使用「点」符号构建嵌套的 `has` 语句。例如，你可以检索所有至少有一条评论、且该评论至少有一张图片的文章：

```php
// 检索至少有一条带图片的评论的文章……
$posts = Post::has('comments.images')->get();
```

如果你需要更强大的功能，可以使用 `whereHas` 和 `orWhereHas` 方法在 `has` 查询上定义额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

// 检索至少有一条内容包含 code% 类词汇的评论的文章……
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();

// 检索至少有十条内容包含 code% 类词汇的评论的文章……
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
}, '>=', 10)->get();
```

> [!WARNING]
> Eloquent 目前不支持跨数据库查询关联是否存在。关联必须存在于同一个数据库中。

<a name="many-to-many-relationship-existence-queries"></a>
#### 多对多关联存在性查询

`whereAttachedTo` 方法可用于查询与某个模型或模型集合存在多对多附加关系的模型：

```php
$users = User::whereAttachedTo($role)->get();
```

你也可以向 `whereAttachedTo` 方法提供一个[集合](/docs/{{version}}/eloquent-collections)实例。这样，Laravel 将检索附加到集合中任何模型的模型：

```php
$tags = Tag::whereLike('name', '%laravel%')->get();

$posts = Post::whereAttachedTo($tags)->get();
```

<a name="inline-relationship-existence-queries"></a>
#### 内联关联存在性查询

如果你想在查询关联是否存在时，为关联查询附加一个简单直接的 where 条件，使用 `whereRelation`、`orWhereRelation`、`whereMorphRelation` 和 `orWhereMorphRelation` 方法可能更加方便。例如，我们可以查询所有拥有未获批准评论的文章：

```php
use App\Models\Post;

$posts = Post::whereRelation('comments', 'is_approved', false)->get();
```

当然，与调用查询构造器的 `where` 方法一样，你也可以指定运算符：

```php
$posts = Post::whereRelation(
    'comments', 'created_at', '>=', now()->minus(hours: 1)
)->get();
```

<a name="querying-relationship-absence"></a>
### 查询关联是否缺失

在检索模型记录时，你可能希望根据关联是否缺失来限制结果。例如，假设你想检索所有**没有**任何评论的博客文章。为此，你可以将关联名称传递给 `doesntHave` 和 `orDoesntHave` 方法：

```php
use App\Models\Post;

$posts = Post::doesntHave('comments')->get();
```

如果你需要更强大的功能，可以使用 `whereDoesntHave` 和 `orWhereDoesntHave` 方法为 `doesntHave` 查询添加额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();
```

你可以使用「点」符号对嵌套关联执行查询。例如，以下查询将检索所有没有评论的文章，以及虽有评论但所有评论都非被封禁用户所发的文章：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments.author', function (Builder $query) {
    $query->where('banned', 1);
})->get();
```

<a name="querying-morph-to-relationships"></a>
### 查询 Morph To 关联

要查询「morph to」关联是否存在，你可以使用 `whereHasMorph` 和 `whereDoesntHaveMorph` 方法。这些方法接收关联名称作为第一个参数。接着，方法接收你希望纳入查询的相关模型名称。最后，你可以提供一个自定义关联查询的闭包：

```php
use App\Models\Comment;
use App\Models\Post;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;

// 检索关联到标题类似 code% 的文章或视频的评论……
$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();

// 检索关联到标题不像 code% 的文章的评论……
$comments = Comment::whereDoesntHaveMorph(
    'commentable',
    Post::class,
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();
```

偶尔，你可能需要根据相关多态模型的「类型」添加查询约束。传递给 `whereHasMorph` 方法的闭包可以接收一个 `$type` 值作为第二个参数。该参数让你能够检查正在构建的查询的「类型」：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query, string $type) {
        $column = $type === Post::class ? 'content' : 'title';

        $query->where($column, 'like', 'code%');
    }
)->get();
```

有时你可能想查询「morph to」关联的父级的子模型。你可以使用 `whereMorphedTo` 和 `whereNotMorphedTo` 方法来实现，它们会自动为给定模型确定适当的 morph 类型映射。这些方法接收 `morphTo` 关联的名称作为第一个参数，相关父模型作为第二个参数：

```php
$comments = Comment::whereMorphedTo('commentable', $post)
    ->orWhereMorphedTo('commentable', $video)
    ->get();
```

<a name="querying-all-morph-to-related-models"></a>
#### 查询所有相关模型

除了传递一个由可能的多态模型组成的数组，你还可以提供 `*` 作为通配符值。这将指示 Laravel 从数据库中检索所有可能的多态类型。Laravel 会执行一个额外的查询来完成此操作：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph('commentable', '*', function (Builder $query) {
    $query->where('title', 'like', 'foo%');
})->get();
```

<a name="aggregating-related-models"></a>
## 聚合关联模型

<a name="counting-related-models"></a>
### 统计关联模型数量

有时，你可能想统计某个给定关联的关联模型数量，而不实际加载这些模型。为此，你可以使用 `withCount` 方法。`withCount` 方法会在结果模型上放置一个 `{relation}_count` 属性：

```php
use App\Models\Post;

$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count;
}
```

通过向 `withCount` 方法传递数组，你可以为多个关联添加「计数」，也可以为查询添加额外的约束：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount(['votes', 'comments' => function (Builder $query) {
    $query->where('content', 'like', 'code%');
}])->get();

echo $posts[0]->votes_count;
echo $posts[0]->comments_count;
```

你还可以为关联计数结果设置别名，从而对同一个关联进行多次计数：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount([
    'comments',
    'comments as pending_comments_count' => function (Builder $query) {
        $query->where('approved', false);
    },
])->get();

echo $posts[0]->comments_count;
echo $posts[0]->pending_comments_count;
```

<a name="deferred-count-loading"></a>
#### 延迟计数加载

使用 `loadCount` 方法，你可以在父模型已经检索完成之后再加载关联计数：

```php
$book = Book::first();

$book->loadCount('genres');
```

如果需要为计数查询设置额外的查询约束，你可以传递一个以要统计的关联为键的数组。数组的值应是接收查询构造器实例的闭包：

```php
$book->loadCount(['reviews' => function (Builder $query) {
    $query->where('rating', 5);
}])
```

<a name="relationship-counting-and-custom-select-statements"></a>
#### 关联计数与自定义 select 语句

如果你将 `withCount` 与 `select` 语句结合使用，请确保在 `select` 方法之后调用 `withCount`：

```php
$posts = Post::select(['title', 'body'])
    ->withCount('comments')
    ->get();
```

<a name="other-aggregate-functions"></a>
### 其他聚合函数

除了 `withCount` 方法，Eloquent 还提供了 `withMin`、`withMax`、`withAvg`、`withSum` 和 `withExists` 方法。这些方法会在结果模型上放置一个 `{relation}_{function}_{column}` 属性：

```php
use App\Models\Post;

$posts = Post::withSum('comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->comments_sum_votes;
}
```

如果你想用其他名称访问聚合函数的结果，可以指定你自己的别名：

```php
$posts = Post::withSum('comments as total_comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->total_comments;
}
```

与 `loadCount` 方法类似，这些方法也有延迟加载版本。这些额外的聚合操作可以在已检索的 Eloquent 模型上执行：

```php
$post = Post::first();

$post->loadSum('comments', 'votes');
```

如果你将这些聚合方法与 `select` 语句结合使用，请确保在 `select` 方法之后调用聚合方法：

```php
$posts = Post::select(['title', 'body'])
    ->withExists('comments')
    ->get();
```

<a name="counting-related-models-on-morph-to-relationships"></a>
### 在 Morph To 关联上统计关联模型数量

如果你想预加载一个「morph to」关联，同时统计该关联可能返回的各种实体的关联模型数量，可以将 `with` 方法与 `morphTo` 关联的 `morphWithCount` 方法结合使用。

在这个示例中，假设 `Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。我们假定 `ActivityFeed` 模型定义了一个名为 `parentable` 的「morph to」关联，让我们能够检索给定 `ActivityFeed` 实例的父级 `Photo` 或 `Post` 模型。此外，假设 `Photo` 模型「拥有多个」`Tag` 模型，`Post` 模型「拥有多个」`Comment` 模型。

现在，假设我们要检索 `ActivityFeed` 实例，并为每个 `ActivityFeed` 实例预加载 `parentable` 父模型。同时，我们还希望检索每张父级照片关联的标签数量，以及每篇父级文章关联的评论数量：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::with([
    'parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWithCount([
            Photo::class => ['tags'],
            Post::class => ['comments'],
        ]);
    }])->get();
```

<a name="morph-to-deferred-count-loading"></a>
#### 延迟计数加载

假设我们已经检索了一组 `ActivityFeed` 模型，现在想要为与这些动态流关联的各种 `parentable` 模型加载嵌套的关联计数。你可以使用 `loadMorphCount` 方法来实现：

```php
$activities = ActivityFeed::with('parentable')->get();

$activities->loadMorphCount('parentable', [
    Photo::class => ['tags'],
    Post::class => ['comments'],
]);
```

<a name="eager-loading"></a>
## 预加载

以属性方式访问 Eloquent 关联时，关联模型是「延迟加载」的。这意味着在你首次访问该属性之前，关联数据实际上并未加载。不过，Eloquent 可以在你查询父模型时就「预加载」关联。预加载能有效缓解「N + 1」查询问题。为了说明 N + 1 查询问题，假设有一个「属于」`Author` 模型的 `Book` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 获取撰写该书的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }
}
```

现在，让我们检索所有图书及其作者：

```php
use App\Models\Book;

$books = Book::all();

foreach ($books as $book) {
    echo $book->author->name;
}
```

这个循环会执行一次查询来检索数据库表中的所有图书，然后为每本图书再执行一次查询来检索其作者。因此，如果我们有 25 本图书，上面的代码将运行 26 次查询：一次用于查询原始的图书，另外 25 次用于查询每本图书的作者。

所幸，我们可以使用预加载将该操作减少到只需两次查询。构建查询时，你可以使用 `with` 方法指定应预加载哪些关联：

```php
$books = Book::with('author')->get();

foreach ($books as $book) {
    echo $book->author->name;
}
```

对于这个操作，只会执行两次查询——一次查询检索所有图书，另一次查询检索所有图书的全部作者：

```sql
select * from books

select * from authors where id in (1, 2, 3, 4, 5, ...)
```

<a name="eager-loading-multiple-relationships"></a>
#### 预加载多个关联

有时，你可能需要预加载多个不同的关联。为此，只需向 `with` 方法传递一个关联数组：

```php
$books = Book::with(['author', 'publisher'])->get();
```

<a name="nested-eager-loading"></a>
#### 嵌套预加载

要预加载关联的关联，可以使用「点」语法。例如，让我们预加载所有图书的作者以及作者的所有个人联系人：

```php
$books = Book::with('author.contacts')->get();
```

此外，你也可以通过向 `with` 方法传递一个嵌套数组来指定嵌套预加载的关联，这在预加载多个嵌套关联时会很方便：

```php
$books = Book::with([
    'author' => [
        'contacts',
        'publisher',
    ],
])->get();
```

<a name="nested-eager-loading-morphto-relationships"></a>
#### 嵌套预加载 `morphTo` 关联

如果你想预加载一个 `morphTo` 关联，同时预加载该关联可能返回的各种实体上的嵌套关联，可以将 `with` 方法与 `morphTo` 关联的 `morphWith` 方法结合使用。为了帮助说明该方法，我们来看下面的模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取动态流记录的父级。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在这个示例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型相关联，`Post` 模型属于 `Author` 模型。

基于这些模型定义和关联，我们可以检索 `ActivityFeed` 模型实例，并预加载所有 `parentable` 模型及其各自的嵌套关联：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::query()
    ->with(['parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWith([
            Event::class => ['calendar'],
            Photo::class => ['tags'],
            Post::class => ['author'],
        ]);
    }])->get();
```

<a name="eager-loading-specific-columns"></a>
#### 预加载指定字段

你未必总是需要所检索关联的每个字段。因此，Eloquent 允许你指定希望检索关联的哪些字段：

```php
$books = Book::with('author:id,name,book_id')->get();
```

> [!WARNING]
> 使用此功能时，你应始终将要检索的字段列表中包含 `id` 字段以及相关的外键字段。

<a name="eager-loading-by-default"></a>
#### 默认预加载

有时，你可能希望在检索模型时始终加载某些关联。为此，你可以在模型上定义一个 `$with` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 应始终加载的关联。
     *
     * @var array
     */
    protected $with = ['author'];

    /**
     * 获取撰写该书的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * 获取该书的类型。
     */
    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }
}
```

如果想在单次查询中从 `$with` 属性里移除某一项，可以使用 `without` 方法：

```php
$books = Book::without('author')->get();
```

如果想为单次查询覆盖 `$with` 属性中的所有项，可以使用 `withOnly` 方法：

```php
$books = Book::withOnly('genre')->get();
```

<a name="constraining-eager-loads"></a>
### 约束预加载

有时，你可能希望预加载某个关联，同时为预加载查询指定额外的查询条件。这可以通过向 `with` 方法传递一个关联数组来实现：数组的键是关联名称，数组的值是为预加载查询添加额外约束的闭包：

```php
use App\Models\User;

$users = User::with(['posts' => function ($query) {
    $query->where('title', 'like', '%code%');
}])->get();
```

在这个示例中，Eloquent 只会预加载 `title` 列包含单词 `code` 的文章。你可以调用其他[查询构造器](/docs/{{version}}/queries)方法来进一步自定义预加载操作：

```php
$users = User::with(['posts' => function ($query) {
    $query->orderBy('created_at', 'desc');
}])->get();
```

<a name="constraining-eager-loading-of-morph-to-relationships"></a>
#### 约束 `morphTo` 关联的预加载

如果你正在预加载一个 `morphTo` 关联，Eloquent 会运行多个查询来获取每种类型的关联模型。你可以使用 `MorphTo` 关联的 `constrain` 方法为这些查询分别添加额外的约束：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$comments = Comment::with(['commentable' => function (MorphTo $morphTo) {
    $morphTo->constrain([
        Post::class => function ($query) {
            $query->whereNull('hidden_at');
        },
        Video::class => function ($query) {
            $query->where('type', 'educational');
        },
    ]);
}])->get();
```

在这个示例中，Eloquent 只会预加载未被隐藏的文章，以及 `type` 值为「educational」的视频。

<a name="constraining-eager-loads-with-relationship-existence"></a>
#### 通过关联存在性约束预加载

有时，你可能需要在检查关联是否存在的同时，基于相同的条件加载该关联。例如，你可能只想检索那些拥有满足给定查询条件的子 `Post` 模型的 `User` 模型，同时预加载符合条件的文章。你可以使用 `withWhereHas` 方法来实现：

```php
use App\Models\User;

$users = User::withWhereHas('posts', function ($query) {
    $query->where('featured', true);
})->get();
```

<a name="lazy-eager-loading"></a>
### 延迟预加载

有时，你可能需要在父模型检索完成之后再预加载关联。例如，当你需要动态决定是否加载关联模型时，这可能很有用：

```php
use App\Models\Book;

$books = Book::all();

if ($condition) {
    $books->load('author', 'publisher');
}
```

如果需要为预加载查询设置额外的查询约束，你可以传递一个以要加载的关联为键的数组。数组的值应是接收查询实例的闭包实例：

```php
$author->load(['books' => function ($query) {
    $query->orderBy('published_date', 'asc');
}]);
```

如果只想在关联尚未加载时才加载它，请使用 `loadMissing` 方法：

```php
$book->loadMissing('author');
```

<a name="nested-lazy-eager-loading-morphto"></a>
#### 嵌套延迟预加载与 `morphTo`

如果你想预加载一个 `morphTo` 关联，同时预加载该关联可能返回的各种实体上的嵌套关联，可以使用 `loadMorph` 方法。

该方法接收 `morphTo` 关联的名称作为第一个参数，一个由模型 / 关联组成的数组作为第二个参数。为了帮助说明该方法，我们来看下面的模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取动态流记录的父级。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在这个示例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型相关联，`Post` 模型属于 `Author` 模型。

基于这些模型定义和关联，我们可以检索 `ActivityFeed` 模型实例，并预加载所有 `parentable` 模型及其各自的嵌套关联：

```php
$activities = ActivityFeed::with('parentable')
    ->get()
    ->loadMorph('parentable', [
        Event::class => ['calendar'],
        Photo::class => ['tags'],
        Post::class => ['author'],
    ]);
```

<a name="automatic-eager-loading"></a>
### 自动预加载

> [!WARNING]
> 此功能目前处于 beta 阶段，以便收集社区反馈。即使在补丁版本中，该功能的行为和特性也可能发生变化。

在许多情况下，Laravel 可以自动预加载你访问的关联。要启用自动预加载，你应在应用 `AppServiceProvider` 的 `boot` 方法中调用 `Model::automaticallyEagerLoadRelationships` 方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Model::automaticallyEagerLoadRelationships();
}
```

启用此功能后，Laravel 会尝试自动加载你访问的、此前尚未加载的所有关联。例如，考虑以下场景：

```php
use App\Models\User;

$users = User::all();

foreach ($users as $user) {
    foreach ($user->posts as $post) {
        foreach ($post->comments as $comment) {
            echo $comment->content;
        }
    }
}
```

通常，上面的代码会为每个用户执行一次查询来检索其文章，并为每篇文章执行一次查询来检索其评论。然而，启用 `automaticallyEagerLoadRelationships` 功能后，当你尝试访问任何已检索用户的文章时，Laravel 会自动为用户集合中的所有用户[延迟预加载](#lazy-eager-loading)文章。同样，当你尝试访问任何已检索文章的评论时，最初检索的所有文章的全部评论都将被延迟预加载。

如果你不想全局启用自动预加载，仍可以通过在单个 Eloquent 集合实例上调用 `withRelationshipAutoloading` 方法来为该集合启用此功能：

```php
$users = User::where('vip', true)->get();

return $users->withRelationshipAutoloading();
```

<a name="preventing-lazy-loading"></a>
### 阻止延迟加载

如前所述，预加载关联通常能为你的应用带来显著的性能提升。因此，如果你愿意，可以指示 Laravel 始终阻止关联的延迟加载。为此，你可以调用 Eloquent 基类模型提供的 `preventLazyLoading` 方法。通常，你应在应用 `AppServiceProvider` 类的 `boot` 方法中调用该方法。

`preventLazyLoading` 方法接收一个可选的布尔参数，用于指示是否应阻止延迟加载。例如，你可能希望只在非生产环境中禁用延迟加载，这样即使生产代码中意外存在延迟加载的关联，生产环境也能继续正常运行：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

阻止延迟加载后，当应用尝试延迟加载任何 Eloquent 关联时，Eloquent 将抛出 `Illuminate\Database\LazyLoadingViolationException` 异常。

你可以使用 `handleLazyLoadingViolationsUsing` 方法自定义延迟加载违规的处理行为。例如，利用该方法，你可以指示延迟加载违规只记录日志，而不用异常中断应用的执行：

```php
Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
    $class = $model::class;

    info("Attempted to lazy load [{$relation}] on model [{$class}].");
});
```

<a name="inserting-and-updating-related-models"></a>
## 插入与更新关联模型

<a name="the-save-method"></a>
### `save` 方法

Eloquent 提供了向关联添加新模型的便捷方法。例如，假设你需要为一篇文章添加一条新评论。你无需手动在 `Comment` 模型上设置 `post_id` 属性，而是可以使用关联的 `save` 方法插入评论：

```php
use App\Models\Comment;
use App\Models\Post;

$comment = new Comment(['message' => 'A new comment.']);

$post = Post::find(1);

$post->comments()->save($comment);
```

注意，我们没有像访问动态属性那样访问 `comments` 关联，而是调用了 `comments` 方法来获取关联实例。`save` 方法会自动将适当的 `post_id` 值添加到新的 `Comment` 模型上。

如果需要保存多个关联模型，可以使用 `saveMany` 方法：

```php
$post = Post::find(1);

$post->comments()->saveMany([
    new Comment(['message' => 'A new comment.']),
    new Comment(['message' => 'Another new comment.']),
]);
```

`save` 和 `saveMany` 方法会持久化给定的模型实例，但不会将新持久化的模型添加到已加载到父模型上的任何内存中的关联里。如果你打算在使用 `save` 或 `saveMany` 方法之后访问关联，可以使用 `refresh` 方法重新加载模型及其关联：

```php
$post->comments()->save($comment);

$post->refresh();

// 所有评论，包括刚保存的评论……
$post->comments;
```

<a name="the-push-method"></a>
#### 递归保存模型与关联

如果你想 `save` 你的模型及其所有关联的模型，可以使用 `push` 方法。在这个示例中，`Post` 模型及其评论和评论的作者都将被保存：

```php
$post = Post::find(1);

$post->comments[0]->message = 'Message';
$post->comments[0]->author->name = 'Author Name';

$post->push();
```

可以使用 `pushQuietly` 方法来保存模型及其关联模型，而不触发任何事件：

```php
$post->pushQuietly();
```

<a name="the-create-method"></a>
### `create` 方法

除了 `save` 和 `saveMany` 方法，你还可以使用 `create` 方法。该方法接收一个属性数组，创建模型并将其插入数据库。`save` 与 `create` 的区别在于：`save` 接收完整的 Eloquent 模型实例，而 `create` 接收普通的 PHP `array`。新创建的模型将由 `create` 方法返回：

```php
use App\Models\Post;

$post = Post::find(1);

$comment = $post->comments()->create([
    'message' => 'A new comment.',
]);
```

你可以使用 `createMany` 方法创建多个关联模型：

```php
$post = Post::find(1);

$post->comments()->createMany([
    ['message' => 'A new comment.'],
    ['message' => 'Another new comment.'],
]);
```

可以使用 `createQuietly` 和 `createManyQuietly` 方法来创建一个或多个模型而不派发任何事件：

```php
$user = User::find(1);

$user->posts()->createQuietly([
    'title' => 'Post title.',
]);

$user->posts()->createManyQuietly([
    ['title' => 'First post.'],
    ['title' => 'Second post.'],
]);
```

你也可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法来[在关联上创建和更新模型](/docs/{{version}}/eloquent#upserts)。

> [!NOTE]
> 在使用 `create` 方法之前，请务必查阅[批量赋值](/docs/{{version}}/eloquent#mass-assignment)文档。

<a name="updating-belongs-to-relationships"></a>
### Belongs To 关联

如果你想将子模型分配给新的父模型，可以使用 `associate` 方法。在这个示例中，`User` 模型定义了到 `Account` 模型的 `belongsTo` 关联。`associate` 方法会在子模型上设置外键：

```php
use App\Models\Account;

$account = Account::find(10);

$user->account()->associate($account);

$user->save();
```

要从子模型中移除父模型，可以使用 `dissociate` 方法。该方法会将关联的外键设置为 `null`：

```php
$user->account()->dissociate();

$user->save();
```

<a name="updating-many-to-many-relationships"></a>
### 多对多关联

<a name="attaching-detaching"></a>
#### 附加 / 分离

Eloquent 还提供了一些让多对多关联的使用更加便捷的方法。例如，假设一个用户可以拥有多个角色，一个角色也可以拥有多个用户。你可以使用 `attach` 方法，通过在关联的中间表中插入一条记录来将角色附加给用户：

```php
use App\Models\User;

$user = User::find(1);

$user->roles()->attach($roleId);
```

在将关联附加到模型时，你也可以传递一个要插入中间表的额外数据数组：

```php
$user->roles()->attach($roleId, ['expires' => $expires]);
```

有时可能需要从用户身上移除某个角色。要移除多对多关联记录，请使用 `detach` 方法。`detach` 方法将从中间表中删除相应的记录；不过，两个模型仍会保留在数据库中：

```php
// 从用户身上分离单个角色……
$user->roles()->detach($roleId);

// 从用户身上分离所有角色……
$user->roles()->detach();
```

为了方便起见，`attach` 和 `detach` 也接受 ID 数组作为输入：

```php
$user = User::find(1);

$user->roles()->detach([1, 2, 3]);

$user->roles()->attach([
    1 => ['expires' => $expires],
    2 => ['expires' => $expires],
]);
```

<a name="syncing-associations"></a>
#### 同步关联

你还可以使用 `sync` 方法来构建多对多关联。`sync` 方法接收一个要写入中间表的 ID 数组。任何不在给定数组中的 ID 都将从中间表中移除。因此，该操作完成后，中间表中将只存在给定数组中的 ID：

```php
$user->roles()->sync([1, 2, 3]);
```

你也可以随 ID 一起传递额外的中间表值：

```php
$user->roles()->sync([1 => ['expires' => true], 2, 3]);
```

如果你想为每个同步的模型 ID 插入相同的中间表值，可以使用 `syncWithPivotValues` 方法：

```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['active' => true]);
```

如果不想分离给定数组中缺失的现有 ID，可以使用 `syncWithoutDetaching` 方法：

```php
$user->roles()->syncWithoutDetaching([1, 2, 3]);
```

<a name="toggling-associations"></a>
#### 切换关联

多对多关联还提供了一个 `toggle` 方法，用于「切换」给定关联模型 ID 的附加状态。如果给定的 ID 当前已附加，它将被分离；反之，如果当前已分离，它将被附加：

```php
$user->roles()->toggle([1, 2, 3]);
```

你也可以随 ID 一起传递额外的中间表值：

```php
$user->roles()->toggle([
    1 => ['expires' => true],
    2 => ['expires' => true],
]);
```

<a name="updating-a-record-on-the-intermediate-table"></a>
#### 更新中间表上的记录

如果你需要更新关联中间表中的现有行，可以使用 `updateExistingPivot` 方法。该方法接收中间记录的外键和要更新的属性数组：

```php
$user = User::find(1);

$user->roles()->updateExistingPivot($roleId, [
    'active' => false,
]);
```

<a name="touching-parent-timestamps"></a>
## 更新父模型时间戳

当一个模型定义了到另一个模型的 `belongsTo` 或 `belongsToMany` 关联时（例如一条 `Comment` 属于一篇 `Post`），在子模型更新时同步更新父模型的时间戳有时会很有用。

例如，当 `Comment` 模型被更新时，你可能希望自动「触碰」所属 `Post` 的 `updated_at` 时间戳，将其设置为当前日期和时间。为此，你可以在子模型上添加一个 `touches` 属性，其中包含在子模型更新时应更新其 `updated_at` 时间戳的关联名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * 应被触碰的所有关联。
     *
     * @var array
     */
    protected $touches = ['post'];

    /**
     * 获取评论的所属文章。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

> [!WARNING]
> 只有在使用 Eloquent 的 `save` 方法更新子模型时，父模型的时间戳才会被更新。
