<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import RoomVerticalCard from './RoomVerticalCard.vue'
import defaultRoomsData from '../../data/rooms.json'
import { Sparkles, Pause, Play } from 'lucide-vue-next'

const props = defineProps({
  rooms: {
    type: Array,
    default: () => defaultRoomsData
  },
  interval: {
    type: Number,
    default: 4200
  }
})

const { isEn } = useI18n()

// 焦點輪播狀態 (最中間那張焦點集中)
const activeIndex = ref(0)
const isPaused = ref(false)
const expandedRoomId = ref(null)

const isExpanded = computed(() => expandedRoomId.value !== null)

// 計算每張卡片相對中央焦點的位置偏移 (-2, -1, 0, 1, 2)
const getOffset = (index) => {
  const len = props.rooms.length
  if (len === 0) return 0
  let diff = (index - activeIndex.value) % len
  if (diff > len / 2) diff -= len
  if (diff < -len / 2) diff += len
  return diff
}

// 點擊整張卡片：
// - 若已是中間卡片：立即向右展開
// - 若為兩側卡片：先平滑移至中間焦點，再優雅執行向右拉開動畫
let pendingExpandTimer = null

const openRoom = (index) => {
  if (pendingExpandTimer) {
    clearTimeout(pendingExpandTimer)
    pendingExpandTimer = null
  }

  isPaused.value = true

  // 1. 若點選的已經是中間焦點卡片，直接執行向右拉開
  if (index === activeIndex.value) {
    expandedRoomId.value = props.rooms[index].id
    return
  }

  // 2. 若點選左側或右側卡片：
  // 階段一：維持直式卡片形態，先行平滑滑動移動至舞台中央焦點
  expandedRoomId.value = null
  activeIndex.value = index

  // 階段二：等待卡片完全就位中央焦點（約 480ms）後，再順暢觸發向右展開動畫
  pendingExpandTimer = setTimeout(() => {
    if (activeIndex.value === index) {
      expandedRoomId.value = props.rooms[index].id
    }
    pendingExpandTimer = null
  }, 480)
}

const collapse = () => {
  if (pendingExpandTimer) {
    clearTimeout(pendingExpandTimer)
    pendingExpandTimer = null
  }
  expandedRoomId.value = null
}

// 自動輪播機制 (懸停暫停、展開時暫停)
let autoplayTimer = null

const nextSlide = () => {
  if (props.rooms.length <= 1 || isExpanded.value) return
  activeIndex.value = (activeIndex.value + 1) % props.rooms.length
}

const prevSlide = () => {
  if (props.rooms.length <= 1 || isExpanded.value) return
  activeIndex.value = (activeIndex.value - 1 + props.rooms.length) % props.rooms.length
}

const startAutoplay = () => {
  stopAutoplay()
  if (props.rooms.length <= 1) return
  autoplayTimer = setInterval(() => {
    if (!isPaused.value && !isExpanded.value) {
      nextSlide()
    }
  }, props.interval)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const onMouseEnter = () => {
  isPaused.value = true
}

const onMouseLeave = () => {
  isPaused.value = false
}

// 手機觸控手勢滑動
let touchStartX = 0
let touchEndX = 0

const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  isPaused.value = true
}

const onTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX - touchEndX
  if (Math.abs(diff) > 40 && !isExpanded.value) {
    if (diff > 0) {
      nextSlide()
    } else {
      prevSlide()
    }
  }
  isPaused.value = false
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  if (pendingExpandTimer) {
    clearTimeout(pendingExpandTimer)
    pendingExpandTimer = null
  }
  stopAutoplay()
})
</script>

<template>
  <div 
    class="room-carousel-stage"
    :class="{ 'has-expanded-card': isExpanded }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- 頂部精緻提示列 (無數字、無箭頭) -->
    <div class="stage-hint-bar">
      <div class="hint-content">
        <Sparkles :size="13" class="hint-icon" />
        <span>
          {{ isEn 
            ? 'Hover to pause · Click any card to expand details to the right' 
            : '滑鼠懸停自動暫停・點擊整張卡片直接向右展開客房詳情' 
          }}
        </span>
      </div>
      <div class="state-pill" :class="{ 'paused': isPaused || isExpanded }">
        <Pause v-if="isPaused || isExpanded" :size="11" />
        <Play v-else :size="11" />
        <span>{{ (isPaused || isExpanded) ? (isEn ? 'Paused' : '暫停中') : (isEn ? 'Auto-cycling' : '輪播中') }}</span>
      </div>
    </div>

    <!-- 舞台視窗 (中心焦點堆疊模式) -->
    <div class="stage-viewport">
      <!-- 展開狀態下的背後收合遮罩 (全面杜絕兩側卡片誤觸與無限 hover 抖動) -->
      <div 
        v-if="isExpanded" 
        class="expanded-backdrop" 
        @click="collapse" 
        :title="isEn ? 'Click to collapse' : '點擊空白處收合'"
      />

      <div class="stage-track">
        <div 
          v-for="(room, index) in rooms" 
          :key="room.id"
          class="card-slot"
          :class="[
            `slot-offset-${getOffset(index)}`,
            { 
              'is-center': getOffset(index) === 0,
              'is-expanded': isExpanded && getOffset(index) === 0
            }
          ]"
        >
          <RoomVerticalCard
            :room="room"
            :isActive="getOffset(index) === 0"
            :isExpanded="isExpanded && getOffset(index) === 0"
            @open="openRoom(index)"
            @collapse="collapse"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.room-carousel-stage {
  --card-width: 330px;
  --card-expanded-width: 1080px;
  --card-spacing: 360px;
  --card-spacing-expanded: 620px;

  position: relative;
  width: 100%;
  margin: 1.5rem 0 2rem;
  user-select: none;

  @media (max-width: 1360px) {
    --card-expanded-width: 1000px;
    --card-spacing-expanded: 560px;
  }

  @media (max-width: 1200px) {
    --card-spacing: 320px;
    --card-spacing-expanded: 520px;
    --card-expanded-width: 940px;
  }

  @media (max-width: $bp-lg) {
    --card-width: 290px;
    --card-spacing: 270px;
    --card-spacing-expanded: 440px;
    --card-expanded-width: 860px;
  }

  @media (max-width: $bp-md) {
    --card-width: 280px;
    --card-spacing: 190px;
    --card-spacing-expanded: 240px;
    --card-expanded-width: 95vw;
  }

  @media (max-width: $bp-sm) {
    --card-width: 270px;
    --card-spacing: 140px;
    --card-spacing-expanded: 180px;
  }
}

