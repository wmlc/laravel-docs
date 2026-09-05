# Eloquent：关联关系

## 简介

数据库表之间通常相互关联。例如，一篇博客文章可能有许多评论，或者一个订单可能与下单的用户相关联。Eloquent 让管理和处理这些关联关系变得简单，并支持多种常见的关联关系：

- [一对一](#one-to-one)
- [一对多](#one-to-many)
- [多对多](#many-to-many)
- [Has One Through](#has-one-through)
- [Has Many Through](#has-many-through)
- [一对一（多态）](#one-to-one-polymorphic-relations)
- [一对多（多态）](#one-to-many-polymorphic-relations)
- [多对多（多态）](#many-to-many-polymorphic-relations)

## 定义关联关系

Eloquent 关联关系以方法的形式定义在你的 Eloquent 模型类上。由于关联关系同时也充当 [查询构造器](/docs/{{version}}/queries)，将关联关系定义为方法可以提供强大的方法链式调用和查询能力。例如，我们可以对 `posts` 关联关系链式添加其他查询约束：

```php
$user->posts()->where('active', 1)->get();
```

但是，在深入使用关联关系之前，让我们先学习如何定义 Eloquent 支持的每种关联关系类型。

### 一对一 / Has One

一对一关系是一种非常基本的数据库关系。例如，`User` 模型可能与一个 `Phone` 模型相关联。要定义这种关系，我们将在 `User` 模型上放置一个 `phone` 方法。`phone` 方法应调用 `hasOne` 方法并返回其结果。`hasOne` 方法通过模型的 `Illuminate\Database\Eloquent\Model` 基类对你的模型可用：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * Get the phone associated with the user.
     */
    public function phone(): HasOne
    {
        return $this->hasOne(Phone::class);
    }
}
```

传递给 `hasOne` 方法的第一个参数是相关模型类的名称。定义关联关系后，我们可以使用 Eloquent 的动态属性检索相关记录。动态属性允许你像访问模型上定义的属性一样访问关联关系方法：

```php
$phone = User::find(1)->phone;
```

Eloquent 根据父模型名称确定该关联关系的外键。在这种情况下，`Phone` 模型被自动假定具有 `user_id` 外键。如果你想覆盖此约定，可以将第二个参数传递给 `hasOne` 方法：

```php
return $this->hasOne(Phone::class, 'foreign_key');
```

此外，Eloquent 假定外键应具有与父模型主键列相匹配的值。换句话说，Eloquent 将在 `Phone` 记录的 `user_id` 列中查找用户 `id` 列的值。如果希望该关系使用 `id` 或模型主键以外的主键值，可以将第三个参数传递给 `hasOne` 方法：

```php
return $this->hasOne(Phone::class, 'foreign_key', 'local_key');
```

#### 定义关联关系的反向关系

因此，我们可以从 `User` 模型访问 `Phone` 模型。接下来，让我们在 `Phone` 模型上定义一个关系，使我们能够访问拥有该电话的用户。我们可以使用 `belongsTo` 方法定义 `hasOne` 关系的反向关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Phone extends Model
{
    /**
     * Get the user that owns the phone.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

调用 `user` 方法时，Eloquent 将尝试找到一个 `User` 模型，其 `id` 与 `Phone` 模型上的 `user_id` 列相匹配。

Eloquent 通过检查关联关系方法的名称并在方法名后追加 `_id` 来确定外键名称。因此，在这种情况下，Eloquent 假定 `Phone` 模型具有 `user_id` 列。但是，如果 `Phone` 模型上的外键不是 `user_id`，可以将自定义键名作为第二个参数传递给 `belongsTo` 方法：

```php
/**
 * Get the user that owns the phone.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key');
}
```

如果父模型不使用 `id` 作为其主键，或者希望使用其他列查找关联模型，可以将第三个参数传递给 `belongsTo` 方法，指定父表的自定义键：

```php
/**
 * Get the user that owns the phone.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key', 'owner_key');
}
```

### 一对多 / Has Many

一对多关系用于定义单个模型是一个或多个子模型的父级的关系。例如，一篇博客文章可能有无限数量的评论。与所有其他 Eloquent 关联关系一样，一对多关系是通过在 Eloquent 模型上定义方法来定义的：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * Get the comments for the blog post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
```

请记住，Eloquent 将自动确定 `Comment` 模型的适当外键列。按照约定，Eloquent 将采用父模型的「snake case」名称，并在其后追加 `_id`。因此，在此示例中，Eloquent 将假定 `Comment` 模型上的外键列为 `post_id`。

一旦定义了关联关系方法，我们就可以通过访问 `comments` 属性来访问相关评论的 [集合](/docs/{{version}}/eloquent-collections)。请记住，由于 Eloquent 提供了「动态关联关系属性」，我们可以像访问模型上定义的属性一样访问关联关系方法：

```php
use App\Models\Post;

$comments = Post::find(1)->comments;

foreach ($comments as $comment) {
    // ...
}
```

由于所有关联关系也都充当查询构造器，你可以通过调用 `comments` 方法并继续将条件链接到查询来为关联关系查询添加更多约束：

```php
$comment = Post::find(1)->comments()
    ->where('title', 'foo')
    ->first();
```

与 `hasOne` 方法类似，你也可以通过向 `hasMany` 方法传递其他参数来覆盖外键和本地键：

```php
return $this->hasMany(Comment::class, 'foreign_key');

return $this->hasMany(Comment::class, 'foreign_key', 'local_key');
```

#### 自动在子模型上注入父模型

即使使用 Eloquent 预加载，当你尝试在循环子模型时从子模型访问父模型，也可能会出现「N + 1」查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->post->title;
    }
}
```

在上面的示例中，引入了「N + 1」查询问题，因为即使为每个 `Post` 模型预加载了评论，Eloquent 也不会自动将父级 `Post` 注入到每个子级 `Comment` 模型上。

如果希望 Eloquent 自动将父模型注入到其子模型上，可以在定义 `hasMany` 关系时调用 `chaperone` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * Get the comments for the blog post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->chaperone();
    }
}
```

或者，如果你希望在运行时选择启用自动父级注入，可以在预加载关联关系时调用 `chaperone` 方法：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

### 一对多（反向）/ Belongs To

现在我们可以访问一篇文章的所有评论，让我们定义一个关系以允许评论访问其父文章。要定义 `hasMany` 关系的反向关系，请在子模型上定义一个调用 `belongsTo` 方法的关系方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * Get the post that owns the comment.
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

定义关联关系后，我们可以通过访问 `post`「动态关联关系属性」来检索评论的父文章：

```php
use App\Models\Comment;

$comment = Comment::find(1);

return $comment->post->title;
```

在上面的示例中，Eloquent 将尝试找到一个 `Post` 模型，其 `id` 与 `Comment` 模型上的 `post_id` 列相匹配。

Eloquent 通过检查关联关系方法的名称并在方法名后追加 `_` 以及父模型主键列的名称来确定默认的外键名称。因此，在此示例中，Eloquent 将假定 `Post` 模型在 `comments` 表上的外键是 `post_id`。

但是，如果你的关系的外键不遵循这些约定，可以将自定义外键名称作为第二个参数传递给 `belongsTo` 方法：

```php
/**
 * Get the post that owns the comment.
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key');
}
```

如果你的父模型不使用 `id` 作为其主键，或者希望使用其他列查找关联模型，可以将第三个参数传递给 `belongsTo` 方法，指定父表的自定义键：

```php
/**
 * Get the post that owns the comment.
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key', 'owner_key');
}
```

#### 默认模型

`belongsTo`、`hasOne`、`hasOneThrough` 和 `morphOne` 关系允许你定义一个默认模型，当给定关系为 `null` 时将返回该默认模型。这种模式通常称为 [Null Object pattern](https://en.wikipedia.org/wiki/Null_Object_pattern)，可以帮助删除代码中的条件检查。在下面的示例中，如果 `Post` 模型没有关联任何用户，则 `user` 关系将返回一个空的 `App\Models\User` 模型：

```php
/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault();
}
```

若要使用属性填充默认模型，可以将数组或闭包传递给 `withDefault` 方法：

```php
/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author',
    ]);
}

/**
 * Get the author of the post.
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault(function (User $user, Post $post) {
        $user->name = 'Guest Author';
    });
}
```

#### 查询 Belongs To 关系

当查询「belongs to」关系的子级时，你可以手动构建 `where` 子句以检索相应的 Eloquent 模型：

```php
use App\Models\Post;

$posts = Post::where('user_id', $user->id)->get();
```

但是，你可能会发现使用 `whereBelongsTo` 方法更方便，该方法将自动确定给定模型的适当关系和外键：

```php
$posts = Post::whereBelongsTo($user)->get();
```

你还可以向 `whereBelongsTo` 方法提供一个 [集合](/docs/{{version}}/eloquent-collections) 实例。提供时，Laravel 将检索属于集合中任何父模型的模型：

```php
$users = User::where('vip', true)->get();

$posts = Post::whereBelongsTo($users)->get();
```

默认情况下，Laravel 将根据给定模型的类名确定与之关联的关系；但是，你可以通过将关系名称作为第二个参数提供给 `whereBelongsTo` 方法来手动指定关系名称：

```php
$posts = Post::whereBelongsTo($user, 'author')->get();
```

### Has One of Many

有时一个模型可能有许多相关模型，但你希望轻松检索关系的「最新」或「最旧」相关模型。例如，`User` 模型可能与许多 `Order` 模型相关，但你希望定义一种便捷的方式来与用户最近下的订单进行交互。你可以使用 `hasOne` 关系类型结合 `ofMany` 方法来完成此操作：

```php
/**
 * Get the user's most recent order.
 */
public function latestOrder(): HasOne
{
    return $this->hasOne(Order::class)->latestOfMany();
}
```

同样，你可以定义一个方法来检索关系的「最旧」或第一个相关模型：

```php
/**
 * Get the user's oldest order.
 */
public function oldestOrder(): HasOne
{
    return $this->hasOne(Order::class)->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法将基于模型的主键（必须可排序）检索最新或最旧的相关模型。但是，有时你可能希望使用不同的排序条件从更大的关系中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户最昂贵的订单。`ofMany` 方法接受可排序列作为其第一个参数，以及查询相关模型时应用的聚合函数（`min` 或 `max`）：

```php
/**
 * Get the user's largest order.
 */
public function largestOrder(): HasOne
{
    return $this->hasOne(Order::class)->ofMany('price', 'max');
}
```

> [!WARNING]
> 由于 PostgreSQL 不支持对 UUID 列执行 `MAX` 函数，因此目前不可能将 one-of-many 关系与 PostgreSQL UUID 列结合使用。

#### 将「Many」关系转换为 Has One 关系

通常，当使用 `latestOfMany`、`oldestOfMany` 或 `ofMany` 方法检索单个模型时，你已经为同一模型定义了「has many」关系。为方便起见，Laravel 允许你通过对关系调用 `one` 方法轻松地将此关系转换为「has one」关系：

```php
/**
 * Get the user's orders.
 */
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

/**
 * Get the user's largest order.
 */
public function largestOrder(): HasOne
{
    return $this->orders()->one()->ofMany('price', 'max');
}
```

你还可以使用 `one` 方法将 `HasManyThrough` 关系转换为 `HasOneThrough` 关系：

```php
public function latestDeployment(): HasOneThrough
{
    return $this->deployments()->one()->latestOfMany();
}
```

#### 高级 Has One of Many 关系

可以构造更高级的「has one of many」关系。例如，`Product` 模型可能有许多关联的 `Price` 模型，即使在发布新价格后这些模型仍保留在系统中。此外，产品的新定价数据可能能够提前发布，以便通过 `published_at` 列在未来的某个日期生效。

因此，总之，我们需要检索已发布日期不是未来的最新已发布价格。此外，如果两个价格具有相同的已发布日期，我们将首选具有最大 ID 的价格。要完成此操作，我们必须将一个数组传递给 `ofMany` 方法，该数组包含确定最新价格的可排序列。此外，一个闭包将作为第二个参数提供给 `ofMany` 方法。此闭包将负责向关系查询添加其他发布日期约束：

```php
/**
 * Get the current pricing for the product.
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

### Has One Through

「has-one-through」关系定义与另一个模型的一对一关系。但是，此关系表明声明模型可以通过 _经过_ 第三个模型与另一个模型的一个实例进行匹配。

例如，在车辆维修店应用中，每个 `Mechanic` 模型可能与一个 `Car` 模型相关联，每个 `Car` 模型可能与一个 `Owner` 模型相关联。虽然机械师和车主在数据库中没有直接关系，但机械师可以通过 `Car` 模型访问车主。让我们看一下定义此关系所需的表：

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

现在我们已经检查了关系的表结构，让我们在 `Mechanic` 模型上定义关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Mechanic extends Model
{
    /**
     * Get the car's owner.
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(Owner::class, Car::class);
    }
}
```

传递给 `hasOneThrough` 方法的第一个参数是我们希望访问的最终模型的名称，而第二个参数是中间模型的名称。

或者，如果相关关系已经在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义「has-one-through」关系。例如，如果 `Mechanic` 模型具有 `cars` 关系，而 `Car` 模型具有 `owner` 关系，则可以如下定义连接机械师和车主的「has-one-through」关系：

```php
// String based syntax...
return $this->through('cars')->has('owner');

// Dynamic syntax...
return $this->throughCars()->hasOwner();
```

#### 键约定

执行关系查询时将使用典型的 Eloquent 外键约定。如果要自定义关系的键，可以将它们作为第三个和第四个参数传递给 `hasOneThrough` 方法。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Mechanic extends Model
{
    /**
     * Get the car's owner.
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(
            Owner::class,
            Car::class,
            'mechanic_id', // Foreign key on the cars table...
            'car_id', // Foreign key on the owners table...
            'id', // Local key on the mechanics table...
            'id' // Local key on the cars table...
        );
    }
}
```

或者，如前所述，如果相关关系已经在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义「has-one-through」关系。此方法的优点是可以重用现有关系上已定义的键约定：

```php
// String based syntax...
return $this->through('cars')->has('owner');

// Dynamic syntax...
return $this->throughCars()->hasOwner();
```

### Has Many Through

「has-many-through」关系提供了一种通过中间关系访问远程关系的便捷方式。例如，让我们假设我们正在构建一个像 [Laravel Cloud](https://cloud.laravel.com) 这样的部署平台。`Application` 模型可以通过中间 `Environment` 模型访问许多 `Deployment` 模型。使用此示例，你可以轻松收集给定应用程序的所有部署。让我们看一下定义此关系所需的表：

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

现在我们已经检查了关系的表结构，让我们在 `Application` 模型上定义关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Application extends Model
{
    /**
     * Get all of the deployments for the application.
     */
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(Deployment::class, Environment::class);
    }
}
```

传递给 `hasManyThrough` 方法的第一个参数是我们希望访问的最终模型的名称，而第二个参数是中间模型的名称。

或者，如果相关关系已经在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义「has-many-through」关系。例如，如果 `Application` 模型具有 `environments` 关系，而 `Environment` 模型具有 `deployments` 关系，则可以如下定义连接应用程序和部署的「has-many-through」关系：

```php
// String based syntax...
return $this->through('environments')->has('deployments');

// Dynamic syntax...
return $this->throughEnvironments()->hasDeployments();
```

尽管 `Deployment` 模型的表不包含 `application_id` 列，但 `hasManyThrough` 关系可通过 `$application->deployments` 提供对应用程序部署的访问。要检索这些模型，Eloquent 检查中间 `Environment` 模型表上的 `application_id` 列。找到相关环境 ID 后，将使用它们查询 `Deployment` 模型的表。

#### 键约定

执行关系查询时将使用典型的 Eloquent 外键约定。如果要自定义关系的键，可以将它们作为第三个和第四个参数传递给 `hasManyThrough` 方法。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，第六个参数是中间模型的本地键：

```php
class Application extends Model
{
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Deployment::class,
            Environment::class,
            'application_id', // Foreign key on the environments table...
            'environment_id', // Foreign key on the deployments table...
            'id', // Local key on the applications table...
            'id' // Local key on the environments table...
        );
    }
}
```

或者，如前所述，如果相关关系已经在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义「has-many-through」关系。此方法的优点是可以重用现有关系上已定义的键约定：

```php
// String based syntax...
return $this->through('environments')->has('deployments');

// Dynamic syntax...
return $this->throughEnvironments()->hasDeployments();
```

### 作用域关系

向模型中添加用于约束关联关系的附加方法是常见的做法。例如，你可以向 `User` 模型添加一个 `featuredPosts` 方法，该方法通过附加的 `where` 约束限制更广泛的 `posts` 关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * Get the user's posts.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->latest();
    }

    /**
     * Get the user's featured posts.
     */
    public function featuredPosts(): HasMany
    {
        return $this->posts()->where('featured', true);
    }
}
```

但是，如果你尝试通过 `featuredPosts` 方法创建模型，则其 `featured` 属性不会设置为 `true`。如果希望通过关系方法创建模型，同时指定应添加到通过该关系创建的所有模型的属性，可以在构建关系查询时使用 `withAttributes` 方法：

```php
/**
 * Get the user's featured posts.
 */
public function featuredPosts(): HasMany
{
    return $this->posts()->withAttributes(['featured' => true]);
}
```

`withAttributes` 方法将使用给定属性向查询添加 `where` 条件，并且还将给定属性添加到通过关系方法创建的任何模型：

```php
$post = $user->featuredPosts()->create(['title' => 'Featured Post']);

$post->featured; // true
```

若要指示 `withAttributes` 方法不要向查询添加 `where` 条件，可以将 `asConditions` 参数设置为 `false`：

```php
return $this->posts()->withAttributes(['featured' => true], asConditions: false);
```

## 多对多关系

多对多关系比 `hasOne` 和 `hasMany` 关系稍微复杂一些。多对多关系的一个示例是一个用户具有多个角色，并且这些角色也由应用中的其他用户共享。例如，一个用户可能被分配「作者」和「编辑」角色；但是，这些角色也可能被分配给其他用户。因此，一个用户有多个角色，一个角色有多个用户。

#### 表结构

要定义此关系，需要三个数据库表：`users`、`roles` 和 `role_user`。`role_user` 表派生自相关模型名称的字母顺序，并包含 `user_id` 和 `role_id` 列。该表用作链接用户和角色的中间表。

请记住，由于一个角色可以属于多个用户，因此我们不能简单地在 `roles` 表上放置 `user_id` 列。这将意味着一个角色只能属于一个用户。为了提供对将角色分配给多个用户的支持，需要 `role_user` 表。我们可以这样总结关系的表结构：

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

#### 模型结构

多对多关系是通过编写一个返回 `belongsToMany` 方法结果的方法来定义的。`belongsToMany` 方法由应用所有 Eloquent 模型使用的 `Illuminate\Database\Eloquent\Model` 基类提供。例如，让我们在 `User` 模型上定义一个 `roles` 方法。传递给此方法的第一个参数是相关模型类的名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    /**
     * The roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

定义关联关系后，你可以使用 `roles` 动态关联关系属性访问用户的角色：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    // ...
}
```

由于所有关联关系也都充当查询构造器，你可以通过调用 `roles` 方法并继续将条件链接到查询来为关联关系查询添加更多约束：

```php
$roles = User::find(1)->roles()->orderBy('name')->get();
```

为了确定关系中间表的表名，Eloquent 将按字母顺序连接两个相关模型名称。但是，你可以自由覆盖此约定。你可以通过将第二个参数传递给 `belongsToMany` 方法来实现：

```php
return $this->belongsToMany(Role::class, 'role_user');
```

除了自定义中间表的名称之外，你还可以通过向 `belongsToMany` 方法传递其他参数来自定义表上键的列名称。第三个参数是你正在定义关系的模型的外键名称，而第四个参数是你要加入的模型的外键名称：

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

#### 定义关联关系的反向关系

要定义多对多关系的「反向」关系，你应该在相关模型上定义一个也返回 `belongsToMany` 方法结果的方法。为了完成我们的用户/角色示例，让我们在 `Role` 模型上定义 `users` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * The users that belong to the role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```

如你所见，除了引用 `App\Models\User` 模型外，关系的定义方式与其 `User` 模型完全相同。由于我们重用了 `belongsToMany` 方法，因此在定义多对多关系的「反向」时，所有常用的表和键自定义选项都可用。

### 检索中间表列

正如你已经了解的，使用多对多关系需要存在中间表。Eloquent 提供了一些非常有用的与此表交互的方式。例如，假设我们的 `User` 模型有许多与之相关的 `Role` 模型。访问此关系后，我们可以使用模型上的 `pivot` 属性访问中间表：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

请注意，我们检索的每个 `Role` 模型都会自动分配一个 `pivot` 属性。此属性包含一个表示中间表的模型。

默认情况下，`pivot` 模型上将仅存在模型键。如果中间表包含额外的属性，则必须在定义关系时指定它们：

```php
return $this->belongsToMany(Role::class)->withPivot('active', 'created_by');
```

如果希望中间表具有由 Eloquent 自动维护的 `created_at` 和 `updated_at` 时间戳，请在定义关系时调用 `withTimestamps` 方法：

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

> [!WARNING]
> 使用 Eloquent 自动维护时间戳的中间表必须同时具有 `created_at` 和 `updated_at` 时间戳列。

#### 自定义 `pivot` 属性名称

如前所述，来自中间表的属性可以通过模型上的 `pivot` 属性访问。但是，你可以自由自定义此属性的名称，以更好地反映其在应用中的用途。

例如，如果你的应用包含可能订阅播客的用户，则你可能在用户和播客之间具有多对多关系。如果是这种情况，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。这可以在定义关系时使用 `as` 方法完成：

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

### 通过中间表列过滤查询

你还可以在定义关系时使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法过滤 `belongsToMany` 关系查询返回的结果：

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

`wherePivot` 向查询添加 where 子句约束，但不会在通过已定义关系创建新模型时添加指定的值。如果你需要同时使用特定 pivot 值查询和创建关系，可以使用 `withPivotValue` 方法：

```php
return $this->belongsToMany(Role::class)
    ->withPivotValue('approved', 1);
```

### 通过中间表列排序查询

你可以使用 `orderByPivot` 和 `orderByPivotDesc` 方法对 `belongsToMany` 关系查询返回的结果进行排序。在以下示例中，我们将检索用户的所有最新徽章：

```php
return $this->belongsToMany(Badge::class)
    ->where('rank', 'gold')
    ->orderByPivotDesc('created_at');
```

### 定义自定义中间表模型

如果希望定义一个自定义模型来表示多对多关系的中间表，可以在定义关系时调用 `using` 方法。自定义 pivot 模型使你有机会在 pivot 模型上定义其他行为，例如方法和类型转换。

自定义多对多 pivot 模型应扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类，而自定义多态多对多 pivot 模型应扩展 `Illuminate\Database\Eloquent\Relations\MorphPivot` 类。例如，我们可以定义一个 `Role` 模型，该模型使用自定义的 `RoleUser` pivot 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * The users that belong to the role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->using(RoleUser::class);
    }
}
```

定义 `RoleUser` 模型时，应扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类：

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
> Pivot 模型不能使用 `SoftDeletes` trait。如果需要对 pivot 记录进行软删除，请考虑将你的 pivot 模型转换为实际的 Eloquent 模型。

#### 自定义 Pivot 模型和自增 ID

如果你定义了使用自定义 pivot 模型的多对多关系，并且该 pivot 模型具有自动递增的主键，则应确保你的自定义 pivot 模型类使用 `Table` 属性并将 `incrementing` 设置为 `true`：

```php
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Table(incrementing: true)]
class RoleUser extends Pivot
{
    // ...
}
```

## 多态关系

多态关系允许子模型使用单个关联从属于多种多种模型。假设你正在构建一个允许用户共享博客文章和视频的应用。在这种情况下，`Comment` 模型可能同时从属于 `Post` 和 `Video` 模型。

### 一对一（多态）

#### 表结构

一对一多态关系类似于典型的一对一关系；但是，子模型可以使用单个关联从属于多种多种模型。例如，博客 `Post` 和 `User` 可能与 `Image` 模型共享多态关系。使用一对一多态关系，你可以拥有一个唯一的图像表，这些图像可以与文章和用户关联。首先，让我们检查一下表结构：

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
    imageable_type - string
    imageable_id - integer
```

请注意 `images` 表上的 `imageable_id` 和 `imageable_type` 列。`imageable_id` 列将包含文章或用户的 ID 值，而 `imageable_type` 列将包含父模型的类名。`imageable_type` 列由 Eloquent 用于确定在访问 `imageable` 关系时返回哪种「类型」的父模型。在这种情况下，该列将包含 `App\Models\Post` 或 `App\Models\User`。

#### 模型结构

接下来，让我们检查构建此关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Image extends Model
{
    /**
     * Get the parent imageable model (user or post).
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
     * Get the post's image.
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
     * Get the user's image.
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

#### 检索关系

一旦定义了数据库表和模型，你就可以通过模型访问这些关系。例如，要检索文章的图像，我们可以访问 `image` 动态关联关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

你可以通过访问执行 `morphTo` 调用的方法名称来检索多态模型的父级。在这种情况下，就是 `Image` 模型上的 `imageable` 方法。因此，我们将像访问动态关联关系属性一样访问该方法：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关系将返回 `Post` 或 `User` 实例，具体取决于拥有该图像的模型类型。

#### 键约定

必要时，你可以指定多态子模型使用的「id」和「type」列的名称。如果这样做，请确保始终将关系名称作为第一个参数传递给 `morphTo` 方法。通常，此值应与方法名称匹配，因此你可以使用 PHP 的 `__function__` 常量：

```php
/**
 * Get the model that the image belongs to.
 */
public function imageable(): MorphTo
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

### 一对多（多态）

#### 表结构

一对多多态关系类似于典型的一对多关系；但是，子模型可以使用单个关联从属于多种多种模型。例如，假设应用的用户可以对文章和视频「评论」。使用多态关系，你可以使用单个 `comments` 表来包含文章和视频的评论。首先，让我们检查一下构建此关系所需的表结构：

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
    commentable_type - string
    commentable_id - integer
```

#### 模型结构

接下来，让我们检查构建此关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
    /**
     * Get the parent commentable model (post or video).
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
     * Get all of the post's comments.
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
     * Get all of the video's comments.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

#### 检索关系

一旦定义了数据库表和模型，你就可以通过模型的动态关联关系属性访问这些关系。例如，要访问文章的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    // ...
}
```

你还可以通过访问执行 `morphTo` 调用的方法名称来检索多态子模型的父级。在这种情况下，就是 `Comment` 模型上的 `commentable` 方法。因此，我们将像访问动态关联关系属性一样访问该方法，以访问评论的父模型：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

`Comment` 模型上的 `commentable` 关系将返回 `Post` 或 `Video` 实例，具体取决于哪个类型的模型是评论的父级。

#### 自动在子模型上注入父模型

即使使用 Eloquent 预加载，当你尝试在循环子模型时从子模型访问父模型，也可能会出现「N + 1」查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->commentable->title;
    }
}
```

在上面的示例中，引入了「N + 1」查询问题，因为即使为每个 `Post` 模型预加载了评论，Eloquent 也不会自动将父级 `Post` 注入到每个子级 `Comment` 模型上。

如果希望 Eloquent 自动将父模型注入到其子模型上，可以在定义 `morphMany` 关系时调用 `chaperone` 方法：

```php
class Post extends Model
{
    /**
     * Get all of the post's comments.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')->chaperone();
    }
}
```

或者，如果你希望在运行时选择启用自动父级注入，可以在预加载关联关系时调用 `chaperone` 方法：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

### One of Many（多态）

有时一个模型可能有许多相关模型，但你希望轻松检索关系的「最新」或「最旧」相关模型。例如，`User` 模型可能与许多 `Image` 模型相关，但你希望定义一种便捷的方式来与用户上传的最新图像进行交互。你可以使用 `morphOne` 关系类型结合 `ofMany` 方法来完成此操作：

```php
/**
 * Get the user's most recent image.
 */
public function latestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->latestOfMany();
}
```

同样，你可以定义一个方法来检索关系的「最旧」或第一个相关模型：

```php
/**
 * Get the user's oldest image.
 */
public function oldestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法将基于模型的主键（必须可排序）检索最新或最旧的相关模型。但是，有时你可能希望使用不同的排序条件从更大的关系中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户最「受欢迎」的图像。`ofMany` 方法接受可排序列作为其第一个参数，以及查询相关模型时应用的聚合函数（`min` 或 `max`）：

```php
/**
 * Get the user's most popular image.
 */
public function bestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->ofMany('likes', 'max');
}
```

> [!NOTE]
> 可以构造更高级的「one of many」关系。有关更多信息，请参阅 [has one of many 文档](#advanced-has-one-of-many-relationships)。

### 多对多（多态）

#### 表结构

多对多多态关系比「morph one」和「morph many」关系稍微复杂一些。例如，`Post` 模型和 `Video` 模型可以与 `Tag` 模型共享多态关系。在这种情况下使用多对多多态关系将使你的应用拥有一个唯一的标签表，这些标签可以与文章或视频相关联。首先，让我们检查一下构建此关系所需的表结构：

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
    taggable_type - string
    taggable_id - integer
```

> [!NOTE]
> 在深入研究多态多对多关系之前，你可能会受益于阅读关于典型[多对多关系](#many-to-many)的文档。

#### 模型结构

接下来，我们准备在模型上定义关系。`Post` 和 `Video` 模型都将包含一个 `tags` 方法，该方法调用由基础 Eloquent 模型类提供的 `morphToMany` 方法。

`morphToMany` 方法接受相关模型的名称以及「关系名称」。根据我们分配给中间表名称及其包含的键的名称，我们将该关系称为「taggable」：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Post extends Model
{
    /**
     * Get all of the tags for the post.
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

#### 定义关联关系的反向关系

接下来，在 `Tag` 模型上，你应该为其每个可能的父模型定义一个方法。因此，在此示例中，我们将定义一个 `posts` 方法和一个 `videos` 方法。这两个方法都应返回 `morphedByMany` 方法的结果。

`morphedByMany` 方法接受相关模型的名称以及「关系名称」。根据我们分配给中间表名称及其包含的键的名称，我们将该关系称为「taggable」：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    /**
     * Get all of the posts that are assigned this tag.
     */
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    /**
     * Get all of the videos that are assigned this tag.
     */
    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

#### 检索关系

一旦定义了数据库表和模型，你就可以通过模型访问这些关系。例如，要访问文章的所有标签，你可以使用 `tags` 动态关联关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->tags as $tag) {
    // ...
}
```

你可以通过访问执行 `morphedByMany` 调用的方法名称，从多态子模型检索多态关系的父级。在这种情况下，就是 `Tag` 模型上的 `posts` 或 `videos` 方法：

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

### 自定义多态类型

默认情况下，Laravel 将使用完全限定的类名来存储相关模型的「type」。例如，在上面的一对多关系示例中，`Comment` 模型可能属于 `Post` 或 `Video` 模型，默认 `commentable_type` 将分别为 `App\Models\Post` 或 `App\Models\Video`。但是，你可能希望将这些值与应用的内部结构解耦。

例如，我们可以使用简单的字符串（如 `post` 和 `video`），而不是使用模型名称作为「type」。这样做，即使模型被重命名，数据库中的多态「type」列值也将保持有效：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);
```

你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enforceMorphMap` 方法，或者根据需要创建一个单独的服务提供者。

你可以使用模型的 `getMorphClass` 方法在运行时确定给定模型的多态别名。相反，你可以使用 `Relation::getMorphedModel` 方法确定与多态别名关联的完全限定类名：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

$alias = $post->getMorphClass();

$class = Relation::getMorphedModel($alias);
```

> [!WARNING]
> 当向现有应用添加「morph map」时，数据库中每个可多态的 `*_type` 列值（如果仍包含完全限定的类）都需要转换为其「map」名称。

### 动态关系

你可以使用 `resolveRelationUsing` 方法在运行时定义 Eloquent 模型之间的关系。虽然通常不建议在正常的应用开发中使用此方法，但在开发 Laravel 包时偶尔会有用。

`resolveRelationUsing` 方法接受所需的关系名称作为其第一个参数。传递给该方法的第二个参数应该是一个闭包，该闭包接受模型实例并返回有效的 Eloquent 关系定义。通常，你应该在 [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中配置动态关系：

```php
use App\Models\Order;
use App\Models\Customer;

Order::resolveRelationUsing('customer', function (Order $orderModel) {
    return $orderModel->belongsTo(Customer::class, 'customer_id');
});
```

> [!WARNING]
> 定义动态关系时，请始终向 Eloquent 关系方法提供显式的键名参数。

## 查询关联关系

由于所有 Eloquent 关联关系都是通过方法定义的，因此你可以调用这些方法来获取关系的实例，而无需实际执行查询来加载相关模型。此外，所有类型的 Eloquent 关联关系也充当 [查询构造器](/docs/{{version}}/queries)，允许你在最终对数据库执行 SQL 查询之前，继续将约束链接到到查询上。

例如，假设一个博客应用中 `User` 模型有许多关联的 `Post` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * Get all of the posts for the user.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

你可以查询 `posts` 关系并向关系添加其他约束，如下所示：

```php
use App\Models\User;

$user = User::find(1);

$user->posts()->where('active', 1)->get();
```

你可以在关系上使用任何 Laravel [查询构造器](/docs/{{version}}/queries) 方法，因此请务必浏览查询构造器文档以了解所有可用的方法。

#### 在关系之后链式调用 `orWhere` 子句

如上例所示，在查询关联关系时可以自由添加其他约束。但是，在将 `orWhere` 子句链接到关系时，请务必谨慎，因为 `orWhere` 子句将在逻辑上与关系约束处于同一级别：

```php
$user->posts()
()
    ->where('active', 1)
    ->orWhere('votes', '>=', 100)
    ->get();
```

上面的示例将生成以下 SQL。如你所见，`or` 子句指示查询返回_任何_投票数大于 100 的帖子。查询不再局限于特定用户：

```sql
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应该使用 [逻辑分组](/docs/{{version}}/queries#logical-grouping) 在括号内对条件检查进行分组：

```php
use Illuminate\Database\Eloquent\Builder;

$user->posts()
()
    ->where(function (Builder $query) {
        return $query->where('active', 1)
            ->orWhere('votes', '>=', 100);
    })
    ->get();
```

上面的示例将产生以下 SQL。请注意，逻辑分组已正确对约束进行分组，并且查询仍然局限于特定用户：

```sql
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

### 关系方法 vs. 动态属性

如果不需要向 Eloquent 关系查询添加其他约束，则可以像访问属性一样访问该关系。例如，继续使用我们的 `User` 和 `Post` 示例模型，我们可以像下面这样访问用户的所有帖子：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->posts as $post) {
    // ...
}
```

动态关联关系属性执行「懒加载」，这意味着它们只会在你实际访问它们时才加载其关系数据。因此，开发人员经常使用 [预加载](#eager-loading) 来预加载他们知道将在加载模型后访问的关联关系。预加载可以显著减少加载模型关系所必须执行的 SQL 查询。

### 查询关系存在性

检索模型记录时，你可能希望根据关系的存在来限制结果。例如，假设你想检索至少有 1 条评论的所有博客文章。为此，可以将关系名称传递给 `has` 和 `orHas` 方法：

```php
use App\Models\Post;

// Retrieve all posts that have at least one comment...
$posts = Post::has('comments')->get();
```

你还可以指定运算符和计数值以进一步自定义查询：

```php
// Retrieve all posts that have three or more comments...
$posts = Post::has('comments', '>=', 3)->get();
```

可以使用「点」表示法构造嵌套的 `has` 语句。例如，你可以检索至少有 1 条评论且该评论至少有 1 张图像的所有文章：

```php
// Retrieve posts that have at least one comment with images...
$posts = Post::has('comments.images')->get();
```

如果你需要更强大的功能，可以使用 `whereHas` 和 `orWhereHas` 方法为 `has` 查询定义其他查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

// Retrieve posts with at least one comment containing words like code%...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();

// Retrieve posts with at least ten comments containing words like code%...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
}, '>=', 10)->get();
```

> [!WARNING]
> Eloquent 目前不支持跨数据库查询关系存在性。关系必须存在于同一数据库中。

#### 多对多关系存在性查询

`whereAttachedTo` 方法可用于查询与某个模型或模型集合具有多对多关联的模型：

```php
$users = User::whereAttachedTo($role)->get();
```

你还可以向 `whereAttachedTo` 方法提供一个 [集合](/docs/{{version}}/eloquent-collections) 实例。提供时，Laravel 将检索与集合中任何模型相关联的模型：

```php
$tags = Tag::whereLike('name', '%laravel%')->get();

$posts = Post::whereAttachedTo($tags)->get();
```

#### 内联关系存在性查询

如果希望使用附加到关系查询的单个简单 where 条件来查询关系的存在性，则可能会发现使用 `whereRelation`、`orWhereRelation`、`whereMorphRelation` 和 `orWhereMorphRelation` 方法更方便。例如，我们可以查询所有具有未审核评论的文章：

```php
use App\Models\Post;

$posts = Post::whereRelation('comments', 'is_approved', false)->get();
```

当然，与对查询构造器 `where` 方法的调用一样，你也可以指定运算符：

```php
$posts = Post::whereRelation(
    'comments', 'created_at', '>=', now()->minus(hours: 1)
)->get();
```

### 查询关系不存在性

检索模型记录时，你可能希望根据关系的不存在来限制结果。例如，假设你想检索**没有任何**评论的所有博客文章。为此，可以将关系名称传递给 `doesntHave` 和 `orDoesntHave` 方法：

```php
use App\Models\Post;

$posts = Post::doesntHave('comments')->get();
```

如果你需要更强大的功能，可以使用 `whereDoesntHave` 和 `orWhereDoesntHave` 方法为 `doesntHave` 查询添加其他查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();
```

你可以使用「点」表示法对嵌套关系执行查询。例如，以下查询将检索所有没有评论的文章，以及所有有评论但没有任何评论来自被封禁用户的文章：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments.author', function (Builder $query) {
    $query->where('banned', 1);
})->get();
```

### 查询 Morph To 关系

要查询「morph to」关系的存在性，可以使用 `whereHasMorph` 和 `whereDoesntHaveMorph` 方法。这些方法接受关系名称作为其第一个参数。接下来，这些方法接受你要包含在查询中的相关模型的名称。最后，你可以提供一个闭包来自定义关系查询：

```php
use App\Models\Comment;
use App\Models\Post;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;

// Retrieve comments associated to posts or videos with a title like code%...
$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();

// Retrieve comments associated to posts with a title not like code%...
$comments = Comment::whereDoesntHaveMorph(
    'commentable',
    Post::class,
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();
```

你可能偶尔需要根据相关多态模型的「type」添加查询约束。传递给 `whereHasMorph` 方法的闭包可以接收 `$type` 值作为其第二个参数。此参数允许你检查正在构建的查询的「type」：

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

有时你可能希望查询「morph to」关系父级的子级。你可以使用 `whereMorphedTo` 和 `whereNotMorphedTo` 方法来完成此操作，这些方法将自动确定给定模型的适当 morph type 映射。这些方法接受 `morphTo` 关系的名称作为其第一个参数，并将相关父模型作为其第二个参数：

```php
$comments = Comment::whereMorphedTo('commentable', $post)
    ->orWhereMorphedTo('commentable', $video)
    ->get();
```

#### 查询所有相关模型

你可以提供 `*` 作为通配符值，而不是传递可能的多态模型数组。这将指示 Laravel 从数据库中检索所有可能的多态类型。Laravel 将执行额外的查询以执行此操作：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph('commentable', '*', function (Builder $query) {
    $query->where('title', 'like', 'foo%');
})->get();
```

## 聚合相关模型

### 统计相关模型

有时你可能希望统计给定关系的相关模型的数量，而不实际加载这些模型。为此，可以使用 `withCount` 方法。`withCount` 方法将在结果模型上放置一个 `{relation}_count` 属性：

```php
use App\Models\Post;

$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count;
}
```

通过将数组传递给 `withCount` 方法，你可以添加多个关系的「计数」，以及为查询添加其他约束：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount(['votes', 'comments' => function (Builder $query) {
    $query->where('content', 'like', 'code%');
}])->get();

echo $posts[0]->votes_count;
echo $posts[0]->comments_count;
```

你还可以为关系计数结果设置别名，从而允许对同一关系进行多次计数：

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

#### 延迟计数加载

使用 `loadCount` 方法，你可以在检索父模型后加载关系计数：

```php
$book = Book::first();

$book->loadCount('genres');
```

如果需要在计数查询上设置其他查询约束，可以传递以你要统计的关系为键的数组。数组值应该是接收查询构造器实例的闭包：

```php
$book->loadCount(['reviews' => function (Builder $query) {
    $query->where('rating', 5);
}])
```

#### 关系计数和自定义 Select 语句

如果你将 `withCount` 与 `select` 语句结合使用，请确保在 `select` 方法之后调用 `withCount`：

```php
$posts = Post::select(['title', 'body'])
    ->withCount('comments')
    ->get();
```

### 其他聚合函数

除了 `withCount` 方法外，Eloquent 还提供了 `withMin`、`withMax`、`withAvg`、`withSum` 和 `withExists` 方法。这些方法将在结果模型上放置一个 `{relation}_{function}_{column}` 属性：

```php
use App\Models\Post;

$posts = Post::withSum('comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->comments_sum_votes;
}
```

如果希望使用其他名称访问聚合函数的结果，可以指定自己的别名：

```php
$posts = Post::withSum('comments as total_comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->total_comments;
}
```

与 `loadCount` 方法类似，这些方法的延迟版本也可用。这些附加的聚合操作可以在已检索的 Eloquent 模型上执行：

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

### 在 Morph To 关系上统计相关模型

如果你希望预加载「morph to」关系，以及该关系可能返回的各种实体的相关模型计数，则可以将 `with` 方法与 `morphTo` 关系的 `morphWithCount` 方法结合使用。

在本例中，让我们假设 `Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。我们将假设 `ActivityFeed` 模型定义了一个名为 `parentable` 的「morph to」关系，该关系允许我们检索给定 `ActivityFeed` 实例的父级 `Photo` 或 `Post` 模型。此外，让我们假设 `Photo` 模型「has many」`Tag` 模型，而 `Post` 模型「has many」`Comment` 模型。

现在，让我们想象我们想要检索 `ActivityFeed` 实例并为每个 `ActivityFeed` 实例预加载 `parentable` 父模型。此外，我们希望检索与每个父照片关联的标签数量，以及与每个父文章关联的评论数量：

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

#### 延迟计数加载

假设我们已经检索了一组 `ActivityFeed` 模型，现在我们希望为与活动 Feed 关联的各种 `parentable` 模型加载嵌套关系计数。你可以使用 `loadMorphCount` 方法来完成此操作：

```php
$activities = ActivityFeed::with('parentable')->get();

$activities->loadMorphCount('parentable', [
    Photo::class => ['tags'],
    Post::class => ['comments'],
]);
```

## 预加载

当作为属性访问 Eloquent 关联关系时，相关模型是「懒加载」的。这意味着在你首次访问该属性之前，实际上并未加载关系数据。但是，Eloquent 可以在查询父模型时「预加载」关系。预加载缓解了「N + 1」查询问题。为了说明 N + 1 查询问题，考虑一个 `Book` 模型「属于」一个 `Author` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * Get the author that wrote the book.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }
}
```

现在，让我们检索所有书籍及其作者：

```php
use App\Models\Book;

