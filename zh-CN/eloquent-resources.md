# Eloquent：API 资源

## 简介

在构建 API 时，你可能需要在 Eloquent 模型与真正返回给应用用户的 JSON 响应之间，放置一个转换层。例如，你可能希望为一部分用户显示某些属性，而不为其他用户显示；或者你可能希望始终在模型的 JSON 表示中包含某些关联。Eloquent 的资源（resource）类让你可以富有表现力且轻松地将模型和集合转换为 JSON。

当然，你随时可以使用 `toJson` 方法将 Eloquent 模型或集合转换为 JSON；不过，Eloquent 资源（resource）对你模型和关联的 JSON 序列化提供了更细粒度、更强大的控制。

## 生成资源

要生成一个资源类，你可以使用 `make:resource` Artisan 命令。默认情况下，资源会被放置在应用的 `app/Http/Resources` 目录中。资源继承自 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

#### 资源集合

除了生成用于转换单个模型的资源之外，你还可以生成负责转换模型集合的资源。这能让你的 JSON 响应包含与整个给定资源集合相关的链接和其他元数据。

要创建资源集合，你应该在创建资源时使用 `--collection` 标志。或者，在资源名中包含 `Collection` 一词，会指示 Laravel 创建一个集合资源。集合资源继承自 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

## 概念概览

> [!NOTE]
> 这是对资源和资源集合的概要介绍。我们强烈建议你阅读本文档的其他章节，以更深入地了解资源为你提供的定制能力与其强大之处。

在深入了解编写资源时所有可用选项之前，我们先从较高层面看看资源在 Laravel 中是如何使用的。一个资源类表示需要转换为 JSON 结构的单个模型。例如，下面是一个简单的 `UserResource` 资源类：

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

每个资源类都定义了一个 `toArray` 方法，该方法返回当资源作为响应从路由或控制器方法返回时，应被转换为 JSON 的属性数组。

注意，我们可以直接通过 `$this` 变量访问模型属性。这是因为资源类会自动将属性和方法的访问代理到底层模型，以便便捷访问。资源定义好后，就可以从路由或控制器返回它。资源通过构造函数接收底层模型实例：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

为方便起见，你可以使用模型的 `toResource` 方法，它会使用框架约定自动发现模型底层的资源：

```php
return User::findOrFail($id)->toResource();
```

调用 `toResource` 方法时，Laravel 会尝试在最接近模型命名空间的 `Http\Resources` 命名空间中，找到一个与模型名匹配、并可选择附加 `Resource` 后缀的资源。

如果你的资源类不遵循这种命名约定，或者位于不同的命名空间，你可以使用 `UseResource` 属性为模型指定默认资源：

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

或者，你可以通过将资源类传给 `toResource` 方法来指定资源类：

```php
return User::findOrFail($id)->toResource(CustomUserResource::class);
```

### 资源集合

如果你返回的是资源的集合或分页响应，在路由或控制器中创建资源实例时，应该使用资源类提供的 `collection` 方法：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会使用框架约定自动发现模型底层的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在最接近模型命名空间的 `Http\Resources` 命名空间中，找到一个与模型名匹配、并以 `Collection` 为后缀的资源集合。

如果你的资源集合类不遵循这种命名约定，或者位于不同的命名空间，你可以使用 `UseResourceCollection` 属性为模型指定默认资源集合：

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

或者，你可以通过将资源集合类传给 `toResourceCollection` 方法来指定它：

```php
return User::all()->toResourceCollection(CustomUserCollection::class);
```

#### 自定义资源集合

默认情况下，资源集合不允许添加任何可能需要随集合一起返回的自定义元数据。如果你希望自定义资源集合响应，可以创建一个专门的资源来表示该集合：

```shell
php artisan make:resource UserCollection
```

资源集合类生成后，你就可以轻松定义响应中应包含的任意元数据：

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

定义好资源集合后，就可以从路由或控制器返回它：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会使用框架约定自动发现模型底层的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在最接近模型命名空间的 `Http\Resources` 命名空间中，找到一个与模型名匹配、并以 `Collection` 为后缀的资源集合。

#### 保留集合键

当从路由返回资源集合时，Laravel 会重置集合的键，使它们按数字顺序排列。不过，你可以使用资源类上的 `PreserveKeys` 属性来指示是否应保留集合的原始键：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\JsonResource;

#[PreserveKeys]
class UserResource extends JsonResource
{
    // ...
}
```

当 `preserveKeys` 属性被设置为 `true` 时，从路由或控制器返回集合时会保留集合的键：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all()->keyBy->id);
});
```