// 頂部提示列
.stage-hint-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding: 0 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);

  .hint-content {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .hint-icon {
      color: var(--gold-primary);
    }
  }

  .state-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    transition: $transition-base;

    &.paused {
      color: var(--gold-primary);
      border-color: var(--gold-primary);
      background: var(--badge-bg);
    }
  }
}

// 舞台視窗與軌道
.stage-viewport {
  position: relative;
  overflow: hidden;
  padding: 1.5rem 0 2rem;
  width: 100%;
}

// 展開狀態時覆蓋於兩側的收合遮罩 (攔截滑鼠事件，徹底杜絕側邊無限 hover 抖動)
.expanded-backdrop {
  position: absolute;
  inset: 0;
  z-index: 18;
  cursor: pointer;
  background: transparent;
}

.stage-track {
  position: relative;
  width: 100%;
  height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.45s $ease-oriental;

  @media (max-width: $bp-md) {
    height: 560px;
  }
}

// 卡片插槽定位 (中心焦點堆疊)
.card-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  transition: 
    transform 0.55s $ease-oriental, 
    opacity 0.45s ease, 
    filter 0.45s ease;
  will-change: transform, opacity;

  // 中央焦點卡片
  &.slot-offset-0 {
    transform: translate(-50%, -50%) scale(1);
    z-index: 10;
    opacity: 1;

    &.is-expanded {
      z-index: 25;
    }
  }

  // 右側第一張
  &.slot-offset-1 {
    transform: translate(calc(-50% + var(--card-spacing)), -50%) scale(0.88);
    z-index: 5;
    opacity: 0.55;
    cursor: pointer;

    &:hover {
      opacity: 0.88;
      transform: translate(calc(-50% + var(--card-spacing)), calc(-50% - 6px)) scale(0.9);
    }
  }

  // 左側第一張
  &.slot-offset--1 {
    transform: translate(calc(-50% - var(--card-spacing)), -50%) scale(0.88);
    z-index: 5;
    opacity: 0.55;
    cursor: pointer;

    &:hover {
      opacity: 0.88;
      transform: translate(calc(-50% - var(--card-spacing)), calc(-50% - 6px)) scale(0.9);
    }
  }

  // 右側外圍
  &.slot-offset-2 {
    transform: translate(calc(-50% + var(--card-spacing) * 1.8), -50%) scale(0.76);
    z-index: 1;
    opacity: 0.15;
    pointer-events: none;
  }

  // 左側外圍
  &.slot-offset--2 {
    transform: translate(calc(-50% - var(--card-spacing) * 1.8), -50%) scale(0.76);
    z-index: 1;
    opacity: 0.15;
    pointer-events: none;
  }
}

// 當中央卡片往右展開時，舞台軌道自動提升高度至 650px，內容全面舒展且零捲動條
.has-expanded-card {
  .stage-track {
    height: 650px;

    @media (max-width: $bp-md) {
      height: 680px;
    }
  }

  // 徹底停用兩側非展開卡片的游標與 hover 動畫，杜絕死循環抖動
  .card-slot:not(.is-expanded) {
    pointer-events: none !important;

    &:hover {
      transform: none !important;
    }
  }

  .slot-offset-1,
  .slot-offset-1:hover {
    transform: translate(calc(-50% + var(--card-spacing-expanded)), -50%) scale(0.8) !important;
    opacity: 0.12 !important;
  }

  .slot-offset--1,
  .slot-offset--1:hover {
    transform: translate(calc(-50% - var(--card-spacing-expanded)), -50%) scale(0.8) !important;
    opacity: 0.12 !important;
  }
}
</style>
