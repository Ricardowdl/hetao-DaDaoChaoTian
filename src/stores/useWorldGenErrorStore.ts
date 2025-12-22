import { defineStore } from 'pinia'

export type WorldGenErrorPayload = {
  stage: string
  message: string
  stack?: string
  createdAt: string
  input?: any
  providerErrors?: {
    provider: string
    message: string
    stack?: string
  }[]
}

const STORAGE_KEY = 'world_gen_last_error_v1'

function safeStringify(v: any) {
  try {
    return JSON.stringify(v)
  } catch {
    return ''
  }
}

function safeParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const useWorldGenErrorStore = defineStore('worldGenError', {
  state: () => ({
    lastError: null as WorldGenErrorPayload | null
  }),
  actions: {
    setError(payload: Omit<WorldGenErrorPayload, 'createdAt'> & { createdAt?: string }) {
      const out: WorldGenErrorPayload = {
        stage: payload.stage,
        message: payload.message,
        stack: payload.stack,
        createdAt: payload.createdAt || new Date().toISOString(),
        input: payload.input,
        providerErrors: payload.providerErrors
      }
      this.lastError = out
      try {
        sessionStorage.setItem(STORAGE_KEY, safeStringify(out))
      } catch {
      }
    },
    clear() {
      this.lastError = null
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
      }
    },
    hydrateFromSession() {
      if (this.lastError) return
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = safeParse(raw)
        if (parsed && typeof parsed === 'object') {
          this.lastError = parsed as WorldGenErrorPayload
        }
      } catch {
      }
    }
  }
})
