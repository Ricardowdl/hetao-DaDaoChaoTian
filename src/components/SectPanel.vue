<template>
  <div class="sect-root">
    <div class="body">
      <div class="sidebar">
        <div class="sidebar-title">势力宗门</div>

        <div class="search">
          <span class="search-ico muted">🔎</span>
          <input class="input" v-model="searchText" placeholder="搜索宗门..." />
        </div>

        <div v-if="filteredFactions.length === 0" class="empty-side">
          <div class="empty-ico">🏛️</div>
          <div class="empty-title">暂无宗门信息</div>
          <div class="empty-sub">世界信息将由AI根据游戏进程生成</div>

          <div class="debug" style="display: none" @click="debugOpen = !debugOpen">
            <span class="muted">调试信息 (点击{{ debugOpen ? '收起' : '展开' }})</span>
          </div>

          <div v-if="debugOpen" class="debug-box json-pre">{{ safeStringify(worldInfo) }}</div>

          <div class="actions" style="justify-content: center; display: none">
            <button class="btn" type="button" :disabled="generating" @click="refreshWorld">{{ generating ? progressText : '世界生成：生成势力(联动)' }}</button>
            <button class="btn btn-ghost" type="button" @click="emitAction('生成世界信息中的势力信息(世界信息.势力信息)：至少包含若干宗门势力对象（名称/类型/等级/位置/描述/特色/与玩家关系/声望值/可否加入/加入条件/加入好处/成员数量/领导层/势力范围详情）')">让AI生成势力信息</button>
          </div>
        </div>

        <div v-else class="faction-list">
          <div class="actions" style="justify-content: flex-start; margin-top: 0; display: none">
            <button class="btn" type="button" :disabled="generating" @click="refreshWorld">{{ generating ? progressText : '刷新势力(联动世界生成)' }}</button>
            <button class="btn btn-ghost" type="button" @click="emitAction('根据当前世界进程补全/刷新世界信息.势力信息，保持名称唯一且等级合法（超级/一流/二流/三流），并补齐加入条件/加入好处/领导层/成员数量等字段')">让AI补全势力信息</button>
          </div>
          <button
            v-for="f in filteredFactions"
            :key="f.key"
            type="button"
            class="faction"
            :class="{ active: selectedKey === f.key }"
            @click="selectedKey = f.key"
          >
            <div class="faction-left">
              <div class="faction-ico" aria-hidden="true">🏛️</div>
              <div class="faction-main">
                <div class="faction-name">{{ f.name }}</div>
                <div class="faction-sub">
                  <span class="muted">{{ f.type || '-' }}</span>
                  <span class="tag tag-purple">{{ f.level || '-' }}</span>
                  <span v-if="f.joinable" class="tag tag-green">可加入</span>
                </div>
              </div>
            </div>
            <div class="faction-side">
              <span class="chev" aria-hidden="true">›</span>
            </div>
          </button>

          <div class="debug" style="display: none" @click="debugOpen = !debugOpen">
            <span class="muted">调试信息 (点击{{ debugOpen ? '收起' : '展开' }})</span>
          </div>
          <div v-if="debugOpen" class="debug-box json-pre">{{ safeStringify(worldInfo?.势力信息) }}</div>
        </div>
      </div>

      <div class="main light-surface">
        <div class="player-sect card" style="display: none">
          <div class="card-title">当前宗门状态</div>
          <div v-if="!playerSect" class="muted">尚未加入宗门</div>
          <template v-else>
            <div class="kv"><span class="k">宗门名称</span><span class="v">{{ playerSect.宗门名称 || '-' }}</span></div>
            <div class="kv"><span class="k">宗门类型</span><span class="v">{{ playerSect.宗门类型 || '-' }}</span></div>
            <div class="kv"><span class="k">职位</span><span class="v">{{ playerSect.职位 || '-' }}</span></div>
            <div class="kv"><span class="k">贡献</span><span class="v">{{ Number(playerSect.贡献 ?? 0) || 0 }}</span></div>
            <div class="kv"><span class="k">声望</span><span class="v">{{ Number(playerSect.声望 ?? 0) || 0 }}</span></div>
            <div class="kv"><span class="k">关系</span><span class="v">{{ playerSect.关系 || '-' }}</span></div>
            <div class="kv"><span class="k">加入日期</span><span class="v">{{ playerSect.加入日期 || '-' }}</span></div>

            <div class="actions" style="justify-content: flex-start">
              <button class="btn" type="button" @click="addContribution(50)">贡献 +50</button>
              <button class="btn" type="button" @click="addPrestige(10)">声望 +10</button>
              <button class="btn btn-ghost" type="button" @click="emitAction('申请宗门晋升：根据当前宗门信息与条件，调整宗门信息.职位，并合理增减贡献/声望/关系，同时给出叙事')">申请晋升(AI)</button>
              <button class="btn btn-danger" type="button" @click="leaveSect">退出宗门</button>
            </div>
          </template>
        </div>

        <div v-if="!selectedFaction" class="empty-main">
          <div class="empty-main-ico">🏛️</div>
          <div class="empty-main-title">选择一个宗门查看详细信息</div>
          <div class="empty-main-sub">尘世间的宗门势力等你探索</div>
        </div>
        <div v-else class="detail">
          <div class="detail-head">
            <div class="dh-left">
              <div class="dh-ico" aria-hidden="true">🏛️</div>
              <div class="dh-main">
                <div class="dh-name">{{ factionName(selectedFaction) || '-' }}</div>
                <div class="dh-tags">
                  <span class="tag tag-purple">{{ factionLevel(selectedFaction) || '-' }}</span>
                  <span class="tag">{{ factionType(selectedFaction) || '-' }}</span>
                </div>
              </div>
            </div>
            <div class="dh-right">
              <div class="dh-meta">
                <div class="dh-meta-item">
                  <div class="dh-meta-k">所在大洲</div>
                  <div class="dh-meta-v">{{ factionContinent(selectedFaction) || '-' }}</div>
                </div>
                <div class="dh-meta-item">
                  <div class="dh-meta-k">主要资源</div>
                  <div class="dh-meta-v">{{ factionResourcesText(selectedFaction) || '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">成员统计</div>
              <div class="stat-grid">
                <div class="stat-block">
                  <div class="stat-k">总人数</div>
                  <div class="stat-v blue">{{ factionMemberTotal(selectedFaction) }}人</div>
                </div>
              </div>

              <div class="stat-sub" v-if="factionRealmRows(selectedFaction).length">
                <div class="stat-k">境界分布</div>
                <div class="stat-pills">
                  <span v-for="r in factionRealmRows(selectedFaction)" :key="r.key" class="pill">{{ r.key }} {{ r.value }}人</span>
                </div>
              </div>

              <div class="stat-sub" v-if="factionPositionRows(selectedFaction).length">
                <div class="stat-k">职位分布</div>
                <div class="stat-pills">
                  <span v-for="r in factionPositionRows(selectedFaction)" :key="r.key" class="pill">{{ r.key }} {{ r.value }}人</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">基础信息</div>
              <div class="kv"><span class="k">等级</span><span class="v">{{ factionLevel(selectedFaction) || '-' }}</span></div>
              <div class="kv"><span class="k">类型</span><span class="v">{{ factionType(selectedFaction) || '-' }}</span></div>
              <div class="kv"><span class="k">位置</span><span class="v">{{ locationText(factionLocation(selectedFaction)) }}</span></div>
              <div class="kv" v-if="factionTerritoryText(selectedFaction)"><span class="k">势力范围</span><span class="v">{{ factionTerritoryText(selectedFaction) }}</span></div>
              <div class="power" v-if="factionPowerValue(selectedFaction) != null">
                <div class="power-row">
                  <div class="power-k">综合战力</div>
                  <div class="power-v">{{ factionPowerText(selectedFaction) }}</div>
                </div>
                <div class="progress" role="progressbar" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="factionPowerValue(selectedFaction) || 0">
                  <div class="progress-bar" :style="{ width: (factionPowerValue(selectedFaction) || 0) + '%' }" />
                </div>
              </div>
              <div class="kv" v-else><span class="k">综合战力</span><span class="v">-</span></div>
            </div>
          </div>

          <div class="card" v-if="factionLeadershipRows(selectedFaction).length">
            <div class="card-title">宗门领导</div>
            <div class="list">
              <div v-for="r in factionLeadershipRows(selectedFaction)" :key="r.key" class="list-item li-row">
                <span class="li-k">{{ r.key }}</span>
                <span class="li-v">{{ r.value }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">宗门描述</div>
            <div class="tags" v-if="factionFeatures(selectedFaction).length">
              <span v-for="(t, idx) in factionFeatures(selectedFaction)" :key="idx" class="tag">{{ t }}</span>
            </div>
            <div class="muted" style="margin-top: 8px">{{ factionDesc(selectedFaction) || '-' }}</div>
          </div>

          <div class="card">
            <div class="card-title">关系状态</div>
            <div class="kv"><span class="k">与玩家关系</span><span class="v">{{ factionRelation(selectedFaction) || '-' }}</span></div>
            <div class="kv"><span class="k">声望值</span><span class="v">{{ Number(factionPrestige(selectedFaction)) || 0 }}</span></div>
            <div class="kv"><span class="k">敌意值</span><span class="v">{{ factionHostility(selectedFaction) }}</span></div>
          </div>

          <div class="actions" style="justify-content: flex-start">
            <button class="btn" type="button" :disabled="!factionJoinable(selectedFaction) || !!playerSect" @click="joinSect">加入宗门</button>
            <button class="btn btn-ghost" type="button" @click="emitAction('打听宗门：' + (factionName(selectedFaction) || '') + '的加入条件、加入好处、宗门规矩与近况，并更新世界信息.势力信息中该宗门的字段(加入条件/加入好处/领导层/势力范围详情等)')">打听详情</button>
            <button class="btn btn-ghost" type="button" @click="emitAction('与' + (factionName(selectedFaction) || '') + '进行一次宗门交互：根据剧情改变与玩家关系、声望值、并可能触发宗门任务')">宗门交互</button>
          </div>

          <details v-if="factionJoinRequirements(selectedFaction).length || factionBenefits(selectedFaction).length" class="details">
            <summary class="details-summary">加入信息</summary>
            <div v-if="factionJoinRequirements(selectedFaction).length" class="subcard" style="border-top: none; padding-top: 0">
              <div class="sub-title">加入条件</div>
              <div class="list">
                <div v-for="(x, idx) in factionJoinRequirements(selectedFaction)" :key="idx" class="list-item">{{ x }}</div>
              </div>
            </div>
            <div v-if="factionBenefits(selectedFaction).length" class="subcard">
              <div class="sub-title">加入好处</div>
              <div class="list">
                <div v-for="(x, idx) in factionBenefits(selectedFaction)" :key="idx" class="list-item">{{ x }}</div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useSettingsStore } from '../stores/useSettingsStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import type { TavernCommand } from '../services/tavernCommands'
import { resolveAiBaseUrl } from '../services/aiProviders'
import { generateWorldInfo } from '../services/worldGeneration'

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
}>()

const settingsStore = useSettingsStore()
const gameState = useGameStateStore()

const searchText = ref('')
const selectedKey = ref('')
const debugOpen = ref(false)
const generating = ref(false)
const progressText = ref('世界生成中...')

const worldInfo = computed<any>(() => (gameState as any).世界信息 || null)

const factions = computed<any[]>(() => {
  const list = worldInfo.value?.势力信息
  return Array.isArray(list) ? list : []
})

type FactionRow = {
  key: string
  name: string
  type: string
  level: string
  joinable: boolean
}

const factionRows = computed<FactionRow[]>(() => {
  const out: FactionRow[] = []
  for (let i = 0; i < factions.value.length; i++) {
    const f: any = factions.value[i]
    out.push({
      key: String(i),
      name: String(f?.名称 || f?.name || `势力${i + 1}`),
      type: String(f?.类型 || f?.type || ''),
      level: String(f?.等级 || f?.level || ''),
      joinable: !!(f?.可否加入 ?? f?.canJoin)
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
})

const filteredFactions = computed(() => {
  const q = String(searchText.value || '').trim().toLowerCase()
  if (!q) return factionRows.value
  return factionRows.value.filter(f => `${f.name} ${f.type} ${f.level}`.toLowerCase().includes(q))
})

const selectedFactionIndex = computed(() => {
  const k = selectedKey.value
  if (!k) return -1
  const idx = Number(k)
  return Number.isFinite(idx) ? idx : -1
})

const selectedFaction = computed<any>(() => {
  const idx = selectedFactionIndex.value
  if (idx < 0) return null
  return factions.value[idx] || null
})

const playerSect = computed<any>(() => (gameState as any).宗门信息 || null)

function emitAction(text: string) {
  emit('fill-action', text)
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function locationText(loc: any) {
  if (!loc) return '-'
  if (typeof loc === 'string') return loc
  if (typeof loc === 'object') {
    const x = Number(loc.x)
    const y = Number(loc.y)
    if (Number.isFinite(x) && Number.isFinite(y)) return `(${x}, ${y})`
  }
  return String(loc)
}

function factionName(f: any) {
  return String(f?.名称 || f?.name || '')
}

function factionType(f: any) {
  return String(f?.类型 || f?.type || '')
}

function factionLevel(f: any) {
  return String(f?.等级 || f?.level || '')
}

function factionLocation(f: any) {
  return f?.位置 ?? f?.location ?? ''
}

function factionContinent(f: any) {
  return String(f?.所在大洲 ?? f?.continent ?? '')
}

function factionResourcesText(f: any) {
  const a = f?.主要资源 ?? f?.resources
  if (Array.isArray(a)) return a.map((x: any) => String(x)).filter(Boolean).join('、')
  return ''
}

function factionTerritoryText(f: any) {
  const blocks: string[] = []

  const t1 = f?.势力范围 ?? f?.territory ?? f?.territory_bounds
  if (Array.isArray(t1)) blocks.push(...t1.map((x: any) => String(x)).filter(Boolean))

  const t2 = f?.影响范围 ?? f?.influence
  if (Array.isArray(t2)) blocks.push(...t2.map((x: any) => String(x)).filter(Boolean))

  const t3 = f?.控制区域 ?? f?.controlledAreas
  if (Array.isArray(t3)) blocks.push(...t3.map((x: any) => String(x)).filter(Boolean))

  const out = blocks.map(x => String(x)).filter(Boolean)
  return out.length ? out.join('、') : ''
}

function factionPowerText(f: any) {
  const n = Number(f?.综合战力 ?? f?.综合实力 ?? f?.power)
  if (!Number.isFinite(n)) return '-'
  const v = Math.max(0, Math.min(100, Math.floor(n)))
  return `${v}/100`
}

function factionPowerValue(f: any) {
  const n = Number(f?.综合战力 ?? f?.综合实力 ?? f?.power)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.floor(n)))
}

function factionMemberTotal(f: any) {
  const n = Number(f?.成员数量?.总数 ?? f?.memberCount?.total ?? f?.memberCount?.总数 ?? 0)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function toRowList(obj: any) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [] as Array<{ key: string; value: number }>
  const out: Array<{ key: string; value: number }> = []
  for (const [k, v] of Object.entries(obj)) {
    const n = Number(v)
    if (!k) continue
    if (Number.isFinite(n) && n > 0) out.push({ key: String(k), value: Math.max(0, Math.floor(n)) })
  }
  out.sort((a, b) => b.value - a.value)
  return out
}

function factionRealmRows(f: any) {
  return toRowList(f?.境界分布 ?? f?.memberCount?.realmDistribution ?? f?.memberCount?.境界分布)
}

function factionPositionRows(f: any) {
  return toRowList(f?.职位分布 ?? f?.memberCount?.positionDistribution ?? f?.memberCount?.职位分布)
}

function factionLeadershipRows(f: any) {
  const obj = f?.领导层 ?? f?.leadership
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [] as Array<{ key: string; value: string }>
  const out: Array<{ key: string; value: string }> = []
  for (const [k, v] of Object.entries(obj)) {
    if (!k) continue
    if (Array.isArray(v)) {
      out.push({ key: String(k), value: v.map((x: any) => String(x)).filter(Boolean).join('、') })
      continue
    }
    out.push({ key: String(k), value: String(v ?? '') })
  }
  return out.filter(x => x.value)
}

function factionDesc(f: any) {
  return String(f?.描述 || f?.description || '')
}

function factionRelation(f: any) {
  return String(f?.与玩家关系 || f?.relation || '')
}

function factionPrestige(f: any) {
  const n = Number(f?.声望值 ?? f?.prestige ?? 0)
  return Number.isFinite(n) ? n : 0
}

function factionHostility(f: any) {
  const n = Number(f?.敌意值 ?? f?.hostility ?? 0)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.floor(n))) : 0
}

function factionJoinable(f: any) {
  return !!(f?.可否加入 ?? f?.canJoin)
}

function factionJoinRequirements(f: any): string[] {
  const a = f?.加入条件 ?? f?.joinRequirements
  return Array.isArray(a) ? a.map((x: any) => String(x)).filter(Boolean) : []
}

function factionBenefits(f: any): string[] {
  const a = f?.加入好处 ?? f?.benefits
  return Array.isArray(a) ? a.map((x: any) => String(x)).filter(Boolean) : []
}

function factionFeatures(f: any): string[] {
  const a = f?.特色 ?? f?.features
  return Array.isArray(a) ? a.map((x: any) => String(x)).filter(Boolean) : []
}

async function refreshWorld() {
  try {
    generating.value = true
    progressText.value = '世界生成：准备中...'

    const existing = worldInfo.value
    const input = {
      worldName: String(existing?.世界名称 || '朝天大陆'),
      worldEra: String(existing?.世界纪元 || '未知纪元'),
      worldBackground: String(existing?.世界背景 || '世界背景尚未生成'),
      characterName: String((gameState as any).角色基础信息?.名字 || '无名'),
      characterBackground: String((gameState as any).角色基础信息?.出身 || '未知出身'),
      seed: Date.now(),
      counts: {
        continentCount: Number(existing?.地图配置?.counts?.continentCount ?? 4) || 4,
        factionCount: Number(existing?.地图配置?.counts?.factionCount ?? 5) || 5,
        locationCount: Number(existing?.地图配置?.counts?.locationCount ?? 12) || 12
      }
    }

    const onProgress = (t: string) => {
      progressText.value = t
    }

    let nextWorld: any = null
    const customApiUrl = String(settingsStore.customApiUrl || '').trim()
    const customApiKey = String(settingsStore.customApiKey || '').trim()

    const aiBaseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
    const aiModel = String(settingsStore.aiModel || '').trim()

    if (aiBaseUrl && aiModel) {
      try {
        nextWorld = await generateWorldInfo(input as any, {
          provider: 'openai_compat',
          openAiCompat: {
            baseUrl: aiBaseUrl,
            apiKey: customApiKey,
            model: aiModel,
            temperature: settingsStore.aiTemperature,
            maxTokens: settingsStore.aiMaxOutputTokens,
            timeoutMs: 60000
          },
          onProgress
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误'
        onProgress(`世界生成：AI失败（${msg}），尝试自定义API...`)
        nextWorld = null
      }
    }

    if (!nextWorld && settingsStore.aiProviderPreset === 'custom' && customApiUrl) {
      try {
        nextWorld = await generateWorldInfo(input as any, {
          provider: 'custom_api',
          customApi: { baseUrl: customApiUrl, apiKey: customApiKey, endpointPath: '/world/generate', timeoutMs: 60000 },
          onProgress
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误'
        onProgress(`世界生成：自定义API失败（${msg}），使用本地生成...`)
        nextWorld = null
      }
    }

    if (!nextWorld) {
      nextWorld = await generateWorldInfo(input as any, { provider: 'local', onProgress })
    }

    if (existing && typeof existing === 'object') {
      const nextFactions = (nextWorld as any)?.势力信息
      if (Array.isArray(nextFactions)) {
        gameState.applyCommands([{ action: 'set', key: '世界信息.势力信息', value: nextFactions } as TavernCommand])
      } else {
        gameState.applyCommands([{ action: 'set', key: '世界信息', value: nextWorld } as TavernCommand])
      }
    } else {
      gameState.applyCommands([{ action: 'set', key: '世界信息', value: nextWorld } as TavernCommand])
    }
  } finally {
    generating.value = false
    progressText.value = '世界生成中...'
  }
}

function formatDate() {
  const t: any = (gameState as any).游戏时间
  if (!t) return ''
  const y = Number(t.年)
  const m = Number(t.月)
  const d = Number(t.日)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  return `仙道${Math.floor(y)}年${Math.floor(m)}月${Math.floor(d)}日`
}

function joinSect() {
  const f = selectedFaction.value
  if (!f || playerSect.value) return

  const name = factionName(f)
  if (!name) return

  const sect = {
    宗门名称: name,
    宗门类型: factionType(f),
    职位: '外门弟子',
    贡献: 0,
    关系: factionRelation(f) || '中立',
    声望: 0,
    加入日期: formatDate(),
    描述: factionDesc(f),
    师父: '',
    同门关系: [],
    宗门职务: []
  }

  const cmds: TavernCommand[] = []
  cmds.push({ action: 'set', key: '宗门信息', value: sect })

  const idx = selectedFactionIndex.value
  if (idx >= 0) {
    // 统一写入中文字段，保证与存档/文档一致
    cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].与玩家关系`, value: '友好' })

    const prevRep = Number(f?.声望值 ?? f?.prestige ?? 0)
    cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].声望值`, value: Number.isFinite(prevRep) ? Math.max(0, Math.floor(prevRep)) : 0 })

    const total = Number(f?.成员数量?.总数 ?? f?.memberCount?.总数 ?? 0)
    cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].成员数量.总数`, value: Math.max(0, Math.floor(total) + 1) })
  }

  gameState.applyCommands(cmds)
}

function leaveSect() {
  if (!playerSect.value) return
  const ok = window.confirm('确定退出当前宗门？')
  if (!ok) return

  const cmds: TavernCommand[] = [{ action: 'set', key: '宗门信息', value: null }]

  const sectName = String(playerSect.value?.宗门名称 || '')
  if (sectName) {
    const idx = factions.value.findIndex((x: any) => String(x?.名称 || x?.name || '') === sectName)
    if (idx >= 0) {
      const f: any = factions.value[idx]
      cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].与玩家关系`, value: '中立' })

      const total = Number(f?.成员数量?.总数 ?? f?.memberCount?.总数 ?? 0)
      cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].成员数量.总数`, value: Math.max(0, Math.floor(total) - 1) })
    }
  }

  gameState.applyCommands(cmds)
}

function addContribution(delta: number) {
  if (!playerSect.value) return
  const d = Number(delta)
  if (!Number.isFinite(d) || d === 0) return
  const prev = Number(playerSect.value?.贡献 ?? 0)
  const base = Number.isFinite(prev) ? prev : 0
  const next = Math.max(0, Math.floor(base + d))
  const cmds: TavernCommand[] = [{ action: 'set', key: '宗门信息.贡献', value: next }]
  gameState.applyCommands(cmds)
}

function addPrestige(delta: number) {
  if (!playerSect.value) return
  const d = Number(delta)
  if (!Number.isFinite(d) || d === 0) return
  const prev = Number(playerSect.value?.声望 ?? 0)
  const base = Number.isFinite(prev) ? prev : 0
  const next = Math.max(0, Math.floor(base + d))
  const cmds: TavernCommand[] = [{ action: 'set', key: '宗门信息.声望', value: next }]

  const sectName = String(playerSect.value?.宗门名称 || '')
  if (sectName) {
    const idx = factions.value.findIndex((x: any) => String(x?.名称 || x?.name || '') === sectName)
    if (idx >= 0) {
      const f: any = factions.value[idx]
      if (f?.声望值 !== undefined) {
        const prevRep = Number(f?.声望值 ?? 0)
        const baseRep = Number.isFinite(prevRep) ? prevRep : 0
        cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].声望值`, value: Math.max(0, Math.floor(baseRep + d)) })
      }
      if (f?.prestige !== undefined) {
        const prevRep = Number(f?.prestige ?? 0)
        const baseRep = Number.isFinite(prevRep) ? prevRep : 0
        cmds.push({ action: 'set', key: `世界信息.势力信息[${idx}].prestige`, value: Math.max(0, Math.floor(baseRep + d)) })
      }
    }
  }

  gameState.applyCommands(cmds)
}
</script>

