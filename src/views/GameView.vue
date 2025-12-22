<template>
  <div class="app-container">
    <div class="top-nav">
      <div class="nav-left">
        <div class="nav-btn title">大道朝天</div>
        <button class="nav-btn active" type="button">{{ gameState.玩家角色状态.境界.名称 }}</button>
      </div>
      <div class="nav-center">
        <span class="status-text">{{ locationText }}</span>
        <span class="time-text">{{ timeText }}</span>
      </div>
      <div class="nav-right">
        <button class="icon-btn" type="button" title="全屏" @click="toggleFullscreen">⛶</button>
      </div>
    </div>

    <div
      class="main-content-area"
      :class="{
        'both-collapsed': leftSidebarCollapsed && rightSidebarCollapsed,
        'left-collapsed': leftSidebarCollapsed,
        'right-collapsed': rightSidebarCollapsed || isEmbeddedView
      }"
    >
      <aside class="left-sidebar" :class="{ collapsed: leftSidebarCollapsed }">
        <div class="functions-title">
          <span class="functions-icon" :title="leftSidebarCollapsed ? '游戏功能' : ''">🎮</span>
          <span class="functions-text">游戏功能</span>
          <button class="collapse-handle" type="button" :title="leftSidebarCollapsed ? '展开左侧栏' : '收起左侧栏'" @click="toggleLeftSidebar">
            {{ leftSidebarCollapsed ? '›' : '‹' }}
          </button>
        </div>
        <div class="time-stamp">{{ nowStamp }}</div>

        <div class="menu-list">
          <div class="section-title">修行管理</div>

          <button class="menu-item" type="button" @click="openPanel('背包物品')">
            <span class="menu-icon">🎒</span>
            <span class="menu-content">
              <span class="menu-title">背包物品</span>
              <span class="menu-subtitle">查看道具装备</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('人物详情')">
            <span class="menu-icon">👤</span>
            <span class="menu-content">
              <span class="menu-title">人物详情</span>
              <span class="menu-subtitle">查看修为境界</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('修炼功法')">
            <span class="menu-icon">📜</span>
            <span class="menu-content">
              <span class="menu-title">修炼功法</span>
              <span class="menu-subtitle">功法修炼技能</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('三千大道')">
            <span class="menu-icon">🌀</span>
            <span class="menu-content">
              <span class="menu-title">三千大道</span>
              <span class="menu-subtitle">修炼万法道途</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <div class="section-title">红尘俗事</div>

          <button class="menu-item" type="button" @click="openPanel('人物关系')">
            <span class="menu-icon">🤝</span>
            <span class="menu-content">
              <span class="menu-title">人物关系</span>
              <span class="menu-subtitle">人情世故网络</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('宗门信息')">
            <span class="menu-icon">🏯</span>
            <span class="menu-content">
              <span class="menu-title">宗门信息</span>
              <span class="menu-subtitle">门派势力详情</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <div class="section-title">世界探索</div>

          <button class="menu-item" type="button" @click="openPanel('任务日志')">
            <span class="menu-icon">🧾</span>
            <span class="menu-content">
              <span class="menu-title">任务日志</span>
              <span class="menu-subtitle">当前任务进度</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('世界地图')">
            <span class="menu-icon">🗺️</span>
            <span class="menu-content">
              <span class="menu-title">世界地图</span>
              <span class="menu-subtitle">坤舆图志</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <div class="section-title">记忆回顾</div>

          <button class="menu-item" type="button" @click="openPanel('记忆中心')">
            <span class="menu-icon">🧠</span>
            <span class="menu-content">
              <span class="menu-title">记忆中心</span>
              <span class="menu-subtitle">重要事件回顾</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('保存游戏')">
            <span class="menu-icon">💾</span>
            <span class="menu-content">
              <span class="menu-title">保存游戏</span>
              <span class="menu-subtitle">保存当前进度</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('游戏变量')">
            <span class="menu-icon">🧩</span>
            <span class="menu-content">
              <span class="menu-title">游戏变量</span>
              <span class="menu-subtitle">查看游戏数据</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openPanel('提示词管理')">
            <span class="menu-icon">💡</span>
            <span class="menu-content">
              <span class="menu-title">提示词管理</span>
              <span class="menu-subtitle">自定义AI提示词</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>

          <button class="menu-item" type="button" @click="openSettings">
            <span class="menu-icon">⚙️</span>
            <span class="menu-content">
              <span class="menu-title">系统设置</span>
              <span class="menu-subtitle">偏好设置</span>
            </span>
            <span class="menu-arrow">›</span>
          </button>
        </div>

        <button class="return-btn" type="button" @click="exitToMenu">
          <span class="return-icon">🚪</span>
          <span class="return-main">
            <span class="return-title">返回道途</span>
            <span class="return-subtitle">退出当前游戏</span>
          </span>
        </button>
      </aside>

      <button v-if="leftSidebarCollapsed" class="edge-toggle edge-left" type="button" title="展开左侧栏" @click="toggleLeftSidebar">›</button>

      <main class="main-content" :class="{ 'main-wide': leftSidebarCollapsed && rightSidebarCollapsed, 'layout-relaxed': leftSidebarCollapsed && rightSidebarCollapsed }">
        <section v-if="isEmbeddedView" class="center-panel embedded-panel">
          <div class="embedded-head">
            <div class="embedded-title"><span class="functions-icon">{{ embeddedIcon }}</span><span>{{ embeddedTitle }}</span></div>
            <button class="icon-btn" type="button" title="返回" @click="closeEmbedded">✕</button>
          </div>
          <div class="embedded-body">
            <BackpackPanel v-if="activePanel === '背包物品'" />
            <CultivationPanel v-else-if="activePanel === '修炼功法'" @fill-action="onFillAction" />
            <DaoPanel v-else-if="activePanel === '三千大道'" @fill-action="onFillAction" />
            <RelationshipPanel v-else-if="activePanel === '人物关系'" @fill-action="onFillAction" />
            <SectPanel v-else-if="activePanel === '宗门信息'" @fill-action="onFillAction" />
            <QuestLogPanel
              v-else-if="activePanel === '任务日志'"
              @fill-action="onFillAction"
              @fill-and-send="onFillAndSendAction"
            />
            <WorldMapPanel v-else-if="activePanel === '世界地图'" @fill-action="onFillAction" />
            <MemoryCenterPanel v-else-if="activePanel === '记忆中心'" @fill-action="onFillAction" />
            <SaveGamePanel v-else-if="activePanel === '保存游戏'" />
            <GameVariablesPanel v-else-if="activePanel === '游戏变量'" @fill-action="onFillAction" />
            <PromptManagementPanel v-else-if="activePanel === '提示词管理'" />
            <CharacterDetailDrawer
              v-else-if="activePanel === '人物详情'"
              :model-value="true"
              embedded
              @update:model-value="closeEmbedded"
              @fill-action="onFillAction"
            />
            <div v-else class="embedded-empty">未实现：{{ activePanel }}</div>
          </div>
        </section>

        <section v-else class="center-panel">
          <div class="center-short-memory" :class="{ collapsed: !shortMemoryExpanded }">
            <div class="memory-title">
              <span class="memory-label">短期记忆</span>
              <button class="memory-toggle" type="button" :aria-label="shortMemoryExpanded ? '收起短期记忆' : '展开短期记忆'" @click="toggleShortMemory">
                <span class="chev" :class="{ expanded: shortMemoryExpanded }">›</span>
              </button>
            </div>

            <transition name="collapse">
              <div v-show="shortMemoryExpanded" class="memory-body">
                <div class="message-list">
                  <div v-if="latestShortMemories.length === 0" class="message-empty">暂无短期记忆</div>

                  <div v-for="(m, idx) in latestShortMemories" :key="m || idx" class="message-item">
                    <div class="message-time">{{ splitMemory(m).time }}</div>
                    <div class="message-content">{{ splitMemory(m).content }}</div>
                    <div class="message-actions">
                      <button class="icon-btn" type="button" title="编辑" @click="editMemory(idx)">✎</button>
                      <span class="message-count">{{ shortMemories.length }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>

            <div v-if="!shortMemoryExpanded" class="memory-collapsed-hint">
              {{ shortMemories.length ? `已收起（${shortMemories.length}条）` : '暂无短期记忆' }}
            </div>
          </div>

          <div class="center-story" ref="centerStoryRef" @scroll="onStoryScroll">
            <div class="center-story-inner">
              <div class="story-list">
                <div v-if="latestNarratives.length === 0" class="message-empty">暂无游玩记录</div>
                <div v-for="(n, idx) in latestNarratives" :key="String(n.createdAt || '') + '_' + String(n.role || '') + '_' + idx" class="story-item" :class="n.role">
                  <div class="story-meta">
                    <span class="story-role">{{ n.role === 'user' ? '你' : '天道' }}</span>
                    <span class="story-time">{{ formatIso(n.createdAt) }}</span>
                  </div>
                  <div class="story-text">
                    <template v-for="(seg, sidx) in parseNarrativeSegments(String(n.text || ''))" :key="sidx">
                      <span v-if="seg.type === 'normal'" class="text-normal">{{ seg.content }}</span>
                      <div
                        v-else
                        class="judgement-card"
                        :class="{
                          'is-success': isSuccessResult(seg.content.result),
                          'is-failure': isFailureResult(seg.content.result),
                          'is-great-success': String(seg.content.result || '').includes('大成功'),
                          'is-great-failure': String(seg.content.result || '').includes('大失败')
                        }"
                      >
                        <div class="judgement-head">
                          <div class="judgement-icon">
                            <svg v-if="isSuccessResult(seg.content.result)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <svg v-else-if="isFailureResult(seg.content.result)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </div>
                          <div class="judgement-main">
                            <div class="judgement-title">{{ seg.content.title }}</div>
                            <div class="judgement-result">{{ seg.content.result }}</div>
                          </div>
                        </div>

                        <div class="judgement-stats">
                          <div v-if="seg.content.finalValue" class="stat">
                            <span class="stat-icon">✨</span>
                            <span class="stat-label">判定值</span>
                            <span class="stat-value">{{ seg.content.finalValue }}</span>
                          </div>
                          <div v-if="seg.content.difficulty" class="stat">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-label">难度</span>
                            <span class="stat-value">{{ seg.content.difficulty }}</span>
                          </div>
                          <div v-if="seg.content.bonus" class="stat">
                            <span class="stat-icon">➕</span>
                            <span class="stat-label">加成</span>
                            <span class="stat-value">{{ seg.content.bonus }}</span>
                          </div>
                          <div v-if="seg.content.damage" class="stat">
                            <span class="stat-icon">⚔️</span>
                            <span class="stat-label">伤害</span>
                            <span class="stat-value">{{ seg.content.damage }}</span>
                          </div>
                          <div v-if="seg.content.remainingHp" class="stat">
                            <span class="stat-icon">❤️</span>
                            <span class="stat-label">剩余气血</span>
                            <span class="stat-value">{{ seg.content.remainingHp }}</span>
                          </div>
                        </div>

                        <div v-if="Array.isArray(seg.content.details) && seg.content.details.length" class="judgement-details">
                          <div v-for="(d, didx) in seg.content.details" :key="didx" class="detail-item">{{ d }}</div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="center-action">
            <div v-if="enableActionOptions" class="choice-panel" aria-label="行动选择">
              <div class="choice-head">
                <div class="choice-title">行动选项</div>
                <div class="choice-actions">
                  <button class="icon-btn" type="button" :title="actionOptionsCollapsed ? '展开' : '收起'" @click="toggleActionOptions">
                    {{ actionOptionsCollapsed ? '＋' : '－' }}
                  </button>
                  <span class="choice-count">{{ actionOptions.length }}</span>
                </div>
              </div>
              <transition name="collapse">
                <div v-show="!actionOptionsCollapsed" class="choice-list">
                  <template v-if="actionOptions.length">
                    <button
                      v-for="(opt, idx) in actionOptions"
                      :key="opt || idx"
                      class="choice-btn"
                      type="button"
                      :disabled="sending || isDead"
                      @click="playerInput = opt"
                    >
                      {{ opt }}
                    </button>
                  </template>
                  <div v-else class="choice-empty">暂无行动选项，发送一次对话后生成</div>
                </div>
              </transition>
            </div>

            <div v-if="queuedActions.length" class="queue-panel">
              <div class="queue-head">
                <div class="queue-title">最近操作</div>
                <button class="queue-close" type="button" :disabled="sending || isDead" aria-label="清空最近操作" @click="clearQueued">×</button>
              </div>
              <div class="queue-list">
                <div v-for="a in queuedActions" :key="a.id" class="queue-item">
                  <div class="queue-text">{{ formatQueuedAction(a) }}</div>
                  <button class="queue-x" type="button" :disabled="sending || isDead" @click="removeQueued(a.id)">✕</button>
                </div>
              </div>
            </div>

            <div class="action-input-row">
              <textarea
                class="action-input"
                v-model.trim="playerInput"
                placeholder="请输入人物的选择或行动..."
                :disabled="sending || isDead"
                @keydown.enter.exact.prevent="sendTurn"
              />
              <button class="send-btn" type="button" :disabled="sending || isDead" @click="sendTurn" :title="sending ? '正在推演...' : (isDead ? '已死亡' : '发送')">
                <span v-if="sending">…</span>
                <span v-else>➤</span>
              </button>
            </div>
            <div v-if="lastError" class="action-error">
              <span class="action-error-text">{{ lastError }}</span>
              <button class="btn btn-ghost action-retry" type="button" :disabled="sending || isDead || !lastTurnInput" @click="retryLastTurn">重试</button>
            </div>
          </footer>
        </section>
      </main>

      <button v-if="rightSidebarCollapsed && !isEmbeddedView" class="edge-toggle edge-right" type="button" title="展开右侧栏" @click="toggleRightSidebar">‹</button>

      <aside v-if="!isEmbeddedView" class="right-sidebar" :class="{ collapsed: rightSidebarCollapsed }">
        <div class="status-title">
          <span class="functions-icon" :title="rightSidebarCollapsed ? '角色状态' : ''">👤</span>
          <span class="status-text-title">角色状态</span>
          <button class="collapse-handle" type="button" :title="rightSidebarCollapsed ? '展开右侧栏' : '收起右侧栏'" @click="toggleRightSidebar">
            {{ rightSidebarCollapsed ? '‹' : '›' }}
          </button>
        </div>

        <div class="status-bars">
          <div class="status-bar">
            <div class="status-head">
              <div class="status-name"><span class="status-ico">❤</span><span>气血</span></div>
              <div class="status-value">{{ qiXueText }}</div>
            </div>
            <div class="status-progress"><div class="progress-bar" :style="{ width: qiXuePercent + '%', background: 'rgba(248, 113, 113, 0.95)' }" /></div>
          </div>
          <div class="status-bar">
            <div class="status-head">
              <div class="status-name"><span class="status-ico">💧</span><span>灵气</span></div>
              <div class="status-value">{{ lingQiText }}</div>
            </div>
            <div class="status-progress"><div class="progress-bar" :style="{ width: lingQiPercent + '%', background: 'rgba(59, 130, 246, 0.95)' }" /></div>
          </div>
          <div class="status-bar">
            <div class="status-head">
              <div class="status-name"><span class="status-ico">🧠</span><span>神识</span></div>
              <div class="status-value">{{ shenShiText }}</div>
            </div>
            <div class="status-progress"><div class="progress-bar" :style="{ width: shenShiPercent + '%', background: 'var(--warn)' }" /></div>
          </div>
          <div class="status-bar">
            <div class="status-head">
              <div class="status-name"><span class="status-ico">⏳</span><span>寿元</span></div>
              <div class="status-value">{{ shouYuanText }}</div>
            </div>
            <div class="status-progress"><div class="progress-bar" :style="{ width: shouYuanPercent + '%', background: 'rgba(167, 139, 250, 0.9)' }" /></div>
          </div>
        </div>

        <div class="realm-status">
          <div class="realm-title"><span class="functions-icon">⭐</span><span>境界状态</span></div>
          <div class="realm-content">
            <div class="realm-name">{{ gameState.玩家角色状态.境界.名称 }}</div>
            <div class="realm-desc">{{ realmDesc }}</div>
            <div class="realm-action">{{ realmAction }}</div>
          </div>
        </div>

        <div class="fame">
          <div class="fame-title"><span class="functions-icon">✨</span><span>声望</span></div>
          <div class="fame-value">{{ fameText }}</div>
        </div>

        <div class="card">
          <div class="card-title"><span class="functions-icon">🪄</span><span>天赋神通</span></div>
          <div class="card-list">
            <button v-for="(t, idx) in talents" :key="t || idx" class="card-item" type="button" @click="openPlaceholder('天赋神通')">{{ t }}</button>
            <div v-if="talents.length === 0" class="card-item muted">暂无天赋</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><span class="functions-icon">⚡</span><span>状态效果</span></div>
          <div class="card-list">
            <div v-for="(e, idx) in effects" :key="e || idx" class="card-item">{{ e }}</div>
            <div v-if="effects.length === 0" class="card-item muted">暂无状态效果</div>
          </div>
        </div>
      </aside>
    </div>

    <GameplayPanelsModal v-model="showPanels" :tab="activePanel" @fill-action="onFillAction" @fill-and-send="onFillAndSendAction" />
    <SettingsModal v-model="showSettings" />

    <div v-if="deathDialog.show" class="gv-dialog-overlay" @click.self="confirmDeathDialog">
      <div class="gv-dialog" @click.stop>
        <div class="gv-dialog-title">{{ deathDialog.title }}</div>
        <div class="gv-dialog-message">{{ deathDialog.message }}</div>
        <div v-if="deathDialog.saving" class="gv-dialog-sub">正在自动存档…</div>
        <div v-else-if="deathDialog.saveError" class="gv-dialog-sub err">自动存档失败：{{ deathDialog.saveError }}</div>
        <div v-else class="gv-dialog-sub ok">已自动存档</div>
        <div class="gv-dialog-actions">
          <button class="btn primary" type="button" :disabled="deathDialog.saving" @click="confirmDeathDialog">返回主菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import GameplayPanelsModal from '../components/GameplayPanelsModal.vue'
