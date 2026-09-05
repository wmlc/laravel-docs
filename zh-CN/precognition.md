# Precognition

## 介绍

Laravel Precognition 允许你预测未来 HTTP 请求的结果。Precognition 的主要用例之一是：无需在前端 JavaScript 应用中重复后端的校验规则，即可为前端提供"实时"校验能力。

当 Laravel 收到"预知请求（precognitive request）"时，它会执行该路由的所有中间件，并解析路由控制器所需的依赖，包括对 [表单请求类（Form Request）](/docs/{{version}}/validation#form-request-validation)的校验——但它不会真正执行控制器方法。

> [!NOTE]
> 自 Inertia 2.3 起，原生支持 Precognition。详见 [Inertia Forms 文档](https://inertiajs.com/forms)。更早的 Inertia 版本需要 Precognition 0.x。

## 实时校验

### 使用 Vue

借助 Laravel Precognition，你可以在前端 Vue 应用中提供实时校验体验，而无需在前端重复校验规则。为了演示它的工作方式，我们来构建一个创建新用户的表单。

首先，要为某条路由启用 Precognition，需要把 `HandlePrecognitiveRequests` 中间件添加到路由定义里。你还应该创建一个 [表单请求类（Form Request）](/docs/{{version}}/validation#form-request-validation) 来承载该路由的校验规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，通过 NPM 安装适用于 Vue 的 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-vue
```

安装 Laravel Precognition 包后，你就可以使用 Precognition 的 `useForm` 函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时校验，请在每个输入框的 `change` 事件里调用表单对象的 `validate` 方法，并传入输入框的名字：

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

现在，随着用户填写表单，Precognition 将基于该路由表单请求类中的校验规则给出实时校验结果。当输入值变更时，会向 Laravel 应用发起一次做了防抖的"预知"校验请求。你可以通过调用表单的 `setValidationTimeout` 函数配置防抖时长：

```js
form.setValidationTimeout(3000);
```

当一次校验请求在途中时，表单的 `validating` 属性将为 `true`：

```html
<div v-if="form.validating">
    Validating...
</div>
```

在校验请求或表单提交过程中返回的任何校验错误都会自动写入表单的 `errors` 对象：

```html
<div v-if="form.invalid('email')">
    {{ form.errors.email }}
</div>
```

你也可以通过表单的 `hasErrors` 属性判断表单整体是否出错：

```html
<div v-if="form.hasErrors">
    <!-- ... -->
</div>
```

你也可以把输入框的名字传给表单的 `valid` 和 `invalid` 函数，分别判断单个输入是否通过校验或未通过校验：

```html
<span v-if="form.valid('email')">
    ✅
</span>

<span v-else-if="form.invalid('email')">
    ❌
</span>
```

> [!WARNING]
> 只有当输入框的值发生过变化并收到了校验响应之后，它才会显示为通过或未通过。

如果你正在用 Precognition 校验表单里的一部分字段，手动清除错误常常很有用。可以调用表单的 `forgetError` 函数来实现：

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

从前面的例子可以看到，你可以挂接输入框的 `change` 事件，对用户已经交互过的字段进行实时校验；但有时你会需要校验用户还没交互过的字段。这在实现"向导式"表单时很常见——无论用户是否已经交互，下一步之前都需要把可见输入框全部校验一遍。

要实现这一点，可以调用 `validate` 方法，把要校验的字段名传给 `only` 配置项，并通过 `onSuccess` 与 `onValidationError` 回调处理校验结果：

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

当然，你也可以基于表单提交的响应执行后续逻辑。表单的 `submit` 函数返回一个 Axios 请求 Promise，这样可以方便地拿到响应负载、在提交成功后重置表单输入，或者处理失败请求：

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

你可以通过检查表单的 `processing` 属性，判断表单提交请求是否还在进行中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

### 使用 React

借助 Laravel Precognition，你可以在前端 React 应用中提供实时校验体验，而无需在前端重复校验规则。为了演示它的工作方式，我们来构建一个创建新用户的表单。

首先，要为某条路由启用 Precognition，需要把 `HandlePrecognitiveRequests` 中间件添加到路由定义里。你还应该创建一个 [表单请求类（Form Request）](/docs/{{version}}/validation#form-request-validation) 来承载该路由的校验规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，通过 NPM 安装适用于 React 的 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-react
```

安装 Laravel Precognition 包后，你就可以使用 Precognition 的 `useForm` 函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时校验，应监听每个输入框的 `change` 和 `blur` 事件。在 `change` 事件处理器中，调用表单的 `setData` 函数，把输入框的名字和新的值写入；在 `blur` 事件处理器中调用表单的 `validate` 方法并传入输入框的名字：

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

现在，随着用户填写表单，Precognition 将基于该路由表单请求类中的校验规则给出实时校验结果。当输入值变更时，会向 Laravel 应用发起一次做了防抖的"预知"校验请求。你可以通过调用表单的 `setValidationTimeout` 函数配置防抖时长：

```js
form.setValidationTimeout(3000);
```

当一次校验请求在途中时，表单的 `validating` 属性将为 `true`：

```jsx
{form.validating && <div>Validating...</div>}
```

在校验请求或表单提交过程中返回的任何校验错误都会自动写入表单的 `errors` 对象：

```jsx
{form.invalid('email') && <div>{form.errors.email}</div>}
```

你也可以通过表单的 `hasErrors` 属性判断表单整体是否出错：

```jsx
{form.hasErrors && <div><!-- ... --></div>}
```

你也可以把输入框的名字传给表单的 `valid` 和 `invalid` 函数，分别判断单个输入是否通过校验或未通过校验：

```jsx
{form.valid('email') && <span>✅</span>}

{form.invalid('email') && <span>❌</span>}
```

> [!WARNING]
> 只有当输入框的值发生过变化并收到了校验响应之后，它才会显示为通过或未通过。

如果你正在用 Precognition 校验表单里的一部分字段，手动清除错误常常很有用。可以调用表单的 `forgetError` 函数来实现：

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

从前面的例子可以看到，你可以挂接输入框的 `blur` 事件，对用户已经交互过的字段进行实时校验；但有时你会需要校验用户还没交互过的字段。这在实现"向导式"表单时很常见——无论用户是否已经交互，下一步之前都需要把可见输入框全部校验一遍。

要实现这一点，可以调用 `validate` 方法，把要校验的字段名传给 `only` 配置项，并通过 `onSuccess` 与 `onValidationError` 回调处理校验结果：

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

当然，你也可以基于表单提交的响应执行后续逻辑。表单的 `submit` 函数返回一个 Axios 请求 Promise，这样可以方便地拿到响应负载、在提交成功后重置表单输入，或者处理失败请求：

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

你可以通过检查表单的 `processing` 属性，判断表单提交请求是否还在进行中：

```html
<button disabled={form.processing}>
    Submit
</button>
```

### 使用 Alpine 和 Blade

借助 Laravel Precognition，你可以在前端 Alpine 应用中提供实时校验体验，而无需在前端重复校验规则。为了演示它的工作方式，我们来构建一个创建新用户的表单。

首先，要为某条路由启用 Precognition，需要把 `HandlePrecognitiveRequests` 中间件添加到路由定义里。你还应该创建一个 [表单请求类（Form Request）](/docs/{{version}}/validation#form-request-validation) 来承载该路由的校验规则：

```php
use App\Http\Requests\CreateUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (CreateUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，通过 NPM 安装适用于 Alpine 的 Laravel Precognition 前端辅助包：

```shell
npm install laravel-precognition-alpine
```

然后，在 `resources/js/app.js` 文件里向 Alpine 注册 Precognition 插件：

```js
import Alpine from 'alpinejs';
import Precognition from 'laravel-precognition-alpine';

window.Alpine = Alpine;

Alpine.plugin(Precognition);
Alpine.start();
```

安装并注册 Laravel Precognition 包之后，你就可以使用 Precognition 的 `$form` "魔法"创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时校验，应将表单数据绑定到对应的输入框，然后监听每个输入框的 `change` 事件。在 `change` 事件处理器中调用表单的 `validate` 方法，并传入输入框的名字：

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

现在，随着用户填写表单，Precognition 将基于该路由表单请求类中的校验规则给出实时校验结果。当输入值变更时，会向 Laravel 应用发起一次做了防抖的"预知"校验请求。你可以通过调用表单的 `setValidationTimeout` 函数配置防抖时长：

```js
form.setValidationTimeout(3000);
```

当一次校验请求在途中时，表单的 `validating` 属性将为 `true`：

```html
<template x-if="form.validating">
    <div>Validating...</div>
</template>
```

在校验请求或表单提交过程中返回的任何校验错误都会自动写入表单的 `errors` 对象：

```html
<template x-if="form.invalid('email')">
    <div x-text="form.errors.email"></div>
</template>
```

你也可以通过表单的 `hasErrors` 属性判断表单整体是否出错：

```html
<template x-if="form.hasErrors">
    <div><!-- ... --></div>
</template>
```

你也可以把输入框的名字传给表单的 `valid` 和 `invalid` 函数，分别判断单个输入是否通过校验或未通过校验：

```html
<template x-if="form.valid('email')">
    <span>✅</span>
</template>

<template x-if="form.invalid('email')">
    <span>❌</span>
</template>
```

> [!WARNING]
> 只有当输入框的值发生过变化并收到了校验响应之后，它才会显示为通过或未通过。

从前面的例子可以看到，你可以挂接输入框的 `change` 事件，对用户已经交互过的字段进行实时校验；但有时你会需要校验用户还没交互过的字段。这在实现"向导式"表单时很常见——无论用户是否已经交互，下一步之前都需要把可见输入框全部校验一遍。

要实现这一点，可以调用 `validate` 方法，把要校验的字段名传给 `only` 配置项，并通过 `onSuccess` 与 `onValidationError` 回调处理校验结果：

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

你可以通过检查表单的 `processing` 属性，判断表单提交请求是否还在进行中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

#### 重新填充旧表单数据

在上面讨论的用户创建示例中，我们使用 Precognition 来做实时校验；但表单本身采用传统的服务端表单提交。因此，表单应当使用服务端表单提交返回的"旧"输入和校验错误进行填充：

```html
<form x-data="{
    form: $form('post', '/register', {
        name: '{{ old('name') }}',
        email: '{{ old('email') }}',
    }).setErrors({{ Js::from($errors->messages()) }}),
}">
```

如果你希望通过 XHR 提交表单，也可以使用表单的 `submit` 函数，它返回一个 Axios 请求 Promise：

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

### 配置 Axios

Precognition 校验库使用 [Axios](https://github.com/axios/axios) HTTP 客户端向后端发送请求。为方便起见，必要时可以定制 Axios 实例。例如，使用 `laravel-precognition-vue` 库时，你可以在应用的 `resources/js/app.js` 文件中为每个外发请求添加额外的请求头：

```js
import { client } from 'laravel-precognition-vue';

client.axios().defaults.headers.common['Authorization'] = authToken;
```

或者，如果你的应用已经有一个配置好的 Axios 实例，你也可以让 Precognition 使用这个实例：

```js
import Axios from 'axios';
import { client } from 'laravel-precognition-vue';

window.axios = Axios.create()
window.axios.defaults.headers.common['Authorization'] = authToken;

client.use(window.axios)
```

## 校验数组

你可以使用通配符来校验数组或嵌套对象里的字段。每个 `*` 匹配一段路径：

```js
// 对数组中所有用户的 email 进行校验...
form.validate('users.*.email');

// 对 profile 对象里的全部字段进行校验...
form.validate('profile.*');

// 对所有用户的所有字段进行校验...
form.validate('users.*.*');
```

## 自定义校验规则

可以通过请求的 `isPrecognitive` 方法自定义预知请求期间执行的校验规则。

例如，在用户创建表单里，我们可能希望只在最终提交时才校验密码是否"未被泄露"。而在预知校验时，我们只需要校验密码必填且至少 8 位即可。通过 `isPrecognitive` 方法，我们可以为表单请求类定制规则：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * 获取适用于该请求的校验规则。
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

## 处理文件上传

默认情况下，Laravel Precognition 在预知校验请求中既不上传也不校验文件。这是为了避免大文件被不必要地重复上传。

由于这一行为，你需要确保应用通过 [自定义相应表单请求类的校验规则](#customizing-validation-rules) 来指明：这些字段只在完整表单提交时才要求必填：

```php
/**
 * 获取适用于该请求的校验规则。
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

如果你希望在每次校验请求中都包含文件，可以在客户端表单实例上调用 `validateFiles` 函数：

```js
form.validateFiles();
```

## 管理副作用

为路由添加 `HandlePrecognitiveRequests` 中间件时，应当考虑其他中间件中是否存在副作用需要在校验请求期间被跳过。

例如，你可能有一个中间件，用于累计用户与应用的"交互"次数，但你并不希望把预知请求计为一次交互。为实现这一点，可以在累加交互计数之前先检查请求的 `isPrecognitive` 方法：

```php
<?php

namespace App\Http\Middleware;

use App\Facades\Interaction;
use Closure;
use Illuminate\Http\Request;

class InteractionMiddleware
{
    /**
     * 处理进来的请求。
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

## 测试

如果你想在测试中发起预知请求，Laravel 的 `TestCase` 提供了一个 `withPrecognition` 辅助方法，它会自动添加 `Precognition` 请求头。

此外，如果你希望断言某个预知请求成功（例如没有任何校验错误），可以在响应上调用 `assertSuccessfulPrecognition` 方法：

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
