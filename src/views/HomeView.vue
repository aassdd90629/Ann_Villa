<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import siteData from '../data/site.json'
import roomsData from '../data/rooms.json'
import facilitiesData from '../data/facilities.json'
import pricingData from '../data/pricing.json'
import { 
  Users, 
  Sparkles, 
  Waves, 
  Maximize2, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Calendar,
  Compass
} from 'lucide-vue-next'

const { isEn, t, tField } = useI18n()
</script>

<template>
  <div class="home-page">
    <!-- 1. Hero 首屏沉浸橫幅 -->
    <section class="hero-section">
      <div class="hero-bg-overlay"></div>
      <img 
        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85" 
        alt="山語 Villa 景觀" 
        class="hero-img"
        fetchpriority="high"
      />
      
      <div class="container hero-content">
        <span class="hero-badge">
          <Sparkles :size="14" />
          <span>{{ isEn ? 'EXCLUSIVE MOUNTAIN RETREAT' : '南投・極致東方包棟私邸' }}</span>
        </span>
        <h1 class="hero-title">
          {{ isEn ? siteData.brandNameEn : siteData.brandNameZh }}
        </h1>
        <p class="hero-subtitle">
          {{ isEn ? siteData.sloganEn : siteData.sloganZh }}
        </p>
        <p class="hero-desc">
          {{ isEn 
            ? 'Nestled amid rolling clouds and emerald ridgelines, offering 4 private scenic suites, hot onsen stone baths, and an infinity pool for up to 18 guests.' 
            : '隱匿於雲海山嵐之間，獨享 4 間獨立景觀套房、私人石造溫泉湯屋與山景無邊際泳池，為您開啟一場洗滌心靈的奢華隱逸假期。' 
          }}
        </p>

        <div class="hero-actions">
          <a :href="siteData.lineUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold">
            <Sparkles :size="16" />
            <span>{{ t('nav.reserve') }}</span>
          </a>
          <RouterLink to="/rooms" class="btn btn-white">
            <span>{{ t('action.explore') }}</span>
            <ArrowRight :size="16" />
          </RouterLink>
        </div>

        <!-- 快速資訊標籤 -->
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">4</span>
            <span class="stat-label">{{ isEn ? 'Scenic Suites' : '間獨立景觀套房' }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">18+</span>
            <span class="stat-label">{{ isEn ? 'Max Guests' : '位專屬包棟容量' }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">100%</span>
            <span class="stat-label">{{ isEn ? 'Private Estate' : '獨立私密園區' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. 品牌哲思簡介 (Philosophy) -->
    <section class="section-py philosophy-section">
      <div class="container">
        <div class="philosophy-grid">
          <div class="philosophy-text">
            <span class="section-tag">{{ isEn ? 'PHILOSOPHY' : '東方隱逸美學' }}</span>
            <h2 class="section-title">
              {{ isEn ? 'A Serene Sanctuary Floating Above the Clouds' : '於山林雲海深處，尋得片刻心靈留白' }}
            </h2>
            <p class="lead">
              {{ isEn 
                ? 'Embracing nature with minimalist architectural design and tactile natural materials, Shan Yu Villa crafts an authentic sense of timeless luxury.' 
                : '山語 Villa 融合東方建築的內斂留白與山林綠意，以天然石材、溫潤黑胡桃木與通透採光，營造出遠離塵囂的頂級私密假期。' 
              }}
            </p>
            <p>
              {{ isEn
                ? 'Whether gathering with beloved family or hosting closed-door executive meetings, our private estate ensures uncompromising tranquility and bespoke hospitality.'
                : '無論是三五好友家族團聚、婚紗攝影采風，亦或是企業高階閉門閉關，整座山莊皆為您一人專屬。'
              }}
            </p>
            <div class="philosophy-features">
              <div class="p-feat">
                <CheckCircle2 :size="18" class="feat-icon" />
                <span>{{ isEn ? '270° Panoramic Mountain Vistas' : '270度環景雲海無光害星空' }}</span>
              </div>
              <div class="p-feat">
                <CheckCircle2 :size="18" class="feat-icon" />
                <span>{{ isEn ? 'Natural Stone Basalt Onsen' : '天然玄武岩弱鹼性碳酸湯屋' }}</span>
              </div>
              <div class="p-feat">
                <CheckCircle2 :size="18" class="feat-icon" />
                <span>{{ isEn ? 'Gourmet Open Island Kitchen' : '中島廚房與 150 吋劇院級影音' }}</span>
              </div>
            </div>
          </div>

          <div class="philosophy-media">
            <div class="img-frame-main img-zoom-container">
              <img 
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80" 
                alt="山語 Villa 實景" 
                loading="lazy"
              />
            </div>
            <div class="img-frame-sub img-zoom-container">
              <img 
                src="https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80" 
                alt="日式庭園" 
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 精選 4 大房型導覽 (Suites Preview) -->
    <section class="section-py rooms-preview-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">{{ isEn ? 'SUITES' : '獨立景觀套房' }}</span>
          <h2 class="section-title">{{ isEn ? '4 Distinct Aesthetic Living Spaces' : '四間獨立景觀套房・各自成境' }}</h2>
          <p class="section-desc">
            {{ isEn 
              ? 'Each suite is thoughtfully designed with private scenery, luxury bedding, and scenic soaking baths.' 
              : '每間套房均擁有專屬觀景視野、五星級飯店級羽絨名床與獨立衛浴泡湯池。' 
            }}
          </p>
        </div>

        <div class="rooms-grid">
          <div v-for="room in roomsData" :key="room.id" class="room-card card-luxury">
            <div class="room-img-wrapper img-zoom-container">
              <img :src="room.image" :alt="tField(room, 'title')" loading="lazy" />
              <div class="room-capacity-badge">
                <Users :size="14" />
                <span>{{ tField(room, 'capacity') }}</span>
              </div>
            </div>
            <div class="room-card-body">
              <h3 class="room-name">{{ tField(room, 'title') }}</h3>
              <p class="room-sub">{{ tField(room, 'subtitle') }}</p>
              <p class="room-desc-short">{{ tField(room, 'desc') }}</p>
              <div class="room-card-footer">
                <span class="room-size">{{ room.size }}</span>
                <RouterLink to="/rooms" class="room-link">
                  <span>{{ t('action.details') }}</span>
                  <ArrowRight :size="15" />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        <div class="section-more-btn">
          <RouterLink to="/rooms" class="btn btn-outline">
            <span>{{ isEn ? 'View All 4 Suites' : '查看 4 間套房完整圖集' }}</span>
            <ArrowRight :size="16" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 4. 園區頂級設施 (Facilities Highlight) -->
    <section class="section-py facilities-preview-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">{{ isEn ? 'FACILITIES' : '頂級園區空間' }}</span>
          <h2 class="section-title">{{ isEn ? 'Curated Amenities for Unforgettable Moments' : '尊榮設施・打造極致度假儀式感' }}</h2>
        </div>

        <div class="facilities-grid">
          <div v-for="fac in facilitiesData" :key="fac.id" class="fac-card">
            <div class="fac-img-box img-zoom-container">
              <img :src="fac.image" :alt="tField(fac, 'title')" loading="lazy" />
            </div>
            <div class="fac-info">
              <h4>{{ tField(fac, 'title') }}</h4>
              <p>{{ tField(fac, 'desc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 尊榮包棟方案亮點 (Pricing Banner) -->
    <section class="pricing-banner-section">
      <div class="container">
        <div class="pricing-banner-box">
          <div class="pricing-banner-info">
            <span class="badge">{{ isEn ? 'EXCLUSIVE PACKAGE' : '全館尊榮包棟' }}</span>
            <h2 class="pricing-title">{{ isEn ? pricingData.exclusivePackage.titleEn : pricingData.exclusivePackage.titleZh }}</h2>
            <p class="pricing-desc">{{ isEn ? pricingData.exclusivePackage.descEn : pricingData.exclusivePackage.descZh }}</p>
            <div class="price-tags">
              <div class="price-chip">
                <span class="label">{{ isEn ? 'Weekday' : '平日包棟' }}</span>
                <span class="val">NT$ {{ pricingData.exclusivePackage.weekday.toLocaleString() }}</span>
              </div>
              <div class="price-chip highlight">
                <span class="label">{{ isEn ? 'Weekend' : '假日包棟' }}</span>
                <span class="val">NT$ {{ pricingData.exclusivePackage.weekend.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <div class="pricing-banner-cta">
            <a :href="siteData.lineUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold">
              <Sparkles :size="16" />
              <span>{{ isEn ? 'Book Exclusive Villa' : '立即洽詢包棟檔期' }}</span>
            </a>
            <RouterLink to="/packages" class="btn btn-outline">
              <span>{{ isEn ? 'View Pricing & Policies' : '查看方案詳細規則' }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.hero-section {
  position: relative;
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding-top: 6rem;
  padding-bottom: 4rem;

  .hero-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transform: scale(1.02);
  }

  .hero-bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(18, 20, 21, 0.45) 0%,
      rgba(18, 20, 21, 0.65) 50%,
      rgba(18, 20, 21, 0.85) 100%
    );
    z-index: 2;
  }
}

.hero-content {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 920px;
  color: #FFFFFF;

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 1rem;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 50px;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    margin-bottom: 1.5rem;
    backdrop-filter: blur(8px);
    color: #E6D5BE;
  }

  .hero-title {
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 1rem;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .hero-subtitle {
    font-family: $font-display;
    font-size: clamp(1.1rem, 2.5vw, 1.6rem);
    letter-spacing: 0.18em;
    color: #E6D5BE;
    margin-bottom: 1.25rem;
    text-transform: uppercase;
  }

  .hero-desc {
    font-size: clamp(0.95rem, 1.8vw, 1.15rem);
    line-height: 1.9;
    color: rgba(255, 255, 255, 0.88);
    max-width: 750px;
    margin: 0 auto 2.5rem;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: center;
    margin-bottom: 3.5rem;
  }
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 30, 31, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1rem 2rem;
  border-radius: 6px;
  gap: 2rem;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-num {
      font-family: $font-display;
      font-size: 1.75rem;
      font-weight: 700;
      color: #E6D5BE;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.75);
      margin-top: 4px;
    }
  }

  .stat-divider {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
  }
}

// Philosophy Section
.philosophy-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
  align-items: center;

  @media (min-width: $bp-lg) {
    grid-template-columns: 1.1fr 1fr;
    gap: 5rem;
  }
}

.philosophy-features {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1.75rem;

  .p-feat {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);

    .feat-icon {
      color: var(--gold-primary);
    }
  }
}

.philosophy-media {
  position: relative;

  .img-frame-main {
    width: 85%;
    height: 380px;
    border-radius: 4px;
    box-shadow: var(--shadow-card);
  }

  .img-frame-sub {
    position: absolute;
    right: 0;
    bottom: -30px;
    width: 55%;
    height: 240px;
    border-radius: 4px;
    border: 6px solid var(--bg-primary);
    box-shadow: var(--shadow-card);
  }
}

// Rooms Preview Section
.rooms-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.room-card {
  display: flex;
  flex-direction: column;

  .room-img-wrapper {
    position: relative;
    height: 260px;

    .room-capacity-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(18, 20, 21, 0.75);
      color: #FFFFFF;
      padding: 0.25rem 0.65rem;
      border-radius: 2px;
      font-size: 0.75rem;
      backdrop-filter: blur(6px);
    }
  }

  .room-card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .room-name {
      font-size: 1.35rem;
      margin-bottom: 0.35rem;
    }

    .room-sub {
      font-size: 0.85rem;
      color: var(--gold-primary);
      margin-bottom: 0.85rem;
    }

    .room-desc-short {
      font-size: 0.9rem;
      color: var(--text-sub);
      line-height: 1.7;
      margin-bottom: 1.25rem;
      flex: 1;
    }

    .room-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;

      .room-size {
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      .room-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--gold-primary);

        &:hover {
          color: var(--gold-dark);
          transform: translateX(3px);
        }
      }
    }
  }
}