import BackpackPanel from '../components/BackpackPanel.vue'
import CultivationPanel from '../components/CultivationPanel.vue'
import DaoPanel from '../components/DaoPanel.vue'
import CharacterDetailDrawer from '../components/CharacterDetailDrawer.vue'
import RelationshipPanel from '../components/RelationshipPanel.vue'
import SectPanel from '../components/SectPanel.vue'
import QuestLogPanel from '../components/QuestLogPanel.vue'
import WorldMapPanel from '../components/WorldMapPanel.vue'
import MemoryCenterPanel from '../components/MemoryCenterPanel.vue'
import SaveGamePanel from '../components/SaveGamePanel.vue'
import GameVariablesPanel from '../components/GameVariablesPanel.vue'
import SettingsModal from '../components/SettingsModal.vue'
import PromptManagementPanel from '../components/PromptManagementPanel.vue'
import { AutoSaveScheduler } from '../services/autoSaveScheduler'
import { runGameplayTurn } from '../services/gameplay'
import { runMemorySummary } from '../services/memorySummary'
import { buildEquipCommands, buildUnequipCommands } from '../services/inventory'
import { resolveAiBaseUrl } from '../services/aiProviders'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { useActionQueueStore, type PendingAction } from '../stores/useActionQueueStore'

const router = useRouter()
const characterStore = useCharacterStore()
const gameState = useGameStateStore()
const settingsStore = useSettingsStore()

