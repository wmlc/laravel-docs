# Laravel MCP

## 简介

[Laravel MCP](https://github.com/laravel/mcp) 为 AI 客户端提供了一种简洁优雅的方式来与你的 Laravel 应用通过 [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) 交互。它提供了一种表达力强、流畅的接口，用于定义服务器、工具、资源和提示，从而实现由 AI 驱动的应用交互。

## 安装

要开始使用，请通过 Composer 包管理器将 Laravel MCP 安装到你的项目中：

```shell
composer require laravel/mcp
```

### 发布路由

安装 Laravel MCP 后，执行 `vendor:publish` Artisan 命令来发布 `routes/ai.php` 文件，你将在其中定义 MCP 服务器：

```shell
php artisan vendor:publish --tag=ai-routes
```

该命令将在应用的 `routes` 目录中创建 `routes/ai.php` 文件，你将使用该文件来注册 MCP 服务器。

## 创建服务器

你可以使用 `make:mcp-server` Artisan 命令创建 MCP 服务器。服务器充当中央通信点，向 AI 客户端公开诸如工具、资源和提示之类的 MCP 能力：

```shell
php artisan make:mcp-server WeatherServer
```

该命令将在 `app/Mcp/Servers` 目录中创建一个新的服务器类。生成的服务器类继承 Laravel MCP 的基类 `Laravel\Mcp\Server`，并提供用于配置服务器和注册工具、资源及提示的属性：

```php
<?php

namespace App\Mcp\Servers;

use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use Laravel\Mcp\Server;

#[Name('Weather Server')]
#[Version('1.0.0')]
#[Instructions('This server provides weather information and forecasts.')]
class WeatherServer extends Server
{
    /**
     * The tools registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        // GetCurrentWeatherTool::class,
    ];

    /**
     * The resources registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        // WeatherGuidelinesResource::class,
    ];

    /**
     * The prompts registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        // DescribeWeatherPrompt::class,
    ];
}
```

### 服务器注册

创建服务器后，你必须在 `routes/ai.php` 文件中注册它，以使其可访问。Laravel MCP 提供两种服务器注册方法：`web` 用于可通过 HTTP 访问的服务器，`local` 用于命令行服务器。

### Web 服务器

Web 服务器是最常见的服务器类型，可通过 HTTP POST 请求访问，非常适合远程 AI 客户端或基于 Web 的集成。使用 `web` 方法注册 Web 服务器：

```php
use App\Mcp\Servers\WeatherServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/weather', WeatherServer::class);
```

与普通路由一样，你可以应用中间件来保护 Web 服务器：

```php
Mcp::web('/mcp/weather', WeatherServer::class)
    ->middleware(['throttle:mcp']);
```

### 本地服务器

本地服务器作为 Artisan 命令运行，非常适合构建本地 AI 助手集成，例如 [Laravel Boost](/topic/Laravel%2013.x/2wy3lj3ykm.html)。使用 `local` 方法注册本地服务器：

```php
use App\Mcp\Servers\WeatherServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::local('weather', WeatherServer::class);
```

注册后，通常无需手动运行 `mcp:start` Artisan 命令。请改为配置你的 MCP 客户端（AI 代理）以启动服务器，或使用 MCP Inspector。

## 工具

工具使你的服务器能够公开 AI 客户端可以调用的功能。它们允许语言模型执行操作、运行代码或与外部系统交互：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetches the current weather forecast for a specified location.')]
class CurrentWeatherTool extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        $location = $request->get('location');

        // Get weather...

        return Response::text('The weather is...');
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'location' => $schema->string()
                ->description('The location to get the weather for.')
                ->required(),
        ];
    }
}
```

### 创建工具

要创建工具，请运行 `make:mcp-tool` Artisan 命令：

```shell
php artisan make:mcp-tool CurrentWeatherTool
```

创建工具后，在服务器的 `$tools` 属性中注册它：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\CurrentWeatherTool;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * The tools registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        CurrentWeatherTool::class,
    ];
}
```

#### 工具的名称、标题和描述

默认情况下，工具的名称和标题由类名派生。例如，`CurrentWeatherTool` 的名称将是 `current-weather`，标题将是 `Current Weather Tool`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('get-optimistic-weather')]
#[Title('Get Optimistic Weather Forecast')]
class CurrentWeatherTool extends Tool
{
    // ...
}
```

工具的描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('Fetches the current weather forecast for a specified location.')]
class CurrentWeatherTool extends Tool
{
    //
}
```

> [!NOTE]
> 描述是工具元数据的关键部分，因为它有助于 AI 模型理解何时以及如何有效地使用工具。

### 工具输入 Schema

工具可以定义输入 Schema，以指定它们从 AI 客户端接受的参数。使用 Laravel 的 `Illuminate\Contracts\JsonSchema\JsonSchema` 构建器来定义工具的输入要求：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'location' => $schema->string()
                ->description('The location to get the weather for.')
                ->required(),

            'units' => $schema->string()
                ->enum(['celsius', 'fahrenheit'])
                ->description('The temperature units to use.')
                ->default('celsius'),
        ];
    }
}
```

### 工具输出 Schema

工具可以定义 [output schema](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#output-schema) 来指定其响应的结构。这能够更好地与需要可解析工具结果的 AI 客户端集成。使用 `outputSchema` 方法定义工具的输出结构：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Get the tool's output schema.
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function outputSchema(JsonSchema $schema): array
    {
        return [
            'temperature' => $schema->number()
                ->description('Temperature in Celsius')
                ->required(),

            'conditions' => $schema->string()
                ->description('Weather conditions')
                ->required(),

            'humidity' => $schema->integer()
                ->description('Humidity percentage')
                ->required(),
        ];
    }
}
```

### 验证工具参数

JSON Schema 定义为工具参数提供了基本结构，但你可能还希望强制执行更复杂的验证规则。

Laravel MCP 与 Laravel 的 [验证功能](/topic/Laravel%2013.x/e296oew9q7.html) 无缝集成。你可以在工具的 `handle` 方法中验证传入的工具参数：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'location' => 'required|string|max:100',
            'units' => 'in:celsius,fahrenheit',
        ]);

        // Fetch weather data using the validated arguments...
    }
}
```

验证失败时，AI 客户端将根据你提供的错误消息采取行动。因此，提供清晰、可操作的错误消息至关重要：

```php
$validated = $request->validate([
    'location' => ['required','string','max:100'],
    'units' => 'in:celsius,fahrenheit',
],[
    'location.required' => 'You must specify a location to get the weather for. For example, "New York City" or "Tokyo".',
    'units.in' => 'You must specify either "celsius" or "fahrenheit" for the units.',
]);
```

#### 工具依赖注入

Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 用于解析所有工具。因此，你可以在构造函数中类型提示工具可能需要的任何依赖。声明的依赖将自动解析并注入到工具实例中：

```php
<?php