$books = Book::all();

foreach ($books as $book) {
    echo $book->author->name;
}
```

此循环将执行一个查询以检索数据库表中的所有书籍，然后为每本书执行另一个查询以检索该书的作者。因此，如果我们有 25 本书，上面的代码将运行 26 个查询：一个用于原始书籍，25 个额外的查询用于检索每本书的作者。

值得庆幸的是，我们可以使用预加载将此操作减少为仅两个查询。在构建查询时，你可以使用 `with` 方法指定应预加载哪些关系：

```php
$books = Book::with('author')->get();

foreach ($books as $book) {
    echo $book->author->name;
}
```

对于此操作，将仅执行两个查询 - 一个查询用于检索所有书籍，一个查询用于检索所有书籍的所有作者：

```sql
select * from books

select * from authors where id in (1, 2, 3, 4, 5, ...)
```

#### 预加载多个关系

有时你可能需要预加载多个不同的关系。为此，只需将关系数组传递给 `with` 方法：

```php
$books = Book::with(['author', 'publisher'])->get();
```

#### 嵌套预加载

要预加载关系的关系，你可以使用「点」语法。例如，让我们预加载所有书籍的作者以及作者的所有个人联系人：

```php
$books = Book::with('author.contacts')->get();
```

或者，你可以通过向 `with` 方法提供嵌套数组来指定嵌套预加载关系，这在预加载多个嵌套关系时很方便：

```php
$books = Book::with([
    'author' => [
        'contacts',
        'publisher',
    ],
])->get();
```

#### 嵌套预加载 `morphTo` 关系

如果你希望预加载 `morphTo` 关系，以及该关系可能返回的各种实体上的嵌套关系，则可以将 `with` 方法与 `morphTo` 关系的 `morphWith` 方法结合使用。为了帮助说明此方法，让我们考虑以下模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * Get the parent of the activity feed record.
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在本例中，让我们假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，让我们假设 `Event` 模型属于一个 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，而 `Post` 模型属于一个 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并预加载所有 `parentable` 模型及其各自的嵌套关系：

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

#### 预加载特定列

你可能并不总是需要从正在检索的关系中获得每一列。因此，Eloquent 允许你指定要检索的关系的哪些列：

```php
$books = Book::with('author:id,name,book_id')->get();
```

> [!WARNING]
> 使用此功能时，应始终在要检索的列列表中包含 `id` 列和任何相关的外键列。

#### 默认预加载

有时你可能希望在检索模型时始终加载某些关系。为此，你可以在模型上定义 `$with` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = ['author'];

    /**
     * Get the author that wrote the book.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * Get the genre of the book.
     */
    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }
}
```

