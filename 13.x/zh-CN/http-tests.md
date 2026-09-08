# HTTP 测试

## 简介

Laravel 提供了一个非常流畅的 API，用于向你的应用发起 HTTP 请求并检查响应。例如，请看下面定义的特性测试：

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
     * 一个基础的测试示例。
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

`get` 方法向应用发起一个 `GET` 请求，而 `assertStatus` 方法断言返回的响应应该具有给定的 HTTP 状态码。除了这个简单的断言之外，Laravel 还包含多种断言，用于检查响应 Header、内容、JSON 结构等。

## 发起请求

要向你的应用发起请求，可以在测试中调用 `get`、`post`、`put`、`patch` 或 `delete` 方法。这些方法并不会真正向你的应用发出"真实"的 HTTP 请求，而是会在内部模拟整个网络请求。

测试请求方法返回的并不是 `Illuminate\Http\Response` 实例，而是 `Illuminate\Testing\TestResponse` 实例，它提供了多种实用的断言，让你可以检查应用的响应：

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
     * 一个基础的测试示例。
     */
    public function test_a_basic_request(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

一般来说，你的每个测试应该只向应用发起一次请求。如果在单个测试方法中执行多个请求，可能会出现意外行为。

> [!NOTE]
> 为方便起见，运行测试时会自动禁用 CSRF 中间件。

### 自定义请求头

你可以使用 `withHeaders` 方法在请求发送到应用之前自定义请求的 Header。该方法允许你向请求添加任意自定义 Header：

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
     * 一个基础的功能测试示例。
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

### Cookie

你可以使用 `withCookie` 或 `withCookies` 方法在发起请求之前设置 cookie 值。`withCookie` 方法接受 cookie 名称和值作为两个参数，而 `withCookies` 方法接受键值对数组：

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

### Session / 认证

Laravel 提供了几个辅助函数，用于在 HTTP 测试期间与 session 交互。首先，你可以使用 `withSession` 方法将 session 数据设置为给定数组。在向你应用发起请求之前，这可用于为 session 加载数据：

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

Laravel 的 session 通常用于为当前已认证的用户维护状态。因此，`actingAs` 辅助方法提供了一种简单的方式，将给定的用户认证为当前用户。例如，我们可以使用[模型工厂](/topic/Laravel%2013.x/wevwmlz9l2.html) 来生成并认证一个用户：

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

你还可以通过向 `actingAs` 方法传递 guard 名称作为第二个参数，来指定应使用哪个 guard 来认证给定的用户。提供给 `actingAs` 方法的 guard 在测试期间也会成为默认 guard：

```php
$this->actingAs($user, 'web');
```

如果你想确保请求是未认证的，可以使用 `actingAsGuest` 方法：

```php
$this->actingAsGuest();
```

### 调试响应

向应用发起测试请求后，可以使用 `dump`、`dumpHeaders` 和 `dumpSession` 方法来检查和调试响应内容：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dump();
    $response->dumpHeaders();
    $response->dumpSession();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基础的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dump();
        $response->dumpHeaders();
        $response->dumpSession();
    }
}
```

或者，你可以使用 `dd`、`ddHeaders`、`ddBody`、`ddJson` 和 `ddSession` 方法来 dump 有关响应的信息，然后停止执行：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dd();
    $response->ddHeaders();
    $response->ddBody();
    $response->ddJson();
    $response->ddSession();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基础的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dd();
        $response->ddHeaders();
        $response->ddBody();
        $response->ddJson();
        $response->ddSession();
    }
}
```

### 异常处理

有时你可能需要测试应用是否抛出了特定的异常。为此，你可以通过 `Exceptions` Facade 来"伪造"异常处理程序。一旦异常处理程序被伪造，就可以使用 `assertReported` 和 `assertNotReported` 方法对请求期间抛出的异常进行断言：

```php tab=Pest
<?php

use App\Exceptions\InvalidOrderException;
use Illuminate\Support\Facades\Exceptions;

test('exception is thrown', function () {
    Exceptions::fake();

    $response = $this->get('/order/1');

    // 断言已抛出异常...
    Exceptions::assertReported(InvalidOrderException::class);

    // 对异常进行断言...
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
     * 一个基础的测试示例。
     */
    public function test_exception_is_thrown(): void
    {
        Exceptions::fake();

        $response = $this->get('/');

        // 断言已抛出异常...
        Exceptions::assertReported(InvalidOrderException::class);

        // 对异常进行断言...
        Exceptions::assertReported(function (InvalidOrderException $e) {
            return $e->getMessage() === 'The order was invalid.';
        });
    }
}
```

`assertNotReported` 和 `assertNothingReported` 方法可用于断言给定的异常在请求期间未被抛出，或断言没有抛出任何异常：

