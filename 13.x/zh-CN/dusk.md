# Laravel Dusk

- [简介](#introduction)
- [安装](#installation)
    - [管理 ChromeDriver 安装](#managing-chromedriver-installations)
    - [使用其它浏览器](#using-other-browsers)
- [快速开始](#getting-started)
    - [生成测试](#generating-tests)
    - [每次测试后重置数据库](#resetting-the-database-after-each-test)
    - [运行测试](#running-tests)
    - [环境处理](#environment-handling)
- [浏览器基础](#browser-basics)
    - [创建浏览器](#creating-browsers)
    - [导航](#navigation)
    - [调整浏览器窗口大小](#resizing-browser-windows)
    - [浏览器宏](#browser-macros)
    - [认证](#authentication)
    - [Cookie](#cookies)
    - [执行 JavaScript](#executing-javascript)
    - [截图](#taking-a-screenshot)
    - [将控制台输出存储到磁盘](#storing-console-output-to-disk)
    - [将页面源码存储到磁盘](#storing-page-source-to-disk)
- [与元素交互](#interacting-with-elements)
    - [Dusk 选择器](#dusk-selectors)
    - [文本、值与属性](#text-values-and-attributes)
    - [与表单交互](#interacting-with-forms)
    - [附加文件](#attaching-files)
    - [按下按钮](#pressing-buttons)
    - [点击链接](#clicking-links)
    - [使用键盘](#using-the-keyboard)
    - [使用鼠标](#using-the-mouse)
    - [JavaScript 对话框](#javascript-dialogs)
    - [与内联框架交互](#interacting-with-iframes)
    - [限定选择器作用域](#scoping-selectors)
    - [等待元素](#waiting-for-elements)
    - [将元素滚动到视图中](#scrolling-an-element-into-view)
- [可用的断言](#available-assertions)
- [页面](#pages)
    - [生成页面](#generating-pages)
    - [配置页面](#configuring-pages)
    - [导航到页面](#navigating-to-pages)
    - [简写选择器](#shorthand-selectors)
    - [页面方法](#page-methods)
- [组件](#components)
    - [生成组件](#generating-components)
    - [使用组件](#using-components)
- [持续集成](#continuous-integration)
    - [Heroku CI](#running-tests-on-heroku-ci)
    - [Travis CI](#running-tests-on-travis-ci)
    - [GitHub Actions](#running-tests-on-github-actions)
    - [Chipper CI](#running-tests-on-chipper-ci)

<a name="introduction"></a>
## 简介

> [!WARNING]
> [Pest 4](https://pestphp.com/) 现已内置自动化浏览器测试，相较 Laravel Dusk 在性能与易用性上均有显著提升。对于新项目，我们建议使用 Pest 进行浏览器测试。

[Laravel Dusk](https://github.com/laravel/dusk) 提供了一套富有表现力、易于使用的浏览器自动化与测试 API。默认情况下，Dusk 不需要你在本地计算机上安装 JDK 或 Selenium，而是使用一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装。当然，你也可以自由使用任何其它兼容 Selenium 的驱动程序。

<a name="installation"></a>
## 安装

要开始使用，你需要安装 [Google Chrome](https://www.google.com/chrome)，并将 `laravel/dusk` Composer 依赖添加到你的项目：

```shell
composer require laravel/dusk --dev
```

> [!WARNING]
> 如果你手动注册 Dusk 的服务提供者（Service Provider），则**绝不要**在生产环境中注册它，否则可能导致任意用户都能通过认证登录你的应用。

安装 Dusk 包之后，执行 `dusk:install` Artisan 命令。该命令会创建 `tests/Browser` 目录、一个示例 Dusk 测试，并为你的操作系统安装 Chrome Driver 二进制文件：

```shell
php artisan dusk:install
```

接下来，在应用的 `.env` 文件中设置 `APP_URL` 环境变量。该值应与你在浏览器中访问应用所用的 URL 一致。

> [!NOTE]
> 如果你使用 [Laravel Sail](/docs/{{version}}/sail) 管理本地开发环境，请参阅 Sail 文档中关于[配置并运行 Dusk 测试](/docs/{{version}}/sail#laravel-dusk)的部分。

<a name="managing-chromedriver-installations"></a>
### 管理 ChromeDriver 安装

如果你希望安装与 Laravel Dusk 通过 `dusk:install` 命令所安装版本不同的 ChromeDriver，可以使用 `dusk:chrome-driver` 命令：

```shell
# 为你的操作系统安装最新版本的 ChromeDriver……
php artisan dusk:chrome-driver

# 为你的操作系统安装指定版本的 ChromeDriver……
php artisan dusk:chrome-driver 86

# 为所有受支持的操作系统安装指定版本的 ChromeDriver……
php artisan dusk:chrome-driver --all

# 安装与你的操作系统检测到的 Chrome / Chromium 版本相匹配的 ChromeDriver……
php artisan dusk:chrome-driver --detect
```

> [!WARNING]
> Dusk 要求 `chromedriver` 二进制文件具有可执行权限。如果你在运行 Dusk 时遇到问题，应确保这些二进制文件可通过以下命令获得可执行权限：`chmod -R 0755 vendor/laravel/dusk/bin/`。

<a name="using-other-browsers"></a>
### 使用其它浏览器

默认情况下，Dusk 使用 Google Chrome 以及一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装来运行你的浏览器测试。不过，你也可以启动自己的 Selenium 服务器，并对任意你希望的浏览器运行测试。

要开始，打开你的 `tests/DuskTestCase.php` 文件，它是应用的基础 Dusk 测试用例。在该文件中，你可以移除对 `startChromeDriver` 方法的调用，这将阻止 Dusk 自动启动 ChromeDriver：

```php
/**
 * 准备 Dusk 测试执行。
 *
 * @beforeClass
 */
public static function prepare(): void
{
    // static::startChromeDriver();
}
```

接下来，你可以修改 `driver` 方法以连接到你选择的 URL 和端口。此外，你还可以修改应传递给 WebDriver 的“期望能力（desired capabilities）”：

```php
use Facebook\WebDriver\Remote\RemoteWebDriver;

/**
 * 创建 RemoteWebDriver 实例。
 */
protected function driver(): RemoteWebDriver
{
    return RemoteWebDriver::create(
        'http://localhost:4444/wd/hub', DesiredCapabilities::phantomjs()
    );
}
```

<a name="getting-started"></a>
## 快速开始

<a name="generating-tests"></a>
### 生成测试

要生成一个 Dusk 测试，可以使用 `dusk:make` Artisan 命令。生成的测试将放置于 `tests/Browser` 目录：

```shell
php artisan dusk:make LoginTest
```

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

你编写的大多数测试会与从应用数据库检索数据的页面交互；然而，你的 Dusk 测试绝不应使用 `RefreshDatabase` trait。该 trait 依赖数据库事务，而事务在跨 HTTP 请求时并不适用或不可用。取而代之，你有两种选择：`DatabaseMigrations` trait 和 `DatabaseTruncation` trait。

<a name="reset-migrations"></a>
#### 使用数据库迁移

`DatabaseMigrations` trait 会在每次测试前运行你的数据库迁移。不过，为每个测试删除并重建数据库表通常比截断表更慢：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;

pest()->use(DatabaseMigrations::class);

//
```

```php tab=PHPUnit
<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    use DatabaseMigrations;

    //
}
```

> [!WARNING]
> 执行 Dusk 测试时不可使用 SQLite 内存数据库。由于浏览器运行在自身进程中，它无法访问其它进程的内存数据库。

<a name="reset-truncation"></a>
#### 使用数据库截断

`DatabaseTruncation` trait 会在首个测试时迁移你的数据库，以确保数据库表已正确创建。而在后续测试中，数据库表将仅被截断——相比重新运行全部数据库迁移能提供速度上的提升：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseTruncation;

pest()->use(DatabaseTruncation::class);

//
```

```php tab=PHPUnit
<?php

namespace Tests\Browser;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    use DatabaseTruncation;

    //
}
```

默认情况下，该 trait 会截断除 `migrations` 表之外的所有表。如果你希望自定义应被截断的表，可以在测试类上定义 `$tablesToTruncate` 属性：

> [!NOTE]
> 如果你使用 Pest，应在基础的 `DuskTestCase` 类或你的测试文件所继承的任何类上定义属性或方法。

```php
/**
 * 指示应被截断的表。
 *
 * @var array
 */
protected $tablesToTruncate = ['users'];
```

或者，你可以在测试类上定义 `$exceptTables` 属性，以指定哪些表应被排除在截断之外：

```php
/**
 * 指示应被排除在截断之外的表。
 *
 * @var array
 */
protected $exceptTables = ['users'];
```

要指定应被截断其表的数据库连接，你可以在测试类上定义 `$connectionsToTruncate` 属性：

```php
/**
 * 指示哪些连接应被截断其表。
 *
 * @var array
 */
protected $connectionsToTruncate = ['mysql'];
```

如果你希望在数据库截断执行前后运行代码，可以在测试类上定义 `beforeTruncatingDatabase` 或 `afterTruncatingDatabase` 方法：

```php
/**
 * 执行数据库开始截断前应进行的工作。
 */
protected function beforeTruncatingDatabase(): void
{
    //
}

/**
 * 执行数据库完成截断后应进行的工作。
 */
protected function afterTruncatingDatabase(): void
{
    //
}
```

<a name="running-tests"></a>
### 运行测试

要运行你的浏览器测试，执行 `dusk` Artisan 命令：

```shell
php artisan dusk
```

如果你上次运行 `dusk` 命令时遇到测试失败，可以使用 `dusk:fails` 命令先重新运行失败的测试以节省时间：

```shell
php artisan dusk:fails
```

`dusk` 命令接受 Pest / PHPUnit 测试运行器通常接受的任何参数，例如允许你仅运行给定[组](https://docs.phpunit.de/en/10.5/annotations.html#group)的测试：

```shell
php artisan dusk --group=foo
```

> [!NOTE]
> 如果你使用 [Laravel Sail](/docs/{{version}}/sail) 管理本地开发环境，请参阅 Sail 文档中关于[配置并运行 Dusk 测试](/docs/{{version}}/sail#laravel-dusk)的部分。

<a name="manually-starting-chromedriver"></a>
#### 手动启动 ChromeDriver

默认情况下，Dusk 会自动尝试启动 ChromeDriver。如果这在你的特定系统上无法工作，你可以在运行 `dusk` 命令前手动启动 ChromeDriver。如果你选择手动启动 ChromeDriver，应注释掉 `tests/DuskTestCase.php` 文件中的以下行：

```php
/**
 * 准备 Dusk 测试执行。
 *
 * @beforeClass
 */
public static function prepare(): void
{
    // static::startChromeDriver();
}
```

此外，如果你在 9515 之外的端口上启动了 ChromeDriver，应修改同一类的 `driver` 方法以反映正确的端口：

```php
use Facebook\WebDriver\Remote\RemoteWebDriver;

/**
 * 创建 RemoteWebDriver 实例。
 */
protected function driver(): RemoteWebDriver
{
    return RemoteWebDriver::create(
        'http://localhost:9515', DesiredCapabilities::chrome()
    );
}
```

<a name="environment-handling"></a>
### 环境处理

要强制 Dusk 在运行测试时使用它自己的环境文件，请在项目根目录创建一个 `.env.dusk.{environment}` 文件。例如，如果你将从 `local` 环境启动 `dusk` 命令，则应创建一个 `.env.dusk.local` 文件。

运行测试时，Dusk 会备份你的 `.env` 文件，并将你的 Dusk 环境重命名为 `.env`。测试完成后，你的 `.env` 文件将被恢复。

<a name="browser-basics"></a>
## 浏览器基础

<a name="creating-browsers"></a>
### 创建浏览器

要开始，我们先编写一个测试，验证我们可以登录应用。生成测试后，可以修改它，使其导航到登录页面、输入凭据并点击“Login”按钮。要创建浏览器实例，你可以在 Dusk 测试中调用 `browse` 方法：

```php tab=Pest
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;

pest()->use(DatabaseMigrations::class);

test('basic example', function () {
    $user = User::factory()->create([
        'email' => 'taylor@laravel.com',
    ]);

    $this->browse(function (Browser $browser) use ($user) {
        $browser->visit('/login')
            ->type('email', $user->email)
            ->type('password', 'password')
            ->press('Login')
            ->assertPathIs('/home');
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Browser;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    use DatabaseMigrations;

    /**
     * 一个基础的浏览器测试示例。
     */
    public function test_basic_example(): void
    {
        $user = User::factory()->create([
            'email' => 'taylor@laravel.com',
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('Login')
                ->assertPathIs('/home');
        });
    }
}
```

如上方示例所示，`browse` 方法接受一个闭包。浏览器实例将由 Dusk 自动传入该闭包，它是用于与应用交互并作出断言的主要对象。

<a name="creating-multiple-browsers"></a>
#### 创建多个浏览器

有时你可能需要多个浏览器才能正确执行测试。例如，测试与 websocket 交互的聊天界面可能需要多个浏览器。要创建多个浏览器，只需向传给 `browse` 方法的闭包签名中添加更多浏览器参数：

```php
$this->browse(function (Browser $first, Browser $second) {
    $first->loginAs(User::find(1))
        ->visit('/home')
        ->waitForText('Message');

    $second->loginAs(User::find(2))
        ->visit('/home')
        ->waitForText('Message')
        ->type('message', 'Hey Taylor')
        ->press('Send');

    $first->waitForText('Hey Taylor')
        ->assertSee('Jeffrey Way');
});
```

<a name="navigation"></a>
### 导航

`visit` 方法可用于导航到应用内的给定 URI：

```php
$browser->visit('/login');
```

你可以使用 `visitRoute` 方法导航到[命名路由](/docs/{{version}}/routing#named-routes)：

```php
$browser->visitRoute($routeName, $parameters);
```

你可以使用 `back` 和 `forward` 方法导航“后退”和“前进”：

```php
$browser->back();

$browser->forward();
```

你可以使用 `refresh` 方法刷新页面：

```php
$browser->refresh();
```

<a name="resizing-browser-windows"></a>
### 调整浏览器窗口大小

你可以使用 `resize` 方法调整浏览器窗口的大小：

```php
$browser->resize(1920, 1080);
```

`maximize` 方法可用于最大化浏览器窗口：

```php
$browser->maximize();
```

`fitContent` 方法会将浏览器窗口调整为匹配其内容的大小：

```php
$browser->fitContent();
```

当测试失败时，Dusk 会在截图前自动调整浏览器大小以适配内容。你可以在测试中调用 `disableFitOnFailure` 方法禁用此功能：

```php
$browser->disableFitOnFailure();
```

你可以使用 `move` 方法将浏览器窗口移动到屏幕上的不同位置：

```php
$browser->move($x = 100, $y = 100);
```

<a name="browser-macros"></a>
### 浏览器宏

如果你希望定义一个可在各种测试中复用的自定义浏览器方法，可以使用 `Browser` 类上的 `macro` 方法。通常，你应该在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Dusk\Browser;

class DuskServiceProvider extends ServiceProvider
{
    /**
     * 注册 Dusk 的浏览器宏。
     */
    public function boot(): void
    {
        Browser::macro('scrollToElement', function (string $element = null) {
            $this->script("$('html, body').animate({ scrollTop: $('$element').offset().top }, 0);");

            return $this;
        });
    }
}
```

`macro` 函数以名称作为第一个参数，以闭包作为第二个参数。当作为 `Browser` 实例的方法调用该宏时，将执行该宏的闭包：

```php
$this->browse(function (Browser $browser) use ($user) {
    $browser->visit('/pay')
        ->scrollToElement('#credit-card-details')
        ->assertSee('Enter Credit Card Details');
});
```

<a name="authentication"></a>
### 认证

通常，你会测试需要认证的页面。你可以使用 Dusk 的 `loginAs` 方法，以避免在每个测试中与应用登录界面交互。`loginAs` 方法接受一个与主键关联的、可认证的模型或可调认证模型实例：

```php
use App\Models\User;
use Laravel\Dusk\Browser;

$this->browse(function (Browser $browser) {
    $browser->loginAs(User::find(1))
        ->visit('/home');
});
```

> [!WARNING]
> 使用 `loginAs` 方法后，用户会话将在该文件内的所有测试中保持。

<a name="cookies"></a>
### Cookie

你可以使用 `cookie` 方法获取或设置加密 Cookie 的值。默认情况下，Laravel 创建的所有 Cookie 都是加密的：

```php
$browser->cookie('name');

$browser->cookie('name', 'Taylor');
```

你可以使用 `plainCookie` 方法获取或设置未加密 Cookie 的值：

```php
$browser->plainCookie('name');

$browser->plainCookie('name', 'Taylor');
```

你可以使用 `deleteCookie` 方法删除给定 Cookie：

```php
$browser->deleteCookie('name');
```

<a name="executing-javascript"></a>
### 执行 JavaScript

你可以使用 `script` 方法在浏览器内执行任意 JavaScript 语句：

```php
$browser->script('document.documentElement.scrollTop = 0');

$browser->script([
    'document.body.scrollTop = 0',
    'document.documentElement.scrollTop = 0',
]);

$output = $browser->script('return window.location.pathname');
```

<a name="taking-a-screenshot"></a>
### 截图

你可以使用 `screenshot` 方法截图，并以给定文件名存储。所有截图都将存储在 `tests/Browser/screenshots` 目录：

```php
$browser->screenshot('filename');
```

`responsiveScreenshots` 方法可用于在不同断点处拍摄一系列截图：

```php
$browser->responsiveScreenshots('filename');
```

`screenshotElement` 方法可用于对页面上特定元素截图：

```php
$browser->screenshotElement('#selector', 'filename');
```

<a name="storing-console-output-to-disk"></a>
### 将控制台输出存储到磁盘

你可以使用 `storeConsoleLog` 方法将当前浏览器的控制台输出以给定文件名写入磁盘。控制台输出将存储在 `tests/Browser/console` 目录：

```php
$browser->storeConsoleLog('filename');
```

<a name="storing-page-source-to-disk"></a>
### 将页面源码存储到磁盘

你可以使用 `storeSource` 方法将当前页面的源码以给定文件名写入磁盘。页面源码将存储在 `tests/Browser/source` 目录：

```php
$browser->storeSource('filename');
```

<a name="interacting-with-elements"></a>
## 与元素交互

<a name="dusk-selectors"></a>
### Dusk 选择器

为与元素交互选择良好的 CSS 选择器是编写 Dusk 测试最困难的部分之一。随着时间的推移，前端变更可能导致如下 CSS 选择器让你的测试失效：

```html
// HTML……

<button>Login</button>
```

```php
// 测试……

$browser->click('.login-page .container div > button');
```

Dusk 选择器让你专注于编写有效的测试，而不必记住 CSS 选择器。要定义选择器，请在你的 HTML 元素上添加 `dusk` 属性。然后，在与 Dusk 浏览器交互时，在选择器前加上 `@` 以操作测试中的附加元素：

```html
// HTML……

<button dusk="login-button">Login</button>
```

```php
// 测试……

$browser->click('@login-button');
```

如果需要，你可以通过 `selectorHtmlAttribute` 方法自定义 Dusk 选择器所使用的 HTML 属性。通常，此方法应在应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Laravel\Dusk\Dusk;

Dusk::selectorHtmlAttribute('data-dusk');
```

<a name="text-values-and-attributes"></a>
### 文本、值与属性

<a name="retrieving-setting-values"></a>
#### 检索与设置值

Dusk 提供了多个用于与页面上元素的当前值、显示文本和属性交互的方法。例如，要获取匹配给定 CSS 或 Dusk 选择器的元素的“value”，使用 `value` 方法：

```php
// 检索值……
$value = $browser->value('selector');

// 设置值……
$browser->value('selector', 'value');
```

你可以使用 `inputValue` 方法获取具有给定字段名的输入元素的“value”：

```php
$value = $browser->inputValue('field');
```

<a name="retrieving-text"></a>
#### 检索文本

`text` 方法可用于检索匹配给定选择器的元素的显示文本：

```php
$text = $browser->text('selector');
```

<a name="retrieving-attributes"></a>
#### 检索属性

最后，`attribute` 方法可用于检索匹配给定选择器的元素的属性值：

```php
$attribute = $browser->attribute('selector', 'value');
```

<a name="interacting-with-forms"></a>
### 与表单交互

<a name="typing-values"></a>
#### 输入值

Dusk 提供了多种用于与表单和输入元素交互的方法。首先，我们来看一个向输入框输入文本的示例：

```php
$browser->type('email', 'taylor@laravel.com');
```

注意，尽管该方法在必要时接受一个 CSS 选择器，但我们无需向 `type` 方法传入 CSS 选择器。如果未提供 CSS 选择器，Dusk 会搜索具有给定 `name` 属性的 `input` 或 `textarea` 字段。

要向字段追加文本而不清除其内容，可以使用 `append` 方法：

```php
$browser->type('tags', 'foo')
    ->append('tags', ', bar, baz');
```

你可以使用 `clear` 方法清除输入的值：

```php
$browser->clear('email');
```

你可以指示 Dusk 使用 `typeSlowly` 方法缓慢输入。默认情况下，Dusk 会在两次按键之间暂停 100 毫秒。要自定义两次按键之间的时间，可以将适当的毫秒数作为第三个参数传给该方法：

```php
$browser->typeSlowly('mobile', '+1 (202) 555-5555');

$browser->typeSlowly('mobile', '+1 (202) 555-5555', 300);
```

你可以使用 `appendSlowly` 方法缓慢追加文本：

```php
$browser->type('tags', 'foo')
    ->appendSlowly('tags', ', bar, baz');
```

<a name="dropdowns"></a>
#### 下拉框

要选择 `select` 元素上可用的值，可以使用 `select` 方法。与 `type` 方法类似，`select` 方法不需要完整的 CSS 选择器。向 `select` 方法传值时，应传入底层的选项值，而不是显示文本：

```php
$browser->select('size', 'Large');
```

你可以通过省略第二个参数来选择一个随机选项：

```php
$browser->select('size');
```

通过向 `select` 方法提供数组作为第二个参数，你可以指示该方法选择多个选项：

```php
$browser->select('categories', ['Art', 'Music']);
```

<a name="checkboxes"></a>
#### 复选框

要“勾选”一个复选框输入，可以使用 `check` 方法。与许多其它与输入相关的方法类似，它不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 会搜索具有匹配 `name` 属性的复选框：

```php
$browser->check('terms');
```

`uncheck` 方法可用于“取消勾选”复选框输入：

```php
$browser->uncheck('terms');
```

<a name="radio-buttons"></a>
#### 单选按钮

要“选择”一个 `radio` 输入选项，可以使用 `radio` 方法。与许多其它与输入相关的方法类似，它不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 会搜索具有匹配 `name` 和 `value` 属性的 `radio` 输入：

```php
$browser->radio('size', 'large');
```

<a name="attaching-files"></a>
### 附加文件

`attach` 方法可用于将文件附加到 `file` 输入元素。与许多其它与输入相关的方法类似，它不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 会搜索具有匹配 `name` 属性的 `file` 输入：

```php
$browser->attach('photo', __DIR__.'/photos/mountains.png');
```

> [!WARNING]
> attach 函数要求服务器上已安装并启用 `Zip` PHP 扩展。

<a name="pressing-buttons"></a>
### 按下按钮

`press` 方法可用于点击页面上的按钮元素。传给 `press` 方法的参数可以是按钮的显示文本，也可以是 CSS / Dusk 选择器：

```php
$browser->press('Login');
```

提交表单时，许多应用会在按钮被按下后禁用表单的提交按钮，然后在表单提交的 HTTP 请求完成时重新启用按钮。要按下按钮并等待按钮重新启用，可以使用 `pressAndWaitFor` 方法：

```php
// 按下按钮并最多等待 5 秒让其启用……
$browser->pressAndWaitFor('Save');

// 按下按钮并最多等待 1 秒让其启用……
$browser->pressAndWaitFor('Save', 1);
```

<a name="clicking-links"></a>
### 点击链接

要点击链接，可以使用浏览器实例上的 `clickLink` 方法。`clickLink` 方法会点击具有给定显示文本的链接：

```php
$browser->clickLink($linkText);
```

你可以使用 `seeLink` 方法判断具有给定显示文本的链接是否在页面上可见：

```php
if ($browser->seeLink($linkText)) {
    // ……
}
```

> [!WARNING]
> 这些方法与 jQuery 交互。如果页面上不可用 jQuery，Dusk 会自动将其注入页面，使其在测试期间可用。

<a name="using-the-keyboard"></a>
### 使用键盘

`keys` 方法允许你向给定元素提供比 `type` 方法通常允许的更复杂的输入序列。例如，你可以指示 Dusk 在输入值时按住修饰键。在此示例中，当向匹配给定选择器的元素输入 `taylor` 时，会按住 `shift` 键。输入 `taylor` 之后，会在不使用任何修饰键的情况下输入 `swift`：

```php
$browser->keys('selector', ['{shift}', 'taylor'], 'swift');
```

`keys` 方法的另一个有价值的用例是向应用的主 CSS 选择器发送“键盘快捷键”组合：

```php
$browser->keys('.app', ['{command}', 'j']);
```

> [!NOTE]
> 所有修饰键（如 `{command}`）都用 `{}` 字符包裹，并与 `Facebook\WebDriver\WebDriverKeys` 类中定义的常量匹配，该类可在 [GitHub 上找到](https://github.com/php-webdriver/php-webdriver/blob/master/lib/WebDriverKeys.php)。

<a name="fluent-keyboard-interactions"></a>
#### 流畅键盘交互

Dusk 还提供 `withKeyboard` 方法，允许你通过 `Laravel\Dusk\Keyboard` 类流畅地执行复杂的键盘交互。`Keyboard` 类提供 `press`、`release`、`type` 和 `pause` 方法：

```php
use Laravel\Dusk\Keyboard;

$browser->withKeyboard(function (Keyboard $keyboard) {
    $keyboard->press('c')
        ->pause(1000)
        ->release('c')
        ->type(['c', 'e', 'o']);
});
```

<a name="keyboard-macros"></a>
#### 键盘宏

如果你希望定义可在整个测试套件中轻松复用的自定义键盘交互，可以使用 `Keyboard` 类提供的 `macro` 方法。通常，你应该在[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用此方法：

```php
<?php

namespace App\Providers;

use Facebook\WebDriver\WebDriverKeys;
use Illuminate\Support\ServiceProvider;
use Laravel\Dusk\Keyboard;
use Laravel\Dusk\OperatingSystem;

class DuskServiceProvider extends ServiceProvider
{
    /**
     * 注册 Dusk 的浏览器宏。
     */
    public function boot(): void
    {
        Keyboard::macro('copy', function (string $element = null) {
            $this->type([
                OperatingSystem::onMac() ? WebDriverKeys::META : WebDriverKeys::CONTROL, 'c',
            ]);

            return $this;
        });

        Keyboard::macro('paste', function (string $element = null) {
            $this->type([
                OperatingSystem::onMac() ? WebDriverKeys::META : WebDriverKeys::CONTROL, 'v',
            ]);

            return $this;
        });
    }
}
```

`macro` 函数以名称作为第一个参数，以闭包作为第二个参数。当作为 `Keyboard` 实例的方法调用该宏时，将执行该宏的闭包：

```php
$browser->click('@textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->copy())
    ->click('@another-textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->paste());
```

<a name="using-the-mouse"></a>
### 使用鼠标

<a name="clicking-on-elements"></a>
#### 点击元素

`click` 方法可用于点击匹配给定 CSS 或 Dusk 选择器的元素：

```php
$browser->click('.selector');
```

`clickAtXPath` 方法可用于点击匹配给定 XPath 表达式的元素：

```php
$browser->clickAtXPath('//div[@class = "selector"]');
```

`clickAtPoint` 方法可用于点击相对于浏览器可视区域给定坐标对处的最顶层元素：

```php
$browser->clickAtPoint($x = 0, $y = 0);
```

`doubleClick` 方法可用于模拟鼠标的双击：

```php
$browser->doubleClick();

$browser->doubleClick('.selector');
```

`rightClick` 方法可用于模拟鼠标的右键点击：

```php
$browser->rightClick();

$browser->rightClick('.selector');
```

`clickAndHold` 方法可用于模拟鼠标按键被点击并按住。随后对 `releaseMouse` 方法的调用将撤销此行为并释放鼠标按键：

```php
$browser->clickAndHold('.selector');

$browser->clickAndHold()
    ->pause(1000)
    ->releaseMouse();
```

`controlClick` 方法可用于模拟浏览器内的 `ctrl+click` 事件：

```php
$browser->controlClick();

$browser->controlClick('.selector');
```

`clickWhenVisible` 或 `clickWhenEnabled` 方法可用于在点击之前等待元素准备就绪，且恰好点击一次：

```php
$browser->clickWhenVisible('@save-button');
$browser->clickWhenEnabled('@submit-button');
```

<a name="mouseover"></a>
#### 鼠标悬停

当你需要将鼠标移动到匹配给定 CSS 或 Dusk 选择器的元素上时，可以使用 `mouseover` 方法：

```php
$browser->mouseover('.selector');
```

<a name="drag-drop"></a>
#### 拖放

`drag` 方法可用于将匹配给定选择器的元素拖到另一个元素：

```php
$browser->drag('.from-selector', '.to-selector');
```

或者，你可以在单一方向上拖动元素：

```php
$browser->dragLeft('.selector', $pixels = 10);
$browser->dragRight('.selector', $pixels = 10);
$browser->dragUp('.selector', $pixels = 10);
$browser->dragDown('.selector', $pixels = 10);
```

最后，你可以通过给定偏移量拖动元素：

```php
$browser->dragOffset('.selector', $x = 10, $y = 10);
```

<a name="javascript-dialogs"></a>
### JavaScript 对话框

Dusk 提供了多种与 JavaScript 对话框交互的方法。例如，你可以使用 `waitForDialog` 方法等待 JavaScript 对话框出现。该方法接受一个可选参数，指示等待对话框出现多少秒：

```php
$browser->waitForDialog($seconds = null);
```

`assertDialogOpened` 方法可用于断言对话框已显示并包含给定消息：

```php
$browser->assertDialogOpened('Dialog message');
```

如果 JavaScript 对话框包含提示，你可以使用 `typeInDialog` 方法在提示中输入值：

```php
$browser->typeInDialog('Hello World');
```

要通过点击“OK”按钮关闭已打开的 JavaScript 对话框，可以调用 `acceptDialog` 方法：

```php
$browser->acceptDialog();
```

要通过点击“Cancel”按钮关闭已打开的 JavaScript 对话框，可以调用 `dismissDialog` 方法：

```php
$browser->dismissDialog();
```

<a name="interacting-with-iframes"></a>
### 与内联框架交互

如果你需要与 iframe 内的元素交互，可以使用 `withinFrame` 方法。在提供给 `withinFrame` 方法的闭包内进行的所有元素交互，都将限定在指定 iframe 的上下文中：

```php
$browser->withinFrame('#credit-card-details', function ($browser) {
    $browser->type('input[name="cardnumber"]', '4242424242424242')
        ->type('input[name="exp-date"]', '1224')
        ->type('input[name="cvc"]', '123')
        ->press('Pay');
});
```

<a name="scoping-selectors"></a>
### 限定选择器作用域

有时你可能希望在将全部操作限定在给定选择器内的同时执行多个操作。例如，你可能希望断言某些文本仅存在于某个表中，然后点击该表内的按钮。你可以使用 `with` 方法来实现。在提供给 `with` 方法的闭包内执行的所有操作，都将限定在原始选择器的范围内：

```php
$browser->with('.table', function (Browser $table) {
    $table->assertSee('Hello World')
        ->clickLink('Delete');
});
```

你可能偶尔需要在当前作用域之外执行断言。你可以使用 `elsewhere` 和 `elsewhereWhenAvailable` 方法来实现：

```php
$browser->with('.table', function (Browser $table) {
    // 当前作用域是 `body .table`……

    $browser->elsewhere('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`……
        $title->assertSee('Hello World');
    });

    $browser->elsewhereWhenAvailable('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`……
        $title->assertSee('Hello World');
    });
});
```

<a name="waiting-for-elements"></a>
### 等待元素

在测试大量使用 JavaScript 的应用时，往往有必要在继续测试之前“等待”某些元素或数据可用。Dusk 让这一切变得轻而易举。借助多种方法，你可以等待元素在页面上可见，甚至等待给定 JavaScript 表达式求值为 `true`。

<a name="waiting"></a>
#### 等待

如果你只需要将测试暂停给定毫秒数，使用 `pause` 方法：

```php
$browser->pause(1000);
```

如果你只需要在给定条件为 `true` 时才暂停测试，使用 `pauseIf` 方法：

```php
$browser->pauseIf(App::environment('production'), 1000);
```

同样地，如果你需要在给定条件为 `true` 之前暂停测试，可以使用 `pauseUnless` 方法：

```php
$browser->pauseUnless(App::environment('testing'), 1000);
```

<a name="waiting-for-selectors"></a>
#### 等待选择器

`waitFor` 方法可用于暂停测试的执行，直到匹配给定 CSS 或 Dusk 选择器的元素显示在页面上。默认情况下，这会在抛出异常前将测试暂停最多五秒。如有必要，你可以将自定义超时阈值作为第二个参数传给该方法：

```php
// 最多等待五秒以等待选择器……
$browser->waitFor('.selector');

// 最多等待一秒以等待选择器……
$browser->waitFor('.selector', 1);
```

你也可以等待，直到匹配给定选择器的元素包含给定文本：

```php
// 最多等待五秒以等待选择器包含给定文本……
$browser->waitForTextIn('.selector', 'Hello World');

// 最多等待一秒以等待选择器包含给定文本……
$browser->waitForTextIn('.selector', 'Hello World', 1);
```

你也可以等待，直到匹配给定选择器的元素从页面上消失：

```php
// 最多等待五秒直到选择器消失……
$browser->waitUntilMissing('.selector');

// 最多等待一秒直到选择器消失……
$browser->waitUntilMissing('.selector', 1);
```

或者，你可以等待，直到匹配给定选择器的元素被启用或禁用：

```php
// 最多等待五秒直到选择器被启用……
$browser->waitUntilEnabled('.selector');

// 最多等待一秒直到选择器被启用……
$browser->waitUntilEnabled('.selector', 1);

// 最多等待五秒直到选择器被禁用……
$browser->waitUntilDisabled('.selector');

// 最多等待一秒直到选择器被禁用……
$browser->waitUntilDisabled('.selector', 1);
```

<a name="scoping-selectors-when-available"></a>
#### 在选择器可用时限定作用域

有时你可能希望等待出现一个匹配给定选择器的元素，然后与该元素交互。例如，你可能希望等待模态窗口可用，然后按下模态窗口内的“OK”按钮。`whenAvailable` 方法可用于实现这一点。在给定闭包内执行的所有元素操作，都将限定在原始选择器的范围内：

```php
$browser->whenAvailable('.modal', function (Browser $modal) {
    $modal->assertSee('Hello World')
        ->press('OK');
});
```

<a name="waiting-for-text"></a>
#### 等待文本

`waitForText` 方法可用于等待给定文本显示在页面上：

```php
// 最多等待五秒以等待文本……
$browser->waitForText('Hello World');

// 最多等待一秒以等待文本……
$browser->waitForText('Hello World', 1);
```

你可以使用 `waitUntilMissingText` 方法等待显示的文本从页面上被移除：

```php
// 最多等待五秒以等待文本被移除……
$browser->waitUntilMissingText('Hello World');

// 最多等待一秒以等待文本被移除……
$browser->waitUntilMissingText('Hello World', 1);
```

<a name="waiting-for-links"></a>
#### 等待链接

`waitForLink` 方法可用于等待给定链接文本显示在页面上：

```php
// 最多等待五秒以等待链接……
$browser->waitForLink('Create');

// 最多等待一秒以等待链接……
$browser->waitForLink('Create', 1);
```

<a name="waiting-for-inputs"></a>
#### 等待输入框

`waitForInput` 方法可用于等待给定输入字段在页面上可见：

```php
// 最多等待五秒以等待输入……
$browser->waitForInput($field);

// 最多等待一秒以等待输入……
$browser->waitForInput($field, 1);
```

<a name="waiting-on-the-page-location"></a>
#### 等待页面位置

当进行路径断言（如 `$browser->assertPathIs('/home')`）时，如果 `window.location.pathname` 正在异步更新，该断言可能会失败。你可以使用 `waitForLocation` 方法等待位置变为给定值：

```php
$browser->waitForLocation('/secret');
```

`waitForLocation` 方法也可用于等待当前窗口位置成为一个完全限定的 URL：

```php
$browser->waitForLocation('https://example.com/path');
```

你也可以等待[命名路由的](/docs/{{version}}/routing#named-routes)位置：

```php
$browser->waitForRoute($routeName, $parameters);
```

<a name="waiting-for-page-reloads"></a>
#### 等待页面重新加载

如果你需要在执行某个操作后等待页面重新加载，使用 `waitForReload` 方法：

```php
use Laravel\Dusk\Browser;

$browser->waitForReload(function (Browser $browser) {
    $browser->press('Submit');
})
->assertSee('Success!');
```

由于等待页面重新加载的需求通常出现在点击按钮之后，你可以使用 `clickAndWaitForReload` 方法以图方便：

```php
$browser->clickAndWaitForReload('.selector')
    ->assertSee('something');
```

<a name="waiting-on-javascript-expressions"></a>
#### 等待 JavaScript 表达式

有时你可能希望暂停测试的执行，直到给定的 JavaScript 表达式求值为 `true`。你可以使用 `waitUntil` 方法轻松实现。向该方法传入表达式时，你不需要包含 `return` 关键字或结尾的分号：

```php
// 最多等待五秒以等待表达式为真……
$browser->waitUntil('App.data.servers.length > 0');

// 最多等待一秒以等待表达式为真……
$browser->waitUntil('App.data.servers.length > 0', 1);
```

<a name="waiting-on-vue-expressions"></a>
#### 等待 Vue 表达式

`waitUntilVue` 和 `waitUntilVueIsNot` 方法可用于等待 [Vue 组件](https://vuejs.org) 属性具有给定值：

```php
// 等待组件属性包含给定值……
$browser->waitUntilVue('user.name', 'Taylor', '@user');

// 等待组件属性不包含给定值……
$browser->waitUntilVueIsNot('user.name', null, '@user');
```

<a name="waiting-for-javascript-events"></a>
#### 等待 JavaScript 事件

`waitForEvent` 方法可用于暂停测试的执行，直到发生某个 JavaScript 事件：

```php
$browser->waitForEvent('load');
```

事件监听器会附加到当前作用域，默认是 `body` 元素。当使用限定作用域的选择器时，事件监听器将附加到匹配的元素：

```php
$browser->with('iframe', function (Browser $iframe) {
    // 等待 iframe 的 load 事件……
    $iframe->waitForEvent('load');
});
```

你还可以将选择器作为第二个参数提供给 `waitForEvent` 方法，以将事件监听器附加到特定元素：

```php
$browser->waitForEvent('load', '.selector');
```

你还可以等待 `document` 和 `window` 对象上的事件：

```php
// 等待文档被滚动……
$browser->waitForEvent('scroll', 'document');

// 最多等待五秒直到窗口被调整大小……
$browser->waitForEvent('resize', 'window', 5);
```

<a name="waiting-with-a-callback"></a>
#### 使用回调等待

Dusk 中的许多“wait”方法都依赖于底层的 `waitUsing` 方法。你可以直接使用该方法等待给定闭包返回 `true`。`waitUsing` 方法接受最长等待的秒数、闭包被求值的间隔、闭包，以及一个可选的失败消息：

```php
$browser->waitUsing(10, 1, function () use ($something) {
    return $something->isReady();
}, "Something wasn't ready in time.");
```

<a name="scrolling-an-element-into-view"></a>
### 将元素滚动到视图中

有时你可能因为元素位于浏览器可视区域之外而无法点击它。`scrollIntoView` 方法会滚动浏览器窗口，直到给定选择器处的元素进入视图：

```php
$browser->scrollIntoView('.selector')
    ->click('.selector');
```

<a name="available-assertions"></a>
## 可用的断言

Dusk 提供了多种你可以对应用作出的断言。下面列出了所有可用的断言：

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<div class="collection-method-list" markdown="1">

[assertTitle](#assert-title)
[assertTitleContains](#assert-title-contains)
[assertUrlIs](#assert-url-is)
[assertSchemeIs](#assert-scheme-is)
[assertSchemeIsNot](#assert-scheme-is-not)
[assertHostIs](#assert-host-is)
[assertHostIsNot](#assert-host-is-not)
[assertPortIs](#assert-port-is)
[assertPortIsNot](#assert-port-is-not)
[assertPathBeginsWith](#assert-path-begins-with)
[assertPathEndsWith](#assert-path-ends-with)
[assertPathContains](#assert-path-contains)
[assertPathIs](#assert-path-is)
[assertPathIsNot](#assert-path-is-not)
[assertRouteIs](#assert-route-is)
[assertQueryStringHas](#assert-query-string-has)
[assertQueryStringMissing](#assert-query-string-missing)
[assertFragmentIs](#assert-fragment-is)
[assertFragmentBeginsWith](#assert-fragment-begins-with)
[assertFragmentIsNot](#assert-fragment-is-not)
[assertHasCookie](#assert-has-cookie)
[assertHasPlainCookie](#assert-has-plain-cookie)
[assertCookieMissing](#assert-cookie-missing)
[assertPlainCookieMissing](#assert-plain-cookie-missing)
[assertCookieValue](#assert-cookie-value)
[assertPlainCookieValue](#assert-plain-cookie-value)
[assertSee](#assert-see)
[assertDontSee](#assert-dont-see)
[assertSeeIn](#assert-see-in)
[assertDontSeeIn](#assert-dont-see-in)
[assertSeeAnythingIn](#assert-see-anything-in)
[assertSeeNothingIn](#assert-see-nothing-in)
[assertCount](#assert-count)
[assertScript](#assert-script)
[assertSourceHas](#assert-source-has)
[assertSourceMissing](#assert-source-missing)
[assertSeeLink](#assert-see-link)
[assertDontSeeLink](#assert-dont-see-link)
[assertInputValue](#assert-input-value)
[assertInputValueIsNot](#assert-input-value-is-not)
[assertChecked](#assert-checked)
[assertNotChecked](#assert-not-checked)
[assertIndeterminate](#assert-indeterminate)
[assertRadioSelected](#assert-radio-selected)
[assertRadioNotSelected](#assert-radio-not-selected)
[assertSelected](#assert-selected)
[assertNotSelected](#assert-not-selected)
[assertSelectHasOptions](#assert-select-has-options)
[assertSelectMissingOptions](#assert-select-missing-options)
[assertSelectHasOption](#assert-select-has-option)
[assertSelectMissingOption](#assert-select-missing-option)
[assertValue](#assert-value)
[assertValueIsNot](#assert-value-is-not)
[assertAttribute](#assert-attribute)
[assertAttributeMissing](#assert-attribute-missing)
[assertAttributeContains](#assert-attribute-contains)
[assertAttributeDoesntContain](#assert-attribute-doesnt-contain)
[assertAriaAttribute](#assert-aria-attribute)
[assertDataAttribute](#assert-data-attribute)
[assertVisible](#assert-visible)
[assertPresent](#assert-present)
[assertNotPresent](#assert-not-present)
[assertMissing](#assert-missing)
[assertInputPresent](#assert-input-present)
[assertInputMissing](#assert-input-missing)
[assertDialogOpened](#assert-dialog-opened)
[assertEnabled](#assert-enabled)
[assertDisabled](#assert-disabled)
[assertButtonEnabled](#assert-button-enabled)
[assertButtonDisabled](#assert-button-disabled)
[assertFocused](#assert-focused)
[assertNotFocused](#assert-not-focused)
[assertAuthenticated](#assert-authenticated)
[assertGuest](#assert-guest)
[assertAuthenticatedAs](#assert-authenticated-as)
[assertVue](#assert-vue)
[assertVueIsNot](#assert-vue-is-not)
[assertVueContains](#assert-vue-contains)
[assertVueDoesntContain](#assert-vue-doesnt-contain)

</div>

<a name="assert-title"></a>
#### assertTitle

断言页面标题匹配给定文本：

```php
$browser->assertTitle($title);
```

<a name="assert-title-contains"></a>
#### assertTitleContains

断言页面标题包含给定文本：

```php
$browser->assertTitleContains($title);
```

<a name="assert-url-is"></a>
#### assertUrlIs

断言当前 URL（不含查询字符串）匹配给定字符串：

```php
$browser->assertUrlIs($url);
```

<a name="assert-scheme-is"></a>
#### assertSchemeIs

断言当前 URL scheme 匹配给定 scheme：

```php
$browser->assertSchemeIs($scheme);
```

<a name="assert-scheme-is-not"></a>
#### assertSchemeIsNot

断言当前 URL scheme 不匹配给定 scheme：

```php
$browser->assertSchemeIsNot($scheme);
```

<a name="assert-host-is"></a>
#### assertHostIs

断言当前 URL host 匹配给定 host：

```php
$browser->assertHostIs($host);
```

<a name="assert-host-is-not"></a>
#### assertHostIsNot

断言当前 URL host 不匹配给定 host：

```php
$browser->assertHostIsNot($host);
```

<a name="assert-port-is"></a>
#### assertPortIs

断言当前 URL 端口匹配给定端口：

```php
$browser->assertPortIs($port);
```

<a name="assert-port-is-not"></a>
#### assertPortIsNot

断言当前 URL 端口不匹配给定端口：

```php
$browser->assertPortIsNot($port);
```

<a name="assert-path-begins-with"></a>
#### assertPathBeginsWith

断言当前 URL 路径以给定路径开头：

```php
$browser->assertPathBeginsWith('/home');
```

<a name="assert-path-ends-with"></a>
#### assertPathEndsWith

断言当前 URL 路径以给定路径结尾：

```php
$browser->assertPathEndsWith('/home');
```

<a name="assert-path-contains"></a>
#### assertPathContains

断言当前 URL 路径包含给定路径：

```php
$browser->assertPathContains('/home');
```

<a name="assert-path-is"></a>
#### assertPathIs

断言当前路径匹配给定路径：

```php
$browser->assertPathIs('/home');
```

<a name="assert-path-is-not"></a>
#### assertPathIsNot

断言当前路径不匹配给定路径：

```php
$browser->assertPathIsNot('/home');
```

<a name="assert-route-is"></a>
#### assertRouteIs

断言当前 URL 匹配给定[命名路由的](/docs/{{version}}/routing#named-routes) URL：

```php
$browser->assertRouteIs($name, $parameters);
```

<a name="assert-query-string-has"></a>
#### assertQueryStringHas

断言给定的查询字符串参数存在：

```php
$browser->assertQueryStringHas($name);
```

断言给定的查询字符串参数存在且具有给定值：

```php
$browser->assertQueryStringHas($name, $value);
```

<a name="assert-query-string-missing"></a>
#### assertQueryStringMissing

断言给定的查询字符串参数不存在：

```php
$browser->assertQueryStringMissing($name);
```

<a name="assert-fragment-is"></a>
#### assertFragmentIs

断言 URL 当前的 hash 片段匹配给定片段：

```php
$browser->assertFragmentIs('anchor');
```

<a name="assert-fragment-begins-with"></a>
#### assertFragmentBeginsWith

断言 URL 当前的 hash 片段以给定片段开头：

```php
$browser->assertFragmentBeginsWith('anchor');
```

<a name="assert-fragment-is-not"></a>
#### assertFragmentIsNot

断言 URL 当前的 hash 片段不匹配给定片段：

```php
$browser->assertFragmentIsNot('anchor');
```

<a name="assert-has-cookie"></a>
#### assertHasCookie

断言给定的加密 Cookie 存在：

```php
$browser->assertHasCookie($name);
```

<a name="assert-has-plain-cookie"></a>
#### assertHasPlainCookie

断言给定的未加密 Cookie 存在：

```php
$browser->assertHasPlainCookie($name);
```

<a name="assert-cookie-missing"></a>
#### assertCookieMissing

断言给定的加密 Cookie 不存在：

```php
$browser->assertCookieMissing($name);
```

<a name="assert-plain-cookie-missing"></a>
#### assertPlainCookieMissing

断言给定的未加密 Cookie 不存在：

```php
$browser->assertPlainCookieMissing($name);
```

<a name="assert-cookie-value"></a>
#### assertCookieValue

断言加密 Cookie 具有给定值：

```php
$browser->assertCookieValue($name, $value);
```

<a name="assert-plain-cookie-value"></a>
#### assertPlainCookieValue

断言未加密 Cookie 具有给定值：

```php
$browser->assertPlainCookieValue($name, $value);
```

<a name="assert-see"></a>
#### assertSee

断言给定文本存在于页面上：

```php
$browser->assertSee($text);
```

<a name="assert-dont-see"></a>
#### assertDontSee

断言给定文本不存在于页面上：

```php
$browser->assertDontSee($text);
```

<a name="assert-see-in"></a>
#### assertSeeIn

断言给定文本存在于选择器内：

```php
$browser->assertSeeIn($selector, $text);
```

<a name="assert-dont-see-in"></a>
#### assertDontSeeIn

断言给定文本不存在于选择器内：

```php
$browser->assertDontSeeIn($selector, $text);
```

<a name="assert-see-anything-in"></a>
#### assertSeeAnythingIn

断言选择器内存在任意文本：

```php
$browser->assertSeeAnythingIn($selector);
```

<a name="assert-see-nothing-in"></a>
#### assertSeeNothingIn

断言选择器内不存在文本：

```php
$browser->assertSeeNothingIn($selector);
```

<a name="assert-count"></a>
#### assertCount

断言匹配给定选择器的元素出现指定次数：

```php
$browser->assertCount($selector, $count);
```

<a name="assert-script"></a>
#### assertScript

断言给定的 JavaScript 表达式求值为给定值：

```php
$browser->assertScript('window.isLoaded')
    ->assertScript('document.readyState', 'complete');
```

<a name="assert-source-has"></a>
#### assertSourceHas

断言给定的源码存在于页面上：

```php
$browser->assertSourceHas($code);
```

<a name="assert-source-missing"></a>
#### assertSourceMissing

断言给定的源码不存在于页面上：

```php
$browser->assertSourceMissing($code);
```

<a name="assert-see-link"></a>
#### assertSeeLink

断言给定的链接存在于页面上：

```php
$browser->assertSeeLink($linkText);
```

<a name="assert-dont-see-link"></a>
#### assertDontSeeLink

断言给定的链接不存在于页面上：

```php
$browser->assertDontSeeLink($linkText);
```

<a name="assert-input-value"></a>
#### assertInputValue

断言给定的输入字段具有给定值：

```php
$browser->assertInputValue($field, $value);
```

<a name="assert-input-value-is-not"></a>
#### assertInputValueIsNot

断言给定的输入字段不具有给定值：

```php
$browser->assertInputValueIsNot($field, $value);
```

<a name="assert-checked"></a>
#### assertChecked

断言给定的复选框已勾选：

```php
$browser->assertChecked($field);
```

<a name="assert-not-checked"></a>
#### assertNotChecked

断言给定的复选框未勾选：

```php
$browser->assertNotChecked($field);
```

<a name="assert-indeterminate"></a>
#### assertIndeterminate

断言给定的复选框处于不确定状态：

```php
$browser->assertIndeterminate($field);
```

<a name="assert-radio-selected"></a>
#### assertRadioSelected

断言给定的单选字段已选中：

```php
$browser->assertRadioSelected($field, $value);
```

<a name="assert-radio-not-selected"></a>
#### assertRadioNotSelected

断言给定的单选字段未选中：

```php
$browser->assertRadioNotSelected($field, $value);
```

<a name="assert-selected"></a>
#### assertSelected

断言给定的下拉框已选中给定值：

```php
$browser->assertSelected($field, $value);
```

<a name="assert-not-selected"></a>
#### assertNotSelected

断言给定的下拉框未选中给定值：

```php
$browser->assertNotSelected($field, $value);
```

<a name="assert-select-has-options"></a>
#### assertSelectHasOptions

断言给定的值数组可被选中进行选择：

```php
$browser->assertSelectHasOptions($field, $values);
```

<a name="assert-select-missing-options"></a>
#### assertSelectMissingOptions

断言给定的值数组不可被选中进行选择：

```php
$browser->assertSelectMissingOptions($field, $values);
```

<a name="assert-select-has-option"></a>
#### assertSelectHasOption

断言给定字段上给定的值可被选中进行选择：

```php
$browser->assertSelectHasOption($field, $value);
```

<a name="assert-select-missing-option"></a>
#### assertSelectMissingOption

断言给定的值不可被选中进行选择：

```php
$browser->assertSelectMissingOption($field, $value);
```

<a name="assert-value"></a>
#### assertValue

断言匹配给定选择器的元素具有给定值：

```php
$browser->assertValue($selector, $value);
```

<a name="assert-value-is-not"></a>
#### assertValueIsNot

断言匹配给定选择器的元素不具有给定值：

```php
$browser->assertValueIsNot($selector, $value);
```

<a name="assert-attribute"></a>
#### assertAttribute

断言匹配给定选择器的元素在所提供的属性中具有给定值：

```php
$browser->assertAttribute($selector, $attribute, $value);
```

<a name="assert-attribute-missing"></a>
#### assertAttributeMissing

断言匹配给定选择器的元素缺失所提供的属性：

```php
$browser->assertAttributeMissing($selector, $attribute);
```

<a name="assert-attribute-contains"></a>
#### assertAttributeContains

断言匹配给定选择器的元素在所提供的属性中包含给定值：

```php
$browser->assertAttributeContains($selector, $attribute, $value);
```

<a name="assert-attribute-doesnt-contain"></a>
#### assertAttributeDoesntContain

断言匹配给定选择器的元素在所提供的属性中不包含给定值：

```php
$browser->assertAttributeDoesntContain($selector, $attribute, $value);
```

<a name="assert-aria-attribute"></a>
#### assertAriaAttribute

断言匹配给定选择器的元素在所提供的 aria 属性中具有给定值：

```php
$browser->assertAriaAttribute($selector, $attribute, $value);
```

例如，给定标记 `<button aria-label="Add"></button>`，你可以像下面这样对 `aria-label` 属性作出断言：

```php
$browser->assertAriaAttribute('button', 'label', 'Add')
```

<a name="assert-data-attribute"></a>
#### assertDataAttribute

断言匹配给定选择器的元素在所提供的 data 属性中具有给定值：

```php
$browser->assertDataAttribute($selector, $attribute, $value);
```

例如，给定标记 `<tr id="row-1" data-content="attendees"></tr>`，你可以像下面这样对 `data-content` 属性作出断言：

```php
$browser->assertDataAttribute('#row-1', 'content', 'attendees')
```

<a name="assert-visible"></a>
#### assertVisible

断言匹配给定选择器的元素可见：

```php
$browser->assertVisible($selector);
```

<a name="assert-present"></a>
#### assertPresent

断言匹配给定选择器的元素存在于源码中：

```php
$browser->assertPresent($selector);
```

<a name="assert-not-present"></a>
#### assertNotPresent

断言匹配给定选择器的元素不存在于源码中：

```php
$browser->assertNotPresent($selector);
```

<a name="assert-missing"></a>
#### assertMissing

断言匹配给定选择器的元素不可见：

```php
$browser->assertMissing($selector);
```

<a name="assert-input-present"></a>
#### assertInputPresent

断言具有给定名称的输入存在：

```php
$browser->assertInputPresent($name);
```

<a name="assert-input-missing"></a>
#### assertInputMissing

断言具有给定名称的输入不存在于源码中：

```php
$browser->assertInputMissing($name);
```

<a name="assert-dialog-opened"></a>
#### assertDialogOpened

断言具有给定消息的 JavaScript 对话框已打开：

```php
$browser->assertDialogOpened($message);
```

<a name="assert-enabled"></a>
#### assertEnabled

断言给定字段已启用：

```php
$browser->assertEnabled($field);
```

<a name="assert-disabled"></a>
#### assertDisabled

断言给定字段已禁用：

```php
$browser->assertDisabled($field);
```

<a name="assert-button-enabled"></a>
#### assertButtonEnabled

断言给定按钮已启用：

```php
$browser->assertButtonEnabled($button);
```

<a name="assert-button-disabled"></a>
#### assertButtonDisabled

断言给定按钮已禁用：

```php
$browser->assertButtonDisabled($button);
```

<a name="assert-focused"></a>
#### assertFocused

断言给定字段已获得焦点：

```php
$browser->assertFocused($field);
```

<a name="assert-not-focused"></a>
#### assertNotFocused

断言给定字段未获得焦点：

```php
$browser->assertNotFocused($field);
```

<a name="assert-authenticated"></a>
#### assertAuthenticated

断言用户已通过认证：

```php
$browser->assertAuthenticated();
```

<a name="assert-guest"></a>
#### assertGuest

断言用户未通过认证：

```php
$browser->assertGuest();
```

<a name="assert-authenticated-as"></a>
#### assertAuthenticatedAs

断言用户以给定用户身份通过认证：

```php
$browser->assertAuthenticatedAs($user);
```

<a name="assert-vue"></a>
#### assertVue

Dusk 甚至允许你对 [Vue 组件](https://vuejs.org) 数据的状态作出断言。例如，假设你的应用包含以下 Vue 组件：

    // HTML……

    <profile dusk="profile-component"></profile>

    // Component Definition……

    Vue.component('profile', {
        template: '<div>{{ user.name }}</div>',

        data: function () {
            return {
                user: {
                    name: 'Taylor'
                }
            };
        }
    });

你可以像下面这样对 Vue 组件的状态作出断言：

```php tab=Pest
test('vue', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
            ->assertVue('user.name', 'Taylor', '@profile-component');
    });
});
```

```php tab=PHPUnit
/**
 * 一个基础的 Vue 测试示例。
 */
public function test_vue(): void
{
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
            ->assertVue('user.name', 'Taylor', '@profile-component');
    });
}
```

<a name="assert-vue-is-not"></a>
#### assertVueIsNot

断言给定的 Vue 组件 data 属性不匹配给定值：

```php
$browser->assertVueIsNot($property, $value, $componentSelector = null);
```

<a name="assert-vue-contains"></a>
#### assertVueContains

断言给定的 Vue 组件 data 属性是一个数组且包含给定值：

```php
$browser->assertVueContains($property, $value, $componentSelector = null);
```

<a name="assert-vue-doesnt-contain"></a>
#### assertVueDoesntContain

断言给定的 Vue 组件 data 属性是一个数组且不包含给定值：

```php
$browser->assertVueDoesntContain($property, $value, $componentSelector = null);
```

<a name="pages"></a>
## 页面

有时，测试需要按顺序执行若干个复杂的操作，这会让你的测试更难阅读和理解。Dusk 页面（Pages）允许你定义富有表现力的操作，随后可通过单一方法在给定页面上执行。页面还允许你为应用或单个页面定义常用选择器的快捷方式。

<a name="generating-pages"></a>
### 生成页面

要生成页面对象，执行 `dusk:page` Artisan 命令。所有页面对象都将放置在应用的 `tests/Browser/Pages` 目录：

```shell
php artisan dusk:page Login
```

<a name="configuring-pages"></a>
### 配置页面

默认情况下，页面具有三个方法：`url`、`assert` 和 `elements`。我们现在讨论 `url` 和 `assert` 方法。`elements` 方法将在[下文详细讨论](#shorthand-selectors)。

<a name="the-url-method"></a>
#### `url` 方法

`url` 方法应返回表示页面的 URL 路径。Dusk 在浏览器中导航到该页面时会使用此 URL：

```php
/**
 * 获取页面的 URL。
 */
public function url(): string
{
    return '/login';
}
```

<a name="the-assert-method"></a>
#### `assert` 方法

`assert` 方法可以作出任何必要的断言，以验证浏览器确实位于给定页面。实际上并不需要在该方法中放置任何内容；不过，如果你愿意，也可以自由地作出这些断言。导航到页面时，这些断言会自动运行：

```php
/**
 * 断言浏览器位于该页面。
 */
public function assert(Browser $browser): void
{
    $browser->assertPathIs($this->url());
}
```

<a name="navigating-to-pages"></a>
### 导航到页面

一旦定义了页面，你可以使用 `visit` 方法导航到它：

```php
use Tests\Browser\Pages\Login;

$browser->visit(new Login);
```

有时你可能已经位于某个给定页面，并需要将页面的选择器和“加载”方法到当前测试上下文中。当你点击按钮并被重定向到某个给定页面而无需显式导航时，这种情况很常见。在这种情况下，你可以使用 `on` 方法加载页面：

```php
use Tests\Browser\Pages\CreatePlaylist;

$browser->visit('/dashboard')
    ->clickLink('Create Playlist')
    ->on(new CreatePlaylist)
    ->assertSee('@create');
```

<a name="shorthand-selectors"></a>
### 简写选择器

页面类中的 `elements` 方法允许你为页面上的任意 CSS 选择器定义快速、易记的快捷方式。例如，我们为应用登录页面的 `email` 输入字段定义一个快捷方式：

```php
/**
 * 获取页面的元素快捷方式。
 *
 * @return array<string, string>
 */
public function elements(): array
{
    return [
        '@email' => 'input[name=email]',
    ];
}
```

定义快捷方式后，你可以在通常使用完整 CSS 选择器的任何地方使用简写选择器：

```php
$browser->type('@email', 'taylor@laravel.com');
```

<a name="global-shorthand-selectors"></a>
#### 全局简写选择器

安装 Dusk 后，一个基础的 `Page` 类会被放置在你的 `tests/Browser/Pages` 目录。该类包含一个 `siteElements` 方法，可用于定义应在应用所有页面上可用的全局简写选择器：

```php
/**
 * 获取站点的全局元素快捷方式。
 *
 * @return array<string, string>
 */
public static function siteElements(): array
{
    return [
        '@element' => '#selector',
    ];
}
```

<a name="page-methods"></a>
### 页面方法

除了页面上定义的默认方法外，你还可以定义可在整个测试中使用的附加方法。例如，假设我们正在构建一个音乐管理应用。应用某个页面的常见操作可能是创建播放列表。与其在每个测试中重写创建播放列表的逻辑，不如在页面类上定义 `createPlaylist` 方法：

```php
<?php

namespace Tests\Browser\Pages;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Page;

class Dashboard extends Page
{
    // 其它页面方法……

    /**
     * 创建一个新的播放列表。
     */
    public function createPlaylist(Browser $browser, string $name): void
    {
        $browser->type('name', $name)
            ->check('share')
            ->press('Create Playlist');
    }
}
```

定义该方法后，你可以在任何使用该页面的测试中使用它。浏览器实例将自动作为第一个参数传给自定义页面方法：

```php
use Tests\Browser\Pages\Dashboard;

$browser->visit(new Dashboard)
    ->createPlaylist('My Playlist')
    ->assertSee('My Playlist');
```

<a name="components"></a>
## 组件

组件（Components）类似于 Dusk 的“页面对象”，但面向的是在整个应用中复用的 UI 片段与功能，例如导航栏或通知窗口。因此，组件不绑定到特定的 URL。

<a name="generating-components"></a>
### 生成组件

要生成组件，执行 `dusk:component` Artisan 命令。新组件放置在 `tests/Browser/Components` 目录：

```shell
php artisan dusk:component DatePicker
```

如上所示，“日期选择器”是一个可能存在于应用各种页面上的组件示例。在整套测试中手动编写浏览器自动化逻辑以在数十个测试中选择日期会变得很繁琐。相反，我们可以定义一个 Dusk 组件来表示日期选择器，从而将该逻辑封装在组件内部：

```php
<?php

namespace Tests\Browser\Components;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Component as BaseComponent;

class DatePicker extends BaseComponent
{
    /**
     * 获取组件的根选择器。
     */
    public function selector(): string
    {
        return '.date-picker';
    }

    /**
     * 断言浏览器页面包含该组件。
     */
    public function assert(Browser $browser): void
    {
        $browser->assertVisible($this->selector());
    }

    /**
     * 获取组件的元素快捷方式。
     *
     * @return array<string, string>
     */
    public function elements(): array
    {
        return [
            '@date-field' => 'input.datepicker-input',
            '@year-list' => 'div > div.datepicker-years',
            '@month-list' => 'div > div.datepicker-months',
            '@day-list' => 'div > div.datepicker-days',
        ];
    }

    /**
     * 选择给定的日期。
     */
    public function selectDate(Browser $browser, int $year, int $month, int $day): void
    {
        $browser->click('@date-field')
            ->within('@year-list', function (Browser $browser) use ($year) {
                $browser->click($year);
            })
            ->within('@month-list', function (Browser $browser) use ($month) {
                $browser->click($month);
            })
            ->within('@day-list', function (Browser $browser) use ($day) {
                $browser->click($day);
            });
    }
}
```

<a name="using-components"></a>
### 使用组件

定义组件后，我们可以在任何测试中轻松地在日期选择器内选择日期。而且，如果选择日期所需的逻辑发生变化，我们只需更新组件：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\Browser\Components\DatePicker;

pest()->use(DatabaseMigrations::class);

test('basic example', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/')
            ->within(new DatePicker, function (Browser $browser) {
                $browser->selectDate(2019, 1, 30);
            })
            ->assertSee('January');
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\Browser\Components\DatePicker;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    /**
     * 一个基础的组件测试示例。
     */
    public function test_basic_example(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/')
                ->within(new DatePicker, function (Browser $browser) {
                    $browser->selectDate(2019, 1, 30);
                })
                ->assertSee('January');
        });
    }
}
```

`component` 方法可用于获取限定到给定组件作用域的浏览器实例：

```php
$datePicker = $browser->component(new DatePickerComponent);

$datePicker->selectDate(2019, 1, 30);

$datePicker->assertSee('January');
```

<a name="continuous-integration"></a>
## 持续集成

> [!WARNING]
> 大多数 Dusk 持续集成配置期望你的 Laravel 应用使用内置的 PHP 开发服务器在 8000 端口提供服务。因此，在继续之前，你应确保持续集成环境具有值为 `http://127.0.0.1:8000` 的 `APP_URL` 环境变量。

<a name="running-tests-on-heroku-ci"></a>
### Heroku CI

要在 [Heroku CI](https://www.heroku.com/continuous-integration) 上运行 Dusk 测试，请将以下 Google Chrome buildpack 和脚本添加到你的 Heroku `app.json` 文件：

```json
{
  "environments": {
    "test": {
      "buildpacks": [
        { "url": "heroku/php" },
        { "url": "https://github.com/heroku/heroku-buildpack-chrome-for-testing" }
      ],
      "scripts": {
        "test-setup": "cp .env.testing .env",
        "test": "nohup bash -c './vendor/laravel/dusk/bin/chromedriver-linux --port=9515 > /dev/null 2>&1 &' && nohup bash -c 'php artisan serve --no-reload > /dev/null 2>&1 &' && php artisan dusk"
      }
    }
  }
}
```

<a name="running-tests-on-travis-ci"></a>
### Travis CI

要在 [Travis CI](https://travis-ci.org) 上运行你的 Dusk 测试，请使用以下 `.travis.yml` 配置。由于 Travis CI 不是图形化环境，我们需要采取一些额外步骤来启动 Chrome 浏览器。此外，我们将使用 `php artisan serve` 启动 PHP 内置的 Web 服务器：

```yaml
language: php

php:
  - 8.2

addons:
  chrome: stable

install:
  - cp .env.testing .env
  - travis_retry composer install --no-interaction --prefer-dist
  - php artisan key:generate
  - php artisan dusk:chrome-driver

before_script:
  - google-chrome-stable --headless --disable-gpu --remote-debugging-port=9222 http://localhost &
  - php artisan serve --no-reload &

script:
  - php artisan dusk
```

<a name="running-tests-on-github-actions"></a>
### GitHub Actions

如果你使用 [GitHub Actions](https://github.com/features/actions) 运行 Dusk 测试，可以使用以下配置文件作为起点。与 TravisCI 类似，我们将使用 `php artisan serve` 命令启动 PHP 内置的 Web 服务器：

```yaml
name: CI
on: [push]
jobs:

  dusk-php:
    runs-on: ubuntu-latest
    env:
      APP_URL: "http://127.0.0.1:8000"
      DB_USERNAME: root
      DB_PASSWORD: root
      MAIL_MAILER: log
    steps:
      - uses: actions/checkout@v5
      - name: Prepare The Environment
        run: cp .env.example .env
      - name: Create Database
        run: |
          sudo systemctl start mysql
          mysql --user="root" --password="root" -e "CREATE DATABASE \`my-database\` character set UTF8mb4 collate utf8mb4_bin;"
      - name: Install Composer Dependencies
        run: composer install --no-progress --prefer-dist --optimize-autoloader
      - name: Generate Application Key
        run: php artisan key:generate
      - name: Upgrade Chrome Driver
        run: php artisan dusk:chrome-driver --detect
      - name: Start Chrome Driver
        run: ./vendor/laravel/dusk/bin/chromedriver-linux --port=9515 &
      - name: Run Laravel Server
        run: php artisan serve --no-reload &
      - name: Run Dusk Tests
        run: php artisan dusk
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: tests/Browser/screenshots
      - name: Upload Console Logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: console
          path: tests/Browser/console
```

<a name="running-tests-on-chipper-ci"></a>
### Chipper CI

如果你使用 [Chipper CI](https://chipperci.com) 运行 Dusk 测试，可以使用以下配置文件作为起点。我们将使用 PHP 内置的服务器运行 Laravel，以便监听请求：

```yaml
# file .chipperci.yml
version: 1

environment:
  php: 8.2
  node: 16

# Include Chrome in the build environment
services:
  - dusk

# Build all commits
on:
   push:
      branches: .*

pipeline:
  - name: Setup
    cmd: |
      cp -v .env.example .env
      composer install --no-interaction --prefer-dist --optimize-autoloader
      php artisan key:generate

      # Create a dusk env file, ensuring APP_URL uses BUILD_HOST
      cp -v .env .env.dusk.ci
      sed -i "s@APP_URL=.*@APP_URL=http://$BUILD_HOST:8000@g" .env.dusk.ci

  - name: Compile Assets
    cmd: |
      npm ci --no-audit
      npm run build

  - name: Browser Tests
    cmd: |
      php -S [::0]:8000 -t public 2>server.log &
      sleep 2
      php artisan dusk:chrome-driver $CHROME_DRIVER
      php artisan dusk --env=ci
```

要了解在 Chipper CI 上运行 Dusk 测试的更多信息（包括如何使用数据库），请参阅 [Chipper CI 官方文档](https://chipperci.com/docs/testing/laravel-dusk-new/)。
