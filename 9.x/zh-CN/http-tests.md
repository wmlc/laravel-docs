# HTTP 测试

- [简介](#introduction)
- [发起请求](#making-requests)
    - [自定义请求头](#customizing-request-headers)
    - [Cookie](#cookies)
    - [Session / 认证](#session-and-authentication)
    - [调试响应](#debugging-responses)
    - [异常处理](#exception-handling)
- [测试 JSON API](#testing-json-apis)
    - [流畅 JSON 测试](#fluent-json-testing)
- [测试文件上传](#testing-file-uploads)
- [测试视图](#testing-views)
    - [渲染 Blade 与组件](#rendering-blade-and-components)
- [可用断言](#available-assertions)
    - [响应断言](#response-assertions)
    - [认证断言](#authentication-assertions)
    - [验证断言](#validation-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了非常流畅的 API 来向应用发起 HTTP 请求并检查响应。例如，看看下面定义的功能测试：

    <?php

    namespace Tests\Feature;

    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Illuminate\Foundation\Testing\WithoutMiddleware;
    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础测试示例。
         *
         * @return void
         */
        public function test_a_basic_request()
        {
            $response = $this->get('/');

            $response->assertStatus(200);
        }
    }

`get` 方法向应用发起一个 `GET` 请求，而 `assertStatus` 方法断言返回的响应应具有给定的 HTTP 状态码。除了这个简单的断言外，Laravel 还包含多种断言用于检查响应头、内容、JSON 结构等。

<a name="making-requests"></a>
## 发起请求

要向应用发起请求，你可以在测试中调用 `get`、`post`、`put`、`patch` 或 `delete` 方法。这些方法实际上不会向应用发起「真实」的 HTTP 请求。相反，整个网络请求在内部模拟。

测试请求方法不返回 `Illuminate\Http\Response` 实例，而是返回 `Illuminate\Testing\TestResponse` 实例，该实例提供了[多种有用的断言](#available-assertions)，允许你检查应用的响应：

    <?php

    namespace Tests\Feature;

    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Illuminate\Foundation\Testing\WithoutMiddleware;
    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础测试示例。
         *
         * @return void
         */
        public function test_a_basic_request()
        {
            $response = $this->get('/');

            $response->assertStatus(200);
        }
    }

通常，每个测试应仅向应用发起一个请求。如果在单个测试方法中执行多个请求，可能会出现意外行为。

> **Note**  
> 为方便起见，运行测试时 CSRF 中间件会自动禁用。

<a name="customizing-request-headers"></a>
### 自定义请求头

你可以使用 `withHeaders` 方法在请求发送到应用之前自定义请求头。此方法允许你向请求添加任何你想要的自定义头：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础功能测试示例。
         *
         * @return void
         */
        public function test_interacting_with_headers()
        {
            $response = $this->withHeaders([
                'X-Header' => 'Value',
            ])->post('/user', ['name' => 'Sally']);

            $response->assertStatus(201);
        }
    }

<a name="cookies"></a>
### Cookie

你可以使用 `withCookie` 或 `withCookies` 方法在发起请求之前设置 cookie 值。`withCookie` 方法接受 cookie 名称和值作为两个参数，而 `withCookies` 方法接受一个名称 / 值对数组：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        public function test_interacting_with_cookies()
        {
            $response = $this->withCookie('color', 'blue')->get('/');

            $response = $this->withCookies([
                'color' => 'blue',
                'name' => 'Taylor',
            ])->get('/');
        }
    }

<a name="session-and-authentication"></a>
### Session / 认证

Laravel 提供了多种辅助函数来在 HTTP 测试期间与 session 交互。首先，你可以使用 `withSession` 方法将 session 数据设置为给定数组。这在向应用发起请求之前用数据加载 session 时非常有用：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        public function test_interacting_with_the_session()
        {
            $response = $this->withSession(['banned' => false])->get('/');
        }
    }

Laravel 的 session 通常用于为当前已认证用户维护状态。因此，`actingAs` 辅助方法提供了一种简单的方式来将给定用户认证为当前用户。例如，我们可以使用[模型工厂](/docs/{{version}}/eloquent-factories)生成并认证一个用户：

    <?php

    namespace Tests\Feature;

    use App\Models\User;
    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        public function test_an_action_that_requires_authentication()
        {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                             ->withSession(['banned' => false])
                             ->get('/');
        }
    }

你也可以通过将守卫名称作为第二个参数传递给 `actingAs` 方法来指定用于认证给定用户的守卫。提供给 `actingAs` 方法的守卫也将成为测试期间的默认守卫：

    $this->actingAs($user, 'web')

<a name="debugging-responses"></a>
### 调试响应

向应用发起测试请求后，可以使用 `dump`、`dumpHeaders` 和 `dumpSession` 方法检查和调试响应内容：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础测试示例。
         *
         * @return void
         */
        public function test_basic_test()
        {
            $response = $this->get('/');

            $response->dumpHeaders();

            $response->dumpSession();

            $response->dump();
        }
    }

或者，你可以使用 `dd`、`ddHeaders` 和 `ddSession` 方法输出有关响应的信息然后停止执行：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础测试示例。
         *
         * @return void
         */
        public function test_basic_test()
        {
            $response = $this->get('/');

            $response->ddHeaders();

            $response->ddSession();

            $response->dd();
        }
    }

<a name="exception-handling"></a>
### 异常处理

有时你可能想测试应用是否抛出了特定异常。为确保异常不会被 Laravel 的异常处理器捕获并作为 HTTP 响应返回，你可以在发起请求之前调用 `withoutExceptionHandling` 方法：

    $response = $this->withoutExceptionHandling()->get('/');

此外，如果你想确保应用没有使用 PHP 语言或应用所使用的库已弃用的功能，可以在发起请求之前调用 `withoutDeprecationHandling` 方法。禁用弃用处理后，弃用警告将转换为异常，从而导致测试失败：

    $response = $this->withoutDeprecationHandling()->get('/');

<a name="testing-json-apis"></a>
## 测试 JSON API

Laravel 还提供了多种辅助函数来测试 JSON API 及其响应。例如，`json`、`getJson`、`postJson`、`putJson`、`patchJson`、`deleteJson` 和 `optionsJson` 方法可用于发起具有各种 HTTP 动词的 JSON 请求。你还可以轻松地向这些方法传递数据和头。首先，让我们编写一个测试，向 `/api/user` 发起 `POST` 请求并断言返回了预期的 JSON 数据：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础功能测试示例。
         *
         * @return void
         */
        public function test_making_an_api_request()
        {
            $response = $this->postJson('/api/user', ['name' => 'Sally']);

            $response
                ->assertStatus(201)
                ->assertJson([
                    'created' => true,
                ]);
        }
    }

此外，JSON 响应数据可以作为响应上的数组变量访问，方便你检查 JSON 响应中返回的各个值：

    $this->assertTrue($response['created']);

> **Note**  
> `assertJson` 方法将响应转换为数组，并利用 `PHPUnit::assertArraySubset` 验证给定数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定的片段存在，此测试仍会通过。

<a name="verifying-exact-match"></a>
#### 断言精确 JSON 匹配

如前所述，`assertJson` 方法可用于断言 JSON 片段存在于 JSON 响应中。如果你想验证给定数组与应用返回的 JSON **精确匹配**，应使用 `assertExactJson` 方法：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础功能测试示例。
         *
         * @return void
         */
        public function test_asserting_an_exact_json_match()
        {
            $response = $this->postJson('/user', ['name' => 'Sally']);

            $response
                ->assertStatus(201)
                ->assertExactJson([
                    'created' => true,
                ]);
        }
    }

<a name="verifying-json-paths"></a>
#### 断言 JSON 路径

如果你想验证 JSON 响应在指定路径包含给定数据，应使用 `assertJsonPath` 方法：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        /**
         * 一个基础功能测试示例。
         *
         * @return void
         */
        public function test_asserting_a_json_paths_value()
        {
            $response = $this->postJson('/user', ['name' => 'Sally']);

            $response
                ->assertStatus(201)
                ->assertJsonPath('team.owner.name', 'Darian');
        }
    }

`assertJsonPath` 方法还接受一个闭包，可用于动态判断断言是否应通过：

    $response->assertJsonPath('team.owner.name', fn ($name) => strlen($name) >= 3);

<a name="fluent-json-testing"></a>
### 流畅 JSON 测试

Laravel 还提供了一种优雅的方式来流畅地测试应用的 JSON 响应。首先，将一个闭包传递给 `assertJson` 方法。此闭包将接收一个 `Illuminate\Testing\Fluent\AssertableJson` 实例，可用于对应用返回的 JSON 进行断言。`where` 方法可用于对 JSON 的特定属性进行断言，而 `missing` 方法可用于断言 JSON 中缺少特定属性：

    use Illuminate\Testing\Fluent\AssertableJson;

    /**
     * 一个基础功能测试示例。
     *
     * @return void
     */
    public function test_fluent_json()
    {
        $response = $this->getJson('/users/1');

        $response
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('id', 1)
                     ->where('name', 'Victoria Faith')
                     ->where('email', fn ($email) => str($email)->is('victoria@gmail.com'))
                     ->whereNot('status', 'pending')
                     ->missing('password')
                     ->etc()
            );
    }

#### 理解 `etc` 方法

在上面的示例中，你可能注意到我们在断言链的末尾调用了 `etc` 方法。此方法告知 Laravel JSON 对象上可能存在其他属性。如果未使用 `etc` 方法，当你未对其进行断言的其他属性存在于 JSON 对象上时，测试将失败。

此行为背后的意图是通过强制你显式对属性进行断言或通过 `etc` 方法显式允许额外属性，来保护你不会无意中在 JSON 响应中暴露敏感信息。

但是，你应注意，在断言链中不包含 `etc` 方法并不能确保不会向 JSON 对象中嵌套的数组添加额外属性。`etc` 方法仅确保在调用 `etc` 方法的嵌套级别不存在额外属性。

<a name="asserting-json-attribute-presence-and-absence"></a>
#### 断言属性存在 / 缺失

要断言属性存在或缺失，可以使用 `has` 和 `missing` 方法：

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
#### 针对 JSON 集合断言

通常，你的路由会返回包含多个项目的 JSON 响应，例如多个用户：

    Route::get('/users', function () {
        return User::all();
    });

在这些情况下，我们可以使用流畅 JSON 对象的 `has` 方法对响应中包含的用户进行断言。例如，让我们断言 JSON 响应包含三个用户。接下来，我们将使用 `first` 方法对集合中的第一个用户进行一些断言。`first` 方法接受一个闭包，该闭包接收另一个可断言 JSON 字符串，我们可以用它对 JSON 集合中的第一个对象进行断言：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has(3)
                 ->first(fn ($json) =>
                    $json->where('id', 1)
                         ->where('name', 'Victoria Faith')
                         ->where('email', fn ($email) => str($email)->is('victoria@gmail.com'))
                         ->missing('password')
                         ->etc()
                 )
        );

<a name="scoping-json-collection-assertions"></a>
#### 作用域 JSON 集合断言

有时，应用的路由会返回分配了命名键的 JSON 集合：

    Route::get('/users', function () {
        return [
            'meta' => [...],
            'users' => User::all(),
        ];
    })

测试这些路由时，可以使用 `has` 方法对集合中的项目数量进行断言。此外，可以使用 `has` 方法作用域一系列断言：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('meta')
                 ->has('users', 3)
                 ->has('users.0', fn ($json) =>
                    $json->where('id', 1)
                         ->where('name', 'Victoria Faith')
                         ->where('email', fn ($email) => str($email)->is('victoria@gmail.com'))
                         ->missing('password')
                         ->etc()
                 )
        );

但是，你可以不用对 `has` 方法进行两次单独调用来对 `users` 集合进行断言，而是进行一次调用并将闭包作为第三个参数。这样做时，闭包将自动调用并作用域到集合中的第一个项目：

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('meta')
                 ->has('users', 3, fn ($json) =>
                    $json->where('id', 1)
                         ->where('name', 'Victoria Faith')
                         ->where('email', fn ($email) => str($email)->is('victoria@gmail.com'))
                         ->missing('password')
                         ->etc()
                 )
        );

<a name="asserting-json-types"></a>
#### 断言 JSON 类型

你可能只想断言 JSON 响应中的属性属于某种类型。`Illuminate\Testing\Fluent\AssertableJson` 类提供了 `whereType` 和 `whereAllType` 方法来实现：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->whereType('id', 'integer')
             ->whereAllType([
                'users.0.name' => 'string',
                'meta' => 'array'
            ])
    );

你可以使用 `|` 字符指定多种类型，或将类型数组作为 `whereType` 方法的第二个参数传递。如果响应值是列出的任何类型之一，断言将成功：

    $response->assertJson(fn (AssertableJson $json) =>
        $json->whereType('name', 'string|null')
             ->whereType('id', ['string', 'integer'])
    );

`whereType` 和 `whereAllType` 方法识别以下类型：`string`、`integer`、`double`、`boolean`、`array` 和 `null`。

<a name="testing-file-uploads"></a>
## 测试文件上传

`Illuminate\Http\UploadedFile` 类提供了一个 `fake` 方法，可用于生成用于测试的虚拟文件或图像。这与 `Storage` Facade 的 `fake` 方法结合使用，大大简化了文件上传的测试。例如，你可以结合这两个功能轻松测试头像上传表单：

    <?php

    namespace Tests\Feature;

    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Illuminate\Foundation\Testing\WithoutMiddleware;
    use Illuminate\Http\UploadedFile;
    use Illuminate\Support\Facades\Storage;
    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        public function test_avatars_can_be_uploaded()
        {
            Storage::fake('avatars');

            $file = UploadedFile::fake()->image('avatar.jpg');

            $response = $this->post('/avatar', [
                'avatar' => $file,
            ]);

            Storage::disk('avatars')->assertExists($file->hashName());
        }
    }

