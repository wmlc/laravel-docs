# Laravel Dusk

- [简介](#introduction)
- [安装](#installation)
    - [管理 ChromeDriver 安装](#managing-chromedriver-installations)
    - [使用其他浏览器](#using-other-browsers)
- [入门](#getting-started)
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
    - [截取屏幕截图](#taking-a-screenshot)
    - [把控制台输出保存到磁盘](#storing-console-output-to-disk)
    - [把页面源码保存到磁盘](#storing-page-source-to-disk)
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
    - [把元素滚动到可视区域](#scrolling-an-element-into-view)
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

[Laravel Dusk](https://github.com/laravel/dusk) 提供了一套表达力强、易于使用的浏览器自动化与测试 API。默认情况下，Dusk 不要求你在本地计算机上安装 JDK 或 Selenium，而是使用一份独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装。不过，你完全可以自由使用任何其他兼容 Selenium 的驱动。

<a name="installation"></a>
## 安装

要开始使用，你应当安装 [Google Chrome](https://www.google.com/chrome)，并把 `laravel/dusk` 这个 Composer 依赖添加到项目中：

```shell
composer require laravel/dusk --dev
```

> [!WARNING]
> 如果你手动注册 Dusk 的服务提供者（Service Provider），那么**绝不**要在生产环境中注册它，否则可能导致任意用户都能通过你的应用完成认证。

安装完 Dusk 包之后，执行 `dusk:install` Artisan 命令。`dusk:install` 命令会创建 `tests/Browser` 目录、一个 Dusk 测试示例，并为你所在的操作系统安装 Chrome Driver 二进制文件：

```shell
php artisan dusk:install
```

接下来，在应用的 `.env` 文件中设置 `APP_URL` 环境变量。该值应当与你在浏览器中访问应用时所使用的 URL 一致。

> [!NOTE]
> 如果你使用 [Laravel Sail](/docs/{{version}}/sail) 管理本地开发环境，请同时查阅 Sail 文档中关于[配置和运行 Dusk 测试](/docs/{{version}}/sail#laravel-dusk)的内容。

<a name="managing-chromedriver-installations"></a>
### 管理 ChromeDriver 安装

如果你想安装与 Laravel Dusk 通过 `dusk:install` 命令所安装版本不同的 ChromeDriver，可以使用 `dusk:chrome-driver` 命令：

```shell
# 为你的操作系统安装最新版本的 ChromeDriver……
php artisan dusk:chrome-driver

# 为你的操作系统安装指定版本的 ChromeDriver……
php artisan dusk:chrome-driver 86

# 为所有受支持的操作系统安装指定版本的 ChromeDriver……
php artisan dusk:chrome-driver --all

# 为你的操作系统安装与检测到的 Chrome / Chromium 版本相匹配的 ChromeDriver 版本……
php artisan dusk:chrome-driver --detect
```

> [!WARNING]
> Dusk 要求 `chromedriver` 二进制文件必须可执行。如果你在运行 Dusk 时遇到问题，应当使用以下命令确保这些二进制文件可执行：`chmod -R 0755 vendor/laravel/dusk/bin/`。

<a name="using-other-browsers"></a>
### 使用其他浏览器

默认情况下，Dusk 使用 Google Chrome 和一份独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装来运行浏览器测试。不过，你也可以启动自己的 Selenium 服务器，并针对任意浏览器运行测试。

要开始使用，请打开 `tests/DuskTestCase.php` 文件，它是你应用的基础 Dusk 测试用例。在这个文件中，你可以删除对 `startChromeDriver` 方法的调用。这样会阻止 Dusk 自动启动 ChromeDriver：

```php
/**
 * 为 Dusk 测试执行做准备。
 *
 * @beforeClass
 */
public static function prepare(): void
{
    // static::startChromeDriver();
}
```

接下来，你可以修改 `driver` 方法，以连接到你选择的 URL 和端口。此外，你还可以修改应当传给 WebDriver 的「期望功能（desired capabilities）」：

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
## 入门

<a name="generating-tests"></a>
### 生成测试

要生成 Dusk 测试，请使用 `dusk:make` Artisan 命令。生成的测试将被放在 `tests/Browser` 目录中：

```shell
php artisan dusk:make LoginTest
```

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

你编写的大多数测试都会与从应用数据库中获取数据的页面交互；不过，你的 Dusk 测试绝不应使用 `RefreshDatabase` Trait。`RefreshDatabase` Trait 依赖数据库事务，而事务在跨 HTTP 请求时既不适用也无法使用。因此，你有两个选择：`DatabaseMigrations` Trait 和 `DatabaseTruncation` Trait。

<a name="reset-migrations"></a>
#### 使用数据库迁移

`DatabaseMigrations` Trait 会在每个测试之前运行你的数据库迁移。不过，为每个测试都删除并重新创建数据库表，通常比清空表更慢：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;

uses(DatabaseMigrations::class);

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
> 执行 Dusk 测试时不能使用 SQLite 内存数据库。由于浏览器运行在它自己的进程中，因此无法访问其他进程的内存数据库。

<a name="reset-truncation"></a>
#### 使用数据库清空

`DatabaseTruncation` Trait 会在第一个测试时迁移你的数据库，以确保数据库表已被正确创建。不过，在之后的测试中，数据库的表只会被清空——这比重新运行所有数据库迁移要快得多：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseTruncation;
use Laravel\Dusk\Browser;

uses(DatabaseTruncation::class);

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

默认情况下，该 Trait 会清空除 `migrations` 表之外的所有表。如果你想自定义应当被清空的表，可以在测试类上定义一个 `$tablesToTruncate` 属性：

> [!NOTE]
> 如果你使用 Pest，应当在基础的 `DuskTestCase` 类上，或在你的测试文件所继承的任何类上定义属性或方法。

```php
/**
 * 指示应当清空哪些表。
 *
 * @var array
 */
protected $tablesToTruncate = ['users'];
```

或者，你可以在测试类上定义一个 `$exceptTables` 属性，指定哪些表应当从清空操作中排除：

```php
/**
 * 指示哪些表应当从清空操作中排除。
 *
 * @var array
 */
protected $exceptTables = ['users'];
```

要指定哪些数据库连接的表应当被清空，可以在测试类上定义一个 `$connectionsToTruncate` 属性：

```php
/**
 * 指示哪些连接的表应当被清空。
 *
 * @var array
 */
protected $connectionsToTruncate = ['mysql'];
```

如果你想在执行数据库清空之前或之后运行代码，可以在测试类上定义 `beforeTruncatingDatabase` 或 `afterTruncatingDatabase` 方法：

```php
/**
 * 执行任何应当在数据库开始清空之前进行的工作。
 */
protected function beforeTruncatingDatabase(): void
{
    //
}

/**
 * 执行任何应当在数据库完成清空之后进行的工作。
 */
protected function afterTruncatingDatabase(): void
{
    //
}
```

<a name="running-tests"></a>
### 运行测试

要运行你的浏览器测试，请执行 `dusk` Artisan 命令：

```shell
php artisan dusk
```

如果你上次运行 `dusk` 命令时出现了测试失败，可以先用 `dusk:fails` 命令重新运行失败的测试，从而节省时间：

```shell
php artisan dusk:fails
```

`dusk` 命令接受 Pest / PHPUnit 测试运行器通常所接受的任何参数，例如允许你只运行某个[分组](https://docs.phpunit.de/en/10.5/annotations.html#group)的测试：

```shell
php artisan dusk --group=foo
```

> [!NOTE]
> 如果你使用 [Laravel Sail](/docs/{{version}}/sail) 管理本地开发环境，请查阅 Sail 文档中关于[配置和运行 Dusk 测试](/docs/{{version}}/sail#laravel-dusk)的内容。

<a name="manually-starting-chromedriver"></a>
#### 手动启动 ChromeDriver

默认情况下，Dusk 会自动尝试启动 ChromeDriver。如果这在你的特定系统上无法奏效，你可以在运行 `dusk` 命令之前手动启动 ChromeDriver。如果你选择手动启动 ChromeDriver，就应当把 `tests/DuskTestCase.php` 文件中的下面这一行注释掉：

```php
/**
 * 为 Dusk 测试执行做准备。
 *
 * @beforeClass
 */
public static function prepare(): void
{
    // static::startChromeDriver();
}
```

此外，如果你在 9515 之外的端口上启动 ChromeDriver，就应当修改同一个类的 `driver` 方法以反映正确的端口：

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

要强制 Dusk 在运行测试时使用它自己的环境文件，请在项目根目录创建一个 `.env.dusk.{environment}` 文件。例如，如果你将从 `local` 环境启动 `dusk` 命令，就应当创建一个 `.env.dusk.local` 文件。

运行测试时，Dusk 会备份你的 `.env` 文件，并把你的 Dusk 环境重命名为 `.env`。测试完成后，你的 `.env` 文件会被恢复。

<a name="browser-basics"></a>
## 浏览器基础

<a name="creating-browsers"></a>
### 创建浏览器

让我们先编写一个测试，验证我们能够登录应用。生成测试之后，我们可以修改它，让它导航到登录页面、输入一些凭据并点击「Login」按钮。要创建浏览器实例，你可以在 Dusk 测试中调用 `browse` 方法：

```php tab=Pest
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;

uses(DatabaseMigrations::class);

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
     * 一个基本的浏览器测试示例。
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

正如上例所示，`browse` 方法接受一个闭包。Dusk 会自动把一个浏览器实例传给这个闭包，它是与你的应用交互并进行断言的主要对象。

<a name="creating-multiple-browsers"></a>
#### 创建多个浏览器

有时你可能需要多个浏览器才能正确完成一个测试。例如，测试一个与 websocket 交互的聊天界面时可能需要多个浏览器。要创建多个浏览器，只需在传给 `browse` 方法的闭包签名中添加更多浏览器参数：

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

`visit` 方法可用于导航到应用内某个给定的 URI：

```php
$browser->visit('/login');
```

你可以使用 `visitRoute` 方法导航到一个[命名路由](/docs/{{version}}/routing#named-routes)：

```php
$browser->visitRoute($routeName, $parameters);
```

你可以使用 `back` 和 `forward` 方法向后和向前导航：

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

`fitContent` 方法会把浏览器窗口调整为与其内容大小相匹配：

```php
$browser->fitContent();
```

当测试失败时，Dusk 会在截取屏幕截图之前自动调整浏览器大小以适配内容。你可以在测试中调用 `disableFitOnFailure` 方法禁用该功能：

```php
$browser->disableFitOnFailure();
```

你可以使用 `move` 方法把浏览器窗口移动到屏幕上的其他位置：

```php
$browser->move($x = 100, $y = 100);
```

<a name="browser-macros"></a>
### 浏览器宏

如果你想定义一个自定义浏览器方法，以便在各种测试中重复使用，可以在 `Browser` 类上使用 `macro` 方法。通常，你应当在某个[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

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

`macro` 函数的第一个参数接受一个名称，第二个参数接受一个闭包。当把该宏作为 `Browser` 实例上的方法调用时，宏的闭包就会被执行：

```php
$this->browse(function (Browser $browser) use ($user) {
    $browser->visit('/pay')
        ->scrollToElement('#credit-card-details')
        ->assertSee('Enter Credit Card Details');
});
```

<a name="authentication"></a>
### 认证

你经常需要测试要求认证的页面。你可以使用 Dusk 的 `loginAs` 方法，从而避免在每个测试中都与应用登录页面交互。`loginAs` 方法接受一个与你的可认证模型关联的主键，或一个可认证模型实例：

```php
use App\Models\User;
use Laravel\Dusk\Browser;

$this->browse(function (Browser $browser) {
    $browser->loginAs(User::find(1))
        ->visit('/home');
});
```

> [!WARNING]
> 使用 `loginAs` 方法之后，该用户会话会在这个文件中的所有测试里保持有效。

<a name="cookies"></a>
### Cookie

你可以使用 `cookie` 方法获取或设置某个已加密 Cookie 的值。默认情况下，Laravel 创建的所有 Cookie 都是加密的：

```php
$browser->cookie('name');

$browser->cookie('name', 'Taylor');
```

你可以使用 `plainCookie` 方法获取或设置某个未加密 Cookie 的值：

```php
$browser->plainCookie('name');

$browser->plainCookie('name', 'Taylor');
```

你可以使用 `deleteCookie` 方法删除给定的 Cookie：

```php
$browser->deleteCookie('name');
```

<a name="executing-javascript"></a>
### 执行 JavaScript

你可以使用 `script` 方法在浏览器中执行任意 JavaScript 语句：

```php
$browser->script('document.documentElement.scrollTop = 0');

$browser->script([
    'document.body.scrollTop = 0',
    'document.documentElement.scrollTop = 0',
]);

$output = $browser->script('return window.location.pathname');
```

<a name="taking-a-screenshot"></a>
### 截取屏幕截图

你可以使用 `screenshot` 方法截取屏幕截图，并以给定的文件名保存。所有截图都会存放在 `tests/Browser/screenshots` 目录中：

```php
$browser->screenshot('filename');
```

`responsiveScreenshots` 方法可用于在各个断点处拍摄一系列截图：

```php
$browser->responsiveScreenshots('filename');
```

`screenshotElement` 方法可用于截取页面上某个特定元素的截图：

```php
$browser->screenshotElement('#selector', 'filename');
```

<a name="storing-console-output-to-disk"></a>
### 把控制台输出保存到磁盘

你可以使用 `storeConsoleLog` 方法把当前浏览器的控制台输出以给定的文件名写入磁盘。控制台输出会存放在 `tests/Browser/console` 目录中：

```php
$browser->storeConsoleLog('filename');
```

<a name="storing-page-source-to-disk"></a>
### 把页面源码保存到磁盘

你可以使用 `storeSource` 方法把当前页面的源码以给定的文件名写入磁盘。页面源码会存放在 `tests/Browser/source` 目录中：

```php
$browser->storeSource('filename');
```

<a name="interacting-with-elements"></a>
## 与元素交互

<a name="dusk-selectors"></a>
### Dusk 选择器

选择恰当的 CSS 选择器来与元素交互，是编写 Dusk 测试中最困难的部分之一。随着时间推移，前端改动可能导致如下 CSS 选择器失效，进而让你的测试出问题：

```html
// HTML……

<button>Login</button>

// 测试……

$browser->click('.login-page .container div > button');
```

Dusk 选择器让你可以专注于编写有效的测试，而不必记住 CSS 选择器。要定义一个选择器，请给你的 HTML 元素添加一个 `dusk` 属性。然后在与 Dusk 浏览器交互时，用 `@` 作为选择器前缀来操作附加的元素：

```html
// HTML……

<button dusk="login-button">Login</button>

// 测试……

$browser->click('@login-button');
```

如有需要，你可以通过 `selectorHtmlAttribute` 方法自定义 Dusk 选择器所使用的 HTML 属性。通常，该方法应当在你应用的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Laravel\Dusk\Dusk;

Dusk::selectorHtmlAttribute('data-dusk');
```

<a name="text-values-and-attributes"></a>
### 文本、值与属性

<a name="retrieving-setting-values"></a>
#### 获取和设置值

Dusk 提供了若干方法，用于与页面上元素的当前值、显示文本和属性交互。例如，要获取匹配某个给定 CSS 或 Dusk 选择器的元素的「值」，可以使用 `value` 方法：

```php
// 获取值……
$value = $browser->value('selector');

// 设置值……
$browser->value('selector', 'value');
```

你可以使用 `inputValue` 方法获取具有给定字段名的输入元素的「值」：

```php
$value = $browser->inputValue('field');
```

<a name="retrieving-text"></a>
#### 获取文本

`text` 方法可用于获取匹配给定选择器的元素的显示文本：

```php
$text = $browser->text('selector');
```

<a name="retrieving-attributes"></a>
#### 获取属性

最后，`attribute` 方法可用于获取匹配给定选择器的元素的某个属性值：

```php
$attribute = $browser->attribute('selector', 'value');
```

<a name="interacting-with-forms"></a>
### 与表单交互

<a name="typing-values"></a>
#### 输入值

Dusk 提供了多种与表单和输入元素交互的方法。首先，我们来看一个向输入字段中输入文本的示例：

```php
$browser->type('email', 'taylor@laravel.com');
```

请注意，虽然该方法接受选择器参数，但我们并不需要向 `type` 方法传入 CSS 选择器。如果没有提供 CSS 选择器，Dusk 会查找具有给定 `name` 属性的 `input` 或 `textarea` 字段。

如果要在不清空内容的情况下向字段追加文本，可以使用 `append` 方法：

```php
$browser->type('tags', 'foo')
    ->append('tags', ', bar, baz');
```

你可以使用 `clear` 方法清空输入框的值：

```php
$browser->clear('email');
```

你可以使用 `typeSlowly` 方法指示 Dusk 缓慢输入。默认情况下，Dusk 会在两次按键之间暂停 100 毫秒。如果想自定义两次按键之间的间隔，可以把相应的毫秒数作为该方法的第三个参数传入：

```php
$browser->typeSlowly('mobile', '+1 (202) 555-5555');

$browser->typeSlowly('mobile', '+1 (202) 555-5555', 300);
```

你可以使用 `appendSlowly` 方法缓慢地追加文本：

```php
$browser->type('tags', 'foo')
    ->appendSlowly('tags', ', bar, baz');
```

<a name="dropdowns"></a>
#### 下拉列表

要选择 `select` 元素上的某个可用值，可以使用 `select` 方法。与 `type` 方法一样，`select` 方法不需要完整的 CSS 选择器。向 `select` 方法传值时，你应当传入选项自身的值，而不是显示文本：

```php
$browser->select('size', 'Large');
```

你可以省略第二个参数，从而随机选择一个选项：

```php
$browser->select('size');
```

通过把数组作为 `select` 方法的第二个参数，你可以指示该方法选择多个选项：

```php
$browser->select('categories', ['Art', 'Music']);
```

<a name="checkboxes"></a>
#### 复选框

要「勾选」某个复选框，可以使用 `check` 方法。与许多其他与输入相关的方法一样，它不需要完整的 CSS 选择器。如果找不到匹配的 CSS 选择器，Dusk 会查找具有匹配 `name` 属性的复选框：

```php
$browser->check('terms');
```

`uncheck` 方法可用于「取消勾选」某个复选框：

```php
$browser->uncheck('terms');
```

<a name="radio-buttons"></a>
#### 单选按钮

要「选中」某个 `radio` 输入选项，可以使用 `radio` 方法。与许多其他与输入相关的方法一样，它不需要完整的 CSS 选择器。如果找不到匹配的 CSS 选择器，Dusk 会查找具有匹配 `name` 和 `value` 属性的 `radio` 输入：

```php
$browser->radio('size', 'large');
```

<a name="attaching-files"></a>
### 附加文件

`attach` 方法可用于把文件附加到某个 `file` 输入元素。与许多其他与输入相关的方法一样，它不需要完整的 CSS 选择器。如果找不到匹配的 CSS 选择器，Dusk 会查找具有匹配 `name` 属性的 `file` 输入：

```php
$browser->attach('photo', __DIR__.'/photos/mountains.png');
```

> [!WARNING]
> attach 函数要求你的服务器上已安装并启用 `Zip` PHP 扩展。

<a name="pressing-buttons"></a>
### 按下按钮

`press` 方法可用于点击页面上的某个按钮元素。传给 `press` 方法的参数可以是该按钮的显示文本，也可以是 CSS / Dusk 选择器：

```php
$browser->press('Login');
```

在提交表单时，许多应用会在按钮被按下后禁用表单提交按钮，并在表单提交的 HTTP 请求完成时重新启用该按钮。要按下按钮并等待它被重新启用，可以使用 `pressAndWaitFor` 方法：

```php
// 按下按钮，最多等待 5 秒直到它被启用……
$browser->pressAndWaitFor('Save');

// 按下按钮，最多等待 1 秒直到它被启用……
$browser->pressAndWaitFor('Save', 1);
```

<a name="clicking-links"></a>
### 点击链接

要点击一个链接，可以在浏览器实例上使用 `clickLink` 方法。`clickLink` 方法会点击具有给定显示文本的链接：

```php
$browser->clickLink($linkText);
```

你可以使用 `seeLink` 方法判断页面上是否可见具有给定显示文本的链接：

```php
if ($browser->seeLink($linkText)) {
    // ...
}
```

> [!WARNING]
> 这些方法会与 jQuery 交互。如果页面上没有 jQuery，Dusk 会自动把它注入页面，使其在测试期间可用。

<a name="using-the-keyboard"></a>
### 使用键盘

`keys` 方法允许你向某个元素提供比 `type` 方法通常所支持的更复杂的输入序列。例如，你可以指示 Dusk 在输入值时按住修饰键。在这个例子中，输入 `taylor` 到匹配给定选择器的元素时，`shift` 键会一直按住。输入完 `taylor` 后，再输入 `swift`，此时不按住任何修饰键：

```php
$browser->keys('selector', ['{shift}', 'taylor'], 'swift');
```

`keys` 方法的另一个实用场景是向你应用的主 CSS 选择器发送一组「键盘快捷键」：

```php
$browser->keys('.app', ['{command}', 'j']);
```

> [!NOTE]
> 所有修饰键（例如 `{command}`）都包裹在 `{}` 字符中，并与 `Facebook\WebDriver\WebDriverKeys` 类中定义的常量对应，可[在 GitHub 上查看](https://github.com/php-webdriver/php-webdriver/blob/master/lib/WebDriverKeys.php)。

<a name="fluent-keyboard-interactions"></a>
#### 链式键盘交互

Dusk 还提供了一个 `withKeyboard` 方法，让你可以通过 `Laravel\Dusk\Keyboard` 类以链式方式执行复杂的键盘交互。`Keyboard` 类提供了 `press`、`release`、`type` 和 `pause` 方法：

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

如果你想定义自定义的键盘交互，以便在整个测试套件中轻松复用，可以使用 `Keyboard` 类提供的 `macro` 方法。通常，你应当在某个[服务提供者（Service Provider）](/docs/{{version}}/providers)的 `boot` 方法中调用该方法：

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

`macro` 函数的第一个参数接受一个名称，第二个参数接受一个闭包。当把该宏作为 `Keyboard` 实例上的方法调用时，宏的闭包就会被执行：

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

`clickAtPoint` 方法可用于点击浏览器可视区域中某一组坐标处的最上层元素：

```php
$browser->clickAtPoint($x = 0, $y = 0);
```

`doubleClick` 方法可用于模拟鼠标双击：

```php
$browser->doubleClick();

$browser->doubleClick('.selector');
```

`rightClick` 方法可用于模拟鼠标右键单击：

```php
$browser->rightClick();

$browser->rightClick('.selector');
```

`clickAndHold` 方法可用于模拟按下并按住某个鼠标按钮。随后调用 `releaseMouse` 方法即可撤销该行为并释放鼠标按钮：

```php
$browser->clickAndHold('.selector');

$browser->clickAndHold()
    ->pause(1000)
    ->releaseMouse();
```

`controlClick` 方法可用于模拟浏览器中的 `ctrl+click` 事件：

```php
$browser->controlClick();

$browser->controlClick('.selector');
```

<a name="mouseover"></a>
#### 鼠标悬停

`mouseover` 方法可用于在需要把鼠标移动到匹配给定 CSS 或 Dusk 选择器的元素上时：

```php
$browser->mouseover('.selector');
```

<a name="drag-drop"></a>
#### 拖放

`drag` 方法可用于把匹配给定选择器的元素拖动到另一个元素上：

```php
$browser->drag('.from-selector', '.to-selector');
```

或者，你可以沿单个方向拖动元素：

```php
$browser->dragLeft('.selector', $pixels = 10);
$browser->dragRight('.selector', $pixels = 10);
$browser->dragUp('.selector', $pixels = 10);
$browser->dragDown('.selector', $pixels = 10);
```

最后，你可以按给定的偏移量拖动元素：

```php
$browser->dragOffset('.selector', $x = 10, $y = 10);
```

<a name="javascript-dialogs"></a>
### JavaScript 对话框

Dusk 提供了多种与 JavaScript 对话框交互的方法。例如，你可以使用 `waitForDialog` 方法等待某个 JavaScript 对话框出现。该方法接受一个可选参数，指示等待该对话框出现所需的秒数：

```php
$browser->waitForDialog($seconds = null);
```

`assertDialogOpened` 方法可用于断言某个对话框已显示，并包含给定消息：

```php
$browser->assertDialogOpened('Dialog message');
```

如果该 JavaScript 对话框包含一个输入提示，你可以使用 `typeInDialog` 方法在该提示中输入一个值：

```php
$browser->typeInDialog('Hello World');
```

要通过点击「OK」按钮关闭某个已打开的 JavaScript 对话框，可以调用 `acceptDialog` 方法：

```php
$browser->acceptDialog();
```

要通过点击「Cancel」按钮关闭某个已打开的 JavaScript 对话框，可以调用 `dismissDialog` 方法：

```php
$browser->dismissDialog();
```

<a name="interacting-with-iframes"></a>
### 与内联框架交互

如果你需要与某个 iframe 内的元素交互，可以使用 `withinFrame` 方法。在传给 `withinFrame` 方法的闭包内进行的所有元素交互，都将被限定在所指定 iframe 的上下文中：

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

有时你可能希望执行若干操作，并把所有这些操作都限定在某个给定选择器的范围内。例如，你可能希望断言某段文本只存在于某个表格中，然后点击该表格内的某个按钮。可以使用 `with` 方法来实现这一点。在传给 `with` 方法的闭包内执行的所有操作，都将被限定在原有选择器的范围内：

```php
$browser->with('.table', function (Browser $table) {
    $table->assertSee('Hello World')
        ->clickLink('Delete');
});
```

你偶尔需要在当前作用域之外执行断言。可以使用 `elsewhere` 和 `elsewhereWhenAvailable` 方法来实现：

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

在测试大量使用 JavaScript 的应用时，通常必须「等待」某些元素或数据可用，然后才能继续测试。Dusk 让这件事变得非常容易。通过各种方法，你可以等待元素在页面上变得可见，甚至可以等到某个给定的 JavaScript 表达式求值为 `true`。

<a name="waiting"></a>
#### 等待

如果你只需要让测试暂停给定的毫秒数，使用 `pause` 方法：

```php
$browser->pause(1000);
```

如果你需要在给定条件为 `true` 时才暂停测试，使用 `pauseIf` 方法：

```php
$browser->pauseIf(App::environment('production'), 1000);
```

同样地，如果你需要在给定条件不为 `true` 时才暂停测试，可以使用 `pauseUnless` 方法：

```php
$browser->pauseUnless(App::environment('testing'), 1000);
```

<a name="waiting-for-selectors"></a>
#### 等待选择器

`waitFor` 方法可用于暂停测试的执行，直到匹配给定 CSS 或 Dusk 选择器的元素显示在页面上。默认情况下，它最多会暂停测试 5 秒，然后抛出异常。如有必要，你可以把自定义的超时阈值作为该方法的第二个参数传入：

```php
// 最多等待 5 秒直到该选择器出现……
$browser->waitFor('.selector');

// 最多等待 1 秒直到该选择器出现……
$browser->waitFor('.selector', 1);
```

你也可以等待直到匹配给定选择器的元素包含给定的文本：

```php
// 最多等待 5 秒直到该选择器包含给定文本……
$browser->waitForTextIn('.selector', 'Hello World');

// 最多等待 1 秒直到该选择器包含给定文本……
$browser->waitForTextIn('.selector', 'Hello World', 1);
```

你也可以等待直到匹配给定选择器的元素从页面上消失：

```php
// 最多等待 5 秒直到该选择器消失……
$browser->waitUntilMissing('.selector');

// 最多等待 1 秒直到该选择器消失……
$browser->waitUntilMissing('.selector', 1);
```

或者，你可以等待直到匹配给定选择器的元素被启用或被禁用：

```php
// 最多等待 5 秒直到该选择器被启用……
$browser->waitUntilEnabled('.selector');

// 最多等待 1 秒直到该选择器被启用……
$browser->waitUntilEnabled('.selector', 1);

// 最多等待 5 秒直到该选择器被禁用……
$browser->waitUntilDisabled('.selector');

// 最多等待 1 秒直到该选择器被禁用……
$browser->waitUntilDisabled('.selector', 1);
```

<a name="scoping-selectors-when-available"></a>
#### 在元素可用时限定选择器作用域

偶尔你会希望等待某个匹配给定选择器的元素出现，然后再与该元素交互。例如，你可能希望等到某个模态窗口可用，然后按下该模态框中的「OK」按钮。可以使用 `whenAvailable` 方法来实现这一点。在给定闭包内执行的所有元素操作，都将被限定在原有选择器的范围内：

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
// 最多等待 5 秒直到出现该文本……
$browser->waitForText('Hello World');

// 最多等待 1 秒直到出现该文本……
$browser->waitForText('Hello World', 1);
```

你可以使用 `waitUntilMissingText` 方法来等待显示的文本从页面上被移除：

```php
// 最多等待 5 秒直到该文本被移除……
$browser->waitUntilMissingText('Hello World');

// 最多等待 1 秒直到该文本被移除……
$browser->waitUntilMissingText('Hello World', 1);
```

<a name="waiting-for-links"></a>
#### 等待链接

`waitForLink` 方法可用于等待给定链接文本显示在页面上：

```php
// 最多等待 5 秒直到出现该链接……
$browser->waitForLink('Create');

// 最多等待 1 秒直到出现该链接……
$browser->waitForLink('Create', 1);
```

<a name="waiting-for-inputs"></a>
#### 等待输入框

`waitForInput` 方法可用于等待给定输入字段在页面上可见：

```php
// 最多等待 5 秒直到出现该输入框……
$browser->waitForInput($field);

// 最多等待 1 秒直到出现该输入框……
$browser->waitForInput($field, 1);
```

<a name="waiting-on-the-page-location"></a>
#### 等待页面位置

在进行诸如 `$browser->assertPathIs('/home')` 这样的路径断言时，如果 `window.location.pathname` 正在异步更新，断言可能会失败。你可以使用 `waitForLocation` 方法来等待位置变为给定值：

```php
$browser->waitForLocation('/secret');
```

`waitForLocation` 方法还可以用来等待当前窗口位置变为一个完全限定的 URL：

```php
$browser->waitForLocation('https://example.com/path');
```

你也可以等待某个[命名路由](/docs/{{version}}/routing#named-routes)的位置：

```php
$browser->waitForRoute($routeName, $parameters);
```

<a name="waiting-for-page-reloads"></a>
#### 等待页面重新加载

如果你需要在执行某个操作后等待页面重新加载，请使用 `waitForReload` 方法：

```php
use Laravel\Dusk\Browser;

$browser->waitForReload(function (Browser $browser) {
    $browser->press('Submit');
})
->assertSee('Success!');
```

由于等待页面重新加载的需求通常出现在点击按钮之后，为方便起见，你可以使用 `clickAndWaitForReload` 方法：

```php
$browser->clickAndWaitForReload('.selector')
    ->assertSee('something');
```

<a name="waiting-on-javascript-expressions"></a>
#### 等待 JavaScript 表达式

有时你可能希望暂停测试的执行，直到某个给定的 JavaScript 表达式求值为 `true`。使用 `waitUntil` 方法可以轻松实现这一点。向该方法传入表达式时，你不需要包含 `return` 关键字或结尾的分号：

```php
// 最多等待 5 秒直到该表达式为 true……
$browser->waitUntil('App.data.servers.length > 0');

// 最多等待 1 秒直到该表达式为 true……
$browser->waitUntil('App.data.servers.length > 0', 1);
```

<a name="waiting-on-vue-expressions"></a>
#### 等待 Vue 表达式

`waitUntilVue` 和 `waitUntilVueIsNot` 方法可用于等待某个 [Vue 组件](https://vuejs.org)属性具有给定值：

```php
// 等待直到该组件属性包含给定值……
$browser->waitUntilVue('user.name', 'Taylor', '@user');

// 等待直到该组件属性不包含给定值……
$browser->waitUntilVueIsNot('user.name', null, '@user');
```

<a name="waiting-for-javascript-events"></a>
#### 等待 JavaScript 事件

`waitForEvent` 方法可用于暂停测试的执行，直到某个 JavaScript 事件发生：

```php
$browser->waitForEvent('load');
```

该事件监听器会附加到当前作用域，默认情况下是 `body` 元素。使用带作用域的选择器时，事件监听器会附加到匹配的元素上：

```php
$browser->with('iframe', function (Browser $iframe) {
    // 等待 iframe 的 load 事件……
    $iframe->waitForEvent('load');
});
```

你也可以把一个选择器作为 `waitForEvent` 方法的第二个参数，以便把事件监听器附加到特定元素上：

```php
$browser->waitForEvent('load', '.selector');
```

你也可以等待 `document` 和 `window` 对象上的事件：

```php
// 等待直到文档被滚动……
$browser->waitForEvent('scroll', 'document');

// 最多等待 5 秒直到窗口被调整大小……
$browser->waitForEvent('resize', 'window', 5);
```

<a name="waiting-with-a-callback"></a>
#### 使用回调等待

Dusk 中许多「等待」方法都基于底层的 `waitUsing` 方法。你可以直接使用该方法，等待某个给定闭包返回 `true`。`waitUsing` 方法接受最多等待的秒数、求值该闭包的间隔、该闭包本身，以及一条可选的失败消息：

```php
$browser->waitUsing(10, 1, function () use ($something) {
    return $something->isReady();
}, "Something wasn't ready in time.");
```

<a name="scrolling-an-element-into-view"></a>
### 把元素滚动到可视区域

有时你可能无法点击某个元素，因为它位于浏览器的可视区域之外。`scrollIntoView` 方法会滚动浏览器窗口，直到给定选择器对应的元素进入可视区域：

```php
$browser->scrollIntoView('.selector')
    ->click('.selector');
```

<a name="available-assertions"></a>
## 可用的断言

Dusk 提供了多种可用于针对你的应用做出断言的方法。所有可用的断言都记录在下面的列表中：

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

断言页面标题与给定文本匹配：

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

断言当前 URL（不含查询字符串）与给定字符串匹配：

```php
$browser->assertUrlIs($url);
```

<a name="assert-scheme-is"></a>
#### assertSchemeIs

断言当前 URL 的协议与给定协议匹配：

```php
$browser->assertSchemeIs($scheme);
```

<a name="assert-scheme-is-not"></a>
#### assertSchemeIsNot

断言当前 URL 的协议与给定协议不匹配：

```php
$browser->assertSchemeIsNot($scheme);
```

<a name="assert-host-is"></a>
#### assertHostIs

断言当前 URL 的主机与给定主机匹配：

```php
$browser->assertHostIs($host);
```

<a name="assert-host-is-not"></a>
#### assertHostIsNot

断言当前 URL 的主机与给定主机不匹配：

```php
$browser->assertHostIsNot($host);
```

<a name="assert-port-is"></a>
#### assertPortIs

断言当前 URL 的端口与给定端口匹配：

```php
$browser->assertPortIs($port);
```

<a name="assert-port-is-not"></a>
#### assertPortIsNot

断言当前 URL 的端口与给定端口不匹配：

```php
$browser->assertPortIsNot($port);
```

<a name="assert-path-begins-with"></a>
#### assertPathBeginsWith

断言当前 URL 的路径以给定路径开头：

```php
$browser->assertPathBeginsWith('/home');
```

<a name="assert-path-ends-with"></a>
#### assertPathEndsWith

断言当前 URL 的路径以给定路径结尾：

```php
$browser->assertPathEndsWith('/home');
```

<a name="assert-path-contains"></a>
#### assertPathContains

断言当前 URL 的路径包含给定路径：

```php
$browser->assertPathContains('/home');
```

<a name="assert-path-is"></a>
#### assertPathIs

断言当前路径与给定路径匹配：

```php
$browser->assertPathIs('/home');
```

<a name="assert-path-is-not"></a>
#### assertPathIsNot

断言当前路径与给定路径不匹配：

```php
$browser->assertPathIsNot('/home');
```

<a name="assert-route-is"></a>
#### assertRouteIs

断言当前 URL 与给定[命名路由](/docs/{{version}}/routing#named-routes)的 URL 匹配：

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

断言 URL 当前的哈希片段与给定片段匹配：

```php
$browser->assertFragmentIs('anchor');
```

<a name="assert-fragment-begins-with"></a>
#### assertFragmentBeginsWith

断言 URL 当前的哈希片段以给定片段开头：

```php
$browser->assertFragmentBeginsWith('anchor');
```

<a name="assert-fragment-is-not"></a>
#### assertFragmentIsNot

断言 URL 当前的哈希片段与给定片段不匹配：

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

断言某个加密 Cookie 具有给定值：

```php
$browser->assertCookieValue($name, $value);
```

<a name="assert-plain-cookie-value"></a>
#### assertPlainCookieValue

断言某个未加密 Cookie 具有给定值：

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

断言给定文本存在于该选择器内：

```php
$browser->assertSeeIn($selector, $text);
```

<a name="assert-dont-see-in"></a>
#### assertDontSeeIn

断言给定文本不存在于该选择器内：

```php
$browser->assertDontSeeIn($selector, $text);
```

<a name="assert-see-anything-in"></a>
#### assertSeeAnythingIn

断言该选择器内存在任意文本：

```php
$browser->assertSeeAnythingIn($selector);
```

<a name="assert-see-nothing-in"></a>
#### assertSeeNothingIn

断言该选择器内不存在任何文本：

```php
$browser->assertSeeNothingIn($selector);
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

断言给定源代码存在于页面上：

```php
$browser->assertSourceHas($code);
```

<a name="assert-source-missing"></a>
#### assertSourceMissing

断言给定源代码不存在于页面上：

```php
$browser->assertSourceMissing($code);
```

<a name="assert-see-link"></a>
#### assertSeeLink

断言给定链接存在于页面上：

```php
$browser->assertSeeLink($linkText);
```

<a name="assert-dont-see-link"></a>
#### assertDontSeeLink

断言给定链接不存在于页面上：

```php
$browser->assertDontSeeLink($linkText);
```

<a name="assert-input-value"></a>
#### assertInputValue

断言给定输入字段具有给定值：

```php
$browser->assertInputValue($field, $value);
```

<a name="assert-input-value-is-not"></a>
#### assertInputValueIsNot

断言给定输入字段不具有给定值：

```php
$browser->assertInputValueIsNot($field, $value);
```

<a name="assert-checked"></a>
#### assertChecked

断言给定复选框已勾选：

```php
$browser->assertChecked($field);
```

<a name="assert-not-checked"></a>
#### assertNotChecked

断言给定复选框未勾选：

```php
$browser->assertNotChecked($field);
```

<a name="assert-indeterminate"></a>
#### assertIndeterminate

断言给定复选框处于不确定状态：

```php
$browser->assertIndeterminate($field);
```

<a name="assert-radio-selected"></a>
#### assertRadioSelected

断言给定单选字段已被选中：

```php
$browser->assertRadioSelected($field, $value);
```

<a name="assert-radio-not-selected"></a>
#### assertRadioNotSelected

断言给定单选字段未被选中：

```php
$browser->assertRadioNotSelected($field, $value);
```

<a name="assert-selected"></a>
#### assertSelected

断言给定下拉列表选中了给定值：

```php
$browser->assertSelected($field, $value);
```

<a name="assert-not-selected"></a>
#### assertNotSelected

断言给定下拉列表未选中给定值：

```php
$browser->assertNotSelected($field, $value);
```

<a name="assert-select-has-options"></a>
#### assertSelectHasOptions

断言给定的一组值可供选择：

```php
$browser->assertSelectHasOptions($field, $values);
```

<a name="assert-select-missing-options"></a>
#### assertSelectMissingOptions

断言给定的一组值不可供选择：

```php
$browser->assertSelectMissingOptions($field, $values);
```

<a name="assert-select-has-option"></a>
#### assertSelectHasOption

断言给定值在给定字段上可供选择：

```php
$browser->assertSelectHasOption($field, $value);
```

<a name="assert-select-missing-option"></a>
#### assertSelectMissingOption

断言给定值不可供选择：

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

断言匹配给定选择器的元素在所提供属性上具有给定值：

```php
$browser->assertAttribute($selector, $attribute, $value);
```

<a name="assert-attribute-missing"></a>
#### assertAttributeMissing

断言匹配给定选择器的元素缺少所提供的属性：

```php
$browser->assertAttributeMissing($selector, $attribute);
```

<a name="assert-attribute-contains"></a>
#### assertAttributeContains

断言匹配给定选择器的元素在所提供的属性上包含给定值：

```php
$browser->assertAttributeContains($selector, $attribute, $value);
```

<a name="assert-attribute-doesnt-contain"></a>
#### assertAttributeDoesntContain

断言匹配给定选择器的元素在所提供的属性上不包含给定值：

```php
$browser->assertAttributeDoesntContain($selector, $attribute, $value);
```

<a name="assert-aria-attribute"></a>
#### assertAriaAttribute

断言匹配给定选择器的元素在所提供的 aria 属性上具有给定值：

```php
$browser->assertAriaAttribute($selector, $attribute, $value);
```

例如，给定标记 `<button aria-label="Add"></button>`，你可以像这样对 `aria-label` 属性进行断言：

```php
$browser->assertAriaAttribute('button', 'label', 'Add')
```

<a name="assert-data-attribute"></a>
#### assertDataAttribute

断言匹配给定选择器的元素在所提供的数据属性上具有给定值：

```php
$browser->assertDataAttribute($selector, $attribute, $value);
```

例如，给定标记 `<tr id="row-1" data-content="attendees"></tr>`，你可以像这样对 `data-label` 属性进行断言：

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

断言存在一个具有给定名称的输入框：

```php
$browser->assertInputPresent($name);
```

<a name="assert-input-missing"></a>
#### assertInputMissing

断言不存在具有给定名称的输入框：

```php
$browser->assertInputMissing($name);
```

<a name="assert-dialog-opened"></a>
#### assertDialogOpened

断言一个带有给定消息的 JavaScript 对话框已打开：

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

断言用户以给定用户的身份通过了认证：

```php
$browser->assertAuthenticatedAs($user);
```

<a name="assert-vue"></a>
#### assertVue

Dusk 甚至允许你对 [Vue 组件](https://vuejs.org)数据的状态进行断言。例如，假设你的应用包含以下 Vue 组件：

```js
// HTML……

<profile dusk="profile-component"></profile>

// 组件定义……

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
```

你可以像这样对该 Vue 组件的状态进行断言：

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
 * 一个基本的 Vue 测试示例。
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

断言某个给定的 Vue 组件数据属性与给定值不匹配：

```php
$browser->assertVueIsNot($property, $value, $componentSelector = null);
```

<a name="assert-vue-contains"></a>
#### assertVueContains

断言某个给定的 Vue 组件数据属性是一个数组，且包含给定值：

```php
$browser->assertVueContains($property, $value, $componentSelector = null);
```

<a name="assert-vue-doesnt-contain"></a>
#### assertVueDoesntContain

断言某个给定的 Vue 组件数据属性是一个数组，且不包含给定值：

```php
$browser->assertVueDoesntContain($property, $value, $componentSelector = null);
```

<a name="pages"></a>
## 页面

有时测试需要按顺序执行若干复杂操作。这会让你的测试更难阅读和理解。Dusk 页面允许你定义表达力强的操作，之后只需通过单个方法就能在给定页面上执行它们。页面还允许你为整个应用或某个单独页面定义常用选择器的快捷方式。

<a name="generating-pages"></a>
### 生成页面

要生成一个页面对象，请执行 `dusk:page` Artisan 命令。所有页面对象都会被放在你应用的 `tests/Browser/Pages` 目录中：

```shell
php artisan dusk:page Login
```

<a name="configuring-pages"></a>
### 配置页面

默认情况下，页面有三个方法：`url`、`assert` 和 `elements`。我们现在讨论 `url` 和 `assert` 方法。`elements` 方法将在[下面更详细地讨论](#shorthand-selectors)。

<a name="the-url-method"></a>
#### `url` 方法

`url` 方法应当返回代表该页面的 URL 路径。Dusk 在浏览器中导航到该页面时会使用这个 URL：

```php
/**
 * 获取该页面的 URL。
 */
public function url(): string
{
    return '/login';
}
```

<a name="the-assert-method"></a>
#### `assert` 方法

`assert` 方法可以做出任何必要的断言，以验证浏览器确实位于给定页面上。该方法中其实不必放置任何内容；不过，你完全可以按需添加这些断言。导航到该页面时，这些断言会自动执行：

```php
/**
 * 断言浏览器位于该页面上。
 */
public function assert(Browser $browser): void
{
    $browser->assertPathIs($this->url());
}
```

<a name="navigating-to-pages"></a>
### 导航到页面

页面定义之后，你可以使用 `visit` 方法导航到该页面：

```php
use Tests\Browser\Pages\Login;

$browser->visit(new Login);
```

有时你可能已经位于某个给定页面上，需要把该页面的选择器和方法「加载」到当前测试上下文中。这种情况常见于按下按钮后被重定向到某个页面，而并未显式导航到该页面。在这种情况下，你可以使用 `on` 方法加载该页面：

```php
use Tests\Browser\Pages\CreatePlaylist;

$browser->visit('/dashboard')
        ->clickLink('Create Playlist')
        ->on(new CreatePlaylist)
        ->assertSee('@create');
```

<a name="shorthand-selectors"></a>
### 简写选择器

页面类中的 `elements` 方法允许你为页面上的任意 CSS 选择器定义快捷、易记的简写。例如，让 我们为应用登录页面上的「email」输入字段定义一个简写：

```php
/**
 * 获取该页面的元素简写。
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

简写定义之后，你可以在任何原本会使用完整 CSS 选择器的位置使用该简写选择器：

```php
$browser->type('@email', 'taylor@laravel.com');
```

<a name="global-shorthand-selectors"></a>
#### 全局简写选择器

安装 Dusk 之后，一个基础的 `Page` 类会被放在你的 `tests/Browser/Pages` 目录中。该类包含一个 `siteElements` 方法，可用于定义在整个应用的所有页面上都应可用的全局简写选择器：

```php
/**
 * 获取整个站点的全局元素简写。
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

除了页面上默认定义的方法之外，你还可以定义额外的方法，供在整个测试中使用。例如，假设我们正在构建一个音乐管理应用。该应用某个页面上的一项常见操作可能是创建播放列表。与其在每个测试中重新编写创建播放列表的逻辑，你可以在页面类上定义一个 `createPlaylist` 方法：

```php
<?php

namespace Tests\Browser\Pages;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Page;

class Dashboard extends Page
{
    // 其他页面方法……

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

该方法定义之后，你就可以在任何使用该页面的测试中使用它。浏览器实例会自动作为第一个参数传给自定义页面方法：

```php
use Tests\Browser\Pages\Dashboard;

$browser->visit(new Dashboard)
        ->createPlaylist('My Playlist')
        ->assertSee('My Playlist');
```

<a name="components"></a>
## 组件

组件与 Dusk 的「页面对象」类似，但它们面向的是在整个应用中重复使用的 UI 片段和功能，例如导航栏或通知窗口。因此，组件并不绑定到特定的 URL。

<a name="generating-components"></a>
### 生成组件

要生成一个组件，请执行 `dusk:component` Artisan 命令。新组件会被放在 `tests/Browser/Components` 目录中：

```shell
php artisan dusk:component DatePicker
```

如上所示，「日期选择器」就是一个可能在应用各种页面上都存在的组件示例。在整个测试套件的数十个测试中手动编写选择日期的浏览器自动化逻辑会变得很繁琐。相反，我们可以定义一个 Dusk 组件来表示该日期选择器，从而把那段逻辑封装在组件中：

```php
<?php

namespace Tests\Browser\Components;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Component as BaseComponent;

class DatePicker extends BaseComponent
{
    /**
     * 获取该组件的根选择器。
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
     * 获取该组件的元素简写。
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
     * 选择给定日期。
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

该组件定义之后，我们就可以在任意测试中轻松地在日期选择器里选择日期。而且，如果选择日期所需的逻辑发生了变化，我们只需更新该组件即可：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\Browser\Components\DatePicker;

uses(DatabaseMigrations::class);

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
     * 一个基本的组件测试示例。
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

<a name="continuous-integration"></a>
## 持续集成

> [!WARNING]
> 大多数 Dusk 持续集成配置都要求你的 Laravel 应用通过内置的 PHP 开发服务器在 8000 端口上提供服务。因此，在继续之前，你应当确保你的持续集成环境的 `APP_URL` 环境变量值为 `http://127.0.0.1:8000`。

<a name="running-tests-on-heroku-ci"></a>
### Heroku CI

要在 [Heroku CI](https://www.heroku.com/continuous-integration) 上运行 Dusk 测试，请把以下 Google Chrome buildpack 和脚本添加到你的 Heroku `app.json` 文件中：

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

要在 [Travis CI](https://travis-ci.org) 上运行 Dusk 测试，请使用以下 `.travis.yml` 配置。由于 Travis CI 不是图形环境，我们需要额外执行一些步骤来启动 Chrome 浏览器。此外，我们会使用 `php artisan serve` 启动 PHP 内置的 Web 服务器：

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

如果你使用 [GitHub Actions](https://github.com/features/actions) 运行 Dusk 测试，可以把以下配置文件作为起点。与 TravisCI 一样，我们会使用 `php artisan serve` 命令启动 PHP 内置的 Web 服务器：

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
      - uses: actions/checkout@v4
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

如果你使用 [Chipper CI](https://chipperci.com) 运行 Dusk 测试，可以把以下配置文件作为起点。我们会使用 PHP 内置服务器来运行 Laravel，以便监听请求：

```yaml
# 文件 .chipperci.yml
version: 1

environment:
  php: 8.2
  node: 16

# 在构建环境中包含 Chrome
services:
  - dusk

# 构建所有提交
on:
   push:
      branches: .*

pipeline:
  - name: Setup
    cmd: |
      cp -v .env.example .env
      composer install --no-interaction --prefer-dist --optimize-autoloader
      php artisan key:generate

      # 创建 dusk 环境文件，确保 APP_URL 使用 BUILD_HOST
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

要了解更多关于在 Chipper CI 上运行 Dusk 测试的信息（包括如何使用数据库），请查阅 [Chipper CI 官方文档](https://chipperci.com/docs/testing/laravel-dusk-new/)。
