<script setup>
import { 
  BedDouble, 
  UploadCloud, 
  Edit3, 
  Trash2, 
  Image as ImageIcon 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['upload', 'edit', 'delete', 'toggleActive'])
const { isViewer } = useAdminAuth()

const roomPresets = [
  { id: 'room-1', nameZh: '1F 綠意四人套房', floor: '1F', beds: 'Queen x 1 + Double x 1' },
  { id: 'room-2', nameZh: '1F 山語隱逸雙人套房', floor: '1F', beds: 'Queen x 1' },
  { id: 'room-3', nameZh: '1F 風荷清幽四人套房', floor: '1F', beds: 'Double x 2' },
  { id: 'room-4', nameZh: '2F 星空露台四人套房', floor: '2F', beds: 'Double x 2' },
  { id: 'room-5', nameZh: '2F 晨曦觀景四人套房', floor: '2F', beds: 'Double x 2' }
]
</script>

<template>
  <div class="admin-room-media-tab">
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">五大特色獨立客房寫真管理</h3>
        <p class="tab-subtitle">維護各房型之封面主圖與寫真圖集，支援房型寫真上傳與即時更換展示。</p>
      </div>

      <button 
        type="button" 
        class="btn-add-primary" 
        @click="emit('upload', 'room')" 
        :disabled="isViewer"
      >
        <UploadCloud :size="16" />
        <span>上傳客房照片</span>
      </button>
    </div>

    <!-- 客房清單 -->
    <div class="rooms-grid">
      <div 
        v-for="preset in roomPresets" 
        :key="preset.id" 
        class="room-card"
      >
        <div class="room-card-header">
          <div class="room-title-col">
            <span class="floor-badge">{{ preset.floor }}</span>
            <h4>{{ preset.nameZh }}</h4>
          </div>
          <span class="beds-tag">{{ preset.beds }}</span>
        </div>

        <!-- 該房型圖片卡 -->
        <div class="room-assets-row">
          <div 
            v-for="asset in rooms.filter(r => r.subCategory === preset.id)" 
            :key="asset.id" 
            class="asset-thumb-card"
            :class="{ inactive: !asset.isActive }"
          >
            <div class="thumb-box">
              <img :src="asset.cdnUrl" :alt="asset.titleZh" />
              <button 
                type="button" 
                class="status-pill-btn" 
                :class="{ active: asset.isActive, draft: !asset.isActive }"
                @click="emit('toggleActive', asset)"
                :disabled="isViewer"
                :title="asset.isActive ? '點擊轉為草稿' : '點擊上架顯示'"
              >
                <span class="indicator"></span>
                <span>{{ asset.isActive ? '上架中' : '草稿' }}</span>
              </button>
            </div>

            <div class="thumb-desc">
              <span class="thumb-name" :title="asset.titleZh">{{ asset.titleZh }}</span>
              <div class="thumb-actions">
                <button 
                  type="button" 
                  class="btn-action edit" 
                  @click="emit('edit', asset)" 
                  title="編輯資訊與更換圖片"
                  :disabled="isViewer"
                >
                  <Edit3 :size="13" />
                </button>
                <button 
                  type="button" 
                  class="btn-action delete" 
                  @click="emit('delete', asset)" 
                  title="刪除"
                  :disabled="isViewer"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
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

.rooms-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.room-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  .room-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

    .room-title-col {
      display: flex;
      align-items: center;
      gap: 0.6rem;

      .floor-badge {
        font-size: 0.72rem;
        font-weight: 600;
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold-primary, #d4af37);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 4px;
        padding: 0.15rem 0.45rem;
      }

      h4 {
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--admin-text-main, #f8fafc);
        margin: 0;
      }
    }

    .beds-tag {
      font-size: 0.78rem;
      color: var(--admin-text-muted, #94a3b8);
    }
  }

  .room-assets-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}

.asset-thumb-card {
  background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));
  border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 6px;
  overflow: hidden;

  &.inactive { opacity: 0.55; }

  .thumb-box {
    position: relative;
    width: 100%;
    height: 120px;

    img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .status-pill-btn {
      position: absolute;
      top: 0.4rem;
      right: 0.4rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.15rem 0.45rem;
      border-radius: 10px;
      font-size: 0.68rem;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      backdrop-filter: blur(4px);

      .indicator { width: 5px; height: 5px; border-radius: 50%; }

      &.active {
        background: rgba(18, 20, 21, 0.85);
        border-color: rgba(34, 197, 94, 0.5);
        color: #22c55e;
        .indicator { background: #22c55e; }
      }

      &.draft, &.disabled {
        background: rgba(18, 20, 21, 0.85);
        border-color: rgba(148, 163, 184, 0.5);
        color: #94a3b8;
        .indicator { background: #94a3b8; }
      }
    }
  }

  .thumb-desc {
    padding: 0.5rem 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;

    .thumb-name {
      font-size: 0.75rem;
      color: var(--admin-text-sub, #cbd5e1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thumb-actions {
      display: flex;
      gap: 0.25rem;

      .btn-action {
        background: transparent;
        border: none;
        padding: 0.2rem;
        border-radius: 3px;
        cursor: pointer;

        &.edit { color: #38bdf8; &:hover:not(:disabled) { background: rgba(56, 189, 248, 0.15); } }
        &.delete { color: #ef4444; &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); } }
        &:disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }
  }
}
</style>