<style scoped>
.sect-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  min-height: 560px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--panel-bg);
}

 .grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
 }

 @media (max-width: 980px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
 }

@media (max-width: 860px) {
  .body {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  border: none;
  border-right: 1px solid var(--panel-border);
  border-radius: 0;
  background: transparent;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(37, 99, 235, 0.95);
}

.search {
  position: relative;
}

.search-ico {
  position: absolute;
  left: 10px;
  top: 8px;
}

.input {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  border-radius: 10px;
  padding: 8px 10px;
  width: 100%;
}

.search .input {
  padding-left: 34px;
}

.faction-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  max-height: none;
  flex: 1;
  min-height: 0;
}

.faction {
  text-align: left;
  width: 100%;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  border-radius: 12px;
  padding: 10px;
  color: var(--text-1);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.tag-purple {
  border-color: rgba(124, 58, 237, 0.35);
  background: rgba(124, 58, 237, 0.10);
  color: rgba(124, 58, 237, 0.95);
}

.faction.active {
  border-color: rgba(59, 130, 246, 0.7);
}

.faction-name {
  font-weight: 800;
  margin-bottom: 4px;
}

.faction-sub {
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  gap: 6px;
  align-items: center;
}

 .tag-green {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.10);
  color: rgba(34, 197, 94, 0.95);
 }