#### 自定义底层资源类

通常情况下，资源集合的 `$this->collection` 属性会自动填充将集合中每一项映射到其单数资源类的结果。单数资源类被假定为去掉了类名末尾 `Collection` 部分的集合类名。此外，根据你个人的偏好，单数资源类可以有也可以没有 `Resource` 后缀。

例如，`UserCollection` 会尝试将给定的用户实例映射到 `UserResource` 资源。要自定义这种行为，你可以在资源集合上使用 `Collects` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Attributes\Collects;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[Collects(Member::class)]
class UserCollection extends ResourceCollection
{
    // ...
}
```

## 编写资源

> [!NOTE]
> 如果你还没有阅读 [概念概览](#concept-overview)，我们强烈建议你在继续阅读本文档之前先阅读它。

资源只需要将给定的模型转换为一个数组。因此，每个资源都包含一个 `toArray` 方法，该方法将模型的属性转换为一组对 API 友好的数组，可由应用的路由或控制器返回：

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

资源定义好后，就可以直接从路由或控制器返回：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toUserResource();
});
```

#### 关联

如果你希望在响应中包含相关资源，可以将它们添加到资源 `toArray` 方法返回的数组中。在此示例中，我们将使用 `PostResource` 资源的 `collection` 方法，将用户的博客文章添加到资源响应中：

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
> 如果你希望仅在关联已被加载时才包含它们，请查阅 [条件关联](#conditional-relationships) 文档。

#### 资源集合

虽然资源将单个模型转换为数组，但资源集合将模型集合转换为数组。不过，你并不一定要为每个模型都定义一个资源集合类，因为所有 Eloquent 模型集合都提供了 `toResourceCollection` 方法，可以即时生成"即席"的资源集合：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::all()->toResourceCollection();
});
```

不过，如果你需要自定义随集合返回的元数据，就有必要定义自己的资源集合：

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

与单数资源一样，资源集合也可以直接从路由或控制器返回：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，你可以使用 Eloquent 集合的 `toResourceCollection` 方法，它会使用框架约定自动发现模型底层的资源集合：

```php
return User::all()->toResourceCollection();
```

调用 `toResourceCollection` 方法时，Laravel 会尝试在最接近模型命名空间的 `Http\Resources` 命名空间中，找到一个与模型名匹配、并以 `Collection` 为后缀的资源集合。

### 数据包裹

默认情况下，当资源响应被转换为 JSON 时，你最外层的资源会被包裹在 `data` 键中。所以，例如一个典型的资源集合响应看起来如下：

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

如果你希望禁用最外层资源的包裹，应该在基础的 `Illuminate\Http\Resources\Json\JsonResource` 类上调用 `withoutWrapping` 方法。通常，你应该在 `AppServiceProvider` 或在每次请求你的应用时都会加载的其他 [服务提供者（Service Provider）](/docs/{{version}}/providers) 中调用此方法：

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
> `withoutWrapping` 方法只影响最外层的响应，不会移除你手动添加到自己资源集合中的 `data` 键。

#### 包裹嵌套资源

你可以完全自由地决定资源的关联如何被包裹。如果你希望所有资源集合都被包裹在 `data` 键中，无论它们的嵌套层级如何，你应该为每个资源定义一个资源集合类，并在 `data` 键内返回该集合。

你可能会担心这是否会导致你最外层的资源被包裹进两个 `data` 键中。别担心，Laravel 绝不会让你的资源被意外地双重包裹，因此你不必担心所转换资源集合的嵌套层级：

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

#### 数据包裹与分页

当通过资源响应返回分页集合时，即使已经调用了 `withoutWrapping` 方法，Laravel 也会将你的资源数据包裹在 `data` 键中。这是因为分页响应始终包含带有分页器状态信息的 `meta` 和 `links` 键：

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

### 分页

你可以将一个 Laravel 分页器实例传给资源的 `collection` 方法，或传给一个自定义资源集合：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::paginate());
});
```

或者，为方便起见，你可以使用分页器的 `toResourceCollection` 方法，它会使用框架约定自动发现分页模型的底层资源集合：

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

#### 自定义分页信息

如果你希望自定义分页响应中 `links` 或 `meta` 键所包含的信息，可以在资源上定义一个 `paginationInformation` 方法。该方法会接收 `$paginated` 数据和 `$default` 信息数组，该数组是一个包含 `links` 和 `meta` 键的数组：

