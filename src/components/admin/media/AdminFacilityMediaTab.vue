<script setup>
import { 
  Coffee, 
  Plus, 
  Settings, 
  Layers 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'
import AdminMediaPhotoGrid from './AdminMediaPhotoGrid.vue'

const props = defineProps({
  facilities: { type: Array, default: () => [] },
  photos: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits([
  'upload', 
  'editPhoto', 
  'deletePhoto', 
  'togglePhotoActive',
  'addFacility',
  'editFacility'
])

const { isViewer } = useAdminAuth()

// 設施別名映射表 (相容既有圖集命名)
const facilityAliasMap = {
  'ktv-theater': ['living-ktv', 'ktv-theater', 'ktv'],
  'smart-kitchen': ['kitchen', 'smart-kitchen', 'kitchen-bar'],
  'mahjong-room': ['mahjong', 'mahjong-room', 'fac-mahjong-01', 'fac-mahjong-02'],
  'outdoor-bbq': ['bbq', 'outdoor-bbq'],
  'tea-ceremony': ['tea', 'tea-ceremony'],
  'viewing-deck': ['viewing-deck', 'terrace']
}

// 依公設歸納照片
const getPhotosForFacility = (facId) => {
  if (!props.photos || !props.photos.length) return []
  const aliases = facilityAliasMap[facId] || [facId]
  return props.photos.filter(p => aliases.includes(p.subCategory))
}
</script>

<template>
  <div class="admin-facility-media-tab">
    <!-- 頂部操作列 -->
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">園區公共設施寫真與空間規格管理</h3>
        <p class="tab-subtitle">所有公共設施皆由資料庫真實驅動，可自由新增公設、編輯前台展示設備與維護實景相簿。</p>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn-add-primary" 
          @click="emit('addFacility')" 
          :disabled="isViewer"
        >
          <Plus :size="16" />
          <span>新增公設空間</span>
        </button>
      </div>
    </div>

    <!-- 空狀態提示 -->
    <div v-if="!isLoading && (!facilities || facilities.length === 0)" class="empty-facs-box">
      <Layers :size="48" class="empty-icon" />
      <h4 class="empty-title">目前尚未建立任何公共設施空間</h4>
      <p class="empty-desc">請點擊上方「＋ 新增公設空間」按鈕，建立第一座休閒設施並上傳實景照片。</p>
      <button type="button" class="btn-create-first" @click="emit('addFacility')" :disabled="isViewer">
        <Plus :size="16" />
        <span>立即建立公設空間</span>
      </button>
    </div>

    <!-- 公設卡片列表 (真實資料庫驅動，不預設假分類) -->
    <div v-else class="facilities-grid">
      <div 
        v-for="fac in facilities" 
        :key="fac.id" 
        class="facility-card"
        :class="{ inactive: !fac.isActive }"
      >
        <!-- 公設卡片頂部規格資訊列 -->
        <div class="facility-card-header">
          <div class="facility-meta-left">
            <span class="sort-badge">#{{ fac.sortOrder || 1 }}</span>
            <div class="title-group">
              <div class="name-status-row">
                <h4 class="facility-name">{{ fac.titleZh }}</h4>
                <span v-if="!fac.isActive" class="status-chip draft">暫停開放</span>
              </div>
              <p v-if="fac.titleEn" class="facility-subtitle">{{ fac.titleEn }}</p>
              
              <!-- 規格 Features Pills -->
              <div v-if="fac.featuresZh && fac.featuresZh.length" class="feature-pills">
                <span 
                  v-for="(feat, fIdx) in fac.featuresZh.slice(0, 4)" 
                  :key="fIdx" 
                  class="pill"
                >
                  ✓ {{ feat }}
                </span>
                <span v-if="fac.featuresZh.length > 4" class="pill more-pill">
                  +{{ fac.featuresZh.length - 4 }} 更多
                </span>
              </div>
            </div>
          </div>

          <!-- 卡片頂部按鈕 -->
          <div class="facility-actions-right">
            <button 
              type="button" 
              class="btn-action edit-spec" 
              @click="emit('editFacility', fac)" 
              :disabled="isViewer"
              title="編輯此公設完整規格"
            >
              <Settings :size="14" />
              <span>空間規格</span>
            </button>

            <button 
              type="button" 
              class="btn-action add-photo" 
              @click="emit('upload', fac.id)" 
              :disabled="isViewer"
              title="新增照片至此公設"
            >
              <Plus :size="14" />
              <span>新增此公設相片</span>
            </button>
          </div>
        </div>

        <!-- 該公設相簿相片網格 (共用組件) -->
        <div class="facility-photos-area">
          <AdminMediaPhotoGrid 
            :photos="getPhotosForFacility(fac.id)"
            empty-text="此公設空間目前尚無相片"
            upload-btn-text="上傳第一張照片"
            @upload="emit('upload', fac.id)"
            @edit="p => emit('editPhoto', p)"
            @delete="p => emit('deletePhoto', p)"
            @toggle-active="p => emit('togglePhotoActive', p)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-facility-media-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tab-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);

  .tab-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary, #1e293b);
  }

  .tab-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary, #64748b);
    margin-top: 0.25rem;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.btn-add-primary, .btn-add-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color $transition-fast, border-color $transition-fast;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-add-primary {
  background: var(--gold-primary, #b89047);
  color: #ffffff;
  border: 1px solid var(--gold-primary, #b89047);

  &:hover:not(:disabled) {
    background: #a37c35;
  }
}

.btn-add-secondary {
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #1e293b);
  border: 1px solid var(--border-color, #cbd5e1);

  &:hover:not(:disabled) {
    background: var(--bg-hover, #f8fafc);
    border-color: var(--gold-primary, #b89047);
  }
}

.empty-facs-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: var(--bg-card, #ffffff);
  border: 2px dashed var(--border-color, #e2e8f0);
  border-radius: $radius-md;
  text-align: center;

  .empty-icon {
    color: var(--text-secondary, #94a3b8);
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
  }

  .empty-desc {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    margin: 0.5rem 0 1.5rem;
  }

  .btn-create-first {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    background: var(--gold-primary, #b89047);
    color: #ffffff;
    font-weight: 600;
    border-radius: $radius-sm;
    border: none;
    cursor: pointer;
  }
}

.facilities-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.facility-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: $radius-md;
  overflow: hidden;

  &.inactive {
    opacity: 0.75;
    background: var(--bg-hover, #f8fafc);
  }
}

.facility-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  background: var(--bg-hover, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  gap: 1rem;
  flex-wrap: wrap;

  .facility-meta-left {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    flex: 1;
    min-width: 260px;

    .sort-badge {
      background: var(--gold-primary, #b89047);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      margin-top: 0.15rem;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .name-status-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .facility-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .status-chip {
          font-size: 0.7rem;
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 600;
        }
      }

      .facility-subtitle {
        font-size: 0.825rem;
        color: var(--text-secondary, #64748b);
      }

      .feature-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.25rem;

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.15rem 0.5rem;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 4px;
          color: var(--text-secondary, #475569);

          &.more-pill {
            color: var(--gold-primary, #b89047);
            border-color: var(--gold-primary, #b89047);
          }
        }
      }
    }
  }

  .facility-actions-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: $radius-sm;
      cursor: pointer;
      border: 1px solid var(--border-color, #cbd5e1);
      background: var(--bg-card, #ffffff);
      color: var(--text-primary, #1e293b);
      transition: background-color $transition-fast, border-color $transition-fast;

      &:hover:not(:disabled) {
        border-color: var(--gold-primary, #b89047);
        color: var(--gold-primary, #b89047);
      }

      &.add-photo {
        background: var(--gold-primary, #b89047);
        border: 1px solid var(--gold-primary, #b89047);
        color: #ffffff;
        font-weight: 600;

        &:hover:not(:disabled) {
          background: #9e7529;
          border-color: #9e7529;
          color: #ffffff;
        }
      }
    }

    .btn-icon {
      padding: 0.45rem;
      border-radius: $radius-sm;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary, #94a3b8);
      cursor: pointer;

      &:hover:not(:disabled) {
        color: #ef4444;
        background: #fee2e2;
      }
    }
  }
}

.facility-photos-area {
  padding: 1.25rem;
}
</style>