.dot {
  opacity: 0.5;
}

.pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
}

.empty-side {
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 360px;
}

.empty-ico {
  font-size: 48px;
  color: rgba(148, 163, 184, 0.9);
}

.empty-title {
  font-weight: 800;
  color: var(--text-1);
}

.empty-sub {
  color: var(--text-3);
  font-size: 13px;
}

.debug {
  margin-top: 12px;
  cursor: pointer;
}

.debug-box {
  width: 100%;
  text-align: left;
  max-height: 180px;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  padding: 10px;
  background: rgba(2, 6, 23, 0.25);
}

.main {
  border: none;
  border-radius: 0;
  background: rgba(248, 250, 252, 0.95);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

 .detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
 }

 .detail-head {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
 }

 .dh-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
 }

 .dh-ico {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
 }

 .dh-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
 }

 .dh-name {
  font-weight: 900;
  font-size: 16px;
  color: var(--text-1);
 }

 .dh-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
 }

 .dh-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
 }

 .dh-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: flex-end;
 }

 .dh-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
 }

 .dh-meta-k {
  color: var(--text-muted);
  font-size: 12px;
 }

 .dh-meta-v {
  font-size: 13px;
  color: var(--text-1);
 }

 @media (max-width: 860px) {
  .detail-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .dh-right {
    width: 100%;
    justify-content: flex-start;
  }
  .dh-meta {
    width: 100%;
    justify-content: flex-start;
  }
 }

