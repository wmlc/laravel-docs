# Laravel AI SDK

## 简介

[Laravel AI SDK](https://github.com/laravel/ai) 提供了一套统一、表达力强的 API，用于与 OpenAI、Anthropic、Gemini 等 AI 提供商（provider）交互。借助 AI SDK，你可以构建带工具与结构化输出的智能体（agent）、生成图像、合成与转录音频、创建向量嵌入，等等——全部使用一致且对 Laravel 友好的接口。

## 安装

你可以通过 Composer 安装 Laravel AI SDK：

```shell
composer require laravel/ai
```

接下来，使用 `vendor:publish` Artisan 命令发布 AI SDK 的配置文件与数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

最后，运行应用的数据库迁移。这会创建 AI SDK 用于支撑对话存储的 `agent_conversations` 与 `agent_conversation_messages` 两张表：

```shell
php artisan migrate
```

### 配置

你可以在应用的 `config/ai.php` 配置文件中，或以环境变量形式在应用的 `.env` 文件中定义 AI 提供商凭据：

```ini
ANTHROPIC_API_KEY=
AZURE_OPENAI_API_KEY=
COHERE_API_KEY=
DEEPSEEK_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
OLLAMA_API_KEY=
OPENAI_API_KEY=
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_URL=
OPENROUTER_API_KEY=
JINA_API_KEY=
VOYAGEAI_API_KEY=
XAI_API_KEY=
```

用于文本、图像、音频、转录与嵌入的默认模型，也可在应用的 `config/ai.php` 配置文件中配置。

### 自定义基础 URL

默认情况下，Laravel AI SDK 会直接连接各提供商的公开 API 端点。但有时你需要将请求路由到其他端点——例如使用代理服务集中管理 API 密钥、实施限流，或将流量经由企业网关路由时。

你可以通过在提供商配置中添加 `url` 参数来配置自定义基础 URL：

```php
'providers' => [
    'openai' => [
        'driver' => 'openai',
        'key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_URL'),
    ],

    'anthropic' => [
        'driver' => 'anthropic',
        'key' => env('ANTHROPIC_API_KEY'),
        'url' => env('ANTHROPIC_BASE_URL'),
    ],
],
```

当你通过代理服务（如 LiteLLM 或 Azure OpenAI Gateway）路由请求，或使用其他端点时，这会很有用。

OpenAI、Anthropic、Gemini、Groq、Cohere、DeepSeek、xAI、OpenRouter 均支持自定义基础 URL。

### 兼容 OpenAI 的服务商

如果你使用的是 OpenAI 兼容 API，例如 LM Studio、vLLM、Together、Fireworks 或本地网关，可以配置一个 `openai-compatible` 提供商。`url` 选项为必填，`key` 选项可选，存在时作为 Bearer Token 发送：

```php
'providers' => [
    'local' => [
        'driver' => 'openai-compatible',
        'url' => env('LOCAL_AI_URL'),
        'key' => env('LOCAL_AI_API_KEY'),
    ],
],
```

配置完成后，你可以像使用其他提供商一样使用这个命名提供商：

```php
agent()->prompt('What is Laravel?', provider: 'local', model: 'local-model');
```

你也可以为该提供商配置默认文本模型，从而无需显式传入模型：

```php
'local' => [
    'driver' => 'openai-compatible',
    'url' => env('LOCAL_AI_URL'),
    'key' => env('LOCAL_AI_API_KEY'),
    'models' => [
        'text' => [
            'default' => env('LOCAL_AI_MODEL'),
        ],
    ],
],
```

你可以在其配置中定义 `headers` 数组，为发往该提供商的每个请求附加自定义 HTTP 头。当某个端点除了 Bearer Token 之外还需要额外的标识或认证头时，这会很有用：

```php
'local' => [
    'driver' => 'openai-compatible',
    'url' => env('LOCAL_AI_URL'),
    'key' => env('LOCAL_AI_API_KEY'),
    'headers' => [
        'X-Tenant-Id' => env('LOCAL_AI_TENANT_ID'),
    ],
],
```

OpenAI 兼容提供商支持文本生成、流式传输、工具、结构化输出、图像附件、嵌入与转录。如果你的端点需要额外的请求体字段，请使用 [provider options](#provider-options) 提供。

#### 兼容 OpenAI 的嵌入向量

由于任意端点没有已知模型，你必须配置一个默认嵌入模型，才能将 `embeddings()` 用于 OpenAI 兼容提供商。你也可以配置一个固定的维度值；若省略，请求将不带 `dimensions` 参数发送，并使用模型原生的维度。

```php
'local' => [
    'driver' => 'openai-compatible',
    'url' => env('LOCAL_AI_URL'),
    'key' => env('LOCAL_AI_API_KEY'),
    'models' => [
        'embeddings' => [
            'default' => 'text-embedding-qwen3-embedding-0.6b',
            'dimensions' => 1024, // 可选
        ],
    ],
],
```

#### 兼容 OpenAI 的转录

同理，你必须配置一个默认转录模型，才能将 `Transcription` 用于 OpenAI 兼容提供商。音频将作为标准 multipart 请求上传到端点的 `/audio/transcriptions` 路由：

```php
'local' => [
    'driver' => 'openai-compatible',
    'url' => env('LOCAL_AI_URL'),
    'key' => env('LOCAL_AI_API_KEY'),
    'models' => [
        'transcription' => [
            'default' => 'whisper-1',
        ],
    ],
],
```

> [!NOTE]
> OpenAI 兼容提供商与 Groq 提供商不支持说话人分离（diarization）。对这些提供商调用 `diarize` 方法会抛出异常。

### 服务商支持

AI SDK 在各项功能上支持多种提供商。下表汇总了每项功能可用的提供商：

| 功能 | 提供商 |
|---|---|
| 文本 | OpenAI、OpenAI Compatible、Anthropic、Gemini、Azure、Bedrock、Groq、xAI、DeepSeek、Mistral、Ollama、OpenRouter |
| 图像 | OpenAI、Gemini、xAI、Azure、Bedrock、OpenRouter |
| TTS | OpenAI、ElevenLabs、Gemini、Mistral |
| STT | OpenAI、OpenAI Compatible、ElevenLabs、Groq、Mistral、Gemini |
| 嵌入 | OpenAI、OpenAI Compatible、Gemini、Azure、Bedrock、Cohere、Mistral、Jina、VoyageAI、Ollama、OpenRouter |
| 重排（Reranking） | Cohere、Jina、VoyageAI、Bedrock |
| 文件 | OpenAI、Anthropic、Gemini、Azure |

你可以使用 `Laravel\Ai\Enums\Lab` 枚举在代码中引用提供商，而不是使用普通字符串：

```php
use Laravel\Ai\Enums\Lab;

Lab::Anthropic;
Lab::OpenAI;
Lab::OpenAiCompatible;
Lab::Gemini;
// ...
```

## 代理

智能体（agent）是 Laravel AI SDK 中与 AI 提供商交互的基础构建块。每个智能体都是一个专用的 PHP 类，封装了与大语言模型交互所需的指令、对话上下文、工具与输出结构。可以把智能体理解为一个专门的助手——销售教练、文档分析器、客服机器人——你只需配置一次，之后按需向其发起提示。

你可以通过 `make:agent` Artisan 命令创建智能体：

```shell
php artisan make:agent SalesCoach

php artisan make:agent SalesCoach --structured
```

在生成的智能体类中，你可以定义系统提示（system prompt）/ 指令、消息上下文、可用工具以及输出结构（如适用）：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\RetrievePreviousTranscripts;
use App\Models\History;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class SalesCoach implements Agent, Conversational, HasTools, HasStructuredOutput
{
    use Promptable;

    public function __construct(public User $user) {}

    /**
     * 获取智能体应遵循的指令。
     */
    public function instructions(): Stringable|string
    {
        return 'You are a sales coach, analyzing transcripts and providing feedback and an overall sales strength score.';
    }

    /**
     * 获取迄今为止组成对话的消息列表。
     */
    public function messages(): iterable
    {
        return History::where('user_id', $this->user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return new Message($message->role, $message->content);
            })->all();
    }

    /**
     * 获取智能体可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new RetrievePreviousTranscripts,
        ];
    }

    /**
     * 获取智能体的结构化输出结构定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feedback' => $schema->string()->required(),
            'score' => $schema->integer()->min(1)->max(10)->required(),
        ];
    }
}
```

### 发起提示

要向智能体发起提示，先用 `make` 方法或标准实例化创建实例，再调用 `prompt`：

```php
$response = (new SalesCoach)
    ->prompt('Analyze this sales transcript...');

return (string) $response;
```

`make` 方法会从服务容器（Service Container）中解析你的智能体，从而支持自动依赖注入。你也可以向智能体构造函数传参：

```php
$agent = SalesCoach::make(user: $user);
```

通过向 `prompt` 方法传入额外参数，你可以在发起提示时覆盖默认的提供商、模型或 HTTP 超时：

```php
$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: Lab::Anthropic,
    model: 'claude-sonnet-5',
    timeout: 120,
);
```

#### 原始 HTTP 响应

文本生成智能体返回的每条响应，都通过 `raw` 属性暴露底层提供商 API 调用的原始 HTTP 响应。这样你可以访问不属于 AI SDK 通用响应的、提供商特有的信息——限流响应头、请求 ID 或其他确切的载荷字段：

```php
$response = (new SalesCoach)->prompt('Analyze this sales transcript...');

$response->raw; // Illuminate\Http\Client\Response|null

$response->raw->header('X-RateLimit-Remaining-Requests');
$response->raw->json('id');
```

在工具调用循环中，每一步都会保留其自身请求的原始响应：

```php
foreach ($response->steps as $step) {
    $step->raw?->header('X-RateLimit-Remaining-Requests');
}
```

> **注意：** 流式传输响应时、`Bedrock` 提供商（它通过 AWS SDK 而非 HTTP 客户端发起 API 调用）下，以及伪造的响应（除非通过 `withRawResponse` 显式提供），`raw` 属性均为 `null`。

### 会话上下文

如果你的智能体实现了 `Conversational` 接口，可以使用 `messages` 方法返回先前的对话上下文（如适用）：

```php
use App\Models\History;
use Laravel\Ai\Messages\Message;

/**
 * 获取迄今为止组成对话的消息列表。
 */
public function messages(): iterable
{
    return History::where('user_id', $this->user->id)
        ->latest()
        ->limit(50)
        ->get()
        ->reverse()
        ->map(function ($message) {
            return new Message($message->role, $message->content);
        })->all();
}
```

#### 记住会话

> **警告：** 在使用 `RemembersConversations` trait 之前，你应当使用 `vendor:publish` Artisan 命令发布并运行 AI SDK 的迁移。这些迁移会创建存储对话所需的数据库表。

如果你希望 Laravel 自动存储并读取智能体的对话历史，可以使用 `RemembersConversations` trait。该 trait 提供了一种简单的方式，将对话消息持久化到数据库，而无需手动实现 `Conversational` 接口：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, Conversational
{
    use Promptable, RemembersConversations;

    /**
     * 获取智能体应遵循的指令。
     */
    public function instructions(): string
    {
        return 'You are a sales coach...';
    }
}
```

使用 `RemembersConversations` trait 时，不要在智能体类中手动定义 `messages` 方法。如果存在 `messages` 方法，它会优先于该 trait 的实现，导致对话历史不会从数据库加载。

要为某用户开启新对话，可在发起提示前调用 `forUser` 方法：

```php
$response = (new SalesCoach)->forUser($user)->prompt('Hello!');

$conversationId = $response->conversationId;
```

对话 ID 会随响应返回，可保存供日后引用。如果你希望使用 Eloquent 获取某用户的所有对话，可以向用户模型添加 `HasConversations` trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Ai\Concerns\HasConversations;

class User extends Authenticatable
{
    use HasConversations;
}
```

添加该 trait 后，你便可以通过 `conversations` 关联（Relationship）获取并查询用户的对话：

```php
$conversations = $user->conversations()
    ->latest('updated_at')
    ->paginate(20);
```

要延续已有对话，使用 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $user)
    ->prompt('Tell me more about that.');
```

使用 `RemembersConversations` trait 时，发起提示会自动加载以往消息并纳入对话上下文。每次交互后，新消息（用户与助手双方）都会自动存储。

#### 会话参与者

虽然用户是最常见的对话参与者，但对话也可以属于任意 Eloquent 模型。使用 `forParticipant` 方法为其他类型的模型开启对话：

```php
$response = (new SalesCoach)
    ->forParticipant($team)
    ->prompt('Review our latest sales results.');
```

参与者的 morph 类与主键会随对话一起存储。因此，主键值相同的不同模型（例如 `User` ID `1` 与 `Team` ID `1`）拥有各自独立的对话历史。`forUser` 方法是 `forParticipant` 的别名。

你可以使用 `continueLastConversation` 方法延续该参与者最近的对话：

```php
$response = (new SalesCoach)
    ->continueLastConversation($team)
    ->prompt('Tell me more about that.');
```

延续特定对话时，将参与者传给 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $team)
    ->prompt('Tell me more about that.');
```

`HasConversations` trait 可添加到任何参与对话的 Eloquent 模型上。由此产生的 `conversations` 关联是一个限定于该模型类型与主键的多态（Polymorphic）关联。你也可以通过其反向关联访问拥有对话的参与者：

```php
$conversations = $team->conversations;

$participant = $conversation->participant;
```

如果你的应用使用多种参与者模型类型，建议定义 [Eloquent morph map](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，使存储的参与者类型不耦合于你的模型类名。

> [!WARNING]
> `continue` 方法不会校验给定参与者是否拥有该对话。你的应用应当在延续对话之前，先对对话的访问进行授权。

### 结构化输出

如果你希望智能体返回结构化输出，请实现 `HasStructuredOutput` 接口，该接口要求你的智能体定义一个 `schema` 方法：

```php
<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasStructuredOutput
{
    use Promptable;

    // ...

    /**
     * 获取智能体的结构化输出结构定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
        ];
    }
}
```

向返回结构化输出的智能体发起提示时，你可以像访问数组一样访问返回的 `StructuredAgentResponse`：

```php
$response = (new SalesCoach)->prompt('Analyze this sales transcript...');

return $response['score'];
```

#### 嵌套对象

要定义嵌套的结构化输出，请结合闭包使用 `object` 方法：

```php
<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasStructuredOutput
{
    use Promptable;

    // ...

    /**
     * 获取智能体的结构化输出结构定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
            'metadata' => $schema->object(fn ($schema) => [
                'confidence' => $schema->string()->enum(['low', 'medium', 'high'])->required(),
                'language' => $schema->string()->required(),
            ])->required(),
        ];
    }
}
```

#### 对象数组

如果你的智能体应返回一组结构化条目，请组合使用 `array` 与 `object` 方法：

```php
public function schema(JsonSchema $schema): array
{
    return [
        'feedback' => $schema->array()
            ->items(
                $schema->object(fn ($schema) => [
                    'comment' => $schema->string()->required(),
                    'score' => $schema->integer()->required(),
                ])
            )
            ->required(),
    ];
}
```

如果一个值可能匹配多个结构中的某一个，请使用 `anyOf` 方法：

```php
public function schema(JsonSchema $schema): array
{
    return [
        'content' => $schema->anyOf([
            $schema->object(fn ($schema) => [
                'type' => $schema->string()->enum(['article'])->required(),
                'title' => $schema->string()->required(),
            ]),
            $schema->object(fn ($schema) => [
                'type' => $schema->string()->enum(['image'])->required(),
                'url' => $schema->string()->required(),
            ]),
        ])->required(),
    ];
}
```

### 附件

发起提示时，你还可以随提示附带附件，让模型查看图像与文档：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Files;

$response = (new SalesCoach)->prompt(
    'Analyze the attached sales transcript...',
    attachments: [
        Files\Document::fromStorage('transcript.pdf'), // 从文件系统磁盘附加文档……
        Files\Document::fromPath('/home/laravel/transcript.md'), // 从本地路径附加文档……
        $request->file('transcript'), // 附加上传的文件……
    ]
);
```

同理，`Laravel\Ai\Files\Image` 类可用于向提示附加图像：

```php
use App\Ai\Agents\ImageAnalyzer;
use Laravel\Ai\Files;

$response = (new ImageAnalyzer)->prompt(
    'What is in this image?',
    attachments: [
        Files\Image::fromStorage('photo.jpg'), // 从文件系统磁盘附加图像……
        Files\Image::fromPath('/home/laravel/photo.jpg'), // 从本地路径附加图像……
        $request->file('photo'), // 附加上传的文件……
    ]
);
```

### 流式输出

你可以调用 `stream` 方法让智能体以流式（streaming）方式响应。返回的 `StreamableAgentResponse` 可从路由（Route）返回，自动向客户端发送流式响应（SSE）：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)->stream('Analyze this sales transcript...');
});
```

`then` 方法可用于提供一个闭包，在整个响应流式传输到客户端后被调用：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Responses\StreamedAgentResponse;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->then(function (StreamedAgentResponse $response) {
            // $response->text, $response->events, $response->usage……
        });
});
```

你也可以手动遍历流式事件：

```php
$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    // ...
}
```

#### 使用 Vercel AI SDK 协议进行流式输出

你可以调用流式响应上的 `usingVercelDataProtocol` 方法，使用 [Vercel AI SDK 流协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) 来流式传输事件：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->usingVercelDataProtocol();
});
```

### 广播

你可以用几种不同的方式广播流式事件。首先，你可以直接在流式事件上调用 `broadcast` 或 `broadcastNow` 方法：

```php
use App\Ai\Agents\SalesCoach;
use Illuminate\Broadcasting\Channel;

$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    $event->broadcast(new Channel('channel-name'));
}
```

或者，你可以调用智能体的 `broadcastOnQueue` 方法，将智能体操作排入队列，并在流式事件可用时即时广播：

```php
(new SalesCoach)->broadcastOnQueue(
    'Analyze this sales transcript...'
    new Channel('channel-name'),
);
```

#### 跳过超大事件

部分广播平台将 WebSocket 消息限制在约 10KB。数据量大的流式事件（如大型工具结果）可能超出该限制，导致广播失败。你可以使用 `WithoutBroadcasting` 属性将特定事件类型排除在广播之外：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\WithoutBroadcasting;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Laravel\Ai\Streaming\Events\ToolCall;
use Laravel\Ai\Streaming\Events\ToolResult;

#[WithoutBroadcasting(ToolCall::class, ToolResult::class)]
class SearchAgent implements Agent, HasTools
{
    use Promptable;

    // ...
}
```

被排除的事件永远不会被广播，但仍会持久化到 `agent_conversation_messages` 表，因此前端可在流结束后加载完整的工具数据。这对排队（`broadcastOnQueue`）与同步（`broadcast` / `broadcastNow`）两种广播方式都有效。

### 加入队列

使用智能体的 `queue` 方法，你可以向智能体发起提示，但让它在后台处理响应，使你的应用保持快速与灵敏。`then` 与 `catch` 方法可用于注册闭包，在响应可用或发生异常时被调用：

```php
use Illuminate\Http\Request;
use Laravel\Ai\Responses\AgentResponse;
use Throwable;

Route::post('/coach', function (Request $request) {
    (new SalesCoach)
        ->queue($request->input('transcript'))
        ->then(function (AgentResponse $response) {
            // ...
        })
        ->catch(function (Throwable $e) {
            // ...
        });

    return back();
});
```

### 工具

工具可用于为智能体提供额外能力，使其在响应提示时加以利用。你可以使用 `make:tool` Artisan 命令创建工具：

```shell
php artisan make:tool RandomNumberGenerator
```

生成的工具会放在应用的 `app/Ai/Tools` 目录中。每个工具都包含一个 `handle` 方法，智能体需要用到该工具时便会调用它：

```php
<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RandomNumberGenerator implements Tool
{
    /**
     * 获取工具用途的描述。
     */
    public function description(): Stringable|string
    {
        return 'This tool may be used to generate cryptographically secure random numbers.';
    }

    /**
     * 执行工具。
     */
    public function handle(Request $request): Stringable|string
    {
        return (string) random_int($request['min'], $request['max']);
    }

    /**
     * 获取工具的结构定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'min' => $schema->integer()->min(0)->required(),
            'max' => $schema->integer()->required(),
        ];
    }
}
```

定义好工具后，可以从任意智能体的 `tools` 方法返回它：

```php
use App\Ai\Tools\RandomNumberGenerator;

/**
 * 获取智能体可用的工具。
 *
 * @return Tool[]
 */
public function tools(): iterable
{
    return [
        new RandomNumberGenerator,
    ];
}
```

#### 校验工具参数

虽然工具的结构会约束模型可能提供的参数，你仍可以使用请求的 `validate` 方法校验传入参数：

```php
public function handle(Request $request): Stringable|string
{
    $validated = $request->validate([
        'city' => 'required|string',
        'days' => 'required|integer|max:7',
    ]);

    return $this->forecast($validated['city'], $validated['days']);
}
```

校验失败时，校验消息会作为工具结果返回给模型，使其纠正参数并再次调用工具。

#### 修复工具调用

使用 `RepairToolCalls` 属性，可让智能体在模型调用了未知的本地工具时自我恢复。Laravel 会把失败的调用连同可用本地工具的名称一起返回给模型，使其纠正该调用：

```php
use Laravel\Ai\Attributes\RepairToolCalls;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;

#[RepairToolCalls]
class SupportAgent implements Agent, HasTools
{
    use Promptable;

    // ...
}
```

当 Laravel 自动推导最大步数时，该属性会为修复后的调用额外增加一步。显式的 `MaxSteps` 限制保持不变。

#### 相似度搜索

`SimilaritySearch` 工具允许智能体使用存储在数据库中的向量嵌入，搜索与给定查询相似的文档。当你希望让智能体具备搜索应用数据的能力时，这可用于检索增强生成（retrieval-augmented generation，RAG）。

创建相似度搜索工具最简单的方式，是使用 `usingModel` 方法配合一个带有向量嵌入的 Eloquent 模型：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        SimilaritySearch::usingModel(Document::class, 'embedding'),
    ];
}
```

第一个参数是 Eloquent 模型类，第二个参数是包含向量嵌入的列。

你还可以提供一个介于 `0.0` 与 `1.0` 之间的最小相似度阈值，以及一个闭包来自定义查询：

```php
SimilaritySearch::usingModel(
    model: Document::class,
    column: 'embedding',
    minSimilarity: 0.7,
    limit: 10,
    query: fn ($query) => $query->where('published', true),
),
```

如需更强的控制，你可以创建一个相似度搜索工具，并提供一个返回搜索结果的自定义闭包：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        new SimilaritySearch(using: function (string $query) {
            return Document::query()
                ->where('user_id', $this->user->id)
                ->whereVectorSimilarTo('embedding', $query)
                ->limit(10)
                ->get();
        }),
    ];
}
```

你可以使用 `withDescription` 方法自定义工具的描述：

```php
SimilaritySearch::usingModel(Document::class, 'embedding')
    ->withDescription('Search the knowledge base for relevant articles.'),
