import { normalizeBaseUrl } from './aiProviders'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type StreamChunkHandler = (text: string) => void

function isAbortError(e: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') ||
    (typeof e === 'object' && e !== null && (e as any).name === 'AbortError')
  )
}

function abortWithReason(ctrl: AbortController, reason: unknown) {
  try {
    ;(ctrl as any).abort(reason)
  } catch {
    ctrl.abort()
  }
}

function getOpenAiCompatPathPrefix(baseUrl: string): string {
  return baseUrl.includes('open.bigmodel.cn') ? '' : '/v1'
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlEncodeText(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text))
}

async function hmacSha256Base64Url(secret: string, input: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  return base64UrlEncodeBytes(new Uint8Array(sig))
}

async function buildZhipuBearerToken(apiKey: string, ttlSeconds = 3600): Promise<string> {
  const parts = String(apiKey || '').split('.')
  if (parts.length < 2) return apiKey
  const apiKeyId = parts[0]
  const apiKeySecret = parts.slice(1).join('.')

  const nowMs = Date.now()
  const header = { alg: 'HS256', sign_type: 'SIGN' }
  const payload = { api_key: apiKeyId, exp: nowMs + ttlSeconds * 1000, timestamp: nowMs }
  const headerB64 = base64UrlEncodeText(JSON.stringify(header))
  const payloadB64 = base64UrlEncodeText(JSON.stringify(payload))
  const signingInput = `${headerB64}.${payloadB64}`
  const sigB64 = await hmacSha256Base64Url(apiKeySecret, signingInput)
  return `${signingInput}.${sigB64}`
}

async function buildAuthorizationHeader(baseUrl: string, apiKey?: string): Promise<string | null> {
  const key = (apiKey || '').trim()
  if (!key) return null
  if (baseUrl.includes('open.bigmodel.cn')) {
    if (key.startsWith('jwt:')) {
      const raw = key.slice('jwt:'.length).trim()
      const token = await buildZhipuBearerToken(raw)
      return `Bearer ${token}`
    }
    return `Bearer ${key}`
  }
  return `Bearer ${key}`
}

async function readErrorDetail(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const j = await res.json().catch(() => null)
    return j ? JSON.stringify(j) : ''
  }
  return await res.text().catch(() => '')
}

function stripThinkingIncremental(params: {
  chunk: string
  state: { inThinking: boolean; buffer: string }
}): string {
  const { chunk, state } = params
  if (!chunk) return ''

  const OPEN = '<thinking>'
  const CLOSE = '</thinking>'
  const PREFIX_MAX = 10

  let out = ''

  for (let i = 0; i < chunk.length; i++) {
    state.buffer += chunk[i]

    if (state.buffer.includes(OPEN)) {
      state.inThinking = true
      state.buffer = ''
      continue
    }

    if (state.inThinking && state.buffer.includes(CLOSE)) {
      state.inThinking = false
      state.buffer = ''
      continue
    }

    if (!state.inThinking) {
      const looksLikeTagPrefix = OPEN.startsWith(state.buffer) || CLOSE.startsWith(state.buffer)
      if ((!looksLikeTagPrefix && state.buffer.length > 0) || state.buffer.length > PREFIX_MAX) {
        out += state.buffer
        state.buffer = ''
      }
    }
  }

  return out
}

