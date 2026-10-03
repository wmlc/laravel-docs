# HTTP 重定向

- [创建重定向](#creating-redirects)
- [重定向到命名路由](#redirecting-named-routes)
- [重定向到控制器动作](#redirecting-controller-actions)
- [携带临时会话数据重定向](#redirecting-with-flashed-session-data)

<a name="creating-redirects"></a>
## 创建重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的各种响应头。生成 `RedirectResponse` 实例有多种方式，最简单的是使用全局的 `redirect` 辅助函数：

    Route::get('/dashboard', function () {
        return redirect('/home/dashboard');
    });

有时你可能希望把用户重定向回上一个位置，比如提交的表单验证失败时。此时可以使用全局的 `back` 辅助函数。由于该功能依赖[会话](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用了 `web` 中间件组，或已应用全部会话中间件：

    Route::post('/user/profile', function () {
        // 验证请求……

        return back()->withInput();
    });

<a name="redirecting-named-routes"></a>
## 重定向到命名路由

不带参数调用 `redirect` 辅助函数时，会返回一个 `Illuminate\Routing\Redirector` 实例，你可以在该实例上调用任意方法。例如，要生成指向某个命名路由的 `RedirectResponse`，可以使用 `route` 方法：

    return redirect()->route('login');

如果你的路由带有参数，可以把它们作为 `route` 方法的第二个参数传入：

    // 对于 URI 为 profile/{id} 的路由

    return redirect()->route('profile', ['id' => 1]);

为方便起见，Laravel 还提供了全局的 `to_route` 函数：

    return to_route('profile', ['id' => 1]);

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到一个带"ID"参数的路由，且该参数来自某个 Eloquent 模型，可以直接传入模型本身，ID 会被自动提取：

    // 对于 URI 为 profile/{id} 的路由

    return redirect()->route('profile', [$user]);

如果你想自定义放入路由参数的值，应覆盖 Eloquent 模型上的 `getRouteKey` 方法：

    /**
     * 获取模型的路由键值。
     */
    public function getRouteKey(): mixed
    {
        return $this->slug;
    }

<a name="redirecting-controller-actions"></a>
## 重定向到控制器动作

你也可以生成指向[控制器动作](/docs/{{version}}/controllers)的重定向。为此，把控制器和动作名传给 `action` 方法：

    use App\Http\Controllers\HomeController;

    return redirect()->action([HomeController::class, 'index']);

如果你的控制器路由需要参数，可以把它们作为 `action` 方法的第二个参数传入：

    return redirect()->action(
        [UserController::class, 'profile'], ['id' => 1]
    );

<a name="redirecting-with-flashed-session-data"></a>
## 携带临时会话数据重定向

重定向到新 URL 与[向会话写入临时数据](/docs/{{version}}/session#flash-data)通常是一起完成的。常见做法是在成功执行某个操作后，把一条成功消息闪存到会话中。为方便起见，你可以创建 `RedirectResponse` 实例，并用一条流畅的方法链完成创建和闪存数据两件事：

    Route::post('/user/profile', function () {
        // 更新用户资料……

        return redirect('/dashboard')->with('status', 'Profile updated!');
    });

在把用户重定向到新位置之前，你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法，把当前请求的输入数据闪存到会话中。一旦输入数据已闪存到会话，你就可以在下次请求中轻松地[取出它们](/docs/{{version}}/requests#retrieving-old-input)：

    return back()->withInput();

用户被重定向之后，你可以显示来自[会话](/docs/{{version}}/session)的临时消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

    @if (session('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif
