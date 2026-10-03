# 测试：入门

- [简介](#introduction)
- [环境](#environment)
- [创建测试](#creating-tests)
- [运行测试](#running-tests)
    - [并行运行测试](#running-tests-in-parallel)
    - [报告测试覆盖率](#reporting-test-coverage)

<a name="introduction"></a>
## 简介

Laravel 在构建时就考虑了测试。事实上，开箱即用地包含了对 PHPUnit 测试的支持，并且已经为你的应用程序设置了 `phpunit.xml` 文件。框架还提供了便捷的辅助方法，让你能够富有表现力地测试你的应用程序。

默认情况下，应用程序的 `tests` 目录包含两个目录：`Feature` 和 `Unit`。单元测试专注于代码中非常小、孤立的部分。事实上，大多数单元测试可能只专注于单个方法。"Unit" 测试目录中的测试不会引导启动你的 Laravel 应用程序，因此无法访问应用程序的数据库或其他框架服务。

功能测试可以测试更大范围的代码，包括多个对象如何相互交互，甚至是对 JSON 端点的完整 HTTP 请求。**通常，你的大多数测试应该是功能测试。这类测试最能让你确信整个系统按预期运行。**

`Feature` 和 `Unit` 测试目录中都提供了一个 `ExampleTest.php` 文件。安装新的 Laravel 应用程序后，执行 `vendor/bin/phpunit` 或 `php artisan test` 命令来运行测试。

<a name="environment"></a>
## 环境

运行测试时，由于 `phpunit.xml` 文件中定义的环境变量，Laravel 会自动将[配置环境](/docs/{{version}}/configuration#environment-configuration)设置为 `testing`。Laravel 还会在测试时自动将会话和缓存配置为 `array` 驱动，这意味着测试时不会持久化任何会话或缓存数据。

你可以根据需要自由定义其他测试环境配置值。测试环境变量可以在应用程序的 `phpunit.xml` 文件中配置，但在运行测试之前，请确保使用 `config:clear` Artisan 命令清除配置缓存！

<a name="the-env-testing-environment-file"></a>
#### `.env.testing` 环境文件

此外，你可以在项目根目录中创建一个 `.env.testing` 文件。在运行 PHPUnit 测试或执行带 `--env=testing` 选项的 Artisan 命令时，将使用此文件代替 `.env` 文件。

<a name="the-creates-application-trait"></a>
#### `CreatesApplication` Trait

Laravel 包含一个 `CreatesApplication` Trait，它被应用于应用程序的基础 `TestCase` 类。此 Trait 包含一个 `createApplication` 方法，用于在运行测试之前引导启动 Laravel 应用程序。请务必将此 Trait 保留在原始位置，因为某些功能（如 Laravel 的并行测试功能）依赖于它。

<a name="creating-tests"></a>
## 创建测试

要创建新的测试用例，使用 `make:test` Artisan 命令。默认情况下，测试将放置在 `tests/Feature` 目录中：

```shell
php artisan make:test UserTest
```

如果你希望在 `tests/Unit` 目录中创建测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

如果你希望创建 [Pest PHP](https://pestphp.com) 测试，可以在 `make:test` 命令中提供 `--pest` 选项：

```shell
php artisan make:test UserTest --pest
php artisan make:test UserTest --unit --pest
```

> **Note**  
> 可以使用 [stub 发布](/docs/{{version}}/artisan#stub-customization)来自定义测试 stub。

测试生成后，你可以像通常使用 [PHPUnit](https://phpunit.de) 那样定义测试方法。要运行测试，在终端中执行 `vendor/bin/phpunit` 或 `php artisan test` 命令：

    <?php

    namespace Tests\Unit;

    use PHPUnit\Framework\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础测试示例。
         *
         * @return void
         */
        public function test_basic_test()
        {
            $this->assertTrue(true);
        }
    }

> **Warning**  
> 如果你在测试类中定义了自己的 `setUp` / `tearDown` 方法，请确保在父类上调用相应的 `parent::setUp()` / `parent::tearDown()` 方法。

<a name="running-tests"></a>
## 运行测试

如前所述，编写测试后，你可以使用 `phpunit` 运行它们：

```shell
./vendor/bin/phpunit
```

除了 `phpunit` 命令外，你还可以使用 `test` Artisan 命令来运行测试。Artisan 测试运行器提供详细的测试报告，以简化开发和调试：

```shell
php artisan test
```

可以传递给 `phpunit` 命令的任何参数也可以传递给 Artisan `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

<a name="running-tests-in-parallel"></a>
### 并行运行测试

默认情况下，Laravel 和 PHPUnit 在单个进程中按顺序执行测试。但是，你可以通过在多个进程中同时运行测试来大幅减少运行测试所需的时间。首先，确保你的应用程序依赖 `nunomaduro/collision` 包的 `^5.3` 或更高版本。然后，在执行 `test` Artisan 命令时包含 `--parallel` 选项：

```shell
php artisan test --parallel
```

默认情况下，Laravel 会根据你机器上可用的 CPU 核心数创建尽可能多的进程。但是，你可以使用 `--processes` 选项调整进程数：

```shell
php artisan test --parallel --processes=4
```

> **Warning**  
> 并行运行测试时，某些 PHPUnit 选项（如 `--do-not-cache-result`）可能不可用。

<a name="parallel-testing-and-databases"></a>
#### 并行测试与数据库

只要你配置了主数据库连接，Laravel 就会自动为每个运行测试的并行进程创建和迁移测试数据库。测试数据库会附加一个每个进程唯一的进程令牌。例如，如果你有两个并行测试进程，Laravel 将创建并使用 `your_db_test_1` 和 `your_db_test_2` 测试数据库。

默认情况下，测试数据库在调用 `test` Artisan 命令之间持久存在，以便后续 `test` 调用可以再次使用它们。但是，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

<a name="parallel-testing-hooks"></a>
#### 并行测试钩子

有时，你可能需要准备应用程序测试使用的某些资源，以便多个测试进程可以安全使用它们。

使用 `ParallelTesting` Facade，你可以指定在进程或测试用例的 `setUp` 和 `tearDown` 时执行的代码。给定的闭包分别接收包含进程令牌和当前测试用例的 `$token` 和 `$testCase` 变量：

    <?php

    namespace App\Providers;

    use Illuminate\Support\Facades\Artisan;
    use Illuminate\Support\Facades\ParallelTesting;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 引导启动任何应用程序服务。
         *
         * @return void
         */
        public function boot()
        {
            ParallelTesting::setUpProcess(function ($token) {
                // ...
            });

            ParallelTesting::setUpTestCase(function ($token, $testCase) {
                // ...
            });

            // 创建测试数据库时执行...
            ParallelTesting::setUpTestDatabase(function ($database, $token) {
                Artisan::call('db:seed');
            });

            ParallelTesting::tearDownTestCase(function ($token, $testCase) {
                // ...
            });

            ParallelTesting::tearDownProcess(function ($token) {
                // ...
            });
        }
    }

<a name="accessing-the-parallel-testing-token"></a>
#### 访问并行测试令牌

如果你希望从应用程序测试代码的任何其他位置访问当前并行进程的"令牌"，可以使用 `token` 方法。此令牌是单个测试进程的唯一字符串标识符，可用于在并行测试进程之间分割资源。例如，Laravel 会自动将此令牌附加到每个并行测试进程创建的测试数据库末尾：

    $token = ParallelTesting::token();

<a name="reporting-test-coverage"></a>
### 报告测试覆盖率

> **Warning**  
> 此功能需要 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

运行应用程序测试时，你可能想要确定测试用例是否实际覆盖了应用程序代码，以及运行测试时使用了多少应用程序代码。为此，你可以在调用 `test` 命令时提供 `--coverage` 选项：

```shell
php artisan test --coverage
```

<a name="enforcing-a-minimum-coverage-threshold"></a>
#### 强制最低覆盖率阈值

你可以使用 `--min` 选项为应用程序定义最低测试覆盖率阈值。如果未达到此阈值，测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```