```php
Exceptions::assertNotReported(InvalidOrderException::class);

Exceptions::assertNothingReported();
```

你可以通过在发起请求之前调用 `withoutExceptionHandling` 方法，为给定请求完全禁用异常处理：

```php
$response = $this->withoutExceptionHandling()->get('/');
```

此外，如果你想确保应用没有使用 PHP 语言或应用所依赖的库已弃用的功能，可以在发起请求之前调用 `withoutDeprecationHandling` 方法。当弃用处理被禁用时，弃用警告会被转换为异常，从而导致你的测试失败：

```php
$response = $this->withoutDeprecationHandling()->get('/');
```

`assertThrows` 方法可用于断言给定闭包中的代码抛出了指定类型的异常：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    OrderInvalid::class
);
```

如果你想检查并对抛出的异常进行断言，可以向 `assertThrows` 方法的第二个参数提供一个闭包：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    fn (OrderInvalid $e) => $e->orderId() === 123;
);
```

`assertDoesntThrow` 方法可用于断言给定闭包中的代码没有抛出任何异常：

```php
$this->assertDoesntThrow(fn () => (new ProcessOrder)->execute());
```

## 测试 JSON API

Laravel 还提供了几个用于测试 JSON API 及其响应的辅助函数。例如，`json`、`getJson`、`postJson`、`putJson`、`patchJson`、`deleteJson` 和 `optionsJson` 方法可用于使用各种 HTTP 动词发起 JSON 请求。你还可以轻松地向这些方法传递数据和 Header。首先，我们编写一个测试，向 `/api/user` 发起 `POST` 请求，并断言返回了预期的 JSON 数据：

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
     * 一个基础的功能测试示例。
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

此外，JSON 响应数据可以像数组变量一样在响应上访问，方便你检查 JSON 响应中返回的各个值：

```php tab=Pest
expect($response['created'])->toBeTrue();
```

```php tab=PHPUnit
$this->assertTrue($response['created']);
```

> [!NOTE]
> `assertJson` 方法会将响应转换为数组，以验证给定数组存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定的片段存在，测试仍然会通过。

#### 断言 JSON 精确匹配

如前所述，`assertJson` 方法可用于断言 JSON 响应中存在某个 JSON 片段。如果你想验证给定数组与你的应用返回的 JSON **完全匹配**，应该使用 `assertExactJson` 方法：

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
     * 一个基础的功能测试示例。
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

#### 对 JSON 路径断言

如果你想验证 JSON 响应在指定路径包含给定的数据，应该使用 `assertJsonPath` 方法：

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
     * 一个基础的功能测试示例。
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

`assertJsonPath` 方法还接受一个闭包，可用于动态决定是否应该通过断言：

```php
$response->assertJsonPath('team.owner.name', fn (string $name) => strlen($name) >= 3);
```

如果你需要一次断言多个 JSON 路径，可以使用 `assertJsonPaths` 方法。每个路径的期望值也可以是一个闭包：

```php
$response->assertJsonPaths([
    'team.owner.name' => 'Darian',
    'team.owner.email' => fn (string $email) => str($email)->is('*@laravel.com'),
    'team.members.0.name' => 'Sally',
]);
```

你可以使用 `assertJsonMissingPaths` 方法断言多个 JSON 路径在响应中缺失：

```php
$response->assertJsonMissingPaths([
    'team.owner.password',
    'team.members.0.api_token',
]);
```

### 流式 JSON 测试

Laravel 还提供了一种优美的方式，来流畅地测试应用的 JSON 响应。要开始使用，可以向 `assertJson` 方法传递一个闭包。该闭包会使用 `Illuminate\Testing\Fluent\AssertableJson` 实例调用，你可以使用该实例对应用返回的 JSON 进行断言。`where` 方法可用于对 JSON 的某个特定属性进行断言，而 `missing` 方法可用于断言某个特定属性在 JSON 中缺失：

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
 * 一个基础的功能测试示例。
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

在上面的示例中，你可能注意到我们在断言链的末尾调用了 `etc` 方法。该方法告知 Laravel，JSON 对象上可能还存在其他属性。如果不使用 `etc` 方法，当 JSON 对象上存在你未做断言的其他属性时，测试将会失败。

这种行为背后的意图是保护你，防止在 JSON 响应中无意暴露敏感信息——它强制你要么显式地对属性做出断言，要么通过 `etc` 方法显式地允许额外的属性。

不过，你应该注意，在断言链中不包含 `etc` 方法，并不能确保不会向嵌套在你 JSON 对象内部的数组添加额外的属性。`etc` 方法只确保在调用它的嵌套层级上不存在额外的属性。

