import { createApp } from 'vue'
import { Quasar, Dialog, Notify } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './css/app.css'

import App from './App.vue'
import router from './router'

createApp(App)
  .use(Quasar, {
    plugins: { Dialog, Notify },
    config: {
      brand: {
        primary: '#0f8f58',
        secondary: '#d73b36',
        accent: '#ffcc4d'
      }
    }
  })
  .use(router)
  .mount('#q-app')