```

### 延迟加载工具

默认情况下，智能体暴露的每个工具都会随每次请求一起发送给提供商。当智能体提供大量工具时，这会消耗 token 并可能降低模型选择工具的准确性。配合 OpenAI 或 Anthropic 使用 `ToolSearch` 提供商工具，你可以延迟加载工具定义，使提供商仅在需要时加载它们：

```php
use App\Ai\Tools\RefundOrder;
use App\Ai\Tools\SearchInvoices;
use App\Ai\Tools\Weather;
use Laravel\Ai\Providers\Tools\ToolSearch;

public function tools(): iterable
{
    return [
        new Weather,
        new ToolSearch(tools: [
            new SearchInvoices,
            new RefundOrder,
        ]),
    ];
}
```

被包裹的工具无需任何修改。提供商会在相关时搜索并加载它们，此后智能体便可以像调用其他工具一样调用它们。

使用 Anthropic 时，可以通过 `strategy` 参数决定提供商应如何搜索延迟工具。支持的策略有 `regex`（默认）与 `bm25`：

```php
new ToolSearch(tools: [new SearchInvoices], strategy: 'bm25'),
```

使用 Anthropic 时，还可以通过 `withProviderOptions` 方法向搜索工具传递额外的提供商专属选项：

```php
(new ToolSearch(tools: [new SearchInvoices]))
    ->withProviderOptions(['cache_control' => ['type' => 'ephemeral']]),
