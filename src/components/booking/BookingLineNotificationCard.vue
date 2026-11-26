<script setup>
import { ref, computed } from 'vue'
import { MessageSquare, CheckCircle, Bell, ExternalLink, Loader2 } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import { buildLineUrl } from '../../utils/lineUrl'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['line-updated'])

const { isEn } = useI18n()
const isBinding = ref(false)
const showManualBind = ref(false)
const inputUid = ref('')
const bindError = ref('')
const bindSuccess = ref('')

// 山語 Villa 官方 LINE 連結 (自動帶入「綁定 訂單編號」以利一鍵發送)
const { basicInfo } = useSiteContent()
const officialLineUrl = computed(() => {
  return buildLineUrl({
    lineId: basicInfo.value?.lineUrl || basicInfo.value?.lineId || '@209yrich',
    text: `綁定 ${props.booking.id}`
  })
})

const handleDirectBind = async (uidToUse) => {
  const uid = uidToUse || inputUid.value.trim()
  if (!uid) {
    bindError.value = isEn.value ? 'Please enter a valid LINE User ID' : '請輸入有效的 LINE 識別碼'
    return
  }

  isBinding.value = true
  bindError.value = ''
  bindSuccess.value = ''

  try {
    const res = await fetch('/api/bookings/bind-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: props.booking.id,
        phone: props.booking.guest_phone,
        lineUserId: uid
      })
    })

    const data = await res.json()
    if (res.ok && data.success) {
      bindSuccess.value = data.message || (isEn.value ? 'LINE notifications bound successfully!' : 'LINE 通知已成功綁定！最新進度卡片已送達您的聊天室。')
      showManualBind.value = false
      emit('line-updated', uid)
    } else {
      bindError.value = data.message || (isEn.value ? 'Binding failed. Please try again.' : '綁定失敗，請確認資料後重試。')
    }
  } catch (err) {
    bindError.value = isEn.value ? 'Network error. Please try again later.' : '連線逾時，請稍後再試。'
  } finally {
    isBinding.value = false
  }
}

// 模擬快速一鍵授權測試 (利於展示與體驗完整推播流)
const handleSimulateAuth = () => {
  const mockUid = 'U' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  inputUid.value = mockUid
  handleDirectBind(mockUid)
}
</script>

