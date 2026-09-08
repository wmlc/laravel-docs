# 请求生命周期

- [简介](#introduction)
- [生命周期概览](#lifecycle-overview)
    - [第一步](#first-steps)
    - [HTTP / 控制台内核](#http-console-kernels)
    - [服务提供者](#service-providers)
    - [路由](#routing)
    - [收尾](#finishing-up)
- [聚焦服务提供者](#focus-on-service-providers)

<a name="introduction"></a>
## 简介

在"现实世界"中使用任何工具时，如果你了解它的工作原理，就会更有信心。应用开发也是如此。当你理解开发工具的工作方式后，使用起来会更加得心应手、充满自信。

本文档的目标是让你对 Laravel 框架的整体工作方式有一个清晰、高层级的认识。对整体框架了解得越多，一切就越不"神秘"，你在构建应用时也会更有信心。如果一开始无法理解所有术语，请不要灰心！只需对整体流程有一个基本把握，随着你阅读文档的其他章节，你的知识会不断增长。

<a name="lifecycle-overview"></a>
## 生命周期概览

<a name="first-steps"></a>
### 第一步

所有进入 Laravel 应用的请求，其入口点都是 `public/index.php` 文件。Web 服务器（Apache / Nginx）的配置会将所有请求导向该文件。`index.php` 文件本身代码并不多，它更像是加载框架其余部分的起点。

`index.php` 文件会加载 Composer 生成的自动加载器定义，然后从 `bootstrap/app.php` 获取 Laravel 应用实例。Laravel 自身采取的第一个动作是创建应用实例，即[服务容器](/docs/{{version}}/container)的实例。

<a name="http-console-kernels"></a>
### HTTP / 控制台内核

接下来，根据进入应用的请求类型，系统会调用应用实例的 `handleRequest` 或 `handleCommand` 方法，将传入的请求分发给 HTTP 内核或控制台内核。这两个内核是所有请求流转的中枢。此处我们只关注 HTTP 内核，它是 `Illuminate\Foundation\Http\Kernel` 的一个实例。

HTTP 内核定义了一个 `bootstrappers` 数组，这些引导程序会在请求执行前运行。它们负责配置错误处理、配置日志记录、[检测应用环境](/docs/{{version}}/configuration#environment-configuration)，以及执行其他在真正处理请求之前需要完成的任务。通常，这些类处理的是 Laravel 内部的配置，你无需操心。

HTTP 内核还负责将请求传递给应用的中间件栈。这些中间件负责读写 [HTTP 会话](/docs/{{version}}/session)、判断应用是否处于维护模式、[验证 CSRF 令牌](/docs/{{version}}/csrf)等等。稍后我们会详细介绍这些内容。

HTTP 内核 `handle` 方法的方法签名相当简单：它接收一个 `Request` 并返回一个 `Response`。你可以把内核想象成一个代表整个应用的大黑盒——把 HTTP 请求喂进去，它就会返回 HTTP 响应。

<a name="service-providers"></a>
### 服务提供者

内核引导过程中最重要的动作之一，是为你的应用加载[服务提供者](/docs/{{version}}/providers)。服务提供者负责引导框架的各个组件，例如数据库、队列、验证和路由组件。

Laravel 会遍历提供者列表并实例化每一个提供者。实例化之后，会依次对所有提供者调用 `register` 方法。待所有提供者注册完成后，再对每个提供者调用 `boot` 方法。这样做的目的是确保服务提供者的 `boot` 方法执行时，所有容器绑定都已注册并可用。

实质上，Laravel 提供的每一项主要功能都由某个服务提供者完成引导和配置。由于它们引导并配置了框架的众多功能，服务提供者是整个 Laravel 引导流程中最重要的环节。

尽管框架内部使用了数十个服务提供者，你同样可以选择创建自己的服务提供者。你可以在 `bootstrap/providers.php` 文件中找到应用当前使用的用户自定义或第三方服务提供者列表。

<a name="routing"></a>
### 路由

应用完成引导、所有服务提供者注册完毕之后，`Request` 会被移交给路由器进行分发。路由器会将请求分发给对应的路由或控制器，同时运行该路由专属的中间件。

中间件提供了一种便捷机制，用于过滤或检查进入应用的 HTTP 请求。例如，Laravel 内置了一个用于验证应用用户是否已认证的中间件。如果用户未认证，中间件会将其重定向到登录页面；如果用户已认证，中间件则允许请求继续深入应用。有些中间件会分配给应用内的所有路由，例如 `PreventRequestsDuringMaintenance`；有些则只分配给特定路由或路由组。你可以通过阅读完整的[中间件文档](/docs/{{version}}/middleware)了解更多信息。

如果请求通过了所匹配路由的全部中间件，路由或控制器方法便会执行，其返回的响应会再沿路由的中间件链传回。

<a name="finishing-up"></a>
### 收尾

一旦路由或控制器方法返回响应，响应便会沿路由的中间件向外回传，使应用有机会修改或检查即将发出的响应。

最后，当响应穿过中间件后，HTTP 内核的 `handle` 方法会将响应对象返回给应用实例的 `handleRequest` 方法，而该方法会对返回的响应调用 `send` 方法。`send` 方法将响应内容发送到用户的浏览器。至此，我们走完了整个 Laravel 请求生命周期！

<a name="focus-on-service-providers"></a>
## 聚焦服务提供者

服务提供者确实是引导 Laravel 应用的关键：创建应用实例、注册服务提供者、将请求交给已引导的应用。其实就是这么简单！

透彻理解 Laravel 应用如何通过服务提供者构建和引导，是非常有价值的。你的应用自定义服务提供者存放在 `app/Providers` 目录中。

默认情况下，`AppServiceProvider` 几乎是空的。这个提供者非常适合添加应用自身的引导逻辑和服务容器绑定。对于大型应用，你可能希望创建多个服务提供者，每个提供者针对应用所用的特定服务进行更细粒度的引导。
