<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1
  },
  totalPages: {
    type: Number,
    required: true,
    default: 1
  },
  totalItems: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  startIndex: {
    type: Number,
    default: 0
  },
  endIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:currentPage', 'page-change'])

const changePage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('page-change', page)
}

// 智慧計算顯示的頁碼陣列（最多顯示 7 個格位，超長自動插入 '...'）
const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, '...', current - 1, current, current + 1, '...', total]
})
</script>

<template>
  <div v-if="totalItems > 0" class="common-pagination-bar">
    <!-- 左側：數據範圍統計 -->
    <div class="pagination-info">
      <span class="info-text">
        顯示第 <strong>{{ startIndex }}</strong> - <strong>{{ endIndex }}</strong> 筆，
        共 <strong>{{ totalItems }}</strong> 筆
      </span>
      <span class="page-indicator">
        (第 {{ currentPage }} / {{ totalPages }} 頁)
      </span>
    </div>

    <!-- 右側：分頁按鈕群 -->
    <div class="pagination-controls">
      <!-- 上一頁 -->
      <button
        type="button"
        class="btn-nav"
        :disabled="currentPage <= 1"
        @click="changePage(currentPage - 1)"
        title="上一頁"
        aria-label="Previous Page"
      >
        <ChevronLeft :size="16" />
        <span class="btn-text">上一頁</span>
      </button>

      <!-- 頁碼清單 -->
      <div class="page-numbers">
        <template v-for="(item, idx) in visiblePages" :key="idx">
          <span v-if="item === '...'" class="page-ellipsis">...</span>
          <button
            v-else
            type="button"
            class="btn-page"
            :class="{ active: item === currentPage }"
            @click="changePage(item)"
          >
            {{ item }}
          </button>
        </template>
      </div>

      <!-- 下一頁 -->
      <button
        type="button"
        class="btn-nav"
        :disabled="currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
        title="下一頁"
        aria-label="Next Page"
      >
        <span class="btn-text">下一頁</span>
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.common-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  background: var(--admin-th-bg, rgba(255, 255, 255, 0.02));
  border-top: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-top: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--admin-text-muted, #94a3b8);

  strong {
    color: var(--gold-primary, #d4af37);
    font-weight: 600;
  }

  .page-indicator {
    color: var(--admin-text-sub, rgba(255, 255, 255, 0.45));
    font-size: 0.8rem;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;

  .btn-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.65rem;
    font-size: 0.82rem;
    color: var(--admin-text-main, #f1f5f9);
    background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(212, 175, 55, 0.15);
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #f6e05e);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .btn-page {
    min-width: 32px;
    height: 32px;
    padding: 0 0.4rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: var(--admin-text-sub, #cbd5e1);
    background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--admin-border, transparent);
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(.active) {
      background: rgba(212, 175, 55, 0.12);
      border-color: var(--gold-primary, rgba(255, 255, 255, 0.15));
      color: var(--admin-text-main, #fff);
    }

    &.active {
      background: var(--gold-primary, #d4af37);
      color: #121415;
      font-weight: 700;
      border-color: var(--gold-primary, #d4af37);
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.35);
    }
  }

  .page-ellipsis {
    padding: 0 0.3rem;
    color: var(--admin-text-muted, #64748b);
    font-size: 0.85rem;
    user-select: none;
  }
}

@media (max-width: $bp-sm) {
  .common-pagination-bar {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .pagination-controls .btn-nav .btn-text {
    display: none;
  }
}
</style>

