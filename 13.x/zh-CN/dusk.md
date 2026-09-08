# Laravel Dusk

## 介绍

> [!WARNING]
> [Pest 4](https://pestphp.com/) 现在包含了自动化的浏览器测试，与 Laravel Dusk 相比提供了显著的性能与可用性提升。对于新项目，我们建议使用 Pest 进行浏览器测试。

[Laravel Dusk](https://github.com/laravel/dusk) 提供了一个富有表现力、易于使用的浏览器自动化与测试 API。默认情况下，Dusk 不需要你在本地计算机上安装 JDK 或 Selenium。相反，Dusk 使用一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装。但是，你可以自由地使用任何其他你希望的 Selenium 兼容驱动。

## 安装

要开始使用，你应该安装 [Google Chrome](https://www.google.com/chrome) 并将 `laravel/dusk` Composer 依赖添加到你的项目中：

```shell
composer require laravel/dusk --dev
```

> [!WARNING]
> 如果你手动注册 Dusk 的服务提供者，你应当**永远不要**在生产环境中注册它，因为这样做可能导致任意用户能够对你的应用程序进行认证。

安装 Dusk 包之后，执行 `dusk:install` Artisan 命令。`dusk:install` 命令将创建一个 `tests/Browser` 目录、一个示例 Dusk 测试，并为你的操作系统安装 Chrome Driver 二进制文件：

```shell
php artisan dusk:install
```

接下来，在你的应用程序的 `.env` 文件中设置 `APP_URL` 环境变量。该值应与你在浏览器中访问应用程序所用的 URL 相匹配。

> [!NOTE]
> 如果你使用 [Laravel Sail](/topic/Laravel%2013.x/e296opw9q7.html) 来管理你的本地开发环境，也请查阅 Sail 文档中关于 [配置和运行 Dusk 测试](/topic/Laravel%2013.x/e296opw9q7.html) 的部分。

### 管理 ChromeDriver 安装

如果你想安装与 Laravel Dusk 通过 `dusk:install` 命令安装的不同版本的 ChromeDriver，你可以使用 `dusk:chrome-driver` 命令：

```shell
# 为你的操作系统安装最新版本的 ChromeDriver...
php artisan dusk:chrome-driver

# 为你的操作系统安装指定版本的 ChromeDriver...
php artisan dusk:chrome-driver 86

# 为所有支持的操作系统安装指定版本的 ChromeDriver...
php artisan dusk:chrome-driver --all

# 安装与检测到的 Chrome / Chromium 版本相匹配的 ChromeDriver 版本...
php artisan dusk:chrome-driver --detect
```

> [!WARNING]
> Dusk 要求 `chromedriver` 二进制文件是可执行的。如果你在运行 Dusk 时遇到问题，你应该使用以下命令确保这些二进制文件是可执行的：`chmod -R 0755 vendor/laravel/dusk/bin/`。

### 使用其他浏览器

默认情况下，Dusk 使用 Google Chrome 和一个独立的 [ChromeDriver](https://sites.google.com/chromium.org/driver) 安装来运行你的浏览器测试。但是，你可以启动自己的 Selenium 服务器，并针对任何你希望的浏览器运行测试。

要开始使用，请打开你的 `tests/DuskTestCase.php` 文件，这是你应用程序的基础 Dusk 测试用例。在此文件内，你可以移除对 `startChromeDriver` 方法的调用。这将阻止 Dusk 自动启动 ChromeDriver：

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

接下来，你可以修改 `driver` 方法，以连接到你选择的 URL 和端口。此外，你可以修改应传递给 WebDriver 的"期望能力"：

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

## 快速入门

### 生成测试

要生成 Dusk 测试，请使用 `dusk:make` Artisan 命令。生成的测试将放在 `tests/Browser` 目录中：

```shell
php artisan dusk:make LoginTest
```

### 在每次测试后重置数据库

你编写的大多数测试都将与从应用程序数据库中检索数据的页面进行交互；但是，你的 Dusk 测试应该永远不要使用 `RefreshDatabase` trait。`RefreshDatabase` trait 利用数据库事务，而事务在 HTTP 请求之间不适用或不可用。相反，你有两个选择：`DatabaseMigrations` trait 和 `DatabaseTruncation` trait。

#### 使用数据库迁移

`DatabaseMigrations` trait 将在每次测试之前运行你的数据库迁移。但是，为每次测试删除并重新创建你的数据库表通常比截断表更慢：

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
> 执行 Dusk 测试时不能使用 SQLite 内存数据库。由于浏览器在其自己的进程内执行，它将无法访问其他进程的内存数据库。

#### 使用数据库截断

`DatabaseTruncation` trait 将在第一次测试时迁移你的数据库，以确保你的数据库表已正确创建。但是，在后续的测试中，数据库的表将被简单地截断——与重新运行所有数据库迁移相比提供了速度提升：

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

默认情况下，此 trait 将截断除 `migrations` 表之外的所有表。如果你想自定义应该被截断的表，你可以在你的测试类上定义一个 `$tablesToTruncate` 属性：

> [!NOTE]
> 如果你使用 Pest，你应该在基础 `DuskTestCase` 类或你的测试文件所继承的任何类上定义属性或方法。

```php
/**
 * 指示哪些表应该被截断。
 *
 * @var array
 */
protected $tablesToTruncate = ['users'];
```

或者，你可以在你的测试类上定义一个 `$exceptTables` 属性，以指定哪些表应该被排除在截断之外：

```php
/**
 * 指示哪些表应该被排除在截断之外。
 *
 * @var array
 */
protected $exceptTables = ['users'];
```

要指定哪些数据库连接应该截断其表，你可以在你的测试类上定义一个 `$connectionsToTruncate` 属性：

```php
/**
 * 指示哪些连接应该截断其表。
 *
 * @var array
 */
protected $connectionsToTruncate = ['mysql'];
```

如果你想在数据库截断执行之前或之后执行代码，你可以在你的测试类上定义 `beforeTruncatingDatabase` 或 `afterTruncatingDatabase` 方法：

```php
/**
 * 在数据库开始截断之前执行任何应该进行的工作。
 */
protected function beforeTruncatingDatabase(): void
{
    //
}

/**
 * 在数据库完成截断之后执行任何应该进行的工作。
 */
protected function afterTruncatingDatabase(): void
{
    //
}
```

### 运行测试

要运行你的浏览器测试，请执行 `dusk` Artisan 命令：

```shell
php artisan dusk
```

如果你上次运行 `dusk` 命令时出现测试失败，你可以使用 `dusk:fails` 命令先重新运行失败的测试，以节省时间：

```shell
php artisan dusk:fails
```

`dusk` 命令接受 Pest / PHPUnit 测试运行器通常接受的任何参数，例如允许你只运行给定 [分组](https://docs.phpunit.de/en/10.5/annotations.html#group) 的测试：

```shell
php artisan dusk --group=foo
```

> [!NOTE]
> 如果你使用 [Laravel Sail](/topic/Laravel%2013.x/e296opw9q7.html) 来管理你的本地开发环境，请查阅 Sail 文档中关于 [配置和运行 Dusk 测试](/topic/Laravel%2013.x/e296opw9q7.html) 的部分。

#### 手动启动 ChromeDriver

默认情况下，Dusk 将自动尝试启动 ChromeDriver。如果这对你的特定系统不适用，你可以在运行 `dusk` 命令之前手动启动 ChromeDriver。如果你选择手动启动 ChromeDriver，你应该注释掉你的 `tests/DuskTestCase.php` 文件中的以下行：

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

此外，如果你在 9515 以外的端口启动 ChromeDriver，你应该修改同一类的 `driver` 方法以反映正确的端口：

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

### 环境处理

要强制 Dusk 在运行测试时使用它自己的环境文件，请在你的项目根目录中创建一个 `.env.dusk.{environment}` 文件。例如，如果你将从 `local` 环境发起 `dusk` 命令，你应该创建一个 `.env.dusk.local` 文件。

运行测试时，Dusk 将备份你的 `.env` 文件并将你的 Dusk 环境重命名为 `.env`。测试完成后，你的 `.env` 文件将被恢复。

## 浏览器基础

### 创建浏览器

要开始使用，让我们编写一个验证我们能否登录应用程序的测试。生成测试后，我们可以修改它以导航到登录页面，输入一些凭据，并点击"Login"按钮。要创建浏览器实例，你可以从你的 Dusk 测试中调用 `browse` 方法：

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

正如你在上面的示例中所看到的，`browse` 方法接受一个闭包。浏览器实例将由 Dusk 自动传递给此闭包，并且是与你的应用程序进行交互和对其进行断言的主要对象。

#### 创建多个浏览器

有时你可能需要多个浏览器才能正确执行测试。例如，可能需要多个浏览器来测试与 WebSocket 交互的聊天屏幕。要创建多个浏览器，只需在传递给 `browse` 方法的闭包签名中添加更多的浏览器参数：

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

### 导航

`visit` 方法可用于导航到你的应用程序内的给定 URI：

```php
$browser->visit('/login');
```

你可以使用 `visitRoute` 方法导航到 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html)：

```php
$browser->visitRoute($routeName, $parameters);
```

你可以使用 `back` 和 `forward` 方法导航"后退"和"前进"：

```php
$browser->back();

$browser->forward();
```

你可以使用 `refresh` 方法刷新页面：

```php
$browser->refresh();
```

### 调整浏览器窗口大小

你可以使用 `resize` 方法调整浏览器窗口的大小：

```php
$browser->resize(1920, 1080);
```

`maximize` 方法可用于最大化浏览器窗口：

```php
$browser->maximize();
```

`fitContent` 方法将调整浏览器窗口的大小以匹配其内容的大小：

```php
$browser->fitContent();
```

当测试失败时，Dusk 将在截图之前自动调整浏览器大小以适配内容。你可以通过在你的测试中调用 `disableFitOnFailure` 方法来禁用此功能：

```php
$browser->disableFitOnFailure();
```

你可以使用 `move` 方法将浏览器窗口移动到屏幕上的不同位置：

```php
$browser->move($x = 100, $y = 100);
```

### 浏览器宏

如果你想定义一个可在各种测试中重复使用的自定义浏览器方法，你可以使用 `Browser` 类上的 `macro` 方法。通常，你应该从 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用此方法：

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

`macro` 函数接受一个名称作为其第一个参数，一个闭包作为其第二个参数。宏的闭包将在把宏作为 `Browser` 实例上的方法调用时执行：

```php
$this->browse(function (Browser $browser) use ($user) {
    $browser->visit('/pay')
        ->scrollToElement('#credit-card-details')
        ->assertSee('Enter Credit Card Details');
});
```

### 认证

通常，你测试的页面需要认证。你可以使用 Dusk 的 `loginAs` 方法，以避免在每次测试中与你的应用程序的登录界面交互。`loginAs` 方法接受与你的可认证模型关联的主键或可认证模型实例：

```php
use App\Models\User;
use Laravel\Dusk\Browser;

$this->browse(function (Browser $browser) {
    $browser->loginAs(User::find(1))
        ->visit('/home');
});
```

> [!WARNING]
> 使用 `loginAs` 方法后，用户会话将在文件内的所有测试中得以保持。

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

你可以使用 `deleteCookie` 方法删除给定的 Cookie：

```php
$browser->deleteCookie('name');
```

### 执行 JavaScript

你可以使用 `script` 方法在浏览器内执行任意的 JavaScript 语句：

```php
$browser->script('document.documentElement.scrollTop = 0');

$browser->script([
    'document.body.scrollTop = 0',
    'document.documentElement.scrollTop = 0',
]);

$output = $browser->script('return window.location.pathname');
```

### 截图

你可以使用 `screenshot` 方法截图并使用给定的文件名存储。所有截图都将存储在 `tests/Browser/screenshots` 目录中：

```php
$browser->screenshot('filename');
```

`responsiveScreenshots` 方法可用于在各种断点处拍摄一系列截图：

```php
$browser->responsiveScreenshots('filename');
```

`screenshotElement` 方法可用于截取页面上特定元素的截图：

```php
$browser->screenshotElement('#selector', 'filename');
```

### 将控制台输出存储到磁盘

你可以使用 `storeConsoleLog` 方法将当前浏览器的控制台输出以给定的文件名写入磁盘。控制台输出将存储在 `tests/Browser/console` 目录中：

```php
$browser->storeConsoleLog('filename');
```

### 将页面源代码存储到磁盘

你可以使用 `storeSource` 方法将当前页面的源代码以给定的文件名写入磁盘。页面源代码将存储在 `tests/Browser/source` 目录中：

```php
$browser->storeSource('filename');
```

## 与元素交互

### Dusk 选择器

选择好的 CSS 选择器来与元素交互是编写 Dusk 测试中最困难的部分之一。随着时间的推移，前端更改可能会导致如下所示的 CSS 选择器破坏你的测试：

```html
// HTML...

<button>Login</button>
```

```php
// Test...

$browser->click('.login-page .container div > button');
```

Dusk 选择器允许你专注于编写有效的测试，而不是记住 CSS 选择器。要定义选择器，请向你的 HTML 元素添加一个 `dusk` 属性。然后，在与 Dusk 浏览器交互时，在选择器前加上 `@` 前缀，以在你的测试中操作附加的元素：

```html
// HTML...

<button dusk="login-button">Login</button>
```

```php
// Test...

$browser->click('@login-button');
```

如果需要，你可以通过 `selectorHtmlAttribute` 方法自定义 Dusk 选择器所使用的 HTML 属性。通常，此方法应该从你的应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Laravel\Dusk\Dusk;

Dusk::selectorHtmlAttribute('data-dusk');
```

### 文本、值和属性

#### 检索和设置值

Dusk 提供了几种方法与页面上元素的当前值、显示文本和属性进行交互。例如，要获取与给定 CSS 或 Dusk 选择器匹配的元素的"值"，请使用 `value` 方法：

```php
// 检索值...
$value = $browser->value('selector');

// 设置值...
$browser->value('selector', 'value');
```

你可以使用 `inputValue` 方法获取具有给定字段名称的 input 元素的"值"：

```php
$value = $browser->inputValue('field');
```

#### 检索文本

`text` 方法可用于检索与给定选择器匹配的元素的显示文本：

```php
$text = $browser->text('selector');
```

#### 检索属性

最后，`attribute` 方法可用于检索与给定选择器匹配的元素的属性值：

```php
$attribute = $browser->attribute('selector', 'value');
```

### 与表单交互

#### 输入值

Dusk 提供了多种方法与表单和输入元素进行交互。首先，让我们看一个在输入字段中输入文本的示例：

```php
$browser->type('email', 'taylor@laravel.com');
```

请注意，虽然该方法在必要时接受一个 CSS 选择器，但我们不需要将 CSS 选择器传入 `type` 方法。如果未提供 CSS 选择器，Dusk 将搜索具有给定 `name` 属性的 `input` 或 `textarea` 字段。

要在不清理其内容的情况下向字段追加文本，你可以使用 `append` 方法：

```php
$browser->type('tags', 'foo')
    ->append('tags', ', bar, baz');
```

你可以使用 `clear` 方法清理输入的值：

```php
$browser->clear('email');
```

你可以使用 `typeSlowly` 方法指示 Dusk 缓慢地输入。默认情况下，Dusk 将在每次按键之间暂停 100 毫秒。要自定义按键之间的时间量，你可以将适当的毫秒数作为第三个参数传递给该方法：

```php
$browser->typeSlowly('mobile', '+1 (202) 555-5555');

$browser->typeSlowly('mobile', '+1 (202) 555-5555', 300);
```

你可以使用 `appendSlowly` 方法缓慢地追加文本：

```php
$browser->type('tags', 'foo')
    ->appendSlowly('tags', ', bar, baz');
```

#### 下拉框

要选择 `select` 元素上可用的值，你可以使用 `select` 方法。与 `type` 方法一样，`select` 方法不需要完整的 CSS 选择器。向 `select` 方法传递值时，你应该传递底层的选项值，而不是显示文本：

```php
$browser->select('size', 'Large');
```

你可以通过省略第二个参数来选择一个随机选项：

```php
$browser->select('size');
```

通过将数组作为第二个参数提供给 `select` 方法，你可以指示该方法选择多个选项：

```php
$browser->select('categories', ['Art', 'Music']);
```

#### 复选框

要"勾选"一个 checkbox 输入，你可以使用 `check` 方法。与许多其他与输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 属性的 checkbox：

```php
$browser->check('terms');
```

`uncheck` 方法可用于"取消勾选"一个 checkbox 输入：

```php
$browser->uncheck('terms');
```

#### 单选按钮

要"选择"一个 `radio` 输入选项，你可以使用 `radio` 方法。与许多其他与输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 和 `value` 属性的 `radio` 输入：

```php
$browser->radio('size', 'large');
```

### 附加文件

`attach` 方法可用于将文件附加到 `file` 输入元素。与许多其他与输入相关的方法一样，不需要完整的 CSS 选择器。如果找不到 CSS 选择器匹配项，Dusk 将搜索具有匹配 `name` 属性的 `file` 输入：

```php
$browser->attach('photo', __DIR__.'/photos/mountains.png');
```

> [!WARNING]
> `attach` 函数要求在你的服务器上安装并启用 `Zip` PHP 扩展。

### 按下按钮

`press` 方法可用于点击页面上的按钮元素。传递给 `press` 方法的参数可以是按钮的显示文本，也可以是 CSS / Dusk 选择器：

```php
$browser->press('Login');
```

提交表单时，许多应用程序会在按下表单的提交按钮后禁用它，然后在表单提交的 HTTP 请求完成时重新启用该按钮。要按下按钮并等待按钮重新启用，你可以使用 `pressAndWaitFor` 方法：

```php
// 按下按钮并最多等待 5 秒使其被启用...
$browser->pressAndWaitFor('Save');

// 按下按钮并最多等待 1 秒使其被启用...
$browser->pressAndWaitFor('Save', 1);
```

### 点击链接

要点击链接，你可以使用浏览器实例上的 `clickLink` 方法。`clickLink` 方法将点击具有给定显示文本的链接：

```php
$browser->clickLink($linkText);
```

你可以使用 `seeLink` 方法确定页面上是否可见具有给定显示文本的链接：

```php
if ($browser->seeLink($linkText)) {
    // ...
}
```

> [!WARNING]
> 这些方法与 jQuery 交互。如果页面上没有 jQuery，Dusk 将自动将其注入页面，以便在测试期间可用。

### 使用键盘

`keys` 方法允许你向给定元素提供比 `type` 方法通常允许的更复杂的输入序列。例如，你可以指示 Dusk 在输入值的同时按住修饰键。在此示例中，在将 `taylor` 输入到与给定选择器匹配的元素时，将按住 `shift` 键。输入 `taylor` 之后，将在没有任何修饰键的情况下输入 `swift`：

```php
$browser->keys('selector', ['{shift}', 'taylor'], 'swift');
```

`keys` 方法的另一个有价值的用例是向你的应用程序的主要 CSS 选择器发送"键盘快捷键"组合：

```php
$browser->keys('.app', ['{command}', 'j']);
```

> [!NOTE]
> 所有修饰键（例如 `{command}`）都包裹在 `{}` 字符中，并与 `Facebook\WebDriver\WebDriverKeys` 类中定义的常量相匹配，该类可以在 [GitHub 上找到](https://github.com/php-webdriver/php-webdriver/blob/master/lib/WebDriverKeys.php)。

#### 流畅的键盘交互

Dusk 还提供了一个 `withKeyboard` 方法，允许你通过 `Laravel\Dusk\Keyboard` 类流畅地执行复杂的键盘交互。`Keyboard` 类提供了 `press`、`release`、`type` 和 `pause` 方法：

```php
use Laravel\Dusk\Keyboard;

$browser->withKeyboard(function (Keyboard $keyboard) {
    $keyboard->press('c')
        ->pause(1000)
        ->release('c')
        ->type(['c', 'e', 'o']);
});
```

#### 键盘宏

如果你想定义可轻松在整个测试套件中重复使用的自定义键盘交互，你可以使用 `Keyboard` 类提供的 `macro` 方法。通常，你应该从 [服务提供者](/topic/Laravel%2013.x/qk942kovw1.html) 的 `boot` 方法中调用此方法：

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

`macro` 函数接受一个名称作为其第一个参数，一个闭包作为其第二个参数。宏的闭包将在把宏作为 `Keyboard` 实例上的方法调用时执行：

```php
$browser->click('@textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->copy())
    ->click('@another-textarea')
    ->withKeyboard(fn (Keyboard $keyboard) => $keyboard->paste());
```

### 使用鼠标

#### 点击元素

`click` 方法可用于点击与给定 CSS 或 Dusk 选择器匹配的元素：

```php
$browser->click('.selector');
```

`clickAtXPath` 方法可用于点击与给定 XPath 表达式匹配的元素：

```php
$browser->clickAtXPath('//div[@class = "selector"]');
```

`clickAtPoint` 方法可用于点击相对于浏览器可视区域的给定坐标对处的最顶层元素：

```php
$browser->clickAtPoint($x = 0, $y = 0);
```

`doubleClick` 方法可用于模拟鼠标的双击：

```php
$browser->doubleClick();

$browser->doubleClick('.selector');
```

`rightClick` 方法可用于模拟鼠标的右键单击：

```php
$browser->rightClick();

$browser->rightClick('.selector');
```

`clickAndHold` 方法可用于模拟鼠标按钮被点击并按住。随后对 `releaseMouse` 方法的调用将撤销此行为并释放鼠标按钮：

```php
$browser->clickAndHold('.selector');

$browser->clickAndHold()
    ->pause(1000)
    ->releaseMouse();
```

`controlClick` 方法可用于在浏览器内模拟 `ctrl+click` 事件：

```php
$browser->controlClick();

$browser->controlClick('.selector');
```

`clickWhenVisible` 或 `clickWhenEnabled` 方法可用于在点击之前等待元素准备就绪，且只点击一次：

```php
$browser->clickWhenVisible('@save-button');
$browser->clickWhenEnabled('@submit-button');
```

#### 鼠标悬停

当你需要将鼠标移动到与给定 CSS 或 Dusk 选择器匹配的元素上时，可以使用 `mouseover` 方法：

```php
$browser->mouseover('.selector');
```

#### 拖放

`drag` 方法可用于将与给定选择器匹配的元素拖动到另一个元素：

```php
$browser->drag('.from-selector', '.to-selector');
```

或者，你可以在单个方向上拖动元素：

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

### JavaScript 对话框

Dusk 提供了各种与 JavaScript 对话框交互的方法。例如，你可以使用 `waitForDialog` 方法等待 JavaScript 对话框出现。此方法接受一个可选参数，指示等待对话框出现的秒数：

```php
$browser->waitForDialog($seconds = null);
```

`assertDialogOpened` 方法可用于断言对话框已显示且包含给定的消息：

```php
$browser->assertDialogOpened('Dialog message');
```

如果 JavaScript 对话框包含一个提示，你可以使用 `typeInDialog` 方法在提示中输入值：

```php
$browser->typeInDialog('Hello World');
```

要通过点击"OK"按钮关闭打开的 JavaScript 对话框，你可以调用 `acceptDialog` 方法：

```php
$browser->acceptDialog();
```

要通过点击"Cancel"按钮关闭打开的 JavaScript 对话框，你可以调用 `dismissDialog` 方法：

```php
$browser->dismissDialog();
```

### 与内联框架交互

如果你需要与 iframe 内的元素交互，你可以使用 `withinFrame` 方法。在提供给 `withinFrame` 方法的闭包内进行的所有元素交互都将被限定在指定 iframe 的上下文中：

```php
$browser->withinFrame('#credit-card-details', function ($browser) {
    $browser->type('input[name="cardnumber"]', '4242424242424242')
        ->type('input[name="exp-date"]', '1224')
        ->type('input[name="cvc"]', '123')
        ->press('Pay');
});
```

### 限定选择器作用域

有时你可能希望在将给定选择器内的所有操作限定作用域的情况下执行多个操作。例如，你可能希望断言某些文本仅存在于表格内，然后点击该表格内的一个按钮。你可以使用 `with` 方法来实现此目的。在提供给 `with` 方法的闭包内执行的所有操作都将被限定在原始选择器的范围内：

```php
$browser->with('.table', function (Browser $table) {
    $table->assertSee('Hello World')
        ->clickLink('Delete');
});
```

你可能偶尔需要在当前作用域之外执行断言。你可以使用 `elsewhere` 和 `elsewhereWhenAvailable` 方法来实现此目的：

```php
$browser->with('.table', function (Browser $table) {
    // 当前作用域是 `body .table`...

    $browser->elsewhere('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`...
        $title->assertSee('Hello World');
    });

    $browser->elsewhereWhenAvailable('.page-title', function (Browser $title) {
        // 当前作用域是 `body .page-title`...
        $title->assertSee('Hello World');
    });
});
```

### 等待元素

在测试大量使用 JavaScript 的应用程序时，通常需要"等待"某些元素或数据可用，然后才能继续测试。Dusk 使这变得轻而易举。使用各种方法，你可以等待元素在页面上变得可见，甚至等待给定的 JavaScript 表达式求值为 `true`。

#### 等待

如果你只需要暂停测试给定的毫秒数，请使用 `pause` 方法：

```php
$browser->pause(1000);
```

如果你只需要在给定条件为 `true` 时暂停测试，请使用 `pauseIf` 方法：

```php
$browser->pauseIf(App::environment('production'), 1000);
```

同样，如果你需要在给定条件不为 `true` 时暂停测试，你可以使用 `pauseUnless` 方法：

```php
$browser->pauseUnless(App::environment('testing'), 1000);
```

#### 等待选择器

`waitFor` 方法可用于暂停测试的执行，直到与给定 CSS 或 Dusk 选择器匹配的元素显示在页面上。默认情况下，这将在抛出异常之前最多暂停测试五秒钟。如有必要，你可以将自定义超时阈值作为第二个参数传递给该方法：

```php
// 最多等待五秒钟让选择器出现...
$browser->waitFor('.selector');

// 最多等待一秒钟让选择器出现...
$browser->waitFor('.selector', 1);
```

你还可以等待与给定选择器匹配的元素包含给定的文本：

```php
// 最多等待五秒钟让选择器包含给定的文本...
$browser->waitForTextIn('.selector', 'Hello World');

// 最多等待一秒钟让选择器包含给定的文本...
$browser->waitForTextIn('.selector', 'Hello World', 1);
```

你还可以等待与给定选择器匹配的元素从页面中消失：

```php
// 最多等待五秒钟直到选择器消失...
$browser->waitUntilMissing('.selector');

// 最多等待一秒钟直到选择器消失...
$browser->waitUntilMissing('.selector', 1);
```

或者，你可以等待与给定选择器匹配的元素被启用或禁用：

```php
// 最多等待五秒钟直到选择器被启用...
$browser->waitUntilEnabled('.selector');

// 最多等待一秒钟直到选择器被启用...
$browser->waitUntilEnabled('.selector', 1);

// 最多等待五秒钟直到选择器被禁用...
$browser->waitUntilDisabled('.selector');

// 最多等待一秒钟直到选择器被禁用...
$browser->waitUntilDisabled('.selector', 1);
```

#### 在可用时限定选择器作用域

偶尔，你可能希望等待与给定选择器匹配的元素出现，然后与该元素交互。例如，你可能希望等待模态窗口可用，然后按下模态窗口内的"OK"按钮。`whenAvailable` 方法可用于实现此目的。在给定闭包内执行的所有元素操作都将被限定在原始选择器的范围内：

```php
$browser->whenAvailable('.modal', function (Browser $modal) {
    $modal->assertSee('Hello World')
        ->press('OK');
});
```

#### 等待文本

`waitForText` 方法可用于等待给定的文本显示在页面上：

```php
// 最多等待五秒钟让文本出现...
$browser->waitForText('Hello World');

// 最多等待一秒钟让文本出现...
$browser->waitForText('Hello World', 1);
```

你可以使用 `waitUntilMissingText` 方法等待显示的文本已从页面中移除：

```php
// 最多等待五秒钟让文本被移除...
$browser->waitUntilMissingText('Hello World');

// 最多等待一秒钟让文本被移除...
$browser->waitUntilMissingText('Hello World', 1);
```

#### 等待链接

`waitForLink` 方法可用于等待给定的链接文本显示在页面上：

```php
// 最多等待五秒钟让链接出现...
$browser->waitForLink('Create');

// 最多等待一秒钟让链接出现...
$browser->waitForLink('Create', 1);
```

#### 等待输入

`waitForInput` 方法可用于等待给定的输入字段在页面上可见：

```php
// 最多等待五秒钟让输入出现...
$browser->waitForInput($field);

// 最多等待一秒钟让输入出现...
$browser->waitForInput($field, 1);
```

#### 等待页面位置

当进行路径断言（例如 `$browser->assertPathIs('/home')`）时，如果 `window.location.pathname` 正在异步更新，断言可能会失败。你可以使用 `waitForLocation` 方法等待位置为给定值：

```php
$browser->waitForLocation('/secret');
```

`waitForLocation` 方法也可用于等待当前窗口位置为一个完全限定的 URL：

```php
$browser->waitForLocation('https://example.com/path');
```

你还可以等待 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html) 的位置：

```php
$browser->waitForRoute($routeName, $parameters);
```

#### 等待页面重新加载

如果你需要等待页面在执行操作后重新加载，请使用 `waitForReload` 方法：

```php
use Laravel\Dusk\Browser;

$browser->waitForReload(function (Browser $browser) {
    $browser->press('Submit');
})
->assertSee('Success!');
```

由于等待页面重新加载的需求通常发生在点击按钮之后，为方便起见，你可以使用 `clickAndWaitForReload` 方法：

```php
$browser->clickAndWaitForReload('.selector')
    ->assertSee('something');
```

#### 等待 JavaScript 表达式

有时你可能希望暂停测试的执行，直到给定的 JavaScript 表达式求值为 `true`。你可以使用 `waitUntil` 方法轻松实现此目的。向此方法传递表达式时，你不需要包含 `return` 关键字或结尾的分号：

```php
// 最多等待五秒钟让表达式为 true...
$browser->waitUntil('App.data.servers.length > 0');

// 最多等待一秒钟让表达式为 true...
$browser->waitUntil('App.data.servers.length > 0', 1);
```

#### 等待 Vue 表达式

`waitUntilVue` 和 `waitUntilVueIsNot` 方法可用于等待 [Vue 组件](https://vuejs.org) 属性具有给定值：

```php
// 等待组件属性包含给定值...
$browser->waitUntilVue('user.name', 'Taylor', '@user');

// 等待组件属性不包含给定值...
$browser->waitUntilVueIsNot('user.name', null, '@user');
```

#### 等待 JavaScript 事件

`waitForEvent` 方法可用于暂停测试的执行，直到 JavaScript 事件发生：

```php
$browser->waitForEvent('load');
```

事件监听器附加到当前作用域，默认情况下为 `body` 元素。当使用限定了作用域的选择器时，事件监听器将附加到匹配的元素：

```php
$browser->with('iframe', function (Browser $iframe) {
    // 等待 iframe 的 load 事件...
    $iframe->waitForEvent('load');
});
```

你还可以将选择器作为第二个参数提供给 `waitForEvent` 方法，以将事件监听器附加到特定元素：

```php
$browser->waitForEvent('load', '.selector');
```

你还可以等待 `document` 和 `window` 对象上的事件：

```php
// 等待文档被滚动...
$browser->waitForEvent('scroll', 'document');

// 最多等待五秒钟直到窗口被调整大小...
$browser->waitForEvent('resize', 'window', 5);
```

#### 使用回调等待

Dusk 中许多"等待"方法都依赖于底层的 `waitUsing` 方法。你可以直接使用此方法等待给定的闭包返回 `true`。`waitUsing` 方法接受最大等待秒数、评估闭包的间隔、闭包以及可选失败消息：

```php
$browser->waitUsing(10, 1, function () use ($something) {
    return $something->isReady();
}, "Something wasn't ready in time.");
```

### 将元素滚动到视图中

有时你可能无法点击某个元素，因为它位于浏览器的可视区域之外。`scrollIntoView` 方法将滚动浏览器窗口，直到给定选择器处的元素位于视图中：

```php
$browser->scrollIntoView('.selector')
    ->click('.selector');
```

## 可用的断言

Dusk 提供了多种你可以对你的应用程序进行的断言。所有可用的断言都记录在下面的列表中：

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

assertTitle
assertTitleContains
assertUrlIs
assertSchemeIs
assertSchemeIsNot
assertHostIs
assertHostIsNot
assertPortIs
assertPortIsNot
assertPathBeginsWith
assertPathEndsWith
assertPathContains
assertPathIs
assertPathIsNot
assertRouteIs
assertQueryStringHas
assertQueryStringMissing
assertFragmentIs
assertFragmentBeginsWith
assertFragmentIsNot
assertHasCookie
assertHasPlainCookie
assertCookieMissing
assertPlainCookieMissing
assertCookieValue
assertPlainCookieValue
assertSee
assertDontSee
assertSeeIn
assertDontSeeIn
assertSeeAnythingIn
assertSeeNothingIn
assertCount
assertScript
assertSourceHas
assertSourceMissing
assertSeeLink
assertDontSeeLink
assertInputValue
assertInputValueIsNot
assertChecked
assertNotChecked
assertIndeterminate
assertRadioSelected
assertRadioNotSelected
assertSelected
assertNotSelected
assertSelectHasOptions
assertSelectMissingOptions
assertSelectHasOption
assertSelectMissingOption
assertValue
assertValueIsNot
assertAttribute
assertAttributeMissing
assertAttributeContains
assertAttributeDoesntContain
assertAriaAttribute
assertDataAttribute
assertVisible
assertPresent
assertNotPresent
assertMissing
assertInputPresent
assertInputMissing
assertDialogOpened
assertEnabled
assertDisabled
assertButtonEnabled
assertButtonDisabled
assertFocused
assertNotFocused
assertAuthenticated
assertGuest
assertAuthenticatedAs
assertVue
assertVueIsNot
assertVueContains
assertVueDoesntContain

</div>

#### assertTitle

断言页面标题与给定的文本匹配：

```php
$browser->assertTitle($title);
```

#### assertTitleContains

断言页面标题包含给定的文本：

```php
$browser->assertTitleContains($title);
```

#### assertUrlIs

断言当前 URL（不带查询字符串）与给定的字符串匹配：

```php
$browser->assertUrlIs($url);
```

#### assertSchemeIs

断言当前 URL 的 scheme 与给定的 scheme 匹配：

```php
$browser->assertSchemeIs($scheme);
```

#### assertSchemeIsNot

断言当前 URL 的 scheme 与给定的 scheme 不匹配：

```php
$browser->assertSchemeIsNot($scheme);
```

#### assertHostIs

断言当前 URL 的 host 与给定的 host 匹配：

```php
$browser->assertHostIs($host);
```

#### assertHostIsNot

断言当前 URL 的 host 与给定的 host 不匹配：

```php
$browser->assertHostIsNot($host);
```

#### assertPortIs

断言当前 URL 的端口与给定的端口匹配：

```php
$browser->assertPortIs($port);
```

#### assertPortIsNot

断言当前 URL 的端口与给定的端口不匹配：

```php
$browser->assertPortIsNot($port);
```

#### assertPathBeginsWith

断言当前 URL 路径以给定的路径开始：

```php
$browser->assertPathBeginsWith('/home');
```

#### assertPathEndsWith

断言当前 URL 路径以给定的路径结束：

```php
$browser->assertPathEndsWith('/home');
```

#### assertPathContains

断言当前 URL 路径包含给定的路径：

```php
$browser->assertPathContains('/home');
```

#### assertPathIs

断言当前路径与给定的路径匹配：

```php
$browser->assertPathIs('/home');
```

#### assertPathIsNot

断言当前路径与给定的路径不匹配：

```php
$browser->assertPathIsNot('/home');
```

#### assertRouteIs

断言当前 URL 与给定的 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html) URL 匹配：

```php
$browser->assertRouteIs($name, $parameters);
```

#### assertQueryStringHas

断言给定的查询字符串参数存在：

```php
$browser->assertQueryStringHas($name);
```

断言给定的查询字符串参数存在且具有给定值：

```php
$browser->assertQueryStringHas($name, $value);
```

#### assertQueryStringMissing

断言给定的查询字符串参数缺失：

```php
$browser->assertQueryStringMissing($name);
```

#### assertFragmentIs

断言 URL 当前的哈希片段与给定的片段匹配：

```php
$browser->assertFragmentIs('anchor');
```

#### assertFragmentBeginsWith

断言 URL 当前的哈希片段以给定的片段开始：

```php
$browser->assertFragmentBeginsWith('anchor');
```

#### assertFragmentIsNot

断言 URL 当前的哈希片段与给定的片段不匹配：

```php
$browser->assertFragmentIsNot('anchor');
```

#### assertHasCookie

断言给定的加密 Cookie 存在：

```php
$browser->assertHasCookie($name);
```

#### assertHasPlainCookie

断言给定的未加密 Cookie 存在：

```php
$browser->assertHasPlainCookie($name);
```

#### assertCookieMissing

断言给定的加密 Cookie 不存在：

```php
$browser->assertCookieMissing($name);
```

#### assertPlainCookieMissing

断言给定的未加密 Cookie 不存在：

```php
$browser->assertPlainCookieMissing($name);
```

#### assertCookieValue

断言加密 Cookie 具有给定值：

```php
$browser->assertCookieValue($name, $value);
```

#### assertPlainCookieValue

断言未加密 Cookie 具有给定值：

```php
$browser->assertPlainCookieValue($name, $value);
```

#### assertSee

断言给定的文本存在于页面上：

```php
$browser->assertSee($text);
```

#### assertDontSee

断言给定的文本不存在于页面上：

```php
$browser->assertDontSee($text);
```

#### assertSeeIn

断言给定的文本存在于选择器内：

```php
$browser->assertSeeIn($selector, $text);
```

#### assertDontSeeIn

断言给定的文本不存在于选择器内：

```php
$browser->assertDontSeeIn($selector, $text);
```

#### assertSeeAnythingIn

断言任何文本存在于选择器内：

```php
$browser->assertSeeAnythingIn($selector);
```

#### assertSeeNothingIn

断言没有文本存在于选择器内：

```php
$browser->assertSeeNothingIn($selector);
```

#### assertCount

断言与给定选择器匹配的元素出现指定的次数：

```php
$browser->assertCount($selector, $count);
```

#### assertScript

断言给定的 JavaScript 表达式求值为给定值：

```php
$browser->assertScript('window.isLoaded')
    ->assertScript('document.readyState', 'complete');
```

#### assertSourceHas

断言给定的源代码存在于页面上：

```php
$browser->assertSourceHas($code);
```

#### assertSourceMissing

断言给定的源代码不存在于页面上：

```php
$browser->assertSourceMissing($code);
```

#### assertSeeLink

断言给定的链接存在于页面上：

```php
$browser->assertSeeLink($linkText);
```

#### assertDontSeeLink

断言给定的链接不存在于页面上：

```php
$browser->assertDontSeeLink($linkText);
```

#### assertInputValue

断言给定的输入字段具有给定值：

```php
$browser->assertInputValue($field, $value);
```

#### assertInputValueIsNot

断言给定的输入字段不具有给定值：

```php
$browser->assertInputValueIsNot($field, $value);
```

#### assertChecked

断言给定的复选框被勾选：

```php
$browser->assertChecked($field);
```

#### assertNotChecked

断言给定的复选框未被勾选：

```php
$browser->assertNotChecked($field);
```

#### assertIndeterminate

断言给定的复选框处于不确定状态：

```php
$browser->assertIndeterminate($field);
```

#### assertRadioSelected

断言给定的单选字段被选中：

```php
$browser->assertRadioSelected($field, $value);
```

#### assertRadioNotSelected

断言给定的单选字段未被选中：

```php
$browser->assertRadioNotSelected($field, $value);
```

#### assertSelected

断言给定的下拉框选中了给定值：

```php
$browser->assertSelected($field, $value);
```

#### assertNotSelected

断言给定的下拉框未选中给定值：

```php
$browser->assertNotSelected($field, $value);
```

#### assertSelectHasOptions

断言给定的值数组可供选择：

```php
$browser->assertSelectHasOptions($field, $values);
```

#### assertSelectMissingOptions

断言给定的值数组不可供选择：

```php
$browser->assertSelectMissingOptions($field, $values);
```

#### assertSelectHasOption

断言给定值在给定字段上可供选择：

```php
$browser->assertSelectHasOption($field, $value);
```

#### assertSelectMissingOption

断言给定值不可供选择：

```php
$browser->assertSelectMissingOption($field, $value);
```

#### assertValue

断言与给定选择器匹配的元素具有给定值：

```php
$browser->assertValue($selector, $value);
```

#### assertValueIsNot

断言与给定选择器匹配的元素不具有给定值：

```php
$browser->assertValueIsNot($selector, $value);
```

#### assertAttribute

断言与给定选择器匹配的元素在提供的属性中具有给定值：

```php
$browser->assertAttribute($selector, $attribute, $value);
```

#### assertAttributeMissing

断言与给定选择器匹配的元素缺少提供的属性：

```php
$browser->assertAttributeMissing($selector, $attribute);
```

#### assertAttributeContains

断言与给定选择器匹配的元素在提供的属性中包含给定值：

```php
$browser->assertAttributeContains($selector, $attribute, $value);
```

#### assertAttributeDoesntContain

断言与给定选择器匹配的元素在提供的属性中不包含给定值：

```php
$browser->assertAttributeDoesntContain($selector, $attribute, $value);
```

#### assertAriaAttribute

断言与给定选择器匹配的元素在提供的 aria 属性中具有给定值：

```php
$browser->assertAriaAttribute($selector, $attribute, $value);
```

例如，给定标记 `<button aria-label="Add"></button>`，你可以像这样对 `aria-label` 属性进行断言：

```php
$browser->assertAriaAttribute('button', 'label', 'Add')
```

#### assertDataAttribute

断言与给定选择器匹配的元素在提供的 data 属性中具有给定值：

```php
$browser->assertDataAttribute($selector, $attribute, $value);
```

例如，给定标记 `<tr id="row-1" data-content="attendees"></tr>`，你可以像这样对 `data-content` 属性进行断言：

```php
$browser->assertDataAttribute('#row-1', 'content', 'attendees')
```

#### assertVisible

断言与给定选择器匹配的元素可见：

```php
$browser->assertVisible($selector);
```

#### assertPresent

断言与给定选择器匹配的元素存在于源代码中：

```php
$browser->assertPresent($selector);
```

#### assertNotPresent

断言与给定选择器匹配的元素不存在于源代码中：

```php
$browser->assertNotPresent($selector);
```

#### assertMissing

断言与给定选择器匹配的元素不可见：

```php
$browser->assertMissing($selector);
```

#### assertInputPresent

断言具有给定名称的 input 存在：

```php
$browser->assertInputPresent($name);
```

#### assertInputMissing

断言具有给定名称的 input 不存在于源代码中：

```php
$browser->assertInputMissing($name);
```

#### assertDialogOpened

断言具有给定消息的 JavaScript 对话框已打开：

```php
$browser->assertDialogOpened($message);
```

#### assertEnabled

断言给定的字段被启用：

```php
$browser->assertEnabled($field);
```

#### assertDisabled

断言给定的字段被禁用：

```php
$browser->assertDisabled($field);
```

#### assertButtonEnabled

断言给定的按钮被启用：

```php
$browser->assertButtonEnabled($button);
```

#### assertButtonDisabled

断言给定的按钮被禁用：

```php
$browser->assertButtonDisabled($button);
```

#### assertFocused

断言给定的字段获得焦点：

```php
$browser->assertFocused($field);
```

#### assertNotFocused

断言给定的字段未获得焦点：

```php
$browser->assertNotFocused($field);
```

#### assertAuthenticated

断言用户已认证：

```php
$browser->assertAuthenticated();
```

#### assertGuest

断言用户未认证：

```php
$browser->assertGuest();
```

#### assertAuthenticatedAs

断言用户以给定用户身份认证：

```php
$browser->assertAuthenticatedAs($user);
```

#### assertVue

Dusk 甚至允许你对 [Vue 组件](https://vuejs.org) 数据的状态进行断言。例如，假设你的应用程序包含以下 Vue 组件：

    // HTML...

    <profile dusk="profile-component"></profile>

    // 组件定义...

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

你可以像这样对 Vue 组件的状态进行断言：

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

#### assertVueIsNot

断言给定 Vue 组件数据属性与给定值不匹配：

```php
$browser->assertVueIsNot($property, $value, $componentSelector = null);
```

#### assertVueContains

断言给定 Vue 组件数据属性是数组且包含给定值：

```php
$browser->assertVueContains($property, $value, $componentSelector = null);
```

#### assertVueDoesntContain

断言给定 Vue 组件数据属性是数组且不包含给定值：

```php
$browser->assertVueDoesntContain($property, $value, $componentSelector = null);
```

## 页面

有时，测试需要按顺序执行几个复杂的操作。这可能使你的测试更难阅读和理解。Dusk Pages 允许你定义富有表现力的操作，然后可以通过单个方法在给定页面上执行。Pages 还允许你为你的应用程序或单个页面定义常见选择器的快捷方式。

### 生成页面

要生成页面对象，请执行 `dusk:page` Artisan 命令。所有页面对象都将放在你的应用程序的 `tests/Browser/Pages` 目录中：

```shell
php artisan dusk:page Login
```

### 配置页面

默认情况下，页面有三个方法：`url`、`assert` 和 `elements`。我们现在讨论 `url` 和 `assert` 方法。`elements` 方法将在 下面详细讨论。

#### `url` 方法

`url` 方法应返回表示页面的 URL 路径。Dusk 在浏览器中导航到页面时将使用此 URL：

```php
/**
 * 获取页面的 URL。
 */
public function url(): string
{
    return '/login';
}
```

#### `assert` 方法

`assert` 方法可以进行任何必要的断言，以验证浏览器实际上位于给定页面上。实际上没有必要在此方法中放置任何内容；但是，如果你愿意，你可以自由地进行这些断言。这些断言将在导航到页面时自动运行：

```php
/**
 * 断言浏览器位于该页面上。
 */
public function assert(Browser $browser): void
{
    $browser->assertPathIs($this->url());
}
```

### 导航到页面

定义页面后，你可以使用 `visit` 方法导航到它：

```php
use Tests\Browser\Pages\Login;

$browser->visit(new Login);
```

有时你可能已经位于给定页面上，并需要将页面的选择器和方法"加载"到当前测试上下文中。这在按下按钮并在没有明确导航的情况下被重定向到给定页面时很常见。在这种情况下，你可以使用 `on` 方法加载页面：

```php
use Tests\Browser\Pages\CreatePlaylist;

$browser->visit('/dashboard')
    ->clickLink('Create Playlist')
    ->on(new CreatePlaylist)
    ->assertSee('@create');
```

### 简写选择器

页面类中的 `elements` 方法允许你为页面上任何 CSS 选择器定义快速、易于记忆的快捷方式。例如，让我们为应用程序登录页面的"email"输入字段定义一个快捷方式：

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

#### 全局简写选择器

安装 Dusk 后，一个基础 `Page` 类将放在你的 `tests/Browser/Pages` 目录中。此类包含一个 `siteElements` 方法，可用于定义应在整个应用程序的每个页面上可用的全局简写选择器：

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

### 页面方法

除了页面上定义的默认方法之外，你还可以定义可在整个测试中使用的其他方法。例如，让我们假设我们正在构建一个音乐管理应用程序。应用程序某一页面的常见操作可能是创建播放列表。不必在每个测试中重写创建播放列表的逻辑，你可以在页面类上定义一个 `createPlaylist` 方法：

```php
<?php

namespace Tests\Browser\Pages;

use Laravel\Dusk\Browser;
use Laravel\Dusk\Page;

class Dashboard extends Page
{
    // 其他页面方法...

    /**
     * 创建新的播放列表。
     */
    public function createPlaylist(Browser $browser, string $name): void
    {
        $browser->type('name', $name)
            ->check('share')
            ->press('Create Playlist');
    }
}
```

定义方法后，你可以在任何使用该页面的测试中使用它。浏览器实例将自动作为第一个参数传递给自定义页面方法：

```php
use Tests\Browser\Pages\Dashboard;

$browser->visit(new Dashboard)
    ->createPlaylist('My Playlist')
    ->assertSee('My Playlist');
```

## 组件

组件类似于 Dusk 的"页面对象"，但用于在整个应用程序中重复使用的 UI 和功能片段，例如导航栏或通知窗口。因此，组件不绑定到特定的 URL。

### 生成组件

要生成组件，请执行 `dusk:component` Artisan 命令。新组件放在 `tests/Browser/Components` 目录中：

```shell
php artisan dusk:component DatePicker
```

如上所示，"日期选择器"是一个可能存在于整个应用程序各种页面上的组件示例。在测试套件中的数十个测试中手动编写浏览器自动化逻辑来选择日期可能会变得繁琐。相反，我们可以定义一个 Dusk 组件来表示日期选择器，允许我们将该逻辑封装在组件内：

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

### 使用组件

定义组件后，我们可以轻松地从任何测试中选择日期选择器中的日期。而且，如果选择日期所需的逻辑发生变化，我们只需要更新组件：

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

`component` 方法可用于检索限定在给定组件作用域内的浏览器实例：

```php
$datePicker = $browser->component(new DatePickerComponent);

$datePicker->selectDate(2019, 1, 30);

$datePicker->assertSee('January');
```

## 持续集成

> [!WARNING]
> 大多数 Dusk 持续集成配置期望你的 Laravel 应用程序使用内置的 PHP 开发服务器在端口 8000 上提供服务。因此，在继续之前，你应该确保你的持续集成环境具有 `APP_URL` 环境变量值为 `http://127.0.0.1:8000`。

### Heroku CI

要在 [Heroku CI](https://www.heroku.com/continuous-integration) 上运行 Dusk 测试，请将以下 Google Chrome buildpack 和脚本添加到你的 Heroku `app.json` 文件中：

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

### Travis CI

要在 [Travis CI](https://travis-ci.org) 上运行你的 Dusk 测试，请使用以下 `.travis.yml` 配置。由于 Travis CI 不是图形环境，我们将需要采取一些额外步骤来启动 Chrome 浏览器。此外，我们将使用 `php artisan serve` 启动 PHP 的内置 Web 服务器：

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

### GitHub Actions

如果你使用 [GitHub Actions](https://github.com/features/actions) 来运行你的 Dusk 测试，你可以使用以下配置文件作为起点。与 TravisCI 一样，我们将使用 `php artisan serve` 命令启动 PHP 的内置 Web 服务器：

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

### Chipper CI

如果你使用 [Chipper CI](https://chipperci.com) 来运行你的 Dusk 测试，你可以使用以下配置文件作为起点。我们将使用 PHP 的内置服务器运行 Laravel，以便我们可以监听请求：

```yaml
# file .chipperci.yml
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

      # 创建一个 dusk 环境文件，确保 APP_URL 使用 BUILD_HOST
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

要了解有关在 Chipper CI 上运行 Dusk 测试的更多信息，包括如何使用数据库，请查阅 [Chipper CI 官方文档](https://chipperci.com/docs/testing/laravel-dusk-new/)。