<template>
  <div v-if="modelValue" :class="embedded ? 'embedded-shell' : 'drawer-overlay'" @click.self="onShellClick">
    <aside class="dialog" :class="{ embedded }" role="dialog" aria-modal="true">
      <div v-if="!embedded" class="dialog-top">
        <button class="icon-btn" type="button" aria-label="关闭" @click="close">←</button>
        <div class="dialog-title">人物详情</div>
        <div style="width: 36px"></div>
      </div>

      <div class="dialog-body">
        <div class="profile">
          <div class="avatar">{{ avatarChar }}</div>
          <div class="profile-main">
            <div class="profile-name">{{ baseName }}</div>
            <div class="profile-meta">
              <span class="badge">{{ genderText }}</span>
              <span class="meta-text">{{ raceText }}</span>
              <span class="meta-text">{{ ageText }}</span>
              <span class="meta-text">{{ originText }}</span>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-tile">
              <div class="stat-icon">⛰️</div>
              <div class="stat-k">境界</div>
              <div class="stat-v">{{ realmText }}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">🧬</div>
              <div class="stat-k">灵根</div>
              <div class="stat-v">{{ linggenText }}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">📍</div>
              <div class="stat-k">位置</div>
              <div class="stat-v">{{ locationDesc }}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">🌱</div>
              <div class="stat-k">出生</div>
              <div class="stat-v">{{ originText }}</div>
            </div>
            <div class="stat-tile progress">
              <div class="stat-k">修为进度</div>
              <div class="stat-v" style="text-align:right">{{ realmProgressPercent }}%</div>
              <div class="progress-track" aria-hidden="true"><div class="progress-fill" :style="{ width: realmProgressPercent + '%' }" /></div>
              <div class="progress-sub">{{ realmProgressText }}</div>
            </div>
          </div>
        </div>

        <div class="page">
          <div class="grid">
            <section class="card">
              <div class="card-title"><span class="card-ico">❤️</span><span>生命状态</span></div>
              <div class="bars">
                <div class="bar">
                  <div class="bar-head"><span>气血</span><span>{{ statText(status?.气血) }}</span></div>
                  <div class="bar-track"><div class="bar-fill fill-hp" :style="{ width: statPercent(status?.气血) + '%' }" /></div>
                </div>
                <div class="bar">
                  <div class="bar-head"><span>灵气</span><span>{{ statText(status?.灵气) }}</span></div>
                  <div class="bar-track"><div class="bar-fill fill-mp" :style="{ width: statPercent(status?.灵气) + '%' }" /></div>
                </div>
                <div class="bar">
                  <div class="bar-head"><span>神识</span><span>{{ statText(status?.神识) }}</span></div>
                  <div class="bar-track"><div class="bar-fill fill-sp" :style="{ width: statPercent(status?.神识) + '%' }" /></div>
                </div>
                <div class="fame">
                  <span class="fame-k">声望</span>
                  <span class="fame-v">{{ fameText }}</span>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">👤</span><span>角色背景</span></div>
              <div class="kv-grid">
                <div class="kv">
                  <div class="k">境界</div>
                  <div class="v">{{ realmText }}</div>
                </div>
                <div class="kv">
                  <div class="k">性别</div>
                  <div class="v">{{ genderPlainText }}</div>
                </div>
                <div class="kv">
                  <div class="k">灵根</div>
                  <div class="v pill">{{ linggenText }}</div>
                </div>
                <div class="kv">
                  <div class="k">年龄</div>
                  <div class="v">{{ ageText }}</div>
                </div>
                <div class="kv kv-full">
                  <div class="k">位置</div>
                  <div class="v">{{ locationDesc }}</div>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">✨</span><span>天赋与灵根</span></div>
              <div class="block">
                <div class="block-title">天资等级</div>
                <div class="box">
                  <div class="box-title">{{ aptitudeTitle }}</div>
                  <div class="box-desc">{{ aptitudeDesc }}</div>
                </div>
              </div>

              <div class="block">
                <div class="block-title">天赋特质<span class="muted" v-if="talentTraits.length > 0">（{{ talentTraits.length }}）</span></div>
                <div v-if="talentTraits.length === 0" class="muted">暂无天赋</div>
                <div v-else class="effects">
                  <div v-for="(t, idx) in talentTraits" :key="idx" class="effect-item">
                    <div class="effect-title">{{ t.title }}</div>
                    <div class="effect-desc">{{ t.desc }}</div>
                  </div>
                </div>
              </div>

              <div class="block">
                <div class="block-title">灵根属性</div>
                <button class="linggen-card" type="button" @click="openLinggenModal">
                  <div class="linggen-head">
                    <div class="linggen-label">
                      <span class="card-ico">⚡</span>
                      <span>灵根属性</span>
                    </div>
                    <div class="linggen-hint">点击查看详情</div>
                  </div>

                  <div class="linggen-title">{{ linggenData.name }}</div>

                  <div class="linggen-badges">
                    <span v-if="linggenData.grade" class="linggen-badge grade">{{ linggenData.grade }}</span>
                    <span v-if="linggenData.rateText" class="linggen-badge rate">{{ linggenData.rateText }}</span>
                  </div>

                  <div class="linggen-desc">{{ linggenData.desc }}</div>

                  <div v-if="linggenData.effects.length" class="linggen-effects">
                    <span v-for="(e, idx) in linggenData.effects" :key="idx" class="linggen-chip">{{ e }}</span>
                  </div>
                </button>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">📊</span><span>六司属性</span></div>
              <div class="sub-title">最终六司</div>
              <div class="stat-grid">
                <div v-for="x in finalSix" :key="x.key" class="stat-item">
                  <div class="k">{{ x.key }}</div>
                  <div class="v">{{ x.value }}</div>
                </div>
              </div>
              <div class="sub-title">先天六司</div>
              <div class="stat-grid">
                <div v-for="x in innateSix" :key="x.key" class="stat-item">
                  <div class="k">{{ x.key }}</div>
                  <div class="v">{{ x.value }}</div>
                </div>
              </div>
              <div class="sub-title">后天六司</div>
              <div class="stat-grid">
                <div v-for="x in acquiredSix" :key="x.key" class="stat-item">
                  <div class="k">{{ x.key }}</div>
                  <div class="v" :class="{ plus: x.value > 0 }">{{ acquiredText(x.value) }}</div>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">📘</span><span>修炼功法</span></div>
              <div class="kv-grid">
                <div class="kv kv-full">
                  <div class="k">当前功法</div>
                  <div class="v">{{ cultivationName }}</div>
                </div>
                <div class="kv">
                  <div class="k">品质</div>
                  <div class="v">{{ cultivationQualityText }}</div>
                </div>
                <div class="kv">
                  <div class="k">修为进度</div>
                  <div class="v">{{ cultivationProgressText }}</div>
                </div>
              </div>
              <div class="block">
                <div class="block-title">已掌握技能<span class="muted" v-if="masteredSkillNames.length > 0">（{{ masteredSkillNames.length }}个）</span></div>
                <div v-if="masteredSkillNames.length === 0" class="muted">暂无技能</div>
                <div v-else class="chips">
                  <div v-for="s in masteredSkillNames" :key="s" class="chip">{{ s }}</div>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">⚡</span><span>三千大道</span></div>
              <div class="kv-grid">
                <div class="kv kv-full">
                  <div class="k">已解</div>
                  <div class="v">{{ daoUnlockedText }}</div>
                </div>
              </div>
              <div class="row-actions" style="margin-top: 10px">
                <button class="btn" type="button" @click="emitAction('参悟三千大道，尝试凝练自身道途方向')">参悟大道</button>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">🤝</span><span>人际关系</span></div>
              <div class="summary">
                <div class="summary-item">
                  <div class="summary-k">总人数</div>
                  <div class="summary-v">{{ relationshipTotal }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-k">平均好感</div>
                  <div class="summary-v">{{ relationshipAvgFavorText }}</div>
                </div>
              </div>
              <div class="row-actions" style="margin-top: 10px">
                <button class="btn btn-ghost" type="button" @click="emitAction('回顾近期结识人物与关系变化，整理人情世故网络')">查看详情</button>
              </div>
            </section>

            <section class="card">
              <div class="card-title"><span class="card-ico">🎒</span><span>背包概览</span></div>
              <div class="summary">
                <div class="summary-item">
                  <div class="summary-k">物品总数</div>
                  <div class="summary-v">{{ backpackItemKinds }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-k">法宝数量</div>
                  <div class="summary-v">{{ backpackEquipCount }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-k">功法数量</div>
                  <div class="summary-v">{{ backpackGongfaCount }}</div>
                </div>
              </div>
              <div class="sub-title">灵石储备</div>
              <div class="stone-grid">
                <div class="stone">
                  <div class="k">下品</div>
                  <div class="v">{{ lingShi.下品 }}</div>
                </div>
                <div class="stone">
                  <div class="k">中品</div>
                  <div class="v">{{ lingShi.中品 }}</div>
                </div>
                <div class="stone">
                  <div class="k">上品</div>
                  <div class="v">{{ lingShi.上品 }}</div>
                </div>
                <div class="stone">
                  <div class="k">极品</div>
                  <div class="v">{{ lingShi.极品 }}</div>
                </div>
              </div>
            </section>

            <section class="card span-all">
              <div class="card-title"><span class="card-ico">🧪</span><span>状态效果</span></div>
              <div v-if="effects.length === 0" class="muted">暂无状态效果</div>
              <div v-else class="effects">
                <div v-for="(e, idx) in effects" :key="idx" class="effect-item">
                  <div class="effect-title">{{ e.title }}</div>
                  <div class="effect-desc">{{ e.desc }}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div v-if="!embedded" class="dialog-footer">
        <button class="btn" type="button" @click="emitAction('查看自身修为、属性与状态效果详情')">查看详细属性</button>
        <button class="btn btn-ghost" type="button" @click="close">关闭</button>
      </div>

      <div v-if="showLinggenModal" class="lg-modal-overlay" @click.self="closeLinggenModal">
        <div class="lg-modal" role="dialog" aria-modal="true">
          <div class="lg-modal-top">
            <div class="lg-modal-title">{{ linggenModalTitle }}</div>
            <button class="lg-close" type="button" aria-label="关闭" @click="closeLinggenModal">×</button>
          </div>

          <div class="lg-modal-body">
            <div class="lg-grid">
              <div class="lg-tile">
                <div class="lg-tile-k">
                  <span class="lg-tile-ico">⚡</span>
                  <span>灵根类型</span>
                </div>
                <div class="lg-tile-v">{{ linggenNameWithTier }}</div>
              </div>

              <div class="lg-tile">
                <div class="lg-tile-k">
                  <span class="lg-tile-ico">⭐</span>
                  <span>灵根品级</span>
                </div>
                <div class="lg-tile-v"><span class="linggen-badge grade">{{ linggenData.grade || '未知' }}</span></div>
              </div>

              <div class="lg-tile">
                <div class="lg-tile-k">
                  <span class="lg-tile-ico">🚀</span>
                  <span>修炼速度</span>
                </div>
                <div class="lg-tile-v"><span class="linggen-badge rate">{{ linggenData.rateText || '-' }}</span></div>
              </div>
            </div>

            <div class="lg-sec">
              <div class="lg-sec-title">特殊效果</div>
              <div v-if="linggenData.effects.length" class="lg-chips">
                <span v-for="(e, idx) in linggenData.effects" :key="idx" class="lg-chip">{{ e }}</span>
              </div>
              <div v-else class="lg-muted">暂无</div>
            </div>

            <div class="lg-sec">
              <div class="lg-sec-title">详细信息</div>
              <div class="lg-rows">
                <div class="lg-row">
                  <div class="lg-row-k">基础倍率：</div>
                  <div class="lg-row-v">{{ linggenData.baseMultiplierText || '-' }}</div>
                </div>
                <div v-if="linggenData.speedText" class="lg-row">
                  <div class="lg-row-k">修炼速度：</div>
                  <div class="lg-row-v">{{ linggenData.speedText }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { getDefaultRoots, loadCustomCreationData, type RootOption } from '../services/characterCreation'
import { useGameStateStore } from '../stores/useGameStateStore'

const props = defineProps<{ modelValue: boolean; embedded?: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'fill-action', text: string): void
}>()

const gameState = useGameStateStore()

const embedded = computed(() => !!props.embedded)

function onShellClick() {
  if (embedded.value) return
  close()
}

function close() {
  emit('update:modelValue', false)
}

function emitAction(text: string) {
  emit('fill-action', text)
  emit('update:modelValue', false)
}

const showLinggenModal = ref(false)

function openLinggenModal() {
  showLinggenModal.value = true
}

function closeLinggenModal() {
  showLinggenModal.value = false
}

const base = computed<any>(() => (gameState as any).角色基础信息 || {})
const status = computed<any>(() => (gameState as any).玩家角色状态 || {})

const linggenCatalog = computed<RootOption[]>(() => {
  const defaults = getDefaultRoots()
  const custom = loadCustomCreationData().roots || []
  const map = new Map<string, RootOption>()
  for (const r of [...defaults, ...custom]) {
    if (!r) continue
    const id = String((r as any).id || '').trim()
    if (id) map.set(id, r)
  }
  for (const r of [...defaults, ...custom]) {
    if (!r) continue
    const name = String((r as any).名称 || (r as any).name || '').trim()
    if (name && !map.has(name)) map.set(name, r)
  }
  return Array.from(map.values())
})

function normalizeLinggenName(name: string): string {
  const raw = String(name || '').trim()
  if (!raw) return ''
  const noParen = raw
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, '')
    .trim()
  return noParen || raw
}

function findLinggenPreset(raw: any): RootOption | null {
  const list = linggenCatalog.value
  if (!raw) return null
  if (typeof raw === 'string') {
    const name = raw.trim()
    if (!name) return null
    const n1 = normalizeLinggenName(name)
    const exact =
      list.find((x) => String(x?.名称 || '').trim() === name) ||
      list.find((x) => normalizeLinggenName(String(x?.名称 || '')) === n1)
    if (exact) return exact
    return (
      list.find((x) => n1.includes(normalizeLinggenName(String(x?.名称 || '')))) ||
      list.find((x) => normalizeLinggenName(String(x?.名称 || '')).includes(n1)) ||
      null
    )
  }
  if (typeof raw === 'object') {
    const id = String((raw as any)?.id || (raw as any)?.灵根ID || '').trim()
    if (id) {
      return list.find((x) => String(x?.id || '').trim() === id) || null
    }
    const name = String((raw as any)?.名称 || (raw as any)?.name || '').trim()
    if (name) {
      const n1 = normalizeLinggenName(name)
      const exact =
        list.find((x) => String(x?.名称 || '').trim() === name) ||
        list.find((x) => normalizeLinggenName(String(x?.名称 || '')) === n1)
      if (exact) return exact
      return (
        list.find((x) => n1.includes(normalizeLinggenName(String(x?.名称 || '')))) ||
        list.find((x) => normalizeLinggenName(String(x?.名称 || '')).includes(n1)) ||
        null
      )
    }
  }
  return null
}

const baseName = computed(() => String(base.value?.名字 || base.value?.姓名 || '未知'))

const avatarChar = computed(() => {
  const name = baseName.value
  const c = name.trim().slice(0, 1)
  return c || '？'
})

const genderPlainText = computed(() => String(base.value?.性别 || '未知'))
const genderText = computed(() => {
  const g = genderPlainText.value
  if (g === '男') return '♂ 男'
  if (g === '女') return '♀ 女'
  return g
})

const raceText = computed(() => {
  const v = base.value?.种族
  return String(v || '未知')
})

const ageText = computed(() => {
  const v = base.value?.年龄
  if (typeof v === 'number' && Number.isFinite(v)) return `${v}岁`
  return '-'
})

const originText = computed(() => {
  const o = base.value?.出生
  if (!o) return '-'
  if (typeof o === 'string') return o
  if (typeof o === 'object') return String(o?.名称 || o?.name || o?.描述 || '未知')
  return String(o)
})

const locationDesc = computed(() => String(status.value?.位置?.描述 || '未知位置'))

const realmText = computed(() => {
  const r = status.value?.境界
  const name = String(r?.名称 || '未知')
  const stage = r?.阶段 ? `·${r.阶段}` : ''
  return `${name}${stage}`
})

const realmProgressText = computed(() => {
  const r: any = status.value?.境界
  const cur = typeof r?.当前进度 === 'number' ? r.当前进度 : null
  const need = typeof r?.下一级所需 === 'number' ? r.下一级所需 : null
  if (cur != null && need != null && need > 0) return `${cur}/${need}`
  return '-'
})

const realmProgressPercent = computed(() => {
  const r: any = status.value?.境界
  const cur = Number(r?.当前进度)
  const need = Number(r?.下一级所需)
  if (!Number.isFinite(cur) || !Number.isFinite(need) || need <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((cur / need) * 100)))
})

function formatRateText(v: any): string {
  const n = Number(v)
  if (Number.isFinite(n) && n > 0) {
    const fixed = Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1)
    return `${fixed}x`
  }
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return ''
    if (t.endsWith('x') || t.endsWith('X')) return t
    const n2 = Number(t)
    if (Number.isFinite(n2) && n2 > 0) return `${t}x`
    return t
  }
  return ''
}