async function streamOpenAiCompat(params: {
  url: string
  headers: Record<string, string>
  body: any
  timeoutMs: number
  onChunk?: StreamChunkHandler
  stripThinking?: boolean
  allowReasoningFallbackWhenContentEmpty?: boolean
}): Promise<string> {
  const ctrl = new AbortController()
  let timedOut = false
  const timeoutError = new Error(`请求超时(${params.timeoutMs}ms)`)
  const timer = window.setTimeout(() => {
    timedOut = true
    abortWithReason(ctrl, timeoutError)
  }, params.timeoutMs)

  try {
    try {
      const res = await fetch(params.url, {
        method: 'POST',
        headers: params.headers,
        body: JSON.stringify({ ...params.body, stream: true }),
        signal: ctrl.signal
      })

      if (!res.ok) {
        const detail = await readErrorDetail(res)
        throw new Error(`AI请求失败: ${res.status} ${detail}`.trim())
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法获取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      let text = ''
      let fallbackText = ''

      const thinkingState = { inThinking: false, buffer: '' }

      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice('data: '.length)
            if (data === '[DONE]') continue

            try {
              const j = JSON.parse(data)
              const deltaObj = j?.choices?.[0]?.delta
              const delta = deltaObj?.content ?? deltaObj?.text
              const reasoningDelta =
                deltaObj?.reasoning_content ??
                deltaObj?.reasoning ??
                deltaObj?.thinking_content ??
                deltaObj?.thinking

              if (typeof delta === 'string' && delta) {
                const out = params.stripThinking
                  ? stripThinkingIncremental({ chunk: delta, state: thinkingState })
                  : delta

                if (out) {
                  text += out
                  params.onChunk?.(out)
                }
                continue
              }

              if (typeof reasoningDelta === 'string' && reasoningDelta) {
                if (params.stripThinking) {
                  if (params.allowReasoningFallbackWhenContentEmpty) fallbackText += reasoningDelta
                  continue
                }
                fallbackText += reasoningDelta
                params.onChunk?.(reasoningDelta)
              }
            } catch {
              // 忽略单个chunk解析失败
            }
          }
        }
      
        // 处理最后缓冲区中的内容（修复截断问题）
        if (buffer.trim()) {
          const remainingLines = buffer.split('\n')
          for (const line of remainingLines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice('data: '.length)
            if (data === '[DONE]') continue
            
            try {
              const j = JSON.parse(data)
              const deltaObj = j?.choices?.[0]?.delta
              const delta = deltaObj?.content ?? deltaObj?.text
              
              if (typeof delta === 'string' && delta) {
                const out = params.stripThinking
                  ? stripThinkingIncremental({ chunk: delta, state: thinkingState })
                  : delta
                
                if (out) {
                  text += out
                  params.onChunk?.(out)
                }
              }
            } catch {
              // 忽略解析失败
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
      if (params.stripThinking && thinkingState.buffer && !thinkingState.inThinking) {
        text += thinkingState.buffer
        params.onChunk?.(thinkingState.buffer)
        thinkingState.buffer = ''
      }

      return text || fallbackText
    } catch (e) {
      if (isAbortError(e) || ctrl.signal.aborted) {
        if (timedOut) throw timeoutError
        const reason = (ctrl.signal as any).reason
        if (reason instanceof Error) throw reason
        throw new Error('请求已取消')
      }
      throw e
    }
  } finally {
    window.clearTimeout(timer)
  }
}

export async function customGenerateText(params: {
  baseUrl: string
  apiKey?: string
  prompt: string
  system?: string
  timeoutMs?: number
}): Promise<string> {
  const baseUrlRaw = (params.baseUrl || '').trim().replace(/\/+$/, '')
  const baseUrlNoV1 = normalizeBaseUrl(params.baseUrl)
  if (!baseUrlRaw) throw new Error('未配置 API Base URL')

  const primaryUrl = `${baseUrlNoV1}/generate`
  const fallbackUrl = baseUrlNoV1 !== baseUrlRaw ? `${baseUrlRaw}/generate` : ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = await buildAuthorizationHeader(baseUrlRaw, params.apiKey)
  if (auth) headers.Authorization = auth

  const timeoutMs = typeof params.timeoutMs === 'number' ? params.timeoutMs : 60000
  const ctrl = new AbortController()
  let timedOut = false
  const timeoutError = new Error(`请求超时(${timeoutMs}ms)`)
  const timer = window.setTimeout(() => {
    timedOut = true
    abortWithReason(ctrl, timeoutError)
  }, timeoutMs)

  try {
    try {
      const doRequest = async (url: string) => {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: params.prompt, system: params.system }),
          signal: ctrl.signal
        })

        if (!res.ok) {
          const detail = await readErrorDetail(res)
          throw new Error(`AI请求失败: ${res.status} ${detail}`.trim())
        }

        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const j = (await res.json().catch(() => null)) as any
          return String(j?.text || j?.content || j?.result || j?.message || '')
        }
        return await res.text()
      }

      try {
        return await doRequest(primaryUrl)
      } catch (e) {
        if (!fallbackUrl) throw e
        if (ctrl.signal.aborted) throw e
        return await doRequest(fallbackUrl)
      }
    } catch (e) {
      if (isAbortError(e) || ctrl.signal.aborted) {
        if (timedOut) throw timeoutError
        const reason = (ctrl.signal as any).reason
        if (reason instanceof Error) throw reason
        throw new Error('请求已取消')
      }
      throw e
    }
  } finally {
    window.clearTimeout(timer)
  }
}

