# 广播

- [简介](#introduction)
- [服务端安装](#server-side-installation)
    - [配置](#configuration)
    - [Reverb](#reverb)
    - [Pusher Channels](#pusher-channels)
    - [Ably](#ably)
- [客户端安装](#client-side-installation)
    - [Reverb](#client-reverb)
    - [Pusher Channels](#client-pusher-channels)
    - [Ably](#client-ably)
- [概念概览](#concept-overview)
    - [使用示例应用](#using-example-application)
- [定义广播事件](#defining-broadcast-events)
    - [广播名称](#broadcast-name)
    - [广播数据](#broadcast-data)
    - [广播队列](#broadcast-queue)
    - [广播条件](#broadcast-conditions)
    - [广播与数据库事务](#broadcasting-and-database-transactions)
- [授权频道](#authorizing-channels)
    - [定义授权回调](#defining-authorization-callbacks)
    - [定义频道类](#defining-channel-classes)
- [广播事件](#broadcasting-events)
    - [只广播给其他人](#only-to-others)
    - [自定义连接](#customizing-the-connection)
    - [匿名事件](#anonymous-events)
- [接收广播](#receiving-broadcasts)
    - [监听事件](#listening-for-events)
    - [离开频道](#leaving-a-channel)
    - [命名空间](#namespaces)
- [Presence 频道](#presence-channels)
    - [授权 Presence 频道](#authorizing-presence-channels)
    - [加入 Presence 频道](#joining-presence-channels)
    - [向 Presence 频道广播](#broadcasting-to-presence-channels)
- [模型广播](#model-broadcasting)
    - [模型广播约定](#model-broadcasting-conventions)
    - [监听模型广播](#listening-for-model-broadcasts)
- [客户端事件](#client-events)
- [通知](#notifications)

<a name="introduction"></a>
## 简介

在许多现代 Web 应用中，WebSockets 被用于实现实时更新的用户界面。当服务端某些数据发生更新时，通常会通过 WebSocket 连接发送一条消息，由客户端处理。相比不断轮询应用服务端以检测数据变化并同步到 UI，WebSockets 提供了更高效的方案。

例如，假设你的应用可以把用户数据导出为 CSV 文件并通过邮件发送给他们。不过，生成这个 CSV 文件需要几分钟，因此你选择在一个[队列任务](/docs/{{version}}/queues)中创建并发送该 CSV。CSV 创建并邮件发送给用户之后，我们就可以使用事件广播分发一个 `App\Events\UserDataExported` 事件，由应用的 JavaScript 接收。事件收到后，我们就能向用户显示一条消息，说明他们的 CSV 已通过邮件发送，无需用户刷新页面。

为协助你构建这类功能，Laravel 让你可以轻松地通过 WebSocket 连接"广播"服务端的 Laravel [事件](/docs/{{version}}/events)。广播 Laravel 事件，让你可以在服务端 Laravel 应用与客户端 JavaScript 应用之间共享相同的事件名称和数据。

广播背后的核心概念很简单：客户端在前端连接到具名频道，而 Laravel 应用在后端向这些频道广播事件。这些事件可以包含任何你希望提供给前端的额外数据。

<a name="supported-drivers"></a>
#### 支持的驱动

默认情况下，Laravel 内置三种服务端广播驱动供你选择：[Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com)。

> [!NOTE]
> 在深入事件广播之前，请确保你已经阅读了 Laravel 关于[事件与监听器](/docs/{{version}}/events)的文档。

<a name="server-side-installation"></a>
## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用中做一些配置，并安装若干软件包。

事件广播由服务端的广播驱动完成，它会广播你的 Laravel 事件，让 Laravel Echo（一个 JavaScript 库）能够在浏览器客户端中接收这些事件。别担心——我们会一步步带你完成整个安装过程。

<a name="configuration"></a>
### 配置

应用的所有事件广播配置都存放在 `config/broadcasting.php` 配置文件中。如果你的应用中还没有该目录，也不用担心；运行 `install:broadcasting` Artisan 命令时它会被创建。

Laravel 开箱即支持多种广播驱动：[Laravel Reverb](/docs/{{version}}/reverb)、[Pusher Channels](https://pusher.com/channels)、[Ably](https://ably.com)，以及用于本地开发与调试的 `log` 驱动。此外还包含一个 `null` 驱动，允许你在测试期间禁用广播。`config/broadcasting.php` 配置文件中为上述每个驱动都提供了配置示例。

<a name="installation"></a>
#### 安装

默认情况下，新建 Laravel 应用中未启用广播。你可以使用 `install:broadcasting` Artisan 命令启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令会创建 `config/broadcasting.php` 配置文件。此外，该命令还会创建 `routes/channels.php` 文件，你可以在其中注册应用的广播授权路由与回调。

<a name="queue-configuration"></a>
#### 队列配置

在广播任何事件之前，你应当先配置并运行一个[队列工作进程](/docs/{{version}}/queues)。所有事件广播都通过队列任务完成，以免事件广播严重影响应用的响应时间。

<a name="reverb"></a>
### Reverb

运行 `install:broadcasting` 命令时，系统会提示你安装 [Laravel Reverb](/docs/{{version}}/reverb)。当然，你也可以使用 Composer 包管理器手动安装 Reverb。

```sh
composer require laravel/reverb
```

软件包安装完成后，你可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的环境变量，并在应用中启用事件广播：

```sh
php artisan reverb:install
```

你可以在 [Reverb 文档](/docs/{{version}}/reverb)中查看详细的 Reverb 安装与使用说明。

<a name="pusher-channels"></a>
### Pusher Channels

如果你计划使用 [Pusher Channels](https://pusher.com/channels) 广播事件，应使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，你应当在 `config/broadcasting.php` 配置文件中配置 Pusher Channels 凭据。该文件中已包含一份 Pusher Channels 配置示例，方便你快速指定 key、secret 与应用 ID。通常你应当在应用的 `.env` 文件中配置 Pusher Channels 凭据：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许你指定 Channels 支持的其他 `options`，例如集群（cluster）。

然后，在应用的 `.env` 文件中把 `BROADCAST_CONNECTION` 环境变量设为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它会在客户端接收广播事件。

<a name="ably"></a>
### Ably

> [!NOTE]
> 下面的文档讨论如何以"Pusher 兼容"模式使用 Ably。不过 Ably 团队推荐并维护了一个广播器与 Echo 客户端，能够充分利用 Ably 提供的独特能力。有关使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

如果你计划使用 [Ably](https://ably.com) 广播事件，应使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，你应当在 `config/broadcasting.php` 配置文件中配置 Ably 凭据。该文件中已包含一份 Ably 配置示例，方便你快速指定 key。通常应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration)设置该值：

```ini
ABLY_KEY=your-ably-key
```

然后，在应用的 `.env` 文件中把 `BROADCAST_CONNECTION` 环境变量设为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它会在客户端接收广播事件。

<a name="client-side-installation"></a>
## 客户端安装

<a name="client-reverb"></a>
### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让你能够轻松订阅频道并监听由服务端广播驱动广播的事件。你可以通过 NPM 包管理器安装 Echo。在本例中，我们还会安装 `pusher-js` 包，因为 Reverb 在 WebSocket 订阅、频道与消息方面使用了 Pusher 协议：

```shell
npm install --save-dev laravel-echo pusher-js
```

Echo 安装完成后，你就可以在应用的 JavaScript 中创建一个全新的 Echo 实例。一个很好的位置是 Laravel 框架自带的 `resources/js/bootstrap.js` 文件末尾。该文件中默认已包含一份 Echo 配置示例——你只需取消注释，并把 `broadcaster` 配置选项改为 `reverb`：

```js
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

接下来，你应当编译应用的资源文件：

```shell
npm run build
```

> [!WARNING]
> Laravel Echo 的 `reverb` 广播器需要 laravel-echo v1.16.0 及以上版本。

<a name="client-pusher-channels"></a>
### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让你能够轻松订阅频道并监听由服务端广播驱动广播的事件。Echo 还利用 `pusher-js` NPM 包实现了 Pusher 协议，用于 WebSocket 订阅、频道与消息。

`install:broadcasting` Artisan 命令会自动为你安装 `laravel-echo` 与 `pusher-js` 包；不过你也可以通过 NPM 手动安装这些包：

```shell
npm install --save-dev laravel-echo pusher-js
```

Echo 安装完成后，你就可以在应用的 JavaScript 中创建一个全新的 Echo 实例。`install:broadcasting` 命令会在 `resources/js/echo.js` 处创建 Echo 配置文件；不过该文件中的默认配置是为 Laravel Reverb 准备的。你可以把下面的配置复制过去，把配置切换到 Pusher：

```js
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});
```

接下来，你应当在应用的 `.env` 文件中为 Pusher 环境变量定义相应的值。如果 `.env` 文件中还没有这些变量，应当把它们添加进去：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

按应用需求调整好 Echo 配置后，你就可以编译应用的资源文件：

```shell
npm run build
```

> [!NOTE]
> 若想了解更多关于编译应用 JavaScript 资源的信息，请查阅 [Vite](/docs/{{version}}/vite) 相关文档。

<a name="using-an-existing-client-instance"></a>
#### 使用已有的客户端实例

如果你已经有一个预配置好的 Pusher Channels 客户端实例，并希望 Echo 使用它，可以通过 `client` 配置选项把它传给 Echo：

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const options = {
    broadcaster: 'pusher',
    key: 'your-pusher-channels-key'
}

window.Echo = new Echo({
    ...options,
    client: new Pusher(options.key, options)
});
```

<a name="client-ably"></a>
### Ably

> [!NOTE]
> 下面的文档讨论如何以"Pusher 兼容"模式使用 Ably。不过 Ably 团队推荐并维护了一个广播器与 Echo 客户端，能够充分利用 Ably 提供的独特能力。有关使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让你能够轻松订阅频道并监听由服务端广播驱动广播的事件。Echo 还利用 `pusher-js` NPM 包实现了 Pusher 协议，用于 WebSocket 订阅、频道与消息。

`install:broadcasting` Artisan 命令会自动为你安装 `laravel-echo` 与 `pusher-js` 包；不过你也可以通过 NPM 手动安装这些包：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应当在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置仪表板的"Protocol Adapter Settings"部分启用该功能。**

Echo 安装完成后，你就可以在应用的 JavaScript 中创建一个全新的 Echo 实例。`install:broadcasting` 命令会在 `resources/js/echo.js` 处创建 Echo 配置文件；不过该文件中的默认配置是为 Laravel Reverb 准备的。你可以把下面的配置复制过去，把配置切换到 Ably：

```js
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    wsHost: 'realtime-pusher.ably.io',
    wsPort: 443,
    disableStats: true,
    encrypted: true,
});
```

你可能已经注意到，我们的 Ably Echo 配置引用了 `VITE_ABLY_PUBLIC_KEY` 环境变量。该变量的值应当是你的 Ably 公钥。公钥是 Ably 密钥中 `:` 字符之前的部分。

按需求调整好 Echo 配置后，你就可以编译应用的资源文件：

```shell
npm run dev
```

> [!NOTE]
> 若想了解更多关于编译应用 JavaScript 资源的信息，请查阅 [Vite](/docs/{{version}}/vite) 相关文档。

<a name="concept-overview"></a>
## 概念概览

Laravel 的事件广播让你可以借助基于驱动的 WebSocket 方案，把服务端的 Laravel 事件广播到客户端 JavaScript 应用。目前 Laravel 内置了 [Pusher Channels](https://pusher.com/channels) 与 [Ably](https://ably.com) 驱动。客户端可以借助 [Laravel Echo](#client-side-installation) JavaScript 包轻松消费这些事件。

事件通过"频道"广播，频道可以是公开的或私有的。任何访问你应用的访客都可以订阅公开频道，无需任何认证或授权；但要订阅私有频道，用户必须先完成认证，并获得该频道的收听授权。

<a name="using-example-application"></a>
### 使用示例应用

在深入事件广播的各个组件之前，我们先以一个电商商店为例，从宏观角度了解一下整体流程。

在我们的应用中，假设有一个页面允许用户查看自己订单的物流状态。同时假设应用处理物流状态更新时会触发 `OrderShipmentStatusUpdated` 事件：

    use App\Events\OrderShipmentStatusUpdated;

    OrderShipmentStatusUpdated::dispatch($order);

<a name="the-shouldbroadcast-interface"></a>
#### `ShouldBroadcast` 接口

当用户正在查看自己的某个订单时，我们不希望他们必须刷新页面才能看到状态更新。相反，我们希望在更新产生时就广播给应用。因此，需要用 `ShouldBroadcast` 接口标记 `OrderShipmentStatusUpdated` 事件。这会指示 Laravel 在事件触发时广播它：

    <?php

    namespace App\Events;

    use App\Models\Order;
    use Illuminate\Broadcasting\Channel;
    use Illuminate\Broadcasting\InteractsWithSockets;
    use Illuminate\Broadcasting\PresenceChannel;
    use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
    use Illuminate\Queue\SerializesModels;

    class OrderShipmentStatusUpdated implements ShouldBroadcast
    {
        /**
         * 订单实例。
         *
         * @var \App\Models\Order
         */
        public $order;
    }

`ShouldBroadcast` 接口要求事件定义 `broadcastOn` 方法。该方法负责返回事件应当在哪些频道上广播。生成的事件类中已经定义了该方法的空桩实现，因此我们只需填写具体细节。我们只希望订单的创建者能够查看状态更新，所以会把事件广播到一个与该订单绑定的私有频道：

    use Illuminate\Broadcasting\Channel;
    use Illuminate\Broadcasting\PrivateChannel;

    /**
     * 获取该事件应当在哪个频道上广播。
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('orders.'.$this->order->id);
    }

如果你希望事件在多个频道上广播，可以改为返回一个 `array`：

    use Illuminate\Broadcasting\PrivateChannel;

    /**
     * 获取该事件应当在哪些频道上广播。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('orders.'.$this->order->id),
            // ...
        ];
    }

<a name="example-application-authorizing-channels"></a>
#### 授权频道

请记住，用户必须获得授权才能收听私有频道。我们可以在应用的 `routes/channels.php` 文件中定义频道授权规则。在本例中，我们需要验证任何尝试收听私有 `orders.1` 频道的用户确实是该订单的创建者：

    use App\Models\Order;
    use App\Models\User;

    Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
        return $user->id === Order::findOrNew($orderId)->user_id;
    });

`channel` 方法接受两个参数：频道名称，以及一个返回 `true` 或 `false` 的回调，用来指示用户是否被授权收听该频道。

所有授权回调都会把当前已认证用户作为第一个参数，其余通配参数作为后续参数。在本例中，我们使用 `{orderId}` 占位符表示频道名称中的"ID"部分是通配的。

<a name="listening-for-event-broadcasts"></a>
#### 监听事件广播

接下来，只剩下在 JavaScript 应用中监听该事件。我们可以使用 [Laravel Echo](#client-side-installation) 来完成。先用 `private` 方法订阅私有频道，然后用 `listen` 方法监听 `OrderShipmentStatusUpdated` 事件。默认情况下，事件的所有公共属性都会被包含在广播事件中：

```js
Echo.private(`orders.${orderId}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order);
    });
```

<a name="defining-broadcast-events"></a>
## 定义广播事件

要告知 Laravel 某个事件应当被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。框架生成的所有事件类都已经导入了该接口，因此你可以轻松把它加到自己的任何事件上。

`ShouldBroadcast` 接口要求你实现一个方法：`broadcastOn`。`broadcastOn` 方法应返回一个频道或一组频道，事件将在这些频道上广播。这些频道应为 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 实例表示任何用户都可以订阅的公开频道，而 `PrivateChannels` 与 `PresenceChannels` 表示需要[频道授权](#authorizing-channels)的私有频道：

    <?php

    namespace App\Events;

    use App\Models\User;
    use Illuminate\Broadcasting\Channel;
    use Illuminate\Broadcasting\InteractsWithSockets;
    use Illuminate\Broadcasting\PresenceChannel;
    use Illuminate\Broadcasting\PrivateChannel;
    use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
    use Illuminate\Queue\SerializesModels;

    class ServerCreated implements ShouldBroadcast
    {
        use SerializesModels;

        /**
         * 创建一个新的事件实例。
         */
        public function __construct(
            public User $user,
        ) {}

        /**
         * 获取该事件应当在哪些频道上广播。
         *
         * @return array<int, \Illuminate\Broadcasting\Channel>
         */
        public function broadcastOn(): array
        {
            return [
                new PrivateChannel('user.'.$this->user->id),
            ];
        }
    }

实现 `ShouldBroadcast` 接口后，你只需像平常一样[触发该事件](/docs/{{version}}/events)。事件一旦触发，[队列任务](/docs/{{version}}/queues)就会自动使用你指定的广播驱动来广播它。

<a name="broadcast-name"></a>
### 广播名称

默认情况下，Laravel 会使用事件的类名来广播该事件。不过，你可以在事件上定义 `broadcastAs` 方法来自定义广播名称：

    /**
     * 事件的广播名称。
     */
    public function broadcastAs(): string
    {
        return 'server.created';
    }

如果使用 `broadcastAs` 方法自定义了广播名称，注册监听器时必须加上前导的 `.` 字符。这会指示 Echo 不要为事件添加应用命名空间前缀：

    .listen('.server.created', function (e) {
        ....
    });

<a name="broadcast-data"></a>
### 广播数据

事件被广播时，它的所有 `public` 属性都会自动序列化，并作为事件的载荷一起广播，让你可以在 JavaScript 应用中访问它的任意公开数据。因此，例如，如果你的事件只有一个包含 Eloquent 模型的公开 `$user` 属性，那么该事件的广播载荷如下：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

不过，如果你希望对广播载荷有更精细的控制，可以在事件上添加 `broadcastWith` 方法。该方法应返回你希望作为事件载荷广播的数据数组：

    /**
     * 获取要广播的数据。
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['id' => $this->user->id];
    }

<a name="broadcast-queue"></a>
### 广播队列

默认情况下，每个广播事件都会被放入 `queue.php` 配置文件中指定为默认队列连接的默认队列。你可以在事件类上定义 `connection` 与 `queue` 属性，来自定义广播器所使用的队列连接与名称：

    /**
     * 广播该事件时使用的队列连接名称。
     *
     * @var string
     */
    public $connection = 'redis';

    /**
     * 放置广播任务的队列名称。
     *
     * @var string
     */
    public $queue = 'default';

或者，你可以在事件上定义 `broadcastQueue` 方法来自定义队列名称：

    /**
     * 放置广播任务的队列名称。
     */
    public function broadcastQueue(): string
    {
        return 'default';
    }

如果你希望使用 `sync` 队列而不是默认队列驱动来广播事件，可以改为实现 `ShouldBroadcastNow` 接口，而不是 `ShouldBroadcast`：

    <?php

    use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

    class OrderShipmentStatusUpdated implements ShouldBroadcastNow
    {
        // ...
    }

<a name="broadcast-conditions"></a>
### 广播条件

有时你希望只在某个条件成立时才广播事件。可以在事件类上添加 `broadcastWhen` 方法来定义这些条件：

    /**
     * 确定是否应当广播该事件。
     */
    public function broadcastWhen(): bool
    {
        return $this->order->value > 100;
    }

<a name="broadcasting-and-database-transactions"></a>
#### 广播与数据库事务

在数据库事务中分发广播事件时，队列可能在数据库事务提交之前就处理这些事件。发生这种情况时，你在数据库事务中对模型或数据库记录所做的更新可能尚未反映到数据库中。此外，在事务中创建的模型或数据库记录也可能还不存在于数据库中。如果你的事件依赖这些模型，那么在处理广播该事件的任务时就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项被设为 `false`，你仍然可以在事件类上实现 `ShouldDispatchAfterCommit` 接口，以指明某个特定的广播事件应当在所有打开的数据库事务提交之后再分发：

    <?php

    namespace App\Events;

    use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
    use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
    use Illuminate\Queue\SerializesModels;

    class ServerCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
    {
        use SerializesModels;
    }

> [!NOTE]
> 若想了解更多如何规避这些问题，请查阅关于[队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="authorizing-channels"></a>
## 授权频道

私有频道要求你确认当前已认证用户确实可以收听该频道。做法是带频道名称向你的 Laravel 应用发起 HTTP 请求，让应用自行判断该用户能否收听这个频道。使用 [Laravel Echo](#client-side-installation) 时，对私有频道订阅的授权 HTTP 请求会自动发出。

启用广播后，Laravel 会自动注册 `/broadcasting/auth` 路由来处理授权请求。该 `/broadcasting/auth` 路由会被自动放入 `web` 中间件组中。

<a name="defining-authorization-callbacks"></a>
### 定义授权回调

接下来，我们需要定义真正用来判断当前已认证用户能否收听某个频道的逻辑。这部分逻辑写在 `install:broadcasting` Artisan 命令创建的 `routes/channels.php` 文件中。在这个文件里，你可以使用 `Broadcast::channel` 方法注册频道授权回调：

    use App\Models\User;

    Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
        return $user->id === Order::findOrNew($orderId)->user_id;
    });

`channel` 方法接受两个参数：频道名称，以及一个返回 `true` 或 `false` 的回调，用来指示用户是否被授权收听该频道。

所有授权回调都会把当前已认证用户作为第一个参数，其余通配参数作为后续参数。在本例中，我们使用 `{orderId}` 占位符表示频道名称中的"ID"部分是通配的。

你可以使用 `channel:list` Artisan 命令查看应用的广播授权回调列表：

```shell
php artisan channel:list
```

<a name="authorization-callback-model-binding"></a>
#### 授权回调的模型绑定

与 HTTP 路由一样，频道路由也可以利用隐式和显式的[路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，你可以不接收字符串或数字形式的订单 ID，而是直接请求一个 `Order` 模型实例：

    use App\Models\Order;
    use App\Models\User;

    Broadcast::channel('orders.{order}', function (User $user, Order $order) {
        return $user->id === $order->user_id;
    });

> [!WARNING]
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动的[隐式模型绑定作用域限定](/docs/{{version}}/routing#implicit-model-binding-scoping)。不过这很少成为问题，因为大多数频道都可以基于单个模型的唯一主键来限定范围。

<a name="authorization-callback-authentication"></a>
#### 授权回调的认证

私有广播频道与 presence 广播频道通过应用的默认认证守卫来认证当前用户。如果用户未通过认证，频道授权会被自动拒绝，授权回调也不会执行。不过，如有需要，你可以指定多个自定义守卫来认证传入请求：

    Broadcast::channel('channel', function () {
        // ...
    }, ['guards' => ['web', 'admin']]);

<a name="defining-channel-classes"></a>
### 定义频道类

如果你的应用要消费许多不同的频道，`routes/channels.php` 文件可能会变得臃肿。因此，你可以改用频道类，而不是用闭包来授权频道。要生成频道类，请使用 `make:channel` Artisan 命令。该命令会把新的频道类放到 `App/Broadcasting` 目录中。

```shell
php artisan make:channel OrderChannel
```

接下来，在 `routes/channels.php` 文件中注册你的频道：

    use App\Broadcasting\OrderChannel;

    Broadcast::channel('orders.{order}', OrderChannel::class);

最后，你可以把频道的授权逻辑放在频道类的 `join` 方法中。这个 `join` 方法承载的逻辑，与你通常会放在频道授权闭包中的逻辑相同。你还可以利用频道模型绑定：

    <?php

    namespace App\Broadcasting;

    use App\Models\Order;
    use App\Models\User;

    class OrderChannel
    {
        /**
         * 创建一个新的频道实例。
         */
        public function __construct() {}

        /**
         * 认证用户对该频道的访问权限。
         */
        public function join(User $user, Order $order): array|bool
        {
            return $user->id === $order->user_id;
        }
    }

> [!NOTE]
> 与 Laravel 中许多其他类一样，频道类会被[服务容器](/docs/{{version}}/container)自动解析。因此，你可以在频道类的构造函数中类型提示所需的任何依赖项。

<a name="broadcasting-events"></a>
## 广播事件

定义事件并用 `ShouldBroadcast` 接口标记它之后，你只需使用事件的 dispatch 方法触发该事件。事件分发器会发现该事件已标记 `ShouldBroadcast` 接口，从而把事件加入队列等待广播：

    use App\Events\OrderShipmentStatusUpdated;

    OrderShipmentStatusUpdated::dispatch($order);

<a name="only-to-others"></a>
### 只广播给其他人

在构建使用事件广播的应用时，你偶尔需要把某个事件广播给给定频道的所有订阅者，但排除当前用户。可以使用 `broadcast` 辅助函数配合 `toOthers` 方法来实现：

    use App\Events\OrderShipmentStatusUpdated;

    broadcast(new OrderShipmentStatusUpdated($update))->toOthers();

为了更好地理解何时该使用 `toOthers` 方法，我们来设想一个任务列表应用：用户可以通过输入任务名称来创建新任务。为了创建任务，你的应用可能向 `/task` URL 发起请求，该请求会广播任务的创建，并返回新任务的 JSON 表示。当 JavaScript 应用收到该端点的响应时，它可能会直接把新任务插入任务列表，如下所示：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

但请记住，我们也广播了任务的创建。如果 JavaScript 应用也在监听这个事件以便把任务加入任务列表，那么列表中就会出现重复任务：一个来自该端点，另一个来自广播。可以用 `toOthers` 方法指示广播器不要把事件广播给当前用户，从而解决这个问题。

> [!WARNING]
> 事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` Trait，才能调用 `toOthers` 方法。

<a name="only-to-others-configuration"></a>
#### 配置

初始化 Laravel Echo 实例时，连接会被分配一个 socket ID。如果你使用全局的 [Axios](https://github.com/axios/axios) 实例从 JavaScript 应用发起 HTTP 请求，该 socket ID 会自动作为 `X-Socket-ID` 请求头附加到每个传出请求上。这样，当你调用 `toOthers` 方法时，Laravel 会从请求头中取出 socket ID，并指示广播器不要向具有该 socket ID 的任何连接广播。

如果你没有使用全局的 Axios 实例，就需要手动配置 JavaScript 应用，让它在所有传出请求中发送 `X-Socket-ID` 请求头。可以使用 `Echo.socketId` 方法获取 socket ID：

```js
var socketId = Echo.socketId();
```

<a name="customizing-the-connection"></a>
### 自定义连接

如果你的应用与多个广播连接交互，并且希望使用默认广播器之外的广播器来广播事件，可以使用 `via` 方法指定把事件推送到哪个连接：

    use App\Events\OrderShipmentStatusUpdated;

    broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');

或者，你可以在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。不过在此之前，应确保事件类使用了 `InteractsWithBroadcasting` Trait：

    <?php

    namespace App\Events;

    use Illuminate\Broadcasting\Channel;
    use Illuminate\Broadcasting\InteractsWithBroadcasting;
    use Illuminate\Broadcasting\InteractsWithSockets;
    use Illuminate\Broadcasting\PresenceChannel;
    use Illuminate\Broadcasting\PrivateChannel;
    use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
    use Illuminate\Queue\SerializesModels;

    class OrderShipmentStatusUpdated implements ShouldBroadcast
    {
        use InteractsWithBroadcasting;

        /**
         * 创建一个新的事件实例。
         */
        public function __construct()
        {
            $this->broadcastVia('pusher');
        }
    }

<a name="anonymous-events"></a>
### 匿名事件

有时你可能希望把一个简单的事件广播到应用前端，而不必创建专门的事件类。为此，`Broadcast` Facade 允许你广播"匿名事件"：

```php
Broadcast::on('orders.'.$order->id)->send();
```

上面的例子会广播如下事件：

```json
{
    "event": "AnonymousEvent",
    "data": "[]",
    "channel": "orders.1"
}
```

使用 `as` 与 `with` 方法，你可以自定义事件的名称与数据：

```php
Broadcast::on('orders.'.$order->id)
    ->as('OrderPlaced')
    ->with($order)
    ->send();
```

上面的例子会广播如下事件：

```json
{
    "event": "OrderPlaced",
    "data": "{ id: 1, total: 100 }",
    "channel": "orders.1"
}
```

如果你希望在私有频道或 presence 频道上广播匿名事件，可以使用 `private` 与 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件时，会把事件分发到应用的[队列](/docs/{{version}}/queues)中处理。不过，如果你希望立即广播该事件，可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要把事件广播给除当前已认证用户之外的所有频道订阅者，可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

<a name="receiving-broadcasts"></a>
## 接收广播

<a name="listening-for-events"></a>
### 监听事件

[安装并实例化 Laravel Echo](#client-side-installation)之后，你就可以开始监听从 Laravel 应用广播出来的事件了。先用 `channel` 方法获取一个频道实例，再调用 `listen` 方法监听指定事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果你希望监听私有频道上的事件，请改用 `private` 方法。你还可以继续链式调用 `listen` 方法，在同一个频道上监听多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* ... */)
    .listen(/* ... */)
    .listen(/* ... */);
```

<a name="stop-listening-for-events"></a>
#### 停止监听事件

如果你想在不[离开频道](#leaving-a-channel)的情况下停止监听某个事件，可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated')
```

<a name="leaving-a-channel"></a>
### 离开频道

要离开一个频道，你可以在 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果你希望离开一个频道以及与之关联的私有频道和 presence 频道，可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```
<a name="namespaces"></a>
### 命名空间

你可能已经注意到，在上面的示例中我们并没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 会自动假定事件位于 `App\Events` 命名空间中。不过，你可以在实例化 Echo 时传入 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    namespace: 'App.Other.Namespace'
});
```

或者，你在使用 Echo 订阅事件类时，可以用 `.` 作为前缀。这样你就可以始终指定完全限定的类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        // ...
    });
```

<a name="presence-channels"></a>
## Presence 频道

Presence 频道建立在私有频道的安全机制之上，同时额外提供"谁订阅了该频道"的感知能力。这让你可以轻松构建强大的协作型应用功能，例如在另一位用户正在查看同一页面时通知用户，或列出聊天室中的成员。

<a name="authorizing-presence-channels"></a>
### 授权 Presence 频道

所有 presence 频道同时也是私有频道；因此用户必须[获得授权才能访问它们](#authorizing-channels)。不过，在为 presence 频道定义授权回调时，如果用户已被授权加入频道，你并不会返回 `true`，而应返回一个包含该用户信息的数组。

授权回调返回的数据会在你的 JavaScript 应用中提供给 presence 频道的事件监听器。如果用户未被授权加入该 presence 频道，你应当返回 `false` 或 `null`：

    use App\Models\User;

    Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
        if ($user->canJoinRoom($roomId)) {
            return ['id' => $user->id, 'name' => $user->name];
        }
    });

<a name="joining-presence-channels"></a>
### 加入 Presence 频道

要加入 presence 频道，可以使用 Echo 的 `join` 方法。`join` 方法会返回一个 `PresenceChannel` 实现，除了提供 `listen` 方法外，还让你能够订阅 `here`、`joining` 与 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
    .here((users) => {
        // ...
    })
    .joining((user) => {
        console.log(user.name);
    })
    .leaving((user) => {
        console.log(user.name);
    })
    .error((error) => {
        console.error(error);
    });
```

频道成功加入后，`here` 回调会立即执行，并接收到一个数组，其中包含当前订阅该频道的所有其他用户的信息。新用户加入频道时会执行 `joining` 方法，用户离开频道时会执行 `leaving` 方法。当认证端点返回 200 以外的 HTTP 状态码，或返回的 JSON 解析出问题时，会执行 `error` 方法。

<a name="broadcasting-to-presence-channels"></a>
### 向 Presence 频道广播

Presence 频道与公开频道或私有频道一样可以接收事件。以聊天室为例，我们可能希望把 `NewMessage` 事件广播到该房间的 presence 频道。为此，我们要从事件的 `broadcastOn` 方法返回一个 `PresenceChannel` 实例：

    /**
     * 获取该事件应当在哪些频道上广播。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('chat.'.$this->message->room_id),
        ];
    }

与其他事件一样，你可以使用 `broadcast` 辅助函数配合 `toOthers` 方法，把当前用户排除在广播接收者之外：

    broadcast(new NewMessage($message));

    broadcast(new NewMessage($message))->toOthers();

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法监听发送到 presence 频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* ... */)
    .joining(/* ... */)
    .leaving(/* ... */)
    .listen('NewMessage', (e) => {
        // ...
    });
```

<a name="model-broadcasting"></a>
## 模型广播

> [!WARNING]
> 在阅读下面关于模型广播的文档之前，我们建议你先熟悉 Laravel 模型广播服务的一般概念，以及如何手动创建并监听广播事件。

当应用的 [Eloquent 模型](/docs/{{version}}/eloquent)被创建、更新或删除时广播事件是常见做法。当然，你完全可以手动[为 Eloquent 模型状态变化定义自定义事件](/docs/{{version}}/eloquent#events)，并用 `ShouldBroadcast` 接口标记这些事件来做到这一点。

不过，如果你在应用中并不出于其他目的使用这些事件，那么仅为广播而创建事件类会显得很繁琐。为解决这一问题，Laravel 允许你指明某个 Eloquent 模型应当自动广播其状态变化。

要开始使用，你的 Eloquent 模型应当使用 `Illuminate\Database\Eloquent\BroadcastsEvents` Trait。此外，模型还应定义 `broadcastOn` 方法，该方法返回一个数组，指示模型的事件应当在哪些频道上广播：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use BroadcastsEvents, HasFactory;

    /**
     * 获取该文章所属的用户。
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取模型事件应当在哪些频道上广播。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

模型包含该 Trait 并定义了广播频道之后，模型实例被创建、更新、删除、软删除或恢复时，就会开始自动广播事件。

此外，你可能已经注意到 `broadcastOn` 方法会接收一个字符串参数 `$event`。该参数包含模型上发生的事件类型，取值为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查该变量的值，你可以确定某个特定事件时模型应当向哪些频道（如果有）广播：

```php
/**
 * 获取模型事件应当在哪些频道上广播。
 *
 * @return array<string, array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>>
 */
public function broadcastOn(string $event): array
{
    return match ($event) {
        'deleted' => [],
        default => [$this, $this->user],
    };
}
```

<a name="customizing-model-broadcasting-event-creation"></a>
#### 自定义模型广播事件的创建

偶尔你可能希望自定义 Laravel 创建底层模型广播事件的方式。可以在 Eloquent 模型上定义 `newBroadcastableEvent` 方法来做到这一点。该方法应返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * 为该模型创建一个新的可广播模型事件。
 */
protected function newBroadcastableEvent(string $event): BroadcastableModelEventOccurred
{
    return (new BroadcastableModelEventOccurred(
        $this, $event
    ))->dontBroadcastToCurrentUser();
}
```

<a name="model-broadcasting-conventions"></a>
### 模型广播约定

<a name="model-broadcasting-channel-conventions"></a>
#### 频道约定

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法并没有返回 `Channel` 实例，而是直接返回了 Eloquent 模型。如果模型的 `broadcastOn` 方法返回了 Eloquent 模型实例（或该实例包含在方法返回的数组中），Laravel 会自动为该模型实例化一个私有频道实例，以模型类名加主键标识作为频道名称。

因此，一个 `id` 为 `1` 的 `App\Models\User` 模型会被转换为一个 `Illuminate\Broadcasting\PrivateChannel` 实例，其名称为 `App.Models.User.1`。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例之外，你也可以返回完整的 `Channel` 实例，从而完全控制模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取模型事件应当在哪些频道上广播。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(string $event): array
{
    return [
        new PrivateChannel('user.'.$this->id)
    ];
}
```

如果你计划从模型的 `broadcastOn` 方法显式返回频道实例，可以把 Eloquent 模型实例传给该频道的构造函数。这样 Laravel 会使用上文讨论的模型频道约定，把 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定某个模型的频道名称，可以在任意模型实例上调用 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，该方法会返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel()
```

<a name="model-broadcasting-event-conventions"></a>
#### 事件约定

由于模型广播事件并不对应于应用 `App\Events` 目录中"真实的"事件，它们按约定被赋予名称和载荷。Laravel 的约定是：使用模型的类名（不含命名空间）加上触发该广播的模型事件名称来广播事件。

因此，例如，对 `App\Models\Post` 模型的一次更新，会以 `PostUpdated` 的名称把事件广播到你的客户端应用，载荷如下：

```json
{
    "model": {
        "id": 1,
        "title": "My first post"
        ...
    },
    ...
    "socket": "someSocketId",
}
```

删除 `App\Models\User` 模型会广播一个名为 `UserDeleted` 的事件。

如果愿意，你可以通过在模型上添加 `broadcastAs` 与 `broadcastWith` 方法来自定义广播名称和载荷。这些方法会接收到所发生的模型事件/操作的名称，让你能够为每个模型操作自定义事件的名称与载荷。如果 `broadcastAs` 方法返回 `null`，Laravel 会在广播事件时使用上文讨论的模型广播事件名称约定：

```php
/**
 * 模型事件的广播名称。
 */
public function broadcastAs(string $event): string|null
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * 获取要为该模型广播的数据。
 *
 * @return array<string, mixed>
 */
public function broadcastWith(string $event): array
{
    return match ($event) {
        'created' => ['title' => $this->title],
        default => ['model' => $this],
    };
}
```

<a name="listening-for-model-broadcasts"></a>
### 监听模型广播

把 `BroadcastsEvents` Trait 添加到模型并定义模型的 `broadcastOn` 方法之后，你就可以开始在客户端应用中监听广播出的模型事件了。开始之前，你或许想先查阅关于[监听事件](#listening-for-events)的完整文档。

先用 `private` 方法获取一个频道实例，再调用 `listen` 方法监听指定事件。通常，传给 `private` 方法的频道名称应当与 Laravel 的[模型广播约定](#model-broadcasting-conventions)相对应。

获得频道实例后，你可以使用 `listen` 方法监听特定事件。由于模型广播事件并不对应于应用 `App\Events` 目录中"真实的"事件，[事件名称](#model-broadcasting-event-conventions)必须加上 `.` 前缀，以表明它不属于某个特定命名空间。每个模型广播事件都有一个 `model` 属性，其中包含该模型所有可广播的属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.PostUpdated', (e) => {
        console.log(e.model);
    });
```

<a name="client-events"></a>
## 客户端事件

> [!NOTE]
> 使用 [Pusher Channels](https://pusher.com/channels) 时，你必须在[应用仪表板](https://dashboard.pusher.com/)的"App Settings"部分启用"Client Events"选项，才能发送客户端事件。

有时你可能希望把某个事件广播给其他已连接的客户端，完全不经过 Laravel 应用。这对于"正在输入"这类提示特别有用——你想借此提醒应用的用户：另一位用户正在某个页面上输入消息。

要广播客户端事件，可以使用 Echo 的 `whisper` 方法：

```js
Echo.private(`chat.${roomId}`)
    .whisper('typing', {
        name: this.user.name
    });
```

要监听客户端事件，可以使用 `listenForWhisper` 方法：

```js
Echo.private(`chat.${roomId}`)
    .listenForWhisper('typing', (e) => {
        console.log(e.name);
    });
```

<a name="notifications"></a>
## 通知

把事件广播与[通知](/docs/{{version}}/notifications)结合使用后，你的 JavaScript 应用可以在新通知发生时立即接收它们，无需刷新页面。开始之前，请务必阅读关于使用[广播通知频道](/docs/{{version}}/notifications#broadcast-notifications)的文档。

配置好通知使用广播频道之后，你可以使用 Echo 的 `notification` 方法监听广播事件。请记住，频道名称应当与接收通知的实体的类名相匹配：

```js
Echo.private(`App.Models.User.${userId}`)
    .notification((notification) => {
        console.log(notification.type);
    });
```

在本例中，所有通过 `broadcast` 频道发送到 `App\Models\User` 实例的通知都会被该回调接收。应用的 `routes/channels.php` 文件中已包含针对 `App.Models.User.{id}` 频道的授权回调。
