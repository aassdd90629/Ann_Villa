<script setup>
import { ref, computed } from 'vue'
import { 
  Compass, Plus, Edit3, Trash2, Layers, MapPin, 
  CircleParking, UtensilsCrossed, Sparkles, Coffee, Camera, Trees, Store
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits([
  'addCategory', 'editCategory', 'deleteCategory', 'toggleCategoryActive',
  'addItem', 'editItem', 'deleteItem', 'toggleItemActive'
])

const { isViewer } = useAdminAuth()

// 當前選中的過濾分類
const selectedCatFilter = ref('all')

const iconMap = {
  Compass, UtensilsCrossed, Sparkles, MapPin, Coffee, Camera, Trees, Store
}
const getIcon = (name) => iconMap[name] || Compass

const filteredItems = computed(() => {
  if (selectedCatFilter.value === 'all') {
    return props.items
  }
  return props.items.filter(it => it.type === selectedCatFilter.value)
})

const getCategoryName = (typeId) => {
  const cat = props.categories.find(c => c.id === typeId)
  return cat ? cat.nameZh : typeId
}
</script>

<template>
  <div class="admin-guide-tab">
    <!-- ================= 區塊 1：膠囊分類管理 ================= -->
    <div class="section-card">
      <div class="section-header-row">
        <div class="header-info">
          <div class="title-with-icon">
            <Layers :size="18" class="gold-icon" />
            <h3 class="tab-title">前台膠囊分類標籤管理</h3>
          </div>
          <p class="tab-subtitle">自訂官網周邊景點頁面中間的膠囊形分類按鈕，支援自訂圖示、中英文名稱與排序。</p>
        </div>
        <button 
          type="button" 
          class="btn-add-primary" 
          @click="emit('addCategory')" 
          :disabled="isViewer"
        >
          <Plus :size="15" />
          <span>新增膠囊分類</span>
        </button>
      </div>

      <!-- 分類列表 -->
      <div v-if="categories.length === 0" class="empty-sub-box">
        <Layers :size="28" class="empty-icon" />
        <p>尚未建立任何膠囊分類，點擊上方按鈕立即建立</p>
      </div>

      <div v-else class="categories-pill-grid">
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          class="cat-pill-card"
          :class="{ inactive: !cat.isActive }"
        >
          <div class="cat-pill-left">
            <div class="cat-icon-box">
              <component :is="getIcon(cat.icon)" :size="18" class="cat-icon" />
            </div>
            <div class="cat-names">
              <span class="cat-title">{{ cat.nameZh }}</span>
              <span class="cat-slug">ID: {{ cat.id }} · {{ cat.count || 0 }} 筆項目</span>
            </div>
          </div>

          <div class="cat-pill-actions">
            <button 
              type="button" 
              class="status-pill-btn" 
              :class="{ active: cat.isActive, disabled: !cat.isActive }"
              @click="emit('toggleCategoryActive', cat)"
              :disabled="isViewer"
              title="切換啟用狀態"
            >
              <span class="indicator"></span>
              <span>{{ cat.isActive ? '啟用中' : '已停用' }}</span>
            </button>
            <button 
              type="button" 
              class="btn-icon-action" 
              @click="emit('editCategory', cat)"
              :disabled="isViewer"
              title="編輯分類"
            >
              <Edit3 :size="13" />
            </button>
            <button 
              type="button" 
              class="btn-icon-action delete" 
              @click="emit('deleteCategory', cat)"
              :disabled="isViewer"
              title="刪除分類"
            >
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 區塊 2：景點與在地推薦項目管理 ================= -->
    <div class="section-card">
      <div class="section-header-row">
        <div class="header-info">
          <div class="title-with-icon">
            <Compass :size="18" class="gold-icon" />
            <h3 class="tab-title">景點與美食推薦項目管理</h3>
          </div>
          <p class="tab-subtitle">自主發布卓蘭周邊秘境步道、觀光果園、水庫景致與客家排隊在地特色名店。</p>
        </div>
        <button 
          type="button" 
          class="btn-add-primary" 
          @click="emit('addItem')" 
          :disabled="isViewer"
        >
          <Plus :size="15" />
          <span>新增推薦項目</span>
        </button>
      </div>

      <!-- 分類篩選列 -->
      <div class="filter-bar">
        <span class="filter-label">依膠囊分類篩選：</span>
        <button 
          type="button" 
          class="filter-chip" 
          :class="{ active: selectedCatFilter === 'all' }"
          @click="selectedCatFilter = 'all'"
        >
          全部 ({{ items.length }})
        </button>
        <button 
          v-for="cat in categories" 
          :key="cat.id" 
          type="button" 
          class="filter-chip"
          :class="{ active: selectedCatFilter === cat.id }"
          @click="selectedCatFilter = cat.id"
        >
          {{ cat.nameZh }} ({{ items.filter(i => i.type === cat.id).length }})
        </button>
      </div>

      <!-- 項目清單 -->
      <div v-if="filteredItems.length === 0" class="empty-sub-box">
        <Compass :size="32" class="empty-icon" />
        <p>目前此分類尚無推薦項目，點擊上方按鈕新增景點或美食</p>
      </div>

      <div v-else class="items-list-grid">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="guide-admin-card"
          :class="{ inactive: !item.isActive }"
        >
          <div class="item-img-col">
            <img :src="item.image || '/img/scenery-night/scenery-night-02.webp'" :alt="item.nameZh" />
            <span class="type-badge">{{ getCategoryName(item.type) }}</span>
          </div>

          <div class="item-info-col">
            <div class="item-meta-row">
              <span v-if="item.tagZh" class="tag-chip">{{ item.tagZh }}</span>
              <span v-if="item.parking" class="parking-tag">
                <CircleParking :size="12" />
                <span>附停車位</span>
              </span>
              <div v-if="item.locationZh" class="location-tag">
                <MapPin :size="12" />
                <span>{{ item.locationZh }}</span>
              </div>
              <button 
                type="button" 
                class="status-pill-btn" 
                :class="{ active: item.isActive, disabled: !item.isActive }"
                @click="emit('toggleItemActive', item)"
                :disabled="isViewer"
              >
                <span class="indicator"></span>
                <span>{{ item.isActive ? '上架中' : '已下架' }}</span>
              </button>
            </div>

            <h4 class="item-title">{{ item.nameZh }}</h4>
            <p class="item-desc">{{ item.descZh }}</p>

            <div class="item-footer-row">
              <span v-if="item.noticeZh" class="notice-snippet">💡 {{ item.noticeZh }}</span>
              <div class="actions-group">
                <button 
                  type="button" 
                  class="btn-action edit" 
                  @click="emit('editItem', item)"
                  :disabled="isViewer"
                >
                  <Edit3 :size="13" />
                  <span>編輯</span>
                </button>
                <button 
                  type="button" 
                  class="btn-action delete" 
                  @click="emit('deleteItem', item)"
                  :disabled="isViewer"
                >
                  <Trash2 :size="13" />
                  <span>刪除</span>
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

.admin-guide-tab {
  display: flex; flex-direction: column; gap: 1.75rem;
}

.section-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px; padding: 1.35rem 1.5rem;
}