```

> [!WARNING]
> 不支持工具搜索的提供商会抛出异常，而不是静默丢弃延迟工具。此外，Anthropic 要求至少在 `ToolSearch` 包裹之外提供一个工具。

### 文件存储工具

`FileStorage` 工具工厂允许你让智能体访问 Laravel [filesystem disk](/docs/{{version}}/filesystem)。`all` 方法返回的工具，可让智能体在给定磁盘上列出、读取、检查、生成 URL、写入、删除与复制文件：

```php
use Laravel\Ai\Tools\FileStorage;

public function tools(): iterable
{
    return FileStorage::all('local');
}
```

如果你的智能体只应检查文件，请使用 `readOnly` 方法：

```php
return FileStorage::readOnly('local');
```

这些方法返回 `Illuminate\Support\Collection`，便于你进一步筛选提供给智能体的工具：

```php
use Laravel\Ai\Tools\Filesystem\DeleteFile;

return FileStorage::all('s3')
    ->reject(fn ($tool) => $tool instanceof DeleteFile);
```

### MCP 工具

如果你的应用使用了 [Laravel MCP](/docs/{{version}}/mcp)，你可以让智能体使用 [Model Context Protocol](https://modelcontextprotocol.io) 服务器暴露的工具。借助 [Laravel MCP client](/docs/{{version}}/mcp#client)，你可以连接远程或本地的 MCP 服务器，并将其工具直接传给智能体。

> [!NOTE]
> MCP 工具需要你的应用安装了 [Laravel MCP](/docs/{{version}}/mcp) 包。

由于 MCP 客户端的 `tools` 方法返回的是集合，请使用 `...` 运算符将其展开到智能体的 `tools` 数组中：

```php
use App\Ai\Tools\RandomNumberGenerator;
use Laravel\Mcp\Client;

/**
 * 获取智能体可用的工具。
 *
 * @return Tool[]
 */
public function tools(): iterable
{
    return [
        ...Client::web('https://mcp.example.com')
            ->withToken($token)
            ->tools(),

        new RandomNumberGenerator,
    ];
}
```

AI SDK 会自动包裹每个 MCP 工具，使智能体可以像调用其他工具一样调用它。你也可以使用 [命名 MCP 客户端](/docs/{{version}}/mcp#named-clients)：

```php
use Laravel\Mcp\Facades\Mcp;

public function tools(): iterable
{
    return [
        ...Mcp::client('github')->tools(),
    ];
}
```

或连接 [本地 MCP 服务器](/docs/{{version}}/mcp#client-connecting)：

```php
use Laravel\Mcp\Client;

public function tools(): iterable
{
    return [
        ...Client::local('php', ['artisan', 'mcp:start'])->tools(),
    ];
}
```

关于创建与认证 MCP 客户端的更多信息（包括 Bearer Token 与 OAuth），请参阅 [MCP 客户端文档](/docs/{{version}}/mcp#client)。

### 服务商工具

提供商工具是由 AI 提供商原生实现的特殊工具，提供网页搜索、URL 抓取、文件搜索等能力。与普通工具不同，提供商工具由提供商自身而非你的应用执行。

提供商工具可由智能体的 `tools` 方法返回。

#### 网络搜索

`WebSearch` 提供商工具允许智能体联网搜索实时信息。当你需要回答关于近期事件、最新数据，或模型训练截止后可能已变化的话题时，这会很有用。

**支持的提供商：** Anthropic、OpenAI、Azure、Gemini、xAI、OpenRouter

```php
use Laravel\Ai\Providers\Tools\WebSearch;

public function tools(): iterable
{
    return [
        new WebSearch,
    ];
}
```

你可以配置网页搜索工具，限制搜索次数或将结果限定在特定域名：

```php
(new WebSearch)->max(5)->allow(['laravel.com', 'php.net']),
```

要基于用户位置精化搜索结果，请使用 `location` 方法：

```php
(new WebSearch)->location(
    city: 'New York',
    region: 'NY',
    country: 'US'
);
```

#### 网页抓取

`WebFetch` 提供商工具允许智能体抓取并读取网页内容。当你需要智能体分析特定 URL 或从已知网页获取详细信息时，这会很有用。

**支持的提供商：** Anthropic、Gemini、OpenRouter

```php
use Laravel\Ai\Providers\Tools\WebFetch;

public function tools(): iterable
{
    return [
        new WebFetch,
    ];
}
```

你可以配置网页抓取工具，限制抓取次数或限定在特定域名：

```php
(new WebFetch)->max(3)->allow(['docs.laravel.com']),
```

#### 文件搜索

`FileSearch` 提供商工具允许智能体搜索存储在 [向量存储](#vector-stores) 中的 [文件](#files)。这让智能体可以搜索你上传的文档以查找相关信息，从而实现检索增强生成（RAG）。

**支持的提供商：** OpenAI、Gemini、xAI

```php
use Laravel\Ai\Providers\Tools\FileSearch;

