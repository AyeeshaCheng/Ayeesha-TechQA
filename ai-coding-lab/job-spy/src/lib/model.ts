import { createProviderRegistry } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

const baseURL = process.env.MODEL_BASE_URL?.trim() || undefined

// DeepSeek supports response_format "json_object" but NOT "json_schema".
// Also requires the literal word "json" somewhere in the prompt.
const deepseekFetch: typeof fetch = async (url, options) => {
  if (options?.body) {
    const body = JSON.parse(options.body as string)
    // Convert json_schema → json_object (DeepSeek compatible)
    if (body.response_format?.type === 'json_schema') {
      body.response_format = { type: 'json_object' }
    }
    // DeepSeek requires the word "json" in messages to allow json_object
    const msgs = body.messages as Array<{ role: string; content: string }> | undefined
    if (msgs?.length) {
      const last = msgs[msgs.length - 1]
      if (last.content && !last.content.toLowerCase().includes('json')) {
        last.content += '\n\nRespond in JSON format.'
      }
    }
    options = { ...options, body: JSON.stringify(body) }
  }
  return fetch(url, options)
}

const openai = createOpenAI({
  fetch: baseURL ? deepseekFetch : undefined,
  ...(baseURL ? { baseURL } : {}),
})

// Vision model client — uses direct API (no deepseekFetch interceptor, no baseURL override)
const visionBaseURL = process.env.VISION_MODEL_BASE_URL?.trim() || undefined
const visionOpenai = createOpenAI({
  apiKey: process.env.VISION_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  ...(visionBaseURL ? { baseURL: visionBaseURL } : {}),
})
const anthropic = createAnthropic({ ...(baseURL ? { baseURL } : {}) })

export const registry = createProviderRegistry({
  openai,
  anthropic,
})

export function getModelId(): string {
  const provider = process.env.MODEL_PROVIDER || 'anthropic'
  const model = process.env.MODEL_NAME || 'claude-sonnet-4-5-20250514'
  return `${provider}:${model}`
}

export function getModel() {
  const provider = process.env.MODEL_PROVIDER || 'anthropic'
  const modelName = process.env.MODEL_NAME || 'claude-sonnet-4-5-20250514'

  if (provider === 'openai' && baseURL) {
    return openai.chat(modelName)
  }

  const id = getModelId() as Parameters<typeof registry.languageModel>[0]
  return registry.languageModel(id)
}

/** Vision model for OCR / image recognition (GPT-4o, Claude, etc.) */
export function getVisionModel() {
  const provider = process.env.VISION_MODEL_PROVIDER || 'openai'
  const modelName = process.env.VISION_MODEL_NAME || 'gpt-4o'

  if (provider === 'openai') {
    return visionOpenai.chat(modelName)
  }
  // For Anthropic vision:
  if (provider === 'anthropic') {
    return anthropic.languageModel(modelName)
  }
  return visionOpenai.chat(modelName)
}

/** Chat model for multi-round conversation */
export function getChatModel() {
  const provider = process.env.CHAT_MODEL_PROVIDER || process.env.MODEL_PROVIDER || 'openai'
  const modelName = process.env.CHAT_MODEL_NAME || process.env.MODEL_NAME || 'gpt-4o-mini'

  if (provider === 'openai' && (baseURL || visionBaseURL)) {
    const chatOpenai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(baseURL ? { baseURL } : {}),
    })
    return chatOpenai.chat(modelName)
  }

  const id = `${provider}:${modelName}` as Parameters<typeof registry.languageModel>[0]
  return registry.languageModel(id)
}
