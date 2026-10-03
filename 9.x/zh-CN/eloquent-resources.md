# Eloquent：API 资源

- [简介](#introduction)
- [生成资源](#generating-resources)
- [概念概述](#concept-overview)
    - [资源集合](#resource-collections)
- [编写资源](#writing-resources)
    - [数据包装](#data-wrapping)
    - [分页](#pagination)
    - [条件属性](#conditional-attributes)
    - [条件关联](#conditional-relationships)
    - [添加元数据](#adding-meta-data)
- [资源响应](#resource-responses)

<a name="introduction"></a>
## 简介

构建 API 时，可能需要一个位于 Eloquent 模型和实际返回给应用用户的 JSON 响应之间的转换层。例如，可能希望为部分用户显示某些属性而不为其他用户显示，或者始终在模型的 JSON 表示中包含某些关联。Eloquent 的资源类允许以表达性强且简单的方式将模型和模型集合转换为 JSON。

当然，始终可以使用 `toJson` 方法将 Eloquent 模型或集合转换为 JSON；但 Eloquent 资源对模型及其关联的 JSON 序列化提供了更精细和更健壮的控制。

<a name="generating-resources"></a>
## 生成资源

要生成资源类，可以使用 `make:resource` Artisan 命令。默认情况下，资源将放置在应用的 `app/Http/Resources` 目录中。资源继承 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

<a name="generating-resource-collections"></a>
#### 资源集合

除了生成转换单个模型的资源外，还可以生成负责转换模型集合的资源。这允许 JSON 响应包含与整个给定资源集合相关的链接和其他元信息。

要创建资源集合，创建资源时应使用 `--collection` 标志。或者在资源名称中包含 `Collection` 一词，以指示 Laravel 应创建集合资源。集合资源继承 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

<a name="concept-overview"></a>
## 概念概述

> **Note**  
> 这是对资源和资源集合的高层次概述。强烈建议阅读本文档的其他章节，以深入了解资源提供的自定义和功能。

在深入了解编写资源时的所有选项之前，先高层次地看一下资源在 Laravel 中的使用方式。资源类表示需要转换为 JSON 结构的单个模型。例如，以下是一个简单的 `UserResource` 资源类：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 将资源转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
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

每个资源类定义一个 `toArray` 方法，返回当资源作为路由或控制器方法的响应返回时应转换为 JSON 的属性数组。

注意可以直接从 `$this` 变量访问模型属性。这是因为资源类会自动将属性和方法访问代理到底层模型以方便访问。定义资源后，可以从路由或控制器返回。资源通过其构造函数接受底层模型实例：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function ($id) {
        return new UserResource(User::findOrFail($id));
    });

<a name="resource-collections"></a>
### 资源集合

如果返回资源集合或分页响应，应在路由或控制器中创建资源实例时使用资源类提供的 `collection` 方法：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all());
    });

注意这不允许添加可能需要随集合返回的任何自定义元数据。如果希望自定义资源集合响应，可以创建一个专用资源来表示该集合：

```shell
php artisan make:resource UserCollection
```

生成资源集合类后，可以轻松定义应包含在响应中的任何元数据：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class UserCollection extends ResourceCollection
    {
        /**
         * 将资源集合转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
        {
            return [
                'data' => $this->collection,
                'links' => [
                    'self' => 'link-value',
                ],
            ];
        }
    }

定义资源集合后，可以从路由或控制器返回：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::all());
    });

<a name="preserving-collection-keys"></a>
#### 保留集合键

从路由返回资源集合时，Laravel 会重置集合的键使其按数字顺序排列。但可以在资源类中添加 `preserveKeys` 属性，指示是否应保留集合的原始键：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 指示是否应保留资源的集合键。
         *
         * @var bool
         */
        public $preserveKeys = true;
    }

当 `preserveKeys` 属性设置为 `true` 时，从路由或控制器返回集合时将保留集合键：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all()->keyBy->id);
    });

<a name="customizing-the-underlying-resource-class"></a>
#### 自定义底层资源类

通常，资源集合的 `$this->collection` 属性会自动填充，方式是将集合的每个项映射到其单一资源类。单一资源类被假定为集合类名去除末尾 `Collection` 部分后的类名。此外，根据个人偏好，单一资源类可以带有或不带有 `Resource` 后缀。

例如，`UserCollection` 将尝试将给定的用户实例映射到 `UserResource` 资源。要自定义此行为，可以覆盖资源集合的 `$collects` 属性：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class UserCollection extends ResourceCollection
    {
        /**
         * 此资源收集的资源。
         *
         * @var string
         */
        public $collects = Member::class;
    }

<a name="writing-resources"></a>
## 编写资源

> **Note**  
> 如果尚未阅读[概念概述](#concept-overview)，强烈建议在继续阅读本文档之前先阅读。

本质上，资源很简单。它们只需将给定模型转换为数组。因此，每个资源包含一个 `toArray` 方法，将模型的属性转换为可从应用路由或控制器返回的 API 友好数组：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 将资源转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
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

定义资源后，可以直接从路由或控制器返回：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function ($id) {
        return new UserResource(User::findOrFail($id));
    });

<a name="relationships"></a>
#### 关联

如果希望在响应中包含关联资源，可以将它们添加到资源 `toArray` 方法返回的数组中。在此示例中，使用 `PostResource` 资源的 `collection` 方法将用户的博客文章添加到资源响应中：

    use App\Http\Resources\PostResource;

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
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

> **Note**  
> 如果希望仅在关联已加载时才包含关联，请查阅[条件关联](#conditional-relationships)文档。

<a name="writing-resource-collections"></a>
#### 资源集合

资源将单个模型转换为数组，而资源集合将模型集合转换为数组。但并非必须为每个模型定义资源集合类，因为所有资源都提供 `collection` 方法用于即时生成"临时"资源集合：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all());
    });

但如果需要自定义随集合返回的元数据，则需要定义自己的资源集合：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class UserCollection extends ResourceCollection
    {
        /**
         * 将资源集合转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
        {
            return [
                'data' => $this->collection,
                'links' => [
                    'self' => 'link-value',
                ],
            ];
        }
    }

与单一资源一样，资源集合可以直接从路由或控制器返回：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::all());
    });

<a name="data-wrapping"></a>
### 数据包装

默认情况下，最外层资源在资源响应转换为 JSON 时会包装在 `data` 键中。例如，典型的资源集合响应如下所示：

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

如果希望使用自定义键而非 `data`，可以在资源类上定义 `$wrap` 属性：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 应应用的 "data" 包装。
         *
         * @var string|null
         */
        public static $wrap = 'user';
    }

如果希望禁用最外层资源的包装，应在基础 `Illuminate\Http\Resources\Json\JsonResource` 类上调用 `withoutWrapping` 方法。通常，应从 `AppServiceProvider` 或其他在应用每个请求时加载的[服务提供者](/docs/{{version}}/providers)中调用此方法：

    <?php

    namespace App\Providers;

    use Illuminate\Http\Resources\Json\JsonResource;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         *
         * @return void
         */
        public function register()
        {
            //
        }

        /**
         * 引导任何应用服务。
         *
         * @return void
         */
        public function boot()
        {
            JsonResource::withoutWrapping();
        }
    }

> **Warning**  
> `withoutWrapping` 方法仅影响最外层响应，不会移除手动添加到自己的资源集合中的 `data` 键。

<a name="wrapping-nested-resources"></a>
#### 包装嵌套资源

可以完全自由地决定资源的关联如何包装。如果希望所有资源集合都包装在 `data` 键中，无论其嵌套层级如何，应为每个资源定义资源集合类，并在 `data` 键中返回集合。

可能担心这会导致最外层资源被包装在两个 `data` 键中。不用担心，Laravel 永远不会让资源被意外双重包装，因此不必关心正在转换的资源集合的嵌套层级：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class CommentsCollection extends ResourceCollection
    {
        /**
         * 将资源集合转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
        {
            return ['data' => $this->collection];
        }
    }

<a name="data-wrapping-and-pagination"></a>
#### 数据包装与分页

通过资源响应返回分页集合时，即使已调用 `withoutWrapping` 方法，Laravel 也会将资源数据包装在 `data` 键中。这是因为分页响应始终包含 `meta` 和 `links` 键，其中包含有关分页器状态的信息：

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
        "first": "http://example.com/pagination?page=1",
        "last": "http://example.com/pagination?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/pagination",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="pagination"></a>
### 分页

可以将 Laravel 分页器实例传递给资源的 `collection` 方法或自定义资源集合：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::paginate());
    });

分页响应始终包含 `meta` 和 `links` 键，其中包含有关分页器状态的信息：

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
        "first": "http://example.com/pagination?page=1",
        "last": "http://example.com/pagination?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/pagination",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="conditional-attributes"></a>
### 条件属性

有时可能希望仅在满足给定条件时才在资源响应中包含某个属性。例如，可能希望仅在当前用户是"管理员"时才包含某个值。Laravel 提供了多种辅助方法来帮助处理此情况。可以使用 `when` 方法有条件地将属性添加到资源响应中：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
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

在此示例中，仅当已认证用户的 `isAdmin` 方法返回 `true` 时，`secret` 键才会包含在最终资源响应中。如果方法返回 `false`，`secret` 键将在响应发送到客户端之前从资源响应中移除。`when` 方法允许在构建数组时表达性地定义资源，而无需使用条件语句。

`when` 方法还接受闭包作为第二个参数，允许仅在给定条件为 `true` 时才计算结果值：

    'secret' => $this->when($request->user()->isAdmin(), function () {
        return 'secret-value';
    }),

可以使用 `whenHas` 方法在属性实际存在于底层模型时才包含该属性：

    'name' => $this->whenHas('name'),

此外，可以使用 `whenNotNull` 方法在属性不为 null 时将其包含在资源响应中：

    'name' => $this->whenNotNull($this->name),

<a name="merging-conditional-attributes"></a>
#### 合并条件属性

有时可能有多个属性应基于同一条件包含在资源响应中。此时，可以使用 `mergeWhen` 方法仅在给定条件为 `true` 时才将这些属性包含在响应中：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
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

同样，如果给定条件为 `false`，这些属性将在响应发送到客户端之前从资源响应中移除。

> **Warning**  
> `mergeWhen` 方法不应在混合字符串和数字键的数组中使用。此外，不应在数字键非顺序排列的数组中使用。

<a name="conditional-relationships"></a>
### 条件关联

除了有条件地加载属性外，还可以根据关联是否已在模型上加载来有条件地在资源响应中包含关联。这允许控制器决定应在模型上加载哪些关联，而资源可以仅在它们实际已加载时才包含。最终，这使在资源中避免"N+1"查询问题变得更容易。

可以使用 `whenLoaded` 方法有条件地加载关联。为避免不必要地加载关联，此方法接受关联的名称而非关联本身：

    use App\Http\Resources\PostResource;

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
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

在此示例中，如果关联尚未加载，`posts` 键将在响应发送到客户端之前从资源响应中移除。

<a name="conditional-relationship-counts"></a>
#### 条件关联计数

除了有条件地包含关联外，还可以根据关联的计数是否已在模型上加载来有条件地在资源响应中包含关联"计数"：

    new UserResource($user->loadCount('posts'));

可以使用 `whenCounted` 方法有条件地在资源响应中包含关联的计数。此方法避免在关联计数不存在时不必要地包含该属性：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
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

在此示例中，如果 `posts` 关联的计数尚未加载，`posts_count` 键将在响应发送到客户端之前从资源响应中移除。

<a name="conditional-pivot-information"></a>
#### 条件中间表信息

除了有条件地在资源响应中包含关联信息外，还可以使用 `whenPivotLoaded` 方法有条件地包含多对多关联中间表的数据。`whenPivotLoaded` 方法接受中间表名称作为第一个参数。第二个参数应是一个闭包，在中间表信息在模型上可用时返回要返回的值：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'expires_at' => $this->whenPivotLoaded('role_user', function () {
                return $this->pivot->expires_at;
            }),
        ];
    }

如果关联使用[自定义中间表模型](/docs/{{version}}/eloquent-relationships#defining-custom-intermediate-table-models)，可以将中间表模型实例作为第一个参数传递给 `whenPivotLoaded` 方法：

    'expires_at' => $this->whenPivotLoaded(new Membership, function () {
        return $this->pivot->expires_at;
    }),

如果中间表使用 `pivot` 以外的访问器，可以使用 `whenPivotLoadedAs` 方法：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'expires_at' => $this->whenPivotLoadedAs('subscription', 'role_user', function () {
                return $this->subscription->expires_at;
            }),
        ];
    }

<a name="adding-meta-data"></a>
### 添加元数据

一些 JSON API 标准要求在资源和资源集合响应中添加元数据。这通常包括指向资源或相关资源的 `links`，或关于资源本身的元数据。如果需要返回关于资源的额外元数据，将其包含在 `toArray` 方法中。例如，转换资源集合时可能包含 `link` 信息：

    /**
     * 将资源转换为数组。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }

从资源返回额外元数据时，不必担心意外覆盖返回分页响应时 Laravel 自动添加的 `links` 或 `meta` 键。定义的任何额外 `links` 将与分页器提供的链接合并。

<a name="top-level-meta-data"></a>
#### 顶层元数据

有时可能希望仅在资源是最外层返回的资源时才在资源响应中包含某些元数据。通常，这包括关于响应整体的元信息。要定义此元数据，在资源类中添加 `with` 方法。此方法应返回一个元数据数组，仅在资源是被转换的最外层资源时才包含在资源响应中：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class UserCollection extends ResourceCollection
    {
        /**
         * 将资源集合转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
        {
            return parent::toArray($request);
        }

        /**
         * 获取应随资源数组返回的额外数据。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function with($request)
        {
            return [
                'meta' => [
                    'key' => 'value',
                ],
            ];
        }
    }

<a name="adding-meta-data-when-constructing-resources"></a>
#### 构造资源时添加元数据

也可以在路由或控制器中构造资源实例时添加顶层数据。`additional` 方法在所有资源上均可用，接受应添加到资源响应的数据数组：

    return (new UserCollection(User::all()->load('roles')))
                    ->additional(['meta' => [
                        'key' => 'value',
                    ]]);

<a name="resource-responses"></a>
## 资源响应

如前所述，资源可以直接从路由和控制器返回：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function ($id) {
        return new UserResource(User::findOrFail($id));
    });

但有时可能需要在发送到客户端之前自定义传出的 HTTP 响应。有两种方式实现。首先，可以在资源上链式调用 `response` 方法。此方法将返回 `Illuminate\Http\JsonResponse` 实例，从而完全控制响应的头信息：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user', function () {
        return (new UserResource(User::find(1)))
                    ->response()
                    ->header('X-Value', 'True');
    });

或者，可以在资源本身中定义 `withResponse` 方法。当资源作为响应中最外层资源返回时将调用此方法：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 将资源转换为数组。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return array
         */
        public function toArray($request)
        {
            return [
                'id' => $this->id,
            ];
        }

        /**
         * 自定义资源的传出响应。
         *
         * @param  \Illuminate\Http\Request  $request
         * @param  \Illuminate\Http\Response  $response
         * @return void
         */
        public function withResponse($request, $response)
        {
            $response->header('X-Value', 'True');
        }
    }