function normalizeLinggenFull(v: any): {
  name: string
  grade: string
  rateText: string
  baseMultiplierText: string
  speedText: string
  desc: string
  effects: string[]
} {
  const preset = findLinggenPreset(v)
  if (!v) {
    if (preset) {
      return {
        name: String(preset.名称 || '未知灵根'),
        grade: String(preset.品级 || '').trim(),
        rateText: formatRateText((preset as any).修炼倍率) || formatRateText((preset as any).修炼速度) || '',
        baseMultiplierText: formatRateText((preset as any).修炼倍率) || '',
        speedText: String((preset as any).修炼速度 || '').trim(),
        desc: String(preset.描述 || '无描述'),
        effects: (() => {
          const takeEffects = (candidate: any): string[] => {
            if (Array.isArray(candidate)) {
              const out = candidate
                .map((x) => {
                  if (x && typeof x === 'object') return String((x as any).名称 || (x as any).name || (x as any).title || '').trim()
                  return String(x || '').trim()
                })
                .filter(Boolean)
              return out
            }
            if (candidate) {
              const s = String(candidate).trim()
              return s ? [s] : []
            }
            return []
          }

          const candidates = [
            (preset as any).特殊效果,
            (preset as any).special_effects,
            (preset as any).specialEffects,
            (preset as any).effects,
            (preset as any).效果
          ]

          for (const c of candidates) {
            const out = takeEffects(c)
            if (out.length) return out
          }
          return []
        })()
      }
    }
    return { name: '未知灵根', grade: '', rateText: '', baseMultiplierText: '', speedText: '', desc: '无描述', effects: [] }
  }

  if (typeof v === 'string') {
    const t = v.trim()
    if (preset) {
      return {
        name: t || String(preset.名称 || '未知灵根'),
        grade: String(preset.品级 || '').trim(),
        rateText: formatRateText((preset as any).修炼倍率) || formatRateText((preset as any).修炼速度) || '',
        baseMultiplierText: formatRateText((preset as any).修炼倍率) || '',
        speedText: String((preset as any).修炼速度 || '').trim(),
        desc: String(preset.描述 || '无描述'),
        effects: (() => {
          const takeEffects = (candidate: any): string[] => {
            if (Array.isArray(candidate)) {
              const out = candidate
                .map((x) => {
                  if (x && typeof x === 'object') return String((x as any).名称 || (x as any).name || (x as any).title || '').trim()
                  return String(x || '').trim()
                })
                .filter(Boolean)
              return out
            }
            if (candidate) {
              const s = String(candidate).trim()
              return s ? [s] : []
            }
            return []
          }

          const candidates = [
            (preset as any).特殊效果,
            (preset as any).special_effects,
            (preset as any).specialEffects,
            (preset as any).effects,
            (preset as any).效果
          ]

          for (const c of candidates) {
            const out = takeEffects(c)
            if (out.length) return out
          }
          return []
        })()
      }
    }
    return { name: t || '未知灵根', grade: '', rateText: '', baseMultiplierText: '', speedText: '', desc: '无描述', effects: [] }
  }

  if (typeof v === 'object') {
    const name = String((v as any)?.名称 || (v as any)?.name || preset?.名称 || '未知灵根')
    const grade = String((v as any)?.品级 || (v as any)?.tier || (v as any)?.grade || preset?.品级 || '').trim()

    const baseMultiplier = (v as any)?.base_multiplier ?? (v as any)?.基础倍率
    const cultivationSpeed = (v as any)?.cultivation_speed ?? (v as any)?.修炼速度
    const tier = String((v as any)?.品级 || (v as any)?.tier || preset?.品级 || '凡品')

    const baseMultiplierText = baseMultiplier ? `${String(baseMultiplier)}x` : formatRateText((preset as any)?.修炼倍率) || ''

    let rateText = ''
    if (baseMultiplier) rateText = `${String(baseMultiplier)}x`
    else if (cultivationSpeed) rateText = String(cultivationSpeed)
    else {
      const map: Record<string, string> = {
        凡品: '1.0x',
        下品: '1.1x',
        中品: '1.3x',
        上品: '1.6x',
        极品: '2.0x',
        神品: '2.8x'
      }
      rateText = map[tier] || '1.0x'
    }

    const speedText = String(cultivationSpeed || '').trim()
    const desc = String((v as any)?.描述 || (v as any)?.description || preset?.描述 || '无描述')

    const takeEffects = (candidate: any): string[] => {
      if (Array.isArray(candidate)) {
        const out = candidate
          .map((x) => {
            if (x && typeof x === 'object') return String((x as any).名称 || (x as any).name || (x as any).title || '').trim()
            return String(x || '').trim()
          })
          .filter(Boolean)
        return out
      }
      if (candidate) {
        const s = String(candidate).trim()
        return s ? [s] : []
      }
      return []
    }

    const candidates = [
      (v as any)?.special_effects,
      (v as any)?.specialEffects,
      (v as any)?.special_effect,
      (v as any)?.specialEffect,
      (v as any)?.特殊效果,
      (v as any)?.effects,
      (v as any)?.效果,
      (preset as any)?.特殊效果,
      (preset as any)?.special_effects,
      (preset as any)?.specialEffects,
      (preset as any)?.effects,
      (preset as any)?.效果
    ]

    let effects: string[] = []
    for (const c of candidates) {
      const out = takeEffects(c)
      if (out.length) {
        effects = out
        break
      }
    }

    return { name, grade, rateText, baseMultiplierText, speedText, desc, effects }
  }

  return { name: String(v), grade: '', rateText: '', baseMultiplierText: '', speedText: '', desc: '无描述', effects: [] }
}

