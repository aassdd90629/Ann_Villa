<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import rulesData from '../data/rules.json'
import { 
  ShieldCheck, 
  AlertCircle, 
  ChevronDown, 
  Users, 
  HelpCircle 
} from 'lucide-vue-next'

const { isEn } = useI18n()

// FAQ 開合狀態管理
const activeFaqIndexes = ref([0])

const toggleFaq = (index) => {
  const pos = activeFaqIndexes.value.indexOf(index)
  if (pos > -1) {
    activeFaqIndexes.value.splice(pos, 1)
  } else {
    activeFaqIndexes.value.push(index)
  }
}
</script>

<template>
  <div class="rules-page">
    <section class="page-header">
      <div class="container header-container">
        <span class="section-tag">{{ isEn ? 'GUIDELINES & FAQ' : '入住須知與常見問題' }}</span>
        <h1 class="page-title">{{ isEn ? 'Stay Policies & FAQ' : '入住須知、包棟規章與 FAQ' }}</h1>
        <p class="page-desc">
          {{ isEn 
            ? 'Please review our guidelines to ensure a safe, tranquil, and comfortable stay for everyone.' 
            : '為維護每一位住客之安全、隱私與山林清幽環境，請於預約前詳細閱讀以下規範。' 
          }}
        </p>
      </div>
    </section>

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

          <div class="faq-accordion">
            <div 
              v-for="(faq, fIdx) in rulesData.faq" 
              :key="fIdx"
              class="faq-item card-luxury"
              :class="{ 'open': activeFaqIndexes.includes(fIdx) }"
            >
              <button class="faq-question" @click="toggleFaq(fIdx)">
                <span class="q-badge">Q</span>
                <span class="q-text">{{ isEn ? faq.qEn : faq.qZh }}</span>
                <ChevronDown :size="18" class="arrow-icon" />
              </button>

              <transition name="accordion">
                <div v-if="activeFaqIndexes.includes(fIdx)" class="faq-answer">
                  <span class="a-badge">A</span>
                  <p class="a-text">{{ isEn ? faq.aEn : faq.aZh }}</p>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-header {
  padding-top: 8.5rem;
  padding-bottom: 3.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  text-align: center;

  .page-title {
    font-size: clamp(2rem, 4vw, 3rem);
    margin: 0.8rem 0;
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-sub);
  }
}

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

.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  border-radius: 4px;

  .faq-question {
    width: 100%;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-align: left;
    color: var(--text-primary);
    font-size: 1.05rem;
    font-weight: 500;

    .q-badge {
      font-family: $font-display;
      color: var(--gold-primary);
      font-weight: 700;
      font-size: 1.2rem;
    }

    .q-text {
      flex: 1;
    }

    .arrow-icon {
      color: var(--text-muted);
      transition: transform 0.3s ease;
    }
  }

  &.open {
    border-color: var(--gold-primary);

    .arrow-icon {
      transform: rotate(180deg);
      color: var(--gold-primary);
    }
  }

  .faq-answer {
    padding: 0 1.5rem 1.5rem 3.5rem;
    display: flex;
    gap: 0.75rem;

    .a-badge {
      font-family: $font-display;
      font-weight: 700;
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .a-text {
      font-size: 0.93rem;
      line-height: 1.8;
      color: var(--text-sub);
      margin: 0;
    }
  }
}

.accordion-enter-active,
.accordion-leave-active {
  transition: opacity 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
}
</style>
