# 数据库测试

## 简介

Laravel 提供了多种实用的工具和断言，让你能够更轻松地测试基于数据库驱动的应用。此外，Laravel 的模型工厂（model factory）和填充器（seeder）让你能够借助应用的 Eloquent 模型和关联轻松创建测试数据库记录。我们将在下文中讨论所有这些强大特性。

### 每个测试后重置数据库

在继续深入之前，我们先来讨论如何在每个测试之后重置数据库，以免上一个测试的数据干扰后续测试。Laravel 内置的 `Illuminate\Foundation\Testing\RefreshDatabase` trait 会替你完成这项工作。只需在你的测试类中使用该 trait 即可：

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
     * 一个基础的功能测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get('/');

        // ...
    }
}
```

如果你的数据库结构是最新的，`Illuminate\Foundation\Testing\RefreshDatabase` trait 不会重新迁移你的数据库，而只会在数据库事务中执行测试。因此，未使用该 trait 的测试用例添加到数据库中的任何记录可能仍然存在于数据库中。

如果你希望完全重置数据库，可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` trait。不过，这两种方式都比 `RefreshDatabase` trait 慢得多。

## 模型工厂

在测试时，你可能需要在执行测试之前向数据库中插入几条记录。Laravel 允许你使用[模型工厂](/topic/Laravel%2013.x/wevwmlz9l2.html)，为你的每个 [Eloquent 模型](/topic/Laravel%2013.x/rwyl2kxvz8.html)定义一组默认属性，而无需在创建测试数据时手动指定每个列的值。

要了解如何创建并使用模型工厂来创建模型，请参阅完整的[模型工厂文档](/topic/Laravel%2013.x/wevwmlz9l2.html)。一旦定义了模型工厂，你就可以在测试中利用工厂来创建模型：

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

## 运行数据填充

如果你想在功能测试期间使用[数据库填充器](/topic/Laravel%2013.x/qk942novw1.html)来填充数据库，可以调用 `seed` 方法。默认情况下，`seed` 方法会执行 `DatabaseSeeder`，而它应当执行你所有的其他填充器。或者，你也可以向 `seed` 方法传入一个特定的填充器类名：

```php tab=Pest
<?php

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('orders can be created', function () {
    // 运行 DatabaseSeeder...
    $this->seed();

    // 运行特定的填充器...
    $this->seed(OrderStatusSeeder::class);

    // ...

    // 运行一组特定的填充器...
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
     * 测试创建一个新订单。
     */
    public function test_orders_can_be_created(): void
    {
        // 运行 DatabaseSeeder...
        $this->seed();

        // 运行特定的填充器...
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一组特定的填充器...
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

或者，你可以指示 Laravel 在每个使用 `RefreshDatabase` trait 的测试之前自动填充数据库。只需在你的基础测试类上添加 `Seed` 属性即可实现：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\Attributes\Seed;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

#[Seed]
abstract class TestCase extends BaseTestCase
{
}
```

当存在 `Seed` 属性时，测试会在每个使用 `RefreshDatabase` trait 的测试之前运行 `Database\Seeders\DatabaseSeeder` 类。不过，你也可以通过测试类上的 `Seeder` 属性来指定应当执行的具体填充器：

```php
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Illuminate\Foundation\Testing\Attributes\Seeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

#[Seeder(OrderStatusSeeder::class)]
class OrderTest extends TestCase
{
    use RefreshDatabase;

    // ...
}
```

## 可用断言

Laravel 为你的 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de) 功能测试提供了多个数据库断言。我们将在下文逐一讨论这些断言。

#### assertDatabaseCount

断言数据库中的某个表包含给定数量的记录：

```php
$this->assertDatabaseCount('users', 5);
```

#### assertDatabaseEmpty

断言数据库中的某个表不包含任何记录：

```php
$this->assertDatabaseEmpty('users');
```

#### assertDatabaseHas

断言数据库中的某个表包含匹配给定键 / 值查询约束的记录：

```php
$this->assertDatabaseHas('users', [
    'email' => 'sally@example.com',
]);
```

#### assertDatabaseMissing

断言数据库中的某个表不包含匹配给定键 / 值查询约束的记录：

```php
$this->assertDatabaseMissing('users', [
    'email' => 'sally@example.com',
]);
```

#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言给定的 Eloquent 模型已被"软删除"：

```php
$this->assertSoftDeleted($user);
```

#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言给定的 Eloquent 模型未被"软删除"：

```php
$this->assertNotSoftDeleted($user);
```

#### assertModelExists

断言给定的模型或模型集合存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$this->assertModelExists($user);
```

#### assertModelMissing

断言给定的模型或模型集合不存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$user->delete();

$this->assertModelMissing($user);
```

#### expectsDatabaseQueryCount

`expectsDatabaseQueryCount` 方法可以在测试开始时调用，用于指定你期望在测试期间运行的总数据库查询次数。如果实际执行的查询次数与该期望值不完全匹配，测试将失败：

```php
$this->expectsDatabaseQueryCount(5);

// 测试...
```