const linggenData = computed(() => normalizeLinggenFull(base.value?.灵根 ?? status.value?.灵根))

const linggenNameWithTier = computed(() => {
  const name = String(linggenData.value.name || '未知灵根').trim()
  const tier = String(linggenData.value.grade || '').trim()
  if (tier && tier !== '未知' && tier !== '凡品') return `${name}(${tier})`
  return name
})

const linggenModalTitle = computed(() => {
  const v = base.value?.灵根
  if (v && typeof v === 'object') {
    const name = String((v as any)?.名称 || (v as any)?.name || linggenData.value.name || '未知灵根').trim()
    const tier = String((v as any)?.品级 || (v as any)?.tier || linggenData.value.grade || '').trim()
    if (tier && tier !== '未知' && tier !== '凡品') return `${name}(${tier}) 详情`
    return `${name} 详情`
  }
  const name = linggenData.value.name
  const tier = linggenData.value.grade
  if (tier && tier !== '未知' && tier !== '凡品') return `${name}(${tier}) 详情`
  return `${name} 详情`
})

const linggenText = computed(() => {
  const name = linggenData.value.name
  const grade = linggenData.value.grade
  return grade ? `${name}（${grade}）` : name
})

const aptitudeTitle = computed(() => {
  const v = base.value?.天资
  if (typeof v === 'string' && v.trim()) return v
  if (typeof v === 'object') return String(v?.名称 || v?.name || '未知')
  return '未知'
})

