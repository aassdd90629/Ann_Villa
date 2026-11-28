<script setup>
import { 
  Sparkles, 
  UploadCloud, 
  Edit3, 
  Trash2, 
  Image as ImageIcon 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  facilities: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['upload', 'edit', 'delete', 'toggleActive'])
const { isViewer } = useAdminAuth()

const facilityPresets = [
  { id: 'living-ktv', nameZh: 'Grand Lounge 奢華客廳與 KTV 視聽劇院' },
  { id: 'mahjong', nameZh: '頂級電動過山車麻將娛樂室' },
  { id: 'kitchen', nameZh: '中島開放式智能廚房與吧檯' },
  { id: 'bbq', nameZh: '戶外庭院專業美式 BBQ 烤肉區' },
  { id: 'tea', nameZh: '高山山景品茗賞景茶席' }
]

const handleImageError = (e, asset) => {
  const fallbacks = {
    'living-ktv': '/img/living-ktv/living-ktv-01.webp',
    'mahjong': '/img/living-ktv/living-ktv-04.webp',
    'kitchen': '/img/kitchen-bar/kitchen-bar-06.webp',
    'bbq': '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
    'tea': '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp'
  }
  const fallbackSrc = asset?.subCategory ? fallbacks[asset.subCategory] : null
  if (fallbackSrc && !e.target.src.endsWith(fallbackSrc)) {
    e.target.src = fallbackSrc
  }
}
</script>

<template>
  <div class="admin-facility-media-tab">
    <div class="tab-header-row">
      <div class="header-info">
        <h3 class="tab-title">園區公共設施與休閒體驗照片管理</h3>
        <p class="tab-subtitle">維護 KTV 視聽室、電動麻將室、智能廚房、BBQ 烤肉區與品茗茶席等公設寫真照片。</p>
      </div>

      <button 
        type="button" 
        class="btn-add-primary" 
        @click="emit('upload', 'facility')" 
        :disabled="isViewer"
      >
        <UploadCloud :size="16" />
        <span>上傳公設照片</span>
      </button>
    </div>

    <div class="facilities-grid">
      <div 
        v-for="preset in facilityPresets" 
        :key="preset.id" 
        class="facility-card"
      >
        <div class="facility-card-header">
          <h4>{{ preset.nameZh }}</h4>
        </div>

        <div class="assets-row">
          <div 
            v-for="asset in facilities.filter(f => f.subCategory === preset.id)" 
            :key="asset.id" 
            class="asset-thumb-card"
            :class="{ inactive: !asset.isActive }"
          >
            <div class="thumb-box">
              <img 
                :src="asset.cdnUrl" 
                :alt="asset.titleZh" 
                @error="(e) => handleImageError(e, asset)"
                loading="lazy"
              />
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

.admin-facility-media-tab {
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

.facilities-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.facility-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  .facility-card-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

    h4 {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--gold-primary, #d4af37);
      margin: 0;
    }
  }

  .assets-row {
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
