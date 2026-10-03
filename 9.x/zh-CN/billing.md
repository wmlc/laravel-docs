# Laravel Cashier (Stripe)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [数据库迁移](#database-migrations)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [货币配置](#currency-configuration)
    - [税务配置](#tax-configuration)
    - [日志](#logging)
    - [使用自定义模型](#using-custom-models)
- [客户](#customers)
    - [获取客户](#retrieving-customers)
    - [创建客户](#creating-customers)
    - [更新客户](#updating-customers)
    - [余额](#balances)
    - [税号](#tax-ids)
    - [与 Stripe 同步客户数据](#syncing-customer-data-with-stripe)
    - [账单面板](#billing-portal)
- [支付方式](#payment-methods)
    - [存储支付方式](#storing-payment-methods)
    - [获取支付方式](#retrieving-payment-methods)
    - [判断用户是否拥有支付方式](#check-for-a-payment-method)
    - [更新默认支付方式](#updating-the-default-payment-method)
    - [添加支付方式](#adding-payment-methods)
    - [删除支付方式](#deleting-payment-methods)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [切换价格](#changing-prices)
    - [订阅数量](#subscription-quantity)
    - [多产品订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [计量计费](#metered-billing)
    - [订阅税费](#subscription-taxes)
    - [订阅锚定日期](#subscription-anchor-date)
    - [取消订阅](#cancelling-subscriptions)
    - [恢复订阅](#resuming-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先提供支付方式](#with-payment-method-up-front)
    - [不预先提供支付方式](#without-payment-method-up-front)
    - [延长试用](#extending-trials)
- [处理 Stripe Webhook](#handling-stripe-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [简单收费](#simple-charge)
    - [带发票收费](#charge-with-invoice)
    - [创建支付意图](#creating-payment-intents)
    - [退还费用](#refunding-charges)
- [Checkout](#checkout)
    - [产品结账](#product-checkouts)
    - [单次收费结账](#single-charge-checkouts)
    - [订阅结账](#subscription-checkouts)
    - [收集税号](#collecting-tax-ids)
    - [游客结账](#guest-checkouts)
- [发票](#invoices)
    - [获取发票](#retrieving-invoices)
    - [即将到期的发票](#upcoming-invoices)
    - [预览订阅发票](#previewing-subscription-invoices)
    - [生成发票 PDF](#generating-invoice-pdfs)
- [处理支付失败](#handling-failed-payments)
- [强客户认证（SCA）](#strong-customer-authentication)
    - [需要额外确认的支付](#payments-requiring-additional-confirmation)
    - [非会话支付通知](#off-session-payment-notifications)
- [Stripe SDK](#stripe-sdk)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe](https://stripe.com) 的订阅计费服务提供了一个富有表现力、流畅的接口。它几乎能处理所有你不想亲手编写的样板订阅计费代码。除了基本的订阅管理之外，Cashier 还能处理优惠券、切换订阅、订阅"数量"、取消宽限期，甚至生成发票 PDF。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，请务必仔细阅读[升级指南](https://github.com/laravel/cashier-stripe/blob/master/UPGRADE.md)。

> **Warning**  
> 为防止破坏性变更，Cashier 使用固定的 Stripe API 版本。Cashier 14 使用 Stripe API 版本 `2022-11-15`。Stripe API 版本会在次要版本中更新，以便使用新的 Stripe 特性和改进。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Stripe 的 Cashier 包：

```shell
composer require laravel/cashier
```

> **Warning**  
> 为确保 Cashier 正确处理所有 Stripe 事件，请记得[设置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

<a name="database-migrations"></a>
### 数据库迁移

Cashier 的服务提供者（Service Provider）会注册自己的数据库迁移目录，因此安装包后请记得执行数据库迁移。Cashier 的迁移会在 `users` 表中新增若干列，并创建一个新的 `subscriptions` 表来保存所有客户的订阅：

```shell
php artisan migrate
```

如果需要覆盖 Cashier 自带的迁移，可以使用 `vendor:publish` Artisan 命令发布它们：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

如果希望完全阻止 Cashier 的迁移运行，可以使用 Cashier 提供的 `ignoreMigrations` 方法。通常，该方法应在 `AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Cashier\Cashier;

/**
 * 注册应用服务。
 *
 * @return void
 */
public function register()
{
    Cashier::ignoreMigrations();
}
```

> **Warning**  
> Stripe 建议任何用于存储 Stripe 标识符的列都应区分大小写。因此，使用 MySQL 时应将 `stripe_id` 列的排序规则设置为 `utf8_bin`。更多信息请参阅 [Stripe 文档](https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible)。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

使用 Cashier 之前，需要在可计费模型定义中添加 `Billable` Trait。通常该模型是 `App\Models\User`。此 Trait 提供了多种方法，用于执行常见的计费任务，如创建订阅、应用优惠券和更新支付方式信息：

```php
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

Cashier 假定可计费模型是 Laravel 自带的 `App\Models\User` 类。如需更改，可以通过 `useCustomerModel` 方法指定其他模型。该方法通常应在 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use App\Models\Cashier\User;
use Laravel\Cashier\Cashier;

/**
 * 引导应用服务。
 *
 * @return void
 */
public function boot()
{
    Cashier::useCustomerModel(User::class);
}
```

> **Warning**  
> 如果使用的不是 Laravel 自带的 `App\Models\User` 模型，则需要发布并修改 [Cashier 迁移](#installation)，使其与替代模型的表名匹配。

<a name="api-keys"></a>
### API 密钥

接下来，应在应用的 `.env` 文件中配置 Stripe API 密钥。可以从 Stripe 控制面板获取 Stripe API 密钥：

```ini
STRIPE_KEY=your-stripe-key
STRIPE_SECRET=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

> **Warning**  
> 应确保应用的 `.env` 文件中定义了 `STRIPE_WEBHOOK_SECRET` 环境变量，该变量用于确保传入的 Webhook 确实来自 Stripe。

<a name="currency-configuration"></a>
### 货币配置

Cashier 默认货币为美元（USD）。可以通过在应用的 `.env` 文件中设置 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=eur
```

除了配置 Cashier 的货币外，还可以指定用于在发票上格式化显示金额的区域设置。Cashier 内部使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php) 来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> **Warning**  
> 要使用 `en` 以外的区域设置，请确保服务器上已安装并配置了 `ext-intl` PHP 扩展。

<a name="tax-configuration"></a>
### 税务配置

借助 [Stripe Tax](https://stripe.com/tax)，可以为 Stripe 生成的所有发票自动计算税费。在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法即可启用自动税务计算：

```php
use Laravel\Cashier\Cashier;

/**
 * 引导应用服务。
 *
 * @return void
 */
public function boot()
{
    Cashier::calculateTaxes();
}
```

启用税务计算后，任何新订阅和任何一次性生成的发票都会进行自动税务计算。

为使此功能正常工作，客户的账单详情（如客户姓名、地址和税号）需要同步到 Stripe。可以使用 Cashier 提供的[客户数据同步](#syncing-customer-data-with-stripe)和[税号](#tax-ids)方法来完成。

> **Warning**  
> [单次收费](#single-charges)或[单次收费结账](#single-charge-checkouts)不计算税费。

<a name="logging"></a>
### 日志

Cashier 允许指定记录致命 Stripe 错误时所用的日志通道。可以在应用的 `.env` 文件中定义 `CASHIER_LOGGER` 环境变量来指定日志通道：

```ini
CASHIER_LOGGER=stack
```

调用 Stripe API 时产生的异常会通过应用的默认日志通道记录。

<a name="using-custom-models"></a>
### 使用自定义模型

可以定义自己的模型并继承相应的 Cashier 模型，从而扩展 Cashier 内部使用的模型：

```php
use Laravel\Cashier\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义模型后，可以通过 `Laravel\Cashier\Cashier` 类指示 Cashier 使用自定义模型。通常，应在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\SubscriptionItem;

/**
 * 引导应用服务。
 *
 * @return void
 */
public function boot()
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useSubscriptionItemModel(SubscriptionItem::class);
}
```

<a name="customers"></a>
## 客户

<a name="retrieving-customers"></a>
### 获取客户

可以通过 Stripe ID 使用 `Cashier::findBillable` 方法获取客户。该方法会返回可计费模型的实例：

```php
use Laravel\Cashier\Cashier;

$user = Cashier::findBillable($stripeId);
```

<a name="creating-customers"></a>
### 创建客户

有时可能希望在不开始订阅的情况下创建 Stripe 客户。可以使用 `createAsStripeCustomer` 方法完成：

```php
$stripeCustomer = $user->createAsStripeCustomer();
```

在 Stripe 中创建客户后，可以在稍后开始订阅。可以提供可选的 `$options` 数组，传入 [Stripe API 支持的任何其他客户创建参数](https://stripe.com/docs/api/customers/create)：

```php
$stripeCustomer = $user->createAsStripeCustomer($options);
```

如果希望返回可计费模型的 Stripe 客户对象，可以使用 `asStripeCustomer` 方法：

```php
$stripeCustomer = $user->asStripeCustomer();
```

如果希望获取给定可计费模型的 Stripe 客户对象，但不确定该模型是否已是 Stripe 中的客户，可以使用 `createOrGetStripeCustomer` 方法。如果客户不存在，该方法会在 Stripe 中创建新客户：

```php
$stripeCustomer = $user->createOrGetStripeCustomer();
```

<a name="updating-customers"></a>
### 更新客户

有时可能希望直接用附加信息更新 Stripe 客户。可以使用 `updateStripeCustomer` 方法完成。该方法接受 [Stripe API 支持的客户更新选项](https://stripe.com/docs/api/customers/update)数组：

```php
$stripeCustomer = $user->updateStripeCustomer($options);
```

<a name="balances"></a>
### 余额

Stripe 允许对客户的"余额"进行充值或扣款。随后，该余额会在新发票中贷记或借记。要查看客户总余额，可以使用可计费模型上的 `balance` 方法。`balance` 方法会返回以客户货币表示的余额格式化字符串：

```php
$balance = $user->balance();
```

要充值客户余额，可以向 `creditBalance` 方法提供数值。如有需要，还可以提供描述：

```php
$user->creditBalance(500, 'Premium customer top-up.');
```

向 `debitBalance` 方法提供数值会扣减客户余额：

```php
$user->debitBalance(300, 'Bad usage penalty.');
```

`applyBalance` 方法会为客户创建新的余额交易记录。可以使用 `balanceTransactions` 方法获取这些交易记录，便于为客户提供贷记和借记日志以供审查：

```php
// 获取所有交易...
$transactions = $user->balanceTransactions();

foreach ($transactions as $transaction) {
    // 交易金额...
    $amount = $transaction->amount(); // $2.31

    // 在可用时获取相关发票...
    $invoice = $transaction->invoice();
}
```

<a name="tax-ids"></a>
### 税号

Cashier 提供了简便的方式来管理客户税号。例如，可以使用 `taxIds` 方法以集合形式获取分配给客户的所有[税号](https://stripe.com/docs/api/customer_tax_ids/object)：

```php
$taxIds = $user->taxIds();
```

还可以通过标识符获取客户的特定税号：

```php
$taxId = $user->findTaxId('txi_belgium');
```

可以通过向 `createTaxId` 方法提供有效的[类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type)和值来创建新税号：

```php
$taxId = $user->createTaxId('eu_vat', 'BE0123456789');
```

`createTaxId` 方法会立即将 VAT 号添加到客户账户。[VAT 号的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；但这是一个异步过程。可以通过订阅 `customer.tax_id.updated` Webhook 事件并检查 [VAT 号的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification)来接收验证更新通知。有关处理 Webhook 的更多信息，请参阅[定义 Webhook 处理器的文档](#handling-stripe-webhooks)。

可以使用 `deleteTaxId` 方法删除税号：

```php
$user->deleteTaxId('txi_belgium');
```

<a name="syncing-customer-data-with-stripe"></a>
### 与 Stripe 同步客户数据

通常，当应用的用户更新其姓名、电子邮件地址或其他也存储在 Stripe 中的信息时，应通知 Stripe 这些更新。这样 Stripe 中的信息副本就会与应用保持同步。

为此，可以在可计费模型上定义事件监听器，监听模型的 `updated` 事件。然后在监听器中调用模型的 `syncStripeCustomerDetails` 方法：

```php
use function Illuminate\Events\queueable;

/**
 * 模型的 "booted" 方法。
 *
 * @return void
 */
protected static function booted()
{
    static::updated(queueable(function ($customer) {
        if ($customer->hasStripeId()) {
            $customer->syncStripeCustomerDetails();
        }
    }));
}
```

现在，每次更新客户模型时，其信息都会与 Stripe 同步。为方便起见，Cashier 会在客户初次创建时自动将其信息同步到 Stripe。

可以通过覆盖 Cashier 提供的多种方法来自定义同步到 Stripe 的客户信息列。例如，可以覆盖 `stripeName` 方法，自定义 Cashier 同步客户信息到 Stripe 时应视为客户"姓名"的属性：

```php
/**
 * 获取应同步到 Stripe 的客户姓名。
 *
 * @return string|null
 */
public function stripeName()
{
    return $this->company_name;
}
```

类似地，可以覆盖 `stripeEmail`、`stripePhone`、`stripeAddress` 和 `stripePreferredLocales` 方法。这些方法在[更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update)时会将信息同步到对应的客户参数。如希望完全控制客户信息同步过程，可以覆盖 `syncStripeCustomerDetails` 方法。

<a name="billing-portal"></a>
### 账单面板

Stripe 提供了[简便的方式来设置账单面板](https://stripe.com/docs/billing/subscriptions/customer-portal)，让客户管理订阅、支付方式并查看账单历史。可以在控制器或路由中对可计费模型调用 `redirectToBillingPortal` 方法，将用户重定向到账单面板：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal();
});
```

默认情况下，用户完成订阅管理后，可以通过 Stripe 账单面板中的链接返回应用的 `home` 路由。可以通过向 `redirectToBillingPortal` 方法传入 URL 作为参数，指定用户应返回的自定义 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('billing'));
});
```

如果希望生成账单面板的 URL 而不生成 HTTP 重定向响应，可以调用 `billingPortalUrl` 方法：

```php
$url = $request->user()->billingPortalUrl(route('billing'));
```

<a name="payment-methods"></a>
## 支付方式

<a name="storing-payment-methods"></a>
### 存储支付方式

要在 Stripe 中创建订阅或执行"一次性"收费，需要存储支付方式并从 Stripe 获取其标识符。实现方式因支付方式用于订阅还是单次收费而异，下面分别讨论。

<a name="payment-methods-for-subscriptions"></a>
#### 用于订阅的支付方式

为订阅未来使用而存储客户信用卡信息时，必须使用 Stripe "Setup Intents" API 安全收集客户支付方式详情。"Setup Intent" 向 Stripe 表明收取客户支付方式的意图。Cashier 的 `Billable` Trait 包含 `createSetupIntent` 方法，可轻松创建新的 Setup Intent。应在渲染收集客户支付方式详情表单的路由或控制器中调用此方法：

```php
return view('update-payment-method', [
    'intent' => $user->createSetupIntent()
]);
```

创建 Setup Intent 并传递给视图后，应将其 secret 附加到收集支付方式的元素上。例如，考虑以下"更新支付方式"表单：

```blade
<input id="card-holder-name" type="text">

<!-- Stripe Elements Placeholder -->
<div id="card-element"></div>

<button id="card-button" data-secret="{{ $intent->client_secret }}">
    Update Payment Method
</button>
```

接下来，可以使用 Stripe.js 库将 [Stripe Element](https://stripe.com/docs/stripe-js) 附加到表单并安全收集客户支付详情：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

接下来，可以使用 [Stripe 的 `confirmCardSetup` 方法](https://stripe.com/docs/js/setup_intents/confirm_card_setup)验证卡片并从 Stripe 获取安全的"支付方式标识符"：

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
        // 向用户显示 "error.message"...
    } else {
        // 卡片已成功验证...
    }
});
```

卡片经 Stripe 验证后，可以将得到的 `setupIntent.payment_method` 标识符传递给 Laravel 应用，附加到客户上。该支付方式可以[添加为新支付方式](#adding-payment-methods)，或[用于更新默认支付方式](#updating-the-default-payment-method)。也可以立即使用该支付方式标识符[创建新订阅](#creating-subscriptions)。

> **Note**  
> 如需了解有关 Setup Intents 和收集客户支付详情的更多信息，请[查阅 Stripe 提供的概述](https://stripe.com/docs/payments/save-and-reuse#php)。

<a name="payment-methods-for-single-charges"></a>
#### 用于单次收费的支付方式

当然，对客户支付方式进行单次收费时，只需使用一次支付方式标识符。由于 Stripe 的限制，不能使用客户存储的默认支付方式进行单次收费。必须允许客户使用 Stripe.js 库输入支付方式详情。例如，考虑以下表单：

```html
<input id="card-holder-name" type="text">

<!-- Stripe Elements Placeholder -->
<div id="card-element"></div>

<button id="card-button">
    Process Payment
</button>
```

定义此类表单后，可以使用 Stripe.js 库将 [Stripe Element](https://stripe.com/docs/stripe-js) 附加到表单并安全收集客户支付详情：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

接下来，可以使用 [Stripe 的 `createPaymentMethod` 方法](https://stripe.com/docs/stripe-js/reference#stripe-create-payment-method)验证卡片并从 Stripe 获取安全的"支付方式标识符"：

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
        // 向用户显示 "error.message"...
    } else {
        // 卡片已成功验证...
    }
});
```

如果卡片验证成功，可以将 `paymentMethod.id` 传递给 Laravel 应用并执行[单次收费](#simple-charge)。

<a name="retrieving-payment-methods"></a>
### 获取支付方式

可计费模型实例上的 `paymentMethods` 方法返回 `Laravel\Cashier\PaymentMethod` 实例的集合：

```php
$paymentMethods = $user->paymentMethods();
```

默认情况下，该方法返回 `card` 类型的支付方式。要获取其他类型的支付方式，可以将 `type` 作为参数传递给方法：

```php
$paymentMethods = $user->paymentMethods('sepa_debit');
```

要获取客户的默认支付方式，可以使用 `defaultPaymentMethod` 方法：

```php
$paymentMethod = $user->defaultPaymentMethod();
```

可以使用 `findPaymentMethod` 方法获取附加到可计费模型的特定支付方式：

```php
$paymentMethod = $user->findPaymentMethod($paymentMethodId);
```

<a name="check-for-a-payment-method"></a>
### 判断用户是否拥有支付方式

要判断可计费模型是否附加了默认支付方式，调用 `hasDefaultPaymentMethod` 方法：

```php
if ($user->hasDefaultPaymentMethod()) {
    //
}
```

可以使用 `hasPaymentMethod` 方法判断可计费模型是否至少附加了一个支付方式：

```php
if ($user->hasPaymentMethod()) {
    //
}
```

该方法判断可计费模型是否拥有 `card` 类型的支付方式。要判断模型是否存在其他类型的支付方式，可以将 `type` 作为参数传递给方法：

```php
if ($user->hasPaymentMethod('sepa_debit')) {
    //
}
```

<a name="updating-the-default-payment-method"></a>
### 更新默认支付方式

可以使用 `updateDefaultPaymentMethod` 方法更新客户的默认支付方式信息。该方法接受 Stripe 支付方式标识符，并将新支付方式指定为默认账单支付方式：

```php
$user->updateDefaultPaymentMethod($paymentMethod);
```

要将默认支付方式信息与 Stripe 中客户的默认支付方式信息同步，可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

```php
$user->updateDefaultPaymentMethodFromStripe();
```

> **Warning**  
> 客户的默认支付方式只能用于开票和创建新订阅。由于 Stripe 的限制，不能用于单次收费。

<a name="adding-payment-methods"></a>
### 添加支付方式

要添加新支付方式，可以在可计费模型上调用 `addPaymentMethod` 方法，传入支付方式标识符：

```php
$user->addPaymentMethod($paymentMethod);
```

> **Note**  
> 要了解如何获取支付方式标识符，请参阅[支付方式存储文档](#storing-payment-methods)。

<a name="deleting-payment-methods"></a>
### 删除支付方式

要删除支付方式，可以在要删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

```php
$paymentMethod->delete();
```

`deletePaymentMethod` 方法会从可计费模型中删除特定支付方式：

```php
$user->deletePaymentMethod('pm_visa');
```

`deletePaymentMethods` 方法会删除可计费模型的所有支付方式信息：

```php
$user->deletePaymentMethods();
```

默认情况下，该方法删除 `card` 类型的支付方式。要删除其他类型的支付方式，可以将 `type` 作为参数传递给方法：

```php
$user->deletePaymentMethods('sepa_debit');
```

> **Warning**  
> 如果用户拥有活跃订阅，应用不应允许其删除默认支付方式。

<a name="subscriptions"></a>
## 订阅

订阅为客户提供了一种设置定期支付的方式。Cashier 管理的 Stripe 订阅支持多种订阅价格、订阅数量、试用等。

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先获取可计费模型的实例，通常是 `App\Models\User` 的实例。获取模型实例后，可以使用 `newSubscription` 方法创建模型的订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription(
        'default', 'price_monthly'
    )->create($request->paymentMethodId);

    // ...
});
```

传递给 `newSubscription` 方法的第一个参数应为订阅的内部名称。如果应用只提供单一订阅，可以将其命名为 `default` 或 `primary`。该订阅名称仅供应用内部使用，不应展示给用户。此外，它不应包含空格，且创建订阅后不应再更改。第二个参数是用户订阅的具体价格。该值应对应 Stripe 中价格的标识符。

`create` 方法接受 [Stripe 支付方式标识符](#storing-payment-methods)或 Stripe `PaymentMethod` 对象，会开始订阅并将可计费模型的 Stripe 客户 ID 和其他相关账单信息写入数据库。

> **Warning**  
> 直接将支付方式标识符传递给 `create` 订阅方法时，还会自动将其添加到用户存储的支付方式中。

<a name="collecting-recurring-payments-via-invoice-emails"></a>
#### 通过发票邮件收取定期支付

除了自动收取客户的定期支付外，还可以指示 Stripe 在每次定期支付到期时向客户发送发票邮件。然后客户可以在收到发票后手动支付。通过发票收取定期支付时，客户无需预先提供支付方式：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice();
```

客户在订阅被取消前支付发票的时间由 `days_until_due` 选项决定。默认为 30 天；如有需要，可以为该选项提供具体值：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
    'days_until_due' => 30
]);
```

<a name="subscription-quantities"></a>
#### 数量

创建订阅时如希望为价格设置特定[数量](https://stripe.com/docs/billing/subscriptions/quantities)，应在创建订阅前在订阅构建器上调用 `quantity` 方法：

```php
$user->newSubscription('default', 'price_monthly')
     ->quantity(5)
     ->create($paymentMethod);
```

<a name="additional-details"></a>
#### 附加详情

如希望指定 Stripe 支持的附加[客户](https://stripe.com/docs/api/customers/create)或[订阅](https://stripe.com/docs/api/subscriptions/create)选项，可以将它们作为 `create` 方法的第二和第三个参数传入：

```php
$user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
    'email' => $email,
], [
    'metadata' => ['note' => 'Some extra information.'],
]);
```

<a name="coupons"></a>
#### 优惠券

创建订阅时如希望应用优惠券，可以使用 `withCoupon` 方法：

```php
$user->newSubscription('default', 'price_monthly')
     ->withCoupon('code')
     ->create($paymentMethod);
```

或者，如希望应用 [Stripe 促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

```php
$user->newSubscription('default', 'price_monthly')
     ->withPromotionCode('promo_code_id')
     ->create($paymentMethod);
```

给定的促销代码 ID 应为分配给促销代码的 Stripe API ID，而非面向客户的促销代码。如果需要根据面向客户的促销代码查找促销代码 ID，可以使用 `findPromotionCode` 方法：

```php
// 通过面向客户的代码查找促销代码 ID...
$promotionCode = $user->findPromotionCode('SUMMERSALE');

// 通过面向客户的代码查找有效的促销代码 ID...
$promotionCode = $user->findActivePromotionCode('SUMMERSALE');
```

在上面的示例中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的实例。该类装饰了底层的 `Stripe\PromotionCode` 对象。可以通过调用 `coupon` 方法获取与促销代码相关的优惠券：

```php
$coupon = $user->findPromotionCode('SUMMERSALE')->coupon();
```

优惠券实例可用于确定折扣金额以及优惠券是固定折扣还是百分比折扣：

```php
if ($coupon->isPercentage()) {
    return $coupon->percentOff().'%'; // 21.5%
} else {
    return $coupon->amountOff(); // $5.99
}
```

还可以获取当前应用于客户或订阅的折扣：

```php
$discount = $billable->discount();

$discount = $subscription->discount();
```

返回的 `Laravel\Cashier\Discount` 实例装饰了底层的 `Stripe\Discount` 对象实例。可以通过调用 `coupon` 方法获取与该折扣相关的优惠券：

```php
$coupon = $subscription->discount()->coupon();
```

如希望向客户或订阅应用新优惠券或促销代码，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法完成：

```php
$billable->applyCoupon('coupon_id');
$billable->applyPromotionCode('promotion_code_id');

$subscription->applyCoupon('coupon_id');
$subscription->applyPromotionCode('promotion_code_id');
```

请记住，应使用分配给促销代码的 Stripe API ID，而非面向客户的促销代码。同一时间只能向客户或订阅应用一个优惠券或促销代码。

有关此主题的更多信息，请参阅 Stripe 文档中关于[优惠券](https://stripe.com/docs/billing/subscriptions/coupons)和[促销代码](https://stripe.com/docs/billing/subscriptions/coupons/codes)的部分。

<a name="adding-subscriptions"></a>
#### 添加订阅

如果希望向已拥有默认支付方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->add();
```

<a name="creating-subscriptions-from-the-stripe-dashboard"></a>
#### 从 Stripe 控制面板创建订阅

也可以从 Stripe 控制面板创建订阅。此时，Cashier 会同步新增的订阅并为其分配 `default` 名称。要自定义分配给控制面板创建订阅的订阅名称，可以[扩展 `WebhookController`](#defining-webhook-event-handlers)并覆盖 `newSubscriptionName` 方法。

此外，通过 Stripe 控制面板只能创建一种类型的订阅。如果应用提供使用不同名称的多个订阅，则只能通过 Stripe 控制面板添加一种类型的订阅。

最后，应始终确保应用提供的每种订阅类型只添加一个活跃订阅。如果客户有两个 `default` 订阅，即使两者都会与应用数据库同步，Cashier 也只会使用最近添加的订阅。

<a name="checking-subscription-status"></a>
### 检查订阅状态

客户订阅应用后，可以使用多种便捷方法轻松检查其订阅状态。首先，`subscribed` 方法在客户拥有活跃订阅时返回 `true`，即使订阅当前处于试用期内。`subscribed` 方法接受订阅名称作为第一个参数：

```php
if ($user->subscribed('default')) {
    //
}
```

`subscribed` 方法也非常适合作为[路由中间件](/docs/{{version}}/middleware)，可以根据用户的订阅状态过滤对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserIsSubscribed
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if ($request->user() && ! $request->user()->subscribed('default')) {
            // 该用户不是付费客户...
            return redirect('billing');
        }

        return $next($request);
    }
}
```

要判断用户是否仍处于试用期内，可以使用 `onTrial` 方法。此方法可用于确定是否应向用户显示仍处于试用期的警告：

```php
if ($user->subscription('default')->onTrial()) {
    //
}
```

可以使用 `subscribedToProduct` 方法，根据给定的 Stripe 产品标识符判断用户是否订阅了给定产品。在 Stripe 中，产品是价格的集合。在此示例中，判断用户的 `default` 订阅是否活跃订阅了应用的"premium"产品。给定的 Stripe 产品标识符应对应 Stripe 控制面板中某个产品的标识符：

```php
if ($user->subscribedToProduct('prod_premium', 'default')) {
    //
}
```

通过向 `subscribedToProduct` 方法传入数组，可以判断用户的 `default` 订阅是否活跃订阅了应用的"basic"或"premium"产品：

```php
if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
    //
}
```

可以使用 `subscribedToPrice` 方法判断客户的订阅是否对应给定的价格 ID：

```php
if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
    //
}
```

可以使用 `recurring` 方法判断用户当前是否已订阅且不再处于试用期内：

```php
if ($user->subscription('default')->recurring()) {
    //
}
```

> **Warning**  
> 如果用户拥有两个同名订阅，`subscription` 方法始终返回最近的订阅。例如，用户可能有两个名为 `default` 的订阅记录；但其中一个可能是旧的已过期订阅，另一个是当前活跃订阅。始终返回最近的订阅，而旧订阅保留在数据库中以供历史查阅。

<a name="cancelled-subscription-status"></a>
#### 已取消订阅状态

要判断用户曾经是活跃订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription('default')->canceled()) {
    //
}
```

还可以判断用户是否已取消订阅但仍处于"宽限期"内直到订阅完全到期。例如，如果用户在 3 月 5 日取消了原定于 3 月 10 日到期的订阅，则用户在 3 月 10 日之前都处于"宽限期"。注意，此期间 `subscribed` 方法仍返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    //
}
```

要判断用户是否已取消订阅且不再处于"宽限期"内，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    //
}
```

<a name="incomplete-and-past-due-status"></a>
#### 未完成与过期状态

如果订阅在创建后需要二次支付操作，订阅会被标记为 `incomplete`。订阅状态存储在 Cashier `subscriptions` 数据库表的 `stripe_status` 列中。

类似地，如果切换价格时需要二次支付操作，订阅会被标记为 `past_due`。当订阅处于这些状态时，在客户确认支付之前不会活跃。可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法判断订阅是否有未完成支付：

```php
if ($user->hasIncompletePayment('default')) {
    //
}

if ($user->subscription('default')->hasIncompletePayment()) {
    //
}
```

当订阅有未完成支付时，应将用户引导至 Cashier 的支付确认页面，并传入 `latestPayment` 标识符。可以使用订阅实例上的 `latestPayment` 方法获取此标识符：

```blade
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果希望订阅在 `past_due` 或 `incomplete` 状态下仍被视为活跃，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，这些方法应在 `App\Providers\AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Cashier\Cashier;

/**
 * 注册应用服务。
 *
 * @return void
 */
public function register()
{
    Cashier::keepPastDueSubscriptionsActive();
    Cashier::keepIncompleteSubscriptionsActive();
}
```

> **Warning**  
> 当订阅处于 `incomplete` 状态时，在支付确认之前无法更改。因此，`swap` 和 `updateQuantity` 方法在订阅处于 `incomplete` 状态时会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可用作查询作用域，便于轻松查询数据库中处于给定状态的订阅：

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
### 切换价格

客户订阅应用后，偶尔可能希望切换到新的订阅价格。要将客户切换到新价格，将 Stripe 价格标识符传递给 `swap` 方法。切换价格时，如果订阅之前已取消，会假定用户希望重新激活订阅。给定的价格标识符应对应 Stripe 控制面板中可用的 Stripe 价格标识符：

```php
use App\Models\User;

$user = App\Models\User::find(1);

$user->subscription('default')->swap('price_yearly');
```

如果客户处于试用期，试用期会保留。此外，如果订阅存在"数量"，该数量也会保留。

如果希望切换价格并取消客户当前的试用期，可以调用 `skipTrial` 方法：

```php
$user->subscription('default')
        ->skipTrial()
        ->swap('price_yearly');
```

如果希望切换价格并立即向客户开票而非等待下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice('price_yearly');
```

<a name="prorations"></a>
#### 按比例分摊

默认情况下，Stripe 在切换价格时会按比例分摊费用。可以使用 `noProrate` 方法在不按比例分摊费用的情况下更新订阅价格：

```php
$user->subscription('default')->noProrate()->swap('price_yearly');
```

有关订阅按比例分摊的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> **Warning**  
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法对按比例分摊无影响。始终会开具发票。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受"数量"影响。例如，项目管理应用可能按每个项目每月 10 美元收费。可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松增减订阅数量：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// 在订阅当前数量上加五...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// 从订阅当前数量中减五...
$user->subscription('default')->decrementQuantity(5);
```

或者，可以使用 `updateQuantity` 方法设置特定数量：

```php
$user->subscription('default')->updateQuantity(10);
```

可以使用 `noProrate` 方法在不按比例分摊费用的情况下更新订阅数量：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

有关订阅数量的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/subscriptions/quantities)。

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 多产品订阅的数量

如果订阅是[多产品订阅](#subscriptions-with-multiple-products)，应将希望增减数量的价格 ID 作为增减方法的第二个参数传入：

```php
$user->subscription('default')->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 多产品订阅

[多产品订阅](https://stripe.com/docs/billing/subscriptions/multiple-products)允许将多个计费产品分配给单个订阅。例如，假设正在构建一个客户服务"帮助台"应用，基础订阅价格为每月 10 美元，但提供每月额外 15 美元的实时聊天附加产品。多产品订阅的信息存储在 Cashier 的 `subscription_items` 数据库表中。

可以通过向 `newSubscription` 方法传入价格数组作为第二个参数，为给定订阅指定多个产品：

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

在上面的示例中，客户的 `default` 订阅会附加两个价格。两个价格会按各自的计费周期收费。如有需要，可以使用 `quantity` 方法为每个价格指定特定数量：

```php
$user = User::find(1);

$user->newSubscription('default', ['price_monthly', 'price_chat'])
    ->quantity(5, 'price_chat')
    ->create($paymentMethod);
```

如果希望向现有订阅添加另一个价格，可以调用订阅的 `addPrice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat');
```

上面的示例会添加新价格，客户会在下一个计费周期为此付费。如果希望立即向客户收费，可以使用 `addPriceAndInvoice` 方法：

```php
$user->subscription('default')->addPriceAndInvoice('price_chat');
```

如果希望添加具有特定数量的价格，可以将数量作为 `addPrice` 或 `addPriceAndInvoice` 方法的第二个参数传入：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat', 5);
```

可以使用 `removePrice` 方法从订阅中移除价格：

```php
$user->subscription('default')->removePrice('price_chat');
```

> **Warning**  
> 不能移除订阅上的最后一个价格。应直接取消订阅。

<a name="swapping-prices"></a>
#### 切换价格

还可以更改多产品订阅附加的价格。例如，假设客户拥有 `price_basic` 订阅和 `price_chat` 附加产品，希望将客户从 `price_basic` 升级到 `price_pro`：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap(['price_pro', 'price_chat']);
```

执行上面的示例时，底层 `price_basic` 的订阅项会被删除，`price_chat` 的订阅项会保留。此外，会为 `price_pro` 创建新的订阅项。

还可以通过向 `swap` 方法传入键值对数组来指定订阅项选项。例如，可能需要指定订阅价格数量：

```php
$user = User::find(1);

$user->subscription('default')->swap([
    'price_pro' => ['quantity' => 5],
    'price_chat'
]);
```

如果希望切换订阅上的单个价格，可以在订阅项本身上使用 `swap` 方法。此方法在希望保留订阅其他价格上所有现有元数据时特别有用：

```php
$user = User::find(1);

$user->subscription('default')
        ->findItemOrFail('price_basic')
        ->swap('price_pro');
```

<a name="proration"></a>
#### 按比例分摊

默认情况下，Stripe 在从多产品订阅添加或移除价格时会按比例分摊费用。如果希望进行价格调整而不按比例分摊，应将 `noProrate` 方法链式接到价格操作上：

```php
$user->subscription('default')->noProrate()->removePrice('price_chat');
```

<a name="swapping-quantities"></a>
#### 数量

如果希望更新单个订阅价格的数量，可以使用[现有的数量方法](#subscription-quantity)，将价格名称作为方法的附加参数传入：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity(5, 'price_chat');

$user->subscription('default')->decrementQuantity(3, 'price_chat');

$user->subscription('default')->updateQuantity(10, 'price_chat');
```

> **Warning**  
> 当订阅拥有多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性会为 `null`。要访问单个价格属性，应使用 `Subscription` 模型上的 `items` 关联。

<a name="subscription-items"></a>
#### 订阅项

当订阅拥有多个价格时，数据库的 `subscription_items` 表中会存储多个订阅"项"。可以通过订阅上的 `items` 关联访问：

```php
use App\Models\User;

$user = User::find(1);

$subscriptionItem = $user->subscription('default')->items->first();

// 获取特定项的 Stripe 价格和数量...
$stripePrice = $subscriptionItem->stripe_price;
$quantity = $subscriptionItem->quantity;
```

还可以使用 `findItemOrFail` 方法获取特定价格：

```php
$user = User::find(1);

$subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');
```

<a name="multiple-subscriptions"></a>
### 多个订阅

Stripe 允许客户同时拥有多个订阅。例如，可能经营一家健身房，提供游泳订阅和举重订阅，每个订阅可以有不同的定价。当然，客户应能订阅其中一个或两个计划。

应用创建订阅时，可以向 `newSubscription` 方法提供订阅名称。名称可以是表示用户发起的订阅类型的任意字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()->newSubscription('swimming')
        ->price('price_swimming_monthly')
        ->create($request->paymentMethodId);

    // ...
});
```

在此示例中，为客户发起了一个月度游泳订阅。但是，他们可能希望在稍后切换到年度订阅。调整客户订阅时，只需切换 `swimming` 订阅上的价格：

```php
$user->subscription('swimming')->swap('price_swimming_yearly');
```

当然，也可以完全取消订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="metered-billing"></a>
### 计量计费

[计量计费](https://stripe.com/docs/billing/subscriptions/metered-billing)允许根据客户在计费周期内的产品使用量收费。例如，可以根据客户每月发送的短信或电子邮件数量收费。

要开始使用计量计费，首先需要在 Stripe 控制面板中创建一个带有计量价格的新产品。然后，使用 `meteredPrice` 将计量价格 ID 添加到客户订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default')
        ->meteredPrice('price_metered')
        ->create($request->paymentMethodId);

    // ...
});
```

也可以通过 [Stripe Checkout](#checkout) 开始计量订阅：

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
#### 报告使用量

客户使用应用时，需要向 Stripe 报告其使用量以便准确计费。要增加计量订阅的使用量，可以使用 `reportUsage` 方法：

```php
$user = User::find(1);

$user->subscription('default')->reportUsage();
```

默认情况下，会向计费周期添加"使用量"1。或者，可以传入要添加到客户计费周期使用量的特定"使用量"：

```php
$user = User::find(1);

$user->subscription('default')->reportUsage(15);
```

如果应用在单个订阅上提供多个价格，需要使用 `reportUsageFor` 方法指定要报告使用量的计量价格：

```php
$user = User::find(1);

$user->subscription('default')->reportUsageFor('price_metered', 15);
```

有时可能需要更新之前已报告的使用量。为此，可以向 `reportUsage` 传入时间戳或 `DateTimeInterface` 实例作为第二个参数。此时，Stripe 会更新在给定时间报告的使用量。只要给定日期时间仍在当前计费周期内，就可以继续更新之前的用量记录：

```php
$user = User::find(1);

$user->subscription('default')->reportUsage(5, $timestamp);
```

<a name="retrieving-usage-records"></a>
#### 获取使用量记录

要获取客户的历史使用量，可以使用订阅实例的 `usageRecords` 方法：

```php
$user = User::find(1);

$usageRecords = $user->subscription('default')->usageRecords();
```

如果应用在单个订阅上提供多个价格，可以使用 `usageRecordsFor` 方法指定要获取使用量记录的计量价格：

```php
$user = User::find(1);

$usageRecords = $user->subscription('default')->usageRecordsFor('price_metered');
```

`usageRecords` 和 `usageRecordsFor` 方法返回包含使用量记录关联数组的 Collection 实例。可以遍历此数组以显示客户的总使用量：

```blade
@foreach ($usageRecords as $usageRecord)
```

        - Period Starting: {{ $usageRecord['period']['start'] }}
        - Period Ending: {{ $usageRecord['period']['end'] }}
        - Total Usage: {{ $usageRecord['total_usage'] }}

```blade
@endforeach
```

有关返回的所有使用量数据以及如何使用 Stripe 基于游标的分页的完整参考，请查阅 [Stripe 官方 API 文档](https://stripe.com/docs/api/usage_records/subscription_item_summary_list)。

<a name="subscription-taxes"></a>
### 订阅税费

> **Warning**  
> 与其手动计算税率，不如[使用 Stripe Tax 自动计算税费](#tax-configuration)

要指定用户在订阅上支付的税率，应在可计费模型上实现 `taxRates` 方法并返回包含 Stripe 税率 ID 的数组。可以在 [Stripe 控制面板](https://dashboard.stripe.com/test/tax-rates)中定义这些税率：

```php
/**
 * 应应用于客户订阅的税率。
 *
 * @return array
 */
public function taxRates()
{
    return ['txr_id'];
}
```

`taxRates` 方法允许逐个客户应用税率，这对于跨越多个国家和税率的用户群体很有帮助。

如果提供多产品订阅，可以通过在可计费模型上实现 `priceTaxRates` 方法为每个价格定义不同税率：

```php
/**
 * 应应用于客户订阅的税率。
 *
 * @return array
 */
public function priceTaxRates()
{
    return [
        'price_monthly' => ['txr_id'],
    ];
}
```

> **Warning**  
> `taxRates` 方法仅适用于订阅收费。如果使用 Cashier 进行"一次性"收费，则需要在该时手动指定税率。

<a name="syncing-tax-rates"></a>
#### 同步税率

更改 `taxRates` 方法返回的硬编码税率 ID 时，用户现有订阅上的税务设置会保持不变。如果希望用新的 `taxRates` 值更新现有订阅的税务值，应在用户的订阅实例上调用 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这也会同步多产品订阅的任何项税率。如果应用提供多产品订阅，应确保可计费模型实现了[上文讨论的](#subscription-taxes)`priceTaxRates` 方法。

<a name="tax-exemption"></a>
#### 税务豁免

Cashier 还提供了 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法来判断客户是否免税。这些方法会调用 Stripe API 确定客户的税务豁免状态：

```php
use App\Models\User;

$user = User::find(1);

$user->isTaxExempt();
$user->isNotTaxExempt();
$user->reverseChargeApplies();
```

> **Warning**  
> 这些方法在任何 `Laravel\Cashier\Invoice` 对象上也可用。但在 `Invoice` 对象上调用时，这些方法会确定发票创建时的豁免状态。

<a name="subscription-anchor-date"></a>
### 订阅锚定日期

默认情况下，计费周期锚定日期为订阅创建日期，或使用试用期时为试用结束日期。如希望修改计费锚定日期，可以使用 `anchorBillingCycleOn` 方法：

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

要取消订阅，在用户订阅上调用 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

取消订阅时，Cashier 会自动设置 `subscriptions` 数据库表中的 `ends_at` 列。此列用于确定 `subscribed` 方法何时应开始返回 `false`。

例如，如果客户在 3 月 1 日取消了原定于 3 月 5 日结束的订阅，`subscribed` 方法会继续返回 `true` 直到 3 月 5 日。这是因为通常允许用户继续使用应用直到计费周期结束。

可以使用 `onGracePeriod` 方法判断用户是否已取消订阅但仍处于"宽限期"：

```php
if ($user->subscription('default')->onGracePeriod()) {
    //
}
```

如果希望立即取消订阅，在用户订阅上调用 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

如果希望立即取消订阅并对任何剩余未开票的计量使用量或新增/待处理的按比例分摊发票项开票，在用户订阅上调用 `cancelNowAndInvoice` 方法：

```php
$user->subscription('default')->cancelNowAndInvoice();
```

也可以选择在特定时间点取消订阅：

```php
$user->subscription('default')->cancelAt(
    now()->addDays(10)
);
```

<a name="resuming-subscriptions"></a>
### 恢复订阅

如果客户已取消订阅且希望恢复，可以在订阅上调用 `resume` 方法。客户必须仍处于"宽限期"内才能恢复订阅：

```php
$user->subscription('default')->resume();
```

如果客户取消订阅后在订阅完全到期之前恢复，客户不会被立即收费。相反，订阅会被重新激活，并按原始计费周期收费。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先提供支付方式

如果希望为客户提供试用期同时仍预先收集支付方式信息，应在创建订阅时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', 'price_monthly')
                ->trialDays(10)
                ->create($request->paymentMethodId);

    // ...
});
```

此方法会在数据库中的订阅记录上设置试用期结束日期，并指示 Stripe 在此日期之后才开始向客户收费。使用 `trialDays` 方法时，Cashier 会覆盖 Stripe 中为价格配置的任何默认试用期。

> **Warning**  
> 如果客户的订阅在试用结束日期前未取消，试用到期后会立即收费，因此应确保通知用户试用结束日期。

`trialUntil` 方法允许提供指定试用期结束时间的 `DateTime` 实例：

```php
use Carbon\Carbon;

$user->newSubscription('default', 'price_monthly')
            ->trialUntil(Carbon::now()->addDays(10))
            ->create($paymentMethod);
```

可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法判断用户是否处于试用期内。以下两个示例等效：

```php
if ($user->onTrial('default')) {
    //
}

if ($user->subscription('default')->onTrial()) {
    //
}
```

可以使用 `endTrial` 方法立即结束订阅试用：

```php
$user->subscription('default')->endTrial();
```

要判断现有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial('default')) {
    //
}

if ($user->subscription('default')->hasExpiredTrial()) {
    //
}
```

<a name="defining-trial-days-in-stripe-cashier"></a>
#### 在 Stripe / Cashier 中定义试用天数

可以选择在 Stripe 控制面板中定义价格接收的试用天数，或始终通过 Cashier 显式传递。如果选择在 Stripe 中定义价格的试用天数，应注意新订阅（包括过去曾拥有订阅的客户的新订阅）始终会获得试用期，除非显式调用 `skipTrial()` 方法。

<a name="without-payment-method-up-front"></a>
### 不预先提供支付方式

如果希望在不预先收集用户支付方式信息的情况下提供试用期，可以将用户记录上的 `trial_ends_at` 列设置为所需的试用结束日期。通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
    'trial_ends_at' => now()->addDays(10),
]);
```

> **Warning**  
> 确保在可计费模型类定义中为 `trial_ends_at` 属性添加[日期类型转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 将此类试用称为"通用试用"，因为它不附加到任何现有订阅。如果当前日期未超过 `trial_ends_at` 的值，可计费模型实例上的 `onTrial` 方法会返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

准备好为用户创建实际订阅后，可以像往常一样使用 `newSubscription` 方法：

```php
$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->create($paymentMethod);
```

要获取用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户处于试用期，该方法会返回 Carbon 日期实例，否则返回 `null`。如果希望获取默认订阅以外特定订阅的试用结束日期，可以传入可选的订阅名称参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果希望明确知道用户处于"通用"试用期内且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于 "通用" 试用期内...
}
```

<a name="extending-trials"></a>
### 延长试用

`extendTrial` 方法允许在订阅创建后延长试用期。如果试用已过期且客户已在为订阅付费，仍可为其提供延长试用。试用期内的时间会从客户的下一张发票中扣除：

```php
use App\Models\User;

$subscription = User::find(1)->subscription('default');

// 从现在起 7 天后结束试用...
$subscription->extendTrial(
    now()->addDays(7)
);

// 为试用额外增加 5 天...
$subscription->extendTrial(
    $subscription->trial_ends_at->addDays(5)
);
```

<a name="handling-stripe-webhooks"></a>
## 处理 Stripe Webhook

> **Note**  
> 可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 帮助在本地开发期间测试 Webhook。

Stripe 可以通过 Webhook 通知应用各种事件。默认情况下，指向 Cashier Webhook 控制器的路由会由 Cashier 服务提供者自动注册。该控制器会处理所有传入的 Webhook 请求。

默认情况下，Cashier 的 Webhook 控制器会自动处理因失败次数过多（由 Stripe 设置定义）而取消订阅、客户更新、客户删除、订阅更新和支付方式变更；但正如即将讨论的，可以扩展此控制器以处理任何所需的 Stripe Webhook 事件。

为确保应用能处理 Stripe Webhook，请务必在 Stripe 控制面板中配置 Webhook URL。默认情况下，Cashier 的 Webhook 控制器响应 `/stripe/webhook` URL 路径。应在 Stripe 控制面板中启用的所有 Webhook 完整列表如下：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。此命令会在 Stripe 中创建一个监听 Cashier 所需所有事件的 Webhook：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 Webhook 会指向由 `APP_URL` 环境变量定义的 URL 和 Cashier 附带的 `cashier.webhook` 路由。如希望使用不同的 URL，可以在调用命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 Webhook 会使用与当前 Cashier 版本兼容的 Stripe API 版本。如希望使用不同的 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，Webhook 会立即激活。如果希望创建 Webhook 但在准备好之前保持禁用，可以在调用命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> **Warning**  
> 确保使用 Cashier 附带的 [Webhook 签名验证](#verifying-webhook-signatures)中间件保护传入的 Stripe Webhook 请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Stripe Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，请务必在应用的 `App\Http\Middleware\VerifyCsrfToken` 中间件中将该 URI 列为例外，或将该路由置于 `web` 中间件组之外：

```php
protected $except = [
    'stripe/*',
];
```

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理因失败收费导致的订阅取消和其他常见 Stripe Webhook 事件。但如果有额外的 Webhook 事件需要处理，可以通过监听 Cashier 触发的以下事件来完成：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe Webhook 的完整负载。例如，如果希望处理 `invoice.payment_succeeded` Webhook，可以注册一个处理该事件的[监听器](/docs/{{version}}/events#defining-listeners)：

```php
<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * 处理接收到的 Stripe Webhook。
     *
     * @param  \Laravel\Cashier\Events\WebhookReceived  $event
     * @return void
     */
    public function handle(WebhookReceived $event)
    {
        if ($event->payload['type'] === 'invoice.payment_succeeded') {
            // 处理传入事件...
        }
    }
}
```

定义监听器后，可以在应用的 `EventServiceProvider` 中注册：

```php
<?php

namespace App\Providers;

use App\Listeners\StripeEventListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Laravel\Cashier\Events\WebhookReceived;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        WebhookReceived::class => [
            StripeEventListener::class,
        ],
    ];
}
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为确保 Webhook 安全，可以使用 [Stripe 的 Webhook 签名](https://stripe.com/docs/webhooks/signatures)。为方便起见，Cashier 自动包含一个中间件，用于验证传入的 Stripe Webhook 请求是否有效。

要启用 Webhook 验证，请确保应用的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。Webhook `secret` 可从 Stripe 账户控制面板获取。

<a name="single-charges"></a>
## 单次收费

<a name="simple-charge"></a>
### 简单收费

如果希望对客户进行一次性收费，可以在可计费模型实例上使用 `charge` 方法。需要将[支付方式标识符](#payment-methods-for-single-charges)作为 `charge` 方法的第二个参数传入：

```php
use Illuminate\Http\Request;

Route::post('/purchase', function (Request $request) {
    $stripeCharge = $request->user()->charge(
        100, $request->paymentMethodId
    );

    // ...
});
```

`charge` 方法接受数组作为第三个参数，允许将任何所需选项传递给底层 Stripe 收费创建。有关创建收费时可用选项的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/api/charges/create)：

```php
$user->charge(100, $paymentMethod, [
    'custom_option' => $value,
]);
```

也可以在没有底层客户或用户的情况下使用 `charge` 方法。为此，在应用可计费模型的新实例上调用 `charge` 方法：

```php
use App\Models\User;

$stripeCharge = (new User)->charge(100, $paymentMethod);
```

如果收费失败，`charge` 方法会抛出异常。如果收费成功，方法会返回 `Laravel\Cashier\Payment` 实例：

```php
try {
    $payment = $user->charge(100, $paymentMethod);
} catch (Exception $e) {
    //
}
```

> **Warning**  
> `charge` 方法接受以应用所用货币的最小单位表示的支付金额。例如，如果客户以美元支付，金额应以美分指定。

<a name="charge-with-invoice"></a>
### 带发票收费

有时可能需要进行一次性收费并向客户提供 PDF 收据。`invoicePrice` 方法即可实现此功能。例如，为客户开具新衬衫五件的发票：

```php
$user->invoicePrice('price_tshirt', 5);
```

发票会立即向用户的默认支付方式收费。`invoicePrice` 方法也接受数组作为第三个参数。该数组包含发票项的账单选项。该方法接受的第四个参数也是数组，应包含发票本身的账单选项：

```php
$user->invoicePrice('price_tshirt', 5, [
    'discounts' => [
        ['coupon' => 'SUMMER21SALE']
    ],
], [
    'default_tax_rates' => ['txr_id'],
]);
```

与 `invoicePrice` 类似，可以使用 `tabPrice` 方法通过将多个项（每张发票最多 250 项）添加到客户的"挂账"然后向客户开票来创建一次性收费。例如，可以为客户开具五件衬衫和两个马克杯的发票：

```php
$user->tabPrice('price_tshirt', 5);
$user->tabPrice('price_mug', 2);
$user->invoice();
```

或者，可以使用 `invoiceFor` 方法对客户的默认支付方式进行"一次性"收费：

```php
$user->invoiceFor('One Time Fee', 500);
```

虽然可以使用 `invoiceFor` 方法，但建议使用 `invoicePrice` 和 `tabPrice` 方法配合预定义价格。这样可以在 Stripe 控制面板中获得更好的按产品销售分析和数据。

> **Warning**  
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法会创建 Stripe 发票，该发票会重试失败的账单尝试。如果不希望发票重试失败收费，则需要在第一次收费失败后通过 Stripe API 关闭发票。

<a name="creating-payment-intents"></a>
### 创建支付意图

可以通过在可计费模型实例上调用 `pay` 方法创建新的 Stripe 支付意图。调用此方法会创建一个封装在 `Laravel\Cashier\Payment` 实例中的支付意图：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->pay(
        $request->get('amount')
    );

    return $payment->client_secret;
});
```

创建支付意图后，可以将客户端密钥返回给应用前端，以便用户在浏览器中完成支付。有关使用 Stripe 支付意图构建完整支付流程的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，Stripe 控制面板中启用的默认支付方式对客户可用。或者，如果只希望允许使用某些特定支付方式，可以使用 `payWith` 方法：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->payWith(
        $request->get('amount'), ['card', 'bancontact']
    );

    return $payment->client_secret;
});
```

> **Warning**  
> `pay` 和 `payWith` 方法接受以应用所用货币的最小单位表示的支付金额。例如，如果客户以美元支付，金额应以美分指定。

<a name="refunding-charges"></a>
### 退还费用

如果需要退还 Stripe 收费，可以使用 `refund` 方法。该方法接受 Stripe [支付意图 ID](#payment-methods-for-single-charges)作为第一个参数：

```php
$payment = $user->charge(100, $paymentMethodId);

$user->refund($payment->id);
```

<a name="invoices"></a>
## 发票

<a name="retrieving-invoices"></a>
### 获取发票

可以使用 `invoices` 方法轻松获取可计费模型的发票数组。`invoices` 方法返回 `Laravel\Cashier\Invoice` 实例的集合：

```php
$invoices = $user->invoices();
```

如果希望将待处理发票包含在结果中，可以使用 `invoicesIncludingPending` 方法：

```php
$invoices = $user->invoicesIncludingPending();
```

可以使用 `findInvoice` 方法通过 ID 获取特定发票：

```php
$invoice = $user->findInvoice($invoiceId);
```

<a name="displaying-invoice-information"></a>
#### 显示发票信息

为客户列出发票时，可以使用发票的方法显示相关发票信息。例如，可能希望在表格中列出每张发票，让用户轻松下载任意发票：

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
### 即将到期的发票

要获取客户的即将到期发票，可以使用 `upcomingInvoice` 方法：

```php
$invoice = $user->upcomingInvoice();
```

类似地，如果客户拥有多个订阅，也可以获取特定订阅的即将到期发票：

```php
$invoice = $user->subscription('default')->upcomingInvoice();
```

<a name="previewing-subscription-invoices"></a>
### 预览订阅发票

使用 `previewInvoice` 方法，可以在进行价格更改前预览发票。这可以确定进行给定价格更改后客户发票的样子：

```php
$invoice = $user->subscription('default')->previewInvoice('price_yearly');
```

可以向 `previewInvoice` 方法传入价格数组，以预览具有多个新价格的发票：

```php
$invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);
```

<a name="generating-invoice-pdfs"></a>
### 生成发票 PDF

生成发票 PDF 之前，应使用 Composer 安装 Dompdf 库，这是 Cashier 的默认发票渲染器：

```php
composer require dompdf/dompdf
```

在路由或控制器中，可以使用 `downloadInvoice` 方法生成给定发票的 PDF 下载。此方法会自动生成下载发票所需的正确 HTTP 响应：

```php
use Illuminate\Http\Request;

Route::get('/user/invoice/{invoice}', function (Request $request, $invoiceId) {
    return $request->user()->downloadInvoice($invoiceId);
});
```

默认情况下，发票上的所有数据都派生自存储在 Stripe 中的客户和发票数据。文件名基于 `app.name` 配置值。但可以通过向 `downloadInvoice` 方法传入数组作为第二个参数来自定义部分数据。该数组允许自定义公司、产品详情等信息：

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

`downloadInvoice` 方法还允许通过第三个参数指定自定义文件名。此文件名会自动添加 `.pdf` 后缀：

```php
return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');
```

<a name="custom-invoice-render"></a>
#### 自定义发票渲染器

Cashier 还允许使用自定义发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，该实现利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库生成 Cashier 的发票。但可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口使用任何所需的渲染器。例如，可能希望通过调用第三方 PDF 渲染服务的 API 来渲染发票 PDF：

```php
use Illuminate\Support\Facades\Http;
use Laravel\Cashier\Contracts\InvoiceRenderer;
use Laravel\Cashier\Invoice;

class ApiInvoiceRenderer implements InvoiceRenderer
{
    /**
     * 渲染给定发票并返回原始 PDF 字节。
     *
     * @param  \Laravel\Cashier\Invoice. $invoice
     * @param  array  $data
     * @param  array  $options
     * @return string
     */
    public function render(Invoice $invoice, array $data = [], array $options = []): string
    {
        $html = $invoice->view($data)->render();

        return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
    }
}
```

实现发票渲染器契约后，应更新应用 `config/cashier.php` 配置文件中的 `cashier.invoices.renderer` 配置值。此配置值应设置为自定义渲染器实现的类名。

<a name="checkout"></a>
## Checkout

Cashier Stripe 还支持 [Stripe Checkout](https://stripe.com/payments/checkout)。Stripe Checkout 通过提供预构建的托管支付页面，免除了实现自定义支付页面的痛苦。

以下文档包含如何开始使用 Cashier 的 Stripe Checkout 的信息。要了解更多关于 Stripe Checkout 的内容，建议也查阅 [Stripe 自己的 Checkout 文档](https://stripe.com/docs/payments/checkout)。

<a name="product-checkouts"></a>
### 产品结账

可以使用可计费模型上的 `checkout` 方法对在 Stripe 控制面板中创建的现有产品执行结账。`checkout` 方法会发起一个新的 Stripe Checkout 会话。默认情况下，需要传入 Stripe 价格 ID：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout('price_tshirt');
});
```

如有需要，还可以指定产品数量：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 15]);
});
```

客户访问此路由时会被重定向到 Stripe 的 Checkout 页面。默认情况下，用户成功完成或取消购买后会被重定向到 `home` 路由位置，但可以使用 `success_url` 和 `cancel_url` 选项指定自定义回调 URL：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

定义 `success_url` 结账选项时，可以指示 Stripe 在调用 URL 时将 Checkout 会话 ID 作为查询字符串参数添加。为此，将字面字符串 `{CHECKOUT_SESSION_ID}` 添加到 `success_url` 查询字符串。Stripe 会用实际的 Checkout 会话 ID 替换此占位符：

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

默认情况下，Stripe Checkout 不允许[用户可兑换的促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。幸运的是，有一种简单的方法可以在 Checkout 页面启用它们。为此，可以调用 `allowPromotionCodes` 方法：

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

也可以对未在 Stripe 控制面板中创建的临时产品执行简单收费。为此，可以在可计费模型上使用 `checkoutCharge` 方法，传入可收费金额、产品名称和可选数量。客户访问此路由时会被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/charge-checkout', function (Request $request) {
    return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
});
```

> **Warning**  
> 使用 `checkoutCharge` 方法时，Stripe 始终会在 Stripe 控制面板中创建新产品和价格。因此，建议在 Stripe 控制面板中预先创建产品并使用 `checkout` 方法。

<a name="subscription-checkouts"></a>
### 订阅结账

> **Warning**  
> 使用 Stripe Checkout 进行订阅需要在 Stripe 控制面板中启用 `customer.subscription.created` Webhook。此 Webhook 会在数据库中创建订阅记录并存储所有相关订阅项。

也可以使用 Stripe Checkout 发起订阅。使用 Cashier 的订阅构建器方法定义订阅后，可以调用 `checkout` 方法。客户访问此路由时会被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout();
});
```

与产品结账一样，可以自定义成功和取消 URL：

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

当然，也可以为订阅结账启用促销代码：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->allowPromotionCodes()
        ->checkout();
});
```

> **Warning**  
> 遗憾的是，Stripe Checkout 在启动订阅时不支持所有订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例分摊行为或设置支付行为在 Stripe Checkout 会话期间不会有任何效果。请查阅 [Stripe Checkout Session API 文档](https://stripe.com/docs/api/checkout/sessions/create)以查看可用参数。

<a name="stripe-checkout-trial-periods"></a>
#### Stripe Checkout 与试用期

当然，可以在构建通过 Stripe Checkout 完成的订阅时定义试用期：

```php
$checkout = Auth::user()->newSubscription('default', 'price_monthly')
    ->trialDays(3)
    ->checkout();
```

但试用期必须至少为 48 小时，这是 Stripe Checkout 支持的最短试用时间。

<a name="stripe-checkout-subscriptions-and-webhooks"></a>
#### 订阅与 Webhook

请记住，Stripe 和 Cashier 通过 Webhook 更新订阅状态，因此在客户输入支付信息返回应用后，订阅可能尚未活跃。为处理此场景，可能希望显示消息告知用户其支付或订阅正在处理中。

<a name="collecting-tax-ids"></a>
### 收集税号

Checkout 还支持收集客户税号。要在结账会话上启用此功能，创建会话时调用 `collectTaxIds` 方法：

```php
$checkout = $user->collectTaxIds()->checkout('price_tshirt');
```

调用此方法时，客户将看到一个新复选框，允许其表明是否以公司身份购买。如果是，则有机会提供税号。

> **Warning**  
> 如果已在应用的服务提供者中配置了[自动税务收集](#tax-configuration)，则此功能会自动启用，无需调用 `collectTaxIds` 方法。

<a name="guest-checkouts"></a>
### 游客结账

使用 `Checkout::guest` 方法，可以为应用中没有"账户"的游客发起结账会话：

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

与为现有用户创建结账会话类似，可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上可用的其他方法自定义游客结账会话：

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

游客结账完成后，Stripe 可以触发 `checkout.session.completed` Webhook 事件，因此请确保[配置 Stripe Webhook](https://dashboard.stripe.com/webhooks)以实际将此事件发送到应用。在 Stripe 控制面板中启用 Webhook 后，可以[使用 Cashier 处理 Webhook](#handling-stripe-webhooks)。Webhook 负载中包含的对象是 [`checkout` 对象](https://stripe.com/docs/api/checkout/sessions/object)，可以检查它以完成客户订单。

<a name="handling-failed-payments"></a>
## 处理支付失败

有时，订阅或单次收费的支付可能失败。此时，Cashier 会抛出 `Laravel\Cashier\Exceptions\IncompletePayment` 异常通知此情况。捕获此异常后，有两种处理方式。

首先，可以将客户重定向到 Cashier 附带的专用支付确认页面。此页面已有关联的命名路由，通过 Cashier 服务提供者注册。因此，可以捕获 `IncompletePayment` 异常并将用户重定向到支付确认页面：

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

在支付确认页面上，客户会被再次提示输入信用卡信息并执行 Stripe 要求的任何额外操作，如"3D Secure"确认。确认支付后，用户会被重定向到上述 `redirect` 参数提供的 URL。重定向时，`message`（字符串）和 `success`（整数）查询字符串变量会被添加到 URL。支付页面当前支持以下支付方式类型：

- 信用卡
- Alipay
- Bancontact
- BECS 直接借记
- EPS
- Giropay
- iDEAL
- SEPA 直接借记

或者，可以让 Stripe 处理支付确认。此时，无需重定向到支付确认页面，可以在 Stripe 控制面板中[设置 Stripe 的自动账单邮件](https://dashboard.stripe.com/account/billing/automatic)。但如果捕获到 `IncompletePayment` 异常，仍应告知用户将收到包含进一步支付确认说明的电子邮件。

使用 `Billable` Trait 的模型上的 `charge`、`invoiceFor` 和 `invoice` 方法可能抛出支付异常。与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法可能抛出未完成支付异常。

可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法判断现有订阅是否有未完成支付：

```php
if ($user->hasIncompletePayment('default')) {
    //
}

if ($user->subscription('default')->hasIncompletePayment()) {
    //
}
```

可以通过检查异常实例上的 `payment` 属性来推断未完成支付的具体状态：

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

<a name="strong-customer-authentication"></a>
## 强客户认证（SCA）

如果你的业务或某个客户位于欧洲，则需要遵守欧盟的强客户认证（SCA）法规。这些法规由欧盟于 2019 年 9 月实施，旨在防止支付欺诈。幸运的是，Stripe 和 Cashier 已准备好构建符合 SCA 的应用。

> **Warning**  
> 开始之前，请查阅 [Stripe 关于 PSD2 和 SCA 的指南](https://stripe.com/guides/strong-customer-authentication)以及[新 SCA API 文档](https://stripe.com/docs/strong-customer-authentication)。

<a name="payments-requiring-additional-confirmation"></a>
### 需要额外确认的支付

SCA 法规通常需要额外验证才能确认和处理支付。此时，Cashier 会抛出 `Laravel\Cashier\Exceptions\IncompletePayment` 异常通知需要额外验证。有关如何处理这些异常的更多信息，请参阅[处理支付失败](#handling-failed-payments)文档。

Stripe 或 Cashier 呈现的支付确认页面可能针对特定银行或发卡机构的支付流程定制，可能包括额外卡片确认、临时小额收费、独立设备认证或其他形式的验证。

<a name="incomplete-and-past-due-state"></a>
#### 未完成与过期状态

当支付需要额外确认时，订阅会保持 `incomplete` 或 `past_due` 状态，如 `stripe_status` 数据库列所示。支付确认完成且应用通过 Webhook 收到 Stripe 的完成通知后，Cashier 会自动激活客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参阅[关于这些状态的补充文档](#incomplete-and-past-due-status)。

<a name="off-session-payment-notifications"></a>
### 非会话支付通知

由于 SCA 法规要求客户在订阅活跃期间偶尔验证支付详情，Cashier 可以在需要非会话支付确认时向客户发送通知。例如，订阅续费时可能发生此情况。可以通过将 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为通知类来启用 Cashier 的支付通知。默认情况下，此通知已禁用。当然，Cashier 包含一个可用于此目的的通知类，但也可以根据需要提供自定义通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为确保非会话支付确认通知能送达，请验证应用已[配置 Stripe Webhook](#handling-stripe-webhooks)且 Stripe 控制面板中已启用 `invoice.payment_action_required` Webhook。此外，`Billable` 模型还应使用 Laravel 的 `Illuminate\Notifications\Notifiable` Trait。

> **Warning**  
> 即使客户手动进行需要额外确认的支付，也会发送通知。遗憾的是，Stripe 无法知道支付是手动完成还是"非会话"完成。但如果客户在已确认支付后访问支付页面，只会看到"支付成功"消息。客户不会被允许意外确认同一支付两次并产生意外二次收费。

<a name="stripe-sdk"></a>
## Stripe SDK

Cashier 的许多对象是 Stripe SDK 对象的包装。如果希望直接与 Stripe 对象交互，可以使用 `asStripe` 方法方便地获取它们：

```php
$stripeSubscription = $subscription->asStripeSubscription();

$stripeSubscription->application_fee_percent = 5;

$stripeSubscription->save();
```

也可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

```php
$subscription->updateStripeSubscription(['application_fee_percent' => 5]);
```

如果希望直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，可以使用此方法访问 `StripeClient` 实例并从 Stripe 账户获取价格列表：

```php
use Laravel\Cashier\Cashier;

$prices = Cashier::stripe()->prices->all();
```

<a name="testing"></a>
## 测试

测试使用 Cashier 的应用时，可以模拟对 Stripe API 的实际 HTTP 请求；但这需要部分重新实现 Cashier 自身的行为。因此，建议允许测试访问实际的 Stripe API。虽然这较慢，但能提供更多信心确保应用按预期工作，且任何慢测试可以放入其自己的 PHPUnit 测试组。

测试时请记住，Cashier 本身已有完善的测试套件，因此应只专注于测试自己应用的订阅和支付流程，而非每个底层 Cashier 行为。

开始之前，将 Stripe 密钥的**测试**版本添加到 `phpunit.xml` 文件：

```xml
<env name="STRIPE_SECRET" value="sk_test_<your-key>"/>
```

现在，测试期间与 Cashier 交互时，它会向 Stripe 测试环境发送实际 API 请求。为方便起见，应预先在 Stripe 测试账户中填充测试期间可用的订阅/价格。

> **Note**  
> 为测试各种计费场景（如信用卡拒绝和失败），可以使用 Stripe 提供的大量[测试卡号和令牌](https://stripe.com/docs/testing)。
