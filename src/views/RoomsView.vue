<script setup>
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import BookingButton from '../components/common/BookingButton.vue'
import ImageGallery from '../components/common/ImageGallery.vue'
import roomsData from '../data/rooms.json'
import siteData from '../data/site.json'
import { 
  Users, 
  Bed, 
  Maximize, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-vue-next'

const { isEn, t, tField } = useI18n()
</script>

<template>
  <div class="rooms-page">
    <!-- 頂部頁頭 -->
    <PageHeader 
      :tag="isEn ? 'ACCOMMODATION' : '房型導覽'"
      :title="isEn ? '5 Private Suites' : '5 間獨立景觀客房'"
      :desc="isEn 
        ? 'Features 5 comfortable bedrooms across two floors (3 on 1F, 2 on 2F) accommodating up to 20 guests in complete privacy.' 
        : '全館共 5 間獨立客房（1樓三間、2樓兩間），最多可容納 20 位貴賓，享受極致悠閒的山林包棟假期。'"
    />

    <!-- 房型列表 -->
    <section class="section-py rooms-list-section">
      <div class="container">
        <div class="rooms-flow">
          <article 
            v-for="(room, index) in roomsData" 
            :key="room.id" 
            :id="room.id"
            class="room-detail-card"
            :class="{ 'reverse': index % 2 === 1 }"
          >
            <!-- 房型圖集輪播展示 -->
            <div class="room-gallery-column">
              <ImageGallery 
                :images="room.gallery"
                :fallbackImage="room.image"
                :alt="tField(room, 'title')"
              />
            </div>

            <!-- 房型詳細資訊 -->
            <div class="room-info-column">
              <div class="room-tag-line">
                <span class="room-code">{{ room.id.toUpperCase() }}</span>
                <span class="room-size-badge">{{ room.size }}</span>
              </div>

              <h2 class="room-title">{{ tField(room, 'title') }}</h2>
              <p class="room-subtitle">{{ tField(room, 'subtitle') }}</p>
              
              <div class="room-meta-pills">
                <div class="meta-pill">
                  <Users :size="16" class="pill-icon" />
                  <span>{{ tField(room, 'capacity') }}</span>
                </div>
                <div class="meta-pill">
                  <Bed :size="16" class="pill-icon" />
                  <span>{{ tField(room, 'bedType') }}</span>
                </div>
              </div>

              <p class="room-full-desc">
                {{ tField(room, 'desc') }}
              </p>

              <!-- 特色亮點清單 -->
              <div class="highlights-box">
                <h4 class="box-title">{{ isEn ? 'Suite Highlights' : '房型專屬設施與亮點' }}</h4>
                <ul class="highlights-list">
                  <li 
                    v-for="(item, hIdx) in (isEn ? room.highlightsEn : room.highlightsZh)" 
                    :key="hIdx"
                  >
                    <Check :size="16" class="chk-icon" />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <!-- 預約諮詢按鈕 -->
              <div class="room-actions">
                <BookingButton 
                  :roomId="room.id"
                  :roomTitle="tField(room, 'title')"
                  variant="gold"
                  :text="isEn ? 'Inquire Availability' : '洽詢此房型包棟檔期'"
                />
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


.rooms-flow {
  display: flex;
  flex-direction: column;
  gap: 5rem;

  @media (min-width: $bp-lg) {
    gap: 7rem;
  }
}

.room-detail-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  padding: 1.5rem;

  @media (min-width: $bp-lg) {
    grid-template-columns: 1.15fr 1fr;
    gap: 3.5rem;
    padding: 2.5rem;

    &.reverse {
      grid-template-columns: 1fr 1.15fr;

      .room-gallery-column {
        order: 2;
      }
      .room-info-column {
        order: 1;
      }
    }
  }
}


.room-info-column {
  display: flex;
  flex-direction: column;
  justify-content: center;

  .room-tag-line {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.6rem;

    .room-code {
      font-family: $font-display;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--gold-primary);
      letter-spacing: 0.1em;
    }

    .room-size-badge {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  }

  .room-title {
    font-size: clamp(1.6rem, 2.5vw, 2.2rem);
    margin-bottom: 0.35rem;
  }

  .room-subtitle {
    font-size: 0.95rem;
    color: var(--gold-primary);
    margin-bottom: 1.25rem;
  }

  .room-meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-primary);
      padding: 0.4rem 0.85rem;
      border-radius: 4px;
      font-size: 0.85rem;
      border: 1px solid var(--border-color);
      color: var(--text-primary);

      .pill-icon {
        color: var(--gold-primary);
      }
    }
  }

  .room-full-desc {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--text-sub);
    margin-bottom: 1.5rem;
  }

  .highlights-box {
    background: var(--bg-primary);
    padding: 1.25rem 1.5rem;
    border-radius: 4px;
    border-left: 3px solid var(--gold-primary);
    margin-bottom: 1.75rem;

    .box-title {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .highlights-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      li {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.88rem;
        color: var(--text-sub);

        .chk-icon {
          color: var(--gold-primary);
          flex-shrink: 0;
          margin-top: 3px;
        }
      }
    }
  }

  .room-actions {
    display: flex;
  }
}
</style>
