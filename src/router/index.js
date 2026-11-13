import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RoomsView from '../views/RoomsView.vue'
import FacilitiesView from '../views/FacilitiesView.vue'
import PackagesView from '../views/PackagesView.vue'
import RulesView from '../views/RulesView.vue'
import GuideView from '../views/GuideView.vue'
import NewsView from '../views/NewsView.vue'

const routes = [
  // 前台公開路由
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首頁 ｜ 山語 Villa 豪宅山莊包棟別墅' }
  },
  {
    path: '/rooms',
    name: 'rooms',
    component: RoomsView,
    meta: { title: '房型導覽 ｜ 5 間獨立客房 ｜ 山語 Villa' }
  },
  {
    path: '/facilities',
    name: 'facilities',
    component: FacilitiesView,
    meta: { title: '園區設施 ｜ 麻將・KTV・烤肉・智能廚房・泡茶 ｜ 山語 Villa' }
  },
  {
    path: '/packages',
    name: 'packages',
    component: PackagesView,
    meta: { title: '包棟方案與加值服務 ｜ 山語 Villa' }
  },
  {
    path: '/rules',
    name: 'rules',
    component: RulesView,
    meta: { title: '入住須知與 FAQ ｜ 山語 Villa' }
  },
  {
    path: '/guide',
    name: 'guide',
    component: GuideView,
    meta: { title: '交通指引與周邊景點 ｜ 山語 Villa' }
  },
  {
    path: '/news',
    name: 'news',
    component: NewsView,
    meta: { title: '最新消息與優惠 ｜ 山語 Villa' }
  },

  // 後台專屬獨立路由 (前台零連結，需輸入網址進入)
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/AdminLoginView.vue'),
    meta: { title: '管家登入 ｜ 山語 Villa' }
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/calendar'
      },
      {
        path: 'calendar',
        name: 'admin-calendar',
        component: () => import('../views/admin/AdminCalendarView.vue'),
        meta: { title: '房態日曆與即時鎖房 ｜ 山語 Villa 後台', requiresAuth: true }
      },
      {
        path: 'bookings',
        name: 'admin-bookings',
        component: () => import('../views/admin/AdminBookingsView.vue'),
        meta: { title: '直訂單管理與定金核銷 ｜ 山語 Villa 後台', requiresAuth: true }
      },
      {
        path: 'sync',
        name: 'admin-sync',
        component: () => import('../views/admin/AdminSyncLogsView.vue'),
        meta: { title: 'Airbnb 同步歷史 ｜ 山語 Villa 後台', requiresAuth: true }
      }
    ]
  },

  // 萬用未匹配路由跳轉回首頁
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 全域導航守衛 (Route Guard)：未登入者阻擋進入 /admin
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('shanyu_admin_token')

  // 若前往需身分驗證之後台頁面
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      // 未登入，重定向至登入頁並記錄原欲前往路徑
      return next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      })
    }
  }

  // 若已登入卻嘗試前往 /admin/login，自動轉導至後台控制台
  if (to.path === '/admin/login' && token) {
    return next({ path: '/admin' })
  }

  next()
})

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
