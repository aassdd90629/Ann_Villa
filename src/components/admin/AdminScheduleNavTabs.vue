<script setup>
import { useRoute } from 'vue-router'
import { Calendar, FileText, CalendarX } from 'lucide-vue-next'

const route = useRoute()

const tabs = [
  {
    path: '/admin/close-calendar',
    title: '房態月曆與自主關閉',
    desc: '雙月曆視覺化房態・單選多選自主關房',
    icon: Calendar
  },
  {
    path: '/admin/bookings',
    title: '直訂單與定金核銷',
    desc: '預約訂單審核・定金核銷・代客立單',
    icon: FileText
  },
  {
    path: '/admin/calendar',
    title: '檔期佔用與鎖房清單',
    desc: '全館佔用清單總覽・手動區間鎖房',
    icon: CalendarX
  }
]
</script>

<template>
  <nav class="schedule-nav-tabs" aria-label="房態與訂單管理動線導航">
    <router-link
      v-for="t in tabs"
      :key="t.path"
      :to="t.path"
      class="tab-link"
      :class="{ active: route.path === t.path }"
    >
      <component :is="t.icon" :size="16" class="tab-icon" />
      <div class="tab-text">
        <span class="tab-title">{{ t.title }}</span>
        <span class="tab-desc">{{ t.desc }}</span>
      </div>
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.schedule-nav-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.tab-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--admin-bg-card, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  text-decoration: none;
  color: var(--admin-text-sub, #94a3b8);
  transition: all 0.2s ease;

  .tab-icon {
    flex-shrink: 0;
    color: var(--admin-text-muted, #64748b);
    transition: color 0.2s;
  }

  .tab-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;

    .tab-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--admin-text-main, #f1f5f9);
    }

    .tab-desc {
      font-size: 0.74rem;
      color: var(--admin-text-muted, #94a3b8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &:hover {
    background: var(--admin-bg-base, rgba(255, 255, 255, 0.07));
    border-color: var(--gold-primary, #C5A880);
    .tab-icon { color: var(--gold-primary, #C5A880); }
  }

  &.active {
    background: rgba(197, 168, 128, 0.12);
    border-color: var(--gold-primary, #C5A880);
    box-shadow: 0 0 10px rgba(197, 168, 128, 0.12);

    .tab-icon {
      color: var(--gold-primary, #C5A880);
    }

    .tab-title {
      color: var(--gold-primary, #C5A880);
      font-weight: 700;
    }

    .tab-desc {
      color: var(--admin-text-main, #e2e8f0);
    }
  }
}
</style>
