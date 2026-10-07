import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RoomsView from '../views/RoomsView.vue'
import FacilitiesView from '../views/FacilitiesView.vue'
import PackagesView from '../views/PackagesView.vue'
import RulesView from '../views/RulesView.vue'
import GuideView from '../views/GuideView.vue'
import NewsView from '../views/NewsView.vue'

const routes = [
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
    meta: { title: '房型導覽 ｜ 4 間獨立景觀套房 ｜ 山語 Villa' }
  },
  {
    path: '/facilities',
    name: 'facilities',
    component: FacilitiesView,
    meta: { title: '園區設施 ｜ 泳池・湯屋・劇院 ｜ 山語 Villa' }
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

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