export async function listModels(params: { baseUrl: string; apiKey?: string; timeoutMs?: number }): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(params.baseUrl)
  if (!baseUrl) throw new Error('未配置 API Base URL')

  const url = `${baseUrl}${getOpenAiCompatPathPrefix(baseUrl)}/models`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = await buildAuthorizationHeader(baseUrl, params.apiKey)
  if (auth) headers.Authorization = auth

  const timeoutMs = typeof params.timeoutMs === 'number' ? params.timeoutMs : 20000
  const ctrl = new AbortController()
  let timedOut = false
  const timeoutError = new Error(`请求超时(${timeoutMs}ms)`)
  const timer = window.setTimeout(() => {
    timedOut = true
    abortWithReason(ctrl, timeoutError)
  }, timeoutMs)

  try {
    try {
      const res = await fetch(url, { method: 'GET', headers, signal: ctrl.signal })
      if (!res.ok) {
        const ct = res.headers.get('content-type') || ''
        let detail = ''
        if (ct.includes('application/json')) {
          const j = await res.json().catch(() => null)
          detail = j ? JSON.stringify(j) : ''
        } else {
          detail = await res.text().catch(() => '')
        }
        throw new Error(`获取模型失败: ${res.status} ${detail}`.trim())
      }
      const data = (await res.json()) as any
      const items: any[] = Array.isArray(data?.data) ? data.data : []
      const models = items.map((x) => String(x?.id || x?.name || '')).filter(Boolean)
      return Array.from(new Set(models))
    } catch (e) {
      if (isAbortError(e) || ctrl.signal.aborted) {
        if (timedOut) throw timeoutError
        const reason = (ctrl.signal as any).reason
        if (reason instanceof Error) throw reason
        throw new Error('请求已取消')
      }
      throw e
    }
  } finally {
    window.clearTimeout(timer)
  }
}

export async function chatCompletionText(params: {
  baseUrl: string
  apiKey?: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  stream?: boolean
  onStreamChunk?: StreamChunkHandler
  stripThinking?: boolean
  extraBody?: Record<string, any>
  allowReasoningFallbackWhenContentEmpty?: boolean
}): Promise<string> {
  const baseUrl = normalizeBaseUrl(params.baseUrl)
  if (!baseUrl) throw new Error('未配置 API Base URL')
  if (!params.model) throw new Error('未选择模型')

  const url = `${baseUrl}${getOpenAiCompatPathPrefix(baseUrl)}/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = await buildAuthorizationHeader(baseUrl, params.apiKey)
  if (auth) headers.Authorization = auth

  const body: Record<string, any> = {
    model: params.model,
    messages: params.messages
  }
  if (params.extraBody && typeof params.extraBody === 'object') {
    Object.assign(body, params.extraBody)
  }
  if (typeof params.temperature === 'number' && Number.isFinite(params.temperature)) body.temperature = params.temperature
  if (typeof params.maxTokens === 'number' && Number.isFinite(params.maxTokens)) body.max_tokens = params.maxTokens

  const timeoutMs = typeof params.timeoutMs === 'number' ? params.timeoutMs : 120000

  if (params.stream) {
    return await streamOpenAiCompat({
      url,
      headers,
      body,
      timeoutMs,
      onChunk: params.onStreamChunk,
      stripThinking: params.stripThinking !== false,
      allowReasoningFallbackWhenContentEmpty: !!params.allowReasoningFallbackWhenContentEmpty
    })
  }

  const ctrl = new AbortController()
  let timedOut = false
  const timeoutError = new Error(`请求超时(${timeoutMs}ms)`)
  const timer = window.setTimeout(() => {
    timedOut = true
    abortWithReason(ctrl, timeoutError)
  }, timeoutMs)

  try {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal
      })

      if (!res.ok) {
        const detail = await readErrorDetail(res)
        throw new Error(`AI请求失败: ${res.status} ${detail}`.trim())
      }

      const data = (await res.json()) as any
      const msg = data?.choices?.[0]?.message ?? {}
      const content = msg.content
      const reasoning =
        msg.reasoning_content ??
        msg.reasoning ??
        msg.thinking_content ??
        msg.thinking
      if (typeof content === 'string' && content) return content
      return typeof reasoning === 'string' ? reasoning : ''
    } catch (e) {
      if (isAbortError(e) || ctrl.signal.aborted) {
        if (timedOut) throw timeoutError
        const reason = (ctrl.signal as any).reason
        if (reason instanceof Error) throw reason
        throw new Error('请求已取消')
      }
      throw e
    }
  } finally {
    window.clearTimeout(timer)
  }
}