#### 断言属性存在 / 不存在

要断言某个属性存在或缺失，可以使用 `has` 和 `missing` 方法：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('data')
        ->missing('message')
);
```

此外，`hasAll` 和 `missingAll` 方法允许同时断言多个属性的存在或缺失：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->hasAll(['status', 'data'])
        ->missingAll(['message', 'code'])
);
```

你可以使用 `hasAny` 方法来确定给定属性列表中是否至少存在一个属性：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('status')
        ->hasAny('data', 'message', 'code')
);
```

#### 对 JSON 集合进行断言

通常，你的路由会返回一个包含多个条目（例如多个用户）的 JSON 响应：

```php
Route::get('/users', function () {
    return User::all();
});
```

在这些情况下，我们可以使用流畅 JSON 对象的 `has` 方法对响应中包含的用户进行断言。例如，我们断言 JSON 响应包含三个用户。接下来，我们使用 `first` 方法对集合中的第一个用户做一些断言。`first` 方法接受一个闭包，该闭包会接收另一个可断言的 JSON 字符串，我们可以用它对 JSON 集合中的第一个对象进行断言：

```php
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
```

如果你想对 JSON 集合中的每个条目做出相同的断言，可以使用 `each` 方法：

```php
$response
  ->assertJson(fn (AssertableJson $json) =>
      $json->has(3)
          ->each(fn (AssertableJson $json) =>
              $json->whereType('id', 'integer')
                  ->whereType('name', 'string')
                  ->whereType('email', 'string')
                  ->missing('password')
                  ->etc()
          )
  );
```

#### 限定 JSON 集合断言范围

有时，你应用的路由会返回分配了命名键的 JSON 集合：

```php
Route::get('/users', function () {
    return [
        'meta' => [...],
        'users' => User::all(),
    ];
})
```

测试这些路由时，你可以使用 `has` 方法对集合中的条目数量进行断言。此外，你可以使用 `has` 方法将一组断言限定在某一范围：

```php
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
```

不过，与其对 `users` 集合调用两次 `has` 方法，你可以进行一次调用，并将一个闭包作为第三个参数提供。此时，该闭包会自动被调用，并被限定在集合的第一个条目上：

```php
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
```

#### 断言 JSON 类型

你可能只想断言 JSON 响应中的属性属于某种类型。`Illuminate\Testing\Fluent\AssertableJson` 类提供了 `whereType` 和 `whereAllType` 方法来做到这一点：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('id', 'integer')
        ->whereAllType([
            'users.0.name' => 'string',
            'meta' => 'array'
        ])
);
```

你可以使用 `|` 字符，或将类型数组作为第二个参数传递给 `whereType` 方法，来指定多个类型。如果响应值是所列类型中的任意一种，断言就会成功：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('name', 'string|null')
        ->whereType('id', ['string', 'integer'])
);
```

`whereType` 和 `whereAllType` 方法识别以下类型：`string`、`integer`、`double`、`boolean`、`array` 和 `null`。

## 测试文件上传

`Illuminate\Http\UploadedFile` 类提供了一个 `fake` 方法，可用于生成用于测试的虚拟文件或图像。结合 `Storage` Facade 的 `fake` 方法，这大大简化了文件上传的测试。例如，你可以结合这两个功能轻松测试头像上传表单：

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

如果你想断言某个给定的文件不存在，可以使用 `Storage` Facade 提供的 `assertMissing` 方法：

```php
Storage::fake('avatars');

// ...

Storage::disk('avatars')->assertMissing('missing.jpg');
```

#### 伪造文件自定义

使用 `UploadedFile` 类提供的 `fake` 方法创建文件时，你可以指定图像的宽度、高度和大小（以千字节为单位），以便更好地测试应用的验证规则：

```php
UploadedFile::fake()->image('avatar.jpg', $width, $height)->size(100);
```

除了创建图像之外，你还可以使用 `create` 方法创建任何其他类型的文件：

```php
UploadedFile::fake()->create('document.pdf', $sizeInKilobytes);
```

如果需要，你可以向该方法传递一个 `$mimeType` 参数，以显式定义文件应返回的 MIME 类型：

```php
UploadedFile::fake()->create(
    'document.pdf', $sizeInKilobytes, 'application/pdf'
);
```

## 测试视图

Laravel 还允许你在无需向应用发起模拟 HTTP 请求的情况下渲染视图。为此，你可以在测试中调用 `view` 方法。`view` 方法接受视图名称和可选的数据数组。该方法返回一个 `Illuminate\Testing\TestView` 实例，它提供了几个方法，方便你对视图内容进行断言：

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

如果需要，你可以通过将 `TestView` 实例转换为字符串来获取原始的、已渲染的视图内容：

```php
$contents = (string) $this->view('welcome');
```

#### 共享错误

某些视图可能依赖于 [Laravel 提供的全局错误包](/topic/Laravel%2013.x/e296oew9q7.html) 中共享的错误。要为错误包填充错误消息，可以使用 `withViewErrors` 方法：

```php
$view = $this->withViewErrors([
    'name' => ['Please provide a valid name.']
])->view('form');