const aptitudeDesc = computed(() => {
  const v = base.value?.天资
  if (typeof v === 'object') return String(v?.描述 || v?.description || '无描述')
  const d = base.value?.天资描述
  return String(d || '无描述')
})

function statText(stat: any) {
  if (!stat) return '-'
  const cur = Number(stat?.当前 ?? stat?.current ?? 0)
  const max = Number(stat?.上限 ?? stat?.max ?? 0)
  if (!Number.isFinite(cur) || !Number.isFinite(max)) return '-'
  return `${cur}/${max}`
}

function statPercent(stat: any) {
  if (!stat) return 0
  const cur = Number(stat?.当前 ?? stat?.current ?? 0)
  const max = Number(stat?.上限 ?? stat?.max ?? 0)
  if (!Number.isFinite(cur) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(100, Math.max(0, Math.floor((cur / max) * 100)))
}

const fameText = computed(() => {
  const v = Number(status.value?.声望 ?? 0)
  if (!Number.isFinite(v)) return '籍籍无名'
  if (v >= 1000) return `名震八方（${v}）`
  if (v >= 200) return `小有名气（${v}）`
  if (v >= 50) return `略有耳闻（${v}）`
  return `籍籍无名（${v}）`
})

const talentList = computed(() => {
  const list = base.value?.天赋
  if (!Array.isArray(list)) return [] as string[]
  return list
    .map((x: any) => String(x?.名称 || x?.name || x))
    .filter(Boolean)
})

const talentTraits = computed(() => {
  const list = base.value?.天赋
  if (!Array.isArray(list)) return [] as Array<{ title: string; desc: string }>
  const out: Array<{ title: string; desc: string }> = []
  for (const raw of list) {
    if (!raw) continue
    if (typeof raw === 'string') {
      const t = raw.trim()
      if (t) out.push({ title: t, desc: '' })
      continue
    }
    if (typeof raw === 'object') {
      const title = String((raw as any).名称 || (raw as any).name || '').trim()
      const desc = String((raw as any).描述 || (raw as any).description || '').trim()
      if (title) out.push({ title, desc })
      continue
    }
    const t = String(raw).trim()
    if (t) out.push({ title: t, desc: '' })
  }
  return out
})

type SixRow = { key: string; value: number }

function getSix(obj: any): Record<string, number> {
  const out: Record<string, number> = {}
  if (!obj || typeof obj !== 'object') return out
  for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
    const n = Number(obj[k])
    out[k] = Number.isFinite(n) ? n : 0
  }
  return out
}

