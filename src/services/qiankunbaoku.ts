import { STORAGE_CONFIG } from '../config/storage'

type StoreName = (typeof STORAGE_CONFIG.STORES)[keyof typeof STORAGE_CONFIG.STORES]

type IDBValue = any

type MetadataRecord = {
  角色列表: Record<string, any>
  当前角色ID: string | null
  当前激活存档: { 角色ID: string; 存档槽位: string } | null
}

function requestToPromise<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

async function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(STORAGE_CONFIG.DB_NAME, STORAGE_CONFIG.DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      const { SAVES, METADATA, SETTINGS } = STORAGE_CONFIG.STORES

      if (!db.objectStoreNames.contains(SAVES)) {
        db.createObjectStore(SAVES)
      }
      if (!db.objectStoreNames.contains(METADATA)) {
        db.createObjectStore(METADATA)
      }
      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS)
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  return dbPromise
}

async function getStore(store: StoreName, mode: IDBTransactionMode) {
  const db = await openDatabase()
  const tx = db.transaction([store], mode)
  const objectStore = tx.objectStore(store)
  return { tx, objectStore }
}

const METADATA_KEY = 'character_metadata'

export const qiankunbaoku = {
  async dc(characterId: string, slotKey: string, saveData: IDBValue) {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.SAVES, 'readwrite')
    const key = `${characterId}_${slotKey}`
    objectStore.put(
      {
        ...saveData,
        saveTime: new Date().toISOString()
      },
      key
    )
    await txDone(tx)
  },

  async loadSaveData(characterId: string, slotKey: string): Promise<IDBValue | null> {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.SAVES, 'readonly')
    const key = `${characterId}_${slotKey}`
    const data = await requestToPromise(objectStore.get(key))
    await txDone(tx)
    return (data as any) || null
  },

  async Jx(characterId: string, slotKey: string) {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.SAVES, 'readwrite')
    const key = `${characterId}_${slotKey}`
    objectStore.delete(key)
    await txDone(tx)
  },

  async clearCharacterSaves(characterId: string) {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.SAVES, 'readwrite')
    const prefix = `${characterId}_`

    await new Promise<void>((resolve, reject) => {
      const req = objectStore.openCursor()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null
        if (!cursor) {
          resolve()
          return
        }
        const key = String(cursor.key || '')
        if (key.startsWith(prefix)) {
          cursor.delete()
        }
        cursor.continue()
      }
    })

    await txDone(tx)
  },

  async c5(metadata: MetadataRecord) {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.METADATA, 'readwrite')
    objectStore.put(metadata, METADATA_KEY)
    await txDone(tx)
  },

  async $v(): Promise<MetadataRecord | null> {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.METADATA, 'readonly')
    const data = await requestToPromise(objectStore.get(METADATA_KEY))
    await txDone(tx)
    return (data as any) || null
  },

  async clearAllSaves() {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.SAVES, 'readwrite')
    objectStore.clear()
    await txDone(tx)
  },

  async clearAllMetadata() {
    const { tx, objectStore } = await getStore(STORAGE_CONFIG.STORES.METADATA, 'readwrite')
    objectStore.clear()
    await txDone(tx)
  }
}
