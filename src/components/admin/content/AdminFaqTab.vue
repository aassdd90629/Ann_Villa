<script setup>
import { 
  HelpCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  faqs: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['add', 'edit', 'delete', 'toggleActive'])
const { isViewer } = useAdminAuth()
</script>

<template>
  <div class="admin-faq-tab">
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">常見問題與解答管理 (FAQ)</h3>
        <p class="tab-subtitle">管家可自主維護官網 FAQ 手風琴列表，即時解答旅客平假日、廚房、烤肉、備品與寵物等疑惑。</p>
      </div>
      <button 
        type="button" 
        class="btn-add-primary" 
        @click="emit('add')" 
        :disabled="isViewer"
      >
        <Plus :size="16" />
        <span>新增常見問答</span>
      </button>
    </div>

    <!-- FAQ 列表卡片 -->
    <div v-if="faqs.length === 0" class="empty-faq-box">
      <HelpCircle :size="36" class="empty-icon" />
      <p>目前尚無常見問題，點擊上方按鈕立即新增</p>
    </div>

    <div v-else class="faq-list">
      <div 
        v-for="(faq, idx) in faqs" 
        :key="faq.key" 
        class="faq-item-card"
        :class="{ inactive: !faq.isActive }"
      >
        <div class="faq-card-header">
          <div class="badge-num-row">
            <span class="faq-order-badge">#{{ faq.sortOrder || idx + 1 }}</span>
            <button 
              type="button" 
              class="status-pill-btn" 
              :class="{ active: faq.isActive, disabled: !faq.isActive }"
              @click="emit('toggleActive', faq)"
              :disabled="isViewer"
            >
              <span class="indicator"></span>
              <span>{{ faq.isActive ? '前台顯示中' : '已隱藏' }}</span>
            </button>
          </div>

          <div class="card-actions">
            <button 
              type="button" 
              class="btn-action edit" 
              @click="emit('edit', faq)" 
              title="編輯此問答"
              :disabled="isViewer"
            >
              <Edit3 :size="14" />
              <span>編輯</span>
            </button>
            <button 
              type="button" 
              class="btn-action delete" 
              @click="emit('delete', faq)" 
              title="刪除此問答"
              :disabled="isViewer"
            >
              <Trash2 :size="14" />
              <span>刪除</span>
            </button>
          </div>
        </div>

        <div class="faq-card-body">
          <h4 class="faq-question">Q: {{ faq.qZh }}</h4>
          <p v-if="faq.qEn" class="faq-question-en">Q: {{ faq.qEn }}</p>
          <div class="faq-answer">
            <span class="a-label">A:</span>
            <p>{{ faq.aZh }}</p>
          </div>
          <div v-if="faq.aEn" class="faq-answer en">
            <span class="a-label">A (En):</span>
            <p>{{ faq.aEn }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-faq-tab {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tab-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  .tab-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.3rem 0;
  }

  .tab-subtitle {
    font-size: 0.82rem;
    color: var(--admin-text-muted, #94a3b8);
    margin: 0;
  }

  .btn-add-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.15rem;
    background: var(--gold-primary, #d4af37);
    border: 1px solid var(--gold-primary, #d4af37);
    border-radius: 6px;
    color: #121415;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) { background: #dfbc46; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: border-color 0.2s ease;

  &.inactive {
    opacity: 0.65;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .faq-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.06));

    .badge-num-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;

      .faq-order-badge {
        font-size: 0.75rem;
        font-family: monospace;
        font-weight: 600;
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold-primary, #d4af37);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 4px;
        padding: 0.15rem 0.45rem;
      }

      .status-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.72rem;
        border: 1px solid transparent;
        cursor: pointer;

        .indicator { width: 6px; height: 6px; border-radius: 50%; }

        &.active {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.35);
          color: #22c55e;
          .indicator { background: #22c55e; }
        }

        &.disabled {
          background: rgba(148, 163, 184, 0.15);
          border-color: rgba(148, 163, 184, 0.35);
          color: #94a3b8;
          .indicator { background: #94a3b8; }
        }
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;

      .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        border: 1px solid transparent;
        cursor: pointer;
        background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));

        &.edit {
          border-color: rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          &:hover:not(:disabled) { background: rgba(56, 189, 248, 0.15); }
        }

        &.delete {
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
          &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); }
        }

        &:disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }
  }

  .faq-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .faq-question {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--gold-primary, #d4af37);
      margin: 0;
      line-height: 1.4;
    }

    .faq-question-en {
      font-size: 0.8rem;
      color: var(--admin-text-muted, #94a3b8);
      margin: 0;
      font-style: italic;
    }

    .faq-answer {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--admin-text-sub, #cbd5e1);
      line-height: 1.5;

      .a-label {
        font-weight: 600;
        color: var(--gold-primary, #d4af37);
        flex-shrink: 0;
      }

      p { margin: 0; }

      &.en {
        color: var(--admin-text-muted, #94a3b8);
        font-size: 0.78rem;
        .a-label { color: var(--admin-text-muted, #94a3b8); }
      }
    }
  }
}

.empty-faq-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1rem;
  background: var(--admin-bg-card, #151f32);
  border: 1px dashed var(--admin-border-subtle, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
  color: var(--admin-text-muted, #94a3b8);
  font-size: 0.88rem;

  .empty-icon { opacity: 0.4; margin-bottom: 0.75rem; }
}
</style>
