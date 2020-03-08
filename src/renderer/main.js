import Vue from 'vue'
import VueLogger from 'vuejs-logger'
import axios from 'axios'
import 'core-js'

import App from './App'
import router from './router'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false


const isProduction = process.env.NODE_ENV === 'production';
 
const options = {
    isEnabled: true,
    logLevel : isProduction ? 'error' : 'debug',
    stringifyArguments : false,
    showLogLevel : true,
    showMethodName : true,
    separator: '|',
    showConsoleColors: true
};
 
Vue.use(VueLogger, options)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')


/* new Vue({
    store,
    render: h => h(App),
}).$mount('#app') */

