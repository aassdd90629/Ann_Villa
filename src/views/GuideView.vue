<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import guideData from '../data/guide.json'
import siteData from '../data/site.json'
import { 
  Car, 
  Train, 
  MapPin, 
  Clock, 
  Compass, 
  ExternalLink,
  UtensilsCrossed,
  Sparkles,
  Info,
  CircleParking
} from 'lucide-vue-next'

const { isEn } = useI18n()
const activeTab = ref('all') // 'all', 'attractions', 'dining'
</script>

<template>
  <div class="guide-page">
    <PageHeader 
      :tag="isEn ? 'LOCATION & GUIDE' : '交通與周邊'"
      :title="isEn ? 'Location & Regional Travel Guide' : '地理位置、交通指引與周邊推薦'"
      :desc="isEn
        ? 'Nestled in the tranquil mountains of Zhuolan, Miaoli. Discover curated local scenic spots, authentic Hakka cuisines, and peaceful nature.'
        : '坐落於苗栗卓蘭山林幽境，坐擁開闊山嵐景致。便利自駕路線，輕鬆探訪周邊私房景點、溫泉名勝與客家道地美食。'"
    />

    <section class="section-py guide-content-section">
      <div class="container">
        <!-- 1. 交通指引 (自駕 / 大眾運輸) -->
        <div class="transport-grid">
          <div class="trans-card card-luxury">
            <div class="trans-header">
              <Car :size="24" class="trans-icon" />
              <h2>{{ isEn ? 'By Car & GPS Navigation' : '自行開車與自駕路線' }}</h2>
            </div>
            <ul class="trans-list">
              <li v-for="(route, rIdx) in (isEn ? guideData.transportation.byCarEn : guideData.transportation.byCarZh)" :key="rIdx">
                <span>{{ route }}</span>
              </li>
            </ul>
            <div class="trans-action">
              <a :href="siteData.googleMapUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold">
                <MapPin :size="16" />
                <span>{{ isEn ? 'Open Google Maps' : '開啟 Google 地圖導航' }}</span>
                <ExternalLink :size="14" />
              </a>
            </div>
          </div>

          <div class="trans-card card-luxury">
            <div class="trans-header">
              <Train :size="24" class="trans-icon" />
              <h2>{{ isEn ? 'High Speed Rail & Transfers' : '高鐵抵達與專車接駁' }}</h2>
            </div>
            <p class="trans-desc">
              {{ isEn ? guideData.transportation.byPublicEn : guideData.transportation.byPublicZh }}
            </p>
            <div class="shuttle-note">
              <Compass :size="16" />
              <span>{{ isEn ? 'Shuttle arrangements can be requested via concierge' : '如需推薦車隊接駁，可提前向管家諮詢預約' }}</span>
            </div>
            <div class="address-box">
              <MapPin :size="16" class="addr-icon" />
              <div>
                <span class="addr-label">{{ isEn ? 'Shan Yu Villa Address' : '山莊導航地址' }}</span>
                <p class="addr-text">{{ isEn ? siteData.addressEn : siteData.addressZh }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 分類篩選列 -->
        <div class="guide-filter-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            <Sparkles :size="16" />
            <span>{{ isEn ? 'All Recommendations' : '全部精選推薦' }} ({{ guideData.attractions.length + guideData.dining.length }})</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'attractions' }"
            @click="activeTab = 'attractions'"
          >
            <Compass :size="16" />
            <span>{{ isEn ? 'Scenic Spots' : '私房私景點' }} ({{ guideData.attractions.length }})</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'dining' }"
            @click="activeTab = 'dining'"
          >
            <UtensilsCrossed :size="16" />
            <span>{{ isEn ? 'Local Dining' : '周邊在地美食' }} ({{ guideData.dining.length }})</span>
          </button>
        </div>

        <!-- 2. 周邊私房推薦景點 (Attractions) -->
        <div v-if="activeTab === 'all' || activeTab === 'attractions'" class="guide-block attractions-section">
          <div class="section-header text-left">
            <span class="section-tag">{{ isEn ? 'NEARBY ATTRACTIONS' : '苗栗周邊景點' }}</span>
            <h2 class="section-title">{{ isEn ? 'Curated Scenic Spots & Adventures' : '山林踏青・鐵道溫泉與私房美景' }}</h2>
          </div>

          <div class="guide-grid">
            <div 
              v-for="att in guideData.attractions" 
              :key="att.id"
              class="guide-card card-luxury"
            >
              <div class="guide-img-box img-zoom-container">
                <img :src="att.image" :alt="isEn ? att.nameEn : att.nameZh" loading="lazy" />
                <div class="drive-time-badge">
                  <Clock :size="13" />
                  <span>{{ isEn ? att.driveTimeEn : att.driveTimeZh }}</span>
                </div>
                <div v-if="att.locationZh" class="location-badge">
                  <MapPin :size="12" />
                  <span>{{ isEn ? att.locationEn : att.locationZh }}</span>
                </div>
              </div>
              <div class="guide-body">
                <div class="guide-tag">{{ isEn ? att.tagEn : att.tagZh }}</div>
                <h3 class="guide-name">{{ isEn ? att.nameEn : att.nameZh }}</h3>
                <p class="guide-desc">{{ isEn ? att.descEn : att.descZh }}</p>
                <div v-if="att.noticeZh" class="guide-notice">
                  <Info :size="14" class="notice-icon" />
                  <span>{{ isEn ? att.noticeEn : att.noticeZh }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 周邊在地美食 (Dining) -->
        <div v-if="activeTab === 'all' || activeTab === 'dining'" class="guide-block dining-section">
          <div class="section-header text-left">
            <span class="section-tag">{{ isEn ? 'LOCAL CUISINE' : '周邊在地美食' }}</span>
            <h2 class="section-title">{{ isEn ? 'Local Gourmet & Hakka Specialties' : '客家合菜・甕仔雞與在地人氣排隊名店' }}</h2>
          </div>

          <div class="guide-grid">
            <div 
              v-for="dish in guideData.dining" 
              :key="dish.id"
              class="guide-card card-luxury"
            >
              <div class="guide-img-box img-zoom-container">
                <img :src="dish.image" :alt="isEn ? dish.nameEn : dish.nameZh" loading="lazy" />
                <div v-if="dish.parking" class="parking-badge">
                  <CircleParking :size="13" />
                  <span>{{ isEn ? 'Parking Available' : '附停車場' }}</span>
                </div>
                <div v-if="dish.locationZh" class="location-badge">
                  <MapPin :size="12" />
                  <span>{{ isEn ? dish.locationEn : dish.locationZh }}</span>
                </div>
              </div>
              <div class="guide-body">
                <div class="guide-tag">{{ isEn ? dish.tagEn : dish.tagZh }}</div>
                <h3 class="guide-name">{{ isEn ? dish.nameEn : dish.nameZh }}</h3>
                <p class="guide-desc">{{ isEn ? dish.descEn : dish.descZh }}</p>
                <div v-if="dish.noticeZh" class="guide-notice">
                  <Info :size="14" class="notice-icon" />
                  <span>{{ isEn ? dish.noticeEn : dish.noticeZh }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.transport-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 4rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.trans-card {
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;

  .trans-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);

    .trans-icon {
      color: var(--gold-primary);
    }

    h2 {
      font-size: 1.25rem;
      margin: 0;
    }
  }

  .trans-list {
    list-style: disc;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 2rem;
    flex: 1;

    li {
      font-size: 0.93rem;
      color: var(--text-sub);
      line-height: 1.75;
    }
  }

  .trans-desc {
    font-size: 0.95rem;
    line-height: 1.85;
    color: var(--text-sub);
    margin-bottom: 1.25rem;
    flex: 1;
  }

  .shuttle-note {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--gold-primary);
    background: var(--badge-bg);
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    align-self: flex-start;
  }

  .address-box {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-hover);
    border-radius: 4px;
    border-left: 3px solid var(--gold-primary);
    margin-bottom: 1.5rem;

    .addr-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .addr-label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .addr-text {
      font-size: 0.88rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }
  }

  .trans-action {
    margin-top: auto;
  }
}