如果希望从单个查询的 `$with` 属性中删除某个项，可以使用 `without` 方法：

```php
$books = Book::without('author')->get();
```

如果希望覆盖单个查询中 `$with` 属性内的所有项，可以使用 `withOnly` 方法：

```php
$books = Book::withOnly('genre')->get();
```

### 约束预加载

有时你可能希望预加载关系，但还希望为预加载查询指定其他查询条件。你可以通过将关系数组传递给 `with` 方法来实现这一点，其中数组键是关系名称，数组值是向预加载查询添加其他约束的闭包：

```php
use App\Models\User;

$users = User::with(['posts' => function ($query) {
    $query->where('title', 'like', '%code%');
}])->get();
```

在此示例中，Eloquent 将仅预加载帖子的 `title` 列包含单词 `code` 的帖子。你可以调用其他 [查询构造器](/docs/{{version}}/queries) 方法以进一步自定义预加载操作：

```php
$users = User::with(['posts' => function ($query) {
    $query->orderBy('created_at', 'desc');
}])->get();
```

#### 约束 `morphTo` 关系的预加载

如果正在预加载 `morphTo` 关系，Eloquent 将运行多个查询来获取每种类型的相关模型。你可以使用 `MorphTo` 关系的 `constrain` 方法向每个查询添加其他约束：

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

