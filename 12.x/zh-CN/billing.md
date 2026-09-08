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
- [快速入门](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [客户](#customers)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
    - [更新客户](#updating-customers)
    - [余额](#balances)
    - [税号](#tax-ids)
    - [与 Stripe 同步客户数据](#syncing-customer-data-with-stripe)
    - [账单门户](#billing-portal)
- [支付方式](#payment-methods)
    - [存储支付方式](#storing-payment-methods)
    - [检索支付方式](#retrieving-payment-methods)
    - [判断是否存在支付方式](#payment-method-presence)
    - [更新默认支付方式](#updating-the-default-payment-method)
    - [添加支付方式](#adding-payment-methods)
    - [删除支付方式](#deleting-payment-methods)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [变更价格](#changing-prices)
    - [订阅数量](#subscription-quantity)
    - [多产品订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [基于用量的计费](#usage-based-billing)
    - [订阅税费](#subscription-taxes)
    - [订阅锚定日期](#subscription-anchor-date)
    - [取消订阅](#cancelling-subscriptions)
    - [恢复订阅](#resuming-subscriptions)
- [订阅试用期](#subscription-trials)
    - [预收支付方式的试用](#with-payment-method-up-front)
    - [不预收支付方式的试用](#without-payment-method-up-front)
    - [延长试用](#extending-trials)
- [处理 Stripe Webhook](#handling-stripe-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [简单收费](#simple-charge)
    - [带发票的收费](#charge-with-invoice)
    - [创建 Payment Intent](#creating-payment-intents)
    - [退款](#refunding-charges)
- [发票](#invoices)
    - [检索发票](#retrieving-invoices)
    - [即将到来的发票](#upcoming-invoices)
    - [预览订阅发票](#previewing-subscription-invoices)
    - [生成发票 PDF](#generating-invoice-pdfs)
- [Checkout](#checkout)
    - [产品结账](#product-checkouts)
    - [单次收费结账](#single-charge-checkouts)
    - [订阅结账](#subscription-checkouts)
    - [收集税号](#collecting-tax-ids)
    - [访客结账](#guest-checkouts)
- [处理支付失败](#handling-failed-payments)
    - [确认支付](#confirming-payments)
- [强客户认证（SCA）](#strong-customer-authentication)
    - [需要额外确认的支付](#payments-requiring-additional-confirmation)
    - [非会话支付通知](#off-session-payment-notifications)
- [Stripe SDK](#stripe-sdk)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe](https://stripe.com) 的订阅计费服务提供了一套富有表现力的流式接口。它帮你处理了几乎所有你不想亲自编写的样板订阅计费代码。除了基本的订阅管理之外，Cashier 还能处理优惠券、订阅切换、订阅"数量"、取消宽限期，甚至生成发票 PDF。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，请务必仔细阅读[升级指南](https://github.com/laravel/cashier-stripe/blob/16.x/UPGRADE.md)。

> [!WARNING]
> 为了防止破坏性变更，Cashier 使用固定的 Stripe API 版本。Cashier 16 使用 Stripe API 版本 `2025-06-30.basil`。Stripe API 版本会随次要版本更新，以便使用 Stripe 的新功能和改进。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Stripe 版的 Cashier 包：

```shell
composer require laravel/cashier
```

安装该包之后，使用 `vendor:publish` Artisan 命令发布 Cashier 的数据库迁移：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，迁移数据库：

```shell
php artisan migrate
```

Cashier 的迁移会在你的 `users` 表中新增若干列，还会创建一个 `subscriptions` 表来存储所有客户的订阅，以及一个用于多价格订阅的 `subscription_items` 表。

如果有需要，你也可以使用 `vendor:publish` Artisan 命令发布 Cashier 的配置文件：

```shell
php artisan vendor:publish --tag="cashier-config"
```

最后，为了让 Cashier 正确处理所有 Stripe 事件，请记得[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

> [!WARNING]
> Stripe 建议任何用于存储 Stripe 标识符的列都应当区分大小写。因此，使用 MySQL 时，你应当确保 `stripe_id` 列的排序规则（collation）设置为 `utf8_bin`。更多信息请查阅 [Stripe 文档](https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible)。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

使用 Cashier 之前，请把 `Billable` Trait 添加到你的可计费模型定义中。通常，这会是 `App\Models\User` 模型。该 Trait 提供了多种方法，让你能够执行常见的计费任务，例如创建订阅、应用优惠券以及更新支付方式信息：

```php
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

Cashier 默认假设你的可计费模型是 Laravel 自带的 `App\Models\User` 类。如果想改变这一点，你可以通过 `useCustomerModel` 方法指定其他模型。该方法通常应当在 `AppServiceProvider` 类的 `boot` 方法中调用：

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
> 如果你使用的不是 Laravel 提供的 `App\Models\User` 模型，则需要发布并修改 [Cashier 的数据库迁移](#installation)，使其匹配你所用模型的表名。

<a name="api-keys"></a>
### API 密钥

接下来，你应当在应用的 `.env` 文件中配置 Stripe API 密钥。你可以从 Stripe 控制面板获取 Stripe API 密钥：

```ini
STRIPE_KEY=your-stripe-key
STRIPE_SECRET=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

> [!WARNING]
> 你应当确保在应用的 `.env` 文件中定义了 `STRIPE_WEBHOOK_SECRET` 环境变量，因为该变量用于确保传入的 webhook 确实来自 Stripe。

<a name="currency-configuration"></a>
### 货币配置

Cashier 默认货币是美元（USD）。你可以在应用的 `.env` 文件中设置 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=eur
```

除了配置 Cashier 的货币之外，你还可以指定在格式化发票上显示的金额时所用的区域设置。在内部，Cashier 使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 要使用 `en` 以外的区域设置，请确保服务器上已安装并配置好 `ext-intl` PHP 扩展。

<a name="tax-configuration"></a>
### 税务配置

得益于 [Stripe Tax](https://stripe.com/tax)，可以为 Stripe 生成的所有发票自动计算税费。你可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法来启用自动税费计算：

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

启用税费计算之后，新生成的所有订阅和一次性发票都将获得自动税费计算。

要让此功能正常工作，客户的账单信息（如客户姓名、地址和税号）需要同步到 Stripe。你可以使用 Cashier 提供的[客户数据同步](#syncing-customer-data-with-stripe)和[税号](#tax-ids)方法来完成。

<a name="logging"></a>
### 日志

Cashier 允许你指定记录致命 Stripe 错误时所用的日志通道。你可以在应用的 `.env` 文件中定义 `CASHIER_LOGGER` 环境变量来指定日志通道：

```ini
CASHIER_LOGGER=stack
```

调用 Stripe API 时产生的异常将通过应用默认的日志通道进行记录。

<a name="using-custom-models"></a>
### 使用自定义模型

你可以随意扩展 Cashier 在内部使用的模型：定义自己的模型并继承对应的 Cashier 模型即可：

```php
use Laravel\Cashier\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义好模型之后，你可以通过 `Laravel\Cashier\Cashier` 类让 Cashier 使用你的自定义模型。通常，你应当在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

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
## 快速入门

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应当在 Stripe 控制面板中定义带有固定价格的产品。此外，你还应当[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

通过应用提供产品和订阅计费可能让人望而生畏。不过，借助 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代化、健壮的支付集成。

要针对非周期性的单次收费产品向客户收款，我们将利用 Cashier 把客户引导到 Stripe Checkout，客户将在那里填写支付信息并确认购买。一旦通过 Checkout 完成支付，客户就会被重定向到你应用中指定的成功 URL：

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

如上例所示，我们将利用 Cashier 提供的 `checkout` 方法，把客户重定向到 Stripe Checkout 的指定"价格标识符"处。在 Stripe 中，"价格"（price）指的是[为特定产品定义的价格](https://stripe.com/docs/products-prices/how-products-and-prices-work)。

必要时，`checkout` 方法会自动在 Stripe 中创建客户，并将该 Stripe 客户记录与应用数据库中对应的用户关联起来。完成结账会话后，客户会被重定向到专门的成功页或取消页，你可以在那里向客户展示一条提示信息。

<a name="providing-meta-data-to-stripe-checkout"></a>
#### 为 Stripe Checkout 提供元数据

销售产品时，通常会用应用自己定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品。当把客户重定向到 Stripe Checkout 完成购买时，你可能需要提供现有的订单标识符，以便在客户被重定向回应用时，把已完成的购买与对应订单关联起来。

为此，你可以向 `checkout` 方法提供一个 `metadata` 数组。假设当用户开始结账流程时，我们的应用中会创建一个待处理的 `Order`。请记住，本例中的 `Cart` 和 `Order` 模型仅作示意，并非 Cashier 提供。你可以根据自己应用的需要来自由实现这些概念：

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

如上例所示，当用户开始结账流程时，我们会把购物车 / 订单关联的所有 Stripe 价格标识符提供给 `checkout` 方法。当然，当客户添加这些商品时，你的应用负责把它们与"购物车"或订单关联起来。我们还通过 `metadata` 数组把订单 ID 提供给了 Stripe Checkout 会话。最后，我们在 Checkout 成功路由中加入了 `CHECKOUT_SESSION_ID` 模板变量。当 Stripe 把客户重定向回应用时，该模板变量会自动被填充为 Checkout 会话 ID。

接下来，让我们构建 Checkout 成功路由。这是用户通过 Stripe Checkout 完成购买后被重定向到的路由。在该路由中，我们可以获取 Stripe Checkout 会话 ID 及关联的 Stripe Checkout 实例，从而访问我们提供的元数据，并相应地更新客户的订单：

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

有关 [Checkout 会话对象所包含的数据](https://stripe.com/docs/api/checkout/sessions/object)的更多信息，请查阅 Stripe 文档。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应当在 Stripe 控制面板中定义带有固定价格的产品。此外，你还应当[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

通过应用提供产品和订阅计费可能让人望而生畏。不过，借助 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代化、健壮的支付集成。

要学习如何使用 Cashier 和 Stripe Checkout 销售订阅，我们来看一个简单的场景：一个订阅服务提供基础月付（`price_basic_monthly`）和年付（`price_basic_yearly`）方案。这两个价格可以在 Stripe 控制面板中归入一个 "Basic" 产品（`pro_basic`）之下。此外，我们的订阅服务还可能以 `pro_expert` 提供一个 Expert 方案。

首先，我们来看看客户如何订阅我们的服务。当然，你可以想象客户可能会在应用的定价页上点击 Basic 方案的"订阅"按钮。该按钮或链接应当把用户引导到一个 Laravel 路由，由它为用户选择的方案创建 Stripe Checkout 会话：

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

如上例所示，我们会把客户重定向到一个 Stripe Checkout 会话，让客户可以订阅我们的 Basic 方案。结账成功或取消后，客户会被重定向回我们提供给 `checkout` 方法的 URL。由于某些支付方式需要几秒钟的处理时间，要知道订阅何时真正开始，我们还需要[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

现在客户可以开始订阅了，我们还需要限制应用的某些部分，只允许已订阅的用户访问。当然，我们可以随时通过 Cashier 的 `Billable` Trait 提供的 `subscribed` 方法来判断用户当前的订阅状态：

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
#### 构建订阅检查中间件

为了方便，你可能希望创建一个[中间件](/docs/{{version}}/middleware)，用于判断传入请求是否来自已订阅的用户。定义好这个中间件后，你就可以轻松地把它分配给路由，防止未订阅的用户访问该路由：

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
            // 把用户重定向到计费页面并要求其订阅...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

定义好中间件之后，你就可以把它分配给路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理自己的计费方案

当然，客户可能想把订阅方案更换为其他产品或"档次"。实现这一点的最简单方式，是把客户引导到 Stripe 的[客户账单门户](https://stripe.com/docs/no-code/customer-portal)。它提供了一个托管界面，客户可以在其中下载发票、更新支付方式以及更换订阅方案。

首先，在应用中定义一个链接或按钮，把用户引导到一个 Laravel 路由，我们将用该路由来发起账单门户会话：

```blade
<a href="{{ route('billing') }}">
    Billing
</a>
```

接下来，让我们定义发起 Stripe 客户账单门户会话并将用户重定向到该门户的路由。`redirectToBillingPortal` 方法接受用户退出门户后应返回的 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('dashboard'));
})->middleware(['auth'])->name('billing');
```

> [!NOTE]
> 只要你配置好了 Cashier 的 webhook 处理，Cashier 就会通过检查来自 Stripe 的传入 webhook，自动保持应用中 Cashier 相关数据库表的同步。例如，当用户通过 Stripe 的客户账单门户取消订阅时，Cashier 会收到相应的 webhook，并在应用的数据库中将该订阅标记为"已取消"。

<a name="customers"></a>
## 客户

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法通过 Stripe ID 检索客户。该方法会返回可计费模型的一个实例：

```php
use Laravel\Cashier\Cashier;

$user = Cashier::findBillable($stripeId);
```

<a name="creating-customers"></a>
### 创建客户

有时，你可能希望在不开始订阅的情况下创建一个 Stripe 客户。这可以通过 `createAsStripeCustomer` 方法来完成：

```php
$stripeCustomer = $user->createAsStripeCustomer();
```

在 Stripe 中创建客户之后，你可以日后再开始订阅。你可以提供一个可选的 `$options` 数组，传入任何 [Stripe API 支持的额外客户创建参数](https://stripe.com/docs/api/customers/create)：

```php
$stripeCustomer = $user->createAsStripeCustomer($options);
```

如果想返回可计费模型对应的 Stripe 客户对象，可以使用 `asStripeCustomer` 方法：

```php
$stripeCustomer = $user->asStripeCustomer();
```

如果你想获取给定可计费模型的 Stripe 客户对象，但不确定该模型是否已经是 Stripe 中的客户，可以使用 `createOrGetStripeCustomer` 方法。如果客户尚不存在，该方法会在 Stripe 中创建一个新客户：

```php
$stripeCustomer = $user->createOrGetStripeCustomer();
```

<a name="updating-customers"></a>
### 更新客户

有时，你可能希望直接为 Stripe 客户更新额外的信息。这可以通过 `updateStripeCustomer` 方法来完成。该方法接受一个由 [Stripe API 支持的客户更新选项](https://stripe.com/docs/api/customers/update)组成的数组：

```php
$stripeCustomer = $user->updateStripeCustomer($options);
```

<a name="balances"></a>
### 余额

Stripe 允许你对客户的"余额"进行贷记或借记。之后，该余额会在新发票上进行贷记或借记。要查看客户的总余额，可以使用可计费模型上的 `balance` 方法。`balance` 方法会返回以客户货币表示的、格式化后的余额字符串：

```php
$balance = $user->balance();
```

要贷记客户余额，可以向 `creditBalance` 方法提供一个值。如果愿意，你还可以提供一段描述：

```php
$user->creditBalance(500, 'Premium customer top-up.');
```

向 `debitBalance` 方法提供一个值则会借记客户的余额：

```php
$user->debitBalance(300, 'Bad usage penalty.');
```

`applyBalance` 方法会为客户创建新的客户余额交易。你可以使用 `balanceTransactions` 方法获取这些交易记录，这在为客户提供可供查阅的贷记与借记日志时会很有用：

```php
// 获取所有交易...
$transactions = $user->balanceTransactions();

foreach ($transactions as $transaction) {
    // 交易金额...
    $amount = $transaction->amount(); // $2.31

    // 可用时获取相关发票...
    $invoice = $transaction->invoice();
}
```

<a name="tax-ids"></a>
### 税号

Cashier 提供了管理客户税号的简便方法。例如，可以使用 `taxIds` 方法以集合的形式获取分配给客户的所有[税号](https://stripe.com/docs/api/customer_tax_ids/object)：

```php
$taxIds = $user->taxIds();
```

你也可以通过标识符获取客户的特定税号：

```php
$taxId = $user->findTaxId('txi_belgium');
```

通过向 `createTaxId` 方法提供有效的[类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type)和值，你可以创建一个新税号：

```php
$taxId = $user->createTaxId('eu_vat', 'BE0123456789');
```

`createTaxId` 方法会立即把增值税号（VAT ID）添加到客户账户。[增值税号的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；不过，这是一个异步过程。你可以通过订阅 `customer.tax_id.updated` webhook 事件并检查[增值税号的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification)来获知验证结果的更新。有关处理 webhook 的更多信息，请查阅[定义 webhook 处理器的文档](#handling-stripe-webhooks)。

你可以使用 `deleteTaxId` 方法删除税号：

```php
$user->deleteTaxId('txi_belgium');
```

<a name="syncing-customer-data-with-stripe"></a>
### 与 Stripe 同步客户数据

通常，当应用的用户更新了姓名、邮箱地址或其他同样存储在 Stripe 中的信息时，你应当把这些更新告知 Stripe。这样，Stripe 中的信息副本就会与应用保持同步。

要自动化这一过程，你可以在可计费模型上定义一个事件监听器，响应模型的 `updated` 事件。然后，在事件监听器中调用模型上的 `syncStripeCustomerDetails` 方法：

```php
use App\Models\User;
use function Illuminate\Events\queueable;

/**
 * 模型的 "booted" 方法。
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

现在，每次客户模型被更新时，其信息都会与 Stripe 同步。为了方便，Cashier 还会在客户初次创建时自动把客户信息同步到 Stripe。

你可以通过重写 Cashier 提供的多种方法，来自定义同步到 Stripe 的客户信息所用的列。例如，你可以重写 `stripeName` 方法，来自定义 Cashier 向 Stripe 同步客户信息时，应当把哪个属性视为客户的"姓名"：

```php
/**
 * 获取应同步到 Stripe 的客户姓名。
 */
public function stripeName(): string|null
{
    return $this->company_name;
}
```

类似地，你也可以重写 `stripeEmail`、`stripePhone`（最多 20 个字符）、`stripeAddress` 和 `stripePreferredLocales` 方法。这些方法会在[更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update)时，把信息同步到对应的客户参数。如果你想完全掌控客户信息同步过程，可以重写 `syncStripeCustomerDetails` 方法。

<a name="billing-portal"></a>
### 账单门户

Stripe 提供了[一套搭建账单门户的简便方式](https://stripe.com/docs/billing/subscriptions/customer-portal)，你的客户可以在其中管理自己的订阅、支付方式，并查看账单历史。你可以在控制器或路由中对可计费模型调用 `redirectToBillingPortal` 方法，把用户重定向到账单门户：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal();
});
```

默认情况下，用户管理完订阅后，可以通过 Stripe 账单门户中的链接返回应用的 `home` 路由。你可以把自定义的返回 URL 作为参数传给 `redirectToBillingPortal` 方法：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('billing'));
});
```

如果只想生成账单门户的 URL 而不生成 HTTP 重定向响应，可以调用 `billingPortalUrl` 方法：

```php
$url = $request->user()->billingPortalUrl(route('billing'));
```

<a name="payment-methods"></a>
## 支付方式

<a name="storing-payment-methods"></a>
### 存储支付方式

要用 Stripe 创建订阅或执行"一次性"收费，你需要存储一个支付方式并从 Stripe 获取其标识符。具体做法取决于你打算把该支付方式用于订阅还是单次收费，因此我们将分别加以讨论。

<a name="payment-methods-for-subscriptions"></a>
#### 用于订阅的支付方式

当存储客户的信用卡信息供订阅日后使用时，必须使用 Stripe 的 "Setup Intents" API 来安全地收集客户的支付方式信息。"Setup Intent"（设置意图）会向 Stripe 表明为客户的支付方式扣费的意图。Cashier 的 `Billable` Trait 包含了 `createSetupIntent` 方法，可轻松创建新的 Setup Intent。你应当在渲染收集客户支付方式信息的表单的路由或控制器中调用该方法：

```php
return view('update-payment-method', [
    'intent' => $user->createSetupIntent()
]);
```

创建 Setup Intent 并传给视图之后，你应当把它的 secret 附加到收集支付方式的元素上。例如，考虑这个"更新支付方式"表单：

```html
<input id="card-holder-name" type="text">

<!-- Stripe Elements Placeholder -->
<div id="card-element"></div>

<button id="card-button" data-secret="{{ $intent->client_secret }}">
    Update Payment Method
</button>
```

接下来，可以使用 Stripe.js 库把一个 [Stripe Element](https://stripe.com/docs/stripe-js) 附加到表单上，并安全地收集客户的支付信息：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

然后，可以使用 [Stripe 的 `confirmCardSetup` 方法](https://stripe.com/docs/js/setup_intents/confirm_card_setup)验证卡片，并从 Stripe 获取安全的"支付方式标识符"：

```js
const cardHolderName = document.getElementById('card-holder-name');
const cardButton = document.getElementById('card-button');
const clientSecret = cardButton.dataset.secret;

cardButton.addEventListener('click', async (e) => {
    const { setupIntent, error } = await stripe.confirmCardSetup(
        clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: { name: cardHolderName.value }
            }
        }
    );

    if (error) {
        // 向用户展示 "error.message"...
    } else {
        // 卡片已成功验证...
    }
});
```

卡片通过 Stripe 验证后，你可以把得到的 `setupIntent.payment_method` 标识符传给 Laravel 应用，在应用中将其附加给客户。该支付方式既可以[作为新的支付方式添加](#adding-payment-methods)，也可以[用于更新默认支付方式](#updating-the-default-payment-method)。你还可以直接使用该支付方式标识符来[创建新订阅](#creating-subscriptions)。

> [!NOTE]
> 如果想了解更多关于 Setup Intent 和收集客户支付信息的内容，请[阅读 Stripe 提供的概述](https://stripe.com/docs/payments/save-and-reuse#php)。

<a name="payment-methods-for-single-charges"></a>
#### 用于单次收费的支付方式

当然，对客户的支付方式进行单次收费时，我们只需要使用一次支付方式标识符。由于 Stripe 的限制，你不能把客户已存储的默认支付方式用于单次收费。你必须允许客户使用 Stripe.js 库输入其支付方式信息。例如，考虑下面的表单：

```html
<input id="card-holder-name" type="text">

<!-- Stripe Elements Placeholder -->
<div id="card-element"></div>

<button id="card-button">
    Process Payment
</button>
```

定义好这样的表单之后，可以使用 Stripe.js 库把一个 [Stripe Element](https://stripe.com/docs/stripe-js) 附加到表单上，并安全地收集客户的支付信息：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

然后，可以使用 [Stripe 的 `createPaymentMethod` 方法](https://stripe.com/docs/stripe-js/reference#stripe-create-payment-method)验证卡片，并从 Stripe 获取安全的"支付方式标识符"：

```js
const cardHolderName = document.getElementById('card-holder-name');
const cardButton = document.getElementById('card-button');

cardButton.addEventListener('click', async (e) => {
    const { paymentMethod, error } = await stripe.createPaymentMethod(
        'card', cardElement, {
            billing_details: { name: cardHolderName.value }
        }
    );

    if (error) {
        // 向用户展示 "error.message"...
    } else {
        // 卡片已成功验证...
    }
});
```

如果卡片验证成功，你可以把 `paymentMethod.id` 传给 Laravel 应用并处理[单次收费](#simple-charge)。

<a name="retrieving-payment-methods"></a>
### 检索支付方式

可计费模型实例上的 `paymentMethods` 方法会返回一个由 `Laravel\Cashier\PaymentMethod` 实例组成的集合：

```php
$paymentMethods = $user->paymentMethods();
```

默认情况下，该方法会返回所有类型的支付方式。要获取特定类型的支付方式，可以向该方法传入 `type` 参数：

```php
$paymentMethods = $user->paymentMethods('sepa_debit');
```

要获取客户的默认支付方式，可以使用 `defaultPaymentMethod` 方法：

```php
$paymentMethod = $user->defaultPaymentMethod();
```

你可以使用 `findPaymentMethod` 方法获取附加到可计费模型上的特定支付方式：

```php
$paymentMethod = $user->findPaymentMethod($paymentMethodId);
```

<a name="payment-method-presence"></a>
### 判断是否存在支付方式

要判断可计费模型的账户上是否附加了默认支付方式，可以调用 `hasDefaultPaymentMethod` 方法：

```php
if ($user->hasDefaultPaymentMethod()) {
    // ...
}
```

你可以使用 `hasPaymentMethod` 方法判断可计费模型的账户上是否附加了至少一个支付方式：

```php
if ($user->hasPaymentMethod()) {
    // ...
}
```

该方法会判断可计费模型是否拥有任何支付方式。要判断模型是否存在特定类型的支付方式，可以向该方法传入 `type` 参数：

```php
if ($user->hasPaymentMethod('sepa_debit')) {
    // ...
}
```

<a name="updating-the-default-payment-method"></a>
### 更新默认支付方式

`updateDefaultPaymentMethod` 方法可用于更新客户的默认支付方式信息。该方法接受一个 Stripe 支付方式标识符，并把新的支付方式指定为默认的账单支付方式：

```php
$user->updateDefaultPaymentMethod($paymentMethod);
```

要让默认支付方式信息与 Stripe 中客户的默认支付方式信息保持同步，可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

```php
$user->updateDefaultPaymentMethodFromStripe();
```

> [!WARNING]
>
客户的默认支付方式只能用于开票和创建新订阅。由于 Stripe 施加的限制，它不能用于单次收费。

<a name="adding-payment-methods"></a>
### 添加支付方式

要添加新的支付方式，可以在可计费模型上调用 `addPaymentMethod` 方法，并传入支付方式标识符：

```php
$user->addPaymentMethod($paymentMethod);
```

> [!NOTE]
> 要了解如何获取支付方式标识符，请查阅[支付方式存储文档](#storing-payment-methods)。

<a name="deleting-payment-methods"></a>
### 删除支付方式

要删除一个支付方式，可以在想要删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

```php
$paymentMethod->delete();
```

`deletePaymentMethod` 方法会从可计费模型上删除一个特定的支付方式：

```php
$user->deletePaymentMethod('pm_visa');
```

`deletePaymentMethods` 方法会删除可计费模型的所有支付方式信息：

```php
$user->deletePaymentMethods();
```

默认情况下，该方法会删除所有类型的支付方式。要删除特定类型的支付方式，可以向该方法传入 `type` 参数：

```php
$user->deletePaymentMethods('sepa_debit');
```

> [!WARNING]
> 如果用户拥有一个有效订阅，你的应用不应当允许他们删除默认支付方式。

<a name="subscriptions"></a>
## 订阅

订阅为客户提供了一种设置周期性付款的方式。由 Cashier 管理的 Stripe 订阅支持多个订阅价格、订阅数量、试用期等特性。

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先获取可计费模型的一个实例，通常会是 `App\Models\User` 的实例。获取模型实例之后，你可以使用 `newSubscription` 方法来创建该模型的订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription(
        'default', 'price_monthly'
    )->create($request->paymentMethodId);

    // ...
});
```

传给 `newSubscription` 方法的第一个参数应当是订阅的内部类型。如果你的应用只提供一种订阅，可以把它命名为 `default` 或 `primary`。该订阅类型仅供应用内部使用，不应展示给用户。此外，它不应包含空格，并且在创建订阅之后绝不应更改。第二个参数是用户订阅的具体价格。该值应当与 Stripe 中价格的标识符相对应。

`create` 方法接受 [Stripe 支付方式标识符](#storing-payment-methods)或 Stripe `PaymentMethod` 对象，它会开始订阅，并把可计费模型的 Stripe 客户 ID 及其他相关账单信息写入你的数据库。

> [!WARNING]
> 直接把支付方式标识符传给 `create` 订阅方法，还会自动把它添加到用户已存储的支付方式中。

<a name="collecting-recurring-payments-via-invoice-emails"></a>
#### 通过发票邮件收取周期性付款

除了自动收取客户的周期性付款之外，你也可以指示 Stripe 在每期周期性付款到期时，通过邮件向客户发送发票。然后，客户可以在收到发票后手动支付。通过发票收取周期性付款时，客户无需预先提供支付方式：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice();
```

客户在订阅被取消之前可以支付发票的时间，由 `days_until_due` 选项决定。默认为 30 天；不过，如有需要，你也可以为该选项提供特定的值：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
    'days_until_due' => 30
]);
```

<a name="subscription-quantities"></a>
#### 数量

如果在创建订阅时想为价格设置特定的[数量](https://stripe.com/docs/billing/subscriptions/quantities)，你应当在创建订阅之前，在订阅构建器上调用 `quantity` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->quantity(5)
    ->create($paymentMethod);
```

<a name="additional-details"></a>
#### 额外详情

如果你想指定 Stripe 支持的其他[客户](https://stripe.com/docs/api/customers/create)或[订阅](https://stripe.com/docs/api/subscriptions/create)选项，可以把它们作为 `create` 方法的第二个和第三个参数传入：

```php
$user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
    'email' => $email,
], [
    'metadata' => ['note' => 'Some extra information.'],
]);
```

<a name="coupons"></a>
#### 优惠券

如果想在创建订阅时应用优惠券，可以使用 `withCoupon` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withCoupon('code')
    ->create($paymentMethod);
```

或者，如果想应用 [Stripe 促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withPromotionCode('promo_code_id')
    ->create($paymentMethod);
```

给定的促销代码 ID 应当是分配给该促销代码的 Stripe API ID，而不是面向客户的促销代码。如果你需要根据面向客户的促销代码查找促销代码 ID，可以使用 `findPromotionCode` 方法：

```php
// 通过面向客户的促销代码查找促销代码 ID...
$promotionCode = $user->findPromotionCode('SUMMERSALE');

// 通过面向客户的促销代码查找有效的促销代码 ID...
$promotionCode = $user->findActivePromotionCode('SUMMERSALE');
```

在上面的例子中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的实例。该类包装了一个底层的 `Stripe\PromotionCode` 对象。你可以通过调用 `coupon` 方法获取与该促销代码关联的优惠券：

```php
$coupon = $user->findPromotionCode('SUMMERSALE')->coupon();
```

优惠券实例让你能够判断折扣金额，以及优惠券是固定折扣还是按百分比折扣：

```php
if ($coupon->isPercentage()) {
    return $coupon->percentOff().'%'; // 21.5%
} else {
    return $coupon->amountOff(); // $5.99
}
```

你还可以获取当前应用于客户或订阅的折扣：

```php
$discount = $billable->discount();

$discount = $subscription->discount();
```

返回的 `Laravel\Cashier\Discount` 实例包装了一个底层的 `Stripe\Discount` 对象实例。你可以通过调用 `coupon` 方法获取与该折扣关联的优惠券：

```php
$coupon = $subscription->discount()->coupon();
```

如果想为客户或订阅应用新的优惠券或促销代码，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法完成：

```php
$billable->applyCoupon('coupon_id');
$billable->applyPromotionCode('promotion_code_id');

$subscription->applyCoupon('coupon_id');
$subscription->applyPromotionCode('promotion_code_id');
```

请记住，你应当使用分配给促销代码的 Stripe API ID，而不是面向客户的促销代码。同一时间只能对一个客户或订阅应用一个优惠券或促销代码。

有关这一主题的更多信息，请查阅 Stripe 关于[优惠券](https://stripe.com/docs/billing/subscriptions/coupons)和[促销代码](https://stripe.com/docs/billing/subscriptions/coupons/codes)的文档。

<a name="adding-subscriptions"></a>
#### 添加订阅

如果想为已拥有默认支付方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->add();
```

<a name="creating-subscriptions-from-the-stripe-dashboard"></a>
#### 从 Stripe 控制面板创建订阅

你也可以直接从 Stripe 控制面板创建订阅。这样做时，Cashier 会同步新添加的订阅，并将其类型指定为 `default`。要自定义分配给控制面板所创建订阅的订阅类型，请[定义 webhook 事件处理器](#defining-webhook-event-handlers)。

此外，通过 Stripe 控制面板只能创建一种类型的订阅。如果你的应用提供使用不同类型的多个订阅，则只能通过 Stripe 控制面板添加其中一种类型的订阅。

最后，你应当始终确保应用的每种订阅类型只添加一个有效订阅。如果客户有两个 `default` 订阅，即使两者都会同步到应用的数据库，Cashier 也只会使用最近添加的那个订阅。

<a name="checking-subscription-status"></a>
### 检查订阅状态

客户订阅了你的应用之后，你可以使用多种便捷的方法轻松检查其订阅状态。首先，如果客户拥有一个有效订阅，即使该订阅当前处于试用期，`subscribed` 方法也会返回 `true`。`subscribed` 方法接受订阅类型作为第一个参数：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也非常适合用作[路由中间件](/docs/{{version}}/middleware)，让你可以根据用户的订阅状态来过滤对路由和控制器的访问：

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

如果想判断用户是否仍处于试用期，可以使用 `onTrial` 方法。该方法对于判断是否应当向用户显示"仍处于试用期"的警告很有用：

```php
if ($user->subscription('default')->onTrial()) {
    // ...
}
```

`subscribedToProduct` 方法可用于根据给定 Stripe 产品的标识符，判断用户是否订阅了该产品。在 Stripe 中，产品是价格的集合。在本例中，我们将判断用户的 `default` 订阅是否有效订阅了应用的 "premium" 产品。给定的 Stripe 产品标识符应当与你在 Stripe 控制面板中的某个产品标识符相对应：

```php
if ($user->subscribedToProduct('prod_premium', 'default')) {
    // ...
}
```

通过向 `subscribedToProduct` 方法传入一个数组，你可以判断用户的 `default` 订阅是否有效订阅了应用的 "basic" 或 "premium" 产品：

```php
if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
    // ...
}
```

`subscribedToPrice` 方法可用于判断客户的订阅是否对应给定的价格 ID：

```php
if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
    // ...
}
```

`recurring` 方法可用于判断用户当前是否处于已订阅状态，并且已不在试用期内：

```php
if ($user->subscription('default')->recurring()) {
    // ...
}
```

> [!WARNING]
> 如果用户有两个相同类型的订阅，`subscription` 方法将始终返回最近创建的那个订阅。例如，一个用户可能有两个类型为 `default` 的订阅记录；不过，其中一个可能是旧的、已过期的订阅，另一个是当前有效的订阅。`subscription` 方法始终返回最近的订阅，而较旧的订阅会保留在数据库中以供查阅历史。

<a name="cancelled-subscription-status"></a>
#### 已取消订阅的状态

要判断用户是否曾经是有效订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription('default')->canceled()) {
    // ...
}
```

你还可以判断用户是否已取消订阅但仍在"宽限期"内，即订阅尚未完全到期。例如，如果用户在 3 月 5 日取消了原本定于 3 月 10 日到期的订阅，那么该用户在 3 月 10 日之前都处于"宽限期"。注意，在此期间 `subscribed` 方法仍会返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

要判断用户是否已取消订阅并且不再处于"宽限期"内，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    // ...
}
```

<a name="incomplete-and-past-due-status"></a>
#### 未完成与逾期状态

如果订阅在创建后还需要进行辅助支付操作，订阅将被标记为 `incomplete`。订阅状态存储在 Cashier 的 `subscriptions` 数据库表的 `stripe_status` 列中。

类似地，如果在切换价格时需要进行辅助支付操作，订阅将被标记为 `past_due`。当订阅处于这两种状态之一时，在客户确认付款之前它都不会生效。判断订阅是否存在未完成的付款，可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

当订阅存在未完成的付款时，你应当把用户引导到 Cashier 的支付确认页面，并传入 `latestPayment` 标识符。你可以使用订阅实例上的 `latestPayment` 方法获取该标识符：

```html
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果你希望订阅处于 `past_due` 或 `incomplete` 状态时仍被视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，这些方法应当在 `App\Providers\AppServiceProvider` 的 `register` 方法中调用：

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
> 当订阅处于 `incomplete` 状态时，在付款确认之前无法对其进行变更。因此，当订阅处于 `incomplete` 状态时，`swap` 和 `updateQuantity` 方法会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅查询作用域

大多数订阅状态也提供了对应的查询作用域，让你可以轻松地在数据库中查询处于指定状态的订阅：

```php
// 获取所有有效订阅...
$subscriptions = Subscription::query()->active()->get();

// 获取某个用户的所有已取消订阅...
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

客户订阅你的应用之后，可能偶尔会想更换到新的订阅价格。要把客户切换到新价格，请把 Stripe 价格的标识符传给 `swap` 方法。切换价格时，如果用户的订阅之前被取消，系统会假定用户希望重新激活该订阅。给定的价格标识符应当与 Stripe 控制面板中可用的 Stripe 价格标识符相对应：

```php
use App\Models\User;

$user = App\Models\User::find(1);

$user->subscription('default')->swap('price_yearly');
```

如果客户处于试用期，试用期将被保留。此外，如果订阅存在"数量"，该数量也会被保留。

如果想切换价格并取消客户当前所处的试用期，可以调用 `skipTrial` 方法：

```php
$user->subscription('default')
    ->skipTrial()
    ->swap('price_yearly');
```

如果想切换价格并立即向客户开票，而不是等待下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice('price_yearly');
```

<a name="prorations"></a>
#### 按比例计费

默认情况下，Stripe 会在价格之间切换时按比例计费。`noProrate` 方法可用于更新订阅价格而不按比例计费：

```php
$user->subscription('default')->noProrate()->swap('price_yearly');
```

有关订阅按比例计费的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> [!WARNING]
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法不会影响按比例计费。发票始终会被开具。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，一个项目管理应用可能会按每个项目每月 10 美元收费。你可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松增减订阅数量：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// 在订阅当前数量上加五...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// 在订阅当前数量上减五...
$user->subscription('default')->decrementQuantity(5);
```

此外，你也可以使用 `updateQuantity` 方法设置特定的数量：

```php
$user->subscription('default')->updateQuantity(10);
```

`noProrate` 方法可用于更新订阅数量而不按比例计费：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

有关订阅数量的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/subscriptions/quantities)。

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 多产品订阅的数量

如果你的订阅是[多产品订阅](#subscriptions-with-multiple-products)，你应当把想要增减数量的价格 ID 作为第二个参数传给增减方法：

```php
$user->subscription('default')->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 多产品订阅

[多产品订阅](https://stripe.com/docs/billing/subscriptions/multiple-products)允许你把多个计费产品分配给单个订阅。例如，假设你正在构建一个客服"工单"应用，基础订阅价格为每月 10 美元，同时提供每月额外 15 美元的在线聊天附加产品。多产品订阅的信息存储在 Cashier 的 `subscription_items` 数据库表中。

你可以通过向 `newSubscription` 方法传入一个价格数组作为第二个参数，为给定订阅指定多个产品：

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

在上面的例子中，客户的 `default` 订阅将附加两个价格。这两个价格将按各自的计费周期收费。必要时，你可以使用 `quantity` 方法为每个价格指定特定的数量：

```php
$user = User::find(1);

$user->newSubscription('default', ['price_monthly', 'price_chat'])
    ->quantity(5, 'price_chat')
    ->create($paymentMethod);
```

如果想为现有订阅再添加一个价格，可以调用订阅的 `addPrice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat');
```

上面的例子会添加新价格，客户将在下一个计费周期被收费。如果想立即向客户收费，可以使用 `addPriceAndInvoice` 方法：

```php
$user->subscription('default')->addPriceAndInvoice('price_chat');
```

如果想添加带有特定数量的价格，可以把数量作为 `addPrice` 或 `addPriceAndInvoice` 方法的第二个参数传入：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat', 5);
```

你可以使用 `removePrice` 方法从订阅中移除价格：

```php
$user->subscription('default')->removePrice('price_chat');
```

> [!WARNING]
> 不能移除订阅上的最后一个价格。此时，你应当直接取消该订阅。

<a name="swapping-prices"></a>
#### 切换价格

你也可以变更多产品订阅上附加的价格。例如，假设客户拥有带 `price_chat` 附加产品的 `price_basic` 订阅，你想把客户从 `price_basic` 升级到 `price_pro`：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap(['price_pro', 'price_chat']);
```

执行上面的例子时，底层带有 `price_basic` 的订阅项会被删除，带有 `price_chat` 的订阅项会被保留。此外，还会为 `price_pro` 创建一个新的订阅项。

你还可以通过向 `swap` 方法传入一个键 / 值对数组来指定订阅项选项。例如，你可能需要指定订阅价格的数量：

```php
$user = User::find(1);

$user->subscription('default')->swap([
    'price_pro' => ['quantity' => 5],
    'price_chat'
]);
```

如果只想切换订阅上的单个价格，可以在订阅项本身上使用 `swap` 方法。当你想保留订阅其他价格上的所有现有元数据时，这种方式尤其有用：

```php
$user = User::find(1);

$user->subscription('default')
    ->findItemOrFail('price_basic')
    ->swap('price_pro');
```

<a name="proration"></a>
#### 按比例计费

默认情况下，Stripe 在为多产品订阅添加或移除价格时会按比例计费。如果想进行价格调整而不按比例计费，你应当在价格操作上链式调用 `noProrate` 方法：

```php
$user->subscription('default')->noProrate()->removePrice('price_chat');
```

<a name="swapping-quantities"></a>
#### 数量

如果想更新单个订阅价格的数量，可以使用[现有的数量方法](#subscription-quantity)，把价格 ID 作为方法的额外参数传入：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity(5, 'price_chat');

$user->subscription('default')->decrementQuantity(3, 'price_chat');

$user->subscription('default')->updateQuantity(10, 'price_chat');
```

> [!WARNING]
> 当订阅有多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性将为 `null`。要访问各个价格的属性，你应当使用 `Subscription` 模型上的 `items` 关联。

<a name="subscription-items"></a>
#### 订阅项

当订阅有多个价格时，数据库的 `subscription_items` 表中会存储多个订阅"项"。你可以通过订阅上的 `items` 关联来访问它们：

```php
use App\Models\User;

$user = User::find(1);

$subscriptionItem = $user->subscription('default')->items->first();

// 获取特定订阅项的 Stripe 价格和数量...
$stripePrice = $subscriptionItem->stripe_price;
$quantity = $subscriptionItem->quantity;
```

你还可以使用 `findItemOrFail` 方法获取特定的价格：

```php
$user = User::find(1);

$subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');
```

<a name="multiple-subscriptions"></a>
### 多个订阅

Stripe 允许你的客户同时拥有多个订阅。例如，你可能经营着一家健身房，提供游泳订阅和举重订阅，每个订阅的定价可以不同。当然，客户应当能够订阅其中一个或两个方案。

应用创建订阅时，你可以向 `newSubscription` 方法提供订阅的类型。类型可以是任何能够表示用户所发起订阅类型的字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()->newSubscription('swimming')
        ->price('price_swimming_monthly')
        ->create($request->paymentMethodId);

    // ...
});
```

在本例中，我们为客户开通了月度游泳订阅。不过，客户日后可能想切换到年度订阅。调整客户的订阅时，我们只需在 `swimming` 订阅上切换价格即可：

```php
$user->subscription('swimming')->swap('price_swimming_yearly');
```

当然，你也可以完全取消该订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="usage-based-billing"></a>
### 基于用量的计费

[基于用量的计费](https://stripe.com/docs/billing/subscriptions/metered-billing)允许你根据客户在一个计费周期内的产品用量向其收费。例如，你可以根据客户每月发送的短信或邮件数量来收费。

要开始使用用量计费，你首先需要在 Stripe 控制面板中创建一个采用[基于用量的计费模型](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide)和[计量器](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage#configure-meter)的新产品。创建计量器后，请存储其关联的事件名称和计量器 ID，你在上报和获取用量时会用到它们。然后，使用 `meteredPrice` 方法把计量价格 ID 添加到客户订阅中：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default')
        ->meteredPrice('price_metered')
        ->create($request->paymentMethodId);

    // ...
});
```

你也可以通过 [Stripe Checkout](#checkout) 开始一个计量订阅：

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
#### 上报用量

当客户使用你的应用时，你需要把其用量上报给 Stripe，以便准确计费。要上报某个计量事件的用量，可以使用 `Billable` 模型上的 `reportMeterEvent` 方法：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent');
```

默认情况下，会为计费周期添加 1 个单位的"用量"。此外，你也可以传入特定的"用量"数值，增加到客户本计费周期的用量中：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent', quantity: 15);
```

要获取客户某个计量器的事件摘要，可以使用 `Billable` 实例的 `meterEventSummaries` 方法：

```php
$user = User::find(1);

$meterUsage = $user->meterEventSummaries($meterId);

$meterUsage->first()->aggregated_value // 10
```

有关计量事件摘要的更多信息，请查阅 Stripe 的 [Meter Event Summary 对象文档](https://docs.stripe.com/api/billing/meter-event_summary/object)。

要[列出所有计量器](https://docs.stripe.com/api/billing/meter/list)，可以使用 `Billable` 实例的 `meters` 方法：

```php
$user = User::find(1);

$user->meters();
```

<a name="subscription-taxes"></a>
### 订阅税费

> [!WARNING]
> 你可以[使用 Stripe Tax 自动计算税费](#tax-configuration)，而无须手动计算税率。

要指定用户在订阅上支付的税率，你应当在可计费模型上实现 `taxRates` 方法，并返回一个包含 Stripe 税率 ID 的数组。你可以在 [Stripe 控制面板](https://dashboard.stripe.com/test/tax-rates)中定义这些税率：

```php
/**
 * 应用于客户订阅的税率。
 *
 * @return array<int, string>
 */
public function taxRates(): array
{
    return ['txr_id'];
}
```

`taxRates` 方法让你能够逐个客户地应用税率，这对于跨越多个国家和税率的用户群体很有帮助。

如果你提供的是多产品订阅，可以通过在可计费模型上实现 `priceTaxRates` 方法，为每个价格定义不同的税率：

```php
/**
 * 应用于客户订阅的税率。
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
> `taxRates` 方法只适用于订阅收费。如果你使用 Cashier 进行"一次性"收费，则需要在那时手动指定税率。

<a name="syncing-tax-rates"></a>
#### 同步税率

当 `taxRates` 方法返回的硬编码税率 ID 发生变化时，用户现有订阅上的税务设置将保持不变。如果想用新的 `taxRates` 值更新现有订阅的税率，你应当在用户的订阅实例上调用 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这也会同步多产品订阅的各项税率。如果你的应用提供多产品订阅，应当确保可计费模型实现了上文讨论的 `priceTaxRates` 方法。

<a name="tax-exemption"></a>
#### 税收豁免

Cashier 还提供了 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法，用于判断客户是否享受税收豁免。这些方法会调用 Stripe API 来确定客户的税收豁免状态：

```php
use App\Models\User;

$user = User::find(1);

$user->isTaxExempt();
$user->isNotTaxExempt();
$user->reverseChargeApplies();
```

> [!WARNING]
> 这些方法在任何 `Laravel\Cashier\Invoice` 对象上也可用。不过，在 `Invoice` 对象上调用时，这些方法判断的是发票创建时的豁免状态。

<a name="subscription-anchor-date"></a>
### 订阅锚定日期

默认情况下，计费周期锚点是订阅创建的日期；如果使用了试用期，则是试用结束的日期。如果想修改计费锚点日期，可以使用 `anchorBillingCycleOn` 方法：

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

有关管理订阅计费周期的更多信息，请查阅 [Stripe 计费周期文档](https://stripe.com/docs/billing/subscriptions/billing-cycle)。

<a name="cancelling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

订阅被取消时，Cashier 会自动设置 `subscriptions` 数据库表中的 `ends_at` 列。该列用于判断 `subscribed` 方法何时开始返回 `false`。

例如，如果客户在 3 月 1 日取消了原定于 3 月 5 日结束的订阅，`subscribed` 方法将在 3 月 5 日之前继续返回 `true`。这是因为通常允许用户继续使用应用，直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断用户是否已取消订阅但仍处于"宽限期"：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

如果想立即取消订阅，请在用户的订阅上调用 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

如果想立即取消订阅，并为所有尚未开票的计量用量以及新的 / 待处理的按比例计费发票项开票，请在用户的订阅上调用 `cancelNowAndInvoice` 方法：

```php
$user->subscription('default')->cancelNowAndInvoice();
```

你也可以选择在将来的某个特定时刻取消订阅：

```php
$user->subscription('default')->cancelAt(
    now()->plus(days: 10)
);
```

最后，在删除关联的用户模型之前，你应当始终先取消该用户的订阅：

```php
$user->subscription('default')->cancelNow();

$user->delete();
```

<a name="resuming-subscriptions"></a>
### 恢复订阅

如果客户取消了订阅而你想恢复它，可以在订阅上调用 `resume` 方法。客户必须仍处于"宽限期"内才能恢复订阅：

```php
$user->subscription('default')->resume();
```

如果客户取消了订阅，并在订阅完全到期之前恢复了它，客户不会被立即扣费。相反，其订阅会被重新激活，并按原来的计费周期计费。

<a name="subscription-trials"></a>
## 订阅试用期

<a name="with-payment-method-up-front"></a>
### 预收支付方式的试用

如果你想为客户提供试用期，同时又预先收集支付方式信息，应当在创建订阅时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', 'price_monthly')
        ->trialDays(10)
        ->create($request->paymentMethodId);

    // ...
});
```

该方法会在数据库的订阅记录上设置试用期结束日期，并指示 Stripe 在此日期之后才开始向客户计费。使用 `trialDays` 方法时，Cashier 会覆盖在 Stripe 中为该价格配置的任何默认试用期。

> [!WARNING]
> 如果客户的订阅在试用结束日期之前没有被取消，试用期一到期客户就会被扣费。因此，请务必将试用结束日期告知你的用户。

`trialUntil` 方法允许你提供一个指定试用期结束时间的 `DateTime` 实例：

```php
use Illuminate\Support\Carbon;

$user->newSubscription('default', 'price_monthly')
    ->trialUntil(Carbon::now()->plus(days: 10))
    ->create($paymentMethod);
```

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法来判断用户是否处于试用期内。下面两个例子是等价的：

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

要判断现有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

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

你可以选择在 Stripe 控制面板中定义价格享有多少试用天数，也可以始终通过 Cashier 显式传入。如果你选择在 Stripe 中定义价格的试用天数，请注意：新的订阅（包括过去曾有过订阅的客户新开的订阅）总是会获得试用期，除非你显式调用 `skipTrial()` 方法。

<a name="without-payment-method-up-front"></a>
### 不预收支付方式的试用

如果你想提供试用期而不预先收集用户的支付方式信息，可以把用户记录上的 `trial_ends_at` 列设置为你期望的试用结束日期。这通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
    'trial_ends_at' => now()->plus(days: 10),
]);
```

> [!WARNING]
> 请务必在可计费模型的类定义中为 `trial_ends_at` 属性添加[日期转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 把这类试用称为"通用试用"（generic trial），因为它没有附加到任何现有订阅上。如果当前日期没有超过 `trial_ends_at` 的值，可计费模型实例上的 `onTrial` 方法将返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

一旦准备好为用户创建实际订阅，你可以照常使用 `newSubscription` 方法：

```php
$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->create($paymentMethod);
```

要获取用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户处于试用期，该方法会返回一个 Carbon 日期实例；否则返回 `null`。如果想获取默认订阅以外的某个订阅的试用结束日期，还可以传入一个可选的订阅类型参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果你希望明确知道用户正处于"通用"试用期内，并且尚未创建实际订阅，也可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户正处于"通用"试用期内...
}
```

<a name="extending-trials"></a>
### 延长试用

`extendTrial` 方法允许你在订阅创建之后延长其试用期。如果试用已经过期，且客户已开始为该订阅付费，你仍然可以为其提供延长的试用期。试用期内已过的时间将从客户的下一张发票中扣除：

```php
use App\Models\User;

$subscription = User::find(1)->subscription('default');

// 从现在起 7 天后结束试用...
$subscription->extendTrial(
    now()->plus(days: 7)
);

// 为试用期额外增加 5 天...
$subscription->extendTrial(
    $subscription->trial_ends_at->plus(days: 5)
);
```

<a name="handling-stripe-webhooks"></a>
## 处理 Stripe Webhook

> [!NOTE]
> 在本地开发期间，你可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 来帮助测试 webhook。

Stripe 可以通过 webhook 把各种事件通知给你的应用。默认情况下，一个指向 Cashier webhook 控制器的路由会由 Cashier 的服务提供者（Service Provider）自动注册。该控制器会处理所有传入的 webhook 请求。

默认情况下，Cashier 的 webhook 控制器会自动处理因扣费失败次数过多而取消订阅（由你的 Stripe 设置定义）、客户更新、客户删除、订阅更新以及支付方式变更；不过，正如我们即将看到的，你可以扩展该控制器来处理任何你想要的 Stripe webhook 事件。

要确保应用能够处理 Stripe webhook，请务必在 Stripe 控制面板中配置 webhook URL。默认情况下，Cashier 的 webhook 控制器响应 `/stripe/webhook` URL 路径。你应当在 Stripe 控制面板中启用的全部 webhook 列表如下：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为了方便，Cashier 内置了 `cashier:webhook` Artisan 命令。该命令会在 Stripe 中创建一个 webhook，监听 Cashier 需要的所有事件：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 webhook 将指向由 `APP_URL` 环境变量定义的 URL 和 Cashier 附带的 `cashier.webhook` 路由。如果想使用其他 URL，可以在调用该命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 webhook 将使用你的 Cashier 版本所兼容的 Stripe API 版本。如果想使用其他 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，webhook 会立即生效。如果你想创建 webhook 但暂时禁用它、直到准备就绪，可以在调用该命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> [!WARNING]
> 请务必使用 Cashier 内置的 [webhook 签名验证](#verifying-webhook-signatures)中间件来保护传入的 Stripe webhook 请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 防护

由于 Stripe webhook 需要绕过 Laravel 的 [CSRF 防护](/docs/{{version}}/csrf)，你应当确保 Laravel 不会尝试验证传入 Stripe webhook 的 CSRF 令牌。为此，你应当在应用的 `bootstrap/app.php` 文件中把 `stripe/*` 排除在 CSRF 防护之外：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
    ]);
})
```

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理因扣费失败而取消订阅以及其他常见的 Stripe webhook 事件。不过，如果你还有其他想要处理的 webhook 事件，可以通过监听 Cashier 派发的以下事件来完成：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe webhook 的完整有效载荷。例如，如果你想处理 `invoice.payment_succeeded` webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners)来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * 处理收到的 Stripe webhook。
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

为了保护你的 webhook，你可以使用 [Stripe 的 webhook 签名](https://stripe.com/docs/webhooks/signatures)。为了方便，Cashier 自动内置了一个中间件，用于验证传入的 Stripe webhook 请求是否有效。

要启用 webhook 验证，请确保在应用的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。webhook `secret` 可以从你的 Stripe 账户控制面板获取。

<a name="single-charges"></a>
## 单次收费

<a name="simple-charge"></a>
### 简单收费

如果想对客户进行一次性收费，可以使用可计费模型实例上的 `charge` 方法。你需要把[支付方式标识符](#payment-methods-for-single-charges)作为 `charge` 方法的第二个参数传入：

```php
use Illuminate\Http\Request;

Route::post('/purchase', function (Request $request) {
    $stripeCharge = $request->user()->charge(
        100, $request->paymentMethodId
    );

    // ...
});
```

`charge` 方法接受一个数组作为第三个参数，让你可以向底层 Stripe 收费创建传递任何想要的选项。有关创建收费时可用的选项的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/api/charges/create)：

```php
$user->charge(100, $paymentMethod, [
    'custom_option' => $value,
]);
```

你也可以在没有底层客户或用户的情况下使用 `charge` 方法。为此，在应用可计费模型的新实例上调用 `charge` 方法即可：

```php
use App\Models\User;

$stripeCharge = (new User)->charge(100, $paymentMethod);
```

如果收费失败，`charge` 方法会抛出异常。如果收费成功，该方法会返回一个 `Laravel\Cashier\Payment` 实例：

```php
try {
    $payment = $user->charge(100, $paymentMethod);
} catch (Exception $e) {
    // ...
}
```

> [!WARNING]
> `charge` 方法接受以应用所用货币最小单位表示的支付金额。例如，如果客户以美元支付，金额应当以美分为单位指定。

<a name="charge-with-invoice"></a>
### 带发票的收费

有时你可能需要进行一次性收费，并向客户提供 PDF 发票。`invoicePrice` 方法正好可以做到这一点。例如，让我们为客户就五件新 T 恤开票：

```php
$user->invoicePrice('price_tshirt', 5);
```

发票将立即向用户的默认支付方式收费。`invoicePrice` 方法也接受一个数组作为第三个参数。该数组包含发票项的计费选项。该方法接受的第四个参数同样是一个数组，其中应当包含发票本身的计费选项：

```php
$user->invoicePrice('price_tshirt', 5, [
    'discounts' => [
        ['coupon' => 'SUMMER21SALE']
    ],
], [
    'default_tax_rates' => ['txr_id'],
]);
```

与 `invoicePrice` 类似，你可以使用 `tabPrice` 方法，通过把多个项目（每张发票最多 250 项）添加到客户的"待结账单"（tab）再向客户开票，从而实现多项目的一次性收费。例如，我们可以就五件 T 恤和两个马克杯向客户开票：

```php
$user->tabPrice('price_tshirt', 5);
$user->tabPrice('price_mug', 2);
$user->invoice();
```

此外，你也可以使用 `invoiceFor` 方法对客户的默认支付方式进行"一次性"收费：

```php
$user->invoiceFor('One Time Fee', 500);
```

虽然 `invoiceFor` 方法可以使用，但我们还是建议你使用 `invoicePrice` 和 `tabPrice` 方法配合预定义的价格。这样，你在 Stripe 控制面板中就能获得更好的按产品维度的销售分析和数据。

> [!WARNING]
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法创建的 Stripe 发票会对失败的扣费进行重试。如果你不希望发票重试失败的扣费，需要在第一次扣费失败后使用 Stripe API 关闭它。

<a name="creating-payment-intents"></a>
### 创建 Payment Intent

你可以通过在可计费模型实例上调用 `pay` 方法来创建新的 Stripe payment intent。调用该方法会创建一个包装在 `Laravel\Cashier\Payment` 实例中的 payment intent：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->pay(
        $request->get('amount')
    );

    return $payment->client_secret;
});
```

创建 payment intent 之后，你可以把 client secret 返回给应用前端，让用户在浏览器中完成支付。要进一步了解如何使用 Stripe payment intent 构建完整的支付流程，请查阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，客户可以使用在你的 Stripe 控制面板中启用的默认支付方式。此外，如果你只想允许使用某些特定的支付方式，可以使用 `payWith` 方法：

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
> `pay` 和 `payWith` 方法接受以应用所用货币最小单位表示的支付金额。例如，如果客户以美元支付，金额应当以美分为单位指定。

<a name="refunding-charges"></a>
### 退款

如果需要退还某笔 Stripe 收费，可以使用 `refund` 方法。该方法接受 Stripe [payment intent ID](#payment-methods-for-single-charges) 作为第一个参数：

```php
$payment = $user->charge(100, $paymentMethodId);

$user->refund($payment->id);
```

<a name="invoices"></a>
## 发票

<a name="retrieving-invoices"></a>
### 检索发票

你可以使用 `invoices` 方法轻松获取可计费模型的发票数组。`invoices` 方法返回一个由 `Laravel\Cashier\Invoice` 实例组成的集合：

```php
$invoices = $user->invoices();
```

如果想在结果中包含待处理的发票，可以使用 `invoicesIncludingPending` 方法：

```php
$invoices = $user->invoicesIncludingPending();
```

你可以使用 `findInvoice` 方法通过 ID 获取特定的发票：

```php
$invoice = $user->findInvoice($invoiceId);
```

<a name="displaying-invoice-information"></a>
#### 展示发票信息

在为客户列出发票时，你可以使用发票的方法来展示相关的发票信息。例如，你可能希望用表格列出每张发票，让用户可以轻松下载任意一张：

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

要获取客户即将到来的发票，可以使用 `upcomingInvoice` 方法：

```php
$invoice = $user->upcomingInvoice();
```

同样，如果客户有多个订阅，你也可以获取特定订阅即将到来的发票：

```php
$invoice = $user->subscription('default')->upcomingInvoice();
```

<a name="previewing-subscription-invoices"></a>
### 预览订阅发票

使用 `previewInvoice` 方法，你可以在变更价格之前预览发票。这让你能够了解进行某项价格变更后，客户的发票会是什么样子：

```php
$invoice = $user->subscription('default')->previewInvoice('price_yearly');
```

你可以向 `previewInvoice` 方法传入一个价格数组，以预览带有多个新价格的发票：

```php
$invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);
```

<a name="generating-invoice-pdfs"></a>
### 生成发票 PDF

在生成发票 PDF 之前，你应当使用 Composer 安装 Dompdf 库，它是 Cashier 的默认发票渲染器：

```shell
composer require dompdf/dompdf
```

在路由或控制器中，你可以使用 `downloadInvoice` 方法生成给定发票的 PDF 下载。该方法会自动生成下载发票所需的正确 HTTP 响应：

```php
use Illuminate\Http\Request;

Route::get('/user/invoice/{invoice}', function (Request $request, string $invoiceId) {
    return $request->user()->downloadInvoice($invoiceId);
});
```

默认情况下，发票上的所有数据都派生自 Stripe 中存储的客户和发票数据。文件名基于你的 `app.name` 配置值。不过，你可以通过向 `downloadInvoice` 方法提供一个数组作为第二个参数来自定义其中的部分数据。该数组允许你自定义公司和产品详情等信息：

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

`downloadInvoice` 方法还允许通过其第三个参数指定自定义文件名。该文件名会自动添加 `.pdf` 后缀：

```php
return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');
```

<a name="custom-invoice-render"></a>
#### 自定义发票渲染器

Cashier 还支持使用自定义的发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，它利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库来生成 Cashier 的发票。不过，你可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口来使用任何你想要的渲染器。例如，你可能希望通过调用第三方 PDF 渲染服务的 API 来渲染发票 PDF：

```php
use Illuminate\Support\Facades\Http;
use Laravel\Cashier\Contracts\InvoiceRenderer;
use Laravel\Cashier\Invoice;

class ApiInvoiceRenderer implements InvoiceRenderer
{
    /**
     * 渲染给定发票并返回原始 PDF 字节。
     */
    public function render(Invoice $invoice, array $data = [], array $options = []): string
    {
        $html = $invoice->view($data)->render();

        return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
    }
}
```

实现发票渲染器契约之后，你应当更新应用 `config/cashier.php` 配置文件中的 `cashier.invoices.renderer` 配置值。该配置值应当设置为你的自定义渲染器实现的类名。

<a name="checkout"></a>
## Checkout

Cashier Stripe 还支持 [Stripe Checkout](https://stripe.com/payments/checkout)。Stripe Checkout 提供了一个预构建的托管支付页面，免去了实现自定义收款页面的痛苦。

以下文档包含如何开始配合 Cashier 使用 Stripe Checkout 的信息。要进一步了解 Stripe Checkout，你也应当阅读 [Stripe 自身的 Checkout 文档](https://stripe.com/docs/payments/checkout)。

<a name="product-checkouts"></a>
### 产品结账

你可以使用可计费模型上的 `checkout` 方法，对在 Stripe 控制面板中创建的现有产品进行结账。`checkout` 方法会发起一个新的 Stripe Checkout 会话。默认情况下，你必须传入一个 Stripe 价格 ID：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout('price_tshirt');
});
```

必要时，你也可以指定产品数量：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 15]);
});
```

当客户访问该路由时，他们会被重定向到 Stripe 的 Checkout 页面。默认情况下，用户成功完成或取消购买后会被重定向到你的 `home` 路由位置，但你也可以使用 `success_url` 和 `cancel_url` 选项指定自定义的回调 URL：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

定义 `success_url` 结账选项时，你可以指示 Stripe 在调用你的 URL 时，把结账会话 ID 作为查询字符串参数添加进去。为此，请把字面字符串 `{CHECKOUT_SESSION_ID}` 添加到你的 `success_url` 查询字符串中。Stripe 会把该占位符替换为实际的结账会话 ID：

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

默认情况下，Stripe Checkout 不允许使用[用户可兑换的促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。好在，有一个简单的方法可以为你的 Checkout 页面启用它们。为此，你可以调用 `allowPromotionCodes` 方法：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()
        ->allowPromotionCodes()
        ->checkout('price_tshirt');
});
```

<a name="single-charge-checkouts"></a>
### 单次收费结账

你还可以对尚未在 Stripe 控制面板中创建的临时产品进行简单收费。为此，你可以在可计费模型上使用 `checkoutCharge` 方法，并向其传入收费金额、产品名称和可选的数量。当客户访问该路由时，他们会被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/charge-checkout', function (Request $request) {
    return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
});
```

> [!WARNING]
> 使用 `checkoutCharge` 方法时，Stripe 总是会在你的 Stripe 控制面板中创建一个新产品和价格。因此，我们建议你提前在 Stripe 控制面板中创建好产品，并改用 `checkout` 方法。

<a name="subscription-checkouts"></a>
### 订阅结账

> [!WARNING]
> 在订阅场景使用 Stripe Checkout，需要你在 Stripe 控制面板中启用 `customer.subscription.created` webhook。该 webhook 会在你的数据库中创建订阅记录，并存储所有相关的订阅项。

你也可以使用 Stripe Checkout 来发起订阅。使用 Cashier 的订阅构建器方法定义好订阅之后，你可以调用 `checkout` 方法。当客户访问该路由时，他们会被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout();
});
```

与产品结账一样，你可以自定义成功和取消 URL：

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
> 遗憾的是，Stripe Checkout 在发起订阅时并不支持所有订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例计费行为或支付行为，在 Stripe Checkout 会话期间都不会生效。请查阅 [Stripe Checkout Session API 文档](https://stripe.com/docs/api/checkout/sessions/create)以了解可用的参数。

<a name="stripe-checkout-trial-periods"></a>
#### Stripe Checkout 与试用期

当然，在构建将通过 Stripe Checkout 完成的订阅时，你可以定义试用期：

```php
$checkout = Auth::user()->newSubscription('default', 'price_monthly')
    ->trialDays(3)
    ->checkout();
```

不过，试用期必须至少为 48 小时，这是 Stripe Checkout 支持的最短试用时长。

<a name="stripe-checkout-subscriptions-and-webhooks"></a>
#### 订阅与 Webhook

请记住，Stripe 和 Cashier 都是通过 webhook 更新订阅状态的，因此当客户输入支付信息后返回应用时，订阅可能尚未生效。为了处理这种情况，你可以显示一条消息，告知用户其支付或订阅正在等待处理。

<a name="collecting-tax-ids"></a>
### 收集税号

Checkout 还支持收集客户的税号。要在结账会话中启用此功能，请在创建会话时调用 `collectTaxIds` 方法：

```php
$checkout = $user->collectTaxIds()->checkout('price_tshirt');
```

调用该方法后，客户将看到一个新增的复选框，让他们可以表明自己是否以公司身份购买。如果是，他们就有机会填写自己的税号。

> [!WARNING]
> 如果你已经在应用的服务提供者中配置了[自动税费收集](#tax-configuration)，该功能将自动启用，无需调用 `collectTaxIds` 方法。

<a name="guest-checkouts"></a>
### 访客结账

使用 `Checkout::guest` 方法，你可以为没有"账户"的应用访客发起结账会话：

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

与为现有用户创建结账会话类似，你可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上的其他方法来自定义访客结账会话：

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

访客结账完成后，Stripe 可以派发 `checkout.session.completed` webhook 事件，因此请务必[配置你的 Stripe webhook](https://dashboard.stripe.com/webhooks)，使其真正把该事件发送到你的应用。在 Stripe 控制面板中启用该 webhook 后，你可以[使用 Cashier 处理该 webhook](#handling-stripe-webhooks)。webhook 有效载荷中包含的对象是一个 [checkout 对象](https://stripe.com/docs/api/checkout/sessions/object)，你可以检查它来完成客户的订单。

<a name="handling-failed-payments"></a>
## 处理支付失败

有时，订阅或单次收费的支付可能会失败。发生这种情况时，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你出现了这一情况。捕获该异常后，你有两种处理方式。

第一，你可以把客户重定向到 Cashier 内置的专门支付确认页面。该页面已经有一个通过 Cashier 的服务提供者注册的命名路由。因此，你可以捕获 `IncompletePayment` 异常，并把用户重定向到支付确认页面：

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

在支付确认页面上，系统会提示客户重新输入信用卡信息，并执行 Stripe 要求的任何附加操作，例如"3D Secure"确认。确认支付之后，用户会被重定向到上面 `redirect` 参数指定的 URL。重定向时，`message`（字符串）和 `success`（整数）查询字符串变量会被添加到该 URL 上。支付页面目前支持以下支付方式类型：

- 信用卡
- Alipay
- Bancontact
- BECS Direct Debit
- EPS
- Giropay
- iDEAL
- SEPA Direct Debit

第二，你也可以让 Stripe 代为处理支付确认。这种情况下，你可以不重定向到支付确认页面，而是在 Stripe 控制面板中[设置 Stripe 的自动账单邮件](https://dashboard.stripe.com/account/billing/automatic)。不过，如果捕获到了 `IncompletePayment` 异常，你仍应告知用户他们将收到一封包含后续支付确认说明的邮件。

在使用 `Billable` Trait 的模型上，`charge`、`invoiceFor` 和 `invoice` 方法可能抛出支付异常。与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法，以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法，都可能抛出未完成支付的异常。

判断现有订阅是否存在未完成的付款，可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

你可以通过检查异常实例上的 `payment` 属性，来获取未完成支付的具体状态：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $user->charge(1000, 'pm_card_threeDSecure2Required');
} catch (IncompletePayment $exception) {
    // 获取 payment intent 状态...
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

某些支付方式需要额外的数据才能确认支付。例如，SEPA 支付方式在支付过程中需要额外的"扣款授权"（mandate）数据。你可以使用 `withPaymentConfirmationOptions` 方法把这些数据提供给 Cashier：

```php
$subscription->withPaymentConfirmationOptions([
    'mandate_data' => '...',
])->swap('price_xxx');
```

你可以查阅 [Stripe API 文档](https://stripe.com/docs/api/payment_intents/confirm)，了解确认支付时所接受的全部选项。

<a name="strong-customer-authentication"></a>
## 强客户认证

如果你的企业或你的某个客户位于欧洲，你将需要遵守欧盟的强客户认证（SCA）法规。这些法规由欧盟于 2019 年 9 月颁布，旨在防止支付欺诈。好在，Stripe 和 Cashier 已经为构建符合 SCA 要求的应用做好了准备。

> [!WARNING]
> 在开始之前，请阅读 [Stripe 关于 PSD2 与 SCA 的指南](https://stripe.com/guides/strong-customer-authentication)以及他们关于[新 SCA API 的文档](https://stripe.com/docs/strong-customer-authentication)。

<a name="payments-requiring-additional-confirmation"></a>
### 需要额外确认的支付

SCA 法规通常要求进行额外的验证才能确认和处理支付。发生这种情况时，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你需要额外的验证。有关如何处理这些异常的更多信息，请查阅[处理支付失败](#handling-failed-payments)的文档。

由 Stripe 或 Cashier 呈现的支付确认界面可能会适配特定银行或发卡机构的支付流程，并可能包含额外的卡片确认、一笔临时的小额扣费、独立的设备认证或其他形式的验证。

<a name="incomplete-and-past-due-state"></a>
#### 未完成与逾期状态

当某笔支付需要额外确认时，订阅将保持 `incomplete` 或 `past_due` 状态，如其 `stripe_status` 数据库列所示。一旦支付确认完成，并且 Stripe 通过 webhook 通知你的应用，Cashier 就会自动激活客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参阅[我们关于这些状态的补充文档](#incomplete-and-past-due-status)。

<a name="off-session-payment-notifications"></a>
### 非会话支付通知

由于 SCA 法规要求客户即使在订阅有效期间，也要不时验证其支付信息，Cashier 可以在需要进行非会话（off-session）支付确认时向客户发送通知。例如，这可能发生在订阅续期时。通过把 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为一个通知类，即可启用 Cashier 的支付通知。默认情况下，该通知处于禁用状态。当然，Cashier 内置了一个可用于此目的的通知类，但你也可以根据需要提供自己的通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为确保非会话支付确认通知能够送达，请验证你的应用已[配置好 Stripe webhook](#handling-stripe-webhooks)，并且已在 Stripe 控制面板中启用 `invoice.payment_action_required` webhook。此外，你的 `Billable` 模型还应当使用 Laravel 的 `Illuminate\Notifications\Notifiable` Trait。

> [!WARNING]
> 即使客户是在手动进行需要额外确认的支付，通知也会被发送。遗憾的是，Stripe 无法得知该支付是手动进行的还是"非会话"的。不过，如果客户在确认支付之后访问支付页面，只会看到一条"支付成功"的消息。客户不会意外地对同一笔支付确认两次，也不会产生意外的二次扣费。

<a name="stripe-sdk"></a>
## Stripe SDK

Cashier 的许多对象都是对 Stripe SDK 对象的包装。如果你想直接与 Stripe 对象交互，可以使用 `asStripe` 方法便捷地获取它们：

```php
$stripeSubscription = $subscription->asStripeSubscription();

$stripeSubscription->application_fee_percent = 5;

$stripeSubscription->save();
```

你也可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

```php
$subscription->updateStripeSubscription(['application_fee_percent' => 5]);
```

如果你想直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，你可以使用该方法访问 `StripeClient` 实例，并从你的 Stripe 账户获取价格列表：

```php
use Laravel\Cashier\Cashier;

$prices = Cashier::stripe()->prices->all();
```

<a name="testing"></a>
## 测试

测试使用 Cashier 的应用时，你可以模拟发往 Stripe API 的实际 HTTP 请求；不过，这需要你部分重新实现 Cashier 自身的行为。因此，我们建议允许你的测试访问真实的 Stripe API。虽然这样速度较慢，但它能让你更加确信应用按预期工作，而且你可以把较慢的测试放到单独的 Pest / PHPUnit 测试组中。

测试时请记住，Cashier 本身已经拥有出色的测试套件，因此你应当只专注于测试自己应用的订阅和支付流程，而不是 Cashier 的每一个底层行为。

首先，把**测试**版本的 Stripe 密钥添加到你的 `phpunit.xml` 文件中：

```xml
<env name="STRIPE_SECRET" value="sk_test_<your-key>"/>
```

现在，测试期间与 Cashier 交互时，它会向你的 Stripe 测试环境发送真实的 API 请求。为了方便，你应当在自己的 Stripe 测试账户中预先填充测试时可用的订阅 / 价格。

> [!NOTE]
> 为了测试各种计费场景，例如信用卡拒付和失败，你可以使用 Stripe 提供的大量[测试卡号和令牌](https://stripe.com/docs/testing)。
