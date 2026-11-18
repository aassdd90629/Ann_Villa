<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ScrollText, 
  RefreshCw, 
  FileText, 
  Calendar, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-vue-next'
import AdminSyncLogsTab from '../../components/admin/logs/AdminSyncLogsTab.vue'
import AdminAuditLogsTab from '../../components/admin/logs/AdminAuditLogsTab.vue'

const route = useRoute()
const router = useRouter()

// 5 大頁籤定義
const tabs = [
  { id: 'sync', name: '房態同步 LOG', icon: RefreshCw, desc: 'Airbnb iCal 外部行事曆同步紀錄' },
  { id: 'booking', name: '訂單與金流 LOG', icon: FileText, desc: '直訂單建立、50% 定金入帳核銷、狀態異動' },
  { id: 'calendar', name: '關房與檔期 LOG', icon: Calendar, desc: '管家自主鎖房維護、解除關房開放' },
  { id: 'pricing', name: '房價政策 LOG', icon: DollarSign, desc: '平日三階梯改價、國定連假調整、政府行事曆匯入' },
  { id: 'security', name: '安全與登入 LOG', icon: ShieldCheck, desc: '後台管家登入與系統存取安全稽核' }
]

const currentTab = ref('sync')

// 依據 URL 參數初始化或同步 Tab
onMounted(() => {
  const queryTab = route.query.tab
  if (queryTab && tabs.some(t => t.id === queryTab)) {
    currentTab.value = queryTab
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab && tabs.some(t => t.id === newTab)) {
    currentTab.value = newTab
  }
})

const handleSwitchTab = (tabId) => {
  currentTab.value = tabId
  router.replace({ query: { ...route.query, tab: tabId } })
}

const activeTabInfo = computed(() => {
  return tabs.find(t => t.id === currentTab.value) || tabs[0]
})
</script>

<template>
  <div class="admin-logs-view">
    <!-- 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">系統操作與稽核 LOG 紀錄</h1>
        <p class="page-subtitle">全面追蹤房態同步、直訂單金流、關房檔期、房價政策與登入安全軌跡，操作即時留痕防竄改。</p>
      </div>
    </div>

    <!-- 頂部頁籤列 (Tabs) -->
    <div class="logs-nav-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        type="button"
        class="tab-btn"
        :class="{ active: currentTab === tab.id }"
        @click="handleSwitchTab(tab.id)"
      >
        <component :is="tab.icon" :size="16" class="tab-icon" />
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <!-- 頁籤描述提示 -->
    <div class="tab-description-card">
      <span class="desc-badge">當前視圖</span>
      <span class="desc-text">{{ activeTabInfo.desc }}</span>
    </div>

    <!-- 頁籤內容區塊 -->
    <div class="tab-content-area">
      <!-- 1. Airbnb 外部房態同步專用頁籤 -->
      <AdminSyncLogsTab v-if="currentTab === 'sync'" />

      <!-- 2. 通用業務審計日誌頁籤 (訂單、關房、房價、安全) -->
      <AdminAuditLogsTab v-else :category="currentTab" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-logs-view {
  padding-bottom: 3rem;
}

.admin-page-header {
  margin-bottom: 1.5rem;

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 0;
  }
}

.logs-nav-tabs {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.65rem;
  margin-bottom: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.03));

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

    .tab-icon {
      color: var(--gold-primary);
      transition: color 0.2s ease;
    }

    &:hover {
      background: rgba(200, 169, 110, 0.12);
      border-color: rgba(200, 169, 110, 0.4);
      color: var(--gold-primary);

      .tab-icon {
        color: var(--gold-primary);
      }
    }

    &.active {
      background: var(--gold-primary);
      color: #121614 !important;
      border-color: var(--gold-primary);
      box-shadow: 0 4px 12px rgba(200, 169, 110, 0.28);
      font-weight: 700;

      .tab-icon {
        color: #121614 !important;
      }
    }
  }
}

.tab-description-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--gold-primary);
  border-radius: 8px;
  font-size: 0.88rem;
  margin-bottom: 1.5rem;

  .desc-badge {
    background: rgba(200, 169, 110, 0.15);
    color: var(--gold-primary);
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .desc-text {
    color: var(--text-muted);
  }
}
</style>