在此示例中，Eloquent 将仅预加载未隐藏的文章以及 `type` 值为「educational」的视频。

#### 通过关系存在性约束预加载

有时你可能会发现自己需要检查关系的存在性，同时根据相同条件加载关系。例如，你可能希望仅检索具有与给定查询条件匹配的子 `Post` 模型的 `User` 模型，同时预加载匹配的帖子。你可以使用 `withWhereHas` 方法来完成此操作：

```php
use App\Models\User;

$users = User::withWhereHas('posts', function ($query) {
    $query->where('featured', true);
})->get();
```

### 延迟预加载

有时你可能需要在已经检索父模型之后预加载关系。例如，如果你需要动态决定是否加载相关模型，这可能会很有用：

```php
use App\Models\Book;

$books = Book::all();

if ($condition) {
    $books->load('author', 'publisher');
}
```

如果需要在预加载查询上设置其他查询约束，可以传递以你要加载的关系为键的数组。数组值应该是接收查询实例的闭包实例：

```php
$author->load(['books' => function ($query) {
    $query->orderBy('published_date', 'asc');
}]);
```

仅当尚未加载关系时才加载它，请使用 `loadMissing` 方法：

```php
$book->loadMissing('author');
```

#### 嵌套延迟预加载和 `morphTo`

