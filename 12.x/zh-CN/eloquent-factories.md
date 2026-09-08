# Eloquent：模型工厂

- [简介](#introduction)
- [定义模型工厂](#defining-model-factories)
    - [生成工厂](#generating-factories)
    - [工厂状态](#factory-states)
    - [工厂回调](#factory-callbacks)
- [使用工厂创建模型](#creating-models-using-factories)
    - [实例化模型](#instantiating-models)
    - [持久化模型](#persisting-models)
    - [序列](#sequences)
- [工厂关联](#factory-relationships)
    - [一对多关联](#has-many-relationships)
    - [多对一关联](#belongs-to-relationships)
    - [多对多关联](#many-to-many-relationships)
    - [多态关联](#polymorphic-relationships)
    - [在工厂内部定义关联](#defining-relationships-within-factories)
    - [为关联复用已有模型](#recycling-an-existing-model-for-relationships)

<a name="introduction"></a>
## 简介

在测试应用或填充数据库时，你可能需要向数据库插入一些记录。Laravel 允许你使用模型工厂为每个 [Eloquent 模型](/docs/{{version}}/eloquent) 定义一组默认属性，而无需手动指定每一列的值。

要了解如何编写工厂，可以查看应用中的 `database/factories/UserFactory.php` 文件。所有新的 Laravel 应用都自带这个工厂，其中包含如下工厂定义：

```php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * 工厂当前使用的密码。
     */
    protected static ?string $password;

    /**
     * 定义模型的默认状态。
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * 指示模型的邮箱地址应为未验证状态。
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

如你所见，工厂最基本的形式就是继承 Laravel 基础工厂类并定义一个 `definition` 方法的类。`definition` 方法返回使用工厂创建模型时应应用的默认属性值集合。

通过 `fake` 辅助函数，工厂可以使用 [Faker](https://github.com/FakerPHP/Faker) PHP 库，从而方便地为测试和数据填充生成各种随机数据。

> [!NOTE]
> 你可以通过更新 `config/app.php` 配置文件中的 `faker_locale` 选项来修改应用的 Faker 语言环境。

<a name="defining-model-factories"></a>
## 定义模型工厂

<a name="generating-factories"></a>
### 生成工厂

要创建工厂，请执行 `make:factory` [Artisan 命令](/docs/{{version}}/artisan)：

```shell
php artisan make:factory PostFactory
```

新的工厂类将被放置在 `database/factories` 目录中。

<a name="factory-and-model-discovery-conventions"></a>
#### 模型与工厂的发现约定

定义好工厂后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供给模型的静态 `factory` 方法，为该模型实例化一个工厂实例。

`HasFactory` trait 的 `factory` 方法会依据约定来确定该 trait 所应用模型对应的工厂。具体来说，该方法会在 `Database\Factories` 命名空间中查找类名与模型名匹配、并以 `Factory` 为后缀的工厂。如果这些约定不适用于你的应用或工厂，你可以在模型上添加 `UseFactory` 属性，手动指定该模型的工厂：

```php
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Database\Factories\Administration\FlightFactory;

#[UseFactory(FlightFactory::class)]
class Flight extends Model
{
    // ...
}
```

或者，你也可以重写模型上的 `newFactory` 方法，直接返回模型对应工厂的实例：

```php
use Database\Factories\Administration\FlightFactory;

/**
 * 为模型创建新的工厂实例。
 */
protected static function newFactory()
{
    return FlightFactory::new();
}
```

然后，在对应的工厂上定义 `model` 属性：

```php
use App\Administration\Flight;
use Illuminate\Database\Eloquent\Factories\Factory;

class FlightFactory extends Factory
{
    /**
     * 工厂对应的模型名称。
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Flight::class;
}
```

<a name="factory-states"></a>
### 工厂状态

状态操作方法允许你定义离散的修改，并以任意组合应用到模型工厂上。例如，你的 `Database\Factories\UserFactory` 工厂可能包含一个 `suspended` 状态方法，用于修改某个默认属性值。

状态转换方法通常会调用 Laravel 基础工厂类提供的 `state` 方法。`state` 方法接受一个闭包，该闭包会接收为工厂定义的原始属性数组，并应返回需要修改的属性数组：

```php
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被停用。
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    });
}
```

<a name="trashed-state"></a>
#### "Trashed" 状态

如果你的 Eloquent 模型支持[软删除](/docs/{{version}}/eloquent#soft-deleting)，可以调用内置的 `trashed` 状态方法，指示所创建的模型应处于已被"软删除"的状态。你无需手动定义 `trashed` 状态，因为所有工厂都可以自动使用它：

```php
use App\Models\User;

$user = User::factory()->trashed()->create();
```

<a name="factory-callbacks"></a>
### 工厂回调

工厂回调通过 `afterMaking` 和 `afterCreating` 方法注册，允许你在 make 或 create 模型之后执行额外任务。你应当在工厂类上定义 `configure` 方法来注册这些回调。当工厂实例化时，Laravel 会自动调用该方法：

```php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    /**
     * 配置模型工厂。
     */
    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            // ...
        })->afterCreating(function (User $user) {
            // ...
        });
    }

    // ...
}
```

你也可以在状态方法内注册工厂回调，以执行特定于某个状态的额外任务：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被停用。
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    })->afterMaking(function (User $user) {
        // ...
    })->afterCreating(function (User $user) {
        // ...
    });
}
```

<a name="creating-models-using-factories"></a>
## 使用工厂创建模型

<a name="instantiating-models"></a>
### 实例化模型

定义好工厂后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供给模型的静态 `factory` 方法，为该模型实例化一个工厂实例。下面来看几个创建模型的例子。首先，我们使用 `make` 方法创建模型，但不将其持久化到数据库：

```php
use App\Models\User;

$user = User::factory()->make();
```

你可以使用 `count` 方法创建包含多个模型的集合：

```php
$users = User::factory()->count(3)->make();
```

<a name="applying-states"></a>
#### 应用状态

你也可以将任意[状态](#factory-states)应用到模型上。如果想对模型应用多个状态转换，直接调用这些状态转换方法即可：

```php
$users = User::factory()->count(5)->suspended()->make();
```

<a name="overriding-attributes"></a>
#### 覆盖属性

如果你想覆盖模型的某些默认值，可以向 `make` 方法传递一个值数组。只有指定的属性会被替换，其余属性仍保持工厂定义的默认值：

```php
$user = User::factory()->make([
    'name' => 'Abigail Otwell',
]);
```

此外，也可以直接在工厂实例上调用 `state` 方法来执行内联的状态转换：

```php
$user = User::factory()->state([
    'name' => 'Abigail Otwell',
])->make();
```

> [!NOTE]
> 使用工厂创建模型时，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="persisting-models"></a>
### 持久化模型

`create` 方法会实例化模型实例，并使用 Eloquent 的 `save` 方法将其持久化到数据库：

```php
use App\Models\User;

// 创建单个 App\Models\User 实例...
$user = User::factory()->create();

// 创建三个 App\Models\User 实例...
$users = User::factory()->count(3)->create();
```

你可以向 `create` 方法传递一个属性数组，以覆盖工厂的默认模型属性：

```php
$user = User::factory()->create([
    'name' => 'Abigail',
]);
```

<a name="sequences"></a>
### 序列

有时你可能希望让某个模型属性的值在每次创建的模型之间交替变化。你可以通过将状态转换定义为序列来实现。例如，你可能希望每个创建的用户的 `admin` 列值在 `Y` 和 `N` 之间交替：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        ['admin' => 'Y'],
        ['admin' => 'N'],
    ))
    ->create();
```

在这个例子中，将创建五个 `admin` 值为 `Y` 的用户和五个 `admin` 值为 `N` 的用户。

如有需要，你可以将闭包作为序列值。每当序列需要新值时，都会调用该闭包：

```php
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['role' => UserRoles::all()->random()],
    ))
    ->create();
```

在序列闭包中，你可以访问注入闭包的序列实例上的 `$index` 属性。`$index` 属性包含该序列到目前为止已经历的迭代次数：

```php
$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['name' => 'Name '.$sequence->index],
    ))
    ->create();
```

为方便起见，序列也可以通过 `sequence` 方法来应用，该方法内部只是调用了 `state` 方法。`sequence` 方法接受一个闭包或多个按序排列的属性数组：

```php
$users = User::factory()
    ->count(2)
    ->sequence(
        ['name' => 'First User'],
        ['name' => 'Second User'],
    )
    ->create();
```

<a name="factory-relationships"></a>
## 工厂关联

<a name="has-many-relationships"></a>
### 一对多关联

接下来，让我们探索如何使用 Laravel 的流式工厂方法构建 Eloquent 模型关联。首先，假设我们的应用有一个 `App\Models\User` 模型和一个 `App\Models\Post` 模型，并且 `User` 模型定义了与 `Post` 的 `hasMany` 关联。我们可以使用 Laravel 工厂提供的 `has` 方法创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

```php
use App\Models\Post;
use App\Models\User;

$user = User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```

按照约定，当向 `has` 方法传递 `Post` 模型时，Laravel 会假定 `User` 模型必须有一个定义该关联的 `posts` 方法。如有需要，你也可以显式指定想要操作的关联名称：

```php
$user = User::factory()
    ->has(Post::factory()->count(3), 'posts')
    ->create();
```

当然，你也可以对关联模型执行状态操作。此外，如果状态修改需要访问父模型，可以传递基于闭包的状态转换：

```php
$user = User::factory()
    ->has(
        Post::factory()
            ->count(3)
            ->state(function (array $attributes, User $user) {
                return ['user_type' => $user->type];
            })
    )
    ->create();
```

<a name="has-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来构建关联。例如，下面的例子会依据约定，判定应通过 `User` 模型上的 `posts` 关联方法来创建关联模型：

```php
$user = User::factory()
    ->hasPosts(3)
    ->create();
```

使用魔术方法创建工厂关联时，你可以传递一个属性数组来覆盖关联模型上的属性：

```php
$user = User::factory()
    ->hasPosts(3, [
        'published' => false,
    ])
    ->create();
```

如果状态修改需要访问父模型，可以提供基于闭包的状态转换：

```php
$user = User::factory()
    ->hasPosts(3, function (array $attributes, User $user) {
        return ['user_type' => $user->type];
    })
    ->create();
```

<a name="belongs-to-relationships"></a>
### 多对一关联

我们已经探索了如何使用工厂构建"一对多"关联，接下来看看关联的反向情形。`for` 方法可用于定义工厂所创建模型所属的父模型。例如，我们可以创建三个属于同一个用户的 `App\Models\Post` 模型实例：

```php
use App\Models\Post;
use App\Models\User;

$posts = Post::factory()
    ->count(3)
    ->for(User::factory()->state([
        'name' => 'Jessica Archer',
    ]))
    ->create();
```

如果你已经有一个应与所创建模型相关联的父模型实例，可以将该模型实例传递给 `for` 方法：

```php
$user = User::factory()->create();

$posts = Post::factory()
    ->count(3)
    ->for($user)
    ->create();
```

<a name="belongs-to-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义"多对一"关联。例如，下面的例子会依据约定，判定这三篇文章应属于 `Post` 模型上的 `user` 关联：

```php
$posts = Post::factory()
    ->count(3)
    ->forUser([
        'name' => 'Jessica Archer',
    ])
    ->create();
```

<a name="many-to-many-relationships"></a>
### 多对多关联

与[一对多关联](#has-many-relationships)类似，"多对多"关联也可以使用 `has` 方法来创建：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->has(Role::factory()->count(3))
    ->create();
```

<a name="pivot-table-attributes"></a>
#### 中间表属性

如果需要定义应设置在连接两个模型的中间表（pivot 表）上的属性，可以使用 `hasAttached` 方法。该方法的第二个参数接受一个由中间表属性名和值组成的数组：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        ['active' => true]
    )
    ->create();
```

如果状态修改需要访问关联模型，可以提供基于闭包的状态转换：

```php
$user = User::factory()
    ->hasAttached(
        Role::factory()
            ->count(3)
            ->state(function (array $attributes, User $user) {
                return ['name' => $user->name.' Role'];
            }),
        ['active' => true]
    )
    ->create();
```

如果你已经有一些想附加到所创建模型上的模型实例，可以将这些模型实例传递给 `hasAttached` 方法。在这个例子中，同样的三个角色将被附加到全部三个用户上：

```php
$roles = Role::factory()->count(3)->create();

$users = User::factory()
    ->count(3)
    ->hasAttached($roles, ['active' => true])
    ->create();
```

<a name="many-to-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义多对多关联。例如，下面的例子会依据约定，判定应通过 `User` 模型上的 `roles` 关联方法来创建关联模型：

```php
$user = User::factory()
    ->hasRoles(1, [
        'name' => 'Editor'
    ])
    ->create();
```

<a name="polymorphic-relationships"></a>
### 多态关联

[多态关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)同样可以使用工厂来创建。多态 "morph many" 关联的创建方式与典型的"一对多"关联相同。例如，假设 `App\Models\Post` 模型与 `App\Models\Comment` 模型之间存在 `morphMany` 关联：

```php
use App\Models\Post;

$post = Post::factory()->hasComments(3)->create();
```

<a name="morph-to-relationships"></a>
#### Morph To 关联

魔术方法不能用于创建 `morphTo` 关联。此时必须直接使用 `for` 方法，并显式提供关联名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关联的 `commentable` 方法。这种情况下，我们可以直接使用 `for` 方法创建三条属于同一篇文章的评论：

```php
$comments = Comment::factory()->count(3)->for(
    Post::factory(), 'commentable'
)->create();
```

<a name="polymorphic-many-to-many-relationships"></a>
#### 多对多多态关联

多态"多对多"（`morphToMany` / `morphedByMany`）关联的创建方式与非多态"多对多"关联完全相同：

```php
use App\Models\Tag;
use App\Models\Video;

$video = Video::factory()
    ->hasAttached(
        Tag::factory()->count(3),
        ['public' => true]
    )
    ->create();
```

当然，魔术 `has` 方法同样可用于创建多态"多对多"关联：

```php
$video = Video::factory()
    ->hasTags(3, ['public' => true])
    ->create();
```

<a name="defining-relationships-within-factories"></a>
### 在工厂内部定义关联

要在模型工厂内部定义关联，通常的做法是将一个新的工厂实例赋值给关联的外键。这通常用于 `belongsTo` 和 `morphTo` 这类"反向"关联。例如，如果想在创建文章时同时创建一个新用户，可以这样写：

```php
use App\Models\User;

/**
 * 定义模型的默认状态。
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

如果关联的列依赖于定义它的工厂，你可以将一个闭包赋值给属性。该闭包会接收工厂已求值的属性数组：

```php
/**
 * 定义模型的默认状态。
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'user_type' => function (array $attributes) {
            return User::find($attributes['user_id'])->type;
        },
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

<a name="recycling-an-existing-model-for-relationships"></a>
### 为关联复用已有模型

如果多个模型与另一个模型存在共同的关联，你可以使用 `recycle` 方法，确保工厂创建的所有关联都复用同一个关联模型实例。

例如，假设你有 `Airline`、`Flight` 和 `Ticket` 三个模型，其中机票属于某家航空公司和某个航班，而航班也属于某家航空公司。创建机票时，你可能希望机票和航班对应的是同一家航空公司，这时就可以将一个航空公司实例传递给 `recycle` 方法：

```php
Ticket::factory()
    ->recycle(Airline::factory()->create())
    ->create();
```

如果多个模型都属于同一个用户或团队，你会发现 `recycle` 方法特别有用。

`recycle` 方法也接受一个现有模型的集合。当向 `recycle` 方法传递集合时，工厂在需要该类型的模型时会从集合中随机选择一个：

```php
Ticket::factory()
    ->recycle($airlines)
    ->create();
```
