<script setup>
import { 
  BedDouble, 
  Plus, 
  Settings, 
  Layers 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'
import AdminMediaPhotoGrid from './AdminMediaPhotoGrid.vue'

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  photos: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits([
  'upload', 
  'editPhoto', 
  'deletePhoto', 
  'togglePhotoActive',
  'addRoom',
  'editRoom'
])

const { isViewer } = useAdminAuth()

// 依房間歸納照片
const getPhotosForRoom = (roomId) => {
  if (!props.photos || !props.photos.length) return []
  const normId = (roomId || '').toLowerCase().replace(/^room-0?/, 'room-')
  return props.photos.filter(p => {
    const sub = (p.subCategory || '').toLowerCase().replace(/^room-0?/, 'room-')
    return sub === normId || p.subCategory === roomId || (normId === 'room-1' && p.subCategory === 'room-01-cover')
  })
}
</script>

<template>
  <div class="admin-room-media-tab">
    <!-- 頂部操作列 -->
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">特色獨立客房寫真與空間規格管理</h3>
        <p class="tab-subtitle">所有客房分類皆由資料庫真實驅動，可自由新增客房、編輯前台展示規格與維護實景相簿。</p>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn-add-primary" 
          @click="emit('addRoom')" 
          :disabled="isViewer"
        >
          <Plus :size="16" />
          <span>新增客房空間</span>
        </button>
      </div>
    </div>

    <!-- 空狀態提示 -->
    <div v-if="!isLoading && (!rooms || rooms.length === 0)" class="empty-rooms-box">
      <Layers :size="48" class="empty-icon" />
      <h4 class="empty-title">目前尚未建立任何客房空間</h4>
      <p class="empty-desc">請點擊上方「＋ 新增客房空間」按鈕，建立第一間特色客房並上傳實景照片。</p>
      <button type="button" class="btn-create-first" @click="emit('addRoom')" :disabled="isViewer">
        <Plus :size="16" />
        <span>立即建立客房空間</span>
      </button>
    </div>

    <!-- 客房卡片列表 (真實資料庫驅動，不預設假分類) -->
    <div v-else class="rooms-grid">
      <div 
        v-for="room in rooms" 
        :key="room.id" 
        class="room-card"
        :class="{ inactive: !room.isActive }"
      >
        <!-- 客房卡片頂部規格資訊列 -->
        <div class="room-card-header">
          <div class="room-meta-left">
            <span class="floor-badge">{{ room.floor || '1F' }}</span>
            <div class="title-group">
              <div class="name-status-row">
                <h4 class="room-name">{{ room.titleZh }}</h4>
                <span v-if="!room.isActive" class="status-chip draft">暫停開放</span>
              </div>
              <p v-if="room.subtitleZh" class="room-subtitle">{{ room.subtitleZh }}</p>
              
              <!-- 規格 Pills -->
              <div class="spec-pills">
                <span v-if="room.bedTypeZh" class="pill bed-pill" :title="room.bedTypeZh">
                  <BedDouble :size="13" />
                  <span>{{ room.bedTypeZh }}</span>
                </span>
                <span v-if="room.capacityZh" class="pill">👤 {{ room.capacityZh }}</span>
                <span v-if="room.size" class="pill">📐 {{ room.size }}</span>
                <span v-if="room.highlightsZh && room.highlightsZh.length" class="pill">
                  ✨ {{ room.highlightsZh.length }} 項特色
                </span>
              </div>
            </div>
          </div>

          <!-- 卡片頂部按鈕 -->
          <div class="room-actions-right">
            <button 
              type="button" 
              class="btn-action edit-spec" 
              @click="emit('editRoom', room)" 
              :disabled="isViewer"
              title="編輯此客房完整規格"
            >
              <Settings :size="14" />
              <span>空間規格</span>
            </button>

            <button 
              type="button" 
              class="btn-action add-photo" 
              @click="emit('upload', room.id)" 
              :disabled="isViewer"
              title="新增照片至此客房"
            >
              <Plus :size="14" />
              <span>新增此房相片</span>
            </button>
          </div>
        </div>

        <!-- 該房型相簿相片網格 (共用組件) -->
        <div class="room-photos-area">
          <AdminMediaPhotoGrid 
            :photos="getPhotosForRoom(room.id)"
            empty-text="此客房目前尚無相片"
            upload-btn-text="上傳第一張照片"
            @upload="emit('upload', room.id)"
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

.admin-room-media-tab {
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

.empty-rooms-box {
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

.rooms-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.room-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: $radius-md;
  overflow: hidden;

  &.inactive {
    opacity: 0.75;
    background: var(--bg-hover, #f8fafc);
  }
}

.room-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  background: var(--bg-hover, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  gap: 1rem;
  flex-wrap: wrap;

  .room-meta-left {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    flex: 1;
    min-width: 260px;

    .floor-badge {
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

        .room-name {
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

      .room-subtitle {
        font-size: 0.825rem;
        color: var(--text-secondary, #64748b);
      }

      .spec-pills {
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

          &.bed-pill {
            max-width: 320px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  .room-actions-right {
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

.room-photos-area {
  padding: 1.25rem;
}
</style>
