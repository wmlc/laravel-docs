# Laravel AI SDK

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [自定义 Base URL](#custom-base-urls)
    - [OpenAI 兼容服务商](#openai-compatible-providers)
    - [服务商支持](#provider-support)
- [智能体](#agents)
    - [提示](#prompting)
    - [对话上下文](#conversation-context)
    - [结构化输出](#structured-output)
    - [附件](#attachments)
    - [流式传输](#streaming)
    - [广播](#broadcasting)
    - [队列](#queueing)
    - [工具](#tools)
    - [延迟工具加载](#deferred-tool-loading)
    - [文件存储工具](#file-storage-tools)
    - [MCP 工具](#mcp-tools)
    - [服务商工具](#provider-tools)
    - [子智能体](#sub-agents)
    - [中间件](#middleware)
    - [匿名智能体](#anonymous-agents)
    - [智能体配置](#agent-configuration)
    - [服务商选项](#provider-options)
    - [提示词缓存](#prompt-caching)
- [人工工具审批](#human-tool-approval)
    - [完整审批流程](#complete-approval-flow)
- [图像](#images)
- [音频（TTS）](#audio)
- [转录（STT）](#transcription)
- [文本摘要](#text-summarization)
- [嵌入](#embeddings)
    - [多模态嵌入](#multimodal-embeddings)
    - [查询嵌入](#querying-embeddings)
    - [缓存嵌入](#caching-embeddings)
- [重排序](#reranking)
- [文件](#files)
- [向量存储](#vector-stores)
    - [向存储中添加文件](#adding-files-to-stores)
- [故障转移](#failover)
- [测试](#testing)
    - [智能体](#testing-agents)
    - [图像](#testing-images)
    - [音频](#testing-audio)
    - [转录](#testing-transcriptions)
    - [嵌入](#testing-embeddings)
    - [重排序](#testing-reranking)
    - [文件](#testing-files)
    - [向量存储](#testing-vector-stores)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel AI SDK](https://github.com/laravel/ai) 提供了一套统一且富有表现力的 API，用于与 OpenAI、Anthropic、Gemini 等各类 AI 服务商交互。借助 AI SDK，你可以构建带有工具和结构化输出的智能体（agent），生成图像，合成与转录音频，创建向量嵌入，以及更多功能——所有这些都可以通过一致且对 Laravel 友好的接口完成。

<a name="installation"></a>
## 安装

你可以通过 Composer 安装 Laravel AI SDK：

```shell
composer require laravel/ai
```

接下来，应使用 `vendor:publish` Artisan 命令发布 AI SDK 的配置文件与数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

最后，你应当运行应用的数据库迁移。这将创建 AI SDK 用于存储对话的 `agent_conversations` 与 `agent_conversation_messages` 两张数据表：

```shell
php artisan migrate
```

<a name="configuration"></a>
### 配置

你可以在应用的 `config/ai.php` 配置文件中，或以环境变量形式在应用的 `.env` 文件中定义 AI 服务商凭据：

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

用于文本、图像、音频、转录与嵌入的默认模型也可以在应用的 `config/ai.php` 配置文件中配置。

<a name="custom-base-urls"></a>
### 自定义 Base URL

默认情况下，Laravel AI SDK 会直接连接到每个服务商的公开 API 端点。不过，你可能需要将请求路由到不同的端点——例如，使用代理服务来集中管理 API 密钥、实施速率限制，或通过企业网关路由流量。

你可以通过在服务商配置中添加 `url` 参数来配置自定义 Base URL：

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

当你通过代理服务（如 LiteLLM 或 Azure OpenAI Gateway）或使用替代端点时，这非常有用。

自定义 Base URL 支持以下服务商：OpenAI、Anthropic、Gemini、Groq、Cohere、DeepSeek、xAI 和 OpenRouter。

<a name="openai-compatible-providers"></a>
### OpenAI 兼容服务商

如果你使用的是 OpenAI 兼容的 API（例如 LM Studio、vLLM、Together、Fireworks 或本地网关），可以配置一个 `openai-compatible` 服务商。`url` 选项是必填的，而 `key` 选项是可选的，存在时会作为 bearer token 发送：

```php
'providers' => [
    'local' => [
        'driver' => 'openai-compatible',
        'url' => env('LOCAL_AI_URL'),
        'key' => env('LOCAL_AI_API_KEY'),
    ],
],
```

配置完成后，你可以像使用其他服务商一样使用命名服务商：

```php
agent()->prompt('What is Laravel?', provider: 'local', model: 'local-model');
```

你还可以为该服务商配置默认文本模型，从而无需显式传入模型：

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

你可以通过在其配置中定义 `headers` 数组，为发往该服务商的每个请求添加自定义 HTTP 头。当某个端点除了 bearer token 之外，还需要额外的标识或鉴权请求头时，这非常有用：

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

OpenAI 兼容服务商支持文本生成、流式传输、工具、结构化输出、图像附件、嵌入与转录。如果你的端点需要额外的请求体字段，请使用 [服务商选项](#provider-options) 提供。

<a name="openai-compatible-embeddings"></a>
#### OpenAI 兼容嵌入

由于任意端点没有已知的模型，你必须配置一个默认的嵌入模型，才能在一个 OpenAI 兼容服务商上使用 `embeddings()`。你还可以配置一个固定的维度值；如果省略，请求将不带 `dimensions` 参数发送，并使用模型原生的维度。

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

<a name="openai-compatible-transcriptions"></a>
#### OpenAI 兼容转录

同样地，你必须配置一个默认的转录模型，才能在一个 OpenAI 兼容服务商上使用 `Transcription`。音频将以标准的 multipart 请求上传到端点的 `/audio/transcriptions` 路由：

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
> OpenAI 兼容与 Groq 服务商不支持说话人分离（diarization）。在使用这些服务商时调用 `diarize` 方法将抛出异常。

<a name="provider-support"></a>
### 服务商支持

AI SDK 在其各项功能中支持多种服务商。下表汇总了每个功能可用的服务商：

<div class="overflow-auto">

| 功能 | 服务商 |
|---|---|
| Text | OpenAI, OpenAI Compatible, Anthropic, Gemini, Azure, Bedrock, Groq, xAI, DeepSeek, Mistral, Ollama, OpenRouter |
| Images | OpenAI, Gemini, xAI, Azure, Bedrock, OpenRouter |
| TTS | OpenAI, ElevenLabs, Gemini, Mistral |
| STT | OpenAI, OpenAI Compatible, ElevenLabs, Groq, Mistral, Gemini |
| Embeddings | OpenAI, OpenAI Compatible, Gemini, Azure, Bedrock, Cohere, Mistral, Jina, VoyageAI, Ollama, OpenRouter |
| Reranking | Cohere, Jina, VoyageAI, Bedrock |
| Files | OpenAI, Anthropic, Gemini, Azure |

</div>

在整个代码中，你可以使用 `Laravel\Ai\Enums\Lab` 枚举来引用服务商，而不是使用纯字符串：

```php
use Laravel\Ai\Enums\Lab;

Lab::Anthropic;
Lab::OpenAI;
Lab::OpenAiCompatible;
Lab::Gemini;
// ...
```

<a name="agents"></a>
## 智能体

智能体是 Laravel AI SDK 中与 AI 服务商交互的基本构建块。每个智能体都是一个专用的 PHP 类，封装了与大语言模型交互所需的指令、对话上下文、工具与输出 schema。可以将智能体视作一个专门的助手——一位销售教练、文档分析器、支持机器人——你只需配置一次，便可在应用各处按需向其发出提示。

你可以使用 `make:agent` Artisan 命令创建一个智能体：

```shell
php artisan make:agent SalesCoach

php artisan make:agent SalesCoach --structured
```

在生成的智能体类中，你可以定义系统提示词 / 指令、消息上下文、可用工具以及输出 schema（如适用）：

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
     * 获取迄今为止组成的对话消息列表。
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
     * 获取智能体的结构化输出 schema 定义。
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

<a name="prompting"></a>
### 提示

要向智能体发出提示，首先使用 `make` 方法或标准实例化创建一个实例，然后调用 `prompt`：

```php
$response = (new SalesCoach)
    ->prompt('Analyze this sales transcript...');

return (string) $response;
```

`make` 方法会从服务容器中解析你的智能体，从而支持自动依赖注入。你也可以向智能体的构造函数传入参数：

```php
$agent = SalesCoach::make(user: $user);
```

通过向 `prompt` 方法传入额外参数，你可以在提示时覆盖默认的服务商、模型或 HTTP 超时时间：

```php
$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: Lab::Anthropic,
    model: 'claude-sonnet-5',
    timeout: 120,
);
```

<a name="raw-http-responses"></a>
#### 原始 HTTP 响应

每个由文本生成型智能体返回的响应，都会通过 `raw` 属性暴露底层服务商 API 调用的原始 HTTP 响应。这让你能够访问不属于 AI SDK 通用响应的服务商特定信息——速率限制请求头、请求 ID，或其他精确的负载字段：

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

> **Note:** 在流式传输响应时、`Bedrock` 服务商（它通过 AWS SDK 而非 HTTP 客户端执行其 API 调用）下，以及伪造的响应上（除非通过 `withRawResponse` 显式提供），`raw` 属性为 `null`。

<a name="conversation-context"></a>
### 对话上下文

如果你的智能体实现了 `Conversational` 接口，则可以使用 `messages` 方法返回先前的对话上下文（如适用）：

```php
use App\Models\History;
use Laravel\Ai\Messages\Message;

/**
 * 获取迄今为止组成的对话消息列表。
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

<a name="remembering-conversations"></a>
#### 记忆对话

> **Warning:** 在使用 `RemembersConversations` Trait 之前，你应当使用 `vendor:publish` Artisan 命令发布并运行 AI SDK 迁移。这些迁移会创建用于存储对话所需的数据库表。

如果你希望 Laravel 自动为你的智能体存储并检索对话历史，可以使用 `RemembersConversations` Trait。该 Trait 提供了一种简单的方式，无需手动实现 `Conversational` 接口即可将对话消息持久化到数据库：

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

使用 `RemembersConversations` Trait 时，不要在智能体类中手动定义 `messages` 方法。如果存在 `messages` 方法，它将优先于该 Trait 的实现，对话历史将不会从数据库加载。

要在为用户开启新对话，请在提示前调用 `forUser` 方法：

```php
$response = (new SalesCoach)->forUser($user)->prompt('Hello!');

$conversationId = $response->conversationId;
```

对话 ID 会在响应中返回，可存储以备后续使用。如果你希望使用 Eloquent 检索用户的所有对话，可以向用户模型添加 `HasConversations` Trait：

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

一旦将 Trait 添加到模型中，你就可以通过 `conversations` 关联检索并查询用户的对话：

```php
$conversations = $user->conversations()
    ->latest('updated_at')
    ->paginate(20);
```

要延续一个已有的对话，请使用 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $user)
    ->prompt('Tell me more about that.');
```

使用 `RemembersConversations` Trait 时，之前的消息会在提示时自动加载并包含在对话上下文中。新的消息（用户与助手双方）会在每次交互后自动存储。

<a name="conversation-participants"></a>
#### 对话参与者

虽然用户是最常见的对话参与者，但对话也可以属于任意 Eloquent 模型。使用 `forParticipant` 方法为另一种类型的模型开启对话：

```php
$response = (new SalesCoach)
    ->forParticipant($team)
    ->prompt('Review our latest sales results.');
```

参与者的 morph 类与主键会随对话一起存储。因此，具有相同主键的不同类型模型（例如 `User` ID `1` 与 `Team` ID `1`）拥有各自独立的对话历史。`forUser` 方法是 `forParticipant` 的别名。

你可以使用 `continueLastConversation` 方法延续参与者最近的对话：

```php
$response = (new SalesCoach)
    ->continueLastConversation($team)
    ->prompt('Tell me more about that.');
```

延续特定对话时，请将参与者传递给 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $team)
    ->prompt('Tell me more about that.');
```

`HasConversations` Trait 可被添加到任何参与对话的 Eloquent 模型上。生成的 `conversations` 关联是一个多态关联，限定于该模型的类型与主键。你也可以通过其反向关联访问拥有某次对话的参与者：

```php
$conversations = $team->conversations;

$participant = $conversation->participant;
```

如果你的应用使用了多种参与者模型类型，应考虑定义 [Eloquent morph map](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，以便存储的参与者类型不与你的模型类名耦合。

> [!WARNING]
> `continue` 方法不会验证给定参与者是否拥有该对话。在延续对话之前，你的应用应当对其访问进行授权。

<a name="structured-output"></a>
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
     * 获取智能体的结构化输出 schema 定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
        ];
    }
}
```

向返回结构化输出的智能体发出提示时，你可以像访问数组一样访问返回的 `StructuredAgentResponse`：

```php
$response = (new SalesCoach)->prompt('Analyze this sales transcript...');

return $response['score'];
```

<a name="structured-output-nested-objects"></a>
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
     * 获取智能体的结构化输出 schema 定义。
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

<a name="structured-output-arrays-of-objects"></a>
#### 对象数组

如果你的智能体应返回一组结构化条目，请结合使用 `array` 与 `object` 方法：

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

如果一个值可能匹配多个 schema 中的某一个，请使用 `anyOf` 方法：

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

<a name="attachments"></a>
### 附件

提示时，你可以随提示一同传入附件，让模型检查图像与文档：

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

同样地，`Laravel\Ai\Files\Image` 类可用于向提示附加图像：

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

<a name="streaming"></a>
### 流式传输

你可以通过调用 `stream` 方法来流式传输智能体的响应。返回的 `StreamableAgentResponse` 可以从路由中返回，以自动向客户端发送流式响应（SSE）：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)->stream('Analyze this sales transcript...');
});
```

`then` 方法可用于提供一个闭包，当整个响应已流式传输到客户端时调用：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Responses\StreamedAgentResponse;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->then(function (StreamedAgentResponse $response) {
            // $response->text, $response->events, $response->usage...
        });
});
```

或者，你也可以手动遍历流式事件：

```php
$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    // ...
}
```

<a name="streaming-using-the-vercel-ai-sdk-protocol"></a>
#### 使用 Vercel AI SDK 流协议进行流式传输

你可以通过在可流式响应上调用 `usingVercelDataProtocol` 方法，使用 [Vercel AI SDK 流协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) 来流式传输事件：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->usingVercelDataProtocol();
});
```

<a name="broadcasting"></a>
### 广播

你可以通过几种不同的方式广播流式事件。首先，你可以直接在流式事件上调用 `broadcast` 或 `broadcastNow` 方法：

```php
use App\Ai\Agents\SalesCoach;
use Illuminate\Broadcasting\Channel;

$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    $event->broadcast(new Channel('channel-name'));
}
```

或者，你可以调用智能体的 `broadcastOnQueue` 方法，将智能体操作入队，并在流式事件可用时将其广播：

```php
(new SalesCoach)->broadcastOnQueue(
    'Analyze this sales transcript...'
    new Channel('channel-name'),
);
```

<a name="skipping-oversized-events"></a>
#### 跳过超大事件

某些广播平台将 WebSocket 消息限制为约 10KB。数据量大的流式事件（如大型工具结果）可能超出此限制，导致广播失败。你可以使用 `WithoutBroadcasting` 属性排除特定事件类型的广播：

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

被排除的事件永远不会被广播，但它们仍会持久化到 `agent_conversation_messages` 数据表中，因此你的前端可以在流完成后加载完整的工具数据。这对于入队的（`broadcastOnQueue`）与同步的（`broadcast` / `broadcastNow`）广播都适用。

<a name="queueing"></a>
### 队列

使用智能体的 `queue` 方法，你可以向智能体发出提示，同时让其在后台处理响应，使你的应用保持快速与响应灵敏。你可以使用 `then` 与 `catch` 方法注册闭包，在响应可用或发生异常时调用：

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

<a name="tools"></a>
### 工具

工具可用于为智能体提供额外的功能，以便其在响应提示时使用。你可以使用 `make:tool` Artisan 命令创建工具：

```shell
php artisan make:tool RandomNumberGenerator
```

生成的工具会放置在应用的 `app/Ai/Tools` 目录中。每个工具都包含一个 `handle` 方法，当智能体需要使用该工具时会被调用：

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
     * 获取工具的 schema 定义。
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

一旦你定义了工具，就可以从任意智能体的 `tools` 方法中返回它：

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

<a name="validating-tool-arguments"></a>
#### 校验工具参数

尽管你的工具 schema 约束了模型可能提供的参数，你仍可以使用请求的 `validate` 方法校验传入的参数：

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

当校验失败时，校验消息会作为工具的结果返回给模型，使其能够更正参数并再次调用工具。

<a name="repairing-tool-calls"></a>
#### 修复工具调用

使用 `RepairToolCalls` 属性，可以让智能体在模型调用了未知的本地工具时恢复。Laravel 会将失败的调用连同可用本地工具的名称一起返回给模型，使其能够更正调用：

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

当 Laravel 自动推导最大步数时，该属性会为修复后的调用额外增加一步。显式的 `MaxSteps` 限制不受影响。

<a name="similarity-search"></a>
#### 相似度搜索

`SimilaritySearch` 工具允许智能体使用存储在数据库中的向量嵌入，搜索与给定查询相似的文档。当你希望让智能体能够搜索应用数据时，这对于检索增强生成（RAG）非常有用。

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

你也可以提供介于 `0.0` 与 `1.0` 之间的最小相似度阈值，以及一个用于自定义查询的闭包：

```php
SimilaritySearch::usingModel(
    model: Document::class,
    column: 'embedding',
    minSimilarity: 0.7,
    limit: 10,
    query: fn ($query) => $query->where('published', true),
),
```

如需更强的控制，你可以创建一个带有自定义闭包的相似度搜索工具，该闭包返回搜索结果：

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

<a name="deferred-tool-loading"></a>
### 延迟工具加载

默认情况下，智能体暴露的每个工具都会随每个请求一起发送给服务商。当智能体提供大量工具时，这会消耗 token 并可能降低模型选择工具的准确性。结合 OpenAI 或 Anthropic 使用 `ToolSearch` 服务商工具，你可以延迟工具定义，使服务商仅在需要时加载它们：

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

被包裹的工具无需任何修改。服务商会在其与提示相关时搜索并加载它们，之后智能体便可以像调用其他工具一样调用它们。

使用 Anthropic 时，可以使用 `strategy` 参数决定服务商应如何搜索延迟加载的工具。支持的策略有 `regex`（默认）与 `bm25`：

```php
new ToolSearch(tools: [new SearchInvoices], strategy: 'bm25'),
```

使用 Anthropic 时，可以使用 `withProviderOptions` 方法向搜索工具传入额外的服务商特定选项：

```php
(new ToolSearch(tools: [new SearchInvoices]))
    ->withProviderOptions(['cache_control' => ['type' => 'ephemeral']]),
```

> [!WARNING]
> 不支持工具搜索的服务商会抛出异常，而不会静默丢弃延迟加载的工具。此外，Anthropic 要求至少有一个工具须在 `ToolSearch` 包装之外提供。

<a name="file-storage-tools"></a>
### 文件存储工具

`FileStorage` 工具工厂允许你为智能体提供对 Laravel [文件系统磁盘](/docs/{{version}}/filesystem) 的访问。 `all` 方法返回的工具允许智能体在给定磁盘上列出、读取、检查、生成 URL、写入、删除与复制文件：

```php
use Laravel\Ai\Tools\FileStorage;

public function tools(): iterable
{
    return FileStorage::all('local');
}
```

如果你的智能体只应能检查文件，请使用 `readOnly` 方法：

```php
return FileStorage::readOnly('local');
```

这些方法返回一个 `Illuminate\Support\Collection`，让你可以进一步筛选提供给智能体的工具：

```php
use Laravel\Ai\Tools\Filesystem\DeleteFile;

return FileStorage::all('s3')
    ->reject(fn ($tool) => $tool instanceof DeleteFile);
```

<a name="mcp-tools"></a>
### MCP 工具

如果你的应用使用了 [Laravel MCP](/docs/{{version}}/mcp)，你可以为智能体提供由 [模型上下文协议](https://modelcontextprotocol.io)（Model Context Protocol，MCP）服务器暴露的工具。借助 [Laravel MCP 客户端](/docs/{{version}}/mcp#client)，你可以连接到远程或本地的 MCP 服务器，并将其工具直接传递给你的智能体。

> [!NOTE]
> MCP 工具需要你的应用中安装了 [Laravel MCP](/docs/{{version}}/mcp) 包。

因为 MCP 客户端的 `tools` 方法返回的是一个集合，所以请使用 `...` 运算符将其展开到智能体的 `tools` 数组中：

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

AI SDK 会自动包装每个 MCP 工具，使智能体可以像调用其他工具一样调用它。你也可以使用 [具名的 MCP 客户端](/docs/{{version}}/mcp#named-clients)：

```php
use Laravel\Mcp\Facades\Mcp;

public function tools(): iterable
{
    return [
        ...Mcp::client('github')->tools(),
    ];
}
```

或者连接到一个 [本地 MCP 服务器](/docs/{{version}}/mcp#client-connecting)：

```php
use Laravel\Mcp\Client;

public function tools(): iterable
{
    return [
        ...Client::local('php', ['artisan', 'mcp:start'])->tools(),
    ];
}
```

关于创建与鉴权 MCP 客户端（包括 bearer token 与 OAuth）的更多信息，请参阅 [MCP 客户端文档](/docs/{{version}}/mcp#client)。

<a name="provider-tools"></a>
### 服务商工具

服务商工具是由 AI 服务商原生实现的特殊工具，提供诸如网络搜索、URL 抓取与文件搜索等能力。与常规工具不同，服务商工具由服务商自身执行，而非你的应用。

服务商工具可由你的智能体的 `tools` 方法返回。

<a name="web-search"></a>
#### 网络搜索

`WebSearch` 服务商工具允许智能体搜索网络以获取实时信息。这对于回答有关当前事件、近期数据，或自模型训练截止以来可能发生变化的话题的问题非常有用。

**支持的服务商：** Anthropic、OpenAI、Azure、Gemini、xAI、OpenRouter

```php
use Laravel\Ai\Providers\Tools\WebSearch;

public function tools(): iterable
{
    return [
        new WebSearch,
    ];
}
```

你可以配置网络搜索工具以限制搜索次数，或将结果限定在特定域名内：

```php
(new WebSearch)->max(5)->allow(['laravel.com', 'php.net']),
```

要基于用户位置细化搜索结果，请使用 `location` 方法：

```php
(new WebSearch)->location(
    city: 'New York',
    region: 'NY',
    country: 'US'
);
```

<a name="web-fetch"></a>
#### 网页抓取

`WebFetch` 服务商工具允许智能体抓取并读取网页内容。当你需要智能体分析特定 URL 或从已知网页检索详细信息时，这非常有用。

**支持的服务商：** Anthropic、Gemini、OpenRouter

```php
use Laravel\Ai\Providers\Tools\WebFetch;

public function tools(): iterable
{
    return [
        new WebFetch,
    ];
}
```

你可以配置网页抓取工具以限制抓取次数，或限定在特定域名内：

```php
(new WebFetch)->max(3)->allow(['docs.laravel.com']),
```

<a name="file-search"></a>
#### 文件搜索

`FileSearch` 服务商工具允许智能体在 [文件](#files) 中搜索，这些文件存储在 [向量存储](#vector-stores) 中。这使得智能体能够搜索你上传的文档以获取相关信息，从而实现检索增强生成（RAG）。

**支持的服务商：** OpenAI、Gemini、xAI

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

如果你的文件带有 [元数据](#adding-files-to-stores)，你可以通过提供 `where` 参数来筛选搜索结果。对于简单的相等筛选，传入一个数组：

```php
new FileSearch(stores: ['store_id'], where: [
    'author' => 'Taylor Otwell',
    'year' => 2026,
]);
```

对于更复杂的筛选，你可以传入一个接收 `FileSearchQuery` 实例的闭包：

```php
use Laravel\Ai\Providers\Tools\FileSearchQuery;

new FileSearch(stores: ['store_id'], where: fn (FileSearchQuery $query) =>
    $query->where('author', 'Taylor Otwell')
        ->whereNot('status', 'draft')
        ->whereIn('category', ['news', 'updates'])
);
```

<a name="sub-agents"></a>
### 子智能体

智能体也可以从另一个智能体的 `tools` 方法中返回。当某个智能体作为工具返回时，父智能体可以将特定任务委派给子智能体，并在回答原始提示时使用子智能体的响应。当一个通用智能体需要访问带有自身指令、工具、模型配置或服务商偏好的专用智能体时，这非常有用。

例如，一个客户支持智能体可以将退款资格问题委派给一个专用的退款智能体：

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

要自定义子智能体向父智能体暴露的方式，请在子智能体上实现 `CanActAsTool` 接口，并定义一个面向工具的名称与描述：

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

如果子智能体未实现 `CanActAsTool`，Laravel 将使用该智能体的类短名（basename）作为工具名称，并给出一个通用描述，要求父智能体传入一个清晰、自包含的任务描述。每次子智能体调用都是隔离运行的，不会接收到父智能体的对话历史。

<a name="middleware"></a>
### 中间件

智能体支持中间件，允许你在提示发送给服务商之前拦截并修改它。你可以使用 `make:agent-middleware` Artisan 命令创建中间件：

```shell
php artisan make:agent-middleware LogPrompts
```

生成的中间件会放置在应用的 `app/Ai/Middleware` 目录中。要为智能体添加中间件，请实现 `HasMiddleware` 接口并定义一个返回中间件类数组的 `middleware` 方法：

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

每个中间件类都应定义一个 `handle` 方法，该方法接收 `AgentPrompt` 与一个 `Closure`，用于将提示传递给下一个中间件：

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

你可以使用响应上的 `then` 方法，在智能体处理完成后执行代码。这同时适用于同步响应与流式响应：

```php
public function handle(AgentPrompt $prompt, Closure $next)
{
    return $next($prompt)->then(function (AgentResponse $response) {
        Log::info('Agent responded', ['text' => $response->text]);
    });
}
```

<a name="anonymous-agents"></a>
### 匿名智能体

有时你可能希望在不创建专用智能体类的情况下，快速与某个模型交互。你可以使用 `agent` 函数创建一个临时的匿名智能体：

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

<a name="agent-configuration"></a>
### 智能体配置

你可以使用 PHP 属性配置智能体的文本生成选项。以下属性可用：

- `MaxSteps`：智能体在使用工具时可以采取的最大步数。
- `MaxTokens`：模型可以生成的最大 token 数。
- `Model`：智能体应使用的模型。
- `Provider`：要用于该智能体的 AI 服务商（或用于故障转移的多个服务商）。
- `Temperature`：用于生成的采样温度（0.0 至 1.0）。
- `Timeout`：智能体请求的 HTTP 超时时间（秒，默认：60）。
- `TopP`：用于生成的核采样概率（0.0 至 1.0）。
- `UseCheapestModel`：使用服务商最便宜的文本模型以优化成本。
- `UseSmartestModel`：使用服务商能力最强的文本模型以应对复杂任务。

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

`UseCheapestModel` 与 `UseSmartestModel` 属性允许你在未指定模型名的情况下，自动为给定服务商选择最具成本效益或能力最强的模型。当你希望跨不同服务商优化成本或能力时，这非常有用：

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
> `UseCheapestModel` 与 `UseSmartestModel` 所选用的底层模型，可能会随 Laravel AI SDK 各版本的发布而变化，因为服务商会发布新的模型。切换模型可能带来行为变化、已弃用的参数以及显著的成本差异。如果你需要稳定、可预测的模型与定价，请使用 `Model` 属性显式指定模型。

<a name="provider-options"></a>
### 服务商选项

如果你的智能体需要传递服务商特定的选项（例如 OpenAI 的推理强度或惩罚设置），请实现 `HasProviderOptions` 契约并定义一个 `providerOptions` 方法：

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
     * 获取服务商特定的生成选项。
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

`providerOptions` 方法接收当前正在使用的服务商（`Lab` 枚举或字符串），让你可以为每个服务商返回不同的选项。这在使用 [故障转移](#failover) 时尤其有用，因为每个回退服务商都可以收到其自身的配置。

上面的 Anthropic 示例也通过 `cache_control` 启用了 [提示词缓存](#prompt-caching)。

<a name="prompt-caching"></a>
### 提示词缓存

大多数服务商会自动缓存重复的提示前缀，并以折扣价格计费被缓存的部分。OpenAI、Gemini、Groq、DeepSeek 与 xAI 无需配置，你可以通过响应的 usage 查看节省情况：

```php
$response->usage->cacheReadInputTokens;
$response->usage->cacheWriteInputTokens;
```

`anthropic` 与 `bedrock` 服务商只有在被要求时才会缓存。`CacheInstructions` 与 `CacheToolDefinitions` 属性会在智能体的指令与工具定义末尾放置一个缓存断点，这样每次对话都从该缓存读取此前缀，而不必再次写入：

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

如果你的指令在每次请求时都发生变化（例如当其中嵌入了当前日期时），请单独使用 `CacheToolDefinitions`。缓存一个在每次请求时都会变化的前缀，每次都会创建一个新缓存条目，因此你支付将其写入缓存的费用，却永远无法复用它。

不支持这些属性的服务商会忽略它们，因此智能体在使用 [故障转移](#failover) 时可以安全地声明它们。

缓存的前缀默认保留五分钟。如果你向属性传入 TTL，Anthropic 可能会将其保留一小时：

```php
#[CacheInstructions('1h')]
#[CacheToolDefinitions('1h')]
```

或者，Anthropic 的自动缓存也可以通过顶层的 `cache_control` [服务商选项](#provider-options) 启用。这会在请求最后一个块之后放置一个单一断点，因此随着对话增长，断点会前移，每一轮都会从缓存中读取前几轮。两种机制可以结合使用。

> [!WARNING]
> 由于服务商按照工具、指令、消息的顺序构建提示，将指令缓存一小时同时也需要将工具定义缓存一小时。将两者混用会抛出 `InvalidArgumentException`。

<a name="human-tool-approval"></a>
## 人工工具审批

> [!WARNING]
> 工具审批需要一个 `Conversational` 智能体，其对话历史会被持久化，以便暂停的调用可以恢复。`RemembersConversations` Trait 提供了所需的持久化。

执行敏感或不可逆操作的工具，可能需要在执行前经过人工审批。要使一个工具可审批，请实现 `Approvable` 契约并使用 `InteractsWithApprovals` Trait。可审批工具默认需要审批：

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
     * 获取工具的 schema 定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'path' => $schema->string()->required(),
        ];
    }
}
```

要根据工具调用的参数判断是否需要审批，请在工具上定义一个 `needsApproval` 方法。该方法可以返回一个布尔值，或一个包含审批原因的 `Approval` 实例：

```php
use Laravel\Ai\Approvals\Approval;

/**
 * 判断该工具对于给定的请求是否需要审批。
 */
protected function needsApproval(Request $request): Approval|bool
{
    return str_starts_with($request['path'], 'temporary/')
        ? false
        : Approval::required('This will permanently delete a file.');
}
```

当你从智能体的 `tools` 方法返回工具时，可以覆盖其审批要求：

```php
public function tools(): iterable
{
    return [
        (new SendNotification)->withoutApproval(),
        (new DeleteFile)->requireApproval('Deletion review required.'),
    ];
}
```

当调用一个可审批工具时，智能体会在执行它之前暂停。你可以检查响应的待处理审批，其中包含每个工具调用的 ID、工具名、参数与审批原因：

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

要恢复智能体，请延续对话并提供一个 `Decisions` 实例，其中包含对每个待处理工具调用的决策。决策可以批准该调用、拒绝它，或在执行前编辑其参数：

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

布尔值 `true` 与 `false` 可用作批准与拒绝的简写。每个待处理工具调用都必须收到一个决策。未知、缺失或先前已解决的的工具调用 ID 会导致抛出 `ApprovalMismatchException`。你可以使用 `approveRemaining` 或 `rejectRemaining` 方法为没有显式决策的调用提供默认值：

```php
$decisions = Decisions::from([
    'call_abc' => true,
])->rejectRemaining('Not approved.');

$response = (new FileAssistant)
    ->continue($conversationId, as: $user)
    ->prompt($decisions);
```

带有结果的拒绝（例如 `Decision::reject('Not approved.')`）会返回给模型，使其能够继续响应。不带结果的拒绝会在记录拒绝后停止生成循环。

工具审批由 `prompt`、`stream`、`queue`、`broadcast`、`broadcastNow` 与 `broadcastOnQueue` 方法支持。

在流式传输与广播过程中，暂停由 `tool_approval_request` 事件表示。在使用 [Vercel AI SDK 流协议](#streaming-using-the-vercel-ai-sdk-protocol) 时，审批请求与结果通过该协议原生的工具审批部件（part）发出。

对于入队的智能体，生成的响应会传递给 `then` 回调，Laravel 还会分发一个 `ToolApprovalRequested` 事件。

Laravel 会在请求模型继续之前，存储已审批工具的结果。如果生成随后失败，审批实际上已经解决。请使用普通的文本提示继续对话，而不要再次提交相同的审批决策。

<a name="complete-approval-flow"></a>
### 完整审批流程

以下路由演示了一个完整的审批流程。`GET` 路由返回聊天界面，而 `POST` 路由接受来自聊天界面的新文本提示或审批决策。本示例假设应用的 `User` 模型使用了 `HasConversations` Trait：

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

当响应状态为 `awaiting_approval` 时，聊天界面应当渲染待处理的审批，并使用工具调用 ID 作为每个决策的键，将用户的选择提交到同一个端点：

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

<a name="images"></a>
## 图像

`Laravel\Ai\Image` 类可用于使用 `openai`、`gemini` 或 `xai` 服务商生成图像：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')->generate();

$rawContent = (string) $image;
```

`square`、`portrait` 与 `landscape` 方法可用于控制图像的纵横比，而 `quality` 方法可用于引导模型控制最终图像质量（`high`、`medium`、`low`）。`timeout` 方法可用于指定 HTTP 超时时间（秒）：

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

生成的图像可以轻松存储到应用 `config/filesystems.php` 配置文件中配置的默认磁盘上：

```php
$image = Image::of('A donut sitting on the kitchen counter');

$path = $image->store();
$path = $image->storeAs('image.jpg');
$path = $image->storePublicly();
$path = $image->storePubliclyAs('image.jpg');
```

图像生成也可以入队：

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

<a name="audio"></a>
## 音频

`Laravel\Ai\Audio` 类可用于根据给定的文本生成音频：

```php
use Laravel\Ai\Audio;

$audio = Audio::of('I love coding with Laravel.')->generate();

$rawContent = (string) $audio;
```

你也可以使用通过 Laravel 的 `Stringable` 类提供的 `toAudio` 方法，从字符串生成音频：

```php
use Illuminate\Support\Str;

$audio = Str::of('I love coding with Laravel.')->toAudio();
```

`male`、`female` 与 `voice` 方法可用于确定所生成音频的音色：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->generate();

$audio = Audio::of('I love coding with Laravel.')
    ->voice('voice-id-or-name')
    ->generate();
```

类似地，`instructions` 方法可用于动态引导模型，控制所生成音频的听感：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->instructions('Said like a pirate')
    ->generate();
```

生成的声音可以轻松存储到应用 `config/filesystems.php` 配置文件中配置的默认磁盘上：

```php
$audio = Audio::of('I love coding with Laravel.')->generate();

$path = $audio->store();
$path = $audio->storeAs('audio.mp3');
$path = $audio->storePublicly();
$path = $audio->storePubliclyAs('audio.mp3');
```

音频生成也可以入队：

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

<a name="transcription"></a>
## 转录

`Laravel\Ai\Transcription` 类可用于生成给定音频的转录文本：

```php
use Laravel\Ai\Transcription;

$transcript = Transcription::fromPath('/home/laravel/audio.mp3')->generate();
$transcript = Transcription::fromStorage('audio.mp3')->generate();
$transcript = Transcription::fromUpload($request->file('audio'))->generate();

return (string) $transcript;
```

`diarize` 方法可用于指示你希望响应在原始文本转录之外，还包含按说话人分离的转录，从而让你能够按说话人访问分段后的转录：

```php
$transcript = Transcription::fromStorage('audio.mp3')
    ->diarize()
    ->generate();
```

转录生成也可以入队：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Responses\TranscriptionResponse;

Transcription::fromStorage('audio.mp3')
    ->queue()
    ->then(function (TranscriptionResponse $transcript) {
        // ...
    });
```

<a name="text-summarization"></a>
## 文本摘要

你可以使用通过 Laravel 的 `Stringable` 类提供的 `summarize` 方法对文本进行摘要。默认情况下，摘要不超过三句话，并使用配置的服务商中最便宜的文本模型生成：

```php
use Illuminate\Support\Str;

$summary = Str::of($article)->summarize();
```

你可以指定用于生成摘要的最大句子数、服务商、模型与超时时间。`Str` 类还提供了该方法的静态版本：

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

<a name="embeddings"></a>
## 嵌入

你可以使用通过 Laravel 的 `Stringable` 类提供的新方法 `toEmbeddings`，为任意给定字符串轻松生成向量嵌入：

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

你可以指定嵌入的维度与服务商：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->dimensions(1536)
    ->generate(Lab::OpenAI, 'text-embedding-3-small');
```

<a name="multimodal-embeddings"></a>
### 多模态嵌入

除了字符串之外，`Embeddings::for` 方法还接受图像、音频、文档与视频输入，让你可以为非文本内容生成嵌入。Gemini 支持图像、音频、文档与视频嵌入，而 VoyageAI 支持图像与视频嵌入：

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

多模态输入使用与 [附件](#attachments) 相同的文件类。这些文件可以从本地路径、文件系统磁盘、远程 URL 或 Base64 编码的内容创建。图像、文档与视频也可以从上传的文件中创建，而文档可以从原始字符串内容创建：

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
> VoyageAI 不允许在单个请求中混合远程 URL 媒体与 Base64 编码的媒体。本地、已存储与已上传的文件会作为 Base64 编码的内容发送，文本输入可以与任意一种媒体源组合。请查阅你的服务商文档，以确定哪些多模态模型与输入可用。

<a name="querying-embeddings"></a>
### 查询嵌入

一旦你生成了嵌入，通常会将其存储在数据库的 `vector` 列中以便后续查询。Laravel 通过 `pgvector` 扩展与 MariaDB 原生支持 PostgreSQL 上的向量列。要开始使用，请在你的迁移中定义一个 `vector` 列，指定维度数量：

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

你还可以添加向量索引以加速相似度搜索。在向量列上调用 `index` 时，Laravel 会自动创建一个使用余弦距离的 HNSW 索引：

```php
$table->vector('embedding', dimensions: 1536)->index();
```

在你的 Eloquent 模型上，你应当使用 `AsVector` 类型转换来转换向量列：

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

要查询相似记录，请使用 `whereVectorSimilarTo` 方法。该方法按最小余弦相似度（介于 `0.0` 与 `1.0` 之间，其中 `1.0` 表示完全相同）筛选结果，并按相似度排序：

```php
use App\Models\Document;

$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

`$queryEmbedding` 可以是一个浮点数组或一个纯字符串。当传入字符串时，Laravel 会自动为其生成嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

如果你需要更强的控制，可以独立使用更低层级的 `whereVectorDistanceLessThan`、`selectVectorDistance` 与 `orderByVectorDistance` 方法：

```php
$documents = Document::query()
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

如果你希望让智能体能够以工具形式执行相似度搜索，请查看 [相似度搜索](#similarity-search) 工具文档。

> [!NOTE]
> 向量查询目前仅在使用了 `pgvector` 扩展的 PostgreSQL 连接以及 MariaDB 11.7 或更高版本上受支持。

<a name="caching-embeddings"></a>
### 缓存嵌入

嵌入生成可以被缓存，以避免对相同输入发起冗余的 API 调用。要启用缓存，请将 `ai.caching.embeddings.cache` 配置选项设置为 `true`：

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

启用缓存后，嵌入会被缓存 30 天。缓存键基于服务商、模型、维度与输入内容，确保相同的请求返回缓存的结果，而不同的配置则生成全新的嵌入。

默认情况下，每个输入的嵌入会在其自身的键下缓存，因此即便输入的集合或其顺序发生变化，后续请求也可能命中它之前见过的输入的缓存。若要改为将整个输入集合在单一键下缓存，请将 `ai.caching.embeddings.individually` 配置选项设置为 `false`。

即使全局缓存被禁用，你也可以使用 `cache` 方法为特定请求启用缓存：

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

`toEmbeddings` Stringable 方法也接受一个 `cache` 参数：

```php
// 使用默认时长缓存……
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: true);

// 缓存指定时长……
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: 3600);
```

<a name="reranking"></a>
## 重排序

重排序允许你根据文档与给定查询的相关性，对文档列表重新排序。这对于利用语义理解来改进搜索结果非常有用：

`Laravel\Ai\Reranking` 类可用于对文档重排序：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library for building user interfaces.',
])->rerank('PHP frameworks');

// 访问排名最高的结果……
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

<a name="reranking-collections"></a>
### 重排序集合

为方便起见，Laravel 集合可以使用 `rerank` 宏进行重排序。第一个参数指定用于重排序的字段，第二个参数是查询：

```php
// 按单个字段重排序……
$posts = Post::all()
    ->rerank('body', 'Laravel tutorials');

// 按多个字段重排序（以 JSON 形式发送）……
$reranked = $posts->rerank(['title', 'body'], 'Laravel tutorials');

// 使用闭包构建文档进行重排序……
$reranked = $posts->rerank(
    fn ($post) => $post->title.': '.$post->body,
    'Laravel tutorials'
);
```

你还可以限制结果数量并指定服务商：

```php
$reranked = $posts->rerank(
    by: 'content',
    query: 'Laravel tutorials',
    limit: 10,
    provider: Lab::Cohere
);
```

<a name="files"></a>
## 文件

`Laravel\Ai\Files` 类或各个文件类可用于在你的 AI 服务商处存储文件，以便在对话中后续使用。这对于你希望多次引用而无需重新上传的大型文档或文件非常有用：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Files\Image;

// 从本地路径存储文件……
$response = Document::fromPath('/home/laravel/document.pdf')->put();
$response = Image::fromPath('/home/laravel/photo.jpg')->put();

// 存储存储在文件系统磁盘上的文件……
$response = Document::fromStorage('document.pdf', disk: 'local')->put();
$response = Image::fromStorage('photo.jpg', disk: 'local')->put();

// 存储位于远程 URL 的文件……
$response = Document::fromUrl('https://example.com/document.pdf')->put();
$response = Image::fromUrl('https://example.com/photo.jpg')->put();

return $response->id;
```

你还可以存储原始内容或上传的文件：

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
        Files\Document::fromId('file-id') // 附加一个已存储的文档……
    ]
);
```

要检索先前存储的文件，请使用文件实例上的 `get` 方法：

```php
use Laravel\Ai\Files\Document;

$file = Document::fromId('file-id')->get();

$file->id;
$file->mimeType();
```

要从服务商处删除文件，请使用 `delete` 方法：

```php
Document::fromId('file-id')->delete();
```

默认情况下，`Files` 类使用应用 `config/ai.php` 配置文件中配置的默认 AI 服务商。对于大多数操作，你可以使用 `provider` 参数指定不同的服务商：

```php
$response = Document::fromPath(
    '/home/laravel/document.pdf'
)->put(provider: Lab::Anthropic);
```

你可以使用 `withProviderOptions` 方法传递服务商特定的上传选项。例如，你可以设置 OpenAI 文件的 `purpose`：

```php
use Laravel\Ai\Files\Document;

$response = Document::fromPath('/home/laravel/knowledge.txt')
    ->withProviderOptions(['purpose' => 'assistants'])
    ->put();
```

要为各服务商限定选项，请传入一个接收当前服务商的闭包：

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

<a name="using-stored-files-in-conversations"></a>
### 在对话中使用已存储的文件

一旦文件已在服务商处存储，你就可以使用 `Document` 或 `Image` 类上的 `fromId` 方法，在智能体对话中引用它：

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

类似地，已存储的图像可以使用 `Image` 类引用：

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

<a name="vector-stores"></a>
## 向量存储

向量存储允许你创建可搜索的文件集合，用于检索增强生成（RAG）。`Laravel\Ai\Stores` 类提供了创建、检索与删除向量存储的方法：

```php
use Laravel\Ai\Stores;

// 创建一个新的向量存储……
$store = Stores::create('Knowledge Base');

// 使用额外选项创建存储……
$store = Stores::create(
    name: 'Knowledge Base',
    description: 'Documentation and reference materials.',
    expiresWhenIdleFor: days(30),
);

return $store->id;
```

要按 ID 检索一个已有的向量存储，请使用 `get` 方法：

```php
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

$store->id;
$store->name;
$store->fileCounts;
$store->ready;
```

要删除一个向量存储，请使用 `Stores` 类或存储实例上的 `delete` 方法：

```php
use Laravel\Ai\Stores;

// 按 ID 删除……
Stores::delete('store_id');

// 或通过存储实例删除……
$store = Stores::get('store_id');

$store->delete();
```

<a name="adding-files-to-stores"></a>
### 向存储中添加文件

一旦拥有了向量存储，你就可以使用 `add` 方法向其添加 [文件](#files)。添加到存储中的文件会自动建立索引，以便通过 [文件搜索服务商工具](#file-search) 进行语义搜索：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

// 添加已经由服务商存储的文件……
$document = $store->add('file_id');
$document = $store->add(Document::fromId('file_id'));

// 或一步完成存储并添加文件……
$document = $store->add(Document::fromPath('/path/to/document.pdf'));
$document = $store->add(Document::fromStorage('manual.pdf'));
$document = $store->add($request->file('document'));

$document->id;
$document->fileId;
```

> **Note:** 通常，当将先前已存储的文件添加到向量存储时，返回的文档 ID 会与文件先前分配的 ID 一致；然而，某些向量存储服务商可能会返回一个新的、不同的“文档 ID”。因此，建议你始终在数据库中存储这两个 ID 以备后续使用。

你可以向添加到存储中的文件附加元数据。这些元数据稍后可用于在使用 [文件搜索服务商工具](#file-search) 时筛选搜索结果：

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

从向量存储中移除文件并不会将其从服务商的 [文件存储](#files) 中删除。要从向量存储中移除文件并从文件存储中永久删除它，请使用 `deleteFile` 参数：

```php
$store->remove('file_abc123', deleteFile: true);
```

<a name="failover"></a>
## 故障转移

在提示或生成其他媒体时，你可以提供一个服务商 / 模型数组，以便在主服务商遇到服务中断或速率限制时，自动故障转移到备用的服务商 / 模型：

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

只有当抛出 `FailoverableException` 时才会发生故障转移——例如速率限制（`RateLimitedException`）、服务商过载或不可用（`ProviderOverloadedException`），或额度不足（`InsufficientCreditsException`）。普通错误（如校验错误或错误请求错误）不会触发故障转移。

当你传入一个普通的服务商列表（例如 `[Lab::OpenAI, Lab::Anthropic]`）时，每个服务商都使用其默认模型。要为故障转移链中的每个服务商指定特定模型，请传入以服务商为键的关联数组，使用 `Lab` 枚举的 `value` 作为键（枚举用例不能直接用作 PHP 数组键）：

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

<a name="testing"></a>
## 测试

在伪造入队的生成图像、音频、转录或嵌入时，注册在入队生成上的任何 `then` 回调都会以伪造的响应被调用，让你可以测试回调内部包含的逻辑。如果你希望这些回调不被调用，也可以同时使用 `Queue::fake()` 来伪造队列。

<a name="testing-agents"></a>
### 智能体

要在测试期间伪造智能体的响应，请调用智能体类上的 `fake` 方法。你可以选择性地提供一个响应数组或一个闭包：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Prompts\AgentPrompt;

// 为每个提示自动生成一个固定的响应……
SalesCoach::fake();

// 提供一组提示响应……
SalesCoach::fake([
    'First response',
    'Second response',
]);

// 根据传入的提示动态处理提示响应……
SalesCoach::fake(function (AgentPrompt $prompt) {
    return 'Response for: '.$prompt->prompt;
});
```

当伪造一个返回结构化输出的智能体时，你可以提供数组作为响应。智能体会返回一个包含给定数据的结构化响应：

```php
SalesCoach::fake([
    ['score' => 87],
]);
```

你还可以伪造一个等待工具审批的响应：

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

> **Note:** 当在一个返回结构化输出、且未显式提供伪造输出的智能体上调用 `Agent::fake()` 时，Laravel 会自动生成与你的智能体所定义输出 schema 匹配的伪造数据。

提示智能体之后，你可以对收到的提示做出断言：

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

当断言一个审批延续时，你可以检查提示的审批决策：

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

对于入队的智能体调用，请使用入队断言方法：

```php
use Laravel\Ai\QueuedAgentPrompt;

SalesCoach::assertQueued('Analyze this...');

SalesCoach::assertQueued(function (QueuedAgentPrompt $prompt) {
    return $prompt->contains('Analyze');
});

SalesCoach::assertNotQueued('Missing prompt');

SalesCoach::assertNeverQueued();
```

要确保所有智能体调用都有对应的伪造响应，你可以使用 `preventStrayPrompts`。如果某个智能体在没有定义伪造响应的情况下被调用，将抛出异常：

```php
SalesCoach::fake()->preventStrayPrompts();
```

<a name="testing-images"></a>
### 图像

图像生成可以通过在 `Image` 类上调用 `fake` 方法来伪造。一旦图像被伪造，就可以针对被记录的生成图像提示执行各种断言：

```php
use Laravel\Ai\Image;
use Laravel\Ai\Prompts\ImagePrompt;
use Laravel\Ai\Prompts\QueuedImagePrompt;

// 为每个提示自动生成一个固定的响应……
Image::fake();

// 提供一组提示响应……
Image::fake([
    base64_encode($firstImage),
    base64_encode($secondImage),
]);

// 根据传入的提示动态处理提示响应……
Image::fake(function (ImagePrompt $prompt) {
    return base64_encode('...');
});
```

生成图像后，你可以对收到的提示做出断言：

```php
Image::assertGenerated(function (ImagePrompt $prompt) {
    return $prompt->contains('sunset') && $prompt->isLandscape();
});

Image::assertNotGenerated('Missing prompt');

Image::assertNothingGenerated();
```

对于入队的图像生成，请使用入队断言方法：

```php
Image::assertQueued(
    fn (QueuedImagePrompt $prompt) => $prompt->contains('sunset')
);

Image::assertNotQueued('Missing prompt');

Image::assertNothingQueued();
```

要确保所有图像生成都有对应的伪造响应，你可以使用 `preventStrayImages`。如果某张图像在没有定义伪造响应的情况下被生成，将抛出异常：

```php
Image::fake()->preventStrayImages();
```

<a name="testing-audio"></a>
### 音频

音频生成可以通过在 `Audio` 类上调用 `fake` 方法来伪造。一旦音频被伪造，就可以针对被记录的生成音频提示执行各种断言：

```php
use Laravel\Ai\Audio;
use Laravel\Ai\Prompts\AudioPrompt;
use Laravel\Ai\Prompts\QueuedAudioPrompt;

// 为每个提示自动生成一个固定的响应……
Audio::fake();

// 提供一组提示响应……
Audio::fake([
    base64_encode($firstAudio),
    base64_encode($secondAudio),
]);

// 根据传入的提示动态处理提示响应……
Audio::fake(function (AudioPrompt $prompt) {
    return base64_encode('...');
});
```

生成音频后，你可以对收到的提示做出断言：

```php
Audio::assertGenerated(function (AudioPrompt $prompt) {
    return $prompt->contains('Hello') && $prompt->isFemale();
});

Audio::assertNotGenerated('Missing prompt');

Audio::assertNothingGenerated();
```

对于入队的音频生成，请使用入队断言方法：

```php
Audio::assertQueued(
    fn (QueuedAudioPrompt $prompt) => $prompt->contains('Hello')
);

Audio::assertNotQueued('Missing prompt');

Audio::assertNothingQueued();
```

要确保所有音频生成都有对应的伪造响应，你可以使用 `preventStrayAudio`。如果某段音频在没有定义伪造响应的情况下被生成，将抛出异常：

```php
Audio::fake()->preventStrayAudio();
```

<a name="testing-transcriptions"></a>
### 转录

转录生成可以通过在 `Transcription` 类上调用 `fake` 方法来伪造。一旦转录被伪造，就可以针对被记录的生成转录提示执行各种断言：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Prompts\TranscriptionPrompt;
use Laravel\Ai\Prompts\QueuedTranscriptionPrompt;

// 为每个提示自动生成一个固定的响应……
Transcription::fake();

// 提供一组提示响应……
Transcription::fake([
    'First transcription text.',
    'Second transcription text.',
]);

// 根据传入的提示动态处理提示响应……
Transcription::fake(function (TranscriptionPrompt $prompt) {
    return 'Transcribed text...';
});
```

生成转录后，你可以对收到的提示做出断言：

```php
Transcription::assertGenerated(function (TranscriptionPrompt $prompt) {
    return $prompt->language === 'en' && $prompt->isDiarized();
});

Transcription::assertNotGenerated(
    fn (TranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingGenerated();
```

对于入队的转录生成，请使用入队断言方法：

```php
Transcription::assertQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->isDiarized()
);

Transcription::assertNotQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingQueued();
```

要确保所有转录生成都有对应的伪造响应，你可以使用 `preventStrayTranscriptions`。如果某段转录在没有定义伪造响应的情况下被生成，将抛出异常：

```php
Transcription::fake()->preventStrayTranscriptions();
```

<a name="testing-embeddings"></a>
### 嵌入

嵌入生成可以通过在 `Embeddings` 类上调用 `fake` 方法来伪造。一旦嵌入被伪造，就可以针对被记录的生成嵌入提示执行各种断言：

```php
use Laravel\Ai\Embeddings;
use Laravel\Ai\Prompts\EmbeddingsPrompt;
use Laravel\Ai\Prompts\QueuedEmbeddingsPrompt;

// 为每个提示自动生成适当维度的伪造嵌入……
Embeddings::fake();

// 提供一组提示响应……
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

生成嵌入后，你可以对收到的提示做出断言：

```php
Embeddings::assertGenerated(function (EmbeddingsPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->dimensions === 1536;
});

Embeddings::assertNotGenerated(
    fn (EmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingGenerated();
```

对于入队的嵌入生成，请使用入队断言方法：

```php
Embeddings::assertQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Laravel')
);

Embeddings::assertNotQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingQueued();
```

要确保所有嵌入生成都有对应的伪造响应，你可以使用 `preventStrayEmbeddings`。如果嵌入在没有定义伪造响应的情况下被生成，将抛出异常：

```php
Embeddings::fake()->preventStrayEmbeddings();
```

<a name="testing-reranking"></a>
### 重排序

重排序操作可以通过在 `Reranking` 类上调用 `fake` 方法来伪造：

```php
use Laravel\Ai\Reranking;
use Laravel\Ai\Prompts\RerankingPrompt;
use Laravel\Ai\Responses\Data\RankedDocument;

// 自动生成伪造的重排序响应……
Reranking::fake();

// 提供自定义响应……
Reranking::fake([
    [
        new RankedDocument(index: 0, document: 'First', score: 0.95),
        new RankedDocument(index: 1, document: 'Second', score: 0.80),
    ],
]);
```

重排序后，你可以对执行的操作做出断言：

```php
Reranking::assertReranked(function (RerankingPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->limit === 5;
});

Reranking::assertNotReranked(
    fn (RerankingPrompt $prompt) => $prompt->contains('Django')
);

Reranking::assertNothingReranked();
```

<a name="testing-files"></a>
### 文件

文件操作可以通过在 `Files` 类上调用 `fake` 方法来伪造：

```php
use Laravel\Ai\Files;

Files::fake();
```

一旦文件操作被伪造，你就可以对发生的上传与删除做出断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

// 存储文件……
Document::fromString('Hello, Laravel!', mimeType: 'text/plain')
    ->as('hello.txt')
    ->put();

// 做出断言……
Files::assertStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, Laravel!' &&
        $file->mimeType() === 'text/plain';
);

Files::assertNotStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, World!'
);

Files::assertNothingStored();
```

要针对文件删除做出断言，你可以传入一个文件 ID：

```php
Files::assertDeleted('file-id');
Files::assertNotDeleted('file-id');
Files::assertNothingDeleted();
```

<a name="testing-vector-stores"></a>
### 向量存储

向量存储操作可以通过在 `Stores` 类上调用 `fake` 方法来伪造。伪造存储还会自动伪造 [文件操作](#files)：

```php
use Laravel\Ai\Stores;

Stores::fake();
```

一旦存储操作被伪造，你就可以对创建或删除的存储做出断言：

```php
use Laravel\Ai\Stores;

// 创建存储……
$store = Stores::create('Knowledge Base');

// 做出断言……
Stores::assertCreated('Knowledge Base');

Stores::assertCreated(fn (string $name, ?string $description) =>
    $name === 'Knowledge Base'
);

Stores::assertNotCreated('Other Store');

Stores::assertNothingCreated();
```

要针对存储删除做出断言，你可以提供存储 ID：

```php
Stores::assertDeleted('store_id');
Stores::assertNotDeleted('other_store_id');
Stores::assertNothingDeleted();
```

要断言文件已被添加或移除出某个存储，请使用给定 `Store` 实例上的断言方法：

```php
Stores::fake();

$store = Stores::get('store_id');

// 添加 / 移除文件……
$store->add('added_id');
$store->remove('removed_id');

// 做出断言……
$store->assertAdded('added_id');
$store->assertRemoved('removed_id');

$store->assertNotAdded('other_file_id');
$store->assertNotRemoved('other_file_id');
```

如果一个文件存储在服务商的 [文件存储](#files) 中，并在同一请求中被添加到向量存储，你可能不知道该文件的提供商 ID。在这种情况下，你可以向 `assertAdded` 方法传入一个闭包，针对所添加文件的内容做断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

$store->add(Document::fromString('Hello, World!', 'text/plain')->as('hello.txt'));

$store->assertAdded(fn (StorableFile $file) => $file->name() === 'hello.txt');
$store->assertAdded(fn (StorableFile $file) => $file->content() === 'Hello, World!');
```

<a name="events"></a>
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

你可以监听其中任意事件，以记录或存储 AI SDK 的使用信息。