public function tools(): iterable
{
    return [
        new FileSearch(stores: ['store_id']),
    ];
}
```

你可以提供多个向量存储 ID 以跨多个存储搜索：

```php
new FileSearch(stores: ['store_1', 'store_2']);
```

如果你的文件带有 [元数据](#adding-files-to-stores)，可以通过提供 `where` 参数来筛选搜索结果。对于简单的相等筛选，传入数组：

```php
new FileSearch(stores: ['store_id'], where: [
    'author' => 'Taylor Otwell',
    'year' => 2026,
]);
```

对于更复杂的筛选，可以传入一个接收 `FileSearchQuery` 实例的闭包：

```php
use Laravel\Ai\Providers\Tools\FileSearchQuery;

new FileSearch(stores: ['store_id'], where: fn (FileSearchQuery $query) =>
    $query->where('author', 'Taylor Otwell')
        ->whereNot('status', 'draft')
        ->whereIn('category', ['news', 'updates'])
);
```

### 子代理

智能体也可以从另一个智能体的 `tools` 方法返回。当一个智能体作为工具返回时，父智能体可以把特定任务委派给子智能体，并在回答原始提示时使用子智能体的响应。当一个通用智能体需要访问带有自身指令、工具、模型配置或提供商偏好的专门智能体时，这会很有用。

例如，一个客服智能体可以把退款资格问题委派给专门的退款智能体：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;

class CustomerSupportAgent implements Agent, HasTools
{
    use Promptable;

    /**
     * 获取智能体应遵循的指令。
     */
    public function instructions(): string
    {
        return 'You help customers with account, order, and billing questions. Delegate refund policy questions to the refunds specialist.';
    }

    /**
     * 获取智能体可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new RefundsAgent,
        ];
    }
}
```

要自定义子智能体对父智能体的暴露方式，请在子智能体上实现 `CanActAsTool` 接口，并定义一个面向工具的名称与描述：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\LookupOrder;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\CanActAsTool;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::Anthropic)]
class RefundsAgent implements Agent, CanActAsTool, HasTools
{
    use Promptable;

    /**
     * 获取智能体应遵循的指令。
     */
    public function instructions(): string
    {
        return 'You are a refunds specialist. Use order details and the refund policy to give concise eligibility guidance.';
    }

    /**
     * 获取智能体的工具名称。
     */
    public function name(): string
    {
        return 'refunds_specialist';
    }

    /**
     * 获取智能体的工具描述。
     */
    public function description(): string
    {
        return 'Determine whether an order is eligible for a refund and explain the next step.';
    }

    /**
     * 获取智能体可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new LookupOrder,
        ];
    }
}
```

如果子智能体未实现 `CanActAsTool`，Laravel 会使用智能体的类短名（basename）作为工具名，并提供一个通用描述，要求父智能体传入清晰、自包含的任务描述。每次子智能体调用都在隔离环境中运行，不会收到父智能体的对话历史。

### 中间件

智能体支持中间件（Middleware），允许你在提示发送给提供商之前拦截并修改它。你可以使用 `make:agent-middleware` Artisan 命令创建中间件：

```shell
php artisan make:agent-middleware LogPrompts
```

生成的中间件会放在应用的 `app/Ai/Middleware` 目录中。要向智能体添加中间件，请实现 `HasMiddleware` 接口并定义返回中间件类数组的 `middleware` 方法：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogPrompts;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasMiddleware
{
    use Promptable;

    // ...

    /**
     * 获取智能体的中间件。
     */
    public function middleware(): array
    {
        return [
            new LogPrompts,
        ];
    }
}
```

每个中间件类都应定义一个 `handle` 方法，接收 `AgentPrompt` 与一个 `Closure`，用于将提示传递给下一个中间件：

```php
<?php

namespace App\Ai\Middleware;

use Closure;
use Laravel\Ai\Prompts\AgentPrompt;

class LogPrompts
{
    /**
     * 处理传入的提示。
     */
    public function handle(AgentPrompt $prompt, Closure $next)
    {
        Log::info('Prompting agent', ['prompt' => $prompt->prompt]);

        return $next($prompt);
    }
}
```

你可以使用响应上的 `then` 方法，在智能体处理完成后执行代码。这对同步与流式响应都有效：

```php
public function handle(AgentPrompt $prompt, Closure $next)
{
    return $next($prompt)->then(function (AgentResponse $response) {
        Log::info('Agent responded', ['text' => $response->text]);
    });
}
```

### 匿名代理

有时你可能想快速与模型交互，而无需创建一个专门的智能体类。你可以使用 `agent` 函数创建一个临时的匿名智能体：

```php
use function Laravel\Ai\{agent};

$response = agent(
    instructions: 'You are an expert at software development.',
    messages: [],
    tools: [],
)->prompt('Tell me about Laravel')
```

匿名智能体也可以产生结构化输出：

```php
use Illuminate\Contracts\JsonSchema\JsonSchema;

use function Laravel\Ai\{agent};

$response = agent(
    schema: fn (JsonSchema $schema) => [
        'number' => $schema->integer()->required(),
    ],
)->prompt('Generate a random number less than 100')
```

### 代理配置

你可以使用 PHP 属性配置智能体的文本生成选项。可用的属性如下：

- `MaxSteps`：智能体使用工具时最多可执行的步数。
- `MaxTokens`：模型最多可生成的 token 数。
- `Model`：智能体应使用的模型。
- `Provider`：智能体使用的 AI 提供商（或用于故障转移的多个提供商）。
- `Temperature`：生成时使用的采样温度（0.0 到 1.0）。
- `Timeout`：智能体请求的 HTTP 超时（秒，默认：60）。
- `TopP`：生成时使用的核采样（nucleus sampling）概率（0.0 到 1.0）。
- `UseCheapestModel`：使用提供商最便宜的文本模型以优化成本。
- `UseSmartestModel`：使用提供商能力最强的文本模型以应对复杂任务。

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Attributes\TopP;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::Anthropic)]
#[Model('claude-sonnet-5')]
#[MaxSteps(10)]
#[MaxTokens(4096)]
#[Temperature(0.7)]
#[Timeout(120)]
#[TopP(0.9)]
class SalesCoach implements Agent
{
    use Promptable;

    // ...
}
```

`UseCheapestModel` 与 `UseSmartestModel` 属性让你无需指定模型名，即可为给定提供商自动选择最具性价比或能力最强的模型。当你希望跨不同提供商优化成本或能力时，这会很有用：

```php
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Attributes\UseSmartestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[UseCheapestModel]
class SimpleSummarizer implements Agent
{
    use Promptable;

    // 将使用最便宜的模型（例如 Haiku）……
}

#[UseSmartestModel]
class ComplexReasoner implements Agent
{
    use Promptable;

    // 将使用能力最强的模型（例如 Opus）……
}
```

> [!NOTE]
> `UseCheapestModel` 与 `UseSmartestModel` 所选的底层模型，可能会随 Laravel AI SDK 各版本的发布而变化（因为提供商会推出新模型）。切换模型可能带来行为变化、废弃的参数以及显著的价差。如果你需要稳定、可预期的模型与定价，请使用 `Model` 属性显式指定模型。

### 服务商选项

如果你的智能体需要传递提供商专属的选项（例如 OpenAI 的推理强度或惩罚设置），请实现 `HasProviderOptions` 契约并定义 `providerOptions` 方法：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasProviderOptions
{
    use Promptable;

    // ...

    /**
     * 获取提供商专属的生成选项。
     */
    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => [
                'reasoning' => ['effort' => 'low'],
                'frequency_penalty' => 0.5,
                'presence_penalty' => 0.3,
            ],
            Lab::Anthropic => [
                'thinking' => ['budget_tokens' => 1024],
                'cache_control' => ['type' => 'ephemeral'],
            ],
            default => [],
        };
    }
}
```

`providerOptions` 方法会接收当前使用的提供商（`Lab` 枚举或字符串），让你可以按提供商返回不同的选项。在使用 [故障转移](#failover) 时这尤其有用，因为每个回退提供商都能收到各自的配置。

上面的 Anthropic 示例也通过 `cache_control` 启用了 [提示缓存](#prompt-caching)。

### 提示词缓存

大多数提供商会自动缓存重复的提示前缀，并对缓存部分给予折扣计费。OpenAI、Gemini、Groq、DeepSeek、xAI 无需配置，你可以通过响应的用量信息查看节省：

```php
$response->usage->cacheReadInputTokens;
$response->usage->cacheWriteInputTokens;
```

`anthropic` 与 `bedrock` 提供商只有在被显式要求时才会缓存。`CacheInstructions` 与 `CacheToolDefinitions` 属性会在智能体指令与工具定义的末尾放置缓存断点，因此每次对话都从该缓存读取此前缀，而无需重新写入：

```php
use Laravel\Ai\Attributes\CacheInstructions;
use Laravel\Ai\Attributes\CacheToolDefinitions;

#[CacheInstructions]
#[CacheToolDefinitions]
class SalesCoach implements Agent
{
    use Promptable;

