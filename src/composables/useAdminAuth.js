import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const TOKEN_KEY = 'shanyu_admin_token'
const USER_KEY = 'shanyu_admin_user'

// 全域共用響應式狀態 (單例)
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
const isLoading = ref(false)
const errorMessage = ref('')

export function useAdminAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => {
    return Boolean(token.value && user.value)
  })

  // 登入
  const login = async (username, password) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '登入失敗，請檢查帳號密碼')
      }

      // 儲存 Token 與 User
      token.value = data.token
      user.value = data.user
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))

      return true
    } catch (err) {
      errorMessage.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    if (router) {
      router.push('/admin/login')
    }
  }

  // 驗證當前 Token 是否依然有效
  const verifyCurrentToken = async () => {
    if (!token.value) return false

    try {
      const res = await fetch('/api/admin/auth', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (res.status === 401) {
        logout()
        return false
      }

      const data = await res.json()
      if (data.success && data.user) {
        user.value = data.user
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isLoading,
    errorMessage,
    login,
    logout,
    verifyCurrentToken
  }
}
