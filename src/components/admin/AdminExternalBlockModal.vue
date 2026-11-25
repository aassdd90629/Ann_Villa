<script setup>
import { ref, watch } from 'vue'
import { X, Calendar, AlertCircle, Trash2, CheckCircle2, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  block: {
    type: Object,
    default: null
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'unlock'])

const isConfirmingUnlock = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      isConfirmingUnlock.value = false
    }
  }
)

const closeModal = () => {
  if (!props.isSubmitting) {
    isConfirmingUnlock.value = false
    emit('update:modelValue', false)
  }
}

const calculateNights = (s, e) => {
  if (!s || !e) return 1
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)))
}

const formatBlockSummary = (summary) => {
  if (!summary) return '外部平台佔用保留'
  const s = String(summary).trim()
  if (s.toLowerCase() === 'reserved') return '外部旅客已預約'
  if (s.includes('Not available')) return '外部系統保留'
  return s
}

const handleConfirmUnlock = () => {
  emit('unlock', props.block)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && block" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <span class="badge-source">
              外部佔用檔期
            </span>
            <h3>外部佔用檔期管理</h3>
          </div>
          <button class="btn-close" @click="closeModal" :disabled="isSubmitting" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 核心提示橫幅：清楚向管家說明為何沒有官網訂單 -->
          <div class="source-notice-banner">
            <div class="banner-title">
              <AlertCircle :size="18" class="text-gold" />
              <span>此檔期來自 <strong>外部保留檔期</strong></span>
            </div>
            <p class="banner-desc">
              此時段由外部管道同步鎖定，<strong>非官網線上直訂單</strong>，因此系統無本站旅客聯絡明細。
              若您想將此時段重新對外開放預約，可點擊下方按鈕一鍵解除。
            </p>
          </div>

          <!-- 解除防呆確認區塊 -->
          <div v-if="isConfirmingUnlock" class="unlock-confirm-box">
            <div class="confirm-head">
              <strong>確定要解除此外部佔用檔期嗎？</strong>
            </div>
            <p class="confirm-desc">
              解除後，【{{ block.startDate || block.start_date }} 至 {{ block.endDate || block.end_date }}】將立即變回空房，前台月曆將即刻開放預約！
            </p>
            <div class="confirm-actions">
              <button
                type="button"
                class="btn-execute-unlock"
                :disabled="isSubmitting"
                @click="handleConfirmUnlock"
              >
                <Trash2 :size="14" />
                <span>{{ isSubmitting ? '正在解除中...' : '確認解除並開放' }}</span>
              </button>
              <button
                type="button"
                class="btn-cancel-unlock"
                :disabled="isSubmitting"
                @click="isConfirmingUnlock = false"
              >
                <span>暫不解除</span>
              </button>
            </div>
          </div>

          <!-- 檔期資訊卡片 (純友善文字呈現，零技術編號) -->
          <div class="details-card">
            <div class="card-row">
              <span class="lbl">來源管道：</span>
              <span class="val font-bold text-gold">
                {{ block.source === 'MANUAL_LOCK' ? '管家自主鎖房' : '外部系統保留' }}
              </span>
            </div>
            <div class="card-row">
              <span class="lbl">佔用區間：</span>
              <span class="val font-mono">
                {{ block.startDate || block.start_date }} 至 {{ block.endDate || block.end_date }}
              </span>
            </div>
            <div class="card-row">
              <span class="lbl">佔用晚數：</span>
              <span class="val font-bold text-gold">
                {{ calculateNights(block.startDate || block.start_date, block.endDate || block.end_date) }} 晚
              </span>
            </div>
            <div class="card-row">
              <span class="lbl">佔用狀態：</span>
              <span class="val font-bold">{{ formatBlockSummary(block.summary) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="!isConfirmingUnlock"
            type="button"
            class="btn-action-unlock"
            :disabled="isSubmitting"
            @click="isConfirmingUnlock = true"
          >
            <Trash2 :size="15" />
            <span>解除此檔期 (釋放為空房)</span>
          </button>

          <button
            type="button"
            class="btn-close-modal"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .badge-source {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      background: rgba(168, 85, 247, 0.15);
      color: #7e22ce;
      border: 1px solid rgba(168, 85, 247, 0.35);
    }

    h3 {
      font-size: 1.05rem;
      margin: 0;
      font-weight: 600;
      color: var(--admin-text-main, #1A1E1F);
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--admin-text-muted, #64748b);
    cursor: pointer;
    padding: 0.25rem;
    &:hover { color: var(--admin-text-main, #1A1E1F); }
  }
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.source-notice-banner {
  background: rgba(168, 85, 247, 0.08);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 8px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .banner-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.92rem;
    color: var(--admin-text-main, #1A1E1F);
    .text-purple { color: #7e22ce; }
    strong { color: #6b21a8; }
  }

  .banner-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--admin-text-sub, #475569);
    line-height: 1.45;
  }
}

.unlock-confirm-box {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .confirm-head strong {
    color: #b91c1c;
    font-size: 0.92rem;
  }

  .confirm-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--admin-text-sub, #475569);
    line-height: 1.4;
  }

  .confirm-actions {
    display: flex;
    gap: 0.65rem;
    margin-top: 0.2rem;

    .btn-execute-unlock {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.9rem;
      background: #dc2626;
      color: #FFFFFF;
      border: none;
      border-radius: 5px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      &:hover:not(:disabled) { background: #b91c1c; }
    }

    .btn-cancel-unlock {
      padding: 0.45rem 0.8rem;
      background: var(--admin-bg-base, #F5F3EC);
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      color: var(--admin-text-sub, #475569);
      border-radius: 5px;
      font-size: 0.82rem;
      cursor: pointer;
    }
  }
}

.details-card {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
  border-radius: 8px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.88rem;

    .lbl { color: var(--admin-text-sub, #475569); }
    .val { color: var(--admin-text-main, #1A1E1F); }
    .text-gold { color: var(--gold-dark, #91754F); }
  }
}

.modal-footer {
  padding: 1.1rem 1.5rem;
  border-top: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  gap: 0.65rem;
  justify-content: flex-end;

  .btn-action-unlock {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.55rem 0.95rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #dc2626;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    &:hover:not(:disabled) { background: #dc2626; color: #FFFFFF; }
  }

  .btn-close-modal {
    padding: 0.55rem 0.95rem;
    background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-sub, #475569);
    border-radius: 6px;
    font-size: 0.82rem;
    cursor: pointer;
  }
}
</style>
