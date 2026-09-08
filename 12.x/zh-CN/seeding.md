# 数据库：数据填充

- [简介](#introduction)
- [编写 Seeder](#writing-seeders)
    - [使用模型工厂](#using-model-factories)
    - [调用其他 Seeder](#calling-additional-seeders)
    - [静默模型事件](#muting-model-events)
- [运行 Seeder](#running-seeders)

<a name="introduction"></a>
## 简介

Laravel 可以使用数据填充类向数据库填充数据。所有数据填充类都存放在 `database/seeders` 目录中。默认情况下，框架已经为你定义了一个 `DatabaseSeeder` 类。在这个类中，你可以使用 `call` 方法运行其他数据填充类，从而控制数据填充的顺序。

> [!NOTE]
> 在执行数据库填充期间，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="writing-seeders"></a>
## 编写 Seeder

要生成一个 Seeder，可以执行 `make:seeder` [Artisan 命令](/docs/{{version}}/artisan)。框架生成的所有 Seeder 都会放在 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

Seeder 类默认只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/docs/{{version}}/artisan)时，就会调用这个方法。在 `run` 方法中，你可以随意向数据库插入数据。你可以使用[查询构造器](/docs/{{version}}/queries)手动插入数据，也可以使用 [Eloquent 模型工厂](/docs/{{version}}/eloquent-factories)。

举个例子，我们来修改默认的 `DatabaseSeeder` 类，在 `run` 方法中添加一条数据库插入语句：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * 运行数据库填充。
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => Str::random(10),
            'email' => Str::random(10).'@example.com',
            'password' => Hash::make('password'),
        ]);
    }
}
```

> [!NOTE]
> 你可以在 `run` 方法的签名中对所需的任何依赖进行类型提示，它们会通过 Laravel [服务容器（Service Container）](/docs/{{version}}/container)自动解析。

<a name="using-model-factories"></a>
### 使用模型工厂

当然，手动为每条模型填充数据指定属性十分繁琐。此时可以使用[模型工厂](/docs/{{version}}/eloquent-factories)，便捷地生成大量数据库记录。首先，请阅读[模型工厂文档](/docs/{{version}}/eloquent-factories)，了解如何定义工厂。

例如，我们来创建 50 个用户，每个用户拥有一篇关联文章：

```php
use App\Models\User;

/**
 * 运行数据库填充。
 */
public function run(): void
{
    User::factory()
        ->count(50)
        ->hasPosts(1)
        ->create();
}
```

<a name="calling-additional-seeders"></a>
### 调用其他 Seeder

在 `DatabaseSeeder` 类中，可以使用 `call` 方法执行其他数据填充类。借助 `call` 方法，你可以将数据库填充拆分到多个文件中，避免单个 Seeder 类过于庞大。`call` 方法接受一个需要执行的 Seeder 类数组：

```php
/**
 * 运行数据库填充。
 */
public function run(): void
{
    $this->call([
        UserSeeder::class,
        PostSeeder::class,
        CommentSeeder::class,
    ]);
}
```

<a name="muting-model-events"></a>
### 静默模型事件

在运行数据填充时，你可能希望阻止模型触发事件。这可以通过 `WithoutModelEvents` Trait 实现。使用后，`WithoutModelEvents` Trait 会确保不触发任何模型事件，即使通过 `call` 方法执行了其他数据填充类也是如此：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * 运行数据库填充。
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
        ]);
    }
}
```

<a name="running-seeders"></a>
## 运行 Seeder

你可以执行 `db:seed` Artisan 命令来填充数据库。默认情况下，`db:seed` 命令会运行 `Database\Seeders\DatabaseSeeder` 类，而这个类又可能调用其他数据填充类。不过，你也可以使用 `--class` 选项指定要单独运行的 Seeder 类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你也可以将 `migrate:fresh` 命令与 `--seed` 选项结合使用来填充数据库，该命令会删除所有数据表并重新运行所有数据库迁移。此命令适用于彻底重建数据库。可以使用 `--seeder` 选项指定要运行的 Seeder：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

<a name="forcing-seeding-production"></a>
#### 强制在生产环境中运行 Seeder

某些数据填充操作可能会导致数据被修改或丢失。为了避免你误在生产数据库上执行填充命令，在 `production` 环境中运行 Seeder 之前，系统会提示你确认。如果想在无提示的情况下强制运行 Seeder，可以使用 `--force` 标志：

```shell
php artisan db:seed --force
```
