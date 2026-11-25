<script setup>
import { CheckCircle2 } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'

const { isEn } = useI18n()
</script>

<template>
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

          <!-- 全棟專屬設施亮點 -->
          <div class="philosophy-features">
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ isEn ? '5 Private Bedrooms (Up to 18 Guests)' : '全棟5間獨立客房・專屬容納最多18位' }}</span>
            </div>
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ isEn ? 'Auto-Mahjong & KTV Karaoke Lounge' : '電動麻將桌與客廳卡拉OK歡唱空間' }}</span>
            </div>
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ isEn ? 'Smart Kitchen, Outdoor Tea Patio & BBQ' : '智能廚房、戶外品茗茶席與庭園烤肉BBQ' }}</span>
            </div>
          </div>

          <!-- 包棟計價與方案費用說明 -->
          <div class="philosophy-pricing-box">
            <div class="pricing-group">
              <span class="pricing-title">{{ isEn ? 'Weekdays:' : '平日：' }}</span>
              <ul class="pricing-list">
                <li>{{ isEn ? '• 10 guests or fewer: NT$ 20,000 w/ Breakfast' : '• 10人以下2萬元含早餐' }}</li>
                <li>{{ isEn ? '• 11-14 guests: NT$ 25,000 w/ Breakfast' : '• 11-14人以下2.5萬元含早餐' }}</li>
                <li>{{ isEn ? '• 15-18 guests: NT$ 30,000 w/ Breakfast' : '• 15-18人以下3萬元含早餐' }}</li>
              </ul>
            </div>

            <div class="pricing-group">
              <div class="pricing-line">
                {{ isEn ? '• Regular Weekend: NT$ 35,000 w/ Breakfast (Fri, Sat, Sun)' : '• 一般假日3.5萬元含早餐（一般假日是指星期五、六、日）' }}
              </div>
              <div class="pricing-line holiday-line">
                <span class="holiday-title">{{ isEn ? 'National Holidays: ' : '國定假日：' }}</span>
                <span class="holiday-note">{{ isEn ? '（Holiday rates apply starting from the day before holiday w/ breakfast; Lunar New Year does not include breakfast）' : '（一律國定假日前一天，開始算國定假日的房價含早餐，但過年房價不提供早餐）' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="philosophy-media">
          <div class="img-frame-main img-zoom-container">
            <img 
              src="/img/house/house-01.webp" 
              :alt="isEn ? 'Shan Yu Villa Estate Exterior & Lawn' : '山語 Villa 莊園建築外觀與青翠草坪'" 
              loading="lazy"
            />
          </div>
          <div class="img-frame-sub img-zoom-container">
            <img 
              src="/img/cloud-sea/cloud-sea-02.webp" 
              :alt="isEn ? 'Mountain Mist and Cloud Sea Horizon' : '山語莊園遠眺層巒雲霧仙境'" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

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

.philosophy-pricing-box {
  margin-top: 1.5rem;
  padding: 1.15rem 1.35rem;
  background: rgba(197, 168, 128, 0.08);
  border: 1px solid rgba(197, 168, 128, 0.25);
  border-left: 3.5px solid var(--gold-primary, #C5A880);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  .pricing-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .pricing-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--gold-dark, #91754F);
    letter-spacing: 0.5px;
  }

  .pricing-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    li {
      font-size: 0.92rem;
      color: var(--text-primary);
      line-height: 1.5;
    }
  }

  .pricing-line {
    font-size: 0.92rem;
    color: var(--text-primary);
    line-height: 1.5;

    &.holiday-line {
      margin-top: 0.2rem;
      color: var(--text-secondary);

      .holiday-title {
        font-weight: 600;
        color: var(--gold-dark, #91754F);
      }

      .holiday-note {
        color: var(--text-primary);
      }
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

    @media (max-width: $bp-sm) {
      width: 88%;
      height: 250px;
    }
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

    @media (max-width: $bp-sm) {
      width: 55%;
      height: 150px;
      bottom: -15px;
      border-width: 4px;
    }
  }
}
</style>