    // ...
}
```

如果你的指令每次请求都会变化（例如内嵌了当前日期），请单独使用 `CacheToolDefinitions`。缓存一个每次请求都变化的前缀，会导致每次都新建一个缓存条目，于是你为写入缓存付费却从未复用它。

不支持这些属性的提供商会忽略它们，因此即便使用 [故障转移](#failover)，智能体也可以安全地声明它们。

缓存前缀默认保留 5 分钟。如果你向属性传入 TTL，Anthropic 可以将其保留 1 小时：

```php
#[CacheInstructions('1h')]
#[CacheToolDefinitions('1h')]
```

此外，Anthropic 的自动缓存也可以通过顶层的 `cache_control` [provider option](#provider-options) 启用。它会在请求最后一个代码块之后放置一个单一断点，于是断点随对话增长而前移，每一轮都从缓存读取前几轮。两种机制可以组合使用。

> [!WARNING]
> 由于提供商按「工具、指令、消息」的顺序构建提示，缓存指令 1 小时也意味着缓存工具定义 1 小时。两者混用会抛出 `InvalidArgumentException`。

## 人工工具审批

> [!WARNING]
> 工具批准需要一个对话历史被持久化的 `Conversational` 智能体，以便可以恢复暂停的调用。`RemembersConversations` trait 提供了所需的持久化。

执行敏感或不可逆操作的工具，可能在执行前需要人工批准。要让工具可批准，请实现 `Approvable` 契约并使用 `InteractsWithApprovals` trait。可批准工具默认需要批准：

```php
<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Concerns\InteractsWithApprovals;
use Laravel\Ai\Contracts\Approvable;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class DeleteFile implements Approvable, Tool
{
    use InteractsWithApprovals;

    /**
     * 获取工具用途的描述。
     */
    public function description(): Stringable|string
    {
        return 'Delete a file from storage.';
    }

    /**
     * 执行工具。
     */
    public function handle(Request $request): Stringable|string
    {
        Storage::delete($request['path']);

        return "Deleted [{$request['path']}].";
    }

    /**
     * 获取工具的结构定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'path' => $schema->string()->required(),
        ];
    }
}
```

要根据工具调用的参数判断是否需要批准，请在工具上定义 `needsApproval` 方法。该方法可返回布尔值，或返回一个包含批准理由的 `Approval` 实例：

```php
use Laravel\Ai\Approvals\Approval;

/**
 * 判断该工具对给定请求是否需要批准。
 */
protected function needsApproval(Request $request): Approval|bool
{
    return str_starts_with($request['path'], 'temporary/')
        ? false
        : Approval::required('This will permanently delete a file.');
}
```

当你从智能体的 `tools` 方法返回工具时，可以覆盖该工具的批准要求：

```php
public function tools(): iterable
{
    return [
        (new SendNotification)->withoutApproval(),
        (new DeleteFile)->requireApproval('Deletion review required.'),
    ];
}
```

当可批准工具被调用时，智能体在执行前会暂停。你可以检查响应的待处理批准，其中包含每个工具调用的 ID、工具名、参数与批准理由：

```php
$response = (new FileAssistant)
    ->forUser($user)
    ->prompt('Delete the old invoice.');

if ($response->hasPendingApprovals()) {
    foreach ($response->pendingApprovals as $approval) {
        // $approval->id
        // $approval->tool
        // $approval->arguments
        // $approval->reason
    }
}
```

要恢复智能体，请延续对话并提供一个 `Decisions` 实例，其中包含每个待处理工具调用的决策。决策可以在执行前批准该调用、拒绝它，或编辑其参数：

```php
use Laravel\Ai\Approvals\Decision;
use Laravel\Ai\Approvals\Decisions;

$response = (new FileAssistant)
    ->continue($conversationId, as: $user)
    ->prompt(Decisions::from([
        'call_abc' => Decision::approve(),
        'call_ghi' => Decision::reject('The invoice must be retained.'),
    ]));
```

布尔值 `true` 与 `false` 可作为批准与拒绝的简写。每个待处理工具调用都必须收到一个决策。未知、缺失或已解决的工具调用 ID 会抛出 `ApprovalMismatchException`。你可以使用 `approveRemaining` 或 `rejectRemaining` 方法，为没有显式决策的调用提供默认处理：

```php
$decisions = Decisions::from([
    'call_abc' => true,
])->rejectRemaining('Not approved.');

$response = (new FileAssistant)
    ->continue($conversationId, as: $user)
    ->prompt($decisions);
```

带有结果的拒绝（例如 `Decision::reject('Not approved.')`）会返回给模型，使其可以继续响应。不带结果的拒绝会在记录拒绝后停止生成循环。

工具批准由 `prompt`、`stream`、`queue`、`broadcast`、`broadcastNow`、`broadcastOnQueue` 方法支持。

在流式传输与广播过程中，暂停由一个 `tool_approval_request` 事件表示。使用 [Vercel AI SDK 流协议](#streaming-using-the-vercel-ai-sdk-protocol) 时，批准请求与结果会使用该协议原生的工具批准片段来发出。

对于排队的智能体，最终响应会传给 `then` 回调，Laravel 还会分发一个 `ToolApprovalRequested` 事件。

Laravel 会在请求模型继续之前，存储已批准工具的结果。如果此后生成失败，该批准已经解决。请使用普通的文本提示延续对话，而不是再次提交相同的批准决策。

### 完整审批流程

以下路由展示了一个完整的批准流程。`GET` 路由返回聊天界面，而 `POST` 路由接受来自聊天界面的新文本提示或批准决策。此示例假设应用的 `User` 模型使用了 `HasConversations` trait：

```php
use App\Ai\Agents\FileAssistant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Laravel\Ai\Approvals\Decision;
use Laravel\Ai\Approvals\Decisions;
use Laravel\Ai\Models\Conversation;

Route::get('/chat/{conversation}', function (Request $request, Conversation $conversation) {
    Gate::authorize('view', $conversation);

    return view('chat', [
        'conversation' => $conversation,
    ]);
})->middleware('auth');

Route::post('/chat/{conversation}', function (Request $request, Conversation $conversation) {
    Gate::authorize('view', $conversation);

    $validated = $request->validate([
        'message' => ['nullable', 'string', 'required_without:decisions', 'prohibits:decisions'],
        'decisions' => ['nullable', 'array', 'required_without:message', 'prohibits:message'],
        'decisions.*.action' => ['required_with:decisions', Rule::in(['approve', 'reject'])],
        'decisions.*.result' => ['nullable', 'string'],
    ]);

    $prompt = isset($validated['decisions'])
        ? Decisions::from(collect($validated['decisions'])->map(
            fn (array $decision) => match ($decision['action']) {
                'approve' => Decision::approve(),
                'reject' => Decision::reject($decision['result'] ?? null),
            }
        )->all())
        : $validated['message'];

    $response = (new FileAssistant)
        ->continue($conversation->id, as: $request->user())
        ->prompt($prompt);

    return [
        'conversation_id' => $response->conversationId,
        'status' => $response->hasPendingApprovals() ? 'awaiting_approval' : 'complete',
        'message' => $response->text,
        'approvals' => $response->pendingApprovals,
    ];
})->middleware('auth');
```

当响应状态为 `awaiting_approval` 时，聊天界面应渲染待处理的批准，并使用工具调用 ID 作为每个决策的键，将用户的选择提交到同一端点：

```json
{
    "decisions": {
        "call_abc": {
            "action": "approve"
        },
        "call_def": {
            "action": "reject",
            "result": "The invoice must be retained."
        }
    }
}
```

对于普通的聊天消息，界面可以改为提交一个 `message` 值：

```json
{
    "message": "Delete the old invoice."
}
```

## 图像

`Laravel\Ai\Image` 类可用于通过 `openai`、`gemini` 或 `xai` 提供商生成图像：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')->generate();

$rawContent = (string) $image;
```

`square`、`portrait`、`landscape` 方法可用于控制图像的宽高比，而 `quality` 方法可用于引导模型生成的最终图像质量（`high`、`medium`、`low`）。`timeout` 方法可用于指定 HTTP 超时（秒）：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')
    ->quality('high')
    ->landscape()
    ->timeout(120)
    ->generate();
```

你可以使用 `attachments` 方法附加参考图像：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Image;

$image = Image::of('Update this photo of me to be in the style of an impressionist painting.')
    ->attachments([
        Files\Image::fromStorage('photo.jpg'),
        // Files\Image::fromPath('/home/laravel/photo.jpg'),
        // Files\Image::fromUrl('https://example.com/photo.jpg'),
        // $request->file('photo'),
    ])
    ->landscape()
    ->generate();
```

生成的图像可以轻松存储在应用 `config/filesystems.php` 配置文件中配置的默认磁盘上：

```php
$image = Image::of('A donut sitting on the kitchen counter');

$path = $image->store();
$path = $image->storeAs('image.jpg');
$path = $image->storePublicly();
$path = $image->storePubliclyAs('image.jpg');
```

图像生成也可以排队：

```php
use Laravel\Ai\Image;
use Laravel\Ai\Responses\ImageResponse;

Image::of('A donut sitting on the kitchen counter')
    ->portrait()
    ->queue()
    ->then(function (ImageResponse $image) {
        $path = $image->store();

        // ...
    });
```

## 音频

`Laravel\Ai\Audio` 类可用于根据给定文本生成音频：

```php
use Laravel\Ai\Audio;

$audio = Audio::of('I love coding with Laravel.')->generate();

$rawContent = (string) $audio;
```

你也可以通过 Laravel 的 `Stringable` 类提供的 `toAudio` 方法，由字符串生成音频：

```php
use Illuminate\Support\Str;

$audio = Str::of('I love coding with Laravel.')->toAudio();
```

`male`、`female`、`voice` 方法可用于决定生成音频的声音：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->generate();

$audio = Audio::of('I love coding with Laravel.')
    ->voice('voice-id-or-name')
    ->generate();
```

同理，`instructions` 方法可用于动态指导模型生成音频的方式：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->instructions('Said like a pirate')
    ->generate();
```

生成的音频可以轻松存储在应用 `config/filesystems.php` 配置文件中配置的默认磁盘上：

```php
$audio = Audio::of('I love coding with Laravel.')->generate();

$path = $audio->store();
$path = $audio->storeAs('audio.mp3');
$path = $audio->storePublicly();
$path = $audio->storePubliclyAs('audio.mp3');
```

音频生成也可以排队：

```php
use Laravel\Ai\Audio;
use Laravel\Ai\Responses\AudioResponse;

Audio::of('I love coding with Laravel.')
    ->queue()
    ->then(function (AudioResponse $audio) {
        $path = $audio->store();

        // ...
    });
```

## 转录

`Laravel\Ai\Transcription` 类可用于生成给定音频的文本转录：

```php
use Laravel\Ai\Transcription;

$transcript = Transcription::fromPath('/home/laravel/audio.mp3')->generate();
$transcript = Transcription::fromStorage('audio.mp3')->generate();
$transcript = Transcription::fromUpload($request->file('audio'))->generate();

return (string) $transcript;
```

`diarize` 方法可用于指示你希望响应在原始文本转录之外，还包含按说话人切分的转录，让你能够按说话人访问切分后的转录：

```php
$transcript = Transcription::fromStorage('audio.mp3')
    ->diarize()
    ->generate();
```

转录生成也可以排队：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Responses\TranscriptionResponse;

Transcription::fromStorage('audio.mp3')
    ->queue()
    ->then(function (TranscriptionResponse $transcript) {
        // ...
    });
```

## 文本摘要

你可以使用 Laravel 的 `Stringable` 类提供的 `summarize` 方法汇总文本。默认情况下，摘要不超过三句话，并使用配置提供商最便宜的文本模型生成：

```php
use Illuminate\Support\Str;

$summary = Str::of($article)->summarize();
```

你可以指定生成摘要所用的最大句数、提供商、模型与超时。`Str` 类还提供了该方法的静态版本：

```php
use Laravel\Ai\Enums\Lab;

$summary = Str::of($article)->summarize(
    sentences: 4,
    provider: Lab::Anthropic,
    model: 'claude-sonnet-5',
    timeout: 30,
);

$summary = Str::summarize($article, sentences: 4);
```

## 嵌入向量

你可以使用 Laravel 的 `Stringable` 类提供的 `toEmbeddings` 方法，为任意给定字符串轻松生成向量嵌入：

```php
use Illuminate\Support\Str;

$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

或者，你可以使用 `Embeddings` 类一次性为多个输入生成嵌入：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    'Napa Valley has great wine.',
    'Laravel is a PHP framework.',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

你可以指定嵌入的维度与提供商：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->dimensions(1536)
    ->generate(Lab::OpenAI, 'text-embedding-3-small');
```

### 多模态嵌入向量

除了字符串，`Embeddings::for` 方法还接受图像、音频、文档与视频输入，让你可以为非文本内容生成嵌入。Gemini 支持图像、音频、文档、视频嵌入，VoyageAI 支持图像与视频嵌入：

```php
use Laravel\Ai\Embeddings;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Files\Image;
use Laravel\Ai\Files\Video;

$response = Embeddings::for([
    'A vineyard at sunset.',
    Image::fromStorage('vineyard.jpg'),
    Video::fromPath('/home/laravel/tour.mp4'),
])->generate(Lab::Gemini);
```

多模态输入使用与 [附件](#attachments) 相同的文件类。这些文件可以从本地路径、文件系统磁盘、远程 URL 或 Base64 编码内容创建。图像、文档、视频也可由上传文件创建，文档则可由原始字符串内容创建：

```php
use Laravel\Ai\Files\Audio;
use Laravel\Ai\Files\Document;
use Laravel\Ai\Files\Image;
use Laravel\Ai\Files\Video;

Image::fromPath('/home/laravel/photo.jpg');
Image::fromStorage('photo.jpg');
Image::fromUpload($request->file('photo'));

Audio::fromPath('/home/laravel/clip.mp3');
Audio::fromStorage('clip.mp3');
Audio::fromUpload($request->file('clip.mp3'));

Video::fromPath('/home/laravel/video.mp4');
Video::fromStorage('video.mp4');
Video::fromUpload($request->file('video'));

Document::fromUrl('https://example.com/report.pdf');
Document::fromString('Laravel is a PHP framework.', 'text/plain');
Document::fromUpload($request->file('report'));
```

> [!NOTE]
> VoyageAI 不允许在单个请求中混用远程 URL 媒体与 Base64 编码媒体。本地、已存储、已上传的文件会作为 Base64 编码内容发送，文本输入则可以与任一种媒体来源组合。请参阅你的提供商文档，了解哪些多模态模型与输入可用。

### 查询嵌入向量

生成嵌入后，你通常会把它们存储在数据库的 `vector` 列中以便日后查询。Laravel 通过 `pgvector` 扩展与 MariaDB 原生支持 PostgreSQL 上的向量列。开始时，在你的迁移中定义一个 `vector` 列，并指定维度数量：

```php
Schema::ensureVectorExtensionExists();

Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->vector('embedding', dimensions: 1536);
    $table->timestamps();
});
```

你还可以添加向量索引来加速相似度搜索。在向量列上调用 `index` 时，Laravel 会自动创建使用余弦距离的 HNSW 索引：

```php
$table->vector('embedding', dimensions: 1536)->index();
```

在你的 Eloquent 模型上，应使用 `AsVector` 类型转换（cast）来转换该向量列：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

要查询相似记录，请使用 `whereVectorSimilarTo` 方法。该方法按最小余弦相似度（介于 `0.0` 与 `1.0` 之间，`1.0` 为完全相同）筛选结果，并按相似度排序：

```php
use App\Models\Document;

