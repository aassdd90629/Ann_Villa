<script setup>
import { 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  slides: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['upload', 'edit', 'delete', 'toggleActive', 'reorder'])
const { isViewer } = useAdminAuth()

// 上移一格
const handleMoveUp = (index) => {
  if (index === 0 || isViewer.value) return
  const newList = [...props.slides]
  const temp = newList[index]
  newList[index] = newList[index - 1]
  newList[index - 1] = temp

  // 重新指派 sortOrder
  const updatedItems = newList.map((item, idx) => ({
    id: item.id,
    sortOrder: idx + 1
  }))

  emit('reorder', updatedItems)
}

// 下移一格
const handleMoveDown = (index) => {
  if (index === props.slides.length - 1 || isViewer.value) return
  const newList = [...props.slides]
  const temp = newList[index]
  newList[index] = newList[index + 1]
  newList[index + 1] = temp

  const updatedItems = newList.map((item, idx) => ({
    id: item.id,
    sortOrder: idx + 1
  }))

  emit('reorder', updatedItems)
}
</script>

<template>
  <div class="admin-hero-media-tab">
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">首頁頂部 Hero 絕景輪播圖集 (全站焦點大圖)</h3>
        <p class="tab-subtitle">訪客進站第一眼所見之 16:9 高畫質大圖，支援上下微調播放順序、一鍵停用暫停或更換四季絕景。</p>
      </div>

      <button 
        type="button" 
        class="btn-add-primary" 
        @click="emit('upload', 'hero')" 
        :disabled="isViewer"
      >
        <UploadCloud :size="16" />
        <span>上傳 Hero 輪播大圖</span>
      </button>
    </div>

    <!-- 輪播圖清單 -->
    <div class="hero-slides-grid">
      <div 
        v-for="(slide, idx) in slides" 
        :key="slide.id" 
        class="slide-card"
        :class="{ inactive: !slide.isActive }"
      >
        <!-- 圖片縮圖區塊 -->
        <div class="slide-thumb-box">
          <img :src="slide.cdnUrl" :alt="slide.titleZh" class="thumb-img" loading="lazy" />
          <div class="order-badge">#{{ idx + 1 }}</div>
          <span v-if="!slide.isActive" class="draft-badge">草稿</span>
          <span v-if="slide.tagZh" class="tag-pill">{{ slide.tagZh }}</span>
        </div>

        <!-- 資訊與控制區塊 -->
        <div class="slide-content-box">
          <div class="content-top">
            <h4 class="slide-title">{{ slide.titleZh }}</h4>
            <p v-if="slide.titleEn" class="slide-title-en">{{ slide.titleEn }}</p>
            <span class="slide-url font-mono">{{ slide.cdnUrl }}</span>
          </div>

          <div class="content-bottom-actions">
            <!-- 順序調整按鈕 -->
            <div class="order-actions">
              <button 
                type="button" 
                class="btn-order" 
                :disabled="idx === 0 || isViewer" 
                @click="handleMoveUp(idx)"
                title="往前調升順序"
              >
                <ArrowUp :size="14" />
              </button>
              <button 
                type="button" 
                class="btn-order" 
                :disabled="idx === slides.length - 1 || isViewer" 
                @click="handleMoveDown(idx)"
                title="往後調降順序"
              >
                <ArrowDown :size="14" />
              </button>
            </div>

            <!-- 顯示狀態切換：上架中 / 草稿 -->
            <button 
              type="button" 
              class="status-pill-btn" 
              :class="{ active: slide.isActive, draft: !slide.isActive }"
              @click="emit('toggleActive', slide)"
              :disabled="isViewer"
              :title="slide.isActive ? '點擊轉為草稿' : '點擊上架輪播'"
            >
              <span class="indicator"></span>
              <span>{{ slide.isActive ? '上架中' : '草稿' }}</span>
            </button>

            <!-- 編輯與刪除 -->
            <div class="card-btn-group">
              <button 
                type="button" 
                class="btn-action edit" 
                @click="emit('edit', slide)" 
                title="編輯文案、更換圖片與調整狀態"
                :disabled="isViewer"
              >
                <Edit3 :size="14" />
                <span>編輯 / 換圖</span>
              </button>
              <button 
                type="button" 
                class="btn-action delete" 
                @click="emit('delete', slide)" 
                title="刪除大圖"
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
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-hero-media-tab {
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

.hero-slides-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slide-card {
  display: flex;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  &.inactive {
    opacity: 0.6;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .slide-thumb-box {
    position: relative;
    width: 260px;
    height: 150px;
    flex-shrink: 0;
    background: #000;

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .order-badge {
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;
      background: rgba(18, 20, 21, 0.85);
      border: 1px solid var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      backdrop-filter: blur(4px);
    }

    .draft-badge {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(100, 116, 139, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      backdrop-filter: blur(4px);
    }

    .tag-pill {
      position: absolute;
      bottom: 0.6rem;
      left: 0.6rem;
      font-size: 0.7rem;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
  }

  .slide-content-box {
    flex: 1;
    padding: 1.15rem 1.4rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .content-top {
      .slide-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--gold-primary, #d4af37);
        margin: 0 0 0.25rem 0;
      }

      .slide-title-en {
        font-size: 0.78rem;
        color: var(--admin-text-muted, #94a3b8);
        margin: 0 0 0.4rem 0;
        font-style: italic;
      }

      .slide-url {
        font-size: 0.75rem;
        color: var(--admin-text-sub, #94a3b8);
        word-break: break-all;
      }
    }

    .content-bottom-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.85rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.05));

      .order-actions {
        display: flex;
        gap: 0.3rem;

        .btn-order {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));
          border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.15));
          border-radius: 4px;
          color: var(--admin-text-sub, #cbd5e1);
          cursor: pointer;

          &:hover:not(:disabled) {
            border-color: var(--gold-primary, #d4af37);
            color: var(--gold-primary, #d4af37);
          }

          &:disabled { opacity: 0.35; cursor: not-allowed; }
        }
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

        &.draft, &.disabled {
          background: rgba(148, 163, 184, 0.15);
          border-color: rgba(148, 163, 184, 0.35);
          color: #94a3b8;
          .indicator { background: #94a3b8; }
        }
      }

      .card-btn-group {
        margin-left: auto;
        display: flex;
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
  }
}

@media (max-width: 640px) {
  .slide-card {
    flex-direction: column;
    .slide-thumb-box { width: 100%; height: 180px; }
  }
}
</style>
