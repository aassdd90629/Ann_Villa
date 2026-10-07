import { ref, onMounted } from 'vue'

const currentTheme = ref('light')

export function useTheme() {
  const initTheme = () => {
    const savedTheme = localStorage.getItem('villa_theme')
    if (savedTheme) {
      currentTheme.value = savedTheme
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme.value = 'dark'
    } else {
      currentTheme.value = 'light'
    }
    applyTheme()
  }

  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
    localStorage.setItem('villa_theme', currentTheme.value)
  }

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  return {
    theme: currentTheme,
    initTheme,
    toggleTheme
  }
}
