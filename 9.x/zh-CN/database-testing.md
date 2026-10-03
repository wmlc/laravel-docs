# 数据库测试

- [简介](#introduction)
    - [每次测试后重置数据库](#resetting-the-database-after-each-test)
- [模型工厂](#model-factories)
- [运行 Seeder](#running-seeders)
- [可用断言](#available-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了各种有用的工具和断言，让你更轻松地测试数据库驱动的应用。此外，Laravel 的模型工厂和 seeder 让你能够轻松地使用应用的 Eloquent 模型和关联来创建测试数据库记录。我们将在以下文档中讨论所有这些强大功能。

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

在继续深入之前，我们先讨论如何在每次测试后重置数据库，以免前一个测试的数据影响后续测试。Laravel 内置的 `Illuminate\Foundation\Testing\RefreshDatabase` trait 会为你处理这件事。只需在测试类中使用该 trait 即可：

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 一个基础的功能测试示例。
     *
     * @return void
     */
    public function test_basic_example()
    {
        $response = $this->get('/');

        // ...
    }
}
```

如果你的数据库结构是最新的，`Illuminate\Foundation\Testing\RefreshDatabase` trait 不会重新执行数据库迁移。相反，它只会在数据库事务中执行测试。因此，未使用该 trait 的测试用例添加到数据库中的记录可能仍然存在。

如果你想彻底重置数据库，可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` trait。不过，这两个选项都比 `RefreshDatabase` trait 慢得多。

<a name="model-factories"></a>
## 模型工厂

测试时，你可能需要在执行测试前向数据库插入一些记录。Laravel 允许你使用[模型工厂](/docs/{{version}}/eloquent-factories)为每个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性，而无需在创建测试数据时手动指定每一列的值。

要了解更多关于创建和使用模型工厂来创建模型的信息，请查阅完整的[模型工厂文档](/docs/{{version}}/eloquent-factories)。定义好模型工厂后，你就可以在测试中使用工厂来创建模型：

```php tab=PHPUnit
use App\Models\User;

public function test_models_can_be_instantiated()
{
    $user = User::factory()->create();

    // ...
}
```

<a name="running-seeders"></a>
## 运行 Seeder

如果你想在功能测试期间使用[数据库 seeder](/docs/{{version}}/seeding)来填充数据库，可以调用 `seed` 方法。默认情况下，`seed` 方法会执行 `DatabaseSeeder`，它应该会执行所有其他 seeder。你也可以向 `seed` 方法传入一个具体的 seeder 类名：

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 测试创建新订单。
     *
     * @return void
     */
    public function test_orders_can_be_created()
    {
        // 运行 DatabaseSeeder...
        $this->seed();

        // 运行指定的 seeder...
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一组指定的 seeder...
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

另外，你也可以让 Laravel 在每次使用 `RefreshDatabase` trait 的测试之前自动填充数据库。可以通过在基础测试类中定义 `$seed` 属性来实现：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * 指示是否在每次测试前运行默认 seeder。
     *
     * @var bool
     */
    protected $seed = true;
}
```

当 `$seed` 属性为 `true` 时，测试会在每次使用 `RefreshDatabase` trait 的测试之前运行 `Database\Seeders\DatabaseSeeder` 类。不过，你可以通过在测试类中定义 `$seeder` 属性来指定要执行的具体 seeder：

```php
use Database\Seeders\OrderStatusSeeder;

/**
 * 在每次测试前运行指定的 seeder。
 *
 * @var string
 */
protected $seeder = OrderStatusSeeder::class;
```

<a name="available-assertions"></a>
## 可用断言

Laravel 为你的 [PHPUnit](https://phpunit.de/) 功能测试提供了多个数据库断言。我们将在下面逐一讨论这些断言。

<a name="assert-database-count"></a>
#### assertDatabaseCount

断言数据库中的某个表包含指定数量的记录：

```php
$this->assertDatabaseCount('users', 5);
```

<a name="assert-database-has"></a>
#### assertDatabaseHas

断言数据库中的某个表包含匹配指定键/值查询约束的记录：

```php
$this->assertDatabaseHas('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-database-missing"></a>
#### assertDatabaseMissing

断言数据库中的某个表不包含匹配指定键/值查询约束的记录：

```php
$this->assertDatabaseMissing('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-deleted"></a>
#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言指定的 Eloquent 模型已被"软删除"：

```php
$this->assertSoftDeleted($user);
```

<a name="assert-not-deleted"></a>
#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言指定的 Eloquent 模型未被"软删除"：

```php
$this->assertNotSoftDeleted($user);
```

<a name="assert-model-exists"></a>
#### assertModelExists

断言指定的模型存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$this->assertModelExists($user);
```

<a name="assert-model-missing"></a>
#### assertModelMissing

断言指定的模型不存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$user->delete();

$this->assertModelMissing($user);
```

<a name="expects-database-query-count"></a>
#### expectsDatabaseQueryCount

`expectsDatabaseQueryCount` 方法可以在测试开始时调用，用于指定测试期间预期运行的数据库查询总数。如果实际执行的查询数量与此预期不完全匹配，测试将失败：

```php
$this->expectsDatabaseQueryCount(5);

// 测试...
```