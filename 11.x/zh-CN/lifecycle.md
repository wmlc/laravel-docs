# 请求生命周期

- [简介](#introduction)
- [生命周期概览](#lifecycle-overview)
    - [第一步](#first-steps)
    - [HTTP / Console 内核](#http-console-kernels)
    - [服务提供者](#service-providers)
    - [路由](#routing)
    - [收尾](#finishing-up)
- [聚焦服务提供者](#focus-on-service-providers)

<a name="introduction"></a>
## 简介

使用任何工具时，如果你了解它的工作原理，用起来就会更有信心。应用开发也不例外。当你理解开发工具的运作方式后，使用它们时就会更从容、更自信。

本文旨在为你提供一份关于 Laravel 框架如何工作的良好高层概览。越是了解整个框架，一切就越显得不那么"神奇"，你构建应用时也会越有信心。如果一时无法理解所有术语，请不要灰心！先试着基本把握其中的脉络，随着你阅读文档的其他章节，知识会不断增长。

<a name="lifecycle-overview"></a>
## 生命周期概览

<a name="first-steps"></a>
### 第一步

所有发往 Laravel 应用的请求都以 `public/index.php` 文件作为入口。你的 Web 服务器（Apache / Nginx）配置会把所有请求都指向这个文件。`index.php` 文件本身代码不多，它只是加载框架其余部分的起点。

`index.php` 文件会加载 Composer 生成的自动加载定义，然后从 `bootstrap/app.php` 中取出 Laravel 应用的一个实例。Laravel 自身执行的第一件事，就是创建应用 / [服务容器（Service Container）](/docs/{{version}}/container)的一个实例。

<a name="http-console-kernels"></a>
### HTTP / Console 内核

接下来，根据进入应用的请求类型，请求会被交给 HTTP 内核或 Console 内核处理，对应调用应用实例的 `handleRequest` 或 `handleCommand` 方法。这两个内核是所有请求流经的中央枢纽。暂时我们只关注 HTTP 内核，它是 `Illuminate\Foundation\Http\Kernel` 的一个实例。

HTTP 内核定义了一组 `bootstrappers` 数组，会在请求被执行之前运行。这些引导器负责配置错误处理、配置日志、[检测应用环境](/docs/{{version}}/configuration#environment-configuration)，以及执行其他在真正处理请求前需要完成的任务。这些类通常负责 Laravel 内部配置，你无需操心。

HTTP 内核还负责让请求穿过应用的中间件栈。这些中间件负责读写 [HTTP 会话](/docs/{{version}}/session)、判断应用是否处于维护模式、[校验 CSRF 令牌](/docs/{{version}}/csrf)等等。我们稍后会再详细讨论它们。

HTTP 内核 `handle` 方法的签名非常简单：接收一个 `Request` 并返回一个 `Response`。你可以把内核想象成一个代表整个应用的大黑盒：投入 HTTP 请求，它就返回 HTTP 响应。

<a name="service-providers"></a>
### 服务提供者

内核引导过程中最重要的动作之一，就是为你的应用加载[服务提供者（Service Provider）](/docs/{{version}}/providers)。服务提供者负责引导框架的各个组件，例如数据库、队列、验证和路由组件。

Laravel 会遍历这份提供者列表并实例化其中的每一个。实例化完成后，所有提供者的 `register` 方法都会被调用。等所有提供者都注册完毕后，再逐个调用它们的 `boot` 方法。这样安排是为了让服务提供者的 `boot` 方法执行时，所有容器绑定都已注册并可用。

Laravel 提供的每一项主要功能，实质上都是由服务提供者引导和配置的。正因为服务提供者引导并配置了框架提供的众多功能，它们成为整个 Laravel 引导过程中最重要的一环。

框架内部使用了数十个服务提供者，你也可以选择创建自己的服务提供者。你可以在 `bootstrap/providers.php` 文件中找到应用正在使用的用户自定义或第三方服务提供者列表。

<a name="routing"></a>
### 路由

应用完成引导、所有服务提供者注册完毕后，`Request` 会被移交给路由器分发。路由器会把请求分发到某个路由或控制器，同时运行该路由特有的中间件。

中间件为过滤或检查进入应用的 HTTP 请求提供了便利的机制。例如，Laravel 内置了一个中间件，用于验证应用的用户是否已认证。若用户未认证，中间件把用户重定向到登录页面；若用户已认证，中间件则允许请求继续进入应用。有些中间件会分配给应用中所有路由，例如 `PreventRequestsDuringMaintenance`；另一些则只分配给特定路由或路由组。你可以阅读完整的[中间件文档](/docs/{{version}}/middleware)了解更多内容。

如果请求穿过了匹配到的路由所分配的全部中间件，路由或控制器方法就会被执行，其返回的响应会再穿过该路由的中间件链回传。

<a name="finishing-up"></a>
### 收尾

一旦路由或控制器方法返回响应，响应就会沿原路向外穿过路由的中间件，这给了应用修改或检查传出响应（outgoing response）的机会。

最后，响应穿过中间件返回后，HTTP 内核的 `handle` 方法把响应对象返回给应用实例的 `handleRequest`，该方法再对返回的响应调用 `send` 方法。`send` 方法把响应内容发送给用户的 Web 浏览器。至此，我们就走完了整个 Laravel 请求生命周期！

<a name="focus-on-service-providers"></a>
## 聚焦服务提供者

服务提供者确实是引导 Laravel 应用的关键：创建应用实例、注册服务提供者、再把请求移交给已引导的应用。事情就是这么简单！

牢固掌握 Laravel 应用如何借助服务提供者构建和引导非常有价值。你应用中用户自定义的服务提供者存放在 `app/Providers` 目录中。

默认情况下，`AppServiceProvider` 内容相当空。这个提供者非常适合用来添加你自己的应用引导逻辑和服务容器绑定。对于大型应用，你可能希望创建多个服务提供者，为应用用到的各项服务提供更细粒度的引导。
