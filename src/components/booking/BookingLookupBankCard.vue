<script setup>
import { ref, computed } from 'vue'
import { CreditCard, Copy, Check, CheckCircle2, Send, MessageCircle } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import { buildLineUrl } from '../../utils/lineUrl'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-report'])

const { t } = useI18n()
const { basicInfo, formattedBankInfo } = useSiteContent()
const copiedAccount = ref(false)

const copyBankDetails = async () => {
  try {
    await navigator.clipboard.writeText(formattedBankInfo.value)
    copiedAccount.value = true
    setTimeout(() => { copiedAccount.value = false }, 2000)
  } catch (err) {}
}

const lineHelpUrl = computed(() => {
  const msg = `您好，我想確認訂單狀態：\n【訂單編號】：${props.booking.id}\n【訂房人】：${props.booking.guest_name}\n【入住日期】：${props.booking.check_in} 至 ${props.booking.check_out}\n【應付定金】：NT$ ${Number(props.booking.deposit_amount).toLocaleString()}`
  return buildLineUrl({ lineId: basicInfo.value.lineUrl || basicInfo.value.lineId, text: msg })
})
</script>

<template>
  <div class="bank-action-container">
    <!-- 銀行匯款資訊與一鍵複製 -->
    <div class="bank-info-box">
      <div class="bank-header">
        <CreditCard :size="16" class="text-gold" />
        <span class="font-bold">{{ t('lookup.bank.title') }}</span>
      </div>
      <p class="bank-desc">
        {{ formattedBankInfo }}
      </p>
      <button class="btn btn-outline-gold btn-sm mt-1" @click="copyBankDetails">
        <Check v-if="copiedAccount" :size="14" />
        <Copy v-else :size="14" />
        <span>{{ copiedAccount ? t('lookup.bank.copied') : t('lookup.bank.copyBtn') }}</span>
      </button>
    </div>

    <!-- 末五碼回報狀態與操作按鈕 -->
    <div class="report-status-box">
      <div v-if="booking.bank_last_5" class="reported-alert">
        <CheckCircle2 :size="17" class="text-green" />
        <div class="reported-text">
          <p class="reported-title">
            {{ t('lookup.bank.reportedPrefix') }}
            <strong class="font-mono text-gold">{{ booking.bank_last_5 }}</strong>
          </p>
          <p class="reported-time">
            {{ t('lookup.bank.reportedAt') }}{{ booking.payment_reported_at || '近日' }}{{ t('lookup.bank.verifyingNotice') }}
          </p>
        </div>
        <button class="btn btn-sm btn-outline ml-auto" @click="emit('open-report', booking)">
          {{ t('lookup.bank.modify') }}
        </button>
      </div>

      <div v-else class="unreported-actions">
        <button class="btn btn-gold btn-block" @click="emit('open-report', booking)">
          <Send :size="16" />
          <span>{{ t('lookup.bank.reportBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- LINE 輔助按鈕 -->
    <div class="line-fallback-wrap">
      <a 
        :href="lineHelpUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="line-link"
      >
        <MessageCircle :size="15" />
        <span>{{ t('lookup.bank.butlerHelp') }}</span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.bank-info-box {
  background-color: var(--bg-body);
  border: 1px dashed var(--border-gold-subtle);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;

  .bank-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.92rem;
    color: var(--text-primary);
    margin-bottom: 0.4rem;
  }

  .bank-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }
}

.report-status-box {
  margin-bottom: 1rem;

  .reported-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-radius: 8px;
    background-color: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);

    .reported-title {
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .reported-time {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
  }
}

.line-fallback-wrap {
  text-align: center;
  padding-top: 0.5rem;

  .line-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    transition: color 0.2s ease;

    &:hover {
      color: var(--gold-primary);
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;

  &.btn-sm {
    padding: 0.45rem 0.85rem;
    font-size: 0.82rem;
  }

  &.btn-gold {
    background-color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    color: #121212;
    font-weight: 600;

    &:hover {
      background-color: var(--gold-hover);
    }
  }

  &.btn-outline-gold {
    background: transparent;
    border: 1px solid var(--gold-primary);
    color: var(--gold-primary);

    &:hover {
      background-color: rgba(212, 175, 55, 0.1);
    }
  }

  &.btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);

    &:hover {
      border-color: var(--text-primary);
      color: var(--text-primary);
    }
  }

  &.btn-block {
    width: 100%;
  }
}
</style>
