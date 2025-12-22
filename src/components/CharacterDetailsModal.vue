<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="details-modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="btn-close" type="button" @click="close">×</button>
      </div>

      <div class="modal-content">
        <div class="details-grid">
          <section class="detail-section">
            <h4>基础信息</h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="label">道号</span>
                <span class="value">{{ baseName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">世界</span>
                <span class="value">{{ worldName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">天资</span>
                <span class="value">{{ aptitudeName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">灵根</span>
                <span class="value">{{ linggenName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">出生</span>
                <span class="value">{{ originName }}</span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h4>先天六司</h4>
            <div class="attributes-display">
              <div class="stats-grid">
                <div v-for="r in innateSix" :key="r.key" class="stat">
                  <span class="stat-k">{{ r.key }}</span>
                  <span class="stat-v">{{ r.value }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="detail-section span-2">
            <h4>天赋神通</h4>
            <div class="talents-list">
              <span v-if="talents.length === 0" class="muted">暂无天赋</span>
              <span v-for="(t, idx) in talents" v-else :key="idx" class="talent-tag" :title="t.desc">{{ t.name }}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useGameStateStore } from '../stores/useGameStateStore'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const gameState = useGameStateStore()

function close() {
  emit('update:modelValue', false)
}

const base = computed<any>(() => (gameState as any)?.角色基础信息 || {})

const title = computed(() => {
  const n = String(base.value?.名字 || base.value?.姓名 || '未命名')
  return `${n} - 详情`
})

const baseName = computed(() => String(base.value?.名字 || base.value?.姓名 || '未命名'))

function normalizeName(v: any): string {
  if (!v) return '未知'
  if (typeof v === 'string') return v
  if (typeof v === 'object') return String(v?.名称 || v?.name || v?.名字 || '未知')
  return String(v)
}

const worldName = computed(() => normalizeName(base.value?.世界))
const aptitudeName = computed(() => normalizeName(base.value?.天资))
const linggenName = computed(() => normalizeName(base.value?.灵根))
const originName = computed(() => normalizeName(base.value?.出生))

type SixRow = { key: string; value: number }

const innateSix = computed<SixRow[]>(() => {
  const src = base.value?.先天六司
  const safe = (k: string) => {
    const n = Number(src?.[k] ?? 0)
    return Number.isFinite(n) ? n : 0
  }
  return [
    { key: '根骨', value: safe('根骨') },
    { key: '灵性', value: safe('灵性') },
    { key: '悟性', value: safe('悟性') },
    { key: '气运', value: safe('气运') },
    { key: '魅力', value: safe('魅力') },
    { key: '心性', value: safe('心性') }
  ]
})

const talents = computed(() => {
  const list = base.value?.天赋
  if (!Array.isArray(list)) return [] as Array<{ name: string; desc: string }>
  return list
    .map((raw: any) => {
      if (!raw) return null
      if (typeof raw === 'string') return { name: raw, desc: '' }
      if (typeof raw === 'object') {
        const name = String(raw?.名称 || raw?.name || '未知天赋')
        const desc = String(raw?.描述 || raw?.description || '')
        return { name, desc }
      }
      return { name: String(raw), desc: '' }
    })
    .filter(Boolean) as Array<{ name: string; desc: string }>
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.details-modal {
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-1);
  box-shadow: var(--shadow-1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-1);
}

.modal-header h3 {
  margin: 0;
  color: var(--accent-solid);
  font-size: 18px;
  font-weight: 800;
}

.btn-close {
  background: none;
  border: 1px solid var(--border-1);
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.1rem;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.btn-close:hover {
  color: var(--text-2);
  background: var(--surface-3);
}

.modal-content {
  padding: 2rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.detail-section {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08),
    rgba(124, 58, 237, 0.06)
  );
  border: 1px solid rgba(124, 58, 237, 0.18);
  border-radius: 10px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
}

.detail-section h4 {
  margin: 0 0 10px 0;
  color: var(--warn);
  font-size: 14px;
  font-weight: 800;
}

.span-2 {
  grid-column: 1 / -1;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.label {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 13px;
}

.value {
  color: var(--text-1);
  font-weight: 600;
  font-size: 13px;
  text-align: right;
}

.attributes-display {
  display: flex;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.stat {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 0.35rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.stat-k {
  color: var(--text-muted);
  font-size: 13px;
}

.stat-v {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 700;
}

.talent-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: rgba(187, 247, 208, 0.95);
  font-size: 0.9rem;
}

.muted {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.talents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 860px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: auto;
  }
  .modal-header {
    padding: 1rem 1.25rem;
  }
  .modal-content {
    padding: 1.25rem;
  }
}
</style>
