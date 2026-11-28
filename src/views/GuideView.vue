<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useGuide } from '../composables/useGuide'
import { useSiteContent } from '../composables/useSiteContent'
import PageHeader from '../components/common/PageHeader.vue'
import GuideTransportSection from '../components/guide/GuideTransportSection.vue'
import GuideItemCard from '../components/guide/GuideItemCard.vue'
import { 
  Sparkles, 
  Compass, 
  UtensilsCrossed, 
  MapPin, 
  Coffee, 
  Camera, 
  Trees, 
  Store,
  HelpCircle
} from 'lucide-vue-next'

const { t, tField } = useI18n()
const { guide: guideData, isLoading } = useGuide()
const { basicInfo: siteData } = useSiteContent()

// 目前選取的膠囊分類，預設 'all'
const activeTab = ref('all')

// 動態分類清單
const categories = computed(() => guideData.value.categories || [])

// 所有景點/推薦項目清單
const allItems = computed(() => guideData.value.items || [])

// 總項目計數
const totalCount = computed(() => allItems.value.length)

// 動態圖示匹配字典
const iconMap = {
  Compass,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  Coffee,
  Camera,
  Trees,
  Store
}

const getCategoryIcon = (iconName) => {
  return iconMap[iconName] || Compass
}

// 根據當前膠囊分類過濾顯示項目
const displayedSections = computed(() => {
  if (categories.value.length === 0) {
    return []
  }

  if (activeTab.value === 'all') {
    // 顯示所有擁有項目的分類區塊
    return categories.value.map(cat => ({
      category: cat,
      items: allItems.value.filter(it => it.type === cat.id)
    }))
  }

  // 僅顯示當前選中的分類
  const targetCat = categories.value.find(c => c.id === activeTab.value)
  if (!targetCat) return []
  return [{
    category: targetCat,
    items: allItems.value.filter(it => it.type === targetCat.id)
  }]
})
</script>

<template>
  <div class="guide-page">
    <PageHeader 
      :tag="t('guide.tag')"
      :title="t('guide.title')"
      :desc="t('guide.desc')"
    />

    <section class="section-py guide-content-section">
      <div class="container">
        <!-- 1. 交通指引 (自駕 / 大眾運輸) -->
        <GuideTransportSection 
          :transportation="guideData.transportation" 
          :site-data="siteData" 
        />

        <!-- 2. 中間動態膠囊狀分類篩選列 (Pill Filter Tabs) -->
        <div class="guide-filter-tabs">
          <!-- 全部推薦膠囊 -->
          <button 
            type="button"
            class="tab-btn" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            <Sparkles :size="16" />
            <span>{{ t('guide.tabAll') }} ({{ totalCount }})</span>
          </button>

          <!-- 動態由資料庫新增與維護之各膠囊分類 -->
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            type="button"
            class="tab-btn" 
            :class="{ active: activeTab === cat.id }"
            @click="activeTab = cat.id"
          >
            <component :is="getCategoryIcon(cat.icon)" :size="16" />
            <span>{{ tField(cat, 'name') }} ({{ cat.count !== undefined ? cat.count : allItems.filter(i => i.type === cat.id).length }})</span>
          </button>
        </div>

        <!-- 載入中骨架屏 -->
        <div v-if="isLoading && totalCount === 0" class="guide-grid">
          <div v-for="n in 3" :key="'skeleton-' + n" class="card-luxury skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
              <div class="skeleton-line sm"></div>
              <div class="skeleton-line md"></div>
              <div class="skeleton-line lg"></div>
            </div>
          </div>
        </div>

        <!-- 全站尚無任何導覽推薦時的空狀態 -->
        <div v-else-if="totalCount === 0" class="empty-guide-box card-luxury">
          <Compass :size="44" class="empty-icon" />
          <h3 class="empty-title">{{ t('guide.emptyTitle') || '目前尚無周邊景點推薦' }}</h3>
          <p class="empty-desc">{{ t('guide.emptyDesc') || '山語 Villa 正在為您精選苗栗卓蘭私房步道、採果農場與在地老饕美食，敬請期待。' }}</p>
        </div>

        <!-- 3. 動態分類項目區塊 -->
        <div v-else>
          <div 
            v-for="section in displayedSections" 
            :key="section.category.id"
            class="guide-block"
          >
            <!-- 區塊標題列 -->
            <div class="section-header text-left">
              <span v-if="section.category.tagZh || section.category.tagEn" class="section-tag">
                {{ tField(section.category, 'tag') }}
              </span>
              <h2 class="section-title">{{ tField(section.category, 'name') }}</h2>
            </div>

            <!-- 分類下無項目的小空狀態 -->
            <div v-if="section.items.length === 0" class="empty-section-hint">
              <HelpCircle :size="20" />
              <span>該分類目前尚無發布中的推薦項目。</span>
            </div>

            <!-- 項目卡片網格 -->
            <div v-else class="guide-grid">
              <GuideItemCard 
                v-for="item in section.items" 
                :key="item.id" 
                :item="item" 
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.guide-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;

  @media (min-width: $bp-sm) {
    gap: 0.75rem;
    margin-bottom: 3rem;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    font-size: 0.82rem;
    font-weight: 500;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-sub);
    cursor: pointer;
    transition: all 0.3s ease;

    @media (min-width: $bp-sm) {
      gap: 0.5rem;
      padding: 0.65rem 1.4rem;
      font-size: 0.9rem;
    }

    &:hover {
      border-color: var(--gold-primary);
      color: var(--gold-primary);
    }

    &.active {
      background: var(--gold-primary);
      color: #FFFFFF;
      border-color: var(--gold-primary);
      box-shadow: 0 4px 14px rgba(197, 168, 128, 0.35);
    }
  }
}

.guide-block {
  margin-bottom: 4.5rem;

  .section-header.text-left {
    text-align: left;
    margin-bottom: 2rem;

    .section-title {
      font-size: 1.6rem;
      margin-top: 0.35rem;
    }
  }
}

.guide-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $bp-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.empty-guide-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  max-width: 600px;
  margin: 2rem auto;

  .empty-icon { color: var(--gold-primary); opacity: 0.7; margin-bottom: 1rem; }
  .empty-title { font-size: 1.25rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem; }
  .empty-desc { font-size: 0.9rem; color: var(--text-sub); line-height: 1.65; margin: 0; }
}

.empty-section-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1.5rem;
  background: var(--bg-hover);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.88rem;
  justify-content: center;
}

.skeleton-card {
  overflow: hidden;
  .skeleton-img {
    height: 220px;
    background: var(--bg-surface, rgba(255, 255, 255, 0.05));
    animation: pulse 1.8s infinite ease-in-out;
  }
  .skeleton-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    .skeleton-line {
      height: 14px;
      border-radius: 4px;
      background: var(--bg-surface, rgba(255, 255, 255, 0.05));
      animation: pulse 1.8s infinite ease-in-out;
      &.sm { width: 35%; height: 12px; }
      &.md { width: 80%; height: 18px; }
      &.lg { width: 95%; height: 14px; }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
</style>
