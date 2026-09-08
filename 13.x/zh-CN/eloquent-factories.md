# Eloquent：工厂

## 简介

在测试应用或填充数据库时，你可能需要向数据库中插入几条记录。Laravel 允许你使用模型工厂（model factories）为每个 [Eloquent 模型](/topic/Laravel%2013.x/rwyl2kxvz8.html) 定义一组默认属性，而不必手动指定每一列的值。

要查看如何编写工厂的示例，请查看应用中的 `database/factories/UserFactory.php` 文件。该工厂包含在所有新的 Laravel 应用中，并包含以下工厂定义：

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
     * 工厂当前正在使用的密码。
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
     * 指示模型的邮箱地址应处于未验证状态。
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

如你所见，在最基本的形式中，工厂是继承自 Laravel 基础工厂类、并定义了 `definition` 方法的类。`definition` 方法返回在使用工厂创建模型时应应用的默认属性值集合。

通过 `fake` 辅助函数，工厂可以访问 [Faker](https://github.com/FakerPHP/Faker) PHP 库，让你能方便地为测试和填充生成各种随机数据。

> [!NOTE]
> 你可以通过更新 `config/app.php` 配置文件中的 `faker_locale` 选项，来更改应用的 Faker 区域设置。

## 定义模型工厂

### 生成工厂

要创建一个工厂，请执行 `make:factory` [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html)：

```shell
php artisan make:factory PostFactory
```

新的工厂类会被放置在你的 `database/factories` 目录中。

#### 模型与工厂的发现约定

定义好工厂后，你可以使用由 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供给模型的静态 `factory` 方法，来实例化该模型的工厂实例。

`HasFactory` trait 的 `factory` 方法会使用约定来确定分配给该 trait 的模型所对应的正确工厂。具体来说，该方法会在 `Database\Factories` 命名空间中查找一个类名与模型名匹配、并以 `Factory` 为后缀的工厂。如果这些约定不适用于你的特定应用或工厂，你可以向模型添加 `UseFactory` 属性，手动指定模型的工厂：

```php
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Database\Factories\Administration\FlightFactory;

#[UseFactory(FlightFactory::class)]
class Flight extends Model
{
    // ...
}
```

或者，你可以重写模型上的 `newFactory` 方法，直接返回模型对应工厂的实例：

```php
use Database\Factories\Administration\FlightFactory;

/**
 * 为模型创建一个新的工厂实例。
 */
protected static function newFactory()
{
    return FlightFactory::new();
}
```

然后，在对应的工厂上使用 `UseModel` 属性来指定模型：

```php
use App\Administration\Flight;
use Illuminate\Database\Eloquent\Factories\Attributes\UseModel;
use Illuminate\Database\Eloquent\Factories\Factory;

#[UseModel(Flight::class)]
class FlightFactory extends Factory
{
    // ...
}
```

### 工厂状态

状态操作方法允许你定义可以被任意组合应用到模型工厂的离散修改。例如，你的 `Database\Factories\UserFactory` 工厂可能包含一个 `suspended` 状态方法，用于修改其某个默认属性值。

状态转换方法通常会调用 Laravel 基础工厂类提供的 `state` 方法。`state` 方法接收一个闭包，该闭包会接收为工厂定义的原始属性数组，并应返回要修改的属性数组：

```php
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被暂停。
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

#### "Trashed" 状态

如果你的 Eloquent 模型可以被 [软删除](/topic/Laravel%2013.x/rwyl2kxvz8.html)，你可以调用内置的 `trashed` 状态方法，指示创建的模型应已处于"软删除"状态。你无需手动定义 `trashed` 状态，因为它对所有工厂自动可用：

```php
use App\Models\User;

$user = User::factory()->trashed()->create();
```

### 工厂回调

工厂回调使用 `afterMaking` 和 `afterCreating` 方法进行注册，允许你在生成（make）或创建（create）模型后执行额外的任务。你应该通过在工厂类上定义一个 `configure` 方法来注册这些回调。当工厂被实例化时，Laravel 会自动调用该方法：

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

你也可以在状态方法中注册工厂回调，以执行特定于某个给定状态的额外任务：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被暂停。
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

## 使用工厂创建模型

### 实例化模型

定义好工厂后，你可以使用由 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 提供给模型的静态 `factory` 方法，来实例化该模型的工厂实例。我们来看几个创建模型的示例。首先，使用 `make` 方法创建模型，但不将其持久化到数据库：

```php
use App\Models\User;

$user = User::factory()->make();
```

你可以使用 `count` 方法创建包含多个模型的集合：

```php
$users = User::factory()->count(3)->make();
```

#### 应用状态

你还可以将任意 状态 应用到模型上。如果你希望对模型应用多个状态转换，可以直接调用状态转换方法：

```php
$users = User::factory()->count(5)->suspended()->make();
```

#### 覆盖属性

如果你希望覆盖模型的某些默认值，可以向 `make` 方法传入一个值数组。只有指定的属性会被替换，其余属性仍按工厂指定的默认值设置：

```php
$user = User::factory()->make([
    'name' => 'Abigail Otwell',
]);
```

或者，也可以直接在工厂实例上调用 `state` 方法来执行内联状态转换：

```php
$user = User::factory()->state([
    'name' => 'Abigail Otwell',
])->make();
```

> [!NOTE]
> 使用工厂创建模型时，[批量赋值保护](/topic/Laravel%2013.x/rwyl2kxvz8.html) 会自动被禁用。

### 持久化模型

`create` 方法会实例化模型实例，并使用 Eloquent 的 `save` 方法将它们持久化到数据库：

```php
use App\Models\User;

// 创建一个 App\Models\User 实例……
$user = User::factory()->create();

// 创建三个 App\Models\User 实例……
$users = User::factory()->count(3)->create();
```

你可以通过向 `create` 方法传入一个属性数组，来覆盖工厂的默认模型属性：

```php
$user = User::factory()->create([
    'name' => 'Abigail',
]);
```

### 序列

有时你可能希望为每个创建的模型轮流使用某个给定模型属性的不同值。你可以通过定义一个作为序列（sequence）的状态转换来实现。例如，你可能希望为每个创建的用户在 `admin` 列的值 `Y` 和 `N` 之间轮换：

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

在此示例中，将创建 5 个 `admin` 值为 `Y` 的用户，以及 5 个 `admin` 值为 `N` 的用户。

如有必要，你可以将一个闭包作为序列值。每当序列需要新值时，都会调用该闭包：

```php
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['role' => UserRoles::all()->random()],
    ))
    ->create();
