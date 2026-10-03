# 测试：入门

- [简介](#introduction)
- [环境](#environment)
- [创建测试](#creating-tests)
- [运行测试](#running-tests)
    - [并行运行测试](#running-tests-in-parallel)
    - [报告测试覆盖率](#reporting-test-coverage)
    - [分析测试性能](#profiling-tests)

<a name="introduction"></a>
## 简介

Laravel 在设计之初就考虑了测试。事实上，它开箱即用地支持使用 [Pest](https://pestphp.com) 和 [PHPUnit](https://phpunit.de)，并且已经为你的应用配置好 `phpunit.xml` 文件。框架还提供了方便的辅助方法，让你能够以富有表达力的方式测试应用。

默认情况下，应用的 `tests` 目录包含两个目录：`Feature` 和 `Unit`。单元测试只关注代码中非常小且隔离的部分。事实上，大多数单元测试可能只针对一个方法。"Unit" 测试目录中的测试不会启动你的 Laravel 应用，因此无法访问应用的数据库或其他框架服务。

功能测试则可以覆盖更大范围的代码，包括多个对象之间如何交互，甚至是对 JSON 端点发起的完整 HTTP 请求。**总体而言，你的多数测试都应是功能测试。这类测试最能让你确信整个系统按预期运行。**

`Feature` 和 `Unit` 两个测试目录中都提供了一个 `ExampleTest.php` 文件。安装新的 Laravel 应用后，执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令即可运行测试。

<a name="environment"></a>
## 环境

由于 `phpunit.xml` 文件中定义的环境变量，运行测试时 Laravel 会自动把[配置环境](/docs/{{version}}/configuration#environment-configuration)设置为 `testing`。Laravel 还会自动把会话和缓存配置为 `array` 驱动，使测试期间不会持久化任何会话或缓存数据。

你可以根据需要自由定义其他测试环境配置值。`testing` 环境变量可以在应用的 `phpunit.xml` 文件中配置，但请务必在运行测试前使用 `config:clear` Artisan 命令清除配置缓存！

<a name="the-env-testing-environment-file"></a>
#### `.env.testing` 环境文件

此外，你还可以在项目根目录创建 `.env.testing` 文件。运行 Pest 和 PHPUnit 测试，或执行带 `--env=testing` 选项的 Artisan 命令时，会使用该文件代替 `.env` 文件。

<a name="creating-tests"></a>
## 创建测试

要创建新的测试用例，请使用 `make:test` Artisan 命令。默认情况下，测试会被放到 `tests/Feature` 目录中：

```shell
php artisan make:test UserTest
```

如果你想在 `tests/Unit` 目录中创建测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

> [!NOTE]
> 测试桩文件可以通过[桩发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

测试生成后，你可以像平常一样使用 Pest 或 PHPUnit 定义测试。要运行测试，请在终端执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令：

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
> 如果你在测试类中定义了自己的 `setUp` / `tearDown` 方法，请务必在父类中调用相应的 `parent::setUp()` / `parent::tearDown()` 方法。通常，你应在自己的 `setUp` 方法开头调用 `parent::setUp()`，在 `tearDown` 方法末尾调用 `parent::tearDown()`。

<a name="running-tests"></a>
## 运行测试

如前所述，写好测试后，你可以使用 `pest` 或 `phpunit` 运行它们：

```shell tab=Pest
./vendor/bin/pest
```

```shell tab=PHPUnit
./vendor/bin/phpunit
```

除了 `pest` 或 `phpunit` 命令，你还可以使用 `test` Artisan 命令运行测试。Artisan 测试运行器提供详细的测试报告，以便于开发和调试：

```shell
php artisan test
```

任何可以传给 `pest` 或 `phpunit` 命令的参数，同样也可以传给 Artisan `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

<a name="running-tests-in-parallel"></a>
### 并行运行测试

默认情况下，Laravel 和 Pest / PHPUnit 会在单个进程中按顺序执行你的测试。不过，你可以通过在多个进程中同时运行测试大幅缩短测试耗时。要开始使用，你应把 `brianium/paratest` Composer 包安装为 "dev" 依赖，然后在执行 `test` Artisan 命令时加上 `--parallel` 选项：

```shell
composer require brianium/paratest --dev

php artisan test --parallel
```

默认情况下，Laravel 会创建与机器上可用 CPU 核心数相同的进程数。不过，你可以使用 `--processes` 选项调整进程数量：

```shell
php artisan test --parallel --processes=4
```

> [!WARNING]
> 并行运行测试时，某些 Pest / PHPUnit 选项（例如 `--do-not-cache-result`）可能不可用。

<a name="parallel-testing-and-databases"></a>
#### 并行测试与数据库

只要你配置了主数据库连接，Laravel 就会自动为每个运行测试的并行进程创建并迁移测试数据库。这些测试数据库会带上按进程区分的唯一标记后缀。例如，如果你有两个并行测试进程，Laravel 会创建并使用 `your_db_test_1` 和 `your_db_test_2` 测试数据库。

默认情况下，测试数据库在多次调用 `test` Artisan 命令之间会保留，以便后续的 `test` 调用可以再次使用。不过，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

<a name="parallel-testing-hooks"></a>
#### 并行测试钩子

有时你需要准备应用测试所用的某些资源，以便多个测试进程可以安全地使用它们。

借助 `ParallelTesting` Facade，你可以指定在某个进程或测试用例的 `setUp` 和 `tearDown` 阶段执行的代码。给定的闭包会分别接收到包含进程标记和当前测试用例的 `$token` 与 `$testCase` 变量：

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

        // 创建测试数据库时执行……
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
#### 访问并行测试标记

如果你想在应用测试代码的其他位置访问当前的并行进程"标记"，可以使用 `token` 方法。该标记是单个测试进程的唯一字符串标识，可用于在并行测试进程之间划分资源。例如，Laravel 会自动把该标记追加到每个并行测试进程所创建的测试数据库末尾：

```php
$token = ParallelTesting::token();
```

<a name="reporting-test-coverage"></a>
### 报告测试覆盖率

> [!WARNING]
> 此功能需要 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

运行应用测试时，你可能想确定测试用例是否真的覆盖了应用代码，以及运行测试时使用了多少应用代码。为此，你可以在调用 `test` 命令时提供 `--coverage` 选项：

```shell
php artisan test --coverage
```

<a name="enforcing-a-minimum-coverage-threshold"></a>
#### 强制最低覆盖率阈值

你可以使用 `--min` 选项为应用定义一个最低测试覆盖率阈值。如果未达到该阈值，测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```

<a name="profiling-tests"></a>
### 分析测试性能

Artisan 测试运行器还包含一个方便的机制，用于列出应用中运行最慢的测试。调用 `test` 命令时加上 `--profile` 选项，即可看到最慢的十个测试的列表，从而轻松排查哪些测试可以优化以加快测试套件速度：

```shell
php artisan test --profile
```