let saveQueue: Promise<void> = Promise.resolve()
function enqueueSave(task: () => Promise<void>) {
  saveQueue = saveQueue.then(() => task().catch(() => void 0))
  return saveQueue
}

function saveForExit() {
  return enqueueSave(() => characterStore.saveCurrentGame())
}

function saveTimePoint() {
  return enqueueSave(() => characterStore.saveToSlot('时间点存档'))
}

onBeforeRouteLeave(async (to) => {
  if (to.name !== 'ModeSelection') return true
  await saveForExit()
  return true
})
const uiStore = useUIStore()
const actionQueueStore = useActionQueueStore()

const showSettings = ref(false)
const showPanels = ref(false)
const activePanel = ref('')

const locationText = computed(() => gameState.玩家角色状态?.位置?.描述 || '未知位置')

const timeText = computed(() => {
  const t = gameState.游戏时间
  const minute = t?.分钟 ?? 0
  return `仙道${t.年}年${t.月}月${t.日}日 ${String(t.小时).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

const shortMemories = computed(() => gameState.记忆?.短期记忆 || [])

const latestShortMemories = computed(() => {
  const arr = shortMemories.value
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.slice(0, 1)
})

const narratives = computed(() => (Array.isArray(gameState.叙事历史) ? gameState.叙事历史 : []))

const latestNarratives = computed(() => {
  const arr = narratives.value
  for (let i = arr.length - 1; i >= 0; i--) {
    const n: any = arr[i]
    if (n && n.role === 'assistant' && String(n.text || '').trim()) return [n]
  }
  return []
})

type JudgementContent = {
  title: string
  result: string
  finalValue?: string
  difficulty?: string
  bonus?: string
  damage?: string
  remainingHp?: string
  details?: string[]
}

type NarrativeSegment =
  | { type: 'normal'; content: string }
  | { type: 'judgement-card'; content: JudgementContent }

function isSuccessResult(result: unknown) {
  const r = String(result || '')
  return ['成功', '大成功', '完美', '通过'].includes(r)
}

function isFailureResult(result: unknown) {
  const r = String(result || '')
  return ['失败', '大失败', '失败惨重', '未通过'].includes(r)
}

function parseJudgement(contentRaw: string): JudgementContent | null {
  const content = String(contentRaw || '').trim()
  if (!content) return null

  const parts = content
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  if (parts.length === 0) return null

  const first = parts[0]
  const head = first.split(':')
  if (head.length < 2) {
    return {
      title: '系统提示',
      result: content,
      details: []
    }
  }

  const jc: JudgementContent = {
    title: head[0].trim(),
    result: head.slice(1).join(':').trim(),
    details: []
  }

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i]
    const seg = p.split(':').map((x) => x.trim())
    const k = seg[0]
    const v = seg.slice(1).join(':')
    if (!k || !v) continue

    if (k.includes('难度')) jc.difficulty = v
    else if (k.includes('判定值') || k.includes('最终值') || k.includes('总值')) jc.finalValue = v
    else if (k.includes('加成')) jc.bonus = v
    else if (k.includes('造成伤害') || k.includes('伤害')) jc.damage = v
    else if (k.includes('剩余气血')) jc.remainingHp = v
    else jc.details?.push(`${k}:${v}`)
  }

  return jc
}

function parseNarrativeSegments(text: string): NarrativeSegment[] {
  const src = String(text || '')
  if (!src) return []

  const segments: NarrativeSegment[] = []
  let idx = 0
  while (idx < src.length) {
    const start = src.indexOf('〖', idx)
    if (start === -1) break
    const end = src.indexOf('〗', start + 1)
    if (end === -1) break
    if (start > idx) segments.push({ type: 'normal', content: src.slice(idx, start) })
    const inner = src.slice(start + 1, end)
    const parsed = parseJudgement(inner)
    if (parsed) segments.push({ type: 'judgement-card', content: parsed })
    else segments.push({ type: 'normal', content: src.slice(start, end + 1) })
    idx = end + 1
  }
  if (idx < src.length) segments.push({ type: 'normal', content: src.slice(idx) })

  if (segments.length === 1 && segments[0].type === 'normal') {
    const one = segments[0].content
    const m = one.match(/^【([^】]+)】([\s\S]*)$/)
    if (m) {
      const head = String(m[1] || '').trim()
      const tail = String(m[2] || '').trim()
      const maybe = [head, tail].filter(Boolean).join(',')
      const parsed = parseJudgement(maybe)
      if (parsed && (parsed.finalValue || parsed.difficulty || parsed.bonus || parsed.damage || parsed.remainingHp)) {
        return [{ type: 'judgement-card', content: parsed }]
      }
    }
  }

  return segments
}

const playerInput = ref('')
const sending = ref(false)
const lastError = ref('')
const lastTurnInput = ref('')

const autoSummarizing = ref(false)
let lastAutoSummarySig = ''

function getMemorySettingsFromLocalStorage(): { autoSummaryEnabled: boolean; midTermTrigger: number; midTermKeep: number } {
  try {
    const raw = localStorage.getItem('memory-settings')
    if (!raw) return { autoSummaryEnabled: true, midTermTrigger: 25, midTermKeep: 8 }
    const obj = JSON.parse(raw) as any
    const autoSummaryEnabled = typeof obj?.autoSummaryEnabled === 'boolean' ? obj.autoSummaryEnabled : true
    const midTermTrigger = Math.max(1, Math.floor(Number(obj?.midTermTrigger) || 25))
    const midTermKeep = Math.max(0, Math.floor(Number(obj?.midTermKeep) || 8))
    return { autoSummaryEnabled, midTermTrigger, midTermKeep }
  } catch {
    return { autoSummaryEnabled: true, midTermTrigger: 25, midTermKeep: 8 }
  }
}

function computeMidSig(mid: unknown): string {
  if (!Array.isArray(mid)) return ''
  const picked = mid
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, 32)
  if (picked.length === 0) return ''
  return picked.join('\n')
}

async function maybeAutoSummarize() {
  if (autoSummarizing.value) return
  if (sending.value) return

  const { autoSummaryEnabled, midTermTrigger, midTermKeep } = getMemorySettingsFromLocalStorage()
  if (!autoSummaryEnabled) return

  gameState.normalizeMemoryState()
  const mid = (gameState as any)?.记忆?.中期记忆
  if (!Array.isArray(mid) || mid.length < midTermTrigger) return

  const baseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
  const model = String(settingsStore.aiModel || '').trim()
  if (!model || !String(baseUrl || '').trim()) return

  const sig = computeMidSig(mid)
  if (!sig || sig === lastAutoSummarySig) return
  lastAutoSummarySig = sig

  try {
    autoSummarizing.value = true
    const resp = await runMemorySummary({
      saveData: gameState.toSaveData(),
      midItems: mid as string[],
      midTermKeep,
      preset: settingsStore.aiProviderPreset,
      customApiUrl: settingsStore.customApiUrl,
      apiKey: String((settingsStore.customApiKey || '').trim()),
      model,
      temperature: settingsStore.aiTemperature,
      maxOutputTokens: Math.max(16, settingsStore.aiMaxOutputTokens),
      allowPromptOverrides: settingsStore.useImportedPromptOverrides,
      memorySummaryMode: settingsStore.memorySummaryMode,
      stream: settingsStore.aiStreaming
    })

    gameState.applyCommands(resp.tavern_commands)
    await enqueueSave(() => characterStore.saveCurrentGame(undefined, undefined, { toast: false }))
  } catch {
    lastAutoSummarySig = ''
  } finally {
    autoSummarizing.value = false
  }
}

const isDead = computed(() => Boolean((gameState.玩家角色状态 as any)?.已死亡))

const deathDialog = ref({
  show: false,
  title: '',
  message: '',
  saving: false,
  saveError: ''
})

const deathFlowHandled = ref(false)

function buildDeathMessage(): { title: string; message: string } {
  const reason = String((gameState.玩家角色状态 as any)?.死亡原因 || '角色已死亡')
  if (reason.includes('寿元')) {
    return { title: '角色已死亡', message: '角色已死亡，寿元耗尽。无法继续游戏，请重新开始或复活角色。' }
  }
  if (reason.includes('气血')) {
    return { title: '角色已死亡', message: '角色已死亡，气血耗尽。无法继续游戏，请重新开始或复活角色。' }
  }
  return { title: '角色已死亡', message: `角色已死亡（${reason}）。无法继续游戏，请重新开始或复活角色。` }
}

async function runDeathFlow() {
  if (deathFlowHandled.value) return
  if (!isDead.value) return
  deathFlowHandled.value = true

  const { title, message } = buildDeathMessage()
  uiStore.showToast(title, 'error')

  deathDialog.value.show = true
  deathDialog.value.title = title
  deathDialog.value.message = message
  deathDialog.value.saving = true
  deathDialog.value.saveError = ''

  try {
    const cid = characterStore.requireCurrentCharacterId()
    const slot = characterStore.currentSaveMeta?.存档槽位 || characterStore.当前激活存档?.存档槽位 || '存档1'
    await characterStore.saveCurrentGame(cid, slot, { toast: false })
    await characterStore.saveCurrentGame(cid, '时间点存档', { toast: false })
    uiStore.showToast('已自动存档', 'success')
  } catch (e) {
    deathDialog.value.saveError = e instanceof Error ? e.message : String(e)
    uiStore.showToast('自动存档失败', 'error')
  } finally {
    deathDialog.value.saving = false
  }
}

function confirmDeathDialog() {
  if (deathDialog.value.saving) return
  deathDialog.value.show = false
  void router.push({ name: 'ModeSelection' })
}

const ACTION_OPTIONS_KEY_PREFIX = 'dad_action_options'

function buildActionOptionsKey(active: { 角色ID: string; 存档槽位: string } | null | undefined): string {
  if (active?.角色ID && active?.存档槽位) return `${ACTION_OPTIONS_KEY_PREFIX}:${active.角色ID}:${active.存档槽位}`
  return ACTION_OPTIONS_KEY_PREFIX
}

function safeLoadActionOptions(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((x) => String(x || '')).filter(Boolean).slice(0, 20)
  } catch {
    return []
  }
}

function safeSaveActionOptions(key: string, options: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify((options || []).slice(0, 20)))
  } catch {
    void 0
  }
}

const actionOptionsStorageKey = computed(() => buildActionOptionsKey(characterStore.当前激活存档 as any))
const actionOptions = ref<string[]>(safeLoadActionOptions(actionOptionsStorageKey.value))
const actionOptionsCollapsed = ref(false)
const enableActionOptions = computed(() => settingsStore.enableActionOptions)

watch(
  actionOptionsStorageKey,
  (k) => {
    actionOptions.value = safeLoadActionOptions(k)
  },
  { immediate: true }
)

const centerStoryRef = ref<HTMLElement | null>(null)
const autoScrollStory = ref(true)

const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

const embeddedTabs = [
  '背包物品',
  '人物详情',
  '修炼功法',
  '三千大道',
  '人物关系',
  '宗门信息',
  '任务日志',
  '世界地图',
  '记忆中心',
  '保存游戏',
  '游戏变量',
  '提示词管理'
]

const isEmbeddedView = computed(() => embeddedTabs.includes(activePanel.value) && !showPanels.value)

const embeddedTitle = computed(() => {
  const t = String(activePanel.value || '')
  return t || '面板'
})

const embeddedIcon = computed(() => {
  const k = String(activePanel.value || '')
  if (k === '背包物品') return '🎒'
  if (k === '人物详情') return '👤'
  if (k === '修炼功法') return '⚡'
  if (k === '三千大道') return '🌀'
  if (k === '人物关系') return '🤝'
  if (k === '宗门信息') return '🏯'
  if (k === '任务日志') return '🧾'
  if (k === '世界地图') return '🗺️'
  if (k === '记忆中心') return '🧠'
  if (k === '保存游戏') return '💾'
  if (k === '游戏变量') return '🧩'
  if (k === '提示词管理') return '💡'
  return '📄'
})

function toggleLeftSidebar() {
  leftSidebarCollapsed.value = !leftSidebarCollapsed.value
}

function toggleRightSidebar() {
  rightSidebarCollapsed.value = !rightSidebarCollapsed.value
}

function toggleActionOptions() {
  actionOptionsCollapsed.value = !actionOptionsCollapsed.value
}

function onStoryScroll() {
  const el = centerStoryRef.value
  if (!el) return
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  autoScrollStory.value = distanceToBottom < 40
}

async function scrollStoryToBottom() {
  if (!autoScrollStory.value) return
  await nextTick()
  const el = centerStoryRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

const queuedActions = computed(() => actionQueueStore.pendingActions)

function formatQueuedAction(a: PendingAction) {
  if (a.description) return a.description
  if (a.type === 'equip') return `装备了《${a.itemName}》${a.itemType ? a.itemType : ''}`
  if (a.type === 'unequip') return `卸下了《${a.itemName}》`
  if (a.type === 'cultivate') return `修炼了《${a.itemName}》`
  if (a.type === 'dao') return `三千大道：${a.itemName}`
  return a.itemName
}

function undoQueuedAction(a: PendingAction) {
  const payload = (a as any)?.payload
  if (!payload || typeof payload !== 'object') return

  if (payload.kind === 'use_item') {
    if (!payload.consumed) return

    const itemId = String(payload.itemId || '')
    const qty = Math.max(1, Math.floor(Number(payload.quantity) || 1))
    if (!itemId || qty <= 0) return

    if ((gameState as any).背包 == null) (gameState as any).背包 = { 灵石: {}, 物品: {} }
    if ((gameState as any).背包.物品 == null || typeof (gameState as any).背包.物品 !== 'object') (gameState as any).背包.物品 = {}

    const bag = (gameState as any).背包.物品
    const cur = bag[itemId]
    if (cur && typeof cur === 'object') {
      const prevQty = Number(cur.数量)
      const base = Number.isFinite(prevQty) ? prevQty : 0
      cur.数量 = base + qty
    } else {
      const baseItem =
        payload.itemData && typeof payload.itemData === 'object'
          ? JSON.parse(JSON.stringify(payload.itemData))
          : { 物品ID: itemId, 名称: a.itemName, 类型: a.itemType || '其他' }
      baseItem.物品ID = baseItem.物品ID || itemId
      baseItem.数量 = qty
      bag[itemId] = baseItem
    }

    if (payload.localApplied && payload.prevState) {
      const ps = payload.prevState
      if ((gameState.玩家角色状态 as any)?.气血) (gameState.玩家角色状态 as any).气血.当前 = ps.气血
      if ((gameState.玩家角色状态 as any)?.灵气) (gameState.玩家角色状态 as any).灵气.当前 = ps.灵气
      if ((gameState.玩家角色状态 as any)?.神识) (gameState.玩家角色状态 as any).神识.当前 = ps.神识
      if ((gameState.玩家角色状态 as any)?.寿命) (gameState.玩家角色状态 as any).寿命.上限 = ps.寿命上限
      if (Array.isArray(ps.状态效果)) (gameState.玩家角色状态 as any).状态效果 = JSON.parse(JSON.stringify(ps.状态效果))
    }
    return
  }

  if (payload.kind === 'equip_item') {
    const op = String(payload.op || '')
    const slot = payload.slot as any
    const itemData = payload.itemData && typeof payload.itemData === 'object' ? JSON.parse(JSON.stringify(payload.itemData)) : null
    const itemId = String(payload.itemId || (itemData as any)?.物品ID || '')
    if (!slot || !itemId || !itemData) return

    if (op === 'equip') {
      gameState.applyCommands(buildUnequipCommands({ ...itemData, 物品ID: itemId }, slot))
      return
    }
    if (op === 'unequip') {
      gameState.applyCommands(buildEquipCommands({ ...itemData, 物品ID: itemId }, slot))
      return
    }
  }
}

function clearQueued() {
  const list = [...queuedActions.value]
  actionQueueStore.clearActions()
  for (let i = list.length - 1; i >= 0; i--) {
    undoQueuedAction(list[i])
  }
}

function removeQueued(id: string) {
  const removed = actionQueueStore.removeAction(id)
  if (removed) undoQueuedAction(removed)
}

const shortMemoryExpanded = ref(true)

function toggleShortMemory() {
  shortMemoryExpanded.value = !shortMemoryExpanded.value
}

const qiXueText = computed(() => {
  const s = (gameState.玩家角色状态 as any)?.气血
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  return `${cur} / ${max}`
})

const lingQiText = computed(() => {
  const s = (gameState.玩家角色状态 as any)?.灵气
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  return `${cur} / ${max}`
})

const shenShiText = computed(() => {
  const s = gameState.玩家角色状态?.神识
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  return `${cur} / ${max}`
})
const shouYuanText = computed(() => {
  const s = gameState.玩家角色状态?.寿命
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  return `${cur} / ${max}`
})

const qiXuePercent = computed(() => {
  const s = (gameState.玩家角色状态 as any)?.气血
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  if (!max) return 0
  return Math.min(100, Math.max(0, Math.floor((cur / max) * 100)))
})

const lingQiPercent = computed(() => {
  const s = (gameState.玩家角色状态 as any)?.灵气
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  if (!max) return 0
  return Math.min(100, Math.max(0, Math.floor((cur / max) * 100)))
})

const shenShiPercent = computed(() => {
  const s = gameState.玩家角色状态?.神识
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  if (!max) return 0
  return Math.min(100, Math.max(0, Math.floor((cur / max) * 100)))
})
const shouYuanPercent = computed(() => {
  const s = gameState.玩家角色状态?.寿命
  const cur = s?.当前 ?? 0
  const max = s?.上限 ?? 0
  if (!max) return 0
  return Math.min(100, Math.max(0, Math.floor((cur / max) * 100)))
})

const fameText = computed(() => {
  const v = Number((gameState.玩家角色状态 as any)?.声望 ?? 0)
  if (v >= 1000) return `名震八方（${v}）`
  if (v >= 200) return `小有名气（${v}）`
  if (v >= 50) return `略有耳闻（${v}）`
  return `籍籍无名（${v}）`
})

const talents = computed(() => {
  const list = (gameState.角色基础信息 as any)?.天赋
  if (!Array.isArray(list)) return []
  return list.map((x: any) => String(x?.名称 || x?.name || '')).filter(Boolean)
})

const effects = computed(() => {
  const list = (gameState.玩家角色状态 as any)?.状态效果
  if (!Array.isArray(list)) return []
  return list.map((e: any) => {
    const name = String(e?.状态名称 || '')
    const desc = String(e?.状态描述 || '')
    return desc ? `${name}：${desc}` : name
  }).filter(Boolean)
})

const realmDesc = computed(() => {
  const r: any = gameState.玩家角色状态?.境界
  if (!r) return '大道漫漫，静待因果流转。'
  const stage = r.阶段 ? `·${r.阶段}` : ''
  const cur = typeof r.当前进度 === 'number' ? r.当前进度 : null
  const need = typeof r.下一级所需 === 'number' ? r.下一级所需 : null
  if (cur != null && need != null && need > 0) return `${r.名称}${stage}（修为 ${cur}/${need}）`
  return `${r.名称}${stage}`
})

const realmAction = computed(() => {
  const r: any = gameState.玩家角色状态?.境界
  const hint = String(r?.突破描述 || '').trim()
  return hint || '静心修行，方得寸进。'
})

const nowStamp = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

let scheduler: AutoSaveScheduler | null = null

function openSettings() {
  showSettings.value = true
}

function openPanel(tab: string) {
  if (embeddedTabs.includes(tab)) {
    activePanel.value = tab
    showPanels.value = false
    return
  }

  activePanel.value = tab
  showPanels.value = true
}

function closeEmbedded() {
  activePanel.value = ''
}

function onFillAction(text: string) {
  playerInput.value = text
}

function onFillAndSendAction(text: string) {
  playerInput.value = text
  void nextTick(() => sendTurn())
}

async function sendTurn() {
  lastError.value = ''
  if ((gameState.玩家角色状态 as any)?.已死亡) {
    lastError.value = `无法继续游戏：${String((gameState.玩家角色状态 as any)?.死亡原因 || '角色已死亡')}`
    return
  }
  const input = String(playerInput.value || '').trim()
  const queuedSnapshot = [...queuedActions.value]
  const queuedPreview = actionQueueStore.getActionPrompt()
  const hasQueued = !!String(queuedPreview || '').trim()
  if (!input && !hasQueued) {
    lastError.value = '请输入行动内容'
    return
  }

  const queuedText = actionQueueStore.consumeActions()
  const prevActionOptions = [...actionOptions.value]
  actionOptions.value = []
  safeSaveActionOptions(actionOptionsStorageKey.value, [])

  const combinedInput = (input ? input + String(queuedText || '') : String(queuedText || '').trimStart()).trim()
  lastTurnInput.value = combinedInput

  let appendedNarrative = false

  try {
    sending.value = true

    if (settingsStore.enablePreDialogBackup) {
      const cid = characterStore.当前角色ID
      const slot = characterStore.当前激活存档?.存档槽位
      if (cid && slot) {
        await characterStore.saveCurrentGame(cid, '上次对话', { loadingText: '正在备份…', successText: '备份完成' })
      }
    }

    gameState.appendNarrative({ role: 'user', text: combinedInput, createdAt: new Date().toISOString() })
    gameState.appendNarrative({ role: 'assistant', text: '', createdAt: new Date().toISOString() })
    appendedNarrative = true

    const resp = await runGameplayTurn({
      userInput: combinedInput,
      saveData: gameState.toSaveData(),
      preset: settingsStore.aiProviderPreset,
      customApiUrl: settingsStore.customApiUrl,
      apiKey: (settingsStore.customApiKey || '').trim(),
      model: (settingsStore.aiModel || '').trim(),
      temperature: settingsStore.aiTemperature,
      maxOutputTokens: settingsStore.aiMaxOutputTokens,
      stream: settingsStore.aiStreaming,
      enableActionOptions: settingsStore.enableActionOptions,
      actionOptionsPrompt: settingsStore.actionOptionsPrompt,
      useSystemCot: settingsStore.useSystemCot,
      allowPromptOverrides: settingsStore.useImportedPromptOverrides,
      onProgress: (text) => {
        gameState.updateLastAssistantNarrative({ text })
      }
    })

    gameState.applyCommands(resp.tavern_commands)

    gameState.updateLastAssistantNarrative({ text: resp.text, stateChanges: resp.tavern_commands })
    gameState.addToShortTermMemory((resp as any).mid_term_memory ? (resp as any).mid_term_memory : resp.text)

    void maybeAutoSummarize()

    const nextOptions = (resp as any).action_options
    if (Array.isArray(nextOptions)) {
      actionOptions.value = nextOptions
      safeSaveActionOptions(actionOptionsStorageKey.value, nextOptions)
    }

    playerInput.value = ''
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : '行动失败'

    actionOptions.value = prevActionOptions
    safeSaveActionOptions(actionOptionsStorageKey.value, prevActionOptions)

    if (queuedSnapshot.length > 0) {
      for (let i = queuedSnapshot.length - 1; i >= 0; i--) {
        undoQueuedAction(queuedSnapshot[i])
      }
    }

    if (appendedNarrative && Array.isArray(gameState.叙事历史) && gameState.叙事历史.length >= 2) {
      const a = gameState.叙事历史[gameState.叙事历史.length - 1]
      const u = gameState.叙事历史[gameState.叙事历史.length - 2]
      if (a?.role === 'assistant' && u?.role === 'user') {
        gameState.叙事历史.pop()
        gameState.叙事历史.pop()
      }
    }
  } finally {
    sending.value = false
  }
}

function retryLastTurn() {
  if (sending.value) return
  const text = String(lastTurnInput.value || '').trim()
  if (!text) return
  playerInput.value = text
  void sendTurn()
}

async function quickAction(text: string) {
  if (sending.value) return
  playerInput.value = text
  await sendTurn()
}

function openPlaceholder(title: string) {
  alert(`${title}：功能开发中`) 
}

function formatIso(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function splitMemory(text: string): { time: string; content: string } {
  const m = text.match(/^【([^】]+)】(.*)$/)
  if (!m) return { time: '未知时间', content: text }
  return { time: m[1] || '未知时间', content: (m[2] || '').trim() }
}

function editMemory(index: number) {
  const item = shortMemories.value[index]
  if (!item) return
  const parsed = splitMemory(item)
  const next = prompt('编辑短期记忆：', parsed.content)
  if (!next) return
  const prefix = item.startsWith('【') ? item.slice(0, item.indexOf('】') + 1) : ''
  const patched = `${prefix}${next}`
  gameState.normalizeMemoryState()
  gameState.记忆!.短期记忆.splice(index, 1, patched)
}

async function save() {
  try {
    await characterStore.saveCurrentGame()
  } catch {
    void 0
  }
}

async function exitToMenu() {
  router.push({ name: 'ModeSelection' })
}

function goMenu() {
  void exitToMenu()
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    alert('全屏切换失败')
  }
}

function onSettingsChanged() {
  scheduler?.restart()
}

watch(
  narratives,
  () => {
    void scrollStoryToBottom()
  },
  { deep: true }
)

watch(
  isDead,
  (v) => {
    if (v) void runDeathFlow()
  },
  { immediate: true }
)

onMounted(() => {
  const pending = uiStore.consumePendingAction()
  if (pending) playerInput.value = pending

  scheduler = new AutoSaveScheduler({
    enabled: () => true,
    intervalMs: () => 5 * 60 * 1000,
    onSave: () => saveTimePoint()
  })
  scheduler.start()
  window.addEventListener('settingsChanged', onSettingsChanged)
  void scrollStoryToBottom()
})

onBeforeUnmount(() => {
  window.removeEventListener('settingsChanged', onSettingsChanged)
  scheduler?.stop()
  scheduler = null
})
</script>

<style scoped>
.app-container {
  --gv-radius: 18px;
  --gv-radius-sm: 12px;
  --gv-gap: 12px;

  --bg-1: #e8e6e3;
  --bg-2: #e3e1de;
  --surface-1: rgba(242, 241, 238, 0.92);
  --surface-2: rgba(242, 241, 238, 0.75);
  --surface-3: rgba(0, 0, 0, 0.04);
  --border-1: rgba(0, 0, 0, 0.12);
  --border-2: rgba(0, 0, 0, 0.08);
  --shadow-1: 0 16px 40px rgba(0, 0, 0, 0.12);

  --text-1: #1a1a1a;
  --text-2: #2a2a2a;
  --text-3: #606060;
  --text-muted: #757575;

  --accent-solid: #7c4dff;
  --accent: rgba(124, 77, 255, 0.15);
  --accent-strong: rgba(124, 77, 255, 0.28);
  --warn: #ff9800;
  --ok: #4caf50;
  --err: #ff2929;

  --panel-bg: var(--surface-1);
  --panel-border: var(--border-1);

  --gv-border: var(--border-1);
  --gv-surface: var(--surface-1);
  --gv-surface-2: var(--surface-2);
  --gv-item: rgba(0, 0, 0, 0.04);
  --gv-item-hover: rgba(0, 0, 0, 0.06);
  --gv-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, var(--bg-1), var(--bg-2));
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: var(--gv-surface-2);
  border-bottom: 1px solid var(--gv-border);
  backdrop-filter: blur(14px);
}

.nav-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.nav-center {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-right {
  display: flex;
  align-items: center;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--gv-border);
  background: var(--gv-item);
}

.nav-btn {
  border: 1px solid var(--gv-border);
  background: var(--gv-item);
  color: var(--text-1);
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.06em;
}

.nav-btn:hover {
  background: var(--gv-item-hover);
}

.nav-btn.title {
  cursor: default;
}

.nav-btn.title:hover {
  background: var(--gv-item);
}

.nav-btn.active {
  background: var(--accent);
  border-color: rgba(124, 77, 255, 0.42);
  color: var(--text-1);
}

.status-text {
  color: var(--ok);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(76, 175, 80, 0.35);
  background: rgba(76, 175, 80, 0.12);
}

.time-text {
  color: var(--text-3);
  font-size: 12px;
}

.icon-btn {
  appearance: none;
  border: 1px solid var(--gv-border);
  background: var(--gv-item);
  color: var(--text-2);
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--gv-item-hover);
}

.icon-btn:focus-visible,
.nav-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.main-content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
  padding: 0;
  position: relative;
  background: transparent;
}

.main-content-area.both-collapsed {
  gap: 0;
  padding: 0;
}

.left-sidebar {
  width: 260px;
  background: var(--gv-surface);
  border: 1px solid var(--gv-border);
  overflow-y: auto;
  padding: 14px 12px;
  border-radius: var(--gv-radius);
  box-shadow: var(--gv-shadow);
  backdrop-filter: blur(14px);
}

.main-content-area:not(.left-collapsed) .left-sidebar {
  border-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.left-sidebar::-webkit-scrollbar,
.center-story::-webkit-scrollbar,
.right-sidebar::-webkit-scrollbar {
  width: 8px;
}

.left-sidebar::-webkit-scrollbar-thumb,
.center-story::-webkit-scrollbar-thumb,
.right-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 999px;
  border: 2px solid transparent;
}

.left-sidebar::-webkit-scrollbar-thumb:hover,
.center-story::-webkit-scrollbar-thumb:hover,
.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.28);
}

.left-sidebar::-webkit-scrollbar-track,
.center-story::-webkit-scrollbar-track,
.right-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.left-sidebar.collapsed {
  width: 0;
  padding: 0;
  border-right: 0;
  box-shadow: none;
  overflow: hidden;
}

.functions-title {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: var(--text-1);
  font-size: 18px;
  font-weight: 900;
  padding: 6px 36px 4px;
}

.functions-text {
  letter-spacing: 0.2px;
}

.collapse-handle {
  position: absolute;
  right: 4px;
  top: 3px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.92);
  color: rgba(71, 85, 105, 0.92);
  border-radius: 12px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: none;
  backdrop-filter: none;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.collapse-handle:hover {
  background: rgba(241, 245, 249, 0.96);
  border-color: rgba(148, 163, 184, 0.36);
}

.collapse-handle:active {
  transform: translateY(1px);
}

.collapse-handle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.35);
}

.left-sidebar.collapsed .functions-text,
.left-sidebar.collapsed .time-stamp,
.left-sidebar.collapsed .section-title,
.left-sidebar.collapsed .menu-content,
.left-sidebar.collapsed .menu-arrow,
.left-sidebar.collapsed .menu-subtitle,
.left-sidebar.collapsed .return-main {
  display: none;
}

.left-sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 10px 8px;
  grid-template-columns: 1fr;
}

.left-sidebar.collapsed .menu-icon,
.left-sidebar.collapsed .return-icon {
  width: 100%;
  text-align: center;
}

.left-sidebar.collapsed .return-btn {
  grid-template-columns: 1fr;
  justify-items: center;
}

.functions-icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gv-border);
  background: var(--gv-item);
  color: var(--text-1);
  font-size: 13px;
}

.time-stamp {
  margin-top: 10px;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
}

.time-stamp::before {
  content: '🕒';
  font-size: 12px;
  opacity: 0.95;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  display: grid;
  grid-template-columns: 54px 1fr 20px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  cursor: pointer;
  text-align: left;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.menu-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-1);
  font-size: 18px;
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.menu-title {
  font-size: 14px;
  font-weight: 900;
  color: var(--text-1);
}

.menu-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-arrow {
  color: rgba(0, 0, 0, 0.45);
  text-align: right;
  font-size: 18px;
}

.menu-list > button.menu-item:nth-of-type(-n + 4) .menu-icon {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.12);
  color: rgba(191, 219, 254, 0.95);
}

.menu-list > button.menu-item:nth-of-type(n + 5):nth-of-type(-n + 6) .menu-icon {
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.12);
  color: rgba(167, 243, 208, 0.95);
}

.menu-list > button.menu-item:nth-of-type(n + 7):nth-of-type(-n + 9) .menu-icon {
  border-color: rgba(168, 85, 247, 0.35);
  background: rgba(168, 85, 247, 0.12);
  color: rgba(233, 213, 255, 0.95);
}

.menu-list > button.menu-item:nth-of-type(n + 10) .menu-icon {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-1);
}

.section-title {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 900;
  margin-top: 8px;
  margin-bottom: 8px;
  padding-left: 2px;
}

.return-btn {
  margin-top: 16px;
  width: 100%;
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid rgba(248, 113, 113, 0.55);
  background: rgba(0, 0, 0, 0.02);
  color: rgba(185, 28, 28, 0.95);
  cursor: pointer;
  text-align: left;
}

.return-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.return-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.14);
  color: rgba(185, 28, 28, 0.95);
}

.return-main {
  display: flex;
  flex-direction: column;
}

.return-title {
  font-size: 14px;
  font-weight: 900;
}

.return-subtitle {
  font-size: 12px;
  color: rgba(185, 28, 28, 0.75);
}

.main-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  border-radius: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-content.main-wide {
  max-width: none;
  margin: 0;
}

.main-content.layout-relaxed {
  max-width: none;
  margin: 0;
  padding: 0;
  gap: 0;
}

.main-content.layout-relaxed .short-memory {
  border: none;
  background: transparent;
  padding: 0;
}

.main-content.layout-relaxed .memory-title {
  margin-bottom: 8px;
}

.main-content.layout-relaxed .story-panel {
  border-radius: 0;
  border: none;
  background: transparent;
  padding: 0;
}

.main-content.layout-relaxed .story-title {
  margin-bottom: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--panel-border);
}

.main-content.layout-relaxed .story-item {
  border: none;
  background: transparent;
  padding: 0;
}

.main-content.layout-relaxed .story-text {
  line-height: 1.75;
}

.main-content.layout-relaxed .story-list {
  gap: 14px;
}

.main-content.layout-relaxed .action-panel {
  border-radius: 0;
  border: 1px solid var(--panel-border);
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  background: var(--panel-bg);
  padding: 10px 0 12px;
}

.main-content.layout-relaxed .action-title {
  padding: 0 18px;
}

.main-content.layout-relaxed .queue-panel,
.main-content.layout-relaxed .action-input-row,
.main-content.layout-relaxed .quick-row,
.main-content.layout-relaxed .action-error {
  padding-left: 18px;
  padding-right: 18px;
}

.main-content.layout-relaxed .queue-panel {
  border-radius: 12px;
}

.main-content.layout-relaxed .action-input {
  min-height: 38px;
  max-height: 38px;
}

.center-panel {
  border-radius: var(--gv-radius);
  border: 1px solid var(--gv-border);
  background: var(--gv-surface);
  box-shadow: var(--gv-shadow);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.main-content-area:not(.left-collapsed) .center-panel {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.main-content-area:not(.right-collapsed) .center-panel {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.embedded-panel {
  display: flex;
  flex-direction: column;
}

.embedded-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--gv-border);
  background: var(--gv-surface-2);
}

.embedded-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 900;
}

.embedded-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.embedded-empty {
  padding: 10px;
  color: var(--text-muted);
}

.embedded-character {
  padding: 2px;
}

.embedded-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.embedded-card {
  border-radius: 14px;
  border: 1px solid var(--gv-border);
  background: var(--gv-surface);
  padding: 12px;
}

.embedded-card-title {
  color: var(--accent-solid);
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 10px;
}

.embedded-kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.embedded-kv .k {
  color: var(--text-3);
  font-size: 12px;
}

.embedded-kv .v {
  color: var(--text-1);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.embedded-muted {
  color: var(--text-muted);
  font-size: 12px;
}

.embedded-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(124, 58, 237, 0.28);
  background: rgba(124, 58, 237, 0.14);
  color: var(--text-1);
  font-size: 12px;
  font-weight: 800;
  margin: 0 8px 8px 0;
}

.embedded-list-item {
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 8px 10px;
  font-size: 12px;
  margin-bottom: 8px;
}

.embedded-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.embedded-btn {
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-1);
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.embedded-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

@media (max-width: 960px) {
  .embedded-grid {
    grid-template-columns: 1fr;
  }
}

.center-head {
  display: none;
}

.center-head-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.center-head-title {
  color: var(--text-2);
  font-size: 13px;
  font-weight: 900;
}

.center-head-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.center-short-memory {
  padding: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: transparent;
}

.center-short-memory .memory-title {
  margin-bottom: 0;
}

.center-short-memory .message-list {
  max-height: 220px;
  padding: 10px 12px 12px;
  background: transparent;
}

.center-story {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 16px;
  background: transparent;
  position: relative;
  min-height: 0;
}

.center-story-inner {
  border-radius: var(--gv-radius-sm);
  border: 1px solid var(--gv-border);
  background: var(--surface-1);
  padding: 18px 20px;
  min-height: 100%;
}

.center-story .story-list {
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.center-story .story-item {
  background: transparent;
  border: none;
  padding: 0;
}

.center-story .story-text {
  line-height: 1.8;
  color: var(--text-2);
  font-size: 15px;
}

.center-action {
  padding: 8px 10px 10px;
  border-top: 1px solid var(--gv-border);
  background: transparent;
}

.short-memory {
  border-radius: var(--gv-radius-sm);
  border: 1px solid var(--gv-border);
  background: var(--gv-surface-2);
  padding: 12px;
}

.memory-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  margin-bottom: 0;
  color: var(--accent-solid);
  font-weight: 900;
}

.memory-toggle {
  appearance: none;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.55);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.memory-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}

.collapse-btn {
  appearance: none;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.collapse-btn:hover {
  background: var(--surface-2);
}

.collapse-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.chev {
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 160ms ease;
  line-height: 1;
}

.chev.expanded {
  transform: rotate(90deg);
}

.memory-body {
  overflow: hidden;
}

.memory-collapsed-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 6px 2px 0;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 180ms ease, opacity 180ms ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 220px;
  opacity: 1;
}

.link-btn {
  appearance: none;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
  color: rgba(0, 0, 0, 0.55);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
}

.link-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.link-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 220px;
  overflow: auto;
}

.message-empty {
  color: var(--text-muted);
  padding: 10px;
}

.message-item {
  border-radius: 10px;
  border: 1px solid var(--gv-border);
  background: var(--surface-1);
  padding: 10px 12px;
  display: grid;
  gap: 10px;
}

.message-time {
  font-size: 12px;
  color: var(--text-3);
}

.message-content {
  color: var(--text-1);
  line-height: 1.6;
  white-space: pre-wrap;
}

.choice-panel {
  padding: 10px 0 8px;
}

.choice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.choice-title {
  font-weight: 700;
  color: var(--text-1);
}

.choice-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.choice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.choice-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  background: linear-gradient(120deg, rgba(124, 77, 255, 0.18), rgba(46, 92, 184, 0.16));
  color: #1f2f5c;
  font-size: 14px;
  font-weight: 900;
  border: 1px solid rgba(124, 77, 255, 0.32);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.choice-btn:hover {
  background: linear-gradient(120deg, rgba(124, 77, 255, 0.24), rgba(46, 92, 184, 0.22));
}

.choice-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.choice-count {
  font-size: 12px;
  color: var(--text-2);
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  padding: 2px 8px;
  border-radius: 999px;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.message-count {
  font-size: 12px;
  color: var(--text-2);
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  padding: 2px 8px;
  border-radius: 999px;
}

.right-sidebar {
  width: 280px;
  background: var(--gv-surface);
  border: 1px solid var(--gv-border);
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: var(--gv-radius);
  box-shadow: var(--gv-shadow);
  backdrop-filter: blur(14px);
  color: var(--text-2);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main-content-area:not(.right-collapsed) .right-sidebar {
  border-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.right-sidebar.collapsed {
  width: 0;
  padding: 0;
  border-left: 0;
  box-shadow: none;
  overflow: hidden;
}

.right-sidebar.collapsed > :not(.status-title) {
  display: none;
}

.edge-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.92);
  color: rgba(71, 85, 105, 0.92);
  width: 34px;
  height: 46px;
  border-radius: 12px;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: none;
  z-index: 20;
  backdrop-filter: none;
  font-size: 18px;
  font-weight: 900;
}

.edge-toggle:hover {
  background: rgba(241, 245, 249, 0.96);
  border-color: rgba(148, 163, 184, 0.36);
}

.edge-left {
  left: 0;
}

.edge-right {
  right: 0;
}

.right-sidebar.collapsed .status-text-title,
.right-sidebar.collapsed .status-bars,
.right-sidebar.collapsed .card,
.right-sidebar.collapsed .cards,
.right-sidebar.collapsed .status-title span:not(.functions-icon),
.right-sidebar.collapsed .status-title + * {
  display: none;
}

.right-sidebar.collapsed .status-title {
  justify-content: center;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-1);
  font-weight: 900;
}

.status-bars {
  display: grid;
  gap: 12px;
}

.status-bar {
  display: grid;
  gap: 8px;
  padding: 10px 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
}

.status-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status-name {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
}

.status-ico {
  width: 18px;
  text-align: center;
  opacity: 0.95;
}

.status-value {
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.status-progress {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
}

.realm-status {
  border-radius: var(--gv-radius-sm);
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
}

.realm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--text-1);
  font-weight: 900;
  font-size: 14px;
}

.realm-content {
  display: grid;
  gap: 10px;
}

.realm-name {
  font-size: 16px;
  color: var(--text-1);
  font-weight: 900;
}

.realm-desc {
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.5;
}

.realm-action {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 8px;
  background: var(--surface-3);
}

.fame {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
}

.fame-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-1);
  font-weight: 900;
  font-size: 14px;
}

.fame-value {
  color: var(--text-2);
  font-weight: 800;
}

.card {
  border-radius: var(--gv-radius-sm);
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--text-1);
  font-weight: 900;
  font-size: 14px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-item {
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  padding: 8px 10px;
}

.card-item[type='button'] {
  cursor: pointer;
  text-align: left;
}

.card-item[type='button']:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(124, 58, 237, 0.28);
}

.card-item.muted {
  color: var(--text-2);
}

@media (max-width: 960px) {
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 760px) {
  .left-sidebar {
    display: none;
  }
  .nav-center {
    display: none;
  }
}

.story-panel {
  margin-top: 0;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  padding: 14px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.story-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-1);
}

.story-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.story-item {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  padding: 12px;
  display: grid;
  gap: 8px;
  background: var(--surface-3);
}

.story-item.user {
  border-color: rgba(52, 211, 153, 0.25);
}

.story-item.assistant {
  border-color: rgba(147, 197, 253, 0.25);
}

.story-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.story-role {
  color: var(--text-2);
}

.story-text {
  white-space: pre-wrap;
  line-height: 1.6;
}

.text-normal {
  color: var(--text-1);
}

.judgement-card {
  margin: 10px 0;
  border-radius: 14px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.judgement-card.is-success {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}

.judgement-card.is-failure {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.06);
}

.judgement-card.is-great-success {
  border-color: rgba(16, 185, 129, 0.55);
}

.judgement-card.is-great-failure {
  border-color: rgba(220, 38, 38, 0.55);
}

.judgement-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.judgement-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
  display: grid;
  place-items: center;
  color: var(--text-1);
}

.judgement-card.is-success .judgement-icon {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
}

.judgement-card.is-failure .judgement-icon {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
}

.judgement-main {
  display: grid;
  gap: 2px;
}

.judgement-title {
  font-weight: 900;
  color: var(--text-1);
}

.judgement-result {
  font-size: 12px;
  color: var(--text-muted);
}

.judgement-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.judgement-stats .stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid var(--gv-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
  font-size: 12px;
}

.judgement-stats .stat-label {
  color: var(--text-muted);
}

.judgement-stats .stat-value {
  font-weight: 800;
}

.judgement-details {
  border-top: 1px dashed var(--gv-border);
  padding-top: 8px;
  display: grid;
  gap: 6px;
}

.judgement-details .detail-item {
  font-size: 12px;
  color: var(--text-2);
  white-space: pre-wrap;
}

.action-panel {
  margin-top: 0;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.queue-panel {
  border-radius: 10px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 10px 10px 8px;
  display: grid;
  gap: 6px;
}

.queue-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.queue-title {
  color: var(--accent-solid);
  font-size: 12px;
  font-weight: 900;
}

.queue-close {
  appearance: none;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.55);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.queue-close:hover {
  background: rgba(0, 0, 0, 0.04);
}

.queue-count {
  color: var(--text-muted);
  font-weight: 500;
}

.queue-actions {
  display: flex;
  gap: 8px;
}

.queue-btn {
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-1);
  border-radius: 999px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}

.queue-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 56px;
  overflow: auto;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  padding: 6px 8px;
}

.queue-text {
  color: var(--text-1);
  font-size: 12px;
  line-height: 1.35;
}

.queue-x {
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
  color: rgba(0, 0, 0, 0.55);
  border-radius: 10px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.queue-x:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-input-row {
  display: grid;
  grid-template-columns: 1fr 56px;
  gap: 8px;
  align-items: center;
}

.action-title {
  color: var(--ok);
}

.action-input {
  width: 100%;
  min-height: 34px;
  max-height: 34px;
  resize: none;
  border-radius: 10px;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  padding: 6px 10px;
  outline: none;
  line-height: 1.2;
}

.action-input:focus {
  border-color: rgba(124, 58, 237, 0.5);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
}

.send-btn {
  appearance: none;
  border: 1px solid var(--gv-border);
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-1);
  border-radius: 10px;
  height: 34px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.send-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.send-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.quick-btn {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
}

.quick-btn:hover {
  background: var(--surface-2);
}

.quick-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-strong);
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-btn {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-error {
  color: var(--err);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-error-text {
  flex: 1;
  min-width: 0;
}

.gv-toast {
  position: fixed;
  left: 50%;
  top: 16px;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--gv-border);
  background: var(--surface-1);
  color: var(--text-1);
  box-shadow: var(--gv-shadow);
  font-size: 14px;
  max-width: min(560px, calc(100vw - 24px));
  text-align: center;
}

.gv-toast.success {
  border-color: rgba(34, 197, 94, 0.35);
}

.gv-toast.error {
  border-color: rgba(255, 41, 41, 0.35);
}

.gv-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  z-index: 2100;
  padding: 18px;
}

.gv-dialog {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  border: 1px solid var(--gv-border);
  background: var(--surface-1);
  box-shadow: var(--gv-shadow);
  padding: 16px;
}

.gv-dialog-title {
  font-weight: 800;
  color: var(--text-1);
  font-size: 16px;
  margin-bottom: 8px;
}

.gv-dialog-message {
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.gv-dialog-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.gv-dialog-sub.ok {
  color: var(--ok);
}

.gv-dialog-sub.err {
  color: var(--err);
}

.gv-dialog-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