$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

`$queryEmbedding` 可以是浮点数组或普通字符串。传入字符串时，Laravel 会自动为其生成嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

如果你需要更强的控制，可以独立使用较低层的 `whereVectorDistanceLessThan`、`selectVectorDistance`、`orderByVectorDistance` 方法：

```php
$documents = Document::query()
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

如果你希望让智能体把相似度搜索作为工具使用，请参阅 [相似度搜索](#similarity-search) 工具文档。

> [!NOTE]
> 向量查询目前支持使用 `pgvector` 扩展的 PostgreSQL 连接，以及 MariaDB 11.7 及以上版本。

### 缓存嵌入向量

嵌入生成可以被缓存，以避免对相同输入发起冗余的 API 调用。要启用缓存，请将 `ai.caching.embeddings.cache` 配置选项设为 `true`：

```php
'caching' => [
    'embeddings' => [
        'cache' => true,
        'store' => env('CACHE_STORE', 'database'),
        'individually' => true,
        // ...
    ],
],
```

启用缓存后，嵌入会缓存 30 天。缓存键基于提供商、模型、维度与输入内容，确保相同的请求返回缓存结果，而不同的配置生成新的嵌入。

默认情况下，每个输入的嵌入都缓存在各自的键下，因此即便输入集合或其顺序发生变化，后续请求命中之前见过的输入时仍可使用缓存。若改为将整个输入集合缓存到单一键下，请将 `ai.caching.embeddings.individually` 配置选项设为 `false`。

即便全局缓存被禁用，你也可以使用 `cache` 方法为特定请求启用缓存：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->cache()
    ->generate();
```

你可以指定自定义的缓存时长（秒）：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->cache(seconds: 3600) // 缓存 1 小时
    ->generate();
```

`toEmbeddings` Stringable 方法也接受 `cache` 参数：

```php
// 使用默认时长缓存……
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: true);

// 缓存指定时长……
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: 3600);
```

## 重排序

重排（reranking）允许你根据文档与给定查询的相关性对其重新排序。这让你可以借助语义理解改进搜索结果：

`Laravel\Ai\Reranking` 类可用于对文档重排：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library for building user interfaces.',
])->rerank('PHP frameworks');

// 访问排名第一的结果……
$response->first()->document; // "Laravel is a PHP web application framework."
$response->first()->score;    // 0.95
$response->first()->index;    // 1（原始位置）
```

`limit` 方法可用于限制返回的结果数量：

```php
$response = Reranking::of($documents)
    ->limit(5)
    ->rerank('search query');
```

### 对集合重排序

为方便起见，Laravel 集合可以使用 `rerank` 宏进行重排。第一个参数指定用于重排的字段，第二个参数是查询：

```php
// 按单个字段重排……
$posts = Post::all()
    ->rerank('body', 'Laravel tutorials');

// 按多个字段重排（以 JSON 形式发送）……
$reranked = $posts->rerank(['title', 'body'], 'Laravel tutorials');

// 使用闭包构建文档来重排……
$reranked = $posts->rerank(
    fn ($post) => $post->title.': '.$post->body,
    'Laravel tutorials'
);
```

你还可以限制结果数量并指定提供商：

```php
$reranked = $posts->rerank(
    by: 'content',
    query: 'Laravel tutorials',
    limit: 10,
    provider: Lab::Cohere
);
```

## 文件

`Laravel\Ai\Files` 类或各个文件类可用于将文件存储在你的 AI 提供商处，以便日后在对话中复用。这对你希望多次引用而无需重复上传的大型文档或文件很有用：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Files\Image;

// 从本地路径存储文件……
$response = Document::fromPath('/home/laravel/document.pdf')->put();
$response = Image::fromPath('/home/laravel/photo.jpg')->put();

// 存储位于文件系统磁盘上的文件……
$response = Document::fromStorage('document.pdf', disk: 'local')->put();
$response = Image::fromStorage('photo.jpg', disk: 'local')->put();

// 存储位于远程 URL 上的文件……
$response = Document::fromUrl('https://example.com/document.pdf')->put();
$response = Image::fromUrl('https://example.com/photo.jpg')->put();

return $response->id;
```

你也可以存储原始内容或上传的文件：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Files\Document;

// 存储原始内容……
$stored = Document::fromString('Hello, World!', 'text/plain')->put();

// 存储上传的文件……
$stored = Document::fromUpload($request->file('document'))->put();
```

文件存储后，你可以在通过智能体生成文本时引用该文件，而无需重新上传：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Files;

