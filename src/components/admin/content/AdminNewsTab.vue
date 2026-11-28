<script setup>
import { 
  Newspaper, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Star 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  news: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['add', 'edit', 'delete', 'toggleActive'])
const { isViewer } = useAdminAuth()
</script>

<template>
  <div class="admin-news-tab">
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">最新消息與優惠活動管理</h3>
        <p class="tab-subtitle">管家可自主發布早鳥優惠、節慶專案或園區公告，支援封面照片與置頂精選標記。</p>
      </div>
      <button 
        type="button" 
        class="btn-add-primary" 
        @click="emit('add')" 
        :disabled="isViewer"
      >
        <Plus :size="16" />
        <span>發布新公告</span>
      </button>
    </div>

    <!-- 消息列表 -->
    <div v-if="news.length === 0" class="empty-news-box">
      <Newspaper :size="36" class="empty-icon" />
      <p>目前尚無消息公告，點擊上方按鈕立即發布</p>
    </div>

    <div v-else class="news-list-grid">
      <div 
        v-for="item in news" 
        :key="item.key" 
        class="news-item-card"
        :class="{ inactive: !item.isActive, featured: item.featured }"
      >
        <div class="news-img-col">
          <img :src="item.image || '/img/homebanner/homebanner-01.webp'" :alt="item.titleZh" />
          <span v-if="item.featured" class="featured-badge">
            <Star :size="11" />
            <span>精選置頂</span>
          </span>
        </div>

        <div class="news-info-col">
          <div class="news-meta-row">
            <span class="category-chip">{{ item.categoryZh }}</span>
            <div class="date-tag">
              <Calendar :size="12" />
              <span>{{ item.date }}</span>
            </div>
            <button 
              type="button" 
              class="status-pill-btn" 
              :class="{ active: item.isActive, disabled: !item.isActive }"
              @click="emit('toggleActive', item)"
              :disabled="isViewer"
            >
              <span class="indicator"></span>
              <span>{{ item.isActive ? '上架中' : '已下架' }}</span>
            </button>
          </div>

          <h4 class="news-title">{{ item.titleZh }}</h4>
          <p class="news-summary">{{ item.summaryZh }}</p>

          <div class="news-footer-actions">
            <button 
              type="button" 
              class="btn-action edit" 
              @click="emit('edit', item)" 
              title="編輯公告"
              :disabled="isViewer"
            >
              <Edit3 :size="14" />
              <span>編輯</span>
            </button>
            <button 
              type="button" 
              class="btn-action delete" 
              @click="emit('delete', item)" 
              title="刪除公告"
              :disabled="isViewer"
            >
              <Trash2 :size="14" />
              <span>刪除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-news-tab {
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

.news-list-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-item-card {
  display: flex;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  &.inactive {
    opacity: 0.65;
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.featured {
    border-color: var(--gold-primary, #d4af37);
  }

  .news-img-col {
    position: relative;
    width: 220px;
    flex-shrink: 0;
    background: var(--admin-bg-base, #0d131f);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .featured-badge {
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.5rem;
      background: rgba(18, 20, 21, 0.85);
      border: 1px solid var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 4px;
      backdrop-filter: blur(4px);
    }
  }

  .news-info-col {
    flex: 1;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .news-meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.6rem;

      .category-chip {
        font-size: 0.72rem;
        padding: 0.15rem 0.5rem;
        background: rgba(212, 175, 55, 0.12);
        border: 1px solid rgba(212, 175, 55, 0.3);
        color: var(--gold-primary, #d4af37);
        border-radius: 4px;
        font-weight: 500;
      }

      .date-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.78rem;
        color: var(--admin-text-muted, #94a3b8);
      }

      .status-pill-btn {
        margin-left: auto;
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

    .news-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--admin-text-main, #f8fafc);
      margin: 0 0 0.4rem 0;
      line-height: 1.4;
    }

    .news-summary {
      font-size: 0.85rem;
      color: var(--admin-text-sub, #cbd5e1);
      margin: 0 0 1rem 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-footer-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-end;

      .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.3rem 0.65rem;
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
}

.empty-news-box {
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

@media (max-width: 640px) {
  .news-item-card {
    flex-direction: column;
    .news-img-col { width: 100%; height: 160px; }
  }
}
</style>
