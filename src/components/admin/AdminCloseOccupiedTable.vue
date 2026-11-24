<script setup>
import { ref, computed } from 'vue'
import { Lock, FileText, Calendar, Trash2, Eye } from 'lucide-vue-next'

const props = defineProps({
  bookedRanges: {
    type: Array,
    required: true
  },
  bookings: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['unlock-block', 'open-booking', 'open-external-block'])

const currentFilter = ref('all') // 'all' | 'manual' | 'direct' | 'airbnb'

const manualRanges = computed(() => {
  return props.bookedRanges.filter(r => r.source === 'MANUAL_LOCK')
})

const directRanges = computed(() => {
  return props.bookedRanges.filter(r => r.source === 'DIRECT_BOOKING')
})

const airbnbRanges = computed(() => {
  return props.bookedRanges.filter(r => r.source === 'AIRBNB')
})

const filteredList = computed(() => {
  if (currentFilter.value === 'manual') return manualRanges.value
  if (currentFilter.value === 'direct') return directRanges.value
  if (currentFilter.value === 'airbnb') return airbnbRanges.value
  return props.bookedRanges
})

const calculateNights = (s, e) => {
  if (!s || !e) return 1
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)))
}

const findBookingForRange = (item) => {
  const uid = item.id || item.uid
  return props.bookings.find(b => b.id === uid)
}

const formatOccupiedSummary = (item) => {
  if (item.source === 'MANUAL_LOCK') {
    return item.summary || '管家自主保留'
  }
  if (item.source === 'AIRBNB') {
    const s = String(item.summary || '').trim()
    if (!s || s.toLowerCase() === 'reserved') return '外部旅客預約'
    if (s.includes('Airbnb') || s.includes('Not available')) return 'Airbnb 外部保留'
    return s
  }
  // DIRECT_BOOKING
  const booking = findBookingForRange(item)
  if (booking?.guest_name) {
    return `${booking.guest_name} 貴賓`
  }
  return '官網直訂預約'
}
</script>