.section-more-btn {
  text-align: center;
  margin-top: 3.5rem;
}

// Facilities Preview
.facilities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $bp-lg) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.fac-card {
  .fac-img-box {
    height: 220px;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .fac-info {
    h4 {
      font-size: 1.1rem;
      margin-bottom: 0.4rem;
    }

    p {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.6;
    }
  }
}

// Pricing Banner
.pricing-banner-section {
  padding: 2rem 0 5rem;
}

.pricing-banner-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  box-shadow: var(--shadow-card);

  @media (min-width: $bp-lg) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 3.5rem;
  }

  .pricing-banner-info {
    max-width: 680px;

    .pricing-title {
      font-size: 2rem;
      margin: 0.8rem 0;
    }

    .pricing-desc {
      font-size: 0.95rem;
      color: var(--text-sub);
      margin-bottom: 1.5rem;
    }

    .price-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;

      .price-chip {
        display: flex;
        flex-direction: column;
        background: var(--bg-primary);
        padding: 0.6rem 1.2rem;
        border-radius: 4px;
        border: 1px solid var(--border-color);

        .label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .val {
          font-family: $font-display;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        &.highlight {
          border-color: var(--gold-primary);
          .val {
            color: var(--gold-primary);
          }
        }
      }
    }
  }

  .pricing-banner-cta {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-shrink: 0;

    .btn {
      width: 100%;
      min-width: 220px;
    }
  }
}
</style>
