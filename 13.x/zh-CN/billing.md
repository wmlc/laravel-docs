# Laravel Cashier (Stripe)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [货币配置](#currency-configuration)
    - [税务配置](#tax-configuration)
    - [日志](#logging)
    - [使用自定义模型](#using-custom-models)
- [快速开始](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [客户](#customers)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
    - [更新客户](#updating-customers)
    - [余额](#balances)
    - [税务 ID](#tax-ids)
    - [与 Stripe 同步客户数据](#syncing-customer-data-with-stripe)
    - [账单门户](#billing-portal)
- [支付方式](#payment-methods)
    - [存储支付方式](#storing-payment-methods)
    - [检索支付方式](#retrieving-payment-methods)
    - [支付方式是否存在](#payment-method-presence)
    - [更新默认支付方式](#updating-the-default-payment-method)
    - [添加支付方式](#adding-payment-methods)
    - [删除支付方式](#deleting-payment-methods)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [变更价格](#changing-prices)
    - [订阅数量](#subscription-quantity)
    - [包含多个产品的订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [基于用量的计费](#usage-based-billing)
    - [订阅税务](#subscription-taxes)
    - [订阅锚定日期](#subscription-anchor-date)
    - [取消订阅](#cancelling-subscriptions)
    - [恢复订阅](#resuming-subscriptions)
- [订阅试用](#subscription-trials)
    - [预付支付方式](#with-payment-method-up-front)
    - [不预付支付方式](#without-payment-method-up-front)
    - [延长试用](#extending-trials)
- [处理 Stripe Webhook](#handling-stripe-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次扣款](#single-charges)
    - [简单扣款](#simple-charge)
    - [带发票的扣款](#charge-with-invoice)
    - [创建 Payment Intent](#creating-payment-intents)
    - [退款](#refunding-charges)
- [发票](#invoices)
    - [检索发票](#retrieving-invoices)
    - [即将到来的发票](#upcoming-invoices)
    - [预览订阅发票](#previewing-subscription-invoices)
    - [生成发票 PDF](#generating-invoice-pdfs)
- [结账](#checkout)
    - [产品结账](#product-checkouts)
    - [单次扣款结账](#single-charge-checkouts)
    - [订阅结账](#subscription-checkouts)
    - [收集税务 ID](#collecting-tax-ids)
    - [访客结账](#guest-checkouts)
- [处理失败支付](#handling-failed-payments)
    - [确认支付](#confirming-payments)
- [强客户认证（SCA）](#strong-customer-authentication)
    - [需要额外确认的支付](#payments-requiring-additional-confirmation)
    - [离线会话支付通知](#off-session-payment-notifications)
- [Stripe SDK](#stripe-sdk)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe](https://stripe.com) 的订阅计费服务提供了一个富有表现力、流畅的接口。它处理了几乎所有你不愿编写的订阅计费样板代码。除了基础的订阅管理之外，Cashier 还能处理优惠券、替换订阅、订阅"数量"、取消宽限期，甚至生成发票 PDF。

<a name="upgrading-cashier"></a>
## 升级 Cashier

当升级到 Cashier 的新版本时，请务必仔细查看 [升级指南](https://github.com/laravel/cashier-stripe/blob/16.x/UPGRADE.md)。

> [!WARNING]
> 为了防止出现破坏性变更，Cashier 使用固定的 Stripe API 版本。Cashier 16 使用 Stripe API 版本 `2025-06-30.basil`。Stripe API 版本会在次要版本发布时更新，以便利用新的 Stripe 功能与改进。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Cashier 的 Stripe 包：

```shell
composer require laravel/cashier
```

安装包之后，使用 `vendor:publish` Artisan 命令发布 Cashier 的数据库迁移：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，迁移你的数据库：

```shell
php artisan migrate
```

Cashier 的迁移会向你的 `users` 表添加若干列，同时创建一个 `subscriptions` 表来存储客户的所有订阅，以及一个 `subscription_items` 表用于存储包含多个价格的订阅。

如果需要，你也可以使用 `vendor:publish` Artisan 命令发布 Cashier 的配置文件：

```shell
php artisan vendor:publish --tag="cashier-config"
```

最后，为了确保 Cashier 能正确处理所有 Stripe 事件，请记得[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

> [!WARNING]
> Stripe 建议任何用于存储 Stripe 标识符的列都应区分大小写。因此，在使用 MySQL 时，你应确保 `stripe_id` 列的排序规则设置为 `utf8_bin`。有关这方面的更多信息，可在 [Stripe 文档](https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible) 中找到。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

在使用 Cashier 之前，请将 `Billable` trait 添加到你的可计费模型定义中。通常，这将是 `App\Models\User` 模型。该 trait 提供了多种方法，让你可以执行常见的计费任务，例如创建订阅、应用优惠券以及更新支付方式信息：

```php
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

Cashier 假定你的可计费模型将是 Laravel 自带的 `App\Models\User` 类。如果你想更改这一点，可以通过 `useCustomerModel` 方法指定不同的模型。该方法通常应在你的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use App\Models\Cashier\User;
use Laravel\Cashier\Cashier;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Cashier::useCustomerModel(User::class);
}
```

> [!WARNING]
> 如果你使用的不是 Laravel 自带的 `App\Models\User` 模型，你需要发布并修改提供的 [Cashier 迁移](#installation)，以匹配你的替代模型的表名。

<a name="api-keys"></a>
### API 密钥

接下来，你应在应用程序的 `.env` 文件中配置你的 Stripe API 密钥。你可以从 Stripe 控制面板获取你的 Stripe API 密钥：

```ini
STRIPE_KEY=your-stripe-key
STRIPE_SECRET=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

> [!WARNING]
> 你应确保 `STRIPE_WEBHOOK_SECRET` 环境变量已在你的应用程序的 `.env` 文件中定义，因为该变量用于确保传入的 Webhook 确实来自 Stripe。

<a name="currency-configuration"></a>
### 货币配置

Cashier 的默认货币是美元（USD）。你可以通过在你的应用程序的 `.env` 文件中设置 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=eur
```

除了配置 Cashier 的货币之外，你还可以指定一个区域设置（locale），用于格式化发票上显示的货币值。在内部，Cashier 利用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php) 来设置货币区域设置：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 为了使用除 `en` 之外的区域设置，请确保服务器上已安装并配置了 `ext-intl` PHP 扩展。

<a name="tax-configuration"></a>
### 税务配置

借助 [Stripe Tax](https://stripe.com/tax)，可以自动计算 Stripe 生成的所有发票的税费。你可以通过在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法来启用自动税费计算：

```php
use Laravel\Cashier\Cashier;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Cashier::calculateTaxes();
}
```

一旦启用了税费计算，任何新订阅以及任何一次性生成的发票都将获得自动税费计算。

要使此功能正常工作，客户的账单详细信息（如客户名称、地址和税务 ID）需要与 Stripe 同步。你可以使用 Cashier 提供的[客户数据同步](#syncing-customer-data-with-stripe) 和[税务 ID](#tax-ids) 方法来实现这一点。

<a name="logging"></a>
### 日志

Cashier 允许你指定在记录致命的 Stripe 错误时所使用的日志通道。你可以通过在你的应用程序的 `.env` 文件中定义 `CASHIER_LOGGER` 环境变量来指定日志通道：

```ini
CASHIER_LOGGER=stack
```

由对 Stripe 的 API 调用产生的异常将通过你应用程序的默认日志通道记录下来。

<a name="using-custom-models"></a>
### 使用自定义模型

你可以自由地通过定义自己的模型并继承相应的 Cashier 模型，来扩展 Cashier 内部使用的模型：

```php
use Laravel\Cashier\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义好模型后，你可以通过 `Laravel\Cashier\Cashier` 类指示 Cashier 使用你的自定义模型。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\SubscriptionItem;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useSubscriptionItemModel(SubscriptionItem::class);
}
```

<a name="quickstart"></a>
## 快速开始

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应在 Stripe 控制面板中定义具有固定价格的产品。此外，你还应[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

通过你的应用程序提供产品和订阅计费可能令人望而生畏。然而，借助 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、健壮的支付集成。

要向客户收取非周期性、单次收费产品的费用，我们将利用 Cashier 将客户引导至 Stripe Checkout，客户将在那里提供其支付详细信息并确认其购买。一旦通过 Checkout 完成支付，客户将被重定向到你应用程序中选择的成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/checkout', function (Request $request) {
    $stripePriceId = 'price_deluxe_album';

    $quantity = 1;

    return $request->user()->checkout([$stripePriceId => $quantity], [
        'success_url' => route('checkout-success'),
        'cancel_url' => route('checkout-cancel'),
    ]);
})->name('checkout');

Route::view('/checkout/success', 'checkout.success')->name('checkout-success');
Route::view('/checkout/cancel', 'checkout.cancel')->name('checkout-cancel');
```

如上面的示例所示，我们将利用 Cashier 提供的 `checkout` 方法，将客户重定向到给定"价格标识符"的 Stripe Checkout。使用 Stripe 时，"价格"指的是[特定产品定义的定价](https://stripe.com/docs/products-prices/how-products-and-prices-work)。

如有必要，`checkout` 方法会自动在 Stripe 中创建一个客户，并将该 Stripe 客户记录连接到你应用程序数据库中对应的用户。完成结账会话后，客户将被重定向到一个专门的成功或取消页面，你可以在那里向客户显示一条信息性消息。

<a name="providing-meta-data-to-stripe-checkout"></a>
#### 向 Stripe Checkout 提供元数据

销售产品时，通过你的应用程序自定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品是很常见的做法。当将客户重定向到 Stripe Checkout 以完成购买时，你可能需要提供一个已有的订单标识符，以便在客户被重定向回你的应用程序时，将完成的购买与对应的订单关联起来。

为此，你可以向 `checkout` 方法提供一个 `metadata` 数组。让我们想象一下，当用户开始结账流程时，会在我们的应用程序中创建一个待处理的 `Order`。请记住，此示例中的 `Cart` 和 `Order` 模型仅作说明用途，并非由 Cashier 提供。你可以根据自己应用程序的需要自由实现这些概念：

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

    return $request->user()->checkout($order->price_ids, [
        'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => route('checkout-cancel'),
        'metadata' => ['order_id' => $order->id],
    ]);
})->name('checkout');
```

如上面的示例所示，当用户开始结账流程时，我们会向 `checkout` 方法提供购物车 / 订单关联的所有 Stripe 价格标识符。当然，你的应用程序负责在客户添加这些项目时将它们与"购物车"或订单关联起来。我们还通过 `metadata` 数组将订单的 ID 提供给了 Stripe Checkout 会话。最后，我们在 Checkout 成功路由上添加了 `CHECKOUT_SESSION_ID` 模板变量。当 Stripe 将客户重定向回你的应用程序时，此模板变量将自动填充为 Checkout 会话 ID。

接下来，让我们构建 Checkout 成功路由。这是用户通过 Stripe Checkout 完成购买后将被重定向到的路由。在该路由内，我们可以检索 Stripe Checkout 会话 ID 和关联的 Stripe Checkout 实例，以便访问我们提供的元数据并相应地更新客户的订单：

```php
use App\Models\Order;
use Illuminate\Http\Request;
use Laravel\Cashier\Cashier;

Route::get('/checkout/success', function (Request $request) {
    $sessionId = $request->get('session_id');

    if ($sessionId === null) {
        return;
    }

    $session = Cashier::stripe()->checkout->sessions->retrieve($sessionId);

    if ($session->payment_status !== 'paid') {
        return;
    }

    $orderId = $session['metadata']['order_id'] ?? null;

    $order = Order::findOrFail($orderId);

    $order->update(['status' => 'completed']);

    return view('checkout-success', ['order' => $order]);
})->name('checkout-success');
```

更多关于 Checkout 会话对象所包含数据的信息，请参阅 Stripe 的[文档](https://stripe.com/docs/api/checkout/sessions/object)。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应在 Stripe 控制面板中定义具有固定价格的产品。此外，你还应[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

通过你的应用程序提供产品和订阅计费可能令人望而生畏。然而，借助 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、健壮的支付集成。

要了解如何使用 Cashier 和 Stripe Checkout 销售订阅，让我们考虑一个简单场景：一个订阅服务带有一个基础的月度（`price_basic_monthly`）和年度（`price_basic_yearly`）计划。这两个价格可以归在我们 Stripe 控制面板中的一个"Basic"产品（`pro_basic`）下。此外，我们的订阅服务可能提供一个 Expert 计划作为 `pro_expert`。

首先，让我们了解客户如何订阅我们的服务。当然，你可以想象客户可能会在我们的应用程序定价页面上点击 Basic 计划的"订阅"按钮。这个按钮或链接应将用户引导到一个 Laravel 路由，该路由为其选择的计划创建 Stripe Checkout 会话：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_basic_monthly')
        ->trialDays(5)
        ->allowPromotionCodes()
        ->checkout([
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

如上面的示例所示，我们将把客户重定向到一个 Stripe Checkout 会话，该会话将允许他们订阅我们的 Basic 计划。在成功结账或取消后，客户将被重定向回我们提供给 `checkout` 方法的 URL。为了知道他们的订阅何时真正开始（因为某些支付方式需要几秒钟来处理），我们还需要[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

既然客户可以开始订阅，我们需要限制应用程序的某些部分，以便只有已订阅的用户才能访问它们。当然，我们始终可以通过 Cashier 的 `Billable` trait 提供的 `subscribed` 方法判断用户当前的订阅状态：

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

为方便起见，你可能希望创建一个[中间件](/docs/{{version}}/middleware)，用于判断传入的请求是否来自已订阅的用户。一旦定义了这个中间件，你就可以轻松地将其分配给某个路由，以防止未订阅的用户访问该路由：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Subscribed
{
    /**
     * 处理传入的请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            // 将用户重定向到账单页面，要求他们订阅...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

一旦定义了中间件，你就可以将其分配给一个路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理其账单计划

当然，客户可能希望将其订阅计划更改为另一个产品或"层级"。最简单的方法是引导客户使用 Stripe 的 [Customer Billing Portal](https://stripe.com/docs/no-code/customer-portal)，它提供了一个托管的用户界面，让客户可以下载发票、更新其支付方式以及更改订阅计划。

首先，在你的应用程序中定义一个链接或按钮，将用户引导到一个 Laravel 路由，我们将利用该路由来启动账单门户会话：

```blade
<a href="{{ route('billing') }}">
    Billing
</a>
```

接下来，让我们定义启动 Stripe 客户账单门户会话并将用户重定向到门户的路由。`redirectToBillingPortal` 方法接受用户退出门户时应返回的 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('dashboard'));
})->middleware(['auth'])->name('billing');
```

> [!NOTE]
> 只要配置了 Cashier 的 Webhook 处理，Cashier 就会通过检查来自 Stripe 的传入 Webhook 自动使你的应用程序中与 Cashier 相关的数据库表保持同步。例如，当用户通过 Stripe 的客户账单门户取消其订阅时，Cashier 将收到相应的 Webhook，并在你的应用程序数据库中将该订阅标记为"已取消"。

<a name="customers"></a>
## 客户

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法通过客户的 Stripe ID 检索客户。该方法将返回一个可计费模型的实例：

```php
use Laravel\Cashier\Cashier;

$user = Cashier::findBillable($stripeId);
```

<a name="creating-customers"></a>
### 创建客户

有时，你可能希望在不开始订阅的情况下创建一个 Stripe 客户。你可以使用 `createAsStripeCustomer` 方法来完成这一操作：

```php
$stripeCustomer = $user->createAsStripeCustomer();
```

一旦客户在 Stripe 中创建完成，你可以在稍后的日期开始订阅。你可以提供一个可选的 `$options` 数组，以传入任何 [Stripe API 支持的客户创建参数](https://stripe.com/docs/api/customers/create)：

```php
$stripeCustomer = $user->createAsStripeCustomer($options);
```

如果你想为可计费模型返回 Stripe 客户对象，可以使用 `asStripeCustomer` 方法：

```php
$stripeCustomer = $user->asStripeCustomer();
```

如果你希望检索给定可计费模型的 Stripe 客户对象，但不确定该可计费模型是否已经是 Stripe 中的客户，可以使用 `createOrGetStripeCustomer` 方法。如果尚不存在客户，该方法将在 Stripe 中创建一个新客户：

```php
$stripeCustomer = $user->createOrGetStripeCustomer();
```

<a name="updating-customers"></a>
### 更新客户

有时，你可能希望直接使用附加信息更新 Stripe 客户。你可以使用 `updateStripeCustomer` 方法来完成这一操作。该方法接受一组 [Stripe API 支持的客户更新选项](https://stripe.com/docs/api/customers/update)：

```php
$stripeCustomer = $user->updateStripeCustomer($options);
```

<a name="balances"></a>
### 余额

Stripe 允许你向客户的"余额"中记入贷方或借方。之后，此余额将在新发票上被记入贷方或借方。要检查客户的总余额，你可以使用可计费模型上可用的 `balance` 方法。`balance` 方法将返回以客户货币表示的余额的格式化字符串：

```php
$balance = $user->balance();
```

要向客户的余额记入贷方，你可以向 `creditBalance` 方法提供一个值。如果需要，你还可以提供一个描述：

```php
$user->creditBalance(500, 'Premium customer top-up.');
```

向 `debitBalance` 方法提供一个值将从客户的余额中借记：

```php
$user->debitBalance(300, 'Bad usage penalty.');
```

`applyBalance` 方法将为客户创建新的客户余额交易。你可以使用 `balanceTransactions` 方法检索这些交易记录，这对于向客户提供贷方和借方的日志以供查阅可能很有用：

```php
// 检索所有交易...
$transactions = $user->balanceTransactions();

foreach ($transactions as $transaction) {
    // 交易金额...
    $amount = $transaction->amount(); // $2.31

    // 在可用时检索关联的发票...
    $invoice = $transaction->invoice();
}
```

<a name="tax-ids"></a>
### 税务 ID

Cashier 提供了一种简便的方法来管理客户的税务 ID。例如，`taxIds` 方法可用于检索分配给客户的所有[税务 ID](https://stripe.com/docs/api/customer_tax_ids/object)，以集合的形式返回：

```php
$taxIds = $user->taxIds();
```

你还可以通过标识符检索客户的特定税务 ID：

```php
$taxId = $user->findTaxId('txi_belgium');
```

你可以通过向 `createTaxId` 方法提供有效的[类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type) 和值来创建新的税务 ID：

```php
$taxId = $user->createTaxId('eu_vat', 'BE0123456789');
```

`createTaxId` 方法会立即将 VAT ID 添加到客户的账户中。[VAT ID 的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；不过，这是一个异步过程。你可以通过订阅 `customer.tax_id.updated` Webhook 事件并检查 [VAT ID 的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification) 来获取验证更新。有关处理 Webhook 的更多信息，请参阅[定义 Webhook 处理器](#handling-stripe-webhooks) 的文档。

你可以使用 `deleteTaxId` 方法删除税务 ID：

```php
$user->deleteTaxId('txi_belgium');
```

<a name="syncing-customer-data-with-stripe"></a>
### 与 Stripe 同步客户数据

通常，当你的应用程序用户更新其姓名、电子邮件地址或其他同样由 Stripe 存储的信息时，你应通知 Stripe 这些更新。这样做，Stripe 所保存的信息副本将与你的应用程序保持同步。

为了实现自动化，你可以在可计费模型上定义一个事件监听器，用于响应模型的 `updated` 事件。然后，在事件监听器内部，你可以调用模型上的 `syncStripeCustomerDetails` 方法：

```php
use App\Models\User;
use function Illuminate\Events\queueable;

/**
 * 模型的"booted"方法。
 */
protected static function booted(): void
{
    static::updated(queueable(function (User $customer) {
        if ($customer->hasStripeId()) {
            $customer->syncStripeCustomerDetails();
        }
    }));
}
```

现在，每次你的客户模型被更新时，其信息都会与 Stripe 同步。为方便起见，Cashier 会在客户初次创建时自动将客户信息与 Stripe 同步。

你可以通过重写 Cashier 提供的多种方法来自定义用于与客户信息同步到 Stripe 的列。例如，你可以重写 `stripeName` 方法，以自定义在 Cashier 将客户信息同步到 Stripe 时应被视为客户"姓名"的属性：

```php
/**
 * 获取应同步到 Stripe 的客户姓名。
 */
public function stripeName(): string|null
{
    return $this->company_name;
}
```

类似地，你可以重写 `stripeEmail`、`stripePhone`（最多 20 个字符）、`stripeAddress` 和 `stripePreferredLocales` 方法。这些方法在[更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update) 时会将其信息同步到对应的客户参数。如果你想完全控制客户信息同步过程，可以重写 `syncStripeCustomerDetails` 方法。

<a name="billing-portal"></a>
### 账单门户

Stripe 提供了[一种简便的方法来设置账单门户](https://stripe.com/docs/billing/subscriptions/customer-portal)，以便你的客户可以管理其订阅、支付方式并查看其账单历史。你可以通过在控制器或路由中调用可计费模型上的 `redirectToBillingPortal` 方法将用户重定向到账单门户：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal();
});
```

默认情况下，当用户完成管理其订阅后，他们将能够通过 Stripe 账单门户中的链接返回到你的应用程序的 `home` 路由。你可以提供一个自定义 URL，让用户在返回时重定向到该 URL，只需将该 URL 作为参数传递给 `redirectToBillingPortal` 方法：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('billing'));
});
```

如果你想在不生成 HTTP 重定向响应的情况下生成账单门户的 URL，可以调用 `billingPortalUrl` 方法：

```php
$url = $request->user()->billingPortalUrl(route('billing'));
```

<a name="payment-methods"></a>
## 支付方式

<a name="storing-payment-methods"></a>
### 存储支付方式

为了创建订阅或使用 Stripe 执行"一次性"扣款，你的应用程序需要安全地从客户那里收集支付详细信息。实现这一目标的方法因你计划是存储支付方式以备将来的订阅之需，还是立即处理单次扣款而异，因此我们将在下面分别探讨这两种情况。

Stripe 的 [Payment Element](https://stripe.com/docs/payments/payment-element) 可用于支持多种支付方式，例如信用卡、Apple Pay、Google Pay 和 iDEAL。

<a name="payment-element-for-subscriptions"></a>
#### 用于订阅的 Payment Element

首先，创建一个 Setup Intent 并将其传递给你的视图：

```php
return view('subscribe', [
    'intent' => $user->createSetupIntent()
]);
```

使用 Setup Intent 的 `client_secret` 挂载 Payment Element：

```html
<div id="payment-element"></div>
<button id="submit">Subscribe</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $intent->client_secret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: '{{ route("subscription.complete") }}',
            },
        });

        if (error) {
            // 向用户显示"error.message"...
        }
    });
</script>
```

在 Stripe 重定向到你的 `return_url` 之后，`setup_intent` ID 将作为一个查询字符串参数可用。你可以使用此值检索支付方式并创建订阅：

```php
use Illuminate\Http\Request;

Route::get('/subscription/complete', function (Request $request) {
    $setupIntent = $request->user()->findSetupIntent(
        $request->setup_intent
    );

    $paymentMethod = $setupIntent->payment_method;

    $request->user()
        ->newSubscription('default', 'price_xxx')
        ->create($paymentMethod);

    return redirect('/dashboard');
})->name('subscription.complete');
```

如果你使用 Payment Element 来更新客户的默认支付方式，而不是创建订阅，你可以将支付方式标识符传递给 [`updateDefaultPaymentMethod`](#updating-the-default-payment-method) 方法。

<a name="payment-element-for-single-charges"></a>
#### 用于单次扣款的 Payment Element

对于一次性支付，使用 Cashier 的 `pay` 方法创建一个 Payment Intent。通常，你应将 Payment Intent ID 存储在你应用程序对应的订单中，以便在 Stripe 将客户重定向回你的应用程序后能够检索到订单。以下示例假定你的应用程序有一个 `Order` 模型，包含 `user_id`、`amount`、`status` 和 `stripe_payment_intent_id` 列：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $amount = 1000;

    $payment = $request->user()->pay($amount);

    $order = Order::create([
        'user_id' => $request->user()->id,
        'amount' => $amount,
        'status' => 'pending',
        'stripe_payment_intent_id' => $payment->id,
    ]);

    return view('checkout', [
        'clientSecret' => $payment->client_secret,
        'order' => $order,
    ]);
});
```

然后，挂载 Payment Element 并确认支付：

```html
<div id="payment-element"></div>
<button id="submit">Pay Now</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $clientSecret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: '{{ route("payment.complete") }}',
            },
        });

        if (error) {
            // 向用户显示"error.message"...
        }
    });
</script>
```

重定向之后，你可以使用 `payment_intent` 查询字符串参数检索对应的订单和 Payment Intent。在履行订单之前，你应验证该订单属于已认证的客户，并且 Payment Intent 属于已认证的客户且已成功：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/payment/complete', function (Request $request) {
    $order = Order::where('user_id', $request->user()->id)
        ->where('stripe_payment_intent_id', $request->payment_intent)
        ->firstOrFail();

    $paymentIntent = $request->user()
        ->stripe()
        ->paymentIntents
        ->retrieve($request->payment_intent);

    if ($paymentIntent->customer === $request->user()->stripe_id &&
        $paymentIntent->status === 'succeeded') {
        $order->update(['status' => 'paid']);

        // 履行订单...
    }

    return redirect('/dashboard');
})->name('payment.complete');
```

<a name="retrieving-payment-methods"></a>
### 检索支付方式

可计费模型实例上的 `paymentMethods` 方法会返回一个 `Laravel\Cashier\PaymentMethod` 实例的集合：

```php
$paymentMethods = $user->paymentMethods();
```

默认情况下，该方法将返回每种类型的支付方式。要检索特定类型的支付方式，你可以将 `type` 作为参数传递给该方法：

```php
$paymentMethods = $user->paymentMethods('sepa_debit');
```

要检索客户的默认支付方式，可以使用 `defaultPaymentMethod` 方法：

```php
$paymentMethod = $user->defaultPaymentMethod();
```

你可以使用 `findPaymentMethod` 方法检索附加到可计费模型的特定支付方式：

```php
$paymentMethod = $user->findPaymentMethod($paymentMethodId);
```

<a name="payment-method-presence"></a>
### 支付方式是否存在

要判断一个可计费模型是否附加了默认支付方式，调用 `hasDefaultPaymentMethod` 方法：

```php
if ($user->hasDefaultPaymentMethod()) {
    // ...
}
```

你可以使用 `hasPaymentMethod` 方法判断可计费模型是否至少附加了一种支付方式：

```php
if ($user->hasPaymentMethod()) {
    // ...
}
```

该方法将判断可计费模型是否拥有任何支付方式。要判断模型是否存在特定类型的支付方式，你可以将 `type` 作为参数传递给该方法：

```php
if ($user->hasPaymentMethod('sepa_debit')) {
    // ...
}
```

<a name="updating-the-default-payment-method"></a>
### 更新默认支付方式

`updateDefaultPaymentMethod` 方法可用于更新客户的默认支付方式信息。该方法接受一个 Stripe 支付方式标识符，并将新的支付方式指定为默认的计费支付方式：

```php
$user->updateDefaultPaymentMethod($paymentMethod);
```

要将你的默认支付方式信息与 Stripe 中客户的默认支付方式信息同步，可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

```php
$user->updateDefaultPaymentMethodFromStripe();
```

> [!WARNING]
> 客户的默认支付方式只能用于开具发票和创建新订阅。由于 Stripe 的限制，它可能不能用于单次扣款。

<a name="adding-payment-methods"></a>
### 添加支付方式

要添加新的支付方式，可以在可计费模型上调用 `addPaymentMethod` 方法，并传入支付方式标识符：

```php
$user->addPaymentMethod($paymentMethod);
```

> [!NOTE]
> 要了解如何检索支付方式标识符，请查阅[支付方式存储文档](#storing-payment-methods)。

<a name="deleting-payment-methods"></a>
### 删除支付方式

要删除支付方式，可以在你希望删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

```php
$paymentMethod->delete();
```

`deletePaymentMethod` 方法将从可计费模型中删除特定的支付方式：

```php
$user->deletePaymentMethod('pm_visa');
```

`deletePaymentMethods` 方法将删除可计费模型的所有支付方式信息：

```php
$user->deletePaymentMethods();
```

默认情况下，该方法将删除每种类型的支付方式。要删除特定类型的支付方式，你可以将 `type` 作为参数传递给该方法：

```php
$user->deletePaymentMethods('sepa_debit');
```

> [!WARNING]
> 如果用户有活跃的订阅，你的应用程序不应允许他们删除其默认支付方式。

<a name="subscriptions"></a>
## 订阅

订阅提供了一种为你的客户设置周期性支付的方式。由 Cashier 管理的 Stripe 订阅支持多个订阅价格、订阅数量、试用等功能。

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先检索一个可计费模型的实例，通常这将是 `App\Models\User` 的一个实例。检索到模型实例后，你可以使用 `newSubscription` 方法创建模型的订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription(
        'default', 'price_monthly'
    )->create($request->paymentMethodId);

    // ...
});
```

传递给 `newSubscription` 方法的第一个参数应该是订阅的内部类型。如果你的应用程序只提供一个订阅，你可以将其称为 `default` 或 `primary`。此订阅类型仅用于应用程序内部使用，不应展示给用户。此外，它不应包含空格，并且在创建订阅后绝不应更改。第二个参数是用户要订阅的特定价格。该值应对应于 Stripe 中该价格的标识符。

`create` 方法接受[一个 Stripe 支付方式标识符](#storing-payment-methods) 或 Stripe `PaymentMethod` 对象，它将启动订阅，并使用可计费模型的 Stripe 客户 ID 和其他相关账单信息更新你的数据库。

> [!WARNING]
> 将支付方式标识符直接传递给 `create` 订阅方法，也会自动将其添加到用户已存储的支付方式中。

<a name="collecting-recurring-payments-via-invoice-emails"></a>
#### 通过发票邮件收取周期性支付

你可以指示 Stripe 在客户的周期性支付到期时，通过电子邮件向客户发送发票，而不是自动收取客户的周期性支付。然后，客户可以在收到发票后手动支付。在通过发票收取周期性支付时，客户不需要预先提供支付方式：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice();
```

客户在订阅被取消之前支付其发票的时限由 `days_until_due` 选项决定。默认情况下，这是 30 天；但是，如果你愿意，可以为该选项提供一个特定的值：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
    'days_until_due' => 30
]);
```

<a name="subscription-quantities"></a>
#### 数量

如果你想在创建订阅时为价格设置特定的[数量](https://stripe.com/docs/billing/subscriptions/quantities)，应在创建订阅之前在订阅构建器上调用 `quantity` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->quantity(5)
    ->create($paymentMethod);
```

<a name="additional-details"></a>
#### 附加详情

如果你想指定 Stripe 支持的额外[客户](https://stripe.com/docs/api/customers/create) 或[订阅](https://stripe.com/docs/api/subscriptions/create) 选项，可以通过将第二个和第三个参数传递给 `create` 方法来实现：

```php
$user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
    'email' => $email,
], [
    'metadata' => ['note' => 'Some extra information.'],
]);
```

<a name="coupons"></a>
#### 优惠券

如果你想在创建订阅时应用优惠券，可以使用 `withCoupon` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withCoupon('code')
    ->create($paymentMethod);
```

或者，如果你想应用[Stripe 促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withPromotionCode('promo_code_id')
    ->create($paymentMethod);
```

给定的促销代码 ID 应该是分配给该促销代码的 Stripe API ID，而不是面向客户的促销代码。如果你需要根据给定的面向客户的促销代码查找促销代码 ID，可以使用 `findPromotionCode` 方法：

```php
// 通过面向客户的代码查找促销代码 ID...
$promotionCode = $user->findPromotionCode('SUMMERSALE');

// 通过面向客户的代码查找活跃的促销代码 ID...
$promotionCode = $user->findActivePromotionCode('SUMMERSALE');
```

在上面的示例中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的一个实例。该类包装了一个底层的 `Stripe\PromotionCode` 对象。你可以通过调用 `coupon` 方法检索与该促销代码关联的优惠券：

```php
$coupon = $user->findPromotionCode('SUMMERSALE')->coupon();
```

优惠券实例让你可以确定折扣金额，以及该优惠券表示的是固定折扣还是基于百分比的折扣：

```php
if ($coupon->isPercentage()) {
    return $coupon->percentOff().'%'; // 21.5%
} else {
    return $coupon->amountOff(); // $5.99
}
```

你还可以检索当前应用于客户或订阅的折扣：

```php
$discount = $billable->discount();

$discount = $subscription->discount();
```

返回的 `Laravel\Cashier\Discount` 实例包装了一个底层的 `Stripe\Discount` 对象实例。你可以通过调用 `coupon` 方法检索与此折扣关联的优惠券：

```php
$coupon = $subscription->discount()->coupon();
```

如果你想向客户或订阅应用新的优惠券或促销代码，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法来实现：

```php
$billable->applyCoupon('coupon_id');
$billable->applyPromotionCode('promotion_code_id');

$subscription->applyCoupon('coupon_id');
$subscription->applyPromotionCode('promotion_code_id');
```

请记住，你应该使用分配给促销代码的 Stripe API ID，而不是面向客户的促销代码。对于给定的客户或订阅，一次只能应用一个优惠券或促销代码。

关于此主题的更多信息，请查阅 Stripe 关于[优惠券](https://stripe.com/docs/billing/subscriptions/coupons) 和[促销代码](https://stripe.com/docs/billing/subscriptions/coupons/codes) 的文档。

<a name="adding-subscriptions"></a>
#### 添加订阅

如果你想向已经拥有默认支付方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->add();
```

<a name="creating-subscriptions-from-the-stripe-dashboard"></a>
#### 从 Stripe 控制面板创建订阅

你也可以直接从 Stripe 控制面板创建订阅。这样做时，Cashier 会同步新添加的订阅，并为它们分配 `default` 类型。要自定义分配给通过控制面板创建的订阅的类型，请[定义 Webhook 事件处理器](#defining-webhook-event-handlers)。

此外，你只能通过 Stripe 控制面板创建一种类型的订阅。如果你的应用程序提供使用不同类型创建的多个订阅，则只能通过 Stripe 控制面板添加一种类型的订阅。

最后，你应始终确保为每个应用程序提供的订阅类型只添加一个活跃订阅。如果客户有两个 `default` 订阅，即使两者都会与你的应用程序数据库同步，Cashier 也只会使用最近添加的订阅。

<a name="checking-subscription-status"></a>
### 检查订阅状态

一旦客户订阅了你的应用程序，你就可以使用多种便捷的方法轻松检查其订阅状态。首先，`subscribed` 方法在客户拥有活跃订阅（即使该订阅当前处于试用期内）时返回 `true`。`subscribed` 方法接受订阅类型作为其第一个参数：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也是[路由中间件](/docs/{{version}}/middleware) 的一个绝佳候选，让你能够根据用户的订阅状态过滤对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSubscribed
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->subscribed('default')) {
            // 该用户不是付费客户...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想判断用户是否仍处于其试用期内，可以使用 `onTrial` 方法。该方法可用于判断你是否应向用户显示一条警告，提示他们仍处于试用期内：

```php
if ($user->subscription('default')->onTrial()) {
    // ...
}
```

`subscribedToProduct` 方法可用于判断用户是否基于给定 Stripe 产品的标识符订阅了某个产品。在 Stripe 中，产品是价格的集合。在此示例中，我们将判断用户的 `default` 订阅是否活跃地订阅了应用程序的"premium"产品。给定的 Stripe 产品标识符应对应于你在 Stripe 控制面板中某个产品的标识符之一：

```php
if ($user->subscribedToProduct('prod_premium', 'default')) {
    // ...
}
```

通过将一个数组传递给 `subscribedToProduct` 方法，你可以判断用户的 `default` 订阅是否活跃地订阅了应用程序的"basic"或"premium"产品：

```php
if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
    // ...
}
```

`subscribedToPrice` 方法可用于判断客户的订阅是否对应于给定的价格 ID：

```php
if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
    // ...
}
```

`recurring` 方法可用于判断用户当前是否已订阅且不再处于试用期内：

```php
if ($user->subscription('default')->recurring()) {
    // ...
}
```

> [!WARNING]
> 如果用户有两条相同类型的订阅，`subscription` 方法将始终返回最近的一条订阅。例如，用户可能拥有两条类型为 `default` 的订阅记录；然而，其中一条订阅可能是已过期旧的订阅，而另一条是当前活跃的订阅。最近的一条订阅将始终被返回，而较旧的订阅则保留在数据库中以供历史查阅。

<a name="cancelled-subscription-status"></a>
#### 已取消订阅的状态

要判断用户曾经是活跃订阅者但已取消其订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription('default')->canceled()) {
    // ...
}
```

你还可以判断用户是否已取消其订阅但仍处于"宽限期"，直到订阅完全到期。例如，如果用户在 3 月 5 日取消了原定于 3 月 10 日到期的订阅，那么在 3 月 10 日之前，用户都处于其"宽限期"内。请注意，在此期间 `subscribed` 方法仍返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

要判断用户是否已取消其订阅且不再处于其"宽限期"内，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    // ...
}
```

<a name="incomplete-and-past-due-status"></a>
#### 未完成和逾期状态

如果订阅在创建后需要二次支付操作，该订阅将被标记为 `incomplete`。订阅状态存储在 Cashier 的 `subscriptions` 数据库表的 `stripe_status` 列中。

类似地，如果在替换价格时需要二次支付操作，订阅将被标记为 `past_due`。当你的订阅处于这两种状态之一时，在客户确认其支付之前，它将不会处于活跃状态。要判断订阅是否存在未完成的支付，可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

当订阅存在未完成的支付时，你应将用户引导到 Cashier 的支付确认页面，并传入 `latestPayment` 标识符。你可以使用订阅实例上的 `latestPayment` 方法来检索此标识符：

```html
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果你希望订阅在处于 `past_due` 或 `incomplete` 状态时仍被视为活跃，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，这些方法应在你的 `App\Providers\AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Cashier\Cashier;

/**
 * 注册任意应用服务。
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
    Cashier::keepIncompleteSubscriptionsActive();
}
```

> [!WARNING]
> 当订阅处于 `incomplete` 状态时，在其支付被确认之前无法更改。因此，当订阅处于 `incomplete` 状态时，`swap` 和 `updateQuantity` 方法将抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可作为查询作用域使用，以便你可以轻松地按给定状态查询数据库中的订阅：

```php
// 获取所有活跃订阅...
$subscriptions = Subscription::query()->active()->get();

// 获取用户的所有已取消订阅...
$subscriptions = $user->subscriptions()->canceled()->get();
```

可用作用域的完整列表如下：

```php
Subscription::query()->active();
Subscription::query()->canceled();
Subscription::query()->ended();
Subscription::query()->incomplete();
Subscription::query()->notCanceled();
Subscription::query()->notOnGracePeriod();
Subscription::query()->notOnTrial();
Subscription::query()->onGracePeriod();
Subscription::query()->onTrial();
Subscription::query()->pastDue();
Subscription::query()->recurring();
```

<a name="changing-prices"></a>
### 变更价格

客户订阅了你的应用程序后，他们可能偶尔希望更换为新的订阅价格。要将客户切换到新的价格，请将 Stripe 价格的标识符传递给 `swap` 方法。在替换价格时，假定用户如果之前已取消订阅，则希望重新激活其订阅。给定的价格标识符应对应于 Stripe 控制面板中可用的 Stripe 价格标识符：

```php
use App\Models\User;

$user = App\Models\User::find(1);

$user->subscription('default')->swap('price_yearly');
```

如果客户处于试用期内，试用期将被保留。此外，如果订阅存在"数量"，该数量也将被保留。

如果你想替换价格并取消客户当前所处的任何试用期，可以调用 `skipTrial` 方法：

```php
$user->subscription('default')
    ->skipTrial()
    ->swap('price_yearly');
```

如果你想替换价格并立即向客户开具发票，而不是等待其下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice('price_yearly');
```

<a name="prorations"></a>
#### 按比例计费

默认情况下，Stripe 在替换价格时会按比例计算费用。可以使用 `noProrate` 方法更新订阅价格而不按比例计算费用：

```php
$user->subscription('default')->noProrate()->swap('price_yearly');
```

有关订阅按比例计费的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> [!WARNING]
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法不会对按比例计费产生任何影响。发票将始终被开具。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，一个项目管理应用程序可能会按月收取每个项目 10 美元的费用。你可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松地增加或减少你的订阅数量：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// 为订阅的当前数量加五...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// 从订阅的当前数量中减去五...
$user->subscription('default')->decrementQuantity(5);
```

或者，你可以使用 `updateQuantity` 方法设置一个特定数量：

```php
$user->subscription('default')->updateQuantity(10);
```

`noProrate` 方法可用于更新订阅的数量而不按比例计算费用：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 包含多个产品的订阅的数量

如果你的订阅是[包含多个产品的订阅](#subscriptions-with-multiple-products)，应将你希望增加或减少数量的那个价格的 ID 作为第二个参数传递给增量 / 减量方法：

```php
$user->subscription('default')->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 包含多个产品的订阅

[包含多个产品的订阅](https://stripe.com/docs/billing/subscriptions/multiple-products) 允许你将多个计费产品分配给单个订阅。例如，想象你正在构建一个客户服务的"帮助台"应用程序，其基础订阅价格为每月 10 美元，但提供了一个额外的实时聊天附加产品，每月 15 美元。包含多个产品的订阅信息存储在 Cashier 的 `subscription_items` 数据库表中。

你可以通过将价格数组作为第二个参数传递给 `newSubscription` 方法，为给定的订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', [
        'price_monthly',
        'price_chat',
    ])->create($request->paymentMethodId);

    // ...
});
```

在上面的示例中，客户将在其 `default` 订阅上附加两个价格。这两个价格将在各自的计费间隔上被收费。如有必要，你可以使用 `quantity` 方法为每个价格指定一个特定数量：

```php
$user = User::find(1);

$user->newSubscription('default', ['price_monthly', 'price_chat'])
    ->quantity(5, 'price_chat')
    ->create($paymentMethod);
```

如果你想向现有订阅添加另一个价格，可以调用订阅的 `addPrice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat');
```

上面的示例将添加新价格，并将在客户的下一个计费周期对该价格计费。如果你想立即向客户计费，可以使用 `addPriceAndInvoice` 方法：

```php
$user->subscription('default')->addPriceAndInvoice('price_chat');
```

如果你想添加带特定数量的价格，可以将数量作为 `addPrice` 或 `addPriceAndInvoice` 方法的第二个参数传递：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat', 5);
```

你可以使用 `removePrice` 方法从订阅中移除价格：

```php
$user->subscription('default')->removePrice('price_chat');
```

> [!WARNING]
> 你不可以移除订阅上的最后一个价格。相反，你应直接取消该订阅。

<a name="swapping-prices"></a>
#### 替换价格

你也可以更改附加到包含多个产品的订阅上的价格。例如，想象一个客户拥有带 `price_chat` 附加产品的 `price_basic` 订阅，而你想将该客户从 `price_basic` 升级到 `price_pro` 价格：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap(['price_pro', 'price_chat']);
```

在执行上面的示例时，带有 `price_basic` 的底层订阅项被删除，而带有 `price_chat` 的保留了下来。此外，还会为 `price_pro` 创建新的订阅项。

你还可以通过向 `swap` 方法传递一组键值对来指定订阅项选项。例如，你可能需要指定订阅价格的数量：

```php
$user = User::find(1);

$user->subscription('default')->swap([
    'price_pro' => ['quantity' => 5],
    'price_chat'
]);
```

如果你想替换订阅上的单个价格，可以使用订阅项本身的 `swap` 方法来实现。当你想保留订阅其他价格上的所有现有元数据时，这种方法特别有用：

```php
$user = User::find(1);

$user->subscription('default')
    ->findItemOrFail('price_basic')
    ->swap('price_pro');
```

<a name="proration"></a>
#### 按比例计费

默认情况下，Stripe 会在向包含多个产品的订阅添加或移除价格时按比例计算费用。如果你希望在不按比例计费的情况下进行价格调整，应在你的价格操作上链式调用 `noProrate` 方法：

```php
$user->subscription('default')->noProrate()->removePrice('price_chat');
```

<a name="swapping-quantities"></a>
#### 数量

如果你想更新单个订阅价格上的数量，可以使用[现有的数量方法](#subscription-quantity)，将价格的 ID 作为方法的额外参数传递：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity(5, 'price_chat');

$user->subscription('default')->decrementQuantity(3, 'price_chat');

$user->subscription('default')->updateQuantity(10, 'price_chat');
```

> [!WARNING]
> 当订阅拥有多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性将为 `null`。要访问单个价格的属性，应使用 `Subscription` 模型上可用的 `items` 关联。

<a name="subscription-items"></a>
#### 订阅项

当订阅拥有多个价格时，它将在你数据库的 `subscription_items` 表中拥有多个订阅"项"。你可以通过订阅上的 `items` 关联访问这些项：

```php
use App\Models\User;

$user = User::find(1);

$subscriptionItem = $user->subscription('default')->items->first();

// 检索特定项的 Stripe 价格和数量...
$stripePrice = $subscriptionItem->stripe_price;
$quantity = $subscriptionItem->quantity;
```

你也可以使用 `findItemOrFail` 方法检索特定的价格：

```php
$user = User::find(1);

$subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');
```

<a name="multiple-subscriptions"></a>
### 多个订阅

Stripe 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅和举重订阅，每个订阅可能有不同的定价。当然，客户应该能够订阅其中一个或两个计划。

当你的应用程序创建订阅时，你可以将订阅的类型提供给 `newSubscription` 方法。该类型可以是任何表示用户正在发起的订阅类型的字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()->newSubscription('swimming')
        ->price('price_swimming_monthly')
        ->create($request->paymentMethodId);

    // ...
});
```

在此示例中，我们为客户启动了一个按月计费的游泳订阅。然而，他们可能希望在稍后的时间切换到按年计费的订阅。在调整客户的订阅时，我们可以简单地替换 `swimming` 订阅上的价格：

```php
$user->subscription('swimming')->swap('price_swimming_yearly');
```

当然，你也可以完全取消该订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="usage-based-billing"></a>
### 基于用量的计费

[基于用量的计费](https://stripe.com/docs/billing/subscriptions/metered-billing) 允许你根据客户在计费周期内的产品使用情况向他们收费。例如，你可以根据客户每月发送的短信或电子邮件数量向他们收费。

要开始使用用量计费，你首先需要在你的 Stripe 控制面板中创建一个带有[基于用量的计费模型](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide) 和[计量器](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage#configure-meter) 的新产品。创建计量器后，存储关联的事件名称和计量器 ID，你将需要它们来报告和检索用量。然后，使用 `meteredPrice` 方法将计量价格 ID 添加到客户订阅中：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default')
        ->meteredPrice('price_metered')
        ->create($request->paymentMethodId);

    // ...
});
```

你也可以通过 [Stripe Checkout](#checkout) 启动计量订阅：

```php
$checkout = Auth::user()
    ->newSubscription('default', [])
    ->meteredPrice('price_metered')
    ->checkout();

return view('your-checkout-view', [
    'checkout' => $checkout,
]);
```

<a name="reporting-usage"></a>
#### 报告用量

随着你的客户使用你的应用程序，你将向 Stripe 报告他们的用量，以便能够准确计费。要报告计量事件的用量，可以使用 `Billable` 模型上的 `reportMeterEvent` 方法：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent');
```

默认情况下，会向计费周期添加 1 个"用量"。或者，你可以传递一个特定的"用量"值，添加到客户的该计费周期用量中：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent', quantity: 15);
```

要检索客户某个计量器的事件摘要，可以使用 `Billable` 实例的 `meterEventSummaries` 方法：

```php
$user = User::find(1);

$meterUsage = $user->meterEventSummaries($meterId);

$meterUsage->first()->aggregated_value // 10
```

有关计量事件摘要的更多信息，请参阅 Stripe 的 [Meter Event Summary 对象文档](https://docs.stripe.com/api/billing/meter-event_summary/object)。

要[列出所有计量器](https://docs.stripe.com/api/billing/meter/list)，可以使用 `Billable` 实例的 `meters` 方法：

```php
$user = User::find(1);

$user->meters();
```

<a name="subscription-taxes"></a>
### 订阅税务

> [!WARNING]
> 与其手动计算税率，你可以[使用 Stripe Tax 自动计算税费](#tax-configuration)

要指定用户为订阅支付的税率，你应在可计费模型上实现 `taxRates` 方法，并返回一个包含 Stripe 税率 ID 的数组。你可以在[你的 Stripe 控制面板](https://dashboard.stripe.com/test/tax-rates) 中定义这些税率：

```php
/**
 * 应应用于客户订阅的税率。
 *
 * @return array<int, string>
 */
public function taxRates(): array
{
    return ['txr_id'];
}
```

`taxRates` 方法使你能以客户为单位应用税率，这对于跨越多个国家和税率的用户群可能很有帮助。

如果你提供包含多个产品的订阅，可以通过在可计费模型上实现 `priceTaxRates` 方法来为每个价格定义不同的税率：

```php
/**
 * 应应用于客户订阅的税率。
 *
 * @return array<string, array<int, string>>
 */
public function priceTaxRates(): array
{
    return [
        'price_monthly' => ['txr_id'],
    ];
}
```

> [!WARNING]
> `taxRates` 方法仅适用于订阅费用。如果你使用 Cashier 进行"一次性"扣款，你将需要在当时手动指定税率。

<a name="syncing-tax-rates"></a>
#### 同步税率

当更改 `taxRates` 方法返回的硬编码税率 ID 时，用户任何现有订阅上的税务设置将保持不变。如果你希望使用新的 `taxRates` 值更新现有订阅的税务值，应在用户的订阅实例上调用 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这还将同步包含多个产品的订阅的任何项税率。如果你的应用程序提供包含多个产品的订阅，应确保你的可计费模型实现了[上文讨论的](#subscription-taxes) `priceTaxRates` 方法。

<a name="tax-exemption"></a>
#### 免税

Cashier 还提供了 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法，用于判断客户是否免税。这些方法将调用 Stripe API 来确定客户的免税状态：

```php
use App\Models\User;

$user = User::find(1);

$user->isTaxExempt();
$user->isNotTaxExempt();
$user->reverseChargeApplies();
```

> [!WARNING]
> 这些方法在任意 `Laravel\Cashier\Invoice` 对象上也同样可用。但是，在 `Invoice` 对象上调用时，这些方法将确定发票创建时的免税状态。

<a name="subscription-anchor-date"></a>
### 订阅锚定日期

默认情况下，计费周期锚定日期是订阅创建的日期，或者，如果使用了试用期，则是试用期结束的日期。如果你想修改计费锚定日期，可以使用 `anchorBillingCycleOn` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $anchor = Carbon::parse('first day of next month');

    $request->user()->newSubscription('default', 'price_monthly')
        ->anchorBillingCycleOn($anchor->startOfDay())
        ->create($request->paymentMethodId);

    // ...
});
```

有关管理订阅计费周期的更多信息，请参阅 [Stripe 计费周期文档](https://stripe.com/docs/billing/subscriptions/billing-cycle)

<a name="cancelling-subscriptions"></a>
### 取消订阅

要取消订阅，调用用户订阅上的 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

当订阅被取消时，Cashier 会自动设置你 `subscriptions` 数据库表中的 `ends_at` 列。该列用于确定 `subscribed` 方法应何时开始返回 `false`。

例如，如果客户在 3 月 1 日取消了订阅，但订阅原计划在 3 月 5 日才结束，那么 `subscribed` 方法将持续返回 `true` 直到 3 月 5 日。这样做是因为用户通常允许继续使用应用程序直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断用户是否已取消订阅但仍处于其"宽限期"内：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

如果你想立即取消订阅，调用用户订阅上的 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

如果你想立即取消订阅，并对任何剩余的未开票计量用量或新的 / 待定的按比例计费发票项开具发票，调用用户订阅上的 `cancelNowAndInvoice` 方法：

```php
$user->subscription('default')->cancelNowAndInvoice();
```

你也可以选择在某个特定时刻取消订阅：

```php
$user->subscription('default')->cancelAt(
    now()->plus(days: 10)
);
```

最后，在删除关联的用户模型之前，你应始终先取消用户的订阅：

```php
$user->subscription('default')->cancelNow();

$user->delete();
```

<a name="resuming-subscriptions"></a>
### 恢复订阅

如果客户已取消其订阅，而你希望恢复它，可以在订阅上调用 `resume` 方法。客户必须仍处于其"宽限期"内才能恢复订阅：

```php
$user->subscription('default')->resume();
```

如果客户在订阅完全到期之前取消订阅，然后恢复该订阅，客户不会被立即扣款。相反，他们的订阅将被重新激活，并将在原始计费周期上被扣款。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预付支付方式

如果你想向客户提供试用期，同时仍预先收集支付方式信息，应在创建订阅时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', 'price_monthly')
        ->trialDays(10)
        ->create($request->paymentMethodId);

    // ...
});
```

该方法将设置数据库内订阅记录上的试用期结束日期，并指示 Stripe 在该日期之前不要开始向客户计费。使用 `trialDays` 方法时，Cashier 将覆盖为 Stripe 中该价格配置的任何默认试用期。

> [!WARNING]
> 如果客户的订阅在试用期结束日期之前没有被取消，他们将在试用一到期时立即被扣款，因此你应确保通知用户其试用期结束日期。

`trialUntil` 方法允许你提供一个 `DateTime` 实例，指定试用期应何时结束：

```php
use Illuminate\Support\Carbon;

$user->newSubscription('default', 'price_monthly')
    ->trialUntil(Carbon::now()->plus(days: 10))
    ->create($paymentMethod);
```

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法来判断用户是否处于其试用期内。下面两个示例是等价的：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->subscription('default')->onTrial()) {
    // ...
}
```

你可以使用 `endTrial` 方法立即结束订阅试用：

```php
$user->subscription('default')->endTrial();
```

要判断已有的试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial('default')) {
    // ...
}

if ($user->subscription('default')->hasExpiredTrial()) {
    // ...
}
```

<a name="defining-trial-days-in-stripe-cashier"></a>
#### 在 Stripe / Cashier 中定义试用天数

你可以选择在 Stripe 控制面板中定义你的价格获得多少试用天数，或者始终通过 Cashier 显式传递它们。如果你选择在 Stripe 中定义价格的试用天数，应注意：新的订阅（包括曾经拥有订阅的客户的新订阅）将始终获得一个试用期，除非你显式调用 `skipTrial()` 方法。

<a name="without-payment-method-up-front"></a>
### 不预付支付方式

如果你想提供试用期而不预先收集用户的支付方式信息，可以将用户记录上的 `trial_ends_at` 列设置为你期望的试用结束日期。这通常在用户注册期间完成：

```php
use App\Models\User;

$user = User::create([
    // ...
    'trial_ends_at' => now()->plus(days: 10),
]);
```

> [!WARNING]
> 请确保在你的可计费模型类定义中为 `trial_ends_at` 属性添加[日期转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 将这种类型的试用称为"通用试用"，因为它没有附加到任何现有订阅上。如果当前日期尚未超过 `trial_ends_at` 的值，可计费模型实例上的 `onTrial` 方法将返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于其试用期内...
}
```

一旦你准备好为用户创建实际的订阅，可以照常使用 `newSubscription` 方法：

```php
$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->create($paymentMethod);
```

要检索用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户处于试用期内，该方法将返回一个 Carbon 日期实例，否则返回 `null`。如果你希望获取除默认订阅之外的特定订阅的试用结束日期，也可以传入一个可选的订阅类型参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果你希望具体知道用户处于其"通用"试用期内且尚未创建实际订阅，也可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于其"通用"试用期内...
}
```

<a name="extending-trials"></a>
### 延长试用

`extendTrial` 方法允许你在订阅创建后延长订阅的试用期。如果试用已经过期且客户已经在为订阅计费，你仍然可以向他们提供延长的试用。处于试用期内的时间将从客户的下一张发票中扣除：

```php
use App\Models\User;

$subscription = User::find(1)->subscription('default');

// 试用在 7 天后结束...
$subscription->extendTrial(
    now()->plus(days: 7)
);

// 为试用额外添加 5 天...
$subscription->extendTrial(
    $subscription->trial_ends_at->plus(days: 5)
);
```

<a name="handling-stripe-webhooks"></a>
## 处理 Stripe Webhook

> [!NOTE]
> 你可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 来协助在本地开发期间测试 Webhook。

Stripe 可以通过 Webhook 通知你的应用程序各种事件。默认情况下，Cashier 服务提供者会自动注册一个指向 Cashier Webhook 控制器的路由。该控制器将处理所有传入的 Webhook 请求。

默认情况下，Cashier Webhook 控制器会自动处理取消因多次扣款失败（由你的 Stripe 设置定义）的订阅，以及客户更新、客户删除、订阅更新和支付方式变更；但是，正如我们很快会发现的，你可以扩展此控制器以处理你喜欢的任何 Stripe Webhook 事件。

为了确保你的应用程序能够处理 Stripe Webhook，请务必在 Stripe 控制面板中配置 Webhook URL。默认情况下，Cashier 的 Webhook 控制器响应 `/stripe/webhook` URL 路径。你应在 Stripe 控制面板中启用的所有 Webhook 的完整列表如下：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。该命令将在 Stripe 中创建一个监听 Cashier 所需的所有事件的 Webhook：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 Webhook 将指向由 `APP_URL` 环境变量和随 Cashier 一起提供的 `cashier.webhook` 路由定义的 URL。如果你希望使用不同的 URL，可以在调用命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 Webhook 将使用与你的 Cashier 版本兼容的 Stripe API 版本。如果你希望使用不同的 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，Webhook 将立即处于活跃状态。如果你希望创建 Webhook 但在准备就绪之前将其禁用，可以在调用命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> [!WARNING]
> 请确保使用 Cashier 自带的[Webhook 签名验证](#verifying-webhook-signatures) 中间件保护传入的 Stripe Webhook 请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Stripe Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应确保 Laravel 不会尝试验证传入 Stripe Webhook 的 CSRF 令牌。为此，你应在应用程序的 `bootstrap/app.php` 文件中将 `stripe/*` 排除在 CSRF 保护之外：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
    ]);
})
```

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理因扣款失败导致的订阅取消以及其他常见的 Stripe Webhook 事件。但是，如果你有额外的 Webhook 事件需要处理，可以通过监听 Cashier 派发的以下事件来实现：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe Webhook 的完整负载。例如，如果你想处理 `invoice.payment_succeeded` Webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners) 来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * 处理接收到的 Stripe Webhook。
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['type'] === 'invoice.payment_succeeded') {
            // 处理传入的事件...
        }
    }
}
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 Webhook，你可以使用 [Stripe 的 Webhook 签名](https://stripe.com/docs/webhooks/signatures)。为方便起见，Cashier 自动包含了一个中间件，用于验证传入的 Stripe Webhook 请求是否有效。

要启用 Webhook 验证，请确保 `STRIPE_WEBHOOK_SECRET` 环境变量已在你的应用程序的 `.env` 文件中设置。Webhook `secret` 可以从你的 Stripe 账户控制面板获取。

<a name="single-charges"></a>
## 单次扣款

<a name="simple-charge"></a>
### 简单扣款

如果你想使用支付方式标识符对客户进行一次性扣款，可以使用可计费模型实例上的 `charge` 方法。如果你需要在处理一次性扣款之前从客户那里收集支付详细信息，请参阅[用于单次扣款的 Payment Element](#payment-element-for-single-charges) 文档：

```php
use Illuminate\Http\Request;

Route::post('/purchase', function (Request $request) {
    $payment = $request->user()->charge(
        100, $request->paymentMethodId
    );

    // ...
});
```

`charge` 方法接受数组作为其第三个参数，允许你将任何你希望的选项传递给底层的 Stripe Payment Intent 创建。有关创建 Payment Intent 时可用的选项更多信息，可在 [Stripe 文档](https://stripe.com/docs/api/payment_intents/create) 中找到：

```php
$user->charge(100, $paymentMethod, [
    'custom_option' => $value,
]);
```

你也可以在没有任何底层客户或用户的情况下使用 `charge` 方法。为此，在新的应用程序可计费模型实例上调用 `charge` 方法：

```php
use App\Models\User;

$payment = (new User)->charge(100, $paymentMethod);
```

如果扣款失败，`charge` 方法将抛出异常。如果扣款成功，该方法将返回一个 `Laravel\Cashier\Payment` 实例：

```php
try {
    $payment = $user->charge(100, $paymentMethod);
} catch (Exception $e) {
    // ...
}
```

> [!WARNING]
> `charge` 方法接受的支付金额以你的应用程序所用货币的最小单位计。例如，如果客户以美元支付，金额应以美分指定。

<a name="charge-with-invoice"></a>
### 带发票的扣款

有时你可能需要进行一次性扣款，并向客户提供 PDF 发票。这正是 `invoicePrice` 方法的作用。例如，让我们为五件新衬衫向客户开具发票：

```php
$user->invoicePrice('price_tshirt', 5);
```

发票将立即针对用户的默认支付方式扣款。`invoicePrice` 方法也接受数组作为其第三个参数。该数组包含发票项的账单选项。该方法接受的第四个参数也是一个数组，应包含发票本身的账单选项：

```php
$user->invoicePrice('price_tshirt', 5, [
    'discounts' => [
        ['coupon' => 'SUMMER21SALE']
    ],
], [
    'default_tax_rates' => ['txr_id'],
]);
```

与 `invoicePrice` 类似，你可以使用 `tabPrice` 方法通过将多个项目（每张发票最多 250 项）添加到客户的"记账"中，然后向客户开具发票，来创建一次性扣款。例如，我们可以为五件衬衫和两个杯子向客户开具发票：

```php
$user->tabPrice('price_tshirt', 5);
$user->tabPrice('price_mug', 2);
$user->invoice();
```

或者，你可以使用 `invoiceFor` 方法针对客户的默认支付方式进行"一次性"扣款：

```php
$user->invoiceFor('One Time Fee', 500);
```

虽然 `invoiceFor` 方法可供你使用，但建议你使用带有预定义价格的 `invoicePrice` 和 `tabPrice` 方法。这样做，你将能够在 Stripe 控制面板中获得关于按产品维度销售的更好分析和数据。

> [!WARNING]
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法将创建一张会在扣款失败时重试的 Stripe 发票。如果你不希望发票重试失败的扣款，你需要在第一次扣款失败后使用 Stripe API 将其关闭。

<a name="creating-payment-intents"></a>
### 创建 Payment Intent

你可以调用可计费模型实例上的 `pay` 方法来创建新的 Stripe 支付意图。调用此方法将创建一个包装在 `Laravel\Cashier\Payment` 实例中的支付意图：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->pay(
        $request->get('amount')
    );

    return $payment->client_secret;
});
```

创建支付意图后，你可以将客户端密钥返回给你的应用程序前端，以便用户可以在其浏览器中完成支付。要了解更多关于使用 Stripe 支付意图构建完整支付流程的内容，请参阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，你的 Stripe 控制面板中启用的默认支付方式将对客户可用。或者，如果你只希望允许使用某些特定的支付方式，可以使用 `payWith` 方法：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->payWith(
        $request->get('amount'), ['card', 'bancontact']
    );

    return $payment->client_secret;
});
```

> [!WARNING]
> `pay` 和 `payWith` 方法接受的支付金额以你的应用程序所用货币的最小单位计。例如，如果客户以美元支付，金额应以美分指定。

<a name="refunding-charges"></a>
### 退款

如果你需要退还一笔 Stripe 支付，可以使用 `refund` 方法。该方法接受 Stripe Payment Intent ID 作为其第一个参数：

```php
$payment = $user->charge(100, $paymentMethodId);

$user->refund($payment->id);
```

<a name="invoices"></a>
## 发票

<a name="retrieving-invoices"></a>
### 检索发票

你可以使用 `invoices` 方法轻松检索可计费模型的发票数组。`invoices` 方法返回一个 `Laravel\Cashier\Invoice` 实例的集合：

```php
$invoices = $user->invoices();
```

如果你想在结果中包含待处理的发票，可以使用 `invoicesIncludingPending` 方法：

```php
$invoices = $user->invoicesIncludingPending();
```

你可以使用 `findInvoice` 方法通过 ID 检索特定的发票：

```php
$invoice = $user->findInvoice($invoiceId);
```

<a name="displaying-invoice-information"></a>
#### 显示发票信息

在列出客户的发票时，你可以使用发票的方法显示相关的发票信息。例如，你可能希望在一个表格中列出每张发票，让用户能轻松下载其中任何一张：

```blade
<table>
    @foreach ($invoices as $invoice)
        <tr>
            <td>{{ $invoice->date()->toFormattedDateString() }}</td>
            <td>{{ $invoice->total() }}</td>
            <td><a href="/user/invoice/{{ $invoice->id }}">Download</a></td>
        </tr>
    @endforeach
</table>
```

<a name="upcoming-invoices"></a>
### 即将到来的发票

要检索客户即将到来的发票，可以使用 `upcomingInvoice` 方法：

```php
$invoice = $user->upcomingInvoice();
```

类似地，如果客户有多个订阅，你也可以检索特定订阅的即将到来的发票：

```php
$invoice = $user->subscription('default')->upcomingInvoice();
```

<a name="previewing-subscription-invoices"></a>
### 预览订阅发票

使用 `previewInvoice` 方法，你可以在进行价格变更之前预览一张发票。这将让你能够确定进行给定价格变更时客户的发票会是什么样子：

```php
$invoice = $user->subscription('default')->previewInvoice('price_yearly');
```

你可以向 `previewInvoice` 方法传递一组价格，以便预览带有多个新价格的发票：

```php
$invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);
```

<a name="generating-invoice-pdfs"></a>
### 生成发票 PDF

在生成发票 PDF 之前，你应使用 Composer 安装 Dompdf 库，它是 Cashier 默认的发票渲染器：

```shell
composer require dompdf/dompdf
```

在路由或控制器内部，你可以使用 `downloadInvoice` 方法生成给定发票的 PDF 下载。该方法会自动生成下载发票所需的适当 HTTP 响应：

```php
use Illuminate\Http\Request;

Route::get('/user/invoice/{invoice}', function (Request $request, string $invoiceId) {
    return $request->user()->downloadInvoice($invoiceId);
});
```

默认情况下，发票上的所有数据都来自存储在 Stripe 中的客户和发票数据。文件名基于你的 `app.name` 配置值。但是，你可以通过向 `downloadInvoice` 方法提供数组作为第二个参数来自定义其中部分数据。该数组允许你自定义诸如公司和产品详情等信息：

```php
return $request->user()->downloadInvoice($invoiceId, [
    'vendor' => 'Your Company',
    'product' => 'Your Product',
    'street' => 'Main Str. 1',
    'location' => '2000 Antwerp, Belgium',
    'phone' => '+32 499 00 00 00',
    'email' => 'info@example.com',
    'url' => 'https://example.com',
    'vendorVat' => 'BE123456789',
]);
```

`downloadInvoice` 方法还允许通过其第三个参数指定自定义文件名。该文件名将自动添加 `.pdf` 后缀：

```php
return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');
```

<a name="custom-invoice-render"></a>

<a name="custom-invoice-render"></a>
#### 自定义发票渲染器

Cashier 还允许使用自定义的发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，它利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库来生成 Cashier 的发票。但是，你可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口来使用任何你希望的渲染器。例如，你可能希望通过调用第三方 PDF 渲染服务的 API 来渲染发票 PDF：

```php
use Illuminate\Support\Facades\Http;
use Laravel\Cashier\Contracts\InvoiceRenderer;
use Laravel\Cashier\Invoice;

class ApiInvoiceRenderer implements InvoiceRenderer
{
    /**
     * 渲染给定的发票并返回原始 PDF 字节。
     */
    public function render(Invoice $invoice, array $data = [], array $options = []): string
    {
        $html = $invoice->view($data)->render();

        return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
    }
}
```

一旦你实现了发票渲染器契约，你应更新应用程序 `config/cashier.php` 配置文件中的 `cashier.invoices.renderer` 配置值。该配置值应设置为你的自定义渲染器实现类的类名。

<a name="checkout"></a>
## 结账

Cashier Stripe 还支持 [Stripe Checkout](https://stripe.com/payments/checkout)。Stripe Checkout 通过提供一个预构建的托管支付页面，免去了实现自定义支付页面的麻烦。

以下文档包含有关如何开始将 Stripe Checkout 与 Cashier 一起使用的信息。要了解更多关于 Stripe Checkout 的内容，你还应该考虑查阅 [Stripe 自己的 Checkout 文档](https://stripe.com/docs/payments/checkout)。

<a name="product-checkouts"></a>
### 产品结账

你可以使用可计费模型上的 `checkout` 方法，为在你的 Stripe 控制面板中创建的现有产品执行结账。该方法将启动一个新的 Stripe Checkout 会话。默认情况下，你需要传入一个 Stripe 价格 ID：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout('price_tshirt');
});
```

如果需要，你还可以指定产品数量：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 15]);
});
```

当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面。默认情况下，当用户成功完成或取消购买时，他们将被重定向到你的 `home` 路由位置，但你可以使用 `success_url` 和 `cancel_url` 选项指定自定义的回调 URL：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

在定义 `success_url` 结账选项时，你可以指示 Stripe 在调用你的 URL 时将 Checkout 会话 ID 作为查询字符串参数添加。为此，请将字面字符串 `{CHECKOUT_SESSION_ID}` 添加到你的 `success_url` 查询字符串中。Stripe 将用实际的 Checkout 会话 ID 替换此占位符：

```php
use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Customer;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => route('checkout-cancel'),
    ]);
});

Route::get('/checkout-success', function (Request $request) {
    $checkoutSession = $request->user()->stripe()->checkout->sessions->retrieve($request->get('session_id'));

    return view('checkout.success', ['checkoutSession' => $checkoutSession]);
})->name('checkout-success');
```

<a name="checkout-promotion-codes"></a>
#### 促销代码

默认情况下，Stripe Checkout 不允许使用[用户可兑换的促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。幸运的是，有一个简便的方法可以为你的 Checkout 页面启用这些代码。为此，你可以调用 `allowPromotionCodes` 方法：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()
        ->allowPromotionCodes()
        ->checkout('price_tshirt');
});
```

<a name="single-charge-checkouts"></a>
### 单次扣款结账

你还可以为尚未在你的 Stripe 控制面板中创建的临时产品执行简单的扣款。为此，你可以在可计费模型上使用 `checkoutCharge` 方法，并传入一个可扣款金额、产品名称和可选数量。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/charge-checkout', function (Request $request) {
    return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
});
```

> [!WARNING]
> 使用 `checkoutCharge` 方法时，Stripe 将始终在你的 Stripe 控制面板中创建一个新的产品和价格。因此，我们建议你提前在你的 Stripe 控制面板中创建产品，并改用 `checkout` 方法。

<a name="subscription-checkouts"></a>
### 订阅结账

> [!WARNING]
> 将 Stripe Checkout 用于订阅需要你在 Stripe 控制面板中启用 `customer.subscription.created` Webhook。该 Webhook 将在你的数据库中创建订阅记录，并存储所有相关的订阅项。

你也可以使用 Stripe Checkout 来启动订阅。在使用 Cashier 的订阅构建器方法定义你的订阅后，你可以调用 `checkout` 方法。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout();
});
```

就像产品结账一样，你可以自定义成功和取消 URL：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout([
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

当然，你也可以为订阅结账启用促销代码：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->allowPromotionCodes()
        ->checkout();
});
```

> [!WARNING]
> 遗憾的是，Stripe Checkout 在开始订阅时并不支持所有的订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例计费行为或设置支付行为在 Stripe Checkout 会话期间都不会产生任何效果。请查阅 [Stripe Checkout Session API 文档](https://stripe.com/docs/api/checkout/sessions/create) 以了解哪些参数可用。

<a name="stripe-checkout-trial-periods"></a>
#### Stripe Checkout 与试用期

当然，你可以在构建将通过 Stripe Checkout 完成的订阅时定义试用期：

```php
$checkout = Auth::user()->newSubscription('default', 'price_monthly')
    ->trialDays(3)
    ->checkout();
```

但是，试用期必须至少为 48 小时，这是 Stripe Checkout 支持的最短试用期时长。

<a name="stripe-checkout-subscriptions-and-webhooks"></a>
#### 订阅与 Webhook

请记住，Stripe 和 Cashier 通过 Webhook 更新订阅状态，因此存在这样一种可能：当客户在输入支付信息后返回到应用程序时，订阅可能尚未处于活跃状态。为了处理这种情况，你可能希望显示一条消息，告知用户其支付或订阅正在等待中。

<a name="collecting-tax-ids"></a>
### 收集税务 ID

Checkout 也支持收集客户的税务 ID。要在结账会话上启用此功能，请在创建会话时调用 `collectTaxIds` 方法：

```php
$checkout = $user->collectTaxIds()->checkout('price_tshirt');
```

调用此方法后，客户将可以使用一个新的复选框，让他们指示是否以公司名义购买。如果是，他们将有机会提供其税务 ID 号码。

> [!WARNING]
> 如果你已经在应用程序的服务提供者中配置了[自动税务收集](#tax-configuration)，则此功能将自动启用，无需调用 `collectTaxIds` 方法。

<a name="guest-checkouts"></a>
### 访客结账

使用 `Checkout::guest` 方法，你可以为没有"账户"的访客启动结账会话：

```php
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;

Route::get('/product-checkout', function (Request $request) {
    return Checkout::guest()->create('price_tshirt', [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

与为已有用户创建结账会话类似，你可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上可用的额外方法来自定义访客结账会话：

```php
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;

Route::get('/product-checkout', function (Request $request) {
    return Checkout::guest()
        ->withPromotionCode('promo-code')
        ->create('price_tshirt', [
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

访客结账完成后，Stripe 可以派发一个 `checkout.session.completed` Webhook 事件，因此请确保[配置你的 Stripe Webhook](https://dashboard.stripe.com/webhooks) 以真正将此事件发送到你的应用程序。一旦在 Stripe 控制面板中启用了该 Webhook，你就可以[用 Cashier 处理该 Webhook](#handling-stripe-webhooks)。Webhook 负载中包含的对象将是一个[结账对象](https://stripe.com/docs/api/checkout/sessions/object)，你可以检查它以便履行客户的订单。

<a name="handling-failed-payments"></a>
## 处理失败支付

有时，订阅或单次扣款的支付可能会失败。发生这种情况时，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你发生了这种情况。捕获此异常后，你有两种处理方式的选项。

首先，你可以将客户重定向到 Cashier 自带的支付确认页面。该页面已经有一个由 Cashier 服务提供者注册的关联命名路由。因此，你可以捕获 `IncompletePayment` 异常并将用户重定向到支付确认页面：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $subscription = $user->newSubscription('default', 'price_monthly')
        ->create($paymentMethod);
} catch (IncompletePayment $exception) {
    return redirect()->route(
        'cashier.payment',
        [$exception->payment->id, 'redirect' => route('home')]
    );
}
```

在支付确认页面上，客户将被提示再次输入其信用卡信息，并执行 Stripe 要求的任何额外操作，例如"3D Secure"确认。在确认其支付后，用户将被重定向到上面 `redirect` 参数提供的 URL。重定向后，URL 中将添加 `message`（字符串）和 `success`（整数）查询字符串变量。该支付页面目前支持以下支付方式类型：

<div class="content-list" markdown="1">

- Credit Cards
- Alipay
- Bancontact
- BECS Direct Debit
- EPS
- Giropay
- iDEAL
- SEPA Direct Debit

</div>

或者，你可以让 Stripe 为你处理支付确认。在这种情况下，你不应重定向到支付确认页面，而是可以在你的 Stripe 控制面板中[设置 Stripe 的自动账单邮件](https://dashboard.stripe.com/account/billing/automatic)。但是，如果捕获了 `IncompletePayment` 异常，你仍应告知用户他们将收到一封包含进一步支付确认说明的电子邮件。

对于使用 `Billable` trait 的模型，`charge`、`invoiceFor` 和 `invoice` 方法可能会抛出支付异常。在与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法，以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法可能会抛出未完成的支付异常。

你可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法判断现有订阅是否存在未完成的支付：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

你可以通过检查异常实例上的 `payment` 属性来推导未完成支付的具体状态：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $user->charge(1000, 'pm_card_threeDSecure2Required');
} catch (IncompletePayment $exception) {
    // 获取支付意图状态...
    $exception->payment->status;

    // 检查特定条件...
    if ($exception->payment->requiresPaymentMethod()) {
        // ...
    } elseif ($exception->payment->requiresConfirmation()) {
        // ...
    }
}
```

<a name="confirming-payments"></a>
### 确认支付

某些支付方式需要额外的数据才能确认支付。例如，SEPA 支付方式在支付过程中需要额外的"授权"数据。你可以使用 `withPaymentConfirmationOptions` 方法将这些数据提供给 Cashier：

```php
$subscription->withPaymentConfirmationOptions([
    'mandate_data' => '...',
])->swap('price_xxx');
```

你可以查阅 [Stripe API 文档](https://stripe.com/docs/api/payment_intents/confirm) 以了解确认支付时可接受的所有选项。

<a name="strong-customer-authentication"></a>
## 强客户认证（SCA）

如果你的企业或你的某个客户位于欧洲，你将需要遵守欧盟的强客户认证（SCA）法规。这些法规由欧盟于 2019 年 9 月实施，旨在防止支付欺诈。幸运的是，Stripe 和 Cashier 已为构建符合 SCA 的应用程序做好了准备。

> [!WARNING]
> 在开始之前，请查阅 [Stripe 关于 PSD2 和 SCA 的指南](https://stripe.com/guides/strong-customer-authentication) 以及他们[关于新 SCA API 的文档](https://stripe.com/docs/strong-customer-authentication)。

<a name="payments-requiring-additional-confirmation"></a>
### 需要额外确认的支付

SCA 法规通常要求额外的验证才能确认和处理支付。发生这种情况时，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你需要额外的验证。有关如何处理这些异常的更多信息，可在[处理失败支付](#handling-failed-payments) 文档中找到。

支付确认屏幕由 Stripe 或 Cashier 呈现，可能会针对特定的银行或发卡行的支付流程进行定制，并可能包含额外的卡片确认、临时的小额扣款、单独的设备验证或其他形式的验证。

<a name="incomplete-and-past-due-state"></a>
#### 未完成和逾期状态

当支付需要额外确认时，订阅将保持在 `incomplete` 或 `past_due` 状态，如其 `stripe_status` 数据库列所示。一旦支付确认完成，并且你的应用程序通过 Stripe 的 Webhook 收到完成通知，Cashier 将自动激活客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参阅[我们关于这些状态的附加文档](#incomplete-and-past-due-status)。

<a name="off-session-payment-notifications"></a>
### 离线会话支付通知

由于 SCA 法规要求客户即使在其订阅处于活跃状态时也要偶尔验证其支付详细信息，当需要进行离线会话支付确认时，Cashier 可以向客户发送通知。例如，这可能发生在订阅续费时。可以通过将 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为一个通知类来启用 Cashier 的支付通知。默认情况下，此通知是禁用的。当然，Cashier 包含一个你可以用于此目的的通知类，但如果你愿意，也可以自由提供你自己的通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为确保离线会话支付确认通知能够送达，请验证[已为你的应用程序配置 Stripe Webhook](#handling-stripe-webhooks)，并且在你的 Stripe 控制面板中启用了 `invoice.payment_action_required` Webhook。此外，你的 `Billable` 模型还应使用 Laravel 的 `Illuminate\Notifications\Notifiable` trait。

> [!WARNING]
> 即使客户正在手动进行需要额外确认的支付，也会发送通知。遗憾的是，Stripe 无法知道该支付是手动完成的还是"离线会话"完成的。但是，如果客户在已经确认其支付后访问支付页面，他们将只会看到一条"支付成功"的消息。客户不会被允许意外地确认同一笔支付两次，从而避免意外的二次扣款。

<a name="stripe-sdk"></a>
## Stripe SDK

Cashier 的许多对象都是对 Stripe SDK 对象的包装。如果你想直接与 Stripe 对象交互，可以使用 `asStripe` 方法方便地检索它们：

```php
$stripeSubscription = $subscription->asStripeSubscription();

$stripeSubscription->application_fee_percent = 5;

$stripeSubscription->save();
```

你也可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

```php
$subscription->updateStripeSubscription(['application_fee_percent' => 5]);
```

如果你想直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，你可以使用此方法访问 `StripeClient` 实例并从你的 Stripe 账户检索价格列表：

```php
use Laravel\Cashier\Cashier;

$prices = Cashier::stripe()->prices->all();
```

<a name="testing"></a>
## 测试

在测试使用 Cashier 的应用程序时，你可以模拟对 Stripe API 的实际 HTTP 请求；但是，这需要你部分重新实现 Cashier 自身的行为。因此，我们建议让你的测试直接命中实际的 Stripe API。虽然这较慢，但它能更有信心地证明你的应用程序按预期工作，并且任何较慢的测试都可以放置在它们自己的 Pest / PHPUnit 测试组中。

在测试时，请记住 Cashier 本身已经拥有很棒的测试套件，因此你应只专注于测试你自己应用程序的订阅和支付流程，而不是每一个底层的 Cashier 行为。

要开始，请将你的 Stripe 密钥的**测试**版本添加到你的 `phpunit.xml` 文件中：

```xml
<env name="STRIPE_SECRET" value="sk_test_<your-key>"/>
```

现在，每当你在测试时与 Cashier 交互，它都会向你的 Stripe 测试环境发送实际的 API 请求。为方便起见，你应在你的 Stripe 测试账户中预填在测试期间可能用到的订阅 / 价格。

> [!NOTE]
> 为了测试各种计费场景（例如信用卡拒绝和失败），你可以使用 Stripe 提供的丰富的[测试卡号和令牌](https://stripe.com/docs/testing) 范围。
