module.exports = {
  //  publicPath: './src/App.vue',

  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
          args[0].filename = './index.html';
                return args;
      })
  },

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true,
      enableBridge: false
    }
  }
}
