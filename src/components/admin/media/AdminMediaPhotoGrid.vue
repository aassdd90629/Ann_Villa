<script setup>
import { 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Plus 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  photos: { type: Array, default: () => [] },
  emptyText: { type: String, default: '此空間目前尚無相片' },
  uploadBtnText: { type: String, default: '上傳第一張照片' }
})

const emit = defineEmits(['upload', 'edit', 'delete', 'toggleActive'])
const { isViewer } = useAdminAuth()

const handleImageError = (e) => {
  e.target.src = '/img/homebanner/homebanner-01.webp'
}
</script>

<template>
  <div class="media-photo-grid-wrapper">
    <div class="photos-count-row">
      <span class="count-text">實景相簿 (共 {{ photos.length }} 張)</span>
    </div>

    <!-- 無照片時的引導提示 -->
    <div v-if="photos.length === 0" class="no-photos-box">
      <p>{{ emptyText }}</p>
      <button 
        type="button" 
        class="btn-empty-upload" 
        @click="emit('upload')"
        :disabled="isViewer"
      >
        <Plus :size="13" />
        <span>{{ uploadBtnText }}</span>
      </button>
    </div>

    <!-- 照片網格 -->
    <div v-else class="photos-grid">
      <div 
        v-for="photo in photos" 
        :key="photo.id" 
        class="photo-card"
        :class="{ draft: !photo.isActive }"
      >
        <div class="photo-thumb-wrap">
          <img 
            :src="photo.cdnUrl" 
            :alt="photo.titleZh" 
            class="photo-thumb" 
            loading="lazy" 
            @error="handleImageError"
          />
          <span v-if="!photo.isActive" class="photo-badge-draft">草稿</span>
        </div>

        <div class="photo-info">
          <span class="photo-title" :title="photo.titleZh">{{ photo.titleZh }}</span>
          <span v-if="photo.tagZh" class="photo-tag">{{ photo.tagZh }}</span>
        </div>

        <div class="photo-card-actions">
          <button 
            type="button" 
            class="action-btn toggle" 
            @click="emit('toggleActive', photo)" 
            :disabled="isViewer"
            :title="photo.isActive ? '下架為草稿' : '上架公開展示'"
          >
            <Eye v-if="photo.isActive" :size="13" />
            <EyeOff v-else :size="13" />
          </button>
          <button 
            type="button" 
            class="action-btn edit" 
            @click="emit('edit', photo)" 
            :disabled="isViewer"
            title="編輯照片資訊"
          >
            <Edit3 :size="13" />
          </button>
          <button 
            type="button" 
            class="action-btn delete" 
            @click="emit('delete', photo)" 
            :disabled="isViewer"
            title="永久刪除"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.photos-count-row {
  margin-bottom: 0.85rem;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
}

.no-photos-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--bg-hover, #f8fafc);
  border: 1px dashed var(--border-color, #cbd5e1);
  border-radius: $radius-sm;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);

  .btn-empty-upload {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    background: var(--gold-primary, #b89047);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.photo-card {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: $radius-sm;
  overflow: hidden;
  background: var(--bg-card, #ffffff);
  display: flex;
  flex-direction: column;

  &.draft {
    opacity: 0.6;
    border-style: dashed;
  }

  .photo-thumb-wrap {
    position: relative;
    width: 100%;
    height: 120px;
    background: #0f172a;

    .photo-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-badge-draft {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.75);
      color: #fca5a5;
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
  }

  .photo-info {
    padding: 0.5rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;

    .photo-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .photo-tag {
      font-size: 0.7rem;
      color: var(--gold-primary, #b89047);
    }
  }

  .photo-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.25rem;
    padding: 0.35rem 0.5rem;
    border-top: 1px solid var(--border-color, #f1f5f9);
    background: var(--bg-hover, #f8fafc);

    .action-btn {
      padding: 0.3rem;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #64748b);
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #e2e8f0;
        color: var(--text-primary, #1e293b);

        &.delete {
          background: #fee2e2;
          color: #ef4444;
        }
      }
    }
  }
}
</style>
