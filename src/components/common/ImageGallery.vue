<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  fallbackImage: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'Villa Gallery Photo'
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  autoplayInterval: {
    type: Number,
    default: 4500
  },
  showControls: {
    type: Boolean,
    default: true
  },
  showDots: {
    type: Boolean,
    default: true
  },
  showCounter: {
    type: Boolean,
    default: true
  }
})

const currentIndex = ref(0)
let autoplayTimer = null

const photoList = computed(() => {
  if (props.images && props.images.length > 0) {
    return props.images
  }
  if (props.fallbackImage) {
    return [props.fallbackImage]
  }
  return []
})

const nextImage = () => {
  if (photoList.value.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % photoList.value.length
}

const prevImage = () => {
  if (photoList.value.length <= 1) return
  currentIndex.value = (currentIndex.value - 1 + photoList.value.length) % photoList.value.length
}

const setImage = (idx) => {
  currentIndex.value = idx
}

// 支援滑鼠點一下換下一張圖
const handleFrameClick = (event) => {
  if (event.target.closest('.gallery-controls') || event.target.closest('.gallery-dots')) {
    return
  }
  if (photoList.value.length > 1) {
    nextImage()
  }
}

const startAutoplay = () => {
  if (!props.autoplay || photoList.value.length <= 1) return
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    nextImage()
  }, props.autoplayInterval)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})

watch(() => props.autoplay, (val) => {
  if (val) startAutoplay()
  else stopAutoplay()
})
</script>

<template>
  <div 
    class="image-gallery"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <div 
      class="gallery-main-frame"
      :class="{ 'clickable': photoList.length > 1 }"
      @click="handleFrameClick"
    >
      <transition name="gallery-fade">
        <img 
          :key="currentIndex"
          :src="photoList[currentIndex]" 
          :alt="alt"
          class="gallery-photo"
          loading="lazy"
        />
      </transition>
      
      <!-- 輪播箭頭 (若有超過 1 張照片且開啟 showControls) -->
      <div v-if="showControls && photoList.length > 1" class="gallery-controls">
        <button 
          type="button"
          class="gal-btn" 
          @click.stop="prevImage"
          aria-label="Previous photo"
        >
          <ChevronLeft :size="20" />
        </button>
        <button 
          type="button"
          class="gal-btn" 
          @click.stop="nextImage"
          aria-label="Next photo"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- 輪播指示點 (若開啟 showDots) -->
      <div v-if="showDots && photoList.length > 1" class="gallery-dots">
        <button 
          v-for="(_, gIdx) in photoList"
          :key="gIdx"
          type="button"
          class="gallery-dot"
          :class="{ 'active': currentIndex === gIdx }"
          @click.stop="setImage(gIdx)"
          :aria-label="`Go to photo ${gIdx + 1}`"
        ></button>
      </div>

      <!-- 圖片張數計數器 (若開啟 showCounter) -->
      <div v-if="showCounter && photoList.length > 1" class="gallery-counter">
        {{ currentIndex + 1 }} / {{ photoList.length }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.image-gallery {
  width: 100%;
}

.gallery-main-frame {
  position: relative;
  height: 380px;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-card);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  user-select: none;

  &.clickable {
    cursor: pointer;
  }

  @media (min-width: $bp-lg) {
    height: 480px;
  }

  .gallery-photo {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: opacity, transform;
  }
}

.gallery-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 5;

  .gal-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(18, 20, 21, 0.7);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: var(--gold-primary);
      color: #FFFFFF;
      transform: scale(1.08);
    }
  }
}

.gallery-dots {
  position: absolute;
  bottom: 1.15rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.45rem;
  align-items: center;
  z-index: 5;
  background: rgba(18, 20, 21, 0.55);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);

  .gallery-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.85);
    }

    &.active {
      width: 20px;
      border-radius: 10px;
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
  padding: 0.25rem 0.7rem;
  border-radius: 4px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 5;
}

// 圖片切換平滑過渡特效 (Cinematic Cross-fade with gentle scale)
.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.gallery-fade-enter-from {
  opacity: 0;
  transform: scale(1.04);
}

.gallery-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