const innateMap = computed(() => getSix(base.value?.先天六司))
const acquiredMap = computed(() => getSix(base.value?.后天六司))

const innateSix = computed(() => Object.keys(innateMap.value).map(k => ({ key: k, value: innateMap.value[k] })) as SixRow[])
const acquiredSix = computed(() => Object.keys(acquiredMap.value).map(k => ({ key: k, value: acquiredMap.value[k] })) as SixRow[])

const finalSix = computed(() => {
  const rows: SixRow[] = []
  for (const k of ['根骨', '灵性', '悟性', '气运', '魅力', '心性']) {
    const v = (innateMap.value[k] || 0) + (acquiredMap.value[k] || 0)
    rows.push({ key: k, value: v })
  }
  return rows
})

function acquiredText(v: number) {
  if (!Number.isFinite(v)) return '0'
  if (v > 0) return `+${v}`
  return String(v)
}

const effects = computed(() => {
  const list = status.value?.状态效果
  if (!Array.isArray(list)) return [] as Array<{ title: string; desc: string }>
  return list
    .map((e: any) => {
      const title = String(e?.状态名称 || e?.name || '未知状态')
      const desc = String(e?.状态描述 || e?.description || '')
      return { title, desc }
    })
    .filter(x => x.title)
})

const backpack = computed<any>(() => (gameState as any).背包 || {})
const backpackItems = computed<Record<string, any>>(() => (backpack.value?.物品 && typeof backpack.value.物品 === 'object' ? backpack.value.物品 : {}) as any)
const backpackItemKinds = computed(() => Object.keys(backpackItems.value || {}).length)

