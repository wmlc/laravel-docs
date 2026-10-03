# 数据库：数据填充

- [简介](#introduction)
- [编写数据填充](#writing-seeders)
    - [使用模型工厂](#using-model-factories)
    - [调用其他数据填充](#calling-additional-seeders)
    - [静默模型事件](#muting-model-events)
- [运行数据填充](#running-seeders)

<a name="introduction"></a>
## 简介

Laravel 支持使用数据填充类为数据库填充数据。所有数据填充类都存放在 `database/seeders` 目录中。默认情况下，已经为你定义好了一个 `DatabaseSeeder` 类。你可以在这个类中使用 `call` 方法运行其他数据填充类，从而控制数据填充的顺序。

> [!NOTE]
> 在填充数据库期间，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="writing-seeders"></a>
## 编写数据填充

要生成数据填充类，请执行 `make:seeder` [Artisan 命令](/docs/{{version}}/artisan)。框架生成的所有数据填充类都会被放到 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

数据填充类默认只包含一个方法：`run`。执行 `db:seed` [Artisan 命令](/docs/{{version}}/artisan)时会调用该方法。在 `run` 方法中，你可以随意向数据库插入数据，既可以使用[查询构造器](/docs/{{version}}/queries)手动插入，也可以使用 [Eloquent 模型工厂](/docs/{{version}}/eloquent-factories)。

举个例子，我们修改一下默认的 `DatabaseSeeder` 类，在 `run` 方法中添加一条数据库插入语句：

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
     * 运行数据库数据填充。
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
> 你可以在 `run` 方法的签名中类型提示所需的任何依赖，它们会自动通过 Laravel [服务容器（Service Container）](/docs/{{version}}/container)解析。

<a name="using-model-factories"></a>
### 使用模型工厂

当然，为每个模型的数据填充手动指定属性相当繁琐。你可以使用[模型工厂](/docs/{{version}}/eloquent-factories)便捷地生成大量数据库记录。首先请查阅[模型工厂文档](/docs/{{version}}/eloquent-factories)，了解如何定义工厂。

例如，我们来创建 50 个用户，每人拥有一篇关联文章：

```php
use App\Models\User;

/**
 * 运行数据库数据填充。
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
### 调用其他数据填充

在 `DatabaseSeeder` 类中，你可以使用 `call` 方法执行其他数据填充类。使用 `call` 方法可以把数据库填充拆分到多个文件中，避免单个数据填充类变得过于庞大。`call` 方法接收一个数据填充类数组，其中包含要执行的类：

```php
/**
 * 运行数据库数据填充。
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

运行数据填充时，你可能希望阻止模型派发事件。这可以通过 `WithoutModelEvents` Trait 实现。使用该 Trait 后，即使通过 `call` 方法执行了额外的数据填充类，`WithoutModelEvents` 也能确保不派发任何模型事件：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * 运行数据库数据填充。
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
## 运行数据填充

你可以执行 `db:seed` Artisan 命令为数据库填充数据。默认情况下，`db:seed` 命令会运行 `Database\Seeders\DatabaseSeeder` 类，而该类又可以调用其他数据填充类。不过，你可以使用 `--class` 选项指定要单独运行的某个数据填充类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你也可以把 `migrate:fresh` 命令与 `--seed` 选项结合使用来填充数据库，该组合会删除所有表并重新运行全部数据库迁移。这条命令适用于彻底重建数据库的场景。`--seeder` 选项可用于指定要运行的数据填充类：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

<a name="forcing-seeding-production"></a>
#### 强制在生产环境运行数据填充

某些数据填充操作可能导致数据被修改或丢失。为了防止你误对生产数据库执行数据填充命令，在 `production` 环境下执行数据填充前系统会提示你确认。若要强制运行数据填充而不显示提示，请使用 `--force` 标志：

```shell
php artisan db:seed --force
```
