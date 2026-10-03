# 数据库测试

- [简介](#introduction)
    - [每次测试后重置数据库](#resetting-the-database-after-each-test)
- [模型工厂](#model-factories)
- [运行数据填充](#running-seeders)
- [可用断言](#available-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了多种有用的工具和断言，让测试数据库驱动的应用变得更容易。此外，Laravel 的模型工厂和数据填充让你可以轻松使用应用的 Eloquent 模型和关联创建测试数据库记录。本文档将讨论所有这些强大的功能。

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

在继续之前，我们先来讨论如何在每次测试后重置数据库，使上一个测试的数据不会干扰后续测试。Laravel 自带的 `Illuminate\Foundation\Testing\RefreshDatabase` Trait 会为你处理好这一切。只需在测试类中使用该 Trait：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

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

如果数据库结构已是最新状态，`Illuminate\Foundation\Testing\RefreshDatabase` Trait 不会迁移你的数据库。相反，它只会在一个数据库事务中执行测试。因此，由未使用该 Trait 的测试用例添加到数据库中的记录仍可能存在于数据库中。

如果你想彻底重置数据库，可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` Trait。不过，这两个选项都比 `RefreshDatabase` Trait 慢得多。

<a name="model-factories"></a>
## 模型工厂

测试时，你可能需要在执行测试前先向数据库插入几条记录。与其在创建这些测试数据时手动指定每一列的值，Laravel 允许你使用[模型工厂](/docs/{{version}}/eloquent-factories)为你的每个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性。

想了解更多关于创建和使用模型工厂生成模型的信息，请查阅完整的[模型工厂文档](/docs/{{version}}/eloquent-factories)。定义好模型工厂后，就可以在测试中使用它来创建模型：

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

如果你想在功能测试中使用[数据库数据填充](/docs/{{version}}/seeding)来填充数据库，可以调用 `seed` 方法。默认情况下，`seed` 方法会执行 `DatabaseSeeder`，而它应当执行你的所有其他数据填充类。或者，你也可以把特定的数据填充类名传给 `seed` 方法：

```php tab=Pest
<?php

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('orders can be created', function () {
    // 运行 DatabaseSeeder……
    $this->seed();

    // 运行特定的数据填充……
    $this->seed(OrderStatusSeeder::class);

    // ...

    // 运行一组特定的数据填充……
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
        // 运行 DatabaseSeeder……
        $this->seed();

        // 运行特定的数据填充……
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一组特定的数据填充……
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

或者，你也可以指示 Laravel 在每个使用 `RefreshDatabase` Trait 的测试之前自动填充数据库。只需在基础测试类上定义一个 `$seed` 属性即可实现：

    <?php

    namespace Tests;

    use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

    abstract class TestCase extends BaseTestCase
    {
        /**
         * 指示是否在每个测试前运行默认的数据填充。
         *
         * @var bool
         */
        protected $seed = true;
    }

当 `$seed` 属性为 `true` 时，测试会在每个使用 `RefreshDatabase` Trait 的测试之前运行 `Database\Seeders\DatabaseSeeder` 类。不过，你也可以通过在测试类上定义 `$seeder` 属性来指定要执行的数据填充类：

    use Database\Seeders\OrderStatusSeeder;

    /**
     * 在每个测试前运行特定的数据填充。
     *
     * @var string
     */
    protected $seeder = OrderStatusSeeder::class;

<a name="available-assertions"></a>
## 可用断言

Laravel 为你的 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de)功能测试提供了若干数据库断言。下面将逐一讨论这些断言。

<a name="assert-database-count"></a>
#### assertDatabaseCount

断言数据库中的某个表包含给定数量的记录：

    $this->assertDatabaseCount('users', 5);

<a name="assert-database-empty"></a>
#### assertDatabaseEmpty

断言数据库中的某个表不包含任何记录：

    $this->assertDatabaseEmpty('users');

<a name="assert-database-has"></a>
#### assertDatabaseHas

断言数据库中的某个表包含匹配给定键 / 值查询约束的记录：

    $this->assertDatabaseHas('users', [
        'email' => 'sally@example.com',
    ]);

<a name="assert-database-missing"></a>
#### assertDatabaseMissing

断言数据库中的某个表不包含匹配给定键 / 值查询约束的记录：

    $this->assertDatabaseMissing('users', [
        'email' => 'sally@example.com',
    ]);

<a name="assert-deleted"></a>
#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言给定的 Eloquent 模型已被"软删除"：

    $this->assertSoftDeleted($user);

<a name="assert-not-deleted"></a>
#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言给定的 Eloquent 模型未被"软删除"：

    $this->assertNotSoftDeleted($user);

<a name="assert-model-exists"></a>
#### assertModelExists

断言给定模型存在于数据库中：

    use App\Models\User;

    $user = User::factory()->create();

    $this->assertModelExists($user);

<a name="assert-model-missing"></a>
#### assertModelMissing

断言给定模型不存在于数据库中：

    use App\Models\User;

    $user = User::factory()->create();

    $user->delete();

    $this->assertModelMissing($user);

<a name="expects-database-query-count"></a>
#### expectsDatabaseQueryCount

你可以在测试开头调用 `expectsDatabaseQueryCount` 方法，指定你预期测试期间会运行的数据库查询总数。如果实际执行的查询数与此预期不完全一致，测试就会失败：

    $this->expectsDatabaseQueryCount(5);

    // 测试……
