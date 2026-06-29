const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'splash', component: () => import('../pages/SplashPage.vue') },
      { path: 'menu', name: 'menu', component: () => import('../pages/MenuPage.vue') },
      { path: 'game', name: 'game', component: () => import('../pages/GamePage.vue') },
      { path: 'how-to-play', name: 'howToPlay', component: () => import('../pages/HowToPlayPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('../pages/SettingsPage.vue') },
      { path: 'result', name: 'result', component: () => import('../pages/ResultPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', redirect: '/' }
]

export default routes