```php
/**
 * 为资源自定义分页信息。
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

### 条件属性

有时你可能希望仅在满足某个给定条件时才在资源响应中包含某个属性。例如，你可能希望仅在当前用户是"管理员"时才包含某个值。Laravel 提供了一系列辅助方法来帮助你应对这种情况。`when` 方法可用于有条件地向资源响应添加属性：

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

在此示例中，只有当认证用户的 `isAdmin` 方法返回 `true` 时，`secret` 键才会出现在最终资源响应中。如果该方法返回 `false`，在发送给客户端之前，`secret` 键会从资源响应中移除。`when` 方法让你在构建数组时无需借助条件语句，就能富有表现力地定义资源。

`when` 方法还接受以一个闭包作为第二个参数，让你仅在给定条件为 `true` 时才计算所得的值：

```php
'secret' => $this->when($request->user()->isAdmin(), function () {
    return 'secret-value';
}),
```

`whenHas` 方法可用于在底层模型上确实存在某属性时才包含它：

```php
'name' => $this->whenHas('name'),
```

此外，`whenNotNull` 方法可用于在属性不为 null 时将其包含在资源响应中：

```php
'name' => $this->whenNotNull($this->name),
```

#### 合并条件属性

有时你可能有多个属性，它们都只应在满足相同条件时才包含在资源响应中。在这种情况下，你可以使用 `mergeWhen` 方法，仅在给定条件为 `true` 时才将这些属性包含在响应中：

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

同样，如果给定条件为 `false`，这些属性会在发送给客户端之前从资源响应中移除。

> [!WARNING]
> `mergeWhen` 方法不应在混合了字符串键和数字键的数组中使用。此外，它也不应在数字键未按顺序排列的数组中使用。

### 条件关联

除了有条件地加载属性外，你还可以根据关联是否已在模型上加载，有条件地在资源响应中包含关联。这让你的控制器能够决定应该在模型上加载哪些关联，而你的资源可以轻松地在关联确实已被加载时才包含它们。最终，这让你更容易避免资源中的"N+1"查询问题。

`whenLoaded` 方法可用于有条件地加载关联。为了避免不必要地加载关联，该方法接受关联的名称，而不是关联本身：

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

在此示例中，如果关联尚未被加载，在发送给客户端之前，`posts` 键会从资源响应中移除。

#### 条件关联计数

除了有条件地包含关联之外，你还可以根据关联的计数是否已在模型上加载，有条件地在资源响应中包含关联的"计数"：

```php
new UserResource($user->loadCount('posts'));
```

`whenCounted` 方法可用于有条件地在资源响应中包含关联的计数。如果关联的计数不存在，该方法会避免不必要地包含该属性：

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

在此示例中，如果 `posts` 关联的计数尚未被加载，在发送给客户端之前，`posts_count` 键会从资源响应中移除。

其它类型的聚合（例如 `avg`、`sum`、`min` 和 `max`）也可以使用 `whenAggregated` 方法有条件地加载：

```php
'words_avg' => $this->whenAggregated('posts', 'words', 'avg'),
'words_sum' => $this->whenAggregated('posts', 'words', 'sum'),
'words_min' => $this->whenAggregated('posts', 'words', 'min'),
'words_max' => $this->whenAggregated('posts', 'words', 'max'),
```

#### 条件中间表信息

除了有条件地在资源响应中包含关联信息外，你还可以使用 `whenPivotLoaded` 方法，有条件地包含来自 many-to-many 关联中间表的数据。`whenPivotLoaded` 方法接受中间表的名称作为第一个参数。第二个参数应是一个闭包，当模型上可用中间表信息时，返回要返回的值：

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

如果你的关联使用了 [自定义中间表模型](/docs/{{version}}/eloquent-relationships#defining-custom-intermediate-table-models)，可以将中间表模型的实例作为第一个参数传给 `whenPivotLoaded` 方法：

```php
'expires_at' => $this->whenPivotLoaded(new Membership, function () {
    return $this->pivot->expires_at;
}),
```

如果你的中间表使用的访问器不是 `pivot`，可以使用 `whenPivotLoadedAs` 方法：

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

### 添加元数据

一些 JSON API 标准要求为你的资源及资源集合响应添加元数据。这通常包含指向资源或相关资源的 `links`，或是关于资源本身的元数据。如果你需要返回关于资源的额外元数据，请将它包含在你的 `toArray` 方法中。例如，你在转换资源集合时可以包含 `links` 信息：

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

从资源返回额外元数据时，你永远不必担心会意外覆盖 Laravel 在返回分页响应时自动添加的 `links` 或 `meta` 键。你定义的任何额外 `links` 都会与分页器提供的链接合并。

#### 顶层元数据

有时你可能希望仅在资源是最外层返回的资源时，才在资源响应中包含某些元数据。通常，这包括关于整个响应的元信息。要定义这些元数据，请在你的资源类上添加一个 `with` 方法。该方法应返回一个元数据数组，仅在资源是被转换的最外层资源时才随资源响应一起包含：

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

#### 在构建资源时添加元数据

你也可以在路由或控制器中构建资源实例时添加顶层数据。所有资源上都可用的 `additional` 方法，接受一个应被添加到资源响应中的数据数组：

```php
return User::all()
    ->load('roles')
    ->toResourceCollection()
    ->additional(['meta' => [
        'key' => 'value',
    ]]);