namespace App\Mcp\Tools;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Create a new tool instance.
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    // ...
}
```

除了构造函数注入外，你还可以在工具的 `handle()` 方法中类型提示依赖。当调用该方法时，服务容器将自动解析并注入依赖：

```php
<?php

namespace App\Mcp\Tools;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request, WeatherRepository $weather): Response
    {
        $location = $request->get('location');

        $forecast = $weather->getForecastFor($location);

        // ...
    }
}
```

### 工具注解

你可以使用 [annotations](https://modelcontextprotocol.io/specification/2025-06-18/schema#toolannotations) 增强工具，以为 AI 客户端提供额外的元数据。这些注解有助于 AI 模型理解工具的行为和能力。注解通过属性添加到工具：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Server\Tool;

#[IsIdempotent]
#[IsReadOnly]
class CurrentWeatherTool extends Tool
{
    //
}
```

可用的注解包括：

| 注解                | 类型      | 描述                                                                                  |
| ------------------ | ------- | -------------------------------------------------------------------------------------------- |
| `#[IsReadOnly]`    | boolean | 表示该工具不会修改其环境。                                          |
| `#[IsDestructive]` | boolean | 表示该工具可能执行破坏性更新（仅在非只读时有意义）。     |
| `#[IsIdempotent]`  | boolean | 表示使用相同参数重复调用不会产生额外效果（非只读时）。 |
| `#[IsOpenWorld]`   | boolean | 表示该工具可能与外部实体交互。                                      |

可以使用布尔参数显式设置注解值：

```php
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Server\Tools\Annotations\IsDestructive;
use Laravel\Mcp\Server\Tools\Annotations\IsOpenWorld;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tool;

#[IsReadOnly(true)]
#[IsDestructive(false)]
#[IsOpenWorld(false)]
#[IsIdempotent(true)]
class CurrentWeatherTool extends Tool
{
    //
}
```

### 条件工具注册

你可以通过在工具类中实现 `shouldRegister` 方法在运行时按条件注册工具。此方法允许你根据应用状态、配置或请求参数确定工具是否可用：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Determine if the tool should be registered.
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当工具的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用工具列表中，并且不能被 AI 客户端调用。

### 工具响应

工具必须返回 `Laravel\Mcp\Response` 的实例。Response 类提供了几种用于创建不同类型响应的便捷方法：

对于简单的文本响应，使用 `text` 方法：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Handle the tool request.
 */
public function handle(Request $request): Response
{
    // ...

    return Response::text('Weather Summary: Sunny, 72°F');
}
```

若要指示在工具执行期间发生了错误，请使用 `error` 方法：

```php
return Response::error('Unable to fetch weather data. Please try again.');
```

若要返回图像或音频内容，请使用 `image` 和 `audio` 方法：

```php
return Response::image(file_get_contents(storage_path('weather/radar.png')), 'image/png');

return Response::audio(file_get_contents(storage_path('weather/alert.mp3')), 'audio/mp3');
```

你也可以使用 `fromStorage` 方法直接从 Laravel 文件系统磁盘加载图像和音频内容。MIME 类型将自动从文件中检测：

```php
return Response::fromStorage('weather/radar.png');
```

如果需要，可以指定特定的磁盘或覆盖 MIME 类型：

```php
return Response::fromStorage('weather/radar.png', disk: 's3');

return Response::fromStorage('weather/radar.png', mimeType: 'image/webp');
```

#### 多内容响应

工具可以通过返回 `Response` 实例数组来返回多个内容片段：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Handle the tool request.
 *
 * @return array<int, \Laravel\Mcp\Response>
 */
public function handle(Request $request): array
{
    // ...

    return [
        Response::text('Weather Summary: Sunny, 72°F'),
        Response::text("**Detailed Forecast**\n- Morning: 65°F\n- Afternoon: 78°F\n- Evening: 70°F")
    ];
}
```

#### 结构化响应

工具可以使用 `structured` 方法返回[结构化内容](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#structured-content)。这为 AI 客户端提供可解析的数据，同时保持与 JSON 编码文本表示的向后兼容性：

```php
return Response::structured([
    'temperature' => 22.5,
    'conditions' => 'Partly cloudy',
    'humidity' => 65,
]);
```

如果你需要在结构化内容旁边提供自定义文本，请对响应工厂使用 `withStructuredContent` 方法：

```php
return Response::make(
    Response::text('Weather is 22.5°C and sunny')
)->withStructuredContent([
    'temperature' => 22.5,
    'conditions' => 'Sunny',
]);
```

#### 流式响应

对于长时间运行的操作或实时数据流，工具可以从其 `handle` 方法返回一个 [generator](https://www.php.net/manual/en/language.generators.overview.php)。这允许在最终响应之前向客户端发送中间更新：

```php
<?php

namespace App\Mcp\Tools;

use Generator;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * Handle the tool request.
     *
     * @return \Generator<int, \Laravel\Mcp\Response>
     */
    public function handle(Request $request): Generator
    {
        $locations = $request->array('locations');

        foreach ($locations as $index => $location) {
            yield Response::notification('processing/progress', [
                'current' => $index + 1,
                'total' => count($locations),
                'location' => $location,
            ]);

            yield Response::text($this->forecastFor($location));
        }
    }
}
```

当使用基于 Web 的服务器时，流式响应会自动打开一个 SSE（Server-Sent Events）流，将每个 yield 的消息作为事件发送给客户端。

## Prompts

[Prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts) 使你的服务器能够共享可重用的提示模板，AI 客户端可使用这些模板与语言模型交互。它们提供了一种标准化的方式来构建常见的查询和交互。

### 创建 Prompts

要创建 prompt，请运行 `make:mcp-prompt` Artisan 命令：

```shell
php artisan make:mcp-prompt DescribeWeatherPrompt
```

创建 prompt 后，在服务器的 `$prompts` 属性中注册它：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Prompts\DescribeWeatherPrompt;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * The prompts registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        DescribeWeatherPrompt::class,
    ];
}
```

#### Prompt 的名称、标题和描述

默认情况下，prompt 的名称和标题由类名派生。例如，`DescribeWeatherPrompt` 的名称将是 `describe-weather`，标题将是 `Describe Weather Prompt`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('weather-assistant')]
#[Title('Weather Assistant Prompt')]
class DescribeWeatherPrompt extends Prompt
{
    // ...
}
```

