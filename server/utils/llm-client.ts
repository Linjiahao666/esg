/**
 * LLM 客户端封装
 * 
 * 支持多个 AI 提供商：OpenAI、Azure OpenAI、Anthropic Claude、通义千问、本地 Ollama
 * 通过环境变量配置切换提供商
 */

// LLM 提供商类型
export type LLMProvider = 'openai' | 'azure' | 'anthropic' | 'dashscope' | 'ollama'

// LLM 配置接口
export interface LLMConfig {
  provider: LLMProvider
  apiKey?: string
  baseUrl?: string
  model: string
  maxTokens?: number
  temperature?: number
}

// 消息格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 生成选项
export interface GenerateOptions {
  maxTokens?: number
  temperature?: number
  stream?: boolean
  stopSequences?: string[]
}

// 生成结果
export interface GenerateResult {
  content: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  finishReason: string
}

// 流式生成回调
export type StreamCallback = (chunk: string, done: boolean) => void

/**
 * 获取 LLM 配置
 */
export function getLLMConfig(): LLMConfig {
  const config = useRuntimeConfig()

  const provider = (process.env.LLM_PROVIDER || 'openai') as LLMProvider

  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
      }
    case 'azure':
      return {
        provider: 'azure',
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        baseUrl: process.env.AZURE_OPENAI_ENDPOINT || '',
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
      }
    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
      }
    case 'dashscope':
      return {
        provider: 'dashscope',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        model: process.env.DASHSCOPE_MODEL || 'qwen-max',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
      }
    case 'ollama':
      return {
        provider: 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama2',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
      }
    default:
      throw new Error(`不支持的 LLM 提供商: ${provider}`)
  }
}

/**
 * 检查 LLM 配置是否有效
 */
export function isLLMConfigured(): boolean {
  const config = getLLMConfig()

  if (config.provider === 'ollama') {
    return !!config.baseUrl
  }

  return !!config.apiKey
}

/**
 * LLM 客户端类
 */
export class LLMClient {
  private config: LLMConfig

  constructor(config?: Partial<LLMConfig>) {
    this.config = { ...getLLMConfig(), ...config }
  }

  /**
   * 生成内容
   */
  async generate(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const opts = {
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      stopSequences: options?.stopSequences
    }

    switch (this.config.provider) {
      case 'openai':
      case 'azure':
        return this.generateOpenAI(messages, opts)
      case 'anthropic':
        return this.generateAnthropic(messages, opts)
      case 'dashscope':
        return this.generateDashScope(messages, opts)
      case 'ollama':
        return this.generateOllama(messages, opts)
      default:
        throw new Error(`不支持的提供商: ${this.config.provider}`)
    }
  }

  /**
   * 流式生成内容
   */
  async generateStream(
    messages: ChatMessage[],
    callback: StreamCallback,
    options?: GenerateOptions
  ): Promise<void> {
    const opts = {
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7
    }

    switch (this.config.provider) {
      case 'openai':
      case 'azure':
        return this.streamOpenAI(messages, callback, opts)
      case 'anthropic':
        return this.streamAnthropic(messages, callback, opts)
      default:
        // 不支持流式的提供商，降级为普通生成
        const result = await this.generate(messages, options)
        callback(result.content, true)
    }
  }

  /**
   * OpenAI/Azure 生成
   */
  private async generateOpenAI(
    messages: ChatMessage[],
    options: { maxTokens: number; temperature: number; stopSequences?: string[] }
  ): Promise<GenerateResult> {
    const url = this.config.provider === 'azure'
      ? `${this.config.baseUrl}/openai/deployments/${this.config.model}/chat/completions?api-version=2024-02-15-preview`
      : `${this.config.baseUrl}/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.config.provider === 'azure') {
      headers['api-key'] = this.config.apiKey!
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const body: Record<string, any> = {
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    }

    if (this.config.provider === 'openai') {
      body.model = this.config.model
    }

    if (options.stopSequences?.length) {
      body.stop = options.stopSequences
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0].message.content,
      model: data.model,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      finishReason: data.choices[0].finish_reason
    }
  }

  /**
   * OpenAI 流式生成
   */
  private async streamOpenAI(
    messages: ChatMessage[],
    callback: StreamCallback,
    options: { maxTokens: number; temperature: number }
  ): Promise<void> {
    const url = `${this.config.baseUrl}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            callback('', true)
            return
          }
          try {
            const json = JSON.parse(data)
            const content = json.choices[0]?.delta?.content
            if (content) {
              callback(content, false)
            }
          } catch { }
        }
      }
    }

    callback('', true)
  }

  /**
   * Anthropic Claude 生成
   */
  private async generateAnthropic(
    messages: ChatMessage[],
    options: { maxTokens: number; temperature: number }
  ): Promise<GenerateResult> {
    // 提取 system 消息
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage,
        messages: chatMessages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.content[0].text,
      model: data.model,
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      finishReason: data.stop_reason
    }
  }

  /**
   * Anthropic 流式生成
   */
  private async streamAnthropic(
    messages: ChatMessage[],
    callback: StreamCallback,
    options: { maxTokens: number; temperature: number }
  ): Promise<void> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage,
        messages: chatMessages,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.text) {
              callback(json.delta.text, false)
            }
            if (json.type === 'message_stop') {
              callback('', true)
              return
            }
          } catch { }
        }
      }
    }

    callback('', true)
  }

  /**
   * 通义千问生成
   */
  private async generateDashScope(
    messages: ChatMessage[],
    options: { maxTokens: number; temperature: number }
  ): Promise<GenerateResult> {
    const response = await fetch(`${this.config.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        input: {
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        parameters: {
          max_tokens: options.maxTokens,
          temperature: options.temperature
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DashScope API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.output?.text || data.output?.choices?.[0]?.message?.content || '',
      model: this.config.model,
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      finishReason: data.output?.finish_reason || 'stop'
    }
  }

  /**
   * Ollama 本地模型生成
   */
  private async generateOllama(
    messages: ChatMessage[],
    options: { maxTokens: number; temperature: number }
  ): Promise<GenerateResult> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        options: {
          num_predict: options.maxTokens,
          temperature: options.temperature
        },
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.message?.content || '',
      model: this.config.model,
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      finishReason: 'stop'
    }
  }
}

/**
 * 便捷函数：生成内容
 */
export async function generateContent(
  systemPrompt: string,
  userContent: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const client = new LLMClient()
  return client.generate([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ], options)
}

/**
 * 便捷函数：流式生成内容
 */
export async function generateContentStream(
  systemPrompt: string,
  userContent: string,
  callback: StreamCallback,
  options?: GenerateOptions
): Promise<void> {
  const client = new LLMClient()
  return client.generateStream([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ], callback, options)
}

export default LLMClient