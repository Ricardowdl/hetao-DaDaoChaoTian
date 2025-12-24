<template>
  <div class="creation-container">
    <div class="bg-layer" />

    <div class="header">
      <div class="mode-badge">单机模式</div>
      <div class="header-actions">
        <button class="action-btn" type="button" @click="alertUnavailable">暂不可用</button>
        <button class="action-btn" type="button" @click="handleSavePreset">存储预设</button>
        <button class="action-btn" type="button" @click="handleLoadPreset">加载预设</button>
        <button class="action-btn" type="button" @click="handleClearCustom">清除自定义</button>
      </div>
      <div class="header-icons">
        <button class="icon-tile" type="button" title="全屏" @click="uiStore.toggleFullscreen()">⛶</button>
        <button class="icon-tile" type="button" title="帮助" @click="showHelp">？</button>
        <button class="icon-tile mobile-only" type="button" title="更多操作" @click="mobileMoreOpen = true">⋯</button>
      </div>
    </div>

    <div class="mobile-stepper">
      <div class="mobile-stepper-text">步骤 {{ currentStep }} / {{ steps.length }}：{{ currentStepInfo.label }}</div>
      <div class="mobile-stepper-bar">
        <div class="mobile-stepper-bar-inner" :style="{ width: stepProgress + '%' }" />
      </div>
    </div>

    <div v-if="mobileMoreOpen" class="mobile-sheet-overlay" @click.self="mobileMoreOpen = false">
      <div class="mobile-sheet" @click.stop>
        <div class="mobile-sheet-head">
          <div class="mobile-sheet-title">更多操作</div>
          <button class="icon-tile" type="button" title="关闭" @click="mobileMoreOpen = false">✕</button>
        </div>

        <div class="mobile-sheet-body">
          <button class="mobile-sheet-btn" type="button" @click="alertUnavailable(); mobileMoreOpen = false">暂不可用</button>
          <button class="mobile-sheet-btn" type="button" @click="handleSavePreset(); mobileMoreOpen = false">存储预设</button>
          <button class="mobile-sheet-btn" type="button" @click="handleLoadPreset(); mobileMoreOpen = false">加载预设</button>
          <button class="mobile-sheet-btn" type="button" @click="handleClearCustom(); mobileMoreOpen = false">清除自定义</button>
          <button class="mobile-sheet-btn" type="button" @click="uiStore.toggleFullscreen(); mobileMoreOpen = false">全屏</button>
          <button class="mobile-sheet-btn" type="button" @click="showHelp(); mobileMoreOpen = false">帮助</button>
        </div>
      </div>
    </div>

    <div v-if="aiTalentModalVisible" class="modal-overlay" @click.self="closeAiTalentModal">
      <div class="modal-card ai-gen-modal">
        <div class="modal-header">
          <div class="modal-title ai-gen-title">AI推演</div>
          <button class="icon-tile" type="button" @click="closeAiTalentModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <div class="modal-label">请输入你想生成什么内容：</div>
            <textarea class="modal-textarea ai-gen-textarea" v-model.trim="aiTalentPrompt" placeholder="例如：能够看透事物本质的天眼神通..." />
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" :disabled="aiTalentGenerating" @click="closeAiTalentModal">取消</button>
          <button class="action-btn ai-gen-primary" type="button" :disabled="aiTalentGenerating" @click="startAiGenerateTalent">
            {{ aiTalentGenerating ? '天机推演中，请稍候...' : '开始推演' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="aiRootModalOpen" class="modal-overlay" @click.self="closeAiRootModal">
      <div class="modal-card ai-gen-modal">
        <div class="modal-header">
          <div class="modal-title ai-gen-title">AI推演</div>
          <button class="icon-tile" type="button" @click="closeAiRootModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <div class="modal-label">请输入你想生成什么内容：</div>
            <textarea class="modal-textarea ai-gen-textarea" v-model.trim="aiRootPrompt" placeholder="例如：罕见的雷属性变异灵根，天生引雷..." />
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" :disabled="aiRootGenerating" @click="closeAiRootModal">取消</button>
          <button class="action-btn ai-gen-primary" type="button" :disabled="aiRootGenerating" @click="startAiGenerateRoot">
            {{ aiRootGenerating ? '天机推演中，请稍候...' : '开始推演' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="aiOriginModalOpen" class="modal-overlay" @click.self="closeAiOriginModal">
      <div class="modal-card ai-gen-modal">
        <div class="modal-header">
          <div class="modal-title ai-gen-title">AI推演</div>
          <button class="icon-tile" type="button" @click="closeAiOriginModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <div class="modal-label">请输入你想生成什么内容：</div>
            <textarea class="modal-textarea ai-gen-textarea" v-model.trim="aiOriginPrompt" placeholder="例如：名门望族、寒门苦修、弃子重生..." />
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" :disabled="aiOriginGenerating" @click="closeAiOriginModal">取消</button>
          <button class="action-btn ai-gen-primary" type="button" :disabled="aiOriginGenerating" @click="startAiGenerateOrigin">
            {{ aiOriginGenerating ? '天机推演中，请稍候...' : '开始推演' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="aiTierModalOpen" class="modal-overlay" @click.self="closeAiTierModal">
      <div class="modal-card ai-gen-modal">
        <div class="modal-header">
          <div class="modal-title ai-gen-title">AI推演</div>
          <button class="icon-tile" type="button" @click="closeAiTierModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <div class="modal-label">请输入你想生成什么内容：</div>
            <textarea class="modal-textarea ai-gen-textarea" v-model.trim="aiTierPrompt" placeholder="例如：作为一个小说角色的天资，从凡人到仙帝..." />
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" :disabled="aiTierGenerating" @click="closeAiTierModal">取消</button>
          <button class="action-btn ai-gen-primary" type="button" :disabled="aiTierGenerating" @click="startAiGenerateTier">
            {{ aiTierGenerating ? '天机推演中，请稍候...' : '开始推演' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="aiModalOpen" class="modal-overlay" @click.self="closeAiModal">
      <div class="modal-card ai-gen-modal">
        <div class="modal-header">
          <div class="modal-title ai-gen-title">AI推演</div>
          <button class="icon-tile" type="button" @click="closeAiModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <div class="modal-label">请描述你想生成什么内容：</div>
            <textarea
              class="modal-textarea ai-gen-textarea"
              v-model.trim="aiPrompt"
              placeholder="例如：生成一个火属性的天赋，适合剑修..."
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" :disabled="aiGenerating" @click="closeAiModal">取消</button>
          <button class="action-btn ai-gen-primary" type="button" :disabled="aiGenerating" @click="startAiGenerateWorld">
            {{ aiGenerating ? '天机推演中，请稍候...' : '开始推演' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="customModalOpen" class="modal-overlay" @click.self="closeCustomModal">
      <div class="modal-card" :class="{ 'aptitude-modal': currentStep === 2, 'origin-modal': currentStep === 3, 'root-modal': currentStep === 4, 'talent-modal': currentStep === 5 }">
        <div class="modal-header">
          <div class="modal-title">{{ modalTitle }}</div>
          <button class="icon-tile" type="button" @click="closeCustomModal">×</button>
        </div>

        <div class="modal-body">
          <template v-if="currentStep === 1">
            <div class="modal-field">
              <div class="modal-label">世界名称</div>
              <input class="modal-input" v-model.trim="customForm.名称" placeholder="例如：九霄界" />
            </div>
            <div class="modal-field">
              <div class="modal-label">时代背景</div>
              <input class="modal-input" v-model.trim="customForm.纪元" placeholder="例如：仙道昌隆" />
            </div>
            <div class="modal-field">
              <div class="modal-label">世界描述</div>
              <textarea class="modal-textarea" v-model.trim="customForm.描述" placeholder="描述这个世界的背景故事、修炼体系特点等..." />
            </div>
          </template>

          <template v-else-if="currentStep === 2">
            <div class="modal-field">
              <div class="modal-label">天资名称</div>
              <input class="modal-input" v-model.trim="customForm.名称" placeholder="例如：凡人" />
            </div>
            <div class="modal-field">
              <div class="modal-label">天资描述</div>
              <textarea class="modal-textarea" v-model.trim="customForm.描述" placeholder="描述此天资的特点..." />
            </div>
            <div class="modal-field">
              <div class="modal-label">天道点</div>
              <input class="modal-input" type="number" v-model.number="customForm.点数" placeholder="例如：10" />
            </div>
            <div class="modal-field">
              <div class="modal-label">稀有度</div>
              <input class="modal-input" type="number" v-model.number="customForm.稀有度" placeholder="1-10，数值越高越稀有" />
            </div>
            <div class="modal-field">
              <div class="modal-label">辉光颜色</div>
              <div class="aptitude-color-row">
                <input class="modal-input" v-model.trim="customForm.颜色" placeholder="例如：#808080" />
                <input class="aptitude-color-picker" type="color" v-model="customForm.颜色" />
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 3">
            <div class="modal-field">
              <div class="modal-label">出身名称</div>
              <input class="modal-input" v-model.trim="customForm.名称" placeholder="例如：山野遗孤" />
            </div>

            <div class="modal-field">
              <div class="modal-label">出身描述</div>
              <textarea class="modal-textarea" v-model.trim="customForm.描述" placeholder="描述此出身的背景故事和成长经历..." />
            </div>

            <div class="modal-field">
              <div class="modal-label">天道点消耗</div>
              <input class="modal-input" type="number" v-model.number="customForm.天赋点" placeholder="选择此出身需要消耗的天道点，可为负数表示奖励" />
            </div>

            <div class="modal-field">
              <div class="modal-label">稀有度</div>
              <input class="modal-input" type="number" v-model.number="customForm.稀有度" placeholder="1-10，数值越高越稀有" />
            </div>

            <div class="origin-box">
              <div class="origin-box-header">
                <div class="origin-box-title">属性修正</div>
                <button class="origin-add-btn" type="button" @click="addOriginAttrRow">+ 添加</button>
              </div>
              <div class="origin-box-body">
                <div v-if="!customForm.属性修正列表 || customForm.属性修正列表.length === 0" class="origin-empty">暂无数据</div>
                <div v-else class="origin-list">
                  <div v-for="(row, idx) in customForm.属性修正列表" :key="idx" class="origin-row">
                    <select class="modal-input" v-model="row.attribute">
                      <option v-for="k in attributeKeys" :key="k" :value="k">{{ k }}</option>
                    </select>
                    <input class="modal-input" v-model.trim="row.value" placeholder="修正值（可为负数）" />
                    <button class="mini-icon-btn danger" type="button" title="删除" @click="removeOriginAttrRow(idx)">🗑</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="origin-box">
              <div class="origin-box-header">
                <div class="origin-box-title">背景效果</div>
                <button class="origin-add-btn" type="button" @click="addOriginEffectRow">+ 添加</button>
              </div>
              <div class="origin-box-body">
                <div v-if="!customForm.背景效果列表 || customForm.背景效果列表.length === 0" class="origin-empty">暂无数据</div>
                <div v-else class="origin-list">
                  <div v-for="(row, idx) in customForm.背景效果列表" :key="idx" class="origin-row origin-row-effect">
                    <input class="modal-input" v-model.trim="row.type" placeholder="效果类型（如：技能、资源、关系）" />
                    <input class="modal-input" v-model.trim="row.description" placeholder="效果描述" />
                    <button class="mini-icon-btn danger" type="button" title="删除" @click="removeOriginEffectRow(idx)">🗑</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 4">
            <div class="modal-field">
              <div class="modal-label">灵根名称</div>
              <input class="modal-input" v-model.trim="customForm.名称" placeholder="例如：混沌灵根" />
            </div>

            <div class="modal-field">
              <div class="modal-label">品级</div>
              <select class="modal-input" v-model="customForm.品级">
                <option value="">请选择</option>
                <option v-for="t in rootTierOptions" :key="t.key" :value="t.key">{{ t.name }}</option>
              </select>
            </div>

            <div class="modal-field">
              <div class="modal-label">灵根描述</div>
              <textarea class="modal-textarea" v-model.trim="customForm.描述" placeholder="描述这个灵根的特性和背景故事..." />
            </div>

            <div class="modal-field">
              <div class="modal-label">修炼速度</div>
              <input class="modal-input" v-model.trim="customForm.修炼速度" placeholder="例如：极快、快速、普通、缓慢" />
            </div>

            <div class="modal-field">
              <div class="modal-label">修炼倍率</div>
              <input class="modal-input" v-model.trim="customForm.修炼倍率" placeholder="例如：1.5" />
            </div>

            <div class="modal-field">
              <div class="modal-label">消耗天道点</div>
              <input class="modal-input" v-model.trim="customForm.消耗" placeholder="例如：10" />
            </div>

            <div class="modal-field">
              <div class="modal-label">稀有度</div>
              <input class="modal-input" v-model.trim="customForm.稀有度" placeholder="1-10，数值越高越稀有" />
            </div>

            <div class="root-box">
              <div class="root-box-header">
                <div class="root-box-title">特殊效果</div>
                <button class="root-add-btn" type="button" @click="addRootEffectRow">+ 添加</button>
              </div>
              <div class="root-box-body">
                <div v-if="!customForm.特殊效果列表 || customForm.特殊效果列表.length === 0" class="root-empty">暂无数据</div>
                <div v-else class="root-list">
                  <div v-for="(row, idx) in customForm.特殊效果列表" :key="idx" class="root-row">
                    <input class="modal-input" v-model.trim="row.effect" placeholder="效果描述，如：雷系法术威力+80%" />
                    <button class="mini-icon-btn danger" type="button" title="删除" @click="removeRootEffectRow(idx)">🗑</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 5">
            <div class="modal-field">
              <div class="modal-label">天赋名称</div>
              <input class="modal-input" v-model.trim="customForm.名称" placeholder="例如：道心天成" />
            </div>

            <div class="modal-field">
              <div class="modal-label">天赋描述</div>
              <textarea class="modal-textarea" v-model.trim="customForm.描述" placeholder="描述此天赋的本质..." />
            </div>

            <div class="modal-field">
              <div class="modal-label">天道点消耗</div>
              <input class="modal-input" v-model.trim="customForm.消耗" placeholder="例如：3" />
            </div>

            <div class="modal-field">
              <div class="modal-label">稀有度</div>
              <input class="modal-input" v-model.trim="customForm.稀有度" placeholder="1-10，数值越高越稀有" />
            </div>

            <div class="talent-box">
              <div class="talent-box-header">
                <div class="talent-box-title">天赋效果</div>
                <button class="talent-add-btn" type="button" @click="addTalentEffectRow">+ 添加</button>
              </div>
              <div class="talent-box-body">
                <div v-if="!customForm.天赋效果列表 || customForm.天赋效果列表.length === 0" class="talent-empty">暂无数据</div>
                <div v-else class="talent-list">
                  <div v-for="(row, idx) in customForm.天赋效果列表" :key="idx" class="talent-row">
                    <select class="modal-input" v-model="row.类型">
                      <option value="">效果类型</option>
                      <option v-for="t in talentEffectTypeOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                    <input class="modal-input" v-model.trim="row.目标" placeholder="目标（如：根骨、悟性）" />
                    <input class="modal-input" v-model.trim="row.数值" placeholder="数值（如：+2、+10%）" />
                    <button class="mini-icon-btn danger" type="button" title="删除" @click="removeTalentEffectRow(idx)">🗑</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="modal-field"><div class="modal-label">名称</div><input class="modal-input" v-model.trim="customForm.名称" /></div>
            <div class="modal-field"><div class="modal-label">描述</div><textarea class="modal-textarea" v-model.trim="customForm.描述" /></div>
          </template>
        </div>

        <div class="modal-footer">
          <button class="action-btn" type="button" @click="closeCustomModal">{{ modalCancelText }}</button>
          <button class="action-btn" type="button" @click="saveCustomModal">{{ modalOkText }}</button>
        </div>
      </div>
    </div>

    <div class="step-row">
      <div v-for="step in steps" :key="step.number" class="step-item">
        <div class="step-indicator" :class="stepIndicatorClass(step.number)">
          {{ step.number }}
        </div>
        <div class="step-label">{{ step.label }}</div>
      </div>
    </div>

    <div class="main-panel">
      <div class="main-content" :class="{ 'preview-only': currentStep >= 6 }">
        <div v-if="currentStep < 6" class="sidebar" :class="{ 'world-sidebar': currentStep === 1 }">
          <div class="tab-row" :class="{ 'world-tabs': currentStep === 1 }">
            <button
              class="tab-button"
              :class="{ active: sidebarMode === 'custom' }"
              type="button"
              @click="handleCustomWorldAction"
            >
              {{
                currentStep === 2
                  ? '自定义天资'
                  : currentStep === 3
                    ? '自定义出身'
                    : currentStep === 4
                      ? '高级自定义'
                      : currentStep === 5
                        ? '自定义天赋'
                      : '自定义世界'
              }}
            </button>
            <button class="tab-button" :class="{ active: sidebarMode === 'ai' }" type="button" @click="handleAIWorldAction">AI推演</button>
          </div>

          <div class="ai-panel" v-if="sidebarMode === 'ai' && currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5">
            <div class="ai-hint">使用自定义API进行推演（设置中配置 URL / Key）</div>
            <textarea class="ai-input" v-model.trim="aiPrompt" placeholder="请输入推演主题，例如：赛博朋克世界、名门望族出身、雷系变异灵根..." />
            <button class="action-btn" type="button" @click="handleAIGenerate">开始推演</button>
          </div>

          <div v-if="currentStep === 4" class="tab-row">
            <button class="tab-button" :class="{ active: rootSelectMode === 'preset' }" type="button" @click="rootSelectMode = 'preset'">
              预设灵根
            </button>
            <button class="tab-button" :class="{ active: rootSelectMode === 'combo' }" type="button" @click="rootSelectMode = 'combo'">
              组合选择
            </button>
          </div>

          <div v-if="currentStep === 4 && rootSelectMode === 'combo'" class="combo-panel">
            <div class="combo-section">
              <div class="combo-title">灵根类型</div>
              <div class="combo-grid">
                <button
                  v-for="t in rootTypeOptions"
                  :key="t.key"
                  class="combo-btn"
                  :class="{ selected: comboRoot.type === t.key }"
                  type="button"
                  @click="comboRoot.type = t.key"
                >
                  <span class="combo-icon">{{ t.icon }}</span>
                  <span class="combo-name">{{ t.name }}</span>
                </button>
              </div>
            </div>

            <div class="combo-section">
              <div class="combo-title">品级</div>
              <div class="combo-grid">
                <button
                  v-for="t in rootTierOptions"
                  :key="t.key"
                  class="combo-btn"
                  :class="{ selected: comboRoot.tier === t.key }"
                  type="button"
                  @click="comboRoot.tier = t.key"
                >
                  <span class="combo-name">{{ t.name }}</span>
                  <span class="combo-sub">{{ t.cost }} 点</span>
                </button>
              </div>
            </div>

            <div class="combo-preview">
              <div class="combo-preview-title">预览</div>
              <div class="combo-preview-line">{{ comboPreviewName }}</div>
              <div class="combo-preview-line" v-if="comboPreviewTier">【{{ comboPreviewTier }}】 消耗：{{ comboPreviewCost }} 点</div>
              <div class="combo-preview-desc">{{ comboPreviewDesc }}</div>
              <button class="action-btn" type="button" :disabled="!canCreateComboRoot" @click="createComboRoot">生成并选择</button>
            </div>
          </div>

          <div class="option-list" :class="{ 'world-list': currentStep === 1 }" v-if="currentStep !== 4 || rootSelectMode === 'preset'">
            <template v-if="currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5">
              <div
                v-for="opt in currentOptions"
                :key="opt.id"
                class="option-item option-item-inline"
                :class="{ selected: isOptionSelected(opt.id) }"
                role="button"
                tabindex="0"
                @click="selectOption(opt.id)"
              >
                <span class="option-title">{{ optionTitle(opt) }}</span>

                <div class="option-right">
                  <span class="option-points" v-if="optionPoints(opt) !== null">{{ optionPoints(opt) }} 点</span>
                  <div class="option-actions" v-if="isCustomId(opt.id)">
                    <button class="mini-icon-btn" type="button" title="编辑" @click.stop="openCustomEditById(opt.id)">✎</button>
                    <button class="mini-icon-btn danger" type="button" title="删除" @click.stop="deleteCustomById(opt.id)">🗑</button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <button
                v-for="opt in currentOptions"
                :key="opt.id"
                class="option-item"
                :class="{ selected: isOptionSelected(opt.id) }"
                type="button"
                @click="selectOption(opt.id)"
              >
                <span class="option-title">{{ optionTitle(opt) }}</span>
                <span class="option-points" v-if="optionPoints(opt) !== null">{{ optionPoints(opt) }} 点</span>
              </button>
            </template>
          </div>
        </div>

        <div class="detail">
          <div v-if="currentStep === 1" class="detail-inner">
            <div class="detail-header">
              <h2 class="detail-title">{{ draft.世界?.名称 || '请选择世界' }}</h2>
              <button class="ghost-btn" type="button" @click="showWorldSettings = !showWorldSettings">设置</button>
            </div>

            <template v-if="draft.世界 && showWorldSettings">
              <div class="world-config">
                <div class="world-config-title">世界规模配置</div>
                <div class="world-config-shell">
                  <div class="world-config-grid" v-if="draft.世界规模">
                    <div class="cfg-item">
                      <div class="cfg-k">主要势力</div>
                      <input class="input cfg-input" type="number" min="1" max="30" v-model.number="draft.世界规模.factionCount" @change="ensureWorldCounts" />
                      <div class="cfg-sub">推荐：3-8</div>
                    </div>
                    <div class="cfg-item">
                      <div class="cfg-k">地点总数</div>
                      <input class="input cfg-input" type="number" min="3" max="60" v-model.number="draft.世界规模.locationCount" @change="ensureWorldCounts" />
                      <div class="cfg-sub">推荐：8-20</div>
                    </div>
                    <div class="cfg-item">
                      <div class="cfg-k">绝境数量</div>
                      <input class="input cfg-input" type="number" min="0" max="60" v-model.number="draft.世界规模.secretRealmsCount" @change="ensureWorldCounts" />
                      <div class="cfg-sub">≤ 地点总数</div>
                    </div>
                    <div class="cfg-item">
                      <div class="cfg-k">大陆数量</div>
                      <input class="input cfg-input" type="number" min="1" max="12" v-model.number="draft.世界规模.continentCount" @change="ensureWorldCounts" />
                      <div class="cfg-sub">推荐：2-6</div>
                    </div>
                  </div>
                </div>

                <div class="world-config-actions">
                  <button class="action-btn" type="button" @click="randomWorldCounts">随机</button>
                  <button class="action-btn" type="button" @click="resetWorldCounts">重置</button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="detail-sub" v-if="draft.世界">【{{ draft.世界.纪元 }}】</div>
              <div class="detail-text">
                {{ draft.世界?.描述 || '请选择角色所在的修仙世界。' }}
              </div>
            </template>
          </div>

          <div v-else-if="currentStep === 2" class="detail-inner">
            <div class="detail-header">
              <h2 class="detail-title">{{ draft.天资?.名称 || '请选择天资' }}</h2>
            </div>

            <div class="detail-sub" v-if="draft.天资">【{{ draft.天资.品级 }}】</div>
            <div class="detail-text">{{ draft.天资?.描述 || '天资影响角色初始属性与修炼潜力。' }}</div>
            <div class="meta-grid" v-if="draft.天资">
              <div class="meta-item">
                <div class="meta-k">总天道点</div>
                <div class="meta-v">{{ heavenTotalPoints }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">出身消耗</div>
                <div class="meta-v">{{ originCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">剩余</div>
                <div class="meta-v">{{ remainingHeavenPoints }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 3" class="detail-inner">
            <div class="detail-header">
              <h2 class="detail-title">{{ draft.出身?.名称 || '请选择出身' }}</h2>
            </div>

            <div class="detail-sub" v-if="draft.出身">【{{ draft.出身.品级 }}】</div>
            <div class="detail-text">{{ draft.出身?.描述 || '出身影响角色初始属性与修炼潜力。' }}</div>
            <div class="meta-grid" v-if="draft.出身">
              <div class="meta-item">
                <div class="meta-k">总天道点</div>
                <div class="meta-v">{{ heavenTotalPoints }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">出身消耗</div>
                <div class="meta-v">{{ originCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">剩余</div>
                <div class="meta-v">{{ remainingHeavenPoints }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 4" class="detail-inner center">
            <h2 class="detail-title">{{ draft.灵根?.名称 || '请选择灵根' }}</h2>
            <div class="detail-sub" v-if="draft.灵根">【{{ draft.灵根.品级 }}】</div>
            <div class="detail-text">{{ draft.灵根?.描述 || '灵根影响修炼体系与后续属性分配。' }}</div>
            <div class="meta-grid" v-if="draft.天资">
              <div class="meta-item">
                <div class="meta-k">总天道点</div>
                <div class="meta-v">{{ heavenTotalPoints }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">出身消耗</div>
                <div class="meta-v">{{ originCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">灵根消耗</div>
                <div class="meta-v">{{ rootCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">剩余</div>
                <div class="meta-v">{{ remainingHeavenPoints }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 5" class="detail-inner">
            <div class="detail-header">
              <h2 class="detail-title">神通择定</h2>
              <div class="detail-sub">可选 1-3 个，总消耗不超过剩余天道点</div>
            </div>
            <div class="detail-text">已选：{{ draft.天赋.length }} / 3</div>
            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-k">总天道点</div>
                <div class="meta-v">{{ heavenTotalPoints }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">出身消耗</div>
                <div class="meta-v">{{ originCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">灵根消耗</div>
                <div class="meta-v">{{ rootCost }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">天赋消耗</div>
                <div class="meta-v">{{ talentCostUsed }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-k">剩余</div>
                <div class="meta-v">{{ remainingHeavenPoints }}</div>
              </div>
            </div>
            <div class="detail-text" v-if="selectedTalentDetail">当前：{{ selectedTalentDetail.描述 }}</div>
            <div class="detail-text" v-else>在左侧点击天赋以选择/取消。</div>
          </div>

          <div v-else-if="currentStep === 6" class="detail-inner">
            <div class="detail-header">
              <h2 class="detail-title">先天六司分配</h2>
              <div class="point-badge">剩余天道点：{{ remainingHeavenPoints }}</div>
            </div>
            <div class="slider-list">
              <div v-for="k in attributeKeys" :key="k" class="attribute-slider">
                <div class="attr-left">
                  <div class="attr-title">{{ k }}</div>
                  <div class="attr-desc">{{ attributeDesc(k) }}</div>
                </div>
                <div class="attr-right">
                  <button class="round-btn" type="button" @click="bumpAttribute(k, -1)">-</button>
                  <input class="range" type="range" min="0" max="10" :value="draft.先天六司[k]" @input="handleRange(k, $event)" />
                  <button class="round-btn" type="button" @click="bumpAttribute(k, 1)">+</button>
                  <div class="attr-value">{{ draft.先天六司[k] }}</div>
                </div>
              </div>
            </div>
            <div class="bottom-actions">
              <button class="action-btn" type="button" @click="resetAttributes">重置</button>
              <button class="action-btn" type="button" @click="randomAttributes">随机</button>
              <button class="action-btn" type="button" @click="balancedAttributes">均衡</button>
            </div>
          </div>

          <div v-else class="detail-inner">
            <div class="preview-header">
              <h2 class="preview-title">最终预览</h2>
              <div class="detail-sub">请确认选择，此为踏入仙途的最后一步</div>
            </div>
            <div v-if="draft.世界" class="detail-text">世界：{{ draft.世界.名称 }}【{{ draft.世界.纪元 }}】</div>
            <div v-if="draft.世界" class="detail-text">{{ draft.世界.描述 }}</div>
            <div class="form">
              <div class="field">
                <label class="label">道号</label>
                <input class="input" type="text" v-model="draft.道号" placeholder="请输入道号" />
                <div class="hint">可自定义修改</div>
              </div>

              <div class="grid3">
                <div class="field">
                  <label class="label">性别</label>
                  <select class="input" v-model="draft.性别">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label">种族</label>
                  <select class="input" v-model="draft.种族">
                    <option value="人族">人族</option>
                    <option value="妖族">妖族</option>
                    <option value="魔族">魔族</option>
                    <option value="仙族">仙族</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label">初始年龄</label>
                  <input class="input" type="number" v-model.number="draft.年龄" min="1" max="999" placeholder="16" />
                </div>
              </div>

              <div class="summary">
                <div class="sum-item"><span class="sum-k">世界</span><span class="sum-v">{{ draft.世界?.名称 || '未选择' }}</span></div>
                <div class="sum-item"><span class="sum-k">纪元</span><span class="sum-v">{{ draft.世界?.纪元 || '—' }}</span></div>
                <div class="sum-item"><span class="sum-k">天资</span><span class="sum-v">{{ draft.天资?.名称 || '未选择' }}</span></div>
                <div class="sum-item"><span class="sum-k">出身</span><span class="sum-v">{{ draft.出身?.名称 || '未选择' }}</span></div>
                <div class="sum-item"><span class="sum-k">灵根</span><span class="sum-v">{{ draft.灵根 ? `${draft.灵根.名称}（${draft.灵根.品级}）` : '未选择' }}</span></div>
                <div class="sum-item"><span class="sum-k">天赋</span><span class="sum-v">{{ draft.天赋.map((t) => t.名称).join('、') || '未选择' }}</span></div>
                <div class="sum-item"><span class="sum-k">先天六司</span><span class="sum-v">{{ attributeSummary }}</span></div>
              </div>

              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-k">总天道点</div>
                  <div class="meta-v">{{ heavenTotalPoints }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-k">出身消耗</div>
                  <div class="meta-v">{{ originCost }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-k">灵根消耗</div>
                  <div class="meta-v">{{ rootCost }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-k">天赋消耗</div>
                  <div class="meta-v">{{ talentCostUsed }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-k">六司消耗</div>
                  <div class="meta-v">{{ attributeCostUsed }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-k">剩余天道点</div>
                  <div class="meta-v">{{ remainingHeavenPoints }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="nav">
      <button class="nav-btn nav-back" type="button" :disabled="creating" @click="handlePrevOrHome">
        <span class="nav-btn-ico">‹</span>
        <span class="nav-btn-text">{{ currentStep === 1 ? '返回主页' : '上一步' }}</span>
      </button>
      <div class="nav-mid">{{ creating ? creatingText : `剩余天道点：${pointRemainingLabel}` }}</div>
      <button class="nav-btn nav-next" type="button" :disabled="nextDisabled" @click="nextStep">
        <span class="nav-btn-text">{{ currentStep === 7 ? '开启仙途' : '下一步' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useUIStore } from '../stores/useUIStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { chatCompletionText, customGenerateText } from '../services/aiClient'
import { resolveAiBaseUrl } from '../services/aiProviders'
import { runCharacterInit } from '../services/characterInit'
import { generateWorldInfo, pickInitialLocation } from '../services/worldGeneration'
import { useWorldGenErrorStore } from '../stores/useWorldGenErrorStore'
import {
  createEmptyDraft,
  loadCustomCreationData,
  saveCustomCreationData,
  clearCustomCreationData,
  getDefaultAptitudes,
  getDefaultOrigins,
  getDefaultRoots,
  getDefaultTalents,
  getDefaultWorlds,
  loadPresets,
  savePreset,
  type AptitudeOption,
  type AttributeKey,
  type CreationDraft,
  type CreationOptionsBundle,
  type OriginOption,
  type RootOption,
  type TalentOption
} from '../services/characterCreation'

const router = useRouter()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const characterStore = useCharacterStore()
const gameState = useGameStateStore()
const worldGenErrorStore = useWorldGenErrorStore()

const creating = ref(false)
const creatingText = ref('')

const mobileMoreOpen = ref(false)

const CREATION_SESSION_KEY = 'dad_creation_session_v1'

type CreationSessionPayload = {
  v: 1
  updatedAt: string
  currentStep: number
  draft: CreationDraft
  creating?: {
    startedAt: string
    stage: string
    text?: string
    input?: any
    characterId?: string
    slotKey?: string
  } | null
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function buildSessionPayload(partial?: Partial<CreationSessionPayload>): CreationSessionPayload {
  const base: CreationSessionPayload = {
    v: 1,
    updatedAt: new Date().toISOString(),
    currentStep: currentStep.value,
    draft: JSON.parse(JSON.stringify(draft)) as CreationDraft,
    creating: null
  }
  return { ...base, ...(partial || {}) }
}

function saveCreationSessionNow(partial?: Partial<CreationSessionPayload>) {
  const prev = loadCreationSession()
  const hasCreating = partial ? Object.prototype.hasOwnProperty.call(partial, 'creating') : false
  const payload = buildSessionPayload({
    ...(partial || {}),
    creating: hasCreating ? (partial as any).creating : prev?.creating || null
  })
  localStorage.setItem(CREATION_SESSION_KEY, JSON.stringify(payload))
}

function loadCreationSession(): CreationSessionPayload | null {
  const parsed = safeParseJson<CreationSessionPayload>(localStorage.getItem(CREATION_SESSION_KEY))
  if (!parsed || parsed.v !== 1) return null
  if (!parsed.draft || typeof parsed.currentStep !== 'number') return null
  return parsed
}

function clearCreationSession() {
  localStorage.removeItem(CREATION_SESSION_KEY)
}

let saveTimer: number | null = null
function scheduleSaveSession(partial?: Partial<CreationSessionPayload>) {
  if (saveTimer != null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    saveCreationSessionNow(partial)
  }, 300)
}

let wakeLockSentinel: any = null
async function requestWakeLock() {
  try {
    const anyNav: any = navigator as any
    if (!anyNav?.wakeLock?.request) return
    wakeLockSentinel = await anyNav.wakeLock.request('screen')
  } catch {
    void 0
  }
}

async function requestPersistentStorage() {
  try {
    const anyNav: any = navigator as any
    if (!anyNav?.storage?.persist) return
    await anyNav.storage.persist()
  } catch {
    void 0
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLockSentinel?.release) await wakeLockSentinel.release()
  } catch {
    void 0
  } finally {
    wakeLockSentinel = null
  }
}

const steps = [
  { number: 1, label: '诸天问道' },
  { number: 2, label: '仙缘初定' },
  { number: 3, label: '转世因果' },
  { number: 4, label: '测灵问道' },
  { number: 5, label: '神通择定' },
  { number: 6, label: '命格天成' },
  { number: 7, label: '窥天算命' }
]

const currentStep = ref(1)

const currentStepInfo = computed(() => steps.find(s => s.number === currentStep.value) || steps[0])

const stepProgress = computed(() => {
  const total = steps.length || 1
  return Math.min(100, Math.max(0, Math.round((currentStep.value / total) * 100)))
})

const baseWorlds = getDefaultWorlds()
const baseAptitudes = getDefaultAptitudes()
const baseOrigins = getDefaultOrigins()
const baseRoots = getDefaultRoots()
const baseTalents = getDefaultTalents()

const customBundle = ref<CreationOptionsBundle>(loadCustomCreationData())

const worlds = ref([...customBundle.value.worlds, ...baseWorlds])
const aptitudes = ref([...customBundle.value.aptitudes, ...baseAptitudes])
const origins = ref([...customBundle.value.origins, ...baseOrigins])
const roots = ref([...customBundle.value.roots, ...baseRoots])
const talents = ref([...customBundle.value.talents, ...baseTalents])

function refreshOptionsFromCustom() {
  customBundle.value = loadCustomCreationData()
  worlds.value = [...customBundle.value.worlds, ...baseWorlds]
  aptitudes.value = [...customBundle.value.aptitudes, ...baseAptitudes]
  origins.value = [...customBundle.value.origins, ...baseOrigins]
  roots.value = [...customBundle.value.roots, ...baseRoots]
  talents.value = [...customBundle.value.talents, ...baseTalents]
}

const draft = reactive<CreationDraft>(createEmptyDraft('单机'))

const showWorldSettings = ref(false)

let hiddenWhileCreating = false

function clampInt(n: any, min: number, max: number) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return min
  return Math.max(min, Math.min(max, v))
}

function ensureWorldCounts() {
  const fallback = createEmptyDraft('单机').世界规模
  if (!draft.世界规模 || typeof draft.世界规模 !== 'object') {
    draft.世界规模 = JSON.parse(JSON.stringify(fallback))
  }
  draft.世界规模.continentCount = clampInt(draft.世界规模.continentCount, 1, 12)
  draft.世界规模.factionCount = clampInt(draft.世界规模.factionCount, 1, 30)
  draft.世界规模.locationCount = clampInt(draft.世界规模.locationCount, 3, 60)
  draft.世界规模.secretRealmsCount = clampInt(draft.世界规模.secretRealmsCount, 0, 60)
  draft.世界规模.secretRealmsCount = Math.min(draft.世界规模.secretRealmsCount, draft.世界规模.locationCount)
}

function resetWorldCounts() {
  const base = createEmptyDraft('单机').世界规模
  draft.世界规模 = JSON.parse(JSON.stringify(base))
  ensureWorldCounts()
}

const onVisibilityOrHide = () => {
  try {
    saveCreationSessionNow()
  } catch {
    void 0
  }

  try {
    if (document.hidden && creating.value) {
      hiddenWhileCreating = true
      return
    }

    if (!document.hidden && hiddenWhileCreating) {
      hiddenWhileCreating = false
      const session = loadCreationSession()
      if (!creating.value && session?.creating?.characterId && session?.creating?.slotKey) {
        const ok = confirm('检测到你刚才切到后台/息屏。移动端浏览器可能会暂停/中断世界生成。\n\n是否从断点继续创建？')
        if (ok) {
          void resumeFromSession(session)
        }
      }
    }
  } catch {
    void 0
  }
}

onMounted(() => {
  void requestPersistentStorage()

  const session = loadCreationSession()
  if (session?.draft) {
    try {
      Object.assign(draft, JSON.parse(JSON.stringify(session.draft)) as CreationDraft)
      currentStep.value = Math.min(steps.length, Math.max(1, Math.round(session.currentStep || 1)))
      ensureWorldCounts()
    } catch {
      void 0
    }

    if (session.creating?.stage && session.creating?.characterId && session.creating?.slotKey) {
      try {
        const ok = confirm(`检测到上次创建在【${session.creating.stage}】阶段中断，是否继续？\n\n你可以选择“确定”继续点击开启仙途重试，或“取消”仅恢复填写内容。`)
        if (!ok) {
          scheduleSaveSession({ creating: null })
        }
      } catch {
        void 0
      }
    }
  }

  document.addEventListener('visibilitychange', onVisibilityOrHide)
  window.addEventListener('pagehide', onVisibilityOrHide)
})

watch(
  () => currentStep.value,
  () => {
    scheduleSaveSession()
  }
)

watch(
  draft,
  () => {
    scheduleSaveSession()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (saveTimer != null) window.clearTimeout(saveTimer)
  saveTimer = null
  document.removeEventListener('visibilitychange', onVisibilityOrHide)
  window.removeEventListener('pagehide', onVisibilityOrHide)
  void releaseWakeLock()
})

function randomWorldCounts() {
  ensureWorldCounts()
  const rand = () => Math.random()
  const continentCount = clampInt(2 + rand() * 4, 1, 12)
  const factionCount = clampInt(3 + rand() * 6, 1, 30)
  const locationCount = clampInt(8 + rand() * 14, 3, 60)
  const secretRealmsCount = clampInt(Math.min(locationCount, 3 + rand() * 6), 0, 60)
  draft.世界规模!.continentCount = continentCount
  draft.世界规模!.factionCount = factionCount
  draft.世界规模!.locationCount = locationCount
  draft.世界规模!.secretRealmsCount = Math.min(secretRealmsCount, locationCount)
}

const attributeKeys: AttributeKey[] = ['根骨', '灵性', '悟性', '气运', '魅力', '心性']

const lastClickedTalentId = ref<string | null>(null)

const sidebarMode = ref<'custom' | 'ai'>('custom')
const aiPrompt = ref('')
const aiTierPrompt = ref('')
const aiOriginPrompt = ref('')
const aiRootPrompt = ref('')
const aiTalentPrompt = ref('')
const customModalOpen = ref(false)
const customModalMode = ref<'create' | 'edit'>('create')
const customForm = reactive<any>({})

const modalTitle = computed(() => {
  if (currentStep.value === 1) return '自定义世界'
  if (currentStep.value === 2) return customModalMode.value === 'create' ? '自定义天资' : '编辑天资'
  if (currentStep.value === 3) return customModalMode.value === 'create' ? '自定义出身' : '编辑出身'
  if (currentStep.value === 4) return customModalMode.value === 'create' ? '高级自定义灵根' : '编辑灵根'
  if (currentStep.value === 5) return customModalMode.value === 'create' ? '自定义天赋' : '编辑天赋'
  return customModalMode.value === 'create' ? '新增' : '编辑'
})

const modalCancelText = computed(() => {
  if (currentStep.value === 1) return '关闭'
  if (currentStep.value === 2) return '关闭'
  if (currentStep.value === 3) return '关闭'
  if (currentStep.value === 4) return '关闭'
  if (currentStep.value === 5) return '关闭'
  return '取消'
})

const modalOkText = computed(() => {
  if (currentStep.value === 1) return '确认'
  if (currentStep.value === 2) return '确认'
  if (currentStep.value === 3) return '确认'
  if (currentStep.value === 4) return '确认'
  if (currentStep.value === 5) return '确认'
  return '保存'
})

const rootSelectMode = ref<'preset' | 'combo'>('preset')

const comboRoot = reactive<{ type: string; tier: string }>({ type: 'none', tier: 'none' })

const rootTypeOptions = [
  { key: 'fire', name: '火', icon: '🔥', desc: '烈火焚天，爆发力强' },
  { key: 'water', name: '水', icon: '💧', desc: '水流不息，绵延悠长' },
  { key: 'wood', name: '木', icon: '🌿', desc: '生生不息，治愈恢复' },
  { key: 'metal', name: '金', icon: '⚔️', desc: '锋锐无匹，切金断玉' },
  { key: 'earth', name: '土', icon: '🗿', desc: '厚德载物，防御超群' },
  { key: 'wind', name: '风', icon: '💨', desc: '风驰电掣，身法如神' },
  { key: 'thunder', name: '雷', icon: '⚡', desc: '雷霆万钧，毁天灭地' },
  { key: 'ice', name: '冰', icon: '❄️', desc: '冰霜刺骨，万物凋零' },
  { key: 'light', name: '光', icon: '☀️', desc: '光明普照，净化邪恶' },
  { key: 'dark', name: '暗', icon: '🌑', desc: '幽暗深邃，诡异莫测' },
  { key: 'space', name: '空间', icon: '🌀', desc: '虚空挪移，空间掌控' },
  { key: 'time', name: '时间', icon: '⏰', desc: '时光流转，逆转乾坤' }
]

const rootTierOptions = [
  { key: '凡品', name: '凡品', multiplier: 1, cost: 0, desc: '平平无奇的普通灵根' },
  { key: '下品', name: '下品', multiplier: 1.1, cost: 3, desc: '略有天赋，勉强可用' },
  { key: '中品', name: '中品', multiplier: 1.3, cost: 6, desc: '资质尚可，小有成就' },
  { key: 'high', name: '上品', multiplier: 1.6, cost: 10, desc: '天赋卓越，前途无量' },
  { key: 'supreme', name: '极品', multiplier: 2, cost: 15, desc: '万中无一，天之骄子' },
  { key: 'heaven', name: '仙品', multiplier: 2.4, cost: 20, desc: '天降异象，举世罕见' },
  { key: 'divine', name: '神品', multiplier: 2.8, cost: 25, desc: '神鬼莫测，逆天改命' },
  { key: '特殊', name: '特殊', multiplier: 0, cost: 0, desc: '特殊体质，另有奥妙' }
]

const talentEffectTypeOptions = ['属性加成', '技能解锁', '特殊能力', '修炼加成']

function isCustomId(id: string) {
  return id.startsWith('c_')
}

const comboPreviewName = computed(() => {
  if (comboRoot.type === 'none') return '请选择灵根类型'
  const t = rootTypeOptions.find((x) => x.key === comboRoot.type)
  return t ? `${t.name}灵根` : '未知灵根'
})

const comboPreviewTier = computed(() => {
  if (comboRoot.tier === 'none') return ''
  const t = rootTierOptions.find((x) => x.key === comboRoot.tier)
  return t?.name || ''
})

const comboPreviewCost = computed(() => {
  if (comboRoot.tier === 'none') return 0
  const t = rootTierOptions.find((x) => x.key === comboRoot.tier)
  return t?.cost ?? 0
})

const comboPreviewDesc = computed(() => {
  if (comboRoot.type === 'none') return '请选择灵根类型和品级'
  const type = rootTypeOptions.find((x) => x.key === comboRoot.type)
  const tier = rootTierOptions.find((x) => x.key === comboRoot.tier)
  if (!type) return '未知灵根'
  if (!tier || comboRoot.tier === 'none') return type.desc
  return `${tier.desc}的${type.desc}。修炼倍率约为 ${tier.multiplier}x。`
})

const canCreateComboRoot = computed(() => {
  if (comboRoot.type === 'none' || comboRoot.tier === 'none') return false
  const nextCost = comboPreviewCost.value
  const budgetIfSwap = remainingHeavenPointsAll.value + rootCost.value - nextCost
  return budgetIfSwap >= 0
})

function createComboRoot() {
  if (!canCreateComboRoot.value) {
    alert('天道点不足或选择不完整')
    return
  }
  const type = rootTypeOptions.find((x) => x.key === comboRoot.type)
  const tier = rootTierOptions.find((x) => x.key === comboRoot.tier)
  if (!type || !tier) {
    alert('选择的灵根配置无效')
    return
  }
  const id = `c_${Date.now()}`
  const item = {
    id,
    名称: `${type.name}灵根`,
    品级: tier.name,
    消耗: tier.cost,
    描述: comboPreviewDesc.value
  }
  const bundle = loadCustomCreationData()
  bundle.roots.unshift(item as any)
  saveCustomCreationData(bundle)
  refreshOptionsFromCustom()
  draft.灵根 = roots.value.find((r) => r.id === id) || null
}

function getSelectedOptionIdForStep() {
  if (currentStep.value === 1) return draft.世界?.id || null
  if (currentStep.value === 2) return draft.天资?.id || null
  if (currentStep.value === 3) return draft.出身?.id || null
  if (currentStep.value === 4) return draft.灵根?.id || null
  if (currentStep.value === 5) return lastClickedTalentId.value || null
  return null
}

const selectedIsCustom = computed(() => {
  const id = getSelectedOptionIdForStep()
  if (!id) return false
  return isCustomId(id)
})

const aiModalOpen = ref(false)
const aiGenerating = ref(false)
const aiTierModalOpen = ref(false)
const aiTierGenerating = ref(false)
const aiOriginModalOpen = ref(false)
const aiOriginGenerating = ref(false)
const aiRootModalOpen = ref(false)
const aiRootGenerating = ref(false)
const aiTalentModalVisible = ref(false)
const aiTalentGenerating = ref(false)

function openCustomCreate() {
  customModalMode.value = 'create'
  resetCustomForm()
  customModalOpen.value = true
}

function handleCustomWorldAction() {
  sidebarMode.value = 'custom'
  if (currentStep.value !== 1 && currentStep.value !== 2 && currentStep.value !== 3 && currentStep.value !== 4 && currentStep.value !== 5) return
  aiModalOpen.value = false
  aiTierModalOpen.value = false
  aiOriginModalOpen.value = false
  aiRootModalOpen.value = false
  aiTalentModalVisible.value = false
  openCustomCreate()
}

function handleAIWorldAction() {
  sidebarMode.value = 'ai'
  customModalOpen.value = false
  if (currentStep.value === 1) {
    aiTierModalOpen.value = false
    aiOriginModalOpen.value = false
    aiRootModalOpen.value = false
    aiTalentModalVisible.value = false
    aiModalOpen.value = true
    return
  }
  if (currentStep.value === 2) {
    aiModalOpen.value = false
    aiOriginModalOpen.value = false
    aiRootModalOpen.value = false
    aiTalentModalVisible.value = false
    aiTierPrompt.value = ''
    aiTierGenerating.value = false
    aiTierModalOpen.value = true
    return
  }
  if (currentStep.value === 3) {
    if (!draft.世界) {
      alert('请先选择一方大千世界，方可推演出身。')
      return
    }
    aiModalOpen.value = false
    aiTierModalOpen.value = false
    aiRootModalOpen.value = false
    aiTalentModalVisible.value = false
    aiOriginPrompt.value = ''
    aiOriginGenerating.value = false
    aiOriginModalOpen.value = true
    return
  }
  if (currentStep.value === 4) {
    aiModalOpen.value = false
    aiTierModalOpen.value = false
    aiOriginModalOpen.value = false
    aiTalentModalVisible.value = false
    aiRootPrompt.value = ''
    aiRootGenerating.value = false
    aiRootModalOpen.value = true
    return
  }
  if (currentStep.value === 5) {
    aiModalOpen.value = false
    aiTierModalOpen.value = false
    aiOriginModalOpen.value = false
    aiRootModalOpen.value = false
    aiTalentPrompt.value = ''
    aiTalentGenerating.value = false
    aiTalentModalVisible.value = true
    return
  }
  // step3+ 走侧边栏的 ai-panel
  aiModalOpen.value = false
}

function closeAiModal() {
  aiModalOpen.value = false
  aiGenerating.value = false
}

function closeAiTierModal() {
  aiTierModalOpen.value = false
  aiTierGenerating.value = false
  aiTierPrompt.value = ''
}

function closeAiOriginModal() {
  aiOriginModalOpen.value = false
  aiOriginGenerating.value = false
  aiOriginPrompt.value = ''
}

function closeAiRootModal() {
  aiRootModalOpen.value = false
  aiRootGenerating.value = false
  aiRootPrompt.value = ''
}

function closeAiTalentModal() {
  aiTalentModalVisible.value = false
  aiTalentGenerating.value = false
  aiTalentPrompt.value = ''
}

async function startAiGenerateTalent() {
  if (aiTalentGenerating.value) return
  const p = aiTalentPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }
  if (currentStep.value !== 5) return

  aiTalentGenerating.value = true
  try {
    const systemPrompt =
      '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n\n【任务】生成先天天赋\n\n【字段要求】\n- name (字符串): 4-6字的天赋名称\n- description (字符串): 30-100字的天赋描述\n'

    const text = await callCustomAI(p, systemPrompt)
    if (!text) {
      alert('AI推演失败')
      return
    }

    let data: any
    try {
      data = extractJson(text)
    } catch (e) {
      console.error('【AI推演-天赋】JSON解析失败:', e)
      alert('AI推演结果格式错误，无法解析')
      return
    }

    const name = String(data?.name || data?.名称 || '').trim()
    if (!name) {
      alert('AI推演结果缺少天赋名称')
      return
    }

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`
    const item: TalentOption = {
      id,
      名称: String(data?.name || data?.名称 || '未命名天赋'),
      描述: String(data?.description || data?.描述 || data?.说明 || ''),
      消耗: Number(data?.talent_cost || data?.点数消耗 || 1) || 1,
      稀有度: Number(data?.rarity || data?.稀有度 || 1) || 1
    }
    bundle.talents.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    lastClickedTalentId.value = id
    if (!draft.天赋.some((t) => t.id === id) && draft.天赋.length < 3) {
      selectOption(id)
    }
    closeAiTalentModal()
    alert(`AI推演完成！天赋 "${item.名称}" 已生成`)
  } catch (e) {
    console.error('【AI推演-天赋】失败:', e)
    const msg = e instanceof Error ? e.message : ''
    alert(msg ? `AI推演失败: ${msg}` : 'AI推演失败')
  } finally {
    aiTalentGenerating.value = false
  }
}

function addRootEffectRow() {
  if (!Array.isArray(customForm.特殊效果列表)) customForm.特殊效果列表 = []
  customForm.特殊效果列表.push({ effect: '' })
}

function removeRootEffectRow(idx: number) {
  if (!Array.isArray(customForm.特殊效果列表)) return
  customForm.特殊效果列表.splice(idx, 1)
}

function addTalentEffectRow() {
  if (!Array.isArray(customForm.天赋效果列表)) customForm.天赋效果列表 = []
  customForm.天赋效果列表.push({ 类型: '', 目标: '', 数值: '' })
}

function removeTalentEffectRow(idx: number) {
  if (!Array.isArray(customForm.天赋效果列表)) return
  customForm.天赋效果列表.splice(idx, 1)
}

function normalizeTalentEffects(list: any[]): Array<{ 类型: string; 目标?: string; 数值: number }> {
  if (!Array.isArray(list)) return []
  return list
    .filter((x) => String(x?.类型 || '').trim() && String(x?.数值 ?? '').trim() !== '')
    .map((x) => ({
      类型: String(x?.类型 || '').trim(),
      目标: String(x?.目标 || '').trim() || undefined,
      数值: Number(x?.数值) || 0
    }))
}

function normalizeRootEffects(list: any[]): string[] {
  if (!Array.isArray(list)) return []
  return list
    .map((x) => String(x?.effect || '').trim())
    .filter((x) => x.length > 0)
}

function resolveRootTierName(input: any): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const byKey = rootTierOptions.find((t) => t.key === raw)
  if (byKey) return byKey.name
  const byName = rootTierOptions.find((t) => t.name === raw)
  return byName ? byName.name : raw
}

function resolveRootTierKeyFromName(input: any): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const byKey = rootTierOptions.find((t) => t.key === raw)
  if (byKey) return byKey.key
  const byName = rootTierOptions.find((t) => t.name === raw)
  return byName ? byName.key : ''
}

async function startAiGenerateRoot() {
  if (aiRootGenerating.value) return
  const p = aiRootPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }
  if (currentStep.value !== 4) return

  aiRootGenerating.value = true
  try {
    const systemPrompt =
      '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n\n【任务】生成核心天赋类型（如灵根、血统等）\n\n【字段要求】\n- name (字符串): 灵根名称，不含等级前缀\n- tier (字符串): 等级，可选值：凡品、下品、中品、上品、极品、神品\n- description (字符串): 50-200字的灵根描述\n- cultivation_speed (字符串): 修炼速度，格式为"数字x"\n- special_effects (数组): 1-3个特殊效果\n- base_multiplier (数字): 基础倍率，纯数字\n- talent_cost (数字): 3-30之间的整数\n- rarity (数字): 1-5之间的整数\n'

    const text = await callCustomAI(p, systemPrompt)
    if (!text) {
      alert('AI推演失败')
      return
    }

    let data: any
    try {
      data = extractJson(text)
    } catch (e) {
      console.error('【AI推演-灵根】JSON解析失败:', e)
      alert('AI推演结果格式错误，无法解析')
      return
    }

    const name = String(data?.name || data?.名称 || '').trim()
    if (!name) {
      alert('AI推演结果缺少灵根名称')
      return
    }

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`

    const specialRaw = data?.special_effects || data?.特殊效果 || []
    const special: string[] = Array.isArray(specialRaw)
      ? specialRaw
          .map((x) => (typeof x === 'string' ? x : String(x?.effect || x?.描述 || '')))
          .map((x) => String(x || '').trim())
          .filter((x) => x)
      : []

    const item: RootOption = {
      id,
      名称: name,
      品级: String(data?.tier || data?.品级 || data?.等级 || ''),
      描述: String(data?.description || data?.描述 || data?.说明 || ''),
      修炼速度: String(data?.cultivation_speed || data?.修炼速度 || ''),
      修炼倍率: Number(data?.base_multiplier || data?.修炼倍率) || 1,
      消耗: Number(data?.talent_cost || data?.天道点消耗 || data?.点数消耗) || 5,
      稀有度: Number(data?.rarity || data?.稀有度) || 3,
      特殊效果: special
    }
    bundle.roots.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    draft.灵根 = roots.value.find((r) => r.id === id) || null
    closeAiRootModal()
    alert(`AI推演完成！灵根 "${item.名称}" 已生成`)
  } catch (e) {
    console.error('【AI推演-灵根】失败:', e)
    const msg = e instanceof Error ? e.message : ''
    alert(msg ? `AI推演失败: ${msg}` : 'AI推演失败')
  } finally {
    aiRootGenerating.value = false
  }
}

function addOriginAttrRow() {
  if (!Array.isArray(customForm.属性修正列表)) customForm.属性修正列表 = []
  customForm.属性修正列表.push({ attribute: attributeKeys[0], value: '' })
}

function removeOriginAttrRow(idx: number) {
  if (!Array.isArray(customForm.属性修正列表)) return
  customForm.属性修正列表.splice(idx, 1)
}

function addOriginEffectRow() {
  if (!Array.isArray(customForm.背景效果列表)) customForm.背景效果列表 = []
  customForm.背景效果列表.push({ type: '', description: '' })
}

function removeOriginEffectRow(idx: number) {
  if (!Array.isArray(customForm.背景效果列表)) return
  customForm.背景效果列表.splice(idx, 1)
}

function normalizeOriginModsFromList(list: any[]): OriginOption['属性修正'] {
  const mods: any = {}
  if (!Array.isArray(list)) return mods
  for (const row of list) {
    const attr = String(row?.attribute || '').trim()
    const raw = row?.value
    if (!attr) continue
    if (raw === undefined || raw === null || String(raw).trim() === '') continue
    mods[attr] = Number(raw) || 0
  }
  return mods
}

function normalizeOriginEffects(list: any[]): Array<{ type: string; description: string }> {
  if (!Array.isArray(list)) return []
  return list
    .map((x) => ({ type: String(x?.type || '').trim(), description: String(x?.description || '').trim() }))
    .filter((x) => x.type && x.description)
}

async function startAiGenerateOrigin() {
  if (aiOriginGenerating.value) return
  const p = aiOriginPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }
  if (currentStep.value !== 3) return
  if (!draft.世界) {
    alert('请先选择一方大千世界，方可推演出身。')
    return
  }

  aiOriginGenerating.value = true
  try {
    const systemPrompt =
      '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容.\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n\n【任务】生成出身背景\n\n【字段要求】\n- name (字符串): 4-6字的出身名称\n- description (字符串): 100-300字的背景故事\n- talent_cost (数字): 0-10之间的整数\n- rarity (数字): 1-5之间的整数\n- attribute_modifiers (对象): 先天六司加成，总和不超过5点\n- effects (数组): 1-2个独特效果的文字描述\n'

    const text = await callCustomAI(p, systemPrompt)
    if (!text) {
      alert('AI推演失败')
      return
    }

    let data: any
    try {
      data = extractJson(text)
    } catch (e) {
      console.error('【AI推演-出身】JSON解析失败:', e)
      alert('AI推演结果格式错误，无法解析')
      return
    }

    const name = String(data?.name || data?.名称 || '').trim()
    if (!name) {
      alert('AI推演结果缺少出身名称')
      return
    }

    let cost: any = data?.talent_cost ?? data?.天道点消耗 ?? data?.消耗天道点
    if (cost === undefined || cost === null || String(cost).trim() === '') {
      console.warn('【AI推演-出身】AI未返回天道点消耗字段，使用默认值3')
      alert('AI未设置天道点消耗，已自动设为3点')
      cost = 3
    } else {
      const c = Number(cost)
      cost = Number.isFinite(c) ? c : 3
    }

    const rawMods = data?.attribute_modifiers || data?.属性修正 || {}
    const mods: any = {
      根骨: Number(rawMods.root_bone ?? rawMods.根骨 ?? 0) || 0,
      灵性: Number(rawMods.spirituality ?? rawMods.灵性 ?? 0) || 0,
      悟性: Number(rawMods.comprehension ?? rawMods.悟性 ?? 0) || 0,
      气运: Number(rawMods.fortune ?? rawMods.气运 ?? 0) || 0,
      魅力: Number(rawMods.charm ?? rawMods.魅力 ?? 0) || 0,
      心性: Number(rawMods.temperament ?? rawMods.心性 ?? 0) || 0
    }

    const effectsRaw = data?.background_effects || data?.背景效果 || data?.effects || []
    const effects: Array<{ type: string; description: string }> = Array.isArray(effectsRaw)
      ? effectsRaw
          .map((x) => {
            if (typeof x === 'string') return { type: '效果', description: x }
            return { type: String(x?.type || '').trim(), description: String(x?.description || '').trim() }
          })
          .filter((x) => x.type && x.description)
      : []

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`
    const item: OriginOption = {
      id,
      名称: name,
      描述: String(data?.description || data?.描述 || data?.说明 || ''),
      天赋点: Number(cost) || 0,
      属性修正: mods,
      稀有度: Number(data?.rarity || data?.稀有度 || 1) || 1,
      背景效果: effects
    }
    bundle.origins.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    draft.出身 = origins.value.find((o) => o.id === id) || null
    closeAiOriginModal()
    alert(`AI推演完成！出身 "${item.名称}" 已生成`)
  } catch (e) {
    console.error('【AI推演-出身】失败:', e)
    const msg = e instanceof Error ? e.message : ''
    alert(msg ? `AI推演失败: ${msg}` : 'AI推演失败')
  } finally {
    aiOriginGenerating.value = false
  }
}

async function startAiGenerateTier() {
  if (aiTierGenerating.value) return
  const p = aiTierPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }
  if (currentStep.value !== 2) return

  aiTierGenerating.value = true
  try {
    const systemPrompt =
      '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n\n【任务】生成天赋等级\n\n【必填字段】\n- name: 天赋名称\n- description: 描述文字（50-150字）\n- total_points: 总点数（数字类型，范围10-50）\n- rarity: 稀有度（数字类型，范围1-5）\n- color: 颜色（十六进制格式）\n'

    const text = await callCustomAI(p, systemPrompt)
    if (!text) {
      alert('AI推演失败')
      return
    }

    let data: any
    try {
      data = extractJson(text)
    } catch (e) {
      console.error('【AI推演-天资】JSON解析失败:', e)
      alert('AI推演结果格式错误，无法解析')
      return
    }

    const name = String(data?.name || data?.名称 || '').trim()
    if (!name) {
      alert('AI推演结果缺少天资名称')
      return
    }

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`
    const item: AptitudeOption = {
      id,
      名称: name,
      描述: String(data?.description || data?.描述 || data?.说明 || ''),
      点数: Math.floor(Number(data?.total_points || data?.总点数 || data?.点数 || 10)),
      颜色: String(data?.color || data?.颜色 || '#808080'),
      稀有度: Math.floor(Number(data?.rarity || data?.稀有度 || 1))
    }
    bundle.aptitudes.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    draft.天资 = aptitudes.value.find((a) => a.id === id) || null
    aiTierModalOpen.value = false
    alert(`AI推演完成！天资 "${item.名称}" 已生成`)
  } catch (e) {
    console.error('【AI推演-天资】失败:', e)
    const msg = e instanceof Error ? e.message : ''
    alert(msg ? `AI推演失败: ${msg}` : 'AI推演失败')
  } finally {
    aiTierGenerating.value = false
  }
}

async function startAiGenerateWorld() {
  if (aiGenerating.value) return
  const p = aiPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }

  aiGenerating.value = true
  try {
    const systemPrefix =
      '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n'

    const systemPrompt = systemPrefix + '【任务】生成世界设定\n\n【字段】name(2-6字)/description(200-400字)/era(5-10字)\n'
    const text = await callCustomAI(p, systemPrompt)

    let data: any
    try {
      data = extractJson(text)
    } catch {
      throw new Error('AI推演结果格式错误，无法解析')
    }

    const name = String(data?.name || data?.名称 || '').trim()
    if (!name) {
      throw new Error('AI推演结果缺少世界名称')
    }

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`
    const item = {
      id,
      名称: name,
      纪元: String(data?.era || data?.时代背景 || '').trim(),
      描述: String(data?.description || data?.描述 || data?.世界描述 || '').trim()
    }
    bundle.worlds.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    draft.世界 = worlds.value.find((w) => w.id === id) || null
    closeAiModal()
    alert(`AI推演完成！世界 "${name}" 已生成`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    alert(msg ? `AI推演失败: ${msg}` : 'AI推演失败')
  } finally {
    aiGenerating.value = false
  }
}

function resetCustomForm(editId?: string) {
  for (const k of Object.keys(customForm)) delete customForm[k]

  if (currentStep.value === 1) {
    const found = editId ? customBundle.value.worlds.find((w) => w.id === editId) : null
    customForm.名称 = found?.名称 || ''
    customForm.纪元 = found?.纪元 || ''
    customForm.描述 = found?.描述 || ''
    return
  }

  if (currentStep.value === 2) {
    const found = editId ? customBundle.value.aptitudes.find((a) => a.id === editId) : null
    customForm.名称 = found?.名称 || ''
    customForm.描述 = found?.描述 || ''
    customForm.点数 = typeof found?.点数 === 'number' ? found.点数 : 20
    customForm.颜色 = found?.颜色 || '#FFFFFF'
    customForm.稀有度 = typeof found?.稀有度 === 'number' ? found.稀有度 : 1
    return
  }

  if (currentStep.value === 3) {
    const found = editId ? customBundle.value.origins.find((o) => o.id === editId) : null
    customForm.名称 = found?.名称 || ''
    customForm.描述 = found?.描述 || ''
    customForm.天赋点 = typeof found?.天赋点 === 'number' ? found.天赋点 : 0
    customForm.稀有度 = typeof (found as any)?.稀有度 === 'number' ? (found as any).稀有度 : 1

    const mods = (found as any)?.属性修正 || {}
    customForm.属性修正列表 = Object.entries(mods)
      .map(([attribute, value]) => ({ attribute, value: String(value) }))
      .filter((x) => x.attribute)

    customForm.背景效果列表 = Array.isArray((found as any)?.背景效果)
      ? (found as any).背景效果.map((x: any) => ({ type: String(x?.type || ''), description: String(x?.description || '') }))
      : []
    return
  }

  if (currentStep.value === 4) {
    const found = editId ? customBundle.value.roots.find((r) => r.id === editId) : null
    customForm.名称 = found?.名称 || ''
    customForm.品级 = resolveRootTierKeyFromName(found?.品级 || '')
    customForm.描述 = found?.描述 || ''
    customForm.修炼速度 = (found as any)?.修炼速度 || ''
    customForm.修炼倍率 = typeof (found as any)?.修炼倍率 === 'number' ? String((found as any).修炼倍率) : String((found as any)?.修炼倍率 || '1.0')
    customForm.消耗 = typeof found?.消耗 === 'number' ? String(found.消耗) : String((found as any)?.消耗 || '0')
    customForm.稀有度 = typeof (found as any)?.稀有度 === 'number' ? String((found as any).稀有度) : String((found as any)?.稀有度 || '1')
    customForm.特殊效果列表 = Array.isArray((found as any)?.特殊效果) ? (found as any).特殊效果.map((e: any) => ({ effect: String(e || '') })) : []
    return
  }

  if (currentStep.value === 5) {
    const found = editId ? customBundle.value.talents.find((t) => t.id === editId) : null
    customForm.名称 = found?.名称 || ''
    customForm.描述 = found?.描述 || ''
    customForm.消耗 = typeof found?.消耗 === 'number' ? String(found.消耗) : String((found as any)?.消耗 || '0')
    customForm.稀有度 = typeof found?.稀有度 === 'number' ? String(found.稀有度) : String((found as any)?.稀有度 || '1')
    customForm.天赋效果列表 = Array.isArray((found as any)?.效果)
      ? (found as any).效果.map((e: any) => ({ 类型: String(e?.类型 || ''), 目标: String(e?.目标 || ''), 数值: String(e?.数值 ?? '') }))
      : []
  }
}

function closeCustomModal() {
  customModalOpen.value = false
}

function saveCustomModal() {
  const id = customModalMode.value === 'edit' ? (getSelectedOptionIdForStep() as string) : `c_${Date.now()}`
  if (!customForm.名称 || String(customForm.名称).trim().length === 0) {
    if (currentStep.value === 1) alert('世界名称不可为空')
    else if (currentStep.value === 2) alert('天资名称不可为空')
    else if (currentStep.value === 3) alert('出身名称不可为空')
    else if (currentStep.value === 4) alert('灵根名称不可为空')
    else if (currentStep.value === 5) alert('天赋名称不可为空')
    else alert('名称不可为空')
    return
  }

  if (currentStep.value === 4) {
    if (!customForm.品级 || String(customForm.品级).trim().length === 0) {
      alert('请选择品级')
      return
    }
    if (!customForm.描述 || String(customForm.描述).trim().length === 0) {
      alert('灵根描述不可为空')
      return
    }
    const mul = Number(customForm.修炼倍率)
    if (customForm.修炼倍率 !== undefined && customForm.修炼倍率 !== '' && Number.isNaN(mul)) {
      alert('修炼倍率必须为数字')
      return
    }
    const cost = Number(customForm.消耗)
    if (customForm.消耗 !== undefined && customForm.消耗 !== '' && Number.isNaN(cost)) {
      alert('消耗点数必须为数字')
      return
    }
    const rarity = Number(customForm.稀有度)
    if (customForm.稀有度 !== undefined && customForm.稀有度 !== '' && (Number.isNaN(rarity) || rarity < 1 || rarity > 10)) {
      alert('稀有度必须在1-10之间')
      return
    }
  }

  if (currentStep.value === 3) {
    if (!customForm.描述 || String(customForm.描述).trim().length === 0) {
      alert('出身描述不可为空')
      return
    }
    const costRaw = customForm.天赋点
    if (costRaw !== undefined && costRaw !== '' && costRaw !== null && Number.isNaN(Number(costRaw))) {
      alert('天道点消耗必须是数字')
      return
    }
    const rarity = Number(customForm.稀有度)
    if (!Number.isFinite(rarity) || rarity < 1 || rarity > 10) {
      alert('稀有度必须在1-10之间')
      return
    }
  }

  if (currentStep.value === 2) {
    const pts = Number(customForm.点数)
    if (!Number.isFinite(pts) || pts < 0) {
      alert('天道点必须是非负数')
      return
    }
    const rarity = Number(customForm.稀有度)
    if (!Number.isFinite(rarity) || rarity < 1 || rarity > 10) {
      alert('稀有度必须在1-10之间')
      return
    }
  }

  const bundle = loadCustomCreationData()

  if (currentStep.value === 1) {
    const item = { id, 名称: String(customForm.名称).trim(), 纪元: String(customForm.纪元 || ''), 描述: String(customForm.描述 || '') }
    const idx = bundle.worlds.findIndex((w) => w.id === id)
    if (idx >= 0) bundle.worlds[idx] = item
    else bundle.worlds.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    draft.世界 = worlds.value.find((w) => w.id === id) || null
    closeCustomModal()
    alert(`自定义世界 "${item.名称}" 已成功保存！`)
    return
  }

  if (currentStep.value === 2) {
    try {
      const item: AptitudeOption = {
        id,
        名称: String(customForm.名称).trim(),
        描述: String(customForm.描述 || ''),
        点数: Math.floor(Number(customForm.点数) || 0),
        颜色: String(customForm.颜色 || '#808080'),
        稀有度: Math.floor(Number(customForm.稀有度) || 1)
      }
      const idx = bundle.aptitudes.findIndex((a) => a.id === id)
      if (idx >= 0) bundle.aptitudes[idx] = item
      else bundle.aptitudes.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.天资 = aptitudes.value.find((a) => a.id === id) || null
      closeCustomModal()
      alert(`自定义天资 "${item.名称}" 已保存！`)
      return
    } catch (e) {
      console.error('保存自定义天资失败:', e)
      alert('保存自定义天资失败！')
      return
    }
  }

  if (currentStep.value === 3) {
    try {
      const mods = normalizeOriginModsFromList(customForm.属性修正列表)
      const effects = normalizeOriginEffects(customForm.背景效果列表)
      const item: OriginOption = {
        id,
        名称: String(customForm.名称).trim(),
        描述: String(customForm.描述 || ''),
        天赋点: Number(customForm.天赋点) || 0,
        属性修正: mods,
        稀有度: Math.floor(Number(customForm.稀有度) || 1),
        背景效果: effects
      }
      const idx = bundle.origins.findIndex((o) => o.id === id)
      if (idx >= 0) bundle.origins[idx] = item
      else bundle.origins.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.出身 = origins.value.find((o) => o.id === id) || null
      closeCustomModal()
      alert(`自定义出身 "${item.名称}" 已保存！`)
      return
    } catch (e) {
      console.error('保存自定义出身失败:', e)
      alert('保存自定义出身失败！')
      return
    }
  }

  if (currentStep.value === 4) {
    try {
      const tierName = resolveRootTierName(customForm.品级)
      const effects = normalizeRootEffects(customForm.特殊效果列表)
      const item: RootOption = {
        id,
        名称: String(customForm.名称).trim(),
        品级: tierName,
        描述: String(customForm.描述 || ''),
        修炼速度: String(customForm.修炼速度 || '普通'),
        修炼倍率: parseFloat(String(customForm.修炼倍率)) || 1,
        消耗: parseInt(String(customForm.消耗), 10) || 0,
        稀有度: parseInt(String(customForm.稀有度), 10) || 1,
        特殊效果: effects
      }
      const idx = bundle.roots.findIndex((r) => r.id === id)
      if (idx >= 0) bundle.roots[idx] = item
      else bundle.roots.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.灵根 = roots.value.find((r) => r.id === id) || null
      closeCustomModal()
      alert(`自定义灵根 "${item.名称}" 已保存！`)
      return
    } catch (e) {
      console.error('保存自定义灵根失败:', e)
      alert('保存自定义灵根失败！')
      return
    }
  }

  if (currentStep.value === 5) {
    const effects = normalizeTalentEffects(customForm.天赋效果列表)
    const item: TalentOption = {
      id,
      名称: String(customForm.名称).trim(),
      描述: String(customForm.描述 || ''),
      消耗: Number(customForm.消耗) || 0,
      稀有度: Number(customForm.稀有度) || 1,
      效果: effects.length ? effects : undefined
    }
    const idx = bundle.talents.findIndex((t) => t.id === id)
    if (idx >= 0) bundle.talents[idx] = item
    else bundle.talents.unshift(item)
    saveCustomCreationData(bundle)
    refreshOptionsFromCustom()
    lastClickedTalentId.value = id
    if (!draft.天赋.some((t) => t.id === id) && draft.天赋.length < 3) {
      selectOption(id)
    }
    closeCustomModal()
    alert(`自定义天赋 "${item.名称}" 已保存！`)
  }
}

function deleteSelectedCustom() {
  const id = getSelectedOptionIdForStep()
  if (!id || !isCustomId(id)) return
  const ok = confirm('确定删除该自定义项吗？')
  if (!ok) return

  const bundle = loadCustomCreationData()
  if (currentStep.value === 1) bundle.worlds = bundle.worlds.filter((w) => w.id !== id)
  if (currentStep.value === 2) bundle.aptitudes = bundle.aptitudes.filter((a) => a.id !== id)
  if (currentStep.value === 3) bundle.origins = bundle.origins.filter((o) => o.id !== id)
  if (currentStep.value === 4) bundle.roots = bundle.roots.filter((r) => r.id !== id)
  if (currentStep.value === 5) bundle.talents = bundle.talents.filter((t) => t.id !== id)
  saveCustomCreationData(bundle)
  refreshOptionsFromCustom()

  if (currentStep.value === 1 && draft.世界?.id === id) draft.世界 = null
  if (currentStep.value === 2 && draft.天资?.id === id) draft.天资 = null
  if (currentStep.value === 3 && draft.出身?.id === id) draft.出身 = null
  if (currentStep.value === 4 && draft.灵根?.id === id) draft.灵根 = null
  if (currentStep.value === 5) {
    draft.天赋 = draft.天赋.filter((t) => t.id !== id)
    if (lastClickedTalentId.value === id) lastClickedTalentId.value = null
  }
}

function openCustomEditById(id: string) {
  if (!id || !isCustomId(id)) return
  // 对齐原游戏：编辑前先选中该项
  if (currentStep.value === 5) {
    lastClickedTalentId.value = id
  } else {
    selectOption(id)
  }
  customModalMode.value = 'edit'
  resetCustomForm(id)
  customModalOpen.value = true
}

function deleteCustomById(id: string) {
  if (!id || !isCustomId(id)) return
  const ok = confirm('确定删除该自定义项吗？')
  if (!ok) return

  const bundle = loadCustomCreationData()
  if (currentStep.value === 1) bundle.worlds = bundle.worlds.filter((w) => w.id !== id)
  if (currentStep.value === 2) bundle.aptitudes = bundle.aptitudes.filter((a) => a.id !== id)
  if (currentStep.value === 3) bundle.origins = bundle.origins.filter((o) => o.id !== id)
  if (currentStep.value === 4) bundle.roots = bundle.roots.filter((r) => r.id !== id)
  if (currentStep.value === 5) bundle.talents = bundle.talents.filter((t) => t.id !== id)
  saveCustomCreationData(bundle)
  refreshOptionsFromCustom()

  if (currentStep.value === 1 && draft.世界?.id === id) draft.世界 = null
  if (currentStep.value === 2 && draft.天资?.id === id) draft.天资 = null
  if (currentStep.value === 3 && draft.出身?.id === id) draft.出身 = null
  if (currentStep.value === 4 && draft.灵根?.id === id) draft.灵根 = null
  if (currentStep.value === 5) {
    draft.天赋 = draft.天赋.filter((t) => t.id !== id)
    if (lastClickedTalentId.value === id) lastClickedTalentId.value = null
  }
}

function clearCustomOptions() {
  const ok = confirm('确定清除全部自定义/AI推演数据吗？')
  if (!ok) return
  clearCustomCreationData()
  refreshOptionsFromCustom()
}

async function callCustomAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = (settingsStore.customApiKey || '').trim()

  const preset = settingsStore.aiProviderPreset
  const resolvedBaseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
  const model = (settingsStore.aiModel || '').trim()

  if (preset === 'custom' && !model) {
    const url = (settingsStore.customApiUrl || '').trim()
    if (!url) throw new Error('未配置 API Base URL')
    return await customGenerateText({ baseUrl: url, apiKey, prompt, system: systemPrompt, timeoutMs: 60000 })
  }

  if (!model) {
    if (settingsStore.aiProviderPreset === 'deepseek') {
      throw new Error('未选择模型，请在设置中填写模型（例如：deepseek-chat）')
    }
    throw new Error('未选择模型')
  }

  try {
    return await chatCompletionText({
      baseUrl: resolvedBaseUrl,
      apiKey,
      model,
      temperature: settingsStore.aiTemperature,
      maxTokens: settingsStore.aiMaxOutputTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      timeoutMs: 60000
    })
  } catch (e) {
    if (preset !== 'custom') throw e
    const url = (settingsStore.customApiUrl || '').trim()
    if (!url) throw e
    return await customGenerateText({ baseUrl: url, apiKey, prompt, system: systemPrompt, timeoutMs: 60000 })
  }
}

function extractJson(text: string) {
  const m = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
  const raw = m ? (m[1] || m[0]) : text
  return JSON.parse(raw.trim())
}

async function handleAIGenerate() {
  const p = aiPrompt.value.trim()
  if (!p) {
    alert('请输入推演主题')
    return
  }
  if (currentStep.value === 3 && !draft.世界) {
    alert('请先选择世界，再推演出身')
    return
  }

  const systemPrefix =
    '你是专业的世界观内容生成器，根据用户提供的主题生成对应风格的内容。\n\n【世界观核心理念】\n- 修仙/超凡体系只是一个背景元素，不是唯一重点\n- 严格按照用户的选择和世界设定来生成内容\n- 如果用户指定了特定风格（科幻、现代、赛博朋克等），必须完全遵循该风格\n- 不要预设固定的修仙剧情方向，让用户自己决定故事走向\n\n【输出要求】\n1. 所有数值字段必须是数字类型。\n2. 先输出思维链：<thinking>...</thinking>。\n3. 再输出JSON：必须使用```json代码块包裹。\n4. 不得添加任何额外的解释说明文字。\n\n'

  let systemPrompt = systemPrefix
  if (currentStep.value === 1) {
    systemPrompt += '【任务】生成世界设定\n\n【字段】name(2-6字)/description(200-400字)/era(5-10字)\n'
  } else if (currentStep.value === 2) {
    systemPrompt +=
      '【任务】生成天资等级\n\n【必填字段】\n- name: 天资名称\n- description: 天资描述（20-120字）\n- total_points: 天道点（数字类型，必须为非负数）\n- rarity: 稀有度（数字类型，范围1-10）\n- color: 辉光颜色（十六进制格式，如#808080）\n'
  } else if (currentStep.value === 3) {
    systemPrompt +=
      '【任务】生成出身背景\n\n【字段要求】\n- name (字符串): 4-6字的出身名称\n- description (字符串): 100-300字的背景故事\n- talent_cost (数字): 0-10之间的整数\n- rarity (数字): 1-5之间的整数\n- attribute_modifiers (对象): 先天六司加成，总和不超过5点\n- effects (数组): 1-2个独特效果的文字描述\n'
  } else if (currentStep.value === 4) {
    systemPrompt +=
      '【任务】生成核心天赋类型（如灵根、血统等）\n\n【字段要求】\n- name (字符串): 灵根名称，不含等级前缀\n- tier (字符串): 等级，可选值：凡品、下品、中品、上品、极品、神品\n- description (字符串): 50-200字的灵根描述\n- cultivation_speed (字符串): 修炼速度，格式为"数字x"\n- special_effects (数组): 1-3个特殊效果\n- base_multiplier (数字): 基础倍率，纯数字\n- talent_cost (数字): 3-30之间的整数\n- rarity (数字): 1-5之间的整数\n'
  } else if (currentStep.value === 5) {
    systemPrompt +=
      '【任务】生成先天天赋\n\n【字段要求】\n- name (字符串): 4-6字的天赋名称\n- description (字符串): 30-100字的天赋描述\n'
  }

  try {
    const text = await callCustomAI(p, systemPrompt)
    const data = extractJson(text)

    const bundle = loadCustomCreationData()
    const id = `c_${Date.now()}`

    if (currentStep.value === 1) {
      const item = {
        id,
        名称: String(data.name || data.名称 || '未命名世界'),
        纪元: String(data.era || data.时代背景 || ''),
        描述: String(data.description || data.描述 || data.世界描述 || '')
      }
      bundle.worlds.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.世界 = worlds.value.find((w) => w.id === id) || null
      return
    }

    if (currentStep.value === 2) {
      const name = String(data.name || data.名称 || '').trim()
      if (!name) {
        alert('AI推演结果缺少天资名称')
        return
      }
      const item: AptitudeOption = {
        id,
        名称: name,
        描述: String(data.description || data.描述 || data.说明 || ''),
        点数: Math.floor(Number(data.total_points || data.总点数 || data.点数 || 10)),
        颜色: String(data.color || data.颜色 || '#808080'),
        稀有度: Math.floor(Number(data.rarity || data.稀有度 || 1))
      }
      bundle.aptitudes.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.天资 = aptitudes.value.find((a) => a.id === id) || null
      alert(`AI推演完成！天资 "${item.名称}" 已生成`)
      return
    }

    if (currentStep.value === 3) {
      const cost = Number(data.talent_cost ?? data.天道点消耗 ?? data.消耗天道点 ?? 3)
      const mods = data.attribute_modifiers || data.属性修正 || {}
      const item: OriginOption = {
        id,
        名称: String(data.name || data.名称 || '未命名出身'),
        描述: String(data.description || data.描述 || data.说明 || ''),
        天赋点: Number.isFinite(cost) ? cost : 3,
        属性修正: {
          根骨: Number(mods.root_bone ?? mods.根骨 ?? 0) || 0,
          灵性: Number(mods.spirituality ?? mods.灵性 ?? 0) || 0,
          悟性: Number(mods.comprehension ?? mods.悟性 ?? 0) || 0,
          气运: Number(mods.fortune ?? mods.气运 ?? 0) || 0,
          魅力: Number(mods.charm ?? mods.魅力 ?? 0) || 0,
          心性: Number(mods.temperament ?? mods.心性 ?? 0) || 0
        }
      }
      bundle.origins.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.出身 = origins.value.find((o) => o.id === id) || null
      return
    }

    if (currentStep.value === 4) {
      const item: RootOption = {
        id,
        名称: String(data.name || data.名称 || '未命名灵根'),
        品级: String(data.tier || data.品级 || data.等级 || '凡品'),
        描述: String(data.description || data.描述 || data.说明 || ''),
        消耗: Number(data.talent_cost || data.天道点消耗 || data.点数消耗 || 5) || 5
      }
      bundle.roots.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      draft.灵根 = roots.value.find((r) => r.id === id) || null
      return
    }

    if (currentStep.value === 5) {
      const item: TalentOption = {
        id,
        名称: String(data.name || data.名称 || '未命名天赋'),
        描述: String(data.description || data.描述 || data.说明 || ''),
        消耗: Number(data.talent_cost || data.点数消耗 || 1) || 1,
        稀有度: Number(data.rarity || data.稀有度 || 1) || 1
      }
      bundle.talents.unshift(item)
      saveCustomCreationData(bundle)
      refreshOptionsFromCustom()
      lastClickedTalentId.value = id
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : 'AI推演失败')
  }
}

const currentOptions = computed(() => {
  if (currentStep.value === 1) return worlds.value
  if (currentStep.value === 2) return aptitudes.value
  if (currentStep.value === 3) return origins.value
  if (currentStep.value === 4) return roots.value
  return talents.value
})

onMounted(async () => {
  settingsStore.load()
  refreshOptionsFromCustom()
  ensureWorldCounts()
})

function stepIndicatorClass(step: number) {
  if (currentStep.value === step) return 'active'
  if (currentStep.value > step) return 'completed'
  return 'inactive'
}

function optionTitle(opt: any) {
  return opt?.名称 || ''
}

function optionPoints(opt: any): number | null {
  if (currentStep.value === 1) return null
  if (currentStep.value === 2) return typeof opt?.点数 === 'number' ? opt.点数 : null
  if (currentStep.value === 3) return typeof opt?.天赋点 === 'number' ? opt.天赋点 : null
  if (currentStep.value === 4) return typeof opt?.消耗 === 'number' ? opt.消耗 : null
  if (currentStep.value === 5) return typeof opt?.消耗 === 'number' ? opt.消耗 : null
  return null
}

function isOptionSelected(id: string) {
  if (currentStep.value === 1) return draft.世界?.id === id
  if (currentStep.value === 2) return draft.天资?.id === id
  if (currentStep.value === 3) return draft.出身?.id === id
  if (currentStep.value === 4) return draft.灵根?.id === id
  if (currentStep.value === 5) return draft.天赋.some((t) => t.id === id)
  return false
}

const originBonusText = computed(() => {
  const bonus = draft.出身?.属性修正 || {}
  const parts = Object.entries(bonus)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`)
  return parts.length ? parts.join('，') : '无'
})

const originCost = computed(() => {
  return draft.出身?.天赋点 || 0
})

const rootCost = computed(() => {
  return draft.灵根?.消耗 || 0
})

const talentCostUsed = computed(() => {
  return draft.天赋.reduce((sum, t) => sum + (t.消耗 || 0), 0)
})

const heavenBonusPoints = computed(() => {
  return draft.天赋.some((t) => t.名称 === '霸王血脉') ? 1 : 0
})

const heavenTotalPoints = computed(() => {
  return (draft.天资?.点数 || 0) + heavenBonusPoints.value
})

const attributeCostUsed = computed(() => {
  return attributeKeys.reduce((sum, k) => sum + (draft.先天六司[k] || 0), 0)
})

const heavenSpentAll = computed(() => {
  return originCost.value + rootCost.value + talentCostUsed.value + attributeCostUsed.value
})

const remainingHeavenPointsAll = computed(() => {
  return heavenTotalPoints.value - heavenSpentAll.value
})

const heavenSpentForDisplay = computed(() => {
  if (currentStep.value <= 2) return 0
  let spent = 0
  if (currentStep.value >= 3) spent += originCost.value
  if (currentStep.value >= 4) spent += rootCost.value
  if (currentStep.value >= 5) spent += talentCostUsed.value
  if (currentStep.value >= 6) spent += attributeCostUsed.value
  return spent
})

const remainingHeavenPoints = computed(() => {
  return heavenTotalPoints.value - heavenSpentForDisplay.value
})

const selectedTalentDetail = computed<TalentOption | null>(() => {
  if (!lastClickedTalentId.value) return null
  return talents.value.find((t) => t.id === lastClickedTalentId.value) || null
})

function normalizeTalentSelections() {
  while (draft.天赋.length > 0 && remainingHeavenPointsAll.value < 0) {
    draft.天赋 = draft.天赋.slice(0, -1)
  }

  if (draft.灵根 && remainingHeavenPointsAll.value < 0) {
    draft.灵根 = null
  }
}

function selectOption(id: string) {
  if (currentStep.value === 1) {
    draft.世界 = worlds.value.find((w) => w.id === id) || null
    return
  }
  if (currentStep.value === 2) {
    const before = draft.天资
    draft.天资 = aptitudes.value.find((a) => a.id === id) || null
    normalizeTalentSelections()
    if (remainingHeavenPointsAll.value < 0) {
      draft.天资 = before
      alert('天道点不足，无法选择该天资（请先减少消耗）')
    }
    return
  }
  if (currentStep.value === 3) {
    const before = draft.出身
    const next = origins.value.find((o) => o.id === id) || null
    draft.出身 = next
    normalizeTalentSelections()
    if (remainingHeavenPointsAll.value < 0) {
      draft.出身 = before
      alert('天道点不足，无法选择该出身（请先减少消耗）')
    }
    return
  }
  if (currentStep.value === 4) {
    const before = draft.灵根
    const nextRoot = roots.value.find((r) => r.id === id) || null
    if (!nextRoot) {
      draft.灵根 = null
      return
    }

    draft.灵根 = nextRoot
    if (remainingHeavenPointsAll.value < 0) {
      draft.灵根 = before
      alert('天道点不足，无法选择该灵根')
      return
    }
    return
  }
  if (currentStep.value === 5) {
    lastClickedTalentId.value = id
    const found = talents.value.find((t) => t.id === id)
    if (!found) return

    const already = draft.天赋.some((t) => t.id === id)
    if (already) {
      draft.天赋 = draft.天赋.filter((t) => t.id !== id)
      return
    }

    if (draft.天赋.length >= 3) {
      alert('最多选择 3 个天赋')
      return
    }

    draft.天赋 = [...draft.天赋, found]
    if (remainingHeavenPointsAll.value < 0) {
      draft.天赋 = draft.天赋.filter((t) => t.id !== id)
      alert('天道点不足，无法选择该天赋')
      return
    }
  }
}

function attributeDesc(key: AttributeKey) {
  if (key === '根骨') return '决定气血上限、恢复速度、寿命上限。影响炼体修行、抗打击能力。'
  if (key === '灵性') return '决定灵气上限、吸收效率。影响修炼速度、法术威力。'
  if (key === '悟性') return '决定神识上限、学习效率。影响功法领悟、技能掌握速度。'
  if (key === '气运') return '决定各种概率、物品掉落品质。影响天材地宝获取、贵人相助。'
  if (key === '魅力') return '决定社交效果、NPC好感度变化。影响交易、结缘、势力声望。'
  return '决定道心稳定、突破抗心魔能力。影响受诱惑、幻术的抗性。'
}

function handleRange(key: AttributeKey, evt: Event) {
  const next = Number((evt.target as HTMLInputElement).value)
  setAttribute(key, next)
}

function setAttribute(key: AttributeKey, next: number) {
  const clamped = Math.max(0, Math.min(10, Math.trunc(next)))
  const before = draft.先天六司[key]
  const delta = clamped - before
  if (delta > 0 && remainingHeavenPointsAll.value < delta) return
  draft.先天六司[key] = clamped
}

function bumpAttribute(key: AttributeKey, delta: number) {
  setAttribute(key, (draft.先天六司[key] ?? 0) + delta)
}

function resetAttributes() {
  draft.先天六司 = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
}

function balancedAttributes() {
  const available = Math.max(0, heavenTotalPoints.value - originCost.value - rootCost.value - talentCostUsed.value)
  const targetTotal = Math.min(available, 60)
  const base = Math.floor(targetTotal / 6)
  const arr: Record<AttributeKey, number> = { 根骨: base, 灵性: base, 悟性: base, 气运: base, 魅力: base, 心性: base }

  let remain = targetTotal - Object.values(arr).reduce((s, v) => s + v, 0)
  const order: AttributeKey[] = ['悟性', '气运', '灵性', '根骨', '心性', '魅力']

  let cursor = 0
  while (remain > 0) {
    const k = order[cursor % order.length]
    cursor += 1
    if (arr[k] >= 10) {
      const allMaxed = order.every((kk) => arr[kk] >= 10)
      if (allMaxed) break
      continue
    }

    arr[k] += 1
    remain -= 1
  }

  for (const k of attributeKeys) {
    arr[k] = Math.max(0, Math.min(10, arr[k]))
  }

  draft.先天六司 = arr
}

function randomAttributes() {
  const base: Record<AttributeKey, number> = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }

  const available = Math.max(0, heavenTotalPoints.value - originCost.value - rootCost.value - talentCostUsed.value)
  let remain = Math.min(available, 60)
  while (remain > 0) {
    const k = attributeKeys[Math.floor(Math.random() * attributeKeys.length)]
    if (base[k] < 10) {
      base[k] += 1
      remain -= 1
    }
  }

  draft.先天六司 = base
}

const pointRemainingLabel = computed(() => {
  return String(remainingHeavenPoints.value)
})

const attributeSummary = computed(() => {
  const bonus = draft.出身?.属性修正 || {}
  return attributeKeys
    .map((k) => {
      const b = bonus[k] || 0
      return `${k}${(draft.先天六司[k] || 0) + (typeof b === 'number' ? b : 0)}`
    })
    .join('，')
})

const nextDisabled = computed(() => {
  if (creating.value) return true
  if (currentStep.value >= 7) return false
  return !canProceed(currentStep.value)
})

async function handlePrevOrHome() {
  if (creating.value) return
  if (currentStep.value === 1) {
    try {
      await characterStore.saveCurrentGame()
    } catch {
      void 0
    }
    router.push({ name: 'ModeSelection' })
    return
  }
  currentStep.value -= 1
}

async function nextStep() {
  if (currentStep.value < 7) {
    if (!canProceed(currentStep.value)) {
      alert('请先完成当前步骤选择')
      return
    }
    currentStep.value += 1
    return
  }

  await startGame()
}

function canProceed(step: number) {
  if (step === 1) return Boolean(draft.世界)
  if (step === 2) return Boolean(draft.天资)
  if (step === 3) return Boolean(draft.出身)
  if (step === 4) return Boolean(draft.灵根)
  if (step === 5) return draft.天赋.length >= 1
  if (step === 6) return remainingHeavenPointsAll.value >= 0
  return true
}

async function resumeFromSession(session: CreationSessionPayload) {
  const ref = session.creating
  if (!ref?.characterId || !ref?.slotKey) return

  creating.value = true
  creatingText.value = ref.text || '🔁 正在从断点恢复...'
  let stage = ref.stage || '恢复创建'
  let input: any = ref.input || null
  let providerErrors: { provider: string; message: string; stack?: string }[] = []
  const startedAt = ref.startedAt || new Date().toISOString()
  let succeeded = false

  const checkpoint = (nextStage: string, text?: string) => {
    stage = nextStage
    if (typeof text === 'string') creatingText.value = text
    scheduleSaveSession({
      creating: {
        startedAt,
        stage,
        text: creatingText.value,
        input: input || undefined,
        characterId: ref.characterId,
        slotKey: ref.slotKey
      }
    })
  }

  try {
    await requestWakeLock()
  } catch {
    void 0
  }

  try {
    checkpoint('恢复存档', '🔁 正在恢复存档...')
    await characterStore.loadSaveAndApply(ref.characterId, ref.slotKey)

    let worldInfo: any = (gameState as any).世界信息
    if (!worldInfo && draft.世界 && draft.出身) {
      checkpoint('世界生成', '🌍 世界生成：准备中...')
      ensureWorldCounts()
      const counts = draft.世界规模
      input =
        input ||
        ({
          worldName: draft.世界.名称,
          worldEra: draft.世界.纪元,
          worldBackground: draft.世界.描述,
          characterName: (draft.道号 || '无名').trim() || '无名',
          characterBackground: draft.出身.名称,
          seed: Date.now(),
          counts: {
            continentCount: counts?.continentCount ?? 4,
            factionCount: counts?.factionCount ?? 5,
            locationCount: counts?.locationCount ?? 12,
            secretRealmsCount: Math.min(counts?.locationCount ?? 12, counts?.secretRealmsCount ?? 5)
          }
        } as any)

      worldInfo = await generateWorldInfo(input, {
        provider: 'local',
        onProgress: (t) => {
          creatingText.value = t
          checkpoint(stage)
        }
      })

      checkpoint('写入世界信息')
      ;(gameState as any).世界信息 = worldInfo
      try {
        await characterStore.saveCurrentGame(ref.characterId, ref.slotKey, { toast: false })
      } catch {
        void 0
      }
    }

    checkpoint('角色初始化', '📜 天道正在为你书写命运之章...')
    const aiBaseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
    const aiModel = (settingsStore.aiModel || '').trim()
    if (aiBaseUrl && aiModel) {
      const resp = await runCharacterInit({
        saveData: gameState.toSaveData(),
        preset: settingsStore.aiProviderPreset,
        customApiUrl: settingsStore.customApiUrl,
        apiKey: (settingsStore.customApiKey || '').trim(),
        model: (settingsStore.aiModel || '').trim(),
        temperature: settingsStore.aiTemperature,
        maxOutputTokens: Math.max(4096, settingsStore.aiMaxOutputTokens),
        allowPromptOverrides: settingsStore.useImportedPromptOverrides,
        initMode: settingsStore.initMode,
        stream: settingsStore.aiStreaming,
        onProgress: (text) => {
          creatingText.value = `📜 天道正在为你书写命运之章...\n\n${text.slice(-160)}`
        }
      })

      gameState.applyCommands(resp.tavern_commands)
      gameState.appendNarrative({ role: 'assistant', text: resp.text, createdAt: new Date().toISOString(), stateChanges: resp.tavern_commands })
      gameState.addToShortTermMemory((resp as any).mid_term_memory ? (resp as any).mid_term_memory : resp.text)
    }

    checkpoint('选择初始位置')
    const pos: any = (gameState as any)?.玩家角色状态?.位置
    const hasX = typeof pos?.x === 'number' && Number.isFinite(pos.x)
    const hasY = typeof pos?.y === 'number' && Number.isFinite(pos.y)
    if (!hasX || !hasY) {
      const wi = (gameState as any).世界信息 || worldInfo
      if (wi) gameState.玩家角色状态.位置 = pickInitialLocation(wi)
    }

    checkpoint('保存存档', '💾 写入存档...')
    await characterStore.saveCurrentGame(ref.characterId, ref.slotKey)

    checkpoint('进入游戏')
    clearCreationSession()
    succeeded = true
    await router.push({ name: 'GameView' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[CharacterCreate] resume failed:', { stage, error: e })
    try {
      saveCreationSessionNow({
        creating: {
          startedAt,
          stage,
          text: creatingText.value,
          input: input || undefined,
          characterId: ref.characterId,
          slotKey: ref.slotKey
        }
      })
    } catch {
      void 0
    }
    try {
      worldGenErrorStore.setError({
        stage,
        message: msg,
        stack: e instanceof Error ? e.stack : undefined,
        input: input || undefined,
        providerErrors: providerErrors?.length ? providerErrors : undefined
      })
      await router.push({ name: 'WorldGenError' })
    } catch {
      alert(`创建失败[${stage}]：${msg}`)
    }
  } finally {
    creating.value = false
    creatingText.value = ''
    if (!succeeded) scheduleSaveSession({ creating: null })
    void releaseWakeLock()
  }
}

async function startGame() {
  if (creating.value) return
  if (!draft.世界 || !draft.天资 || !draft.出身 || !draft.灵根) {
    alert('创建信息不完整')
    return
  }
  if (draft.天赋.length < 1) {
    alert('请至少选择 1 个天赋')
    return
  }
  if (remainingHeavenPointsAll.value < 0) {
    alert('天道点不足，请减少消耗或调整先天六司')
    return
  }

  const existingSession = loadCreationSession()
  if (existingSession?.creating?.characterId && existingSession?.creating?.slotKey && existingSession?.creating?.stage) {
    const canResume = [
      '初始化存档',
      '世界生成',
      '写入世界信息',
      '角色初始化',
      '选择初始位置',
      '保存存档',
      '进入游戏'
    ].includes(existingSession.creating.stage)
    if (canResume) {
      const ok = confirm(
        `检测到上次创建在【${existingSession.creating.stage}】阶段中断，是否从断点继续？\n\n选择“取消”将重新开始创建流程（填写内容仍会保留）。`
      )
      if (ok) {
        await resumeFromSession(existingSession)
        return
      }
      scheduleSaveSession({ creating: null })
    }
  }

  creating.value = true
  creatingText.value = '⚙️ 初始化存档...'
  let stage = '初始化存档'
  let input: any = null
  let providerErrors: { provider: string; message: string; stack?: string }[] = []
  const startedAt = new Date().toISOString()
  let succeeded = false

  let activeCharId: string | null = null
  const slotKey = '存档1'

  const checkpoint = (nextStage: string, text?: string) => {
    stage = nextStage
    if (typeof text === 'string') creatingText.value = text
    scheduleSaveSession({
      creating: {
        startedAt,
        stage,
        text: creatingText.value,
        input: input || undefined,
        characterId: activeCharId || undefined,
        slotKey
      }
    })
  }

  try {
    await requestWakeLock()
  } catch {
    void 0
  }

  checkpoint(stage, creatingText.value)
  try {
    const name = (draft.道号 || '无名').trim() || '无名'
    const charId = characterStore.createCharacter(name, '单机')
    activeCharId = charId
    characterStore.setActive(charId, slotKey)

    checkpoint('初始化存档', '⚙️ 初始化存档...')
    gameState.fromSaveData({
      游戏时间: { 年: 1000, 月: 1, 日: 1, 小时: 8, 分钟: 0 },
      玩家角色状态: {
        境界: { 名称: '凡人' },
        位置: { 描述: '临时位置（等待AI初始化）', x: 1000, y: 1000 }
      },
      角色基础信息: {
        名字: name,
        性别: draft.性别,
        年龄: draft.年龄,
        世界: draft.世界.名称,
        天资: draft.天资.名称,
        出生: draft.出身.名称,
        灵根: { 名称: draft.灵根.名称, 品级: draft.灵根.品级 },
        天赋: draft.天赋.map((t) => ({ 名称: t.名称, 描述: t.描述 })),
        先天六司: attributeKeys.reduce((acc, k) => {
          const bonus = draft.出身?.属性修正?.[k]
          const b = typeof bonus === 'number' ? bonus : 0
          acc[k] = (draft.先天六司[k] || 0) + b
          return acc
        }, {} as Record<AttributeKey, number>)
      } as any,
      世界信息: undefined,
      背包: { 灵石: { 下品: 0, 中品: 0, 上品: 0, 极品: 0 }, 物品: {} },
      人物关系: {}
    } as any)

    try {
      await characterStore.saveCurrentGame(charId, slotKey, { toast: false })
    } catch {
      void 0
    }

    checkpoint('世界生成', '🌍 世界生成：准备中...')

    ensureWorldCounts()
    const counts = draft.世界规模

    input = {
      worldName: draft.世界.名称,
      worldEra: draft.世界.纪元,
      worldBackground: draft.世界.描述,
      characterName: name,
      characterBackground: draft.出身.名称,
      seed: Date.now(),
      counts: {
        continentCount: counts?.continentCount ?? 4,
        factionCount: counts?.factionCount ?? 5,
        locationCount: counts?.locationCount ?? 12,
        secretRealmsCount: Math.min(counts?.locationCount ?? 12, counts?.secretRealmsCount ?? 5)
      }
    }

    const onProgress = (t: string) => {
      creatingText.value = t
      scheduleSaveSession({
        creating: {
          startedAt,
          stage,
          text: t,
          input: input || undefined,
          characterId: activeCharId || undefined,
          slotKey
        }
      })
    }

    let worldInfo: any
    providerErrors = []
    const customApiUrl = (settingsStore.customApiUrl || '').trim()
    const customApiKey = (settingsStore.customApiKey || '').trim()

    const aiBaseUrl = resolveAiBaseUrl({ preset: settingsStore.aiProviderPreset, customBaseUrl: settingsStore.customApiUrl })
    const aiModel = (settingsStore.aiModel || '').trim()

    if (aiBaseUrl && aiModel) {
      try {
        worldInfo = await generateWorldInfo(input, {
          provider: 'openai_compat',
          openAiCompat: {
            baseUrl: aiBaseUrl,
            apiKey: customApiKey,
            model: aiModel,
            temperature: settingsStore.aiTemperature,
            maxTokens: settingsStore.aiMaxOutputTokens,
            timeoutMs: 240000
          },
          onProgress
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误'
        providerErrors.push({ provider: 'openai_compat', message: msg, stack: e instanceof Error ? e.stack : undefined })
        creatingText.value = `🌍 世界生成：AI失败（${msg}），尝试自定义API...`
        worldInfo = null
      }
    }

    if (!worldInfo && settingsStore.aiProviderPreset === 'custom' && customApiUrl) {
      try {
        worldInfo = await generateWorldInfo(input, {
          provider: 'custom_api',
          customApi: { baseUrl: customApiUrl, apiKey: customApiKey, endpointPath: '/world/generate', timeoutMs: 60000 },
          onProgress
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误'
        providerErrors.push({ provider: 'custom_api', message: msg, stack: e instanceof Error ? e.stack : undefined })
        creatingText.value = `🌍 世界生成：自定义API失败（${msg}），使用本地生成...`
        worldInfo = null
      }
    }

    if (!worldInfo) {
      worldInfo = await generateWorldInfo(input, { provider: 'local', onProgress })
    }

    checkpoint('写入世界信息')
    ;(gameState as any).世界信息 = worldInfo

    try {
      await characterStore.saveCurrentGame(charId, '存档1', { toast: false })
    } catch {
      void 0
    }

    checkpoint('角色初始化', '📜 天道正在为你书写命运之章...')

    if (aiBaseUrl && aiModel) {
      const resp = await runCharacterInit({
        saveData: gameState.toSaveData(),
        preset: settingsStore.aiProviderPreset,
        customApiUrl: settingsStore.customApiUrl,
        apiKey: (settingsStore.customApiKey || '').trim(),
        model: (settingsStore.aiModel || '').trim(),
        temperature: settingsStore.aiTemperature,
        maxOutputTokens: Math.max(4096, settingsStore.aiMaxOutputTokens),
        allowPromptOverrides: settingsStore.useImportedPromptOverrides,
        initMode: settingsStore.initMode,
        stream: settingsStore.aiStreaming,
        onProgress: (text) => {
          creatingText.value = `📜 天道正在为你书写命运之章...\n\n${text.slice(-160)}`
        }
      })

      gameState.applyCommands(resp.tavern_commands)
      gameState.appendNarrative({ role: 'assistant', text: resp.text, createdAt: new Date().toISOString(), stateChanges: resp.tavern_commands })
      gameState.addToShortTermMemory((resp as any).mid_term_memory ? (resp as any).mid_term_memory : resp.text)
    }

    checkpoint('选择初始位置')
    const pos: any = (gameState as any)?.玩家角色状态?.位置
    const hasX = typeof pos?.x === 'number' && Number.isFinite(pos.x)
    const hasY = typeof pos?.y === 'number' && Number.isFinite(pos.y)
    if (!hasX || !hasY) {
      gameState.玩家角色状态.位置 = pickInitialLocation(worldInfo)
    }

    checkpoint('保存存档', '💾 写入存档...')
    await characterStore.saveCurrentGame(charId, slotKey)

    checkpoint('进入游戏')
    clearCreationSession()
    succeeded = true
    await router.push({ name: 'GameView' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[CharacterCreate] startGame failed:', { stage, error: e })
    try {
      saveCreationSessionNow({
        creating: {
          startedAt,
          stage,
          text: creatingText.value,
          input: input || undefined,
          characterId: activeCharId || undefined,
          slotKey
        }
      })
    } catch {
      void 0
    }
    try {
      worldGenErrorStore.setError({
        stage,
        message: msg,
        stack: e instanceof Error ? e.stack : undefined,
        input: input || undefined,
        providerErrors: providerErrors?.length ? providerErrors : undefined
      })
      await router.push({ name: 'WorldGenError' })
    } catch {
      alert(`创建失败[${stage}]：${msg}`)
    }
  } finally {
    creating.value = false
    creatingText.value = ''
    if (!succeeded) scheduleSaveSession({ creating: null })
    void releaseWakeLock()
  }
}

function alertUnavailable() {
  alert('该功能暂未开放')
}

function showHelp() {
  alert(
    '初入仙途\n\n- 按步骤完成世界/天资/出身/灵根/天赋/先天六司\n- 天道点为单一总池：总点(天资) - 出身消耗 - 灵根消耗 - 天赋消耗 - 六司分配总和 = 剩余\n- 最后在预览页点击“开启仙途”进入游戏'
  )
}

function handleSavePreset() {
  const name = prompt('请输入预设名称')
  if (!name) return
  savePreset(name.trim(), JSON.parse(JSON.stringify(draft)) as CreationDraft)
  alert('预设已保存')
}

function handleLoadPreset() {
  const presets = loadPresets()
  const names = Object.keys(presets)
  if (!names.length) {
    alert('暂无预设')
    return
  }
  const picked = prompt(`请输入要加载的预设名称：\n${names.join('\n')}`)
  if (!picked) return
  const found = presets[picked]
  if (!found) {
    alert('未找到该预设')
    return
  }
  Object.assign(draft, JSON.parse(JSON.stringify(found)) as CreationDraft)
  ensureWorldCounts()
  const legacyAllFive = attributeKeys.every((k) => (draft.先天六司?.[k] ?? 0) === 5)
  const legacySum = attributeKeys.reduce((s, k) => s + ((draft.先天六司?.[k] ?? 0) as number), 0)
  if (legacyAllFive && legacySum === 30) {
    draft.先天六司 = { 根骨: 0, 灵性: 0, 悟性: 0, 气运: 0, 魅力: 0, 心性: 0 }
  }
  alert('预设已加载')
}

function handleClearCustom() {
  const ok = confirm('确定要清除当前自定义并重置为默认吗？')
  if (!ok) return
  clearCreationSession()
  const fresh = createEmptyDraft('单机')
  Object.assign(draft, JSON.parse(JSON.stringify(fresh)) as CreationDraft)
  ensureWorldCounts()
  currentStep.value = 1
  lastClickedTalentId.value = null
}
</script>

<style scoped>
.creation-container {
  height: var(--app-vh, 100vh);
  padding: calc(22px + var(--safe-top, 0px)) 22px 22px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 16px;
  align-items: stretch;
  position: relative;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1000px 520px at 30% 0%, rgba(56, 189, 248, 0.16), transparent 62%),
    radial-gradient(900px 520px at 70% 0%, rgba(99, 102, 241, 0.16), transparent 62%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.35), rgba(2, 6, 23, 0.92)),
    url('/creation-bg.jpg');
  background-size: auto, auto, auto, cover;
  background-position: 0 0, 0 0, 0 0, center;
  background-repeat: no-repeat;
  filter: saturate(1.02) brightness(0.92);
}

.header,
.step-row,
.nav {
  width: min(1180px, 100%);
  justify-self: center;
  align-self: start;
  position: relative;
  z-index: 1;
}

.main-panel {
  width: min(1180px, 100%);
  justify-self: center;
  align-self: stretch;
  position: relative;
  z-index: 1;
}

.header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.mode-badge {
  justify-self: start;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(251, 191, 36, 0.22);
  color: rgba(251, 191, 36, 0.95);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.action-btn {
  appearance: none;
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.55);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
}

.action-btn:hover {
  background: rgba(15, 23, 42, 0.8);
}

.header-icons {
  justify-self: end;
  display: flex;
  gap: 10px;
}

.mobile-only {
  display: none;
}

.mobile-stepper {
  display: none;
  width: min(1180px, 100%);
  justify-self: center;
  position: relative;
  z-index: 1;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(22px);
  padding: 12px 14px;
}

.mobile-stepper-text {
  text-align: center;
  font-size: 12px;
  color: rgba(191, 219, 254, 0.92);
  line-height: 1.4;
  font-weight: 650;
}

.mobile-stepper-bar {
  margin-top: 10px;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
}

.mobile-stepper-bar-inner {
  height: 100%;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.85);
}

.mobile-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: rgba(2, 6, 23, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px 12px calc(12px + var(--safe-bottom, 0px));
}

.mobile-sheet {
  width: min(520px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.mobile-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.mobile-sheet-title {
  font-weight: 750;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}

.mobile-sheet-body {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.mobile-sheet-btn {
  appearance: none;
  border-radius: 14px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  text-align: left;
  font-weight: 650;
}

.mobile-sheet-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.icon-tile {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-1);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
}

.icon-tile:hover {
  background: rgba(15, 23, 42, 0.85);
}

.step-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(22px);
  position: relative;
}

.step-row::before {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  top: 30px;
  height: 1px;
  background: rgba(148, 163, 184, 0.22);
}

.step-item {
  display: grid;
  justify-items: center;
  gap: 8px;
  min-width: 0;
}

.step-indicator {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.step-indicator.active {
  background: rgba(59, 130, 246, 0.8);
  color: #fff;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.45);
}

.step-indicator.completed {
  background: rgba(51, 65, 85, 0.75);
  color: rgba(255, 255, 255, 0.85);
}

.step-indicator.inactive {
  background: rgba(59, 130, 246, 0.12);
  color: rgba(255, 255, 255, 0.55);
  border: 2px solid rgba(59, 130, 246, 0.18);
}

.step-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}

.main-panel {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.44);
  backdrop-filter: blur(26px);
  padding: 18px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 30px 90px -42px rgba(0, 0, 0, 0.72),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.main-content {
  flex: 1;
  min-height: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: 1fr;
  gap: 16px;
  min-height: 0;
}

.main-content.preview-only {
  grid-template-columns: 1fr;
}

.sidebar {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(18px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.world-sidebar {
  background: rgba(2, 6, 23, 0.18);
  padding: 14px;
}

.tab-row {
  display: flex;
  gap: 10px;
}

.world-tabs {
  gap: 10px;
}

.world-tabs .tab-button {
  flex: 1;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 650;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.world-tabs .tab-button.active {
  background: rgba(37, 99, 235, 0.28);
  border-color: rgba(59, 130, 246, 0.75);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.ai-panel {
  display: grid;
  gap: 10px;
}

.ai-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.ai-input {
  width: 100%;
  min-height: 90px;
  resize: vertical;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-1);
  outline: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: grid;
  place-items: center;
  z-index: 3000;
}

.modal-card {
  width: min(720px, calc(100vw - 32px));
  max-height: calc(var(--app-vh, 100vh) - 64px);
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.95);
  padding: 14px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.ai-gen-modal {
  width: min(520px, calc(100vw - 32px));
}

.ai-gen-title {
  color: rgba(251, 191, 36, 0.95);
}

.ai-gen-textarea {
  min-height: 110px;
  resize: none;
}

.ai-gen-primary {
  background: rgba(251, 191, 36, 0.9);
  color: rgba(2, 6, 23, 0.9);
  border-color: rgba(251, 191, 36, 0.75);
}

.ai-gen-primary:hover {
  background: rgba(251, 191, 36, 1);
}

.aptitude-modal {
  width: min(640px, calc(100vw - 32px));
}

.origin-modal {
  width: min(780px, calc(100vw - 32px));
}

.origin-box {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.origin-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}

.origin-box-title {
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
}

.origin-add-btn {
  appearance: none;
  border-radius: 10px;
  padding: 6px 10px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.18);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.origin-add-btn:hover {
  background: rgba(59, 130, 246, 0.24);
}

.origin-box-body {
  padding: 10px 12px;
}

.origin-empty {
  text-align: center;
  padding: 22px 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.origin-list {
  display: grid;
  gap: 10px;
}

.origin-row {
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 10px;
  align-items: center;
}

.origin-row-effect {
  grid-template-columns: 160px 1fr auto;
}

.root-modal {
  width: min(820px, calc(100vw - 32px));
}

.root-box {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.root-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}

.root-box-title {
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
}

.root-add-btn {
  appearance: none;
  border-radius: 10px;
  padding: 6px 10px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.18);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.root-add-btn:hover {
  background: rgba(59, 130, 246, 0.24);
}

.root-box-body {
  padding: 10px 12px;
}

.root-empty {
  text-align: center;
  padding: 22px 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.root-list {
  display: grid;
  gap: 10px;
}

.root-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.talent-modal {
  width: min(860px, calc(100vw - 32px));
}

.talent-box {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.talent-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}

.talent-box-title {
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
}

.talent-add-btn {
  appearance: none;
  border-radius: 10px;
  padding: 6px 14px;
  border: 1px solid rgba(99, 102, 241, 0.40);
  background: rgba(99, 102, 241, 0.22);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.talent-add-btn:hover {
  background: rgba(99, 102, 241, 0.28);
}

.talent-box-body {
  padding: 10px 12px;
}

.talent-empty {
  text-align: center;
  padding: 22px 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.talent-list {
  display: grid;
  gap: 10px;
}

.talent-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.aptitude-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aptitude-color-row .modal-input {
  flex: 1;
}

.aptitude-color-picker {
  width: 44px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
}

.modal-body {
  padding: 12px 2px;
  display: grid;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-field {
  display: grid;
  gap: 6px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.modal-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.modal-input,
.modal-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-1);
  outline: none;
}

.modal-textarea {
  min-height: 90px;
  resize: vertical;
}

.combo-panel {
  display: grid;
  gap: 12px;
}

.combo-section {
  display: grid;
  gap: 8px;
}

.combo-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.combo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.combo-btn {
  appearance: none;
  border-radius: 12px;
  padding: 10px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-1);
  cursor: pointer;
  display: grid;
  gap: 4px;
  justify-items: center;
}

.combo-btn:hover {
  background: rgba(255, 255, 255, 0.07);
}

.combo-btn.selected {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.65);
}

.combo-icon {
  font-size: 16px;
  line-height: 1;
}

.combo-name {
  font-size: 12px;
}

.combo-sub {
  font-size: 11px;
  color: rgba(251, 191, 36, 0.95);
}

.combo-preview {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.18);
  padding: 12px;
  display: grid;
  gap: 8px;
}

.combo-preview-title {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.combo-preview-line {
  color: rgba(255, 255, 255, 0.85);
}

.combo-preview-desc {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  line-height: 1.6;
}

.tab-button {
  appearance: none;
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.tab-button.active {
  background: rgba(59, 130, 246, 0.28);
  border-color: rgba(59, 130, 246, 0.6);
}

.tab-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.option-list {
  display: grid;
  gap: 8px;
  align-content: start;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.world-list {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18);
  gap: 12px;
}

.world-list .option-title {
  font-size: 18px;
  font-weight: 600;
}

.world-list .option-points {
  display: none;
}

.world-list::-webkit-scrollbar {
  width: 10px;
}

.world-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
}

.world-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
  border: 2px solid rgba(2, 6, 23, 0.35);
}

.world-list::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.78);
}

.option-item {
  appearance: none;
  text-align: left;
  border-radius: 12px;
  padding: 13px 14px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: var(--text-1);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.option-item-inline {
  user-select: none;
}

.option-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.world-list .option-item {
  min-height: 64px;
  border-radius: 14px;
  padding: 16px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.07);
}

.option-item.selected {
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.75);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.22);
}

.option-actions {
  display: flex;
  gap: 6px;
}

.mini-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.mini-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.mini-icon-btn.danger {
  border-color: rgba(239, 68, 68, 0.35);
  color: rgba(239, 68, 68, 0.95);
}

.world-list .option-item.selected {
  background: rgba(37, 99, 235, 0.28);
  border-color: rgba(59, 130, 246, 0.85);
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.28),
    inset 0 0 0 1px rgba(59, 130, 246, 0.18);
}

.option-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-points {
  color: rgba(251, 191, 36, 0.95);
  white-space: nowrap;
  font-size: 12px;
}

.detail {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.2);
  backdrop-filter: blur(18px);
  padding: 18px;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.detail-inner {
  height: 100%;
  display: grid;
  gap: 12px;
  align-content: start;
  min-height: 0;
}

.detail-inner.center {
  align-content: center;
  justify-items: center;
  text-align: center;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  color: var(--text-1);
}

.detail-sub {
  color: rgba(251, 191, 36, 0.95);
  font-size: 12px;
}

.detail-text {
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
}

.ghost-btn {
  appearance: none;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-1);
  cursor: pointer;
}

.ghost-btn:hover {
  background: rgba(0, 0, 0, 0.35);
}

.world-config {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.18);
  padding: 12px;
}

.world-config-title {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
}

.world-config-shell {
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  background: rgba(2, 6, 23, 0.12);
  padding: 14px;
}

.world-config-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
}

.cfg-item {
  flex: 0 0 auto;
  min-width: 180px;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
}

.cfg-k {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.cfg-sub {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
}

.cfg-input {
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.cfg-input:focus {
  border: none;
  outline: none;
}

.world-config-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.point-badge {
  color: rgba(251, 191, 36, 0.95);
  font-weight: 600;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meta-item {
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.45);
}

.meta-k {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.meta-v {
  margin-top: 6px;
  color: var(--text-1);
}

.slider-list {
  display: grid;
  gap: 14px;
}

.attribute-slider {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
}

.attr-title {
  font-weight: 600;
  color: var(--text-1);
}

.attr-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  line-height: 1.4;
}

.attr-right {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  align-items: center;
}

.round-btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.55);
  color: #fff;
  cursor: pointer;
}

.round-btn:hover {
  background: rgba(59, 130, 246, 0.75);
}

.range {
  width: 100%;
}

.attr-value {
  width: 30px;
  text-align: center;
  color: var(--text-1);
}

.bottom-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.preview-header {
  text-align: center;
}

.preview-title {
  margin: 0;
  font-size: 26px;
}

.form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: rgba(255, 255, 255, 0.85);
}

.input {
  width: 100%;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-1);
  outline: none;
}

.input:focus {
  border-color: rgba(59, 130, 246, 0.75);
}

.hint {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.35);
  padding: 12px;
  border-radius: 12px;
}

.sum-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.sum-k {
  color: rgba(255, 255, 255, 0.6);
}

.sum-v {
  color: var(--text-1);
  text-align: right;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(22px);
  padding-bottom: calc(12px + var(--safe-bottom, 0px));
}

.nav-btn {
  appearance: none;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-1);
  cursor: pointer;
}

.nav-btn:hover {
  background: rgba(15, 23, 42, 0.8);
}

.nav-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.nav-mid {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.nav-btn-ico {
  display: none;
  font-size: 18px;
  line-height: 1;
}

.nav-btn-text {
  line-height: 1;
}

@media (max-width: 980px) {
  .header {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .header-icons {
    justify-self: center;
  }

  .main-content {
    grid-template-columns: 1fr;
  }

  .main-content:not(.preview-only) {
    grid-template-rows: auto 1fr;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .grid3 {
    grid-template-columns: 1fr;
  }

  .attribute-slider {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .creation-container {
    padding: calc(16px + var(--safe-top, 0px)) 12px calc(16px + var(--safe-bottom, 0px) + 78px);
    gap: 12px;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .header {
    grid-template-columns: 1fr auto;
    justify-items: stretch;
    align-items: center;
  }

  .header-actions {
    display: none;
  }

  .header-icons .icon-tile:not(.mobile-only) {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .step-row {
    display: none;
  }

  .mobile-stepper {
    display: block;
  }

  .main-panel {
    padding: 12px;
    border-radius: 14px;
  }

  .sidebar {
    padding: 12px;
    border-radius: 14px;
    max-height: calc(var(--app-vh, 100vh) * 0.34);
  }

  .tab-row {
    width: 100%;
  }

  .tab-row .tab-button {
    flex: 1;
  }

  .detail {
    padding: 12px;
    border-radius: 14px;
  }

  .option-list {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }

  .option-item {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 10px 14px;
    min-height: 44px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }

  .world-list .option-item {
    min-height: 44px;
    border-radius: 999px;
    padding: 10px 14px;
  }

  .nav {
    position: fixed;
    left: calc(12px + var(--safe-left, 0px));
    right: calc(12px + var(--safe-right, 0px));
    bottom: calc(12px + var(--safe-bottom, 0px));
    width: auto;
    z-index: 2500;
    border-radius: 18px;
  }

  .nav-btn {
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .nav-btn-ico {
    display: inline;
  }

  .nav-back .nav-btn-text {
    display: none;
  }

  .nav-mid {
    font-size: 12px;
  }

  .nav-next {
    background: rgba(37, 99, 235, 0.48);
    border-color: rgba(59, 130, 246, 0.6);
  }
}
</style>
