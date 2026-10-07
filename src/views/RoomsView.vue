<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import roomsData from '../data/rooms.json'
import siteData from '../data/site.json'
import { 
  Users, 
  Bed, 
  Maximize, 
  Check, 
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

const { isEn, t, tField } = useI18n()

// 圖片輪播狀態控制
const currentImageIndexes = ref(roomsData.map(() => 0))

const nextImage = (roomIndex, total) => {
  currentImageIndexes.value[roomIndex] = (currentImageIndexes.value[roomIndex] + 1) % total
}

const prevImage = (roomIndex, total) => {
  currentImageIndexes.value[roomIndex] = (currentImageIndexes.value[roomIndex] - 1 + total) % total
}
</script>

<template>
  <div class="rooms-page">
    <!-- 頂部頁頭 -->
    <section class="page-header">
      <div class="container header-container">
        <span class="section-tag">{{ isEn ? 'ACCOMMODATION' : '房型導覽' }}</span>
        <h1 class="page-title">{{ isEn ? '4 Private Panoramic Suites' : '4 間獨立景觀套房' }}</h1>
        <p class="page-desc">
          {{ isEn 
            ? 'Thoughtfully designed with natural materials, panoramic bathtubs, and tranquil mountain forest vistas.' 
            : '每一間套房皆為獨立景觀設計，融入天然石材、原木與日式枯山水意境，給您最靜謐奢華的私密時光。' 
          }}
        </p>
      </div>
    </section>

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
              <div class="gallery-main-frame img-zoom-container">
                <img 
                  :src="room.gallery ? room.gallery[currentImageIndexes[index]] : room.image" 
                  :alt="tField(room, 'title')"
                  loading="lazy"
                />
                
                <!-- 輪播箭頭 (若有圖集) -->
                <div v-if="room.gallery && room.gallery.length > 1" class="gallery-controls">
                  <button 
                    class="gal-btn" 
                    @click="prevImage(index, room.gallery.length)"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft :size="20" />
                  </button>
                  <button 
                    class="gal-btn" 
                    @click="nextImage(index, room.gallery.length)"
                    aria-label="Next photo"
                  >
                    <ChevronRight :size="20" />
                  </button>
                </div>

                <div class="gallery-counter" v-if="room.gallery">
                  {{ currentImageIndexes[index] + 1 }} / {{ room.gallery.length }}
                </div>
              </div>
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
                <a :href="siteData.lineUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold">
                  <Sparkles :size="16" />
                  <span>{{ isEn ? 'Inquire Availability' : '洽詢此房型包棟檔期' }}</span>
                </a>
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

.page-header {
  padding-top: 8.5rem;
  padding-bottom: 3.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  text-align: center;

  .header-container {
    max-width: 800px;
  }

  .page-title {
    font-size: clamp(2rem, 4vw, 3rem);
    margin: 0.8rem 0;
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-sub);
    line-height: 1.8;
  }
}

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

.room-gallery-column {
  .gallery-main-frame {
    position: relative;
    height: 380px;
    border-radius: 4px;

    @media (min-width: $bp-lg) {
      height: 480px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .gallery-controls {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;

    .gal-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(18, 20, 21, 0.7);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);

      &:hover {
        background: var(--gold-primary);
      }
    }
  }

  .gallery-counter {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgba(18, 20, 21, 0.7);
    color: #FFFFFF;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 2px;
    backdrop-filter: blur(8px);
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
