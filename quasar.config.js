const { configure } = require('quasar/wrappers')

module.exports = configure(function () {
  return {
    boot: [],
    css: ['app.css'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      vueRouterMode: 'hash'
    },
    devServer: {
      open: false
    },
    framework: {
      config: {
        brand: {
          primary: '#0f8f58',
          secondary: '#d73b36',
          accent: '#ffcc4d',
          dark: '#141414',
          positive: '#23a75c',
          negative: '#d73b36',
          info: '#1976d2',
          warning: '#f2c037'
        }
      },
      plugins: ['Dialog', 'Notify']
    },
    animations: ['bounceIn', 'fadeIn', 'fadeOut', 'shakeX', 'zoomIn'],
    capacitor: {
      hideSplashscreen: true
    }
  }
})