```

在序列闭包中，你可以访问注入到闭包中的序列实例上的 `$index` 属性。`$index` 属性包含截至目前已经过序列的迭代次数：

```php
$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['name' => 'Name '.$sequence->index],
    ))
    ->create();
```

为方便起见，序列也可以使用 `sequence` 方法应用，该方法内部会调用 `state` 方法。`sequence` 方法接收一个闭包或一系列有序属性数组：

```php
$users = User::factory()
    ->count(2)
    ->sequence(
        ['name' => 'First User'],
        ['name' => 'Second User'],
    )
    ->create();
```

## 工厂关联

### Has Many 关联

接下来，让我们探索如何使用 Laravel 流畅的工厂方法来构建 Eloquent 模型关联。首先，假设我们的应用有一个 `App\Models\User` 模型和一个 `App\Models\Post` 模型。同时，假设 `User` 模型定义了一个与 `Post` 的 `hasMany` 关联。我们可以使用 Laravel 工厂提供的 `has` 方法，创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

```php
use App\Models\Post;
use App\Models\User;

$user = User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```

按照约定，当向 `has` 方法传入一个 `Post` 模型时，Laravel 会假定 `User` 模型必须有一个定义该关联的 `posts` 方法。如有必要，你可以显式指定你想要操作的关联名称：

```php
$user = User::factory()
    ->has(Post::factory()->count(3), 'posts')
    ->create();
```

当然，你也可以对关联模型执行状态操作。此外，如果你的状态变更需要访问父模型，可以传入一个基于闭包的状态转换：

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

#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来构建关联。例如，下面的示例会使用约定来确定关联模型应通过 `User` 模型上的 `posts` 关联方法来创建：

```php
$user = User::factory()
    ->hasPosts(3)
    ->create();
```

使用魔术方法创建工厂关联时，你可以传入一个属性数组，用于在关联模型上覆盖：

```php
$user = User::factory()
    ->hasPosts(3, [
        'published' => false,
    ])
    ->create();
```

你也可以传入多个属性数组，以带有各自模型状态的方式创建关联模型。Laravel 会按顺序应用每个数组：

```php
$user = User::factory()
    ->hasPosts(
        ['title' => 'First Post'],
        ['title' => 'Second Post'],
        ['title' => 'Third Post'],
    )
    ->create();
```

如果你的状态变更需要访问父模型，可以传入一个基于闭包的状态转换：

```php
$user = User::factory()
    ->hasPosts(3, function (array $attributes, User $user) {
        return ['user_type' => $user->type];
    })
    ->create();
