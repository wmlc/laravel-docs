# 数据库：数据填充

- [简介](#introduction)
- [编写数据填充器](#writing-seeders)
    - [使用模型工厂](#using-model-factories)
    - [调用其他填充器](#calling-additional-seeders)
    - [静默模型事件](#muting-model-events)
- [运行数据填充器](#running-seeders)

<a name="introduction"></a>
## 简介

Laravel 提供了使用填充类向数据库填充数据的能力。所有填充类都存放在 `database/seeders` 目录下。默认情况下，框架已为你定义了一个 `DatabaseSeeder` 类。在该类中，你可以使用 `call` 方法运行其他填充类，从而控制数据填充的执行顺序。

> **注意**
> 在数据库填充期间，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment) 会自动禁用。

<a name="writing-seeders"></a>
## 编写数据填充器

要生成填充器，可执行 `make:seeder` [Artisan 命令](/docs/{{version}}/artisan)。框架生成的所有填充器都会放置在 `database/seeders` 目录下：

```shell
php artisan make:seeder UserSeeder
```

填充器类默认只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/docs/{{version}}/artisan) 时会调用此方法。在 `run` 方法中，你可以按任意方式向数据库插入数据。你可以使用 [查询构造器](/docs/{{version}}/queries) 手动插入数据，也可以使用 [Eloquent 模型工厂](/docs/{{version}}/eloquent-factories)。

例如，让我们修改默认的 `DatabaseSeeder` 类，在 `run` 方法中添加一条数据库插入语句：

    <?php

    namespace Database\Seeders;

    use Illuminate\Database\Seeder;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Str;

    class DatabaseSeeder extends Seeder
    {
        /**
         * 运行数据库填充器。
         *
         * @return void
         */
        public function run()
        {
            DB::table('users')->insert([
                'name' => Str::random(10),
                'email' => Str::random(10).'@gmail.com',
                'password' => Hash::make('password'),
            ]);
        }
    }

> **注意**
> 你可以在 `run` 方法的签名中对所需的任何依赖进行类型提示。Laravel [服务容器（Service Container）](/docs/{{version}}/container) 会自动解析它们。

<a name="using-model-factories"></a>
### 使用模型工厂

当然，手动为每个模型填充指定属性会很繁琐。相反，你可以使用 [模型工厂](/docs/{{version}}/eloquent-factories) 方便地生成大量数据库记录。首先，请查阅 [模型工厂文档](/docs/{{version}}/eloquent-factories) 了解如何定义工厂。

例如，让我们创建 50 个用户，每个用户拥有一篇相关文章：

    use App\Models\User;

    /**
     * 运行数据库填充器。
     *
     * @return void
     */
    public function run()
    {
        User::factory()
                ->count(50)
                ->hasPosts(1)
                ->create();
    }

<a name="calling-additional-seeders"></a>
### 调用其他填充器

在 `DatabaseSeeder` 类中，你可以使用 `call` 方法执行其他填充类。使用 `call` 方法可以将数据库填充拆分到多个文件中，避免单个填充器类过大。`call` 方法接受一个需要执行的填充器类数组：

    /**
     * 运行数据库填充器。
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            UserSeeder::class,
            PostSeeder::class,
            CommentSeeder::class,
        ]);
    }

<a name="muting-model-events"></a>
### 静默模型事件

在运行填充时，你可能希望阻止模型触发事件。可以使用 `WithoutModelEvents` Trait 来实现。使用时，`WithoutModelEvents` Trait 会确保不触发任何模型事件，即使通过 `call` 方法执行了其他填充类：

    <?php

    namespace Database\Seeders;

    use Illuminate\Database\Seeder;
    use Illuminate\Database\Console\Seeds\WithoutModelEvents;

    class DatabaseSeeder extends Seeder
    {
        use WithoutModelEvents;

        /**
         * 运行数据库填充器。
         *
         * @return void
         */
        public function run()
        {
            $this->call([
                UserSeeder::class,
            ]);
        }
    }

<a name="running-seeders"></a>
## 运行数据填充器

你可以执行 `db:seed` Artisan 命令来填充数据库。默认情况下，`db:seed` 命令会运行 `Database\Seeders\DatabaseSeeder` 类，该类可能会调用其他填充类。不过，你可以使用 `--class` 选项指定单独运行某个填充器类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你也可以结合 `--seed` 选项使用 `migrate:fresh` 命令来填充数据库，该命令会删除所有数据表并重新运行所有数据库迁移。此命令适用于完全重建数据库。可以使用 `--seeder` 选项指定要运行的具体填充器：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder 
```

<a name="forcing-seeding-production"></a>
#### 强制在生产环境运行填充器

某些填充操作可能会修改或丢失数据。为了防止你在生产数据库上运行填充命令，在 `production` 环境中执行填充器之前会提示你确认。要强制运行填充器而不提示，请使用 `--force` 标志：

```shell
php artisan db:seed --force
```
