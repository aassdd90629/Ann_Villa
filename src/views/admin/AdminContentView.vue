<script setup>
import { ref, onMounted } from 'vue'
import { 
  Building2, 
  HelpCircle, 
  Newspaper, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  X 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../composables/useAdminAuth'
import AdminBasicInfoTab from '../../components/admin/content/AdminBasicInfoTab.vue'
import AdminFaqTab from '../../components/admin/content/AdminFaqTab.vue'
import AdminNewsTab from '../../components/admin/content/AdminNewsTab.vue'
import AdminFaqModal from '../../components/admin/content/AdminFaqModal.vue'
import AdminNewsModal from '../../components/admin/content/AdminNewsModal.vue'

const { isViewer } = useAdminAuth()

const currentTab = ref('basic_info')
const isLoading = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('success')

const basicInfo = ref({})
const faqs = ref([])
const news = ref([])

// FAQ Modal
const showFaqModal = ref(false)
const selectedFaq = ref(null)

// News Modal
const showNewsModal = ref(false)
const selectedNews = ref(null)

const tabs = [
  { id: 'basic_info', name: '基本營運與匯款帳號', icon: Building2 },
  { id: 'faq', name: '常見問答 (FAQ)', icon: HelpCircle },
  { id: 'news', name: '最新消息與活動', icon: Newspaper }
]

const fetchAdminContent = async () => {
  isLoading.value = true
  feedbackMessage.value = ''
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/content', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '讀取全站內容失敗')
    }
    basicInfo.value = data.basicInfo || {}
    faqs.value = data.faqs || []
    news.value = data.news || []
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAdminContent()
})

// FAQ 操作
const handleAddFaq = () => {
  selectedFaq.value = null
  showFaqModal.value = true
}

const handleEditFaq = (faq) => {
  selectedFaq.value = { ...faq }
  showFaqModal.value = true
}

// News 操作
const handleAddNews = () => {
  selectedNews.value = null
  showNewsModal.value = true
}

const handleEditNews = (item) => {
  selectedNews.value = { ...item }
  showNewsModal.value = true
}

// 狀態切換 (發布/隱藏)
const handleToggleActive = async (item) => {
  if (isViewer.value) {
    alert('您的身分為唯讀人員，無權限切換狀態。')
    return
  }

  const nextActive = !item.isActive
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'toggle_active',
        key: item.key,
        isActive: nextActive
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '更新狀態失敗')
    }

    item.isActive = nextActive
    feedbackMessage.value = `「${item.qZh || item.titleZh}」已成功${nextActive ? '發布顯示' : '隱藏'}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

// 刪除項目
const handleDeleteItem = async (item) => {
  if (isViewer.value) {
    alert('您的身分為唯讀人員，無權限刪除項目。')
    return
  }

  const title = item.qZh || item.titleZh
  if (!confirm(`確定要刪除「${title}」嗎？此操作無法復原！`)) {
    return
  }

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/content?key=${encodeURIComponent(item.key)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '刪除失敗')
    }

    feedbackMessage.value = `已成功刪除「${title}」！`
    feedbackType.value = 'success'
    fetchAdminContent()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleModalSaved = () => {
  fetchAdminContent()
  feedbackMessage.value = '內容已成功儲存並同步至前台官網！'
  feedbackType.value = 'success'
}
</script>

<template>
  <div class="admin-content-view">
    <!-- 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">全站文案與動態內容管理</h1>
        <p class="page-subtitle">自主維護收款銀行帳號、官方聯絡管道、常見問答 (FAQ) 與最新消息公告，秒級同步至前台官網。</p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn-refresh" @click="fetchAdminContent" :disabled="isLoading" title="重新整理">
          <RefreshCw :size="15" :class="{ spinning: isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 訊息提示 -->
    <div v-if="feedbackMessage" :class="['alert-feedback', feedbackType]">
      <CheckCircle v-if="feedbackType === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ feedbackMessage }}</span>
      <button type="button" class="btn-dismiss" @click="feedbackMessage = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- 頂部頁籤列 -->
    <div class="content-nav-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        type="button" 
        class="tab-btn" 
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        <component :is="tab.icon" :size="16" class="tab-icon" />
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <!-- 頁籤內容展示區 -->
    <div class="tab-content-wrapper">
      <!-- 1. 基本營運資訊與匯款帳號 -->
      <AdminBasicInfoTab 
        v-if="currentTab === 'basic_info'" 
        :initial-data="basicInfo" 
        @saved="handleModalSaved" 
      />

      <!-- 2. 常見問答 (FAQ) -->
      <AdminFaqTab 
        v-else-if="currentTab === 'faq'" 
        :faqs="faqs" 
        :is-loading="isLoading" 
        @add="handleAddFaq" 
        @edit="handleEditFaq" 
        @delete="handleDeleteItem" 
        @toggle-active="handleToggleActive" 
      />

      <!-- 3. 最新消息與公告 (News) -->
      <AdminNewsTab 
        v-else-if="currentTab === 'news'" 
        :news="news" 
        :is-loading="isLoading" 
        @add="handleAddNews" 
        @edit="handleEditNews" 
        @delete="handleDeleteItem" 
        @toggle-active="handleToggleActive" 
      />
    </div>

    <!-- 彈窗 1：FAQ 新增/編輯 -->
    <AdminFaqModal 
      :show="showFaqModal" 
      :faq="selectedFaq" 
      @close="showFaqModal = false" 
      @saved="handleModalSaved" 
    />

    <!-- 彈窗 2：News 新增/編輯 -->
    <AdminNewsModal 
      :show="showNewsModal" 
      :news-item="selectedNews" 
      @close="showNewsModal = false" 
      @saved="handleModalSaved" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-content-view {
  padding-bottom: 3rem;
}

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  .page-title {
    font-size: 1.45rem;
    font-weight: 600;
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.4rem 0;
  }

  .page-subtitle {
    font-size: 0.85rem;
    color: var(--admin-text-muted, #94a3b8);
    margin: 0;
  }

  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    background: var(--admin-bg-card, #151f32);
    border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #e2e8f0);
    font-size: 0.82rem;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
    }
  }
}

.alert-feedback {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;

  &.success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.35);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
  }

  .btn-dismiss {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
}

.content-nav-tabs {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  padding: 0.4rem;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  overflow-x: auto;

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.15rem;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    .tab-icon { color: var(--admin-text-muted, #94a3b8); }

    &:hover {
      color: var(--admin-text-main, #fff);
      background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05));
    }

    &.active {
      background: rgba(212, 175, 55, 0.18);
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
      font-weight: 600;

      .tab-icon { color: var(--gold-primary, #d4af37); }
    }
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;

    .page-title {
      font-size: 1.25rem;
    }

    .btn-refresh {
      justify-content: center;
      width: 100%;
    }
  }

  .content-nav-tabs {
    -webkit-overflow-scrolling: touch;
    padding: 0.35rem;

    .tab-btn {
      padding: 0.5rem 0.85rem;
      font-size: 0.8rem;
    }
  }
}
</style>