```

## JSON:API 资源

Laravel 自带 `JsonApiResource`，这是一个能够生成符合 [JSON:API 规范](https://jsonapi.org/) 的响应的资源类。它继承自标准的 `JsonResource` 类，会自动处理资源对象结构、关联、稀疏字段集、包含（includes）、惰性属性求值，并将 `Content-Type` 头设置为 `application/vnd.api+json`。

> [!NOTE]
> Laravel 的 JSON:API 资源负责响应的序列化。如果你还需要解析传入的 JSON:API 查询参数（例如过滤和排序），[Spatie 的 Laravel Query Builder](https://spatie.be/docs/laravel-query-builder) 是一个很好的配套包。

### 生成 JSON:API 资源

要生成 JSON:API 资源，请使用带 `--json-api` 标志的 `make:resource` Artisan 命令：

```shell
php artisan make:resource PostResource --json-api
```

生成的类会继承自 `Illuminate\Http\Resources\JsonApi\JsonApiResource`，并包含供你定义的 `$attributes` 和 `$relationships` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class PostResource extends JsonApiResource
{
    /**
     * 资源的属性。
     */
    public $attributes = [
        // ...
    ];

    /**
     * 资源的关联。
     */
    public $relationships = [
        // ...
    ];
}
```

JSON:API 资源可以像标准资源一样从路由和控制器返回：

```php
use App\Http\Resources\PostResource;
use App\Models\Post;

Route::get('/api/posts/{post}', function (Post $post) {
    return new PostResource($post);
});
```

或者，为方便起见，你可以使用模型的 `toResource` 方法：

```php
Route::get('/api/posts/{post}', function (Post $post) {
    return $post->toResource();
});
```

这将产生一个符合 JSON:API 的响应：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World",
            "body": "This is my first post."
        }
    }
}
```

要返回 JSON:API 资源的集合，可以使用 `collection` 方法或 `toResourceCollection` 便捷方法：

```php
return PostResource::collection(Post::all());

return Post::all()->toResourceCollection();
```

### 定义属性

有两种方式可以定义 JSON:API 资源中包含哪些属性。

最简单的方式是在你的资源上定义一个 `$attributes` 属性。你可以将属性名作为值列出，它们会直接从底层模型读取：

```php
public $attributes = [
    'title',
    'body',
    'created_at',
];
```

如果某个属性的计算开销很大，你可以从 `toAttributes` 中以闭包的形式返回它，这样它只会在响应中真正需要该属性时才被求值。

或者，为了对资源的属性拥有完全控制，你可以重写资源上的 `toAttributes` 方法：

```php
/**
 * 获取资源的属性。
 *
 * @return array<string, mixed>
 */
