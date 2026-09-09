# Eloquent：API 资源

- [简介](#introduction)
- [生成资源](#generating-resources)
- [概念概述](#concept-overview)
    - [资源集合](#resource-collections)
- [编写资源](#writing-resources)
    - [数据包裹](#data-wrapping)
    - [分页](#pagination)
    - [条件属性](#conditional-attributes)
    - [条件关联](#conditional-relationships)
    - [添加元数据](#adding-meta-data)
- [资源响应](#resource-responses)

<a name="introduction"></a>
## 简介

构建 API 时，你可能需要一个转换层，位于 Eloquent 模型与实际返回给应用用户的 JSON 响应之间。例如，你可能希望只对一部分用户显示某些属性，或者希望始终在模型的 JSON 表示中包含某些关联。Eloquent 的资源类让你能够以富有表现力且简单的方式，将模型和模型集合转换为 JSON。

当然，你随时可以使用 `toJson` 方法将 Eloquent 模型或集合转换为 JSON；不过，Eloquent 资源为模型及其关联的 JSON 序列化提供了更精细、更健壮的控制。

<a name="generating-resources"></a>
## 生成资源

要生成资源类，可以使用 `make:resource` Artisan 命令。默认情况下，资源会被放置在应用的 `app/Http/Resources` 目录中。资源继承自 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

<a name="generating-resource-collections"></a>
#### 资源集合

除了生成转换单个模型的资源之外，你还可以生成负责转换模型集合的资源。这使你的 JSON 响应能够包含与给定资源的整个集合相关的链接及其他元信息。

要创建资源集合，你应当在创建资源时使用 `--collection` 标志。或者，在资源名称中包含 `Collection` 一词，也会让 Laravel 知道应当创建一个集合资源。集合资源继承自 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

<a name="concept-overview"></a>
## 概念概述

> [!NOTE]
> 这只是对资源和资源集合的一个高度概括。强烈建议你阅读本文档的其他章节，以更深入地理解资源为你提供的自定义能力和强大功能。

在深入探讨编写资源时可用的所有选项之前，让我们先从宏观上了解一下资源在 Laravel 中的使用方式。资源类表示一个需要被转换为 JSON 结构的单个模型。例如，下面是一个简单的 `UserResource` 资源类：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

每个资源类都定义了一个 `toArray` 方法，该方法返回在资源作为路由或控制器方法的响应返回时，应被转换为 JSON 的属性数组。

注意，我们可以直接从 `$this` 变量访问模型属性。这是因为资源类会自动将属性和方法访问代理到底层模型，以便于访问。定义好资源之后，就可以从路由或控制器返回它。资源通过其构造函数接收底层模型实例：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

为方便起见，你可以使用模型的 `toResource` 方法，它会依据框架约定自动发现模型对应的资源：

```php
return User::findOrFail($id)->toResource();
```

调用 `toResource` 方法时，Laravel 会尝试在与模型命名空间最接近的 `Http\Resources` 命名空间中，查找与模型名称匹配、并可选地带 `Resource` 后缀的资源。

如果你的资源类没有遵循这一命名约定，或者位于其他命名空间中，你可以使用 `UseResource` 属性为模型指定默认资源：

```php
<?php

namespace App\Models;

use App\Http\Resources\CustomUserResource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\UseResource;

#[UseResource(CustomUserResource::class)]
class User extends Model
{
    // ...
}
```

或者，你也可以将资源类传递给 `toResource` 方法来指定它：

```php
return User::findOrFail($id)->toResource(CustomUserResource::class);
```

<a name="resource-collections"></a>
### 资源集合

如果你要返回一个资源集合或分页响应，应当在路由或控制器中创建资源实例时，使用资源类提供的 `collection` 方法：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会依据框架约定自动发现模型对应的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在与模型命名空间最接近的 `Http\Resources` 命名空间中，查找与模型名称匹配、并带 `Collection` 后缀的资源集合。

如果你的资源集合类没有遵循这一命名约定，或者位于其他命名空间中，你可以使用 `UseResourceCollection` 属性为模型指定默认的资源集合：

```php
<?php

namespace App\Models;

use App\Http\Resources\CustomUserCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\UseResourceCollection;

#[UseResourceCollection(CustomUserCollection::class)]
class User extends Model
{
    // ...
}
```

或者，你也可以将资源集合类传递给 `toResourceCollection` 方法来指定它：

```php
return User::all()->toResourceCollection(CustomUserCollection::class);
```

<a name="custom-resource-collections"></a>
#### 自定义资源集合

默认情况下，资源集合不允许添加可能需要随集合一起返回的任何自定义元数据。如果你想自定义资源集合响应，可以创建一个专门的资源来表示该集合：

```shell
php artisan make:resource UserCollection
```

资源集合类生成之后，你就可以轻松定义应随响应一起包含的任何元数据：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

定义好资源集合之后，就可以从路由或控制器返回它：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会依据框架约定自动发现模型对应的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在与模型命名空间最接近的 `Http\Resources` 命名空间中，查找与模型名称匹配、并带 `Collection` 后缀的资源集合。

<a name="preserving-collection-keys"></a>
#### 保留集合键

从路由返回资源集合时，Laravel 会重置集合的键，使其按数字顺序排列。不过，你可以在资源类中添加 `preserveKeys` 属性，用于指示是否应保留集合的原始键：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 指示是否应保留资源集合的键。
     *
     * @var bool
     */
    public $preserveKeys = true;
}
```

当 `preserveKeys` 属性被设置为 `true` 时，从路由或控制器返回集合时将保留集合键：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all()->keyBy->id);
});
```

<a name="customizing-the-underlying-resource-class"></a>
#### 自定义底层资源类

通常，资源集合的 `$this->collection` 属性会自动填充将集合的每一项映射到其单一资源类的结果。单一资源类被假定为集合的类名去掉末尾 `Collection` 部分后的名称。此外，根据个人偏好，单一资源类可以带也可以不带 `Resource` 后缀。

例如，`UserCollection` 会尝试将给定的用户实例映射到 `UserResource` 资源。要自定义这一行为，你可以覆盖资源集合的 `$collects` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 此资源所收集的资源。
     *
     * @var string
     */
    public $collects = Member::class;
}
```

<a name="writing-resources"></a>
## 编写资源

> [!NOTE]
> 如果你还没有阅读[概念概述](#concept-overview)，强烈建议你在继续阅读本文档之前先阅读它。

资源只需要将给定模型转换为一个数组。因此，每个资源都包含一个 `toArray` 方法，它将模型的属性转换为一个对 API 友好的数组，可从应用的路由或控制器返回：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

资源定义好之后，就可以直接从路由或控制器返回：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toUserResource();
});
```

<a name="relationships"></a>
#### 关联

如果你想在响应中包含相关资源，可以将它们添加到资源的 `toArray` 方法返回的数组中。在本例中，我们将使用 `PostResource` 资源的 `collection` 方法，将用户的博客文章添加到资源响应中：

```php
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;

/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->posts),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

> [!NOTE]
> 如果只想在关联已被加载时才包含它们，请查阅关于[条件关联](#conditional-relationships)的文档。

<a name="writing-resource-collections"></a>
#### 资源集合

资源将单个模型转换为数组，而资源集合则将模型集合转换为数组。不过，并非必须为每个模型都定义一个资源集合类，因为所有 Eloquent 模型集合都提供了 `toResourceCollection` 方法，可以即时生成一个「临时（ad-hoc）」资源集合：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::all()->toResourceCollection();
});
```

但是，如果你需要自定义随集合一起返回的元数据，就必须定义自己的资源集合：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

与单一资源一样，资源集合也可以直接从路由或控制器返回：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会依据框架约定自动发现模型对应的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在与模型命名空间最接近的 `Http\Resources` 命名空间中，查找与模型名称匹配、并带 `Collection` 后缀的资源集合。

<a name="data-wrapping"></a>
### 数据包裹

默认情况下，当资源响应被转换为 JSON 时，最外层的资源会被包裹在 `data` 键中。因此，例如，一个典型的资源集合响应如下所示：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ]
}
```

如果你想禁用最外层资源的包裹，应当在 `Illuminate\Http\Resources\Json\JsonResource` 基类上调用 `withoutWrapping` 方法。通常，你应当在 `AppServiceProvider` 或其他在应用的每个请求中都会加载的[服务提供者（Service Provider）](/docs/{{version}}/providers)中调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任意应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任意应用服务。
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();
    }
}
```

> [!WARNING]
> `withoutWrapping` 方法只影响最外层的响应，不会移除你手动添加到自己的资源集合中的 `data` 键。

<a name="wrapping-nested-resources"></a>
#### 包裹嵌套资源

如何包裹资源的关联，你拥有完全的自由。如果你希望所有资源集合无论嵌套多少层都被包裹在 `data` 键中，你应当为每个资源定义一个资源集合类，并将集合放在 `data` 键中返回。

你可能会担心这是否会导致最外层的资源被包裹在两个 `data` 键中。不必担心，Laravel 绝不会让你的资源被意外双重包裹，因此你无需关心所转换的资源集合的嵌套层级：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class CommentsCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['data' => $this->collection];
    }
}
```

<a name="data-wrapping-and-pagination"></a>
#### 数据包裹与分页

通过资源响应返回分页集合时，即使已经调用过 `withoutWrapping` 方法，Laravel 也会将你的资源数据包裹在 `data` 键中。这是因为分页响应始终包含带有分页器状态信息的 `meta` 和 `links` 键：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ],
    "links":{
        "first": "http://example.com/users?page=1",
        "last": "http://example.com/users?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/users",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="pagination"></a>
### 分页

你可以将 Laravel 分页器实例传递给资源的 `collection` 方法或自定义资源集合：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::paginate());
});
```

或者，为方便起见，你可以使用分页器的 `toResourceCollection` 方法，它会依据框架约定自动发现分页模型对应的资源集合：

```php
return User::paginate()->toResourceCollection();
```

分页响应始终包含带有分页器状态信息的 `meta` 和 `links` 键：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ],
    "links":{
        "first": "http://example.com/users?page=1",
        "last": "http://example.com/users?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/users",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="customizing-the-pagination-information"></a>
#### 自定义分页信息

如果你想自定义分页响应中 `links` 或 `meta` 键所包含的信息，可以在资源上定义一个 `paginationInformation` 方法。该方法接收 `$paginated` 数据和 `$default` 信息数组，后者是一个包含 `links` 和 `meta` 键的数组：

```php
/**
 * 自定义资源的分页信息。
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  array  $paginated
 * @param  array  $default
 * @return array
 */
public function paginationInformation($request, $paginated, $default)
{
    $default['links']['custom'] = 'https://example.com';

    return $default;
}
```

<a name="conditional-attributes"></a>
### 条件属性

有时你可能希望只有在给定条件满足时，才在资源响应中包含某个属性。例如，你可能希望只有在当前用户是「管理员」时才包含某个值。Laravel 提供了多种辅助方法来帮助你应对这种情况。`when` 方法可用于按条件向资源响应中添加属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret' => $this->when($request->user()->isAdmin(), 'secret-value'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在本例中，只有当已认证用户的 `isAdmin` 方法返回 `true` 时，`secret` 键才会出现在最终资源响应中。如果该方法返回 `false`，`secret` 键会在响应发送给客户端之前从资源响应中移除。`when` 方法让你能够在构建数组时无需借助条件语句，就能以富有表现力的方式定义资源。

`when` 方法还接受闭包作为第二个参数，让你只在给定条件为 `true` 时才计算结果值：

```php
'secret' => $this->when($request->user()->isAdmin(), function () {
    return 'secret-value';
}),
```

`whenHas` 方法可用于在属性确实存在于底层模型上时才包含该属性：

```php
'name' => $this->whenHas('name'),
```

此外，`whenNotNull` 方法可用于在属性不为 null 时，才在资源响应中包含该属性：

```php
'name' => $this->whenNotNull($this->name),
```

<a name="merging-conditional-attributes"></a>
#### 合并条件属性

有时你可能有多个属性，需要基于同一条件才包含在资源响应中。这种情况下，可以使用 `mergeWhen` 方法，只在给定条件为 `true` 时才在响应中包含这些属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        $this->mergeWhen($request->user()->isAdmin(), [
            'first-secret' => 'value',
            'second-secret' => 'value',
        ]),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

同样，如果给定条件为 `false`，这些属性会在响应发送给客户端之前从资源响应中移除。

> [!WARNING]
> `mergeWhen` 方法不应用于混合使用字符串键和数字键的数组中。此外，它也不应用于数字键非连续排序的数组中。

<a name="conditional-relationships"></a>
### 条件关联

除了按条件加载属性之外，你还可以根据关联是否已在模型上加载，来按条件在资源响应中包含关联。这样，控制器可以决定应在模型上加载哪些关联，而你的资源则可以轻松地只在关联确实被加载后才包含它们。最终，这让你更容易避免资源中出现「N+1」查询问题。

`whenLoaded` 方法可用于按条件加载关联。为了避免不必要的关联加载，该方法接收关联的名称而非关联本身：

```php
use App\Http\Resources\PostResource;

/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在本例中，如果关联未被加载，`posts` 键会在响应发送给客户端之前从资源响应中移除。

<a name="conditional-relationship-counts"></a>
#### 条件关联计数

除了按条件包含关联之外，你还可以根据关联的计数是否已在模型上加载，来按条件在资源响应中包含关联「计数」：

```php
new UserResource($user->loadCount('posts'));
```

`whenCounted` 方法可用于按条件在资源响应中包含关联计数。如果关联计数不存在，该方法可避免不必要地包含该属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts_count' => $this->whenCounted('posts'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在本例中，如果 `posts` 关联的计数未被加载，`posts_count` 键会在响应发送给客户端之前从资源响应中移除。

其他类型的聚合值，例如 `avg`、`sum`、`min` 和 `max`，也可以使用 `whenAggregated` 方法按条件加载：

```php
'words_avg' => $this->whenAggregated('posts', 'words', 'avg'),
'words_sum' => $this->whenAggregated('posts', 'words', 'sum'),
'words_min' => $this->whenAggregated('posts', 'words', 'min'),
'words_max' => $this->whenAggregated('posts', 'words', 'max'),
```

<a name="conditional-pivot-information"></a>
#### 条件中间表信息

除了按条件在资源响应中包含关联信息之外，你还可以使用 `whenPivotLoaded` 方法，按条件包含来自多对多关联中间表的数据。`whenPivotLoaded` 方法接收中间表的名称作为第一个参数。第二个参数应当是一个闭包，返回在中间表信息在模型上可用时要返回的值：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoaded('role_user', function () {
            return $this->pivot->expires_at;
        }),
    ];
}
```

如果你的关联使用了[自定义中间表模型](/docs/{{version}}/eloquent-relationships#defining-custom-intermediate-table-models)，你可以将中间表模型的实例作为 `whenPivotLoaded` 方法的第一个参数：

```php
'expires_at' => $this->whenPivotLoaded(new Membership, function () {
    return $this->pivot->expires_at;
}),
```

如果你的中间表使用了 `pivot` 以外的访问器，可以使用 `whenPivotLoadedAs` 方法：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoadedAs('subscription', 'role_user', function () {
            return $this->subscription->expires_at;
        }),
    ];
}
```

<a name="adding-meta-data"></a>
### 添加元数据

某些 JSON API 标准要求在资源和资源集合响应中添加元数据。这通常包括指向该资源或相关资源的 `links`，或者关于资源本身的元数据。如果你需要返回关于资源的额外元数据，请将其包含在 `toArray` 方法中。例如，你可以在转换资源集合时包含 `links` 信息：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'data' => $this->collection,
        'links' => [
            'self' => 'link-value',
        ],
    ];
}
```

从资源返回额外元数据时，你完全不必担心意外覆盖 Laravel 在返回分页响应时自动添加的 `links` 或 `meta` 键。你定义的任何额外 `links` 都会与分页器提供的链接合并。

<a name="top-level-meta-data"></a>
#### 顶层元数据

有时你可能希望只在该资源是返回的最外层资源时，才在资源响应中包含某些元数据。这通常包括关于响应整体的元信息。要定义这类元数据，可以在资源类中添加一个 `with` 方法。该方法应返回一个元数据数组，且仅当该资源是被转换的最外层资源时，才会随资源响应一起返回：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }

    /**
     * 获取应随资源数组一起返回的额外数据。
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'key' => 'value',
            ],
        ];
    }
}
```

<a name="adding-meta-data-when-constructing-resources"></a>
#### 构建资源时添加元数据

你也可以在路由或控制器中构建资源实例时添加顶层的数据。所有资源上都可用的 `additional` 方法接收一个应添加到资源响应中的数据数组：

```php
return User::all()
    ->load('roles')
    ->toResourceCollection()
    ->additional(['meta' => [
        'key' => 'value',
    ]]);
```

<a name="resource-responses"></a>
## 资源响应

正如你已经了解到的，资源可以直接从路由和控制器返回：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toResource();
});
```

但有时你可能需要在发往客户端的 HTTP 响应发送之前对其进行自定义。有两种方法可以实现。首先，你可以在资源上链式调用 `response` 方法。该方法会返回一个 `Illuminate\Http\JsonResponse` 实例，让你能完全控制响应的头部：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user', function () {
    return User::find(1)
        ->toResource()
        ->response()
        ->header('X-Value', 'True');
});
```

或者，你也可以在资源自身内部定义一个 `withResponse` 方法。当资源作为响应中的最外层资源返回时，会调用该方法：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
        ];
    }

    /**
     * 自定义资源的发往响应。
     */
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->header('X-Value', 'True');
    }
}
```
