const path = require('path');

module.exports = {
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
        }
      }
    }
  }