.card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 12px;
}

 .power {
  margin-top: 10px;
 }

 .power-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
 }

 .power-k {
  color: var(--text-muted);
  font-size: 13px;
 }

 .power-v {
  font-size: 13px;
  font-weight: 800;
  color: rgba(96, 165, 250, 0.95);
 }

 .progress {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
 }

 .progress-bar {
  height: 100%;
  background: rgba(96, 165, 250, 0.95);
  border-radius: 999px;
 }

 .li-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
 }

 .li-k {
  color: var(--text-muted);
  font-weight: 700;
 }

 .li-v {
  color: var(--text-1);
 }

 .details {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 12px;
 }

 .details-summary {
  cursor: pointer;
  font-weight: 800;
  color: var(--text-1);
 }

.card-title {
  font-weight: 800;
  margin-bottom: 10px;
}

.kv {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.kv:last-child {
  border-bottom: none;
}

.k {
  color: var(--text-muted);
  font-size: 13px;
}

.v {
  font-size: 13px;
}

.muted {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: 1px solid var(--accent-solid);
  background: var(--accent-solid);
  color: #ffffff;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:hover {
  filter: brightness(1.05);
}

.btn-ghost {
  background: var(--surface-3);
  border-color: var(--panel-border);
  color: var(--text-1);
}

.btn-danger {
  border-color: rgba(220, 38, 38, 0.85);
  background: rgba(220, 38, 38, 0.85);
  color: #ffffff;
}

.empty-main {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-main-ico {
  font-size: 64px;
  color: rgba(148, 163, 184, 0.9);
}

.empty-main-title {
  font-weight: 800;
  font-size: 18px;
  color: var(--text-1);
}

.empty-main-sub {
  color: var(--text-3);
  font-size: 13px;
}

.tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
}

.subcard {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  padding-top: 12px;
}

.sub-title {
  font-weight: 800;
  margin-bottom: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--surface-3);
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-2);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.stat-block {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat-k {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.stat-v {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-1);
}

.stat-sub {
  margin-top: 10px;
}

.stat-pills {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.json-pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.blue {
  color: rgba(96, 165, 250, 0.95);
}

.icon {
  font-size: 14px;
}
</style>