.guide-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 3rem;
  justify-content: center;

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.4rem;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-sub);
    cursor: pointer;
    transition: all 0.3s ease;

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

.guide-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .guide-img-box {
    position: relative;
    height: 220px;

    .drive-time-badge,
    .parking-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(18, 20, 21, 0.8);
      color: #FFFFFF;
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      backdrop-filter: blur(6px);
      z-index: 2;
    }

    .parking-badge {
      background: rgba(46, 125, 50, 0.85);
    }

    .location-badge {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(18, 20, 21, 0.75);
      color: #FFFFFF;
      font-size: 0.72rem;
      padding: 0.2rem 0.55rem;
      border-radius: 3px;
      backdrop-filter: blur(4px);
      z-index: 2;
    }
  }

  .guide-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .guide-tag {
      font-size: 0.75rem;
      color: var(--gold-primary);
      font-weight: 500;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }

    .guide-name {
      font-size: 1.2rem;
      margin-bottom: 0.75rem;
      line-height: 1.35;
    }

    .guide-desc {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.7;
      margin-bottom: 1rem;
      flex: 1;
    }

    .guide-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      padding: 0.65rem 0.85rem;
      background: var(--bg-hover);
      border-radius: 4px;
      border-left: 2px solid var(--gold-primary);
      font-size: 0.8rem;
      color: var(--text-sub);
      line-height: 1.45;

      .notice-icon {
        color: var(--gold-primary);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }
}
</style>
