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

const { isEn } = useI18n()
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
          <h4>{{ isEn ? 'Direct Booking Privileges' : '山語 Villa 官方直訂專屬禮遇' }}</h4>
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
          <h4>{{ isEn ? 'Stay & Check-in Details' : '包棟入住貼心叮嚀' }}</h4>
        </div>
        <ul class="notice-list">
          <li>
            <Clock :size="14" class="sub-icon" />
            <div>
              <strong>{{ isEn ? 'Check-in / Check-out' : '進退房時間' }}：</strong>
              <span>{{ isEn ? 'Check-in from 15:00 / Check-out by 11:00' : '入住 15:00 後 / 退房 11:00 前' }}</span>
            </div>
          </li>
          <li>
            <Coffee :size="14" class="sub-icon" />
            <div>
              <strong>{{ isEn ? 'Welcome Refreshment' : '迎賓禮遇' }}：</strong>
              <span>{{ isEn ? 'Artisan cold-brew tea & handmade local treats' : '全預訂尊享在地精選冷泡茶與產地手工茶點' }}</span>
            </div>
          </li>
          <li>
            <ShieldCheck :size="14" class="sub-icon" />
            <div>
              <strong>{{ isEn ? 'Private Estate' : '獨享隱私' }}：</strong>
              <span>{{ isEn ? 'Complete private access, no other guests on grounds' : '每日僅接待一組貴賓包棟，尊享整座私密莊園' }}</span>
            </div>
          </li>
          <li>
            <Sparkles :size="14" class="sub-icon" />
            <div>
              <strong>{{ isEn ? 'Eco & Amenities' : '設施無拘' }}：</strong>
              <span>{{ isEn ? 'Natural herbal toiletries, high-fidelity acoustics & BBQ lounge' : '全館配置天然草本洗沐備品與戶外景觀休憩座' }}</span>
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
</style>
