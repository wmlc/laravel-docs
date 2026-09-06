# 测试：入门

## 简介

Laravel 从设计之初就内置了对测试的考量。事实上，开箱即提供了对 [Pest](https://pestphp.com) 和 [PHPUnit](https://phpunit.de) 的测试支持，并且已经为你的应用程序配置好了一个 `phpunit.xml` 文件。框架还提供了便捷的辅助方法，让你可以富有表现力地测试你的应用程序。

默认情况下，你的应用程序的 `tests` 目录包含 `Feature` 和 `Unit` 两个目录。单元测试（Unit tests）侧重于代码中非常小、孤立的部分。事实上，大多数单元测试可能只关注单个方法。"Unit" 测试目录中的测试不会引导（Bootstrap）你的 Laravel 应用程序，因此无法访问应用程序的数据库或其他框架服务。

功能测试（Feature tests）可能会测试代码中更大的部分，包括多个对象如何相互交互，甚至是向 JSON 端点发起的完整 HTTP 请求。**通常，你的大部分测试都应该是功能测试。这类测试最能让你确信整个系统正在按预期运行。**

`Feature` 和 `Unit` 两个测试目录中都提供了一个 `ExampleTest.php` 文件。安装新的 Laravel 应用程序后，执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令来运行你的测试。

## 环境

运行测试时，由于 `phpunit.xml` 文件中定义的环境变量，Laravel 会自动将[配置环境](/topic/Laravel%2013.x/3dykqpoyl0.html)设置为 `testing`。Laravel 还会自动将会话和缓存配置为 `array` 驱动，以便在测试期间不会持久化任何会话或缓存数据。

你可以根据需要定义其他测试环境配置值。可以在应用程序的 `phpunit.xml` 文件中配置 `testing` 环境变量，但在运行测试之前，请务必使用 `config:clear` Artisan 命令清除你的配置缓存！

#### `.env.testing` 环境文件

此外，你可以在项目的根目录中创建一个 `.env.testing` 文件。当运行 Pest 和 PHPUnit 测试或使用 `--env=testing` 选项执行 Artisan 命令时，将使用此文件代替 `.env` 文件。

## 创建测试

要创建一个新的测试用例，请使用 `make:test` Artisan 命令。默认情况下，测试将放置在 `tests/Feature` 目录中：

```shell
php artisan make:test UserTest
```

如果你想在 `tests/Unit` 目录中创建测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

如果你有一个测试类，主要依赖 Laravel 的测试特性，但某个特定的测试方法不需要引导（Bootstrap）框架，你可以为该测试方法应用 `#[UnitTest]` 属性，从而仅为该测试跳过引导（Bootstrap）应用程序：

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\Attributes\UnitTest;
use Tests\TestCase;

class LocationServiceTest extends TestCase
{
    public function test_get_coordinates_resolves_address(): void
    {
        // 该测试使用了 Laravel 的测试特性...
    }

    #[UnitTest]
    public function test_get_state_returns_state_from_abbreviation(): void
    {
        // 该测试在无需引导应用程序的情况下运行...
    }
}
```

> [!NOTE]
> 测试桩可以通过[桩发布](/topic/Laravel%2013.x/3dykqdoyl0.html)进行自定义。

生成测试后，你可以像往常一样使用 Pest 或 PHPUnit 定义测试。要运行测试，请在终端中执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令：

```php tab=Pest
<?php

test('basic', function () {
    expect(true)->toBeTrue();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基础的测试示例。
     */
    public function test_basic_test(): void
    {
        $this->assertTrue(true);
    }
}
```

> [!WARNING]
> 如果你在测试类中定义了自己的 `setUp` / `tearDown` 方法，请务必调用父类上相应的 `parent::setUp()` / `parent::tearDown()` 方法。通常，你应该在自己的 `setUp` 方法开头调用 `parent::setUp()`，并在自己的 `tearDown` 方法结尾调用 `parent::tearDown()`。

## 运行测试

如前所述，编写测试后，你可以使用 `pest` 或 `phpunit` 运行它们：

```shell tab=Pest
./vendor/bin/pest
```

```shell tab=PHPUnit
./vendor/bin/phpunit
```

除了 `pest` 或 `phpunit` 命令外，你还可以使用 `test` Artisan 命令来运行测试。Artisan 测试运行器提供详细的测试报告，以便于开发和调试：

```shell
php artisan test
```

任何可以传递给 `pest` 或 `phpunit` 命令的参数也可以传递给 Artisan 的 `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

### 并行运行测试

默认情况下，Laravel 和 Pest / PHPUnit 会在单个进程中顺序执行你的测试。不过，你可以通过跨多个进程同时运行测试来大幅减少运行测试所需的时间。要开始使用，你应该将 `brianium/paratest` Composer 包作为"dev"依赖安装。然后，在执行 `test` Artisan 命令时包含 `--parallel` 选项：

```shell
composer require brianium/paratest --dev

php artisan test --parallel
```

默认情况下，Laravel 会创建与你的机器上可用 CPU 核心数一样多的进程。不过，你可以使用 `--processes` 选项调整进程数量：

```shell
php artisan test --parallel --processes=4
```

> [!WARNING]
> 并行运行测试时，某些 Pest / PHPUnit 选项（例如 `--do-not-cache-result`）可能不可用。

#### 并行测试与数据库

只要你已经配置了一个主数据库连接，Laravel 就会自动为每个运行测试的并行进程创建并迁移一个测试数据库。测试数据库将附加一个进程令牌作为后缀，该令牌在每个进程中是唯一的。例如，如果你有两个并行测试进程，Laravel 将创建并使用 `your_db_test_1` 和 `your_db_test_2` 测试数据库。

默认情况下，测试数据库在调用 `test` Artisan 命令之间会保留，以便后续的 `test` 调用可以再次使用它们。不过，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

#### 并行测试钩子

偶尔，你可能需要准备应用程序测试所使用的某些资源，以便它们能被多个测试进程安全使用。

使用 `ParallelTesting` Facade，你可以指定在进程的 `setUp` 和 `tearDown` 或测试用例上执行的代码。给定的闭包接收 `$token` 和 `$testCase` 变量，它们分别包含进程令牌和当前测试用例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\ServiceProvider;
use PHPUnit\Framework\TestCase;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        ParallelTesting::setUpProcess(function (int $token) {
            // ...
        });

        ParallelTesting::setUpTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        // 在创建测试数据库时执行...
        ParallelTesting::setUpTestDatabase(function (string $database, int $token) {
            Artisan::call('db:seed');
        });

        ParallelTesting::tearDownTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        ParallelTesting::tearDownProcess(function (int $token) {
            // ...
        });
    }
}
```

#### 获取并行测试令牌

如果你想从应用程序测试代码中的任何其他位置访问当前的并行进程"令牌"，可以使用 `token` 方法。该令牌是单个测试进程的唯一字符串标识符，可用于在并行测试进程之间分隔资源。例如，Laravel 会自动将此令牌附加到每个并行测试进程创建的测试数据库的末尾：

    $token = ParallelTesting::token();

### 报告测试覆盖率

> [!WARNING]
> 此功能需要 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

运行应用程序测试时，你可能想确定你的测试用例是否真正覆盖了应用程序代码，以及在运行测试时使用了多少应用程序代码。为此，你可以在调用 `test` 命令时提供 `--coverage` 选项：

```shell
php artisan test --coverage
```

#### 强制最低覆盖率阈值

你可以使用 `--min` 选项为应用程序定义最低测试覆盖率阈值。如果未达到该阈值，测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```

### 分析测试性能

Artisan 测试运行器还包含一个便捷的机制，用于列出你的应用程序最慢的测试。使用 `--profile` 选项调用 `test` 命令，即可获得十个最慢测试的列表，让你轻松调查哪些测试可以改进以加快测试套件的速度：

```shell
php artisan test --profile
```

## 配置缓存

运行测试时，Laravel 会为每个单独的测试方法引导（Bootstrap）应用程序。如果没有缓存的配置文件，在测试开始时就必须在应用程序中加载每个配置文件。为了在单次运行中构建一次配置并将其重新用于所有测试，你可以使用 `Illuminate\Foundation\Testing\WithCachedConfig` Trait：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\WithCachedConfig;

pest()->use(WithCachedConfig::class);

// ...
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithCachedConfig;
use Tests\TestCase;

class ConfigTest extends TestCase
{
    use WithCachedConfig;

    // ...
}
```
