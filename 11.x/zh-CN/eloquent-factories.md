# Eloquent：工厂

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
    - [Has Many 关联](#has-many-relationships)
    - [Belongs To 关联](#belongs-to-relationships)
    - [多对多关联](#many-to-many-relationships)
    - [多态关联](#polymorphic-relationships)
    - [在工厂中定义关联](#defining-relationships-within-factories)
    - [为关联复用已有模型](#recycling-an-existing-model-for-relationships)

<a name="introduction"></a>
## 简介

在测试应用或为数据库填充数据时，你可能需要向数据库插入几条记录。Laravel 允许你使用模型工厂为各个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性，而不必手动指定每一列的值。

想看一个工厂编写的示例，可以查看应用中的 `database/factories/UserFactory.php` 文件。所有新建的 Laravel 应用都包含这个工厂，其工厂定义如下：

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
     * 指示该模型的邮箱地址应处于未验证状态。
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

如你所见，工厂在最基本的形式下就是继承 Laravel 基础工厂类并定义 `definition` 方法的类。`definition` 方法返回一组默认属性值，在使用该工厂创建模型时会被应用。

借助 `fake` 辅助函数，工厂可以访问 [Faker](https://github.com/FakerPHP/Faker) PHP 库，从而方便地为测试和生成填充数据产生各种随机数据。

> [!NOTE]
> 你可以通过更新 `config/app.php` 配置文件中的 `faker_locale` 选项来更改应用的 Faker 区域设置。

<a name="defining-model-factories"></a>
## 定义模型工厂

<a name="generating-factories"></a>
### 生成工厂

要创建工厂，请执行 `make:factory` [Artisan 命令](/docs/{{version}}/artisan)：

```shell
php artisan make:factory PostFactory
```

新的工厂类会被放入 `database/factories` 目录。

<a name="factory-and-model-discovery-conventions"></a>
#### 模型与工厂的发现约定

定义好工厂之后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` Trait 为模型提供的静态 `factory` 方法，为该模型实例化一个工厂实例。

`HasFactory` Trait 的 `factory` 方法会按照约定确定该 Trait 所指模型对应的工厂。具体来说，该方法会在 `Database\Factories` 命名空间中查找类名与模型名一致且以 `Factory` 结尾的工厂。如果这些约定不适用于你的特定应用或工厂，可以在模型上重写 `newFactory` 方法，直接返回对应工厂的实例：

```php
use Database\Factories\Administration\FlightFactory;

/**
 * 为该模型创建一个新的工厂实例。
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
     * 该工厂对应的模型名称。
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Flight::class;
}
```

<a name="factory-states"></a>
### 工厂状态

状态操作方法允许你定义若干离散修改，并可以任意组合地应用到模型工厂上。例如，你的 `Database\Factories\UserFactory` 工厂可能包含一个 `suspended` 状态方法，用于修改它某个默认属性值。

状态转换方法通常会调用 Laravel 基础工厂类提供的 `state` 方法。`state` 方法接受一个闭包，该闭包会收到为该工厂定义的原始属性数组，并应当返回一个待修改的属性数组：

```php
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示该用户已被暂停。
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
#### "已软删除"状态

如果你的 Eloquent 模型支持[软删除](/docs/{{version}}/eloquent#soft-deleting)，可以调用内置的 `trashed` 状态方法，表示创建出的模型应当已被"软删除"。你无需手动定义 `trashed` 状态，因为所有工厂都自动具备该状态：

```php
use App\Models\User;

$user = User::factory()->trashed()->create();
```

<a name="factory-callbacks"></a>
### 工厂回调

工厂回调通过 `afterMaking` 和 `afterCreating` 方法注册，允许你在创建（make）或持久化（create）模型之后执行额外任务。你应当在工厂类上定义 `configure` 方法来注册这些回调。工厂实例化时，Laravel 会自动调用该方法：

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

你也可以在状态方法中注册工厂回调，以执行某个特定状态特有的额外任务：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示该用户已被暂停。
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

定义好工厂之后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` Trait 为模型提供的静态 `factory` 方法，为该模型实例化一个工厂实例。我们来看几个创建模型的示例。首先，我们用 `make` 方法创建模型但不持久化到数据库：

```php
use App\Models\User;

$user = User::factory()->make();
```

你可以使用 `count` 方法创建大量模型的集合：

```php
$users = User::factory()->count(3)->make();
```

<a name="applying-states"></a>
#### 应用状态

你也可以把自己的任意[状态](#factory-states)应用到模型上。如果你想对模型应用多个状态转换，只需直接调用相应的状态转换方法即可：

```php
$users = User::factory()->count(5)->suspended()->make();
```

<a name="overriding-attributes"></a>
#### 覆盖属性

如果你想覆盖模型的某些默认值，可以向 `make` 方法传入一个值数组。只有指定的属性会被替换，其余属性仍保持工厂中指定的默认值：

```php
$user = User::factory()->make([
    'name' => 'Abigail Otwell',
]);
```

或者，你也可以直接在工厂实例上调用 `state` 方法，执行内联的状态转换：

```php
$user = User::factory()->state([
    'name' => 'Abigail Otwell',
])->make();
```

> [!NOTE]
> 使用工厂创建模型时，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会被自动禁用。

<a name="persisting-models"></a>
### 持久化模型

`create` 方法会实例化模型实例，并通过 Eloquent 的 `save` 方法把它们持久化到数据库：

```php
use App\Models\User;

// 创建一个 App\Models\User 实例...
$user = User::factory()->create();

// 创建三个 App\Models\User 实例...
$users = User::factory()->count(3)->create();
```

你可以通过向 `create` 方法传入一个属性数组来覆盖工厂的默认模型属性：

```php
$user = User::factory()->create([
    'name' => 'Abigail',
]);
```

<a name="sequences"></a>
### 序列

有时你可能希望为每个创建的模型交替使用某个模型属性的不同值。你可以把状态转换定义为一个序列来实现这一点。例如，你可能希望每个新建用户的 `admin` 列值在 `Y` 与 `N` 之间交替：

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

在这个示例中，会创建五个 `admin` 值为 `Y` 的用户，以及五个 `admin` 值为 `N` 的用户。

如有需要，你可以把闭包作为序列值包含进来。每当序列需要新值时，都会调用该闭包：

```php
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['role' => UserRoles::all()->random()],
    ))
    ->create();
```

在序列闭包内部，你可以访问注入闭包的序列实例上的 `$index` 或 `$count` 属性。`$index` 属性包含到目前为止序列已迭代的次数，而 `$count` 属性包含序列将被调用的总次数：

```php
$users = User::factory()
    ->count(10)
    ->sequence(fn (Sequence $sequence) => ['name' => 'Name '.$sequence->index])
    ->create();
```

为方便起见，你也可以使用 `sequence` 方法来应用序列，该方法内部其实就是调用 `state` 方法。`sequence` 方法接受一个闭包或一组由序列组成的属性数组：

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
### Has Many 关联

接下来，我们来探索如何使用 Laravel 流畅的工厂方法构建 Eloquent 模型关联。首先，假设我们的应用有一个 `App\Models\User` 模型和一个 `App\Models\Post` 模型。同时假设 `User` 模型定义了与 `Post` 的 `hasMany` 关联。借助 Laravel 工厂提供的 `has` 方法，我们可以创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

```php
use App\Models\Post;
use App\Models\User;

$user = User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```

按照约定，当把 `Post` 模型传给 `has` 方法时，Laravel 会假定 `User` 模型必须有一个定义该关联的 `posts` 方法。如有必要，你可以显式指定想要操作的关联名称：

```php
$user = User::factory()
    ->has(Post::factory()->count(3), 'posts')
    ->create();
```

当然，你也可以对相关模型执行状态操作。此外，如果状态变更需要访问父模型，还可以传入基于闭包的状态转换：

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

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来构建关联。例如，下面的示例会按照约定确定应当通过 `User` 模型上的 `posts` 关联方法创建相关模型：

```php
$user = User::factory()
    ->hasPosts(3)
    ->create();
```

使用魔术方法创建工厂关联时，你可以传入一个属性数组来覆盖相关模型上的值：

```php
$user = User::factory()
    ->hasPosts(3, [
        'published' => false,
    ])
    ->create();
```

如果状态变更需要访问父模型，你可以提供基于闭包的状态转换：

```php
$user = User::factory()
    ->hasPosts(3, function (array $attributes, User $user) {
        return ['user_type' => $user->type];
    })
    ->create();
```

<a name="belongs-to-relationships"></a>
### Belongs To 关联

我们已经了解了如何使用工厂构建"has many"关联，下面来看它的反向关联。`for` 方法可用于定义工厂创建的模型所属的父模型。例如，我们可以创建三个都属于同一个用户的 `App\Models\Post` 模型实例：

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

如果你已经有一个应当与正在创建的模型关联的父模型实例，可以把该模型实例传给 `for` 方法：

```php
$user = User::factory()->create();

$posts = Post::factory()
    ->count(3)
    ->for($user)
    ->create();
```

<a name="belongs-to-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义"belongs to"关联。例如，下面的示例会按照约定确定这三篇文章应当属于 `Post` 模型上的 `user` 关联：

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

与 [has many 关联](#has-many-relationships)一样，"多对多"关联也可以使用 `has` 方法创建：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->has(Role::factory()->count(3))
    ->create();
```

<a name="pivot-table-attributes"></a>
#### 中间表属性

如果你需要定义应设置在连接这些模型的中间表上的属性，可以使用 `hasAttached` 方法。该方法的第二个参数接受一个由中间表属性名和值组成的数组：

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

如果状态变更需要访问相关模型，你可以提供基于闭包的状态转换：

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

如果你已经有一些希望附加到正在创建的模型上的模型实例，可以把这些模型实例传给 `hasAttached` 方法。在这个示例中，同样的三个角色会被附加到全部三个用户上：

```php
$roles = Role::factory()->count(3)->create();

$user = User::factory()
    ->count(3)
    ->hasAttached($roles, ['active' => true])
    ->create();
```

<a name="many-to-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义多对多关联。例如，下面的示例会按照约定确定应当通过 `User` 模型上的 `roles` 关联方法创建相关模型：

```php
$user = User::factory()
    ->hasRoles(1, [
        'name' => 'Editor'
    ])
    ->create();
```

<a name="polymorphic-relationships"></a>
### 多态关联

[多态关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)也可以使用工厂创建。多态的"morph many"关联与典型的"has many"关联创建方式相同。例如，如果 `App\Models\Post` 模型与 `App\Models\Comment` 模型存在 `morphMany` 关联：

```php
use App\Models\Post;

$post = Post::factory()->hasComments(3)->create();
```

<a name="morph-to-relationships"></a>
#### Morph To 关联

魔术方法不能用于创建 `morphTo` 关联。此时必须直接使用 `for` 方法，并显式提供关联名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关联的 `commentable` 方法。在这种情况下，我们可以直接使用 `for` 方法创建三个都属于同一篇文章的评论：

```php
$comments = Comment::factory()->count(3)->for(
    Post::factory(), 'commentable'
)->create();
```

<a name="polymorphic-many-to-many-relationships"></a>
#### 多态多对多关联

多态的"多对多"（`morphToMany` / `morphedByMany`）关联，其创建方式与非多态的"多对多"关联完全相同：

```php
use App\Models\Tag;
use App\Models\Video;

$videos = Video::factory()
    ->hasAttached(
        Tag::factory()->count(3),
        ['public' => true]
    )
    ->create();
```

当然，你也可以使用魔术 `has` 方法创建多态的"多对多"关联：

```php
$videos = Video::factory()
    ->hasTags(3, ['public' => true])
    ->create();
```

<a name="defining-relationships-within-factories"></a>
### 在工厂中定义关联

要在模型工厂中定义关联，通常需要把一个新的工厂实例赋给该关联的外键。这通常用于 `belongsTo` 和 `morphTo` 等"反向"关联。例如，如果你想在创建文章时顺便创建一个新用户，可以这样做：

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

如果该关联的列依赖于定义它的工厂，可以为属性赋一个闭包。该闭包会收到工厂求值后的属性数组：

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

如果你的模型与另一个模型共享某个共同的关联，可以使用 `recycle` 方法，确保工厂创建的所有关联都复用同一个相关模型实例。

举个例子，假设你有 `Airline`、`Flight` 和 `Ticket` 三个模型，其中机票属于某个航空公司和某个航班，而该航班又属于同一家航空公司。在创建机票时，你可能希望机票和航班使用同一个航空公司，因此可以把一个航空公司实例传给 `recycle` 方法：

```php
Ticket::factory()
    ->recycle(Airline::factory()->create())
    ->create();
```

如果你的模型都属于同一个用户或团队，`recycle` 方法会尤为好用。

`recycle` 方法也接受一组已有模型的集合。当向 `recycle` 方法提供集合时，工厂每次需要该类型的模型时，都会从集合中随机选择一个：

```php
Ticket::factory()
    ->recycle($airlines)
    ->create();
```