```

### Belongs To 关联

既然我们已经探索了如何使用工厂构建"has many"关联，接下来看看该关联的反向。可以使用 `for` 方法来定义工厂创建模型所归属的父模型。例如，我们可以创建三个属于单个用户的 `App\Models\Post` 模型实例：

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

如果你已经有一个应该与正在创建的模型关联的父模型实例，可以将该模型实例传给 `for` 方法：

```php
$user = User::factory()->create();

$posts = Post::factory()
    ->count(3)
    ->for($user)
    ->create();
```

#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义"belongs to"关联。例如，下面的示例会使用约定来确定这三篇文章应属于 `Post` 模型上的 `user` 关联：

```php
$posts = Post::factory()
    ->count(3)
    ->forUser([
        'name' => 'Jessica Archer',
    ])
    ->create();
```

### Many to Many 关联

与 has many 关联 类似，"many to many" 关联也可以使用 `has` 方法创建：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->has(Role::factory()->count(3))
    ->create();
```

#### 中间表属性

如果你需要定义在连接模型的中间表（pivot）上设置的属性，可以使用 `hasAttached` 方法。该方法将中间表属性名和值的数组作为其第二个参数：

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

如果你的状态变更需要访问关联模型，可以提供一个基于闭包的状态转换：

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

你也可以传入一个中间表数组的数组，为每个关联模型提供唯一的中间表数据：

```php
$user = User::factory()
    ->hasAttached(
        Role::factory(),
        [
            ['active' => true],
            ['active' => false],
        ]
    )
    ->create();
```

如果你已经有希望附加到正在创建模型上的模型实例，可以将这些模型实例传给 `hasAttached` 方法。在此示例中，相同的三个角色会被附加到全部三个用户上：

```php
$roles = Role::factory()->count(3)->create();

$users = User::factory()
    ->count(3)
    ->hasAttached($roles, ['active' => true])
    ->create();
```

#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法来定义 many to many 关联。例如，下面的示例会使用约定来确定关联模型应通过 `User` 模型上的 `roles` 关联方法来创建：

```php
$user = User::factory()
    ->hasRoles(1, [
        'name' => 'Editor'
    ])
    ->create();
```

### 多态关联

[多态关联](/topic/Laravel%2013.x/kpv13d298w.html) 也可以使用工厂创建。多态的"morph many"关联创建方式与典型的"has many"关联相同。例如，如果 `App\Models\Post` 模型与 `App\Models\Comment` 模型存在 `morphMany` 关联：

```php
use App\Models\Post;

$post = Post::factory()->hasComments(3)->create();
```

#### Morph To 关联

不能使用魔术方法来创建 `morphTo` 关联。相反，必须直接使用 `for` 方法，并显式提供关联的名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关联的 `commentable` 方法。在这种情况下，我们可以通过直接使用 `for` 方法，创建三条属于单篇文章的评论：

```php
$comments = Comment::factory()->count(3)->for(
    Post::factory(), 'commentable'
)->create();
```

#### 多态 Many to Many 关联

多态的"many to many"（`morphToMany` / `morphedByMany`）关联可以像非多态的"many to many"关联一样创建：

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

当然，也可以使用魔术 `has` 方法来创建多态"many to many"关联：

```php
$video = Video::factory()
    ->hasTags(3, ['public' => true])
    ->create();
```

### 在工厂中定义关联

要在模型工厂中定义关联，你通常会将一个新的工厂实例赋值给该关联的外键。这通常针对"反向"关联，例如 `belongsTo` 和 `morphTo` 关联。例如，如果你希望在创建文章时同时创建一个新用户，可以这样做：

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

如果关联的列依赖于定义它的工厂，你可以将一个闭包赋值给某个属性。该闭包会接收工厂已求值的属性数组：

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

### 为关联复用已有模型

如果你有一些模型与另一个模型存在共同的关联，可以使用 `recycle` 方法，确保关联模型的一个单一实例被工厂创建的所有关联所复用。

例如，假设你有 `Airline`、`Flight` 和 `Ticket` 模型，其中票据属于一个航空公司和一个航班，而航班也属于一个航空公司。在创建票据时，你大概会希望票据和航班使用同一个航空公司，因此可以将一个航空公司实例传给 `recycle` 方法：

```php
Ticket::factory()
    ->recycle(Airline::factory()->create())
    ->create();
```

如果你有属于同一个用户或团队的模型，可能会发现 `recycle` 方法特别有用。

`recycle` 方法也接受一个已有模型的集合。当向 `recycle` 方法传入一个集合时，工厂在需要该类型的模型时，会从集合中随机选择一个模型：

```php
Ticket::factory()
    ->recycle($airlines)
    ->create();
```