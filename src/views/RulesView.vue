<script setup>
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import Accordion from '../components/common/Accordion.vue'
import rulesData from '../data/rules.json'
import { 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  HelpCircle 
} from 'lucide-vue-next'

const { isEn } = useI18n()
</script>

<template>
  <div class="rules-page">
    <PageHeader 
      :tag="isEn ? 'GUIDELINES & FAQ' : '入住須知與常見問題'"
      :title="isEn ? 'Stay Policies & FAQ' : '入住須知、包棟規章與 FAQ'"
      :desc="isEn 
        ? 'Please review our guidelines to ensure a safe, tranquil, and comfortable stay for everyone.' 
        : '為維護每一位住客之安全、隱私與山林清幽環境，請於預約前詳細閱讀以下規範。'"
    />

    <section class="section-py rules-content-section">
      <div class="container container-narrow">
        <!-- 1. 入住規章條款 -->
        <div class="rule-block card-luxury">
          <div class="block-title-row">
            <ShieldCheck :size="22" class="title-icon" />
            <h2>{{ isEn ? 'Check-in & Estate Rules' : '包棟入住規範與注意事項' }}</h2>
          </div>

          <ul class="rule-list">
            <li v-for="(rule, idx) in (isEn ? rulesData.checkInRulesEn : rulesData.checkInRulesZh)" :key="idx">
              <span class="rule-num">0{{ idx + 1 }}</span>
              <p>{{ rule }}</p>
            </li>
          </ul>
        </div>

        <!-- 2. 加人加床條款 -->
        <div class="rule-block card-luxury">
          <div class="block-title-row">
            <Users :size="22" class="title-icon" />
            <h2>{{ isEn ? rulesData.extraGuestsEn.title : rulesData.extraGuestsZh.title }}</h2>
          </div>
          <p class="extra-desc">
            {{ isEn ? rulesData.extraGuestsEn.content : rulesData.extraGuestsZh.content }}
          </p>
        </div>

        <!-- 3. 常見問題 FAQ 手風琴 -->
        <div class="faq-section">
          <div class="section-header">
            <span class="section-tag">FAQ</span>
            <h2 class="section-title">{{ isEn ? 'Frequently Asked Questions' : '常見問題與解答' }}</h2>
          </div>

          <Accordion :items="rulesData.faq" />
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;


.rule-block {
  padding: 2.25rem 2rem;
  margin-bottom: 2.5rem;

  .block-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);

    .title-icon {
      color: var(--gold-primary);
    }

    h2 {
      font-size: 1.35rem;
      margin: 0;
    }
  }

  .rule-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;

      .rule-num {
        font-family: $font-display;
        font-weight: 700;
        color: var(--gold-primary);
        font-size: 0.95rem;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        font-size: 0.95rem;
        color: var(--text-sub);
        line-height: 1.8;
        margin: 0;
      }
    }
  }

  .extra-desc {
    font-size: 0.95rem;
    line-height: 1.85;
    color: var(--text-sub);
    margin: 0;
  }
}

.faq-section {
  margin-top: 4.5rem;
}


</style>
