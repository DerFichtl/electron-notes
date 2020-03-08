import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'notes-page',
            component: require('@/components/NotesPage').default
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
})
