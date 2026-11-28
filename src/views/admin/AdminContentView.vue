<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Building2, 
  HelpCircle, 
  Newspaper, 
  Compass,
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  X 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../composables/useAdminAuth'
import AdminBasicInfoTab from '../../components/admin/content/AdminBasicInfoTab.vue'
import AdminFaqTab from '../../components/admin/content/AdminFaqTab.vue'
import AdminNewsTab from '../../components/admin/content/AdminNewsTab.vue'
import AdminGuideTab from '../../components/admin/content/AdminGuideTab.vue'
import AdminFaqModal from '../../components/admin/content/AdminFaqModal.vue'
import AdminNewsModal from '../../components/admin/content/AdminNewsModal.vue'
import AdminGuideCategoryModal from '../../components/admin/content/AdminGuideCategoryModal.vue'
import AdminGuideModal from '../../components/admin/content/AdminGuideModal.vue'

const route = useRoute()
const { isViewer } = useAdminAuth()

const currentTab = ref('basic_info')
const isLoading = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('success')

const basicInfo = ref({})
const faqs = ref([])
const news = ref([])

// 周邊景點與膠囊分類
const guideCategories = ref([])
const guideItems = ref([])
const showGuideCategoryModal = ref(false)
const selectedGuideCategory = ref(null)
const showGuideModal = ref(false)
const selectedGuideItem = ref(null)

// FAQ / News Modals
const showFaqModal = ref(false)
const selectedFaq = ref(null)
const showNewsModal = ref(false)
const selectedNews = ref(null)

const tabs = [
  { id: 'basic_info', name: '基本營運與匯款帳號', icon: Building2 },
  { id: 'faq', name: '常見問答 (FAQ)', icon: HelpCircle },
  { id: 'news', name: '最新消息與活動', icon: Newspaper },
  { id: 'guide', name: '周邊景點與分類', icon: Compass }
]

const fetchAll = async () => {
  isLoading.value = true
  feedbackMessage.value = ''
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const headers = { 'Authorization': `Bearer ${token}` }
    const [resContent, resGuide] = await Promise.all([
      fetch('/api/admin/content', { headers }),
      fetch('/api/admin/guide', { headers })
    ])
    const dataContent = await resContent.json()
    if (resContent.ok && dataContent.success) {
      basicInfo.value = dataContent.basicInfo || {}
      faqs.value = dataContent.faqs || []
      news.value = dataContent.news || []
    }
    const dataGuide = await resGuide.json()
    if (resGuide.ok && dataGuide.success) {
      guideCategories.value = dataGuide.categories || []
      guideItems.value = dataGuide.items || []
    }
  } catch (err) {
    feedbackMessage.value = '讀取後台資料失敗，請重新整理頁面。'
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.query.tab && tabs.some(t => t.id === route.query.tab)) {
    currentTab.value = route.query.tab
  }
  fetchAll()
})

// FAQ 操作
const handleAddFaq = () => { selectedFaq.value = null; showFaqModal.value = true }
const handleEditFaq = (faq) => { selectedFaq.value = { ...faq }; showFaqModal.value = true }

// News 操作
const handleAddNews = () => { selectedNews.value = null; showNewsModal.value = true }
const handleEditNews = (item) => { selectedNews.value = { ...item }; showNewsModal.value = true }

// Guide 膠囊分類操作
const handleAddGuideCategory = () => { selectedGuideCategory.value = null; showGuideCategoryModal.value = true }
const handleEditGuideCategory = (cat) => { selectedGuideCategory.value = { ...cat }; showGuideCategoryModal.value = true }

