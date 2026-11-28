<script setup>
import { useI18n } from '../../composables/useI18n'
import { Car, Train, MapPin, Compass, ExternalLink } from 'lucide-vue-next'

const props = defineProps({
  transportation: { type: Object, default: () => ({}) },
  siteData: { type: Object, default: () => ({}) }
})

const { isEn, t, tField } = useI18n()
</script>

<template>
  <div class="transport-grid">
    <!-- 自駕與衛星導航 -->
    <div class="trans-card card-luxury">
      <div class="trans-header">
        <Car :size="24" class="trans-icon" />
        <h2>{{ t('guide.byCarTitle') }}</h2>
      </div>
      <ul class="trans-list">
        <li v-for="(route, rIdx) in (isEn ? transportation.byCarEn : transportation.byCarZh)" :key="rIdx">
          <span>{{ route }}</span>
        </li>
      </ul>
      <div class="trans-action">
        <a :href="siteData.googleMapUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold">
          <MapPin :size="16" />
          <span>{{ t('guide.openGoogleMaps') }}</span>
          <ExternalLink :size="14" />
        </a>
      </div>
    </div>

    <!-- 高鐵抵達與接駁建議 -->
    <div class="trans-card card-luxury">
      <div class="trans-header">
        <Train :size="24" class="trans-icon" />
        <h2>{{ t('guide.publicTransTitle') }}</h2>
      </div>
      <p class="trans-desc">
        {{ tField(transportation, 'byPublic') }}
      </p>
      <div class="shuttle-note">
        <Compass :size="16" />
        <span>{{ t('guide.shuttleNote') }}</span>
      </div>
      <div class="address-box">
        <MapPin :size="16" class="addr-icon" />
        <div>
          <span class="addr-label">{{ t('guide.addressLabel') }}</span>
          <p class="addr-text">{{ tField(siteData, 'address') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.transport-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 4rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.trans-card {
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;

  .trans-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);

    .trans-icon { color: var(--gold-primary); }
    h2 { font-size: 1.25rem; margin: 0; }
  }

  .trans-list {
    list-style: disc;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 2rem;
    flex: 1;

    li {
      font-size: 0.93rem;
      color: var(--text-sub);
      line-height: 1.75;
    }
  }

  .trans-desc {
    font-size: 0.95rem;
    line-height: 1.85;
    color: var(--text-sub);
    margin-bottom: 1.25rem;
    flex: 1;
  }

  .shuttle-note {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--gold-primary);
    background: var(--badge-bg);
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    align-self: flex-start;
  }

  .address-box {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-hover);
    border-radius: 4px;
    border-left: 3px solid var(--gold-primary);
    margin-bottom: 1.5rem;

    .addr-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .addr-label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .addr-text {
      font-size: 0.88rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }
  }

  .trans-action { margin-top: auto; }
}
</style>
