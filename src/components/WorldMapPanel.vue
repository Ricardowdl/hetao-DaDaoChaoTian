<template>
  <div class="map-root">
    <div class="map-main">
      <div ref="mapWrapperRef" class="map-area" :class="{ panning: isPanning }">
        <div class="map-title">
          <div class="world-name">{{ worldName }}</div>
          <div class="world-desc">{{ worldBackground }}</div>
        </div>

        <div ref="canvasRef" class="map-canvas" :class="{ fullscreen: isFullscreen }">
          <div ref="stageRef" class="world-stage" :style="stageStyle">
            <div ref="worldRef" class="world" :style="worldStyle">
              <div v-for="c in mappedContinents" :key="c.key" class="continent" :style="c.style" @click.stop="onContinentClick($event, c)">
                <div class="continent-label">{{ c.name }}</div>
              </div>

              <div v-for="loc in mappedLocations" :key="loc.key" class="marker" :style="loc.style" @click.stop="onLocationClick($event, loc)">
                <div class="marker-inner" :style="{ transform: `scale(${markerContentScale})` }">
                  <span class="marker-shape" :style="{ color: loc.legend.color }">{{ loc.legend.icon }}</span>
                  <span class="marker-label">{{ loc.name }}</span>
                </div>
              </div>

              <div v-if="playerMarker" ref="playerRef" class="player" :style="playerStyle">
                <span class="player-dot">⦿</span>
              </div>
            </div>
          </div>

          <div v-if="selectedLocation" ref="locationPopupRef" class="popup" :style="locationPopupStyle">
            <div class="popup-header">
              <div class="popup-title">{{ selectedLocation.name }}</div>
              <button class="popup-close" type="button" @click="closePopup">✕</button>
            </div>
            <div class="popup-content">
              <div class="popup-row">
                <span class="muted">类型：</span>
                <span>{{ selectedLocation.typeLabel }}</span>
              </div>
              <div class="popup-row">
                <span class="muted">坐标：</span>
                <span>{{ selectedLocation.x }}, {{ selectedLocation.y }}</span>
              </div>
              <div class="popup-desc">{{ selectedLocation.desc }}</div>
              <div v-if="selectedLocation.extras.length" class="popup-extras">
                <div v-for="(x, idx) in selectedLocation.extras" :key="idx" class="pill">{{ x }}</div>
              </div>
            </div>
          </div>

          <div v-if="selectedContinent" ref="continentPopupRef" class="popup" :style="continentPopupStyle">
            <div class="popup-header">
              <div class="popup-title">{{ selectedContinent.name }}</div>
              <button class="popup-close" type="button" @click="closePopup">✕</button>
            </div>
            <div class="popup-content">
              <div class="popup-row">
                <span class="muted">类型：</span>
                <span>大陆</span>
              </div>
              <div class="popup-desc">{{ selectedContinent.desc }}</div>
              <div v-if="selectedContinent.extras.length" class="popup-extras">
                <div v-for="(x, idx) in selectedContinent.extras" :key="idx" class="pill">{{ x }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="map-controls">
          <button class="control-btn" type="button" @click="locatePlayer" title="定位到当前位置">🎯</button>
          <button class="control-btn" type="button" @click="toggleFullscreen" title="全屏切换">⛶</button>
          <button class="control-btn" type="button" @click="reloadMarkers" title="重新加载地图">⟳</button>
          <button class="control-status" type="button" disabled>{{ statusText }}</button>
        </div>

        <div class="legend" :class="{ collapsed: !legendOpen }">
          <button class="legend-toggle" type="button" @pointerdown.stop @click.stop="legendOpen = !legendOpen">
            {{ legendOpen ? '收起图例' : '展开图例' }}
          </button>
          <div v-show="legendOpen" class="legend-body">
            <div class="legend-list">
              <div v-for="x in legendList" :key="x.key" class="legend-item">
                <span class="legend-icon" :style="{ color: x.color }">{{ x.icon }}</span>
                <span class="legend-text">{{ x.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!worldInfo" class="world-missing">
          <div class="muted">暂无世界信息（可能还未生成世界）</div>
          <div class="actions" style="justify-content: center">
            <button class="btn" type="button" @click="emitAction('生成世界信息并写入存档：字段为 世界信息（世界名称/世界背景/世界纪元/大陆信息/势力信息/地点信息），地点信息需含 coordinates.x/y')">生成世界(AI)</button>
          </div>
        </div>
      </div>

      <div class="side" style="display: none">
        <div class="card">
          <div class="card-title">当前位置</div>
          <div class="kv"><span class="k">描述</span><span class="v">{{ playerDesc }}</span></div>
          <div class="kv"><span class="k">坐标</span><span class="v">{{ playerX }}, {{ playerY }}</span></div>
          <div class="actions" style="justify-content: flex-start">
            <button class="btn btn-ghost" type="button" @click="emitAction('根据当前世界地图与当前位置，给出可探索的3条路线与风险提示')">路线建议(AI)</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">地点列表</div>
          <input class="input" type="text" v-model.trim="search" placeholder="搜索地点..." />
          <div v-if="filteredLocations.length === 0" class="muted" style="margin-top: 8px">暂无匹配地点</div>
          <div v-for="loc in filteredLocations" :key="loc.key" class="list-item" @click="selectFromList(loc)">
            <div class="li-main">
              <div class="li-title">
                <span class="dot" :style="{ background: loc.legend.color }" />
                <span>{{ loc.name }}</span>
              </div>
              <div class="li-sub">{{ loc.typeLabel }} · {{ loc.x }}, {{ loc.y }}</div>
            </div>
            <button class="btn btn-ghost" type="button" @click.stop="travelTo(loc)">前往</button>
          </div>
        </div>

        <div class="muted" v-if="noticeText" style="margin-top: 8px">{{ noticeText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useGameStateStore } from '../stores/useGameStateStore'
import type { TavernCommand } from '../services/tavernCommands'

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
}>()

const gameState = useGameStateStore()

const worldInfo = computed<any>(() => (gameState as any).世界信息 || null)

const worldName = computed(() => String(worldInfo.value?.世界名称 || worldInfo.value?.name || '修仙界'))
const worldBackground = computed(() => String(worldInfo.value?.世界背景 || worldInfo.value?.description || ''))

const statusText = ref('地图加载完成')
const noticeText = ref('')

const WORLD_COORD_MAX = 10000
const WORLD_PX = 1600

const MIN_SCALE = 0.6
const MAX_SCALE = 2.6
const ZOOM_SENSITIVITY = 0.001

const mapWrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const worldRef = ref<HTMLElement | null>(null)
const playerRef = ref<HTMLElement | null>(null)

const isFullscreen = ref(false)

const scale = ref(1)

const isPanning = ref(false)
const panPointerId = ref<number | null>(null)
const panStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

const panOffset = ref({ x: 0, y: 0 })

const legendOpen = ref(false)

const stageStyle = computed(() => ({
  width: `${WORLD_PX * scale.value}px`,
  height: `${WORLD_PX * scale.value}px`,
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px)`
}))

const markerContentScale = computed(() => {
  const s = Number(scale.value) || 1
  return 1 / Math.max(0.25, s)
})

const worldStyle = computed(() => ({
  width: `${WORLD_PX}px`,
  height: `${WORLD_PX}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: '0 0'
}))

const playerPos = computed<any>(() => {
  const s: any = (gameState as any).玩家角色状态 || null
  return s?.位置 ?? s?.当前位置 ?? (gameState as any).当前位置 ?? null
})

const playerDesc = computed(() => String(playerPos.value?.描述 || playerPos.value?.description || '-'))

function extractPlaceName(desc: string): string {
  const t = String(desc || '').trim()
  if (!t) return ''
  const parts = t.split(/[·・]/g).map(x => x.trim()).filter(Boolean)
  if (parts.length) return parts[parts.length - 1]
  return t
}

const playerMarker = computed<null | { x: number; y: number }>(() => {
  const pos = playerPos.value
  if (pos && typeof pos === 'object') {
    const picked = pickWorldCoordinates(pos, -1)
    const scaled = applyAxisScale(Number(picked?.x), Number(picked?.y))
    const x0 = Number(scaled?.x)
    const y0 = Number(scaled?.y)
    if (Number.isFinite(x0) && Number.isFinite(y0)) {
      const s = locationCoordScale.value
      return { x: normalizeCoord(x0, s), y: normalizeCoord(y0, s) }
    }
  }

  const placeName = extractPlaceName(String(pos?.描述 || pos?.description || ''))
  if (!placeName) return null
  const loc = mappedLocations.value.find(l => l && (l.name === placeName || l.name.includes(placeName) || placeName.includes(l.name)))
  if (!loc) return null
  const x = Number(loc.x)
  const y = Number(loc.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
})

const playerX = computed(() => {
  const v = playerMarker.value?.x
  return Number.isFinite(v) ? Math.round(Number(v)) : 0
})

const playerY = computed(() => {
  const v = playerMarker.value?.y
  return Number.isFinite(v) ? Math.round(Number(v)) : 0
})

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function clampWorldCoord(n: number) {
  return clamp(n, 0, WORLD_COORD_MAX)
}

function asFiniteNumber(n: any): number | null {
  const v = Number(n)
  return Number.isFinite(v) ? v : null
}

function pickWorldCoordinates(raw: any, idx: number): { x: number; y: number } {
  const direct = raw?.coordinates
  const pos = raw?.位置
  const alt = raw?.坐标 || raw?.coord

  const x1 = asFiniteNumber(direct?.x)
  const y1 = asFiniteNumber(direct?.y)
  if (x1 != null && y1 != null) return { x: clampWorldCoord(x1), y: clampWorldCoord(y1) }

  const x2 = asFiniteNumber(pos?.x)
  const y2 = asFiniteNumber(pos?.y)
  if (x2 != null && y2 != null) return { x: clampWorldCoord(x2), y: clampWorldCoord(y2) }

  const x3 = asFiniteNumber(raw?.x ?? alt?.x)
  const y3 = asFiniteNumber(raw?.y ?? alt?.y)
  if (x3 != null && y3 != null) return { x: clampWorldCoord(x3), y: clampWorldCoord(y3) }

  const cx = 5000
  const cy = 5000
  const radius = 4000
  const angle = Math.random() * Math.PI * 2
  const r = Math.random() * radius
  const x = clampWorldCoord(cx + Math.cos(angle) * r)
  const y = clampWorldCoord(cy + Math.sin(angle) * r)

  void idx
  return { x, y }
}

const coordAxisScale = computed(() => {
  const wi = worldInfo.value
  const locations = Array.isArray(wi?.地点信息) ? wi.地点信息 : []
  const continents = Array.isArray(wi?.大陆信息) ? wi.大陆信息 : []

  let maxX = 0
  let maxY = 0

  for (const raw of locations as any[]) {
    const c = pickWorldCoordinates(raw, -1)
    if (Number.isFinite(c.x)) maxX = Math.max(maxX, c.x)
    if (Number.isFinite(c.y)) maxY = Math.max(maxY, c.y)
  }

  for (const raw of continents as any[]) {
    const b = getContinentBounds(raw)
    if (!b) continue
    if (Number.isFinite(b.minX)) maxX = Math.max(maxX, b.minX)
    if (Number.isFinite(b.maxX)) maxX = Math.max(maxX, b.maxX)
    if (Number.isFinite(b.minY)) maxY = Math.max(maxY, b.minY)
    if (Number.isFinite(b.maxY)) maxY = Math.max(maxY, b.maxY)
  }

  const sx = maxX >= WORLD_COORD_MAX * 0.85 || maxX <= 0 ? 1 : clamp(WORLD_COORD_MAX / maxX, 1, 20)
  const sy = maxY >= WORLD_COORD_MAX * 0.85 || maxY <= 0 ? 1 : clamp(WORLD_COORD_MAX / maxY, 1, 20)

  return { sx, sy, maxX, maxY }
})

function applyAxisScale(x: number, y: number) {
  const sx = coordAxisScale.value.sx
  const sy = coordAxisScale.value.sy
  return {
    x: clampWorldCoord(x * sx),
    y: clampWorldCoord(y * sy)
  }
}

function getContinentBounds(raw: any): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const b = raw?.bounds
  const bx = [Number(b?.minX), Number(b?.minY), Number(b?.maxX), Number(b?.maxY)]
  const hasBounds = bx.every((n) => Number.isFinite(n))

  const pts: any[] = Array.isArray(raw?.大洲边界) ? raw.大洲边界 : Array.isArray(raw?.continent_bounds) ? raw.continent_bounds : []
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const p of pts) {
    const x = Number(p?.x)
    const y = Number(p?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const hasPts = Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)

  if (!hasBounds && !hasPts) return null
  if (hasBounds && !hasPts) return { minX: bx[0], minY: bx[1], maxX: bx[2], maxY: bx[3] }
  if (!hasBounds && hasPts) return { minX, minY, maxX, maxY }

  const boundsMax = Math.max(bx[0], bx[1], bx[2], bx[3])
  const ptsMax = Math.max(maxX, maxY)
  if (ptsMax > boundsMax * 1.2) return { minX, minY, maxX, maxY }
  return { minX: bx[0], minY: bx[1], maxX: bx[2], maxY: bx[3] }
}

const continentCoordScale = computed(() => 1)

const locationCoordScale = computed(() => 1)

function normalizeCoord(n: any, _s: number) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return v
}

function worldToPx(v: number) {
  return (clamp(v, 0, WORLD_COORD_MAX) / WORLD_COORD_MAX) * WORLD_PX
}

const playerStyle = computed(() => {
  const m = playerMarker.value
  if (!m) return {}
  const x = worldToPx(m.x)
  const y = worldToPx(m.y)
  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

type LegendItem = { key: string; icon: string; color: string; text: string }

const legendMap: Record<string, LegendItem> = {
  natural_landmark: { key: 'natural_landmark', icon: '▲', color: '#16a34a', text: '名山大川' },
  sect_power: { key: 'sect_power', icon: '■', color: '#2563eb', text: '宗门势力' },
  city_town: { key: 'city_town', icon: '●', color: '#f59e0b', text: '城镇坊市' },
  blessed_land: { key: 'blessed_land', icon: '★', color: '#7c3aed', text: '洞天福地' },
  treasure_land: { key: 'treasure_land', icon: '◆', color: '#22c55e', text: '奇珍异地' },
  dangerous_area: { key: 'dangerous_area', icon: '⚠', color: '#dc2626', text: '凶险之地' },
  special_other: { key: 'special_other', icon: '⚡', color: '#64748b', text: '其他特殊' }
}

const legendList = computed(() => Object.values(legendMap))

type ContinentVM = {
  key: string
  raw: any
  idx: number
  name: string
  desc: string
  extras: string[]
  style: Record<string, string>
}

const mappedContinents = computed<ContinentVM[]>(() => {
  const list = Array.isArray(worldInfo.value?.大陆信息)
    ? worldInfo.value.大陆信息
    : Array.isArray(worldInfo.value?.地图?.continents)
      ? worldInfo.value.地图.continents
      : []

  return list
    .map((raw: any, idx: number) => {
      const name = String(raw?.名称 || raw?.name || `大陆${idx + 1}`)
      const desc = String(raw?.描述 || raw?.description || raw?.简介 || '')
      const extras: string[] = []
      const tags = raw?.标签 || raw?.tags
      if (Array.isArray(tags)) extras.push(...tags.map((x: any) => String(x)).filter(Boolean).slice(0, 4))
      const b = getContinentBounds(raw)
      const bMin = applyAxisScale(Number(b?.minX ?? 0), Number(b?.minY ?? 0))
      const bMax = applyAxisScale(Number(b?.maxX ?? 0), Number(b?.maxY ?? 0))
      const minX = clampWorldCoord(normalizeCoord(bMin.x, continentCoordScale.value))
      const minY = clampWorldCoord(normalizeCoord(bMin.y, continentCoordScale.value))
      const maxX = clampWorldCoord(normalizeCoord(bMax.x, continentCoordScale.value))
      const maxY = clampWorldCoord(normalizeCoord(bMax.y, continentCoordScale.value))
      const left = worldToPx(minX)
      const top = worldToPx(minY)
      const width = Math.max(0, worldToPx(maxX) - left)
      const height = Math.max(0, worldToPx(maxY) - top)

      return {
        key: `${idx}-${name}`,
        raw,
        idx,
        name,
        desc,
        extras,
        style: {
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`
        }
      } as ContinentVM
    })
    .filter((x) => x.name)
})

function typeToLegendKey(typeText: string) {
  const t = String(typeText || '').toLowerCase()
  if (!t) return 'special_other'
  if (t.includes('natural') || t.includes('山') || t.includes('川') || t.includes('峰') || t.includes('谷')) return 'natural_landmark'
  if (t.includes('sect') || t.includes('宗门') || t.includes('门派') || t.includes('驻地')) return 'sect_power'
  if (t.includes('town') || t.includes('city') || t.includes('城') || t.includes('镇') || t.includes('坊市')) return 'city_town'
  if (t.includes('blessed') || t.includes('福地') || t.includes('灵脉')) return 'blessed_land'
  if (t.includes('treasure') || t.includes('宝') || t.includes('遗迹')) return 'treasure_land'
  if (t.includes('danger') || t.includes('险') || t.includes('凶') || t.includes('禁地')) return 'dangerous_area'
  return 'special_other'
}

type LocationVM = {
  key: string
  raw: any
  idx: number
  name: string
  type: string
  typeLabel: string
  desc: string
  x: number
  y: number
  discovered: boolean
  extras: string[]
  legend: LegendItem
  style: Record<string, string>
}

const mappedLocations = computed<LocationVM[]>(() => {
  const list = worldInfo.value?.地点信息
  if (!Array.isArray(list)) return []

  return list
    .map((raw: any, idx: number) => {
      const name = String(raw?.name || raw?.名称 || `地点${idx + 1}`)
      const type = String(raw?.type || raw?.类型 || '')
      const desc = String(raw?.description || raw?.描述 || '')
      const coords = pickWorldCoordinates(raw, idx)
      const scaled = applyAxisScale(Number(coords?.x), Number(coords?.y))
      const x = normalizeCoord(scaled.x, locationCoordScale.value)
      const y = normalizeCoord(scaled.y, locationCoordScale.value)
      const discovered = !!(raw?.discovered ?? raw?.已发现 ?? false)

      const extras: string[] = []
      const feat = raw?.特色
      if (Array.isArray(feat)) extras.push(...feat.map((v: any) => String(v)).filter(Boolean).slice(0, 4))
      const danger = raw?.danger_level || raw?.安全等级
      if (danger) extras.push(String(danger))

      const legendKey = typeToLegendKey(type)
      const legend = legendMap[legendKey] || legendMap.special_other

      const px = worldToPx(x)
      const py = worldToPx(y)

      return {
        key: `${idx}-${name}`,
        raw,
        idx,
        name,
        type,
        typeLabel: legend.text,
        desc,
        x: Math.round(x),
        y: Math.round(y),
        discovered,
        extras,
        legend,
        style: {
          left: `${px}px`,
          top: `${py}px`,
          opacity: discovered ? '1' : '0.75'
        }
      } as LocationVM
    })
    .filter(x => x.name)
})

const search = ref('')

const filteredLocations = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return mappedLocations.value
  return mappedLocations.value.filter(x => x.name.toLowerCase().includes(q) || x.type.toLowerCase().includes(q) || x.desc.toLowerCase().includes(q))
})

const selectedLocation = ref<null | {
  idx: number
  name: string
  typeLabel: string
  desc: string
  x: number
  y: number
  discovered: boolean
  extras: string[]
}>(null)

const selectedContinent = ref<null | {
  idx: number
  name: string
  desc: string
  extras: string[]
}>(null)

const popupAnchorWorld = ref({ x: 0, y: 0 })

const locationPopupRef = ref<HTMLElement | null>(null)
const continentPopupRef = ref<HTMLElement | null>(null)

const locationPopupSize = ref({ w: 320, h: 220 })
const continentPopupSize = ref({ w: 320, h: 220 })

function worldToScreenPx(p: { x: number; y: number }) {
  const wrap = mapWrapperRef.value
  const canvas = canvasRef.value
  const stage = stageRef.value
  if (!wrap || !canvas) return { x: 0, y: 0 }

  const s = scale.value || 1
  const stageLeft = stage ? stage.offsetLeft : 0
  const stageTop = stage ? stage.offsetTop : 0
  return {
    x: stageLeft + panOffset.value.x + p.x * s,
    y: stageTop + panOffset.value.y + p.y * s
  }
}

function clampPopup(screen: { x: number; y: number }, size: { w: number; h: number }) {
  const canvas = canvasRef.value
  if (!canvas) return { left: '0px', top: '0px' }

  const margin = 14
  const w = Math.max(200, Math.floor(size.w || 320))
  const h = Math.max(120, Math.floor(size.h || 220))

  const viewW = canvas.clientWidth
  const viewH = canvas.clientHeight

  let left = screen.x - w / 2
  let top = screen.y - h - 16

  if (top < margin) top = screen.y + 16

  left = clamp(left, margin, Math.max(margin, viewW - w - margin))
  top = clamp(top, margin, Math.max(margin, viewH - h - margin))

  return { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
}

const locationPopupStyle = computed(() => {
  const canvas = canvasRef.value
  if (!canvas || !selectedLocation.value) return {}
  const screen = worldToScreenPx(popupAnchorWorld.value)
  return clampPopup(screen, locationPopupSize.value)
})

const continentPopupStyle = computed(() => {
  const canvas = canvasRef.value
  if (!canvas || !selectedContinent.value) return {}
  const screen = worldToScreenPx(popupAnchorWorld.value)
  return clampPopup(screen, continentPopupSize.value)
})

function closePopup() {
  selectedLocation.value = null
  selectedContinent.value = null
}

function onLocationClick(e: MouseEvent, loc: LocationVM) {
  selectedContinent.value = null
  popupAnchorWorld.value = {
    x: worldToPx(loc.x),
    y: worldToPx(loc.y)
  }

  selectedLocation.value = {
    idx: loc.idx,
    name: loc.name,
    typeLabel: loc.typeLabel,
    desc: loc.desc,
    x: loc.x,
    y: loc.y,
    discovered: loc.discovered,
    extras: loc.extras
  }

  nextTick(() => {
    const el = locationPopupRef.value
    if (!el) return
    locationPopupSize.value = { w: el.offsetWidth || 320, h: el.offsetHeight || 220 }
  })
}

function onContinentClick(e: MouseEvent, c: ContinentVM) {
  selectedLocation.value = null
  const left = Number(String(c.style.left || '0').replace('px', '')) || 0
  const top = Number(String(c.style.top || '0').replace('px', '')) || 0
  const w = Number(String(c.style.width || '0').replace('px', '')) || 0
  const h = Number(String(c.style.height || '0').replace('px', '')) || 0
  popupAnchorWorld.value = { x: left + w / 2, y: top + h / 2 }

  selectedContinent.value = {
    idx: c.idx,
    name: c.name,
    desc: c.desc || '暂无简介',
    extras: c.extras
  }

  nextTick(() => {
    const el = continentPopupRef.value
    if (!el) return
    continentPopupSize.value = { w: el.offsetWidth || 320, h: el.offsetHeight || 220 }
  })
}

function selectFromList(loc: LocationVM) {
  const wrap = mapWrapperRef.value
  const world = worldRef.value
  if (!wrap || !world) return

  popupAnchorWorld.value = {
    x: worldToPx(loc.x),
    y: worldToPx(loc.y)
  }

  selectedLocation.value = {
    idx: loc.idx,
    name: loc.name,
    typeLabel: loc.typeLabel,
    desc: loc.desc,
    x: loc.x,
    y: loc.y,
    discovered: loc.discovered,
    extras: loc.extras
  }

  centerToCoord(loc.x, loc.y)
}

function emitAction(text: string) {
  emit('fill-action', text)
}

function ensureWorldInfoExists(): TavernCommand[] {
  const w = (gameState as any).世界信息
  if (w && typeof w === 'object') return []
  return [{ action: 'set', key: '世界信息', value: { 世界名称: worldName.value, 世界背景: '', 世界纪元: '', 大陆信息: [], 势力信息: [], 地点信息: [], 生成时间: new Date().toISOString(), 版本: '0.2' } }]
}

function travelToSelected() {
  if (!selectedLocation.value) return
  travelToByFields(selectedLocation.value.name, selectedLocation.value.x, selectedLocation.value.y)
}

function travelTo(loc: LocationVM) {
  travelToByFields(loc.name, loc.x, loc.y)
}

function travelToByFields(name: string, x: number, y: number) {
  const desc = `${worldName.value}·${name}`
  const cmds: TavernCommand[] = []
  cmds.push({ action: 'set', key: '玩家角色状态.位置.描述', value: desc })
  cmds.push({ action: 'set', key: '玩家角色状态.位置.x', value: Math.round(x) })
  cmds.push({ action: 'set', key: '玩家角色状态.位置.y', value: Math.round(y) })
  gameState.applyCommands(cmds)
  noticeText.value = `已前往：${desc}`
  centerToCoord(x, y)
}

function toggleDiscoverSelected() {
  if (!selectedLocation.value) return
  const idx = selectedLocation.value.idx
  const list = worldInfo.value?.地点信息
  if (!Array.isArray(list) || idx < 0 || idx >= list.length) return

  const prev = !!(list[idx]?.discovered ?? list[idx]?.已发现 ?? false)
  const next = !prev

  const cmds: TavernCommand[] = [...ensureWorldInfoExists()]
  cmds.push({ action: 'set', key: `世界信息.地点信息[${idx}].discovered`, value: next })
  cmds.push({ action: 'set', key: `世界信息.地点信息[${idx}].已发现`, value: next })
  gameState.applyCommands(cmds)

  selectedLocation.value.discovered = next
  noticeText.value = next ? '已标记为已发现' : '已取消标记'
}

async function copySelected() {
  if (!selectedLocation.value) return
  const text = `${selectedLocation.value.name} | ${selectedLocation.value.typeLabel} | ${selectedLocation.value.x},${selectedLocation.value.y}`

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      noticeText.value = '已复制'
      return
    }
  } catch {
    void 0
  }

  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    noticeText.value = '已复制'
  } finally {
    document.body.removeChild(ta)
  }
}

async function copyContinent() {
  if (!selectedContinent.value) return
  const text = `${selectedContinent.value.name} | 大陆 | ${selectedContinent.value.desc}`

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      noticeText.value = '已复制'
      return
    }
  } catch {
    void 0
  }

  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    noticeText.value = '已复制'
  } finally {
    document.body.removeChild(ta)
  }
}

function centerToCoord(x: number, y: number) {
  const wrap = mapWrapperRef.value
  const stage = stageRef.value
  if (!wrap) return

  const s = scale.value || 1
  const stageLeft = stage ? stage.offsetLeft : 0
  const stageTop = stage ? stage.offsetTop : 0

  const px = worldToPx(x) * s
  const py = worldToPx(y) * s

  const next = clampPan({
    x: wrap.clientWidth / 2 - stageLeft - px,
    y: wrap.clientHeight / 2 - stageTop - py
  })
  panOffset.value = next
}

function clampPan(p: { x: number; y: number }) {
  const wrap = mapWrapperRef.value
  const stage = stageRef.value
  if (!wrap || !stage) return p

  const s = scale.value || 1
  const stageLeft = stage.offsetLeft
  const stageTop = stage.offsetTop
  const stageW = WORLD_PX * s
  const stageH = WORLD_PX * s
  const viewW = wrap.clientWidth
  const viewH = wrap.clientHeight

  const minX = viewW - stageW - stageLeft
  const maxX = -stageLeft
  const minY = viewH - stageH - stageTop
  const maxY = -stageTop

  let x = p.x
  let y = p.y

  if (minX > maxX) x = (minX + maxX) / 2
  else x = clamp(x, minX, maxX)

  if (minY > maxY) y = (minY + maxY) / 2
  else y = clamp(y, minY, maxY)

  return { x, y }
}

function handleWheelZoom(e: WheelEvent) {
  const wrap = mapWrapperRef.value
  const stage = stageRef.value
  if (!wrap || !stage) return

  // 仅在地图区域缩放
  e.preventDefault()

  const rect = wrap.getBoundingClientRect()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top

  const stageLeft = stage.offsetLeft
  const stageTop = stage.offsetTop
  const s0 = scale.value || 1

  const xInStage = px - stageLeft - panOffset.value.x
  const yInStage = py - stageTop - panOffset.value.y
  const worldX = xInStage / s0
  const worldY = yInStage / s0

  const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
  const s1 = clamp(s0 * factor, MIN_SCALE, MAX_SCALE)
  if (s1 === s0) return
  scale.value = s1

  nextTick(() => {
    const nextXInStage = worldX * s1
    const nextYInStage = worldY * s1

    const next = clampPan({
      x: px - stageLeft - nextXInStage,
      y: py - stageTop - nextYInStage
    })
    panOffset.value = next
  })
}

function shouldIgnorePanTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t || typeof (t as any).closest !== 'function') return false
  return !!t.closest('.marker, .popup, .map-controls, .legend, .map-title, button, a, input, textarea, select')
}

function handlePointerDown(e: PointerEvent) {
  const wrap = mapWrapperRef.value
  if (!wrap) return
  if (e.button !== 0) return
  if (shouldIgnorePanTarget(e.target)) return

  isPanning.value = true
  panPointerId.value = e.pointerId
  panStart.value = { x: e.clientX, y: e.clientY, panX: panOffset.value.x, panY: panOffset.value.y }
  wrap.setPointerCapture?.(e.pointerId)
  e.preventDefault()
}

function handlePointerMove(e: PointerEvent) {
  const wrap = mapWrapperRef.value
  if (!wrap) return
  if (!isPanning.value) return
  if (panPointerId.value !== null && e.pointerId !== panPointerId.value) return

  const dx = e.clientX - panStart.value.x
  const dy = e.clientY - panStart.value.y

  panOffset.value = clampPan({ x: panStart.value.panX + dx, y: panStart.value.panY + dy })
  e.preventDefault()
}

function endPan(e?: PointerEvent) {
  const wrap = mapWrapperRef.value
  if (wrap && panPointerId.value !== null) {
    try {
      wrap.releasePointerCapture?.(panPointerId.value)
    } catch {
      void 0
    }
  }
  if (e && panPointerId.value !== null && e.pointerId !== panPointerId.value) return
  isPanning.value = false
  panPointerId.value = null
}

function locatePlayer() {
  const m = playerMarker.value
  if (!m) {
    noticeText.value = '无法定位玩家位置：缺少坐标'
    return
  }
  centerToCoord(m.x, m.y)
  noticeText.value = '已定位到当前位置'
}

function reloadMarkers() {
  statusText.value = '地图重新加载完成'
  noticeText.value = '已重新加载地图标记'
}

function toggleFullscreen() {
  const el = mapWrapperRef.value
  if (!el) return

  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    el.requestFullscreen()
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

watch(
  () => (gameState as any).玩家角色状态?.位置,
  () => {
    closePopup()
  },
  { deep: true }
)

watch(
  worldInfo,
  () => {
    closePopup()
    statusText.value = worldInfo.value ? `已加载 ${mappedLocations.value.length} 个地点` : '未找到世界数据'
  },
  { immediate: true }
)

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  await nextTick()
  statusText.value = worldInfo.value ? `已加载 ${mappedLocations.value.length} 个地点` : '未找到世界数据'

  const wrap = mapWrapperRef.value
  if (wrap) {
    wrap.addEventListener('wheel', handleWheelZoom, { passive: false })
    wrap.addEventListener('pointerdown', handlePointerDown)
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', endPan)
  window.addEventListener('pointercancel', endPan)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  const wrap = mapWrapperRef.value
  if (wrap) {
    wrap.removeEventListener('wheel', handleWheelZoom as any)
    wrap.removeEventListener('pointerdown', handlePointerDown as any)
  }

  window.removeEventListener('pointermove', handlePointerMove as any)
  window.removeEventListener('pointerup', endPan as any)
  window.removeEventListener('pointercancel', endPan as any)
})
</script>

<style scoped>
.map-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.map-main {
  display: grid;
  grid-template-columns: minmax(340px, 1fr) 360px;
  gap: 12px;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.map-area {
  position: relative;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
  touch-action: none;
  height: 100%;
  min-height: 0;
  cursor: grab;
}

.map-area.panning {
  cursor: grabbing;
  user-select: none;
}

.map-title {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 12px;
  background: rgba(2, 6, 23, 0.65);
  border-bottom: 1px solid var(--panel-border);
}

.world-name {
  font-size: 18px;
  font-weight: 700;
  color: rgba(96, 165, 250, 0.95);
}

.world-desc {
  margin-top: 4px;
  color: rgba(148, 163, 184, 0.95);
  font-size: 12px;
  line-height: 1.5;
}

.map-canvas {
  position: relative;
  padding: 14px;
}

.world {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background-color: rgba(248, 250, 252, 0.9);
  background-image: linear-gradient(rgba(2, 6, 23, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(2, 6, 23, 0.08) 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
  will-change: transform;
}

.world-stage {
  position: relative;
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  user-select: none;
}

 .marker-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform-origin: center;
 }

 .marker-label {
  pointer-events: none;
  font-size: 12px;
  line-height: 1.2;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.88);
  color: rgba(15, 23, 42, 0.82);
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 2px rgba(2, 6, 23, 0.18);
 }

 .continent {
  position: absolute;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.continent-label {
  font-weight: 800;
  font-size: 44px;
  color: rgba(37, 99, 235, 0.22);
  letter-spacing: 6px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
 }

.marker-shape {
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.player {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.player-dot {
  color: rgba(239, 68, 68, 0.95);
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.map-controls {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
}

.map-status-mini {
  width: 40px;
  height: 80px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.mini {
  font-size: 11px;
  color: rgba(51, 65, 85, 0.95);
  text-align: center;
  transform: rotate(-90deg);
  white-space: nowrap;
}

.legend {
  position: absolute;
  right: 14px;
  top: auto;
  bottom: 14px;
  transform: none;
  z-index: 20;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 10px;
  width: 240px;
  max-height: min(420px, calc(100% - 28px));
  overflow: hidden;
}

.legend-toggle {
  width: 100%;
  text-align: left;
  font-weight: 700;
  color: rgba(37, 99, 235, 0.95);
  background: transparent;
  border: none;
  cursor: pointer;
}

.legend-body {
  border-top: 1px solid rgba(59, 130, 246, 0.25);
  margin-top: 8px;
  padding-top: 10px;
  max-height: calc(100% - 32px);
  overflow: auto;
}

.legend.collapsed {
  width: auto;
  padding: 8px 10px;
}

.legend.collapsed .legend-toggle {
  width: auto;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-icon {
  width: 18px;
  display: inline-flex;
  justify-content: center;
}

.legend-text {
  color: rgba(51, 65, 85, 0.95);
}

.popup {
  position: absolute;
  transform: none;
  z-index: 20;
  width: 320px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 12px;
  color: var(--text-1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.popup-title {
  font-weight: 700;
}

.popup-close {
  border: none;
  background: transparent;
  color: var(--text-1);
  cursor: pointer;
}

.popup-content {
  padding: 10px 12px;
  max-height: min(360px, calc(100vh - 240px));
  overflow: auto;
}

.popup-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}

.popup-desc {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 8px;
}

.popup-extras {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.pill {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: var(--surface-3);
  color: var(--text-1);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}

.popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 10px;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 6px 0;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-1);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.btn {
  border: 1px solid var(--panel-border);
  background: rgba(59, 130, 246, 0.85);
  color: white;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn.btn-ghost {
  background: transparent;
  color: var(--text-1);
}

.input {
  width: 100%;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 8px 10px;
}

.list-item {
  margin-top: 10px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.li-title {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.li-sub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

.muted {
  color: var(--text-muted);
}

.world-missing {
  padding: 30px 14px;
}

 .map-main {
  grid-template-columns: 1fr;
 }

 .map-area {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .map-title {
  background: rgba(255, 255, 255, 0.92);
  border-bottom-color: rgba(15, 23, 42, 0.10);
 }

 .world-name {
  color: rgba(37, 99, 235, 0.95);
 }

 .world-desc {
  color: rgba(15, 23, 42, 0.55);
 }

 .map-canvas {
  padding: 12px;
 }

 .world {
  background-color: rgba(219, 234, 254, 0.75);
  border-color: rgba(37, 99, 235, 0.25);
  background-image: linear-gradient(rgba(37, 99, 235, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.12) 1px, transparent 1px);
  background-size: 220px 220px;
 }

 .map-controls {
  left: 10px;
  top: 96px;
  transform: none;
  gap: 8px;
 }

 .control-btn {
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
 }

 .control-status {
  width: 40px;
  height: auto;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(15, 23, 42, 0.75);
  font-size: 11px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 1px;
 }

 .legend {
  right: 16px;
  bottom: 20px;
  top: auto;
  transform: none;
  width: 240px;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
 }

 .legend-text {
  color: rgba(15, 23, 42, 0.75);
 }

 .popup {
  background: rgba(255, 255, 255, 0.96);
  color: rgba(15, 23, 42, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .popup-close {
  color: rgba(15, 23, 42, 0.75);
 }

 .popup-desc {
  color: rgba(15, 23, 42, 0.55);
 }

 .pill {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.75);
 }

 .btn {
  border-color: rgba(37, 99, 235, 0.95);
  background: rgba(37, 99, 235, 0.95);
 }

 .btn.btn-ghost {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: rgba(15, 23, 42, 0.92);
 }

@media (max-width: 1100px) {
  .map-main {
    grid-template-columns: 1fr;
  }
}
</style>