$view->assertSee('Please provide a valid name.');
```

### 渲染 Blade 与组件

如有必要，你可以使用 `blade` 方法来计算并渲染原始的 [Blade](/topic/Laravel%2013.x/wevwmrz9l2.html) 字符串。与 `view` 方法一样，`blade` 方法返回 `Illuminate\Testing\TestView` 实例：

```php
$view = $this->blade(
    '<x-component :name="$name" />',
    ['name' => 'Taylor']
);

$view->assertSee('Taylor');
```

你可以使用 `component` 方法来计算并渲染一个 [Blade 组件](/topic/Laravel%2013.x/wevwmrz9l2.html)。`component` 方法返回 `Illuminate\Testing\TestComponent` 实例：

```php
$view = $this->component(Profile::class, ['name' => 'Taylor']);

$view->assertSee('Taylor');
```

## 缓存路由

在测试运行之前，Laravel 会引导应用的一个全新实例，包括收集所有已定义的路由。如果你的应用有许多路由文件，你可能希望将 `Illuminate\Foundation\Testing\WithCachedRoutes` Trait 添加到你的测试用例中。在使用该 Trait 的测试上，路由只构建一次并存储在内存中，这意味着路由集合过程只会为测试套件中的所有测试运行一次：

```php tab=Pest
<?php

use App\Http\Controllers\UserController;
use Illuminate\Foundation\Testing\WithCachedRoutes;

pest()->use(WithCachedRoutes::class);

