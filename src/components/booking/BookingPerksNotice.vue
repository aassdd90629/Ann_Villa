<script setup>
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Sparkles 
} from 'lucide-vue-next'

const { isEn, t } = useI18n()
const { channelsInfo } = useSiteContent()
</script>

<template>
  <div class="booking-perks-notice">
    <!-- 上方：官方直訂禮遇與入住叮嚀雙欄 (全寬對稱均分) -->
    <div class="perks-grid">
      <!-- 官方直訂禮遇 -->
      <div class="perks-card">
        <div class="card-head">
          <ShieldCheck :size="16" class="icon-gold" />
          <h4>{{ t('calendar.perks.title') }}</h4>
        </div>
        <ul class="perks-list">
          <li v-for="(perk, idx) in (isEn ? channelsInfo.directBooking.perksEn : channelsInfo.directBooking.perksZh)" :key="idx">
            <CheckCircle2 :size="14" class="check-icon" />
            <span>{{ perk }}</span>
          </li>
        </ul>
      </div>

      <!-- 包棟入住須知與貼心叮嚀 -->
      <div class="notice-card">
        <div class="card-head">
          <Clock :size="16" class="icon-gold" />
          <h4>{{ t('calendar.perks.noticeTitle') }}</h4>
        </div>
        <ul class="notice-list">
          <li>
            <Clock :size="14" class="sub-icon" />
            <div>
              <strong>{{ t('calendar.perks.checkInOutTitle') }}：</strong>
              <span>{{ t('calendar.perks.checkInOutDesc') }}</span>
            </div>
          </li>
          <li>
            <Coffee :size="14" class="sub-icon" />
            <div>
              <strong>{{ t('calendar.perks.welcomeTitle') }}：</strong>
              <span>{{ t('calendar.perks.welcomeDesc') }}</span>
            </div>
          </li>
          <li>
            <ShieldCheck :size="14" class="sub-icon" />
            <div>
              <strong>{{ t('calendar.perks.privateTitle') }}：</strong>
              <span>{{ t('calendar.perks.privateDesc') }}</span>
            </div>
          </li>
          <li>
            <Sparkles :size="14" class="sub-icon" />
            <div>
              <strong>{{ t('calendar.perks.amenitiesTitle') }}：</strong>
              <span>{{ t('calendar.perks.amenitiesDesc') }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.booking-perks-notice {
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.perks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  width: 100%;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem;
  }
}

.perks-card,
.notice-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  .card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--border-color);

    .icon-gold {
      color: var(--gold-primary);
      flex-shrink: 0;
    }

    h4 {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: 0.03em;
    }
  }
}

.perks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--text-sub);

    .check-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--text-sub);

    .sub-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    strong {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}

// 暗黑模式對比度增強
:root[data-theme="dark"] {
  .booking-perks-notice {
    border-top-color: rgba(255, 255, 255, 0.12);
  }

  .perks-card,
  .notice-card {
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.1);

    .card-head {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }
  }

  .perks-list li,
  .notice-list li {
    color: var(--text-sub);

    strong {
      color: var(--text-primary);
    }
  }
}
</style>
