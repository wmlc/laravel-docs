# HTTP 重定向

- [创建重定向](#creating-redirects)
- [重定向到命名路由](#redirecting-named-routes)
- [重定向到控制器动作](#redirecting-controller-actions)
- [重定向并闪存 Session 数据](#redirecting-with-flashed-session-data)

<a name="creating-redirects"></a>
## 创建重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的合适响应头。有多种方式可以生成 `RedirectResponse` 实例。最简单的方法是使用全局 `redirect` 助手函数：

    Route::get('/dashboard', function () {
        return redirect('/home/dashboard');
    });

有时你可能希望将用户重定向到之前的位置，例如当提交的表单无效时。你可以使用全局 `back` 助手函数来实现。由于该功能依赖于 [session](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用了 `web` 中间件组，或者应用了所有 session 中间件：

    Route::post('/user/profile', function () {
        // 验证请求...

        return back()->withInput();
    });

<a name="redirecting-named-routes"></a>
## 重定向到命名路由

当调用 `redirect` 助手函数时不传入参数，会返回一个 `Illuminate\Routing\Redirector` 实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成一个到命名路由的 `RedirectResponse`，可以使用 `route` 方法：

    return redirect()->route('login');

如果路由有参数，可以将参数作为第二个参数传递给 `route` 方法：

    // 对于以下 URI 的路由：profile/{id}

    return redirect()->route('profile', ['id' => 1]);

为了方便，Laravel 还提供了全局 `to_route` 函数：

    return to_route('profile', ['id' => 1]);

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到一个带有 "ID" 参数的路由，且该参数从 Eloquent 模型填充，你可以直接传递模型本身。ID 会被自动提取：

    // 对于以下 URI 的路由：profile/{id}

    return redirect()->route('profile', [$user]);

如果你想自定义放入路由参数的值，应该在 Eloquent 模型上覆盖 `getRouteKey` 方法：

    /**
     * 获取模型的路由键值。
     *
     * @return mixed
     */
    public function getRouteKey()
    {
        return $this->slug;
    }

<a name="redirecting-controller-actions"></a>
## 重定向到控制器动作

你也可以生成到[控制器动作](/docs/{{version}}/controllers)的重定向。为此，将控制器和动作名称传递给 `action` 方法：

    use App\Http\Controllers\HomeController;

    return redirect()->action([HomeController::class, 'index']);

如果你的控制器路由需要参数，可以将参数作为第二个参数传递给 `action` 方法：

    return redirect()->action(
        [UserController::class, 'profile'], ['id' => 1]
    );

<a name="redirecting-with-flashed-session-data"></a>
## 重定向并闪存 Session 数据

重定向到新 URL 和[向 session 闪存数据](/docs/{{version}}/session#flash-data)通常同时进行。这通常在成功执行操作后将成功消息闪存到 session 中完成。为了方便，你可以创建一个 `RedirectResponse` 实例并在一个流畅的方法链中将数据闪存到 session：

    Route::post('/user/profile', function () {
        // 更新用户资料...

        return redirect('/dashboard')->with('status', 'Profile updated!');
    });

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，在将用户重定向到新位置之前，将当前请求的输入数据闪存到 session。一旦输入数据被闪存到 session，你就可以在下一个请求中轻松地[获取它](/docs/{{version}}/requests#retrieving-old-input)：

    return back()->withInput();

用户被重定向后，你可以从 [session](/docs/{{version}}/session) 中显示闪存的消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

    @if (session('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif
