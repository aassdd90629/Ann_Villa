<script setup>
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import BookingButton from '../components/common/BookingButton.vue'
import newsData from '../data/news.json'
import siteData from '../data/site.json'
import { Calendar, Tag, ArrowRight, Sparkles } from 'lucide-vue-next'

const { isEn } = useI18n()
</script>

<template>
  <div class="news-page">
    <PageHeader 
      :tag="isEn ? 'NEWS & OFFERS' : '最新消息'"
      :title="isEn ? 'Latest News & Seasonal Offers' : '最新消息、節慶優惠與公告'"
      :desc="isEn
        ? 'Stay informed about our exclusive seasonal packages, culinary events, and estate updates.'
        : '掌握山語 Villa 最新檔期開放、早鳥限定禮遇與專案活動資訊。'"
    />

    <section class="section-py news-content-section">
      <div class="container">
        <div class="news-grid">
          <article 
            v-for="item in newsData" 
            :key="item.id"
            class="news-card card-luxury"
            :class="{ 'featured': item.featured }"
          >
            <div class="news-img-box img-zoom-container">
              <img :src="item.image" :alt="isEn ? item.titleEn : item.titleZh" loading="lazy" />
              <div class="category-tag">
                <Tag :size="12" />
                <span>{{ isEn ? item.categoryEn : item.categoryZh }}</span>
              </div>
            </div>

            <div class="news-body">
              <div class="date-row">
                <Calendar :size="14" class="date-icon" />
                <span>{{ item.date }}</span>
              </div>

              <h2 class="news-title">{{ isEn ? item.titleEn : item.titleZh }}</h2>
              <p class="news-summary">{{ isEn ? item.summaryEn : item.summaryZh }}</p>

              <div class="news-footer">
                <BookingButton 
                  :roomTitle="isEn ? item.titleEn : item.titleZh"
                  variant="none"
                  customClass="news-cta"
                  :showIcon="false"
                >
                  <span>{{ isEn ? 'Inquire Promotion' : '洽詢專案詳情' }}</span>
                  <ArrowRight :size="15" />
                </BookingButton>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;


.news-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.news-card {
  display: flex;
  flex-direction: column;

  .news-img-box {
    position: relative;
    height: 220px;

    .category-tag {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: var(--gold-primary);
      color: #FFFFFF;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 2px;
      font-weight: 500;
    }
  }

  .news-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .date-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;

      .date-icon {
        color: var(--gold-primary);
      }
    }

    .news-title {
      font-size: 1.15rem;
      margin-bottom: 0.65rem;
      line-height: 1.45;
    }

    .news-summary {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.7;
      margin-bottom: 1.25rem;
      flex: 1;
    }

    .news-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 0.85rem;

      .news-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.88rem;
        color: var(--gold-primary);
        font-weight: 500;

        &:hover {
          color: var(--gold-dark);
          transform: translateX(3px);
        }
      }
    }
  }
}
</style>