Prompt 描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('Generates a natural-language explanation of the weather for a given location.')]
class DescribeWeatherPrompt extends Prompt
{
    //
}
```

> [!NOTE]
> 描述是 prompt 元数据的关键部分，因为它有助于 AI 模型理解何时以及如何充分利用该 prompt。

### Prompt 参数

Prompt 可以定义参数，允许 AI 客户端使用特定值自定义 prompt 模板。使用 `arguments` 方法定义 prompt 接受的参数：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Server\Prompt;
use Laravel\Mcp\Server\Prompts\Argument;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * Get the prompt's arguments.
     *
     * @return array<int, \Laravel\Mcp\Server\Prompts\Argument>
     */
    public function arguments(): array
    {
        return [
            new Argument(
                name: 'tone',
                description: 'The tone to use in the weather description (e.g., formal, casual, humorous).',
                required: true,
            ),
        ];
    }
}
```

### 验证 Prompt 参数

Prompt 参数会根据其定义自动验证，但你可能还希望强制执行更复杂的验证规则。

Laravel MCP 与 Laravel 的 [验证功能](/topic/Laravel%2013.x/e296oew9q7.html) 无缝集成。你可以在 prompt 的 `handle` 方法中验证传入的 prompt 参数：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * Handle the prompt request.
     */
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'tone' => 'required|string|max:50',
        ]);

        $tone = $validated['tone'];

        // Generate the prompt response using the given tone...
    }
}
```

验证失败时，AI 客户端将根据你提供的错误消息采取行动。因此，提供清晰、可操作的错误消息至关重要：

```php
$validated = $request->validate([
    'tone' => ['required','string','max:50'],
],[
    'tone.*' => 'You must specify a tone for the weather description. Examples include "formal", "casual", or "humorous".',
]);
```

### Prompt 依赖注入

Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 用于解析所有 prompts。因此，你可以在构造函数中类型提示 prompt 可能需要的任何依赖。声明的依赖将自动解析并注入到 prompt 实例中：

```php
<?php

namespace App\Mcp\Prompts;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * Create a new prompt instance.
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    //
}
```

除了构造函数注入外，你还可以在 prompt 的 `handle` 方法中类型提示依赖。当调用该方法时，服务容器将自动解析并注入依赖：

```php
<?php

namespace App\Mcp\Prompts;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * Handle the prompt request.
     */
    public function handle(Request $request, WeatherRepository $weather): Response
    {
        $isAvailable = $weather->isServiceAvailable();

        // ...
    }
}
```

### 条件 Prompt 注册

你可以通过在 prompt 类中实现 `shouldRegister` 方法在运行时按条件注册 prompts。此方法允许你根据应用状态、配置或请求参数确定 prompt 是否可用：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Prompt;

class CurrentWeatherPrompt extends Prompt
{
    /**
     * Determine if the prompt should be registered.
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当 prompt 的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用 prompts 列表中，并且不能被 AI 客户端调用。

### Prompt 响应

Prompts 可以返回单个 `Laravel\Mcp\Response` 或 `Laravel\Mcp\Response` 实例的可迭代对象。这些响应封装了将发送给 AI 客户端的内容：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * Handle the prompt request.
     *
     * @return array<int, \Laravel\Mcp\Response>
     */
    public function handle(Request $request): array
    {
        $tone = $request->string('tone');

        $systemMessage = "You are a helpful weather assistant. Please provide a weather description in a {$tone} tone.";

        $userMessage = "What is the current weather like in New York City?";

        return [
            Response::text($systemMessage)->asAssistant(),
            Response::text($userMessage),
        ];
    }
}
```

你可以使用 `asAssistant()` 方法指示响应消息应被视为来自 AI 助手，而常规消息被视为用户输入。

## Resources

[Resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources) 使你的服务器能够向 AI 客户端公开数据和内容，AI 客户端在与语言模型交互时可以读取并用作上下文。它们提供了一种共享静态或动态信息（例如文档、配置或任何有助于告知 AI 响应的数据）的方式。

## 创建 Resources

要创建 resource，请运行 `make:mcp-resource` Artisan 命令：

```shell
php artisan make:mcp-resource WeatherGuidelinesResource
```

创建 resource 后，在服务器的 `$resources` 属性中注册它：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Resources\WeatherGuidelinesResource;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * The resources registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        WeatherGuidelinesResource::class,
    ];
}
```

#### Resource 的名称、标题和描述

默认情况下，resource 的名称和标题由类名派生。例如，`WeatherGuidelinesResource` 的名称将是 `weather-guidelines`，标题将是 `Weather Guidelines Resource`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('weather-api-docs')]
#[Title('Weather API Documentation')]
class WeatherGuidelinesResource extends Resource
{
    // ...
}
```

Resource 描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('Comprehensive guidelines for using the Weather API.')]
class WeatherGuidelinesResource extends Resource
{
    //
}
```

> [!NOTE]
> 描述是 resource 元数据的关键部分，因为它有助于 AI 模型理解何时以及如何有效地使用该 resource。

### Resource Templates

[Resource templates](https://modelcontextprotocol.io/specification/2025-06-18/server/resources#resource-templates) 使你的服务器能够公开与 URI 模式匹配的动态 resources，其中包含变量。你不必为每个 resource 定义静态 URI，而是可以创建一个处理基于模板模式的多个 URI 的 resource。

#### 创建 Resource Templates

要创建 resource template，请在 resource 类上实现 `HasUriTemplate` 接口，并定义一个返回 `UriTemplate` 实例的 `uriTemplate` 方法：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Contracts\HasUriTemplate;
use Laravel\Mcp\Server\Resource;
use Laravel\Mcp\Support\UriTemplate;

#[Description('Access user files by ID')]
#[MimeType('text/plain')]
class UserFileResource extends Resource implements HasUriTemplate
{
    /**
     * Get the URI template for this resource.
     */
    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('file://users/{userId}/files/{fileId}');
    }

    /**
     * Handle the resource request.
     */
    public function handle(Request $request): Response
    {
        $userId = $request->get('userId');
        $fileId = $request->get('fileId');

        // Fetch and return the file content...

        return Response::text($content);
    }
}
```

当 resource 实现 `HasUriTemplate` 接口时，它将注册为 resource template 而不是静态 resource。然后 AI 客户端可以使用与模板模式匹配的 URI 来请求 resources，URI 中的变量将自动提取并在 resource 的 `handle` 方法中可用。

#### URI 模板语法

URI 模板使用大括号括起来占位符来定义 URI 中的变量段：

```php
new UriTemplate('file://users/{userId}');
new UriTemplate('file://users/{userId}/files/{fileId}');
new UriTemplate('https://api.example.com/{version}/{resource}/{id}');
```

#### 访问模板变量

当 URI 与你的 resource template 匹配时，提取的变量会自动合并到请求中，并可以使用 `get` 方法访问：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Contracts\HasUriTemplate;
use Laravel\Mcp\Server\Resource;
use Laravel\Mcp\Support\UriTemplate;