$response = (new SalesCoach)->prompt(
    'Analyze the attached sales transcript...'
    attachments: [
        Files\Document::fromId('file-id') // 附加已存储的文档……
    ]
);
```

要获取之前存储的文件，请使用文件实例上的 `get` 方法：

```php
use Laravel\Ai\Files\Document;

$file = Document::fromId('file-id')->get();

$file->id;
$file->mimeType();
```

要从提供商处删除文件，请使用 `delete` 方法：

```php
Document::fromId('file-id')->delete();
```

默认情况下，`Files` 类使用应用 `config/ai.php` 配置文件中配置的默认 AI 提供商。对于大多数操作，你可以使用 `provider` 参数指定其他提供商：

```php
$response = Document::fromPath(
    '/home/laravel/document.pdf'
)->put(provider: Lab::Anthropic);
```

你可以使用 `withProviderOptions` 方法传递提供商专属的上传选项。例如，你可以设置 OpenAI 文件的 `purpose`：

```php
use Laravel\Ai\Files\Document;

$response = Document::fromPath('/home/laravel/knowledge.txt')
    ->withProviderOptions(['purpose' => 'assistants'])
    ->put();
```

要按提供商限定选项，请传入一个接收当前提供商的闭包：

```php
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Files\Document;

$response = Document::fromPath('/home/laravel/training.jsonl')
    ->withProviderOptions(fn (Lab|string $provider) => match ($provider) {
        Lab::OpenAI => ['purpose' => 'fine-tune'],
        default => [],
    })
    ->put();
```

### 在会话中使用已存储文件

文件在提供商处存储后，你可以使用 `Document` 或 `Image` 类的 `fromId` 方法，在智能体对话中引用它：

```php
use App\Ai\Agents\DocumentAnalyzer;
use Laravel\Ai\Files;
use Laravel\Ai\Files\Document;

$stored = Document::fromPath('/path/to/report.pdf')->put();

$response = (new DocumentAnalyzer)->prompt(
    'Summarize this document.',
    attachments: [
        Document::fromId($stored->id),
    ],
);
```

同理，已存储的图像可以使用 `Image` 类引用：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Files\Image;

$stored = Image::fromPath('/path/to/photo.jpg')->put();

$response = (new ImageAnalyzer)->prompt(
    'What is in this image?',
    attachments: [
        Image::fromId($stored->id),
    ],
);
```

## 向量存储

向量存储（vector store）允许你创建可搜索的文件集合，用于检索增强生成（RAG）。`Laravel\Ai\Stores` 类提供了创建、获取与删除向量存储的方法：

```php
use Laravel\Ai\Stores;

// 创建新的向量存储……
$store = Stores::create('Knowledge Base');

// 使用额外选项创建存储……
$store = Stores::create(
    name: 'Knowledge Base',
    description: 'Documentation and reference materials.',
    expiresWhenIdleFor: days(30),
);

return $store->id;
```

要根据 ID 获取已有的向量存储，请使用 `get` 方法：

```php
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

$store->id;
$store->name;
$store->fileCounts;
$store->ready;
```

要删除向量存储，请使用 `Stores` 类或存储实例上的 `delete` 方法：

```php
use Laravel\Ai\Stores;

// 按 ID 删除……
Stores::delete('store_id');

// 或经由存储实例删除……
$store = Stores::get('store_id');

$store->delete();
```

### 向存储添加文件