public function toAttributes(Request $request): array
{
    return [
        'title' => $this->title,
        'body' => $this->body,
        'is_published' => fn () => $this->published_at !== null,
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

### 定义关联

JSON:API 资源支持定义符合 JSON:API 规范的关联。关联仅在客户端通过 `include` 查询参数请求时才会被序列化。

#### `$relationships` 属性

你可以通过资源上的 `$relationships` 属性定义资源可包含的关联：

```php
public $relationships = [
    'author',
    'comments',
];
```

当以值的形式列出关联名时，Laravel 会解析对应的 Eloquent 关联，并自动发现合适的资源类。如果你需要显式指定资源类，可以将关联定义为键 / 类对：

```php
use App\Http\Resources\UserResource;

public $relationships = [
    'author' => UserResource::class,
    'comments',
];
```

或者，你可以重写资源上的 `toRelationships` 方法：

```php
/**
 * 获取资源的关联。
 */
public function toRelationships(Request $request): array
{
    return [
        'author' => UserResource::class,
        'comments' => fn () => CommentResource::collection(
            $request->user()->is($this->resource)
                ? $this->comments
                : $this->comments->where('is_public', true),
        ),
    ];
}
```

使用闭包让你可以更精细地控制关联的载荷，同时仍然只在客户端请求时才解析该关联。

#### 包含关联

客户端可以使用 `include` 查询参数来请求相关资源：

```
GET /api/posts/1?include=author,comments
```

这会产生一个在 `relationships` 键中包含资源标识符对象、并在顶层 `included` 数组中包含完整资源对象的响应：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World"
        },
        "relationships": {
            "author": {
                "data": {
                    "id": "1",
                    "type": "users"
                }
            },
            "comments": {
                "data": [
                    {
                        "id": "1",
                        "type": "comments"
                    }
                ]
            }
        }
    },
    "included": [
        {
            "id": "1",
            "type": "users",
            "attributes": {
                "name": "Taylor Otwell"
            }
        },
        {
            "id": "1",
            "type": "comments",
            "attributes": {
                "body": "Great post!"
            }
        }
    ]
}
```

嵌套关联可以使用点表示法来包含：

```
GET /api/posts/1?include=comments.author
```

#### 关联深度

默认情况下，嵌套关联的包含被限制为最大深度。你可以使用 `maxRelationshipDepth` 方法自定义这个限制，通常放在应用的某个服务提供者中：

```php
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

JsonApiResource::maxRelationshipDepth(3);
```

### 资源类型与 ID

默认情况下，资源的 `type` 派生自资源类名。例如，`PostResource` 产生类型 `posts`，而 `BlogPostResource` 产生 `blog-posts`。资源的 `id` 从模型的主键解析而来。

如果你需要自定义这些值，可以重写资源上的 `toType` 和 `toId` 方法：

```php
/**
 * 获取资源的类型。
 */
public function toType(Request $request): string
{
    return 'articles';
}

/**
 * 获取资源的 ID。
 */
public function toId(Request $request): string
{
    return (string) $this->uuid;
}
```

当资源的类型应该与其类名不同时，这会特别有用，例如当 `AuthorResource` 包装了一个 `User` 模型、并且应输出类型 `authors` 时。

### 稀疏字段集与包含

JSON:API 资源支持 [稀疏字段集](https://jsonapi.org/format/#fetching-sparse-fieldsets)，允许客户端使用 `fields` 查询参数，仅为每种资源类型请求特定的属性：

```
GET /api/posts?fields[posts]=title,created_at&fields[users]=name
```

这只会包含 `posts` 资源的 `title` 和 `created_at` 属性，以及 `users` 资源的 `name` 属性。

#### 忽略查询字符串

如果你希望针对给定的资源响应禁用稀疏字段集过滤，可以调用 `ignoreFieldsAndIncludesInQueryString` 方法：

```php
return $post->toResource()
    ->ignoreFieldsAndIncludesInQueryString();
```

#### 包含先前已加载的关联

默认情况下，关联仅在通过 `include` 查询参数请求时才被包含在响应中。如果你希望无视查询字符串、包含所有先前已预先加载的关联，可以调用 `includePreviouslyLoadedRelationships` 方法：

```php
return $post->load('author', 'comments')
    ->toResource()
    ->includePreviouslyLoadedRelationships();
```

### 链接与元数据

你可以通过重写资源上的 `toLinks` 和 `toMeta` 方法，为你的 JSON:API 资源对象添加链接和元数据：

```php
/**
 * 获取资源的链接。
 */
public function toLinks(Request $request): array
{
    return [
        'self' => route('api.posts.show', $this->resource),
    ];
}

/**
 * 获取资源的元数据。
 */
public function toMeta(Request $request): array
{
    return [
        'readable_created_at' => $this->created_at->diffForHumans(),
    ];
}
```

这会给响应中的资源对象添加 `links` 和 `meta` 键：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World"
        },
        "links": {
            "self": "https://example.com/api/posts/1"
        },
        "meta": {
            "readable_created_at": "2 hours ago"
        }
    }
}
```

## 资源响应

正如你已经读到的，资源可以直接从路由和控制器返回：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toResource();
});
```

不过，有时你可能需要在发送给客户端之前，定制传出的 HTTP 响应。有两种方式可以实现这一点。首先，你可以在资源上链式调用 `response` 方法。该方法会返回一个 `Illuminate\Http\JsonResponse` 实例，让你可以完全控制响应的头：

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

或者，你可以在资源本身内部定义一个 `withResponse` 方法。当资源作为响应中最外层的资源被返回时，会调用该方法：

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
     * 为资源定制传出的响应。
     */
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->header('X-Value', 'True');
    }
}
```
