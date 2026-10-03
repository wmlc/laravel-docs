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
    - [一对多关联](#has-many-relationships)
    - [从属关联](#belongs-to-relationships)
    - [多对多关联](#many-to-many-relationships)
    - [多态关联](#polymorphic-relationships)
    - [在工厂中定义关联](#defining-relationships-within-factories)
    - [为关联回收已有模型](#recycling-an-existing-model-for-relationships)

<a name="introduction"></a>
## 简介

在测试应用或填充数据库时，你可能需要向数据库插入若干记录。Laravel 允许你使用模型工厂为每个 [Eloquent 模型](/docs/{{version}}/eloquent) 定义一组默认属性，而无需手动指定每一列的值。

要查看编写工厂的示例，可以查看应用中的 `database/factories/UserFactory.php` 文件。所有新建的 Laravel 应用都包含此工厂，其中包含以下工厂定义：

    namespace Database\Factories;

    use Illuminate\Database\Eloquent\Factories\Factory;
    use Illuminate\Support\Str;

    class UserFactory extends Factory
    {
        /**
         * 定义模型的默认状态。
         *
         * @return array
         */
        public function definition()
        {
            return [
                'name' => fake()->name(),
                'email' => fake()->unique()->safeEmail(),
                'email_verified_at' => now(),
                'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 密码
                'remember_token' => Str::random(10),
            ];
        }
    }

如你所见，工厂的最基本形式是继承 Laravel 基础工厂类并定义 `definition` 方法的类。`definition` 方法返回使用工厂创建模型时应应用的默认属性值集合。

通过 `fake` 辅助函数，工厂可以访问 [Faker](https://github.com/FakerPHP/Faker) PHP 库，从而方便地为测试和填充生成各类随机数据。

> **Note**
> 你可以通过在 `config/app.php` 配置文件中添加 `faker_locale` 选项来设置应用的 Faker 区域设置。

<a name="defining-model-factories"></a>
## 定义模型工厂

<a name="generating-factories"></a>
### 生成工厂

要创建工厂，请执行 `make:factory` [Artisan 命令](/docs/{{version}}/artisan)：

```shell
php artisan make:factory PostFactory
```

新的工厂类将放置在 `database/factories` 目录中。

<a name="factory-and-model-discovery-conventions"></a>
#### 模型与工厂发现约定

定义工厂后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` Trait 提供给模型的静态 `factory` 方法，为该模型实例化工厂实例。

`HasFactory` Trait 的 `factory` 方法会使用约定来确定适合该 Trait 所应用模型的工厂。具体而言，该方法会在 `Database\Factories` 命名空间中查找类名与模型名匹配且以 `Factory` 为后缀的工厂。如果这些约定不适用于你的特定应用或工厂，你可以覆盖模型上的 `newFactory` 方法，直接返回模型对应工厂的实例：

    use Database\Factories\Administration\FlightFactory;

    /**
     * 为模型创建新的工厂实例。
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return FlightFactory::new();
    }

接下来，在对应的工厂上定义 `model` 属性：

    use App\Administration\Flight;
    use Illuminate\Database\Eloquent\Factories\Factory;

    class FlightFactory extends Factory
    {
        /**
         * 工厂对应模型的名称。
         *
         * @var string
         */
        protected $model = Flight::class;
    }

<a name="factory-states"></a>
### 工厂状态

状态操作方法允许你定义可以任意组合应用到模型工厂的离散修改。例如，你的 `Database\Factories\UserFactory` 工厂可能包含一个 `suspended` 状态方法，用于修改其某个默认属性值。

状态转换方法通常调用 Laravel 基础工厂类提供的 `state` 方法。`state` 方法接受一个闭包，该闭包接收为工厂定义的原始属性数组，并应返回要修改的属性数组：

    /**
     * 指示用户已被停用。
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function suspended()
    {
        return $this->state(function (array $attributes) {
            return [
                'account_status' => 'suspended',
            ];
        });
    }

#### "已软删除"状态

如果你的 Eloquent 模型支持[软删除](/docs/{{version}}/eloquent#soft-deleting)，你可以调用内置的 `trashed` 状态方法，指示创建的模型应已被"软删除"。无需手动定义 `trashed` 状态，因为它对所有工厂自动可用：

    use App\Models\User;

    $user = User::factory()->trashed()->create();

<a name="factory-callbacks"></a>
### 工厂回调

工厂回调通过 `afterMaking` 和 `afterCreating` 方法注册，允许你在 make 或 create 模型之后执行额外任务。你应该通过在工厂类上定义 `configure` 方法来注册这些回调。Laravel 在实例化工厂时会自动调用此方法：

    namespace Database\Factories;

    use App\Models\User;
    use Illuminate\Database\Eloquent\Factories\Factory;
    use Illuminate\Support\Str;

    class UserFactory extends Factory
    {
        /**
         * 配置模型工厂。
         *
         * @return $this
         */
        public function configure()
        {
            return $this->afterMaking(function (User $user) {
                //
            })->afterCreating(function (User $user) {
                //
            });
        }

        // ...
    }

<a name="creating-models-using-factories"></a>
## 使用工厂创建模型

<a name="instantiating-models"></a>
### 实例化模型

定义工厂后，你可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` Trait 提供给模型的静态 `factory` 方法，为该模型实例化工厂实例。让我们看几个创建模型的示例。首先，我们使用 `make` 方法创建模型而不将其持久化到数据库：

    use App\Models\User;

    $user = User::factory()->make();

你可以使用 `count` 方法创建包含多个模型的集合：

    $users = User::factory()->count(3)->make();

<a name="applying-states"></a>
#### 应用状态

你也可以将任意[状态](#factory-states)应用到模型。如果想对模型应用多个状态转换，只需直接调用状态转换方法：

    $users = User::factory()->count(5)->suspended()->make();

<a name="overriding-attributes"></a>
#### 覆盖属性

如果想覆盖模型的某些默认值，可以向 `make` 方法传递一个值数组。只有指定的属性会被替换，其余属性仍保持工厂指定的默认值：

    $user = User::factory()->make([
        'name' => 'Abigail Otwell',
    ]);

或者，可以直接在工厂实例上调用 `state` 方法执行内联状态转换：

    $user = User::factory()->state([
        'name' => 'Abigail Otwell',
    ])->make();

> **Note**
> 使用工厂创建模型时，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="persisting-models"></a>
### 持久化模型

`create` 方法实例化模型实例并使用 Eloquent 的 `save` 方法将其持久化到数据库：

    use App\Models\User;

    // 创建单个 App\Models\User 实例...
    $user = User::factory()->create();

    // 创建三个 App\Models\User 实例...
    $users = User::factory()->count(3)->create();

你可以通过向 `create` 方法传递属性数组来覆盖工厂的默认模型属性：

    $user = User::factory()->create([
        'name' => 'Abigail',
    ]);

<a name="sequences"></a>
### 序列

有时你可能希望为每个创建的模型交替改变某个属性的值。你可以通过将状态转换定义为序列来实现。例如，你可能希望为每个创建的用户在 `admin` 列的值 `Y` 和 `N` 之间交替：

    use App\Models\User;
    use Illuminate\Database\Eloquent\Factories\Sequence;

    $users = User::factory()
                    ->count(10)
                    ->state(new Sequence(
                        ['admin' => 'Y'],
                        ['admin' => 'N'],
                    ))
                    ->create();

在此示例中，将创建五个 `admin` 值为 `Y` 的用户和五个 `admin` 值为 `N` 的用户。

如有必要，你可以将闭包作为序列值。每次序列需要新值时都会调用该闭包：

    $users = User::factory()
                    ->count(10)
                    ->state(new Sequence(
                        fn ($sequence) => ['role' => UserRoles::all()->random()],
                    ))
                    ->create();

在序列闭包内，你可以访问注入到闭包中的序列实例的 `$index` 或 `$count` 属性。`$index` 属性包含迄今为止序列已进行的迭代次数，而 `$count` 属性包含序列将被调用的总次数：

    $users = User::factory()
                    ->count(10)
                    ->sequence(fn ($sequence) => ['name' => 'Name '.$sequence->index])
                    ->create();

为方便起见，序列也可以使用 `sequence` 方法应用，该方法内部仅调用 `state` 方法。`sequence` 方法接受闭包或序列属性数组：

    $users = User::factory()
                    ->count(2)
                    ->sequence(
                        ['name' => 'First User'],
                        ['name' => 'Second User'],
                    )
                    ->create();

<a name="factory-relationships"></a>
## 工厂关联

<a name="has-many-relationships"></a>
### 一对多关联

接下来，让我们探索使用 Laravel 的流式工厂方法构建 Eloquent 模型关联。首先，假设我们的应用有 `App\Models\User` 模型和 `App\Models\Post` 模型。同时，假设 `User` 模型定义了与 `Post` 的 `hasMany` 关联。我们可以使用 Laravel 工厂提供的 `has` 方法创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

    use App\Models\Post;
    use App\Models\User;

    $user = User::factory()
                ->has(Post::factory()->count(3))
                ->create();

按照约定，当将 `Post` 模型传递给 `has` 方法时，Laravel 会假设 `User` 模型必须有一个定义该关联的 `posts` 方法。如有必要，你可以显式指定要操作的关联名称：

    $user = User::factory()
                ->has(Post::factory()->count(3), 'posts')
                ->create();

当然，你可以对相关模型执行状态操作。此外，如果状态更改需要访问父模型，你可以传递基于闭包的状态转换：

    $user = User::factory()
                ->has(
                    Post::factory()
                            ->count(3)
                            ->state(function (array $attributes, User $user) {
                                return ['user_type' => $user->type];
                            })
                )
                ->create();

<a name="has-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法构建关联。例如，以下示例将使用约定确定相关模型应通过 `User` 模型上的 `posts` 关联方法创建：

    $user = User::factory()
                ->hasPosts(3)
                ->create();

使用魔术方法创建工厂关联时，你可以传递属性数组来覆盖相关模型的属性：

    $user = User::factory()
                ->hasPosts(3, [
                    'published' => false,
                ])
                ->create();

如果状态更改需要访问父模型，你可以提供基于闭包的状态转换：

    $user = User::factory()
                ->hasPosts(3, function (array $attributes, User $user) {
                    return ['user_type' => $user->type];
                })
                ->create();

<a name="belongs-to-relationships"></a>
### 从属关联

既然我们已经探索了如何使用工厂构建"一对多"关联，让我们探索关联的逆向。`for` 方法可用于定义工厂创建模型所属的父模型。例如，我们可以创建三个属于单个用户的 `App\Models\Post` 模型实例：

    use App\Models\Post;
    use App\Models\User;

    $posts = Post::factory()
                ->count(3)
                ->for(User::factory()->state([
                    'name' => 'Jessica Archer',
                ]))
                ->create();

如果你已有应与所创建模型关联的父模型实例，可以将模型实例传递给 `for` 方法：

    $user = User::factory()->create();

    $posts = Post::factory()
                ->count(3)
                ->for($user)
                ->create();

<a name="belongs-to-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法定义"从属"关联。例如，以下示例将使用约定确定三篇文章应属于 `Post` 模型上的 `user` 关联：

    $posts = Post::factory()
                ->count(3)
                ->forUser([
                    'name' => 'Jessica Archer',
                ])
                ->create();

<a name="many-to-many-relationships"></a>
### 多对多关联

与[一对多关联](#has-many-relationships)类似，"多对多"关联可以使用 `has` 方法创建：

    use App\Models\Role;
    use App\Models\User;

    $user = User::factory()
                ->has(Role::factory()->count(3))
                ->create();

<a name="pivot-table-attributes"></a>
#### 中间表属性

如果需要定义应设置在链接模型的中间表（pivot / intermediate table）上的属性，可以使用 `hasAttached` 方法。此方法接受中间表属性名和值的数组作为第二个参数：

    use App\Models\Role;
    use App\Models\User;

    $user = User::factory()
                ->hasAttached(
                    Role::factory()->count(3),
                    ['active' => true]
                )
                ->create();

如果状态更改需要访问相关模型，你可以提供基于闭包的状态转换：

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

如果你已有要附加到所创建模型的模型实例，可以将模型实例传递给 `hasAttached` 方法。在此示例中，相同的三个角色将附加到所有三个用户：

    $roles = Role::factory()->count(3)->create();

    $user = User::factory()
                ->count(3)
                ->hasAttached($roles, ['active' => true])
                ->create();

<a name="many-to-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，你可以使用 Laravel 的魔术工厂关联方法定义多对多关联。例如，以下示例将使用约定确定相关模型应通过 `User` 模型上的 `roles` 关联方法创建：

    $user = User::factory()
                ->hasRoles(1, [
                    'name' => 'Editor'
                ])
                ->create();

<a name="polymorphic-relationships"></a>
### 多态关联

[多态关联](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)也可以使用工厂创建。多态 "morph many" 关联的创建方式与典型的 "一对多" 关联相同。例如，如果 `App\Models\Post` 模型与 `App\Models\Comment` 模型有 `morphMany` 关联：

    use App\Models\Post;

    $post = Post::factory()->hasComments(3)->create();

<a name="morph-to-relationships"></a>
#### 多态从属关联

魔术方法不能用于创建 `morphTo` 关联。相反，必须直接使用 `for` 方法并显式提供关联名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关联的 `commentable` 方法。在这种情况下，我们可以直接使用 `for` 方法创建三篇属于单篇文章的评论：

    $comments = Comment::factory()->count(3)->for(
        Post::factory(), 'commentable'
    )->create();

<a name="polymorphic-many-to-many-relationships"></a>
#### 多态多对多关联

多态 "多对多"（`morphToMany` / `morphedByMany`）关联的创建方式与非多态 "多对多" 关联相同：

    use App\Models\Tag;
    use App\Models\Video;

    $videos = Video::factory()
                ->hasAttached(
                    Tag::factory()->count(3),
                    ['public' => true]
                )
                ->create();

当然，魔术 `has` 方法也可用于创建多态 "多对多" 关联：

    $videos = Video::factory()
                ->hasTags(3, ['public' => true])
                ->create();

<a name="defining-relationships-within-factories"></a>
### 在工厂中定义关联

要在模型工厂中定义关联，通常将新的工厂实例分配给关联的外键。这通常用于"逆向"关联，如 `belongsTo` 和 `morphTo` 关联。例如，如果想在创建文章时创建新用户，可以这样做：

    use App\Models\User;

    /**
     * 定义模型的默认状态。
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->title(),
            'content' => fake()->paragraph(),
        ];
    }

如果关联的列依赖于定义它的工厂，你可以将闭包分配给属性。闭包将接收工厂已求值的属性数组：

    /**
     * 定义模型的默认状态。
     *
     * @return array
     */
    public function definition()
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

<a name="recycling-an-existing-model-for-relationships"></a>
### 为关联回收已有模型

如果多个模型与另一个模型共享公共关联，你可以使用 `recycle` 方法确保为工厂创建的所有关联回收相关模型的单个实例。

例如，假设你有 `Airline`、`Flight` 和 `Ticket` 模型，其中票据属于航空公司和航班，而航班也属于航空公司。创建票据时，你可能希望票据和航班使用相同的航空公司，因此可以将航空公司实例传递给 `recycle` 方法：

    Ticket::factory()
        ->recycle(Airline::factory()->create())
        ->create();

如果多个模型属于公共用户或团队，你会发现 `recycle` 方法特别有用。

`recycle` 方法还接受现有模型的集合。当向 `recycle` 方法提供集合时，工厂需要该类型模型时会从集合中随机选择一个模型：

    Ticket::factory()
        ->recycle($airlines)
        ->create();