<template>
  <div class="table-container">
    <div class="table-bar">
      <div class="bar-title">
        <Lock :size="17" class="text-gold" />
        <span>檔期佔用清單管理</span>
      </div>

      <div class="filter-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
        >
          <Calendar :size="13" />
          <span>全部 ({{ bookedRanges.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentFilter === 'manual' }"
          @click="currentFilter = 'manual'"
        >
          <Lock :size="13" />
          <span>手動關閉 ({{ manualRanges.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentFilter === 'direct' }"
          @click="currentFilter = 'direct'"
        >
          <FileText :size="13" />
          <span>官網直訂 ({{ directRanges.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentFilter === 'airbnb' }"
          @click="currentFilter = 'airbnb'"
        >
          <span class="dot-purple">●</span>
          <span>Airbnb 匯入 ({{ airbnbRanges.length }})</span>
        </button>
      </div>
    </div>

    <div class="table-responsive-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>類型</th>
            <th>起始日期 (入住)</th>
            <th>結束日期 (退房)</th>
            <th>晚數</th>
            <th>對象 / 關閉事由</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredList.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">
              {{ currentFilter === 'manual' ? '目前沒有任何手動關閉的月曆檔期' : (currentFilter === 'direct' ? '目前沒有任何已下訂的訂單' : '目前沒有任何佔用檔期') }}
            </td>
          </tr>
          <tr v-for="item in filteredList" :key="item.id || item.uid">
            <td>
              <span
                class="badge-type"
                :class="{
                  'manual': item.source === 'MANUAL_LOCK',
                  'direct': item.source === 'DIRECT_BOOKING',
                  'airbnb': item.source === 'AIRBNB'
                }"
              >
                {{ item.source === 'MANUAL_LOCK' ? '自主關閉' : (item.source === 'AIRBNB' ? 'Airbnb 匯入' : '官網直訂單') }}
              </span>
            </td>
            <td class="font-mono text-gold-light">{{ item.startDate || item.start_date }}</td>
            <td class="font-mono text-gold-light">{{ item.endDate || item.end_date }}</td>
            <td>
              {{ calculateNights(item.startDate || item.start_date, item.endDate || item.end_date) }} 晚
            </td>
            <td>
              <template v-if="item.source === 'MANUAL_LOCK'">
                <span class="text-muted">{{ formatOccupiedSummary(item) }}</span>
              </template>
              <template v-else-if="item.source === 'AIRBNB'">
                <div class="airbnb-info-inline">
                  <span class="font-bold text-purple">{{ formatOccupiedSummary(item) }}</span>
                  <span class="channel-hint text-xs text-muted">（Airbnb 外部同步）</span>
                </div>
              </template>
              <template v-else>
                <div class="guest-info-inline">
                  <span class="guest-name font-bold">{{ formatOccupiedSummary(item) }}</span>
                  <span v-if="findBookingForRange(item)?.guest_phone" class="guest-phone text-xs text-muted">
                    {{ findBookingForRange(item).guest_phone }}
                  </span>
                </div>
              </template>
            </td>
            <td>
              <button
                v-if="item.source === 'MANUAL_LOCK'"
                class="btn-action-unlock"
                @click="emit('unlock-block', item)"
                title="解除關閉重新開放"
              >
                <Trash2 :size="14" />
                <span>解除關閉 (開放)</span>
              </button>
              <button
                v-else-if="item.source === 'AIRBNB'"
                class="btn-action-airbnb"
                @click="emit('open-external-block', item)"
                title="點擊查看或解除此外部佔用檔期"
              >
                <Eye :size="14" />
                <span>查看 / 解除開放</span>
              </button>
              <button
                v-else
                class="btn-action-booking"
                @click="emit('open-booking', item)"
                title="點擊查看、修改或取消此訂單"
              >
                <Eye :size="14" />
                <span>查看 / 取消修改</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.table-container {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: background-color 0.3s ease, border-color 0.3s ease;

  .table-bar {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;

    .bar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--admin-text-main, #1A1E1F);
      font-size: 0.95rem;

      .text-gold {
        color: var(--gold-dark, #91754F);
      }
    }

    .filter-tabs {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--admin-bg-base, #F5F3EC);
      padding: 0.25rem;
      border-radius: 6px;
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.7rem;
        border: none;
        background: transparent;
        color: var(--admin-text-sub, #475569);
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: var(--admin-text-main, #1A1E1F);
        }

        &.active {
          background: var(--admin-bg-card, #FFFFFF);
          color: var(--gold-dark, #91754F);
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}

.table-responsive-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  th {
    background: var(--admin-bg-base, #F5F3EC);
    padding: 0.85rem 1rem;
    color: var(--admin-text-sub, #475569);
    font-weight: 600;
    font-size: 0.82rem;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
    white-space: nowrap;
  }

  td {
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.15));
    color: var(--admin-text-main, #1A1E1F);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: rgba(197, 168, 128, 0.04);
  }
}

.badge-type {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  &.manual {
    background: rgba(197, 168, 128, 0.18);
    color: var(--gold-dark, #91754F);
    border: 1px solid rgba(197, 168, 128, 0.35);
  }

  &.direct {
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  &.airbnb {
    background: rgba(168, 85, 247, 0.12);
    color: #7e22ce;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }
}

.text-purple {
  color: #7e22ce;
}

.dot-purple {
  color: #7e22ce;
  font-size: 0.75rem;
}

.airbnb-info-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  .channel-hint { color: var(--admin-text-muted, #64748b); }
}

.btn-action-unlock,
.btn-action-airbnb,
.btn-action-booking {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-unlock {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #b91c1c;
  &:hover { background: #b91c1c; color: #FFFFFF; }
}

.btn-action-airbnb {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #7e22ce;
  &:hover { background: #7e22ce; color: #FFFFFF; }
}

.btn-action-booking {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #1d4ed8;
  &:hover { background: #1d4ed8; color: #FFFFFF; }
}
</style>