如果你希望预加载 `morphTo` 关系，以及该关系可能返回的各种实体上的嵌套关系，则可以使用 `loadMorph` 方法。

此方法接受 `morphTo` 关系的名称作为其第一个参数，并将模型/关系对数组作为其第二个参数。为了帮助说明此方法，让我们考虑以下模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * Get the parent of the activity feed record.
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在本例中，让我们假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。此外，让我们假设 `Event` 模型属于一个 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，而 `Post` 模型属于一个 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并预加载所有 `parentable` 模型及其各自的嵌套关系：

```php
$activities = ActivityFeed::with('parentable')
    ->get()
    ->loadMorph('parentable', [
        Event::class => ['calendar'],
        Photo::class => ['tags'],
        Post::class => ['author'],
    ]);
```

### 自动预加载

在许多情况下，Laravel 可以自动预加载你访问的关系。要启用自动预加载，你应该在应用的 `AppServiceProvider` 的 `boot` 方法中调用 `Model::automaticallyEagerLoadRelationships` 方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Model::automaticallyEagerLoadRelationships();
}
```

启用此功能后，Laravel 将尝试自动加载你访问的、之前未加载的任何关系。例如，考虑以下场景：

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

通常，上面的代码将对每个用户执行一个查询以检索他们的帖子，以及对每个帖子执行一个查询以检索其评论。但是，当启用了 `automaticallyEagerLoadRelationships` 功能时，当你尝试访问任何已检索用户上的帖子时，Laravel 将自动 [延迟预加载](#lazy-eager-loading) 用户集合中所有用户的帖子。同样，当你尝试访问任何已检索帖子的评论时，将为最初检索的所有帖子延迟预加载所有评论。

如果你不想全局启用自动预加载，仍然可以通过在集合上调用 `withRelationshipAutoloading` 方法来为单个 Eloquent 集合实例启用此功能：

```php
$users = User::where('vip', true)->get();