class UserProfileResource extends Resource implements HasUriTemplate
{
    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('file://users/{userId}/profile');
    }

    public function handle(Request $request): Response
    {
        // Access the extracted variable
        $userId = $request->get('userId');

        // Access the full URI if needed
        $uri = $request->uri();

        // Fetch user profile...

        return Response::text("Profile for user {$userId}");
    }
}
```

`Request` 对象既提供提取的变量，也提供所请求的原始 URI，为处理 resource 请求提供完整的上下文。

### Resource URI 与 MIME Type

每个 resource 由唯一的 URI 标识，并具有关联的 MIME 类型，以帮助 AI 客户端理解 resource 的格式。

默认情况下，resource 的 URI 是根据 resource 的名称生成的，因此 `WeatherGuidelinesResource` 将具有 `weather://resources/weather-guidelines` 的 URI。默认 MIME 类型是 `text/plain`。

你可以使用 `Uri` 和 `MimeType` 属性自定义这些值：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Uri('weather://resources/guidelines')]
#[MimeType('application/pdf')]
class WeatherGuidelinesResource extends Resource
{
}
```

URI 和 MIME 类型有助于 AI 客户端确定如何适当地处理和解释 resource 内容。

### Resource Request

与 tools 和 prompts 不同，resources 不能定义输入 schema 或参数。但是，你仍然可以在 resource 的 `handle` 方法内与 request 对象交互：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * Handle the resource request.
     */
    public function handle(Request $request): Response
    {
        // ...
    }
}
```

### Resource 依赖注入

Laravel [服务容器](/topic/Laravel%2013.x/x3vo054vm1.html) 用于解析所有 resources。因此，你可以在构造函数中类型提示 resource 可能需要的任何依赖。声明的依赖将自动解析并注入到 resource 实例中：

```php
<?php

namespace App\Mcp\Resources;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * Create a new resource instance.
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    // ...
}
```

除了构造函数注入外，你还可以在 resource 的 `handle` 方法中类型提示依赖。当调用该方法时，服务容器将自动解析并注入依赖：

```php
<?php

namespace App\Mcp\Resources;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * Handle the resource request.
     */
    public function handle(WeatherRepository $weather): Response
    {
        $guidelines = $weather->guidelines();

        return Response::text($guidelines);
    }
}
```

### Resource 注解

