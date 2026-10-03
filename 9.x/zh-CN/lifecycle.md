# 请求生命周期

- [简介](#introduction)
- [生命周期概述](#lifecycle-overview)
    - [第一步](#first-steps)
    - [HTTP / Console 内核](#http-console-kernels)
    - [服务提供者](#service-providers)
    - [路由](#routing)
    - [收尾工作](#finishing-up)
- [聚焦服务提供者](#focus-on-service-providers)

<a name="introduction"></a>
## 简介

在「现实世界」中使用任何工具时，如果你了解该工具的工作原理，就会更有信心。应用开发也是如此。当你理解了开发工具的运作方式，使用它们时就会更加得心应手、信心十足。

本文档旨在为你提供 Laravel 框架工作原理的良好高层概览。通过更好地了解整个框架，一切都不再那么「神奇」，你构建应用时也会更有信心。如果你一时无法理解所有术语，别灰心！只要先对整体流程有个基本把握，随着你阅读文档的其他章节，知识自然会不断增长。

<a name="lifecycle-overview"></a>
## 生命周期概述

<a name="first-steps"></a>
### 第一步

所有进入 Laravel 应用的请求，入口都是 `public/index.php` 文件。Web 服务器（Apache / Nginx）的配置会将所有请求导向此文件。`index.php` 文件本身代码不多，它只是加载框架其余部分的起点。

`index.php` 文件加载 Composer 生成的自动加载器定义，然后从 `bootstrap/app.php` 获取 Laravel 应用实例。Laravel 自身执行的第一个动作就是创建应用实例 / [服务容器（Service Container）](/docs/{{version}}/container)。

<a name="http-console-kernels"></a>
### HTTP / Console 内核

接下来，根据进入应用的请求类型，传入请求会被发送到 HTTP 内核或 Console 内核。这两个内核是所有请求流经的中心位置。目前我们先关注 HTTP 内核，它位于 `app/Http/Kernel.php`。

HTTP 内核继承 `Illuminate\Foundation\Http\Kernel` 类，该类定义了一组 `bootstrappers`，会在请求执行之前运行。这些引导器配置错误处理、配置日志、[检测应用环境](/docs/{{version}}/configuration#environment-configuration)，并完成其他在请求真正被处理之前必须完成的任务。通常，这些类处理的是 Laravel 内部配置，你无需操心。

HTTP 内核还定义了一组 HTTP [中间件](/docs/{{version}}/middleware)，所有请求在被应用处理之前都必须经过这些中间件。这些中间件负责读写 [HTTP 会话](/docs/{{version}}/session)、判断应用是否处于维护模式、[校验 CSRF 令牌](/docs/{{version}}/csrf) 等等。我们稍后再详细讨论。

HTTP 内核 `handle` 方法的方法签名非常简单：接收一个 `Request`，返回一个 `Response`。可以把内核想象成一个代表整个应用的大黑盒。向它输入 HTTP 请求，它就会返回 HTTP 响应。

<a name="service-providers"></a>
### 服务提供者

内核引导过程中最重要的操作之一，就是为应用加载[服务提供者（Service Provider）](/docs/{{version}}/providers)。服务提供者负责引导框架的各种组件，例如数据库、队列、验证和路由组件。应用的所有服务提供者都配置在 `config/app.php` 配置文件的 `providers` 数组中。

Laravel 会遍历此提供者列表并逐一实例化。实例化提供者之后，会在所有提供者上调用 `register` 方法。然后，当所有提供者都注册完毕，再在每个提供者上调用 `boot` 方法。这样设计是为了让服务提供者在执行 `boot` 方法时，可以依赖所有已注册并可用的容器绑定。

Laravel 提供的每一个主要功能几乎都由服务提供者来引导和配置。由于服务提供者引导并配置了框架提供的如此多的功能，它们是整个 Laravel 引导（启动）过程中最重要的部分。

<a name="routing"></a>
### 路由

应用中最重要的服务提供者之一是 `App\Providers\RouteServiceProvider`。该服务提供者加载应用 `routes` 目录中的路由文件。不妨打开 `RouteServiceProvider` 的代码，看看它是如何工作的！

当应用完成引导、所有服务提供者都注册完毕后，`Request` 会被交给路由器进行分发。路由器会将请求分发到某条路由或控制器，同时运行该路由专属的中间件。

中间件为过滤或检查进入应用的 HTTP 请求提供了一种便捷机制。例如，Laravel 内置了一个中间件，用于校验应用用户是否已认证。如果用户未认证，中间件会将用户重定向到登录界面；如果用户已认证，中间件会放行请求，让其继续深入应用。有些中间件会分配给应用中的所有路由，比如 HTTP 内核 `$middleware` 属性中定义的那些；而有些中间件只分配给特定的路由或路由分组。阅读完整的[中间件文档](/docs/{{version}}/middleware) 可以了解更多。

如果请求通过了匹配路由所分配的所有中间件，就会执行该路由或控制器方法，路由或控制器方法返回的响应会沿着路由的中间件链原路返回。

<a name="finishing-up"></a>
### 收尾工作

一旦路由或控制器方法返回了响应，该响应会沿着路由的中间件向外回传，让应用有机会修改或检查输出的响应。

最后，当响应回传经过中间件之后，HTTP 内核的 `handle` 方法返回响应对象，`index.php` 文件调用所返回响应的 `send` 方法。`send` 方法将响应内容发送到用户的 Web 浏览器。我们走完了整个 Laravel 请求生命周期的旅程！

<a name="focus-on-service-providers"></a>
## 聚焦服务提供者

服务提供者才是引导 Laravel 应用的真正关键。创建应用实例、注册服务提供者、将请求交给已引导的应用。就这么简单！

牢牢掌握 Laravel 应用如何通过服务提供者构建和引导，非常有价值。应用的默认服务提供者存放在 `app/Providers` 目录。

默认情况下，`AppServiceProvider` 基本是空的。这个提供者是添加应用自身的引导逻辑和服务容器绑定的好地方。对于大型应用，你可能希望创建多个服务提供者，每个提供者针对应用使用的特定服务进行更细粒度的引导。
