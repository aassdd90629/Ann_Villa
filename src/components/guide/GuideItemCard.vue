<script setup>
import { useI18n } from '../../composables/useI18n'
import { MapPin, CircleParking, Info, Clock } from 'lucide-vue-next'

const props = defineProps({
  item: { type: Object, required: true }
})

const { tField } = useI18n()

const fallbackImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'

const handleImageError = (e) => {
  if (e.target.src !== fallbackImg) {
    e.target.src = fallbackImg
  }
}
</script>

<template>
  <div class="guide-card card-luxury">
    <div class="guide-img-box img-zoom-container">
      <img 
        :src="item.image || fallbackImg" 
        :alt="tField(item, 'name')" 
        loading="lazy" 
        @error="handleImageError"
      />
      <!-- 車位標記 -->
      <div v-if="item.parking" class="parking-badge">
        <CircleParking :size="13" />
        <span>附設停車</span>
      </div>
      <!-- 車程標記 (若有) -->
      <div v-if="item.driveTime" class="drive-time-badge">
        <Clock :size="13" />
        <span>{{ tField(item, 'driveTime') }}</span>
      </div>
      <!-- 地點標記 -->
      <div v-if="item.locationZh || item.locationEn" class="location-badge">
        <MapPin :size="12" />
        <span>{{ tField(item, 'location') }}</span>
      </div>
    </div>

    <div class="guide-body">
      <div v-if="item.tagZh || item.tagEn" class="guide-tag">{{ tField(item, 'tag') }}</div>
      <h3 class="guide-name">{{ tField(item, 'name') }}</h3>
      <p class="guide-desc">{{ tField(item, 'desc') }}</p>
      <div v-if="item.noticeZh || item.noticeEn" class="guide-notice">
        <Info :size="14" class="notice-icon" />
        <span>{{ tField(item, 'notice') }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.guide-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  .guide-img-box {
    position: relative;
    height: 220px;

    .drive-time-badge,
    .parking-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(18, 20, 21, 0.8);
      color: #FFFFFF;
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      backdrop-filter: blur(6px);
      z-index: 2;
    }

    .parking-badge {
      background: rgba(46, 125, 50, 0.85);
    }

    .location-badge {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(18, 20, 21, 0.75);
      color: #FFFFFF;
      font-size: 0.72rem;
      padding: 0.2rem 0.55rem;
      border-radius: 3px;
      backdrop-filter: blur(4px);
      z-index: 2;
    }
  }

  .guide-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .guide-tag {
      font-size: 0.75rem;
      color: var(--gold-primary);
      font-weight: 500;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }

    .guide-name {
      font-size: 1.2rem;
      margin-bottom: 0.75rem;
      line-height: 1.35;
    }

    .guide-desc {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.7;
      margin-bottom: 1rem;
      flex: 1;
    }

    .guide-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      padding: 0.65rem 0.85rem;
      background: var(--bg-hover);
      border-radius: 4px;
      border-left: 2px solid var(--gold-primary);
      font-size: 0.8rem;
      color: var(--text-sub);
      line-height: 1.45;

      .notice-icon {
        color: var(--gold-primary);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }
}
</style>