const backpackEquipCount = computed(() => {
  let n = 0
  for (const v of Object.values(backpackItems.value || {})) {
    if (String((v as any)?.类型) === '装备') n += 1
  }
  return n
})

const backpackGongfaCount = computed(() => {
  let n = 0
  for (const v of Object.values(backpackItems.value || {})) {
    if (String((v as any)?.类型) === '功法') n += 1
  }
  return n
})

const lingShi = computed(() => {
  const raw = backpack.value?.灵石
  const safe = (k: string) => {
    const v = Number(raw?.[k] ?? 0)
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
  }
  return {
    下品: safe('下品'),
    中品: safe('中品'),
    上品: safe('上品'),
    极品: safe('极品')
  }
})

const cultivationRef = computed<any>(() => (gameState as any).修炼功法 || null)
const cultivationItem = computed<any>(() => {
  const id = String(cultivationRef.value?.物品ID || '')
  if (!id) return null
  return (backpackItems.value as any)?.[id] || null
})

const cultivationName = computed(() => {
  const n = String(cultivationRef.value?.名称 || '')
  if (n) return n
  const n2 = String(cultivationItem.value?.名称 || '')
  return n2 || '暂无功法'
})

function cultivationQuality(q: any): string {
  if (!q || typeof q !== 'object') return '-'
  const top = String((q as any).quality || (q as any).品质 || '')
  const grade = Number((q as any).grade)
  const g = Number.isFinite(grade) ? Math.max(0, Math.floor(grade)) : null
  const topText = top ? `${top}品` : '-'
  if (g === null) return topText
  return `${topText}${g}阶`
}