.section-header-row {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;

  .title-with-icon {
    display: flex; align-items: center; gap: 0.5rem;
    .gold-icon { color: var(--gold-primary, #d4af37); }
    .tab-title { font-size: 1.15rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); margin: 0; }
  }
  .tab-subtitle { font-size: 0.8rem; color: var(--admin-text-muted, #94a3b8); margin: 0.25rem 0 0 0; }
}

.btn-add-primary {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 1rem;
  background: var(--gold-primary, #d4af37); border: 1px solid var(--gold-primary, #d4af37);
  border-radius: 6px; color: #121415; font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover:not(:disabled) { background: #dfbc46; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.categories-pill-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1rem;
}

.cat-pill-card {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.85rem 1.15rem; background: var(--admin-bg-base, #0d131f);
  border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 8px; transition: border-color 0.2s ease;
  &:hover { border-color: rgba(212, 175, 55, 0.4); }
  &.inactive { opacity: 0.6; }

  .cat-pill-left {
    display: flex; align-items: center; gap: 0.85rem; min-width: 0; flex: 1;
    .cat-icon-box {
      width: 38px; height: 38px; border-radius: 8px;
      background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.22);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      .cat-icon { color: var(--gold-primary, #d4af37); }
    }
    .cat-names {
      display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;
      .cat-title { font-size: 0.95rem; font-weight: 600; color: var(--admin-text-main, #fff); line-height: 1.25; white-space: nowrap; }
      .cat-slug { font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    }
  }
  .cat-pill-actions { display: flex; align-items: center; gap: 0.45rem; flex-shrink: 0; }
}

.status-pill-btn {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem;
  border-radius: 9999px; font-size: 0.75rem; font-weight: 500; border: 1px solid transparent;
  cursor: pointer; white-space: nowrap; flex-shrink: 0; line-height: 1.2;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  .indicator { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  &.active { background: rgba(34, 197, 94, 0.15); border-color: rgba(34, 197, 94, 0.35); color: #16a34a; .indicator { background: #22c55e; } }
  &.disabled { background: rgba(148, 163, 184, 0.15); border-color: rgba(148, 163, 184, 0.35); color: #64748b; .indicator { background: #94a3b8; } }
}

.btn-icon-action {
  width: 28px; height: 28px; background: transparent; border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--admin-text-sub, #cbd5e1); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  &:hover:not(:disabled) { background: rgba(212, 175, 55, 0.1); color: var(--gold-primary, #d4af37); border-color: rgba(212, 175, 55, 0.3); }
  &.delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.12); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.filter-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
  margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
  .filter-label { font-size: 0.78rem; color: var(--admin-text-muted, #94a3b8); }
  .filter-chip {
    padding: 0.3rem 0.7rem; border-radius: 14px; font-size: 0.75rem;
    background: var(--admin-bg-base, #0d131f); border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
    color: var(--admin-text-sub, #cbd5e1); cursor: pointer;
    &:hover { border-color: var(--gold-primary, #d4af37); color: var(--gold-primary, #d4af37); }
    &.active { background: rgba(212, 175, 55, 0.2); border-color: var(--gold-primary, #d4af37); color: var(--gold-primary, #d4af37); font-weight: 600; }
  }
}

.items-list-grid {
  display: flex; flex-direction: column; gap: 0.85rem;
}

.guide-admin-card {
  display: flex; background: var(--admin-bg-base, #0d131f);
  border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 8px; overflow: hidden;
  &.inactive { opacity: 0.6; }

  .item-img-col {
    position: relative; width: 180px; flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .type-badge {
      position: absolute; top: 0.5rem; left: 0.5rem;
      background: rgba(18, 20, 21, 0.85); border: 1px solid var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37); font-size: 0.68rem; font-weight: 600;
      padding: 0.15rem 0.45rem; border-radius: 3px; backdrop-filter: blur(4px);
    }
  }

  .item-info-col {
    flex: 1; padding: 1rem 1.25rem; display: flex; flex-direction: column; justify-content: space-between;

    .item-meta-row {
      display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;
      .tag-chip { font-size: 0.72rem; padding: 0.1rem 0.45rem; background: rgba(212, 175, 55, 0.15); color: var(--gold-primary, #d4af37); border-radius: 4px; }
      .parking-tag, .location-tag { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); }
      .status-pill-btn { margin-left: auto; }
    }

    .item-title { font-size: 1rem; font-weight: 600; color: var(--admin-text-main, #fff); margin: 0 0 0.35rem 0; }
    .item-desc { font-size: 0.82rem; color: var(--admin-text-sub, #cbd5e1); margin: 0 0 0.75rem 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .item-footer-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      .notice-snippet { font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
      .actions-group {
        display: flex; align-items: center; gap: 0.4rem; margin-left: auto;
        .btn-action {
          display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.55rem;
          border-radius: 4px; font-size: 0.72rem; cursor: pointer; background: transparent; border: 1px solid transparent;
          &.edit { border-color: rgba(56, 189, 248, 0.3); color: #38bdf8; &:hover:not(:disabled) { background: rgba(56, 189, 248, 0.15); } }
          &.delete { border-color: rgba(239, 68, 68, 0.3); color: #ef4444; &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); } }
          &:disabled { opacity: 0.4; cursor: not-allowed; }
        }
      }
    }
  }
}

.empty-sub-box {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2.5rem 1rem; border: 1px dashed var(--admin-border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 6px; color: var(--admin-text-muted, #94a3b8); font-size: 0.85rem;
  .empty-icon { opacity: 0.4; margin-bottom: 0.5rem; }
}

@media (max-width: 640px) {
  .guide-admin-card { flex-direction: column; .item-img-col { width: 100%; height: 140px; } }
}
</style>
