<script setup>
import { useI18n } from '../composables/useI18n'
import { useSiteContent } from '../composables/useSiteContent'
import PageHeader from '../components/common/PageHeader.vue'
import Accordion from '../components/common/Accordion.vue'
import { 
  ShieldCheck, 
  AlertCircle, 
  Users 
} from 'lucide-vue-next'

const { isEn, t, tField } = useI18n()
const { rulesInfo: rulesData, faqList, fetchContent } = useSiteContent()
fetchContent()
</script>

<template>
  <div class="rules-page">
    <PageHeader 
      :tag="t('rules.tag')"
      :title="t('rules.title')"
      :desc="t('rules.desc')"
    />

    <section class="section-py rules-content-section">
      <div class="container container-narrow">
        <!-- 1. 入住規章條款 -->
        <div class="rule-block card-luxury">
          <div class="block-title-row">
            <ShieldCheck :size="22" class="title-icon" />
            <h2>{{ t('rules.checkInRulesTitle') }}</h2>
          </div>

          <ul class="rule-list">
            <li v-for="(rule, idx) in (isEn ? rulesData.checkInRulesEn : rulesData.checkInRulesZh)" :key="idx">
              <span class="rule-num">{{ String(idx + 1).padStart(2, '0') }}</span>
              <p>{{ rule }}</p>
            </li>
          </ul>
        </div>

        <!-- 2. 退費規定 -->
        <div class="rule-block card-luxury">
          <div class="block-title-row">
            <AlertCircle :size="22" class="title-icon" />
            <h2>{{ tField(rulesData.refundPolicy, 'title') }}</h2>
          </div>

          <ul class="rule-list refund-list">
            <li v-for="(item, idx) in (isEn ? rulesData.refundPolicyEn?.items : rulesData.refundPolicyZh?.items)" :key="idx">
              <span class="rule-bullet" aria-hidden="true">•</span>
              <p>{{ item }}</p>
            </li>
          </ul>
        </div>

        <!-- 3. 加人加床條款 -->
        <div class="rule-block card-luxury">
          <div class="block-title-row">
            <Users :size="22" class="title-icon" />
            <h2>{{ tField(rulesData.extraGuests, 'title') }}</h2>
          </div>
          <p class="extra-desc">
            {{ tField(rulesData.extraGuests, 'content') }}
          </p>
        </div>

        <!-- 3. 常見問題 FAQ 手風琴 -->
        <div class="faq-section">
          <div class="section-header">
            <span class="section-tag">FAQ</span>
            <h2 class="section-title">{{ t('rules.faqTitle') }}</h2>
          </div>

          <Accordion :items="faqList" />
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;


.rule-block {
  padding: 1.5rem 1.15rem;
  margin-bottom: 1.75rem;

  @media (min-width: $bp-sm) {
    padding: 2.25rem 2rem;
    margin-bottom: 2.5rem;
  }

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

      .rule-num,
      .rule-bullet {
        font-family: $font-display;
        font-weight: 700;
        color: var(--gold-primary);
        font-size: 0.95rem;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .rule-bullet {
        font-size: 1.1rem;
        line-height: 1.45;
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
  margin-top: 2.75rem;

  @media (min-width: $bp-sm) {
    margin-top: 4.5rem;
  }
}


</style>
