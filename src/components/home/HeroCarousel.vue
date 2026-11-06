<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, Play, Pause, Info } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import defaultSlidesData from '../../data/hero-slides.json'

const props = defineProps({
  slides: {
    type: Array,
    default: () => defaultSlidesData
  },
  interval: {
    type: Number,
    default: 6000
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  pauseOnHover: {
    type: Boolean,
    default: true
  },
  showArrows: {
    type: Boolean,
    default: true
  },
  showIndicators: {
    type: Boolean,
    default: true
  },
  showSlideTag: {
    type: Boolean,
    default: true
  }
})

const { isEn } = useI18n()

const currentIndex = ref(0)
const prevIndex = ref(0)
const isPlaying = ref(props.autoplay)
let autoplayTimer = null

// 方案 A：純時間觸發型（字只出現一次，5秒後淡出，隨後開始自動播放後續圖片）
const showContent = ref(true)
const isIntroActive = ref(true)
let introTimer = null
const introDuration = 5000 // 首屏字停留 5 秒供訪客閱讀

const dismissIntro = () => {
  if (!isIntroActive.value && !showContent.value) return
  if (introTimer) {
    clearTimeout(introTimer)
    introTimer = null
  }
  showContent.value = false
  isIntroActive.value = false

  // 文字隱退後，啟動背景自動輪播播放圖片
  if (props.autoplay) {
    startAutoplay()
  }
}

// 支援手動點擊切換文字顯示/純景模式
const toggleContent = () => {
  showContent.value = !showContent.value
  if (showContent.value) {
    stopAutoplay()
  } else {
    if (props.autoplay) {
      startAutoplay()
    }
  }
}

const currentSlide = computed(() => {
  return props.slides[currentIndex.value] || props.slides[0]
})

// 下一張
const nextSlide = () => {
  prevIndex.value = currentIndex.value
  currentIndex.value = (currentIndex.value + 1) % props.slides.length
  resetAutoplay()
}

// 上一張
const prevSlide = () => {
  prevIndex.value = currentIndex.value
  currentIndex.value = (currentIndex.value - 1 + props.slides.length) % props.slides.length
  resetAutoplay()
}

// 指定跳轉
const goToSlide = (index) => {
  if (index === currentIndex.value) return
  prevIndex.value = currentIndex.value
  currentIndex.value = index
  resetAutoplay()
}

// 播放/暫停切換
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

// 自動播放定時器
const startAutoplay = () => {
  stopAutoplay()
  if (!isPlaying.value || props.slides.length <= 1) return
  autoplayTimer = setInterval(() => {
    nextSlide()
  }, props.interval)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const resetAutoplay = () => {
  if (isPlaying.value) {
    startAutoplay()
  }
}

// 滑鼠懸停暫停
const handleMouseEnter = () => {
  if (props.pauseOnHover && isPlaying.value) {
    stopAutoplay()
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover && isPlaying.value) {
    startAutoplay()
  }
}

// 手機觸控滑動手勢支援 (Touch gestures)
const touchStartX = ref(0)
const touchStartY = ref(0)

const handleTouchStart = (e) => {
  if (!e.touches || e.touches.length === 0) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  if (!e.changedTouches || e.changedTouches.length === 0) return
  const deltaX = e.changedTouches[0].clientX - touchStartX.value
  const deltaY = e.changedTouches[0].clientY - touchStartY.value

  // 確保水平滑動幅度大於垂直滾動，避免干擾頁面滑動
  if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      nextSlide()
    } else {
      prevSlide()
    }
  }
}

onMounted(() => {
  // 方案 A 初始階段：先不輪播換圖，讓首張大圖與中央文字平穩停留 5 秒
  stopAutoplay()

  // 5 秒一到，文字優雅淡出留白，並正式啟動圖片自動輪播
  introTimer = setTimeout(() => {
    dismissIntro()
  }, introDuration)
})

onUnmounted(() => {
  stopAutoplay()
  if (introTimer) {
    clearTimeout(introTimer)
    introTimer = null
  }
})

watch(() => props.autoplay, (val) => {
  isPlaying.value = val
  if (val) startAutoplay()
  else stopAutoplay()
})
</script>