return $users->withRelationshipAutoloading();
```

### 防止懒加载

如前所述，预加载关系通常可以为你的应用提供显著的性能优势。因此，如果你愿意，可以允许 Laravel 始终防止懒加载关系。为此，你可以调用由基础 Eloquent 模型类提供的 `preventLazyLoading` 方法。通常，你应该在应用的 `AppServiceProvider` 类的 `boot` 方法中调用此方法。

`preventLazyLoading` 方法接受一个可选的布尔参数，该参数指示是否应防止懒加载。例如，你可能希望仅在非生产环境中禁用懒加载，以便即使生产代码中意外出现懒加载关系，你的生产环境也将继续正常运行：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

防止懒加载后，当你的应用尝试懒加载任何 Eloquent 关系时，Eloquent 将抛出 `Illuminate\Database\LazyLoadingViolationException` 异常。

你可以使用 `handleLazyLoadingViolationsUsing` 方法自定义懒加载违规的行为。例如，使用此方法，你可以允许懒加载违规仅被记录而不是通过异常中断应用的执行：

```php
Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
    $class = $model::class;

    info("Attempted to lazy load [{$relation}] on model [{$class}].");
});
```

## 插入和更新关联模型

### `save` 方法

Eloquent 提供了用于向关联关系添加新模型的便捷方法。例如，你可能需要向文章添加新评论。而不是手动设置 `Comment` 模型上的 `post_id` 属性，你可以使用关系的 `save` 方法插入评论：

```php
use App\Models\Comment;
use App\Models\Post;