const cultivationQualityText = computed(() => cultivationQuality(cultivationItem.value?.品质))

const cultivationProgressText = computed(() => {
  const p = Number(cultivationItem.value?.修炼进度)
  if (!Number.isFinite(p)) return '-'
  return `${Math.max(0, Math.min(100, Math.floor(p)))}%`
})

const masteredSkillNames = computed(() => {
  const list = (gameState as any).掌握技能
  if (!Array.isArray(list)) return [] as string[]
  const out: string[] = []
  for (const s of list) {
    if (!s) continue
    if (typeof s === 'string') {
      const t = s.trim()
      if (t) out.push(t)
      continue
    }
    if (typeof s === 'object') {
      const t = String((s as any).技能名称 || (s as any).名称 || (s as any).name || '').trim()
      if (t) out.push(t)
      continue
    }
    const t = String(s).trim()
    if (t) out.push(t)
  }
  return out
})

const daoData = computed<any>(() => (gameState as any).三千大道 || (gameState as any).道途 || null)

function daoUnlockedCount(v: any): number {
  if (!v) return 0
  if (Array.isArray(v)) return v.length
  if (typeof v === 'object') {
    const c1 = Number((v as any).已解)
    if (Number.isFinite(c1)) return Math.max(0, Math.floor(c1))
    const arrKeys = ['已解大道', '已解锁大道', '已解锁', '大道列表', '道途列表']
    for (const k of arrKeys) {
      const arr = (v as any)[k]
      if (Array.isArray(arr)) return arr.length
    }
    const mapKeys = ['大道', '道途']
    for (const k of mapKeys) {
      const m = (v as any)[k]
      if (m && typeof m === 'object' && !Array.isArray(m)) return Object.keys(m).length
    }
  }
  return 0
}

const daoUnlockedText = computed(() => `已解 ${daoUnlockedCount(daoData.value)} 条大道`)

const relationships = computed<any>(() => (gameState as any).人物关系 || {})
const relationshipTotal = computed(() => Object.keys(relationships.value || {}).length)

const relationshipAvgFavorText = computed(() => {
  const rel = relationships.value
  if (!rel || typeof rel !== 'object') return '0%'
  const values: number[] = []

  for (const v of Object.values(rel)) {
    if (!v || typeof v !== 'object') continue
    const raw = (v as any).好感 ?? (v as any).好感度 ?? (v as any).好感值 ?? (v as any).关系值
    const n = Number(raw)
    if (!Number.isFinite(n)) continue
    if (n >= 0 && n <= 1) values.push(n * 100)
    else values.push(n)
  }

  if (values.length === 0) return '0%'
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const pct = Math.max(0, Math.min(100, Math.round(avg)))
  return `${pct}%`
})
</script>

<style scoped>
.embedded-shell {
  width: 100%;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.65);
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 18px;
}

.icon-btn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.75);
  color: #0f172a;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.dialog {
  width: min(1200px, 96vw);
  height: min(860px, 92vh);
  background: #f3f4f6;
  color: #0f172a;
  display: grid;
  grid-template-rows: 48px 1fr 58px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  overflow: hidden;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.35);
}

.dialog.embedded {
  width: 100%;
  height: auto;
  min-height: 0;
  max-height: none;
  grid-template-rows: auto;
  box-shadow: none;
  border: none;
  border-radius: 0;
  background: transparent;
}

.dialog-top {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}

.dialog-title {
  text-align: center;
  font-weight: 700;
}

.dialog-body {
  overflow: auto;
}

.dialog.embedded .dialog-body {
  overflow: visible;
}

.dialog-footer {
  padding: 10px 12px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.72);
  border-top: 1px solid rgba(15, 23, 42, 0.12);
}

.btn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(59, 130, 246, 0.12);
  color: #0f172a;
  border-radius: 12px;
  padding: 9px 14px;
  cursor: pointer;
}

.btn:hover {
  border-color: rgba(59, 130, 246, 0.35);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.6);
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.95), rgba(59, 130, 246, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
}

.badge {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

.meta-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.profile {
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.92));
  color: #fff;
  padding: 14px;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
}

.profile-main {
  min-width: 0;
}

.profile-name {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 6px;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.profile-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) 160px;
  gap: 10px;
}

