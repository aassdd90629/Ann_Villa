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
      <!-- 平日 10人以下 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">1</span>
          <span>平日 10人以下 (NT$ / 晚)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier1" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <p class="field-note">週一至週四，小家庭/摯友特惠</p>
      </div>

      <!-- 平日 11-14人 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">2</span>
          <span>平日 11-14人以下 (NT$ / 晚)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier2" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <p class="field-note">週一至週四，中型聚會高CP</p>
      </div>

      <!-- 平日 15-18人 -->
      <div class="price-input-group highlight-group">
        <label class="p-label">
          <span class="badge-num">3</span>
          <span>平日 15-18人以下 (NT$ / 晚)</span>
        </label>
        <div class="input-with-unit">
          <span class="currency">NT$</span>
          <input type="number" v-model.number="props.pricing.weekdayTier3" min="1000" step="1000" class="form-control" />
          <span class="unit-tag">含早餐</span>
        </div>
        <p class="field-note">週一至週四，全開滿額包棟</p>
      </div>

      <!-- 一般假日 -->
      <div class="price-input-group weekend-group">
        <label class="p-label">
          <span class="badge-tag-holiday">假日</span>
          <span>一般假日每晚 (週五、六、日)</span>
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
    }
  }

  .field-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0.5rem 0 0;
  }
}
</style>