$comment = new Comment(['message' => 'A new comment.']);

$post = Post::find(1);

$post->comments()->save($comment);
```

请注意，我们没有将 `comments` 关系作为动态属性访问。相反，我们调用 `comments` 方法以获取关系的实例。`save` 方法将自动将适当的 `post_id` 值添加到新的 `Comment` 模型。

如果需要保存多个相关模型，可以使用 `saveMany` 方法：

```php
$post = Post::find(1);

$post->comments()->saveMany([
    new Comment(['message' => 'A new comment.']),
    new Comment(['message' => 'Another new comment.']),
]);
```

`save` 和 `saveMany` 方法将持久化给定的模型实例，但不会将新持久化的模型添加到已经加载到父模型上的任何内存中关系。如果你打算在使用 `save` 或 `saveMany` 方法后访问关系，则可能需要使用 `refresh` 方法重新加载模型及其关系：

```php
$post->comments()->save($comment);

$post->refresh();

// All comments, including the newly saved comment...
$post->comments;
```

#### 递归保存模型和关系

如果你希望 `save` 模型及其所有关联关系，可以使用 `push` 方法。在此示例中，`Post` 模型及其评论以及评论的作者都将被保存：

```php
$post = Post::find(1);

$post->comments[0]->message = 'Message';
$post->comments[0]->author->name = 'Author Name';

