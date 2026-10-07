<script setup>
import { useI18n } from '../composables/useI18n'
import guideData from '../data/guide.json'
import siteData from '../data/site.json'
import { 
  Car, 
  Train, 
  MapPin, 
  Clock, 
  Compass, 
  ExternalLink 
} from 'lucide-vue-next'

const { isEn } = useI18n()
</script>

<template>
  <div class="guide-page">
    <section class="page-header">
      <div class="container header-container">
        <span class="section-tag">{{ isEn ? 'LOCATION & GUIDE' : '交通與景點' }}</span>
        <h1 class="page-title">{{ isEn ? 'Location & Regional Travel Guide' : '地理位置、交通與周邊景點' }}</h1>
        <p class="page-desc">
          {{ isEn
            ? 'Conveniently located near Sun Moon Lake and Taomi Eco Village. Discover surrounding mountain wonders.'
            : '隱身於埔里與日月潭交界之桃米幽境，便捷自駕與高鐵接駁，輕鬆探訪周邊自然與人文勝景。'
          }}
        </p>
      </div>
    </section>

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
              <h2>{{ isEn ? 'High Speed Rail & VIP Shuttle' : '高鐵與專屬貴賓接駁' }}</h2>
            </div>
            <p class="trans-desc">
              {{ isEn ? guideData.transportation.byPublicEn : guideData.transportation.byPublicZh }}
            </p>
            <div class="shuttle-note">
              <Compass :size="16" />
              <span>{{ isEn ? 'VIP Shuttle requires reservation 3 days prior' : '專車接駁需於入住前 3 天向管家預訂' }}</span>
            </div>
          </div>
        </div>

        <!-- 2. 周邊私房推薦景點 -->
        <div class="attractions-section">
          <div class="section-header">
            <span class="section-tag">{{ isEn ? 'NEARBY ATTRACTIONS' : '周邊景點' }}</span>
            <h2 class="section-title">{{ isEn ? 'Curated Regional Highlights' : '推薦精選順遊景點' }}</h2>
          </div>

          <div class="attractions-grid">
            <div 
              v-for="att in guideData.attractions" 
              :key="att.id"
              class="att-card card-luxury"
            >
              <div class="att-img-box img-zoom-container">
                <img :src="att.image" :alt="isEn ? att.nameEn : att.nameZh" loading="lazy" />
                <div class="drive-time-badge">
                  <Clock :size="13" />
                  <span>{{ isEn ? att.driveTimeEn : att.driveTimeZh }}</span>
                </div>
              </div>
              <div class="att-body">
                <h3 class="att-name">{{ isEn ? att.nameEn : att.nameZh }}</h3>
                <p class="att-desc">{{ isEn ? att.descEn : att.descZh }}</p>
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

.page-header {
  padding-top: 8.5rem;
  padding-bottom: 3.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  text-align: center;

  .page-title {
    font-size: clamp(2rem, 4vw, 3rem);
    margin: 0.8rem 0;
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-sub);
  }
}

.transport-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 5rem;

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
    margin-bottom: 1.5rem;
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
  }

  .trans-action {
    margin-top: auto;
  }
}

.attractions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.att-card {
  display: flex;
  flex-direction: column;

  .att-img-box {
    position: relative;
    height: 220px;

    .drive-time-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(18, 20, 21, 0.75);
      color: #FFFFFF;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 2px;
      backdrop-filter: blur(6px);
    }
  }

  .att-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .att-name {
      font-size: 1.15rem;
      margin-bottom: 0.5rem;
    }

    .att-desc {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.7;
    }
  }
}
</style>
