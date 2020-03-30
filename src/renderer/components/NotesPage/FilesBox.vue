<template>
    <ul class="files__ul">
        <li class="files__li"
            v-on:click="openFile(file.path)"
            v-on:contextmenu="openContextmenu(folder.name, file.name, $event)"
            v-for="file in folder.files" v-bind:key="file.name"
            v-show="!file.isHidden || showHidden">

            <span class="files__span files__span--open">{{file.name}}</span>
        </li>
    </ul>
</template>

<style lang="scss">

</style>

<script>

import fs from 'fs'
import path from 'path'

import { shell, remote } from 'electron'
const { Menu, MenuItem } = remote

import dateFormat from 'dateformat'
import Dialogs from 'dialogs'

import FileHelper from '../../FileHelper.js'

export default {
    name: 'FilesBox',
    props: [ 'folder', 'showHidden' ],
    components: { },
    watch: { },
    data: function () {
        return {
            config: this.$store.state.config,
            logger: this.$root.$log
        }
    },
    mounted: function() { },
    methods: {

        openContextmenu: function (folderName, fileName, evt) {
            this.logger.debug(folderName, fileName)

            evt.preventDefault()

            const menu = new Menu()
            const fileHelper = new FileHelper(this)

            menu.append(new MenuItem({
                label: 'Rename Note',
                click: () => {
                    fileHelper.renameFileInFolder(folderName, fileName)
                }
            }))

            menu.append(new MenuItem({
                label: 'Delete Note',
                click: () => {
                    fileHelper.deleteFileInFolder(folderName, fileName)
                }
            }))

            menu.append(new MenuItem({
                label: 'Show in Finder',
                click: () => {
                    fileHelper.openExternal(folderName, fileName)
                }
            }))

            menu.popup({window: remote.getCurrentWindow()})
        },

        openFile: function (filePath) {
            this.logger.debug(filePath)

            if(! fs.lstatSync(filePath).isDirectory()) {

                if(path.basename(filePath).indexOf(this.config.taskFileName) > -1) {
                    this.$root.$emit('overview-clicked')
                }
                
                // TODO: highlight current file

                this.$root.$emit('file-clicked', filePath)
            }
        },

    }
}

</script>