$post->push();
```

`pushQuietly` 方法可用于保存模型及其关联关系而不引发任何事件：

```php
$post->pushQuietly();
```

### `create` 方法

除了 `save` 和 `saveMany` 方法外，你还可以使用 `create` 方法，该方法接受属性数组，创建模型并将其插入数据库。`save` 和 `create` 之间的区别在于 `save` 接受完整的 Eloquent 模型实例，而 `create` 接受普通的 PHP `array`。新创建的模型将由 `create` 方法返回：

```php
use App\Models\Post;

$post = Post::find(1);

$comment = $post->comments()->create([
    'message' => 'A new comment.',
]);
```

你可以使用 `createMany` 方法创建多个相关模型：

```php
$post = Post::find(1);

$post->comments()->createMany([
    ['message' => 'A new comment.'],
    ['message' => 'Another new comment.'],
]);
```

`createQuietly` 和 `createManyQuietly` 方法可用于在不派发任何事件的情况下创建模型：

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

你还可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法来 [在关联关系上创建和更新模型](/docs/{{version}}/eloquent#upserts)。

> [!NOTE]
> 在使用 `create` 方法之前，请务必查看 [批量赋值](/docs/{{version}}/eloquent#mass-assignment) 文档。

### Belongs To 关系

如果希望将子模型分配给新的父模型，可以使用 `associate` 方法。在此示例中，`User` 模型定义了对 `Account` 模型的 `belongsTo` 关系。此 `associate` 方法将在子模型上设置外键：

```php
use App\Models\Account;

$account = Account::find(10);

$user->account()->associate($account);

$user->save();
```

要从子模型中删除父模型，可以使用 `dissociate` 方法。此方法将关系的外键设置为 `null`：

```php
$user->account()->dissociate();

$user->save();
```

### 多对多关系

#### 附加 / 分离

Eloquent 还提供了使处理多对多关系更便捷的方法。例如，让我们想象一个用户可以拥有多个角色，一个角色可以拥有多个用户。你可以使用 `attach` 方法通过在关系的中间表中插入一条记录来将角色附加到用户：

```php
use App\Models\User;

$user = User::find(1);

$user->roles()->attach($roleId);
```

将关系附加到模型时，你还可以传递要插入到中间表中的其他数据的数组：

```php
$user->roles()->attach($roleId, ['expires' => $expires]);
```

有时可能需要从用户中删除角色。要删除多对多关系记录，请使用 `detach` 方法。`detach` 方法将从中间表中删除适当的记录；但是，两个模型都将保留在数据库中：

```php
// Detach a single role from the user...
$user->roles()->detach($roleId);

// Detach all roles from the user...
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

#### 同步关联

你还可以使用 `sync` 方法构造多对多关联。`sync` 方法接受要放置在中间表上的 ID 数组。任何不在给定数组中的 ID 都将从中间表中删除。因此，在完成此操作后，仅给定数组中的 ID 将存在于中间表中：

```php
$user->roles()->sync([1, 2, 3]);
```

你还可以传递带有 ID 的其他中间表值：

```php
$user->roles()->sync([1 => ['expires' => true], 2, 3]);
```

如果希望为每个同步的模型 ID 插入相同的中间表值，可以使用 `syncWithPivotValues` 方法：

```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['active' => true]);
```

如果你不想分离给定数组中缺少的现有 ID，可以使用 `syncWithoutDetaching` 方法：

```php
$user->roles()->syncWithoutDetaching([1, 2, 3]);
```

#### 切换关联

多对多关系还提供了一个 `toggle` 方法，该方法「切换」给定相关模型 ID 的附加状态。如果给定 ID 当前已附加，则它将被分离。同样，如果它当前已分离，则它将被附加：

```php
$user->roles()->toggle([1, 2, 3]);
```

你还可以传递带有 ID 的其他中间表值：

```php
$user->roles()->toggle([
    1 => ['expires' => true],
    2 => ['expires' => true],
]);
```

#### 事务性 Pivot 操作

上面讨论的每个 pivot 操作都有一个 `OrFail` 变体（`attachOrFail`、`detachOrFail`、`syncOrFail`、`syncWithoutDetachingOrFail` 和 `toggleOrFail`），它将操作包装在数据库事务中，以便在抛出异常时自动回滚所有更改：

```php
$user->roles()->attachOrFail([1, 2, 3]);

$user->roles()->syncOrFail([1, 2, 3]);
```

#### 更新中间表上的记录

如果需要更新关系的中间表中的现有行，可以使用 `updateExistingPivot` 方法。此方法接受中间记录外键和要更新的属性数组：

```php
$user = User::find(1);

$user->roles()->updateExistingPivot($roleId, [
    'active' => false,
]);
```

## Touch 父级时间戳

当模型定义了对另一个模型的 `belongsTo` 或 `belongsToMany` 关系时，例如属于 `Post` 的 `Comment`，有时在更新子模型时更新父级的时间戳会很有帮助。

例如，当 `Comment` 模型更新时，你可能希望自动「touch」拥有它的 `Post` 的 `updated_at` 时间戳，以便将其设置为当前日期和时间。为此，你可以在子模型上使用 `Touches` 属性，其中包含当子模型更新时应更新其 `updated_at` 时间戳的关系的名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Touches;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Touches(['post'])]
class Comment extends Model
{
    /**
     * Get the post that the comment belongs to.
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

> [!WARNING]
> 仅当使用 Eloquent 的 `save` 方法更新子模型时，父模型的时间戳才会更新。