<script setup>
import { useI18n } from '../../composables/useI18n'
import RoomExpandedDrawer from './RoomExpandedDrawer.vue'
import { 
  Users, 
  Bed, 
  Maximize2, 
  ArrowRight 
} from 'lucide-vue-next'

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open', 'collapse'])

const { t, tField } = useI18n()

// 點擊整張卡片任何區域皆觸發打開展開
const handleCardClick = (event) => {
  if (props.isExpanded) {
    // 若已展開，點擊右側抽屜內的互動元件（預約按鈕、連結等）不處理
    if (event.target.closest('.card-detail-drawer')) {
      return
    }
    // 點擊左側圖片立面區域可收合
    emit('collapse')
    return
  }

  // 未展開狀態：點擊整張卡片任何位置（圖片、標題、內文、標籤、按鈕）皆觸發打開
  emit('open', props.room)
}
</script>

<template>
  <article 
    class="room-focus-card card-luxury"
    :class="{ 
      'is-active': isActive, 
      'is-expanded': isExpanded && isActive 
    }"
    @click="handleCardClick"
    role="button"
    :tabindex="isActive ? 0 : -1"
    :aria-label="tField(room, 'title')"
    @keydown.enter="handleCardClick"
  >
    <!-- 卡片左側 (直式預覽模式時為全張卡片；展開時為左半部景觀立面) -->
    <div class="card-media-col">
      <div class="card-img-wrap img-zoom-container">
        <img 
          :src="room.image" 
          :alt="tField(room, 'title')" 
          loading="lazy" 
        />
        <div class="card-floor-tag">{{ room.floor }}</div>
        <div class="card-capacity-badge">
          <Users :size="13" />
          <span>{{ tField(room, 'capacity') }}</span>
        </div>
      </div>

      <!-- 未展開時顯示的直式卡片基本介紹 -->
      <div v-if="!isExpanded" class="compact-body">
        <div class="compact-header">
          <h3 class="room-title">{{ tField(room, 'title') }}</h3>
          <p class="room-subtitle">{{ tField(room, 'subtitle') }}</p>
        </div>

        <div class="compact-specs-row">
          <span class="spec-pill">
            <Bed :size="13" />
            <span>{{ tField(room, 'bedType') }}</span>
          </span>
          <span class="spec-pill">
            <Maximize2 :size="13" />
            <span>{{ room.size }}</span>
          </span>
        </div>

        <p class="compact-desc">{{ tField(room, 'desc') }}</p>

        <div class="compact-footer">
          <span class="action-text">{{ t('home.suites.expandDetails') }}</span>
          <div class="action-arrow-circle">
            <ArrowRight :size="14" />
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片右側：直接往右拉開的詳細介紹抽屜組件 (無需彈窗) -->
    <RoomExpandedDrawer
      v-if="isExpanded && isActive"
      :room="room"
      @collapse="$emit('collapse')"
    />
  </article>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.room-focus-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--card-width, 320px);
  height: 520px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: 
    width 0.48s $ease-oriental, 
    height 0.48s $ease-oriental, 
    border-color 0.35s ease, 
    box-shadow 0.35s ease;

  // 焦點中央卡片
  &.is-active {
    border-color: var(--gold-primary);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
  }

  // 整張卡片懸停反饋（未展開時）
  &:hover:not(.is-expanded) {
    border-color: var(--gold-primary);
    box-shadow: 0 20px 48px rgba(197, 168, 128, 0.28);
    transform: translateY(-4px);

    .compact-footer .action-arrow-circle {
      background: var(--gold-primary);
      color: #121415;
      transform: translateX(4px);
    }

    .compact-footer .action-text {
      color: var(--gold-primary);
    }
  }

  // 往右直接拉開之展開狀態 (放大長寬，避免內容出現 scroll)
  &.is-expanded {
    width: var(--card-expanded-width, 1080px);
    max-width: 95vw;
    height: 630px;
    flex-direction: column;
    border-color: var(--gold-primary);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
    cursor: default;

    @media (min-width: $bp-md) {
      flex-direction: row;
    }

    .card-media-col {
      width: 100%;
      height: 220px;
      flex-shrink: 0;
      cursor: pointer;

      @media (min-width: $bp-md) {
        width: 380px;
        height: 100%;
      }

      .card-img-wrap {
        height: 100%;
      }
    }
  }

  &:focus-visible {
    outline: 2px solid var(--gold-primary);
    outline-offset: 2px;
  }
}

// 左側媒體欄位
.card-media-col {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .card-img-wrap {
    position: relative;
    height: 230px;
    flex-shrink: 0;
    background: var(--bg-primary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s $ease-oriental;
    }

    .card-floor-tag {
      position: absolute;
      top: 0.85rem;
      left: 0.85rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.55rem;
      border-radius: 2px;
      background: var(--gold-primary);
      color: #121415;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .card-capacity-badge {
      position: absolute;
      top: 0.85rem;
      right: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(18, 20, 21, 0.78);
      color: #FFFFFF;
      padding: 0.22rem 0.65rem;
      border-radius: 2px;
      font-size: 0.75rem;
      backdrop-filter: blur(6px);
    }
  }
}

// 未展開之簡要內容區
.compact-body {
  padding: 1.25rem 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  .compact-header {
    margin-bottom: 0.65rem;

    .room-title {
      font-family: $font-serif;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .room-subtitle {
      font-size: 0.8rem;
      color: var(--text-sub);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
  }

  .compact-specs-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;

    .spec-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: var(--bg-primary);
      padding: 0.2rem 0.5rem;
      border-radius: 2px;
      border: 1px solid var(--border-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .compact-desc {
    font-size: 0.85rem;
    color: var(--text-sub);
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact-footer {
    margin-top: auto;
    padding-top: 0.85rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .action-text {
      font-size: 0.84rem;
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.3s ease;
      letter-spacing: 0.02em;
    }

    .action-arrow-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: $transition-base;
    }
  }
}
</style>
