# Eloquent：API 资源

- [简介](#introduction)
- [生成资源](#generating-resources)
- [概念总览](#concept-overview)
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

构建 API 时，你可能需要一个转换层，位于 Eloquent 模型与实际返回给应用用户的 JSON 响应之间。例如，你可能希望只为一部分用户展示某些属性，或者希望在模型的 JSON 表示中始终包含某些关联。Eloquent 的资源类让你能够清晰而轻松地把模型和模型集合转换为 JSON。

当然，你也可以随时使用模型的 `toJson` 方法把 Eloquent 模型或集合转换为 JSON；不过，Eloquent 资源能让你对模型及其关联的 JSON 序列化拥有更精细、更健壮的控制。

<a name="generating-resources"></a>
## 生成资源

要生成资源类，可以使用 `make:resource` Artisan 命令。默认情况下，资源会被放到应用的 `app/Http/Resources` 目录中。资源继承 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

<a name="generating-resource-collections"></a>
#### 资源集合

除了生成用于转换单个模型的资源外，你还可以生成负责转换模型集合的资源。这样一来，你的 JSON 响应就能包含与整个资源集合相关的链接及其它元信息。

要创建资源集合，创建资源时应使用 `--collection` 标志。或者，在资源名称中包含单词 `Collection`，以此告知 Laravel 它应当创建集合资源。集合资源继承 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

<a name="concept-overview"></a>
## 概念总览

> [!NOTE]
> 这只是资源与资源集合的高层次概览。强烈建议你阅读本文档的其它章节，以更深入地理解资源为你提供的定制能力与强大功能。

在深入研究编写资源时可用的所有选项之前，我们先从高层次看看资源在 Laravel 中是如何使用的。资源类代表一个需要转换为 JSON 结构的模型。例如，下面是一个简单的 `UserResource` 资源类：

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

每个资源类都定义了一个 `toArray` 方法，返回一组属性。当资源作为响应从路由或控制器方法返回时，这组属性会被转换为 JSON。

注意，我们可以直接通过 `$this` 变量访问模型属性。这是因为资源类会自动把属性和方法访问代理到底层模型，从而提供便捷的访问方式。资源定义完毕后，就可以从路由或控制器返回它。资源通过构造函数接收底层模型实例：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function (string $id) {
        return new UserResource(User::findOrFail($id));
    });

<a name="resource-collections"></a>
### 资源集合

如果要返回一个资源集合或分页响应，在路由或控制器中创建资源实例时应使用资源类提供的 `collection` 方法：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all());
    });

注意，这种方式无法随集合一起返回任何需要添加的自定义元数据。如果你想定制资源集合的响应，可以创建一个专用的资源来表示该集合：

```shell
php artisan make:resource UserCollection
```

资源集合类生成后，你就可以轻松定义应随响应一起返回的任意元数据：

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

定义好资源集合后，就可以从路由或控制器返回它：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::all());
    });

<a name="preserving-collection-keys"></a>
#### 保留集合键

从路由返回资源集合时，Laravel 会重置集合的键，使其按数字顺序排列。不过，你可以在资源类上添加 `preserveKeys` 属性，用于指示是否应当保留集合原本的键：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\JsonResource;

    class UserResource extends JsonResource
    {
        /**
         * 指示是否应当保留资源的集合键。
         *
         * @var bool
         */
        public $preserveKeys = true;
    }

当 `preserveKeys` 属性被设为 `true` 时，从路由或控制器返回集合时会保留集合的键：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all()->keyBy->id);
    });

<a name="customizing-the-underlying-resource-class"></a>
#### 定制底层资源类

通常情况下，资源集合的 `$this->collection` 属性会自动填充为把集合中每一项映射到其单数资源类的结果。这个单数资源类被假定为集合类名去掉末尾 `Collection` 部分。此外，取决于你的个人偏好，单数资源类可以带 `Resource` 后缀，也可以不带。

例如，`UserCollection` 会尝试把给定的用户实例映射为 `UserResource` 资源。要定制该行为，你可以覆盖资源集合的 `$collects` 属性：

    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Resources\Json\ResourceCollection;

    class UserCollection extends ResourceCollection
    {
        /**
         * 该资源所收集的资源。
         *
         * @var string
         */
        public $collects = Member::class;
    }

<a name="writing-resources"></a>
## 编写资源

> [!NOTE]
> 如果你还没有阅读[概念总览](#concept-overview)，强烈建议你在继续阅读本文档前先读一遍。

资源只需要把给定模型转换为数组。因此，每个资源都包含一个 `toArray` 方法，把模型的属性转换为便于 API 使用的数组，以便从应用的路由或控制器返回：

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

资源定义完毕后，就可以直接从路由或控制器返回：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function (string $id) {
        return new UserResource(User::findOrFail($id));
    });

<a name="relationships"></a>
#### 关联

如果你想在响应中包含关联资源，可以把它们添加到资源 `toArray` 方法返回的数组中。在这个示例中，我们使用 `PostResource` 资源的 `collection` 方法把用户的博客文章添加到资源响应里：

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

