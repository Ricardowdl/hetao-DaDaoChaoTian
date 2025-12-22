import { DEFAULT_PROMPT_DEFINITIONS, PROMPT_CATEGORIES, type PromptCategoryKey, type PromptCategoryInfo, type PromptKey } from '../config/promptDefaults'

type PromptOverrideRow = {
  key: PromptKey
  content: string
  modified: boolean
  updatedAt: string
}

export type PromptEntry = {
  key: PromptKey
  name: string
  description: string
  category: PromptCategoryKey
  order: number
  content: string
  modified: boolean
  defaultContent: string
  updatedAt?: string
}

export type PromptCategoryGroup = {
  info: PromptCategoryInfo
  prompts: PromptEntry[]
}

const DB_NAME = 'dad-prompts'
const DB_VERSION = 2
const STORE_NAME = 'prompts'

const FORCED_BUILTIN_KEYS = new Set<PromptKey>([
  'coreRules',
  'businessRules',
  'dataDefinitions',
  'textFormats',
  'worldStandards',
  'cotCore',
  'actionOptions',
  'questSystemRules'
])

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('IndexedDB请求失败'))
  })
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('IndexedDB事务失败'))
    tx.onabort = () => reject(tx.error || new Error('IndexedDB事务中止'))
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

async function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
      // 兼容 tavern 外部提示词存储（同库多表）
      if (!db.objectStoreNames.contains('tavern-prompts')) {
        db.createObjectStore('tavern-prompts', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('无法打开IndexedDB'))
  })
  return dbPromise
}

function buildEntry(key: PromptKey, override?: PromptOverrideRow | null): PromptEntry {
  const def = DEFAULT_PROMPT_DEFINITIONS[key]
  const overriddenContent = override?.content
  const content = typeof overriddenContent === 'string' ? overriddenContent : def.defaultContent
  const modified = Boolean(override?.modified && overriddenContent !== def.defaultContent)
  return {
    key,
    name: def.name,
    description: def.description,
    category: def.category,
    order: def.order,
    content,
    modified,
    defaultContent: def.defaultContent,
    updatedAt: override?.updatedAt
  }
}

export const promptStore = {
  categories: PROMPT_CATEGORIES,

  isForcedBuiltin(key: PromptKey): boolean {
    return FORCED_BUILTIN_KEYS.has(key)
  },

  async get(key: PromptKey): Promise<string> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const row = (await requestToPromise(store.get(key))) as PromptOverrideRow | undefined
    await transactionDone(tx)
    const def = DEFAULT_PROMPT_DEFINITIONS[key]
    if (!def) return ''
    return row?.modified ? row.content : def.defaultContent
  },

  async getResolved(key: PromptKey, options?: { allowOverrides?: boolean }): Promise<string> {
    const def = DEFAULT_PROMPT_DEFINITIONS[key]
    if (!def) return ''

    if (FORCED_BUILTIN_KEYS.has(key)) return def.defaultContent
    if (options?.allowOverrides === false) return def.defaultContent

    return this.get(key)
  },

  async loadAll(): Promise<Record<PromptKey, PromptEntry>> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    const result = {} as Record<PromptKey, PromptEntry>
    const keys = Object.keys(DEFAULT_PROMPT_DEFINITIONS) as PromptKey[]

    for (const key of keys) {
      const row = (await requestToPromise(store.get(key))) as PromptOverrideRow | undefined
      result[key] = buildEntry(key, row)
    }

    await transactionDone(tx)
    return result
  },

  async loadByCategory(): Promise<Record<PromptCategoryKey, PromptCategoryGroup>> {
    const all = await this.loadAll()

    const groups = Object.entries(PROMPT_CATEGORIES).reduce((acc, [k, info]) => {
      acc[k as PromptCategoryKey] = { info, prompts: [] }
      return acc
    }, {} as Record<PromptCategoryKey, PromptCategoryGroup>)

    for (const entry of Object.values(all)) {
      const category = entry.category
      if (groups[category]) groups[category].prompts.push(entry)
    }

    for (const k of Object.keys(groups) as PromptCategoryKey[]) {
      groups[k].prompts.sort((a, b) => (a.order || 999) - (b.order || 999))
    }

    return groups
  },

  async save(key: PromptKey, content: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const row: PromptOverrideRow = {
      key,
      content,
      modified: true,
      updatedAt: new Date().toISOString()
    }
    store.put(row)
    await transactionDone(tx)
  },

  async reset(key: PromptKey): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(key)
    await transactionDone(tx)
  },

  async resetAll(): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    await transactionDone(tx)
  },

  async exportAll(): Promise<Record<PromptKey, string>> {
    const all = await this.loadAll()
    const out = {} as Record<PromptKey, string>
    for (const key of Object.keys(all) as PromptKey[]) {
      out[key] = all[key].content
    }
    return out
  },

  async importPrompts(payload: Record<string, any>): Promise<number> {
    const validKeys = new Set(Object.keys(DEFAULT_PROMPT_DEFINITIONS) as PromptKey[])
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    let count = 0
    for (const [k, v] of Object.entries(payload || {})) {
      if (!validKeys.has(k as PromptKey)) continue
      if (typeof v !== 'string') continue
      const row: PromptOverrideRow = {
        key: k as PromptKey,
        content: v,
        modified: true,
        updatedAt: new Date().toISOString()
      }
      store.put(row)
      count += 1
    }

    await transactionDone(tx)
    return count
  },

  buildCompositePrompt(
    keys: PromptKey[],
    params?: { userInput?: string; customActionPrompt?: string; allowOverrides?: boolean }
  ): Promise<string> {
    return (async () => {
      const parts: string[] = []
      for (const key of keys) {
        let content = await this.getResolved(key, { allowOverrides: params?.allowOverrides })
        if (params?.userInput) content = content.replaceAll('{{用户输入}}', params.userInput)
        if (params?.customActionPrompt) content = content.replaceAll('{{CUSTOM_ACTION_PROMPT}}', params.customActionPrompt)
        parts.push(content)
      }
      return parts.filter(Boolean).join('\n\n---\n\n')
    })()
  }
}
