# 数据库：数据填充

Laravel 包含使用数据填充（Seeder）类为数据库填充数据的能力。所有填充类都存放在 `database/seeders` 目录中。默认情况下，会为你定义一个 `DatabaseSeeder` 类。在这个类中，你可以使用 `call` 方法运行其他填充类，从而控制填充的顺序。

> [!NOTE]
> [批量赋值保护](/topic/Laravel%2013.x/rwyl2kxvz8.html) 在数据库填充期间会自动禁用。

## 编写数据填充器

要生成一个填充器（Seeder），执行 `make:seeder` [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html)。框架生成的所有填充器都会放置在 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

默认情况下，一个填充器类只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html) 时会调用该方法。在 `run` 方法中，你可以按自己的意愿向数据库插入数据。你可以使用 [查询构造器](/topic/Laravel%2013.x/xpv525gv86.html) 手动插入数据，也可以使用 [Eloquent 模型工厂](/topic/Laravel%2013.x/wevwmlz9l2.html)。

举个例子，我们来修改默认的 `DatabaseSeeder` 类，并向 `run` 方法中添加一条数据库插入语句：

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
> 你可以在 `run` 方法的签名中类型提示任何所需的依赖。它们会通过 Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 自动解析。

### 使用模型工厂

当然，手动为每个模型填充指定属性会非常繁琐。相反，你可以使用 [模型工厂](/topic/Laravel%2013.x/wevwmlz9l2.html) 来方便地生成大量数据库记录。首先，请阅读 [模型工厂文档](/topic/Laravel%2013.x/wevwmlz9l2.html) 了解如何定义你的工厂。

例如，我们来创建 50 个用户，每个用户各拥有一篇关联文章：

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

### 调用其他数据填充器

在 `DatabaseSeeder` 类中，你可以使用 `call` 方法执行额外的填充类。使用 `call` 方法可以将你的数据库填充拆分到多个文件中，以免单个填充类变得过大。`call` 方法接受一个应当被执行的填充类数组：

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

### 静默模型事件

在运行填充时，你可能希望阻止模型调度事件。你可以使用 `WithoutModelEvents` Trait 来实现。使用时，`WithoutModelEvents` Trait 会确保即使通过 `call` 方法执行了额外的填充类，也不会调度任何模型事件：

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

## 运行数据填充

你可以执行 `db:seed` Artisan 命令来为数据库填充数据。默认情况下，`db:seed` 命令会运行 `Database\Seeders\DatabaseSeeder` 类，该类进而可能调用其他填充类。不过，你可以使用 `--class` 选项来单独指定要运行的特定填充类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你也可以结合 `--seed` 选项使用 `migrate:fresh` 命令来为数据库填充数据，它会删除所有表并重新运行你所有的迁移。该命令对于彻底重建数据库很有用。`--seeder` 选项可用于指定要运行的特定填充器：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

#### 强制在生产环境运行数据填充器

某些填充操作可能会导致你更改或丢失数据。为了保护你免受针对生产数据库运行填充命令的影响，在 `production` 环境中执行填充器之前，系统会提示你进行确认。要强制在不提示的情况下运行填充器，请使用 `--force` 标志：

```shell
php artisan db:seed --force
```