<template>
  <div 
    class="hero-carousel" 
    @mouseenter="handleMouseEnter" 
    @mouseleave="handleMouseLeave"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    tabindex="0"
    @keydown.left="prevSlide"
    @keydown.right="nextSlide"
    role="region"
    aria-label="山語 Villa 沉浸景觀輪播"
  >
    <!-- 輪播圖片群組 -->
    <div class="carousel-track">
      <div 
        v-for="(slide, index) in slides" 
        :key="slide.id || index"
        class="carousel-slide"
        :class="{ 'is-active': index === currentIndex, 'is-prev': index === prevIndex }"
        :aria-hidden="index !== currentIndex"
      >
        <img 
          :src="slide.image" 
          :alt="slide.alt || (isEn ? slide.titleEn : slide.titleZh)"
          class="carousel-image"
          :fetchpriority="index === 0 ? 'high' : 'auto'"
          :loading="index === 0 ? 'eager' : 'lazy'"
        />
      </div>
    </div>

    <!-- 沉浸暗色漸變遮罩 (增強文字閱讀舒適度；文字淡出後自動變淡，釋放照片原色通透感) -->
    <div class="carousel-overlay" :class="{ 'is-clear': !showContent }"></div>
    <div class="carousel-bottom-fade"></div>

    <!-- 內容插槽：首屏文字、標題、按鈕與統計資訊 (方案 A：5 秒後優雅淡出留白，開啟純景輪播) -->
    <transition name="hero-content-fade">
      <div v-if="showContent" class="carousel-content-slot">
        <slot></slot>
      </div>
    </transition>

    <!-- 兩側切換箭頭 -->
    <div v-if="showArrows && slides.length > 1" class="carousel-nav-arrows">
      <button 
        type="button" 
        class="carousel-arrow prev" 
        @click="prevSlide"
        :aria-label="isEn ? 'Previous slide' : '上一張景觀'"
      >
        <ChevronLeft :size="24" />
      </button>
      <button 
        type="button" 
        class="carousel-arrow next" 
        @click="nextSlide"
        :aria-label="isEn ? 'Next slide' : '下一張景觀'"
      >
        <ChevronRight :size="24" />
      </button>
    </div>

    <!-- 底部資訊與進度指示器 -->
    <div v-if="showIndicators && slides.length > 1" class="carousel-bottom-bar">
      <!-- 當前景觀標籤 -->
      <div v-if="showSlideTag && currentSlide" class="slide-tag-pill">
        <span class="pulse-dot"></span>
        <span class="slide-tag-text">{{ isEn ? currentSlide.tagEn || currentSlide.titleEn : currentSlide.tagZh || currentSlide.titleZh }}</span>
      </div>

      <!-- 漸進式進度條指示器 -->
      <div class="indicators-container">
        <button
          v-for="(slide, index) in slides"
          :key="'indicator-' + (slide.id || index)"
          type="button"
          class="indicator-item"
          :class="{ 'is-active': index === currentIndex }"
          @click="goToSlide(index)"
          :aria-label="`切換至第 ${index + 1} 張`"
        >
          <span class="indicator-bar">
            <span 
              v-if="index === currentIndex && isPlaying" 
              class="indicator-progress"
              :style="{ animationDuration: `${interval}ms` }"
            ></span>
            <span 
              v-else-if="index === currentIndex && !isPlaying" 
              class="indicator-progress is-paused"
            ></span>
          </span>
        </button>
      </div>

      <!-- 序號計數器、播放控制與資訊切換按鈕 -->
      <div class="carousel-meta-box">
        <!-- 喚回/隱藏首屏資訊按鈕 -->
        <button 
          type="button" 
          class="info-toggle-btn"
          @click="toggleContent"
          :title="showContent ? (isEn ? 'Hide text for panoramic view' : '隱藏文字沉浸賞景') : (isEn ? 'Show estate intro' : '顯示山莊簡介')"
          :aria-label="showContent ? 'Hide estate info' : 'Show estate info'"
        >
          <Info :size="13" />
          <span class="info-toggle-text">{{ showContent ? (isEn ? 'Pure View' : '沉浸純景') : (isEn ? 'Villa Info' : '山莊簡介') }}</span>
        </button>

        <span class="carousel-counter">
          <span class="current">{{ String(currentIndex + 1).padStart(2, '0') }}</span>
          <span class="separator">/</span>
          <span class="total">{{ String(slides.length).padStart(2, '0') }}</span>
        </span>
        <button 
          type="button" 
          class="play-toggle-btn"
          @click="togglePlay"
          :aria-label="isPlaying ? (isEn ? 'Pause' : '暫停輪播') : (isEn ? 'Play' : '播放輪播')"
        >
          <Pause v-if="isPlaying" :size="12" />
          <Play v-else :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hero-carousel {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  outline: none;

  @media (max-width: $bp-md) {
    min-height: 92vh;
  }
}

// 輪播圖片軌道
.carousel-track {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

// 單張 Slide 樣式與過渡淡入淡出
.carousel-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 1.4s ease;
  pointer-events: none;

  &.is-active {
    opacity: 1;
    visibility: visible;
    z-index: 2;
    pointer-events: auto;

    // 啟動 Ken Burns 電影級慢速縮放動態
    .carousel-image {
      animation: kenBurnsLuxury 7.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
  }

  &.is-prev {
    z-index: 1;
  }
}

// 圖片本體
.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  will-change: transform;
}

// Ken Burns 電影級慢速縮放動畫
@keyframes kenBurnsLuxury {
  0% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1.1);
  }
}

