export type TavernPrompt = {
  identifier: string
  name: string
  enabled: boolean
  role?: string
  content: string
  injection_position?: number
  injection_depth?: number
  injection_order?: number
  marker?: boolean
  system_prompt?: boolean
  forbid_overrides?: boolean
}

type TavernPromptRow = TavernPrompt & { key: string }

const DB_NAME = 'dad-prompts'
const DB_VERSION = 2
const STORE_NAME = 'tavern-prompts'

let dbPromise: Promise<IDBDatabase> | null = null

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

async function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
      // 兼容已有 prompts store（防止升级时缺失）
      if (!db.objectStoreNames.contains('prompts')) {
        db.createObjectStore('prompts', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('无法打开IndexedDB'))
  })
  return dbPromise
}

export const tavernPromptStore = {
  async loadAll(): Promise<TavernPrompt[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    const rows = (await requestToPromise(req)) as TavernPromptRow[]
    await transactionDone(tx)
    return (rows || []).map(({ key, ...rest }) => rest)
  },

  async resetAll(): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await transactionDone(tx)
  },

  async setEnabled(key: string, enabled: boolean): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const row = (await requestToPromise(store.get(key))) as TavernPromptRow | undefined
    if (!row) {
      await transactionDone(tx)
      return
    }
    store.put({ ...row, enabled })
    await transactionDone(tx)
  },

  async upsert(prompt: TavernPrompt): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const row: TavernPromptRow = {
      ...prompt,
      key: prompt.identifier || prompt.name
    }
    store.put(row)
    await transactionDone(tx)
  },

  async importFromTavernJson(payload: any): Promise<number> {
    const prompts = Array.isArray(payload?.prompts) ? (payload.prompts as TavernPrompt[]) : []
    if (!prompts.length) return 0
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    let count = 0
    for (const p of prompts) {
      if (!p || !p.name || !p.content) continue
      const row: TavernPromptRow = {
        ...p,
        key: p.identifier || p.name || String(count)
      }
      store.put(row)
      count += 1
    }
    await transactionDone(tx)
    return count
  }
}
