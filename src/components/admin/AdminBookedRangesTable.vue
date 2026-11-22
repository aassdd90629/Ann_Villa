<script setup>
import { Calendar, RefreshCw, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  ranges: {
    type: Array,
    required: true
  },
  totalCount: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'delete'])

const isAirbnb = (range) => range.source && range.source.toUpperCase() === 'AIRBNB'

const isAirbnbReserved = (range) => {
  return isAirbnb(range) && (range.type === 'reserved' || (range.summary && range.summary.toLowerCase().includes('reserved')))
}

const getSourceBadgeText = (range) => {
  if (isAirbnb(range)) {
    return isAirbnbReserved(range) ? 'Airbnb 旅客預約' : 'Airbnb 手動關閉'
  }
  if (range.source === 'DIRECT_BOOKING') return '官網直訂單'
  return '管家手動鎖房'
}

const getSourceBadgeClass = (range) => {
  if (isAirbnb(range)) {
    return isAirbnbReserved(range) ? 'airbnb-reserved' : 'airbnb-manual'
  }
  if (range.source === 'MANUAL_LOCK') return 'manual'
  if (range.source === 'DIRECT_BOOKING') return 'direct'
  return ''
}

const getSummaryText = (range) => {
  if (isAirbnb(range)) {
    return isAirbnbReserved(range) ? 'Airbnb 旅客成單' : 'Airbnb 房態關閉'
  }
  return range.summary || '已保留'
}
</script>

<template>
  <div class="table-container">
    <div class="table-header-title">
      <div class="left-info">
        <Calendar :size="18" class="text-gold" />
        <span>現有佔用檔期 (共 {{ totalCount }} 筆)</span>
        <span class="scroll-hint-text">↔ 可左右滑動</span>
      </div>
      <button class="btn-refresh-sm" @click="emit('refresh')" :disabled="isLoading">
        <RefreshCw :size="13" :class="{ 'spin-anim': isLoading }" />
        <span>重新整理</span>
      </button>
    </div>

    <div class="table-responsive-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>來源管道</th>
            <th>入住日期</th>
            <th>退房日期</th>
            <th>晚數</th>
            <th>鎖定事由 / 說明</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center py-4">正在自 Cloudflare D1 載入最新檔期...</td>
          </tr>
          <tr v-else-if="ranges.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">目前暫無任何鎖定檔期</td>
          </tr>
          <tr v-for="(range, idx) in ranges" :key="idx">
            <td>
              <span 
                class="source-badge" 
                :class="getSourceBadgeClass(range)"
              >
                {{ getSourceBadgeText(range) }}
              </span>
            </td>
            <td class="font-mono text-gold-light">{{ range.startDate }}</td>
            <td class="font-mono text-gold-light">{{ range.endDate }}</td>
            <td>
              {{ Math.max(1, Math.round((new Date(range.endDate) - new Date(range.startDate)) / (1000 * 60 * 60 * 24))) }} 晚
            </td>
            <td class="text-muted">{{ getSummaryText(range) }}</td>
            <td>
              <button 
                v-if="range.source === 'MANUAL_LOCK'"
                class="btn-delete" 
                @click="emit('delete', range)"
                title="解除手動鎖定"
              >
                <Trash2 :size="15" />
                <span>解除</span>
              </button>
              <span v-else class="text-dim text-xs">
                {{ isAirbnb(range) ? (isAirbnbReserved(range) ? '外部成單' : '手動關閉') : '正式訂單' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁插槽 -->
    <slot name="pagination" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.table-container {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease;

  .table-header-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));

    .left-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--admin-text-main, #f1f5f9);
      font-size: 0.95rem;

      .text-gold { color: var(--gold-primary, #d4af37); }

      .scroll-hint-text {
        display: none;
        font-size: 0.72rem;
        color: var(--gold-primary, #d4af37);
        background: rgba(212, 175, 55, 0.12);
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
      }
    }

    .btn-refresh-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--admin-btn-secondary-bg, transparent);
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.15));
      color: var(--admin-text-main, #94a3b8);
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { 
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }
    }
  }
}

.table-responsive-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--admin-border, rgba(212, 175, 55, 0.3));
    border-radius: 3px;
  }
}

.admin-table {
  width: 100%;
  min-width: 660px;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.85rem;

  th {
    padding: 0.85rem 1.25rem;
    background: var(--admin-th-bg, rgba(0, 0, 0, 0.2));
    color: var(--admin-text-sub, #94a3b8);
    font-weight: 500;
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  }

  td {
    padding: 0.9rem 1.25rem;
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.05));
    color: var(--admin-text-main, #e2e8f0);
  }

  tr:hover td {
    background: var(--admin-tr-hover, rgba(255, 255, 255, 0.02));
  }

  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .text-gold-light { color: var(--gold-primary, #f3e5ab); font-weight: 600; }
  .text-muted { color: var(--admin-text-muted, #94a3b8); }
  .text-dim { color: var(--admin-text-muted, #64748b); }
  .text-xs { font-size: 0.75rem; }

  .source-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.22rem 0.6rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;

    &.airbnb-reserved {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }
    &.airbnb-manual {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.35);
    }
    &.manual {
      background: rgba(234, 179, 8, 0.15);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    &.direct {
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold-light, #f3e5ab);
      border: 1px solid rgba(212, 175, 55, 0.35);
    }
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    margin: 0 auto;
    &:hover { background: rgba(239, 68, 68, 0.2); }
  }
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .table-container .table-header-title {
    padding: 0.75rem 1rem;

    .left-info .scroll-hint-text {
      display: inline-block;
    }
  }
}
</style>
