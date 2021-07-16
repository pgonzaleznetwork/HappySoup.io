const path = require('path');

module.exports = {
    outputDir: path.resolve(__dirname,'../backend/server/public'),
    css: {
      loaderOptions: {
        sass: {
            additionalData: '@import "@/assets/custom.scss";'
        }
      }
    },
    devServer:{
      proxy:{
        '/api':{
          target:'http://localhost:3000'
        },
        '/oauth2':{
          target:'http://localhost:3000'
        },
      }
    }
  }