test('basic example', function () {
    $this->get(action([UserController::class, 'index']));

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Http\Controllers\UserController;
use Illuminate\Foundation\Testing\WithCachedRoutes;
use Tests\TestCase;

class BasicTest extends TestCase
{
    use WithCachedRoutes;

    /**
     * 一个基础的功能测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get(action([UserController::class, 'index']));

        // ...
    }
}
```

## 可用断言

### 响应断言

Laravel 的 `Illuminate\Testing\TestResponse` 类提供了多种自定义的断言方法，你可以在测试应用时使用。这些断言可以在 `json`、`get`、`post`、`put` 和 `delete` 测试方法返回的响应上访问：

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

assertAccepted
assertBadRequest
assertClientError
assertConflict
assertCookie
assertCookieExpired
assertCookieNotExpired
assertCookieMissing
assertCreated
assertDontSee
assertDontSeeText
assertDownload
assertExactJson
assertExactJsonStructure
assertFailedDependency
assertForbidden
assertFound
assertGone
assertHeader
assertHeaderContains
assertHeaderMissing
assertInternalServerError
assertJson
assertJsonCount
assertJsonFragment
assertJsonIsArray
assertJsonIsObject
assertJsonMissing
assertJsonMissingExact
assertJsonMissingValidationErrors
assertJsonPath
assertJsonPaths
assertJsonMissingPath
assertJsonMissingPaths
assertJsonStructure
assertJsonValidationErrors
assertJsonValidationErrorFor
assertLocation
assertMethodNotAllowed
assertMovedPermanently
assertContent
assertNoContent
assertStreamed
assertStreamedContent
assertNotFound
assertOk
assertPaymentRequired
assertPlainCookie
assertRedirect
assertRedirectBack
assertRedirectBackWithErrors
assertRedirectBackWithoutErrors
assertRedirectContains
assertRedirectToRoute
assertRedirectToSignedRoute
assertRequestTimeout
assertSee
assertSeeInOrder
assertSeeText
assertSeeTextInOrder
assertServerError
assertServiceUnavailable
assertSessionHas
assertSessionHasInput
assertSessionHasAll
assertSessionHasErrors
assertSessionHasErrorsIn
assertSessionHasNoErrors
assertSessionDoesntHaveErrors
assertSessionMissing
assertSessionMissingInput
assertStatus
assertSuccessful
assertTooManyRequests
assertUnauthorized
assertUnprocessable
assertUnsupportedMediaType
assertValid
assertInvalid
assertViewHas
assertViewHasAll
assertViewIs
assertViewMissing

</div>

#### assertAccepted

断言响应具有 accepted（202）HTTP 状态码：

```php
$response->assertAccepted();
```

#### assertBadRequest

断言响应具有 bad request（400）HTTP 状态码：

```php
$response->assertBadRequest();
```

#### assertClientError

断言响应具有 client error（>= 400，< 500）HTTP 状态码：

```php
$response->assertClientError();
```

#### assertConflict

断言响应具有 conflict（409）HTTP 状态码：

```php
$response->assertConflict();
```

#### assertCookie

断言响应包含给定的 cookie：

```php
$response->assertCookie($cookieName, $value = null);
```

#### assertCookieExpired

断言响应包含给定的 cookie 且它已过期：

```php
$response->assertCookieExpired($cookieName);
```

#### assertCookieNotExpired

断言响应包含给定的 cookie 且它尚未过期：

```php
$response->assertCookieNotExpired($cookieName);
```

#### assertCookieMissing

断言响应不包含给定的 cookie：

```php
$response->assertCookieMissing($cookieName);
```

#### assertCreated

断言响应具有 201 HTTP 状态码：

```php
$response->assertCreated();
```

#### assertDontSee

断言给定字符串不在应用返回的响应中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串：

```php
$response->assertDontSee($value, $escape = true);
```

#### assertDontSeeText

断言给定字符串不在响应文本中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串。该方法会在进行断言之前将响应内容传递给 `strip_tags` PHP 函数：

```php
$response->assertDontSeeText($value, $escape = true);
```

#### assertDownload

断言响应是一个"下载"。通常，这意味着返回该响应的被调用路由返回的是 `Response::download` 响应、`BinaryFileResponse` 或 `Storage::download` 响应：

```php
$response->assertDownload();
```

如果需要，你可以断言可下载文件被赋予了给定的文件名：

```php
$response->assertDownload('image.jpg');
```

#### assertExactJson

断言响应包含给定 JSON 数据的精确匹配：

```php
$response->assertExactJson(array $data);
```

#### assertExactJsonStructure

断言响应包含给定 JSON 结构的精确匹配：

```php
$response->assertExactJsonStructure(array $data);
```

该方法是 assertJsonStructure 的一个更严格的变体。与 `assertJsonStructure` 相比，如果响应包含任何未在预期 JSON 结构中显式包含的键，该方法将会失败。

#### assertFailedDependency

断言响应具有 failed dependency（424）HTTP 状态码：

```php
$response->assertFailedDependency();
```

#### assertForbidden

断言响应具有 forbidden（403）HTTP 状态码：

```php
$response->assertForbidden();
```

#### assertFound

断言响应具有 found（302）HTTP 状态码：

```php
$response->assertFound();
```

#### assertGone

断言响应具有 gone（410）HTTP 状态码：

```php
$response->assertGone();
```

#### assertHeader

断言响应上存在给定的 Header 和值：

```php
$response->assertHeader($headerName, $value = null);
```

#### assertHeaderContains

断言给定的 Header 包含给定的子字符串值：

```php
$response->assertHeaderContains($headerName, $value);
```

#### assertHeaderMissing

断言响应上不存在给定的 Header：

```php
$response->assertHeaderMissing($headerName);
```

#### assertInternalServerError

断言响应具有 "Internal Server Error"（500）HTTP 状态码：

```php
$response->assertInternalServerError();
```

#### assertJson

断言响应包含给定的 JSON 数据：

```php
$response->assertJson(array $data, $strict = false);
```

`assertJson` 方法会将响应转换为数组，以验证给定数组存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定片段存在，测试仍然会通过。

#### assertJsonCount

断言响应 JSON 在给定键处具有包含预期数量条目的数组：

```php
$response->assertJsonCount($count, $key = null);
```

#### assertJsonFragment

断言响应中任何位置都包含给定的 JSON 数据：

```php
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
```

#### assertJsonIsArray

断言响应 JSON 是一个数组：

```php
$response->assertJsonIsArray();
```

#### assertJsonIsObject

断言响应 JSON 是一个对象：

```php
$response->assertJsonIsObject();
```

#### assertJsonMissing

断言响应不包含给定的 JSON 数据：

```php
$response->assertJsonMissing(array $data);
```

#### assertJsonMissingExact

断言响应不包含精确的 JSON 数据：

```php
$response->assertJsonMissingExact(array $data);
```

#### assertJsonMissingValidationErrors

断言响应对于给定的键没有 JSON 验证错误：

```php
$response->assertJsonMissingValidationErrors($keys);
```

> [!NOTE]
> 更通用的 assertValid 方法可用于断言响应没有以 JSON 形式返回的验证错误，**并且** 没有错误被闪存到 session 存储中。

#### assertJsonPath

断言响应在指定路径包含给定的数据：

```php
$response->assertJsonPath($path, $expectedValue);
```

例如，如果应用返回了以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以像这样断言 `user` 对象的 `name` 属性匹配给定值：

```php
$response->assertJsonPath('user.name', 'Steve Schoger');
```

#### assertJsonPaths

断言响应在指定路径包含给定的数据：

```php
$response->assertJsonPaths(array $paths);
```

例如，你可以一次性断言响应中的多个值：

```php
$response->assertJsonPaths([
    'user.name' => 'Steve Schoger',
    'user.email' => fn (string $email) => str($email)->endsWith('@laravel.com'),
]);
```

#### assertJsonMissingPath

断言响应不包含给定的路径：

```php
$response->assertJsonMissingPath($path);
```

例如，如果应用返回了以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言它不包含 `user` 对象的 `email` 属性：

```php
$response->assertJsonMissingPath('user.email');
```

#### assertJsonMissingPaths

断言响应不包含给定的路径：

```php
$response->assertJsonMissingPaths($paths);
```

例如，你可以断言响应中缺失多个路径：

```php
$response->assertJsonMissingPaths([
    'user.email',
    'user.password',
]);
```

#### assertJsonStructure

断言响应具有给定的 JSON 结构：

```php
$response->assertJsonStructure(array $structure);
```

例如，如果应用返回的 JSON 响应包含以下数据：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以像这样断言 JSON 结构符合你的预期：

```php
$response->assertJsonStructure([
    'user' => [
        'name',
    ]
]);
```

有时，应用返回的 JSON 响应可能包含对象数组：

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

```php
$response->assertJsonStructure([
    'user' => [
        '*' => [
             'name',
             'age',
             'location'
        ]
    ]
]);
```

#### assertJsonValidationErrors

断言响应对于给定的键具有给定的 JSON 验证错误。当断言的响应是将验证错误作为 JSON 结构返回、而不是闪存到 session 时，应使用此方法：

```php
$response->assertJsonValidationErrors(array $data, $responseKey = 'errors');
```

> [!NOTE]
> 更通用的 assertInvalid 方法可用于断言响应具有以 JSON 形式返回的验证错误，**或者** 错误被闪存到了 session 存储中。

#### assertJsonValidationErrorFor

断言响应对于给定的键具有任意 JSON 验证错误：

```php
$response->assertJsonValidationErrorFor(string $key, $responseKey = 'errors');
```

#### assertMethodNotAllowed

断言响应具有 method not allowed（405）HTTP 状态码：

```php
$response->assertMethodNotAllowed();
```

#### assertMovedPermanently

断言响应具有 moved permanently（301）HTTP 状态码：

```php
$response->assertMovedPermanently();
```

#### assertLocation

断言响应在 `Location` Header 中具有给定的 URI 值：

```php
$response->assertLocation($uri);
```

#### assertContent

断言给定字符串与响应内容匹配：

```php
$response->assertContent($value);
```

#### assertNoContent

断言响应具有给定的 HTTP 状态码且没有内容：

```php
$response->assertNoContent($status = 204);
```

#### assertStreamed

断言响应是一个流式响应：

```php
$response->assertStreamed();
```

#### assertStreamedContent

断言给定字符串与流式响应的内容匹配：

```php
$response->assertStreamedContent($value);
```

#### assertNotFound

断言响应具有 not found（404）HTTP 状态码：

```php
$response->assertNotFound();
```

#### assertOk

断言响应具有 200 HTTP 状态码：

```php
$response->assertOk();
```

#### assertPaymentRequired

断言响应具有 payment required（402）HTTP 状态码：

```php
$response->assertPaymentRequired();
```

#### assertPlainCookie

断言响应包含给定的未加密 cookie：

```php
$response->assertPlainCookie($cookieName, $value = null);
```

#### assertRedirect

断言响应是重定向到给定的 URI：

```php
$response->assertRedirect($uri = null);
```

#### assertRedirectBack

断言响应是否正在重定向回上一页：

```php
$response->assertRedirectBack();
```

#### assertRedirectBackWithErrors

断言响应是否正在重定向回上一页，且 session 具有给定的错误：

```php
$response->assertRedirectBackWithErrors(
    array $keys = [], $format = null, $errorBag = 'default'
);
```

#### assertRedirectBackWithoutErrors

断言响应是否正在重定向回上一页，且 session 不包含任何错误消息：

```php
$response->assertRedirectBackWithoutErrors();
```

#### assertRedirectContains

断言响应是否正在重定向到包含给定字符串的 URI：

```php
$response->assertRedirectContains($string);
```

#### assertRedirectToRoute

断言响应是重定向到给定的 [命名路由](/topic/Laravel%2013.x/dgy7xg5vw2.html)：

```php
$response->assertRedirectToRoute($name, $parameters = []);
```

#### assertRedirectToSignedRoute

断言响应是重定向到给定的 [签名路由](/topic/Laravel%2013.x/3oyjdkxyp5.html)：

```php
$response->assertRedirectToSignedRoute($name = null, $parameters = []);
```

#### assertRequestTimeout

断言响应具有 request timeout（408）HTTP 状态码：

```php
$response->assertRequestTimeout();
```

#### assertSee

断言给定字符串包含在响应中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串：

```php
$response->assertSee($value, $escape = true);
```

#### assertSeeInOrder

断言给定字符串按顺序包含在响应中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串：

```php
$response->assertSeeInOrder(array $values, $escape = true);
```

#### assertSeeText

断言给定字符串包含在响应文本中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串。在进行断言之前，响应内容会被传递给 `strip_tags` PHP 函数：

```php
$response->assertSeeText($value, $escape = true);
```

#### assertSeeTextInOrder

断言给定字符串按顺序包含在响应文本中。除非你传入第二个参数 `false`，否则该断言会自动转义给定字符串。在进行断言之前，响应内容会被传递给 `strip_tags` PHP 函数：

```php
$response->assertSeeTextInOrder(array $values, $escape = true);
```

#### assertServerError

断言响应具有 server error（>= 500，< 600）HTTP 状态码：

```php
$response->assertServerError();
```

#### assertServiceUnavailable

断言响应具有 "Service Unavailable"（503）HTTP 状态码：

```php
$response->assertServiceUnavailable();
```

#### assertSessionHas

断言 session 包含给定的数据片段：

```php
$response->assertSessionHas($key, $value = null);
```

如果需要，可以将一个闭包作为第二个参数提供给 `assertSessionHas` 方法。如果闭包返回 `true`，断言就会通过：

```php
$response->assertSessionHas($key, function (User $value) {
    return $value->name === 'Taylor Otwell';
});
```

#### assertSessionHasInput

断言 session 在 [闪存输入数组](/topic/Laravel%2013.x/2qvpxqz93m.html) 中具有给定的值：

```php
$response->assertSessionHasInput($key, $value = null);
```

如果需要，可以将一个闭包作为第二个参数提供给 `assertSessionHasInput` 方法。如果闭包返回 `true`，断言就会通过：

```php
use Illuminate\Support\Facades\Crypt;

$response->assertSessionHasInput($key, function (string $value) {
    return Crypt::decryptString($value) === 'secret';
});
```

#### assertSessionHasAll

断言 session 包含给定的键值对数组：

```php
$response->assertSessionHasAll(array $data);
```

例如，如果你的应用的 session 包含 `name` 和 `status` 键，你可以像这样断言两者都存在并具有指定的值：

```php
$response->assertSessionHasAll([
    'name' => 'Taylor Otwell',
    'status' => 'active',
]);
```

#### assertSessionHasErrors

断言 session 包含给定 `$keys` 的错误。如果 `$keys` 是一个关联数组，则断言 session 为每个字段（键）包含特定的错误消息（值）。当测试将验证错误闪存到 session 而不是以 JSON 结构返回它们的路由时，应使用此方法：

```php
$response->assertSessionHasErrors(
    array $keys = [], $format = null, $errorBag = 'default'
);
```

例如，要断言 `name` 和 `email` 字段存在闪存到 session 的验证错误消息，你可以像这样调用 `assertSessionHasErrors` 方法：

```php
$response->assertSessionHasErrors(['name', 'email']);
```

或者，你可以断言给定字段具有特定的验证错误消息：

```php
$response->assertSessionHasErrors([
    'name' => 'The given name was invalid.'
]);
```

> [!NOTE]
> 更通用的 assertInvalid 方法可用于断言响应具有以 JSON 形式返回的验证错误，**或者** 错误被闪存到了 session 存储中。

#### assertSessionHasErrorsIn

断言在特定的 [错误包](/topic/Laravel%2013.x/e296oew9q7.html) 内，session 包含给定 `$keys` 的错误。如果 `$keys` 是一个关联数组，则断言在错误包内为每个字段（键）包含特定的错误消息（值）：

```php
$response->assertSessionHasErrorsIn($errorBag, $keys = [], $format = null);
```

#### assertSessionHasNoErrors

断言 session 没有验证错误：

```php
$response->assertSessionHasNoErrors();
```

#### assertSessionDoesntHaveErrors

断言 session 对于给定的键没有验证错误：

```php
$response->assertSessionDoesntHaveErrors($keys = [], $format = null, $errorBag = 'default');
```

> [!NOTE]
> 更通用的 assertValid 方法可用于断言响应没有以 JSON 形式返回的验证错误，**并且** 没有错误被闪存到 session 存储中。

#### assertSessionMissing

断言 session 不包含给定的键：

```php
$response->assertSessionMissing($key);
```

#### assertSessionMissingInput

断言 session 在闪存输入数组中缺失给定的输入键：

```php
$response->assertSessionMissingInput($key);
```

#### assertStatus

断言响应具有给定的 HTTP 状态码：

```php
$response->assertStatus($code);
```

#### assertSuccessful

断言响应具有 successful（>= 200 且 < 300）HTTP 状态码：

```php
$response->assertSuccessful();
```

#### assertTooManyRequests

断言响应具有 too many requests（429）HTTP 状态码：

```php
$response->assertTooManyRequests();
```

#### assertUnauthorized

断言响应具有 unauthorized（401）HTTP 状态码：

```php
$response->assertUnauthorized();
```

#### assertUnprocessable

断言响应具有 unprocessable entity（422）HTTP 状态码：

```php
$response->assertUnprocessable();
```

#### assertUnsupportedMediaType

断言响应具有 unsupported media type（415）HTTP 状态码：

```php
$response->assertUnsupportedMediaType();
```

#### assertValid

断言响应对于给定的键没有验证错误。该方法可用于断言以 JSON 结构返回验证错误、或将验证错误闪存到 session 的响应：

```php
// 断言不存在验证错误...
$response->assertValid();

// 断言给定的键不存在验证错误...
$response->assertValid(['name', 'email']);
```

#### assertInvalid

断言响应对于给定的键具有验证错误。该方法可用于断言以 JSON 结构返回验证错误、或将验证错误闪存到 session 的响应：

```php
$response->assertInvalid(['name', 'email']);
```

你还可以断言给定的键具有特定的验证错误消息。此时，你可以提供完整的消息，或仅提供消息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```

如果你想断言给定的字段是唯一存在验证错误的字段，可以使用 `assertOnlyInvalid` 方法：

```php
$response->assertOnlyInvalid(['name', 'email']);
```

#### assertViewHas

断言响应视图包含给定的数据片段：

```php
$response->assertViewHas($key, $value = null);
```

将闭包作为第二个参数传递给 `assertViewHas` 方法，可以让你检查并对特定的视图数据进行断言：

```php
$response->assertViewHas('user', function (User $user) {
    return $user->name === 'Taylor';
});
```

此外，视图数据可以像数组变量一样在响应上访问，方便你检查它：

```php tab=Pest
expect($response['name'])->toBe('Taylor');
```

```php tab=PHPUnit
$this->assertEquals('Taylor', $response['name']);
```

#### assertViewHasAll

断言响应视图具有给定的数据列表：

```php
$response->assertViewHasAll(array $data);
```

该方法可用于断言视图仅包含匹配给定键的数据：

```php
$response->assertViewHasAll([
    'name',
    'email',
]);
```

或者，你可以断言视图数据存在且具有特定的值：

```php
$response->assertViewHasAll([
    'name' => 'Taylor Otwell',
    'email' => 'taylor@example.com,',
]);
```

#### assertViewIs

断言给定的视图被路由返回：

```php
$response->assertViewIs($value);
```

#### assertViewMissing

断言给定的数据键没有被提供给应用响应中返回的视图：

```php
$response->assertViewMissing($key);
```

### 认证断言

Laravel 还提供了多种与认证相关的断言，你可以在应用的功能测试中使用。请注意，这些方法是在测试类本身上调用，而不是在 `get` 和 `post` 等方法返回的 `Illuminate\Testing\TestResponse` 实例上调用。

#### assertAuthenticated

断言用户已认证：

```php
$this->assertAuthenticated($guard = null);
```

#### assertGuest

断言用户未认证：

```php
$this->assertGuest($guard = null);
```

#### assertAuthenticatedAs

断言特定的用户已认证：

```php
$this->assertAuthenticatedAs($user, $guard = null);
```

## 验证断言

Laravel 提供了两个主要的与验证相关的断言，你可以使用它们来确保请求中提供的数据有效或无效。

#### assertValid

断言响应对于给定的键没有验证错误。该方法可用于断言以 JSON 结构返回验证错误、或将验证错误闪存到 session 的响应：

```php
// 断言不存在验证错误...
$response->assertValid();

// 断言给定的键不存在验证错误...
$response->assertValid(['name', 'email']);
```

#### assertInvalid

断言响应对于给定的键具有验证错误。该方法可用于断言以 JSON 结构返回验证错误、或将验证错误闪存到 session 的响应：

```php
$response->assertInvalid(['name', 'email']);
```

你还可以断言给定的键具有特定的验证错误消息。此时，你可以提供完整的消息，或仅提供消息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```