@media (max-width: 980px) {
  .profile-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stat-tile {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 0;
}

.stat-icon {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.stat-k {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 6px;
}

.stat-v {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-tile.progress {
  display: grid;
  gap: 6px;
}

.progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.95);
}

.progress-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  text-align: right;
}

.page {
  padding: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.card-ico {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(59, 130, 246, 0.95);
}

.span-all {
  grid-column: 1 / -1;
}

.muted {
  color: rgba(15, 23, 42, 0.55);
  font-size: 13px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.bar-track {
  height: 8px;
  background: rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
}

.fill-hp {
  background: rgba(239, 68, 68, 0.9);
}

.fill-mp {
  background: rgba(59, 130, 246, 0.9);
}

.fill-sp {
  background: rgba(250, 204, 21, 0.9);
}

.fame {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.fame-k {
  color: rgba(234, 179, 8, 0.95);
  font-size: 13px;
}

.fame-v {
  font-size: 13px;
  font-weight: 700;
}

.kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.kv {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
}

.kv-full {
  grid-column: 1 / -1;
}

.k {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  margin-bottom: 6px;
}

.v {
  font-size: 13px;
  font-weight: 700;
}

.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.22);
  color: rgba(37, 99, 235, 0.95);
}

.block {
  margin-top: 10px;
}

.block-title {
  font-weight: 800;
  margin-bottom: 8px;
  font-size: 13px;
}

.box {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
}

.box-title {
  font-weight: 800;
  margin-bottom: 6px;
}

.box-desc {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.55);
  line-height: 1.5;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.02);
  font-size: 12px;
}

.sub-title {
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 13px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
}

.stat-item .k {
  margin-bottom: 6px;
}

.plus {
  color: rgba(34, 197, 94, 0.95);
}

.effects {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.effect-item {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
}

.effect-title {
  font-weight: 800;
  margin-bottom: 6px;
}

.effect-desc {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.55);
  line-height: 1.5;
}

.summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.summary-item {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
  text-align: center;
}

.summary-k {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  margin-bottom: 6px;
}

.summary-v {
  font-size: 18px;
  font-weight: 800;
  color: rgba(37, 99, 235, 0.95);
}

.stone-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 720px) {
  .stone-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stone {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
}

.linggen-card {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.02);
  cursor: pointer;
}

.linggen-card:hover {
  border-color: rgba(59, 130, 246, 0.35);
}

.linggen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.linggen-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}

.linggen-hint {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.linggen-title {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 10px;
}

.linggen-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.linggen-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-weight: 900;
  font-size: 14px;
}

.linggen-badge.grade {
  background: rgba(239, 68, 68, 0.95);
  border-color: rgba(239, 68, 68, 0.95);
  color: rgba(255, 255, 255, 0.98);
}

.linggen-badge.rate {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.22);
  color: rgba(37, 99, 235, 0.95);
}

.linggen-desc {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.6;
  margin-bottom: 10px;
}

.linggen-effects {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.linggen-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  background: rgba(59, 130, 246, 0.1);
  color: rgba(37, 99, 235, 0.95);
  font-size: 13px;
  font-weight: 800;
}

.lg-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.6);
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
}

.lg-modal {
  width: min(920px, 96vw);
  max-height: min(860px, 92vh);
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f3f4f6;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.35);
}

.lg-modal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(243, 244, 246, 0.92));
}

.lg-modal-title {
  font-size: 24px;
  font-weight: 900;
}

.lg-close {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(243, 244, 246, 0.95);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  color: rgba(15, 23, 42, 0.55);
}

.lg-modal-body {
  padding: 16px;
}

.lg-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

@media (max-width: 720px) {
  .lg-grid {
    grid-template-columns: 1fr;
  }
}

.lg-tile {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: rgba(243, 244, 246, 0.9);
  padding: 14px;
  text-align: center;
}

.lg-tile-k {
  font-size: 13px;
  font-weight: 900;
  color: rgba(15, 23, 42, 0.72);
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.lg-tile-ico {
  font-size: 18px;
  line-height: 1;
}

.lg-tile-v {
  font-size: 18px;
  font-weight: 900;
  color: rgba(37, 99, 235, 0.95);
}

.lg-sec {
  margin-top: 14px;
}

.lg-sec-title {
  font-size: 16px;
  font-weight: 900;
  color: rgba(37, 99, 235, 0.95);
  margin-bottom: 10px;
}

.lg-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.lg-chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.1);
  color: rgba(22, 163, 74, 0.95);
  font-size: 13px;
  font-weight: 800;
}

.lg-muted {
  color: rgba(15, 23, 42, 0.55);
  font-size: 13px;
}

.lg-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lg-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  padding: 12px 14px;
}

.lg-row-k {
  color: rgba(15, 23, 42, 0.65);
  font-size: 13px;
  font-weight: 800;
}

.lg-row-v {
  color: rgba(15, 23, 42, 0.85);
  font-size: 13px;
  font-weight: 900;
}

</style>
