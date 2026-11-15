<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import BookingButton from '../common/BookingButton.vue'
import { 
  Users, 
  Bed, 
  Maximize2, 
  ArrowRight, 
  Check, 
  ChevronLeft 
} from 'lucide-vue-next'

defineProps({
  room: {
    type: Object,
    required: true
  }
})

defineEmits(['collapse'])

const { isEn, tField } = useI18n()
</script>

<template>
  <div class="card-detail-drawer">
    <!-- 頂部列：房間代號與收合按鈕 -->
    <div class="drawer-top-bar">
      <div class="drawer-tags">
        <span class="tag-floor">{{ room.floor }}</span>
        <span class="tag-code">{{ room.id.toUpperCase() }}</span>
      </div>
      <button 
        class="collapse-btn" 
        @click.stop="$emit('collapse')"
        :aria-label="isEn ? 'Collapse' : '收合詳細介紹'"
      >
        <ChevronLeft :size="16" />
        <span>{{ isEn ? 'Collapse' : '收合客房介紹' }}</span>
      </button>
    </div>

    <!-- 標題與副標題 -->
    <div class="drawer-header">
      <h3 class="drawer-title">{{ tField(room, 'title') }}</h3>
      <p class="drawer-subtitle">{{ tField(room, 'subtitle') }}</p>
    </div>

    <!-- 規格屬性膠囊 -->
    <div class="drawer-specs-grid">
      <div class="spec-box">
        <Users :size="15" class="spec-icon" />
        <div class="spec-text">
          <span class="spec-name">{{ isEn ? 'Capacity' : '容納人數' }}</span>
          <span class="spec-val">{{ tField(room, 'capacity') }}</span>
        </div>
      </div>
      <div class="spec-box">
        <Bed :size="15" class="spec-icon" />
        <div class="spec-text">
          <span class="spec-name">{{ isEn ? 'Bed Type' : '床型配置' }}</span>
          <span class="spec-val">{{ tField(room, 'bedType') }}</span>
        </div>
      </div>
      <div class="spec-box">
        <Maximize2 :size="15" class="spec-icon" />
        <div class="spec-text">
          <span class="spec-name">{{ isEn ? 'Area Size' : '空間坪數' }}</span>
          <span class="spec-val">{{ room.size }}</span>
        </div>
      </div>
    </div>

    <!-- 詳細說明內文 -->
    <div class="drawer-desc-block">
      <h4 class="block-title">{{ isEn ? 'Suite Concept' : '客房風格與空間特色' }}</h4>
      <p class="drawer-desc-text">{{ tField(room, 'desc') }}</p>
    </div>

    <!-- 設施與特色亮點 -->
    <div class="drawer-highlights-block">
      <h4 class="block-title">{{ isEn ? 'Amenities & Features' : '房型專屬設施與特色亮點' }}</h4>
      <ul class="highlights-list">
        <li 
          v-for="(item, idx) in (isEn ? room.highlightsEn : room.highlightsZh)" 
          :key="idx"
          class="highlight-item"
        >
          <Check :size="15" class="check-icon" />
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <!-- 底部預約諮詢按鈕與全房型連結 -->
    <div class="drawer-footer-actions">
      <BookingButton 
        :roomId="room.id"
        :roomTitle="tField(room, 'title')"
        variant="gold"
        :text="isEn ? 'Inquire Availability' : '洽詢此房型包棟檔期'"
        customClass="btn-inquire-direct"
      />
      <RouterLink to="/rooms" class="btn btn-outline btn-all-rooms">
        <span>{{ isEn ? 'View All Rooms' : '瀏覽全棟 5 大客房' }}</span>
        <ArrowRight :size="15" />
      </RouterLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.card-detail-drawer {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.75rem 2.25rem;
  background: var(--bg-card);
  animation: drawerSlideRight 0.42s $ease-oriental forwards;
  overflow: visible;

  @media (max-width: $bp-md) {
    padding: 1.25rem 1.25rem;
    overflow-y: auto;
  }

  .drawer-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;

    .drawer-tags {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .tag-floor {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.18rem 0.55rem;
        border-radius: 2px;
        background: var(--gold-primary);
        color: #121415;
      }

      .tag-code {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-muted);
        letter-spacing: 0.06em;
      }
    }

    .collapse-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.35rem 0.85rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: $transition-base;

      &:hover {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
        background: var(--badge-bg);
      }
    }
  }

  .drawer-header {
    margin-bottom: 1rem;

    .drawer-title {
      font-family: $font-serif;
      font-size: 1.45rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.35rem;
    }

    .drawer-subtitle {
      font-size: 0.88rem;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.5;
    }
  }

  .drawer-specs-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.65rem;
    margin-bottom: 1.15rem;
    padding: 0.85rem 1.25rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;

    @media (min-width: $bp-sm) {
      grid-template-columns: 110px 1fr 110px;
      gap: 1rem;
    }

    .spec-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;

      .spec-icon {
        color: var(--gold-primary);
        flex-shrink: 0;
      }

      .spec-text {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .spec-name {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.1rem;
        }

        .spec-val {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.35;
        }
      }
    }
  }

  .drawer-desc-block {
    margin-bottom: 1.1rem;

    .block-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.4rem;
    }

    .drawer-desc-text {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.7;
      margin: 0;
    }
  }

  .drawer-highlights-block {
    margin-bottom: 1.35rem;

    .block-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
    }

    .highlights-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;

      @media (min-width: $bp-sm) {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.55rem 1.5rem;
      }

      .highlight-item {
        display: flex;
        align-items: flex-start;
        gap: 0.45rem;
        font-size: 0.84rem;
        color: var(--text-sub);
        line-height: 1.45;

        .check-icon {
          color: var(--gold-primary);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
      }
    }
  }

  .drawer-footer-actions {
    margin-top: auto;
    padding-top: 1.15rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    @media (min-width: $bp-sm) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .btn-inquire-direct {
      flex: 1;
    }

    .btn-all-rooms {
      flex-shrink: 0;
    }
  }
}

@keyframes drawerSlideRight {
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
