import Vue from 'vue'
import Vuex from 'vuex'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

import modules from './modules'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        config: { }
    },
    mutations: {
        setConfig (state, config) {
            state.config = config
        }
    },
    modules,
    plugins: [
        createPersistedState()
        // createSharedMutations()
    ],
    strict: process.env.NODE_ENV !== 'production'
})
