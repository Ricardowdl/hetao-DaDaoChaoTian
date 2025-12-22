import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUndoStore } from './stores/useUndoStore'

import './styles/global.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia).use(router)

// 启动时加载撤销历史（原版行为）
useUndoStore(pinia).loadFromStorage()

app.mount('#app')