// 雙層沉浸暗色漸變遮罩
.carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(18, 20, 21, 0.42) 0%,
    rgba(18, 20, 21, 0.6) 45%,
    rgba(18, 20, 21, 0.86) 100%
  );
  z-index: 2;
  pointer-events: none;
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);

  // 文字隱退後自動淡化遮罩，釋放全景照片的原色通透感
  &.is-clear {
    opacity: 0.38;
  }
}

// 底部過渡平滑銜接下一個區塊
.carousel-bottom-fade {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 220px;
  background: linear-gradient(
    180deg,
    rgba(248, 246, 240, 0) 0%,
    rgba(248, 246, 240, 0.18) 25%,
    rgba(248, 246, 240, 0.65) 60%,
    rgba(248, 246, 240, 0.92) 85%,
    var(--bg-primary) 100%
  );
  z-index: 3;
  pointer-events: none;
  transition: background 0.35s ease;

  @media (max-width: $bp-md) {
    height: 140px;
  }
}

:root[data-theme="dark"] .carousel-bottom-fade {
  background: linear-gradient(
    180deg,
    rgba(18, 20, 21, 0) 0%,
    rgba(18, 20, 21, 0.25) 30%,
    rgba(18, 20, 21, 0.72) 65%,
    var(--bg-primary) 100%
  );
}

// 內容插槽容器
.carousel-content-slot {
  position: relative;
  z-index: 4;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 兩側箭頭按鈕
.carousel-nav-arrows {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 5;
  pointer-events: none;

  @media (max-width: $bp-md) {
    display: none; // 手機端優先使用滑動手勢與底部進度條
  }

  .carousel-arrow {
    pointer-events: auto;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(26, 30, 31, 0.38);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.35s $ease-oriental;

    &:hover {
      background: rgba(26, 30, 31, 0.75);
      border-color: $color-gold-light-primary;
      color: $color-gold-light-highlight;
      transform: scale(1.08);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// 底部進度列與資訊控制區
.carousel-bottom-bar {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(92%, 1100px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  z-index: 5;
  pointer-events: auto;

  @media (max-width: $bp-md) {
    bottom: 1.25rem;
    gap: 0.75rem;
  }
}

// 當前景觀標籤
.slide-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(26, 30, 31, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.4rem 1rem;
  border-radius: 50px;
  color: #FFFFFF;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  white-space: nowrap;

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-gold-light-highlight;
    box-shadow: 0 0 10px $color-gold-light-highlight;
    animation: dotPulse 2s infinite ease-in-out;
  }

  @media (max-width: $bp-md) {
    display: none; // 手機端精簡視覺，避免空間擁擠
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

// 指示進度條
.indicators-container {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  max-width: 480px;

  @media (max-width: $bp-md) {
    gap: 0.4rem;
    max-width: 100%;
  }

  .indicator-item {
    flex: 1;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;

    .indicator-bar {
      position: relative;
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 3px;
      overflow: hidden;
      transition: background 0.3s ease, height 0.3s ease;
    }

    &:hover .indicator-bar {
      background: rgba(255, 255, 255, 0.45);
      height: 4px;
    }

    &.is-active .indicator-bar {
      background: rgba(255, 255, 255, 0.35);
      height: 4px;
    }

    .indicator-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, $color-gold-light-primary, $color-gold-light-highlight);
      border-radius: 3px;
      animation: progressFill linear forwards;

      &.is-paused {
        width: 100%;
        animation: none;
      }
    }
  }
}

@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

// 序號計數與播放控制
.carousel-meta-box {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(26, 30, 31, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.35rem 0.85rem;
  border-radius: 50px;
  color: #FFFFFF;

  .carousel-counter {
    font-family: $font-display;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    .current {
      color: $color-gold-light-highlight;
      font-weight: 600;
    }

    .separator {
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.8rem;
    }

    .total {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .info-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 20px;
    padding: 0.2rem 0.65rem;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.76rem;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: var(--gold-primary);
      color: #FFFFFF;
      border-color: var(--gold-primary);
      transform: translateY(-1px);
    }

    .info-toggle-text {
      letter-spacing: 0.05em;
    }

    @media (max-width: $bp-sm) {
      padding: 0.18rem 0.5rem;
      font-size: 0.72rem;
    }
  }

  .play-toggle-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 2px;
    border-radius: 50%;
    transition: color 0.2s ease, transform 0.2s ease;

    &:hover {
      color: $color-gold-light-highlight;
      transform: scale(1.15);
    }
  }

  @media (max-width: $bp-md) {
    padding: 0.3rem 0.65rem;
    gap: 0.5rem;
    
    .carousel-counter {
      font-size: 0.85rem;
    }
  }
}

// 方案 A：首屏文字平滑退場與進場過渡動畫 (如山嵐微風般輕盈)
.hero-content-fade-enter-active,
.hero-content-fade-leave-active {
  transition: opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1), transform 0.85s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-content-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.hero-content-fade-leave-to {
  opacity: 0;
  transform: translateY(-24px);
}
</style>
