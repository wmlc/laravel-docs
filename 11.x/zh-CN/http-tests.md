# HTTP 测试

- [简介](#introduction)
- [发起请求](#making-requests)
    - [自定义请求头](#customizing-request-headers)
    - [Cookie](#cookies)
    - [会话 / 认证](#session-and-authentication)
    - [调试响应](#debugging-responses)
    - [异常处理](#exception-handling)
- [测试 JSON API](#testing-json-apis)
    - [链式 JSON 测试](#fluent-json-testing)
- [测试文件上传](#testing-file-uploads)
- [测试视图](#testing-views)
    - [渲染 Blade 与组件](#rendering-blade-and-components)
- [可用的断言](#available-assertions)
    - [响应断言](#response-assertions)
    - [认证断言](#authentication-assertions)
    - [验证断言](#validation-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了一套非常流畅的 API，用于向你的应用发起 HTTP 请求并检查响应。例如，请看下面定义的功能测试：

```php tab=Pest
<?php

test('the application returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本测试示例。
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

`get` 方法向应用发起一个 `GET` 请求，而 `assertStatus` 方法用于断言返回的响应应当具有给定的 HTTP 状态码。除了这个简单断言之外，Laravel 还提供了多种断言，可用于检查响应头、内容、JSON 结构等。

<a name="making-requests"></a>
## 发起请求

要向你的应用发起请求，你可以在测试中调用 `get`、`post`、`put`、`patch` 或 `delete` 方法。这些方法并不会真正向你的应用发出「真实」的 HTTP 请求，而是在内部模拟整个网络请求。

测试请求方法返回的并不是 `Illuminate\Http\Response` 实例，而是 `Illuminate\Testing\TestResponse` 实例。它提供了[多种有用的断言](#available-assertions)，让你可以检查应用的响应：

```php tab=Pest
<?php

test('basic request', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本测试示例。
     */
    public function test_a_basic_request(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

通常，每个测试只应向你的应用发起一个请求。如果在单个测试方法内执行多个请求，可能会出现意外行为。

> [!NOTE]
> 为了方便起见，运行测试时 CSRF 中间件会自动禁用。

<a name="customizing-request-headers"></a>
### 自定义请求头

你可以使用 `withHeaders` 方法在请求发送到应用之前自定义请求头。该方法允许你向请求添加任意自定义头：

```php tab=Pest
<?php

test('interacting with headers', function () {
    $response = $this->withHeaders([
        'X-Header' => 'Value',
    ])->post('/user', ['name' => 'Sally']);

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本功能测试示例。
     */
    public function test_interacting_with_headers(): void
    {
        $response = $this->withHeaders([
            'X-Header' => 'Value',
        ])->post('/user', ['name' => 'Sally']);

        $response->assertStatus(201);
    }
}
```

<a name="cookies"></a>
### Cookie

你可以在发起请求之前使用 `withCookie` 或 `withCookies` 方法设置 Cookie 值。`withCookie` 方法接收 Cookie 名称和值两个参数，而 `withCookies` 方法接收一组名称 / 值对数组：

```php tab=Pest
<?php

test('interacting with cookies', function () {
    $response = $this->withCookie('color', 'blue')->get('/');

    $response = $this->withCookies([
        'color' => 'blue',
        'name' => 'Taylor',
    ])->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_cookies(): void
    {
        $response = $this->withCookie('color', 'blue')->get('/');

        $response = $this->withCookies([
            'color' => 'blue',
            'name' => 'Taylor',
        ])->get('/');

        //
    }
}
```

<a name="session-and-authentication"></a>
### 会话 / 认证

Laravel 提供了若干辅助方法，用于在 HTTP 测试期间与会话交互。首先，你可以使用 `withSession` 方法将会话数据设为给定数组。这对于在向应用发起请求之前预加载会话数据很有用：

```php tab=Pest
<?php

test('interacting with the session', function () {
    $response = $this->withSession(['banned' => false])->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_the_session(): void
    {
        $response = $this->withSession(['banned' => false])->get('/');

        //
    }
}
```

Laravel 的会话通常用于为当前已认证的用户维护状态。因此，`actingAs` 辅助方法提供了一种简便的方式，将指定用户认证为当前用户。例如，我们可以使用[模型工厂](/docs/{{version}}/eloquent-factories)生成并认证一个用户：

```php tab=Pest
<?php

use App\Models\User;

test('an action that requires authentication', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withSession(['banned' => false])
        ->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_an_action_that_requires_authentication(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withSession(['banned' => false])
            ->get('/');

        //
    }
}
```

你也可以把守卫（guard）名称作为 `actingAs` 方法的第二个参数，以指定认证给定用户时使用哪个守卫。传给 `actingAs` 方法的守卫，也将成为整个测试期间的默认守卫：

    $this->actingAs($user, 'web')

<a name="debugging-responses"></a>
### 调试响应

向应用发起测试请求后，可以使用 `dump`、`dumpHeaders` 和 `dumpSession` 方法检查并调试响应内容：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dumpHeaders();

    $response->dumpSession();

    $response->dump();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dumpHeaders();

        $response->dumpSession();

        $response->dump();
    }
}
```

另外，你也可以使用 `dd`、`ddHeaders`、`ddSession` 和 `ddJson` 方法输出有关响应的信息，然后停止执行：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->ddHeaders();
    $response->ddSession();
    $response->ddJson();
    $response->dd();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->ddHeaders();

        $response->ddSession();

        $response->dd();
    }
}
```

<a name="exception-handling"></a>
### 异常处理

有时你需要测试应用是否抛出了某个特定异常。为此，你可以通过 `Exceptions` Facade「伪造」异常处理器。伪造异常处理器之后，你可以使用 `assertReported` 和 `assertNotReported` 方法，对请求期间抛出的异常进行断言：

```php tab=Pest
<?php

use App\Exceptions\InvalidOrderException;
use Illuminate\Support\Facades\Exceptions;

test('exception is thrown', function () {
    Exceptions::fake();

    $response = $this->get('/order/1');

    // 断言抛出了异常……
    Exceptions::assertReported(InvalidOrderException::class);

    // 对异常进行断言……
    Exceptions::assertReported(function (InvalidOrderException $e) {
        return $e->getMessage() === 'The order was invalid.';
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Exceptions\InvalidOrderException;
use Illuminate\Support\Facades\Exceptions;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本测试示例。
     */
    public function test_exception_is_thrown(): void
    {
        Exceptions::fake();

        $response = $this->get('/');

        // 断言抛出了异常……
        Exceptions::assertReported(InvalidOrderException::class);

        // 对异常进行断言……
        Exceptions::assertReported(function (InvalidOrderException $e) {
            return $e->getMessage() === 'The order was invalid.';
        });
    }
}
```

`assertNotReported` 和 `assertNothingReported` 方法可用于断言请求期间没有抛出给定异常，或者根本没有抛出任何异常：

```php
Exceptions::assertNotReported(InvalidOrderException::class);

Exceptions::assertNothingReported();
```

你可以在发起请求之前调用 `withoutExceptionHandling` 方法，完全禁用某个请求的异常处理：

    $response = $this->withoutExceptionHandling()->get('/');

此外，如果你想确保应用没有使用 PHP 语言或应用所用库中已废弃的特性，可以在发起请求之前调用 `withoutDeprecationHandling` 方法。禁用废弃处理后，废弃警告将被转换为异常，从而导致测试失败：

    $response = $this->withoutDeprecationHandling()->get('/');

`assertThrows` 方法可用于断言给定闭包内的代码抛出了指定类型的异常：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    OrderInvalid::class
);
```

如果你想检查抛出的异常并对其断言，可以把闭包作为 `assertThrows` 方法的第二个参数传入：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    fn (OrderInvalid $e) => $e->orderId() === 123;
);
```

<a name="testing-json-apis"></a>
## 测试 JSON API

Laravel 还提供了若干用于测试 JSON API 及其响应的辅助方法。例如，你可以使用 `json`、`getJson`、`postJson`、`putJson`、`patchJson`、`deleteJson` 和 `optionsJson` 方法，以各种 HTTP 动词发起 JSON 请求。你也可以轻松地向这些方法传入数据和请求头。首先让我们编写一个测试，向 `/api/user` 发起 `POST` 请求，并断言返回了预期的 JSON 数据：

```php tab=Pest
<?php

test('making an api request', function () {
    $response = $this->postJson('/api/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJson([
            'created' => true,
        ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本功能测试示例。
     */
    public function test_making_an_api_request(): void
    {
        $response = $this->postJson('/api/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJson([
                'created' => true,
            ]);
    }
}
```

此外，JSON 响应数据可以当作响应上的数组变量访问，这让你可以方便地检查 JSON 响应中返回的各个值：

```php tab=Pest
expect($response['created'])->toBeTrue();
```

```php tab=PHPUnit
$this->assertTrue($response['created']);
```

> [!NOTE]
> `assertJson` 方法会把响应转换为数组，以验证给定数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还存在其他属性，只要给定的片段存在，该测试仍然会通过。

<a name="verifying-exact-match"></a>
#### 断言 JSON 精确匹配

如前所述，`assertJson` 方法可用于断言某个 JSON 片段是否存在于 JSON 响应中。如果你希望验证给定数组与你的应用返回的 JSON **完全匹配**，则应使用 `assertExactJson` 方法：

```php tab=Pest
<?php

test('asserting an exact json match', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertExactJson([
            'created' => true,
        ]);
});

```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本功能测试示例。
     */
    public function test_asserting_an_exact_json_match(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertExactJson([
                'created' => true,
            ]);
    }
}
```

<a name="verifying-json-paths"></a>
#### 断言 JSON 路径

如果你希望验证 JSON 响应在指定路径上包含给定数据，应使用 `assertJsonPath` 方法：

```php tab=Pest
<?php

test('asserting a json path value', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJsonPath('team.owner.name', 'Darian');
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本功能测试示例。
     */
    public function test_asserting_a_json_paths_value(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJsonPath('team.owner.name', 'Darian');
    }
}
```

`assertJsonPath` 方法还接受一个闭包，可用于动态判断断言是否应该通过：

    $response->assertJsonPath('team.owner.name', fn (string $name) => strlen($name) >= 3);

<a name="fluent-json-testing"></a>
### 链式 JSON 测试

Laravel 还提供了一种优雅的方式来以链式方式测试应用的 JSON 响应。首先，请把闭包传给 `assertJson` 方法。Laravel 会调用该闭包并传入一个 `Illuminate\Testing\Fluent\AssertableJson` 实例，你可以用它对应用返回的 JSON 进行断言。`where` 方法可用于对 JSON 的某个特定属性进行断言，而 `missing` 方法可用于断言 JSON 中缺少某个特定属性：

```php tab=Pest
use Illuminate\Testing\Fluent\AssertableJson;

test('fluent json', function () {
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                ->where('name', 'Victoria Faith')
                ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                ->whereNot('status', 'pending')
                ->missing('password')
                ->etc()
        );
});
```

```php tab=PHPUnit
use Illuminate\Testing\Fluent\AssertableJson;

/**
 * 一个基本功能测试示例。
 */
public function test_fluent_json(): void
{
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                ->where('name', 'Victoria Faith')
                ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                ->whereNot('status', 'pending')
                ->missing('password')
                ->etc()
        );
}
```

#### 理解 `etc` 方法

在上面的示例中，你可能注意到我们在断言链末尾调用了 `etc` 方法。该方法告知 Laravel：JSON 对象上可能还存在其他属性。如果没有使用 `etc` 方法，当 JSON 对象上存在你未做断言的其他属性时，测试将失败。

这样设计是为了防止你在 JSON 响应中无意暴露敏感信息：它迫使你要么显式地对某个属性断言，要么通过 `etc` 方法显式允许额外属性。

不过你应当注意，在断言链中省略 `etc` 方法，并不能确保嵌套在 JSON 对象内部的数组没有被添加额外属性。`etc` 方法只能确保在调用 `etc` 方法的那一层嵌套上不存在额外属性。

<a name="asserting-json-attribute-presence-and-absence"></a>
#### 断言属性的存在与缺失

要断言某个属性存在或不存在，你可以使用 `has` 和 `missing` 方法：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->has('data')
            ->missing('message')
    );

此外，`hasAll` 和 `missingAll` 方法允许同时断言多个属性的存在或缺失：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->hasAll(['status', 'data'])
            ->missingAll(['message', 'code'])
    );

你可以使用 `hasAny` 方法判断给定属性列表中是否至少存在一个属性：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->has('status')
            ->hasAny('data', 'message', 'code')
    );

<a name="asserting-against-json-collections"></a>
#### 对 JSON 集合进行断言

通常，你的路由会返回包含多个项目的 JSON 响应，例如多个用户：

    Route::get('/users', function () {
        return User::all();
    });

在这种情况下，我们可以使用链式 JSON 对象的 `has` 方法，对响应中包含的用户进行断言。例如，让我们断言 JSON 响应包含三个用户。接下来，我们使用 `first` 方法对集合中的第一个用户做一些断言。`first` 方法接受一个闭包，该闭包会收到另一个可断言的 JSON 字符串，我们可以用它对 JSON 集合中的第一个对象进行断言：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has(3)
                ->first(fn (AssertableJson $json) =>
                    $json->where('id', 1)
                        ->where('name', 'Victoria Faith')
                        ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                        ->missing('password')
                        ->etc()
                )
        );

<a name="scoping-json-collection-assertions"></a>
#### 限定 JSON 集合断言的作用域

有时，你的应用路由会返回带有名键的 JSON 集合：

    Route::get('/users', function () {
        return [
            'meta' => [...],
            'users' => User::all(),
        ];
    })

测试这些路由时，你可以使用 `has` 方法对集合中的项目数量进行断言。此外，你还可以使用 `has` 方法来限定一串断言的作用域：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('meta')
                ->has('users', 3)
                ->has('users.0', fn (AssertableJson $json) =>
                    $json->where('id', 1)
                        ->where('name', 'Victoria Faith')
                        ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                        ->missing('password')
                        ->etc()
                )
        );

不过，与其两次单独调用 `has` 方法来对 `users` 集合断言，你可以只调用一次，并把闭包作为其第三个参数传入。这样做时，闭包会自动被调用，并作用于集合中的第一个项目：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('meta')
                ->has('users', 3, fn (AssertableJson $json) =>
                    $json->where('id', 1)
                        ->where('name', 'Victoria Faith')
                        ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                        ->missing('password')
                        ->etc()
                )
        );

<a name="asserting-json-types"></a>
#### 断言 JSON 类型

你可能只需要断言 JSON 响应中的属性属于某种类型。`Illuminate\Testing\Fluent\AssertableJson` 类提供了 `whereType` 和 `whereAllType` 方法来满足这一需求：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->whereType('id', 'integer')
            ->whereAllType([
                'users.0.name' => 'string',
                'meta' => 'array'
            ])
    );

你可以使用 `|` 字符指定多种类型，或者把类型数组作为 `whereType` 方法的第二个参数传入。只要响应值属于列出的任意一种类型，断言就会成功：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->whereType('name', 'string|null')
            ->whereType('id', ['string', 'integer'])
    );

`whereType` 和 `whereAllType` 方法可识别以下类型：`string`、`integer`、`double`、`boolean`、`array` 和 `null`。

<a name="testing-file-uploads"></a>
## 测试文件上传

`Illuminate\Http\UploadedFile` 类提供了一个 `fake` 方法，可用于生成测试用的虚拟文件或图片。将它与 `Storage` Facade 的 `fake` 方法结合使用，可以极大简化文件上传的测试。例如，你可以组合这两个功能，轻松测试头像上传表单：

```php tab=Pest
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('avatars can be uploaded', function () {
    Storage::fake('avatars');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $response = $this->post('/avatar', [
        'avatar' => $file,
    ]);

    Storage::disk('avatars')->assertExists($file->hashName());
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_avatars_can_be_uploaded(): void
    {
        Storage::fake('avatars');

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->post('/avatar', [
            'avatar' => $file,
        ]);

        Storage::disk('avatars')->assertExists($file->hashName());
    }
}
```

如果你想断言某个给定文件不存在，可以使用 `Storage` Facade 提供的 `assertMissing` 方法：

    Storage::fake('avatars');

    // ...

    Storage::disk('avatars')->assertMissing('missing.jpg');

<a name="fake-file-customization"></a>
#### 伪造文件自定义

使用 `UploadedFile` 类提供的 `fake` 方法创建文件时，你可以指定图片的宽度、高度和大小（以千字节为单位），以便更好地测试应用的验证规则：

    UploadedFile::fake()->image('avatar.jpg', $width, $height)->size(100);

除了创建图片之外，你还可以使用 `create` 方法创建其他任何类型的文件：

    UploadedFile::fake()->create('document.pdf', $sizeInKilobytes);

如有需要，你可以向该方法传入一个 `$mimeType` 参数，以显式定义文件应返回的 MIME 类型：

    UploadedFile::fake()->create(
        'document.pdf', $sizeInKilobytes, 'application/pdf'
    );

<a name="testing-views"></a>
## 测试视图

Laravel 还允许你在不向应用发起模拟 HTTP 请求的情况下渲染视图。为此，你可以在测试中调用 `view` 方法。`view` 方法接受视图名称和一个可选的数据数组。该方法返回一个 `Illuminate\Testing\TestView` 实例，它提供了若干方法，便于你对视图内容进行断言：

```php tab=Pest
<?php

test('a welcome view can be rendered', function () {
    $view = $this->view('welcome', ['name' => 'Taylor']);

    $view->assertSee('Taylor');
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_a_welcome_view_can_be_rendered(): void
    {
        $view = $this->view('welcome', ['name' => 'Taylor']);

        $view->assertSee('Taylor');
    }
}
```

`TestView` 类提供了以下断言方法：`assertSee`、`assertSeeInOrder`、`assertSeeText`、`assertSeeTextInOrder`、`assertDontSee` 和 `assertDontSeeText`。

如有需要，你可以通过把 `TestView` 实例转换为字符串来获取渲染后的原始视图内容：

    $contents = (string) $this->view('welcome');

<a name="sharing-errors"></a>
#### 共享错误

某些视图可能依赖于 [Laravel 提供的全局错误包](/docs/{{version}}/validation#quick-displaying-the-validation-errors)中共享的错误。要为错误包填充错误消息，你可以使用 `withViewErrors` 方法：

    $view = $this->withViewErrors([
        'name' => ['Please provide a valid name.']
    ])->view('form');

    $view->assertSee('Please provide a valid name.');

<a name="rendering-blade-and-components"></a>
### 渲染 Blade 与组件

必要时，你可以使用 `blade` 方法求值并渲染原始的 [Blade](/docs/{{version}}/blade) 字符串。与 `view` 方法一样，`blade` 方法返回一个 `Illuminate\Testing\TestView` 实例：

    $view = $this->blade(
        '<x-component :name="$name" />',
        ['name' => 'Taylor']
    );

    $view->assertSee('Taylor');

你可以使用 `component` 方法求值并渲染一个 [Blade 组件](/docs/{{version}}/blade#components)。`component` 方法返回一个 `Illuminate\Testing\TestComponent` 实例：

    $view = $this->component(Profile::class, ['name' => 'Taylor']);

    $view->assertSee('Taylor');

<a name="available-assertions"></a>
## 可用的断言

<a name="response-assertions"></a>
### 响应断言

Laravel 的 `Illuminate\Testing\TestResponse` 类提供了多种自定义断言方法，可在测试应用时使用。这些断言可以在 `json`、`get`、`post`、`put` 和 `delete` 测试方法所返回的响应上调用：

<style>
    .collection-method-list > p {
        columns: 14.4em 2; -moz-columns: 14.4em 2; -webkit-columns: 14.4em 2;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<div class="collection-method-list" markdown="1">

[assertAccepted](#assert-accepted)
[assertBadRequest](#assert-bad-request)
[assertConflict](#assert-conflict)
[assertCookie](#assert-cookie)
[assertCookieExpired](#assert-cookie-expired)
[assertCookieNotExpired](#assert-cookie-not-expired)
[assertCookieMissing](#assert-cookie-missing)
[assertCreated](#assert-created)
[assertDontSee](#assert-dont-see)
[assertDontSeeText](#assert-dont-see-text)
[assertDownload](#assert-download)
[assertExactJson](#assert-exact-json)
[assertExactJsonStructure](#assert-exact-json-structure)
[assertForbidden](#assert-forbidden)
[assertFound](#assert-found)
[assertGone](#assert-gone)
[assertHeader](#assert-header)
[assertHeaderMissing](#assert-header-missing)
[assertInternalServerError](#assert-internal-server-error)
[assertJson](#assert-json)
[assertJsonCount](#assert-json-count)
[assertJsonFragment](#assert-json-fragment)
[assertJsonIsArray](#assert-json-is-array)
[assertJsonIsObject](#assert-json-is-object)
[assertJsonMissing](#assert-json-missing)
[assertJsonMissingExact](#assert-json-missing-exact)
[assertJsonMissingValidationErrors](#assert-json-missing-validation-errors)
[assertJsonPath](#assert-json-path)
[assertJsonMissingPath](#assert-json-missing-path)
[assertJsonStructure](#assert-json-structure)
[assertJsonValidationErrors](#assert-json-validation-errors)
[assertJsonValidationErrorFor](#assert-json-validation-error-for)
[assertLocation](#assert-location)
[assertMethodNotAllowed](#assert-method-not-allowed)
[assertMovedPermanently](#assert-moved-permanently)
[assertContent](#assert-content)
[assertNoContent](#assert-no-content)
[assertStreamed](#assert-streamed)
[assertStreamedContent](#assert-streamed-content)
[assertNotFound](#assert-not-found)
[assertOk](#assert-ok)
[assertPaymentRequired](#assert-payment-required)
[assertPlainCookie](#assert-plain-cookie)
[assertRedirect](#assert-redirect)
[assertRedirectContains](#assert-redirect-contains)
[assertRedirectToRoute](#assert-redirect-to-route)
[assertRedirectToSignedRoute](#assert-redirect-to-signed-route)
[assertRequestTimeout](#assert-request-timeout)
[assertSee](#assert-see)
[assertSeeInOrder](#assert-see-in-order)
[assertSeeText](#assert-see-text)
[assertSeeTextInOrder](#assert-see-text-in-order)
[assertServerError](#assert-server-error)
[assertServiceUnavailable](#assert-server-unavailable)
[assertSessionHas](#assert-session-has)
[assertSessionHasInput](#assert-session-has-input)
[assertSessionHasAll](#assert-session-has-all)
[assertSessionHasErrors](#assert-session-has-errors)
[assertSessionHasErrorsIn](#assert-session-has-errors-in)
[assertSessionHasNoErrors](#assert-session-has-no-errors)
[assertSessionDoesntHaveErrors](#assert-session-doesnt-have-errors)
[assertSessionMissing](#assert-session-missing)
[assertStatus](#assert-status)
[assertSuccessful](#assert-successful)
[assertTooManyRequests](#assert-too-many-requests)
[assertUnauthorized](#assert-unauthorized)
[assertUnprocessable](#assert-unprocessable)
[assertUnsupportedMediaType](#assert-unsupported-media-type)
[assertValid](#assert-valid)
[assertInvalid](#assert-invalid)
[assertViewHas](#assert-view-has)
[assertViewHasAll](#assert-view-has-all)
[assertViewIs](#assert-view-is)
[assertViewMissing](#assert-view-missing)

</div>

<a name="assert-bad-request"></a>
#### assertBadRequest

断言响应具有「错误请求」（400）HTTP 状态码：

    $response->assertBadRequest();

<a name="assert-accepted"></a>
#### assertAccepted

断言响应具有「已接受」（202）HTTP 状态码：

    $response->assertAccepted();

<a name="assert-conflict"></a>
#### assertConflict

断言响应具有「冲突」（409）HTTP 状态码：

    $response->assertConflict();

<a name="assert-cookie"></a>
#### assertCookie

断言响应包含给定的 Cookie：

    $response->assertCookie($cookieName, $value = null);

<a name="assert-cookie-expired"></a>
#### assertCookieExpired

断言响应包含给定的 Cookie，且该 Cookie 已过期：

    $response->assertCookieExpired($cookieName);

<a name="assert-cookie-not-expired"></a>
#### assertCookieNotExpired

断言响应包含给定的 Cookie，且该 Cookie 未过期：

    $response->assertCookieNotExpired($cookieName);

<a name="assert-cookie-missing"></a>
#### assertCookieMissing

断言响应不包含给定的 Cookie：

    $response->assertCookieMissing($cookieName);

<a name="assert-created"></a>
#### assertCreated

断言响应具有 201 HTTP 状态码：

    $response->assertCreated();

<a name="assert-dont-see"></a>
#### assertDontSee

断言给定字符串不包含在应用返回的响应中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义：

    $response->assertDontSee($value, $escaped = true);

<a name="assert-dont-see-text"></a>
#### assertDontSeeText

断言给定字符串不包含在响应文本中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义。该方法会在断言之前把响应内容传给 PHP 的 `strip_tags` 函数：

    $response->assertDontSeeText($value, $escaped = true);

<a name="assert-download"></a>
#### assertDownload

断言响应是一个「下载」。通常这意味着返回该响应的路由返回了 `Response::download` 响应、`BinaryFileResponse` 或 `Storage::download` 响应：

    $response->assertDownload();

如果愿意，你还可以断言下载文件被赋予了给定的文件名：

    $response->assertDownload('image.jpg');

<a name="assert-exact-json"></a>
#### assertExactJson

断言响应包含与给定 JSON 数据完全匹配的内容：

    $response->assertExactJson(array $data);

<a name="assert-exact-json-structure"></a>
#### assertExactJsonStructure

断言响应包含与给定 JSON 结构完全匹配的内容：

    $response->assertExactJsonStructure(array $data);

该方法是 [assertJsonStructure](#assert-json-structure) 更严格的变体。与 `assertJsonStructure` 不同，如果响应中包含任何未显式出现在预期 JSON 结构中的键，该方法将失败。

<a name="assert-forbidden"></a>
#### assertForbidden

断言响应具有「禁止」（403）HTTP 状态码：

    $response->assertForbidden();

<a name="assert-found"></a>
#### assertFound

断言响应具有「已找到」（302）HTTP 状态码：

    $response->assertFound();

<a name="assert-gone"></a>
#### assertGone

断言响应具有「已删除」（410）HTTP 状态码：

    $response->assertGone();

<a name="assert-header"></a>
#### assertHeader

断言响应上存在给定的响应头及其值：

    $response->assertHeader($headerName, $value = null);

<a name="assert-header-missing"></a>
#### assertHeaderMissing

断言响应上不存在给定的响应头：

    $response->assertHeaderMissing($headerName);

<a name="assert-internal-server-error"></a>
#### assertInternalServerError

断言响应具有「内部服务器错误」（500）HTTP 状态码：

    $response->assertInternalServerError();

<a name="assert-json"></a>
#### assertJson

断言响应包含给定的 JSON 数据：

    $response->assertJson(array $data, $strict = false);

`assertJson` 方法会把响应转换为数组，以验证给定数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还存在其他属性，只要给定的片段存在，该测试仍然会通过。

<a name="assert-json-count"></a>
#### assertJsonCount

断言响应 JSON 在给定键上包含一个具有预期项目数量的数组：

    $response->assertJsonCount($count, $key = null);

<a name="assert-json-fragment"></a>
#### assertJsonFragment

断言响应中的任意位置包含给定的 JSON 数据：

    Route::get('/users', function () {
        return [
            'users' => [
                [
                    'name' => 'Taylor Otwell',
                ],
            ],
        ];
    });

    $response->assertJsonFragment(['name' => 'Taylor Otwell']);

<a name="assert-json-is-array"></a>
#### assertJsonIsArray

断言响应 JSON 是一个数组：

    $response->assertJsonIsArray();

<a name="assert-json-is-object"></a>
#### assertJsonIsObject

断言响应 JSON 是一个对象：

    $response->assertJsonIsObject();

<a name="assert-json-missing"></a>
#### assertJsonMissing

断言响应不包含给定的 JSON 数据：

    $response->assertJsonMissing(array $data);

<a name="assert-json-missing-exact"></a>
#### assertJsonMissingExact

断言响应不包含完全匹配的 JSON 数据：

    $response->assertJsonMissingExact(array $data);

<a name="assert-json-missing-validation-errors"></a>
#### assertJsonMissingValidationErrors

断言响应针对给定键没有 JSON 验证错误：

    $response->assertJsonMissingValidationErrors($keys);

> [!NOTE]
> 更为通用的 [assertValid](#assert-valid) 方法可用于断言响应既没有以 JSON 形式返回的验证错误，**也没有**任何错误被闪存（flashed）到会话存储中。

<a name="assert-json-path"></a>
#### assertJsonPath

断言响应在指定路径上包含给定数据：

    $response->assertJsonPath($path, $expectedValue);

例如，如果你的应用返回了以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以像这样断言 `user` 对象的 `name` 属性与给定值匹配：

    $response->assertJsonPath('user.name', 'Steve Schoger');

<a name="assert-json-missing-path"></a>
#### assertJsonMissingPath

断言响应不包含给定路径：

    $response->assertJsonMissingPath($path);

例如，如果你的应用返回了以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言它不包含 `user` 对象的 `email` 属性：

    $response->assertJsonMissingPath('user.email');

<a name="assert-json-structure"></a>
#### assertJsonStructure

断言响应具有给定的 JSON 结构：

    $response->assertJsonStructure(array $structure);

例如，如果你的应用返回的 JSON 响应包含以下数据：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以像这样断言 JSON 结构与你的预期相符：

    $response->assertJsonStructure([
        'user' => [
            'name',
        ]
    ]);

有时，你的应用返回的 JSON 响应可能包含对象数组：

```json
{
    "user": [
        {
            "name": "Steve Schoger",
            "age": 55,
            "location": "Earth"
        },
        {
            "name": "Mary Schoger",
            "age": 60,
            "location": "Earth"
        }
    ]
}
```

在这种情况下，你可以使用 `*` 字符对数组中所有对象的结构进行断言：

    $response->assertJsonStructure([
        'user' => [
            '*' => [
                 'name',
                 'age',
                 'location'
            ]
        ]
    ]);

<a name="assert-json-validation-errors"></a>
#### assertJsonValidationErrors

断言响应针对给定键包含指定的 JSON 验证错误。当验证错误以 JSON 结构返回、而不是被闪存到会话中时，应使用该方法进行断言：

    $response->assertJsonValidationErrors(array $data, $responseKey = 'errors');

> [!NOTE]
> 更为通用的 [assertInvalid](#assert-invalid) 方法可用于断言响应包含以 JSON 形式返回的验证错误，**或者**错误被闪存到了会话存储中。

<a name="assert-json-validation-error-for"></a>
#### assertJsonValidationErrorFor

断言响应针对给定键存在任何 JSON 验证错误：

    $response->assertJsonValidationErrorFor(string $key, $responseKey = 'errors');

<a name="assert-method-not-allowed"></a>
#### assertMethodNotAllowed

断言响应具有「方法不被允许」（405）HTTP 状态码：

    $response->assertMethodNotAllowed();

<a name="assert-moved-permanently"></a>
#### assertMovedPermanently

断言响应具有「永久移动」（301）HTTP 状态码：

    $response->assertMovedPermanently();

<a name="assert-location"></a>
#### assertLocation

断言响应的 `Location` 响应头中具有给定的 URI 值：

    $response->assertLocation($uri);

<a name="assert-content"></a>
#### assertContent

断言给定字符串与响应内容匹配：

    $response->assertContent($value);

<a name="assert-no-content"></a>
#### assertNoContent

断言响应具有给定的 HTTP 状态码且没有内容：

    $response->assertNoContent($status = 204);

<a name="assert-streamed"></a>
#### assertStreamed

断言响应是一个流式响应：

    $response->assertStreamed();

<a name="assert-streamed-content"></a>
#### assertStreamedContent

断言给定字符串与流式响应内容匹配：

    $response->assertStreamedContent($value);

<a name="assert-not-found"></a>
#### assertNotFound

断言响应具有「未找到」（404）HTTP 状态码：

    $response->assertNotFound();

<a name="assert-ok"></a>
#### assertOk

断言响应具有 200 HTTP 状态码：

    $response->assertOk();

<a name="assert-payment-required"></a>
#### assertPaymentRequired

断言响应具有「需要付款」（402）HTTP 状态码：

    $response->assertPaymentRequired();

<a name="assert-plain-cookie"></a>
#### assertPlainCookie

断言响应包含给定的未加密 Cookie：

    $response->assertPlainCookie($cookieName, $value = null);

<a name="assert-redirect"></a>
#### assertRedirect

断言响应是到给定 URI 的重定向：

    $response->assertRedirect($uri = null);

<a name="assert-redirect-contains"></a>
#### assertRedirectContains

断言响应是否重定向到包含给定字符串的 URI：

    $response->assertRedirectContains($string);

<a name="assert-redirect-to-route"></a>
#### assertRedirectToRoute

断言响应是到给定[命名路由](/docs/{{version}}/routing#named-routes)的重定向：

    $response->assertRedirectToRoute($name, $parameters = []);

<a name="assert-redirect-to-signed-route"></a>
#### assertRedirectToSignedRoute

断言响应是到给定[签名路由](/docs/{{version}}/urls#signed-urls)的重定向：

    $response->assertRedirectToSignedRoute($name = null, $parameters = []);

<a name="assert-request-timeout"></a>
#### assertRequestTimeout

断言响应具有「请求超时」（408）HTTP 状态码：

    $response->assertRequestTimeout();

<a name="assert-see"></a>
#### assertSee

断言给定字符串包含在响应中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义：

    $response->assertSee($value, $escaped = true);

<a name="assert-see-in-order"></a>
#### assertSeeInOrder

断言给定字符串按顺序包含在响应中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义：

    $response->assertSeeInOrder(array $values, $escaped = true);

<a name="assert-see-text"></a>
#### assertSeeText

断言给定字符串包含在响应文本中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义。在进行断言之前，响应内容会被传给 PHP 的 `strip_tags` 函数：

    $response->assertSeeText($value, $escaped = true);

<a name="assert-see-text-in-order"></a>
#### assertSeeTextInOrder

断言给定字符串按顺序包含在响应文本中。除非你传入第二个参数 `false`，该断言会自动对给定字符串进行转义。在进行断言之前，响应内容会被传给 PHP 的 `strip_tags` 函数：

    $response->assertSeeTextInOrder(array $values, $escaped = true);

<a name="assert-server-error"></a>
#### assertServerError

断言响应具有「服务器错误」（>= 500，< 600）HTTP 状态码：

    $response->assertServerError();

<a name="assert-server-unavailable"></a>
#### assertServiceUnavailable

断言响应具有「服务不可用」（503）HTTP 状态码：

    $response->assertServiceUnavailable();

<a name="assert-session-has"></a>
#### assertSessionHas

断言会话包含给定的数据：

    $response->assertSessionHas($key, $value = null);

如有需要，可以把闭包作为 `assertSessionHas` 方法的第二个参数传入。如果闭包返回 `true`，断言就会通过：

    $response->assertSessionHas($key, function (User $value) {
        return $value->name === 'Taylor Otwell';
    });

<a name="assert-session-has-input"></a>
#### assertSessionHasInput

断言会话的[闪存输入数组](/docs/{{version}}/responses#redirecting-with-flashed-session-data)中具有给定值：

    $response->assertSessionHasInput($key, $value = null);

如有需要，可以把闭包作为 `assertSessionHasInput` 方法的第二个参数传入。如果闭包返回 `true`，断言就会通过：

    use Illuminate\Support\Facades\Crypt;

    $response->assertSessionHasInput($key, function (string $value) {
        return Crypt::decryptString($value) === 'secret';
    });

<a name="assert-session-has-all"></a>
#### assertSessionHasAll

断言会话包含给定的一组键 / 值对：

    $response->assertSessionHasAll(array $data);

例如，如果你的应用会话包含 `name` 和 `status` 键，你可以像这样断言两者都存在且具有指定的值：

    $response->assertSessionHasAll([
        'name' => 'Taylor Otwell',
        'status' => 'active',
    ]);

<a name="assert-session-has-errors"></a>
#### assertSessionHasErrors

断言会话中针对给定的 `$keys` 存在错误。如果 `$keys` 是关联数组，则断言会话中为每个字段（键）都包含一条特定的错误消息（值）。当测试的路由把验证错误闪存到会话，而不是以 JSON 结构返回时，应使用该方法：

    $response->assertSessionHasErrors(
        array $keys = [], $format = null, $errorBag = 'default'
    );

例如，要断言 `name` 和 `email` 字段具有已闪存到会话中的验证错误消息，你可以这样调用 `assertSessionHasErrors` 方法：

    $response->assertSessionHasErrors(['name', 'email']);

或者，你可以断言某个给定字段具有特定的验证错误消息：

    $response->assertSessionHasErrors([
        'name' => 'The given name was invalid.'
    ]);

> [!NOTE]
> 更为通用的 [assertInvalid](#assert-invalid) 方法可用于断言响应包含以 JSON 形式返回的验证错误，**或者**错误被闪存到了会话存储中。

<a name="assert-session-has-errors-in"></a>
#### assertSessionHasErrorsIn

断言会话中在特定的[错误包](/docs/{{version}}/validation#named-error-bags)内针对给定的 `$keys` 存在错误。如果 `$keys` 是关联数组，则断言会话中在该错误包内为每个字段（键）都包含一条特定的错误消息（值）：

    $response->assertSessionHasErrorsIn($errorBag, $keys = [], $format = null);

<a name="assert-session-has-no-errors"></a>
#### assertSessionHasNoErrors

断言会话没有验证错误：

    $response->assertSessionHasNoErrors();

<a name="assert-session-doesnt-have-errors"></a>
#### assertSessionDoesntHaveErrors

断言会话中针对给定键没有验证错误：

    $response->assertSessionDoesntHaveErrors($keys = [], $format = null, $errorBag = 'default');

> [!NOTE]
> 更为通用的 [assertValid](#assert-valid) 方法可用于断言响应既没有以 JSON 形式返回的验证错误，**也没有**任何错误被闪存到会话存储中。

<a name="assert-session-missing"></a>
#### assertSessionMissing

断言会话中不包含给定的键：

    $response->assertSessionMissing($key);

<a name="assert-status"></a>
#### assertStatus

断言响应具有给定的 HTTP 状态码：

    $response->assertStatus($code);

<a name="assert-successful"></a>
#### assertSuccessful

断言响应具有「成功」（>= 200 且 < 300）HTTP 状态码：

    $response->assertSuccessful();

<a name="assert-too-many-requests"></a>
#### assertTooManyRequests

断言响应具有「请求过多」（429）HTTP 状态码：

    $response->assertTooManyRequests();

<a name="assert-unauthorized"></a>
#### assertUnauthorized

断言响应具有「未认证」（401）HTTP 状态码：

    $response->assertUnauthorized();

<a name="assert-unprocessable"></a>
#### assertUnprocessable

断言响应具有「无法处理的实体」（422）HTTP 状态码：

    $response->assertUnprocessable();

<a name="assert-unsupported-media-type"></a>
#### assertUnsupportedMediaType

断言响应具有「不支持的媒体类型」（415）HTTP 状态码：

    $response->assertUnsupportedMediaType();

<a name="assert-valid"></a>
#### assertValid

断言响应针对给定键没有验证错误。当验证错误以 JSON 结构返回，或验证错误已被闪存到会话中时，可以使用该方法进行断言：

    // 断言不存在验证错误……
    $response->assertValid();

    // 断言给定键没有验证错误……
    $response->assertValid(['name', 'email']);

<a name="assert-invalid"></a>
#### assertInvalid

断言响应针对给定键存在验证错误。当验证错误以 JSON 结构返回，或验证错误已被闪存到会话中时，可以使用该方法进行断言：

    $response->assertInvalid(['name', 'email']);

你还可以断言某个给定键具有特定的验证错误消息。这样做时，你可以提供完整消息，也可以只提供消息的一小部分：

    $response->assertInvalid([
        'name' => 'The name field is required.',
        'email' => 'valid email address',
    ]);

<a name="assert-view-has"></a>
#### assertViewHas

断言响应视图包含给定的数据：

    $response->assertViewHas($key, $value = null);

把闭包作为 `assertViewHas` 方法的第二个参数传入，可以让你检查并对某一份视图数据进行断言：

    $response->assertViewHas('user', function (User $user) {
        return $user->name === 'Taylor';
    });

此外，视图数据可以当作响应上的数组变量访问，便于你进行检查：

```php tab=Pest
expect($response['name'])->toBe('Taylor');
```

```php tab=PHPUnit
$this->assertEquals('Taylor', $response['name']);
```

<a name="assert-view-has-all"></a>
#### assertViewHasAll

断言响应视图具有给定的数据列表：

    $response->assertViewHasAll(array $data);

该方法可用于断言视图仅包含与给定键匹配的数据：

    $response->assertViewHasAll([
        'name',
        'email',
    });

或者，你可以断言视图数据存在且具有特定的值：

    $response->assertViewHasAll([
        'name' => 'Taylor Otwell',
        'email' => 'taylor@example.com,',
    ]);

<a name="assert-view-is"></a>
#### assertViewIs

断言路由返回了给定的视图：

    $response->assertViewIs($value);

<a name="assert-view-missing"></a>
#### assertViewMissing

断言给定的数据键并未提供给应用响应中返回的视图：

    $response->assertViewMissing($key);

<a name="authentication-assertions"></a>
### 认证断言

Laravel 还提供了多种与认证相关的断言，可在应用的功能测试中使用。请注意，这些方法是在测试类本身上调用的，而不是在 `get`、`post` 等方法返回的 `Illuminate\Testing\TestResponse` 实例上调用的。

<a name="assert-authenticated"></a>
#### assertAuthenticated

断言用户已通过认证：

    $this->assertAuthenticated($guard = null);

<a name="assert-guest"></a>
#### assertGuest

断言用户未通过认证：

    $this->assertGuest($guard = null);

<a name="assert-authenticated-as"></a>
#### assertAuthenticatedAs

断言某个特定用户已通过认证：

    $this->assertAuthenticatedAs($user, $guard = null);

<a name="validation-assertions"></a>
## 验证断言

Laravel 提供了两个主要的验证相关断言，可用于确保请求中提供的数据是有效或无效的。

<a name="validation-assert-valid"></a>
#### assertValid

断言响应针对给定键没有验证错误。当验证错误以 JSON 结构返回，或验证错误已被闪存到会话中时，可以使用该方法进行断言：

    // 断言不存在验证错误……
    $response->assertValid();

    // 断言给定键没有验证错误……
    $response->assertValid(['name', 'email']);

<a name="validation-assert-invalid"></a>
#### assertInvalid

断言响应针对给定键存在验证错误。当验证错误以 JSON 结构返回，或验证错误已被闪存到会话中时，可以使用该方法进行断言：

    $response->assertInvalid(['name', 'email']);

你还可以断言某个给定键具有特定的验证错误消息。这样做时，你可以提供完整消息，也可以只提供消息的一小部分：

    $response->assertInvalid([
        'name' => 'The name field is required.',
        'email' => 'valid email address',
    ]);
