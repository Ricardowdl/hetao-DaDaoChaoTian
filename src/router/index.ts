import { createRouter, createWebHistory } from 'vue-router'

import ModeSelection from '../views/ModeSelection.vue'
import CharacterCreateView from '../views/CharacterCreateView.vue'
import CharacterListView from '../views/CharacterListView.vue'
import GameView from '../views/GameView.vue'
import LoginView from '../views/LoginView.vue'
import CharacterManagementView from '../views/CharacterManagementView.vue'
import PromptManagementView from '../views/PromptManagementView.vue'
import CharacterDetailView from '../views/CharacterDetailView.vue'
import WorldGenDebugView from '../views/WorldGenDebugView.vue'
import WorldGenErrorView from '../views/WorldGenErrorView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ModeSelection', component: ModeSelection },
    { path: '/creation', name: 'CharacterCreation', component: CharacterCreateView },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/management', name: 'CharacterManagement', component: CharacterManagementView },
    { path: '/prompts', name: 'PromptManagement', component: PromptManagementView },
    { path: '/world-gen-debug', name: 'WorldGenDebug', component: WorldGenDebugView },
    { path: '/world-gen-error', name: 'WorldGenError', component: WorldGenErrorView },
    { path: '/character', name: 'CharacterDetail', component: CharacterDetailView },
    { path: '/game', name: 'GameView', component: GameView },

    { path: '/character/create', redirect: { name: 'CharacterCreation' } },
    { path: '/character/list', redirect: { name: 'CharacterManagement' } },
    { path: '/save', name: 'LegacySaveView', component: CharacterListView }
  ]
})

export default router
