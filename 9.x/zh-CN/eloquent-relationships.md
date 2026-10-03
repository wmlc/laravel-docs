# Eloquent：关联

- [简介](#introduction)
- [定义关联](#defining-relationships)
    - [一对一](#one-to-one)
    - [一对多](#one-to-many)
    - [一对多（反向）/ Belongs To](#one-to-many-inverse)
    - [多条记录中的一条（Has One of Many）](#has-one-of-many)
    - [远程一对一（Has One Through）](#has-one-through)
    - [远程一对多（Has Many Through）](#has-many-through)
- [多对多关联](#many-to-many)
    - [获取中间表字段](#retrieving-intermediate-table-columns)
    - [通过中间表字段过滤查询](#filtering-queries-via-intermediate-table-columns)
    - [通过中间表字段排序查询](#ordering-queries-via-intermediate-table-columns)
    - [定义自定义中间表模型](#defining-custom-intermediate-table-models)
- [多态关联](#polymorphic-relationships)
    - [一对一](#one-to-one-polymorphic-relations)
    - [一对多](#one-to-many-polymorphic-relations)
    - [多条中的一条](#one-of-many-polymorphic-relations)
    - [多对多](#many-to-many-polymorphic-relations)
    - [自定义多态类型](#custom-polymorphic-types)
- [动态关联](#dynamic-relationships)
- [查询关联](#querying-relations)
    - [关联方法与动态属性](#relationship-methods-vs-dynamic-properties)
    - [查询关联存在性](#querying-relationship-existence)
    - [查询关联不存在](#querying-relationship-absence)
    - [查询多态归属关联](#querying-morph-to-relationships)
- [聚合关联模型](#aggregating-related-models)
    - [统计关联模型数量](#counting-related-models)
    - [其他聚合函数](#other-aggregate-functions)
    - [统计多态归属关联的模型数量](#counting-related-models-on-morph-to-relationships)
- [预加载](#eager-loading)
    - [约束预加载](#constraining-eager-loads)
    - [延迟预加载](#lazy-eager-loading)
    - [阻止延迟加载](#preventing-lazy-loading)
- [插入与更新关联模型](#inserting-and-updating-related-models)
    - [`save` 方法](#the-save-method)
    - [`create` 方法](#the-create-method)
    - [Belongs To 关联](#updating-belongs-to-relationships)
    - [多对多关联](#updating-many-to-many-relationships)
- [触碰父级时间戳](#touching-parent-timestamps)

<a name="introduction"></a>
## 简介

数据库表之间通常存在相互关联。例如，一篇博客文章可能有多个评论，或者一个订单可能与下单用户相关联。Eloquent 让管理和处理这些关联变得简单，并支持多种常见关联：

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

Eloquent 关联定义为 Eloquent 模型类上的方法。由于关联同时也充当强大的[查询构造器](/docs/{{version}}/queries)，将关联定义为方法可以提供强大的方法链式调用和查询能力。例如，我们可以在 `posts` 关联上链式添加额外的查询约束：

```php
$user->posts()->where('active', 1)->get();
```

不过，在深入使用关联之前，让我们先学习如何定义 Eloquent 支持的每种关联类型。

<a name="one-to-one"></a>
### 一对一

一对一关联是一种非常基础的数据库关联类型。例如，`User` 模型可能与一个 `Phone` 模型相关联。要定义这种关联，我们在 `User` 模型上放置一个 `phone` 方法。`phone` 方法应调用 `hasOne` 方法并返回其结果。`hasOne` 方法通过模型的 `Illuminate\Database\Eloquent\Model` 基类提供给模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取与用户关联的电话。
     */
    public function phone()
    {
        return $this->hasOne(Phone::class);
    }
}
```

传递给 `hasOne` 方法的第一个参数是关联模型类的名称。定义关联后，我们可以使用 Eloquent 的动态属性获取关联记录。动态属性允许你像访问模型上定义的属性一样访问关联方法：

```php
$phone = User::find(1)->phone;
```

Eloquent 根据父模型名称确定关联的外键。在此例中，`Phone` 模型会自动假定拥有 `user_id` 外键。如果你想覆盖这一约定，可以向 `hasOne` 方法传递第二个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key');
```

此外，Eloquent 假定外键的值应与父模型的主键字段相匹配。换句话说，Eloquent 会在 `Phone` 记录的 `user_id` 字段中查找用户 `id` 字段的值。如果你希望关联使用 `id` 或模型的 `$primaryKey` 属性之外的主键值，可以向 `hasOne` 方法传递第三个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key', 'local_key');
```

<a name="one-to-one-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向

这样，我们就可以从 `User` 模型访问 `Phone` 模型。接下来，让我们在 `Phone` 模型上定义一个关联，让我们可以访问拥有该手机的用户。我们可以使用 `belongsTo` 方法定义 `hasOne` 关联的反向：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Phone extends Model
{
    /**
     * 获取拥有该手机的用户。
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

调用 `user` 方法时，Eloquent 会尝试查找一个 `id` 与 `Phone` 模型上 `user_id` 字段相匹配的 `User` 模型。

Eloquent 通过检查关联方法的名称并在方法名后添加 `_id` 后缀来确定外键名称。因此，在此例中，Eloquent 假定 `Phone` 模型拥有 `user_id` 字段。但是，如果 `Phone` 模型上的外键不是 `user_id`，你可以向 `belongsTo` 方法传递自定义键名作为第二个参数：

```php
/**
 * 获取拥有该手机的用户。
 */
public function user()
{
    return $this->belongsTo(User::class, 'foreign_key');
}
```

如果父模型不使用 `id` 作为主键，或者你希望使用不同的字段查找关联模型，可以向 `belongsTo` 方法传递第三个参数来指定父表的自定义键：

```php
/**
 * 获取拥有该手机的用户。
 */
public function user()
{
    return $this->belongsTo(User::class, 'foreign_key', 'owner_key');
}
```

<a name="one-to-many"></a>
### 一对多

一对多关联用于定义单个模型作为一个或多个子模型父级的关联。例如，一篇博客文章可能有无数条评论。与所有其他 Eloquent 关联一样，一对多关联通过在 Eloquent 模型上定义方法来定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
```

请记住，Eloquent 会自动确定 `Comment` 模型的正确外键字段。按照约定，Eloquent 会取父模型的"蛇形命名"名称并添加 `_id` 后缀。因此，在此例中，Eloquent 会假定 `Comment` 模型上的外键字段是 `post_id`。

定义关联方法后，我们可以通过访问 `comments` 属性来获取关联评论的[集合](/docs/{{version}}/eloquent-collections)。请记住，由于 Eloquent 提供"动态关联属性"，我们可以像访问模型上定义的属性一样访问关联方法：

```php
use App\Models\Post;

$comments = Post::find(1)->comments;

foreach ($comments as $comment) {
    //
}
```

由于所有关联同时也充当查询构造器，你可以通过调用 `comments` 方法并继续在查询上链式添加条件来为关联查询添加更多约束：

```php
$comment = Post::find(1)->comments()
                    ->where('title', 'foo')
                    ->first();
```

与 `hasOne` 方法类似，你也可以通过向 `hasMany` 方法传递额外参数来覆盖外键和本地键：

```php
return $this->hasMany(Comment::class, 'foreign_key');

return $this->hasMany(Comment::class, 'foreign_key', 'local_key');
```

<a name="one-to-many-inverse"></a>
### 一对多（反向）/ Belongs To

既然我们可以访问文章的所有评论，接下来让我们定义一个关联，让评论可以访问其父级文章。要定义 `hasMany` 关联的反向，在子模型上定义一个调用 `belongsTo` 方法的关联方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    /**
     * 获取拥有该评论的文章。
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
```

定义关联后，我们可以通过访问 `post` "动态关联属性"来获取评论的父级文章：

```php
use App\Models\Comment;

$comment = Comment::find(1);

return $comment->post->title;
```

在上面的示例中，Eloquent 会尝试查找一个 `id` 与 `Comment` 模型上 `post_id` 字段相匹配的 `Post` 模型。

Eloquent 通过检查关联方法的名称并在方法名后添加 `_` 和父模型主键字段名来确定默认外键名称。因此，在此例中，Eloquent 会假定 `comments` 表上 `Post` 模型的外键是 `post_id`。

但是，如果关联的外键不遵循这些约定，你可以向 `belongsTo` 方法传递自定义外键名作为第二个参数：

```php
/**
 * 获取拥有该评论的文章。
 */
public function post()
{
    return $this->belongsTo(Post::class, 'foreign_key');
}
```

如果父模型不使用 `id` 作为主键，或者你希望使用不同的字段查找关联模型，可以向 `belongsTo` 方法传递第三个参数来指定父表的自定义键：

```php
/**
 * 获取拥有该评论的文章。
 */
public function post()
{
    return $this->belongsTo(Post::class, 'foreign_key', 'owner_key');
}
```

<a name="default-models"></a>
#### 默认模型

`belongsTo`、`hasOne`、`hasOneThrough` 和 `morphOne` 关联允许你定义一个默认模型，当给定关联为 `null` 时将返回该模型。这种模式通常被称为[空对象模式](https://en.wikipedia.org/wiki/Null_Object_pattern)，可以帮助消除代码中的条件检查。在以下示例中，如果没有用户关联到 `Post` 模型，`user` 关联将返回一个空的 `App\Models\User` 模型：

```php
/**
 * 获取文章的作者。
 */
public function user()
{
    return $this->belongsTo(User::class)->withDefault();
}
```

要为默认模型填充属性，可以向 `withDefault` 方法传递数组或闭包：

```php
/**
 * 获取文章的作者。
 */
public function user()
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author',
    ]);
}

/**
 * 获取文章的作者。
 */
public function user()
{
    return $this->belongsTo(User::class)->withDefault(function ($user, $post) {
        $user->name = 'Guest Author';
    });
}
```

<a name="querying-belongs-to-relationships"></a>
#### 查询 Belongs To 关联

查询"belongs to"关联的子级时，你可以手动构建 `where` 子句来获取相应的 Eloquent 模型：

```php
use App\Models\Post;

$posts = Post::where('user_id', $user->id)->get();
```

不过，使用 `whereBelongsTo` 方法可能更方便，它会自动为给定模型确定正确的关联和外键：

```php
$posts = Post::whereBelongsTo($user)->get();
```

你也可以向 `whereBelongsTo` 方法提供[集合](/docs/{{version}}/eloquent-collections)实例。这样做时，Laravel 会获取属于集合中任意父模型的模型：

```php
$users = User::where('vip', true)->get();

$posts = Post::whereBelongsTo($users)->get();
```

默认情况下，Laravel 会根据模型的类名确定与给定模型关联的关联；不过，你可以手动指定关联名称，将其作为 `whereBelongsTo` 方法的第二个参数提供：

```php
$posts = Post::whereBelongsTo($user, 'author')->get();
```

<a name="has-one-of-many"></a>
### 多条记录中的一条（Has One of Many）

有时一个模型可能拥有多个关联模型，但你希望轻松获取关联中"最新"或"最旧"的关联模型。例如，`User` 模型可能与多个 `Order` 模型相关联，但你希望定义一种便捷的方式来访问用户最近下的订单。你可以使用 `hasOne` 关联类型结合 `ofMany` 方法来实现：

```php
/**
 * 获取用户的最新订单。
 */
public function latestOrder()
{
    return $this->hasOne(Order::class)->latestOfMany();
}
```

同样，你可以定义一个方法来获取关联中"最旧"或第一条关联模型：

```php
/**
 * 获取用户的最旧订单。
 */
public function oldestOrder()
{
    return $this->hasOne(Order::class)->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法会根据模型的主键获取最新或最旧的关联模型，主键必须可排序。但是，有时你可能希望使用不同的排序条件从更大的关联中获取单个模型。

例如，使用 `ofMany` 方法，你可以获取用户最贵的订单。`ofMany` 方法接受可排序字段作为第一个参数，以及查询关联模型时应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最大的订单。
 */
public function largestOrder()
{
    return $this->hasOne(Order::class)->ofMany('price', 'max');
}
```

> **Warning**  
> 由于 PostgreSQL 不支持对 UUID 字段执行 `MAX` 函数，目前无法将 one-of-many 关联与 PostgreSQL UUID 字段结合使用。

<a name="advanced-has-one-of-many-relationships"></a>
#### 高级多条记录中的一条关联

可以构建更高级的"多条记录中的一条"关联。例如，`Product` 模型可能有许多关联的 `Price` 模型，即使发布了新定价，这些模型仍会保留在系统中。此外，产品的新定价数据可以提前发布，通过 `published_at` 字段在将来某个日期生效。

因此，总结来说，我们需要获取已发布日期不在未来的最新已发布定价。此外，如果两个定价的发布日期相同，我们优先选择 ID 最大的定价。为此，我们必须向 `ofMany` 方法传递一个包含可排序字段的数组，这些字段用于确定最新定价。此外，闭包将作为 `ofMany` 方法的第二个参数提供。该闭包负责为关联查询添加额外的发布日期约束：

```php
/**
 * 获取产品的当前定价。
 */
public function currentPricing()
{
    return $this->hasOne(Price::class)->ofMany([
        'published_at' => 'max',
        'id' => 'max',
    ], function ($query) {
        $query->where('published_at', '<', now());
    });
}
```

<a name="has-one-through"></a>
### 远程一对一（Has One Through）

"一对一穿透"关联定义了与另一个模型的一对一关联。但是，这种关联表示声明模型可以通过第三个模型_穿透_匹配另一个模型的一个实例。

例如，在汽车维修店应用中，每个 `Mechanic` 模型可能与一个 `Car` 模型相关联，每个 `Car` 模型可能与一个 `Owner` 模型相关联。虽然技工和车主在数据库中没有直接关联，但技工可以_穿透_ `Car` 模型访问车主。让我们看看定义此关联所需的表：

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

既然我们已经查看了关联的表结构，让我们在 `Mechanic` 模型上定义此关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mechanic extends Model
{
    /**
     * 获取车辆的车主。
     */
    public function carOwner()
    {
        return $this->hasOneThrough(Owner::class, Car::class);
    }
}
```

传递给 `hasOneThrough` 方法的第一个参数是我们希望访问的最终模型名称，第二个参数是中间模型名称。

或者，如果相关关联已经在关联涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关联的名称来流畅地定义"一对一穿透"关联。例如，如果 `Mechanic` 模型有 `cars` 关联且 `Car` 模型有 `owner` 关联，你可以像这样定义连接技工和车主的"一对一穿透"关联：

```php
// 字符串语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

<a name="has-one-through-key-conventions"></a>
#### 键约定

执行关联查询时将使用典型的 Eloquent 外键约定。如果你想自定义关联的键，可以将它们作为 `hasOneThrough` 方法的第三和第四个参数传递。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Mechanic extends Model
{
    /**
     * 获取车辆的车主。
     */
    public function carOwner()
    {
        return $this->hasOneThrough(
            Owner::class,
            Car::class,
            'mechanic_id', // cars 表的外键...
            'car_id', // owners 表的外键...
            'id', // mechanics 表的本地键...
            'id' // cars 表的本地键...
        );
    }
}
```

或者，如前所述，如果相关关联已经在关联涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关联的名称来流畅地定义"一对一穿透"关联。这种方法的优势在于可以复用现有关联上已定义的键约定：

```php
// 字符串语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

<a name="has-many-through"></a>
### 远程一对多（Has Many Through）

"一对多穿透"关联提供了一种通过中间关联访问远端关联的便捷方式。例如，假设我们正在构建一个类似 [Laravel Vapor](https://vapor.laravel.com) 的部署平台。`Project` 模型可以通过中间 `Environment` 模型访问多个 `Deployment` 模型。使用此示例，你可以轻松获取给定项目的所有部署。让我们看看定义此关联所需的表：

```text
projects
    id - integer
    name - string

environments
    id - integer
    project_id - integer
    name - string

deployments
    id - integer
    environment_id - integer
    commit_hash - string
```

既然我们已经查看了关联的表结构，让我们在 `Project` 模型上定义此关联：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    /**
     * 获取项目的所有部署。
     */
    public function deployments()
    {
        return $this->hasManyThrough(Deployment::class, Environment::class);
    }
}
```

传递给 `hasManyThrough` 方法的第一个参数是我们希望访问的最终模型名称，第二个参数是中间模型名称。

或者，如果相关关联已经在关联涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关联的名称来流畅地定义"一对多穿透"关联。例如，如果 `Project` 模型有 `environments` 关联且 `Environment` 模型有 `deployments` 关联，你可以像这样定义连接项目和部署的"一对多穿透"关联：

```php
// 字符串语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

虽然 `Deployment` 模型的表不包含 `project_id` 字段，但 `hasManyThrough` 关联可以通过 `$project->deployments` 访问项目的部署。为了获取这些模型，Eloquent 会检查中间 `Environment` 模型表上的 `project_id` 字段。找到相关环境 ID 后，用它们来查询 `Deployment` 模型的表。

<a name="has-many-through-key-conventions"></a>
#### 键约定

执行关联查询时将使用典型的 Eloquent 外键约定。如果你想自定义关联的键，可以将它们作为 `hasManyThrough` 方法的第三和第四个参数传递。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Project extends Model
{
    public function deployments()
    {
        return $this->hasManyThrough(
            Deployment::class,
            Environment::class,
            'project_id', // environments 表的外键...
            'environment_id', // deployments 表的外键...
            'id', // projects 表的本地键...
            'id' // environments 表的本地键...
        );
    }
}
```

或者，如前所述，如果相关关联已经在关联涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关联的名称来流畅地定义"一对多穿透"关联。这种方法的优势在于可以复用现有关联上已定义的键约定：

```php
// 字符串语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

<a name="many-to-many"></a>
## 多对多关联

多对多关联比 `hasOne` 和 `hasMany` 关联稍微复杂一些。多对多关联的一个示例是用户拥有多个角色，而这些角色也被应用中的其他用户共享。例如，一个用户可能被分配"Author"和"Editor"角色；然而，这些角色也可能分配给其他用户。因此，用户拥有多个角色，角色也拥有多个用户。

<a name="many-to-many-table-structure"></a>
#### 表结构

要定义此关联，需要三个数据库表：`users`、`roles` 和 `role_user`。`role_user` 表的名称由关联模型名称的字母顺序派生，包含 `user_id` 和 `role_id` 字段。此表用作连接用户和角色的中间表。

请记住，由于一个角色可以属于多个用户，我们不能简单地在 `roles` 表上放置 `user_id` 字段。这意味着一个角色只能属于单个用户。为了支持将角色分配给多个用户，需要 `role_user` 表。我们可以这样总结关联的表结构：

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

多对多关联通过编写一个返回 `belongsToMany` 方法结果的方法来定义。`belongsToMany` 方法由 `Illuminate\Database\Eloquent\Model` 基类提供，应用的 Eloquent 模型都使用此基类。例如，让我们在 `User` 模型上定义一个 `roles` 方法。传递给此方法的第一个参数是关联模型类的名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 属于用户的角色。
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
```

定义关联后，你可以使用 `roles` 动态关联属性访问用户的角色：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    //
}
```

由于所有关联同时也充当查询构造器，你可以通过调用 `roles` 方法并继续在查询上链式添加条件来为关联查询添加更多约束：

```php
$roles = User::find(1)->roles()->orderBy('name')->get();
```

为了确定关联中间表的表名，Eloquent 会按字母顺序连接两个关联模型名称。不过，你可以自由覆盖此约定。可以通过向 `belongsToMany` 方法传递第二个参数来实现：

```php
return $this->belongsToMany(Role::class, 'role_user');
```

除了自定义中间表的名称外，你还可以通过向 `belongsToMany` 方法传递额外参数来自定义表上键的字段名称。第三个参数是定义关联的模型的外键名，第四个参数是要连接的模型的外键名：

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

<a name="many-to-many-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向

要定义多对多关联的"反向"，应在关联模型上定义一个同样返回 `belongsToMany` 方法结果的方法。为了完成用户/角色示例，让我们在 `Role` 模型上定义 `users` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    /**
     * 属于该角色的用户。
     */
    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}
```

如你所见，除了引用 `App\Models\User` 模型外，关联的定义与其 `User` 模型对应方完全相同。由于我们复用 `belongsToMany` 方法，定义多对多关联的"反向"时所有常规的表和键自定义选项都可用。

<a name="retrieving-intermediate-table-columns"></a>
### 获取中间表字段

如你已学到的，处理多对多关联需要中间表。Eloquent 提供了一些非常有用的方式来与此表交互。例如，假设我们的 `User` 模型关联到多个 `Role` 模型。访问此关联后，我们可以使用模型上的 `pivot` 属性访问中间表：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

请注意，我们获取的每个 `Role` 模型都会自动分配一个 `pivot` 属性。此属性包含一个表示中间表的模型。

默认情况下，`pivot` 模型上只存在模型键。如果中间表包含额外属性，你必须在定义关联时指定它们：

```php
return $this->belongsToMany(Role::class)->withPivot('active', 'created_by');
```

如果你希望中间表拥有由 Eloquent 自动维护的 `created_at` 和 `updated_at` 时间戳，在定义关联时调用 `withTimestamps` 方法：

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

> **Warning**  
> 使用 Eloquent 自动维护时间戳的中间表必须同时拥有 `created_at` 和 `updated_at` 时间戳字段。

<a name="customizing-the-pivot-attribute-name"></a>
#### 自定义 `pivot` 属性名称

如前所述，中间表的属性可以通过 `pivot` 属性在模型上访问。不过，你可以自由自定义此属性的名称，以更好地反映其在应用中的用途。

例如，如果你的应用包含可以订阅播客的用户，用户和播客之间可能存在多对多关联。如果是这种情况，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。可以在定义关联时使用 `as` 方法实现：

```php
return $this->belongsToMany(Podcast::class)
                ->as('subscription')
                ->withTimestamps();
```

指定自定义中间表属性后，你可以使用自定义名称访问中间表数据：

```php
$users = User::with('podcasts')->get();

foreach ($users->flatMap->podcasts as $podcast) {
    echo $podcast->subscription->created_at;
}
```

<a name="filtering-queries-via-intermediate-table-columns"></a>
### 通过中间表字段过滤查询

你还可以在定义关联时使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法过滤 `belongsToMany` 关联查询返回的结果：

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

<a name="ordering-queries-via-intermediate-table-columns"></a>
### 通过中间表字段排序查询

你可以使用 `orderByPivot` 方法对 `belongsToMany` 关联查询返回的结果进行排序。在以下示例中，我们将获取用户的所有最新徽章：

```php
return $this->belongsToMany(Badge::class)
                ->where('rank', 'gold')
                ->orderByPivot('created_at', 'desc');
```

<a name="defining-custom-intermediate-table-models"></a>
### 定义自定义中间表模型

如果你想定义一个自定义模型来表示多对多关联的中间表，可以在定义关联时调用 `using` 方法。自定义 pivot 模型让你有机会在 pivot 模型上定义额外行为，如方法和类型转换。

自定义多对多 pivot 模型应继承 `Illuminate\Database\Eloquent\Relations\Pivot` 类，而自定义多态多对多 pivot 模型应继承 `Illuminate\Database\Eloquent\Relations\MorphPivot` 类。例如，我们可以定义一个使用自定义 `RoleUser` pivot 模型的 `Role` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    /**
     * 属于该角色的用户。
     */
    public function users()
    {
        return $this->belongsToMany(User::class)->using(RoleUser::class);
    }
}
```

定义 `RoleUser` 模型时，应继承 `Illuminate\Database\Eloquent\Relations\Pivot` 类：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    //
}
```

> **Warning**  
> Pivot 模型不能使用 `SoftDeletes` trait。如果需要软删除 pivot 记录，请考虑将 pivot 模型转换为实际的 Eloquent 模型。

<a name="custom-pivot-models-and-incrementing-ids"></a>
#### 自定义 Pivot 模型与自增 ID

如果你定义了使用自定义 pivot 模型的多对多关联，且该 pivot 模型拥有自增主键，应确保自定义 pivot 模型类定义了设为 `true` 的 `incrementing` 属性。

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

多态关联允许子模型使用单个关联属于多种类型的模型。例如，假设你正在构建一个允许用户分享博客文章和视频的应用。在这样的应用中，`Comment` 模型可能同时属于 `Post` 和 `Video` 模型。

<a name="one-to-one-polymorphic-relations"></a>
### 一对一（多态）

<a name="one-to-one-polymorphic-table-structure"></a>
#### 表结构

一对一多态关联类似于典型的一对一关联；但是，子模型可以使用单个关联属于多种类型的模型。例如，博客 `Post` 和 `User` 可以共享与 `Image` 模型的多态关联。使用一对一多态关联可以让你拥有一个唯一图片表，这些图片可以与文章和用户关联。首先，让我们查看表结构：

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

注意 `images` 表上的 `imageable_id` 和 `imageable_type` 字段。`imageable_id` 字段将包含文章或用户的 ID 值，`imageable_type` 字段将包含父模型的类名。`imageable_type` 字段由 Eloquent 用于确定访问 `imageable` 关联时返回哪种"类型"的父模型。在此例中，该字段将包含 `App\Models\Post` 或 `App\Models\User`。

<a name="one-to-one-polymorphic-model-structure"></a>
#### 模型结构

接下来，让我们查看构建此关联所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    /**
     * 获取父级 imageable 模型（用户或文章）。
     */
    public function imageable()
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    /**
     * 获取文章的图片。
     */
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

class User extends Model
{
    /**
     * 获取用户的图片。
     */
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

<a name="one-to-one-polymorphic-retrieving-the-relationship"></a>
#### 获取关联

定义数据库表和模型后，你可以通过模型访问关联。例如，要获取文章的图片，我们可以访问 `image` 动态关联属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

你可以通过访问执行 `morphTo` 调用的方法名称来获取多态模型的父级。在此例中，即 `Image` 模型上的 `imageable` 方法。因此，我们将该方法作为动态关联属性访问：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关联将返回 `Post` 或 `User` 实例，具体取决于拥有图片的模型类型。

<a name="morph-one-to-one-key-conventions"></a>
#### 键约定

如有必要，你可以指定多态子模型使用的"id"和"type"字段名称。如果这样做，请确保始终将关联名称作为 `morphTo` 方法的第一个参数传递。通常，此值应与方法名匹配，因此你可以使用 PHP 的 `__FUNCTION__` 常量：

```php
/**
 * 获取图片所属的模型。
 */
public function imageable()
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

<a name="one-to-many-polymorphic-relations"></a>
### 一对多（多态）

<a name="one-to-many-polymorphic-table-structure"></a>
#### 表结构

一对多多态关联类似于典型的一对多关联；但是，子模型可以使用单个关联属于多种类型的模型。例如，假设应用的用户可以对文章和视频"评论"。使用多态关联，你可以使用单个 `comments` 表来包含文章和视频的评论。首先，让我们查看构建此关联所需的表结构：

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

接下来，让我们查看构建此关联所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    /**
     * 获取父级 commentable 模型（文章或视频）。
     */
    public function commentable()
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    /**
     * 获取文章的所有评论。
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Video extends Model
{
    /**
     * 获取视频的所有评论。
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

<a name="one-to-many-polymorphic-retrieving-the-relationship"></a>
#### 获取关联

定义数据库表和模型后，你可以通过模型的动态关联属性访问关联。例如，要访问文章的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    //
}
```

你也可以通过访问执行 `morphTo` 调用的方法名称来获取多态子模型的父级。在此例中，即 `Comment` 模型上的 `commentable` 方法。因此，我们将该方法作为动态关联属性访问，以获取评论的父级模型：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

`Comment` 模型上的 `commentable` 关联将返回 `Post` 或 `Video` 实例，具体取决于评论的父级模型类型。

<a name="one-of-many-polymorphic-relations"></a>
### 多条中的一条（多态）

有时一个模型可能拥有多个关联模型，但你希望轻松获取关联中"最新"或"最旧"的关联模型。例如，`User` 模型可能与多个 `Image` 模型相关联，但你希望定义一种便捷的方式来访问用户最近上传的图片。你可以使用 `morphOne` 关联类型结合 `ofMany` 方法来实现：

```php
/**
 * 获取用户的最新图片。
 */
public function latestImage()
{
    return $this->morphOne(Image::class, 'imageable')->latestOfMany();
}
```

同样，你可以定义一个方法来获取关联中"最旧"或第一条关联模型：

```php
/**
 * 获取用户的最旧图片。
 */
public function oldestImage()
{
    return $this->morphOne(Image::class, 'imageable')->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法会根据模型的主键获取最新或最旧的关联模型，主键必须可排序。但是，有时你可能希望使用不同的排序条件从更大的关联中获取单个模型。

例如，使用 `ofMany` 方法，你可以获取用户最多"点赞"的图片。`ofMany` 方法接受可排序字段作为第一个参数，以及查询关联模型时应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最受欢迎的图片。
 */
public function bestImage()
{
    return $this->morphOne(Image::class, 'imageable')->ofMany('likes', 'max');
}
```

> **Note**  
> 可以构建更高级的"多条中的一条"关联。更多信息请查阅[多条记录中的一条文档](#advanced-has-one-of-many-relationships)。

<a name="many-to-many-polymorphic-relations"></a>
### 多对多（多态）

<a name="many-to-many-polymorphic-table-structure"></a>
#### 表结构

多对多多态关联比"morph one"和"morph many"关联稍微复杂一些。例如，`Post` 模型和 `Video` 模型可以共享与 `Tag` 模型的多态关联。在这种情况下使用多对多多态关联可以让应用拥有一个唯一标签表，这些标签可以与文章或视频关联。首先，让我们查看构建此关联所需的表结构：

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

> **Note**  
> 在深入了解多态多对多关联之前，阅读典型[多对多关联](#many-to-many)的文档可能会有所帮助。

<a name="many-to-many-polymorphic-model-structure"></a>
#### 模型结构

接下来，我们准备在模型上定义关联。`Post` 和 `Video` 模型都将包含一个 `tags` 方法，该方法调用基础 Eloquent 模型类提供的 `morphToMany` 方法。

`morphToMany` 方法接受关联模型名称和"关联名称"。基于我们分配给中间表名称及其包含的键，我们将此关联称为"taggable"：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 获取文章的所有标签。
     */
    public function tags()
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-defining-the-inverse-of-the-relationship"></a>
#### 定义关联的反向

接下来，在 `Tag` 模型上，你应为其每个可能的父模型定义方法。因此，在此例中，我们将定义 `posts` 方法和 `videos` 方法。这两个方法都应返回 `morphedByMany` 方法的结果。

`morphedByMany` 方法接受关联模型名称和"关联名称"。基于我们分配给中间表名称及其包含的键，我们将此关联称为"taggable"：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    /**
     * 获取分配了此标签的所有文章。
     */
    public function posts()
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    /**
     * 获取分配了此标签的所有视频。
     */
    public function videos()
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-retrieving-the-relationship"></a>
#### 获取关联

定义数据库表和模型后，你可以通过模型访问关联。例如，要获取文章的所有标签，可以使用 `tags` 动态关联属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->tags as $tag) {
    //
}
```

你可以通过访问执行 `morphedByMany` 调用的方法名称，从多态子模型获取多态关联的父级。在此例中，即 `Tag` 模型上的 `posts` 或 `videos` 方法：

```php
use App\Models\Tag;

$tag = Tag::find(1);

foreach ($tag->posts as $post) {
    //
}

foreach ($tag->videos as $video) {
    //
}
```

<a name="custom-polymorphic-types"></a>
### 自定义多态类型

默认情况下，Laravel 会使用完全限定类名来存储关联模型的"type"。例如，给定上面的一对多关联示例，其中 `Comment` 模型可能属于 `Post` 或 `Video` 模型，默认的 `commentable_type` 将分别是 `App\Models\Post` 或 `App\Models\Video`。不过，你可能希望将这些值与应用的内部结构解耦。

例如，我们可以使用 `post` 和 `video` 等简单字符串代替模型名作为"type"。这样做后，即使模型被重命名，数据库中的多态"type"字段值仍然有效：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);
```

你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enforceMorphMap` 方法，或者如果愿意，可以创建一个单独的服务提供者（Service Provider）。

你可以在运行时使用模型的 `getMorphClass` 方法确定给定模型的 morph 别名。反之，可以使用 `Relation::getMorphedModel` 方法确定与 morph 别名关联的完全限定类名：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

$alias = $post->getMorphClass();

$class = Relation::getMorphedModel($alias);
```

> **Warning**  
> 在现有应用中添加"morph map"时，数据库中每个仍包含完全限定类名的 morphable `*_type` 字段值都需要转换为其"map"名称。

<a name="dynamic-relationships"></a>
### 动态关联

你可以使用 `resolveRelationUsing` 方法在运行时定义 Eloquent 模型之间的关联。虽然通常不建议在正常应用开发中使用，但在开发 Laravel 包时偶尔会有用。

`resolveRelationUsing` 方法接受所需的关联名称作为第一个参数。传递给方法的第二个参数应是一个闭包，该闭包接受模型实例并返回有效的 Eloquent 关联定义。通常，你应在[服务提供者](/docs/{{version}}/providers)的 boot 方法中配置动态关联：

```php
use App\Models\Order;
use App\Models\Customer;

Order::resolveRelationUsing('customer', function ($orderModel) {
    return $orderModel->belongsTo(Customer::class, 'customer_id');
});
```

> **Warning**  
> 定义动态关联时，始终为 Eloquent 关联方法提供显式键名参数。

<a name="querying-relations"></a>
## 查询关联

由于所有 Eloquent 关联都通过方法定义，你可以调用这些方法获取关联实例，而无需实际执行查询来加载关联模型。此外，所有类型的 Eloquent 关联也充当[查询构造器](/docs/{{version}}/queries)，允许你在最终对数据库执行 SQL 查询之前继续在关联查询上链式添加约束。

例如，假设一个博客应用中 `User` 模型关联了多个 `Post` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取用户的所有文章。
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
```

你可以像这样查询 `posts` 关联并为关联添加额外约束：

```php
use App\Models\User;

$user = User::find(1);

$user->posts()->where('active', 1)->get();
```

你可以在关联上使用 Laravel [查询构造器](/docs/{{version}}/queries)的任何方法，因此请务必查阅查询构造器文档了解所有可用方法。

<a name="chaining-orwhere-clauses-after-relationships"></a>
#### 在关联后链式调用 `orWhere` 子句

如上面示例所示，查询关联时你可以自由添加额外约束。但是，在关联上链式调用 `orWhere` 子句时要小心，因为 `orWhere` 子句将与关联约束在同一逻辑层级分组：

```php
$user->posts()
        ->where('active', 1)
        ->orWhere('votes', '>=', 100)
        ->get();
```

上面的示例将生成以下 SQL。如你所见，`or` 子句指示查询返回投票数大于 100 的_任意_用户。查询不再约束到特定用户：

```sql
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应使用[逻辑分组](/docs/{{version}}/queries#logical-grouping)将条件检查用括号分组：

```php
use Illuminate\Database\Eloquent\Builder;

$user->posts()
        ->where(function (Builder $query) {
            return $query->where('active', 1)
                         ->orWhere('votes', '>=', 100);
        })
        ->get();
```

上面的示例将生成以下 SQL。注意逻辑分组已正确分组约束，查询仍约束到特定用户：

```sql
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

<a name="relationship-methods-vs-dynamic-properties"></a>
### 关联方法与动态属性

如果不需要为 Eloquent 关联查询添加额外约束，你可以像访问属性一样访问关联。例如，继续使用 `User` 和 `Post` 示例模型，我们可以像这样访问用户的所有文章：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->posts as $post) {
    //
}
```

动态关联属性执行"延迟加载"，意味着只有在你实际访问它们时才会加载关联数据。因此，开发者经常使用[预加载](#eager-loading)来预加载他们知道在加载模型后会访问的关联。预加载显著减少了为加载模型关联而必须执行的 SQL 查询数量。

<a name="querying-relationship-existence"></a>
### 查询关联存在性

获取模型记录时，你可能希望根据关联的存在性限制结果。例如，假设你想获取至少有一条评论的所有博客文章。为此，你可以将关联名称传递给 `has` 和 `orHas` 方法：

```php
use App\Models\Post;

// 获取至少有一条评论的所有文章...
$posts = Post::has('comments')->get();
```

你还可以指定运算符和计数值来进一步自定义查询：

```php
// 获取有三条或更多评论的所有文章...
$posts = Post::has('comments', '>=', 3)->get();
```

可以使用"点"符号构建嵌套 `has` 语句。例如，你可以获取至少有一条评论且该评论至少有一张图片的所有文章：

```php
// 获取至少有一条带图片评论的文章...
$posts = Post::has('comments.images')->get();
```

如果需要更强大的功能，可以使用 `whereHas` 和 `orWhereHas` 方法在 `has` 查询上定义额外查询约束，例如检查评论内容：

```php
use Illuminate\Database\Eloquent\Builder;

// 获取至少有一条包含 code% 类词汇评论的文章...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();

// 获取至少有十条包含 code% 类词汇评论的文章...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
}, '>=', 10)->get();
```

> **Warning**  
> Eloquent 目前不支持跨数据库查询关联存在性。关联必须存在于同一数据库中。

<a name="inline-relationship-existence-queries"></a>
#### 内联关联存在性查询

如果你想查询关联存在性并在关联查询上附加单个简单 where 条件，使用 `whereRelation`、`orWhereRelation`、`whereMorphRelation` 和 `orWhereMorphRelation` 方法可能更方便。例如，我们可以查询所有拥有未批准评论的文章：

```php
use App\Models\Post;

$posts = Post::whereRelation('comments', 'is_approved', false)->get();
```

当然，与调用查询构造器的 `where` 方法一样，你也可以指定运算符：

```php
$posts = Post::whereRelation(
    'comments', 'created_at', '>=', now()->subHour()
)->get();
```

<a name="querying-relationship-absence"></a>
### 查询关联不存在

获取模型记录时，你可能希望根据关联的不存在限制结果。例如，假设你想获取**没有**任何评论的所有博客文章。为此，你可以将关联名称传递给 `doesntHave` 和 `orDoesntHave` 方法：

```php
use App\Models\Post;

$posts = Post::doesntHave('comments')->get();
```

如果需要更强大的功能，可以使用 `whereDoesntHave` 和 `orWhereDoesntHave` 方法为 `doesntHave` 查询添加额外查询约束，例如检查评论内容：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();
```

你可以使用"点"符号对嵌套关联执行查询。例如，以下查询将获取所有没有评论的文章；但是，拥有来自未封禁作者评论的文章将包含在结果中：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments.author', function (Builder $query) {
    $query->where('banned', 0);
})->get();
```

<a name="querying-morph-to-relationships"></a>
### 查询多态归属关联

要查询"morph to"关联的存在性，可以使用 `whereHasMorph` 和 `whereDoesntHaveMorph` 方法。这些方法接受关联名称作为第一个参数。接下来，方法接受你希望包含在查询中的关联模型名称。最后，你可以提供一个自定义关联查询的闭包：

```php
use App\Models\Comment;
use App\Models\Post;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;

// 获取标题类似 code% 的文章或视频的评论...
$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();

// 获取标题不类似 code% 的文章的评论...
$comments = Comment::whereDoesntHaveMorph(
    'commentable',
    Post::class,
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();
```

你偶尔可能需要根据关联多态模型的"type"添加查询约束。传递给 `whereHasMorph` 方法的闭包可以接收 `$type` 值作为第二个参数。此参数允许你检查正在构建的查询的"type"：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query, $type) {
        $column = $type === Post::class ? 'content' : 'title';

        $query->where($column, 'like', 'code%');
    }
)->get();
```

<a name="querying-all-morph-to-related-models"></a>
#### 查询所有关联模型

你可以提供 `*` 作为通配符值，而不是传递可能的多态模型数组。这将指示 Laravel 从数据库获取所有可能的多态类型。Laravel 将执行额外查询来执行此操作：

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

有时你可能想要统计给定关联的关联模型数量，而无需实际加载模型。为此，你可以使用 `withCount` 方法。`withCount` 方法会在结果模型上放置一个 `{relation}_count` 属性：

```php
use App\Models\Post;

$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count;
}
```

通过向 `withCount` 方法传递数组，你可以为多个关联添加"计数"并为查询添加额外约束：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount(['votes', 'comments' => function (Builder $query) {
    $query->where('content', 'like', 'code%');
}])->get();

echo $posts[0]->votes_count;
echo $posts[0]->comments_count;
```

你还可以为关联计数结果设置别名，允许对同一关联进行多次计数：

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

使用 `loadCount` 方法，你可以在父模型已经获取后加载关联计数：

```php
$book = Book::first();

$book->loadCount('genres');
```

如果需要为计数查询设置额外查询约束，可以传递一个以你希望计数的关联为键的数组。数组值应为接收查询构造器实例的闭包：

```php
$book->loadCount(['reviews' => function ($query) {
    $query->where('rating', 5);
}])
```

<a name="relationship-counting-and-custom-select-statements"></a>
#### 关联计数与自定义 Select 语句

如果将 `withCount` 与 `select` 语句结合使用，请确保在 `select` 方法之后调用 `withCount`：

```php
$posts = Post::select(['title', 'body'])
                ->withCount('comments')
                ->get();
```

<a name="other-aggregate-functions"></a>
### 其他聚合函数

除了 `withCount` 方法外，Eloquent 还提供 `withMin`、`withMax`、`withAvg`、`withSum` 和 `withExists` 方法。这些方法会在结果模型上放置一个 `{relation}_{function}_{column}` 属性：

```php
use App\Models\Post;

$posts = Post::withSum('comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->comments_sum_votes;
}
```

如果你想使用其他名称访问聚合函数的结果，可以指定自己的别名：

```php
$posts = Post::withSum('comments as total_comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->total_comments;
}
```

与 `loadCount` 方法类似，这些方法的延迟版本也可用。这些额外的聚合操作可以在已获取的 Eloquent 模型上执行：

```php
$post = Post::first();

$post->loadSum('comments', 'votes');
```

如果将这些聚合方法与 `select` 语句结合使用，请确保在 `select` 方法之后调用聚合方法：

```php
$posts = Post::select(['title', 'body'])
                ->withExists('comments')
                ->get();
```

<a name="counting-related-models-on-morph-to-relationships"></a>
### 统计多态归属关联的模型数量

如果你想预加载"morph to"关联，以及该关联可能返回的各种实体的关联模型计数，可以将 `with` 方法与 `morphTo` 关联的 `morphWithCount` 方法结合使用。

在此例中，假设 `Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。我们假设 `ActivityFeed` 模型定义了一个名为 `parentable` 的"morph to"关联，允许我们获取给定 `ActivityFeed` 实例的父级 `Photo` 或 `Post` 模型。此外，假设 `Photo` 模型"拥有多个" `Tag` 模型，`Post` 模型"拥有多个" `Comment` 模型。

现在，假设我们想要获取 `ActivityFeed` 实例并为每个 `ActivityFeed` 实例预加载 `parentable` 父模型。此外，我们希望获取每个父级照片关联的标签数量和每个父级文章关联的评论数量：

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

假设我们已经获取了一组 `ActivityFeed` 模型，现在想要为与活动流关联的各种 `parentable` 模型加载嵌套关联计数。你可以使用 `loadMorphCount` 方法来实现：

```php
$activities = ActivityFeed::with('parentable')->get();

$activities->loadMorphCount('parentable', [
    Photo::class => ['tags'],
    Post::class => ['comments'],
]);
```

<a name="eager-loading"></a>
## 预加载

将 Eloquent 关联作为属性访问时，关联模型会"延迟加载"。这意味着关联数据在你首次访问属性之前不会实际加载。但是，Eloquent 可以在查询父模型时"预加载"关联。预加载缓解了"N + 1"查询问题。为了说明 N + 1 查询问题，考虑一个"属于" `Author` 模型的 `Book` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    /**
     * 获取写该书的作者。
     */
    public function author()
    {
        return $this->belongsTo(Author::class);
    }
}
```

现在，让我们获取所有书籍及其作者：

```php
use App\Models\Book;

$books = Book::all();

foreach ($books as $book) {
    echo $book->author->name;
}
```

此循环将执行一次查询获取数据库表中的所有书籍，然后为每本书执行另一次查询以获取书籍的作者。因此，如果我们有 25 本书，上面的代码将运行 26 次查询：一次用于原始书籍，25 次额外查询用于获取每本书的作者。

幸运的是，我们可以使用预加载将此操作减少到仅两次查询。构建查询时，你可以使用 `with` 方法指定应预加载哪些关联：

```php
$books = Book::with('author')->get();

foreach ($books as $book) {
    echo $book->author->name;
}
```

对于此操作，只会执行两次查询——一次查询获取所有书籍，一次查询获取所有书籍的所有作者：

```sql
select * from books

select * from authors where id in (1, 2, 3, 4, 5, ...)
```

<a name="eager-loading-multiple-relationships"></a>
#### 预加载多个关联

有时你可能需要预加载多个不同关联。为此，只需将关联数组传递给 `with` 方法：

```php
$books = Book::with(['author', 'publisher'])->get();
```

<a name="nested-eager-loading"></a>
#### 嵌套预加载

要预加载关联的关联，可以使用"点"语法。例如，让我们预加载所有书籍的作者以及作者的所有个人联系人：

```php
$books = Book::with('author.contacts')->get();
```

或者，你可以通过向 `with` 方法提供嵌套数组来指定嵌套预加载关联，这在预加载多个嵌套关联时很方便：

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

如果你想预加载 `morphTo` 关联以及该关联可能返回的各种实体上的嵌套关联，可以将 `with` 方法与 `morphTo` 关联的 `morphWith` 方法结合使用。为了帮助说明此方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;

class ActivityFeed extends Model
{
    /**
     * 获取活动流记录的父级。
     */
    public function parentable()
    {
        return $this->morphTo();
    }
}
```

在此例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，`Post` 模型属于 `Author` 模型。

使用这些模型定义和关联，我们可以获取 `ActivityFeed` 模型实例并预加载所有 `parentable` 模型及其各自的嵌套关联：

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

你并不总是需要所获取关联的每个字段。因此，Eloquent 允许你指定希望获取关联的哪些字段：

```php
$books = Book::with('author:id,name,book_id')->get();
```

> **Warning**  
> 使用此功能时，应始终在希望获取的字段列表中包含 `id` 字段和任何相关的外键字段。

<a name="eager-loading-by-default"></a>
#### 默认预加载

有时你可能希望在获取模型时始终加载某些关联。为此，你可以在模型上定义 `$with` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    /**
     * 应始终加载的关联。
     *
     * @var array
     */
    protected $with = ['author'];

    /**
     * 获取写该书的作者。
     */
    public function author()
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * 获取书籍的类型。
     */
    public function genre()
    {
        return $this->belongsTo(Genre::class);
    }
}
```

如果你想为单个查询从 `$with` 属性中移除一项，可以使用 `without` 方法：

```php
$books = Book::without('author')->get();
```

如果你想为单个查询覆盖 `$with` 属性中的所有项，可以使用 `withOnly` 方法：

```php
$books = Book::withOnly('genre')->get();
```

<a name="constraining-eager-loads"></a>
### 约束预加载

有时你可能希望预加载关联，但也为预加载查询指定额外查询条件。你可以通过向 `with` 方法传递关联数组来实现，其中数组键是关联名称，数组值是为预加载查询添加额外约束的闭包：

```php
use App\Models\User;

$users = User::with(['posts' => function ($query) {
    $query->where('title', 'like', '%code%');
}])->get();
```

在此例中，Eloquent 只会预加载 `title` 字段包含单词 `code` 的文章。你可以调用其他[查询构造器](/docs/{{version}}/queries)方法来进一步自定义预加载操作：

```php
$users = User::with(['posts' => function ($query) {
    $query->orderBy('created_at', 'desc');
}])->get();
```

> **Warning**  
> 约束预加载时不能使用 `limit` 和 `take` 查询构造器方法。

<a name="constraining-eager-loading-of-morph-to-relationships"></a>
#### 约束 `morphTo` 关联的预加载

如果你在预加载 `morphTo` 关联，Eloquent 将运行多次查询来获取每种类型的关联模型。你可以使用 `MorphTo` 关联的 `constrain` 方法为每个查询添加额外约束：

```php
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphTo;

$comments = Comment::with(['commentable' => function (MorphTo $morphTo) {
    $morphTo->constrain([
        Post::class => function (Builder $query) {
            $query->whereNull('hidden_at');
        },
        Video::class => function (Builder $query) {
            $query->where('type', 'educational');
        },
    ]);
}])->get();
```

在此例中，Eloquent 只会预加载未被隐藏的文章和 `type` 值为"educational"的视频。

<a name="constraining-eager-loads-with-relationship-existence"></a>
#### 通过关联存在性约束预加载

你有时可能需要在检查关联存在性的同时，基于相同条件加载关联。例如，你可能希望只获取拥有匹配给定查询条件的子 `Post` 模型的 `User` 模型，同时预加载匹配的文章。你可以使用 `withWhereHas` 方法来实现：

```php
use App\Models\User;

$users = User::withWhereHas('posts', function ($query) {
    $query->where('featured', true);
})->get();
```

<a name="lazy-eager-loading"></a>
### 延迟预加载

有时你可能需要在父模型已经获取后预加载关联。例如，如果你需要动态决定是否加载关联模型，这可能很有用：

```php
use App\Models\Book;

$books = Book::all();

if ($someCondition) {
    $books->load('author', 'publisher');
}
```

如果需要为预加载查询设置额外查询约束，可以传递一个以你希望加载的关联为键的数组。数组值应为接收查询实例的闭包实例：

```php
$author->load(['books' => function ($query) {
    $query->orderBy('published_date', 'asc');
}]);
```

要仅在关联尚未加载时加载关联，使用 `loadMissing` 方法：

```php
$book->loadMissing('author');
```

<a name="nested-lazy-eager-loading-morphto"></a>
#### 嵌套延迟预加载与 `morphTo`

如果你想预加载 `morphTo` 关联以及该关联可能返回的各种实体上的嵌套关联，可以使用 `loadMorph` 方法。

此方法接受 `morphTo` 关联名称作为第一个参数，模型/关联对数组作为第二个参数。为了帮助说明此方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;

class ActivityFeed extends Model
{
    /**
     * 获取活动流记录的父级。
     */
    public function parentable()
    {
        return $this->morphTo();
    }
}
```

在此例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，`Post` 模型属于 `Author` 模型。

使用这些模型定义和关联，我们可以获取 `ActivityFeed` 模型实例并预加载所有 `parentable` 模型及其各自的嵌套关联：

```php
$activities = ActivityFeed::with('parentable')
    ->get()
    ->loadMorph('parentable', [
        Event::class => ['calendar'],
        Photo::class => ['tags'],
        Post::class => ['author'],
    ]);
```

<a name="preventing-lazy-loading"></a>
### 阻止延迟加载

如前所述，预加载关联通常可以为应用提供显著的性能优势。因此，如果你愿意，可以指示 Laravel 始终阻止关联的延迟加载。为此，你可以调用基础 Eloquent 模型类提供的 `preventLazyLoading` 方法。通常，你应在应用的 `AppServiceProvider` 类的 `boot` 方法中调用此方法。

`preventLazyLoading` 方法接受一个可选的布尔参数，指示是否应阻止延迟加载。例如，你可能希望仅在非生产环境中禁用延迟加载，以便即使生产代码中意外存在延迟加载关联，生产环境仍能正常运行：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

阻止延迟加载后，当应用尝试延迟加载任何 Eloquent 关联时，Eloquent 将抛出 `Illuminate\Database\LazyLoadingViolationException` 异常。

你可以使用 `handleLazyLoadingViolationsUsing` 方法自定义延迟加载违规行为。例如，使用此方法，你可以指示延迟加载违规仅记录日志，而不是用异常中断应用执行：

```php
Model::handleLazyLoadingViolationUsing(function ($model, $relation) {
    $class = get_class($model);

    info("Attempted to lazy load [{$relation}] on model [{$class}].");
});
```

<a name="inserting-and-updating-related-models"></a>
## 插入与更新关联模型

<a name="the-save-method"></a>
### `save` 方法

Eloquent 提供了向关联添加新模型的便捷方法。例如，也许你需要为文章添加新评论。你可以使用关联的 `save` 方法插入评论，而不是手动在 `Comment` 模型上设置 `post_id` 属性：

```php
use App\Models\Comment;
use App\Models\Post;

$comment = new Comment(['message' => 'A new comment.']);

$post = Post::find(1);

$post->comments()->save($comment);
```

请注意，我们没有将 `comments` 关联作为动态属性访问。相反，我们调用了 `comments` 方法获取关联实例。`save` 方法会自动为新的 `Comment` 模型添加适当的 `post_id` 值。

如果需要保存多个关联模型，可以使用 `saveMany` 方法：

```php
$post = Post::find(1);

$post->comments()->saveMany([
    new Comment(['message' => 'A new comment.']),
    new Comment(['message' => 'Another new comment.']),
]);
```

`save` 和 `saveMany` 方法会持久化给定模型实例，但不会将新持久化的模型添加到已加载到父模型的任何内存关联中。如果你计划在使用 `save` 或 `saveMany` 方法后访问关联，可能需要使用 `refresh` 方法重新加载模型及其关联：

```php
$post->comments()->save($comment);

$post->refresh();

// 所有评论，包括新保存的评论...
$post->comments;
```

<a name="the-push-method"></a>
#### 递归保存模型与关联

如果你想 `save` 模型及其所有关联关联，可以使用 `push` 方法。在此例中，`Post` 模型及其评论和评论的作者都将被保存：

```php
$post = Post::find(1);

$post->comments[0]->message = 'Message';
$post->comments[0]->author->name = 'Author Name';

$post->push();
```

`pushQuietly` 方法可用于保存模型及其关联关联而不触发任何事件：

```php
$post->pushQuietly();
```

<a name="the-create-method"></a>
### `create` 方法

除了 `save` 和 `saveMany` 方法外，你还可以使用 `create` 方法，该方法接受属性数组，创建模型并插入数据库。`save` 和 `create` 的区别在于 `save` 接受完整的 Eloquent 模型实例，而 `create` 接受普通 PHP `array`。新创建的模型将由 `create` 方法返回：

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

你还可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法在[关联上创建和更新模型](/docs/{{version}}/eloquent#upserts)。

> **Note**  
> 使用 `create` 方法之前，请务必查阅[批量赋值](/docs/{{version}}/eloquent#mass-assignment)文档。

<a name="updating-belongs-to-relationships"></a>
### Belongs To 关联

如果你想将子模型分配给新的父模型，可以使用 `associate` 方法。在此例中，`User` 模型定义了到 `Account` 模型的 `belongsTo` 关联。此 `associate` 方法将在子模型上设置外键：

```php
use App\Models\Account;

$account = Account::find(10);

$user->account()->associate($account);

$user->save();
```

要从子模型移除父模型，可以使用 `dissociate` 方法。此方法会将关联的外键设置为 `null`：

```php
$user->account()->dissociate();

$user->save();
```

<a name="updating-many-to-many-relationships"></a>
### 多对多关联

<a name="attaching-detaching"></a>
#### 附加 / 解除

Eloquent 还提供了使处理多对多关联更便捷的方法。例如，假设用户可以拥有多个角色，角色可以拥有多个用户。你可以使用 `attach` 方法通过在关联的中间表中插入记录来为用户附加角色：

```php
use App\Models\User;

$user = User::find(1);

$user->roles()->attach($roleId);
```

将关联附加到模型时，你还可以传递要插入中间表的额外数据数组：

```php
$user->roles()->attach($roleId, ['expires' => $expires]);
```

有时可能需要从用户移除角色。要移除多对多关联记录，使用 `detach` 方法。`detach` 方法会从中间表删除相应记录；但是，两个模型都会保留在数据库中：

```php
// 从用户解除单个角色...
$user->roles()->detach($roleId);

// 从用户解除所有角色...
$user->roles()->detach();
```

为方便起见，`attach` 和 `detach` 也接受 ID 数组作为输入：

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

你还可以使用 `sync` 方法构建多对多关联。`sync` 方法接受要放置在中间表上的 ID 数组。不在给定数组中的任何 ID 都将从中间表移除。因此，此操作完成后，中间表中只存在给定数组中的 ID：

```php
$user->roles()->sync([1, 2, 3]);
```

你还可以随 ID 传递额外中间表值：

```php
$user->roles()->sync([1 => ['expires' => true], 2, 3]);
```

如果你想为每个同步的模型 ID 插入相同的中间表值，可以使用 `syncWithPivotValues` 方法：

```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['active' => true]);
```

如果不想解除给定数组中缺失的现有 ID，可以使用 `syncWithoutDetaching` 方法：

```php
$user->roles()->syncWithoutDetaching([1, 2, 3]);
```

<a name="toggling-associations"></a>
#### 切换关联

多对多关联还提供 `toggle` 方法，该方法"切换"给定关联模型 ID 的附加状态。如果给定 ID 当前已附加，则会被解除。同样，如果当前已解除，则会被附加：

```php
$user->roles()->toggle([1, 2, 3]);
```

你还可以随 ID 传递额外中间表值：

```php
$user->roles()->toggle([
    1 => ['expires' => true],
    2 => ['expires' => true],
]);
```

<a name="updating-a-record-on-the-intermediate-table"></a>
#### 更新中间表上的记录

如果需要更新关联中间表中的现有行，可以使用 `updateExistingPivot` 方法。此方法接受中间记录外键和要更新的属性数组：

```php
$user = User::find(1);

$user->roles()->updateExistingPivot($roleId, [
    'active' => false,
]);
```

<a name="touching-parent-timestamps"></a>
## 触碰父级时间戳

当模型定义了到另一个模型的 `belongsTo` 或 `belongsToMany` 关联时，例如属于 `Post` 的 `Comment`，在子模型更新时更新父级的时间戳有时很有用。

例如，当 `Comment` 模型更新时，你可能想要自动"触碰"所属 `Post` 的 `updated_at` 时间戳，使其设置为当前日期和时间。为此，你可以在子模型上添加 `touches` 属性，包含子模型更新时应更新其 `updated_at` 时间戳的关联名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    /**
     * 所有要触碰的关联。
     *
     * @var array
     */
    protected $touches = ['post'];

    /**
     * 获取评论所属的文章。
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
```

> **Warning**  
> 只有使用 Eloquent 的 `save` 方法更新子模型时，父模型时间戳才会更新。