> [!NOTE]
> 如果你只想在关联已经被加载时才包含它们，请查阅[条件关联](#conditional-relationships)的文档。

<a name="writing-resource-collections"></a>
#### 资源集合

资源把单个模型转换为数组，而资源集合则把模型集合转换为数组。不过，你并不一定需要为每个模型都定义资源集合类，因为所有资源都提供了 `collection` 方法，可以即时生成「临时」的资源集合：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/users', function () {
        return UserResource::collection(User::all());
    });

但是，如果你需要定制随集合返回的元数据，就必须定义自己的资源集合：

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

与单数资源一样，资源集合也可以直接从路由或控制器返回：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::all());
    });

<a name="data-wrapping"></a>
### 数据包装

默认情况下，资源响应被转换为 JSON 时，最外层资源会包裹在 `data` 键中。因此，例如，一个典型的资源集合响应看起来如下：

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

如果你想禁用最外层资源的包装，应当在基类 `Illuminate\Http\Resources\Json\JsonResource` 上调用 `withoutWrapping` 方法。通常，你应当在 `AppServiceProvider` 或另一个[服务提供者](/docs/{{version}}/providers)中调用该方法，这些提供者会在每次请求应用时被加载：

    <?php

    namespace App\Providers;

    use Illuminate\Http\Resources\Json\JsonResource;
    use Illuminate\Support\ServiceProvider;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * 注册任何应用服务。
         */
        public function register(): void
        {
            // ...
        }

        /**
         * 引导任何应用服务。
         */
        public function boot(): void
        {
            JsonResource::withoutWrapping();
        }
    }

> [!WARNING]
> `withoutWrapping` 方法只影响最外层的响应，不会移除你手动添加到自有资源集合中的 `data` 键。

<a name="wrapping-nested-resources"></a>
#### 包装嵌套资源

你可以完全自由地决定资源的关联如何被包装。如果你希望所有资源集合无论嵌套层级如何都包裹在 `data` 键中，就应当为每个资源定义资源集合类，并把集合返回在 `data` 键内。

你可能会担心这样会导致最外层资源被两个 `data` 键包裹。放心，Laravel 绝不会让你的资源被意外重复包裹，因此你无需担心所转换资源集合的嵌套层级：

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

<a name="data-wrapping-and-pagination"></a>
#### 数据包装与分页

通过资源响应返回分页集合时，即使已经调用了 `withoutWrapping` 方法，Laravel 仍会把资源数据包裹在 `data` 键中。这是因为分页响应总是包含 `meta` 和 `links` 键，用于描述分页器的状态：

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

你可以把 Laravel 分页器实例传给资源的 `collection` 方法，或传给自定义资源集合：

    use App\Http\Resources\UserCollection;
    use App\Models\User;

    Route::get('/users', function () {
        return new UserCollection(User::paginate());
    });

分页响应总是包含 `meta` 和 `links` 键，用于描述分页器的状态：

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
#### 定制分页信息

如果你想定制分页响应中 `links` 或 `meta` 键所包含的信息，可以在资源上定义 `paginationInformation` 方法。该方法会接收 `$paginated` 数据和 `$default` 信息数组，后者是包含 `links` 与 `meta` 键的数组：

    /**
     * 定制该资源的分页信息。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array $paginated
     * @param  array $default
     * @return array
     */
    public function paginationInformation($request, $paginated, $default)
    {
        $default['links']['custom'] = 'https://example.com';

        return $default;
    }

<a name="conditional-attributes"></a>
### 条件属性

有时你可能希望只在满足某个条件时才把某个属性包含进资源响应。例如，你可能希望只有当前用户是「管理员」时才包含某个值。Laravel 提供了多种辅助方法帮助你处理这种情况。`when` 方法可用于有条件地把属性添加到资源响应中：

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

在这个示例中，只有当已认证用户的 `isAdmin` 方法返回 `true` 时，`secret` 键才会出现在最终的资源响应中。如果该方法返回 `false`，`secret` 键会在发送到客户端之前从资源响应中被移除。`when` 方法让你无需在构建数组时依赖条件语句，就能清晰地定义资源。

`when` 方法的第二个参数还可以接受一个闭包，这样你就能仅在给定条件为 `true` 时才计算结果值：

    'secret' => $this->when($request->user()->isAdmin(), function () {
        return 'secret-value';
    }),

如果某个属性确实存在于底层模型上，可以使用 `whenHas` 方法把它包含进来：

    'name' => $this->whenHas('name'),

此外，如果某个属性不为 null，可以使用 `whenNotNull` 方法把它包含进资源响应：

    'name' => $this->whenNotNull($this->name),

<a name="merging-conditional-attributes"></a>
#### 合并条件属性

有时你有多个属性，它们应当基于同一个条件才包含进资源响应。这种情况下，你可以使用 `mergeWhen` 方法，仅在给定条件为 `true` 时把这些属性包含进响应：

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

同样地，如果给定条件为 `false`，这些属性会在发送到客户端之前从资源响应中被移除。