拥有向量存储后，你可以使用 `add` 方法将 [文件](#files) 添加到其中。添加到存储的文件会自动建立索引，以便通过 [文件搜索提供商工具](#file-search) 进行语义搜索：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

// 添加已在该提供商处存储的文件……
$document = $store->add('file_id');
$document = $store->add(Document::fromId('file_id'));

// 或一步完成存储并添加……
$document = $store->add(Document::fromPath('/path/to/document.pdf'));
$document = $store->add(Document::fromStorage('manual.pdf'));
$document = $store->add($request->file('document'));

$document->id;
$document->fileId;
```

> **注意：** 通常，当把之前已存储的文件添加到向量存储时，返回的文档 ID 会与文件原先分配的 ID 一致；但部分向量存储提供商可能返回一个新的、不同的「文档 ID」。因此建议你始终将这两个 ID 都存入数据库，以便日后引用。

你可以向文件添加元数据，再将其加入存储。这些元数据之后可用于在使用 [文件搜索提供商工具](#file-search) 时筛选搜索结果：

```php
$store->add(Document::fromPath('/path/to/document.pdf'), metadata: [
    'author' => 'Taylor Otwell',
    'department' => 'Engineering',
    'year' => 2026,
]);
```

要从存储中移除文件，请使用 `remove` 方法：

```php
$store->remove('file_id');
```

从向量存储移除文件，并不会将其从提供商的 [文件存储](#files) 中删除。若要从向量存储移除文件并从文件存储永久删除，请使用 `deleteFile` 参数：

```php
$store->remove('file_abc123', deleteFile: true);
```

## 故障转移

当你发起提示或生成其他媒体时，可以提供一组提供商/模型，以便在主提供商遇到服务中断或限流时，自动故障转移（failover）到备份提供商/模型：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Image;

$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: [Lab::OpenAI, Lab::Anthropic],
);

$image = Image::of('A donut sitting on the kitchen counter')
    ->generate(provider: [Lab::Gemini, Lab::xAI]);
```

故障转移仅在抛出 `FailoverableException` 时发生——例如限流（`RateLimitedException`）、提供商过载或不可用（`ProviderOverloadedException`）、或额度不足（`InsufficientCreditsException`）。普通错误（如校验错误或错误请求错误）不会触发故障转移。

当你传入一个普通提供商列表（如 `[Lab::OpenAI, Lab::Anthropic]`）时，每个提供商都使用其默认模型。要为故障转移链中的每个提供商指定特定模型，请传入以提供商为键的关联数组，使用 `Lab` 枚举的 `value` 作为键（枚举项不能直接用作 PHP 数组键）：

```php
use Laravel\Ai\Enums\Lab;

$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: [
        Lab::Gemini->value => 'gemini-3-flash-preview',
        Lab::DeepSeek->value => 'deepseek-v4-pro',
    ],
);
```

## 测试

伪造排队的图片、音频、转录或嵌入生成时，注册在排队生成上的任何 `then` 回调都会以伪造响应调用，让你可以测试回调内的逻辑。如果你希望这些回调不被调用，也可以同时使用 `Queue::fake()` 来伪造队列。

### 代理

要在测试中伪造智能体的响应，请调用智能体类上的 `fake` 方法。你可以选择提供一个响应数组或闭包：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Prompts\AgentPrompt;

// 为每个提示自动生成一个固定的响应……
SalesCoach::fake();

// 提供一个提示响应列表……
SalesCoach::fake([
    'First response',
    'Second response',
]);

// 根据传入的提示动态处理提示响应……
SalesCoach::fake(function (AgentPrompt $prompt) {
    return 'Response for: '.$prompt->prompt;
});
```

伪造返回结构化输出的智能体时，你可以提供数组作为响应。智能体会返回一个包含给定数据的结构化响应：

```php
SalesCoach::fake([
    ['score' => 87],
]);
```

你也可以伪造一个等待工具批准的响应：

```php
use Laravel\Ai\Approvals\PendingApproval;
use Laravel\Ai\Responses\AgentResponse;

FileAssistant::fake([
    AgentResponse::fakeWithPendingApprovals([
        new PendingApproval(
            id: 'call_abc',
            tool: 'DeleteFile',
            arguments: ['path' => 'invoice.pdf'],
            reason: 'This will permanently delete a file.',
        ),
    ]),
]);

$response = (new FileAssistant)->prompt('Delete the invoice.');

$response->hasPendingApprovals(); // true
```

> **注意：** 当在返回结构化输出、且未显式提供伪造输出的智能体上调用 `Agent::fake()` 时，Laravel 会自动生成与智能体已定义输出结构匹配的伪造数据。

向智能体发起提示后，你可以对收到的提示做断言：

```php
use Laravel\Ai\Prompts\AgentPrompt;

SalesCoach::assertPrompted('Analyze this...');

SalesCoach::assertPrompted(function (AgentPrompt $prompt) {
    return $prompt->contains('Analyze');
});

SalesCoach::assertPromptedTimes(3);

SalesCoach::assertNotPrompted('Missing prompt');

SalesCoach::assertNeverPrompted();
```

断言批准续对话时，你可以检查提示的批准决策：

```php
use Laravel\Ai\Approvals\Decisions;
use Laravel\Ai\Prompts\AgentPrompt;

FileAssistant::fake();

(new FileAssistant)->prompt(Decisions::from([
    'call_abc' => true,
]));

FileAssistant::assertPrompted(function (AgentPrompt $prompt) {
    return $prompt->hasApprovalDecisions()
        && $prompt->approvalDecisions->get('call_abc')->isApproved();
});
```

对于排队的智能体调用，请使用排队的断言方法：

```php
use Laravel\Ai\QueuedAgentPrompt;

SalesCoach::assertQueued('Analyze this...');

SalesCoach::assertQueued(function (QueuedAgentPrompt $prompt) {
    return $prompt->contains('Analyze');
});

SalesCoach::assertNotQueued('Missing prompt');

SalesCoach::assertNeverQueued();
```

要确保所有智能体调用都有对应的伪造响应，可以使用 `preventStrayPrompts`。如果智能体在没有定义伪造响应的情况下被调用，会抛出异常：

```php
SalesCoach::fake()->preventStrayPrompts();
```

### 图像

调用 `Image` 类上的 `fake` 方法，可以伪造图像生成。一旦图像被伪造，就可以对记录的图片生成提示做各种断言：

```php
use Laravel\Ai\Image;
use Laravel\Ai\Prompts\ImagePrompt;
use Laravel\Ai\Prompts\QueuedImagePrompt;

// 为每个提示自动生成一个固定的响应……
Image::fake();

// 提供一个提示响应列表……
Image::fake([
    base64_encode($firstImage),
    base64_encode($secondImage),
]);

// 根据传入的提示动态处理提示响应……
Image::fake(function (ImagePrompt $prompt) {
    return base64_encode('...');
});
```

生成图像后，你可以对收到的提示做断言：

```php
Image::assertGenerated(function (ImagePrompt $prompt) {
    return $prompt->contains('sunset') && $prompt->isLandscape();
});

Image::assertNotGenerated('Missing prompt');

Image::assertNothingGenerated();
```

对于排队的图像生成，请使用排队的断言方法：

```php
Image::assertQueued(
    fn (QueuedImagePrompt $prompt) => $prompt->contains('sunset')
);

Image::assertNotQueued('Missing prompt');

Image::assertNothingQueued();
```

要确保所有图像生成都有对应的伪造响应，可以使用 `preventStrayImages`。如果图像在没有定义伪造响应的情况下被生成，会抛出异常：

```php
Image::fake()->preventStrayImages();
```

### 音频

调用 `Audio` 类上的 `fake` 方法，可以伪造音频生成。一旦音频被伪造，就可以对记录的音频生成提示做各种断言：

```php
use Laravel\Ai\Audio;
use Laravel\Ai\Prompts\AudioPrompt;
use Laravel\Ai\Prompts\QueuedAudioPrompt;

// 为每个提示自动生成一个固定的响应……
Audio::fake();

// 提供一个提示响应列表……
Audio::fake([
    base64_encode($firstAudio),
    base64_encode($secondAudio),
]);

// 根据传入的提示动态处理提示响应……
Audio::fake(function (AudioPrompt $prompt) {
    return base64_encode('...');
});
```

生成音频后，你可以对收到的提示做断言：

```php
Audio::assertGenerated(function (AudioPrompt $prompt) {
    return $prompt->contains('Hello') && $prompt->isFemale();
});

Audio::assertNotGenerated('Missing prompt');

Audio::assertNothingGenerated();
```

对于排队的音频生成，请使用排队的断言方法：

```php
Audio::assertQueued(
    fn (QueuedAudioPrompt $prompt) => $prompt->contains('Hello')
);

Audio::assertNotQueued('Missing prompt');

Audio::assertNothingQueued();
```

要确保所有音频生成都有对应的伪造响应，可以使用 `preventStrayAudio`。如果音频在没有定义伪造响应的情况下被生成，会抛出异常：

```php
Audio::fake()->preventStrayAudio();
```

### 转录

调用 `Transcription` 类上的 `fake` 方法，可以伪造转录生成。一旦转录被伪造，就可以对记录的转录生成提示做各种断言：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Prompts\TranscriptionPrompt;
use Laravel\Ai\Prompts\QueuedTranscriptionPrompt;

// 为每个提示自动生成一个固定的响应……
Transcription::fake();

// 提供一个提示响应列表……
Transcription::fake([
    'First transcription text.',
    'Second transcription text.',
]);

// 根据传入的提示动态处理提示响应……
Transcription::fake(function (TranscriptionPrompt $prompt) {
    return 'Transcribed text...';
});
```

生成转录后，你可以对收到的提示做断言：

```php
Transcription::assertGenerated(function (TranscriptionPrompt $prompt) {
    return $prompt->language === 'en' && $prompt->isDiarized();
});

Transcription::assertNotGenerated(
    fn (TranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingGenerated();
```

对于排队的转录生成，请使用排队的断言方法：

```php
Transcription::assertQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->isDiarized()
);

Transcription::assertNotQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingQueued();
```

要确保所有转录生成都有对应的伪造响应，可以使用 `preventStrayTranscriptions`。如果转录在没有定义伪造响应的情况下被生成，会抛出异常：

```php
Transcription::fake()->preventStrayTranscriptions();
```

### 嵌入向量

调用 `Embeddings` 类上的 `fake` 方法，可以伪造嵌入生成。一旦嵌入被伪造，就可以对记录的嵌入生成提示做各种断言：

```php
use Laravel\Ai\Embeddings;
use Laravel\Ai\Prompts\EmbeddingsPrompt;
use Laravel\Ai\Prompts\QueuedEmbeddingsPrompt;

// 为每个提示自动生成适当维度的伪造嵌入……
Embeddings::fake();

// 提供一个提示响应列表……
Embeddings::fake([
    [$firstEmbeddingVector],
    [$secondEmbeddingVector],
]);

// 根据传入的提示动态处理提示响应……
Embeddings::fake(function (EmbeddingsPrompt $prompt) {
    return array_map(
        fn () => Embeddings::fakeEmbedding($prompt->dimensions),
        $prompt->inputs
    );
});
```

生成嵌入后，你可以对收到的提示做断言：

```php
Embeddings::assertGenerated(function (EmbeddingsPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->dimensions === 1536;
});

Embeddings::assertNotGenerated(
    fn (EmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingGenerated();
```

对于排队的嵌入生成，请使用排队的断言方法：

```php
Embeddings::assertQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Laravel')
);

Embeddings::assertNotQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingQueued();
```

要确保所有嵌入生成都有对应的伪造响应，可以使用 `preventStrayEmbeddings`。如果嵌入在没有定义伪造响应的情况下被生成，会抛出异常：

```php
Embeddings::fake()->preventStrayEmbeddings();
```

### 重排序

调用 `Reranking` 类上的 `fake` 方法，可以伪造重排操作：

```php
use Laravel\Ai\Reranking;
use Laravel\Ai\Prompts\RerankingPrompt;
use Laravel\Ai\Responses\Data\RankedDocument;

// 自动生成伪造的重排响应……
Reranking::fake();

// 提供自定义响应……
Reranking::fake([
    [
        new RankedDocument(index: 0, document: 'First', score: 0.95),
        new RankedDocument(index: 1, document: 'Second', score: 0.80),
    ],
]);
```

重排后，你可以对执行过的操作做断言：

```php
Reranking::assertReranked(function (RerankingPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->limit === 5;
});

Reranking::assertNotReranked(
    fn (RerankingPrompt $prompt) => $prompt->contains('Django')
);

Reranking::assertNothingReranked();
```

### 文件

调用 `Files` 类上的 `fake` 方法，可以伪造文件操作：

```php
use Laravel\Ai\Files;

Files::fake();
```

文件操作被伪造后，你可以对发生的上传与删除做断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

// 存储文件……
Document::fromString('Hello, Laravel!', mimeType: 'text/plain')
    ->as('hello.txt')
    ->put();

// 做断言……
Files::assertStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, Laravel!' &&
        $file->mimeType() === 'text/plain';
);

Files::assertNotStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, World!'
);

Files::assertNothingStored();
```

要对文件删除做断言，你可以传入文件 ID：

```php
Files::assertDeleted('file-id');
Files::assertNotDeleted('file-id');
Files::assertNothingDeleted();
```

### 向量存储

调用 `Stores` 类上的 `fake` 方法，可以伪造向量存储操作。伪造存储还会自动伪造 [文件操作](#files)：

```php
use Laravel\Ai\Stores;

Stores::fake();
```

存储操作被伪造后，你可以对创建或删除的存储做断言：

```php
use Laravel\Ai\Stores;

// 创建存储……
$store = Stores::create('Knowledge Base');

// 做断言……
Stores::assertCreated('Knowledge Base');

Stores::assertCreated(fn (string $name, ?string $description) =>
    $name === 'Knowledge Base'
);

Stores::assertNotCreated('Other Store');

Stores::assertNothingCreated();
```

要对存储删除做断言，你可以提供存储 ID：

```php
Stores::assertDeleted('store_id');
Stores::assertNotDeleted('other_store_id');
Stores::assertNothingDeleted();
```

要对文件的添加或移除做断言，请使用给定 `Store` 实例上的断言方法：

```php
Stores::fake();

$store = Stores::get('store_id');

// 添加 / 移除文件……
$store->add('added_id');
$store->remove('removed_id');

// 做断言……
$store->assertAdded('added_id');
$store->assertRemoved('removed_id');

$store->assertNotAdded('other_file_id');
$store->assertNotRemoved('other_file_id');
```

如果文件存储在提供商的 [文件存储](#files) 中并在同一请求添加到向量存储，你可能不知道该文件的提供商 ID。此时，你可以向 `assertAdded` 方法传入闭包，对添加的文件内容做断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

$store->add(Document::fromString('Hello, World!', 'text/plain')->as('hello.txt'));

$store->assertAdded(fn (StorableFile $file) => $file->name() === 'hello.txt');
$store->assertAdded(fn (StorableFile $file) => $file->content() === 'Hello, World!');
```

## 事件

Laravel AI SDK 会分发多种 [事件](/docs/{{version}}/events)，包括：

- `AddingFileToStore`
- `AgentFailed`
- `AgentFailedOver`
- `AgentPrompted`
- `AgentStreamed`
- `AudioGenerated`
- `CreatingStore`
- `EmbeddingsGenerated`
- `FileAddedToStore`
- `FileDeleted`
- `FileRemovedFromStore`
- `FileStored`
- `GeneratingAudio`
- `GeneratingEmbeddings`
- `GeneratingImage`
- `GeneratingTranscription`
- `ImageGenerated`
- `InvokingTool`
- `PromptingAgent`
- `ProviderFailedOver`
- `RemovingFileFromStore`
- `Reranked`
- `Reranking`
- `StartingStep`
- `StepCompleted`
- `StepFailed`
- `StoreCreated`
- `StoreDeleted`
- `StoringFile`
- `StreamingAgent`
- `ToolApprovalRequested`
- `ToolApprovalResolved`
- `ToolFailed`
- `ToolInvoked`
- `TranscriptionGenerated`

你可以监听其中任意事件来记录或存储 AI SDK 的使用信息。
