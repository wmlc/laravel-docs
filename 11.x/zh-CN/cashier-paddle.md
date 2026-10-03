# Laravel Cashier (Paddle)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [Paddle 沙箱环境](#paddle-sandbox)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [Paddle JS](#paddle-js)
    - [货币配置](#currency-configuration)
    - [覆盖默认模型](#overriding-default-models)
- [快速上手](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [结账会话](#checkout-sessions)
    - [浮层结账](#overlay-checkout)
    - [内嵌结账](#inline-checkout)
    - [访客结账](#guest-checkouts)
- [价格预览](#price-previews)
    - [客户价格预览](#customer-price-previews)
    - [折扣](#price-discounts)
- [客户](#customers)
    - [客户默认值](#customer-defaults)
    - [获取客户](#retrieving-customers)
    - [创建客户](#creating-customers)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [订阅单次收费](#subscription-single-charges)
    - [更新支付信息](#updating-payment-information)
    - [变更套餐](#changing-plans)
    - [订阅数量](#subscription-quantity)
    - [包含多个产品的订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [暂停订阅](#pausing-subscriptions)
    - [取消订阅](#canceling-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先收集支付方式](#with-payment-method-up-front)
    - [不预先收集支付方式](#without-payment-method-up-front)
    - [延长或激活试用](#extend-or-activate-a-trial)
- [处理 Paddle Webhook](#handling-paddle-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [为产品收费](#charging-for-products)
    - [退款交易](#refunding-transactions)
    - [贷记交易](#crediting-transactions)
- [交易](#transactions)
    - [历史与未来付款](#past-and-upcoming-payments)
- [测试](#testing)

<a name="introduction"></a>
## 简介

> [!WARNING]
> 本文档适用于 Cashier Paddle 2.x 与 Paddle Billing 的集成。如果你仍在使用 Paddle Classic，应改用 [Cashier Paddle 1.x](https://github.com/laravel/cashier-paddle/tree/1.x)。

[Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle) 为 [Paddle](https://paddle.com) 的订阅计费服务提供了一套表达力强、流畅易用的接口。它处理了你原本畏惧的几乎所有订阅计费样板代码。除了基本的订阅管理，Cashier 还能处理：变更订阅、订阅"数量"、暂停订阅、取消订阅的宽限期等等。

在深入 Cashier Paddle 之前，我们建议你同时阅读 Paddle 的[概念指南](https://developer.paddle.com/concepts/overview)与 [API 文档](https://developer.paddle.com/api-reference/overview)。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本 Cashier 时，务必仔细阅读[升级指南](https://github.com/laravel/cashier-paddle/blob/master/UPGRADE.md)。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Paddle 对应的 Cashier 包：

```shell
composer require laravel/cashier-paddle
```

接下来，使用 `vendor:publish` Artisan 命令发布 Cashier 的迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，运行应用的数据库迁移。Cashier 的迁移会创建一个新的 `customers` 表。此外，还会创建新的 `subscriptions` 与 `subscription_items` 表，用于存储你所有客户的订阅。最后，会创建一个新的 `transactions` 表，用于存储与你的客户关联的所有 Paddle 交易：

```shell
php artisan migrate
```

> [!WARNING]
> 为确保 Cashier 正确处理所有 Paddle 事件，请记得[配置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

<a name="paddle-sandbox"></a>
### Paddle 沙箱环境

在本地与预发布开发环境中，你应当[注册一个 Paddle 沙箱账户](https://sandbox-login.paddle.com/signup)。该账户为你提供一个沙箱环境，可以在不产生真实支付的情况下测试与开发应用。你可以使用 Paddle 的[测试卡号](https://developer.paddle.com/concepts/payment-methods/credit-debit-card)模拟各种支付场景。

使用 Paddle 沙箱环境时，你应当在应用的 `.env` 文件中把 `PADDLE_SANDBOX` 环境变量设为 `true`：

```ini
PADDLE_SANDBOX=true
```

应用开发完成之后，你可以[申请 Paddle 供应商账户](https://paddle.com)。在应用正式上线之前，Paddle 需要审核你的应用域名。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

使用 Cashier 之前，你必须把 `Billable` Trait 添加到你的用户模型定义中。该 Trait 提供了多种方法，让你能够执行常见的计费任务，例如创建订阅、更新支付方式信息：

```php
use Laravel\Paddle\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

如果你有一些并非用户的可计费实体，也可以把该 Trait 添加到这些类上：

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

接下来，你应当在应用的 `.env` 文件中配置 Paddle 密钥。你可以从 Paddle 控制面板获取 Paddle API 密钥：

```ini
PADDLE_CLIENT_SIDE_TOKEN=your-paddle-client-side-token
PADDLE_API_KEY=your-paddle-api-key
PADDLE_RETAIN_KEY=your-paddle-retain-key
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"
PADDLE_SANDBOX=true
```

使用 [Paddle 沙箱环境](#paddle-sandbox)时，`PADDLE_SANDBOX` 环境变量应设为 `true`。如果要把应用部署到生产环境并使用 Paddle 的正式供应商环境，`PADDLE_SANDBOX` 变量应设为 `false`。

`PADDLE_RETAIN_KEY` 是可选的，只有在使用 Paddle 的 [Retain](https://developer.paddle.com/paddlejs/retain) 时才需要设置。

<a name="paddle-js"></a>
### Paddle JS

Paddle 依靠自己的 JavaScript 库来初始化 Paddle 结账组件。你可以把 `@paddleJS` Blade 指令放在应用布局的 `</head>` 结束标签之前，来加载该 JavaScript 库：

```blade
<head>
    ...

    @paddleJS
</head>
```

<a name="currency-configuration"></a>
### 货币配置

你可以指定一个区域设置（locale），用于在发票上格式化显示金额。在内部，Cashier 使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域设置：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 要使用 `en` 以外的区域设置，请确保服务器上已安装并配置 `ext-intl` PHP 扩展。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以通过定义自己的模型并继承相应的 Cashier 模型，来扩展 Cashier 内部使用的模型：

```php
use Laravel\Paddle\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义好模型后，你可以通过 `Laravel\Paddle\Cashier` 类指示 Cashier 使用你的自定义模型。通常应在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

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
## 快速上手

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应当在 Paddle 仪表板中定义具有固定价格的产品。此外，你还应当[配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

通过应用提供产品与订阅计费可能让人望而生畏。不过，多亏了 Cashier 和 [Paddle 的 Checkout 浮层](https://www.paddle.com/billing/checkout)，你可以轻松构建现代、稳健的支付集成。

要为非递归的单次收费产品向客户收费，我们可以利用 Cashier 通过 Paddle 的 Checkout 浮层向客户收费，客户将在其中填写支付信息并确认购买。通过 Checkout 浮层完成支付后，客户会被重定向到你应用中由你指定的一个成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout('pri_deluxe_album')
        ->returnTo(route('dashboard'));

    return view('buy', ['checkout' => $checkout]);
})->name('checkout');
```

如上面例子所示，我们会使用 Cashier 提供的 `checkout` 方法创建一个结账对象，为给定的"价格标识"向客户呈现 Paddle Checkout 浮层。在 Paddle 中，"价格"指的是[为特定产品定义的价格](https://developer.paddle.com/build/products/create-products-prices)。

如果有必要，`checkout` 方法会自动在 Paddle 中创建一个客户，并把该 Paddle 客户记录与应用数据库中的对应用户关联起来。完成结账会话后，客户会被重定向到一个专门的成功页面，你可以在那里向客户显示提示信息。

在 `buy` 视图中，我们会包含一个用于显示 Checkout 浮层的按钮。Cashier Paddle 自带 `paddle-button` Blade 组件；不过你也可以[手动渲染浮层结账](#manually-rendering-an-overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy Product
</x-paddle-button>
```

<a name="providing-meta-data-to-paddle-checkout"></a>
#### 向 Paddle Checkout 提供元数据

销售产品时，通常会通过你自己应用定义的 `Cart` 与 `Order` 模型来跟踪已完成的订单与已购买的产品。当把客户重定向到 Paddle 的 Checkout 浮层以完成购买时，你可能需要提供一个已有的订单标识，以便客户被重定向回应用后，你能把已完成的购买与对应订单关联起来。

为此，你可以向 `checkout` 方法提供一份自定义数据数组。假设用户开始结账流程时，我们的应用会创建一个待处理的 `Order`。请记住，本例中的 `Cart` 与 `Order` 模型仅作示意，并非 Cashier 提供。你可以完全根据自己应用的需求来实现这些概念：

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

如上面例子所示，当用户开始结账流程时，我们会把购物车/订单关联的所有 Paddle 价格标识提供给 `checkout` 方法。当然，当客户添加这些条目时，你的应用负责把它们与"购物车"或订单关联起来。我们还通过 `customData` 方法把订单 ID 提供给 Paddle Checkout 浮层。

当然，客户完成结账流程后，你很可能希望把订单标记为"已完成"。为此，你可以监听 Paddle 分发、并由 Cashier 通过事件抛出的 Webhook，把订单信息存储到数据库中。

要开始，请监听 Cashier 分发的 `TransactionCompleted` 事件。通常应在应用的 `AppServiceProvider` 的 `boot` 方法中注册该事件监听器：

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

在本例中，`CompleteOrder` 监听器可能如下所示：

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

有关 `transaction.completed` 事件所包含数据的更多信息，请参阅 Paddle 的文档。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应当在 Paddle 仪表板中定义具有固定价格的产品。此外，你还应当[配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

通过应用提供产品与订阅计费可能让人望而生畏。不过，多亏了 Cashier 和 [Paddle 的 Checkout 浮层](https://www.paddle.com/billing/checkout)，你可以轻松构建现代、稳健的支付集成。

要了解如何使用 Cashier 与 Paddle 的 Checkout 浮层销售订阅，我们来考虑一个简单的订阅服务场景：提供基础月度（`price_basic_monthly`）与年度（`price_basic_yearly`）套餐。在我们的 Paddle 仪表板中，这两个价格可以归到同一个"Basic"产品（`pro_basic`）下。此外，我们的订阅服务还可以提供 Expert 套餐，对应 `pro_expert`。

首先，我们来看一下客户如何订阅我们的服务。你可以想象，客户可能会在应用的定价页上点击 Basic 套餐的"订阅"按钮。该按钮会为其选择的套餐调起 Paddle Checkout 浮层。要开始，让我们通过 `checkout` 方法初始化一个结账会话：

```php
use Illuminate\Http\Request;

Route::get('/subscribe', function (Request $request) {
    $checkout = $request->user()->checkout('price_basic_monthly')
        ->returnTo(route('dashboard'));

    return view('subscribe', ['checkout' => $checkout]);
})->name('subscribe');
```

在 `subscribe` 视图中，我们会包含一个用于显示 Checkout 浮层的按钮。Cashier Paddle 自带 `paddle-button` Blade 组件；不过你也可以[手动渲染浮层结账](#manually-rendering-an-overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

现在，当订阅按钮被点击时，客户将能够填写支付信息并发起订阅。为了知道他们的订阅究竟何时开始（因为某些支付方式需要几秒钟处理），你还应当[配置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

既然客户现在可以开始订阅，我们就需要限制应用的某些部分，使只有已订阅的用户才能访问。当然，我们始终可以通过 Cashier 的 `Billable` Trait 提供的 `subscribed` 方法判断用户当前的订阅状态：

```blade
@if ($user->subscribed())
    <p>You are subscribed.</p>
@endif
```

我们甚至可以轻松判断用户是否订阅了特定产品或价格：

```blade
@if ($user->subscribedToProduct('pro_basic'))
    <p>You are subscribed to our Basic product.</p>
@endif

@if ($user->subscribedToPrice('price_basic_monthly'))
    <p>You are subscribed to our monthly Basic plan.</p>
@endif
```

<a name="quickstart-building-a-subscribed-middleware"></a>
#### 构建"已订阅"中间件

为方便起见，你或许想创建一个[中间件](/docs/{{version}}/middleware)，用来判断传入请求是否来自已订阅的用户。定义该中间件后，就可以轻松把它赋给路由，阻止未订阅的用户访问该路由：

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
            // 把用户重定向到账单页面并提示其订阅...
            return redirect('/subscribe');
        }

        return $next($request);
    }
}
```

中间件定义完成后，你可以把它赋给路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理自己的计费套餐

当然，客户可能希望把自己的订阅套餐换成另一个产品或"层级"。在上面的例子中，我们希望允许客户把套餐从月度订阅改为年度订阅。为此，你需要实现一个类似下面的按钮，指向相应的路由：

```php
use Illuminate\Http\Request;

Route::put('/subscription/{price}/swap', function (Request $request, $price) {
    $user->subscription()->swap($price); // 本例中 "$price" 为 "price_basic_yearly"。

    return redirect()->route('dashboard');
})->name('subscription.swap');
```

除了变更套餐，你还需要允许客户取消订阅。与变更套餐一样，请提供一个指向以下路由的按钮：

```php
use Illuminate\Http\Request;

Route::put('/subscription/cancel', function (Request $request, $price) {
    $user->subscription()->cancel();

    return redirect()->route('dashboard');
})->name('subscription.cancel');
```

现在，该订阅会在当前计费周期结束时被取消。

> [!NOTE]
> 只要你已经配置好 Cashier 的 Webhook 处理，Cashier 就会通过检查来自 Paddle 的传入 Webhook，自动让应用中与 Cashier 相关的数据库表保持同步。例如，当客户通过 Paddle 仪表板取消订阅时，Cashier 会收到相应的 Webhook，并在你的应用数据库中把该订阅标记为"已取消"。

<a name="checkout-sessions"></a>
## 结账会话

大多数向客户计费的操作，都是通过 Paddle 的 [Checkout 浮层组件](https://developer.paddle.com/build/checkout/build-overlay-checkout)或[内嵌结账](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)以"结账"的方式完成的。

在使用 Paddle 处理结账支付之前，你应当在 Paddle 结账设置仪表板中定义应用的[默认支付链接](https://developer.paddle.com/build/transactions/default-payment-link#set-default-link)。

<a name="overlay-checkout"></a>
### 浮层结账

在显示 Checkout 浮层组件之前，你必须使用 Cashier 生成一个结账会话。结账会话会告知结账组件应当执行哪个计费操作：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

Cashier 自带一个 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)。你可以把结账会话作为"属性"传给该组件。这样，当用户点击该按钮时，就会显示 Paddle 的结账组件：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

默认情况下，这会以 Paddle 的默认样式显示该组件。你可以向组件添加[Paddle 支持的属性](https://developer.paddle.com/paddlejs/html-data-attributes)（例如 `data-theme='light'` 属性）来自定义组件：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4" data-theme="light">
    Subscribe
</x-paddle-button>
```

Paddle 的结账组件是异步的。一旦用户在组件中创建订阅，Paddle 就会向你的应用发送一个 Webhook，以便你正确更新应用数据库中的订阅状态。因此，你务必正确地[配置 Webhook](#handling-paddle-webhooks)以应对来自 Paddle 的状态变更。

> [!WARNING]
> 订阅状态变更之后，收到相应 Webhook 通常只有极短的延迟，但你应当在应用中考虑到这一点：客户完成结账后，其订阅可能并非立即可用。

<a name="manually-rendering-an-overlay-checkout"></a>
#### 手动渲染浮层结账

你也可以不使用 Laravel 内置的 Blade 组件，手动渲染浮层结账。要开始，请[像前面示例中那样](#overlay-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在本例中，我们创建一个带有 `paddle_button` 类的链接。Paddle.js 会检测到这个类，并在链接被点击时显示浮层结账：

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

如果你不想使用 Paddle 的"浮层"式结账组件，Paddle 也提供了内嵌显示该组件的选项。虽然这种方式不允许你调整结账的任何 HTML 字段，但它允许你把该组件嵌入到你的应用中。

为方便你快速上手内嵌结账，Cashier 自带一个 `paddle-checkout` Blade 组件。要开始，你应当[生成结账会话](#overlay-checkout)：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以把结账会话传给该组件的 `checkout` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" />
```

要调整内嵌结账组件的高度，可以向该 Blade 组件传入 `height` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" height="500" />
```

有关内嵌结账自定义选项的更多细节，请查阅 Paddle 的[内嵌结账指南](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)与[可用结账设置](https://developer.paddle.com/build/checkout/set-up-checkout-default-settings)。

<a name="manually-rendering-an-inline-checkout"></a>
#### 手动渲染内嵌结账

你也可以不使用 Laravel 内置的 Blade 组件，手动渲染内嵌结账。要开始，请[像前面示例中那样](#inline-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在本例中，我们会使用 [Alpine.js](https://github.com/alpinejs/alpine)来演示；不过你可以根据自己的前端技术栈修改本例：

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

有时，你可能需要为不需要应用账户的用户创建结账会话。为此，你可以使用 `guest` 方法：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Checkout;

Route::get('/buy', function (Request $request) {
    $checkout = Checkout::guest(['pri_34567'])
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以把结账会话提供给 [Paddle 按钮](#overlay-checkout)或[内嵌结账](#inline-checkout) Blade 组件。

<a name="price-previews"></a>
## 价格预览

Paddle 允许你按货币自定义价格，本质上就是让你为不同国家配置不同价格。Cashier Paddle 允许你使用 `previewPrices` 方法获取所有这些价格。该方法接受你希望获取价格的价格 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456']);
```

货币会根据请求的 IP 地址确定；不过你也可以选择性地提供具体国家来获取价格：

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

你也可以分别显示小计价格与税额：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->subtotal() }} (+ {{ $price->tax() }} tax)</li>
    @endforeach
</ul>
```

更多信息，请[查阅 Paddle 关于价格预览的 API 文档](https://developer.paddle.com/api-reference/pricing-preview/preview-prices)。

<a name="customer-price-previews"></a>
### 客户价格预览

如果某个用户已经是客户，并且你想展示适用于该客户的价格，可以直接从客户实例获取这些价格：

```php
use App\Models\User;

$prices = User::find(1)->previewPrices(['pri_123', 'pri_456']);
```

在内部，Cashier 会使用用户的客户 ID 获取其所属货币的价格。因此，例如，居住在美国的用户会看到以美元计价的价格，而比利时的用户会看到以欧元计价的价格。如果找不到匹配的货币，就会使用产品的默认货币。你可以在 Paddle 控制面板中自定义某个产品或订阅套餐的所有价格。

<a name="price-discounts"></a>
### 折扣

你也可以选择展示折扣后的价格。调用 `previewPrices` 方法时，通过 `discount_id` 选项提供折扣 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], [
    'discount_id' => 'dsc_123'
]);
```

然后展示计算后的价格：

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

Cashier 允许你为客户定义一些在创建结账会话时很有用的默认值。设置这些默认值后，你可以预填客户的邮箱地址与姓名，让他们能直接进入结账组件的付款环节。你可以在可计费模型上覆盖以下方法来设置这些默认值：

```php
/**
 * 获取要关联到 Paddle 的客户名称。
 */
public function paddleName(): string|null
{
    return $this->name;
}

/**
 * 获取要关联到 Paddle 的客户邮箱地址。
 */
public function paddleEmail(): string|null
{
    return $this->email;
}
```

Cashier 中所有生成[结账会话](#checkout-sessions)的操作都会使用这些默认值。

<a name="retrieving-customers"></a>
### 获取客户

你可以通过 `Cashier::findBillable` 方法按 Paddle 客户 ID 获取客户。该方法会返回一个可计费模型实例：

```php
use Laravel\Paddle\Cashier;

$user = Cashier::findBillable($customerId);
```

<a name="creating-customers"></a>
### 创建客户

偶尔你可能想创建一个 Paddle 客户但不开始订阅。为此，你可以使用 `createAsCustomer` 方法：

```php
$customer = $user->createAsCustomer();
```

该方法返回一个 `Laravel\Paddle\Customer` 实例。客户在 Paddle 中创建完成后，你可以稍后再开始订阅。你可以提供一个可选的 `$options` 数组，用于传入 [Paddle API 支持的任何额外客户创建参数](https://developer.paddle.com/api-reference/customers/create-customer)：

```php
$customer = $user->createAsCustomer($options);
```

<a name="subscriptions"></a>
## 订阅

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，先从数据库中获取可计费模型的实例，通常是 `App\Models\User` 的实例。获取模型实例后，你可以使用 `subscribe` 方法创建该模型的结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($premium = 12345, 'default')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

传给 `subscribe` 方法的第一个参数是用户要订阅的具体价格。该值应当对应 Paddle 中该价格的标识。`returnTo` 方法接受一个 URL，用户成功完成结账后会被重定向到该地址。传给 `subscribe` 方法的第二个参数应当是订阅的内部"类型"。如果你的应用只提供一种订阅，可以把它命名为 `default` 或 `primary`。该订阅类型仅供应用内部使用，不打算展示给用户。此外，它不应包含空格，并且在创建订阅后不应再更改。

你还可以使用 `customData` 方法提供一份关于该订阅的自定义元数据数组：

```php
$checkout = $request->user()->subscribe($premium = 12345, 'default')
    ->customData(['key' => 'value'])
    ->returnTo(route('home'));
```

创建订阅结账会话后，可以把该结账会话提供给 Cashier Paddle 自带的 `paddle-button` [Blade 组件](#overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

用户完成结账后，Paddle 会分发一个 `subscription_created` Webhook。Cashier 会接收该 Webhook，并为你的客户设置好订阅。为确保所有 Webhook 都能被应用正确接收与处理，请确保已正确[配置 Webhook 处理](#handling-paddle-webhooks)。

<a name="checking-subscription-status"></a>
### 检查订阅状态

用户订阅你的应用之后，你可以使用多种便捷方法检查其订阅状态。首先，如果用户拥有有效订阅，`subscribed` 方法会返回 `true`，即使该订阅目前仍处于试用期：

```php
if ($user->subscribed()) {
    // ...
}
```

如果你的应用提供多种订阅，可以在调用 `subscribed` 方法时指定订阅：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也非常适合用作[路由中间件](/docs/{{version}}/middleware)，让你能根据用户的订阅状态过滤对路由与控制器的访问：

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

如果你想判断某个用户是否仍处于试用期内，可以使用 `onTrial` 方法。该方法有助于判断是否应当向用户提示其仍处于试用期：

```php
if ($user->subscription()->onTrial()) {
    // ...
}
```

`subscribedToPrice` 方法可用于根据给定的 Paddle 价格 ID 判断用户是否订阅了某个套餐。在本例中，我们会判断用户的 `default` 订阅是否正处于月度价格的活跃订阅状态：

```php
if ($user->subscribedToPrice($monthly = 'pri_123', 'default')) {
    // ...
}
```

`recurring` 方法可用于判断用户当前是否处于活跃订阅状态，且已不在试用期或宽限期内：

```php
if ($user->subscription()->recurring()) {
    // ...
}
```

<a name="canceled-subscription-status"></a>
#### 已取消的订阅状态

要判断某个用户是否曾是活跃订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription()->canceled()) {
    // ...
}
```

你也可以判断某个用户是否已取消订阅，但在订阅完全到期前仍处于"宽限期"。例如，如果某个用户在 3 月 5 日取消了原定于 3 月 10 日到期的订阅，那么该用户将处于"宽限期"直到 3 月 10 日。此外，在此期间 `subscribed` 方法仍会返回 `true`：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

<a name="past-due-status"></a>
#### 逾期状态

如果订阅的付款失败，它会被标记为 `past_due`。当你的订阅处于该状态时，在客户更新支付信息之前它都不会处于活跃状态。你可以在订阅实例上使用 `pastDue` 方法判断订阅是否已逾期：

```php
if ($user->subscription()->pastDue()) {
    // ...
}
```

订阅逾期时，你应当提示用户[更新其支付信息](#updating-payment-information)。

如果你希望订阅处于 `past_due` 状态时仍被视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 方法。通常应在你的 `AppServiceProvider` 的 `register` 方法中调用该方法：

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
> 订阅处于 `past_due` 状态时无法更改，直到支付信息被更新。因此，订阅处于 `past_due` 状态时，`swap` 与 `updateQuantity` 方法会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅查询作用域

大多数订阅状态同时也以查询作用域的形式提供，方便你轻松查询数据库中处于特定状态的订阅：

```php
// 获取所有有效订阅...
$subscriptions = Subscription::query()->valid()->get();

// 获取某个用户的全部已取消订阅...
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

订阅单次收费让你可以在订阅之外，向订阅者收取一次性费用。调用 `charge` 方法时，你必须提供一个或多个价格 ID：

```php
// 收取单个价格...
$response = $user->subscription()->charge('pri_123');

// 一次收取多个价格...
$response = $user->subscription()->charge(['pri_123', 'pri_456']);
```

`charge` 方法不会立即向客户扣款，而是等到其订阅的下一个计费周期。如果你希望立即向客户收费，可以改用 `chargeAndInvoice` 方法：

```php
$response = $user->subscription()->chargeAndInvoice('pri_123');
```

<a name="updating-payment-information"></a>
### 更新支付信息

Paddle 始终为每个订阅保存一个支付方式。如果你想更新订阅的默认支付方式，应当在订阅模型上使用 `redirectToUpdatePaymentMethod` 方法，把客户重定向到 Paddle 托管的支付方式更新页面：

```php
use Illuminate\Http\Request;

Route::get('/update-payment-method', function (Request $request) {
    $user = $request->user();

    return $user->subscription()->redirectToUpdatePaymentMethod();
});
```

用户完成信息更新后，Paddle 会分发一个 `subscription_updated` Webhook，订阅详情也会在你的应用数据库中更新。

<a name="changing-plans"></a>
### 变更套餐

用户订阅你的应用之后，偶尔可能希望切换到新的订阅套餐。要更新用户的订阅套餐，应当把 Paddle 价格的标识传给订阅的 `swap` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription()->swap($premium = 'pri_456');
```

如果你希望变更套餐后立即为用户开票，而不是等到其下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription()->swapAndInvoice($premium = 'pri_456');
```

<a name="prorations"></a>
#### 按比例计费

默认情况下，Paddle 在套餐之间切换时按比例计费。可以使用 `noProrate` 方法在不按比例计费的情况下更新订阅：

```php
$user->subscription('default')->noProrate()->swap($premium = 'pri_456');
```

如果你希望禁用按比例计费并立即为客户开票，可以结合使用 `swapAndInvoice` 方法与 `noProrate`：

```php
$user->subscription('default')->noProrate()->swapAndInvoice($premium = 'pri_456');
```

或者，如果你不想因订阅变更而向客户收费，可以使用 `doNotBill` 方法：

```php
$user->subscription('default')->doNotBill()->swap($premium = 'pri_456');
```

有关 Paddle 按比例计费策略的更多信息，请查阅 Paddle 的[按比例计费文档](https://developer.paddle.com/concepts/subscriptions/proration)。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，一个项目管理应用可能每个项目每月收取 10 美元。要轻松增减订阅数量，请使用 `incrementQuantity` 与 `decrementQuantity` 方法：

```php
$user = User::find(1);

$user->subscription()->incrementQuantity();

// 在订阅当前数量上增加五...
$user->subscription()->incrementQuantity(5);

$user->subscription()->decrementQuantity();

// 在订阅当前数量上减少五...
$user->subscription()->decrementQuantity(5);
```

或者，你可以使用 `updateQuantity` 方法设置具体数量：

```php
$user->subscription()->updateQuantity(10);
```

可以使用 `noProrate` 方法在不按比例计费的情况下更新订阅数量：

```php
$user->subscription()->noProrate()->updateQuantity(10);
```

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 包含多个产品的订阅数量

如果你的订阅属于[包含多个产品的订阅](#subscriptions-with-multiple-products)，则应当把希望增减数量的价格 ID 作为第二个参数传给增减方法：

```php
$user->subscription()->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 包含多个产品的订阅

[包含多个产品的订阅](https://developer.paddle.com/build/subscriptions/add-remove-products-prices-addons)让你能够为单个订阅分配多个计费产品。例如，假设你正在构建一个客服"帮助台"应用，其基础订阅价格为每月 10 美元，同时提供实时聊天附加产品，每月额外收取 15 美元。

创建订阅结账会话时，你可以把一组价格作为 `subscribe` 方法的第一个参数传入，从而为给定订阅指定多个产品：

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

在上例中，客户的名下会有两个价格关联到其 `default` 订阅。两个价格都会在各自的计费周期内收费。如果有必要，你可以传入一组键/值对关联数组，为每个价格指定具体数量：

```php
$user = User::find(1);

$checkout = $user->subscribe('default', ['price_monthly', 'price_chat' => 5]);
```

如果你想为已有订阅再添加一个价格，必须使用该订阅的 `swap` 方法。调用 `swap` 方法时，还应当一并包含该订阅当前的价格与数量：

```php
$user = User::find(1);

$user->subscription()->swap(['price_chat', 'price_original' => 2]);
```

上例会添加新的价格，但在客户的下一个计费周期之前不会为其收费。如果你希望立即向客户收费，可以使用 `swapAndInvoice` 方法：

```php
$user->subscription()->swapAndInvoice(['price_chat', 'price_original' => 2]);
```

你可以使用 `swap` 方法并省略想要移除的价格，从订阅中移除价格：

```php
$user->subscription()->swap(['price_original' => 2]);
```

> [!WARNING]
> 你不能移除订阅上的最后一个价格。相反，你应当直接取消该订阅。

<a name="multiple-subscriptions"></a>
### 多个订阅

Paddle 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅与举重订阅，每种订阅可以有不同的定价。当然，客户应当能够订阅其中任意一个或两个套餐。

当你的应用创建订阅时，可以把订阅类型作为 `subscribe` 方法的第二个参数提供。该类型可以是任意能表示用户所发起订阅类型的字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($swimmingMonthly = 'pri_123', 'swimming');

    return view('billing', ['checkout' => $checkout]);
});
```

在本例中，我们为客户发起了一个月度游泳订阅。不过，客户可能希望在稍后切换到年度订阅。调整客户订阅时，只需在 `swimming` 订阅上变更价格：

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

订阅被暂停时，Cashier 会自动设置数据库中的 `paused_at` 列。该列用于确定 `paused` 方法从何时开始返回 `true`。例如，如果客户在 3 月 1 日暂停了订阅，但该订阅原定在 3 月 5 日续期，那么 `paused` 方法会继续返回 `false` 直到 3 月 5 日。这是因为通常允许用户继续使用应用，直到其计费周期结束。

默认情况下，暂停会在下一个计费周期生效，这样客户就能用完其已付费期间的剩余时间。如果你想立即暂停订阅，可以使用 `pauseNow` 方法：

```php
$user->subscription()->pauseNow();
```

使用 `pauseUntil` 方法，你可以把订阅暂停到某个特定时间点：

```php
$user->subscription()->pauseUntil(now()->addMonth());
```

或者，你可以使用 `pauseNowUntil` 方法立即暂停订阅，直到某个时间点：

```php
$user->subscription()->pauseNowUntil(now()->addMonth());
```

你可以使用 `onPausedGracePeriod` 方法判断某个用户是否已暂停订阅但仍处于"宽限期"：

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
> 订阅处于暂停状态时无法修改。如果你想切换到其他套餐或更新数量，必须先恢复该订阅。

<a name="canceling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription()->cancel();
```

订阅被取消时，Cashier 会自动设置数据库中的 `ends_at` 列。该列用于确定 `subscribed` 方法从何时开始返回 `false`。例如，如果客户在 3 月 1 日取消了订阅，但该订阅原定在 3 月 5 日结束，那么 `subscribed` 方法会继续返回 `true` 直到 3 月 5 日。这是因为通常允许用户继续使用应用，直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断某个用户是否已取消订阅但仍处于"宽限期"：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

如果你想立即取消订阅，可以在订阅上调用 `cancelNow` 方法：

```php
$user->subscription()->cancelNow();
```

要阻止处于宽限期的订阅被取消，可以在订阅上调用 `stopCancelation` 方法：

```php
$user->subscription()->stopCancelation();
```

> [!WARNING]
> Paddle 的订阅在取消后无法恢复。如果客户希望恢复订阅，就必须创建新的订阅。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先收集支付方式

如果你想在向客户提供试用期的同时预先收集支付方式信息，应当在 Paddle 仪表板中为客户订阅的价格设置试用时长。然后，像平常一样初始化结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

当你的应用收到 `subscription_created` 事件时，Cashier 会在应用数据库中的订阅记录上设置试用期结束日期，同时指示 Paddle 在该日期之后再开始向客户收费。

> [!WARNING]
> 如果客户的订阅在试用期结束日期之前没有取消，试用期一结束就会被扣费，因此务必确保通知用户其试用期结束日期。

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法来判断用户是否处于试用期内。下面的两个例子是等价的：

```php
if ($user->onTrial()) {
    // ...
}

if ($user->subscription()->onTrial()) {
    // ...
}
```

要判断已有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial()) {
    // ...
}

if ($user->subscription()->hasExpiredTrial()) {
    // ...
}
```

要判断某个用户是否正在试用某个特定订阅类型，可以把类型传给 `onTrial` 或 `hasExpiredTrial` 方法：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->hasExpiredTrial('default')) {
    // ...
}
```

<a name="without-payment-method-up-front"></a>
### 不预先收集支付方式

如果你想在提供试用期时不预先收集用户的支付方式信息，可以把关联到你用户的客户记录上的 `trial_ends_at` 列设为你期望的试用期结束日期。这通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
]);

$user->createAsCustomer([
    'trial_ends_at' => now()->addDays(10)
]);
```

Cashier 把这种试用称为"通用试用"，因为它并未关联到任何已有订阅。如果当前日期尚未超过 `trial_ends_at` 的值，`User` 实例上的 `onTrial` 方法会返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

准备好为该用户创建正式订阅后，你可以照常使用 `subscribe` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

要获取用户的试用期结束日期，可以使用 `trialEndsAt` 方法。如果用户正在试用，该方法返回一个 Carbon 日期实例；否则返回 `null`。如果你想获取默认订阅以外某个特定订阅的试用期结束日期，也可以传入可选的订阅类型参数：

```php
if ($user->onTrial('default')) {
    $trialEndsAt = $user->trialEndsAt();
}
```

如果你想确切知道用户仍处于其"通用"试用期且尚未创建正式订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于其"通用"试用期内...
}
```

<a name="extend-or-activate-a-trial"></a>
### 延长或激活试用

你可以通过调用 `extendTrial` 方法并指定试用结束的时间点，来延长某个订阅上已有的试用期：

```php
$user->subscription()->extendTrial(now()->addDays(5));
```

或者，你可以通过调用订阅上的 `activate` 方法结束试用，从而立即激活订阅：

```php
$user->subscription()->activate();
```

<a name="handling-paddle-webhooks"></a>
## 处理 Paddle Webhook

Paddle 可以通过 Webhook 把各种事件通知你的应用。默认情况下，Cashier 服务提供商会注册一个指向 Cashier Webhook 控制器的路由。该控制器会处理所有传入的 Webhook 请求。

默认情况下，该控制器会自动处理因扣款失败次数过多而取消订阅、订阅更新以及支付方式变更；不过，正如我们马上会看到的，你可以扩展该控制器来处理任意 Paddle Webhook 事件。

为确保你的应用能够处理 Paddle Webhook，请务必[在 Paddle 控制面板中配置 Webhook URL](https://vendors.paddle.com/alerts-webhooks)。默认情况下，Cashier 的 Webhook 控制器响应 `/paddle/webhook` URL 路径。你应当在 Paddle 控制面板中启用的全部 Webhook 列表如下：

- Customer Updated
- Transaction Completed
- Transaction Updated
- Subscription Created
- Subscription Updated
- Subscription Paused
- Subscription Canceled

> [!WARNING]
> 请务必使用 Cashier 自带的 [Webhook 签名验证](/docs/{{version}}/cashier-paddle#verifying-webhook-signatures)中间件保护传入的请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Paddle Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应当确保 Laravel 不会尝试为传入的 Paddle Webhook 验证 CSRF 令牌。为此，应当在应用的 `bootstrap/app.php` 文件中把 `paddle/*` 排除在 CSRF 保护之外：

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'paddle/*',
    ]);
})
```

<a name="webhooks-local-development"></a>
#### Webhook 与本地开发

要让 Paddle 能够在本地开发期间向你的应用发送 Webhook，你需要通过 [Ngrok](https://ngrok.com/) 或 [Expose](https://expose.dev/docs/introduction) 之类的站点共享服务把应用暴露出去。如果你使用 [Laravel Sail](/docs/{{version}}/sail)在本地开发应用，可以使用 Sail 的[站点共享命令](/docs/{{version}}/sail#sharing-your-site)。

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理扣款失败导致的订阅取消，以及其他常见的 Paddle Webhook。不过，如果你还想处理额外的 Webhook 事件，可以监听 Cashier 分发的以下事件：

- `Laravel\Paddle\Events\WebhookReceived`
- `Laravel\Paddle\Events\WebhookHandled`

这两个事件都包含 Paddle Webhook 的完整载荷。例如，如果你想处理 `transaction.billed` Webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners)来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * 处理接收到的 Paddle Webhook。
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['event_type'] === 'transaction.billed') {
            // 处理传入的事件...
        }
    }
}
```

Cashier 还会为接收到的 Webhook 类型抛出专门的事件。除了来自 Paddle 的完整载荷之外，这些事件还包含用于处理该 Webhook 的相关模型，例如可计费模型、订阅或收据：

<div class="content-list" markdown="1">

- `Laravel\Paddle\Events\CustomerUpdated`
- `Laravel\Paddle\Events\TransactionCompleted`
- `Laravel\Paddle\Events\TransactionUpdated`
- `Laravel\Paddle\Events\SubscriptionCreated`
- `Laravel\Paddle\Events\SubscriptionUpdated`
- `Laravel\Paddle\Events\SubscriptionPaused`
- `Laravel\Paddle\Events\SubscriptionCanceled`

</div>

你还可以通过在应用的 `.env` 文件中定义 `CASHIER_WEBHOOK` 环境变量来覆盖默认的内置 Webhook 路由。该值应当是你的 Webhook 路由的完整 URL，并且需要与 Paddle 控制面板中设置的 URL 一致：

```ini
CASHIER_WEBHOOK=https://example.com/my-paddle-webhook-url
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 Webhook，可以使用 [Paddle 的 Webhook 签名](https://developer.paddle.com/webhook-reference/verifying-webhooks)。为方便起见，Cashier 自带一个中间件，用于验证传入的 Paddle Webhook 请求是否有效。

要启用 Webhook 验证，请确保在应用的 `.env` 文件中定义了 `PADDLE_WEBHOOK_SECRET` 环境变量。Webhook 密钥可以从 Paddle 账户仪表板获取。

<a name="single-charges"></a>
## 单次收费

<a name="charging-for-products"></a>
### 为产品收费

如果你想为某个客户发起产品购买，可以在可计费模型实例上使用 `checkout` 方法生成该次购买的结账会话。`checkout` 方法接受一个或多个价格 ID。如果有必要，可以使用关联数组来提供所购买产品的数量：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout(['pri_tshirt', 'pri_socks' => 5]);

    return view('buy', ['checkout' => $checkout]);
});
```

生成结账会话后，你可以使用 Cashier 提供的 `paddle-button` [Blade 组件](#overlay-checkout)，让用户查看 Paddle 结账组件并完成购买：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy
</x-paddle-button>
```

结账会话提供了一个 `customData` 方法，允许你把任意自定义数据传给底层的交易创建过程。有关传入自定义数据时可用的选项，请查阅 [Paddle 文档](https://developer.paddle.com/build/transactions/custom-data)：

```php
$checkout = $user->checkout('pri_tshirt')
    ->customData([
        'custom_option' => $value,
    ]);
```

<a name="refunding-transactions"></a>
### 退款交易

退款会把退款金额退回客户购买时使用的支付方式。如果你需要为某笔 Paddle 购买退款，可以在 `Cashier\Paddle\Transaction` 模型上使用 `refund` 方法。该方法接受退款理由作为第一个参数，以及一个或多个价格 ID 作为退款项；若要指定金额，可使用关联数组传入。你可以使用 `transactions` 方法获取给定可计费模型的交易。

例如，假设我们要为价格 `pri_123` 与 `pri_456` 的一笔具体交易退款。我们希望全额退还 `pri_123`，但只退还 `pri_456` 的两美元：

```php
use App\Models\User;

$user = User::find(1);

$transaction = $user->transactions()->first();

$response = $transaction->refund('Accidental charge', [
    'pri_123', // 全额退还该价格...
    'pri_456' => 200, // 仅部分退还该价格...
]);
```

上例会退还交易中的特定行项目。如果你想退还整笔交易，只需提供退款理由：

```php
$response = $transaction->refund('Accidental charge');
```

有关退款的更多信息，请查阅 [Paddle 的退款文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 退款在完全处理之前，必须始终获得 Paddle 的批准。

<a name="crediting-transactions"></a>
### 贷记交易

与退款类似，你也可以对交易进行贷记。贷记交易会把资金加入客户余额，供其用于后续购买。贷记交易只能针对手动收取的交易，自动收取的交易（如订阅）无法贷记，因为 Paddle 会自动处理订阅贷记：

```php
$transaction = $user->transactions()->first();

// 全额贷记某个特定行项目...
$response = $transaction->credit('Compensation', 'pri_123');
```

更多信息，请[参阅 Paddle 关于贷记的文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 贷记只能应用于手动收取的交易。自动收取的交易由 Paddle 自行贷记。

<a name="transactions"></a>
## 交易

你可以通过 `transactions` 属性轻松获取某个可计费模型的交易数组：

```php
use App\Models\User;

$user = User::find(1);

$transactions = $user->transactions;
```

交易表示客户对你的产品与购买内容所进行的付款，并配有发票。只有已完成的交易才会存储在你的应用数据库中。

列出客户的交易时，你可以使用交易实例上的方法展示相关的付款信息。例如，你可能希望把每笔交易列成一张表，方便用户下载任意发票：

```blade
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

`download-invoice` 路由可以写成下面这样：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Transaction;

Route::get('/download-invoice/{transaction}', function (Request $request, Transaction $transaction) {
    return $transaction->redirectToInvoicePdf();
})->name('download-invoice');
```

<a name="past-and-upcoming-payments"></a>
### 历史与未来付款

你可以使用 `lastPayment` 与 `nextPayment` 方法获取并展示客户在递归订阅中的历史付款或未来付款：

```php
use App\Models\User;

$user = User::find(1);

$subscription = $user->subscription();

$lastPayment = $subscription->lastPayment();
$nextPayment = $subscription->nextPayment();
```

这两个方法都会返回一个 `Laravel\Paddle\Payment` 实例；不过在交易尚未通过 Webhook 同步时，`lastPayment` 会返回 `null`，而在计费周期已结束（例如订阅已被取消）时，`nextPayment` 会返回 `null`：

```blade
Next payment: {{ $nextPayment->amount() }} due on {{ $nextPayment->date()->format('d/m/Y') }}
```

<a name="testing"></a>
## 测试

在测试过程中，你应当手动测试自己的计费流程，确保集成符合预期。

对于自动化测试（包括在 CI 环境中执行的测试），你可以使用 [Laravel 的 HTTP 客户端](/docs/{{version}}/http-client#testing)来模拟对 Paddle 发出的 HTTP 调用。虽然这并不能测试 Paddle 的真实响应，但它提供了在无需真正调用 Paddle API 的情况下测试应用的方式。