你可以使用 [annotations](https://modelcontextprotocol.io/specification/2025-06-18/schema#resourceannotations) 增强 resources，以为 AI 客户端提供额外的元数据。注解通过属性添加到 resources：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Enums\Role;
use Laravel\Mcp\Server\Annotations\Audience;
use Laravel\Mcp\Server\Annotations\LastModified;
use Laravel\Mcp\Server\Annotations\Priority;
use Laravel\Mcp\Server\Resource;

#[Audience(Role::User)]
#[LastModified('2025-01-12T15:00:58Z')]
#[Priority(0.9)]
class UserDashboardResource extends Resource
{
    //
}
```

可用的注解包括：

| 注解                | 类型          | 描述                                                                 |
| ----------------- | ------------- | --------------------------------------------------------------------------- |
| `#[Audience]`     | Role 或数组 | 指定目标受众（`Role::User`、`Role::Assistant` 或两者）。 |
| `#[Priority]`     | float         | 介于 0.0 到 1.0 之间的数字分数，表示 resource 重要性。       |
| `#[LastModified]` | string        | 显示 resource 上次更新时间的 ISO 8601 时间戳。           |

### 条件 Resource 注册

你可以通过在 resource 类中实现 `shouldRegister` 方法在运行时按条件注册 resources。此方法允许你根据应用状态、配置或请求参数确定 resource 是否可用：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * Determine if the resource should be registered.
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当 resource 的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用 resources 列表中，并且不能被 AI 客户端访问。

### Resource 响应

Resources 必须返回 `Laravel\Mcp\Response` 的实例。Response 类提供了几种用于创建不同类型响应的便捷方法：

对于简单的文本内容，使用 `text` 方法：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Handle the resource request.
 */
public function handle(Request $request): Response
{
    // ...

    return Response::text($weatherData);
}
```

#### Resource Link 响应

若要返回 resource link，请使用 `resourceLink` 方法，提供 URI 和名称。与嵌入的 resource 不同，resource link 返回一个 URI 指针，由 AI 客户端独立获取：

```php
return Response::resourceLink(
    uri: 'file:///data/report.json',
    name: 'monthly-report',
    mimeType: 'application/json',
);
```

你还可以传递已注册的 resource 类或实例，它将自动继承该 resource 的 URI、name、title、description 和 MIME type：

```php
return Response::resourceLink(new WeatherForecastResource);
```

#### Blob 响应

若要返回 blob 内容，请使用 `blob` 方法，提供 blob 内容：

```php
return Response::blob(file_get_contents(storage_path('weather/radar.png')));
```

返回 blob 内容时，MIME 类型将由 resource 配置的 MIME 类型决定：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Resource;

#[MimeType('image/png')]
class WeatherGuidelinesResource extends Resource
{
    //
}
```

#### Error 响应

若要指示在 resource 获取期间发生了错误，请使用 `error()` 方法：

```php
return Response::error('Unable to fetch weather data for the specified location.');
```

## Apps

Laravel MCP 支持 [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview)，它是 Model Context Protocol 的扩展，允许工具在受支持的主机中的沙箱 iframe 内渲染交互式 HTML 应用。这使你能够构建仪表板、表单、可视化以及其他超出纯文本响应的丰富体验。

一个 MCP app 由两个协同工作的部分组成：

- 一个返回应用自包含 HTML 的 **app resource**。
- 一个通过 `#[RendersApp]` 属性链接到 app resource 的 **tool**。当该 tool 被调用时，主机会获取并渲染链接的 resource。

### 创建 App Resources

你可以使用 `make:mcp-app-resource` Artisan 命令创建 app resource：

```shell
php artisan make:mcp-app-resource WeatherDashboardApp
```

该命令会创建两个文件：`app/Mcp/Resources` 中的 PHP 类和 `resources/views/mcp` 中的 Blade 视图。视图名称会根据类名自动推断。例如，`WeatherDashboardApp` 映射到 `mcp.weather-dashboard-app`：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\AppMeta;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\AppResource;

#[Description('An interactive weather dashboard.')]
#[AppMeta]
class WeatherDashboardApp extends AppResource
{
    /**
     * Handle the app resource request.
     */
    public function handle(Request $request): Response
    {
        return Response::view('mcp.weather-dashboard-app', [
            'title' => $this->title(),
        ]);
    }
}
```

`AppResource` 继承自基类 `Resource`，并自动配置 MCP Apps 规范所需的 `ui://` URI scheme 和 `text/html;profile=mcp-app` MIME type。与任何其他 resource 一样，你必须在服务器的 `$resources` 数组中注册它。

生成的 Blade 视图使用 `<x-mcp::app>` 组件，该组件渲染一个完整的 HTML 文档，其中打包了客户端 MCP SDK 并可以使用：

```blade
<x-mcp::app :title="$title">
    <x-slot:head>
        <script type="module">
        createMcpApp(async (app) => {
            document.getElementById('run-btn').addEventListener('click', async () => {
                const result = await app.callServerTool('get-weather-data', {});
                document.getElementById('output').textContent = result.content[0]?.text ?? '';
            });
        });
        </script>
    </x-slot:head>

    <div id="app">
        <button id="run-btn">Refresh</button>
        <p id="output"></p>
    </div>
</x-mcp::app>
```

`createMcpApp` 全局对象由捆绑的 SDK 提供，负责将 iframe 连接到服务器、应用主机主题，并公开诸如 `callServerTool`、`sendMessage`、`openLink` 等辅助函数以及事件回调。有关完整的客户端 API，请参阅 [MCP Apps 规范](https://modelcontextprotocol.io/extensions/apps/overview)。

### 从 Tools 渲染 Apps

要显示 app resource，请使用 `#[RendersApp]` 属性将 tool 链接到它。当该 tool 被调用时，Laravel MCP 会将 resource 的 URI 包含在 tool 元数据中，以便主机可以在沙箱 iframe 中渲染 app：

```php
<?php

namespace App\Mcp\Tools;

use App\Mcp\Resources\WeatherDashboardApp;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\RendersApp;
use Laravel\Mcp\Server\Tool;

#[RendersApp(resource: WeatherDashboardApp::class)]
class ShowWeatherDashboard extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        return Response::text('Weather dashboard loaded.');
    }
}
```

只要注册了任何 `AppResource`，Laravel MCP 就会自动通告 `io.modelcontextprotocol/ui` 能力，因此无需额外的服务器配置。

### App Tool 可见性

每个 `#[RendersApp]` tool 都可通过 `visibility` 参数限制谁可以调用它。这对于公开私有的、仅限应用的工具（UI 调用它们来加载或刷新数据但不让模型看到这些工具）非常有用：

```php
use Laravel\Mcp\Server\Attributes\RendersApp;
use Laravel\Mcp\Server\Ui\Enums\Visibility;

#[RendersApp(resource: WeatherDashboardApp::class, visibility: [Visibility::App])]
class GetWeatherData extends Tool
{
    // ...
}
```

`Visibility` 枚举有两种情况，`Model` 和 `App`，默认为两者都包括。使用 `[Visibility::App]` 表示 UI 直接调用的后端操作，使用 `[Visibility::Model]` 使工具对 UI 不可用。

### App 配置

app resource 上的 `#[AppMeta]` 属性用于配置 iframe 的内容安全策略、浏览器权限以及应包含在视图 `<head>` 中的任何库脚本：

```php
use Laravel\Mcp\Server\Attributes\AppMeta;
use Laravel\Mcp\Server\Ui\Enums\Library;
use Laravel\Mcp\Server\Ui\Enums\Permission;

#[AppMeta(
    connectDomains: ['https://api.weather.com'],
    permissions: [Permission::Geolocation],
    libraries: [Library::Tailwind, Library::Alpine],
)]
class WeatherDashboardApp extends AppResource
{
    // ...
}
```

`Library` 枚举包括常见前端库的预配置 CDN 脚本，例如 `Library::Tailwind` 和 `Library::Alpine`，它们的 CDN 源会自动合并到 CSP 中。`Permission` 枚举涵盖了浏览器权限，例如 `Camera`、`Microphone`、`Geolocation` 和 `ClipboardWrite`。

对于计算或动态配置，使用 `Laravel\Mcp\Server\Ui` 命名空间下的流式 `AppMeta`、`Csp` 和 `Permissions` 构建器覆盖 resource 上的 `appMeta` 方法。

### 使用 Boost 构建 Apps

Laravel MCP 包含一个专用的 [Boost](/topic/Laravel%2013.x/2ev864oyor.html) skill 参考，用于构建 MCP Apps。如果你安装了 [Laravel Boost](/topic/Laravel%2013.x/2ev864oyor.html)，你的 AI 编码代理可以调用 `mcp-development` skill，并要求它为你搭建一个 app resource、Blade 视图以及链接的 tool。

有关完整的协议参考（包括完整的客户端 API 和 schema 详细信息），请参阅官方 [MCP Apps 文档](https://modelcontextprotocol.io/extensions/apps/overview)。

## 元数据

Laravel MCP 还支持 [MCP 规范](https://modelcontextprotocol.io/specification/2025-06-18/basic#meta)中定义的 `_meta` 字段，某些 MCP 客户端或集成需要该字段。元数据可以应用于所有 MCP 原语，包括 tools、resources 和 prompts，以及它们的响应。

你可以使用 `withMeta` 方法将元数据附加到各个响应内容：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Handle the tool request.
 */
public function handle(Request $request): Response
{
    return Response::text('The weather is sunny.')
        ->withMeta(['source' => 'weather-api', 'cached' => true]);
}
```

对于应用于整个响应包络的结果级元数据，请使用 `Response::make` 包装你的响应，并在返回的响应工厂实例上调用 `withMeta`：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

/**
 * Handle the tool request.
 */
public function handle(Request $request): ResponseFactory
{
    return Response::make(
        Response::text('The weather is sunny.')
    )->withMeta(['request_id' => '12345']);
}
```

要将元数据附加到 tool、resource 或 prompt 本身，请在类上定义 `$meta` 属性：

```php
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetches the current weather forecast.')]
class CurrentWeatherTool extends Tool
{
    protected ?array $meta = [
        'version' => '2.0',
        'author' => 'Weather Team',
    ];

    // ...
}
```

## Icons

MCP 客户端可以为你的服务器及其原语显示图标。你可以使用 `Icon` 属性在服务器、tool、resource 或 prompt 上声明图标：

```php
use Laravel\Mcp\Enums\IconTheme;
use Laravel\Mcp\Server\Attributes\Icon;

#[Icon('mcp/server.png', mimeType: 'image/png', sizes: ['48x48'])]
#[Icon('mcp/server-dark.svg', theme: IconTheme::Dark)]
class WeatherServer extends Server
{
    // ...
}
```

`Icon` 属性是可重复的，因此你可以声明多个图标以提供不同尺寸或明暗主题变体。

或者，你可以通过覆盖 `icons` 方法以编程方式定义图标，当图标取决于运行时条件时这非常有用：

```php
use Laravel\Mcp\Schema\Icon;

class CurrentWeatherTool extends Tool
{
    /**
     * Get the tool's icons.
     *
     * @return array<int, Icon>
     */
    public function icons(): array
    {
        return [
            Icon::from('mcp/tool.png', mimeType: 'image/png'),
        ];
    }
}
```

通过属性和 `icons` 方法定义的图标会自动组合。图标路径解析方式如下：

- 具有 URI scheme 的路径（例如 `https:` 或 `data:`）按原样使用。
- 相对路径使用 Laravel 的 `asset` 辅助函数解析为 URL。

## Authentication

与路由一样，你可以使用中间件对 Web MCP 服务器进行身份验证。为 MCP 服务器添加身份验证将要求用户在使用服务器的任何能力之前先进行身份验证。

有两种方法可以对 MCP 服务器进行身份验证：通过 [Laravel Sanctum](/topic/Laravel%2013.x/xq9zr3jvdo.html) 进行简单的基于令牌的身份验证，或通过 `Authorization` HTTP 头传递任何令牌。或者，你也可以使用 [Laravel Passport](/topic/Laravel%2013.x/2ky04xl9z8.html) 通过 OAuth 进行身份验证。

### OAuth 2.1

保护基于 Web 的 MCP 服务器的最稳健方式是使用 [Laravel Passport](/topic/Laravel%2013.x/2ky04xl9z8.html) 的 OAuth。

通过 OAuth 对 MCP 服务器进行身份验证时，请在 `routes/ai.php` 文件中调用 `Mcp::oauthRoutes` 方法，以注册所需的 OAuth2 发现和客户端注册路由。然后，在 `routes/ai.php` 文件中将 Passport 的 `auth:api` 中间件应用于 `Mcp::web` 路由：

```php
use App\Mcp\Servers\WeatherExample;
use Laravel\Mcp\Facades\Mcp;

Mcp::oauthRoutes();

Mcp::web('/mcp/weather', WeatherExample::class)
    ->middleware('auth:api');
```

#### 全新安装 Passport

如果你的应用尚未使用 Laravel Passport，请按照 Passport 的 [安装和部署指南](/topic/Laravel%2013.x/2ky04xl9z8.html) 将 Passport 添加到你的应用。在继续之前，你应该有一个 `OAuthenticatable` model、新的身份验证 guard 和 passport 密钥。

接下来，你应该发布 Laravel MCP 提供的 Passport 授权视图：

```shell
php artisan vendor:publish --tag=mcp-views
```

然后，使用 `Passport::authorizationView` 方法指示 Passport 使用此视图。通常，应在应用的 `AppServiceProvider` 的 `boot` 方法中调用此方法：

```php
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::authorizationView(function ($parameters) {
        return view('mcp.authorize', $parameters);
    });
}
```

此视图将在身份验证期间显示给最终用户，以便拒绝或批准 AI 代理的身份验证尝试。

![Authorization screen example](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABOAAAAROCAMAAABKc73cAAAA81BMVEX////7+/v4+PgXFxfl5eUKCgr9/f1zc3P29vby8vLs7Ozj4+Pp6env7++RkZF5eXlRUVF9fX2Li4uEhISOjo4bGxt0dHS0tLTd3d12dnbLy8vW1tapqanFxcVMTEygoKDDw8PIyMgODg7BwcGwsLASEhKbm5uBgYFGRkbh4eHf398gICCXl5fS0tLR0dG6urolJSXPz8+Tk5MVFRVbW1va2tq4uLijo6NnZ2eZmZnNzc02NjZWVlaIiIhAQEClpaUuLi6enp6Hh4e2trZsbGzY2NjU1NStra28vLwyMjJjY2MpKSmVlZVfX187Ozu+vr5OTk7PbglOAABlU0lEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGB27Ci3QRiIoqiNkGWQvf/tFlNKE5VG+R1yjncwUq5eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwilAKIn325Y8zwv1VO7NuplvEFEqSeNeOeKWgYDKJkncy7zlwwSEkQ8S958zb3Xprc1AIK31peaNb3FXyjCG27LOQEjrMknclZKOvLX9SjW7DwRSct23SdsTp3DPjvlW2zhQTkBAeQyUVhXucr9NfeQtAWGNxPVJ4f7ut2ndLuMmEFrp87wq3IOSfvpmvkF4i8I9OfdbTUB49btwArcrafSt6xvcxFa4rnCP+23x/xRuY/yeFe53wNU29wTcRJ9bFbhzwG3n+PhLwH18sW8HNw4CURQEsYXQgMb5p7uGFQ6iqQrBh9b7jLxNR+pvwL3HdKBCyb7O8Ra4a8CNzzoXIGSuH0eqAQdNJtzpfkL1/1NIef0/pD47cPeFeixAyuFGvRbcexwuVKjZ1+PxN+p2Bm6f/sQANWOdu8C9XsMnOOg5P8KNh3+EuwP35N8AkjaB2+7ALUDMN3APf2XYFoGDKIG73hgEDoq+gXv4M+q2CBxECZwFB1kCZ8FBlsBZcJAlcBYcZAmcBQdZAmfBQZbAWXCQJXAWHGQJnAUHWQJnwUGWwFlwkCVwFhxkCZwFB1kCZ8FBlsBZcJAlcBYcZAmcBQdZAmfBQZbAWXCQJXAWHGQJnAUHWQJnwUGWwFlwkCVwFhxkCZwFB1kCZ8FBlsBZcJAlcBYcZAmcBQdZAmfBQZbAWXCQJXAWHGQJnAUHWQJnwUGWwFlwkCVwFhz8sXcHOWoDURRFLXkDX39e+99mQMhtKRBIRUSCV+eMuxlevbILEUvgLDiIJXAWHMQSOAtuNWP0xiIEzoJby6j9QuIWIXAW3FLGpW4Ktw6Bs+BW0pe2SdxCBM6CW8f1eKpwSxE4C24Z1+Opwq1F4Cy4VVyPpxK3GIGz4NZwPZ4q3HIEzoJbwS1vErccgbPg8t3yJnELEjgLLt1d3uoucRqXSuAsuGgPxltt437F9dgIJHAWXKoxqv50Iu39XolcHoGz4LKMm67aH6lx3Bl5qLp7XGldBoGz4GKM2l/p36/FefuQTeAsuBSvi1Vj7u/3jS8ncBZcitd5m05ibXw3gbPgQvRM3g5twmUTOAsuRM/k7dRP/8+7hi8ncBZciJqs26kFLpbAWXAh5ut2Gl0ewkUSOAsuw3hQp6mru90lcHEEzoLL0GfW6nZd958y2RdV5S1DCIGz4DL0W6/nlodwGQTOgstwJunzPo0JAmfB8SRJ2zsMX9fKIHAWXIZd4BA4Cy7VUaQSOATOgksjcAicBRfrzYFzES6DwFlwGX6K9JEfx98SuM2C48mZUuAQOAsuzLDgEDgLLpaXDAicBRdL4BA4Cy6Wi74InAUXq44kfeBX95khcBYc/ztwvmyfQeAsuA... [truncated]

> [!NOTE]
> 在这种情况下，我们只是将 OAuth 用作底层可认证 model 的转换层。我们忽略了 OAuth 的许多方面，例如 scopes。

#### 使用现有的 Passport 安装

如果你的应用已经在使用 Laravel Passport，那么 Laravel MCP 应该能在你现有的 Passport 安装中无缝工作，但目前不支持自定义 scopes，因为 OAuth 主要用作底层可认证 model 的转换层。

Laravel MCP 通过上面讨论的 `Mcp::oauthRoutes` 方法添加、通告并使用单个 `mcp:use` scope。

#### Passport 与 Sanctum

OAuth2.1 是 Model Context Protocol 规范中记录的身份验证机制，也是 MCP 客户端中最广泛支持的方式。因此，我们建议尽可能使用 Passport。

如果你的应用已经在使用 [Sanctum](/topic/Laravel%2013.x/xq9zr3jvdo.html)，那么添加 Passport 可能会很麻烦。在这种情况下，我们建议在明确需要使用仅支持 OAuth 的 MCP 客户端之前，使用 Sanctum 而不使用 Passport。

### Sanctum

如果你希望使用 [Sanctum](/topic/Laravel%2013.x/xq9zr3jvdo.html) 保护你的 MCP 服务器，只需在 `routes/ai.php` 文件中将 Sanctum 的身份验证中间件添加到你的服务器。然后，确保你的 MCP 客户端提供 `Authorization: Bearer <token>` 头以确保成功进行身份验证：

```php
use App\Mcp\Servers\WeatherExample;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/demo', WeatherExample::class)
    ->middleware('auth:sanctum');
```

#### 自定义 MCP 身份验证

如果你的应用发布自己的自定义 API 令牌，则可以通过将任何中间件分配给你的 `Mcp::web` 路由来对 MCP 服务器进行身份验证。你的自定义中间件可以手动检查 `Authorization` 头以对传入的 MCP 请求进行身份验证。

## Authorization

你可以通过 `$request->user()` 方法访问当前已通过身份验证的用户，从而可以在 MCP tools 和 resources 中执行 [授权检查](/topic/Laravel%2013.x/2wy3l43ykm.html)：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Handle the tool request.
 */
public function handle(Request $request): Response
{
    if (! $request->user()->can('read-weather')) {
        return Response::error('Permission denied.');
    }

    // ...
}
```

## MCP Client

除了构建服务器之外，Laravel MCP 还包括一个用于连接到其他 MCP 服务器（无论是一方还是第三方）的客户端。该客户端让你的应用能够发现并调用 MCP 服务器公开的工具，这对于让你的 [AI 代理](/topic/Laravel%2013.x/ndvm3dj93j.html) 访问外部 MCP 服务器提供的能力特别有用。

### 连接到服务器

你可以使用 `Client::web` 方法连接到可通过 HTTP 访问的 MCP 服务器，传入服务器的 URL：

```php
use Laravel\Mcp\Client;

$client = Client::web('https://mcp.example.com');
```

要连接到作为命令运行的本地 MCP 服务器，请使用 `Client::local` 方法，提供启动服务器所需的命令和任何参数：

```php
use Laravel\Mcp\Client;

$client = Client::local('php', ['artisan', 'mcp:start']);
```

客户端是惰性连接的，会在首次列出或调用工具时自动建立连接。如果需要手动管理连接，可以使用 `connect`、`connected`、`ping` 和 `disconnect` 方法：

```php
$client->connect();

$client->ping();

if ($client->connected()) {
    // ...
}

$client->disconnect();
```

你可以使用 `withTimeout` 方法自定义请求超时：

```php
$client = Client::web('https://mcp.example.com')->withTimeout(30);
```

### 命名客户端

你可以注册可重用的命名客户端，而不必在每次需要时构造一个客户端。这通常在服务提供者的 `boot` 方法中使用 `Mcp` Facade 完成：

```php
use Laravel\Mcp\Client;
use Laravel\Mcp\Facades\Mcp;

Mcp::registerClient('github', fn () => Client::web('https://mcp.example.com'));
```

注册后，你可以在应用的任何位置按名称解析该客户端：

```php
use Laravel\Mcp\Facades\Mcp;

$client = Mcp::client('github');
```

命名客户端在每个请求中解析一次，并在请求生命周期结束时自动断开连接。

### 客户端身份验证

要连接到受 bearer token 保护的 Web MCP 服务器，请使用 `withToken` 方法。你可以传入令牌字符串或惰性解析令牌的闭包：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Client;

$client = Client::web('https://mcp.example.com')->withToken($token);

$client = Client::web('https://mcp.example.com')->withToken(
    fn () => Auth::user()->mcpToken(),
);
```

对于受 OAuth 2.1 保护的服务器，请使用 `withOAuth` 方法配置客户端。这是在你自己的服务器上使用 OAuth 进行保护的客户端对应操作：

```php
use Laravel\Mcp\Client;
use Laravel\Mcp\Facades\Mcp;

Mcp::registerClient('github', fn () => Client::web('https://mcp.example.com')->withOAuth(
    clientId: config('services.github_mcp.client_id'),
    clientSecret: config('services.github_mcp.client_secret'),
));
```

> [!NOTE]
> 当 MCP 服务器支持 [动态客户端注册](https://datatracker.ietf.org/doc/html/rfc7591) 时，可以省略 `clientId` 和 `clientSecret` 参数，在这种情况下客户端会自动注册自己。

接下来，使用 `oAuthRoutesFor` 方法在 `routes/ai.php` 文件中为命名客户端注册 OAuth 路由。你提供的闭包接收客户端名称以及在授权码交换为访问令牌后的 `TokenSet`：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Client\OAuth\TokenSet;
use Laravel\Mcp\Facades\Mcp;

Mcp::oAuthRoutesFor('github', function (string $client, TokenSet $token) {
    Auth::user()->update([
        'github_mcp_token' => $token->accessToken,
    ]);

    return redirect('/dashboard');
});
```

这会注册两个命名路由：一个连接路由（`mcp.oauth.{client}.connect`），将用户重定向到授权服务器；一个回调路由（`mcp.oauth.{client}.callback`），用于交换授权码并调用你的处理程序。两条路由默认都使用 `web` 中间件组，你可以使用 `middleware` 参数覆盖。

要开始授权流程，将用户重定向到连接路由：

```php
return redirect()->route('mcp.oauth.github.connect');
```

### Tools

你可以使用 `tools` 方法检索 MCP 服务器公开的工具，该方法返回按名称索引的工具集合：

```php
use Laravel\Mcp\Facades\Mcp;

$tools = Mcp::client('github')->tools();

foreach ($tools as $tool) {
    $tool->name;
    $tool->title;
    $tool->description;
    $tool->inputSchema;
}
```

客户端会自动对所有可用工具进行分页。你可以使用 `limit` 参数限制返回的工具数量：

```php
$tools = Mcp::client('github')->tools(limit: 10);
```

要调用 tool，请使用 `callTool` 方法，传入 tool 名称和参数数组。返回的 `ToolResult` 实例公开 tool 响应：

```php
use Laravel\Mcp\Facades\Mcp;

$result = Mcp::client('github')->callTool('current-weather', [
    'location' => 'New York',
]);

$result->text(); // The text content of the response...
(string) $result; // Equivalent to calling text()...
$result->isError; // Whether the tool reported an error...
$result->structuredContent;  // Structured content, if any...
```

或者，你可以直接从列出的 tool 实例调用 tool：

```php
$tools = Mcp::client('github')->tools();

$result = $tools['current-weather']->call([
    'location' => 'New York',
]);
```

如果你正在使用 [Laravel AI SDK](/topic/Laravel%2013.x/ndvm3dj93j.html) 构建代理，你也可以将来自 MCP 客户端的 tools 直接提供给代理，从而允许模型在响应 prompt 时调用它们。有关更多信息，请参阅 AI SDK 文档的 [MCP Tools](/topic/Laravel%2013.x/ndvm3dj93j.html) 部分。

### Prompts

你可以使用 `prompts` 方法检索 MCP 服务器公开的 prompts，该方法返回按名称索引的 prompts 集合：

```php
use Laravel\Mcp\Facades\Mcp;

$prompts = Mcp::client('github')->prompts();

foreach ($prompts as $prompt) {
    $prompt->name;
    $prompt->title;
    $prompt->description;
    $prompt->arguments;
}
```

客户端会自动对所有可用 prompts 进行分页。你可以使用 `limit` 参数限制返回的 prompts 数量：

```php
$prompts = Mcp::client('github')->prompts(limit: 10);
```

要检索 prompt，请使用 `getPrompt` 方法，传入 prompt 名称和参数数组。返回的 `PromptResult` 实例公开生成的消息：

```php
use Laravel\Mcp\Facades\Mcp;

$result = Mcp::client('github')->getPrompt('describe-weather', [
    'location' => 'New York',
]);

$result->text(); // The text content of the messages...
(string) $result; // Equivalent to calling text()...
$result->messages; // The raw messages returned by the prompt...
$result->description; // The prompt description, if any...
```

### Resources

你可以使用 `resources` 方法检索 MCP 服务器公开的 resources，该方法返回按 URI 索引的 resources 集合：

```php
use Laravel\Mcp\Facades\Mcp;

$resources = Mcp::client('github')->resources();

foreach ($resources as $resource) {
    $resource->uri;
    $resource->name;
    $resource->title;
    $resource->description;
    $resource->mimeType;
    $resource->size;
}
```

客户端会自动对所有可用 resources 进行分页。你可以使用 `limit` 参数限制返回的 resources 数量：

```php
$resources = Mcp::client('github')->resources(limit: 10);
```

要读取 resource，请使用 `readResource` 方法，传入 resource URI。返回的 `ResourceReadResult` 实例公开 resource 内容：

```php
use Laravel\Mcp\Facades\Mcp;

$result = Mcp::client('github')->readResource('weather://guidelines');

$result->content(); // The content of the resource, decoding base64 blobs as needed...
(string) $result; // Equivalent to calling content()...
$result->mimeType(); // The MIME type of the resource, if any...
$result->contents; // The raw contents returned by the resource...
```

## Testing Servers

你可以使用内置的 MCP Inspector 或通过编写单元测试来测试 MCP 服务器。

### MCP Inspector

[MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) 是用于测试和调试 MCP 服务器的交互式工具。使用它连接到你的服务器、验证身份验证以及试用 tools、resources 和 prompts。

你可以为任何已注册的服务器运行 inspector：

```shell
# Web server...
php artisan mcp:inspector mcp/weather

# Local server named "weather"...
php artisan mcp:inspector weather
```

该命令会启动 MCP Inspector，并提供你可以复制到 MCP 客户端中的客户端设置，以确保所有内容都已正确配置。如果你的 Web 服务器受身份验证中间件保护，请确保在连接时包含所需的头，例如 `Authorization` bearer token。

### 单元测试

你可以为 MCP 服务器、tools、resources 和 prompts 编写单元测试。

要开始使用，请创建一个新的测试用例，并在注册它的服务器上调用所需原语。例如，要测试 `WeatherServer` 上的 tool：

```php tab=Pest
test('tool', function () {
    $response = WeatherServer::tool(CurrentWeatherTool::class, [
        'location' => 'New York City',
        'units' => 'fahrenheit',
    ]);

    $response
        ->assertOk()
        ->assertSee('The current weather in New York City is 72°F and sunny.');
});
```

```php tab=PHPUnit
/**
 * Test a tool.
 */
public function test_tool(): void
{
    $response = WeatherServer::tool(CurrentWeatherTool::class, [
        'location' => 'New York City',
        'units' => 'fahrenheit',
    ]);

    $response
        ->assertOk()
        ->assertSee('The current weather in New York City is 72°F and sunny.');
}
```

类似地，你可以测试 prompts 和 resources：

```php
$response = WeatherServer::prompt(...);
$response = WeatherServer::resource(...);
```

你还可以在调用原语之前通过链接 `actingAs` 方法以已认证用户的身份进行操作：

```php
$response = WeatherServer::actingAs($user)->tool(...);
```

收到响应后，你可以使用各种断言方法来验证响应的内容和状态。

你可以使用 `assertOk` 方法断言响应成功。这会检查响应没有任何错误：

```php
$response->assertOk();
```

你可以使用 `assertSee` 方法断言响应包含特定文本：

```php
$response->assertSee('The current weather in New York City is 72°F and sunny.');
```

你可以使用 `assertHasErrors` 方法断言响应包含错误：

```php
$response->assertHasErrors();

$response->assertHasErrors([
    'Something went wrong.',
]);
```

你可以使用 `assertHasNoErrors` 方法断言响应不包含错误：

```php
$response->assertHasNoErrors();
```

你可以使用 `assertName()`、`assertTitle()` 和 `assertDescription()` 方法断言响应包含特定元数据：

```php
$response->assertName('current-weather');
$response->assertTitle('Current Weather Tool');
$response->assertDescription('Fetches the current weather forecast for a specified location.');
```

你可以使用 `assertSentNotification` 和 `assertNotificationCount` 方法断言已发送通知：

```php
$response->assertSentNotification('processing/progress', [
    'step' => 1,
    'total' => 5,
]);

$response->assertSentNotification('processing/progress', [
    'step' => 2,
    'total' => 5,
]);

$response->assertNotificationCount(5);
```

最后，如果你希望检查原始响应内容，可以使用 `dd` 或 `dump` 方法输出响应以进行调试：

```php
$response->dd();
$response->dump();
```