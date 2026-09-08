# Precognition

- [简介](#introduction)
- [实时验证](#live-validation)
    - [使用 Vue](#using-vue)
    - [使用 React](#using-react)
    - [使用 Alpine 和 Blade](#using-alpine)
    - [配置 Axios](#configuring-axios)
- [验证数组](#validating-arrays)
- [自定义验证规则](#customizing-validation-rules)
- [处理文件上传](#handling-file-uploads)
- [管理副作用](#managing-side-effects)
- [测试](#testing)

<a name="introduction"></a>
## 简介

Laravel Precognition 让你能够预知未来 HTTP 请求的结果。Precognition 的主要用例之一，是为前端 JavaScript 应用提供"实时"验证，而无需在前端重复编写应用的后端验证规则。

当 Laravel 收到一个"预知请求"（precognitive request）时，会执行该路由的所有中间件，并解析路由的控制器依赖，包括[表单请求](/docs/{{version}}/validation#form-request-validation)的验证——但不会真正执行路由的控制器方法。

> [!NOTE]
> 自 Inertia 2.3 起，Precognition 支持已内置。更多信息请查阅 [Inertia 表单文档](https://inertiajs.com/docs/v2/the-basics/forms)。较早的 Inertia 版本需要使用 Precognition 0.x。

<a name="live-validation"></a>
## 实时验证

<a name="using-vue"></a>
### 使用 Vue

借助 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 Vue 应用中重复编写验证规则。为了说明其工作原理，我们来构建一个在应用中创建新用户的表单。

首先，要为某个路由启用 Precognition，应在路由定义中添加 `HandlePrecognitiveRequests` 中间件。你还应创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)，用来承载该路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 为 Vue 安装 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-vue
```

安装好 Laravel Precognition 包后，你就可以使用 Precognition 的 `useForm` 函数创建表单对象，传入 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

然后，要启用实时验证，可以在每个输入框的 `change` 事件中调用表单的 `validate` 方法，并传入该输入框的名称：

```vue
<script setup>
import { useForm } from 'laravel-precognition-vue';

const form = useForm('post', '/users', {
    name: '',
    email: '',
});

const submit = () => form.submit();
</script>

<template>
    <form @submit.prevent="submit">
        <label for="name">Name</label>
        <input
            id="name"
            v-model="form.name"
            @change="form.validate('name')"
        />
        <div v-if="form.invalid('name')">
            {{ form.errors.name }}
        </div>

        <label for="email">Email</label>
        <input
            id="email"
            type="email"
            v-model="form.email"
            @change="form.validate('email')"
        />
        <div v-if="form.invalid('email')">
            {{ form.errors.email }}
        </div>

        <button :disabled="form.processing">
            Create User
        </button>
    </form>
</template>
```

现在，当用户填写表单时，Precognition 将依据路由表单请求中的验证规则，提供实时的验证输出。当表单输入发生变化时，一个经过防抖处理的"预知"验证请求会被发送到你的 Laravel 应用。你可以调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在处理中时，表单的 `validating` 属性将为 `true`：

```html
<div v-if="form.validating">
    Validating...
</div>
```

验证请求或表单提交期间返回的任何验证错误，都会自动填充到表单的 `errors` 对象中：

```html
<div v-if="form.invalid('email')">
    {{ form.errors.email }}
</div>
```

你可以通过表单的 `hasErrors` 属性来判断表单是否存在任何错误：

```html
<div v-if="form.hasErrors">
    <!-- ... -->
</div>
```

你也可以将输入框的名称分别传给表单的 `valid` 和 `invalid` 函数，来判断该输入是否通过验证：

```html
<span v-if="form.valid('email')">
    ✅
</span>

<span v-else-if="form.invalid('email')">
    ❌
</span>
```

> [!WARNING]
> 表单输入只有在发生变化并收到验证响应之后，才会显示为有效或无效。

如果你在使用 Precognition 验证表单的一部分输入，手动清除错误可能会很有用。你可以使用表单的 `forgetError` 函数来实现：

```html
<input
    id="avatar"
    type="file"
    @change="(e) => {
        form.avatar = e.target.files[0]

        form.forgetError('avatar')
    }"
>
```

如前所见，你可以挂钩输入框的 `change` 事件，在用户与输入框交互时逐个验证；不过，有时你可能还需要验证用户尚未交互过的输入框。这在构建"向导"（wizard）时很常见：进入下一步之前，你需要验证所有可见的输入，无论用户是否与它们交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，并将希望验证的字段名称传给 `only` 配置键。你可以通过 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```html
<button
    type="button"
    @click="form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })"
>Next Step</button>
```

当然，你也可以在表单提交的响应返回后执行代码。表单的 `submit` 函数返回一个 Axios 请求 Promise。这为访问响应数据、在提交成功后重置表单输入或处理失败的请求，提供了便捷的方式：

```js
const submit = () => form.submit()
    .then(response => {
        form.reset();

        alert('User created.');
    })
    .catch(error => {
        alert('An error occurred.');
    });
```

你可以通过检查表单的 `processing` 属性，来判断表单提交请求是否正在处理中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

<a name="using-react"></a>
### 使用 React

借助 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 React 应用中重复编写验证规则。为了说明其工作原理，我们来构建一个在应用中创建新用户的表单。

首先，要为某个路由启用 Precognition，应在路由定义中添加 `HandlePrecognitiveRequests` 中间件。你还应创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)，用来承载该路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 为 React 安装 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-react
```

安装好 Laravel Precognition 包后，你就可以使用 Precognition 的 `useForm` 函数创建表单对象，传入 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时验证，你应该监听每个输入框的 `change` 和 `blur` 事件。在 `change` 事件处理器中，应使用 `setData` 函数设置表单数据，传入输入框的名称和新值。然后，在 `blur` 事件处理器中调用表单的 `validate` 方法，传入该输入框的名称：

```jsx
import { useForm } from 'laravel-precognition-react';

export default function Form() {
    const form = useForm('post', '/users', {
        name: '',
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        form.submit();
    };

    return (
        <form onSubmit={submit}>
            <label htmlFor="name">Name</label>
            <input
                id="name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                onBlur={() => form.validate('name')}
            />
            {form.invalid('name') && <div>{form.errors.name}</div>}

            <label htmlFor="email">Email</label>
            <input
                id="email"
                value={form.data.email}
                onChange={(e) => form.setData('email', e.target.value)}
                onBlur={() => form.validate('email')}
            />
            {form.invalid('email') && <div>{form.errors.email}</div>}

            <button disabled={form.processing}>
                Create User
            </button>
        </form>
    );
};
```

现在，当用户填写表单时，Precognition 将依据路由表单请求中的验证规则，提供实时的验证输出。当表单输入发生变化时，一个经过防抖处理的"预知"验证请求会被发送到你的 Laravel 应用。你可以调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在处理中时，表单的 `validating` 属性将为 `true`：

```jsx
{form.validating && <div>Validating...</div>}
```

验证请求或表单提交期间返回的任何验证错误，都会自动填充到表单的 `errors` 对象中：

```jsx
{form.invalid('email') && <div>{form.errors.email}</div>}
```

你可以通过表单的 `hasErrors` 属性来判断表单是否存在任何错误：

```jsx
{form.hasErrors && <div><!-- ... --></div>}
```

你也可以将输入框的名称分别传给表单的 `valid` 和 `invalid` 函数，来判断该输入是否通过验证：

```jsx
{form.valid('email') && <span>✅</span>}

{form.invalid('email') && <span>❌</span>}
```

> [!WARNING]
> 表单输入只有在发生变化并收到验证响应之后，才会显示为有效或无效。

如果你在使用 Precognition 验证表单的一部分输入，手动清除错误可能会很有用。你可以使用表单的 `forgetError` 函数来实现：

```jsx
<input
    id="avatar"
    type="file"
    onChange={(e) => {
        form.setData('avatar', e.target.files[0]);

        form.forgetError('avatar');
    }}
>
```

如前所见，你可以挂钩输入框的 `blur` 事件，在用户与输入框交互时逐个验证；不过，有时你可能还需要验证用户尚未交互过的输入框。这在构建"向导"（wizard）时很常见：进入下一步之前，你需要验证所有可见的输入，无论用户是否与它们交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，并将希望验证的字段名称传给 `only` 配置键。你可以通过 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```jsx
<button
    type="button"
    onClick={() => form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })}
>Next Step</button>
```

当然，你也可以在表单提交的响应返回后执行代码。表单的 `submit` 函数返回一个 Axios 请求 Promise。这为访问响应数据、在提交成功后重置表单输入或处理失败的请求，提供了便捷的方式：

```js
const submit = (e) => {
    e.preventDefault();

    form.submit()
        .then(response => {
            form.reset();

            alert('User created.');
        })
        .catch(error => {
            alert('An error occurred.');
        });
};
```

你可以通过检查表单的 `processing` 属性，来判断表单提交请求是否正在处理中：

```html
<button disabled={form.processing}>
    Submit
</button>
```

<a name="using-alpine"></a>
### 使用 Alpine 和 Blade

借助 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 Alpine 应用中重复编写验证规则。为了说明其工作原理，我们来构建一个在应用中创建新用户的表单。

首先，要为某个路由启用 Precognition，应在路由定义中添加 `HandlePrecognitiveRequests` 中间件。你还应创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)，用来承载该路由的验证规则：

```php
use App\Http\Requests\CreateUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (CreateUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 为 Alpine 安装 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-alpine
```

然后，在 `resources/js/app.js` 文件中向 Alpine 注册 Precognition 插件：

```js
import Alpine from 'alpinejs';
import Precognition from 'laravel-precognition-alpine';

window.Alpine = Alpine;

Alpine.plugin(Precognition);
Alpine.start();
```

安装并注册好 Laravel Precognition 包后，你就可以使用 Precognition 的 `$form` "魔法"创建表单对象，传入 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时验证，你应该将表单数据绑定到相应的输入框，然后监听每个输入框的 `change` 事件。在 `change` 事件处理器中，调用表单的 `validate` 方法，并传入该输入框的名称：

```html
<form x-data="{
    form: $form('post', '/register', {
        name: '',
        email: '',
    }),
}">
    @csrf
    <label for="name">Name</label>
    <input
        id="name"
        name="name"
        x-model="form.name"
        @change="form.validate('name')"
    />
    <template x-if="form.invalid('name')">
        <div x-text="form.errors.name"></div>
    </template>

    <label for="email">Email</label>
    <input
        id="email"
        name="email"
        x-model="form.email"
        @change="form.validate('email')"
    />
    <template x-if="form.invalid('email')">
        <div x-text="form.errors.email"></div>
    </template>

    <button :disabled="form.processing">
        Create User
    </button>
</form>
```

现在，当用户填写表单时，Precognition 将依据路由表单请求中的验证规则，提供实时的验证输出。当表单输入发生变化时，一个经过防抖处理的"预知"验证请求会被发送到你的 Laravel 应用。你可以调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在处理中时，表单的 `validating` 属性将为 `true`：

```html
<template x-if="form.validating">
    <div>Validating...</div>
</template>
```

验证请求或表单提交期间返回的任何验证错误，都会自动填充到表单的 `errors` 对象中：

```html
<template x-if="form.invalid('email')">
    <div x-text="form.errors.email"></div>
</template>
```

你可以通过表单的 `hasErrors` 属性来判断表单是否存在任何错误：

```html
<template x-if="form.hasErrors">
    <div><!-- ... --></div>
</template>
```

你也可以将输入框的名称分别传给表单的 `valid` 和 `invalid` 函数，来判断该输入是否通过验证：

```html
<template x-if="form.valid('email')">
    <span>✅</span>
</template>

<template x-if="form.invalid('email')">
    <span>❌</span>
</template>
```

> [!WARNING]
> 表单输入只有在发生变化并收到验证响应之后，才会显示为有效或无效。

如前所见，你可以挂钩输入框的 `change` 事件，在用户与输入框交互时逐个验证；不过，有时你可能还需要验证用户尚未交互过的输入框。这在构建"向导"（wizard）时很常见：进入下一步之前，你需要验证所有可见的输入，无论用户是否与它们交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，并将希望验证的字段名称传给 `only` 配置键。你可以通过 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```html
<button
    type="button"
    @click="form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })"
>Next Step</button>
```

你可以通过检查表单的 `processing` 属性，来判断表单提交请求是否正在处理中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

<a name="repopulating-old-form-data"></a>
#### 回填旧的表单数据

在上面讨论的用户创建示例中，我们使用 Precognition 进行实时验证；但提交表单时执行的仍是传统的服务端表单提交。因此，表单应回填服务端表单提交返回的所有"旧"输入和验证错误：

```html
<form x-data="{
    form: $form('post', '/register', {
        name: '{{ old('name') }}',
        email: '{{ old('email') }}',
    }).setErrors({{ Js::from($errors->messages()) }}),
}">
```

或者，如果你想通过 XHR 提交表单，可以使用表单的 `submit` 函数，该函数返回一个 Axios 请求 Promise：

```html
<form
    x-data="{
        form: $form('post', '/register', {
            name: '',
            email: '',
        }),
        submit() {
            this.form.submit()
                .then(response => {
                    this.form.reset();

                    alert('User created.')
                })
                .catch(error => {
                    alert('An error occurred.');
                });
        },
    }"
    @submit.prevent="submit"
>
```

<a name="configuring-axios"></a>
### 配置 Axios

Precognition 验证库使用 [Axios](https://github.com/axios/axios) HTTP 客户端向应用的后端发送请求。为方便起见，如有需要，可以对 Axios 实例进行自定义。例如，在使用 `laravel-precognition-vue` 库时，你可以在应用的 `resources/js/app.js` 文件中为每个发出的请求添加额外的请求头：

```js
import { client } from 'laravel-precognition-vue';

client.axios().defaults.headers.common['Authorization'] = authToken;
```

或者，如果你的应用已经有一个配置好的 Axios 实例，你可以告诉 Precognition 改用该实例：

```js
import Axios from 'axios';
import { client } from 'laravel-precognition-vue';

window.axios = Axios.create()
window.axios.defaults.headers.common['Authorization'] = authToken;

client.use(window.axios)
```

<a name="validating-arrays"></a>
## 验证数组

你可以使用通配符来验证数组或嵌套对象中的字段。每个 `*` 匹配单个路径段：

```js
// 验证数组中所有用户的邮箱...
form.validate('users.*.email');

// 验证 profile 对象中的所有字段...
form.validate('profile.*');

// 验证所有用户的所有字段...
form.validate('users.*.*');
```

<a name="customizing-validation-rules"></a>
## 自定义验证规则

可以通过请求的 `isPrecognitive` 方法，自定义预知请求期间执行的验证规则。

例如，在用户创建表单上，我们可能只想在最终提交表单时才验证密码"未泄露"。对于预知验证请求，我们只验证密码必填且至少 8 个字符。使用 `isPrecognitive` 方法，可以自定义表单请求中定义的规则：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * 获取应用到该请求的验证规则。
     *
     * @return array
     */
    protected function rules()
    {
        return [
            'password' => [
                'required',
                $this->isPrecognitive()
                    ? Password::min(8)
                    : Password::min(8)->uncompromised(),
            ],
            // ...
        ];
    }
}
```

<a name="handling-file-uploads"></a>
## 处理文件上传

默认情况下，Laravel Precognition 在预知验证请求期间不会上传或验证文件。这样可以避免大文件被不必要地多次上传。

由于这一行为，你应确保应用[自定义相应表单请求的验证规则](#customizing-validation-rules)，指定该字段仅在完整表单提交时才必填：

```php
/**
 * 获取应用到该请求的验证规则。
 *
 * @return array
 */
protected function rules()
{
    return [
        'avatar' => [
            ...$this->isPrecognitive() ? [] : ['required'],
            'image',
            'mimes:jpg,png',
            'dimensions:ratio=3/2',
        ],
        // ...
    ];
}
```

如果你希望在每次验证请求中都包含文件，可以在客户端的表单实例上调用 `validateFiles` 函数：

```js
form.validateFiles();
```

<a name="managing-side-effects"></a>
## 管理副作用

在为路由添加 `HandlePrecognitiveRequests` 中间件时，你应考虑_其他_中间件中是否存在应在预知请求期间跳过的副作用。

例如，你可能有一个中间件用于累计每个用户与应用的"交互"总次数，但你可能不希望预知请求被计为一次交互。为此，我们可以在增加交互计数之前，先检查请求的 `isPrecognitive` 方法：

```php
<?php

namespace App\Http\Middleware;

use App\Facades\Interaction;
use Closure;
use Illuminate\Http\Request;

class InteractionMiddleware
{
    /**
     * 处理传入请求。
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if (! $request->isPrecognitive()) {
            Interaction::incrementFor($request->user());
        }

        return $next($request);
    }
}
```

<a name="testing"></a>
## 测试

如果你想在测试中发起预知请求，Laravel 的 `TestCase` 提供了 `withPrecognition` 辅助方法，它会添加 `Precognition` 请求头。

此外，如果你想断言预知请求成功（即没有返回任何验证错误），可以使用响应上的 `assertSuccessfulPrecognition` 方法：

```php tab=Pest
it('validates registration form with precognition', function () {
    $response = $this->withPrecognition()
        ->post('/register', [
            'name' => 'Taylor Otwell',
        ]);

    $response->assertSuccessfulPrecognition();

    expect(User::count())->toBe(0);
});
```

```php tab=PHPUnit
public function test_it_validates_registration_form_with_precognition()
{
    $response = $this->withPrecognition()
        ->post('/register', [
            'name' => 'Taylor Otwell',
        ]);

    $response->assertSuccessfulPrecognition();
    $this->assertSame(0, User::count());
}
```