const handleToggleGuideCategoryActive = async (cat) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限切換狀態。'); return }
  const nextActive = !cat.isActive
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/guide', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'toggle_active_category', id: cat.id, isActive: nextActive })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '更新狀態失敗')
    cat.isActive = nextActive
    feedbackMessage.value = `膠囊分類「${cat.nameZh}」已${nextActive ? '啟用' : '停用'}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleDeleteGuideCategory = async (cat) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限刪除。'); return }
  if (!confirm(`確定要刪除膠囊分類「${cat.nameZh}」嗎？`)) return
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/guide?target=category&id=${encodeURIComponent(cat.id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '刪除失敗')
    feedbackMessage.value = `已成功刪除膠囊分類「${cat.nameZh}」！`
    feedbackType.value = 'success'
    fetchAll()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

// Guide 推薦項目操作
const handleAddGuideItem = () => { selectedGuideItem.value = null; showGuideModal.value = true }
const handleEditGuideItem = (it) => { selectedGuideItem.value = { ...it }; showGuideModal.value = true }

const handleToggleGuideItemActive = async (it) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限切換狀態。'); return }
  const nextActive = !it.isActive
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/guide', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'toggle_active_item', id: it.id, isActive: nextActive })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '更新狀態失敗')
    it.isActive = nextActive
    feedbackMessage.value = `推薦項目「${it.nameZh}」已${nextActive ? '上架' : '下架'}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleDeleteGuideItem = async (it) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限刪除。'); return }
  if (!confirm(`確定要刪除「${it.nameZh}」嗎？`)) return
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/guide?target=item&id=${encodeURIComponent(it.id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '刪除失敗')
    feedbackMessage.value = `已成功刪除項目「${it.nameZh}」！`
    feedbackType.value = 'success'
    fetchAll()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

// FAQ & News 狀態切換與刪除
const handleToggleActive = async (item) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限切換狀態。'); return }
  const nextActive = !item.isActive
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'toggle_active', key: item.key, isActive: nextActive })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '更新狀態失敗')
    item.isActive = nextActive
    feedbackMessage.value = `「${item.qZh || item.titleZh}」已成功${nextActive ? '發布顯示' : '隱藏'}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleDeleteItem = async (item) => {
  if (isViewer.value) { alert('您的身分為唯讀人員，無權限刪除項目。'); return }
  const title = item.qZh || item.titleZh
  if (!confirm(`確定要刪除「${title}」嗎？此操作無法復原！`)) return
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/content?key=${encodeURIComponent(item.key)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '刪除失敗')
    feedbackMessage.value = `已成功刪除「${title}」！`
    feedbackType.value = 'success'
    fetchAll()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleModalSaved = () => {
  fetchAll()
  feedbackMessage.value = '內容已成功儲存並同步至前台官網！'
  feedbackType.value = 'success'
}
</script>

<template>
  <div class="admin-content-view">
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">全站文案與動態內容管理</h1>
        <p class="page-subtitle">自主維護收款銀行帳號、官方聯絡管道、常見問答 (FAQ)、最新消息與周邊導覽膠囊分類。</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-refresh" @click="fetchAll" :disabled="isLoading" title="重新整理">
          <RefreshCw :size="15" :class="{ spinning: isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <div v-if="feedbackMessage" :class="['alert-feedback', feedbackType]">
      <CheckCircle v-if="feedbackType === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ feedbackMessage }}</span>
      <button type="button" class="btn-dismiss" @click="feedbackMessage = ''"><X :size="14" /></button>
    </div>

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
        <span v-if="tab.id === 'news' && news.length > 0" class="tab-badge">{{ news.length }}</span>
        <span v-else-if="tab.id === 'faq' && faqs.length > 0" class="tab-badge">{{ faqs.length }}</span>
        <span v-else-if="tab.id === 'guide' && guideItems.length > 0" class="tab-badge">{{ guideItems.length }}</span>
      </button>
    </div>

    <div class="tab-content-wrapper">
      <AdminBasicInfoTab v-if="currentTab === 'basic_info'" :initial-data="basicInfo" @saved="handleModalSaved" />
      <AdminFaqTab v-else-if="currentTab === 'faq'" :faqs="faqs" :is-loading="isLoading" @add="handleAddFaq" @edit="handleEditFaq" @delete="handleDeleteItem" @toggle-active="handleToggleActive" />
      <AdminNewsTab v-else-if="currentTab === 'news'" :news="news" :is-loading="isLoading" @add="handleAddNews" @edit="handleEditNews" @delete="handleDeleteItem" @toggle-active="handleToggleActive" />
      <AdminGuideTab v-else-if="currentTab === 'guide'" :categories="guideCategories" :items="guideItems" :is-loading="isLoading" @add-category="handleAddGuideCategory" @edit-category="handleEditGuideCategory" @delete-category="handleDeleteGuideCategory" @toggle-category-active="handleToggleGuideCategoryActive" @add-item="handleAddGuideItem" @edit-item="handleEditGuideItem" @delete-item="handleDeleteGuideItem" @toggle-item-active="handleToggleGuideItemActive" />
    </div>

    <!-- 彈窗 -->
    <AdminFaqModal :show="showFaqModal" :faq="selectedFaq" @close="showFaqModal = false" @saved="handleModalSaved" />
    <AdminNewsModal :show="showNewsModal" :news-item="selectedNews" @close="showNewsModal = false" @saved="handleModalSaved" />
    <AdminGuideCategoryModal :show="showGuideCategoryModal" :category="selectedGuideCategory" @close="showGuideCategoryModal = false" @saved="handleModalSaved" />
    <AdminGuideModal :show="showGuideModal" :item="selectedGuideItem" :categories="guideCategories" @close="showGuideModal = false" @saved="handleModalSaved" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-content-view { padding-bottom: 3rem; }
.admin-page-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
  .page-title { font-size: 1.45rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); margin: 0 0 0.4rem 0; }
  .page-subtitle { font-size: 0.85rem; color: var(--admin-text-muted, #94a3b8); margin: 0; }
  .btn-refresh {
    display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.9rem;
    background: var(--admin-bg-card, #151f32); border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px; color: var(--admin-text-main, #e2e8f0); font-size: 0.82rem; cursor: pointer;
    &:hover:not(:disabled) { border-color: var(--gold-primary, #d4af37); color: var(--gold-primary, #d4af37); }
  }
}

.alert-feedback {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.25rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.85rem;
  &.success { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); color: #22c55e; }
  &.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #ef4444; }
  .btn-dismiss { margin-left: auto; background: transparent; border: none; color: inherit; cursor: pointer; display: flex; align-items: center; }
}

.content-nav-tabs {
  display: flex; gap: 0.6rem; margin-bottom: 1.5rem; padding: 0.4rem;
  background: var(--admin-bg-card, #151f32); border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25)); border-radius: 8px; overflow-x: auto;
  .tab-btn {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.15rem; border-radius: 6px;
    background: transparent; border: 1px solid transparent; color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;
    .tab-icon { color: var(--admin-text-muted, #94a3b8); }
    .tab-badge { padding: 0.1rem 0.45rem; border-radius: 10px; font-size: 0.72rem; background: rgba(255, 255, 255, 0.1); color: var(--admin-text-sub, #cbd5e1); }
    &:hover { color: var(--admin-text-main, #fff); background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05)); }
    &.active {
      background: rgba(212, 175, 55, 0.18); border-color: var(--gold-primary, #d4af37); color: var(--gold-primary, #d4af37); font-weight: 600;
      .tab-icon { color: var(--gold-primary, #d4af37); }
      .tab-badge { background: var(--gold-primary, #d4af37); color: #121415; font-weight: 700; }
    }
  }
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .admin-page-header { flex-direction: column; align-items: stretch; gap: 0.85rem; .page-title { font-size: 1.25rem; } .btn-refresh { justify-content: center; width: 100%; } }
  .content-nav-tabs { -webkit-overflow-scrolling: touch; padding: 0.35rem; .tab-btn { padding: 0.5rem 0.85rem; font-size: 0.8rem; } }
}
</style>
