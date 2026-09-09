# Laravel Cashier（Paddle）

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [Paddle 沙箱](#paddle-sandbox)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [Paddle JS](#paddle-js)
    - [货币配置](#currency-configuration)
    - [覆盖默认模型](#overriding-default-models)
- [快速入门](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [结账会话](#checkout-sessions)
    - [覆盖层结账](#overlay-checkout)
    - [内嵌结账](#inline-checkout)
    - [访客结账](#guest-checkouts)
- [价格预览](#price-previews)
    - [客户价格预览](#customer-price-previews)
    - [折扣](#price-discounts)
- [客户](#customers)
    - [客户默认值](#customer-defaults)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [订阅单次收费](#subscription-single-charges)
    - [更新支付信息](#updating-payment-information)
    - [变更套餐](#changing-plans)
    - [订阅数量](#subscription-quantity)
    - [包含多个产品的订阅](#subscriptions-with-multiple-products)
    - [多重订阅](#multiple-subscriptions)
    - [暂停订阅](#pausing-subscriptions)
    - [取消订阅](#canceling-subscriptions)
- [订阅试用期](#subscription-trials)
    - [预收支付方式的试用期](#with-payment-method-up-front)
    - [不预收支付方式的试用期](#without-payment-method-up-front)
    - [延长或激活试用期](#extend-or-activate-a-trial)
- [处理 Paddle Webhook](#handling-paddle-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [为产品收费](#charging-for-products)
    - [退款交易](#refunding-transactions)
    - [为交易入账余额](#crediting-transactions)
- [交易](#transactions)
    - [历史与未来付款](#past-and-upcoming-payments)
- [测试](#testing)

<a name="introduction"></a>
## 简介

> [!WARNING]
> 本文档介绍的是 Cashier Paddle 2.x 与 Paddle Billing 的集成。如果你仍在使用 Paddle Classic，请使用 [Cashier Paddle 1.x](https://github.com/laravel/cashier-paddle/tree/1.x)。

[Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle) 为 [Paddle](https://paddle.com) 的订阅计费服务提供了一个富表现力、流式的接口。它替你处理几乎所有令人生畏的订阅计费样板代码。除基本的订阅管理外，Cashier 还能处理：更换订阅、订阅"数量"、暂停订阅、取消宽限期等功能。

在深入研究 Cashier Paddle 之前，建议你先阅读 Paddle 的[概念指南](https://developer.paddle.com/concepts/overview)和 [API 文档](https://developer.paddle.com/api-reference/overview)。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，请务必仔细阅读[升级指南](https://github.com/laravel/cashier-paddle/blob/master/UPGRADE.md)。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器为 Paddle 安装 Cashier 扩展包：

```shell
composer require laravel/cashier-paddle
```

接下来，使用 `vendor:publish` Artisan 命令发布 Cashier 的迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，运行应用的数据库迁移。Cashier 的迁移会创建一个新的 `customers` 表。此外，还会创建 `subscriptions` 和 `subscription_items` 两个新表，用于存储所有客户的订阅。最后，会创建一个新的 `transactions` 表，用于存储与你的客户相关的所有 Paddle 交易：

```shell
php artisan migrate
```

> [!WARNING]
> 为确保 Cashier 正确处理所有 Paddle 事件，请记得[设置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

<a name="paddle-sandbox"></a>
### Paddle 沙箱

在本地和预发布环境开发时，你应该[注册一个 Paddle 沙箱账户](https://sandbox-login.paddle.com/signup)。该账户会为你提供一个沙箱环境，让你无需实际付款即可测试和开发应用。你可以使用 Paddle 的[测试卡号](https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-payment-method)来模拟各种支付场景。

使用 Paddle 沙箱环境时，应在应用的 `.env` 文件中将 `PADDLE_SANDBOX` 环境变量设为 `true`：

```ini
PADDLE_SANDBOX=true
```

应用开发完成后，你可以[申请一个 Paddle 商家账户](https://paddle.com)。在应用正式上线之前，Paddle 需要先审批你的应用域名。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

使用 Cashier 之前，你必须将 `Billable` Trait 添加到用户模型定义中。该 Trait 提供了多种方法，让你可以执行常见的计费任务，例如创建订阅、更新支付方式信息：

```php
use Laravel\Paddle\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

如果存在不属于用户的可计费实体，也可以将这个 Trait 添加到这些类中：

```php
use Illuminate\Database\Eloquent\Model;
use Laravel\Paddle\Billable;

class Team extends Model
{
    use Billable;
}
```

<a name="api-keys"></a>
### API 密钥

接下来，你应在应用的 `.env` 文件中配置 Paddle 密钥。你可以从 Paddle 控制面板获取 Paddle API 密钥：

```ini
PADDLE_CLIENT_SIDE_TOKEN=your-paddle-client-side-token
PADDLE_API_KEY=your-paddle-api-key
PADDLE_RETAIN_KEY=your-paddle-retain-key
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"
PADDLE_SANDBOX=true
```

使用 [Paddle 沙箱环境](#paddle-sandbox)时，`PADDLE_SANDBOX` 环境变量应设为 `true`。如果要将应用部署到生产环境并使用 Paddle 的正式商家环境，则应将 `PADDLE_SANDBOX` 变量设为 `false`。

`PADDLE_RETAIN_KEY` 是可选的，仅当你将 Paddle 与 [Retain](https://developer.paddle.com/concepts/retain/overview) 配合使用时才需要设置。

<a name="paddle-js"></a>
### Paddle JS

Paddle 依赖其自身的 JavaScript 库来启动 Paddle 结账挂件。你可以将 `@paddleJS` Blade 指令放置在应用布局的 `</head>` 闭合标签之前，来加载这个 JavaScript 库：

```blade
<head>
    ...

    @paddleJS
</head>
```

<a name="currency-configuration"></a>
### 货币配置

你可以指定一个区域设置，用于格式化发票上显示的金额。Cashier 内部使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 若要使用 `en` 之外的区域设置，请确保服务器上已安装并正确配置 `ext-intl` PHP 扩展。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以定义自己的模型并继承相应的 Cashier 模型，从而自由扩展 Cashier 内部使用的模型：

```php
use Laravel\Paddle\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义好模型后，你可以通过 `Laravel\Paddle\Cashier` 类指示 Cashier 使用你的自定义模型。通常，你应该在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\Transaction;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useTransactionModel(Transaction::class);
}
```

<a name="quickstart"></a>
## 快速入门

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应该先在 Paddle 控制面板中定义好固定价格的产品。此外，你还应该[配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

在应用中提供产品和订阅计费功能可能令人望而生畏。不过，借助 Cashier 和 [Paddle 的 Checkout Overlay](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代化、健壮的支付集成。

要向客户收取非周期性、单次收费的产品费用，我们将使用 Cashier 通过 Paddle 的 Checkout Overlay 向客户收费，客户会在其中填写支付信息并确认购买。通过 Checkout Overlay 完成付款后，客户将被重定向到你在应用中指定的成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout('pri_deluxe_album')
        ->returnTo(route('dashboard'));

    return view('buy', ['checkout' => $checkout]);
})->name('checkout');
```

正如上面的示例所示，我们将使用 Cashier 提供的 `checkout` 方法创建一个结账对象，针对给定的"价格标识符"向客户展示 Paddle Checkout Overlay。在使用 Paddle 时，"价格"指的是[为特定产品定义的价格](https://developer.paddle.com/build/products/create-products-prices)。

必要时，`checkout` 方法会自动在 Paddle 中创建客户，并将该 Paddle 客户记录与应用数据库中对应的用户关联起来。完成结账会话后，客户将被重定向到一个专用的成功页面，你可以在该页面向客户展示提示信息。

在 `buy` 视图中，我们将添加一个显示 Checkout Overlay 的按钮。`paddle-button` Blade 组件已随 Cashier Paddle 一并提供；不过，你也可以[手动渲染覆盖层结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy Product
</x-paddle-button>
```

<a name="providing-meta-data-to-paddle-checkout"></a>
#### 向 Paddle Checkout 提供元数据

销售产品时，通常会通过你自己应用中定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品。当将客户重定向到 Paddle 的 Checkout Overlay 完成购买时，你可能需要提供现有的订单标识符，以便在客户返回应用时将已完成的购买与相应订单关联起来。

为此，你可以向 `checkout` 方法传递一个自定义数据数组。假设当用户开始结账流程时，我们的应用中会创建一个待处理的 `Order`。请记住，本示例中的 `Cart` 和 `Order` 模型仅作说明用途，并非由 Cashier 提供。你可以根据自己应用的需求自由实现这些概念：

```php
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/cart/{cart}/checkout', function (Request $request, Cart $cart) {
    $order = Order::create([
        'cart_id' => $cart->id,
        'price_ids' => $cart->price_ids,
        'status' => 'incomplete',
    ]);

    $checkout = $request->user()->checkout($order->price_ids)
        ->customData(['order_id' => $order->id]);

    return view('billing', ['checkout' => $checkout]);
})->name('checkout');
```

正如上面的示例所示，当用户开始结账流程时，我们会将购物车/订单关联的所有 Paddle 价格标识符传递给 `checkout` 方法。当然，当客户将商品加入"购物车"或订单时，你的应用需要负责将这些商品与购物车或订单关联起来。我们还通过 `customData` 方法将订单的 ID 提供给 Paddle Checkout Overlay。

当然，在客户完成结账流程后，你很可能希望将订单标记为"已完成"。为此，你可以监听 Paddle 分发、并由 Cashier 以事件形式触发的 Webhook，将订单信息存储到数据库中。

首先，监听 Cashier 分发的 `TransactionCompleted` 事件。通常，你应该在应用的 `AppServiceProvider` 的 `boot` 方法中注册事件监听器：

```php
use App\Listeners\CompleteOrder;
use Illuminate\Support\Facades\Event;
use Laravel\Paddle\Events\TransactionCompleted;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(TransactionCompleted::class, CompleteOrder::class);
}
```

在本示例中，`CompleteOrder` 监听器大致如下：

```php
namespace App\Listeners;

use App\Models\Order;
use Laravel\Paddle\Cashier;
use Laravel\Paddle\Events\TransactionCompleted;

class CompleteOrder
{
    /**
     * 处理传入的 Cashier Webhook 事件。
     */
    public function handle(TransactionCompleted $event): void
    {
        $orderId = $event->payload['data']['custom_data']['order_id'] ?? null;

        $order = Order::findOrFail($orderId);

        $order->update(['status' => 'completed']);
    }
}
```

有关 [`transaction.completed` 事件包含的数据](https://developer.paddle.com/webhooks/transactions/transaction-completed)的更多信息，请查阅 Paddle 的文档。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应该先在 Paddle 控制面板中定义好固定价格的产品。此外，你还应该[配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

在应用中提供产品和订阅计费功能可能令人望而生畏。不过，借助 Cashier 和 [Paddle 的 Checkout Overlay](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代化、健壮的支付集成。

要了解如何使用 Cashier 和 Paddle 的 Checkout Overlay 销售订阅，我们来看一个简单的场景：某订阅服务提供基础月付（`price_basic_monthly`）和基础年付（`price_basic_yearly`）两种套餐。在 Paddle 控制面板中，这两个价格可以归入同一个"Basic"产品（`pro_basic`）下。此外，我们的订阅服务还可以提供一个"Expert"套餐，即 `pro_expert`。

首先，我们来看看客户如何订阅我们的服务。当然，你可以想象客户会在应用的定价页面上点击 Basic 套餐的"订阅"按钮。这个按钮会为其选择的套餐唤起 Paddle Checkout Overlay。首先，我们通过 `checkout` 方法发起一个结账会话：

```php
use Illuminate\Http\Request;

Route::get('/subscribe', function (Request $request) {
    $checkout = $request->user()->checkout('price_basic_monthly')
        ->returnTo(route('dashboard'));

    return view('subscribe', ['checkout' => $checkout]);
})->name('subscribe');
```

在 `subscribe` 视图中，我们将添加一个显示 Checkout Overlay 的按钮。`paddle-button` Blade 组件已随 Cashier Paddle 一并提供；不过，你也可以[手动渲染覆盖层结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

现在，当点击 Subscribe 按钮后，客户就可以填写支付信息并发起订阅。要得知订阅何时真正开始（因为某些支付方式需要几秒钟的处理时间），你还应该[配置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

既然客户已经可以开始订阅，我们就需要限制应用的某些部分，只允许已订阅的用户访问。当然，我们随时可以通过 Cashier 的 `Billable` Trait 提供的 `subscribed` 方法来判断用户当前的订阅状态：

```blade
@if ($user->subscribed())
    <p>You are subscribed.</p>
@endif
```

我们甚至可以轻松判断用户是否订阅了特定的产品或价格：

```blade
@if ($user->subscribedToProduct('pro_basic'))
    <p>You are subscribed to our Basic product.</p>
@endif

@if ($user->subscribedToPrice('price_basic_monthly'))
    <p>You are subscribed to our monthly Basic plan.</p>
@endif
```

<a name="quickstart-building-a-subscribed-middleware"></a>
#### 构建已订阅中间件

为了方便起见，你可能希望创建一个[中间件](/docs/{{version}}/middleware)，用于判断传入请求是否来自已订阅的用户。定义好这个中间件后，你就可以轻松地将其分配给某个路由，防止未订阅的用户访问该路由：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Subscribed
{
    /**
     * 处理传入请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            // 将用户重定向到计费页面并要求其订阅...
            return redirect('/subscribe');
        }

        return $next($request);
    }
}
```

定义好中间件后，你可以将其分配给某个路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理自己的计费套餐

当然，客户可能希望将订阅套餐更换为其他产品或"层级"。在上面的示例中，我们希望允许客户将套餐从月度订阅换为年度订阅。为此，你需要实现一个按钮，指向下面这个路由：

```php
use Illuminate\Http\Request;

Route::put('/subscription/{price}/swap', function (Request $request, $price) {
    $user->subscription()->swap($price); // 本例中 "$price" 为 "price_basic_yearly"。

    return redirect()->route('dashboard');
})->name('subscription.swap');
```

除了更换套餐，你还需要允许客户取消订阅。与更换套餐类似，提供一个指向以下路由的按钮：

```php
use Illuminate\Http\Request;

Route::put('/subscription/cancel', function (Request $request, $price) {
    $user->subscription()->cancel();

    return redirect()->route('dashboard');
})->name('subscription.cancel');
```

这样，订阅就会在当前计费周期结束时被取消。

> [!NOTE]
> 只要你配置好了 Cashier 的 Webhook 处理，Cashier 就会通过检查来自 Paddle 的 Webhook，自动保持应用中与 Cashier 相关的数据库表同步。例如，当你通过 Paddle 的控制面板取消某个客户的订阅时，Cashier 会收到相应的 Webhook，并在你的应用数据库中将该订阅标记为"已取消"。

<a name="checkout-sessions"></a>
## 结账会话

大多数向客户收费的操作都是通过 Paddle 的 [Checkout Overlay 挂件](https://developer.paddle.com/build/checkout/build-overlay-checkout)以"结账"方式执行的，或者使用[内嵌结账](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)。

在使用 Paddle 处理结账付款之前，你应该在 Paddle 的结账设置控制面板中定义应用的[默认支付链接](https://developer.paddle.com/build/transactions/default-payment-link#set-default-link)。

<a name="overlay-checkout"></a>
### 覆盖层结账

在显示 Checkout Overlay 挂件之前，你必须使用 Cashier 生成一个结账会话。结账会话会告知结账挂件应执行的计费操作：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

Cashier 包含一个 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)。你可以将结账会话作为"prop"传递给该组件。然后，当点击这个按钮时，就会显示 Paddle 的结账挂件：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

默认情况下，该挂件会使用 Paddle 的默认样式进行展示。你可以向组件添加 [Paddle 支持的属性](https://developer.paddle.com/paddlejs/html-data-attributes)来自定义挂件，例如 `data-theme='light'` 属性：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4" data-theme="light">
    Subscribe
</x-paddle-button>
```

Paddle 的结账挂件是异步的。用户在挂件中创建订阅后，Paddle 会向你的应用发送一个 Webhook，以便你在应用数据库中正确更新订阅状态。因此，请务必正确[设置 Webhook](#handling-paddle-webhooks)，以处理来自 Paddle 的状态变更。

> [!WARNING]
> 订阅状态变更后，收到相应 Webhook 的延迟通常很短，但你仍应在应用中考虑到这一点：用户完成结账后，其订阅信息可能不会立即可用。

<a name="manually-rendering-an-overlay-checkout"></a>
#### 手动渲染覆盖层结账

你也可以不使用 Laravel 内置的 Blade 组件，手动渲染覆盖层结账。首先，[按照前面示例演示的方式](#overlay-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在本示例中，我们将创建一个带有 `paddle_button` 类的链接。Paddle.js 会检测这个类，并在点击链接时显示覆盖层结账：

```blade
<?php
$items = $checkout->getItems();
$customer = $checkout->getCustomer();
$custom = $checkout->getCustomData();
?>

<a
    href='#!'
    class='paddle_button'
    data-items='{!! json_encode($items) !!}'
    @if ($customer) data-customer-id='{{ $customer->paddle_id }}' @endif
    @if ($custom) data-custom-data='{{ json_encode($custom) }}' @endif
    @if ($returnUrl = $checkout->getReturnUrl()) data-success-url='{{ $returnUrl }}' @endif
>
    Buy Product
</a>
```

<a name="inline-checkout"></a>
### 内嵌结账

如果你不想使用 Paddle 的"覆盖层"式结账挂件，Paddle 还提供了将挂件内嵌显示的选项。虽然这种方式不允许你调整结账的任何 HTML 字段，但它允许你将挂件嵌入到应用内部。

为了让你轻松上手内嵌结账，Cashier 提供了一个 `paddle-checkout` Blade 组件。首先，你应该[生成一个结账会话](#overlay-checkout)：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话传递给该组件的 `checkout` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" />
```

要调整内嵌结账组件的高度，可以向该 Blade 组件传递 `height` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" height="500" />
```

有关内嵌结账自定义选项的更多细节，请查阅 Paddle 的[内嵌结账指南](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)和[可用结账设置](https://developer.paddle.com/build/checkout/set-up-checkout-default-settings)。

<a name="manually-rendering-an-inline-checkout"></a>
#### 手动渲染内嵌结账

你也可以不使用 Laravel 内置的 Blade 组件，手动渲染内嵌结账。首先，[按照前面示例演示的方式](#inline-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在本示例中，我们将使用 [Alpine.js](https://github.com/alpinejs/alpine) 来演示；不过，你可以自由修改这个示例以适配自己的前端技术栈：

```blade
<?php
$options = $checkout->options();

$options['settings']['frameTarget'] = 'paddle-checkout';
$options['settings']['frameInitialHeight'] = 366;
?>

<div class="paddle-checkout" x-data="{}" x-init="
    Paddle.Checkout.open(@json($options));
">
</div>
```

<a name="guest-checkouts"></a>
### 访客结账

有时，你可能需要为不需要在应用中注册账户的用户创建结账会话。为此，你可以使用 `guest` 方法：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Checkout;

Route::get('/buy', function (Request $request) {
    $checkout = Checkout::guest(['pri_34567'])
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话提供给 [Paddle 按钮](#overlay-checkout)或[内嵌结账](#inline-checkout) Blade 组件。

<a name="price-previews"></a>
## 价格预览

Paddle 允许你按货币自定义价格，本质上就是让你可以为不同国家配置不同的价格。Cashier Paddle 允许你使用 `previewPrices` 方法获取所有这些价格。该方法接受你希望获取价格的价格 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456']);
```

货币将根据请求的 IP 地址来确定；不过，你也可以选择性地指定具体的国家来获取相应价格：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], ['address' => [
    'country_code' => 'BE',
    'postal_code' => '1234',
]]);
```

获取价格后，你可以按任意方式展示它们：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

你还可以分别显示小计价格和税额：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->subtotal() }} (+ {{ $price->tax() }} tax)</li>
    @endforeach
</ul>
```

更多信息请查阅 [Paddle 关于价格预览的 API 文档](https://developer.paddle.com/api-reference/pricing-preview/preview-prices)。

<a name="customer-price-previews"></a>
### 客户价格预览

如果用户已经是客户，而你希望显示适用于该客户的价格，可以直接从客户实例获取价格：

```php
use App\Models\User;

$prices = User::find(1)->previewPrices(['pri_123', 'pri_456']);
```

Cashier 内部会使用该用户的客户 ID 来获取其对应货币的价格。例如，居住在美国的用户会看到以美元计价的价格，而位于比利时的用户则会看到以欧元计价的价格。如果找不到匹配的货币，则会使用产品的默认货币。你可以在 Paddle 控制面板中自定义产品或订阅套餐的所有价格。

<a name="price-discounts"></a>
### 折扣

你还可以选择展示折扣后的价格。调用 `previewPrices` 方法时，通过 `discount_id` 选项提供折扣 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], [
    'discount_id' => 'dsc_123'
]);
```

然后，展示计算后的价格：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

<a name="customers"></a>
## 客户

<a name="customer-defaults"></a>
### 客户默认值

Cashier 允许你在创建结账会话时为客户定义一些实用的默认值。设置这些默认值可以预填客户的电子邮箱和姓名，让客户直接进入结账挂件的付款环节。你可以通过在可计费模型上覆盖以下方法来设置这些默认值：

```php
/**
 * 获取要与 Paddle 关联的客户姓名。
 */
public function paddleName(): string|null
{
    return $this->name;
}

/**
 * 获取要与 Paddle 关联的客户电子邮箱。
 */
public function paddleEmail(): string|null
{
    return $this->email;
}
```

这些默认值将应用于 Cashier 中所有会生成[结账会话](#checkout-sessions)的操作。

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法按 Paddle 客户 ID 检索客户。该方法会返回可计费模型的实例：

```php
use Laravel\Paddle\Cashier;

$user = Cashier::findBillable($customerId);
```

<a name="creating-customers"></a>
### 创建客户

偶尔，你可能希望在不发起订阅的情况下创建 Paddle 客户。你可以使用 `createAsCustomer` 方法来完成：

```php
$customer = $user->createAsCustomer();
```

该方法会返回一个 `Laravel\Paddle\Customer` 实例。在 Paddle 中创建客户后，你可以在以后再发起订阅。你还可以提供可选的 `$options` 数组，传入 [Paddle API 支持的其他客户创建参数](https://developer.paddle.com/api-reference/customers/create-customer)：

```php
$customer = $user->createAsCustomer($options);
```

<a name="subscriptions"></a>
## 订阅

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先从数据库中检索可计费模型的实例，通常是 `App\Models\User` 的实例。获取模型实例后，你可以使用 `subscribe` 方法创建该模型的结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

传给 `subscribe` 方法的第一个参数是用户订阅的具体价格。该值应对应于该价格在 Paddle 中的标识符。`returnTo` 方法接受一个 URL，用户成功完成结账后将被重定向到该地址。传给 `subscribe` 方法的第二个参数应该是订阅的内部"类型"。如果你的应用只提供一种订阅，可以将其命名为 `default` 或 `primary`。订阅类型仅供应用内部使用，不应展示给用户。此外，它不应包含空格，且在创建订阅后不应再更改。

你还可以使用 `customData` 方法提供一组关于订阅的自定义元数据：

```php
$checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
    ->customData(['key' => 'value'])
    ->returnTo(route('home'));
```

创建好订阅结账会话后，可以将该结账会话提供给 Cashier Paddle 附带的 `paddle-button` [Blade 组件](#overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

用户完成结账后，Paddle 会分发 `subscription_created` Webhook。Cashier 会接收该 Webhook，并为客户设置好订阅。为了确保你的应用能正确接收并处理所有 Webhook，请确保已正确[设置 Webhook 处理](#handling-paddle-webhooks)。

<a name="checking-subscription-status"></a>
### 检查订阅状态

用户订阅你的应用后，你可以使用多种便捷方法检查其订阅状态。首先，如果用户拥有有效订阅，`subscribed` 方法会返回 `true`，即使该订阅目前仍处于试用期内：

```php
if ($user->subscribed()) {
    // ...
}
```

如果你的应用提供多种订阅，你可以在调用 `subscribed` 方法时指定订阅：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也非常适合用作[路由中间件](/docs/{{version}}/middleware)，让你能够根据用户的订阅状态来控制对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSubscribed
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->subscribed()) {
            // 该用户不是付费客户...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想确定用户是否仍处于试用期内，可以使用 `onTrial` 方法。该方法有助于确定是否应向用户显示其仍处于试用期的提醒：

```php
if ($user->subscription()->onTrial()) {
    // ...
}
```

`subscribedToPrice` 方法可用于根据给定的 Paddle 价格 ID 判断用户是否订阅了给定套餐。在本示例中，我们将判断用户的 `default` 订阅是否有效订阅了月付价格：

```php
if ($user->subscribedToPrice($monthly = 'pri_123', 'default')) {
    // ...
}
```

`recurring` 方法可用于判断用户当前是否处于有效订阅状态，且已不在试用期或宽限期内：

```php
if ($user->subscription()->recurring()) {
    // ...
}
```

<a name="canceled-subscription-status"></a>
#### 已取消的订阅状态

要判断用户曾经是有效订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription()->canceled()) {
    // ...
}
```

你还可以判断用户是否已取消订阅、但仍处于订阅完全到期前的"宽限期"。例如，如果用户在 3 月 5 日取消了一个原定于 3 月 10 日到期的订阅，那么该用户在 3 月 10 日之前都处于"宽限期"。此外，在此期间 `subscribed` 方法仍会返回 `true`：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

<a name="past-due-status"></a>
#### 逾期状态

如果订阅的付款失败，该订阅会被标记为 `past_due`。订阅处于这种状态时，在客户更新支付信息之前，它将不再有效。你可以使用订阅实例上的 `pastDue` 方法判断订阅是否逾期：

```php
if ($user->subscription()->pastDue()) {
    // ...
}
```

当订阅逾期时，你应提示用户[更新其支付信息](#updating-payment-information)。

如果你希望订阅在 `past_due` 状态下仍被视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 方法。通常，该方法应在 `AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Paddle\Cashier;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
}
```

> [!WARNING]
> 订阅处于 `past_due` 状态时，在支付信息更新之前无法进行变更。因此，当订阅处于 `past_due` 状态时，`swap` 和 `updateQuantity` 方法会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也以查询作用域的形式提供，方便你在数据库中查询处于指定状态的订阅：

```php
// 获取所有有效订阅...
$subscriptions = Subscription::query()->valid()->get();

// 获取某用户所有已取消的订阅...
$subscriptions = $user->subscriptions()->canceled()->get();
```

可用作用域的完整列表如下：

```php
Subscription::query()->valid();
Subscription::query()->onTrial();
Subscription::query()->expiredTrial();
Subscription::query()->notOnTrial();
Subscription::query()->active();
Subscription::query()->recurring();
Subscription::query()->pastDue();
Subscription::query()->paused();
Subscription::query()->notPaused();
Subscription::query()->onPausedGracePeriod();
Subscription::query()->notOnPausedGracePeriod();
Subscription::query()->canceled();
Subscription::query()->notCanceled();
Subscription::query()->onGracePeriod();
Subscription::query()->notOnGracePeriod();
```

<a name="subscription-single-charges"></a>
### 订阅单次收费

订阅单次收费允许你在订阅的基础上向订阅者收取一次性费用。调用 `charge` 方法时，你必须提供一个或多个价格 ID：

```php
// 收取单个价格...
$response = $user->subscription()->charge('pri_123');

// 一次性收取多个价格...
$response = $user->subscription()->charge(['pri_123', 'pri_456']);
```

`charge` 方法实际上会等到订阅的下一个计费周期才向客户收费。如果你想立即向客户开票收款，可以改用 `chargeAndInvoice` 方法：

```php
$response = $user->subscription()->chargeAndInvoice('pri_123');
```

<a name="updating-payment-information"></a>
### 更新支付信息

Paddle 始终为每个订阅保存一个支付方式。如果你想更新订阅的默认支付方式，应使用订阅模型上的 `redirectToUpdatePaymentMethod` 方法，将客户重定向到 Paddle 托管的支付方式更新页面：

```php
use Illuminate\Http\Request;

Route::get('/update-payment-method', function (Request $request) {
    $user = $request->user();

    return $user->subscription()->redirectToUpdatePaymentMethod();
});
```

用户完成信息更新后，Paddle 会分发 `subscription_updated` Webhook，应用数据库中的订阅详情也会随之更新。

<a name="changing-plans"></a>
### 变更套餐

用户订阅你的应用后，偶尔可能想更换到新的订阅套餐。要更新用户的订阅套餐，你应将 Paddle 价格标识符传递给订阅的 `swap` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription()->swap($premium = 'pri_456');
```

如果你想更换套餐并立即向用户开票，而不是等到下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription()->swapAndInvoice($premium = 'pri_456');
```

<a name="prorations"></a>
#### 按比例计算

默认情况下，Paddle 在套餐之间切换时会按比例计算费用。`noProrate` 方法可用于在更新订阅时不按比例计算费用：

```php
$user->subscription('default')->noProrate()->swap($premium = 'pri_456');
```

如果你想禁用按比例计费并立即向客户开票，可以将 `swapAndInvoice` 方法与 `noProrate` 结合使用：

```php
$user->subscription('default')->noProrate()->swapAndInvoice($premium = 'pri_456');
```

或者，如果不想就订阅变更向客户收费，可以使用 `doNotBill` 方法：

```php
$user->subscription('default')->doNotBill()->swap($premium = 'pri_456');
```

有关 Paddle 按比例计费策略的更多信息，请查阅 Paddle 的[按比例计费文档](https://developer.paddle.com/concepts/subscriptions/proration)。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，一个项目管理应用可能会按项目每月收取 10 美元。要轻松增加或减少订阅数量，可以使用 `incrementQuantity` 和 `decrementQuantity` 方法：

```php
$user = User::find(1);

$user->subscription()->incrementQuantity();

// 在订阅当前数量上加五...
$user->subscription()->incrementQuantity(5);

$user->subscription()->decrementQuantity();

// 从订阅当前数量中减去五...
$user->subscription()->decrementQuantity(5);
```

此外，你也可以使用 `updateQuantity` 方法设置具体的数量：

```php
$user->subscription()->updateQuantity(10);
```

`noProrate` 方法可用于在更新订阅数量时不按比例计算费用：

```php
$user->subscription()->noProrate()->updateQuantity(10);
```

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 多产品订阅的数量

如果你的订阅是[包含多个产品的订阅](#subscriptions-with-multiple-products)，你应该将想要增减数量的价格 ID 作为第二个参数传递给增减方法：

```php
$user->subscription()->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 包含多个产品的订阅

[包含多个产品的订阅](https://developer.paddle.com/build/subscriptions/add-remove-products-prices-addons)允许你将多个计费产品分配给单个订阅。例如，假设你正在构建一个客服"帮助台"应用，其基础订阅价格为每月 10 美元，同时提供每月额外 15 美元的实时聊天附加产品。

创建订阅结账会话时，你可以通过向 `subscribe` 方法传递一个价格数组作为第一个参数，为给定订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe([
        'price_monthly',
        'price_chat',
    ]);

    return view('billing', ['checkout' => $checkout]);
});
```

在上面的示例中，客户的 `default` 订阅将附加两个价格。这两个价格将分别按照各自的计费周期收费。必要时，你可以传递一个键 / 值对的关联数组，为每个价格指定具体的数量：

```php
$user = User::find(1);

$checkout = $user->subscribe('default', ['price_monthly', 'price_chat' => 5]);
```

如果想为现有订阅添加其他价格，必须使用订阅的 `swap` 方法。调用 `swap` 方法时，还应一并传入订阅当前的价格和数量：

```php
$user = User::find(1);

$user->subscription()->swap(['price_chat', 'price_original' => 2]);
```

上面的示例会添加新价格，但在下一个计费周期之前不会向客户收取该价格的费用。如果想立即向客户开票收款，可以使用 `swapAndInvoice` 方法：

```php
$user->subscription()->swapAndInvoice(['price_chat', 'price_original' => 2]);
```

你可以使用 `swap` 方法并省略想要移除的价格，来从订阅中移除价格：

```php
$user->subscription()->swap(['price_original' => 2]);
```

> [!WARNING]
> 不能移除订阅上的最后一个价格。此时，你应该直接取消该订阅。

<a name="multiple-subscriptions"></a>
### 多重订阅

Paddle 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，同时提供游泳订阅和举重订阅，且每种订阅的价格可以不同。当然，客户应该可以只订阅其中一种，或者两种都订阅。

在应用创建订阅时，你可以将订阅类型作为第二个参数传递给 `subscribe` 方法。类型可以是任何代表用户所发起订阅类型的字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($swimmingMonthly = 'pri_123', 'swimming');

    return view('billing', ['checkout' => $checkout]);
});
```

在本示例中，我们为客户发起了一个月度游泳订阅。不过，客户之后可能想换成年度订阅。调整客户的订阅时，我们只需在 `swimming` 订阅上更换价格即可：

```php
$user->subscription('swimming')->swap($swimmingYearly = 'pri_456');
```

当然，你也可以完全取消该订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="pausing-subscriptions"></a>
### 暂停订阅

要暂停订阅，请在用户的订阅上调用 `pause` 方法：

```php
$user->subscription()->pause();
```

订阅被暂停后，Cashier 会自动设置数据库中的 `paused_at` 列。该列用于确定 `paused` 方法何时开始返回 `true`。例如，如果客户在 3 月 1 日暂停订阅，但订阅原定于 3 月 5 日才续期，那么 `paused` 方法在 3 月 5 日之前会一直返回 `false`。这是因为通常允许用户继续使用应用，直到其计费周期结束。

默认情况下，暂停会在下一个计费周期生效，这样客户可以用完其已付费周期的剩余时间。如果想立即暂停订阅，可以使用 `pauseNow` 方法：

```php
$user->subscription()->pauseNow();
```

使用 `pauseUntil` 方法，你可以将订阅暂停到某个特定时间点：

```php
$user->subscription()->pauseUntil(now()->plus(months: 1));
```

或者，你可以使用 `pauseNowUntil` 方法立即暂停订阅，直到给定的时间点：

```php
$user->subscription()->pauseNowUntil(now()->plus(months: 1));
```

你可以使用 `onPausedGracePeriod` 方法判断用户是否已暂停订阅、但仍处于"宽限期"：

```php
if ($user->subscription()->onPausedGracePeriod()) {
    // ...
}
```

要恢复已暂停的订阅，可以在订阅上调用 `resume` 方法：

```php
$user->subscription()->resume();
```

> [!WARNING]
> 订阅在暂停期间无法修改。如果想更换到其他套餐或更新数量，必须先恢复订阅。

<a name="canceling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription()->cancel();
```

订阅被取消后，Cashier 会自动设置数据库中的 `ends_at` 列。该列用于确定 `subscribed` 方法何时开始返回 `false`。例如，如果客户在 3 月 1 日取消订阅，但订阅原定于 3 月 5 日才结束，那么 `subscribed` 方法在 3 月 5 日之前会一直返回 `true`。这是因为通常允许用户继续使用应用，直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断用户是否已取消订阅、但仍处于"宽限期"：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

如果想立即取消订阅，可以在订阅上调用 `cancelNow` 方法：

```php
$user->subscription()->cancelNow();
```

要停止处于宽限期的订阅继续执行取消操作，可以调用 `stopCancelation` 方法：

```php
$user->subscription()->stopCancelation();
```

> [!WARNING]
> Paddle 的订阅一旦取消便无法恢复。如果你的客户希望恢复订阅，就必须重新创建一个新订阅。

<a name="subscription-trials"></a>
## 订阅试用期

<a name="with-payment-method-up-front"></a>
### 预收支付方式的试用期

如果你希望在为客户提供试用期的同时预先收集支付方式信息，你应该在 Paddle 控制面板中为客户所订阅的价格设置试用时长。然后，像往常一样发起结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

当你的应用收到 `subscription_created` 事件时，Cashier 会在应用数据库的订阅记录上设置试用期结束日期，并指示 Paddle 在此日期之后才开始向客户计费。

> [!WARNING]
> 如果客户在试用期结束日期之前未取消订阅，试用期一到就会被扣费，因此请务必将试用期结束日期告知你的用户。

你可以使用用户实例的 `onTrial` 方法判断用户是否处于试用期内：

```php
if ($user->onTrial()) {
    // ...
}
```

要判断现有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial()) {
    // ...
}
```

要判断用户是否正在试用特定类型的订阅，可以将类型传递给 `onTrial` 或 `hasExpiredTrial` 方法：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->hasExpiredTrial('default')) {
    // ...
}
```

<a name="without-payment-method-up-front"></a>
### 不预收支付方式的试用期

如果你希望提供试用期，但不需要预先收集用户的支付方式信息，可以将用户所关联客户记录上的 `trial_ends_at` 列设置为你期望的试用结束日期。这通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
]);

$user->createAsCustomer([
    'trial_ends_at' => now()->plus(days: 10)
]);
```

Cashier 将这类试用称为"通用试用"，因为它不与任何现有订阅关联。只要当前日期未超过 `trial_ends_at` 的值，`User` 实例上的 `onTrial` 方法就会返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

当你准备好为用户创建实际订阅时，可以照常使用 `subscribe` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

要获取用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户正在试用，该方法会返回一个 Carbon 日期实例，否则返回 `null`。如果想获取默认订阅之外其他特定订阅的试用结束日期，也可以传入可选的订阅类型参数：

```php
if ($user->onTrial('default')) {
    $trialEndsAt = $user->trialEndsAt();
}
```

如果你想确切知道用户正处于"通用"试用期内且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户正处于"通用"试用期内...
}
```

<a name="extend-or-activate-a-trial"></a>
### 延长或激活试用期

你可以调用 `extendTrial` 方法并指定试用结束的时间点，来延长订阅的现有试用期：

```php
$user->subscription()->extendTrial(now()->plus(days: 5));
```

或者，你可以通过在订阅上调用 `activate` 方法结束试用期，立即激活订阅：

```php
$user->subscription()->activate();
```

<a name="handling-paddle-webhooks"></a>
## 处理 Paddle Webhook

Paddle 可以通过 Webhook 向你的应用通知各种事件。默认情况下，Cashier 服务提供者会注册一个指向 Cashier Webhook 控制器的路由。该控制器会处理所有传入的 Webhook 请求。

默认情况下，该控制器会自动处理因扣费失败次数过多而取消订阅、订阅更新以及支付方式变更等操作；不过，正如我们即将看到的，你可以扩展该控制器来处理任何你想要的 Paddle Webhook 事件。

为确保你的应用能够处理 Paddle Webhook，请务必[在 Paddle 控制面板中配置 Webhook URL](https://vendors.paddle.com/notifications-v2)。默认情况下，Cashier 的 Webhook 控制器响应 `/paddle/webhook` URL 路径。你应在 Paddle 控制面板中启用的 Webhook 完整列表如下：

- Customer Updated
- Transaction Completed
- Transaction Updated
- Subscription Created
- Subscription Updated
- Subscription Paused
- Subscription Canceled

> [!WARNING]
> 请务必使用 Cashier 内置的 [Webhook 签名验证](/docs/{{version}}/cashier-paddle#verifying-webhook-signatures)中间件来保护传入请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Paddle Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应该确保 Laravel 不会尝试验证传入 Paddle Webhook 的 CSRF 令牌。为此，你应该在应用的 `bootstrap/app.php` 文件中将 `paddle/*` 排除在 CSRF 保护之外：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: [
        'paddle/*',
    ]);
})
```

<a name="webhooks-local-development"></a>
#### Webhook 与本地开发

要让 Paddle 在本地开发期间能够向你的应用发送 Webhook，你需要通过站点共享服务（如 [Ngrok](https://ngrok.com/) 或 [Expose](https://expose.dev/docs/introduction)）将应用暴露到外网。如果你正在使用 [Laravel Sail](/docs/{{version}}/sail) 进行本地开发，可以使用 Sail 的[站点共享命令](/docs/{{version}}/sail#sharing-your-site)。

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理因扣费失败而取消订阅以及其他常见的 Paddle Webhook。不过，如果你还有其他想要处理的 Webhook 事件，可以通过监听 Cashier 分发的以下事件来实现：

- `Laravel\Paddle\Events\WebhookReceived`
- `Laravel\Paddle\Events\WebhookHandled`

这两个事件都包含 Paddle Webhook 的完整负载。例如，如果你想处理 `transaction.billed` Webhook，可以注册一个处理该事件的[监听器](/docs/{{version}}/events#defining-listeners)：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * 处理收到的 Paddle Webhook。
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['event_type'] === 'transaction.billed') {
            // 处理传入事件...
        }
    }
}
```

Cashier 还会针对收到的 Webhook 类型分发专用事件。除 Paddle 的完整负载外，这些事件还包含处理 Webhook 时所涉及的相关模型，例如可计费模型、订阅或收据：

- `Laravel\Paddle\Events\CustomerUpdated`
- `Laravel\Paddle\Events\TransactionCompleted`
- `Laravel\Paddle\Events\TransactionUpdated`
- `Laravel\Paddle\Events\SubscriptionCreated`
- `Laravel\Paddle\Events\SubscriptionUpdated`
- `Laravel\Paddle\Events\SubscriptionPaused`
- `Laravel\Paddle\Events\SubscriptionCanceled`

你还可以通过在应用的 `.env` 文件中定义 `CASHIER_WEBHOOK` 环境变量，来覆盖默认的内置 Webhook 路由。该值应为 Webhook 路由的完整 URL，且需要与 Paddle 控制面板中设置的 URL 一致：

```ini
CASHIER_WEBHOOK=https://example.com/my-paddle-webhook-url
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 Webhook，你可以使用 [Paddle 的 Webhook 签名](https://developer.paddle.com/webhooks/signature-verification)。为了方便起见，Cashier 自动内置了一个中间件，用于验证传入的 Paddle Webhook 请求是否有效。

要启用 Webhook 验证，请确保在应用的 `.env` 文件中定义了 `PADDLE_WEBHOOK_SECRET` 环境变量。Webhook 密钥可以从你的 Paddle 账户控制面板获取。

<a name="single-charges"></a>
## 单次收费

<a name="charging-for-products"></a>
### 为产品收费

如果你想为客户发起一次产品购买，可以在可计费模型实例上使用 `checkout` 方法为该购买生成结账会话。`checkout` 方法接受一个或多个价格 ID。必要时，可以使用关联数组来指定所购产品的数量：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout(['pri_tshirt', 'pri_socks' => 5]);

    return view('buy', ['checkout' => $checkout]);
});
```

生成结账会话后，你可以使用 Cashier 提供的 `paddle-button` [Blade 组件](#overlay-checkout)让用户查看 Paddle 结账挂件并完成购买：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy
</x-paddle-button>
```

结账会话有一个 `customData` 方法，允许你向底层交易创建过程传递任意自定义数据。请查阅 [Paddle 文档](https://developer.paddle.com/build/transactions/custom-data)，了解传递自定义数据时可用的选项：

```php
$checkout = $user->checkout('pri_tshirt')
    ->customData([
        'custom_option' => $value,
    ]);
```

<a name="refunding-transactions"></a>
### 退款交易

退款会将退款金额返还到客户购买时使用的支付方式。如果需要退还某笔 Paddle 购买，你可以在 `Cashier\Paddle\Transaction` 模型上使用 `refund` 方法。该方法接受退款原因作为第一个参数，以及一个或多个要退款的价格 ID（可附带金额，以关联数组形式提供）。你可以使用 `transactions` 方法获取给定可计费模型的交易。

例如，假设我们要为价格 `pri_123` 和 `pri_456` 退还某笔特定交易。我们希望全额退还 `pri_123`，但 `pri_456` 只退还两美元：

```php
use App\Models\User;

$user = User::find(1);

$transaction = $user->transactions()->first();

$response = $transaction->refund('Accidental charge', [
    'pri_123', // 全额退还此价格...
    'pri_456' => 200, // 仅部分退还此价格...
]);
```

上面的示例退还了交易中的特定行项目。如果你想退还整笔交易，只需提供退款原因：

```php
$response = $transaction->refund('Accidental charge');
```

有关退款的更多信息，请查阅 [Paddle 的退款文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 退款在完全处理之前，始终需要经过 Paddle 的审批。

<a name="crediting-transactions"></a>
### 为交易入账余额

与退款类似，你还可以为交易入账余额。入账余额会将资金添加到客户的余额中，供其用于未来的购买。只有手动收取的交易才能入账余额，自动收取的交易（如订阅）则不行，因为 Paddle 会自动处理订阅的余额入账：

```php
$transaction = $user->transactions()->first();

// 为特定行项目全额入账余额...
$response = $transaction->credit('Compensation', 'pri_123');
```

更多信息请查阅 [Paddle 关于入账余额的文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 余额入账仅适用于手动收取的交易。自动收取的交易由 Paddle 自行处理余额入账。

<a name="transactions"></a>
## 交易

你可以通过 `transactions` 属性轻松获取可计费模型的交易数组：

```php
use App\Models\User;

$user = User::find(1);

$transactions = $user->transactions;
```

交易代表你的产品和购买的付款记录，并附有发票。只有已完成的交易才会存储在应用数据库中。

在列出客户的交易时，你可以使用交易实例的方法来展示相关付款信息。例如，你可能希望在表格中列出每笔交易，让用户能够轻松下载任意发票：

```html
<table>
    @foreach ($transactions as $transaction)
        <tr>
            <td>{{ $transaction->billed_at->toFormattedDateString() }}</td>
            <td>{{ $transaction->total() }}</td>
            <td>{{ $transaction->tax() }}</td>
            <td><a href="{{ route('download-invoice', $transaction->id) }}" target="_blank">Download</a></td>
        </tr>
    @endforeach
</table>
```

`download-invoice` 路由大致如下：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Transaction;

Route::get('/download-invoice/{transaction}', function (Request $request, Transaction $transaction) {
    return $transaction->redirectToInvoicePdf();
})->name('download-invoice');
```

<a name="past-and-upcoming-payments"></a>
### 历史与未来付款

你可以使用 `lastPayment` 和 `nextPayment` 方法来获取和显示周期性订阅的历史付款或未来付款：

```php
use App\Models\User;

$user = User::find(1);

$subscription = $user->subscription();

$lastPayment = $subscription->lastPayment();
$nextPayment = $subscription->nextPayment();
```

这两个方法都会返回一个 `Laravel\Paddle\Payment` 实例；不过，当交易尚未通过 Webhook 同步时，`lastPayment` 会返回 `null`；而当计费周期已结束（例如订阅已被取消）时，`nextPayment` 会返回 `null`：

```blade
Next payment: {{ $nextPayment->amount() }} due on {{ $nextPayment->date()->format('d/m/Y') }}
```

<a name="testing"></a>
## 测试

测试时，你应该手动测试计费流程，以确保集成按预期工作。

对于自动化测试（包括在 CI 环境中执行的测试），你可以使用 [Laravel 的 HTTP 客户端](/docs/{{version}}/http-client#testing)来伪造对 Paddle 发起的 HTTP 调用。虽然这无法测试 Paddle 的实际响应，但它提供了一种无需实际调用 Paddle API 即可测试应用的方式。