如果你想断言给定文件不存在，可以使用 `Storage` Facade 提供的 `assertMissing` 方法：

    Storage::fake('avatars');

    // ...

    Storage::disk('avatars')->assertMissing('missing.jpg');

<a name="fake-file-customization"></a>
#### 虚拟文件自定义

使用 `UploadedFile` 类提供的 `fake` 方法创建文件时，你可以指定图像的宽度、高度和大小（以千字节为单位），以便更好地测试应用的验证规则：

    UploadedFile::fake()->image('avatar.jpg', $width, $height)->size(100);

除了创建图像外，你还可以使用 `create` 方法创建任何其他类型的文件：

    UploadedFile::fake()->create('document.pdf', $sizeInKilobytes);

如果需要，你可以向方法传递 `$mimeType` 参数来显式定义文件应返回的 MIME 类型：

    UploadedFile::fake()->create(
        'document.pdf', $sizeInKilobytes, 'application/pdf'
    );

<a name="testing-views"></a>
## 测试视图

Laravel 还允许你在不向应用发起模拟 HTTP 请求的情况下渲染视图。为此，你可以在测试中调用 `view` 方法。`view` 方法接受视图名称和可选的数据数组。该方法返回 `Illuminate\Testing\TestView` 实例，该实例提供了多种方法来方便地对视图内容进行断言：

    <?php

    namespace Tests\Feature;

    use Tests\TestCase;

    class ExampleTest extends TestCase
    {
        public function test_a_welcome_view_can_be_rendered()
        {
            $view = $this->view('welcome', ['name' => 'Taylor']);

            $view->assertSee('Taylor');
        }
    }

