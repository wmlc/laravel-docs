# Precognition

- [简介](#introduction)
- [实时验证](#live-validation)
    - [使用 Vue](#using-vue)
    - [使用 Vue 与 Inertia](#using-vue-and-inertia)
    - [使用 React](#using-react)
    - [使用 React 与 Inertia](#using-react-and-inertia)
    - [使用 Alpine 与 Blade](#using-alpine)
    - [配置 Axios](#configuring-axios)
- [自定义验证规则](#customizing-validation-rules)
- [处理文件上传](#handling-file-uploads)
- [管理副作用](#managing-side-effects)
- [测试](#testing)

<a name="introduction"></a>
## 简介

Laravel Precognition 让你能够预先得知未来某个 HTTP 请求的结果。Precognition 的主要用例之一，是能够为你的前端 JavaScript 应用提供"实时"验证，而无需重复编写应用后端的验证规则。Precognition 与 Laravel 基于 Inertia 的[入门套件](/docs/{{version}}/starter-kits)搭配得尤为出色。

当 Laravel 收到一个"预判请求"时，它会执行该路由的所有中间件并解析该路由的控制器依赖项，其中包括校验[表单请求](/docs/{{version}}/validation#form-request-validation)，但不会真正执行该路由的控制器方法。

<a name="live-validation"></a>
## 实时验证

<a name="using-vue"></a>
### 使用 Vue

借助 Laravel Precognition，你可以在无需于前端 Vue 应用中重复编写验证规则的前提下，为用户提供实时验证体验。为说明其工作原理，让我们在应用中构建一个用于创建新用户的表单。

首先，要为某个路由启用 Precognition，应当把 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应当创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来承载该路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应当通过 NPM 为 Vue 安装 Laravel Precognition 前端辅助库：

```shell
npm install laravel-precognition-vue
```

安装好 Laravel Precognition 包后，你现在可以使用 Precognition 的 `useForm` 函数创建一个表单对象，并提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

然后，要启用实时验证，请在每个输入框的 `change` 事件上调用表单的 `validate` 方法，并提供该输入框的名称：

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

现在，随着用户填写表单，Precognition 会依据该路由表单请求中的验证规则提供实时验证输出。当表单的输入框发生变化时，一个经过防抖的"预判"验证请求会被发送到你的 Laravel 应用。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当某个验证请求正在进行中时，表单的 `validating` 属性会为 `true`：

```html
<div v-if="form.validating">
    Validating...
</div>
```

验证请求或表单提交期间返回的任何验证错误，都会自动填充到表单的 `errors` 对象中：

```blade
<div v-if="form.invalid('email')">
    {{ form.errors.email }}
</div>
```

你可以使用表单的 `hasErrors` 属性判断表单是否存在任何错误：

```html
<div v-if="form.hasErrors">
    <!-- ... -->
</div>
```

你还可以把输入框名称分别传给表单的 `valid` 和 `invalid` 函数，判断某个输入框是否通过了验证：

```html
<span v-if="form.valid('email')">
    ✅
</span>

<span v-else-if="form.invalid('email')">
    ❌
</span>
```

> [!WARNING]
> 表单输入框只有在发生变化并且已收到验证响应之后，才会显示为有效或无效。

如果你使用 Precognition 验证表单输入框的一个子集，手动清除错误会非常有用。你可以使用表单的 `forgetError` 函数来实现：

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

如我们所见，你可以挂接到某个输入框的 `change` 事件上，在用户与之交互时验证单个输入框；不过，你可能还需要验证用户尚未与之交互的输入框。这在构建"向导"时很常见：在进入下一步之前，你希望验证所有可见的输入框，无论用户是否已经与它们交互过。

要用 Precognition 实现这一点，你应当调用 `validate` 方法，把希望验证的字段名传给 `only` 配置键。你可以用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

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

当然，你也可以针对表单提交的响应执行代码。表单的 `submit` 函数返回一个 Axios 请求 Promise。这为你提供了一条便捷途径来访问响应载荷、在提交成功时重置表单输入框，或处理失败的请求：

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

你可以通过检查表单的 `processing` 属性，判断某个表单提交请求是否正在进行中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

<a name="using-vue-and-inertia"></a>
### 使用 Vue 与 Inertia

> [!NOTE]
> 如果你在使用 Vue 和 Inertia 开发 Laravel 应用时希望有个良好的起点，不妨考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为你的新 Laravel 应用提供后端和前端的认证脚手架。

在把 Precognition 与 Vue 和 Inertia 一起使用之前，请务必先阅读我们关于[使用 Precognition 与 Vue](#using-vue)的一般文档。把 Vue 与 Inertia 一起使用时，你需要通过 NPM 安装兼容 Inertia 的 Precognition 库：

```shell
npm install laravel-precognition-vue-inertia
```

安装完成后，Precognition 的 `useForm` 函数将返回一个 Inertia [表单辅助器](https://inertiajs.com/forms#form-helper)，并具备上文讨论的验证特性。

该表单辅助器的 `submit` 方法得到了精简，不再需要指定 HTTP 方法或 URL。你可以改为把 Inertia 的[访问选项](https://inertiajs.com/manual-visits)作为第一个且唯一的参数传入。此外，`submit` 方法不会像上面 Vue 示例中那样返回 Promise。你可以改为在传给 `submit` 方法的访问选项中，提供 Inertia 支持的任意[事件回调](https://inertiajs.com/manual-visits#event-callbacks)：

```vue
<script setup>
import { useForm } from 'laravel-precognition-vue-inertia';

const form = useForm('post', '/users', {
    name: '',
    email: '',
});

const submit = () => form.submit({
    preserveScroll: true,
    onSuccess: () => form.reset(),
});
</script>
```

<a name="using-react"></a>
### 使用 React

借助 Laravel Precognition，你可以在无需于前端 React 应用中重复编写验证规则的前提下，为用户提供实时验证体验。为说明其工作原理，让我们在应用中构建一个用于创建新用户的表单。

首先，要为某个路由启用 Precognition，应当把 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应当创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来承载该路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应当通过 NPM 为 React 安装 Laravel Precognition 前端辅助库：

```shell
npm install laravel-precognition-react
```

安装好 Laravel Precognition 包后，你现在可以使用 Precognition 的 `useForm` 函数创建一个表单对象，并提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时验证，你应当监听每个输入框的 `change` 和 `blur` 事件。在 `change` 事件处理器中，你应当使用 `setData` 函数设置表单数据，并传入该输入框的名称和新值。然后，在 `blur` 事件处理器中调用表单的 `validate` 方法，并提供该输入框的名称：

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

现在，随着用户填写表单，Precognition 会依据该路由表单请求中的验证规则提供实时验证输出。当表单的输入框发生变化时，一个经过防抖的"预判"验证请求会被发送到你的 Laravel 应用。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当某个验证请求正在进行中时，表单的 `validating` 属性会为 `true`：

```jsx
{form.validating && <div>Validating...</div>}
```

验证请求或表单提交期间返回的任何验证错误，都会自动填充到表单的 `errors` 对象中：

```jsx
{form.invalid('email') && <div>{form.errors.email}</div>}
```

你可以使用表单的 `hasErrors` 属性判断表单是否存在任何错误：

```jsx
{form.hasErrors && <div><!-- ... --></div>}
```

你还可以把输入框名称分别传给表单的 `valid` 和 `invalid` 函数，判断某个输入框是否通过了验证：

```jsx
{form.valid('email') && <span>✅</span>}

{form.invalid('email') && <span>❌</span>}
```

> [!WARNING]
> 表单输入框只有在发生变化并且已收到验证响应之后，才会显示为有效或无效。

如果你使用 Precognition 验证表单输入框的一个子集，手动清除错误会非常有用。你可以使用表单的 `forgetError` 函数来实现：

```jsx
<input
    id="avatar"
    type="file"
    onChange={(e) => {
        form.setData('avatar', e.target.value);

        form.forgetError('avatar');
    }}
>
```

如我们所见，你可以挂接到某个输入框的 `blur` 事件上，在用户与之交互时验证单个输入框；不过，你可能还需要验证用户尚未与之交互的输入框。这在构建"向导"时很常见：在进入下一步之前，你希望验证所有可见的输入框，无论用户是否已经与它们交互过。

要用 Precognition 实现这一点，你应当调用 `validate` 方法，把希望验证的字段名传给 `only` 配置键。你可以用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

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

当然，你也可以针对表单提交的响应执行代码。表单的 `submit` 函数返回一个 Axios 请求 Promise。这为你提供了一条便捷途径来访问响应载荷、在表单提交成功时重置表单输入框，或处理失败的请求：

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

你可以通过检查表单的 `processing` 属性，判断某个表单提交请求是否正在进行中：

```html
<button disabled={form.processing}>
    Submit
</button>
```

<a name="using-react-and-inertia"></a>
### 使用 React 与 Inertia

> [!NOTE]
> 如果你在使用 React 和 Inertia 开发 Laravel 应用时希望有个良好的起点，不妨考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为你的新 Laravel 应用提供后端和前端的认证脚手架。

在把 Precognition 与 React 和 Inertia 一起使用之前，请务必先阅读我们关于[使用 Precognition 与 React](#using-react)的一般文档。把 React 与 Inertia 一起使用时，你需要通过 NPM 安装兼容 Inertia 的 Precognition 库：

```shell
npm install laravel-precognition-react-inertia
```

安装完成后，Precognition 的 `useForm` 函数将返回一个 Inertia [表单辅助器](https://inertiajs.com/forms#form-helper)，并具备上文讨论的验证特性。

该表单辅助器的 `submit` 方法得到了精简，不再需要指定 HTTP 方法或 URL。你可以改为把 Inertia 的[访问选项](https://inertiajs.com/manual-visits)作为第一个且唯一的参数传入。此外，`submit` 方法不会像上面 React 示例中那样返回 Promise。你可以改为在传给 `submit` 方法的访问选项中，提供 Inertia 支持的任意[事件回调](https://inertiajs.com/manual-visits#event-callbacks)：

```js
import { useForm } from 'laravel-precognition-react-inertia';

const form = useForm('post', '/users', {
    name: '',
    email: '',
});

const submit = (e) => {
    e.preventDefault();

    form.submit({
        preserveScroll: true,
        onSuccess: () => form.reset(),
    });
};
```

<a name="using-alpine"></a>
### 使用 Alpine 与 Blade

借助 Laravel Precognition，你可以在无需于前端 Alpine 应用中重复编写验证规则的前提下，为用户提供实时验证体验。为说明其工作原理，让我们在应用中构建一个用于创建新用户的表单。

首先，要为某个路由启用 Precognition，应当把 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应当创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来承载该路由的验证规则：

```php
use App\Http\Requests\CreateUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (CreateUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应当通过 NPM 为 Alpine 安装 Laravel Precognition 前端辅助库：

```shell
npm install laravel-precognition-alpine
```

然后，在你的 `resources/js/app.js` 文件中把 Precognition 插件注册到 Alpine：

```js
import Alpine from 'alpinejs';
import Precognition from 'laravel-precognition-alpine';

window.Alpine = Alpine;

Alpine.plugin(Precognition);
Alpine.start();
```

安装并注册好 Laravel Precognition 包后，你现在可以使用 Precognition 的 `$form` "魔法"创建一个表单对象，并提供 HTTP 方法（`post`）、目标 URL（`/users`）以及初始表单数据。

要启用实时验证，你应当把表单数据绑定到相应的输入框，然后监听每个输入框的 `change` 事件。在 `change` 事件处理器中，你应当调用表单的 `validate` 方法，并提供该输入框的名称：

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

现在，随着用户填写表单，Precognition 会依据该路由表单请求中的验证规则提供实时验证输出。当表单的输入框发生变化时，一个经过防抖的"预判"验证请求会被发送到你的 Laravel 应用。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当某个验证请求正在进行中时，表单的 `validating` 属性会为 `true`：

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

你可以使用表单的 `hasErrors` 属性判断表单是否存在任何错误：

```html
<template x-if="form.hasErrors">
    <div><!-- ... --></div>
</template>
```

你还可以把输入框名称分别传给表单的 `valid` 和 `invalid` 函数，判断某个输入框是否通过了验证：

```html
<template x-if="form.valid('email')">
    <span>✅</span>
</template>

<template x-if="form.invalid('email')">
    <span>❌</span>
</template>
```

> [!WARNING]
> 表单输入框只有在发生变化并且已收到验证响应之后，才会显示为有效或无效。

如我们所见，你可以挂接到某个输入框的 `change` 事件上，在用户与之交互时验证单个输入框；不过，你可能还需要验证用户尚未与之交互的输入框。这在构建"向导"时很常见：在进入下一步之前，你希望验证所有可见的输入框，无论用户是否已经与它们交互过。

要用 Precognition 实现这一点，你应当调用 `validate` 方法，把希望验证的字段名传给 `only` 配置键。你可以用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

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

你可以通过检查表单的 `processing` 属性，判断某个表单提交请求是否正在进行中：

```html
<button :disabled="form.processing">
    Submit
</button>
```

<a name="repopulating-old-form-data"></a>
#### 回填旧的表单数据

在上面讨论的用户创建示例中，我们使用 Precognition 来执行实时验证；不过，提交表单时我们采用的是传统的服务端表单提交方式。因此，表单应当用服务端表单提交返回的任何"旧"输入值和验证错误来填充：

```blade
<form x-data="{
    form: $form('post', '/register', {
        name: '{{ old('name') }}',
        email: '{{ old('email') }}',
    }).setErrors({{ Js::from($errors->messages()) }}),
}">
```

或者，如果你希望通过 XHR 提交表单，可以使用表单的 `submit` 函数，它返回一个 Axios 请求 Promise：

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
                    form.reset();

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

Precognition 验证库使用 [Axios](https://github.com/axios/axios) HTTP 客户端向你的应用后端发送请求。为了方便，如果你的应用需要，可以对 Axios 实例进行自定义。例如在使用 `laravel-precognition-vue` 库时，你可以在应用的 `resources/js/app.js` 文件中为每个传出的请求添加额外的请求头：

```js
import { client } from 'laravel-precognition-vue';

client.axios().defaults.headers.common['Authorization'] = authToken;
```

或者，如果你已经为应用配置好了一个 Axios 实例，可以告诉 Precognition 改用该实例：

```js
import Axios from 'axios';
import { client } from 'laravel-precognition-vue';

window.axios = Axios.create()
window.axios.defaults.headers.common['Authorization'] = authToken;

client.use(window.axios)
```

> [!WARNING]
> Inertia 版本的 Precognition 库只会把配置好的 Axios 实例用于验证请求。表单提交始终会由 Inertia 发送。

<a name="customizing-validation-rules"></a>
## 自定义验证规则

你可以使用请求的 `isPrecognitive` 方法，自定义预判请求期间执行的验证规则。

例如，在一个用户创建表单上，我们可能希望只在最后提交表单时才验证密码是否"未泄露"。对于预判验证请求，我们只需验证密码是必填的，且最少 8 个字符。使用 `isPrecognitive` 方法，我们可以自定义表单请求所定义的规则：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * 获取适用于该请求的验证规则。
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

默认情况下，Laravel Precognition 在预判验证请求期间不会上传或验证文件。这可以确保大文件不会被不必要地反复上传。

正因如此，你应当确保自己的应用[自定义了相应表单请求的验证规则](#customizing-validation-rules)，以指定该字段仅在完整表单提交时才为必填：

```php
/**
 * 获取适用于该请求的验证规则。
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

如果你希望在每个验证请求中都包含文件，可以在客户端表单实例上调用 `validateFiles` 函数：

```js
form.validateFiles();
```

<a name="managing-side-effects"></a>
## 管理副作用

把 `HandlePrecognitiveRequests` 中间件添加到某个路由时，你应当考虑_其他_中间件中是否存在应当在预判请求期间跳过的副作用。

例如，你可能有一个中间件会递增每个用户与你应用之间的"交互"总次数，但你可能不希望把预判请求计为一次交互。为此，我们可以在递增交互次数之前检查请求的 `isPrecognitive` 方法：

```php
<?php

namespace App\Http\Middleware;

use App\Facades\Interaction;
use Closure;
use Illuminate\Http\Request;

class InteractionMiddleware
{
    /**
     * 处理传入的请求。
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

如果你希望在测试中发起预判请求，Laravel 的 `TestCase` 提供了一个 `withPrecognition` 辅助方法，它会添加 `Precognition` 请求头。

此外，如果你想断言某个预判请求是否成功，例如是否没有返回任何验证错误，可以在响应上使用 `assertSuccessfulPrecognition` 方法：

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