> [!WARNING]
> `mergeWhen` 方法不应当在混合了字符串键与数字键的数组中使用。此外，也不应当在键为数字但并非顺序排列的数组中使用。

<a name="conditional-relationships"></a>
### 条件关联

除了有条件地加载属性外，你还可以根据某个关联是否已在模型上被加载，有条件地把关联包含进资源响应。这样一来，控制器可以决定模型上应当加载哪些关联，而资源只需在它们确实已被加载时才把它们包含进来。归根结底，这让你更容易避免资源中出现「N+1」查询问题。

`whenLoaded` 方法可用于有条件地加载关联。为避免不必要地加载关联，该方法接受关联的名称，而不是关联本身：

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

在这个示例中，如果该关联尚未被加载，`posts` 键会在发送到客户端之前从资源响应中被移除。

<a name="conditional-relationship-counts"></a>
#### 条件关联计数

除了有条件地包含关联外，你还可以根据某个关联的计数是否已在模型上被加载，有条件地把关联「计数」包含进资源响应：

    new UserResource($user->loadCount('posts'));

`whenCounted` 方法可用于有条件地把某个关联的计数包含进资源响应。如果不存在该关联的计数，该方法可以避免无谓地包含该属性：

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

在这个示例中，如果 `posts` 关联的计数尚未被加载，`posts_count` 键会在发送到客户端之前从资源响应中被移除。

其它类型的聚合值，例如 `avg`、`sum`、`min` 和 `max`，也可以使用 `whenAggregated` 方法有条件地加载：

```php
'words_avg' => $this->whenAggregated('posts', 'words', 'avg'),
'words_sum' => $this->whenAggregated('posts', 'words', 'sum'),
'words_min' => $this->whenAggregated('posts', 'words', 'min'),
'words_max' => $this->whenAggregated('posts', 'words', 'max'),
```

<a name="conditional-pivot-information"></a>
#### 条件中间表信息

除了在资源响应中有条件地包含关联信息外，你还可以使用 `whenPivotLoaded` 方法，有条件地包含多对多关联的中间表数据。`whenPivotLoaded` 方法的第一个参数接受中间表的名称。第二个参数应当是一个闭包，它返回在模型上存在中间表信息时要返回的值：

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

如果你的关联使用了[自定义中间表模型](/docs/{{version}}/eloquent-relationships#defining-custom-intermediate-table-models)，可以把中间表模型的实例作为 `whenPivotLoaded` 方法的第一个参数传入：

    'expires_at' => $this->whenPivotLoaded(new Membership, function () {
        return $this->pivot->expires_at;
    }),

如果你的中间表使用的访问器不是 `pivot`，可以使用 `whenPivotLoadedAs` 方法：

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

<a name="adding-meta-data"></a>
### 添加元数据

某些 JSON API 标准要求在资源和资源集合的响应中加入元数据。这通常包括指向资源或关联资源的 `links`，或关于资源本身的元数据。如果你需要返回关于资源的额外元数据，把它包含在 `toArray` 方法中即可。例如，你可以在转换资源集合时包含 `links` 信息：

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

从资源返回额外元数据时，你完全不必担心会意外覆盖 Laravel 在返回分页响应时自动添加的 `links` 或 `meta` 键。你定义的任何额外 `links` 都会与分页器提供的链接合并。

<a name="top-level-meta-data"></a>
#### 顶层元数据

有时你可能希望只有当资源是所返回的最外层资源时，才把某些元数据包含进资源响应。这通常包括关于整个响应的元信息。要定义这类元数据，请在你的资源类中添加 `with` 方法。该方法应当返回一个元数据数组，仅当该资源是被转换的最外层资源时，才会随资源响应一起返回：

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

<a name="adding-meta-data-when-constructing-resources"></a>
#### 构建资源时添加元数据

你也可以在路由或控制器中构建资源实例时添加顶层数据。所有资源上都可用的 `additional` 方法接受一个数据数组，该数组会被添加到资源响应中：

    return (new UserCollection(User::all()->load('roles')))
        ->additional(['meta' => [
            'key' => 'value',
        ]]);

<a name="resource-responses"></a>
## 资源响应

如你所读到的，资源可以直接从路由和控制器返回：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user/{id}', function (string $id) {
        return new UserResource(User::findOrFail($id));
    });

不过，有时你需要在发出的 HTTP 响应被发送到客户端之前对其加以定制。为此有两种方式。第一种，你可以把 `response` 方法链式调用到资源上。该方法返回一个 `Illuminate\Http\JsonResponse` 实例，让你完全控制响应的响应头：

    use App\Http\Resources\UserResource;
    use App\Models\User;

    Route::get('/user', function () {
        return (new UserResource(User::find(1)))
            ->response()
            ->header('X-Value', 'True');
    });

此外，你可以在资源自身内部定义 `withResponse` 方法。当资源作为最外层资源在响应中返回时，该方法会被调用：

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
         * 定制该资源发出的响应。
         */
        public function withResponse(Request $request, JsonResponse $response): void
        {
            $response->header('X-Value', 'True');
        }
    }
