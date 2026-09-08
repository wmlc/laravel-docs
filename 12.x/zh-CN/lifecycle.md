# 请求生命周期

- [简介](#introduction)
- [生命周期概览](#lifecycle-overview)
    - [第一步](#first-steps)
    - [HTTP / Console 内核](#http-console-kernels)
    - [服务提供者](#service-providers)
    - [路由](#routing)
    - [收尾工作](#finishing-up)
- [聚焦服务提供者](#focus-on-service-providers)

<a name="introduction"></a>
## 简介

在"现实世界"中使用任何工具时，如果你理解这个工具的工作原理，就会更有底气。应用开发也是如此。理解了开发工具的运作方式，你在使用它们时就会更加得心应手、充满信心。

本文档的目标是让你对 Laravel 框架的运作方式有一个清晰、高层次的认识。越了解框架的整体结构，你就越不会觉得一切都很"神奇"，构建应用时也会更有信心。如果一时无法理解所有术语，请不要灰心！先试着对整体流程有个基本的把握，随着你阅读文档的其他章节，你的认识自然会不断加深。

<a name="lifecycle-overview"></a>
## 生命周期概览

<a name="first-steps"></a>
### 第一步

所有发往 Laravel 应用的请求的入口都是 `public/index.php` 文件。所有请求都会由 Web 服务器（Apache / Nginx）的配置定向到这个文件。`index.php` 文件本身并没有多少代码，它只是加载框架其余部分的起点。

`index.php` 文件会加载 Composer 生成的自动加载器定义，然后从 `bootstrap/app.php` 获取 Laravel 应用的实例。Laravel 自身执行的第一个动作，就是创建应用实例/[服务容器（Service Container）](/docs/{{version}}/container)。

<a name="http-console-kernels"></a>
### HTTP / Console 内核

接下来，根据进入应用的请求类型，传入的请求会通过应用实例的 `handleRequest` 或 `handleCommand` 方法，被发送到 HTTP 内核或控制台内核。这两个内核是所有请求流经的中央枢纽。目前我们只需关注 HTTP 内核，它是 `Illuminate\Foundation\Http\Kernel` 的一个实例。

HTTP 内核定义了一个 `bootstrappers` 数组，这些引导程序会在请求实际执行前运行。它们负责配置错误处理、配置日志、[检测应用环境](/docs/{{version}}/configuration#environment-configuration)，以及完成其他需要在请求被真正处理之前做好的工作。通常，这些类处理的是 Laravel 的内部配置，你无需为此操心。

HTTP 内核还负责将请求传递给应用的中间件栈。这些中间件负责读写 [HTTP 会话](/docs/{{version}}/session)、判断应用是否处于维护模式、[验证 CSRF 令牌](/docs/{{version}}/csrf)等。稍后我们会详细讨论这些内容。

HTTP 内核的 `handle` 方法签名非常简单：接收一个 `Request`，返回一个 `Response`。你可以把内核想象成一个大黑盒，它代表你的整个应用。向它输入 HTTP 请求，它就会返回 HTTP 响应。

<a name="service-providers"></a>
### 服务提供者

内核引导过程中最重要的动作之一，就是加载应用的[服务提供者（Service Provider）](/docs/{{version}}/providers)。服务提供者负责引导框架的各种组件，例如数据库、队列、验证和路由组件。

Laravel 会遍历这个提供者列表并逐一实例化。提供者实例化之后，会先在所有提供者上调用 `register` 方法。然后，等所有提供者都注册完毕，再在每个提供者上调用 `boot` 方法。这样做是为了让服务提供者在执行 `boot` 方法时，可以依赖所有已注册且可用的容器绑定。

Laravel 提供的几乎每一项主要功能，都是由服务提供者引导和配置的。由于服务提供者要引导和配置如此之多的框架功能，它们是整个 Laravel 引导过程中最重要的一环。

框架内部使用了几十个服务提供者，你也可以创建自己的服务提供者。你可以在 `bootstrap/providers.php` 文件中找到应用正在使用的用户自定义或第三方服务提供者列表。

<a name="routing"></a>
### 路由

应用完成引导、所有服务提供者注册完毕后，`Request` 会被交给路由器进行分发。路由器会把请求分发到某个路由或控制器，同时运行该路由专属的中间件。

中间件为过滤或检查进入应用的 HTTP 请求提供了一套便捷机制。例如，Laravel 内置了一个用于验证应用用户是否已通过认证的中间件。如果用户未认证，中间件会将用户重定向到登录页面；如果用户已认证，中间件则允许请求继续深入应用。有些中间件会分配给应用中的所有路由，比如 `PreventRequestsDuringMaintenance`；而有些只分配给特定的路由或路由组。你可以阅读完整的[中间件文档](/docs/{{version}}/middleware)了解更多。

如果请求通过了匹配路由所分配的全部中间件，就会执行该路由或控制器方法，路由或控制器方法返回的响应会再沿着路由的中间件链路传回。

<a name="finishing-up"></a>
### 收尾工作

路由或控制器方法返回响应后，响应会沿路由的中间件向外传回，这让应用有机会修改或检查即将发出的响应。

最后，当响应穿越中间件传回后，HTTP 内核的 `handle` 方法会把响应对象返回给应用实例的 `handleRequest` 方法，该方法会调用返回响应上的 `send` 方法。`send` 方法将响应内容发送给用户的浏览器。至此，我们完成了对整个 Laravel 请求生命周期的探索！

<a name="focus-on-service-providers"></a>
## 聚焦服务提供者

服务提供者无疑是引导 Laravel 应用的关键所在。创建应用实例，注册服务提供者，再把请求交给完成引导的应用。就是这么简单！

深入理解 Laravel 应用的构建和通过服务提供者进行引导的过程，是非常有价值的。应用的用户自定义服务提供者存放在 `app/Providers` 目录中。

默认情况下，`AppServiceProvider` 基本是空的。这个提供者是添加应用自身的引导逻辑和服务容器绑定的绝佳位置。对于大型应用，你可以创建多个服务提供者，每个提供者针对应用使用的特定服务进行更细粒度的引导。