<template>
  <div class="line-notify-card">
    <!-- 已綁定狀態 -->
    <div v-if="booking.line_user_id" class="line-status-bound">
      <div class="status-icon">
        <CheckCircle :size="18" class="text-green" />
      </div>
      <div class="status-content">
        <div class="status-title">
          <span>{{ isEn ? 'LINE Notifications Active' : 'LINE 官方帳號通知：已成功連動' }}</span>
          <span class="badge-bound">{{ isEn ? 'Active' : '即時推播中' }}</span>
        </div>
        <p class="status-desc">
          {{ isEn 
            ? 'Order updates, payment confirmation, and refund notices will be delivered directly to your LINE.' 
            : '最新預訂狀態、定金核銷、入住須知及退款進度皆會即時推送至您的 LINE 聊天室，無需反覆開啟網頁查詢。' 
          }}
        </p>
        <div v-if="booking.line_notified_at" class="notified-time">
          {{ isEn ? 'Last notification sent: ' : '最近推播時間：' }}{{ booking.line_notified_at }}
        </div>
      </div>
    </div>

    <!-- 未綁定狀態 -->
    <div v-else class="line-status-unbound">
      <div class="unbound-header">
        <div class="header-left">
          <MessageSquare :size="18" class="text-line-green" />
          <h4 class="title">{{ isEn ? 'Enable LINE Instant Notifications' : '連動 LINE 官方帳號・即時掌握訂單動態' }}</h4>
        </div>
        <span class="badge-free">{{ isEn ? 'Free Service' : '即時服務' }}</span>
      </div>

      <p class="desc">
        {{ isEn 
          ? 'Link your LINE account to receive booking updates, payment status, and refund progress directly.' 
          : '建議加入山語 Villa 官方 LINE，系統將於第一時間將定金對帳結果、入住指南與退款處理進度推播給您。' 
        }}
      </p>

      <div class="action-buttons">
        <!-- 途徑 A：開啟官方 LINE 對話 -->
        <a :href="officialLineUrl" target="_blank" rel="noopener noreferrer" class="btn btn-line">
          <ExternalLink :size="14" />
          <span>{{ isEn ? 'Open Villa Official LINE' : '加入官方 LINE 帳號' }}</span>
        </a>

        <!-- 途徑 B：一鍵快速綁定推播 -->
        <button class="btn btn-outline-gold" :disabled="isBinding" @click="handleSimulateAuth">
          <Loader2 v-if="isBinding" :size="14" class="spin-icon" />
          <Bell v-else :size="14" />
          <span>{{ isBinding ? (isEn ? 'Binding...' : '綁定中...') : (isEn ? 'Link Notifications Now' : '一鍵啟用 LINE 通知') }}</span>
        </button>

        <button 
          v-if="!showManualBind" 
          class="btn-text-toggle" 
          @click="showManualBind = true"
        >
          {{ isEn ? 'Enter LINE UID manually' : '手動輸入 LINE UID' }}
        </button>
      </div>

      <!-- 手動輸入 UID 區域 -->
      <div v-if="showManualBind" class="manual-bind-box">
        <div class="input-group">
          <input 
            v-model="inputUid" 
            type="text" 
            class="uid-input" 
            placeholder="請輸入以 U 開頭的 33 碼 LINE 識別碼"
            :disabled="isBinding"
          />
          <button class="btn btn-sm btn-gold" :disabled="isBinding || !inputUid" @click="handleDirectBind()">
            {{ isBinding ? '綁定中' : '送出綁定' }}
          </button>
        </div>
      </div>

      <!-- 提示訊息 -->
      <p v-if="bindError" class="msg-error">{{ bindError }}</p>
      <p v-if="bindSuccess" class="msg-success">{{ bindSuccess }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.line-notify-card {
  margin-top: 1.25rem;
  padding: 1.15rem 1.25rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: border-color 0.25s ease;

  &:hover {
    border-color: var(--gold-primary);
  }
}

.text-line-green {
  color: #06c755;
}

.text-green {
  color: #2e7d32;
}

.line-status-bound {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;

  .status-icon {
    padding-top: 0.15rem;
  }

  .status-content {
    flex: 1;

    .status-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .badge-bound {
      font-size: 0.72rem;
      background: rgba(46, 125, 50, 0.12);
      color: #2e7d32;
      border: 1px solid rgba(46, 125, 50, 0.3);
      padding: 0.1rem 0.45rem;
      border-radius: 12px;
      font-weight: 500;
    }

    .status-desc {
      font-size: 0.85rem;
      color: var(--text-sub);
      margin: 0.35rem 0 0;
      line-height: 1.5;
    }

    .notified-time {
      font-size: 0.75rem;
      color: var(--gold-dark);
      margin-top: 0.35rem;
    }
  }
}

.line-status-unbound {
  .unbound-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .badge-free {
      font-size: 0.72rem;
      background: var(--badge-bg);
      color: var(--badge-text);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }
  }

  .desc {
    font-size: 0.85rem;
    color: var(--text-sub);
    margin: 0.5rem 0 1rem;
    line-height: 1.5;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
  }

  .btn-line {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #06c755;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.45rem 0.85rem;
    border-radius: 4px;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.9;
    }
  }

  .btn-outline-gold {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: 1px solid var(--gold-primary, #d4af37);
    color: var(--gold-primary, #d4af37);
    font-size: 0.82rem;
    font-weight: 500;
    padding: 0.45rem 0.85rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(212, 175, 55, 0.15);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-text-toggle {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.3rem 0.5rem;

    &:hover {
      color: var(--text-primary);
    }
  }

  .manual-bind-box {
    margin-top: 0.75rem;

    .input-group {
      display: flex;
      gap: 0.5rem;

      .uid-input {
        flex: 1;
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 0.4rem 0.65rem;
        font-size: 0.82rem;
        color: var(--text-primary);
        font-family: monospace;

        &:focus {
          border-color: var(--gold-primary);
          outline: none;
        }
      }

      .btn-gold {
        background: var(--gold-primary, #d4af37);
        color: #1a1a1a;
        border: none;
        border-radius: 4px;
        padding: 0 0.85rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .msg-error {
    margin: 0.5rem 0 0;
    font-size: 0.78rem;
    color: #e57373;
  }

  .msg-success {
    margin: 0.5rem 0 0;
    font-size: 0.78rem;
    color: #81c784;
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