`TestView` 类提供以下断言方法：`assertSee`、`assertSeeInOrder`、`assertSeeText`、`assertSeeTextInOrder`、`assertDontSee` 和 `assertDontSeeText`。

如果需要，你可以通过将 `TestView` 实例转换为字符串来获取原始的渲染视图内容：

    $contents = (string) $this->view('welcome');

<a name="sharing-errors"></a>
#### 共享错误

某些视图可能依赖于 [Laravel 提供的全局错误包](/docs/{{version}}/validation#quick-displaying-the-validation-errors)中共享的错误。要使用错误消息填充错误包，可以使用 `withViewErrors` 方法：

    $view = $this->withViewErrors([
        'name' => ['Please provide a valid name.']
    ])->view('form');

    $view->assertSee('Please provide a valid name.');

<a name="rendering-blade-and-components"></a>
### 渲染 Blade 与组件

如有必要，你可以使用 `blade` 方法评估和渲染原始 [Blade](/docs/{{version}}/blade) 字符串。与 `view` 方法类似，`blade` 方法返回 `Illuminate\Testing\TestView` 实例：

    $view = $this->blade(
        '<x-component :name="$name" />',
        ['name' => 'Taylor']
    );

    $view->assertSee('Taylor');

你可以使用 `component` 方法评估和渲染 [Blade 组件](/docs/{{version}}/blade#components)。`component` 方法返回 `Illuminate\Testing\TestComponent` 实例：

    $view = $this->component(Profile::class, ['name' => 'Taylor']);

    $view->assertSee('Taylor');

<a name="available-assertions"></a>
## 可用断言

<a name="response-assertions"></a>
### 响应断言

Laravel 的 `Illuminate\Testing\TestResponse` 类提供了多种自定义断言方法，你可以在测试应用时使用。这些断言可在 `json`、`get`、`post`、`put` 和 `delete` 测试方法返回的响应上访问：

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

[assertCookie](#assert-cookie)
[assertCookieExpired](#assert-cookie-expired)
[assertCookieNotExpired](#assert-cookie-not-expired)
[assertCookieMissing](#assert-cookie-missing)
[assertCreated](#assert-created)
[assertDontSee](#assert-dont-see)
[assertDontSeeText](#assert-dont-see-text)
[assertDownload](#assert-download)
[assertExactJson](#assert-exact-json)
[assertForbidden](#assert-forbidden)
[assertHeader](#assert-header)
[assertHeaderMissing](#assert-header-missing)
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
[assertContent](#assert-content)
[assertNoContent](#assert-no-content)
[assertStreamedContent](#assert-streamed-content)
[assertNotFound](#assert-not-found)
[assertOk](#assert-ok)
[assertPlainCookie](#assert-plain-cookie)
[assertRedirect](#assert-redirect)
[assertRedirectContains](#assert-redirect-contains)
[assertRedirectToRoute](#assert-redirect-to-route)
[assertRedirectToSignedRoute](#assert-redirect-to-signed-route)
[assertSee](#assert-see)
[assertSeeInOrder](#assert-see-in-order)
[assertSeeText](#assert-see-text)
[assertSeeTextInOrder](#assert-see-text-in-order)
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
[assertUnauthorized](#assert-unauthorized)
[assertUnprocessable](#assert-unprocessable)
[assertValid](#assert-valid)
[assertInvalid](#assert-invalid)
[assertViewHas](#assert-view-has)
[assertViewHasAll](#assert-view-has-all)
[assertViewIs](#assert-view-is)
[assertViewMissing](#assert-view-missing)

<a name="assert-cookie"></a>
#### assertCookie

断言响应包含给定的 cookie：

    $response->assertCookie($cookieName, $value = null);

<a name="assert-cookie-expired"></a>
#### assertCookieExpired

断言响应包含给定的 cookie 且已过期：

    $response->assertCookieExpired($cookieName);

<a name="assert-cookie-not-expired"></a>
#### assertCookieNotExpired

断言响应包含给定的 cookie 且未过期：

    $response->assertCookieNotExpired($cookieName);

<a name="assert-cookie-missing"></a>
#### assertCookieMissing

断言响应不包含给定的 cookie：

    $response->assertCookieMissing($cookieName);

<a name="assert-created"></a>
#### assertCreated

断言响应具有 201 HTTP 状态码：

    $response->assertCreated();

<a name="assert-dont-see"></a>
#### assertDontSee

断言给定字符串不包含在应用返回的响应中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串：

    $response->assertDontSee($value, $escaped = true);

<a name="assert-dont-see-text"></a>
#### assertDontSeeText

断言给定字符串不包含在响应文本中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串。此方法会在进行断言之前将响应内容传递给 `strip_tags` PHP 函数：

    $response->assertDontSeeText($value, $escaped = true);

<a name="assert-download"></a>
#### assertDownload

断言响应是一个「下载」。通常，这意味着调用返回响应的路由返回了 `Response::download` 响应、`BinaryFileResponse` 或 `Storage::download` 响应：

    $response->assertDownload();

如果你愿意，可以断言可下载文件被分配了给定的文件名：

    $response->assertDownload('image.jpg');

<a name="assert-exact-json"></a>
#### assertExactJson

断言响应包含与给定 JSON 数据的精确匹配：

    $response->assertExactJson(array $data);

<a name="assert-forbidden"></a>
#### assertForbidden

断言响应具有禁止访问（403）HTTP 状态码：

    $response->assertForbidden();

<a name="assert-header"></a>
#### assertHeader

断言响应上存在给定的头和值：

    $response->assertHeader($headerName, $value = null);

<a name="assert-header-missing"></a>
#### assertHeaderMissing

断言响应上不存在给定的头：

    $response->assertHeaderMissing($headerName);

<a name="assert-json"></a>
#### assertJson

断言响应包含给定的 JSON 数据：

    $response->assertJson(array $data, $strict = false);

`assertJson` 方法将响应转换为数组，并利用 `PHPUnit::assertArraySubset` 验证给定数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定的片段存在，此测试仍会通过。

<a name="assert-json-count"></a>
#### assertJsonCount

断言响应 JSON 在给定键处具有预期项目数量的数组：

    $response->assertJsonCount($count, $key = null);

<a name="assert-json-fragment"></a>
#### assertJsonFragment

断言响应在响应中的任何位置包含给定的 JSON 数据：

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

断言响应不包含精确的 JSON 数据：

    $response->assertJsonMissingExact(array $data);

<a name="assert-json-missing-validation-errors"></a>
#### assertJsonMissingValidationErrors

断言响应对于给定键没有 JSON 验证错误：

    $response->assertJsonMissingValidationErrors($keys);

> **Note**  
> 可以使用更通用的 [assertValid](#assert-valid) 方法来断言响应没有作为 JSON 返回的验证错误，**并且**没有错误闪存到 session 存储。

<a name="assert-json-path"></a>
#### assertJsonPath

断言响应在指定路径包含给定数据：

    $response->assertJsonPath($path, $expectedValue);

例如，如果应用返回以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言 `user` 对象的 `name` 属性匹配给定值：

    $response->assertJsonPath('user.name', 'Steve Schoger');

<a name="assert-json-missing-path"></a>
#### assertJsonMissingPath

断言响应不包含给定路径：

    $response->assertJsonMissingPath($path);

例如，如果应用返回以下 JSON 响应：

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

例如，如果应用返回的 JSON 响应包含以下数据：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言 JSON 结构符合你的预期：

    $response->assertJsonStructure([
        'user' => [
            'name',
        ]
    ]);

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

断言响应对于给定键具有给定的 JSON 验证错误。当对验证错误作为 JSON 结构返回而不是闪存到 session 的响应进行断言时，应使用此方法：

    $response->assertJsonValidationErrors(array $data, $responseKey = 'errors');

> **Note**  
> 可以使用更通用的 [assertInvalid](#assert-invalid) 方法来断言响应具有作为 JSON 返回的验证错误，**或者**错误已闪存到 session 存储。

<a name="assert-json-validation-error-for"></a>
#### assertJsonValidationErrorFor

断言响应对于给定键具有任何 JSON 验证错误：

    $response->assertJsonValidationErrorFor(string $key, $responseKey = 'errors');

<a name="assert-location"></a>
#### assertLocation

断言响应在 `Location` 头中具有给定的 URI 值：

    $response->assertLocation($uri);
    
<a name="assert-content"></a>
#### assertContent

断言给定字符串匹配响应内容：

    $response->assertContent($value);

<a name="assert-no-content"></a>
#### assertNoContent

断言响应具有给定的 HTTP 状态码且无内容：

    $response->assertNoContent($status = 204);

<a name="assert-streamed-content"></a>
#### assertStreamedContent

断言给定字符串匹配流式响应内容：

    $response->assertStreamedContent($value);

<a name="assert-not-found"></a>
#### assertNotFound

断言响应具有未找到（404）HTTP 状态码：

    $response->assertNotFound();

<a name="assert-ok"></a>
#### assertOk

断言响应具有 200 HTTP 状态码：

    $response->assertOk();

<a name="assert-plain-cookie"></a>
#### assertPlainCookie

断言响应包含给定的未加密 cookie：

    $response->assertPlainCookie($cookieName, $value = null);

<a name="assert-redirect"></a>
#### assertRedirect

断言响应是重定向到给定 URI：

    $response->assertRedirect($uri);

<a name="assert-redirect-contains"></a>
#### assertRedirectContains

断言响应是否重定向到包含给定字符串的 URI：

    $response->assertRedirectContains($string);

<a name="assert-redirect-to-route"></a>
#### assertRedirectToRoute

断言响应是重定向到给定的[命名路由](/docs/{{version}}/routing#named-routes)：

    $response->assertRedirectToRoute($name = null, $parameters = []);

<a name="assert-redirect-to-signed-route"></a>
#### assertRedirectToSignedRoute

断言响应是重定向到给定的[签名路由](/docs/{{version}}/urls#signed-urls)：

    $response->assertRedirectToSignedRoute($name = null, $parameters = []);

<a name="assert-see"></a>
#### assertSee

断言给定字符串包含在响应中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串：

    $response->assertSee($value, $escaped = true);

<a name="assert-see-in-order"></a>
#### assertSeeInOrder

断言给定字符串按顺序包含在响应中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串：

    $response->assertSeeInOrder(array $values, $escaped = true);

<a name="assert-see-text"></a>
#### assertSeeText

断言给定字符串包含在响应文本中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串。在进行断言之前，响应内容将传递给 `strip_tags` PHP 函数：

    $response->assertSeeText($value, $escaped = true);

<a name="assert-see-text-in-order"></a>
#### assertSeeTextInOrder

断言给定字符串按顺序包含在响应文本中。除非你传递第二个参数 `false`，此断言会自动转义给定字符串。在进行断言之前，响应内容将传递给 `strip_tags` PHP 函数：

    $response->assertSeeTextInOrder(array $values, $escaped = true);

<a name="assert-session-has"></a>
#### assertSessionHas

断言 session 包含给定的数据：

    $response->assertSessionHas($key, $value = null);

如果需要，可以将闭包作为 `assertSessionHas` 方法的第二个参数提供。如果闭包返回 `true`，断言将通过：

    $response->assertSessionHas($key, function ($value) {
        return $value->name === 'Taylor Otwell';
    });

<a name="assert-session-has-input"></a>
#### assertSessionHasInput

断言 session 在[闪存输入数组](/docs/{{version}}/responses#redirecting-with-flashed-session-data)中具有给定值：

    $response->assertSessionHasInput($key, $value = null);

如果需要，可以将闭包作为 `assertSessionHasInput` 方法的第二个参数提供。如果闭包返回 `true`，断言将通过：

    $response->assertSessionHasInput($key, function ($value) {
        return Crypt::decryptString($value) === 'secret';
    });

<a name="assert-session-has-all"></a>
#### assertSessionHasAll

断言 session 包含给定的键 / 值对数组：

    $response->assertSessionHasAll(array $data);

例如，如果应用的 session 包含 `name` 和 `status` 键，你可以断言两者都存在并具有指定值：

    $response->assertSessionHasAll([
        'name' => 'Taylor Otwell',
        'status' => 'active',
    ]);

<a name="assert-session-has-errors"></a>
#### assertSessionHasErrors

断言 session 对于给定 `$keys` 包含错误。如果 `$keys` 是关联数组，断言 session 对于每个字段（键）包含特定错误消息（值）。当测试将验证错误闪存到 session 而不是作为 JSON 结构返回的路由时，应使用此方法：

    $response->assertSessionHasErrors(
        array $keys, $format = null, $errorBag = 'default'
    );

例如，要断言 `name` 和 `email` 字段具有闪存到 session 的验证错误消息，可以这样调用 `assertSessionHasErrors` 方法：

    $response->assertSessionHasErrors(['name', 'email']);

或者，你可以断言给定字段具有特定的验证错误消息：

    $response->assertSessionHasErrors([
        'name' => 'The given name was invalid.'
    ]);

> **Note**  
> 可以使用更通用的 [assertInvalid](#assert-invalid) 方法来断言响应具有作为 JSON 返回的验证错误，**或者**错误已闪存到 session 存储。

<a name="assert-session-has-errors-in"></a>
#### assertSessionHasErrorsIn

断言 session 在特定[错误包](/docs/{{version}}/validation#named-error-bags)中对于给定 `$keys` 包含错误。如果 `$keys` 是关联数组，断言 session 在错误包中对于每个字段（键）包含特定错误消息（值）：

    $response->assertSessionHasErrorsIn($errorBag, $keys = [], $format = null);

<a name="assert-session-has-no-errors"></a>
#### assertSessionHasNoErrors

断言 session 没有验证错误：

    $response->assertSessionHasNoErrors();

<a name="assert-session-doesnt-have-errors"></a>
#### assertSessionDoesntHaveErrors

断言 session 对于给定键没有验证错误：

    $response->assertSessionDoesntHaveErrors($keys = [], $format = null, $errorBag = 'default');

> **Note**  
> 可以使用更通用的 [assertValid](#assert-valid) 方法来断言响应没有作为 JSON 返回的验证错误，**并且**没有错误闪存到 session 存储。

<a name="assert-session-missing"></a>
#### assertSessionMissing

断言 session 不包含给定键：

    $response->assertSessionMissing($key);

<a name="assert-status"></a>
#### assertStatus

断言响应具有给定的 HTTP 状态码：

    $response->assertStatus($code);

<a name="assert-successful"></a>
#### assertSuccessful

断言响应具有成功（>= 200 且 < 300）HTTP 状态码：

    $response->assertSuccessful();

<a name="assert-unauthorized"></a>
#### assertUnauthorized

断言响应具有未授权（401）HTTP 状态码：

    $response->assertUnauthorized();

<a name="assert-unprocessable"></a>
#### assertUnprocessable

断言响应具有无法处理实体（422）HTTP 状态码：

    $response->assertUnprocessable();

<a name="assert-valid"></a>
#### assertValid

断言响应对于给定键没有验证错误。此方法可用于对验证错误作为 JSON 结构返回或验证错误已闪存到 session 的响应进行断言：

    // 断言不存在验证错误...
    $response->assertValid();

    // 断言给定键没有验证错误...
    $response->assertValid(['name', 'email']);

<a name="assert-invalid"></a>
#### assertInvalid

断言响应对于给定键具有验证错误。此方法可用于对验证错误作为 JSON 结构返回或验证错误已闪存到 session 的响应进行断言：

    $response->assertInvalid(['name', 'email']);

你还可以断言给定键具有特定的验证错误消息。这样做时，你可以提供整个消息或仅消息的一小部分：

    $response->assertInvalid([
        'name' => 'The name field is required.',
        'email' => 'valid email address',
    ]);

<a name="assert-view-has"></a>
#### assertViewHas

断言响应视图包含给定的数据：

    $response->assertViewHas($key, $value = null);

将闭包作为第二个参数传递给 `assertViewHas` 方法将允许你检查并对特定视图数据进行断言：

    $response->assertViewHas('user', function (User $user) {
        return $user->name === 'Taylor';
    });

此外，视图数据可以作为响应上的数组变量访问，方便你检查：

    $this->assertEquals('Taylor', $response['name']);

<a name="assert-view-has-all"></a>
#### assertViewHasAll

断言响应视图具有给定的数据列表：

    $response->assertViewHasAll(array $data);

此方法可用于断言视图仅包含匹配给定键的数据：

    $response->assertViewHasAll([
        'name',
        'email',
    ]);

或者，你可以断言视图数据存在并具有特定值：

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

断言给定数据键未提供给应用响应中返回的视图：

    $response->assertViewMissing($key);

<a name="authentication-assertions"></a>
### 认证断言

Laravel 还提供了多种与认证相关的断言，你可以在应用的功能测试中使用。请注意，这些方法在测试类本身上调用，而不是在 `get` 和 `post` 等方法返回的 `Illuminate\Testing\TestResponse` 实例上调用。

<a name="assert-authenticated"></a>
#### assertAuthenticated

断言用户已认证：

    $this->assertAuthenticated($guard = null);

<a name="assert-guest"></a>
#### assertGuest

断言用户未认证：

    $this->assertGuest($guard = null);

<a name="assert-authenticated-as"></a>
#### assertAuthenticatedAs

断言特定用户已认证：

    $this->assertAuthenticatedAs($user, $guard = null);

<a name="validation-assertions"></a>
## 验证断言

Laravel 提供了两个主要的验证相关断言，可用于确保请求中提供的数据有效或无效。

<a name="validation-assert-valid"></a>
#### assertValid

断言响应对于给定键没有验证错误。此方法可用于对验证错误作为 JSON 结构返回或验证错误已闪存到 session 的响应进行断言：

    // 断言不存在验证错误...
    $response->assertValid();

    // 断言给定键没有验证错误...
    $response->assertValid(['name', 'email']);

<a name="validation-assert-invalid"></a>
#### assertInvalid

断言响应对于给定键具有验证错误。此方法可用于对验证错误作为 JSON 结构返回或验证错误已闪存到 session 的响应进行断言：

    $response->assertInvalid(['name', 'email']);

你还可以断言给定键具有特定的验证错误消息。这样做时，你可以提供整个消息或仅消息的一小部分：

    $response->assertInvalid([
        'name' => 'The name field is required.',
        'email' => 'valid email address',
    ]);
