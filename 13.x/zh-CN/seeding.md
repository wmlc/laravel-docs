# 数据库：数据填充

- [简介](#introduction)
- [编写数据填充器](#writing-seeders)
    - [使用模型工厂](#using-model-factories)
    - [调用其他数据填充器](#calling-additional-seeders)
    - [静默模型事件](#muting-model-events)
- [运行数据填充器](#running-seeders)

<a name="introduction"></a>
## 简介

Laravel 提供了一种使用数据填充（Seeder）类为数据库填充数据的能力。所有数据填充类都存放在 `database/seeders` 目录中。默认情况下，框架已为你定义了一个 `DatabaseSeeder` 类。你可以从这个类中使用 `call` 方法运行其他数据填充类，从而控制数据填充的顺序。

> [!NOTE]
> 在数据库数据填充期间，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="writing-seeders"></a>
## 编写数据填充器

要生成数据填充器，请执行 `make:seeder` [Artisan 命令](/docs/{{version}}/artisan)。框架生成的所有数据填充器都会放在 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

数据填充器类默认只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/docs/{{version}}/artisan) 时会调用此方法。在 `run` 方法中，你可以按照自己的意愿向数据库插入数据。你可以使用[查询构造器](/docs/{{version}}/queries)手动插入数据，也可以使用 [Eloquent 模型工厂](/docs/{{version}}/eloquent-factories)。

例如，让我们修改默认的 `DatabaseSeeder` 类，在 `run` 方法中添加一条数据库插入语句：

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
     * Run the database seeders.
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
> 你可以在 `run` 方法的签名中类型提示任何所需依赖。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

<a name="using-model-factories"></a>
### 使用模型工厂

当然，手动为每个模型数据填充指定属性很繁琐。相反，你可以使用[模型工厂](/docs/{{version}}/eloquent-factories)方便地生成大量数据库记录。首先，请查阅[模型工厂文档](/docs/{{version}}/eloquent-factories)，了解如何定义工厂。

例如，让我们创建 50 个用户，每个用户拥有一条关联的文章：

```php
use App\Models\User;

/**
 * Run the database seeders.
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
### 调用其他数据填充器

在 `DatabaseSeeder` 类中，你可以使用 `call` 方法执行其他数据填充类。使用 `call` 方法可以将数据库数据填充拆分为多个文件，这样就不会有单个数据填充类显得过于庞大。`call` 方法接受一个应执行的数据填充类数组：

```php
/**
 * Run the database seeders.
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

在运行数据填充时，你可能希望阻止模型触发事件。你可以使用 `WithoutModelEvents` Trait 来实现这一点。使用该 Trait 后，即使通过 `call` 方法执行了其他数据填充类，也能确保不会触发任何模型事件：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeders.
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
## 运行数据填充器

你可以执行 `db:seed` Artisan 命令为数据库填充数据。默认情况下，`db:seed` 命令运行 `Database\Seeders\DatabaseSeeder` 类，该类又可以依次调用其他数据填充类。不过，你可以使用 `--class` 选项指定要单独运行的特定数据填充类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你还可以使用 `migrate:fresh` 命令配合 `--seed` 选项来填充数据库，该命令会删除所有表并重新运行所有迁移。此命令对于完全重建数据库非常有用。`--seeder` 选项可用于指定要运行的特定数据填充器：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

<a name="forcing-seeding-production"></a>
#### 强制在生产环境运行数据填充器

某些数据填充操作可能会导致你修改或丢失数据。为防止你在生产数据库上运行数据填充命令，在执行数据填充器之前，系统会在 `production` 环境中提示你进行确认。若要在不出现提示的情况下强制执行数据填充器，请使用 `--force` 标志：

```shell
php artisan db:seed --force
```
