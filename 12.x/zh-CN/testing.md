# 测试：入门

- [简介](#introduction)
- [环境](#environment)
- [创建测试](#creating-tests)
- [运行测试](#running-tests)
    - [并行运行测试](#running-tests-in-parallel)
    - [报告测试覆盖率](#reporting-test-coverage)
    - [分析测试性能](#profiling-tests)
- [配置缓存](#configuration-caching)

<a name="introduction"></a>
## 简介

Laravel 在设计之初就考虑到了测试。事实上，框架已内置对 [Pest](https://pestphp.com) 和 [PHPUnit](https://phpunit.de) 测试的支持，并为你的应用预先配置好了 `phpunit.xml` 文件。框架还提供了便捷的辅助方法，让你能够富有表现力地测试自己的应用。

默认情况下，应用的 `tests` 目录包含两个子目录：`Feature` 和 `Unit`。单元测试专注于测试代码中非常小、相互隔离的部分。实际上，大多数单元测试可能只针对单个方法。「Unit」测试目录中的测试不会启动 Laravel 应用，因此无法访问应用的数据库或其他框架服务。

功能测试（Feature tests）可以测试更大范围的代码，包括多个对象之间的交互，甚至是发往 JSON 端点的完整 HTTP 请求。**一般来说，你的大部分测试都应该是功能测试。这类测试能最大程度地保证系统整体按预期运行。**

`Feature` 和 `Unit` 测试目录中都提供了一个 `ExampleTest.php` 文件。安装好新的 Laravel 应用后，执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令即可运行测试。

<a name="environment"></a>
## 环境

运行测试时，由于 `phpunit.xml` 文件中定义了相应的环境变量，Laravel 会自动将[配置环境](/docs/{{version}}/configuration#environment-configuration)设置为 `testing`。Laravel 还会自动将 session 和缓存配置为 `array` 驱动，这样在测试期间就不会持久化任何 session 或缓存数据。

你可以根据需要定义其他测试环境的配置值。`testing` 环境变量可以在应用的 `phpunit.xml` 文件中配置，但在运行测试之前，请务必使用 `config:clear` Artisan 命令清除配置缓存！

<a name="the-env-testing-environment-file"></a>
#### `.env.testing` 环境文件

此外，你可以在项目根目录下创建一个 `.env.testing` 文件。运行 Pest 和 PHPUnit 测试，或使用 `--env=testing` 选项执行 Artisan 命令时，将使用该文件来代替 `.env` 文件。

<a name="creating-tests"></a>
## 创建测试

要创建新的测试用例，可以使用 `make:test` Artisan 命令。默认情况下，测试会被放置在 `tests/Feature` 目录中：

```shell
php artisan make:test UserTest
```

如果想在 `tests/Unit` 目录中创建测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

> [!NOTE]
> 可以使用[.stub 发布](/docs/{{version}}/artisan#stub-customization)来自定义测试桩（stub）。

生成测试后，你就可以像往常一样使用 Pest 或 PHPUnit 来定义测试。要运行测试，请在终端中执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令：

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
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $this->assertTrue(true);
    }
}
```

> [!WARNING]
> 如果你在测试类中定义了自己的 `setUp` / `tearDown` 方法，请务必在父类上调用相应的 `parent::setUp()` / `parent::tearDown()` 方法。通常，你应该在自己的 `setUp` 方法开头调用 `parent::setUp()`，在 `tearDown` 方法的末尾调用 `parent::tearDown()`。

<a name="running-tests"></a>
## 运行测试

如前所述，编写好测试后，你可以使用 `pest` 或 `phpunit` 来运行它们：

```shell tab=Pest
./vendor/bin/pest
```

```shell tab=PHPUnit
./vendor/bin/phpunit
```

除了 `pest` 或 `phpunit` 命令之外，你还可以使用 `test` Artisan 命令来运行测试。Artisan 测试运行器会提供详尽的测试报告，便于开发与调试：

```shell
php artisan test
```

所有可以传递给 `pest` 或 `phpunit` 命令的参数，同样可以传递给 Artisan 的 `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

<a name="running-tests-in-parallel"></a>
### 并行运行测试

默认情况下，Laravel 和 Pest / PHPUnit 会在单个进程中顺序执行测试。不过，你可以让测试在多个进程中同时运行，从而大幅缩短测试的运行时间。开始之前，你需要将 `brianium/paratest` Composer 包安装为「dev」依赖。然后，在执行 `test` Artisan 命令时加上 `--parallel` 选项：

```shell
composer require brianium/paratest --dev

php artisan test --parallel
```

默认情况下，Laravel 会根据你机器上可用的 CPU 核心数创建尽可能多的进程。你也可以使用 `--processes` 选项来调整进程数量：

```shell
php artisan test --parallel --processes=4
```

> [!WARNING]
> 并行运行测试时，部分 Pest / PHPUnit 选项（例如 `--do-not-cache-result`）可能不可用。

<a name="parallel-testing-and-databases"></a>
#### 并行测试与数据库

只要你配置了主数据库连接，Laravel 就会自动为每个运行测试的并行进程创建并迁移测试数据库。测试数据库会以每个进程独有的进程令牌（token）作为后缀。例如，如果你有两个并行的测试进程，Laravel 将创建并使用 `your_db_test_1` 和 `your_db_test_2` 这两个测试数据库。

默认情况下，测试数据库在多次调用 `test` Artisan 命令之间会一直保留，以便后续的 `test` 调用可以复用它们。不过，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

<a name="parallel-testing-hooks"></a>
#### 并行测试钩子

有时，你可能需要为应用测试所使用的某些资源做准备，使其能够安全地被多个测试进程使用。

使用 `ParallelTesting` Facade，你可以指定在进程或测试用例的 `setUp` 和 `tearDown` 时执行的代码。给定的闭包会分别接收 `$token` 和 `$testCase` 变量，其中包含进程令牌和当前测试用例：

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
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        ParallelTesting::setUpProcess(function (int $token) {
            // ...
        });

        ParallelTesting::setUpTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        // 创建测试数据库时执行...
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

<a name="accessing-the-parallel-testing-token"></a>
#### 访问并行测试令牌

如果想从应用测试代码中的任何其他位置访问当前并行进程的「令牌」（token），可以使用 `token` 方法。该令牌是单个测试进程的惟一字符串标识符，可用于在多个并行测试进程之间划分资源。例如，Laravel 会自动将该令牌追加到每个并行测试进程所创建的测试数据库的末尾：

    $token = ParallelTesting::token();

<a name="reporting-test-coverage"></a>
### 报告测试覆盖率

> [!WARNING]
> 此功能需要安装 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

在运行应用测试时，你可能想了解测试用例是否真正覆盖了应用代码，以及运行测试时用到了多少应用代码。为此，你可以在调用 `test` 命令时加上 `--coverage` 选项：

```shell
php artisan test --coverage
```

<a name="enforcing-a-minimum-coverage-threshold"></a>
#### 强制执行最低覆盖率阈值

你可以使用 `--min` 选项为应用定义最低测试覆盖率阈值。如果达不到该阈值，测试套件将会失败：

```shell
php artisan test --coverage --min=80.3
```

<a name="profiling-tests"></a>
### 分析测试性能

Artisan 测试运行器还内置了一个便捷机制，用于列出应用中最慢的测试。带上 `--profile` 选项调用 `test` 命令，即可得到十个最慢测试的列表，方便你排查哪些测试可以改进，从而加速整个测试套件：

```shell
php artisan test --profile
```

<a name="configuration-caching"></a>
## 配置缓存

运行测试时，Laravel 会为每个测试方法启动一次应用。如果没有缓存的配置文件，应用中的每个配置文件都必须在测试开始时加载。要只构建一次配置，并在单次运行的所有测试中复用它，你可以使用 `Illuminate\Foundation\Testing\WithCachedConfig` Trait：

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
