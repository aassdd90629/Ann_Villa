<script setup>
import { Sparkles } from 'lucide-vue-next'

const props = defineProps({
  pricing: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="pricing-card">
    <div class="card-head-row">
      <div class="head-title">
        <Sparkles :size="20" class="text-gold" />
        <h3>全區包棟基礎定價政策 (含早餐)</h3>
      </div>
      <span class="policy-tag">平日週一~四・一般假日週五~日</span>
    </div>

    <div class="pricing-grid-cols">
      <!-- 平日階梯一 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">1</span>
          <span>平日階梯一 (1~{{ props.pricing.weekdayTier1MaxGuests || 10 }}人)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier1" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <div class="tier-guests-setting">
          <span class="sub-lbl">人數門檻上限：</span>
          <div class="guest-input-wrap">
            <input type="number" v-model.number="props.pricing.weekdayTier1MaxGuests" min="1" :max="(props.pricing.weekdayTier2MaxGuests || 14) - 1" class="guest-num-input" />
            <span class="unit">位</span>
          </div>
        </div>
        <p class="field-note">週一至週四，小家庭/摯友特惠</p>
      </div>

      <!-- 平日階梯二 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">2</span>
          <span>平日階梯二 ({{ (props.pricing.weekdayTier1MaxGuests || 10) + 1 }}~{{ props.pricing.weekdayTier2MaxGuests || 14 }}人)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier2" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <div class="tier-guests-setting">
          <span class="sub-lbl">人數門檻上限：</span>
          <div class="guest-input-wrap">
            <input type="number" v-model.number="props.pricing.weekdayTier2MaxGuests" :min="(props.pricing.weekdayTier1MaxGuests || 10) + 1" :max="(props.pricing.maxCapacity || 18) - 1" class="guest-num-input" />
            <span class="unit">位</span>
          </div>
        </div>
        <p class="field-note">週一至週四，中型聚會高CP</p>
      </div>

      <!-- 平日階梯三 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">3</span>
          <span>平日階梯三 ({{ (props.pricing.weekdayTier2MaxGuests || 14) + 1 }}~{{ props.pricing.maxCapacity || 18 }}人)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier3" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <div class="tier-guests-setting readonly-info">
          <span class="sub-lbl">階梯範圍：</span>
          <span class="val-txt">至全區上限 ({{ props.pricing.maxCapacity || 18 }} 位)</span>
        </div>
        <p class="field-note">週一至週四，全開滿額包棟</p>
      </div>

      <!-- 全區最高容納人數 -->
      <div class="price-input-group capacity-group">
        <label class="p-label">
          <span class="badge-tag-capacity">上限</span>
          <span>全區最高容納人數</span>
        </label>
        <div class="input-with-unit">
          <input type="number" v-model.number="props.pricing.maxCapacity" :min="(props.pricing.weekdayTier2MaxGuests || 14) + 1" max="50" class="form-control text-center" />
          <span class="unit-tag gold-tag">位貴賓</span>
        </div>
        <p class="field-note">全棟人數上限，超過將自動阻擋防呆</p>
      </div>

      <!-- 一般假日 -->
      <div class="price-input-group weekend-group">
        <label class="p-label">
          <span class="badge-tag-holiday">假日</span>
          <span>一般假日每晚 (週五~日)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekend" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <p class="field-note">週五晚上起算（含週五、六、日）</p>
      </div>

      <!-- 現場押金 -->
      <div class="price-input-group">
        <label class="p-label">
          <span>現場入住押金 (保證金)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.deposit" min="0" step="500" class="form-control" />
          <span class="unit-tag">退房退還</span>
        </div>
        <p class="field-note">入住現場收取，退房無損全退</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.pricing-card {
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  transform: none !important;

  &:hover {
    transform: none !important;
  }

  .card-head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    .head-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      h3 {
        font-size: 1.2rem;
        margin: 0;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .policy-tag {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      background: var(--badge-bg);
      color: var(--gold-primary);
      font-weight: 600;
    }
  }
}

.pricing-grid-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);

  &.highlight-group {
    border-color: rgba(200, 169, 110, 0.3);
  }

  &.weekend-group {
    border-color: rgba(200, 169, 110, 0.6);
    background: rgba(200, 169, 110, 0.05);
  }

  &.capacity-group {
    border-color: rgba(200, 169, 110, 0.5);
    background: rgba(200, 169, 110, 0.04);
  }

  .p-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-sub);
    margin-bottom: 0.65rem;

    .badge-num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--gold-primary);
      color: #121614;
      font-size: 0.7rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .badge-tag-holiday {
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      background: var(--gold-primary);
      color: #121614;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .badge-tag-capacity {
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      background: rgba(200, 169, 110, 0.2);
      color: var(--gold-primary);
      font-size: 0.7rem;
      font-weight: 700;
      border: 1px solid var(--gold-primary);
    }
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;

    .currency {
      font-size: 0.82rem;
      color: var(--gold-primary);
      font-weight: 700;
    }

    input {
      border: none;
      background: transparent;
      padding: 0.35rem 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      width: 100%;

      &:focus {
        outline: none;
      }
    }

    .unit-tag {
      font-size: 0.72rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      background: rgba(200, 169, 110, 0.15);
      color: var(--gold-primary);
      white-space: nowrap;

      &.gold-tag {
        background: var(--gold-primary);
        color: #121614;
        font-weight: 700;
      }
    }
  }

  .tier-guests-setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding: 0.35rem 0.6rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
    border: 1px dashed var(--border-color);

    .sub-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .guest-input-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      .guest-num-input {
        width: 48px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 3px;
        padding: 0.15rem 0.3rem;
        font-size: 0.85rem;
        font-weight: 700;
        text-align: center;
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--gold-primary);
        }
      }

      .unit {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    &.readonly-info {
      .val-txt {
        font-size: 0.75rem;
        color: var(--gold-primary);
        font-weight: 600;
      }
    }
  }

  .field-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0.5rem 0 0;
  }
}

@media (max-width: 640px) {
  .pricing-card {
    padding: 1.25rem 1rem;

    .card-head-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }

  .pricing-grid-cols {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
}
</style>
