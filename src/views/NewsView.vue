<script setup>
import { useI18n } from '../composables/useI18n'
import { useSiteContent } from '../composables/useSiteContent'
import PageHeader from '../components/common/PageHeader.vue'
import BookingButton from '../components/common/BookingButton.vue'
import { Calendar, Tag, ArrowRight, Star, Newspaper } from 'lucide-vue-next'

const { t, tField } = useI18n()
const { newsList, fetchContent, isLoading } = useSiteContent()
fetchContent()

const fallbackImg = '/img/homebanner/homebanner-01.webp'

const handleImageError = (e) => {
  if (e.target.src !== fallbackImg) {
    e.target.src = fallbackImg
  }
}
</script>

<template>
  <div class="news-page">
    <PageHeader 
      :tag="t('news.tag')"
      :title="t('news.title')"
      :desc="t('news.desc')"
    />

    <section class="section-py news-content-section">
      <div class="container">
        <!-- 骨架屏載入狀態 (Skeleton Loading) -->
        <div v-if="isLoading && newsList.length === 0" class="news-grid">
          <div v-for="n in 3" :key="'skeleton-' + n" class="news-card card-luxury skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
              <div class="skeleton-line sm"></div>
              <div class="skeleton-line md"></div>
              <div class="skeleton-line lg"></div>
            </div>
          </div>
        </div>

        <!-- 空狀態 (Empty State) -->
        <div v-else-if="newsList.length === 0" class="empty-news-container card-luxury">
          <div class="empty-icon-box">
            <Newspaper :size="48" class="empty-icon" />
          </div>
          <h3 class="empty-title">{{ t('news.emptyTitle') }}</h3>
          <p class="empty-desc">{{ t('news.emptyDesc') }}</p>
          <div class="empty-action">
            <BookingButton 
              variant="gold"
              customClass="btn-empty-inquire"
              :showIcon="true"
            />
          </div>
        </div>

        <!-- 最新消息列表 (動態由資料庫呈現) -->
        <div v-else class="news-grid">
          <article 
            v-for="item in newsList" 
            :key="item.id"
            class="news-card card-luxury"
            :class="{ 'featured': item.featured }"
          >
            <div class="news-img-box img-zoom-container">
              <img 
                :src="item.image || fallbackImg" 
                :alt="tField(item, 'title')" 
                loading="lazy" 
                @error="handleImageError"
              />
              <div class="category-tag">
                <Tag :size="12" />
                <span>{{ tField(item, 'category') }}</span>
              </div>
              <div v-if="item.featured" class="featured-badge">
                <Star :size="11" />
                <span>{{ t('news.featuredBadge') }}</span>
              </div>
            </div>

            <div class="news-body">
              <div class="date-row">
                <Calendar :size="14" class="date-icon" />
                <span>{{ item.date }}</span>
              </div>

              <h2 class="news-title">{{ tField(item, 'title') }}</h2>
              <p class="news-summary">{{ tField(item, 'summary') }}</p>

              <div class="news-footer">
                <BookingButton 
                  :roomTitle="tField(item, 'title')"
                  variant="none"
                  customClass="news-cta"
                  :showIcon="false"
                >
                  <span>{{ t('news.inquirePromotion') }}</span>
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
  gap: 1.5rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.75rem;
  }

  @media (min-width: $bp-lg) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

.news-card {
  display: flex;
  flex-direction: column;
  position: relative;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &.featured {
    border: 1px solid var(--gold-primary);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.12);
  }

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
      z-index: 2;
    }

    .featured-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(18, 20, 21, 0.85);
      border: 1px solid var(--gold-primary);
      color: var(--gold-primary);
      font-size: 0.72rem;
      padding: 0.22rem 0.55rem;
      border-radius: 2px;
      font-weight: 600;
      backdrop-filter: blur(4px);
      z-index: 2;
    }
  }

  .news-body {
    padding: 1.15rem 1rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    @media (min-width: $bp-sm) {
      padding: 1.5rem;
    }

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

// 空狀態
.empty-news-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4.5rem 1.5rem;
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  max-width: 680px;
  margin: 0 auto;

  .empty-icon-box {
    margin-bottom: 1.25rem;
    color: var(--gold-primary);
    opacity: 0.75;
  }

  .empty-title {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 0.75rem;
  }

  .empty-desc {
    font-size: 0.92rem;
    color: var(--text-sub);
    line-height: 1.75;
    margin-bottom: 2rem;
    max-width: 480px;
  }
}

// 骨架屏
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
      &.sm { width: 30%; height: 12px; }
      &.md { width: 85%; height: 20px; }
      &.lg { width: 95%; height: 14px; }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
</style>
