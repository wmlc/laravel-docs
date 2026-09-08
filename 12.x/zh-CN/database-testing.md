# 数据库测试

- [简介](#introduction)
    - [每次测试后重置数据库](#resetting-the-database-after-each-test)
- [模型工厂](#model-factories)
- [运行数据填充](#running-seeders)
- [可用的断言](#available-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了多种实用的工具和断言，让你更轻松地测试数据库驱动的应用。此外，Laravel 的模型工厂和数据填充（Seeder）让你可以使用应用的 Eloquent 模型和关联轻松创建测试数据库记录。我们将在下面的文档中逐一讨论这些强大的功能。

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

在深入讨论之前，我们先来说说如何在每次测试后重置数据库，以免前一个测试的数据干扰后续测试。Laravel 内置的 `Illuminate\Foundation\Testing\RefreshDatabase` Trait 会帮你处理好这个问题。只需在你的测试类中使用该 Trait 即可：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('basic example', function () {
    $response = $this->get('/');

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 一个基本的功能测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get('/');

        // ...
    }
}
```

如果你的数据库结构是最新的，`Illuminate\Foundation\Testing\RefreshDatabase` Trait 并不会重新执行数据库迁移，而只会在数据库事务中执行测试。因此，不使用该 Trait 的测试用例添加到数据库中的记录，可能仍会留在数据库里。

如果你想彻底重置数据库，可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` Trait。不过，这两个方案都比 `RefreshDatabase` Trait 慢得多。

<a name="model-factories"></a>
## 模型工厂

测试时，你可能需要在执行测试之前向数据库插入一些记录。Laravel 允许你使用[模型工厂](/docs/{{version}}/eloquent-factories)为每个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性，而无需在创建测试数据时手动指定每一列的值。

要了解如何创建和使用模型工厂来生成模型，请查阅完整的[模型工厂文档](/docs/{{version}}/eloquent-factories)。定义好模型工厂后，你就可以在测试中使用工厂来创建模型：

```php tab=Pest
use App\Models\User;

test('models can be instantiated', function () {
    $user = User::factory()->create();

    // ...
});
```

```php tab=PHPUnit
use App\Models\User;

public function test_models_can_be_instantiated(): void
{
    $user = User::factory()->create();

    // ...
}
```

<a name="running-seeders"></a>
## 运行数据填充

如果想在功能测试期间使用[数据库数据填充](/docs/{{version}}/seeding)来填充数据库，可以调用 `seed` 方法。默认情况下，`seed` 方法会执行 `DatabaseSeeder`，而后者应该会执行你所有其他的 Seeder。你也可以向 `seed` 方法传入某个具体的 Seeder 类名：

```php tab=Pest
<?php

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('orders can be created', function () {
    // 运行 DatabaseSeeder...
    $this->seed();

    // 运行某个具体的 Seeder...
    $this->seed(OrderStatusSeeder::class);

    // ...

    // 运行一组具体的 Seeder...
    $this->seed([
        OrderStatusSeeder::class,
        TransactionStatusSeeder::class,
        // ...
    ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 测试创建新订单。
     */
    public function test_orders_can_be_created(): void
    {
        // 运行 DatabaseSeeder...
        $this->seed();

        // 运行某个具体的 Seeder...
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一组具体的 Seeder...
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

此外，你还可以让 Laravel 在每个使用 `RefreshDatabase` Trait 的测试之前自动填充数据库。要实现这一点，只需在你的基础测试类上定义 `$seed` 属性：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * 指示是否应在每个测试前运行默认 Seeder。
     *
     * @var bool
     */
    protected $seed = true;
}
```

当 `$seed` 属性为 `true` 时，每个使用 `RefreshDatabase` Trait 的测试都会在运行前执行 `Database\Seeders\DatabaseSeeder` 类。不过，你也可以在测试类上定义 `$seeder` 属性来指定要执行的具体 Seeder：

```php
use Database\Seeders\OrderStatusSeeder;

/**
 * 在每个测试前运行的具体 Seeder。
 *
 * @var string
 */
protected $seeder = OrderStatusSeeder::class;
```

<a name="available-assertions"></a>
## 可用的断言

Laravel 为 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de) 功能测试提供了多个数据库断言。下面我们将逐一讨论这些断言。

<a name="assert-database-count"></a>
#### assertDatabaseCount

断言数据库中某张表包含给定数量的记录：

```php
$this->assertDatabaseCount('users', 5);
```

<a name="assert-database-empty"></a>
#### assertDatabaseEmpty

断言数据库中某张表不包含任何记录：

```php
$this->assertDatabaseEmpty('users');
```

<a name="assert-database-has"></a>
#### assertDatabaseHas

断言数据库中某张表包含符合给定键 / 值查询约束的记录：

```php
$this->assertDatabaseHas('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-database-missing"></a>
#### assertDatabaseMissing

断言数据库中某张表不包含符合给定键 / 值查询约束的记录：

```php
$this->assertDatabaseMissing('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-deleted"></a>
#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言给定的 Eloquent 模型已被「软删除」：

```php
$this->assertSoftDeleted($user);
```

<a name="assert-not-deleted"></a>
#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言给定的 Eloquent 模型未被「软删除」：

```php
$this->assertNotSoftDeleted($user);
```

<a name="assert-model-exists"></a>
#### assertModelExists

断言给定的模型或模型集合存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$this->assertModelExists($user);
```

<a name="assert-model-missing"></a>
#### assertModelMissing

断言给定的模型或模型集合不存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$user->delete();

$this->assertModelMissing($user);
```

<a name="expects-database-query-count"></a>
#### expectsDatabaseQueryCount

`expectsDatabaseQueryCount` 方法可以在测试开头调用，用于指定你预期测试期间运行的数据库查询总数。如果实际执行的查询数量与该预期不完全一致，测试将会失败：

```php
$this->expectsDatabaseQueryCount(5);

// 测试...
```
